import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { sendProviderHealthAlert } from "../email/index.js";
import multer from "multer";
import db, { query as dbQuery } from "../db/index.js";
import { requireAuth, requireAdmin, auditLog, tryAuthOptional } from "../middleware/auth.js";
import { filterContent } from "../lib/contentFilter.js";
import { PresentationDataSchemaShared } from "../../shared/aiSchemas.js";
import { getSchoolKey } from "./schoolApiKeys.js";
import { canonicalTopicKey, topicsMatch } from "../lib/topicNormalizer.js";
import { getCached, setCached, redactPii } from "../lib/generationCache.js";
import { computeCacheKey } from "../../client/src/lib/aiCacheKey.js";
import { estimateCost } from "../../client/src/lib/aiCostEstimate.js";
import {
  stampCostMetadata,
  restampCacheHit,
  approxTokenCount,
} from "../../client/src/lib/aiCostStamp.js";
import {
  logGenerationCost,
  rollupSchoolCosts,
} from "../lib/generationCostLog.js";
// Reuse the dependency-free SVG layout audit from the client. The module is
// pure (no DOM, no fetch, no React) so it bundles cleanly into the server
// build via esbuild.
import { checkSvgLayout } from "../../client/src/lib/svgLayoutChecker.js";
// Phase F · FEAT-PF1 — curriculum bank: spec-points + paraphrased
// exemplars + topic-aware scaffolds, tier-filtered. Used by the
// /differentiate-worksheet and /scaffold-worksheet endpoints below to
// upgrade them from string-shuffle / regex-class hints to genuinely
// tier-aware and topic-aware pipelines.
import {
  buildExemplarPromptBlock,
  buildScaffoldPromptBlock,
  filterByTier,
  lookupBySpecRef,
  lookupByTopic,
  targetAoHistogramForTier,
  type Tier as BankTier,
  type CurriculumEntry,
} from "../../client/src/lib/curriculumBank.js";
import type { ExamBoard as BankExamBoard } from "../../client/src/lib/specPointTaxonomy.js";
// Year of Reading 2026 — book grounding. The cache stores parsed pages
// per book so a teacher can re-use the same upload across many chapter
// sessions; the criteria parser turns an uploaded spreadsheet into a
// per-reading-age criteria table.
import {
  computeBookId,
  setBook as setCachedBook,
  getPageRangeText,
} from "../lib/book-content-cache.js";
import {
  parseCriteriaFile,
  selectCriteriaForReadingAge,
} from "../lib/criteria-parser.js";

const router = Router();
const worksheetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ── Provider priority order — 18 providers, ~130,000+ RPD combined ──────────────
//
// Priority rationale (Jun 2026):
//   1. Groq (×3 keys, Llama 4 Scout 17B) — fastest inference, 43,200 RPD combined
//   2. Cerebras (×3 keys, gpt-oss-120b) — wafer-scale speed, 43,200 RPD combined
//      NOTE: llama3.1-8b was retired; gpt-oss-120b is the current fast model
//   -- Gemini (2.5 Flash / 2.5 Flash-Lite / 3.1 Flash-Lite) REMOVED (V8) --
//      The Google key is dead (401/invalid). PR #162 (V4) parked it on a
//      10-min auth cooldown, but a permanently-dead key was still re-probed at
//      the FRONT of every heavy request (reorderForHeavyRequest), adding
//      latency to long generations. The platform is Gemini-independent (Groq is
//      priority-1), so gemini/gemini_lite/gemini_3lite are removed from the
//      fallback order and the heavy-request list entirely. To restore when a
//      valid GEMINI_API_KEY is available, re-add the three ids below and to the
//      `heavy` array in reorderForHeavyRequest. (callGemini + model mapping are
//      retained, so re-adding is a one-line change.)
//   6. NVIDIA NIM — ~40 RPM, Llama 4 Maverick 17B (nemotron-ultra-253b retired)
//   7. SambaNova (×2 keys) — Llama 4 Maverick 17B, 2,000 RPD combined
//      NOTE: Meta-Llama-3.3-70B-Instruct deprecated; Llama-4-Maverick-17B is current
//   8. Cohere Command A — 111B model, 20 RPM, no daily cap
//   9. HuggingFace — variable quality, good backup
//  10. OpenRouter (×2 keys) — 400 RPD combined (last resort before Mistral)
//      NOTE: gemma-4-31b-it:free retired; openai/gpt-oss-120b:free is current
//  11. Mistral — unlimited RPD but only ~1 RPS, last resort
//  12. DeepSeek — paid; only consulted when DEEPSEEK_API_KEY has balance
//      (the fallback walker silently skips providers with no resolved key, so
//      adding it here is opt-in by virtue of the env var being unset).
//  13. OpenAI — paid; final fallback before failure.
// Perplexity / Claude intentionally excluded (paid + no JSON mode).
const PROVIDER_ORDER = [
  "groq_1", "groq_2", "groq_3",
  "cerebras_1", "cerebras_2", "cerebras_3",
  // gemini, gemini_lite, gemini_3lite removed (V8) — dead key; Groq is priority-1.
  "nvidia_nim",
  "sambanova_1", "sambanova_2",
  "cohere",
  "huggingface",
  "openrouter_1", "openrouter_2",
  "mistral",
  "deepseek",
  "openai",
] as const;

// ── Round-robin counters for multi-key providers ─────────────────────────────
// Distributes requests evenly across all keys of each provider to maximise throughput.
let groqRoundRobinIndex = 0;
function getNextGroqKey(): string {
  const keys = [
    process.env.GROQ_API_KEY || "",
    process.env.GROQ_API_KEY_2 || "",
    process.env.GROQ_API_KEY_3 || "",
  ].filter(k => k.trim() !== "");
  if (keys.length === 0) return "";
  const key = keys[groqRoundRobinIndex % keys.length];
  groqRoundRobinIndex = (groqRoundRobinIndex + 1) % keys.length;
  return key;
}

let cerebrasRoundRobinIndex = 0;
function getNextCerebrasKey(): string {
  const keys = [
    process.env.CEREBRAS_API_KEY || "",
    process.env.CEREBRAS_API_KEY_2 || "",
    process.env.CEREBRAS_API_KEY_3 || "",
  ].filter(k => k.trim() !== "");
  if (keys.length === 0) return "";
  const key = keys[cerebrasRoundRobinIndex % keys.length];
  cerebrasRoundRobinIndex = (cerebrasRoundRobinIndex + 1) % keys.length;
  return key;
}

// ── Per-provider cooldown tracker ─────────────────────────────────────────────
// When a provider hits a rate limit (429), it is put in cooldown for COOLDOWN_MS.
// During cooldown it is skipped entirely so other providers can serve requests.
// This prevents cascading failures where every provider gets exhausted at once.
const COOLDOWN_MS = 30_000; // 30 seconds per provider — shorter cooldown since we now have 6 providers + quick retry
// A dead/invalid/quota-exhausted key (401/403/invalid-key) will not recover
// within a request cycle. Parking it for 10 minutes stops the fallback walker
// (and especially reorderForHeavyRequest, which moves Gemini to the FRONT for
// long prompts) from re-trying the same broken key on every single heavy
// request. It is still re-probed after the window in case the key is fixed.
const AUTH_COOLDOWN_MS = 10 * 60_000; // 10 minutes for auth/invalid-key failures
const providerCooldowns = new Map<string, number>(); // provider → timestamp when cooldown expires
// Improvement 7 & 11: Track consecutive failures per provider for health monitoring and alerts
const providerFailureCounts = new Map<string, number>(); // provider → consecutive failure count
const HEALTH_ALERT_THRESHOLD = 3; // alert after this many consecutive failures
const lastHealthAlertTime = new Map<string, number>(); // provider → last alert timestamp
const HEALTH_ALERT_COOLDOWN_MS = 5 * 60 * 1000; // only alert once per 5 minutes per provider

function isOnCooldown(provider: string): boolean {
  const expiresAt = providerCooldowns.get(provider);
  if (!expiresAt) return false;
  if (Date.now() < expiresAt) return true;
  providerCooldowns.delete(provider); // cooldown expired
  return false;
}

function setCooldown(provider: string, reason = "rate limited (429)", durationMs: number = COOLDOWN_MS): void {
  const expiresAt = Date.now() + durationMs;
  providerCooldowns.set(provider, expiresAt);
  console.warn(`[AI] ${provider} put on cooldown for ${durationMs / 1000}s (until ${new Date(expiresAt).toISOString()})`);
  // Improvement 7 & 11: Track consecutive failures and send health alert if threshold exceeded
  const failures = (providerFailureCounts.get(provider) || 0) + 1;
  providerFailureCounts.set(provider, failures);
  if (failures >= HEALTH_ALERT_THRESHOLD) {
    const lastAlert = lastHealthAlertTime.get(provider) || 0;
    if (Date.now() - lastAlert > HEALTH_ALERT_COOLDOWN_MS) {
      lastHealthAlertTime.set(provider, Date.now());
      sendProviderHealthAlert([{ provider, reason, consecutiveFailures: failures }]).catch((e: any) =>
        console.error(`[AI] Failed to send health alert for ${provider}:`, e?.message)
      );
    }
  }
}

function clearProviderFailures(provider: string): void {
  providerFailureCounts.delete(provider);
}

// ── Per-provider RPM (requests-per-minute) tracking ────────────────────────────────────────
// Providers are skipped when they're within 2 requests of their RPM limit,
// preventing 429s before they happen rather than reacting after.
const rpmWindows: Record<string, number[]> = {};
const PROVIDER_RPM_CAPS: Record<string, number> = {
  groq_1:       28,  // Groq free: 30 RPM per key — 2 headroom
  groq_2:       28,
  groq_3:       28,
  cerebras:     28,  // Cerebras free: 30 RPM per key
  cerebras_1:   28,
  cerebras_2:   28,
  cerebras_3:   28,
  gemini:        8,  // Gemini 2.5 Flash free: 10 RPM
  gemini_lite:  13,  // Gemini 2.5 Flash-Lite free: 15 RPM
  gemini_3lite: 13,  // Gemini 3.1 Flash-Lite free: 15 RPM
  nvidia_nim:   35,  // NVIDIA NIM free: ~40 RPM
  sambanova:    28,  // SambaNova free: 30 RPM per key
  sambanova_1:  28,
  sambanova_2:  28,
  openrouter:   18,  // OpenRouter free: 20 RPM per key
  openrouter_1: 18,
  openrouter_2: 18,
  deepseek:     18,  // DeepSeek free: ~20 RPM
  cohere:       18,  // Cohere free: ~20 RPM
  huggingface:   8,  // HuggingFace: conservative
  mistral:       1,  // Mistral free: 2 RPM (very conservative)
  openai:       45,  // Platform paid fallback; kept last in provider order
};
function recordRpm(provider: string): void {
  const now = Date.now();
  if (!rpmWindows[provider]) rpmWindows[provider] = [];
  rpmWindows[provider] = rpmWindows[provider].filter(t => now - t < 60_000);
  rpmWindows[provider].push(now);
}
function isRpmSafe(provider: string): boolean {
  const now = Date.now();
  const window = (rpmWindows[provider] || []).filter(t => now - t < 60_000);
  const cap = PROVIDER_RPM_CAPS[provider] ?? 10;
  return window.length < cap;
}

// Returns a list of providers that are NOT currently on cooldown
function getAvailableProviders(order: string[]): string[] {
  const available = order.filter(p => !isOnCooldown(p));
  if (available.length === 0) {
    // All providers are on cooldown — clear the shortest cooldown and retry with that one
    // (better to retry a cooled-down provider than to fail completely)
    console.warn("[AI] All providers on cooldown — clearing shortest cooldown to allow retry");
    let earliest = Infinity;
    let earliestProvider = "";
    for (const [p, exp] of Array.from(providerCooldowns.entries())) {
      if (exp < earliest) { earliest = exp; earliestProvider = p; }
    }
    if (earliestProvider) {
      providerCooldowns.delete(earliestProvider);
      return [earliestProvider];
    }
  }
  return available;
}

// ── Get the best available key: school key → global admin key → env var ──────
// Security: No API keys are ever hardcoded in source code.
// Keys are stored encrypted in the database (school_api_keys table, AES-256-GCM).
// Each school's keys are completely isolated — one school cannot use another's keys.
async function getEffectiveKey(provider: string, userKey?: string, schoolId?: string): Promise<string> {
  if (userKey && userKey.trim()) return userKey.trim();
  // groq_1/2/3 are virtual providers — each maps to a specific env var key
  if (provider === "groq_1") return process.env.GROQ_API_KEY || "";
  if (provider === "groq_2") return process.env.GROQ_API_KEY_2 || "";
  if (provider === "groq_3") return process.env.GROQ_API_KEY_3 || "";
  // cerebras_1/2/3 — each maps to a specific env var key
  if (provider === "cerebras_1") return process.env.CEREBRAS_API_KEY || "";
  if (provider === "cerebras_2") return process.env.CEREBRAS_API_KEY_2 || "";
  if (provider === "cerebras_3") return process.env.CEREBRAS_API_KEY_3 || "";
  // sambanova_1/2 — each maps to a specific env var key
  if (provider === "sambanova_1") return process.env.SAMBANOVA_API_KEY || "";
  if (provider === "sambanova_2") return process.env.SAMBANOVA_API_KEY_2 || "";
  // openrouter_1/2 — each maps to a specific env var key
  if (provider === "openrouter_1") return process.env.OPENROUTER_API_KEY || "";
  if (provider === "openrouter_2") return process.env.OPENROUTER_API_KEY_2 || "";
  // 1. School-level encrypted key (primary source — each school brings their own)
  if (schoolId) {
    const schoolEntry = await getSchoolKey(schoolId, provider);
    if (schoolEntry?.key) return schoolEntry.key;
  }
  // 2. Global admin key (stored in DB — set via admin panel, never hardcoded)
  try {
    const adminKey = await db.prepare(
      "SELECT api_key FROM admin_api_keys WHERE provider = ?"
    ).get(provider) as any;
    if (adminKey?.api_key) return adminKey.api_key;
  } catch (_) {}
  // gemini_lite and gemini_3lite use the same API key as gemini (different model, separate quota)
  if (provider === "gemini_lite" || provider === "gemini_3lite") {
    if (schoolId) {
      const schoolEntry = await getSchoolKey(schoolId, "gemini");
      if (schoolEntry?.key) return schoolEntry.key;
    }
    try {
      const adminKey = await db.prepare(
        "SELECT api_key FROM admin_api_keys WHERE provider = ?"
      ).get("gemini") as any;
      if (adminKey?.api_key) return adminKey.api_key;
    } catch (_) {}
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  }
  // 3. Platform-level env vars (Railway — for the Adaptly platform operator account only)
  const envMap: Record<string, string> = {
    groq:        process.env.GROQ_API_KEY || "",
    gemini:      process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
    cerebras:    process.env.CEREBRAS_API_KEY || "",
    cerebras_1:  process.env.CEREBRAS_API_KEY || "",
    cerebras_2:  process.env.CEREBRAS_API_KEY_2 || "",
    cerebras_3:  process.env.CEREBRAS_API_KEY_3 || "",
    nvidia_nim:  process.env.NVIDIA_NIM || process.env.NVIDIA_NIM_API_KEY || "",
    sambanova:   process.env.SAMBANOVA_API_KEY || "",
    sambanova_1: process.env.SAMBANOVA_API_KEY || "",
    sambanova_2: process.env.SAMBANOVA_API_KEY_2 || "",
    openrouter:  process.env.OPENROUTER_API_KEY || "",
    openrouter_1: process.env.OPENROUTER_API_KEY || "",
    openrouter_2: process.env.OPENROUTER_API_KEY_2 || "",
    deepseek:    process.env.DEEPSEEK_API_KEY || "",
    cohere:      process.env.COHERE_API_KEY || "",
    huggingface: process.env.HUGGINGFACE_API_KEY || "",
    mistral:     process.env.MISTRAL_API_KEY || "",
    openai:      process.env.OPENAI_API_KEY || "",
  };
  return envMap[provider] || "";
}

async function getAdminModel(provider: string, schoolId?: string): Promise<string> {
  // gemini_lite always uses gemini-2.5-flash-lite regardless of DB config
  if (provider === "gemini_lite") return "gemini-2.5-flash-lite";
  // gemini_3lite always uses gemini-3.1-flash-lite-preview regardless of DB config
  if (provider === "gemini_3lite") return "gemini-3.1-flash-lite-preview";
  // Default model map for all providers
  const defaultModels: Record<string, string> = {
    groq:        "meta-llama/llama-4-scout-17b-16e-instruct",  // Llama 4 Scout — best free on Groq
    groq_1:       "meta-llama/llama-4-scout-17b-16e-instruct",
    groq_2:       "meta-llama/llama-4-scout-17b-16e-instruct",
    groq_3:       "meta-llama/llama-4-scout-17b-16e-instruct",
    cerebras:     "gpt-oss-120b",  // Cerebras wafer-scale — gpt-oss-120b (llama3.1-8b retired Jun 2026)
    cerebras_1:   "gpt-oss-120b",
    cerebras_2:   "gpt-oss-120b",
    cerebras_3:   "gpt-oss-120b",
    gemini:       "gemini-2.5-flash",
    gemini_lite:  "gemini-2.5-flash-lite",
    gemini_3lite: "gemini-3.1-flash-lite-preview",
    nvidia_nim:   "meta/llama-4-maverick-17b-128e-instruct",   // Best free NVIDIA NIM model (nemotron-ultra-253b-v1 retired Jun 2026)
    sambanova:    "Llama-4-Maverick-17B-128E-Instruct",  // Llama 4 Maverick (Meta-Llama-3.3-70B deprecated Jun 2026)
    sambanova_1:  "Llama-4-Maverick-17B-128E-Instruct",
    sambanova_2:  "Llama-4-Maverick-17B-128E-Instruct",
    openrouter:   "openai/gpt-oss-120b:free",  // GPT-OSS 120B free — gemma-4-31b-it:free retired Jun 2026
    openrouter_1: "openai/gpt-oss-120b:free",
    openrouter_2: "openai/gpt-oss-120b:free",
    deepseek:    "deepseek-chat",
    cohere:      "command-a-03-2025",                         // Cohere Command A 111B — best free
    huggingface: "Qwen/Qwen2.5-72B-Instruct",
    mistral:     "mistral-small-latest",
    openai:      "gpt-4.1-mini",
  };
  if (schoolId) {
    const schoolEntry = await getSchoolKey(schoolId, provider);
    if (schoolEntry?.model) return schoolEntry.model;
  }
  try {
    const row = await db.prepare(
      "SELECT model FROM admin_api_keys WHERE provider = ?"
    ).get(provider) as any;
    return row?.model || defaultModels[provider] || "";
  } catch (_) { return defaultModels[provider] || ""; }
}

