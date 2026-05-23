/**
 * pastPaperFrequencyAnchor.ts — PR-19 / audit item #38.
 *
 * Past-paper question-frequency anchor. Pure, deterministic, no LLM.
 *
 * UK exam boards repeat the same topics every couple of years (e.g.
 * "interpreting a graph of motion" appears on >40% of AQA Physics P1
 * papers). This audit takes a list of past-paper question stems
 * tagged by topic and reports per-topic frequency so the worksheet
 * generator can prioritise high-frequency topics in revision sheets.
 *
 * Inputs are kept narrow + injected so the audit is testable without
 * coupling to the past-paper-questions data module. Production
 * callers compose with `pastPaperQuestions.ts`.
 */

export interface PastPaperQuestion {
  /** Stable id, e.g. "aqa-2022-p1-q3". */
  id: string;
  /** Topic key matched against worksheet `metadata.topic`. Lowercase. */
  topic: string;
  /** Year the paper was sat. */
  year: number;
  /** Awarding body, lowercased ("aqa" | "edexcel" | "ocr"). */
  examBoard?: string;
  /** Marks awarded. */
  marks?: number;
}

export interface FrequencyAnchorRow {
  topic: string;
  occurrenceCount: number;
  /** Years the topic has appeared on. */
  years: number[];
  /** Fraction of corpus covering this topic, 0..1. */
  frequencyRatio: number;
  /** True when freq >= 0.20 (top quintile by default). */
  highFrequency: boolean;
}

export interface FrequencyAnchorReport {
  rows: FrequencyAnchorRow[];
  totalQuestions: number;
  topNTopics: string[];
  warnings: string[];
}

export interface FrequencyAnchorOptions {
  /** Top-N topics to surface. Default 5. */
  topN?: number;
  /** Frequency threshold for `highFrequency`. Default 0.20. */
  highFrequencyThreshold?: number;
}

/**
 * Audit a past-paper corpus and return per-topic frequency rows
 * sorted descending by occurrence count.
 */
export function runPastPaperFrequencyAudit(
  corpus: PastPaperQuestion[],
  options: FrequencyAnchorOptions = {},
): FrequencyAnchorReport {
  const topN = options.topN ?? 5;
  const threshold = options.highFrequencyThreshold ?? 0.2;

  const counts: Record<string, { count: number; years: Set<number> }> = Object.create(null);
  for (const q of corpus) {
    const t = q.topic.trim().toLowerCase();
    if (!t) continue;
    if (!counts[t]) counts[t] = { count: 0, years: new Set() };
    counts[t].count += 1;
    if (Number.isFinite(q.year)) counts[t].years.add(q.year);
  }

  const total = corpus.length;
  const rows: FrequencyAnchorRow[] = Object.entries(counts)
    .map(([topic, { count, years }]) => ({
      topic,
      occurrenceCount: count,
      years: Array.from(years).sort((a, b) => a - b),
      frequencyRatio: total > 0 ? Number((count / total).toFixed(3)) : 0,
      highFrequency: total > 0 && count / total >= threshold,
    }))
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.topic.localeCompare(b.topic));

  const topNTopics = rows.slice(0, topN).map((r) => r.topic);

  const warnings: string[] = [];
  if (rows.length === 0 && total > 0) {
    warnings.push(
      `[Phase PR-19 — Past-paper frequency] Corpus has ${total} questions but none carried a topic tag.`,
    );
  }

  return { rows, totalQuestions: total, topNTopics, warnings };
}

/**
 * Worksheet-level slice. Warns when a worksheet's topic is NOT in the
 * top-N high-frequency list — pure recommendation, never blocking.
 *
 * Conservative: requires both `topN` AND a corpus-derived report to be
 * passed in. When called without options, no-ops.
 */
export function enforcePastPaperFrequencyAnchor(
  ws: { metadata?: { topic?: string } },
  options: { topNTopics?: string[] } = {},
): { worksheet: typeof ws; warnings: string[] } {
  const topic = String(ws.metadata?.topic || "").trim().toLowerCase();
  const top = options.topNTopics || [];
  const warnings: string[] = [];
  if (topic && top.length > 0 && !top.includes(topic)) {
    // Advisory only — many sheets correctly cover lower-frequency
    // topics. Caller decides whether to surface the suggestion.
    warnings.push(
      `[Phase PR-19 — Past-paper frequency] Topic "${topic}" not in current top-${top.length} (${top.join(", ")}).`,
    );
  }
  return { worksheet: ws, warnings };
}
