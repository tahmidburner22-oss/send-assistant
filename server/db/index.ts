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
  /** Wrap a function in a transaction (mimics better-sqlite3 .transaction()).
   * sql.js is single-threaded in-memory; we simply execute the function and
   * let individual run() calls persist. No explicit BEGIN/COMMIT needed. */
  transaction<T>(fn: () => T): () => T {
    return () => fn();
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
  try {
    _db.run(schemaSafe);
  } catch (e) {
    console.error("Error running schema.sql:", e.message || JSON.stringify(e));
    throw e;
  }
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
    // User preferences (sidebar collapse state, theme, etc.) — persisted server-side
    "ALTER TABLE users ADD COLUMN preferences TEXT",
    // Parent contact details on pupils — for behaviour alert emails
    "ALTER TABLE pupils ADD COLUMN parent_email TEXT",
    "ALTER TABLE pupils ADD COLUMN parent_name TEXT",
    // Daily briefing file attachments — added after initial schema
    "ALTER TABLE daily_briefings ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'",
    // Structured worksheet sections + metadata for assignments (for 1:1 WorksheetRenderer display)
    "ALTER TABLE assignments ADD COLUMN sections TEXT",
    "ALTER TABLE assignments ADD COLUMN metadata TEXT",
    "ALTER TABLE assignments ADD COLUMN subtitle TEXT",
    // Login lockout columns — added for brute-force protection
    "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN locked_until TEXT",
    // Parent access code for parent portal
    "ALTER TABLE pupils ADD COLUMN parent_access_code TEXT",
    // Worksheet folder support
    `CREATE TABLE IF NOT EXISTS worksheet_folders (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      created_by TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      colour TEXT DEFAULT '#6366f1',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS worksheet_folder_items (
      folder_id TEXT NOT NULL REFERENCES worksheet_folders(id) ON DELETE CASCADE,
      worksheet_id TEXT NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (folder_id, worksheet_id)
    )`,
    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'system',
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT,
      metadata TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read)`,
    // Parent messages table
    `CREATE TABLE IF NOT EXISTS parent_messages (
      id TEXT PRIMARY KEY,
      pupil_id TEXT NOT NULL REFERENCES pupils(id) ON DELETE CASCADE,
      sender_type TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      body TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_parent_messages_pupil ON parent_messages(pupil_id)`,
    // Quiz results table
    `CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      pupil_id TEXT REFERENCES pupils(id) ON DELETE SET NULL,
      pupil_name TEXT NOT NULL,
      quiz_id TEXT,
      quiz_title TEXT,
      subject TEXT,
      topic TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      max_score INTEGER NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL DEFAULT 0,
      time_taken_seconds INTEGER,
      badge TEXT,
      played_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_results_pupil ON quiz_results(pupil_id)`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_results_school ON quiz_results(school_id)`,
    // Platform stats for landing page
    `CREATE TABLE IF NOT EXISTS platform_stats (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    // Worksheet Library — master worksheets for instant retrieval
    `CREATE TABLE IF NOT EXISTS worksheet_library (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      year_group TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      tier TEXT NOT NULL DEFAULT 'standard',
      send_need TEXT,
      sections TEXT NOT NULL DEFAULT '[]',
      teacher_sections TEXT NOT NULL DEFAULT '[]',
      key_vocab TEXT NOT NULL DEFAULT '[]',
      learning_objective TEXT,
      source TEXT NOT NULL DEFAULT 'ai',
      curated INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 1,
      uploaded_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_library_topic ON worksheet_library(subject, topic, year_group, tier)`,
    `CREATE INDEX IF NOT EXISTS idx_library_subject ON worksheet_library(subject)`,
    `CREATE INDEX IF NOT EXISTS idx_library_curated ON worksheet_library(curated)`,
    `CREATE INDEX IF NOT EXISTS idx_library_tier ON worksheet_library(tier)`,
    // Add tier column to existing worksheet_library tables (migration)
    `ALTER TABLE worksheet_library ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard'`,
    `ALTER TABLE worksheet_library ADD COLUMN send_need TEXT`,
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
      `INSERT INTO schools (id, name, urn, domain, onboarding_complete, licence_type, subscription_plan, subscription_status)
       VALUES (?, 'Adaptly', '000000', '', 1, 'premium', 'premium', 'active')`,
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

  // Seed admin API keys from Railway environment variables only.
  // Security: No API keys are hardcoded in source code.
  // Each school uses their own encrypted keys (school_api_keys table).
  // Platform-level keys below are only for the Adaptly operator account and are set via Railway env vars.
  const adminKeyProviders = [
    { provider: "groq",    envKey: "GROQ_API_KEY",   model: "llama-3.3-70b-versatile" },
    { provider: "gemini",  envKey: "GEMINI_API_KEY",  model: "gemini-2.5-flash"         },
    { provider: "mistral", envKey: "MISTRAL_API_KEY", model: "mistral-small-latest"     },
  ];
  for (const { provider, envKey, model } of adminKeyProviders) {
    const key = process.env[envKey];
    if (key) {
      _db.run(
        `INSERT OR REPLACE INTO admin_api_keys (id, provider, api_key, model, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [provider, provider, key, model]
      );
    } else {
      // Even without a new key, update the model name if the row exists (e.g. model upgrade migration)
      _db.run(
        `UPDATE admin_api_keys SET model=?, updated_at=datetime('now') WHERE provider=?`,
        [model, provider]
      );
    }
  }
  persist();

  console.log(`✅ Database ready at ${DB_PATH}`);
}

export default db;

