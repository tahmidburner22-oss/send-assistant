/**
 * Hugging Face Inference API provider.
 *
 * Free tier: limited monthly compute (variable). Useful as a third
 * backup. Requires env HUGGINGFACE_TOKEN.
 *
 * Model defaults to FLUX.1-schnell; override with HF_IMAGE_MODEL.
 */

export async function generate({ positive, width, height, seed }) {
  const token = process.env.HUGGINGFACE_TOKEN;
  if (!token) throw new Error("huggingface: HUGGINGFACE_TOKEN not set");
  const model = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";

  const url = `https://api-inference.huggingface.co/models/${model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "image/png",
    },
    body: JSON.stringify({
      inputs: positive,
      parameters: { width, height, seed },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`huggingface: HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export const meta = { name: "huggingface", requiresKey: true };
