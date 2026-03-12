import { Resend } from "resend";

const isDev = process.env.NODE_ENV !== "production";
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "Adaptly <noreply@send.adaptly.co.uk>";
const BASE_URL = process.env.APP_URL || "http://localhost:5173";

async function send(to: string, subject: string, html: string) {
  if (isDev) {
    console.log(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[email] Resend error:", error);
  } catch (err) {
    console.error("[email] Failed to send email:", err);
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
