import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, requireMinRole, auditLog } from "../middleware/auth.js";
import { sendDSLIncidentAlert } from "../email/index.js";

const router = Router();

// ── List Pupils (with assignments, attendance, behaviour) ────────────────────
router.get("/", requireAuth, (req: Request, res: Response) => {
  const pupils = db.prepare(
    "SELECT * FROM pupils WHERE school_id = ? AND is_active = 1 ORDER BY name"
  ).all(req.user!.schoolId) as any[];

  const enriched = pupils.map(p => {
    const assignments = db.prepare("SELECT * FROM assignments WHERE pupil_id = ? ORDER BY assigned_at DESC").all(p.id);
    const attendance = db.prepare("SELECT * FROM attendance_records WHERE pupil_id = ? ORDER BY date DESC").all(p.id);
    const behaviour = db.prepare("SELECT * FROM behaviour_records WHERE pupil_id = ? ORDER BY date DESC LIMIT 100").all(p.id);
    return { ...p, assignments, attendance, behaviour };
  });

  res.json(enriched);
});

// ── Get Single Pupil ──────────────────────────────────────────────────────────
router.get("/:id", requireAuth, (req: Request, res: Response) => {
  const pupil = db.prepare("SELECT * FROM pupils WHERE id = ? AND school_id = ?")
    .get(req.params.id, req.user!.schoolId) as any;
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  const auditTrail = db.prepare(
    `SELECT pa.*, u.display_name FROM pupil_audit pa
     LEFT JOIN users u ON pa.changed_by = u.id
     WHERE pa.pupil_id = ? ORDER BY pa.changed_at DESC LIMIT 50`
  ).all(pupil.id);

  const assignments = db.prepare("SELECT * FROM assignments WHERE pupil_id = ? ORDER BY assigned_at DESC").all(pupil.id);
  const attendance = db.prepare("SELECT * FROM attendance_records WHERE pupil_id = ? ORDER BY date DESC LIMIT 30").all(pupil.id);
  const behaviour = db.prepare("SELECT * FROM behaviour_records WHERE pupil_id = ? ORDER BY date DESC LIMIT 30").all(pupil.id);

  res.json({ ...pupil, auditTrail, assignments, attendance, behaviour });
});

// ── Create Pupil ──────────────────────────────────────────────────────────────
router.post("/", requireAuth, (req: Request, res: Response) => {
  const { name, yearGroup, sendNeed, upn, dob } = req.body;
  if (!name) return res.status(400).json({ error: "Pupil name required" });

  const id = uuidv4();
  const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();

  db.prepare(`INSERT INTO pupils (id, school_id, name, year_group, send_need, code, upn, dob, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user!.schoolId, name, yearGroup || null, sendNeed || null,
    code, upn || null, dob || null, req.user!.id
  );

  auditLog(req.user!.id, req.user!.schoolId ?? null, "pupil.created", "pupil", id, { name }, req.ip ?? undefined);
  res.status(201).json({ id, code });
});

// ── Update Pupil (with audit trail) ──────────────────────────────────────────
router.put("/:id", requireAuth, (req: Request, res: Response) => {
  const pupil = db.prepare("SELECT * FROM pupils WHERE id = ? AND school_id = ?")
    .get(req.params.id, req.user!.schoolId) as any;
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  const fields = ["name", "year_group", "send_need", "upn", "dob"] as const;
  const fieldMap: Record<string, string> = {
    name: "name", yearGroup: "year_group", sendNeed: "send_need", upn: "upn", dob: "dob"
  };

  // Record audit trail for each changed field
  for (const [reqField, dbField] of Object.entries(fieldMap)) {
    if (req.body[reqField] !== undefined && req.body[reqField] !== pupil[dbField]) {
      db.prepare(`INSERT INTO pupil_audit (id, pupil_id, changed_by, field_name, old_value, new_value)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        uuidv4(), pupil.id, req.user!.id, reqField,
        pupil[dbField] || null, req.body[reqField] || null
      );
    }
  }

  db.prepare(`UPDATE pupils SET name=?, year_group=?, send_need=?, upn=?, dob=?, parent_email=?, parent_name=?, updated_at=datetime('now') WHERE id=?`)
    .run(
      req.body.name || pupil.name,
      req.body.yearGroup ?? pupil.year_group,
      req.body.sendNeed ?? pupil.send_need,
      req.body.upn ?? pupil.upn,
      req.body.dob ?? pupil.dob,
      req.body.parentEmail !== undefined ? (req.body.parentEmail || null) : (pupil.parent_email ?? null),
      req.body.parentName !== undefined ? (req.body.parentName || null) : (pupil.parent_name ?? null),
      pupil.id
    );

  auditLog(req.user!.id, req.user!.schoolId ?? null, "pupil.updated", "pupil", pupil.id, req.body, req.ip ?? undefined);
  res.json({ message: "Pupil updated" });
});

