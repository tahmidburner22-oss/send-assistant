import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import db from "../db/index.js";
import { JWT_SECRET, SESSION_TIMEOUT_MS, auditLog } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { createHash } from "crypto";
import { sendPasswordReset, sendEmailVerification, sendWelcomeEmail } from "../email/index.js";

// GDPR: Hash IPs before storing in sessions table
function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip + (process.env.IP_HASH_SALT || "adaptly-ip-salt")).digest("hex").slice(0, 16);
}

const router = Router();

// ── Issue 1: Refuse to start with default JWT secret in production ────────────
if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET === undefined) {
  console.error("[SECURITY] FATAL: JWT_SECRET environment variable is not set. Set it in Railway Variables.");
  process.exit(1);
}

// ── Issue 2: Per-account failed login tracking (distributed, DB-backed) ──────
async function getLockoutState(email: string): Promise<{ locked: boolean; attempts: number }> {
  const row = await db.prepare("SELECT failed_login_attempts, locked_until FROM users WHERE email = ?").get(email) as any;
  if (!row) return { locked: false, attempts: 0 };
  const lockedUntil = row.locked_until ? new Date(row.locked_until).getTime() : 0;
  return { locked: lockedUntil > Date.now(), attempts: row.failed_login_attempts || 0 };
}

async function recordFailedLogin(userId: string): Promise<number> {
  await db.prepare(`
    UPDATE users
    SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
        locked_until = CASE
          WHEN COALESCE(failed_login_attempts, 0) + 1 >= 10 THEN NOW() + INTERVAL '15 minutes'
          ELSE locked_until
        END
    WHERE id = ?
  `).run(userId);
  const updated = await db.prepare("SELECT failed_login_attempts FROM users WHERE id = ?").get(userId) as any;
  return updated?.failed_login_attempts || 0;
}

async function clearFailedLogins(userId: string): Promise<void> {
  await db.prepare("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?").run(userId);
}

// ── Issue 7: Password strength validator ─────────────────────────────────────
function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Password must contain at least one special character (e.g. ! @ # $ %)";
  // Reject trivially common passwords
  const COMMON_PASSWORDS = ["password1!", "Password1!", "Qwerty123!", "Admin1234!", "Welcome1!", "School123!"];
  if (COMMON_PASSWORDS.includes(password)) return "This password is too common. Please choose a more unique password.";
  return null; // valid
}

// ── Register ──────────────────────────────────────────────────────────────────
// Personal email domains that are NOT allowed for school staff accounts
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
  "hotmail.co.uk", "outlook.com", "live.com", "live.co.uk", "icloud.com",
  "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
  "tutanota.com", "zoho.com", "yandex.com", "mail.com", "gmx.com",
]);

const VALID_ROLES = ["school_admin", "senco", "teacher", "ta", "staff"] as const;
type SchoolRole = typeof VALID_ROLES[number];

const ROLE_LABELS: Record<string, string> = {
  school_admin: "School Administrator",
  senco: "SENCO / Inclusion Lead",
  teacher: "Teacher",
  ta: "Teaching Assistant",
  staff: "Support Staff",
};

