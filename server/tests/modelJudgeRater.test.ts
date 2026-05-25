/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/modelJudgeRater.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lock the Sprint 1.D model-judge rater behaviour. Pure tests only —
 * no LLM, no network. The live rater's transport path is exercised
 * by the runner integration, not here.
 *
 * Sprint 1.D (PR-1 / big-bang-7-sprints).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  stubRater,
  computeStubScores,
  classifyWarning,
  bandFromQaScore,
  parseJudgeResponse,
  buildJudgeUserMessage,
  truncateRationale,
  assessProviderIsolation,
  pickRater,
  offRater,
  liveRater,
  RATIONALE_TRUNCATE_AT,
} from "./worksheet-eval/modelJudgeRater";
import type { EvalFixture } from "./worksheet-eval/types";
import type { PostValidatorWorksheet } from "../../client/src/lib/worksheetPostValidator";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fixture(overrides: Partial<EvalFixture> = {}): EvalFixture {
  return {
    id: "test",
    title: "Test fixture",
    bucket: "maths",
    params: { subject: "Maths", topic: "Test topic", yearGroup: "Year 7" },
    rules: [],
    ...overrides,
  };
}

function worksheet(
  meta: Record<string, unknown> = {},
): PostValidatorWorksheet {
  return {
    title: "Test worksheet",
    subtitle: "Y7 Maths",
    sections: [
      { id: "lo", type: "learning-objective", title: "LO", content: "Learn it." },
      { id: "q1", type: "q-short-answer", title: "Q1", content: "Define x." },
    ],
    metadata: { qaScore: { total: 75 }, ...meta },
  } as PostValidatorWorksheet;
}

// ─── bandFromQaScore ─────────────────────────────────────────────────────────

describe("bandFromQaScore", () => {
  it("maps qaScore bands to 1-5 per the rubric", () => {
    expect(bandFromQaScore(95)).toBe(5);
    expect(bandFromQaScore(90)).toBe(5); // edge
    expect(bandFromQaScore(89)).toBe(4);
    expect(bandFromQaScore(75)).toBe(4); // edge
    expect(bandFromQaScore(74)).toBe(3);
    expect(bandFromQaScore(60)).toBe(3); // edge
    expect(bandFromQaScore(59)).toBe(2);
    expect(bandFromQaScore(40)).toBe(2); // edge
    expect(bandFromQaScore(39)).toBe(1);
    expect(bandFromQaScore(0)).toBe(1);
  });

  it("returns 3 for missing/invalid input (default 'usable with edit')", () => {
    expect(bandFromQaScore(undefined)).toBe(3);
    expect(bandFromQaScore(NaN)).toBe(3);
  });
});

// ─── classifyWarning ─────────────────────────────────────────────────────────

