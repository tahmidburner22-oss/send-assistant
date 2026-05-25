/**
 * PD13 — UI surface for cost transparency: helpers that inject (or
 * re-stamp) cost / cache metadata onto a worksheet JSON string.
 *
 * The server's `/generate` endpoint receives a raw LLM string. To make
 * `metadata.costEstimate` / `metadata.cacheHit` reachable from the
 * client (specifically the `WorksheetCostChip` rendered inside
 * `WorksheetRenderer`'s footer), the server must inject those fields
 * into the JSON before responding.
 *
 * These helpers are pure — no I/O, no Node built-ins — so they bundle
 * cleanly into both the server route and any client-side tests.
 *
 * Robustness contract:
 *   - If the input string is not parsable JSON, the original string is
 *     returned unchanged. The chip simply won't render. Graceful
 *     degradation over breaking a generation that already cost money.
 *   - If the parsed JSON has a non-object `metadata`, it's coerced to
 *     `{}` before the cost fields are added. We never delete unknown
 *     fields the LLM produced.
 */

export interface CostEstimateMeta {
  promptTokens: number;
  completionTokens: number;
  estimatedUsd: number;
  provider: string;
  model: string;
  durationMs?: number;
}

export interface CostStampInput {
  costEstimate: CostEstimateMeta;
  cacheKey?: string;
  cacheHit?: boolean;
}

/**
 * Inject `metadata.costEstimate`, `metadata.cacheKey`, and
 * `metadata.cacheHit` into a worksheet JSON string. If the input isn't
 * parsable JSON, returns the original string unchanged.
 */
export function stampCostMetadata(
  contentJsonString: string,
  toInject: CostStampInput,
): string {
  if (typeof contentJsonString !== "string" || contentJsonString.length === 0) {
    return contentJsonString;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(contentJsonString);
  } catch {
    return contentJsonString;
  }
  if (parsed === null || typeof parsed !== "object") {
    return contentJsonString;
  }
  const obj = parsed as Record<string, unknown>;
  const meta = (obj.metadata && typeof obj.metadata === "object" && !Array.isArray(obj.metadata))
    ? (obj.metadata as Record<string, unknown>)
    : {};
  meta.costEstimate = { ...toInject.costEstimate };
  if (toInject.cacheKey !== undefined) meta.cacheKey = toInject.cacheKey;
  if (toInject.cacheHit !== undefined) meta.cacheHit = toInject.cacheHit;
  obj.metadata = meta;
  return JSON.stringify(obj);
}

/**
 * Mark a previously-stamped cached worksheet as a cache hit and zero
 * out the USD cost (the second-time generation was free). Token counts
 * and provider are preserved so the breakdown modal can still show
 * "this would have cost £0.0006 on a fresh call".
 */
export function restampCacheHit(contentJsonString: string): string {
  if (typeof contentJsonString !== "string" || contentJsonString.length === 0) {
    return contentJsonString;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(contentJsonString);
  } catch {
    return contentJsonString;
  }
  if (parsed === null || typeof parsed !== "object") {
    return contentJsonString;
  }
  const obj = parsed as Record<string, unknown>;
  const meta = (obj.metadata && typeof obj.metadata === "object" && !Array.isArray(obj.metadata))
    ? (obj.metadata as Record<string, unknown>)
    : {};
  meta.cacheHit = true;
  const ce = meta.costEstimate;
  if (ce && typeof ce === "object" && !Array.isArray(ce)) {
    const ceObj = ce as Record<string, unknown>;
    // Preserve token counts but zero the USD — the bursar sees
    // "this generation was free" while still understanding the size.
    ceObj.estimatedUsd = 0;
  }
  obj.metadata = meta;
  return JSON.stringify(obj);
}

/**
 * Approximate prompt / completion token count from a string. Real
 * token counts depend on the tokenizer; this 4-chars-per-token
 * approximation is the public industry rule of thumb (OpenAI's own
 * token-counting docs use the same rough figure). We over-estimate
 * slightly rather than under-estimate so the cost chip never lies the
 * other way.
 */
export function approxTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
