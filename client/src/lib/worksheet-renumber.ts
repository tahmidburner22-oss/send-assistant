/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * worksheet-renumber.ts — FEAT-G15.
 *
 * Pure helper that renumbers questionNumber on every q-* section in
 * array order. Used after a drag-handle reorder (G15) so question
 * numbers stay sequential. Non-q-* sections (LO, vocab-ref,
 * reflection) keep questionNumber=undefined.
 */

export interface RenumberSection {
  type?: string;
  questionNumber?: number;
}

const QUESTION_PREFIX = /^q[-_]/i;
const QUESTION_TYPES = new Set(["mcq", "question"]);

export function isQuestionType(s: RenumberSection): boolean {
  const t = String(s.type || "").toLowerCase();
  if (QUESTION_TYPES.has(t)) return true;
  return QUESTION_PREFIX.test(t);
}

export function renumberSections<T extends RenumberSection>(sections: T[]): T[] {
  let n = 0;
  return sections.map((s) => {
    if (isQuestionType(s)) {
      n += 1;
      return { ...s, questionNumber: n };
    }
    // Non-question sections: clear questionNumber if it was previously set.
    if (s.questionNumber !== undefined) {
      const { questionNumber: _q, ...rest } = s as RenumberSection;
      return { ...(rest as T) };
    }
    return s;
  });
}
