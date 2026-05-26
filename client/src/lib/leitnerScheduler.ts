/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * leitnerScheduler.ts — FEAT-H12.
 *
 * Pure Leitner-box scheduler over a pupil's attempt history. Five
 * boxes (1..5). Correct attempt advances the skill one box (capped
 * at 5); incorrect demotes to box 1; partial holds. Used by G5's
 * fiveADayBuilder to weight the next pack: 60% box-1 / 30% box-2 /
 * 10% box-3+.
 */

export type AttemptStatus = "correct" | "partial" | "incorrect";

export interface LeitnerAttempt {
  skill: string;
  status: AttemptStatus;
  attemptedAt: string;
}

export interface LeitnerSkillState {
  skill: string;
  box: 1 | 2 | 3 | 4 | 5;
  lastReviewed: string;
  attempts: number;
}

export interface ScheduleBias {
  box1: number;
  box2: number;
  box3plus: number;
}

const DEFAULT_BIAS: ScheduleBias = { box1: 0.6, box2: 0.3, box3plus: 0.1 };

export function applyAttempt(state: LeitnerSkillState | undefined, attempt: LeitnerAttempt): LeitnerSkillState {
  if (!state) {
    state = { skill: attempt.skill, box: 1, lastReviewed: attempt.attemptedAt, attempts: 0 };
  }
  let nextBox: LeitnerSkillState["box"] = state.box;
  if (attempt.status === "correct") {
    nextBox = (Math.min(5, state.box + 1) as LeitnerSkillState["box"]);
  } else if (attempt.status === "incorrect") {
    nextBox = 1;
  }
  return { ...state, box: nextBox, lastReviewed: attempt.attemptedAt, attempts: state.attempts + 1 };
}

export function buildSkillStates(attempts: LeitnerAttempt[], allSkills?: string[]): LeitnerSkillState[] {
  const sorted = (attempts || []).slice().sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt));
  const map = new Map<string, LeitnerSkillState>();
  for (const a of sorted) {
    map.set(a.skill, applyAttempt(map.get(a.skill), a));
  }
  if (allSkills) {
    for (const s of allSkills) {
      if (!map.has(s)) {
        map.set(s, { skill: s, box: 1, lastReviewed: "", attempts: 0 });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.skill.localeCompare(b.skill));
}

/**
 * Returns the skill order that the next pack should sample from,
 * weighted by box (default 60/30/10). Deterministic given identical
 * input.
 */
export function biasedSkillOrder(states: LeitnerSkillState[], bias: ScheduleBias = DEFAULT_BIAS, slots = 5): string[] {
  const box1 = states.filter((s) => s.box === 1);
  const box2 = states.filter((s) => s.box === 2);
  const box3 = states.filter((s) => s.box >= 3);
  const out: string[] = [];
  const want1 = Math.round(slots * bias.box1);
  const want2 = Math.round(slots * bias.box2);
  let want3 = slots - want1 - want2;
  // Round-robin within each bucket.
  let i = 0;
  while (out.length < want1 && box1.length > 0) {
    out.push(box1[i % box1.length].skill);
    i += 1;
  }
  i = 0;
  while (out.length < want1 + want2 && box2.length > 0) {
    out.push(box2[i % box2.length].skill);
    i += 1;
  }
  i = 0;
  while (out.length < slots && box3.length > 0 && want3 > 0) {
    out.push(box3[i % box3.length].skill);
    i += 1;
    want3 -= 1;
  }
  // Fill any remaining slots with whatever we have.
  i = 0;
  while (out.length < slots && states.length > 0) {
    out.push(states[i % states.length].skill);
    i += 1;
  }
  return out;
}

export function summarizeSchedule(states: LeitnerSkillState[]): { box: number; count: number }[] {
  const counts = [0, 0, 0, 0, 0];
  for (const s of states) counts[s.box - 1] += 1;
  return counts.map((count, idx) => ({ box: idx + 1, count }));
}
