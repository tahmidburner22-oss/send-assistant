/**
 * deAPI (deapi.ai) provider.
 *
 * deAPI is an aggregator API that fronts many open-source generative
 * models behind a single key. The user reports a $5 free credit on
 * signup which is enough for thousands of FLUX-quality images at
 * deAPI's advertised "20× lower costs" pricing.
 *
 * API shape: as of 2026 the docs are gated behind a CDN that this
 * sandbox cannot reach, so this provider is implemented against the
 * MOST LIKELY shape — OpenAI-compatible /v1/images/generations with
 * Bearer auth — which is the de facto standard for "single API,
 * many models" aggregators (Together, DeepInfra, fal.ai all support
 * it). If the actual shape is different the test-deapi-key workflow
 * will surface the exact error in one run and we can patch this
 * file with the correction.
 *
 * Required env: DEAPI_API_KEY
 * Optional env: DEAPI_IMAGE_MODEL  (default: black-forest-labs/flux-1-schnell)
 *               DEAPI_BASE_URL     (default: https://api.deapi.ai)
 */

const DEFAULT_BASE = "https://api.deapi.ai";
const DEFAULT_MODEL = "black-forest-labs/flux-1-schnell";

export async function generate({ positive, negative, width, height, seed }) {
  const key = process.env.DEAPI_API_KEY;
  if (!key) throw new Error("deapi: DEAPI_API_KEY not set");

  const base = (process.env.DEAPI_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  const model = process.env.DEAPI_IMAGE_MODEL || DEFAULT_MODEL;
  const url = `${base}/v1/images/generations`;

  // OpenAI-compatible body. We append the negative terms to the prompt
  // because OpenAI's spec doesn't have a separate negative_prompt field
  // and the providers we've tested either honour it inline or ignore
  // it (in which case our QA layer is the real guard).
  const promptText = negative ? `${positive}\n\nDO NOT INCLUDE: ${negative}` : positive;

  const body = {
    model,
    prompt: promptText,
    n: 1,
    size: width && height ? `${width}x${height}` : "1024x1024",
    response_format: "b64_json",
    ...(seed != null ? { seed: Number(seed) } : {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `deapi: HTTP ${res.status} — key rejected. Check the value at https://deapi.ai/dashboard. ${text.slice(0, 160)}`,
      );
    }
    if (res.status === 402) {
      throw new Error(
        `deapi: HTTP 402 — out of credits. Top up at https://deapi.ai/billing.`,
      );
    }
    if (res.status === 429) {
      throw new Error(`deapi: HTTP 429 — rate-limited; will retry next batch.`);
    }
    throw new Error(`deapi: HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  const json = await res.json();
  // OpenAI shape: { data: [{ b64_json: "..." }] } or { data: [{ url: "..." }] }
  const item = json?.data?.[0];
  if (!item) throw new Error(`deapi: no data in response: ${JSON.stringify(json).slice(0, 200)}`);
  if (item.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item.url) {
    const r2 = await fetch(item.url);
    if (!r2.ok) throw new Error(`deapi: failed to fetch image url (HTTP ${r2.status})`);
    return Buffer.from(await r2.arrayBuffer());
  }
  throw new Error(`deapi: response missing b64_json and url: ${JSON.stringify(item).slice(0, 200)}`);
}

export const meta = { name: "deapi", requiresKey: true };