function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: SESSION_TIMEOUT_MS,
    path: "/",
  });
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, schoolId, role = "teacher", inviteToken } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password and display name are required" });
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // School email enforcement — block personal email providers
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (PERSONAL_EMAIL_DOMAINS.has(emailDomain)) {
      return res.status(400).json({
        error: "Please use your school or work email address. Personal email addresses (Gmail, Outlook, Yahoo, etc.) are not accepted.",
      });
    }

    // Role validation — only allow known school roles (mat_admin is set by system)
    const safeRole: SchoolRole = (VALID_ROLES as readonly string[]).includes(role) ? role as SchoolRole : "teacher";

    // Password strength — enforce complexity
    const pwError = validatePasswordStrength(password);
    if (pwError) return res.status(400).json({ error: pwError });

    // Check email not already used
    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    // Domain restriction check (if school has a locked domain)
    if (schoolId) {
      const school = await db.prepare("SELECT * FROM schools WHERE id = ?").get(schoolId) as any;
      if (school?.domain) {
        if (emailDomain !== school.domain) {
          return res.status(403).json({
            error: `Registration is restricted to @${school.domain} email addresses for this school`,
          });
        }
      }
    }

    const hash = await bcrypt.hash(password, 12);
    const verifyToken = uuidv4();
    const userId = uuidv4();

    await db.prepare(`INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verify_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(userId, schoolId || null, email, displayName, hash, safeRole, verifyToken);

    // Send verification email (non-blocking)
    sendEmailVerification(email, verifyToken).catch(console.error);

    // If school exists, send welcome email
    if (schoolId) {
      const school = await db.prepare("SELECT name FROM schools WHERE id = ?").get(schoolId) as any;
      if (school) sendWelcomeEmail(email, displayName, school.name).catch(console.error);
    }

    auditLog(userId, schoolId || null, "user.register", "user", userId, { email, role: safeRole }, req.ip);

    res.status(201).json({
      message: "Account created. Please check your email to verify your account.",
      roleLabel: ROLE_LABELS[safeRole] || safeRole,
    });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── Verify Email ──────────────────────────────────────────────────────────────
router.get("/verify-email", async (req: Request, res: Response) => {
  const { token } = req.query as { token: string };
  if (!token) return res.status(400).json({ error: "Token required" });

  const user = await db.prepare("SELECT * FROM users WHERE email_verify_token = ?").get(token) as any;
  if (!user) return res.status(400).json({ error: "Invalid or expired verification link" });

  await db.prepare("UPDATE users SET email_verified = 1, email_verify_token = NULL WHERE id = ?").run(user.id);
  auditLog(user.id, user.school_id, "user.email_verified", "user", user.id, {}, req.ip);

  res.json({ message: "Email verified successfully. You can now log in." });
});

// ── Resend Verification Email ─────────────────────────────────────────────────
router.post("/resend-verification", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  // Always return success to prevent email enumeration
  const user = await db.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1 AND email_verified = 0").get(email) as any;
  if (user) {
    const verifyToken = uuidv4();
    await db.prepare("UPDATE users SET email_verify_token = ? WHERE id = ?").run(verifyToken, user.id);
    sendEmailVerification(email, verifyToken).catch(console.error);
    auditLog(user.id, user.school_id, "user.verification_resent", "user", user.id, {}, req.ip);
  }

  res.json({ message: "If an unverified account exists with this email, a new verification link has been sent." });
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await db.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").get(email) as any;
    const lockState = await getLockoutState(email);
    if (lockState.locked) {
      return res.status(429).json({
        error: "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes or use Forgot Password.",
      });
    }
    // Use same error message whether user exists or not (prevents email enumeration)
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: "This account uses Google Sign-In. Please use the Google button." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const attempts = await recordFailedLogin(user.id);
      auditLog(user.id, user.school_id, "user.login_failed", "user", user.id, { attempts }, req.ip);
      if (attempts >= 10) {
        return res.status(429).json({
          error: "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes or use Forgot Password.",
        });
      }
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Issue 6: Enforce email verification
    if (!user.email_verified) {
      return res.status(403).json({
        error: "Please verify your email address before logging in. Check your inbox for a verification link.",
        emailNotVerified: true,
      });
    }

    // Successful login — clear any failed attempt tracking
    await clearFailedLogins(user.id);

    // Update last login
    await db.prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?").run(user.id);

    const mfaVerified = !user.mfa_enabled;
    const token = createSessionToken(user, mfaVerified);
    createSession(user.id, token, req);
    setSessionCookie(res, token);

    auditLog(user.id, user.school_id, "user.login", "user", user.id, { email }, req.ip);

    res.json({
      token,
      user: safeUser(user),
      mfaRequired: !!user.mfa_enabled && !mfaVerified,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── Google OAuth callback ─────────────────────────────────────────────────────
// Frontend exchanges Google ID token; we verify and upsert user
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { googleId, email, displayName } = req.body;
    if (!email || !googleId) return res.status(400).json({ error: "Google auth data missing" });

    let user = await db.prepare("SELECT * FROM users WHERE google_id = ? OR email = ?").get(googleId, email) as any;

    if (!user) {
      // Auto-register via Google
      const userId = uuidv4();
      await db.prepare(`INSERT INTO users (id, email, display_name, google_id, role, email_verified)
        VALUES (?, ?, ?, ?, 'teacher', 1)`).run(userId, email, displayName, googleId);
      user = await db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
      auditLog(userId, null, "user.register_google", "user", userId, { email }, req.ip);
    } else {
      // Link Google ID if not set
      if (!user.google_id) {
        await db.prepare("UPDATE users SET google_id = ?, email_verified = 1 WHERE id = ?").run(googleId, user.id);
      }
      if (!user.is_active) return res.status(403).json({ error: "Account deactivated" });
    }

    await db.prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?").run(user.id);

    const token = createSessionToken(user, true);
    createSession(user.id, token, req);
    setSessionCookie(res, token);

    auditLog(user.id, user.school_id, "user.login_google", "user", user.id, { email }, req.ip);

    res.json({ token, user: safeUser(user), mfaRequired: false });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

// ── MFA Setup ─────────────────────────────────────────────────────────────────
router.post("/mfa/setup", requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const secret = speakeasy.generateSecret({ name: `SEND Assistant (${user.email})`, length: 20 });

  await db.prepare("UPDATE users SET mfa_secret = ? WHERE id = ?").run(secret.base32, user.id);

  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url!);
  res.json({ secret: secret.base32, qrDataUrl });
});

// ── MFA Enable (confirm setup) ────────────────────────────────────────────────
router.post("/mfa/enable", requireAuth, async (req: Request, res: Response) => {
  const { code } = req.body;
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as any;

  const valid = speakeasy.totp.verify({
    secret: user.mfa_secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!valid) return res.status(400).json({ error: "Invalid verification code" });

  await db.prepare("UPDATE users SET mfa_enabled = 1 WHERE id = ?").run(user.id);
  auditLog(user.id, user.school_id, "user.mfa_enabled", "user", user.id, {}, req.ip);
  res.json({ message: "MFA enabled successfully" });
});

// ── MFA Verify (during login) ─────────────────────────────────────────────────
router.post("/mfa/verify", async (req: Request, res: Response) => {
  const { token: sessionToken, code } = req.body;
  if (!sessionToken || !code) return res.status(400).json({ error: "Token and code required" });

  try {
    const payload = jwt.verify(sessionToken, JWT_SECRET) as any;
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id) as any;
    if (!user) return res.status(401).json({ error: "User not found" });

    const valid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!valid) return res.status(400).json({ error: "Invalid MFA code" });

    // Invalidate old session, create new one with mfaVerified=true
    await db.prepare("DELETE FROM sessions WHERE token = ?").run(sessionToken);
    const newToken = createSessionToken(user, true);
    createSession(user.id, newToken, req);
    setSessionCookie(res, newToken);

    auditLog(user.id, user.school_id, "user.mfa_verified", "user", user.id, {}, req.ip);
    res.json({ token: newToken, user: safeUser(user) });
  } catch {
    res.status(401).json({ error: "Invalid session token" });
  }
});

// ── MFA Disable ───────────────────────────────────────────────────────────────
router.post("/mfa/disable", requireAuth, async (req: Request, res: Response) => {
  await db.prepare("UPDATE users SET mfa_enabled = 0, mfa_secret = NULL WHERE id = ?").run(req.user!.id);
  auditLog(req.user!.id, req.user!.schoolId, "user.mfa_disabled", "user", req.user!.id, {}, req.ip);
  res.json({ message: "MFA disabled" });
});

// ── Forgot Password ───────────────────────────────────────────────────────────
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  // Always return success to prevent email enumeration
  const user = await db.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").get(email) as any;
  if (user) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    await db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(user.id);
    await db.prepare("INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)")
      .run(uuidv4(), user.id, token, expiresAt);
    sendPasswordReset(email, token).catch(console.error);
    auditLog(user.id, user.school_id, "user.password_reset_requested", "user", user.id, {}, req.ip);
  }

  res.json({ message: "If an account exists with this email, a reset link has been sent." });
});

// ── Reset Password ────────────────────────────────────────────────────────────
router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token and new password required" });
  const pwError = validatePasswordStrength(password);
  if (pwError) return res.status(400).json({ error: pwError });

  const reset = await db.prepare(
    "SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()"
  ).get(token) as any;

  if (!reset) return res.status(400).json({ error: "Invalid or expired reset link" });

  const hash = await bcrypt.hash(password, 12);
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, reset.user_id);
  await db.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(reset.id);
  // Invalidate all sessions
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").run(reset.user_id);

  auditLog(reset.user_id, null, "user.password_reset", "user", reset.user_id, {}, req.ip);
  res.json({ message: "Password reset successfully. Please log in." });
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post("/logout", requireAuth, async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7) || req.cookies?.token;
  if (token) await db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  auditLog(req.user!.id, req.user!.schoolId, "user.logout", "user", req.user!.id, {}, req.ip);
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// ── Session Refresh — extend session expiry when user is active ────────────────
router.post("/refresh", requireAuth, async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7) || req.cookies?.token;
  if (!token) return res.status(401).json({ error: "No token" });
  const newExpiry = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
  await db.prepare("UPDATE sessions SET expires_at = ? WHERE token = ?").run(newExpiry, token);
  setSessionCookie(res, token);
  res.json({ ok: true, expiresAt: newExpiry });
});

// ── Current User (/session and /me are aliases) ──────────────────────────────
const getCurrentUser = async (req: Request, res: Response) => {
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as any;
  const school = user.school_id
    ? await db.prepare("SELECT * FROM schools WHERE id = ?").get(user.school_id)
    : null;
  res.json({ user: safeUser(user), school });
};
router.get("/session", requireAuth, getCurrentUser);
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as any;
  const school = user.school_id
    ? await db.prepare("SELECT * FROM schools WHERE id = ?").get(user.school_id)
    : null;
  res.json({ user: safeUser(user), school });
});

// ── Change Password ───────────────────────────────────────────────────────────
router.post("/change-password", requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });

  const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as any;
  const valid = await bcrypt.compare(currentPassword, user.password_hash || "");
  if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

  const hash = await bcrypt.hash(newPassword, 12);
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id);
  auditLog(user.id, user.school_id, "user.password_changed", "user", user.id, {}, req.ip);
  res.json({ message: "Password changed successfully" });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function createSessionToken(user: any, mfaVerified: boolean): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      schoolId: user.school_id,
      mfaEnabled: !!user.mfa_enabled,
      mfaVerified,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

async function createSession(userId: string, token: string, req: Request) {
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
  await db.prepare(`INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    uuidv4(),
    userId,
    token,
    hashIp(req.ip), // GDPR: store hashed IP only
    req.headers["user-agent"] || null,
    expiresAt
  );
}

function safeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    schoolId: user.school_id,
    mfaEnabled: !!user.mfa_enabled,
    emailVerified: !!user.email_verified,
    onboardingDone: !!user.onboarding_done,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  };
}

export default router;
