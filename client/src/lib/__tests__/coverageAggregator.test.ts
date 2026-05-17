/**
 * coverageAggregator.test.ts — FEAT-PC4 · Phase C
 *
 * Covers:
 *   - Cell classification: unseen vs green vs amber vs red against the
 *     default thresholds (green ≥ 80, amber ≥ 50, else red).
 *   - Last-3-attempts rolling window: an old red doesn't poison a recent
 *     green run.
 *   - Worksheet-level bucketing: multiple questions on the same spec count
 *     as one attempt (sum awarded / sum available).
 *   - Spec-ref resolution: direct id (`N1`), title-substring fuzz, and
 *     unresolved attempts emit a warning but don't crash the build.
 *   - Class-level diagnostic: pctGreen / pctAmber / pctRed / pctUnseen sum
 *     to 100 (with rounding) for each spec.
 *   - "all boards" path returns an empty matrix + a warning (single-board
 *     view is the supported aggregator path; UI handles the union).
 *   - coverageMatrixToCsv: header + one row per (pupil, spec); status,
 *     rolling mean, and evidence count are stable.
 */
import { describe, it, expect } from "vitest";
import {
  aggregateCoverage,
  coverageMatrixToCsv,
  type WorksheetAttempt,
  type PupilLite,
} from "../coverageAggregator";

// ─── Fixtures ────────────────────────────────────────────────────────────

const PUPILS: PupilLite[] = [
  { id: "p1", name: "Aisha Khan",  yearGroup: "Year 10" },
  { id: "p2", name: "Ben O'Hara",  yearGroup: "Year 10" },
  { id: "p3", name: "Chris Patel", yearGroup: "Year 10" },
];

const OPTS = { board: "aqa" as const, subject: "Mathematics", yearGroup: "Year 10" };

function attempt(args: {
  pupilId: string;
  specRef: string;
  awarded: number;
  available: number;
  daysAgo?: number;
  worksheetId?: string;
  worksheetTitle?: string;
}): WorksheetAttempt {
  const t = new Date(Date.now() - (args.daysAgo ?? 0) * 86400000);
  return {
    pupilId: args.pupilId,
    worksheetId: args.worksheetId ?? `ws-${args.specRef}-${args.daysAgo ?? 0}`,
    worksheetTitle: args.worksheetTitle ?? `Worksheet on ${args.specRef}`,
    attemptedAt: t.toISOString(),
    questions: [{
      specRef: args.specRef,
      marksAwarded: args.awarded,
      marksAvailable: args.available,
      questionIdx: 1,
    }],
  };
}

// ─── Cell classification ────────────────────────────────────────────────

describe("aggregateCoverage cell classification", () => {
  it("marks pupils with no attempts as unseen", () => {
    const matrix = aggregateCoverage(PUPILS, [], OPTS);
    // Spot-check a known spec — the AQA Maths Y10 dataset has N1.
    const cell = matrix.cells["p1"]["N1"];
    expect(cell.status).toBe("unseen");
    expect(cell.rollingMeanPct).toBeUndefined();
    expect(cell.lastSeenAt).toBeUndefined();
  });

  it("classifies green when rolling mean ≥ 80%", () => {
    const matrix = aggregateCoverage(PUPILS, [
      attempt({ pupilId: "p1", specRef: "N1", awarded: 9, available: 10, daysAgo: 1 }),
    ], OPTS);
    const cell = matrix.cells["p1"]["N1"];
    expect(cell.status).toBe("green");
    expect(cell.rollingMeanPct).toBe(90);
    expect(cell.evidence).toHaveLength(1);
  });

  it("classifies amber on 50–79%", () => {
    const matrix = aggregateCoverage(PUPILS, [
      attempt({ pupilId: "p1", specRef: "N1", awarded: 6, available: 10 }),
    ], OPTS);
    expect(matrix.cells["p1"]["N1"].status).toBe("amber");
  });

  it("classifies red below 50%", () => {
    const matrix = aggregateCoverage(PUPILS, [
      attempt({ pupilId: "p1", specRef: "N1", awarded: 3, available: 10 }),
    ], OPTS);
    expect(matrix.cells["p1"]["N1"].status).toBe("red");
  });

  it("respects custom thresholds", () => {
    const matrix = aggregateCoverage(PUPILS, [
      attempt({ pupilId: "p1", specRef: "N1", awarded: 6, available: 10 }),
    ], { ...OPTS, thresholds: { green: 50, amber: 25 } });
    expect(matrix.cells["p1"]["N1"].status).toBe("green"); // 60 >= 50
  });
});

