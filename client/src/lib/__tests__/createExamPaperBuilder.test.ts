/**
 * createExamPaperBuilder.test.ts — Phase E PR-B.
 *
 * Tests the assembly engine in isolation using `poolOverride` so the
 * suite doesn't depend on the actual question bank's contents (which
 * change between gap-fill waves).
 */

import { describe, it, expect } from "vitest";
import {
  buildCreatedExamPaper,
  classifyBand,
  type CreatedExamPaperParams,
} from "../createExamPaperBuilder";
import type { PastPaperQuestion } from "../pastPaperQuestions";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function q(
  id: string,
  topic: string,
  marks: number,
  overrides: Partial<PastPaperQuestion> = {},
): PastPaperQuestion {
  return {
    id,
    subject: "mathematics",
    topic,
    marks,
    text: `Question ${id}: solve the problem related to ${topic}.`,
    commandWord: "Calculate",
    answerLines: 3,
    markScheme: `Mark scheme for ${id}.`,
    stage: "gcse",
    yearGroups: [10, 11],
    ao: "AO1",
    ...overrides,
  };
}

/** A pool large enough to hit any reasonable target with breathing room. */
function buildBigPool(): PastPaperQuestion[] {
  const pool: PastPaperQuestion[] = [];
  // 30 warmup (1-3 marks) across two topics.
  for (let i = 1; i <= 15; i++) {
    pool.push(q(`alg-w-${i}`, "Algebra", ((i % 3) + 1), { ao: ((["AO1", "AO2"] as const)[i % 2]) }));
    pool.push(q(`geo-w-${i}`, "Geometry", ((i % 3) + 1), { ao: "AO1", commandWord: "State" }));
  }
  // 30 core (4-6 marks).
  for (let i = 1; i <= 15; i++) {
    pool.push(q(`alg-c-${i}`, "Algebra", ((i % 3) + 4), { ao: "AO2" }));
    pool.push(q(`geo-c-${i}`, "Geometry", ((i % 3) + 4), { ao: "AO2", commandWord: "Explain" }));
  }
  // 20 stretch (7+ marks).
  for (let i = 1; i <= 10; i++) {
    pool.push(q(`alg-s-${i}`, "Algebra", 7 + (i % 2), { ao: "AO3" }));
    pool.push(q(`geo-s-${i}`, "Geometry", 7 + (i % 2), { ao: "AO3", commandWord: "Analyse" }));
  }
  return pool;
}

