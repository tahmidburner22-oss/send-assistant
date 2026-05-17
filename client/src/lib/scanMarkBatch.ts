/**
 * scanMarkBatch.ts — FEAT-PB4 · Phase B
 * ──────────────────────────────────────────────────────────────────────────
 * Batch-mode helpers that turn the single-image scan-and-mark pipeline into
 * a class-set workflow:
 *
 *   1. scanBatch(images, expected, opts)        — async generator that
 *      walks images sequentially through /api/ai/scan-mark, yielding live
 *      progress so the UI can drive a progress bar without polling.
 *
 *   2. aggregateBatch(results)                  — pure analytics. Per-
 *      question accuracy + mean marks + top misconceptions, plus per-
 *      pupil score + gap list.
 *
 *   3. generateBulkFeedback(results, worksheet) — one short AI comment per
 *      pupil, referencing the actual wrong answers. Falls back to a
 *      generic comment if the AI call fails.
 *
 *   4. exportToCsv(results, worksheet, agg?)    — UK-MIS-friendly CSV
 *      (ISO date, escaped quotes, no formula auto-traps) the teacher can
 *      drop into SIMS / Bromcom / Arbor.
 *
 * Constraints honoured:
 *   - Reuses the existing /api/ai/scan-mark Vision endpoint via scanAndMark.
 *   - Sequential iteration only (the endpoint has a 25 MB cap per call).
 *   - exportToCsv is the *only* MIS bridge in this PR; native MIS APIs
 *     (Wonde / GroupCall) are Phase C territory. CSV is the format every
 *     UK MIS imports natively, and the file is downloaded for the teacher
 *     to save themselves — there is no paid push.
 *
 * No new dependencies.
 */

import { callAI } from "./ai";
import {
  scanAndMark,
  buildExpectedAnswersFromWorksheet,
  type ScanMarkExpected,
  type ScanMarkResult,
} from "./scan-mark";

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * One image queued for batch processing. The pupil identity travels with
 * the image so per-pupil rows in the CSV / aggregate stay in sync even if
 * the teacher uploads photos out of register order.
 */
export interface BatchImageInput {
  pupilId: string;
  pupilName: string;
  /** Optional MIS unique pupil number — emitted into the CSV when present. */
  upn?: string;
  image: File | Blob;
}

/**
 * Per-pupil result of a single batch step. Mirrors ScanBatchEntry from
 * reteachPlanner.ts so the caller can hand the array straight to
 * aggregateClassErrors / ReteachGapPanel without reshaping.
 */
export interface BatchScanResult {
  pupilId: string;
  pupilName: string;
  upn?: string;
  result: ScanMarkResult;
  scannedAt: string;
  /** Cached AI feedback comment, populated by generateBulkFeedback. */
  feedbackComment?: string;
  /** Set when the scan failed and we want to surface the row anyway. */
  error?: string;
}

/**
 * One yielded value from scanBatch. The UI reads `processed/total` for the
 * progress bar and `perPupilResult` for the live "tick / cross" row.
 */
export interface ScanBatchProgress {
  processed: number;
  total: number;
  currentPupilName: string;
  perPupilResult?: BatchScanResult;
  error?: string;
}

export interface ScanBatchOptions {
  /** Whole worksheet object, used to derive expectedAnswers if the caller
   *  doesn't pass one. */
  worksheet?: any;
  /** Override expected answers (mirrors scanAndMark's signature). */
  expectedAnswers?: ScanMarkExpected[];
  /** AbortSignal so the UI's "Cancel" button can stop mid-batch. */
  signal?: AbortSignal;
  /** Override metadata fields (subject/topic/yearGroup/title) sent to the
   *  Vision endpoint. Defaults are pulled from worksheet.metadata. */
  metadata?: { title?: string; subject?: string; topic?: string; yearGroup?: string };
}

export interface PerQuestionAggregate {
  /** 1-indexed question number (matches Q1, Q2…). */
  idx: number;
  questionText: string;
  totalPupils: number;
  correctPupils: number;
  pctCorrect: number;
  meanMarks: number;
  marksAvailable: number;
  /** Top misconception labels (verbatim from the scanner) by pupil count. */
  commonMisconceptions: string[];
}

