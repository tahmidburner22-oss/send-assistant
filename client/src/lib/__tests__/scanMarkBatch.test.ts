/**
 * scanMarkBatch.test.ts — FEAT-PB4
 *
 * Covers:
 *   - aggregateBatch: per-question pctCorrect / meanMarks / commonMisconceptions,
 *     per-pupil totals + gaps, class accuracy, totals, top misconception list.
 *   - aggregateBatch: failed scans (entry.error set) are excluded from the
 *     accuracy calculation but the function still returns a stable shape.
 *   - exportToCsv: column order pin + escapes (commas, quotes, formula-trigger
 *     cells); BOM/utf-8 happens at download time, not in the string output.
 *   - exportToCsv: snapshot stability so MIS importers don't break silently.
 *   - csvFilename: yyyy-mm-dd, slugged title + classGroup, fallbacks.
 *   - generateBulkFeedback: AI fallback path returns a deterministic comment
 *     that references a specific wrong question when there is one.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  aggregateBatch,
  exportToCsv,
  csvFilename,
  generateBulkFeedback,
  type BatchScanResult,
} from "../scanMarkBatch";
import type { ScanMarkResult } from "../scan-mark";

// ─── Helpers ────────────────────────────────────────────────────────────────

function mkResult(args: {
  questions: Array<{
    n: number;
    correct: boolean;
    awarded?: number;
    avail?: number;
    tag?: string | null;
    pupilAnswer?: string;
    modelAnswer?: string;
    text?: string;
  }>;
}): ScanMarkResult {
  const totalAwarded = args.questions.reduce((s, q) => s + (q.awarded ?? (q.correct ? 1 : 0)), 0);
  const totalAvailable = args.questions.reduce((s, q) => s + (q.avail ?? 1), 0);
  return {
    questions: args.questions.map((q) => ({
      questionNumber: q.n,
      questionText: q.text || `Q${q.n}`,
      pupilAnswer: q.pupilAnswer ?? (q.correct ? "right" : "wrong"),
      correct: q.correct,
      marksAwarded: q.awarded ?? (q.correct ? 1 : 0),
      marksAvailable: q.avail ?? 1,
      modelAnswer: q.modelAnswer ?? "",
      misconceptionTag: q.tag ?? null,
    })),
    summary: { totalAwarded, totalAvailable, overallNote: "" },
    provider: "test",
  };
}

function mkEntry(
  pupilId: string,
  pupilName: string,
  result: ScanMarkResult,
  extras: Partial<BatchScanResult> = {},
): BatchScanResult {
  return {
    pupilId,
    pupilName,
    result,
    scannedAt: "2026-05-17T10:00:00.000Z",
    ...extras,
  };
}

// ─── aggregateBatch ─────────────────────────────────────────────────────────

describe("aggregateBatch", () => {
  it("computes per-question and per-pupil stats with class accuracy", () => {
    const batch: BatchScanResult[] = [
      mkEntry("p1", "Aisha", mkResult({
        questions: [
          { n: 1, correct: true },
          { n: 2, correct: false, tag: "Adds numerators" },
          { n: 3, correct: true },
        ],
      }), { upn: "U001" }),
      mkEntry("p2", "Ben", mkResult({
        questions: [
          { n: 1, correct: true },
          { n: 2, correct: false, tag: "Adds numerators" },
          { n: 3, correct: false, tag: "Slips on negatives" },
        ],
      })),
      mkEntry("p3", "Chris", mkResult({
        questions: [
          { n: 1, correct: false, tag: "Misreads question" },
          { n: 2, correct: true },
          { n: 3, correct: true },
        ],
      })),
    ];
    const agg = aggregateBatch(batch);
    expect(agg.totalPupils).toBe(3);
    expect(agg.totalQuestions).toBe(3);
    // Q2 attempted by 3, 1 correct → 33.3%
    const q2 = agg.perQuestion.find((q) => q.idx === 2)!;
    expect(q2.correctPupils).toBe(1);
    expect(q2.totalPupils).toBe(3);
    expect(q2.pctCorrect).toBeCloseTo(33.3, 1);
    expect(q2.commonMisconceptions[0]).toBe("Adds numerators");
    // Per-pupil rollup
    const aisha = agg.perPupil.find((p) => p.pupilId === "p1")!;
    expect(aisha.totalAwarded).toBe(2);
    expect(aisha.totalAvailable).toBe(3);
    expect(aisha.pctCorrect).toBeCloseTo(66.7, 1);
    expect(aisha.upn).toBe("U001");
    expect(aisha.gaps).toEqual(["Adds numerators"]);
    // Class accuracy: 5 awarded / 9 available = 55.6%
    expect(agg.classAccuracyPct).toBeCloseTo(55.6, 1);
    // Top misconceptions sorted by count
    expect(agg.topMisconceptions[0]).toEqual({ label: "Adds numerators", pupilCount: 2 });
  });

  it("excludes failed scans from accuracy but keeps shape stable", () => {
    const batch: BatchScanResult[] = [
      mkEntry("p1", "Aisha", mkResult({
        questions: [{ n: 1, correct: true }, { n: 2, correct: true }],
      })),
      mkEntry("p2", "Ben", mkResult({ questions: [] }), { error: "Scan failed" }),
    ];
    const agg = aggregateBatch(batch);
    expect(agg.totalPupils).toBe(1); // failed scan excluded
    expect(agg.classAccuracyPct).toBe(100);
    expect(agg.perPupil.map((p) => p.pupilId)).toEqual(["p1"]);
    expect(agg.topMisconceptions).toEqual([]);
  });

  it("returns an empty aggregate for an empty batch", () => {
    const agg = aggregateBatch([]);
    expect(agg.perPupil).toEqual([]);
    expect(agg.perQuestion).toEqual([]);
    expect(agg.classAccuracyPct).toBe(0);
    expect(agg.totalPupils).toBe(0);
  });
});

// ─── exportToCsv ────────────────────────────────────────────────────────────

describe("exportToCsv", () => {
  const batch: BatchScanResult[] = [
    mkEntry("p1", "Aisha Khan", mkResult({
      questions: [
        { n: 1, correct: true, awarded: 2, avail: 2 },
        { n: 2, correct: false, awarded: 0, avail: 2, tag: "Adds, numerators" }, // comma in tag
      ],
    }), { upn: "U001", feedbackComment: 'Solid on Q1; slipped on Q2 — "negatives" still tricky.' }),
    mkEntry("p2", "Ben O'Hara", mkResult({
      questions: [
        { n: 1, correct: false, awarded: 0, avail: 2, tag: "Misreads" },
        { n: 2, correct: false, awarded: 1, avail: 2, tag: "Adds, numerators" },
      ],
    })),
    // Pupil whose name starts with =, to verify formula auto-format escape.
    mkEntry("p3", "=SUM_pupil", mkResult({
      questions: [{ n: 1, correct: true, awarded: 2, avail: 2 }],
    })),
  ];
  const worksheet = { title: "Fractions: adding", metadata: { className: "8B" } };

  it("emits header + one row per pupil with stable column order", () => {
    const csv = exportToCsv(batch, worksheet);
    const lines = csv.trim().split("\n");
    // Header note + columns row + 3 pupils
    expect(lines).toHaveLength(5);
    expect(lines[0]).toMatch(/^# Adaptly marksheet/);
    expect(lines[1]).toBe(
      `"PupilName","UPN","Mark","OutOf","Pct","Comment","Misconceptions","Date"`,
    );
  });

  it("escapes embedded quotes and commas correctly", () => {
    const csv = exportToCsv(batch, worksheet);
    // Aisha row: tag contains a comma → must be quoted, and comment has " inside → "" escape.
    expect(csv).toContain(`"Aisha Khan"`);
    expect(csv).toContain(`"Solid on Q1; slipped on Q2 — ""negatives"" still tricky."`);
    expect(csv).toContain(`"Adds, numerators"`);
  });

  it("defuses formula auto-trigger cells (= + - @)", () => {
    const csv = exportToCsv(batch, worksheet);
    expect(csv).toContain(`"'=SUM_pupil"`);
  });

  it("produces snapshot-stable output", () => {
    // Pin a deterministic date so the snapshot doesn't drift day-to-day.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-17T10:00:00.000Z"));
    const csv = exportToCsv(batch, worksheet);
    expect(csv).toMatchSnapshot();
    vi.useRealTimers();
  });
});

// ─── csvFilename ────────────────────────────────────────────────────────────

describe("csvFilename", () => {
  it("slugs title + className with ISO date", () => {
    const fn = csvFilename(
      { title: "Fractions: adding", metadata: { className: "8B" } },
      new Date("2026-05-17T10:00:00.000Z"),
    );
    expect(fn).toBe("Fractions_adding_8B_2026-05-17.csv");
  });
  it("falls back when title and class are missing", () => {
    const fn = csvFilename({}, new Date("2026-05-17T10:00:00.000Z"));
    expect(fn).toBe("worksheet_2026-05-17.csv");
  });
});

// ─── generateBulkFeedback fallback ──────────────────────────────────────────

describe("generateBulkFeedback fallback", () => {
  beforeEach(() => {
    // Ensure the AI module is loaded in test env without a real key.
    vi.resetModules();
  });

  it("returns a deterministic comment when callAI throws", async () => {
    vi.doMock("../ai", () => ({
      callAI: vi.fn().mockRejectedValue(new Error("AI offline")),
    }));
    const { generateBulkFeedback: gbf } = await import("../scanMarkBatch");

    const batch: BatchScanResult[] = [
      mkEntry("p1", "Aisha", mkResult({
        questions: [
          { n: 1, correct: true },
          { n: 2, correct: false, tag: "Adds numerators" },
        ],
      })),
    ];
    const out = await gbf(batch, { metadata: { subject: "Maths", topic: "Fractions" } });
    expect(out).toHaveLength(1);
    expect(out[0].fallback).toBe(true);
    expect(out[0].comment).toContain("Aisha");
    // Should mention the misconception or the question number when there's
    // a wrong answer.
    expect(out[0].comment).toMatch(/Adds numerators|Q2/);
  });

  it("returns a praise comment for a fully-correct pupil", async () => {
    vi.doMock("../ai", () => ({
      callAI: vi.fn().mockRejectedValue(new Error("offline")),
    }));
    const { generateBulkFeedback: gbf } = await import("../scanMarkBatch");

    const batch: BatchScanResult[] = [
      mkEntry("p1", "Aisha", mkResult({
        questions: [
          { n: 1, correct: true },
          { n: 2, correct: true },
        ],
      })),
    ];
    const out = await gbf(batch, {});
    expect(out[0].fallback).toBe(true);
    expect(out[0].comment.toLowerCase()).toMatch(/correct|strong/);
  });

  it("uses the AI text when callAI succeeds", async () => {
    vi.doMock("../ai", () => ({
      callAI: vi.fn().mockResolvedValue({ text: "Good push on Q1, revisit fractions.", provider: "groq" }),
    }));
    const { generateBulkFeedback: gbf } = await import("../scanMarkBatch");

    const batch: BatchScanResult[] = [
      mkEntry("p1", "Aisha", mkResult({
        questions: [
          { n: 1, correct: true },
          { n: 2, correct: false, tag: "Adds numerators" },
        ],
      })),
    ];
    const out = await gbf(batch, { metadata: { subject: "Maths" } });
    expect(out[0].fallback).toBe(false);
    expect(out[0].comment).toBe("Good push on Q1, revisit fractions.");
  });
});
