/**
 * image-proxy.ts
 *
 * Server-side proxy for stock-photo searches used by the Presentation Maker.
 *
 * Why this exists (presentation-maker-overhaul items 9, 10, 52):
 *   - Generation must yield slides that carry a *resolved* image URL plus
 *     attribution / licence, not a placeholder query string. The previous
 *     `source.unsplash.com/featured/?prompt` shortcut was deprecated by
 *     Unsplash and made every PPTX/PDF export silently fall back to a
 *     coloured rectangle.
 *   - The licence must travel WITH the slide JSON so library save, email
 *     digest and PPTX export all preserve attribution. Doing the lookup
 *     server-side keeps API keys off the client and lets us cache responses
 *     across users.
 *   - The PPTX painter needs the raw image bytes (it embeds via
 *     `addImage`). Client-side `fetch(remoteUrl)` is blocked by CORS for
 *     most CDN responses, so we expose a `/fetch` endpoint that returns
 *     the bytes as a data: URL the client can hand straight to pptxgenjs.
 *
 * Endpoints:
 *   - GET /api/image-proxy/search?q=<keyword>&source=pexels|unsplash
 *       Returns up to N candidate images with attribution + licence.
 *   - GET /api/image-proxy/fetch?url=<encoded_url>
 *       Streams the raw image bytes (PNG/JPEG/WebP) with `Cache-Control`
 *       and a `data:` URL endpoint variant for `addImage`.
 *
 * Caching:
 *   - Search results cached by `(source, q)` for 24h in-memory.
 *   - Image bytes cached by URL for 24h, capped at 200 entries.
 *
 * Credentials:
 *   - `PEXELS_API_KEY` and `UNSPLASH_ACCESS_KEY` env vars. If a key is
 *     missing the route returns an empty result with `degraded: true` so
 *     the client can fall back to the existing search-page suggestions.
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ── Cache ───────────────────────────────────────────────────────────────────
interface ResolvedImage {
  url: string;
  /** Smaller variant (~800px wide) — preferred for slide previews + PPTX
   *  embedding so we don't ship 4MP photos around. */
  thumbUrl?: string;
  width?: number;
  height?: number;
  source: "pexels" | "unsplash";
  photographer?: string;
  photographerUrl?: string;
  attribution: string;
  licence: string;
  /** Provider's canonical landing page so teachers can verify the image. */
  sourceUrl?: string;
}

interface SearchCacheEntry {
  results: ResolvedImage[];
  cachedAt: number;
}

interface BytesCacheEntry {
  buffer: Buffer;
  contentType: string;
  cachedAt: number;
}

const SEARCH_TTL_MS = 24 * 60 * 60 * 1000;   // 24h
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

// ── Source whitelist for /fetch ─────────────────────────────────────────────
// We only fetch from CDN hosts whose URLs we previously returned via /search.
// Anything else is rejected so the proxy can't be used as an open relay.
const ALLOWED_FETCH_HOSTS = [
  "images.pexels.com",
  "images.unsplash.com",
  "plus.unsplash.com",
];

function isAllowedFetchUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return ALLOWED_FETCH_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

