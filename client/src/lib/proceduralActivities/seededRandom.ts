/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * proceduralActivities/seededRandom.ts — FEAT-G4.
 *
 * Tiny seeded PRNG used by the four procedural-activity generators
 * to make output deterministic across runs. mulberry32 is good
 * enough for shuffles; we don't need crypto-grade randomness here.
 */

export type SeededRandom = () => number;

export function makeRandom(seed: number = 1): SeededRandom {
  let s = seed >>> 0;
  if (s === 0) s = 0x9e3779b9;
  return function rand() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded<T>(arr: T[], rand: SeededRandom): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
