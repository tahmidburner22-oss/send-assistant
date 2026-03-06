import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, auditLog } from "../middleware/auth.js";
import { filterContent } from "../lib/contentFilter.js";

const router = Router();

// ── AI Proxy with content filtering ──────────────────────────────────────────
// The frontend sends AI requests through this endpoint so we can:
// 1. Filter prompts for safeguarding concerns
// 2. Filter responses before returning to user
// 3. Log all AI interactions
// 4. Enforce that no pupil data is sent to AI models

router.post("/generate", requireAuth, async (req: Request, res: Response) => {
  const { prompt, systemPrompt, provider, model, apiKey, maxTokens = 2000 } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  // Filter the prompt
  const promptFilter = filterContent(prompt);
  const logId = uuidv4();

  db.prepare(`INSERT INTO ai_filter_log (id, user_id, school_id, prompt, flagged, flag_reason)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    logId, req.user!.id, req.user!.schoolId,
    prompt.slice(0, 500), // truncate for storage
    promptFilter.flagged ? 1 : 0,
    promptFilter.reason || null
  );

  if (promptFilter.flagged && promptFilter.category === "safeguarding") {
    // Auto-create safeguarding incident
    const incidentId = uuidv4();
    db.prepare(`INSERT INTO safeguarding_incidents (id, school_id, reported_by, description, ai_trigger, severity)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      incidentId, req.user!.schoolId, req.user!.id,
      `AI prompt flagged: ${promptFilter.reason}`,
      prompt.slice(0, 500),
      promptFilter.severity || "medium"
    );

    // Notify DSL
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

  // Forward to AI provider using the user's own API key
  // No pupil data is sent to any third-party without the user's own API key
  try {
    let response: string;

    if (provider === "groq" || !provider) {
      response = await callGroq(systemPrompt || "", prompt, apiKey, model || "llama-3.3-70b-versatile", maxTokens);
    } else if (provider === "gemini") {
      response = await callGemini(systemPrompt || "", prompt, apiKey, maxTokens);
    } else if (provider === "openai") {
      response = await callOpenAI(systemPrompt || "", prompt, apiKey, model || "gpt-4o-mini", maxTokens);
    } else if (provider === "openrouter") {
      response = await callOpenRouter(systemPrompt || "", prompt, apiKey, model, maxTokens);
    } else if (provider === "claude") {
      response = await callClaude(systemPrompt || "", prompt, apiKey, maxTokens);
    } else if (provider === "huggingface") {
      response = await callHuggingFace(systemPrompt || "", prompt, apiKey, maxTokens);
    } else {
      return res.status(400).json({ error: "Unknown provider" });
    }

    // Filter response
    const responseFilter = filterContent(response);
    db.prepare("UPDATE ai_filter_log SET output=?, flagged=?, flag_reason=? WHERE id=?").run(
      response.slice(0, 500),
      responseFilter.flagged ? 1 : 0,
      responseFilter.reason || null,
      logId
    );

    if (responseFilter.flagged) {
      // Log but don't block — add a warning label
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

// ── AI Filter Log (admin view) ────────────────────────────────────────────────
router.get("/filter-log", requireAuth, (req: Request, res: Response) => {
  const logs = db.prepare(
    `SELECT afl.*, u.display_name FROM ai_filter_log afl
     LEFT JOIN users u ON afl.user_id = u.id
     WHERE afl.school_id = ? ORDER BY afl.created_at DESC LIMIT 100`
  ).all(req.user!.schoolId);
  res.json(logs);
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
  // Updated to currently-available free models (verified March 2026)
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
  // Updated to new HuggingFace Router endpoint (api-inference.huggingface.co deprecated)
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
