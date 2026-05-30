/**
 * Lane 3.2 — Per-year primary vocabulary blocklist.
 *
 * Lifts the inline "VOCABULARY RULES — NEVER USE" list from
 * `client/src/lib/ai.ts:~1528` into a structured, per-band module so
 * (a) the generator prompt and (b) a fail-closed post-validator can
 * read from one source of truth. Spec:
 * docs/primary-worksheet-improvement-plan.md W1 step 2.
 *
 * The blocklist is stratified by primary band, strictly nested so
 * KS1 ⊃ LKS2 ⊃ UKS2:
 *
 *   - UKS2 (Y5-6) — lightest list. Blocks only words that are
 *     genuinely secondary / abstract (analyse, evaluate,
 *     synthesise, equilibrium, …). Y6 may still use ONE Tier 3
 *     *curriculum* word per question (see Lane 3.1
 *     `tier3CurriculumWordAllowed`), so subject words that ARE on
 *     the Y6 curriculum (perpendicular, circumference, diameter,
 *     denominator, numerator) are deliberately NOT blocked at UKS2.
 *   - LKS2 (Y3-4) — UKS2 list PLUS the Y5/Y6 subject words that a
 *     Y3/Y4 pupil should not meet cold (perpendicular, circumference,
 *     photosynthesis, …).
 *   - KS1 (Y1-2) — LKS2 list PLUS the harder everyday-academic words
 *     that even a fluent Y2 reader shouldn't be asked to decode
 *     unsupported (compare, describe, predict, …).
 *
 * Each entry optionally carries a plain-English `replacement` lifted
 * from the original ai.ts list. The replacement is advisory — the
 * post-validator does NOT auto-rewrite pupil content (a blocked word
 * may legitimately be the curriculum word being taught and live in
 * the Key Words card); it surfaces the suggestion in a warning and
 * stamps a structured violation record the generation orchestrator
 * can use to drive a re-prompt.
 *
 * This module is pure data + pure functions — no I/O, no global
 * state — so it can be unit-tested in isolation and imported by both
 * the browser bundle (prompt builder) and the post-validator chain.
 */

import { getPrimaryReadingProfile } from "./primaryReadingProfile";

/** The three primary key-stage bands used to scope the blocklist. */
export type PrimaryBand = "KS1" | "LKS2" | "UKS2";

/** One blocked word plus an optional plain-English replacement. */
export interface BlockedWord {
  /** The blocked word, lower-case. Matched case-insensitively on
   * whole-word boundaries. */
  readonly word: string;
  /** Plain-English alternative a primary pupil understands, when one
   * exists. Surfaced in the validator warning. */
  readonly replacement?: string;
}

/**
 * Map a year-group number to its primary band, or undefined for
 * non-primary years (Y7+ / 0 / NaN). Reuses the Lane 3.1 profile as
 * the single authority on "is this a primary year" so the two modules
 * can never disagree about year boundaries.
 *
 *   Y1, Y2 → KS1
 *   Y3, Y4 → LKS2
 *   Y5, Y6 → UKS2
 */
export function primaryBandForYear(yearNum: number): PrimaryBand | undefined {
  const profile = getPrimaryReadingProfile(yearNum);
  if (!profile) return undefined;
  if (yearNum <= 2) return "KS1";
  if (yearNum <= 4) return "LKS2";
  return "UKS2";
}

/**
 * Resolve a raw year-group string (as submitted to the generator) to
 * its primary band, or undefined when the string is non-primary /
 * unrecognised. Handles the shapes the generator actually emits:
 *
 *   "Year 1".."Year 6"   → that year's band
 *   "Year 7".."Year 13"  → undefined (secondary; primaryBandForYear
 *                          rejects >6)
 *   "11+ Preparation"    → UKS2 (Y6-level KS2 prep)
 *   "KS1"                → KS1
 *   "KS2"                → UKS2 (generic KS2 → lightest band, so we
 *                          never OVER-block a sheet whose exact year
 *                          is unknown)
 *   "KS3" / "KS4" / "KS5" / "GCSE" / "A-Level" → undefined
 *
 * The KS3/4/5 + GCSE/A-Level guard is explicit so the digit-fallback
 * doesn't misread "KS3" as "Year 3".
 */
