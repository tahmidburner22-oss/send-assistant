import {
  getBaselineQuestions,
  plannedAssessmentSeconds,
  totalAssessmentMarks,
  type BaselineQuestion,
} from "./baselineAssessmentBank";

export type AcademicSubject = "mathematics" | "english" | "science";
export type AssessmentDuration = 15 | 30 | 60;
export type QuestionKind = "multiple-choice" | "short-answer";

export interface ScreeningItem {
  id: string;
  subject: AcademicSubject;
  yearGroup: string;
  domain: string;
  kind: QuestionKind;
  prompt: string;
  context?: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
  marks: number;
  suggestedSeconds: number;
  curriculumReference: string;
  partialMarkKeywords?: string[][];
}

export interface ScreeningConfig {
  subject: AcademicSubject;
  yearGroup: string;
  duration: AssessmentDuration;
}

export interface DomainResult {
  domain: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface ScreeningReport {
  score: number;
  total: number;
  percentage: number;
  timeTakenSeconds: number;
  domainResults: DomainResult[];
  strengths: string[];
  focusAreas: string[];
  revisionTips: string[];
  curriculumAge: string;
  curriculumAgeMonths: number;
  itemResults: Array<{
    itemId: string;
    correct: boolean;
    expectedAnswer: string;
    explanation: string;
    marksAwarded: number;
    marksAvailable: number;
  }>;
}

/** The assessment length maps directly to a coherent subset of the 12-item baseline. */
const ITEM_COUNTS: Record<AssessmentDuration, number> = { 15: 5, 30: 8, 60: 12 };

function toScreeningItem(question: BaselineQuestion): ScreeningItem {
  return { ...question };
}

export function getItemCount(duration: AssessmentDuration): number {
  return ITEM_COUNTS[duration];
}

export function getAssessmentBlueprint(config: ScreeningConfig): {
  itemCount: number;
  totalMarks: number;
  plannedSeconds: number;
  domains: string[];
} {
  const items = buildAcademicScreening(config);
  return {
    itemCount: items.length,
    totalMarks: totalAssessmentMarks(items),
    plannedSeconds: plannedAssessmentSeconds(items),
    domains: Array.from(new Set(items.map((item) => item.domain))),
  };
}

/**
 * Selects a progressively broader slice of a fixed, year-specific baseline.
 * The ordered sequence begins with secure foundation knowledge and moves into
 * application, reasoning and evaluation for longer assessment windows.
 */
export function buildAcademicScreening(config: ScreeningConfig): ScreeningItem[] {
  const questions = getBaselineQuestions(config.subject, config.yearGroup);
  return questions.slice(0, getItemCount(config.duration)).map(toScreeningItem);
}

function normaliseAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[\s,]+/g, " ")
    .replace(/²/g, "2")
    .replace(/[.]+$/g, "");
}

function isCorrect(item: ScreeningItem, answer: string): boolean {
  // Choices are supplied by the interface and must preserve punctuation-sensitive distinctions.
  if (item.kind === "multiple-choice") return answer.trim().toLocaleLowerCase() === item.correctAnswer.trim().toLocaleLowerCase();
  const candidate = normaliseAnswer(answer);
  const accepted = [item.correctAnswer, ...(item.acceptedAnswers || [])].map(normaliseAnswer);
  return accepted.includes(candidate);
}

function marksForResponse(item: ScreeningItem, answer: string): number {
  if (isCorrect(item, answer)) return item.marks;
  if (!item.partialMarkKeywords?.length) return 0;
  const candidate = normaliseAnswer(answer);
  const componentMarks = item.partialMarkKeywords.reduce((total, alternatives) => {
    const hasComponent = alternatives.some((term) => candidate.includes(normaliseAnswer(term)));
    return total + (hasComponent ? 1 : 0);
  }, 0);
  return Math.min(item.marks, componentMarks);
}

