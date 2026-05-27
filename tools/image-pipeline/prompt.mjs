/**
 * Strict prompt builder for the AI image tier.
 *
 * Inputs are the catalogue brief verbatim (description + style_notes).
 * The brief is the LITERAL subject; the model must not "interpret" it.
 * We wrap it in:
 *   - a Twinkl-grade visual anchor
 *   - the SEND style guide constraints (mirrors SEND-STYLE-GUIDE.md)
 *   - subject-specific reinforcements
 *   - a comprehensive negative prompt
 *
 * On retry (after QA failure), `buildPrompt` accepts a `mutation` flag
 * that strengthens the failed-axis instruction (e.g. "background was
 * not white" → repeat "PURE WHITE BACKGROUND" three times).
 */

const STYLE_ANCHOR = [
  "clean flat-colour vector illustration",
  "thick black outlines",
  "calm primary palette",
  "centred composition",
  "generous whitespace",
  "print-safe, classroom worksheet style",
  "Twinkl-grade clarity, surpasses Twinkl on accessibility",
].join(", ");

const SEND_RULES = [
  "PURE WHITE BACKGROUND (#FFFFFF) — no gradient, no texture, no border",
  "high-contrast solid black outline on every shape",
  "minimum text — only short numeric or symbolic labels if the brief explicitly names them",
  "no captions, no titles, no descriptive sentences inside the image",
  "no signatures, no watermarks, no logos, no decorative flourishes",
  "no shadows, no reflections, no ambient detail, no scenery behind the subject",
  "single subject, centred, occupying 60–75% of the frame",
  "maximum four fill colours plus white",
  "consistent style across a series — predictability matters for SEND learners",
];

const NEGATIVE_TERMS = [
  "text", "captions", "titles", "labels", "watermark", "signature",
  "blurry", "photorealistic", "3D rendered", "rendered with depth",
  "dark background", "coloured background", "gradient background",
  "decorative border", "frame", "ribbon", "banner",
  "scenery", "landscape behind subject",
  "shadows", "drop shadow", "reflections", "specular highlights",
  "extra fingers", "extra limbs", "deformed", "anatomical errors",
  "artistic flourish", "messy strokes", "sketch lines", "pencil texture",
  "cartoon eyes on inanimate objects", "anthropomorphism unless brief specifies",
  "low contrast", "thin outlines", "missing outlines",
  "multiple subjects unless brief specifies",
  "stock photo", "clip art collage",
];

/**
 * Subject-specific reinforcements, applied based on the row's subject.
 */
function subjectRules(row) {
  const subject = String(row.subject || "").toLowerCase();
  const out = [];

  if (/^math/.test(subject)) {
    out.push(
      "all counters, cubes and shapes are identical size within the image",
      "grid cells must be perfectly equal — measure with a ruler",
      "numeric labels use a sans-serif primary-school font",
    );
  }
  if (/biolog|chemistry|physics|combined science|^science/.test(subject)) {
    out.push(
      "labelled features use straight black leader lines that DO NOT cross each other",
      "internal regions use ONE flat fill colour each, no gradient shading",
      "if a circuit is shown, use BS standard symbols, never US symbols",
    );
  }
  if (/^english/.test(subject) || /literature|language/.test(subject)) {
    out.push(
      "letters use a primary-school print font, not cursive unless the brief says so",
      "no ornamental letterforms",
    );
  }
  if (/^geography/.test(subject)) {
    out.push(
      "OS map symbols are exact reproductions of the Ordnance Survey 1:25 000 symbol set",
      "compass roses always have N at the top",
    );
  }
  if (/^history/.test(subject)) {
    out.push(
      "timelines are horizontal with equal year spacing, single black baseline",
    );
  }
  return out;
}

/**
 * Tier-specific framing.
 */
function tierFraming(strategy) {
  if (strategy === "ai-structural") {
    return [
      "SUBJECT TYPE: technical / labelled diagram",
      "render in clean technical-illustration style, like a primary or KS3 textbook",
      "every named feature in the brief must be visibly distinct in the diagram",
    ];
  }
  // ai-pictorial
  return [
    "SUBJECT TYPE: simple illustrative card showing one object or character",
    "render in clean flat-vector illustration style, simple and friendly",
    "subject is centred and clearly recognisable; nothing else is in the frame",
  ];
}

/**
 * Mutation (used on QA-driven retries).
 *
 * Each mutation key targets the axis that failed:
 *   - 'white-bg'    → reinforce white background
 *   - 'too-much-text' → reinforce no-text rule
 *   - 'spec-mismatch' → reinforce literal-spec interpretation
 *   - 'low-contrast' → reinforce outline rule
 */
function mutation(positive, negative, kind) {
  switch (kind) {
    case "white-bg":
      positive.unshift(
        "PURE WHITE BACKGROUND, hex #FFFFFF, completely solid white, no colour cast, no gradient, no paper texture",
      );
      negative.push("any non-white pixel in background", "off-white", "cream");
      break;
    case "too-much-text":
      positive.unshift(
        "ABSOLUTELY NO WORDS, NO SENTENCES, NO CAPTIONS — only numerical labels if explicitly named in the brief",
      );
      negative.push("any English text", "any sentences", "letter forms unless brief specifies");
      break;
    case "spec-mismatch":
      positive.unshift(
        "FOLLOW THE BRIEF LITERALLY — do not add features not named, do not omit features named",
      );
      break;
    case "low-contrast":
      positive.unshift(
        "VERY THICK SOLID BLACK OUTLINES on every shape, minimum 4px equivalent",
      );
      break;
    default:
      break;
  }
  return { positive, negative };
}

/**
 * Build the final prompt object for an image-gen provider.
 *
 * @param {object} row catalogue row
 * @param {string} strategy 'ai-structural' | 'ai-pictorial'
 * @param {object} opts
 * @param {string=} opts.mutation key from above
 * @param {number=} opts.attempt 1-based retry counter
 * @returns {{ positive: string, negative: string, width: number, height: number }}
 */
export function buildPrompt(row, strategy, opts = {}) {
  const description = String(row.description || row.title || "").trim();
  const styleNotes = String(row.style_notes || "").trim();

  const positive = [
    `SUBJECT: ${description}`,
    styleNotes ? `STYLE NOTES FROM BRIEF: ${styleNotes}` : null,
    `STYLE: ${STYLE_ANCHOR}`,
    ...tierFraming(strategy),
    "RULES:",
    ...SEND_RULES.map((r) => `- ${r}`),
    ...subjectRules(row).map((r) => `- ${r}`),
  ].filter(Boolean);

  const negative = [...NEGATIVE_TERMS];

  const final = mutation(positive, negative, opts.mutation);

  return {
    positive: final.positive.join("\n"),
    negative: final.negative.join(", "),
    width: 1024,
    height: 1024,
    attempt: opts.attempt || 1,
  };
}

export const STYLE_GUIDE_VERSION = "1.0.0";
