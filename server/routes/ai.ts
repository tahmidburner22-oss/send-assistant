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
    if (t.includes("pythagoras") || (t.includes("right") && t.includes("triangle")))
      return "right-angled triangle: place the right angle at bottom-left (coordinate 100,400). Bottom side goes right to (400,400) labelled 'a' centred below. Vertical side goes up to (100,150) labelled 'b' to the left. Hypotenuse from (400,400) to (100,150) labelled 'c' outside the triangle. Small square symbol at (100,400) for the right angle. Formula box at (450,260): rect fill=#fff8e1 stroke=#f59e0b, text 'a²+b²=c²' inside. Title 'Pythagoras' Theorem' at top centre.";
    if (t.includes("circle"))
      return "large circle centred at (350,270) radius 160. Draw: radius line from centre to right edge labelled 'radius' above the line; diameter line all the way across labelled 'diameter' below; a chord (not through centre) labelled 'chord'; a tangent line touching the right side labelled 'tangent'; shade a small sector and label 'sector'; mark a short arc and label 'arc'. All labels placed outside or beside the shape with short leader lines. Title 'Parts of a Circle' at top.";
    if (t.includes("graph") || t.includes("linear"))
      return "coordinate axes: x-axis from (60,350) to (640,350) with arrow; y-axis from (350,440) to (350,30) with arrow. Label x and y at ends. Plot two points: A(200,300) and B(500,150) as filled circles. Draw a straight line through them extending slightly beyond. Draw a right-angle gradient triangle between the two points: horizontal leg labelled 'run', vertical leg labelled 'rise'. Mark y-intercept where line crosses y-axis with a dot labelled 'y-intercept'. Title 'Linear Graph' at top.";
    if (t.includes("fraction"))
      return "three equal rectangles (width 140, height 60) spaced evenly at y=200. Rect 1 at x=80: divide into 4 equal columns, fill first column #6366f1, label '1/4' below. Rect 2 at x=280: divide into 2 equal columns, fill first column #10b981, label '1/2' below. Rect 3 at x=480: divide into 4 equal columns, fill first two columns #f59e0b, label '2/4' below. Title 'Equivalent Fractions' at top. Each rect has a thin border.";
    if (t.includes("angle"))
      return "three angle diagrams side by side, each with two rays from a common vertex. Left (x=130): acute angle ~45°, arc and label 'Acute 45°' above. Centre (x=350): right angle 90° with small square at vertex, label 'Right 90°' above. Right (x=570): obtuse angle ~135°, arc and label 'Obtuse 135°' above. All rays clearly separated, labels never touching rays. Title 'Types of Angles' at top.";
    if (t.includes("area") || t.includes("perimeter"))
      return "rectangle at centre (x=150,y=150,width=400,height=200). Label width '8 cm' below the bottom edge, height '5 cm' to the right of the right edge. Two formula boxes below: 'Area = length × width = 40 cm²' and 'Perimeter = 2(l+w) = 26 cm'. Title 'Area and Perimeter' at top.";
    if (t.includes("probability"))
      return "horizontal number line from 0 to 1 (x=80 to x=620, y=260). Mark and label: 0 'Impossible', 0.25 'Unlikely', 0.5 'Even chance', 0.75 'Likely', 1 'Certain'. Each marker is a vertical tick with label above. Below the line draw a small spinner circle divided into 4 equal sectors with one shaded, labelled 'P = 1/4'. Title 'Probability Scale' at top.";
    return "a clear, well-spaced mathematical diagram for this topic. Use simple geometric shapes with all key measurements or labels placed outside shapes, connected by short leader lines. Leave generous whitespace between elements.";
  }
  if (s === "chemistry") {
    if (t.includes("atom") || t.includes("electron") || t.includes("bohr") || t.includes("atomic structure"))
      return "Bohr model: small filled circle at centre (350,250) labelled 'Nucleus (protons + neutrons)' with leader line going upper-right to label at (470,160). First electron shell: circle radius 80 centred at (350,250), 2 filled dots on it evenly spaced. Second shell: circle radius 150, 8 filled dots evenly spaced. Third shell (if needed): radius 220, dots. Each shell labelled 'Shell 1', 'Shell 2' etc. to the right. Title 'Atomic Structure (Bohr Model)' at top.";
    if (t.includes("bond") || t.includes("molecule"))
      return "structural diagram of a simple molecule (e.g. water H2O or methane CH4). Central atom as large circle, bonded atoms as smaller circles connected by straight lines representing bonds. Each atom labelled with its symbol inside the circle. Bond lines clearly separated. Title 'Molecular Structure' at top.";
    if (t.includes("reaction") || t.includes("equation"))
      return "reaction diagram: left side shows reactant molecules as labelled circles/shapes, right side shows product molecules. A large arrow in the centre labelled 'Chemical Reaction'. Conditions (heat/catalyst) written above the arrow. All molecules labelled with chemical formulas. Title 'Chemical Reaction' at top.";
    if (t.includes("periodic") || t.includes("element"))
      return "single element tile from the periodic table, enlarged: large square with element symbol (large, bold, centred), atomic number top-left, relative atomic mass bottom, full element name below symbol. Surrounded by its neighbouring elements shown smaller. Title 'Periodic Table Element' at top.";
    return "accurate, labelled chemistry diagram for this topic. All atoms, molecules or structures clearly drawn with labels outside shapes connected by leader lines.";
  }
  if (s === "physics") {
    if (t.includes("wave") || t.includes("sound") || t.includes("light") || t.includes("transverse"))
      return "transverse wave: draw a smooth sinusoidal wave across the diagram (y=250 as centre line, 2 full cycles from x=80 to x=620). Mark amplitude with a vertical double-headed arrow from centre line to crest, label 'Amplitude (A)' to the right. Mark one full wavelength with a horizontal double-headed arrow between two crests, label 'Wavelength (λ)' below. Label one crest 'Crest' and one trough 'Trough' with short leader lines. Formula box bottom-right: 'v = f × λ'. Title 'Transverse Wave' at top.";
    if (t.includes("circuit") || t.includes("electric"))
      return "simple series circuit: rectangle of wires. Top-left: battery symbol (two parallel lines, longer positive). Top-right: bulb symbol (circle with cross). Bottom: switch symbol (gap with angled line). Arrows on wires showing conventional current direction (clockwise). Each component labelled outside the circuit. Title 'Simple Electric Circuit' at top.";
    if (t.includes("force") || t.includes("newton"))
      return "free body diagram: rectangle in centre representing an object. Four arrows: upward arrow labelled 'Normal Force (N)', downward arrow labelled 'Weight (W = mg)', rightward arrow labelled 'Applied Force (F)', leftward arrow labelled 'Friction (f)'. Arrows proportional in length to magnitude. Title 'Free Body Diagram' at top.";
    if (t.includes("speed") || t.includes("velocity") || t.includes("acceleration"))
      return "distance-time graph: x-axis 'Time (s)' from 0 to 10, y-axis 'Distance (m)' from 0 to 100. Plot three line segments: horizontal (stationary), diagonal up (constant speed), steeper diagonal (faster speed). Each segment labelled. Title 'Distance-Time Graph' at top.";
    return "accurate, labelled physics diagram for this topic. Use standard physics symbols and conventions. All labels placed outside shapes with leader lines.";
  }
  if (s === "science" || s === "biology") {
    if (t.includes("plant") && t.includes("cell"))
      return "plant cell: large rectangle (x=100,y=80,width=500,height=340) with thick border (stroke-width=3) for cell wall. Inside: slightly smaller rectangle for cell membrane (dashed border). Large central rectangle (x=160,y=120,width=380,height=260) fill=#d1fae5 for vacuole, labelled 'Vacuole'. Oval at (280,200) fill=#fef3c7 for nucleus with smaller oval inside for nucleolus. Two small ovals fill=#bbf7d0 for chloroplasts. Small ovals for mitochondria. ALL labels placed OUTSIDE the cell rectangle, connected by straight horizontal leader lines to the right side. Title 'Plant Cell' at top.";
    if (t.includes("animal") && t.includes("cell"))
      return "animal cell: irregular oval shape (use ellipse cx=350,cy=270,rx=250,ry=170) fill=#fef9c3 for cytoplasm. Large oval cx=350,cy=250 rx=80,ry=60 fill=#fde68a for nucleus, with smaller oval inside for nucleolus. Three small ovals fill=#fed7aa for mitochondria placed around nucleus. ALL labels placed OUTSIDE the cell oval, connected by straight leader lines. Labels on right side: 'Cell membrane', 'Cytoplasm', 'Nucleus', 'Nucleolus', 'Mitochondria'. Title 'Animal Cell' at top.";
    if (t.includes("cell") && !t.includes("fuel"))
      return "animal cell: irregular oval shape fill=#fef9c3, nucleus oval fill=#fde68a with nucleolus inside, mitochondria ovals fill=#fed7aa. All labels outside the cell connected by straight leader lines. Title 'Animal Cell' at top.";
    if (t.includes("photosynthesis"))
      return "leaf cross-section rectangle (x=80,y=100,width=540,height=300). Inside: top layer (palisade cells) as tall rectangles fill=#86efac with chloroplast dots, labelled 'Palisade Layer'. Middle layer (spongy mesophyll) as irregular shapes fill=#bbf7d0, labelled 'Spongy Mesophyll'. Bottom layer as flat rectangles. Arrows: CO2 arrow entering from bottom labelled 'CO₂ in', O2 arrow exiting top labelled 'O₂ out', sunlight arrow from top labelled 'Light energy'. Equation box: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂'. Title 'Photosynthesis' at top.";
    if (t.includes("heart") || t.includes("circulatory"))
      return "heart outline as two rounded humps at top (atria) and pointed bottom (ventricle). Four chambers labelled: 'Right Atrium' top-right, 'Left Atrium' top-left, 'Right Ventricle' bottom-right, 'Left Ventricle' bottom-left. Thick line (septum) down the middle. Vessels at top: 'Vena Cava' entering right, 'Aorta' leaving left, 'Pulmonary Artery' leaving right, 'Pulmonary Vein' entering left. Curved arrows inside chambers showing blood flow direction. All labels outside the heart shape. Title 'The Human Heart' at top.";
    if (t.includes("mitosis") || t.includes("cell division"))
      return "four stages of mitosis in a 2×2 grid. Each cell shown as a circle. Stage 1 (top-left): 'Prophase' — chromosomes visible as X shapes. Stage 2 (top-right): 'Metaphase' — chromosomes lined up at centre. Stage 3 (bottom-left): 'Anaphase' — chromosomes pulled apart. Stage 4 (bottom-right): 'Telophase' — two new nuclei forming. Each stage labelled below its circle. Title 'Stages of Mitosis' at top.";
    if (t.includes("digestive") || t.includes("digestion"))
      return "simple outline of human torso. Label organs with leader lines: 'Mouth' at top, 'Oesophagus' (tube), 'Stomach' (J-shape), 'Small Intestine' (coiled tube), 'Large Intestine' (wider frame), 'Rectum' at bottom. Each organ a different pale fill colour. Title 'The Digestive System' at top.";
    return "accurate, labelled biological diagram for this topic. All structures clearly drawn with labels placed outside shapes connected by straight leader lines. No label should overlap any shape.";
  }
  if (s === "geography") {
    if (t.includes("river") || t.includes("meander") || t.includes("erosion") || t.includes("deposition"))
      return "river meander diagram: draw a large S-curve river from top-left to bottom-right. On the outer bend of each curve: red shading and label 'Erosion (outer bank)'. On the inner bend: yellow shading and label 'Deposition (inner bank, slip-off slope)'. Add a small ox-bow lake forming beside one meander. Label 'Meander', 'Floodplain' either side. Title 'River Meander Processes' at top.";
    if (t.includes("volcano") || t.includes("tectonic") || t.includes("plate boundary"))
      return "volcano cross-section: symmetrical cone shape. Inside: large oval 'Magma Chamber' at base fill=#fca5a5. Central rectangle 'Main Vent' from chamber to crater. Smaller angled rectangle 'Secondary Vent' on one side. 'Crater' at top with opening. 'Lava Flow' lines flowing down the sides. Below the base: two rectangles representing tectonic plates with arrows showing movement direction. All labels outside the volcano shape. Title 'Volcano Cross-Section' at top.";
    if (t.includes("coast") || t.includes("cliff") || t.includes("wave"))
      return "coastal erosion diagram: cliff face on the right side. Wave arrow hitting the base. Label: 'Hydraulic Action' (wave force), 'Abrasion' (rocks grinding), 'Attrition' (rocks wearing down), 'Solution' (chemical). Show cliff with notch at base, overhang, and collapsed material as a beach. Title 'Coastal Erosion Processes' at top.";
    if (t.includes("weather") || t.includes("climate") || t.includes("atmosphere"))
      return "water cycle diagram: sun at top-right, ocean/lake at bottom-left, mountain at right. Arrows showing: 'Evaporation' rising from water, 'Condensation' forming cloud, 'Precipitation' (rain/snow) falling, 'Surface Run-off' flowing back to ocean, 'Infiltration' going underground. Each process labelled on its arrow. Title 'The Water Cycle' at top.";
    return "clear, well-labelled geographical diagram or cross-section for this topic. All features labelled outside shapes with leader lines.";
  }
  if (s === "history")
    return "horizontal timeline: draw a thick horizontal line from x=60 to x=640 at y=250 with an arrowhead at the right end. Place 5 evenly-spaced event markers as filled circles on the line. For odd-numbered events (1,3,5): draw a vertical line UP to y=120, then a labelled rectangle (width=110,height=50) fill=#eef2ff stroke=#6366f1 with the year bold at top and event text below in font-size=10. For even-numbered events (2,4): draw a vertical line DOWN to y=370, then a labelled rectangle fill=#f0fdf4 stroke=#22c55e. No text should overlap any shape or line. Title 'Historical Timeline' at top.";
  if (s === "english" || s === "literacy")
    return "mind map: central oval at (350,250) fill=#e0e7ff with topic text. Six branches radiating outward at equal angles (60° apart) as straight lines. Each branch ends in a smaller oval fill=#f0f9ff with a label. Branch labels: key themes, characters, techniques, quotes, context, structure. All labels inside their ovals, ovals sized to fit text. No overlapping. Title as the topic name at top.";
  return "a clear, well-spaced educational diagram most relevant to this topic for UK school students. Use simple geometric shapes. Place ALL labels outside shapes connected by short straight leader lines. Leave at least 20px between any two elements.";
}

