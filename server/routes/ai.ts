import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, requireAdmin, auditLog } from "../middleware/auth.js";
import { filterContent } from "../lib/contentFilter.js";
import { getSchoolKey } from "./schoolApiKeys.js";

const router = Router();

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
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
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
    if (t.includes("pythagoras") || t.includes("triangle")) return "right-angled triangle with sides labelled a, b, c (hypotenuse). Show the formula a²+b²=c² in a box. Mark the right angle with a square symbol.";
    if (t.includes("circle")) return "circle with radius, diameter, circumference, chord, arc, sector, tangent all labelled with arrows.";
    if (t.includes("graph") || t.includes("linear")) return "coordinate grid with x and y axes, two plotted points joined by a line, gradient triangle labelled rise/run, y-intercept labelled.";
    if (t.includes("fraction")) return "three rectangles side by side: first divided into 4 parts with 1 shaded (1/4), second divided into 2 parts with 1 shaded (1/2), third divided into 4 parts with 2 shaded (2/4). Labels below each.";
    if (t.includes("angle")) return "three angle types side by side: acute (45°), right angle (90° with square), obtuse (135°). Each labelled with name and degree.";
    return "clear mathematical diagram with labelled axes, shapes, or number lines appropriate for this topic.";
  }
  if (s === "science" || s === "biology") {
    if (t.includes("cell") && t.includes("plant")) return "plant cell cross-section: large rectangular cell with thick cell wall, cell membrane inside, large central vacuole, nucleus (oval with nucleolus), several chloroplasts (oval, green), mitochondria. Each part has a straight leader line to a label.";
    if (t.includes("cell")) return "animal cell: irregular oval shape, cell membrane, nucleus (large oval with nucleolus), cytoplasm, mitochondria, ribosomes. Each part has a straight leader line to a label.";
    if (t.includes("heart") || t.includes("blood")) return "human heart cross-section: four chambers (right atrium, left atrium, right ventricle, left ventricle), aorta at top, pulmonary artery, vena cava, pulmonary vein. Arrows showing blood flow direction. All parts labelled.";
    if (t.includes("wave") || t.includes("sound") || t.includes("light")) return "transverse wave: sinusoidal wave with amplitude labelled (vertical arrow from centre to crest), wavelength labelled (horizontal arrow between two crests), crest and trough labelled. Wave equation v=fλ in a box.";
    if (t.includes("atom") || t.includes("electron")) return "Bohr model atom: nucleus in centre (labelled with protons+neutrons), two electron shells as circles, electrons as dots on shells. Shell 1: 2 electrons. Shell 2: 8 electrons. All parts labelled.";
    return "accurate, labelled scientific diagram relevant to this topic with all key parts identified by leader lines.";
  }
  if (s === "geography") {
    if (t.includes("river") || t.includes("erosion")) return "river valley cross-section: V-shaped valley, river at bottom, interlocking spurs on sides. Separate inset showing meander with erosion on outer bend and deposition on inner bend. Labels: erosion, deposition, meander, floodplain.";
    if (t.includes("volcano") || t.includes("tectonic")) return "volcano cross-section: cone shape, magma chamber at base, main vent up centre, secondary vent on side, crater at top, lava flow on surface. Tectonic plates shown below. All parts labelled.";
    return "clear geographical diagram or cross-section relevant to this topic with all features labelled.";
  }
  if (s === "history") return "horizontal timeline with at least 5 key events. Each event has a vertical line down to a date label and a text box above with the event name. Arrow at right end of timeline.";
  return "clear, well-labelled educational diagram most relevant to this topic for UK school students, with all key parts identified by leader lines.";
}

