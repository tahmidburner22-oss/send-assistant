import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, requireAdmin, auditLog } from "../middleware/auth.js";
import { filterContent } from "../lib/contentFilter.js";

const router = Router();

// ── Helper: get effective API key (user-supplied → admin server key) ──────────
function getEffectiveKey(provider: string, userKey?: string): string {
  if (userKey && userKey.trim()) return userKey.trim();
  // Fall back to admin server-side key
  const adminKey = db.prepare(
    "SELECT api_key FROM admin_api_keys WHERE provider = ?"
  ).get(provider) as any;
  return adminKey?.api_key || "";
}

function getAdminModel(provider: string): string {
  const row = db.prepare(
    "SELECT model FROM admin_api_keys WHERE provider = ?"
  ).get(provider) as any;
  return row?.model || "";
}

// ── AI Proxy with content filtering ──────────────────────────────────────────
router.post("/generate", requireAuth, async (req: Request, res: Response) => {
  const { prompt, systemPrompt, provider, model, apiKey, maxTokens = 2000 } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  // Filter the prompt
  const promptFilter = filterContent(prompt);
  const logId = uuidv4();

  db.prepare(`INSERT INTO ai_filter_log (id, user_id, school_id, prompt, flagged, flag_reason)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    logId, req.user!.id, req.user!.schoolId,
    prompt.slice(0, 500),
    promptFilter.flagged ? 1 : 0,
    promptFilter.reason || null
  );

  if (promptFilter.flagged && promptFilter.category === "safeguarding") {
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
  }

  // Resolve effective key (user key → admin server key)
  const effectiveKey = getEffectiveKey(provider || "groq", apiKey);
  const effectiveModel = model || getAdminModel(provider || "groq");

  if (!effectiveKey) {
    return res.status(400).json({ error: `No API key available for provider: ${provider || "groq"}. Please contact your administrator.` });
  }

  try {
    let response: string;

    if (provider === "groq" || !provider) {
      response = await callGroq(systemPrompt || "", prompt, effectiveKey, effectiveModel || "llama-3.3-70b-versatile", maxTokens);
    } else if (provider === "gemini") {
      response = await callGemini(systemPrompt || "", prompt, effectiveKey, maxTokens);
    } else if (provider === "openai") {
      response = await callOpenAI(systemPrompt || "", prompt, effectiveKey, effectiveModel || "gpt-4o-mini", maxTokens);
    } else if (provider === "openrouter") {
      response = await callOpenRouter(systemPrompt || "", prompt, effectiveKey, effectiveModel, maxTokens);
    } else if (provider === "claude") {
      response = await callClaude(systemPrompt || "", prompt, effectiveKey, maxTokens);
    } else if (provider === "huggingface") {
      response = await callHuggingFace(systemPrompt || "", prompt, effectiveKey, maxTokens);
    } else {
      return res.status(400).json({ error: "Unknown provider" });
    }

    const responseFilter = filterContent(response);
    db.prepare("UPDATE ai_filter_log SET output=?, flagged=?, flag_reason=? WHERE id=?").run(
      response.slice(0, 500),
      responseFilter.flagged ? 1 : 0,
      responseFilter.reason || null,
      logId
    );

    if (responseFilter.flagged) {
      return res.json({
        content: response,
        warning: "This AI-generated content has been flagged for review.",
        flagged: true,
        aiGenerated: true,
      });
    }

    res.json({ content: response, aiGenerated: true });
  } catch (err: any) {
    console.error("AI proxy error:", err);
    res.status(502).json({ error: err.message || "AI request failed" });
  }
});

// ── Collaborative AI Ensemble ─────────────────────────────────────────────────
// Runs multiple providers in parallel and synthesises the best response
router.post("/ensemble", requireAuth, async (req: Request, res: Response) => {
  const { prompt, systemPrompt, maxTokens = 3000 } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  const promptFilter = filterContent(prompt);
  if (promptFilter.flagged && promptFilter.category === "safeguarding") {
    return res.status(400).json({ error: "Content flagged for safeguarding review." });
  }

  // Gather all available providers (admin keys + user keys)
  const providers = ["groq", "gemini", "openai", "openrouter", "claude", "huggingface"];
  const available = providers.filter(p => getEffectiveKey(p, req.body[`${p}Key`]));

  if (available.length === 0) {
    return res.status(400).json({ error: "No AI providers configured. Please ask your administrator to set up API keys." });
  }

  // Run up to 3 providers in parallel
  const toRun = available.slice(0, 3);
  const results = await Promise.allSettled(
    toRun.map(async (p) => {
      const key = getEffectiveKey(p, req.body[`${p}Key`]);
      const model = getAdminModel(p);
      let text: string;
      if (p === "groq") text = await callGroq(systemPrompt || "", prompt, key, model || "llama-3.3-70b-versatile", maxTokens);
      else if (p === "gemini") text = await callGemini(systemPrompt || "", prompt, key, maxTokens);
      else if (p === "openai") text = await callOpenAI(systemPrompt || "", prompt, key, model || "gpt-4o-mini", maxTokens);
      else if (p === "openrouter") text = await callOpenRouter(systemPrompt || "", prompt, key, model, maxTokens);
      else if (p === "claude") text = await callClaude(systemPrompt || "", prompt, key, maxTokens);
      else text = await callHuggingFace(systemPrompt || "", prompt, key, maxTokens);
      return { provider: p, text };
    })
  );

  const successes = results
    .filter((r): r is PromiseFulfilledResult<{ provider: string; text: string }> => r.status === "fulfilled")
    .map(r => r.value);

  if (successes.length === 0) {
    return res.status(502).json({ error: "All AI providers failed in ensemble mode." });
  }

  // If only one succeeded, return it directly
  if (successes.length === 1) {
    return res.json({ content: successes[0].text, provider: successes[0].provider, ensemble: false, aiGenerated: true });
  }

  // Synthesise: use the primary (first) response as base, note contributions
  // For worksheets, the longest/most detailed response wins as primary
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

// ── Get available providers (for frontend to know what's configured) ──────────
router.get("/providers", requireAuth, (_req: Request, res: Response) => {
  const adminKeys = db.prepare("SELECT provider, model FROM admin_api_keys").all() as any[];
  const available = adminKeys.map(k => ({ provider: k.provider, model: k.model, source: "admin" }));
  res.json({ providers: available });
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

// ── AI Filter Log (admin view) ────────────────────────────────────────────────
router.get("/filter-log", requireAuth, (req: Request, res: Response) => {
  const logs = db.prepare(
    `SELECT afl.*, u.display_name FROM ai_filter_log afl
     LEFT JOIN users u ON afl.user_id = u.id
     WHERE afl.school_id = ? ORDER BY afl.created_at DESC LIMIT 200`
  ).all(req.user!.schoolId);
  res.json(logs);
});

// ── AI Usage Stats (admin analytics) ─────────────────────────────────────────
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
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

async function callGemini(system: string, user: string, key: string, maxTokens: number): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: system ? `${system}\n\n${user}` : user }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
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
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
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
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
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

export default router;
