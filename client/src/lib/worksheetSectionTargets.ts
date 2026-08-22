/**
 * worksheetSectionTargets.ts — Phase 1 (curriculum-aligned structure)
 *
 * Single source of truth for:
 *   - per-section question count targets (Recall / Understanding / Application / Challenge)
 *   - the marks → answer-lines ramp used by both the AI prompt and the renderer
 *   - the working-out-box triggers used to identify maths-style calculation
 *     questions that need a dot-grid working area above the answer line(s)
 *   - the canonical EAL L1 language list used by the SEND content rules
 *
 * Used by:
 *   - client/src/lib/ai.ts                         (prompt assembly)
 *   - client/src/lib/worksheet-generator.ts        (deterministic plan builder)
 *   - client/src/lib/worksheetConstraints.ts       (plan validation cap)
 *   - client/src/components/WorksheetRenderer.tsx  (per-question rendering)
 *   - client/src/lib/worksheetPostValidator.ts     (count enforcement)
 *
 * Why a dedicated module: the literal `qs: 3` and the `markCount<=1?1:…`
 * ramp used to live in two unrelated files and drift apart. Centralising
 * means a teacher-driven change to "make Recall 8 questions" is one edit.
 */

// ─── Per-section question targets ──────────────────────────────────────────

/**
 * Per-section question counts. The AI is instructed to hit `target`; the
 * post-validator accepts anything in [min, max]. Application is fixed at 5
 * because Section 3 is exam-style and inconsistent counts undermine
 * paper-density expectations.
 *
 * KS3/KS4 secondary worksheets only. Primary uses a separate, simpler
 * structure (5-4-5 — see `PRIMARY_SECTION_QUESTION_TARGETS`).
 */
export const SECTION_QUESTION_TARGETS = {
  recall:        { min: 6, target: 7, max: 8 },
  understanding: { min: 6, target: 7, max: 8 },
  application:   { min: 5, target: 5, max: 5 },
  challenge:     { min: 1, target: 1, max: 1 },
} as const;

/**
 * Lane 2.4 — bumped from the legacy 3/3/3 (which left primary
 * worksheets feeling sparse and underused page real estate) to the
 * audit-doc target of 5/4/5. The third section is renamed to "SHOW
 * WHAT YOU KNOW" downstream — it is exam-lite, not a re-skinned
 * GCSE Section 3, so a Year 4 pupil sees five short application
 * questions appropriate to their year band.
 *
 * 5 + 4 + 5 = 14 primary questions total. KS1 sheets stay at the
 * lower end of the min range to respect the 1-page print constraint
 * (W7 backlog item 3.9).
 */
export const PRIMARY_SECTION_QUESTION_TARGETS = {
  recall:        { min: 4, target: 5, max: 6 },
  understanding: { min: 3, target: 4, max: 5 },
  application:   { min: 4, target: 5, max: 6 },
} as const;

/** Total question count target for a secondary worksheet (7+7+5+1 = 20). */
export const TOTAL_QUESTIONS_TARGET =
  SECTION_QUESTION_TARGETS.recall.target +
  SECTION_QUESTION_TARGETS.understanding.target +
  SECTION_QUESTION_TARGETS.application.target +
  SECTION_QUESTION_TARGETS.challenge.target;

/** Acceptable upper-bound used by `validateWorksheetPlan` to fail-fast. */
export const TOTAL_QUESTIONS_HARD_CAP = 25;

/**
 * June 2026 — KS3-specific reduced targets. Year 7–9 worksheets are
 * shorter than KS4 to match the shorter attention spans and reading
 * levels. This produces 5+5+3+1 = 14 questions total for KS3, versus
 * 7+7+5+1 = 20 for KS4. Teacher feedback: "Worksheets too long for
 * Year 7, need to be a lot less writing. Make sentences, not paragraphs."
 */
export const KS3_SECTION_QUESTION_TARGETS = {
  recall:        { min: 4, target: 5, max: 6 },
  understanding: { min: 4, target: 5, max: 6 },
  application:   { min: 2, target: 3, max: 4 },
  challenge:     { min: 1, target: 1, max: 1 },
} as const;

/** Section keys in canonical order. */
export const SECTION_ORDER: Array<keyof typeof SECTION_QUESTION_TARGETS> = [
  "recall",
  "understanding",
  "application",
  "challenge",
];

/** Returns the question-number range a section covers (e.g. recall = 1..7). */
export function getSectionQuestionRange(
  section: keyof typeof SECTION_QUESTION_TARGETS,
  isPrimary = false,
): { firstQ: number; lastQ: number; targetCount: number } {
  const targets = isPrimary
    ? PRIMARY_SECTION_QUESTION_TARGETS as Record<string, { target: number }>
    : SECTION_QUESTION_TARGETS as Record<string, { target: number }>;
  // Primary doesn't have a "challenge" entry — fall back to 0 for that key.
  const order = isPrimary ? ["recall", "understanding", "application"] : SECTION_ORDER;
  let cursor = 1;
  for (const k of order) {
    const t = targets[k]?.target ?? 0;
    if (k === section) return { firstQ: cursor, lastQ: cursor + t - 1, targetCount: t };
    cursor += t;
  }
  return { firstQ: 0, lastQ: 0, targetCount: 0 };
}

// ─── Marks → answer-lines ramp ─────────────────────────────────────────────

/**
 * Layouts that render their own answer affordance (bubbles, pills, inline
 * blanks, drawing canvas). Per-question writing lines are NOT added for these
 * — the layout itself collects the answer.
 */
