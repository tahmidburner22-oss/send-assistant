/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * fiveADayBuilder.ts — FEAT-G5.
 *
 * Pure deterministic builder for a Corbettmaths-style 5-a-day pack.
 * Inputs: subject, year-group, weeks, skills (specRefs), weekday on/off,
 * calculator policy, seed. Output: { worksheets } — one per weekday per
 * week, each with 5 questions sourced from the curriculum bank.
 *
 * Mark balance: 1+2+3+3+5 = 14 marks/day default; relaxed to ±2 marks
 * when the bank can't satisfy the exact tariff.
 */

import { lookupBySpecRef } from "./curriculumBank";
import { makeRandom } from "./proceduralActivities/seededRandom";

export type Calculator = "allowed" | "non-calc" | "either";

export interface FiveADayInput {
  subject: string;
  yearGroup: string;
  /** Number of weeks of packs (5 weekdays × N weeks). */
  weeks: number;
  /** Curriculum specRefs to rotate over. */
  skills: string[];
  /** Active weekdays. Default: Mon-Fri. */
  weekdays?: number[];
  /** Calculator policy. Default 'either'. */
  calculator?: Calculator;
  /** Seed for deterministic output. Default 1. */
  seed?: number;
  /** Per-day mark distribution. Default [1,2,3,3,5]. */
  markBudget?: number[];
}

export interface FiveADayQuestion {
  qNum: number;
  marks: number;
  specRef: string;
  stem: string;
  exemplarId?: string;
}

export interface FiveADayWorksheet {
  weekIndex: number;
  weekdayIndex: number;
  weekdayLabel: string;
  totalMarks: number;
  questions: FiveADayQuestion[];
}

export interface FiveADayOutput {
  worksheets: FiveADayWorksheet[];
  warnings: string[];
}

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function pickQuestionForBudget(
  subject: string,
  specRef: string,
  targetMarks: number,
  used: Set<string>,
  rand: () => number,
): { stem: string; marks: number; id?: string } | null {
  const candidates = lookupBySpecRef(subject, specRef, {});
  const available = candidates.filter((c) => !used.has(c.id));
  if (available.length === 0) {
    if (candidates.length > 0) {
      // Re-use bank question if we've exhausted it (with warning surfaced upstream).
      const c = candidates[Math.floor(rand() * candidates.length)];
      return { stem: c.stem, marks: c.marks || targetMarks, id: c.id };
    }
    return null;
  }
  // Prefer questions matching target marks ±2.
  const closeFit = available.filter((c) => Math.abs((c.marks || 0) - targetMarks) <= 2);
  const pool = closeFit.length > 0 ? closeFit : available;
  const c = pool[Math.floor(rand() * pool.length)];
  return { stem: c.stem, marks: c.marks || targetMarks, id: c.id };
}

export function buildFiveADay(input: FiveADayInput): FiveADayOutput {
  const warnings: string[] = [];
  const skills = (input.skills || []).filter(Boolean);
  if (skills.length === 0) {
    return { worksheets: [], warnings: ["No skills supplied — empty pack."] };
  }
  const weeks = Math.max(1, Math.min(20, input.weeks || 1));
  const activeDays = input.weekdays && input.weekdays.length ? input.weekdays.slice().sort((a, b) => a - b) : [0, 1, 2, 3, 4];
  const seed = (input.seed ?? 1) >>> 0;
  const rand = makeRandom(seed);
  const budget = input.markBudget && input.markBudget.length ? input.markBudget : [1, 2, 3, 3, 5];
  const used = new Set<string>();
  const worksheets: FiveADayWorksheet[] = [];
  let skillCursor = 0;
  for (let w = 0; w < weeks; w++) {
    for (const wd of activeDays) {
      const questions: FiveADayQuestion[] = [];
      for (let q = 0; q < 5; q++) {
        const targetMarks = budget[q] ?? 2;
        const skill = skills[skillCursor % skills.length];
        skillCursor += 1;
        const picked = pickQuestionForBudget(input.subject, skill, targetMarks, used, rand);
        if (!picked) {
          warnings.push(`No bank question for skill ${skill} in week ${w + 1}, day ${wd + 1}, slot ${q + 1}`);
          questions.push({
            qNum: q + 1,
            marks: targetMarks,
            specRef: skill,
            stem: `[Bank empty for ${skill}] Generate a question.`,
          });
          continue;
        }
        if (picked.id) used.add(picked.id);
        questions.push({
          qNum: q + 1,
          marks: picked.marks,
          specRef: skill,
          stem: picked.stem,
          exemplarId: picked.id,
        });
      }
      const total = questions.reduce((s, q) => s + (q.marks || 0), 0);
      worksheets.push({
        weekIndex: w + 1,
        weekdayIndex: wd,
        weekdayLabel: WEEKDAY_LABELS[wd] || `Day ${wd + 1}`,
        totalMarks: total,
        questions,
      });
    }
  }
  // Repeats sanity check.
  const repeatRate = used.size === 0 ? 0 : 1 - used.size / Math.max(1, worksheets.length * 5);
  if (repeatRate > 0.3) {
    warnings.push(`High repeat rate (${(repeatRate * 100).toFixed(0)}%) — bank is thin for the chosen skills.`);
  }
  return { worksheets, warnings };
}
