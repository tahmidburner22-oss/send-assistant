/**
 * hint-ladder.ts — Phase 4 / FEAT-005 (companion-mode pupil scaffolding)
 *
 * Generates a 3-step hint ladder (nudge → strategy → worked-example) per
 * question on a freshly-generated worksheet. Used by the Pupil Companion
 * mode so a pupil with no teacher next to them can self-scaffold without
 * being given the answer in one click.
 *
 * Design constraints:
 *  - £0 cost: re-uses the existing free-tier AI providers via callAI (Groq,
 *    Gemini, NIM, etc.). No paid APIs, no live web search.
 *  - Non-blocking: fires-and-forgets after the worksheet renders so the
 *    teacher view appears instantly and metadata.hintLadders patches in
 *    when the result arrives. Failures are silent.
 *  - Bounded: caps at the first 8 question-bearing sections to keep the
 *    payload small and the cost minimal.
 *  - Defensive parsing: the model is asked for strict JSON; malformed
 *    output is dropped silently.
 *
 *  Also exports `parseQuestionsFromSection` so the Companion route can
 *  iterate the same question list the renderer sees.
 */
import { callAI } from "@/lib/ai";

export interface HintLadderEntry {
  /** 1-based question number within the ladder list. */
  questionId: string;
  /** Verbatim question text (truncated to 240 chars for storage hygiene). */
  question: string;
  /** Three escalating hints. The pupil reveals them one at a time. */
  hints: [string, string, string];
}

export interface HintLadderResult {
  ladders: HintLadderEntry[];
  /** Section-ladder index, e.g. "s1q3" so the renderer can map back. */
  generatedAt: string;
}

const MAX_QUESTIONS = 8;
const MAX_INPUT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 2400;

/**
 * Parse a section's `content` block into discrete questions. Mirrors the
 * heuristic in WorksheetRenderer — we look for lines that start with
 * `1.`, `1)`, `Q1.`, `(a)` etc. If no numbered list found, the whole block
 * is one question.
 */
export function parseQuestionsFromSection(content: string): string[] {
  if (!content || typeof content !== "string") return [];
  const stripped = content
    // Remove SEND scaffolds + working-out captions that confuse splitting.
    .replace(/^>\s.*$/gm, "")
    .replace(/^\s*\[.*?\]\s*$/gm, "")
    .replace(/^\s*✓.*$/gm, "")
    .trim();

  const lines = stripped.split(/\r?\n/);
  const out: string[] = [];
  let buf: string[] = [];

  const isQuestionStart = (line: string): boolean => {
    return /^\s*(?:Q?\d+[.)]\s|\(?[a-z]\)\s|[ivx]+[.)]\s)/i.test(line);
  };

  const flush = () => {
    const joined = buf.join("\n").trim();
    if (joined.length > 0) out.push(joined);
    buf = [];
  };

  for (const line of lines) {
    if (isQuestionStart(line)) {
      flush();
      buf.push(line.trim());
    } else if (buf.length > 0) {
      buf.push(line);
    }
  }
  flush();

  // Fallback: if we couldn't split into ≥2 questions, keep the whole block
  // as a single question so the pupil mode still has something to scaffold.
  if (out.length <= 1 && stripped.length > 0) {
    return [stripped];
  }
  return out;
}

interface QuestionForLadder {
  /** Stable id used as `s${section index}q${question index in section}`. */
  questionId: string;
  question: string;
}

/**
 * Walk the worksheet's question-bearing sections and collect up to
 * MAX_QUESTIONS (subject, topic, year-group-aware) candidate questions.
 * `section.teacherOnly` and obvious non-question section types are skipped.
 */
export function collectQuestionsForLadder(
  sections: Array<{ title?: string; content?: string; type?: string; teacherOnly?: boolean }>,
): QuestionForLadder[] {
  const SKIP = new Set([
    "answers",
    "mark-scheme",
    "teacher-notes",
    "teacher-note",
    "vocabulary",
    "objectives",
    "instructions",
    "header",
    "send-support",
    "diagram",
    "reflection",
    "exit-question",
    "starter",
  ]);
  const result: QuestionForLadder[] = [];
  for (let si = 0; si < sections.length && result.length < MAX_QUESTIONS; si++) {
    const s = sections[si] || {};
    if (s.teacherOnly) continue;
    if (s.type && SKIP.has(s.type)) continue;
    const qs = parseQuestionsFromSection(String(s.content || ""));
    for (let qi = 0; qi < qs.length && result.length < MAX_QUESTIONS; qi++) {
      const text = qs[qi].slice(0, 240);
      if (text.length < 6) continue;
      result.push({ questionId: `s${si}q${qi}`, question: text });
    }
  }
  return result;
}