// ── Core: call a single provider ─────────────────────────────────────────────
// FIX: AbortController signal is now threaded through to every provider fetch call.
// Previously callGroq and callGemini had no signal, so their 18s timeout was inert —
// a hung request would block for Railway's full 60s and return a gateway error.
async function callProvider(
  provider: string,
  system: string,
  user: string,
  key: string,
  model: string,
  maxTokens: number,
  options?: { baseUrl?: string; responseFormat?: ProviderResponseFormat }
): Promise<string> {
  // Per-provider timeouts — chosen so the full fallback chain fits inside Railway's 60s limit.
  // With 14 providers, cooldowns ensure most are skipped; only 2-3 are tried per request.
  // Groq: 12s each (fast LPU inference)
  // Cerebras: 12s (fast wafer-scale inference)
  // Gemini: 15s (fast provider)
  // Mistral: 18s (slower but reliable)
  // NVIDIA NIM / others: 20s
  // Worst case: 3×12 + 15 + 15 + 15 + 20 + 18 = 119s but cooldowns skip most providers
  const timeoutMs =
    provider === "groq" || provider === "groq_1" || provider === "groq_2" || provider === "groq_3" ||
    provider === "cerebras" || provider === "cerebras_1" || provider === "cerebras_2" || provider === "cerebras_3" ||
    provider === "sambanova" || provider === "sambanova_1" || provider === "sambanova_2"
      ? 12_000
      : provider === "gemini" || provider === "gemini_lite" || provider === "gemini_3lite"
      ? 15_000
      : provider === "mistral"
      ? 18_000
      : 20_000;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
    console.warn(`[AI] ${provider} timed out after ${timeoutMs / 1000}s — aborting`);
  }, timeoutMs);

  try {
    let result: string;
    const responseFormat = options?.responseFormat;
    switch (provider) {
      case "groq":
      case "groq_1":
      case "groq_2":
      case "groq_3":
        // llama-3.3-70b-versatile: 131K TPM per key.
        // With 3 keys in round-robin we get 393K effective TPM.
        // FIX: signal passed so the 18s timeout actually fires.
        result = await callGroq(system, user, key, model || "llama-3.3-70b-versatile", maxTokens, controller.signal, responseFormat);
        break;
      case "gemini":
        // FIX: signal passed so the 18s timeout actually fires.
        // FIX: Now uses gemini-2.5-flash (gemini-2.0-flash has quota=0 on free tier)
        result = await callGemini(system, user, key, maxTokens, controller.signal, "gemini-2.5-flash", responseFormat);
        break;
      case "gemini_lite":
        // Gemini 2.5 Flash Lite — separate quota from 2.5 Flash, used as additional fallback
        result = await callGemini(system, user, key, maxTokens, controller.signal, "gemini-2.5-flash-lite", responseFormat);
        break;
      case "gemini_3lite":
        // Gemini 3.1 Flash Lite Preview — newest Google model, 500 RPD / 15 RPM free tier
        result = await callGemini(system, user, key, maxTokens, controller.signal, "gemini-3.1-flash-lite-preview", responseFormat);
        break;
      case "nvidia_nim":
        // NVIDIA NIM — ~40 RPM free, access to Llama 3.1 Nemotron Ultra 253B and others
        result = await callNvidiaNim(system, user, key, model || "meta/llama-4-maverick-17b-128e-instruct", maxTokens, controller.signal, responseFormat);
        break;
      case "openai":
        result = await callOpenAI(system, user, key, model || "gpt-4o-mini", maxTokens, controller.signal, undefined, responseFormat);
        break;
      // Custom OpenAI-compatible providers (added via Settings → AI Providers with a base URL)
      // These are stored in school_api_keys with a base_url field and a custom provider name.
      // The baseUrl is passed in via the options parameter below.
      case "cerebras":
      case "cerebras_1":
      case "cerebras_2":
      case "cerebras_3":
        // Cerebras wafer-scale inference — 14,400 RPD, 30 RPM free tier per key
        // With 3 keys in round-robin we get 43,200 RPD combined
        result = await callCerebras(system, user, key, model || "gpt-oss-120b", maxTokens, controller.signal, responseFormat);
        break;
      case "sambanova":
      case "sambanova_1":
      case "sambanova_2":
        // SambaNova Cloud — 1,000 RPD, 30 RPM free tier per key, OpenAI-compatible
        result = await callSambaNova(system, user, key, model || "Llama-4-Maverick-17B-128E-Instruct", maxTokens, controller.signal, responseFormat);
        break;
      case "openrouter":
      case "openrouter_1":
      case "openrouter_2":
        result = await callOpenRouter(system, user, key, model, maxTokens, controller.signal, responseFormat);
        break;
      case "claude":
        // Claude does not expose a stable JSON-mode flag — relies on prompt-level instruction.
        result = await callClaude(system, user, key, maxTokens, controller.signal);
        break;
      case "huggingface":
        // HuggingFace router has no consistent JSON-mode support — relies on prompt-level instruction.
        result = await callHuggingFace(system, user, key, maxTokens, controller.signal);
        break;
      case "mistral":
        // mistral-small-latest: free tier = unlimited RPD but only 2 RPM.
        // Used as fallback when all Groq keys + Gemini are rate-limited simultaneously.
        result = await callMistral(system, user, key, model || "mistral-small-latest", maxTokens, controller.signal, responseFormat);
        break;
      case "deepseek":
        result = await callDeepSeek(system, user, key, model || "deepseek-chat", maxTokens, controller.signal, responseFormat);
        break;
      case "cohere":
        result = await callCohere(system, user, key, model || "command-r-plus", maxTokens, controller.signal, responseFormat);
        break;
      case "perplexity":
        result = await callPerplexity(system, user, key, model || "llama-3.1-sonar-large-128k-online", maxTokens, controller.signal, responseFormat);
        break;
      default:
        // Custom OpenAI-compatible provider — requires baseUrl to be passed
        if (options?.baseUrl) {
          result = await callOpenAI(system, user, key, model || "gpt-4o-mini", maxTokens, controller.signal, options.baseUrl, responseFormat);
        } else {
          throw new Error(`Unknown provider: ${provider}`);
        }
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

// ── Route heavy requests to high-context providers ────────────────────────────────
// Groq/Cerebras: excellent for fast single-generation (short-medium prompts).
// Gemini: better for long output, batch generation, file adaptation.
// This ensures Groq quota isn't burned on 6,000-token batch calls.
function reorderForHeavyRequest(providers: string[], promptLength: number): string[] {
  if (promptLength < 3000) return providers; // short request — no reorder needed
  // Move high-context providers to front, keep rest of order.
  // V8: gemini* removed (dead key) — SambaNova is now the heavy-request lead.
  const heavy = ["sambanova_1", "sambanova_2"];
  const prioritised = heavy.filter(p => providers.includes(p));
  const rest = providers.filter(p => !heavy.includes(p));
  console.log(`[AI] Heavy request (${promptLength} chars) — prioritising: ${prioritised.join(", ")}`);
  return [...prioritised, ...rest];
}

// ── Auto-fallback: try every provider until one succeeds ─────────────────────
export async function callWithFallback(
  system: string,
  user: string,
  maxTokens: number,
  preferredProvider?: string,
  schoolId?: string,
  opts?: { responseFormat?: ProviderResponseFormat }
): Promise<{ content: string; provider: string }> {
  // Build ordered list: school providers first, then global
  let order: string[];
  if (schoolId) {
    const schoolProviders = (await db.prepare(
      "SELECT provider FROM school_api_keys WHERE school_id=? AND enabled=1 ORDER BY updated_at DESC"
    ).all(schoolId) as any[]).map((r: any) => r.provider);
    // Also include global env-var providers so they act as fallback even for school users
    const remaining = (PROVIDER_ORDER as readonly string[]).filter(p => !schoolProviders.includes(p));
    const fullOrder = [...schoolProviders, ...remaining];
    order = preferredProvider
      ? [preferredProvider, ...fullOrder.filter(p => p !== preferredProvider)]
      : fullOrder;
  } else {
    order = preferredProvider
      ? [preferredProvider, ...(PROVIDER_ORDER as readonly string[]).filter(p => p !== preferredProvider)]
      : [...PROVIDER_ORDER];
  }

  // FIX: Apply round-robin rotation to Groq keys so load is spread evenly.
  // Previously groq_1 was ALWAYS tried first — meaning key 1 absorbed all traffic,
  // hit rate limits first, and keys 2+3 were barely used.
  // Now we rotate the starting Groq key on each call so ~⅓ of requests start on each key.
  const groqProviders = ["groq_1", "groq_2", "groq_3"] as const;
  const cerebrasProviders = ["cerebras_1", "cerebras_2", "cerebras_3"] as const;
  const rotatedOrder = order.map(p => p); // shallow copy

  // Rotate Groq keys so load is spread evenly across all 3
  const firstGroqIdx = rotatedOrder.findIndex(p => groqProviders.includes(p as any));
  if (firstGroqIdx !== -1) {
    const groqBlock = groqProviders.filter(p => rotatedOrder.includes(p));
    if (groqBlock.length > 1) {
      const offset = groqRoundRobinIndex % groqBlock.length;
      groqRoundRobinIndex = (groqRoundRobinIndex + 1) % groqBlock.length;
      const rotated = [...groqBlock.slice(offset), ...groqBlock.slice(0, offset)];
      let gi = 0;
      for (let i = 0; i < rotatedOrder.length; i++) {
        if (groqProviders.includes(rotatedOrder[i] as any)) {
          rotatedOrder[i] = rotated[gi++];
        }
      }
    }
  }

  // Rotate Cerebras keys so load is spread evenly across all 3
  const firstCerebrasIdx = rotatedOrder.findIndex(p => cerebrasProviders.includes(p as any));
  if (firstCerebrasIdx !== -1) {
    const cerebrasBlock = cerebrasProviders.filter(p => rotatedOrder.includes(p));
    if (cerebrasBlock.length > 1) {
      const offset = cerebrasRoundRobinIndex % cerebrasBlock.length;
      cerebrasRoundRobinIndex = (cerebrasRoundRobinIndex + 1) % cerebrasBlock.length;
      const rotated = [...cerebrasBlock.slice(offset), ...cerebrasBlock.slice(0, offset)];
      let ci = 0;
      for (let i = 0; i < rotatedOrder.length; i++) {
        if (cerebrasProviders.includes(rotatedOrder[i] as any)) {
          rotatedOrder[i] = rotated[ci++];
        }
      }
    }
  }

  const errors: string[] = [];

  // Filter out providers currently on cooldown before attempting
  const availableOrder = getAvailableProviders(rotatedOrder);
  if (availableOrder.length < rotatedOrder.length) {
    const cooledDown = rotatedOrder.filter(p => !availableOrder.includes(p));
    console.log(`[AI] Skipping ${cooledDown.join(", ")} (on cooldown) — using: ${availableOrder.join(", ")}`);
  }

  // Apply smart routing: heavy requests go to high-context providers first
  const promptLength = system.length + user.length;
  const ordersToTry = reorderForHeavyRequest(
    availableOrder.length > 0 ? availableOrder : rotatedOrder,
    promptLength
  );

  for (const provider of ordersToTry) {
    // Skip if we're near the RPM cap for this provider (proactive rate-limit prevention)
    if (!isRpmSafe(provider)) {
      errors.push(`${provider}: near RPM cap — skipping`);
      console.log(`[AI] ${provider} near RPM cap — skipping`);
      continue;
    }
    const key = await getEffectiveKey(provider, undefined, schoolId);
    if (!key) {
      errors.push(`${provider}: no key configured`);
      continue;
    }
    const model = await getAdminModel(provider, schoolId);
    // For custom providers (not in the known list), fetch the baseUrl from school keys
    let baseUrl: string | undefined;
    if (schoolId) {
      try {
        const schoolEntry = await getSchoolKey(schoolId, provider);
        if (schoolEntry?.baseUrl) baseUrl = schoolEntry.baseUrl;
      } catch (_) {}
    }
    try {
      const content = await callProvider(provider, system, user, key, model, maxTokens, {
        ...(baseUrl ? { baseUrl } : {}),
        ...(opts?.responseFormat ? { responseFormat: opts.responseFormat } : {}),
      });
      if (content && content.trim()) {
        console.log(`[AI] Success via ${provider}`);
        recordRpm(provider); // track successful request for RPM window
        clearProviderFailures(provider); // reset failure count on success
        return { content, provider };
      }
      errors.push(`${provider}: empty response`);
    } catch (err: any) {
      const msg = err?.message || String(err);
      // Rate limit (429) or quota exceeded
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("too many requests");
      if (isRateLimit) {
        // Groq and Cerebras rate limits often clear within seconds (per-minute window resets).
        // A quick 2s retry avoids unnecessarily falling through to slower providers.
        const isQuickRetryProvider = provider.startsWith("groq") || provider.startsWith("cerebras");
        if (isQuickRetryProvider) {
          try {
            console.log(`[AI] ${provider} rate limited — quick 2s retry...`);
            await new Promise(r => setTimeout(r, 2000));
            const retryContent = await callProvider(provider, system, user, key, model, maxTokens, opts?.responseFormat ? { responseFormat: opts.responseFormat } : undefined);
            if (retryContent && retryContent.trim()) {
              console.log(`[AI] Quick retry success via ${provider}`);
              return { content: retryContent, provider };
            }
          } catch (retryErr: any) {
            console.warn(`[AI] ${provider} quick retry also failed`);
          }
        }
        setCooldown(provider); // marks provider as unavailable for COOLDOWN_MS
        errors.push(`${provider}: rate limited (429) — on cooldown for ${COOLDOWN_MS / 1000}s`);
        continue;
      }
      // Auth error (401/403) / invalid key / exhausted quota — park the
      // provider for a long window. A bad or quota-dead key (e.g. a broken
      // Gemini key) will NOT recover inside a request cycle, and because
      // reorderForHeavyRequest moves Gemini to the front for long prompts,
      // leaving it un-cooled means every worksheet/presentation request
      // wastes 1–3 failed calls on it first. The 10-min cooldown is still
      // re-probed afterwards, so a fixed key recovers automatically.
      const isAuthError = msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid api key");
      if (isAuthError) {
        setCooldown(provider, "auth/invalid key (401/403)", AUTH_COOLDOWN_MS);
        console.warn(`[AI] ${provider} auth error — parking for ${AUTH_COOLDOWN_MS / 60000}min, trying next provider`);
        errors.push(`${provider}: auth error — on cooldown for ${AUTH_COOLDOWN_MS / 60000}min`);
        continue;
      }
      console.warn(`[AI] ${provider} failed: ${msg.slice(0, 120)}`);
      errors.push(`${provider}: ${msg.slice(0, 80)}`);
    }
  }

  // Last resort: if all available providers failed but there are cooled-down ones, try them too
  const cooledDownProviders = rotatedOrder.filter(p => !ordersToTry.includes(p));
  for (const provider of cooledDownProviders) {
    const key = await getEffectiveKey(provider, undefined, schoolId);
    if (!key) continue;
    try {
      providerCooldowns.delete(provider); // force clear cooldown for this last-ditch attempt
      const model = await getAdminModel(provider, schoolId);
      const content = await callProvider(provider, system, user, key, model, maxTokens, opts?.responseFormat ? { responseFormat: opts.responseFormat } : undefined);
      if (content && content.trim()) {
        console.log(`[AI] Last-resort success via ${provider} (was on cooldown)`);
        return { content, provider };
      }
    } catch (e: any) {
      errors.push(`${provider} (last-resort): ${(e?.message || "").slice(0, 80)}`);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join("\n")}`);
}

// ── AI Proxy — auto-fallback, no manual key needed ───────────────────────────
router.post("/generate", requireAuth, async (req: Request, res: Response) => {
  const { prompt, systemPrompt, provider, model, apiKey, maxTokens = 2000, responseFormat } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  // Validate responseFormat — only accept "json_object" | "text" | undefined.
  // Anything else is silently ignored so a malformed client never blocks generation.
  const safeResponseFormat: ProviderResponseFormat | undefined =
    responseFormat === "json_object" || responseFormat === "text" ? responseFormat : undefined;

  // Content filtering
  const promptFilter = filterContent(prompt);
  const logId = uuidv4();

  try {
    await db.prepare(`INSERT INTO ai_filter_log (id, user_id, school_id, prompt, flagged, flag_reason)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      logId, req.user!.id, req.user!.schoolId,
      prompt.slice(0, 500),
      promptFilter.flagged ? 1 : 0,
      promptFilter.reason || null
    );
  } catch (_) {}

  if (promptFilter.flagged && promptFilter.category === "safeguarding") {
    try {
      const incidentId = uuidv4();
      await db.prepare(`INSERT INTO safeguarding_incidents (id, school_id, reported_by, description, ai_trigger, severity)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        incidentId, req.user!.schoolId, req.user!.id,
        `AI prompt flagged: ${promptFilter.reason}`,
        prompt.slice(0, 500),
        promptFilter.severity || "medium"
      );
      const school = await db.prepare("SELECT * FROM schools WHERE id = ?").get(req.user!.schoolId) as any;
      if (school?.dsl_email) {
        const { sendDSLIncidentAlert } = await import("../email/index.js");
        await db.prepare("UPDATE safeguarding_incidents SET dsl_notified=1, dsl_notified_at=NOW() WHERE id=?").run(incidentId);
        sendDSLIncidentAlert(school.dsl_email, {
          id: incidentId,
          severity: promptFilter.severity || "medium",
          description: `AI prompt flagged for safeguarding: ${promptFilter.reason}`,
          reportedBy: req.user!.displayName,
        }).catch(console.error);
      }
      return res.status(400).json({
        error: "Your input has been flagged for safeguarding review. Your DSL has been notified.",
        flagged: true,
        incidentId,
      });
    } catch (e) {
      console.error("Safeguarding incident error:", e);
    }
  }

  // PR-9 — generation cache: check for cached response before calling LLM
  const cacheFields = {
    subject: req.body.subject || '',
    topic: req.body.topic || '',
    yearGroup: req.body.yearGroup || '',
    examBoard: req.body.examBoard || '',
    sendNeed: req.body.sendNeed || '',
    generatorVersion: req.body.generatorVersion || '',
    tier: req.body.tier || '',
  };
  const cacheKey = computeCacheKey(cacheFields);
  // PD13 — capture wall-clock duration for the cost chip.
  const generateStartedAt = Date.now();
  const cached = getCached(cacheKey);
  if (cached) {
    // PR-9 stored an envelope { content, provider }. Pull out the
    // worksheet JSON, re-stamp it as a cache hit (cacheHit=true,
    // estimatedUsd=0) and return the same shape the cache-miss path
    // returns so the client can treat both uniformly.
    const cachedContent = (cached as { content?: unknown }).content;
    const stamped = typeof cachedContent === "string"
      ? restampCacheHit(cachedContent)
      : "";
    // Best-effort log so the admin panel sees the cache hit (free).
    try {
      logGenerationCost({
        schoolId: req.user!.schoolId,
        userId: req.user!.id,
        provider: "cache",
        model: "(cached)",
        promptTokens: 0,
        completionTokens: 0,
        estimatedUsd: 0,
        durationMs: Date.now() - generateStartedAt,
        cacheKey,
        cached: true,
      });
    } catch (_) {}
    return res.json({ content: stamped, provider: "cache", cacheHit: true, cacheKey });
  }

  try {
    // If user provided a specific key for a specific provider, try that first
    // Otherwise auto-fallback across all configured providers
    let result: { content: string; provider: string };

    if (apiKey && provider) {
      // User supplied their own key — try that provider first, then auto-fallback
      try {
        const model = await getAdminModel(provider);
        const content = await callProvider(provider, systemPrompt || "", prompt, apiKey, model, maxTokens, safeResponseFormat ? { responseFormat: safeResponseFormat } : undefined);
        result = { content, provider };
      } catch (_) {
        result = await callWithFallback(systemPrompt || "", prompt, maxTokens, provider, req.user!.schoolId || undefined, safeResponseFormat ? { responseFormat: safeResponseFormat } : undefined);
      }
    } else {
      // No user key — auto-fallback using school keys first, then global
      result = await callWithFallback(systemPrompt || "", prompt, maxTokens, provider, req.user!.schoolId || undefined, safeResponseFormat ? { responseFormat: safeResponseFormat } : undefined);
    }

    const responseFilter = filterContent(result.content);
    try {
      await db.prepare("UPDATE ai_filter_log SET output=?, flagged=?, flag_reason=? WHERE id=?").run(
        result.content.slice(0, 500),
        responseFilter.flagged ? 1 : 0,
        responseFilter.reason || null,
        logId
      );
    } catch (_) {}

    if (responseFilter.flagged) {
      return res.json({
        content: result.content,
        provider: result.provider,
        warning: "This AI-generated content has been flagged for review.",
        flagged: true,
        aiGenerated: true,
      });
    }

    // Audit log: track AI tool usage (tool name extracted from systemPrompt if available)
    try {
      const toolHint = (systemPrompt || "").slice(0, 80).replace(/\n/g, " ").trim();
      auditLog(req.user!.id, req.user!.schoolId, "ai.generate", "ai_filter_log", logId, { provider: result.provider, tool: toolHint || "unknown" }, req.ip);
    } catch (_) {}

    // PD13 — UI surface for cost transparency. Stamp metadata.costEstimate
    // / cacheKey / cacheHit=false onto the worksheet JSON so the chip in
    // WorksheetRenderer can read them. Approximate token counts via the
    // public 4-chars-per-token rule of thumb (the bursar's view is "is
    // this in the right order of magnitude" — exact token usage from the
    // provider response is a refinement for a later PR).
    const promptText = (systemPrompt || "") + (prompt || "");
    const promptTokens = approxTokenCount(promptText);
    const completionTokens = approxTokenCount(result.content);
    let resolvedModel = "(unknown)";
    try {
      resolvedModel = await getAdminModel(result.provider, req.user!.schoolId || undefined);
    } catch (_) { /* fall back to "(unknown)" */ }
    const cost = estimateCost(result.provider, resolvedModel, promptTokens, completionTokens);
    const durationMs = Date.now() - generateStartedAt;
    const stampedContent = stampCostMetadata(result.content, {
      costEstimate: { ...cost, durationMs },
      cacheKey,
      cacheHit: false,
    });

    // PR-9 — cache the (stamped) response so subsequent hits return with
    // cost metadata intact. PII-redact before write.
    try {
      setCached(cacheKey, redactPii({ content: stampedContent, provider: result.provider }));
    } catch (_e) {}

    // PD13 — append the cost-log row used by the admin spend panel.
    try {
      logGenerationCost({
        schoolId: req.user!.schoolId,
        userId: req.user!.id,
        provider: result.provider,
        model: resolvedModel,
        promptTokens,
        completionTokens,
        estimatedUsd: cost.estimatedUsd,
        durationMs,
        cacheKey,
        cached: false,
      });
    } catch (_) {}

    res.json({ content: stampedContent, provider: result.provider, aiGenerated: true });
  } catch (err: any) {
    console.error("AI proxy error:", err);
    const errMsg = err?.message || String(err);
    // Check if all providers failed due to missing keys (not rate limits or network errors)
    const allNoKey = errMsg.includes("no key configured") && !errMsg.includes("429") && !errMsg.includes("401") && !errMsg.includes("failed:");
    if (allNoKey || errMsg.includes("All AI providers failed") && errMsg.split("\n").slice(1).every((l: string) => l.includes("no key configured"))) {
      return res.status(503).json({
        error: "No AI provider keys configured for your school. Please go to Settings → AI Providers to add your API keys.",
        noKeysConfigured: true,
      });
    }
    // Surface per-provider failure reasons so the client can show a useful
    // message instead of a generic "temporarily unavailable". Without this
    // the front-end has no way to distinguish rate-limit cooldowns from
    // parse failures or timeouts, which is the #1 cause of the worksheet
    // generator looking like it "silently fails after cycling providers".
    const providerErrors: string[] = errMsg.startsWith("All AI providers failed:")
      ? errMsg.split("\n").slice(1).filter(Boolean)
      : [];
    const allRateLimited = providerErrors.length > 0 && providerErrors.every((l: string) =>
      l.includes("rate limited") || l.includes("near RPM cap") || l.includes("cooldown")
    );
    res.status(502).json({
      error: allRateLimited
        ? "All AI providers are currently rate-limited. Please wait ~30 seconds and try again."
        : "AI is temporarily unavailable. Please try again in a moment.",
      providerErrors: providerErrors.slice(0, 14),
      allRateLimited,
    });
  }
});

// ── Streaming AI Generation (SSE) ────────────────────────────────────────────
// POST /api/ai/generate-stream
// Same as /generate but returns Server-Sent Events so the client can render
// text progressively. Falls back to JSON response if streaming isn't possible.
router.post("/generate-stream", requireAuth, async (req: Request, res: Response) => {
  const { prompt, systemPrompt, maxTokens = 2500 } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  // Content filtering
  const promptFilter = filterContent(prompt);
  if (promptFilter.flagged && promptFilter.category === "safeguarding") {
    return res.status(400).json({ error: "Content flagged for safeguarding review." });
  }

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

  const schoolId = req.user!.schoolId || undefined;

  try {
    // Use the standard callWithFallback — since most providers don't support
    // true token-by-token streaming on the free tier, we simulate streaming
    // by sending the complete response in small chunks with a brief delay.
    // This still gives a ~3x perceived speed improvement because the browser
    // starts rendering immediately instead of waiting for the full response.
    const { content, provider } = await callWithFallback(
      systemPrompt || "",
      prompt,
      maxTokens,
      undefined,
      schoolId
    );

    // Send provider info first
    res.write(`data: ${JSON.stringify({ provider })}\n\n`);

    // Simulate streaming by chunking the response (30-char chunks with 15ms delay)
    // This makes the text appear progressively in the UI.
    const CHUNK_SIZE = 30;
    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      const chunk = content.slice(i, i + CHUNK_SIZE);
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      // Small delay to create the streaming visual effect
      if (i + CHUNK_SIZE < content.length) {
        await new Promise(r => setTimeout(r, 15));
      }
    }

    // Signal completion
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    // If headers haven't been sent yet, send error as JSON
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      return res.status(502).json({ error: "AI generation failed. Please try again." });
    }
    // If already streaming, send error as SSE event
    res.write(`data: ${JSON.stringify({ error: err.message || "Generation failed" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// ── Collaborative AI Ensemble ─────────────────────────────────────────────────
router.post("/ensemble", requireAuth, async (req: Request, res: Response) => {
  const { prompt, systemPrompt, maxTokens = 3000 } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  const promptFilter = filterContent(prompt);
  if (promptFilter.flagged && promptFilter.category === "safeguarding") {
    return res.status(400).json({ error: "Content flagged for safeguarding review." });
  }

	  // Run all configured providers in parallel (all using server env var keys)
	  const toRun = PROVIDER_ORDER.filter(p => true);

  if (toRun.length === 0) {
    return res.status(400).json({ error: "No AI providers configured." });
  }

  const results = await Promise.allSettled(
    toRun.map(async (p) => {
      const key = await getEffectiveKey(p);
      const model = await getAdminModel(p);
      const text = await callProvider(p, systemPrompt || "", prompt, key, model, maxTokens);
      return { provider: p, text };
    })
  );

  const successes = results
    .filter((r) => r.status === "fulfilled")
    .map(r => (r as PromiseFulfilledResult<{ provider: string; text: string }>).value);

  if (successes.length === 0) {
    // Fall back to single provider auto-fallback
    try {
      const result = await callWithFallback(systemPrompt || "", prompt, maxTokens);
      return res.json({ content: result.content, provider: result.provider, ensemble: false, aiGenerated: true });
    } catch (err: any) {
      return res.status(502).json({ error: "All AI providers failed." });
    }
  }

  if (successes.length === 1) {
    return res.json({ content: successes[0].text, provider: successes[0].provider, ensemble: false, aiGenerated: true });
  }

  const primary = successes.reduce((a, b) => a.text.length >= b.text.length ? a : b);
  const contributors = successes.map(s => s.provider).join(", ");

  res.json({
    content: primary.text,
    provider: primary.provider,
    ensemble: true,
    contributors,
    allResponses: successes,
    aiGenerated: true,
  });
});

// ── Get available providers ───────────────────────────────────────────────────
router.get("/providers", requireAuth, (_req: Request, res: Response) => {
  const available = PROVIDER_ORDER
    .filter(p => true)
    .map(p => ({ provider: p, source: "server" }));
  res.json({ providers: available });
});

// ── Provider cooldown status (admin) ────────────────────────────────────────
router.get("/provider-status", requireAuth, async (_req: Request, res: Response) => {
  const now = Date.now();
  const statuses = await Promise.all((PROVIDER_ORDER as readonly string[]).map(async p => {
    const hasKey = !!await getEffectiveKey(p);
    const cooldownExpires = providerCooldowns.get(p);
    const onCooldown = cooldownExpires ? now < cooldownExpires : false;
    const cooldownRemainingMs = onCooldown && cooldownExpires ? cooldownExpires - now : 0;
    return {
      provider: p,
      hasKey,
      available: hasKey && !onCooldown,
      onCooldown,
      cooldownRemainingSeconds: Math.ceil(cooldownRemainingMs / 1000),
    };
  }));
  res.json({ providers: statuses, cooldownMs: COOLDOWN_MS });
});

router.post("/clear-cooldowns", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const cleared = Array.from(providerCooldowns.keys());
  providerCooldowns.clear();
  console.log(`[AI] Admin cleared all provider cooldowns: ${cleared.join(", ") || "none"}`);
  res.json({ success: true, cleared });
});

// ── Improvement 7 — Admin provider health endpoint ────────────────────────────
// Returns per-provider health status including consecutive failure counts.
router.get("/admin/provider-health", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const now = Date.now();
  const health = await Promise.all((PROVIDER_ORDER as readonly string[]).map(async p => {
    const hasKey = !!await getEffectiveKey(p);
    const cooldownExpires = providerCooldowns.get(p);
    const onCooldown = cooldownExpires ? now < cooldownExpires : false;
    const cooldownRemainingMs = onCooldown && cooldownExpires ? cooldownExpires - now : 0;
    const consecutiveFailures = providerFailureCounts.get(p) || 0;
    const status: "healthy" | "degraded" | "unhealthy" =
      !hasKey ? "unhealthy" :
      onCooldown && consecutiveFailures >= HEALTH_ALERT_THRESHOLD ? "unhealthy" :
      onCooldown ? "degraded" :
      consecutiveFailures > 0 ? "degraded" : "healthy";
    return {
      provider: p,
      hasKey,
      status,
      onCooldown,
      cooldownRemainingSeconds: Math.ceil(cooldownRemainingMs / 1000),
      consecutiveFailures,
    };
  }));
  const summary = {
    healthy: health.filter(h => h.status === "healthy").length,
    degraded: health.filter(h => h.status === "degraded").length,
    unhealthy: health.filter(h => h.status === "unhealthy").length,
  };
  res.json({ providers: health, summary, alertThreshold: HEALTH_ALERT_THRESHOLD });
});

// ── Admin: manage server-side API keys ────────────────────────────────────────
router.get("/admin/keys", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const keys = await db.prepare(
    "SELECT provider, model, updated_at, (CASE WHEN api_key != '' THEN 1 ELSE 0 END) as has_key FROM admin_api_keys"
  ).all();
  res.json(keys);
});

router.post("/admin/keys", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { provider, apiKey, model } = req.body;
  if (!provider || !apiKey) return res.status(400).json({ error: "provider and apiKey required" });

  const existing = await db.prepare("SELECT id FROM admin_api_keys WHERE provider = ?").get(provider) as any;
  if (existing) {
    await db.prepare(
      "UPDATE admin_api_keys SET api_key=?, model=?, updated_by=?, updated_at=NOW() WHERE provider=?"
    ).run(apiKey, model || null, req.user!.id, provider);
  } else {
    await db.prepare(
      "INSERT INTO admin_api_keys (id, provider, api_key, model, updated_by) VALUES (?, ?, ?, ?, ?)"
    ).run(uuidv4(), provider, apiKey, model || null, req.user!.id);
  }
  auditLog(req.user!.id, req.user!.schoolId, "admin.api_key_update", "admin_api_keys", provider, { provider }, req.ip);
  res.json({ success: true });
});

router.delete("/admin/keys/:provider", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  await db.prepare("DELETE FROM admin_api_keys WHERE provider = ?").run(req.params.provider);
  res.json({ success: true });
});

// ── AI Filter Log ─────────────────────────────────────────────────────────────
router.get("/filter-log", requireAuth, async (req: Request, res: Response) => {
  const logs = await db.prepare(
    `SELECT afl.*, u.display_name FROM ai_filter_log afl
     LEFT JOIN users u ON afl.user_id = u.id
     WHERE afl.school_id = ? ORDER BY afl.created_at DESC LIMIT 200`
  ).all(req.user!.schoolId);
  res.json(logs);
});

// ── AI Usage Stats ────────────────────────────────────────────────────────────
router.get("/stats", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const totalRequests = (await db.prepare("SELECT COUNT(*) as c FROM ai_filter_log WHERE school_id=?").get(schoolId) as any)?.c || 0;
  const flaggedRequests = (await db.prepare("SELECT COUNT(*) as c FROM ai_filter_log WHERE school_id=? AND flagged=1").get(schoolId) as any)?.c || 0;
  const todayRequests = (await db.prepare("SELECT COUNT(*) as c FROM ai_filter_log WHERE school_id=? AND date(created_at)=date('now')").get(schoolId) as any)?.c || 0;
  const topUsers = await db.prepare(
    `SELECT u.display_name, COUNT(*) as requests FROM ai_filter_log afl
     JOIN users u ON afl.user_id=u.id WHERE afl.school_id=?
     GROUP BY afl.user_id ORDER BY requests DESC LIMIT 5`
  ).all(schoolId);
  res.json({ totalRequests, flaggedRequests, todayRequests, topUsers });
});

// ── Provider implementations ──────────────────────────────────────────────────
// FIX: All provider functions now accept an AbortSignal so callProvider's timeout
// can actually cancel the in-flight network request. Previously callGroq and callGemini
// had no signal parameter — the AbortController in callProvider was silently ignored
// and both providers could hang for Railway's full 60s request limit.
//
// PR worksheet-gen-efficiency #3 — native JSON mode threading.
// Every provider that supports a native "respond as raw JSON" flag (Groq,
// Cerebras, SambaNova, Gemini, OpenAI, OpenRouter, Mistral, DeepSeek,
// Cohere, NVIDIA NIM, Perplexity) now accepts an optional `responseFormat`
// argument. When set to "json_object" the provider request adds the
// appropriate native field (`response_format: { type: "json_object" }` for
// OpenAI-compatible APIs, `responseMimeType: "application/json"` for
// Gemini). This lets us delete the JSON-repair fallback path on the worksheet
// generator over time and reduces parse-failure → fallback bleed-through.
// Claude and HuggingFace ignore the flag (they don't expose a stable JSON
// mode on their free tiers) and continue to rely on the prompt-level
// "respond with valid raw JSON only" instruction.
export type ProviderResponseFormat = "json_object" | "text";
async function callGroq(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, responseFormat?: ProviderResponseFormat): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system || "You are a helpful SEND education assistant." },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  };
  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error(`Groq 429: rate limited`);
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");
  return content;
}

// ── Cerebras ─────────────────────────────────────────────────────────────────
// Cerebras uses wafer-scale silicon for ultra-fast inference.
// Free tier: 14,400 RPD, 30 RPM, 60K TPM — same RPD as Groq but often faster.
// OpenAI-compatible API, so the same request format works.
async function callCerebras(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, responseFormat?: ProviderResponseFormat): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system || "You are a helpful SEND education assistant." },
      { role: "user", content: user },
    ],
    max_completion_tokens: maxTokens,
    temperature: 0.1,
  };
  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error(`Cerebras 429: rate limited`);
  if (!res.ok) throw new Error(`Cerebras ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

// ── SambaNova Cloud ──────────────────────────────────────────────────────────────────────────────────
// Wafer-scale inference with Llama 3.3 70B and 405B.
// Free tier: 1,000 RPD, 30 RPM — OpenAI-compatible API.
async function callSambaNova(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, responseFormat?: ProviderResponseFormat): Promise<string> {
  const body: Record<string, unknown> = {
    model: model || "Llama-4-Maverick-17B-128E-Instruct",
    messages: [
      { role: "system", content: system || "You are a helpful SEND education assistant." },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
    temperature: 0.1,
  };
  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error(`SambaNova 429: rate limited`);
  if (!res.ok) throw new Error(`SambaNova ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("SambaNova returned empty content");
  return content;
}

// FIX: callGemini now uses the dedicated systemInstruction field instead of
// concatenating system+user into a single contents message. Using systemInstruction
// produces significantly better structured JSON output (the system prompt is processed
// separately by the model, not mixed into the conversation context).
async function callGemini(system: string, user: string, key: string, maxTokens: number, signal?: AbortSignal, model: string = "gemini-2.5-flash", responseFormat?: ProviderResponseFormat): Promise<string> {
  const generationConfig: Record<string, unknown> = { maxOutputTokens: maxTokens, temperature: 0.1 };
  if (responseFormat === "json_object") {
    generationConfig.responseMimeType = "application/json";
  }
  const body: any = {
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig,
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (res.status === 429) throw new Error(`Gemini ${model} 429: rate limited`);
  if (!res.ok) throw new Error(`Gemini ${model} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error(`Gemini ${model} returned empty content`);
  return content;
}

async function callOpenAI(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, baseUrl?: string, responseFormat?: ProviderResponseFormat): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system || "You are a helpful SEND education assistant." },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
  };
  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch(`${baseUrl || "https://api.openai.com/v1"}/chat/completions`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error(`OpenAI 429: rate limited`);
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

async function callOpenRouter(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, responseFormat?: ProviderResponseFormat): Promise<string> {
  // Best free models on OpenRouter as of May 2026 — ordered by reliability and quality.
  // Prioritise models with stable upstream providers (not Venice-routed Llama which rate-limits).
  const fallbackModels = [
    model,
    "google/gemma-4-31b-it:free",              // Gemma 4 31B — reliable, good instruction following
    "qwen/qwen3-30b-a3b:free",                 // Qwen3 30B — excellent for structured JSON output
    "openai/gpt-oss-20b:free",                 // GPT OSS 20B — OpenAI open-source model
    "nvidia/nemotron-nano-12b-v2:free",        // NVIDIA Nemotron Nano — fast and reliable
    "meta-llama/llama-4-scout:free",           // Llama 4 Scout — when upstream is available
    "meta-llama/llama-3.3-70b-instruct:free",  // Llama 3.3 70B — last resort
  ].filter(Boolean);

  for (const m of fallbackModels) {
    try {
      const body: Record<string, unknown> = {
        model: m,
        messages: [
          { role: "system", content: system || "You are a helpful SEND education assistant." },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
      };
      if (responseFormat === "json_object") {
        body.response_format = { type: "json_object" };
      }
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://adaptly.co.uk",
          "X-Title": "Adaptly",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) continue;
      const data = await res.json() as any;
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    } catch {
      continue;
    }
  }
  throw new Error("OpenRouter: all models failed");
}

async function callClaude(system: string, user: string, key: string, maxTokens: number, signal?: AbortSignal): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: maxTokens,
      system: system || "You are a helpful SEND education assistant.",
      messages: [{ role: "user", content: user }],
    }),
  });
  if (res.status === 429) throw new Error(`Claude 429: rate limited`);
  if (res.status === 529) throw new Error(`Claude 529: overloaded`);
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.content[0].text;
}

async function callHuggingFace(system: string, user: string, key: string, maxTokens: number, signal?: AbortSignal): Promise<string> {
  const models = [
    "Qwen/Qwen2.5-72B-Instruct",
    "meta-llama/Llama-3.1-8B-Instruct",
    "HuggingFaceH4/zephyr-7b-beta",
  ];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`,
        {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system || "You are a helpful SEND education assistant." },
              { role: "user", content: user },
            ],
            max_tokens: maxTokens,
            temperature: 0.7,
          }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json() as any;
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    } catch {
      continue;
    }
  }
  throw new Error("HuggingFace: all models failed");
}

// ── Mistral AI ───────────────────────────────────────────────────────────────
async function callMistral(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, responseFormat?: ProviderResponseFormat): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system || "You are a helpful SEND education assistant." },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  };
  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error(`Mistral 429: rate limited`);
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

// ── DeepSeek ─────────────────────────────────────────────────────────────────
async function callDeepSeek(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, responseFormat?: ProviderResponseFormat): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system || "You are a helpful SEND education assistant." },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  };
  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error(`DeepSeek 429: rate limited`);
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

