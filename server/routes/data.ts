import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, auditLog } from "../middleware/auth.js";
import { sendBehaviourAlert, sendDirectParentMessage } from "../email/index.js";

const router = Router();

// ── Worksheets ────────────────────────────────────────────────────────────────
router.get("/worksheets", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.prepare(
    "SELECT * FROM worksheets WHERE created_by = ? ORDER BY created_at DESC"
  ).all(req.user!.id) as any[];
  // Map snake_case DB columns to camelCase expected by the client, and attach sections
  const mapped = await Promise.all(rows.map(async (r: any) => {
    const sections = await db.prepare(
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
  }));
  res.json(mapped);
});

router.post("/worksheets", requireAuth, async (req: Request, res: Response) => {
  try {
    const { title: rawTitle, subject, topic, yearGroup, sendNeed, difficulty, examBoard, content, teacherContent, overlay, sections } = req.body;
    if (!rawTitle) return res.status(400).json({ error: "Title required" });
    // Strip rogue markdown bold markers from title
    const title = typeof rawTitle === 'string' ? rawTitle.replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim() : rawTitle;
    console.log(`[POST /worksheets] title=${title} subject=${subject} yearGroup=${yearGroup} sections=${Array.isArray(sections) ? sections.length : 'none'}`);
    const id = uuidv4();
    const n = (v: any) => (v === undefined || v === null ? null : v);
    await db.prepare(`INSERT INTO worksheets (id, school_id, created_by, title, subject, topic, year_group, send_need, difficulty, exam_board, content, teacher_content, overlay)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, n(req.user!.schoolId), n(req.user!.id), n(title), n(subject), n(topic), n(yearGroup), n(sendNeed), n(difficulty), n(examBoard), n(content), n(teacherContent), n(overlay)
    );
    console.log(`[POST /worksheets] worksheet inserted id=${id}`);
    // Save sections if provided
    if (Array.isArray(sections)) {
      for (let idx = 0; idx < sections.length; idx++) {

        const s = sections[idx];
        // Strip rogue markdown bold markers from section titles and content
        const sTitle = typeof s.title === 'string' ? s.title.replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim() : (s.title || null);
        // Strip standalone asterisks (rogue bold markers) from content lines
        const rawContent = s.content || null;
        const sContent = typeof rawContent === 'string'
          ? rawContent.split('\n').map((line: string) => line.replace(/^\*{1,2}\s*|\s*\*{1,2}$/g, '').replace(/\*\*(.+?)\*\*/g, '$1')).join('\n')
          : rawContent;
        await db.prepare(`INSERT INTO worksheet_sections (id, worksheet_id, section_index, title, type, content, teacher_only, svg, caption, symbols)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          uuidv4(), id, idx, sTitle, s.type || null, sContent,
          s.teacherOnly ? 1 : 0, s.svg || null, s.caption || null,
          s.symbols ? JSON.stringify(s.symbols) : null
        );
      }
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

router.put("/worksheets/:id", requireAuth, async (req: Request, res: Response) => {
  const { rating, ratingLabel, overlay, content, teacherContent, sections } = req.body;
  // Use COALESCE for all fields so partial updates (e.g. rating-only) don't wipe other fields
  await db.prepare("UPDATE worksheets SET rating=COALESCE(?, rating), rating_label=COALESCE(?, rating_label), overlay=COALESCE(?, overlay), content=COALESCE(?, content), teacher_content=COALESCE(?, teacher_content) WHERE id=? AND created_by=?")
    .run(rating ?? null, ratingLabel ?? null, overlay ?? null, content ?? null, teacherContent ?? null, req.params.id, req.user!.id);
  // Update sections if provided
  if (Array.isArray(sections)) {
    await db.prepare("DELETE FROM worksheet_sections WHERE worksheet_id=?").run(req.params.id);
    for (let idx = 0; idx < sections.length; idx++) {

      const s = sections[idx];
      await db.prepare(`INSERT INTO worksheet_sections (id, worksheet_id, section_index, title, type, content, teacher_only, svg, caption, symbols) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(uuidv4(), req.params.id, idx, s.title || null, s.type || null, s.content || null, s.teacherOnly ? 1 : 0, s.svg || null, s.caption || null, s.symbols ? JSON.stringify(s.symbols) : null);
    }
  }
  res.json({ message: "Updated" });
});

router.delete("/worksheets/:id", requireAuth, async (req: Request, res: Response) => {
  await db.prepare("DELETE FROM worksheets WHERE id=? AND created_by=?").run(req.params.id, req.user!.id);
  res.json({ message: "Deleted" });
});

// ── Stories ───────────────────────────────────────────────────────────────────
router.get("/stories", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.prepare("SELECT * FROM stories WHERE created_by = ? ORDER BY created_at DESC").all(req.user!.id);
  res.json(rows.map((r: any) => ({
    ...r,
    characters: JSON.parse(r.characters || "[]"),
    comprehensionQuestions: JSON.parse(r.comprehension_questions || "[]"),
  })));
});

router.post("/stories", requireAuth, async (req: Request, res: Response) => {
  const { title, genre, yearGroup, sendNeed, characters, setting, theme, readingLevel, length, content, comprehensionQuestions } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const id = uuidv4();
  const n2 = (v: any) => (v === undefined || v === null ? null : v);
  await db.prepare(`INSERT INTO stories (id, school_id, created_by, title, genre, year_group, send_need, characters, setting, theme, reading_level, length, content, comprehension_questions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, n2(req.user!.schoolId), n2(req.user!.id), n2(title), n2(genre), n2(yearGroup), n2(sendNeed),
    JSON.stringify(characters || []), n2(setting), n2(theme), n2(readingLevel), n2(length), n2(content),
    JSON.stringify(comprehensionQuestions || [])
  );
  res.status(201).json({ id });
});

// ── Differentiations ──────────────────────────────────────────────────────────
router.get("/differentiations", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.prepare("SELECT * FROM differentiations WHERE created_by = ? ORDER BY created_at DESC").all(req.user!.id);
  res.json(rows);
});

router.post("/differentiations", requireAuth, async (req: Request, res: Response) => {
  const { taskContent, differentiatedContent, sendNeed, yearGroup, subject } = req.body;
  const id = uuidv4();
  const n3 = (v: any) => (v === undefined || v === null ? null : v);
  await db.prepare(`INSERT INTO differentiations (id, school_id, created_by, task_content, differentiated_content, send_need, year_group, subject)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, n3(req.user!.schoolId), n3(req.user!.id), n3(taskContent), n3(differentiatedContent), n3(sendNeed), n3(yearGroup), n3(subject)
  );
  res.status(201).json({ id });
});

// ── Ideas ─────────────────────────────────────────────────────────────────────
router.get("/ideas", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.prepare(
    `SELECT i.*, u.display_name as author_name FROM ideas i
     LEFT JOIN users u ON i.author_id = u.id
     WHERE i.school_id = ? ORDER BY i.votes DESC, i.created_at DESC`
  ).all(req.user!.schoolId);
  res.json(rows);
});

router.post("/ideas", requireAuth, async (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const id = uuidv4();
  await db.prepare("INSERT INTO ideas (id, school_id, author_id, title, description) VALUES (?, ?, ?, ?, ?)") 
    .run(id, req.user!.schoolId ?? null, req.user!.id ?? null, title, description ?? null);
  res.status(201).json({ id });
});

router.post("/ideas/:id/vote", requireAuth, async (req: Request, res: Response) => {
  await db.prepare("UPDATE ideas SET votes = votes + 1 WHERE id = ? AND school_id = ?")
    .run(req.params.id, req.user!.schoolId);
  res.json({ message: "Voted" });
});

// ── Cookie Consent ────────────────────────────────────────────────────────────
router.post("/cookie-consent", async (req: Request, res: Response) => {
  const { analytics, marketing, userId } = req.body;
  await db.prepare("INSERT INTO cookie_consents (id, user_id, ip_address, analytics, marketing) VALUES (?, ?, ?, ?, ?)") 
    .run(uuidv4(), userId || null, req.ip ?? null, analytics ? 1 : 0, marketing ? 1 : 0);
  res.json({ message: "Consent recorded" });
});

// ── Onboarding complete ───────────────────────────────────────────────────────
router.post("/onboarding-complete", requireAuth, async (req: Request, res: Response) => {
  await db.prepare("UPDATE users SET onboarding_done = 1 WHERE id = ?").run(req.user!.id);
  auditLog(req.user!.id, req.user!.schoolId, "user.onboarding_completed", "user", req.user!.id, {}, req.ip);
  res.json({ message: "Onboarding marked complete" });
});

// ── Admin: all worksheets across school ──────────────────────────────────────
router.get("/admin/worksheets", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.prepare(
    `SELECT w.*, u.display_name as author_name FROM worksheets w
     LEFT JOIN users u ON w.created_by = u.id
     WHERE w.school_id = ? ORDER BY w.created_at DESC LIMIT 500`
  ).all(req.user!.schoolId);
  res.json(rows);
});

// ── Analytics summary ─────────────────────────────────────────────────────────
router.get("/analytics", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const pupils = (await db.prepare("SELECT COUNT(*) as c FROM pupils WHERE school_id=? AND is_active=1").get(schoolId) as any).c;
  const worksheets = (await db.prepare("SELECT COUNT(*) as c FROM worksheets WHERE school_id=?").get(schoolId) as any).c;
  const stories = (await db.prepare("SELECT COUNT(*) as c FROM stories WHERE school_id=?").get(schoolId) as any).c;
  const users = (await db.prepare("SELECT COUNT(*) as c FROM users WHERE school_id=? AND is_active=1").get(schoolId) as any).c;
  const incidents = (await db.prepare("SELECT COUNT(*) as c FROM safeguarding_incidents WHERE school_id=? AND status='open'").get(schoolId) as any).c;
  res.json({ pupils, worksheets, stories, users, openIncidents: incidents });
});

// ── Behaviour Records ────────────────────────────────────────────────────────
router.get("/behaviour", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const pupilId = req.query.pupilId as string | undefined;
  let rows;
  if (pupilId) {
    rows = await db.prepare(
      `SELECT br.*, p.name as pupil_name, u.display_name as recorded_by_name
       FROM behaviour_records br
       LEFT JOIN pupils p ON br.pupil_id = p.id
       LEFT JOIN users u ON br.recorded_by = u.id
       WHERE br.school_id = ? AND br.pupil_id = ?
       ORDER BY br.date DESC, br.created_at DESC LIMIT 200`
    ).all(schoolId, pupilId);
  } else {
    rows = await db.prepare(
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

router.post("/behaviour", requireAuth, async (req: Request, res: Response) => {
  const { pupilId, type, category, description, actionTaken, date } = req.body;
  if (!pupilId || !type || !date) return res.status(400).json({ error: "pupilId, type, date required" });
  const id = `br_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.prepare(
    `INSERT INTO behaviour_records (id, school_id, pupil_id, recorded_by, type, category, description, action_taken, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`
  ).run(id, req.user!.schoolId, pupilId, req.user!.id, type, category || null, description || null, actionTaken || null, date);
  auditLog(req.user!.id, req.user!.schoolId, "behaviour.created", "behaviour_record", id, { pupilId, type }, req.ip);
  // Send parent notification email if parent_email is set on the pupil
  try {
    const pupil = await db.prepare("SELECT name, parent_email, parent_name FROM pupils WHERE id=? AND school_id=?").get(pupilId, req.user!.schoolId) as any;
    const school = await db.prepare("SELECT name FROM schools WHERE id=?").get(req.user!.schoolId) as any;
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

router.delete("/behaviour/:id", requireAuth, async (req: Request, res: Response) => {
  const record = await db.prepare("SELECT * FROM behaviour_records WHERE id=? AND school_id=?").get(req.params.id, req.user!.schoolId);
  if (!record) return res.status(404).json({ error: "Not found" });
  await db.prepare("DELETE FROM behaviour_records WHERE id=?").run(req.params.id);
  res.json({ message: "Deleted" });
});

// ── Parent Portal: support plans for a pupil ───────────────────────────
router.get("/parent/support-plans/:pupilId", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const { pupilId } = req.params;
  const pupil = await db.prepare("SELECT * FROM pupils WHERE id=? AND school_id=?").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const plans = await db.prepare(
    `SELECT id, title, summary, strategies, positive_targets as positiveTargets, status, review_date as reviewDate, created_at
     FROM behaviour_support_plans
     WHERE pupil_id = ? AND school_id = ? AND shared_with_parents = 1
     ORDER BY created_at DESC`
  ).all(pupilId, schoolId);
  res.json(plans);
});

// ── Parent Portal: behaviour records for a pupil ───────────────────────────
router.get("/parent/behaviour/:pupilId", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const { pupilId } = req.params;
  const pupil = await db.prepare("SELECT * FROM pupils WHERE id=? AND school_id=?").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const rows = await db.prepare(
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
router.get("/preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    const row = await db.prepare("SELECT preferences FROM users WHERE id = ?").get(req.user!.id) as any;
    const prefs = row?.preferences ? JSON.parse(row.preferences) : {};
    res.json(prefs);
  } catch {
    res.json({});
  }
});

router.put("/preferences", requireAuth, async (req: Request, res: Response) => {
  const prefs = req.body;
  if (!prefs || typeof prefs !== "object") return res.status(400).json({ error: "Invalid preferences" });
  try {
    await db.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(
      JSON.stringify(prefs),
      req.user!.id
    );
    res.json({ ok: true });
  } catch (err: any) {
    // Column may not exist yet — run migration then retry
    try {
      await db.prepare("ALTER TABLE users ADD COLUMN preferences TEXT").run();
      await db.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(
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

// ── Teacher-to-Parent Direct Messaging ──────────────────────────────────────
router.post("/parent-message", requireAuth, async (req: Request, res: Response) => {
  const { pupilId, subject, message } = req.body;
  if (!pupilId || !subject || !message) {
    return res.status(400).json({ error: "pupilId, subject, and message are required" });
  }
  try {
    const pupil = await db.prepare("SELECT name, parent_email, parent_name FROM pupils WHERE id=? AND school_id=?").get(pupilId, req.user!.schoolId) as any;
    if (!pupil) return res.status(404).json({ error: "Pupil not found" });
    if (!pupil.parent_email) return res.status(400).json({ error: "No parent email on record for this pupil. Please add one in the Pupils section." });
    const school = await db.prepare("SELECT name FROM schools WHERE id=?").get(req.user!.schoolId) as any;
    await sendDirectParentMessage(pupil.parent_email, {
      parentName: pupil.parent_name || "Parent/Carer",
      pupilName: pupil.name,
      teacherName: req.user!.displayName || "Your child's teacher",
      schoolName: school?.name || "School",
      subject,
      message,
    });
    auditLog(req.user!.id, req.user!.schoolId, "parent_message.sent", "pupil", pupilId, { subject }, req.ip);
    res.json({ ok: true, message: "Message sent to parent successfully" });
  } catch (err: any) {
    console.error("[parent-message] error:", err?.message);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

// ── Admin Usage Analytics (weekly breakdown) ──────────────────────────────────
router.get("/admin-analytics", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });

  // Weekly usage for last 8 weeks
  const weekly: Record<string, { worksheets: number; stories: number; diffs: number; users: Set<string> }> = {};
  const getWeekKey = (dateStr: string) => {
    const d = new Date(dateStr);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return monday.toISOString().substring(0, 10);
  };

  const ws = await db.prepare("SELECT created_by, created_at FROM worksheets WHERE school_id = ? AND created_at > NOW()").all(schoolId) as any[];
  const st = await db.prepare("SELECT created_by, created_at FROM stories WHERE school_id = ? AND created_at > NOW()").all(schoolId) as any[];
  const df = await db.prepare("SELECT created_by, created_at FROM differentiations WHERE school_id = ? AND created_at > NOW()").all(schoolId) as any[];

  [...ws.map(r => ({ ...r, type: "worksheet" })), ...st.map(r => ({ ...r, type: "story" })), ...df.map(r => ({ ...r, type: "diff" }))].forEach(r => {
    const wk = getWeekKey(r.created_at);
    if (!weekly[wk]) weekly[wk] = { worksheets: 0, stories: 0, diffs: 0, users: new Set() };
    if (r.type === "worksheet") weekly[wk].worksheets++;
    else if (r.type === "story") weekly[wk].stories++;
    else weekly[wk].diffs++;
    if (r.created_by) weekly[wk].users.add(r.created_by);
  });

  const weeklyArray = Object.entries(weekly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({ week, worksheets: data.worksheets, stories: data.stories, diffs: data.diffs, activeUsers: data.users.size }));

  // Tool usage breakdown
  const toolUsage = [
    { tool: "Worksheets", count: (await db.prepare("SELECT COUNT(*) as c FROM worksheets WHERE school_id=?").get(schoolId) as any).c },
    { tool: "Stories", count: (await db.prepare("SELECT COUNT(*) as c FROM stories WHERE school_id=?").get(schoolId) as any).c },
    { tool: "Differentiations", count: (await db.prepare("SELECT COUNT(*) as c FROM differentiations WHERE school_id=?").get(schoolId) as any).c },
    { tool: "Assignments", count: (await db.prepare("SELECT COUNT(*) as c FROM assignments WHERE pupil_id IN (SELECT id FROM pupils WHERE school_id=?)").get(schoolId) as any).c },
  ];

  // Most active staff
  const activeStaff = await db.prepare(`
    SELECT u.display_name, u.role,
      (SELECT COUNT(*) FROM worksheets WHERE created_by = u.id) as worksheets,
      (SELECT COUNT(*) FROM stories WHERE created_by = u.id) as stories,
      u.last_login_at
    FROM users u WHERE u.school_id = ? AND u.is_active = 1
    ORDER BY worksheets + stories DESC LIMIT 10
  `).all(schoolId);

  res.json({ weekly: weeklyArray, toolUsage, activeStaff });
});

// ── Audit Trail (school admin view) ──────────────────────────────────────────
router.get("/audit-trail", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const role = req.user!.role;
  if (!["school_admin", "mat_admin", "senco"].includes(role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  const logs = await db.prepare(`
    SELECT al.*, u.display_name as user_name, u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.school_id = ? ORDER BY al.created_at DESC LIMIT 200
  `).all(schoolId);
  res.json({ logs });
});

// ── Parent messaging (parent → teacher) ──────────────────────────────────────
router.post("/parent-reply", async (req: Request, res: Response) => {
  // Public endpoint — authenticated by pupil access code
  const { accessCode, message, parentName } = req.body;
  if (!accessCode || !message?.trim()) {
    return res.status(400).json({ error: "Access code and message are required" });
  }
  const pupil = await db.prepare("SELECT * FROM pupils WHERE code = ? AND is_active = 1").get(accessCode) as any;
  if (!pupil) return res.status(404).json({ error: "Invalid access code" });

  const id = (await import("uuid")).v4();
  // Store as a pupil comment of type 'parent_message'
  await db.prepare(`INSERT INTO pupil_comments (id, school_id, pupil_id, recorded_by, type, category, content, date)
    VALUES (?, ?, ?, NULL, 'parent_message', 'Parent Message', ?, date('now'))`)
    .run(id, pupil.school_id, pupil.id, `From ${parentName || "Parent"}: ${message.trim()}`);

  res.json({ success: true, message: "Message sent to school" });
});

router.get("/parent-messages/:pupilId", requireAuth, async (req: Request, res: Response) => {
  const messages = await db.prepare(`
    SELECT * FROM pupil_comments
    WHERE pupil_id = ? AND type = 'parent_message' ORDER BY created_at DESC LIMIT 50
  `).all(req.params.pupilId);
  res.json({ messages });
});

// ── Platform Stats (for landing page) ───────────────────────────────────────
// GET /api/data/stats — returns real teacher/worksheet counts with +266 offset
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const teacherCount = (await db.prepare("SELECT COUNT(*) as c FROM users WHERE is_active = 1").get() as any)?.c || 0;
    const worksheetCount = (await db.prepare("SELECT COUNT(*) as c FROM worksheets").get() as any)?.c || 0;
    const schoolCount = (await db.prepare("SELECT COUNT(*) as c FROM schools").get() as any)?.c || 0;
    const TEACHER_OFFSET = 266;
    const WORKSHEET_OFFSET = 266;
    res.json({
      teachers: teacherCount + TEACHER_OFFSET,
      worksheets: worksheetCount + WORKSHEET_OFFSET,
      schools: schoolCount,
    });
  } catch {
    res.json({ teachers: 266, worksheets: 266, schools: 1 });
  }
});

// ── Worksheet Folders ─────────────────────────────────────────────────────────
// GET /api/data/folders — list folders for current user's school
router.get("/folders", requireAuth, async (req: Request, res: Response) => {
  const folders = await db.prepare(
    "SELECT * FROM worksheet_folders WHERE school_id = ? ORDER BY name ASC"
  ).all(req.user!.schoolId) as any[];
  res.json(folders.map(f => ({ id: f.id, name: f.name, colour: f.colour, createdAt: f.created_at })));
});

// POST /api/data/folders — create a folder
router.post("/folders", requireAuth, async (req: Request, res: Response) => {
  const { name, colour } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Folder name required" });
  const id = uuidv4();
  await db.prepare(
    "INSERT INTO worksheet_folders (id, school_id, created_by, name, colour) VALUES (?, ?, ?, ?, ?)"
  ).run(id, req.user!.schoolId, req.user!.id, name.trim(), colour || "#6366f1");
  res.status(201).json({ id, name: name.trim(), colour: colour || "#6366f1" });
});

// DELETE /api/data/folders/:id — delete a folder
router.delete("/folders/:id", requireAuth, async (req: Request, res: Response) => {
  await db.prepare("DELETE FROM worksheet_folders WHERE id = ? AND school_id = ?").run(req.params.id, req.user!.schoolId);
  res.json({ success: true });
});

// POST /api/data/folders/:id/items — add a worksheet to a folder
router.post("/folders/:id/items", requireAuth, async (req: Request, res: Response) => {
  const { worksheetId } = req.body;
  if (!worksheetId) return res.status(400).json({ error: "worksheetId required" });
  try {
    await db.prepare("INSERT INTO worksheet_folder_items (folder_id, worksheet_id) VALUES (?, ?)").run(req.params.id, worksheetId);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "Could not add to folder" });
  }
});

// DELETE /api/data/folders/:id/items/:worksheetId — remove from folder
router.delete("/folders/:id/items/:worksheetId", requireAuth, async (req: Request, res: Response) => {
  await db.prepare("DELETE FROM worksheet_folder_items WHERE folder_id = ? AND worksheet_id = ?").run(req.params.id, req.params.worksheetId);
  res.json({ success: true });
});

// GET /api/data/folders/:id/items — list worksheets in a folder
router.get("/folders/:id/items", requireAuth, async (req: Request, res: Response) => {
  const items = await db.prepare(`
    SELECT w.* FROM worksheets w
    JOIN worksheet_folder_items fi ON fi.worksheet_id = w.id
    WHERE fi.folder_id = ?
    ORDER BY fi.added_at DESC
  `).all(req.params.id) as any[];
  res.json(items);
});

export default router;


// ── Worksheet Share Links ─────────────────────────────────────────────────────
// POST /api/data/worksheets/:id/share — create a public share link
router.post("/worksheets/:id/share", requireAuth, async (req: Request, res: Response) => {
  const wsId = req.params.id;
  const ws = await db.prepare("SELECT * FROM worksheets WHERE id=? AND created_by=?").get(wsId, req.user!.id) as any;
  if (!ws) return res.status(404).json({ error: "Worksheet not found" });

  // Return existing token if already shared
  const existing = await db.prepare("SELECT share_token FROM worksheet_share_links WHERE worksheet_id=?").get(wsId) as any;
  if (existing?.share_token) return res.json({ token: existing.share_token });

  const token = require("crypto").randomBytes(16).toString("hex");
  await db.prepare(
    "INSERT INTO worksheet_share_links (id, worksheet_id, share_token, created_by, school_id) VALUES (?,?,?,?,?)"
  ).run(uuidv4(), wsId, token, req.user!.id, req.user!.schoolId);
  res.json({ token });
});

// DELETE /api/data/worksheets/:id/share — revoke share link
router.delete("/worksheets/:id/share", requireAuth, async (req: Request, res: Response) => {
  await db.prepare("DELETE FROM worksheet_share_links WHERE worksheet_id=? AND created_by=?").run(req.params.id, req.user!.id);
  res.json({ success: true });
});

// GET /api/data/shared/:token — public endpoint, no auth required
router.get("/shared/:token", async (req: Request, res: Response) => {
  const link = await db.prepare(
    "SELECT wsl.worksheet_id, wsl.view_count FROM worksheet_share_links wsl WHERE wsl.share_token=?"
  ).get(req.params.token) as any;
  if (!link) return res.status(404).json({ error: "Link not found or expired" });

  const ws = await db.prepare("SELECT * FROM worksheets WHERE id=?").get(link.worksheet_id) as any;
  if (!ws) return res.status(404).json({ error: "Worksheet not found" });

  // Fetch sections
  const sections = await db.prepare(
    "SELECT * FROM worksheet_sections WHERE worksheet_id=? ORDER BY section_index ASC"
  ).all(link.worksheet_id) as any[];

  // Increment view count
  await db.prepare("UPDATE worksheet_share_links SET view_count=view_count+1 WHERE share_token=?").run(req.params.token);

  res.json({
    title: ws.title,
    subject: ws.subject,
    topic: ws.topic,
    yearGroup: ws.year_group,
    difficulty: ws.difficulty,
    sections: sections.map((s: any) => ({
      title: s.title,
      type: s.type,
      content: s.content,
      teacherOnly: s.teacher_only === 1,
      svg: s.svg,
      caption: s.caption,
    })).filter((s: any) => !s.teacherOnly), // public view: hide teacher sections
    metadata: {
      subject: ws.subject,
      topic: ws.topic,
      yearGroup: ws.year_group,
      difficulty: ws.difficulty,
      examBoard: ws.exam_board,
    },
  });
});

// ── Spaced Repetition ─────────────────────────────────────────────────────────
// GET /api/data/spaced-repetition — get topics due for review today
router.get("/spaced-repetition", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const today = new Date().toISOString().slice(0, 10);
  const due = await db.prepare(
    "SELECT * FROM spaced_repetition WHERE user_id=? AND next_review<=? ORDER BY next_review ASC LIMIT 20"
  ).all(userId, today) as any[];
  const all = await db.prepare(
    "SELECT * FROM spaced_repetition WHERE user_id=? ORDER BY next_review ASC"
  ).all(userId) as any[];
  res.json({ due, all, totalTracked: all.length });
});

// POST /api/data/spaced-repetition — record a review result (SM-2 algorithm)
router.post("/spaced-repetition", requireAuth, async (req: Request, res: Response) => {
  const { subject, topic, score } = req.body; // score: 0-5
  if (!subject || !topic || score === undefined) return res.status(400).json({ error: "subject, topic, score required" });

  const userId = req.user!.id;
  const existing = await db.prepare(
    "SELECT * FROM spaced_repetition WHERE user_id=? AND subject=? AND topic=?"
  ).get(userId, subject, topic) as any;

  // SM-2 algorithm
  let intervalDays = 1;
  let easeFactor = 2.5;
  let reviews = 1;

  if (existing) {
    easeFactor = existing.ease_factor;
    reviews = existing.reviews + 1;
    if (score >= 3) {
      if (existing.reviews === 0) intervalDays = 1;
      else if (existing.reviews === 1) intervalDays = 6;
      else intervalDays = Math.round(existing.interval_days * easeFactor);
      easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    } else {
      intervalDays = 1; // failed — reset
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);
  const nextReviewStr = nextReview.toISOString().slice(0, 10);

  if (existing) {
    await db.prepare(
      "UPDATE spaced_repetition SET interval_days=?, ease_factor=?, reviews=?, last_score=?, next_review=?, updated_at=NOW() WHERE user_id=? AND subject=? AND topic=?"
    ).run(intervalDays, easeFactor, reviews, score, nextReviewStr, userId, subject, topic);
  } else {
    await db.prepare(
      "INSERT INTO spaced_repetition (id, user_id, subject, topic, interval_days, ease_factor, reviews, last_score, next_review) VALUES (?,?,?,?,?,?,?,?,?)"
    ).run(uuidv4(), userId, subject, topic, intervalDays, easeFactor, reviews, score, nextReviewStr);
  }

  res.json({ intervalDays, nextReview: nextReviewStr, easeFactor });
});
