/**
 * reteachPlanner.test.ts — FEAT-PB3
 *
 * Covers:
 *   - aggregateClassErrors thresholding (default 40%, configurable)
 *   - sort order (highest pctWrong first, ties broken by questionIdx asc)
 *   - missing misconception tag → row skipped (per spec: only diagnosed
 *     errors aggregate)
 *   - bank-id matching populates misconceptionEntry; free-text tags survive
 *     as the canonical id
 *   - dedupe: a pupil who appears twice in the batch counts once per gap
 *   - buildReteachBrief instruction template stability (key phrases pinned)
 *   - aiGenerateReteachWorksheet stamps metadata.reteach when wrapped over
 *     a stub aiGenerateWorksheet
 */
import { describe, it, expect, vi } from "vitest";
import {
  aggregateClassErrors,
  buildReteachBrief,
  aiGenerateReteachWorksheet,
  type ScanBatchEntry,
  type ReteachGapRow,
} from "../reteachPlanner";
import type { ScanMarkResult } from "../scan-mark";

// ─── Helpers ────────────────────────────────────────────────────────────────

function mkScan(
  questions: Array<{
    n: number;
    correct: boolean;
    tag?: string | null;
    text?: string;
    marksAwarded?: number;
    marksAvailable?: number;
  }>,
): ScanMarkResult {
  return {
    questions: questions.map((q) => ({
      questionNumber: q.n,
      questionText: q.text || `Q${q.n} stem`,
      pupilAnswer: q.correct ? "right" : "wrong",
      correct: q.correct,
      marksAwarded: q.marksAwarded ?? (q.correct ? 1 : 0),
      marksAvailable: q.marksAvailable ?? 1,
      modelAnswer: "",
      misconceptionTag: q.tag ?? null,
    })),
    summary: { totalAwarded: 0, totalAvailable: 0, overallNote: "" },
    provider: "test",
  };
}

function mkEntry(pupilId: string, pupilName: string, result: ScanMarkResult): ScanBatchEntry {
  return { pupilId, pupilName, result };
}

// ─── aggregateClassErrors — threshold + sort ────────────────────────────────

describe("aggregateClassErrors — threshold + sort", () => {
  it("returns one row per (questionIdx, misconception) at or above the default 40% threshold", () => {
    // 5 pupils. 3 (60%) get Q3 wrong with the same tag. 1 (20%) gets Q4 wrong.
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", mkScan([
        { n: 1, correct: true }, { n: 2, correct: true },
        { n: 3, correct: false, tag: "Adds numerators and denominators" },
        { n: 4, correct: true },
      ])),
      mkEntry("p2", "Bea", mkScan([
        { n: 1, correct: true }, { n: 2, correct: true },
        { n: 3, correct: false, tag: "Adds numerators and denominators" },
        { n: 4, correct: false, tag: "Off-by-one slip" },
      ])),
      mkEntry("p3", "Cai", mkScan([
        { n: 1, correct: true }, { n: 2, correct: true },
        { n: 3, correct: false, tag: "Adds numerators and denominators" },
        { n: 4, correct: true },
      ])),
      mkEntry("p4", "Dee", mkScan([
        { n: 1, correct: true }, { n: 2, correct: true },
        { n: 3, correct: true },
        { n: 4, correct: true },
      ])),
      mkEntry("p5", "Eli", mkScan([
        { n: 1, correct: true }, { n: 2, correct: true },
        { n: 3, correct: true },
        { n: 4, correct: true },
      ])),
    ];

    const rows = aggregateClassErrors(batch);
    // Only Q3's misconception is at/above 40% (60%). Q4's 20% sits below.
    expect(rows).toHaveLength(1);
    expect(rows[0].questionIdx).toBe(3);
    expect(rows[0].pctWrong).toBe(60);
    expect(rows[0].pupilsWrong.sort()).toEqual(["Alex", "Bea", "Cai"]);
    expect(rows[0].totalPupils).toBe(5);
  });

  it("respects a custom thresholdPct option", () => {
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", mkScan([{ n: 4, correct: false, tag: "Slip A" }])),
      mkEntry("p2", "Bea", mkScan([{ n: 4, correct: true }])),
      mkEntry("p3", "Cai", mkScan([{ n: 4, correct: true }])),
      mkEntry("p4", "Dee", mkScan([{ n: 4, correct: true }])),
    ];
    // 25% — below default 40%, above a custom 20%.
    expect(aggregateClassErrors(batch)).toHaveLength(0);
    expect(aggregateClassErrors(batch, { thresholdPct: 20 })).toHaveLength(1);
  });

  it("sorts rows by pctWrong descending, then questionIdx ascending", () => {
    // Two questions both at 50% wrong, plus a 100%-wrong question.
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "P1", mkScan([
        { n: 5, correct: false, tag: "Method confusion" },
        { n: 2, correct: false, tag: "Tag X" },
        { n: 7, correct: false, tag: "Tag Y" },
      ])),
      mkEntry("p2", "P2", mkScan([
        { n: 5, correct: false, tag: "Method confusion" },
        { n: 2, correct: false, tag: "Tag X" },
        { n: 7, correct: true },
      ])),
    ];
    const rows = aggregateClassErrors(batch);
    // pct order: Q5=100, Q2=100, Q7=50.
    // Within the 100% tie, Q2 should precede Q5 (lower questionIdx first).
    expect(rows.map((r) => r.questionIdx)).toEqual([2, 5, 7]);
  });

  it("returns an empty list for an empty batch", () => {
    expect(aggregateClassErrors([])).toEqual([]);
    // @ts-expect-error — defensive guard against null input
    expect(aggregateClassErrors(null)).toEqual([]);
  });
});

