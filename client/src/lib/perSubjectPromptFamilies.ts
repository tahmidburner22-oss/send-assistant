/**
 * perSubjectPromptFamilies.ts — PR-20 / audit item #46.
 *
 * Per-subject prompt-family registry. Pure. Ships dark behind
 * `PROMPT_FAMILIES_ENABLED=true`.
 *
 * Until now `aiGenerateWorksheet` used a single mega-prompt for every
 * subject, with subject-specific behaviour spread across nested
 * conditionals. This module declares one focused family per subject
 * with a small, named payload. A future PR can swap the inline
 * conditionals for `lookupPromptFamily(subject)` and let the variant
 * carve-up handle the rest.
 *
 * The family payload is intentionally narrow:
 *
 *   - `header`            — the manifesto line ("You are a UK GCSE …").
 *   - `extraDirectives`   — the subject-specific bullet list.
 *   - `forbiddenPatterns` — lists of phrases the subject MUST never
 *                           emit (e.g. miles in maths, plot summary
 *                           in English Lit).
 */

export type PromptFamilyKey = "maths" | "science" | "english-lit" | "english-lang" | "humanities" | "creative" | "general";

export interface PromptFamily {
  key: PromptFamilyKey;
  header: string;
  extraDirectives: string[];
  forbiddenPatterns: string[];
}

export const PROMPT_FAMILIES: Readonly<Record<PromptFamilyKey, PromptFamily>> = Object.freeze({
  maths: {
    key: "maths",
    header: "You are a UK GCSE Mathematics teacher producing pupil-facing worksheets.",
    extraDirectives: [
      "Always show the method line (M marks) and the accuracy line (A marks).",
      "Use UK conventions: km/h, kg, °C. Never miles, lbs, °F.",
      "Set workingOutBox=true on every calculation question.",
    ],
    forbiddenPatterns: ["mph", "lbs", "°F", "fahrenheit"],
  },
  science: {
    key: "science",
    header: "You are a UK GCSE Combined Science teacher producing pupil-facing worksheets.",
    extraDirectives: [
      "Quote the formula → substitute → evaluate. SI units on every numerical answer.",
      "Reference Required Practical work where the topic supports it.",
      "Working-Scientifically AOs (AO1/AO2/AO3) must be visible in the question stems.",
    ],
    forbiddenPatterns: ["dot-grid working out", "workingOutBox: true"],
  },
  "english-lit": {
    key: "english-lit",
    header: "You are a UK GCSE English Literature teacher producing pupil-facing worksheets.",
    extraDirectives: [
      "Embed quotations <6 words inside sentences, then analyse a SINGLE word.",
      "Link every analytical point back to the writer's intent.",
      "Reference the writer's surname, never just the first name.",
    ],
    forbiddenPatterns: ["plot summary", "what happens next"],
  },
  "english-lang": {
    key: "english-lang",
    header: "You are a UK GCSE English Language teacher producing pupil-facing worksheets.",
    extraDirectives: [
      "Name the technique (simile, plosive, modal verb), then comment on the EFFECT on the reader.",
      "Use AQA / Edexcel / OCR / WJEC / CCEA mark-band vocabulary.",
    ],
    forbiddenPatterns: [],
  },
  humanities: {
    key: "humanities",
    header: "You are a UK GCSE History / Geography / RE teacher producing pupil-facing worksheets.",
    extraDirectives: [
      "Anchor every claim to a date, named source or named figure.",
      "Use 'however' and 'as a result' so causal chains are explicit.",
      "Reach a balanced judgement at the end of every extended-answer question.",
    ],
    forbiddenPatterns: [],
  },
  creative: {
    key: "creative",
    header: "You are a UK GCSE Art / Music / Drama / Design teacher producing pupil-facing worksheets.",
    extraDirectives: [
      "Reference a named practitioner / artist / composer for every claim.",
      "Link evaluation to the brief's intended audience.",
    ],
    forbiddenPatterns: [],
  },
  general: {
    key: "general",
    header: "You are a UK secondary-school teacher producing pupil-facing worksheets.",
    extraDirectives: [
      "Use plain UK English. UK National Curriculum vocabulary throughout.",
    ],
    forbiddenPatterns: [],
  },
});

/** Conservative classifier — falls back to "general" for anything
 *  that doesn't match. Mirrors the classifier in
 *  promptSections/subjectFamilyDirectives.ts. */
export function lookupPromptFamily(subject: string | undefined): PromptFamily {
  const s = String(subject || "").toLowerCase();
  if (/math/.test(s)) return PROMPT_FAMILIES.maths;
  if (/biology|chemistry|physics|science/.test(s)) return PROMPT_FAMILIES.science;
  if (/literature|english\s*lit/.test(s)) return PROMPT_FAMILIES["english-lit"];
  if (/english\s*lang|language/.test(s)) return PROMPT_FAMILIES["english-lang"];
  if (/history|geography|religious|economics/.test(s)) return PROMPT_FAMILIES.humanities;
  if (/art|music|drama|design/.test(s)) return PROMPT_FAMILIES.creative;
  return PROMPT_FAMILIES.general;
}

/** Render a family as a prompt block. Used by the new prompt-section
 *  carve-up surface (`promptSections/index.ts`) and by the A/B
 *  experiment payload registry. */
export function renderPromptFamily(family: PromptFamily): string {
  const lines = [family.header, ...family.extraDirectives.map((d) => `- ${d}`)];
  if (family.forbiddenPatterns.length > 0) {
    lines.push("FORBIDDEN PATTERNS — never emit:");
    for (const fp of family.forbiddenPatterns) lines.push(`- ${fp}`);
  }
  return lines.join("\n");
}