// ── Pexels adapter ──────────────────────────────────────────────────────────
async function searchPexels(q: string, perPage: number): Promise<ResolvedImage[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${perPage}&orientation=landscape`;
  const r = await fetch(url, {
    headers: { Authorization: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) {
    console.warn(`[image-proxy] Pexels ${r.status} for "${q}"`);
    return [];
  }
  const json = (await r.json()) as any;
  const photos = Array.isArray(json?.photos) ? json.photos : [];
  return photos.map((p: any): ResolvedImage => ({
    url: p?.src?.large || p?.src?.original || p?.src?.medium,
    thumbUrl: p?.src?.medium || p?.src?.small || p?.src?.large,
    width: typeof p?.width === "number" ? p.width : undefined,
    height: typeof p?.height === "number" ? p.height : undefined,
    source: "pexels",
    photographer: typeof p?.photographer === "string" ? p.photographer : undefined,
    photographerUrl: typeof p?.photographer_url === "string" ? p.photographer_url : undefined,
    sourceUrl: typeof p?.url === "string" ? p.url : undefined,
    attribution: p?.photographer
      ? `Photo by ${p.photographer} on Pexels`
      : "Photo from Pexels",
    licence: "Pexels Licence — free for commercial and non-commercial use, attribution appreciated",
  })).filter((img: ResolvedImage) => Boolean(img.url));
}

// ── Unsplash adapter ────────────────────────────────────────────────────────
async function searchUnsplash(q: string, perPage: number): Promise<ResolvedImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=${perPage}&orientation=landscape`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${key}`,
      "Accept-Version": "v1",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) {
    console.warn(`[image-proxy] Unsplash ${r.status} for "${q}"`);
    return [];
  }
  const json = (await r.json()) as any;
  const photos = Array.isArray(json?.results) ? json.results : [];
  return photos.map((p: any): ResolvedImage => {
    const photographer = p?.user?.name || p?.user?.username;
    const photographerUrl = p?.user?.links?.html;
    return {
      url: p?.urls?.regular || p?.urls?.full,
      thumbUrl: p?.urls?.small || p?.urls?.thumb || p?.urls?.regular,
      width: typeof p?.width === "number" ? p.width : undefined,
      height: typeof p?.height === "number" ? p.height : undefined,
      source: "unsplash",
      photographer,
      photographerUrl,
      sourceUrl: p?.links?.html,
      attribution: photographer
        ? `Photo by ${photographer} on Unsplash`
        : "Photo from Unsplash",
      licence: "Unsplash Licence — free to use, no attribution required (credit appreciated)",
    };
  }).filter((img: ResolvedImage) => Boolean(img.url));
}

// ── GET /api/image-proxy/search ─────────────────────────────────────────────
router.get("/search", requireAuth, async (req: Request, res: Response) => {
  const q = String(req.query.q || "").trim().slice(0, 200);
  const sourceParam = String(req.query.source || "auto").toLowerCase();
  const perPageParam = parseInt(String(req.query.perPage || "6"), 10);
  const perPage = Math.min(Math.max(isNaN(perPageParam) ? 6 : perPageParam, 1), 12);

  if (!q) return res.status(400).json({ error: "missing_q" });

  const cacheKey = `${sourceParam}:${perPage}:${q.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < SEARCH_TTL_MS) {
    res.setHeader("X-Cache", "HIT");
    return res.json({ results: cached.results, cached: true });
  }

  // Probe key presence so the client can disable the panel gracefully.
  const hasPexels = Boolean(process.env.PEXELS_API_KEY);
  const hasUnsplash = Boolean(process.env.UNSPLASH_ACCESS_KEY);
  if (!hasPexels && !hasUnsplash) {
    return res.json({
      results: [],
      cached: false,
      degraded: true,
      reason: "no_provider_keys",
    });
  }

  try {
    let results: ResolvedImage[] = [];
    if (sourceParam === "pexels") {
      results = await searchPexels(q, perPage);
    } else if (sourceParam === "unsplash") {
      results = await searchUnsplash(q, perPage);
    } else {
      // Auto: query both in parallel and interleave so the teacher always
      // sees a mix of sources for variety.
      const [px, us] = await Promise.all([
        hasPexels ? searchPexels(q, perPage).catch(() => []) : Promise.resolve([]),
        hasUnsplash ? searchUnsplash(q, perPage).catch(() => []) : Promise.resolve([]),
      ]);
      const interleaved: ResolvedImage[] = [];
      const max = Math.max(px.length, us.length);
      for (let i = 0; i < max && interleaved.length < perPage; i++) {
        if (i < px.length) interleaved.push(px[i]);
        if (i < us.length && interleaved.length < perPage) interleaved.push(us[i]);
      }
      results = interleaved;
    }

    searchCache.set(cacheKey, { results, cachedAt: Date.now() });
    pruneSearchCache();
    res.setHeader("X-Cache", "MISS");
    res.json({ results, cached: false });
  } catch (err: any) {
    console.error("[image-proxy] search error:", err?.message);
    res.status(502).json({ error: "search_failed" });
  }
});

// ── GET /api/image-proxy/fetch ──────────────────────────────────────────────
// Streams the bytes for a previously-resolved CDN URL. Used by the PPTX
// painter to embed images via `addImage({ data: 'data:...;base64,...' })`
// because direct cross-origin fetches from the browser are blocked.
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

  // Cache hit
  const cached = bytesCache.get(decoded);
  if (cached && Date.now() - cached.cachedAt < BYTES_TTL_MS) {
    return respondWithBytes(res, cached.buffer, cached.contentType, "HIT", wantBase64);
  }

  try {
    const upstream = await fetch(decoded, {
      headers: {
        "User-Agent": "Adaptly-Educational-Platform/1.0 (presentation maker)",
        Accept: "image/webp,image/png,image/jpeg,image/*,*/*",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `upstream_${upstream.status}` });
    }
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await upstream.arrayBuffer());

    bytesCache.set(decoded, { buffer, contentType, cachedAt: Date.now() });
    pruneBytesCache();

    return respondWithBytes(res, buffer, contentType, "MISS", wantBase64);
  } catch (err: any) {
    console.error("[image-proxy] fetch error:", err?.message);
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
    // JSON wrapper carrying a `data:` URL is the easiest thing for the
    // pptxgenjs `addImage({ data })` API to consume on the client.
    const safeType = contentType.split(";")[0].trim() || "image/jpeg";
    const dataUrl = `data:${safeType};base64,${buffer.toString("base64")}`;
    res.setHeader("Content-Type", "application/json");
    return res.json({ dataUrl, contentType: safeType, byteLength: buffer.length });
  }
  res.setHeader("Content-Type", contentType);
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.send(buffer);
}

export default router;
