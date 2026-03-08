import { Router, Request, Response } from "express";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// In-memory log buffer (last 200 entries)
const logBuffer: string[] = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function formatLog(level: string, args: any[]) {
  const ts = new Date().toISOString().replace("T", " ").substring(0, 19);
  const msg = args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
  const line = `[${ts}] ${level} ${msg}`;
  logBuffer.push(line);
  if (logBuffer.length > 200) logBuffer.shift();
  return line;
}

console.log = (...args) => { originalLog(formatLog("INFO", args)); };
console.error = (...args) => { originalError(formatLog("ERROR", args)); };
console.warn = (...args) => { originalWarn(formatLog("WARN", args)); };

// Middleware: require admin access
function requireAdmin(req: Request, res: Response, next: any) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const isAdmin = ["mat_admin", "school_admin", "senco"].includes(user.role) ||
    user.email === "admin@sendassistant.app";
  if (!isAdmin) return res.status(403).json({ error: "Forbidden" });
  next();
}

// GET /api/admin/stats
router.get("/stats", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any)?.c || 0;
    const totalWorksheets = (db.prepare("SELECT COUNT(*) as c FROM worksheets").get() as any)?.c || 0;
    const totalStories = (db.prepare("SELECT COUNT(*) as c FROM stories").get() as any)?.c || 0;
    const totalDifferentiations = (db.prepare("SELECT COUNT(*) as c FROM differentiations").get() as any)?.c || 0;

    // Active users in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeUsers7d = (db.prepare(
      "SELECT COUNT(DISTINCT user_id) as c FROM audit_log WHERE created_at > ?"
    ).get(sevenDaysAgo) as any)?.c || 0;

    // AI calls today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const aiCallsToday = (db.prepare(
      "SELECT COUNT(*) as c FROM audit_log WHERE action LIKE '%generate%' AND created_at > ?"
    ).get(todayStart.toISOString()) as any)?.c || 0;

    // Top tools (from audit log)
    const topToolsRaw = db.prepare(
      "SELECT action as tool, COUNT(*) as count FROM audit_log WHERE action LIKE '%generate%' GROUP BY action ORDER BY count DESC LIMIT 5"
    ).all() as any[];

    res.json({
      totalUsers, totalWorksheets, totalStories, totalDifferentiations,
      activeUsers7d, aiCallsToday,
      avgTimeSaved: Math.round((totalWorksheets + totalStories + totalDifferentiations) * 12),
      topTools: topToolsRaw,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/live-logs
router.get("/live-logs", requireAuth, requireAdmin, (req: Request, res: Response) => {
  res.json({ logs: [...logBuffer].reverse().slice(0, 100).reverse() });
});

// GET /api/admin/ai-keys
router.get("/ai-keys", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const rows = db.prepare("SELECT provider, api_key FROM admin_api_keys").all() as any[];
    const keys: Record<string, string> = {};
    for (const row of rows) {
      // Mask the key — show first 8 chars + asterisks
      const k = row.api_key || "";
      keys[row.provider] = k.length > 8 ? k.substring(0, 8) + "••••••••••••••••" : k;
    }
    res.json(keys);
  } catch {
    res.json({});
  }
});

// POST /api/admin/ai-keys
router.post("/ai-keys", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { provider, key } = req.body;
  if (!provider || !key) return res.status(400).json({ error: "provider and key required" });
  try {
    const existing = db.prepare("SELECT id FROM admin_api_keys WHERE provider = ?").get(provider);
    if (existing) {
      db.prepare("UPDATE admin_api_keys SET api_key = ?, updated_at = ? WHERE provider = ?")
        .run(key, new Date().toISOString(), provider);
    } else {
      db.prepare("INSERT INTO admin_api_keys (provider, api_key, updated_at) VALUES (?, ?, ?)")
        .run(provider, key, new Date().toISOString());
    }
    console.log(`Admin API key updated for provider: ${provider}`);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/test-ai/:provider
router.get("/test-ai/:provider", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { provider } = req.params;
  try {
    const row = db.prepare("SELECT api_key FROM admin_api_keys WHERE provider = ?").get(provider) as any;
    if (!row?.api_key) return res.json({ ok: false, error: "No API key configured" });

    const key = row.api_key;

    if (provider === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }

    if (provider === "gemini") {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Say OK" }] }] }),
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }

    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4.1-mini", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }

    if (provider === "openrouter") {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai/gpt-4o-mini", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }

    if (provider === "claude") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 5, messages: [{ role: "user", content: "Say OK" }] }),
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }

    res.json({ ok: false, error: "Unknown provider" });
  } catch (err: any) {
    res.json({ ok: false, error: err.message });
  }
});

// ── GDPR Breach Log (Art. 33/34 UK GDPR) ────────────────────────────────────

// GET /api/admin/breach-log  — list all breaches for the school
router.get("/breach-log", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = db.prepare(
      `SELECT b.*, u.name as reporter_name, u.email as reporter_email
       FROM breach_log b
       LEFT JOIN users u ON b.reported_by = u.id
       WHERE b.school_id = ? OR b.school_id IS NULL
       ORDER BY b.created_at DESC LIMIT 100`
    ).all(user.schoolId || user.school_id || "") as any[];
    res.json({ breaches: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/breach-log  — report a new breach
router.post("/breach-log", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, data_types, affected_count, severity } = req.body;
    if (!title || !description || !data_types) {
      return res.status(400).json({ error: "title, description, and data_types are required" });
    }
    const id = `breach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.prepare(
      `INSERT INTO breach_log (id, school_id, reported_by, title, description, data_types, affected_count, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      user.schoolId || user.school_id || null,
      user.id,
      title,
      description,
      Array.isArray(data_types) ? data_types.join(", ") : data_types,
      affected_count || 0,
      severity || "medium"
    );
    // Log to audit trail
    try {
      db.prepare(
        `INSERT INTO audit_logs (id, action, user_id, created_at) VALUES (?, ?, ?, datetime('now'))`
      ).run(`al_${Date.now()}`, `DATA_BREACH_REPORTED: ${title}`, user.id);
    } catch (_) {}
    res.json({ ok: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/breach-log/:id  — update status, ICO notification, containment
router.patch("/breach-log/:id", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const { status, ico_notified, ico_reference, subjects_notified, containment_action, resolved_at } = req.body;
    db.prepare(
      `UPDATE breach_log SET
        status = COALESCE(?, status),
        ico_notified = COALESCE(?, ico_notified),
        ico_reference = COALESCE(?, ico_reference),
        subjects_notified = COALESCE(?, subjects_notified),
        containment_action = COALESCE(?, containment_action),
        resolved_at = COALESCE(?, resolved_at),
        updated_at = datetime('now')
       WHERE id = ?`
    ).run(status, ico_notified, ico_reference, subjects_notified, containment_action, resolved_at, req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