export interface PerPupilAggregate {
  pupilId: string;
  pupilName: string;
  upn?: string;
  totalAwarded: number;
  totalAvailable: number;
  pctCorrect: number;
  /** Misconception labels detected for this pupil (deduped, scan order). */
  gaps: string[];
}

export interface BatchAggregate {
  perQuestion: PerQuestionAggregate[];
  perPupil: PerPupilAggregate[];
  classAccuracyPct: number;
  topMisconceptions: { label: string; pupilCount: number }[];
  totalPupils: number;
  totalQuestions: number;
}

export interface BulkFeedbackEntry {
  pupilId: string;
  pupilName: string;
  comment: string;
  /** True when the AI fell over and we returned a deterministic comment. */
  fallback: boolean;
}

// ─── 1. scanBatch ──────────────────────────────────────────────────────────

/**
 * Sequentially mark every image in a batch. Yields ScanBatchProgress after
 * each image so the caller can drive a progress bar and append per-pupil
 * rows live. Returns the full BatchScanResult[] when complete.
 *
 * Honour the AbortSignal passed via opts.signal: when aborted we stop
 * dispatching new requests and return whatever we've already collected.
 * (We don't try to abort the in-flight fetch — multer has likely already
 * read the body; a wasted 1-image call is acceptable to keep this small.)
 */
export async function* scanBatch(
  images: BatchImageInput[],
  opts: ScanBatchOptions = {},
): AsyncGenerator<ScanBatchProgress, BatchScanResult[], void> {
  const total = images.length;
  const expected = opts.expectedAnswers
    ?? (opts.worksheet ? buildExpectedAnswersFromWorksheet(opts.worksheet) : []);
  const meta = {
    title: opts.metadata?.title ?? opts.worksheet?.title,
    subject: opts.metadata?.subject ?? opts.worksheet?.metadata?.subject,
    topic: opts.metadata?.topic ?? opts.worksheet?.metadata?.topic,
    yearGroup: opts.metadata?.yearGroup ?? opts.worksheet?.metadata?.yearGroup,
  };

  const collected: BatchScanResult[] = [];
  for (let i = 0; i < images.length; i++) {
    if (opts.signal?.aborted) {
      yield {
        processed: collected.length,
        total,
        currentPupilName: images[i].pupilName,
        error: "Cancelled",
      };
      return collected;
    }
    const img = images[i];
    yield { processed: collected.length, total, currentPupilName: img.pupilName };

    let perPupilResult: BatchScanResult;
    try {
      const result = await scanAndMark({
        image: img.image,
        title: meta.title,
        subject: meta.subject,
        topic: meta.topic,
        yearGroup: meta.yearGroup,
        expectedAnswers: expected,
      });
      perPupilResult = {
        pupilId: img.pupilId,
        pupilName: img.pupilName,
        upn: img.upn,
        result,
        scannedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      perPupilResult = {
        pupilId: img.pupilId,
        pupilName: img.pupilName,
        upn: img.upn,
        // Empty-but-shaped result so aggregation doesn't blow up.
        result: {
          questions: [],
          summary: { totalAwarded: 0, totalAvailable: 0, overallNote: "Scan failed" },
          provider: "error",
        },
        scannedAt: new Date().toISOString(),
        error: err?.message || "Scan failed",
      };
    }
    collected.push(perPupilResult);
    yield {
      processed: collected.length,
      total,
      currentPupilName: img.pupilName,
      perPupilResult,
      error: perPupilResult.error,
    };
  }
  return collected;
}

// ─── 2. aggregateBatch ─────────────────────────────────────────────────────

function normaliseMisconceptionLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim();
}

function rounded(n: number, dp = 1): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

/**
 * Pure analytics over a completed batch. Skips entries with `error` set so
 * a failed scan doesn't tank the class accuracy %.
 */
