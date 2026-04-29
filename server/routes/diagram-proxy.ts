/**
 * diagram-proxy.ts
 * Server-side proxy for educational diagram images.
 * All diagrams now come from the admin diagram library (DB) or local /diagrams/ paths.
 * External proxying is retained only for any image_url values stored in the DB
 * that point to trusted CDN sources (e.g. S3, Cloudinary, OpenStax).
 *
 * Includes in-memory caching (up to 200 images, 24h TTL).
 */

import { Router, Request, Response } from "express";

const router = Router();

// ── In-memory image cache ─────────────────────────────────────────────────────
interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  cachedAt: number;
}

const imageCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 200;

function pruneCache() {
  if (imageCache.size <= MAX_CACHE_SIZE) return;
  // Remove oldest entries
  const entries = [...imageCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt);
  const toRemove = entries.slice(0, imageCache.size - MAX_CACHE_SIZE);
  for (const [key] of toRemove) imageCache.delete(key);
}

// Allowed domains — only trusted CDN/storage sources used by the admin diagram library.
// Wikimedia is NOT included; all diagrams must come from the admin library or local paths.
const ALLOWED_DOMAINS = [
  "openstax.org",
  "cdn.kastatic.org",
  "khanacademy.org",
  "s3-us-west-2.amazonaws.com",
  "s3.amazonaws.com",
  "res.cloudinary.com",
  "storage.googleapis.com",
  "adaptly.co.uk",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain => parsed.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * GET /api/diagram-proxy?url=<encoded_image_url>
 * Proxies an educational image from a trusted CDN source with in-memory caching.
 */
router.get("/", async (req: Request, res: Response) => {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    return res.status(400).json({ error: "Invalid url encoding" });
  }

  if (!isAllowedUrl(decodedUrl)) {
    return res.status(403).json({ error: "URL not from an allowed domain" });
  }

  // ── Check cache first ─────────────────────────────────────────────────────
  const cached = imageCache.get(decodedUrl);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("X-Cache", "HIT");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(cached.buffer);
  }

  // ── Fetch from upstream ───────────────────────────────────────────────────
  try {
    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "Adaptly-Educational-Platform/1.0 (https://adaptly.co.uk; educational use)",
        "Accept": "image/webp,image/png,image/svg+xml,image/*,*/*",
        "Referer": "https://adaptly.co.uk",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[diagram-proxy] Upstream ${response.status} for ${decodedUrl}`);
      return res.status(response.status)
        .set("X-Diagram-Error", `upstream-${response.status}`)
        .json({ error: `Upstream returned ${response.status}` });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Store in cache ──────────────────────────────────────────────────────
    imageCache.set(decodedUrl, { buffer, contentType, cachedAt: Date.now() });
    pruneCache();

    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Cache", "MISS");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(buffer);
  } catch (err: any) {
    console.error("[diagram-proxy] Error fetching image:", err?.message);
    return res.status(502).json({ error: "Failed to fetch image" });
  }
});

export default router;
