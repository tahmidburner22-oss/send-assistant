import { Router, Request, Response } from "express";
import { randomBytes } from "crypto";
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
    user.email === "admin@adaptly.co.uk" ||
    user.email === "admin@sendassistant.app"; // legacy fallback
  if (!isAdmin) return res.status(403).json({ error: "Forbidden" });
  next();
}

// Middleware: require super admin (mat_admin or Adaptly owner)
function requireSuperAdmin(req: Request, res: Response, next: any) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const isSuperAdmin = user.role === "mat_admin" ||
    user.email === "admin@adaptly.co.uk" ||
    user.email === "admin@sendassistant.app";
  if (!isSuperAdmin) return res.status(403).json({ error: "Super admin access required" });
  next();
}

// GET /api/admin/stats
router.get("/stats", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const totalUsers = (await db.prepare("SELECT COUNT(*) as c FROM users").get() as any)?.c || 0;
    const totalWorksheets = (await db.prepare("SELECT COUNT(*) as c FROM worksheets").get() as any)?.c || 0;
    const totalStories = (await db.prepare("SELECT COUNT(*) as c FROM stories").get() as any)?.c || 0;
    const totalDifferentiations = (await db.prepare("SELECT COUNT(*) as c FROM differentiations").get() as any)?.c || 0;

    // Active users in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeUsers7d = (await db.prepare(
      "SELECT COUNT(DISTINCT user_id) as c FROM audit_logs WHERE created_at > ?"
    ).get(sevenDaysAgo) as any)?.c || 0;

    // AI calls today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const aiCallsToday = (await db.prepare(
      "SELECT COUNT(*) as c FROM audit_logs WHERE action LIKE '%generate%' AND created_at > ?"
    ).get(todayStart.toISOString()) as any)?.c || 0;

    // Top tools (from audit log)
    const topToolsRaw = await db.prepare(
      "SELECT action as tool, COUNT(*) as count FROM audit_logs WHERE action LIKE '%generate%' GROUP BY action ORDER BY count DESC LIMIT 5"
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
router.get("/live-logs", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  res.json({ logs: [...logBuffer].reverse().slice(0, 100).reverse() });
});

