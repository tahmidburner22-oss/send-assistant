/**
 * PD13 — UI surface tests for cost format + cost stamp helpers.
 * Pure-function tests; no DOM, no fetch, no providers.
 */
import { describe, it, expect } from "vitest";
import {
  formatGbp,
  formatDuration,
  formatProvider,
  formatChipLabel,
  USD_TO_GBP,
} from "../aiCostFormat";
import {
  stampCostMetadata,
  restampCacheHit,
  approxTokenCount,
  type CostEstimateMeta,
} from "../aiCostStamp";

describe("aiCostFormat — formatGbp", () => {
  it("returns £0 for zero or negative input", () => {
    expect(formatGbp(0)).toBe("£0");
    expect(formatGbp(-1)).toBe("£0");
    expect(formatGbp(NaN)).toBe("£0");
  });

  it("uses 4 decimal places for sub-penny figures", () => {
    // 0.0006 USD * 0.79 = 0.000474 GBP → "£0.0005" (rounded).
    const out = formatGbp(0.0006);
    expect(out.startsWith("£0.0")).toBe(true);
    expect(out.length).toBe("£0.0005".length);
  });

  it("uses 3 decimal places between £0.01 and £0.10", () => {
    // 0.10 USD * 0.79 = 0.079 GBP → "£0.079"
    const out = formatGbp(0.10);
    expect(out).toBe("£0.079");
  });

  it("uses 2 decimal places at or above £0.10", () => {
    // 1.00 USD * 0.79 = 0.79 GBP → "£0.79"
    expect(formatGbp(1.0)).toBe("£0.79");
    // 5.00 USD * 0.79 = 3.95 GBP → "£3.95"
    expect(formatGbp(5.0)).toBe("£3.95");
  });

  it("uses the documented USD_TO_GBP rate", () => {
    expect(USD_TO_GBP).toBeGreaterThan(0.5);
    expect(USD_TO_GBP).toBeLessThan(1.0);
  });
});

describe("aiCostFormat — formatDuration", () => {
  it("returns 0s for zero / negative / NaN", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(-1)).toBe("0s");
    expect(formatDuration(NaN)).toBe("0s");
  });

  it("formats sub-second durations in tenths", () => {
    expect(formatDuration(400)).toBe("0.4s");
    expect(formatDuration(950)).toBe("1.0s"); // (rounding 0.95 → 1.0)
  });

  it("formats single-second durations in tenths", () => {
    expect(formatDuration(2400)).toBe("2.4s");
    expect(formatDuration(12000)).toBe("12.0s");
  });

  it("formats minute durations in m s", () => {
    expect(formatDuration(60_000)).toBe("1m 0s");
    expect(formatDuration(83_000)).toBe("1m 23s");
  });

  it("formats hour durations in h m", () => {
    expect(formatDuration(3_900_000)).toBe("1h 5m");
  });
});

describe("aiCostFormat — formatProvider", () => {
  it("maps known provider keys to teacher-facing labels", () => {
    expect(formatProvider("groq")).toBe("Groq");
    expect(formatProvider("openai")).toBe("OpenAI");
    expect(formatProvider("nvidia_nim")).toBe("NVIDIA NIM");
  });

  it("appends the model when provided and non-placeholder", () => {
    expect(formatProvider("groq", "llama3-70b")).toBe("Groq · llama3-70b");
    expect(formatProvider("groq", "(unknown)")).toBe("Groq");
    expect(formatProvider("groq", "(cached)")).toBe("Groq");
  });

  it("returns unknown providers unchanged", () => {
    expect(formatProvider("foundry42")).toBe("foundry42");
  });
});

describe("aiCostFormat — formatChipLabel", () => {
  const baseCost: CostEstimateMeta = {
    promptTokens: 800,
    completionTokens: 400,
    estimatedUsd: 0.0006,
    provider: "groq",
    model: "llama3-70b",
    durationMs: 2400,
  };

  it("returns null when no cost data is available", () => {
    expect(formatChipLabel(undefined, false)).toBeNull();
  });

  it("renders the GBP, duration, provider for a fresh call", () => {
    const out = formatChipLabel(baseCost, false);
    expect(out).toBeTruthy();
    expect(out!.includes("£0.0")).toBe(true);
    expect(out!.includes("2.4s")).toBe(true);
    expect(out!.includes("Groq")).toBe(true);
    expect(out!.includes("llama3-70b")).toBe(true);
  });

  it("renders 'Cached · £0' for a cache-hit", () => {
    const out = formatChipLabel(baseCost, true);
    expect(out).toBeTruthy();
    expect(out!.startsWith("Cached")).toBe(true);
    expect(out!.includes("£0")).toBe(true);
    // Token-cost lookalike "£0.0006" must NOT appear after "Cached".
    expect(out!.includes("£0.0006")).toBe(false);
  });

  it("omits the duration segment when durationMs is missing or zero", () => {
    const noDuration: CostEstimateMeta = { ...baseCost, durationMs: 0 };
    const out = formatChipLabel(noDuration, false);
    expect(out).toBeTruthy();
    expect(out!.includes("0s")).toBe(false);
    expect(out!.includes("0.0s")).toBe(false);
  });
});