export function primaryBandForYearGroup(
  yearGroup: string | undefined,
): PrimaryBand | undefined {
  const s = (yearGroup || "").toLowerCase().trim();
  if (!s) return undefined;

  let yearNum: number | undefined;
  const ym = s.match(/year\s*(\d+)/);
  if (ym) {
    yearNum = parseInt(ym[1], 10);
  } else if (/11\s*\+/.test(s)) {
    yearNum = 6; // 11+ prep sits at the top of KS2.
  } else if (/\bks1\b/.test(s)) {
    yearNum = 2; // any year within KS1 → KS1 band.
  } else if (/\bks2\b/.test(s)) {
    yearNum = 5; // generic KS2 → UKS2 (lightest), never over-block.
  } else if (/\bks[345]\b|gcse|a-?level/.test(s)) {
    return undefined; // explicit secondary tokens.
  } else {
    const digits = s.replace(/[^0-9]/g, "");
    if (digits) yearNum = parseInt(digits, 10);
  }

  if (yearNum === undefined) return undefined;
  return primaryBandForYear(yearNum);
}

// ── Word tiers ───────────────────────────────────────────────────────────────
//
// The lists below are additive: UKS2 is the base, LKS2 adds to it, KS1
// adds to LKS2. The exported per-band arrays are assembled from these
// so the nesting (KS1 ⊃ LKS2 ⊃ UKS2) is structurally guaranteed and
// can't drift.

/**
 * Genuinely secondary / abstract words. Blocked at EVERY primary band
 * — no primary pupil should meet these unexplained. These are command
 * verbs and Tier-3 science/maths terms that have no place on a primary
 * sheet regardless of year.
 */
const SECONDARY_ABSTRACT: readonly BlockedWord[] = [
  { word: "analyse", replacement: "look closely at" },
  { word: "evaluate", replacement: "decide how good" },
  { word: "assess", replacement: "judge" },
  { word: "justify", replacement: "give reasons for" },
  { word: "synthesise", replacement: "put together" },
  { word: "hypothesis", replacement: "a good guess to test" },
  { word: "methodology", replacement: "the way you do it" },
  { word: "criterion", replacement: "rule to check against" },
  { word: "criteria", replacement: "rules to check against" },
  { word: "infer", replacement: "work out from clues" },
  { word: "deduce", replacement: "work out" },
  { word: "extrapolate", replacement: "carry the pattern on" },
  { word: "correlate", replacement: "link together" },
  { word: "quantify", replacement: "measure how much" },
  { word: "magnitude", replacement: "size" },
  { word: "coefficient" },
  { word: "simultaneous" },
  { word: "quadratic" },
  { word: "trajectory", replacement: "the path it travels" },
  { word: "velocity", replacement: "speed" },
  { word: "acceleration", replacement: "getting faster" },
  { word: "momentum" },
  { word: "covalent" },
  { word: "ionic" },
  { word: "oxidation", replacement: "rusting or burning" },
  { word: "reduction" },
  { word: "equilibrium", replacement: "balance" },
];

/**
 * Subject words that ARE on the Y5/Y6 curriculum and so are allowed
 * at UKS2 (as the one Tier-3 curriculum word per question), but should
 * NOT appear at LKS2 / KS1. Added on top of SECONDARY_ABSTRACT for the
 * two younger bands only.
 */
const UPPER_SUBJECT_WORDS: readonly BlockedWord[] = [
  { word: "perpendicular" },
  { word: "adjacent", replacement: "next to" },
  { word: "denominator", replacement: "bottom number of a fraction" },
  { word: "numerator", replacement: "top number of a fraction" },
  { word: "gradient", replacement: "slope" },
  { word: "circumference", replacement: "distance around the circle" },
  { word: "diameter", replacement: "distance across the middle" },
  { word: "photosynthesis", replacement: "how plants make food" },
  { word: "osmosis", replacement: "water moving through" },
  { word: "mitosis", replacement: "cell splitting" },
];

/**
 * Everyday-academic words that a fluent Y2 reader still shouldn't be
 * asked to decode unsupported. KS1-only — these are perfectly fine
 * from Y3 upward. Kept deliberately short: the KS1 sheet leans on
 * concrete child-voice instructions ("Circle the…", "Match the…").
 */
const KS1_EXTRA: readonly BlockedWord[] = [
  { word: "compare", replacement: "say how they are the same or different" },
  { word: "describe", replacement: "tell me about" },
  { word: "explain", replacement: "tell me why" },
  { word: "predict", replacement: "say what will happen next" },
  { word: "classify", replacement: "sort into groups" },
  { word: "sequence", replacement: "put in order" },
  { word: "estimate", replacement: "make a good guess" },
  { word: "represent", replacement: "show" },
];

