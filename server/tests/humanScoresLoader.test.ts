/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/humanScoresLoader.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lock the Sprint 1.E human-scores CSV loader. Pure tests — only
 * parses inline strings via parseHumanScoresCsv, never reads disk.
 *
 * Sprint 1.E (PR-1 / big-bang-7-sprints).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";

import {
  parseCsvLine,
  parseHumanScoresCsv,
} from "./worksheet-eval/humanScoresLoader";

const VALID_HEADER =
  "fixtureId,raterId,curriculumFidelity,stemAuthenticity,accessibility,marksAndAnswers,sendAlignment,uxAndPrintability,notes";

describe("parseCsvLine", () => {
  it("splits a simple comma row", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("preserves empty cells", () => {
    expect(parseCsvLine("a,,c")).toEqual(["a", "", "c"]);
    expect(parseCsvLine(",,c")).toEqual(["", "", "c"]);
    expect(parseCsvLine("a,b,")).toEqual(["a", "b", ""]);
  });

  it("respects double-quoted cells (commas inside quotes don't split)", () => {
    expect(parseCsvLine('a,"b,c,d",e')).toEqual(["a", "b,c,d", "e"]);
  });

  it("decodes escaped double quotes inside quoted cells", () => {
    expect(parseCsvLine('a,"he said ""hi"" today",b')).toEqual([
      "a",
      'he said "hi" today',
      "b",
    ]);
  });
});

describe("parseHumanScoresCsv", () => {
  it("returns an empty index for an empty file", () => {
    const idx = parseHumanScoresCsv("");
    expect(idx.byFixture.size).toBe(0);
    expect(idx.totalRows).toBe(0);
    expect(idx.uniqueRaters).toBe(0);
  });

  it("returns an empty index for a header-only file", () => {
    const idx = parseHumanScoresCsv(VALID_HEADER);
    expect(idx.byFixture.size).toBe(0);
    expect(idx.totalRows).toBe(0);
  });

  it("parses a single valid row with all axes filled", () => {
    const csv = `${VALID_HEADER}\ny10-aqa-maths,RATER-A,4,3,5,4,4,4,Q4 specRef generic`;
    const idx = parseHumanScoresCsv(csv);
    expect(idx.totalRows).toBe(1);
    expect(idx.uniqueRaters).toBe(1);
    expect(idx.byFixture.size).toBe(1);
    const entries = idx.byFixture.get("y10-aqa-maths");
    expect(entries).toHaveLength(1);
    expect(entries![0]).toEqual({
      raterId: "RATER-A",
      axes: {
        curriculumFidelity: 4,
        stemAuthenticity: 3,
        accessibility: 5,
        marksAndAnswers: 4,
        sendAlignment: 4,
        uxAndPrintability: 4,
      },
      notes: "Q4 specRef generic",
    });
  });

  it("treats empty axis cells as null (n/a per rubric, NOT 0)", () => {
    // sendAlignment empty — the rubric n/a case for non-SEND fixtures
    const csv = `${VALID_HEADER}\ny10-aqa-maths,RATER-A,4,3,5,4,,4,`;
    const idx = parseHumanScoresCsv(csv);
    const entry = idx.byFixture.get("y10-aqa-maths")![0];
    expect(entry.axes.sendAlignment).toBeNull();
    expect(entry.axes.curriculumFidelity).toBe(4); // others unaffected
    expect(entry.notes).toBeUndefined(); // empty notes => undefined
  });

  it("groups multiple raters under the same fixture", () => {
    const csv = [
      VALID_HEADER,
      "y10-aqa-maths,RATER-A,4,3,5,4,,4,",
      "y10-aqa-maths,RATER-B,5,3,5,4,,5,",
      "y10-aqa-maths,RATER-C,4,4,4,4,,4,",
    ].join("\n");
    const idx = parseHumanScoresCsv(csv);
    expect(idx.totalRows).toBe(3);
    expect(idx.uniqueRaters).toBe(3);
    const entries = idx.byFixture.get("y10-aqa-maths")!;
    expect(entries.map((e) => e.raterId)).toEqual([
      "RATER-A",
      "RATER-B",
      "RATER-C",
    ]);
  });

  it("groups across multiple fixtures", () => {
    const csv = [
      VALID_HEADER,
      "fixture-a,RATER-A,4,3,5,4,,4,",
      "fixture-b,RATER-A,5,5,5,5,,5,",
    ].join("\n");
    const idx = parseHumanScoresCsv(csv);
    expect(idx.byFixture.size).toBe(2);
    expect(idx.uniqueRaters).toBe(1); // same rater, two fixtures
    expect(idx.totalRows).toBe(2);
  });

  it("preserves quoted notes containing commas", () => {
    const csv = `${VALID_HEADER}\ny10-aqa-maths,RATER-A,4,3,5,4,,4,"Q4 specRef generic, Q7 stem AI-tell"`;
    const idx = parseHumanScoresCsv(csv);
    const entry = idx.byFixture.get("y10-aqa-maths")![0];
    expect(entry.notes).toBe("Q4 specRef generic, Q7 stem AI-tell");
  });

  it("tolerates trailing newline + Windows CRLF line endings", () => {
    const csv =
      `${VALID_HEADER}\r\ny10-aqa-maths,RATER-A,4,3,5,4,,4,\r\n`;
    const idx = parseHumanScoresCsv(csv);
    expect(idx.totalRows).toBe(1);
  });

  it("skips blank lines", () => {
    const csv = [
      VALID_HEADER,
      "",
      "fixture-a,RATER-A,4,3,5,4,,4,",
      "   ",
      "fixture-b,RATER-A,5,5,5,5,,5,",
    ].join("\n");
    const idx = parseHumanScoresCsv(csv);
    expect(idx.totalRows).toBe(2);
  });

  it("throws on a wrong header (typo on a column)", () => {
    const wrong =
      "fixtureId,raterId,curriculumfidelity,stemAuthenticity,accessibility,marksAndAnswers,sendAlignment,uxAndPrintability,notes";
    expect(() => parseHumanScoresCsv(wrong + "\n")).toThrow(/header column/i);
  });

  it("throws on a row with too few columns", () => {
    const csv = `${VALID_HEADER}\ny10-aqa-maths,RATER-A,4,3,5,4`;
    expect(() => parseHumanScoresCsv(csv)).toThrow(/columns/);
  });

  it("throws on missing fixtureId or raterId", () => {
    const csv = `${VALID_HEADER}\n,RATER-A,4,3,5,4,,4,`;
    expect(() => parseHumanScoresCsv(csv)).toThrow(/fixtureId or raterId/);
  });

  it("throws on out-of-range axis values", () => {
    const csv = `${VALID_HEADER}\ny10-aqa-maths,RATER-A,6,3,5,4,,4,`;
    expect(() => parseHumanScoresCsv(csv)).toThrow(/invalid axis/);
  });

  it("throws on non-numeric axis values", () => {
    const csv = `${VALID_HEADER}\ny10-aqa-maths,RATER-A,four,3,5,4,,4,`;
    expect(() => parseHumanScoresCsv(csv)).toThrow(/invalid axis/);
  });

  it("throws on negative axis values (zero is invalid; rubric is 1-5)", () => {
    const csv = `${VALID_HEADER}\ny10-aqa-maths,RATER-A,0,3,5,4,,4,`;
    expect(() => parseHumanScoresCsv(csv)).toThrow(/invalid axis/);
  });
});
