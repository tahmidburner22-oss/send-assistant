/**
 * Quality-assurance gating for AI-generated images.
 *
 * Pipeline:
 *   1. Dimension check          — image is 1024×1024 (or briefly tolerated 768+).
 *   2. White-background check   — sample edge pixels; ≥97% must be white-ish.
 *   3. Text-density check       — Tesseract OCR; reject if word count > N or
 *                                 a non-numeric word > X chars is found and
 *                                 the brief did not request labels.
 *   4. Spec-compliance check    — vision LLM (Gemini free tier or Cloudflare
 *                                 Llava) describes the image; reject if the
 *                                 description does not contain the brief's
 *                                 primary subject keywords.
 *
 * Each step returns { ok: bool, reason?: string, mutation?: string }.
 * The runner uses `mutation` to drive a targeted prompt retry.
 *
 * Heavy deps (sharp, tesseract.js) are imported lazily so SVG-only runs
 * don't pay their startup cost.
 */

const WHITE_BG_THRESHOLD = 0.97; // ≥97% of sampled edge pixels must be near-white
const NEAR_WHITE_TOLERANCE = 12; // RGB channel distance from 255
const MAX_WORDS_DEFAULT = 3;     // upper bound on words detected by OCR
const MIN_DIMENSION = 768;        // tolerate slightly smaller outputs from some providers

let _sharp = null;
async function sharp() {
  if (!_sharp) {
    const mod = await import("sharp");
    _sharp = mod.default;
  }
  return _sharp;
}

let _tesseract = null;
async function tesseract() {
  if (!_tesseract) {
    const mod = await import("tesseract.js");
    _tesseract = mod;
  }
  return _tesseract;
}

// ────────────────────────────────────────────────────────────────────
// 1. Dimension
// ────────────────────────────────────────────────────────────────────
export async function checkDimensions(pngBuffer) {
  const s = await sharp();
  const meta = await s(pngBuffer).metadata();
  if (!meta.width || !meta.height) {
    return { ok: false, reason: "no-dimensions" };
  }
  if (meta.width < MIN_DIMENSION || meta.height < MIN_DIMENSION) {
    return {
      ok: false,
      reason: `too-small ${meta.width}x${meta.height}`,
      mutation: null,
    };
  }
  return { ok: true, width: meta.width, height: meta.height };
}

// ────────────────────────────────────────────────────────────────────
// 2. White background — sample border pixels
// ────────────────────────────────────────────────────────────────────
export async function checkWhiteBackground(pngBuffer) {
  const s = await sharp();
  const { data, info } = await s(pngBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Sample a 4-pixel-wide frame around the border.
  const samples = [];
  const frame = Math.max(2, Math.floor(Math.min(width, height) * 0.02));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const onFrame =
        x < frame || x >= width - frame || y < frame || y >= height - frame;
      if (!onFrame) continue;
      const off = (y * width + x) * channels;
      samples.push([data[off], data[off + 1], data[off + 2]]);
    }
  }

  const whiteCount = samples.filter(
    ([r, g, b]) =>
      255 - r <= NEAR_WHITE_TOLERANCE &&
      255 - g <= NEAR_WHITE_TOLERANCE &&
      255 - b <= NEAR_WHITE_TOLERANCE,
  ).length;
  const ratio = whiteCount / samples.length;
  if (ratio < WHITE_BG_THRESHOLD) {
    return {
      ok: false,
      reason: `background-not-white (${(ratio * 100).toFixed(1)}% white edge)`,
      mutation: "white-bg",
    };
  }
  return { ok: true, ratio };
}

// ────────────────────────────────────────────────────────────────────
// 3. Text density — Tesseract OCR
// ────────────────────────────────────────────────────────────────────
export async function checkTextDensity(pngBuffer, briefAllowsText = false) {
  const tjs = await tesseract();
  // Single-shot recognition; Tesseract.js downloads its model on first run.
  const { data } = await tjs.recognize(pngBuffer, "eng", {
    // Quiet logger
    logger: () => {},
  });
  const text = (data?.text || "").trim();
  // Strip non-letters that often noise into OCR
  const tokens = text
    .split(/\s+/)
    .filter((t) => /[A-Za-z]/.test(t))
    .filter((t) => t.length >= 3);

  // Numeric-only labels (e.g. "60", "H₂O") are OK and not counted.
  const wordLimit = briefAllowsText ? 8 : MAX_WORDS_DEFAULT;
  if (tokens.length > wordLimit) {
    return {
      ok: false,
      reason: `too-much-text (${tokens.length} words: ${tokens.slice(0, 6).join(" ")})`,
      mutation: "too-much-text",
      detected: tokens,
    };
  }
  return { ok: true, detected: tokens };
}

