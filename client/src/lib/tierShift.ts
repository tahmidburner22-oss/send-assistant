/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * tierShift.ts — FEAT-H11.
 *
 * Wraps anotherOneLikeThis (G2) with a tier-shifted bias. Two
 * shifts: 'easier' (prefer Foundation tier) and 'harder' (prefer
 * Higher tier). Reuses Phase F's filterByTier on curriculumBank.
 */

import {
  anotherOneLikeThis,
  type AnotherOneInput,
  type AnotherOneOutput,
} from "./anotherOneLikeThis";
import type { Tier } from "./curriculumBank";

export type TierShift = "easier" | "harder";

export interface TierShiftInput extends Omit<AnotherOneInput, "tier"> {
  shift: TierShift;
  /** Current tier of the question (defaults to 'both'). */
  currentTier?: Tier;
}

function resolveTier(currentTier: Tier | undefined, shift: TierShift): Tier {
  if (shift === "easier") {
    if (currentTier === "higher") return "both";
    return "foundation";
  }
  // harder
  if (currentTier === "foundation") return "both";
  return "higher";
}

export async function tierShiftedAnotherOne(input: TierShiftInput): Promise<AnotherOneOutput> {
  const tier = resolveTier(input.currentTier, input.shift);
  return anotherOneLikeThis({ ...input, tier });
}

export const __testing = { resolveTier };
