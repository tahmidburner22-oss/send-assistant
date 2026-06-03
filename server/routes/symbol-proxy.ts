/**
 * symbol-proxy.ts
 *
 * Server-side proxy for AAC/SEND symbol searches, backed by ARASAAC
 * (https://arasaac.org) — a free, openly-licensed pictogram library
 * (Creative Commons BY-NC-SA, author Sergio Palao, property of the
 * Government of Aragón). No API key is required, which keeps the SEND
 * symbol support entirely free.
 *
 * Why this exists (SEND Elevation Plan, Part 11 — the symbol differentiator):
 *   - Symbol/AAC support is the platform's core SEND USP and CANNOT be met by
 *     stock photos or AI image generation. It needs a consistent, vetted
 *     pictogram set. ARASAAC is the de-facto open standard used across UK SEND
 *     settings.
 *   - Doing the lookup server-side keeps the integration uniform with the
 *     existing image-proxy, lets us cache responses across users, and attaches
 *     the licence/attribution to every result so it travels with the resource.
 *
 * Endpoints:
 *   - GET /api/symbol-proxy/search?q=<keyword>&lang=<iso>&limit=<n>
 *       Returns up to N pictograms with image URLs + attribution + licence.
 *   - GET /api/symbol-proxy/fetch?url=<encoded_url>&format=base64
 *       Streams the raw PNG bytes (or a data: URL) for embedding in
 *       PDF/PPTX exports, mirroring the image-proxy /fetch contract.
 *
 * Caching:
 *   - Search results cached by `(lang, limit, q)` for 24h in-memory.
 *   - Image bytes cached by URL for 24h, capped at 200 entries.
 *
 * Licensing note: ARASAAC pictograms are CC BY-NC-SA. Attribution travels with
 * every result so exports can render the required credit. Because the licence
 * is non-commercial + share-alike, surface this in the UI where appropriate.
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ── Types ─────────────────────────────────────────────────────────────────
interface ResolvedSymbol {
  /** ARASAAC pictogram id. */
  id: number;
  /** Best-matching keyword for this pictogram (for labelling/alt text). */
  keyword: string;
  /** PNG URL at the requested size (default 300px). */
  url: string;
  /** Smaller variant for previews/grids. */
  thumbUrl: string;
  source: "arasaac";
  attribution: string;
  licence: string;
  /** Canonical pictogram page so teachers can verify/adapt it. */
  sourceUrl: string;
}

interface SearchCacheEntry {
  results: ResolvedSymbol[];
  cachedAt: number;
}

interface BytesCacheEntry {
  buffer: Buffer;
  contentType: string;
  cachedAt: number;
}

const SEARCH_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const BYTES_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_SEARCH_ENTRIES = 500;
const MAX_BYTES_ENTRIES = 200;

const searchCache = new Map<string, SearchCacheEntry>();
const bytesCache = new Map<string, BytesCacheEntry>();

function pruneSearchCache() {
  if (searchCache.size <= MAX_SEARCH_ENTRIES) return;
  const entries = [...searchCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt);
  for (const [k] of entries.slice(0, searchCache.size - MAX_SEARCH_ENTRIES)) {
    searchCache.delete(k);
  }
}

function pruneBytesCache() {
  if (bytesCache.size <= MAX_BYTES_ENTRIES) return;
  const entries = [...bytesCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt);
  for (const [k] of entries.slice(0, bytesCache.size - MAX_BYTES_ENTRIES)) {
    bytesCache.delete(k);
  }
}

// ARASAAC supports many languages; we whitelist the common ones the platform
// is likely to use and default to English. Unknown values fall back to "en".
const SUPPORTED_LANGS = new Set([
  "en", "es", "fr", "de", "it", "pt", "nl", "pl", "ro", "ar", "ru", "zh", "cy",
]);

const ARASAAC_ATTRIBUTION =
  "Pictograms by ARASAAC (arasaac.org), author Sergio Palao, property of the Government of Aragón";
const ARASAAC_LICENCE = "CC BY-NC-SA 4.0 (non-commercial, share-alike, attribution required)";

function symbolImageUrl(id: number, size: number): string {
  // Static CDN pattern: /pictograms/{id}/{id}_{size}.png
  return `https://static.arasaac.org/pictograms/${id}/${id}_${size}.png`;
}

