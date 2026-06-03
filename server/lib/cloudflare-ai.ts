/**
 * cloudflare-ai.ts
 *
 * Thin server-side wrapper over the Cloudflare Workers AI REST API, shared by:
 *   - V6 — CLIP re-ranking of stock-photo candidates (image-proxy.ts)
 *   - V7 — FLUX text-to-image generation for story illustrations
 *          (generation-proxy.ts)
 *
 * Why Cloudflare Workers AI (SEND Elevation Plan, Part 11.5):
 *   - It is FREE on the Workers AI free tier (~10k "neurons"/day) — no paid
 *     API. Keys live server-side only, never in the client bundle.
 *   - CLIP runs server-side so the relevance re-rank works even on the
 *     low-spec devices common in SEND settings.
 *
 * Graceful degradation is the contract: if the account id / token are not
 * configured (the default in most environments), `hasCloudflareAI()` is false
 * and every caller falls back to its existing free behaviour with NO change in
 * output. Nothing here is on the critical path unless a school opts in by
 * setting the two env vars.
 *
 * Required env (both must be set to enable):
 *   - CLOUDFLARE_ACCOUNT_ID
 *   - CLOUDFLARE_API_TOKEN   (Workers AI read/run scope)
 * Optional overrides:
 *   - CF_CLIP_MODEL   (default @cf/openai/clip-vit-base-patch32)
 *   - CF_FLUX_MODEL   (default @cf/black-forest-labs/flux-1-schnell)
 */

const ACCOUNT_ID = () => (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
const API_TOKEN = () => (process.env.CLOUDFLARE_API_TOKEN || "").trim();

export const CF_CLIP_MODEL =
  (process.env.CF_CLIP_MODEL || "@cf/openai/clip-vit-base-patch32").trim();
export const CF_FLUX_MODEL =
  (process.env.CF_FLUX_MODEL || "@cf/black-forest-labs/flux-1-schnell").trim();

/** True only when both Cloudflare credentials are present. */
export function hasCloudflareAI(): boolean {
  return ACCOUNT_ID().length > 0 && API_TOKEN().length > 0;
}

function runUrl(model: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID()}/ai/run/${model}`;
}

interface CfEnvelope<T> {
  result?: T;
  success?: boolean;
  errors?: Array<{ code?: number; message?: string }>;
  messages?: unknown[];
}

/**
 * Low-level JSON call to a Workers AI model. Returns the parsed `result`
 * payload, or null on any failure (network, auth, non-2xx, CF error envelope).
 * Never throws — callers degrade gracefully.
 */
export async function runWorkersAIJson<T = any>(
  model: string,
  body: Record<string, unknown>,
  timeoutMs = 20000,
): Promise<T | null> {
  if (!hasCloudflareAI()) return null;
  try {
    const r = await fetch(runUrl(model), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) {
      console.warn(`[cloudflare-ai] ${model} HTTP ${r.status}`);
      return null;
    }
    const json = (await r.json()) as CfEnvelope<T>;
    if (json && json.success === false) {
      console.warn(`[cloudflare-ai] ${model} error:`, json.errors?.[0]?.message);
      return null;
    }
    return (json?.result ?? null) as T | null;
  } catch (err: any) {
    console.warn(`[cloudflare-ai] ${model} request failed:`, err?.message);
    return null;
  }
}

// ── CLIP zero-shot relevance scoring (V6) ────────────────────────────────────
//
// Cloudflare exposes CLIP as a zero-shot image-classification model: given one
// image (as a byte array) and a list of candidate text labels, it returns a
// softmax probability per label. We turn that into a single relevance score by
// classifying each image against [query, ...DISTRACTORS] and reading the
// probability mass assigned to the query label — i.e. "how strongly does CLIP
// think this photo depicts the query rather than something generic/unrelated".
// Distractors anchor the softmax so a single query is meaningful.
const CLIP_DISTRACTORS = [
  "an unrelated stock photo",
  "a plain background",
  "abstract decorative pattern",
];

/**
 * Score how well one image matches `queryText` using CLIP zero-shot
 * classification. Returns a value in [0,1] (probability the image matches the
 * query vs. the distractor set), or null if the call fails / CF is disabled.
 */
export async function clipImageQueryScore(
  imageBytes: Uint8Array,
  queryText: string,
): Promise<number | null> {
  const query = queryText.trim().slice(0, 200);
  if (!query) return null;
  const labels = [query, ...CLIP_DISTRACTORS];
  const result = await runWorkersAIJson<any>(CF_CLIP_MODEL, {
    image: Array.from(imageBytes),
    text: labels,
  });
  if (!result) return null;
  return extractQueryScore(result, query);
}

/**
 * Robustly pull the score for `query` out of the various shapes Workers AI may
 * return for a zero-shot classification result:
 *   - [{ label, score }, ...]
 *   - { labels: [...], scores: [...] }            (logits/probabilities)
 *   - { "<label>": score, ... }
 * Returns null if no usable score for the query label is found.
 */
function extractQueryScore(result: any, query: string): number | null {
  const q = query.trim().toLowerCase();

  // Shape A: array of { label, score }
  if (Array.isArray(result)) {
    const hit = result.find(
      (e) => typeof e?.label === "string" && e.label.trim().toLowerCase() === q,
    );
    if (hit && typeof hit.score === "number") return clamp01(hit.score);
    // First element fallback (CLIP returns labels in input order).
    if (result[0] && typeof result[0].score === "number") return clamp01(result[0].score);
    return null;
  }

  if (result && typeof result === "object") {
    // Shape B: parallel labels[] + scores[]/logits[]
    const labels: unknown = result.labels;
    const scores: unknown = result.scores ?? result.logits ?? result.probabilities;
    if (Array.isArray(labels) && Array.isArray(scores)) {
      const idx = labels.findIndex(
        (l) => typeof l === "string" && (l as string).trim().toLowerCase() === q,
      );
      const raw = idx >= 0 ? scores[idx] : scores[0];
      if (typeof raw === "number") return clamp01(raw);
    }
    // Shape C: { "<label>": score }
    for (const [k, v] of Object.entries(result)) {
      if (typeof k === "string" && k.trim().toLowerCase() === q && typeof v === "number") {
        return clamp01(v);
      }
    }
  }
  return null;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1; // CLIP softmax scores are already 0..1; clamp guards logits
  return n;
}

// ── FLUX text-to-image (V7) ──────────────────────────────────────────────────
export interface GeneratedImage {
  /** Base64-encoded PNG/JPEG bytes (no data: prefix). */
  base64: string;
  contentType: string;
}

/**
 * Generate a single image from a text prompt using a free FLUX model on
 * Workers AI. Returns the image as base64, or null on failure / when CF is
 * disabled. `steps` is clamped to the model's supported range (flux-schnell
 * supports up to 8 diffusion steps).
 */
export async function generateImageFlux(
  prompt: string,
  opts: { steps?: number; timeoutMs?: number } = {},
): Promise<GeneratedImage | null> {
  const p = prompt.trim();
  if (!p) return null;
  const steps = Math.min(Math.max(opts.steps ?? 6, 1), 8);
  const result = await runWorkersAIJson<any>(
    CF_FLUX_MODEL,
    { prompt: p.slice(0, 2000), steps },
    opts.timeoutMs ?? 45000,
  );
  if (!result) return null;
  // flux-1-schnell returns { image: "<base64>" }. Be defensive about shape.
  const b64 =
    typeof result?.image === "string"
      ? result.image
      : typeof result === "string"
        ? result
        : null;
  if (!b64) return null;
  return { base64: b64, contentType: "image/jpeg" };
}
