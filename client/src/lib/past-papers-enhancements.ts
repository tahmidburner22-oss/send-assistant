/**
 * past-papers-enhancements.ts — Improvements layered onto Past Papers.
 *
 *  1. Per-question adaptation (apply Differentiate engine to one question)
 *  2. Examiner-style mark scheme commentary (plain-English notes)
 *  3. Question bank by topic + difficulty (cross-paper search)
 *  4. SEND-adapted exam pack builder (extra time, dyslexia font, large print)
 *  5. Student-side practice mode with auto-mark against AO grid
 */

// ── Shared types ────────────────────────────────────────────────────────────

export interface PastPaperQuestion {
  id: string;
  paper: string;          // e.g. "AQA GCSE Maths Higher 2023 Paper 1"
  year: number;
  topic: string;          // e.g. "simultaneous-equations"
  marks: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  text: string;
  markScheme: string;
  ao?: ("AO1" | "AO2" | "AO3")[];
}

// ── 1. Per-question adaptation ──────────────────────────────────────────────

export type AdaptationProfile =
  | "dyslexia"
  | "asc"
  | "adhd"
  | "eal"
  | "vi"           // visual impairment
  | "low-reading-age";

export interface AdaptationOptions {
  profile: AdaptationProfile;
  fontPx?: number;
  paper?: "white" | "cream" | "blue";
  largePrint?: boolean;
  extraTimePct?: number;     // 25 / 50 / 100
}

const PROFILE_DEFAULTS: Record<AdaptationProfile, AdaptationOptions> = {
  dyslexia:           { profile: "dyslexia", fontPx: 14, paper: "cream", largePrint: false, extraTimePct: 25 },
  asc:                { profile: "asc", fontPx: 12, paper: "white", largePrint: false, extraTimePct: 0 },
  adhd:               { profile: "adhd", fontPx: 12, paper: "white", largePrint: false, extraTimePct: 0 },
  eal:                { profile: "eal", fontPx: 12, paper: "white", largePrint: false, extraTimePct: 25 },
  vi:                 { profile: "vi", fontPx: 18, paper: "white", largePrint: true, extraTimePct: 50 },
  "low-reading-age":  { profile: "low-reading-age", fontPx: 14, paper: "white", largePrint: false, extraTimePct: 25 },
};

export function defaultsFor(profile: AdaptationProfile): AdaptationOptions {
  return { ...PROFILE_DEFAULTS[profile] };
}

export interface AdaptedQuestion {
  question: PastPaperQuestion;
  adaptedText: string;
  scaffolds: string[];
  options: AdaptationOptions;
}

export function adaptQuestion(q: PastPaperQuestion, opts: AdaptationOptions): AdaptedQuestion {
  const scaffolds: string[] = [];
  let adapted = q.text;

  if (opts.profile === "low-reading-age" || opts.profile === "eal") {
    // Simplify: split long sentences, glossary cue
    adapted = adapted.replace(/(\.|\?)\s+/g, "$1\n");
    scaffolds.push("Glossary box for any 3-syllable+ words.");
    scaffolds.push("Sentence stems for written response.");
  }
  if (opts.profile === "dyslexia") {
    scaffolds.push("Number each line of working.");
    scaffolds.push("Highlight key data with a coloured box.");
  }
  if (opts.profile === "asc") {
    scaffolds.push("Reword idioms literally.");
    scaffolds.push("Show the structure: 'Step 1, Step 2, Step 3'.");
  }
  if (opts.profile === "adhd") {
    scaffolds.push("Chunk into 3 sub-tasks with checkboxes.");
    scaffolds.push("Estimated time per chunk shown beside each.");
  }
  if (opts.profile === "vi") {
    scaffolds.push("Tactile / raised-line diagram for any figures.");
  }

  return { question: q, adaptedText: adapted, scaffolds, options: opts };
}

// ── 2. Mark-scheme commentary ───────────────────────────────────────────────

export interface MarkSchemeNote {
  excerpt: string;
  commentary: string;
}

export function commentaryForMarkScheme(markScheme: string): MarkSchemeNote[] {
  const lines = markScheme.split(/\n/).map((l) => l.trim()).filter(Boolean);
  return lines.slice(0, 12).map((line) => {
    let commentary = "Award the mark only if pupil writes this exact answer or a clear equivalent.";
    if (/oe\b/i.test(line))         commentary = "OE = 'or equivalent'. Accept any algebraic rearrangement that is mathematically the same.";
    if (/method\s*mark|m1|m2/i.test(line)) commentary = "Method mark — award even if final answer is wrong, provided the working uses the right approach.";
    if (/accuracy|a1|a2/i.test(line)) commentary = "Accuracy mark — only awarded if the value is correct (and a method mark is already secured).";
    if (/follow[\s-]*through|ft\b/i.test(line)) commentary = "Follow-through — accept consequential answer using the pupil's earlier (possibly wrong) value.";
    if (/seen|implied/i.test(line)) commentary = "Look for the working — the mark is implied by a correct interim value, not a final answer.";
    if (/maximum.*1\b/i.test(line)) commentary = "Cap — pupil cannot earn more than 1 here even if multiple correct features.";
    return { excerpt: line, commentary };
  });
}

