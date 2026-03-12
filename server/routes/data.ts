import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, auditLog } from "../middleware/auth.js";
import { sendBehaviourAlert } from "../email/index.js";

const router = Router();

// ── Worksheets ────────────────────────────────────────────────────────────────
router.get("/worksheets", requireAuth, (req: Request, res: Response) => {
  const rows = db.prepare(
    "SELECT * FROM worksheets WHERE school_id = ? ORDER BY created_at DESC"
  ).all(req.user!.schoolId) as any[];
  // Map snake_case DB columns to camelCase expected by the client, and attach sections
  const mapped = rows.map((r: any) => {
    const sections = db.prepare(
      "SELECT * FROM worksheet_sections WHERE worksheet_id = ? ORDER BY section_index ASC"
    ).all(r.id) as any[];
    return {
      id: r.id,
      title: r.title,
      subject: r.subject,
      topic: r.topic,
      yearGroup: r.year_group,
      sendNeed: r.send_need,
      difficulty: r.difficulty,
      examBoard: r.exam_board,
      content: r.content,
      teacherContent: r.teacher_content,
      rating: r.rating,
      ratingLabel: r.rating_label,
      overlay: r.overlay,
      createdAt: r.created_at,
      sections: sections.map((s: any) => ({
        title: s.title,
        type: s.type,
        content: s.content,
        teacherOnly: !!s.teacher_only,
        svg: s.svg,
        caption: s.caption,
        symbols: s.symbols ? JSON.parse(s.symbols) : undefined,
      })),
    };
  });
  res.json(mapped);
});

router.post("/worksheets", requireAuth, (req: Request, res: Response) => {
  try {
    const { title, subject, topic, yearGroup, sendNeed, difficulty, examBoard, content, teacherContent, overlay, sections } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });
    console.log(`[POST /worksheets] title=${title} subject=${subject} yearGroup=${yearGroup} sections=${Array.isArray(sections) ? sections.length : 'none'}`);
    const id = uuidv4();
    const n = (v: any) => (v === undefined || v === null ? null : v);
    db.prepare(`INSERT INTO worksheets (id, school_id, created_by, title, subject, topic, year_group, send_need, difficulty, exam_board, content, teacher_content, overlay)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, n(req.user!.schoolId), n(req.user!.id), n(title), n(subject), n(topic), n(yearGroup), n(sendNeed), n(difficulty), n(examBoard), n(content), n(teacherContent), n(overlay)
    );
    console.log(`[POST /worksheets] worksheet inserted id=${id}`);
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
      console.log(`[POST /worksheets] ${sections.length} sections inserted`);
    }
    auditLog(req.user!.id, req.user!.schoolId, "worksheet.created", "worksheet", id, { title, subject, yearGroup }, req.ip);
    res.status(201).json({ id });
  } catch (err: any) {
    const errStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err) || 'unknown error');
    console.error(`[POST /worksheets] CAUGHT ERROR type=${typeof err}:`, err);
    res.status(500).json({ error: errStr, type: typeof err, raw: String(err) });
  }
});

router.put("/worksheets/:id", requireAuth, (req: Request, res: Response) => {
  const { rating, ratingLabel, overlay, content, teacherContent, sections } = req.body;
  // Use COALESCE for all fields so partial updates (e.g. rating-only) don't wipe other fields
  db.prepare("UPDATE worksheets SET rating=COALESCE(?, rating), rating_label=COALESCE(?, rating_label), overlay=COALESCE(?, overlay), content=COALESCE(?, content), teacher_content=COALESCE(?, teacher_content) WHERE id=? AND school_id=?")
    .run(rating ?? null, ratingLabel ?? null, overlay ?? null, content ?? null, teacherContent ?? null, req.params.id, req.user!.schoolId);
  // Update sections if provided
  if (Array.isArray(sections)) {
    db.prepare("DELETE FROM worksheet_sections WHERE worksheet_id=?").run(req.params.id);
    sections.forEach((s: any, idx: number) => {
      db.prepare(`INSERT INTO worksheet_sections (id, worksheet_id, section_index, title, type, content, teacher_only, svg, caption, symbols) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(uuidv4(), req.params.id, idx, s.title || null, s.type || null, s.content || null, s.teacherOnly ? 1 : 0, s.svg || null, s.caption || null, s.symbols ? JSON.stringify(s.symbols) : null);
    });
  }
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
  const n2 = (v: any) => (v === undefined || v === null ? null : v);
  db.prepare(`INSERT INTO stories (id, school_id, created_by, title, genre, year_group, send_need, characters, setting, theme, reading_level, length, content, comprehension_questions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, n2(req.user!.schoolId), n2(req.user!.id), n2(title), n2(genre), n2(yearGroup), n2(sendNeed),
    JSON.stringify(characters || []), n2(setting), n2(theme), n2(readingLevel), n2(length), n2(content),
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
  const n3 = (v: any) => (v === undefined || v === null ? null : v);
  db.prepare(`INSERT INTO differentiations (id, school_id, created_by, task_content, differentiated_content, send_need, year_group, subject)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, n3(req.user!.schoolId), n3(req.user!.id), n3(taskContent), n3(differentiatedContent), n3(sendNeed), n3(yearGroup), n3(subject)
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
    .run(id, req.user!.schoolId ?? null, req.user!.id ?? null, title, description ?? null);
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
    .run(uuidv4(), userId || null, req.ip ?? null, analytics ? 1 : 0, marketing ? 1 : 0);
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

// ── Behaviour Records ────────────────────────────────────────────────────────
router.get("/behaviour", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const pupilId = req.query.pupilId as string | undefined;
  let rows;
  if (pupilId) {
    rows = db.prepare(
      `SELECT br.*, p.name as pupil_name, u.display_name as recorded_by_name
       FROM behaviour_records br
       LEFT JOIN pupils p ON br.pupil_id = p.id
       LEFT JOIN users u ON br.recorded_by = u.id
       WHERE br.school_id = ? AND br.pupil_id = ?
       ORDER BY br.date DESC, br.created_at DESC LIMIT 200`
    ).all(schoolId, pupilId);
  } else {
    rows = db.prepare(
      `SELECT br.*, p.name as pupil_name, u.display_name as recorded_by_name
       FROM behaviour_records br
       LEFT JOIN pupils p ON br.pupil_id = p.id
       LEFT JOIN users u ON br.recorded_by = u.id
       WHERE br.school_id = ?
       ORDER BY br.date DESC, br.created_at DESC LIMIT 500`
    ).all(schoolId);
  }
  res.json(rows);
});

