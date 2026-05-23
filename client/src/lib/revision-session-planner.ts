/**
 * revision-session-planner.ts
 *
 * Pure functions that build a `RevisionSessionPlan` from a parent's choices.
 * The planner enforces SEND-friendly constraints:
 *  - every break phase has a minimum of 2 min so it isn't a token gesture
 *  - the warm-up never goes below 45 seconds so the "Now / Next / Then"
 *    overview is actually readable
 *  - the reflect phase is always at least 60 seconds
 *  - phases scale proportionally when the parent changes total duration
 *
 * The planner has no side effects, no localStorage, no fetches — making it
 * easy to unit-test if we add tests later.
 */

import type {
  BreakType,
  RevisionPhase,
  RevisionPhaseKind,
  RevisionSessionPlan,
  StretchMode,
} from "./revision-session-store";
import { newId } from "./revision-session-store";

// ─── Recommended phase weights (must sum to 1.0) ────────────────────────────
//
// Based on a 60-min default the user signed off on:
//   warmup 1 / lesson 10 / break 5 / quiz 10 / break 10 / stretch 20 /
//   flashcards 4 / reflect 0.x  (rounded to fit cleanly)
//
// We express as fractions of total, and apply per-phase minimums afterwards.
//
// 60 mins = 3600s -> warmup 60s, lesson 600s, brk 300s, quiz 600s, brk 600s,
// stretch 1200s, flash 240s, reflect 60s = 3660s. Slight over by design;
// we re-normalise below.

export interface PhaseWeight {
  kind: RevisionPhaseKind;
  /** Default label (overridable per phase). */
  label: string;
  /** Fraction of total duration. Must sum to 1.0 across all weights. */
  weight: number;
  /** Hard minimum in seconds — the phase will never go below this. */
  minSec: number;
  /** Optional config for the runtime — e.g. break menu options. */
  config?: RevisionPhase["config"];
}

const RAW_WEIGHTS: PhaseWeight[] = [
  { kind: "warmup",     label: "Warm-up",         weight: 60   / 3660, minSec: 45 },
  { kind: "lesson",     label: "Listen & Learn",  weight: 600  / 3660, minSec: 180 },
  { kind: "break",      label: "Brain break",     weight: 300  / 3660, minSec: 120,
    config: { breakMenu: ["breathing", "stretch", "quiet"] } },
  { kind: "quiz",       label: "Quiz",            weight: 600  / 3660, minSec: 180 },
  { kind: "break",      label: "Long break",      weight: 600  / 3660, minSec: 180,
    config: { breakMenu: ["breathing", "stretch", "quiet", "drink-walk"] } },
  { kind: "stretch",    label: "Stretch & apply", weight: 1200 / 3660, minSec: 300 },
  { kind: "flashcards", label: "Lock it in",      weight: 240  / 3660, minSec: 120,
    config: { autoBuiltFromMistakes: true } },
  { kind: "reflect",    label: "Wrap-up & reflect", weight: 60 / 3660, minSec: 60 },
];

// Normalise weights to ensure they sum to exactly 1.0 (compensates for the
// over-by-1-min in the manual figures above).
const TOTAL_WEIGHT = RAW_WEIGHTS.reduce((s, w) => s + w.weight, 0);
const PHASE_WEIGHTS: PhaseWeight[] = RAW_WEIGHTS.map((w) => ({
  ...w,
  weight: w.weight / TOTAL_WEIGHT,
}));

/**
 * The seven public phase weights, in order. Parent UI reads this to render
 * the "Your hour will look like" preview.
 */
export const PHASE_TEMPLATES: ReadonlyArray<PhaseWeight> = PHASE_WEIGHTS;

// ─── Plan build ─────────────────────────────────────────────────────────────

export interface BuildPlanInput {
  pupilId: string;
  pupilName: string;
  subject: string;
  subjectLabel: string;
  topic: string;
  yearGroup: string;
  difficulty: "foundation" | "mixed" | "higher";
  /** Total session length in seconds — accepts 30 / 45 / 60 / 90 min etc. */
  totalSec: number;
  stretchMode: StretchMode;
  /** Optional advanced overrides — fraction (0..1) per phase index. */
  customWeights?: number[];
}

