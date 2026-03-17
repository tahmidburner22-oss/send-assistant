import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import db from "../db/index.js";
import { requireAuth, requireAdmin, auditLog } from "../middleware/auth.js";
import { filterContent } from "../lib/contentFilter.js";
import { getSchoolKey } from "./schoolApiKeys.js";
import { findDiagram, searchWikimediaDiagram } from "../lib/diagramBank.js";
import * as _fullDiagramBankModule from "../lib/diagramBankFull.js";
// Static import (esbuild bundles everything into a single file, dynamic imports don't work)
function getFullDiagramBank() {
  return _fullDiagramBankModule;
}

const router = Router();
const worksheetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ── Provider priority order — server always tries all of these automatically ──
// Gemini Flash is fastest for large JSON outputs; Groq 8b-instant is second fastest
// Additional providers: mistral, deepseek, cohere, perplexity
// Provider priority: fastest/best first, cohere as absolute last resort (expensive, slow)
// perplexity removed — no key configured
const PROVIDER_ORDER = ["gemini", "groq", "openai", "openrouter", "claude", "mistral", "deepseek", "huggingface", "cohere"] as const;

// ── Per-provider cooldown tracker ─────────────────────────────────────────────
// When a provider hits a rate limit (429), it is put in cooldown for COOLDOWN_MS.
// During cooldown it is skipped entirely so other providers can serve requests.
// This prevents cascading failures where every provider gets exhausted at once.
const COOLDOWN_MS = 20_000; // 20 seconds per provider — shorter cooldown means faster recovery
const providerCooldowns = new Map<string, number>(); // provider → timestamp when cooldown expires

function isOnCooldown(provider: string): boolean {
  const expiresAt = providerCooldowns.get(provider);
  if (!expiresAt) return false;
  if (Date.now() < expiresAt) return true;
  providerCooldowns.delete(provider); // cooldown expired
  return false;
}

