/**
 * promptSections/markSchemeContract.ts — PR-21
 *
 * Mark-scheme structural contract block. Defines what a mark scheme
 * must contain — itemised method (M) marks, accuracy (A) marks, and
 * a synonym block for accepted equivalents.
 */

export interface MarkSchemeContractInputs {
  examBoard?: string;
  marksTariff?: number[];
}

export function buildMarkSchemeContract(inputs: MarkSchemeContractInputs = {}): string {
  const tariff = (inputs.marksTariff || []).filter((m) => Number.isFinite(m) && m > 0);
  const top = tariff.length > 0 ? Math.max(...tariff) : 0;
  const lines = [
    "MARK SCHEME CONTRACT",
    "- Mark scheme is teacher-only and lives in the dedicated mark-scheme section.",
    "- For multi-mark questions, itemise method marks (M1, M2, …) and accuracy marks (A1).",
    "- Provide an accepted-synonyms block per question whose answer is qualitative.",
    "- Numerical answers MUST include the units when the question is in a science / maths subject.",
  ];
  if (top >= 4) {
    lines.push(
      `- The longest stretch question (worth ${top} marks) MUST be itemised step-by-step with ONE mark per step.`,
    );
  }
  return lines.join("\n");
}
