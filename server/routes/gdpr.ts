/**
 * GDPR Routes — UK GDPR / Data Protection Act 2018 compliance
 *
 * Implements:
 *  - Article 17: Right to erasure ("right to be forgotten")
 *  - Article 20: Right to data portability (export)
 *  - Article 5(1)(e): Storage limitation (automated data retention enforcement)
 *  - Article 30: Records of processing activities (audit log access)
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, requireMinRole, auditLog } from "../middleware/auth.js";

const router = Router();

// ── Data Retention Policy ─────────────────────────────────────────────────────
// UK GDPR Article 5(1)(e): data must not be kept longer than necessary.
// Policy: behaviour/attendance records older than 3 years are purged automatically.
// Worksheets/stories: retained for 2 years after last access.
const BEHAVIOUR_RETENTION_DAYS = 1095; // 3 years
const ATTENDANCE_RETENTION_DAYS = 1095; // 3 years
const WORKSHEET_RETENTION_DAYS = 730;   // 2 years

/**
 * POST /api/gdpr/enforce-retention
 * Run data retention purge. Called by admin or scheduled task.
 * Only school_admin or mat_admin can trigger this.
 */
router.post("/enforce-retention", requireAuth, requireMinRole("school_admin"), (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;

  // Purge old behaviour records for this school's pupils
  const behaviourResult = db.prepare(`
    DELETE FROM behaviour_records
    WHERE pupil_id IN (SELECT id FROM pupils WHERE school_id = ?)
    AND date < date('now', '-${BEHAVIOUR_RETENTION_DAYS} days')
  `).run(schoolId);

  // Purge old attendance records
  const attendanceResult = db.prepare(`
    DELETE FROM attendance_records
    WHERE pupil_id IN (SELECT id FROM pupils WHERE school_id = ?)
    AND date < date('now', '-${ATTENDANCE_RETENTION_DAYS} days')
  `).run(schoolId);

  // Purge old worksheets
  const worksheetResult = db.prepare(`
    DELETE FROM worksheets
    WHERE school_id = ?
    AND created_at < datetime('now', '-${WORKSHEET_RETENTION_DAYS} days')
  `).run(schoolId);

  auditLog(req.user!.id, schoolId, "gdpr.retention_enforced", "school", schoolId, {
    behaviourDeleted: behaviourResult.changes,
    attendanceDeleted: attendanceResult.changes,
    worksheetsDeleted: worksheetResult.changes,
  }, req.ip);

  res.json({
    message: "Data retention policy enforced.",
    deleted: {
      behaviourRecords: behaviourResult.changes,
      attendanceRecords: attendanceResult.changes,
      worksheets: worksheetResult.changes,
    },
  });
});

/**
 * DELETE /api/gdpr/pupils/:id/erase
 * Right to erasure (Article 17) — permanently delete all data for a pupil.
 * Requires school_admin or above.
 */
