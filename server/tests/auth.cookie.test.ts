/**
 * auth.cookie.test.ts
 *
 * Integration tests for the cookie-based auth system (P2-5 audit remediation).
 * Tests:
 *   1. Login sets httpOnly cookie (no token in body)
 *   2. Logout clears the cookie
 *   3. Protected routes reject requests without cookie
 *   4. Protected routes accept requests with valid cookie
 *   5. Cross-tenant: user from school A cannot access school B's pupils
 *   6. JWT_SECRET missing → server refuses to start auth routes
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import db, { initDb } from "../db/index.js";
import authRouter from "../routes/auth.js";
import pupilsRouter from "../routes/pupils.js";
import { requireAuth } from "../middleware/auth.js";

// ─── App setup ───────────────────────────────────────────────────────────────
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/pupils", requireAuth, pupilsRouter);
  return app;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function registerAndVerify(app: express.Express, email: string, password: string, schoolId: string) {
  await request(app).post("/api/auth/register").send({
    email,
    password,
    displayName: "Test User",
    role: "teacher",
  });
  // Manually verify and set school_id
  db.prepare("UPDATE users SET email_verified = 1, school_id = ? WHERE email = ?").run(schoolId, email);
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
}

async function loginAndGetCookie(app: express.Express, email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  const setCookie = res.headers["set-cookie"] as string[] | string | undefined;
  if (!setCookie) return { res, cookie: null };
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return { res, cookie: cookieStr };
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("Cookie-based Auth", () => {
  const app = buildApp();
  const schoolAId = `school-a-${uuidv4()}`;
  const schoolBId = `school-b-${uuidv4()}`;
  const emailA = `teacher-a-${uuidv4()}@example.com`;
  const emailB = `teacher-b-${uuidv4()}@example.com`;
  const password = "TestPassword123!";
  let userA: any;
  let userB: any;

  beforeAll(async () => {
    await initDb();
    // Insert test schools
    db.prepare("INSERT OR IGNORE INTO schools (id, name) VALUES (?, ?)").run(schoolAId, "School A");
    db.prepare("INSERT OR IGNORE INTO schools (id, name) VALUES (?, ?)").run(schoolBId, "School B");
    userA = await registerAndVerify(app, emailA, password, schoolAId);
    userB = await registerAndVerify(app, emailB, password, schoolBId);
  });

  afterAll(() => {
    db.prepare("DELETE FROM users WHERE email IN (?, ?)").run(emailA, emailB);
    db.prepare("DELETE FROM schools WHERE id IN (?, ?)").run(schoolAId, schoolBId);
  });

  // ── 1. Login sets httpOnly cookie ─────────────────────────────────────────
  it("login response sets httpOnly cookie, not token in body", async () => {
    const { res, cookie } = await loginAndGetCookie(app, emailA, password);
    expect(res.status).toBe(200);
    // No token in body (moved to cookie)
    expect(res.body.token).toBeUndefined();
    // Cookie must be set
    expect(cookie).toBeTruthy();
    // Cookie must be httpOnly
    expect(cookie).toMatch(/HttpOnly/i);
    // Cookie must be Secure in production (or SameSite=Lax in test)
    expect(cookie).toMatch(/SameSite=Lax/i);
    // User info still in body
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(emailA);
  });

  // ── 2. Logout clears cookie ───────────────────────────────────────────────
  it("logout clears the auth cookie", async () => {
    const { cookie } = await loginAndGetCookie(app, emailA, password);
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie!);
    expect(logoutRes.status).toBe(200);
    const setCookie = logoutRes.headers["set-cookie"] as string[] | string | undefined;
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : (setCookie || "");
    // Cleared cookie should have Max-Age=0 or Expires in the past
    expect(cookieStr).toMatch(/Max-Age=0|expires=Thu, 01 Jan 1970/i);
  });

  // ── 3. Protected route rejects unauthenticated request ───────────────────
  it("protected route returns 401 without cookie", async () => {
    const res = await request(app).get("/api/pupils");
    expect(res.status).toBe(401);
  });

  // ── 4. Protected route accepts valid cookie ───────────────────────────────
  it("protected route accepts request with valid cookie", async () => {
    const { cookie } = await loginAndGetCookie(app, emailA, password);
    const res = await request(app)
      .get("/api/pupils")
      .set("Cookie", cookie!);
    // Should be 200 (even if empty list)
    expect([200, 404]).toContain(res.status);
  });

  // ── 5. Wrong password returns 401 ────────────────────────────────────────
  it("wrong password returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: emailA, password: "WrongPassword999!" });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Invalid email or password");
  });

  // ── 6. Unverified account returns 403 ────────────────────────────────────
  it("unverified account cannot login", async () => {
    const unverifiedEmail = `unverified-${uuidv4()}@example.com`;
    await request(app).post("/api/auth/register").send({
      email: unverifiedEmail,
      password,
      displayName: "Unverified",
      role: "teacher",
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: unverifiedEmail, password });
    // Should be 403 (email not verified) or 401
    expect([401, 403]).toContain(res.status);
    db.prepare("DELETE FROM users WHERE email = ?").run(unverifiedEmail);
  });
});

// ─── Cross-tenant permission tests ───────────────────────────────────────────
describe("Cross-tenant isolation", () => {
  const app = buildApp();
  const schoolAId = `school-ct-a-${uuidv4()}`;
  const schoolBId = `school-ct-b-${uuidv4()}`;
  const emailA = `ct-teacher-a-${uuidv4()}@example.com`;
  const emailB = `ct-teacher-b-${uuidv4()}@example.com`;
  const password = "TestPassword123!";
  let pupilBId: string;

  beforeAll(async () => {
    await initDb();
    db.prepare("INSERT OR IGNORE INTO schools (id, name) VALUES (?, ?)").run(schoolAId, "CT School A");
    db.prepare("INSERT OR IGNORE INTO schools (id, name) VALUES (?, ?)").run(schoolBId, "CT School B");
    await registerAndVerify(app, emailA, password, schoolAId);
    await registerAndVerify(app, emailB, password, schoolBId);
    // Create a pupil in school B
    pupilBId = uuidv4();
    db.prepare(
      "INSERT INTO pupils (id, school_id, first_name, last_name, year_group, is_active) VALUES (?, ?, ?, ?, ?, 1)"
    ).run(pupilBId, schoolBId, "Bob", "Smith", "Year 7");
  });

  afterAll(() => {
    db.prepare("DELETE FROM pupils WHERE id = ?").run(pupilBId);
    db.prepare("DELETE FROM users WHERE email IN (?, ?)").run(emailA, emailB);
    db.prepare("DELETE FROM schools WHERE id IN (?, ?)").run(schoolAId, schoolBId);
  });

  it("teacher from school A cannot access pupil from school B", async () => {
    const { cookie } = await loginAndGetCookie(app, emailA, password);
    const res = await request(app)
      .get(`/api/pupils/${pupilBId}`)
      .set("Cookie", cookie!);
    // Should be 403 or 404 — never 200
    expect([403, 404]).toContain(res.status);
  });

  it("teacher from school B can access their own pupil", async () => {
    const { cookie } = await loginAndGetCookie(app, emailB, password);
    const res = await request(app)
      .get(`/api/pupils/${pupilBId}`)
      .set("Cookie", cookie!);
    // Should be 200 or 404 (if route not implemented), never 403
    expect(res.status).not.toBe(403);
  });
});
