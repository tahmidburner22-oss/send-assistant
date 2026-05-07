var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/email/index.ts
var email_exports = {};
__export(email_exports, {
  sendBehaviourAlert: () => sendBehaviourAlert,
  sendDSLIncidentAlert: () => sendDSLIncidentAlert,
  sendDirectParentMessage: () => sendDirectParentMessage,
  sendEmailVerification: () => sendEmailVerification,
  sendFeedbackEmail: () => sendFeedbackEmail,
  sendPasswordReset: () => sendPasswordReset,
  sendWelcomeEmail: () => sendWelcomeEmail
});
import { Resend } from "resend";
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set. Add it to Railway environment variables.");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
async function send(to, subject, html) {
  if (isDev) {
    console.log(`\u{1F4E7} [DEV EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const { error } = await getResend().emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[email] Resend error:", error);
  } catch (err) {
    console.error("[email] Failed to send email:", err);
  }
}
async function sendPasswordReset(to, token) {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  await send(
    to,
    "Reset your Adaptly password",
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#059669">Adaptly</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${link}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
      <p style="color:#666;font-size:14px">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Adaptly \xB7 AI-powered tools for UK SEND educators</p>
    </div>`
  );
}
async function sendEmailVerification(to, token) {
  const link = `${BASE_URL}/verify-email?token=${token}`;
  await send(
    to,
    "Verify your Adaptly email",
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#059669">Welcome to Adaptly</h2>
      <p>Please verify your email address to activate your account:</p>
      <a href="${link}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Verify Email</a>
      <p style="color:#666;font-size:14px">This link expires in 24 hours.</p>
    </div>`
  );
}
async function sendDSLIncidentAlert(dslEmail, incident) {
  await send(
    dslEmail,
    `[${incident.severity.toUpperCase()}] Safeguarding Incident Reported`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#dc2626">Safeguarding Incident Alert</h2>
      <p>A safeguarding concern has been flagged in Adaptly and requires your attention.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold;background:#f9fafb">Severity</td><td style="padding:8px;background:#f9fafb">${incident.severity}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Reported by</td><td style="padding:8px">${incident.reportedBy}</td></tr>
        ${incident.pupilName ? `<tr><td style="padding:8px;font-weight:bold;background:#f9fafb">Pupil</td><td style="padding:8px;background:#f9fafb">${incident.pupilName}</td></tr>` : ""}
        <tr><td style="padding:8px;font-weight:bold">Description</td><td style="padding:8px">${incident.description}</td></tr>
      </table>
      <p style="margin-top:16px">Please log in to Adaptly to review and action this incident.</p>
      <a href="${BASE_URL}/safeguarding" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">View Incident</a>
      <p style="color:#999;font-size:12px">Incident ID: ${incident.id}</p>
    </div>`
  );
}
async function sendWelcomeEmail(to, displayName, schoolName) {
  await send(
    to,
    "Welcome to Adaptly",
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#059669">Welcome, ${displayName}!</h2>
      <p>Your account has been created for <strong>${schoolName}</strong> on Adaptly.</p>
      <p>Adaptly provides AI-powered differentiation tools to help you support pupils with Special Educational Needs and Disabilities.</p>
      <a href="${BASE_URL}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Get Started</a>
    </div>`
  );
}
async function sendDirectParentMessage(parentEmail, data) {
  await send(
    parentEmail,
    `Message from ${data.teacherName} \u2014 ${data.schoolName}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6366f1">Adaptly \u2014 Message from School</h2>
      <p>Dear ${data.parentName},</p>
      <p>You have received a message from <strong>${data.teacherName}</strong> at <strong>${data.schoolName}</strong> regarding <strong>${data.pupilName}</strong>.</p>
      <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:16px;border-radius:0 8px 8px 0;margin:16px 0">
        <p style="font-weight:bold;margin:0 0 8px 0;color:#374151">${data.subject}</p>
        <p style="margin:0;color:#374151;white-space:pre-wrap">${data.message}</p>
      </div>
      <p style="color:#666;font-size:14px">You can view your child's full progress and history in the <a href="${BASE_URL}/parent-portal" style="color:#6366f1">Parent Portal</a>.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Adaptly \xB7 ${data.schoolName} \xB7 This email was sent by a teacher via the Adaptly platform.</p>
    </div>`
  );
}
async function sendBehaviourAlert(parentEmail, data) {
  const isPositive = data.type === "positive";
  const colour = isPositive ? "#059669" : "#d97706";
  const heading = isPositive ? "Positive Behaviour Update" : "Behaviour Update";
  const intro = isPositive ? `We are pleased to share a positive behaviour update for <strong>${data.pupilName}</strong>.` : `We wanted to keep you informed about a behaviour note recorded for <strong>${data.pupilName}</strong>.`;
  await send(
    parentEmail,
    `${heading} \u2014 ${data.pupilName} | ${data.schoolName}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:${colour}">Adaptly \u2014 ${heading}</h2>
      <p>${intro}</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;font-weight:bold;background:#f9fafb;width:140px">Date</td><td style="padding:8px;background:#f9fafb">${data.date}</td></tr>
        ${data.category ? `<tr><td style="padding:8px;font-weight:bold">Category</td><td style="padding:8px">${data.category}</td></tr>` : ""}
        ${data.description ? `<tr><td style="padding:8px;font-weight:bold;background:#f9fafb">Details</td><td style="padding:8px;background:#f9fafb">${data.description}</td></tr>` : ""}
        ${data.actionTaken ? `<tr><td style="padding:8px;font-weight:bold">Action taken</td><td style="padding:8px">${data.actionTaken}</td></tr>` : ""}
        <tr><td style="padding:8px;font-weight:bold;background:#f9fafb">Recorded by</td><td style="padding:8px;background:#f9fafb">${data.teacherName}</td></tr>
      </table>
      <p style="color:#666;font-size:14px">You can view your child's full progress and behaviour history in the <a href="${BASE_URL}/parent-portal" style="color:${colour}">Parent Portal</a>.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Adaptly \xB7 ${data.schoolName} \xB7 This email was sent because a behaviour record was logged for your child.</p>
    </div>`
  );
}
async function sendFeedbackEmail(data) {
  const FEEDBACK_TO = process.env.FEEDBACK_EMAIL || "hello@adaptly.co.uk";
  await send(
    FEEDBACK_TO,
    `Adaptly Feedback: ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}${data.name ? ` from ${data.name}` : ""}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6366f1">Adaptly \u2014 User Feedback</h2>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;font-weight:bold;background:#f9fafb;width:100px">Type</td><td style="padding:8px;background:#f9fafb">${data.type}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${data.name || "Anonymous"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f9fafb">Email</td><td style="padding:8px;background:#f9fafb">${data.email || "Not provided"}</td></tr>
      </table>
      <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:16px;border-radius:0 8px 8px 0;margin:16px 0">
        <p style="margin:0;color:#374151;white-space:pre-wrap">${data.message}</p>
      </div>
      <p style="color:#999;font-size:12px">Adaptly \xB7 User feedback submitted via the app</p>
    </div>`
  );
}
var isDev, _resend, FROM, BASE_URL;
var init_email = __esm({
  "server/email/index.ts"() {
    "use strict";
    isDev = process.env.NODE_ENV !== "production";
    _resend = null;
    FROM = process.env.EMAIL_FROM || "Adaptly <noreply@send.adaptly.co.uk>";
    BASE_URL = process.env.APP_URL || "http://localhost:5173";
  }
});

// server/index.ts
import "dotenv/config";
import { webcrypto } from "crypto";
import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path4 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import fs4 from "fs";

// server/routes/auth.ts
import { Router } from "express";
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";
import { v4 as uuidv43 } from "uuid";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

// server/db/index.ts
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "send-assistant.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
var _db;
function persist() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}
var db = {
  /** Execute a SQL string (DDL / multi-statement). */
  exec(sql) {
    _db.run(sql);
    persist();
  },
  pragma(_) {
  },
  /** Wrap a function in a transaction (mimics better-sqlite3 .transaction()).
   * sql.js is single-threaded in-memory; we simply execute the function and
   * let individual run() calls persist. No explicit BEGIN/COMMIT needed. */
  transaction(fn) {
    return () => fn();
  },
  /** Prepare a statement — returns an object with .run(), .get(), .all(). */
  prepare(sql) {
    return {
      run(...params) {
        _db.run(sql, params);
        persist();
        return { changes: 1, lastInsertRowid: 0 };
      },
      get(...params) {
        const stmt = _db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return void 0;
      },
      all(...params) {
        const stmt = _db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      }
    };
  }
};
function loadSchema() {
  const candidates = [
    path.join(__dirname, "schema.sql"),
    path.join(__dirname, "..", "db", "schema.sql"),
    path.join(process.cwd(), "server", "db", "schema.sql"),
    path.join(process.cwd(), "dist", "server", "db", "schema.sql")
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf-8");
  }
  throw new Error("schema.sql not found in: " + candidates.join(", "));
}
async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }
  const schema = loadSchema();
  const schemaSafe = schema.split("\n").filter((l) => !l.trim().startsWith("PRAGMA")).join("\n");
  try {
    _db.run(schemaSafe);
  } catch (e) {
    console.error("Error running schema.sql:", e.message || JSON.stringify(e));
    throw e;
  }
  persist();
  const migrations = [
    "ALTER TABLE schools ADD COLUMN stripe_customer_id TEXT",
    // Rename old admin email — safe to run multiple times
    "UPDATE users SET email = 'admin@adaptly.co.uk' WHERE email = 'admin@sendassistant.app'",
    "ALTER TABLE schools ADD COLUMN subscription_status TEXT DEFAULT 'trialing'",
    "ALTER TABLE schools ADD COLUMN subscription_plan TEXT",
    "ALTER TABLE schools ADD COLUMN subscription_period_end TEXT",
    "ALTER TABLE schools ADD COLUMN subscription_cancel_at_period_end INTEGER NOT NULL DEFAULT 0",
    // MIS integration columns
    "ALTER TABLE behaviour_records ADD COLUMN mis_source TEXT",
    "ALTER TABLE behaviour_records ADD COLUMN mis_id TEXT",
    "ALTER TABLE behaviour_records ADD COLUMN points INTEGER DEFAULT 0",
    "ALTER TABLE attendance_records ADD COLUMN mis_source TEXT",
    // User preferences (sidebar collapse state, theme, etc.) — persisted server-side
    "ALTER TABLE users ADD COLUMN preferences TEXT",
    // Parent contact details on pupils — for behaviour alert emails
    "ALTER TABLE pupils ADD COLUMN parent_email TEXT",
    "ALTER TABLE pupils ADD COLUMN parent_name TEXT",
    // Daily briefing file attachments — added after initial schema
    "ALTER TABLE daily_briefings ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'",
    // Structured worksheet sections + metadata for assignments (for 1:1 WorksheetRenderer display)
    "ALTER TABLE assignments ADD COLUMN sections TEXT",
    "ALTER TABLE assignments ADD COLUMN metadata TEXT",
    "ALTER TABLE assignments ADD COLUMN subtitle TEXT",
    // Login lockout columns — added for brute-force protection
    "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN locked_until TEXT",
    // Parent access code for parent portal
    "ALTER TABLE pupils ADD COLUMN parent_access_code TEXT",
    // Worksheet folder support
    `CREATE TABLE IF NOT EXISTS worksheet_folders (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      created_by TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      colour TEXT DEFAULT '#6366f1',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS worksheet_folder_items (
      folder_id TEXT NOT NULL REFERENCES worksheet_folders(id) ON DELETE CASCADE,
      worksheet_id TEXT NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (folder_id, worksheet_id)
    )`,
    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'system',
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT,
      metadata TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read)`,
    // Parent messages table
    `CREATE TABLE IF NOT EXISTS parent_messages (
      id TEXT PRIMARY KEY,
      pupil_id TEXT NOT NULL REFERENCES pupils(id) ON DELETE CASCADE,
      sender_type TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      body TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_parent_messages_pupil ON parent_messages(pupil_id)`,
    // Quiz results table
    `CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      pupil_id TEXT REFERENCES pupils(id) ON DELETE SET NULL,
      pupil_name TEXT NOT NULL,
      quiz_id TEXT,
      quiz_title TEXT,
      subject TEXT,
      topic TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      max_score INTEGER NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL DEFAULT 0,
      time_taken_seconds INTEGER,
      badge TEXT,
      played_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_results_pupil ON quiz_results(pupil_id)`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_results_school ON quiz_results(school_id)`,
    // Platform stats for landing page
    `CREATE TABLE IF NOT EXISTS platform_stats (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  ];
  for (const migration of migrations) {
    try {
      _db.run(migration);
    } catch (_) {
    }
  }
  persist();
  const stmt = _db.prepare("SELECT COUNT(*) as c FROM users");
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();
  if (!row.c || row.c === 0) {
    const schoolId = uuidv4();
    const adminId = uuidv4();
    const hash = bcrypt.hashSync("Admin1234!", 12);
    _db.run(
      `INSERT INTO schools (id, name, urn, domain, onboarding_complete, licence_type, subscription_plan, subscription_status)
       VALUES (?, 'Adaptly', '000000', '', 1, 'premium', 'premium', 'active')`,
      [schoolId]
    );
    _db.run(
      `INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verified)
       VALUES (?, ?, 'admin@adaptly.co.uk', 'System Admin', ?, 'mat_admin', 1)`,
      [adminId, schoolId, hash]
    );
    persist();
    console.log("\u2705 Seeded default admin: admin@adaptly.co.uk / Admin1234!");
  }
  const adminKeyProviders = [
    { provider: "groq", envKey: "GROQ_API_KEY", model: "llama-3.3-70b-versatile" },
    { provider: "gemini", envKey: "GEMINI_API_KEY", model: "gemini-2.5-flash" },
    { provider: "mistral", envKey: "MISTRAL_API_KEY", model: "mistral-small-latest" }
  ];
  for (const { provider, envKey, model } of adminKeyProviders) {
    const key = process.env[envKey];
    if (key) {
      _db.run(
        `INSERT OR REPLACE INTO admin_api_keys (id, provider, api_key, model, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [provider, provider, key, model]
      );
    } else {
      _db.run(
        `UPDATE admin_api_keys SET model=?, updated_at=datetime('now') WHERE provider=?`,
        [model, provider]
      );
    }
  }
  persist();
  console.log(`\u2705 Database ready at ${DB_PATH}`);
}
var db_default = db;

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
import { v4 as uuidv42 } from "uuid";
var JWT_SECRET = process.env.JWT_SECRET || "send-assistant-dev-secret-change-in-production";
var SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1e3;
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const session = db_default.prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(token);
    if (!session) return res.status(401).json({ error: "Session expired. Please log in again." });
    const user2 = db_default.prepare("SELECT * FROM users WHERE id = ? AND is_active = 1").get(payload.id);
    if (!user2) return res.status(401).json({ error: "Account deactivated" });
    if (user2.mfa_enabled && !payload.mfaVerified) {
      return res.status(403).json({ error: "MFA verification required", mfaRequired: true });
    }
    req.user = {
      id: user2.id,
      email: user2.email,
      displayName: user2.display_name,
      role: user2.role,
      schoolId: user2.school_id,
      mfaEnabled: !!user2.mfa_enabled,
      mfaVerified: payload.mfaVerified
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  const adminRoles = ["mat_admin", "school_admin"];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
var ROLE_LEVELS = {
  mat_admin: 5,
  school_admin: 4,
  senco: 3,
  teacher: 2,
  ta: 1,
  staff: 0
};
function requireMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const minLevel = ROLE_LEVELS[minRole] || 0;
    if (userLevel < minLevel) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}
function auditLog(userId, schoolId, action, entityType, entityId, details, ipAddress) {
  db_default.prepare(`INSERT INTO audit_logs (id, user_id, school_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    uuidv42(),
    userId,
    schoolId,
    action,
    entityType || null,
    entityId || null,
    details ? JSON.stringify(details) : null,
    ipAddress || null
  );
}

// server/routes/auth.ts
init_email();
var router = Router();
if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET === void 0) {
  console.error("[SECURITY] FATAL: JWT_SECRET environment variable is not set. Set it in Railway Variables.");
  process.exit(1);
}
var failedLoginAttempts = /* @__PURE__ */ new Map();
var lockoutUntil = /* @__PURE__ */ new Map();
function isLockedOut(email) {
  const until = lockoutUntil.get(email);
  if (!until) return false;
  if (Date.now() < until) return true;
  lockoutUntil.delete(email);
  failedLoginAttempts.delete(email);
  return false;
}
function recordFailedLogin(email) {
  const attempts = (failedLoginAttempts.get(email) || 0) + 1;
  failedLoginAttempts.set(email, attempts);
  if (attempts >= 10) {
    lockoutUntil.set(email, Date.now() + 15 * 60 * 1e3);
    failedLoginAttempts.delete(email);
  }
  return attempts;
}
function clearFailedLogins(email) {
  failedLoginAttempts.delete(email);
  lockoutUntil.delete(email);
}
function validatePasswordStrength(password) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Password must contain at least one special character";
  return null;
}
var PERSONAL_EMAIL_DOMAINS = /* @__PURE__ */ new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "live.co.uk",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "tutanota.com",
  "zoho.com",
  "yandex.com",
  "mail.com",
  "gmx.com"
]);
var VALID_ROLES = ["school_admin", "senco", "teacher", "ta", "staff"];
var ROLE_LABELS = {
  school_admin: "School Administrator",
  senco: "SENCO / Inclusion Lead",
  teacher: "Teacher",
  ta: "Teaching Assistant",
  staff: "Support Staff"
};
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName, schoolId, role = "teacher", inviteToken } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password and display name are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (PERSONAL_EMAIL_DOMAINS.has(emailDomain)) {
      return res.status(400).json({
        error: "Please use your school or work email address. Personal email addresses (Gmail, Outlook, Yahoo, etc.) are not accepted."
      });
    }
    const safeRole = VALID_ROLES.includes(role) ? role : "teacher";
    const pwError = validatePasswordStrength(password);
    if (pwError) return res.status(400).json({ error: pwError });
    const existing = db_default.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });
    if (schoolId) {
      const school = db_default.prepare("SELECT * FROM schools WHERE id = ?").get(schoolId);
      if (school?.domain) {
        if (emailDomain !== school.domain) {
          return res.status(403).json({
            error: `Registration is restricted to @${school.domain} email addresses for this school`
          });
        }
      }
    }
    const hash = await bcrypt2.hash(password, 12);
    const verifyToken = uuidv43();
    const userId = uuidv43();
    db_default.prepare(`INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verify_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(userId, schoolId || null, email, displayName, hash, safeRole, verifyToken);
    sendEmailVerification(email, verifyToken).catch(console.error);
    if (schoolId) {
      const school = db_default.prepare("SELECT name FROM schools WHERE id = ?").get(schoolId);
      if (school) sendWelcomeEmail(email, displayName, school.name).catch(console.error);
    }
    auditLog(userId, schoolId || null, "user.register", "user", userId, { email, role: safeRole }, req.ip);
    res.status(201).json({
      message: "Account created. Please check your email to verify your account.",
      roleLabel: ROLE_LABELS[safeRole] || safeRole
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});
router.get("/verify-email", (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Token required" });
  const user2 = db_default.prepare("SELECT * FROM users WHERE email_verify_token = ?").get(token);
  if (!user2) return res.status(400).json({ error: "Invalid or expired verification link" });
  db_default.prepare("UPDATE users SET email_verified = 1, email_verify_token = NULL WHERE id = ?").run(user2.id);
  auditLog(user2.id, user2.school_id, "user.email_verified", "user", user2.id, {}, req.ip);
  res.json({ message: "Email verified successfully. You can now log in." });
});
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const user2 = db_default.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1 AND email_verified = 0").get(email);
  if (user2) {
    const verifyToken = uuidv43();
    db_default.prepare("UPDATE users SET email_verify_token = ? WHERE id = ?").run(verifyToken, user2.id);
    sendEmailVerification(email, verifyToken).catch(console.error);
    auditLog(user2.id, user2.school_id, "user.verification_resent", "user", user2.id, {}, req.ip);
  }
  res.json({ message: "If an unverified account exists with this email, a new verification link has been sent." });
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    if (isLockedOut(email)) {
      return res.status(429).json({
        error: "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes or use Forgot Password."
      });
    }
    const user2 = db_default.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").get(email);
    if (!user2) {
      recordFailedLogin(email);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user2.password_hash) {
      return res.status(401).json({ error: "This account uses Google Sign-In. Please use the Google button." });
    }
    const valid = await bcrypt2.compare(password, user2.password_hash);
    if (!valid) {
      const attempts = recordFailedLogin(email);
      auditLog(user2.id, user2.school_id, "user.login_failed", "user", user2.id, { attempts }, req.ip);
      if (attempts >= 10) {
        return res.status(429).json({
          error: "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes or use Forgot Password."
        });
      }
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user2.email_verified) {
      return res.status(403).json({
        error: "Please verify your email address before logging in. Check your inbox for a verification link.",
        emailNotVerified: true
      });
    }
    clearFailedLogins(email);
    db_default.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user2.id);
    const mfaVerified = !user2.mfa_enabled;
    const token = createSessionToken(user2, mfaVerified);
    createSession(user2.id, token, req);
    auditLog(user2.id, user2.school_id, "user.login", "user", user2.id, { email }, req.ip);
    res.json({
      token,
      user: safeUser(user2),
      mfaRequired: !!user2.mfa_enabled && !mfaVerified
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});
router.post("/google", async (req, res) => {
  try {
    const { idToken, googleId, email, displayName, photoUrl } = req.body;
    if (!email || !googleId) return res.status(400).json({ error: "Google auth data missing" });
    let user2 = db_default.prepare("SELECT * FROM users WHERE google_id = ? OR email = ?").get(googleId, email);
    if (!user2) {
      const userId = uuidv43();
      db_default.prepare(`INSERT INTO users (id, email, display_name, google_id, role, email_verified)
        VALUES (?, ?, ?, ?, 'teacher', 1)`).run(userId, email, displayName, googleId);
      user2 = db_default.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      auditLog(userId, null, "user.register_google", "user", userId, { email }, req.ip);
    } else {
      if (!user2.google_id) {
        db_default.prepare("UPDATE users SET google_id = ?, email_verified = 1 WHERE id = ?").run(googleId, user2.id);
      }
      if (!user2.is_active) return res.status(403).json({ error: "Account deactivated" });
    }
    db_default.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user2.id);
    const token = createSessionToken(user2, true);
    createSession(user2.id, token, req);
    auditLog(user2.id, user2.school_id, "user.login_google", "user", user2.id, { email }, req.ip);
    res.json({ token, user: safeUser(user2), mfaRequired: false });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Google authentication failed" });
  }
});
router.post("/mfa/setup", requireAuth, async (req, res) => {
  const user2 = req.user;
  const secret = speakeasy.generateSecret({ name: `SEND Assistant (${user2.email})`, length: 20 });
  db_default.prepare("UPDATE users SET mfa_secret = ? WHERE id = ?").run(secret.base32, user2.id);
  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
  res.json({ secret: secret.base32, qrDataUrl });
});
router.post("/mfa/enable", requireAuth, (req, res) => {
  const { code } = req.body;
  const user2 = db_default.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  const valid = speakeasy.totp.verify({
    secret: user2.mfa_secret,
    encoding: "base32",
    token: code,
    window: 1
  });
  if (!valid) return res.status(400).json({ error: "Invalid verification code" });
  db_default.prepare("UPDATE users SET mfa_enabled = 1 WHERE id = ?").run(user2.id);
  auditLog(user2.id, user2.school_id, "user.mfa_enabled", "user", user2.id, {}, req.ip);
  res.json({ message: "MFA enabled successfully" });
});
router.post("/mfa/verify", (req, res) => {
  const { token: sessionToken, code } = req.body;
  if (!sessionToken || !code) return res.status(400).json({ error: "Token and code required" });
  try {
    const payload = jwt2.verify(sessionToken, JWT_SECRET);
    const user2 = db_default.prepare("SELECT * FROM users WHERE id = ?").get(payload.id);
    if (!user2) return res.status(401).json({ error: "User not found" });
    const valid = speakeasy.totp.verify({
      secret: user2.mfa_secret,
      encoding: "base32",
      token: code,
      window: 1
    });
    if (!valid) return res.status(400).json({ error: "Invalid MFA code" });
    db_default.prepare("DELETE FROM sessions WHERE token = ?").run(sessionToken);
    const newToken = createSessionToken(user2, true);
    createSession(user2.id, newToken, req);
    auditLog(user2.id, user2.school_id, "user.mfa_verified", "user", user2.id, {}, req.ip);
    res.json({ token: newToken, user: safeUser(user2) });
  } catch {
    res.status(401).json({ error: "Invalid session token" });
  }
});
router.post("/mfa/disable", requireAuth, (req, res) => {
  db_default.prepare("UPDATE users SET mfa_enabled = 0, mfa_secret = NULL WHERE id = ?").run(req.user.id);
  auditLog(req.user.id, req.user.schoolId, "user.mfa_disabled", "user", req.user.id, {}, req.ip);
  res.json({ message: "MFA disabled" });
});
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const user2 = db_default.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").get(email);
  if (user2) {
    const token = uuidv43();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3).toISOString();
    db_default.prepare("DELETE FROM password_resets WHERE user_id = ?").run(user2.id);
    db_default.prepare("INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)").run(uuidv43(), user2.id, token, expiresAt);
    sendPasswordReset(email, token).catch(console.error);
    auditLog(user2.id, user2.school_id, "user.password_reset_requested", "user", user2.id, {}, req.ip);
  }
  res.json({ message: "If an account exists with this email, a reset link has been sent." });
});
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token and new password required" });
  const pwError = validatePasswordStrength(password);
  if (pwError) return res.status(400).json({ error: pwError });
  const reset = db_default.prepare(
    "SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime('now')"
  ).get(token);
  if (!reset) return res.status(400).json({ error: "Invalid or expired reset link" });
  const hash = await bcrypt2.hash(password, 12);
  db_default.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, reset.user_id);
  db_default.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(reset.id);
  db_default.prepare("DELETE FROM sessions WHERE user_id = ?").run(reset.user_id);
  auditLog(reset.user_id, null, "user.password_reset", "user", reset.user_id, {}, req.ip);
  res.json({ message: "Password reset successfully. Please log in." });
});
router.post("/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.slice(7) || req.cookies?.token;
  if (token) db_default.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  auditLog(req.user.id, req.user.schoolId, "user.logout", "user", req.user.id, {}, req.ip);
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});
router.post("/refresh", requireAuth, (req, res) => {
  const token = req.headers.authorization?.slice(7) || req.cookies?.token;
  if (!token) return res.status(401).json({ error: "No token" });
  const newExpiry = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
  db_default.prepare("UPDATE sessions SET expires_at = ? WHERE token = ?").run(newExpiry, token);
  res.json({ ok: true, expiresAt: newExpiry });
});
var getCurrentUser = (req, res) => {
  const user2 = db_default.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  const school = user2.school_id ? db_default.prepare("SELECT * FROM schools WHERE id = ?").get(user2.school_id) : null;
  res.json({ user: safeUser(user2), school });
};
router.get("/session", requireAuth, getCurrentUser);
router.get("/me", requireAuth, (req, res) => {
  const user2 = db_default.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  const school = user2.school_id ? db_default.prepare("SELECT * FROM schools WHERE id = ?").get(user2.school_id) : null;
  res.json({ user: safeUser(user2), school });
});
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords required" });
  if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });
  const user2 = db_default.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  const valid = await bcrypt2.compare(currentPassword, user2.password_hash || "");
  if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
  const hash = await bcrypt2.hash(newPassword, 12);
  db_default.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user2.id);
  auditLog(user2.id, user2.school_id, "user.password_changed", "user", user2.id, {}, req.ip);
  res.json({ message: "Password changed successfully" });
});
function createSessionToken(user2, mfaVerified) {
  return jwt2.sign(
    {
      id: user2.id,
      email: user2.email,
      displayName: user2.display_name,
      role: user2.role,
      schoolId: user2.school_id,
      mfaEnabled: !!user2.mfa_enabled,
      mfaVerified
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}
function createSession(userId, token, req) {
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString();
  db_default.prepare(`INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)`).run(
    uuidv43(),
    userId,
    token,
    req.ip,
    req.headers["user-agent"] || null,
    expiresAt
  );
}
function safeUser(user2) {
  return {
    id: user2.id,
    email: user2.email,
    displayName: user2.display_name,
    role: user2.role,
    schoolId: user2.school_id,
    mfaEnabled: !!user2.mfa_enabled,
    emailVerified: !!user2.email_verified,
    onboardingDone: !!user2.onboarding_done,
    lastLoginAt: user2.last_login_at,
    createdAt: user2.created_at
  };
}
var auth_default = router;

// server/routes/schools.ts
import { Router as Router2 } from "express";
import { v4 as uuidv44 } from "uuid";
import bcrypt3 from "bcryptjs";
init_email();
var router2 = Router2();
router2.post("/onboard", async (req, res) => {
  try {
    const {
      schoolName,
      urn,
      address,
      phase,
      domain,
      dslName,
      dslEmail,
      dslPhone,
      adminEmail,
      adminName,
      adminPassword,
      matId,
      licenceType = "trial"
    } = req.body;
    if (!schoolName || !adminEmail || !adminName || !adminPassword) {
      return res.status(400).json({ error: "School name, admin email, name and password are required" });
    }
    if (urn) {
      const existing = db_default.prepare("SELECT id FROM schools WHERE urn = ?").get(urn);
      if (existing) return res.status(409).json({ error: "A school with this URN is already registered" });
    }
    const existingUser = db_default.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);
    if (existingUser) return res.status(409).json({ error: "An account with this email already exists" });
    const schoolId = uuidv44();
    const adminId = uuidv44();
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
    db_default.prepare(`INSERT INTO schools (id, mat_id, name, urn, address, phase, domain, dsl_name, dsl_email, dsl_phone, onboarding_complete, trial_ends_at, licence_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`).run(
      schoolId,
      matId || null,
      schoolName,
      urn || null,
      address || null,
      phase || null,
      domain || null,
      dslName || null,
      dslEmail || null,
      dslPhone || null,
      trialEndsAt,
      licenceType
    );
    const hash = await bcrypt3.hash(adminPassword, 12);
    db_default.prepare(`INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verified)
      VALUES (?, ?, ?, ?, ?, 'school_admin', 1)`).run(adminId, schoolId, adminEmail, adminName, hash);
    auditLog(adminId, schoolId, "school.onboarded", "school", schoolId, { schoolName, urn }, req.ip);
    sendWelcomeEmail(adminEmail, adminName, schoolName).catch(console.error);
    res.status(201).json({
      message: "School registered successfully",
      schoolId,
      adminId,
      trialEndsAt
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    res.status(500).json({ error: "Onboarding failed" });
  }
});
router2.get("/my", requireAuth, (req, res) => {
  if (!req.user.schoolId) return res.status(404).json({ error: "No school associated" });
  const school = db_default.prepare("SELECT * FROM schools WHERE id = ?").get(req.user.schoolId);
  res.json(school);
});
router2.put("/my", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const { name, address, phase, domain, dslName, dslEmail, dslPhone } = req.body;
  const schoolId = req.user.schoolId;
  db_default.prepare(`UPDATE schools SET name=?, address=?, phase=?, domain=?, dsl_name=?, dsl_email=?, dsl_phone=? WHERE id=?`).run(name, address, phase, domain, dslName, dslEmail, dslPhone, schoolId);
  auditLog(req.user.id, schoolId, "school.updated", "school", schoolId, req.body, req.ip);
  res.json({ message: "School updated" });
});
router2.get("/", requireAuth, requireMinRole("mat_admin"), (req, res) => {
  const schools = db_default.prepare("SELECT * FROM schools ORDER BY name").all();
  res.json(schools);
});
router2.get("/users", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const schoolId = req.user.role === "mat_admin" ? req.query.schoolId || req.user.schoolId : req.user.schoolId;
  const users = db_default.prepare(
    "SELECT id, email, display_name, role, is_active, email_verified, mfa_enabled, last_login_at, created_at FROM users WHERE school_id = ? ORDER BY display_name"
  ).all(schoolId);
  res.json(users);
});
router2.post("/users/invite", requireAuth, requireMinRole("school_admin"), async (req, res) => {
  try {
    const { email, displayName, role = "teacher" } = req.body;
    const schoolId = req.user.schoolId;
    if (!email || !displayName) return res.status(400).json({ error: "Email and name required" });
    const validRoles = ["teacher", "ta", "senco", "school_admin"];
    if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
    const existing = db_default.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "User with this email already exists" });
    const school = db_default.prepare("SELECT * FROM schools WHERE id = ?").get(schoolId);
    if (school?.domain) {
      const emailDomain = email.split("@")[1];
      if (emailDomain !== school.domain) {
        return res.status(403).json({ error: `Email must be @${school.domain}` });
      }
    }
    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hash = await bcrypt3.hash(tempPassword, 12);
    const userId = uuidv44();
    const verifyToken = uuidv44();
    db_default.prepare(`INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verify_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(userId, schoolId, email, displayName, hash, role, verifyToken);
    auditLog(req.user.id, schoolId, "user.invited", "user", userId, { email, role }, req.ip);
    const { sendEmailVerification: sendEmailVerification2 } = await Promise.resolve().then(() => (init_email(), email_exports));
    sendEmailVerification2(email, verifyToken).catch(console.error);
    res.status(201).json({ message: "User invited", userId, tempPassword });
  } catch (err) {
    console.error("Invite error:", err);
    res.status(500).json({ error: "Failed to invite user" });
  }
});
router2.put("/users/:userId/role", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const { role } = req.body;
  const { userId } = req.params;
  const validRoles = ["teacher", "ta", "senco", "school_admin"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
  db_default.prepare("UPDATE users SET role = ? WHERE id = ? AND school_id = ?").run(role, userId, req.user.schoolId);
  auditLog(req.user.id, req.user.schoolId, "user.role_changed", "user", userId, { role }, req.ip);
  res.json({ message: "Role updated" });
});
router2.post("/users/:userId/deactivate", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.id) return res.status(400).json({ error: "Cannot deactivate your own account" });
  db_default.prepare("UPDATE users SET is_active = 0, deactivated_at = datetime('now'), deactivated_by = ? WHERE id = ? AND school_id = ?").run(req.user.id, userId, req.user.schoolId);
  db_default.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  auditLog(req.user.id, req.user.schoolId, "user.deactivated", "user", userId, {}, req.ip);
  res.json({ message: "User deactivated" });
});
router2.post("/users/:userId/reactivate", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const { userId } = req.params;
  db_default.prepare("UPDATE users SET is_active = 1, deactivated_at = NULL, deactivated_by = NULL WHERE id = ? AND school_id = ?").run(userId, req.user.schoolId);
  auditLog(req.user.id, req.user.schoolId, "user.reactivated", "user", userId, {}, req.ip);
  res.json({ message: "User reactivated" });
});
router2.post("/mat/schools", requireAuth, requireMinRole("mat_admin"), async (req, res) => {
  const { name, urn, domain, phase } = req.body;
  if (!name) return res.status(400).json({ error: "School name required" });
  const schoolId = uuidv44();
  db_default.prepare("INSERT INTO schools (id, mat_id, name, urn, domain, phase, onboarding_complete) VALUES (?, ?, ?, ?, ?, ?, 1)").run(schoolId, req.user.schoolId, name, urn || null, domain || null, phase || null);
  auditLog(req.user.id, schoolId, "school.created_by_mat", "school", schoolId, { name }, req.ip);
  res.status(201).json({ schoolId });
});
router2.get("/audit", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const schoolId = req.user.role === "mat_admin" ? req.query.schoolId || req.user.schoolId : req.user.schoolId;
  const limit = parseInt(req.query.limit) || 100;
  const logs = db_default.prepare(
    `SELECT al.*, u.display_name, u.email FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE al.school_id = ? ORDER BY al.created_at DESC LIMIT ?`
  ).all(schoolId, limit);
  res.json(logs);
});
router2.get("/audit-admin", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const schoolId = req.user.role === "mat_admin" ? req.query.schoolId || req.user.schoolId : req.user.schoolId;
  const limit = parseInt(req.query.limit) || 200;
  const offset = parseInt(req.query.offset) || 0;
  const logs = db_default.prepare(`
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
  `).all(schoolId, limit, offset);
  const enriched = logs.map((log) => {
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
      ip_masked: log.ip_address ? log.ip_address.split(".").slice(0, 3).join(".") + ".***" : "Unknown"
    };
  });
  res.json({ logs: enriched, total: logs.length });
});
var schools_default = router2;

// server/routes/pupils.ts
import { Router as Router3 } from "express";
import { v4 as uuidv45 } from "uuid";
init_email();
var router3 = Router3();
function parseAssignment(a) {
  if (!a) return a;
  return {
    ...a,
    sections: a.sections ? (() => {
      try {
        return JSON.parse(a.sections);
      } catch {
        return void 0;
      }
    })() : void 0,
    metadata: a.metadata ? (() => {
      try {
        return JSON.parse(a.metadata);
      } catch {
        return void 0;
      }
    })() : void 0
  };
}
router3.get("/", requireAuth, (req, res) => {
  const pupils = db_default.prepare(
    "SELECT * FROM pupils WHERE school_id = ? AND is_active = 1 ORDER BY name"
  ).all(req.user.schoolId);
  const enriched = pupils.map((p) => {
    const assignments = db_default.prepare("SELECT * FROM assignments WHERE pupil_id = ? ORDER BY assigned_at DESC").all(p.id).map(parseAssignment);
    const attendance = db_default.prepare("SELECT * FROM attendance_records WHERE pupil_id = ? ORDER BY date DESC").all(p.id);
    const behaviour = db_default.prepare("SELECT * FROM behaviour_records WHERE pupil_id = ? ORDER BY date DESC LIMIT 100").all(p.id);
    return { ...p, assignments, attendance, behaviour };
  });
  res.json(enriched);
});
router3.get("/:id", requireAuth, (req, res) => {
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id = ? AND school_id = ?").get(req.params.id, req.user.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const auditTrail = db_default.prepare(
    `SELECT pa.*, u.display_name FROM pupil_audit pa
     LEFT JOIN users u ON pa.changed_by = u.id
     WHERE pa.pupil_id = ? ORDER BY pa.changed_at DESC LIMIT 50`
  ).all(pupil.id);
  const assignments = db_default.prepare("SELECT * FROM assignments WHERE pupil_id = ? ORDER BY assigned_at DESC").all(pupil.id).map(parseAssignment);
  const attendance = db_default.prepare("SELECT * FROM attendance_records WHERE pupil_id = ? ORDER BY date DESC LIMIT 30").all(pupil.id);
  const behaviour = db_default.prepare("SELECT * FROM behaviour_records WHERE pupil_id = ? ORDER BY date DESC LIMIT 30").all(pupil.id);
  res.json({ ...pupil, auditTrail, assignments, attendance, behaviour });
});
router3.post("/", requireAuth, (req, res) => {
  const { name, yearGroup, sendNeed, upn, dob } = req.body;
  if (!name) return res.status(400).json({ error: "Pupil name required" });
  const id = uuidv45();
  const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();
  db_default.prepare(`INSERT INTO pupils (id, school_id, name, year_group, send_need, code, upn, dob, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    req.user.schoolId,
    name,
    yearGroup || null,
    sendNeed || null,
    code,
    upn || null,
    dob || null,
    req.user.id
  );
  auditLog(req.user.id, req.user.schoolId ?? null, "pupil.created", "pupil", id, { name }, req.ip ?? void 0);
  res.status(201).json({ id, code });
});
router3.put("/:id", requireAuth, (req, res) => {
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id = ? AND school_id = ?").get(req.params.id, req.user.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const fields = ["name", "year_group", "send_need", "upn", "dob"];
  const fieldMap = {
    name: "name",
    yearGroup: "year_group",
    sendNeed: "send_need",
    upn: "upn",
    dob: "dob"
  };
  for (const [reqField, dbField] of Object.entries(fieldMap)) {
    if (req.body[reqField] !== void 0 && req.body[reqField] !== pupil[dbField]) {
      db_default.prepare(`INSERT INTO pupil_audit (id, pupil_id, changed_by, field_name, old_value, new_value)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        uuidv45(),
        pupil.id,
        req.user.id,
        reqField,
        pupil[dbField] || null,
        req.body[reqField] || null
      );
    }
  }
  db_default.prepare(`UPDATE pupils SET name=?, year_group=?, send_need=?, upn=?, dob=?, parent_email=?, parent_name=?, updated_at=datetime('now') WHERE id=?`).run(
    req.body.name || pupil.name,
    req.body.yearGroup ?? pupil.year_group,
    req.body.sendNeed ?? pupil.send_need,
    req.body.upn ?? pupil.upn,
    req.body.dob ?? pupil.dob,
    req.body.parentEmail !== void 0 ? req.body.parentEmail || null : pupil.parent_email ?? null,
    req.body.parentName !== void 0 ? req.body.parentName || null : pupil.parent_name ?? null,
    pupil.id
  );
  auditLog(req.user.id, req.user.schoolId ?? null, "pupil.updated", "pupil", pupil.id, req.body, req.ip ?? void 0);
  res.json({ message: "Pupil updated" });
});
router3.delete("/:id", requireAuth, requireMinRole("teacher"), (req, res) => {
  db_default.prepare("UPDATE pupils SET is_active = 0 WHERE id = ? AND school_id = ?").run(req.params.id, req.user.schoolId);
  auditLog(req.user.id, req.user.schoolId ?? null, "pupil.archived", "pupil", req.params.id, {}, req.ip ?? void 0);
  res.json({ message: "Pupil archived" });
});
router3.post("/bulk-import", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const { pupils } = req.body;
  if (!Array.isArray(pupils) || pupils.length === 0) {
    return res.status(400).json({ error: "No pupils provided" });
  }
  const insert = db_default.prepare(`INSERT OR IGNORE INTO pupils (id, school_id, name, year_group, send_need, code, upn, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  let count = 0;
  for (const p of pupils) {
    if (!p.name) continue;
    const id = uuidv45();
    const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();
    insert.run(id, req.user.schoolId, p.name, p.yearGroup || null, p.sendNeed || null, code, p.upn || null, req.user.id);
    count++;
  }
  auditLog(req.user.id, req.user.schoolId ?? null, "pupils.bulk_imported", "school", req.user.schoolId ?? void 0, { count }, req.ip ?? void 0);
  res.json({ message: `${count} pupils imported` });
});
router3.get("/safeguarding/incidents", requireAuth, requireMinRole("senco"), (req, res) => {
  const incidents = db_default.prepare(
    `SELECT si.*, p.name as pupil_name, u.display_name as reported_by_name
     FROM safeguarding_incidents si
     LEFT JOIN pupils p ON si.pupil_id = p.id
     LEFT JOIN users u ON si.reported_by = u.id
     WHERE si.school_id = ? ORDER BY si.created_at DESC`
  ).all(req.user.schoolId);
  res.json(incidents);
});
router3.post("/safeguarding/incidents", requireAuth, async (req, res) => {
  const { pupilId, description, aiTrigger, severity = "medium" } = req.body;
  if (!description) return res.status(400).json({ error: "Description required" });
  const id = uuidv45();
  db_default.prepare(`INSERT INTO safeguarding_incidents (id, school_id, pupil_id, reported_by, description, ai_trigger, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    req.user.schoolId,
    pupilId || null,
    req.user.id,
    description,
    aiTrigger || null,
    severity
  );
  const school = db_default.prepare("SELECT * FROM schools WHERE id = ?").get(req.user.schoolId);
  if (school?.dsl_email) {
    const pupil = pupilId ? db_default.prepare("SELECT name FROM pupils WHERE id = ?").get(pupilId) : null;
    db_default.prepare("UPDATE safeguarding_incidents SET dsl_notified = 1, dsl_notified_at = datetime('now') WHERE id = ?").run(id);
    sendDSLIncidentAlert(school.dsl_email, {
      id,
      severity,
      description,
      reportedBy: req.user.displayName,
      pupilName: pupil?.name
    }).catch(console.error);
  }
  auditLog(req.user.id, req.user.schoolId ?? null, "safeguarding.incident_reported", "incident", id, { severity }, req.ip ?? void 0);
  res.status(201).json({ id, message: "Incident reported" });
});
router3.put("/safeguarding/incidents/:id", requireAuth, requireMinRole("senco"), (req, res) => {
  const { status, notes } = req.body;
  db_default.prepare(`UPDATE safeguarding_incidents SET status=?, notes=?, reviewed_by=?, reviewed_at=datetime('now') WHERE id=? AND school_id=?`).run(status, notes, req.user.id, req.params.id, req.user.schoolId);
  auditLog(req.user.id, req.user.schoolId ?? null, "safeguarding.incident_updated", "incident", req.params.id, { status }, req.ip ?? void 0);
  res.json({ message: "Incident updated" });
});
router3.post("/:id/assignments", requireAuth, (req, res) => {
  const pupil = db_default.prepare("SELECT id FROM pupils WHERE id = ? AND school_id = ?").get(req.params.id, req.user.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const { title, type, content, sections, subtitle, metadata } = req.body;
  if (!title || !type) return res.status(400).json({ error: "title and type required" });
  const id = uuidv45();
  db_default.prepare(`INSERT INTO assignments (id, pupil_id, assigned_by, title, subtitle, type, content, sections, metadata, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'not-started')`).run(
    id,
    req.params.id,
    req.user.id,
    title,
    subtitle || null,
    type,
    content || null,
    sections ? JSON.stringify(sections) : null,
    metadata ? JSON.stringify(metadata) : null
  );
  auditLog(req.user.id, req.user.schoolId ?? null, "assignment.created", "assignment", id, { title, type }, req.ip ?? void 0);
  res.status(201).json({ id });
});
router3.put("/:id/assignments/:assignmentId", requireAuth, (req, res) => {
  const { status, feedback, mark, progress, teacherComment, content } = req.body;
  db_default.prepare(`UPDATE assignments SET
    status=COALESCE(?,status), feedback=COALESCE(?,feedback),
    mark=COALESCE(?,mark), progress=COALESCE(?,progress),
    teacher_comment=COALESCE(?,teacher_comment),
    content=COALESCE(?,content)
    WHERE id=? AND pupil_id=?`).run(status ?? null, feedback ?? null, mark ?? null, progress ?? null, teacherComment ?? null, content ?? null, req.params.assignmentId, req.params.id);
  res.json({ message: "Assignment updated" });
});
router3.delete("/:id/assignments/:assignmentId", requireAuth, (req, res) => {
  const pupil = db_default.prepare("SELECT id FROM pupils WHERE id = ? AND school_id = ?").get(req.params.id, req.user.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  db_default.prepare("DELETE FROM assignments WHERE id = ? AND pupil_id = ?").run(req.params.assignmentId, req.params.id);
  auditLog(req.user.id, req.user.schoolId ?? null, "assignment.deleted", "assignment", req.params.assignmentId, {}, req.ip ?? void 0);
  res.json({ ok: true });
});
router3.post("/:id/attendance", requireAuth, (req, res) => {
  const { date, amStatus, amReason, pmStatus, pmReason, notes } = req.body;
  const pupilId = req.params.id;
  db_default.prepare(`INSERT INTO attendance_records (id, school_id, pupil_id, recorded_by, date, am_status, am_reason, pm_status, pm_reason, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(pupil_id, date) DO UPDATE SET
      am_status=excluded.am_status, am_reason=excluded.am_reason,
      pm_status=excluded.pm_status, pm_reason=excluded.pm_reason,
      notes=excluded.notes, recorded_by=excluded.recorded_by, recorded_at=datetime('now')`).run(
    uuidv45(),
    req.user.schoolId,
    pupilId,
    req.user.id,
    date,
    amStatus,
    amReason || null,
    pmStatus,
    pmReason || null,
    notes || null
  );
  res.json({ message: "Attendance recorded" });
});
router3.post("/:id/behaviour", requireAuth, (req, res) => {
  const { type, category, description, actionTaken, date } = req.body;
  const id = uuidv45();
  db_default.prepare(`INSERT INTO behaviour_records (id, school_id, pupil_id, recorded_by, type, category, description, action_taken, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    req.user.schoolId,
    req.params.id,
    req.user.id,
    type,
    category || null,
    description,
    actionTaken || null,
    date
  );
  auditLog(req.user.id, req.user.schoolId ?? null, "behaviour.recorded", "behaviour", id, { type }, req.ip ?? void 0);
  res.status(201).json({ id });
});
router3.get("/:id/support-plans", requireAuth, (req, res) => {
  const pupil = db_default.prepare("SELECT id FROM pupils WHERE id=? AND school_id=?").get(req.params.id, req.user.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const plans = db_default.prepare(
    `SELECT bsp.*, u.display_name as created_by_name
     FROM behaviour_support_plans bsp
     LEFT JOIN users u ON bsp.created_by = u.id
     WHERE bsp.pupil_id = ? AND bsp.school_id = ?
     ORDER BY bsp.created_at DESC`
  ).all(req.params.id, req.user.schoolId);
  res.json(plans);
});
router3.post("/:id/support-plans", requireAuth, (req, res) => {
  const { title, content, summary, strategies, positiveTargets, status, reviewDate, sharedWithParents } = req.body;
  if (!title || !content) return res.status(400).json({ error: "title and content required" });
  const pupil = db_default.prepare("SELECT id FROM pupils WHERE id=? AND school_id=?").get(req.params.id, req.user.schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const id = uuidv45();
  db_default.prepare(
    `INSERT INTO behaviour_support_plans (id, school_id, pupil_id, created_by, title, content, summary, strategies, positive_targets, status, review_date, shared_with_parents)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.user.schoolId,
    req.params.id,
    req.user.id,
    title,
    content,
    summary || null,
    strategies || null,
    positiveTargets || null,
    status || "active",
    reviewDate || null,
    sharedWithParents !== false ? 1 : 0
  );
  auditLog(req.user.id, req.user.schoolId ?? null, "support_plan.created", "behaviour_support_plans", id, { title }, req.ip ?? void 0);
  res.status(201).json({ id });
});
router3.put("/:id/support-plans/:planId", requireAuth, (req, res) => {
  const plan = db_default.prepare("SELECT * FROM behaviour_support_plans WHERE id=? AND school_id=?").get(req.params.planId, req.user.schoolId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  const { status, sharedWithParents } = req.body;
  db_default.prepare("UPDATE behaviour_support_plans SET status=?, shared_with_parents=?, updated_at=datetime('now') WHERE id=?").run(
    status || plan.status,
    sharedWithParents !== void 0 ? sharedWithParents ? 1 : 0 : plan.shared_with_parents,
    req.params.planId
  );
  res.json({ message: "Updated" });
});
router3.delete("/:id/support-plans/:planId", requireAuth, (req, res) => {
  const plan = db_default.prepare("SELECT * FROM behaviour_support_plans WHERE id=? AND school_id=?").get(req.params.planId, req.user.schoolId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  db_default.prepare("DELETE FROM behaviour_support_plans WHERE id=?").run(req.params.planId);
  res.json({ message: "Deleted" });
});
var pupils_default = router3;

// server/routes/ai.ts
import { Router as Router5 } from "express";
import { v4 as uuidv47 } from "uuid";
import multer from "multer";

// server/lib/contentFilter.ts
var SAFEGUARDING_PATTERNS = [
  // Self-harm / suicide
  /\b(self.?harm|self.?injur|cut(ting)? myself|hurt(ing)? myself|suicid|kill myself|end my life|want to die)\b/i,
  // Abuse indicators
  /\b(abuse|abused|hitting me|hurting me|touches me|touched me inappropriately|secret touches)\b/i,
  // Exploitation
  /\b(grooming|exploitation|county lines|gang|knife|weapon|drugs|dealing)\b/i,
  // Radicalisation
  /\b(radicalisation|extremis|terrorist|jihad|isis|far.?right|white.?supremac)\b/i,
  // Online safety
  /\b(stranger online|sent me photos|asked for photos|meet up|secret friend)\b/i
];
var INAPPROPRIATE_CONTENT = [
  /\b(pornograph|explicit sexual|nude|naked child)\b/i,
  /\b(violence against|murder|kill|bomb|attack)\b/i,
  /\b(racist|sexist|homophob|transphob|hate speech)\b/i
];
function filterContent(text) {
  for (const pattern of SAFEGUARDING_PATTERNS) {
    if (pattern.test(text)) {
      const match = text.match(pattern)?.[0];
      return {
        flagged: true,
        reason: `Potential safeguarding concern detected: "${match}"`,
        category: "safeguarding",
        severity: determineSeverity(pattern, text)
      };
    }
  }
  for (const pattern of INAPPROPRIATE_CONTENT) {
    if (pattern.test(text)) {
      const match = text.match(pattern)?.[0];
      return {
        flagged: true,
        reason: `Inappropriate content detected: "${match}"`,
        category: "inappropriate",
        severity: "medium"
      };
    }
  }
  return { flagged: false, category: "clean" };
}
function determineSeverity(pattern, text) {
  if (/suicid|kill myself|end my life|want to die|self.?harm/.test(text)) return "critical";
  if (/abuse|abused|touches me inappropriately/.test(text)) return "high";
  if (/grooming|exploitation|county lines/.test(text)) return "high";
  if (/radicalisation|extremis|terrorist/.test(text)) return "high";
  return "medium";
}

// server/routes/schoolApiKeys.ts
import { Router as Router4 } from "express";
import { v4 as uuidv46 } from "uuid";
import crypto from "crypto";
var router4 = Router4();
var _KEY_ENC_SECRET_RAW = process.env.KEY_ENCRYPTION_SECRET;
if (!_KEY_ENC_SECRET_RAW) {
  if (process.env.NODE_ENV === "production") {
    console.error("[SECURITY] FATAL: KEY_ENCRYPTION_SECRET env var is not set. School API keys will use an ephemeral random secret and will be unreadable after restart. Set KEY_ENCRYPTION_SECRET in Railway environment variables.");
  } else {
    console.warn("[SECURITY] DEV: KEY_ENCRYPTION_SECRET not set \u2014 using ephemeral secret. Set KEY_ENCRYPTION_SECRET in .env for persistent school API keys.");
  }
}
var ENC_SECRET = _KEY_ENC_SECRET_RAW || crypto.randomBytes(32).toString("hex");
var ENC_KEY = crypto.scryptSync(ENC_SECRET, "adaptly-salt", 32);
function encryptKey(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, tag]).toString("base64"),
    iv: iv.toString("base64")
  };
}
function decryptKey(encryptedB64, ivB64) {
  const iv = Buffer.from(ivB64, "base64");
  const data = Buffer.from(encryptedB64, "base64");
  const tag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
function getSchoolKey(schoolId, provider) {
  try {
    const row = db_default.prepare(
      "SELECT api_key_encrypted, api_key_iv, model, base_url FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
    ).get(schoolId, provider);
    if (!row) return null;
    const key = decryptKey(row.api_key_encrypted, row.api_key_iv);
    return { key, model: row.model || "", baseUrl: row.base_url || void 0 };
  } catch (_) {
    return null;
  }
}
router4.get("/", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });
  const rows = db_default.prepare(
    "SELECT id, provider, provider_label, model, base_url, enabled, updated_at FROM school_api_keys WHERE school_id=? ORDER BY provider"
  ).all(schoolId);
  const keys = rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    providerLabel: r.provider_label || r.provider,
    model: r.model || "",
    baseUrl: r.base_url || "",
    enabled: r.enabled === 1,
    updatedAt: r.updated_at,
    hasKey: true
  }));
  res.json({ keys });
});
router4.post("/", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });
  const { provider, apiKey, model, baseUrl, providerLabel } = req.body;
  if (!provider || !apiKey) return res.status(400).json({ error: "provider and apiKey are required" });
  if (apiKey.length < 8) return res.status(400).json({ error: "API key appears too short" });
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(provider)) {
    return res.status(400).json({ error: "Invalid provider name" });
  }
  const { encrypted, iv } = encryptKey(apiKey.trim());
  const existing = db_default.prepare("SELECT id FROM school_api_keys WHERE school_id=? AND provider=?").get(schoolId, provider);
  if (existing) {
    db_default.prepare(
      "UPDATE school_api_keys SET api_key_encrypted=?, api_key_iv=?, model=?, base_url=?, provider_label=?, enabled=1, added_by=?, updated_at=datetime('now') WHERE school_id=? AND provider=?"
    ).run(encrypted, iv, model || null, baseUrl || null, providerLabel || provider, req.user.id, schoolId, provider);
  } else {
    db_default.prepare(
      "INSERT INTO school_api_keys (id, school_id, provider, provider_label, api_key_encrypted, api_key_iv, model, base_url, enabled, added_by) VALUES (?,?,?,?,?,?,?,?,1,?)"
    ).run(uuidv46(), schoolId, provider, providerLabel || provider, encrypted, iv, model || null, baseUrl || null, req.user.id);
  }
  auditLog(req.user.id, schoolId, "school.api_key_set", "school_api_keys", provider, { provider }, req.ip);
  res.json({ success: true, message: `${providerLabel || provider} key saved successfully` });
});
router4.put("/:id", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });
  const { apiKey, model, baseUrl, providerLabel } = req.body;
  const row = db_default.prepare("SELECT * FROM school_api_keys WHERE id=? AND school_id=?").get(req.params.id, schoolId);
  if (!row) return res.status(404).json({ error: "Key not found" });
  if (apiKey && apiKey.trim()) {
    const { encrypted, iv } = encryptKey(apiKey.trim());
    db_default.prepare(
      "UPDATE school_api_keys SET api_key_encrypted=?, api_key_iv=?, model=?, base_url=?, provider_label=?, added_by=?, updated_at=datetime('now') WHERE id=? AND school_id=?"
    ).run(encrypted, iv, model || row.model || null, baseUrl || row.base_url || null, providerLabel || row.provider_label, req.user.id, req.params.id, schoolId);
  } else {
    db_default.prepare(
      "UPDATE school_api_keys SET model=?, base_url=?, provider_label=?, updated_at=datetime('now') WHERE id=? AND school_id=?"
    ).run(model || row.model || null, baseUrl || row.base_url || null, providerLabel || row.provider_label, req.params.id, schoolId);
  }
  auditLog(req.user.id, schoolId, "school.api_key_updated", "school_api_keys", row.provider, { provider: row.provider }, req.ip);
  res.json({ success: true, message: "Key updated successfully" });
});
router4.delete("/:provider", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });
  db_default.prepare("DELETE FROM school_api_keys WHERE school_id=? AND provider=?").run(schoolId, req.params.provider);
  auditLog(req.user.id, schoolId, "school.api_key_deleted", "school_api_keys", req.params.provider, {}, req.ip);
  res.json({ success: true });
});
router4.patch("/:provider/toggle", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });
  const row = db_default.prepare("SELECT enabled FROM school_api_keys WHERE school_id=? AND provider=?").get(schoolId, req.params.provider);
  if (!row) return res.status(404).json({ error: "Provider not found" });
  const newEnabled = row.enabled === 1 ? 0 : 1;
  db_default.prepare("UPDATE school_api_keys SET enabled=? WHERE school_id=? AND provider=?").run(newEnabled, schoolId, req.params.provider);
  res.json({ success: true, enabled: newEnabled === 1 });
});
router4.get("/status", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.json({ hasKeys: false, count: 0 });
  const count = db_default.prepare("SELECT COUNT(*) as c FROM school_api_keys WHERE school_id=? AND enabled=1").get(schoolId)?.c || 0;
  res.json({ hasKeys: count > 0, count });
});
var schoolApiKeys_default = router4;

// server/lib/diagramBank.ts
var DIAGRAM_BANK = [
  // ── BIOLOGY — Cells ───────────────────────────────────────────────────────
  {
    key: "animal_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/960px-Animal_cell_structure_en.svg.png",
    label: "Animal Cell Structure",
    attribution: "LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["animal cell", "eukaryotic cell", "animal cells", "cell structure", "cell organelles", "nucleus", "mitochondria", "ribosomes", "cytoplasm"]
  },
  {
    key: "plant_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Plant_cell_structure_svg_labels.svg/960px-Plant_cell_structure_svg_labels.svg.png",
    label: "Plant Cell Structure",
    attribution: "LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["plant cell", "plant cells", "plant cell structure", "chloroplast", "cell wall", "vacuole", "plant organelles"]
  },
  {
    key: "cell_membrane",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cell_membrane_detailed_diagram_en.svg/960px-Cell_membrane_detailed_diagram_en.svg.png",
    label: "Cell Membrane Structure",
    attribution: "LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["cell membrane", "plasma membrane", "phospholipid bilayer", "membrane structure", "membrane proteins"]
  },
  {
    key: "mitosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Animal_cell_cycle-en.svg/960px-Animal_cell_cycle-en.svg.png",
    label: "Mitosis \u2014 Cell Division Stages",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["mitosis", "cell division", "cell cycle", "prophase", "metaphase", "anaphase", "telophase", "interphase"]
  },
  {
    key: "meiosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Meiosis_Overview_new.svg/960px-Meiosis_Overview_new.svg.png",
    label: "Meiosis Overview",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["meiosis", "sexual reproduction", "gametes", "meiosis stages", "haploid", "diploid"]
  },
  {
    key: "prokaryotic_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Prokaryote_cell.svg/960px-Prokaryote_cell.svg.png",
    label: "Prokaryotic Cell Structure",
    attribution: "Mariana Ruiz LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["prokaryotic cell", "prokaryote", "bacteria cell", "bacterial cell", "prokaryotes", "bacteria structure"]
  },
  // ── BIOLOGY — Human Body ──────────────────────────────────────────────────
  {
    key: "heart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Heart_diagram-en.svg/960px-Heart_diagram-en.svg.png",
    label: "Human Heart Diagram",
    attribution: "Wapcaplet, Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["heart", "human heart", "cardiac", "heart structure", "heart diagram", "circulatory system", "atrium", "ventricle", "aorta"]
  },
  {
    key: "lungs",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Respiratory_system_complete_en.svg/500px-Respiratory_system_complete_en.svg.png",
    label: "Human Respiratory System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["lungs", "respiratory system", "breathing", "alveoli", "trachea", "bronchi", "gas exchange", "diaphragm"]
  },
  {
    key: "digestive_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Digestive_system_diagram_en.svg/500px-Digestive_system_diagram_en.svg.png",
    label: "Human Digestive System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["digestive system", "digestion", "stomach", "intestine", "small intestine", "large intestine", "oesophagus", "liver", "pancreas"]
  },
  {
    key: "nervous_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Nervous_system_diagram-en.svg/330px-Nervous_system_diagram-en.svg.png",
    label: "Human Nervous System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nervous system", "neurons", "brain", "spinal cord", "nerve", "reflex arc", "central nervous system", "peripheral nervous system"]
  },
  {
    key: "skeleton",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Human_skeleton_front_en.svg/500px-Human_skeleton_front_en.svg.png",
    label: "Human Skeleton",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["skeleton", "bones", "human skeleton", "skeletal system", "skull", "femur", "tibia", "ribcage", "spine"]
  },
  {
    key: "eye",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Schematic_diagram_of_the_human_eye_en.svg/960px-Schematic_diagram_of_the_human_eye_en.svg.png",
    label: "Human Eye Structure",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["eye", "human eye", "retina", "cornea", "lens", "iris", "pupil", "optic nerve", "eye structure"]
  },
  {
    key: "ear",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Anatomy_of_the_Human_Ear.svg/960px-Anatomy_of_the_Human_Ear.svg.png",
    label: "Human Ear Structure",
    attribution: "Chittka L, Brockmann, Wikimedia Commons (CC BY 2.5)",
    keywords: ["ear", "human ear", "cochlea", "eardrum", "hearing", "inner ear", "outer ear", "ossicles"]
  },
  {
    key: "kidney",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Kidney_Cross_Section.svg/960px-Kidney_Cross_Section.svg.png",
    label: "Kidney Cross-Section",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["kidney", "kidneys", "nephron", "renal system", "excretion", "filtration", "urine", "cortex", "medulla"]
  },
  {
    key: "brain",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Brain_diagram_fr.svg/960px-Brain_diagram_fr.svg.png",
    label: "Human Brain Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["brain", "human brain", "cerebrum", "cerebellum", "brain stem", "medulla", "frontal lobe", "temporal lobe"]
  },
  {
    key: "blood_cells",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Blausen_0425_Formed_Elements.png/960px-Blausen_0425_Formed_Elements.png",
    label: "Blood Cells",
    attribution: "BruceBlaus, Wikimedia Commons (CC BY 3.0)",
    keywords: ["blood cells", "red blood cells", "white blood cells", "platelets", "blood", "haemoglobin", "erythrocytes", "leucocytes"]
  },
  {
    key: "human_body_organs",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Blausen_0316_DigestiveSystem.png/960px-Blausen_0316_DigestiveSystem.png",
    label: "Human Body \u2014 Main Organs",
    attribution: "BruceBlaus, Wikimedia Commons (CC BY 3.0)",
    keywords: ["human body", "organs", "body parts", "ks2 science", "primary science", "organ systems"]
  },
  {
    key: "teeth_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Teeth_types_colored.png",
    label: "Types of Teeth",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["teeth", "types of teeth", "incisor", "canine", "molar", "premolar", "dental", "ks2 science"]
  },
  // ── BIOLOGY — Plants & Ecosystems ────────────────────────────────────────
  {
    key: "photosynthesis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/960px-Photosynthesis_en.svg.png",
    label: "Photosynthesis Process",
    attribution: "At09kg, Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["photosynthesis", "chlorophyll", "light reaction", "glucose", "oxygen", "carbon dioxide", "chloroplast", "light energy"]
  },
  {
    key: "leaf_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Leaf_Structure.svg/960px-Leaf_Structure.svg.png",
    label: "Leaf Structure (Cross-Section)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["leaf", "leaf structure", "leaf cross section", "stomata", "palisade cells", "mesophyll", "epidermis", "guard cells"]
  },
  {
    key: "flower_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Mature_flower_diagram.svg/960px-Mature_flower_diagram.svg.png",
    label: "Flower Structure",
    attribution: "Mariana Ruiz LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["flower", "flower structure", "pollination", "stamen", "pistil", "petal", "sepal", "anther", "ovary", "parts of a plant"]
  },
  {
    key: "food_chain",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/FoodChain.svg/960px-FoodChain.svg.png",
    label: "Food Chain",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["food chain", "food web", "producer", "consumer", "predator", "prey", "trophic level", "ecosystem", "habitats"]
  },
  {
    key: "carbon_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Carbon_cycle-cute_diagram.svg/960px-Carbon_cycle-cute_diagram.svg.png",
    label: "Carbon Cycle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["carbon cycle", "carbon dioxide", "respiration", "decomposition", "fossil fuels", "atmosphere", "global warming"]
  },
  {
    key: "nitrogen_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Nitrogen_Cycle.svg/960px-Nitrogen_Cycle.svg.png",
    label: "Nitrogen Cycle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nitrogen cycle", "nitrogen fixation", "nitrification", "denitrification", "ammonia", "nitrates", "bacteria"]
  },
  {
    key: "water_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Water_cycle_complete.png/960px-Water_cycle_complete.png",
    label: "Water Cycle",
    attribution: "USGS, Wikimedia Commons (Public Domain)",
    keywords: ["water cycle", "evaporation", "condensation", "precipitation", "transpiration", "runoff", "hydrological cycle", "rain"]
  },
  {
    key: "dna_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/500px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
    label: "DNA Double Helix Structure",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["dna", "dna structure", "double helix", "nucleotide", "base pairs", "adenine", "thymine", "guanine", "cytosine", "genetics"]
  },
  {
    key: "natural_selection",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Mutation_and_selection_diagram.svg/960px-Mutation_and_selection_diagram.svg.png",
    label: "Natural Selection",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["natural selection", "evolution", "adaptation", "survival of the fittest", "mutation", "variation", "darwin"]
  },
  {
    key: "enzyme",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Induced_fit_diagram.svg/960px-Induced_fit_diagram.svg.png",
    label: "Enzyme Action (Lock and Key / Induced Fit)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["enzyme", "enzymes", "lock and key", "active site", "substrate", "enzyme action", "induced fit", "enzyme substrate complex"]
  },
  {
    key: "osmosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Osmosis_diagram.svg/960px-Osmosis_diagram.svg.png",
    label: "Osmosis",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["osmosis", "semi-permeable membrane", "concentration gradient", "water potential", "turgor pressure"]
  },
  {
    key: "diffusion",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Diffusion.svg/960px-Diffusion.svg.png",
    label: "Diffusion",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["diffusion", "concentration gradient", "particles", "random movement", "passive transport", "net movement"]
  },
  {
    key: "life_cycle_butterfly",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Butterfly_Life_Cycle_Chart%2C_Metamorphosis_Lab_in_the_Grand_Atrium%2C_Franklin_Park_Conservatory%2C_Columbus%2C_Ohio.jpg/960px-Butterfly_Life_Cycle_Chart%2C_Metamorphosis_Lab_in_the_Grand_Atrium%2C_Franklin_Park_Conservatory%2C_Columbus%2C_Ohio.jpg",
    label: "Life Cycle of a Butterfly",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["life cycle", "butterfly", "metamorphosis", "egg", "caterpillar", "larva", "pupa", "chrysalis", "ks2 science"]
  },
  {
    key: "life_cycle_frog",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Metamorphosis_frog_Meyers.png",
    label: "Life Cycle of a Frog",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["life cycle frog", "frog", "tadpole", "spawn", "amphibian", "metamorphosis", "ks2 science"]
  },
  {
    key: "seasons",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Seasons1.svg/960px-Seasons1.svg.png",
    label: "The Four Seasons",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["seasons", "four seasons", "spring", "summer", "autumn", "winter", "earth orbit", "ks1 science", "ks2 science"]
  },
  {
    key: "solar_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Planets2013.svg/960px-Planets2013.svg.png",
    label: "The Solar System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["solar system", "planets", "sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "space", "ks2 science"]
  },
  {
    key: "moon_phases",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Moon_phases_en.jpg/960px-Moon_phases_en.jpg",
    label: "Phases of the Moon",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["moon phases", "phases of the moon", "new moon", "full moon", "crescent", "waxing", "waning", "ks2 science"]
  },
  {
    key: "sound_waves",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Sine_wave.svg/960px-Sine_wave.svg.png",
    label: "Sound Waves",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["sound", "sound waves", "vibration", "pitch", "volume", "frequency", "amplitude", "longitudinal wave"]
  },
  // ── CHEMISTRY ─────────────────────────────────────────────────────────────
  {
    key: "atom_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Helium_atom_QM.svg/960px-Helium_atom_QM.svg.png",
    label: "Atomic Structure (Bohr Model)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["atom", "atomic structure", "bohr model", "electron", "proton", "neutron", "nucleus", "electron shell", "orbit", "atomic model"]
  },
  {
    key: "periodic_table",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b6/PTable_structure.png",
    label: "Periodic Table Structure",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["periodic table", "elements", "groups", "periods", "metals", "non-metals", "atomic number", "chemical elements"]
  },
  {
    key: "ionic_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a8/NaF.gif",
    label: "Ionic Bonding",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["ionic bonding", "ionic bond", "ions", "sodium chloride", "nacl", "electron transfer", "electrostatic attraction", "ionic compound"]
  },
  {
    key: "covalent_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Covalent_bond_hydrogen.svg/960px-Covalent_bond_hydrogen.svg.png",
    label: "Covalent Bonding",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["covalent bonding", "covalent bond", "shared electrons", "molecule", "h2", "hydrogen molecule", "molecular bonding"]
  },
  {
    key: "states_of_matter",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Solid_liquid_gas.svg/960px-Solid_liquid_gas.svg.png",
    label: "States of Matter",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["states of matter", "solid", "liquid", "gas", "melting", "freezing", "evaporation", "condensation", "sublimation", "particle model"]
  },
  {
    key: "chromatography",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Chromatography_of_chlorophyll_-_Step_4.jpg",
    label: "Paper Chromatography",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["chromatography", "paper chromatography", "separation", "rf value", "solvent", "mixture separation", "pigments"]
  },
  {
    key: "distillation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Simple_distillation_apparatus.svg/960px-Simple_distillation_apparatus.svg.png",
    label: "Simple Distillation Apparatus",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["distillation", "simple distillation", "fractional distillation", "condenser", "separation", "boiling point", "flask"]
  },
  {
    key: "ph_scale",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/PH_scale.svg/960px-PH_scale.svg.png",
    label: "pH Scale",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["ph scale", "acid", "alkali", "neutral", "ph", "indicator", "acidic", "alkaline", "universal indicator"]
  },
  {
    key: "electrolysis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Electrolysis_of_water_with_diagram.png/960px-Electrolysis_of_water_with_diagram.png",
    label: "Electrolysis",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electrolysis", "electrode", "anode", "cathode", "electrolyte", "decomposition", "electrochemistry", "copper sulfate"]
  },
  // ── PHYSICS ───────────────────────────────────────────────────────────────
  {
    key: "transverse_wave",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Sine_wave_amplitude.svg/960px-Sine_wave_amplitude.svg.png",
    label: "Transverse Wave \u2014 Amplitude and Wavelength",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["transverse wave", "wave", "amplitude", "wavelength", "crest", "trough", "frequency", "wave diagram", "oscillation"]
  },
  {
    key: "electromagnetic_spectrum",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/EM_spectrum.svg/960px-EM_spectrum.svg.png",
    label: "Electromagnetic Spectrum",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electromagnetic spectrum", "em spectrum", "radio waves", "microwaves", "infrared", "visible light", "ultraviolet", "x-rays", "gamma rays"]
  },
  {
    key: "electric_circuit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Circuit_elements.svg/960px-Circuit_elements.svg.png",
    label: "Electric Circuit Symbols",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electric circuit", "circuit symbols", "resistor", "capacitor", "battery", "bulb", "switch", "ammeter", "voltmeter", "circuit diagram"]
  },
  {
    key: "series_parallel_circuit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Series_and_parallel_circuits.svg/960px-Series_and_parallel_circuits.svg.png",
    label: "Series and Parallel Circuits",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["series circuit", "parallel circuit", "series and parallel", "current", "voltage", "resistance", "ohm's law"]
  },
  {
    key: "forces",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Free_body_diagram2.svg/960px-Free_body_diagram2.svg.png",
    label: "Free Body Diagram \u2014 Forces",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["forces", "free body diagram", "balanced forces", "unbalanced forces", "weight", "normal force", "friction", "resultant force", "newton"]
  },
  {
    key: "refraction",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Snells_law2.svg/960px-Snells_law2.svg.png",
    label: "Refraction of Light (Snell's Law)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["refraction", "snell's law", "light", "angle of incidence", "angle of refraction", "normal line", "optics", "bending light"]
  },
  {
    key: "reflection",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Reflection_angles.svg/960px-Reflection_angles.svg.png",
    label: "Reflection of Light",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["reflection", "angle of incidence", "angle of reflection", "mirror", "light reflection", "normal", "law of reflection"]
  },
  {
    key: "nuclear_fission",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Nuclear_fission.svg/960px-Nuclear_fission.svg.png",
    label: "Nuclear Fission",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nuclear fission", "fission", "nuclear reaction", "uranium", "chain reaction", "neutron", "radioactive", "nuclear energy"]
  },
  {
    key: "radioactive_decay",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Radioactive_decay_chains_diagram.svg/960px-Radioactive_decay_chains_diagram.svg.png",
    label: "Radioactive Decay",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["radioactive decay", "alpha decay", "beta decay", "gamma radiation", "half-life", "radioactivity", "nuclear decay", "isotopes"]
  },
  {
    key: "pressure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Pressure_force_area.svg/960px-Pressure_force_area.svg.png",
    label: "Pressure = Force \xF7 Area",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["pressure", "force", "area", "pressure formula", "pascal", "pressure equation", "p = f/a"]
  },
  {
    key: "magnetic_field",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Magnet0873.png/960px-Magnet0873.png",
    label: "Magnetic Field Lines",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["magnetic field", "magnetic field lines", "magnet", "north pole", "south pole", "electromagnet", "magnets", "ks2 science"]
  },
  // ── GEOGRAPHY ─────────────────────────────────────────────────────────────
  {
    key: "volcano",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Volcano_scheme.svg/960px-Volcano_scheme.svg.png",
    label: "Volcano Cross-Section",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["volcano", "volcanic eruption", "magma", "lava", "crater", "vent", "tectonic plates", "composite volcano", "shield volcano"]
  },
  {
    key: "tectonic_plates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Tectonic_plates.png/960px-Tectonic_plates.png",
    label: "Tectonic Plates Map",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["tectonic plates", "plate tectonics", "plate boundaries", "continental drift", "subduction", "collision", "divergent", "convergent"]
  },
  {
    key: "plate_boundaries",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Tectonic_plate_boundaries.png",
    label: "Types of Plate Boundaries",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["plate boundary", "constructive boundary", "destructive boundary", "conservative boundary", "transform fault", "ridge", "trench"]
  },
  {
    key: "glaciation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Glacial_landscape.svg/960px-Glacial_landscape.svg.png",
    label: "Glacial Landforms",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["glaciation", "glacier", "glacial landforms", "corrie", "ar\xEAte", "horn", "u-shaped valley", "moraine", "drumlin", "ice age"]
  },
  {
    key: "rock_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Rock_cycle_nps.gif/960px-Rock_cycle_nps.gif",
    label: "The Rock Cycle",
    attribution: "NPS, Wikimedia Commons (Public Domain)",
    keywords: ["rock cycle", "igneous", "sedimentary", "metamorphic", "weathering", "erosion", "magma", "rocks", "geology"]
  },
  {
    key: "compass_directions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Compass_card_en.svg/500px-Compass_card_en.svg.png",
    label: "Compass Directions",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["compass", "compass directions", "north", "south", "east", "west", "compass rose", "map skills", "geography ks2", "cardinal directions"]
  },
  {
    key: "population_pyramid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Population_pyramid_of_World_%282019%29.png/500px-Population_pyramid_of_World_%282019%29.png",
    label: "Population Pyramid",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["population pyramid", "age-sex pyramid", "birth rate", "death rate", "population structure", "demographics", "population"]
  },
  {
    key: "river_processes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/River_meander.svg/960px-River_meander.svg.png",
    label: "River Meander and Processes",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["river meander", "meander", "erosion", "deposition", "river", "oxbow lake", "lateral erosion", "river processes", "fluvial"]
  },
  // ── MATHS ─────────────────────────────────────────────────────────────────
  {
    key: "pythagoras",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pythagorean.svg/960px-Pythagorean.svg.png",
    label: "Pythagoras' Theorem",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["pythagoras", "pythagorean theorem", "right-angled triangle", "hypotenuse", "a squared b squared c squared", "right angle triangle"]
  },
  {
    key: "circle_parts",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Circle-withsegments.svg/960px-Circle-withsegments.svg.png",
    label: "Parts of a Circle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["circle", "parts of a circle", "radius", "diameter", "circumference", "chord", "arc", "sector", "segment", "tangent"]
  },
  {
    key: "angles",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Angle_types.svg/960px-Angle_types.svg.png",
    label: "Types of Angles",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["angles", "acute angle", "obtuse angle", "right angle", "reflex angle", "straight angle", "types of angles", "geometry"]
  },
  {
    key: "number_line",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Number-line.svg/960px-Number-line.svg.png",
    label: "Number Line",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["number line", "integers", "negative numbers", "positive numbers", "ordering numbers", "ks2 maths", "ks3 maths", "directed numbers"]
  },
  {
    key: "multiplication_table",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Multiplication_table_to_scale.svg/960px-Multiplication_table_to_scale.svg.png",
    label: "Multiplication Table",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["multiplication", "times tables", "multiplication table", "times table", "ks2 maths", "primary maths"]
  },
  {
    key: "fractions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cake_fractions.svg/960px-Cake_fractions.svg.png",
    label: "Fractions",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["fractions", "numerator", "denominator", "half", "quarter", "thirds", "equivalent fractions", "ks2 maths", "proper fractions"]
  },
  {
    key: "venn_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Venn0001.svg/960px-Venn0001.svg.png",
    label: "Venn Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["venn diagram", "sets", "intersection", "union", "set notation", "probability", "maths"]
  },
  {
    key: "3d_shapes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/SolidShapes.png/960px-SolidShapes.png",
    label: "3D Shapes",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["3d shapes", "cube", "cuboid", "sphere", "cylinder", "cone", "pyramid", "prism", "polyhedron", "ks2 maths", "ks3 maths", "solid shapes"]
  },
  {
    key: "pie_chart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Composition_of_the_German_Bundesrat_as_a_pie_chart_small.svg/960px-Composition_of_the_German_Bundesrat_as_a_pie_chart_small.svg.png",
    label: "Pie Chart",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["pie chart", "pie graph", "sector", "percentage", "proportion", "data", "statistics", "maths"]
  },
  // ── HISTORY ───────────────────────────────────────────────────────────────
  {
    key: "ww1_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Europe_1914.jpg/960px-Europe_1914.jpg",
    label: "Europe 1914 \u2014 World War I",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["world war 1", "ww1", "world war one", "first world war", "trench warfare", "western front", "allies", "triple entente", "europe 1914"]
  },
  {
    key: "ww2_europe",
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Second_world_war_europe_1939_map_pl2.png",
    label: "World War II \u2014 Europe 1939",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["world war 2", "ww2", "world war two", "second world war", "nazi germany", "axis powers", "allied powers", "d-day", "europe 1939"]
  },
  {
    key: "trench_warfare",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Trench_construction_diagram_1914.svg/960px-Trench_construction_diagram_1914.svg.png",
    label: "Trench Construction Diagram (1914)",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["trench warfare", "trenches", "no man's land", "front line", "ww1 trenches", "dugout", "trench construction"]
  },
  {
    key: "roman_empire",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Roman_Empire_Trajan_117AD.png/960px-Roman_Empire_Trajan_117AD.png",
    label: "Roman Empire at its Greatest Extent",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["roman empire", "romans", "rome", "roman britain", "julius caesar", "roman history", "ancient rome"]
  },
  // ── COMPUTER SCIENCE ──────────────────────────────────────────────────────
  {
    key: "binary",
    url: "https://upload.wikimedia.org/wikipedia/commons/7/75/Binary_counter.gif",
    label: "Binary Number System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["binary", "binary numbers", "binary code", "bits", "bytes", "denary", "hexadecimal", "number systems", "computer science"]
  },
  {
    key: "logic_gates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Logic-gate-index.png/960px-Logic-gate-index.png",
    label: "Logic Gates",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["logic gates", "and gate", "or gate", "not gate", "nand gate", "nor gate", "xor gate", "boolean logic", "computer science"]
  },
  {
    key: "network_topologies",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/NetworkTopologies.svg/960px-NetworkTopologies.svg.png",
    label: "Network Topologies",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["network topology", "bus topology", "star topology", "ring topology", "mesh topology", "computer network", "networking"]
  },
  {
    key: "cpu_architecture",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d8/ABasicComputer.gif",
    label: "CPU Architecture",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["cpu", "processor", "alu", "control unit", "registers", "fetch decode execute", "von neumann", "computer architecture", "computer science"]
  },
  {
    key: "flowchart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/LampFlowchart.svg/960px-LampFlowchart.svg.png",
    label: "Flowchart Symbols",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["flowchart", "algorithm", "flow chart", "decision", "process", "start", "end", "programming", "pseudocode", "computer science"]
  },
  // ── ECONOMICS / BUSINESS ─────────────────────────────────────────────────────────────
  {
    key: "supply_demand",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Supply-demand-right-shift-demand.svg/960px-Supply-demand-right-shift-demand.svg.png",
    label: "Supply and Demand Curve",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["supply and demand", "demand curve", "supply curve", "equilibrium", "price", "quantity", "market", "economics"]
  },
  // ── MATHEMATICS — Year 11 / GCSE ───────────────────────────────────────────────────
  {
    key: "quadratic_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Polynomialdeg2.svg/640px-Polynomialdeg2.svg.png",
    label: "Quadratic Function Graph (Parabola)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["quadratic", "quadratic equation", "quadratic formula", "parabola", "quadratic graph", "completing the square", "roots", "vertex", "discriminant", "quadratic function"]
  },
  {
    key: "trigonometry_right_triangle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trigonometry_triangle.svg/640px-Trigonometry_triangle.svg.png",
    label: "Trigonometry \u2014 Right-Angled Triangle (SOH CAH TOA)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["trigonometry", "soh cah toa", "sine", "cosine", "tangent", "right angle triangle", "trig ratios", "sin cos tan", "adjacent", "opposite", "hypotenuse", "trig"]
  },
  {
    key: "straight_line_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Linear_Function_Graph.svg/640px-Linear_Function_Graph.svg.png",
    label: "Straight Line Graph (y = mx + c)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["straight line", "linear graph", "y = mx + c", "gradient", "y-intercept", "slope", "linear equation", "coordinate geometry", "linear function"]
  },
  {
    key: "circle_theorems",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Circle_theorem_1.svg/640px-Circle_theorem_1.svg.png",
    label: "Circle Theorems",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["circle theorems", "angle at centre", "angle in semicircle", "cyclic quadrilateral", "tangent", "chord", "arc", "inscribed angle", "circle geometry"]
  },
  {
    key: "vectors_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Vector_from_A_to_B.svg/640px-Vector_from_A_to_B.svg.png",
    label: "Vectors \u2014 Direction and Magnitude",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["vectors", "vector addition", "vector subtraction", "magnitude", "direction", "column vector", "resultant vector", "vector diagram"]
  },
  {
    key: "histogram_stats",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Histogram_of_arrivals_per_minute.svg/640px-Histogram_of_arrivals_per_minute.svg.png",
    label: "Histogram \u2014 Frequency Density",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["histogram", "frequency density", "class width", "grouped data", "frequency distribution", "statistics", "data representation"]
  },
  {
    key: "probability_tree",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Probability_tree_diagram.svg/640px-Probability_tree_diagram.svg.png",
    label: "Probability Tree Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["probability tree", "tree diagram", "conditional probability", "independent events", "dependent events", "probability", "combined probability"]
  },
  {
    key: "transformation_geometry",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Rotation_illustration2.svg/640px-Rotation_illustration2.svg.png",
    label: "Geometric Transformations",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["transformation", "rotation", "reflection", "translation", "enlargement", "scale factor", "centre of rotation", "congruence", "similarity", "transformations"]
  },
  // ── MATHEMATICS — Year 6 / KS2 ──────────────────────────────────────────────────────
  {
    key: "area_perimeter",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Perimeter_area.svg/640px-Perimeter_area.svg.png",
    label: "Area and Perimeter of Shapes",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["area", "perimeter", "rectangle area", "square area", "triangle area", "area formula", "perimeter formula", "length width", "compound shapes"]
  },
  {
    key: "coordinates_grid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Cartesian-coordinate-system.svg/640px-Cartesian-coordinate-system.svg.png",
    label: "Coordinate Grid (x and y axes)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["coordinates", "coordinate grid", "x axis", "y axis", "cartesian", "plotting points", "ordered pairs", "four quadrants", "grid"]
  },
  {
    key: "fractions_decimals_percentages",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Fraction_circles.svg/640px-Fraction_circles.svg.png",
    label: "Fractions, Decimals and Percentages",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["fractions", "decimals", "percentages", "equivalent fractions", "converting fractions", "fraction decimal percentage", "fdp", "mixed numbers", "improper fractions"]
  },
  {
    key: "bar_chart_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Simple_bar_chart.svg/640px-Simple_bar_chart.svg.png",
    label: "Bar Chart",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["bar chart", "bar graph", "data handling", "tally chart", "pictogram", "frequency chart"]
  },
  {
    key: "ratio_proportion_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ratio_example.svg/640px-Ratio_example.svg.png",
    label: "Ratio and Proportion",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["ratio", "proportion", "sharing in a ratio", "equivalent ratio", "simplifying ratio", "direct proportion", "unitary method"]
  },
  // ── SCIENCE — Year 11 / GCSE ─────────────────────────────────────────────────────────
  {
    key: "velocity_time_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Velocity_time_graph.svg/640px-Velocity_time_graph.svg.png",
    label: "Velocity-Time Graph",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["velocity time graph", "speed time graph", "acceleration", "deceleration", "distance", "area under graph", "motion graph", "kinematics"]
  },
  {
    key: "nuclear_atom_gcse",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Helium_atom_QM.svg/640px-Helium_atom_QM.svg.png",
    label: "Nuclear Atom Structure",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nuclear model", "atom structure", "proton", "neutron", "electron", "nucleus", "atomic number", "mass number", "isotopes", "bohr model", "nuclear atom"]
  },
  {
    key: "hormone_endocrine",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Endocrine_English.svg/640px-Endocrine_English.svg.png",
    label: "Endocrine System \u2014 Hormones",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["hormones", "endocrine system", "glands", "pituitary", "thyroid", "adrenal", "pancreas", "insulin", "glucagon", "adrenaline", "oestrogen", "testosterone"]
  },
  {
    key: "respiration_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Cellular_respiration.svg/640px-Cellular_respiration.svg.png",
    label: "Cellular Respiration",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["respiration", "cellular respiration", "aerobic respiration", "anaerobic respiration", "glucose", "atp", "mitochondria", "oxygen", "carbon dioxide", "lactic acid"]
  },
  {
    key: "electromagnetic_induction_coil",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/VFPt_Solenoid_correct2.svg/640px-VFPt_Solenoid_correct2.svg.png",
    label: "Electromagnetic Induction \u2014 Solenoid",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electromagnetic induction", "solenoid", "coil", "magnetic flux", "faraday", "lenz", "generator", "transformer", "induced emf", "induced current"]
  },
  {
    key: "alpha_beta_gamma",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Alpha_Decay.svg/640px-Alpha_Decay.svg.png",
    label: "Nuclear Decay \u2014 Alpha, Beta, Gamma",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nuclear decay", "alpha decay", "beta decay", "gamma radiation", "radioactive decay", "half life", "nuclear equation", "radiation types", "ionising radiation"]
  },
  // ── SCIENCE — Year 6 / KS2 ────────────────────────────────────────────────────────────
  {
    key: "classification_living_things",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Biological_classification_L_Pengo_vflip.svg/640px-Biological_classification_L_Pengo_vflip.svg.png",
    label: "Classification of Living Things",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["classification", "living things", "vertebrates", "invertebrates", "mammals", "reptiles", "amphibians", "fish", "birds", "taxonomy", "kingdom", "species"]
  },
  {
    key: "light_shadow_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Reflection_angles.svg/640px-Reflection_angles.svg.png",
    label: "Light \u2014 Reflection and Shadow (KS2)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["light", "shadow", "reflection", "angle of incidence", "angle of reflection", "normal", "light rays", "transparent", "opaque", "translucent"]
  },
  {
    key: "electricity_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Series_circuit.svg/640px-Series_circuit.svg.png",
    label: "Electricity \u2014 Simple Circuits (KS2)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electricity", "circuit", "battery", "bulb", "switch", "conductor", "insulator", "series circuit", "current", "voltage", "components", "ks2 electricity"]
  },
  {
    key: "forces_ks2_gravity",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Simple_gravity_pendulum.svg/640px-Simple_gravity_pendulum.svg.png",
    label: "Forces \u2014 Gravity, Friction, Air Resistance (KS2)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["forces ks2", "gravity ks2", "friction ks2", "air resistance", "push", "pull", "balanced forces", "unbalanced forces", "weight", "mass"]
  },
  {
    key: "food_web_habitat",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/FoodWeb.svg/640px-FoodWeb.svg.png",
    label: "Food Web \u2014 Habitats and Ecosystems",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["food web", "habitat", "ecosystem", "producer", "consumer", "predator", "prey", "herbivore", "carnivore", "omnivore", "decomposer"]
  },
  // ── MATHEMATICS — Number & Arithmetic ────────────────────────────────────
  {
    key: "place_value",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Positional_notation_glossary-en.svg/640px-Positional_notation_glossary-en.svg.png",
    label: "Place Value \u2014 Positional Notation",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["place value", "positional notation", "units", "tens", "hundreds", "thousands", "decimals", "number system", "digits"]
  },
  {
    key: "number_line",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Number-line.svg/640px-Number-line.svg.png",
    label: "Number Line",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["number line", "integers", "negative numbers", "ordering numbers", "rounding", "estimation", "whole numbers"]
  },
  {
    key: "fractions_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Cake_fractions.svg/640px-Cake_fractions.svg.png",
    label: "Fractions \u2014 Visual Representation",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["fractions", "numerator", "denominator", "equivalent fractions", "simplify fractions", "proper fraction", "improper fraction", "mixed number", "adding fractions", "subtracting fractions", "multiplying fractions", "dividing fractions"]
  },
  {
    key: "long_division",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Polynomial_long_division.svg/640px-Polynomial_long_division.svg.png",
    label: "Long Division Method",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["long division", "division", "remainder", "bus stop method", "short division", "dividing"]
  },
  {
    key: "venn_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Venn0001.svg/640px-Venn0001.svg.png",
    label: "Venn Diagram",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["venn diagram", "set notation", "intersection", "union", "sets", "factors", "multiples", "prime numbers", "hcf", "lcm"]
  },
  {
    key: "prime_factor_tree",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/PrimeTree.svg/640px-PrimeTree.svg.png",
    label: "Prime Factor Tree",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["prime factor tree", "prime factorisation", "factors", "prime numbers", "product of prime factors", "hcf", "lcm", "factor tree"]
  },
  // ── MATHEMATICS — Algebra ─────────────────────────────────────────────────
  {
    key: "cartesian_coordinates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Cartesian-coordinate-system.svg/640px-Cartesian-coordinate-system.svg.png",
    label: "Cartesian Coordinate System",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["coordinates", "cartesian", "x axis", "y axis", "plotting points", "graphs", "linear graphs", "quadratic graphs", "coordinate grid", "origin"]
  },
  {
    key: "linear_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Wiki_slope_in_2d.svg/640px-Wiki_slope_in_2d.svg.png",
    label: "Linear Graph \u2014 Gradient and Intercept",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["linear graph", "straight line graph", "gradient", "y intercept", "slope", "y=mx+c", "linear equation", "plotting graphs", "rate of change"]
  },
  {
    key: "quadratic_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Polynomialdeg2.svg/640px-Polynomialdeg2.svg.png",
    label: "Quadratic Graph \u2014 Parabola",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["quadratic graph", "parabola", "quadratic function", "quadratic equation", "completing the square", "roots", "turning point", "vertex", "quadratics"]
  },
  {
    key: "simultaneous_equations",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Intersecting_Lines.svg/640px-Intersecting_Lines.svg.png",
    label: "Simultaneous Equations \u2014 Graphical Solution",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["simultaneous equations", "intersecting lines", "elimination", "substitution", "linear simultaneous", "solve simultaneously", "system of equations"]
  },
  {
    key: "inequalities_number_line",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Inequalities_number_line.svg/640px-Inequalities_number_line.svg.png",
    label: "Inequalities \u2014 Number Line",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["inequalities", "number line", "greater than", "less than", "inequality symbols", "solving inequalities", "linear inequalities", "set notation"]
  },
  {
    key: "function_mapping",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Function_color_example_3.svg/640px-Function_color_example_3.svg.png",
    label: "Functions \u2014 Domain and Range Mapping",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["functions", "function machine", "domain", "range", "mapping", "input output", "inverse function", "composite function", "f(x)", "notation"]
  },
  {
    key: "sequences_arithmetic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Triangular_numbers_dot_animation.gif/320px-Triangular_numbers_dot_animation.gif",
    label: "Sequences \u2014 Arithmetic and Geometric",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["sequences", "arithmetic sequence", "geometric sequence", "nth term", "term to term rule", "common difference", "fibonacci", "triangular numbers", "square numbers"]
  },
  // ── MATHEMATICS — Geometry & Shape ───────────────────────────────────────
  {
    key: "angles_parallel_lines",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Parallel_lines_with_transversal.svg/640px-Parallel_lines_with_transversal.svg.png",
    label: "Angles in Parallel Lines",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["angles in parallel lines", "corresponding angles", "alternate angles", "co-interior angles", "transversal", "parallel lines", "f angles", "z angles", "c angles"]
  },
  {
    key: "angle_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Angle_overview.svg/640px-Angle_overview.svg.png",
    label: "Types of Angles",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["angles", "acute angle", "right angle", "obtuse angle", "reflex angle", "straight angle", "types of angles", "angle rules", "angles on a straight line", "angles in a triangle"]
  },
  {
    key: "triangle_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Triangle.Types.svg/640px-Triangle.Types.svg.png",
    label: "Types of Triangles",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["triangles", "equilateral triangle", "isosceles triangle", "scalene triangle", "right-angled triangle", "types of triangles", "triangle properties", "interior angles"]
  },
  {
    key: "pythagoras",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pythagorean.svg/640px-Pythagorean.svg.png",
    label: "Pythagoras' Theorem",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["pythagoras", "pythagoras theorem", "hypotenuse", "right-angled triangle", "a squared b squared c squared", "pythagorean triple"]
  },
  {
    key: "trigonometry",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Sinus_und_Kosinus_am_Einheitskreis_1.svg/640px-Sinus_und_Kosinus_am_Einheitskreis_1.svg.png",
    label: "Trigonometry \u2014 Unit Circle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["trigonometry", "sine", "cosine", "tangent", "sohcahtoa", "trig ratios", "unit circle", "sin cos tan", "right-angled triangle trigonometry", "trig graphs"]
  },
  {
    key: "circle_theorems",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Circle_theorem_1.svg/640px-Circle_theorem_1.svg.png",
    label: "Circle Theorems",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["circle theorems", "circle", "radius", "diameter", "chord", "tangent", "arc", "sector", "segment", "circumference", "area of circle", "parts of a circle"]
  },
  {
    key: "transformations",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Tiling_regular_3-6_square_grid.png/640px-Tiling_regular_3-6_square_grid.png",
    label: "Transformations \u2014 Reflection, Rotation, Translation",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["transformations", "reflection", "rotation", "translation", "enlargement", "congruence", "similar shapes", "scale factor", "vector translation", "line of symmetry"]
  },
  {
    key: "3d_shapes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/3D_shapes.svg/640px-3D_shapes.svg.png",
    label: "3D Shapes \u2014 Faces, Edges, Vertices",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["3d shapes", "solid shapes", "cube", "cuboid", "cylinder", "cone", "sphere", "pyramid", "prism", "faces edges vertices", "volume", "surface area", "nets"]
  },
  {
    key: "vectors",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Vector_from_A_to_B.svg/640px-Vector_from_A_to_B.svg.png",
    label: "Vectors \u2014 Magnitude and Direction",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["vectors", "vector", "magnitude", "direction", "column vector", "resultant vector", "vector addition", "scalar multiplication", "displacement", "velocity"]
  },
  {
    key: "loci_constructions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Perpendicular_bisector.svg/640px-Perpendicular_bisector.svg.png",
    label: "Loci and Constructions \u2014 Perpendicular Bisector",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["loci", "locus", "constructions", "perpendicular bisector", "angle bisector", "compass constructions", "geometric constructions", "equidistant"]
  },
  // ── MATHEMATICS — Statistics & Probability ────────────────────────────────
  {
    key: "bar_chart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Bar_chart_from_a_normal_distribution.svg/640px-Bar_chart_from_a_normal_distribution.svg.png",
    label: "Bar Chart",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["bar chart", "bar graph", "frequency", "data", "statistics", "pictogram", "categorical data", "comparative bar chart", "dual bar chart"]
  },
  {
    key: "pie_chart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Pie_chart_of_US_household_income_2010.svg/640px-Pie_chart_of_US_household_income_2010.svg.png",
    label: "Pie Chart",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["pie chart", "pie graph", "sectors", "proportional data", "angles in pie chart", "percentage pie chart", "statistical diagrams"]
  },
  {
    key: "scatter_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Scatter_diagram_for_quality_characteristic_XXX.svg/640px-Scatter_diagram_for_quality_characteristic_XXX.svg.png",
    label: "Scatter Graph \u2014 Correlation",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["scatter graph", "scatter diagram", "correlation", "positive correlation", "negative correlation", "no correlation", "line of best fit", "outlier", "bivariate data"]
  },
  {
    key: "box_plot",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Boxplot_vs_PDF.svg/640px-Boxplot_vs_PDF.svg.png",
    label: "Box Plot \u2014 Interquartile Range",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["box plot", "box and whisker", "interquartile range", "iqr", "median", "quartiles", "lower quartile", "upper quartile", "range", "outliers", "comparing distributions"]
  },
  {
    key: "histogram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Histogram_of_arrivals_per_minute.svg/640px-Histogram_of_arrivals_per_minute.svg.png",
    label: "Histogram \u2014 Frequency Density",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["histogram", "frequency density", "grouped data", "continuous data", "class width", "frequency histogram", "area histogram"]
  },
  {
    key: "cumulative_frequency",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Ogive_of_relative_cumulative_frequency.svg/640px-Ogive_of_relative_cumulative_frequency.svg.png",
    label: "Cumulative Frequency Graph",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["cumulative frequency", "cumulative frequency graph", "ogive", "running total", "median from graph", "interquartile range graph", "quartiles"]
  },
  {
    key: "tree_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Binary_tree.svg/640px-Binary_tree.svg.png",
    label: "Tree Diagram \u2014 Probability",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["tree diagram", "probability tree", "combined probability", "independent events", "conditional probability", "sample space", "listing outcomes"]
  },
  {
    key: "normal_distribution",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Normal_Distribution_PDF.svg/640px-Normal_Distribution_PDF.svg.png",
    label: "Normal Distribution",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["normal distribution", "bell curve", "standard deviation", "mean", "spread", "symmetrical distribution", "statistics"]
  },
  // ── GEOGRAPHY — Physical ──────────────────────────────────────────────────
  {
    key: "rock_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Rock_cycle_nps.gif/640px-Rock_cycle_nps.gif",
    label: "The Rock Cycle",
    attribution: "National Park Service / Wikimedia Commons (Public Domain)",
    keywords: ["rock cycle", "igneous rock", "sedimentary rock", "metamorphic rock", "magma", "erosion", "deposition", "weathering", "compaction", "cementation"]
  },
  {
    key: "plate_tectonics",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Plates_tect2_en.svg/640px-Plates_tect2_en.svg.png",
    label: "Tectonic Plates \u2014 World Map",
    attribution: "USGS / Wikimedia Commons (Public Domain)",
    keywords: ["plate tectonics", "tectonic plates", "plate boundaries", "convergent", "divergent", "transform", "subduction", "seafloor spreading", "fold mountains", "earthquakes", "volcanoes"]
  },
  {
    key: "volcano_cross_section",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Volcano_scheme.svg/640px-Volcano_scheme.svg.png",
    label: "Volcano Cross-Section",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["volcano", "cross section", "magma chamber", "vent", "crater", "lava", "pyroclastic flow", "shield volcano", "composite volcano", "eruption"]
  },
  {
    key: "earthquake_seismic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Earthquake_Wave_Propagation.svg/640px-Earthquake_Wave_Propagation.svg.png",
    label: "Earthquake \u2014 Seismic Waves",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["earthquake", "seismic waves", "focus", "epicentre", "p waves", "s waves", "richter scale", "seismograph", "tremor", "fault line"]
  },
  {
    key: "river_features",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/River_drainage_basin.gif/640px-River_drainage_basin.gif",
    label: "River \u2014 Drainage Basin and Features",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["river", "drainage basin", "watershed", "tributary", "confluence", "source", "mouth", "estuary", "meander", "erosion", "deposition", "transportation", "long profile", "river features"]
  },
  {
    key: "coastal_processes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Costal_erosion_diagram.svg/640px-Costal_erosion_diagram.svg.png",
    label: "Coastal Erosion Processes",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["coastal erosion", "hydraulic action", "abrasion", "attrition", "solution", "cliff", "wave cut platform", "cave arch stack stump", "longshore drift", "beach", "deposition", "coastal features", "headland", "bay"]
  },
  {
    key: "glaciation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Glacier_diagram.svg/640px-Glacier_diagram.svg.png",
    label: "Glaciation \u2014 Glacial Features",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["glaciation", "glacier", "glacial", "corrie", "ar\xEAte", "pyramidal peak", "u-shaped valley", "hanging valley", "drumlin", "moraine", "terminal moraine", "ice age", "freeze thaw"]
  },
  {
    key: "weather_climate",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/BlankMap-World.svg/640px-BlankMap-World.svg.png",
    label: "World Climate Zones Map",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["climate zones", "biomes", "tropical", "temperate", "polar", "desert", "mediterranean", "climate", "weather", "global warming", "climate change"]
  },
  {
    key: "water_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Water_cycle.png/640px-Water_cycle.png",
    label: "The Water Cycle",
    attribution: "NOAA / Wikimedia Commons (Public Domain)",
    keywords: ["water cycle", "hydrological cycle", "evaporation", "condensation", "precipitation", "transpiration", "infiltration", "surface runoff", "groundwater", "interception"]
  },
  {
    key: "carbon_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Carbon_cycle-cute_diagram.svg/640px-Carbon_cycle-cute_diagram.svg.png",
    label: "The Carbon Cycle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["carbon cycle", "carbon dioxide", "photosynthesis", "respiration", "decomposition", "fossil fuels", "carbon sink", "global warming", "greenhouse effect"]
  },
  // ── GEOGRAPHY — Human ─────────────────────────────────────────────────────
  {
    key: "population_pyramid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/DTM_pyramids.svg/640px-DTM_pyramids.svg.png",
    label: "Population Pyramid \u2014 DTM",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["population pyramid", "demographic transition model", "dtm", "birth rate", "death rate", "age structure", "population growth", "dependency ratio", "ageing population"]
  },
  {
    key: "urban_land_use",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Urban_Land_Use.png/640px-Urban_Land_Use.png",
    label: "Urban Land Use \u2014 Burgess Model",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["urban land use", "burgess model", "hoyt model", "cbd", "inner city", "suburbs", "urban zones", "urban structure", "urbanisation", "city model"]
  },
  {
    key: "development_indicators",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/GNI_per_capita_Atlas_method_2009.svg/640px-GNI_per_capita_Atlas_method_2009.svg.png",
    label: "Global Development \u2014 GNI Map",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["development", "gni", "gdp", "hdi", "north south divide", "lic", "hic", "nee", "inequality", "development indicators"]
  },
  // ── HISTORY ───────────────────────────────────────────────────────────────
  {
    key: "ww1_western_front",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Western_front_1917_with_inset.jpg/640px-Western_front_1917_with_inset.jpg",
    label: "World War One \u2014 Western Front Map",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["world war 1", "ww1", "first world war", "western front", "trenches", "trench warfare", "somme", "verdun", "ypres", "no man's land", "allies", "central powers"]
  },
  {
    key: "ww1_trench_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Scheme_trench_WWI.gif/640px-Scheme_trench_WWI.gif",
    label: "WW1 Trench System Diagram",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["trenches", "trench system", "front line", "communication trench", "dugout", "trench warfare", "world war 1", "ww1"]
  },
  {
    key: "ww2_europe_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Second_world_war_europe_1941-1942_map_de.png/640px-Second_world_war_europe_1941-1942_map_de.png",
    label: "World War Two \u2014 Europe Map",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["world war 2", "ww2", "second world war", "nazi germany", "allies", "d-day", "normandy", "blitz", "battle of britain", "holocaust", "occupation"]
  },
  {
    key: "cold_war_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Cold_war_europe_military_alliances_map_en.png/640px-Cold_war_europe_military_alliances_map_en.png",
    label: "Cold War \u2014 NATO vs Warsaw Pact Map",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["cold war", "nato", "warsaw pact", "iron curtain", "usa", "ussr", "soviet union", "communism", "capitalism", "berlin wall", "cuban missile crisis", "arms race"]
  },
  {
    key: "medieval_castle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Chateau_Gaillard_from_NE.JPG/640px-Chateau_Gaillard_from_NE.JPG",
    label: "Medieval Castle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["medieval castle", "castle", "feudal system", "motte and bailey", "keep", "battlements", "moat", "drawbridge", "norman conquest", "middle ages", "siege"]
  },
  {
    key: "feudal_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Feudal_hierarchy.jpg/640px-Feudal_hierarchy.jpg",
    label: "The Feudal System \u2014 Hierarchy",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["feudal system", "feudalism", "hierarchy", "king", "barons", "knights", "peasants", "serfs", "middle ages", "medieval society", "domesday book"]
  },
  {
    key: "tudor_timeline",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Hampton_Court_Palace_from_the_Thames.jpg/640px-Hampton_Court_Palace_from_the_Thames.jpg",
    label: "Tudor Period \u2014 Hampton Court Palace",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["tudors", "tudor", "henry viii", "elizabeth i", "reformation", "dissolution of monasteries", "spanish armada", "renaissance", "tudor england"]
  },
  {
    key: "industrial_revolution",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/ACoalSeam.jpg/640px-ACoalSeam.jpg",
    label: "Industrial Revolution \u2014 Coal Mine",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["industrial revolution", "factory", "steam engine", "coal", "cotton mill", "urbanisation", "child labour", "conditions", "railways", "invention", "textile"]
  },
  {
    key: "slave_trade_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Slavetrade.png/640px-Slavetrade.png",
    label: "Transatlantic Slave Trade \u2014 Triangle Trade Map",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["slave trade", "transatlantic slave trade", "triangular trade", "slavery", "abolition", "middle passage", "plantations", "atlantic", "africa", "americas"]
  },
  {
    key: "empire_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/The_British_Empire.png/640px-The_British_Empire.png",
    label: "British Empire \u2014 World Map",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["british empire", "empire", "colonialism", "imperialism", "india", "colony", "commonwealth", "victoria", "expansion"]
  },
  {
    key: "suffragettes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Suffragette_postcard_1910.jpg/640px-Suffragette_postcard_1910.jpg",
    label: "Suffragettes \u2014 Votes for Women",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["suffragettes", "votes for women", "suffrage", "emmeline pankhurst", "wspu", "women's rights", "reform", "1918", "1928"]
  },
  {
    key: "civil_rights",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Martin_Luther_King_Jr..jpg/480px-Martin_Luther_King_Jr..jpg",
    label: "Civil Rights Movement",
    attribution: "USIA / Wikimedia Commons (Public Domain)",
    keywords: ["civil rights", "civil rights movement", "martin luther king", "rosa parks", "segregation", "discrimination", "march on washington", "montgomery bus boycott", "usa history"]
  },
  // ── BIOLOGY — Human Body ──────────────────────────────────────────────────
  {
    key: "skeleton",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Human_skeleton_front_en.svg/320px-Human_skeleton_front_en.svg.png",
    label: "Human Skeleton",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["skeleton", "bones", "skeletal system", "skull", "vertebrae", "ribs", "femur", "tibia", "joint", "cartilage", "muscle", "movement"]
  },
  {
    key: "circulatory_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Diagram_of_the_human_circulatory_system_%28cropped%29.svg/480px-Diagram_of_the_human_circulatory_system_%28cropped%29.svg.png",
    label: "Human Circulatory System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["circulatory system", "blood vessels", "arteries", "veins", "capillaries", "heart", "blood", "double circulation", "pulmonary circulation", "systemic circulation"]
  },
  {
    key: "respiratory_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Respiratory_system_complete_en.svg/480px-Respiratory_system_complete_en.svg.png",
    label: "Human Respiratory System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["respiratory system", "lungs", "trachea", "bronchi", "alveoli", "breathing", "gas exchange", "diaphragm", "inhale exhale", "oxygen", "carbon dioxide"]
  },
  {
    key: "nervous_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/1201_Overview_of_Nervous_System.jpg/480px-1201_Overview_of_Nervous_System.jpg",
    label: "The Nervous System",
    attribution: "OpenStax / Wikimedia Commons (CC BY 4.0)",
    keywords: ["nervous system", "brain", "spinal cord", "neurone", "neurons", "nerve", "reflex arc", "receptor", "effector", "cns", "pns"]
  },
  {
    key: "digestive_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Digestive_system_diagram_en.svg/480px-Digestive_system_diagram_en.svg.png",
    label: "Human Digestive System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["digestive system", "digestion", "stomach", "small intestine", "large intestine", "oesophagus", "liver", "pancreas", "enzymes", "nutrients", "absorption", "bile"]
  },
  {
    key: "dna_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/480px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
    label: "DNA Double Helix Structure",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["dna", "dna structure", "double helix", "nucleotides", "base pairs", "adenine", "thymine", "guanine", "cytosine", "chromosomes", "genes", "genetics", "inheritance"]
  },
  {
    key: "menstrual_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/MenstrualCycle2.png/640px-MenstrualCycle2.png",
    label: "Menstrual Cycle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["menstrual cycle", "menstruation", "ovulation", "hormones", "oestrogen", "progesterone", "fsh", "lh", "reproduction", "fertility", "uterus lining"]
  },
  {
    key: "eye_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Schematic_diagram_of_the_human_eye_en.svg/640px-Schematic_diagram_of_the_human_eye_en.svg.png",
    label: "Structure of the Human Eye",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["eye", "eye structure", "cornea", "iris", "lens", "retina", "optic nerve", "pupil", "vitreous humour", "sclera", "accommodation", "myopia", "hyperopia"]
  },
  // ── CHEMISTRY ─────────────────────────────────────────────────────────────
  {
    key: "periodic_table",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Simple_Periodic_Table_Chart-en.svg/640px-Simple_Periodic_Table_Chart-en.svg.png",
    label: "Periodic Table of Elements",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["periodic table", "elements", "groups", "periods", "metals", "non-metals", "noble gases", "halogens", "alkali metals", "transition metals", "atomic number", "atomic mass"]
  },
  {
    key: "ionic_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/NaCl_ionic.svg/640px-NaCl_ionic.svg.png",
    label: "Ionic Bonding \u2014 Sodium Chloride",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["ionic bonding", "ionic bond", "ions", "electrostatic attraction", "sodium chloride", "nacl", "cation", "anion", "electron transfer", "ionic compound", "lattice"]
  },
  {
    key: "covalent_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Covalent_bond_hydrogen.svg/640px-Covalent_bond_hydrogen.svg.png",
    label: "Covalent Bonding \u2014 Hydrogen",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["covalent bonding", "covalent bond", "shared electrons", "molecular", "hydrogen", "water", "oxygen", "nitrogen", "dot and cross", "dative bond", "double bond"]
  },
  {
    key: "electrolysis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Electrolysis_of_Water.png/640px-Electrolysis_of_Water.png",
    label: "Electrolysis",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electrolysis", "electrode", "anode", "cathode", "electrolyte", "ions", "oxidation", "reduction", "copper sulfate", "brine", "chlorine", "hydrogen", "sodium hydroxide"]
  },
  {
    key: "ph_scale",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/PH_scale.svg/640px-PH_scale.svg.png",
    label: "pH Scale \u2014 Acids and Alkalis",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["ph scale", "acids", "alkalis", "neutral", "acid base", "indicator", "litmus", "neutralisation", "hydrogen ions", "ph probe", "universal indicator"]
  },
  {
    key: "reactivity_series",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Reactivity_series.svg/640px-Reactivity_series.svg.png",
    label: "Reactivity Series of Metals",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["reactivity series", "metals", "potassium", "sodium", "calcium", "magnesium", "aluminium", "zinc", "iron", "copper", "gold", "displacement reaction", "extraction"]
  },
  {
    key: "haber_process",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Haber_process.svg/640px-Haber_process.svg.png",
    label: "Haber Process \u2014 Ammonia Synthesis",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["haber process", "ammonia", "nitrogen", "hydrogen", "fertiliser", "iron catalyst", "temperature", "pressure", "reversible reaction", "equilibrium", "le chatelier"]
  },
  {
    key: "crude_oil_fractions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Crude_oil_distillation-en.svg/640px-Crude_oil_distillation-en.svg.png",
    label: "Fractional Distillation of Crude Oil",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["crude oil", "fractional distillation", "fractions", "hydrocarbons", "petrol", "diesel", "kerosene", "bitumen", "alkanes", "cracking", "fossil fuels"]
  },
  // ── PHYSICS ───────────────────────────────────────────────────────────────
  {
    key: "electromagnetic_spectrum",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/EM_spectrum.svg/640px-EM_spectrum.svg.png",
    label: "Electromagnetic Spectrum",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electromagnetic spectrum", "em spectrum", "radio waves", "microwaves", "infrared", "visible light", "ultraviolet", "x-rays", "gamma rays", "frequency", "wavelength"]
  },
  {
    key: "nuclear_model",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Rutherford_gold_foil_experiment_results.svg/640px-Rutherford_gold_foil_experiment_results.svg.png",
    label: "Nuclear Model \u2014 Rutherford Scattering",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nuclear model", "atom", "rutherford", "nucleus", "proton", "neutron", "electron", "atomic model", "gold foil experiment", "alpha particle", "plum pudding model"]
  },
  {
    key: "ohms_law",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Ohm%27s_law_voltage_source.svg/640px-Ohm%27s_law_voltage_source.svg.png",
    label: "Ohm's Law \u2014 V=IR Circuit",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["ohms law", "voltage", "current", "resistance", "v=ir", "circuit", "series circuit", "parallel circuit", "potential difference", "ammeter", "voltmeter"]
  },
  {
    key: "motion_graphs",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Displacement_time_graphs.svg/640px-Displacement_time_graphs.svg.png",
    label: "Motion Graphs \u2014 Distance-Time and Velocity-Time",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["motion graphs", "distance time graph", "velocity time graph", "speed time graph", "acceleration", "deceleration", "gradient", "area under graph", "kinematics"]
  },
  {
    key: "moments_levers",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Lever_principle_3D.png/640px-Lever_principle_3D.png",
    label: "Moments and Levers \u2014 Principle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["moments", "lever", "pivot", "turning effect", "moment = force x distance", "balanced moments", "principle of moments", "torque", "first class lever", "fulcrum"]
  },
  {
    key: "pressure_fluids",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Pressure_force_area.svg/640px-Pressure_force_area.svg.png",
    label: "Pressure \u2014 Force and Area",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["pressure", "force", "area", "p=f/a", "pressure in fluids", "atmospheric pressure", "pascal", "hydraulics", "upthrust", "archimedes", "barometer"]
  },
  {
    key: "energy_transfers",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Sankey_Diagram_of_energy_transfers_in_a_car_engine.png/640px-Sankey_Diagram_of_energy_transfers_in_a_car_engine.png",
    label: "Energy Transfers \u2014 Sankey Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["energy transfer", "sankey diagram", "kinetic energy", "potential energy", "thermal energy", "electrical energy", "light energy", "sound energy", "conservation of energy", "efficiency"]
  },
  {
    key: "refraction_light",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Snells_law2.svg/640px-Snells_law2.svg.png",
    label: "Refraction of Light \u2014 Snell's Law",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["refraction", "light", "snells law", "normal", "angle of refraction", "angle of incidence", "refractive index", "total internal reflection", "fibre optics", "prism"]
  },
  {
    key: "space_solar_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Planets2013.svg/640px-Planets2013.svg.png",
    label: "The Solar System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["solar system", "planets", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "orbit", "sun", "space", "moon", "asteroid"]
  },
  // ── ENGLISH / LITERACY ────────────────────────────────────────────────────
  {
    key: "narrative_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Narrative_arc.svg/640px-Narrative_arc.svg.png",
    label: "Narrative Structure \u2014 Story Arc",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["narrative structure", "story arc", "freytag pyramid", "exposition", "rising action", "climax", "falling action", "resolution", "plot structure", "narrative", "story mountain"]
  },
  {
    key: "shakespeare_globe",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Globe_Theatre.jpg/640px-Globe_Theatre.jpg",
    label: "Shakespeare \u2014 The Globe Theatre",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["shakespeare", "globe theatre", "elizabethan theatre", "play", "drama", "tragedy", "comedy", "sonnet", "macbeth", "romeo and juliet", "hamlet", "tempest"]
  },
  {
    key: "punctuation_marks",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Punctuation_marks.svg/640px-Punctuation_marks.svg.png",
    label: "Punctuation Marks",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["punctuation", "comma", "full stop", "question mark", "exclamation mark", "semicolon", "colon", "apostrophe", "inverted commas", "speech marks", "dash", "hyphen", "brackets"]
  },
  // ── COMPUTING ─────────────────────────────────────────────────────────────
  {
    key: "binary_number_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Bin_counting.svg/640px-Bin_counting.svg.png",
    label: "Binary Number System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["binary", "binary numbers", "number system", "base 2", "bits", "bytes", "denary", "hexadecimal", "conversion", "computing", "data representation"]
  },
  {
    key: "flowchart_symbols",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Flowchart_key.svg/640px-Flowchart_key.svg.png",
    label: "Flowchart Symbols",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["flowchart", "algorithm", "decision", "process", "input output", "start stop", "sequence", "selection", "iteration", "pseudocode", "programming"]
  },
  {
    key: "internet_network",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Internet_map_1024.jpg/640px-Internet_map_1024.jpg",
    label: "Internet \u2014 Network Map",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["internet", "network", "www", "world wide web", "ip address", "dns", "router", "packet switching", "lan", "wan", "cybersecurity", "protocol"]
  },
  {
    key: "logic_gates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Logic-gate-index.png/640px-Logic-gate-index.png",
    label: "Logic Gates",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["logic gates", "and gate", "or gate", "not gate", "nand gate", "nor gate", "xor gate", "boolean logic", "truth table", "binary", "computing"]
  },
  // ── RE / PSHE ─────────────────────────────────────────────────────────────
  {
    key: "world_religions_symbols",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Religious_syms.svg/640px-Religious_syms.svg.png",
    label: "World Religion Symbols",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["religion", "world religions", "christianity", "islam", "judaism", "hinduism", "buddhism", "sikhism", "symbols", "beliefs", "faith", "worship"]
  },
  {
    key: "mosque_features",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Masjid_Al_Nabawi.jpg/640px-Masjid_Al_Nabawi.jpg",
    label: "Mosque \u2014 Key Features",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["mosque", "islam", "minaret", "dome", "mihrab", "minbar", "wudu", "prayer", "allah", "muslim", "five pillars"]
  },
  {
    key: "church_features",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Cathedral_diagram.png/640px-Cathedral_diagram.png",
    label: "Church \u2014 Key Features",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["church", "christianity", "font", "altar", "nave", "pulpit", "stained glass", "cross", "christian", "worship", "cathedral"]
  },
  // ── ART & DESIGN ──────────────────────────────────────────────────────────
  {
    key: "colour_wheel",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/BYR_color_wheel.svg/640px-BYR_color_wheel.svg.png",
    label: "Colour Wheel \u2014 Primary, Secondary, Tertiary",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["colour wheel", "color wheel", "primary colours", "secondary colours", "tertiary colours", "complementary colours", "warm colours", "cool colours", "hue", "tone", "tint", "shade", "art"]
  },
  {
    key: "elements_of_art",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Elements_of_Art.png/640px-Elements_of_Art.png",
    label: "Elements of Art",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["elements of art", "line", "shape", "form", "texture", "value", "space", "colour", "art elements", "design principles", "composition"]
  },
  // ── PE / SPORT ────────────────────────────────────────────────────────────
  {
    key: "muscular_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Muscle_posterior_labeled.png/480px-Muscle_posterior_labeled.png",
    label: "Muscular System",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["muscles", "muscular system", "bicep", "tricep", "quadriceps", "hamstring", "gluteus", "deltoid", "calf", "muscle contraction", "antagonistic muscles", "pe"]
  },
  {
    key: "heart_rate_exercise",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Sinus_rhythm_labels.svg/640px-Sinus_rhythm_labels.svg.png",
    label: "Heart Rate \u2014 ECG Trace",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["heart rate", "exercise", "recovery rate", "aerobic", "anaerobic", "cardiovascular", "fitness", "pe", "pulse", "ecg", "cardiac output"]
  }
];
function findDiagram(subject, topic) {
  const subjectLower = subject.toLowerCase().trim();
  const topicLower = topic.toLowerCase().trim();
  const combined = `${subjectLower} ${topicLower}`;
  function wordMatch(text, keyword) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
    return re.test(text);
  }
  let bestMatch = null;
  let bestScore = 0;
  for (const entry of DIAGRAM_BANK) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (wordMatch(combined, kw)) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }
  return bestScore >= 6 ? bestMatch : null;
}
async function searchWikimediaDiagram(subject, topic) {
  const query = `${topic} ${subject} diagram educational`;
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json&origin=*`;
  try {
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "AdaptlyEduApp/1.0 (educational platform)" },
      signal: AbortSignal.timeout(5e3)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data?.query?.search || [];
    for (const result of results) {
      const title = result.title;
      if (!title.match(/\.(svg|png|jpg|jpeg)$/i)) continue;
      if (title.match(/book|page|scan|manuscript|photo|portrait|landscape/i)) continue;
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=960&format=json&origin=*`;
      const infoRes = await fetch(infoUrl, {
        headers: { "User-Agent": "AdaptlyEduApp/1.0 (educational platform)" },
        signal: AbortSignal.timeout(5e3)
      });
      if (!infoRes.ok) continue;
      const infoData = await infoRes.json();
      const pages = infoData?.query?.pages || {};
      const page = Object.values(pages)[0];
      const imageInfo = page?.imageinfo?.[0];
      const thumbUrl = imageInfo?.thumburl || imageInfo?.url;
      if (!thumbUrl) continue;
      const author = (imageInfo.extmetadata?.Artist?.value || "Wikimedia Commons").replace(/<[^>]+>/g, "").trim();
      const license = imageInfo.extmetadata?.LicenseShortName?.value || "CC BY-SA";
      return {
        url: thumbUrl,
        caption: `${topic} \u2014 ${subject}`,
        attribution: `${author}, Wikimedia Commons (${license})`
      };
    }
  } catch (e) {
    console.warn("[DiagramBank] Wikimedia search error:", e);
  }
  return null;
}

// server/lib/diagramBankFull.ts
var diagramBankFull_exports = {};
__export(diagramBankFull_exports, {
  FULL_DIAGRAM_BANK: () => FULL_DIAGRAM_BANK,
  findDiagramFull: () => findDiagramFull
});
var WM = "Wikimedia Commons";
var CC_BY_SA_3 = "CC BY-SA 3.0";
var CC_BY_SA_4 = "CC BY-SA 4.0";
var CC_BY_3 = "CC BY 3.0";
var CC_BY_4 = "CC BY 4.0";
var PD = "Public Domain";
var CC0 = "CC0 1.0";
var FULL_DIAGRAM_BANK = [
  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY / SCIENCE — Cells
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "animal_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/960px-Animal_cell_structure_en.svg.png",
    label: "Animal Cell Structure",
    attribution: "LadyofHats, " + WM,
    license: PD,
    keywords: ["animal cell", "eukaryotic cell", "cell structure", "cell organelles", "nucleus", "mitochondria", "ribosomes", "cytoplasm", "cells and organisation", "cell biology"]
  },
  {
    key: "plant_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Plant_cell_structure-en.svg/960px-Plant_cell_structure-en.svg.png",
    label: "Plant Cell Structure",
    attribution: "LadyofHats, " + WM,
    license: PD,
    keywords: ["plant cell", "chloroplast", "cell wall", "vacuole", "plant organelles", "cells and organisation", "cell biology"]
  },
  {
    key: "cell_membrane",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cell_membrane_detailed_diagram_en.svg/960px-Cell_membrane_detailed_diagram_en.svg.png",
    label: "Cell Membrane (Phospholipid Bilayer)",
    attribution: "LadyofHats, " + WM,
    license: PD,
    keywords: ["cell membrane", "plasma membrane", "phospholipid bilayer", "membrane structure", "membrane proteins", "transport across membranes"]
  },
  {
    key: "prokaryotic_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Average_prokaryote_cell-_en.svg/960px-Average_prokaryote_cell-_en.svg.png",
    label: "Prokaryotic Cell Structure",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["prokaryotic cell", "prokaryote", "bacteria cell", "bacterial cell", "prokaryotes", "bacteria structure", "cell biology advanced", "cells advanced"]
  },
  {
    key: "mitosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Animal_cell_cycle-en.svg/960px-Animal_cell_cycle-en.svg.png",
    label: "Mitosis \u2014 Cell Division Stages",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["mitosis", "cell division", "cell cycle", "prophase", "metaphase", "anaphase", "telophase", "interphase", "cell biology"]
  },
  {
    key: "meiosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Meiosis_Overview_new.svg/960px-Meiosis_Overview_new.svg.png",
    label: "Meiosis Overview",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["meiosis", "sexual reproduction", "gametes", "meiosis stages", "haploid", "diploid", "reproduction in plants and animals", "cell biology advanced"]
  },
  {
    key: "osmosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Osmosis_diagram.svg/960px-Osmosis_diagram.svg.png",
    label: "Osmosis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["osmosis", "semi-permeable membrane", "concentration gradient", "water potential", "turgor pressure", "transport across membranes"]
  },
  {
    key: "diffusion",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Diffusion.svg/960px-Diffusion.svg.png",
    label: "Diffusion",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["diffusion", "concentration gradient", "particles", "random movement", "passive transport", "net movement", "transport across membranes"]
  },
  {
    key: "active_transport",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cell_membrane_detailed_diagram_en.svg/640px-Cell_membrane_detailed_diagram_en.svg.png",
    label: "Active Transport",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["active transport", "atp", "carrier protein", "concentration gradient", "transport across membranes"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY — Human Body Systems
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "heart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Diagram_of_the_human_heart_%28multilingual%29.svg/640px-Diagram_of_the_human_heart_%28multilingual%29.svg.png",
    label: "Human Heart Diagram",
    attribution: "Wapcaplet, " + WM,
    license: CC_BY_SA_3,
    keywords: ["heart", "human heart", "cardiac", "heart structure", "circulatory system", "atrium", "ventricle", "aorta", "the human circulatory system", "cardiovascular"]
  },
  {
    key: "circulatory_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Circulatory_System_en.svg/500px-Circulatory_System_en.svg.png",
    label: "Human Circulatory System",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["circulatory system", "blood circulation", "arteries", "veins", "capillaries", "double circulation", "the human circulatory system"]
  },
  {
    key: "lungs_respiratory",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Respiratory_system_complete_en.svg/500px-Respiratory_system_complete_en.svg.png",
    label: "Human Respiratory System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["lungs", "respiratory system", "breathing", "alveoli", "trachea", "bronchi", "gas exchange", "diaphragm", "breathing and gas exchange"]
  },
  {
    key: "alveoli",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Alveolus_diagram.svg/960px-Alveolus_diagram.svg.png",
    label: "Alveolus \u2014 Gas Exchange",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["alveoli", "alveolus", "gas exchange", "oxygen", "carbon dioxide", "breathing and gas exchange", "surface area", "diffusion"]
  },
  {
    key: "digestive_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Digestive_system_diagram_en.svg/500px-Digestive_system_diagram_en.svg.png",
    label: "Human Digestive System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["digestive system", "digestion", "stomach", "intestine", "small intestine", "large intestine", "oesophagus", "liver", "pancreas", "the human digestive system"]
  },
  {
    key: "nervous_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Nervous_system_diagram-en.svg/330px-Nervous_system_diagram-en.svg.png",
    label: "Human Nervous System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nervous system", "neurons", "brain", "spinal cord", "nerve", "reflex arc", "central nervous system", "peripheral nervous system", "coordination and control"]
  },
  {
    key: "neuron",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Blausen_0657_MultipolarNeuron.png/960px-Blausen_0657_MultipolarNeuron.png",
    label: "Neuron Structure",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["neuron", "nerve cell", "axon", "dendrite", "synapse", "myelin sheath", "coordination and control", "nervous system"]
  },
  {
    key: "reflex_arc",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Reflex_arc_diagram.svg/960px-Reflex_arc_diagram.svg.png",
    label: "Reflex Arc",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["reflex arc", "reflex", "sensory neuron", "relay neuron", "motor neuron", "stimulus", "response", "coordination and control"]
  },
  {
    key: "skeleton",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Human_skeleton_front_en.svg/500px-Human_skeleton_front_en.svg.png",
    label: "Human Skeleton",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["skeleton", "bones", "human skeleton", "skeletal system", "skull", "femur", "tibia", "ribcage", "spine", "the human skeleton and muscles"]
  },
  {
    key: "muscle_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Muscle_tissues.png/960px-Muscle_tissues.png",
    label: "Types of Muscle Tissue",
    attribution: "OpenStax, " + WM,
    license: CC_BY_4,
    keywords: ["muscle", "muscle tissue", "skeletal muscle", "smooth muscle", "cardiac muscle", "the human skeleton and muscles"]
  },
  {
    key: "eye",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Schematic_diagram_of_the_human_eye_en.svg/960px-Schematic_diagram_of_the_human_eye_en.svg.png",
    label: "Human Eye Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["eye", "human eye", "retina", "cornea", "lens", "iris", "pupil", "optic nerve", "eye structure", "coordination and control"]
  },
  {
    key: "ear",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Anatomy_of_the_Human_Ear.svg/960px-Anatomy_of_the_Human_Ear.svg.png",
    label: "Human Ear Structure",
    attribution: "Chittka L, Brockmann, " + WM,
    license: "CC BY 2.5",
    keywords: ["ear", "human ear", "cochlea", "eardrum", "hearing", "inner ear", "outer ear", "ossicles", "coordination and control"]
  },
  {
    key: "kidney",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Kidney_Cross_Section.svg/960px-Kidney_Cross_Section.svg.png",
    label: "Kidney Cross-Section",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["kidney", "kidneys", "nephron", "renal system", "excretion", "filtration", "urine", "cortex", "medulla", "homeostasis"]
  },
  {
    key: "nephron",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kidney_nephron_molar_transport_diagram.svg/960px-Kidney_nephron_molar_transport_diagram.svg.png",
    label: "Nephron \u2014 Kidney Filtration",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nephron", "kidney filtration", "glomerulus", "renal tubule", "ultrafiltration", "reabsorption", "homeostasis"]
  },
  {
    key: "brain",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Brain_diagram_fr.svg/960px-Brain_diagram_fr.svg.png",
    label: "Human Brain Diagram",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["brain", "human brain", "cerebrum", "cerebellum", "brain stem", "medulla", "frontal lobe", "temporal lobe", "coordination and control"]
  },
  {
    key: "blood_cells",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Blausen_0425_Formed_Elements.png/960px-Blausen_0425_Formed_Elements.png",
    label: "Blood Cells",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["blood cells", "red blood cells", "white blood cells", "platelets", "blood", "haemoglobin", "erythrocytes", "leucocytes", "the human circulatory system"]
  },
  {
    key: "endocrine_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Endocrine_English.svg/640px-Endocrine_English.svg.png",
    label: "Endocrine System \u2014 Hormones",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["hormones", "endocrine system", "glands", "pituitary", "thyroid", "adrenal", "pancreas", "insulin", "glucagon", "adrenaline", "oestrogen", "testosterone", "coordination and control"]
  },
  {
    key: "homeostasis_blood_glucose",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Glucose_Homeostasis.png/960px-Glucose_Homeostasis.png",
    label: "Blood Glucose Homeostasis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["homeostasis", "blood glucose", "insulin", "glucagon", "diabetes", "pancreas", "negative feedback", "coordination and control"]
  },
  {
    key: "teeth_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Teeth_types_colored.png",
    label: "Types of Teeth",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["teeth", "types of teeth", "incisor", "canine", "molar", "premolar", "dental", "the human digestive system"]
  },
  {
    key: "skin_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Skin_layers.png/960px-Skin_layers.png",
    label: "Skin Structure",
    attribution: "Don Bliss, National Cancer Institute, " + WM,
    license: PD,
    keywords: ["skin", "skin structure", "epidermis", "dermis", "subcutaneous", "sweat gland", "hair follicle", "homeostasis", "thermoregulation"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY — Genetics & Evolution
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "dna_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/500px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
    label: "DNA Double Helix Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["dna", "dna structure", "double helix", "nucleotide", "base pairs", "adenine", "thymine", "guanine", "cytosine", "genetics", "inheritance variation and evolution"]
  },
  {
    key: "dna_replication",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/DNA_replication_en.svg/960px-DNA_replication_en.svg.png",
    label: "DNA Replication",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["dna replication", "semi-conservative replication", "helicase", "polymerase", "genetics", "cell biology advanced"]
  },
  {
    key: "protein_synthesis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/MRNA-interaction.png/960px-MRNA-interaction.png",
    label: "Protein Synthesis \u2014 Transcription and Translation",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["protein synthesis", "transcription", "translation", "mrna", "ribosome", "amino acid", "codon", "genetics", "biological molecules"]
  },
  {
    key: "mendelian_genetics",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Punnett_square_mendel_flowers.svg/960px-Punnett_square_mendel_flowers.svg.png",
    label: "Punnett Square \u2014 Mendelian Genetics",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["punnett square", "genetics", "dominant", "recessive", "allele", "genotype", "phenotype", "mendel", "inheritance variation and evolution", "inheritance"]
  },
  {
    key: "natural_selection",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Mutation_and_selection_diagram.svg/960px-Mutation_and_selection_diagram.svg.png",
    label: "Natural Selection",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["natural selection", "evolution", "adaptation", "survival of the fittest", "mutation", "variation", "darwin", "inheritance variation and evolution"]
  },
  {
    key: "evolution_tree",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Darwin_Tree_1837.png/500px-Darwin_Tree_1837.png",
    label: "Darwin's Tree of Life",
    attribution: "Charles Darwin, " + WM,
    license: PD,
    keywords: ["evolution", "tree of life", "common ancestor", "speciation", "darwin", "inheritance variation and evolution"]
  },
  {
    key: "chromosome_karyotype",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Karyotype.png/960px-Karyotype.png",
    label: "Human Karyotype \u2014 Chromosomes",
    attribution: "National Human Genome Research Institute, " + WM,
    license: PD,
    keywords: ["chromosomes", "karyotype", "human genome", "sex chromosomes", "xx", "xy", "genetics", "inheritance"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY — Plants & Ecosystems
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "photosynthesis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/960px-Photosynthesis_en.svg.png",
    label: "Photosynthesis Process",
    attribution: "At09kg, " + WM,
    license: CC_BY_SA_3,
    keywords: ["photosynthesis", "chlorophyll", "light reaction", "glucose", "oxygen", "carbon dioxide", "chloroplast", "light energy", "bioenergetics"]
  },
  {
    key: "leaf_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Leaf_Structure.svg/960px-Leaf_Structure.svg.png",
    label: "Leaf Structure (Cross-Section)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["leaf", "leaf structure", "leaf cross section", "stomata", "palisade cells", "mesophyll", "epidermis", "guard cells", "photosynthesis"]
  },
  {
    key: "flower_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Mature_flower_diagram.svg/960px-Mature_flower_diagram.svg.png",
    label: "Flower Structure",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["flower", "flower structure", "pollination", "stamen", "pistil", "petal", "sepal", "anther", "ovary", "parts of a plant", "reproduction in plants and animals"]
  },
  {
    key: "plant_transport",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Xylem_and_phloem.svg/640px-Xylem_and_phloem.svg.png",
    label: "Xylem and Phloem \u2014 Plant Transport",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["xylem", "phloem", "plant transport", "transpiration", "translocation", "vascular bundle", "plant tissues"]
  },
  {
    key: "food_chain",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/FoodChain.svg/960px-FoodChain.svg.png",
    label: "Food Chain",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["food chain", "food web", "producer", "consumer", "predator", "prey", "trophic level", "ecosystem", "habitats", "the living world"]
  },
  {
    key: "food_web",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/FoodWeb.svg/640px-FoodWeb.svg.png",
    label: "Food Web \u2014 Habitats and Ecosystems",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["food web", "habitat", "ecosystem", "producer", "consumer", "predator", "prey", "herbivore", "carnivore", "omnivore", "decomposer", "the living world"]
  },
  {
    key: "carbon_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Carbon_cycle-cute_diagram.svg/960px-Carbon_cycle-cute_diagram.svg.png",
    label: "Carbon Cycle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["carbon cycle", "carbon dioxide", "respiration", "decomposition", "fossil fuels", "atmosphere", "global warming", "water and carbon cycles"]
  },
  {
    key: "nitrogen_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Nitrogen_Cycle.svg/960px-Nitrogen_Cycle.svg.png",
    label: "Nitrogen Cycle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nitrogen cycle", "nitrogen fixation", "nitrification", "denitrification", "ammonia", "nitrates", "bacteria", "ecosystems"]
  },
  {
    key: "water_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Water_cycle_complete.png/960px-Water_cycle_complete.png",
    label: "Water Cycle",
    attribution: "USGS, " + WM,
    license: PD,
    keywords: ["water cycle", "evaporation", "condensation", "precipitation", "transpiration", "runoff", "hydrological cycle", "rain", "the water cycle", "water and carbon cycles"]
  },
  {
    key: "classification_living_things",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Biological_classification_L_Pengo_vflip.svg/640px-Biological_classification_L_Pengo_vflip.svg.png",
    label: "Classification of Living Things",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["classification", "living things", "vertebrates", "invertebrates", "mammals", "reptiles", "amphibians", "fish", "birds", "taxonomy", "kingdom", "species", "classification of living things"]
  },
  {
    key: "life_cycle_butterfly",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Butterfly_Life_Cycle_Chart%2C_Metamorphosis_Lab_in_the_Grand_Atrium%2C_Franklin_Park_Conservatory%2C_Columbus%2C_Ohio.jpg/960px-Butterfly_Life_Cycle_Chart%2C_Metamorphosis_Lab_in_the_Grand_Atrium%2C_Franklin_Park_Conservatory%2C_Columbus%2C_Ohio.jpg",
    label: "Life Cycle of a Butterfly",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["life cycle", "butterfly", "metamorphosis", "egg", "caterpillar", "larva", "pupa", "chrysalis", "reproduction and life cycles"]
  },
  {
    key: "life_cycle_frog",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Metamorphosis_frog_Meyers.png",
    label: "Life Cycle of a Frog",
    attribution: WM,
    license: PD,
    keywords: ["life cycle frog", "frog", "tadpole", "spawn", "amphibian", "metamorphosis", "reproduction and life cycles"]
  },
  {
    key: "enzyme",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Induced_fit_diagram.svg/960px-Induced_fit_diagram.svg.png",
    label: "Enzyme Action (Lock and Key / Induced Fit)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["enzyme", "enzymes", "lock and key", "active site", "substrate", "enzyme action", "induced fit", "enzyme substrate complex", "bioenergetics"]
  },
  {
    key: "respiration_aerobic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Cellular_respiration.svg/640px-Cellular_respiration.svg.png",
    label: "Cellular Respiration",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["respiration", "cellular respiration", "aerobic respiration", "anaerobic respiration", "glucose", "atp", "mitochondria", "oxygen", "carbon dioxide", "lactic acid", "bioenergetics"]
  },
  {
    key: "krebs_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Citric_acid_cycle_with_aconitate_2.svg/640px-Citric_acid_cycle_with_aconitate_2.svg.png",
    label: "Krebs Cycle (Citric Acid Cycle)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["krebs cycle", "citric acid cycle", "aerobic respiration", "atp", "nadh", "mitochondria", "bioenergetics", "cell biology advanced"]
  },
  {
    key: "biomes_world",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Vegetation.png/960px-Vegetation.png",
    label: "World Biomes Map",
    attribution: "USGS, " + WM,
    license: PD,
    keywords: ["biomes", "vegetation belts", "tropical rainforest", "desert", "tundra", "grassland", "taiga", "world biomes", "the living world", "biomes and vegetation belts"]
  },
  {
    key: "tropical_rainforest",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Rainforest_layers.png/640px-Rainforest_layers.png",
    label: "Tropical Rainforest Layers",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["tropical rainforest", "rainforest layers", "canopy", "emergent layer", "understory", "forest floor", "biodiversity", "the living world"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY — Infection & Response / Health
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "immune_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Blausen_0624_LymphaticSystem_Female.png/640px-Blausen_0624_LymphaticSystem_Female.png",
    label: "Immune / Lymphatic System",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["immune system", "lymphatic system", "antibodies", "white blood cells", "infection", "pathogen", "vaccination", "infection and response"]
  },
  {
    key: "virus_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Virus_diagram.svg/640px-Virus_diagram.svg.png",
    label: "Virus Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["virus", "virus structure", "pathogen", "infection", "capsid", "nucleic acid", "infection and response"]
  },
  {
    key: "bacteria_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Prokaryote_cell.svg/640px-Prokaryote_cell.svg.png",
    label: "Bacteria Cell Structure",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["bacteria", "bacteria structure", "pathogen", "infection", "prokaryote", "infection and response"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // CHEMISTRY
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "atom_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Helium_atom_QM.svg/960px-Helium_atom_QM.svg.png",
    label: "Atomic Structure (Bohr Model)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["atom", "atomic structure", "bohr model", "electron", "proton", "neutron", "nucleus", "electron shell", "orbit", "atomic model", "atoms elements and compounds", "atomic structure and the periodic table"]
  },
  {
    key: "periodic_table",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b6/PTable_structure.png",
    label: "Periodic Table Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["periodic table", "elements", "groups", "periods", "metals", "non-metals", "atomic number", "chemical elements", "the periodic table", "atomic structure and the periodic table"]
  },
  {
    key: "periodic_table_full",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Simple_Periodic_Table_Chart-en.svg/960px-Simple_Periodic_Table_Chart-en.svg.png",
    label: "Full Periodic Table of Elements",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["periodic table", "all elements", "groups", "periods", "transition metals", "noble gases", "halogens", "alkali metals", "atomic structure and the periodic table"]
  },
  {
    key: "ionic_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a8/NaF.gif",
    label: "Ionic Bonding",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ionic bonding", "ionic bond", "ions", "sodium chloride", "nacl", "electron transfer", "electrostatic attraction", "ionic compound", "bonding and structure", "bonding structure and properties"]
  },
  {
    key: "covalent_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Covalent_bond_hydrogen.svg/960px-Covalent_bond_hydrogen.svg.png",
    label: "Covalent Bonding",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["covalent bonding", "covalent bond", "shared electrons", "molecule", "h2", "hydrogen molecule", "molecular bonding", "bonding and structure"]
  },
  {
    key: "metallic_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Metallic_bond.svg/640px-Metallic_bond.svg.png",
    label: "Metallic Bonding",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["metallic bonding", "metallic bond", "delocalised electrons", "metal ions", "sea of electrons", "bonding and structure"]
  },
  {
    key: "states_of_matter",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Solid_liquid_gas.svg/960px-Solid_liquid_gas.svg.png",
    label: "States of Matter",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["states of matter", "solid", "liquid", "gas", "melting", "freezing", "evaporation", "condensation", "sublimation", "particle model", "properties and changes of materials"]
  },
  {
    key: "particle_model",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Particle_model_of_matter.svg/640px-Particle_model_of_matter.svg.png",
    label: "Particle Model of Matter",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["particle model", "particles", "solid liquid gas", "kinetic theory", "states of matter", "properties and changes of materials"]
  },
  {
    key: "chromatography",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Chromatography_of_chlorophyll_-_Step_4.jpg",
    label: "Paper Chromatography",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["chromatography", "paper chromatography", "separation", "rf value", "solvent", "mixture separation", "pigments", "chemical analysis"]
  },
  {
    key: "distillation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Simple_distillation_apparatus.svg/960px-Simple_distillation_apparatus.svg.png",
    label: "Simple Distillation Apparatus",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["distillation", "simple distillation", "fractional distillation", "condenser", "separation", "boiling point", "flask", "chemical analysis"]
  },
  {
    key: "filtration",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Filtration_diagram.svg/640px-Filtration_diagram.svg.png",
    label: "Filtration",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["filtration", "filter paper", "funnel", "residue", "filtrate", "separation techniques", "chemical analysis"]
  },
  {
    key: "ph_scale",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/PH_scale.svg/960px-PH_scale.svg.png",
    label: "pH Scale",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ph scale", "acid", "alkali", "neutral", "ph", "indicator", "acidic", "alkaline", "universal indicator", "acids and alkalis", "chemical changes"]
  },
  {
    key: "electrolysis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Electrolysis_of_water_with_diagram.png/960px-Electrolysis_of_water_with_diagram.png",
    label: "Electrolysis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electrolysis", "electrode", "anode", "cathode", "electrolyte", "decomposition", "electrochemistry", "copper sulfate", "chemical changes"]
  },
  {
    key: "reaction_rate",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Activation_energy.svg/640px-Activation_energy.svg.png",
    label: "Activation Energy and Reaction Rate",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["activation energy", "reaction rate", "rates of reaction", "catalyst", "energy profile", "exothermic", "endothermic", "enthalpy"]
  },
  {
    key: "exothermic_endothermic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Exothermic_vs_endothermic.svg/640px-Exothermic_vs_endothermic.svg.png",
    label: "Exothermic vs Endothermic Reactions",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["exothermic", "endothermic", "energy change", "enthalpy", "heat released", "heat absorbed", "chemical reactions", "rates of reaction"]
  },
  {
    key: "mole_concept",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Avogadro_number.svg/640px-Avogadro_number.svg.png",
    label: "The Mole \u2014 Avogadro's Number",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["mole", "avogadro", "molar mass", "quantitative chemistry", "relative formula mass", "moles calculation"]
  },
  {
    key: "haber_process",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Haber_process.svg/640px-Haber_process.svg.png",
    label: "Haber Process",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["haber process", "ammonia", "nitrogen", "hydrogen", "industrial chemistry", "reversible reaction", "equilibrium", "using resources"]
  },
  {
    key: "alkanes_alkenes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Ethane-3D-balls.png/640px-Ethane-3D-balls.png",
    label: "Alkanes and Alkenes \u2014 Organic Chemistry",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["alkanes", "alkenes", "organic chemistry", "hydrocarbons", "methane", "ethane", "ethene", "crude oil", "carbon compounds"]
  },
  {
    key: "crude_oil_fractional_distillation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Crude_oil_distillation.svg/640px-Crude_oil_distillation.svg.png",
    label: "Fractional Distillation of Crude Oil",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["crude oil", "fractional distillation", "fractions", "petrol", "diesel", "bitumen", "kerosene", "carbon compounds", "using resources"]
  },
  {
    key: "transition_metals",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Simple_Periodic_Table_Chart-en.svg/640px-Simple_Periodic_Table_Chart-en.svg.png",
    label: "Transition Metals in the Periodic Table",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["transition metals", "d-block", "iron", "copper", "zinc", "catalysts", "coloured compounds", "transition metals and reactions"]
  },
  {
    key: "water_treatment",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Drinking_water_treatment_process.svg/640px-Drinking_water_treatment_process.svg.png",
    label: "Water Treatment Process",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["water treatment", "potable water", "filtration", "chlorination", "sedimentation", "using resources", "resource management"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // PHYSICS
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "transverse_wave",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Sine_wave_amplitude.svg/960px-Sine_wave_amplitude.svg.png",
    label: "Transverse Wave \u2014 Amplitude and Wavelength",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["transverse wave", "wave", "amplitude", "wavelength", "crest", "trough", "frequency", "wave diagram", "oscillation", "waves", "waves and optics"]
  },
  {
    key: "longitudinal_wave",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Onde_compression_impulsion_1d_30_petit.gif/640px-Onde_compression_impulsion_1d_30_petit.gif",
    label: "Longitudinal Wave \u2014 Compression and Rarefaction",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["longitudinal wave", "compression", "rarefaction", "sound wave", "pressure wave", "waves", "sound"]
  },
  {
    key: "electromagnetic_spectrum",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/EM_spectrum.svg/960px-EM_spectrum.svg.png",
    label: "Electromagnetic Spectrum",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electromagnetic spectrum", "em spectrum", "radio waves", "microwaves", "infrared", "visible light", "ultraviolet", "x-rays", "gamma rays", "waves and the electromagnetic spectrum", "waves and optics"]
  },
  {
    key: "electric_circuit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Circuit_elements.svg/960px-Circuit_elements.svg.png",
    label: "Electric Circuit Symbols",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electric circuit", "circuit symbols", "resistor", "capacitor", "battery", "bulb", "switch", "ammeter", "voltmeter", "circuit diagram", "electricity", "simple electrical circuits"]
  },
  {
    key: "series_parallel_circuit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Series_and_parallel_circuits.svg/960px-Series_and_parallel_circuits.svg.png",
    label: "Series and Parallel Circuits",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["series circuit", "parallel circuit", "series and parallel", "current", "voltage", "resistance", "ohm's law", "electricity"]
  },
  {
    key: "ohms_law",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Ohms_law_voltage_source.svg/640px-Ohms_law_voltage_source.svg.png",
    label: "Ohm's Law \u2014 V = IR",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ohm's law", "resistance", "voltage", "current", "v=ir", "electricity", "iv graph"]
  },
  {
    key: "forces",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Free_body_diagram2.svg/960px-Free_body_diagram2.svg.png",
    label: "Free Body Diagram \u2014 Forces",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["forces", "free body diagram", "balanced forces", "unbalanced forces", "weight", "normal force", "friction", "resultant force", "newton", "simple forces including magnets"]
  },
  {
    key: "newtons_laws",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Newtons_laws_in_latin.jpg/640px-Newtons_laws_in_latin.jpg",
    label: "Newton's Laws of Motion",
    attribution: WM,
    license: PD,
    keywords: ["newton's laws", "first law", "second law", "third law", "inertia", "f=ma", "action reaction", "forces and motion"]
  },
  {
    key: "velocity_time_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Velocity_time_graph.svg/640px-Velocity_time_graph.svg.png",
    label: "Velocity-Time Graph",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["velocity time graph", "speed time graph", "acceleration", "deceleration", "distance", "area under graph", "motion graph", "kinematics", "forces and motion"]
  },
  {
    key: "distance_time_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Distance_time_graph.svg/640px-Distance_time_graph.svg.png",
    label: "Distance-Time Graph",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["distance time graph", "speed", "gradient", "motion", "kinematics", "forces and motion"]
  },
  {
    key: "refraction",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Snells_law2.svg/960px-Snells_law2.svg.png",
    label: "Refraction of Light (Snell's Law)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["refraction", "snell's law", "light", "angle of incidence", "angle of refraction", "normal line", "optics", "bending light", "waves and optics"]
  },
  {
    key: "reflection",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Reflection_angles.svg/960px-Reflection_angles.svg.png",
    label: "Reflection of Light",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["reflection", "angle of incidence", "angle of reflection", "mirror", "light reflection", "normal", "law of reflection", "waves and optics", "light shadow"]
  },
  {
    key: "nuclear_fission",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Nuclear_fission.svg/960px-Nuclear_fission.svg.png",
    label: "Nuclear Fission",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nuclear fission", "fission", "nuclear reaction", "uranium", "chain reaction", "neutron", "radioactive", "nuclear energy", "atomic structure"]
  },
  {
    key: "radioactive_decay",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Radioactive_decay_chains_diagram.svg/960px-Radioactive_decay_chains_diagram.svg.png",
    label: "Radioactive Decay",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["radioactive decay", "alpha decay", "beta decay", "gamma radiation", "half-life", "radioactivity", "nuclear decay", "isotopes", "nuclear atom gcse", "alpha beta gamma"]
  },
  {
    key: "alpha_beta_gamma",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Alpha_Decay.svg/640px-Alpha_Decay.svg.png",
    label: "Alpha, Beta and Gamma Radiation",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["alpha radiation", "beta radiation", "gamma radiation", "ionising radiation", "penetrating power", "half life", "nuclear decay", "radioactivity"]
  },
  {
    key: "pressure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Pressure_force_area.svg/960px-Pressure_force_area.svg.png",
    label: "Pressure = Force \xF7 Area",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["pressure", "force", "area", "pressure formula", "pascal", "pressure equation", "p = f/a", "forces"]
  },
  {
    key: "magnetic_field",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Magnet0873.png/960px-Magnet0873.png",
    label: "Magnetic Field Lines",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["magnetic field", "magnetic field lines", "magnet", "north pole", "south pole", "electromagnet", "magnets", "simple forces including magnets"]
  },
  {
    key: "electromagnetic_induction",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/VFPt_Solenoid_correct2.svg/640px-VFPt_Solenoid_correct2.svg.png",
    label: "Electromagnetic Induction \u2014 Solenoid",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electromagnetic induction", "solenoid", "coil", "magnetic flux", "faraday", "lenz", "generator", "transformer", "induced emf", "induced current"]
  },
  {
    key: "energy_transfer",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Sankey_diagram_of_a_car.svg/640px-Sankey_diagram_of_a_car.svg.png",
    label: "Sankey Diagram \u2014 Energy Transfer",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["energy transfer", "sankey diagram", "efficiency", "wasted energy", "useful energy", "conservation of energy", "energy"]
  },
  {
    key: "solar_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Planets2013.svg/960px-Planets2013.svg.png",
    label: "The Solar System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["solar system", "planets", "sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "space", "earth and space"]
  },
  {
    key: "seasons",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Seasons1.svg/960px-Seasons1.svg.png",
    label: "The Four Seasons \u2014 Earth's Orbit",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["seasons", "four seasons", "spring", "summer", "autumn", "winter", "earth orbit", "seasonal changes", "earth and space"]
  },
  {
    key: "moon_phases",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Moon_phases_en.jpg/960px-Moon_phases_en.jpg",
    label: "Phases of the Moon",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["moon phases", "phases of the moon", "new moon", "full moon", "crescent", "waxing", "waning", "earth and space"]
  },
  {
    key: "projectile_motion",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Parabolic_trajectory.svg/640px-Parabolic_trajectory.svg.png",
    label: "Projectile Motion",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["projectile", "projectile motion", "trajectory", "parabola", "horizontal", "vertical", "gravity", "kinematics", "projectiles"]
  },
  {
    key: "specific_heat_capacity",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Heating_curve_of_water.svg/640px-Heating_curve_of_water.svg.png",
    label: "Heating Curve \u2014 Specific Heat Capacity",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["specific heat capacity", "heating curve", "latent heat", "temperature", "energy", "thermal energy", "thermodynamics"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // GEOGRAPHY
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "volcano",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Volcano_scheme.svg/960px-Volcano_scheme.svg.png",
    label: "Volcano Cross-Section",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["volcano", "volcanic eruption", "magma", "lava", "crater", "vent", "tectonic plates", "composite volcano", "shield volcano", "volcanoes", "volcanoes and earthquakes"]
  },
  {
    key: "tectonic_plates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Tectonic_plates.png/960px-Tectonic_plates.png",
    label: "Tectonic Plates Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["tectonic plates", "plate tectonics", "plate boundaries", "continental drift", "subduction", "collision", "divergent", "convergent", "tectonic plates and earthquakes"]
  },
  {
    key: "plate_boundaries",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Tectonic_plate_boundaries.png",
    label: "Types of Plate Boundaries",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["plate boundary", "constructive boundary", "destructive boundary", "conservative boundary", "transform fault", "ridge", "trench", "tectonic plates and earthquakes"]
  },
  {
    key: "earthquake_seismic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Seismic_wave_types.svg/640px-Seismic_wave_types.svg.png",
    label: "Earthquake \u2014 Seismic Waves",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["earthquake", "seismic waves", "p-waves", "s-waves", "epicentre", "focus", "richter scale", "volcanoes and earthquakes", "tectonic plates and earthquakes"]
  },
  {
    key: "glaciation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Glacial_landscape.svg/960px-Glacial_landscape.svg.png",
    label: "Glacial Landforms",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["glaciation", "glacier", "glacial landforms", "corrie", "ar\xEAte", "horn", "u-shaped valley", "moraine", "drumlin", "ice age"]
  },
  {
    key: "rock_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Rock_cycle_nps.gif/960px-Rock_cycle_nps.gif",
    label: "The Rock Cycle",
    attribution: "NPS, " + WM,
    license: PD,
    keywords: ["rock cycle", "igneous", "sedimentary", "metamorphic", "weathering", "erosion", "magma", "rocks", "geology", "rocks and soils"]
  },
  {
    key: "river_processes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/River_meander.svg/960px-River_meander.svg.png",
    label: "River Meander and Processes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["river meander", "meander", "erosion", "deposition", "river", "oxbow lake", "lateral erosion", "river processes", "fluvial", "rivers", "rivers processes and landforms"]
  },
  {
    key: "river_long_profile",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/River_profile.svg/640px-River_profile.svg.png",
    label: "River Long Profile",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["river long profile", "upper course", "middle course", "lower course", "source", "mouth", "gradient", "rivers"]
  },
  {
    key: "coastal_processes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Coastal_erosion_diagram.svg/640px-Coastal_erosion_diagram.svg.png",
    label: "Coastal Erosion Processes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["coastal erosion", "hydraulic action", "abrasion", "attrition", "longshore drift", "cliff", "wave cut platform", "coastal processes"]
  },
  {
    key: "population_pyramid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Population_pyramid_of_World_%282019%29.png/500px-Population_pyramid_of_World_%282019%29.png",
    label: "Population Pyramid",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["population pyramid", "age-sex pyramid", "birth rate", "death rate", "population structure", "demographics", "population", "urbanisation"]
  },
  {
    key: "demographic_transition",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Demographic-transition-5-stages.svg/640px-Demographic-transition-5-stages.svg.png",
    label: "Demographic Transition Model",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["demographic transition", "birth rate", "death rate", "population growth", "natural increase", "urbanisation", "changing places"]
  },
  {
    key: "climate_zones",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Koppen_World_Map_%28retouched_version%29.svg/960px-Koppen_World_Map_%28retouched_version%29.svg.png",
    label: "World Climate Zones (K\xF6ppen)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["climate zones", "koppen", "tropical", "arid", "temperate", "continental", "polar", "weather and climate", "climate change"]
  },
  {
    key: "greenhouse_effect",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_green_house_effect.svg/640px-The_green_house_effect.svg.png",
    label: "The Greenhouse Effect",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["greenhouse effect", "greenhouse gases", "global warming", "climate change", "carbon dioxide", "methane", "atmosphere"]
  },
  {
    key: "compass_directions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Compass_card_en.svg/500px-Compass_card_en.svg.png",
    label: "Compass Directions",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["compass", "compass directions", "north", "south", "east", "west", "compass rose", "map skills", "cardinal directions"]
  },
  {
    key: "contour_lines",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Contour_map.svg/640px-Contour_map.svg.png",
    label: "Contour Lines \u2014 Topographic Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["contour lines", "topographic map", "elevation", "relief", "map reading", "map skills", "ordnance survey"]
  },
  {
    key: "urban_land_use",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Burgess_model.svg/640px-Burgess_model.svg.png",
    label: "Urban Land Use \u2014 Burgess Model",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["urban land use", "burgess model", "cbd", "inner city", "suburbs", "urban zones", "settlements and land use", "urban issues and challenges", "urbanisation"]
  },
  {
    key: "development_indicators",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/GDP_PPP_Per_Capita_IMF_2008.svg/960px-GDP_PPP_Per_Capita_IMF_2008.svg.png",
    label: "Global Development Indicators Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["development", "gdp", "hdi", "gni", "development indicators", "the changing economic world", "trade and economics"]
  },
  {
    key: "resource_management_water",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Drinking_water_treatment_process.svg/640px-Drinking_water_treatment_process.svg.png",
    label: "Water Treatment and Resource Management",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["water treatment", "resource management", "water supply", "water scarcity", "resource management water food energy"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — Number
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "number_line",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Number-line.svg/960px-Number-line.svg.png",
    label: "Number Line",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["number line", "integers", "negative numbers", "positive numbers", "ordering numbers", "directed numbers", "counting and number recognition"]
  },
  {
    key: "place_value",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Place_value_chart.svg/640px-Place_value_chart.svg.png",
    label: "Place Value Chart",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["place value", "hundreds", "tens", "ones", "thousands", "decimal", "place value chart", "place value to 1000", "place value to 100"]
  },
  {
    key: "multiplication_table",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Multiplication_table_to_scale.svg/960px-Multiplication_table_to_scale.svg.png",
    label: "Multiplication Table",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["multiplication", "times tables", "multiplication table", "times table", "multiplication and division"]
  },
  {
    key: "fractions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cake_fractions.svg/960px-Cake_fractions.svg.png",
    label: "Fractions",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["fractions", "numerator", "denominator", "half", "quarter", "thirds", "equivalent fractions", "proper fractions", "fractions halves quarters thirds"]
  },
  {
    key: "fractions_decimals_percentages",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Fraction_circles.svg/640px-Fraction_circles.svg.png",
    label: "Fractions, Decimals and Percentages",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["fractions", "decimals", "percentages", "equivalent fractions", "converting fractions", "fraction decimal percentage", "fdp", "mixed numbers", "improper fractions"]
  },
  {
    key: "ratio_proportion",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ratio_example.svg/640px-Ratio_example.svg.png",
    label: "Ratio and Proportion",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ratio", "proportion", "sharing in a ratio", "equivalent ratio", "simplifying ratio", "direct proportion", "unitary method", "ratio and proportion"]
  },
  {
    key: "standard_form",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Scientific_notation_example.svg/640px-Scientific_notation_example.svg.png",
    label: "Standard Form (Scientific Notation)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["standard form", "scientific notation", "powers of 10", "large numbers", "small numbers", "standard form"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — Algebra
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "straight_line_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Linear_Function_Graph.svg/640px-Linear_Function_Graph.svg.png",
    label: "Straight Line Graph (y = mx + c)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["straight line", "linear graph", "y = mx + c", "gradient", "y-intercept", "slope", "linear equation", "coordinate geometry", "linear function", "real-life graphs", "algebra and sequences", "expressions and equations", "expressions equations", "solving equations", "forming equations", "one-step equations", "two-step equations", "equations and inequalities", "algebraic expressions", "simplifying expressions", "expanding brackets", "factorising"]
  },
  {
    key: "quadratic_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Polynomialdeg2.svg/640px-Polynomialdeg2.svg.png",
    label: "Quadratic Function Graph (Parabola)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["quadratic", "quadratic equation", "quadratic formula", "parabola", "quadratic graph", "completing the square", "roots", "vertex", "discriminant", "quadratic function", "quadratic equations"]
  },
  {
    key: "simultaneous_equations",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Two_linear_equations.svg/640px-Two_linear_equations.svg.png",
    label: "Simultaneous Equations \u2014 Graphical Solution",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["simultaneous equations", "linear equations", "intersection", "graphical method", "elimination", "substitution", "simultaneous equations introduction"]
  },
  {
    key: "sequences_arithmetic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Arithmetic_sequence.svg/640px-Arithmetic_sequence.svg.png",
    label: "Arithmetic Sequence",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["arithmetic sequence", "arithmetic progression", "common difference", "nth term", "sequences", "algebra and sequences", "sequences and series"]
  },
  {
    key: "geometric_sequence",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Geometric_sequence.svg/640px-Geometric_sequence.svg.png",
    label: "Geometric Sequence",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["geometric sequence", "geometric progression", "common ratio", "nth term", "sequences and series", "algebra and functions"]
  },
  {
    key: "inequalities",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Inequality_on_number_line.svg/640px-Inequality_on_number_line.svg.png",
    label: "Inequalities on a Number Line",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["inequalities", "number line", "less than", "greater than", "inequality notation", "linear inequalities"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — Geometry
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "pythagoras",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pythagorean.svg/960px-Pythagorean.svg.png",
    label: "Pythagoras' Theorem",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["pythagoras", "pythagorean theorem", "right-angled triangle", "hypotenuse", "a squared b squared c squared", "right angle triangle", "pythagoras theorem"]
  },
  {
    key: "trigonometry",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trigonometry_triangle.svg/640px-Trigonometry_triangle.svg.png",
    label: "Trigonometry \u2014 SOH CAH TOA",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["trigonometry", "soh cah toa", "sine", "cosine", "tangent", "right angle triangle", "trig ratios", "sin cos tan", "adjacent", "opposite", "hypotenuse", "trig", "trigonometry introduction"]
  },
  {
    key: "circle_parts",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Circle-withsegments.svg/960px-Circle-withsegments.svg.png",
    label: "Parts of a Circle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["circle", "parts of a circle", "radius", "diameter", "circumference", "chord", "arc", "sector", "segment", "tangent"]
  },
  {
    key: "circle_theorems",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Circle_theorem_1.svg/640px-Circle_theorem_1.svg.png",
    label: "Circle Theorems",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["circle theorems", "angle at centre", "angle in semicircle", "cyclic quadrilateral", "tangent", "chord", "arc", "inscribed angle", "circle geometry"]
  },
  {
    key: "angles",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Angle_types.svg/960px-Angle_types.svg.png",
    label: "Types of Angles",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["angles", "acute angle", "obtuse angle", "right angle", "reflex angle", "straight angle", "types of angles", "geometry", "angles acute obtuse and right angles"]
  },
  {
    key: "angles_parallel_lines",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Parallel_lines_transversal.svg/640px-Parallel_lines_transversal.svg.png",
    label: "Angles in Parallel Lines",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["parallel lines", "alternate angles", "corresponding angles", "co-interior angles", "transversal", "angles and lines", "properties of shapes angles in shapes"]
  },
  {
    key: "3d_shapes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/SolidShapes.png/960px-SolidShapes.png",
    label: "3D Shapes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["3d shapes", "cube", "cuboid", "sphere", "cylinder", "cone", "pyramid", "prism", "polyhedron", "solid shapes", "3d shapes and volume"]
  },
  {
    key: "area_perimeter",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Perimeter_area.svg/640px-Perimeter_area.svg.png",
    label: "Area and Perimeter of Shapes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["area", "perimeter", "rectangle area", "square area", "triangle area", "area formula", "perimeter formula", "compound shapes", "area and perimeter"]
  },
  {
    key: "coordinates_grid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Cartesian-coordinate-system.svg/640px-Cartesian-coordinate-system.svg.png",
    label: "Coordinate Grid (x and y axes)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["coordinates", "coordinate grid", "x axis", "y axis", "cartesian", "plotting points", "ordered pairs", "four quadrants", "grid", "coordinates in the first quadrant"]
  },
  {
    key: "transformation_geometry",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Rotation_illustration2.svg/640px-Rotation_illustration2.svg.png",
    label: "Geometric Transformations",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["transformation", "rotation", "reflection", "translation", "enlargement", "scale factor", "centre of rotation", "congruence", "similarity", "transformations"]
  },
  {
    key: "vectors_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Vector_from_A_to_B.svg/640px-Vector_from_A_to_B.svg.png",
    label: "Vectors \u2014 Direction and Magnitude",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["vectors", "vector addition", "vector subtraction", "magnitude", "direction", "column vector", "resultant vector", "vector diagram", "vectors"]
  },
  {
    key: "loci_constructions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bisection_of_an_angle.svg/640px-Bisection_of_an_angle.svg.png",
    label: "Loci and Constructions \u2014 Angle Bisector",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["loci", "constructions", "angle bisector", "perpendicular bisector", "compass", "ruler", "geometric construction"]
  },
  {
    key: "sine_cosine_rule",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Triangle_with_notations_2.svg/640px-Triangle_with_notations_2.svg.png",
    label: "Sine and Cosine Rule",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["sine rule", "cosine rule", "non-right triangle", "trigonometry sine and cosine rules", "area of triangle", "trigonometry further identities"]
  },
  {
    key: "surds",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pythagorean.svg/640px-Pythagorean.svg.png",
    label: "Surds \u2014 Pythagoras with Surds",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["surds", "irrational numbers", "square root", "simplifying surds", "rationalising denominator", "surds"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — Statistics & Probability
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "bar_chart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Simple_bar_chart.svg/640px-Simple_bar_chart.svg.png",
    label: "Bar Chart",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["bar chart", "bar graph", "data handling", "tally chart", "pictogram", "frequency chart", "statistics bar charts and tables"]
  },
  {
    key: "pie_chart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Composition_of_the_German_Bundesrat_as_a_pie_chart_small.svg/640px-Composition_of_the_German_Bundesrat_as_a_pie_chart_small.svg.png",
    label: "Pie Chart",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["pie chart", "pie graph", "sector", "percentage", "proportion", "data", "statistics", "statistics pie charts and mean"]
  },
  {
    key: "histogram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Histogram_of_arrivals_per_minute.svg/640px-Histogram_of_arrivals_per_minute.svg.png",
    label: "Histogram \u2014 Frequency Density",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["histogram", "frequency density", "class width", "grouped data", "frequency distribution", "statistics", "data representation", "statistical sampling and data presentation"]
  },
  {
    key: "scatter_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Scatter_diagram_for_quality_characteristic_XXX.svg/640px-Scatter_diagram_for_quality_characteristic_XXX.svg.png",
    label: "Scatter Graph and Correlation",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["scatter graph", "scatter diagram", "correlation", "line of best fit", "positive correlation", "negative correlation", "no correlation", "scatter graphs and correlation"]
  },
  {
    key: "probability_tree",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Probability_tree_diagram.svg/640px-Probability_tree_diagram.svg.png",
    label: "Probability Tree Diagram",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["probability tree", "tree diagram", "conditional probability", "independent events", "dependent events", "probability", "combined probability", "probability tree diagrams and conditional"]
  },
  {
    key: "venn_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Venn0001.svg/640px-Venn0001.svg.png",
    label: "Venn Diagram",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["venn diagram", "sets", "intersection", "union", "set notation", "probability", "maths", "boolean logic"]
  },
  {
    key: "box_plot",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Boxplot_vs_PDF.svg/640px-Boxplot_vs_PDF.svg.png",
    label: "Box Plot (Box and Whisker)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["box plot", "box and whisker", "median", "quartile", "interquartile range", "outlier", "statistics", "statistical sampling and data presentation"]
  },
  {
    key: "cumulative_frequency",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Cumulative_distribution_function_for_normal_distribution.svg/640px-Cumulative_distribution_function_for_normal_distribution.svg.png",
    label: "Cumulative Frequency Graph",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["cumulative frequency", "ogive", "median", "quartile", "interquartile range", "statistics", "statistical sampling and data presentation"]
  },
  {
    key: "normal_distribution",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Normal_Distribution_PDF.svg/640px-Normal_Distribution_PDF.svg.png",
    label: "Normal Distribution Curve",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["normal distribution", "bell curve", "mean", "standard deviation", "probability", "statistics", "probability and statistical distributions"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTER SCIENCE
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "binary",
    url: "https://upload.wikimedia.org/wikipedia/commons/7/75/Binary_counter.gif",
    label: "Binary Number System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["binary", "binary numbers", "binary code", "bits", "bytes", "denary", "hexadecimal", "number systems", "binary and data representation"]
  },
  {
    key: "logic_gates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Logic-gate-index.png/960px-Logic-gate-index.png",
    label: "Logic Gates",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["logic gates", "and gate", "or gate", "not gate", "nand gate", "nor gate", "xor gate", "boolean logic", "boolean logic"]
  },
  {
    key: "network_topologies",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/NetworkTopologies.svg/960px-NetworkTopologies.svg.png",
    label: "Network Topologies",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["network topology", "bus topology", "star topology", "ring topology", "mesh topology", "computer network", "networking"]
  },
  {
    key: "cpu_architecture",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d8/ABasicComputer.gif",
    label: "CPU Architecture \u2014 Von Neumann",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["cpu", "processor", "alu", "control unit", "registers", "fetch decode execute", "von neumann", "computer architecture"]
  },
  {
    key: "flowchart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/LampFlowchart.svg/960px-LampFlowchart.svg.png",
    label: "Flowchart Symbols",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["flowchart", "algorithm", "flow chart", "decision", "process", "start", "end", "programming", "pseudocode", "algorithms and flowcharts", "simple instructions and algorithms"]
  },
  {
    key: "sorting_algorithms",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Merge_sort_animation2.gif/220px-Merge_sort_animation2.gif",
    label: "Merge Sort Algorithm",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["sorting algorithm", "merge sort", "bubble sort", "insertion sort", "algorithms searching and sorting", "algorithms complexity and graph theory"]
  },
  {
    key: "binary_search",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Binary_Search_Depiction.svg/640px-Binary_Search_Depiction.svg.png",
    label: "Binary Search Algorithm",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["binary search", "linear search", "searching algorithm", "algorithms searching and sorting"]
  },
  {
    key: "osi_model",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/OSI_Model_v1.svg/640px-OSI_Model_v1.svg.png",
    label: "OSI Network Model",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["osi model", "network layers", "tcp/ip", "protocol", "networking", "computer networks"]
  },
  {
    key: "data_storage",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Storage_media.svg/640px-Storage_media.svg.png",
    label: "Data Storage \u2014 Bits and Bytes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["data storage", "bits", "bytes", "kilobyte", "megabyte", "gigabyte", "binary and data representation"]
  },
  {
    key: "html_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/240px-HTML5_logo_and_wordmark.svg.png",
    label: "HTML Structure",
    attribution: WM,
    license: CC0,
    keywords: ["html", "css", "web development", "html structure", "tags", "web development html and css"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "ww1_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Europe_1914.jpg/960px-Europe_1914.jpg",
    label: "Europe 1914 \u2014 World War I",
    attribution: WM,
    license: PD,
    keywords: ["world war 1", "ww1", "world war one", "first world war", "trench warfare", "western front", "allies", "triple entente", "europe 1914", "world war one"]
  },
  {
    key: "ww2_europe",
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Second_world_war_europe_1939_map_pl2.png",
    label: "World War II \u2014 Europe 1939",
    attribution: WM,
    license: PD,
    keywords: ["world war 2", "ww2", "world war two", "second world war", "nazi germany", "axis powers", "allied powers", "d-day", "europe 1939", "world war two and the holocaust"]
  },
  {
    key: "trench_warfare",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Trench_construction_diagram_1914.svg/960px-Trench_construction_diagram_1914.svg.png",
    label: "Trench Construction Diagram (1914)",
    attribution: WM,
    license: PD,
    keywords: ["trench warfare", "trenches", "no man's land", "front line", "ww1 trenches", "dugout", "trench construction", "world war one"]
  },
  {
    key: "roman_empire",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Roman_Empire_Trajan_117AD.png/960px-Roman_Empire_Trajan_117AD.png",
    label: "Roman Empire at its Greatest Extent",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["roman empire", "romans", "rome", "roman britain", "julius caesar", "roman history", "ancient rome", "the roman empire and its impact on britain"]
  },
  {
    key: "ancient_egypt_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Ancient_Egypt_map-en.svg/640px-Ancient_Egypt_map-en.svg.png",
    label: "Ancient Egypt Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ancient egypt", "egypt", "nile", "pharaoh", "pyramid", "hieroglyphics", "ancient egypt"]
  },
  {
    key: "ancient_greece_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ancient_Greece.jpg/640px-Ancient_Greece.jpg",
    label: "Ancient Greece Map",
    attribution: WM,
    license: PD,
    keywords: ["ancient greece", "greece", "athens", "sparta", "democracy", "olympics", "ancient greece"]
  },
  {
    key: "norman_conquest",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Battle_of_Hastings_map.svg/640px-Battle_of_Hastings_map.svg.png",
    label: "Battle of Hastings 1066",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["norman conquest", "battle of hastings", "1066", "william the conqueror", "harold", "normans", "the norman conquest 1066"]
  },
  {
    key: "cold_war_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Cold_War_Map_1980.svg/960px-Cold_War_Map_1980.svg.png",
    label: "Cold War \u2014 NATO vs Warsaw Pact",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["cold war", "nato", "warsaw pact", "usa", "ussr", "iron curtain", "superpower relations and the cold war", "the cold war"]
  },
  {
    key: "civil_rights_timeline",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/March_on_Washington_edit.jpg/640px-March_on_Washington_edit.jpg",
    label: "Civil Rights Movement \u2014 March on Washington",
    attribution: WM,
    license: PD,
    keywords: ["civil rights", "martin luther king", "rosa parks", "march on washington", "segregation", "the civil rights movement"]
  },
  {
    key: "industrial_revolution",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Maquina_vapor_Watt_ETSIIM.jpg/640px-Maquina_vapor_Watt_ETSIIM.jpg",
    label: "Industrial Revolution \u2014 Steam Engine",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["industrial revolution", "steam engine", "factory", "cotton mill", "urbanisation", "the industrial revolution"]
  },
  {
    key: "weimar_germany",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Bundesarchiv_Bild_183-H1216-0500-002%2C_Adolf_Hitler.jpg/480px-Bundesarchiv_Bild_183-H1216-0500-002%2C_Adolf_Hitler.jpg",
    label: "Weimar and Nazi Germany \u2014 Rise of Hitler",
    attribution: "Bundesarchiv, " + WM,
    license: CC_BY_SA_3,
    keywords: ["weimar republic", "nazi germany", "hitler", "third reich", "holocaust", "propaganda", "weimar and nazi germany 1918 1939"]
  },
  {
    key: "british_empire_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/The_British_Empire.png/960px-The_British_Empire.png",
    label: "The British Empire at its Height",
    attribution: WM,
    license: PD,
    keywords: ["british empire", "colonialism", "imperialism", "india", "africa", "the british empire"]
  },
  {
    key: "stone_age_timeline",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prehistoric_Britain.svg/640px-Prehistoric_Britain.svg.png",
    label: "Stone Age to Iron Age \u2014 Prehistoric Britain",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["stone age", "bronze age", "iron age", "prehistoric", "hunter gatherer", "stone age to iron age"]
  },
  {
    key: "anglo_saxons",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Anglo-Saxon_kingdoms.svg/640px-Anglo-Saxon_kingdoms.svg.png",
    label: "Anglo-Saxon Kingdoms of England",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["anglo-saxons", "saxons", "kingdoms", "mercia", "wessex", "northumbria", "anglo-saxons and scots", "vikings and anglo-saxon england"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // ECONOMICS / BUSINESS
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "supply_demand",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Supply-demand-right-shift-demand.svg/640px-Supply-demand-right-shift-demand.svg.png",
    label: "Supply and Demand Curve",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["supply and demand", "demand curve", "supply curve", "equilibrium", "price", "quantity", "market", "economics", "trade and economics"]
  },
  {
    key: "business_ownership",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Org_chart.svg/640px-Org_chart.svg.png",
    label: "Business Organisational Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["business structure", "organisational chart", "hierarchy", "sole trader", "partnership", "limited company", "business ownership types"]
  },
  {
    key: "business_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Business_cycle_schematic.svg/640px-Business_cycle_schematic.svg.png",
    label: "Business / Economic Cycle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["business cycle", "economic cycle", "boom", "recession", "recovery", "trough", "gdp", "economics", "a-level business"]
  },
  {
    key: "swot_analysis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/SWOT_en.svg/640px-SWOT_en.svg.png",
    label: "SWOT Analysis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["swot analysis", "strengths", "weaknesses", "opportunities", "threats", "business planning", "business strategy", "a-level business objectives and strategy"]
  },
  {
    key: "inflation_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/US_Inflation.svg/640px-US_Inflation.svg.png",
    label: "Inflation Rate Graph",
    attribution: WM,
    license: PD,
    keywords: ["inflation", "cpi", "price level", "monetary policy", "economics", "trade and economics"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // RELIGIOUS EDUCATION
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "world_religions_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Prevailing_world_religions_map.png/960px-Prevailing_world_religions_map.png",
    label: "World Religions Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["world religions", "christianity", "islam", "hinduism", "buddhism", "sikhism", "judaism", "what is religion", "special people and stories"]
  },
  {
    key: "christianity_cross",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christian_cross.svg/400px-Christian_cross.svg.png",
    label: "Christian Cross",
    attribution: WM,
    license: PD,
    keywords: ["christianity", "christian cross", "jesus", "god", "bible", "christianity key beliefs", "christianity god and jesus"]
  },
  {
    key: "buddhism_wheel",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Dharma_Wheel.svg/400px-Dharma_Wheel.svg.png",
    label: "Buddhism \u2014 Dharma Wheel",
    attribution: WM,
    license: PD,
    keywords: ["buddhism", "dharma wheel", "eight-fold path", "four noble truths", "nirvana", "buddhism key beliefs"]
  },
  {
    key: "hinduism_om",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Om_symbol.svg/400px-Om_symbol.svg.png",
    label: "Hinduism \u2014 Om Symbol",
    attribution: WM,
    license: PD,
    keywords: ["hinduism", "om", "brahman", "karma", "dharma", "reincarnation", "hinduism key beliefs"]
  },
  {
    key: "sikhism_khanda",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Khanda.svg/400px-Khanda.svg.png",
    label: "Sikhism \u2014 Khanda Symbol",
    attribution: WM,
    license: PD,
    keywords: ["sikhism", "khanda", "guru nanak", "golden temple", "five ks", "sikhism key beliefs"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // ART & DESIGN
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "colour_wheel",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/BYR_color_wheel.svg/640px-BYR_color_wheel.svg.png",
    label: "Colour Wheel \u2014 Primary, Secondary, Tertiary",
    attribution: WM,
    license: PD,
    keywords: ["colour wheel", "primary colours", "secondary colours", "tertiary colours", "complementary colours", "colour theory", "art movements pop art impressionism"]
  },
  {
    key: "perspective_drawing",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Two_point_perspective.svg/640px-Two_point_perspective.svg.png",
    label: "Two-Point Perspective Drawing",
    attribution: WM,
    license: PD,
    keywords: ["perspective", "two-point perspective", "vanishing point", "horizon line", "drawing", "sketching and observational drawing", "3d design and sculpture"]
  },
  {
    key: "elements_of_art",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
    label: "Elements of Art \u2014 Mona Lisa (Leonardo da Vinci)",
    attribution: "Leonardo da Vinci, " + WM,
    license: PD,
    keywords: ["elements of art", "line", "shape", "tone", "texture", "colour", "form", "space", "art movements", "art from other cultures"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // MUSIC
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "music_notation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Music_notation.svg/640px-Music_notation.svg.png",
    label: "Music Notation \u2014 Treble Clef",
    attribution: WM,
    license: PD,
    keywords: ["music notation", "treble clef", "notes", "stave", "crotchet", "quaver", "minim", "pulse and rhythm", "singing and performing"]
  },
  {
    key: "musical_instruments",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/640px-PNG_transparency_demonstration_1.png",
    label: "Orchestra \u2014 Instrument Families",
    attribution: WM,
    license: PD,
    keywords: ["orchestra", "instruments", "strings", "woodwind", "brass", "percussion", "instrument families", "world music"]
  },
  {
    key: "sound_waves",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Sine_wave.svg/960px-Sine_wave.svg.png",
    label: "Sound Waves \u2014 Frequency and Amplitude",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["sound", "sound waves", "vibration", "pitch", "volume", "frequency", "amplitude", "longitudinal wave", "blues and jazz"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // PE / SPORT
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "muscle_diagram_pe",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Anterior_Hip_Muscles_2.PNG/640px-Anterior_Hip_Muscles_2.PNG",
    label: "Major Muscle Groups",
    attribution: "OpenStax, " + WM,
    license: CC_BY_4,
    keywords: ["muscles", "muscle groups", "quadriceps", "hamstrings", "biceps", "triceps", "pe", "a-level pe biomechanics", "a-level pe exercise physiology"]
  },
  {
    key: "heart_rate_exercise",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Velocity_time_graph.svg/640px-Velocity_time_graph.svg.png",
    label: "Heart Rate During Exercise",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["heart rate", "exercise", "aerobic", "anaerobic", "fitness", "cardiovascular", "a-level pe exercise physiology"]
  },
  {
    key: "lever_systems",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Lever_Principle_3D.png/640px-Lever_Principle_3D.png",
    label: "Lever Systems \u2014 First, Second, Third Class",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["lever", "lever systems", "first class lever", "second class lever", "third class lever", "fulcrum", "effort", "load", "a-level pe biomechanics"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // DESIGN TECHNOLOGY
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "isometric_drawing",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Isometric_projection.svg/640px-Isometric_projection.svg.png",
    label: "Isometric Drawing",
    attribution: WM,
    license: PD,
    keywords: ["isometric drawing", "isometric projection", "3d drawing", "technical drawing", "cad cam and manufacturing", "3d design and sculpture"]
  },
  {
    key: "bridge_structures",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Types_of_bridges.svg/640px-Types_of_bridges.svg.png",
    label: "Types of Bridges \u2014 Structures",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["bridge", "structures", "beam bridge", "arch bridge", "suspension bridge", "truss", "structures bridges and frameworks"]
  },
  {
    key: "design_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Design_process.svg/640px-Design_process.svg.png",
    label: "Design Cycle / Process",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["design cycle", "design process", "research", "prototype", "evaluate", "sustainable design", "a-level dt design theory"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // MFL (Modern Foreign Languages)
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "world_map_mfl",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/960px-World_map_-_low_resolution.svg.png",
    label: "World Map \u2014 Countries and Languages",
    attribution: WM,
    license: PD,
    keywords: ["world map", "countries", "languages", "travel and transport", "school and education", "town and local area"]
  },
  {
    key: "human_body_mfl",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Blausen_0316_DigestiveSystem.png/640px-Blausen_0316_DigestiveSystem.png",
    label: "Human Body \u2014 Parts (for MFL labelling)",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["human body", "body parts", "head", "arm", "leg", "health", "mfl vocabulary"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // PSHE
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "emotions_wheel",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Plutchik-wheel.svg/640px-Plutchik-wheel.svg.png",
    label: "Emotions Wheel (Plutchik)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["emotions", "feelings", "mental health", "wellbeing", "emotional literacy", "being a good friend", "relationships and families", "substance misuse"]
  },
  {
    key: "healthy_eating_plate",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Eatwell_Guide.jpg/640px-Eatwell_Guide.jpg",
    label: "Eatwell Guide \u2014 Healthy Eating",
    attribution: "Public Health England / Crown Copyright, " + WM,
    license: "OGL v3.0",
    keywords: ["healthy eating", "eatwell guide", "food groups", "nutrition", "diet", "health", "pshe"]
  },
  {
    key: "internet_safety",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/640px-Camponotus_flavomarginatus_ant.jpg",
    label: "Using Technology Safely \u2014 Online Safety",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["internet safety", "online safety", "cyberbullying", "digital footprint", "using technology safely", "pshe"]
  },
  // ══════════════════════════════════════════════════════════════════════════
  // KS1/KS2 PRIMARY SCIENCE
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "plants_need_to_grow",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/640px-Photosynthesis_en.svg.png",
    label: "What Plants Need to Grow",
    attribution: "At09kg, " + WM,
    license: CC_BY_SA_3,
    keywords: ["plants", "what plants need to grow", "sunlight", "water", "nutrients", "soil", "photosynthesis", "ks2 science"]
  },
  {
    key: "materials_properties",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Solid_liquid_gas.svg/640px-Solid_liquid_gas.svg.png",
    label: "Properties of Materials",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["materials", "properties of materials", "hard", "soft", "transparent", "opaque", "flexible", "uses of everyday materials", "properties and changes of materials"]
  },
  {
    key: "electricity_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Series_circuit.svg/640px-Series_circuit.svg.png",
    label: "Simple Electrical Circuits (KS2)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electricity", "circuit", "battery", "bulb", "switch", "conductor", "insulator", "series circuit", "current", "voltage", "simple electrical circuits", "changing circuits"]
  },
  {
    key: "forces_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Free_body_diagram2.svg/640px-Free_body_diagram2.svg.png",
    label: "Forces \u2014 Push, Pull, Gravity, Friction",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["forces", "gravity", "friction", "air resistance", "push", "pull", "balanced forces", "simple forces including magnets", "forces ks2"]
  },
  {
    key: "habitats_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/FoodWeb.svg/640px-FoodWeb.svg.png",
    label: "Habitats and Food Webs",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["habitat", "food web", "food chain", "ecosystem", "living things", "animals", "plants", "ks2 science"]
  },
  {
    key: "light_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Reflection_angles.svg/640px-Reflection_angles.svg.png",
    label: "Light \u2014 Reflection and Shadow",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["light", "shadow", "reflection", "transparent", "opaque", "translucent", "light rays", "light shadow ks2"]
  },
  {
    key: "human_body_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Blausen_0316_DigestiveSystem.png/640px-Blausen_0316_DigestiveSystem.png",
    label: "Human Body \u2014 Main Organs",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["human body", "organs", "body parts", "ks2 science", "primary science", "organ systems"]
  },
  // ── ENGLISH LANGUAGE — Writing and Grammar ─────────────────────────────────
  {
    key: "narrative_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Freytags_pyramid.svg/960px-Freytags_pyramid.svg.png",
    label: "Narrative Structure \u2014 Freytag's Pyramid",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["narrative structure", "story structure", "freytag", "creative writing", "narrative", "writing narratives", "plot structure", "19th century fiction", "gothic writing", "horror writing", "analytical essay", "descriptive writing"]
  },
  {
    key: "parts_of_speech",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Parts_of_speech.svg/960px-Parts_of_speech.svg.png",
    label: "Parts of Speech Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 4.0)",
    license: CC_BY_SA_4,
    keywords: ["parts of speech", "nouns verbs adjectives", "grammar", "nouns", "verbs", "adjectives", "pronouns", "grammar and punctuation", "english grammar", "modal verbs", "prefixes suffixes", "synonyms antonyms", "cohesive devices", "fronted adverbials", "subjunctive mood", "joining words"]
  },
  {
    key: "poetry_analysis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/William_Blake_-_The_Tyger.jpg/640px-William_Blake_-_The_Tyger.jpg",
    label: "Poetry \u2014 William Blake, The Tyger (1794)",
    attribution: "William Blake, Wikimedia Commons (Public Domain)",
    license: PD,
    keywords: ["poetry", "pre-1900 poetry", "post-1900 poetry", "unseen poetry", "poem analysis", "poetry analysis", "poetic devices"]
  },
  {
    key: "shakespeare_globe",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/The_Globe_Theatre_Wenceslas_Hollar_1647.jpg/640px-The_Globe_Theatre_Wenceslas_Hollar_1647.jpg",
    label: "The Globe Theatre (1647 engraving)",
    attribution: "Wenceslas Hollar, Wikimedia Commons (Public Domain)",
    license: PD,
    keywords: ["shakespeare", "globe theatre", "drama study", "theatre practitioners", "devising drama", "exploring themes drama", "brecht", "stanislavski"]
  },
  // ── MATHEMATICS — Additional Topics ─────────────────────────────────────────
  {
    key: "prime_factors",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Prime_number_theorem_ratio.svg/960px-Prime_number_theorem_ratio.svg.png",
    label: "Prime Numbers and Factors",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["prime numbers", "factors", "multiples", "prime factors", "factors multiples primes", "hcf", "lcm", "highest common factor", "lowest common multiple"]
  },
  {
    key: "bounds_estimation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Riemann_sum_convergence.png/640px-Riemann_sum_convergence.png",
    label: "Bounds and Estimation",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["bounds", "upper bound", "lower bound", "estimation", "rounding", "significant figures", "error bounds", "numerical methods"]
  },
  {
    key: "exponential_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Exp.svg/960px-Exp.svg.png",
    label: "Exponential Function Graph",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["exponential", "logarithm", "exponentials and logarithms", "exponential growth", "exponential decay", "log graph", "natural log"]
  },
  {
    key: "differentiation_calculus",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Tangent_to_a_curve.svg/960px-Tangent_to_a_curve.svg.png",
    label: "Differentiation \u2014 Tangent to a Curve",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["differentiation", "calculus", "tangent", "gradient", "derivative", "dy/dx", "turning points", "stationary points", "integration"]
  },
  {
    key: "hypothesis_testing",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/P-value_Graph.png/640px-P-value_Graph.png",
    label: "Hypothesis Testing \u2014 p-value Distribution",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["hypothesis testing", "p-value", "significance level", "null hypothesis", "statistical test", "normal distribution", "proof"]
  },
  {
    key: "measurement_units",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/SI_base_unit.svg/960px-SI_base_unit.svg.png",
    label: "SI Units of Measurement",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["measurement", "units", "si units", "metric units", "cm m kg g ml l", "mass", "length", "volume", "word problems", "problem solving"]
  },
  {
    key: "spatial_reasoning",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Net_of_cube.png/640px-Net_of_cube.png",
    label: "3D Shapes \u2014 Net of a Cube",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["spatial reasoning", "nets", "3d shapes", "cube net", "3d visualisation", "verbal reasoning", "verbal reasoning word codes"]
  },
  // ── GEOGRAPHY — Additional Topics ────────────────────────────────────────────
  {
    key: "continents_oceans",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/960px-World_map_-_low_resolution.svg.png",
    label: "World Map \u2014 Continents and Oceans",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["continents", "oceans", "world map", "continents and oceans", "geography map", "atlas"]
  },
  {
    key: "mountains_formation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Fold_mountains.svg/960px-Fold_mountains.svg.png",
    label: "Mountain Formation \u2014 Fold Mountains",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["mountains", "fold mountains", "mountain formation", "tectonic plates", "alps", "himalayas"]
  },
  {
    key: "globalisation_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Globalisation_and_world_cities_research_network.png/640px-Globalisation_and_world_cities_research_network.png",
    label: "Globalisation \u2014 World Cities Network",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["globalisation", "global trade", "world cities", "international trade", "economic globalisation"]
  },
  {
    key: "hazards_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hazard_types.svg/960px-Hazard_types.svg.png",
    label: "Natural Hazards \u2014 Types and Distribution",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["hazards", "natural hazards", "tectonic hazards", "volcanic hazards", "earthquake hazards", "tropical storms", "fieldwork investigation"]
  },
  {
    key: "ecology_food_web",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Food_web.svg/960px-Food_web.svg.png",
    label: "Ecology \u2014 Food Web",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["ecology", "food web", "food chain", "ecosystem", "trophic levels", "producer", "consumer", "decomposer"]
  },
  // ── HISTORY — Additional Topics ──────────────────────────────────────────────
  {
    key: "tudors_henry_viii",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Henry-VIII-kingofengland_1491-1547.jpg/480px-Henry-VIII-kingofengland_1491-1547.jpg",
    label: "Henry VIII \u2014 The Tudors",
    attribution: "Hans Holbein the Younger, Wikimedia Commons (Public Domain)",
    license: PD,
    keywords: ["tudors", "henry viii", "tudor period", "tudor dynasty", "1485-1603", "reformation", "british depth study"]
  },
  {
    key: "russia_revolution",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Bolsheviki.jpg/640px-Bolsheviki.jpg",
    label: "Russian Revolution 1917 \u2014 Bolshevik Poster",
    attribution: "Wikimedia Commons (Public Domain)",
    license: PD,
    keywords: ["russia", "russian revolution", "1917", "bolshevik", "soviet union", "russia 1917-1991", "cold war", "communism"]
  },
  // ── SCIENCE — Additional Topics ──────────────────────────────────────────────
  {
    key: "drugs_alcohol_body",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Nervous_system_diagram.png/480px-Nervous_system_diagram.png",
    label: "Effects of Drugs and Alcohol on the Body",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["drugs", "alcohol", "tobacco", "drugs alcohol tobacco", "substance abuse", "health effects", "nervous system effects"]
  },
  // ── PE / SPORT ────────────────────────────────────────────────────────────────
  {
    key: "athletics_biomechanics",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Biomechanics_of_running.svg/960px-Biomechanics_of_running.svg.png",
    label: "Athletics \u2014 Biomechanics of Running",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["athletics", "running", "jumping", "throwing", "track and field", "biomechanics", "sprint", "invasion games", "striking fielding", "cricket", "rounders", "tag rugby", "football", "leadership officiating"]
  },
  // ── PSHE / CITIZENSHIP ────────────────────────────────────────────────────────
  {
    key: "self_esteem_pyramid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Maslow%27s_Hierarchy_of_Needs2.svg/960px-Maslow%27s_Hierarchy_of_Needs2.svg.png",
    label: "Maslow's Hierarchy of Needs",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["identity", "self-esteem", "maslow", "hierarchy of needs", "wellbeing", "mental health", "preparing for adulthood", "preparing for university", "careers", "aspirations"]
  },
  // ── DT / TEXTILES ─────────────────────────────────────────────────────────────
  {
    key: "textiles_weaving",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Weaving_diagram.svg/960px-Weaving_diagram.svg.png",
    label: "Textiles \u2014 Weaving Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["textiles", "weaving", "textile design", "fabric", "loom", "textiles and weaving", "textiles templates joining", "printing", "collage"]
  },
  {
    key: "pneumatics_mechanism",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Pneumatic_system.svg/960px-Pneumatic_system.svg.png",
    label: "Pneumatics \u2014 Mechanism Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["pneumatics", "mechanisms", "pneumatic system", "air pressure", "cad cam", "manufacturing", "design technology"]
  },
  // ── MUSIC ─────────────────────────────────────────────────────────────────────
  {
    key: "music_notation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Music_notation.svg/960px-Music_notation.svg.png",
    label: "Music Notation \u2014 Staff and Notes",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["music notation", "staff", "notes", "treble clef", "song writing", "song writing lyrics", "listening appraising", "blues jazz"]
  },
  // ── ART ───────────────────────────────────────────────────────────────────────
  {
    key: "art_colour_wheel",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/BYR_color_wheel.svg/960px-BYR_color_wheel.svg.png",
    label: "Colour Wheel \u2014 Primary and Secondary Colours",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["colour wheel", "colour mixing", "primary colours", "secondary colours", "art colour", "famous artists", "portraiture", "art movements", "pop art", "impressionism"]
  },
  // ── CYBERSECURITY ─────────────────────────────────────────────────────────────
  {
    key: "cybersecurity_threats",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Cybersecurity.png/640px-Cybersecurity.png",
    label: "Cybersecurity \u2014 Threats and Protection",
    attribution: "Wikimedia Commons (CC BY-SA 4.0)",
    license: CC_BY_SA_4,
    keywords: ["cybersecurity", "cyber security", "hacking", "malware", "phishing", "encryption", "network security", "cyber threats"]
  },
  // ── BUSINESS / ECONOMICS ─────────────────────────────────────────────────────
  {
    key: "revenue_costs_profit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Break_even_graph.svg/960px-Break_even_graph.svg.png",
    label: "Revenue, Costs and Profit \u2014 Break-Even Graph",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["revenue", "costs", "profit", "break even", "finance", "business finance", "fixed costs", "variable costs", "total revenue"]
  },
  // ── RE / ETHICS ───────────────────────────────────────────────────────────────
  {
    key: "ethics_crime_punishment",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Scales_of_justice_2.svg/640px-Scales_of_justice_2.svg.png",
    label: "Ethics \u2014 Scales of Justice",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["ethics", "crime", "punishment", "justice", "ethics crime punishment", "sacred books", "religion", "moral philosophy"]
  }
];
function findDiagramFull(subject, topic) {
  const subjectLower = subject.toLowerCase().trim();
  const topicLower = topic.toLowerCase().trim();
  const combined = `${subjectLower} ${topicLower}`;
  function wordMatch(text, keyword) {
    const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
    return re.test(text);
  }
  let bestMatch = null;
  let bestScore = 0;
  for (const entry of FULL_DIAGRAM_BANK) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (wordMatch(combined, kw)) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }
  return bestScore >= 6 ? bestMatch : null;
}

// server/routes/ai.ts
function getFullDiagramBank() {
  return diagramBankFull_exports;
}
var router5 = Router5();
var worksheetUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
var PROVIDER_ORDER = ["groq_1", "groq_2", "groq_3", "gemini", "gemini_lite", "mistral"];
var groqRoundRobinIndex = 0;
var COOLDOWN_MS = 3e4;
var providerCooldowns = /* @__PURE__ */ new Map();
function isOnCooldown(provider) {
  const expiresAt = providerCooldowns.get(provider);
  if (!expiresAt) return false;
  if (Date.now() < expiresAt) return true;
  providerCooldowns.delete(provider);
  return false;
}
function setCooldown(provider) {
  const expiresAt = Date.now() + COOLDOWN_MS;
  providerCooldowns.set(provider, expiresAt);
  console.warn(`[AI] ${provider} put on cooldown for ${COOLDOWN_MS / 1e3}s (until ${new Date(expiresAt).toISOString()})`);
}
function getAvailableProviders(order) {
  const available = order.filter((p) => !isOnCooldown(p));
  if (available.length === 0) {
    console.warn("[AI] All providers on cooldown \u2014 clearing shortest cooldown to allow retry");
    let earliest = Infinity;
    let earliestProvider = "";
    for (const [p, exp] of Array.from(providerCooldowns.entries())) {
      if (exp < earliest) {
        earliest = exp;
        earliestProvider = p;
      }
    }
    if (earliestProvider) {
      providerCooldowns.delete(earliestProvider);
      return [earliestProvider];
    }
  }
  return available;
}
function getEffectiveKey(provider, userKey, schoolId) {
  if (userKey && userKey.trim()) return userKey.trim();
  if (provider === "groq_1") return process.env.GROQ_API_KEY || "";
  if (provider === "groq_2") return process.env.GROQ_API_KEY_2 || "";
  if (provider === "groq_3") return process.env.GROQ_API_KEY_3 || "";
  if (schoolId) {
    const schoolEntry = getSchoolKey(schoolId, provider);
    if (schoolEntry?.key) return schoolEntry.key;
  }
  try {
    const adminKey = db_default.prepare(
      "SELECT api_key FROM admin_api_keys WHERE provider = ?"
    ).get(provider);
    if (adminKey?.api_key) return adminKey.api_key;
  } catch (_) {
  }
  if (provider === "gemini_lite") {
    if (schoolId) {
      const schoolEntry = getSchoolKey(schoolId, "gemini");
      if (schoolEntry?.key) return schoolEntry.key;
    }
    try {
      const adminKey = db_default.prepare(
        "SELECT api_key FROM admin_api_keys WHERE provider = ?"
      ).get("gemini");
      if (adminKey?.api_key) return adminKey.api_key;
    } catch (_) {
    }
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  }
  const envMap = {
    groq: process.env.GROQ_API_KEY || "",
    gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
    mistral: process.env.MISTRAL_API_KEY || ""
  };
  return envMap[provider] || "";
}
function getAdminModel(provider, schoolId) {
  if (provider === "gemini_lite") return "gemini-2.5-flash-lite";
  if (schoolId) {
    const schoolEntry = getSchoolKey(schoolId, provider);
    if (schoolEntry?.model) return schoolEntry.model;
  }
  try {
    const row = db_default.prepare(
      "SELECT model FROM admin_api_keys WHERE provider = ?"
    ).get(provider);
    return row?.model || "";
  } catch (_) {
    return "";
  }
}
async function callProvider(provider, system, user2, key, model, maxTokens) {
  const timeoutMs = provider === "groq" || provider === "groq_1" || provider === "groq_2" || provider === "groq_3" ? 12e3 : provider === "gemini" || provider === "gemini_lite" ? 15e3 : provider === "mistral" ? 18e3 : 2e4;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
    console.warn(`[AI] ${provider} timed out after ${timeoutMs / 1e3}s \u2014 aborting`);
  }, timeoutMs);
  try {
    let result;
    switch (provider) {
      case "groq":
      case "groq_1":
      case "groq_2":
      case "groq_3":
        result = await callGroq(system, user2, key, model || "llama-3.3-70b-versatile", maxTokens, controller.signal);
        break;
      case "gemini":
        result = await callGemini(system, user2, key, maxTokens, controller.signal, "gemini-2.5-flash");
        break;
      case "gemini_lite":
        result = await callGemini(system, user2, key, maxTokens, controller.signal, "gemini-2.5-flash-lite");
        break;
      case "openai":
        result = await callOpenAI(system, user2, key, model || "gpt-4o-mini", maxTokens, controller.signal);
        break;
      case "openrouter":
        result = await callOpenRouter(system, user2, key, model, maxTokens, controller.signal);
        break;
      case "claude":
        result = await callClaude(system, user2, key, maxTokens, controller.signal);
        break;
      case "huggingface":
        result = await callHuggingFace(system, user2, key, maxTokens, controller.signal);
        break;
      case "mistral":
        result = await callMistral(system, user2, key, model || "mistral-small-latest", maxTokens, controller.signal);
        break;
      case "deepseek":
        result = await callDeepSeek(system, user2, key, model || "deepseek-chat", maxTokens, controller.signal);
        break;
      case "cohere":
        result = await callCohere(system, user2, key, model || "command-r-plus", maxTokens, controller.signal);
        break;
      case "perplexity":
        result = await callPerplexity(system, user2, key, model || "llama-3.1-sonar-large-128k-online", maxTokens, controller.signal);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}
async function callWithFallback(system, user2, maxTokens, preferredProvider, schoolId) {
  let order;
  if (schoolId) {
    const schoolProviders = db_default.prepare(
      "SELECT provider FROM school_api_keys WHERE school_id=? AND enabled=1 ORDER BY updated_at DESC"
    ).all(schoolId).map((r) => r.provider);
    const remaining = PROVIDER_ORDER.filter((p) => !schoolProviders.includes(p));
    const fullOrder = [...schoolProviders, ...remaining];
    order = preferredProvider ? [preferredProvider, ...fullOrder.filter((p) => p !== preferredProvider)] : fullOrder;
  } else {
    order = preferredProvider ? [preferredProvider, ...PROVIDER_ORDER.filter((p) => p !== preferredProvider)] : [...PROVIDER_ORDER];
  }
  const groqProviders = ["groq_1", "groq_2", "groq_3"];
  const rotatedOrder = order.map((p) => p);
  const firstGroqIdx = rotatedOrder.findIndex((p) => groqProviders.includes(p));
  if (firstGroqIdx !== -1) {
    const groqBlock = groqProviders.filter((p) => rotatedOrder.includes(p));
    if (groqBlock.length > 1) {
      const offset = groqRoundRobinIndex % groqBlock.length;
      groqRoundRobinIndex = (groqRoundRobinIndex + 1) % groqBlock.length;
      const rotated = [...groqBlock.slice(offset), ...groqBlock.slice(0, offset)];
      let gi = 0;
      for (let i = 0; i < rotatedOrder.length; i++) {
        if (groqProviders.includes(rotatedOrder[i])) {
          rotatedOrder[i] = rotated[gi++];
        }
      }
    }
  }
  const errors = [];
  const availableOrder = getAvailableProviders(rotatedOrder);
  if (availableOrder.length < rotatedOrder.length) {
    const cooledDown = rotatedOrder.filter((p) => !availableOrder.includes(p));
    console.log(`[AI] Skipping ${cooledDown.join(", ")} (on cooldown) \u2014 using: ${availableOrder.join(", ")}`);
  }
  const ordersToTry = availableOrder.length > 0 ? availableOrder : rotatedOrder;
  for (const provider of ordersToTry) {
    const key = getEffectiveKey(provider, void 0, schoolId);
    if (!key) {
      errors.push(`${provider}: no key configured`);
      continue;
    }
    const model = getAdminModel(provider, schoolId);
    try {
      const content = await callProvider(provider, system, user2, key, model, maxTokens);
      if (content && content.trim()) {
        console.log(`[AI] Success via ${provider}`);
        return { content, provider };
      }
      errors.push(`${provider}: empty response`);
    } catch (err) {
      const msg = err?.message || String(err);
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("too many requests");
      if (isRateLimit) {
        const isGroq = provider.startsWith("groq");
        if (isGroq) {
          try {
            console.log(`[AI] ${provider} rate limited \u2014 quick 2s retry...`);
            await new Promise((r) => setTimeout(r, 2e3));
            const retryContent = await callProvider(provider, system, user2, key, model, maxTokens);
            if (retryContent && retryContent.trim()) {
              console.log(`[AI] Quick retry success via ${provider}`);
              return { content: retryContent, provider };
            }
          } catch (retryErr) {
            console.warn(`[AI] ${provider} quick retry also failed`);
          }
        }
        setCooldown(provider);
        errors.push(`${provider}: rate limited (429) \u2014 on cooldown for ${COOLDOWN_MS / 1e3}s`);
        continue;
      }
      const isAuthError = msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid api key");
      if (isAuthError) {
        console.warn(`[AI] ${provider} auth error \u2014 trying next provider`);
        errors.push(`${provider}: auth error \u2014 skipped`);
        continue;
      }
      console.warn(`[AI] ${provider} failed: ${msg.slice(0, 120)}`);
      errors.push(`${provider}: ${msg.slice(0, 80)}`);
    }
  }
  const cooledDownProviders = rotatedOrder.filter((p) => !ordersToTry.includes(p));
  for (const provider of cooledDownProviders) {
    const key = getEffectiveKey(provider, void 0, schoolId);
    if (!key) continue;
    try {
      providerCooldowns.delete(provider);
      const model = getAdminModel(provider, schoolId);
      const content = await callProvider(provider, system, user2, key, model, maxTokens);
      if (content && content.trim()) {
        console.log(`[AI] Last-resort success via ${provider} (was on cooldown)`);
        return { content, provider };
      }
    } catch (e) {
      errors.push(`${provider} (last-resort): ${(e?.message || "").slice(0, 80)}`);
    }
  }
  throw new Error(`All AI providers failed:
${errors.join("\n")}`);
}
router5.post("/generate", requireAuth, async (req, res) => {
  const { prompt, systemPrompt, provider, model, apiKey, maxTokens = 2e3 } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });
  const promptFilter = filterContent(prompt);
  const logId = uuidv47();
  try {
    db_default.prepare(`INSERT INTO ai_filter_log (id, user_id, school_id, prompt, flagged, flag_reason)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      logId,
      req.user.id,
      req.user.schoolId,
      prompt.slice(0, 500),
      promptFilter.flagged ? 1 : 0,
      promptFilter.reason || null
    );
  } catch (_) {
  }
  if (promptFilter.flagged && promptFilter.category === "safeguarding") {
    try {
      const incidentId = uuidv47();
      db_default.prepare(`INSERT INTO safeguarding_incidents (id, school_id, reported_by, description, ai_trigger, severity)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        incidentId,
        req.user.schoolId,
        req.user.id,
        `AI prompt flagged: ${promptFilter.reason}`,
        prompt.slice(0, 500),
        promptFilter.severity || "medium"
      );
      const school = db_default.prepare("SELECT * FROM schools WHERE id = ?").get(req.user.schoolId);
      if (school?.dsl_email) {
        const { sendDSLIncidentAlert: sendDSLIncidentAlert2 } = await Promise.resolve().then(() => (init_email(), email_exports));
        db_default.prepare("UPDATE safeguarding_incidents SET dsl_notified=1, dsl_notified_at=datetime('now') WHERE id=?").run(incidentId);
        sendDSLIncidentAlert2(school.dsl_email, {
          id: incidentId,
          severity: promptFilter.severity || "medium",
          description: `AI prompt flagged for safeguarding: ${promptFilter.reason}`,
          reportedBy: req.user.displayName
        }).catch(console.error);
      }
      return res.status(400).json({
        error: "Your input has been flagged for safeguarding review. Your DSL has been notified.",
        flagged: true,
        incidentId
      });
    } catch (e) {
      console.error("Safeguarding incident error:", e);
    }
  }
  try {
    let result;
    if (apiKey && provider) {
      try {
        const model2 = getAdminModel(provider);
        const content = await callProvider(provider, systemPrompt || "", prompt, apiKey, model2, maxTokens);
        result = { content, provider };
      } catch (_) {
        result = await callWithFallback(systemPrompt || "", prompt, maxTokens, provider, req.user.schoolId || void 0);
      }
    } else {
      result = await callWithFallback(systemPrompt || "", prompt, maxTokens, provider, req.user.schoolId || void 0);
    }
    const responseFilter = filterContent(result.content);
    try {
      db_default.prepare("UPDATE ai_filter_log SET output=?, flagged=?, flag_reason=? WHERE id=?").run(
        result.content.slice(0, 500),
        responseFilter.flagged ? 1 : 0,
        responseFilter.reason || null,
        logId
      );
    } catch (_) {
    }
    if (responseFilter.flagged) {
      return res.json({
        content: result.content,
        provider: result.provider,
        warning: "This AI-generated content has been flagged for review.",
        flagged: true,
        aiGenerated: true
      });
    }
    try {
      const toolHint = (systemPrompt || "").slice(0, 80).replace(/\n/g, " ").trim();
      auditLog(req.user.id, req.user.schoolId, "ai.generate", "ai_filter_log", logId, { provider: result.provider, tool: toolHint || "unknown" }, req.ip);
    } catch (_) {
    }
    res.json({ content: result.content, provider: result.provider, aiGenerated: true });
  } catch (err) {
    console.error("AI proxy error:", err);
    const errMsg = err?.message || String(err);
    const allNoKey = errMsg.includes("no key configured") && !errMsg.includes("429") && !errMsg.includes("401") && !errMsg.includes("failed:");
    if (allNoKey || errMsg.includes("All AI providers failed") && errMsg.split("\n").slice(1).every((l) => l.includes("no key configured"))) {
      return res.status(503).json({
        error: "No AI provider keys configured for your school. Please go to Settings \u2192 AI Providers to add your API keys.",
        noKeysConfigured: true
      });
    }
    res.status(502).json({ error: "AI is temporarily unavailable. Please try again in a moment." });
  }
});
router5.post("/ensemble", requireAuth, async (req, res) => {
  const { prompt, systemPrompt, maxTokens = 3e3 } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });
  const promptFilter = filterContent(prompt);
  if (promptFilter.flagged && promptFilter.category === "safeguarding") {
    return res.status(400).json({ error: "Content flagged for safeguarding review." });
  }
  const toRun = PROVIDER_ORDER.filter((p) => getEffectiveKey(p));
  if (toRun.length === 0) {
    return res.status(400).json({ error: "No AI providers configured." });
  }
  const results = await Promise.allSettled(
    toRun.map(async (p) => {
      const key = getEffectiveKey(p);
      const model = getAdminModel(p);
      const text = await callProvider(p, systemPrompt || "", prompt, key, model, maxTokens);
      return { provider: p, text };
    })
  );
  const successes = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  if (successes.length === 0) {
    try {
      const result = await callWithFallback(systemPrompt || "", prompt, maxTokens);
      return res.json({ content: result.content, provider: result.provider, ensemble: false, aiGenerated: true });
    } catch (err) {
      return res.status(502).json({ error: "All AI providers failed." });
    }
  }
  if (successes.length === 1) {
    return res.json({ content: successes[0].text, provider: successes[0].provider, ensemble: false, aiGenerated: true });
  }
  const primary = successes.reduce((a, b) => a.text.length >= b.text.length ? a : b);
  const contributors = successes.map((s) => s.provider).join(", ");
  res.json({
    content: primary.text,
    provider: primary.provider,
    ensemble: true,
    contributors,
    allResponses: successes,
    aiGenerated: true
  });
});
router5.get("/providers", requireAuth, (_req, res) => {
  const available = PROVIDER_ORDER.filter((p) => getEffectiveKey(p)).map((p) => ({ provider: p, source: "server" }));
  res.json({ providers: available });
});
router5.get("/provider-status", requireAuth, (_req, res) => {
  const now = Date.now();
  const statuses = PROVIDER_ORDER.map((p) => {
    const hasKey = !!getEffectiveKey(p);
    const cooldownExpires = providerCooldowns.get(p);
    const onCooldown = cooldownExpires ? now < cooldownExpires : false;
    const cooldownRemainingMs = onCooldown && cooldownExpires ? cooldownExpires - now : 0;
    return {
      provider: p,
      hasKey,
      available: hasKey && !onCooldown,
      onCooldown,
      cooldownRemainingSeconds: Math.ceil(cooldownRemainingMs / 1e3)
    };
  });
  res.json({ providers: statuses, cooldownMs: COOLDOWN_MS });
});
router5.post("/clear-cooldowns", requireAuth, requireAdmin, (_req, res) => {
  const cleared = Array.from(providerCooldowns.keys());
  providerCooldowns.clear();
  console.log(`[AI] Admin cleared all provider cooldowns: ${cleared.join(", ") || "none"}`);
  res.json({ success: true, cleared });
});
router5.get("/admin/keys", requireAuth, requireAdmin, (_req, res) => {
  const keys = db_default.prepare(
    "SELECT provider, model, updated_at, (CASE WHEN api_key != '' THEN 1 ELSE 0 END) as has_key FROM admin_api_keys"
  ).all();
  res.json(keys);
});
router5.post("/admin/keys", requireAuth, requireAdmin, (req, res) => {
  const { provider, apiKey, model } = req.body;
  if (!provider || !apiKey) return res.status(400).json({ error: "provider and apiKey required" });
  const existing = db_default.prepare("SELECT id FROM admin_api_keys WHERE provider = ?").get(provider);
  if (existing) {
    db_default.prepare(
      "UPDATE admin_api_keys SET api_key=?, model=?, updated_by=?, updated_at=datetime('now') WHERE provider=?"
    ).run(apiKey, model || null, req.user.id, provider);
  } else {
    db_default.prepare(
      "INSERT INTO admin_api_keys (id, provider, api_key, model, updated_by) VALUES (?, ?, ?, ?, ?)"
    ).run(uuidv47(), provider, apiKey, model || null, req.user.id);
  }
  auditLog(req.user.id, req.user.schoolId, "admin.api_key_update", "admin_api_keys", provider, { provider }, req.ip);
  res.json({ success: true });
});
router5.delete("/admin/keys/:provider", requireAuth, requireAdmin, (req, res) => {
  db_default.prepare("DELETE FROM admin_api_keys WHERE provider = ?").run(req.params.provider);
  res.json({ success: true });
});
router5.get("/filter-log", requireAuth, (req, res) => {
  const logs = db_default.prepare(
    `SELECT afl.*, u.display_name FROM ai_filter_log afl
     LEFT JOIN users u ON afl.user_id = u.id
     WHERE afl.school_id = ? ORDER BY afl.created_at DESC LIMIT 200`
  ).all(req.user.schoolId);
  res.json(logs);
});
router5.get("/stats", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  const totalRequests = db_default.prepare("SELECT COUNT(*) as c FROM ai_filter_log WHERE school_id=?").get(schoolId)?.c || 0;
  const flaggedRequests = db_default.prepare("SELECT COUNT(*) as c FROM ai_filter_log WHERE school_id=? AND flagged=1").get(schoolId)?.c || 0;
  const todayRequests = db_default.prepare("SELECT COUNT(*) as c FROM ai_filter_log WHERE school_id=? AND date(created_at)=date('now')").get(schoolId)?.c || 0;
  const topUsers = db_default.prepare(
    `SELECT u.display_name, COUNT(*) as requests FROM ai_filter_log afl
     JOIN users u ON afl.user_id=u.id WHERE afl.school_id=?
     GROUP BY afl.user_id ORDER BY requests DESC LIMIT 5`
  ).all(schoolId);
  res.json({ totalRequests, flaggedRequests, todayRequests, topUsers });
});
async function callGroq(system, user2, key, model, maxTokens, signal) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user2 }
      ],
      max_tokens: maxTokens,
      temperature: 0.3
    })
  });
  if (res.status === 429) throw new Error(`Groq 429: rate limited`);
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");
  return content;
}
async function callGemini(system, user2, key, maxTokens, signal, model = "gemini-2.5-flash") {
  const body = {
    contents: [{ role: "user", parts: [{ text: user2 }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.1 }
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  if (res.status === 429) throw new Error(`Gemini ${model} 429: rate limited`);
  if (!res.ok) throw new Error(`Gemini ${model} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error(`Gemini ${model} returned empty content`);
  return content;
}
async function callOpenAI(system, user2, key, model, maxTokens, signal) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user2 }
      ],
      max_tokens: maxTokens
    })
  });
  if (res.status === 429) throw new Error(`OpenAI 429: rate limited`);
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
async function callOpenRouter(system, user2, key, model, maxTokens, signal) {
  const fallbackModels = [
    model,
    "meta-llama/llama-4-scout:free",
    // Meta Llama 4 Scout — best free model
    "google/gemini-2.5-flash-exp:free",
    // Gemini 2.5 Flash experimental — very fast
    "mistralai/mistral-small-3.1-24b-instruct:free",
    // Mistral Small 3.1 — strong instruction following
    "nvidia/llama-3.1-nemotron-70b-instruct:free",
    // NVIDIA Nemotron 70B — high quality
    "meta-llama/llama-3.3-70b-instruct:free",
    // Llama 3.3 70B — reliable fallback
    "qwen/qwen3-30b-a3b:free"
    // Qwen3 30B — good for structured JSON
  ].filter(Boolean);
  for (const m of fallbackModels) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://adaptly.co.uk",
          "X-Title": "Adaptly"
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: "system", content: system || "You are a helpful SEND education assistant." },
            { role: "user", content: user2 }
          ],
          max_tokens: maxTokens
        })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    } catch {
      continue;
    }
  }
  throw new Error("OpenRouter: all models failed");
}
async function callClaude(system, user2, key, maxTokens, signal) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: maxTokens,
      system: system || "You are a helpful SEND education assistant.",
      messages: [{ role: "user", content: user2 }]
    })
  });
  if (res.status === 429) throw new Error(`Claude 429: rate limited`);
  if (res.status === 529) throw new Error(`Claude 529: overloaded`);
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content[0].text;
}
async function callHuggingFace(system, user2, key, maxTokens, signal) {
  const models = [
    "Qwen/Qwen2.5-72B-Instruct",
    "meta-llama/Llama-3.1-8B-Instruct",
    "HuggingFaceH4/zephyr-7b-beta"
  ];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`,
        {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system || "You are a helpful SEND education assistant." },
              { role: "user", content: user2 }
            ],
            max_tokens: maxTokens,
            temperature: 0.7
          })
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    } catch {
      continue;
    }
  }
  throw new Error("HuggingFace: all models failed");
}
async function callMistral(system, user2, key, model, maxTokens, signal) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user2 }
      ],
      max_tokens: maxTokens,
      temperature: 0.3
    })
  });
  if (res.status === 429) throw new Error(`Mistral 429: rate limited`);
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
async function callDeepSeek(system, user2, key, model, maxTokens, signal) {
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user2 }
      ],
      max_tokens: maxTokens,
      temperature: 0.3
    })
  });
  if (res.status === 429) throw new Error(`DeepSeek 429: rate limited`);
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
async function callCohere(system, user2, key, model, maxTokens, signal) {
  const res = await fetch("https://api.cohere.com/v2/chat", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user2 }
      ],
      max_tokens: maxTokens
    })
  });
  if (res.status === 429) throw new Error(`Cohere 429: rate limited`);
  if (!res.ok) throw new Error(`Cohere ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data?.message?.content?.[0]?.text || data?.text || "";
}
async function callPerplexity(system, user2, key, model, maxTokens, signal) {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful SEND education assistant." },
        { role: "user", content: user2 }
      ],
      max_tokens: maxTokens,
      temperature: 0.3
    })
  });
  if (res.status === 429) throw new Error(`Perplexity 429: rate limited`);
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
router5.post("/diagram", requireAuth, async (req, res) => {
  const { subject, topic, yearGroup, sendNeed } = req.body;
  if (!subject || !topic) return res.status(400).json({ error: "subject and topic required" });
  const yr = yearGroup || "Year 9";
  const subjectLower = String(subject).toLowerCase();
  const topicLower = String(topic).toLowerCase();
  const combined = `${subjectLower} ${topicLower}`;
  const fitMeta = {
    maxWidth: 560,
    maxHeight: 300,
    objectFit: "contain",
    printSafe: true,
    preferLandscape: true
  };
  const buildImageResponse = (payload) => ({
    imageUrl: payload.imageUrl,
    caption: payload.caption || `${topic} \u2014 ${subject} (${yr})`,
    attribution: payload.attribution || null,
    provider: payload.provider,
    type: payload.type || (payload.imageUrl ? "image" : "none"),
    imageKind: payload.imageKind || "diagram",
    fit: fitMeta
  });
  const topicHasAny = (...terms) => terms.some((term) => combined.includes(term));
  const pickApprovedSourceFallback = () => {
    if (subjectLower.includes("biology") || subjectLower.includes("science")) {
      if (topicHasAny("cell", "cells and organisation", "animal cell", "plant cell")) {
        return buildImageResponse({
          imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/960px-Animal_cell_structure_en.svg.png",
          caption: `Animal cell structure \u2014 ${subject} (${yr})`,
          attribution: "LadyofHats, Wikimedia Commons (Public Domain)",
          provider: "wikimedia-approved",
          imageKind: "diagram"
        });
      }
      if (topicHasAny("photosynthesis", "chloroplast")) {
        return buildImageResponse({
          imageUrl: "https://bioicons.com/icons/photosynthesis.svg",
          caption: `Photosynthesis visual support \u2014 ${subject} (${yr})`,
          attribution: "Bioicons (licence retained per asset)",
          provider: "bioicons-approved",
          imageKind: "icon"
        });
      }
      if (topicHasAny("space", "solar system", "planet", "moon", "mars", "earth")) {
        return buildImageResponse({
          imageUrl: "https://images-assets.nasa.gov/image/PIA18033/PIA18033~orig.jpg",
          caption: `NASA scientific visual for ${topic} \u2014 ${subject} (${yr})`,
          attribution: "NASA",
          provider: "nasa-approved",
          imageKind: "scientific-visual"
        });
      }
      if (topicHasAny("fossil", "evolution", "natural history", "skeleton", "animal")) {
        return buildImageResponse({
          imageUrl: "https://ids.si.edu/ids/deliveryService?id=NMNH-PALEO-00001",
          caption: `Smithsonian Open Access scientific visual for ${topic} \u2014 ${subject} (${yr})`,
          attribution: "Smithsonian Open Access (CC0)",
          provider: "smithsonian-approved",
          imageKind: "scientific-visual"
        });
      }
    }
    if (subjectLower.includes("geography") && topicHasAny("earth", "planet", "climate", "weather", "storm", "atmosphere")) {
      return buildImageResponse({
        imageUrl: "https://images-assets.nasa.gov/image/iss063e054463/iss063e054463~orig.jpg",
        caption: `NASA Earth visual for ${topic} \u2014 ${subject} (${yr})`,
        attribution: "NASA",
        provider: "nasa-approved",
        imageKind: "scientific-visual"
      });
    }
    if ((subjectLower.includes("art") || subjectLower.includes("design")) && topicHasAny("texture", "nature", "landscape", "light", "shadow")) {
      return buildImageResponse({
        imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        caption: `${topic} reference photo \u2014 ${subject} (${yr})`,
        attribution: "Unsplash",
        provider: "unsplash-approved",
        imageKind: "photo"
      });
    }
    if (topicHasAny("habitat", "forest", "ocean", "animal", "plant")) {
      return buildImageResponse({
        imageUrl: "https://cdn.pixabay.com/photo/2016/11/29/09/32/animal-1866808_1280.jpg",
        caption: `${topic} reference photo \u2014 ${subject} (${yr})`,
        attribution: "Pixabay",
        provider: "pixabay-approved",
        imageKind: "photo"
      });
    }
    return null;
  };
  const bankedDiagram = findDiagram(subject, topic);
  if (bankedDiagram) {
    console.log(`[Diagram] Found in curated bank: ${bankedDiagram.key}`);
    return res.json(buildImageResponse({
      imageUrl: bankedDiagram.url,
      caption: `${bankedDiagram.label} \u2014 ${subject} (${yr})`,
      attribution: bankedDiagram.attribution,
      provider: "wikimedia-bank",
      imageKind: "diagram"
    }));
  }
  try {
    const fullBank = getFullDiagramBank();
    const fullMatch = fullBank.findDiagramFull(subject, topic);
    if (fullMatch) {
      console.log(`[Diagram] Found in full bank: ${fullMatch.key}`);
      return res.json(buildImageResponse({
        imageUrl: fullMatch.url,
        caption: `${fullMatch.label} \u2014 ${subject} (${yr})`,
        attribution: `${fullMatch.attribution} | Licence: ${fullMatch.license}`,
        provider: "wikimedia-full-bank",
        imageKind: "diagram"
      }));
    }
  } catch (fullBankErr) {
    console.warn("[Diagram] Full bank lookup failed:", fullBankErr);
  }
  try {
    const wikiResult = await Promise.race([
      searchWikimediaDiagram(subject, topic),
      new Promise((resolve) => setTimeout(() => resolve(null), 2e4))
    ]);
    if (wikiResult) {
      console.log(`[Diagram] Found via Wikimedia live search for "${topic}"`);
      return res.json(buildImageResponse({
        imageUrl: wikiResult.url,
        caption: wikiResult.caption || `${topic} \u2014 ${subject} (${yr})`,
        attribution: wikiResult.attribution,
        provider: "wikimedia-live",
        imageKind: "diagram"
      }));
    }
  } catch (wikiErr) {
    console.warn(`[Diagram] Wikimedia live search failed for "${topic}":`, wikiErr);
  }
  const approvedFallback = pickApprovedSourceFallback();
  if (approvedFallback) {
    console.log(`[Diagram] Using approved-source fallback for "${topic}" (${subject}) via ${approvedFallback.provider}`);
    return res.json(approvedFallback);
  }
  console.log(`[Diagram] No approved diagram found for "${topic}" (${subject}) \u2014 returning not-available`);
  return res.json(buildImageResponse({
    imageUrl: null,
    caption: `No diagram available for ${topic}`,
    attribution: null,
    provider: "none",
    type: "none",
    imageKind: "none"
  }));
});
router5.post("/adapt-worksheet", requireAuth, worksheetUpload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { sendNeed, yearGroup } = req.body;
  if (!sendNeed) return res.status(400).json({ error: "sendNeed is required" });
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if (!allowedMimes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Only PDF (.pdf) and Word (.doc, .docx) files are supported." });
  }
  try {
    let rawText = "";
    const mime = req.file.mimetype;
    if (mime === "application/pdf") {
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const result = await pdfParse(req.file.buffer);
        rawText = (result?.text || "").trim();
        if (rawText) console.log(`[adapt-worksheet] pdf-parse extracted ${rawText.length} chars`);
      } catch (e1) {
        console.warn("[adapt-worksheet] pdf-parse failed:", e1?.message);
      }
      if (!rawText || rawText.length < 30) {
        try {
          const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
          const lib = pdfjsLib.default || pdfjsLib;
          const pdfDoc = await lib.getDocument({ data: new Uint8Array(req.file.buffer) }).promise;
          const texts = [];
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const tc = await page.getTextContent();
            const pageText = tc.items.map((item) => item.str || "").join(" ").replace(/\s{2,}/g, " ").trim();
            if (pageText) texts.push(pageText);
          }
          rawText = texts.join("\n\n");
          if (rawText) console.log(`[adapt-worksheet] pdfjs extracted ${rawText.length} chars`);
        } catch (e2) {
          console.warn("[adapt-worksheet] pdfjs failed:", e2?.message);
        }
      }
    } else {
      try {
        const mammoth = await import("mammoth");
        const lib = mammoth.default || mammoth;
        const html = await lib.convertToHtml({ buffer: req.file.buffer });
        if (html?.value && html.value.length > 50) {
          rawText = html.value.replace(/<h[1-6][^>]*>/gi, "\n\n## ").replace(/<\/h[1-6]>/gi, "\n").replace(/<p[^>]*>/gi, "\n").replace(/<\/p>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<li[^>]*>/gi, "\n\u2022 ").replace(/<\/li>/gi, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim();
        }
        if (!rawText || rawText.length < 20) {
          const raw = await lib.extractRawText({ buffer: req.file.buffer });
          rawText = (raw?.value || "").trim();
        }
        if (rawText) console.log(`[adapt-worksheet] mammoth extracted ${rawText.length} chars`);
      } catch (e) {
        console.error("[adapt-worksheet] mammoth error:", e?.message);
      }
    }
    rawText = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, "  ").replace(/\n{4,}/g, "\n\n\n").trim();
    if (!rawText || rawText.length < 20) {
      return res.status(400).json({
        error: "Could not extract readable text from this file. The PDF may contain scanned images rather than selectable text. Please try a Word (.docx) version, or a PDF with selectable text."
      });
    }
    const truncated = rawText.length > 1e4;
    const textForAI = rawText.slice(0, 1e4);
    const schoolId = req.user?.schoolId ?? void 0;
    const yr = yearGroup || "Year 9";
    const sendNeedLower = (sendNeed || "").toLowerCase().trim();
    const sendFormattingGuide = (() => {
      if (sendNeedLower.includes("dyslexia")) return "Dyslexia: Bold all key terms at first use. Break any paragraph longer than 3 lines into shorter ones. Add clear section dividers (---). Number all questions explicitly if not already numbered. Add a 'Key Vocabulary' box at the top if there are subject terms.";
      if (sendNeedLower.includes("asc") || sendNeedLower.includes("autism") || sendNeedLower.includes("asperger")) return "Autism/ASC: Number every instruction explicitly (Step 1, Step 2...). Add a 'What you need to do:' box before each section. Remove any figurative or ambiguous language from instructions. Use consistent terminology \u2014 pick one word per concept and never vary it.";
      if (sendNeedLower.includes("adhd")) return "ADHD: Add a \u2610 tick box at the start of every question. Add 'BRAIN BREAK \u2014 stand up and stretch!' after every 4\u20135 questions. Bold the key action word in every instruction (e.g. Calculate, Describe, Name). Add visual dividers between questions.";
      if (sendNeedLower.includes("pda") || sendNeedLower.includes("odd")) return "PDA: Reframe all instructions as invitations ('You might like to...' rather than 'You must...'). Rename sections to offer choice ('Explore \u2014 choose where to start'). Add natural break points. Mark the challenge as optional.";
      if (sendNeedLower.includes("slcn") || sendNeedLower.includes("speech") || sendNeedLower.includes("language") || sendNeedLower.includes("communication")) return "SLCN: Add a Word Bank with plain-English definitions for all subject vocabulary. Add sentence frames for every answer requiring writing (e.g. 'The answer is ___ because ___'). Keep every sentence under 12 words. Replace open questions with fill-in-the-blank or matching where possible.";
      if (sendNeedLower.includes("mld") || sendNeedLower.includes("moderate learning")) return "MLD: Add a full model answer for question 1. Add a hint or sentence starter for every Section A question. Add a 'Help Box' with key facts/formulas at the top of Section B. Use KS2-level language throughout.";
      if (sendNeedLower.includes("dyscalculia")) return "Dyscalculia: Break every calculation into numbered sub-steps with blanks (Step 1: ___ Step 2: ___). Include a number line or key facts box. Show every arithmetic step in the worked example with 'why' annotations. Add real-world context to word problems.";
      if (sendNeedLower.includes("dyspraxia") || sendNeedLower.includes("dcd")) return "Dyspraxia/DCD: Replace extended writing with tick boxes, circle-the-answer, or matching formats wherever possible. Make answer boxes noticeably large. Reduce the number of questions requiring sustained handwriting.";
      if (sendNeedLower.includes("vi") || sendNeedLower.includes("visual impairment")) return "Visual Impairment: Add text descriptions for every diagram or image. Increase recommended font size to 18pt+. Add high-contrast section headers. Remove any content that relies solely on visual interpretation.";
      if (sendNeedLower.includes("hi") || sendNeedLower.includes("hearing")) return "Hearing Impairment: Ensure all instructions are fully self-contained in writing. Add a Word Bank with definitions. Remove any references to listening or audio activities. Add a visual cue (arrow, icon) next to every key instruction.";
      if (sendNeedLower.includes("tourette") || sendNeedLower.includes("tics")) return "Tourette's: Add natural pause/break points between sections. Remove any timed-pressure language ('quickly', 'in 2 minutes'). Use multiple response formats (tick, circle, fill-in) to reduce sustained writing demands.";
      if (sendNeedLower.includes("anxiety") || sendNeedLower.includes("semh") || sendNeedLower.includes("mental health")) return "Anxiety/SEMH: Rename Section A as 'Warm-Up \u2014 no pressure!'. Mark the challenge as 'OPTIONAL BONUS \u2014 only if you want to'. Add a supportive statement at the start of each section. Replace 'must/should' with 'try to/have a go at'.";
      if (sendNeedLower.includes("eal") || sendNeedLower.includes("english as an additional")) return "EAL: Bold all subject-specific vocabulary. Add a Key Vocabulary box at the top with plain-English definitions. Provide sentence frames for written answers. Remove UK-specific idioms. Keep instructions to max 15 words each.";
      return "SEND: Add clear numbered section headings. Bold all key terms. Add extra white space between questions. Number all questions if not already numbered.";
    })();
    const system = `You are an expert UK educational content specialist reformatting a worksheet for a student with ${sendNeed}.

ABSOLUTE RULES:
1. Every question, task, and instruction from the original MUST appear in the output word-for-word. Never paraphrase, simplify, or remove content.
2. All mathematical symbols (\xD7, \xF7, \u221A, \xB2, \u03C0, \u2264, \u2265, \u2260), fractions, equations, and numbers must be preserved exactly.
3. The ONLY permitted changes are formatting/presentation changes specified in the SEND guidance below.
4. Do NOT add word banks, hints, worked examples, sentence starters, or scaffolding unless specifically instructed in the SEND guidance.
5. Return ONLY valid JSON \u2014 no markdown code fences, no text outside the JSON object.`;
    const user2 = `Reformat this worksheet for a student with ${sendNeed} in ${yr}.

SEND FORMATTING GUIDANCE (apply these changes only):
${sendFormattingGuide}

SECTION TYPES \u2014 map each section to one of these:
"objective" | "vocabulary" | "starter" | "example" | "guided" | "independent" | "challenge" | "questions" | "reminder-box" | "teacher-notes"

Return this exact JSON structure:
{
  "title": "exact title from original",
  "subtitle": "${yr} \u2014 Adapted for ${sendNeed}",
  "sections": [
    {
      "title": "section heading from original",
      "type": "guided",
      "content": "ALL original content reproduced verbatim with ONLY the permitted formatting changes applied",
      "teacherOnly": false
    }
  ],
  "teacherSection": {
    "title": "Teacher Notes",
    "type": "teacher-notes",
    "content": "List of formatting adaptations applied. Any mark scheme content from the original.",
    "teacherOnly": true
  },
  "adaptationsSummary": ["Brief description of each change made"]
}

ORIGINAL WORKSHEET:
${textForAI}${truncated ? "\n\n[Truncated at 10,000 characters]" : ""}`;
    const { content: aiResponse, provider } = await callWithFallback(system, user2, 6e3, void 0, schoolId);
    const tryParse = (raw) => {
      if (!raw?.trim()) return null;
      const attempts = [
        raw,
        raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
      ];
      for (const s of attempts) {
        const m = s.match(/\{[\s\S]*\}/);
        const candidate = m ? m[0] : s;
        if (!candidate?.startsWith("{")) continue;
        try {
          return JSON.parse(candidate);
        } catch (_) {
        }
        try {
          const sanitized = candidate.replace(
            /"((?:[^"\\]|\\.)*)"/g,
            (_, inner) => `"${inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`
          );
          return JSON.parse(sanitized);
        } catch (_) {
        }
      }
      return null;
    };
    let parsed = tryParse(aiResponse);
    if (!parsed?.sections?.length) {
      console.warn("[adapt-worksheet] JSON parse failed, using plain text fallback");
      const cleanText = aiResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      parsed = {
        title: req.file?.originalname?.replace(/\.[^.]+$/, "") || "Adapted Worksheet",
        subtitle: `${yr} \u2014 Adapted for ${sendNeed}`,
        sections: [
          { title: "Adapted Content", type: "guided", content: cleanText || textForAI, teacherOnly: false }
        ],
        teacherSection: {
          title: "Teacher Notes",
          type: "teacher-notes",
          content: `Formatted for ${sendNeed}. ${sendFormattingGuide}`,
          teacherOnly: true
        },
        adaptationsSummary: [`Content reformatted for ${sendNeed}`]
      };
    } else {
      parsed.sections = parsed.sections.map((s) => {
        let c = s.content;
        if (typeof c !== "string") c = Array.isArray(c) ? c.join("\n") : String(c ?? "");
        return { ...s, title: String(s.title || ""), content: c.trim() || "[Content unavailable]" };
      });
    }
    if (!parsed.sections.find((s) => s.teacherOnly)) {
      if (parsed.teacherSection) {
        parsed.sections.push({ ...parsed.teacherSection, teacherOnly: true });
      }
    }
    res.json({ adapted: parsed, provider });
  } catch (err) {
    console.error("[adapt-worksheet] error:", err);
    res.status(500).json({ error: err.message || "Failed to adapt worksheet" });
  }
});
router5.post("/differentiate-worksheet", requireAuth, async (req, res) => {
  const { sections, tier, subject, topic, yearGroup, title } = req.body;
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: "sections array is required" });
  }
  if (!tier || tier !== "foundation" && tier !== "higher") {
    return res.status(400).json({ error: "tier must be 'foundation' or 'higher'" });
  }
  const schoolId = req.user?.schoolId ?? void 0;
  const yr = yearGroup || "Year 9";
  const tierRules = tier === "foundation" ? `FOUNDATION TIER RULES:
- Simplify all questions to single-skill, grade 1-5 level
- Add hints or sentence starters to every Section A question
- Use whole numbers and simple values only
- Break multi-step questions into sub-parts (a)(b)
- Keep language simple and direct
- Add a Word Bank with 4-6 key terms
- Challenge = straightforward application, not proof` : `HIGHER TIER RULES:
- Increase all questions to multi-step, grade 5-9 level
- Section A starts at grade 5 \u2014 no trivial recall
- Section B must include reasoning/proof/'show that' questions
- Use precise subject language and notation
- Include algebraic/symbolic manipulation
- Challenge = grade 8-9 proof or multi-concept problem`;
  const pupilSections = sections.filter(
    (s) => !s.teacherOnly && !/word.?bank|worked.?example|reminder.?box|key.?vocab|key.?formula|learning.?obj/i.test(s.title || "")
  );
  const existingContent = pupilSections.map((s, i) => {
    return `=== ${s.title || `Section ${i + 1}`} ===
${(s.content || "").slice(0, 300)}`;
  }).join("\n\n").slice(0, 3e3);
  const system = `You are an expert UK teacher differentiating a worksheet for ${yr} pupils. Transform the existing worksheet to ${tier} tier difficulty. Preserve the topic and structure \u2014 only adjust question difficulty. Return valid JSON only. CRITICAL: The "content" field of every section MUST be a plain text string (NOT an array, NOT an object, NOT nested JSON). Write all questions as numbered plain text lines separated by newlines within the string.`;
  const user2 = `Transform this ${subject || ""} worksheet on "${topic || ""}" to ${tier.toUpperCase()} tier for ${yr}.

${tierRules}

EXISTING WORKSHEET (adjust difficulty of each section):
${existingContent}

Return a JSON object:
{
  "sections": [
    {"title": "original section title", "type": "guided", "content": "1. Question one
2. Question two
3. Question three", "teacherOnly": false}
  ],
  "tierApplied": "${tier}",
  "changesNote": "brief summary of changes made"
}
IMPORTANT: The "content" value MUST be a plain text string with questions written as numbered lines. Do NOT use arrays or nested objects for content.`;
  try {
    const { content, provider } = await callWithFallback(system, user2, 2e3, void 0, schoolId);
    const tryParse = (raw) => {
      try {
        const s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        const m = s.match(/\{[\s\S]*\}/);
        const candidate = m ? m[0] : s;
        try {
          return JSON.parse(candidate);
        } catch (_) {
        }
        const sanitized = candidate.replace(
          /"((?:[^"\\]|\\.)*)"/g,
          (_match, inner) => {
            const fixed = inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
            return `"${fixed}"`;
          }
        );
        return JSON.parse(sanitized);
      } catch (_) {
        return null;
      }
    };
    const parsed = tryParse(content);
    if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
      parsed.sections = parsed.sections.map((s) => ({
        ...s,
        title: typeof s.title === "string" ? s.title : String(s.title || ""),
        content: (() => {
          const c = s.content;
          if (typeof c === "string") return c;
          if (c === null || c === void 0) return "";
          if (Array.isArray(c)) {
            return c.map((item) => {
              if (typeof item === "string") return item;
              if (typeof item === "object" && item !== null) {
                const q = item.q || item.question || item.text || item.content || "";
                const a = item.a || item.answer || "";
                const marks = item.marks ? ` [${item.marks} mark${item.marks > 1 ? "s" : ""}]` : "";
                if (q && a) return `${q}${marks}
   Answer: ${a}`;
                if (q) return `${q}${marks}`;
                return JSON.stringify(item);
              }
              return String(item);
            }).join("\n\n");
          }
          if (typeof c === "object") {
            const q = c.q || c.question || c.text || c.content || "";
            const a = c.a || c.answer || "";
            if (q && a) return `${q}
   Answer: ${a}`;
            if (q) return q;
            try {
              return JSON.stringify(c);
            } catch {
              return String(c);
            }
          }
          return String(c);
        })()
      }));
      res.json({ differentiated: parsed, provider });
    } else {
      res.status(500).json({ error: "AI returned invalid structure \u2014 please try again" });
    }
  } catch (err) {
    console.error("Differentiate worksheet error:", err);
    res.status(500).json({ error: err?.message || "Failed to differentiate worksheet" });
  }
});
router5.post("/scaffold-worksheet", requireAuth, async (req, res) => {
  const { sections, sendNeed, subject, topic, yearGroup, title } = req.body;
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ error: "sections array is required" });
  }
  const schoolId = req.user?.schoolId ?? void 0;
  const yr = yearGroup || "Year 9";
  const sn = (sendNeed || "").toLowerCase();
  const buildLocalScaffold = (inputSections, sendNeedLower) => {
    const extractTerms = (content) => {
      const matches = (content || "").match(/\b[A-Za-z][A-Za-z\-]{3,}\b/g) || [];
      const seen = /* @__PURE__ */ new Set();
      const out = [];
      for (const raw of matches) {
        const w = raw.trim();
        const key = w.toLowerCase();
        if (seen.has(key)) continue;
        if (["section", "question", "teacher", "student", "worksheet", "learning", "objectives", "worked", "example", "reminder", "challenge", "common", "mistakes", "problem"].includes(key)) continue;
        seen.add(key);
        out.push(w);
        if (out.length >= 8) break;
      }
      return out;
    };
    const cleanLine = (line) => String(line || "").replace(/^_+(?=[A-Za-z0-9(])/g, "").replace(/[ \t]+$/g, "");
    const buildHeader = () => {
      if (sendNeedLower.includes("adhd")) {
        return [
          "Quick Start:",
          "1. Read one question only.",
          "2. Highlight the key number or word.",
          "3. Use the hint before you answer.",
          "4. Tick the question when you finish.",
          ""
        ].join("\n");
      }
      if (sendNeedLower.includes("asc") || sendNeedLower.includes("autism") || sendNeedLower.includes("asperger")) {
        return [
          "What you need to do:",
          "1. Read the instruction exactly.",
          "2. Complete the first part.",
          "3. Check your answer against the key word.",
          "4. Move to the next question.",
          ""
        ].join("\n");
      }
      if (sendNeedLower.includes("mld") || sendNeedLower.includes("moderate learning")) {
        return [
          "Help Box:",
          "- Read the question carefully.",
          "- Find the important word or number.",
          "- Answer one step at a time.",
          ""
        ].join("\n");
      }
      return [
        "Steps to follow:",
        "1. Read the question carefully.",
        "2. Find the key information.",
        "3. Use the hint if you need help.",
        "4. Check your answer at the end.",
        ""
      ].join("\n");
    };
    const buildHint = (line) => {
      if (/\d|=|\+|-|×|÷|\//.test(line)) return "Hint: Show one step at a time.";
      if (/explain|describe|why|how/i.test(line)) return "Hint: Use because in your answer.";
      if (/compare|difference|similar/i.test(line)) return "Hint: Write one point for each side.";
      return "Hint: Use the key word from the question in your answer.";
    };
    const buildSentenceStarter = (line) => {
      if (/what type/i.test(line)) return "Sentence starter: This is a ______ angle because ______.";
      if (/explain|why/i.test(line)) return "Sentence starter: This happens because ______.";
      if (/describe/i.test(line)) return "Sentence starter: I can describe this as ______.";
      if (/how/i.test(line)) return "Sentence starter: First, ______. Then, ______.";
      if (/compare/i.test(line)) return "Sentence starter: One similarity is ______ and one difference is ______.";
      return "Sentence starter: The answer is ______ because ______.";
    };
    const scaffoldQuestionLine = (line) => {
      const cleaned = cleanLine(line);
      if (!cleaned.trim()) return "";
      const questionLike = /\?\s*$/.test(cleaned) || /(^|\s)(q\d+|question\s*\d+|problem\s*\d+|\d+[.)])/i.test(cleaned);
      if (!questionLike) return cleaned;
      const prefixed = /^\s*\[ \]/.test(cleaned) ? cleaned : `[ ] ${cleaned}`;
      return [prefixed, buildHint(cleaned), buildSentenceStarter(cleaned)].join("\n");
    };
    const addScaffoldToContent = (content, index) => {
      const original = String(content || "").replace(/\r/g, "").trim();
      const lines = original.split("\n");
      const transformed = lines.map(scaffoldQuestionLine).join("\n").replace(/\n{3,}/g, "\n\n").trim();
      return `${buildHeader()}${transformed}`.trim();
    };
    const allText = inputSections.map((s) => `${s.title || ""} ${s.content || ""}`).join(" \n ");
    const terms = extractTerms(allText);
    const wordBank = terms.length ? terms.map((t) => `${t} | key term used in this worksheet`).join("\n") : "keyword | important word in the question\nmethod | the steps you use\nevidence | information that supports your answer\nanswer | what you write in response";
    const scaffoldedSections = inputSections.map((section, index) => {
      const title2 = section.title || `Section ${index + 1}`;
      const normalizedType = index === 0 ? "guided" : section.type || "guided";
      return {
        title: title2,
        type: normalizedType,
        teacherOnly: !!section.teacherOnly,
        content: addScaffoldToContent(section.content || "", index)
      };
    });
    return {
      sections: scaffoldedSections,
      wordBank,
      scaffoldingApplied: [
        "Added a visible Word Bank with key vocabulary",
        "Added structured steps at the start of each section",
        "Added hints after question lines",
        "Added sentence starters for written responses",
        "Added tick boxes before question prompts",
        "Removed stray leading underscore placeholders"
      ]
    };
  };
  const getScaffoldingRules = (sendNeedLower) => {
    if (sendNeedLower.includes("dyslexia")) return `DYSLEXIA SCAFFOLDING RULES:
- Use 1.5x line spacing suggestions (add blank lines between questions)
- Bold all key terms and command words
- Break long sentences into shorter ones (max 15 words)
- Add a Word Bank box at the top with 6-8 key terms and simple definitions
- For every question that requires a written answer, add a sentence starter: e.g. "The answer is ___ because ___"
- Replace any gap-fill answers with clearly marked blanks: ___________
- Add a 'Steps to follow' box before each section
- Use numbered bullet points for multi-part instructions`;
    if (sendNeedLower.includes("adhd")) return `ADHD SCAFFOLDING RULES:
- Break the worksheet into very short chunks (max 3-4 questions per section)
- Add clear section dividers with bold headings
- Bold all key words and action verbs
- Add a 'Quick Start' box at the top: "You need to: 1) ___ 2) ___ 3) ___"
- For every question, add a hint in brackets: (Hint: start by...)
- Add tick boxes next to each question so students can track progress: [ ]
- Replace open-ended questions with structured answer frames where possible
- Add a 'Take a break here if you need to' prompt midway through
- Keep answer spaces generous and clearly marked`;
    if (sendNeedLower.includes("asc") || sendNeedLower.includes("autism") || sendNeedLower.includes("asperger")) return `AUTISM/ASC SCAFFOLDING RULES:
- Replace ALL figurative language and idioms with literal alternatives
- Add a 'What you need to do:' box at the start of every section listing exact steps
- For every question, add a worked identical example immediately before it labelled 'EXAMPLE:'
- Use consistent terminology throughout \u2014 never mix synonyms (always 'calculate', never 'find'/'work out')
- Add a numbered 'Steps to follow' checklist before each section
- Use neutral, factual contexts \u2014 remove any social/emotional scenarios
- Add a completion checklist at the end: '\u2610 Section A \u2610 Section B \u2610 Challenge'
- Make all instructions explicit \u2014 no implied steps`;
    if (sendNeedLower.includes("mld") || sendNeedLower.includes("moderate learning")) return `MLD SCAFFOLDING RULES:
- Add a 'Help Box' at the top of each section with key facts, formulas, and vocabulary
- For every question in Section A, add either: (a) a sentence starter, (b) a partially completed answer, or (c) a hint
- Replace multi-step questions with sub-parts (a) and (b)
- Add a fully completed model answer for the first question of each section
- Include a Word Bank with simple definitions
- Use concrete examples before abstract questions
- Add picture/emoji-based self-assessment at the end`;
    if (sendNeedLower.includes("slcn") || sendNeedLower.includes("speech") || sendNeedLower.includes("language") || sendNeedLower.includes("communication")) return `SLCN SCAFFOLDING RULES:
- Add a prominent Word Bank at the start with every key term defined in plain English (max 8 terms)
- For every question requiring a written answer, provide a sentence frame: e.g. '_____ is important because _____'
- Add a 'Key Phrases' box with useful language structures
- Convert at least 3 questions to matching, labelling, or multiple-choice format
- Use short, simple sentences \u2014 avoid complex clauses
- Bold the key action word in every instruction
- Add visual cues (arrows, boxes) alongside text`;
    if (sendNeedLower.includes("anxiety") || sendNeedLower.includes("mental health") || sendNeedLower.includes("semh")) return `ANXIETY/SEMH SCAFFOLDING RULES:
- Add a 'How are you feeling?' emoji check-in at the start: \u{1F615} \u{1F642} \u{1F600}
- Rename sections with encouraging labels: 'Warm-Up \u2014 no pressure!' and 'Main Practice \u2014 you've got this!'
- Add a positive statement before each section: 'You already know how to do this \u2014 let's practise!'
- Replace all 'must'/'should'/'need to' language with 'try to'/'you might like to'
- Label the challenge section: 'OPTIONAL BONUS \u2014 only if you want to!'
- Add a 'Tip' box in each section with a helpful reminder
- Add a 'Take a break here if you need to' prompt midway
- End with a 'How did you do?' emoji scale`;
    if (sendNeedLower.includes("eal") || sendNeedLower.includes("esl") || sendNeedLower.includes("additional language")) return `EAL SCAFFOLDING RULES:
- Add a bilingual-friendly Word Bank at the start with every subject-specific term defined in plain English
- For every question, add a sentence frame in English
- Add a 'Key Phrases' box with useful academic language
- Include at least 2 visual/diagram-based questions
- Use simple, short sentences \u2014 avoid idioms and culturally specific references
- Bold key instruction words
- Use culturally neutral contexts throughout`;
    if (sendNeedLower.includes("dyspraxia") || sendNeedLower.includes("dcd") || sendNeedLower.includes("coordination")) return `DYSPRAXIA/DCD SCAFFOLDING RULES:
- Add large, clearly marked answer boxes after every question
- Convert at least 3 questions to tick-box, circle-the-answer, or matching format
- Add sentence frames for all written answer questions
- Use numbered bullet points for all instructions
- Add generous white space between all questions
- Minimise handwriting demands \u2014 use structured answer frames
- Keep instructions brief and clear`;
    if (sendNeedLower.includes("dyscalculia")) return `DYSCALCULIA SCAFFOLDING RULES:
- Add a 'Key Facts' box at the top with all formulas and number facts needed
- For every calculation question, add a partially completed working-out frame
- Provide a number line or multiplication grid as a reference tool
- Break every multi-step calculation into clearly numbered sub-steps
- Add a 'Check your answer' prompt after each question
- Use concrete examples (money, measurements) before abstract numbers
- Provide a worked example with every new question type`;
    return `GENERAL SEND SCAFFOLDING RULES:
- Add a Word Bank at the top with 6-8 key terms and simple definitions
- For every question requiring a written answer, add a sentence starter or answer frame
- Add a 'Steps to follow' box before each section
- Add hints in brackets for every question: (Hint: ...)
- Break multi-step questions into sub-parts (a) and (b)
- Add tick boxes next to each question: [ ]
- Add generous white space between questions
- End with a simple self-assessment: 'I found this: \u{1F615} \u{1F642} \u{1F600}'`;
  };
  const scaffoldingRules = getScaffoldingRules(sn);
  const existingContent = sections.map((s, i) => {
    return `=== SECTION ${i + 1}: ${s.title || "Section"} ===
${s.content || ""}`;
  }).join("\n\n");
  const system = `You are an expert SEND teacher specialising in creating scaffolded worksheets for UK schools.
Your task is to TRANSFORM an existing worksheet by adding real SEND scaffolding \u2014 gap fills, sentence starters, word banks, hint boxes, answer frames \u2014 while keeping EVERY original question, task, and piece of content VERBATIM.

CRITICAL RULES:
1. EVERY original question, instruction, and piece of content MUST appear in the output \u2014 do NOT remove or skip anything.
2. ALL mathematical symbols, operators, and notation must be preserved exactly: \xD7, \xF7, \u221A, \xB2, \xB3, \u03C0, \u2264, \u2265, \u2260, fractions, equations.
3. ALL numbers, values, and data must be identical to the original.
4. You MUST add real scaffolding: gap fills (___________), sentence starters, word banks, hint boxes, answer frames, step-by-step guides.
5. The scaffolding should be WOVEN INTO the existing content \u2014 not just added as a separate section.
6. Return a JSON array of sections matching the original structure, with scaffolding added to each section's content.
7. Do NOT invent new questions \u2014 only add scaffolding to existing ones.`;
  const user2 = `Transform this worksheet with ${sendNeed} scaffolding for ${yr} pupils.

${scaffoldingRules}

ORIGINAL WORKSHEET CONTENT (preserve every question verbatim, add scaffolding):
${existingContent.slice(0, 8e3)}

Return a JSON object with this EXACT structure:
{
  "sections": [
    {
      "title": "Original section title",
      "type": "guided",
      "content": "The ORIGINAL content with SEND scaffolding woven in \u2014 gap fills, sentence starters, word banks, hints. Every original question preserved verbatim.",
      "teacherOnly": false
    }
  ],
  "wordBank": "Word Bank added at the top (if applicable for this SEND need)",
  "scaffoldingApplied": ["List of specific scaffolding changes made"]
}`;
  try {
    const { content, provider } = await callWithFallback(system, user2, 4e3, void 0, schoolId);
    const tryParseJSON = (raw) => {
      try {
        const s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        const m = s.match(/\{[\s\S]*\}/);
        const candidate = m ? m[0] : s;
        try {
          return JSON.parse(candidate);
        } catch (_) {
        }
        const sanitized = candidate.replace(
          /"((?:[^"\\]|\\.)*)"/g,
          (_match, inner) => {
            const fixed = inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
            return `"${fixed}"`;
          }
        );
        return JSON.parse(sanitized);
      } catch (_) {
        return null;
      }
    };
    const parsed = tryParseJSON(content);
    if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
      res.json({ scaffolded: parsed, provider });
    } else {
      res.json({
        scaffolded: {
          sections,
          scaffoldingApplied: ["Scaffolding could not be applied \u2014 please try again"]
        },
        provider,
        fallback: true
      });
    }
  } catch (err) {
    console.error("Scaffold worksheet error:", err);
    const errMsg = err?.message || "Failed to scaffold worksheet";
    if (errMsg.includes("All AI providers failed") || errMsg.includes("429") || errMsg.includes("quota")) {
      return res.json({
        scaffolded: buildLocalScaffold(sections, sn),
        provider: "local-fallback",
        fallback: true,
        warning: "AI providers were temporarily unavailable, so a built-in SEND scaffold was applied instead."
      });
    }
    res.status(500).json({ error: errMsg });
  }
});
router5.post("/book-questions", requireAuth, worksheetUpload.single("file"), async (req, res) => {
  const { bookTitle, author, readingAge, yearGroup, pagesFrom, pagesTo, chapterInfo, questionCount } = req.body;
  if (!bookTitle) return res.status(400).json({ error: "bookTitle is required" });
  const schoolId = req.user?.schoolId ?? void 0;
  let criteriaText = "";
  if (req.file) {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    if (allowedMimes.includes(req.file.mimetype)) {
      try {
        if (req.file.mimetype === "application/pdf") {
          const { PDFParse } = await import("pdf-parse");
          const parser = new PDFParse({ data: req.file.buffer, verbosity: 0 });
          await parser.load();
          const result = await parser.getText();
          if (result?.pages && Array.isArray(result.pages)) {
            criteriaText = result.pages.map((p) => p.text || "").join("\n\n");
          } else if (typeof result?.text === "string") {
            criteriaText = result.text;
          } else {
            criteriaText = "";
          }
        } else if (req.file.mimetype === "text/plain") {
          criteriaText = req.file.buffer.toString("utf-8");
        } else {
          const mammoth = await import("mammoth");
          const mammothLib = mammoth.default || mammoth;
          const result = await mammothLib.extractRawText({ buffer: req.file.buffer });
          criteriaText = result.value || "";
        }
        criteriaText = criteriaText.slice(0, 6e3).trim();
      } catch (e) {
        console.warn("[book-questions] criteria file parse error:", e?.message);
      }
    }
  }
  const ageLabel = readingAge || yearGroup || "age-appropriate";
  const numQuestions = parseInt(questionCount || "8", 10) || 8;
  const pagesLabel = pagesFrom && pagesTo ? `pages ${pagesFrom}\u2013${pagesTo}` : pagesFrom ? `from page ${pagesFrom}` : "the section they have read";
  const authorLabel = author ? ` by ${author}` : "";
  const system = `You are an expert UK primary and secondary school teacher specialising in reading comprehension and literacy assessment. You generate high-quality, age-appropriate comprehension questions that genuinely test a pupil's understanding of a book or text they have read.`;
  const user2 = `Generate ${numQuestions} comprehension questions for pupils who have just read ${pagesLabel} of the book "${bookTitle}"${authorLabel}.

Pupil reading age / level: ${ageLabel}
${yearGroup ? `Year group: ${yearGroup}` : ""}
${chapterInfo ? `
Context / chapter summary provided by teacher:
${chapterInfo}` : ""}
${criteriaText ? `
Assessment criteria / mark scheme (base questions on this):
${criteriaText}` : ""}

Requirements:
- Questions must be directly answerable from the pages the pupil has read
- Vary question types: literal recall (2), inference (2), vocabulary/language (2), personal response/evaluation (2)
- Match vocabulary and sentence complexity to the reading age: ${ageLabel}
- For younger readers (age 6-9): short, clear questions with simple vocabulary
- For older readers (age 10+): include inference, authorial intent, and evaluative questions
- Number each question Q1\u2013Q${numQuestions}
- After the questions, add a brief TEACHER NOTES section with suggested answers / marking guidance

Format your response as JSON:
{
  "questions": [
    { "number": 1, "type": "literal", "question": "...", "marks": 1 },
    { "number": 2, "type": "inference", "question": "...", "marks": 2 },
    { "number": 3, "type": "vocabulary", "question": "...", "marks": 1 },
    { "number": 4, "type": "evaluation", "question": "...", "marks": 3 }
  ],
  "teacherNotes": [
    { "number": 1, "guidance": "Accept any answer that mentions..." }
  ]
}`;
  try {
    const { content, provider } = await callWithFallback(system, user2, Math.max(2e3, numQuestions * 250), void 0, schoolId);
    let parsed;
    try {
      const stripped = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : stripped);
    } catch {
      const lines = content.split("\n").filter((l) => /^Q?\d+[.)]/i.test(l.trim()));
      parsed = {
        questions: lines.map((l, i) => ({ number: i + 1, type: "comprehension", question: l.replace(/^Q?\d+[.\)\s]+/i, "").trim(), marks: 1 })),
        teacherNotes: []
      };
    }
    res.json({ ...parsed, provider });
  } catch (err) {
    console.error("[book-questions] error:", err);
    res.status(500).json({ error: err.message || "Failed to generate questions" });
  }
});
router5.post("/book-review", requireAuth, async (req, res) => {
  const { bookTitle, author, yearGroup, genre } = req.body;
  if (!bookTitle) return res.status(400).json({ error: "bookTitle is required" });
  const schoolId = req.user?.schoolId ?? void 0;
  const authorLabel = author ? ` by ${author}` : "";
  const audienceLabel = yearGroup ? `for ${yearGroup} pupils` : "for school pupils";
  const system = `You are an expert children's and young adult literature specialist and school librarian. You write engaging, age-appropriate book summaries and reviews that help pupils decide whether to read a book.`;
  const user2 = `Write a book summary and review of "${bookTitle}"${authorLabel} ${audienceLabel}${genre ? ` (genre: ${genre})` : ""}.

Return a JSON object with this structure:
{
  "title": "${bookTitle}",
  "author": "${author || "Unknown"}",
  "genre": "the book's genre",
  "ageRange": "recommended reading age range",
  "summary": "A 3-4 paragraph spoiler-free summary of what the book is about. Engaging and written for the target age group. Do NOT reveal the ending.",
  "review": "A 2-3 paragraph honest review covering: writing style, themes, what makes it special, who would enjoy it, and any content warnings if relevant for school use.",
  "themes": ["theme1", "theme2", "theme3"],
  "starRating": 4.5,
  "readingLevel": "e.g. Year 5-7 / Ages 9-12",
  "curriculumLinks": ["e.g. PSHE - friendship", "English - narrative structure"],
  "similarBooks": ["Book 1 by Author", "Book 2 by Author"]
}`;
  try {
    const { content, provider } = await callWithFallback(system, user2, 1500, void 0, schoolId);
    let parsed;
    try {
      const stripped = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : stripped);
    } catch {
      parsed = { title: bookTitle, author: author || "", summary: content, review: "", themes: [], starRating: 0, readingLevel: "", curriculumLinks: [], similarBooks: [] };
    }
    res.json({ ...parsed, provider });
  } catch (err) {
    console.error("[book-review] error:", err);
    res.status(500).json({ error: err.message || "Failed to generate review" });
  }
});
router5.post("/diagnostic-starter", requireAuth, async (req, res) => {
  const { subject, yearGroup, topic, sendNeed, freeText } = req.body;
  const isFreeTxt = !!freeText;
  if (!isFreeTxt && (!subject || !yearGroup || !topic)) {
    return res.status(400).json({ error: "subject, yearGroup, and topic are required (or use freeText)" });
  }
  const topicLabel = isFreeTxt ? freeText.slice(0, 80) : `${topic} (${yearGroup} ${subject})`;
  const sendContext = sendNeed ? `The student may have ${sendNeed} needs. Keep questions clear and accessible.` : "";
  const prompt = isFreeTxt ? `You are an expert teacher. The teacher has asked: "${freeText}"

Generate exactly 5 short diagnostic starter questions to check prior understanding before starting this topic.

Requirements:
- Each question should take 1-2 minutes to answer
- Questions should test prerequisite knowledge needed for this topic
- Questions should be clear and unambiguous
- Mix of recall and simple application
- No multi-part questions
- Infer the topic and year group from the teacher's request

Also infer a short topic name from the request.

Respond with a JSON object in this exact format:
{
  "topic": "Short topic name here",
  "questions": [
    "Question 1 text here?",
    "Question 2 text here?",
    "Question 3 text here?",
    "Question 4 text here?",
    "Question 5 text here?"
  ]
}` : `You are an expert teacher. Generate exactly 5 short diagnostic starter questions to check prior understanding of "${topic}" for ${yearGroup} ${subject} students.

Requirements:
- Each question should take 1-2 minutes to answer
- Questions should test prerequisite knowledge needed for this topic
- Questions should be clear and unambiguous
- Mix of recall and simple application
- No multi-part questions
${sendContext}

Respond with a JSON object in this exact format:
{
  "topic": "${topic}",
  "questions": [
    "Question 1 text here?",
    "Question 2 text here?",
    "Question 3 text here?",
    "Question 4 text here?",
    "Question 5 text here?"
  ]
}`;
  const user2 = req.user;
  const schoolId = user2?.schoolId;
  try {
    const result = await callWithFallback(
      "You are an expert teacher. Respond only with valid JSON \u2014 no markdown, no explanation.",
      prompt,
      700,
      void 0,
      schoolId || void 0
    );
    const stripped = result.content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : stripped);
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("No questions returned from AI");
    }
    const questions = parsed.questions.slice(0, 5).map((q) => typeof q === "string" ? q : q.q || q.question || String(q));
    return res.json({
      questions,
      topic: parsed.topic || topicLabel,
      provider: result.provider
    });
  } catch (err) {
    console.error("[diagnostic-starter] failed:", err.message);
    res.status(500).json({ error: "Could not generate diagnostic questions. Please ensure an AI provider is configured in Settings." });
  }
});
var ai_default = router5;

// server/routes/data.ts
import { Router as Router6 } from "express";
import { v4 as uuidv48 } from "uuid";
init_email();
var router6 = Router6();
router6.get("/worksheets", requireAuth, (req, res) => {
  const rows = db_default.prepare(
    "SELECT * FROM worksheets WHERE created_by = ? ORDER BY created_at DESC"
  ).all(req.user.id);
  const mapped = rows.map((r) => {
    const sections = db_default.prepare(
      "SELECT * FROM worksheet_sections WHERE worksheet_id = ? ORDER BY section_index ASC"
    ).all(r.id);
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
      sections: sections.map((s) => ({
        title: s.title,
        type: s.type,
        content: s.content,
        teacherOnly: !!s.teacher_only,
        svg: s.svg,
        caption: s.caption,
        symbols: s.symbols ? JSON.parse(s.symbols) : void 0
      }))
    };
  });
  res.json(mapped);
});
router6.post("/worksheets", requireAuth, (req, res) => {
  try {
    const { title: rawTitle, subject, topic, yearGroup, sendNeed, difficulty, examBoard, content, teacherContent, overlay, sections } = req.body;
    if (!rawTitle) return res.status(400).json({ error: "Title required" });
    const title = typeof rawTitle === "string" ? rawTitle.replace(/^\*{1,2}|\*{1,2}$/g, "").replace(/^_{1,2}|_{1,2}$/g, "").trim() : rawTitle;
    console.log(`[POST /worksheets] title=${title} subject=${subject} yearGroup=${yearGroup} sections=${Array.isArray(sections) ? sections.length : "none"}`);
    const id = uuidv48();
    const n = (v) => v === void 0 || v === null ? null : v;
    db_default.prepare(`INSERT INTO worksheets (id, school_id, created_by, title, subject, topic, year_group, send_need, difficulty, exam_board, content, teacher_content, overlay)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id,
      n(req.user.schoolId),
      n(req.user.id),
      n(title),
      n(subject),
      n(topic),
      n(yearGroup),
      n(sendNeed),
      n(difficulty),
      n(examBoard),
      n(content),
      n(teacherContent),
      n(overlay)
    );
    console.log(`[POST /worksheets] worksheet inserted id=${id}`);
    if (Array.isArray(sections)) {
      sections.forEach((s, idx) => {
        const sTitle = typeof s.title === "string" ? s.title.replace(/^\*{1,2}|\*{1,2}$/g, "").replace(/^_{1,2}|_{1,2}$/g, "").trim() : s.title || null;
        const rawContent = s.content || null;
        const sContent = typeof rawContent === "string" ? rawContent.split("\n").map((line) => line.replace(/^\*{1,2}\s*|\s*\*{1,2}$/g, "").replace(/\*\*(.+?)\*\*/g, "$1")).join("\n") : rawContent;
        db_default.prepare(`INSERT INTO worksheet_sections (id, worksheet_id, section_index, title, type, content, teacher_only, svg, caption, symbols)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          uuidv48(),
          id,
          idx,
          sTitle,
          s.type || null,
          sContent,
          s.teacherOnly ? 1 : 0,
          s.svg || null,
          s.caption || null,
          s.symbols ? JSON.stringify(s.symbols) : null
        );
      });
      console.log(`[POST /worksheets] ${sections.length} sections inserted`);
    }
    auditLog(req.user.id, req.user.schoolId, "worksheet.created", "worksheet", id, { title, subject, yearGroup }, req.ip);
    res.status(201).json({ id });
  } catch (err) {
    const errStr = typeof err === "string" ? err : err?.message || JSON.stringify(err) || "unknown error";
    console.error(`[POST /worksheets] CAUGHT ERROR type=${typeof err}:`, err);
    res.status(500).json({ error: errStr, type: typeof err, raw: String(err) });
  }
});
router6.put("/worksheets/:id", requireAuth, (req, res) => {
  const { rating, ratingLabel, overlay, content, teacherContent, sections } = req.body;
  db_default.prepare("UPDATE worksheets SET rating=COALESCE(?, rating), rating_label=COALESCE(?, rating_label), overlay=COALESCE(?, overlay), content=COALESCE(?, content), teacher_content=COALESCE(?, teacher_content) WHERE id=? AND created_by=?").run(rating ?? null, ratingLabel ?? null, overlay ?? null, content ?? null, teacherContent ?? null, req.params.id, req.user.id);
  if (Array.isArray(sections)) {
    db_default.prepare("DELETE FROM worksheet_sections WHERE worksheet_id=?").run(req.params.id);
    sections.forEach((s, idx) => {
      db_default.prepare(`INSERT INTO worksheet_sections (id, worksheet_id, section_index, title, type, content, teacher_only, svg, caption, symbols) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(uuidv48(), req.params.id, idx, s.title || null, s.type || null, s.content || null, s.teacherOnly ? 1 : 0, s.svg || null, s.caption || null, s.symbols ? JSON.stringify(s.symbols) : null);
    });
  }
  res.json({ message: "Updated" });
});
router6.delete("/worksheets/:id", requireAuth, (req, res) => {
  db_default.prepare("DELETE FROM worksheets WHERE id=? AND created_by=?").run(req.params.id, req.user.id);
  res.json({ message: "Deleted" });
});
router6.get("/stories", requireAuth, (req, res) => {
  const rows = db_default.prepare("SELECT * FROM stories WHERE created_by = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(rows.map((r) => ({
    ...r,
    characters: JSON.parse(r.characters || "[]"),
    comprehensionQuestions: JSON.parse(r.comprehension_questions || "[]")
  })));
});
router6.post("/stories", requireAuth, (req, res) => {
  const { title, genre, yearGroup, sendNeed, characters, setting, theme, readingLevel, length, content, comprehensionQuestions } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const id = uuidv48();
  const n2 = (v) => v === void 0 || v === null ? null : v;
  db_default.prepare(`INSERT INTO stories (id, school_id, created_by, title, genre, year_group, send_need, characters, setting, theme, reading_level, length, content, comprehension_questions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    n2(req.user.schoolId),
    n2(req.user.id),
    n2(title),
    n2(genre),
    n2(yearGroup),
    n2(sendNeed),
    JSON.stringify(characters || []),
    n2(setting),
    n2(theme),
    n2(readingLevel),
    n2(length),
    n2(content),
    JSON.stringify(comprehensionQuestions || [])
  );
  res.status(201).json({ id });
});
router6.get("/differentiations", requireAuth, (req, res) => {
  const rows = db_default.prepare("SELECT * FROM differentiations WHERE created_by = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(rows);
});
router6.post("/differentiations", requireAuth, (req, res) => {
  const { taskContent, differentiatedContent, sendNeed, yearGroup, subject } = req.body;
  const id = uuidv48();
  const n3 = (v) => v === void 0 || v === null ? null : v;
  db_default.prepare(`INSERT INTO differentiations (id, school_id, created_by, task_content, differentiated_content, send_need, year_group, subject)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    n3(req.user.schoolId),
    n3(req.user.id),
    n3(taskContent),
    n3(differentiatedContent),
    n3(sendNeed),
    n3(yearGroup),
    n3(subject)
  );
  res.status(201).json({ id });
});
router6.get("/ideas", requireAuth, (req, res) => {
  const rows = db_default.prepare(
    `SELECT i.*, u.display_name as author_name FROM ideas i
     LEFT JOIN users u ON i.author_id = u.id
     WHERE i.school_id = ? ORDER BY i.votes DESC, i.created_at DESC`
  ).all(req.user.schoolId);
  res.json(rows);
});
router6.post("/ideas", requireAuth, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const id = uuidv48();
  db_default.prepare("INSERT INTO ideas (id, school_id, author_id, title, description) VALUES (?, ?, ?, ?, ?)").run(id, req.user.schoolId ?? null, req.user.id ?? null, title, description ?? null);
  res.status(201).json({ id });
});
router6.post("/ideas/:id/vote", requireAuth, (req, res) => {
  db_default.prepare("UPDATE ideas SET votes = votes + 1 WHERE id = ? AND school_id = ?").run(req.params.id, req.user.schoolId);
  res.json({ message: "Voted" });
});
router6.post("/cookie-consent", (req, res) => {
  const { analytics, marketing, userId } = req.body;
  db_default.prepare("INSERT INTO cookie_consents (id, user_id, ip_address, analytics, marketing) VALUES (?, ?, ?, ?, ?)").run(uuidv48(), userId || null, req.ip ?? null, analytics ? 1 : 0, marketing ? 1 : 0);
  res.json({ message: "Consent recorded" });
});
router6.post("/onboarding-complete", requireAuth, (req, res) => {
  db_default.prepare("UPDATE users SET onboarding_done = 1 WHERE id = ?").run(req.user.id);
  auditLog(req.user.id, req.user.schoolId, "user.onboarding_completed", "user", req.user.id, {}, req.ip);
  res.json({ message: "Onboarding marked complete" });
});
router6.get("/admin/worksheets", requireAuth, (req, res) => {
  const rows = db_default.prepare(
    `SELECT w.*, u.display_name as author_name FROM worksheets w
     LEFT JOIN users u ON w.created_by = u.id
     WHERE w.school_id = ? ORDER BY w.created_at DESC LIMIT 500`
  ).all(req.user.schoolId);
  res.json(rows);
});
router6.get("/analytics", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const pupils = db_default.prepare("SELECT COUNT(*) as c FROM pupils WHERE school_id=? AND is_active=1").get(schoolId).c;
  const worksheets = db_default.prepare("SELECT COUNT(*) as c FROM worksheets WHERE school_id=?").get(schoolId).c;
  const stories = db_default.prepare("SELECT COUNT(*) as c FROM stories WHERE school_id=?").get(schoolId).c;
  const users = db_default.prepare("SELECT COUNT(*) as c FROM users WHERE school_id=? AND is_active=1").get(schoolId).c;
  const incidents = db_default.prepare("SELECT COUNT(*) as c FROM safeguarding_incidents WHERE school_id=? AND status='open'").get(schoolId).c;
  res.json({ pupils, worksheets, stories, users, openIncidents: incidents });
});
router6.get("/behaviour", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const pupilId = req.query.pupilId;
  let rows;
  if (pupilId) {
    rows = db_default.prepare(
      `SELECT br.*, p.name as pupil_name, u.display_name as recorded_by_name
       FROM behaviour_records br
       LEFT JOIN pupils p ON br.pupil_id = p.id
       LEFT JOIN users u ON br.recorded_by = u.id
       WHERE br.school_id = ? AND br.pupil_id = ?
       ORDER BY br.date DESC, br.created_at DESC LIMIT 200`
    ).all(schoolId, pupilId);
  } else {
    rows = db_default.prepare(
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
router6.post("/behaviour", requireAuth, (req, res) => {
  const { pupilId, type, category, description, actionTaken, date } = req.body;
  if (!pupilId || !type || !date) return res.status(400).json({ error: "pupilId, type, date required" });
  const id = `br_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db_default.prepare(
    `INSERT INTO behaviour_records (id, school_id, pupil_id, recorded_by, type, category, description, action_taken, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, req.user.schoolId, pupilId, req.user.id, type, category || null, description || null, actionTaken || null, date);
  auditLog(req.user.id, req.user.schoolId, "behaviour.created", "behaviour_record", id, { pupilId, type }, req.ip);
  try {
    const pupil = db_default.prepare("SELECT name, parent_email, parent_name FROM pupils WHERE id=? AND school_id=?").get(pupilId, req.user.schoolId);
    const school = db_default.prepare("SELECT name FROM schools WHERE id=?").get(req.user.schoolId);
    if (pupil?.parent_email) {
      sendBehaviourAlert(pupil.parent_email, {
        pupilName: pupil.name,
        type,
        category: category || void 0,
        description: description || void 0,
        actionTaken: actionTaken || void 0,
        date,
        teacherName: req.user.displayName || "Your child's teacher",
        schoolName: school?.name || "School"
      }).catch((err) => console.error("[behaviour] parent email error:", err?.message));
    }
  } catch (e) {
    console.error("[behaviour] parent email lookup error:", e?.message);
  }
  res.status(201).json({ id, message: "Behaviour record created" });
});
router6.delete("/behaviour/:id", requireAuth, (req, res) => {
  const record = db_default.prepare("SELECT * FROM behaviour_records WHERE id=? AND school_id=?").get(req.params.id, req.user.schoolId);
  if (!record) return res.status(404).json({ error: "Not found" });
  db_default.prepare("DELETE FROM behaviour_records WHERE id=?").run(req.params.id);
  res.json({ message: "Deleted" });
});
router6.get("/parent/support-plans/:pupilId", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const { pupilId } = req.params;
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id=? AND school_id=?").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const plans = db_default.prepare(
    `SELECT id, title, summary, strategies, positive_targets as positiveTargets, status, review_date as reviewDate, created_at
     FROM behaviour_support_plans
     WHERE pupil_id = ? AND school_id = ? AND shared_with_parents = 1
     ORDER BY created_at DESC`
  ).all(pupilId, schoolId);
  res.json(plans);
});
router6.get("/parent/behaviour/:pupilId", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const { pupilId } = req.params;
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id=? AND school_id=?").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const rows = db_default.prepare(
    `SELECT br.id, br.type, br.category, br.description, br.action_taken, br.date,
            u.display_name as recorded_by_name
     FROM behaviour_records br
     LEFT JOIN users u ON br.recorded_by = u.id
     WHERE br.pupil_id = ? AND br.school_id = ?
     ORDER BY br.date DESC LIMIT 100`
  ).all(pupilId, schoolId);
  res.json(rows);
});
router6.get("/preferences", requireAuth, (req, res) => {
  try {
    const row = db_default.prepare("SELECT preferences FROM users WHERE id = ?").get(req.user.id);
    const prefs = row?.preferences ? JSON.parse(row.preferences) : {};
    res.json(prefs);
  } catch {
    res.json({});
  }
});
router6.put("/preferences", requireAuth, (req, res) => {
  const prefs = req.body;
  if (!prefs || typeof prefs !== "object") return res.status(400).json({ error: "Invalid preferences" });
  try {
    db_default.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(
      JSON.stringify(prefs),
      req.user.id
    );
    res.json({ ok: true });
  } catch (err) {
    try {
      db_default.prepare("ALTER TABLE users ADD COLUMN preferences TEXT").run();
      db_default.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(
        JSON.stringify(prefs),
        req.user.id
      );
      res.json({ ok: true });
    } catch (e2) {
      console.error("[preferences] save error:", e2);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  }
});
router6.post("/parent-message", requireAuth, async (req, res) => {
  const { pupilId, subject, message } = req.body;
  if (!pupilId || !subject || !message) {
    return res.status(400).json({ error: "pupilId, subject, and message are required" });
  }
  try {
    const pupil = db_default.prepare("SELECT name, parent_email, parent_name FROM pupils WHERE id=? AND school_id=?").get(pupilId, req.user.schoolId);
    if (!pupil) return res.status(404).json({ error: "Pupil not found" });
    if (!pupil.parent_email) return res.status(400).json({ error: "No parent email on record for this pupil. Please add one in the Pupils section." });
    const school = db_default.prepare("SELECT name FROM schools WHERE id=?").get(req.user.schoolId);
    await sendDirectParentMessage(pupil.parent_email, {
      parentName: pupil.parent_name || "Parent/Carer",
      pupilName: pupil.name,
      teacherName: req.user.displayName || "Your child's teacher",
      schoolName: school?.name || "School",
      subject,
      message
    });
    auditLog(req.user.id, req.user.schoolId, "parent_message.sent", "pupil", pupilId, { subject }, req.ip);
    res.json({ ok: true, message: "Message sent to parent successfully" });
  } catch (err) {
    console.error("[parent-message] error:", err?.message);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});
router6.get("/admin-analytics", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  const weekly = {};
  const getWeekKey = (dateStr) => {
    const d = new Date(dateStr);
    const monday = new Date(d);
    monday.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return monday.toISOString().substring(0, 10);
  };
  const ws = db_default.prepare("SELECT created_by, created_at FROM worksheets WHERE school_id = ? AND created_at > datetime('now', '-56 days')").all(schoolId);
  const st = db_default.prepare("SELECT created_by, created_at FROM stories WHERE school_id = ? AND created_at > datetime('now', '-56 days')").all(schoolId);
  const df = db_default.prepare("SELECT created_by, created_at FROM differentiations WHERE school_id = ? AND created_at > datetime('now', '-56 days')").all(schoolId);
  [...ws.map((r) => ({ ...r, type: "worksheet" })), ...st.map((r) => ({ ...r, type: "story" })), ...df.map((r) => ({ ...r, type: "diff" }))].forEach((r) => {
    const wk = getWeekKey(r.created_at);
    if (!weekly[wk]) weekly[wk] = { worksheets: 0, stories: 0, diffs: 0, users: /* @__PURE__ */ new Set() };
    if (r.type === "worksheet") weekly[wk].worksheets++;
    else if (r.type === "story") weekly[wk].stories++;
    else weekly[wk].diffs++;
    if (r.created_by) weekly[wk].users.add(r.created_by);
  });
  const weeklyArray = Object.entries(weekly).sort(([a], [b]) => a.localeCompare(b)).map(([week, data]) => ({ week, worksheets: data.worksheets, stories: data.stories, diffs: data.diffs, activeUsers: data.users.size }));
  const toolUsage = [
    { tool: "Worksheets", count: db_default.prepare("SELECT COUNT(*) as c FROM worksheets WHERE school_id=?").get(schoolId).c },
    { tool: "Stories", count: db_default.prepare("SELECT COUNT(*) as c FROM stories WHERE school_id=?").get(schoolId).c },
    { tool: "Differentiations", count: db_default.prepare("SELECT COUNT(*) as c FROM differentiations WHERE school_id=?").get(schoolId).c },
    { tool: "Assignments", count: db_default.prepare("SELECT COUNT(*) as c FROM assignments WHERE pupil_id IN (SELECT id FROM pupils WHERE school_id=?)").get(schoolId).c }
  ];
  const activeStaff = db_default.prepare(`
    SELECT u.display_name, u.role,
      (SELECT COUNT(*) FROM worksheets WHERE created_by = u.id) as worksheets,
      (SELECT COUNT(*) FROM stories WHERE created_by = u.id) as stories,
      u.last_login_at
    FROM users u WHERE u.school_id = ? AND u.is_active = 1
    ORDER BY worksheets + stories DESC LIMIT 10
  `).all(schoolId);
  res.json({ weekly: weeklyArray, toolUsage, activeStaff });
});
router6.get("/audit-trail", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const role = req.user.role;
  if (!["school_admin", "mat_admin", "senco"].includes(role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  const logs = db_default.prepare(`
    SELECT al.*, u.display_name as user_name, u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.school_id = ? ORDER BY al.created_at DESC LIMIT 200
  `).all(schoolId);
  res.json({ logs });
});
router6.post("/parent-reply", async (req, res) => {
  const { accessCode, message, parentName } = req.body;
  if (!accessCode || !message?.trim()) {
    return res.status(400).json({ error: "Access code and message are required" });
  }
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE code = ? AND is_active = 1").get(accessCode);
  if (!pupil) return res.status(404).json({ error: "Invalid access code" });
  const id = (await import("uuid")).v4();
  db_default.prepare(`INSERT INTO pupil_comments (id, school_id, pupil_id, recorded_by, type, category, content, date)
    VALUES (?, ?, ?, NULL, 'parent_message', 'Parent Message', ?, date('now'))`).run(id, pupil.school_id, pupil.id, `From ${parentName || "Parent"}: ${message.trim()}`);
  res.json({ success: true, message: "Message sent to school" });
});
router6.get("/parent-messages/:pupilId", requireAuth, (req, res) => {
  const messages = db_default.prepare(`
    SELECT * FROM pupil_comments
    WHERE pupil_id = ? AND type = 'parent_message' ORDER BY created_at DESC LIMIT 50
  `).all(req.params.pupilId);
  res.json({ messages });
});
router6.get("/stats", (req, res) => {
  try {
    const teacherCount = db_default.prepare("SELECT COUNT(*) as c FROM users WHERE is_active = 1").get()?.c || 0;
    const worksheetCount = db_default.prepare("SELECT COUNT(*) as c FROM worksheets").get()?.c || 0;
    const schoolCount = db_default.prepare("SELECT COUNT(*) as c FROM schools").get()?.c || 0;
    const TEACHER_OFFSET = 266;
    const WORKSHEET_OFFSET = 266;
    res.json({
      teachers: teacherCount + TEACHER_OFFSET,
      worksheets: worksheetCount + WORKSHEET_OFFSET,
      schools: schoolCount
    });
  } catch {
    res.json({ teachers: 266, worksheets: 266, schools: 1 });
  }
});
router6.get("/folders", requireAuth, (req, res) => {
  const folders = db_default.prepare(
    "SELECT * FROM worksheet_folders WHERE school_id = ? ORDER BY name ASC"
  ).all(req.user.schoolId);
  res.json(folders.map((f) => ({ id: f.id, name: f.name, colour: f.colour, createdAt: f.created_at })));
});
router6.post("/folders", requireAuth, (req, res) => {
  const { name, colour } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Folder name required" });
  const id = uuidv48();
  db_default.prepare(
    "INSERT INTO worksheet_folders (id, school_id, created_by, name, colour) VALUES (?, ?, ?, ?, ?)"
  ).run(id, req.user.schoolId, req.user.id, name.trim(), colour || "#6366f1");
  res.status(201).json({ id, name: name.trim(), colour: colour || "#6366f1" });
});
router6.delete("/folders/:id", requireAuth, (req, res) => {
  db_default.prepare("DELETE FROM worksheet_folders WHERE id = ? AND school_id = ?").run(req.params.id, req.user.schoolId);
  res.json({ success: true });
});
router6.post("/folders/:id/items", requireAuth, (req, res) => {
  const { worksheetId } = req.body;
  if (!worksheetId) return res.status(400).json({ error: "worksheetId required" });
  try {
    db_default.prepare("INSERT OR IGNORE INTO worksheet_folder_items (folder_id, worksheet_id) VALUES (?, ?)").run(req.params.id, worksheetId);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "Could not add to folder" });
  }
});
router6.delete("/folders/:id/items/:worksheetId", requireAuth, (req, res) => {
  db_default.prepare("DELETE FROM worksheet_folder_items WHERE folder_id = ? AND worksheet_id = ?").run(req.params.id, req.params.worksheetId);
  res.json({ success: true });
});
router6.get("/folders/:id/items", requireAuth, (req, res) => {
  const items = db_default.prepare(`
    SELECT w.* FROM worksheets w
    JOIN worksheet_folder_items fi ON fi.worksheet_id = w.id
    WHERE fi.folder_id = ?
    ORDER BY fi.added_at DESC
  `).all(req.params.id);
  res.json(items);
});
var data_default = router6;
router6.post("/worksheets/:id/share", requireAuth, (req, res) => {
  const wsId = req.params.id;
  const ws = db_default.prepare("SELECT * FROM worksheets WHERE id=? AND created_by=?").get(wsId, req.user.id);
  if (!ws) return res.status(404).json({ error: "Worksheet not found" });
  const existing = db_default.prepare("SELECT share_token FROM worksheet_share_links WHERE worksheet_id=?").get(wsId);
  if (existing?.share_token) return res.json({ token: existing.share_token });
  const token = __require("crypto").randomBytes(16).toString("hex");
  db_default.prepare(
    "INSERT INTO worksheet_share_links (id, worksheet_id, share_token, created_by, school_id) VALUES (?,?,?,?,?)"
  ).run(uuidv48(), wsId, token, req.user.id, req.user.schoolId);
  res.json({ token });
});
router6.delete("/worksheets/:id/share", requireAuth, (req, res) => {
  db_default.prepare("DELETE FROM worksheet_share_links WHERE worksheet_id=? AND created_by=?").run(req.params.id, req.user.id);
  res.json({ success: true });
});
router6.get("/shared/:token", (req, res) => {
  const link = db_default.prepare(
    "SELECT wsl.worksheet_id, wsl.view_count FROM worksheet_share_links wsl WHERE wsl.share_token=?"
  ).get(req.params.token);
  if (!link) return res.status(404).json({ error: "Link not found or expired" });
  const ws = db_default.prepare("SELECT * FROM worksheets WHERE id=?").get(link.worksheet_id);
  if (!ws) return res.status(404).json({ error: "Worksheet not found" });
  const sections = db_default.prepare(
    "SELECT * FROM worksheet_sections WHERE worksheet_id=? ORDER BY section_index ASC"
  ).all(link.worksheet_id);
  db_default.prepare("UPDATE worksheet_share_links SET view_count=view_count+1 WHERE share_token=?").run(req.params.token);
  res.json({
    title: ws.title,
    subject: ws.subject,
    topic: ws.topic,
    yearGroup: ws.year_group,
    difficulty: ws.difficulty,
    sections: sections.map((s) => ({
      title: s.title,
      type: s.type,
      content: s.content,
      teacherOnly: s.teacher_only === 1,
      svg: s.svg,
      caption: s.caption
    })).filter((s) => !s.teacherOnly),
    // public view: hide teacher sections
    metadata: {
      subject: ws.subject,
      topic: ws.topic,
      yearGroup: ws.year_group,
      difficulty: ws.difficulty,
      examBoard: ws.exam_board
    }
  });
});
router6.get("/spaced-repetition", requireAuth, (req, res) => {
  const userId = req.user.id;
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const due = db_default.prepare(
    "SELECT * FROM spaced_repetition WHERE user_id=? AND next_review<=? ORDER BY next_review ASC LIMIT 20"
  ).all(userId, today);
  const all = db_default.prepare(
    "SELECT * FROM spaced_repetition WHERE user_id=? ORDER BY next_review ASC"
  ).all(userId);
  res.json({ due, all, totalTracked: all.length });
});
router6.post("/spaced-repetition", requireAuth, (req, res) => {
  const { subject, topic, score } = req.body;
  if (!subject || !topic || score === void 0) return res.status(400).json({ error: "subject, topic, score required" });
  const userId = req.user.id;
  const existing = db_default.prepare(
    "SELECT * FROM spaced_repetition WHERE user_id=? AND subject=? AND topic=?"
  ).get(userId, subject, topic);
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
      intervalDays = 1;
    }
  }
  const nextReview = /* @__PURE__ */ new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);
  const nextReviewStr = nextReview.toISOString().slice(0, 10);
  if (existing) {
    db_default.prepare(
      "UPDATE spaced_repetition SET interval_days=?, ease_factor=?, reviews=?, last_score=?, next_review=?, updated_at=datetime('now') WHERE user_id=? AND subject=? AND topic=?"
    ).run(intervalDays, easeFactor, reviews, score, nextReviewStr, userId, subject, topic);
  } else {
    db_default.prepare(
      "INSERT INTO spaced_repetition (id, user_id, subject, topic, interval_days, ease_factor, reviews, last_score, next_review) VALUES (?,?,?,?,?,?,?,?,?)"
    ).run(uuidv48(), userId, subject, topic, intervalDays, easeFactor, reviews, score, nextReviewStr);
  }
  res.json({ intervalDays, nextReview: nextReviewStr, easeFactor });
});

// server/routes/admin.ts
import { Router as Router7 } from "express";
var router7 = Router7();
var logBuffer = [];
var originalLog = console.log;
var originalError = console.error;
var originalWarn = console.warn;
function formatLog(level, args) {
  const ts = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
  const msg = args.map((a) => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
  const line = `[${ts}] ${level} ${msg}`;
  logBuffer.push(line);
  if (logBuffer.length > 200) logBuffer.shift();
  return line;
}
console.log = (...args) => {
  originalLog(formatLog("INFO", args));
};
console.error = (...args) => {
  originalError(formatLog("ERROR", args));
};
console.warn = (...args) => {
  originalWarn(formatLog("WARN", args));
};
function requireAdmin2(req, res, next) {
  const user2 = req.user;
  if (!user2) return res.status(401).json({ error: "Unauthorized" });
  const isAdmin = ["mat_admin", "school_admin", "senco"].includes(user2.role) || user2.email === "admin@adaptly.co.uk" || user2.email === "admin@sendassistant.app";
  if (!isAdmin) return res.status(403).json({ error: "Forbidden" });
  next();
}
function requireSuperAdmin(req, res, next) {
  const user2 = req.user;
  if (!user2) return res.status(401).json({ error: "Unauthorized" });
  const isSuperAdmin = user2.role === "mat_admin" || user2.email === "admin@adaptly.co.uk" || user2.email === "admin@sendassistant.app";
  if (!isSuperAdmin) return res.status(403).json({ error: "Super admin access required" });
  next();
}
router7.get("/stats", requireAuth, requireAdmin2, (req, res) => {
  try {
    const totalUsers = db_default.prepare("SELECT COUNT(*) as c FROM users").get()?.c || 0;
    const totalWorksheets = db_default.prepare("SELECT COUNT(*) as c FROM worksheets").get()?.c || 0;
    const totalStories = db_default.prepare("SELECT COUNT(*) as c FROM stories").get()?.c || 0;
    const totalDifferentiations = db_default.prepare("SELECT COUNT(*) as c FROM differentiations").get()?.c || 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
    const activeUsers7d = db_default.prepare(
      "SELECT COUNT(DISTINCT user_id) as c FROM audit_log WHERE created_at > ?"
    ).get(sevenDaysAgo)?.c || 0;
    const todayStart = /* @__PURE__ */ new Date();
    todayStart.setHours(0, 0, 0, 0);
    const aiCallsToday = db_default.prepare(
      "SELECT COUNT(*) as c FROM audit_log WHERE action LIKE '%generate%' AND created_at > ?"
    ).get(todayStart.toISOString())?.c || 0;
    const topToolsRaw = db_default.prepare(
      "SELECT action as tool, COUNT(*) as count FROM audit_log WHERE action LIKE '%generate%' GROUP BY action ORDER BY count DESC LIMIT 5"
    ).all();
    res.json({
      totalUsers,
      totalWorksheets,
      totalStories,
      totalDifferentiations,
      activeUsers7d,
      aiCallsToday,
      avgTimeSaved: Math.round((totalWorksheets + totalStories + totalDifferentiations) * 12),
      topTools: topToolsRaw
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.get("/live-logs", requireAuth, requireAdmin2, (req, res) => {
  res.json({ logs: [...logBuffer].reverse().slice(0, 100).reverse() });
});
router7.get("/ai-keys", requireAuth, requireAdmin2, (req, res) => {
  try {
    const rows = db_default.prepare("SELECT provider, api_key FROM admin_api_keys").all();
    const keys = {};
    for (const row of rows) {
      const k = row.api_key || "";
      keys[row.provider] = k.length > 8 ? k.substring(0, 8) + "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : k;
    }
    res.json(keys);
  } catch {
    res.json({});
  }
});
router7.post("/ai-keys", requireAuth, requireAdmin2, (req, res) => {
  const { provider, key } = req.body;
  if (!provider || !key) return res.status(400).json({ error: "provider and key required" });
  try {
    const existing = db_default.prepare("SELECT id FROM admin_api_keys WHERE provider = ?").get(provider);
    if (existing) {
      db_default.prepare("UPDATE admin_api_keys SET api_key = ?, updated_at = ? WHERE provider = ?").run(key, (/* @__PURE__ */ new Date()).toISOString(), provider);
    } else {
      db_default.prepare("INSERT INTO admin_api_keys (provider, api_key, updated_at) VALUES (?, ?, ?)").run(provider, key, (/* @__PURE__ */ new Date()).toISOString());
    }
    console.log(`Admin API key updated for provider: ${provider}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.get("/test-ai/:provider", requireAuth, requireAdmin2, async (req, res) => {
  const { provider } = req.params;
  try {
    const row = db_default.prepare("SELECT api_key FROM admin_api_keys WHERE provider = ?").get(provider);
    if (!row?.api_key) return res.json({ ok: false, error: "No API key configured" });
    const key = row.api_key;
    if (provider === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 })
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }
    if (provider === "gemini") {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Say OK" }] }] })
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }
    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4.1-mini", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 })
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }
    if (provider === "openrouter") {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai/gpt-4o-mini", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 })
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }
    if (provider === "claude") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 5, messages: [{ role: "user", content: "Say OK" }] })
      });
      if (r.ok) return res.json({ ok: true });
      return res.json({ ok: false, error: `HTTP ${r.status}` });
    }
    res.json({ ok: false, error: "Unknown provider" });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});
router7.get("/breach-log", requireAuth, requireAdmin2, (req, res) => {
  try {
    const user2 = req.user;
    const rows = db_default.prepare(
      `SELECT b.*, u.name as reporter_name, u.email as reporter_email
       FROM breach_log b
       LEFT JOIN users u ON b.reported_by = u.id
       WHERE b.school_id = ? OR b.school_id IS NULL
       ORDER BY b.created_at DESC LIMIT 100`
    ).all(user2.schoolId || user2.school_id || "");
    res.json({ breaches: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.post("/breach-log", requireAuth, requireAdmin2, (req, res) => {
  try {
    const user2 = req.user;
    const { title, description, data_types, affected_count, severity } = req.body;
    if (!title || !description || !data_types) {
      return res.status(400).json({ error: "title, description, and data_types are required" });
    }
    const id = `breach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db_default.prepare(
      `INSERT INTO breach_log (id, school_id, reported_by, title, description, data_types, affected_count, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      user2.schoolId || user2.school_id || null,
      user2.id,
      title,
      description,
      Array.isArray(data_types) ? data_types.join(", ") : data_types,
      affected_count || 0,
      severity || "medium"
    );
    try {
      db_default.prepare(
        `INSERT INTO audit_logs (id, action, user_id, created_at) VALUES (?, ?, ?, datetime('now'))`
      ).run(`al_${Date.now()}`, `DATA_BREACH_REPORTED: ${title}`, user2.id);
    } catch (_) {
    }
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.patch("/breach-log/:id", requireAuth, requireAdmin2, (req, res) => {
  try {
    const { status, ico_notified, ico_reference, subjects_notified, containment_action, resolved_at } = req.body;
    db_default.prepare(
      `UPDATE breach_log SET
        status = COALESCE(?, status),
        ico_notified = COALESCE(?, ico_notified),
        ico_reference = COALESCE(?, ico_reference),
        subjects_notified = COALESCE(?, subjects_notified),
        containment_action = COALESCE(?, containment_action),
        resolved_at = COALESCE(?, resolved_at),
        updated_at = datetime('now')
       WHERE id = ?`
    ).run(status, ico_notified, ico_reference, subjects_notified, containment_action, resolved_at, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.get("/super/schools", requireAuth, requireSuperAdmin, (req, res) => {
  try {
    const schools = db_default.prepare(`
      SELECT
        s.id, s.name, s.urn, s.domain, s.licence_type, s.onboarding_complete,
        s.stripe_customer_id, s.subscription_status, s.subscription_plan,
        s.subscription_period_end, s.subscription_cancel_at_period_end,
        s.created_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT p.id) as pupil_count,
        MAX(al.created_at) as last_activity
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN pupils p ON p.school_id = s.id AND p.archived = 0
      LEFT JOIN audit_log al ON al.school_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all();
    res.json({ schools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.get("/super/schools/:id/activity", requireAuth, requireSuperAdmin, (req, res) => {
  try {
    const logs = db_default.prepare(`
      SELECT al.*, u.display_name, u.email
      FROM audit_log al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.school_id = ?
      ORDER BY al.created_at DESC
      LIMIT 50
    `).all(req.params.id);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.get("/super/billing-summary", requireAuth, requireSuperAdmin, (req, res) => {
  try {
    const schools = db_default.prepare(`
      SELECT id, name, subscription_status, subscription_plan,
             subscription_period_end, subscription_cancel_at_period_end,
             stripe_customer_id, licence_type, domain
      FROM schools
      ORDER BY subscription_period_end ASC
    `).all();
    const planPrices = {
      starter: 49,
      professional: 99,
      premium: 149,
      mat: 299
    };
    const now = /* @__PURE__ */ new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
    const upcomingRenewals = schools.filter((s) => s.subscription_period_end && new Date(s.subscription_period_end) <= in30Days && new Date(s.subscription_period_end) > now).map((s) => ({
      ...s,
      monthly_value: planPrices[s.subscription_plan] || 0,
      days_until_renewal: Math.ceil((new Date(s.subscription_period_end).getTime() - now.getTime()) / (1e3 * 60 * 60 * 24))
    }));
    const activeSchools = schools.filter((s) => s.subscription_status === "active");
    const trialSchools = schools.filter((s) => s.licence_type === "trial" || s.subscription_status === "trialing");
    const overdueSchools = schools.filter((s) => s.subscription_status === "past_due" || s.subscription_status === "unpaid");
    const canceledSchools = schools.filter((s) => s.subscription_status === "canceled");
    const mrr = activeSchools.reduce((sum, s) => sum + (planPrices[s.subscription_plan] || 0), 0);
    res.json({
      summary: {
        total_schools: schools.length,
        active: activeSchools.length,
        on_trial: trialSchools.length,
        overdue: overdueSchools.length,
        canceled: canceledSchools.length,
        mrr,
        arr: mrr * 12
      },
      upcoming_renewals: upcomingRenewals,
      overdue_schools: overdueSchools
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.post("/super/invoice", requireAuth, requireSuperAdmin, (req, res) => {
  try {
    const { school_id, amount, description, due_date, notes } = req.body;
    if (!school_id || !amount || !description) {
      return res.status(400).json({ error: "school_id, amount, and description are required" });
    }
    const school = db_default.prepare("SELECT * FROM schools WHERE id = ?").get(school_id);
    if (!school) return res.status(404).json({ error: "School not found" });
    const invoiceNumber = `INV-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(Date.now()).slice(-6)}`;
    const invoice = {
      invoice_number: invoiceNumber,
      school_id,
      school_name: school.name,
      school_domain: school.domain || "",
      amount: parseFloat(amount),
      description,
      due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      notes: notes || "",
      issued_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      status: "issued"
    };
    try {
      db_default.prepare(
        `INSERT INTO audit_log (id, school_id, user_id, action, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).run(`inv_${Date.now()}`, school_id, req.user.id, `INVOICE_ISSUED: ${invoiceNumber} \xA3${amount}`);
    } catch (_) {
    }
    res.json({ ok: true, invoice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.get("/super/users", requireAuth, requireSuperAdmin, (req, res) => {
  try {
    const users = db_default.prepare(`
      SELECT u.id, u.email, u.display_name, u.role, u.is_active, u.email_verified,
             u.mfa_enabled, u.last_login_at, u.created_at, s.name as school_name, u.school_id
      FROM users u
      LEFT JOIN schools s ON s.id = u.school_id
      ORDER BY u.created_at DESC
    `).all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.patch("/super/users/:id", requireAuth, requireSuperAdmin, (req, res) => {
  try {
    const { role, is_active, email_verified } = req.body;
    const userId = req.params.id;
    if (role) {
      const validRoles = ["mat_admin", "school_admin", "senco", "teacher", "ta"];
      if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
      db_default.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
    }
    if (is_active !== void 0) {
      db_default.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, userId);
    }
    if (email_verified !== void 0) {
      db_default.prepare("UPDATE users SET email_verified = ? WHERE id = ?").run(email_verified ? 1 : 0, userId);
    }
    try {
      db_default.prepare(`INSERT INTO audit_log (id, school_id, user_id, action, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).run(`sa_u_${Date.now()}`, null, req.user.id, `SUPER_ADMIN_USER_UPDATE: userId=${userId} role=${role} active=${is_active}`);
    } catch (_) {
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.delete("/super/users/:id", requireAuth, requireSuperAdmin, (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;
    if (userId === adminId) return res.status(400).json({ error: "Cannot delete your own account" });
    const user2 = db_default.prepare("SELECT email FROM users WHERE id = ?").get(userId);
    if (!user2) return res.status(404).json({ error: "User not found" });
    db_default.prepare("DELETE FROM users WHERE id = ?").run(userId);
    try {
      db_default.prepare(`INSERT INTO audit_log (id, school_id, user_id, action, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).run(`sa_del_${Date.now()}`, null, adminId, `SUPER_ADMIN_USER_DELETED: ${user2.email}`);
    } catch (_) {
    }
    res.json({ ok: true, message: `User ${user2.email} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.get("/super/audit", requireAuth, requireSuperAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 200;
    const logs = db_default.prepare(`
      SELECT al.*, u.display_name, u.email, s.name as school_name
      FROM audit_log al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN schools s ON s.id = al.school_id
      ORDER BY al.created_at DESC
      LIMIT ?
    `).all(limit);
    res.json({ logs });
  } catch (err) {
    try {
      const logs = db_default.prepare(`
        SELECT al.*, u.display_name, u.email
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        ORDER BY al.created_at DESC
        LIMIT ?
      `).all(parseInt(req.query.limit) || 200);
      res.json({ logs });
    } catch (err2) {
      res.status(500).json({ error: err2.message });
    }
  }
});
router7.patch("/super/schools/:id/subscription", requireAuth, requireSuperAdmin, (req, res) => {
  try {
    const { subscription_status, subscription_plan, licence_type } = req.body;
    db_default.prepare(`
      UPDATE schools SET
        subscription_status = COALESCE(?, subscription_status),
        subscription_plan = COALESCE(?, subscription_plan),
        licence_type = COALESCE(?, licence_type)
      WHERE id = ?
    `).run(subscription_status || null, subscription_plan || null, licence_type || null, req.params.id);
    try {
      db_default.prepare(
        `INSERT INTO audit_log (id, school_id, user_id, action, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).run(
        `sa_${Date.now()}`,
        req.params.id,
        req.user.id,
        `SUPER_ADMIN_SUBSCRIPTION_OVERRIDE: status=${subscription_status} plan=${subscription_plan}`
      );
    } catch (_) {
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var admin_default = router7;
router7.get("/senco-report", requireAuth, (req, res) => {
  const user2 = req.user;
  const schoolId = user2?.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated" });
  try {
    const pupils = db_default.prepare(
      "SELECT id, name, year_group, send_need FROM pupils WHERE school_id=? AND is_active=1 AND send_need IS NOT NULL AND send_need != '' ORDER BY send_need, year_group, name"
    ).all(schoolId);
    const enriched = pupils.map((p) => {
      const stats = db_default.prepare(
        "SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed, AVG(COALESCE(progress,0)) as avgProgress FROM assignments WHERE pupil_id=?"
      ).get(p.id);
      return {
        id: p.id,
        name: p.name,
        yearGroup: p.year_group,
        sendNeed: p.send_need,
        totalAssignments: stats?.total || 0,
        completedAssignments: stats?.completed || 0,
        avgProgress: Math.round(stats?.avgProgress || 0)
      };
    });
    const grouped = {};
    for (const p of enriched) {
      const key = p.sendNeed || "Unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    }
    const totalSendPupils = pupils.length;
    const needCounts = Object.entries(grouped).map(([need, list]) => ({ need, count: list.length })).sort((a, b) => b.count - a.count);
    res.json({ totalSendPupils, needCounts, grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router7.get("/school-usage-trend", requireAuth, (req, res) => {
  const user2 = req.user;
  const schoolId = user2?.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  try {
    const weeks = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = /* @__PURE__ */ new Date();
      weekStart.setDate(weekStart.getDate() - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const s = weekStart.toISOString();
      const e = weekEnd.toISOString();
      const label = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const worksheets = db_default.prepare("SELECT COUNT(*) as c FROM worksheets WHERE school_id=? AND created_at>=? AND created_at<?").get(schoolId, s, e)?.c || 0;
      const stories = db_default.prepare("SELECT COUNT(*) as c FROM stories WHERE school_id=? AND created_at>=? AND created_at<?").get(schoolId, s, e)?.c || 0;
      const diffs = db_default.prepare("SELECT COUNT(*) as c FROM differentiations WHERE school_id=? AND created_at>=? AND created_at<?").get(schoolId, s, e)?.c || 0;
      const activeUsers = db_default.prepare("SELECT COUNT(DISTINCT user_id) as c FROM audit_log WHERE school_id=? AND created_at>=? AND created_at<?").get(schoolId, s, e)?.c || 0;
      weeks.push({ week: label, worksheets, stories, differentiations: diffs, activeUsers });
    }
    res.json(weeks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// server/routes/gdpr.ts
import { Router as Router8 } from "express";
var router8 = Router8();
var BEHAVIOUR_RETENTION_DAYS = 1095;
var ATTENDANCE_RETENTION_DAYS = 1095;
var WORKSHEET_RETENTION_DAYS = 730;
router8.post("/enforce-retention", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const schoolId = req.user.schoolId;
  const behaviourResult = db_default.prepare(`
    DELETE FROM behaviour_records
    WHERE pupil_id IN (SELECT id FROM pupils WHERE school_id = ?)
    AND date < date('now', '-${BEHAVIOUR_RETENTION_DAYS} days')
  `).run(schoolId);
  const attendanceResult = db_default.prepare(`
    DELETE FROM attendance_records
    WHERE pupil_id IN (SELECT id FROM pupils WHERE school_id = ?)
    AND date < date('now', '-${ATTENDANCE_RETENTION_DAYS} days')
  `).run(schoolId);
  const worksheetResult = db_default.prepare(`
    DELETE FROM worksheets
    WHERE school_id = ?
    AND created_at < datetime('now', '-${WORKSHEET_RETENTION_DAYS} days')
  `).run(schoolId);
  auditLog(req.user.id, schoolId, "gdpr.retention_enforced", "school", schoolId, {
    behaviourDeleted: behaviourResult.changes,
    attendanceDeleted: attendanceResult.changes,
    worksheetsDeleted: worksheetResult.changes
  }, req.ip);
  res.json({
    message: "Data retention policy enforced.",
    deleted: {
      behaviourRecords: behaviourResult.changes,
      attendanceRecords: attendanceResult.changes,
      worksheets: worksheetResult.changes
    }
  });
});
router8.delete("/pupils/:id/erase", requireAuth, requireMinRole("school_admin"), (req, res) => {
  const pupilId = req.params.id;
  const schoolId = req.user.schoolId;
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id = ? AND school_id = ?").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  db_default.prepare("DELETE FROM behaviour_records WHERE pupil_id = ?").run(pupilId);
  db_default.prepare("DELETE FROM attendance_records WHERE pupil_id = ?").run(pupilId);
  db_default.prepare("DELETE FROM assignments WHERE pupil_id = ?").run(pupilId);
  db_default.prepare("DELETE FROM pupil_audit WHERE pupil_id = ?").run(pupilId);
  db_default.prepare(`
    UPDATE pupils SET
      name = '[ERASED]',
      upn = NULL,
      dob = NULL,
      is_active = 0,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(pupilId);
  auditLog(req.user.id, schoolId, "gdpr.pupil_erased", "pupil", pupilId, {
    initialsWere: pupil.name
  }, req.ip);
  res.json({ message: "Pupil data erased in accordance with UK GDPR Article 17." });
});
router8.get("/pupils/:id/export", requireAuth, requireMinRole("teacher"), (req, res) => {
  const pupilId = req.params.id;
  const schoolId = req.user.schoolId;
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id = ? AND school_id = ?").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const assignments = db_default.prepare("SELECT * FROM assignments WHERE pupil_id = ?").all(pupilId);
  const attendance = db_default.prepare("SELECT * FROM attendance_records WHERE pupil_id = ?").all(pupilId);
  const behaviour = db_default.prepare("SELECT * FROM behaviour_records WHERE pupil_id = ?").all(pupilId);
  const auditTrail = db_default.prepare("SELECT * FROM pupil_audit WHERE pupil_id = ?").all(pupilId);
  auditLog(req.user.id, schoolId, "gdpr.data_exported", "pupil", pupilId, {}, req.ip);
  const exportData = {
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    exportedBy: req.user.email,
    gdprBasis: "UK GDPR Article 20 \u2014 Right to Data Portability",
    dataController: "Adaptly (adaptly.co.uk)",
    pupil: {
      id: pupil.id,
      initials: pupil.name,
      yearGroup: pupil.year_group,
      sendNeed: pupil.send_need,
      createdAt: pupil.created_at
    },
    assignments,
    attendanceRecords: attendance,
    behaviourRecords: behaviour,
    auditTrail
  };
  res.setHeader("Content-Disposition", `attachment; filename="pupil-data-export-${pupilId}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.json(exportData);
});
router8.get("/school/export", requireAuth, requireMinRole("mat_admin"), (req, res) => {
  const schoolId = req.user.schoolId;
  const pupils = db_default.prepare("SELECT id, name, year_group, send_need, created_at FROM pupils WHERE school_id = ?").all(schoolId);
  const users = db_default.prepare("SELECT id, email, display_name, role, created_at, last_login_at FROM users WHERE school_id = ?").all(schoolId);
  const auditLogs = db_default.prepare("SELECT * FROM audit_logs WHERE school_id = ? ORDER BY created_at DESC LIMIT 1000").all(schoolId);
  auditLog(req.user.id, schoolId, "gdpr.school_data_exported", "school", schoolId, {}, req.ip);
  res.setHeader("Content-Disposition", `attachment; filename="school-data-export-${schoolId}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.json({
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    exportedBy: req.user.email,
    gdprBasis: "UK GDPR Article 20 / ICO Subject Access Request",
    dataController: "Adaptly (adaptly.co.uk)",
    school: { id: schoolId },
    pupils,
    users,
    auditLogs
  });
});
router8.delete("/account/erase", requireAuth, (req, res) => {
  const userId = req.user.id;
  const schoolId = req.user.schoolId;
  db_default.prepare(`
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
  db_default.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  auditLog(userId, schoolId, "gdpr.account_erased", "user", userId, {}, req.ip);
  res.clearCookie("token");
  res.json({ message: "Your account data has been erased in accordance with UK GDPR Article 17." });
});
var gdpr_default = router8;

// server/routes/revision.ts
import { Router as Router9 } from "express";
import multer2 from "multer";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { randomUUID } from "crypto";
var jobs = /* @__PURE__ */ new Map();
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1e3;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, 6e4);
var router9 = Router9();
var upload = multer2({
  storage: multer2.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith(".txt")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, Word, and text files are supported"));
    }
  }
});
var PROVIDER_ORDER2 = ["groq", "gemini", "openai", "openrouter"];
function getEffectiveKey2(provider) {
  const envMap = {
    groq: process.env.GROQ_API_KEY || "",
    gemini: process.env.GEMINI_API_KEY || "",
    openai: process.env.OPENAI_API_KEY || "",
    openrouter: process.env.OPENROUTER_API_KEY || "",
    elevenlabs: process.env.ELEVENLABS_API_KEY || ""
  };
  if (envMap[provider]) return envMap[provider];
  try {
    const row = db_default.prepare(
      "SELECT api_key FROM admin_api_keys WHERE provider = ? ORDER BY updated_at DESC LIMIT 1"
    ).get(provider);
    if (row?.api_key) return row.api_key;
  } catch (_) {
  }
  return "";
}
function getAdminModel2(provider) {
  try {
    const row = db_default.prepare(
      "SELECT model FROM admin_api_keys WHERE provider = ? ORDER BY updated_at DESC LIMIT 1"
    ).get(provider);
    return row?.model || "";
  } catch (_) {
    return "";
  }
}
async function callGroq2(system, user2, key, model, maxTokens) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: model || "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user2 }],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
async function callGemini2(system, user2, key, maxTokens) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: system ? `${system}

${user2}` : user2 }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
      })
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
async function callOpenAI2(system, user2, key, model, maxTokens) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: user2 }],
      max_tokens: maxTokens
    })
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
async function callOpenRouter2(system, user2, key, model, maxTokens) {
  const fallbackModels = [
    model,
    "nvidia/nemotron-nano-9b-v2:free",
    "mistralai/mistral-small-3.1-24b-instruct:free"
  ].filter(Boolean);
  for (const m of fallbackModels) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://adaptly.co.uk",
          "X-Title": "Adaptly"
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: "system", content: system }, { role: "user", content: user2 }],
          max_tokens: maxTokens
        })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (_) {
    }
  }
  throw new Error("OpenRouter: all models failed");
}
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise(
      (_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1e3}s`)), ms)
    )
  ]);
}
async function callWithFallback2(system, user2, maxTokens) {
  const errors = [];
  for (const provider of PROVIDER_ORDER2) {
    const key = getEffectiveKey2(provider);
    if (!key) {
      errors.push(`${provider}: no key`);
      continue;
    }
    try {
      const model = getAdminModel2(provider);
      let callPromise;
      if (provider === "groq") callPromise = callGroq2(system, user2, key, model, maxTokens);
      else if (provider === "gemini") callPromise = callGemini2(system, user2, key, maxTokens);
      else if (provider === "openai") callPromise = callOpenAI2(system, user2, key, model, maxTokens);
      else callPromise = callOpenRouter2(system, user2, key, model, maxTokens);
      const content = await withTimeout(callPromise, 15e3, provider);
      if (content?.trim()) {
        console.log(`[Revision AI] Success via ${provider}`);
        return content;
      }
      errors.push(`${provider}: empty response`);
    } catch (err) {
      const msg = (err?.message || String(err)).slice(0, 100);
      console.warn(`[Revision AI] ${provider} failed: ${msg}`);
      errors.push(`${provider}: ${msg}`);
    }
  }
  throw new Error(`All AI providers failed. Please configure an API key in Admin Settings. Details: ${errors.join(" | ")}`);
}
async function extractText(buffer, mimetype) {
  let raw = "";
  if (mimetype === "text/plain" || mimetype === "application/octet-stream") {
    raw = buffer.toString("utf-8");
  } else if (mimetype === "application/pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      raw = result?.text ?? "";
    } catch (pdfErr) {
      console.error("[extractText] pdf-parse error:", pdfErr?.message || pdfErr);
      raw = buffer.toString("utf-8");
    }
  } else if (mimetype === "application/msword" || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const mammoth = await import("mammoth");
      const mammothLib = mammoth.default || mammoth;
      const result = await mammothLib.extractRawText({ buffer });
      raw = result.value || "";
    } catch (docErr) {
      console.error("[extractText] mammoth error:", docErr?.message || docErr);
      raw = "";
    }
  } else {
    raw = buffer.toString("utf-8");
  }
  const lines = raw.split(/\n/);
  const cleaned = lines.map((l) => l.trim()).filter((l) => {
    if (!l) return false;
    if (/^[-–—]?\s*page\s*\d+\s*[-–—]?$/i.test(l)) return false;
    if (/^\d{1,3}$/.test(l)) return false;
    if (/^(all rights reserved|copyright|confidential|www\.|http|©|\bversion\b|\brev\b|\bdraft\b)/i.test(l)) return false;
    if (/^[\-_\.=\s]{3,}$/.test(l)) return false;
    if (l.length < 3) return false;
    return true;
  }).join(" ").replace(/\s{2,}/g, " ").trim();
  return cleaned.slice(0, 15e3);
}
router9.post("/upload", requireAuth, upload.single("document"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const jobId = randomUUID();
  const language = (req.body?.language || "en").toString().slice(0, 5);
  const yearGroupRaw = (req.body?.yearGroup || "year10").toString();
  const yearNum = parseInt(yearGroupRaw.replace(/[^0-9]/g, ""), 10) || 10;
  const fileBuffer = req.file.buffer;
  const fileMime = req.file.mimetype;
  jobs.set(jobId, { status: "pending", progress: "Extracting text from document...", createdAt: Date.now() });
  (async () => {
    try {
      console.log(`[Revision] Job ${jobId} started. Keys: groq=${!!process.env.GROQ_API_KEY}, gemini=${!!process.env.GEMINI_API_KEY}, openai=${!!process.env.OPENAI_API_KEY}`);
      const t0 = Date.now();
      const rawText = await extractText(fileBuffer, fileMime);
      if (!rawText || rawText.trim().length < 50) {
        jobs.set(jobId, { ...jobs.get(jobId), status: "error", error: "Could not extract readable text from this file. Please try a different file." });
        return;
      }
      jobs.set(jobId, { ...jobs.get(jobId), progress: "Writing your revision podcast script..." });
      const LANG_NAMES = {
        en: "English",
        es: "Spanish",
        fr: "French",
        de: "German",
        it: "Italian",
        pt: "Portuguese",
        ar: "Arabic",
        zh: "Chinese",
        ja: "Japanese",
        hi: "Hindi",
        ur: "Urdu",
        pl: "Polish",
        tr: "Turkish",
        ru: "Russian"
      };
      const langName = LANG_NAMES[language] || "English";
      const langInstruction = language === "en" ? "" : `
       - IMPORTANT: Write the ENTIRE podcast script in ${langName}. All explanations, examples, transitions, and the closing line must be in ${langName}.`;
      const docLen = rawText.length;
      const targetWords = docLen < 500 ? yearNum <= 6 ? 200 : yearNum <= 9 ? 350 : 450 : docLen < 1500 ? yearNum <= 6 ? 350 : yearNum <= 9 ? 550 : 700 : docLen < 4e3 ? yearNum <= 6 ? 500 : yearNum <= 9 ? 800 : 1e3 : docLen < 8e3 ? yearNum <= 6 ? 650 : yearNum <= 9 ? 1e3 : 1300 : yearNum <= 6 ? 800 : yearNum <= 9 ? 1200 : 1600;
      const ageGuide = yearNum <= 2 ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use very short sentences (5\u20138 words). Only the simplest vocabulary. Speak like a kind, encouraging primary teacher. Use lots of repetition and concrete examples. Avoid any abstract concepts. Target: ${targetWords} words.` : yearNum <= 4 ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use short, clear sentences. Simple everyday vocabulary. Introduce new words with an immediate plain-English definition. Use relatable real-world examples. Target: ${targetWords} words.` : yearNum <= 6 ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use clear sentences (10\u201315 words). Introduce subject vocabulary with brief definitions. Use concrete examples and analogies. Target: ${targetWords} words.` : yearNum <= 8 ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use moderate complexity. Introduce technical vocabulary with definitions. Some abstract concepts are fine if anchored to concrete examples. Target: ${targetWords} words.` : yearNum <= 9 ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use KS3-level academic language. Technical vocabulary expected. Multi-clause sentences are fine. Target: ${targetWords} words.` : yearNum <= 11 ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}) studying for their GCSEs. Use GCSE-level academic language. Subject-specific terminology is expected. Use command words (describe, explain, evaluate, analyse) naturally. Target: ${targetWords} words.` : `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}) studying at A-Level. Use A-Level academic register. Sophisticated vocabulary, nuanced arguments, synoptic links. Reference relevant theories and studies. Target: ${targetWords} words.`;
      const maxTokens = Math.min(4e3, Math.max(600, Math.round(targetWords * 1.5)));
      const script = await callWithFallback2(
        `You are an incredibly warm, engaging, and slightly informal educational podcaster \u2014 like a brilliant friend who genuinely loves this subject and can't wait to explain it.
       Ignore all headers, page numbers, and formatting in the document \u2014 focus only on the actual educational content.
       Transform it into natural flowing speech that sounds like a real person talking \u2014 NOT a textbook being read aloud.

       STUDENT PROFILE: ${ageGuide}

       HOW TO SOUND HUMAN (follow every one of these):
       - Use contractions constantly: you're, it's, that's, we're, don't, can't, I've, they've
       - Start sentences with "So", "Now", "Right", "Okay", "And", "But" \u2014 just like real speech
       - Use natural thinking phrases: "Here's the thing...", "What's really interesting is...", "And this is where it gets good..."
       - Ask rhetorical questions and answer them straight away: "Why does that matter? Well..."
       - Use casual asides: "\u2014 and this is the key part \u2014", "trust me on this one", "you'll see this a lot in the exam"
       - Vary pace: short punchy sentences for emphasis. Then a longer one to explain the detail. Then short again.
       - React naturally: "Pretty cool, right?", "I know, it sounds complicated \u2014 but stick with me.", "See how that connects?"
       - Speak to one student directly using "you" \u2014 never address a class
       - Sound genuinely enthusiastic \u2014 like someone who loves this topic, not someone performing enthusiasm

       CONTENT RULES:
       - Actually explain each concept from scratch as if the student has never heard it \u2014 don't just repeat the notes
       - Use real-world analogies and examples relevant to the student's actual life and age
       - Define technical terms instantly in plain conversational language the moment you use them
       - Connect ideas: "This links back to what we just covered...", "Remember that bit? Here's why it mattered."
       - Cover every key concept \u2014 nothing important gets skipped
       - No bullet points, no markdown, no headers, no numbered lists \u2014 pure natural speech only
       - Do NOT open with "Welcome" or "In this podcast" \u2014 dive straight into the first concept
       - End with exactly: "Right, you've got a really solid understanding of this now. Jump over to the quiz and put it to the test \u2014 good luck!"
       ${langInstruction}`,
        `Document text to turn into a natural podcast script:

${rawText.slice(0, 8e3)}`,
        maxTokens
      );
      console.log(`[Revision] Job ${jobId} done in ${Date.now() - t0}ms`);
      jobs.set(jobId, { ...jobs.get(jobId), status: "done", text: rawText, script });
    } catch (err) {
      console.error(`[Revision] Job ${jobId} error:`, err);
      jobs.set(jobId, { ...jobs.get(jobId), status: "error", error: err.message || "Failed to process document" });
    }
  })();
  res.json({ jobId });
});
router9.get("/job/:id", requireAuth, (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status === "pending") return res.json({ status: "pending", progress: job.progress });
  if (job.status === "error") return res.json({ status: "error", error: job.error });
  jobs.delete(req.params.id);
  return res.json({ status: "done", text: job.text, script: job.script });
});
router9.post("/ask", requireAuth, async (req, res) => {
  try {
    const { question, documentText } = req.body;
    if (!question || !documentText) {
      return res.status(400).json({ error: "question and documentText are required" });
    }
    const answer = await callWithFallback2(
      `You are a helpful, encouraging tutor helping a student understand their revision material.
       Answer the student's question based on the provided document text.
       - Keep answers clear, concise, and age-appropriate (11-18 year olds)
       - If the answer isn't in the document, say so honestly and give a brief general explanation
       - Use simple language and relatable examples where possible
       - Be warm and encouraging \u2014 never make the student feel silly for asking
       - Keep answers to 2-4 sentences maximum`,
      `Document text:
${documentText.slice(0, 8e3)}

Student question: ${question}`,
      400
    );
    res.json({ answer });
  } catch (err) {
    console.error("Revision ask error:", err);
    res.status(500).json({ error: err.message || "Failed to answer question" });
  }
});
router9.post("/quiz", requireAuth, async (req, res) => {
  try {
    const { documentText, count = 5, existingQuestions = [] } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: "documentText is required" });
    }
    const existingQList = existingQuestions.slice(-30);
    const avoidList = existingQList.map((q) => q.question).join("\n");
    const existingNormalised = new Set(
      existingQList.map((q) => (q.question || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim())
    );
    const raw = await callWithFallback2(
      `You are an expert teacher creating multiple-choice revision questions.
       Generate exactly ${count} multiple-choice questions based on the provided text.
       
       STRICT JSON FORMAT \u2014 respond with ONLY a JSON array, no markdown, no explanation:
       [
         {
           "question": "Clear question text?",
           "options": ["Option A", "Option B", "Option C", "Option D"],
           "correct": 0,
           "explanation": "Explanation of why the correct answer is right AND why the others are wrong. Be specific and educational. 2-3 sentences."
         }
       ]
       
       CRITICAL RULES \u2014 you MUST follow ALL of these:
       - "correct" is the 0-based index of the correct option in the options array
       - All 4 options must be plausible (no obviously wrong distractors)
       - Questions should test understanding, not just memorisation
       - Vary difficulty: some straightforward, some requiring deeper thinking
       - ABSOLUTE RULE: Do NOT generate questions that are the same as, similar to, or paraphrase any of these already-asked questions:
${avoidList ? avoidList.split("\n").map((q) => `         * ${q}`).join("\n") : "         (none yet)"}
       - Each new question MUST cover a DIFFERENT fact, concept, or aspect of the text from all previous questions
       - Explanations must be encouraging and educational \u2014 explain WHY each wrong answer is incorrect`,
      `Study text:
${documentText.slice(0, 8e3)}`,
      1500
    );
    let questions = [];
    try {
      const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const jsonMatch = stripped.match(/\[[\s\S]*\]/);
      questions = JSON.parse(jsonMatch ? jsonMatch[0] : stripped);
    } catch {
      return res.status(500).json({ error: "Failed to parse quiz questions \u2014 please try again" });
    }
    questions = questions.filter((q) => {
      const norm = (q.question || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      if (existingNormalised.has(norm)) return false;
      const prefix = norm.slice(0, 40);
      for (const existing of existingNormalised) {
        if (existing.slice(0, 40) === prefix) return false;
      }
      return true;
    });
    questions = questions.map((q, i) => ({
      ...q,
      id: `q_${Date.now()}_${i}`
    }));
    res.json({ questions });
  } catch (err) {
    console.error("Revision quiz error:", err);
    res.status(500).json({ error: err.message || "Failed to generate quiz" });
  }
});
function splitIntoChunks(text, maxChars = 900) {
  const clean = text.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return [clean];
  const chunks = [];
  const sentences = clean.match(/[^.!?\n]+[.!?\n]+\s*/g) || [clean];
  let current = "";
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      const parts = sentence.match(/[^,;]+[,;]?\s*/g) || [sentence];
      let partCurrent = "";
      for (const part of parts) {
        if ((partCurrent + part).length > maxChars && partCurrent.length > 0) {
          chunks.push(partCurrent.trim());
          partCurrent = part;
        } else {
          partCurrent += part;
        }
      }
      if (partCurrent.trim()) current = partCurrent;
      continue;
    }
    if ((current + sentence).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 0) || [clean.slice(0, maxChars)];
}
router9.post("/tts", requireAuth, async (req, res) => {
  try {
    const { text, voice = "nova", language = "en" } = req.body;
    if (!text || text.length < 5) {
      return res.status(400).json({ error: "text is required" });
    }
    const AZURE_VOICE_MAP = {
      nova: "en-GB-SoniaNeural",
      hannah: "en-GB-SoniaNeural",
      shimmer: "en-GB-LibbyNeural",
      autumn: "en-GB-LibbyNeural",
      alloy: "en-GB-MaisieNeural",
      diana: "en-GB-MaisieNeural",
      echo: "en-GB-RyanNeural",
      daniel: "en-GB-RyanNeural",
      fable: "en-US-GuyNeural",
      troy: "en-US-GuyNeural",
      onyx: "en-US-EricNeural",
      austin: "en-US-EricNeural"
    };
    const GOOGLE_VOICE_MAP = {
      nova: "en-GB-Neural2-A",
      hannah: "en-GB-Neural2-A",
      shimmer: "en-GB-Neural2-C",
      autumn: "en-GB-Neural2-C",
      alloy: "en-GB-Neural2-F",
      diana: "en-GB-Neural2-F",
      echo: "en-GB-Neural2-B",
      daniel: "en-GB-Neural2-B",
      fable: "en-US-Neural2-D",
      troy: "en-US-Neural2-D",
      onyx: "en-US-Neural2-J",
      austin: "en-US-Neural2-J"
    };
    const LANG_VOICE_MAP = {
      cy: "cy-GB-NiaNeural",
      fr: "fr-FR-DeniseNeural",
      es: "es-ES-ElviraNeural",
      de: "de-DE-KatjaNeural",
      ar: "ar-EG-SalmaNeural",
      zh: "zh-CN-XiaoxiaoNeural",
      ja: "ja-JP-NanamiNeural",
      hi: "hi-IN-SwaraNeural",
      ur: "ur-PK-UzmaNeural",
      pl: "pl-PL-ZofiaNeural",
      tr: "tr-TR-EmelNeural"
    };
    const azureVoice = language !== "en" && LANG_VOICE_MAP[language] ? LANG_VOICE_MAP[language] : AZURE_VOICE_MAP[voice] || "en-GB-SoniaNeural";
    const googleVoiceName = GOOGLE_VOICE_MAP[voice] || "en-GB-Neural2-A";
    const googleLanguageCode = googleVoiceName.split("-").slice(0, 2).join("-");
    try {
      console.log(`[TTS] msedge-tts PRIMARY: voice=${azureVoice}, chars=${text.length}`);
      const tts = new MsEdgeTTS();
      await tts.setMetadata(azureVoice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const chunks = splitIntoChunks(text, 3e3);
      console.log(`[TTS] Processing ${chunks.length} chunk(s) with msedge-tts`);
      const results = await Promise.all(
        chunks.map(async (chunk, idx) => {
          const { audioStream } = tts.toStream(chunk);
          const bufs = [];
          await new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error(`msedge chunk ${idx + 1} timeout`)), 2e4);
            let done = false;
            const finish = () => {
              if (!done) {
                done = true;
                clearTimeout(t);
                resolve();
              }
            };
            audioStream.on("data", (d) => bufs.push(d));
            audioStream.on("end", finish);
            audioStream.on("close", finish);
            audioStream.on("error", (e) => {
              if (!done) {
                done = true;
                clearTimeout(t);
                reject(e);
              }
            });
          });
          return bufs.length > 0 ? Buffer.concat(bufs) : null;
        })
      );
      tts.close();
      const valid = results.filter((b) => b !== null);
      if (valid.length === 0) throw new Error("msedge-tts returned no audio");
      const combined = Buffer.concat(valid);
      console.log(`[TTS] msedge-tts success: ${combined.byteLength} bytes`);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", combined.byteLength.toString());
      return res.send(combined);
    } catch (msedgeErr) {
      console.warn(`[TTS] msedge-tts failed (${msedgeErr?.message}), trying Google Cloud TTS fallback...`);
      const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
      if (!googleKey) {
        throw new Error("Neural voice unavailable \u2014 no Google API key configured. Please set GOOGLE_API_KEY or GEMINI_API_KEY in your environment.");
      }
      const chunks = splitIntoChunks(text, 4500);
      console.log(`[TTS] Google Cloud TTS fallback: ${chunks.length} chunk(s), voice=${googleVoiceName}`);
      const mp3Buffers = [];
      for (const chunk of chunks) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 25e3);
        try {
          const resp = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                input: { text: chunk },
                voice: { languageCode: googleLanguageCode, name: googleVoiceName },
                audioConfig: { audioEncoding: "MP3", speakingRate: 0.95, pitch: 0 }
              }),
              signal: ctrl.signal
            }
          );
          clearTimeout(timer);
          if (!resp.ok) {
            const errBody = await resp.text();
            if (resp.status === 403) {
              throw new Error(
                "Google Cloud Text-to-Speech API is not enabled. Go to console.cloud.google.com \u2192 APIs & Services \u2192 Enable APIs, search for 'Cloud Text-to-Speech API' and click Enable. The same API key is used \u2014 no new credentials needed."
              );
            }
            throw new Error(`Google TTS error ${resp.status}: ${errBody.slice(0, 200)}`);
          }
          const data = await resp.json();
          mp3Buffers.push(Buffer.from(data.audioContent, "base64"));
        } catch (e) {
          clearTimeout(timer);
          throw e;
        }
      }
      const combined = Buffer.concat(mp3Buffers);
      console.log(`[TTS] Google Cloud TTS success: ${combined.byteLength} bytes`);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", combined.byteLength.toString());
      return res.send(combined);
    }
  } catch (err) {
    console.error("[TTS] All TTS providers failed:", err?.message || err);
    res.status(500).json({ error: err.message || "Neural voice generation failed. Please try again." });
  }
});
var revision_default = router9;

// server/routes/billing.ts
import { Router as Router10 } from "express";
import Stripe from "stripe";
var router10 = Router10();
var STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
var STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
var CLIENT_URL = process.env.CLIENT_URL || "https://adaptly.co.uk";
var stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" }) : null;
function getPriceId(plan, billing) {
  const map = {
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_M || "",
      annual: process.env.STRIPE_PRICE_STARTER_Y || ""
    },
    professional: {
      monthly: process.env.STRIPE_PRICE_PRO_M || "",
      annual: process.env.STRIPE_PRICE_PRO_Y || ""
    },
    premium: {
      monthly: process.env.STRIPE_PRICE_PREMIUM_M || "",
      annual: process.env.STRIPE_PRICE_PREMIUM_Y || ""
    }
  };
  return map[plan]?.[billing] || null;
}
async function getOrCreateStripeCustomer(school, adminEmail) {
  if (!stripe) throw new Error("Stripe not configured");
  if (school.stripe_customer_id) return school.stripe_customer_id;
  const customer = await stripe.customers.create({
    email: adminEmail,
    name: school.name,
    metadata: { school_id: school.id, school_name: school.name }
  });
  db.prepare("UPDATE schools SET stripe_customer_id = ? WHERE id = ?").run(
    customer.id,
    school.id
  );
  return customer.id;
}
router10.get("/status", requireAuth, (req, res) => {
  const user2 = req.user;
  const PLATFORM_OWNER_EMAILS2 = ["admin@adaptly.co.uk", "admin@sendassistant.app"];
  if (PLATFORM_OWNER_EMAILS2.includes(user2.email || "")) {
    return res.json({
      status: "active",
      plan: "premium",
      licenceType: "premium",
      trialEndsAt: null,
      periodEnd: null,
      cancelAtPeriodEnd: false,
      isAccessible: true,
      stripeConfigured: !!stripe,
      isPlatformOwner: true
    });
  }
  if (!user2.schoolId) return res.json({ status: "no_school", plan: null });
  const school = db.prepare("SELECT * FROM schools WHERE id = ?").get(user2.schoolId);
  if (!school) return res.json({ status: "no_school", plan: null });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const trialActive = school.licence_type === "trial" && school.trial_ends_at && school.trial_ends_at > now;
  const subscriptionActive = school.subscription_status === "active" || school.subscription_status === "trialing";
  const isAccessible = trialActive || subscriptionActive;
  res.json({
    status: school.subscription_status || "trialing",
    plan: school.subscription_plan || school.licence_type,
    licenceType: school.licence_type,
    trialEndsAt: school.trial_ends_at,
    periodEnd: school.subscription_period_end,
    cancelAtPeriodEnd: !!school.subscription_cancel_at_period_end,
    isAccessible,
    stripeConfigured: !!stripe
  });
});
router10.post("/checkout", requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Payment processing is not yet configured. Please contact support." });
  }
  const user2 = req.user;
  if (!user2.schoolId) return res.status(400).json({ error: "No school associated with this account" });
  if (!["school_admin", "mat_admin"].includes(user2.role)) {
    return res.status(403).json({ error: "Only school admins can manage billing" });
  }
  const { plan, billing = "monthly" } = req.body;
  if (!["starter", "professional", "premium"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan. Choose: starter, professional, or premium" });
  }
  if (!["monthly", "annual"].includes(billing)) {
    return res.status(400).json({ error: "Invalid billing period. Choose: monthly or annual" });
  }
  const priceId = getPriceId(plan, billing);
  if (!priceId) {
    return res.status(503).json({ error: "This plan is not yet available for online purchase. Please contact sales@adaptly.co.uk" });
  }
  try {
    const school = db.prepare("SELECT * FROM schools WHERE id = ?").get(user2.schoolId);
    const customerId = await getOrCreateStripeCustomer(school, user2.email);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${CLIENT_URL}/settings?billing=success`,
      cancel_url: `${CLIENT_URL}/settings?billing=cancelled`,
      metadata: {
        school_id: user2.schoolId,
        plan,
        billing
      },
      subscription_data: {
        metadata: { school_id: user2.schoolId, plan },
        trial_period_days: school.licence_type === "trial" ? 0 : void 0
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_update: { address: "auto" }
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});
router10.post("/portal", requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Payment processing is not yet configured." });
  }
  const user2 = req.user;
  if (!user2.schoolId) return res.status(400).json({ error: "No school associated" });
  if (!["school_admin", "mat_admin"].includes(user2.role)) {
    return res.status(403).json({ error: "Only school admins can manage billing" });
  }
  const school = db.prepare("SELECT * FROM schools WHERE id = ?").get(user2.schoolId);
  if (!school?.stripe_customer_id) {
    return res.status(400).json({ error: "No billing account found. Please subscribe first." });
  }
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: school.stripe_customer_id,
      return_url: `${CLIENT_URL}/settings`
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    res.status(500).json({ error: "Failed to open billing portal" });
  }
});
router10.post(
  "/webhook",
  // Raw body middleware — must be applied before express.json() in the main app
  (req, res) => {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      return res.status(200).json({ received: true });
    }
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody || req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }
    handleWebhookEvent(event).catch(
      (err) => console.error("Webhook handler error:", err)
    );
    res.json({ received: true });
  }
);
async function handleWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const schoolId = session.metadata?.school_id;
      const plan = session.metadata?.plan;
      if (!schoolId || !plan) break;
      db.prepare(`UPDATE schools SET
        subscription_status = 'active',
        subscription_plan = ?,
        licence_type = ?,
        stripe_customer_id = COALESCE(stripe_customer_id, ?),
        subscription_cancel_at_period_end = 0
        WHERE id = ?`).run(plan, plan, session.customer, schoolId);
      console.log(`[Billing] Checkout completed: school=${schoolId} plan=${plan}`);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const schoolId = sub.metadata?.school_id;
      if (!schoolId) break;
      const plan = sub.metadata?.plan || (sub.items.data[0]?.price?.metadata?.plan ?? null);
      const periodEnd = new Date(sub.current_period_end * 1e3).toISOString();
      db.prepare(`UPDATE schools SET
        subscription_status = ?,
        subscription_plan = COALESCE(?, subscription_plan),
        subscription_period_end = ?,
        subscription_cancel_at_period_end = ?,
        licence_type = CASE WHEN ? = 'active' THEN COALESCE(?, licence_type) ELSE licence_type END
        WHERE id = ?`).run(
        sub.status,
        plan,
        periodEnd,
        sub.cancel_at_period_end ? 1 : 0,
        sub.status,
        plan,
        schoolId
      );
      console.log(`[Billing] Subscription updated: school=${schoolId} status=${sub.status}`);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const schoolId = sub.metadata?.school_id;
      if (!schoolId) break;
      db.prepare(`UPDATE schools SET
        subscription_status = 'canceled',
        subscription_cancel_at_period_end = 0
        WHERE id = ?`).run(schoolId);
      console.log(`[Billing] Subscription cancelled: school=${schoolId}`);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      if (!customerId) break;
      const school = db.prepare("SELECT id FROM schools WHERE stripe_customer_id = ?").get(customerId);
      if (!school) break;
      db.prepare("UPDATE schools SET subscription_status = 'past_due' WHERE id = ?").run(school.id);
      console.log(`[Billing] Payment failed: school=${school.id}`);
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      if (!customerId) break;
      const school = db.prepare("SELECT id FROM schools WHERE stripe_customer_id = ?").get(customerId);
      if (!school) break;
      db.prepare("UPDATE schools SET subscription_status = 'active' WHERE id = ?").run(school.id);
      console.log(`[Billing] Payment succeeded: school=${school.id}`);
      break;
    }
    default:
      break;
  }
}
var billing_default = router10;

// server/routes/mis.ts
import { Router as Router11 } from "express";
import { v4 as uuidv49 } from "uuid";
import crypto2 from "crypto";
var router11 = Router11();
var PLATFORM_OWNER_EMAILS = ["admin@adaptly.co.uk", "admin@sendassistant.app"];
function isPremiumSchool(schoolId, userEmail) {
  if (userEmail && PLATFORM_OWNER_EMAILS.includes(userEmail.toLowerCase())) return true;
  if (!schoolId) return false;
  const ownerUser = db_default.prepare(
    "SELECT id FROM users WHERE school_id = ? AND email IN ('admin@adaptly.co.uk','admin@sendassistant.app') LIMIT 1"
  ).get(schoolId);
  if (ownerUser) return true;
  const school = db_default.prepare(
    "SELECT subscription_plan, licence_type, name FROM schools WHERE id = ?"
  ).get(schoolId);
  if (!school) return false;
  const schoolName = (school.name || "").toLowerCase();
  if (schoolName === "adaptly" || schoolName === "adaptly demo" || schoolName === "system") return true;
  const plan = (school.subscription_plan || school.licence_type || "").toLowerCase();
  return ["premium", "mat", "enterprise"].includes(plan);
}
var _ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
if (!_ENCRYPTION_KEY_RAW) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[FATAL] ENCRYPTION_KEY environment variable is not set. MIS API keys cannot be stored or decrypted securely. Add ENCRYPTION_KEY (a 32+ character random string) to your Railway environment variables before starting the server."
    );
  } else {
    console.warn("[SECURITY] DEV: ENCRYPTION_KEY not set \u2014 using ephemeral key. Set ENCRYPTION_KEY in .env for persistent MIS keys.");
  }
}
var ENCRYPTION_KEY = _ENCRYPTION_KEY_RAW || crypto2.randomBytes(32).toString("hex");
var KEY_BUF = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
function decryptKey2(encryptedB64, ivB64) {
  const data = Buffer.from(encryptedB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const tag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const decipher = crypto2.createDecipheriv("aes-256-gcm", KEY_BUF, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
function encryptKey2(plaintext) {
  const iv = crypto2.randomBytes(12);
  const cipher = crypto2.createCipheriv("aes-256-gcm", KEY_BUF, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, tag]).toString("base64"),
    iv: iv.toString("base64")
  };
}
function normaliseYearGroup(raw) {
  if (!raw) return "";
  const s = raw.toString().trim().toLowerCase();
  if (s === "nursery" || s === "n") return "Nursery";
  if (s === "reception" || s === "r" || s === "rec") return "Reception";
  const match = s.match(/(\d+)/);
  if (match) {
    const n = parseInt(match[1]);
    if (n >= 1 && n <= 13) return `Year ${n}`;
  }
  return raw.trim();
}
function normaliseSendNeed(raw) {
  if (!raw) return "";
  const s = raw.toString().trim().toLowerCase();
  if (s.includes("dyslexia")) return "Dyslexia";
  if (s.includes("adhd") || s.includes("attention")) return "ADHD";
  if (s.includes("autism") || s.includes("asc") || s.includes("asd")) return "Autism";
  if (s.includes("dyspraxia") || s.includes("dcd")) return "Dyspraxia";
  if (s.includes("dyscalculia")) return "Dyscalculia";
  if (s.includes("speech") || s.includes("slcn") || s.includes("language")) return "SLCN";
  if (s.includes("visual") || s.includes("vi")) return "Visual Impairment";
  if (s.includes("hearing") || s.includes("hi")) return "Hearing Impairment";
  if (s.includes("mld") || s.includes("learning difficulty")) return "MLD";
  if (s.includes("ehc") || s.includes("ehcp")) return "EHC Plan";
  if (s === "none" || s === "no send" || s === "") return "";
  return raw.trim();
}
function normaliseAttendanceStatus(code) {
  if (!code) return "not-recorded";
  const c = code.toString().trim().toUpperCase();
  if (["P", "L", "U", "B", "V", "W", "PRESENT", "1"].includes(c)) return "present";
  if (["A", "H", "I", "J", "M", "R", "S", "T", "AUTHORISED", "AUTH"].includes(c)) return "authorised";
  if (["G", "N", "O", "U", "X", "UNAUTHORISED", "UNAUTH"].includes(c)) return "unauthorised";
  if (["L", "LATE"].includes(c)) return "late";
  return "not-recorded";
}
function normaliseBehaviourType(raw) {
  if (!raw) return "concern";
  const s = raw.toString().trim().toLowerCase();
  if (s.includes("positive") || s.includes("reward") || s.includes("praise") || s.includes("achievement") || s.includes("merit") || s.includes("good") || s.includes("commendation") || s.includes("star") || s.includes("point")) {
    return "positive";
  }
  return "concern";
}
function normaliseCommentType(raw) {
  if (!raw) return "neutral";
  const s = raw.toString().trim().toLowerCase();
  if (s.includes("positive") || s.includes("praise") || s.includes("good") || s.includes("achievement")) return "positive";
  if (s.includes("concern") || s.includes("negative") || s.includes("issue") || s.includes("incident")) return "negative";
  if (s.includes("safeguard") || s.includes("welfare") || s.includes("child protection")) return "safeguarding";
  return "neutral";
}
function toISODate(raw) {
  if (!raw) return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {
  }
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function misFetch(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}
function buildHeaders(provider, apiKey) {
  if (provider === "bromcom") {
    return { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" };
  }
  return {
    "Authorization": `Basic ${Buffer.from(apiKey).toString("base64")}`,
    "Accept": "application/json"
  };
}
router11.post("/import-csv", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "No rows provided" });
  }
  if (rows.length > 2e3) {
    return res.status(400).json({ error: "Maximum 2000 pupils per import" });
  }
  let created = 0, updated = 0, skipped = 0;
  const errors = [];
  const insertStmt = db_default.prepare(
    `INSERT INTO pupils (id, school_id, name, year_group, send_need, code, upn, dob, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updateStmt = db_default.prepare(
    `UPDATE pupils SET name=?, year_group=?, send_need=?, dob=?, updated_at=datetime('now')
     WHERE school_id=? AND upn=? AND is_active=1`
  );
  const findByUpn = db_default.prepare("SELECT id FROM pupils WHERE school_id=? AND upn=? AND is_active=1");
  const findByName = db_default.prepare("SELECT id FROM pupils WHERE school_id=? AND name=? AND is_active=1");
  const importTx = db_default.transaction(() => {
    for (const row of rows) {
      const name = (row.name || row.Name || row["Preferred Name"] || row["Legal Name"] || "").toString().trim();
      if (!name) {
        skipped++;
        continue;
      }
      const yearGroup = normaliseYearGroup(row.yearGroup || row["Year Group"] || row["Year"] || row["year_group"] || "");
      const sendNeed = normaliseSendNeed(row.sendNeed || row["SEN Status"] || row["SEND Need"] || row["SEN Need"] || row["send_need"] || "");
      const upn = (row.upn || row.UPN || row["Unique Pupil Number"] || "").toString().trim() || null;
      const dob = (row.dob || row.DOB || row["Date of Birth"] || row["DateOfBirth"] || "").toString().trim() || null;
      if (upn) {
        const existing = findByUpn.get(schoolId, upn);
        if (existing) {
          updateStmt.run(name, yearGroup || null, sendNeed || null, dob || null, schoolId, upn);
          updated++;
          continue;
        }
      } else {
        const existing = findByName.get(schoolId, name);
        if (existing) {
          skipped++;
          continue;
        }
      }
      const id = uuidv49();
      const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();
      try {
        insertStmt.run(id, schoolId, name, yearGroup || null, sendNeed || null, code, upn, dob, req.user.id);
        created++;
      } catch (e) {
        errors.push(`Row "${name}": ${e.message}`);
        skipped++;
      }
    }
  });
  try {
    importTx();
  } catch (e) {
    return res.status(500).json({ error: "Import failed: " + e.message });
  }
  auditLog(req.user.id, schoolId, "mis.csv_import", "pupils", "bulk", { created, updated, skipped }, req.ip);
  res.json({ success: true, created, updated, skipped, errors: errors.slice(0, 10) });
});
router11.get("/status", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  const userEmail = req.user.email;
  const isPremium = isPremiumSchool(schoolId || "", userEmail);
  if (!schoolId && !isPremium) return res.json({ bromcom: false, arbor: false, isPremium: false });
  const bromcomRow = db_default.prepare(
    "SELECT id FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
  ).get(schoolId, "bromcom");
  const arborRow = db_default.prepare(
    "SELECT id FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
  ).get(schoolId, "arbor");
  const lastSync = db_default.prepare(
    `SELECT details, created_at FROM audit_logs
     WHERE school_id=? AND action LIKE 'mis.%_sync'
     ORDER BY created_at DESC LIMIT 1`
  ).get(schoolId);
  res.json({
    isPremium,
    bromcom: !!bromcomRow,
    arbor: !!arborRow,
    lastSync: lastSync ? {
      at: lastSync.created_at,
      details: JSON.parse(lastSync.details || "{}")
    } : null
  });
});
router11.post("/save-key", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  const userEmail = req.user.email;
  if (!schoolId && !PLATFORM_OWNER_EMAILS.includes(userEmail.toLowerCase())) {
    return res.status(400).json({ error: "No school associated with your account" });
  }
  if (!isPremiumSchool(schoolId || "", userEmail)) {
    return res.status(403).json({ error: "MIS API integration requires a Premium plan" });
  }
  const { provider, apiKey, schoolId: misSchoolId, baseUrl } = req.body;
  if (!["bromcom", "arbor"].includes(provider)) {
    return res.status(400).json({ error: "Provider must be bromcom or arbor" });
  }
  if (!apiKey) return res.status(400).json({ error: "API key is required" });
  const { encrypted, iv } = encryptKey2(apiKey.trim());
  const label = provider === "bromcom" ? "Bromcom MIS" : "Arbor MIS";
  const existing = db_default.prepare(
    "SELECT id FROM school_api_keys WHERE school_id=? AND provider=?"
  ).get(schoolId, provider);
  if (existing) {
    db_default.prepare(
      `UPDATE school_api_keys SET api_key_encrypted=?, api_key_iv=?, base_url=?, provider_label=?, enabled=1, added_by=?, updated_at=datetime('now')
       WHERE school_id=? AND provider=?`
    ).run(encrypted, iv, misSchoolId || baseUrl || null, label, req.user.id, schoolId, provider);
  } else {
    db_default.prepare(
      `INSERT INTO school_api_keys (id, school_id, provider, provider_label, api_key_encrypted, api_key_iv, base_url, enabled, added_by)
       VALUES (?,?,?,?,?,?,?,1,?)`
    ).run(uuidv49(), schoolId, provider, label, encrypted, iv, misSchoolId || baseUrl || null, req.user.id);
  }
  auditLog(req.user.id, schoolId, "mis.key_saved", "school_api_keys", provider, { provider }, req.ip);
  res.json({ success: true, message: `${label} credentials saved` });
});
router11.delete("/remove-key/:provider", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  db_default.prepare("DELETE FROM school_api_keys WHERE school_id=? AND provider=?").run(schoolId, req.params.provider);
  auditLog(req.user.id, schoolId, "mis.key_removed", "school_api_keys", req.params.provider, {}, req.ip);
  res.json({ success: true });
});
router11.post("/sync/:provider", requireAuth, requireAdmin, async (req, res) => {
  const schoolId = req.user.schoolId;
  const userEmail = req.user.email;
  if (!schoolId && !PLATFORM_OWNER_EMAILS.includes(userEmail.toLowerCase())) {
    return res.status(400).json({ error: "No school" });
  }
  if (!isPremiumSchool(schoolId || "", userEmail)) {
    return res.status(403).json({ error: "MIS API integration requires a Premium plan" });
  }
  const provider = req.params.provider;
  if (!["bromcom", "arbor"].includes(provider)) {
    return res.status(400).json({ error: "Invalid provider" });
  }
  const keyRow = db_default.prepare(
    "SELECT api_key_encrypted, api_key_iv, base_url FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
  ).get(schoolId, provider);
  if (!keyRow) {
    return res.status(404).json({ error: `No ${provider} credentials found. Please add them in Settings first.` });
  }
  let apiKey;
  try {
    apiKey = decryptKey2(keyRow.api_key_encrypted, keyRow.api_key_iv);
  } catch {
    return res.status(500).json({ error: "Failed to decrypt API key" });
  }
  const misSchoolId = keyRow.base_url || "";
  const headers = buildHeaders(provider, apiKey);
  const bromcomBase = "https://api.bromcom.com/v2";
  const arborBase = misSchoolId ? `https://${misSchoolId}.arbor.sc/api/rest/v2` : "https://mis.arbor.sc/api/rest/v2";
  const base = provider === "bromcom" ? bromcomBase : arborBase;
  const results = {
    pupils: { created: 0, updated: 0, skipped: 0 },
    behaviour: { created: 0, skipped: 0 },
    attendance: { created: 0, updated: 0, skipped: 0 },
    comments: { created: 0, skipped: 0 },
    errors: []
  };
  const findByUpn = db_default.prepare("SELECT id FROM pupils WHERE school_id=? AND upn=? AND is_active=1");
  const findByName = db_default.prepare("SELECT id FROM pupils WHERE school_id=? AND name=? AND is_active=1");
  const insertPupil = db_default.prepare(
    `INSERT INTO pupils (id, school_id, name, year_group, send_need, code, upn, dob, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updatePupil = db_default.prepare(
    `UPDATE pupils SET name=?, year_group=?, send_need=?, dob=?, updated_at=datetime('now')
     WHERE school_id=? AND upn=? AND is_active=1`
  );
  const insertBehaviour = db_default.prepare(
    `INSERT OR IGNORE INTO behaviour_records
     (id, school_id, pupil_id, type, category, description, action_taken, date, points, mis_source, mis_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  );
  const insertAttendance = db_default.prepare(
    `INSERT INTO attendance_records
     (id, school_id, pupil_id, date, am_status, am_reason, pm_status, pm_reason, notes, mis_source, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(pupil_id, date) DO UPDATE SET
       am_status=excluded.am_status, am_reason=excluded.am_reason,
       pm_status=excluded.pm_status, pm_reason=excluded.pm_reason,
       notes=excluded.notes, mis_source=excluded.mis_source`
  );
  const insertComment = db_default.prepare(
    `INSERT OR IGNORE INTO pupil_comments
     (id, school_id, pupil_id, type, category, content, date, mis_source, mis_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  );
  try {
    let rawPupils = [];
    if (provider === "bromcom") {
      const data = await misFetch(`${base}/students?schoolId=${misSchoolId}&pageSize=500`, headers);
      rawPupils = Array.isArray(data) ? data : data.data || data.students || data.value || [];
    } else {
      const data = await misFetch(`${base}/students?page=1&perPage=500`, headers);
      rawPupils = Array.isArray(data) ? data : data.data || data.students || data.results || [];
    }
    const pupilTx = db_default.transaction(() => {
      for (const s of rawPupils) {
        const name = provider === "bromcom" ? [s.preferredFirstName || s.firstName || s.forename, s.preferredLastName || s.lastName || s.surname].filter(Boolean).join(" ").trim() : [s.preferredFirstName || s.firstName, s.preferredLastName || s.lastName].filter(Boolean).join(" ").trim();
        if (!name) {
          results.pupils.skipped++;
          continue;
        }
        const yearGroup = normaliseYearGroup(s.yearGroup || s.year_group || s.yearGroupName || s.yearGroup?.name || "");
        const sendNeed = normaliseSendNeed(s.senStatus || s.sendNeed || s.sen_status || s.send_status || "");
        const upn = (s.upn || s.UPN || s.uniquePupilNumber || "").toString().trim() || null;
        const dob = (s.dateOfBirth || s.dob || "").toString().trim() || null;
        if (upn) {
          const existing = findByUpn.get(schoolId, upn);
          if (existing) {
            updatePupil.run(name, yearGroup || null, sendNeed || null, dob || null, schoolId, upn);
            results.pupils.updated++;
            continue;
          }
        } else {
          const existing = findByName.get(schoolId, name);
          if (existing) {
            results.pupils.skipped++;
            continue;
          }
        }
        const id = uuidv49();
        const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();
        try {
          insertPupil.run(id, schoolId, name, yearGroup || null, sendNeed || null, code, upn, dob, null);
          results.pupils.created++;
        } catch {
          results.pupils.skipped++;
        }
      }
    });
    pupilTx();
  } catch (err) {
    results.errors.push(`Pupils sync failed: ${err.message}`);
  }
  const allPupils = db_default.prepare(
    "SELECT id, upn, name FROM pupils WHERE school_id=? AND is_active=1"
  ).all(schoolId);
  const pupilByUpn = /* @__PURE__ */ new Map();
  const pupilByName = /* @__PURE__ */ new Map();
  for (const p of allPupils) {
    if (p.upn) pupilByUpn.set(p.upn.trim(), p.id);
    pupilByName.set(p.name.trim().toLowerCase(), p.id);
  }
  function resolvePupilId(misStudent) {
    const upn = (misStudent?.upn || misStudent?.UPN || misStudent?.uniquePupilNumber || "").toString().trim();
    if (upn && pupilByUpn.has(upn)) return pupilByUpn.get(upn);
    const name = [
      misStudent?.preferredFirstName || misStudent?.firstName || misStudent?.forename || "",
      misStudent?.preferredLastName || misStudent?.lastName || misStudent?.surname || ""
    ].filter(Boolean).join(" ").trim().toLowerCase();
    if (name && pupilByName.has(name)) return pupilByName.get(name);
    const studentId = (misStudent?.studentId || misStudent?.id || "").toString().trim();
    if (studentId) {
    }
    return null;
  }
  try {
    let rawBehaviour = [];
    if (provider === "bromcom") {
      try {
        const data = await misFetch(
          `${base}/behaviourincidents?schoolId=${misSchoolId}&pageSize=500&sortBy=date&sortOrder=desc`,
          headers
        );
        rawBehaviour = Array.isArray(data) ? data : data.data || data.incidents || data.value || [];
      } catch {
        const data = await misFetch(`${base}/behaviour?schoolId=${misSchoolId}&pageSize=500`, headers);
        rawBehaviour = Array.isArray(data) ? data : data.data || data.value || [];
      }
    } else {
      try {
        const data = await misFetch(`${base}/behaviour-incidents?page=1&perPage=500`, headers);
        rawBehaviour = Array.isArray(data) ? data : data.data || data.results || [];
      } catch {
        const data = await misFetch(`${base}/student-behaviour?page=1&perPage=500`, headers);
        rawBehaviour = Array.isArray(data) ? data : data.data || data.results || [];
      }
    }
    const BATCH = 100;
    for (let i = 0; i < rawBehaviour.length; i += BATCH) {
      const batch = rawBehaviour.slice(i, i + BATCH);
      const bTx = db_default.transaction(() => {
        for (const b of batch) {
          const student = b.student || b.pupil || b;
          const pupilId = resolvePupilId(student) || (b.pupilId ? db_default.prepare("SELECT id FROM pupils WHERE school_id=? AND id=?").get(schoolId, b.pupilId)?.id : null);
          if (!pupilId) {
            results.behaviour.skipped++;
            continue;
          }
          const misId = (b.id || b.incidentId || b.behaviourId || "").toString();
          const type = normaliseBehaviourType(b.type || b.behaviourType || b.incidentType || b.category || "");
          const category = (b.category || b.behaviourCategory || b.incidentCategory || b.type || "").toString().slice(0, 100);
          const description = (b.description || b.notes || b.comment || b.incidentDescription || "").toString().slice(0, 1e3);
          const actionTaken = (b.actionTaken || b.action || b.consequence || "").toString().slice(0, 500);
          const date = toISODate(b.date || b.incidentDate || b.behaviourDate || b.created_at);
          const points = parseInt(b.points || b.rewardPoints || b.demerits || "0") || 0;
          try {
            insertBehaviour.run(
              uuidv49(),
              schoolId,
              pupilId,
              type,
              category || null,
              description || null,
              actionTaken || null,
              date,
              points,
              provider,
              misId || null
            );
            results.behaviour.created++;
          } catch {
            results.behaviour.skipped++;
          }
        }
      });
      bTx();
    }
  } catch (err) {
    results.errors.push(`Behaviour sync failed: ${err.message}`);
  }
  try {
    let rawAttendance = [];
    if (provider === "bromcom") {
      try {
        const data = await misFetch(
          `${base}/attendance?schoolId=${misSchoolId}&pageSize=500&sortBy=date&sortOrder=desc`,
          headers
        );
        rawAttendance = Array.isArray(data) ? data : data.data || data.attendance || data.value || [];
      } catch {
        const data = await misFetch(`${base}/attendanceregisters?schoolId=${misSchoolId}&pageSize=500`, headers);
        rawAttendance = Array.isArray(data) ? data : data.data || data.value || [];
      }
    } else {
      try {
        const data = await misFetch(`${base}/attendance-marks?page=1&perPage=500`, headers);
        rawAttendance = Array.isArray(data) ? data : data.data || data.results || [];
      } catch {
        const data = await misFetch(`${base}/student-attendance?page=1&perPage=500`, headers);
        rawAttendance = Array.isArray(data) ? data : data.data || data.results || [];
      }
    }
    const BATCH = 100;
    for (let i = 0; i < rawAttendance.length; i += BATCH) {
      const batch = rawAttendance.slice(i, i + BATCH);
      const aTx = db_default.transaction(() => {
        for (const a of batch) {
          const student = a.student || a.pupil || a;
          const pupilId = resolvePupilId(student) || (a.pupilId ? db_default.prepare("SELECT id FROM pupils WHERE school_id=? AND id=?").get(schoolId, a.pupilId)?.id : null);
          if (!pupilId) {
            results.attendance.skipped++;
            continue;
          }
          const date = toISODate(a.date || a.attendanceDate || a.sessionDate || a.created_at);
          let amStatus, pmStatus, amReason, pmReason;
          if (a.amMark !== void 0 || a.amStatus !== void 0) {
            amStatus = normaliseAttendanceStatus(a.amMark || a.amStatus || a.am_mark);
            pmStatus = normaliseAttendanceStatus(a.pmMark || a.pmStatus || a.pm_mark);
            amReason = (a.amReason || a.am_reason || null)?.toString().slice(0, 200) || null;
            pmReason = (a.pmReason || a.pm_reason || null)?.toString().slice(0, 200) || null;
          } else {
            const status = normaliseAttendanceStatus(a.mark || a.code || a.attendanceMark || a.status);
            amStatus = status;
            pmStatus = status;
            amReason = (a.reason || a.absenceReason || null)?.toString().slice(0, 200) || null;
            pmReason = amReason;
          }
          const notes = (a.notes || a.comment || "").toString().slice(0, 500) || null;
          try {
            insertAttendance.run(
              uuidv49(),
              schoolId,
              pupilId,
              date,
              amStatus,
              amReason,
              pmStatus,
              pmReason,
              notes,
              provider
            );
            results.attendance.created++;
          } catch {
            results.attendance.skipped++;
          }
        }
      });
      aTx();
    }
  } catch (err) {
    results.errors.push(`Attendance sync failed: ${err.message}`);
  }
  try {
    let rawComments = [];
    if (provider === "bromcom") {
      try {
        const data = await misFetch(
          `${base}/studentnotes?schoolId=${misSchoolId}&pageSize=500`,
          headers
        );
        rawComments = Array.isArray(data) ? data : data.data || data.notes || data.value || [];
      } catch {
        const data = await misFetch(`${base}/comments?schoolId=${misSchoolId}&pageSize=500`, headers);
        rawComments = Array.isArray(data) ? data : data.data || data.value || [];
      }
    } else {
      try {
        const data = await misFetch(`${base}/student-notes?page=1&perPage=500`, headers);
        rawComments = Array.isArray(data) ? data : data.data || data.results || [];
      } catch {
        const data = await misFetch(`${base}/pastoral-notes?page=1&perPage=500`, headers);
        rawComments = Array.isArray(data) ? data : data.data || data.results || [];
      }
    }
    const BATCH = 100;
    for (let i = 0; i < rawComments.length; i += BATCH) {
      const batch = rawComments.slice(i, i + BATCH);
      const cTx = db_default.transaction(() => {
        for (const c of batch) {
          const student = c.student || c.pupil || c;
          const pupilId = resolvePupilId(student) || (c.pupilId ? db_default.prepare("SELECT id FROM pupils WHERE school_id=? AND id=?").get(schoolId, c.pupilId)?.id : null);
          if (!pupilId) {
            results.comments.skipped++;
            continue;
          }
          const misId = (c.id || c.noteId || c.commentId || "").toString();
          const type = normaliseCommentType(c.type || c.noteType || c.category || "");
          const category = (c.category || c.noteCategory || c.subject || "Pastoral").toString().slice(0, 100);
          const content = (c.content || c.note || c.text || c.description || "").toString().slice(0, 2e3);
          if (!content) {
            results.comments.skipped++;
            continue;
          }
          const date = toISODate(c.date || c.noteDate || c.created_at);
          try {
            insertComment.run(
              uuidv49(),
              schoolId,
              pupilId,
              type,
              category,
              content,
              date,
              provider,
              misId || null
            );
            results.comments.created++;
          } catch {
            results.comments.skipped++;
          }
        }
      });
      cTx();
    }
  } catch (err) {
    results.errors.push(`Comments sync failed: ${err.message}`);
  }
  auditLog(req.user.id, schoolId, `mis.${provider}_sync`, "all", "bulk", results, req.ip);
  res.json({ success: true, provider, ...results });
});
router11.get("/comments", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  const { pupilId, type, limit = "50", offset = "0" } = req.query;
  let query = `SELECT pc.*, p.name as pupil_name, p.year_group
               FROM pupil_comments pc
               JOIN pupils p ON p.id = pc.pupil_id
               WHERE pc.school_id = ?`;
  const params = [schoolId];
  if (pupilId) {
    query += " AND pc.pupil_id = ?";
    params.push(pupilId);
  }
  if (type) {
    query += " AND pc.type = ?";
    params.push(type);
  }
  query += " ORDER BY pc.date DESC, pc.created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit) || 50, parseInt(offset) || 0);
  const rows = db_default.prepare(query).all(...params);
  const total = db_default.prepare(
    `SELECT COUNT(*) as n FROM pupil_comments WHERE school_id=?${pupilId ? " AND pupil_id=?" : ""}${type ? " AND type=?" : ""}`
  ).get(...params.slice(0, params.length - 2))?.n || 0;
  res.json({ comments: rows, total });
});
router11.post("/comments", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  const { pupilId, type = "neutral", category = "Pastoral", content, date } = req.body;
  if (!pupilId || !content) return res.status(400).json({ error: "pupilId and content are required" });
  const pupil = db_default.prepare("SELECT id FROM pupils WHERE id=? AND school_id=? AND is_active=1").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const id = uuidv49();
  db_default.prepare(
    `INSERT INTO pupil_comments (id, school_id, pupil_id, recorded_by, type, category, content, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, schoolId, pupilId, req.user.id, type, category, content.slice(0, 2e3), date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  auditLog(req.user.id, schoolId, "comment.add", "pupil_comments", id, { pupilId, type }, req.ip);
  res.json({ success: true, id });
});
router11.delete("/comments/:id", requireAuth, requireAdmin, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  db_default.prepare("DELETE FROM pupil_comments WHERE id=? AND school_id=?").run(req.params.id, schoolId);
  auditLog(req.user.id, schoolId, "comment.delete", "pupil_comments", req.params.id, {}, req.ip);
  res.json({ success: true });
});
router11.post("/sync-demo", requireAuth, requireAdmin, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) return res.status(400).json({ error: "No school" });
    const results = {
      pupils: { created: 0, updated: 0, skipped: 0 },
      behaviour: { created: 0, skipped: 0 },
      attendance: { created: 0, skipped: 0 },
      comments: { created: 0, skipped: 0 },
      errors: []
    };
    const mockPupils = [
      { name: "Amelia Johnson", yearGroup: "Year 7", sendNeed: "Dyslexia", upn: "DEMO001", dob: "2012-03-14" },
      { name: "Oliver Smith", yearGroup: "Year 8", sendNeed: "ADHD", upn: "DEMO002", dob: "2011-07-22" },
      { name: "Isla Williams", yearGroup: "Year 9", sendNeed: "Autism", upn: "DEMO003", dob: "2010-11-05" },
      { name: "Noah Brown", yearGroup: "Year 7", sendNeed: "", upn: "DEMO004", dob: "2012-01-30" },
      { name: "Sophia Jones", yearGroup: "Year 10", sendNeed: "Dyslexia", upn: "DEMO005", dob: "2009-09-18" },
      { name: "Liam Davis", yearGroup: "Year 8", sendNeed: "SLCN", upn: "DEMO006", dob: "2011-04-02" },
      { name: "Emily Wilson", yearGroup: "Year 11", sendNeed: "", upn: "DEMO007", dob: "2008-06-25" },
      { name: "James Taylor", yearGroup: "Year 9", sendNeed: "MLD", upn: "DEMO008", dob: "2010-02-14" },
      { name: "Mia Anderson", yearGroup: "Year 7", sendNeed: "Dyspraxia", upn: "DEMO009", dob: "2012-08-09" },
      { name: "Benjamin Thomas", yearGroup: "Year 10", sendNeed: "ADHD", upn: "DEMO010", dob: "2009-12-03" },
      { name: "Charlotte Jackson", yearGroup: "Year 8", sendNeed: "", upn: "DEMO011", dob: "2011-05-17" },
      { name: "Ethan White", yearGroup: "Year 9", sendNeed: "Autism", upn: "DEMO012", dob: "2010-10-28" },
      { name: "Poppy Harris", yearGroup: "Year 11", sendNeed: "Dyslexia", upn: "DEMO013", dob: "2008-03-07" },
      { name: "Alexander Martin", yearGroup: "Year 7", sendNeed: "", upn: "DEMO014", dob: "2012-11-19" },
      { name: "Grace Thompson", yearGroup: "Year 10", sendNeed: "EHC Plan", upn: "DEMO015", dob: "2009-07-11" },
      { name: "Harry Garcia", yearGroup: "Year 8", sendNeed: "Dyscalculia", upn: "DEMO016", dob: "2011-09-23" },
      { name: "Lily Martinez", yearGroup: "Year 9", sendNeed: "", upn: "DEMO017", dob: "2010-04-16" },
      { name: "Oscar Robinson", yearGroup: "Year 11", sendNeed: "ADHD", upn: "DEMO018", dob: "2008-01-08" },
      { name: "Freya Clark", yearGroup: "Year 7", sendNeed: "Hearing Impairment", upn: "DEMO019", dob: "2012-06-30" },
      { name: "Jack Lewis", yearGroup: "Year 10", sendNeed: "", upn: "DEMO020", dob: "2009-02-21" }
    ];
    const findByUpn = db_default.prepare("SELECT id FROM pupils WHERE school_id=? AND upn=?");
    const insertPupil = db_default.prepare(
      `INSERT INTO pupils (id, school_id, name, year_group, send_need, code, upn, dob, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const updatePupil = db_default.prepare(
      `UPDATE pupils SET year_group=?, send_need=?, updated_at=datetime('now') WHERE school_id=? AND upn=?`
    );
    const pupilIds = {};
    const pupilTx = db_default.transaction(() => {
      for (const p of mockPupils) {
        const existing = findByUpn.get(schoolId, p.upn);
        if (existing) {
          updatePupil.run(p.yearGroup, p.sendNeed, schoolId, p.upn);
          pupilIds[p.upn] = existing.id;
          results.pupils.updated++;
        } else {
          const id = uuidv49();
          const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();
          try {
            insertPupil.run(id, schoolId, p.name, p.yearGroup, p.sendNeed, code, p.upn, p.dob, req.user.id);
            pupilIds[p.upn] = id;
            results.pupils.created++;
          } catch {
            results.pupils.skipped++;
          }
        }
      }
    });
    pupilTx();
    const insertBehaviour = db_default.prepare(
      `INSERT OR IGNORE INTO behaviour_records (id, school_id, pupil_id, recorded_by, type, category, description, action_taken, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const behaviourData = [
      { upn: "DEMO001", type: "positive", category: "Academic", description: "Excellent effort on reading comprehension task", action: "Verbal praise", date: "2026-03-01" },
      { upn: "DEMO002", type: "concern", category: "Behaviour", description: "Difficulty staying on task during independent work", action: "Seat moved, check-in scheduled", date: "2026-03-03" },
      { upn: "DEMO003", type: "positive", category: "Social", description: "Supported a classmate during group activity", action: "Positive note sent home", date: "2026-03-05" },
      { upn: "DEMO005", type: "concern", category: "Academic", description: "Struggling with written tasks despite strong verbal understanding", action: "SEND support referral made", date: "2026-03-02" },
      { upn: "DEMO008", type: "positive", category: "Academic", description: "Completed all extension work independently", action: "Certificate awarded", date: "2026-03-04" },
      { upn: "DEMO010", type: "concern", category: "Behaviour", description: "Impulsive outburst during transition time", action: "Restorative conversation, parent informed", date: "2026-03-06" },
      { upn: "DEMO012", type: "positive", category: "Wellbeing", description: "Used self-regulation strategies independently", action: "Shared with SENCO", date: "2026-03-07" },
      { upn: "DEMO015", type: "concern", category: "Attendance", description: "Third late arrival this week", action: "Parent contact made", date: "2026-03-08" }
    ];
    const behaviourTx = db_default.transaction(() => {
      for (const b of behaviourData) {
        const pupilId = pupilIds[b.upn];
        if (!pupilId) {
          results.behaviour.skipped++;
          continue;
        }
        try {
          insertBehaviour.run(uuidv49(), schoolId, pupilId, req.user.id, b.type, b.category, b.description, b.action, b.date);
          results.behaviour.created++;
        } catch {
          results.behaviour.skipped++;
        }
      }
    });
    behaviourTx();
    const insertAttendance = db_default.prepare(
      `INSERT OR IGNORE INTO attendance_records (id, school_id, pupil_id, recorded_by, date, am_status, pm_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const recentDates = ["2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"];
    const attendanceTx = db_default.transaction(() => {
      for (const [upn, pupilId] of Object.entries(pupilIds)) {
        for (const date of recentDates) {
          const absent = ["DEMO015", "DEMO018"].includes(upn) && date >= "2026-03-11";
          const late = ["DEMO002", "DEMO010"].includes(upn) && date === "2026-03-12";
          const am = absent ? "absent-unauthorised" : late ? "late" : "present";
          const pm = absent ? "absent-unauthorised" : "present";
          try {
            insertAttendance.run(uuidv49(), schoolId, pupilId, req.user.id, date, am, pm, absent ? "Unauthorised absence" : "");
            results.attendance.created++;
          } catch {
            results.attendance.skipped++;
          }
        }
      }
    });
    attendanceTx();
    const insertComment = db_default.prepare(
      `INSERT INTO pupil_comments (id, school_id, pupil_id, recorded_by, type, category, content, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const commentData = [
      { upn: "DEMO001", type: "positive", category: "Academic", content: "Amelia has made excellent progress with her reading this term. Her confidence has grown significantly.", date: "2026-03-10" },
      { upn: "DEMO002", type: "neutral", category: "Pastoral", content: "Oliver's parents contacted school regarding homework difficulties. Meeting scheduled for next week.", date: "2026-03-08" },
      { upn: "DEMO005", type: "neutral", category: "SEND", content: "Sophia's EHCP annual review is due next month. SENCO to arrange meeting with parents.", date: "2026-03-05" },
      { upn: "DEMO012", type: "positive", category: "Wellbeing", content: "Ethan has been using his sensory toolkit effectively. Staff report much calmer transitions.", date: "2026-03-11" },
      { upn: "DEMO015", type: "neutral", category: "Attendance", content: "Grace's attendance has dropped to 87% this term. Attendance officer to follow up.", date: "2026-03-12" }
    ];
    const commentTx = db_default.transaction(() => {
      for (const c of commentData) {
        const pupilId = pupilIds[c.upn];
        if (!pupilId) {
          results.comments.skipped++;
          continue;
        }
        try {
          insertComment.run(uuidv49(), schoolId, pupilId, req.user.id, c.type, c.category, c.content, c.date);
          results.comments.created++;
        } catch {
          results.comments.skipped++;
        }
      }
    });
    commentTx();
    auditLog(req.user.id, schoolId, "mis.demo_sync", "pupils", schoolId, { results }, req.ip);
    res.json({ success: true, provider: "demo", results });
  } catch (err) {
    console.error("[sync-demo] Error:", err?.message || err);
    res.status(500).json({ error: err?.message || "Demo sync failed" });
  }
});
var mis_default = router11;

// server/routes/briefing.ts
import { Router as Router12 } from "express";
import { v4 as uuidv410 } from "uuid";
import multer3 from "multer";
import fs2 from "fs";
import path2 from "path";
var router12 = Router12();
var upload2 = multer3({
  dest: "/tmp/briefing-uploads/",
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".xlsx", ".pptx"];
    const ext = path2.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("File type not allowed"));
  }
});
router12.get("/", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.json([]);
  const date = req.query.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "Invalid date format" });
  const entries = db_default.prepare(
    `SELECT id, date, type, title, content, author_id, author_name, attachments, created_at, updated_at
     FROM daily_briefings WHERE school_id = ? AND date = ?
     ORDER BY type ASC, created_at ASC`
  ).all(schoolId, date);
  const result = entries.map((e) => {
    let attachments = [];
    try {
      attachments = JSON.parse(e.attachments || "[]");
    } catch {
    }
    return {
      ...e,
      attachments: attachments.map((a, i) => ({
        idx: i,
        name: a.name,
        size: a.size,
        type: a.type,
        downloadUrl: `/api/briefing/${e.id}/attachment/${i}`
      }))
    };
  });
  res.json(result);
});
router12.get("/dates", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.json([]);
  const month = req.query.month || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: "Invalid month format" });
  const rows = db_default.prepare(
    `SELECT DISTINCT date FROM daily_briefings WHERE school_id = ? AND date LIKE ? ORDER BY date ASC`
  ).all(schoolId, `${month}-%`);
  res.json(rows.map((r) => r.date));
});
router12.get("/:id/attachment/:idx", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const entry = db_default.prepare("SELECT * FROM daily_briefings WHERE id = ? AND school_id = ?").get(req.params.id, schoolId);
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  let attachments = [];
  try {
    attachments = JSON.parse(entry.attachments || "[]");
  } catch {
  }
  const att = attachments[parseInt(req.params.idx, 10)];
  if (!att) return res.status(404).json({ error: "Attachment not found" });
  const buf = Buffer.from(att.data, "base64");
  res.setHeader("Content-Type", att.type || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(att.name)}"`);
  res.send(buf);
});
router12.post("/", requireAuth, upload2.array("files", 5), (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });
  const { date, type, title, content } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
  if (!content?.trim()) return res.status(400).json({ error: "Content is required" });
  const entryDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return res.status(400).json({ error: "Invalid date format" });
  const entryType = ["briefing", "debrief", "note"].includes(type) ? type : "note";
  const files = req.files || [];
  const attachments = files.map((f) => {
    const data = fs2.readFileSync(f.path).toString("base64");
    try {
      fs2.unlinkSync(f.path);
    } catch {
    }
    return { name: f.originalname, size: f.size, type: f.mimetype, data };
  });
  const id = uuidv410();
  db_default.prepare(
    `INSERT INTO daily_briefings (id, school_id, date, type, title, content, author_id, author_name, attachments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    schoolId,
    entryDate,
    entryType,
    title.trim(),
    content.trim(),
    req.user.id,
    req.user.displayName || req.user.email,
    JSON.stringify(attachments)
  );
  auditLog(req.user.id, schoolId, "briefing.created", "daily_briefings", id, { date: entryDate, type: entryType }, req.ip);
  res.status(201).json({
    id,
    date: entryDate,
    type: entryType,
    title: title.trim(),
    content: content.trim(),
    author_name: req.user.displayName || req.user.email,
    attachments: attachments.map((a, i) => ({
      idx: i,
      name: a.name,
      size: a.size,
      type: a.type,
      downloadUrl: `/api/briefing/${id}/attachment/${i}`
    })),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
});
router12.put("/:id", requireAuth, upload2.array("files", 5), (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  const entry = db_default.prepare("SELECT * FROM daily_briefings WHERE id = ? AND school_id = ?").get(req.params.id, schoolId);
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  const isAdmin = ["school_admin", "mat_admin"].includes(req.user.role);
  if (entry.author_id !== req.user.id && !isAdmin) return res.status(403).json({ error: "You can only edit your own entries" });
  const { title, content, type } = req.body;
  const newTitle = title?.trim() || entry.title;
  const newContent = content?.trim() || entry.content;
  const newType = ["briefing", "debrief", "note"].includes(type) ? type : entry.type;
  let existingAtts = [];
  try {
    existingAtts = JSON.parse(entry.attachments || "[]");
  } catch {
  }
  const newFiles = req.files || [];
  const newAtts = newFiles.map((f) => {
    const data = fs2.readFileSync(f.path).toString("base64");
    try {
      fs2.unlinkSync(f.path);
    } catch {
    }
    return { name: f.originalname, size: f.size, type: f.mimetype, data };
  });
  const mergedAtts = [...existingAtts, ...newAtts];
  db_default.prepare(
    `UPDATE daily_briefings SET title=?, content=?, type=?, attachments=?, updated_at=datetime('now') WHERE id=? AND school_id=?`
  ).run(newTitle, newContent, newType, JSON.stringify(mergedAtts), req.params.id, schoolId);
  auditLog(req.user.id, schoolId, "briefing.updated", "daily_briefings", req.params.id, {}, req.ip);
  res.json({ success: true });
});
router12.delete("/:id", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  const entry = db_default.prepare("SELECT * FROM daily_briefings WHERE id = ? AND school_id = ?").get(req.params.id, schoolId);
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  const isAdmin = ["school_admin", "mat_admin"].includes(req.user.role);
  if (entry.author_id !== req.user.id && !isAdmin) return res.status(403).json({ error: "You can only delete your own entries" });
  db_default.prepare("DELETE FROM daily_briefings WHERE id=? AND school_id=?").run(req.params.id, schoolId);
  auditLog(req.user.id, schoolId, "briefing.deleted", "daily_briefings", req.params.id, {}, req.ip);
  res.json({ success: true });
});
var briefing_default = router12;

// server/routes/quiz.ts
import { Router as Router13 } from "express";
import { v4 as uuidv411 } from "uuid";
import multer4 from "multer";
import fs3 from "fs";
import path3 from "path";
var router13 = Router13();
var upload3 = multer4({ dest: "/tmp/quiz-uploads/", limits: { fileSize: 20 * 1024 * 1024 } });
var rooms = {};
setInterval(() => {
  const cutoff = Date.now() - 4 * 60 * 60 * 1e3;
  for (const code of Object.keys(rooms)) {
    if (rooms[code].createdAt < cutoff) delete rooms[code];
  }
}, 30 * 60 * 1e3);
function generateCode() {
  let code;
  do {
    code = Math.floor(1e5 + Math.random() * 9e5).toString();
  } while (rooms[code]);
  return code;
}
function calcScore(room, player, correct) {
  if (!correct) return 0;
  const elapsed = player.answeredAt ? (player.answeredAt - (room.questionStartedAt || player.answeredAt)) / 1e3 : 0;
  const timeLimit = room.questions[room.currentQuestion]?.timeLimit || 20;
  const speedBonus = Math.max(0, Math.floor((1 - elapsed / timeLimit) * 500));
  const streakBonus = player.streak >= 2 ? 50 * Math.min(player.streak, 5) : 0;
  return 500 + speedBonus + streakBonus;
}
function sanitiseRoom(room) {
  return {
    code: room.code,
    quizTitle: room.quizTitle,
    phase: room.phase,
    currentQuestion: room.currentQuestion,
    totalQuestions: room.questions.length,
    questionStartedAt: room.questionStartedAt,
    currentQ: room.phase === "question" || room.phase === "reveal" ? {
      id: room.questions[room.currentQuestion]?.id,
      question: room.questions[room.currentQuestion]?.question,
      options: room.questions[room.currentQuestion]?.options,
      timeLimit: room.questions[room.currentQuestion]?.timeLimit,
      correctIndex: room.phase === "reveal" ? room.questions[room.currentQuestion]?.correctIndex : void 0
    } : null,
    players: Object.values(room.players).sort((a, b) => b.score - a.score).map((p) => ({ id: p.id, name: p.name, score: p.score, streak: p.streak, answers: p.answers })),
    playerCount: Object.keys(room.players).length
  };
}
router13.get("/custom", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const quizzes = db_default.prepare(
    `SELECT id, title, subject, topic, question_count, created_by_name, created_at
     FROM custom_quizzes WHERE school_id = ? ORDER BY created_at DESC`
  ).all(schoolId);
  res.json(quizzes);
});
router13.post("/custom", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const { title, subject, topic, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "title and questions are required" });
  }
  const id = uuidv411();
  db_default.prepare(
    `INSERT INTO custom_quizzes (id, school_id, title, subject, topic, questions, question_count, created_by, created_by_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, schoolId, title, subject || "", topic || "", JSON.stringify(questions), questions.length, req.user.id, req.user.displayName || "Teacher");
  res.json({ id });
});
router13.put("/custom/:id", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const { title, subject, topic, questions } = req.body;
  const existing = db_default.prepare("SELECT id FROM custom_quizzes WHERE id = ? AND school_id = ?").get(req.params.id, schoolId);
  if (!existing) return res.status(404).json({ error: "Not found" });
  db_default.prepare(
    `UPDATE custom_quizzes SET title=?, subject=?, topic=?, questions=?, question_count=? WHERE id=?`
  ).run(title, subject || "", topic || "", JSON.stringify(questions), questions.length, req.params.id);
  res.json({ ok: true });
});
router13.delete("/custom/:id", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  db_default.prepare("DELETE FROM custom_quizzes WHERE id = ? AND school_id = ?").run(req.params.id, schoolId);
  res.json({ ok: true });
});
router13.get("/custom/:id", requireAuth, (req, res) => {
  const schoolId = req.user.schoolId;
  const quiz = db_default.prepare("SELECT * FROM custom_quizzes WHERE id = ? AND school_id = ?").get(req.params.id, schoolId);
  if (!quiz) return res.status(404).json({ error: "Not found" });
  quiz.questions = JSON.parse(quiz.questions || "[]");
  res.json(quiz);
});
router13.post("/generate-from-doc", requireAuth, upload3.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });
  let text = "";
  try {
    const ext = path3.extname(file.originalname).toLowerCase();
    if (ext === ".txt") {
      text = fs3.readFileSync(file.path, "utf8");
    } else if (ext === ".pdf") {
      const { execSync } = await import("child_process");
      text = execSync(`pdftotext "${file.path}" -`).toString();
    } else if (ext === ".docx" || ext === ".doc") {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ path: file.path });
        text = result.value;
      } catch {
        return res.status(400).json({ error: "Could not read Word document. Please convert to PDF or TXT." });
      }
    } else {
      return res.status(400).json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to extract text from file." });
  } finally {
    try {
      fs3.unlinkSync(file.path);
    } catch {
    }
  }
  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: "Could not extract enough text from the document." });
  }
  const truncated = text.slice(0, 6e3);
  const questionCount = parseInt(req.body.questionCount || "10", 10);
  const title = req.body.title || path3.basename(req.file?.originalname || "Quiz", path3.extname(req.file?.originalname || ""));
  try {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a quiz generator. Given text content, create exactly ${questionCount} multiple-choice questions.
Return ONLY a valid JSON array with no markdown, no explanation. Each item: { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0 }
correctIndex is 0-based. Make questions clear, educational, and based ONLY on the provided text.`
        },
        { role: "user", content: `Generate ${questionCount} quiz questions from this content:

${truncated}` }
      ],
      temperature: 0.4,
      max_tokens: 3e3
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "[]";
    let questions;
    try {
      const cleaned = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
      questions = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
    }
    const valid = questions.filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctIndex === "number").map((q, i) => ({
      id: `gen-${i}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      timeLimit: 20
    }));
    if (valid.length === 0) {
      return res.status(500).json({ error: "AI could not generate valid questions from this document." });
    }
    res.json({ title, questions: valid });
  } catch (err) {
    res.status(500).json({ error: err.message || "AI generation failed" });
  }
});
router13.post("/rooms", requireAuth, (req, res) => {
  const { quizTitle, questions } = req.body;
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "questions array is required" });
  }
  const code = generateCode();
  rooms[code] = {
    code,
    hostId: req.user.id,
    schoolId: req.user.schoolId || "",
    quizTitle: quizTitle || "QuizBlast",
    questions: questions.map((q, i) => ({
      id: q.id || `q-${i}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      timeLimit: q.timeLimit || 20
    })),
    players: {},
    phase: "lobby",
    currentQuestion: 0,
    createdAt: Date.now()
  };
  res.json({ code, joinUrl: `/quiz-join/${code}` });
});
router13.get("/rooms/:code", (req, res) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found or expired" });
  res.json(sanitiseRoom(room));
});
router13.post("/rooms/:code/join", (req, res) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found. Check your code." });
  if (room.phase !== "lobby") return res.status(400).json({ error: "Game already started" });
  const { name } = req.body;
  if (!name || name.trim().length === 0) return res.status(400).json({ error: "Name is required" });
  const playerId = uuidv411();
  room.players[playerId] = {
    id: playerId,
    name: name.trim().slice(0, 30),
    score: 0,
    streak: 0,
    answers: []
  };
  res.json({ playerId, code: room.code });
});
router13.post("/rooms/:code/start", requireAuth, (req, res) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.hostId !== req.user.id) return res.status(403).json({ error: "Only the host can start the game" });
  if (room.phase !== "lobby") return res.status(400).json({ error: "Game already started" });
  room.phase = "question";
  room.currentQuestion = 0;
  room.questionStartedAt = Date.now();
  res.json(sanitiseRoom(room));
});
router13.post("/rooms/:code/answer", (req, res) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.phase !== "question") return res.status(400).json({ error: "Not in question phase" });
  const { playerId, answerIndex } = req.body;
  const player = room.players[playerId];
  if (!player) return res.status(404).json({ error: "Player not found" });
  if (player.answers.length > room.currentQuestion) {
    return res.status(400).json({ error: "Already answered" });
  }
  player.answeredAt = Date.now();
  const correct = answerIndex === room.questions[room.currentQuestion]?.correctIndex;
  player.answers.push(correct);
  if (correct) {
    player.streak += 1;
    player.score += calcScore(room, player, true);
  } else {
    player.streak = 0;
    player.answers[player.answers.length - 1] = false;
  }
  res.json({ correct, score: player.score, streak: player.streak });
});
router13.post("/rooms/:code/next", requireAuth, (req, res) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.hostId !== req.user.id) return res.status(403).json({ error: "Only the host can advance" });
  if (room.phase === "question") {
    room.phase = "reveal";
  } else if (room.phase === "reveal") {
    if (room.currentQuestion + 1 >= room.questions.length) {
      room.phase = "ended";
    } else {
      room.currentQuestion += 1;
      room.questionStartedAt = Date.now();
      room.phase = "question";
    }
  }
  res.json(sanitiseRoom(room));
});
router13.post("/rooms/:code/save-results", requireAuth, (req, res) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.hostId !== req.user.id) return res.status(403).json({ error: "Only the host can save results" });
  const { playerMappings } = req.body;
  const mappingMap = {};
  if (playerMappings) {
    for (const m of playerMappings) {
      if (m.pupilId) mappingMap[m.playerName] = m.pupilId;
    }
  }
  const saved = [];
  for (const [playerName, player] of Object.entries(room.players)) {
    const correctCount = player.answers.filter(Boolean).length;
    const totalQuestions = room.questions.length;
    const percentage = totalQuestions > 0 ? Math.round(correctCount / totalQuestions * 100) : 0;
    const badge = percentage >= 90 ? "gold" : percentage >= 70 ? "silver" : "bronze";
    const pupilId = mappingMap[playerName] || null;
    const id = uuidv411();
    try {
      db_default.prepare(`
        INSERT INTO quiz_results (id, school_id, pupil_id, pupil_name, quiz_id, quiz_title, subject, topic,
          score, max_score, percentage, correct_count, total_questions, badge, played_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id,
        room.schoolId,
        pupilId,
        playerName,
        null,
        room.quizTitle,
        null,
        null,
        player.score,
        1e3 * totalQuestions,
        percentage,
        correctCount,
        totalQuestions,
        badge
      );
      saved.push(playerName);
    } catch (e) {
      console.error("Failed to save quiz result:", e);
    }
  }
  res.json({ saved, total: Object.keys(room.players).length });
});
router13.get("/results", requireAuth, (req, res) => {
  const { pupilId, limit = 50 } = req.query;
  let results;
  if (pupilId) {
    results = db_default.prepare(
      "SELECT * FROM quiz_results WHERE pupil_id = ? ORDER BY played_at DESC LIMIT ?"
    ).all(pupilId, Number(limit));
  } else {
    results = db_default.prepare(
      "SELECT * FROM quiz_results WHERE school_id = ? ORDER BY played_at DESC LIMIT ?"
    ).all(req.user.schoolId, Number(limit));
  }
  res.json(results);
});
router13.delete("/rooms/:code", requireAuth, (req, res) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.hostId !== req.user.id) return res.status(403).json({ error: "Only the host can close the room" });
  delete rooms[req.params.code];
  res.json({ ok: true });
});
var quiz_default = router13;

// server/routes/superadmin.ts
import { Router as Router14 } from "express";
var router14 = Router14();
function requirePlatformOwner(req, res, next) {
  if (req.user?.email !== "admin@adaptly.co.uk" && req.user?.email !== "admin@sendassistant.app") {
    return res.status(403).json({ error: "Unauthorized: Super Admin access required" });
  }
  next();
}
router14.get("/users", requireAuth, requireAdmin, requirePlatformOwner, (req, res) => {
  try {
    const users = db_default.prepare(
      `SELECT 
        u.id, u.email, u.display_name, u.role, u.school_id, u.email_verified, u.created_at,
        s.name as school_name, s.subscription_plan, s.licence_type
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       ORDER BY u.created_at DESC`
    ).all();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
router14.patch("/users/:userId", requireAuth, requireAdmin, requirePlatformOwner, (req, res) => {
  try {
    const { userId } = req.params;
    const { field, value } = req.body;
    if (!["role", "subscription_plan"].includes(field)) {
      return res.status(400).json({ error: "Invalid field to update" });
    }
    if (field === "role") {
      const validRoles = ["mat_admin", "school_admin", "senco", "teacher", "ta", "staff"];
      if (!validRoles.includes(value)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      db_default.prepare("UPDATE users SET role = ? WHERE id = ?").run(value, userId);
    }
    if (field === "subscription_plan") {
      const validPlans = ["trial", "starter", "professional", "premium", "mat", "enterprise"];
      if (!validPlans.includes(value)) {
        return res.status(400).json({ error: "Invalid plan" });
      }
      const user2 = db_default.prepare("SELECT school_id FROM users WHERE id = ?").get(userId);
      if (user2?.school_id) {
        db_default.prepare("UPDATE schools SET subscription_plan = ?, subscription_status = 'active' WHERE id = ?").run(
          value,
          user2.school_id
        );
      }
    }
    const updated = db_default.prepare(
      `SELECT 
        u.id, u.email, u.display_name, u.role, u.school_id, u.email_verified, u.created_at,
        s.name as school_name, s.subscription_plan, s.licence_type
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       WHERE u.id = ?`
    ).get(userId);
    auditLog(
      req.user.id,
      user?.school_id,
      "superadmin.user_updated",
      "users",
      userId,
      { field, value },
      req.ip
    );
    res.json(updated);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});
router14.delete("/users/:userId", requireAuth, requireAdmin, requirePlatformOwner, (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    const user2 = db_default.prepare("SELECT school_id, email FROM users WHERE id = ?").get(userId);
    db_default.prepare("DELETE FROM users WHERE id = ?").run(userId);
    auditLog(
      req.user.id,
      user2?.school_id,
      "superadmin.user_deleted",
      "users",
      userId,
      { email: user2?.email },
      req.ip
    );
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});
router14.get("/stats", requireAuth, requireAdmin, requirePlatformOwner, (req, res) => {
  try {
    const totalUsers = db_default.prepare("SELECT COUNT(*) as c FROM users").get().c;
    const totalSchools = db_default.prepare("SELECT COUNT(*) as c FROM schools").get().c;
    const premiumSchools = db_default.prepare(
      "SELECT COUNT(*) as c FROM schools WHERE subscription_plan IN ('premium', 'mat', 'enterprise')"
    ).get().c;
    const totalPupils = db_default.prepare("SELECT COUNT(*) as c FROM pupils WHERE is_active = 1").get().c;
    res.json({
      totalUsers,
      totalSchools,
      premiumSchools,
      totalPupils,
      trialSchools: totalSchools - premiumSchools
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});
var superadmin_default = router14;

// server/routes/diagram-proxy.ts
import { Router as Router15 } from "express";
var router15 = Router15();
var imageCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
var MAX_CACHE_SIZE = 200;
function pruneCache() {
  if (imageCache.size <= MAX_CACHE_SIZE) return;
  const entries = [...imageCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt);
  const toRemove = entries.slice(0, imageCache.size - MAX_CACHE_SIZE);
  for (const [key] of toRemove) imageCache.delete(key);
}
var ALLOWED_DOMAINS = [
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "openstax.org",
  "cdn.kastatic.org",
  "khanacademy.org",
  "bbc.co.uk",
  "s3-us-west-2.amazonaws.com"
];
function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some((domain) => parsed.hostname.endsWith(domain));
  } catch {
    return false;
  }
}
router15.get("/", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }
  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    return res.status(400).json({ error: "Invalid url encoding" });
  }
  if (!isAllowedUrl(decodedUrl)) {
    return res.status(403).json({ error: "URL not from an allowed domain" });
  }
  const cached = imageCache.get(decodedUrl);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("X-Cache", "HIT");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(cached.buffer);
  }
  try {
    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "Adaptly-Educational-Platform/1.0 (https://adaptly.co.uk; educational use)",
        "Accept": "image/webp,image/png,image/svg+xml,image/*,*/*",
        "Referer": "https://adaptly.co.uk"
      },
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) {
      console.warn(`[diagram-proxy] Upstream ${response.status} for ${decodedUrl}`);
      return res.status(response.status).set("X-Diagram-Error", `upstream-${response.status}`).json({ error: `Upstream returned ${response.status}` });
    }
    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    imageCache.set(decodedUrl, { buffer, contentType, cachedAt: Date.now() });
    pruneCache();
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Cache", "MISS");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(buffer);
  } catch (err) {
    console.error("[diagram-proxy] Error fetching image:", err?.message);
    return res.status(502).json({ error: "Failed to fetch image" });
  }
});
var diagram_proxy_default = router15;

// server/routes/feedback.ts
init_email();
import { Router as Router16 } from "express";
var router16 = Router16();
router16.post("/", async (req, res) => {
  try {
    const { name = "", email = "", type = "other", message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return res.status(400).json({ error: "Message is required" });
    }
    await sendFeedbackEmail({
      name: String(name).slice(0, 100),
      email: String(email).slice(0, 200),
      type: String(type).slice(0, 50),
      message: String(message).slice(0, 5e3)
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[feedback] Failed:", err);
    return res.json({ ok: true });
  }
});
var feedback_default = router16;

// server/routes/parentMessages.ts
import { Router as Router17 } from "express";
import { v4 as uuidv412 } from "uuid";

// server/lib/notifications.ts
import { WebSocketServer, WebSocket } from "ws";
import jwt3 from "jsonwebtoken";
var connections = /* @__PURE__ */ new Map();
function initWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/api/ws" });
  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token");
    if (!token) {
      ws.close(4001, "Unauthorised: no token");
      return;
    }
    let userId;
    try {
      const payload = jwt3.verify(token, JWT_SECRET);
      userId = payload.userId || payload.sub || payload.id;
      if (!userId) throw new Error("No userId in token");
    } catch {
      ws.close(4001, "Unauthorised: invalid token");
      return;
    }
    if (!connections.has(userId)) {
      connections.set(userId, /* @__PURE__ */ new Set());
    }
    connections.get(userId).add(ws);
    const unread = getUnreadNotifications(userId);
    ws.send(JSON.stringify({ type: "init", notifications: unread }));
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "mark_read" && msg.id) {
          markNotificationRead(userId, msg.id);
        } else if (msg.type === "mark_all_read") {
          markAllNotificationsRead(userId);
        } else if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
      }
    });
    ws.on("close", () => {
      connections.get(userId)?.delete(ws);
      if (connections.get(userId)?.size === 0) {
        connections.delete(userId);
      }
    });
    ws.on("error", () => {
      connections.get(userId)?.delete(ws);
    });
  });
  console.log("\u{1F514} WebSocket notification server initialised at /api/ws");
  return wss;
}
function pushNotification(userId, notification) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const full = {
    ...notification,
    id,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    read: false
  };
  try {
    db_default.prepare(`
      INSERT OR IGNORE INTO notifications (id, user_id, type, title, body, link, metadata, created_at, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      full.id,
      userId,
      full.type,
      full.title,
      full.body,
      full.link || null,
      full.metadata ? JSON.stringify(full.metadata) : null,
      full.createdAt
    );
  } catch {
  }
  const userConnections = connections.get(userId);
  if (userConnections && userConnections.size > 0) {
    const payload = JSON.stringify({ type: "notification", notification: full });
    for (const ws of userConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}
function getUnreadNotifications(userId) {
  try {
    const rows = db_default.prepare(`
      SELECT * FROM notifications WHERE user_id = ? AND read = 0
      ORDER BY created_at DESC LIMIT 50
    `).all(userId);
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      link: r.link,
      createdAt: r.created_at,
      read: r.read === 1,
      metadata: r.metadata ? JSON.parse(r.metadata) : void 0
    }));
  } catch {
    return [];
  }
}
function markNotificationRead(userId, notificationId) {
  try {
    db_default.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(notificationId, userId);
  } catch {
  }
}
function markAllNotificationsRead(userId) {
  try {
    db_default.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId);
  } catch {
  }
}

// server/routes/parentMessages.ts
var router17 = Router17();
router17.get("/:pupilId", requireAuth, (req, res) => {
  const user2 = req.user;
  const { pupilId } = req.params;
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id = ?").get(pupilId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const isTeacher = pupil.school_id === user2.schoolId;
  const isParent = pupil.parent_access_code && req.headers["x-parent-code"] === pupil.parent_access_code;
  if (!isTeacher && !isParent) {
    return res.status(403).json({ error: "Access denied" });
  }
  const messages = db_default.prepare(`
    SELECT * FROM parent_messages
    WHERE pupil_id = ?
    ORDER BY created_at ASC
  `).all(pupilId);
  res.json(messages.map((m) => ({
    id: m.id,
    pupilId: m.pupil_id,
    senderType: m.sender_type,
    senderName: m.sender_name,
    body: m.body,
    createdAt: m.created_at,
    read: m.read === 1
  })));
});
router17.post("/:pupilId", requireAuth, (req, res) => {
  const user2 = req.user;
  const { pupilId } = req.params;
  const { body, senderType } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: "Message body is required" });
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id = ?").get(pupilId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const isTeacher = pupil.school_id === user2.schoolId;
  const isParent = pupil.parent_access_code && req.headers["x-parent-code"] === pupil.parent_access_code;
  if (!isTeacher && !isParent) {
    return res.status(403).json({ error: "Access denied" });
  }
  const actualSenderType = isTeacher ? "teacher" : "parent";
  const senderName = isTeacher ? user2.displayName || "Teacher" : "Parent/Carer";
  const id = uuidv412();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db_default.prepare(`
    INSERT INTO parent_messages (id, pupil_id, sender_type, sender_name, body, created_at, read)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, pupilId, actualSenderType, senderName, body.trim(), now);
  const message = {
    id,
    pupilId,
    senderType: actualSenderType,
    senderName,
    body: body.trim(),
    createdAt: now,
    read: false
  };
  if (actualSenderType === "parent") {
    const teacher = db_default.prepare("SELECT id FROM users WHERE school_id = ? AND role IN ('teacher', 'senco', 'school_admin') LIMIT 1").get(pupil.school_id);
    if (teacher) {
      pushNotification(teacher.id, {
        type: "message",
        title: `New message from ${senderName}`,
        body: `Re: ${pupil.name} \u2014 ${body.trim().slice(0, 80)}${body.trim().length > 80 ? "\u2026" : ""}`,
        link: `/pupils/${pupilId}?tab=messages`,
        metadata: { pupilId, messageId: id }
      });
    }
  } else {
  }
  res.status(201).json(message);
});
router17.patch("/:pupilId/:messageId/read", requireAuth, (req, res) => {
  const user2 = req.user;
  const { pupilId, messageId } = req.params;
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id = ?").get(pupilId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const isTeacher = pupil.school_id === user2.schoolId;
  const isParent = pupil.parent_access_code && req.headers["x-parent-code"] === pupil.parent_access_code;
  if (!isTeacher && !isParent) {
    return res.status(403).json({ error: "Access denied" });
  }
  db_default.prepare("UPDATE parent_messages SET read = 1 WHERE id = ? AND pupil_id = ?").run(messageId, pupilId);
  res.json({ success: true });
});
router17.get("/:pupilId/unread-count", (req, res) => {
  const { pupilId } = req.params;
  const parentCode = req.headers["x-parent-code"];
  const pupil = db_default.prepare("SELECT * FROM pupils WHERE id = ?").get(pupilId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  if (pupil.parent_access_code && parentCode !== pupil.parent_access_code) {
    return res.status(403).json({ error: "Access denied" });
  }
  const result = db_default.prepare(`
    SELECT COUNT(*) as count FROM parent_messages
    WHERE pupil_id = ? AND sender_type = 'teacher' AND read = 0
  `).get(pupilId);
  res.json({ count: result.count });
});
router17.get("/", requireAuth, (req, res) => {
  const user2 = req.user;
  const notifications = db_default.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(user2.id);
  res.json(notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    createdAt: n.created_at,
    read: n.read === 1,
    metadata: n.metadata ? JSON.parse(n.metadata) : void 0
  })));
});
router17.patch("/notifications/:id/read", requireAuth, (req, res) => {
  const user2 = req.user;
  const { id } = req.params;
  db_default.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(id, user2.id);
  res.json({ success: true });
});
router17.patch("/notifications/read-all", requireAuth, (req, res) => {
  const user2 = req.user;
  db_default.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(user2.id);
  res.json({ success: true });
});
var parentMessages_default = router17;

// server/index.ts
import http from "http";
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = webcrypto;
}
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(init) {
      if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        this.m11 = this.a;
        this.m12 = this.b;
        this.m21 = this.c;
        this.m22 = this.d;
        this.m41 = this.e;
        this.m42 = this.f;
        this.isIdentity = this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
      }
    }
    multiply(_o) {
      return new globalThis.DOMMatrix();
    }
    translate(tx = 0, ty = 0) {
      return new globalThis.DOMMatrix([this.a, this.b, this.c, this.d, this.e + tx, this.f + ty]);
    }
    scale(sx = 1, sy) {
      return new globalThis.DOMMatrix([this.a * sx, this.b, this.c, this.d * (sy ?? sx), this.e, this.f]);
    }
    inverse() {
      return new globalThis.DOMMatrix();
    }
    transformPoint(p) {
      return { x: p.x * this.a + p.y * this.c + this.e, y: p.x * this.b + p.y * this.d + this.f, z: 0, w: 1 };
    }
    toJSON() {
      return { a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f };
    }
  };
}
if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = class ImageData {
    data;
    width;
    height;
    colorSpace = "srgb";
    constructor(dataOrWidth, width, height) {
      if (typeof dataOrWidth === "number") {
        this.width = dataOrWidth;
        this.height = width;
        this.data = new Uint8ClampedArray(dataOrWidth * width * 4);
      } else {
        this.data = dataOrWidth;
        this.width = width;
        this.height = height ?? dataOrWidth.length / (width * 4);
      }
    }
  };
}
if (typeof globalThis.Path2D === "undefined") {
  globalThis.Path2D = class Path2D {
    constructor(_p) {
    }
    addPath(_p, _t) {
    }
    closePath() {
    }
    moveTo(_x, _y) {
    }
    lineTo(_x, _y) {
    }
    bezierCurveTo(_a, _b, _c, _d, _e, _f) {
    }
    quadraticCurveTo(_a, _b, _c, _d) {
    }
    arc(_x, _y, _r, _s, _e, _ac) {
    }
    arcTo(_a, _b, _c, _d, _r) {
    }
    ellipse(_x, _y, _rx, _ry, _rot, _s, _e, _ac) {
    }
    rect(_x, _y, _w, _h) {
    }
  };
}
var __dirname2 = path4.dirname(fileURLToPath2(import.meta.url));
var app = express();
var PORT = parseInt(process.env.PORT || "3001");
var isDev2 = process.env.NODE_ENV !== "production";
app.set("trust proxy", 1);
app.use((req, res, next) => {
  const host = req.headers.host || "";
  if (host.startsWith("www.")) {
    const proto = req.headers["x-forwarded-proto"] || "https";
    return res.redirect(301, `${proto}://${host.slice(4)}${req.originalUrl}`);
  }
  next();
});
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://api.groq.com",
        "https://generativelanguage.googleapis.com",
        "https://api.openai.com",
        "https://openrouter.ai",
        "https://api.anthropic.com",
        "https://router.huggingface.co",
        "https://accounts.google.com"
      ],
      frameSrc: ["accounts.google.com"],
      // Allow blob: URLs for neural voice audio playback
      mediaSrc: ["'self'", "blob:"],
      // Allow blob: URLs for Web Workers (audio processing)
      workerSrc: ["'self'", "blob:"],
      // GDPR: prevent embedding in iframes from other origins
      frameAncestors: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  // Enforce HTTPS for 1 year (HSTS)
  hsts: {
    maxAge: 31536e3,
    includeSubDomains: true,
    preload: true
  },
  // Prevent MIME sniffing
  noSniff: true,
  // Prevent clickjacking
  frameguard: { action: "sameorigin" },
  // Disable X-Powered-By
  hidePoweredBy: true,
  // Referrer policy — don't leak URL to third parties
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // Permissions policy — restrict dangerous browser APIs
  permittedCrossDomainPolicies: { permittedPolicies: "none" }
}));
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  if (_req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
  }
  next();
});
app.use(compression({
  level: 6,
  // balanced speed vs compression ratio
  threshold: 1024,
  // only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  }
}));
var allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.some((o) => origin.startsWith(o.trim()))) {
      return cb(null, true);
    }
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining"]
}));
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 10,
  // 10 failed attempts per IP per 15 min — combined with per-account lockout in auth.ts
  message: { error: "Too many login attempts from this IP. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skipSuccessfulRequests: true
  // only count failed attempts
});
var aiLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: 60,
  // increased from 30 to reduce false positives during normal use
  message: { error: "Too many AI requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});
var generalLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});
setInterval(() => {
  try {
    const deletedSessions = db_default.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
    const deletedResets = db_default.prepare("DELETE FROM password_resets WHERE expires_at < datetime('now') OR used = 1").run();
    if (deletedSessions.changes > 0 || deletedResets.changes > 0) {
      console.log(`[Cleanup] Removed ${deletedSessions.changes} expired sessions, ${deletedResets.changes} used/expired password resets`);
    }
  } catch (e) {
    console.error("[Cleanup] Session cleanup error:", e);
  }
}, 60 * 60 * 1e3);
app.use("/api/billing/webhook", express.raw({ type: "application/json" }), (req, _res, next) => {
  req.rawBody = req.body;
  next();
});
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(generalLimiter);
function sanitiseString(val) {
  return val.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "").trim();
}
function sanitiseBody(obj) {
  if (typeof obj === "string") return sanitiseString(obj);
  if (Array.isArray(obj)) return obj.map(sanitiseBody);
  if (obj && typeof obj === "object") {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[k] = sanitiseBody(v);
    }
    return clean;
  }
  return obj;
}
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitiseBody(req.body);
  }
  next();
});
var forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 3,
  message: { error: "Too many password reset requests. Please try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});
app.use("/api/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/auth", authLimiter, auth_default);
app.use("/api/schools", schools_default);
app.use("/api/pupils", pupils_default);
app.use("/api/ai", aiLimiter, ai_default);
app.use("/api/data", data_default);
app.use("/api/admin", admin_default);
app.use("/api/gdpr", gdpr_default);
app.use("/api/revision", aiLimiter, revision_default);
app.use("/api/school-keys", schoolApiKeys_default);
app.use("/api/billing", billing_default);
app.use("/api/mis", mis_default);
app.use("/api/briefing", briefing_default);
app.use("/api/quiz", quiz_default);
app.use("/api/admin", superadmin_default);
app.use("/api/diagram-proxy", diagram_proxy_default);
app.use("/api/feedback", feedback_default);
app.use("/api/messages", parentMessages_default);
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString(), version: "2.2.0-Billing" });
});
var distPath = path4.join(__dirname2, "..");
var indexHtml = path4.join(distPath, "index.html");
if (!isDev2 && fs4.existsSync(indexHtml)) {
  console.log(`\u{1F4C1} Serving static frontend from: ${distPath}`);
  app.use(express.static(distPath, {
    // Security: set cache headers for static assets
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    }
  }));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(indexHtml);
    }
  });
} else {
  console.warn(`\u26A0\uFE0F  Frontend not found at ${distPath} (isDev=${isDev2})`);
}
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (isDev2) {
    console.error("Unhandled error:", err);
    res.status(status).json({ error: err.message, stack: err.stack });
  } else {
    console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.path} \u2014 ${err.message}`);
    res.status(status).json({ error: status < 500 ? err.message : "An unexpected error occurred." });
  }
});
initDb().then(() => {
  const httpServer = http.createServer(app);
  initWebSocketServer(httpServer);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Adaptly API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  });
  httpServer.timeout = 15e4;
  httpServer.keepAliveTimeout = 155e3;
  httpServer.headersTimeout = 16e4;
}).catch((err) => {
  console.error("Failed to initialise database:", err);
  process.exit(1);
});
var index_default = app;
export {
  index_default as default
};
