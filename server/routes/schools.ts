import { Router, Request, Response } from "express";
import { randomBytes, createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/index.js";
import { requireAuth, requireMinRole, auditLog, JWT_SECRET, SESSION_TIMEOUT_MS } from "../middleware/auth.js";
import { sendWelcomeEmail, sendEmailVerification, sendDSLConfirmation } from "../email/index.js";

const router = Router();

// ── Helper: create session token (mirrors auth.ts logic) ─────────────────────
function createOnboardSessionToken(user: { id: string; email: string; display_name: string; role: string; school_id: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      schoolId: user.school_id,
      mfaEnabled: false,
      mfaVerified: true,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// GDPR: Hash IPs before storing in sessions table
function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip + (process.env.IP_HASH_SALT || "adaptly-ip-salt")).digest("hex").slice(0, 16);
}

// ── URN Lookup (DfE Get Information About Schools proxy) ─────────────────────
// Improvement #7: Auto-fill school details from URN
router.get("/urn-lookup/:urn", async (req: Request, res: Response) => {
  const { urn } = req.params;
  if (!/^\d{6}$/.test(urn)) {
    return res.status(400).json({ error: "URN must be exactly 6 digits" });
  }
  try {
    // Use the DfE GIAS public API to look up school details
    const response = await fetch(
      `https://www.get-information-schools.service.gov.uk/api/establishments?urn=${urn}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) {
      return res.status(404).json({ error: "School not found for this URN" });
    }
    const data = await response.json();
    const school = Array.isArray(data) ? data[0] : data;
    if (!school || !school.EstablishmentName) {
      return res.status(404).json({ error: "School not found for this URN" });
    }
    // Map the GIAS response to our expected format
    const phaseMap: Record<string, string> = {
      "Primary": "primary", "Secondary": "secondary", "All-through": "all-through",
      "Special": "special", "Not applicable": "other",
    };
    const rawPhase = school.PhaseOfEducation?.DisplayName || school.TypeOfEstablishment?.DisplayName || "";
    const phase = phaseMap[rawPhase] || "other";
    const addressParts = [school.Street, school.Town, school.County, school.Postcode].filter(Boolean);
    res.json({
      name: school.EstablishmentName,
      address: addressParts.join(", "),
      phase,
      domain: "", // DfE doesn't provide email domain
    });
  } catch (err: any) {
    // If the external API is unavailable, return gracefully
    console.warn("[urn-lookup] DfE API error:", err?.message);
    res.status(502).json({ error: "Unable to reach DfE school database. Please enter details manually." });
  }
});

// ── School Onboarding Wizard ──────────────────────────────────────────────────
// Improvements #1 (auto-sign-in), #5 (email verification), #6 (DSL confirmation)
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

    // Improvement #4: Server-side validation
    if (urn && !/^\d{6}$/.test(urn)) {
      return res.status(400).json({ error: "URN must be exactly 6 digits" });
    }

    // Block personal email domains for admin account
    const PERSONAL_DOMAINS = new Set([
      "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
      "hotmail.co.uk", "outlook.com", "live.com", "live.co.uk", "icloud.com",
      "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
    ]);
    const emailDomain = adminEmail.split("@")[1]?.toLowerCase();
    if (domain && PERSONAL_DOMAINS.has(domain.toLowerCase())) {
      return res.status(400).json({ error: "School domain cannot be a personal email provider (e.g. gmail.com, outlook.com)" });
    }

    // Validate DSL email is not the same as admin email
    if (dslEmail && dslEmail.toLowerCase() === adminEmail.toLowerCase()) {
      return res.status(400).json({ error: "DSL email should be different from the admin email for KCSIE compliance" });
    }

    // Check URN not already registered
    if (urn) {
      const existing = await db.prepare("SELECT id FROM schools WHERE urn = ?").get(urn);
      if (existing) return res.status(409).json({ error: "A school with this URN is already registered" });
    }

    // Check admin email not taken
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);
    if (existingUser) return res.status(409).json({ error: "An account with this email already exists" });

    const schoolId = uuidv4();
    const adminId = uuidv4();
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30-day trial
    const dslConfirmToken = dslEmail ? uuidv4() : null; // Improvement #6: DSL confirmation token

    await db.prepare(`INSERT INTO schools (id, mat_id, name, urn, address, phase, domain, dsl_name, dsl_email, dsl_phone, onboarding_complete, trial_ends_at, licence_type, dsl_confirmed, dsl_confirm_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, ?)`).run(
      schoolId, matId || null, schoolName, urn || null, address || null,
      phase || null, domain || null, dslName || null, dslEmail || null,
      dslPhone || null, trialEndsAt, licenceType, dslConfirmToken
    );

    // Improvement #5: Don't set email_verified=1 immediately. Send verification email instead.
    const emailVerifyToken = uuidv4();
    const hash = await bcrypt.hash(adminPassword, 12);
    await db.prepare(`INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verified, email_verify_token)
      VALUES (?, ?, ?, ?, ?, 'school_admin', 0, ?)`).run(adminId, schoolId, adminEmail, adminName, hash, emailVerifyToken);

    auditLog(adminId, schoolId, "school.onboarded", "school", schoolId, { schoolName, urn }, req.ip);
    sendWelcomeEmail(adminEmail, adminName, schoolName).catch(console.error);
    // Improvement #5: Send email verification
    sendEmailVerification(adminEmail, emailVerifyToken).catch(console.error);
    // Improvement #6: Send DSL confirmation email
    if (dslEmail && dslConfirmToken) {
      sendDSLConfirmation(dslEmail, dslName || "Designated Safeguarding Lead", schoolName, dslConfirmToken).catch(console.error);
    }

    // Improvement #1: Auto-sign-in — create session and return token + cookie
    const userRecord = { id: adminId, email: adminEmail, display_name: adminName, role: "school_admin", school_id: schoolId };
    const token = createOnboardSessionToken(userRecord);
    const sessionExpiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
    await db.prepare(`INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), adminId, token, hashIp(req.ip), req.headers["user-agent"] || null, sessionExpiresAt
    );

    // Set httpOnly auth cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MS,
      path: "/",
    });

    res.status(201).json({
      message: "School registered successfully",
      schoolId,
      adminId,
      trialEndsAt,
      token, // Improvement #1: return token for auto-sign-in
      phase: phase || null, // Improvement #10: pass phase back for worksheet pre-fill
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    res.status(500).json({ error: "Onboarding failed" });
  }
});

