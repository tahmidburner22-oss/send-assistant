import type { GoldTheme, GoldWorksheet } from "@/lib/mathsGoldRenderer";

export interface GoldAdaptationNote {
  id: "send" | "reading-age";
  label: string;
  detail: string;
}

export interface GoldAdaptationInput {
  sendNeedId?: string;
  readingAge?: number;
  sendTheme?: GoldTheme;
}

export interface GoldAdaptationResult {
  worksheet: GoldWorksheet;
  notes: GoldAdaptationNote[];
}

const SEND_SUPPORT_DETAILS: Record<string, string> = {
  dyslexia: "White worksheet surface, clear sans-serif text, reinforced coloured outlines, and a visible support indicator.",
  adhd: "Calm white surface and readable task spacing.",
  asc: "Consistent visual routine, clear wording, and calm white surface.",
  asperger: "Consistent visual routine, clear wording, and calm white surface.",
  eal: "Clear spacing and straightforward instruction wording.",
  mld: "Clear standard-width type, a white worksheet surface, and short direct prompts.",
  slcn: "Straightforward wording, clear standard-width type, and short direct prompts.",
  dyscalculia: "Readable number layout, clear type, and consistent mathematical notation.",
  "working-memory": "A consistent page routine, white worksheet surface, and reinforced outlines to support place-keeping.",
  dyspraxia: "Clear standard-width type, white worksheet surface, and reinforced coloured outlines for visual tracking.",
  vi: "High-contrast text with the largest geometry-safe type scale.",
  hi: "Clear written prompts and a consistent page routine.",
  anxiety: "Calm white surface and direct, low-pressure wording.",
  semh: "Calm white surface and direct, low-pressure wording.",
  "pda-odd": "Low-demand wording with a calm, consistent visual routine.",
  tourettes: "Calm white surface and a consistent page routine.",
  "older-learners": "Age-appropriate typography and clear, direct prompts.",
};

const READING_AGE_REPLACEMENTS: Array<{ maxAge: number; replacements: Array<[RegExp, string]> }> = [
  {
    maxAge: 8,
    replacements: [
      [/\bcalculate\b/gi, "work out"],
      [/\bdetermine\b/gi, "find"],
      [/\bevaluate\b/gi, "work out"],
      [/\bidentify\b/gi, "find"],
      [/\bapproximately\b/gi, "about"],
      [/\btherefore\b/gi, "so"],
      [/\bsubstitute\b/gi, "put in"],
      [/\bexpression\b/gi, "number sentence"],
    ],
  },
  {
    maxAge: 10,
    replacements: [
      [/\bcalculate\b/gi, "work out"],
      [/\bdetermine\b/gi, "find"],
      [/\bevaluate\b/gi, "work out"],
      [/\bidentify\b/gi, "find"],
      [/\bapproximately\b/gi, "about"],
      [/\btherefore\b/gi, "so"],
    ],
  },
  {
    maxAge: 12,
    replacements: [
      [/\bdetermine\b/gi, "find"],
      [/\bevaluate\b/gi, "work out"],
      [/\bidentify\b/gi, "find"],
      [/\btherefore\b/gi, "so"],
    ],
  },
];

function cloneWorksheet(worksheet: GoldWorksheet): GoldWorksheet {
  return JSON.parse(JSON.stringify(worksheet)) as GoldWorksheet;
}

function languageProfile(age: number): string {
  if (age <= 8) return "Reading age " + age + ": everyday words and very short instructions";
  if (age <= 10) return "Reading age " + age + ": plain words and short direct instructions";
  if (age <= 12) return "Reading age " + age + ": clear secondary-school wording with brief explanations";
  if (age <= 14) return "Reading age " + age + ": natural GCSE-ready wording";
  return "Reading age " + age + ": precise, age-appropriate Maths wording";
}

function simplifyText(text: string, readingAge?: number): string {
  if (!readingAge || readingAge >= 13) return text;
  const profile = READING_AGE_REPLACEMENTS.find((item) => readingAge <= item.maxAge);
  if (!profile) return text;
  return profile.replacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
}

function adaptTextFields(worksheet: GoldWorksheet, readingAge?: number): void {
  if (!readingAge) return;
  worksheet.objective = simplifyText(worksheet.objective, readingAge);

  const info = worksheet.info_boxes;
  info.key_terms.title = simplifyText(info.key_terms.title, readingAge);
  info.key_terms.content = info.key_terms.content.map((paragraph) => ({
    ...paragraph,
    text: simplifyText(paragraph.text, readingAge),
  }));
  info.what_we_learn.title = simplifyText(info.what_we_learn.title, readingAge);
  info.what_we_learn.examples = info.what_we_learn.examples.map((example) => ({
    ...example,
    desc: simplifyText(example.desc, readingAge),
  }));
  info.key_idea.title = simplifyText(info.key_idea.title, readingAge);
  info.key_idea.text = simplifyText(info.key_idea.text, readingAge);
  info.key_idea.caption = simplifyText(info.key_idea.caption, readingAge);

  worksheet.modelled_examples = worksheet.modelled_examples.map((example) => ({
    ...example,
    label: simplifyText(example.label || "", readingAge),
    question: simplifyText(example.question || "", readingAge),
    steps: (example.steps || []).map((step) => simplifyText(step, readingAge)),
    explanation: simplifyText(example.explanation || "", readingAge),
  }));

  worksheet.practice = worksheet.practice.map((section) => ({
    ...section,
    heading: simplifyText(section.heading, readingAge),
    instruction: simplifyText(section.instruction, readingAge),
    // Expressions, answer values, ids, colours, and linked examples remain unchanged.
  }));
  worksheet.challenge = {
    ...worksheet.challenge,
    problems: (worksheet.challenge.problems || []).map((problem) => ({
      ...problem,
      text: simplifyText(problem.text, readingAge),
    })),
  };
}

/**
 * Apply deterministic, schema-preserving adaptations to an approved Maths JSON template.
 * It never changes array sizes, question expressions, answers, colours, IDs, or section order.
 */
export function applyGoldMathsAdaptations(
  source: GoldWorksheet,
  input: GoldAdaptationInput = {},
): GoldAdaptationResult {
  const worksheet = cloneWorksheet(source);
  const notes: GoldAdaptationNote[] = [];
  const sendNeedId = input.sendNeedId?.trim().toLowerCase();
  const readingAge = Number.isFinite(input.readingAge) && (input.readingAge || 0) > 0
    ? Math.max(5, Math.min(17, Math.round(input.readingAge || 0)))
    : undefined;

  if (sendNeedId) {
    notes.push({
      id: "send",
      label: input.sendTheme?.label || "SEND support",
      detail: SEND_SUPPORT_DETAILS[sendNeedId] || "Clear typography and a white, outline-only worksheet surface.",
    });
  }

  if (readingAge) {
    adaptTextFields(worksheet, readingAge);
    notes.push({
      id: "reading-age",
      label: languageProfile(readingAge),
      detail: "Vocabulary and instructional wording are adjusted without changing questions, equations, answers, box allocation, or page structure.",
    });
  }

  return { worksheet, notes };
}