function setCooldown(provider: string): void {
  const expiresAt = Date.now() + COOLDOWN_MS;
  providerCooldowns.set(provider, expiresAt);
  console.warn(`[AI] ${provider} put on cooldown for ${COOLDOWN_MS / 1000}s (until ${new Date(expiresAt).toISOString()})`);
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
    for (const [p, exp] of providerCooldowns.entries()) {
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
function getEffectiveKey(provider: string, userKey?: string, schoolId?: string): string {
  if (userKey && userKey.trim()) return userKey.trim();
  // 1. School-level encrypted key (primary source — each school brings their own)
  if (schoolId) {
    const schoolEntry = getSchoolKey(schoolId, provider);
    if (schoolEntry?.key) return schoolEntry.key;
  }
  // 2. Global admin key (stored in DB — set via admin panel, never hardcoded)
  try {
    const adminKey = db.prepare(
      "SELECT api_key FROM admin_api_keys WHERE provider = ?"
    ).get(provider) as any;
    if (adminKey?.api_key) return adminKey.api_key;
  } catch (_) {}
  // 3. Platform-level env vars (Railway — for the Adaptly platform operator account only)
  const envMap: Record<string, string> = {
    groq: process.env.GROQ_API_KEY || "",
    gemini: process.env.GEMINI_API_KEY || "",
    openai: process.env.OPENAI_API_KEY || "",
    openrouter: process.env.OPENROUTER_API_KEY || "",
    claude: process.env.CLAUDE_API_KEY || "",
    huggingface: process.env.HUGGINGFACE_API_KEY || "",
    mistral: process.env.MISTRAL_API_KEY || "",
    deepseek: process.env.DEEPSEEK_API_KEY || "",
    cohere: process.env.COHERE_API_KEY || "",
    perplexity: process.env.PERPLEXITY_API_KEY || "",
  };
  return envMap[provider] || "";
}

function getAdminModel(provider: string, schoolId?: string): string {
  if (schoolId) {
    const schoolEntry = getSchoolKey(schoolId, provider);
    if (schoolEntry?.model) return schoolEntry.model;
  }
  try {
    const row = db.prepare(
      "SELECT model FROM admin_api_keys WHERE provider = ?"
    ).get(provider) as any;
    return row?.model || "";
  } catch (_) { return ""; }
}

// ── Core: call a single provider ─────────────────────────────────────────────
async function callProvider(
  provider: string,
  system: string,
  user: string,
  key: string,
  model: string,
  maxTokens: number
): Promise<string> {
  // Per-provider timeout: fast providers get 25s, slower ones get 40s.
  // This ensures one slow provider never blocks the fallback chain.
  const timeoutMs = (provider === "groq" || provider === "gemini") ? 25000 : 40000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let result: string;
    switch (provider) {
      case "groq":
        result = await callGroq(system, user, key, model || "llama-3.3-70b-versatile", maxTokens);
        break;
      case "gemini":
        result = await callGemini(system, user, key, maxTokens);
        break;
      case "openai":
        result = await callOpenAI(system, user, key, model || "gpt-4o-mini", maxTokens);
        break;
      case "openrouter":
        result = await callOpenRouter(system, user, key, model, maxTokens);
        break;
      case "claude":
        result = await callClaude(system, user, key, maxTokens);
        break;
      case "huggingface":
        result = await callHuggingFace(system, user, key, maxTokens);
        break;
      case "mistral":
        result = await callMistral(system, user, key, model || "mistral-medium-latest", maxTokens);
        break;
      case "deepseek":
        result = await callDeepSeek(system, user, key, model || "deepseek-chat", maxTokens);
        break;
      case "cohere":
        result = await callCohere(system, user, key, model || "command-r-plus", maxTokens);
        break;
      case "perplexity":
        result = await callPerplexity(system, user, key, model || "llama-3.1-sonar-large-128k-online", maxTokens);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

// ── Auto-fallback: try every provider until one succeeds ─────────────────────
async function callWithFallback(
  system: string,
  user: string,
  maxTokens: number,
  preferredProvider?: string,
  schoolId?: string
): Promise<{ content: string; provider: string }> {
  // Build ordered list: school providers first, then global
  let order: string[];
  if (schoolId) {
    const schoolProviders = (db.prepare(
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

  const errors: string[] = [];

  // Filter out providers currently on cooldown before attempting
  const availableOrder = getAvailableProviders(order);
  if (availableOrder.length < order.length) {
    const cooledDown = order.filter(p => !availableOrder.includes(p));
    console.log(`[AI] Skipping ${cooledDown.join(", ")} (on cooldown) — using: ${availableOrder.join(", ")}`);
  }

  // Try available providers first
  const ordersToTry = availableOrder.length > 0 ? availableOrder : order;

  for (const provider of ordersToTry) {
    const key = getEffectiveKey(provider, undefined, schoolId);
    if (!key) {
      errors.push(`${provider}: no key configured`);
      continue;
    }
    try {
      const model = getAdminModel(provider, schoolId);
      const content = await callProvider(provider, system, user, key, model, maxTokens);
      if (content && content.trim()) {
        console.log(`[AI] Success via ${provider}`);
        return { content, provider };
      }
      errors.push(`${provider}: empty response`);
    } catch (err: any) {
      const msg = err?.message || String(err);
      // Rate limit (429) or quota exceeded — put provider on cooldown and skip
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("too many requests");
      if (isRateLimit) {
        setCooldown(provider); // marks provider as unavailable for COOLDOWN_MS
        errors.push(`${provider}: rate limited (429) — on cooldown for 60s`);
        continue;
      }
      // Auth error (401/403) — skip silently (do NOT put on cooldown — may be a bad key, not a rate limit)
      const isAuthError = msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid api key");
      if (isAuthError) {
        console.warn(`[AI] ${provider} auth error — trying next provider`);
        errors.push(`${provider}: auth error — skipped`);
        continue;
      }
      console.warn(`[AI] ${provider} failed: ${msg.slice(0, 120)}`);
      errors.push(`${provider}: ${msg.slice(0, 80)}`);
    }
  }

  // Last resort: if all available providers failed but there are cooled-down ones, try them too
  const cooledDownProviders = order.filter(p => !ordersToTry.includes(p));
  for (const provider of cooledDownProviders) {
    const key = getEffectiveKey(provider, undefined, schoolId);
    if (!key) continue;
    try {
      providerCooldowns.delete(provider); // force clear cooldown for this last-ditch attempt
      const model = getAdminModel(provider, schoolId);
      const content = await callProvider(provider, system, user, key, model, maxTokens);
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
  const { prompt, systemPrompt, provider, model, apiKey, maxTokens = 2000 } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  // Content filtering
  const promptFilter = filterContent(prompt);
  const logId = uuidv4();

  try {
    db.prepare(`INSERT INTO ai_filter_log (id, user_id, school_id, prompt, flagged, flag_reason)
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
      db.prepare(`INSERT INTO safeguarding_incidents (id, school_id, reported_by, description, ai_trigger, severity)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        incidentId, req.user!.schoolId, req.user!.id,
        `AI prompt flagged: ${promptFilter.reason}`,
        prompt.slice(0, 500),
        promptFilter.severity || "medium"
      );
      const school = db.prepare("SELECT * FROM schools WHERE id = ?").get(req.user!.schoolId) as any;
      if (school?.dsl_email) {
        const { sendDSLIncidentAlert } = await import("../email/index.js");
        db.prepare("UPDATE safeguarding_incidents SET dsl_notified=1, dsl_notified_at=datetime('now') WHERE id=?").run(incidentId);
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

  try {
    // If user provided a specific key for a specific provider, try that first
    // Otherwise auto-fallback across all configured providers
    let result: { content: string; provider: string };

    if (apiKey && provider) {
      // User supplied their own key — try that provider first, then auto-fallback
      try {
        const model = getAdminModel(provider);
        const content = await callProvider(provider, systemPrompt || "", prompt, apiKey, model, maxTokens);
        result = { content, provider };
      } catch (_) {
        result = await callWithFallback(systemPrompt || "", prompt, maxTokens, provider, req.user!.schoolId || undefined);
      }
    } else {
      // No user key — auto-fallback using school keys first, then global
      result = await callWithFallback(systemPrompt || "", prompt, maxTokens, provider, req.user!.schoolId || undefined);
    }

    const responseFilter = filterContent(result.content);
    try {
      db.prepare("UPDATE ai_filter_log SET output=?, flagged=?, flag_reason=? WHERE id=?").run(
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
    res.json({ content: result.content, provider: result.provider, aiGenerated: true });
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
    res.status(502).json({ error: "AI is temporarily unavailable. Please try again in a moment." });
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

  // Run up to 3 providers in parallel (all using server env var keys)
  const toRun = PROVIDER_ORDER.filter(p => getEffectiveKey(p)).slice(0, 3);

  if (toRun.length === 0) {
    return res.status(400).json({ error: "No AI providers configured." });
  }

  const results = await Promise.allSettled(
    toRun.map(async (p) => {
      const key = getEffectiveKey(p);
      const model = getAdminModel(p);
      const text = await callProvider(p, systemPrompt || "", prompt, key, model, maxTokens);
      return { provider: p, text };
    })
  );

  const successes = results
    .filter((r): r is PromiseFulfilledResult<{ provider: string; text: string }> => r.status === "fulfilled")
    .map(r => r.value);

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
    .filter(p => getEffectiveKey(p))
    .map(p => ({ provider: p, source: "server" }));
  res.json({ providers: available });
});

// ── Provider cooldown status (admin) ────────────────────────────────────────
router.get("/provider-status", requireAuth, (_req: Request, res: Response) => {
  const now = Date.now();
  const statuses = (PROVIDER_ORDER as readonly string[]).map(p => {
    const hasKey = !!getEffectiveKey(p);
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
  });
  res.json({ providers: statuses, cooldownMs: COOLDOWN_MS });
});

router.post("/clear-cooldowns", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const cleared = [...providerCooldowns.keys()];
  providerCooldowns.clear();
  console.log(`[AI] Admin cleared all provider cooldowns: ${cleared.join(", ") || "none"}`);
  res.json({ success: true, cleared });
});

// ── Admin: manage server-side API keys ────────────────────────────────────────
router.get("/admin/keys", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const keys = db.prepare(
    "SELECT provider, model, updated_at, (CASE WHEN api_key != '' THEN 1 ELSE 0 END) as has_key FROM admin_api_keys"
  ).all();
  res.json(keys);
});

router.post("/admin/keys", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { provider, apiKey, model } = req.body;
  if (!provider || !apiKey) return res.status(400).json({ error: "provider and apiKey required" });

  const existing = db.prepare("SELECT id FROM admin_api_keys WHERE provider = ?").get(provider) as any;
  if (existing) {
    db.prepare(
      "UPDATE admin_api_keys SET api_key=?, model=?, updated_by=?, updated_at=datetime('now') WHERE provider=?"
    ).run(apiKey, model || null, req.user!.id, provider);
  } else {
    db.prepare(
      "INSERT INTO admin_api_keys (id, provider, api_key, model, updated_by) VALUES (?, ?, ?, ?, ?)"
    ).run(uuidv4(), provider, apiKey, model || null, req.user!.id);
  }
  auditLog(req.user!.id, req.user!.schoolId, "admin.api_key_update", "admin_api_keys", provider, { provider }, req.ip);
  res.json({ success: true });
});

router.delete("/admin/keys/:provider", requireAuth, requireAdmin, (req: Request, res: Response) => {
  db.prepare("DELETE FROM admin_api_keys WHERE provider = ?").run(req.params.provider);
  res.json({ success: true });
});

// ── AI Filter Log ─────────────────────────────────────────────────────────────
router.get("/filter-log", requireAuth, (req: Request, res: Response) => {
  const logs = db.prepare(
    `SELECT afl.*, u.display_name FROM ai_filter_log afl
     LEFT JOIN users u ON afl.user_id = u.id
     WHERE afl.school_id = ? ORDER BY afl.created_at DESC LIMIT 200`
  ).all(req.user!.schoolId);
  res.json(logs);
});

// ── AI Usage Stats ────────────────────────────────────────────────────────────
router.get("/stats", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const totalRequests = (db.prepare("SELECT COUNT(*) as c FROM ai_filter_log WHERE school_id=?").get(schoolId) as any)?.c || 0;
  const flaggedRequests = (db.prepare("SELECT COUNT(*) as c FROM ai_filter_log WHERE school_id=? AND flagged=1").get(schoolId) as any)?.c || 0;
  const todayRequests = (db.prepare("SELECT COUNT(*) as c FROM ai_filter_log WHERE school_id=? AND date(created_at)=date('now')").get(schoolId) as any)?.c || 0;
  const topUsers = db.prepare(
    `SELECT u.display_name, COUNT(*) as requests FROM ai_filter_log afl
     JOIN users u ON afl.user_id=u.id WHERE afl.school_id=?
     GROUP BY afl.user_id ORDER BY requests DESC LIMIT 5`
  ).all(schoolId);
  res.json({ totalRequests, flaggedRequests, todayRequests, topUsers });
});

// ── Provider implementations ──────────────────────────────────────────────────
async function callGroq(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  clearTimeout(timeout);
  if (res.status === 429) throw new Error(`Groq 429: rate limited`);
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

async function callGemini(system: string, user: string, key: string, maxTokens: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: system ? `${system}\n\n${user}` : user }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.1 },
      }),
    }
  );
  clearTimeout(timeout);
  if (res.status === 429) throw new Error(`Gemini 429: rate limited`);
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
    }),
  });
  clearTimeout(timeout);
  if (res.status === 429) throw new Error(`OpenAI 429: rate limited`);
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

async function callOpenRouter(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const fallbackModels = [
    model,
    "nvidia/nemotron-nano-9b-v2:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "arcee-ai/trinity-mini:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
  ].filter(Boolean);

  for (const m of fallbackModels) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://adaptly.co.uk",
          "X-Title": "Adaptly",
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: "system", content: system || "You are a helpful SEND education assistant." },
            { role: "user", content: user },
          ],
          max_tokens: maxTokens,
        }),
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

