import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import db, { initDb } from "../db/index.js";
import authRouter from "../routes/auth.js";
import pupilsRouter from "../routes/pupils.js";
import { requireAuth } from "../middleware/auth.js";

function buildApp() {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/pupils", requireAuth, pupilsRouter);
  return app;
}

async function login(app: express.Express, email: string, password: string, schoolId: string) {
  await request(app).post("/api/auth/register").send({ email, password, displayName: "Support Profile Teacher", role: "teacher" });
  await db.prepare("UPDATE users SET email_verified = 1, school_id = ? WHERE email = ?").run(schoolId, email);
  const response = await request(app).post("/api/auth/login").send({ email, password });
  return (response.headers["set-cookie"] as string[] | undefined)?.[0]?.split(";")[0] || "";
}

describe("learner-support profile persistence", () => {
  const app = buildApp();
  const schoolId = `support-profile-school-${uuidv4()}`;
  const pupilId = uuidv4();
  const email = `support-profile-${uuidv4()}@example.com`;
  const password = "TestPassword123!";
  let cookie = "";

  beforeAll(async () => {
    await initDb();
    await db.prepare("INSERT INTO schools (id, name) VALUES (?, ?)").run(schoolId, "Support Profile Test School");
    await db.prepare("INSERT INTO pupils (id, school_id, name, year_group, is_active) VALUES (?, ?, ?, ?, 1)").run(pupilId, schoolId, "S.P.", "Year 8");
    cookie = await login(app, email, password, schoolId);
  });

  afterAll(async () => {
    await db.prepare("DELETE FROM pupil_audit WHERE pupil_id = ?").run(pupilId);
    await db.prepare("DELETE FROM pupils WHERE id = ?").run(pupilId);
    await db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)").run(email);
    await db.prepare("DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email = ?)").run(email);
    await db.prepare("DELETE FROM users WHERE email = ?").run(email);
    await db.prepare("DELETE FROM schools WHERE id = ?").run(schoolId);
  });

  it("persists a reviewed access profile and writes an audit event", async () => {
    const learnerSupportProfile = {
      version: 1,
      strengths: ["Explains ideas aloud"],
      barriers: ["Dense multi-step instructions"],
      successfulStrategies: ["One clear step at a time"],
      accessibility: { fontScale: "large", lineSpacing: "spacious", highContrast: true, reduceVisualClutter: true, useVisualSupports: true, responseModes: ["spoken", "written"] },
      communication: { instructionStyle: "direct", processingTime: "extended", vocabularySupport: true, sentenceFrames: true },
      scaffoldingLevel: "prompted",
      pupilVoice: "I like a quiet start.",
      temporaryAdjustments: [{ id: "quiet-start", label: "Quiet start", reason: "Morning transition", active: true }],
    };

    const updated = await request(app).put(`/api/pupils/${pupilId}`).set("Cookie", cookie).send({ learnerSupportProfile });
    expect(updated.status).toBe(200);

    const refreshed = await request(app).get(`/api/pupils/${pupilId}`).set("Cookie", cookie);
    expect(refreshed.status).toBe(200);
    expect(JSON.parse(refreshed.body.learner_support_profile_json)).toMatchObject({
      strengths: ["Explains ideas aloud"],
      accessibility: expect.objectContaining({ fontScale: "large", highContrast: true }),
      temporaryAdjustments: [expect.objectContaining({ label: "Quiet start", active: true })],
    });

    const audit = await db.prepare("SELECT * FROM pupil_audit WHERE pupil_id = ? AND field_name = ?").get(pupilId, "learnerSupportProfile") as any;
    expect(audit).toBeTruthy();
    expect(audit.new_value).toContain("Quiet start");
  });

  it("rejects malformed and oversized support-profile payloads", async () => {
    const malformed = await request(app).put(`/api/pupils/${pupilId}`).set("Cookie", cookie).send({ learnerSupportProfile: ["not-an-object"] });
    expect(malformed.status).toBe(400);
    expect(malformed.body.error).toMatch(/must be an object/i);

    const oversized = await request(app).put(`/api/pupils/${pupilId}`).set("Cookie", cookie).send({ learnerSupportProfile: { pupilVoice: "x".repeat(12_001) } });
    expect(oversized.status).toBe(400);
    expect(oversized.body.error).toMatch(/too large/i);
  });
});
