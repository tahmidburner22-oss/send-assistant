import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";

const isDev = process.env.NODE_ENV !== "production";

// Lazy-initialise Resend so a missing key does not crash the server on startup.
// The key is only required in production when an email is actually sent.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set. Add it to Railway environment variables.");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "Adaptly <noreply@send.adaptly.co.uk>";
const BASE_URL = process.env.APP_URL || "http://localhost:5173";

// ── Observability ────────────────────────────────────────────────────────────
export interface EmailAttempt {
  id: string;
  at: string;
  to: string;
  subject: string;
  template?: string;
  status: "sent" | "skipped_dev" | "failed" | "misconfigured";
  error?: string;
  durationMs?: number;
}
const RECENT_ATTEMPTS: EmailAttempt[] = [];
const MAX_RECENT = 50;

function recordAttempt(a: EmailAttempt) {
  RECENT_ATTEMPTS.unshift(a);
  if (RECENT_ATTEMPTS.length > MAX_RECENT) RECENT_ATTEMPTS.pop();
  // Best-effort persist to audit_logs (silently ignore failures)
  db.prepare(
    `INSERT INTO audit_logs (id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)`
  ).run(
    uuidv4(),
    "email.send",
    "email",
    a.id,
    JSON.stringify({ to: a.to, subject: a.subject, template: a.template, status: a.status, error: a.error, durationMs: a.durationMs })
  ).catch(() => { /* swallow — email logging must never crash the request */ });
}

/** Returns the last N email attempts (admin-only — called by /api/admin/email/health). */
export function getRecentEmailAttempts(): EmailAttempt[] {
  return RECENT_ATTEMPTS.slice();
}

/** Boot-time env check — call from server/index.ts at start-up. */
export function checkEmailConfigOnBoot() {
  const issues: string[] = [];
  if (!process.env.RESEND_API_KEY) {
    issues.push("RESEND_API_KEY is not set");
  }
  if (!process.env.EMAIL_FROM) {
    issues.push("EMAIL_FROM is not set — using default 'Adaptly <noreply@send.adaptly.co.uk>'. This domain must be verified in Resend, otherwise sends will silently fail.");
  }
  if (!process.env.APP_URL) {
    issues.push("APP_URL is not set — email links will point to http://localhost:5173");
  }
  if (issues.length === 0) {
    console.log("✉️  Email config OK (RESEND_API_KEY set, EMAIL_FROM=" + FROM + ", APP_URL=" + BASE_URL + ")");
    return;
  }
  if (isDev) {
    console.log("✉️  Email in DEV mode — sends will be logged to console, not delivered. Config notes:");
  } else {
    console.warn("⚠️  [email] Production email configuration issues:");
  }
  for (const msg of issues) console.warn("    - " + msg);
}