describe("classifyWarning", () => {
  it("maps spec-ref + AO + year-group warnings to curriculumFidelity", () => {
    expect(classifyWarning("Filled missing specRef on Q3")).toContain(
      "curriculumFidelity",
    );
    expect(classifyWarning("Invented specref X99")).toContain(
      "curriculumFidelity",
    );
    expect(classifyWarning("Year group lock failed")).toContain(
      "curriculumFidelity",
    );
  });

  it("maps command-word + leaked-instruction warnings to stemAuthenticity", () => {
    expect(classifyWarning("Command-word fidelity: AQA")).toContain(
      "stemAuthenticity",
    );
    expect(
      classifyWarning("Stripped leaked generator instruction: [INSERT]"),
    ).toContain("stemAuthenticity");
    expect(classifyWarning("Past-paper fingerprint matched 0.9")).toContain(
      "stemAuthenticity",
    );
  });

  it("maps reading-age + Tier-3 + WCAG warnings to accessibility", () => {
    expect(classifyWarning("Reading age 16.3 exceeds budget")).toContain(
      "accessibility",
    );
    expect(classifyWarning("Tier-3 vocabulary unexplained: cellulose")).toContain(
      "accessibility",
    );
    expect(classifyWarning("WCAG: alt text missing on diagram-2")).toContain(
      "accessibility",
    );
  });

  it("maps mark-scheme + maths-verifier + multiple-correct warnings to marksAndAnswers", () => {
    expect(classifyWarning("Mark scheme entry missing for Q5")).toContain(
      "marksAndAnswers",
    );
    expect(classifyWarning("MathsVerifier: arithmetic mismatch")).toContain(
      "marksAndAnswers",
    );
    expect(classifyWarning("Removed a second ✓ on Q3")).toContain(
      "marksAndAnswers",
    );
  });

  it("maps SEND-fidelity warnings to sendAlignment", () => {
    expect(classifyWarning("SEND fidelity 0.3 below floor")).toContain(
      "sendAlignment",
    );
    expect(classifyWarning("Dyslexia scaffold absent")).toContain(
      "sendAlignment",
    );
  });

  it("maps page-fit + foreign-diagram + revision-tip warnings to uxAndPrintability", () => {
    expect(classifyWarning("Page fit overflow on section 4")).toContain(
      "uxAndPrintability",
    );
    expect(classifyWarning("Removed foreign diagram (biology on maths)")).toContain(
      "uxAndPrintability",
    );
    expect(classifyWarning("Revision tip ladder missing")).toContain(
      "uxAndPrintability",
    );
  });

  it("returns empty array for unrecognised warnings (no axis penalty)", () => {
    expect(classifyWarning("Some new warning we haven't classified yet")).toEqual([]);
  });
});

// ─── computeStubScores (determinism + axis behaviour) ────────────────────────

describe("computeStubScores", () => {
  it("is deterministic — same input gives same output", () => {
    const ws = worksheet({
      qaScore: { total: 78 },
      postValidatorWarnings: ["Reading age 14 exceeds budget"],
    });
    const a = computeStubScores(ws, fixture());
    const b = computeStubScores(ws, fixture());
    expect(a).toEqual(b);
  });

  it("returns null for sendAlignment when fixture has no sendNeed", () => {
    const ws = worksheet();
    const r = computeStubScores(ws, fixture());
    expect(r.scores.sendAlignment).toBeNull();
  });

  it("returns a number for sendAlignment when fixture declares sendNeed", () => {
    const ws = worksheet();
    const f = fixture({
      params: {
        subject: "Maths",
        topic: "T",
        yearGroup: "Year 7",
        sendNeed: "dyslexia",
      },
    });
    const r = computeStubScores(ws, f);
    expect(typeof r.scores.sendAlignment).toBe("number");
    expect(r.scores.sendAlignment).toBeGreaterThanOrEqual(1);
    expect(r.scores.sendAlignment).toBeLessThanOrEqual(5);
  });

  it("starts every axis at the qaScore band when there are no warnings", () => {
    // qaScore 95 → band 5
    const ws = worksheet({
      qaScore: { total: 95 },
      postValidatorWarnings: [],
    });
    const r = computeStubScores(ws, fixture());
    expect(r.scores.curriculumFidelity).toBe(5);
    expect(r.scores.stemAuthenticity).toBe(5);
    expect(r.scores.accessibility).toBe(5);
    expect(r.scores.marksAndAnswers).toBe(5);
    expect(r.scores.uxAndPrintability).toBe(5);
  });

  it("deducts 1 from the relevant axis per matching warning", () => {
    const ws = worksheet({
      qaScore: { total: 95 }, // base band 5 across the board
      postValidatorWarnings: [
        "Reading age 14 exceeds budget", // → accessibility -1
      ],
    });
    const r = computeStubScores(ws, fixture());
    expect(r.scores.accessibility).toBe(4);
    expect(r.scores.curriculumFidelity).toBe(5); // unchanged
  });

  it("caps deductions per axis at 3 (no axis ever sinks below 1 without intent)", () => {
    const ws = worksheet({
      qaScore: { total: 95 }, // base 5
      postValidatorWarnings: [
        "Reading age too high",
        "Tier-3 word unexplained",
        "WCAG contrast failure",
        "Plain English: long sentence",
        "Notation hygiene: missing fraction",
      ],
    });
    const r = computeStubScores(ws, fixture());
    // base 5 - cap 3 = 2 (not 0 even though 5 warnings hit)
    expect(r.scores.accessibility).toBe(2);
  });

  it("clamps every axis to [1, 5]", () => {
    const ws = worksheet({
      qaScore: { total: 35 }, // base 1
      postValidatorWarnings: [
        "Reading age too high",
        "WCAG: missing alt text",
      ],
    });
    const r = computeStubScores(ws, fixture());
    expect(r.scores.accessibility).toBeGreaterThanOrEqual(1);
    expect(r.scores.accessibility).toBeLessThanOrEqual(5);
    expect(r.scores.curriculumFidelity).toBeGreaterThanOrEqual(1);
  });

  it("rationale includes qaScore band + deduction summary + warning count", () => {
    const ws = worksheet({
      qaScore: { total: 75 },
      postValidatorWarnings: ["Reading age 14 exceeds budget"],
    });
    const r = computeStubScores(ws, fixture());
    expect(r.rationale).toContain("[stub]");
    expect(r.rationale).toContain("qaScore 75");
    expect(r.rationale).toContain("band 4");
    expect(r.rationale).toContain("accessibility");
    expect(r.rationale).toContain("Warnings observed: 1");
  });

  it("handles missing qaScore gracefully (defaults to band 3)", () => {
    const ws = {
      title: "x",
      subtitle: "y",
      sections: [],
      metadata: {},
    } as PostValidatorWorksheet;
    const r = computeStubScores(ws, fixture());
    expect(r.scores.curriculumFidelity).toBe(3);
    expect(r.rationale).toContain("qaScore absent");
  });
});

