/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * client/src/lib/__tests__/aiGenerateWorksheetTwoPass.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lock the Sprint 3.A + 3.E orchestrator behaviour. No real LLM calls
 * — vi.mock stubs `callAIMessages` and `aiGenerateWorksheet` so we
 * exercise routing, prompt construction, section assembly and
 * self-consistency reconciliation deterministically.
 *
 * Sprint 3.A + 3.E (PR-1 / big-bang-7-sprints).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// vi.mock the ai module so callAIMessages + aiGenerateWorksheet
// don't actually hit the network. Mock IS hoisted to the top.
vi.mock("../ai", () => ({
  callAIMessages: vi.fn(),
  parseWithFixes: vi.fn((s: string) => JSON.parse(s)),
  aiGenerateWorksheet: vi.fn(),
}));

import {
  aiGenerateWorksheetTwoPass,
  isTwoPassEnabled,
  isSelfConsistencyEnabled,
  buildSkeletonPrompt,
  buildSectionFillPrompt,
  pickSelfConsistencySection,
  aiGenerateWorksheetSkeleton,
  aiFillWorksheetSection,
  fillSectionWithSelfConsistency,
  type SkeletonResult,
  type SkeletonSection,
  type TwoPassParams,
} from "../aiGenerateWorksheetTwoPass";
import * as aiModule from "../ai";

const baseParams: TwoPassParams = {
  subject: "Maths",
  topic: "Adding fractions",
  yearGroup: "Year 7",
  examBoard: "AQA",
  difficulty: "medium",
};

