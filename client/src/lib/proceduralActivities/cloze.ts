/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * proceduralActivities/cloze.ts — FEAT-G4.
 *
 * Cloze (fill-the-gap) activity. The LLM emits prose with __BLANK:answer__
 * tokens; this generator extracts answers, replaces the tokens with
 * numbered slots ([1], [2], ...) and (optionally) returns a shuffled
 * word bank.
 */

import { makeRandom } from "./seededRandom";

export interface ClozeInput {
  /**
   * Prose with embedded blank tokens. Two equivalent token forms
   * accepted:
   *   - `__BLANK:answer__` (preferred — keeps the answer with the token)
   *   - `__BLANK__` paired with a `blanks` array of answers in order
   */
  prose: string;
  /** Fallback answer list when prose uses bare `__BLANK__` tokens. */
  blanks?: string[];
  /** When true, returns a shuffled word bank for the pupil. */
  includeWordBank?: boolean;
  seed?: number;
}

export interface ClozeBlank {
  num: number;
  answer: string;
}

export interface ClozeOutput {
  rendered: string;
  blanks: ClozeBlank[];
  wordBank?: string[];
  warnings: string[];
}

const TOKEN_WITH_ANSWER = /__BLANK:([^_]+)__/g;
const TOKEN_PLAIN = /__BLANK__/g;

export function generateCloze(input: ClozeInput): ClozeOutput {
  const prose = String(input.prose || "");
  const blanks: ClozeBlank[] = [];
  let warnings: string[] = [];
  let n = 0;
  // First pass: tokens with embedded answer.
  let rendered = prose.replace(TOKEN_WITH_ANSWER, (_match, ans: string) => {
    n += 1;
    blanks.push({ num: n, answer: ans.trim() });
    return `[${n}]`;
  });
  // Second pass: bare tokens, paired with the supplied blanks array.
  const fallback = (input.blanks || []).slice();
  rendered = rendered.replace(TOKEN_PLAIN, () => {
    n += 1;
    const ans = fallback.shift() || "";
    if (!ans) warnings.push(`Blank ${n} has no answer supplied.`);
    blanks.push({ num: n, answer: ans });
    return `[${n}]`;
  });
  if (n === 0) {
    warnings.push("No blanks found in cloze prose.");
  }
  let wordBank: string[] | undefined;
  if (input.includeWordBank) {
    const rand = makeRandom(input.seed ?? 1);
    const words = blanks.map((b) => b.answer).filter(Boolean);
    const out = words.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    wordBank = out;
  }
  return { rendered, blanks, wordBank, warnings };
}