// ─── aggregateClassErrors — tag handling + dedupe ───────────────────────────

describe("aggregateClassErrors — tag handling", () => {
  it("ignores wrong answers with no misconceptionTag", () => {
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", mkScan([{ n: 1, correct: false, tag: null }])),
      mkEntry("p2", "Bea", mkScan([{ n: 1, correct: false, tag: "" }])),
      mkEntry("p3", "Cai", mkScan([{ n: 1, correct: false, tag: "   " }])),
    ];
    expect(aggregateClassErrors(batch)).toEqual([]);
  });

  it("merges differently-cased / lightly-punctuated tags into one bucket", () => {
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", mkScan([{ n: 2, correct: false, tag: "Adds numerators." }])),
      mkEntry("p2", "Bea", mkScan([{ n: 2, correct: false, tag: "adds numerators" }])),
      mkEntry("p3", "Cai", mkScan([{ n: 2, correct: false, tag: "ADDS NUMERATORS  " }])),
    ];
    const rows = aggregateClassErrors(batch);
    expect(rows).toHaveLength(1);
    expect(rows[0].pupilsWrong).toEqual(["Alex", "Bea", "Cai"]);
    // Label keeps the first-seen verbatim string for human readability.
    expect(rows[0].misconceptionLabel.toLowerCase()).toContain("adds numerators");
  });

  it("does not double-count a pupil who appears twice in the batch with the same gap", () => {
    const dup = mkScan([{ n: 4, correct: false, tag: "Tag A" }]);
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", dup),
      mkEntry("p1", "Alex", dup), // same pupilId + scan replayed
      mkEntry("p2", "Bea", mkScan([{ n: 4, correct: false, tag: "Tag A" }])),
    ];
    const rows = aggregateClassErrors(batch, { thresholdPct: 50 });
    expect(rows).toHaveLength(1);
    expect(rows[0].pupilsWrong).toEqual(["Alex", "Bea"]);
    expect(rows[0].totalPupils).toBe(2);
  });

  it("resolves a bank-id tag (e.g. 'm-frac-01') and populates misconceptionEntry", () => {
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", mkScan([{ n: 3, correct: false, tag: "m-frac-01" }])),
      mkEntry("p2", "Bea", mkScan([{ n: 3, correct: false, tag: "m-frac-01" }])),
    ];
    const rows = aggregateClassErrors(batch);
    expect(rows).toHaveLength(1);
    expect(rows[0].misconceptionId).toBe("m-frac-01");
    expect(rows[0].misconceptionEntry).toBeDefined();
    // The bank entry's misconception sentence is rendered into misconceptionLabel.
    expect(rows[0].misconceptionLabel.toLowerCase()).toContain("numerator");
  });

  it("keeps free-text tags as misconceptionId when no bank match exists", () => {
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", mkScan([{ n: 3, correct: false, tag: "Mistakes the operation order" }])),
      mkEntry("p2", "Bea", mkScan([{ n: 3, correct: false, tag: "Mistakes the operation order" }])),
    ];
    const [row] = aggregateClassErrors(batch);
    expect(row.misconceptionEntry).toBeUndefined();
    // misconceptionId is the normalised key — used by metadata.reteach later.
    expect(row.misconceptionId).toBe("mistakes the operation order");
    expect(row.misconceptionLabel).toBe("Mistakes the operation order");
  });
});

