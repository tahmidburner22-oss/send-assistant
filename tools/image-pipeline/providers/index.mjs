/**
 * Provider registry and fallback chain.
 *
 * Every provider exports an async `generate({ prompt, negative, width, height, seed })`
 * that returns a Buffer of PNG bytes, OR throws an Error. The runner
 * walks the chain configured in PROVIDER_CHAIN until one succeeds, or
 * marks the row as 'provider-exhausted' and retries on the next batch.
 *
 * The default chain (Pollinations only) requires zero API keys. To add
 * higher-quality providers, set environment variables — see README.
 */
import * as pollinations from "./pollinations.mjs";
import * as together from "./together.mjs";
import * as cloudflare from "./cloudflare.mjs";
import * as huggingface from "./huggingface.mjs";

const ALL = {
  pollinations,
  together,
  cloudflare,
  huggingface,
};

/**
 * Build the active provider chain from env.
 * Order matters: chain is tried in order, first success wins.
 *
 * Default order (no env): pollinations only.
 * If TOGETHER_API_KEY is set: together → pollinations.
 * If CLOUDFLARE_AI_TOKEN+CLOUDFLARE_ACCOUNT_ID: cloudflare → ...above.
 * If HUGGINGFACE_TOKEN: huggingface → ...above.
 */
export function activeChain() {
  const chain = [];
  if (process.env.TOGETHER_API_KEY) chain.push("together");
  if (process.env.CLOUDFLARE_AI_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID)
    chain.push("cloudflare");
  if (process.env.HUGGINGFACE_TOKEN) chain.push("huggingface");
  chain.push("pollinations"); // always last as zero-cost fallback
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
      attempts.push({ provider: name, ok: false, error: String(err.message || err) });
    }
  }
  const err = new Error(`All providers exhausted: ${JSON.stringify(attempts)}`);
  err.attempts = attempts;
  throw err;
}