describe("aiCostStamp — stampCostMetadata", () => {
  const sample: CostEstimateMeta = {
    promptTokens: 100,
    completionTokens: 200,
    estimatedUsd: 0.001,
    provider: "groq",
    model: "llama3-70b",
    durationMs: 1500,
  };

  it("injects metadata.costEstimate / cacheKey / cacheHit into a JSON string", () => {
    const input = JSON.stringify({
      title: "T",
      sections: [],
      metadata: { difficulty: "standard", subject: "Mathematics" },
    });
    const out = stampCostMetadata(input, {
      costEstimate: sample,
      cacheKey: "abc12345",
      cacheHit: false,
    });
    const parsed = JSON.parse(out);
    expect(parsed.metadata.costEstimate).toEqual(sample);
    expect(parsed.metadata.cacheKey).toBe("abc12345");
    expect(parsed.metadata.cacheHit).toBe(false);
    // Existing metadata fields are preserved.
    expect(parsed.metadata.difficulty).toBe("standard");
    expect(parsed.metadata.subject).toBe("Mathematics");
  });

  it("creates metadata when the worksheet doesn't have one", () => {
    const input = JSON.stringify({ title: "T", sections: [] });
    const out = stampCostMetadata(input, { costEstimate: sample });
    const parsed = JSON.parse(out);
    expect(parsed.metadata.costEstimate).toEqual(sample);
  });

  it("returns the original string when input is not parsable JSON", () => {
    const broken = "this is not JSON at all";
    expect(stampCostMetadata(broken, { costEstimate: sample })).toBe(broken);
  });

  it("returns the original string for empty input", () => {
    expect(stampCostMetadata("", { costEstimate: sample })).toBe("");
  });

  it("returns the original string when JSON is a non-object (e.g. array, number)", () => {
    expect(stampCostMetadata("42", { costEstimate: sample })).toBe("42");
    expect(stampCostMetadata("[]", { costEstimate: sample })).toBe("[]");
  });

  it("coerces an array-typed metadata field into a fresh object instead of throwing", () => {
    const input = JSON.stringify({ metadata: ["foo"], sections: [] });
    const out = stampCostMetadata(input, { costEstimate: sample });
    const parsed = JSON.parse(out);
    expect(parsed.metadata.costEstimate).toEqual(sample);
  });
});

describe("aiCostStamp — restampCacheHit", () => {
  it("flips cacheHit to true and zeroes estimatedUsd, preserving token counts", () => {
    const stamped = JSON.stringify({
      metadata: {
        costEstimate: {
          promptTokens: 100,
          completionTokens: 200,
          estimatedUsd: 0.001,
          provider: "groq",
          model: "llama3-70b",
        },
        cacheHit: false,
        difficulty: "standard",
      },
      sections: [],
    });
    const out = restampCacheHit(stamped);
    const parsed = JSON.parse(out);
    expect(parsed.metadata.cacheHit).toBe(true);
    expect(parsed.metadata.costEstimate.estimatedUsd).toBe(0);
    expect(parsed.metadata.costEstimate.promptTokens).toBe(100);
    expect(parsed.metadata.costEstimate.completionTokens).toBe(200);
    expect(parsed.metadata.costEstimate.provider).toBe("groq");
    expect(parsed.metadata.difficulty).toBe("standard");
  });

  it("returns the original on parse failure (graceful)", () => {
    expect(restampCacheHit("garbage")).toBe("garbage");
    expect(restampCacheHit("")).toBe("");
  });

  it("safely flips cacheHit even when costEstimate is missing", () => {
    const stamped = JSON.stringify({ metadata: { difficulty: "x" }, sections: [] });
    const out = restampCacheHit(stamped);
    const parsed = JSON.parse(out);
    expect(parsed.metadata.cacheHit).toBe(true);
  });
});

describe("aiCostStamp — approxTokenCount", () => {
  it("returns 0 for empty string", () => {
    expect(approxTokenCount("")).toBe(0);
  });

  it("rounds up to the nearest token (4 chars per token)", () => {
    expect(approxTokenCount("abcd")).toBe(1);
    expect(approxTokenCount("abcde")).toBe(2);
    expect(approxTokenCount("a".repeat(20))).toBe(5);
  });
});
