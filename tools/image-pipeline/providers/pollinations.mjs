/**
 * Pollinations.ai provider.
 *
 * Zero-setup: no API key required. Free, online, returns a PNG over HTTPS.
 * Quality is lower than FLUX/SDXL but acceptable for many illustrative
 * briefs; the QA layer enforces the bar regardless.
 *
 * Docs: https://pollinations.ai/  (image endpoint described publicly).
 */

const ENDPOINT = "https://image.pollinations.ai/prompt/";

export async function generate({ positive, negative, width, height, seed, attempt }) {
  // Pollinations accepts the prompt in the URL path. We URL-encode and
  // include the negative prompt as a query parameter (some Pollinations
  // models honour it, others ignore — the QA layer is the real guard).
  const promptText = `${positive}\n\nNEGATIVE: ${negative}`;
  const url =
    ENDPOINT +
    encodeURIComponent(promptText) +
    `?width=${width}&height=${height}&nologo=true&model=flux&seed=${seed ?? Math.floor(Math.random() * 1e9)}`;

  const res = await fetchWithTimeout(url, 120_000);
  if (!res.ok) {
    throw new Error(`pollinations: HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) {
    throw new Error(`pollinations: unexpected content-type ${ct}`);
  }
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  if (buf.length < 1024) {
    throw new Error(`pollinations: response too small (${buf.length} bytes)`);
  }
  return buf;
}

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export const meta = { name: "pollinations", requiresKey: false };
