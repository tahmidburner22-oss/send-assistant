/**
 * reteachPlanner.ts — FEAT-PB3 · Phase B
 *
 * Closes the assess→re-teach loop. After a Scan & Mark batch on a single
 * worksheet, this module:
 *
 *   1. aggregateClassErrors — groups per-pupil ScanMarkResult objects by
 *      (questionIdx, misconceptionId) and computes the % of pupils who got
 *      that question wrong. Filters by a configurable threshold (default 40%).
 *
 *   2. buildReteachBrief — turns one aggregation row + the source worksheet
 *      + the class roster into a structured brief: { topic, misconceptionEntry,
 *      pupilsToTarget, instructions }. The instructions block is a stable,
 *      deterministic template the AI generator appends to its prompt.
 *
 *   3. aiGenerateReteachWorksheet — thin wrapper over aiGenerateWorksheet
 *      that injects the brief.instructions as additionalInstructions and
 *      stamps metadata.reteach onto the result.
 *
 * No new dependencies. Pure functions where possible. The AI call is
 * isolated to one helper so unit tests can cover aggregation and brief
 * shaping without mocking the network.
 */

import { aiGenerateWorksheet, type AIWorksheetResult } from "./ai";
import { findMisconceptionById, type MisconceptionEntry } from "./misconception-bank";
import type { ScanMarkResult, ScanMarkQuestion } from "./scan-mark";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Per-pupil entry in a Scan & Mark batch. The pupilId / pupilName are added
 * by the caller when accumulating individual ScanMarkResult objects into a
 * batch — scan-mark.ts on its own does not carry pupil identity.
 */
export interface ScanBatchEntry {
  pupilId: string;
  pupilName: string;
  result: ScanMarkResult;
  scannedAt?: string;
}

export type ScanBatchResult = ScanBatchEntry[];

/**
 * One row in the aggregated class-error report. A "gap" is one (question,
 * misconception) pair that ≥ thresholdPct of pupils got wrong.
 */
export interface ReteachGapRow {
  /** 1-indexed question number from the source worksheet (matches Q1, Q2…). */
  questionIdx: number;
  questionText: string;
  /** Misconception bank id (e.g. "m-frac-01") if a bank match was found,
   *  otherwise the raw misconceptionTag string from the scanner so the row
   *  is still actionable. */
  misconceptionId: string;
  /** Resolved bank entry, when misconceptionId matches a bank row. */
  misconceptionEntry?: MisconceptionEntry;
  /** Free-text label from the scanner, surfaced to the teacher even when no
   *  bank match is found. */
  misconceptionLabel: string;
  /** 0..100 percent of pupils who got this question wrong (across the batch). */
  pctWrong: number;
  /** Names of pupils who got this question wrong, in scan order. */
  pupilsWrong: string[];
  /** Total pupils who attempted this question. */
  totalPupils: number;
}

export interface AggregateOptions {
  /** Minimum pct-wrong (0..100) to surface a gap. Default 40. */
  thresholdPct?: number;
}

export interface ReteachBrief {
  topic: string;
  subject: string;
  yearGroup: string;
  misconceptionId: string;
  misconceptionLabel: string;
  misconceptionEntry?: MisconceptionEntry;
  pupilsToTarget: string[];
  pctWrong: number;
  questionIdx: number;
  sourceWorksheetTitle: string;
  /** The hard-coded re-teach instruction block to append as
   *  additionalInstructions on aiGenerateWorksheet. */
  instructions: string;
}

interface SourceWorksheetLite {
  id?: string;
  title?: string;
  metadata?: {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    misconceptionLinks?: Array<{
      sectionIndex: number;
      sectionTitle?: string;
      distractor: string;
      misconceptionId: string;
    }>;
    [key: string]: unknown;
  };
  sections?: Array<{
    type?: string;
    title?: string;
    content?: string;
    teacherOnly?: boolean;
    [key: string]: unknown;
  }>;
}

// ─── 1. aggregateClassErrors ─────────────────────────────────────────────────

/**
 * Normalise a misconceptionTag for grouping. Bank ids stay verbatim; free
 * text is lower-cased and squashed so "Adds numerators" and "adds
 * numerators." aggregate to the same bucket.
 */
function normaliseMisconceptionKey(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^m-[a-z0-9-]{2,}$/i.test(trimmed)) return trimmed.toLowerCase();
  return trimmed.toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Accumulate (questionIdx, misconceptionId) → pupil-list across a batch.
 * One pupil getting Q3 wrong with no misconceptionTag still counts towards
 * totalPupils for that question, but only contributes to a gap row when the
 * scanner produced a tag.
 */
