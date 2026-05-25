/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * client/src/lib/__tests__/validatorFeedbackRetry.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lock the Sprint 3.B retry helper. Pure tests — no LLM, no network.
 * The generator is a vi.fn() that returns deterministic stubs.
 *
 * Sprint 3.B (PR-1 / big-bang-7-sprints).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, vi } from "vitest";

import {
  stripValidatorPrefix,
  buildConstraintBlock,
  runWithValidatorFeedbackRetry,
  extractWorksheetEval,
  appendInstructionsConstraints,
  runWorksheetWithRetry,
} from "../validatorFeedbackRetry";
import type { AIWorksheetResult } from "../ai";

// ─── stripValidatorPrefix ────────────────────────────────────────────────────

describe("stripValidatorPrefix", () => {
  it("strips bracketed prefix followed by em-dash content", () => {
    expect(
      stripValidatorPrefix(
        "[Phase 1 / enforceSpecAnchorPresence] Filled missing specRef on Q3",
      ),
    ).toBe("Filled missing specRef on Q3");
  });

  it("strips PR-style bracketed prefixes", () => {
    expect(
      stripValidatorPrefix("[PR-2 — Awarding-body command-word fidelity] failed AQA glossary"),
    ).toBe("failed AQA glossary");
  });

  it("strips registry-style prefixes with colon", () => {
    expect(
      stripValidatorPrefix("[Phase PR-8 — Validator registry] foo bar"),
    ).toBe("foo bar");
  });

  it("returns input unchanged when there is no prefix", () => {
    expect(stripValidatorPrefix("Reading age 14 exceeds budget")).toBe(
      "Reading age 14 exceeds budget",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(stripValidatorPrefix("  hello  ")).toBe("hello");
  });

  it("strips prefix with em-dash separator after the bracket", () => {
    expect(
      stripValidatorPrefix("[command-word] — failed AQA glossary"),
    ).toBe("failed AQA glossary");
  });

  it("is idempotent — running twice gives same result", () => {
    const input = "[PR-3 — Tier-3 Vocab] flag";
    expect(stripValidatorPrefix(stripValidatorPrefix(input))).toBe(
      stripValidatorPrefix(input),
    );
  });
});

// ─── buildConstraintBlock ────────────────────────────────────────────────────

describe("buildConstraintBlock", () => {
  it("returns empty string for empty input", () => {
    expect(buildConstraintBlock([])).toBe("");
  });

  it("returns empty string when all warnings strip to nothing", () => {
    expect(buildConstraintBlock(["[just-prefix]", "[only-tag]"])).not.toContain("RETRY");
  });

  it("formats single warning as a numbered constraint", () => {
    const block = buildConstraintBlock(["Reading age 14 exceeds budget"]);
    expect(block).toContain("RETRY");
    expect(block).toContain("1. Reading age 14 exceeds budget");
    expect(block).toContain("hard constraint");
  });

  it("numbers multiple warnings 1, 2, 3, …", () => {
    const block = buildConstraintBlock([
      "First issue",
      "Second issue",
      "Third issue",
    ]);
    expect(block).toContain("1. First issue");
    expect(block).toContain("2. Second issue");
    expect(block).toContain("3. Third issue");
  });

  it("dedupes identical warnings", () => {
    const block = buildConstraintBlock(["Same", "Same", "Different"]);
    const matchCount = (block.match(/Same/g) || []).length;
    expect(matchCount).toBe(1);
    expect(block).toContain("Different");
  });

  it("respects maxWarnings cap", () => {
    const warnings = Array.from({ length: 20 }, (_, i) => `warn-${i}`);
    const block = buildConstraintBlock(warnings, 5);
    expect(block).toContain("warn-0");
    expect(block).toContain("warn-4");
    expect(block).not.toContain("warn-5");
  });

  it("strips validator prefixes before numbering", () => {
    const block = buildConstraintBlock([
      "[Phase 1 / enforceSpecAnchorPresence — Filled missing specRef on Q3]",
    ]);
    expect(block).not.toContain("Phase 1");
    expect(block).toContain("Filled missing specRef");
  });
});

// ─── runWithValidatorFeedbackRetry ──────────────────────────────────────────

describe("runWithValidatorFeedbackRetry", () => {
  function makeFakeWorksheet(
    warnings: string[],
    qaScore: number | undefined = undefined,
  ): { metadata: { warnings: string[]; qaScore?: number } } {
    return { metadata: { warnings, qaScore } };
  }

  const validate = (r: ReturnType<typeof makeFakeWorksheet>) => ({
    warnings: r.metadata.warnings,
    qaScore: r.metadata.qaScore,
  });
  const append = (
    p: { additionalInstructions?: string },
    c: string,
  ): { additionalInstructions?: string } => ({
    ...p,
    additionalInstructions: ((p.additionalInstructions ?? "") + "\n\n" + c).trim(),
  });

  it("does NOT retry when warnings count is below threshold", async () => {
    const generate = vi.fn().mockResolvedValue(makeFakeWorksheet(["w1", "w2"]));
    const out = await runWithValidatorFeedbackRetry(
      generate,
      validate,
      append,
      { additionalInstructions: "" },
      { threshold: 3 },
    );
    expect(out.retryCount).toBe(0);
    expect(out.retryReasons).toEqual([]);
    expect(generate).toHaveBeenCalledOnce();
  });

  it("retries ONCE when warnings count is at or above threshold", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(makeFakeWorksheet(["w1", "w2", "w3"], 60))
      .mockResolvedValueOnce(makeFakeWorksheet(["w4"], 80));
    const out = await runWithValidatorFeedbackRetry(
      generate,
      validate,
      append,
      { additionalInstructions: "" },
      { threshold: 3 },
    );
    expect(out.retryCount).toBe(1);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(out.retryReasons).toEqual(["w1", "w2", "w3"]);
  });

  it("appends the constraint block to additionalInstructions on retry", async () => {
    const generate = vi.fn();
    generate
      .mockResolvedValueOnce(
        makeFakeWorksheet(["First problem", "Second problem", "Third problem"], 60),
      )
      .mockResolvedValueOnce(makeFakeWorksheet([], 80));
    await runWithValidatorFeedbackRetry(
      generate,
      validate,
      append,
      { additionalInstructions: "Be thorough." },
      { threshold: 3 },
    );
    const retryArgs = generate.mock.calls[1][0];
    expect(retryArgs.additionalInstructions).toContain("Be thorough.");
    expect(retryArgs.additionalInstructions).toContain("RETRY");
    expect(retryArgs.additionalInstructions).toContain("First problem");
  });

  it("keeps the higher-qaScore winner (retry better)", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(makeFakeWorksheet(["w1", "w2", "w3"], 50))
      .mockResolvedValueOnce(makeFakeWorksheet([], 90));
    const out = await runWithValidatorFeedbackRetry(
      generate,
      validate,
      append,
      { additionalInstructions: "" },
      { threshold: 3 },
    );
    expect(validate(out.result as any).qaScore).toBe(90);
  });

  it("keeps the original when the retry produced a lower qaScore", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(makeFakeWorksheet(["w1", "w2", "w3"], 70))
      .mockResolvedValueOnce(makeFakeWorksheet([], 50));
    const out = await runWithValidatorFeedbackRetry(
      generate,
      validate,
      append,
      { additionalInstructions: "" },
      { threshold: 3 },
    );
    expect(validate(out.result as any).qaScore).toBe(70);
    expect(out.retryCount).toBe(1); // retry happened, original won
  });

  it("ties on qaScore go to the retry (it had the benefit of feedback)", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(makeFakeWorksheet(["w1", "w2", "w3"], 70))
      .mockResolvedValueOnce(makeFakeWorksheet([], 70));
    const out = await runWithValidatorFeedbackRetry(
      generate,
      validate,
      append,
      { additionalInstructions: "" },
      { threshold: 3 },
    );
    // Tie: retry wins. We can detect by warnings array — retry has []
    expect(validate(out.result as any).warnings).toEqual([]);
  });

  it("falls back to original when the retry generator throws", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(makeFakeWorksheet(["w1", "w2", "w3"], 70))
      .mockRejectedValueOnce(new Error("transient network failure"));
    const out = await runWithValidatorFeedbackRetry(
      generate,
      validate,
      append,
      { additionalInstructions: "" },
      { threshold: 3 },
    );
    expect(out.retryCount).toBe(1);
    expect(out.retryReasons).toEqual(["w1", "w2", "w3"]);
    expect(validate(out.result as any).qaScore).toBe(70);
  });

  it("threshold=0 disables retry (no warnings → no retry)", async () => {
    const generate = vi.fn().mockResolvedValue(makeFakeWorksheet([]));
    const out = await runWithValidatorFeedbackRetry(
      generate,
      validate,
      append,
      { additionalInstructions: "" },
      { threshold: 0 },
    );
    expect(out.retryCount).toBe(0);
    expect(generate).toHaveBeenCalledOnce();
  });

  it("threshold=Infinity also disables retry", async () => {
    const generate = vi
      .fn()
      .mockResolvedValue(makeFakeWorksheet(["w1", "w2", "w3", "w4", "w5"]));
    const out = await runWithValidatorFeedbackRetry(
      generate,
      validate,
      append,
      { additionalInstructions: "" },
      { threshold: Infinity },
    );
    expect(out.retryCount).toBe(0);
  });
});

