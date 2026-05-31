/**
 * Sprint 3 polish tests (audit/IMPROVEMENTS.md):
 *
 *   IMP-09  Mark allocations must vary by command-word demand
 *   IMP-18  Tip 1 lists specific vocabulary terms
 *   IMP-19  Tip 6 references the learning objective
 *   IMP-21  Self-reflection RAG verbs vary by subject (no forced "Calculate")
 *   IMP-22  Common Mistakes must stay on-topic
 *
 * IMP-18/19/21 were already implemented in the deterministic builders; these
 * tests lock that behaviour against regression. IMP-09/22 are new warn-only
 * post-validators added in this sprint.
 */
import { describe, it, expect } from "vitest";
import {
  enforceMarkAllocationVariety,
  enforceCommonMistakesTopicRelevance,
  type PostValidatorWorksheet,
} from "../worksheetPostValidator";
import { buildRevisionTips } from "../revisionTipsBuilder";
import { pickCommandWords } from "../selfReflectionBuilder";

function ws(sections: any[], metadata: Record<string, unknown> = {}): PostValidatorWorksheet {
  return { sections, metadata } as PostValidatorWorksheet;
}

// ── IMP-09 — mark-allocation variety ─────────────────────────────────────────
describe("IMP-09 — enforceMarkAllocationVariety", () => {
  function s3(marks: number[]): PostValidatorWorksheet {
    // Recall 7 + Understanding 7 ⇒ application starts at Q15.
    return ws(
      marks.map((m, i) => ({
        id: `q${15 + i}`,
        type: "q-extended",
        title: `Q${15 + i}`,
        content: `Exam question ${15 + i}. (${m} marks)`,
        questionNumber: 15 + i,
      })),
    );
  }

  it("warns when all Section 3 questions carry an identical tariff", () => {
    const r = enforceMarkAllocationVariety(s3([4, 4, 4, 4, 4]));
    expect(r.warnings.join(" ")).toMatch(/IMP-09/);
    expect(r.warnings.join(" ")).toMatch(/identical tariff/i);
  });

  it("does not warn when tariffs vary", () => {
    const r = enforceMarkAllocationVariety(s3([1, 2, 4, 5, 6]));
    expect(r.warnings.length).toBe(0);
  });

  it("does not warn with fewer than 3 application questions", () => {
    const r = enforceMarkAllocationVariety(s3([4, 4]));
    expect(r.warnings.length).toBe(0);
  });

  it("recognises round-bracket (N marks) tariffs (post IMP-06)", () => {
    const sheet = ws([
      { id: "q15", type: "q-extended", title: "Q15", content: "State the formula. (3 marks)", questionNumber: 15 },
      { id: "q16", type: "q-extended", title: "Q16", content: "Explain the trend. (3 marks)", questionNumber: 16 },
      { id: "q17", type: "q-extended", title: "Q17", content: "Evaluate the method. (3 marks)", questionNumber: 17 },
    ]);
    const r = enforceMarkAllocationVariety(sheet);
    expect(r.warnings.join(" ")).toMatch(/IMP-09/);
  });

  it("never mutates the worksheet", () => {
    const sheet = s3([4, 4, 4]);
    const r = enforceMarkAllocationVariety(sheet);
    expect(r.worksheet).toBe(sheet);
  });
});

// ── IMP-22 — Common Mistakes topic relevance ─────────────────────────────────
describe("IMP-22 — enforceCommonMistakesTopicRelevance", () => {
  const sheet = (mistakes: string) =>
    ws([
      { id: "vocab", type: "key-vocabulary", title: "Key Vocabulary", content: "resultant force — the single force\nfriction — a contact force\nacceleration — rate of change of velocity" },
      { id: "cm", type: "common-mistakes", title: "Common Mistakes to Avoid", content: mistakes },
      { id: "q1", type: "q-short-answer", title: "Q1", content: "State Newton's second law. (2 marks)" },
    ], { topic: "Forces" });

  it("warns when the mistakes drift off-topic", () => {
    const r = enforceCommonMistakesTopicRelevance(
      sheet("MISTAKE 1: Confusing successive percentage changes when compounding interest."),
      { topic: "Forces" },
    );
    expect(r.warnings.join(" ")).toMatch(/IMP-22/);
  });

  it("does not warn when the mistakes mention the topic or its vocabulary", () => {
    const r = enforceCommonMistakesTopicRelevance(
      sheet("MISTAKE 1: Forgetting that resultant force is the vector sum, not the largest single force."),
      { topic: "Forces" },
    );
    expect(r.warnings.length).toBe(0);
  });

  it("is a no-op when there is no Common Mistakes section", () => {
    const r = enforceCommonMistakesTopicRelevance(
      ws([{ id: "q1", type: "q-short-answer", content: "State X. (2 marks)" }], { topic: "Forces" }),
      { topic: "Forces" },
    );
    expect(r.warnings.length).toBe(0);
  });
});

// ── IMP-18 — Tip 1 lists specific vocabulary ─────────────────────────────────
describe("IMP-18 — revision Tip 1 lists actual vocabulary terms", () => {
  it("names the supplied vocabulary terms rather than a generic pointer", () => {
    const out = buildRevisionTips({
      topic: "Bioenergetics",
      subject: "Science",
      vocabulary: ["Respiration", "Aerobic", "Anaerobic", "ATP", "Mitochondria"],
    } as any);
    const tip1 = out.tips[0];
    expect(tip1.category).toBe("vocabulary");
    expect(tip1.text).toMatch(/Learn these key terms first:/);
    expect(tip1.text).toContain("Respiration");
    expect(tip1.text).toContain("ATP");
    expect(tip1.text).not.toMatch(/Re-read the Key Vocabulary box for/);
  });
});

// ── IMP-19 — Tip 6 references the learning objective ─────────────────────────
describe("IMP-19 — revision Tip 6 quotes the learning objective", () => {
  it("produces exactly 6 tips with the 6th quoting the LO", () => {
    const out = buildRevisionTips({
      topic: "Bioenergetics",
      subject: "Science",
      learningObjective: "describe aerobic and anaerobic respiration",
    } as any);
    expect(out.tips).toHaveLength(6);
    const tip6 = out.tips[5];
    expect(tip6.category).toBe("learning-objective");
    expect(tip6.text).toContain("describe aerobic and anaerobic respiration");
  });
});

// ── IMP-21 — RAG verb variety by subject ─────────────────────────────────────
describe("IMP-21 — self-reflection command words vary by subject", () => {
  it("does not force 'Calculate' onto a non-calculation subject", () => {
    const englishVerbs = pickCommandWords("English Literature", [], 5);
    expect(englishVerbs).not.toContain("Calculate");
    expect(englishVerbs.length).toBe(5);
  });

  it("echoes the command words actually used on the worksheet", () => {
    const verbs = pickCommandWords("Science", ["Evaluate", "Compare"], 5);
    expect(verbs).toContain("Evaluate");
    expect(verbs).toContain("Compare");
  });

  it("produces different verb sets for maths vs english", () => {
    const maths = pickCommandWords("Mathematics", [], 5).join("|");
    const english = pickCommandWords("English Literature", [], 5).join("|");
    expect(maths).not.toBe(english);
  });
});
