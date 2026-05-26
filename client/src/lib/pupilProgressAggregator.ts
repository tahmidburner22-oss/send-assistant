/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * pupilProgressAggregator.ts — FEAT-H1.
 *
 * Pure aggregator over pupil_attempt rows. Produces per-pupil,
 * per-class, and per-specRef summaries. Stable / deterministic for a
 * given input set. Surface lives in PupilProgressDashboard.tsx.
 */

export type AttemptStatus = "correct" | "partial" | "incorrect";

export interface PupilAttemptRow {
  pupilId: string;
  worksheetId: string;
  sectionIndex: number;
  specRef?: string;
  status: AttemptStatus;
  attemptedAt: string;
}

export interface PerSpecRefSummary {
  specRef: string;
  total: number;
  correct: number;
  partial: number;
  incorrect: number;
  accuracyPct: number;
  /** "green" ≥80, "amber" 50-79, "red" <50, "grey" <3 attempts. */
  band: "green" | "amber" | "red" | "grey";
}

export interface PerPupilSummary {
  pupilId: string;
  total: number;
  correct: number;
  partial: number;
  incorrect: number;
  accuracyPct: number;
  perSpecRef: PerSpecRefSummary[];
}

export interface PerClassSummary {
  totalAttempts: number;
  totalPupils: number;
  classAccuracyPct: number;
  topWeakestSpecRefs: PerSpecRefSummary[];
  topStrongestSpecRefs: PerSpecRefSummary[];
}

export interface ProgressAggregate {
  perPupil: PerPupilSummary[];
  perClass: PerClassSummary;
  perSpecRef: PerSpecRefSummary[];
}

function bandFor(s: PerSpecRefSummary): "green" | "amber" | "red" | "grey" {
  if (s.total < 3) return "grey";
  if (s.accuracyPct >= 80) return "green";
  if (s.accuracyPct >= 50) return "amber";
  return "red";
}

function rowKey(specRef: string): string {
  return specRef || "(unknown)";
}

function summariseSpecRefRows(specRef: string, rows: PupilAttemptRow[]): PerSpecRefSummary {
  let correct = 0;
  let partial = 0;
  let incorrect = 0;
  for (const r of rows) {
    if (r.status === "correct") correct += 1;
    else if (r.status === "partial") partial += 1;
    else incorrect += 1;
  }
  const total = rows.length;
  const score = correct + partial * 0.5;
  const accuracyPct = total === 0 ? 0 : Math.round((score / total) * 100);
  const result: PerSpecRefSummary = { specRef, total, correct, partial, incorrect, accuracyPct, band: "grey" };
  result.band = bandFor(result);
  return result;
}

export function aggregatePupilProgress(rows: PupilAttemptRow[]): ProgressAggregate {
  const safe = (rows || []).slice();
  // Stable ordering: lex sort by pupilId, attemptedAt, sectionIndex.
  safe.sort((a, b) => {
    if (a.pupilId !== b.pupilId) return a.pupilId.localeCompare(b.pupilId);
    if (a.attemptedAt !== b.attemptedAt) return a.attemptedAt.localeCompare(b.attemptedAt);
    return a.sectionIndex - b.sectionIndex;
  });

  // Per-specRef across the cohort.
  const perSpecRefMap = new Map<string, PupilAttemptRow[]>();
  for (const r of safe) {
    const k = rowKey(r.specRef || "");
    if (!perSpecRefMap.has(k)) perSpecRefMap.set(k, []);
    perSpecRefMap.get(k)!.push(r);
  }
  const perSpecRef: PerSpecRefSummary[] = [];
  for (const [k, group] of Array.from(perSpecRefMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    perSpecRef.push(summariseSpecRefRows(k, group));
  }

  // Per-pupil.
  const pupilMap = new Map<string, PupilAttemptRow[]>();
  for (const r of safe) {
    if (!pupilMap.has(r.pupilId)) pupilMap.set(r.pupilId, []);
    pupilMap.get(r.pupilId)!.push(r);
  }
  const perPupil: PerPupilSummary[] = [];
  for (const [pupilId, group] of Array.from(pupilMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const bySpec = new Map<string, PupilAttemptRow[]>();
    for (const r of group) {
      const k = rowKey(r.specRef || "");
      if (!bySpec.has(k)) bySpec.set(k, []);
      bySpec.get(k)!.push(r);
    }
    const specSummaries: PerSpecRefSummary[] = [];
    for (const [k, gg] of Array.from(bySpec.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      specSummaries.push(summariseSpecRefRows(k, gg));
    }
    let correct = 0;
    let partial = 0;
    let incorrect = 0;
    for (const r of group) {
      if (r.status === "correct") correct += 1;
      else if (r.status === "partial") partial += 1;
      else incorrect += 1;
    }
    const score = correct + partial * 0.5;
    const accuracyPct = group.length === 0 ? 0 : Math.round((score / group.length) * 100);
    perPupil.push({
      pupilId,
      total: group.length,
      correct,
      partial,
      incorrect,
      accuracyPct,
      perSpecRef: specSummaries,
    });
  }

  // Per-class roll-up.
  const totalAttempts = safe.length;
  const totalPupils = pupilMap.size;
  const classScore = perPupil.reduce(
    (s, p) => s + (p.correct + p.partial * 0.5),
    0,
  );
  const classAccuracyPct = totalAttempts === 0 ? 0 : Math.round((classScore / totalAttempts) * 100);
  const eligibleSpecRefs = perSpecRef.filter((s) => s.total >= 3);
  const sortedByAccuracy = eligibleSpecRefs.slice().sort((a, b) => a.accuracyPct - b.accuracyPct);
  return {
    perPupil,
    perClass: {
      totalAttempts,
      totalPupils,
      classAccuracyPct,
      topWeakestSpecRefs: sortedByAccuracy.slice(0, 3),
      topStrongestSpecRefs: sortedByAccuracy.slice(-3).reverse(),
    },
    perSpecRef,
  };
}