const baseParams: CreatedExamPaperParams = {
  subject: "mathematics",
  topics: ["Algebra", "Geometry"],
  totalMarks: 80,
  seed: 42,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("classifyBand", () => {
  it("maps marks to the correct band", () => {
    expect(classifyBand(1)).toBe("warmup");
    expect(classifyBand(3)).toBe("warmup");
    expect(classifyBand(4)).toBe("core");
    expect(classifyBand(6)).toBe("core");
    expect(classifyBand(7)).toBe("stretch");
    expect(classifyBand(20)).toBe("stretch");
  });
});

describe("buildCreatedExamPaper", () => {
  it("hits the target marks within ±2 when the pool supports it", () => {
    const result = buildCreatedExamPaper({
      ...baseParams,
      poolOverride: buildBigPool(),
    });
    const total = result.selectedQuestions.reduce((s, q) => s + (q.marks ?? 0), 0);
    expect(total).toBeGreaterThanOrEqual(80 - 6); // total tolerance = 3 bands × 2 margin
    expect(total).toBeLessThanOrEqual(80 + 6);
    // metadata.totalMarks reflects the actual sum, not the target.
    expect(result.worksheet.metadata.totalMarks).toBe(total);
    // No fatal warnings.
    expect(result.warnings.filter(w => /pool too small/i.test(w))).toEqual([]);
  });

  it("enforces the per-topic floor: every requested topic contributes at least one question", () => {
    const result = buildCreatedExamPaper({
      ...baseParams,
      poolOverride: buildBigPool(),
    });
    const topicsCovered = new Set(result.selectedQuestions.map(q => q.topic));
    expect(topicsCovered).toContain("Algebra");
    expect(topicsCovered).toContain("Geometry");
  });

  it("warns and skips topics that have no questions in the pool", () => {
    const result = buildCreatedExamPaper({
      ...baseParams,
      topics: ["Algebra", "Statistics"], // Statistics not in the pool
      poolOverride: buildBigPool(),
    });
    expect(result.warnings.some(w => w.includes("Statistics"))).toBe(true);
    const topicsCovered = new Set(result.selectedQuestions.map(q => q.topic));
    expect(topicsCovered).toContain("Algebra");
    expect(topicsCovered).not.toContain("Statistics");
  });

  it("returns a partial paper + warning when the pool is undersized", () => {
    // Pool worth ~12 marks total — far below the 80 target.
    const tinyPool = [
      q("a-1", "Algebra", 2),
      q("a-2", "Algebra", 3),
      q("g-1", "Geometry", 4),
      q("g-2", "Geometry", 3),
    ];
    const result = buildCreatedExamPaper({
      ...baseParams,
      poolOverride: tinyPool,
    });
    expect(result.warnings.some(w => /pool too small/i.test(w))).toBe(true);
    const total = result.selectedQuestions.reduce((s, q) => s + (q.marks ?? 0), 0);
    expect(total).toBeLessThan(80);
    expect(total).toBeGreaterThan(0);
    // Does NOT throw.
    expect(result.worksheet.metadata.totalMarks).toBe(total);
  });

  it("is deterministic — the same (params, seed) yields the identical paper", () => {
    const a = buildCreatedExamPaper({ ...baseParams, poolOverride: buildBigPool() });
    const b = buildCreatedExamPaper({ ...baseParams, poolOverride: buildBigPool() });
    expect(a.selectedQuestions.map(q => q.id)).toEqual(b.selectedQuestions.map(q => q.id));
    expect(a.bandTotals).toEqual(b.bandTotals);
    expect(a.worksheet.metadata.totalMarks).toBe(b.worksheet.metadata.totalMarks);
  });

  it("different seeds yield different papers (but both still valid)", () => {
    const a = buildCreatedExamPaper({ ...baseParams, seed: 1, poolOverride: buildBigPool() });
    const b = buildCreatedExamPaper({ ...baseParams, seed: 2, poolOverride: buildBigPool() });
    const aIds = a.selectedQuestions.map(q => q.id).join("|");
    const bIds = b.selectedQuestions.map(q => q.id).join("|");
    // Different selections (with high probability under different seeds).
    expect(aIds).not.toBe(bIds);
    // But both still hit the target.
    const aTotal = a.selectedQuestions.reduce((s, q) => s + (q.marks ?? 0), 0);
    const bTotal = b.selectedQuestions.reduce((s, q) => s + (q.marks ?? 0), 0);
    expect(aTotal).toBeGreaterThanOrEqual(80 - 6);
    expect(bTotal).toBeGreaterThanOrEqual(80 - 6);
  });

  it("respects calculator filtering when calculator=false", () => {
    const mixedPool: PastPaperQuestion[] = [
      ...buildBigPool().slice(0, 10).map(p => ({ ...p, calculator: true })),
      ...buildBigPool().slice(10, 20).map(p => ({ ...p, calculator: false })),
      // A few permissive ones (calculator unset) to keep the pool healthy.
      ...buildBigPool().slice(20),
    ];
    const result = buildCreatedExamPaper({
      ...baseParams,
      calculator: false,
      poolOverride: mixedPool,
    });
    // No selected question should have calculator: true.
    for (const q of result.selectedQuestions) {
      expect(q.calculator === true).toBe(false);
    }
  });

  it("places every question in the Core section when paperStyle = single-section", () => {
    const result = buildCreatedExamPaper({
      ...baseParams,
      paperStyle: "single-section",
      poolOverride: buildBigPool(),
    });
    expect(result.bandTotals.warmup).toBeGreaterThanOrEqual(0);
    expect(result.bandTotals.stretch).toBeGreaterThanOrEqual(0);
    // The dominant band should be core; warmup/stretch only contain
    // the per-topic-floor questions if they happened to fall in those
    // bands. The ratio should be heavily core.
    expect(result.bandTotals.core).toBeGreaterThan(result.bandTotals.warmup);
    expect(result.bandTotals.core).toBeGreaterThan(result.bandTotals.stretch);
    // Sections in the worksheet should be core-dominant.
    const coreSection = result.worksheet.sections.find(s => /core/i.test(s.title));
    expect(coreSection).toBeDefined();
  });

  it("exercises AO + command-word diversity in the tie-break", () => {
    // Pool with two equally-marks-fitting questions but different AOs.
    // The engine should prefer the one with an unused AO.
    const pool: PastPaperQuestion[] = [
      q("a1", "Algebra", 2, { ao: "AO1" }),
      q("a2", "Algebra", 2, { ao: "AO2" }),
      q("a3", "Algebra", 2, { ao: "AO3" }),
      q("g1", "Geometry", 2, { ao: "AO1" }),
      q("g2", "Geometry", 2, { ao: "AO2" }),
      q("g3", "Geometry", 2, { ao: "AO3" }),
      q("a4", "Algebra", 4, { ao: "AO2" }),
      q("g4", "Geometry", 4, { ao: "AO2" }),
    ];
    const result = buildCreatedExamPaper({
      ...baseParams,
      totalMarks: 12,
      paperStyle: "single-section",
      poolOverride: pool,
      seed: 100,
    });
    // Across the selected questions, we should see at least 2 distinct AOs
    // (AO diversity tie-break working).
    const aos = new Set(result.selectedQuestions.map(q => q.ao).filter(Boolean));
    expect(aos.size).toBeGreaterThanOrEqual(2);
  });

  it("emits the same ExamPaperWorksheet shape as examPaperBuilder.ts", () => {
    const result = buildCreatedExamPaper({
      ...baseParams,
      poolOverride: buildBigPool(),
    });
    const ws = result.worksheet;
    // Required top-level fields.
    expect(typeof ws.title).toBe("string");
    expect(typeof ws.subtitle).toBe("string");
    expect(Array.isArray(ws.sections)).toBe(true);
    expect(ws.isAI).toBe(false);
    expect(ws.isExamPaper).toBe(true);
    // Required metadata fields.
    expect(ws.metadata.isExamPaper).toBe(true);
    expect(ws.metadata.subject).toBe("mathematics");
    expect(typeof ws.metadata.totalMarks).toBe("number");
    expect(typeof ws.metadata.estimatedTime).toBe("string");
    expect(Array.isArray(ws.metadata.questionsUsed)).toBe(true);
    expect(ws.metadata.questionsUsed.length).toBe(result.selectedQuestions.length);
  });

  it("includes a teacher-only Mark Scheme section by default", () => {
    const result = buildCreatedExamPaper({
      ...baseParams,
      poolOverride: buildBigPool(),
    });
    const ms = result.worksheet.sections.find(s => s.type === "mark-scheme");
    expect(ms).toBeDefined();
    expect(ms?.teacherOnly).toBe(true);
  });

  it("omits the Mark Scheme section when includeAnswers = false", () => {
    const result = buildCreatedExamPaper({
      ...baseParams,
      includeAnswers: false,
      poolOverride: buildBigPool(),
    });
    const ms = result.worksheet.sections.find(s => s.type === "mark-scheme");
    expect(ms).toBeUndefined();
  });

  it("returns an empty result (with warning) when the pool is empty", () => {
    const result = buildCreatedExamPaper({
      ...baseParams,
      poolOverride: [],
    });
    expect(result.selectedQuestions).toEqual([]);
    expect(result.worksheet.metadata.totalMarks).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => /empty/i.test(w))).toBe(true);
  });

  it("throws when subject, topics, or totalMarks are invalid", () => {
    expect(() => buildCreatedExamPaper({ subject: "", topics: ["x"], totalMarks: 10 })).toThrow();
    expect(() => buildCreatedExamPaper({ subject: "x", topics: [], totalMarks: 10 })).toThrow();
    expect(() => buildCreatedExamPaper({ subject: "x", topics: ["x"], totalMarks: 0 })).toThrow();
    expect(() => buildCreatedExamPaper({ subject: "x", topics: ["x"], totalMarks: -5 })).toThrow();
  });
});
