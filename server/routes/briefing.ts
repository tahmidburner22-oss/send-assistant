/**
 * Daily Briefing & Debrief Routes
 *
 * GET    /api/briefing?date=YYYY-MM-DD        — get all entries for a date
 * GET    /api/briefing/dates?month=YYYY-MM    — dates that have entries (calendar dots)
 * GET    /api/briefing/:id/attachment/:idx    — download a file attachment
 * POST   /api/briefing                        — create entry (multipart/form-data)
 * PUT    /api/briefing/:id                    — update entry (multipart/form-data)
 * DELETE /api/briefing/:id                    — delete entry
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import fs from "fs";
import path from "path";
import db from "../db/index.js";
import { requireAuth, auditLog } from "../middleware/auth.js";

const router = Router();

const upload = multer({
  dest: "/tmp/briefing-uploads/",
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".xlsx", ".pptx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

// ── GET /api/briefing?date=YYYY-MM-DD ────────────────────────────────────────
router.get("/", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.json([]);
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "Invalid date format" });

  const entries = db.prepare(
    `SELECT id, date, type, title, content, author_id, author_name, attachments, created_at, updated_at
     FROM daily_briefings WHERE school_id = ? AND date = ?
     ORDER BY type ASC, created_at ASC`
  ).all(schoolId, date) as any[];

  const result = entries.map((e: any) => {
    let attachments: any[] = [];
    try { attachments = JSON.parse(e.attachments || "[]"); } catch {}
    return {
      ...e,
      attachments: attachments.map((a: any, i: number) => ({
        idx: i, name: a.name, size: a.size, type: a.type,
        downloadUrl: `/api/briefing/${e.id}/attachment/${i}`,
      })),
    };
  });
  res.json(result);
});

// ── GET /api/briefing/dates?month=YYYY-MM ────────────────────────────────────
router.get("/dates", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.json([]);
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: "Invalid month format" });
  const rows = db.prepare(
    `SELECT DISTINCT date FROM daily_briefings WHERE school_id = ? AND date LIKE ? ORDER BY date ASC`
  ).all(schoolId, `${month}-%`) as any[];
  res.json(rows.map((r: any) => r.date));
});

// ── GET /api/briefing/:id/attachment/:idx ─────────────────────────────────────
router.get("/:id/attachment/:idx", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const entry = db.prepare("SELECT * FROM daily_briefings WHERE id = ? AND school_id = ?").get(req.params.id, schoolId) as any;
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  let attachments: any[] = [];
  try { attachments = JSON.parse(entry.attachments || "[]"); } catch {}
  const att = attachments[parseInt(req.params.idx, 10)];
  if (!att) return res.status(404).json({ error: "Attachment not found" });
  const buf = Buffer.from(att.data, "base64");
  res.setHeader("Content-Type", att.type || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(att.name)}"`);
  res.send(buf);
});

// ── POST /api/briefing ────────────────────────────────────────────────────────
router.post("/", requireAuth, upload.array("files", 5), (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });
  const { date, type, title, content } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
  if (!content?.trim()) return res.status(400).json({ error: "Content is required" });
  const entryDate = date || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return res.status(400).json({ error: "Invalid date format" });
  const entryType = ["briefing", "debrief", "note"].includes(type) ? type : "note";

  const files = (req as any).files as Express.Multer.File[] || [];
  const attachments = files.map(f => {
    const data = fs.readFileSync(f.path).toString("base64");
    try { fs.unlinkSync(f.path); } catch {}
    return { name: f.originalname, size: f.size, type: f.mimetype, data };
  });

  const id = uuidv4();
  db.prepare(
    `INSERT INTO daily_briefings (id, school_id, date, type, title, content, author_id, author_name, attachments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, schoolId, entryDate, entryType, title.trim(), content.trim(),
    req.user!.id, req.user!.displayName || req.user!.email, JSON.stringify(attachments));

  auditLog(req.user!.id, schoolId, "briefing.created", "daily_briefings", id, { date: entryDate, type: entryType }, req.ip);
  res.status(201).json({
    id, date: entryDate, type: entryType, title: title.trim(), content: content.trim(),
    author_name: req.user!.displayName || req.user!.email,
    attachments: attachments.map((a, i) => ({
      idx: i, name: a.name, size: a.size, type: a.type,
      downloadUrl: `/api/briefing/${id}/attachment/${i}`,
    })),
    created_at: new Date().toISOString(),
  });
});

// ── PUT /api/briefing/:id ─────────────────────────────────────────────────────
router.put("/:id", requireAuth, upload.array("files", 5), (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  const entry = db.prepare("SELECT * FROM daily_briefings WHERE id = ? AND school_id = ?").get(req.params.id, schoolId) as any;
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  const isAdmin = ["school_admin", "mat_admin"].includes(req.user!.role);
  if (entry.author_id !== req.user!.id && !isAdmin) return res.status(403).json({ error: "You can only edit your own entries" });

  const { title, content, type } = req.body;
  const newTitle = title?.trim() || entry.title;
  const newContent = content?.trim() || entry.content;
  const newType = ["briefing", "debrief", "note"].includes(type) ? type : entry.type;

  let existingAtts: any[] = [];
  try { existingAtts = JSON.parse(entry.attachments || "[]"); } catch {}

  const newFiles = (req as any).files as Express.Multer.File[] || [];
  const newAtts = newFiles.map(f => {
    const data = fs.readFileSync(f.path).toString("base64");
    try { fs.unlinkSync(f.path); } catch {}
    return { name: f.originalname, size: f.size, type: f.mimetype, data };
  });

  const mergedAtts = [...existingAtts, ...newAtts];
  db.prepare(
    `UPDATE daily_briefings SET title=?, content=?, type=?, attachments=?, updated_at=datetime('now') WHERE id=? AND school_id=?`
  ).run(newTitle, newContent, newType, JSON.stringify(mergedAtts), req.params.id, schoolId);

  auditLog(req.user!.id, schoolId, "briefing.updated", "daily_briefings", req.params.id, {}, req.ip);
  res.json({ success: true });
});

// ── DELETE /api/briefing/:id ──────────────────────────────────────────────────
router.delete("/:id", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  const entry = db.prepare("SELECT * FROM daily_briefings WHERE id = ? AND school_id = ?").get(req.params.id, schoolId) as any;
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  const isAdmin = ["school_admin", "mat_admin"].includes(req.user!.role);
  if (entry.author_id !== req.user!.id && !isAdmin) return res.status(403).json({ error: "You can only delete your own entries" });
  db.prepare("DELETE FROM daily_briefings WHERE id=? AND school_id=?").run(req.params.id, schoolId);
  auditLog(req.user!.id, schoolId, "briefing.deleted", "daily_briefings", req.params.id, {}, req.ip);
  res.json({ success: true });
});

export default router;