// ─── Last-3 rolling window ───────────────────────────────────────────────

describe("aggregateCoverage rolling window", () => {
  it("uses only the last 3 attempts when computing mastery", () => {
    // Old red attempts (5 of them at 0%) followed by 3 fresh greens.
    const oldRed = Array.from({ length: 5 }, (_, i) =>
      attempt({ pupilId: "p1", specRef: "N1", awarded: 0, available: 10, daysAgo: 30 + i }),
    );
    const recentGreen = [
      attempt({ pupilId: "p1", specRef: "N1", awarded: 10, available: 10, daysAgo: 3 }),
      attempt({ pupilId: "p1", specRef: "N1", awarded: 9,  available: 10, daysAgo: 2 }),
      attempt({ pupilId: "p1", specRef: "N1", awarded: 9,  available: 10, daysAgo: 1 }),
    ];
    const matrix = aggregateCoverage(PUPILS, [...oldRed, ...recentGreen], OPTS);
    const cell = matrix.cells["p1"]["N1"];
    expect(cell.status).toBe("green");
    expect(cell.rollingMeanPct).toBeGreaterThanOrEqual(90);
    // All evidence is preserved; window is just the trailing 3.
    expect(cell.evidence.length).toBe(8);
  });

  it("honours a custom recentWindow", () => {
    const matrix = aggregateCoverage(PUPILS, [
      attempt({ pupilId: "p1", specRef: "N1", awarded: 0,  available: 10, daysAgo: 4 }),
      attempt({ pupilId: "p1", specRef: "N1", awarded: 10, available: 10, daysAgo: 1 }),
    ], { ...OPTS, recentWindow: 2 });
    expect(matrix.cells["p1"]["N1"].rollingMeanPct).toBe(50);
    expect(matrix.cells["p1"]["N1"].status).toBe("amber");
  });
});

// ─── Worksheet-level bucketing ───────────────────────────────────────────

describe("aggregateCoverage worksheet-level bucketing", () => {
  it("counts multi-question worksheets as one attempt with summed marks", () => {
    const ws: WorksheetAttempt = {
      pupilId: "p1",
      worksheetId: "ws-multi",
      attemptedAt: new Date().toISOString(),
      questions: [
        { specRef: "N1", marksAwarded: 1, marksAvailable: 2, questionIdx: 1 },
        { specRef: "N1", marksAwarded: 2, marksAvailable: 2, questionIdx: 2 },
        { specRef: "N1", marksAwarded: 1, marksAvailable: 4, questionIdx: 3 },
      ],
    };
    const matrix = aggregateCoverage(PUPILS, [ws], OPTS);
    const cell = matrix.cells["p1"]["N1"];
    // 4/8 = 50% → amber, single evidence row
    expect(cell.evidence).toHaveLength(1);
    expect(cell.rollingMeanPct).toBe(50);
    expect(cell.status).toBe("amber");
  });

  it("emits a warning for unresolved spec refs but does not crash", () => {
    const ws: WorksheetAttempt = {
      pupilId: "p1",
      worksheetId: "ws-junk",
      worksheetTitle: "Mystery sheet",
      attemptedAt: new Date().toISOString(),
      questions: [
        { specRef: "N1",     marksAwarded: 8, marksAvailable: 10 }, // resolves
        { specRef: "ZZZ-99", marksAwarded: 0, marksAvailable: 10 }, // does not
      ],
    };
    const matrix = aggregateCoverage(PUPILS, [ws], OPTS);
    expect(matrix.cells["p1"]["N1"].status).toBe("green");
    expect(matrix.warnings.some((w) => w.includes("Mystery sheet"))).toBe(true);
  });

  it("matches spec refs by title substring as a fuzz fallback", () => {
    const ws: WorksheetAttempt = {
      pupilId: "p1",
      worksheetId: "ws-fuzz",
      attemptedAt: new Date().toISOString(),
      questions: [
        // PB1 sometimes stamps "Y10 Maths — Algebra (linear graphs)" rather
        // than a clean code; the aggregator should still find A9.
        { specRefRaw: "Plot graphs of equations", marksAwarded: 8, marksAvailable: 10 },
      ],
    };
    const matrix = aggregateCoverage(PUPILS, [ws], OPTS);
    expect(matrix.cells["p1"]["A9"].status).toBe("green");
  });
});

