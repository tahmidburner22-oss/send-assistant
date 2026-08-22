import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import db, { initDb } from "../db/index.js";
import authRouter from "../routes/auth.js";
import dataRouter from "../routes/data.js";

function buildApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/data", dataRouter);
  return app;
}

async function registerVerifyAndLogin(app: express.Express, email: string, password: string, schoolId: string) {
  await request(app).post("/api/auth/register").send({
    email,
    password,
    displayName: "History Structure Test Teacher",
    role: "teacher",
  });
  await db.prepare("UPDATE users SET email_verified = 1, school_id = ? WHERE email = ?").run(schoolId, email);
  const login = await request(app).post("/api/auth/login").send({ email, password });
  const cookie = login.headers["set-cookie"] as string[] | undefined;
  return cookie?.[0]?.split(";")[0] || "";
}

describe("History worksheet structure persistence", () => {
  const app = buildApp();
  const schoolId = `history-school-${uuidv4()}`;
  const email = `history-teacher-${uuidv4()}@example.com`;
  const password = "TestPassword123!";
  let cookie = "";
  let worksheetId = "";

  beforeAll(async () => {
    await initDb();
    await db.prepare("INSERT INTO schools (id, name) VALUES (?, ?)").run(schoolId, "History Structure Test School");
    cookie = await registerVerifyAndLogin(app, email, password, schoolId);
  });

  afterAll(async () => {
    if (worksheetId) await db.prepare("DELETE FROM worksheets WHERE id = ?").run(worksheetId);
    await db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)").run(email);
    await db.prepare("DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email = ?)").run(email);
    await db.prepare("DELETE FROM users WHERE email = ?").run(email);
    await db.prepare("DELETE FROM schools WHERE id = ?").run(schoolId);
  });

  it("retains complete section structure after list refresh and update", async () => {
    const section = {
      id: "wave-diagram-question",
      title: "Question 1 — Label the wave",
      type: "q-label-diagram",
      content: "Add the amplitude and wavelength labels.",
      teacherOnly: false,
      caption: "A transverse wave with two labelled response lines.",
      imageUrl: "/assets/wave.png",
      assetRef: "wave-response-diagram",
      layout: "diagram-response",
      responseSpace: { lines: 3, label: "Use the diagram vocabulary." },
      diagramSpec: {
        kind: "wave",
        labels: ["amplitude", "wavelength"],
        bounded: true,
      },
      print: { keepTogether: true, minHeightMm: 54 },
    };

    const teacherSection = {
      id: "wave-answer-key",
      title: "Teacher answer key",
      type: "mark-scheme",
      content: "Amplitude is the maximum displacement; wavelength is one complete cycle.",
      teacherOnly: true,
      layout: "mark-scheme-grid",
      markScheme: [{ point: "Names amplitude", marks: 1 }, { point: "Names wavelength", marks: 1 }],
    };

    const created = await request(app)
      .post("/api/data/worksheets")
      .set("Cookie", cookie)
      .send({
        title: "Waves — Structure Check",
        subtitle: "Year 10 · Foundation",
        subject: "science",
        topic: "waves",
        yearGroup: "Year 10",
        difficulty: "foundation",
        sendNeed: "dyslexia",
        overlay: "cream",
        content: "## Question 1 — Label the wave\nAdd the amplitude and wavelength labels.",
        teacherContent: "## Question 1 — Label the wave\nAdd the amplitude and wavelength labels.",
        metadata: { adaptationRationale: "Clear diagram response route; curriculum demand unchanged." },
        sections: [section, teacherSection],
      });

    expect(created.status).toBe(201);
    worksheetId = created.body.id;

    const listAfterCreate = await request(app).get("/api/data/worksheets").set("Cookie", cookie);
    expect(listAfterCreate.status).toBe(200);
    const saved = listAfterCreate.body.find((item: { id: string }) => item.id === worksheetId);
    expect(saved).toMatchObject({
      subtitle: "Year 10 · Foundation",
      sendNeed: "dyslexia",
      overlay: "cream",
      metadata: { adaptationRationale: "Clear diagram response route; curriculum demand unchanged." },
      sections: [expect.objectContaining({
        id: "wave-diagram-question",
        layout: "diagram-response",
        responseSpace: { lines: 3, label: "Use the diagram vocabulary." },
        diagramSpec: { kind: "wave", labels: ["amplitude", "wavelength"], bounded: true },
        print: { keepTogether: true, minHeightMm: 54 },
      }), expect.objectContaining({
        id: "wave-answer-key",
        teacherOnly: true,
        layout: "mark-scheme-grid",
        markScheme: [{ point: "Names amplitude", marks: 1 }, { point: "Names wavelength", marks: 1 }],
      })],
    });

    const updatedSection = { ...section, responseSpace: { lines: 5, label: "Show your working clearly." } };
    const updated = await request(app)
      .put(`/api/data/worksheets/${worksheetId}`)
      .set("Cookie", cookie)
      .send({ sections: [updatedSection, teacherSection] });
    expect(updated.status).toBe(200);

    const listAfterUpdate = await request(app).get("/api/data/worksheets").set("Cookie", cookie);
    const refreshed = listAfterUpdate.body.find((item: { id: string }) => item.id === worksheetId);
    expect(refreshed.sections[0]).toMatchObject({
      id: "wave-diagram-question",
      responseSpace: { lines: 5, label: "Show your working clearly." },
      diagramSpec: { kind: "wave", labels: ["amplitude", "wavelength"], bounded: true },
      print: { keepTogether: true, minHeightMm: 54 },
    });
    expect(refreshed.sections[1]).toMatchObject({
      id: "wave-answer-key",
      teacherOnly: true,
      layout: "mark-scheme-grid",
      markScheme: [{ point: "Names amplitude", marks: 1 }, { point: "Names wavelength", marks: 1 }],
    });
  });
});
