/**
 * hint-ladder.ts
 *
 * Generates a 3-step hint ladder for each question on a worksheet at print time,
 * so the pupil-companion view can surface them progressively without ever
 * calling an LLM at runtime (safeguarding-clean, offline-resilient).
 *
 * Usage:
 *   const ladders = await buildHintLadders({ sections, subject, topic, yearGroup });
 *   worksheet.metadata.hintLadders = ladders;
 *
 * Output shape (per question, keyed by stable question id):
 *   { questionId: string, hints: [string, string, string] }
 *
 * Stable question ids:
 *   `${sectionIndex}-${questionIndex}`  e.g. "3-2" = section 3, question 2.
 *
 * The generator is a single AI call returning a JSON array. If the call fails
 * (rate limit / parse error), the worksheet still ships — pupils just don't
 * get hints. Hint baking is therefore non-blocking from the caller's view.
 */

import { callAI, parseWithFixes, repairTruncatedJson } from "@/lib/ai";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface HintLadderEntry {
  /** Stable id `${sectionIndex}-${questionIndex}`. */
  questionId: string;
  /** Three hints, increasing in directness. The third must lead very close to the answer without giving it away. */
  hints: [string, string, string];
}

export interface BuildHintLaddersInput {
  sections: Array<{
    title?: string;
    content?: string;
    type?: string;
    teacherOnly?: boolean;
  }>;
  subject?: string;
  topic?: string;
  yearGroup?: string;
  /** SEND need id, used to tune hint vocabulary/length. */
  sendNeed?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Question extraction — finds numbered/bulleted questions in a section
// ─────────────────────────────────────────────────────────────────────────────

const QUESTION_LINE_RE = /^\s*(?:\d+\.|\d+\)|Q\d+\.?|\*|-)\s+(.+)$/i;

function extractQuestions(content: string): string[] {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(QUESTION_LINE_RE);
    if (m && m[1]) {
      // Strip trailing markdown asterisks / quote chars
      const q = m[1].replace(/[*_`]/g, "").trim();
      if (q.length > 2) out.push(q);
    }
  }
  // If no numbered list was found but the section content is short and looks
  // like a single question (ends with '?'), treat the whole thing as one question.
  if (out.length === 0) {
    const trimmed = content.trim().replace(/[*_`]/g, "");
    if (trimmed.length > 0 && trimmed.length < 400 && /\?\s*$/.test(trimmed)) {
      out.push(trimmed);
    }
  }
  return out;
}

const QUESTION_SECTION_TYPES = new Set([
  "questions",
  "independent",
  "guided",
  "starter",
  "main",
  "task",
  "practice",
  "extension",
  "challenge",
  "recall",
  "understanding",
  "application",
]);

interface FlatQuestion {
  questionId: string;
  text: string;
  sectionIndex: number;
  sectionTitle: string;
}

function flattenQuestions(sections: BuildHintLaddersInput["sections"]): FlatQuestion[] {
  const out: FlatQuestion[] = [];
  sections.forEach((section, sectionIndex) => {
    if (section.teacherOnly) return; // never hint on teacher-only sections
    const type = (section.type || "").toLowerCase();
    // Skip sections that obviously aren't pupil-facing questions
    if (
      type === "answers" ||
      type === "mark-scheme" ||
      type === "objective" ||
      type === "vocabulary" ||
      type === "key-terms" ||
      type === "instructions" ||
      type === "self-reflection" ||
      type === "reflection" ||
      type === "diagram"
    ) {
      return;
    }
    // Heuristic: only include if section type is a known question type OR
    // the content has at least one numbered line.
    const looksQuestiony = QUESTION_SECTION_TYPES.has(type) || /^\s*\d+[.)]/m.test(section.content || "");
    if (!looksQuestiony) return;
    const qs = extractQuestions(section.content || "");
    qs.forEach((text, qi) => {
      out.push({
        questionId: `${sectionIndex}-${qi}`,
        text,
        sectionIndex,
        sectionTitle: section.title || "Question",
      });
    });
  });
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────────────────────────────────────

const MAX_QUESTIONS_PER_BATCH = 24;

