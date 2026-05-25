/**
 * presentation-image-resolver.ts
 *
 * Tiny client helper that turns a slide's `image_prompt` keyword into a
 * resolved stock-image record by calling `/api/image-proxy/search`.
 *
 * Why this lives here (Phase 4 / items 9 + 52):
 *   - The renderer reads `slide.image?.url` first and falls back to the
 *     legacy `source.unsplash.com/featured/?prompt` shortcut when no
 *     resolved record is present. So once a deck has been resolved, every
 *     surface (preview, library save, email, PPTX) sees the same picture
 *     and the same attribution.
 *   - Pure TS — no React. Safe to import from the export path or from a
 *     useEffect.
 *
 * Behaviour:
 *   - Skips slides that already have `slide.image?.url` (so manual picks
 *     are never overwritten).
 *   - Skips slides without an `image_prompt` (no work to do).
 *   - Mutates a *copy* of each slide; returns the new array so the caller
 *     can call `setPresentation(d => ({...d, slides}))`.
 *   - Resilient: a 4xx/5xx from the proxy leaves the slide untouched so
 *     the legacy fallback still runs in the renderer.
 *
 * Caching:
 *   - Per session: an in-module Map de-duplicates concurrent requests
 *     against the same query. Server-side has its own 24h cache.
 */

interface ProxySearchResult {
  url: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  source: "pexels" | "unsplash";
  photographer?: string;
  photographerUrl?: string;
  attribution?: string;
  licence?: string;
  sourceUrl?: string;
}

interface ProxySearchResponse {
  results: ProxySearchResult[];
  cached?: boolean;
  degraded?: boolean;
  reason?: string;
}

interface SlideForResolution {
  image_prompt?: string;
  image?: {
    url: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

const inFlight = new Map<string, Promise<ProxySearchResult | null>>();
const memo = new Map<string, ProxySearchResult | null>();

/**
 * Resolve a single keyword to one image record (the first hit from /search).
 * Returns null when the proxy is degraded (no API keys) or returns nothing
 * useful — the caller treats this as "leave the slide alone".
 */
export async function resolveImage(prompt: string): Promise<ProxySearchResult | null> {
  const key = prompt.trim().toLowerCase();
  if (!key) return null;
  if (memo.has(key)) return memo.get(key) ?? null;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const p = (async () => {
    try {
      const res = await fetch(
        `/api/image-proxy/search?q=${encodeURIComponent(key)}&perPage=1&source=auto`,
        { credentials: "include" },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as ProxySearchResponse;
      if (json.degraded || !Array.isArray(json.results) || json.results.length === 0) {
        memo.set(key, null);
        return null;
      }
      const top = json.results[0];
      memo.set(key, top);
      return top;
    } catch {
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, p);
  return p;
}

/**
 * Walk every slide in a deck and resolve `image_prompt` → `slide.image`.
 *
 * Concurrency: 4 in-flight requests at a time so a 30-slide deck doesn't
 * fan out to 30 simultaneous fetches.
 *
 * @param slides The original slide array (left untouched).
 * @returns A new array with `image` populated where resolution succeeded;
 *          slides without prompts or with pre-existing `image` records pass
 *          through unchanged.
 */
export async function resolveDeckImages<S extends SlideForResolution>(slides: S[]): Promise<S[]> {
  const out: S[] = slides.map((s) => ({ ...s }));
  const tasks: Array<{ index: number; prompt: string }> = [];
  out.forEach((s, i) => {
    if (s.image && s.image.url) return; // already resolved
    if (typeof s.image_prompt === "string" && s.image_prompt.trim().length > 0) {
      tasks.push({ index: i, prompt: s.image_prompt.trim() });
    }
  });
  if (tasks.length === 0) return out;

  const CONCURRENCY = 4;
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const my = cursor++;
      const t = tasks[my];
      const hit = await resolveImage(t.prompt);
      if (hit) {
        out[t.index] = {
          ...out[t.index],
          image: {
            url: hit.url,
            thumbUrl: hit.thumbUrl,
            width: hit.width,
            height: hit.height,
            source: hit.source,
            photographer: hit.photographer,
            photographerUrl: hit.photographerUrl,
            sourceUrl: hit.sourceUrl,
            attribution: hit.attribution,
            licence: hit.licence,
            resolvedAt: new Date().toISOString(),
          },
        };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, () => worker()));
  return out;
}

/**
 * Pick the best URL for the renderer. Prefers the resolved
 * `slide.image.url`, then falls back to the legacy keyword search URL so
 * old decks (and decks generated while no API key is configured) still
 * show *something*.
 */
export function bestImageUrl(slide: SlideForResolution, width = 800, height = 600): string | null {
  const resolved = slide?.image?.url;
  if (typeof resolved === "string" && resolved.length > 0) return resolved;
  const prompt = typeof slide?.image_prompt === "string" ? slide.image_prompt : "";
  if (prompt.trim().length === 0) return null;
  return `https://source.unsplash.com/featured/${width}x${height}/?${encodeURIComponent(prompt)}`;
}

/**
 * Fetch an image as a `data:` URL via the server proxy. The PPTX painter
 * uses this so `pptxgenjs.addImage({ data })` can embed real bytes — the
 * browser blocks direct cross-origin fetches against most CDN responses.
 *
 * Falls back to `null` on failure so the painter can skip the image
 * gracefully and continue rendering text content.
 */
export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/image-proxy/fetch?url=${encodeURIComponent(url)}&format=base64`,
      { credentials: "include" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { dataUrl?: string };
    return typeof json.dataUrl === "string" ? json.dataUrl : null;
  } catch {
    return null;
  }
}