// ── Cohere ───────────────────────────────────────────────────────────────────
async function callCohere(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, responseFormat?: ProviderResponseFormat): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system || "You are a helpful SEND education assistant." },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
  };
  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch("https://api.cohere.com/v2/chat", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error(`Cohere 429: rate limited`);
  if (!res.ok) throw new Error(`Cohere ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  // Cohere v2 response format
  return data?.message?.content?.[0]?.text || data?.text || "";
}

// ── Perplexity ───────────────────────────────────────────────────────────────

// ── NVIDIA NIM ────────────────────────────────────────────────────────────────
// NVIDIA NIM free tier: ~40 RPM, access to Llama 3.1 Nemotron Ultra 253B and others.
// OpenAI-compatible API — same interface as callOpenAI.
// Sign up at: https://build.nvidia.com/explore/discover
async function callNvidiaNim(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, responseFormat?: ProviderResponseFormat): Promise<string> {
  const fallbackModels = [
    model,
    "meta/llama-4-maverick-17b-128e-instruct",  // Llama 4 Maverick 17B — best available Jun 2026
    "meta/llama-3.3-70b-instruct",               // Llama 3.3 70B — reliable fallback
    "meta/llama-3.1-70b-instruct",               // Llama 3.1 70B — stable fallback
    "meta/llama-3.1-8b-instruct",                // Llama 3.1 8B — fast lightweight fallback
  ].filter(Boolean);
  for (const m of fallbackModels) {
    try {
      const body: Record<string, unknown> = {
        model: m,
        messages: [
          { role: "system", content: system || "You are a helpful SEND education assistant." },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
      };
      if (responseFormat === "json_object") {
        body.response_format = { type: "json_object" };
      }
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      });
      if (res.status === 429) throw new Error(`NVIDIA NIM 429: rate limited`);
      if (!res.ok) { const t = await res.text(); continue; }
      const data = await res.json() as any;
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (err: any) {
      if (err?.message?.includes("429")) throw err; // propagate rate limit
      continue;
    }
  }
  throw new Error("NVIDIA NIM: all models failed");
}
async function callPerplexity(system: string, user: string, key: string, model: string, maxTokens: number, signal?: AbortSignal, responseFormat?: ProviderResponseFormat): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system || "You are a helpful SEND education assistant." },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  };
  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error(`Perplexity 429: rate limited`);
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

// ── Diagram generation helpers ────────────────────────────────────────────────

function getDiagramHintServer(subject: string, topic: string): string {
  const s = subject.toLowerCase();
  const t = topic.toLowerCase();
  if (s === "maths" || s === "mathematics") {
    if (t.includes("pythagoras") || (t.includes("right") && t.includes("triangle")))
      return `Right-angled triangle in Zone A: vertices at (200,400), (480,400), (200,130). Right-angle square at (200,400). Bottom side (200,400)→(480,400) labelled 'a' in Zone E (y=440). Left side (200,400)→(200,130) labelled 'b' in Zone B (x=90, midpoint y). Hypotenuse (480,400)→(200,130) labelled 'c' in Zone C (x=560, midpoint y). Formula rect in Zone C bottom: rect at (555,340) w=90 h=40 fill=#fff8e1, text 'a&#178;+b&#178;=c&#178;' inside. Right-angle square: 15px sides at (200,400). Title: Pythagoras' Theorem.`;
    if (t.includes("circle") && !t.includes("sector") && !t.includes("arc"))
      return `Large circle in Zone A: cx=350 cy=250 r=150 fill=#dbeafe. Elements: (1) radius line from (350,250) to (500,250) — label 'Radius' in Zone C y=240; (2) diameter line from (200,250) to (500,250) — label 'Diameter' in Zone E y=455; (3) chord line from (230,150) to (450,350) — label 'Chord' in Zone B y=250; (4) tangent vertical line x=500 from y=150 to y=350 — label 'Tangent' in Zone C y=150; (5) shaded sector from 0&#176; to 60&#176; fill=#bfdbfe — label 'Sector' in Zone C y=200; (6) arc mark on top — label 'Arc' in Zone D. Title: Parts of a Circle.`;
    if (t.includes("trigonometry") || t.includes("sohcahtoa") || t.includes("sine") || t.includes("cosine") || t.includes("tangent rule") || t.includes("trig"))
      return `Right-angled triangle in Zone A: vertices at (200,390),(480,390),(200,110). Right-angle square at (200,390). Hypotenuse (480,390)→(200,110). Angle arc at (480,390) labelled '&#952;' in Zone C y=370. Side labels: 'Hypotenuse (H)' in Zone C y=240 with leader to hyp; 'Opposite (O)' in Zone B y=250 with leader to left side; 'Adjacent (A)' in Zone E x=340 y=445 with leader to bottom. Formula box in Zone E: rect x=170 y=430 w=360 h=30 fill=#fef9c3, text 'sin&#952;=O/H  cos&#952;=A/H  tan&#952;=O/A'. Title: SOHCAHTOA.`;
    if (t.includes("quadratic") || t.includes("parabola"))
      return `Coordinate axes in Zone A: x-axis from (170,320) to (530,320) with arrow; y-axis from (350,420) to (350,60) with arrow. Draw smooth parabola opening upward, vertex at (350,200), crossing x-axis at (250,320) and (450,320). Label vertex as 'Turning point' in Zone D. Label x-intercepts as 'Roots' in Zone E at x=250 and x=450. Label y-intercept where curve meets y-axis in Zone B. Arrow showing 'axis of symmetry' vertical dashed line at x=350 with label in Zone C. Title: Quadratic Graph.`;
    if (t.includes("simultaneous"))
      return `Coordinate axes in Zone A: x-axis from (170,380) to (530,380); y-axis from (350,420) to (350,60). Two straight lines: Line 1 passes through (200,340) and (480,100) — label 'y=2x+1' in Zone C y=120; Line 2 passes through (200,100) and (480,340) — label 'y=-x+7' in Zone B y=120. Intersection point at (350,240) as filled circle — label 'Solution (2,5)' in Zone C y=240. Title: Simultaneous Equations — Graphical Solution.`;
    if (t.includes("linear graph") || t.includes("straight line") || t.includes("y=mx") || t.includes("gradient") || (t.includes("graph") && !t.includes("quadratic") && !t.includes("cubic") && !t.includes("trig")))
      return `Coordinate axes in Zone A: x-axis from (170,380) to (530,380) with arrow; y-axis from (250,420) to (250,70) with arrow. Axis labels: 'x' at (535,380) Zone C; 'y' at (250,65) Zone D. Plot points A(310,300) and B(460,180) as filled circles. Straight line through them. Gradient triangle: horizontal leg (310,300)→(460,300) labelled 'run' below in Zone E; vertical leg (460,300)→(460,180) labelled 'rise' in Zone C. y-intercept dot where line meets y-axis, labelled 'y-intercept' in Zone B. Title: Linear Graph — y=mx+c.`;
    if (t.includes("fraction"))
      return `Three equal rectangles in Zone A, each 130w×60h, y=200: Rect1 x=175 divided into 4 columns, first filled #6366f1 — label '1/4' in Zone E y=440 x=240; Rect2 x=320 divided into 2 columns, first filled #10b981 — label '1/2' in Zone E y=440 x=385; Rect3 x=465 divided into 4 columns, first two filled #f59e0b — label '2/4' in Zone E y=440 x=530. Title: Equivalent Fractions.`;
    if (t.includes("angle") && !t.includes("parallel"))
      return `Three angle diagrams in Zone A, spread horizontally. Left at x=210: two rays from (210,320), one horizontal right, one at 45&#176; up-right; arc and label 'Acute 45&#176;' in Zone B y=260. Centre at x=350: two rays from (350,320), one right, one straight up; small square at vertex; label 'Right 90&#176;' in Zone D x=350. Right at x=490: two rays from (490,320), one horizontal left, one at 45&#176; up-left; arc and label 'Obtuse 135&#176;' in Zone C y=260. Title: Types of Angles.`;
    if (t.includes("parallel") && t.includes("angle"))
      return `Two horizontal parallel lines in Zone A: Line 1 at y=160 from x=170 to x=530; Line 2 at y=340 from x=170 to x=530. Transversal diagonal from (190,420) to (510,80). Mark all 8 angles at intersections. Colour corresponding angles (F-shape) same fill #bfdbfe. Colour alternate angles (Z-shape) same fill #bbf7d0. Colour co-interior angles (C-shape) same fill #fef9c3. Labels in Zone B: 'Corresponding angles (equal)' y=140, 'Alternate angles (equal)' y=200, 'Co-interior angles (add to 180°)' y=260. Title: Angles in Parallel Lines.`;
    if (t.includes("area") || t.includes("perimeter"))
      return `Rectangle in Zone A: x=200 y=120 width=300 height=180 fill=#dbeafe. Label '8 cm' in Zone E (below bottom edge, x=350 y=445). Label '5 cm' in Zone C (right of right edge, x=560 y=210). Formula box 1 in Zone E: rect x=160 y=430 w=180 h=30 fill=#fef9c3, text 'Area = 8 × 5 = 40 cm&#178;'. Formula box 2 in Zone E: rect x=360 y=430 w=190 h=30 fill=#dcfce7, text 'Perimeter = 2(8+5) = 26 cm'. Title: Area and Perimeter.`;
    if (t.includes("probability") || t.includes("tree diagram"))
      return `Horizontal number line in Zone A: from (170,250) to (530,250) with arrow. Five tick marks with labels in Zone D (y=48): x=170 'Impossible', x=255 'Unlikely', x=350 'Even chance', x=445 'Likely', x=530 'Certain'. Small vertical ticks at each point. Below line at y=320: spinner circle cx=350 cy=340 r=50 divided into 4 sectors, one shaded #bfdbfe; label 'P = 1/4' in Zone E y=455. Title: Probability Scale.`;
    if (t.includes("venn") || t.includes("set"))
      return `Two overlapping circles in Zone A: Circle 1 cx=290 cy=250 r=120 fill=#dbeafe opacity=0.7, Circle 2 cx=410 cy=250 r=120 fill=#dcfce7 opacity=0.7. Overlap region (intersection) fill=#f3e8ff. Label 'A only' in Zone B y=250 with leader to left region. Label 'A ∩ B' in Zone D x=350 with leader to overlap. Label 'B only' in Zone C y=250 with leader to right region. Outer rectangle in Zone A. Label 'Universal set ξ' in Zone D x=200. Title: Venn Diagram — Set Notation.`;
    if (t.includes("sequence") || t.includes("nth term"))
      return `Horizontal sequence in Zone A: four squares at y=200, spaced 80px apart from x=200 to x=440. Square 1 (x=200): contains dots in 1×1 grid fill=#6366f1. Square 2 (x=280): 2×2 grid fill=#6366f1. Square 3 (x=360): 3×3 grid fill=#6366f1. Square 4 (x=440): 4×4 grid fill=#6366f1. Labels in Zone E: 'Term 1: 1' x=200; 'Term 2: 4' x=280; 'Term 3: 9' x=360; 'Term 4: 16' x=440. Arrow between squares in Zone D with '+3 →+5 →+7' labels. Formula in Zone B: 'nth term = n&#178;'. Title: Sequences — Square Numbers.`;
    if (t.includes("ratio") || t.includes("proportion"))
      return `Bar divided into parts in Zone A: rect x=170 y=200 w=360 h=80 fill=none stroke=#1e293b. Divide into 5 equal parts (w=72 each). First 2 parts fill=#6366f1, last 3 fill=#10b981. Label '2 parts' with brace in Zone D over first 2. Label '3 parts' with brace in Zone D over last 3. Below bar: label 'Ratio 2:3' in Zone E x=350. Two example bars below at y=320: one showing 2/5 shaded, one 3/5 shaded. Labels in Zone B and C. Title: Ratio — 2:3.`;
    if (t.includes("percentage") || t.includes("percent"))
      return `Large square in Zone A: x=175 y=80 w=350 h=280 divided into 10×10=100 small squares. 30 squares shaded fill=#6366f1 (top-left 3 columns). Label '30 out of 100 = 30%' in Zone E. Arrow pointing to shaded in Zone B: '30%'. Multiplier formula boxes: Zone C y=200 'Increase by 20%: × 1.20'; Zone C y=240 'Decrease by 15%: × 0.85'. Title: Percentages.`;
    if (t.includes("scatter") || t.includes("correlation"))
      return `Coordinate axes in Zone A: x-axis from (170,380) to (530,380) labelled 'Hours Revised' in Zone E; y-axis from (170,380) to (170,60) labelled 'Test Score' in Zone B y=220. Plot ~10 dots showing positive correlation (bottom-left to top-right): (200,340),(230,300),(270,280),(310,260),(340,220),(380,200),(410,180),(450,160),(490,140). Line of best fit from (185,360) to (510,120) stroke=#ef4444 stroke-dasharray=6. Label 'Line of best fit' in Zone C y=200. Label 'Positive correlation' in Zone D x=350. Title: Scatter Graph.`;
    if (t.includes("box") || t.includes("whisker") || t.includes("interquartile"))
      return `Horizontal number line in Zone A: from (180,250) to (520,250) with tick marks every 40px labelled 0-17. Box: rect x=280 y=200 w=140 h=100 fill=#dbeafe stroke=#1e293b stroke-width=2. Median line inside box at x=340, y=200 to y=300. Left whisker: (180,250)→(280,250). Right whisker: (420,250)→(520,250). Labels in Zone D: 'Min=0' x=180; 'Q1=7' x=280; 'Median=9' x=340; 'Q3=11' x=420; 'Max=16' x=520. Label 'IQR = Q3-Q1 = 4' in Zone E x=350. Title: Box Plot (Box and Whisker).`;
    if (t.includes("histogram"))
      return `Coordinate axes in Zone A: x-axis from (180,380) to (520,380) labelled 'Class intervals' in Zone E; y-axis from (180,380) to (180,60) labelled 'Frequency density' in Zone B y=220. Draw 5 bars of varying heights (no gaps): bar1 x=180 w=60 h=120 fill=#dbeafe; bar2 x=240 w=80 h=200 fill=#bbf7d0; bar3 x=320 w=60 h=160 fill=#fef9c3; bar4 x=380 w=60 h=80 fill=#fce7f3; bar5 x=440 w=60 h=40 fill=#ffedd5. Labels in Zone E below each bar. Label 'Area = Frequency' in Zone C y=180. Title: Histogram — Frequency Density.`;
    if (t.includes("cumulative frequency"))
      return `Coordinate axes in Zone A: x-axis from (180,380) to (520,380) labelled 'Value' in Zone E; y-axis from (180,380) to (180,60) labelled 'Cumulative frequency' in Zone B y=220. Plot S-curve through points: (200,380),(240,360),(280,300),(320,220),(360,160),(400,110),(440,80),(480,65). Label points as crosses. Horizontal dashed lines from y=50%(midpoint) to curve then down to x-axis — label 'Median' in Zone B. Horizontal lines at 25% and 75% similarly — labels 'LQ' and 'UQ' in Zone B. Title: Cumulative Frequency Graph.`;
    if (t.includes("vector"))
      return `Coordinate grid in Zone A with x-axis and y-axis. Three vectors as arrows: Vector a from (200,300) to (340,200) — label 'a' in Zone B; Vector b from (340,200) to (460,280) — label 'b' in Zone C; Resultant a+b from (200,300) to (460,280) as dashed arrow — label 'a+b' in Zone E. Right-angle triangle under vector a showing column vector annotation. Column vectors in Zone B: a = (2,3), b = (3,-2). Title: Vectors.`;
    if (t.includes("transformation") || t.includes("reflection") || t.includes("rotation") || t.includes("translation") || t.includes("enlargement"))
      return `Coordinate axes in Zone A: x from (170,320) to (530,320); y from (350,420) to (350,60). Original triangle at (280,200)(320,200)(300,160) fill=#dbeafe. Reflected triangle across x-axis at (280,340)(320,340)(300,380) fill=#dcfce7. Translated copy at (380,200)(420,200)(400,160) fill=#fef9c3. Rotation of original by 90° fill=#fce7f3. Labels in Zone B: 'Original' y=190; 'Reflection' y=350. Labels in Zone C: 'Translation' y=190; 'Rotation' y=270. Mirror line (x-axis) labelled in Zone E. Title: Transformations.`;
    if (t.includes("3d") || t.includes("volume") || t.includes("surface area") || t.includes("cuboid") || t.includes("cylinder") || t.includes("cone") || t.includes("sphere") || t.includes("prism"))
      return `Three 3D shapes in Zone A, spread horizontally. Left (x=220,y=220): cuboid drawn with perspective lines fill=#dbeafe, dimensions labelled l w h. Centre (x=350,y=220): cylinder with elliptical top and bottom fill=#dcfce7, radius r and height h labelled. Right (x=480,y=220): cone with elliptical base fill=#fef9c3, radius and height labelled. Formulas in Zone E: 'V=lwh'; 'V=πr²h'; 'V=⅓πr²h'. Title: 3D Shapes — Volume Formulas.`;
    if (t.includes("loci") || t.includes("construction") || t.includes("bisect"))
      return `Perpendicular bisector construction in Zone A: line segment AB from (200,280) to (500,280). Two equal arcs above and below the line from A and B (radius > half AB), intersecting at (350,150) and (350,410). Perpendicular bisector drawn through intersections as dashed line. Right-angle mark at midpoint (350,280). Labels in Zone B: 'A' x=200 y=280; 'Equal arcs from A' y=180. Labels in Zone C: 'B' x=500 y=280; 'Equal arcs from B' y=380. Label 'Perpendicular bisector' in Zone D. Title: Perpendicular Bisector Construction.`;
    if (t.includes("surds") || t.includes("indices") || t.includes("powers") || t.includes("standard form") || t.includes("scientific notation"))
      return `Two columns in Zone A showing index laws. Left column (x=200): boxes fill=#dbeafe each showing a law with example: 'a&#x6d;×a&#x6e;=a&#x6d;&#x207a;&#x6e;', 'a&#x6d;÷a&#x6e;=a&#x6d;&#x207b;&#x6e;', '(a&#x6d;)&#x6e;=a&#x6d;&#x6e;'. Right column (x=380): worked examples. Arrows from law to example. Labels in Zone D: 'Index Law' and 'Example'. Formula for standard form in Zone E: 'A×10&#x6e; where 1≤A<10'. Title: Index Laws.`;
    if (t.includes("equation") || t.includes("algebra") || t.includes("solve"))
      return `Balance scales in Zone A: fulcrum triangle at (350,350). Left pan circle cx=255 cy=270 r=60 fill=#dbeafe, containing '3x+5'. Right pan circle cx=445 cy=270 r=60 fill=#dcfce7, containing '20'. Balance bar from (200,210) to (500,210) stroke=#1e293b stroke-width=4. Steps in Zone B y=100 to y=200: 'Step 1: subtract 5'; 'Step 2: divide by 3'. Answer box in Zone E: rect fill=#fef9c3 'x = 5'. Title: Solving Equations — Balance Method.`;
    if (t.includes("number line") || t.includes("integer") || t.includes("negative number"))
      return `Horizontal number line in Zone A: from (170,250) to (530,250) with arrow both ends. Tick marks every 36px. Labels in Zone E: -5 at x=170, -4, -3, -2, -1, 0 at x=350, 1, 2, 3, 4, 5 at x=530. Highlighted dot at -3 fill=#ef4444 with label in Zone B. Highlighted dot at 4 fill=#10b981 with label in Zone C. Double-headed arrow showing distance between them labelled '7' in Zone D. Title: The Number Line — Negative Numbers.`;
    if (t.includes("place value") || t.includes("decimal"))
      return `Place value table in Zone A: rect x=175 y=100 w=350 h=260. Divide into 7 columns: 'Millions','HTh','TTh','Th','H','T','U'. Row 1 (headers) fill=#6366f1 text white. Row 2 (values) fill=#dbeafe: 0,0,3,4,5,7,2 one per cell. Row 3 (example 2): 0,0,0,8,0,6,0 fill=#dcfce7. Label '= 34,572' in Zone B y=160. Label '= 8,060' in Zone B y=220. Decimal point column between U and tenths if needed. Title: Place Value.`;
    if (t.includes("prime") || t.includes("factor") || t.includes("multiple") || t.includes("hcf") || t.includes("lcm"))
      return `Factor tree in Zone A: '60' in oval at top (cx=350 cy=110). Two branches to '6' (cx=270 cy=200) and '10' (cx=430 cy=200). From '6': branches to '2' (cx=230 cy=310) and '3' (cx=310 cy=310). From '10': branches to '2' (cx=390 cy=310) and '5' (cx=470 cy=310). Prime numbers circled fill=#6366f1 text white. Label '60 = 2 × 2 × 3 × 5' in Zone E. Venn diagram in Zone B showing HCF/LCM of two numbers. Title: Prime Factor Tree.`;
    return `Clear mathematical diagram for this topic in Zone A. All measurement labels in Zone B, C, D, or E. Formula boxes may be placed in Zone E. Short leader lines only.`;
  }
  if (s === "chemistry") {
    if (t.includes("atom") || t.includes("electron") || t.includes("bohr") || t.includes("atomic structure"))
      return `Bohr model in Zone A: nucleus filled circle cx=350 cy=250 r=20 fill=#fca5a5. Shell 1: circle cx=350 cy=250 r=70 fill=none stroke=#1e293b; 2 electron dots evenly spaced. Shell 2: circle r=130; 8 electron dots. Shell 3 (if needed): circle r=190; dots. Labels in Zone C: 'Nucleus' at y=180 with leader line to centre; 'Shell 1' at y=230; 'Shell 2' at y=260; 'Shell 3' at y=290. Labels in Zone B: 'Protons + Neutrons' at y=180 with leader line. Title: Atomic Structure (Bohr Model).`;
    if (t.includes("bond") || t.includes("molecule"))
      return `Structural molecule in Zone A: central atom circle cx=350 cy=250 r=35 fill=#fce7f3, symbol inside. Bonded atoms: 3-4 smaller circles r=25 fill=#dbeafe connected by bond lines. Bond lines clearly separated, not overlapping. Atom symbols inside each circle. Labels in Zone B and C: element names with leader lines to each atom. Title: Molecular Structure.`;
    if (t.includes("reaction") || t.includes("equation"))
      return `Reaction diagram in Zone A: reactants on left (x=180-260), large arrow pointing right at centre (x=310-390) with 'Conditions' label in Zone D, products on right (x=420-500). Each molecule as labelled circle/shape. Labels in Zone B for reactants, Zone C for products. Title: Chemical Reaction.`;
    if (t.includes("periodic") || t.includes("element"))
      return `Large element tile in Zone A: rect x=250 y=130 w=200 h=200 fill=#dbeafe stroke=#1e293b stroke-width=3. Inside: atomic number top-left (font-size=16), element symbol centred (font-size=48 bold), element name below symbol (font-size=14), relative atomic mass bottom (font-size=14). Labels in Zone B: 'Atomic Number'; Zone C: 'Relative Atomic Mass'; Zone D: 'Element Symbol'; Zone E: 'Element Name'. Title: Periodic Table Element.`;
    return `Accurate chemistry diagram for this topic in Zone A. Labels in Zone B and C connected by short leader lines.`;
  }
  if (s === "physics") {
    if (t.includes("wave") || t.includes("sound") || t.includes("light") || t.includes("transverse"))
      return `Transverse wave in Zone A: centre line y=250 from x=170 to x=530. Draw a smooth sinusoidal wave: 2 complete cycles. Crests at (230,170) and (400,170). Troughs at (315,330) and (485,330). Amplitude arrow: vertical double-headed line from (230,250) to (230,170) — label 'Amplitude' in Zone B y=210. Wavelength arrow: horizontal double-headed line from (230,170) to (400,170) at y=155 — label 'Wavelength (&#955;)' in Zone D x=315. Label 'Crest' in Zone D x=230. Label 'Trough' in Zone E x=315. Label 'Centre line' in Zone B y=250. Formula 'v = f &#215; &#955;' in Zone C y=340. Title: Transverse Wave.`;
    if (t.includes("circuit") || t.includes("electric"))
      return `Series circuit in Zone A: rectangular wire path with corners at (200,130),(500,130),(500,380),(200,380). Battery symbol on top-left wire at (200,130)-(300,130): two vertical lines (longer=positive). Bulb symbol on top-right at (400,130)-(500,130): circle with X. Switch symbol on bottom wire at (300,380)-(400,380): gap with angled line. Current arrows on wires (clockwise). Labels in Zone B: 'Battery' y=130; Zone C: 'Bulb' y=130; Zone E: 'Switch' x=350; Zone B: 'Conventional current (clockwise)' y=260. Title: Simple Electric Circuit.`;
    if (t.includes("force") || t.includes("newton"))
      return `Free body diagram in Zone A: object rect x=280 y=200 w=140 h=100 fill=#dbeafe. Arrows: UP from (350,200) to (350,100) — label 'Normal Force (N)' in Zone D x=350; DOWN from (350,300) to (350,400) — label 'Weight (W=mg)' in Zone E x=350; RIGHT from (420,250) to (520,250) — label 'Applied Force (F)' in Zone C y=250; LEFT from (280,250) to (180,250) — label 'Friction (f)' in Zone B y=250. All arrows stroke-width=3. Title: Free Body Diagram.`;
    if (t.includes("speed") || t.includes("velocity") || t.includes("acceleration"))
      return `Distance-time graph in Zone A: x-axis from (180,390) to (520,390) labelled 'Time (s)' in Zone E; y-axis from (180,390) to (180,80) labelled 'Distance (m)' in Zone B y=235. Three segments: (1) horizontal line (180,390)→(270,390) — label 'Stationary' in Zone B y=390; (2) diagonal (270,390)→(390,230) — label 'Constant speed' in Zone C y=310; (3) steeper diagonal (390,230)→(480,100) — label 'Faster speed' in Zone C y=165. Grid lines optional. Title: Distance-Time Graph.`;
    return `Accurate physics diagram for this topic in Zone A. Use standard physics symbols. Labels in Zone B, C, D, E with short leader lines.`;
  }
  if (s === "science" || s === "biology") {
    if (t.includes("plant") && t.includes("cell"))
      return `Plant cell in Zone A: outer rect x=175 y=80 w=350 h=300 fill=#dcfce7 stroke=#1e293b stroke-width=3 (cell wall). Inner rect x=185 y=90 w=330 h=280 fill=none stroke=#1e293b stroke-dasharray=5 (cell membrane). Large central rect x=210 y=140 w=280 h=180 fill=#bbf7d0 (vacuole). Nucleus ellipse cx=290 cy=210 rx=45 ry=35 fill=#fef9c3 with smaller ellipse inside (nucleolus). Two chloroplast ellipses rx=25 ry=15 fill=#86efac at (380,160) and (430,260). Mitochondria small ellipses fill=#fed7aa. Labels in Zone C (x=555-640): 'Cell Wall' y=130, 'Cell Membrane' y=160, 'Vacuole' y=200, 'Nucleus' y=230, 'Nucleolus' y=260, 'Chloroplast' y=290, 'Mitochondria' y=320. Each with short leader line to its structure. Title: Plant Cell.`;
    if (t.includes("animal") && t.includes("cell"))
      return `Animal cell in Zone A: outer ellipse cx=350 cy=250 rx=170 ry=140 fill=#fef9c3 stroke=#1e293b stroke-width=2 (cell membrane/cytoplasm). Nucleus ellipse cx=320 cy=230 rx=65 ry=50 fill=#fde68a stroke=#1e293b (nucleus). Nucleolus small circle cx=320 cy=225 r=15 fill=#fbbf24 (nucleolus). Three mitochondria ellipses rx=30 ry=15 fill=#fed7aa at (430,180),(450,280),(380,340). Labels in Zone C (x=555-640): 'Cell Membrane' y=160, 'Cytoplasm' y=200, 'Nucleus' y=240, 'Nucleolus' y=280, 'Mitochondria' y=320. Each with short leader line. Title: Animal Cell.`;
    if (t.includes("cell") && !t.includes("fuel"))
      return `Animal cell in Zone A: outer ellipse cx=350 cy=250 rx=170 ry=140 fill=#fef9c3 (cytoplasm). Nucleus ellipse cx=320 cy=230 rx=65 ry=50 fill=#fde68a. Nucleolus circle cx=320 cy=225 r=15 fill=#fbbf24. Mitochondria ellipses fill=#fed7aa. Labels in Zone C: 'Cell Membrane', 'Cytoplasm', 'Nucleus', 'Nucleolus', 'Mitochondria' — each with short leader line. Title: Animal Cell.`;
    if (t.includes("photosynthesis"))
      return `Leaf cross-section in Zone A: outer rect x=175 y=90 w=350 h=280 fill=#dcfce7 stroke=#1e293b. Palisade layer: tall rects at top (y=90 to y=170) fill=#86efac. Spongy layer: irregular shapes (y=170 to y=280) fill=#bbf7d0. Guard cells at bottom. Labels in Zone B: 'Palisade Cells' y=130, 'Spongy Mesophyll' y=220, 'Guard Cells' y=340. Arrows in Zone C: 'CO&#8322; in' arrow entering from right y=350; 'O&#8322; out' arrow leaving right y=120; 'Light energy' arrow from Zone D entering top. Equation in Zone E: '6CO&#8322; + 6H&#8322;O &#8594; C&#8326;H&#8321;&#8322;O&#8326; + 6O&#8322;'. Title: Photosynthesis.`;
    if (t.includes("heart") || t.includes("circulatory"))
      return `Heart in Zone A: draw heart outline as two rounded humps at top (atria) and pointed bottom at (350,390). Septum vertical line down the middle. Four chambers: Right Atrium (top-right) fill=#fce7f3, Left Atrium (top-left) fill=#dbeafe, Right Ventricle (bottom-right) fill=#fce7f3, Left Ventricle (bottom-left) fill=#dbeafe. Labels in Zone B: 'Left Atrium' y=160, 'Left Ventricle' y=290, 'Pulmonary Vein' y=110, 'Aorta' y=80. Labels in Zone C: 'Right Atrium' y=160, 'Right Ventricle' y=290, 'Vena Cava' y=110, 'Pulmonary Artery' y=80. Curved flow arrows inside chambers. Title: The Human Heart.`;
    if (t.includes("mitosis") || t.includes("cell division"))
      return `Four mitosis stages in 2x2 grid in Zone A: each cell as circle r=70. Top-left (230,170): 'Prophase' — X-shaped chromosomes inside; label in Zone D x=230. Top-right (470,170): 'Metaphase' — chromosomes lined at centre; label in Zone D x=470. Bottom-left (230,340): 'Anaphase' — chromosomes pulled apart; label in Zone E x=230. Bottom-right (470,340): 'Telophase' — two nuclei forming; label in Zone E x=470. Title: Stages of Mitosis.`;
    if (t.includes("digestive") || t.includes("digestion"))
      return `Digestive system in Zone A: vertical arrangement of organs. Mouth rect at top (310,80). Oesophagus narrow rect (330,120)→(370,170). Stomach J-shape at (280,180) w=140 h=90 fill=#fef9c3. Small intestine coiled path at centre (300,290) fill=#dcfce7. Large intestine wider U-shape at (250,350) fill=#ffedd5. Rectum at bottom (320,420). Labels in Zone B: 'Mouth' y=90, 'Oesophagus' y=145, 'Stomach' y=225. Labels in Zone C: 'Small Intestine' y=290, 'Large Intestine' y=370, 'Rectum' y=420. Title: The Digestive System.`;
    return `Accurate biological diagram for this topic in Zone A. Labels in Zone B and C connected by short straight leader lines. No label inside Zone A.`;
  }
  if (s === "geography") {
    if (t.includes("river") || t.includes("meander") || t.includes("erosion") || t.includes("deposition"))
      return `River meander in Zone A: draw an S-curve river path using a thick blue path (stroke=#3b82f6 stroke-width=20 fill=none) from (175,100) curving to (350,250) then to (525,400). On outer bends: red shading ellipse fill=#fca5a5 opacity=0.5. On inner bends: yellow shading fill=#fef08a opacity=0.5. Labels in Zone B: 'Erosion (outer bank)' y=140, 'Deposition (inner bank)' y=320, 'Floodplain' y=240. Labels in Zone C: 'Meander' y=200, 'Slip-off slope' y=370. Title: River Meander Processes.`;
    if (t.includes("volcano") || t.includes("tectonic") || t.includes("plate boundary"))
      return `Volcano cross-section in Zone A: cone polygon points=(350,80),(175,400),(525,400) fill=#ffedd5 stroke=#1e293b. Magma chamber ellipse cx=350 cy=370 rx=100 ry=40 fill=#fca5a5. Main vent rect x=335 y=120 w=30 h=250 fill=#f97316. Secondary vent angled rect on left side. Crater opening at top. Lava flow lines down sides fill=#ef4444. Tectonic plates: two rects below y=400. Labels in Zone B: 'Magma Chamber' y=370, 'Main Vent' y=250, 'Lava Flow' y=200. Labels in Zone C: 'Crater' y=100, 'Secondary Vent' y=220, 'Tectonic Plates' y=430. Title: Volcano Cross-Section.`;
    if (t.includes("coast") || t.includes("cliff") || t.includes("wave"))
      return `Coastal erosion in Zone A: cliff face polygon on right (x=420-540, y=80-400) fill=#d4a574. Sea on left (x=175-420, y=200-400) fill=#dbeafe. Wave arrow from (175,300) to (420,300) with arrowhead. Notch at cliff base (420,350). Labels in Zone B: 'Hydraulic Action' y=200, 'Abrasion' y=250, 'Attrition' y=300, 'Solution' y=350. Labels in Zone C: 'Cliff Face' y=200, 'Notch' y=350, 'Beach (collapsed material)' y=420. Title: Coastal Erosion Processes.`;
    if (t.includes("weather") || t.includes("climate") || t.includes("water cycle"))
      return `Water cycle in Zone A: sun circle cx=490 cy=100 r=40 fill=#fef08a. Ocean rect x=175 y=320 w=200 h=100 fill=#dbeafe. Mountain polygon at right (430,320),(530,150),(630,320) fill=#d1d5db. Cloud ellipse cx=330 cy=130 rx=70 ry=40 fill=#f1f5f9. Arrows: 'Evaporation' from (275,320) up to (290,170) in Zone B y=250; 'Condensation' from (290,170) to (330,130) in Zone D x=310; 'Precipitation' from (330,170) down to (400,320) in Zone C y=250; 'Surface Run-off' from (430,350) to (375,350) in Zone E x=400; 'Infiltration' downward arrow in Zone E x=300. Title: The Water Cycle.`;
    return `Clear geographical diagram for this topic in Zone A. Labels in Zone B, C, D, E with short leader lines.`;
  }
  if (s === "history")
    return `Horizontal timeline in Zone A: thick line from (175,250) to (525,250) with arrowhead. Five event markers as filled circles evenly spaced at x=210,280,350,420,490 y=250. Odd events (1,3,5): vertical line UP to y=140, then rect w=90 h=45 fill=#eef2ff stroke=#6366f1 with year bold and event text (font-size=10). Even events (2,4): vertical line DOWN to y=360, then rect fill=#f0fdf4 stroke=#22c55e. All rects in Zone A. No text overlaps. Title: Historical Timeline.`;
  if (s === "english" || s === "literacy")
    return `Mind map in Zone A: central oval cx=350 cy=250 rx=80 ry=45 fill=#e0e7ff with topic text bold. Six branches at 60&#176; intervals as straight lines length=130. Each branch ends in smaller oval rx=60 ry=30 fill=#f0f9ff with label inside. Branches and ovals must not overlap each other. Title: as the topic name.`;
  return `Clear educational diagram for this topic in Zone A (x=160-540, y=55-420). Labels in Zone B (x=55-150), C (x=550-645), D (y=45-52), or E (y=435-465). Short leader lines. No overlapping elements.`;
}

