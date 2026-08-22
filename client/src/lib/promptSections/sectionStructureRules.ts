/**
 * promptSections/sectionStructureRules.ts — PR-21
 *
 * The per-Q structural contract block. Mirrors the inline copy
 * inside `ai.ts:structuredSystemSections` but is safe to import
 * standalone. No external state.
 */

export interface SectionStructureInputs {
  yearGroup?: string;
}

const Y9_PLUS_RE = /Y(?:ear)?\s*(?:9|1[0-3])|KS4|KS5|GCSE|A[\s-]?Level/i;

export function buildSectionStructureRules(inputs: SectionStructureInputs = {}): string {
  const isY9Plus = Y9_PLUS_RE.test(String(inputs.yearGroup || ""));
  const lines = [
    "STRUCTURE CONTRACT",
    "- Each worksheet contains: 1 Learning Objective, 1 Word Bank, 1 Worked Example, 7 Questions, 1 Mark Scheme (teacher-only), 1 Self-Reflection, 1 Revision Tips.",
    "- Question section types are kebab-case: q-mcq, q-short-answer, q-extended.",
    "- Every question carries `marks`, `commandWord`, `answerLines`. Y9+ questions also carry `specRef`, `ao`, `bloomLevel`.",
  ];
  if (isY9Plus) {
    lines.push(
      "- Y9+ ONLY: at least one question MUST be the longest-mark stretch question (5+ marks). Mark scheme MUST itemise M/A marks (method/accuracy).",
    );
  }
  return lines.join("\n");
}
