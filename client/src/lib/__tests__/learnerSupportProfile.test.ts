import { describe, expect, it } from "vitest";
import {
  activeTemporaryAdjustments,
  buildAssessmentAccessPlan,
  learnerSupportPrompt,
  normaliseLearnerSupportProfile,
} from "../learnerSupportProfile";

describe("learnerSupportProfile", () => {
  it("normalises malformed values into a bounded, teacher-controlled support contract", () => {
    const profile = normaliseLearnerSupportProfile({
      strengths: ["Explains ideas aloud", "", 42],
      barriers: ["Dense instructions"],
      successfulStrategies: ["One clear step"],
      accessibility: {
        fontScale: "extra-large",
        lineSpacing: "extra-spacious",
        highContrast: true,
        responseModes: ["written", "spoken", "invalid"],
      },
      communication: { instructionStyle: "choice-led", processingTime: "extended", vocabularySupport: true, sentenceFrames: true },
      scaffoldingLevel: "part-modelled",
      temporaryAdjustments: [
        { id: "oral-response", label: "Offer an oral response", reason: "Current science practical", active: true },
        { label: "", active: true },
      ],
    });

    expect(profile.strengths).toEqual(["Explains ideas aloud"]);
    expect(profile.accessibility).toMatchObject({ fontScale: "extra-large", lineSpacing: "extra-spacious", highContrast: true, responseModes: ["written", "spoken"] });
    expect(profile.communication).toMatchObject({ instructionStyle: "choice-led", processingTime: "extended", vocabularySupport: true, sentenceFrames: true });
    expect(profile.temporaryAdjustments).toEqual([expect.objectContaining({ id: "oral-response", label: "Offer an oral response", active: true })]);
  });

  it("includes only active adjustments in the bounded, identity-safe AI context", () => {
    const profile = normaliseLearnerSupportProfile({
      strengths: ["Strong oral explanations"],
      accessibility: { fontScale: "large", highContrast: true, reduceVisualClutter: true, responseModes: ["spoken"] },
      communication: { instructionStyle: "direct", processingTime: "extended", vocabularySupport: true, sentenceFrames: true },
      scaffoldingLevel: "prompted",
      pupilVoice: "I like one step at a time.",
      temporaryAdjustments: [
        { id: "active", label: "Quiet start", reason: "Morning transition", active: true, startsOn: "2026-08-01", endsOn: "2026-08-31" },
        { id: "expired", label: "Expired support", active: true, endsOn: "2026-08-10" },
      ],
    });
    const active = activeTemporaryAdjustments(profile, new Date("2026-08-22T12:00:00.000Z"));
    const prompt = learnerSupportPrompt(profile).join("\n");

    expect(active.map(item => item.label)).toEqual(["Quiet start"]);
    expect(prompt).toContain("Strong oral explanations");
    expect(prompt).toContain("Quiet start");
    expect(prompt).not.toContain("Expired support");
    expect(prompt).toContain("preserve the learning objective and assessment demand");
  });

  it("turns reviewed preferences into an assessment-access plan without lowering evidence standards", () => {
    const profile = normaliseLearnerSupportProfile({
      accessibility: { fontScale: "large", lineSpacing: "spacious", highContrast: true, reduceVisualClutter: true, useVisualSupports: true, responseModes: ["spoken", "practical"] },
      communication: { instructionStyle: "choice-led", processingTime: "extended", vocabularySupport: true, sentenceFrames: true },
      temporaryAdjustments: [
        { id: "current", label: "Use a separate response record", active: true, startsOn: "2026-08-01", endsOn: "2026-08-31" },
        { id: "old", label: "Expired adjustment", active: true, endsOn: "2026-08-10" },
      ],
    });

    const plan = buildAssessmentAccessPlan(profile, new Date("2026-08-22T12:00:00.000Z"));
    expect(plan.responseRoutes).toEqual(["spoken", "practical"]);
    expect(plan.presentation).toMatchObject({ fontScale: "large", lineSpacing: "spacious", highContrast: true, reduceVisualClutter: true, visualSupports: true });
    expect(plan.activeTemporaryAdjustments).toEqual(["Use a separate response record"]);
    expect(plan.demandInvariant).toContain("same learning objective");
    expect(plan.teacherReviewRequired).toBe(true);
  });

  it("does not treat a profile as a diagnosis when no preferences are recorded", () => {
    const profile = normaliseLearnerSupportProfile({ diagnosis: "unsupported" });
    expect(profile.strengths).toEqual([]);
    expect(profile.barriers).toEqual([]);
    expect(learnerSupportPrompt(profile).join("\n")).toContain("Scaffold entry point");
    expect(learnerSupportPrompt(profile).join("\n")).not.toContain("unsupported");
  });
});
