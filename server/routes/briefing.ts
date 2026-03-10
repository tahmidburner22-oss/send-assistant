/**
 * Daily Briefing & Debrief Routes
 * All staff can read. Admins/SENCos/Teachers can create/edit/delete their own entries.
 *
 * GET    /api/briefing?date=YYYY-MM-DD   — get all entries for a date
 * GET    /api/briefing/dates             — get list of dates that have entries (for calendar dots)
 * POST   /api/briefing                   — create a new entry
 * PUT    /api/briefing/:id               — update an entry (author or admin only)
 * DELETE /api/briefing/:id               — delete an entry (author or admin only)
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, auditLog } from "../middleware/auth.js";

const router = Router();
// Table is created in schema.sql via initDb() — no top-level exec needed here

// ── GET /api/briefing?date=YYYY-MM-DD ────────────────────────────────────────
router.get("/", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.json([]);

  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }

  const entries = db.prepare(
    `SELECT id, date, type, title, content, author_id, author_name, created_at, updated_at
     FROM daily_briefings
     WHERE school_id = ? AND date = ?
     ORDER BY type ASC, created_at ASC`
  ).all(schoolId, date);

  res.json(entries);
});

// ── GET /api/briefing/dates?month=YYYY-MM ────────────────────────────────────
// Returns array of date strings that have at least one entry — used for calendar dots
router.get("/dates", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.json([]);

  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid month format. Use YYYY-MM" });
  }

  const rows = db.prepare(
    `SELECT DISTINCT date FROM daily_briefings
     WHERE school_id = ? AND date LIKE ?
     ORDER BY date ASC`
  ).all(schoolId, `${month}-%`) as any[];

  res.json(rows.map((r: any) => r.date));
});

// ── POST /api/briefing ────────────────────────────────────────────────────────
router.post("/", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });

  const { date, type, title, content } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
  if (!content?.trim()) return res.status(400).json({ error: "Content is required" });

  const entryDate = date || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return res.status(400).json({ error: "Invalid date format" });
  }
  const entryType = ["briefing", "debrief", "note"].includes(type) ? type : "note";

  const id = uuidv4();
  db.prepare(
    `INSERT INTO daily_briefings (id, school_id, date, type, title, content, author_id, author_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, schoolId, entryDate, entryType, title.trim(), content.trim(), req.user!.id, req.user!.displayName || req.user!.email);

  auditLog(req.user!.id, schoolId, "briefing.created", "daily_briefings", id, { date: entryDate, type: entryType }, req.ip);
  res.status(201).json({ id, date: entryDate, type: entryType, title: title.trim(), content: content.trim(), author_name: req.user!.displayName || req.user!.email, created_at: new Date().toISOString() });
});

// ── PUT /api/briefing/:id ─────────────────────────────────────────────────────
router.put("/:id", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });

  const entry = db.prepare(
    "SELECT * FROM daily_briefings WHERE id = ? AND school_id = ?"
  ).get(req.params.id, schoolId) as any;
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  // Only the author or an admin can edit
  const isAdmin = ["school_admin", "mat_admin"].includes(req.user!.role);
  if (entry.author_id !== req.user!.id && !isAdmin) {
    return res.status(403).json({ error: "You can only edit your own entries" });
  }

  const { title, content, type } = req.body;
  const newTitle = title?.trim() || entry.title;
  const newContent = content?.trim() || entry.content;
  const newType = ["briefing", "debrief", "note"].includes(type) ? type : entry.type;

  db.prepare(
    `UPDATE daily_briefings SET title=?, content=?, type=?, updated_at=datetime('now')
     WHERE id=? AND school_id=?`
  ).run(newTitle, newContent, newType, req.params.id, schoolId);

  auditLog(req.user!.id, schoolId, "briefing.updated", "daily_briefings", req.params.id, {}, req.ip);
  res.json({ success: true });
});

// ── DELETE /api/briefing/:id ──────────────────────────────────────────────────
router.delete("/:id", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });

  const entry = db.prepare(
    "SELECT * FROM daily_briefings WHERE id = ? AND school_id = ?"
  ).get(req.params.id, schoolId) as any;
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  const isAdmin = ["school_admin", "mat_admin"].includes(req.user!.role);
  if (entry.author_id !== req.user!.id && !isAdmin) {
    return res.status(403).json({ error: "You can only delete your own entries" });
  }

  db.prepare("DELETE FROM daily_briefings WHERE id=? AND school_id=?").run(req.params.id, schoolId);
  auditLog(req.user!.id, schoolId, "briefing.deleted", "daily_briefings", req.params.id, {}, req.ip);
  res.json({ success: true });
});

export default router;
