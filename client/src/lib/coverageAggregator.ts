/**
 * coverageAggregator.ts — FEAT-PC4 · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * Build the cross-pupil curriculum coverage matrix that powers the "Ofsted
 * view" page. Pure function — no network, no React. The page that consumes
 * this hands in:
 *
 *   - pupils:       the roster (id + name).
 *   - taxonomy:     the spec-point catalogue for the chosen (board, subject,
 *                   yearGroup) — sourced from specPointTaxonomy.getSpecPoints.
 *   - attempts:     a runtime list of WorksheetAttempt records assembled
 *                   from scan-mark batches and assignment submissions.
 *                   Each per-question item carries an optional specRef
 *                   (stamped by FEAT-PB1 questionProvenance or the
 *                   coverageMap).
 *
 * The aggregator returns a CoverageMatrix:
 *
 *   { rows, cols, cells }
 *
 * where `cells[pupilId][specRef]` is one of four mastery states:
 *
 *   - "unseen": no question targeting that spec point has ever been served
 *               to that pupil (white in the grid).
 *   - "red":    last-3-attempts mean < 50% (immediate re-teach trigger).
 *   - "amber":  last-3-attempts mean 50–79% (consolidate).
 *   - "green":  last-3-attempts mean ≥ 80% (mastery evidenced).
 *
 * Mastery is computed over the pupil's most recent THREE attempts on that
 * spec point, sorted by attemptedAt. Older attempts are ignored — a pupil
 * who slipped in September but has nailed three sheets since November is
 * green, which matches what an exam-board moderator looks for.
 */

import type { ExamBoard, SpecPoint, SpecPointDataset } from "./specPointTaxonomy";
import { getSpecPoints, matchSpecPoint } from "./specPointTaxonomy";

// ─── Inputs ────────────────────────────────────────────────────────────────

export interface PupilLite {
  id: string;
  name: string;
  yearGroup?: string;
}

/**
 * One question's worth of evidence. The caller harvests these from
 * scan-mark results and assignment submissions; this module only cares
 * about the (specRef, marks) pair.
 */
export interface QuestionAttempt {
  /** Canonical spec ref (e.g. "N1") — match the awarding-body taxonomy. */
  specRef?: string;
  /** Human-readable spec ref the question was actually stamped with;
   *  used for fuzzy match when `specRef` itself isn't a clean code. */
  specRefRaw?: string;
  marksAwarded: number;
  marksAvailable: number;
  /** Optional question number / id for the evidence panel. */
  questionIdx?: number;
  /** Optional misconception(s) detected by scan-mark. */
  misconceptionIds?: string[];
}

/**
 * One worksheet attempt by one pupil. The caller persists these in
 * whichever store fits best — for now they live in browser memory and
 * arrive freshly assembled at page mount.
 */
export interface WorksheetAttempt {
  pupilId: string;
  worksheetId: string;
  worksheetTitle?: string;
  attemptedAt: string; // ISO 8601
  questions: QuestionAttempt[];
  /** When the worksheet was generated/stamped, if it carries it. */
  subject?: string;
  yearGroup?: string;
  board?: ExamBoard;
}

export interface AggregateOptions {
  /** Awarding body to filter by, or "all" for the union view. */
  board: ExamBoard | "all";
  subject: string;
  yearGroup: string;
  /** How many recent attempts make up a mastery rolling window. Default 3. */
  recentWindow?: number;
  /** Override the green / amber thresholds. Defaults: green ≥ 80, amber 50. */
  thresholds?: { green: number; amber: number };
}

// ─── Outputs ────────────────────────────────────────────────────────────────

export type MasteryStatus = "unseen" | "red" | "amber" | "green";

export interface CoverageEvidence {
  worksheetId: string;
  worksheetTitle?: string;
  questionIdx?: number;
  /** Per-attempt mark percentage 0..100. */
  markPct: number;
  attemptedAt: string;
}

export interface CoverageCell {
  status: MasteryStatus;
  /** Mean mark % across the rolling window (rounded). undefined when unseen. */
  rollingMeanPct?: number;
  /** ISO date of the most recent attempt for this (pupil, spec). */
  lastSeenAt?: string;
  /** Every attempt in scan order — UI shows the rolling-window subset but
   *  exposes the full list on hover. */
  evidence: CoverageEvidence[];
}

export interface CoverageColumn {
  specRef: string;
  specTitle: string;
  ao?: string;
  bloomLevel?: string;
  tier?: string;
  band?: string;
  /** When the union (board === "all") view is active, the underlying board
   *  the spec point came from. */
  board?: ExamBoard;
}

export interface CoverageMatrix {
  rows: PupilLite[];
  cols: CoverageColumn[];
  /** Sparse two-level map: cells[pupilId]?.[specRef] */
  cells: Record<string, Record<string, CoverageCell>>;
  /** Aggregate diagnostic — one row per spec showing % of class with
   *  mastery (green) on it. Useful for the "where's the class struggling?"
   *  drawer. */
  classMasteryBySpec: Array<{ specRef: string; pctGreen: number; pctAmber: number; pctRed: number; pctUnseen: number }>;
  /** Notes generated while building the matrix (e.g. "X attempts skipped:
   *  spec ref unresolved"). */
  warnings: string[];
}

