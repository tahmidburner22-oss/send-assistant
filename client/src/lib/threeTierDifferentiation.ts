/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * threeTierDifferentiation.ts — FEAT-G9.
 *
 * Wraps a caller-supplied differentiate function (typically
 * aiDifferentiateExistingWorksheet) with three concurrent calls
 * (LA / MA / HA). Promise.allSettled so a single failure doesn't
 * block the others. Stamps `metadata.differentiationGroup` so HoDs
 * can find the three saved versions as a set.
 */

export type DifferentiationTier = "LA" | "MA" | "HA";

export interface ThreeTierInput<TWorksheet> {
  worksheet: TWorksheet;
  /** Differentiator. Receives the worksheet + tier label. */
  differentiate: (worksheet: TWorksheet, tier: DifferentiationTier) => Promise<TWorksheet>;
  /** Group id (defaults to a deterministic hash from the worksheet). */
  groupId?: string;
}

export interface TierResult<TWorksheet> {
  tier: DifferentiationTier;
  status: "fulfilled" | "rejected";
  worksheet?: TWorksheet;
  error?: string;
}

export interface ThreeTierOutput<TWorksheet> {
  groupId: string;
  results: TierResult<TWorksheet>[];
  successCount: number;
  failCount: number;
}

function deriveGroupId(): string {
  return "diff-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

export async function runThreeTierDifferentiation<TWorksheet>(
  input: ThreeTierInput<TWorksheet>,
): Promise<ThreeTierOutput<TWorksheet>> {
  const groupId = input.groupId || deriveGroupId();
  const tiers: DifferentiationTier[] = ["LA", "MA", "HA"];
  const promises = tiers.map((tier) => input.differentiate(input.worksheet, tier));
  const settled = await Promise.allSettled(promises);
  const results: TierResult<TWorksheet>[] = settled.map((r, i) => {
    const tier = tiers[i];
    if (r.status === "fulfilled") {
      return { tier, status: "fulfilled", worksheet: r.value };
    }
    return { tier, status: "rejected", error: String(r.reason ?? "unknown error") };
  });
  return {
    groupId,
    results,
    successCount: results.filter((r) => r.status === "fulfilled").length,
    failCount: results.filter((r) => r.status === "rejected").length,
  };
}

/** Stamp `metadata.differentiationGroup` on a saved tier worksheet. */
export function stampGroupMetadata<T extends { metadata?: Record<string, unknown> }>(
  worksheet: T,
  groupId: string,
  tier: DifferentiationTier,
): T {
  const md = (worksheet.metadata || {}) as Record<string, unknown>;
  return { ...worksheet, metadata: { ...md, differentiationGroup: { groupId, tier } } } as T;
}
