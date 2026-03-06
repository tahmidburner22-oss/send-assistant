import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV !== "production";

// In production, configure SMTP via env vars. In dev, log to console.
const transporter = isDev
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

const FROM = process.env.EMAIL_FROM || "SEND Assistant <noreply@sendassistant.app>";
const BASE_URL = process.env.APP_URL || "http://localhost:5173";

async function send(to: string, subject: string, html: string) {
  const info = await transporter.sendMail({ from: FROM, to, subject, html });
  if (isDev) {
    console.log(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
    console.log((info as any).message);
  }
}

export async function sendPasswordReset(to: string, token: string) {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  await send(
    to,
    "Reset your SEND Assistant password",
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#059669">SEND Assistant</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${link}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
      <p style="color:#666;font-size:14px">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">SEND Assistant · AI-powered tools for UK SEND educators</p>
    </div>`
  );
}

export async function sendEmailVerification(to: string, token: string) {
  const link = `${BASE_URL}/verify-email?token=${token}`;
  await send(
    to,
    "Verify your SEND Assistant email",
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#059669">Welcome to SEND Assistant</h2>
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
      <p>A safeguarding concern has been flagged in SEND Assistant and requires your attention.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold;background:#f9fafb">Severity</td><td style="padding:8px;background:#f9fafb">${incident.severity}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Reported by</td><td style="padding:8px">${incident.reportedBy}</td></tr>
        ${incident.pupilName ? `<tr><td style="padding:8px;font-weight:bold;background:#f9fafb">Pupil</td><td style="padding:8px;background:#f9fafb">${incident.pupilName}</td></tr>` : ""}
        <tr><td style="padding:8px;font-weight:bold">Description</td><td style="padding:8px">${incident.description}</td></tr>
      </table>
      <p style="margin-top:16px">Please log in to SEND Assistant to review and action this incident.</p>
      <a href="${BASE_URL}/safeguarding" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">View Incident</a>
      <p style="color:#999;font-size:12px">Incident ID: ${incident.id}</p>
    </div>`
  );
}

export async function sendWelcomeEmail(to: string, displayName: string, schoolName: string) {
  await send(
    to,
    "Welcome to SEND Assistant",
    `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#059669">Welcome, ${displayName}!</h2>
      <p>Your account has been created for <strong>${schoolName}</strong> on SEND Assistant.</p>
      <p>SEND Assistant provides AI-powered differentiation tools to help you support pupils with Special Educational Needs and Disabilities.</p>
      <a href="${BASE_URL}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Get Started</a>
    </div>`
  );
}
