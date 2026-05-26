/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * wrongAnswerAggregator.ts — FEAT-H10.
 *
 * Pure aggregator: reads pupil-attempt rows, groups by
 * (specRef, misconceptionId), and emits a ReteachBrief shape compatible
 * with reteachPlanner.ts. Threshold defaults to 30% wrong-answer rate;
 * configurable via options.
 */

/** Local Phase H multi-gap brief shape. (The existing
 *  reteachPlanner.ReteachBrief is single-misconception; H10 emits a
 *  list of gaps so the planner can iterate through them.) */
export interface ReteachGap {
  specRef: string;
  misconceptionId: string;
  pupilCount: number;
  pupilsTargeted: string[];
  pctWrong: number;
  sourceQuestionIdx?: number;
}

export interface AggregatedReteachBrief {
  sourceWorksheetId: string;
  classSize: number;
  gaps: ReteachGap[];
  generatedAt: string;
}

export interface AttemptForReteach {
  pupilId: string;
  worksheetId: string;
  sectionIndex: number;
  specRef?: string;
  status: "correct" | "partial" | "incorrect";
  misconceptionId?: string;
  attemptedAt: string;
}

export interface AggregateOptions {
  /** Wrong-answer-rate threshold (0..1). Default 0.3. */
  threshold?: number;
  /** Source worksheet id to populate ReteachBrief context. */
  sourceWorksheetId?: string;
  /** Max gaps to surface (defaults to 8). */
  maxGaps?: number;
}

interface GroupBucket {
  specRef: string;
  misconceptionId?: string;
  attempts: AttemptForReteach[];
}

function bucketKey(a: AttemptForReteach): string {
  return `${a.specRef || "(none)"}|${a.misconceptionId || "(none)"}`;
}

export interface AggregateOutput {
  brief: AggregatedReteachBrief | null;
  totalAttempts: number;
  threshold: number;
  warnings: string[];
}

export function aggregateWrongAnswers(
  attempts: AttemptForReteach[],
  options: AggregateOptions = {},
): AggregateOutput {
  const threshold = Math.max(0, Math.min(1, options.threshold ?? 0.3));
  const warnings: string[] = [];
  const safe = (attempts || []).slice();
  if (safe.length === 0) {
    return {
      brief: null,
      totalAttempts: 0,
      threshold,
      warnings: ["No attempts supplied."],
    };
  }
  // Stable input order before grouping (deterministic output).
  safe.sort((a, b) => {
    if (a.pupilId !== b.pupilId) return a.pupilId.localeCompare(b.pupilId);
    if (a.attemptedAt !== b.attemptedAt) return a.attemptedAt.localeCompare(b.attemptedAt);
    return a.sectionIndex - b.sectionIndex;
  });
  const buckets = new Map<string, GroupBucket>();
  for (const a of safe) {
    if (!a.specRef) continue;
    const key = bucketKey(a);
    if (!buckets.has(key)) {
      buckets.set(key, { specRef: a.specRef, misconceptionId: a.misconceptionId, attempts: [] });
    }
    buckets.get(key)!.attempts.push(a);
  }
  const gaps: ReteachGap[] = [];
  for (const bucket of Array.from(buckets.values())) {
    const total = bucket.attempts.length;
    const wrong = bucket.attempts.filter((a) => a.status === "incorrect").length;
    const wrongRate = total === 0 ? 0 : wrong / total;
    if (wrongRate < threshold) continue;
    const pupils = Array.from(new Set(bucket.attempts.filter((a) => a.status === "incorrect").map((a) => a.pupilId)));
    gaps.push({
      specRef: bucket.specRef,
      misconceptionId: bucket.misconceptionId || "",
      pupilCount: pupils.length,
      pupilsTargeted: pupils,
      pctWrong: Math.round(wrongRate * 100),
      sourceQuestionIdx: bucket.attempts[0]?.sectionIndex,
    });
  }
  // Sort by wrong-rate descending; deterministic tie-break by specRef.
  gaps.sort((a, b) => {
    if (b.pctWrong !== a.pctWrong) return b.pctWrong - a.pctWrong;
    return (a.specRef || "").localeCompare(b.specRef || "");
  });
  const trimmed = gaps.slice(0, options.maxGaps ?? 8);
  if (trimmed.length === 0) {
    warnings.push(`No specRefs above the ${Math.round(threshold * 100)}% wrong-answer threshold.`);
    return { brief: null, totalAttempts: safe.length, threshold, warnings };
  }
  const brief: AggregatedReteachBrief = {
    sourceWorksheetId: options.sourceWorksheetId || "",
    classSize: new Set(safe.map((a) => a.pupilId)).size,
    gaps: trimmed,
    generatedAt: new Date().toISOString(),
  };
  return { brief, totalAttempts: safe.length, threshold, warnings };
}
