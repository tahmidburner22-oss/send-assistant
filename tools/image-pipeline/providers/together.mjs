/**
 * Together.ai provider — FLUX.1-schnell.
 *
 * Free $1 credit on signup; ~$0.0027/image with FLUX.1-schnell, so the
 * full 5,975-row catalogue costs about $16 if Pollinations and the
 * other free tiers fail to clear it.
 *
 * Requires env: TOGETHER_API_KEY.
 */

const ENDPOINT = "https://api.together.xyz/v1/images/generations";

export async function generate({ positive, negative, width, height, seed }) {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) throw new Error("together: TOGETHER_API_KEY not set");

  const body = {
    model: "black-forest-labs/FLUX.1-schnell",
    prompt: positive,
    negative_prompt: negative,
    width,
    height,
    steps: 4,
    n: 1,
    response_format: "b64_json",
    seed,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`together: HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("together: no image in response");
  return Buffer.from(b64, "base64");
}

export const meta = { name: "together", requiresKey: true };
