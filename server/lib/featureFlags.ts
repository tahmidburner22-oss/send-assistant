/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/lib/featureFlags.ts — FEAT-H8.
 *
 * Per-tenant feature-flag resolver. Combines:
 *   - the env-only flag (default behaviour for self-hosted deployments)
 *   - a per-school allow-list (db-backed, supplied by the caller)
 *   - per-subject scope
 *   - per-question-type scope (rare; defaults to all)
 *
 * Pure: same inputs → same enabled boolean. The DB read is a separate
 * concern; tests pass a literal allowList through.
 */

export type DarkFlagName =
  | "PROMPT_AB_ENABLED"
  | "PROMPT_FAMILIES_ENABLED"
  | "PROMPT_SELF_CONSISTENCY_ENABLED"
  | "PROMPT_CITATION_LAYER_ENABLED"
  | "GENERATION_CACHE_ENABLED";

export interface FlagAllowEntry {
  schoolId: string;
  flag: DarkFlagName;
  enabled: boolean;
  /** When set, restricts the flag to these subjects only. Empty = all. */
  subjects?: string[];
  /** When set, restricts to these question types only. Empty = all. */
  questionTypes?: string[];
}

export interface ResolveContext {
  schoolId?: string;
  subject?: string;
  questionType?: string;
  /** Fallback env-driven boolean (process.env.<flag> === "true"). */
  envEnabled?: boolean;
}

export interface FlagResolver {
  isEnabled: (flag: DarkFlagName, ctx: ResolveContext) => boolean;
}

export function buildFlagResolver(allowList: FlagAllowEntry[]): FlagResolver {
  const byKey = new Map<string, FlagAllowEntry>();
  for (const e of allowList) {
    byKey.set(`${e.schoolId}::${e.flag}`, e);
  }
  return {
    isEnabled(flag, ctx) {
      // Per-school override wins.
      if (ctx.schoolId) {
        const entry = byKey.get(`${ctx.schoolId}::${flag}`);
        if (entry) {
          if (!entry.enabled) return false;
          if (entry.subjects && entry.subjects.length > 0 && ctx.subject) {
            if (!entry.subjects.includes(ctx.subject.toLowerCase())) return false;
          }
          if (
            entry.questionTypes &&
            entry.questionTypes.length > 0 &&
            ctx.questionType
          ) {
            if (!entry.questionTypes.includes(ctx.questionType.toLowerCase())) return false;
          }
          return true;
        }
      }
      // Fall back to env.
      return Boolean(ctx.envEnabled);
    },
  };
}

/** Convenience: read process.env for the supplied flag. */
export function envFlag(flag: DarkFlagName, env: NodeJS.ProcessEnv = process.env): boolean {
  return String(env[flag] || "").toLowerCase() === "true";
}