function buildDiagramPrompt(subject: string, topic: string, yearGroup: string, sendNeed?: string): { system: string; user: string } {
  const hint = getDiagramHintServer(subject, topic);
  const sendAdapt = sendNeed
    ? `SEND: font-size="16" minimum, stroke-width="3" outlines, max 6 labels, high-contrast colours, large bold arrows.`
    : `font-size="13" minimum labels, stroke-width="2" outlines.`;

  const system = `You are a specialist educational SVG diagram generator for UK school worksheets.
Canvas: 700×500px. viewBox="0 0 700 500".

STRICT ZONE-BASED LAYOUT — follow exactly:
────────────────────────────────────────────────────────────────────────────────
ZONE A — DIAGRAM AREA: x=160 to x=540, y=55 to y=420. All shapes go here.
ZONE B — LEFT LABELS: x=55 to x=150. Labels for shapes on the left half of Zone A.
ZONE C — RIGHT LABELS: x=550 to x=645. Labels for shapes on the right half of Zone A.
ZONE D — TOP LABELS: y=45 to y=52. Labels for shapes at the top of Zone A.
ZONE E — BOTTOM LABELS: y=435 to y=465. Labels for shapes at the bottom of Zone A.
TITLE: x=350, y=30, text-anchor="middle", font-size="16", font-weight="bold".

RULES (non-negotiable):
1. Output ONLY valid SVG. Start: <svg viewBox="0 0 700 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">. End: </svg>. Nothing before or after.
2. First element: <rect width="700" height="500" fill="white"/>.
3. Every label MUST be in Zone B, C, D, or E — NEVER inside Zone A (except axis labels on graphs and formulas).
4. Each label connects to its shape with a SHORT leader line (max 90px). Leader lines must NEVER cross each other.
5. Multiple labels on the same zone side: space them at least 22px apart vertically.
6. All text: font-family="Arial, sans-serif", fill="#1e293b".
7. Shapes: pale fills (#dbeafe blue, #dcfce7 green, #fef9c3 yellow, #fce7f3 pink, #ffedd5 orange, #f3e8ff purple), stroke="#1e293b" stroke-width="2".
8. Arrows: define in <defs>: <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#1e293b"/></marker>. Use marker-end="url(#arr)".
9. ${sendAdapt}
10. SPECIAL CHARACTERS — use HTML entities ONLY: &#178; (superscript 2), &#179; (superscript 3), &#176; (degree), &#955; (lambda), &#960; (pi), &#8594; (right arrow), &#8592; (left arrow). For subscripts use <tspan baseline-shift="sub" font-size="10">2</tspan>.
11. SCIENTIFIC ACCURACY: correct labels, proportions, and relationships for UK school level.
12. After </svg> write: CAPTION: [one sentence describing the diagram]

PR-M4 — OVERLAP & READABILITY HARD RULES (zero tolerance):
13. Every <text> element MUST set text-anchor explicitly ("start" / "middle" / "end") and MUST sit fully inside Zone B, C, D or E. Never inside Zone A except axis tick labels and inline formula tokens.
14. Every <text> MUST have font-size >= 12 (>= 16 if SEND adaptations apply). No rotated labels: rotation is only allowed for Y-axis tick labels on graphs.
15. Maintain a >= 8px clear margin between any two <text> elements AND between any <text> and any <line>, <path>, <rect>, <circle>, <polygon> or <ellipse> stroke. If a label would otherwise overlap, push it further into its zone and use a leader line instead.
16. Labels referring to a Zone-A element MUST connect via a thin leader line (stroke-width 1) ending at the element's anchor point — they must NEVER sit on top of the element.
17. No element may extend outside the 700×500 viewBox. No coordinate may be negative.`;

  const user = `Draw a professional educational SVG diagram for a UK school worksheet.

Subject: ${subject} | Topic: ${topic} | Year: ${yearGroup}

Diagram specification (follow coordinates exactly where given):
${hint}

REMINDER: All labels in Zone B (x=55-150), C (x=550-645), D (y=45-52), or E (y=435-465). No label inside Zone A (x=160-540, y=55-420). Short leader lines only. No crossing lines.`;

  return { system, user };
}

// ── POST /api/ai/diagram — dedicated diagram generation with fallback chain ───
router.post("/diagram", requireAuth, async (req: Request, res: Response) => {
  const { subject, topic, yearGroup, sendNeed, slot } = req.body;
  if (!subject || !topic) return res.status(400).json({ error: "subject and topic required" });

  // slot: 'A' = first/best match, 'B' = second-best match (different image)
  const diagramSlot = String(slot || 'A').toUpperCase();

  const yr = yearGroup || "Year 9";
  const subjectLower = String(subject).toLowerCase();
  const topicLower = String(topic).toLowerCase();
  const combined = `${subjectLower} ${topicLower}`;

  const fitMeta = {
    maxWidth: 560,
    maxHeight: 300,
    objectFit: "contain",
    printSafe: true,
    preferLandscape: true,
  };

  const buildImageResponse = (payload: {
    imageUrl: string | null;
    caption?: string | null;
    attribution?: string | null;
    provider: string;
    type?: string;
    imageKind?: string;
    /** Optional inline SVG markup (used by AI-SVG path). When present the
     *  client renderer prefers `svg` over `imageUrl`. */
    svg?: string;
  }) => ({
    imageUrl: payload.imageUrl,
    caption: payload.caption || `${topic} — ${subject} (${yr})`,
    attribution: payload.attribution || null,
    provider: payload.provider,
    type: payload.type || (payload.svg ? "svg" : payload.imageUrl ? "image" : "none"),
    imageKind: payload.imageKind || "diagram",
    fit: fitMeta,
    ...(payload.svg ? { svg: payload.svg } : {}),
  });

  // ── Step 0: SVG templates DISABLED — all diagrams must come from the admin library ──────
  // SVG template fallback removed per product requirement: only admin library images are used.
  // If no admin library image is found, the diagram section is silently skipped.

  // ── Step 1: Admin diagram library (DB — 1722 curated educational diagrams) ──
  // This is the ONLY image source. No Wikimedia or external URLs are used.
  try {
    // Map slot to diagram_type for precise filtering (eliminates A/B duplication)
    const diagramTypeFilter = diagramSlot === 'B' ? 'diagram_b'
      : diagramSlot === 'REVISION' ? 'revision_map'
      : 'diagram_a';
    // Fast targeted query: filter by diagram_type + subject + topic at DB level.
    // Also filter out broken entries (image_url starting with '[FAILED]')
    const subjectPat = `%${subjectLower}%`;
    const topicWords = topicLower.split(/\s+/).filter((w: string) => w.length > 3);
    const topicPat = topicWords.length > 0 ? `%${topicWords[0]}%` : `%${topicLower}%`;
    const brokenFilter = `image_url NOT LIKE '[FAILED]%' AND image_url IS NOT NULL AND image_url != ''`;
    // ── Topic LIKE construction ────────────────────────────────────────────
    // Previously the filter only used the FIRST significant topic word, e.g.
    // "Solving linear equations" -> "%solving%" — which excluded library rows
    // titled "Linear equations — Diagram A". This was the main reason maths
    // topics never returned a diagram even when one existed. We now build an
    // OR across every meaningful topic word (>=4 letters) and also probe the
    // tags column, so the post-query relevance scorer has a real candidate
    // pool to choose from. This change widens the pre-filter only — the
    // scorer further down still enforces hard relevance gates.
    const topicWordPatterns: string[] = topicWords.length > 0
      ? topicWords.map((w: string) => `%${w}%`)
      : [`%${topicLower}%`];
    const topicConditionParts = topicWordPatterns.map((_, idx) =>
      `(LOWER(topic) LIKE $${idx + 3} OR LOWER(title) LIKE $${idx + 3} OR LOWER(COALESCE(tags, '')) LIKE $${idx + 3})`
    );
    const topicCondition = topicConditionParts.join(" OR ");
    let targetedRows = await dbQuery(
      `SELECT id, title, subject, topic, year_group, image_url, description, tags, curated, diagram_type
       FROM diagram_library
       WHERE diagram_type = $1
         AND (LOWER(subject) LIKE $2 OR LOWER(title) LIKE $2)
         AND (${topicCondition})
         AND ${brokenFilter}
       ORDER BY curated DESC, subject ASC, title ASC
       LIMIT 80`,
      [diagramTypeFilter, subjectPat, ...topicWordPatterns]
    );
    // Do not fall back to subject-only at DB level. Subject-only matches are the
    // main source of irrelevant diagrams; the post-query scorer below can only
    // select from topic-bearing candidates, otherwise the section remains blank.
    // If still no results (diagram_type column not yet migrated on this DB), fall back to title-based type filtering
    // Handles BOTH em-dash (—) and en-dash (–) used in different entry title formats
    if (targetedRows.rows.length === 0) {
      const titleTypeCondition = diagramSlot === 'B'
        ? `(LOWER(title) LIKE '%diagram b%' OR LOWER(title) LIKE '% – diagram b%' OR LOWER(title) LIKE '%— b%' OR LOWER(title) LIKE '%– b%')`
        : diagramSlot === 'REVISION'
          ? `(LOWER(title) LIKE '%revision map%' OR LOWER(title) LIKE '%revision mat%' OR LOWER(title) LIKE '%revision sheet%')`
          : `(LOWER(title) NOT LIKE '%diagram b%' AND LOWER(title) NOT LIKE '%revision map%' AND LOWER(title) NOT LIKE '%revision mat%')`;
      // Same OR-based topic filter for the legacy fallback path so the
      // pre-migration code path benefits from the broadened maths matching.
      const fbTopicConditionParts = topicWordPatterns.map((_, idx) =>
        `(LOWER(topic) LIKE $${idx + 2} OR LOWER(title) LIKE $${idx + 2} OR LOWER(COALESCE(tags, '')) LIKE $${idx + 2})`
      );
      const fbTopicCondition = fbTopicConditionParts.join(" OR ");
      targetedRows = await dbQuery(
        `SELECT id, title, subject, topic, year_group, image_url, description, tags, curated,
                COALESCE(diagram_type, 'diagram_a') as diagram_type
         FROM diagram_library
         WHERE (LOWER(subject) LIKE $1 OR LOWER(title) LIKE $1)
           AND (${fbTopicCondition})
           AND ${titleTypeCondition}
           AND ${brokenFilter}
         ORDER BY curated DESC, subject ASC, title ASC
         LIMIT 80`,
        [subjectPat, ...topicWordPatterns]
      );
    }
    // Slot-level subject-only fallbacks removed: a missing topic-specific B/A
    // diagram is safer than a wrong diagram that undermines teacher trust.
    const entries: any[] = targetedRows.rows;

    if (entries.length > 0) {
      const subjectFamily = (s: string) => {
        const v = s.toLowerCase().trim();
        if (["biology", "chemistry", "physics", "science", "combined science", "triple science"].includes(v)) return "science";
        if (["math", "maths", "mathematics"].includes(v)) return "maths";
        return v;
      };
      const requestedTopicKey = canonicalTopicKey(topicLower);
      const isMathsRequest = subjectFamily(subjectLower) === "maths";
      // Score each entry for relevance with hard topic gates.
      const scored = entries.map((e) => {
        const eSubject = (e.subject || "").toLowerCase().trim();
        const eTopic = (e.topic || "").toLowerCase().trim();
        const eTitle = (e.title || "").toLowerCase().trim();
        const eYearGroup = (e.year_group || "").toLowerCase().trim();
        const eTags: string[] = (() => {
          try { return JSON.parse(e.tags || "[]").map((t: string) => String(t).toLowerCase().trim()); } catch { return []; }
        })();
        const searchable = [eTopic, eTitle, ...eTags].filter(Boolean).join(" ");
        const entryTopicKey = canonicalTopicKey(eTopic || eTitle || eTags.join(" "));
        const canonicalMatch = entryTopicKey === requestedTopicKey || topicsMatch(eTopic || eTitle, topicLower);
        const subjectMatch = !eSubject || eSubject === subjectLower || subjectFamily(eSubject) === subjectFamily(subjectLower) || eSubject.includes(subjectLower) || subjectLower.includes(eSubject);
        const yrLower = yearGroup ? yearGroup.toLowerCase() : "";
        const yrNum = yrLower.match(/(\d+)/)?.[1];
        const yearGroupMatch = !yrLower || !eYearGroup || eYearGroup === yrLower || (!!yrNum && (eYearGroup.includes(yrNum) || eTitle.includes(`year ${yrNum}`)));
        const topicWords2 = topicLower.split(/\s+/).filter((w: string) => w.length > 3);
        const matchedWords = topicWords2.filter((tw: string) => searchable.includes(tw));
        const passesGate = subjectMatch && yearGroupMatch && (canonicalMatch || matchedWords.length >= Math.min(2, topicWords2.length || 1));
        let score = 0;
        if (subjectMatch) score += 25;
        if (yearGroupMatch) score += 12;
        if (canonicalMatch) score += 80;
        // Bumped from *6 capped at 18 to *10 capped at 32 so partial-match
        // entries (the typical case for maths topics, e.g. library row
        // "Linear equations" matching worksheet topic "Solving linear
        // equations") can clear the acceptance threshold without needing
        // a perfect canonical-key match.
        score += Math.min(matchedWords.length * 10, 32);
        if (e.curated) score += 8;
        if (!passesGate) score = -100;
        return { entry: e, score, passesGate };
      }).filter(s => s.passesGate);

      scored.sort((a, b) => b.score - a.score);
      // Threshold lowered for maths-family searches: maths library entries
      // rarely share a canonical topic key with the worksheet topic phrasing
      // (e.g. "Adding fractions" vs library "Fractions"), so requiring score
      // >= 90 was effectively excluding maths from the diagram pipeline. We
      // still require the passesGate hard checks (subject + year + topic
      // relevance) so this only widens *acceptance*, not *eligibility*.
      const acceptanceThreshold = isMathsRequest ? 60 : 90;
      const best = scored.find(s => s.score >= acceptanceThreshold);
      if (best) {
        console.log(`[Diagram] Admin library match for "${topic}" (${subject}) slot=${diagramSlot} type=${diagramTypeFilter}: "${best.entry.title}" score=${best.score} threshold=${acceptanceThreshold}`);
        return res.json(buildImageResponse({
          imageUrl: best.entry.image_url,
          caption: `${best.entry.title} — ${subject} (${yr})`,
          attribution: null,
          provider: "admin-library",
          imageKind: "diagram",
        }));
      }
    }
  } catch (dbErr) {
    console.warn("[Diagram] Admin library lookup failed:", dbErr);
  }

  // ── Steps 2 & 3: Local static banks DISABLED — only admin library images are used ──────
  // (Local static bank fallbacks removed per product requirement)

  // ── Step 4: AI SVG generation (MATHS-ONLY, env-gated) ─────────────────────
  // PR-M4-followup. After every other source has missed, maths worksheets
  // can fall through to a freeform AI-generated SVG, gated by the strong
  // layout audit. If the audit fails, we retry ONCE with the failure detail
  // injected into the prompt; if the retry also fails, we fall back to
  // type:"none" so the renderer omits the diagram section entirely. Bad
  // diagrams never reach a teacher under any code path on this branch.
  //
  // Kill switch: set MATHS_AI_SVG_ENABLED=false to disable the AI SVG path
  // immediately without redeploying the rest of the stack. Default is
  // enabled. Non-maths subjects are unaffected regardless.
  //
  // PR-23 (audit item #54): admin-gate. The AI-SVG path is expensive and
  // produces variable quality. Until we have field data on every school's
  // tolerance, the path is gated behind both:
  //   - the existing MATHS_AI_SVG_ENABLED env flag (kill switch), AND
  //   - an explicit allow-list of school ids in
  //     MATHS_AI_SVG_ALLOWED_SCHOOL_IDS (comma-separated, lowercased), OR
  //     MATHS_AI_SVG_ADMIN_ONLY=true (admin-flagged users only).
  // When MATHS_AI_SVG_ALLOWED_SCHOOL_IDS is empty AND MATHS_AI_SVG_ADMIN_ONLY
  // is unset, we keep the legacy "all maths" behaviour for backwards
  // compatibility — schools never lose a feature on a deploy.
  const aiSvgEnabled = (process.env.MATHS_AI_SVG_ENABLED ?? "true").toLowerCase() !== "false";
  const isMathsRequest =
    subjectLower === "maths" ||
    subjectLower === "math" ||
    subjectLower === "mathematics";
  const allowedSchoolList = String(process.env.MATHS_AI_SVG_ALLOWED_SCHOOL_IDS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const adminOnly = (process.env.MATHS_AI_SVG_ADMIN_ONLY || "").toLowerCase() === "true";
  const reqUser = (req as any).user || {};
  const reqSchoolId = String(reqUser.schoolId || "").toLowerCase();
  const reqRole = String(reqUser.role || "").toLowerCase();
  const passesAdminGate =
    allowedSchoolList.length === 0 && !adminOnly
      ? true
      : (allowedSchoolList.length > 0 && allowedSchoolList.includes(reqSchoolId)) ||
        (adminOnly && (reqRole === "admin" || reqRole === "superadmin"));
  if (aiSvgEnabled && isMathsRequest && passesAdminGate) {
    const { system, user: baseUser } = buildDiagramPrompt(
      String(subject),
      String(topic),
      yr,
      typeof sendNeed === "string" && sendNeed.trim().length > 0 ? sendNeed : undefined,
    );
    // Pull both attempts inside a single try so any provider-side failure
    // collapses to the type:"none" fallback below.
    try {
      const schoolId = (req as any).user?.schoolId || undefined;

      // Returns { svg, caption, raw, provider } — never throws on parse.
      const callOnce = async (userPrompt: string) => {
        const { content, provider } = await callWithFallback(
          system,
          userPrompt,
          4000,
          undefined,
          schoolId,
        );
        let raw = String(content || "").trim();
        raw = raw.replace(/^```(?:svg|xml|html)?\s*/i, "").replace(/\s*```\s*$/i, "");
        const svgMatch = /<svg[\s\S]*?<\/svg>/i.exec(raw);
        const svg = svgMatch ? svgMatch[0] : "";
        let caption = "";
        const capMatch = /CAPTION\s*:\s*(.+?)\s*$/im.exec(raw);
        if (capMatch) caption = capMatch[1].trim();
        return { svg, caption, raw, provider };
      };

      // Compact summary the LLM can act on. Cap to 8 lines so the retry
      // prompt stays tight; anything beyond that is usually a knock-on of
      // the earlier issues.
      const summariseIssuesForRetry = (issues: Array<{ severity?: string; code?: string; message: string }>) => {
        const top = issues.slice(0, 8);
        const lines = top.map((it, i) => `${i + 1}. [${it.severity || it.code || 'layout'}] ${it.message}`);
        if (issues.length > top.length) lines.push(`...and ${issues.length - top.length} more.`);
        return lines.join("\n");
      };

      const first = await callOnce(baseUser);
      if (first.svg) {
        const firstReport = checkSvgLayout(first.svg);
        if (firstReport.pass) {
          console.log(`[Diagram] AI SVG generated for "${topic}" (${subject}) provider=${first.provider} attempt=1`);
          return res.json(buildImageResponse({
            imageUrl: null,
            caption: first.caption || `${topic} — ${subject} (${yr})`,
            attribution: null,
            provider: `ai-svg:${first.provider}`,
            type: "svg",
            imageKind: "diagram",
            svg: first.svg,
          }));
        }
        // Retry ONCE with the audit summary appended verbatim so the LLM
        // can act on the specific failure detail.
        const retryUser = `${baseUser}\n\nPREVIOUS ATTEMPT FAILED THE LAYOUT AUDIT WITH THE FOLLOWING ISSUES — fix every one of them in the next attempt:\n${summariseIssuesForRetry(firstReport.issues)}`;
        const second = await callOnce(retryUser);
        if (second.svg) {
          const secondReport = checkSvgLayout(second.svg);
          if (secondReport.pass) {
            console.log(`[Diagram] AI SVG generated for "${topic}" (${subject}) provider=${second.provider} attempt=2 (retry)`);
            return res.json(buildImageResponse({
              imageUrl: null,
              caption: second.caption || `${topic} — ${subject} (${yr})`,
              attribution: null,
              provider: `ai-svg:${second.provider}:retry`,
              type: "svg",
              imageKind: "diagram",
              svg: second.svg,
            }));
          }
          console.warn(`[Diagram] AI SVG retry still failed audit for "${topic}" — falling through to none. issues=${secondReport.issues.length}`);
        } else {
          console.warn(`[Diagram] AI SVG retry returned no parseable <svg> for "${topic}" — falling through to none.`);
        }
      } else {
        console.warn(`[Diagram] AI SVG first attempt returned no parseable <svg> for "${topic}" — falling through to none.`);
      }
    } catch (svgErr: any) {
      console.warn(`[Diagram] AI SVG generation failed for "${topic}":`, svgErr?.message || svgErr);
    }
  }

  console.log(`[Diagram] No diagram found for "${topic}" (${subject}) — returning not-available`);
  return res.json(buildImageResponse({
    imageUrl: null,
    caption: `No diagram available for ${topic}`,
    attribution: null,
    provider: "none",
    type: "none",
    imageKind: "none",
  }));
});

// ── Worksheet Upload & Adapt ─────────────────────────────────────────────────
// POST /api/ai/adapt-worksheet
// Accepts a PDF or Word (.doc/.docx) file and adapts it for a specific SEND need.
// The original content is preserved verbatim — only formatting/presentation changes.
router.post("/adapt-worksheet", requireAuth, worksheetUpload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { sendNeed, yearGroup } = req.body;
  if (!sendNeed) return res.status(400).json({ error: "sendNeed is required" });

  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedMimes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Only PDF (.pdf) and Word (.doc, .docx) files are supported." });
  }

  try {
    let rawText = "";
    const mime = req.file.mimetype;

    if (mime === "application/pdf") {
      // Method 1: pdf-parse (default export — the v2 class API doesn't exist in this package version)
      try {
        const pdfParse = (await import("pdf-parse" as any)).default;
        const result = await pdfParse(req.file.buffer);
        rawText = (result?.text || "").trim();
        if (rawText) console.log(`[adapt-worksheet] pdf-parse extracted ${rawText.length} chars`);
      } catch (e1: any) {
        console.warn("[adapt-worksheet] pdf-parse failed:", e1?.message);
      }
      // Method 2: pdfjs-dist fallback
      if (!rawText || rawText.length < 30) {
        try {
          const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js" as any);
          const lib = pdfjsLib.default || pdfjsLib;
          const pdfDoc = await lib.getDocument({ data: new Uint8Array(req.file.buffer) }).promise;
          const texts: string[] = [];
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const tc = await page.getTextContent();
            const pageText = tc.items.map((item: any) => item.str || "").join(" ").replace(/\s{2,}/g, " ").trim();
            if (pageText) texts.push(pageText);
          }
          rawText = texts.join("\n\n");
          if (rawText) console.log(`[adapt-worksheet] pdfjs extracted ${rawText.length} chars`);
        } catch (e2: any) {
          console.warn("[adapt-worksheet] pdfjs failed:", e2?.message);
        }
      }
    } else {
      // Word document — mammoth
      try {
        const mammoth = await import("mammoth" as any);
        const lib = mammoth.default || mammoth;
        const html = await lib.convertToHtml({ buffer: req.file.buffer });
        if (html?.value && html.value.length > 50) {
          rawText = html.value
            .replace(/<h[1-6][^>]*>/gi, "\n\n## ")
            .replace(/<\/h[1-6]>/gi, "\n")
            .replace(/<p[^>]*>/gi, "\n")
            .replace(/<\/p>/gi, "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<li[^>]*>/gi, "\n• ")
            .replace(/<\/li>/gi, "")
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
            .trim();
        }
        if (!rawText || rawText.length < 20) {
          const raw = await lib.extractRawText({ buffer: req.file.buffer });
          rawText = (raw?.value || "").trim();
        }
        if (rawText) console.log(`[adapt-worksheet] mammoth extracted ${rawText.length} chars`);
      } catch (e: any) {
        console.error("[adapt-worksheet] mammoth error:", e?.message);
      }
    }

    rawText = rawText
      .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
      .replace(/\t/g, "  ")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim();

    if (!rawText || rawText.length < 20) {
      return res.status(400).json({
        error: "Could not extract readable text from this file. The PDF may contain scanned images rather than selectable text. Please try a Word (.docx) version, or a PDF with selectable text.",
      });
    }

    const truncated = rawText.length > 10000;
    const textForAI = rawText.slice(0, 10000);
    const schoolId = req.user?.schoolId ?? undefined;
    const yr = yearGroup || "Year 9";

    // Comprehensive SEND formatting guide keyed by ID and common name variants
    const sendNeedLower = (sendNeed || "").toLowerCase().trim();
    const sendFormattingGuide = (() => {
      if (sendNeedLower.includes("dyslexia")) return "Dyslexia: Bold all key terms at first use. Break any paragraph longer than 3 lines into shorter ones. Add clear section dividers (---). Number all questions explicitly if not already numbered. Add a 'Key Vocabulary' box at the top if there are subject terms.";
      if (sendNeedLower.includes("asc") || sendNeedLower.includes("autism") || sendNeedLower.includes("asperger")) return "Autism/ASC: Number every instruction explicitly (Step 1, Step 2...). Add a 'What you need to do:' box before each section. Remove any figurative or ambiguous language from instructions. Use consistent terminology — pick one word per concept and never vary it.";
      if (sendNeedLower.includes("adhd")) return "ADHD: Add a ☐ tick box at the start of every question. Add 'BRAIN BREAK — stand up and stretch!' after every 4–5 questions. Bold the key action word in every instruction (e.g. Calculate, Describe, Name). Add visual dividers between questions.";
      if (sendNeedLower.includes("pda") || sendNeedLower.includes("odd")) return "PDA: Reframe all instructions as invitations ('You might like to...' rather than 'You must...'). Rename sections to offer choice ('Explore — choose where to start'). Add natural break points. Mark the challenge as optional.";
      if (sendNeedLower.includes("slcn") || sendNeedLower.includes("speech") || sendNeedLower.includes("language") || sendNeedLower.includes("communication")) return "SLCN: Add a Word Bank with plain-English definitions for all subject vocabulary. Add sentence frames for every answer requiring writing (e.g. 'The answer is ___ because ___'). Keep every sentence under 12 words. Replace open questions with fill-in-the-blank or matching where possible.";
      if (sendNeedLower.includes("mld") || sendNeedLower.includes("moderate learning")) return "MLD: Add a full model answer for question 1. Add a hint or sentence starter for every Section A question. Add a 'Help Box' with key facts/formulas at the top of Section B. Use KS2-level language throughout.";
      if (sendNeedLower.includes("dyscalculia")) return "Dyscalculia: Break every calculation into numbered sub-steps with blanks (Step 1: ___ Step 2: ___). Include a number line or key facts box. Show every arithmetic step in the worked example with 'why' annotations. Add real-world context to word problems.";
      if (sendNeedLower.includes("dyspraxia") || sendNeedLower.includes("dcd")) return "Dyspraxia/DCD: Replace extended writing with tick boxes, circle-the-answer, or matching formats wherever possible. Make answer boxes noticeably large. Reduce the number of questions requiring sustained handwriting.";
      if (sendNeedLower.includes("vi") || sendNeedLower.includes("visual impairment")) return "Visual Impairment: Add text descriptions for every diagram or image. Increase recommended font size to 18pt+. Add high-contrast section headers. Remove any content that relies solely on visual interpretation.";
      if (sendNeedLower.includes("hi") || sendNeedLower.includes("hearing")) return "Hearing Impairment: Ensure all instructions are fully self-contained in writing. Add a Word Bank with definitions. Remove any references to listening or audio activities. Add a visual cue (arrow, icon) next to every key instruction.";
      if (sendNeedLower.includes("tourette") || sendNeedLower.includes("tics")) return "Tourette's: Add natural pause/break points between sections. Remove any timed-pressure language ('quickly', 'in 2 minutes'). Use multiple response formats (tick, circle, fill-in) to reduce sustained writing demands.";
      if (sendNeedLower.includes("anxiety") || sendNeedLower.includes("semh") || sendNeedLower.includes("mental health")) return "Anxiety/SEMH: Rename Section A as 'Warm-Up — no pressure!'. Mark the challenge as 'OPTIONAL BONUS — only if you want to'. Add a supportive statement at the start of each section. Replace 'must/should' with 'try to/have a go at'.";
      if (sendNeedLower.includes("eal") || sendNeedLower.includes("english as an additional")) return "EAL: Bold all subject-specific vocabulary. Add a Key Vocabulary box at the top with plain-English definitions. Provide sentence frames for written answers. Remove UK-specific idioms. Keep instructions to max 15 words each.";
      return "SEND: Add clear numbered section headings. Bold all key terms. Add extra white space between questions. Number all questions if not already numbered.";
    })();

    const system = `You are an expert UK educational content specialist reformatting a worksheet for a student with ${sendNeed}.

ABSOLUTE RULES:
1. Every question, task, and instruction from the original MUST appear in the output word-for-word. Never paraphrase, simplify, or remove content.
2. All mathematical symbols (×, ÷, √, ², π, ≤, ≥, ≠), fractions, equations, and numbers must be preserved exactly.
3. The ONLY permitted changes are formatting/presentation changes specified in the SEND guidance below.
4. Do NOT add word banks, hints, worked examples, sentence starters, or scaffolding unless specifically instructed in the SEND guidance.
5. Return ONLY valid JSON — no markdown code fences, no text outside the JSON object.`;

    const user = `Reformat this worksheet for a student with ${sendNeed} in ${yr}.

SEND FORMATTING GUIDANCE (apply these changes only):
${sendFormattingGuide}

SECTION TYPES — map each section to one of these:
"objective" | "vocabulary" | "starter" | "example" | "guided" | "independent" | "challenge" | "questions" | "reminder-box" | "teacher-notes"

Return this exact JSON structure:
{
  "title": "exact title from original",
  "subtitle": "${yr} — Adapted for ${sendNeed}",
  "sections": [
    {
      "title": "section heading from original",
      "type": "guided",
      "content": "ALL original content reproduced verbatim with ONLY the permitted formatting changes applied",
      "teacherOnly": false
    }
  ],
  "teacherSection": {
    "title": "Teacher Notes",
    "type": "teacher-notes",
    "content": "List of formatting adaptations applied. Any mark scheme content from the original.",
    "teacherOnly": true
  },
  "adaptationsSummary": ["Brief description of each change made"]
}

ORIGINAL WORKSHEET:
${textForAI}${truncated ? "\n\n[Truncated at 10,000 characters]" : ""}`;

    const { content: aiResponse, provider } = await callWithFallback(system, user, 6000, undefined, schoolId);

    // Robust JSON parser
    const tryParse = (raw: string): any | null => {
      if (!raw?.trim()) return null;
      const attempts = [
        raw,
        raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim(),
      ];
      for (const s of attempts) {
        const m = s.match(/\{[\s\S]*\}/);
        const candidate = m ? m[0] : s;
        if (!candidate?.startsWith("{")) continue;
        try { return JSON.parse(candidate); } catch (_) {}
        try {
          const sanitized = candidate.replace(/"((?:[^"\\]|\\.)*)"/g, (_: string, inner: string) =>
            `"${inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`
          );
          return JSON.parse(sanitized);
        } catch (_) {}
      }
      return null;
    };

    let parsed = tryParse(aiResponse);

    if (!parsed?.sections?.length) {
      // Fallback: AI returned plain text or malformed JSON — wrap in a single section
      console.warn("[adapt-worksheet] JSON parse failed, using plain text fallback");
      const cleanText = aiResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      parsed = {
        title: req.file?.originalname?.replace(/\.[^.]+$/, "") || "Adapted Worksheet",
        subtitle: `${yr} — Adapted for ${sendNeed}`,
        sections: [
          { title: "Adapted Content", type: "guided", content: cleanText || textForAI, teacherOnly: false },
        ],
        teacherSection: {
          title: "Teacher Notes",
          type: "teacher-notes",
          content: `Formatted for ${sendNeed}. ${sendFormattingGuide}`,
          teacherOnly: true,
        },
        adaptationsSummary: [`Content reformatted for ${sendNeed}`],
      };
    } else {
      // Ensure all section content is a clean string
      parsed.sections = parsed.sections.map((s: any) => {
        let c = s.content;
        if (typeof c !== "string") c = Array.isArray(c) ? c.join("\n") : String(c ?? "");
        return { ...s, title: String(s.title || ""), content: c.trim() || "[Content unavailable]" };
      });
    }

    // Always add the teacher section if not present
    if (!parsed.sections.find((s: any) => s.teacherOnly)) {
      if (parsed.teacherSection) {
        parsed.sections.push({ ...parsed.teacherSection, teacherOnly: true });
      }
    }

    res.json({ adapted: parsed, provider });
  } catch (err: any) {
    console.error("[adapt-worksheet] error:", err);
    res.status(500).json({ error: err.message || "Failed to adapt worksheet" });
  }
});


