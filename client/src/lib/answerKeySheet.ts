/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * answerKeySheet.ts — FEAT-G12.
 *
 * Builds a print-only "answer key" page from a worksheet. Lists, in
 * compact reference form: per-question mark scheme (when present),
 * diagnosed misconceptions per distractor (G1 metadata), and
 * procedural-activity answers (G4 wordsearch placements / crossword
 * clues / matching key / cloze blanks).
 */

import type { CrosswordOutput } from "./proceduralActivities/crossword";
import type { MatchingOutput } from "./proceduralActivities/matching";
import type { ClozeOutput } from "./proceduralActivities/cloze";
import type { WordsearchOutput } from "./proceduralActivities/wordsearch";

export interface AnswerKeySection {
  type: "answer-key-row" | "answer-key-procedural" | "answer-key-header";
  questionNumber?: number;
  title: string;
  content: string;
}

export interface AnswerKeyPage {
  watermark: string;
  header: AnswerKeySection;
  rows: AnswerKeySection[];
}

interface InWorksheetSection {
  title?: string;
  content?: string;
  type?: string;
  marks?: number;
  questionNumber?: number;
  teacherOnly?: boolean;
  procedural?: { kind: string; payload: unknown };
  answerSpec?: { mode?: string; canonicalAnswer?: string; correctLetter?: string; answer?: string | number };
}

interface InWorksheet {
  title?: string;
  metadata?: {
    yearGroup?: string;
    topic?: string;
    misconceptionLinks?: { sectionIndex: number; distractor: string; misconceptionId: string }[];
  };
  sections?: InWorksheetSection[];
}

const SUPPORTED_QUESTION_TYPES = new Set([
  "q-mcq",
  "q-short-answer",
  "q-extended",
  "mcq",
  "question",
  "wordsearch",
  "crossword",
  "matching",
  "cloze",
  "worked-example",
]);

function isQuestionLike(s: InWorksheetSection): boolean {
  const t = String(s.type || "").toLowerCase();
  if (SUPPORTED_QUESTION_TYPES.has(t)) return true;
  return /^q[-_]/.test(t);
}

function extractMarkScheme(s: InWorksheetSection): string | null {
  // Heuristic: a sibling section with type="mark-scheme" carries the answer
  // key, but in many of our generated worksheets the answer is inlined into
  // the question section's content prefix "Answer:" or "Mark scheme:".
  const c = String(s.content || "");
  const m = c.match(/(?:answer|mark scheme)\s*:\s*([\s\S]+?)(?:\n\n|$)/i);
  if (m) return m[1].trim();
  if (s.answerSpec) {
    if (s.answerSpec.mode === "mcq" && s.answerSpec.correctLetter) return `Correct: ${s.answerSpec.correctLetter}`;
    if (s.answerSpec.canonicalAnswer) return `Answer: ${s.answerSpec.canonicalAnswer}`;
    if (s.answerSpec.answer !== undefined) return `Answer: ${s.answerSpec.answer}`;
  }
  return null;
}

function buildProceduralRow(s: InWorksheetSection, idx: number): AnswerKeySection | null {
  if (!s.procedural) return null;
  const { kind, payload } = s.procedural;
  let content = "";
  if (kind === "crossword") {
    const p = payload as CrosswordOutput;
    content = (p.clues || []).map((c) => `${c.num}${c.dir[0].toUpperCase()}: ${c.answer}`).join("  ·  ");
  } else if (kind === "matching") {
    const p = payload as MatchingOutput;
    content = (p.left || []).map((l, i) => `${l} → ${(p.right || [])[p.key[i]] || ""}`).join("; ");
  } else if (kind === "cloze") {
    const p = payload as ClozeOutput;
    content = (p.blanks || []).map((b) => `[${b.num}] ${b.answer}`).join("  ·  ");
  } else if (kind === "wordsearch") {
    const p = payload as WordsearchOutput;
    content = (p.placements || [])
      .map((pl) => `${pl.word} (r${pl.row + 1},c${pl.col + 1},${pl.dir})`)
      .join("  ·  ");
  }
  return {
    type: "answer-key-procedural",
    title: s.title || `Activity ${idx + 1}`,
    content: content || "(no answers)",
  };
}

export function buildAnswerKeyPage(worksheet: InWorksheet): AnswerKeyPage {
  const header: AnswerKeySection = {
    type: "answer-key-header",
    title: `Answer key — ${worksheet.title || "Worksheet"}`,
    content: [
      worksheet.metadata?.yearGroup,
      worksheet.metadata?.topic,
    ].filter(Boolean).join(" · "),
  };
  const rows: AnswerKeySection[] = [];
  const links = worksheet.metadata?.misconceptionLinks || [];
  const sections = worksheet.sections || [];
  let qNum = 0;
  sections.forEach((s, idx) => {
    // Skip non-question sections (LO, vocab-ref, reflection).
    if (!isQuestionLike(s)) return;
    if (s.procedural) {
      const procRow = buildProceduralRow(s, idx);
      if (procRow) rows.push(procRow);
      return;
    }
    qNum += 1;
    const ms = extractMarkScheme(s);
    const linksFor = links.filter((l) => l.sectionIndex === idx);
    const linkLine = linksFor.length
      ? ` · Distractor links: ${linksFor.map((l) => `${l.distractor}=${l.misconceptionId}`).join(", ")}`
      : "";
    rows.push({
      type: "answer-key-row",
      questionNumber: s.questionNumber || qNum,
      title: s.title || `Question ${qNum}`,
      content: (ms || "(no mark scheme)") + linkLine,
    });
  });
  return {
    watermark: "TEACHER ONLY — DO NOT DISTRIBUTE",
    header,
    rows,
  };
}
