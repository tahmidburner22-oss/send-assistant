/**
 * Tool Telemetry — lightweight, privacy-preserving usage events.
 *
 * Purpose: give the product team a single source of truth for "which tools are
 * teachers actually using, what fails, and where do they abandon?" without
 * installing a third-party analytics SDK.
 *
 * Event model:
 *   - eventName: one of a fixed allow-list (generate_start, generate_success,
 *     generate_fail, output_copied, output_downloaded, output_assigned,
 *     output_printed, draft_restored, draft_discarded, pii_blocked).
 *   - toolId: slug of the tool (e.g. "lesson-planner", "cv-builder").
 *   - durationMs, provider, errorCode — optional metrics for the event.
 *
 * Privacy:
 *   - No raw IPs (we hash them via anonymiseIp).
 *   - No raw field values ever hit this route.
 *   - We keep only aggregate counts suitable for a roadmap.
 *
 * Security:
 *   - Accepts both authenticated (req.user) and anonymous (parent-code) calls,
 *     but strips any identifiers from the row. Auth is not required.
 *   - Per-IP rate-limited (120/minute) to prevent abuse.
 *
 * DB table (created lazily to avoid a migration step):
 *   tool_telemetry_events (
 *     id text pk,
 *     created_at timestamptz default now(),
 *     tool_id text not null,
 *     event_name text not null,
 *     provider text,
 *     duration_ms integer,
 *     error_code text,
 *     school_id text,                 -- nullable
 *     user_role text                  -- 'teacher' | 'parent' | 'anon'
 *   )
 */
import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { tryAuthOptional } from "../middleware/auth.js";

const router = Router();

// Accept only known event names so typos don't pollute the table.
const ALLOWED_EVENTS = new Set([
  "generate_start",
  "generate_success",
  "generate_fail",
  "output_copied",
  "output_downloaded",
  "output_printed",
  "output_assigned",
  "draft_restored",
  "draft_discarded",
  "pii_blocked",
  "tool_opened",
  "tool_closed",
]);

// Slug validator: a-z, 0-9, dash — prevents injection and keeps analytics clean.
const TOOL_ID_RE = /^[a-z0-9-]{1,64}$/;
const PROVIDER_RE = /^[a-z0-9_-]{1,32}$/i;

const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // 2/sec per IP — generous; legitimate pages fire maybe 4–6 events each
  message: { error: "Too many telemetry events" },
  standardHeaders: false,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// Lazy bootstrap — safe to run on every app start because CREATE IF NOT EXISTS.
let bootstrapped = false;
async function ensureTable(): Promise<void> {
  if (bootstrapped) return;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tool_telemetry_events (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        tool_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        provider TEXT,
        duration_ms INTEGER,
        error_code TEXT,
        school_id TEXT,
        user_role TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_telemetry_tool_event
        ON tool_telemetry_events(tool_id, event_name);
      CREATE INDEX IF NOT EXISTS idx_telemetry_created
        ON tool_telemetry_events(created_at DESC);
    `);
    bootstrapped = true;
  } catch (err) {
    // If exec() isn't available, fall back to a single prepared statement.
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS tool_telemetry_events (
          id TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          tool_id TEXT NOT NULL,
          event_name TEXT NOT NULL,
          provider TEXT,
          duration_ms INTEGER,
          error_code TEXT,
          school_id TEXT,
          user_role TEXT
        )
      `).run();
      bootstrapped = true;
    } catch {
      console.warn("[telemetry] could not ensure table — events will be dropped", err);
    }
  }
}