// ── Generate Worksheet from Slides / Presentation ──────────────────────────
// POST /api/ai/worksheet-from-slides
// Accepts PDF, Word (.docx), or PPTX file and generates a full worksheet from it.
// Two-stage process: (1) extract text from file, (2) generate worksheet via AI.
router.post("/worksheet-from-slides", requireAuth, worksheetUpload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { yearGroup = "Year 10", subject = "General", sendNeeds = "" } = req.body;
  const schoolId = (req as any).user?.schoolId;
  const mime = req.file.mimetype;
  const originalName = req.file.originalname || "upload";

  try {
    // ── Step 1: Extract text from the uploaded file ──────────────────────────
    let extractedText = "";
    let slideCount = 0;

    const isPDF  = mime === "application/pdf" || originalName.endsWith(".pdf");
    const isDOCX = mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || originalName.endsWith(".docx");
    const isPPTX = mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || originalName.endsWith(".pptx");

    if (isPDF) {
      try {
        const pdfParse = (await import("pdf-parse" as any)).default;
        const result = await pdfParse(req.file.buffer);
        extractedText = result.text || "";
        console.log(`[worksheet-from-slides] PDF: ${extractedText.length} chars`);
      } catch (e: any) {
        console.warn("[worksheet-from-slides] pdf-parse failed:", e?.message);
        return res.status(422).json({ error: "Could not extract text from PDF. Please try a Word or PPTX file." });
      }
    } else if (isDOCX) {
      try {
        const mammoth = await import("mammoth" as any);
        const lib = mammoth.default || mammoth;
        const result = await lib.extractRawText({ buffer: req.file.buffer });
        extractedText = result.value || "";
        console.log(`[worksheet-from-slides] DOCX: ${extractedText.length} chars`);
      } catch (e: any) {
        console.warn("[worksheet-from-slides] mammoth failed:", e?.message);
        return res.status(422).json({ error: "Could not extract text from Word document." });
      }
    } else if (isPPTX) {
      try {
        // PPTX files are ZIP archives containing XML slide files
        const JSZip = (await import("jszip" as any)).default;
        const zip = await JSZip.loadAsync(req.file.buffer);
        const slideFiles = Object.keys(zip.files)
          .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
          .sort((a, b) => {
            const na = parseInt(a.match(/\d+/)?.[0] || "0");
            const nb = parseInt(b.match(/\d+/)?.[0] || "0");
            return na - nb;
          });
        slideCount = slideFiles.length;
        const slideTexts: string[] = [];
        for (const slideFile of slideFiles) {
          const xml = await zip.files[slideFile].async("string");
          // Extract text from <a:t> tags (PowerPoint text runs)
          const textMatches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
          const slideText = textMatches
            .map((m: string) => m.replace(/<[^>]+>/g, "").trim())
            .filter((t: string) => t.length > 0)
            .join(" ");
          if (slideText) slideTexts.push(`[Slide ${slideFiles.indexOf(slideFile) + 1}] ${slideText}`);
        }
        extractedText = slideTexts.join("\n\n");
        console.log(`[worksheet-from-slides] PPTX: ${slideCount} slides, ${extractedText.length} chars`);
      } catch (e: any) {
        console.warn("[worksheet-from-slides] PPTX parse failed:", e?.message);
        return res.status(422).json({ error: "Could not extract text from PPTX file." });
      }
    } else {
      return res.status(400).json({ error: "Unsupported file type. Please upload a PDF, Word (.docx), or PowerPoint (.pptx) file." });
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(422).json({ error: "Not enough text could be extracted from the file. Please ensure the file contains readable text (not just images)." });
    }

    // ── Step 2: Relevance-check the extracted content ────────────────────────
    // Truncate to 8000 chars to stay within token limits
    const contentForAI = extractedText.slice(0, 8000);
    const truncated = extractedText.length > 8000;

    // Detect topic from content (first 500 chars usually has the title/heading)
    const topicHint = extractedText.slice(0, 500).replace(/\s+/g, " ").trim();

    // ── Step 3: Generate the worksheet via AI ────────────────────────────────
    const isSTEM = /maths|mathematics|physics|chemistry|biology|science|computing|computer|technology|engineering/i.test(subject);
    const yearNum = parseInt(yearGroup.replace(/\D/g, "") || "10");
    const phase = yearNum <= 6 ? "KS1/KS2" : yearNum <= 9 ? "KS3" : yearNum <= 11 ? "GCSE" : "A-Level";

    const sendNote = sendNeeds
      ? `\nSEND ADAPTATIONS: This worksheet must be adapted for: ${sendNeeds}. Use clear language, short sentences, and scaffolded support.`
      : "";

    const isPrimaryPhase = yearNum <= 6;
    const primaryVocabRules = isPrimaryPhase ? `
PRIMARY SCHOOL VOCABULARY RULES (MANDATORY):
- Reading age ceiling: ${yearNum <= 2 ? '5–7 years. Max 6 words per instruction. Simple everyday words only.' : yearNum <= 4 ? '7–9 years. Max 10 words per instruction. No Latin/Greek-root words.' : '9–11 years. Max 12 words per instruction. Define every subject word in brackets.'}
- NEVER use: analyse, evaluate, assess, justify, synthesise, hypothesis, methodology, criterion, criteria, infer, deduce, extrapolate, correlate, quantify, magnitude.
- Use encouraging, child-friendly language. Activities must be varied: circle, tick, draw, match, fill in.` : '';

    const system = `You are an expert UK teacher creating a complete, print-ready worksheet based on provided lesson content.
You must generate a worksheet that directly tests and reinforces the content from the provided slides/document.
Every question must be answerable from the provided content — do not invent new topics.${primaryVocabRules}
Return ONLY valid JSON — no markdown, no explanation, no code blocks.`;

    const user = `Create a complete ${phase} worksheet for ${yearGroup} ${subject} based on the following lesson content.

LESSON CONTENT (extracted from uploaded ${isPPTX ? `presentation (${slideCount} slides)` : isDOCX ? "Word document" : "PDF"}):
${contentForAI}${truncated ? "\n\n[Content truncated — use the above to generate questions]" : ""}

TOPIC HINT (from start of content): "${topicHint.slice(0, 200)}"
${sendNote}

WORKSHEET REQUIREMENTS:
- All questions must be directly based on the provided content
- Include a mix of question types: recall, understanding, application
- ${isSTEM ? "Include at least one calculation or diagram question" : "Include at least one analysis or extended writing question"}
- Include a self-assessment section
- Include a teacher answer key

Return this exact JSON structure:
{
  "title": "Worksheet title based on the content",
  "subtitle": "${yearGroup} | ${subject} | ${phase}",
  "estimatedTime": "45 minutes",
  "sections": [
    {
      "title": "Section 1: Knowledge Check",
      "type": "starter",
      "content": "Question content here — use TRUE/FALSE, MCQ, or gap-fill format",
      "marks": 10,
      "teacherOnly": false
    },
    {
      "title": "Section 2: Understanding",
      "type": "guided",
      "content": "Questions testing understanding of the content",
      "marks": 15,
      "teacherOnly": false
    },
    {
      "title": "Section 3: Application",
      "type": "independent",
      "content": "Questions requiring application of knowledge from the content",
      "marks": 15,
      "teacherOnly": false
    },
    {
      "title": "Challenge Question",
      "type": "challenge",
      "content": "Higher-order thinking question based on the content",
      "marks": 10,
      "teacherOnly": false
    },
    {
      "title": "Self-Assessment",
      "type": "reflection",
      "content": "Confidence check table with 4-5 specific skills from this content",
      "marks": 0,
      "teacherOnly": false
    },
    {
      "title": "Answer Key",
      "type": "teacher-notes",
      "content": "Complete answers for all sections with mark allocations",
      "marks": 0,
      "teacherOnly": true
    }
  ],
  "totalMarks": 50,
  "sourceType": "${isPPTX ? "presentation" : isDOCX ? "document" : "pdf"}",
  "slideCount": ${slideCount}
}`;

    const { content: aiResponse, provider } = await callWithFallback(system, user, 6000, undefined, schoolId);

    // Robust JSON parser
    const tryParse = (raw: string): any | null => {
      if (!raw?.trim()) return null;
      const attempts = [
        raw,
        raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim(),
      ];
      for (const s of attempts) {
        const m = s.match(/\{[\s\S]*\}/);
        const candidate = m ? m[0] : s;
        if (!candidate?.startsWith("{")) continue;
        try { return JSON.parse(candidate); } catch (_) {}
        try {
          const sanitized = candidate.replace(/"((?:[^"\\]|\\.)*)"/g, (_: string, inner: string) =>
            `"${inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`
          );
          return JSON.parse(sanitized);
        } catch (_) {}
      }
      return null;
    };

    let parsed = tryParse(aiResponse);
    if (!parsed?.sections?.length) {
      console.warn("[worksheet-from-slides] JSON parse failed, using fallback");
      parsed = {
        title: originalName.replace(/\.[^.]+$/, "") + " — Worksheet",
        subtitle: `${yearGroup} | ${subject}`,
        estimatedTime: "45 minutes",
        sections: [
          { title: "Questions", type: "guided", content: aiResponse || contentForAI, marks: 50, teacherOnly: false },
        ],
        totalMarks: 50,
        sourceType: isPPTX ? "presentation" : isDOCX ? "document" : "pdf",
        slideCount,
      };
    }

    res.json({ worksheet: parsed, provider, slideCount, extractedLength: extractedText.length });
  } catch (err: any) {
    console.error("[worksheet-from-slides] error:", err);
    res.status(500).json({ error: err.message || "Failed to generate worksheet from slides" });
  }
});

// ── Phase F · curriculum-bank helpers (shared by differentiate + scaffold) ─
// Pure helper: scan a worksheet's sections for any stamped specRef anchors
// (FEAT-PB1 questionProvenance writes these at generation time). Sections
// can carry a top-level `specRef`, a `metadata.specRef`, or — when the
// section content holds an array of question objects — a per-question
// `specRef` field. We dedupe and return in encounter order.
function extractSourceSpecRefs(sections: any[]): string[] {
  if (!Array.isArray(sections)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sections) {
    if (!s || typeof s !== "object") continue;
    const candidates: any[] = [
      s.specRef,
      s.specRefRaw,
      s.metadata?.specRef,
      s.metadata?.specRefRaw,
    ];
    if (Array.isArray(s.content)) {
      for (const item of s.content) {
        if (item && typeof item === "object") {
          candidates.push(item.specRef, item.specRefRaw);
        }
      }
    }
    for (const cand of candidates) {
      if (typeof cand !== "string") continue;
      const norm = cand.trim();
      if (!norm) continue;
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}

// Resolve curriculum bank entries for a (board, subject, yearGroup, topic)
// query, preferring source-stamped specRefs when present and falling back
// to topic-substring matching. Returns an empty array when the bank has no
// data for this combo (callers degrade gracefully).
function resolveBankEntries(
  board: string | undefined | null,
  subject: string | undefined | null,
  yearGroup: string | undefined | null,
  topic: string | undefined | null,
  sourceSpecRefs: string[],
  tier: BankTier,
): CurriculumEntry[] {
  if (!board || !subject || !yearGroup) return [];
  const b = board.toLowerCase() as BankExamBoard;
  const entries: CurriculumEntry[] = [];

  // Prefer source-stamped specRefs.
  for (const ref of sourceSpecRefs.slice(0, 8)) {
    const e = lookupBySpecRef(b, subject, yearGroup, ref);
    if (e) entries.push(e);
  }

  // If nothing matched, fall back to topic-string lookup.
  if (entries.length === 0 && topic) {
    entries.push(...lookupByTopic(b, subject, yearGroup, topic, { limit: 6 }));
  }

  return filterByTier(entries, tier);
}

// Format the AO histogram targets as a single prompt-friendly line.
function formatAoTargetLine(tier: BankTier): string {
  const t = targetAoHistogramForTier(tier);
  return `AO TARGET DISTRIBUTION for ${tier.toUpperCase()} tier — AO1 ≈ ${Math.round(
    t.AO1 * 100,
  )}%, AO2 ≈ ${Math.round(t.AO2 * 100)}%, AO3 ≈ ${Math.round(
    t.AO3 * 100,
  )}%. Aim for this distribution across the differentiated questions.`;
}

// ── Differentiate Existing Worksheet (Foundation / Higher) ─────────────────
// POST /api/ai/differentiate-worksheet
// Takes existing worksheet sections and transforms them to a different difficulty tier.
// Much faster than regenerating from scratch — only adjusts question difficulty.
router.post("/differentiate-worksheet", requireAuth, async (req: Request, res: Response) => {
  const { sections, tier, subject, topic, yearGroup, title, examBoard } = req.body;
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: "sections array is required" });
  }
  if (!tier || (tier !== "foundation" && tier !== "higher")) {
    return res.status(400).json({ error: "tier must be 'foundation' or 'higher'" });
  }
  const schoolId = req.user?.schoolId ?? undefined;
  const yr = yearGroup || "Year 9";

  // Phase F · FEAT-PF1 — curriculum bank lookup. Pull tier-filtered exemplars
  // and AO targets from the spec-aligned bank so the LLM is shown a Higher /
  // Foundation question style on the SAME spec subset, not asked to "make
  // these existing questions harder/easier".
  const sourceSpecRefs = extractSourceSpecRefs(sections);
  const bankTier: BankTier = tier === "foundation" ? "foundation" : "higher";
  const bankEntries = resolveBankEntries(
    examBoard,
    subject,
    yearGroup,
    topic,
    sourceSpecRefs,
    bankTier,
  );
  const exemplarBlock = buildExemplarPromptBlock(bankEntries, {
    tier: bankTier,
    maxPerSpecRef: 2,
    maxTotal: 8,
  });
  const aoTargetLine = formatAoTargetLine(bankTier);
  // Tier-restricted spec list — the awarding-body's content for the chosen tier.
  const tierSpecList = bankEntries
    .map((e) => `${e.specPoint.specRef} ${e.specPoint.specTitle} (${e.specPoint.ao || "AO?"})`)
    .slice(0, 8)
    .join("\n");

  const tierRules = tier === "foundation"
    ? `FOUNDATION TIER RULES:
- Generate questions drawn ONLY from the FOUNDATION-or-both spec subset listed below.
- Do NOT introduce content tagged Higher-only (e.g. AQA C1.3.4 transition metals, B4.1.3 inverse-square photosynthesis, A19/A20 advanced algebra) — that would be off-tier.
- Use whole numbers, simple values and single-step problems where possible.
- Add hints, sentence starters or sub-parts (a)(b) on every question that requires extended reasoning.
- Skew the AO distribution to AO1 (recall + simple application).
- Word-bank vocabulary kept to ≤ 6 plain-English terms.`
    : `HIGHER TIER RULES:
- Generate questions drawn from the HIGHER-or-both spec subset listed below — including the Higher-only points (these are content the Foundation tier deliberately excludes).
- Section A starts at grade-5 demand — no trivial recall.
- Section B and Section C must include multi-step reasoning, "show that", "evaluate" or "prove" questions.
- Use precise mark-scheme language and notation (surds, algebraic generalisation, exact form).
- Skew the AO distribution towards AO2 and AO3 (analysis + evaluation).
- Challenge question is grade 8–9 demand: proof, multi-concept synthesis, or unfamiliar context.`;

  const tierContextBlock = bankEntries.length > 0
    ? `

CURRICULUM-BANK CONTEXT for this differentiation (use this — it is the
awarding-body's actual ${bankTier} tier content, not a generic prompt):

${aoTargetLine}

${bankTier.toUpperCase()}-tier spec subset to draw from:
${tierSpecList}
${exemplarBlock ? `\n${exemplarBlock}` : ""}
`
    : "";

  // Only send non-teacher sections to keep prompt short — strip word banks and worked examples
  // to reduce token count; we only need the question sections to adjust difficulty
  const pupilSections = (sections as any[]).filter(
    (s: any) => !s.teacherOnly && !/word.?bank|worked.?example|reminder.?box|key.?vocab|key.?formula|learning.?obj/i.test(s.title || "")
  );
  const existingContent = pupilSections.map((s: any, i: number) => {
    return `=== ${s.title || `Section ${i + 1}`} ===\n${(s.content || "").slice(0, 300)}`;
  }).join("\n\n").slice(0, 3000);

  const system = `You are an expert UK teacher differentiating a worksheet for ${yr} pupils. Transform the existing worksheet to ${tier} tier difficulty by drawing on the curriculum-bank context below — not by rewording the existing questions. The original worksheet is reference; the spec subset and exemplars are the source. Return valid JSON only. CRITICAL: The "content" field of every section MUST be a plain text string (NOT an array, NOT an object, NOT nested JSON). Write all questions as numbered plain text lines separated by newlines within the string.`;

  const user = `Transform this ${subject || ""} worksheet on "${topic || ""}" to ${tier.toUpperCase()} tier for ${yr}.

${tierRules}
${tierContextBlock}
EXISTING WORKSHEET (reference only — do NOT simply reword these questions; generate genuinely tier-appropriate replacements drawn from the spec subset above):
${existingContent}

Return a JSON object:
{
  "sections": [
    {"title": "original section title", "type": "guided", "content": "1. Question one\n2. Question two\n3. Question three", "teacherOnly": false}
  ],
  "tierApplied": "${tier}",
  "specRefsUsed": ["list of spec-refs from the curriculum bank that the new questions cover"],
  "changesNote": "brief summary of the tier-level differences (e.g. which Higher-only spec points were added, or which Higher-only content was excluded)"
}
IMPORTANT: The "content" value MUST be a plain text string with questions written as numbered lines. Do NOT use arrays or nested objects for content.`;

  try {
    const { content, provider } = await callWithFallback(system, user, 2000, undefined, schoolId);
    const tryParse = (raw: string): any | null => {
      try {
        const s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        const m = s.match(/\{[\s\S]*\}/);
        const candidate = m ? m[0] : s;
        try { return JSON.parse(candidate); } catch (_) {}
        const sanitized = candidate.replace(
          /"((?:[^"\\]|\\.)*)"/g,
          (_match: string, inner: string) => {
            const fixed = inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
            return `"${fixed}"`;
          }
        );
        return JSON.parse(sanitized);
      } catch (_) { return null; }
    };
    const parsed = tryParse(content);
    if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
      // Normalize all section content to strings to prevent frontend .replace() crashes
      parsed.sections = parsed.sections.map((s: any) => ({
        ...s,
        title: typeof s.title === 'string' ? s.title : String(s.title || ''),
        content: (() => {
          const c = s.content;
          if (typeof c === 'string') return c;
          if (c === null || c === undefined) return '';
          if (Array.isArray(c)) {
            // Array of question objects like {q: '...', a: '...'} or {question: '...', answer: '...'}
            return c.map((item: any) => {
              if (typeof item === 'string') return item;
              if (typeof item === 'object' && item !== null) {
                const q = item.q || item.question || item.text || item.content || '';
                const a = item.a || item.answer || '';
                const marks = item.marks ? ` [${item.marks} mark${item.marks > 1 ? 's' : ''}]` : '';
                if (q && a) return `${q}${marks}\n   Answer: ${a}`;
                if (q) return `${q}${marks}`;
                return JSON.stringify(item);
              }
              return String(item);
            }).join('\n\n');
          }
          if (typeof c === 'object') {
            const q = (c as any).q || (c as any).question || (c as any).text || (c as any).content || '';
            const a = (c as any).a || (c as any).answer || '';
            if (q && a) return `${q}\n   Answer: ${a}`;
            if (q) return q;
            try { return JSON.stringify(c); } catch { return String(c); }
          }
          return String(c);
        })(),
      }));
      res.json({
        differentiated: parsed,
        provider,
        // Phase F · FEAT-PF1 — surface bank context so the client / audit
        // panel can show which spec-refs and AO targets the LLM was given.
        bankContext: {
          tier: bankTier,
          specRefsShown: bankEntries.map((e) => e.specPoint.specRef),
          aoTarget: targetAoHistogramForTier(bankTier),
          exemplarsShown: bankEntries.reduce(
            (n, e) => n + e.exemplars.length,
            0,
          ),
        },
      });
    } else {
      res.status(500).json({ error: "AI returned invalid structure — please try again" });
    }
  } catch (err: any) {
    console.error("Differentiate worksheet error:", err);
    res.status(500).json({ error: err?.message || "Failed to differentiate worksheet" });
  }
});

