/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval-rubric.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Locks the rubric registry's invariants so a contributor adding /
 * editing an axis can't silently break the contract that the rater,
 * the axis-floor rule, and the summariser all rely on.
 *
 * Specifically:
 *   1. Exactly five axes (the canonical set, in canonical order).
 *   2. All axis ids are unique + kebab-case.
 *   3. Every axis declares all five bands, indexed 1..5 in order.
 *   4. Every band's descriptor is non-empty.
 *   5. Every axis's prompt is non-empty.
 *   6. Weights sum to exactly 1.0 (allowing for FP epsilon).
 *   7. `RUBRIC_AXIS_IDS` matches the order in `RUBRIC_AXES`.
 *   8. `getRubricAxis` returns the axis for valid ids and throws
 *      for unknown ids.
 *   9. `weightedAxisAverage` computes the right value for a full map
 *      and a partial map (missing axes contribute 0).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";

import {
  RUBRIC_AXES,
  RUBRIC_AXIS_IDS,
  getRubricAxis,
  weightedAxisAverage,
} from "./worksheet-eval/rubric";

const CANONICAL_IDS = [
  "curriculum-fidelity",
  "command-word-discipline",
  "scaffolding",
  "send-register",
  "examiner-voice",
];

describe("rubric — registry shape", () => {
  it("exposes exactly five axes in canonical order", () => {
    expect(RUBRIC_AXES.map((a) => a.id)).toEqual(CANONICAL_IDS);
  });

  it("axis ids are unique", () => {
    const ids = RUBRIC_AXES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("axis ids are kebab-case (lowercase, hyphen-separated)", () => {
    for (const axis of RUBRIC_AXES) {
      expect(axis.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it("every axis declares bands at levels 1..5 in order", () => {
    for (const axis of RUBRIC_AXES) {
      expect(axis.bands.map((b) => b.level)).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it("every band has a non-empty descriptor", () => {
    for (const axis of RUBRIC_AXES) {
      for (const band of axis.bands) {
        expect(band.descriptor.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("every axis has a non-empty prompt", () => {
    for (const axis of RUBRIC_AXES) {
      expect(axis.prompt.trim().length).toBeGreaterThan(0);
    }
  });

  it("weights sum to 1.0", () => {
    const sum = RUBRIC_AXES.reduce((acc, a) => acc + a.weight, 0);
    expect(sum).toBeCloseTo(1.0, 6);
  });

  it("RUBRIC_AXIS_IDS preserves registry order", () => {
    expect(RUBRIC_AXIS_IDS).toEqual(RUBRIC_AXES.map((a) => a.id));
  });
});

describe("rubric — getRubricAxis", () => {
  it("returns the axis for a valid id", () => {
    const axis = getRubricAxis("scaffolding");
    expect(axis.id).toBe("scaffolding");
    expect(axis.name).toBe("Scaffolding");
  });

  it("throws for an unknown id", () => {
    expect(() => getRubricAxis("not-an-axis")).toThrow(
      /Unknown rubric axis id/,
    );
  });
});

describe("rubric — weightedAxisAverage", () => {
  it("returns 0 when no scores are given", () => {
    expect(weightedAxisAverage({})).toBe(0);
  });

  it("computes the right value for a full map", () => {
    const scores: Record<string, number> = {};
    for (const id of RUBRIC_AXIS_IDS) scores[id] = 4;
    // every axis at 4, weights sum to 1 → average is 4
    expect(weightedAxisAverage(scores)).toBeCloseTo(4, 6);
  });

  it("missing axes contribute 0 (their weight is wasted)", () => {
    // only curriculum-fidelity (weight 0.25) at score 5 → 0.25 * 5 = 1.25
    const partial = { "curriculum-fidelity": 5 };
    expect(weightedAxisAverage(partial)).toBeCloseTo(1.25, 6);
  });

  it("ignores unknown axes silently (no throw)", () => {
    const scores = { "curriculum-fidelity": 5, "not-an-axis": 5 };
    expect(weightedAxisAverage(scores)).toBeCloseTo(1.25, 6);
  });
});