function buildDiagramPrompt(subject: string, topic: string, yearGroup: string, sendNeed?: string): { system: string; user: string } {
  const hint = getDiagramHintServer(subject, topic);
  const sendAdapt = sendNeed
    ? `SEND adaptation for ${sendNeed}: use font-size="16" minimum on ALL labels, stroke-width="3" on all shape outlines, limit to 6 labels maximum, use high-contrast colours (dark text on pale backgrounds), make all arrows large and bold.`
    : `Standard quality: font-size="14" minimum on all labels, stroke-width="2" on shape outlines.`;

  const system = `You are a specialist educational SVG diagram generator for UK school worksheets.
Your diagrams must be PROFESSIONAL, ACCURATE, WELL-SPACED, and PRINT-READY — matching the quality of a published textbook.

CANVAS: viewBox="0 0 700 500" — treat this as a 700×500 pixel canvas. Plan all coordinates carefully before drawing.

ABSOLUTE RULES — every rule is mandatory:
1. Output ONLY valid SVG. Start with exactly <svg viewBox="0 0 700 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg"> and end with </svg>. No text before or after the SVG.
2. FIRST child inside <svg>: <rect width="700" height="500" fill="white"/> (white background).
3. ALL <text> elements MUST include font-family="Arial, sans-serif" and an explicit fill colour.
4. Permitted SVG elements ONLY: rect, circle, ellipse, line, path, polygon, polyline, text, tspan, g, defs, marker. NO foreignObject, script, style, image, use, symbol, filter, clipPath, or any HTML.
5. TITLE: place a <text> at x="350" y="30" text-anchor="middle" font-size="17" font-weight="bold" fill="#1e293b" font-family="Arial, sans-serif"> with the diagram title.
6. SHAPES: outlines use stroke="#1e293b" stroke-width="2". Fills use pale colours: #dbeafe (blue), #dcfce7 (green), #fef9c3 (yellow), #fce7f3 (pink), #f3e8ff (purple), #ffedd5 (orange).
7. LABELS: every label text must have fill="#1e293b" font-size="13" font-family="Arial, sans-serif". Labels MUST be placed OUTSIDE the shape they describe, never overlapping any shape or other text.
8. LEADER LINES: draw a straight <line> from the edge of the shape to the label. Use stroke="#64748b" stroke-width="1". The line must not pass through any other shape.
9. SPACING: minimum 15px gap between any two shapes. Minimum 8px gap between any text and any shape. Leave 50px margin on all four sides of the canvas (no element outside x=50..650, y=40..470).
10. ARROWS: define a single arrowhead marker in <defs>: <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#1e293b"/></marker>. Use marker-end="url(#arr)" on arrow lines.
11. NO OVERLAPPING: before placing each element, verify it does not overlap any previously placed element. If space is tight, make shapes smaller rather than overlapping.
12. TEXT WRAPPING: if a label is longer than 12 characters, split it into two <tspan> lines using dy="1.2em" for the second line.
13. ${sendAdapt}
14. SCIENTIFIC ACCURACY: all shapes, labels, proportions, and relationships must be scientifically/mathematically correct for UK school level. Spell all labels correctly.
15. COMPLETENESS: include all key parts described in the diagram specification. Do not omit important labels.

After the closing </svg> tag, on a new line write: CAPTION: [one concise sentence describing what the diagram shows]`;

  const user = `Draw a professional educational SVG diagram for a UK school worksheet.

Subject: ${subject}
Topic: ${topic}
Year Group: ${yearGroup}

Diagram specification:
${hint}

Critical reminders:
- Plan all coordinates on the 700×500 canvas BEFORE writing SVG
- Every label must be OUTSIDE its shape with a leader line
- No text may overlap any shape or other text
- Leave 50px margin on all sides
- Output SVG only, then CAPTION: on a new line`;

  return { system, user };
}

