/**
 * telemetryAggregators.ts — PR-27 / audit items #42, #70, #71.
 *
 * Pure aggregators for the admin telemetry dashboards. Side-effect
 * free — every function takes raw events as input and returns a
 * shape-stable summary. Production callers wire these to the
 * telemetry log stream produced by `server/lib/telemetry.ts`.
 *
 * Three dashboards:
 *   - Validator-firing histogram (#70)
 *   - Per-topic regeneration heat-map (#71)
 *   - Token + cost roll-up (#42)
 */

// ─── Validator-firing histogram ──────────────────────────────────────────────

export interface ValidatorFiringEvent {
  /** Stable kebab-case validator name from the registry. */
  validatorName: string;
  /** When the validator fired. */
  occurredAt: string;
  /** Severity bucket (p0/p1/p2). */
  severity?: "p0" | "p1" | "p2";
  /** Optional worksheet id for cross-reference. */
  worksheetId?: string;
}

export interface ValidatorFiringHistogram {
  /** Total events seen. */
  totalFirings: number;
  /** Per-validator counts, sorted descending. */
  rows: Array<{
    validatorName: string;
    count: number;
    severity?: "p0" | "p1" | "p2";
    pctOfTotal: number;
  }>;
  /** Per-severity totals. */
  severityTotals: Record<"p0" | "p1" | "p2", number>;
  windowStart?: string;
  windowEnd?: string;
}

export function aggregateValidatorFirings(events: ValidatorFiringEvent[]): ValidatorFiringHistogram {
  const counts: Record<string, { count: number; severity?: "p0" | "p1" | "p2" }> = Object.create(null);
  const severityTotals = { p0: 0, p1: 0, p2: 0 } as Record<"p0" | "p1" | "p2", number>;
  let earliest: string | undefined;
  let latest: string | undefined;
  for (const e of events) {
    const key = String(e.validatorName || "").trim();
    if (!key) continue;
    if (!counts[key]) counts[key] = { count: 0, severity: e.severity };
    counts[key].count += 1;
    if (e.severity) severityTotals[e.severity] += 1;
    if (!earliest || e.occurredAt < earliest) earliest = e.occurredAt;
    if (!latest || e.occurredAt > latest) latest = e.occurredAt;
  }
  const total = events.length;
  const rows = Object.entries(counts)
    .map(([validatorName, { count, severity }]) => ({
      validatorName,
      count,
      severity,
      pctOfTotal: total > 0 ? Number((count / total).toFixed(4)) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.validatorName.localeCompare(b.validatorName));
  return {
    totalFirings: total,
    rows,
    severityTotals,
    windowStart: earliest,
    windowEnd: latest,
  };
}

// ─── Regeneration heat-map ───────────────────────────────────────────────────

export interface RegenerationEvent {
  /** Original worksheet id. */
  worksheetId: string;
  /** Topic key, lower-case. */
  topic: string;
  /** Subject key, lower-case. */
  subject?: string;
  /** ISO timestamp of the regeneration. */
  occurredAt: string;
  /** Section that was regenerated (e.g. "q-extended", "mark-scheme"). */
  sectionType?: string;
}

export interface RegenerationHeatmapRow {
  topic: string;
  subject?: string;
  count: number;
  /** Most-regenerated section type for this topic. */
  topSectionType?: string;
}

export interface RegenerationHeatmap {
  totalRegenerations: number;
  rows: RegenerationHeatmapRow[];
}

export function aggregateRegenerationHeatmap(events: RegenerationEvent[]): RegenerationHeatmap {
  const buckets: Record<string, { count: number; subject?: string; sectionTypes: Record<string, number> }> = Object.create(null);
  for (const e of events) {
    const t = String(e.topic || "").toLowerCase().trim();
    if (!t) continue;
    if (!buckets[t]) buckets[t] = { count: 0, subject: e.subject?.toLowerCase(), sectionTypes: {} };
    buckets[t].count += 1;
    if (e.sectionType) {
      buckets[t].sectionTypes[e.sectionType] = (buckets[t].sectionTypes[e.sectionType] || 0) + 1;
    }
  }
  const rows: RegenerationHeatmapRow[] = Object.entries(buckets)
    .map(([topic, b]) => {
      const top = Object.entries(b.sectionTypes).sort((a, c) => c[1] - a[1])[0];
      return {
        topic,
        subject: b.subject,
        count: b.count,
        topSectionType: top ? top[0] : undefined,
      };
    })
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
  return { totalRegenerations: events.length, rows };
}

// ─── Token + cost roll-up ────────────────────────────────────────────────────

export interface TokenCostEvent {
  /** ISO date (UTC) — used as the bucket key. */
  occurredAt: string;
  promptTokens: number;
  completionTokens: number;
  estimatedUsd: number;
  provider?: string;
  model?: string;
}

export interface TokenCostRollupBucket {
  /** YYYY-MM-DD bucket. */
  day: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedUsd: number;
  callCount: number;
}

export interface TokenCostRollup {
  totalCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalEstimatedUsd: number;
  byDay: TokenCostRollupBucket[];
  byProvider: Array<{ provider: string; calls: number; estimatedUsd: number }>;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function aggregateTokenCostRollup(events: TokenCostEvent[]): TokenCostRollup {
  const dayMap: Record<string, TokenCostRollupBucket> = Object.create(null);
  const providerMap: Record<string, { calls: number; estimatedUsd: number }> = Object.create(null);
  let totalCalls = 0;
  let totalPrompt = 0;
  let totalCompletion = 0;
  let totalUsd = 0;
  for (const e of events) {
    const day = dayKey(e.occurredAt);
    if (!dayMap[day]) {
      dayMap[day] = {
        day,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedUsd: 0,
        callCount: 0,
      };
    }
    dayMap[day].promptTokens += Math.max(0, e.promptTokens || 0);
    dayMap[day].completionTokens += Math.max(0, e.completionTokens || 0);
    dayMap[day].totalTokens += Math.max(0, (e.promptTokens || 0) + (e.completionTokens || 0));
    dayMap[day].estimatedUsd += Math.max(0, e.estimatedUsd || 0);
    dayMap[day].callCount += 1;
    const provider = String(e.provider || "unknown").toLowerCase();
    if (!providerMap[provider]) providerMap[provider] = { calls: 0, estimatedUsd: 0 };
    providerMap[provider].calls += 1;
    providerMap[provider].estimatedUsd += Math.max(0, e.estimatedUsd || 0);
    totalCalls += 1;
    totalPrompt += Math.max(0, e.promptTokens || 0);
    totalCompletion += Math.max(0, e.completionTokens || 0);
    totalUsd += Math.max(0, e.estimatedUsd || 0);
  }
  const byDay = Object.values(dayMap).sort((a, b) => a.day.localeCompare(b.day));
  const byProvider = Object.entries(providerMap)
    .map(([provider, m]) => ({ provider, calls: m.calls, estimatedUsd: Number(m.estimatedUsd.toFixed(4)) }))
    .sort((a, b) => b.estimatedUsd - a.estimatedUsd);
  return {
    totalCalls,
    totalPromptTokens: totalPrompt,
    totalCompletionTokens: totalCompletion,
    totalEstimatedUsd: Number(totalUsd.toFixed(4)),
    byDay: byDay.map((d) => ({ ...d, estimatedUsd: Number(d.estimatedUsd.toFixed(4)) })),
    byProvider,
  };
}
