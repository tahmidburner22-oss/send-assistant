import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import db, { initDb } from "../db/index.js";
import authRouter from "../routes/auth.js";
import schedulerRouter from "../routes/scheduler.js";
import { buildSchedulerLearnerSupportCue } from "../lib/schedulerWorker.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/scheduler", schedulerRouter);
  return app;
}

async function authenticatedCookie(app: express.Express, email: string, password: string, schoolId: string) {
  await request(app).post("/api/auth/register").send({
    email,
    password,
    displayName: "Scheduler Test Teacher",
    role: "teacher",
  });
  await db.prepare("UPDATE users SET email_verified = 1, school_id = ? WHERE email = ?").run(schoolId, email);
  const login = await request(app).post("/api/auth/login").send({ email, password });
  const setCookie = login.headers["set-cookie"] as string[] | undefined;
  return setCookie?.[0]?.split(";")[0] || "";
}

describe("server-backed pupil scheduler", () => {
  const app = buildApp();
  const schoolId = `scheduler-school-${uuidv4()}`;
  const pupilId = uuidv4();
  const assignmentId = uuidv4();
  const overrideAssignmentId = uuidv4();
  const email = `scheduler-teacher-${uuidv4()}@example.com`;
  const password = "TestPassword123!";
  let cookie = "";

  beforeAll(async () => {
    await initDb();
    await db.prepare("INSERT INTO schools (id, name) VALUES (?, ?)").run(schoolId, "Scheduler Test School");
    await db.prepare("INSERT INTO pupils (id, school_id, name, year_group, send_need, is_active) VALUES (?, ?, ?, ?, ?, 1)")
      .run(pupilId, schoolId, "S.P.", "Year 10", "Dyslexia");
    cookie = await authenticatedCookie(app, email, password, schoolId);
  });

  afterAll(async () => {
    await db.prepare("DELETE FROM assignments WHERE pupil_id = ?").run(pupilId);
    await db.prepare("DELETE FROM scheduler_configs WHERE pupil_id = ?").run(pupilId);
    await db.prepare("DELETE FROM pupils WHERE id = ?").run(pupilId);
    await db.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)").run(email);
    await db.prepare("DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email = ?)").run(email);
    await db.prepare("DELETE FROM users WHERE email = ?").run(email);
    await db.prepare("DELETE FROM schools WHERE id = ?").run(schoolId);
  });

  it("reduces learner-support data to bounded access guidance without identity or diagnosis", () => {
    const cue = buildSchedulerLearnerSupportCue(JSON.stringify({
      diagnosis: "not for generation",
      successfulStrategies: ["Give one clear step", "Use a worked model"],
      accessibility: { fontScale: "large", highContrast: true, reduceVisualClutter: true },
      communication: { vocabularySupport: true, sentenceFrames: true, processingTime: "extended" },
      scaffoldingLevel: "part-modelled",
      pupilVoice: "I am called Example",
    }));

    expect(cue).toContain("Give one clear step");
    expect(cue).toContain("high-contrast presentation");
    expect(cue).toContain("Scaffold entry point: part-modelled");
    expect(cue).not.toContain("not for generation");
    expect(cue).not.toContain("Example");
    expect(cue?.length).toBeLessThanOrEqual(1600);
  });

  it("exposes the worker’s canonical curriculum ladders", async () => {
    const response = await request(app).get("/api/scheduler/ladders").set("Cookie", cookie);
    expect(response.status).toBe(200);
    expect(response.body.mathematics[0]).toMatchObject({
      topic: "Number — Place Value & Rounding",
      steps: expect.arrayContaining(["Identify place value"]),
    });
  });

  it("persists a plan and returns the same configuration for the pupil", async () => {
    const saved = await request(app)
      .put(`/api/scheduler/${pupilId}/mathematics`)
      .set("Cookie", cookie)
      .send({
        enabled: false,
        frequency: "weekly",
        difficulty: "foundation",
        includeAnswers: true,
        includeRecall: true,
        passThreshold: 80,
        progressionTopicIndex: 0,
        progressionStepIndex: 0,
      });

    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({
      pupilId,
      subject: "mathematics",
      enabled: false,
      frequency: "weekly",
      difficulty: "foundation",
      passThreshold: 80,
      nextFireAt: null,
    });

    const refreshed = await request(app).get(`/api/scheduler/${pupilId}`).set("Cookie", cookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body).toEqual([expect.objectContaining({
      pupilId,
      subject: "mathematics",
      enabled: false,
      frequency: "weekly",
      progressionTopicIndex: 0,
      progressionStepIndex: 0,
    })]);
  });

  it("rejects a concurrent manual generation before creating duplicate work", async () => {
    await db.prepare(
      "UPDATE scheduler_configs SET generation_lock_until = NOW() + INTERVAL '1 minute' WHERE pupil_id = ? AND subject = ?"
    ).run(pupilId, "mathematics");

    const response = await request(app)
      .post(`/api/scheduler/${pupilId}/mathematics/run-now`)
      .set("Cookie", cookie);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ code: "generation-in-progress" });

    await db.prepare(
      "UPDATE scheduler_configs SET generation_lock_until = NULL WHERE pupil_id = ? AND subject = ?"
    ).run(pupilId, "mathematics");
  });

  it("advances the curriculum only after a teacher accepts a passing reviewed mark", async () => {
    await db.prepare(
      `INSERT INTO assignments
       (id, pupil_id, title, type, content, source, scheduler_subject, status, marked_score, assigned_at)
       VALUES (?, ?, ?, ?, ?, 'scheduler', 'mathematics', 'marked-pending-review', ?, NOW())`
    ).run(assignmentId, pupilId, "Mathematics — Place Value", "scheduler-worksheet", "Pupil response", 85);

    const accepted = await request(app)
      .post(`/api/scheduler/assignments/${assignmentId}/accept-mark`)
      .set("Cookie", cookie);
    expect(accepted.status).toBe(200);
    expect(accepted.body).toEqual({ ok: true });

    const assignment = await db.prepare("SELECT status, auto_mark_accepted FROM assignments WHERE id = ?").get(assignmentId) as any;
    expect(assignment).toMatchObject({ status: "completed", auto_mark_accepted: 1 });

    const config = await db.prepare(
      "SELECT progression_topic_index, progression_step_index FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
    ).get(pupilId, "mathematics") as any;
    expect(config).toMatchObject({ progression_topic_index: 0, progression_step_index: 1 });
  });

  it("uses a teacher override as the final mastery decision", async () => {
    await db.prepare(
      `INSERT INTO assignments
       (id, pupil_id, title, type, content, source, scheduler_subject, status, marked_score, assigned_at)
       VALUES (?, ?, ?, ?, ?, 'scheduler', 'mathematics', 'marked-pending-review', ?, NOW())`
    ).run(overrideAssignmentId, pupilId, "Mathematics — Reinforcement", "scheduler-worksheet", "Pupil response", 90);

    const overridden = await request(app)
      .post(`/api/scheduler/assignments/${overrideAssignmentId}/override-mark`)
      .set("Cookie", cookie)
      .send({ score: 45, feedback: "Review place value before moving on." });
    expect(overridden.status).toBe(200);

    const assignment = await db.prepare("SELECT status, marked_score, feedback FROM assignments WHERE id = ?").get(overrideAssignmentId) as any;
    expect(assignment).toMatchObject({
      status: "completed",
      marked_score: 45,
      feedback: "Review place value before moving on.",
    });

    const config = await db.prepare(
      "SELECT progression_topic_index, progression_step_index, next_fire_at FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
    ).get(pupilId, "mathematics") as any;
    // The earlier accepted mark advanced to step 1. A below-threshold override
    // must keep that step and schedule a fresh reinforcement variant instead.
    expect(config).toMatchObject({ progression_topic_index: 0, progression_step_index: 1 });
    expect(config.next_fire_at).toBeTruthy();
  });
});
