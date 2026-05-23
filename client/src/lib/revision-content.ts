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
import {
  allPastPaperQuestions,
  type PastPaperQuestion,
} from "@/lib/pastPaperQuestions";
import type { RevisionSessionPlan } from "@/lib/revision-session-store";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WorkedExample {
  scenario: string;
  steps: string[];
  finalAnswer: string;
}

export interface LessonScript {
  /** Topic title for the lesson card. */
  title: string;
  /** Concrete "by the end of this lesson, you will be able to..." sentence. */
  objective: string;
  /** Short paragraph on why this topic is worth learning, in pupil-friendly terms. */
  whyItMatters: string;
  /** 5–7 short, age-appropriate teaching paragraphs that build the concept. */
  paragraphs: string[];
  /** 4–6 key terms, each with a one-sentence definition. */
  keyTerms: Array<{ term: string; definition: string }>;
  /** 2–3 fully worked examples showing the method step-by-step. */
  workedExamples: WorkedExample[];
  /** A single common-mistake / pitfall sentence (or two). */
  commonMistake: string;
  /** 3–5 short bullets summarising what the pupil should now remember. */
  recap: string[];
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

export interface FlashCardSeed {
  front: string;
  back: string;
  hint?: string;
}

export interface MaterialItem {
  icon: string;
  label: string;
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
    objective: `By the end of this lesson, you'll be able to explain what ${input.topic} means in ${input.subjectLabel} and use it on a question.`,
    whyItMatters:
      `${input.topic} comes up a lot in ${input.subjectLabel}. ` +
      `Once you understand the basics, lots of other topics get easier — that's why we revise it carefully.`,
    paragraphs: [
      `Today's topic is ${input.topic}. Let's learn what it means and why it matters in ${input.subjectLabel}.`,
      `Take your time with each paragraph. If something doesn't make sense, you can pause and read it again.`,
      `When you're ready, write down two things you noticed in your notes on the right.`,
    ],
    keyTerms,
    workedExamples: [
      {
        scenario: `A worked example for ${input.topic}.`,
        steps: [
          "We weren't able to load a worked example right now.",
          "Try the questions in the next phase to test what you know.",
          "If you're stuck, ask an adult to walk through one with you.",
        ],
        finalAnswer: "",
      },
    ],
    commonMistake:
      "A common mistake is rushing the first step. Read each question twice before you start writing.",
    recap: [
      `${input.topic} is something you'll see again across ${input.subjectLabel}.`,
      "Always start with what the question is asking.",
      "Show your steps — they help you and your teacher spot mistakes.",
    ],
  };
};

