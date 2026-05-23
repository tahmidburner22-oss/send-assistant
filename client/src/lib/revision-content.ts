/**
 * revision-content.ts
 *
 * Content generation + selection helpers used by the Parent Portal's
 * "All-in-One Revision Session" phases.
 *
 * Why a single helper module instead of inline AI calls in each phase?
 *  • One place to keep prompts, retry/fallback logic, and JSON schema repair.
 *  • Phases stay presentational and easy to read.
 *  • Each helper has a deterministic fallback so the session continues even
 *    if every AI provider is unavailable.
 */
import { callAI, parseWithFixes } from "@/lib/ai";
import { TOPIC_BANK, type TopicEntry } from "@/lib/topic-bank";
import {
  FULL_QUIZ_BANK,
  getCategoriesBySubject,
  type QuizQuestion,
} from "@/lib/quiz-bank";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LessonScript {
  title: string;
  paragraphs: string[];
  keyTerms: Array<{ term: string; definition: string }>;
  workedExample: string;
}

export interface StretchQuestion {
  question: string;
  /** Plain-text expected answer (used for marking heuristic only). */
  expectedAnswer: string;
  marks: number;
  hint?: string;
  workedSolution?: string;
  /** When true, the question is numerical and we'll auto-mark; otherwise it
   *  is flagged as "to review" rather than wrong. */
  isNumerical: boolean;
}

export interface WorkedExample {
  scenario: string;
  steps: string[];
  finalAnswer: string;
}