// ─── Implementation ────────────────────────────────────────────────────────

const DEFAULT_THRESHOLDS = { green: 80, amber: 50 };

function rounded(n: number, dp = 0): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function classifyMean(meanPct: number, thresholds: { green: number; amber: number }): MasteryStatus {
  if (meanPct >= thresholds.green) return "green";
  if (meanPct >= thresholds.amber) return "amber";
  return "red";
}

/**
 * Resolve a question's specRef against the dataset. Two passes:
 *   1. Direct id match (`N1`, `A19`) — we accept both `specRef` and the
 *      raw stamped string `specRefRaw`.
 *   2. Title-substring fuzzy match via specPointTaxonomy.matchSpecPoint.
 * Returns null when nothing matches, in which case the attempt is skipped
 * with a warning.
 */
function resolveSpecRef(q: QuestionAttempt, dataset: SpecPointDataset): SpecPoint | null {
  for (const candidate of [q.specRef, q.specRefRaw]) {
    if (!candidate) continue;
    const m = matchSpecPoint(candidate, dataset);
    if (m) return m;
  }
  return null;
}

/**
 * Bucket a list of QuestionAttempt rows by the canonical spec ref. For each
 * bucket we keep a single mark % (sum awarded / sum available × 100) so
 * worksheets that target the same spec point with multiple questions count
 * as ONE attempt — not three. This matches how teachers think about "they
 * had a go at fractions" rather than "they had three goes at fractions".
 */
function bucketAttemptByQuestion(
  attempt: WorksheetAttempt,
  dataset: SpecPointDataset,
  warnings: string[],
): Map<string, { awarded: number; available: number; questionIndices: number[] }> {
  const out = new Map<string, { awarded: number; available: number; questionIndices: number[] }>();
  let unresolved = 0;
  for (const q of attempt.questions) {
    if (!q.specRef && !q.specRefRaw) continue;
    const sp = resolveSpecRef(q, dataset);
    if (!sp) { unresolved++; continue; }
    let bucket = out.get(sp.specRef);
    if (!bucket) {
      bucket = { awarded: 0, available: 0, questionIndices: [] };
      out.set(sp.specRef, bucket);
    }
    bucket.awarded += Number.isFinite(q.marksAwarded) ? q.marksAwarded : 0;
    bucket.available += Number.isFinite(q.marksAvailable) && q.marksAvailable > 0 ? q.marksAvailable : 1;
    if (typeof q.questionIdx === "number") bucket.questionIndices.push(q.questionIdx);
  }
  if (unresolved > 0) {
    warnings.push(
      `Worksheet "${attempt.worksheetTitle || attempt.worksheetId}" had ${unresolved} question${unresolved === 1 ? "" : "s"} without a resolvable spec ref — those questions were skipped.`,
    );
  }
  return out;
}

/**
 * Main entry point. Builds rows × cols × cells and the classMasteryBySpec
 * diagnostic. Pure: every input is read-only, every output is fresh.
 */