// ─── stubRater wrapper ───────────────────────────────────────────────────────

describe("stubRater", () => {
  it("rate() resolves to the same shape as computeStubScores", async () => {
    const ws = worksheet();
    const direct = computeStubScores(ws, fixture());
    const viaRater = await stubRater.rate(ws, fixture());
    expect(viaRater).toEqual(direct);
  });

  it("estimatedCostUsd is exactly 0", () => {
    expect(stubRater.estimatedCostUsd).toBe(0);
  });

  it("name is 'stub' and provider is 'stub'", () => {
    expect(stubRater.name).toBe("stub");
    expect(stubRater.provider).toBe("stub");
  });
});

// ─── parseJudgeResponse ──────────────────────────────────────────────────────

describe("parseJudgeResponse", () => {
  it("parses a clean JSON object", () => {
    const raw = JSON.stringify({
      scores: {
        curriculumFidelity: 4,
        stemAuthenticity: 3,
        accessibility: 5,
        marksAndAnswers: 4,
        sendAlignment: null,
        uxAndPrintability: 4,
      },
      rationale: "Strong on accessibility, weakest on stems.",
    });
    const r = parseJudgeResponse(raw);
    expect(r).not.toBeNull();
    expect(r?.scores.curriculumFidelity).toBe(4);
    expect(r?.scores.sendAlignment).toBeNull();
    expect(r?.rationale).toContain("accessibility");
  });

  it("strips ```json fences", () => {
    const raw = '```json\n{"scores":{"curriculumFidelity":4,"stemAuthenticity":4,"accessibility":4,"marksAndAnswers":4,"sendAlignment":null,"uxAndPrintability":4},"rationale":"ok"}\n```';
    const r = parseJudgeResponse(raw);
    expect(r).not.toBeNull();
    expect(r?.scores.curriculumFidelity).toBe(4);
  });

  it("falls back to greedy extraction when JSON is wrapped in commentary", () => {
    const raw =
      'Here are the scores:\n{"scores":{"curriculumFidelity":3,"stemAuthenticity":3,"accessibility":3,"marksAndAnswers":3,"sendAlignment":null,"uxAndPrintability":3},"rationale":"meh"}\nHope this helps!';
    const r = parseJudgeResponse(raw);
    expect(r).not.toBeNull();
    expect(r?.scores.stemAuthenticity).toBe(3);
  });

  it("returns null on completely invalid input", () => {
    expect(parseJudgeResponse("not json at all")).toBeNull();
    expect(parseJudgeResponse("")).toBeNull();
  });

  it("returns null when an axis is out of range [1,5]", () => {
    const raw = JSON.stringify({
      scores: {
        curriculumFidelity: 6, // out of range
        stemAuthenticity: 4,
        accessibility: 4,
        marksAndAnswers: 4,
        sendAlignment: null,
        uxAndPrintability: 4,
      },
      rationale: "",
    });
    expect(parseJudgeResponse(raw)).toBeNull();
  });

  it("returns null when a non-nullable axis is null", () => {
    const raw = JSON.stringify({
      scores: {
        curriculumFidelity: null, // not allowed null
        stemAuthenticity: 4,
        accessibility: 4,
        marksAndAnswers: 4,
        sendAlignment: null,
        uxAndPrintability: 4,
      },
      rationale: "",
    });
    expect(parseJudgeResponse(raw)).toBeNull();
  });

  it("truncates rationale to RATIONALE_TRUNCATE_AT chars", () => {
    const longRationale = "x".repeat(RATIONALE_TRUNCATE_AT + 200);
    const raw = JSON.stringify({
      scores: {
        curriculumFidelity: 4,
        stemAuthenticity: 4,
        accessibility: 4,
        marksAndAnswers: 4,
        sendAlignment: null,
        uxAndPrintability: 4,
      },
      rationale: longRationale,
    });
    const r = parseJudgeResponse(raw);
    expect(r?.rationale.length).toBeLessThanOrEqual(RATIONALE_TRUNCATE_AT);
    expect(r?.rationale.endsWith("...")).toBe(true);
  });
});