// ─── buildReteachBrief — template stability ─────────────────────────────────

describe("buildReteachBrief", () => {
  const sourceWorksheet = {
    id: "ws-123",
    title: "Adding Fractions — Year 8",
    metadata: { subject: "mathematics", topic: "Adding Fractions", yearGroup: "Year 8" },
    sections: [],
  };

  function rowFromBank(): ReteachGapRow {
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", mkScan([{ n: 3, correct: false, tag: "m-frac-01" }])),
      mkEntry("p2", "Bea", mkScan([{ n: 3, correct: false, tag: "m-frac-01" }])),
    ];
    return aggregateClassErrors(batch)[0];
  }

  it("forwards subject / topic / year from the source worksheet", () => {
    const brief = buildReteachBrief(rowFromBank(), sourceWorksheet);
    expect(brief.subject).toBe("mathematics");
    expect(brief.topic).toBe("Adding Fractions");
    expect(brief.yearGroup).toBe("Year 8");
    expect(brief.sourceWorksheetTitle).toBe("Adding Fractions — Year 8");
  });

  it("pins the canonical instruction phrasing so prompt drift is detectable", () => {
    const brief = buildReteachBrief(rowFromBank(), sourceWorksheet);
    // Hard-coded markers from the spec.
    expect(brief.instructions).toContain("RE-TEACH WORKSHEET");
    expect(brief.instructions).toMatch(/contrasts? the CORRECT method with the misconception/);
    expect(brief.instructions).toMatch(/TWO contrast pairs/);
    expect(brief.instructions).toMatch(/SIX fresh practice questions/);
    expect(brief.instructions).toMatch(/diagnostic step/);
    // Misconception text from the bank entry must be quoted verbatim (no paraphrase).
    expect(brief.instructions).toContain(brief.misconceptionLabel);
  });

  it("includes the targeted-pupils line for the teacher's reference (do-not-print clause)", () => {
    const brief = buildReteachBrief(rowFromBank(), sourceWorksheet);
    expect(brief.instructions).toContain("Pupils targeted");
    expect(brief.instructions).toContain("do NOT print pupil names");
    expect(brief.instructions).toContain("Alex");
    expect(brief.instructions).toContain("Bea");
  });

  it("falls back gracefully when the source worksheet has no metadata", () => {
    const brief = buildReteachBrief(rowFromBank(), { id: "x", title: "" });
    expect(brief.topic).toBe("the source worksheet topic");
    expect(brief.subject).toBe("");
    expect(brief.yearGroup).toBe("");
    expect(brief.sourceWorksheetTitle).toBe("previous worksheet");
  });
});

// ─── aiGenerateReteachWorksheet — metadata stamp ────────────────────────────

