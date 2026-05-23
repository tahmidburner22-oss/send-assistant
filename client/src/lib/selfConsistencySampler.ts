/**
 * selfConsistencySampler.ts — PR-20 / audit item #47.
 *
 * Self-consistency sampling on extended-answer questions. Pure,
 * deterministic helper. Ships dark behind
 * `PROMPT_SELF_CONSISTENCY_ENABLED=true`.
 *
 * Background: a single LLM round-trip on a 6-mark extended-answer
 * question often produces a confident-but-incomplete mark-scheme. The
 * standard remedy is to sample N different completions and
 * "self-consistency vote" on the answer key. This module provides the
 * voting + reconciliation helpers; the sampler itself (the LLM
 * round-trip) lives in `ai.ts` and reads from this module to decide
 * how many samples to take.
 */

export interface ExtendedAnswerSample {
  /** The candidate answer key text. */
  answerKey: string;
  /** Optional list of marking points the sample identified. */
  markingPoints?: string[];
  /** ISO timestamp the sample was generated. */
  sampledAt?: string;
}

export interface ConsistencyResult {
  consensusKey: string;
  consensusPoints: string[];
  /** 0..1 — fraction of samples that match the consensus. */
  confidence: number;
  /** Per-marking-point hit count. */
  pointFrequencies: Array<{ point: string; count: number; ratio: number }>;
}

const DEFAULT_SAMPLE_COUNT = 3;
const MAX_SAMPLE_COUNT = 5;

/**
 * Heuristic: which question types trigger self-consistency? Only
 * extended-answer questions worth >= 5 marks (because anything
 * smaller finishes in one accurate sample with high probability).
 */
export function shouldSelfSample(question: { type?: string; marks?: number }): boolean {
  const type = String(question.type || "").toLowerCase();
  if (!/^q[-_]?extended/.test(type)) return false;
  return Number(question.marks || 0) >= 5;
}

/** Decide how many samples to draw based on the marks tariff. */
export function recommendedSampleCount(marks: number | undefined): number {
  const n = Math.max(0, Math.floor(Number(marks || 0)));
  if (n <= 4) return 1;
  if (n <= 6) return DEFAULT_SAMPLE_COUNT;
  if (n <= 8) return 4;
  return MAX_SAMPLE_COUNT;
}

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Reconcile a list of samples into a single consensus answer key
 * + marking points.
 *
 * Algorithm:
 *   - Concatenate every marking point across samples.
 *   - For each unique normalised point, count appearances; the
 *     consensus list is every point appearing in >= 50% of samples.
 *   - Confidence is the average pairwise Jaccard similarity of the
 *     answer-key texts.
 *
 * Pure / deterministic.
 */
export function reconcileSelfConsistency(samples: ExtendedAnswerSample[]): ConsistencyResult {
  if (samples.length === 0) {
    return { consensusKey: "", consensusPoints: [], confidence: 0, pointFrequencies: [] };
  }
  const n = samples.length;
  const pointCounts: Record<string, { display: string; count: number }> = Object.create(null);
  for (const s of samples) {
    const seen = new Set<string>();
    for (const p of s.markingPoints || []) {
      const norm = p.trim().toLowerCase();
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      if (!pointCounts[norm]) pointCounts[norm] = { display: p.trim(), count: 0 };
      pointCounts[norm].count += 1;
    }
  }
  const pointFrequencies = Object.values(pointCounts)
    .map((e) => ({ point: e.display, count: e.count, ratio: Number((e.count / n).toFixed(3)) }))
    .sort((a, b) => b.count - a.count);
  const consensusPoints = pointFrequencies.filter((e) => e.ratio >= 0.5).map((e) => e.point);

  // Pick the longest answer key from the samples as the consensus
  // text — it tends to be the most fully-elaborated. A future PR can
  // graduate to actual LLM-judge selection.
  const consensusKey = samples
    .map((s) => s.answerKey || "")
    .reduce((best, cur) => (cur.length > best.length ? cur : best), "");

  // Confidence — average pairwise Jaccard.
  const tokenSets = samples.map((s) => tokenSet(s.answerKey || ""));
  let pairs = 0;
  let sum = 0;
  for (let i = 0; i < tokenSets.length; i++) {
    for (let j = i + 1; j < tokenSets.length; j++) {
      sum += jaccard(tokenSets[i], tokenSets[j]);
      pairs += 1;
    }
  }
  const confidence = pairs > 0 ? Number((sum / pairs).toFixed(3)) : 1;

  return { consensusKey, consensusPoints, confidence, pointFrequencies };
}
