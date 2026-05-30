/**
 * Lane 3.1 — Six-bucket primary reading-age profile.
 *
 * Replaces the Y1-2 / Y3-4 / Y5-6 three-bucket switch at
 * `client/src/lib/ai.ts:~1517` with one bucket per primary year
 * (Y1 through Y6) so the prompt no longer asks Year 1 (5-6 yo, mid
 * Phase 5 phonics) and Year 2 (6-7 yo, fluent CVC) for the same
 * thing. Spec: docs/primary-worksheet-improvement-plan.md W1.
 *
 * Acceptance (from W1):
 *   - Y1: Phase 5 phonics, max 6 words / instruction.
 *   - Y2: Phase 5/6 phonics, max 8 words.
 *   - Y3: max 10 words; subject vocab introduced WITH definition the
 *         first time only (vocab card is already on the page).
 *   - Y4: max 12 words; two-clause sentences allowed; >=80% Tier 1.
 *   - Y5: max 14 words; two-clause OK; Tier 2 allowed if defined.
 *   - Y6: max 16 words; may use ONE Tier 3 word per question if it
 *         is the curriculum word being taught.
 *
 * The function is pure — no I/O, no global state — so it can be
 * unit-tested in isolation and called from any prompt-builder. It
 * returns BOTH a structured profile (for downstream code to read
 * the bucket boundaries) AND a ready-to-paste prompt block (so the
 * call site at ai.ts L1517 stays a one-liner).
 *
 * Lane 3.2 will hook the per-year vocab blocklist onto the same
 * profile — keeping all year-band-keyed primary rules in one
 * module is the goal, so a future refactor of ai.ts doesn't have
 * to chase year-band branches across files.
 */

/** Tier classification of subject vocabulary, after Beck, McKeown &
 * Kucan (2002). Tier 1 = common everyday words; Tier 2 = high-utility
 * cross-domain academic words; Tier 3 = domain-specific technical
 * vocabulary. The W1 acceptance rules are expressed in these tiers. */
export type VocabTier = "tier1" | "tier2" | "tier3";

export interface PrimaryReadingProfile {
  /** Year group number, 1..6. */
  yearNum: number;
  /** Phonics phase the pupil is mid-stream on (Letters & Sounds /
   * National Curriculum nomenclature). Used by KS1 callers. */
  phonicsPhase: "phase-5" | "phase-5-6" | "n/a";
  /** Hard cap on words per pupil-facing instruction. */
  maxWordsPerInstruction: number;
  /** Whether two-clause sentences are allowed. KS1 = no, KS2 = yes. */
  allowTwoClauseSentences: boolean;
  /** Highest vocabulary tier permitted in pupil-facing content. A
   * higher tier may still appear if it is the curriculum word being
   * taught (see `tier3CurriculumWordAllowed`). */
  maxVocabTier: VocabTier;
  /** Whether one Tier 3 word per question is allowed when it is the
   * curriculum word being taught. Y6 only — every other primary year
   * forbids Tier 3 in pupil-facing content. */
  tier3CurriculumWordAllowed: boolean;
  /** Pretty Y1..Y6 label for prompt rendering. */
  yearLabel: string;
  /** Reading-age window suitable for downstream Flesch-Kincaid
   * calibration (lo, hi). KS1 windows are deliberately tight; KS2
   * windows widen by one year as fluency grows. */
  readingAgeWindow: readonly [number, number];
}

