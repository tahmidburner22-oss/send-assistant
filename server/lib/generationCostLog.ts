/**
 * PD13 — UI surface for cost transparency: server-side cost log
 * persisted to the `generation_cost_log` table (see
 * `server/db/schema.sql`).
 *
 * One row is appended per `/api/ai/generate` call. Cached responses
 * are logged with `estimated_usd = 0` and `cached = 1` so the admin
 * panel can show "saved" totals.
 *
 * Read path: `listGenerationCostsForSchool(schoolId, sinceIso)`
 * returns plain rows that the client-side `aggregateTokenCostRollup`
 * helper turns into the per-day / per-provider breakdown.
 */

import db from "../db/index.js";
import { v4 as uuidv4 } from "uuid";

export interface GenerationCostLogEntry {
  schoolId: string | null | undefined;
  userId: string | null | undefined;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  estimatedUsd: number;
  durationMs: number;
  cacheKey?: string | null;
  cached: boolean;
}

/**
 * Best-effort insert. Never throws — a failed cost-log entry must not
 * break a real generation.
 */
export function logGenerationCost(entry: GenerationCostLogEntry): void {
  try {
    db.prepare(`
      INSERT INTO generation_cost_log (
        id, school_id, user_id, provider, model,
        prompt_tokens, completion_tokens, estimated_usd, duration_ms,
        cache_key, cached
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      entry.schoolId ?? null,
      entry.userId ?? null,
      entry.provider,
      entry.model,
      entry.promptTokens | 0,
      entry.completionTokens | 0,
      entry.estimatedUsd,
      entry.durationMs | 0,
      entry.cacheKey ?? null,
      entry.cached ? 1 : 0,
    );
  } catch (e) {
    console.warn("[generationCostLog] insert failed:", (e as Error)?.message);
  }
}

export interface GenerationCostRow {
  occurredAt: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  estimatedUsd: number;
  durationMs: number;
  cached: boolean;
}

/**
 * Return every cost-log row for a school since `sinceIso` (UTC).
 * Caller is expected to feed these into
 * `aggregateTokenCostRollup` from
 * `client/src/lib/telemetryAggregators` for the admin panel.
 */
export async function listGenerationCostsForSchool(
  schoolId: string,
  sinceIso: string,
): Promise<GenerationCostRow[]> {
  try {
    const rows = await db.prepare(`
      SELECT occurred_at as occurredAt, provider, model,
             prompt_tokens as promptTokens,
             completion_tokens as completionTokens,
             estimated_usd as estimatedUsd,
             duration_ms as durationMs,
             cached
      FROM generation_cost_log
      WHERE school_id = ? AND occurred_at >= ?
      ORDER BY occurred_at DESC
      LIMIT 5000
    `).all(schoolId, sinceIso) as Array<{
      occurredAt: string;
      provider: string;
      model: string;
      promptTokens: number;
      completionTokens: number;
      estimatedUsd: number;
      durationMs: number;
      cached: number;
    }>;
    return rows.map((r) => ({
      occurredAt: r.occurredAt,
      provider: r.provider,
      model: r.model,
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
      estimatedUsd: r.estimatedUsd,
      durationMs: r.durationMs,
      cached: r.cached === 1,
    }));
  } catch (e) {
    console.warn("[generationCostLog] read failed:", (e as Error)?.message);
    return [];
  }
}

/**
 * Compact roll-up shape consumed directly by the admin panel section
 * (so the panel doesn't have to re-import telemetryAggregators). Last
 * 30 days, totals + savings (sum of estimated_usd that would have been
 * spent without cache hits — approximated by mirroring each cached
 * row's would-be cost from the most recent non-cached row with the
 * same provider).
 */
export interface SchoolCostRollup {
  windowDays: number;
  totalCalls: number;
  cachedCalls: number;
  totalSpendUsd: number;
  estimatedSavingsUsd: number;
  byProvider: Array<{ provider: string; calls: number; spendUsd: number }>;
}

export async function rollupSchoolCosts(
  schoolId: string,
  windowDays: number = 30,
): Promise<SchoolCostRollup> {
  const sinceMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const sinceIso = new Date(sinceMs).toISOString();
  const rows = await listGenerationCostsForSchool(schoolId, sinceIso);
  let totalSpend = 0;
  let cachedCalls = 0;
  // Average per-call cost per provider, used to impute would-have-cost
  // for cached rows.
  const providerSums: Record<string, { spend: number; nonCached: number; calls: number }> = Object.create(null);
  for (const r of rows) {
    if (!providerSums[r.provider]) {
      providerSums[r.provider] = { spend: 0, nonCached: 0, calls: 0 };
    }
    providerSums[r.provider].calls += 1;
    if (r.cached) {
      cachedCalls += 1;
    } else {
      providerSums[r.provider].spend += r.estimatedUsd;
      providerSums[r.provider].nonCached += 1;
      totalSpend += r.estimatedUsd;
    }
  }
  let savings = 0;
  for (const r of rows) {
    if (!r.cached) continue;
    const ps = providerSums[r.provider];
    if (ps && ps.nonCached > 0) {
      savings += ps.spend / ps.nonCached;
    }
  }
  const byProvider = Object.entries(providerSums).map(([provider, v]) => ({
    provider,
    calls: v.calls,
    spendUsd: v.spend,
  }));
  return {
    windowDays,
    totalCalls: rows.length,
    cachedCalls,
    totalSpendUsd: totalSpend,
    estimatedSavingsUsd: savings,
    byProvider,
  };
}