export function aggregateBatch(results: BatchScanResult[]): BatchAggregate {
  const valid = results.filter((r) => !r.error);
  const totalPupils = valid.length;
  const totalQuestionsSet = new Set<number>();

  // Per-question aggregation
  type QBucket = {
    idx: number;
    questionText: string;
    correct: number;
    attempts: number;
    totalAwarded: number;
    totalAvailable: number;
    misconceptions: Map<string, number>;
  };
  const byQ = new Map<number, QBucket>();
  // Per-pupil aggregation
  const perPupil: PerPupilAggregate[] = [];
  // Class-wide misconception tally
  const classMisconceptions = new Map<string, number>();

  for (const entry of valid) {
    let pupilAwarded = 0;
    let pupilAvailable = 0;
    const pupilGaps: string[] = [];
    const seenGaps = new Set<string>();

    for (const q of entry.result.questions || []) {
      const idx = Number.isInteger(q.questionNumber) && q.questionNumber > 0
        ? q.questionNumber
        : null;
      if (idx === null) continue;
      totalQuestionsSet.add(idx);
      let bucket = byQ.get(idx);
      if (!bucket) {
        bucket = {
          idx,
          questionText: (q.questionText || "").trim() || `Q${idx}`,
          correct: 0,
          attempts: 0,
          totalAwarded: 0,
          totalAvailable: 0,
          misconceptions: new Map(),
        };
        byQ.set(idx, bucket);
      } else if (!bucket.questionText && q.questionText) {
        bucket.questionText = q.questionText.trim();
      }
      bucket.attempts += 1;
      if (q.correct) bucket.correct += 1;
      const awarded = Number.isFinite(q.marksAwarded) ? q.marksAwarded : 0;
      const avail = Number.isFinite(q.marksAvailable) && q.marksAvailable > 0 ? q.marksAvailable : 1;
      bucket.totalAwarded += awarded;
      bucket.totalAvailable += avail;
      pupilAwarded += awarded;
      pupilAvailable += avail;
      const tag = normaliseMisconceptionLabel(q.misconceptionTag);
      if (!q.correct && tag) {
        bucket.misconceptions.set(tag, (bucket.misconceptions.get(tag) || 0) + 1);
        const key = tag.toLowerCase();
        if (!seenGaps.has(key)) {
          seenGaps.add(key);
          pupilGaps.push(tag);
        }
        classMisconceptions.set(tag, (classMisconceptions.get(tag) || 0) + 1);
      }
    }

    perPupil.push({
      pupilId: entry.pupilId,
      pupilName: entry.pupilName,
      upn: entry.upn,
      totalAwarded: pupilAwarded,
      totalAvailable: pupilAvailable,
      pctCorrect: pupilAvailable > 0 ? rounded((pupilAwarded / pupilAvailable) * 100, 1) : 0,
      gaps: pupilGaps,
    });
  }

  const perQuestion: PerQuestionAggregate[] = [...byQ.values()]
    .sort((a, b) => a.idx - b.idx)
    .map((b) => {
      const top = [...b.misconceptions.entries()]
        .sort((a, c) => c[1] - a[1])
        .slice(0, 3)
        .map(([label]) => label);
      const marksAvailable = b.attempts > 0 ? b.totalAvailable / b.attempts : 0;
      return {
        idx: b.idx,
        questionText: b.questionText,
        totalPupils: b.attempts,
        correctPupils: b.correct,
        pctCorrect: b.attempts > 0 ? rounded((b.correct / b.attempts) * 100, 1) : 0,
        meanMarks: b.attempts > 0 ? rounded(b.totalAwarded / b.attempts, 2) : 0,
        marksAvailable: rounded(marksAvailable, 2),
        commonMisconceptions: top,
      };
    });

  const totalAwarded = perPupil.reduce((s, p) => s + p.totalAwarded, 0);
  const totalAvailable = perPupil.reduce((s, p) => s + p.totalAvailable, 0);
  const classAccuracyPct = totalAvailable > 0
    ? rounded((totalAwarded / totalAvailable) * 100, 1)
    : 0;

  const topMisconceptions = [...classMisconceptions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, pupilCount]) => ({ label, pupilCount }));

  return {
    perQuestion,
    perPupil,
    classAccuracyPct,
    topMisconceptions,
    totalPupils,
    totalQuestions: totalQuestionsSet.size,
  };
}

