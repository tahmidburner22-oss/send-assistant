export interface PrimaryWorksheetPolicy {
  stage: "KS1" | "Lower KS2" | "Upper KS2";
  pupilFacingRules: string[];
}

/**
 * Returns prompt-ready instructional constraints. These rules preserve the
 * academic objective while controlling sentence burden, task progression and
 * child-facing presentation in non-protected primary worksheet routes.
 */
export function getPrimaryWorksheetPolicy(yearGroup: string): PrimaryWorksheetPolicy {
  const year = Number(/year\s*(\d+)/i.exec(yearGroup)?.[1] || 3);

  if (year <= 2) {
    return {
      stage: "KS1",
      pupilFacingRules: [
        "KS1 CONTENT: Teach one small, concrete objective only. Use one clearly modelled example before independent work.",
        "KS1 LANGUAGE: Every pupil-facing instruction must be one short sentence of no more than 8 words. Prefer familiar words and action verbs.",
        "KS1 TASKS: Use 3–5 short questions or choices per activity. Include a purposeful draw, match, sort, point, circle or tick task where it helps learning.",
        "KS1 ACCESS: Introduce no more than two new subject words. Put each necessary technical word next to a child-friendly explanation or labelled model.",
        "KS1 INTEGRITY: Do not use abstract secondary vocabulary, multi-clause instructions, decorative filler, or a task whose answer is supplied by its scaffold.",
      ],
    };
  }

  if (year <= 4) {
    return {
      stage: "Lower KS2",
      pupilFacingRules: [
        "LOWER KS2 CONTENT: Teach one precise objective through a model, guided practice and independent practice that becomes only slightly harder.",
        "LOWER KS2 LANGUAGE: Keep pupil-facing instructions to one sentence of no more than 12 words. Define new technical vocabulary at first use.",
        "LOWER KS2 TASKS: Use deliberate practice, labelled diagrams or data only when they help the objective, and one short explanation prompt.",
        "LOWER KS2 DESIGN: Use clear child-friendly section headings and purposeful visual grouping. Colour must never be the only way a pupil finds meaning.",
        "LOWER KS2 INTEGRITY: Do not infantilise the tone, overstuff a page, or use a harder prerequisite skill as an unstated barrier.",
      ],
    };
  }

  return {
    stage: "Upper KS2",
    pupilFacingRules: [
      "UPPER KS2 CONTENT: State a clear objective and success criterion. Sequence modelled, independent and reasoning work with age-appropriate academic vocabulary.",
      "UPPER KS2 LANGUAGE: Keep instructions direct and usually under 15 words. Define genuinely new subject terms without replacing the required term.",
      "UPPER KS2 TASKS: Include purposeful retrieval, practice and an explanation or reasoning opportunity. Use diagrams, tables or examples only where they teach.",
      "UPPER KS2 DESIGN: Use mature primary visual hierarchy, ample answer space and consistent labels. Colour must supplement text and symbols, never replace them.",
      "UPPER KS2 INTEGRITY: Avoid KS3 abstraction as core content, patronising decoration, and questions that test a hidden skill rather than the objective.",
    ],
  };
}

export function formatPrimaryWorksheetRules(yearGroup: string): string {
  const policy = getPrimaryWorksheetPolicy(yearGroup);
  return [`PRIMARY QUALITY STANDARD (${policy.stage}):`, ...policy.pupilFacingRules.map((rule) => `- ${rule}`)].join("\n");
}