// ── Archive Pupil ─────────────────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireMinRole("teacher"), (req: Request, res: Response) => {
  db.prepare("UPDATE pupils SET is_active = 0 WHERE id = ? AND school_id = ?")
    .run(req.params.id, req.user!.schoolId);
  auditLog(req.user!.id, req.user!.schoolId ?? null, "pupil.archived", "pupil", req.params.id, {}, req.ip ?? undefined);
  res.json({ message: "Pupil archived" });
});

// ── Bulk Import (CSV) ─────────────────────────────────────────────────────────
router.post("/bulk-import", requireAuth, requireMinRole("school_admin"), (req: Request, res: Response) => {
  const { pupils } = req.body as { pupils: Array<{ name: string; yearGroup?: string; sendNeed?: string; upn?: string }> };
  if (!Array.isArray(pupils) || pupils.length === 0) {
    return res.status(400).json({ error: "No pupils provided" });
  }

  const insert = db.prepare(`INSERT OR IGNORE INTO pupils (id, school_id, name, year_group, send_need, code, upn, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  let count = 0;
  for (const p of pupils) {
    if (!p.name) continue;
    const id = uuidv4();
    const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();
    insert.run(id, req.user!.schoolId, p.name, p.yearGroup || null, p.sendNeed || null, code, p.upn || null, req.user!.id);
    count++;
  }
  auditLog(req.user!.id, req.user!.schoolId ?? null, "pupils.bulk_imported", "school", req.user!.schoolId ?? undefined, { count }, req.ip ?? undefined);
  res.json({ message: `${count} pupils imported` });
});

// ── Safeguarding Incidents ────────────────────────────────────────────────────
router.get("/safeguarding/incidents", requireAuth, requireMinRole("senco"), (req: Request, res: Response) => {
  const incidents = db.prepare(
    `SELECT si.*, p.name as pupil_name, u.display_name as reported_by_name
     FROM safeguarding_incidents si
     LEFT JOIN pupils p ON si.pupil_id = p.id
     LEFT JOIN users u ON si.reported_by = u.id
     WHERE si.school_id = ? ORDER BY si.created_at DESC`
  ).all(req.user!.schoolId);
  res.json(incidents);
});

router.post("/safeguarding/incidents", requireAuth, async (req: Request, res: Response) => {
  const { pupilId, description, aiTrigger, severity = "medium" } = req.body;
  if (!description) return res.status(400).json({ error: "Description required" });

  const id = uuidv4();
  db.prepare(`INSERT INTO safeguarding_incidents (id, school_id, pupil_id, reported_by, description, ai_trigger, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user!.schoolId, pupilId || null, req.user!.id, description, aiTrigger || null, severity
  );

  // Notify DSL
  const school = db.prepare("SELECT * FROM schools WHERE id = ?").get(req.user!.schoolId) as any;
  if (school?.dsl_email) {
    const pupil = pupilId ? db.prepare("SELECT name FROM pupils WHERE id = ?").get(pupilId) as any : null;
    db.prepare("UPDATE safeguarding_incidents SET dsl_notified = 1, dsl_notified_at = datetime('now') WHERE id = ?").run(id);
    sendDSLIncidentAlert(school.dsl_email, {
      id, severity, description,
      reportedBy: req.user!.displayName,
      pupilName: pupil?.name,
    }).catch(console.error);
  }

  auditLog(req.user!.id, req.user!.schoolId ?? null, "safeguarding.incident_reported", "incident", id, { severity }, req.ip ?? undefined);
  res.status(201).json({ id, message: "Incident reported" });
});

router.put("/safeguarding/incidents/:id", requireAuth, requireMinRole("senco"), (req: Request, res: Response) => {
  const { status, notes } = req.body;
  db.prepare(`UPDATE safeguarding_incidents SET status=?, notes=?, reviewed_by=?, reviewed_at=datetime('now') WHERE id=? AND school_id=?`)
    .run(status, notes, req.user!.id, req.params.id, req.user!.schoolId);
  auditLog(req.user!.id, req.user!.schoolId ?? null, "safeguarding.incident_updated", "incident", req.params.id, { status }, req.ip ?? undefined);
  res.json({ message: "Incident updated" });
});

// ── Assignments ──────────────────────────────────────────────────────────────
router.post("/:id/assignments", requireAuth, (req: Request, res: Response) => {
  const pupil = db.prepare("SELECT id FROM pupils WHERE id = ? AND school_id = ?").get(req.params.id, req.user!.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const { title, type, content } = req.body;
  if (!title || !type) return res.status(400).json({ error: "title and type required" });
  const id = uuidv4();
  db.prepare(`INSERT INTO assignments (id, pupil_id, assigned_by, title, type, content, status)
    VALUES (?, ?, ?, ?, ?, ?, 'not-started')`).run(id, req.params.id, req.user!.id, title, type, content || null);
  auditLog(req.user!.id, req.user!.schoolId ?? null, "assignment.created", "assignment", id, { title, type }, req.ip ?? undefined);
  res.status(201).json({ id });
});

router.put("/:id/assignments/:assignmentId", requireAuth, (req: Request, res: Response) => {
  const { status, feedback, mark, progress, teacherComment } = req.body;
  db.prepare(`UPDATE assignments SET
    status=COALESCE(?,status), feedback=COALESCE(?,feedback),
    mark=COALESCE(?,mark), progress=COALESCE(?,progress),
    teacher_comment=COALESCE(?,teacher_comment)
    WHERE id=? AND pupil_id=?`)
    .run(status ?? null, feedback ?? null, mark ?? null, progress ?? null, teacherComment ?? null, req.params.assignmentId, req.params.id);
  res.json({ message: "Assignment updated" });
});

router.delete("/:id/assignments/:assignmentId", requireAuth, (req: Request, res: Response) => {
  const pupil = db.prepare("SELECT id FROM pupils WHERE id = ? AND school_id = ?").get(req.params.id, req.user!.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  db.prepare("DELETE FROM assignments WHERE id = ? AND pupil_id = ?").run(req.params.assignmentId, req.params.id);
  auditLog(req.user!.id, req.user!.schoolId ?? null, "assignment.deleted", "assignment", req.params.assignmentId, {}, req.ip ?? undefined);
  res.json({ ok: true });
});

// ── Attendance ────────────────────────────────────────────────────────────────
router.post("/:id/attendance", requireAuth, (req: Request, res: Response) => {
  const { date, amStatus, amReason, pmStatus, pmReason, notes } = req.body;
  const pupilId = req.params.id;

  db.prepare(`INSERT INTO attendance_records (id, school_id, pupil_id, recorded_by, date, am_status, am_reason, pm_status, pm_reason, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(pupil_id, date) DO UPDATE SET
      am_status=excluded.am_status, am_reason=excluded.am_reason,
      pm_status=excluded.pm_status, pm_reason=excluded.pm_reason,
      notes=excluded.notes, recorded_by=excluded.recorded_by, recorded_at=datetime('now')`).run(
    uuidv4(), req.user!.schoolId, pupilId, req.user!.id,
    date, amStatus, amReason || null, pmStatus, pmReason || null, notes || null
  );

  res.json({ message: "Attendance recorded" });
});

// ── Behaviour ─────────────────────────────────────────────────────────────────
router.post("/:id/behaviour", requireAuth, (req: Request, res: Response) => {
  const { type, category, description, actionTaken, date } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO behaviour_records (id, school_id, pupil_id, recorded_by, type, category, description, action_taken, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.user!.schoolId, req.params.id, req.user!.id,
    type, category || null, description, actionTaken || null, date
  );
  auditLog(req.user!.id, req.user!.schoolId ?? null, "behaviour.recorded", "behaviour", id, { type }, req.ip ?? undefined);
  res.status(201).json({ id });
});

// ── Behaviour Support Plans ──────────────────────────────────────────────────
router.get("/:id/support-plans", requireAuth, (req: Request, res: Response) => {
  const pupil = db.prepare("SELECT id FROM pupils WHERE id=? AND school_id=?").get(req.params.id, req.user!.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const plans = db.prepare(
    `SELECT bsp.*, u.display_name as created_by_name
     FROM behaviour_support_plans bsp
     LEFT JOIN users u ON bsp.created_by = u.id
     WHERE bsp.pupil_id = ? AND bsp.school_id = ?
     ORDER BY bsp.created_at DESC`
  ).all(req.params.id, req.user!.schoolId);
  res.json(plans);
});

router.post("/:id/support-plans", requireAuth, (req: Request, res: Response) => {
  const { title, content, summary, strategies, positiveTargets, status, reviewDate, sharedWithParents } = req.body;
  if (!title || !content) return res.status(400).json({ error: "title and content required" });
  const pupil = db.prepare("SELECT id FROM pupils WHERE id=? AND school_id=?").get(req.params.id, req.user!.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const id = uuidv4();
  db.prepare(
    `INSERT INTO behaviour_support_plans (id, school_id, pupil_id, created_by, title, content, summary, strategies, positive_targets, status, review_date, shared_with_parents)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, req.user!.schoolId, req.params.id, req.user!.id,
    title, content,
    summary || null, strategies || null, positiveTargets || null,
    status || "active", reviewDate || null,
    sharedWithParents !== false ? 1 : 0
  );
  auditLog(req.user!.id, req.user!.schoolId ?? null, "support_plan.created", "behaviour_support_plans", id, { title }, req.ip ?? undefined);
  res.status(201).json({ id });
});

router.put("/:id/support-plans/:planId", requireAuth, (req: Request, res: Response) => {
  const plan = db.prepare("SELECT * FROM behaviour_support_plans WHERE id=? AND school_id=?").get(req.params.planId, req.user!.schoolId) as any;
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  const { status, sharedWithParents } = req.body;
  db.prepare("UPDATE behaviour_support_plans SET status=?, shared_with_parents=?, updated_at=datetime('now') WHERE id=?").run(
    status || plan.status,
    sharedWithParents !== undefined ? (sharedWithParents ? 1 : 0) : plan.shared_with_parents,
    req.params.planId
  );
  res.json({ message: "Updated" });
});

router.delete("/:id/support-plans/:planId", requireAuth, (req: Request, res: Response) => {
  const plan = db.prepare("SELECT * FROM behaviour_support_plans WHERE id=? AND school_id=?").get(req.params.planId, req.user!.schoolId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  db.prepare("DELETE FROM behaviour_support_plans WHERE id=?").run(req.params.planId);
  res.json({ message: "Deleted" });
});

export default router;