// ─── buildJudgeUserMessage ──────────────────────────────────────────────────

describe("buildJudgeUserMessage", () => {
  it("includes subject / year / topic / examBoard from fixture params", () => {
    const ws = worksheet();
    const f = fixture({
      params: {
        subject: "Biology",
        topic: "Photosynthesis",
        yearGroup: "Year 10",
        examBoard: "AQA",
        difficulty: "medium",
      },
    });
    const msg = buildJudgeUserMessage(ws, f);
    expect(msg).toContain("Subject: Biology");
    expect(msg).toContain("Year 10");
    expect(msg).toContain("Photosynthesis");
    expect(msg).toContain("Exam board: AQA");
    expect(msg).toContain("medium");
  });

  it("flags non-SEND fixtures so the judge returns null for sendAlignment", () => {
    const ws = worksheet();
    const msg = buildJudgeUserMessage(ws, fixture());
    expect(msg).toContain("No SEND profile declared");
    expect(msg).toContain("sendAlignment: null");
  });

  it("flags SEND fixtures with the declared profile", () => {
    const ws = worksheet();
    const f = fixture({
      params: {
        subject: "Maths",
        topic: "T",
        yearGroup: "Year 7",
        sendNeed: "dyslexia",
      },
    });
    const msg = buildJudgeUserMessage(ws, f);
    expect(msg).toContain("SEND profile declared: dyslexia");
    expect(msg).toContain("Score sendAlignment 1–5");
  });

  it("renders sections compactly (type, title, first 200 chars)", () => {
    const longContent = "a".repeat(500);
    const ws = {
      title: "T",
      subtitle: "S",
      sections: [
        {
          id: "x",
          type: "learning-objective",
          title: "LO",
          content: longContent,
        },
      ],
      metadata: {},
    } as PostValidatorWorksheet;
    const msg = buildJudgeUserMessage(ws, fixture());
    expect(msg).toContain("[learning-objective] LO");
    // First 200 chars only
    const renderedContent = msg.split("LO")[1] ?? "";
    expect(renderedContent.length).toBeLessThan(longContent.length);
  });
});