async function callClaude(system: string, user: string, key: string, maxTokens: number): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
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

async function callHuggingFace(system: string, user: string, key: string, maxTokens: number): Promise<string> {
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
async function callMistral(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  clearTimeout(timeout);
  if (res.status === 429) throw new Error(`Mistral 429: rate limited`);
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

// ── DeepSeek ─────────────────────────────────────────────────────────────────
async function callDeepSeek(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // DeepSeek can be slower
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  clearTimeout(timeout);
  if (res.status === 429) throw new Error(`DeepSeek 429: rate limited`);
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

// ── Cohere ───────────────────────────────────────────────────────────────────
async function callCohere(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const res = await fetch("https://api.cohere.com/v2/chat", {
    method: "POST",
    signal: controller.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
    }),
  });
  clearTimeout(timeout);
  if (res.status === 429) throw new Error(`Cohere 429: rate limited`);
  if (!res.ok) throw new Error(`Cohere ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  // Cohere v2 response format
  return data?.message?.content?.[0]?.text || data?.text || "";
}

// ── Perplexity ───────────────────────────────────────────────────────────────
async function callPerplexity(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  clearTimeout(timeout);
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
12. After </svg> write: CAPTION: [one sentence describing the diagram]`;

  const user = `Draw a professional educational SVG diagram for a UK school worksheet.

Subject: ${subject} | Topic: ${topic} | Year: ${yearGroup}

Diagram specification (follow coordinates exactly where given):
${hint}

REMINDER: All labels in Zone B (x=55-150), C (x=550-645), D (y=45-52), or E (y=435-465). No label inside Zone A (x=160-540, y=55-420). Short leader lines only. No crossing lines.`;

  return { system, user };
}

// ── POST /api/ai/diagram — dedicated diagram generation with fallback chain ───
router.post("/diagram", requireAuth, async (req: Request, res: Response) => {
  const { subject, topic, yearGroup, sendNeed } = req.body;
  if (!subject || !topic) return res.status(400).json({ error: "subject and topic required" });

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
  }) => ({
    imageUrl: payload.imageUrl,
    caption: payload.caption || `${topic} — ${subject} (${yr})`,
    attribution: payload.attribution || null,
    provider: payload.provider,
    type: payload.type || (payload.imageUrl ? "image" : "none"),
    imageKind: payload.imageKind || "diagram",
    fit: fitMeta,
  });

  const topicHasAny = (...terms: string[]) => terms.some((term) => combined.includes(term));

  const pickApprovedSourceFallback = () => {
    if (subjectLower.includes("biology") || subjectLower.includes("science")) {
      if (topicHasAny("cell", "cells and organisation", "animal cell", "plant cell")) {
        return buildImageResponse({
          imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/960px-Animal_cell_structure_en.svg.png",
          caption: `Animal cell structure — ${subject} (${yr})`,
          attribution: "LadyofHats, Wikimedia Commons (Public Domain)",
          provider: "wikimedia-approved",
          imageKind: "diagram",
        });
      }
      if (topicHasAny("photosynthesis", "chloroplast")) {
        return buildImageResponse({
          imageUrl: "https://bioicons.com/icons/photosynthesis.svg",
          caption: `Photosynthesis visual support — ${subject} (${yr})`,
          attribution: "Bioicons (licence retained per asset)",
          provider: "bioicons-approved",
          imageKind: "icon",
        });
      }
      if (topicHasAny("space", "solar system", "planet", "moon", "mars", "earth")) {
        return buildImageResponse({
          imageUrl: "https://images-assets.nasa.gov/image/PIA18033/PIA18033~orig.jpg",
          caption: `NASA scientific visual for ${topic} — ${subject} (${yr})`,
          attribution: "NASA",
          provider: "nasa-approved",
          imageKind: "scientific-visual",
        });
      }
      if (topicHasAny("fossil", "evolution", "natural history", "skeleton", "animal")) {
        return buildImageResponse({
          imageUrl: "https://ids.si.edu/ids/deliveryService?id=NMNH-PALEO-00001",
          caption: `Smithsonian Open Access scientific visual for ${topic} — ${subject} (${yr})`,
          attribution: "Smithsonian Open Access (CC0)",
          provider: "smithsonian-approved",
          imageKind: "scientific-visual",
        });
      }
    }

    if (subjectLower.includes("geography") && topicHasAny("earth", "planet", "climate", "weather", "storm", "atmosphere")) {
      return buildImageResponse({
        imageUrl: "https://images-assets.nasa.gov/image/iss063e054463/iss063e054463~orig.jpg",
        caption: `NASA Earth visual for ${topic} — ${subject} (${yr})`,
        attribution: "NASA",
        provider: "nasa-approved",
        imageKind: "scientific-visual",
      });
    }

    if ((subjectLower.includes("art") || subjectLower.includes("design")) && topicHasAny("texture", "nature", "landscape", "light", "shadow")) {
      return buildImageResponse({
        imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        caption: `${topic} reference photo — ${subject} (${yr})`,
        attribution: "Unsplash",
        provider: "unsplash-approved",
        imageKind: "photo",
      });
    }

    if (topicHasAny("habitat", "forest", "ocean", "animal", "plant")) {
      return buildImageResponse({
        imageUrl: "https://cdn.pixabay.com/photo/2016/11/29/09/32/animal-1866808_1280.jpg",
        caption: `${topic} reference photo — ${subject} (${yr})`,
        attribution: "Pixabay",
        provider: "pixabay-approved",
        imageKind: "photo",
      });
    }

    return null;
  };

  // ── Step 1: Curated fast diagram bank (verified Wikimedia URLs) ─────────────
  const bankedDiagram = findDiagram(subject, topic);
  if (bankedDiagram) {
    console.log(`[Diagram] Found in curated bank: ${bankedDiagram.key}`);
    return res.json(buildImageResponse({
      imageUrl: bankedDiagram.url,
      caption: `${bankedDiagram.label} — ${subject} (${yr})`,
      attribution: bankedDiagram.attribution,
      provider: "wikimedia-bank",
      imageKind: "diagram",
    }));
  }

  // ── Step 2: Full comprehensive diagram bank (lazy-loaded, all 623 curriculum topics) ──
  try {
    const fullBank = getFullDiagramBank();
    const fullMatch = fullBank.findDiagramFull(subject, topic);
    if (fullMatch) {
      console.log(`[Diagram] Found in full bank: ${fullMatch.key}`);
      return res.json(buildImageResponse({
        imageUrl: fullMatch.url,
        caption: `${fullMatch.label} — ${subject} (${yr})`,
        attribution: `${fullMatch.attribution} | Licence: ${fullMatch.license}`,
        provider: "wikimedia-full-bank",
        imageKind: "diagram",
      }));
    }
  } catch (fullBankErr) {
    console.warn("[Diagram] Full bank lookup failed:", fullBankErr);
  }

  // ── Step 3: Live Wikimedia Commons search (CC/PD images only) ────────────────────
  try {
    const wikiResult = await Promise.race([
      searchWikimediaDiagram(subject, topic),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 20_000)),
    ]);
    if (wikiResult) {
      console.log(`[Diagram] Found via Wikimedia live search for "${topic}"`);
      return res.json(buildImageResponse({
        imageUrl: wikiResult.url,
        caption: wikiResult.caption || `${topic} — ${subject} (${yr})`,
        attribution: wikiResult.attribution,
        provider: "wikimedia-live",
        imageKind: "diagram",
      }));
    }
  } catch (wikiErr) {
    console.warn(`[Diagram] Wikimedia live search failed for "${topic}":`, wikiErr);
  }

  // ── Step 4: Approved-source topic fallback bank ─────────────────────────────
  const approvedFallback = pickApprovedSourceFallback();
  if (approvedFallback) {
    console.log(`[Diagram] Using approved-source fallback for "${topic}" (${subject}) via ${approvedFallback.provider}`);
    return res.json(approvedFallback);
  }

  console.log(`[Diagram] No approved diagram found for "${topic}" (${subject}) — returning not-available`);
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
// CRITICAL: All questions, content, symbols, and mathematical notation are preserved VERBATIM.
// Only formatting, font, spacing, and structural presentation changes are permitted.
router.post("/adapt-worksheet", requireAuth, worksheetUpload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { sendNeed, yearGroup } = req.body;
  if (!sendNeed) return res.status(400).json({ error: "sendNeed is required" });

  // Enforce PDF and Word documents only — no images
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedMimes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Only PDF (.pdf) and Word (.doc, .docx) files are supported. Please convert your file and try again." });
  }

  try {
    let rawText = "";
    const mime = req.file.mimetype;
    if (mime === "application/pdf") {
      // Try pdf-parse v2 first (primary method)
      try {
        const { PDFParse } = await import("pdf-parse" as any);
        const parser = new PDFParse({ data: req.file.buffer, verbosity: 0 });
        await parser.load();
        const result = await parser.getText();
        // v2 returns { pages: [{ text: string, num: number }], text: string }
        if (result?.pages && Array.isArray(result.pages) && result.pages.length > 0) {
          rawText = result.pages.map((p: any) => (p.text || "").trim()).filter(Boolean).join("\n\n");
        } else if (typeof result?.text === "string" && result.text.trim()) {
          rawText = result.text.trim();
        }
        if (rawText) console.log(`[adapt-worksheet] pdf-parse v2 extracted ${rawText.length} chars from ${result?.pages?.length || 0} pages`);
      } catch (pdfErr: any) {
        console.error("[adapt-worksheet] pdf-parse v2 error:", pdfErr?.message || pdfErr);
      }
      // Fallback: try pdfjs-dist if pdf-parse failed or returned empty
      if (!rawText || rawText.length < 20) {
        try {
          const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js" as any);
          const lib = pdfjsLib.default || pdfjsLib;
          const loadingTask = lib.getDocument({ data: new Uint8Array(req.file.buffer) });
          const pdfDoc = await loadingTask.promise;
          const pageTexts: string[] = [];
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str || "")
              .join(" ")
              .replace(/\s{2,}/g, " ")
              .trim();
            if (pageText) pageTexts.push(pageText);
          }
          rawText = pageTexts.join("\n\n");
          if (rawText) console.log(`[adapt-worksheet] pdfjs-dist extracted ${rawText.length} chars from ${pdfDoc.numPages} pages`);
        } catch (pdfJsErr: any) {
          console.error("[adapt-worksheet] pdfjs-dist error:", pdfJsErr?.message || pdfJsErr);
        }
      }
    } else {
      // .doc or .docx — use mammoth
      try {
        const mammoth = await import("mammoth" as any);
        const mammothLib = mammoth.default || mammoth;
        // Try to get structured HTML first (preserves headings and structure)
        const htmlResult = await mammothLib.convertToHtml({ buffer: req.file.buffer });
        if (htmlResult?.value && htmlResult.value.length > 50) {
          // Convert HTML to plain text preserving structure
          rawText = htmlResult.value
            .replace(/<h[1-6][^>]*>/gi, "\n\n## ")
            .replace(/<\/h[1-6]>/gi, "\n")
            .replace(/<p[^>]*>/gi, "\n")
            .replace(/<\/p>/gi, "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<li[^>]*>/gi, "\n• ")
            .replace(/<\/li>/gi, "")
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ")
            .replace(/&#[0-9]+;/g, " ")
            .trim();
        }
        // Fallback to raw text if HTML conversion failed
        if (!rawText || rawText.length < 20) {
          const rawResult = await mammothLib.extractRawText({ buffer: req.file.buffer });
          rawText = rawResult.value || "";
        }
        if (rawText) console.log(`[adapt-worksheet] mammoth extracted ${rawText.length} chars`);
      } catch (docErr: any) {
        console.error("[adapt-worksheet] mammoth error:", docErr?.message || docErr);
        rawText = "";
      }
    }

    // Clean up: preserve structure but remove excessive blank lines
    rawText = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\t/g, "  ")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim();

    if (!rawText || rawText.length < 20) {
      return res.status(400).json({ error: "Could not extract readable text from this file. The file may be a scanned image (not selectable text). Please ensure the PDF contains selectable text, or convert to Word format and try again." });
    }
    const truncated = rawText.length > 12000;
    const textForAI = rawText.slice(0, 12000);

    const schoolId = req.user?.schoolId ?? undefined;
    const yr = yearGroup || "Year 9";

    // SEND-specific FORMATTING guidelines (presentation only — no content changes)
    const sendFormattingGuide = (() => {
      const n = (sendNeed || "").toLowerCase();
      if (n.includes("dyslexia")) return "Dyslexia formatting: Use short sentences and bullet points where the original uses long paragraphs. Bold all key terms. Add clear section breaks. Recommend 1.5x line spacing. Left-align all text.";
      if (n.includes("autism") || n.includes("asd") || n.includes("autistic")) return "Autism/ASD formatting: Ensure all instructions are numbered and explicit. Add clear visual section dividers. Remove any ambiguous phrasing from instructions (not questions). Use consistent formatting throughout.";
      if (n.includes("adhd")) return "ADHD formatting: Add tick boxes (☐) next to each question for progress tracking. Add extra white space between questions. Use bold headings. Keep each question visually separated.";
      if (n.includes("mld") || n.includes("moderate learning")) return "MLD formatting: Add extra white space between questions. Use larger font recommendation. Number each question clearly. Add clear section headings.";
      if (n.includes("sld") || n.includes("severe learning")) return "SLD formatting: Add extra white space. Use very clear section headings. Number each question clearly. Recommend large font.";
      if (n.includes("eal") || n.includes("english as an additional")) return "EAL formatting: Bold all technical/subject-specific vocabulary. Add a glossary note in the teacher section. Keep all original content verbatim.";
      if (n.includes("visual") || n.includes("vi")) return "Visual impairment formatting: Add text descriptions for any diagrams or images mentioned. Recommend large font. Add extra line spacing.";
      if (n.includes("hearing") || n.includes("deaf")) return "Hearing impairment formatting: Ensure all content is text-based. Add written instructions for any audio tasks.";
      return "SEND formatting: Add clear section headings, extra white space between questions, and bold key terms.";
    })();

    const system = `You are an expert educational content specialist. Your task is to reformat a worksheet for a student with ${sendNeed} while preserving ALL original content 1:1.

CRITICAL RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
1. PRESERVE EVERY QUESTION VERBATIM: Every single question, task, instruction, and piece of content from the original must appear in the output word-for-word. Do NOT change, paraphrase, simplify, add to, or remove any question or task.
2. PRESERVE ALL MATHEMATICAL NOTATION: All symbols (×, ÷, √, ², ³, π, ≤, ≥, ≠), fractions, equations, and numbers must be preserved exactly as in the original.
3. PRESERVE THE ORIGINAL STRUCTURE: Match the original section structure exactly. If the original has Section A, B, C — keep those. If it has numbered questions 1-10, keep that structure.
4. FORMATTING ONLY: The ONLY changes permitted are: adjusting visual presentation (line spacing, grouping, bold key terms, section dividers, tick boxes for ADHD). Do NOT add word banks, sentence starters, hints, worked examples, or any new content.
5. DO NOT ADD OR REMOVE CONTENT: No new questions, no hints, no scaffolding, no word banks. Only formatting changes.
6. Return valid JSON only — no markdown code fences, no text before or after the JSON object.`;

    const user = `Reformat the following worksheet for a student with ${sendNeed} in ${yr}.

${sendFormattingGuide}

Return a JSON object with this EXACT structure (valid JSON only, no markdown fences):
{
  "title": "The worksheet title exactly as it appears in the original",
  "subtitle": "${yr} — Formatted for ${sendNeed}",
  "sections": [
    {
      "title": "Section heading exactly as in original",
      "type": "guided",
      "content": "ALL original questions and content from this section, reproduced VERBATIM. Every question number, every word, every symbol preserved exactly. Only formatting changes applied (bold key terms, tick boxes for ADHD, clear spacing).",
      "teacherOnly": false
    }
  ],
  "teacherSection": {
    "title": "Teacher Notes",
    "type": "teacher-notes",
    "content": "Formatting adaptations applied for ${sendNeed}. Recommended presentation strategies. Mark scheme if present in original.",
    "teacherOnly": true
  },
  "adaptationsSummary": ["List each formatting change made"]
}

ORIGINAL WORKSHEET (reproduce every question, symbol, and value VERBATIM — formatting changes only):
${textForAI}${truncated ? "\n\n[Note: Document was truncated at 12,000 characters due to length.]" : ""}`;

    const { content, provider } = await callWithFallback(system, user, 6000, undefined, schoolId);

    // Helper: try to parse JSON robustly, handling code fences and control chars
    const tryParseJSON = (raw: string): any | null => {
      if (!raw || !raw.trim()) return null;
      try {
        // Strip markdown code fences (```json ... ``` or ``` ... ```)
        let s = raw
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```\s*$/, '')
          .trim();
        // Extract the outermost JSON object (handles leading/trailing text)
        const m = s.match(/\{[\s\S]*\}/);
        const candidate = m ? m[0] : s;
        if (!candidate || !candidate.startsWith('{')) return null;
        // First try direct parse
        try { return JSON.parse(candidate); } catch (_) {}
        // Sanitize: replace unescaped control characters inside JSON strings
        // This handles literal newlines/tabs inside string values
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
        try { return JSON.parse(sanitized); } catch (_) {}
        // Last resort: try to extract just the sections array
        return null;
      } catch (_) { return null; }
    };

    let parsed: any;
    const outerParsed = tryParseJSON(content);
    if (outerParsed && outerParsed.sections && Array.isArray(outerParsed.sections) && outerParsed.sections.length > 0) {
      parsed = outerParsed;
      // Detect double-nested JSON: if sections[0].content is itself a JSON string
      // containing a full worksheet structure, unwrap it
      if (
        parsed?.sections?.length === 1 &&
        typeof parsed.sections[0]?.content === 'string'
      ) {
        const innerContent = parsed.sections[0].content.trim();
        if (innerContent.startsWith('```') || innerContent.startsWith('{')) {
          const innerParsed = tryParseJSON(innerContent);
          if (innerParsed?.sections && Array.isArray(innerParsed.sections) && innerParsed.sections.length > 0) {
            parsed = innerParsed;
          }
        }
      }
      // Ensure no section has empty content and all content is a string
      parsed.sections = parsed.sections.map((s: any) => {
        let c = s.content;
        if (c !== null && c !== undefined && typeof c !== 'string') {
          if (Array.isArray(c)) c = c.join('\n');
          else if (typeof c === 'object') { try { c = JSON.stringify(c); } catch { c = String(c); } }
          else c = String(c);
        }
        return {
          ...s,
          title: typeof s.title === 'string' ? s.title : String(s.title || ''),
          content: c && c.trim() ? c : "[Content not available — please try again]",
        };
      });
    } else if (outerParsed && !outerParsed.sections) {
      // AI returned JSON but without sections structure — wrap it
      const rawContent = outerParsed.content || outerParsed.adaptedContent || outerParsed.text || JSON.stringify(outerParsed);
      parsed = {
        title: outerParsed.title || "Adapted Worksheet",
        subtitle: outerParsed.subtitle || `${yr} — ${sendNeed} adaptation`,
        sections: [{ title: "Adapted Content", type: "guided", content: rawContent, teacherOnly: false }],
        teacherSection: { title: "Teacher Notes", type: "teacher-notes", content: `Formatted for ${sendNeed}`, teacherOnly: true },
        adaptationsSummary: outerParsed.adaptationsSummary || ["Content formatted for " + sendNeed],
      };
    } else {
      // Fallback: AI returned plain text (not JSON) — wrap it in a section
      // This ensures the user always sees content, never a blank document
      const cleanContent = content.trim();
      parsed = {
        title: req.file?.originalname?.replace(/\.[^.]+$/, '') || "Adapted Worksheet",
        subtitle: `${yr} — ${sendNeed} adaptation`,
        sections: [{ 
          title: "Adapted Worksheet", 
          type: "guided", 
          content: cleanContent || "The worksheet content could not be parsed. Please try again.", 
          teacherOnly: false 
        }],
        teacherSection: { title: "Teacher Notes", type: "teacher-notes", content: `Formatted for ${sendNeed}`, teacherOnly: true },
        adaptationsSummary: ["Content formatted for " + sendNeed],
      };
    }

    res.json({ adapted: parsed, provider });
  } catch (err: any) {
    console.error("Worksheet adapt error:", err);
    res.status(500).json({ error: err.message || "Failed to adapt worksheet" });
  }
});

