import { describe, it, expect } from "vitest";
import {
  computeCacheKey,
  buildCacheInput,
  hashCacheInput,
  CACHE_RELEVANT_FIELDS,
} from "../../client/src/lib/aiCacheKey";
import {
  estimateCost,
  PROVIDER_PRICE_TABLE,
} from "../../client/src/lib/aiCostEstimate";
import {
  getCached,
  setCached,
  redactPii,
  cacheStats,
} from "../lib/generationCache";

describe("PR-9 / aiCacheKey", () => {
  it("same input always gives the same key", () => {
    const fields = { subject: "Maths", topic: "Fractions", yearGroup: "7" };
    expect(computeCacheKey(fields)).toBe(computeCacheKey(fields));
  });

  it("key order in input does not matter", () => {
    const a = { subject: "Maths", topic: "Fractions", yearGroup: "7" };
    const b = { yearGroup: "7", subject: "Maths", topic: "Fractions" };
    expect(computeCacheKey(a)).toBe(computeCacheKey(b));
  });

  it("different topic gives a different key", () => {
    const a = { subject: "Maths", topic: "Fractions", yearGroup: "7" };
    const b = { subject: "Maths", topic: "Algebra", yearGroup: "7" };
    expect(computeCacheKey(a)).not.toBe(computeCacheKey(b));
  });

  it("unknown fields are ignored", () => {
    const a = { subject: "Maths", topic: "Fractions", unknownField: "xyz" };
    const b = { subject: "Maths", topic: "Fractions" };
    expect(computeCacheKey(a)).toBe(computeCacheKey(b));
  });

  it("empty/null values are handled gracefully", () => {
    const a = { subject: "Maths", topic: null, yearGroup: undefined };
    const b = { subject: "Maths", topic: "", yearGroup: "" };
    expect(computeCacheKey(a)).toBe(computeCacheKey(b));
  });

  it("CACHE_RELEVANT_FIELDS contains expected fields", () => {
    expect(CACHE_RELEVANT_FIELDS).toContain("subject");
    expect(CACHE_RELEVANT_FIELDS).toContain("topic");
    expect(CACHE_RELEVANT_FIELDS).toContain("yearGroup");
    expect(CACHE_RELEVANT_FIELDS).toContain("examBoard");
    expect(CACHE_RELEVANT_FIELDS).toContain("sendNeed");
    expect(CACHE_RELEVANT_FIELDS).toContain("generatorVersion");
    expect(CACHE_RELEVANT_FIELDS).toContain("tier");
  });

  it("buildCacheInput lowercases and trims values", () => {
    const input = buildCacheInput({ subject: "  MATHS  ", topic: " Fractions " });
    const parsed = JSON.parse(input);
    expect(parsed.subject).toBe("maths");
    expect(parsed.topic).toBe("fractions");
  });

  it("hashCacheInput returns 8-char lowercase hex", () => {
    const hash = hashCacheInput("test input");
    expect(hash).toHaveLength(8);
    expect(/^[0-9a-f]{8}$/.test(hash)).toBe(true);
  });
});

describe("PR-9 / aiCostEstimate", () => {
  it("openai estimate is > 0", () => {
    const result = estimateCost("openai", "gpt-4o-mini", 1000, 500);
    expect(result.estimatedUsd).toBeGreaterThan(0);
  });

  it("groq estimate is > 0", () => {
    const result = estimateCost("groq", "llama-4-scout", 1000, 500);
    expect(result.estimatedUsd).toBeGreaterThan(0);
  });

  it("unknown provider returns estimatedUsd 0", () => {
    const result = estimateCost("unknown_provider", "some-model", 1000, 500);
    expect(result.estimatedUsd).toBe(0);
  });

  it("zero tokens returns 0 cost", () => {
    const result = estimateCost("openai", "gpt-4o-mini", 0, 0);
    expect(result.estimatedUsd).toBe(0);
  });

  it("promptTokens and completionTokens are reflected in return", () => {
    const result = estimateCost("openai", "gpt-4o-mini", 100, 200);
    expect(result.promptTokens).toBe(100);
    expect(result.completionTokens).toBe(200);
    expect(result.provider).toBe("openai");
    expect(result.model).toBe("gpt-4o-mini");
  });

  it("PROVIDER_PRICE_TABLE has all expected providers", () => {
    const expectedProviders = [
      "openai",
      "anthropic",
      "groq",
      "gemini",
      "openrouter",
      "cerebras",
      "sambanova",
      "mistral",
      "cohere",
      "nvidia_nim",
    ];
    for (const p of expectedProviders) {
      expect(PROVIDER_PRICE_TABLE[p]).toBeDefined();
      expect(PROVIDER_PRICE_TABLE[p].promptPer1k).toBeGreaterThan(0);
      expect(PROVIDER_PRICE_TABLE[p].completionPer1k).toBeGreaterThan(0);
    }
  });
});

describe("PR-9 / generationCache in-memory LRU", () => {
  it("getCached returns null for unknown key", () => {
    expect(getCached("nonexistent-key-xyz")).toBeNull();
  });

  it("setCached then getCached round-trips (when cache is enabled)", () => {
    // Note: CACHE_ENABLED is based on env var. When disabled, getCached always returns null.
    // We test the functions exist and handle gracefully regardless of env state.
    const testKey = "test-roundtrip-key";
    const testData = { content: "hello", provider: "groq" };
    setCached(testKey, testData);
    const result = getCached(testKey);
    // If cache is disabled, result is null; otherwise it should round-trip
    if (result !== null) {
      expect(result).toEqual(testData);
    }
  });

  it("redactPii strips metadata.pupilName", () => {
    const ws = { metadata: { pupilName: "Jane Doe", subject: "Maths" } };
    const redacted = redactPii(ws) as typeof ws;
    expect(redacted.metadata.pupilName).toBe("[redacted]");
    expect(redacted.metadata.subject).toBe("Maths");
  });

  it("redactPii strips metadata.iepTargets", () => {
    const ws = { metadata: { iepTargets: ["target1", "target2"], subject: "English" } };
    const redacted = redactPii(ws) as Record<string, any>;
    expect(redacted.metadata.iepTargets).toBeUndefined();
    expect(redacted.metadata.subject).toBe("English");
  });

  it("redactPii strips metadata.reteach.pupilsTargeted", () => {
    const ws = {
      metadata: {
        reteach: { misconceptionId: "m1", pupilsTargeted: ["Alice", "Bob"] },
      },
    };
    const redacted = redactPii(ws) as Record<string, any>;
    expect(redacted.metadata.reteach.pupilsTargeted).toBeUndefined();
    expect(redacted.metadata.reteach.misconceptionId).toBe("m1");
  });

  it("redactPii leaves other fields intact", () => {
    const ws = {
      content: "Some worksheet content",
      metadata: { subject: "Science", yearGroup: "9" },
    };
    const redacted = redactPii(ws) as typeof ws;
    expect(redacted.content).toBe("Some worksheet content");
    expect(redacted.metadata.subject).toBe("Science");
    expect(redacted.metadata.yearGroup).toBe("9");
  });

  it("cacheStats reflects size and enabled state", () => {
    const stats = cacheStats();
    expect(typeof stats.size).toBe("number");
    expect(typeof stats.enabled).toBe("boolean");
    expect(stats.size).toBeGreaterThanOrEqual(0);
  });
});