// ── 3. Question bank search ─────────────────────────────────────────────────

export interface QuestionBankFilter {
  topic?: string;
  yearFrom?: number;
  yearTo?: number;
  marksFrom?: number;
  marksTo?: number;
  difficulty?: { min: 1 | 2 | 3 | 4 | 5; max: 1 | 2 | 3 | 4 | 5 };
  ao?: ("AO1" | "AO2" | "AO3")[];
}

export function searchQuestions(bank: PastPaperQuestion[], f: QuestionBankFilter): PastPaperQuestion[] {
  return bank.filter((q) => {
    if (f.topic && !q.topic.toLowerCase().includes(f.topic.toLowerCase())) return false;
    if (f.yearFrom !== undefined && q.year < f.yearFrom) return false;
    if (f.yearTo   !== undefined && q.year > f.yearTo)   return false;
    if (f.marksFrom !== undefined && q.marks < f.marksFrom) return false;
    if (f.marksTo   !== undefined && q.marks > f.marksTo)   return false;
    if (f.difficulty && (q.difficulty < f.difficulty.min || q.difficulty > f.difficulty.max)) return false;
    if (f.ao && f.ao.length > 0) {
      if (!q.ao || !f.ao.some((a) => q.ao!.includes(a))) return false;
    }
    return true;
  });
}

// ── 4. SEND-adapted exam pack builder ───────────────────────────────────────

export interface ExamPack {
  title: string;
  generatedAt: string;
  questions: AdaptedQuestion[];
  options: AdaptationOptions;
  totalMarks: number;
  estimatedMinutes: number;
}

export function buildExamPack(opts: {
  title: string;
  questions: PastPaperQuestion[];
  options: AdaptationOptions;
  baseMinutesPerMark?: number;     // default 1.2 min/mark for GCSE
}): ExamPack {
  const adapted = opts.questions.map((q) => adaptQuestion(q, opts.options));
  const total = adapted.reduce((a, q) => a + q.question.marks, 0);
  const baseMin = (opts.baseMinutesPerMark ?? 1.2) * total;
  const minutes = Math.ceil(baseMin * (1 + (opts.options.extraTimePct || 0) / 100));
  return {
    title: opts.title,
    generatedAt: new Date().toISOString(),
    questions: adapted,
    options: opts.options,
    totalMarks: total,
    estimatedMinutes: minutes,
  };
}

export function packAsText(p: ExamPack): string {
  return [
    p.title,
    `Generated ${new Date(p.generatedAt).toLocaleDateString("en-GB")}`,
    `Total marks: ${p.totalMarks} · Time: ${p.estimatedMinutes} min (incl. +${p.options.extraTimePct || 0}%)`,
    `Adaptations: ${p.options.profile}, ${p.options.fontPx}px ${p.options.paper} paper${p.options.largePrint ? ", large print" : ""}`,
    "─────────────────────────────",
    ...p.questions.flatMap((q, i) => [
      "",
      `Q${i + 1}. (${q.question.marks} marks) [${q.question.paper}]`,
      q.adaptedText,
      "Scaffolds:",
      ...q.scaffolds.map((s) => `  • ${s}`),
    ]),
  ].join("\n");
}

// ── 5. Auto-mark against AO grid ────────────────────────────────────────────

export interface PupilAttempt {
  questionId: string;
  text: string;
}

export interface MarkResult {
  questionId: string;
  awarded: number;
  maxMarks: number;
  feedback: string[];
  aoMissed: ("AO1" | "AO2" | "AO3")[];
}

const AO_KEYWORDS: Record<"AO1" | "AO2" | "AO3", RegExp[]> = {
  AO1: [/recall|state|name|define|formula/i],
  AO2: [/apply|calculate|solve|use the formula/i],
  AO3: [/justify|explain why|evaluate|critique|analyse/i],
};

/** Heuristic auto-mark — awards proportional to keyword overlap with mark scheme. */
export function autoMark(q: PastPaperQuestion, attempt: PupilAttempt): MarkResult {
  const schemeWords = (q.markScheme.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
  const attemptWords = new Set((attempt.text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []));
  const overlap = schemeWords.filter((w) => attemptWords.has(w)).length;
  const ratio = schemeWords.length === 0 ? 0 : Math.min(1, overlap / Math.max(1, schemeWords.length / 2));
  const awarded = Math.round(ratio * q.marks);
  const aoMissed: ("AO1" | "AO2" | "AO3")[] = [];
  if (q.ao) {
    for (const ao of q.ao) {
      const seen = AO_KEYWORDS[ao].some((rx) => rx.test(attempt.text));
      if (!seen) aoMissed.push(ao);
    }
  }
  const feedback: string[] = [];
  if (awarded < q.marks) feedback.push(`You missed ${q.marks - awarded} mark${q.marks - awarded === 1 ? "" : "s"} — review the mark scheme excerpt.`);
  if (aoMissed.length) feedback.push(`Lost marks on: ${aoMissed.join(", ")} — these are the assessment objectives the question targets.`);
  if (feedback.length === 0) feedback.push("Full marks — strong attempt.");
  return { questionId: q.id, awarded, maxMarks: q.marks, feedback, aoMissed };
}
