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
import { hasCloudflareAI, clipImageQueryScore } from "../lib/cloudflare-ai.js";

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
  /** Provider-supplied descriptive text (Pexels alt / Unsplash
   *  alt_description + description + tags). Used ONLY to score relevance
   *  so we return the best-matching photo, not just the most popular one. */
  description?: string;
  /** Relevance score (0+) assigned by scoreImageRelevance. Higher = better
   *  match to the query/concept. Surfaced so the client can show confidence
   *  and so low-confidence matches can be suppressed. */
  relevance?: number;
  /** V6 — CLIP zero-shot relevance (0..1) from Cloudflare Workers AI, when the
   *  re-ranker is enabled. Higher = the photo visually matches the query. */
  clipScore?: number;
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
    description: typeof p?.alt === "string" ? p.alt : undefined,
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
    const tagText = Array.isArray(p?.tags)
      ? p.tags.map((t: any) => (typeof t?.title === "string" ? t.title : "")).filter(Boolean).join(" ")
      : "";
    const description = [p?.alt_description, p?.description, tagText]
      .filter((s: any) => typeof s === "string" && s.trim().length > 0)
      .join(" ") || undefined;
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
      description,
    };
  }).filter((img: ResolvedImage) => Boolean(img.url));
}

// ── Relevance scoring ────────────────────────────────────────────────────────
// The core fix for "random / half-matching" photos. Stock APIs rank by
// popularity/aesthetics, NOT by how well a photo matches THIS slide. We fetch
// a wider candidate pool, then re-rank by lexical overlap between the search
// terms (+ the slide's concept/title) and each photo's provider-supplied
// description/tags. Zero extra API cost, no new infra, fully free.
const REL_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "for", "to", "with", "at",
  "by", "is", "are", "this", "that", "into", "from", "as", "it", "its", "be",
  "your", "you", "our", "their", "his", "her", "they", "we", "i", "about",
  "what", "how", "why", "when", "where", "which", "lesson", "slide", "ks", "year",
]);

function relTokenize(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !REL_STOPWORDS.has(w));
}

/**
 * Score one image against the query tokens (weighted ×2) and the optional
 * concept tokens (weighted ×1). Landscape images get a small bonus because
 * slides are wide. Returns 0+ — higher means a better match. An image with
 * no usable description gets a small non-zero floor so it can still be used
 * as a fallback when nothing scores, preserving today's behaviour.
 */
function scoreImageRelevance(
  img: ResolvedImage,
  queryTokens: string[],
  conceptTokens: string[],
): number {
  const hay = new Set(relTokenize(img.description));
  if (hay.size === 0) return 0.1; // no metadata → low floor, never negative
  let score = 0;
  for (const t of new Set(queryTokens)) if (hay.has(t)) score += 2;
  for (const t of new Set(conceptTokens)) if (hay.has(t)) score += 1;
  if (img.width && img.height && img.width >= img.height) score += 0.25; // prefer landscape
  return score;
}

/**
 * Re-rank a candidate pool by relevance and return the top `limit`.
 * Stable: equal scores keep the provider's original (popularity) order, so
 * when scoring can't separate candidates we fall back to today's behaviour.
 */
function rankByRelevance(
  candidates: ResolvedImage[],
  q: string,
  concept: string,
  limit: number,
): ResolvedImage[] {
  const queryTokens = relTokenize(q);
  const conceptTokens = relTokenize(concept);
  return candidates
    .map((img, i) => ({
      img: { ...img, relevance: scoreImageRelevance(img, queryTokens, conceptTokens) },
      i,
    }))
    .sort((a, b) => (b.img.relevance! - a.img.relevance!) || (a.i - b.i))
    .slice(0, limit)
    .map((x) => x.img);
}

// ── V6: server-side CLIP re-ranking (free, Cloudflare Workers AI) ────────────
// The lexical re-rank above only knows the provider's text metadata. CLIP looks
// at the PIXELS, so it catches cases where the caption is misleading or absent
// ("half-matching"). We layer it ON TOP of the lexical score rather than
// replacing it: lexical is free + instant and a good prior; CLIP sharpens the
// final order. Runs server-side (SEND devices are low-spec) and only on the top
// lexical candidates to bound free-tier "neuron" usage. Degrades to lexical-only
// whenever Cloudflare is not configured or a call fails.
const CLIP_CANDIDATE_POOL = 8;   // only CLIP-score the top-N lexical candidates
const CLIP_CONCURRENCY = 3;
const CLIP_WEIGHT = 0.6;         // CLIP dominates; lexical is the tie-breaking prior
const LEX_WEIGHT = 0.4;

function clipRerankEnabled(): boolean {
  return hasCloudflareAI() && process.env.IMAGE_CLIP_RERANK !== "off";
}