router.post("/behaviour", requireAuth, (req: Request, res: Response) => {
  const { pupilId, type, category, description, actionTaken, date } = req.body;
  if (!pupilId || !type || !date) return res.status(400).json({ error: "pupilId, type, date required" });
  const id = `br_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(
    `INSERT INTO behaviour_records (id, school_id, pupil_id, recorded_by, type, category, description, action_taken, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, req.user!.schoolId, pupilId, req.user!.id, type, category || null, description || null, actionTaken || null, date);
  auditLog(req.user!.id, req.user!.schoolId, "behaviour.created", "behaviour_record", id, { pupilId, type }, req.ip);
  // Send parent notification email if parent_email is set on the pupil
  try {
    const pupil = db.prepare("SELECT name, parent_email, parent_name FROM pupils WHERE id=? AND school_id=?").get(pupilId, req.user!.schoolId) as any;
    const school = db.prepare("SELECT name FROM schools WHERE id=?").get(req.user!.schoolId) as any;
    if (pupil?.parent_email) {
      sendBehaviourAlert(pupil.parent_email, {
        pupilName: pupil.name,
        type,
        category: category || undefined,
        description: description || undefined,
        actionTaken: actionTaken || undefined,
        date,
        teacherName: req.user!.displayName || "Your child's teacher",
        schoolName: school?.name || "School",
      }).catch((err: any) => console.error("[behaviour] parent email error:", err?.message));
    }
  } catch (e: any) {
    console.error("[behaviour] parent email lookup error:", e?.message);
  }
  res.status(201).json({ id, message: "Behaviour record created" });
});

router.delete("/behaviour/:id", requireAuth, (req: Request, res: Response) => {
  const record = db.prepare("SELECT * FROM behaviour_records WHERE id=? AND school_id=?").get(req.params.id, req.user!.schoolId);
  if (!record) return res.status(404).json({ error: "Not found" });
  db.prepare("DELETE FROM behaviour_records WHERE id=?").run(req.params.id);
  res.json({ message: "Deleted" });
});

// ── Parent Portal: support plans for a pupil ───────────────────────────
router.get("/parent/support-plans/:pupilId", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const { pupilId } = req.params;
  const pupil = db.prepare("SELECT * FROM pupils WHERE id=? AND school_id=?").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const plans = db.prepare(
    `SELECT id, title, summary, strategies, positive_targets as positiveTargets, status, review_date as reviewDate, created_at
     FROM behaviour_support_plans
     WHERE pupil_id = ? AND school_id = ? AND shared_with_parents = 1
     ORDER BY created_at DESC`
  ).all(pupilId, schoolId);
  res.json(plans);
});

// ── Parent Portal: behaviour records for a pupil ───────────────────────────
router.get("/parent/behaviour/:pupilId", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const { pupilId } = req.params;
  const pupil = db.prepare("SELECT * FROM pupils WHERE id=? AND school_id=?").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const rows = db.prepare(
    `SELECT br.id, br.type, br.category, br.description, br.action_taken, br.date,
            u.display_name as recorded_by_name
     FROM behaviour_records br
     LEFT JOIN users u ON br.recorded_by = u.id
     WHERE br.pupil_id = ? AND br.school_id = ?
     ORDER BY br.date DESC LIMIT 100`
  ).all(pupilId, schoolId);
  res.json(rows);
});

// ── User Preferences (sidebar collapse state, theme, etc.) ──────────────────
router.get("/preferences", requireAuth, (req: Request, res: Response) => {
  try {
    const row = db.prepare("SELECT preferences FROM users WHERE id = ?").get(req.user!.id) as any;
    const prefs = row?.preferences ? JSON.parse(row.preferences) : {};
    res.json(prefs);
  } catch {
    res.json({});
  }
});

router.put("/preferences", requireAuth, (req: Request, res: Response) => {
  const prefs = req.body;
  if (!prefs || typeof prefs !== "object") return res.status(400).json({ error: "Invalid preferences" });
  try {
    db.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(
      JSON.stringify(prefs),
      req.user!.id
    );
    res.json({ ok: true });
  } catch (err: any) {
    // Column may not exist yet — run migration then retry
    try {
      db.prepare("ALTER TABLE users ADD COLUMN preferences TEXT").run();
      db.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(
        JSON.stringify(prefs),
        req.user!.id
      );
      res.json({ ok: true });
    } catch (e2: any) {
      console.error("[preferences] save error:", e2);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  }
});

export default router;

