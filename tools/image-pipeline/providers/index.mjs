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
 *   1. deapi       — deAPI aggregator, needs DEAPI_API_KEY ($5 free signup credit)
 *   2. gemini      — Nano Banana (gemini-2.5-flash-image), needs GEMINI_API_KEY
 *   3. together    — FLUX.1-schnell, needs TOGETHER_API_KEY
 *   4. cloudflare  — Workers AI flux-1-schnell, needs CLOUDFLARE_AI_TOKEN+ID
 *   5. huggingface — HF Inference API, needs HUGGINGFACE_TOKEN
 *   6. pollinations — zero-key fallback
 *
 * deAPI goes BEFORE Gemini deliberately. Gemini's free tier is capped
 * at ~500 requests/day, so when it hits the daily limit the chain
 * needs to fall through to a credit-based provider rather than dropping
 * to Pollinations (which returns HTTP 402 in 2026). With deAPI in
 * front, the user's $5 credit is consumed first; when it runs out OR
 * deAPI is unreachable, Gemini absorbs the next ~500/day; only then
 * does the chain stop. This is also why we don't put Pollinations
 * anywhere except last — it cannot serve real load.
 */
import * as deapi from "./deapi.mjs";
import * as gemini from "./gemini.mjs";
import * as pollinations from "./pollinations.mjs";
import * as together from "./together.mjs";
import * as cloudflare from "./cloudflare.mjs";
import * as huggingface from "./huggingface.mjs";

const ALL = {
  deapi,
  gemini,
  together,
  cloudflare,
  huggingface,
  pollinations,
};

/**
 * Build the active provider chain from env. Order matters: the chain is
 * tried in order, first success wins.
 */
export function activeChain() {
  const chain = [];
  if (process.env.DEAPI_API_KEY) chain.push("deapi");
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