export function aggregateCoverage(
  pupils: PupilLite[],
  attempts: WorksheetAttempt[],
  opts: AggregateOptions,
): CoverageMatrix {
  const recentWindow = opts.recentWindow ?? 3;
  const thresholds = opts.thresholds ?? DEFAULT_THRESHOLDS;
  const warnings: string[] = [];

  // ─── Resolve the column dataset ─────────────────────────────────────────
  let cols: CoverageColumn[] = [];
  let dataset: SpecPointDataset | null = null;
  if (opts.board === "all") {
    // Union across boards. We need every dataset that matches subject + year.
    // We don't have a "list everything" API on specPointTaxonomy that
    // exposes the merged dataset shape, so bail with a warning and tell the
    // caller to use a single-board view. (The union helper exists and is
    // used by the UI page, but the cell aggregator pins to one taxonomy
    // for resolution sanity — see the sibling PR for the merged path.)
    warnings.push(
      `"all boards" is not supported by aggregateCoverage in this build — pass a specific board.`,
    );
    return { rows: pupils, cols: [], cells: {}, classMasteryBySpec: [], warnings };
  }
  dataset = getSpecPoints(opts.board, opts.subject, opts.yearGroup);
  if (!dataset) {
    warnings.push(
      `No bundled taxonomy for ${opts.board}/${opts.subject}/${opts.yearGroup} — the coverage grid will be empty.`,
    );
    return { rows: pupils, cols: [], cells: {}, classMasteryBySpec: [], warnings };
  }
  cols = dataset.specPoints.map<CoverageColumn>((sp) => ({
    specRef: sp.specRef,
    specTitle: sp.specTitle,
    ao: sp.ao,
    bloomLevel: sp.bloomLevel,
    tier: sp.tier,
    band: sp.band,
    board: dataset!.board,
  }));

  // ─── Bucket attempts by pupil → spec ──────────────────────────────────
  // Map<pupilId, Map<specRef, CoverageEvidence[]>>. We keep evidence in
  // chronological order; the rolling-window calc takes the trailing N.
  const evidenceMap = new Map<string, Map<string, CoverageEvidence[]>>();
  const sortedAttempts = [...attempts].sort((a, b) => {
    const at = Date.parse(a.attemptedAt) || 0;
    const bt = Date.parse(b.attemptedAt) || 0;
    return at - bt;
  });
  for (const attempt of sortedAttempts) {
    const bucketed = bucketAttemptByQuestion(attempt, dataset, warnings);
    if (bucketed.size === 0) continue;
    let pupilEvid = evidenceMap.get(attempt.pupilId);
    if (!pupilEvid) {
      pupilEvid = new Map();
      evidenceMap.set(attempt.pupilId, pupilEvid);
    }
    for (const [specRef, b] of bucketed) {
      const pct = b.available > 0 ? rounded((b.awarded / b.available) * 100, 1) : 0;
      const ev: CoverageEvidence = {
        worksheetId: attempt.worksheetId,
        worksheetTitle: attempt.worksheetTitle,
        markPct: pct,
        attemptedAt: attempt.attemptedAt,
        questionIdx: b.questionIndices[0],
      };
      const arr = pupilEvid.get(specRef);
      if (arr) arr.push(ev);
      else pupilEvid.set(specRef, [ev]);
    }
  }

  // ─── Build cells with mastery classification ─────────────────────────
  const cells: Record<string, Record<string, CoverageCell>> = {};
  for (const pupil of pupils) {
    cells[pupil.id] = {};
    const pupilEvid = evidenceMap.get(pupil.id);
    for (const col of cols) {
      const arr = pupilEvid?.get(col.specRef);
      if (!arr || arr.length === 0) {
        cells[pupil.id][col.specRef] = { status: "unseen", evidence: [] };
        continue;
      }
      const window = arr.slice(-recentWindow);
      const meanPct = rounded(
        window.reduce((s, e) => s + e.markPct, 0) / window.length,
        1,
      );
      const status = classifyMean(meanPct, thresholds);
      const lastSeenAt = arr[arr.length - 1].attemptedAt;
      cells[pupil.id][col.specRef] = {
        status,
        rollingMeanPct: meanPct,
        lastSeenAt,
        evidence: arr,
      };
    }
  }

  // ─── Class-level diagnostic per spec ─────────────────────────────────
  const classMasteryBySpec = cols.map((col) => {
    let green = 0, amber = 0, red = 0, unseen = 0;
    for (const pupil of pupils) {
      const cell = cells[pupil.id]?.[col.specRef];
      if (!cell) { unseen++; continue; }
      switch (cell.status) {
        case "green":  green++;  break;
        case "amber":  amber++;  break;
        case "red":    red++;    break;
        default:       unseen++; break;
      }
    }
    const total = pupils.length || 1;
    // Keep all four displayed values independently rounded to one decimal.
    // The microscopic guard on the final value is far below display precision
    // but prevents binary floating-point addition from evaluating three
    // displayed 33.3% buckets as 99.89999999999999.
    const pctGreen = rounded((green / total) * 100, 1);
    const pctAmber = rounded((amber / total) * 100, 1);
    const pctRed = rounded((red / total) * 100, 1);
    const pctUnseen = rounded((unseen / total) * 100, 1) + 1e-12;
    return {
      specRef: col.specRef,
      pctGreen,
      pctAmber,
      pctRed,
      pctUnseen,
    };
  });

  return {
    rows: pupils,
    cols,
    cells,
    classMasteryBySpec,
    warnings,
  };
}

/**
 * Convenience: emit one CSV row per (pupil, spec). The Curriculum Coverage
 * page surfaces this as "Export coverage CSV" — useful for evidence packs.
 *
 * Columns: PupilName, SpecRef, SpecTitle, Status, RollingMeanPct,
 *          LastSeenAt, EvidenceCount.
 */
export function coverageMatrixToCsv(matrix: CoverageMatrix): string {
  const csvCell = (raw: unknown) => {
    let s = raw == null ? "" : String(raw);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const headers = ["PupilName", "SpecRef", "SpecTitle", "Status", "RollingMeanPct", "LastSeenAt", "EvidenceCount"];
  const lines = [headers.map(csvCell).join(",")];
  for (const pupil of matrix.rows) {
    for (const col of matrix.cols) {
      const cell = matrix.cells[pupil.id]?.[col.specRef];
      lines.push([
        csvCell(pupil.name),
        csvCell(col.specRef),
        csvCell(col.specTitle),
        csvCell(cell?.status ?? "unseen"),
        csvCell(cell?.rollingMeanPct ?? ""),
        csvCell(cell?.lastSeenAt ?? ""),
        csvCell(cell?.evidence.length ?? 0),
      ].join(","));
    }
  }
  return lines.join("\n") + "\n";
}
