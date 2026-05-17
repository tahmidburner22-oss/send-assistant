/**
 * attemptLog.ts — FEAT-PC4 (UI half) · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * Lightweight, browser-only persistence for the WorksheetAttempt[] feed
 * that drives the Curriculum Coverage page.
 *
 * Today there is exactly ONE place a worksheet attempt can be evidenced
 * with per-question correctness:
 *
 *   - ScanMarkDialog → reteachBatch (in-memory state inside Worksheets.tsx)
 *
 * That state evaporates the moment the teacher navigates away. The
 * Curriculum Coverage page needs a stable feed across reloads (Heads of
 * Department open it once a half-term to populate evidence packs), so we
 * tee a copy of every scan into localStorage as an opaque attempt log.
 *
 * Three rules keep the implementation honest:
 *
 *  1. The log is **append-only** from the writer's perspective — every scan
 *     becomes one new entry. Re-scanning the same pupil + worksheet
 *     replaces the prior entry rather than double-counting (matches the
 *     same dedupe rule the in-memory reteachBatch uses today).
 *  2. The log is **bounded**: oldest entries are dropped when we exceed
 *     LOG_CAP. A school running this for a year and never clearing should
 *     never run out of localStorage quota.
 *  3. The log is **disposable**: every read is wrapped in try/catch so a
 *     denied storage (incognito mode, full quota) silently degrades to an
 *     in-memory-only experience. The UI never crashes because of us.
 *
 * No tRPC, no fetch — this stays client-only until a server schema lands.
 */

import type { ScanMarkResult } from "./scan-mark";
import type { WorksheetAttempt, QuestionAttempt } from "./coverageAggregator";
import type { ExamBoard } from "./specPointTaxonomy";

const STORAGE_KEY = "adaptly:attemptLog:v1";
const LOG_CAP = 5_000; // ~half-term × 6 classes × 30 pupils × ~5 worksheets each.

// ─── Public types ──────────────────────────────────────────────────────────

/**
 * The shape stored on disk. Identical to WorksheetAttempt today, but pinned
 * separately so future changes to the runtime aggregator type don't quietly
 * invalidate every teacher's localStorage.
 */
export type StoredAttempt = WorksheetAttempt;

// ─── Read / write primitives ───────────────────────────────────────────────

function safeRead(): StoredAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive shape-check: a corrupt entry shouldn't poison the whole log.
    return parsed.filter(isAttempt);
  } catch {
    return [];
  }
}

function safeWrite(attempts: StoredAttempt[]): void {
  if (typeof window === "undefined") return;
  try {
    // Cap from the *front* (oldest first) so we keep the most recent run.
    const trimmed = attempts.length > LOG_CAP
      ? attempts.slice(attempts.length - LOG_CAP)
      : attempts;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota exceeded or storage denied. Silently degrade — the live page
    // continues to work from the in-memory copy that was just appended.
  }
}

function isAttempt(value: unknown): value is StoredAttempt {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.pupilId === "string" &&
    typeof v.worksheetId === "string" &&
    typeof v.attemptedAt === "string" &&
    Array.isArray(v.questions)
  );
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function readAttemptLog(): StoredAttempt[] {
  return safeRead();
}

export function clearAttemptLog(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* swallow */ }
}

/**
 * Append (or upsert) a single attempt. We use (pupilId, worksheetId) as the
 * dedupe key so re-scanning the same pupil's sheet replaces — not stacks —
 * the prior entry. Returns the new full log so callers can update React
 * state without a second read.
 */
export function appendAttempt(attempt: StoredAttempt): StoredAttempt[] {
  if (!isAttempt(attempt)) return safeRead();
  const log = safeRead();
  const idx = log.findIndex(
    (a) => a.pupilId === attempt.pupilId && a.worksheetId === attempt.worksheetId,
  );
  if (idx >= 0) log.splice(idx, 1, attempt);
  else log.push(attempt);
  safeWrite(log);
  // Notify other tabs (and the Coverage page if it's already mounted in the
  // same tab) that the log has changed. The "storage" event handles the
  // cross-tab case automatically; the custom event handles same-tab.
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("adaptly:attempt-log-updated"));
    } catch { /* swallow */ }
  }
  return log;
}

// ─── Builders ──────────────────────────────────────────────────────────────

/**
 * Source-worksheet shape that carries enough metadata to build an attempt.
 * Matches the worksheet shape returned by aiGenerateWorksheet plus the
 * coverage-map stamp added by FEAT-PC10 (coverageMapBuilder.ts).
 */
export interface AttemptSourceWorksheet {
  id?: string;
  title?: string;
  metadata?: {
    subject?: string;
    yearGroup?: string;
    examBoard?: string;
    coverageMap?: {
      rows: Array<{ qNum: number; specRef: string; misconceptionIds?: string[] }>;
    };
    [key: string]: unknown;
  };
}

/**
 * Convert one (pupil, ScanMarkResult, source worksheet) tuple into a
 * StoredAttempt. The coverageMap (PC10) is the authoritative source for
 * specRef stamping; without it we fall back to the worksheet's overall
 * topic so the entry is still useful in the "Recent attempts" debug view
 * even when the column resolver later drops it as unresolved.
 *
 * The board metadata is best-effort: worksheet.metadata.examBoard is a
 * free-text string today, so we lower-case it and fall back to "aqa" when
 * it doesn't match a known board. The aggregator will tolerate a
 * mismatched board by returning an empty matrix + warning, so the user
 * sees a fixable error rather than a silent miss.
 */
export function buildAttemptFromScan(args: {
  pupil: { id: string; name?: string };
  worksheet: AttemptSourceWorksheet;
  result: ScanMarkResult;
  attemptedAt?: string;
}): StoredAttempt {
  const cm = args.worksheet.metadata?.coverageMap;
  const cmByQ = new Map<number, { specRef: string; misconceptionIds?: string[] }>();
  if (cm && Array.isArray(cm.rows)) {
    for (const r of cm.rows) cmByQ.set(r.qNum, { specRef: r.specRef, misconceptionIds: r.misconceptionIds });
  }

  const questions: QuestionAttempt[] = args.result.questions.map((q) => {
    const stamp = cmByQ.get(q.questionNumber);
    return {
      specRef: stamp?.specRef,
      // The PC10 specRef is a long descriptor (e.g. "Y10 Maths — Algebra
      // (linear graphs)"). The aggregator's matchSpecPoint handles the
      // fuzzy match against the awarding-body taxonomy, so we forward both
      // the stamped value and the raw question text for resilience.
      specRefRaw: stamp?.specRef || q.questionText,
      marksAwarded: q.marksAwarded,
      marksAvailable: q.marksAvailable || 1,
      questionIdx: q.questionNumber,
      misconceptionIds:
        stamp?.misconceptionIds ||
        (q.misconceptionTag ? [q.misconceptionTag] : undefined),
    };
  });

  const board = (args.worksheet.metadata?.examBoard || "").trim().toLowerCase();
  const knownBoards: ExamBoard[] = ["aqa", "edexcel", "ocr", "cie", "sqa", "ccea", "white-rose"];
  const resolvedBoard = (knownBoards as string[]).includes(board) ? (board as ExamBoard) : undefined;

  return {
    pupilId: args.pupil.id,
    worksheetId: args.worksheet.id || "ws-unknown",
    worksheetTitle: args.worksheet.title,
    attemptedAt: args.attemptedAt || new Date().toISOString(),
    questions,
    subject: args.worksheet.metadata?.subject,
    yearGroup: args.worksheet.metadata?.yearGroup,
    board: resolvedBoard,
  };
}