/**
 * Build a session plan, scaling each phase by weight and clamping to its
 * minimum. After clamping, any "extra" seconds are redistributed back into
 * the work phases (lesson / quiz / stretch) proportionally so the sum still
 * equals totalSec exactly.
 */
export function buildPlan(input: BuildPlanInput): RevisionSessionPlan {
  const total = Math.max(60 * 10, Math.round(input.totalSec)); // never less than 10 min
  const weights = input.customWeights && input.customWeights.length === PHASE_WEIGHTS.length
    ? normaliseWeights(input.customWeights)
    : PHASE_WEIGHTS.map((w) => w.weight);

  // 1. Initial allocation by weight.
  const initial = PHASE_WEIGHTS.map((w, i) => Math.round(weights[i] * total));
  // 2. Clamp to minimums; track surplus or deficit.
  const clamped = initial.map((sec, i) => Math.max(sec, PHASE_WEIGHTS[i].minSec));
  let drift = clamped.reduce((s, x) => s + x, 0) - total;

  // 3. If we're over total (because clamping pushed up some shorts), trim from
  //    the longest non-minimum phases until balanced.
  while (drift > 0) {
    let cutIdx = -1;
    let cutHeadroom = 0;
    for (let i = 0; i < clamped.length; i++) {
      const headroom = clamped[i] - PHASE_WEIGHTS[i].minSec;
      if (headroom > cutHeadroom) { cutHeadroom = headroom; cutIdx = i; }
    }
    if (cutIdx === -1) break; // can't trim any further; tolerate slight drift
    const take = Math.min(drift, cutHeadroom);
    clamped[cutIdx] -= take;
    drift -= take;
  }

  // 4. If under total (cap held us back), push the surplus into the
  //    work phases (lesson, quiz, stretch) proportionally.
  if (drift < 0) {
    const surplus = -drift;
    const workIndexes = PHASE_WEIGHTS
      .map((w, i) => ({ i, kind: w.kind }))
      .filter((x) => x.kind === "lesson" || x.kind === "quiz" || x.kind === "stretch")
      .map((x) => x.i);
    if (workIndexes.length > 0) {
      const each = Math.floor(surplus / workIndexes.length);
      const remainder = surplus - each * workIndexes.length;
      workIndexes.forEach((i, idx) => {
        clamped[i] += each + (idx < remainder ? 1 : 0);
      });
    }
  }

  // 5. Build the actual phase array.
  const phases: RevisionPhase[] = PHASE_WEIGHTS.map((w, i) => {
    const phase: RevisionPhase = {
      kind: w.kind,
      label: w.label,
      durationSec: clamped[i],
    };
    if (w.config) phase.config = { ...w.config };
    if (w.kind === "stretch") {
      phase.config = { ...(phase.config || {}), stretchMode: input.stretchMode };
    }
    return phase;
  });

  return {
    id: newId("plan"),
    pupilId: input.pupilId,
    pupilName: input.pupilName,
    subject: input.subject,
    subjectLabel: input.subjectLabel,
    topic: input.topic,
    yearGroup: input.yearGroup,
    difficulty: input.difficulty,
    totalSec: phases.reduce((s, p) => s + p.durationSec, 0),
    phases,
    createdAt: new Date().toISOString(),
  };
}

function normaliseWeights(raw: number[]): number[] {
  const safe = raw.map((w) => Math.max(0, w));
  const sum = safe.reduce((a, b) => a + b, 0);
  if (sum === 0) return PHASE_WEIGHTS.map((w) => w.weight);
  return safe.map((w) => w / sum);
}

// ─── Pretty helpers used by the UI ──────────────────────────────────────────

export function formatMinutes(totalSec: number): string {
  if (totalSec < 60) return `${Math.max(1, Math.round(totalSec))}s`;
  const mins = Math.round(totalSec / 60);
  return `${mins}'`;
}

export function formatClock(remainingSec: number): string {
  const safe = Math.max(0, Math.round(remainingSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Pretty title for the break activity once the child has picked. */
export function breakTypeLabel(type: BreakType): string {
  switch (type) {
    case "breathing":  return "Breathing";
    case "stretch":    return "Stretch";
    case "quiet":      return "Just sit quietly";
    case "drink-walk": return "Drink & walk";
  }
}