export async function buildHintLadders(input: BuildHintLaddersInput): Promise<HintLadderEntry[]> {
  const flat = flattenQuestions(input.sections);
  if (flat.length === 0) return [];
  // Cap the number of questions to avoid runaway prompts. If a worksheet has
  // more than the cap, we just hint the first batch — that's still a huge UX win.
  const work = flat.slice(0, MAX_QUESTIONS_PER_BATCH);

  const yearLabel = input.yearGroup ? `Year ${String(input.yearGroup).replace(/^year\s*/i, "")}` : "the pupil's year group";
  const sendLine = input.sendNeed
    ? `The pupil may have ${input.sendNeed} — keep hints short, plain, and concrete.`
    : "Keep hints short, plain, and concrete.";

  const system = [
    "You are a SEND-trained UK teacher writing hint ladders for a printed worksheet.",
    "For each question you receive, write EXACTLY 3 hints, in this order:",
    "  Hint 1 — gentle nudge: re-state the goal in simpler words OR point at the relevant idea.",
    "  Hint 2 — strategy: tell them what to do next (e.g. 'circle the keyword', 'try the smallest case first').",
    "  Hint 3 — almost-there: give them the structure of the answer or the first step worked out, but DO NOT give the final answer.",
    "Each hint must be ONE sentence, ≤ 20 words, in plain UK English.",
    `Audience: ${yearLabel}. ${sendLine}`,
    "Never reveal the final answer. Never reference 'the AI' or 'the model'. Address the pupil as 'you'.",
    "Return ONLY valid JSON — no markdown fences, no commentary.",
    'Schema: [{"questionId":"<id>","hints":["<hint1>","<hint2>","<hint3>"]}]',
  ].join("\n");

  const user = [
    input.subject ? `Subject: ${input.subject}` : "",
    input.topic ? `Topic: ${input.topic}` : "",
    "",
    "Questions:",
    ...work.map(q => `[${q.questionId}] ${q.text}`),
    "",
    "Return one ladder per question. Use the questionId as given.",
  ].filter(Boolean).join("\n");

  let raw = "";
  try {
    const { text } = await callAI(system, user, 2400);
    raw = text || "";
  } catch (err) {
    // Hint baking is best-effort — never crash generation.
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn("[hint-ladder] callAI failed:", err);
    }
    return [];
  }

  // Extract JSON array, tolerating fences and pre/post chatter.
  let jsonStr: string | null = null;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) jsonStr = fence[1].trim();
  if (!jsonStr) {
    const arr = raw.match(/\[[\s\S]*\]/);
    if (arr) jsonStr = arr[0];
  }
  if (!jsonStr) return [];

  let parsed: any;
  try {
    parsed = parseWithFixes(jsonStr);
  } catch {
    const repaired = repairTruncatedJson(jsonStr);
    if (!repaired) return [];
    try { parsed = parseWithFixes(repaired); }
    catch { return []; }
  }
  if (!Array.isArray(parsed)) return [];

  const out: HintLadderEntry[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const id = String(item.questionId || "").trim();
    const hints = Array.isArray(item.hints) ? item.hints : null;
    if (!id || !hints || hints.length < 3) continue;
    if (seen.has(id)) continue;
    const cleaned: [string, string, string] = [
      String(hints[0] || "").trim(),
      String(hints[1] || "").trim(),
      String(hints[2] || "").trim(),
    ];
    if (!cleaned[0] || !cleaned[1] || !cleaned[2]) continue;
    seen.add(id);
    out.push({ questionId: id, hints: cleaned });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for the pupil-companion view
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walk a worksheet's sections and pair each question with its hint ladder
 * (if one exists). Used by SharedWorksheet.tsx in pupil mode.
 */
export function pairQuestionsWithHints(
  sections: BuildHintLaddersInput["sections"],
  ladders: HintLadderEntry[] | undefined | null,
): Array<{ sectionIndex: number; sectionTitle: string; questionId: string; text: string; hints: [string, string, string] | null }> {
  const flat = flattenQuestions(sections);
  const map = new Map<string, [string, string, string]>();
  (ladders || []).forEach(l => map.set(l.questionId, l.hints));
  return flat.map(q => ({
    sectionIndex: q.sectionIndex,
    sectionTitle: q.sectionTitle,
    questionId: q.questionId,
    text: q.text,
    hints: map.get(q.questionId) || null,
  }));
}