/** Fetch a (small) image's bytes server-side for CLIP. Null on failure. */
async function fetchImageBytes(url?: string): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Adaptly-SEND-Platform/1.0 (clip rerank)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    return new Uint8Array(await r.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Re-rank a lexically-ordered candidate list with CLIP. Returns the top
 * `limit` images (CLIP scores attached), or null to signal "fall back to the
 * lexical order" (CF disabled, every CLIP call failed, etc.).
 */
async function clipReRank(
  lexRanked: ResolvedImage[],
  queryText: string,
  limit: number,
): Promise<ResolvedImage[] | null> {
  if (lexRanked.length === 0 || !queryText.trim()) return null;
  const head = lexRanked.slice(0, Math.min(lexRanked.length, CLIP_CANDIDATE_POOL));
  const tail = lexRanked.slice(head.length);

  // Score head with bounded concurrency.
  const scores = new Array<number | null>(head.length).fill(null);
  let cursor = 0;
  async function worker() {
    while (cursor < head.length) {
      const idx = cursor++;
      const bytes = await fetchImageBytes(head[idx].thumbUrl || head[idx].url);
      if (!bytes) continue;
      scores[idx] = await clipImageQueryScore(bytes, queryText);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CLIP_CONCURRENCY, head.length) }, () => worker()),
  );

  if (!scores.some((s) => s != null)) return null; // CLIP gave us nothing usable

  // Normalise lexical relevance across the head to 0..1 so it blends with CLIP.
  const lexVals = head.map((img) => img.relevance ?? 0);
  const lexMax = Math.max(1e-6, ...lexVals);
  const blended = head.map((img, i) => {
    const lexNorm = (img.relevance ?? 0) / lexMax;
    const clip = scores[i];
    const score = clip == null
      ? lexNorm // no CLIP signal → rank by lexical alone
      : LEX_WEIGHT * lexNorm + CLIP_WEIGHT * clip;
    return { img: { ...img, clipScore: clip ?? undefined }, score, i };
  });
  blended.sort((a, b) => (b.score - a.score) || (a.i - b.i)); // stable on ties

  return [...blended.map((b) => b.img), ...tail].slice(0, limit);
}

// ── GET /api/image-proxy/search ─────────────────────────────────────────────
router.get("/search", requireAuth, async (req: Request, res: Response) => {
  const q = String(req.query.q || "").trim().slice(0, 200);
  // Optional concept/title (e.g. the slide title) — extra relevance signal so
  // a keyword like "cycle" is disambiguated by a concept like "water cycle".
  const concept = String(req.query.concept || "").trim().slice(0, 200);
  const sourceParam = String(req.query.source || "auto").toLowerCase();
  const perPageParam = parseInt(String(req.query.perPage || "6"), 10);
  const perPage = Math.min(Math.max(isNaN(perPageParam) ? 6 : perPageParam, 1), 12);

  if (!q) return res.status(400).json({ error: "missing_q" });

  // Always fetch a wider candidate pool than requested so the relevance
  // re-ranker has something to choose from — even when the caller asks for
  // perPage=1 (the deck resolver does), we pull ~12 and return the BEST one.
  const candidateCount = Math.min(Math.max(perPage, 12), 15);

  const cacheKey = `${sourceParam}:${perPage}:${q.toLowerCase()}|${concept.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < SEARCH_TTL_MS) {
    res.setHeader("X-Cache", "HIT");
    return res.json({
      results: cached.results,
      cached: true,
      relevanceRanked: true,
      clipRanked: cached.results.some((r) => typeof r.clipScore === "number"),
    });
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
    let pool: ResolvedImage[] = [];
    if (sourceParam === "pexels") {
      pool = await searchPexels(q, candidateCount);
    } else if (sourceParam === "unsplash") {
      pool = await searchUnsplash(q, candidateCount);
    } else {
      // Auto: query both in parallel and combine into one candidate pool.
      // Relevance ranking (not interleaving) then decides the final order, so
      // the best-matching photo wins regardless of which provider it came from.
      const [px, us] = await Promise.all([
        hasPexels ? searchPexels(q, candidateCount).catch(() => []) : Promise.resolve([]),
        hasUnsplash ? searchUnsplash(q, candidateCount).catch(() => []) : Promise.resolve([]),
      ]);
      pool = [...px, ...us];
    }

    // Re-rank the whole pool by relevance to (query + concept).
    const lexRanked = rankByRelevance(pool, q, concept, pool.length);
    let results = lexRanked.slice(0, perPage);
    let clipRanked = false;

    // V6 — sharpen the top results with CLIP (free, server-side) when enabled.
    // Layered on top of the lexical prior; falls back to lexical on any failure.
    if (clipRerankEnabled()) {
      try {
        const reranked = await clipReRank(
          lexRanked,
          `${q} ${concept}`.trim(),
          perPage,
        );
        if (reranked && reranked.length > 0) {
          results = reranked;
          clipRanked = results.some((r) => typeof r.clipScore === "number");
        }
      } catch (e: any) {
        console.warn("[image-proxy] CLIP rerank failed, using lexical:", e?.message);
      }
    }

    searchCache.set(cacheKey, { results, cachedAt: Date.now() });
    pruneSearchCache();
    res.setHeader("X-Cache", "MISS");
    res.json({ results, cached: false, relevanceRanked: true, clipRanked });
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
