/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval/humanScoresLoader.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 1.E — load `humanScores.csv` and group entries by fixtureId.
 *
 * The CSV format is fixed by the rubric document:
 *
 *   fixtureId,raterId,curriculumFidelity,stemAuthenticity,accessibility,marksAndAnswers,sendAlignment,uxAndPrintability,notes
 *
 * Empty cells for an axis are loaded as `null` (not 0) — matches the
 * rubric's "n/a" rule (e.g. sendAlignment is empty for non-SEND
 * fixtures). The notes column is optional and may contain commas
 * (we honour double-quoted cells).
 *
 * Pure: no LLM, no network, only filesystem read.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFile } from "node:fs/promises";

import type {
  AxisKey,
  AxisScores,
  HumanScoreEntry,
} from "./types";
import { AXIS_KEYS } from "./types";

/** CSV-cell-aware split: handles double-quoted cells with embedded
 *  commas and escaped quotes (`""` → `"`). Pure helper. */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i += 1; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === ",") {
        cells.push(cell);
        cell = "";
      } else if (c === '"' && cell === "") {
        inQuotes = true;
      } else {
        cell += c;
      }
    }
  }
  cells.push(cell);
  return cells;
}

/** Parse a single axis cell. Empty → null. Otherwise must be a
 *  number 1–5; throws on out-of-range so a typo in the CSV fails
 *  loudly rather than silently degrading the report. */
function parseAxisCell(raw: string, axis: AxisKey, raterId: string, fixtureId: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 1 || n > 5) {
    throw new Error(
      `humanScoresLoader: invalid axis "${axis}" for rater "${raterId}" on fixture "${fixtureId}": "${raw}" (expected 1–5 or empty)`,
    );
  }
  return n;
}

/** Result shape of `loadHumanScoresCsv`. */
export interface HumanScoresIndex {
  /** Map from fixtureId → ordered list of HumanScoreEntry rows. */
  byFixture: Map<string, HumanScoreEntry[]>;
  /** Total number of rows successfully loaded. */
  totalRows: number;
  /** Total number of unique raters seen across the file. */
  uniqueRaters: number;
}

/**
 * Read + parse the human-scores CSV. Returns a fixtureId-indexed
 * map plus light statistics. Throws on:
 *
 *   - file unreadable
 *   - header row missing required columns
 *   - any row with too few columns
 *   - any axis cell out of [1,5]
 *
 * Empty / whitespace-only rows are skipped. Trailing newline at EOF
 * is tolerated.
 */
export async function loadHumanScoresCsv(path: string): Promise<HumanScoresIndex> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    throw new Error(
      `humanScoresLoader: failed to read ${path}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
  return parseHumanScoresCsv(raw);
}

/** Pure parse helper — used by the loader and exposed for tests. */
export function parseHumanScoresCsv(raw: string): HumanScoresIndex {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { byFixture: new Map(), totalRows: 0, uniqueRaters: 0 };
  }

  const header = parseCsvLine(lines[0]).map((c) => c.trim());
  const expected = [
    "fixtureId",
    "raterId",
    "curriculumFidelity",
    "stemAuthenticity",
    "accessibility",
    "marksAndAnswers",
    "sendAlignment",
    "uxAndPrintability",
  ];
  for (let i = 0; i < expected.length; i++) {
    if (header[i] !== expected[i]) {
      throw new Error(
        `humanScoresLoader: CSV header column ${i} expected "${expected[i]}", got "${header[i]}". ` +
          `Required header: ${expected.join(",")},notes`,
      );
    }
  }

  const byFixture = new Map<string, HumanScoreEntry[]>();
  const raters = new Set<string>();
  let totalRows = 0;

  for (let lineNo = 1; lineNo < lines.length; lineNo++) {
    const cells = parseCsvLine(lines[lineNo]);
    if (cells.length < 8) {
      throw new Error(
        `humanScoresLoader: row ${lineNo + 1} has ${cells.length} columns, expected 8 or 9. Line: ${lines[lineNo].slice(0, 80)}`,
      );
    }
    const fixtureId = cells[0].trim();
    const raterId = cells[1].trim();
    if (!fixtureId || !raterId) {
      throw new Error(
        `humanScoresLoader: row ${lineNo + 1} missing fixtureId or raterId`,
      );
    }
    const axes: AxisScores = {
      curriculumFidelity: parseAxisCell(cells[2], "curriculumFidelity", raterId, fixtureId),
      stemAuthenticity: parseAxisCell(cells[3], "stemAuthenticity", raterId, fixtureId),
      accessibility: parseAxisCell(cells[4], "accessibility", raterId, fixtureId),
      marksAndAnswers: parseAxisCell(cells[5], "marksAndAnswers", raterId, fixtureId),
      sendAlignment: parseAxisCell(cells[6], "sendAlignment", raterId, fixtureId),
      uxAndPrintability: parseAxisCell(cells[7], "uxAndPrintability", raterId, fixtureId),
    };
    const notes = cells[8]?.trim() ?? "";

    const entry: HumanScoreEntry = { raterId, axes };
    if (notes) entry.notes = notes;

    const list = byFixture.get(fixtureId) ?? [];
    list.push(entry);
    byFixture.set(fixtureId, list);
    raters.add(raterId);
    totalRows += 1;
  }

  // Sanity: AXIS_KEYS length must match what we populated.
  if (AXIS_KEYS.length !== 6) {
    throw new Error(
      `humanScoresLoader: AXIS_KEYS length drifted to ${AXIS_KEYS.length}; loader expects 6`,
    );
  }

  return { byFixture, totalRows, uniqueRaters: raters.size };
}