// ─── 3. generateBulkFeedback ───────────────────────────────────────────────

function deterministicFallbackComment(entry: BatchScanResult): string {
  const wrong = entry.result.questions.filter((q) => !q.correct);
  if (entry.error) {
    return `Scan failed for ${entry.pupilName}; please re-photograph the worksheet and try again.`;
  }
  if (wrong.length === 0) {
    return `${entry.pupilName} answered every question correctly. Strong work — set a stretch task next.`;
  }
  const tags = wrong
    .map((q) => normaliseMisconceptionLabel(q.misconceptionTag))
    .filter(Boolean);
  const slipped = tags.length > 0
    ? `Slipped on: ${tags.slice(0, 2).join("; ")}.`
    : `Slipped on Q${wrong.slice(0, 2).map((q) => q.questionNumber).join(", Q")}.`;
  return `${entry.pupilName} got ${entry.result.summary.totalAwarded}/${entry.result.summary.totalAvailable}. ${slipped} Re-teach the matching step before the next worksheet.`;
}

/**
 * Build one short feedback comment per pupil. We make a single AI call per
 * pupil with a tightly-bounded prompt so cost stays predictable. If the
 * call fails we return a deterministic comment that still references the
 * pupil's wrong answers, so the CSV column never sits empty.
 *
 * Comments cap at 80 words to fit MIS comment fields cleanly.
 */
