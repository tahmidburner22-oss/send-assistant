/**
 * diagram-proxy.ts
 * Server-side proxy for educational diagram images.
 * Fetches images from Wikimedia Commons and other sources server-side
 * to avoid CORS/rate-limiting issues when loading in the browser.
 */

import { Router, Request, Response } from "express";

const router = Router();

// Allowed domains for security (only trusted educational sources)
const ALLOWED_DOMAINS = [
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "openstax.org",
  "cdn.kastatic.org",
  "khanacademy.org",
  "bbc.co.uk",
  "s3-us-west-2.amazonaws.com",
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
 * Proxies an educational image from a trusted source.
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

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "Adaptly-Educational-Platform/1.0 (https://adaptly.co.uk; educational use)",
        "Accept": "image/webp,image/png,image/svg+xml,image/*,*/*",
        "Referer": "https://adaptly.co.uk",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Upstream returned ${response.status}` 
      });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    // Cache for 24 hours
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error("[diagram-proxy] Error fetching image:", err?.message);
    res.status(502).json({ error: "Failed to fetch image" });
  }
});

export default router;
