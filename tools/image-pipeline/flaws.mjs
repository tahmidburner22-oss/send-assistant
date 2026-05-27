/**
 * Single source of truth for user-flagged image flaws.
 *
 * Imported by:
 *   - dashboard/index.html (renders the flaw chips)
 *   - prompt.mjs (turns flaw codes into prompt mutations)
 *   - feedback.mjs (validates incoming feedback payloads)
 *   - .github/workflows/diagram-feedback.yml (parses issue body)
 *
 * To add a new flaw, append an entry to FLAWS and add a matching case
 * in `prompt.mjs::userFeedbackMutation`. Keep `code` short and stable —
 * downstream issues reference it by code.
 */

export const FLAWS = [
  {
    code: "too-much-text",
    label: "Too much text",
    description: "The image contains words, captions or sentences that should not be there.",
  },
  {
    code: "background-not-white",
    label: "Background not white",
    description: "The background is coloured, gradient, textured or off-white.",
  },
  {
    code: "wrong-subject",
    label: "Wrong subject",
    description: "The image shows the wrong thing — does not match the brief.",
  },
  {
    code: "spec-mismatch",
    label: "Doesn't match the brief",
    description: "The image is in the right ballpark but missing or distorting key features.",
  },
  {
    code: "too-cluttered",
    label: "Too cluttered",
    description: "Too many objects, busy background, or competing details.",
  },
  {
    code: "low-contrast",
    label: "Low contrast / thin outlines",
    description: "Outlines too thin or grey; not high-contrast enough for SEND learners.",
  },
  {
    code: "photorealistic",
    label: "Photorealistic / 3D",
    description: "Looks like a photo or 3D render; should be flat illustration.",
  },
  {
    code: "wrong-style",
    label: "Wrong style",
    description: "Style is too cartoonish, ornate, or otherwise off-brief.",
  },
  {
    code: "wrong-colours",
    label: "Wrong colours",
    description: "Uses colours that conflict with the SEND palette or the brief.",
  },
  {
    code: "multiple-subjects",
    label: "Too many subjects",
    description: "Should be one subject; instead has multiple competing items.",
  },
  {
    code: "low-quality",
    label: "Low quality / messy",
    description: "Blurry, jagged, deformed, or otherwise visibly low quality.",
  },
  {
    code: "anatomy-wrong",
    label: "Anatomy/structure wrong",
    description: "For science diagrams: incorrect anatomy, wrong number of features, mislabelled.",
  },
];

export const FLAW_CODES = new Set(FLAWS.map((f) => f.code));

export function isValidFlaw(code) {
  return FLAW_CODES.has(code);
}

export function describeFlaws(codes) {
  return codes
    .filter(isValidFlaw)
    .map((c) => FLAWS.find((f) => f.code === c).label)
    .join(", ");
}
