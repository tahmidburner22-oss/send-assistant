/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * proceduralActivities/matching.ts — FEAT-G4.
 *
 * Matching activity. Left column stays in input order, right column
 * is shuffled by a seeded LCG. The `key` array reports the original
 * index of right[i] so the answer-key page (G12) can render the
 * correct pairing without recomputing.
 */

import { makeRandom } from "./seededRandom";

export interface MatchingPair {
  left: string;
  right: string;
}

export interface MatchingInput {
  pairs: MatchingPair[];
  seed?: number;
}

export interface MatchingOutput {
  left: string[];
  right: string[];
  /** key[i] = original index of right[i] in the input pairs. */
  key: number[];
  warnings: string[];
}

export function generateMatching(input: MatchingInput): MatchingOutput {
  const pairs = (input.pairs || []).filter((p) => p && p.left && p.right);
  if (pairs.length < 2) {
    return {
      left: pairs.map((p) => p.left),
      right: pairs.map((p) => p.right),
      key: pairs.map((_, i) => i),
      warnings: pairs.length < 2 ? ["Matching needs at least 2 pairs."] : [],
    };
  }
  const left = pairs.map((p) => p.left);
  const indices = pairs.map((_, i) => i);
  const rand = makeRandom(input.seed ?? 1);
  // Fisher-Yates with at-least-one-displacement guarantee
  let attempts = 0;
  let shuffled: number[] = indices.slice();
  while (attempts < 5) {
    const out = shuffled.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.some((v, i) => v !== i)) {
      shuffled = out;
      break;
    }
    attempts += 1;
  }
  if (shuffled.every((v, i) => v === i) && shuffled.length >= 2) {
    // Deterministic last-resort displacement.
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return {
    left,
    right: shuffled.map((idx) => pairs[idx].right),
    key: shuffled,
    warnings: [],
  };
}