async function send(to: string, subject: string, html: string, template?: string) {
  const id = uuidv4();
  const startedAt = Date.now();

  if (!to || !to.includes("@")) {
    const attempt: EmailAttempt = { id, at: new Date().toISOString(), to: to || "", subject, template, status: "failed", error: "Invalid recipient address", durationMs: 0 };
    recordAttempt(attempt);
    console.error(`[email] Skipped — invalid recipient: ${to}`);
    return;
  }

  if (isDev) {
    const attempt: EmailAttempt = { id, at: new Date().toISOString(), to, subject, template, status: "skipped_dev", durationMs: 0 };
    recordAttempt(attempt);
    console.log(`📧 [DEV EMAIL] id=${id.slice(0, 8)} to=${to} subject="${subject}" template=${template || "-"} (dev mode, not sent)`);
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    const attempt: EmailAttempt = { id, at: new Date().toISOString(), to, subject, template, status: "misconfigured", error: "RESEND_API_KEY not set", durationMs: 0 };
    recordAttempt(attempt);
    console.error(`[email] Cannot send — RESEND_API_KEY missing. to=${to} subject="${subject}"`);
    return;
  }

  try {
    const { error } = await getResend().emails.send({ from: FROM, to, subject, html });
    const durationMs = Date.now() - startedAt;
    if (error) {
      const attempt: EmailAttempt = { id, at: new Date().toISOString(), to, subject, template, status: "failed", error: String((error as any)?.message || error), durationMs };
      recordAttempt(attempt);
      console.error(`[email] Resend error for id=${id.slice(0, 8)} to=${to}:`, error);
      return;
    }
    const attempt: EmailAttempt = { id, at: new Date().toISOString(), to, subject, template, status: "sent", durationMs };
    recordAttempt(attempt);
    console.log(`[email] Sent id=${id.slice(0, 8)} to=${to} subject="${subject}" (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - startedAt;
    const attempt: EmailAttempt = { id, at: new Date().toISOString(), to, subject, template, status: "failed", error: err?.message || String(err), durationMs };
    recordAttempt(attempt);
    console.error(`[email] Failed to send id=${id.slice(0, 8)} to=${to}:`, err);
  }
}

export async function sendPasswordReset(to: string, token: string) {
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
      <p style="color:#999;font-size:12px">Adaptly · AI-powered tools for UK SEND educators</p>
    </div>`
  );
}

export async function sendEmailVerification(to: string, token: string) {
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

export async function sendDSLIncidentAlert(dslEmail: string, incident: {
  id: string; severity: string; description: string; reportedBy: string; pupilName?: string;
}) {
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

export async function sendWelcomeEmail(to: string, displayName: string, schoolName: string) {
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

export async function sendDirectParentMessage(
  parentEmail: string,
  data: { parentName: string; pupilName: string; teacherName: string; schoolName: string; subject: string; message: string }
) {
  await send(
    parentEmail,
    `Message from ${data.teacherName} — ${data.schoolName}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6366f1">Adaptly — Message from School</h2>
      <p>Dear ${data.parentName},</p>
      <p>You have received a message from <strong>${data.teacherName}</strong> at <strong>${data.schoolName}</strong> regarding <strong>${data.pupilName}</strong>.</p>
      <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:16px;border-radius:0 8px 8px 0;margin:16px 0">
        <p style="font-weight:bold;margin:0 0 8px 0;color:#374151">${data.subject}</p>
        <p style="margin:0;color:#374151;white-space:pre-wrap">${data.message}</p>
      </div>
      <p style="color:#666;font-size:14px">You can view your child's full progress and history in the <a href="${BASE_URL}/parent-portal" style="color:#6366f1">Parent Portal</a>.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Adaptly · ${data.schoolName} · This email was sent by a teacher via the Adaptly platform.</p>
    </div>`
  );
}

export async function sendBehaviourAlert(
  parentEmail: string,
  data: { pupilName: string; type: string; category?: string; description?: string; actionTaken?: string; date: string; teacherName: string; schoolName: string }
) {
  const isPositive = data.type === "positive";
  const colour = isPositive ? "#059669" : "#d97706";
  const heading = isPositive ? "Positive Behaviour Update" : "Behaviour Update";
  const intro = isPositive
    ? `We are pleased to share a positive behaviour update for <strong>${data.pupilName}</strong>.`
    : `We wanted to keep you informed about a behaviour note recorded for <strong>${data.pupilName}</strong>.`;
  await send(
    parentEmail,
    `${heading} — ${data.pupilName} | ${data.schoolName}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:${colour}">Adaptly — ${heading}</h2>
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
      <p style="color:#999;font-size:12px">Adaptly · ${data.schoolName} · This email was sent because a behaviour record was logged for your child.</p>
    </div>`
  );
}

export async function sendFeedbackEmail(data: {
  name: string;
  email: string;
  type: string;
  message: string;
}) {
  const FEEDBACK_TO = process.env.FEEDBACK_EMAIL || "hello@adaptly.co.uk";
  await send(
    FEEDBACK_TO,
    `Adaptly Feedback: ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}${data.name ? ` from ${data.name}` : ""}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#6366f1">Adaptly — User Feedback</h2>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;font-weight:bold;background:#f9fafb;width:100px">Type</td><td style="padding:8px;background:#f9fafb">${data.type}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${data.name || "Anonymous"}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f9fafb">Email</td><td style="padding:8px;background:#f9fafb">${data.email || "Not provided"}</td></tr>
      </table>
      <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:16px;border-radius:0 8px 8px 0;margin:16px 0">
        <p style="margin:0;color:#374151;white-space:pre-wrap">${data.message}</p>
      </div>
      <p style="color:#999;font-size:12px">Adaptly · User feedback submitted via the app</p>
    </div>`
  );
}

export async function sendPresentationEmail(
  to: string,
  data: {
    title: string;
    subject: string;
    yearGroup: string;
    slides: Array<{ type: string; title: string; bullets?: string[]; body?: string; question?: string; speakerNotes?: string }>;
    message: string;
    format: string;
    senderName: string;
  }
) {
  const formatNote = data.format === "pptx"
    ? `<p style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:13px;color:#1d4ed8;margin:16px 0">
        <strong>PowerPoint format requested.</strong> Open the Adaptly app to download the .pptx file directly from the Presentation Maker.
       </p>`
    : "";

  const slidesHtml = data.slides.slice(0, 20).map((slide, i) => {
    const bullets = (slide.bullets || []).slice(0, 5).map(b => `<li style="margin:2px 0;color:#374151">${b}</li>`).join("");
    const body = slide.body ? `<p style="font-size:12px;color:#6b7280;margin:4px 0">${slide.body}</p>` : "";
    const question = slide.question ? `<p style="font-size:12px;font-weight:bold;color:#1d4ed8;margin:4px 0">❓ ${slide.question}</p>` : "";
    return `<tr>
      <td style="padding:4px 8px;color:#6b7280;font-size:11px;vertical-align:top;white-space:nowrap">${i + 1}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9">
        <div style="font-weight:bold;font-size:13px;color:#1e293b;margin-bottom:4px">${slide.title}</div>
        ${question}${body}
        ${bullets ? `<ul style="margin:4px 0;padding-left:16px;font-size:12px">${bullets}</ul>` : ""}
      </td>
    </tr>`;
  }).join("");

  await send(
    to,
    `📊 Lesson Presentation: ${data.title}`,
    `<div style="font-family:sans-serif;max-width:640px;margin:auto">
      <div style="background:#1B2A4A;color:white;padding:24px;border-radius:12px 12px 0 0">
        <div style="font-size:11px;letter-spacing:2px;opacity:0.7;text-transform:uppercase;margin-bottom:8px">Lesson Presentation</div>
        <h1 style="margin:0 0 8px 0;font-size:22px">${data.title}</h1>
        <div style="font-size:13px;opacity:0.8">${data.subject} · ${data.yearGroup}</div>
      </div>
      <div style="padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none">
        ${data.message ? `<div style="background:white;border-left:4px solid #2563eb;padding:12px;border-radius:0 8px 8px 0;margin-bottom:16px;font-size:13px;color:#374151">${data.message}</div>` : ""}
        ${formatNote}
        <p style="font-size:13px;color:#6b7280;margin-bottom:12px">Shared by <strong>${data.senderName}</strong> via Adaptly · ${data.slides.length} slides</p>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0">
          ${slidesHtml}
        </table>
        ${data.slides.length > 20 ? `<p style="font-size:11px;color:#9ca3af;margin-top:8px">…and ${data.slides.length - 20} more slides. Open Adaptly to view the full presentation.</p>` : ""}
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center">
          <a href="${BASE_URL}/tools/presentation-maker" style="display:inline-block;background:#1B2A4A;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px">Open in Adaptly</a>
        </div>
      </div>
      <p style="font-size:11px;color:#9ca3af;text-align:center;padding:12px">Adaptly · adaptly.co.uk · AI-powered tools for UK SEND educators</p>
    </div>`
  );
}

