/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * predictedPaperBuilder.ts — FEAT-G6.
 *
 * UI surface over PR-19's pastPaperFrequencyAnchor. Inverts the
 * frequency weighting so the assembly biases toward topics that are
 * UNDER-represented in the supplied corpus of recent past papers.
 *
 * Pure dispatcher — assembly engine is supplied by the caller (an
 * adapter over createExamPaperBuilder).
 */

import {
  runPastPaperFrequencyAudit,
  type PastPaperQuestion,
} from "./pastPaperFrequencyAnchor";

export interface PredictedPaperInput {
  /** Topics under consideration for the predicted paper. */
  candidateTopics: string[];
  /** Past-paper corpus to anchor against. */
  anchorCorpus: PastPaperQuestion[];
  /** 0 = neutral, 0.5 = moderate inversion, 1 = full inversion. */
  bias: number;
  /** Total mark budget (defaults to 80). */
  markBudget?: number;
  /** Per-topic floor: every requested topic gets ≥1 question (default true). */
  perTopicFloor?: boolean;
  /** Seed for deterministic output. */
  seed?: number;
}

export interface TopicWeight {
  topic: string;
  /** Original frequency in the anchor corpus (0..1). */
  rawFrequency: number;
  /** Bias-adjusted weight used by the assembly engine. */
  weight: number;
  /** True when this topic is in the corpus's top-quartile-frequency band. */
  isTopQuartile: boolean;
}

export interface PredictedPaperOutput {
  weights: TopicWeight[];
  excludedTopics: string[];
  warnings: string[];
  /** Bias actually applied (clamped to [0,1]). */
  appliedBias: number;
}

function quartile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.max(0, Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * q)));
  return sortedValues[idx];
}

export function computeTopicWeights(input: PredictedPaperInput): PredictedPaperOutput {
  const warnings: string[] = [];
  const bias = Math.max(0, Math.min(1, input.bias ?? 0));
  const candidateTopics = (input.candidateTopics || []).filter(Boolean);
  if (candidateTopics.length === 0) {
    return { weights: [], excludedTopics: [], warnings: ["No candidate topics supplied."], appliedBias: bias };
  }
  if (!input.anchorCorpus || input.anchorCorpus.length === 0) {
    warnings.push("No anchor corpus supplied — falling back to neutral frequency.");
    return {
      weights: candidateTopics.map((topic) => ({
        topic,
        rawFrequency: 1 / candidateTopics.length,
        weight: 1,
        isTopQuartile: false,
      })),
      excludedTopics: [],
      warnings,
      appliedBias: 0,
    };
  }
  // Run the existing PR-19 audit to get raw frequency.
  const audit = runPastPaperFrequencyAudit(candidateTopics, input.anchorCorpus, {});
  const freqByTopic = new Map<string, number>();
  for (const row of audit.rows) {
    freqByTopic.set(row.topic, row.frequency);
  }
  const sortedFreq = [...freqByTopic.values()].sort((a, b) => a - b);
  const top75 = quartile(sortedFreq, 0.75);
  const excludedTopics: string[] = [];
  const weights: TopicWeight[] = [];
  for (const topic of candidateTopics) {
    const rawF = freqByTopic.get(topic) ?? 0;
    const isTopQ = rawF >= top75 && top75 > 0;
    let weight: number;
    if (bias <= 0) {
      weight = 1;
    } else if (bias >= 1) {
      // Full inversion: exclude top quartile, weight bottom quartile 2x.
      if (isTopQ) {
        weight = input.perTopicFloor !== false ? 1 : 0;
        if (input.perTopicFloor === false) excludedTopics.push(topic);
      } else {
        const bot25 = quartile(sortedFreq, 0.25);
        weight = rawF <= bot25 ? 2 : 1.5;
      }
    } else {
      // Linear blend: weight = (1 - bias) * 1 + bias * inverse
      const inverse = rawF > 0 ? Math.min(2, 1 / Math.max(rawF, 0.05)) : 1.5;
      weight = (1 - bias) * 1 + bias * inverse;
    }
    weights.push({ topic, rawFrequency: rawF, weight, isTopQuartile: isTopQ });
  }
  if (input.perTopicFloor === false && excludedTopics.length > 0) {
    warnings.push(`Bias=${bias.toFixed(2)} excluded ${excludedTopics.length} topic(s).`);
  }
  return { weights, excludedTopics, warnings, appliedBias: bias };
}

/**
 * Convenience wrapper: returns a topic order ready to feed into the
 * mark-band assembly engine. Topics are repeated by weight (rounded
 * to integer copies) and deterministically shuffled by the supplied
 * seed.
 */
export function topicAssemblyOrder(out: PredictedPaperOutput, seed = 1): string[] {
  const ordered: string[] = [];
  for (const w of out.weights) {
    const copies = Math.max(0, Math.round(w.weight));
    for (let i = 0; i < copies; i++) ordered.push(w.topic);
  }
  // Deterministic shuffle via xor-shift seeded over indexes.
  let s = seed >>> 0 || 1;
  for (let i = ordered.length - 1; i > 0; i--) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const j = Math.abs(s) % (i + 1);
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }
  return ordered;
}