const NON_LINED_LAYOUTS = new Set<string>([
  "q-true-false", "true_false", "true-false",
  "q-mcq",        "mcq_2col",   "mcq", "multiple-choice",
  "q-gap-fill",   "gap_fill_inline", "gap-fill", "cloze",
  "q-matching",   "matching",
  "q-ordering",   "ordering",
  "q-label-diagram", "label_diagram", "label-diagram",
  "q-data-table", "table_complete", "data-table", "table-fill",
  "q-draw",       "draw_box", "q-circuit", "q-graph",
  "colour_label", "colour-label",
]);

/**
 * Marks → number of writing lines rendered per question.
 * Aligned to UK exam-paper densities (AQA / Edexcel / OCR):
 *   1m  ≈ 2 lines     (one short sentence)
 *   2m  ≈ 3 lines
 *   3m  ≈ 4 lines
 *   4m  ≈ 6 lines
 *   5–6m ≈ 8 lines     (6-mark band — sciences extended writing)
 *   7–8m ≈ 12 lines    (8-mark application; LOR-style)
 *   9+m  ≈ 14 lines    (9-mark synoptic; English Lit essay)
 *
 * Layouts that own their own answer rendering return 0 — the renderer skips
 * the lined block for those questions.
 */
export function linesForMarks(marks: number, layout?: string): number {
  if (layout && NON_LINED_LAYOUTS.has(String(layout).toLowerCase())) return 0;
  const m = Math.max(0, Math.floor(marks));
  if (m === 0) return 2;
  if (m === 1) return 2;
  if (m === 2) return 3;
  if (m === 3) return 4;
  if (m === 4) return 6;
  if (m <= 6)  return 8;
  if (m <= 8)  return 12;
  return 14;
}

// ─── Working-out box triggers (maths-style) ────────────────────────────────

/**
 * Stems matching this regex render a dot-grid Working-Out box ABOVE the
 * answer lines and a single capped "Final answer:" row BELOW. Covers the
 * standard UK exam command words for calculation in maths. Science
 * questions use standard writing lines rather than a dot-grid response area.
 *
 * Match is case-insensitive and word-boundary-anchored to avoid false
 * positives like "explain how to calculate" — we want stems that genuinely
 * ask the pupil to compute.
 */
export const WORKING_OUT_TRIGGER_RE =
  /\b(calculat\w*|work\s+out|show\s+(?:that|your\s+working)|find\s+the\s+value|solve|compute|evaluate\s+\d|determine\s+the\s+value|round\s+to|estimate\s+the)\b/i;

/**
 * Subjects whose questions default to having a working-out box on
 * calculation stems.
 *
 * The dot-grid is a dedicated Maths affordance. Science questions may require
 * calculation, but retain ordinary response lines to preserve their established
 * print structure and avoid introducing a second, competing visual system.
 */
const WORKING_OUT_SUBJECTS = ["math"];

/**
 * Decide whether a question gets a working-out box.
 *
 * Priority order:
 *   1. Explicit `workingOutBox` field on the section/question wins (true OR false).
 *   2. Layout `extended_answer_with_working` always gets one.
 *   3. A Maths calculation stem matching `WORKING_OUT_TRIGGER_RE` gets one.
 *   4. A Maths question worth at least 3 marks gets one.
 *
 * Returns `false` for non-Maths subjects by default so the dot-grid remains a
 * stable, predictable Maths-only affordance.
 */
export function shouldRenderWorkingOutBox(opts: {
  stem: string;
  marks: number;
  subject?: string;
  layout?: string;
  workingOutBox?: boolean | null;
}): boolean {
  if (typeof opts.workingOutBox === "boolean") return opts.workingOutBox;
  const layout = String(opts.layout || "").toLowerCase();
  if (layout === "extended_answer_with_working") return true;
  const subject = String(opts.subject || "").toLowerCase();
  const isMaths = WORKING_OUT_SUBJECTS.some((candidate) => subject.includes(candidate));
  if (!isMaths) return false;
  if (WORKING_OUT_TRIGGER_RE.test(opts.stem)) return true;
  if (opts.marks >= 3) return true;
  return false;
}

/** Working-out box height (in dot-grid rows) by marks. */
export function workingOutRowsForMarks(marks: number): number {
  const m = Math.max(0, Math.floor(marks));
  if (m <= 2) return 6;
  if (m <= 4) return 10;
  if (m <= 6) return 14;
  return 18;
}

// ─── EAL L1 language set (core UK first-languages) ─────────────────────────

/**
 * Core first languages spoken by EAL pupils in UK state-funded schools,
 * ordered by prevalence per DfE School Census pupil-characteristics data,
 * with Mirpuri (Pahari-Pothwari) added explicitly because UK census data
 * routinely subsumes it under Panjabi or Urdu — but pedagogically it is a
 * distinct Indo-Aryan variety dominant in many Pakistani heritage
 * communities (Birmingham, Bradford, Luton, Manchester) and warrants its
 * own gloss in EAL support material.
 *
 * Used by the EAL SEND content rules (Phase 4) to decide which L1 cognates
 * / glosses to surface alongside Tier-2 academic vocabulary. Hard-coded
 * because the list is stable year-on-year and we want deterministic prompt
 * output.
 */
export const EAL_L1_LANGUAGES = [
  "Urdu",
  "Polish",
  "Bengali",
  "Arabic",
  "Panjabi",
  "Mirpuri (Pahari-Pothwari)",
  "Romanian",
  "Somali",
  "Portuguese",
  "Turkish",
  "Tamil",
] as const;

export type EalL1Language = (typeof EAL_L1_LANGUAGES)[number];