export function aggregateClassErrors(
  batch: ScanBatchResult,
  opts: AggregateOptions = {},
): ReteachGapRow[] {
  const threshold = opts.thresholdPct ?? 40;
  if (!Array.isArray(batch) || batch.length === 0) return [];

  // Map<questionIdx, Map<misconceptionKey, { label, pupils }>>
  const byQuestion = new Map<number, {
    questionText: string;
    misconceptions: Map<string, { label: string; pupils: string[] }>;
    pupilsAttempted: Set<string>;
  }>();

  for (const entry of batch) {
    if (!entry || !entry.result || !Array.isArray(entry.result.questions)) continue;
    const pupilName = entry.pupilName || entry.pupilId || "Unknown pupil";
    for (const q of entry.result.questions) {
      const idx = Number.isInteger(q.questionNumber) && q.questionNumber > 0
        ? q.questionNumber
        : null;
      if (idx === null) continue;
      let bucket = byQuestion.get(idx);
      if (!bucket) {
        bucket = {
          questionText: (q.questionText || "").trim() || `Question ${idx}`,
          misconceptions: new Map(),
          pupilsAttempted: new Set(),
        };
        byQuestion.set(idx, bucket);
      } else if (!bucket.questionText && q.questionText) {
        bucket.questionText = q.questionText.trim();
      }
      bucket.pupilsAttempted.add(pupilName);
      if (q.correct) continue;
      const tag = (q.misconceptionTag || "").trim();
      if (!tag) continue;
      const key = normaliseMisconceptionKey(tag);
      if (!key) continue;
      let mc = bucket.misconceptions.get(key);
      if (!mc) {
        mc = { label: tag, pupils: [] };
        bucket.misconceptions.set(key, mc);
      }
      // Dedupe — a single pupil shouldn't double-count if the same scan was
      // saved twice (rare but defensible).
      if (!mc.pupils.includes(pupilName)) mc.pupils.push(pupilName);
    }
  }

  const rows: ReteachGapRow[] = [];
  for (const [questionIdx, bucket] of byQuestion) {
    const totalPupils = bucket.pupilsAttempted.size;
    if (totalPupils === 0) continue;
    for (const [key, mc] of bucket.misconceptions) {
      const pctWrong = (mc.pupils.length / totalPupils) * 100;
      if (pctWrong < threshold) continue;
      const bankEntry = findMisconceptionById(key);
      rows.push({
        questionIdx,
        questionText: bucket.questionText,
        // If we had a bank match keep the canonical id; otherwise echo the
        // raw key so the consumer can pass it through to the AI prompt.
        misconceptionId: bankEntry ? bankEntry.id : key,
        misconceptionEntry: bankEntry,
        misconceptionLabel: bankEntry ? bankEntry.misconception : mc.label,
        pctWrong: Math.round(pctWrong * 10) / 10,
        pupilsWrong: [...mc.pupils],
        totalPupils,
      });
    }
  }

  // Most-impactful gaps first: highest pctWrong, then earliest question.
  rows.sort((a, b) => {
    if (b.pctWrong !== a.pctWrong) return b.pctWrong - a.pctWrong;
    return a.questionIdx - b.questionIdx;
  });
  return rows;
}

// ─── 2. buildReteachBrief ────────────────────────────────────────────────────

/**
 * Stable instruction template the AI generator appends to its prompt. Kept
 * as a single, deterministic block so the test suite can pin it without
 * grepping a moving prompt.
 */
function buildInstructions(args: {
  misconceptionLabel: string;
  correctUnderstanding: string;
  topic: string;
  pupilsToTarget: string[];
}): string {
  const pupilsLine = args.pupilsToTarget.length > 0
    ? `Pupils targeted (for the teacher's reference; do NOT print pupil names on the worksheet): ${args.pupilsToTarget.slice(0, 30).join(", ")}.`
    : "";
  return [
    `RE-TEACH WORKSHEET — addresses ONE specific misconception detected in a Scan & Mark batch.`,
    `Misconception (verbatim, do not paraphrase): "${args.misconceptionLabel}".`,
    `Correct understanding (use this as the model in the worked example): "${args.correctUnderstanding}".`,
    `Mandatory structure for this re-teach worksheet (in addition to the standard worksheet rules):`,
    `1. Open with a single worked example that contrasts the CORRECT method with the misconception side-by-side. Annotate where a pupil holding the misconception goes wrong.`,
    `2. Provide TWO contrast pairs: each pair shows one CORRECT working alongside one INCORRECT working that demonstrates the misconception, with the error annotated and the diagnostic step labelled.`,
    `3. Provide SIX fresh practice questions on "${args.topic}" that all probe the same misconception, increasing in complexity from a one-step recall to a multi-step application. At least one practice question MUST be a deliberate distractor question whose wrong option encodes the misconception.`,
    `4. The teacher answer key must show the diagnostic step (i.e. the moment a pupil with the misconception would slip) for every practice question.`,
    `5. Keep all section types and metadata fields you would normally produce; this worksheet flows through the same post-validator chain as a standard worksheet.`,
    pupilsLine,
  ].filter(Boolean).join("\n");
}

