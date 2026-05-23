/**
 * longitudinalBloomAudit.ts — PR-19 / audit item #34.
 *
 * Per-pupil longitudinal Bloom-ramp audit. Pure, deterministic, no LLM.
 *
 * The single-worksheet `bloomProgressionAudit` (PR-14) checks that
 * questions go from low Bloom (recall, understand) to high Bloom
 * (analyse, evaluate, create) within ONE sheet. This module is the
 * cross-worksheet companion: given a sequence of worksheets a single
 * pupil has worked through over time, it checks that the Bloom
 * distribution shifts up the taxonomy as the year progresses — i.e.
 * the pupil isn't being kept on recall-heavy sheets indefinitely.
 *
 * Inputs are kept narrow + injected so the audit is testable without
 * coupling to attempt-log storage. Production callers will compose
 * with `attemptLog.ts` to map (pupilId → ordered worksheets).
 */

const BLOOM_LEVELS = ["remember", "understand", "apply", "analyse", "evaluate", "create"] as const;
export type BloomLevel = typeof BLOOM_LEVELS[number];

const BLOOM_RANK: Record<BloomLevel, number> = {
  remember: 1,
  understand: 2,
  apply: 3,
  analyse: 4,
  evaluate: 5,
  create: 6,
};

/** Aliases used in coverageMap.bloomDistribution. */
const BLOOM_ALIASES: Record<string, BloomLevel> = {
  recall: "remember",
  remember: "remember",
  understanding: "understand",
  understand: "understand",
  application: "apply",
  apply: "apply",
  analyse: "analyse",
  analyze: "analyse",
  challenge: "evaluate",
  evaluate: "evaluate",
  create: "create",
};

export interface LongitudinalWorksheet {
  /** ISO timestamp the pupil completed (or was assigned) the sheet. */
  completedAt?: string;
  metadata?: {
    subject?: string;
    topic?: string;
    coverageMap?: { bloomDistribution?: Record<string, number> };
  } & Record<string, unknown>;
  sections?: Array<{ bloomLevel?: string; [k: string]: unknown }>;
}

export interface BloomRampPoint {
  index: number;
  /** Weighted average Bloom rank across this worksheet (1..6). */
  averageRank: number;
  /** Highest Bloom rank touched on this worksheet. */
  topRank: number;
  /** Total questions sampled. */
  questionCount: number;
}

export interface LongitudinalBloomReport {
  pupilId: string;
  points: BloomRampPoint[];
  /**
   * The slope of a simple linear regression averageRank ~ index,
   * normalised by the number of points. Positive slope = pupil is
   * climbing the taxonomy; flat / negative = ramp is stalled.
   */
  rampSlope: number;
  /** True when the slope is negative or essentially flat AND > 5
   *  worksheets have been observed (early-year noise filtered out). */
  rampStalled: boolean;
  warnings: string[];
}

/** Read Bloom rank for a single worksheet, preferring the per-section
 *  bloomLevel field, falling back to the coverageMap distribution. */
function summariseWorksheetBloom(ws: LongitudinalWorksheet): { avg: number; top: number; count: number } {
  const ranks: number[] = [];
  for (const s of ws.sections || []) {
    const bl = String(s.bloomLevel || "").toLowerCase();
    const canon = BLOOM_ALIASES[bl];
    if (canon) ranks.push(BLOOM_RANK[canon]);
  }
  if (ranks.length === 0) {
    const dist = ws.metadata?.coverageMap?.bloomDistribution || {};
    for (const [k, n] of Object.entries(dist)) {
      const canon = BLOOM_ALIASES[k.toLowerCase()];
      if (!canon) continue;
      const count = Number(n) || 0;
      for (let i = 0; i < count; i++) ranks.push(BLOOM_RANK[canon]);
    }
  }
  if (ranks.length === 0) return { avg: 0, top: 0, count: 0 };
  const avg = ranks.reduce((a, b) => a + b, 0) / ranks.length;
  const top = Math.max(...ranks);
  return { avg: Number(avg.toFixed(3)), top, count: ranks.length };
}

/**
 * Compute the longitudinal Bloom ramp for one pupil. Worksheets
 * should be supplied in chronological order; the runner does NOT
 * sort them (it cannot — `completedAt` is optional).
 */
export function runLongitudinalBloomAudit(
  pupilId: string,
  orderedWorksheets: LongitudinalWorksheet[],
): LongitudinalBloomReport {
  const points: BloomRampPoint[] = [];
  for (let i = 0; i < orderedWorksheets.length; i++) {
    const s = summariseWorksheetBloom(orderedWorksheets[i]);
    if (s.count === 0) continue;
    points.push({
      index: i,
      averageRank: s.avg,
      topRank: s.top,
      questionCount: s.count,
    });
  }

  // Simple linear regression slope of averageRank ~ index. Returns 0
  // when fewer than two usable points. This is the cheapest signal
  // that captures "is the ramp going up?".
  let slope = 0;
  if (points.length >= 2) {
    const n = points.length;
    const meanX = points.reduce((a, p) => a + p.index, 0) / n;
    const meanY = points.reduce((a, p) => a + p.averageRank, 0) / n;
    let num = 0;
    let den = 0;
    for (const p of points) {
      const dx = p.index - meanX;
      num += dx * (p.averageRank - meanY);
      den += dx * dx;
    }
    slope = den > 0 ? Number((num / den).toFixed(4)) : 0;
  }

  const warnings: string[] = [];
  const rampStalled = points.length >= 5 && slope <= 0.05;
  if (rampStalled) {
    warnings.push(
      `[Phase PR-19 — Longitudinal Bloom] Pupil ${pupilId}: ramp appears stalled across ${points.length} worksheets (slope ${slope.toFixed(3)}).`,
    );
  }

  return { pupilId, points, rampSlope: slope, rampStalled, warnings };
}

/**
 * Worksheet-level slice — no-op by default (this audit is corpus-only).
 * Returned to satisfy the registry adapter shape so callers can wire
 * it into the chain conservatively.
 */
export function enforceLongitudinalBloom(
  ws: LongitudinalWorksheet,
): { worksheet: LongitudinalWorksheet; warnings: string[] } {
  return { worksheet: ws, warnings: [] };
}