const skeletonOnly: SkeletonResult = {
  title: "Y7 Maths — Adding fractions",
  subtitle: "Year 7 • AQA",
  totalMarks: 12,
  estimatedTime: "25 minutes",
  sections: [
    { id: "lo", type: "learning-objective", marks: 0, title: "Learning Objective" },
    { id: "wb", type: "word-bank", marks: 0, title: "Key Vocabulary" },
    { id: "we", type: "worked-example", marks: 0, title: "Worked Example" },
    { id: "q1", type: "q-short-answer", marks: 1, title: "Question 1" },
    { id: "q2", type: "q-mcq", marks: 1, title: "Question 2" },
    { id: "q3", type: "q-true-false", marks: 1, title: "Question 3" },
    { id: "q4", type: "q-gap-fill", marks: 2, title: "Question 4" },
    { id: "q5", type: "q-extended", marks: 6, title: "Question 5", specRef: "AQA-MA-N4" },
    { id: "q6", type: "application", marks: 3, title: "Question 6" },
    { id: "q7", type: "challenge", marks: 6, title: "Question 7" },
    { id: "ms", type: "mark-scheme", marks: 0, title: "Mark Scheme" },
    { id: "sr", type: "self-reflection", marks: 0, title: "Self-Reflection" },
    { id: "rt", type: "revision-tips", marks: 0, title: "Revision Tips" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.WORKSHEET_TWO_PASS_ENABLED;
  delete process.env.PROMPT_SELF_CONSISTENCY_ENABLED;
  const g = globalThis as any;
  delete g.WORKSHEET_TWO_PASS_ENABLED;
  delete g.PROMPT_SELF_CONSISTENCY_ENABLED;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Flag plumbing ───────────────────────────────────────────────────────────

describe("isTwoPassEnabled", () => {
  it("defaults to false", () => {
    expect(isTwoPassEnabled()).toBe(false);
  });

  it("respects per-call override (truthy)", () => {
    expect(isTwoPassEnabled(true)).toBe(true);
  });

  it("respects per-call override (falsy)", () => {
    process.env.WORKSHEET_TWO_PASS_ENABLED = "1";
    expect(isTwoPassEnabled(false)).toBe(false);
  });

  it("respects globalThis flag", () => {
    (globalThis as any).WORKSHEET_TWO_PASS_ENABLED = true;
    expect(isTwoPassEnabled()).toBe(true);
  });

  it("respects env flag (=1)", () => {
    process.env.WORKSHEET_TWO_PASS_ENABLED = "1";
    expect(isTwoPassEnabled()).toBe(true);
  });

  it("respects env flag (=true)", () => {
    process.env.WORKSHEET_TWO_PASS_ENABLED = "true";
    expect(isTwoPassEnabled()).toBe(true);
  });
});

describe("isSelfConsistencyEnabled", () => {
  it("defaults to false", () => {
    expect(isSelfConsistencyEnabled()).toBe(false);
  });

  it("respects per-call override", () => {
    expect(isSelfConsistencyEnabled(true)).toBe(true);
  });

  it("respects env flag", () => {
    process.env.PROMPT_SELF_CONSISTENCY_ENABLED = "1";
    expect(isSelfConsistencyEnabled()).toBe(true);
  });
});

// ─── Routing ─────────────────────────────────────────────────────────────────

describe("aiGenerateWorksheetTwoPass — routing", () => {
  it("delegates to legacy aiGenerateWorksheet when flag is OFF", async () => {
    const legacyResult = {
      title: "legacy",
      subtitle: "y7",
      sections: [],
      metadata: { generatorVersion: "legacy" },
    };
    (aiModule.aiGenerateWorksheet as any).mockResolvedValue(legacyResult);
    const result = await aiGenerateWorksheetTwoPass(baseParams);
    expect(result).toBe(legacyResult);
    expect(aiModule.aiGenerateWorksheet).toHaveBeenCalledOnce();
    expect(aiModule.callAIMessages).not.toHaveBeenCalled();
  });

  it("strips two-pass-only fields before delegating to legacy", async () => {
    const legacyResult = { title: "x", subtitle: "y", sections: [], metadata: {} };
    (aiModule.aiGenerateWorksheet as any).mockResolvedValue(legacyResult);
    await aiGenerateWorksheetTwoPass({
      ...baseParams,
      twoPassOverride: false,
      selfConsistencyOverride: true,
    });
    const callArg = (aiModule.aiGenerateWorksheet as any).mock.calls[0][0];
    expect(callArg).not.toHaveProperty("twoPassOverride");
    expect(callArg).not.toHaveProperty("selfConsistencyOverride");
    // But subject still threaded through
    expect(callArg.subject).toBe("Maths");
  });

  it("runs the two-pass path when flag is ON via override", async () => {
    // Pass 1 — skeleton
    (aiModule.callAIMessages as any).mockResolvedValueOnce({
      text: JSON.stringify(skeletonOnly),
      provider: "stub",
    });
    // Pass 2 — section fills (one per non-self-consistency section)
    for (let i = 0; i < skeletonOnly.sections.length; i++) {
      (aiModule.callAIMessages as any).mockResolvedValueOnce({
        text: JSON.stringify({
          content: `content ${i}`,
          commandWord: "Calculate",
          markScheme: "1 mark per point",
        }),
        provider: "stub",
      });
    }
    const result = await aiGenerateWorksheetTwoPass({ ...baseParams, twoPassOverride: true });
    expect(result.metadata.generatorVersion).toBe("two-pass-1.0.0");
    expect(result.title).toBe("Y7 Maths — Adding fractions");
    expect(result.sections.length).toBe(skeletonOnly.sections.length);
    // Skeleton + N fill calls
    expect(aiModule.callAIMessages).toHaveBeenCalledTimes(skeletonOnly.sections.length + 1);
    expect(aiModule.aiGenerateWorksheet).not.toHaveBeenCalled();
  });
});

// ─── Skeleton prompt ─────────────────────────────────────────────────────────

describe("buildSkeletonPrompt", () => {
  it("embeds the per-subject family header + JSON contract", () => {
    const { system, user } = buildSkeletonPrompt(baseParams);
    expect(system).toContain("UK GCSE Mathematics");
    expect(system).toContain("Return JSON");
    expect(system).toContain("EXACTLY 7 question sections");
    expect(system).toContain("do NOT invent codes");
    expect(user).toContain("Subject: Maths");
    expect(user).toContain("Year group: Year 7");
    expect(user).toContain("Exam board: AQA");
  });

  it("flags exam-style + calculator + sendNeed when set", () => {
    const { user } = buildSkeletonPrompt({
      ...baseParams,
      examStyle: true,
      calculator: true,
      sendNeed: "dyslexia",
      readingAge: 10,
    });
    expect(user).toContain("Exam-style: yes");
    expect(user).toContain("Calculator: allowed");
    expect(user).toContain("SEND profile: dyslexia");
    expect(user).toContain("Target reading age: 10");
  });

  it("uses english-lit family for English Literature", () => {
    const { system } = buildSkeletonPrompt({
      ...baseParams,
      subject: "English Literature",
    });
    expect(system).toContain("English Literature");
    // english-lit forbidden-pattern rendered downstream (not in skeleton; that's for fill)
  });
});

// ─── Skeleton parse + assembly ───────────────────────────────────────────────

describe("aiGenerateWorksheetSkeleton", () => {
  it("parses a valid JSON response", async () => {
    (aiModule.callAIMessages as any).mockResolvedValue({
      text: JSON.stringify(skeletonOnly),
      provider: "stub",
    });
    const r = await aiGenerateWorksheetSkeleton(baseParams);
    expect(r.sections).toHaveLength(skeletonOnly.sections.length);
    expect(r.title).toBe(skeletonOnly.title);
  });

  it("throws on malformed response (missing sections array)", async () => {
    (aiModule.callAIMessages as any).mockResolvedValue({
      text: JSON.stringify({ title: "x", subtitle: "y" }),
      provider: "stub",
    });
    await expect(aiGenerateWorksheetSkeleton(baseParams)).rejects.toThrow(/sections array/);
  });
});

// ─── Section-fill prompt ─────────────────────────────────────────────────────

describe("buildSectionFillPrompt", () => {
  it("embeds the section-type contract", () => {
    const section: SkeletonSection = {
      id: "q5",
      type: "q-extended",
      marks: 6,
      title: "Question 5",
      specRef: "AQA-MA-N4",
    };
    const { system, user } = buildSectionFillPrompt(baseParams, section, skeletonOnly);
    expect(system).toContain("UK GCSE Mathematics");
    expect(system).toContain("Higher mark");
    expect(system).toContain("M / A / E point");
    expect(user).toContain("Section to fill: Question 5");
    expect(user).toContain("type: q-extended");
    expect(user).toContain("marks: 6");
    expect(user).toContain("Spec ref: AQA-MA-N4");
  });

  it("MCQ contract requests diagnoses block", () => {
    const section: SkeletonSection = {
      id: "q2",
      type: "q-mcq",
      marks: 1,
      title: "Question 2",
    };
    const { system } = buildSectionFillPrompt(baseParams, section, skeletonOnly);
    expect(system).toContain("4 options");
    expect(system).toContain("real misconceptions");
    expect(system).toContain("diagnosesIfMcq");
  });
});

describe("aiFillWorksheetSection", () => {
  it("returns a valid AIWorksheetSection from a parsed response", async () => {
    (aiModule.callAIMessages as any).mockResolvedValue({
      text: JSON.stringify({
        content: "Define a fraction in your own words.",
        commandWord: "Define",
        markScheme: "1 mark for naming numerator + denominator",
      }),
      provider: "stub",
    });
    const section: SkeletonSection = {
      id: "q1",
      type: "q-short-answer",
      marks: 1,
      title: "Question 1",
    };
    const r = await aiFillWorksheetSection(baseParams, section, skeletonOnly);
    expect(r.id).toBe("q1");
    expect(r.type).toBe("q-short-answer");
    expect(r.content).toBe("Define a fraction in your own words.");
    expect(r.commandWord).toBe("Define");
  });

  it("stamps teacherOnly=true on mark-scheme sections", async () => {
    (aiModule.callAIMessages as any).mockResolvedValue({
      text: JSON.stringify({ content: "MS body" }),
      provider: "stub",
    });
    const section: SkeletonSection = {
      id: "ms",
      type: "mark-scheme",
      marks: 0,
      title: "Mark Scheme",
    };
    const r = await aiFillWorksheetSection(baseParams, section, skeletonOnly);
    expect(r.teacherOnly).toBe(true);
  });
});

// ─── Self-consistency ───────────────────────────────────────────────────────

describe("pickSelfConsistencySection", () => {
  it("returns the highest-mark q-extended section", () => {
    const r = pickSelfConsistencySection(skeletonOnly);
    expect(r?.id).toBe("q5"); // 6 marks, q-extended
  });

  it("returns null when no section qualifies", () => {
    const tinySkeleton: SkeletonResult = {
      ...skeletonOnly,
      sections: skeletonOnly.sections.map((s) =>
        s.type === "q-extended" ? { ...s, marks: 3 } : s,
      ),
    };
    const r = pickSelfConsistencySection(tinySkeleton);
    expect(r).toBeNull(); // 3 marks doesn't trigger
  });
});

describe("fillSectionWithSelfConsistency", () => {
  it("calls the LLM once when recommendedSampleCount=1 (low-mark section)", async () => {
    (aiModule.callAIMessages as any).mockResolvedValue({
      text: JSON.stringify({ content: "x", markScheme: "ms" }),
      provider: "stub",
    });
    const r = await fillSectionWithSelfConsistency(
      baseParams,
      { id: "q3", type: "q-extended", marks: 4, title: "Q3" },
      skeletonOnly,
    );
    expect(aiModule.callAIMessages).toHaveBeenCalledOnce();
    expect(r.sampleCount).toBe(1);
  });

  it("calls the LLM N times for higher-mark sections + reconciles", async () => {
    // 6 marks → recommendedSampleCount = 3
    (aiModule.callAIMessages as any)
      .mockResolvedValueOnce({
        text: JSON.stringify({ content: "short", markScheme: "alpha" }),
        provider: "stub",
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ content: "much-longer-content-here", markScheme: "beta" }),
        provider: "stub",
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ content: "medium content", markScheme: "alpha" }),
        provider: "stub",
      });
    const r = await fillSectionWithSelfConsistency(
      baseParams,
      { id: "q5", type: "q-extended", marks: 6, title: "Q5" },
      skeletonOnly,
    );
    expect(aiModule.callAIMessages).toHaveBeenCalledTimes(3);
    expect(r.sampleCount).toBe(3);
    // Longest content wins
    expect(r.section.content).toBe("much-longer-content-here");
    // Confidence is a number between 0 and 1
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });
});