// ── DSL Confirmation Endpoint ─────────────────────────────────────────────────
// Improvement #6: DSL confirms their role via email link
router.get("/dsl-confirm", async (req: Request, res: Response) => {
  const { token } = req.query as { token: string };
  if (!token) return res.status(400).json({ error: "Confirmation token required" });
  const school = await db.prepare("SELECT id, name FROM schools WHERE dsl_confirm_token = ?").get(token) as any;
  if (!school) return res.status(404).json({ error: "Invalid or expired confirmation link" });
  await db.prepare("UPDATE schools SET dsl_confirmed = 1, dsl_confirm_token = NULL WHERE id = ?").run(school.id);
  auditLog(null, school.id, "dsl.confirmed", "school", school.id, {}, req.ip);
  res.json({ message: `You have confirmed your role as DSL for ${school.name}. Thank you.` });
});

// ── Get My School ─────────────────────────────────────────────────────────────
router.get("/my", requireAuth, async (req: Request, res: Response) => {
  if (!req.user!.schoolId) return res.status(404).json({ error: "No school associated" });
  const school = await db.prepare("SELECT * FROM schools WHERE id = ?").get(req.user!.schoolId);
  res.json(school);
});

// ── Update School ─────────────────────────────────────────────────────────────
router.put("/my", requireAuth, requireMinRole("school_admin"), async (req: Request, res: Response) => {
  const { name, address, phase, domain, dslName, dslEmail, dslPhone } = req.body;
  const schoolId = req.user!.schoolId!;

  await db.prepare(`UPDATE schools SET name=?, address=?, phase=?, domain=?, dsl_name=?, dsl_email=?, dsl_phone=? WHERE id=?`)
    .run(name, address, phase, domain, dslName, dslEmail, dslPhone, schoolId);

  auditLog(req.user!.id, schoolId, "school.updated", "school", schoolId, req.body, req.ip);
  res.json({ message: "School updated" });
});

// ── List All Schools (MAT admin) ──────────────────────────────────────────────
router.get("/", requireAuth, requireMinRole("mat_admin"), async (req: Request, res: Response) => {
  const schools = await db.prepare("SELECT * FROM schools ORDER BY name").all();
  res.json(schools);
});