describe("aiGenerateReteachWorksheet", () => {
  it("appends brief.instructions and stamps metadata.reteach onto the result", async () => {
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", mkScan([{ n: 3, correct: false, tag: "m-frac-01" }])),
      mkEntry("p2", "Bea", mkScan([{ n: 3, correct: false, tag: "m-frac-01" }])),
    ];
    const row = aggregateClassErrors(batch)[0];
    const source = {
      id: "ws-123",
      title: "Adding Fractions — Year 8",
      metadata: { subject: "mathematics", topic: "Adding Fractions", yearGroup: "Year 8" },
    };
    const brief = buildReteachBrief(row, source);

    // Stub aiGenerateWorksheet at the module level so the test never hits
    // a real network call. The mock echoes back the params it was called
    // with so we can assert on additionalInstructions.
    const aiModule = await import("../ai");
    const stub = vi.spyOn(aiModule, "aiGenerateWorksheet").mockResolvedValue({
      title: "Re-teach: Adding Fractions",
      subtitle: "Y8",
      sections: [],
      metadata: {
        difficulty: "mixed",
        adaptations: [],
        subject: "mathematics",
        topic: "Adding Fractions",
        yearGroup: "Year 8",
      },
      isAI: true,
    } as Awaited<ReturnType<typeof aiModule.aiGenerateWorksheet>>);

    const ws = await aiGenerateReteachWorksheet(brief, source);
    expect(stub).toHaveBeenCalledTimes(1);
    const passed = stub.mock.calls[0][0];
    expect(passed.subject).toBe("mathematics");
    expect(passed.topic).toBe("Adding Fractions");
    expect(passed.yearGroup).toBe("Year 8");
    expect(passed.additionalInstructions).toContain("RE-TEACH WORKSHEET");

    // Metadata stamp survives onto the returned worksheet.
    const reteach = (ws.metadata as Record<string, unknown>)?.reteach as
      | Record<string, unknown>
      | undefined;
    expect(reteach).toBeDefined();
    expect(reteach!.misconceptionId).toBe("m-frac-01");
    expect(reteach!.sourceWorksheetId).toBe("ws-123");
    expect(reteach!.sourceWorksheetTitle).toBe("Adding Fractions — Year 8");
    expect(reteach!.pctWrong).toBe(100);
    expect(reteach!.questionIdx).toBe(3);
    expect(Array.isArray(reteach!.pupilsTargeted)).toBe(true);
    expect((reteach!.pupilsTargeted as string[]).sort()).toEqual(["Alex", "Bea"]);
    expect(typeof reteach!.generatedAt).toBe("string");

    // Prior metadata is preserved alongside the new reteach block.
    expect((ws.metadata as Record<string, unknown>)?.subject).toBe("mathematics");

    stub.mockRestore();
  });

  it("preserves caller additionalInstructions by appending after the brief", async () => {
    const batch: ScanBatchEntry[] = [
      mkEntry("p1", "Alex", mkScan([{ n: 3, correct: false, tag: "m-frac-01" }])),
      mkEntry("p2", "Bea", mkScan([{ n: 3, correct: false, tag: "m-frac-01" }])),
    ];
    const row = aggregateClassErrors(batch)[0];
    const source = {
      id: "ws-123",
      title: "Adding Fractions",
      metadata: { subject: "mathematics", topic: "Adding Fractions", yearGroup: "Year 8" },
    };
    const brief = buildReteachBrief(row, source);

    const aiModule = await import("../ai");
    const stub = vi.spyOn(aiModule, "aiGenerateWorksheet").mockResolvedValue({
      title: "x", subtitle: "y", sections: [],
      metadata: { difficulty: "mixed", adaptations: [] },
      isAI: true,
    } as Awaited<ReturnType<typeof aiModule.aiGenerateWorksheet>>);

    await aiGenerateReteachWorksheet(brief, source, {
      additionalInstructions: "Use British English spellings throughout.",
    });
    const passed = stub.mock.calls[0][0];
    expect(passed.additionalInstructions).toMatch(/RE-TEACH WORKSHEET[\s\S]+British English spellings/);

    stub.mockRestore();
  });
});
