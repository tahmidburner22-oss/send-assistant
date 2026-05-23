import { describe, it, expect } from "vitest";
import { resolveStackedSendProfiles } from "../../client/src/lib/stackedSendProfiles";
import { auditTraumaInformed, TRAUMA_INFORMED_RULES } from "../../client/src/lib/traumaInformedProfile";

describe("PR-16 / resolveStackedSendProfiles", () => {
  it("resolves single profile correctly", () => {
    const result = resolveStackedSendProfiles(["adhd"]);
    expect(result.profiles).toEqual(["adhd"]);
    expect(result.combinedAdaptations.length).toBeGreaterThan(0);
    expect(result.interactionWarnings.length).toBe(0);
  });

  it("combines adaptations from multiple profiles (de-duplicated)", () => {
    const result = resolveStackedSendProfiles(["adhd", "dyslexia"]);
    expect(result.profiles).toEqual(["adhd", "dyslexia"]);
    expect(result.combinedAdaptations.length).toBeGreaterThan(3);
    // Should have unique adaptations from both
    expect(result.combinedAdaptations).toContain("Add tick-boxes to each question");
    expect(result.combinedAdaptations).toContain("Bold key terms at first use");
  });

  it("detects interaction warnings for ADHD + ASC", () => {
    const result = resolveStackedSendProfiles(["adhd", "asc"]);
    expect(result.interactionWarnings.length).toBeGreaterThan(0);
    expect(result.interactionWarnings[0]).toContain("predictability");
  });

  it("suggests minimum reading age across profiles", () => {
    const result = resolveStackedSendProfiles(["adhd", "mld"]);
    expect(result.suggestedReadingAge).toBe(8); // MLD suggests 8, ADHD suggests 11
  });

  it("returns empty result for empty input", () => {
    const result = resolveStackedSendProfiles([]);
    expect(result.profiles.length).toBe(0);
    expect(result.combinedAdaptations.length).toBe(0);
  });

  it("handles trauma profile correctly", () => {
    const result = resolveStackedSendProfiles(["trauma"]);
    expect(result.combinedAdaptations).toContain("Start with confidence-building questions");
    expect(result.combinedAdaptations).toContain("Use invitational language");
  });
});

describe("PR-16 / auditTraumaInformed", () => {
  it("flags demand language ('you must')", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "You must calculate the area of the rectangle." },
    ];
    const result = auditTraumaInformed(sections);
    const demandFinding = result.findings.find((f) => f.ruleId === "ti-02");
    expect(demandFinding?.status).toBe("concern");
  });

  it("flags triggering content", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "Tom felt scared and abandoned when his parents divorced." },
    ];
    const result = auditTraumaInformed(sections);
    const triggerFinding = result.findings.find((f) => f.ruleId === "ti-04");
    expect(triggerFinding?.status).toBe("concern");
  });

  it("returns high safety score for clean worksheet", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "Calculate 5 + 3." },
      { type: "q-short", title: "Q2", content: "What is the area of a square with side 4cm?" },
    ];
    const result = auditTraumaInformed(sections);
    expect(result.safetyScore).toBeGreaterThanOrEqual(70);
  });

  it("TRAUMA_INFORMED_RULES has 8 rules", () => {
    expect(TRAUMA_INFORMED_RULES.length).toBe(8);
  });
});