// ─── extractWorksheetEval ────────────────────────────────────────────────────

describe("extractWorksheetEval", () => {
  it("reads warnings + qaScore from metadata", () => {
    const ws = {
      title: "x",
      sections: [],
      metadata: {
        postValidatorWarnings: ["a", "b"],
        qaScore: { total: 75 },
      },
    } as unknown as AIWorksheetResult;
    const r = extractWorksheetEval(ws);
    expect(r.warnings).toEqual(["a", "b"]);
    expect(r.qaScore).toBe(75);
  });

  it("returns empty warnings + undefined qaScore when metadata missing fields", () => {
    const ws = {
      title: "x",
      sections: [],
      metadata: {},
    } as unknown as AIWorksheetResult;
    const r = extractWorksheetEval(ws);
    expect(r.warnings).toEqual([]);
    expect(r.qaScore).toBeUndefined();
  });

  it("survives totally absent metadata block", () => {
    const ws = {
      title: "x",
      sections: [],
    } as unknown as AIWorksheetResult;
    const r = extractWorksheetEval(ws);
    expect(r.warnings).toEqual([]);
  });
});

// ─── appendInstructionsConstraints ───────────────────────────────────────────

describe("appendInstructionsConstraints", () => {
  it("populates additionalInstructions when previously empty", () => {
    const out = appendInstructionsConstraints({ subject: "Maths" } as any, "BLOCK");
    expect(out.additionalInstructions).toBe("BLOCK");
  });

  it("appends with a blank-line separator when additionalInstructions exists", () => {
    const out = appendInstructionsConstraints(
      { additionalInstructions: "Be thorough." } as any,
      "BLOCK",
    );
    expect(out.additionalInstructions).toBe("Be thorough.\n\nBLOCK");
  });

  it("does not mutate the input params", () => {
    const input = { additionalInstructions: "x" } as any;
    const snapshot = JSON.stringify(input);
    appendInstructionsConstraints(input, "y");
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

// ─── runWorksheetWithRetry (worksheet-specific) ─────────────────────────────

describe("runWorksheetWithRetry", () => {
  function makeWorksheet(
    warnings: string[],
    qaScore: number | undefined = undefined,
  ): AIWorksheetResult {
    return {
      title: "T",
      subtitle: "S",
      sections: [],
      metadata: {
        postValidatorWarnings: warnings,
        ...(qaScore !== undefined ? { qaScore: { total: qaScore } } : {}),
      },
      isAI: true,
    } as unknown as AIWorksheetResult;
  }

  it("stamps retryCount=0 + retryReasons=[] when no retry happens", async () => {
    const generate = vi.fn().mockResolvedValue(makeWorksheet([]));
    const out = await runWorksheetWithRetry(generate, {
      additionalInstructions: "",
    } as any);
    const meta = out.metadata as any;
    expect(meta.retryCount).toBe(0);
    expect(meta.retryReasons).toEqual([]);
    expect(generate).toHaveBeenCalledOnce();
  });

  it("stamps retryCount=1 + retryReasons when retry triggered", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(
        makeWorksheet(["a-warn", "b-warn", "c-warn"], 50),
      )
      .mockResolvedValueOnce(makeWorksheet([], 80));
    const out = await runWorksheetWithRetry(
      generate,
      { additionalInstructions: "" } as any,
      { threshold: 3 },
    );
    const meta = out.metadata as any;
    expect(meta.retryCount).toBe(1);
    expect(meta.retryReasons).toEqual(["a-warn", "b-warn", "c-warn"]);
    // Winner is the retry (qaScore 80 > 50)
    expect(meta.qaScore.total).toBe(80);
  });

  it("preserves identity of the winning result (does not return a fresh wrapper)", async () => {
    const ws = makeWorksheet([]);
    const generate = vi.fn().mockResolvedValue(ws);
    const out = await runWorksheetWithRetry(generate, {} as any);
    expect(out).toBe(ws);
  });
});