// ─── Class-level diagnostic ──────────────────────────────────────────────

describe("aggregateCoverage classMasteryBySpec", () => {
  it("produces percentages that sum to ~100 for each spec", () => {
    const attempts: WorksheetAttempt[] = [
      attempt({ pupilId: "p1", specRef: "N1", awarded: 9, available: 10 }),  // green
      attempt({ pupilId: "p2", specRef: "N1", awarded: 6, available: 10 }),  // amber
      // p3 has no attempt → unseen
    ];
    const matrix = aggregateCoverage(PUPILS, attempts, OPTS);
    const row = matrix.classMasteryBySpec.find((r) => r.specRef === "N1")!;
    expect(row.pctGreen).toBeCloseTo(33.3, 1);
    expect(row.pctAmber).toBeCloseTo(33.3, 1);
    expect(row.pctUnseen).toBeCloseTo(33.3, 1);
    expect(row.pctRed).toBe(0);
    const total = row.pctGreen + row.pctAmber + row.pctRed + row.pctUnseen;
    expect(total).toBeGreaterThanOrEqual(99.9);
    expect(total).toBeLessThanOrEqual(100.1);
  });
});

// ─── Multi-board filtering ───────────────────────────────────────────────

describe("aggregateCoverage multi-board paths", () => {
  it("returns an empty matrix + warning for an unknown taxonomy", () => {
    const matrix = aggregateCoverage(PUPILS, [], { board: "edexcel", subject: "Mathematics", yearGroup: "Year 10" });
    expect(matrix.cols).toEqual([]);
    expect(matrix.warnings.length).toBeGreaterThan(0);
    expect(matrix.warnings[0]).toMatch(/edexcel/i);
  });

  it("returns empty + warning for board:'all' (UI uses union helper)", () => {
    const matrix = aggregateCoverage(PUPILS, [], { board: "all" as any, subject: "Mathematics", yearGroup: "Year 10" });
    expect(matrix.cols).toEqual([]);
    expect(matrix.warnings.some((w) => w.includes("all boards"))).toBe(true);
  });
});

// ─── CSV export ──────────────────────────────────────────────────────────

describe("coverageMatrixToCsv", () => {
  it("emits a header + one row per (pupil, spec)", () => {
    const attempts = [
      attempt({ pupilId: "p1", specRef: "N1", awarded: 9, available: 10 }),
    ];
    const matrix = aggregateCoverage(PUPILS, attempts, OPTS);
    const csv = coverageMatrixToCsv(matrix);
    const lines = csv.trim().split("\n");
    // header + (3 pupils × cols.length) rows
    expect(lines[0]).toBe(
      `"PupilName","SpecRef","SpecTitle","Status","RollingMeanPct","LastSeenAt","EvidenceCount"`,
    );
    expect(lines.length).toBe(1 + PUPILS.length * matrix.cols.length);
    // The N1 row for Aisha is green with rolling mean 90 and 1 evidence.
    const aishaN1 = lines.find((l) => l.startsWith(`"Aisha Khan","N1",`));
    expect(aishaN1).toContain(`"green"`);
    expect(aishaN1).toContain(`"90"`);
    expect(aishaN1?.endsWith(`"1"`)).toBe(true);
  });

  it("escapes formula-trigger pupil names", () => {
    const oddPupils: PupilLite[] = [{ id: "x", name: "=Hax", yearGroup: "Year 10" }];
    const matrix = aggregateCoverage(oddPupils, [], OPTS);
    const csv = coverageMatrixToCsv(matrix);
    expect(csv).toContain(`"'=Hax"`);
  });
});
