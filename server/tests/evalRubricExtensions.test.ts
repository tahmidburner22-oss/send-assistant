/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/evalRubricExtensions.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lock the Sprint 1.C additions to the eval harness:
 *   - AxisScores / AxisScoresAggregate / HumanScoreEntry types load
 *   - rules.ts model-judge-axis-floor rule enforces per-axis floors
 *     (default 3, fixture override, null = n/a, missing = no-op)
 *   - summariser.ts aggregateAxisScores + medianHumanScores helpers
 *     are pure + deterministic + null-safe.
 *
 * No LLM calls. No disk I/O.
 *
 * Sprint 1.C (PR-1 / big-bang-7-sprints).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";

import { RULE_REGISTRY, evaluateRules } from "./worksheet-eval/rules";
import {
  aggregateAxisScores,
  medianHumanScores,
} from "./worksheet-eval/summariser";
import {
  AXIS_KEYS,
  type AxisKey,
  type AxisScores,
  type EvalFixture,
  type HumanScoreEntry,
} from "./worksheet-eval/types";
import type { PostValidatorWorksheet } from "../../client/src/lib/worksheetPostValidator";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fixture(overrides: Partial<EvalFixture> = {}): EvalFixture {
  return {
    id: "test",
    title: "Test fixture",
    bucket: "maths",
    params: { subject: "Maths", topic: "Test topic", yearGroup: "Year 7" },
    rules: ["model-judge-axis-floor"],
    ...overrides,
  };
}

function worksheetWithJudgeScores(
  scores: Partial<AxisScores> | undefined,
): PostValidatorWorksheet {
  const fullScores: AxisScores = {
    curriculumFidelity: 5,
    stemAuthenticity: 5,
    accessibility: 5,
    marksAndAnswers: 5,
    sendAlignment: null,
    uxAndPrintability: 5,
    ...scores,
  };
  return {
    title: "t",
    subtitle: "s",
    sections: [],
    metadata: scores ? { modelJudgeScores: fullScores } : {},
  } as PostValidatorWorksheet;
}

// ─── Rule: model-judge-axis-floor ────────────────────────────────────────────

describe("rules.model-judge-axis-floor", () => {
  it("is registered in RULE_REGISTRY", () => {
    expect(typeof RULE_REGISTRY["model-judge-axis-floor"]).toBe("function");
  });

  it("passes when no judge ran (no metadata.modelJudgeScores)", () => {
    const ws = worksheetWithJudgeScores(undefined);
    const result = evaluateRules(ws, fixture());
    expect(result.passed).toBe(true);
    expect(result.failedRules).toHaveLength(0);
  });

  it("passes when every axis is at or above the default floor of 3", () => {
    const ws = worksheetWithJudgeScores({
      curriculumFidelity: 3,
      stemAuthenticity: 4,
      accessibility: 5,
      marksAndAnswers: 3,
      uxAndPrintability: 4,
    });
    const result = evaluateRules(ws, fixture());
    expect(result.passed).toBe(true);
  });

  it("fails when any axis is below the default floor of 3", () => {
    const ws = worksheetWithJudgeScores({
      curriculumFidelity: 4,
      stemAuthenticity: 2, // ← fails
      accessibility: 5,
      marksAndAnswers: 4,
      uxAndPrintability: 4,
    });
    const result = evaluateRules(ws, fixture());
    expect(result.passed).toBe(false);
    expect(result.failedRules[0].rule).toBe("model-judge-axis-floor");
    expect(result.failedRules[0].reason).toContain("stemAuthenticity");
    expect(result.failedRules[0].reason).toContain("2");
  });

  it("respects per-axis fixture override (relaxed)", () => {
    const ws = worksheetWithJudgeScores({
      curriculumFidelity: 4,
      stemAuthenticity: 2, // would fail at default 3
      accessibility: 5,
      marksAndAnswers: 4,
      uxAndPrintability: 4,
    });
    const f = fixture({
      modelJudgeAxisFloor: { stemAuthenticity: 2 },
    });
    const result = evaluateRules(ws, f);
    expect(result.passed).toBe(true);
  });

  it("respects per-axis fixture override (tightened)", () => {
    const ws = worksheetWithJudgeScores({
      curriculumFidelity: 3, // would pass at default 3 but fails at 4
      stemAuthenticity: 4,
      accessibility: 5,
      marksAndAnswers: 4,
      uxAndPrintability: 4,
    });
    const f = fixture({
      modelJudgeAxisFloor: { curriculumFidelity: 4 },
    });
    const result = evaluateRules(ws, f);
    expect(result.passed).toBe(false);
  });

  it("disables an axis check when floor is 0", () => {
    const ws = worksheetWithJudgeScores({
      curriculumFidelity: 4,
      stemAuthenticity: 1, // catastrophic fail
      accessibility: 5,
      marksAndAnswers: 4,
      uxAndPrintability: 4,
    });
    const f = fixture({
      modelJudgeAxisFloor: { stemAuthenticity: 0 },
    });
    const result = evaluateRules(ws, f);
    expect(result.passed).toBe(true);
  });

  it("treats null axis values as n/a (skips them)", () => {
    const ws = worksheetWithJudgeScores({
      curriculumFidelity: 5,
      stemAuthenticity: 5,
      accessibility: 5,
      marksAndAnswers: 5,
      sendAlignment: null, // intentional n/a — must NOT be treated as 0
      uxAndPrintability: 5,
    });
    const result = evaluateRules(ws, fixture());
    expect(result.passed).toBe(true);
  });

  it("aggregates multiple failures into one reason string", () => {
    const ws = worksheetWithJudgeScores({
      curriculumFidelity: 1,
      stemAuthenticity: 2,
      accessibility: 5,
      marksAndAnswers: 4,
      uxAndPrintability: 4,
    });
    const result = evaluateRules(ws, fixture());
    expect(result.passed).toBe(false);
    expect(result.failedRules[0].reason).toContain("curriculumFidelity");
    expect(result.failedRules[0].reason).toContain("stemAuthenticity");
  });
});