// ── ARASAAC search adapter ──────────────────────────────────────────────────
async function searchArasaac(q: string, lang: string, limit: number): Promise<ResolvedSymbol[]> {
  const url = `https://api.arasaac.org/v1/pictograms/${lang}/search/${encodeURIComponent(q)}`;
  const r = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Adaptly-SEND-Platform/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) {
    // 404 simply means "no pictograms for this term" — return empty, not an error.
    if (r.status !== 404) console.warn(`[symbol-proxy] ARASAAC ${r.status} for "${q}"`);
    return [];
  }
  const json = (await r.json()) as any;
  const items = Array.isArray(json) ? json : [];
  return items
    .map((p: any): ResolvedSymbol | null => {
      const id = typeof p?._id === "number" ? p._id : (typeof p?.id === "number" ? p.id : null);
      if (id == null) return null;
      // `keywords` is an array of { keyword, ... }; pick the first sensible one.
      let keyword = q;
      if (Array.isArray(p?.keywords) && p.keywords.length > 0) {
        const k = p.keywords[0]?.keyword;
        if (typeof k === "string" && k.trim()) keyword = k.trim();
      }
      return {
        id,
        keyword,
        // ARASAAC's static CDN only pre-generates the 300px and 500px PNG
        // variants — 100/150/200/250 now 404. Use 500 for the full image and
        // 300 for the thumbnail so pictograms actually load (previously 150px
        // thumbUrl 404'd everywhere it was used: boards, presentation + V5b).
        url: symbolImageUrl(id, 500),
        thumbUrl: symbolImageUrl(id, 300),
        source: "arasaac",
        attribution: ARASAAC_ATTRIBUTION,
        licence: ARASAAC_LICENCE,
        sourceUrl: `https://arasaac.org/pictograms/en/${id}/`,
      };
    })
    .filter((s: ResolvedSymbol | null): s is ResolvedSymbol => s !== null)
    .slice(0, limit);
}

// ── GET /api/symbol-proxy/search ────────────────────────────────────────────
router.get("/search", requireAuth, async (req: Request, res: Response) => {
  const q = String(req.query.q || "").trim().slice(0, 120);
  const langRaw = String(req.query.lang || "en").trim().toLowerCase();
  const lang = SUPPORTED_LANGS.has(langRaw) ? langRaw : "en";
  const limitParam = parseInt(String(req.query.limit || "12"), 10);
  const limit = Math.min(Math.max(isNaN(limitParam) ? 12 : limitParam, 1), 24);

  if (!q) return res.status(400).json({ error: "missing_q" });

  const cacheKey = `${lang}:${limit}:${q.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < SEARCH_TTL_MS) {
    res.setHeader("X-Cache", "HIT");
    return res.json({ results: cached.results, cached: true });
  }

  try {
    const results = await searchArasaac(q, lang, limit);
    searchCache.set(cacheKey, { results, cachedAt: Date.now() });
    pruneSearchCache();
    res.setHeader("X-Cache", "MISS");
    res.json({ results, cached: false });
  } catch (err: any) {
    console.error("[symbol-proxy] search error:", err?.message);
    res.status(502).json({ error: "search_failed" });
  }
});

// ── /fetch host whitelist ───────────────────────────────────────────────────
function isAllowedFetchUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return u.hostname === "static.arasaac.org";
  } catch {
    return false;
  }
}

// ── GET /api/symbol-proxy/fetch ─────────────────────────────────────────────
// Streams a pictogram's bytes (or a data: URL) so PDF/PPTX exports can embed
// the symbol directly. Mirrors the image-proxy /fetch contract.
router.get("/fetch", requireAuth, async (req: Request, res: Response) => {
  const raw = String(req.query.url || "");
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return res.status(400).json({ error: "invalid_url_encoding" });
  }
  if (!decoded || !isAllowedFetchUrl(decoded)) {
    return res.status(403).json({ error: "url_not_allowed" });
  }

  const wantBase64 = String(req.query.format || "").toLowerCase() === "base64";

  const cached = bytesCache.get(decoded);
  if (cached && Date.now() - cached.cachedAt < BYTES_TTL_MS) {
    return respondWithBytes(res, cached.buffer, cached.contentType, "HIT", wantBase64);
  }

  try {
    const upstream = await fetch(decoded, {
      headers: {
        "User-Agent": "Adaptly-SEND-Platform/1.0 (symbol support)",
        Accept: "image/png,image/*,*/*",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `upstream_${upstream.status}` });
    }
    const contentType = upstream.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await upstream.arrayBuffer());
    bytesCache.set(decoded, { buffer, contentType, cachedAt: Date.now() });
    pruneBytesCache();
    return respondWithBytes(res, buffer, contentType, "MISS", wantBase64);
  } catch (err: any) {
    console.error("[symbol-proxy] fetch error:", err?.message);
    return res.status(502).json({ error: "fetch_failed" });
  }
});

function respondWithBytes(
  res: Response,
  buffer: Buffer,
  contentType: string,
  cacheTag: "HIT" | "MISS",
  wantBase64: boolean,
) {
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("X-Cache", cacheTag);
  if (wantBase64) {
    const safeType = contentType.split(";")[0].trim() || "image/png";
    const dataUrl = `data:${safeType};base64,${buffer.toString("base64")}`;
    res.setHeader("Content-Type", "application/json");
    return res.json({ dataUrl, contentType: safeType, byteLength: buffer.length });
  }
  res.setHeader("Content-Type", contentType);
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.send(buffer);
}

export default router;