// ── SEND Scaffold Existing Worksheet ────────────────────────────────────────
// POST /api/ai/scaffold-worksheet
// Takes existing worksheet sections and transforms them with real SEND scaffolding:
// gap fills, sentence starters, word banks, hint boxes — while preserving all content.
router.post("/scaffold-worksheet", requireAuth, async (req: Request, res: Response) => {
  const { sections, sendNeed, subject, topic, yearGroup, title, examBoard } = req.body;
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: "sections array is required" });
  }
  // sendNeed is optional — if not provided, apply general accessibility scaffolding
  const schoolId = req.user?.schoolId ?? undefined;
  const yr = yearGroup || "Year 9";
  const sn = (sendNeed || "").toLowerCase();

  // Phase F · FEAT-PF1 — curriculum bank lookup. Pull topic-aware scaffold
  // rows so the scaffolded version uses the topic's actual word bank,
  // sentence frames and step ladder rather than regex-class hints. Tier is
  // 'both' here because scaffolding is a SEND-support concern, not a
  // tier-of-paper concern.
  const sourceSpecRefs = extractSourceSpecRefs(sections);
  const scaffoldBankEntries = resolveBankEntries(
    examBoard,
    subject,
    yearGroup,
    topic,
    sourceSpecRefs,
    "both",
  );
  const bankScaffoldBlock = buildScaffoldPromptBlock(
    scaffoldBankEntries,
    sendNeed,
  );

  const buildLocalScaffold = (inputSections: any[], sendNeedLower: string) => {
    // Phase F · FEAT-PF1 — when curriculum bank has scaffold rows for this
    // topic, harvest the topic's actual word bank + sentence frames so the
    // local fallback is no longer regex-class hints. Falls back to the
    // legacy behaviour when no bank rows are available.
    const bankWordBankPairs: Array<{ term: string; definition: string }> = [];
    const bankSentenceFrames: string[] = [];
    const bankStepLadder: string[] = [];
    const bankPitfalls: string[] = [];
    for (const e of scaffoldBankEntries) {
      if (!e.scaffold) continue;
      bankWordBankPairs.push(...e.scaffold.wordBank);
      bankSentenceFrames.push(...e.scaffold.sentenceFrames);
      bankStepLadder.push(...e.scaffold.stepLadder);
      if (e.scaffold.commonPitfalls) bankPitfalls.push(...e.scaffold.commonPitfalls);
    }
    const haveBankScaffold = bankWordBankPairs.length > 0 || bankSentenceFrames.length > 0;

    const extractTerms = (content: string): string[] => {
      const matches = (content || "").match(/\b[A-Za-z][A-Za-z\-]{3,}\b/g) || [];
      const seen = new Set<string>();
      const out: string[] = [];
      for (const raw of matches) {
        const w = raw.trim();
        const key = w.toLowerCase();
        if (seen.has(key)) continue;
        if (["section","question","teacher","student","worksheet","learning","objectives","worked","example","reminder","challenge","common","mistakes","problem"].includes(key)) continue;
        seen.add(key);
        out.push(w);
        if (out.length >= 8) break;
      }
      return out;
    };

    const cleanLine = (line: string) => String(line || "")
      .replace(/^_+(?=[A-Za-z0-9(])/g, "")
      .replace(/[ \t]+$/g, "");

    const buildHeader = () => {
      if (sendNeedLower.includes("adhd")) {
        return [
          "Quick Start:",
          "1. Read one question only.",
          "2. Highlight the key number or word.",
          "3. Use the hint before you answer.",
          "4. Tick the question when you finish.",
          ""
        ].join("\n");
      }
      if (sendNeedLower.includes("asc") || sendNeedLower.includes("autism") || sendNeedLower.includes("asperger")) {
        return [
          "What you need to do:",
          "1. Read the instruction exactly.",
          "2. Complete the first part.",
          "3. Check your answer against the key word.",
          "4. Move to the next question.",
          ""
        ].join("\n");
      }
      if (sendNeedLower.includes("mld") || sendNeedLower.includes("moderate learning")) {
        return [
          "Help Box:",
          "- Read the question carefully.",
          "- Find the important word or number.",
          "- Answer one step at a time.",
          ""
        ].join("\n");
      }
      return [
        "Steps to follow:",
        "1. Read the question carefully.",
        "2. Find the key information.",
        "3. Use the hint if you need help.",
        "4. Check your answer at the end.",
        ""
      ].join("\n");
    };

    // Phase F · FEAT-PF1 — when the bank has a step ladder for this topic,
    // surface it as a topic-specific "Steps to follow" block before the
    // SEND-need header. Bank-first; legacy header stays as fallback.
    const buildTopicHeader = () => {
      if (bankStepLadder.length === 0) return "";
      const lines: string[] = ["Steps for this topic:"];
      bankStepLadder.slice(0, 6).forEach((step, i) => {
        lines.push(`${i + 1}. ${step}`);
      });
      lines.push("");
      return lines.join("\n");
    };

    // Bank pitfall cycling — each scaffolded question line gets a different
    // topic-specific hint when the bank has pitfalls for the topic.
    let pitfallCursor = 0;
    const nextBankPitfall = () => {
      if (bankPitfalls.length === 0) return "";
      const p = bankPitfalls[pitfallCursor % bankPitfalls.length];
      pitfallCursor += 1;
      return `Hint (common pitfall): ${p}`;
    };

    // Bank sentence-frame cycling — same idea for written answers.
    let frameCursor = 0;
    const nextBankFrame = () => {
      if (bankSentenceFrames.length === 0) return "";
      const f = bankSentenceFrames[frameCursor % bankSentenceFrames.length];
      frameCursor += 1;
      return `Sentence starter: ${f}`;
    };

    const buildHint = (line: string) => {
      const fromBank = nextBankPitfall();
      if (fromBank) return fromBank;
      if (/\d|=|\+|-|×|÷|\//.test(line)) return "Hint: Show one step at a time.";
      if (/explain|describe|why|how/i.test(line)) return "Hint: Use because in your answer.";
      if (/compare|difference|similar/i.test(line)) return "Hint: Write one point for each side.";
      return "Hint: Use the key word from the question in your answer.";
    };

    const buildSentenceStarter = (line: string) => {
      const fromBank = nextBankFrame();
      if (fromBank) return fromBank;
      if (/what type/i.test(line)) return "Sentence starter: This is a ______ angle because ______.";
      if (/explain|why/i.test(line)) return "Sentence starter: This happens because ______.";
      if (/describe/i.test(line)) return "Sentence starter: I can describe this as ______.";
      if (/how/i.test(line)) return "Sentence starter: First, ______. Then, ______.";
      if (/compare/i.test(line)) return "Sentence starter: One similarity is ______ and one difference is ______.";
      return "Sentence starter: The answer is ______ because ______.";
    };

    const scaffoldQuestionLine = (line: string) => {
      const cleaned = cleanLine(line);
      if (!cleaned.trim()) return "";
      const questionLike = /\?\s*$/.test(cleaned) || /(^|\s)(q\d+|question\s*\d+|problem\s*\d+|\d+[.)])/i.test(cleaned);
      if (!questionLike) return cleaned;
      const prefixed = /^\s*\[ \]/.test(cleaned) ? cleaned : `[ ] ${cleaned}`;
      return [prefixed, buildHint(cleaned), buildSentenceStarter(cleaned)].join("\n");
    };

    const addScaffoldToContent = (content: string, index: number) => {
      const original = String(content || "").replace(/\r/g, "").trim();
      const lines = original.split("\n");
      const transformed = lines.map(scaffoldQuestionLine).join("\n").replace(/\n{3,}/g, "\n\n").trim();
      // Topic header (from bank) lands above the SEND-need header so pupils
      // see "Steps for this topic" first, then their per-need help box.
      const topicHeader = buildTopicHeader();
      return `${topicHeader}${buildHeader()}${transformed}`.trim();
    };

    const allText = inputSections.map((s: any) => `${s.title || ""} ${s.content || ""}`).join(" \n ");
    // Phase F · FEAT-PF1 — when the bank has word-bank pairs for this
    // topic, use those (with proper definitions) instead of regex-extracted
    // tokens that have generic "key term used in this worksheet"
    // placeholders. Falls back to the legacy behaviour when no bank rows
    // are available.
    let wordBank: string;
    if (bankWordBankPairs.length > 0) {
      // Dedupe by lower-cased term so multiple bank rows don't double up.
      const seenWb = new Set<string>();
      const unique: Array<{ term: string; definition: string }> = [];
      for (const pair of bankWordBankPairs) {
        const k = pair.term.toLowerCase();
        if (seenWb.has(k)) continue;
        seenWb.add(k);
        unique.push(pair);
      }
      wordBank = unique
        .slice(0, 8)
        .map((p) => `${p.term} | ${p.definition}`)
        .join("\n");
    } else {
      const terms = extractTerms(allText);
      wordBank = terms.length
        ? terms.map((t) => `${t} | key term used in this worksheet`).join("\n")
        : "keyword | important word in the question\nmethod | the steps you use\nevidence | information that supports your answer\nanswer | what you write in response";
    }

    const scaffoldedSections = inputSections.map((section: any, index: number) => {
      const title = section.title || `Section ${index + 1}`;
      const normalizedType = index === 0 ? "guided" : (section.type || "guided");
      return {
        title,
        type: normalizedType,
        teacherOnly: !!section.teacherOnly,
        content: addScaffoldToContent(section.content || "", index),
      };
    });

    return {
      sections: scaffoldedSections,
      wordBank,
      scaffoldingApplied: [
        "Added a visible Word Bank with key vocabulary",
        "Added structured steps at the start of each section",
        "Added hints after question lines",
        "Added sentence starters for written responses",
        "Added tick boxes before question prompts",
        "Removed stray leading underscore placeholders",
      ],
    };
  };

  // Build per-condition scaffolding instructions
  const getScaffoldingRules = (sendNeedLower: string): string => {
    if (sendNeedLower.includes("dyslexia")) return `DYSLEXIA SCAFFOLDING RULES:
- Use 1.5x line spacing suggestions (add blank lines between questions)
- Bold all key terms and command words
- Break long sentences into shorter ones (max 15 words)
- Add a Word Bank box at the top with 6-8 key terms and simple definitions
- For every question that requires a written answer, add a sentence starter: e.g. "The answer is ___ because ___"
- Replace any gap-fill answers with clearly marked blanks: ___________
- Add a 'Steps to follow' box before each section
- Use numbered bullet points for multi-part instructions`;

    if (sendNeedLower.includes("adhd")) return `ADHD SCAFFOLDING RULES:
- Break the worksheet into very short chunks (max 3-4 questions per section)
- Add clear section dividers with bold headings
- Bold all key words and action verbs
- Add a 'Quick Start' box at the top: "You need to: 1) ___ 2) ___ 3) ___"
- For every question, add a hint in brackets: (Hint: start by...)
- Add tick boxes next to each question so students can track progress: [ ]
- Replace open-ended questions with structured answer frames where possible
- Add a 'Take a break here if you need to' prompt midway through
- Keep answer spaces generous and clearly marked`;

    if (sendNeedLower.includes("asc") || sendNeedLower.includes("autism") || sendNeedLower.includes("asperger")) return `AUTISM/ASC SCAFFOLDING RULES:
- Replace ALL figurative language and idioms with literal alternatives
- Add a 'What you need to do:' box at the start of every section listing exact steps
- For every question, add a worked identical example immediately before it labelled 'EXAMPLE:'
- Use consistent terminology throughout — never mix synonyms (always 'calculate', never 'find'/'work out')
- Add a numbered 'Steps to follow' checklist before each section
- Use neutral, factual contexts — remove any social/emotional scenarios
- Add a completion checklist at the end: '☐ Section A ☐ Section B ☐ Challenge'
- Make all instructions explicit — no implied steps`;

    if (sendNeedLower.includes("mld") || sendNeedLower.includes("moderate learning")) return `MLD SCAFFOLDING RULES:
- Add a 'Help Box' at the top of each section with key facts, formulas, and vocabulary
- For every question in Section A, add either: (a) a sentence starter, (b) a partially completed answer, or (c) a hint
- Replace multi-step questions with sub-parts (a) and (b)
- Add a fully completed model answer for the first question of each section
- Include a Word Bank with simple definitions
- Use concrete examples before abstract questions
- Add a simple text-based self-assessment at the end (e.g. tick boxes: 'I found this: Easy / OK / Hard')`;

    if (sendNeedLower.includes("slcn") || sendNeedLower.includes("speech") || sendNeedLower.includes("language") || sendNeedLower.includes("communication")) return `SLCN SCAFFOLDING RULES:
- Add a prominent Word Bank at the start with every key term defined in plain English (max 8 terms)
- For every question requiring a written answer, provide a sentence frame: e.g. '_____ is important because _____'
- Add a 'Key Phrases' box with useful language structures
- Convert at least 3 questions to matching, labelling, or multiple-choice format
- Use short, simple sentences — avoid complex clauses
- Bold the key action word in every instruction
- Add visual cues (arrows, boxes) alongside text`;

    if (sendNeedLower.includes("anxiety") || sendNeedLower.includes("mental health") || sendNeedLower.includes("semh")) return `ANXIETY/SEMH SCAFFOLDING RULES:
- Add a 'How are you feeling?' check-in at the start with tick boxes: 'Not great / OK / Good'
- Rename sections with encouraging labels: 'Warm-Up — no pressure!' and 'Main Practice — you've got this!'
- Add a positive statement before each section: 'You already know how to do this — let's practise!'
- Replace all 'must'/'should'/'need to' language with 'try to'/'you might like to'
- Label the challenge section: 'OPTIONAL BONUS — only if you want to!'
- Add a 'Tip' box in each section with a helpful reminder
- Add a 'Take a break here if you need to' prompt midway
- End with a 'How did you do?' scale using tick boxes: 'Tricky / Getting there / Got it!'`;

    if (sendNeedLower.includes("eal") || sendNeedLower.includes("esl") || sendNeedLower.includes("additional language")) return `EAL SCAFFOLDING RULES:
- Add a bilingual-friendly Word Bank at the start with every subject-specific term defined in plain English
- For every question, add a sentence frame in English
- Add a 'Key Phrases' box with useful academic language
- Include at least 2 visual/diagram-based questions
- Use simple, short sentences — avoid idioms and culturally specific references
- Bold key instruction words
- Use culturally neutral contexts throughout`;

    if (sendNeedLower.includes("dyspraxia") || sendNeedLower.includes("dcd") || sendNeedLower.includes("coordination")) return `DYSPRAXIA/DCD SCAFFOLDING RULES:
- Add large, clearly marked answer boxes after every question
- Convert at least 3 questions to tick-box, circle-the-answer, or matching format
- Add sentence frames for all written answer questions
- Use numbered bullet points for all instructions
- Add generous white space between all questions
- Minimise handwriting demands — use structured answer frames
- Keep instructions brief and clear`;

    if (sendNeedLower.includes("dyscalculia")) return `DYSCALCULIA SCAFFOLDING RULES:
- Add a 'Key Facts' box at the top with all formulas and number facts needed
- For every calculation question, add a partially completed working-out frame
- Provide a number line or multiplication grid as a reference tool
- Break every multi-step calculation into clearly numbered sub-steps
- Add a 'Check your answer' prompt after each question
- Use concrete examples (money, measurements) before abstract numbers
- Provide a worked example with every new question type`;

    // Default general SEND
    return `GENERAL SEND SCAFFOLDING RULES:
- Add a Word Bank at the top with 6-8 key terms and simple definitions
- For every question requiring a written answer, add a sentence starter or answer frame
- Add a 'Steps to follow' box before each section
- Add hints in brackets for every question: (Hint: ...)
- Break multi-step questions into sub-parts (a) and (b)
- Add tick boxes next to each question: [ ]
- Add generous white space between questions
- End with a simple self-assessment: 'I found this: [ ] Tricky  [ ] OK  [ ] Easy'`;
  };

  const scaffoldingRules = getScaffoldingRules(sn);

  // Serialize existing worksheet content
  const existingContent = (sections as any[]).map((s: any, i: number) => {
    return `=== SECTION ${i + 1}: ${s.title || 'Section'} ===\n${s.content || ''}`;
  }).join('\n\n');

  const system = `You are an expert SEND teacher specialising in creating scaffolded worksheets for UK schools.
Your task is to TRANSFORM an existing worksheet by adding real SEND scaffolding — gap fills, sentence starters, word banks, hint boxes, answer frames — while keeping EVERY original question, task, and piece of content VERBATIM.

CRITICAL RULES:
1. EVERY original question, instruction, and piece of content MUST appear in the output — do NOT remove or skip anything.
2. ALL mathematical symbols, operators, and notation must be preserved exactly: ×, ÷, √, ², ³, π, ≤, ≥, ≠, fractions, equations.
3. ALL numbers, values, and data must be identical to the original.
4. You MUST add real scaffolding: gap fills (___________), sentence starters, word banks, hint boxes, answer frames, step-by-step guides.
5. The scaffolding should be WOVEN INTO the existing content — not just added as a separate section.
6. Return a JSON array of sections matching the original structure, with scaffolding added to each section's content.
7. Do NOT invent new questions — only add scaffolding to existing ones.`;

  const user = `Transform this worksheet with ${sendNeed} scaffolding for ${yr} pupils.

${scaffoldingRules}
${bankScaffoldBlock ? `\n${bankScaffoldBlock}\n` : ""}
ORIGINAL WORKSHEET CONTENT (preserve every question verbatim, add scaffolding):
${existingContent.slice(0, 8000)}

Return a JSON object with this EXACT structure:
{
  "sections": [
    {
      "title": "Original section title",
      "type": "guided",
      "content": "The ORIGINAL content with SEND scaffolding woven in — gap fills, sentence starters, word banks, hints. Every original question preserved verbatim.",
      "teacherOnly": false
    }
  ],
  "wordBank": "Word Bank added at the top (if applicable for this SEND need)",
  "scaffoldingApplied": ["List of specific scaffolding changes made"]
}`;

  try {
    const { content, provider } = await callWithFallback(system, user, 4000, undefined, schoolId);

    const tryParseJSON = (raw: string): any | null => {
      try {
        const s = raw
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```\s*$/, '')
          .trim();
        const m = s.match(/\{[\s\S]*\}/);
        const candidate = m ? m[0] : s;
        try { return JSON.parse(candidate); } catch (_) {}
        const sanitized = candidate.replace(
          /"((?:[^"\\]|\\.)*)"/g,
          (_match: string, inner: string) => {
            const fixed = inner
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
            return `"${fixed}"`;
          }
        );
        return JSON.parse(sanitized);
      } catch (_) { return null; }
    };

    const parsed = tryParseJSON(content);
    if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
      // Merge AI-scaffolded sections back with originals to preserve imageUrl, svg,
      // caption, attribution, marks, questionNumber — the AI only rewrites text.
      const mergedSections = parsed.sections.map((s: any, i: number) => {
        const orig = (sections as any[])[i] || {};
        return {
          ...orig,
          ...s,
          id: orig.id || s.id,
          imageUrl: orig.imageUrl,
          svg: orig.svg,
          caption: orig.caption,
          attribution: orig.attribution,
          marks: orig.marks ?? s.marks,
          questionNumber: orig.questionNumber ?? s.questionNumber,
          teacherOnly: orig.teacherOnly ?? s.teacherOnly,
        };
      });
      res.json({ scaffolded: { ...parsed, sections: mergedSections }, provider });
    } else {
      // Fallback: return original sections with a note
      res.json({
        scaffolded: {
          sections: sections,
          scaffoldingApplied: ["Scaffolding could not be applied — please try again"],
        },
        provider,
        fallback: true,
      });
    }
  } catch (err: any) {
    console.error("Scaffold worksheet error:", err);
    const errMsg = err?.message || "Failed to scaffold worksheet";
    if (errMsg.includes("All AI providers failed") || errMsg.includes("429") || errMsg.includes("quota")) {
      return res.json({
        scaffolded: buildLocalScaffold(sections as any[], sn),
        provider: "local-fallback",
        fallback: true,
        warning: "AI providers were temporarily unavailable, so a built-in SEND scaffold was applied instead.",
      });
    }
    res.status(500).json({ error: errMsg });
  }
});

// ── Book Content — parse & cache a book file for grounded questions ─────────
//
// Year of Reading 2026 addition. Teachers upload the actual book (PDF /
// DOCX / TXT). We split it into pages, cache it for 24h keyed by a hash
// of the file (so re-uploading is a no-op), and return a bookId the
// client can pass to /book-questions to ground question generation in
// the real text — and only the pages the pupil has read.
router.post("/book-content", requireAuth, worksheetUpload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { title } = req.body as { title?: string };
  const schoolId = req.user?.schoolId ?? null;

  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  // Some browsers omit the mimetype for .txt — fall back to extension.
  const lowerName = (req.file.originalname || "").toLowerCase();
  const isTxtFallback = lowerName.endsWith(".txt") && !req.file.mimetype;
  if (!allowedMimes.includes(req.file.mimetype) && !isTxtFallback) {
    return res.status(415).json({
      error: `Unsupported book file type: ${req.file.mimetype || "unknown"}. Use PDF, Word, or plain text.`,
    });
  }

  try {
    let pages: string[] = [];
    if (req.file.mimetype === "application/pdf") {
      const { PDFParse } = await import("pdf-parse" as any);
      const parser = new PDFParse({ data: req.file.buffer, verbosity: 0 });
      await parser.load();
      const result = await parser.getText();
      if (result?.pages && Array.isArray(result.pages)) {
        pages = result.pages.map((p: any) => (p.text || "").trim());
      } else if (typeof result?.text === "string") {
        pages = paginateFlatText(result.text);
      }
    } else if (req.file.mimetype === "text/plain" || isTxtFallback) {
      pages = paginateFlatText(req.file.buffer.toString("utf-8"));
    } else {
      // Word .docx
      const mammoth = await import("mammoth" as any);
      const mammothLib = mammoth.default || mammoth;
      const result = await mammothLib.extractRawText({ buffer: req.file.buffer });
      pages = paginateFlatText(result.value || "");
    }

    pages = pages.map(p => p.trim()).filter(p => p.length > 0);
    if (pages.length === 0) {
      return res.status(422).json({ error: "Could not extract any readable text from this file." });
    }

    const bookId = computeBookId(req.file.buffer, schoolId);
    const byteSize = pages.reduce((sum, p) => sum + p.length, 0);
    const entry = setCachedBook({
      bookId,
      pages,
      filename: req.file.originalname || "book",
      title: (title || "").trim() || undefined,
      byteSize,
    });

    res.json({
      bookId: entry.bookId,
      totalPages: entry.pages.length,
      filename: entry.filename,
      title: entry.title || entry.filename,
      // Tiny preview so the UI can confirm the right book parsed correctly.
      preview: entry.pages[0]?.slice(0, 240) || "",
      cachedUntil: entry.createdAt + 24 * 60 * 60 * 1000,
    });
  } catch (err: any) {
    console.error("[book-content] parse error:", err);
    res.status(500).json({ error: err.message || "Failed to parse book file" });
  }
});

/**
 * Split a flat string of text into ~250-word pseudo-pages. Used for
 * DOCX and TXT inputs which don't carry true page boundaries. The size
 * mirrors a typical printed page so teacher page-range filtering still
 * lines up reasonably.
 */
function paginateFlatText(text: string, wordsPerPage = 250): string[] {
  if (!text) return [];
  // First, honour explicit form-feed (\f) markers if the file has them.
  if (text.includes("\f")) {
    return text.split("\f").map(s => s.trim()).filter(Boolean);
  }
  const words = text.split(/\s+/).filter(Boolean);
  const pages: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(" "));
  }
  return pages;
}

// ── Book Questions — generate comprehension questions for a book ─────────────
//
// Year of Reading 2026: this endpoint now supports two new modes on top
// of the original "title + page-range string only" behaviour:
//
//   1. Grounded mode — the client passes `bookContentId` from a prior
//      /book-content upload. We slice the cached pages and pass the
//      actual text to the AI, instructing it to ground every question
//      in the passage. The response carries `grounded: true`.
//
//   2. Per-reading-age criteria — the criteria file may now be .csv or
//      .xlsx with a "reading age" / "criteria" column pair, in which
//      case only the row matching the pupil's selected reading age is
//      sent to the AI. The response carries `criteriaSource` so the UI
//      can show "Using row for Year 4 (8–9)".
router.post("/book-questions", requireAuth, worksheetUpload.single("file"), async (req: Request, res: Response) => {
  const { bookTitle, author, readingAge, yearGroup, pagesFrom, pagesTo, chapterInfo, questionCount, bookContentId, vipersFocus, includeBookTalk } = req.body as Record<string, string | undefined>;
  if (!bookTitle) return res.status(400).json({ error: "bookTitle is required" });
  const schoolId = req.user?.schoolId ?? undefined;

  // ── Criteria file — now with .csv and .xlsx support ────────────────────
  let criteriaText = "";
  let criteriaSource: { type: "matched-row" | "flat" | "none"; matchedRow?: string } = { type: "none" };
  if (req.file) {
    const mt = req.file.mimetype || "";
    const lowerName = (req.file.originalname || "").toLowerCase();
    const isSpreadsheet =
      mt === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mt === "application/vnd.ms-excel" ||
      mt === "text/csv" ||
      mt === "application/csv" ||
      lowerName.endsWith(".csv") ||
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".xls");
    const isPdf = mt === "application/pdf";
    const isText = mt === "text/plain" || lowerName.endsWith(".txt");
    const isDocx = mt === "application/msword" ||
      mt === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    try {
      if (isSpreadsheet) {
        const parsed = await parseCriteriaFile(req.file.buffer, mt, req.file.originalname);
        const ageOrYear = readingAge || yearGroup || "";
        const picked = selectCriteriaForReadingAge(parsed, ageOrYear);
        criteriaText = picked.criteria.slice(0, 6000).trim();
        criteriaSource =
          picked.reason === "matched"
            ? { type: "matched-row", matchedRow: picked.matchedRow }
            : picked.reason === "flat"
            ? { type: "flat" }
            : { type: "none" };
      } else if (isPdf) {
        const { PDFParse } = await import("pdf-parse" as any);
        const parser = new PDFParse({ data: req.file.buffer, verbosity: 0 });
        await parser.load();
        const result = await parser.getText();
        if (result?.pages && Array.isArray(result.pages)) {
          criteriaText = result.pages.map((p: any) => p.text || "").join("\n\n");
        } else if (typeof result?.text === "string") {
          criteriaText = result.text;
        }
        criteriaText = criteriaText.slice(0, 6000).trim();
        criteriaSource = criteriaText ? { type: "flat" } : { type: "none" };
      } else if (isText) {
        criteriaText = req.file.buffer.toString("utf-8").slice(0, 6000).trim();
        criteriaSource = criteriaText ? { type: "flat" } : { type: "none" };
      } else if (isDocx) {
        const mammoth = await import("mammoth" as any);
        const mammothLib = mammoth.default || mammoth;
        const result = await mammothLib.extractRawText({ buffer: req.file.buffer });
        criteriaText = (result.value || "").slice(0, 6000).trim();
        criteriaSource = criteriaText ? { type: "flat" } : { type: "none" };
      }
    } catch (e: any) {
      console.warn("[book-questions] criteria file parse error:", e?.message);
    }
  }

  // ── Optional grounded passage from cached book content ─────────────────
  const fromPage = pagesFrom ? parseInt(String(pagesFrom), 10) : null;
  const toPage = pagesTo ? parseInt(String(pagesTo), 10) : null;
  let groundedPassage: { text: string; firstPage: number; lastPage: number; totalPages: number } | undefined;
  let groundedExpired = false;
  if (bookContentId) {
    const slice = getPageRangeText(
      bookContentId,
      Number.isFinite(fromPage as number) ? (fromPage as number) : null,
      Number.isFinite(toPage as number) ? (toPage as number) : null,
    );
    if (slice && slice.text) {
      groundedPassage = slice;
    } else {
      groundedExpired = true;
    }
  }
  const grounded = !!groundedPassage;
  // Trim grounded passage to keep us under provider context limits while
  // still leaving room for the prompt and JSON response.
  const groundedText = groundedPassage
    ? groundedPassage.text.slice(0, 12000)
    : "";

  const ageLabel = readingAge || yearGroup || "age-appropriate";
  const numQuestions = parseInt(questionCount || "8", 10) || 8;
  const pagesLabel = grounded
    ? `pages ${groundedPassage!.firstPage}–${groundedPassage!.lastPage}`
    : (fromPage && toPage
        ? `pages ${fromPage}–${toPage}`
        : (fromPage ? `from page ${fromPage}` : "the section they have read"));
  const authorLabel = author ? ` by ${author}` : "";

  // VIPERS framework — when supplied, bias the question type mix toward
  // the requested strands. Empty / absent ⇒ balanced.
  const VIPERS_LABEL: Record<string, string> = {
    V: "Vocabulary", I: "Inference", P: "Predict",
    E: "Explain", R: "Retrieve", S: "Sequence / Summarise",
  };
  const vipersIds = (vipersFocus || "").split(/[,\s]+/).filter(s => /^[VIPERS]$/.test(s));
  const vipersLabels = vipersIds.length > 0
    ? vipersIds.map(id => VIPERS_LABEL[id]).join(", ")
    : "balanced VIPERS coverage (Vocabulary, Inference, Predict, Explain, Retrieve, Sequence)";

  const wantsBookTalk = (includeBookTalk || "").toLowerCase() === "true";
  const bookTalkBlock = wantsBookTalk
    ? `\n\nALSO return a "bookTalk" array with 4 oracy / discussion sentence starters
suitable for guided reading conversation. Examples: "I think… because in the text…",
"The author's choice of word '…' makes me feel…", "I would change/agree/disagree with…".
These should be open-ended and reusable across the book, not tied to one specific page.`
    : "";

  const system = grounded
    ? `You are an expert UK primary and secondary school teacher specialising in reading comprehension and literacy assessment. You write comprehension questions GROUNDED in a specific passage of text. Every question you produce MUST be directly answerable from the passage provided. Do not draw on outside knowledge of the book.`
    : `You are an expert UK primary and secondary school teacher specialising in reading comprehension and literacy assessment. You generate high-quality, age-appropriate comprehension questions that genuinely test a pupil's understanding of a book or text they have read.`;

  const groundingBlock = grounded
    ? `\n\n=== EXACT PASSAGE THE PUPIL HAS READ (pages ${groundedPassage!.firstPage}–${groundedPassage!.lastPage} of ${groundedPassage!.totalPages}) ===\n${groundedText}\n=== END PASSAGE ===\n\nALL questions and teacher notes MUST refer only to events, characters, and language in the passage above. Do NOT invent details. If a vocabulary question targets a word, the word MUST appear verbatim in the passage.`
    : "";

  const user = `Generate ${numQuestions} comprehension questions for pupils who have just read ${pagesLabel} of the book "${bookTitle}"${authorLabel}.

Pupil reading age / level: ${ageLabel}
${yearGroup ? `Year group: ${yearGroup}` : ""}
${chapterInfo ? `\nContext / chapter summary provided by teacher:\n${chapterInfo}` : ""}
${criteriaText ? `\nAssessment criteria / mark scheme (base questions on this):\n${criteriaText}` : ""}
VIPERS focus: ${vipersLabels}${groundingBlock}${bookTalkBlock}

Use these "type" values to align with VIPERS:
- "vocabulary" (V — word meaning in context)
- "inference"  (I — read between the lines)
- "predict"    (P — what might happen next, why)
- "explain"    (E — author's choices, language, structure)
- "retrieve"   (R — find it in the text)
- "sequence"   (S — order or summarise events)

Requirements:
- ${grounded ? "Every question must be answerable ONLY from the passage above" : "Questions must be directly answerable from the pages the pupil has read"}
- ${vipersIds.length > 0 ? `At least 70% of questions must use these VIPERS strands: ${vipersIds.join(", ")}` : "Vary question types across the VIPERS strands (mix retrieve, inference, vocabulary, predict, explain, sequence)"}
- Match vocabulary and sentence complexity to the reading age: ${ageLabel}
- For younger readers (age 6-9): short, clear questions with simple vocabulary
- For older readers (age 10+): include inference, authorial intent, and evaluative questions
- Number each question Q1–Q${numQuestions}
- After the questions, add a brief TEACHER NOTES section with suggested answers / marking guidance${grounded ? " — quote the exact line(s) from the passage that support each answer" : ""}

Format your response as JSON:
{
  "questions": [
    { "number": 1, "type": "retrieve",  "question": "...", "marks": 1 },
    { "number": 2, "type": "inference", "question": "...", "marks": 2 },
    { "number": 3, "type": "vocabulary", "question": "...", "marks": 1 },
    { "number": 4, "type": "explain", "question": "...", "marks": 3 }
  ],
  "teacherNotes": [
    { "number": 1, "guidance": "${grounded ? "Quote the lines from the passage that support the answer..." : "Accept any answer that mentions..."}" }
  ]${wantsBookTalk ? ',\n  "bookTalk": ["I think… because…", "..."]' : ""}
}`;

  try {
    const { content, provider } = await callWithFallback(system, user, Math.max(2000, numQuestions * 250), undefined, schoolId);
    let parsed: any;
    try {
      // Strip markdown code fences (e.g. ```json ... ```) if present
      const stripped = content
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : stripped);
    } catch {
      const lines = content.split("\n").filter(l => /^Q?\d+[.)]/i.test(l.trim()));
      parsed = {
        questions: lines.map((l, i) => ({ number: i + 1, type: "comprehension", question: l.replace(/^Q?\d+[.\)\s]+/i, "").trim(), marks: 1 })),
        teacherNotes: [],
      };
    }
    res.json({
      ...parsed,
      provider,
      grounded,
      groundedExpired,
      groundedRange: groundedPassage
        ? { firstPage: groundedPassage.firstPage, lastPage: groundedPassage.lastPage, totalPages: groundedPassage.totalPages }
        : undefined,
      criteriaSource,
    });
  } catch (err: any) {
    console.error("[book-questions] error:", err);
    res.status(500).json({ error: err.message || "Failed to generate questions" });
  }
});

// ── Book Review — generate a summary and review of a book ────────────────────
router.post("/book-review", requireAuth, async (req: Request, res: Response) => {
  const { bookTitle, author, yearGroup, genre } = req.body;
  if (!bookTitle) return res.status(400).json({ error: "bookTitle is required" });
  const schoolId = req.user?.schoolId ?? undefined;

  const authorLabel = author ? ` by ${author}` : "";
  const audienceLabel = yearGroup ? `for ${yearGroup} pupils` : "for school pupils";

  const system = `You are an expert children's and young adult literature specialist and school librarian. You write engaging, age-appropriate book summaries and reviews that help pupils decide whether to read a book.`;

  const user = `Write a book summary and review of "${bookTitle}"${authorLabel} ${audienceLabel}${genre ? ` (genre: ${genre})` : ""}.

Return a JSON object with this structure:
{
  "title": "${bookTitle}",
  "author": "${author || "Unknown"}",
  "genre": "the book's genre",
  "ageRange": "recommended reading age range",
  "summary": "A 3-4 paragraph spoiler-free summary of what the book is about. Engaging and written for the target age group. Do NOT reveal the ending.",
  "review": "A 2-3 paragraph honest review covering: writing style, themes, what makes it special, who would enjoy it, and any content warnings if relevant for school use.",
  "themes": ["theme1", "theme2", "theme3"],
  "starRating": 4.5,
  "readingLevel": "e.g. Year 5-7 / Ages 9-12",
  "curriculumLinks": ["e.g. PSHE - friendship", "English - narrative structure"],
  "similarBooks": ["Book 1 by Author", "Book 2 by Author"]
}`;

  try {
    const { content, provider } = await callWithFallback(system, user, 1500, undefined, schoolId);
    let parsed: any;
    try {
      // Strip markdown code fences (e.g. ```json ... ```) if present
      const stripped = content
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : stripped);
    } catch {
      parsed = { title: bookTitle, author: author || "", summary: content, review: "", themes: [], starRating: 0, readingLevel: "", curriculumLinks: [], similarBooks: [] };
    }
    res.json({ ...parsed, provider });
  } catch (err: any) {
    console.error("[book-review] error:", err);
    res.status(500).json({ error: err.message || "Failed to generate review" });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/ai/diagnostic-starter
// Generates 5 quick "check for understanding" questions for a topic
// ────────────────────────────────────────────────────────────────────────────────
router.post("/diagnostic-starter", requireAuth, async (req, res) => {
  const { subject, yearGroup, topic, sendNeed, freeText } = req.body;

  // Support both structured params and free-text open chat mode
  const isFreeTxt = !!freeText;
  if (!isFreeTxt && (!subject || !yearGroup || !topic)) {
    return res.status(400).json({ error: "subject, yearGroup, and topic are required (or use freeText)" });
  }

  // Derive a display topic label for the response
  const topicLabel = isFreeTxt ? freeText.slice(0, 80) : `${topic} (${yearGroup} ${subject})`;

  const sendContext = sendNeed ? `The student may have ${sendNeed} needs. Keep questions clear and accessible.` : "";

  const prompt = isFreeTxt
    ? `You are an expert teacher. The teacher has asked: "${freeText}"

Generate exactly 5 short diagnostic starter questions to check prior understanding before starting this topic.

Requirements:
- Each question should take 1-2 minutes to answer
- Questions should test prerequisite knowledge needed for this topic
- Questions should be clear and unambiguous
- Mix of recall and simple application
- No multi-part questions
- Infer the topic and year group from the teacher's request

Also infer a short topic name from the request.

Respond with a JSON object in this exact format:
{
  "topic": "Short topic name here",
  "questions": [
    "Question 1 text here?",
    "Question 2 text here?",
    "Question 3 text here?",
    "Question 4 text here?",
    "Question 5 text here?"
  ]
}`
    : `You are an expert teacher. Generate exactly 5 short diagnostic starter questions to check prior understanding of "${topic}" for ${yearGroup} ${subject} students.

Requirements:
- Each question should take 1-2 minutes to answer
- Questions should test prerequisite knowledge needed for this topic
- Questions should be clear and unambiguous
- Mix of recall and simple application
- No multi-part questions
${sendContext}

Respond with a JSON object in this exact format:
{
  "topic": "${topic}",
  "questions": [
    "Question 1 text here?",
    "Question 2 text here?",
    "Question 3 text here?",
    "Question 4 text here?",
    "Question 5 text here?"
  ]
}`;

  const user = (req as any).user;
  const schoolId = user?.schoolId;

  try {
    const result = await callWithFallback(
      "You are an expert teacher. Respond only with valid JSON — no markdown, no explanation.",
      prompt,
      700,
      undefined,
      schoolId || undefined
    );

    const stripped = result.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : stripped);

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("No questions returned from AI");
    }

    const questions = parsed.questions
      .slice(0, 5)
      .map((q: any) => (typeof q === "string" ? q : q.q || q.question || String(q)));

    return res.json({
      questions,
      topic: parsed.topic || topicLabel,
      provider: result.provider,
    });
  } catch (err: any) {
    console.error("[diagnostic-starter] failed:", err.message);
    res.status(500).json({ error: "Could not generate diagnostic questions. Please ensure an AI provider is configured in Settings." });
  }
});