router.delete("/pupils/:id/erase", requireAuth, requireMinRole("school_admin"), (req: Request, res: Response) => {
  const pupilId = req.params.id;
  const schoolId = req.user!.schoolId;

  // Verify pupil belongs to this school
  const pupil = db.prepare("SELECT * FROM pupils WHERE id = ? AND school_id = ?")
    .get(pupilId, schoolId) as any;
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  // Cascade delete all pupil data
  db.prepare("DELETE FROM behaviour_records WHERE pupil_id = ?").run(pupilId);
  db.prepare("DELETE FROM attendance_records WHERE pupil_id = ?").run(pupilId);
  db.prepare("DELETE FROM assignments WHERE pupil_id = ?").run(pupilId);
  db.prepare("DELETE FROM pupil_audit WHERE pupil_id = ?").run(pupilId);
  // Soft-delete the pupil record itself (preserve anonymised audit trail)
  db.prepare(`
    UPDATE pupils SET
      name = '[ERASED]',
      upn = NULL,
      dob = NULL,
      is_active = 0,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(pupilId);

  auditLog(req.user!.id, schoolId, "gdpr.pupil_erased", "pupil", pupilId, {
    initialsWere: pupil.name,
  }, req.ip);

  res.json({ message: "Pupil data erased in accordance with UK GDPR Article 17." });
});

/**
 * GET /api/gdpr/pupils/:id/export
 * Right to data portability (Article 20) — export all data held for a pupil as JSON.
 */
router.get("/pupils/:id/export", requireAuth, requireMinRole("teacher"), (req: Request, res: Response) => {
  const pupilId = req.params.id;
  const schoolId = req.user!.schoolId;

  const pupil = db.prepare("SELECT * FROM pupils WHERE id = ? AND school_id = ?")
    .get(pupilId, schoolId) as any;
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  const assignments = db.prepare("SELECT * FROM assignments WHERE pupil_id = ?").all(pupilId);
  const attendance = db.prepare("SELECT * FROM attendance_records WHERE pupil_id = ?").all(pupilId);
  const behaviour = db.prepare("SELECT * FROM behaviour_records WHERE pupil_id = ?").all(pupilId);
  const auditTrail = db.prepare("SELECT * FROM pupil_audit WHERE pupil_id = ?").all(pupilId);

  auditLog(req.user!.id, schoolId, "gdpr.data_exported", "pupil", pupilId, {}, req.ip);

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportedBy: req.user!.email,
    gdprBasis: "UK GDPR Article 20 — Right to Data Portability",
    dataController: "Adaptly (adaptly.co.uk)",
    pupil: {
      id: pupil.id,
      initials: pupil.name,
      yearGroup: pupil.year_group,
      sendNeed: pupil.send_need,
      createdAt: pupil.created_at,
    },
    assignments,
    attendanceRecords: attendance,
    behaviourRecords: behaviour,
    auditTrail,
  };

  res.setHeader("Content-Disposition", `attachment; filename="pupil-data-export-${pupilId}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.json(exportData);
});

/**
 * GET /api/gdpr/school/export
 * Export all school data (for DPO/ICO requests).
 * Requires mat_admin.
 */
router.get("/school/export", requireAuth, requireMinRole("mat_admin"), (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;

  const pupils = db.prepare("SELECT id, name, year_group, send_need, created_at FROM pupils WHERE school_id = ?").all(schoolId);
  const users = db.prepare("SELECT id, email, display_name, role, created_at, last_login_at FROM users WHERE school_id = ?").all(schoolId);
  const auditLogs = db.prepare("SELECT * FROM audit_logs WHERE school_id = ? ORDER BY created_at DESC LIMIT 1000").all(schoolId);

  auditLog(req.user!.id, schoolId, "gdpr.school_data_exported", "school", schoolId, {}, req.ip);

  res.setHeader("Content-Disposition", `attachment; filename="school-data-export-${schoolId}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.json({
    exportedAt: new Date().toISOString(),
    exportedBy: req.user!.email,
    gdprBasis: "UK GDPR Article 20 / ICO Subject Access Request",
    dataController: "Adaptly (adaptly.co.uk)",
    school: { id: schoolId },
    pupils,
    users,
    auditLogs,
  });
});

/**
 * DELETE /api/gdpr/account/erase
 * Teacher/staff account erasure — removes personal data but preserves anonymised audit trail.
 */
router.delete("/account/erase", requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const schoolId = req.user!.schoolId;

  // Anonymise the user record — preserve audit trail integrity
  db.prepare(`
    UPDATE users SET
      email = ? ,
      display_name = '[ERASED]',
      password_hash = NULL,
      mfa_secret = NULL,
      google_id = NULL,
      is_active = 0,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(`erased-${userId}@deleted.invalid`, userId);

  // Delete all active sessions
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);

  auditLog(userId, schoolId, "gdpr.account_erased", "user", userId, {}, req.ip);

  res.clearCookie("token");
  res.json({ message: "Your account data has been erased in accordance with UK GDPR Article 17." });
});

export default router;
