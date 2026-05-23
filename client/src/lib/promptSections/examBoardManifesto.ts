/**
 * promptSections/examBoardManifesto.ts — PR-21
 *
 * Awarding-body manifesto stub. Pure / deterministic.
 *
 * The full manifesto lives in `curriculumAuthorityPrompt.ts`. This
 * carve-up exposes a thin builder that the structured prompt assembly
 * can call to drop in the per-board header. Keeping the manifesto
 * itself in `curriculumAuthorityPrompt.ts` preserves the "single
 * source of truth" rule from the Phase 1–5 plan.
 */

export interface ExamBoardManifestoInputs {
  examBoard?: string;
  subject?: string;
  yearGroup?: string;
}

const BOARD_LABELS: Record<string, string> = {
  aqa: "AQA",
  edexcel: "Pearson Edexcel",
  ocr: "OCR",
  wjec: "WJEC",
  ccea: "CCEA",
};

export function buildExamBoardManifesto(inputs: ExamBoardManifestoInputs = {}): string {
  const board = String(inputs.examBoard || "").toLowerCase();
  const label = BOARD_LABELS[board];
  if (!label) return "";
  return [
    `EXAM-BOARD MANIFESTO — ${label}`,
    `- Use the awarding body's command-word vocabulary verbatim. Do not paraphrase.`,
    `- Mark schemes follow the ${label} M/A/B convention. Plausible distractors only.`,
    `- Spec codes must match a real ${label} spec point. Never invent codes.`,
  ].join("\n");
}
