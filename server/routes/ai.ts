import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import db from "../db/index.js";
import { requireAuth, requireAdmin, auditLog } from "../middleware/auth.js";
import { filterContent } from "../lib/contentFilter.js";
import { getSchoolKey } from "./schoolApiKeys.js";
import { findDiagram, searchWikimediaDiagram } from "../lib/diagramBank.js";

const router = Router();
const worksheetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Provider priority order — server always tries all of these automatically ──
const PROVIDER_ORDER = ["groq", "gemini", "openai", "openrouter", "claude", "huggingface"] as const;

// ── Get the best available key: school key → global admin key → env var ──────
function getEffectiveKey(provider: string, userKey?: string, schoolId?: string): string {
  if (userKey && userKey.trim()) return userKey.trim();
  // 1. School-level key (highest priority)
  if (schoolId) {
    const schoolEntry = getSchoolKey(schoolId, provider);
    if (schoolEntry?.key) return schoolEntry.key;
  }
  // 2. Global admin key
  try {
    const adminKey = db.prepare(
      "SELECT api_key FROM admin_api_keys WHERE provider = ?"
    ).get(provider) as any;
    if (adminKey?.api_key) return adminKey.api_key;
  } catch (_) {}
  // 3. Railway env vars
  const envMap: Record<string, string> = {
    groq: process.env.GROQ_API_KEY || "",
    gemini: process.env.GEMINI_API_KEY || "",
    openai: process.env.OPENAI_API_KEY || "",
    openrouter: process.env.OPENROUTER_API_KEY || "",
    claude: process.env.CLAUDE_API_KEY || "",
    huggingface: process.env.HUGGINGFACE_API_KEY || "",
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
  switch (provider) {
    case "groq":
      return callGroq(system, user, key, model || "llama-3.3-70b-versatile", maxTokens);
    case "gemini":
      return callGemini(system, user, key, maxTokens);
    case "openai":
      return callOpenAI(system, user, key, model || "gpt-4o-mini", maxTokens);
    case "openrouter":
      return callOpenRouter(system, user, key, model, maxTokens);
    case "claude":
      return callClaude(system, user, key, maxTokens);
    case "huggingface":
      return callHuggingFace(system, user, key, maxTokens);
    default:
      throw new Error(`Unknown provider: ${provider}`);
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

  for (const provider of order) {
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
      console.warn(`[AI] ${provider} failed: ${msg.slice(0, 120)}`);
      errors.push(`${provider}: ${msg.slice(0, 80)}`);
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

    res.json({ content: result.content, provider: result.provider, aiGenerated: true });
  } catch (err: any) {
    console.error("AI proxy error:", err);
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
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
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
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
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

// ── Diagram generation helpers ────────────────────────────────────────────────

function getDiagramHintServer(subject: string, topic: string): string {
  const s = subject.toLowerCase();
  const t = topic.toLowerCase();
  if (s === "maths" || s === "mathematics") {
    if (t.includes("pythagoras") || (t.includes("right") && t.includes("triangle")))
      return `Right-angled triangle in Zone A: vertices at (200,400), (480,400), (200,130). Right-angle square at (200,400). Bottom side (200,400)→(480,400) labelled 'a' in Zone E (y=440). Left side (200,400)→(200,130) labelled 'b' in Zone B (x=90, midpoint y). Hypotenuse (480,400)→(200,130) labelled 'c' in Zone C (x=560, midpoint y). Formula rect in Zone C bottom: rect at (555,340) w=90 h=40 fill=#fff8e1, text 'a&#178;+b&#178;=c&#178;' inside. Right-angle square: 15px sides at (200,400). Title: Pythagoras' Theorem.`;
    if (t.includes("circle"))
      return `Large circle in Zone A: cx=350 cy=250 r=150 fill=#dbeafe. Elements: (1) radius line from (350,250) to (500,250) — label 'Radius' in Zone C y=240; (2) diameter line from (200,250) to (500,250) — label 'Diameter' in Zone E y=455; (3) chord line from (230,150) to (450,350) — label 'Chord' in Zone B y=250; (4) tangent vertical line x=500 from y=150 to y=350 — label 'Tangent' in Zone C y=150; (5) shaded sector from 0&#176; to 60&#176; fill=#bfdbfe — label 'Sector' in Zone C y=200; (6) arc mark on top — label 'Arc' in Zone D. Title: Parts of a Circle.`;
    if (t.includes("graph") || t.includes("linear"))
      return `Coordinate axes in Zone A: x-axis from (170,380) to (530,380) with arrow; y-axis from (250,420) to (250,70) with arrow. Axis labels: 'x' at (535,380) Zone C; 'y' at (250,65) Zone D. Plot points A(310,300) and B(460,180) as filled circles. Straight line through them. Gradient triangle: horizontal leg (310,300)→(460,300) labelled 'run' below in Zone E; vertical leg (460,300)→(460,180) labelled 'rise' in Zone C. y-intercept dot where line meets y-axis, labelled 'y-intercept' in Zone B. Title: Linear Graph.`;
    if (t.includes("fraction"))
      return `Three equal rectangles in Zone A, each 130w×60h, y=200: Rect1 x=175 divided into 4 columns, first filled #6366f1 — label '1/4' in Zone E y=440 x=240; Rect2 x=320 divided into 2 columns, first filled #10b981 — label '1/2' in Zone E y=440 x=385; Rect3 x=465 divided into 4 columns, first two filled #f59e0b — label '2/4' in Zone E y=440 x=530. Title: Equivalent Fractions.`;
    if (t.includes("angle"))
      return `Three angle diagrams in Zone A, spread horizontally. Left at x=210: two rays from (210,320), one horizontal right, one at 45&#176; up-right; arc and label 'Acute 45&#176;' in Zone B y=260. Centre at x=350: two rays from (350,320), one right, one straight up; small square at vertex; label 'Right 90&#176;' in Zone D x=350. Right at x=490: two rays from (490,320), one horizontal left, one at 45&#176; up-left; arc and label 'Obtuse 135&#176;' in Zone C y=260. Title: Types of Angles.`;
    if (t.includes("area") || t.includes("perimeter"))
      return `Rectangle in Zone A: x=200 y=120 width=300 height=180 fill=#dbeafe. Label '8 cm' in Zone E (below bottom edge, x=350 y=445). Label '5 cm' in Zone C (right of right edge, x=560 y=210). Formula box 1 in Zone E: rect x=160 y=430 w=180 h=30 fill=#fef9c3, text 'Area = 8 × 5 = 40 cm&#178;'. Formula box 2 in Zone E: rect x=360 y=430 w=190 h=30 fill=#dcfce7, text 'Perimeter = 2(8+5) = 26 cm'. Title: Area and Perimeter.`;
    if (t.includes("probability"))
      return `Horizontal number line in Zone A: from (170,250) to (530,250) with arrow. Five tick marks with labels in Zone D (y=48): x=170 'Impossible', x=255 'Unlikely', x=350 'Even chance', x=445 'Likely', x=530 'Certain'. Small vertical ticks at each point. Below line at y=320: spinner circle cx=350 cy=340 r=50 divided into 4 sectors, one shaded #bfdbfe; label 'P = 1/4' in Zone E y=455. Title: Probability Scale.`;
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

  const schoolId = req.user?.schoolId ?? undefined;
  const yr = yearGroup || "Year 9";

  // ── Attempt 0: Curated Wikimedia diagram bank (real, professional images) ────
  // Primary source — real educational diagrams with proper attribution.
  try {
    const banked = findDiagram(subject, topic);
    if (banked) {
      console.log(`[Diagram] Bank hit: ${banked.key} for "${topic}" (${subject})`);
      return res.json({
        imageUrl: banked.url,
        caption: banked.label,
        attribution: banked.attribution,
        provider: "wikimedia-bank",
        type: "imageUrl",
      });
    }
    // Not in curated bank — try live Wikimedia Commons search
    const searched = await searchWikimediaDiagram(subject, topic);
    if (searched) {
      console.log(`[Diagram] Wikimedia search hit for "${topic}" (${subject})`);
      return res.json({
        imageUrl: searched.url,
        caption: searched.caption,
        attribution: searched.attribution,
        provider: "wikimedia-search",
        type: "imageUrl",
      });
    }
  } catch (e) {
    console.warn("[Diagram] Wikimedia bank/search failed:", e);
  }

  // ── Attempt 1: Gemini 2.0 Flash SVG (fallback when no real image found) ──────
  const { system, user } = buildDiagramPrompt(subject, topic, yr, sendNeed);
  const geminiKey = getEffectiveKey("gemini", undefined, schoolId);
  if (geminiKey) {
    try {
      const svgText = await callGemini(system, user, geminiKey, 5000);
      const svgMatch = svgText.match(/<svg[\s\S]*?<\/svg>/i);
      const captionMatch = svgText.match(/CAPTION:\s*(.+)/i);
      if (svgMatch) {
        const cleanSvg = svgMatch[0]
          .replace(/\u00b2/g, "&#178;")
          .replace(/\u00b3/g, "&#179;")
          .replace(/\u00b0/g, "&#176;")
          .replace(/\u03bb/g, "&#955;")
          .replace(/\u03c0/g, "&#960;")
          .replace(/\u03b1/g, "&#945;")
          .replace(/\u03b2/g, "&#946;")
          .replace(/\u03b3/g, "&#947;")
          .replace(/\u2192/g, "&#8594;")
          .replace(/\u2190/g, "&#8592;")
          .replace(/\u2194/g, "&#8596;")
          .replace(/\u2191/g, "&#8593;")
          .replace(/\u2193/g, "&#8595;");
        return res.json({
          svg: cleanSvg,
          caption: captionMatch ? captionMatch[1].trim() : `${topic} diagram`,
          provider: "gemini",
          type: "svg",
        });
      }
    } catch (e) {
      console.warn("[Diagram] Gemini SVG failed:", e);
    }
  }

  // ── Attempt 2: GPT-4o SVG ─────────────────────────────────────────────────────
  const openaiKey = getEffectiveKey("openai", undefined, schoolId);
  if (openaiKey) {
    try {
      const svgText = await callOpenAI(system, user, openaiKey, "gpt-4o", 4000);
      const svgMatch = svgText.match(/<svg[\s\S]*?<\/svg>/i);
      const captionMatch = svgText.match(/CAPTION:\s*(.+)/i);
      if (svgMatch) {
        return res.json({
          svg: svgMatch[0],
          caption: captionMatch ? captionMatch[1].trim() : `${topic} diagram`,
          provider: "openai-gpt4o",
          type: "svg",
        });
      }
    } catch (e) {
      console.warn("[Diagram] GPT-4o SVG failed:", e);
    }
  }

  // ── Attempt 3: Auto-fallback through all remaining text providers ─────────────
  try {
    const result = await callWithFallback(system, user, 4000, undefined, schoolId);
    const svgMatch = result.content.match(/<svg[\s\S]*?<\/svg>/i);
    const captionMatch = result.content.match(/CAPTION:\s*(.+)/i);
    if (svgMatch) {
      return res.json({
        svg: svgMatch[0],
        caption: captionMatch ? captionMatch[1].trim() : `${topic} diagram`,
        provider: result.provider,
        type: "svg",
      });
    }
  } catch (e) {
    console.warn("[Diagram] All SVG providers failed:", e);
  }

  // ── Final fallback: placeholder ───────────────────────────────────────────────
  const placeholder = `<svg viewBox="0 0 700 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg"><rect width="700" height="500" fill="white"/><rect x="20" y="20" width="660" height="460" fill="#f8f9ff" stroke="#6366f1" stroke-width="2" rx="12"/><text x="350" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#6366f1" font-weight="bold">${topic}</text><text x="350" y="255" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#555">${subject} · ${yr}</text><text x="350" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#999">Diagram could not be generated — please try again</text></svg>`;
  return res.json({
    svg: placeholder,
    caption: `${topic} diagram`,
    provider: "placeholder",
    type: "svg",
  });
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
      try {
        const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as any)).default
          || (await import("pdf-parse" as any)).default;
        const data = await pdfParse(req.file.buffer);
        rawText = data.text || "";
      } catch (_) {
        rawText = req.file.buffer.toString("utf-8");
      }
    } else {
      // .doc or .docx — use mammoth
      try {
        const mammoth = (await import("mammoth" as any)).default || (await import("mammoth" as any));
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        rawText = result.value || "";
      } catch (_) {
        rawText = req.file.buffer.toString("utf-8");
      }
    }

    // Preserve structure but remove excessive blank lines
    rawText = rawText.replace(/\n{4,}/g, "\n\n\n").trim();
    if (!rawText || rawText.length < 20) {
      return res.status(400).json({ error: "Could not extract readable text from this file. Please check the file is not scanned/image-only and try again." });
    }
    const truncated = rawText.length > 12000;
    const textForAI = rawText.slice(0, 12000);

    const schoolId = req.user?.schoolId ?? undefined;
    const yr = yearGroup || "Year 9";

    const system = `You are an expert SEND teacher and educational content specialist. Your task is to adapt worksheets for students with specific SEND needs.

CRITICAL RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
1. EVERY question, task, instruction, and piece of content from the original must appear in the output VERBATIM. Do not paraphrase, simplify, or reword any question or task.
2. ALL mathematical symbols, operators, and notation must be preserved exactly: ×, ÷, √, ², ³, π, ≤, ≥, ≠, fractions, equations — everything must appear character-for-character.
3. ALL numbers, values, and data must be identical to the original.
4. The ONLY things you may change are: font size suggestions, line spacing, visual grouping, adding section headers/dividers, breaking long paragraphs into shorter visual chunks, and adding SEND-specific formatting notes.
5. Do NOT add hints, worked examples, word banks, or scaffolding unless they were already in the original.
6. Do NOT remove any content from the original.
7. Return structured JSON with sections that match the original document structure.`;

    const user = `Adapt the following worksheet for a student with ${sendNeed} in ${yr}.

Return a JSON object with this EXACT structure:
{
  "title": "The worksheet title (from the original, or inferred)",
  "subtitle": "Subject and year group",
  "sections": [
    {
      "title": "Section heading (e.g. Section A, Questions, Part 1)",
      "type": "guided",
      "content": "The VERBATIM content of this section, with SEND formatting applied (line spacing, grouping, bold key terms) but every question and symbol preserved exactly",
      "teacherOnly": false
    }
  ],
  "teacherSection": {
    "title": "Teacher Notes",
    "type": "teacher-notes",
    "content": "SEND adaptations applied, recommended support strategies for ${sendNeed}, and mark scheme if present in original",
    "teacherOnly": true
  },
  "adaptationsSummary": ["List of formatting/presentation adaptations made — NOT content changes"]
}

SEND formatting guidelines for ${sendNeed}:
- Dyslexia: 1.5x line spacing, left-aligned text, bold key terms, short sentences, clear section breaks
- Autism/ASD: Explicit numbered instructions, no ambiguous language, clear visual structure
- ADHD: Short chunks, clear headings, bold key words, numbered steps, white space between questions
- MLD/SLD: Larger font recommendation, extra white space, numbered questions clearly separated
- EAL: Preserve all content verbatim, add language support notes in teacher section only

ORIGINAL WORKSHEET CONTENT (preserve every question, symbol, and value VERBATIM):
${textForAI}${truncated ? "\n\n[Note: Document was truncated at 12,000 characters due to length]" : ""}`;

    const { content, provider } = await callWithFallback(system, user, 4000, undefined, schoolId);

    let parsed: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = {
        title: "Adapted Worksheet",
        subtitle: `${yr} — ${sendNeed} adaptation`,
        sections: [{ title: "Adapted Content", type: "guided", content, teacherOnly: false }],
        teacherSection: { title: "Teacher Notes", type: "teacher-notes", content: `Adapted for ${sendNeed}`, teacherOnly: true },
        adaptationsSummary: ["Content adapted for " + sendNeed],
      };
    }

    res.json({ adapted: parsed, provider });
  } catch (err: any) {
    console.error("Worksheet adapt error:", err);
    res.status(500).json({ error: err.message || "Failed to adapt worksheet" });
  }
});

export default router;