const PRIMARY_PROFILES: Readonly<Record<number, PrimaryReadingProfile>> = {
  1: {
    yearNum: 1,
    phonicsPhase: "phase-5",
    maxWordsPerInstruction: 6,
    allowTwoClauseSentences: false,
    maxVocabTier: "tier1",
    tier3CurriculumWordAllowed: false,
    yearLabel: "Year 1",
    readingAgeWindow: [5, 6],
  },
  2: {
    yearNum: 2,
    phonicsPhase: "phase-5-6",
    maxWordsPerInstruction: 8,
    allowTwoClauseSentences: false,
    maxVocabTier: "tier1",
    tier3CurriculumWordAllowed: false,
    yearLabel: "Year 2",
    readingAgeWindow: [6, 7],
  },
  3: {
    yearNum: 3,
    phonicsPhase: "n/a",
    maxWordsPerInstruction: 10,
    allowTwoClauseSentences: false,
    maxVocabTier: "tier2",
    tier3CurriculumWordAllowed: false,
    yearLabel: "Year 3",
    readingAgeWindow: [7, 8],
  },
  4: {
    yearNum: 4,
    phonicsPhase: "n/a",
    maxWordsPerInstruction: 12,
    allowTwoClauseSentences: true,
    maxVocabTier: "tier2",
    tier3CurriculumWordAllowed: false,
    yearLabel: "Year 4",
    readingAgeWindow: [8, 9],
  },
  5: {
    yearNum: 5,
    phonicsPhase: "n/a",
    maxWordsPerInstruction: 14,
    allowTwoClauseSentences: true,
    maxVocabTier: "tier2",
    tier3CurriculumWordAllowed: false,
    yearLabel: "Year 5",
    readingAgeWindow: [9, 10],
  },
  6: {
    yearNum: 6,
    phonicsPhase: "n/a",
    maxWordsPerInstruction: 16,
    allowTwoClauseSentences: true,
    maxVocabTier: "tier3",
    tier3CurriculumWordAllowed: true,
    yearLabel: "Year 6",
    readingAgeWindow: [10, 11],
  },
};

/**
 * Return the structured reading-age profile for a primary year, or
 * undefined for non-primary years (Y7+, KS3 / GCSE / A-Level — those
 * fall back to the existing secondary `getReadingAgeNote()` table at
 * ai.ts L1865-1878). Year 0 / negative / NaN inputs return undefined
 * so callers can branch cleanly.
 *
 * The 11+ pupil profile (`yearNum === 6` after the parser at
 * ai.ts:1218 maps `is11Plus` -> 6) gets the Y6 profile by default,
 * matching the existing prompt's "11+ Preparation (KS2 level)"
 * phasing. The 11+ flag itself is opaque to this function.
 */
export function getPrimaryReadingProfile(
  yearNum: number,
): PrimaryReadingProfile | undefined {
  if (!Number.isInteger(yearNum)) return undefined;
  if (yearNum < 1 || yearNum > 6) return undefined;
  return PRIMARY_PROFILES[yearNum];
}

/**
 * Render the W1 acceptance rules into a single prompt block ready
 * for direct interpolation into the system prompt at ai.ts:1517.
 * Returns the empty string for non-primary years so the call site
 * can always interpolate the result without a guard. The
 * "READING AGE CEILING — MANDATORY:" preamble is owned by the call
 * site (it sits above this block in the prompt); this function
 * returns ONLY the per-year bullet list.
 */
export function renderPrimaryReadingProfilePrompt(yearNum: number): string {
  const p = getPrimaryReadingProfile(yearNum);
  if (!p) return "";

  const phonicsLine =
    p.phonicsPhase === "phase-5"
      ? "Phase 5 phonics ONLY (no Phase 6 split digraphs in pupil text)."
      : p.phonicsPhase === "phase-5-6"
      ? "Phase 5/6 phonics; common adjectives are OK."
      : null;

  const tierLine =
    p.maxVocabTier === "tier1"
      ? "Tier 1 lexicon ONLY (everyday words). No academic verbs."
      : p.maxVocabTier === "tier2"
      ? p.yearNum === 5
        ? "Tier 2 (cross-domain academic) words allowed if defined inline."
        : "Subject vocabulary introduced WITH a one-line definition the first time it appears (vocab card is already on the page; do not repeat the full definition there)."
      : "ONE Tier 3 (domain-specific) word per question is allowed only if it is the curriculum word being taught for this lesson; every other Tier 3 word must be replaced with a Tier 1/2 paraphrase.";

  const clauseLine = p.allowTwoClauseSentences
    ? "Two-clause sentences are allowed; one main + one subordinate clause only — no nested subordinate clauses."
    : "ONE clause per sentence. No 'and', 'but', 'because' joiners between two ideas — split into two sentences.";

  const lines: string[] = [
    `- **${p.yearLabel} reading profile** (target reading age ${p.readingAgeWindow[0]}-${p.readingAgeWindow[1]}):`,
    `  - Maximum ${p.maxWordsPerInstruction} words per pupil-facing instruction.`,
    `  - ${clauseLine}`,
    `  - ${tierLine}`,
  ];
  if (phonicsLine) lines.splice(2, 0, `  - ${phonicsLine}`);
  if (p.yearNum === 1) {
    lines.push(
      `  - Every instruction MUST have a visual / icon cue beside it (the renderer places the icon; you write the instruction so the cue makes sense without reading it).`,
    );
  }
  return lines.join("\n");
}
