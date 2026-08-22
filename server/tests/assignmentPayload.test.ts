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
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/pupils", requireAuth, pupilsRouter);
  return app;
}

async function registerVerifyAndLogin(app: express.Express, email: string, password: string, schoolId: string) {
  await request(app).post("/api/auth/register").send({
    email,
    password,
    displayName: "Assignment Test Teacher",
    role: "teacher",
  });
  await db.prepare("UPDATE users SET email_verified = 1, school_id = ? WHERE email = ?").run(schoolId, email);
  const login = await request(app).post("/api/auth/login").send({ email, password });
  const cookie = login.headers["set-cookie"] as string[] | undefined;
  return cookie?.[0]?.split(";")[0] || "";
}

describe("assignment worksheet-view payload persistence", () => {
  const app = buildApp();
  const schoolId = `assignment-school-${uuidv4()}`;
  const pupilId = uuidv4();
  const email = `assignment-teacher-${uuidv4()}@example.com`;
  const password = "TestPassword123!";
  let cookie = "";

  beforeAll(async () => {
    await initDb();
    await db.prepare("INSERT INTO schools (id, name) VALUES (?, ?)").run(schoolId, "Assignment Test School");
    await db.prepare("INSERT INTO pupils (id, school_id, name, year_group, is_active) VALUES (?, ?, ?, ?, 1)")
      .run(pupilId, schoolId, "A.P.", "Year 10");
    cookie = await registerVerifyAndLogin(app, email, password, schoolId);
  });

  afterAll(async () => {
    await db.prepare("DELETE FROM assignments WHERE pupil_id = ?").run(pupilId);
    await db.prepare("DELETE FROM pupils WHERE id = ?").run(pupilId);
    await db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)").run(email);
    await db.prepare("DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email = ?)").run(email);
    await db.prepare("DELETE FROM users WHERE email = ?").run(email);
    await db.prepare("DELETE FROM schools WHERE id = ?").run(schoolId);
  });

  it("returns subtitle, structured sections and metadata unchanged after refresh", async () => {
    const sections = [{
      title: "Wave diagram",
      type: "q-label-diagram",
      content: "Label the amplitude and wavelength.",
      caption: "A labelled transverse wave.",
      svg: "<svg viewBox='0 0 10 10'></svg>",
      imageUrl: "/assets/waves.png",
      assetRef: "wave-1",
      teacherOnly: false,
    }];
    const metadata = {
      subject: "science",
      topic: "waves",
      yearGroup: "Year 10",
      sendNeed: "visual-impairment",
      adaptationSummary: ["High-contrast response boundaries"],
      curriculumReference: "AQA Physics 4.6.1",
      qualityStatus: "checked",
    };

    const created = await request(app)
      .post(`/api/pupils/${pupilId}/assignments`)
      .set("Cookie", cookie)
      .send({
        title: "Science — Waves",
        subtitle: "Year 10 · Foundation",
        type: "worksheet",
        content: "Pupil-safe worksheet content",
        sections,
        metadata,
      });

    expect(created.status).toBe(201);
    expect(created.body.id).toBeTruthy();

    const refreshed = await request(app)
      .get(`/api/pupils/${pupilId}`)
      .set("Cookie", cookie);

    expect(refreshed.status).toBe(200);
    const assignment = refreshed.body.assignments.find((item: { id: string }) => item.id === created.body.id);
    expect(assignment).toMatchObject({
      title: "Science — Waves",
      subtitle: "Year 10 · Foundation",
      content: "Pupil-safe worksheet content",
      sections: [expect.objectContaining({
        title: "Wave diagram",
        caption: "A labelled transverse wave.",
        imageUrl: "/assets/waves.png",
        assetRef: "wave-1",
      })],
      metadata: expect.objectContaining({
        subject: "science",
        sendNeed: "visual-impairment",
        curriculumReference: "AQA Physics 4.6.1",
      }),
    });
  });
});