export interface FlashCardSeed {
  front: string;
  back: string;
  hint?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function readingAgeFromYearGroup(yearGroup: string): number {
  const n = parseInt(yearGroup.replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(n)) return 12;
  // UK: Year N ≈ age N+5; reading age usually tracks chronological age.
  return Math.max(6, Math.min(18, n + 5));
}

function findTopicEntry(subjectId: string, topicLabel: string): TopicEntry | null {
  const bank = TOPIC_BANK[subjectId];
  if (!bank) return null;
  const lower = topicLabel.toLowerCase();
  return (
    bank.find((t) => t.topic.toLowerCase() === lower) ||
    bank.find((t) => lower.includes(t.topic.toLowerCase().split(" ")[0])) ||
    null
  );
}

interface ContentInput {
  subjectId: string;
  subjectLabel: string;
  topic: string;
  yearGroup: string;
  difficulty: "foundation" | "mixed" | "higher";
  readingAgeOverride?: number | null;
  sendNeeds?: string[];
}

function sendStyleNote(sendNeeds?: string[]): string {
  if (!sendNeeds || sendNeeds.length === 0) {
    return "Use short sentences (max 15 words), clear paragraph breaks, and friendly tone.";
  }
  const lower = sendNeeds.map((s) => s.toLowerCase());
  const notes: string[] = [
    "Use short sentences (max 15 words).",
    "Use plain English — avoid idioms and metaphors unless explained.",
    "One idea per paragraph, with clear breaks.",
  ];
  if (lower.some((n) => n.includes("dyslexia"))) {
    notes.push("Avoid italics. Use bold sparingly, only for key terms.");
  }
  if (lower.some((n) => n.includes("adhd"))) {
    notes.push("Open with a hook. Vary sentence length to keep attention.");
  }
  if (lower.some((n) => n.includes("asc") || n.includes("autism"))) {
    notes.push("Be literal. State things directly. No sarcasm or irony.");
  }
  if (lower.some((n) => n.includes("slcn") || n.includes("speech"))) {
    notes.push("Pre-teach vocabulary at the start. Define every new term.");
  }
  return notes.join(" ");
}

// ─── Lesson script ──────────────────────────────────────────────────────────

const LESSON_FALLBACK = (input: ContentInput): LessonScript => {
  const t = findTopicEntry(input.subjectId, input.topic);
  const keyTerms = (t?.keyVocabulary || []).slice(0, 4).map((term) => ({
    term,
    definition: `A key word for ${input.topic}.`,
  }));
  return {
    title: input.topic,
    paragraphs: [
      `Today's topic is ${input.topic}. Let's learn what it means and why it matters in ${input.subjectLabel}.`,
      `Take your time with each paragraph. If something doesn't make sense, you can pause and read it again.`,
      `When you're ready, write down two things you learned in your notes.`,
    ],
    keyTerms,
    workedExample:
      "We weren't able to load a worked example right now — the quiz that follows will still help you practise.",
  };
};

export async function generateLessonScript(input: ContentInput): Promise<LessonScript> {
  const readingAge = input.readingAgeOverride ?? readingAgeFromYearGroup(input.yearGroup);
  const sys =
    "You are a UK SEND-aware home-revision tutor. " +
    "You write a short, friendly lesson script for ONE topic, aimed at a single child. " +
    "You always reply with VALID JSON matching the schema given.";
  const usr =
    `Subject: ${input.subjectLabel}\n` +
    `Topic: ${input.topic}\n` +
    `Year group: ${input.yearGroup}\n` +
    `Reading age target: ${readingAge}\n` +
    `Difficulty tier: ${input.difficulty}\n\n` +
    `Style guidance: ${sendStyleNote(input.sendNeeds)}\n\n` +
    `Return JSON of shape:\n` +
    `{\n` +
    `  "title": string,\n` +
    `  "paragraphs": string[],          // 3–5 short paragraphs explaining the topic\n` +
    `  "keyTerms": Array<{ "term": string, "definition": string }>,  // exactly 4 items\n` +
    `  "workedExample": string          // ONE complete worked example, with steps shown on separate lines using "\\n"\n` +
    `}\n\n` +
    `Hard rules:\n` +
    `  • Every paragraph ≤ 60 words.\n` +
    `  • No markdown, no headings, no bullet symbols inside string values.\n` +
    `  • Do NOT include any text outside the JSON object.\n`;

  try {
    const { text } = await callAI(sys, usr, 1400, { responseFormat: "json_object" });
    const parsed = parseWithFixes(text);
    if (!parsed || typeof parsed !== "object") return LESSON_FALLBACK(input);
    const out: LessonScript = {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title : input.topic,
      paragraphs: Array.isArray(parsed.paragraphs)
        ? parsed.paragraphs.filter((p: unknown) => typeof p === "string" && p.trim().length > 0).slice(0, 6)
        : [],
      keyTerms: Array.isArray(parsed.keyTerms)
        ? parsed.keyTerms
            .filter((k: any) => k && typeof k.term === "string" && typeof k.definition === "string")
            .slice(0, 6)
        : [],
      workedExample: typeof parsed.workedExample === "string" ? parsed.workedExample : "",
    };
    if (out.paragraphs.length < 2) return LESSON_FALLBACK(input);
    return out;
  } catch {
    return LESSON_FALLBACK(input);
  }
}

// ─── Quiz questions (bank-first, AI fallback) ──────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Subject id → display name used in the quiz bank.
 * The bank uses sentence-case singular nouns ("Maths", "English").
 */
const QUIZ_BANK_SUBJECT_BY_ID: Record<string, string> = {
  mathematics: "Maths",
  maths: "Maths",
  english: "English",
  science: "Science",
  biology: "Science",
  chemistry: "Science",
  physics: "Science",
  history: "History",
  geography: "Geography",
};

/**
 * Try to pull questions from the existing question bank. Filters by
 * topic-substring (e.g. "Ratio and Proportion" → "ratio") so we get a
 * reasonable topic match without the user having to pick a category id.
 *
 * Returns up to `limit` shuffled questions, or null if the bank doesn't
 * cover this subject/topic well enough.
 */
export function pickBankQuiz(input: ContentInput, limit = 8): QuizQuestion[] | null {
  const bankSubject = QUIZ_BANK_SUBJECT_BY_ID[input.subjectId.toLowerCase()];
  if (!bankSubject) return null;
  const cats = getCategoriesBySubject(bankSubject);
  if (cats.length === 0) return null;

  const topicLower = input.topic.toLowerCase();
  const topicHead = topicLower.split(/\s+/)[0] || topicLower;

  // Score each category by topic-overlap + title overlap.
  const scored = cats.map((c) => {
    const t = c.title.toLowerCase();
    let score = 0;
    if (t === topicLower) score += 5;
    if (t.includes(topicHead)) score += 3;
    if (topicLower.includes(t.split(" ")[0])) score += 2;
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, 3);
  if (top.length === 0) return null;

  const pooled: QuizQuestion[] = top.flatMap((s) => s.c.questions);
  if (pooled.length < 4) return null;
  return shuffle(pooled).slice(0, Math.min(limit, pooled.length));
}

/** Last-resort: build a tiny generic recall quiz so the phase still runs. */
function quizFallback(input: ContentInput): QuizQuestion[] {
  return [
    {
      q: `Which of these best describes "${input.topic}" in ${input.subjectLabel}?`,
      options: [
        `A topic in ${input.subjectLabel} you'll meet in ${input.yearGroup}`,
        "A topic only studied at university",
        "A topic from a different subject",
        "Not part of any subject",
      ],
      answer: 0,
    },
  ];
}

/**
 * Picks 8 quiz questions from the bank where possible. If bank coverage is
 * thin, falls back to AI generation (slower) and finally to the canned
 * fallback above.
 */
export async function pickOrGenerateQuiz(
  input: ContentInput,
  limit = 8,
): Promise<{ questions: QuizQuestion[]; source: "bank" | "ai" | "fallback" }> {
  const bank = pickBankQuiz(input, limit);
  if (bank && bank.length >= 4) return { questions: bank, source: "bank" };

  // AI fallback.
  const sys =
    "You are a UK SEND-aware revision tutor. You write multiple-choice questions " +
    "for ONE specific topic. You always reply with VALID JSON.";
  const usr =
    `Subject: ${input.subjectLabel}\n` +
    `Topic: ${input.topic}\n` +
    `Year group: ${input.yearGroup}\n` +
    `Difficulty: ${input.difficulty}\n\n` +
    `Return JSON: { "questions": Array<{ "q": string, "options": [string,string,string,string], "answer": 0|1|2|3 }> }\n` +
    `Make exactly ${limit} questions. Avoid markdown. Use plain-English wording (max 25 words per question). ` +
    `Distractors must be plausible. Only ONE correct option per question.`;

  try {
    const { text } = await callAI(sys, usr, 1800, { responseFormat: "json_object" });
    const parsed = parseWithFixes(text);
    if (parsed && Array.isArray(parsed.questions)) {
      const cleaned: QuizQuestion[] = parsed.questions
        .filter(
          (q: any) =>
            q &&
            typeof q.q === "string" &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            q.options.every((o: unknown) => typeof o === "string") &&
            (q.answer === 0 || q.answer === 1 || q.answer === 2 || q.answer === 3),
        )
        .slice(0, limit);
      if (cleaned.length >= 3) return { questions: cleaned, source: "ai" };
    }
  } catch {
    // fall through to fallback
  }
  return { questions: quizFallback(input), source: "fallback" };
}

// ─── Stretch & apply: AI exam-style questions ──────────────────────────────

const STRETCH_FALLBACK = (input: ContentInput): StretchQuestion[] => [
  {
    question: `Write a short explanation in your own words of how ${input.topic} works in ${input.subjectLabel}. Use at least one example.`,
    expectedAnswer: "",
    marks: 4,
    hint: "Try starting with: 'In my own words, ...'",
    isNumerical: false,
  },
  {
    question: `Give one example where ${input.topic} is useful in real life. Explain why it matters.`,
    expectedAnswer: "",
    marks: 3,
    isNumerical: false,
  },
];

export async function generateStretchQuestions(
  input: ContentInput,
  count = 3,
): Promise<StretchQuestion[]> {
  const sys =
    "You are a UK exam tutor. You write exam-style questions for ONE topic, " +
    "tiered to the difficulty given. You always reply with VALID JSON.";
  const usr =
    `Subject: ${input.subjectLabel}\n` +
    `Topic: ${input.topic}\n` +
    `Year group: ${input.yearGroup}\n` +
    `Difficulty tier: ${input.difficulty}\n` +
    `Style: ${sendStyleNote(input.sendNeeds)}\n\n` +
    `Return JSON: { "questions": Array<{\n` +
    `  "question": string,           // the prompt the pupil answers\n` +
    `  "expectedAnswer": string,     // the model answer in 1–2 sentences\n` +
    `  "marks": number,              // 2–6 marks\n` +
    `  "hint": string,               // ONE step that nudges them — never gives the full answer\n` +
    `  "workedSolution": string,     // full step-by-step solution\n` +
    `  "isNumerical": boolean        // true ONLY if the expected answer is purely numerical\n` +
    `}> }\n\n` +
    `Make exactly ${count} questions, escalating from easier to harder. ` +
    `For ${input.subjectLabel}, mix recall and application. Plain English only.`;

  try {
    const { text } = await callAI(sys, usr, 1800, { responseFormat: "json_object" });
    const parsed = parseWithFixes(text);
    if (parsed && Array.isArray(parsed.questions)) {
      const cleaned = parsed.questions
        .filter(
          (q: any) =>
            q &&
            typeof q.question === "string" &&
            typeof q.expectedAnswer === "string",
        )
        .map((q: any): StretchQuestion => ({
          question: q.question,
          expectedAnswer: q.expectedAnswer,
          marks: typeof q.marks === "number" ? Math.max(1, Math.min(8, Math.round(q.marks))) : 3,
          hint: typeof q.hint === "string" ? q.hint : undefined,
          workedSolution: typeof q.workedSolution === "string" ? q.workedSolution : undefined,
          isNumerical: !!q.isNumerical,
        }))
        .slice(0, count);
      if (cleaned.length >= 1) return cleaned;
    }
  } catch {
    // fall through
  }
  return STRETCH_FALLBACK(input);
}

// ─── Stretch & apply: AI worked examples ───────────────────────────────────

export async function generateWorkedExamples(
  input: ContentInput,
  count = 2,
): Promise<WorkedExample[]> {
  const sys =
    "You are a SEND-aware tutor. You walk a child through a problem step by " +
    "step, explaining each line. You always reply with VALID JSON.";
  const usr =
    `Subject: ${input.subjectLabel}\n` +
    `Topic: ${input.topic}\n` +
    `Year group: ${input.yearGroup}\n` +
    `Difficulty tier: ${input.difficulty}\n\n` +
    `Return JSON: { "examples": Array<{ "scenario": string, "steps": string[], "finalAnswer": string }> }\n` +
    `Make exactly ${count} examples. Each "steps" array is 4–7 short steps. Plain English only.`;
  try {
    const { text } = await callAI(sys, usr, 1400, { responseFormat: "json_object" });
    const parsed = parseWithFixes(text);
    if (parsed && Array.isArray(parsed.examples)) {
      const cleaned: WorkedExample[] = parsed.examples
        .filter(
          (e: any) =>
            e &&
            typeof e.scenario === "string" &&
            Array.isArray(e.steps) &&
            e.steps.every((s: unknown) => typeof s === "string"),
        )
        .map((e: any): WorkedExample => ({
          scenario: e.scenario,
          steps: e.steps.slice(0, 8),
          finalAnswer: typeof e.finalAnswer === "string" ? e.finalAnswer : "",
        }))
        .slice(0, count);
      if (cleaned.length >= 1) return cleaned;
    }
  } catch {}
  return [
    {
      scenario: `A worked example for ${input.topic}.`,
      steps: [
        "We weren't able to load a worked example right now.",
        "Try the questions in the previous phase to test your understanding.",
        "Ask a parent or teacher to walk through one with you next time.",
      ],
      finalAnswer: "",
    },
  ];
}

// ─── Flashcard seed deck ───────────────────────────────────────────────────

/**
 * Build the flashcard deck the "Lock it in" phase will run, by combining
 *  • topic key vocabulary (from TOPIC_BANK or AI), and
 *  • any quiz questions the pupil got wrong or skipped.
 */
export function buildFlashcardSeeds(
  input: ContentInput,
  mistakes: Array<{ question: string; correctAnswer: string }>,
  lessonKeyTerms: Array<{ term: string; definition: string }> = [],
): FlashCardSeed[] {
  const topicEntry = findTopicEntry(input.subjectId, input.topic);
  const seeds: FlashCardSeed[] = [];

  // Quiz mistakes first — these are the highest-value reviews.
  for (const m of mistakes.slice(0, 6)) {
    seeds.push({
      front: m.question,
      back: m.correctAnswer,
      hint: "You missed this in the quiz — give it another go.",
    });
  }

  // Lesson key terms.
  for (const k of lessonKeyTerms.slice(0, 4)) {
    if (!seeds.some((s) => s.front.toLowerCase() === k.term.toLowerCase())) {
      seeds.push({ front: k.term, back: k.definition });
    }
  }

  // Bank vocabulary as a final filler so we always have enough cards.
  if (topicEntry?.keyVocabulary) {
    for (const v of topicEntry.keyVocabulary) {
      if (seeds.length >= 8) break;
      if (!seeds.some((s) => s.front.toLowerCase() === v.toLowerCase())) {
        seeds.push({
          front: v,
          back: `A key word for ${input.topic} — try to explain it in your own words.`,
        });
      }
    }
  }

  // Always provide at least 4 cards.
  if (seeds.length < 4) {
    while (seeds.length < 4) {
      seeds.push({
        front: `In your own words: what is ${input.topic}?`,
        back: `A topic in ${input.subjectLabel}.`,
      });
    }
  }

  return seeds.slice(0, 8);
}

// ─── Bank-only checker (used by the FULL_QUIZ_BANK guard) ──────────────────

export function totalBankCategories(): number {
  return FULL_QUIZ_BANK.length;
}
