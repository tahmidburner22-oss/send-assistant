/**
 * Cloudflare Workers AI provider.
 *
 * Free tier: 10,000 neurons / day across all Workers AI models. Image
 * gen models cost ~10–20 neurons per image, so the daily budget is
 * effectively several hundred images for free. Sufficient for nightly
 * top-up runs.
 *
 * Requires env: CLOUDFLARE_AI_TOKEN, CLOUDFLARE_ACCOUNT_ID.
 *
 * Model: @cf/black-forest-labs/flux-1-schnell.
 */

export async function generate({ positive, width, height, seed }) {
  const token = process.env.CLOUDFLARE_AI_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account) {
    throw new Error("cloudflare: CLOUDFLARE_AI_TOKEN/ACCOUNT_ID not set");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
  const body = {
    prompt: positive,
    // Cloudflare's flux-1-schnell does not currently expose negative_prompt;
    // we rely on the strict positive prompt + QA gating.
    steps: 4,
    seed,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`cloudflare: HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const b64 = json?.result?.image;
  if (!b64) throw new Error("cloudflare: no image in response");
  return Buffer.from(b64, "base64");
}

export const meta = { name: "cloudflare", requiresKey: true };