export function markAcademicScreening(
  items: ScreeningItem[],
  answers: Record<string, string>,
  config: ScreeningConfig,
  timeTakenSeconds: number,
): ScreeningReport {
  const itemResults = items.map((item) => {
    const answer = answers[item.id] || "";
    const marksAwarded = marksForResponse(item, answer);
    const correct = marksAwarded === item.marks;
    return {
      itemId: item.id,
      correct,
      expectedAnswer: item.correctAnswer,
      explanation: item.explanation,
      marksAwarded,
      marksAvailable: item.marks,
    };
  });
  const score = itemResults.reduce((sum, result) => sum + result.marksAwarded, 0);
  const total = itemResults.reduce((sum, result) => sum + result.marksAvailable, 0);
  const percentage = Math.round((score / Math.max(total, 1)) * 100);
  const domains = Array.from(new Set(items.map((item) => item.domain)));
  const domainResults = domains.map((domain) => {
    const matching = items.map((item, index) => ({ item, result: itemResults[index] })).filter(({ item }) => item.domain === domain);
    const correct = matching.reduce((sum, { result }) => sum + result.marksAwarded, 0);
    const total = matching.reduce((sum, { result }) => sum + result.marksAvailable, 0);
    return { domain, correct, total, percentage: Math.round((correct / Math.max(total, 1)) * 100) };
  });
  const strengths = domainResults.filter((result) => result.percentage >= 75).map((result) => result.domain);
  const focusAreas = domainResults.filter((result) => result.percentage < 60).map((result) => result.domain);
  const revisionTips = focusAreas.map((domain) => revisionTip(config.subject, domain));
  const curriculumAgeMonths = curriculumAgeMonthsFor(config.yearGroup, percentage);
  return {
    score,
    total,
    percentage,
    timeTakenSeconds,
    domainResults,
    strengths,
    focusAreas,
    revisionTips,
    curriculumAge: formatAge(curriculumAgeMonths),
    curriculumAgeMonths,
    itemResults,
  };
}

function revisionTip(subject: AcademicSubject, domain: string): string {
  const tips: Record<AcademicSubject, Record<string, string>> = {
    mathematics: {
      Number: "Revisit number methods with short retrieval practice, then show each step and check whether the final value is reasonable.",
      Fractions: "Use bar models and common denominators before practising equivalent fractions and fraction operations.",
      "Ratio and proportion": "Represent the relationship with a ratio table, find one part, and then scale carefully.",
      Algebra: "Write one line for each algebraic step and check an answer by substitution.",
      Geometry: "Draw and label a diagram before choosing a formula, theorem or angle fact.",
      Statistics: "Identify the data type, then state the calculation or graph feature needed before working.",
      Probability: "List possible outcomes, then use favourable outcomes over total outcomes or a probability tree.",
    },
    english: {
      Vocabulary: "Build a precise vocabulary log: definition, connotation, synonym and one analytical sentence for each word.",
      "Grammar and punctuation": "Edit one sentence at a time, checking clause boundaries, punctuation choices and agreement.",
      Reading: "Select a short quotation, name the word or method, and explain exactly what it suggests.",
      "Language analysis": "Use a What–How–Why structure: identify the choice, explain its connotations, then link to the writer's purpose.",
      Structure: "Track how the writer moves focus, time or perspective and explain the effect on the reader.",
      Comparison: "Write one linked sentence that makes a point about both texts, using a precise comparative connective.",
      "Writing craft": "Plan audience, purpose and form before drafting; then make every language choice support that purpose.",
      "Technical accuracy": "Proofread in two passes: first for sentence boundaries, then for spelling, apostrophes and agreement.",
      Literature: "Link a clear point to a method and short quotation, then explain how it develops a theme or character.",
      Evaluation: "Make a clear judgement and support it with a precise method or detail from the text.",
      "Vocabulary and Meaning": "Build a personal word log: definition, synonym and an original sentence for each new word.",
      "Grammar and Punctuation": "Edit one short paragraph at a time, checking capitals, sentence endings and subject–verb agreement.",
      "Reading Comprehension": "Underline the exact words that support an answer, then turn them into a complete sentence.",
      "Sentence Craft": "Combine two simple sentences using a precise connective and reread aloud for clarity.",
      Spelling: "Practise the word in a sentence, then use look–cover–write–check to secure the spelling pattern.",
    },
    science: {
      Biology: "Use labelled diagrams and explain each process with a cause, a change and an outcome.",
      Chemistry: "Build a dual-code glossary: the scientific term on one side and a particle or reaction sketch on the other.",
      Physics: "Write the formula, substitute units, calculate, then check whether the size of the answer is sensible.",
      "Working scientifically": "Plan mini-investigations by naming the changed, measured and controlled variables before collecting results.",
    },
  };
  return tips[subject][domain] || "Review the marked questions, identify the first missed step and complete three similar questions with feedback.";
}

function curriculumAgeMonthsFor(yearGroup: string, percentage: number): number {
  const year = Number(yearGroup.replace(/\D/g, "")) || 7;
  const expectedMonths = (year + 4) * 12 + 6;
  const adjustment = percentage >= 85 ? 24 : percentage >= 70 ? 9 : percentage >= 55 ? 0 : percentage >= 40 ? -12 : -24;
  return Math.max(84, Math.min(216, expectedMonths + adjustment));
}

function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return `${years} years ${remainder} months`;
}

export const SUBJECT_LABELS: Record<AcademicSubject, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
};
