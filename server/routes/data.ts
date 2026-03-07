import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, auditLog } from "../middleware/auth.js";

const router = Router();

// ── Worksheets ────────────────────────────────────────────────────────────────
router.get("/worksheets", requireAuth, (req: Request, res: Response) => {
  const rows = db.prepare(
    "SELECT * FROM worksheets WHERE school_id = ? ORDER BY created_at DESC"
  ).all(req.user!.schoolId);
  res.json(rows);
});

router.post("/worksheets", requireAuth, (req: Request, res: Response) => {
  const { title, subject, topic, yearGroup, sendNeed, difficulty, examBoard, content, teacherContent, overlay, sections } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const id = uuidv4();
  db.prepare(`INSERT INTO worksheets (id, school_id, created_by, title, subject, topic, year_group, send_need, difficulty, exam_board, content, teacher_content, overlay)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user!.schoolId, req.user!.id, title, subject, topic, yearGroup, sendNeed, difficulty, examBoard, content, teacherContent, overlay
  );
  // Save sections if provided
  if (Array.isArray(sections)) {
    sections.forEach((s: any, idx: number) => {
      db.prepare(`INSERT INTO worksheet_sections (id, worksheet_id, section_index, title, type, content, teacher_only, svg, caption, symbols)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        uuidv4(), id, idx, s.title || null, s.type || null, s.content || null,
        s.teacherOnly ? 1 : 0, s.svg || null, s.caption || null,
        s.symbols ? JSON.stringify(s.symbols) : null
      );
    });
  }
  auditLog(req.user!.id, req.user!.schoolId, "worksheet.created", "worksheet", id, { title, subject, yearGroup }, req.ip);
  res.status(201).json({ id });
});

router.put("/worksheets/:id", requireAuth, (req: Request, res: Response) => {
  const { rating, ratingLabel, overlay } = req.body;
  db.prepare("UPDATE worksheets SET rating=?, rating_label=?, overlay=? WHERE id=? AND school_id=?")
    .run(rating, ratingLabel, overlay, req.params.id, req.user!.schoolId);
  res.json({ message: "Updated" });
});

router.delete("/worksheets/:id", requireAuth, (req: Request, res: Response) => {
  db.prepare("DELETE FROM worksheets WHERE id=? AND school_id=?").run(req.params.id, req.user!.schoolId);
  res.json({ message: "Deleted" });
});

// ── Stories ───────────────────────────────────────────────────────────────────
router.get("/stories", requireAuth, (req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM stories WHERE school_id = ? ORDER BY created_at DESC").all(req.user!.schoolId);
  res.json(rows.map((r: any) => ({
    ...r,
    characters: JSON.parse(r.characters || "[]"),
    comprehensionQuestions: JSON.parse(r.comprehension_questions || "[]"),
  })));
});

router.post("/stories", requireAuth, (req: Request, res: Response) => {
  const { title, genre, yearGroup, sendNeed, characters, setting, theme, readingLevel, length, content, comprehensionQuestions } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const id = uuidv4();
  db.prepare(`INSERT INTO stories (id, school_id, created_by, title, genre, year_group, send_need, characters, setting, theme, reading_level, length, content, comprehension_questions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user!.schoolId, req.user!.id, title, genre, yearGroup, sendNeed,
    JSON.stringify(characters || []), setting, theme, readingLevel, length, content,
    JSON.stringify(comprehensionQuestions || [])
  );
  res.status(201).json({ id });
});

// ── Differentiations ──────────────────────────────────────────────────────────
router.get("/differentiations", requireAuth, (req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM differentiations WHERE school_id = ? ORDER BY created_at DESC").all(req.user!.schoolId);
  res.json(rows);
});

router.post("/differentiations", requireAuth, (req: Request, res: Response) => {
  const { taskContent, differentiatedContent, sendNeed, yearGroup, subject } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO differentiations (id, school_id, created_by, task_content, differentiated_content, send_need, year_group, subject)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user!.schoolId, req.user!.id, taskContent, differentiatedContent, sendNeed, yearGroup, subject
  );
  res.status(201).json({ id });
});

// ── Ideas ─────────────────────────────────────────────────────────────────────
router.get("/ideas", requireAuth, (req: Request, res: Response) => {
  const rows = db.prepare(
    `SELECT i.*, u.display_name as author_name FROM ideas i
     LEFT JOIN users u ON i.author_id = u.id
     WHERE i.school_id = ? ORDER BY i.votes DESC, i.created_at DESC`
  ).all(req.user!.schoolId);
  res.json(rows);
});

router.post("/ideas", requireAuth, (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const id = uuidv4();
  db.prepare("INSERT INTO ideas (id, school_id, author_id, title, description) VALUES (?, ?, ?, ?, ?)")
    .run(id, req.user!.schoolId, req.user!.id, title, description);
  res.status(201).json({ id });
});

router.post("/ideas/:id/vote", requireAuth, (req: Request, res: Response) => {
  db.prepare("UPDATE ideas SET votes = votes + 1 WHERE id = ? AND school_id = ?")
    .run(req.params.id, req.user!.schoolId);
  res.json({ message: "Voted" });
});

// ── Cookie Consent ────────────────────────────────────────────────────────────
router.post("/cookie-consent", (req: Request, res: Response) => {
  const { analytics, marketing, userId } = req.body;
  db.prepare("INSERT INTO cookie_consents (id, user_id, ip_address, analytics, marketing) VALUES (?, ?, ?, ?, ?)")
    .run(uuidv4(), userId || null, req.ip, analytics ? 1 : 0, marketing ? 1 : 0);
  res.json({ message: "Consent recorded" });
});

// ── Onboarding complete ───────────────────────────────────────────────────────
router.post("/onboarding-complete", requireAuth, (req: Request, res: Response) => {
  db.prepare("UPDATE users SET onboarding_done = 1 WHERE id = ?").run(req.user!.id);
  auditLog(req.user!.id, req.user!.schoolId, "user.onboarding_completed", "user", req.user!.id, {}, req.ip);
  res.json({ message: "Onboarding marked complete" });
});

// ── Admin: all worksheets across school ──────────────────────────────────────
router.get("/admin/worksheets", requireAuth, (req: Request, res: Response) => {
  const rows = db.prepare(
    `SELECT w.*, u.display_name as author_name FROM worksheets w
     LEFT JOIN users u ON w.created_by = u.id
     WHERE w.school_id = ? ORDER BY w.created_at DESC LIMIT 500`
  ).all(req.user!.schoolId);
  res.json(rows);
});

// ── Analytics summary ─────────────────────────────────────────────────────────
router.get("/analytics", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const pupils = (db.prepare("SELECT COUNT(*) as c FROM pupils WHERE school_id=? AND is_active=1").get(schoolId) as any).c;
  const worksheets = (db.prepare("SELECT COUNT(*) as c FROM worksheets WHERE school_id=?").get(schoolId) as any).c;
  const stories = (db.prepare("SELECT COUNT(*) as c FROM stories WHERE school_id=?").get(schoolId) as any).c;
  const users = (db.prepare("SELECT COUNT(*) as c FROM users WHERE school_id=? AND is_active=1").get(schoolId) as any).c;
  const incidents = (db.prepare("SELECT COUNT(*) as c FROM safeguarding_incidents WHERE school_id=? AND status='open'").get(schoolId) as any).c;
  res.json({ pupils, worksheets, stories, users, openIncidents: incidents });
});

export default router;
