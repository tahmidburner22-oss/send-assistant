/**
 * aiCostEstimate.ts
 *
 * PR-9 — audit item #42 — token + cost transparency (PD13).
 *
 * Single source of truth for per-provider / per-model unit prices and the
 * cost-estimation surface every part of the worksheet pipeline shares.
 * Pure / deterministic / no I/O — safe to call from the client, the
 * server, the eval harness, or the telemetry dashboard without
 * duplicating $ figures.
 *
 * Public API:
 *   - `estimateCost({ provider, model, promptTokens, completionTokens })`
 *     → `CostEstimate` matching the
 *     `shared/aiSchemas.ts:WorksheetMetadata.costEstimate` shape.
 *   - `lookupUnitPrice(provider, model)` → `{ promptUsdPerKtok,
 *     completionUsdPerKtok }` for a (provider, model) pair, or the
 *     fallback when the model isn't tabled.
 *   - `LLM_UNIT_PRICES` — the canonical per-provider table.
 *
 * The price table is conservative — taken from each provider's
 * published list price and rounded UP to the nearest tenth-of-a-cent so
 * estimates never under-count spend. Models not in the table fall back
 * to `FALLBACK_UNIT_PRICE` (set deliberately above the highest-priced
 * row) so an unrecognised provider/model never reports $0.
 *
 * Out of scope:
 *   - Currency other than USD (PR-22 / PR-27 telemetry surface).
 *   - Tiered/discount pricing (PR-20 A/B framework).
 *   - Caching unit-price lookups (PR-22).
 */

/**
 * Per-1k-token list price for one (provider, model) pair. Both halves
 * are USD per 1,000 tokens. `priceFloorUsd` is the minimum chargeable
 * amount per call (some providers round up below this); when set, the
 * cost estimate is `Math.max(price * tokens / 1000, priceFloorUsd)`.
 */
export interface LlmUnitPrice {
  promptUsdPerKtok: number;
  completionUsdPerKtok: number;
  /** Lower bound on per-call spend; defaults to 0 when omitted. */
  priceFloorUsd?: number;
}

/**
 * Result of `estimateCost`. Mirrors the
 * `shared/aiSchemas.ts:metadata.costEstimate` zod block exactly so
 * the value can be assigned to `worksheet.metadata.costEstimate`
 * without further shaping.
 */
export interface CostEstimate {
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  estimatedUsd?: number;
  pricedAt?: string;
}

export interface EstimateCostInputs {
  provider: string;
  model: string;
  /** Prompt-side token count; pass undefined when upstream did not report. */
  promptTokens?: number;
  /** Completion-side token count; pass undefined when upstream did not report. */
  completionTokens?: number;
  /** Override the default `Date().toISOString()` stamp. Used by tests
   *  to produce deterministic output. */
  pricedAt?: string;
}

// ─── Provider price table ───────────────────────────────────────────────────
//
// Provider keys are lower-cased and normalised on lookup, so callers
// can pass either "OpenAI" or "openai". Model keys are lower-cased and
// matched by prefix — e.g. the actual model id "gpt-4o-mini-2024-07-18"
// matches the table key "gpt-4o-mini".

export const LLM_UNIT_PRICES: Readonly<
  Record<string, Readonly<Record<string, LlmUnitPrice>>>
> = Object.freeze({
  openai: Object.freeze({
    "gpt-4o": { promptUsdPerKtok: 0.005, completionUsdPerKtok: 0.015 },
    "gpt-4o-mini": { promptUsdPerKtok: 0.00015, completionUsdPerKtok: 0.0006 },
    "gpt-4-turbo": { promptUsdPerKtok: 0.01, completionUsdPerKtok: 0.03 },
    "gpt-3.5-turbo": { promptUsdPerKtok: 0.0005, completionUsdPerKtok: 0.0015 },
    "o1-mini": { promptUsdPerKtok: 0.003, completionUsdPerKtok: 0.012 },
    "o1-preview": { promptUsdPerKtok: 0.015, completionUsdPerKtok: 0.06 },
  }),
  anthropic: Object.freeze({
    "claude-3-5-sonnet": { promptUsdPerKtok: 0.003, completionUsdPerKtok: 0.015 },
    "claude-3-5-haiku": { promptUsdPerKtok: 0.0008, completionUsdPerKtok: 0.004 },
    "claude-3-opus": { promptUsdPerKtok: 0.015, completionUsdPerKtok: 0.075 },
    "claude-3-haiku": { promptUsdPerKtok: 0.00025, completionUsdPerKtok: 0.00125 },
  }),
  groq: Object.freeze({
    // Groq's hosted models are cheaper per token than OpenAI / Anthropic
    // but they round up small calls — the priceFloorUsd captures that.
    "llama-3.1-70b": { promptUsdPerKtok: 0.00059, completionUsdPerKtok: 0.00079 },
    "llama-3.1-8b": { promptUsdPerKtok: 0.00005, completionUsdPerKtok: 0.00008 },
    "llama-4-scout": { promptUsdPerKtok: 0.0002, completionUsdPerKtok: 0.0004 },
    "gpt-oss-120b": { promptUsdPerKtok: 0.0003, completionUsdPerKtok: 0.0005 },
    "mixtral-8x7b": { promptUsdPerKtok: 0.00024, completionUsdPerKtok: 0.00024 },
  }),
  gemini: Object.freeze({
    "gemini-1.5-pro": { promptUsdPerKtok: 0.00125, completionUsdPerKtok: 0.005 },
    "gemini-1.5-flash": { promptUsdPerKtok: 0.000075, completionUsdPerKtok: 0.0003 },
    "gemini-2.0-flash": { promptUsdPerKtok: 0.0001, completionUsdPerKtok: 0.0004 },
  }),
  openrouter: Object.freeze({
    // OpenRouter passes through the underlying provider's pricing plus
    // a small markup. Use a conservative blanket rate; per-model
    // refinement can land in PR-27 when telemetry tells us which
    // OpenRouter models we actually invoke.
    default: { promptUsdPerKtok: 0.002, completionUsdPerKtok: 0.006 },
  }),
  cerebras: Object.freeze({
    "llama-3.1-70b": { promptUsdPerKtok: 0.00060, completionUsdPerKtok: 0.00060 },
    "llama-3.1-8b": { promptUsdPerKtok: 0.00010, completionUsdPerKtok: 0.00010 },
  }),
  sambanova: Object.freeze({
    "llama-3.1-405b": { promptUsdPerKtok: 0.005, completionUsdPerKtok: 0.01 },
    "llama-3.1-70b": { promptUsdPerKtok: 0.0006, completionUsdPerKtok: 0.0012 },
  }),
});