// ─── truncateRationale ──────────────────────────────────────────────────────

describe("truncateRationale", () => {
  it("returns input unchanged when within budget", () => {
    expect(truncateRationale("short")).toBe("short");
  });

  it("trims to budget with ellipsis when over", () => {
    const long = "x".repeat(RATIONALE_TRUNCATE_AT + 10);
    const trimmed = truncateRationale(long);
    expect(trimmed.length).toBe(RATIONALE_TRUNCATE_AT);
    expect(trimmed.endsWith("...")).toBe(true);
  });
});

// ─── assessProviderIsolation ─────────────────────────────────────────────────

describe("assessProviderIsolation", () => {
  beforeEach(() => {
    delete process.env.EVAL_JUDGE_STRICT_ISOLATION;
  });
  afterEach(() => {
    delete process.env.EVAL_JUDGE_STRICT_ISOLATION;
  });

  it("returns isolated=true when judge is stub (offline)", () => {
    const r = assessProviderIsolation("stub", "openai");
    expect(r.isolated).toBe(true);
    expect(r.warning).toBeNull();
  });

  it("returns isolated=true when generator is mock (offline)", () => {
    const r = assessProviderIsolation("claude", "mock");
    expect(r.isolated).toBe(true);
  });

  it("returns isolated=true when providers differ", () => {
    const r = assessProviderIsolation("claude", "openai");
    expect(r.isolated).toBe(true);
    expect(r.warning).toBeNull();
  });

  it("returns isolated=false with a warning when providers match", () => {
    const r = assessProviderIsolation("openai", "openai");
    expect(r.isolated).toBe(false);
    expect(r.warning).not.toBeNull();
    expect(r.warning).toContain("openai");
  });

  it("throws when strict isolation is on AND providers match", () => {
    process.env.EVAL_JUDGE_STRICT_ISOLATION = "1";
    expect(() => assessProviderIsolation("openai", "openai")).toThrow();
  });

  it("does NOT throw when strict isolation is on AND providers differ", () => {
    process.env.EVAL_JUDGE_STRICT_ISOLATION = "1";
    expect(() => assessProviderIsolation("claude", "openai")).not.toThrow();
  });
});

// ─── pickRater factory + offRater ────────────────────────────────────────────

describe("pickRater + offRater", () => {
  beforeEach(() => {
    delete process.env.EVAL_JUDGE_MODE;
  });
  afterEach(() => {
    delete process.env.EVAL_JUDGE_MODE;
  });

  it("defaults to stubRater when EVAL_JUDGE_MODE is unset", () => {
    expect(pickRater()).toBe(stubRater);
  });

  it("returns stubRater for EVAL_JUDGE_MODE=stub", () => {
    process.env.EVAL_JUDGE_MODE = "stub";
    expect(pickRater()).toBe(stubRater);
  });

  it("returns liveRater for EVAL_JUDGE_MODE=live", () => {
    process.env.EVAL_JUDGE_MODE = "live";
    expect(pickRater()).toBe(liveRater);
  });

  it("returns offRater for EVAL_JUDGE_MODE=off", () => {
    process.env.EVAL_JUDGE_MODE = "off";
    expect(pickRater()).toBe(offRater);
  });

  it("offRater returns all-null scores", async () => {
    const ws = worksheet();
    const r = await offRater.rate(ws, fixture());
    expect(r.scores.curriculumFidelity).toBeNull();
    expect(r.scores.stemAuthenticity).toBeNull();
    expect(r.scores.sendAlignment).toBeNull();
    expect(r.scores.uxAndPrintability).toBeNull();
    expect(r.rationale).toContain("disabled by EVAL_JUDGE_MODE=off");
  });
});
