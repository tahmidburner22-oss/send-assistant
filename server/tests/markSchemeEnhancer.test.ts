import { describe, it, expect } from "vitest";
import {
  expandMarkSchemeSynonyms,
  itemiseMarkAllocation,
  checkAnswerPlausibility,
  enhanceMarkScheme,
} from "../../client/src/lib/markSchemeEnhancer";

describe("PR-13 / expandMarkSchemeSynonyms", () => {
  it("expands a known synonym (photosynthesis)", () => {
    const { content, expanded } = expandMarkSchemeSynonyms("Q1: photosynthesis [1]");
    expect(expanded).toBeGreaterThan(0);
    expect(content).toContain("photo-synthesis");
  });

  it("expands 'increase' with synonym group", () => {
    const { content, expanded } = expandMarkSchemeSynonyms("Answer: increase [1 mark]");
    expect(expanded).toBe(1);
    expect(content).toMatch(/rise|go up|grow/);
  });

  it("does not expand unknown words", () => {
    const { content, expanded } = expandMarkSchemeSynonyms("Q1: mitochondria [1]");
    expect(expanded).toBe(0);
    expect(content).toBe("Q1: mitochondria [1]");
  });

  it("is idempotent — running twice gives same result", () => {
    const input = "Q1: photosynthesis [1]";
    const first = expandMarkSchemeSynonyms(input);
    const second = expandMarkSchemeSynonyms(first.content);
    expect(second.content).toBe(first.content);
    expect(second.expanded).toBe(0);
  });
});

describe("PR-13 / itemiseMarkAllocation", () => {
  it("itemises a 2-mark calculation", () => {
    const { content, itemised } = itemiseMarkAllocation("5 × 3 = 15 [2 marks]");
    expect(itemised).toBe(1);
    expect(content).toContain("M1");
    expect(content).toContain("A1");
  });

  it("itemises a 3-mark calculation", () => {
    const { content, itemised } = itemiseMarkAllocation("Area = 5 × 3 = 15 cm² [3 marks]");
    expect(itemised).toBe(1);
    expect(content).toContain("M1");
    expect(content).toContain("M2");
    expect(content).toContain("A1");
  });

  it("does not itemise a 1-mark answer", () => {
    const { content, itemised } = itemiseMarkAllocation("Answer: 5 [1 mark]");
    expect(itemised).toBe(0);
  });

  it("does not itemise non-calculation answers", () => {
    const { content, itemised } = itemiseMarkAllocation("Explain why plants need sunlight [2 marks]");
    expect(itemised).toBe(0);
  });
});

describe("PR-13 / checkAnswerPlausibility", () => {
  it("flags implausibly high temperature", () => {
    const warnings = checkAnswerPlausibility("Temperature = 500°C [1 mark]");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain("temperature");
  });

  it("flags negative probability", () => {
    const warnings = checkAnswerPlausibility("Probability = -0.5 [1 mark]");
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("does not flag reasonable values", () => {
    const warnings = checkAnswerPlausibility("Speed = 30 mph [1 mark]");
    expect(warnings.length).toBe(0);
  });
});

describe("PR-13 / enhanceMarkScheme — combined", () => {
  it("runs all three checks and returns combined result", () => {
    const input = "Q1: photosynthesis [1 mark]\nQ2: 5 × 4 = 20 [2 marks]\nQ3: Temperature = 999°C [1 mark]";
    const result = enhanceMarkScheme(input, "science");
    expect(result.synonymsExpanded).toBeGreaterThan(0);
    expect(result.questionsItemised).toBeGreaterThan(0);
    expect(result.plausibilityFlags).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