// ── POST /api/ai/diagram — dedicated diagram generation with fallback chain ───
router.post("/diagram", requireAuth, async (req: Request, res: Response) => {
  const { subject, topic, yearGroup, sendNeed } = req.body;
  if (!subject || !topic) return res.status(400).json({ error: "subject and topic required" });

  const schoolId = req.user?.schoolId ?? undefined;
  const yr = yearGroup || "Year 9";

  // ── Attempt 0: Hand-coded pixel-perfect template (always accurate, instant) ────────────
  try {
    const { getTemplate } = await import("../lib/diagramTemplates.js");
    const template = getTemplate(subject, topic);
    if (template) {
      return res.json({
        svg: template.svg,
        caption: template.caption,
        provider: "template",
        type: "svg",
      });
    }
  } catch (e) {
    console.warn("[Diagram] Template lookup failed:", e);
  }

  // ── Attempt 1: Nano Banana 2 — Pollinations flux (primary image generator) ────────────
  // Builds a detailed, textbook-quality prompt for the flux model.
  try {
    const sendNote = sendNeed
      ? `Adapted for ${sendNeed}: extra-large clear labels, high contrast, simple layout.`
      : "Professional UK school textbook quality.";
    const diagramHint = getDiagramHintServer(subject, topic);
    const imagePrompt = encodeURIComponent(
      `Educational diagram: ${diagramHint}. ` +
      `Subject: ${subject}. Topic: ${topic}. Year group: ${yr}. ` +
      `Style: clean white background, printed textbook diagram, all labels clearly legible in black Arial font, ` +
      `accurate scientific/mathematical shapes, leader lines from shapes to labels, no watermarks, no decorative borders. ` +
      `${sendNote}`
    );
    const seed = (Date.now() + Math.floor(Math.random() * 9999)) % 99999;
    const nanoBananaUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?width=700&height=500&nologo=true&model=flux&seed=${seed}&enhance=true`;
    // Verify the image is reachable before returning it
    const check = await fetch(nanoBananaUrl, { method: "HEAD", signal: AbortSignal.timeout(12000) }).catch(() => null);
    if (check && check.ok) {
      return res.json({
        imageUrl: nanoBananaUrl,
        caption: `${topic} — ${subject} diagram`,
        provider: "nano-banana-2",
        type: "image",
      });
    }
  } catch (e) {
    console.warn("[Diagram] Nano Banana 2 (Pollinations flux) failed:", e);
  }

  // ── Attempt 2: GPT-4o SVG (high-quality structured fallback) ────────────────────────
  const { system, user } = buildDiagramPrompt(subject, topic, yr, sendNeed);
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

  // ── Attempt 3: Auto-fallback through all text providers (SVG generation) ────────────
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

  // ── Attempt 4: Pollinations flux-schnell (quick fallback image) ────────────────────
  try {
    const imagePrompt2 = encodeURIComponent(
      `Educational textbook diagram of ${topic} for ${subject}, ${yr}. ` +
      `Clean white background, clear labels, UK school textbook style, no watermarks.`
    );
    const fallbackUrl = `https://image.pollinations.ai/prompt/${imagePrompt2}?width=700&height=500&nologo=true&model=flux-schnell&seed=${Date.now() % 9999}`;
    const check2 = await fetch(fallbackUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) }).catch(() => null);
    if (check2 && check2.ok) {
      return res.json({
        imageUrl: fallbackUrl,
        caption: `${topic} — ${subject} illustration`,
        provider: "pollinations-schnell",
        type: "image",
      });
    }
  } catch (e) {
    console.warn("[Diagram] Pollinations schnell fallback failed:", e);
  }

  // ── Attempt 5: Clean placeholder SVG ──────────────────────────────────────────────────────
  const placeholder = `<svg viewBox="0 0 700 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg"><rect width="700" height="500" fill="white"/><rect x="20" y="20" width="660" height="460" fill="#f8f9ff" stroke="#6366f1" stroke-width="2" rx="12"/><text x="350" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#6366f1" font-weight="bold">${topic}</text><text x="350" y="255" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#555">${subject} · ${yr}</text><text x="350" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#999">Diagram could not be generated — please try again</text></svg>`;
  return res.json({
    svg: placeholder,
    caption: `${topic} diagram`,
    provider: "placeholder",
    type: "svg",
  });
});

export default router;