/**
 * Build the system + user prompts and ask the AI for a 3-step hint ladder
 * per question. Returns at most one ladder per input question.
 */
export async function runHintLadder(input: {
  subject?: string;
  topic?: string;
  yearGroup?: string;
  sections: Array<{ title?: string; content?: string; type?: string; teacherOnly?: boolean }>;
}): Promise<HintLadderResult | null> {
  try {
    const candidates = collectQuestionsForLadder(input.sections || []);
    if (candidates.length === 0) return null;

    const truncated = candidates
      .map((c) => `${c.questionId}: ${c.question}`)
      .join("\n")
      .slice(0, MAX_INPUT_CHARS);

    const system = `You are an experienced UK SEND classroom teacher writing a three-step hint ladder for each question on a printable worksheet.\n\nSTRICT RULES:\n1. Output VALID JSON only — no markdown, no commentary.\n2. For each question, return exactly three hints in this escalation:\n   • hint 1 — a NUDGE: a single short sentence (≤ 18 words) that gets the pupil to read again or notice a key word. NEVER reveals the method.\n   • hint 2 — a STRATEGY: a single short sentence (≤ 24 words) that names the technique or formula but not the values.\n   • hint 3 — a WORKED EXAMPLE: a 1–2 sentence walkthrough of the FIRST step using the actual numbers / words from the question, but stop before the final answer.\n3. Hints must be age-appropriate for ${input.yearGroup || "the stated year group"}. No sarcasm, no \"obviously\".\n4. Never give the final answer in any of the three hints.\n5. Use British spelling.\n6. If a question is open-ended (essay-style), give scaffolding sentence-starters instead of working steps.`;

    const user = `Subject: ${input.subject || "(unknown)"}\nTopic: ${input.topic || "(unknown)"}\nYear group: ${input.yearGroup || "(unknown)"}\n\nQuestions to scaffold (one per line, format \`questionId: text\`):\n${truncated}\n\nReturn JSON in the form:\n{\n  "ladders": [\n    { "questionId": "s0q0", "hints": ["nudge…", "strategy…", "worked example…"] }\n  ]\n}`;

    const { text: raw } = await callAI(system, user, MAX_OUTPUT_TOKENS);
    const json = extractJson(raw);
    if (!json || !Array.isArray(json.ladders)) return null;

    const byId = new Map(candidates.map((c) => [c.questionId, c.question]));
    const ladders: HintLadderEntry[] = [];
    for (const entry of json.ladders) {
      if (!entry || typeof entry !== "object") continue;
      const id = String((entry as { questionId?: unknown }).questionId || "").trim();
      const hints = (entry as { hints?: unknown }).hints;
      const q = byId.get(id);
      if (!q || !Array.isArray(hints) || hints.length < 3) continue;
      const triple: [string, string, string] = [
        cleanHint(String(hints[0] ?? "")),
        cleanHint(String(hints[1] ?? "")),
        cleanHint(String(hints[2] ?? "")),
      ];
      if (!triple[0] || !triple[1] || !triple[2]) continue;
      ladders.push({ questionId: id, question: q, hints: triple });
      if (ladders.length >= MAX_QUESTIONS) break;
    }
    if (ladders.length === 0) return null;
    return { ladders, generatedAt: new Date().toISOString() };
  } catch {
    // Best-effort enrichment — never break worksheet generation.
    return null;
  }
}

/** Strip stray markdown bullets and trim trailing punctuation noise. */
function cleanHint(s: string): string {
  return s
    .replace(/^\s*[\-*•]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .trim()
    .slice(0, 280);
}

/** Defensive JSON extraction: strips ``` fences and finds the first {…}. */
function extractJson(raw: string): { ladders?: unknown[] } | null {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  try {
    return JSON.parse(cleaned.slice(first, last + 1));
  } catch {
    return null;
  }
}