export async function generateLessonScript(input: ContentInput): Promise<LessonScript> {
  const readingAge = input.readingAgeOverride ?? readingAgeFromYearGroup(input.yearGroup);
  const sys =
    "You are a UK SEND-aware home-revision tutor. " +
    "You write rich, structured ten-minute lessons for ONE topic, aimed at a single child. " +
    "You always reply with VALID JSON matching the schema given. No markdown, no commentary outside the JSON.";
  const usr =
    `Subject: ${input.subjectLabel}\n` +
    `Topic: ${input.topic}\n` +
    `Year group: ${input.yearGroup}\n` +
    `Reading age target: ${readingAge}\n` +
    `Difficulty tier: ${input.difficulty}\n\n` +
    `Style guidance: ${sendStyleNote(input.sendNeeds)}\n\n` +
    `Aim for ROUGHLY 10 MINUTES of reading time (about 1500–2000 words total across all fields).\n\n` +
    `Return JSON of shape:\n` +
    `{\n` +
    `  "title": string,                                     // short topic title\n` +
    `  "objective": string,                                 // ONE sentence: "By the end of this lesson you'll be able to..."\n` +
    `  "whyItMatters": string,                              // ONE paragraph (40–80 words) on real-world / curriculum relevance\n` +
    `  "paragraphs": string[],                              // EXACTLY 5–7 teaching paragraphs that BUILD the concept from simple to complex; each 50–90 words\n` +
    `  "keyTerms": Array<{ "term": string, "definition": string }>,  // EXACTLY 4–6 items, each definition ≤ 20 words\n` +
    `  "workedExamples": Array<{                            // EXACTLY 2 OR 3 fully-worked examples\n` +
    `    "scenario": string,                                // the question being worked, written as a short prompt\n` +
    `    "steps": string[],                                 // 4–7 steps, each step is ONE sentence with a clear action\n` +
    `    "finalAnswer": string                              // the final answer in plain text (e.g. "x = 5", "The mean is 12.4 kg")\n` +
    `  }>,\n` +
    `  "commonMistake": string,                             // ONE or TWO sentences naming a common pupil mistake on this topic\n` +
    `  "recap": string[]                                    // EXACTLY 3–5 bullet sentences summarising the lesson\n` +
    `}\n\n` +
    `Hard rules:\n` +
    `  • Plain English suited to age ${readingAge}. No idioms.\n` +
    `  • Every paragraph stands alone — no "as we said before".\n` +
    `  • Use concrete numbers and small examples in the teaching paragraphs.\n` +
    `  • Worked example steps must each begin with a verb (Write, Multiply, Substitute, Read off, Check, etc.).\n` +
    `  • Do NOT include any text outside the JSON object.\n`;

  try {
    const { text } = await callAI(sys, usr, 3500, { responseFormat: "json_object" });
    const parsed = parseWithFixes(text);
    if (!parsed || typeof parsed !== "object") return LESSON_FALLBACK(input);

    const title =
      typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : input.topic;

    const paragraphs = Array.isArray(parsed.paragraphs)
      ? parsed.paragraphs
          .filter((p: unknown): p is string => typeof p === "string" && p.trim().length > 0)
          .slice(0, 8)
      : [];

    const keyTerms = Array.isArray(parsed.keyTerms)
      ? parsed.keyTerms
          .filter(
            (k: any): k is { term: string; definition: string } =>
              k && typeof k.term === "string" && typeof k.definition === "string",
          )
          .slice(0, 6)
      : [];

    const workedExamples: WorkedExample[] = Array.isArray(parsed.workedExamples)
      ? parsed.workedExamples
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
          .slice(0, 4)
      : [];

    const recap = Array.isArray(parsed.recap)
      ? parsed.recap
          .filter((r: unknown): r is string => typeof r === "string" && r.trim().length > 0)
          .slice(0, 6)
      : [];

    const out: LessonScript = {
      title,
      objective:
        typeof parsed.objective === "string" && parsed.objective.trim()
          ? parsed.objective.trim()
          : `By the end of this lesson, you'll understand ${input.topic} and be able to use it on a question.`,
      whyItMatters:
        typeof parsed.whyItMatters === "string" && parsed.whyItMatters.trim()
          ? parsed.whyItMatters.trim()
          : `${input.topic} is a key idea in ${input.subjectLabel} that comes up a lot.`,
      paragraphs,
      keyTerms,
      workedExamples,
      commonMistake:
        typeof parsed.commonMistake === "string" && parsed.commonMistake.trim()
          ? parsed.commonMistake.trim()
          : "A common mistake is rushing — read the question twice before you start.",
      recap,
    };

    // Defensive: if AI output is too thin, fall back so the lesson never feels empty.
    if (out.paragraphs.length < 3 || out.workedExamples.length < 1) {
      const fb = LESSON_FALLBACK(input);
      return {
        ...fb,
        ...out,
        paragraphs: out.paragraphs.length >= 3 ? out.paragraphs : fb.paragraphs,
        workedExamples:
          out.workedExamples.length >= 1 ? out.workedExamples : fb.workedExamples,
        recap: out.recap.length >= 3 ? out.recap : fb.recap,
      };
    }
    return out;
  } catch {
    return LESSON_FALLBACK(input);
  }
}

// ─── Quiz questions (bank-first, AI fallback) ──────────────────────────────

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

/**
 * Build 5–7 exam-style questions that, together, fill ~20 minutes of work.
 * Defaults to 6 if no count is supplied.
 */
