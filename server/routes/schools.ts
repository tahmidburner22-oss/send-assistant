import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import db from "../db/index.js";
import { requireAuth, requireMinRole, auditLog } from "../middleware/auth.js";
import { sendWelcomeEmail } from "../email/index.js";

const router = Router();

// ── School Onboarding Wizard ──────────────────────────────────────────────────
router.post("/onboard", async (req: Request, res: Response) => {
  try {
    const {
      schoolName, urn, address, phase, domain,
      dslName, dslEmail, dslPhone,
      adminEmail, adminName, adminPassword,
      matId, licenceType = "trial",
    } = req.body;

    if (!schoolName || !adminEmail || !adminName || !adminPassword) {
      return res.status(400).json({ error: "School name, admin email, name and password are required" });
    }

    // Check URN not already registered
    if (urn) {
      const existing = db.prepare("SELECT id FROM schools WHERE urn = ?").get(urn);
      if (existing) return res.status(409).json({ error: "A school with this URN is already registered" });
    }

    // Check admin email not taken
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);
    if (existingUser) return res.status(409).json({ error: "An account with this email already exists" });

    const schoolId = uuidv4();
    const adminId = uuidv4();
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30-day trial

    db.prepare(`INSERT INTO schools (id, mat_id, name, urn, address, phase, domain, dsl_name, dsl_email, dsl_phone, onboarding_complete, trial_ends_at, licence_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`).run(
      schoolId, matId || null, schoolName, urn || null, address || null,
      phase || null, domain || null, dslName || null, dslEmail || null,
      dslPhone || null, trialEndsAt, licenceType
    );

    const hash = await bcrypt.hash(adminPassword, 12);
    db.prepare(`INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verified)
      VALUES (?, ?, ?, ?, ?, 'school_admin', 1)`).run(adminId, schoolId, adminEmail, adminName, hash);

    auditLog(adminId, schoolId, "school.onboarded", "school", schoolId, { schoolName, urn }, req.ip);
    sendWelcomeEmail(adminEmail, adminName, schoolName).catch(console.error);

    res.status(201).json({
      message: "School registered successfully",
      schoolId,
      adminId,
      trialEndsAt,
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    res.status(500).json({ error: "Onboarding failed" });
  }
});

// ── Get My School ─────────────────────────────────────────────────────────────
router.get("/my", requireAuth, (req: Request, res: Response) => {
  if (!req.user!.schoolId) return res.status(404).json({ error: "No school associated" });
  const school = db.prepare("SELECT * FROM schools WHERE id = ?").get(req.user!.schoolId);
  res.json(school);
});

// ── Update School ─────────────────────────────────────────────────────────────
router.put("/my", requireAuth, requireMinRole("school_admin"), (req: Request, res: Response) => {
  const { name, address, phase, domain, dslName, dslEmail, dslPhone } = req.body;
  const schoolId = req.user!.schoolId!;

  db.prepare(`UPDATE schools SET name=?, address=?, phase=?, domain=?, dsl_name=?, dsl_email=?, dsl_phone=? WHERE id=?`)
    .run(name, address, phase, domain, dslName, dslEmail, dslPhone, schoolId);

  auditLog(req.user!.id, schoolId, "school.updated", "school", schoolId, req.body, req.ip);
  res.json({ message: "School updated" });
});

// ── List All Schools (MAT admin) ──────────────────────────────────────────────
router.get("/", requireAuth, requireMinRole("mat_admin"), (req: Request, res: Response) => {
  const schools = db.prepare("SELECT * FROM schools ORDER BY name").all();
  res.json(schools);
});

// ── Get School Users ──────────────────────────────────────────────────────────
router.get("/users", requireAuth, requireMinRole("school_admin"), (req: Request, res: Response) => {
  const schoolId = req.user!.role === "mat_admin"
    ? (req.query.schoolId as string) || req.user!.schoolId
    : req.user!.schoolId;

  const users = db.prepare(
    "SELECT id, email, display_name, role, is_active, email_verified, mfa_enabled, last_login_at, created_at FROM users WHERE school_id = ? ORDER BY display_name"
  ).all(schoolId);
  res.json(users);
});

// ── Invite / Create User ──────────────────────────────────────────────────────
router.post("/users/invite", requireAuth, requireMinRole("school_admin"), async (req: Request, res: Response) => {
  try {
    const { email, displayName, role = "teacher" } = req.body;
    const schoolId = req.user!.schoolId!;

    if (!email || !displayName) return res.status(400).json({ error: "Email and name required" });

    const validRoles = ["teacher", "ta", "senco", "school_admin"];
    if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "User with this email already exists" });

    // Check domain restriction
    const school = db.prepare("SELECT * FROM schools WHERE id = ?").get(schoolId) as any;
    if (school?.domain) {
      const emailDomain = email.split("@")[1];
      if (emailDomain !== school.domain) {
        return res.status(403).json({ error: `Email must be @${school.domain}` });
      }
    }

    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hash = await bcrypt.hash(tempPassword, 12);
    const userId = uuidv4();
    const verifyToken = uuidv4();

    db.prepare(`INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verify_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(userId, schoolId, email, displayName, hash, role, verifyToken);

    auditLog(req.user!.id, schoolId, "user.invited", "user", userId, { email, role }, req.ip);

    // In production, send invite email with temp password
    const { sendEmailVerification } = await import("../email/index.js");
    sendEmailVerification(email, verifyToken).catch(console.error);

    res.status(201).json({ message: "User invited", userId, tempPassword });
  } catch (err) {
    console.error("Invite error:", err);
    res.status(500).json({ error: "Failed to invite user" });
  }
});

// ── Update User Role ──────────────────────────────────────────────────────────
router.put("/users/:userId/role", requireAuth, requireMinRole("school_admin"), (req: Request, res: Response) => {
  const { role } = req.body;
  const { userId } = req.params;
  const validRoles = ["teacher", "ta", "senco", "school_admin"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });

  db.prepare("UPDATE users SET role = ? WHERE id = ? AND school_id = ?").run(role, userId, req.user!.schoolId);
  auditLog(req.user!.id, req.user!.schoolId, "user.role_changed", "user", userId, { role }, req.ip);
  res.json({ message: "Role updated" });
});

// ── Deactivate User ───────────────────────────────────────────────────────────
router.post("/users/:userId/deactivate", requireAuth, requireMinRole("school_admin"), (req: Request, res: Response) => {
  const { userId } = req.params;
  if (userId === req.user!.id) return res.status(400).json({ error: "Cannot deactivate your own account" });

  db.prepare("UPDATE users SET is_active = 0, deactivated_at = datetime('now'), deactivated_by = ? WHERE id = ? AND school_id = ?")
    .run(req.user!.id, userId, req.user!.schoolId);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  auditLog(req.user!.id, req.user!.schoolId, "user.deactivated", "user", userId, {}, req.ip);
  res.json({ message: "User deactivated" });
});

// ── Reactivate User ───────────────────────────────────────────────────────────
router.post("/users/:userId/reactivate", requireAuth, requireMinRole("school_admin"), (req: Request, res: Response) => {
  const { userId } = req.params;
  db.prepare("UPDATE users SET is_active = 1, deactivated_at = NULL, deactivated_by = NULL WHERE id = ? AND school_id = ?")
    .run(userId, req.user!.schoolId);
  auditLog(req.user!.id, req.user!.schoolId, "user.reactivated", "user", userId, {}, req.ip);
  res.json({ message: "User reactivated" });
});

// ── MAT: Create School ────────────────────────────────────────────────────────
router.post("/mat/schools", requireAuth, requireMinRole("mat_admin"), async (req: Request, res: Response) => {
  const { name, urn, domain, phase } = req.body;
  if (!name) return res.status(400).json({ error: "School name required" });
  const schoolId = uuidv4();
  db.prepare("INSERT INTO schools (id, mat_id, name, urn, domain, phase, onboarding_complete) VALUES (?, ?, ?, ?, ?, ?, 1)")
    .run(schoolId, req.user!.schoolId, name, urn || null, domain || null, phase || null);
  auditLog(req.user!.id, schoolId, "school.created_by_mat", "school", schoolId, { name }, req.ip);
  res.status(201).json({ schoolId });
});

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get("/audit", requireAuth, requireMinRole("school_admin"), (req: Request, res: Response) => {
  const schoolId = req.user!.role === "mat_admin"
    ? (req.query.schoolId as string) || req.user!.schoolId
    : req.user!.schoolId;
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = db.prepare(
    `SELECT al.*, u.display_name, u.email FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE al.school_id = ? ORDER BY al.created_at DESC LIMIT ?`
  ).all(schoolId, limit);
  res.json(logs);
});

export default router;
