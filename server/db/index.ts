/**
 * Database layer using sql.js (pure WASM SQLite — no native bindings required).
 * Persists to a file on disk; loaded on startup, saved after every write.
 */
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "send-assistant.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ─── Synchronous-style wrapper around sql.js ─────────────────────────────────
// sql.js is synchronous in its query execution but async to initialise (WASM).
// We export a promise that resolves to the db wrapper so server/index.ts can
// await it before starting Express.

let _db: SqlJsDatabase;
let _dirty = false;

/** Persist the in-memory DB to disk (called after every mutating statement). */
function persist() {
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/** Thin wrapper that mimics the better-sqlite3 API used throughout the codebase. */
export const db = {
  /** Execute a SQL string (DDL / multi-statement). */
  exec(sql: string) {
    _db.run(sql);
    persist();
  },
  pragma(_: string) {
    // sql.js doesn't support PRAGMA via run() in the same way; WAL is N/A for
    // file-backed WASM. Foreign keys are enforced at schema level.
  },
  /** Prepare a statement — returns an object with .run(), .get(), .all(). */
  prepare(sql: string) {
    return {
      run(...params: unknown[]) {
        _db.run(sql, params as any);
        persist();
        return { changes: 1, lastInsertRowid: 0 };
      },
      get(...params: unknown[]) {
        const stmt = _db.prepare(sql);
        stmt.bind(params as any);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params: unknown[]) {
        const stmt = _db.prepare(sql);
        stmt.bind(params as any);
        const rows: Record<string, unknown>[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
    };
  },
};

// ─── Schema paths ─────────────────────────────────────────────────────────────
function loadSchema(): string {
  const candidates = [
    path.join(__dirname, "schema.sql"),
    path.join(__dirname, "..", "db", "schema.sql"),
    path.join(process.cwd(), "server", "db", "schema.sql"),
    path.join(process.cwd(), "dist", "server", "db", "schema.sql"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf-8");
  }
  throw new Error("schema.sql not found in: " + candidates.join(", "));
}

// ─── Initialise (async, awaited by server/index.ts) ──────────────────────────
export async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  // Run schema (CREATE TABLE IF NOT EXISTS — idempotent)
  const schema = loadSchema();
  // Strip PRAGMA lines — sql.js handles them differently
  const schemaSafe = schema
    .split("\n")
    .filter(l => !l.trim().startsWith("PRAGMA"))
    .join("\n");
  _db.run(schemaSafe);
  persist();

  // ── Schema migrations (idempotent — ADD COLUMN IF NOT EXISTS) ─────────────
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
  ];
  for (const migration of migrations) {
    try { _db.run(migration); } catch (_) { /* column already exists — ignore */ }
  }
  persist();

  // Seed default admin if no users exist
  const stmt = _db.prepare("SELECT COUNT(*) as c FROM users");
  stmt.step();
  const row = stmt.getAsObject() as { c: number };
  stmt.free();

  if (!row.c || row.c === 0) {
    const schoolId = uuidv4();
    const adminId = uuidv4();
    const hash = bcrypt.hashSync("Admin1234!", 12);

    _db.run(
      `INSERT INTO schools (id, name, urn, domain, onboarding_complete, licence_type)
       VALUES (?, 'Default School', '000000', '', 1, 'professional')`,
      [schoolId]
    );
    _db.run(
      `INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verified)
       VALUES (?, ?, 'admin@adaptly.co.uk', 'System Admin', ?, 'mat_admin', 1)`,
      [adminId, schoolId, hash]
    );
    persist();
    console.log("✅ Seeded default admin: admin@adaptly.co.uk / Admin1234!");
  }

  // Seed admin API keys from environment variables (idempotent — INSERT OR REPLACE)
  const adminKeyProviders = [
    { provider: "groq",        envKey: "GROQ_API_KEY",        model: "llama-3.3-70b-versatile" },
    { provider: "gemini",      envKey: "GEMINI_API_KEY",      model: "gemini-2.0-flash" },
    { provider: "openai",      envKey: "OPENAI_API_KEY",      model: "gpt-4o-mini" },
    { provider: "openrouter",  envKey: "OPENROUTER_API_KEY",  model: "nvidia/nemotron-nano-9b-v2:free" },
    { provider: "claude",      envKey: "CLAUDE_API_KEY",      model: "claude-3-haiku-20240307" },
    { provider: "huggingface", envKey: "HUGGINGFACE_API_KEY",  model: "Qwen/Qwen2.5-72B-Instruct" },
  ];
  for (const { provider, envKey, model } of adminKeyProviders) {
    const key = process.env[envKey];
    if (key) {
      _db.run(
        `INSERT OR REPLACE INTO admin_api_keys (id, provider, api_key, model, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [provider, provider, key, model]
      );
    }
  }
  persist();

  console.log(`✅ Database ready at ${DB_PATH}`);
}

export default db;
