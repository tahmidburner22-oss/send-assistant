import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import db, { initDb } from "../db/index.js";
import authRouter from "../routes/auth.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);

describe("Auth Routes", () => {
  const testEmail = `test-${uuidv4()}@example.com`;
  const testPassword = "TestPassword123!";
  let userId: string;

  beforeAll(async () => {
    await initDb();
  });

  afterAll(() => {
    if (userId) {
      db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    }
  });

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
        displayName: "Test User",
        role: "teacher"
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("Account created");

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(testEmail) as any;
    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.display_name).toBe("Test User");
    expect(user.role).toBe("teacher");
    expect(user.email_verified).toBe(0);
    
    userId = user.id;
  });

  it("should fail to register with existing email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: "AnotherPassword123!",
        displayName: "Another User"
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("already exists");
  });

  it("should login successfully", async () => {
    // First verify the user so they can login
    if (userId) {
      db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(userId);
    }

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword
      });

    if (res.status !== 200) {
      console.log("Login response:", res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(testEmail);
  });

  it("should fail login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "WrongPassword123!"
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toContain("Invalid email or password");
  });
});
