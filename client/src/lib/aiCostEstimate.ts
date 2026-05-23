/**
 * PR-9 — Cost transparency: per-provider price table + estimator.
 * Pure helper — no I/O, no side effects.
 */

export const PROVIDER_PRICE_TABLE: Readonly<
  Record<string, { promptPer1k: number; completionPer1k: number }>
> = {
  openai: { promptPer1k: 0.005, completionPer1k: 0.015 },
  anthropic: { promptPer1k: 0.003, completionPer1k: 0.015 },
  groq: { promptPer1k: 0.0001, completionPer1k: 0.0001 },
  gemini: { promptPer1k: 0.0001, completionPer1k: 0.0004 },
  openrouter: { promptPer1k: 0.001, completionPer1k: 0.003 },
  cerebras: { promptPer1k: 0.0001, completionPer1k: 0.0001 },
  sambanova: { promptPer1k: 0.0001, completionPer1k: 0.0002 },
  mistral: { promptPer1k: 0.001, completionPer1k: 0.003 },
  cohere: { promptPer1k: 0.0005, completionPer1k: 0.0015 },
  nvidia_nim: { promptPer1k: 0.0002, completionPer1k: 0.0006 },
} as const;

/**
 * Estimate the USD cost of a generation call.
 * Returns estimatedUsd: 0 when the provider is not in the price table.
 */
export function estimateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): {
  estimatedUsd: number;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
} {
  const entry = PROVIDER_PRICE_TABLE[provider];
  const estimatedUsd = entry
    ? (promptTokens / 1000) * entry.promptPer1k +
      (completionTokens / 1000) * entry.completionPer1k
    : 0;
  return { estimatedUsd, provider, model, promptTokens, completionTokens };
}