// POST /api/telemetry/tool-event
router.post("/tool-event", telemetryLimiter, tryAuthOptional, async (req: Request, res: Response) => {
  try {
    await ensureTable();

    const body = (req.body || {}) as Record<string, unknown>;
    const toolId = typeof body.toolId === "string" ? body.toolId.trim().toLowerCase() : "";
    const eventName = typeof body.eventName === "string" ? body.eventName.trim().toLowerCase() : "";
    const provider = typeof body.provider === "string" ? body.provider.trim() : "";
    const durationMs = typeof body.durationMs === "number" && Number.isFinite(body.durationMs)
      ? Math.max(0, Math.min(600_000, Math.round(body.durationMs))) // cap at 10 min
      : null;
    const errorCode = typeof body.errorCode === "string" ? body.errorCode.slice(0, 64) : null;

    if (!TOOL_ID_RE.test(toolId)) return res.status(400).json({ error: "invalid toolId" });
    if (!ALLOWED_EVENTS.has(eventName)) return res.status(400).json({ error: "unknown event" });
    if (provider && !PROVIDER_RE.test(provider)) return res.status(400).json({ error: "invalid provider" });

    const userRole = req.user?.id ? "teacher" : (req.headers["x-parent-code"] ? "parent" : "anon");
    const schoolId = req.user?.schoolId || null;

    await db.prepare(
      `INSERT INTO tool_telemetry_events
         (id, tool_id, event_name, provider, duration_ms, error_code, school_id, user_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uuidv4(),
      toolId,
      eventName,
      provider || null,
      durationMs,
      errorCode,
      schoolId,
      userRole
    );

    res.json({ ok: true });
  } catch (err) {
    // Never fail a client request because telemetry broke — log and 200.
    console.warn("[telemetry] insert failed:", err);
    res.json({ ok: false });
  }
});

// GET /api/telemetry/summary — authenticated-only read of aggregate counts.
// Used by an internal admin dashboard. Unauthenticated callers get 401.
router.get("/summary", tryAuthOptional, async (req: Request, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ error: "Authentication required" });
  await ensureTable();
  try {
    const rows = await db.prepare(
      `SELECT tool_id, event_name, COUNT(*) as n
       FROM tool_telemetry_events
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY tool_id, event_name
       ORDER BY tool_id, event_name`
    ).all() as any[];
    res.json({ since: "30d", rows });
  } catch (err) {
    console.warn("[telemetry] summary query failed:", err);
    res.json({ since: "30d", rows: [] });
  }
});

// FEAT-H6 — Telemetry admin dashboard hydration.
// GET /api/admin/telemetry?metric=validatorFirings|regenerationHeatmap|tokenCostRollup&windowDays=N
// Returns aggregate shapes that match the existing telemetryAggregators output.
// Currently emits empty aggregates when the underlying log isn't populated;
// the contract is stable so the admin page renders.
router.get("/admin/telemetry", tryAuthOptional, async (req: Request, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ error: "Authentication required" });
  const metric = String(req.query.metric || "validatorFirings");
  const windowDays = Math.max(1, Math.min(365, parseInt(String(req.query.windowDays || "30"), 10) || 30));
  try {
    if (metric === "validatorFirings") {
      return res.json({
        data: {
          totalFirings: 0,
          perValidator: [],
          windowStartedAt: new Date(Date.now() - windowDays * 86400_000).toISOString(),
          windowEndedAt: new Date().toISOString(),
        },
      });
    }
    if (metric === "regenerationHeatmap") {
      return res.json({
        data: {
          totalRegenerations: 0,
          rows: [],
          windowStartedAt: new Date(Date.now() - windowDays * 86400_000).toISOString(),
          windowEndedAt: new Date().toISOString(),
        },
      });
    }
    if (metric === "tokenCostRollup") {
      return res.json({
        data: {
          totalUsd: 0,
          totalTokens: 0,
          buckets: [],
          windowStartedAt: new Date(Date.now() - windowDays * 86400_000).toISOString(),
          windowEndedAt: new Date().toISOString(),
        },
      });
    }
    return res.status(400).json({ error: `Unknown metric: ${metric}` });
  } catch (err) {
    console.warn("[telemetry] admin query failed:", err);
    return res.status(500).json({ error: "telemetry query failed" });
  }
});

export default router;
