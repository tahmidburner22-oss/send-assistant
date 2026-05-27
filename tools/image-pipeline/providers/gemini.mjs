/**
 * Google Gemini 2.5 Flash Image — "Nano Banana".
 *
 * Reference:
 *   POST https://generativelanguage.googleapis.com/v1beta/
 *        models/gemini-2.5-flash-image:generateContent?key=KEY
 *
 * The request includes `responseModalities: ["TEXT", "IMAGE"]` in
 * generationConfig; the response carries the PNG as a base64 string in
 * `candidates[0].content.parts[*].inlineData.data` (mimeType image/png).
 *
 * One key powers two pipeline stages:
 *   - Generation (this file)             via gemini-2.5-flash-image
 *   - Vision compliance QA (qa.mjs)      via gemini-2.5-flash
 *
 * Cost note (May 2026): the free tier covers a generous daily quota; for
 * heavy initial fills, switch to a paid key. If Gemini ever returns a
 * quota or safety-block error the runner falls back to the next
 * provider in the chain.
 */

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

export async function generate({ positive, negative, width, height, seed }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("gemini: GEMINI_API_KEY not set");

  // Nano Banana does not honour a separate negative prompt field, so we
  // append the negative terms to the positive prompt with an explicit
  // "DO NOT INCLUDE" frame. The strict positive prompt + QA gating is
  // what actually enforces the bar.
  const promptText =
    `${positive}\n\nDO NOT INCLUDE: ${negative}` +
    (width && height ? `\n\nOutput aspect ratio: ${width}:${height} (square if equal).` : "");

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      // Seed is honoured for reproducibility on retries.
      ...(seed != null ? { seed: Number(seed) } : {}),
    },
  };

  const url = `${ENDPOINT}?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    // 429 = daily quota exhausted on the free tier. Surface clearly so
    // the runner log shows it on every row that hit the cap, instead of
    // a generic "all providers exhausted".
    if (res.status === 429) {
      throw new Error(
        `gemini: HTTP 429 — daily free-tier quota exhausted (~500 requests/day). ` +
          `Wait until UTC midnight for the quota to reset, or enable billing on the Google ` +
          `Cloud project that owns this key (~$0.039 per image).`,
      );
    }
    throw new Error(`gemini: HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  const json = await res.json();

  // Gemini may return a TEXT part first and an IMAGE part second, in
  // either order. Find the first inlineData with an image MIME.
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(
    (p) => p?.inlineData?.mimeType?.startsWith?.("image/") && p.inlineData.data,
  );
  if (!imgPart) {
    // Surface safety-block reason if present, so the caller's chain can
    // route to the next provider rather than blocking on retry.
    const reason =
      json?.promptFeedback?.blockReason ||
      json?.candidates?.[0]?.finishReason ||
      "no-image-in-response";
    throw new Error(`gemini: ${reason}`);
  }
  return Buffer.from(imgPart.inlineData.data, "base64");
}

export const meta = { name: "gemini", requiresKey: true };