// ── Batch Worksheet Generation ────────────────────────────────────────────────
// POST /api/ai/batch-generate-worksheet
// Generates all 4 differentiation tiers (Base, Foundation, Higher, SEND) in a
// single AI call. ~4x more efficient than calling /generate three separate times.
// Routes to high-context providers (Gemini) first via reorderForHeavyRequest.
router.post("/batch-generate-worksheet", requireAuth, async (req: Request, res: Response) => {
  const { subject, topic, yearGroup, examBoard, additionalInstructions, includeAnswers } = req.body;
  if (!subject || !topic || !yearGroup) {
    return res.status(400).json({ error: "subject, topic, and yearGroup are required" });
  }
  const schoolId = (req as any).user?.schoolId;
  const examBoardNote = examBoard && examBoard !== "none" ? `Exam board: ${examBoard}.` : "";
  const extraNote = additionalInstructions ? `Additional instructions: ${additionalInstructions}` : "";
  const answerNote = includeAnswers
    ? "Include a mark scheme / answer key for each tier."
    : "Do NOT include answers in the student-facing sections.";

  const system = `You are an expert UK SEND teacher. Generate differentiated worksheets for 4 tiers simultaneously. Return ONLY valid JSON — no markdown, no code fences, no explanation.`;

  const user = `Generate 4 differentiated worksheets for the same topic, one per tier.
Subject: ${subject} | Year Group: ${yearGroup} | Topic: ${topic}
${examBoardNote} ${extraNote}
${answerNote}

Return this exact JSON structure:
{
  "base": {
    "title": "${topic} — Base Tier (${yearGroup} ${subject})",
    "tier": "base",
    "sections": [
      {"type": "objectives", "title": "Learning Objectives", "content": "Students will be able to: 1. ..."},
      {"type": "guided", "title": "Section A — Guided Practice", "content": "1. Simple question with scaffold\n2. Fill-in-the-blank question\n3. Multiple choice question"},
      {"type": "questions", "title": "Section B — Questions", "content": "1. Short answer question\n2. Short answer question\n3. Short answer question"}
    ],
    "metadata": {"subject": "${subject}", "topic": "${topic}", "yearGroup": "${yearGroup}", "tier": "base"}
  },
  "foundation": {
    "title": "${topic} — Foundation Tier (${yearGroup} ${subject})",
    "tier": "foundation",
    "sections": [
      {"type": "objectives", "title": "Learning Objectives", "content": "Students will be able to: 1. ..."},
      {"type": "guided", "title": "Section A — Guided Practice", "content": "1. Foundation question\n2. Foundation question\n3. Foundation question"},
      {"type": "questions", "title": "Section B — Questions", "content": "1. Foundation question\n2. Foundation question\n3. Foundation question"}
    ],
    "metadata": {"subject": "${subject}", "topic": "${topic}", "yearGroup": "${yearGroup}", "tier": "foundation"}
  },
  "higher": {
    "title": "${topic} — Higher Tier (${yearGroup} ${subject})",
    "tier": "higher",
    "sections": [
      {"type": "objectives", "title": "Learning Objectives", "content": "Students will be able to: 1. ..."},
      {"type": "questions", "title": "Section A — Questions", "content": "1. Higher-order question\n2. Analysis question\n3. Evaluation question"},
      {"type": "extension", "title": "Section B — Extension", "content": "1. Challenge question\n2. Exam-style question"}
    ],
    "metadata": {"subject": "${subject}", "topic": "${topic}", "yearGroup": "${yearGroup}", "tier": "higher"}
  },
  "send": {
    "title": "${topic} — SEND Scaffolded (${yearGroup} ${subject})",
    "tier": "send",
    "sections": [
      {"type": "word-bank", "title": "Word Bank", "content": "Key term 1 — definition\nKey term 2 — definition\nKey term 3 — definition"},
      {"type": "guided", "title": "Section A — Guided Practice", "content": "1. Sentence starter: ___\n2. Fill in the blank: ___\n3. Circle the correct answer: A / B / C"},
      {"type": "questions", "title": "Section B — Questions", "content": "1. Short scaffolded question\n2. Short scaffolded question"}
    ],
    "metadata": {"subject": "${subject}", "topic": "${topic}", "yearGroup": "${yearGroup}", "tier": "send"}
  }
}

RULES:
- Every section content MUST be a plain text string (NOT an array, NOT nested JSON)
- Questions must be specific to the topic "${topic}" — no generic placeholders
- Base tier: very simple, scaffolded, step-by-step, suitable for SEN pupils
- Foundation tier: accessible, structured, clear language
- Higher tier: challenging, higher-order thinking, exam-style
- SEND tier: maximum scaffolding, word banks, sentence starters, visual cues described in text`;

  try {
    const result = await callWithFallback(system, user, 6000, undefined, schoolId);
    const stripped = result.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    const candidate = jsonMatch ? jsonMatch[0] : stripped;
    let parsed: any;
    try {
      parsed = JSON.parse(candidate);
    } catch (_) {
      try {
        const sanitized = candidate.replace(
          /"((?:[^"\\]|\\.)*)"/g,
          (_m: string, inner: string) =>
            `"${inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`
        );
        parsed = JSON.parse(sanitized);
      } catch (__) {
        return res.status(500).json({ error: "AI returned invalid JSON for batch generation — please try again" });
      }
    }
    const tiers = ["base", "foundation", "higher", "send"];
    for (const tier of tiers) {
      if (!parsed[tier] || !Array.isArray(parsed[tier].sections)) {
        return res.status(500).json({ error: `AI response missing ${tier} tier — please try again` });
      }
      parsed[tier].sections = parsed[tier].sections.map((s: any) => ({
        ...s,
        title: typeof s.title === "string" ? s.title : String(s.title || ""),
        content: (() => {
          const c = s.content;
          if (typeof c === "string") return c;
          if (Array.isArray(c)) return (c as any[]).map((item: any) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n");
          if (c === null || c === undefined) return "";
          return String(c);
        })(),
      }));
      parsed[tier].isAI = true;
    }
    res.json({ tiers: parsed, provider: result.provider, aiGenerated: true });
  } catch (err: any) {
    console.error("[batch-generate-worksheet] failed:", err.message);
    res.status(500).json({ error: "Batch generation failed. Please try again." });
  }
});


// ── POST /api/ai/differentiate-one-click — adapt existing worksheet for Higher/Foundation/SEND ──

router.post("/differentiate-one-click", requireAuth, async (req: Request, res: Response) => {
  const {
    sections,           // WorksheetSection[] — the current worksheet
    topic,
    subject,
    yearGroup,
    tier,               // "higher" | "foundation" | "send"
    sendNeeds,          // optional string — pupil's specific SEND needs
  } = req.body;

  if (!sections || !Array.isArray(sections) || !tier) {
    return res.status(400).json({ error: "sections array and tier are required" });
  }
  if (!["higher", "foundation", "send"].includes(tier)) {
    return res.status(400).json({ error: "tier must be higher, foundation, or send" });
  }

  const schoolId = (req as any).user?.schoolId;

  const tierInstructions: Record<string, string> = {
    higher: `You are adapting this worksheet to a HIGHER tier version for more able students.
Rules:
- Increase vocabulary complexity and use subject-specific technical language throughout
- Remove sentence starters and word banks (students should work independently)
- Add extension sub-parts to questions (e.g. "(c) Explain why..." or "(d) Evaluate...")
- Increase mark allocations for extended questions
- Make multiple choice distractors more plausible and closely related
- Add a harder challenge question requiring synthesis or evaluation
- Gap fills should use more complex or technical terms
- True/false questions should include nuanced statements requiring careful reasoning
- Keep the same topic, structure, and number of questions — only increase difficulty`,

    foundation: `You are adapting this worksheet to a FOUNDATION tier version for students who need more support.
Rules:
- Simplify vocabulary — replace technical terms with plain English, then show the technical term in brackets
- Add sentence starters for every written question (e.g. "The circuit works because...")
- Add word banks to gap fill questions
- Break multi-part questions into smaller, more guided steps
- Add a worked example or model answer before each question type
- Reduce mark allocations and expected answer length
- Make multiple choice options more obviously different from each other
- Add visual cues or reminders of key facts near questions
- Keep the same topic, structure, and number of questions — only reduce difficulty`,

    send: `You are adapting this worksheet for students with SEND (Special Educational Needs and Disabilities).
Apply ALL of the following adaptations comprehensively:

DYSLEXIA / READING DIFFICULTIES:
- Use short sentences (max 15 words each)
- Use active voice, never passive
- Avoid double negatives
- Break long paragraphs into bullet points
- Add a word bank to EVERY question that requires writing

AUTISM / ASD:
- Use precise, literal language — no idioms, metaphors or ambiguous phrasing whatsoever
- Give explicit, step-by-step instructions for every task
- State exactly what is expected ("Write ONE sentence", "Circle ONE answer")
- Replace all open-ended questions with structured prompts and sentence frames
- Add a clear visual structure: number every step, use consistent formatting

ADHD / ATTENTION DIFFICULTIES:
- Break every question into small, numbered sub-steps
- Add a "STOP — Check your work" prompt after every 2 questions
- Keep questions short and focused — one concept per question
- Add brain break prompts between sections
- Use bold text to highlight the key action word in each question

EAL (ENGLISH AS ADDITIONAL LANGUAGE):
- Define every subject-specific term in simple English
- Add a glossary box at the start of each section
- Use simple sentence structures throughout
- Avoid colloquial expressions
- Provide sentence frames for every written response

GENERAL SEND SCAFFOLDING:
- Add word banks to every question requiring writing
- Reduce writing demand — use tick boxes, circle answers, or fill-in-the-blank where possible
- Add visual spacing between questions
- Use simple, consistent formatting throughout
- Keep the same topic and questions — only add scaffolding and simplify language`,
  };

  const systemPrompt = `You are an expert SEND-specialist teacher adapting educational worksheets.
You will receive a worksheet as a JSON array of sections and must return an adapted version.
Return ONLY a valid JSON array of the same sections, adapted according to the instructions.
Do not add or remove sections. Do not change section IDs or types.
Only modify the content, title, and label fields of each section.
Do not include markdown code fences — return raw JSON only.`;

  const userPrompt = `Topic: ${topic || "Unknown"}
Subject: ${subject || "Unknown"}
Year Group: ${yearGroup || "Unknown"}
${sendNeeds ? `Student SEND needs: ${sendNeeds}\n` : ""}
Adaptation instructions:
${tierInstructions[tier]}

Worksheet sections to adapt:
${JSON.stringify(sections, null, 2)}`;
  try {
    // Fix: callAI was a bug — the correct function is callWithFallback
    const result = await callWithFallback(
      systemPrompt,
      userPrompt,
      8000,
      undefined,
      schoolId
    );
    let adapted: any[];
    try {
      const raw = result.content.trim();
      const clean = raw.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();
      adapted = JSON.parse(clean);
      if (!Array.isArray(adapted)) throw new Error("Not an array");
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON \u2014 please try again" });
    }
    // Preserve original section IDs
    adapted = adapted.map((s: any, i: number) => ({
      ...sections[i],
      ...s,
      id: sections[i]?.id || s.id,
    }));
    res.json({ sections: adapted, tier, provider: result.provider });
  } catch (err: any) {
    console.error("[differentiate-one-click] failed:", err.message);
    res.status(500).json({ error: "Differentiation failed. Please try again." });
  }
});

// ── POST /api/ai/adjust-reading-level — reword worksheet text for a target year group ──────
// Changes ONLY language complexity, vocabulary, and sentence length.
// Does NOT change: questions, marks, numbers, formulas, section structure.
router.post("/adjust-reading-level", requireAuth, async (req: Request, res: Response) => {
  const { sections, targetYearGroup, subject, topic, sendNeed } = req.body;
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: "sections array is required" });
  }
  if (!targetYearGroup) {
    return res.status(400).json({ error: "targetYearGroup is required" });
  }
  const schoolId = (req as any).user?.schoolId;

  // Map year group to a reading age target
  const yearToAge: Record<string, number> = {
    "Year 1": 6, "Year 2": 7, "Year 3": 8, "Year 4": 9, "Year 5": 10, "Year 6": 11,
    "Year 7": 12, "Year 8": 13, "Year 9": 14, "Year 10": 15, "Year 11": 16,
    "Year 12": 17, "Year 13": 18,
  };
  // Normalise: "7" -> "Year 7", "Year 7" -> "Year 7"
  const normYG = targetYearGroup.toString().trim();
  const ygKey = normYG.startsWith("Year ") ? normYG : `Year ${normYG}`;
  const targetAge = yearToAge[ygKey] || 14; // default to Year 9 reading age

  const getAgeGuide = (age: number): string => {
    if (age <= 6) return "Reading age 6: Very short sentences (4\u20136 words). Only the most common everyday words. Explain all subject words in the simplest terms.";
    if (age <= 7) return "Reading age 7: Very short sentences (5\u20138 words max). Simple, common words only. One instruction per sentence. No compound or complex sentences. Avoid all technical jargon \u2014 use everyday words instead.";
    if (age <= 8) return "Reading age 8: Short sentences (6\u20139 words). Only common everyday words. Explain any subject word immediately in the simplest terms. Simple compound sentences allowed.";
    if (age <= 9) return "Reading age 9: Short, clear sentences (8\u201312 words). Plain everyday vocabulary. Define subject words in simple terms straight away. Simple compound sentences allowed.";
    if (age <= 10) return "Reading age 10: Sentences of 8\u201313 words. Plain English with brief explanations for subject words. Mix of simple and compound sentences. Direct, clear instructions.";
    if (age <= 11) return "Reading age 11: Sentences of 10\u201315 words. Straightforward vocabulary. Explain subject words briefly. Clear, direct instructions. Avoid formal or unusual words.";
    if (age <= 12) return "Reading age 12: Sentences of 10\u201316 words. Normal everyday vocabulary plus subject terms with short definitions. Varied sentence structures. Instructions are clear and direct.";
    if (age <= 13) return "Reading age 13: Clear, natural language a secondary school student would use day-to-day. Subject vocabulary with brief definitions. Sentences up to 16 words. GCSE command words (describe, explain, state) are fine. No unnecessarily formal words.";
    if (age <= 14) return "Reading age 14: Natural, confident language a Year 9-10 student would understand. Subject vocabulary used naturally. Sentences up to 18 words. GCSE command words throughout. No unnecessarily formal or rare words.";
    if (age <= 15) return "Reading age 15: Clear, direct language a Year 10-11 student would use. Subject vocabulary used naturally. Varied sentence structures. GCSE standard. Avoid overly formal or obscure words \u2014 write how a good teacher would explain it out loud.";
    if (age <= 16) return "Reading age 16: Natural language a confident 16-year-old would understand and use. Subject vocabulary used correctly. Clear, direct sentences. GCSE/AS standard. Do NOT use unnecessarily formal words like 'elucidate', 'articulate', 'ascertain', 'endeavour' \u2014 use plain equivalents like 'explain', 'describe', 'find out', 'try'.";
    return "Reading age 17+: Clear, precise language a sixth-form student would use. Subject vocabulary used accurately. Well-structured sentences. A-Level standard. Write naturally and directly \u2014 avoid pompous or overly formal vocabulary. Use words a student would actually say.";
  };

  const guide = getAgeGuide(targetAge);

  // Only adjust student-facing sections; preserve teacher/answer sections,
  // worked examples (contain precise mathematical steps that must not be altered),
  // and diagram sections (visual assets with fixed labels).
  const PRESERVE_TYPES = new Set(["answers", "mark-scheme", "worked-example", "diagram", "q-label-diagram"]);
  const sectionsToAdjust = sections.filter((s: any) => !s.teacherOnly && !PRESERVE_TYPES.has(s.type));
  const preservedSections = sections.filter((s: any) => s.teacherOnly || PRESERVE_TYPES.has(s.type));
  // Early exit: if nothing needs adjusting, return original sections immediately
  if (sectionsToAdjust.length === 0) {
    return res.json({ sections, provider: "none", targetYearGroup, targetAge });
  }

  const system = `You are a UK SEND specialist teacher. Rewrite the worksheet text to match a specific reading age level.
CRITICAL: Change ONLY the language complexity, vocabulary, and sentence structure.
Do NOT change the academic content, questions, numbers, formulas, or difficulty of the tasks themselves.
Return a valid JSON ARRAY only \u2014 no wrapper object, no markdown code blocks, no extra keys.
Output MUST start with [ and end with ].`;

  const user = `Rewrite ALL instructions and text in this worksheet to match: ${guide}

Subject: ${subject || "general"}
Year Group: ${targetYearGroup}
${sendNeed ? `SEND Need: ${sendNeed}` : ""}

RULES:
- Rewrite ONLY the instructional text, question wording, and vocabulary definitions
- Do NOT change: numbers, formulas, equations, mark allocations, answer spaces, section titles
- Keep all scaffolding structures (word banks, sentence starters, checklists) but simplify their language
- If content is already at or below the target reading level, leave it unchanged
- Preserve all section IDs exactly

SECTIONS:
${JSON.stringify(sectionsToAdjust, null, 2)}

Return a JSON array of sections with adjusted language \u2014 start with [ and end with ]:
[{"title": "...", "content": "...", "type": "...", "teacherOnly": false}]`;

  try {
    const { content, provider } = await callWithFallback(system, user, 4000, undefined, schoolId);
    const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "Reading level adjustment failed \u2014 AI returned unparseable response." });
    }
    let adjustedSections: any[];
    if (Array.isArray(parsed)) {
      adjustedSections = parsed;
    } else if (parsed && Array.isArray(parsed.sections)) {
      adjustedSections = parsed.sections;
    } else {
      return res.status(500).json({ error: "Reading level adjustment failed \u2014 unexpected AI response format." });
    }
    // Restore original IDs and merge with preserved sections.
    // Always keep imageUrl, svg, caption, attribution from the original —
    // the AI only rewrites text and must never strip visual assets.
    const mergedAdjusted = adjustedSections.map((s: any, i: number) => {
      const orig = sectionsToAdjust[i] || {};
      return {
        ...orig,
        ...s,
        id: orig.id || s.id,
        // Preserve visual/structural fields from original regardless of AI output
        imageUrl: orig.imageUrl,
        svg: orig.svg,
        caption: orig.caption,
        attribution: orig.attribution,
        marks: orig.marks ?? s.marks,
        questionNumber: orig.questionNumber ?? s.questionNumber,
        teacherOnly: orig.teacherOnly ?? s.teacherOnly,
      };
    });
    // Re-insert preserved sections at their original positions in the sections array.
    // Build a map of original index → section for preserved sections.
    const preservedByOrigIdx = new Map<number, any>();
    sections.forEach((s: any, idx: number) => {
      if (s.teacherOnly || PRESERVE_TYPES.has(s.type)) {
        preservedByOrigIdx.set(idx, s);
      }
    });
    // Walk through original sections array, replacing adjusted sections with their
    // AI-rewritten versions and keeping preserved sections in place.
    let adjustedIdx = 0;
    const finalSections = sections.map((s: any, idx: number) => {
      if (preservedByOrigIdx.has(idx)) return s; // keep original unchanged
      return mergedAdjusted[adjustedIdx++] || s;
    });
    res.json({ sections: finalSections, provider, targetYearGroup, targetAge });
  } catch (err: any) {
    console.error("[adjust-reading-level] failed:", err.message);
    res.status(500).json({ error: "Reading level adjustment failed. Please try again." });
  }
});

