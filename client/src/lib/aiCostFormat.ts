/**
 * PD13 — UI surface for cost transparency: tiny formatting helpers
 * shared between the WorksheetCostChip footer chip, the breakdown
 * modal, and the admin spend panel.
 *
 * Pure — no I/O, no side effects, deterministic for the same input.
 *
 * Why a separate file? The chip + modal + admin panel all need the
 * same currency / duration formatting and the same provider-label
 * canonicaliser. Co-locating them keeps the chip below ~80 LOC and
 * means the unit test is one focused file.
 */

import type { CostEstimateMeta } from "./aiCostStamp";

/**
 * USD → GBP conversion. We use a fixed mid-point rate so the chip is
 * deterministic in tests and across reloads. Bursars want a defensible
 * order-of-magnitude figure, not a live FX feed. Updated quarterly via
 * a one-line PR if it ever drifts more than a few percent.
 *
 * Rate as of 2026-Q2 mid-market.
 */
export const USD_TO_GBP = 0.79;

/**
 * Format a USD value as GBP. Uses 4 decimal places below £0.01,
 * 3 between £0.01 and £0.10, 2 thereafter — so a £0.0006 chip and a
 * £1.20 chip both look natural without scientific notation.
 *
 * Returns "£0" for inputs ≤ 0 (so the cache-hit chip reads "Cached · £0"
 * instead of "Cached · £0.0000").
 */
export function formatGbp(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return "£0";
  const gbp = usd * USD_TO_GBP;
  let decimals: number;
  if (gbp < 0.01) decimals = 4;
  else if (gbp < 0.10) decimals = 3;
  else decimals = 2;
  return `£${gbp.toFixed(decimals)}`;
}

/**
 * Format a duration in milliseconds. Sub-second → "0.4s",
 * 1-60 seconds → "2.4s", 60-3600 → "1m 23s", >3600 → "1h 5m".
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) {
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms - m * 60_000) / 1000);
    return `${m}m ${s}s`;
  }
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms - h * 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

/**
 * Display-friendly provider label. Maps internal keys (groq, openai,
 * nvidia_nim) to teacher-facing names ("Groq Llama", "OpenAI",
 * "NVIDIA NIM"). Unknown keys are returned unchanged.
 */
export const PROVIDER_LABELS: Readonly<Record<string, string>> = {
  groq: "Groq",
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  cerebras: "Cerebras",
  sambanova: "SambaNova",
  mistral: "Mistral",
  cohere: "Cohere",
  nvidia_nim: "NVIDIA NIM",
  cache: "Cached",
} as const;

export function formatProvider(provider: string, model?: string): string {
  const base = PROVIDER_LABELS[provider] ?? provider;
  if (!model || model === "(unknown)" || model === "(cached)") return base;
  return `${base} · ${model}`;
}

/**
 * Compose the chip label shown in WorksheetRenderer's footer.
 *
 * - Cache hit: "Cached · £0 · 0.5s · Groq"
 * - Fresh:     "0.0006 · 2.4s · Groq · llama3-70b"
 * - No cost data (older worksheet): null (caller hides the chip)
 */
export function formatChipLabel(
  costEstimate: CostEstimateMeta | undefined,
  cacheHit: boolean | undefined,
): string | null {
  if (!costEstimate) return null;
  const parts: string[] = [];
  if (cacheHit) {
    parts.push("Cached");
    parts.push("£0");
  } else {
    parts.push(formatGbp(costEstimate.estimatedUsd));
  }
  if (typeof costEstimate.durationMs === "number" && costEstimate.durationMs > 0) {
    parts.push(formatDuration(costEstimate.durationMs));
  }
  parts.push(formatProvider(costEstimate.provider, costEstimate.model));
  return parts.join(" · ");
}