// ── Get School Users ──────────────────────────────────────────────────────────
router.get("/users", requireAuth, requireMinRole("school_admin"), async (req: Request, res: Response) => {
  const schoolId = req.user!.role === "mat_admin"
    ? (req.query.schoolId as string) || req.user!.schoolId
    : req.user!.schoolId;

  const users = await db.prepare(
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

    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "User with this email already exists" });

    // Check domain restriction
    const school = await db.prepare("SELECT * FROM schools WHERE id = ?").get(schoolId) as any;
    if (school?.domain) {
      const emailDomain = email.split("@")[1];
      if (emailDomain !== school.domain) {
        return res.status(403).json({ error: `Email must be @${school.domain}` });
      }
    }

    const tempPassword = randomBytes(8).toString("base64url").slice(0, 10) + "A1!";
    const hash = await bcrypt.hash(tempPassword, 12);
    const userId = uuidv4();
    const verifyToken = uuidv4();

    await db.prepare(`INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verify_token)
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
router.put("/users/:userId/role", requireAuth, requireMinRole("school_admin"), async (req: Request, res: Response) => {
  const { role } = req.body;
  const { userId } = req.params;
  const validRoles = ["teacher", "ta", "senco", "school_admin"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });

  await db.prepare("UPDATE users SET role = ? WHERE id = ? AND school_id = ?").run(role, userId, req.user!.schoolId);
  auditLog(req.user!.id, req.user!.schoolId, "user.role_changed", "user", userId, { role }, req.ip);
  res.json({ message: "Role updated" });
});

// ── Deactivate User ───────────────────────────────────────────────────────────
router.post("/users/:userId/deactivate", requireAuth, requireMinRole("school_admin"), async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (userId === req.user!.id) return res.status(400).json({ error: "Cannot deactivate your own account" });

  await db.prepare("UPDATE users SET is_active = 0, deactivated_at = NOW(), deactivated_by = ? WHERE id = ? AND school_id = ?")
    .run(req.user!.id, userId, req.user!.schoolId);
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  auditLog(req.user!.id, req.user!.schoolId, "user.deactivated", "user", userId, {}, req.ip);
  res.json({ message: "User deactivated" });
});

// ── Reactivate User ───────────────────────────────────────────────────────────
router.post("/users/:userId/reactivate", requireAuth, requireMinRole("school_admin"), async (req: Request, res: Response) => {
  const { userId } = req.params;
  await db.prepare("UPDATE users SET is_active = 1, deactivated_at = NULL, deactivated_by = NULL WHERE id = ? AND school_id = ?")
    .run(userId, req.user!.schoolId);
  auditLog(req.user!.id, req.user!.schoolId, "user.reactivated", "user", userId, {}, req.ip);
  res.json({ message: "User reactivated" });
});

// ── MAT: Create School ────────────────────────────────────────────────────────
router.post("/mat/schools", requireAuth, requireMinRole("mat_admin"), async (req: Request, res: Response) => {
  const { name, urn, domain, phase } = req.body;
  if (!name) return res.status(400).json({ error: "School name required" });
  const schoolId = uuidv4();
  await db.prepare("INSERT INTO schools (id, mat_id, name, urn, domain, phase, onboarding_complete) VALUES (?, ?, ?, ?, ?, ?, 1)")
    .run(schoolId, req.user!.schoolId, name, urn || null, domain || null, phase || null);
  auditLog(req.user!.id, schoolId, "school.created_by_mat", "school", schoolId, { name }, req.ip);
  res.status(201).json({ schoolId });
});

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get("/audit", requireAuth, requireMinRole("school_admin"), async (req: Request, res: Response) => {
  const schoolId = req.user!.role === "mat_admin"
    ? (req.query.schoolId as string) || req.user!.schoolId
    : req.user!.schoolId;
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = await db.prepare(
    `SELECT al.*, u.display_name, u.email FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE al.school_id = ? ORDER BY al.created_at DESC LIMIT ?`
  ).all(schoolId, limit);
  res.json(logs);
});

// GET /api/schools/audit-admin — Detailed audit log with device/browser/IP info
router.get("/audit-admin", requireAuth, requireMinRole("school_admin"), async (req: Request, res: Response) => {
  const schoolId = req.user!.role === "mat_admin"
    ? (req.query.schoolId as string) || req.user!.schoolId
    : req.user!.schoolId;
  const limit = parseInt(req.query.limit as string) || 200;
  const offset = parseInt(req.query.offset as string) || 0;
  
  const logs = await db.prepare(`
    SELECT 
      al.id, al.action, al.entity_type, al.entity_id, al.details, al.ip_address, al.created_at,
      u.id as user_id, u.display_name, u.email, u.role,
      s.user_agent
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN sessions s ON al.user_id = s.user_id
    WHERE al.school_id = ?
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(schoolId, limit, offset) as any[];
  
  const enriched = logs.map(log => {
    const ua = log.user_agent || "";
    let browser = "Unknown", device = "Unknown", os = "Unknown";
    
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";
    
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    
    if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) device = "Mobile";
    else if (ua.includes("iPad")) device = "Tablet";
    else device = "Desktop";
    
    return {
      ...log,
      browser,
      device,
      os,
      ip_masked: log.ip_address ? log.ip_address.split(".").slice(0, 3).join(".") + ".***" : "Unknown",
    };
  });
  
  res.json({ logs: enriched, total: logs.length });
});

export default router;