// ── POST /api/ai/translate — FEAT-PC6 (EAL parity) ───────────────────────────
// Translates a single block of text into one of the supported UK EAL
// languages. The client batches per-section text using a sentinel separator
// and asks for a single round-trip; we honour that by leaving the input
// untouched apart from the system instruction.
//
// Input  { text, targetLang, targetLangName?, sourceLang?, context? }
// Output { text, lang, provider }
router.post("/translate", requireAuth, async (req: Request, res: Response) => {
  const { text, targetLang, targetLangName, sourceLang, context } = req.body || {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }
  if (typeof targetLang !== "string" || !targetLang.trim()) {
    return res.status(400).json({ error: "targetLang is required" });
  }
  // Passthrough for English — no AI hop.
  if (targetLang === "en") {
    return res.json({ text, lang: "en", provider: "passthrough" });
  }
  const schoolId = (req as any).user?.schoolId;

  const langName = (targetLangName || targetLang).toString();
  const fromLang = (sourceLang || "en").toString();

  const system = `You are a professional UK educational translator. You translate worksheet content from ${fromLang} into ${langName} for an English-as-Additional-Language (EAL) pupil in a UK school.

CRITICAL RULES:
- Translate ONLY the natural-language text. Do NOT translate or alter:
  - numbers, mathematical expressions, formulas, units (kg, cm, °C, etc.)
  - blank spaces written as underscores ("_____")
  - checkbox markers like "[ ]" or "[x]"
  - section IDs, IDs in brackets, or any code-like tokens
  - HTML tags or markdown formatting
- Preserve every line break, list marker, and the order of content exactly.
- If the input contains the literal sentinel "<<<§ADAPTLY_TRANSLATE_BREAK§>>>", reproduce it verbatim wherever it appears — translate the surrounding text but never the sentinel itself.
- Use plain, everyday vocabulary suitable for a school child; avoid academic/literary register.
- Output the translation only — no commentary, no quotation marks around the output, no "Here is your translation:" preamble.`;

  const user = `Translate the following ${fromLang} worksheet text into ${langName}.${context ? "\n\nAdditional context: " + String(context).slice(0, 400) : ""}\n\n--- BEGIN TEXT ---\n${text}\n--- END TEXT ---`;

  try {
    const { content, provider } = await callWithFallback(system, user, 4000, undefined, schoolId);
    const cleaned = content
      .replace(/^\s*--- BEGIN TEXT ---\s*/i, "")
      .replace(/\s*--- END TEXT ---\s*$/i, "")
      .replace(/^["']|["']$/g, "")
      .trim();
    if (!cleaned) {
      return res.status(500).json({ error: "Translation returned empty result." });
    }
    return res.json({ text: cleaned, lang: targetLang, provider });
  } catch (err: any) {
    console.error("[ai/translate] failed:", err?.message);
    return res.status(500).json({ error: "Translation failed. Please try again." });
  }
});

// ── POST /api/ai/braille — FEAT-PC7 (Grade 2 UEB transcription) ──────────────
// Server-side fallback for the Braille pipeline. Uses the AI provider chain
// to produce a Grade 2 Unified English Braille (UEB) transcription rather
// than bundling liblouis-wasm into the client. The client wraps the result
// in BRF formatting (page breaks, line wrapping) before download.
//
// Input  { text, grade? }
// Output { brl, grade, provider }
router.post("/braille", requireAuth, async (req: Request, res: Response) => {
  const { text, grade } = req.body || {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }
  const targetGrade = grade === 1 || grade === "1" ? 1 : 2;
  const schoolId = (req as any).user?.schoolId;

  const system = `You are an expert transcriber of UK educational material into Unified English Braille (UEB), Grade ${targetGrade}.

CRITICAL RULES:
- Output Braille using the Unicode Braille range (U+2800–U+28FF) — one Unicode code point per Braille cell.
- Apply the standard UEB capital indicator (⠠) before each capitalised letter and the number sign (⠼) before digit runs.
- Preserve every line break in the input. Do NOT add running headers/footers.
- Do NOT translate the source text into another language — transcribe English text into Braille glyphs.
- For untranscribable symbols (emoji, decorative glyphs), substitute a sensible word (e.g. ★ → "star").
- Output the Braille only — no commentary, no markdown code fences, no preamble.${targetGrade === 2 ? "\n- Apply the standard Grade 2 contractions (e.g. 'and' → ⠯, 'the' → ⠮) where appropriate." : "\n- Use Grade 1 (uncontracted) — every letter expanded."}`;

  const user = `Transcribe the following text into UEB Grade ${targetGrade} Braille:\n\n${text}`;

  try {
    const { content, provider } = await callWithFallback(system, user, 4000, undefined, schoolId);
    const cleaned = content.replace(/^```[a-zA-Z]*\s*/i, "").replace(/\s*```$/i, "").trim();
    if (!cleaned) {
      return res.status(500).json({ error: "Braille transcription returned empty result." });
    }
    return res.json({ brl: cleaned, grade: targetGrade, provider });
  } catch (err: any) {
    console.error("[ai/braille] failed:", err?.message);
    return res.status(500).json({ error: "Braille transcription failed. Please try again." });
  }
});

// POST /api/ai/generate-retrieval
// Generates 3 short retrieval questions on a previous topic.
// Called by the library path in Worksheets.tsx when recallTopic is set and retrieval is selected.
router.post("/generate-retrieval", requireAuth, async (req: Request, res: Response) => {
  const { recallTopic, subject, yearGroup, sendNeed } = req.body;
  if (!recallTopic || typeof recallTopic !== 'string' || !recallTopic.trim()) {
    return res.status(400).json({ error: "recallTopic is required" });
  }
  const schoolId = req.user?.schoolId ?? undefined;
  const yr = yearGroup || "Year 9";
  const sendNote = sendNeed && sendNeed !== 'none-selected'
    ? `The student has ${sendNeed}. Keep questions very short (max 10 words each). Use True/False or fill-in-blank formats. Add a sentence starter for any written answer.`
    : '';
  const system = `You are an expert UK teacher. You respond with valid raw JSON only — no markdown, no code blocks, no asterisks.`;
  const user = `Generate exactly 3 short retrieval questions on the previous topic "${recallTopic}" for ${yr} ${subject || 'students'}.
${sendNote}
Return EXACTLY this JSON (raw JSON only, no markdown fences):
{"section":{"type":"prior-knowledge","title":"Retrieval Practice — ${recallTopic}","content":"Recall from last lesson!\n1. [True/False statement about ${recallTopic}] TRUE / FALSE\n2. [Short answer question about ${recallTopic}]\n3. [Fill-in-blank: complete the sentence about ${recallTopic}. The answer is _______________.]"}}
RULES:
1. All 3 questions must be about "${recallTopic}" only.
2. Q1: True/False. Q2: Short answer (one word or phrase). Q3: Fill-in-blank.
3. No asterisks, no markdown, no bold. Plain text only.
4. Each question on its own numbered line.`;
  try {
    const { content } = await callWithFallback(system, user, 400, undefined, schoolId);
    const raw = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : JSON.parse(raw);
    if (!parsed?.section) {
      return res.status(500).json({ error: "AI did not return a valid section" });
    }
    res.json({ section: parsed.section });
  } catch (err: any) {
    console.error("[generate-retrieval] failed:", err.message);
    // Fallback: return a static retrieval section so the worksheet still works
    res.json({
      section: {
        type: "prior-knowledge",
        title: `Retrieval Practice — ${recallTopic}`,
        content: `Recall from last lesson!\n1. ${recallTopic} is a topic studied in ${subject || 'Science'}. TRUE / FALSE\n2. Name one key term from ${recallTopic}: _______________\n3. Complete the sentence: ${recallTopic} is important because _______________.`,
      }
    });
  }
});

// ── POST /api/ai/diagram-questions ──────────────────────────────────────────
// Given a diagram library entry (description, image_url, title, topic) and
// worksheet context, generate multiple dynamic diagram-based questions.
// Uses the diagram description as the source of truth — no vision API needed.
router.post("/diagram-questions", requireAuth, async (req: Request, res: Response) => {
  const {
    diagramTitle,
    diagramDescription,
    diagramImageUrl,
    subject,
    topic,
    yearGroup,
    difficulty = "standard",
    sendNeed,
  } = req.body;

  if (!diagramDescription && !diagramTitle) {
    return res.status(400).json({ error: "diagramDescription or diagramTitle required" });
  }

  const difficultyNote = difficulty === "foundation"
    ? "Questions should be accessible, with sentence starters and clear structure. Avoid multi-step reasoning."
    : difficulty === "higher"
    ? "Questions should be challenging, requiring analysis, evaluation, and extended reasoning."
    : "Questions should be at standard GCSE level, a mix of recall, application, and analysis.";

  const sendNote = sendNeed && sendNeed !== "none" && sendNeed !== "none-selected"
    ? `The student has a SEND need: ${sendNeed}. Adjust language and scaffolding accordingly — shorter sentences, clearer instructions, more structure.`
    : "";

  const systemPrompt = `You are an expert ${subject || ""} teacher creating exam-quality worksheet questions based on a diagram.
Generate questions that test a range of skills: recall, identification, explanation, application, analysis, and evaluation.
All questions must be directly answerable from the diagram shown.
Return ONLY a JSON object — no markdown, no prose, no code fences.`;

  const userPrompt = `Diagram title: "${diagramTitle || topic}"
Subject: ${subject || "Science"}
Topic: ${topic}
Year group: ${yearGroup || "Year 10"}
Difficulty: ${difficulty}

Diagram description:
${diagramDescription || `A diagram showing key concepts related to ${topic} in ${subject}.`}

${difficultyNote}
${sendNote}

Generate 5 questions based on this diagram. Include a variety of question types:
- At least 1 identification question ("What is labelled X?", "Identify the part that...")
- At least 1 explanation question ("Explain why...", "Describe what happens when...")
- At least 1 application question ("Using the diagram, calculate/predict/suggest...")
- At least 1 comparison or analysis question ("Compare...", "Why is... different from...")
- 1 extended/evaluation question worth more marks

Return this exact JSON structure:
{"title":"Diagram Questions — ${diagramTitle || topic}","questions":[{"number":1,"text":"...","marks":1,"type":"identify"},{"number":2,"text":"...","marks":2,"type":"explain"},{"number":3,"text":"...","marks":3,"type":"apply"},{"number":4,"text":"...","marks":3,"type":"analyse"},{"number":5,"text":"...","marks":4,"type":"evaluate"}],"totalMarks":13}`;

  try {
    const result = await callWithFallback(systemPrompt, userPrompt, 1200, undefined, req.user!.schoolId || undefined);
    const raw = result.content.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const parsed = JSON.parse(match[0]);

    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const totalMarks = parsed.totalMarks || questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
    const contentLines: string[] = [];
    for (const q of questions) {
      contentLines.push(`**Q${q.number}.** ${q.text} [${q.marks} mark${q.marks !== 1 ? 's' : ''}]`);
      contentLines.push(``);
    }

    res.json({
      section: {
        id: `diagram-questions-${Date.now()}`,
        type: "q-diagram",
        title: parsed.title || `Diagram Questions — ${diagramTitle || topic}`,
        content: contentLines.join("\n"),
        marks: totalMarks,
        diagramImageUrl: diagramImageUrl || null,
        diagramTitle: diagramTitle || null,
        questions,
        teacherOnly: false,
      }
    });
  } catch (err: any) {
    console.error("[diagram-questions] failed:", err.message);
    res.json({
      section: {
        id: `diagram-questions-fallback-${Date.now()}`,
        type: "q-diagram",
        title: `Diagram Questions — ${diagramTitle || topic}`,
        content: [
          `**Q1.** Identify and label the key parts shown in the diagram. [2 marks]`,
          ``,
          `**Q2.** Describe what is shown in the diagram. Use subject vocabulary. [3 marks]`,
          ``,
          `**Q3.** Explain the process or relationship shown in the diagram. [4 marks]`,
          ``,
          `**Q4.** Using the diagram, suggest what would happen if one component changed. [3 marks]`,
          ``,
          `**Q5.** Evaluate the importance of what is shown in the diagram. [4 marks]`,
        ].join("\n"),
        marks: 16,
        diagramImageUrl: diagramImageUrl || null,
        diagramTitle: diagramTitle || null,
        teacherOnly: false,
      }
    });
  }
});

// ── POST /api/ai/presentation/email ────────────────────────────────────────────
// Emails a presentation as an HTML digest (PDF generation is client-side PPTX;
// server sends styled HTML email with slide content and an optional PPTX note).
router.post("/presentation/email", requireAuth, async (req: Request, res: Response) => {
  const { presentation, themeKey, recipientEmail, message, format } = req.body;
  if (!presentation || !recipientEmail) {
    return res.status(400).json({ error: "presentation and recipientEmail are required" });
  }
  // Validate the rich presentation shape before composing email so we don't
  // try to render bullets-on-a-vocab-table mid-flight.
  const validated = PresentationDataSchemaShared.safeParse(presentation);
  if (!validated.success) {
    return res.status(400).json({ error: "presentation_validation_failed", details: validated.error.flatten() });
  }

  try {
    const { sendPresentationEmail } = await import("../email/index.js");
    await sendPresentationEmail(recipientEmail, {
      title: presentation.title,
      subject: presentation.subject,
      yearGroup: presentation.yearGroup,
      slides: presentation.slides,
      message: message || "",
      format: format || "pdf",
      senderName: (req as any).user?.displayName || "A teacher",
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error("[presentation/email] error:", err);
    res.status(500).json({ error: "Failed to send email. Please try again." });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Pupil document generators — CV, Personal Statement, Cover Letter
// Used by Parent Portal + teacher Pupils page.
// Parents can call these routes via cookie-less session by supplying the pupil
// access code in the X-Parent-Code header. Teachers call them with a normal
// authenticated session. For simplicity we require either an authenticated
// teacher session OR an X-Parent-Code that matches an existing pupil row.
// ──────────────────────────────────────────────────────────────────────────────

async function assertPupilDocAccess(req: Request): Promise<{ ok: true; schoolId: string | null } | { ok: false; status: number; message: string }> {
  // If teacher is authenticated, allow. (req.user is only set after tryAuthOptional.)
  if (req.user?.id) return { ok: true, schoolId: req.user.schoolId || null };
  // Otherwise require a parent code matching a real pupil (either `code` or
  // `parent_access_code` — both columns are in use across the codebase).
  const parentCode = (req.headers["x-parent-code"] as string || "").trim().toUpperCase();
  if (!parentCode) return { ok: false, status: 401, message: "Sign in or provide X-Parent-Code." };
  const pupil = await db.prepare(
    "SELECT school_id FROM pupils WHERE UPPER(code) = ? OR UPPER(parent_access_code) = ?"
  ).get(parentCode, parentCode) as any;
  if (!pupil) return { ok: false, status: 403, message: "Invalid parent code." };
  return { ok: true, schoolId: pupil.school_id || null };
}

/**
 * Delegates to the shared `tryAuthOptional` middleware: populates `req.user` if
 * a valid session token is present, but never responds with an error and always
 * continues — leaving the route free to fall back to the `X-Parent-Code` header.
 *
 * The previous implementation wrapped `requireAuth` and monkey-patched `res.status`
 * to swallow 401s, but `requireAuth` never calls `next()` on failure, so the
 * wrapper hung until the client timed out. That caused "CV builder doesn't work"
 * — every parent-code request hung for ~30s before the browser aborted.
 */
const tryAuthForDocs = tryAuthOptional;

function safeStr(v: any, max = 400): string {
  if (v == null) return "";
  return String(v).slice(0, max);
}

// Multer for CV uploads (PDF/DOCX only, 10MB cap — same memory pattern as worksheetUpload above)
const cvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── POST /api/ai/cv/parse — parse an uploaded CV (PDF/DOCX) into structured fields ──
// Used by the CV builder's "Upload existing CV" button. Returns a JSON object
// shaped exactly like the front-end form `fields` so it can be merged in.
router.post("/cv/parse", tryAuthForDocs, cvUpload.single("file"), async (req: Request, res: Response) => {
  const access = await assertPupilDocAccess(req);
  if (!access.ok) return res.status(access.status).json({ error: access.message });
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const { mimetype, originalname, buffer } = req.file;
  const isPdf  = mimetype === "application/pdf" || /\.pdf$/i.test(originalname || "");
  const isDocx = mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.docx$/i.test(originalname || "");
  if (!isPdf && !isDocx) {
    return res.status(400).json({ error: "Only PDF or DOCX files are supported." });
  }

  // Extract text
  let rawText = "";
  try {
    if (isPdf) {
      try {
        const { PDFParse } = await import("pdf-parse" as any);
        const parser = new PDFParse({ data: buffer, verbosity: 0 });
        await parser.load();
        const result = await parser.getText();
        if (result?.pages && Array.isArray(result.pages)) {
          rawText = result.pages.map((p: any) => p.text || "").join("\n\n");
        } else if (typeof result?.text === "string") {
          rawText = result.text;
        }
      } catch {
        // Fall back to v1-style default export
        const pdfParse = (await import("pdf-parse" as any)).default;
        const result = await pdfParse(buffer);
        rawText = result?.text || "";
      }
    } else {
      const mammoth = await import("mammoth" as any);
      const lib = mammoth.default || mammoth;
      const result = await lib.extractRawText({ buffer });
      rawText = result?.value || "";
    }
  } catch (err: any) {
    console.error("[ai/cv/parse] extract error:", err?.message);
    return res.status(422).json({ error: "Could not read that file. Try a different PDF or DOCX." });
  }

  rawText = (rawText || "").trim().slice(0, 12000);
  if (rawText.length < 40) {
    return res.status(422).json({ error: "We couldn't extract enough text from that file." });
  }

  const system = `You are an expert UK CV parser. Given the raw text of a CV, return a strict JSON object matching the requested schema. Do NOT invent facts: if a field is not present, use an empty string or empty array. British English. No commentary.`;

  const user = `Parse this CV text and return a JSON object with EXACTLY these keys (omit none):
{
  "pupilName": string,
  "personalSummary": string,
  "email": string,
  "phone": string,
  "location": string,
  "skills": string[],
  "languages": [{ "language": string, "level": string }],
  "education": [{ "school": string, "qualification": string, "dates": string, "grades": string }],
  "workExperience": [{ "role": string, "organisation": string, "dates": string, "description": string }],
  "achievements": string[],
  "interests": string,
  "references": string
}

Rules:
- Skills: 4–10 short keyword-rich items.
- Languages "level": e.g. "Native", "Fluent", "Conversational", "Basic" — keep verbatim if stated.
- Education "grades": e.g. "GCSEs: 9–7" or "A-levels predicted A*AB". Empty string if unknown.
- Experience "description": 1–2 sentences summarising responsibilities and outcomes.
- "interests" is a single comma-separated line, not an array.
- "references" — copy any reference contact details verbatim, or "Available on request" if none given.
- DO NOT include any keys other than the ones above.
- Return ONLY the JSON. No prose. No \`\`\` fences.

CV TEXT:
"""
${rawText}
"""`;

  try {
    const { content, provider } = await callWithFallback(system, user, 2200, undefined, access.schoolId || undefined);
    // Strip any code fences just in case
    const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to find the first balanced JSON object
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { parsed = {}; }
      }
    }
    if (!parsed || typeof parsed !== "object") {
      return res.status(422).json({ error: "We couldn't read that CV. Try again or fill it in manually." });
    }
    // Light sanitisation
    const ensureArr = (v: any) => Array.isArray(v) ? v : [];
    const ensureStr = (v: any) => typeof v === "string" ? v : "";
    const fields = {
      pupilName:       ensureStr(parsed.pupilName),
      personalSummary: ensureStr(parsed.personalSummary),
      email:           ensureStr(parsed.email),
      phone:           ensureStr(parsed.phone),
      location:        ensureStr(parsed.location),
      skills:          ensureArr(parsed.skills).map((s: any) => ensureStr(s)).filter(Boolean),
      languages:       ensureArr(parsed.languages).map((l: any) => ({ language: ensureStr(l?.language), level: ensureStr(l?.level) })).filter((l: any) => l.language),
      education:       ensureArr(parsed.education).map((e: any) => ({ school: ensureStr(e?.school), qualification: ensureStr(e?.qualification), dates: ensureStr(e?.dates), grades: ensureStr(e?.grades) })).filter((e: any) => e.school || e.qualification),
      workExperience:  ensureArr(parsed.workExperience).map((w: any) => ({ role: ensureStr(w?.role), organisation: ensureStr(w?.organisation), dates: ensureStr(w?.dates), description: ensureStr(w?.description) })).filter((w: any) => w.role || w.organisation),
      achievements:    ensureArr(parsed.achievements).map((a: any) => ensureStr(a)).filter(Boolean),
      interests:       ensureStr(parsed.interests),
      references:      ensureStr(parsed.references),
    };
    res.json({ fields, provider });
  } catch (err: any) {
    console.error("[ai/cv/parse] AI error:", err?.message);
    res.status(502).json({ error: "AI is temporarily unavailable. Please try again." });
  }
});

// ── POST /api/ai/cv — generate a polished single-page CV ─────────────────────
router.post("/cv", tryAuthForDocs, async (req: Request, res: Response) => {
  const access = await assertPupilDocAccess(req);
  if (!access.ok) return res.status(access.status).json({ error: access.message });

  const { pupilName, yearGroup, schoolName, personalSummary, skills, achievements, workExperience, volunteering, interests, references, email, phone, location, education, languages } = req.body || {};

  const system = `You are a professional UK careers adviser and CV editor. You write FlowCV-quality, ATS-friendly, single-page CVs for UK school-age students (Year 7–13). Use clean headings, relevant keywords, impact-focused bullets, honest evidence, and concise British English. The CV must work for first jobs, work experience, sixth-form, apprenticeships, or university enrichment applications without inventing facts.`;

  const user = `Generate a polished, printable, single-page CV for a UK school student.

Pupil name: ${safeStr(pupilName, 120)}
Year group: ${safeStr(yearGroup, 40)}
School: ${safeStr(schoolName, 200)}
Contact: ${[safeStr(email, 120), safeStr(phone, 80), safeStr(location, 120)].filter(Boolean).join(" | ")}

Personal summary (rough notes):
${safeStr(personalSummary, 800)}

Skills (bullet list — expand each if useful, keep punchy):
${Array.isArray(skills) ? skills.map((s: any) => "- " + safeStr(s, 150)).join("\n") : safeStr(skills, 800)}

Achievements:
${Array.isArray(achievements) ? achievements.map((a: any) => "- " + safeStr(a, 200)).join("\n") : safeStr(achievements, 1200)}

Work experience:
${Array.isArray(workExperience) ? workExperience.map((w: any) => `- ${safeStr(w.role, 120)} at ${safeStr(w.organisation, 150)}${w.dates ? ` (${safeStr(w.dates, 40)})` : ""}: ${safeStr(w.description, 400)}`).join("\n") : safeStr(workExperience, 1600)}

Education:
${Array.isArray(education) ? education.map((e: any) => `- ${safeStr(e.qualification, 200)} — ${safeStr(e.school, 200)}${e.dates ? ` (${safeStr(e.dates, 60)})` : ""}${e.grades ? ` — ${safeStr(e.grades, 200)}` : ""}`).join("\n") : safeStr(education, 1200)}

Languages:
${Array.isArray(languages) ? languages.map((l: any) => `- ${safeStr(l.language, 60)}${l.level ? ` (${safeStr(l.level, 40)})` : ""}`).join("\n") : safeStr(languages, 400)}

Volunteering:
${Array.isArray(volunteering) ? volunteering.map((v: any) => `- ${safeStr(v.role, 120)} at ${safeStr(v.organisation, 150)}: ${safeStr(v.description, 300)}`).join("\n") : safeStr(volunteering, 1200)}

Interests: ${safeStr(interests, 400)}
References: ${safeStr(references, 400)}

OUTPUT RULES — follow strictly:
- Return a single clean markdown document designed for a polished one-page, FlowCV-style student CV preview.
- Structure (use these exact H2 headings in this order):
  ## Profile
  ## Skills
  ## Experience
  ## Education
  ## Languages
  ## Achievements
  ## Interests
  ## References
- "Profile" is 2 concise, specific sentences that summarise direction, strengths, and evidence.
- "Skills" — 6–8 bullets, each a keyword-rich, evidenced skill suitable for ATS and human skim-reading.
- "Experience" — each entry: bold role + organisation on one line, italic dates on next line, then 2–3 outcome-led bullets starting with an action verb.
- "Education" — list each entry on its own line as: **qualification** — school (dates) — grades. Use only the provided data; if none provided, write "Add your school and qualifications."
- "Languages" — one bullet per language as "Language — Level". Skip the section entirely if none provided.
- "Achievements" — 3–5 specific bullets, include grades, awards, positions of responsibility.
- "Interests" — one concise line (not a bullet list).
- "References" — "Available on request" unless specific names given.
- Use British English. No emojis. No markdown tables.
- DO NOT invent experience or achievements that the user did not mention. If a section has no input, write "Ask ${safeStr(pupilName, 80) || "the pupil"} to add this." so it's visible but honest.
- DO NOT exceed 470 words total — CV must fit on one page in a compact modern template.
- Return ONLY the markdown, nothing else.`;

  try {
    const { content, provider } = await callWithFallback(system, user, 1800, undefined, access.schoolId || undefined);
    res.json({ content, provider });
  } catch (err: any) {
    console.error("CV generation error:", err);
    res.status(502).json({ error: "AI is temporarily unavailable. Please try again." });
  }
});

// ── POST /api/ai/personal-statement ──────────────────────────────────────────
router.post("/personal-statement", tryAuthForDocs, async (req: Request, res: Response) => {
  const access = await assertPupilDocAccess(req);
  if (!access.ok) return res.status(access.status).json({ error: access.message });

  const { pupilName, yearGroup, target, targetDetail, motivation, achievements, experience, goals, maxChars } = req.body || {};

  // UCAS personal statement limit is 4000 chars. Sixth-form/apprenticeship typically 2000.
  const targetLabel = safeStr(target, 40) || "sixth_form";
  const hardLimit = Math.min(Number(maxChars) || (targetLabel === "ucas" ? 4000 : 2000), 4000);

  const system = `You are an expert UK careers, apprenticeship, sixth-form and admissions adviser. You write clear, specific, genuine personal statements for UK school students. Use British English, avoid clichés, and turn rough parent/student notes into structured, credible paragraphs. Every claim must be evidenced by a concrete detail from the notes, or omitted.`;

  const user = `Write a polished personal statement for a UK school student.

Pupil name: ${safeStr(pupilName, 120)}
Year group: ${safeStr(yearGroup, 40)}
Target: ${targetLabel}${targetDetail ? ` (${safeStr(targetDetail, 200)})` : ""}

Rough notes from the pupil/parent:

Why this course/role/transition matters to me:
${safeStr(motivation, 1200)}

Relevant achievements:
${safeStr(achievements, 1200)}

Relevant experience:
${safeStr(experience, 1200)}

Future goals:
${safeStr(goals, 800)}

OUTPUT RULES — follow strictly:
- Plain prose. No headings, no bullet points, no markdown.
- British English.
- Maximum ${hardLimit} characters INCLUDING spaces. If you exceed this, trim before returning.
- Four polished paragraphs with a natural admissions tone:
   1. Opening hook — a specific reason for pursuing this course/role/transition. No cliché openers.
   2. Academic/educational evidence — reference specific achievements from the notes.
   3. Broader experience — work, volunteering, extra-curricular — always tie back to the target.
   4. Forward-looking close — what the pupil will bring and what they want to learn.
- Every paragraph should include a specific, checkable detail from the notes where available; if notes are thin, be concise instead of generic.
- Do NOT invent facts. If the notes are thin, keep the statement shorter and more focused rather than padding with generic claims.
- Return ONLY the statement text, nothing else.`;

  try {
    const { content, provider } = await callWithFallback(system, user, 2000, undefined, access.schoolId || undefined);
    // enforce hard limit client-side too
    const clipped = content.length > hardLimit ? content.slice(0, hardLimit) : content;
    res.json({ content: clipped, provider, charCount: clipped.length, hardLimit });
  } catch (err: any) {
    console.error("Personal statement generation error:", err);
    res.status(502).json({ error: "AI is temporarily unavailable. Please try again." });
  }
});

// ── POST /api/ai/cover-letter ────────────────────────────────────────────────
router.post("/cover-letter", tryAuthForDocs, async (req: Request, res: Response) => {
  const access = await assertPupilDocAccess(req);
  if (!access.ok) return res.status(access.status).json({ error: access.message });

  const { pupilName, yearGroup, role, organisation, addressee, motivation, relevantExperience, skills, closing } = req.body || {};

  const system = `You are an expert UK careers adviser and cover-letter editor. You write concise, specific one-page cover letters for school-age students applying for work experience, apprenticeships, Saturday jobs, and early career opportunities. Use plain British English, a professional but age-appropriate tone, and concrete evidence from the notes. No filler and no invented facts.`;

  const user = `Write a one-page cover letter for a UK school student.

Pupil name: ${safeStr(pupilName, 120)}
Year group: ${safeStr(yearGroup, 40)}
Role applied for: ${safeStr(role, 200)}
Organisation: ${safeStr(organisation, 200)}
Addressed to: ${safeStr(addressee, 120) || "Hiring Manager"}

Why the pupil wants this role:
${safeStr(motivation, 1000)}

Relevant experience:
${safeStr(relevantExperience, 1200)}

Skills they bring:
${Array.isArray(skills) ? skills.map((s: any) => "- " + safeStr(s, 150)).join("\n") : safeStr(skills, 600)}

Closing note:
${safeStr(closing, 400)}

OUTPUT RULES:
- Plain prose with standard UK letter layout: sender/contact placeholder, date, recipient/addressee, subject line if useful, body, and sign-off.
- Use "Dear ${safeStr(addressee, 120) || "Hiring Manager"}," and end with "Yours sincerely" if the addressee is named, "Yours faithfully" otherwise.
- Three focused body paragraphs: (1) role and motivation, (2) specific evidence of fit using the notes, (3) courteous close with availability or next steps.
- Maximum 350 words for the letter body (excluding address block).
- British English. No markdown. No bullet points.
- Do NOT invent facts beyond what is provided.
- Return ONLY the letter.`;

  try {
    const { content, provider } = await callWithFallback(system, user, 1400, undefined, access.schoolId || undefined);
    res.json({ content, provider });
  } catch (err: any) {
    console.error("Cover letter generation error:", err);
    res.status(502).json({ error: "AI is temporarily unavailable. Please try again." });
  }
});

// ── POST /api/ai/apply-send-overlay ──────────────────────────────────────────
// Applies the SEND overlay engine to AI-generated worksheet sections.
// This ensures the same support boxes (sentence starters, scaffolds, brain breaks)
// that library worksheets get are also applied to AI-generated ones.
// IMPORTANT: This only adds presentation scaffolding — it never modifies question
// content, reorders sections, changes mark allocations, or touches diagrams.
router.post("/apply-send-overlay", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sections, sendNeed } = req.body;
    if (!sections || !Array.isArray(sections) || !sendNeed) {
      return res.status(400).json({ error: "Missing sections or sendNeed" });
    }
    // Skip if SEND support sections already exist (avoid double-applying)
    const alreadyHasSendSupport = sections.some((s: any) => s.type === "send-support");
    if (alreadyHasSendSupport) {
      return res.json({ sections, appliedOverlays: [] });
    }
    // Import and apply the overlay engine
    const { applyOverlays } = await import("../lib/overlayEngine.js");
    // Ensure sections have IDs for the overlay engine
    const sectionsWithIds = sections.map((s: any, i: number) => ({
      ...s,
      id: s.id || s.sectionId || `section-${i}`,
    }));
    const overlayResult = applyOverlays(sectionsWithIds, {
      sendNeed,
      retrievalTopic: null,
      additionalInstructions: null,
      readingAge: null,
    });
    res.json({ sections: overlayResult.sections, appliedOverlays: overlayResult.appliedOverlays });
  } catch (err: any) {
    console.error("SEND overlay application error:", err);
    res.status(500).json({ error: "Failed to apply SEND overlay" });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/ai/scan-mark   (FEAT-010 — Scan-and-mark + closed-loop adaptive)
// ────────────────────────────────────────────────────────────────────────────────
// Accepts a photo of a completed worksheet (jpeg/png/webp/heic/pdf-page). Sends
// the image to Gemini 2.5 Flash with a structured marking prompt. Returns
// per-question {questionText, pupilAnswer, correct, modelAnswer, marks,
// misconceptionTag} that the client uses to (a) display a marking grid and
// (b) push the misconceptionTag list back onto Child.recentMisconceptions so
// the next worksheet auto-injects remediation via pupil-context.ts.
//
// Vision is only available on Gemini in this codebase, so we go straight to
// the Gemini API rather than the multi-provider fallback.
// ────────────────────────────────────────────────────────────────────────────────
router.post(
  "/scan-mark",
  requireAuth,
  worksheetUpload.single("image"),
  async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const mime = req.file.mimetype || "image/jpeg";
    const isImage = mime.startsWith("image/");
    const isPdf = mime === "application/pdf" || (req.file.originalname || "").toLowerCase().endsWith(".pdf");
    if (!isImage && !isPdf) {
      return res.status(415).json({ error: "Upload a JPEG, PNG, WebP, HEIC, or single-page PDF." });
    }

    let title = "";
    let subject = "";
    let topic = "";
    let yearGroup = "";
    let expectedAnswers: Array<{ questionText: string; modelAnswer?: string; marks?: number }> = [];
    try {
      title = String(req.body.title || "").slice(0, 200);
      subject = String(req.body.subject || "").slice(0, 80);
      topic = String(req.body.topic || "").slice(0, 200);
      yearGroup = String(req.body.yearGroup || "").slice(0, 40);
      if (req.body.expectedAnswers) {
        const parsed = typeof req.body.expectedAnswers === "string"
          ? JSON.parse(req.body.expectedAnswers)
          : req.body.expectedAnswers;
        if (Array.isArray(parsed)) {
          expectedAnswers = parsed
            .filter((q: any) => q && typeof q.questionText === "string")
            .slice(0, 30)
            .map((q: any) => ({
              questionText: String(q.questionText).slice(0, 600),
              modelAnswer: q.modelAnswer ? String(q.modelAnswer).slice(0, 600) : undefined,
              marks: typeof q.marks === "number" ? q.marks : undefined,
            }));
        }
      }
    } catch { /* tolerate malformed metadata */ }

    const user = (req as any).user;
    const schoolId = user?.schoolId;
    const key = await getEffectiveKey("gemini", undefined, schoolId);
    if (!key) {
      return res.status(503).json({
        error: "Gemini API key not configured. Add a Gemini key in Settings to use scan-and-mark.",
      });
    }

    const expectedBlock = expectedAnswers.length
      ? `\n\nFor reference, these are the questions and (where known) the model answers:\n${expectedAnswers
          .map((q, i) => `Q${i + 1}: ${q.questionText}${q.modelAnswer ? `\n  Model answer: ${q.modelAnswer}` : ""}${q.marks ? `\n  Marks available: ${q.marks}` : ""}`)
          .join("\n")}`
      : "";

    const system = `You are a careful UK secondary teacher marking a pupil's completed worksheet from a photograph. You always respond with valid raw JSON only — no prose, no markdown, no code fences.`;

    const userPrompt = `Worksheet context:
- Title: ${title || "(unknown)"}
- Subject: ${subject || "(unknown)"}
- Topic: ${topic || "(unknown)"}
- Year group: ${yearGroup || "(unknown)"}${expectedBlock}

Read the photograph carefully. For every numbered question that has a pupil answer written on the page (skip blank ones), return one entry. Be tolerant of messy handwriting; if a digit could be 1 or 7, choose the more likely option in context. Award full marks for answers that are mathematically equivalent or semantically equivalent to a correct answer (e.g. "1/2" === "0.5", "carbon dioxide" === "CO2"). Award part marks where the working shows partial understanding.

For every question, infer a short misconceptionTag of the form "<topic>: <specific error>" when the pupil is wrong (e.g. "fractions: did not find common denominator", "photosynthesis: confused inputs and outputs"). Leave misconceptionTag as null when the answer is correct.

Return EXACTLY this JSON shape:
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Short copy of the question stem (max 240 chars)",
      "pupilAnswer": "Verbatim transcription of the pupil's written answer (max 240 chars)",
      "correct": true,
      "marksAwarded": 2,
      "marksAvailable": 2,
      "modelAnswer": "What a correct answer looks like (max 240 chars)",
      "misconceptionTag": null
    }
  ],
  "summary": {
    "totalAwarded": 0,
    "totalAvailable": 0,
    "overallNote": "One short sentence the teacher can use as feedback (max 200 chars)"
  }
}

Strict rules:
1. Output raw JSON only — no markdown, no commentary.
2. Cap "questions" to at most 20 entries.
3. "marksAwarded" must never exceed "marksAvailable".
4. "correct" is true only when marksAwarded === marksAvailable.
5. If you cannot read the page at all, return { "questions": [], "summary": { "totalAwarded": 0, "totalAvailable": 0, "overallNote": "Could not read the photograph clearly." } }.`;

    const base64 = req.file.buffer.toString("base64");
    const visionMime = isPdf ? "application/pdf" : mime;
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: userPrompt },
            { inlineData: { mimeType: visionMime, data: base64 } },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { maxOutputTokens: 2200, temperature: 0.1 },
    };

    try {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (aiRes.status === 429) {
        return res.status(429).json({ error: "Gemini rate limit hit. Wait a few seconds and try again." });
      }
      if (!aiRes.ok) {
        const txt = (await aiRes.text()).slice(0, 200);
        return res.status(502).json({ error: `Gemini ${aiRes.status}: ${txt}` });
      }
      const data: any = await aiRes.json();
      const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) {
        return res.status(502).json({ error: "Gemini returned an empty response." });
      }
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      let parsed: any;
      try {
        parsed = JSON.parse(match ? match[0] : cleaned);
      } catch (parseErr: any) {
        return res.status(502).json({ error: "Gemini returned malformed JSON.", raw: cleaned.slice(0, 400) });
      }

      // Normalise the response so the client can rely on the shape.
      const questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 20) : [];
      const normalised = questions.map((q: any, idx: number) => {
        const marksAvailable = typeof q.marksAvailable === "number" ? Math.max(0, Math.round(q.marksAvailable)) : 1;
        let marksAwarded = typeof q.marksAwarded === "number" ? Math.max(0, Math.round(q.marksAwarded)) : 0;
        if (marksAwarded > marksAvailable) marksAwarded = marksAvailable;
        const correct = typeof q.correct === "boolean"
          ? q.correct
          : marksAvailable > 0 && marksAwarded === marksAvailable;
        const tag = typeof q.misconceptionTag === "string" && q.misconceptionTag.trim()
          ? q.misconceptionTag.trim().slice(0, 160)
          : null;
        return {
          questionNumber: typeof q.questionNumber === "number" ? q.questionNumber : idx + 1,
          questionText: typeof q.questionText === "string" ? q.questionText.slice(0, 600) : "",
          pupilAnswer: typeof q.pupilAnswer === "string" ? q.pupilAnswer.slice(0, 600) : "",
          correct,
          marksAwarded,
          marksAvailable,
          modelAnswer: typeof q.modelAnswer === "string" ? q.modelAnswer.slice(0, 600) : "",
          misconceptionTag: correct ? null : tag,
        };
      });
      const totalAwarded = normalised.reduce((t: number, q: any) => t + q.marksAwarded, 0);
      const totalAvailable = normalised.reduce((t: number, q: any) => t + q.marksAvailable, 0);
      const overallNote = typeof parsed?.summary?.overallNote === "string"
        ? parsed.summary.overallNote.slice(0, 240)
        : "";

      return res.json({
        questions: normalised,
        summary: { totalAwarded, totalAvailable, overallNote },
        provider: "gemini",
      });
    } catch (err: any) {
      console.error("[scan-mark] failed:", err?.message || err);
      return res.status(500).json({ error: "Could not mark the worksheet. Please try again." });
    }
  }
);

// ── POST /api/ai/diagram-probe — MATHS-ONLY developer probe ─────────────────
// A throwaway-by-design endpoint that lets the product owner eyeball whether
// AI-generated SVG diagrams are good enough to re-enable in the maths
// pipeline. Production /api/ai/diagram is unchanged — it still serves
// admin-library images only.
//
// What this endpoint does:
//   1. Server-side guard: rejects non-maths subjects with 400. The probe is
//      a maths-quality decision; allowing other subjects would muddy the
//      signal and re-introduce a path the product team hasn't asked for.
//   2. Calls buildDiagramPrompt + callWithFallback with the existing
//      free-tier provider chain.
//   3. Parses the SVG + caption out of the LLM response, tolerating the
//      common failure modes (markdown fences, leading prose, no caption).
//   4. Returns a structured result so the client can render and audit it.
//      The audit itself runs on the client so we don't pay for two copies
//      of the audit code (it lives in client/src/lib/svgLayoutChecker.ts).
//
// `auditFeedback`, when present, is appended to the user prompt verbatim —
// this is the "retry with failure detail" path. Keeps the retry policy
// shape on the client where the rest of the SVG audit code lives.
router.post("/diagram-probe", requireAuth, async (req: Request, res: Response) => {
  const { subject, topic, yearGroup, sendNeed, auditFeedback } = req.body || {};
  if (!subject || !topic) {
    return res.status(400).json({ error: "subject and topic required" });
  }
  const subjectLower = String(subject).toLowerCase().trim();
  const isMaths =
    subjectLower === "maths" ||
    subjectLower === "math" ||
    subjectLower === "mathematics";
  if (!isMaths) {
    return res.status(400).json({
      error: "diagram-probe is maths-only by design. Set subject to Maths.",
    });
  }

  const yr = String(yearGroup || "Year 9");
  const { system, user: baseUser } = buildDiagramPrompt(
    String(subject),
    String(topic),
    yr,
    typeof sendNeed === "string" && sendNeed.trim().length > 0 ? sendNeed : undefined,
  );

  // When auditFeedback is supplied (retry path) inject it verbatim into the
  // user prompt so the LLM can act on the specific failure detail.
  const user =
    typeof auditFeedback === "string" && auditFeedback.trim().length > 0
      ? `${baseUser}\n\nPREVIOUS ATTEMPT FAILED THE LAYOUT AUDIT WITH THE FOLLOWING ISSUES — fix every one of them in the next attempt:\n${auditFeedback.trim()}`
      : baseUser;

  try {
    const schoolId = (req as any).user?.schoolId || undefined;
    const { content, provider } = await callWithFallback(
      system,
      user,
      4000,
      undefined,
      schoolId,
    );

    // Parse: tolerate ```svg fences, prose preambles, and missing caption.
    let raw = String(content || "").trim();
    raw = raw.replace(/^```(?:svg|xml|html)?\s*/i, "").replace(/\s*```\s*$/i, "");
    const svgMatch = /<svg[\s\S]*?<\/svg>/i.exec(raw);
    const svg = svgMatch ? svgMatch[0] : "";
    let caption = "";
    const capMatch = /CAPTION\s*:\s*(.+?)\s*$/im.exec(raw);
    if (capMatch) caption = capMatch[1].trim();

    return res.json({
      svg,
      caption,
      provider,
      raw, // surfaced so the probe page can show what came back when parsing fails
      retried: typeof auditFeedback === "string" && auditFeedback.trim().length > 0,
    });
  } catch (err: any) {
    console.error("[diagram-probe] failed:", err?.message || err);
    return res
      .status(502)
      .json({ error: err?.message || "All providers failed. Try again." });
  }
});

export default router;