describe("aiGenerateWorksheetTwoPass — self-consistency wiring", () => {
  it("stamps selfConsistencyApplied + confidence + sampleCount on metadata when on", async () => {
    // skeleton call
    (aiModule.callAIMessages as any).mockResolvedValueOnce({
      text: JSON.stringify(skeletonOnly),
      provider: "stub",
    });
    // 12 non-SC fills + 3 SC samples for q5 (6 marks → 3 samples)
    const totalCalls = (skeletonOnly.sections.length - 1) + 3;
    for (let i = 0; i < totalCalls; i++) {
      (aiModule.callAIMessages as any).mockResolvedValueOnce({
        text: JSON.stringify({
          content: `c${i}`,
          markScheme: "marking points listed here",
        }),
        provider: "stub",
      });
    }
    const result = await aiGenerateWorksheetTwoPass({
      ...baseParams,
      twoPassOverride: true,
      selfConsistencyOverride: true,
    });
    expect(result.metadata.selfConsistencyApplied).toBe(true);
    expect(typeof result.metadata.selfConsistencyConfidence).toBe("number");
    expect(result.metadata.selfConsistencySampleCount).toBe(3);
  });

  it("does NOT stamp selfConsistency fields when off", async () => {
    (aiModule.callAIMessages as any).mockResolvedValueOnce({
      text: JSON.stringify(skeletonOnly),
      provider: "stub",
    });
    for (let i = 0; i < skeletonOnly.sections.length; i++) {
      (aiModule.callAIMessages as any).mockResolvedValueOnce({
        text: JSON.stringify({ content: `c${i}` }),
        provider: "stub",
      });
    }
    const result = await aiGenerateWorksheetTwoPass({
      ...baseParams,
      twoPassOverride: true,
      selfConsistencyOverride: false,
    });
    expect(result.metadata.selfConsistencyApplied).toBeUndefined();
  });
});