// ─── Summariser: aggregateAxisScores ─────────────────────────────────────────

describe("summariser.aggregateAxisScores", () => {
  it("returns empty aggregate when given no input", () => {
    const agg = aggregateAxisScores([]);
    for (const axis of AXIS_KEYS) {
      expect(agg[axis].count).toBe(0);
      expect(agg[axis].mean).toBeNull();
    }
  });

  it("ignores null/undefined entries gracefully", () => {
    const agg = aggregateAxisScores([null, undefined]);
    for (const axis of AXIS_KEYS) {
      expect(agg[axis].count).toBe(0);
    }
  });

  it("computes mean / min / max / count over non-null axis values", () => {
    const blocks: AxisScores[] = [
      {
        curriculumFidelity: 4,
        stemAuthenticity: 3,
        accessibility: 5,
        marksAndAnswers: 4,
        sendAlignment: null,
        uxAndPrintability: 4,
      },
      {
        curriculumFidelity: 5,
        stemAuthenticity: 4,
        accessibility: 5,
        marksAndAnswers: 5,
        sendAlignment: 4,
        uxAndPrintability: 5,
      },
    ];
    const agg = aggregateAxisScores(blocks);

    expect(agg.curriculumFidelity).toEqual({
      mean: 4.5,
      min: 4,
      max: 5,
      count: 2,
    });
    expect(agg.sendAlignment).toEqual({
      mean: 4,
      min: 4,
      max: 4,
      count: 1, // one block had null
    });
  });

  it("rounds mean to 2 decimal places (stable across runs)", () => {
    const blocks: AxisScores[] = [
      {
        curriculumFidelity: 1,
        stemAuthenticity: null,
        accessibility: null,
        marksAndAnswers: null,
        sendAlignment: null,
        uxAndPrintability: null,
      },
      {
        curriculumFidelity: 2,
        stemAuthenticity: null,
        accessibility: null,
        marksAndAnswers: null,
        sendAlignment: null,
        uxAndPrintability: null,
      },
      {
        curriculumFidelity: 2,
        stemAuthenticity: null,
        accessibility: null,
        marksAndAnswers: null,
        sendAlignment: null,
        uxAndPrintability: null,
      },
    ];
    const agg = aggregateAxisScores(blocks);
    expect(agg.curriculumFidelity.mean).toBe(1.67); // 1.6667 → 1.67
  });

  it("does not mutate input blocks", () => {
    const block: AxisScores = {
      curriculumFidelity: 4,
      stemAuthenticity: null,
      accessibility: null,
      marksAndAnswers: null,
      sendAlignment: null,
      uxAndPrintability: null,
    };
    const snapshot = JSON.stringify(block);
    aggregateAxisScores([block]);
    expect(JSON.stringify(block)).toBe(snapshot);
  });
});