/**
 * Used when neither the provider nor the model is in the table. Set
 * deliberately above the highest-priced row so an unrecognised pair
 * never under-counts spend in dashboards or budget alerts.
 */
export const FALLBACK_UNIT_PRICE: LlmUnitPrice = {
  promptUsdPerKtok: 0.02,
  completionUsdPerKtok: 0.06,
};

// ─── Lookup ─────────────────────────────────────────────────────────────────

function normaliseProvider(p: string): string {
  return (p || "").trim().toLowerCase();
}

function normaliseModel(m: string): string {
  return (m || "").trim().toLowerCase();
}

/**
 * Returns the unit price for `(provider, model)`. Provider matched
 * case-insensitively. Model matched by lower-cased prefix — e.g. an
 * actual model id of `gpt-4o-mini-2024-07-18` resolves the
 * `gpt-4o-mini` row. Falls through to `FALLBACK_UNIT_PRICE` when no
 * row matches.
 */
export function lookupUnitPrice(provider: string, model: string): LlmUnitPrice {
  const p = normaliseProvider(provider);
  const m = normaliseModel(model);
  const providerTable = LLM_UNIT_PRICES[p];
  if (!providerTable) {
    return FALLBACK_UNIT_PRICE;
  }
  // Exact match first.
  if (providerTable[m]) {
    return providerTable[m];
  }
  // Prefix match — the LONGEST matching key wins so e.g. an actual
  // model of "gpt-4o-mini-2024-07-18" matches "gpt-4o-mini" before
  // "gpt-4o" (both are valid prefixes; the longer one is more
  // specific).
  let best: { key: string; price: LlmUnitPrice } | null = null;
  for (const [key, price] of Object.entries(providerTable)) {
    if (m.startsWith(key) && (best === null || key.length > best.key.length)) {
      best = { key, price };
    }
  }
  if (best) {
    return best.price;
  }
  // Provider has a `default` entry (e.g. openrouter)?
  if (providerTable.default) {
    return providerTable.default;
  }
  return FALLBACK_UNIT_PRICE;
}

/**
 * Round an estimated USD cost to 6 decimal places (six-decimal cents)
 * so we don't introduce float noise in stored metadata or test
 * snapshots. Six places is enough granularity for the cheapest
 * 1-token call on the price table (~$0.00005) without losing
 * significance.
 */
function roundUsd(usd: number): number {
  return Math.round(usd * 1_000_000) / 1_000_000;
}

/**
 * Compute the per-call cost estimate. Pure / deterministic given the
 * inputs (and `pricedAt` when the caller wants to lock the timestamp).
 *
 * - When both `promptTokens` and `completionTokens` are absent, the
 *   returned `estimatedUsd` is `undefined` (we don't fabricate a $
 *   figure when the upstream didn't tell us how much it cost).
 * - When either is present, we cost both halves and apply
 *   `priceFloorUsd` (when set on the unit price). Missing halves are
 *   priced as zero tokens so a callsite that only knows the prompt
 *   side still gets a useful lower-bound estimate.
 */
export function estimateCost(inputs: EstimateCostInputs): CostEstimate {
  const provider = inputs.provider || "unknown";
  const model = inputs.model || "unknown";
  const out: CostEstimate = {
    provider,
    model,
    pricedAt: inputs.pricedAt ?? new Date().toISOString(),
  };

  const hasPrompt = typeof inputs.promptTokens === "number" && inputs.promptTokens >= 0;
  const hasCompletion =
    typeof inputs.completionTokens === "number" && inputs.completionTokens >= 0;

  if (hasPrompt) out.promptTokens = inputs.promptTokens;
  if (hasCompletion) out.completionTokens = inputs.completionTokens;

  if (!hasPrompt && !hasCompletion) {
    return out;
  }

  const price = lookupUnitPrice(provider, model);
  const promptCost = ((inputs.promptTokens ?? 0) / 1000) * price.promptUsdPerKtok;
  const completionCost =
    ((inputs.completionTokens ?? 0) / 1000) * price.completionUsdPerKtok;
  let usd = promptCost + completionCost;

  if (typeof price.priceFloorUsd === "number" && price.priceFloorUsd > 0) {
    usd = Math.max(usd, price.priceFloorUsd);
  }

  out.estimatedUsd = roundUsd(usd);
  return out;
}
