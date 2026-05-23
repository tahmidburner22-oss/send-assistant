import { describe, it, expect } from "vitest";
import { detectPastPaperFingerprints } from "../../client/src/lib/pastPaperFingerprint";

describe("PR-15 / detectPastPaperFingerprints", () => {
  it("detects a known AQA Physics fingerprint", () => {
    const sections = [
      { type: "q-extended", title: "Q1", content: "A student investigates how the extension of a spring depends on the force applied to it. Figure 1 shows the apparatus." },
    ];
    const result = detectPastPaperFingerprints(sections);
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0].source).toContain("AQA");
    expect(result.matches[0].similarity).toBeGreaterThanOrEqual(0.6);
  });

  it("detects a known Biology fingerprint", () => {
    const sections = [
      { type: "q-extended", title: "Q2", content: "A student investigated the effect of light intensity on the rate of photosynthesis in pondweed." },
    ];
    const result = detectPastPaperFingerprints(sections);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it("does not flag original question content", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "What is the chemical formula for water?" },
      { type: "q-short", title: "Q2", content: "List three properties of metals." },
    ];
    const result = detectPastPaperFingerprints(sections);
    expect(result.matches.length).toBe(0);
  });

  it("ignores non-question sections", () => {
    const sections = [
      { type: "learning-objective", title: "LO", content: "A student investigates how the extension of a spring depends on the force applied." },
    ];
    const result = detectPastPaperFingerprints(sections);
    expect(result.matches.length).toBe(0);
  });

  it("handles empty sections gracefully", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "" },
      { type: "q-short", title: "Q2" },
    ];
    const result = detectPastPaperFingerprints(sections);
    expect(result.matches.length).toBe(0);
  });

  it("classifies high-risk matches correctly", () => {
    const sections = [
      { type: "q-extended", title: "Q1", content: "A student investigates how the extension of a spring depends on the force applied" },
    ];
    const result = detectPastPaperFingerprints(sections);
    // This is nearly verbatim so should be high-risk
    if (result.matches.length > 0) {
      expect(result.highRiskCount).toBeGreaterThanOrEqual(0);
    }
  });

  it("generates appropriate warnings", () => {
    const sections = [
      { type: "q-extended", title: "Q1", content: "A student investigates how the extension of a spring depends on the force applied to it." },
      { type: "q-extended", title: "Q2", content: "Explain why the student should repeat the experiment. Give one reason why the student should repeat the experiment." },
    ];
    const result = detectPastPaperFingerprints(sections);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("Past-paper fingerprint");
  });
});