// ─── Summariser: medianHumanScores ───────────────────────────────────────────

describe("summariser.medianHumanScores", () => {
  it("returns null for empty / undefined input", () => {
    expect(medianHumanScores(undefined)).toBeNull();
    expect(medianHumanScores([])).toBeNull();
  });

  it("returns the rater's scores when only one rater is given", () => {
    const entries: HumanScoreEntry[] = [
      {
        raterId: "A",
        axes: {
          curriculumFidelity: 4,
          stemAuthenticity: 3,
          accessibility: 5,
          marksAndAnswers: 4,
          sendAlignment: null,
          uxAndPrintability: 4,
        },
      },
    ];
    const median = medianHumanScores(entries);
    expect(median).toEqual({
      curriculumFidelity: 4,
      stemAuthenticity: 3,
      accessibility: 5,
      marksAndAnswers: 4,
      sendAlignment: null,
      uxAndPrintability: 4,
    });
  });

  it("computes per-axis median across multiple raters (odd count)", () => {
    const entries: HumanScoreEntry[] = [
      {
        raterId: "A",
        axes: {
          curriculumFidelity: 3,
          stemAuthenticity: 2,
          accessibility: 4,
          marksAndAnswers: 3,
          sendAlignment: null,
          uxAndPrintability: 3,
        },
      },
      {
        raterId: "B",
        axes: {
          curriculumFidelity: 4,
          stemAuthenticity: 4,
          accessibility: 5,
          marksAndAnswers: 4,
          sendAlignment: null,
          uxAndPrintability: 4,
        },
      },
      {
        raterId: "C",
        axes: {
          curriculumFidelity: 5, // outlier
          stemAuthenticity: 4,
          accessibility: 5,
          marksAndAnswers: 5,
          sendAlignment: null,
          uxAndPrintability: 5,
        },
      },
    ];
    const median = medianHumanScores(entries);
    // Median is the middle value sorted, not the mean.
    // curriculumFidelity sorted: 3,4,5 → median 4
    expect(median?.curriculumFidelity).toBe(4);
    expect(median?.stemAuthenticity).toBe(4);
  });

  it("computes per-axis median across multiple raters (even count, averages middle two)", () => {
    const entries: HumanScoreEntry[] = [
      {
        raterId: "A",
        axes: {
          curriculumFidelity: 3,
          stemAuthenticity: null,
          accessibility: null,
          marksAndAnswers: null,
          sendAlignment: null,
          uxAndPrintability: null,
        },
      },
      {
        raterId: "B",
        axes: {
          curriculumFidelity: 5,
          stemAuthenticity: null,
          accessibility: null,
          marksAndAnswers: null,
          sendAlignment: null,
          uxAndPrintability: null,
        },
      },
    ];
    const median = medianHumanScores(entries);
    // (3 + 5) / 2 = 4
    expect(median?.curriculumFidelity).toBe(4);
  });

  it("treats axes with all-null values as null (not zero)", () => {
    const entries: HumanScoreEntry[] = [
      {
        raterId: "A",
        axes: {
          curriculumFidelity: 4,
          stemAuthenticity: null,
          accessibility: null,
          marksAndAnswers: null,
          sendAlignment: null,
          uxAndPrintability: null,
        },
      },
    ];
    const median = medianHumanScores(entries);
    expect(median?.sendAlignment).toBeNull();
    expect(median?.curriculumFidelity).toBe(4);
  });
});

// ─── Type-export sanity ──────────────────────────────────────────────────────

describe("AXIS_KEYS export", () => {
  it("contains exactly the 6 rubric axes in the rubric's order", () => {
    expect(AXIS_KEYS).toEqual([
      "curriculumFidelity",
      "stemAuthenticity",
      "accessibility",
      "marksAndAnswers",
      "sendAlignment",
      "uxAndPrintability",
    ]);
    // Type-level sanity — every key resolves to AxisKey.
    const k: AxisKey = AXIS_KEYS[0];
    expect(typeof k).toBe("string");
  });
});