export async function generateStretchQuestions(
  input: ContentInput,
  count = 6,
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
    `These ${count} questions together should fill about 20 minutes of working time. ` +
    `Mix shorter (2–3 marks) and longer (4–6 marks) questions, escalating from easier to harder. ` +
    `Avoid duplication of method.\n\n` +
    `Return JSON: { "questions": Array<{\n` +
    `  "question": string,           // the prompt the pupil answers\n` +
    `  "expectedAnswer": string,     // the model answer in 1–2 sentences\n` +
    `  "marks": number,              // 2–6 marks\n` +
    `  "hint": string,               // ONE step that nudges them — never gives the full answer\n` +
    `  "workedSolution": string,     // full step-by-step solution\n` +
    `  "isNumerical": boolean        // true ONLY if the expected answer is purely numerical\n` +
    `}> }\n\n` +
    `Make exactly ${count} questions. Plain English only.`;

  try {
    const { text } = await callAI(sys, usr, 3000, { responseFormat: "json_object" });
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

// ─── Past-paper picker (real questions from the bundled bank) ──────────────

export type PastPaperMatch = "exact" | "broad" | "subject" | "none";

export interface PastPaperPickResult {
  questions: PastPaperQuestion[];
  matchKind: PastPaperMatch;
}

/** Tier resolution from session difficulty. */
function tierForDifficulty(d: ContentInput["difficulty"]): "Higher" | "Foundation" | null {
  if (d === "higher") return "Higher";
  if (d === "foundation") return "Foundation";
  return null; // "mixed" — accept both
}

/** Words from the plan topic that we'll search for in past-paper topic strings. */
function topicSearchWords(planTopic: string): string[] {
  return planTopic
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4); // skip "and", "the", short stop-ish words
}

/**
 * Pick `count` past-paper questions matching the session as closely as
 * possible. Falls back from exact-topic → broad-keyword → subject-only.
 *
 * The rendered questions are real exam-style items pulled straight from the
 * project's curated bank, so they have hints, mark schemes, command words,
 * sub-parts and proper marks.
 */
export function pickPastPaperQuestions(
  input: ContentInput,
  count = 6,
): PastPaperPickResult {
  const subj = input.subjectId.toLowerCase();
  const subjectMatches = allPastPaperQuestions.filter(
    (q) => (q.subject || "").toLowerCase() === subj,
  );
  if (subjectMatches.length === 0) return { questions: [], matchKind: "none" };

  // Tier filter — but be permissive; if filtering kills everything, drop it.
  const tier = tierForDifficulty(input.difficulty);
  let pool = subjectMatches;
  if (tier) {
    const filtered = subjectMatches.filter((q) => !q.tier || q.tier === tier);
    if (filtered.length >= 3) pool = filtered;
  }

  const planTopicLower = input.topic.toLowerCase();
  const planWords = topicSearchWords(input.topic);

  const exact = pool.filter(
    (q) => (q.topic || "").toLowerCase() === planTopicLower,
  );
  const broad =
    planWords.length === 0
      ? []
      : pool.filter((q) => {
          if (exact.includes(q)) return false;
          const qt = (q.topic || "").toLowerCase();
          return planWords.some((w) => qt.includes(w));
        });

  if (exact.length + broad.length >= count) {
    const merged = [...shuffle(exact), ...shuffle(broad)].slice(0, count);
    return {
      questions: merged,
      matchKind: exact.length > 0 ? "exact" : "broad",
    };
  }

  // Pad with same-subject items so we always have a paper-sized set.
  const remaining = pool.filter(
    (q) => !exact.includes(q) && !broad.includes(q),
  );
  const merged = [
    ...shuffle(exact),
    ...shuffle(broad),
    ...shuffle(remaining),
  ].slice(0, count);
  return {
    questions: merged,
    matchKind:
      exact.length > 0 ? "exact" : broad.length > 0 ? "broad" : "subject",
  };
}

// ─── Materials / "what you'll need" helper ─────────────────────────────────

/**
 * Produce a small pupil-friendly checklist of materials to have to hand
 * before starting a session. Used by the warm-up phase.
 */
export function materialsForSession(plan: RevisionSessionPlan): MaterialItem[] {
  const subj = plan.subject.toLowerCase();
  const topic = plan.topic.toLowerCase();
  const items: MaterialItem[] = [
    { icon: "✏️", label: "A pen or pencil" },
    { icon: "📒", label: "A notebook for your lesson notes" },
  ];

  // Calculator for maths and the sciences (parents can ignore if their
  // session is a non-calculator one — the message is a nudge, not a wall).
  const numericalSubjects = new Set([
    "mathematics",
    "maths",
    "science",
    "biology",
    "chemistry",
    "physics",
    "computing",
    "computer-science",
    "business",
  ]);
  if (numericalSubjects.has(subj)) {
    items.push({ icon: "🧮", label: "A calculator (some questions are easier with one)" });
  }

  // Geometry-flavoured topics → ruler.
  if (
    topic.includes("geometry") ||
    topic.includes("triangle") ||
    topic.includes("circle") ||
    topic.includes("trig") ||
    topic.includes("graph") ||
    topic.includes("vector") ||
    topic.includes("shape") ||
    topic.includes("area") ||
    topic.includes("volume") ||
    topic.includes("loci") ||
    topic.includes("transformation") ||
    topic.includes("angle")
  ) {
    items.push({ icon: "📐", label: "A ruler (some questions need careful measuring)" });
  }

  // Headphones for the lesson audio.
  items.push({ icon: "🎧", label: "Headphones if you have them — for the lesson audio" });

  // Quiet space.
  items.push({ icon: "🤫", label: "Somewhere quiet to focus for an hour" });

  return items;
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