// GET /api/admin/ai-keys
router.get("/ai-keys", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const rows = await db.prepare("SELECT provider, api_key FROM admin_api_keys").all() as any[];
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
router.post("/ai-keys", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { provider, key } = req.body;
  if (!provider || !key) return res.status(400).json({ error: "provider and key required" });
  try {
    const existing = await db.prepare("SELECT id FROM admin_api_keys WHERE provider = ?").get(provider);
    if (existing) {
      await db.prepare("UPDATE admin_api_keys SET api_key = ?, updated_at = ? WHERE provider = ?")
        .run(key, new Date().toISOString(), provider);
    } else {
      await db.prepare("INSERT INTO admin_api_keys (provider, api_key, updated_at) VALUES (?, ?, ?)")
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
    const row = await db.prepare("SELECT api_key FROM admin_api_keys WHERE provider = ?").get(provider) as any;
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
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
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
router.get("/breach-log", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = await db.prepare(
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
router.post("/breach-log", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, data_types, affected_count, severity } = req.body;
    if (!title || !description || !data_types) {
      return res.status(400).json({ error: "title, description, and data_types are required" });
    }
    const id = `breach_${Date.now()}_${randomBytes(3).toString("hex")}`;
    await db.prepare(
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
      await db.prepare(
        `INSERT INTO audit_logs (id, action, user_id, created_at) VALUES (?, ?, ?, NOW())`
      ).run(`al_${Date.now()}`, `DATA_BREACH_REPORTED: ${title}`, user.id);
    } catch (_) {}
    res.json({ ok: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/breach-log/:id  — update status, ICO notification, containment
router.patch("/breach-log/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, ico_notified, ico_reference, subjects_notified, containment_action, resolved_at } = req.body;
    await db.prepare(
      `UPDATE breach_log SET
        status = COALESCE(?, status),
        ico_notified = COALESCE(?, ico_notified),
        ico_reference = COALESCE(?, ico_reference),
        subjects_notified = COALESCE(?, subjects_notified),
        containment_action = COALESCE(?, containment_action),
        resolved_at = COALESCE(?, resolved_at),
        updated_at = NOW()
       WHERE id = ?`
    ).run(status, ico_notified, ico_reference, subjects_notified, containment_action, resolved_at, req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Super Admin: All Schools Overview ───────────────────────────────────────

// GET /api/admin/super/schools — all schools with billing & activity data
router.get("/super/schools", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const schools = await db.prepare(`
      SELECT
        s.id, s.name, s.urn, s.domain, s.licence_type, s.onboarding_complete,
        s.stripe_customer_id, s.subscription_status, s.subscription_plan,
        s.subscription_period_end, s.subscription_cancel_at_period_end,
        s.created_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT p.id) as pupil_count,
        MAX(al.created_at) as last_activity
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN pupils p ON p.school_id = s.id AND p.is_active = 1
      LEFT JOIN audit_logs al ON al.school_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all();
    res.json({ schools });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/super/schools/:id/activity — recent activity for a school
router.get("/super/schools/:id/activity", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await db.prepare(`
      SELECT al.*, u.display_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.school_id = ?
      ORDER BY al.created_at DESC
      LIMIT 50
    `).all(req.params.id);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/super/billing-summary — upcoming renewals & payment overview
router.get("/super/billing-summary", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const schools = await db.prepare(`
      SELECT id, name, subscription_status, subscription_plan,
             subscription_period_end, subscription_cancel_at_period_end,
             stripe_customer_id, licence_type, domain
      FROM schools
      ORDER BY subscription_period_end ASC
    `).all() as any[];

    const planPrices: Record<string, number> = {
      starter: 49,
      professional: 99,
      premium: 149,
      mat: 299,
    };

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingRenewals = schools
      .filter(s => s.subscription_period_end && new Date(s.subscription_period_end) <= in30Days && new Date(s.subscription_period_end) > now)
      .map(s => ({
        ...s,
        monthly_value: planPrices[s.subscription_plan] || 0,
        days_until_renewal: Math.ceil((new Date(s.subscription_period_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }));

    const activeSchools = schools.filter(s => s.subscription_status === "active");
    const trialSchools = schools.filter(s => s.licence_type === "trial" || s.subscription_status === "trialing");
    const overdueSchools = schools.filter(s => s.subscription_status === "past_due" || s.subscription_status === "unpaid");
    const canceledSchools = schools.filter(s => s.subscription_status === "canceled");
    const mrr = activeSchools.reduce((sum, s) => sum + (planPrices[s.subscription_plan] || 0), 0);

    res.json({
      summary: {
        total_schools: schools.length,
        active: activeSchools.length,
        on_trial: trialSchools.length,
        overdue: overdueSchools.length,
        canceled: canceledSchools.length,
        mrr,
        arr: mrr * 12,
      },
      upcoming_renewals: upcomingRenewals,
      overdue_schools: overdueSchools,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/super/invoice — generate a manual invoice for a school
router.post("/super/invoice", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { school_id, amount, description, due_date, notes } = req.body;
    if (!school_id || !amount || !description) {
      return res.status(400).json({ error: "school_id, amount, and description are required" });
    }
    const school = await db.prepare("SELECT * FROM schools WHERE id = ?").get(school_id) as any;
    if (!school) return res.status(404).json({ error: "School not found" });

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const invoice = {
      invoice_number: invoiceNumber,
      school_id,
      school_name: school.name,
      school_domain: school.domain || "",
      amount: parseFloat(amount),
      description,
      due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: notes || "",
      issued_date: new Date().toISOString().split("T")[0],
      status: "issued",
    };

    // Log the invoice creation in audit log
    try {
      await db.prepare(
        `INSERT INTO audit_logs (id, school_id, user_id, action, created_at)
         VALUES (?, ?, ?, ?, NOW())`
      ).run(`inv_${Date.now()}`, school_id, (req as any).user.id, `INVOICE_ISSUED: ${invoiceNumber} £${amount}`);
    } catch (_) {}

    res.json({ ok: true, invoice });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/super/users — list ALL users across all schools (super admin only)
router.get("/super/users", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const users = await db.prepare(`
      SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.email_verified,
             u.mfa_enabled, u.last_login_at, u.created_at, s.name as school_name, u.school_id
      FROM users u
      LEFT JOIN schools s ON s.id = u.school_id
      ORDER BY u.created_at DESC
    `).all();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/super/users/:id — update any user's role or status (super admin only)
router.patch("/super/users/:id", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { role, is_active, email_verified } = req.body;
    const userId = req.params.id;
    if (role) {
      const validRoles = ["mat_admin", "school_admin", "senco", "teacher", "ta"];
      if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
      await db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
    }
    if (is_active !== undefined) {
      await db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, userId);
    }
    if (email_verified !== undefined) {
      await db.prepare("UPDATE users SET email_verified = ? WHERE id = ?").run(email_verified ? 1 : 0, userId);
    }
    try {
      await db.prepare(`INSERT INTO audit_logs (id, school_id, user_id, action, created_at) VALUES (?, ?, ?, ?, NOW())`)
        .run(`sa_u_${Date.now()}`, null, (req as any).user.id, `SUPER_ADMIN_USER_UPDATE: userId=${userId} role=${role} active=${is_active}`);
    } catch (_) {}
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/super/users/:id — permanently delete a user (super admin only)
router.delete("/super/users/:id", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const adminId = (req as any).user.id;
    if (userId === adminId) return res.status(400).json({ error: "Cannot delete your own account" });
    const user = await db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    await db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    try {
      await db.prepare(`INSERT INTO audit_logs (id, school_id, user_id, action, created_at) VALUES (?, ?, ?, ?, NOW())`)
        .run(`sa_del_${Date.now()}`, null, adminId, `SUPER_ADMIN_USER_DELETED: ${user.email}`);
    } catch (_) {}
    res.json({ ok: true, message: `User ${user.email} deleted` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/super/audit — full audit log across all schools (super admin only)
router.get("/super/audit", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;
    const logs = await db.prepare(`
      SELECT al.*, u.display_name, u.email, s.name as school_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN schools s ON s.id = al.school_id
      ORDER BY al.created_at DESC
      LIMIT ?
    `).all(limit);
    res.json({ logs });
  } catch (err: any) {
    // Try audit_logs table as fallback
    try {
      const logs = await db.prepare(`
        SELECT al.*, u.display_name, u.email
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        ORDER BY al.created_at DESC
        LIMIT ?
      `).all(parseInt(req.query.limit as string) || 200);
      res.json({ logs });
    } catch (err2: any) {
      res.status(500).json({ error: err2.message });
    }
  }
});

// PATCH /api/admin/super/schools/:id/subscription — manually override subscription status
router.patch("/super/schools/:id/subscription", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { subscription_status, subscription_plan, licence_type } = req.body;
    await db.prepare(`
      UPDATE schools SET
        subscription_status = COALESCE(?, subscription_status),
        subscription_plan = COALESCE(?, subscription_plan),
        licence_type = COALESCE(?, licence_type)
      WHERE id = ?
    `).run(subscription_status || null, subscription_plan || null, licence_type || null, req.params.id);
    try {
      await db.prepare(
        `INSERT INTO audit_logs (id, school_id, user_id, action, created_at)
         VALUES (?, ?, ?, ?, NOW())`
      ).run(`sa_${Date.now()}`, req.params.id, (req as any).user.id,
        `SUPER_ADMIN_SUBSCRIPTION_OVERRIDE: status=${subscription_status} plan=${subscription_plan}`);
    } catch (_) {}
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// ── GET /api/admin/senco-report — cross-class SEND overview for SENCOs ────────
// Returns all pupils with SEND needs grouped by need type, with assignment stats
router.get("/senco-report", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const schoolId = user?.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated" });

  try {
    // All SEND pupils across the school
    const pupils = await db.prepare(
      "SELECT id, name, year_group, send_need FROM pupils WHERE school_id=? AND is_active=1 AND send_need IS NOT NULL AND send_need != '' ORDER BY send_need, year_group, name"
    ).all(schoolId) as any[];

    // For each pupil, get basic assignment stats
    const enriched = await Promise.all(pupils.map(async p => {
      const stats = await db.prepare(
        "SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed, AVG(COALESCE(progress,0)) as avgProgress FROM assignments WHERE pupil_id=?"
      ).get(p.id) as any;
      return {
        id: p.id,
        name: p.name,
        yearGroup: p.year_group,
        sendNeed: p.send_need,
        totalAssignments: stats?.total || 0,
        completedAssignments: stats?.completed || 0,
        avgProgress: Math.round(stats?.avgProgress || 0),
      };
    }));

    // Group by SEND need
    const grouped: Record<string, any[]> = {};
    for (const p of enriched) {
      const key = p.sendNeed || "Unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    }

    // Summary stats
    const totalSendPupils = pupils.length;
    const needCounts = Object.entries(grouped).map(([need, list]) => ({ need, count: list.length }))
      .sort((a, b) => b.count - a.count);

    res.json({ totalSendPupils, needCounts, grouped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/school-usage-trend — weekly usage for admin analytics ──────
router.get("/school-usage-trend", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const schoolId = user?.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });

  try {
    const weeks: any[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const s = weekStart.toISOString();
      const e = weekEnd.toISOString();
      const label = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const worksheets = (await db.prepare("SELECT COUNT(*) as c FROM worksheets WHERE school_id=? AND created_at>=? AND created_at<?").get(schoolId, s, e) as any)?.c || 0;
      const stories = (await db.prepare("SELECT COUNT(*) as c FROM stories WHERE school_id=? AND created_at>=? AND created_at<?").get(schoolId, s, e) as any)?.c || 0;
      const diffs = (await db.prepare("SELECT COUNT(*) as c FROM differentiations WHERE school_id=? AND created_at>=? AND created_at<?").get(schoolId, s, e) as any)?.c || 0;
      const activeUsers = (await db.prepare("SELECT COUNT(DISTINCT user_id) as c FROM audit_logs WHERE school_id=? AND created_at>=? AND created_at<?").get(schoolId, s, e) as any)?.c || 0;
      weeks.push({ week: label, worksheets, stories, differentiations: diffs, activeUsers });
    }
    res.json(weeks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