function buildDiagramPrompt(subject: string, topic: string, yearGroup: string, sendNeed?: string): { system: string; user: string } {
  const hint = getDiagramHintServer(subject, topic);
  const sendAdapt = sendNeed
    ? `SEND adaptation for ${sendNeed}: font-size 15+ on all labels, stroke-width 2.5+, max 6 labels, high-contrast colours, large clear arrows.`
    : `Standard: font-size 13 minimum, stroke-width 1.5 minimum.`;

  const system = `You are a specialist educational SVG diagram generator for UK school worksheets.
Your diagrams are ACCURATE, WELL-STRUCTURED, and PRINT-READY.

ABSOLUTE RULES — violating any rule makes the diagram unusable:
1. Output ONLY valid SVG. Start exactly with <svg and end exactly with </svg>. Zero other text before or after.
2. Use: viewBox="0 0 700 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg"
3. FIRST element inside <svg>: <rect width="700" height="500" fill="white"/>
4. ALL text elements MUST have: font-family="Arial, sans-serif"
5. Permitted elements ONLY: rect, circle, ellipse, line, path, polygon, polyline, text, tspan, g, defs, marker
6. NO: foreignObject, script, style, image, use, symbol, filter, clipPath
7. Shapes: fill="none" stroke="#111" stroke-width="1.5" for outlines. Pale fills: #e8f4fd, #e8fde8, #fff8e1, #fde8e8
8. Labels: fill="#111" font-size="13" to "16". NEVER overlap text with shapes.
9. Leader lines: thin lines (stroke="#555" stroke-width="1") from shape edge to label. Label OUTSIDE the shape.
10. Arrows: define ONE <marker id="arr" ...> in <defs> and reuse with marker-end="url(#arr)"
11. Title: add a <text> at top centre, font-size="16" font-weight="bold" fill="#333">
12. ${sendAdapt}
13. ACCURACY: shapes must be scientifically/mathematically correct. Labels must be spelled correctly.
14. SPACING: leave 40px margin on all sides. Labels must not touch the SVG border.

After </svg> write on a new line: CAPTION: [one sentence]`;

  const user = `Create an educational SVG diagram for:
Subject: ${subject}
Topic: ${topic}
Year Group: ${yearGroup}
Diagram to draw: ${hint}

Remember: SVG only (starting with <svg), then CAPTION: on a new line.`;

  return { system, user };
}

// ── POST /api/ai/diagram — dedicated diagram generation with fallback chain ───
router.post("/diagram", requireAuth, async (req: Request, res: Response) => {
  const { subject, topic, yearGroup, sendNeed } = req.body;
  if (!subject || !topic) return res.status(400).json({ error: "subject and topic required" });

  const schoolId = req.user?.schoolId ?? undefined;
  const { system, user } = buildDiagramPrompt(subject, topic, yearGroup || "Year 9", sendNeed);

  // Attempt 1: GPT-4o via OpenAI (best at structured SVG)
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
      console.warn("[Diagram] GPT-4o failed:", e);
    }
  }

  // Attempt 2: Auto-fallback through all text providers (SVG generation)
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

  // Attempt 3: Pollinations image (illustrative fallback)
  try {
    const imagePrompt = encodeURIComponent(
      `Educational textbook illustration of ${topic} for ${subject} class, ${yearGroup} level. ` +
      `Clean white background, clear labels, diagram style, UK school textbook quality, no watermarks.`
    );
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?width=700&height=500&nologo=true&model=flux-schnell&seed=${Date.now() % 9999}`;
    const check = await fetch(pollinationsUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) }).catch(() => null);
    if (check && check.ok) {
      return res.json({
        imageUrl: pollinationsUrl,
        caption: `${topic} — ${subject} illustration`,
        provider: "pollinations",
        type: "image",
      });
    }
  } catch (e) {
    console.warn("[Diagram] Pollinations fallback failed:", e);
  }

  // Attempt 4: Clean placeholder SVG
  const placeholder = `<svg viewBox="0 0 700 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg"><rect width="700" height="500" fill="white"/><rect x="20" y="20" width="660" height="460" fill="#f8f9ff" stroke="#6366f1" stroke-width="2" rx="12"/><text x="350" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#6366f1" font-weight="bold">${topic}</text><text x="350" y="255" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#555">${subject} · ${yearGroup}</text><text x="350" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#999">Diagram could not be generated — please try again</text></svg>`;
  return res.json({
    svg: placeholder,
    caption: `${topic} diagram`,
    provider: "placeholder",
    type: "svg",
  });
});

export default router;
