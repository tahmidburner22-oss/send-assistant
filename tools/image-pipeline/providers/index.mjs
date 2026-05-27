/**
 * Provider registry and fallback chain.
 *
 * Every provider exports an async `generate({ positive, negative, width, height, seed })`
 * that returns a Buffer of PNG bytes, OR throws an Error. The runner
 * walks the chain configured in PROVIDER_CHAIN until one succeeds, or
 * marks the row as 'provider-exhausted' and retries on the next batch.
 *
 * The default chain (Pollinations only) requires zero API keys. To add
 * higher-quality providers, set environment variables — see HOW-TO-USE.md.
 *
 * Chain order (first key found wins; Pollinations always last):
 *   1. gemini      — Nano Banana (gemini-2.5-flash-image), needs GEMINI_API_KEY
 *   2. together    — FLUX.1-schnell, needs TOGETHER_API_KEY
 *   3. cloudflare  — Workers AI flux-1-schnell, needs CLOUDFLARE_AI_TOKEN+ID
 *   4. huggingface — HF Inference API, needs HUGGINGFACE_TOKEN
 *   5. pollinations — zero-key fallback
 */
import * as gemini from "./gemini.mjs";
import * as pollinations from "./pollinations.mjs";
import * as together from "./together.mjs";
import * as cloudflare from "./cloudflare.mjs";
import * as huggingface from "./huggingface.mjs";

const ALL = {
  gemini,
  together,
  cloudflare,
  huggingface,
  pollinations,
};

/**
 * Build the active provider chain from env. Order matters: the chain is
 * tried in order, first success wins. Gemini (Nano Banana) goes first
 * when present because in May 2026 it is currently SOTA for prompt
 * adherence on illustrative briefs, which is exactly our use case.
 */
export function activeChain() {
  const chain = [];
  if (process.env.GEMINI_API_KEY) chain.push("gemini");
  if (process.env.TOGETHER_API_KEY) chain.push("together");
  if (process.env.CLOUDFLARE_AI_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID)
    chain.push("cloudflare");
  if (process.env.HUGGINGFACE_TOKEN) chain.push("huggingface");
  chain.push("pollinations"); // always last as zero-cost universal fallback
  return chain;
}

/**
 * Generate an image, walking the chain.
 * @returns {Promise<{ provider: string, png: Buffer, attempts: object[] }>}
 */
export async function generate(req) {
  const chain = activeChain();
  const attempts = [];
  for (const name of chain) {
    const provider = ALL[name];
    try {
      const png = await provider.generate(req);
      attempts.push({ provider: name, ok: true });
      return { provider: name, png, attempts };
    } catch (err) {
      attempts.push({
        provider: name,
        ok: false,
        error: String(err.message || err),
      });
    }
  }
  const err = new Error(`All providers exhausted: ${JSON.stringify(attempts)}`);
  err.attempts = attempts;
  throw err;
}
