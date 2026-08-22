/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * Three-tier differentiation orchestration.
 *
 * A classroom teacher needs a dependable LA → MA → HA pathway, not three
 * simultaneous provider requests that can all fail together. Each tier runs
 * in sequence, gets one bounded retry, and reports its own final result so
 * completed tiers remain useful if another tier cannot be generated.
 */

export type DifferentiationTier = "LA" | "MA" | "HA";

export interface ThreeTierInput<TWorksheet> {
  worksheet: TWorksheet;
  /** Differentiator. Receives the source worksheet and a tier label. */
  differentiate: (worksheet: TWorksheet, tier: DifferentiationTier) => Promise<TWorksheet>;
  /** Group id (defaults to a deterministic session-scoped id). */
  groupId?: string;
  /**
   * Optional targeted execution list. Used by the interface to retry only a
   * failed tier while retaining already successful versions.
   */
  tiers?: DifferentiationTier[];
}

export interface TierResult<TWorksheet> {
  tier: DifferentiationTier;
  status: "fulfilled" | "rejected";
  worksheet?: TWorksheet;
  error?: string;
  /** Number of provider attempts made for this tier (one or two). */
  attempts: number;
}

export interface ThreeTierOutput<TWorksheet> {
  groupId: string;
  results: TierResult<TWorksheet>[];
  successCount: number;
  failCount: number;
}

const DEFAULT_TIERS: DifferentiationTier[] = ["LA", "MA", "HA"];

function deriveGroupId(): string {
  return "diff-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function normaliseError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  return "The differentiation provider did not return a usable result.";
}

/**
 * Generates the requested tiers sequentially. A failed tier receives one
 * automatic retry. The function always resolves with the completed result
 * set, allowing the teacher to keep successful versions and retry only the
 * remaining failed tier.
 */
export async function runThreeTierDifferentiation<TWorksheet>(
  input: ThreeTierInput<TWorksheet>,
): Promise<ThreeTierOutput<TWorksheet>> {
  const groupId = input.groupId || deriveGroupId();
  const requested = input.tiers?.length ? input.tiers : DEFAULT_TIERS;
  const tiers = Array.from(new Set(requested)).filter((tier): tier is DifferentiationTier =>
    DEFAULT_TIERS.includes(tier),
  );
  const results: TierResult<TWorksheet>[] = [];

  for (const tier of tiers) {
    let finalError: string | undefined;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const worksheet = await input.differentiate(input.worksheet, tier);
        results.push({ tier, status: "fulfilled", worksheet, attempts: attempt });
        finalError = undefined;
        break;
      } catch (error) {
        finalError = normaliseError(error);
        if (attempt === 2) {
          results.push({ tier, status: "rejected", error: finalError, attempts: attempt });
        }
      }
    }
  }

  return {
    groupId,
    results,
    successCount: results.filter((result) => result.status === "fulfilled").length,
    failCount: results.filter((result) => result.status === "rejected").length,
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