export async function generateBulkFeedback(
  results: BatchScanResult[],
  worksheet: any,
): Promise<BulkFeedbackEntry[]> {
  const subject = worksheet?.metadata?.subject || "this topic";
  const topic = worksheet?.metadata?.topic || worksheet?.title || "";
  const yearGroup = worksheet?.metadata?.yearGroup || "";

  const out: BulkFeedbackEntry[] = [];
  for (const entry of results) {
    if (entry.feedbackComment) {
      out.push({
        pupilId: entry.pupilId,
        pupilName: entry.pupilName,
        comment: entry.feedbackComment,
        fallback: false,
      });
      continue;
    }
    if (entry.error || (entry.result.questions || []).length === 0) {
      const c = deterministicFallbackComment(entry);
      entry.feedbackComment = c;
      out.push({ pupilId: entry.pupilId, pupilName: entry.pupilName, comment: c, fallback: true });
      continue;
    }
    const wrong = entry.result.questions.filter((q) => !q.correct);
    const right = entry.result.questions.filter((q) => q.correct);
    const wrongSummary = wrong
      .slice(0, 4)
      .map((q) => `Q${q.questionNumber}: pupil wrote "${q.pupilAnswer || "(blank)"}"; expected "${q.modelAnswer || "(no model)"}"; misconception: ${q.misconceptionTag || "(untagged)"}.`)
      .join("\n");
    const rightSummary = right.length > 0
      ? `Pupil got Q${right.slice(0, 4).map((q) => q.questionNumber).join(", Q")} correct.`
      : `Pupil got nothing correct on this attempt.`;
    const userPrompt = [
      `Pupil: ${entry.pupilName}.`,
      `Year group: ${yearGroup}. Subject: ${subject}. Topic: ${topic}.`,
      `Score: ${entry.result.summary.totalAwarded}/${entry.result.summary.totalAvailable}.`,
      rightSummary,
      wrong.length > 0 ? `Wrong answers (use these verbatim, do NOT invent):` : "",
      wrongSummary,
      `Write ONE feedback comment of at most 80 words, addressed to the pupil ("you"), referencing at least one specific wrong answer when there is one. Keep tone constructive. End with one concrete next step. Do not output anything except the comment text.`,
    ].filter(Boolean).join("\n");
    try {
      const { text } = await callAI(
        "You are a UK secondary-school teacher writing concise written feedback for a pupil's marked worksheet. British English. Plain text only — no markdown, no quotes around the comment, no preamble.",
        userPrompt,
        220,
      );
      const cleaned = String(text || "").replace(/^["'`]+|["'`]+$/g, "").trim();
      if (!cleaned) throw new Error("Empty AI response");
      // Cap at ~80 words defensively in case the model rambled.
      const words = cleaned.split(/\s+/);
      const capped = words.length > 95 ? words.slice(0, 95).join(" ") + "…" : cleaned;
      entry.feedbackComment = capped;
      out.push({ pupilId: entry.pupilId, pupilName: entry.pupilName, comment: capped, fallback: false });
    } catch {
      const c = deterministicFallbackComment(entry);
      entry.feedbackComment = c;
      out.push({ pupilId: entry.pupilId, pupilName: entry.pupilName, comment: c, fallback: true });
    }
  }
  return out;
}

// ─── 4. exportToCsv ────────────────────────────────────────────────────────

/**
 * Escape a CSV cell. We always wrap in double-quotes and escape internal
 * quotes — this is the format every UK MIS importer reads cleanly. We also
 * prepend a single quote to any cell starting with =, +, -, @ to defuse
 * the Excel formula auto-trigger that has eaten more than one teacher's
 * mark column.
 */
function csvCell(raw: unknown): string {
  let s = raw == null ? "" : String(raw);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

function isoDate(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Emit a UK-MIS-friendly CSV. Columns:
 *   PupilName, UPN, Mark, OutOf, Pct, Comment, Misconceptions, Date
 *
 * The teacher downloads this file and saves it themselves — there is no
 * paid push. (Native MIS APIs are Phase C.)
 */
export function exportToCsv(
  results: BatchScanResult[],
  worksheet: any,
  agg?: BatchAggregate,
): string {
  const aggregate = agg ?? aggregateBatch(results);
  const date = isoDate();
  const title = worksheet?.title || "worksheet";
  const className = worksheet?.metadata?.className || worksheet?.metadata?.classGroup || "";
  const headerNote = `# Adaptly marksheet · ${title}${className ? ` · ${className}` : ""} · exported ${date}`;
  const headers = ["PupilName", "UPN", "Mark", "OutOf", "Pct", "Comment", "Misconceptions", "Date"];
  const lines: string[] = [headerNote, headers.map(csvCell).join(",")];

  // Index per-pupil aggregates for fast lookup so the CSV row order matches
  // the original results order (which is the teacher's scan order — not
  // alphabetical, deliberately).
  const aggByPupil = new Map(aggregate.perPupil.map((p) => [p.pupilId, p]));

  for (const r of results) {
    const a = aggByPupil.get(r.pupilId);
    const mark = a?.totalAwarded ?? 0;
    const outOf = a?.totalAvailable ?? r.result.summary.totalAvailable ?? 0;
    const pct = a?.pctCorrect ?? 0;
    const misconceptions = (a?.gaps ?? []).slice(0, 5).join("; ");
    const comment = r.feedbackComment ?? (r.error ? `Scan failed: ${r.error}` : "");
    lines.push([
      csvCell(r.pupilName),
      csvCell(r.upn || ""),
      csvCell(mark),
      csvCell(outOf),
      csvCell(pct),
      csvCell(comment),
      csvCell(misconceptions),
      csvCell(date),
    ].join(","));
  }
  // CSV spec requires a trailing newline for many importers.
  return lines.join("\n") + "\n";
}

/**
 * Build the filename a teacher expects: `{title}_{class}_{yyyy-mm-dd}.csv`,
 * cleaned of filesystem-hostile characters.
 */
export function csvFilename(worksheet: any, date = new Date()): string {
  const title = String(worksheet?.title || "worksheet").trim();
  const className = String(worksheet?.metadata?.className || worksheet?.metadata?.classGroup || "").trim();
  const slug = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_");
  const stem = [slug(title), className ? slug(className) : null, isoDate(date)]
    .filter(Boolean)
    .join("_");
  return `${stem || "marksheet"}.csv`;
}

/**
 * Trigger the browser to download a CSV file. Centralised so the dialog
 * doesn't have to hand-roll Blob/anchor plumbing.
 */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  // BOM keeps Excel/SIMS happy with UTF-8.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