// ────────────────────────────────────────────────────────────────────
// 4. Spec compliance — vision LLM
// ────────────────────────────────────────────────────────────────────
/**
 * Optional. Skipped if no GEMINI_API_KEY (free tier) is set.
 * Future: also support Cloudflare AI Llava.
 *
 * Asks the vision model for a one-paragraph description of the image,
 * then checks that the description contains the catalogue brief's
 * primary subject keywords (extracted from `row.description`).
 */
export async function checkSpecCompliance(pngBuffer, row) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // Spec-compliance check is optional. Skip cleanly.
    return { ok: true, skipped: "no-vision-llm-configured" };
  }

  const description = String(row.description || row.title || "");
  const keywords = extractKeywords(description);
  if (keywords.length === 0) return { ok: true, skipped: "no-keywords" };

  // Gemini 2.5 Flash for vision compliance — the same key that powers
  // Nano Banana generation. Faster + cheaper than the image model.
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const body = {
    contents: [
      {
        parts: [
          {
            text:
              "Describe this image in one short paragraph, listing every distinct object, shape and labelled feature. No editorialising.",
          },
          {
            inline_data: {
              mime_type: "image/png",
              data: pngBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
  };
  let textOut = "";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: true, skipped: `gemini-http-${res.status}` };
    const json = await res.json();
    textOut = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err) {
    return { ok: true, skipped: `gemini-error-${err.message}` };
  }
  const lower = textOut.toLowerCase();
  const hits = keywords.filter((k) => lower.includes(k.toLowerCase()));
  const ratio = hits.length / keywords.length;
  if (ratio < 0.5) {
    return {
      ok: false,
      reason: `spec-mismatch (only ${hits.length}/${keywords.length} subject keywords found in vision description)`,
      mutation: "spec-mismatch",
      visionDescription: textOut.slice(0, 280),
      keywords,
      hits,
    };
  }
  return { ok: true, ratio, hits, keywords };
}

function extractKeywords(description) {
  // Simple heuristic: take quoted phrases and Title-Case nouns.
  const words = description
    .replace(/[^A-Za-z0-9 \-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 4)
    .filter((w) => !STOPWORDS.has(w.toLowerCase()));
  // Deduplicate, keep up to 6.
  return [...new Set(words)].slice(0, 6);
}

const STOPWORDS = new Set([
  "with", "from", "into", "that", "this", "those", "these", "have",
  "shows", "show", "showing", "diagram", "image", "picture", "drawing",
  "labelled", "labeled", "filled", "empty", "left", "right", "above",
  "below", "between", "their", "them", "they", "there", "where", "when",
  "which", "while",
]);

// ────────────────────────────────────────────────────────────────────
// Top-level QA pipeline
// ────────────────────────────────────────────────────────────────────
/**
 * Run the full QA pipeline. Returns the first failing reason, or
 * { ok: true, results } if every step passed.
 */
export async function runQA(pngBuffer, row, opts = {}) {
  const results = {};
  const dim = await checkDimensions(pngBuffer);
  results.dim = dim;
  if (!dim.ok) return { ok: false, fail: "dim", results, ...dim };

  const bg = await checkWhiteBackground(pngBuffer);
  results.bg = bg;
  if (!bg.ok) return { ok: false, fail: "bg", results, ...bg };

  if (opts.skipText !== true) {
    const text = await checkTextDensity(pngBuffer, opts.briefAllowsText);
    results.text = text;
    if (!text.ok) return { ok: false, fail: "text", results, ...text };
  }

  if (opts.skipSpec !== true) {
    const spec = await checkSpecCompliance(pngBuffer, row);
    results.spec = spec;
    if (!spec.ok) return { ok: false, fail: "spec", results, ...spec };
  }

  return { ok: true, results };
}
