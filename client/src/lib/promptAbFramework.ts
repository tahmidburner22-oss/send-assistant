/**
 * promptAbFramework.ts — PR-20 / audit item #45.
 *
 * A/B prompt-experiment framework. Pure / deterministic. Ships dark
 * behind `PROMPT_AB_ENABLED=true`.
 *
 * Lets us route a fixed % of generations through an alternative
 * prompt variant without forking the call sites. Every variant is
 * declared by name + weight, and the bucket is chosen by hashing the
 * (worksheetId | userId | topic | timestamp) seed so the same input
 * always lands in the same bucket within a single experiment.
 *
 * The framework deliberately does NOT touch any LLM call site —
 * callers ask the framework which variant they should use, then
 * apply it themselves. That keeps the carve-up boundary clean and
 * makes unit testing the bucket-picker trivial.
 */

const ENV_FLAG = "PROMPT_AB_ENABLED";

export interface PromptVariant<TPayload = unknown> {
  /** Stable variant id (e.g. "control", "shorter-system"). */
  id: string;
  /** Routing weight — sum across an experiment's variants must == 100. */
  weight: number;
  /** Variant payload — typically the system prompt string or override. */
  payload: TPayload;
  /** Human-readable description, for the dashboard. */
  description?: string;
}

export interface PromptExperiment<TPayload = unknown> {
  id: string;
  /** Variants in the order they should be displayed in dashboards. */
  variants: PromptVariant<TPayload>[];
  /** ISO timestamp; null while running. */
  closedAt?: string;
  /** Optional notes about why this experiment exists. */
  notes?: string;
}

export interface BucketResolution<TPayload = unknown> {
  experimentId: string;
  variantId: string;
  payload: TPayload;
  /** True when the framework is dark — the caller should ignore the
   *  payload and fall back to its built-in default. */
  shouldRespectFlag: boolean;
}

/** djb2 — same family used everywhere else. */
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

/**
 * Pick a deterministic variant for a given seed. The seed should
 * combine stable identifiers (user id + topic + worksheet id) so the
 * same input always gets the same bucket.
 */
export function pickVariant<T>(
  experiment: PromptExperiment<T>,
  seed: string,
): PromptVariant<T> {
  const totalWeight = experiment.variants.reduce((a, v) => a + Math.max(0, v.weight), 0);
  if (totalWeight <= 0) return experiment.variants[0];
  const bucket = djb2(`${experiment.id}|${seed}`) % totalWeight;
  let acc = 0;
  for (const v of experiment.variants) {
    acc += Math.max(0, v.weight);
    if (bucket < acc) return v;
  }
  return experiment.variants[experiment.variants.length - 1];
}

/**
 * High-level resolver. Returns the chosen variant + a flag the caller
 * should consult before applying the payload. When `PROMPT_AB_ENABLED`
 * is unset / false the resolver still picks a deterministic variant
 * (so dashboards can show "what would have happened") but flags the
 * caller to ignore it.
 */
export function resolveExperiment<T>(
  experiment: PromptExperiment<T>,
  seed: string,
  env: Record<string, string | undefined> = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>,
): BucketResolution<T> {
  const variant = pickVariant(experiment, seed);
  const enabled = String(env[ENV_FLAG] || "").toLowerCase() === "true";
  return {
    experimentId: experiment.id,
    variantId: variant.id,
    payload: variant.payload,
    shouldRespectFlag: enabled,
  };
}

/** Validate an experiment definition: variant ids unique + weights sum to 100. */
export function validateExperiment(experiment: PromptExperiment): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const v of experiment.variants) {
    if (ids.has(v.id)) errors.push(`Duplicate variant id "${v.id}".`);
    ids.add(v.id);
  }
  const total = experiment.variants.reduce((a, v) => a + v.weight, 0);
  if (total !== 100) errors.push(`Weights sum to ${total}, expected 100.`);
  return { ok: errors.length === 0, errors };
}