// ── Differentiate Existing Worksheet (Foundation / Higher) ─────────────────
// POST /api/ai/differentiate-worksheet
// Takes existing worksheet sections and transforms them to a different difficulty tier.
// Much faster than regenerating from scratch — only adjusts question difficulty.
router.post("/differentiate-worksheet", requireAuth, async (req: Request, res: Response) => {
  const { sections, tier, subject, topic, yearGroup, title } = req.body;
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: "sections array is required" });
  }
  if (!tier || (tier !== "foundation" && tier !== "higher")) {
    return res.status(400).json({ error: "tier must be 'foundation' or 'higher'" });
  }
  const schoolId = req.user?.schoolId ?? undefined;
  const yr = yearGroup || "Year 9";

  const tierRules = tier === "foundation"
    ? `FOUNDATION TIER RULES:
- Simplify all questions to single-skill, grade 1-5 level
- Add hints or sentence starters to every Section A question
- Use whole numbers and simple values only
- Break multi-step questions into sub-parts (a)(b)
- Keep language simple and direct
- Add a Word Bank with 4-6 key terms
- Challenge = straightforward application, not proof`
    : `HIGHER TIER RULES:
- Increase all questions to multi-step, grade 5-9 level
- Section A starts at grade 5 — no trivial recall
- Section B must include reasoning/proof/'show that' questions
- Use precise subject language and notation
- Include algebraic/symbolic manipulation
- Challenge = grade 8-9 proof or multi-concept problem`;

  // Only send non-teacher sections to keep prompt short — strip word banks and worked examples
  // to reduce token count; we only need the question sections to adjust difficulty
  const pupilSections = (sections as any[]).filter(
    (s: any) => !s.teacherOnly && !/word.?bank|worked.?example|reminder.?box|key.?vocab|key.?formula|learning.?obj/i.test(s.title || "")
  );
  const existingContent = pupilSections.map((s: any, i: number) => {
    return `=== ${s.title || `Section ${i + 1}`} ===\n${(s.content || "").slice(0, 300)}`;
  }).join("\n\n").slice(0, 3000);

  const system = `You are an expert UK teacher differentiating a worksheet for ${yr} pupils. Transform the existing worksheet to ${tier} tier difficulty. Preserve the topic and structure — only adjust question difficulty. Return valid JSON only. CRITICAL: The "content" field of every section MUST be a plain text string (NOT an array, NOT an object, NOT nested JSON). Write all questions as numbered plain text lines separated by newlines within the string.`;

  const user = `Transform this ${subject || ""} worksheet on "${topic || ""}" to ${tier.toUpperCase()} tier for ${yr}.

${tierRules}

EXISTING WORKSHEET (adjust difficulty of each section):
${existingContent}

Return a JSON object:
{
  "sections": [
    {"title": "original section title", "type": "guided", "content": "1. Question one\n2. Question two\n3. Question three", "teacherOnly": false}
  ],
  "tierApplied": "${tier}",
  "changesNote": "brief summary of changes made"
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
      res.json({ differentiated: parsed, provider });
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
  const { sections, sendNeed, subject, topic, yearGroup, title } = req.body;
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: "sections array is required" });
  }
  // sendNeed is optional — if not provided, apply general accessibility scaffolding
  const schoolId = req.user?.schoolId ?? undefined;
  const yr = yearGroup || "Year 9";
  const sn = (sendNeed || "").toLowerCase();

  const buildLocalScaffold = (inputSections: any[], sendNeedLower: string) => {
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

    const buildHint = (line: string) => {
      if (/\d|=|\+|-|×|÷|\//.test(line)) return "Hint: Show one step at a time.";
      if (/explain|describe|why|how/i.test(line)) return "Hint: Use because in your answer.";
      if (/compare|difference|similar/i.test(line)) return "Hint: Write one point for each side.";
      return "Hint: Use the key word from the question in your answer.";
    };

    const buildSentenceStarter = (line: string) => {
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
      return `${buildHeader()}${transformed}`.trim();
    };

    const allText = inputSections.map((s: any) => `${s.title || ""} ${s.content || ""}`).join(" \n ");
    const terms = extractTerms(allText);
    const wordBank = terms.length
      ? terms.map((t) => `${t} | key term used in this worksheet`).join("\n")
      : "keyword | important word in the question\nmethod | the steps you use\nevidence | information that supports your answer\nanswer | what you write in response";

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
- Add picture/emoji-based self-assessment at the end`;

    if (sendNeedLower.includes("slcn") || sendNeedLower.includes("speech") || sendNeedLower.includes("language") || sendNeedLower.includes("communication")) return `SLCN SCAFFOLDING RULES:
- Add a prominent Word Bank at the start with every key term defined in plain English (max 8 terms)
- For every question requiring a written answer, provide a sentence frame: e.g. '_____ is important because _____'
- Add a 'Key Phrases' box with useful language structures
- Convert at least 3 questions to matching, labelling, or multiple-choice format
- Use short, simple sentences — avoid complex clauses
- Bold the key action word in every instruction
- Add visual cues (arrows, boxes) alongside text`;

    if (sendNeedLower.includes("anxiety") || sendNeedLower.includes("mental health") || sendNeedLower.includes("semh")) return `ANXIETY/SEMH SCAFFOLDING RULES:
- Add a 'How are you feeling?' emoji check-in at the start: 😕 🙂 😀
- Rename sections with encouraging labels: 'Warm-Up — no pressure!' and 'Main Practice — you've got this!'
- Add a positive statement before each section: 'You already know how to do this — let's practise!'
- Replace all 'must'/'should'/'need to' language with 'try to'/'you might like to'
- Label the challenge section: 'OPTIONAL BONUS — only if you want to!'
- Add a 'Tip' box in each section with a helpful reminder
- Add a 'Take a break here if you need to' prompt midway
- End with a 'How did you do?' emoji scale`;

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
- End with a simple self-assessment: 'I found this: 😕 🙂 😀'`;
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
      res.json({ scaffolded: parsed, provider });
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

// ── Book Questions — generate comprehension questions for a book ─────────────
router.post("/book-questions", requireAuth, worksheetUpload.single("file"), async (req: Request, res: Response) => {
  const { bookTitle, author, readingAge, yearGroup, pagesFrom, pagesTo, chapterInfo, questionCount } = req.body;
  if (!bookTitle) return res.status(400).json({ error: "bookTitle is required" });
  const schoolId = req.user?.schoolId ?? undefined;

  // Extract criteria text from uploaded file if provided
  let criteriaText = "";
  if (req.file) {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowedMimes.includes(req.file.mimetype)) {
      try {
        if (req.file.mimetype === "application/pdf") {
          const { PDFParse } = await import("pdf-parse" as any);
          const parser = new PDFParse({ data: req.file.buffer, verbosity: 0 });
          await parser.load();
          const result = await parser.getText();
          // v2 returns { pages: [{ text: string }] }
          if (result?.pages && Array.isArray(result.pages)) {
            criteriaText = result.pages.map((p: any) => p.text || "").join("\n\n");
          } else if (typeof result?.text === "string") {
            criteriaText = result.text;
          } else {
            criteriaText = "";
          }
        } else if (req.file.mimetype === "text/plain") {
          criteriaText = req.file.buffer.toString("utf-8");
        } else {
          const mammoth = await import("mammoth" as any);
          const mammothLib = mammoth.default || mammoth;
          const result = await mammothLib.extractRawText({ buffer: req.file.buffer });
          criteriaText = result.value || "";
        }
        criteriaText = criteriaText.slice(0, 6000).trim();
      } catch (e: any) {
        console.warn("[book-questions] criteria file parse error:", e?.message);
      }
    }
  }

  const ageLabel = readingAge || yearGroup || "age-appropriate";
  const numQuestions = parseInt(questionCount || "8", 10) || 8;
  const pagesLabel = pagesFrom && pagesTo ? `pages ${pagesFrom}–${pagesTo}` : pagesFrom ? `from page ${pagesFrom}` : "the section they have read";
  const authorLabel = author ? ` by ${author}` : "";

  const system = `You are an expert UK primary and secondary school teacher specialising in reading comprehension and literacy assessment. You generate high-quality, age-appropriate comprehension questions that genuinely test a pupil's understanding of a book or text they have read.`;

  const user = `Generate ${numQuestions} comprehension questions for pupils who have just read ${pagesLabel} of the book "${bookTitle}"${authorLabel}.

Pupil reading age / level: ${ageLabel}
${yearGroup ? `Year group: ${yearGroup}` : ""}
${chapterInfo ? `\nContext / chapter summary provided by teacher:\n${chapterInfo}` : ""}
${criteriaText ? `\nAssessment criteria / mark scheme (base questions on this):\n${criteriaText}` : ""}

Requirements:
- Questions must be directly answerable from the pages the pupil has read
- Vary question types: literal recall (2), inference (2), vocabulary/language (2), personal response/evaluation (2)
- Match vocabulary and sentence complexity to the reading age: ${ageLabel}
- For younger readers (age 6-9): short, clear questions with simple vocabulary
- For older readers (age 10+): include inference, authorial intent, and evaluative questions
- Number each question Q1–Q${numQuestions}
- After the questions, add a brief TEACHER NOTES section with suggested answers / marking guidance

Format your response as JSON:
{
  "questions": [
    { "number": 1, "type": "literal", "question": "...", "marks": 1 },
    { "number": 2, "type": "inference", "question": "...", "marks": 2 },
    { "number": 3, "type": "vocabulary", "question": "...", "marks": 1 },
    { "number": 4, "type": "evaluation", "question": "...", "marks": 3 }
  ],
  "teacherNotes": [
    { "number": 1, "guidance": "Accept any answer that mentions..." }
  ]
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
    res.json({ ...parsed, provider });
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

export default router;