export function buildReteachBrief(
  row: ReteachGapRow,
  source: SourceWorksheetLite,
): ReteachBrief {
  const topic = String(source.metadata?.topic || "").trim() || "the source worksheet topic";
  const subject = String(source.metadata?.subject || "").trim();
  const yearGroup = String(source.metadata?.yearGroup || "").trim();
  const misconceptionLabel = row.misconceptionEntry?.misconception || row.misconceptionLabel;
  const correctUnderstanding = row.misconceptionEntry?.correctUnderstanding
    || "the established curriculum-correct method for this topic";
  const instructions = buildInstructions({
    misconceptionLabel,
    correctUnderstanding,
    topic,
    pupilsToTarget: row.pupilsWrong,
  });
  return {
    topic,
    subject,
    yearGroup,
    misconceptionId: row.misconceptionId,
    misconceptionLabel,
    misconceptionEntry: row.misconceptionEntry,
    pupilsToTarget: [...row.pupilsWrong],
    pctWrong: row.pctWrong,
    questionIdx: row.questionIdx,
    sourceWorksheetTitle: String(source.title || "previous worksheet").trim(),
    instructions,
  };
}

// ─── 3. aiGenerateReteachWorksheet ───────────────────────────────────────────

/**
 * Thin wrapper around aiGenerateWorksheet:
 *   - Forwards the brief's subject/topic/yearGroup to the generator.
 *   - Appends brief.instructions to additionalInstructions (preserving any
 *     pre-existing teacher-typed instructions in `extras`).
 *   - Stamps metadata.reteach onto the returned worksheet so the renderer's
 *     header badge + footer can pick it up without an extra round-trip.
 */
export async function aiGenerateReteachWorksheet(
  brief: ReteachBrief,
  source: SourceWorksheetLite,
  extras: Partial<Parameters<typeof aiGenerateWorksheet>[0]> = {},
): Promise<AIWorksheetResult> {
  const callerInstructions = (extras.additionalInstructions || "").trim();
  const additionalInstructions = callerInstructions
    ? `${brief.instructions}\n\n${callerInstructions}`
    : brief.instructions;

  // Conservative default: subject/topic/yearGroup come from the brief
  // (and therefore the source worksheet). Caller can still override.
  const params: Parameters<typeof aiGenerateWorksheet>[0] = {
    subject: extras.subject || brief.subject || "",
    topic: extras.topic || brief.topic || "",
    yearGroup: extras.yearGroup || brief.yearGroup || "",
    ...extras,
    additionalInstructions,
  };

  const result = await aiGenerateWorksheet(params);

  const stampedMetadata = {
    ...((result.metadata as Record<string, unknown>) || {}),
    reteach: {
      sourceWorksheetId: source.id,
      sourceWorksheetTitle: brief.sourceWorksheetTitle,
      misconceptionId: brief.misconceptionId,
      misconceptionText: brief.misconceptionLabel,
      pupilsTargeted: brief.pupilsToTarget,
      pctWrong: brief.pctWrong,
      questionIdx: brief.questionIdx,
      generatedAt: new Date().toISOString(),
    },
  };

  return { ...result, metadata: stampedMetadata } as AIWorksheetResult;
}

// ─── Soft telemetry hook ─────────────────────────────────────────────────────
//
// Mirror the Phase A · PR-4 pattern: emit named events through
// window.__adaptlyTelemetry if it's present, otherwise silently no-op so
// production builds without telemetry stay zero-cost.

export function emitReteachTelemetry(
  event: "reteach.suggested" | "reteach.generated",
  payload: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const sink = (window as unknown as { __adaptlyTelemetry?: (e: string, p: Record<string, unknown>) => void }).__adaptlyTelemetry;
  if (typeof sink !== "function") return;
  try { sink(event, payload); } catch { /* never break the UX */ }
}