// ── Per-band exported lists (strictly nested) ────────────────────────────────

/** UKS2 (Y5-6) — base secondary/abstract list only. */
export const UKS2_BLOCKED: readonly BlockedWord[] = Object.freeze([
  ...SECONDARY_ABSTRACT,
]);

/** LKS2 (Y3-4) — UKS2 plus the upper-KS2 subject words. */
export const LKS2_BLOCKED: readonly BlockedWord[] = Object.freeze([
  ...SECONDARY_ABSTRACT,
  ...UPPER_SUBJECT_WORDS,
]);

/** KS1 (Y1-2) — LKS2 plus the everyday-academic extras. Strictest. */
export const KS1_BLOCKED: readonly BlockedWord[] = Object.freeze([
  ...SECONDARY_ABSTRACT,
  ...UPPER_SUBJECT_WORDS,
  ...KS1_EXTRA,
]);

/** Return the blocked-word list for a band. */
export function blockedWordsForBand(band: PrimaryBand): readonly BlockedWord[] {
  switch (band) {
    case "KS1":
      return KS1_BLOCKED;
    case "LKS2":
      return LKS2_BLOCKED;
    case "UKS2":
      return UKS2_BLOCKED;
  }
}

/** One detected blocklist hit inside a piece of text. */
export interface BlockedVocabHit {
  /** The blocked word as written in the source (preserves case). */
  readonly matched: string;
  /** The canonical lower-case blocklist entry that matched. */
  readonly word: string;
  /** Suggested plain-English replacement, when the entry carries one. */
  readonly replacement?: string;
  /** Number of times this word appears in the scanned text. */
  readonly count: number;
}

/** Escape a string for safe inclusion in a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Scan a block of text for any blocklisted word for the given band.
 * Returns one hit per distinct blocked word, with an occurrence count.
 * Matching is case-insensitive and whole-word (so "reduction" does not
 * fire inside "reductions" — wait, it would via \b; see note) — we
 * anchor on `\b…\b` boundaries, which DO treat "reductions" as a match
 * on the stem. That is intentional: plurals / inflections of a blocked
 * word are equally inappropriate at the band. Sub-string matches inside
 * an unrelated word (e.g. "ionic" inside "ironic") are prevented by the
 * `\b` boundaries.
 *
 * Empty / non-string input returns an empty array.
 */
export function findBlockedVocab(
  text: string,
  band: PrimaryBand,
): BlockedVocabHit[] {
  if (typeof text !== "string" || text.length === 0) return [];
  const hits: BlockedVocabHit[] = [];
  for (const entry of blockedWordsForBand(band)) {
    // \b on each side, allow an optional inflection suffix so plurals /
    // -ing / -ed forms of the blocked stem are caught too.
    const re = new RegExp(
      `\\b${escapeRegExp(entry.word)}(?:s|es|ing|ed|d)?\\b`,
      "gi",
    );
    const matches = text.match(re);
    if (matches && matches.length > 0) {
      hits.push({
        matched: matches[0],
        word: entry.word,
        replacement: entry.replacement,
        count: matches.length,
      });
    }
  }
  return hits;
}


/**
 * Render the band-scoped "NEVER USE" vocabulary block for direct
 * interpolation into the primary system prompt (replaces the flat
 * hard-coded list previously inline in ai.ts). Returns the empty
 * string for non-primary year groups so the call site can always
 * interpolate the result without a guard.
 *
 * The list is band-appropriate: a Year 1 prompt gets the strict KS1
 * list (which forbids "describe" / "predict"), a Year 6 prompt gets
 * the lighter UKS2 list (which permits curriculum subject words like
 * "circumference"). This is the same data the post-validator audits
 * against, so the prompt and the fail-closed check can never drift.
 */
export function renderPrimaryVocabBlocklistPrompt(
  yearGroup: string | undefined,
): string {
  const band = primaryBandForYearGroup(yearGroup);
  if (!band) return "";

  const entries = blockedWordsForBand(band);
  const rendered = entries
    .map((e) => (e.replacement ? `${e.word} (use '${e.replacement}')` : e.word))
    .join(", ");

  return [
    `VOCABULARY RULES — NEVER USE these words in student-facing content (${band} blocklist):`,
    `- Do NOT use: ${rendered}.`,
    `- ALWAYS replace a complex word with the simple alternative shown. If you must use a subject word that is the one being taught this lesson, immediately define it in plain English in brackets.`,
  ].join("\n");
}
