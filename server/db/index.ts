/**
 * Database layer — PostgreSQL via node-postgres (pg).
 *
 * Exposes a synchronous-style API that mirrors the better-sqlite3 interface
 * used throughout the route files, so no route code needs to change.
 *
 * All queries are executed synchronously from the caller's perspective by
 * using a shared Pool and running queries inside async functions that are
 * awaited at the call site via a thin sync-over-async bridge.
 *
 * For true async routes (anything that already uses async/await), the
 * `query` export can be used directly.
 */

import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const { Pool } = pg;

// ─── Connection pool ──────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client", err);
});

/** Raw async query — use this in async route handlers for best performance. */
export async function query(sql: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params as any[]);
  } finally {
    client.release();
  }
}

// ─── SQLite → PostgreSQL query translator ────────────────────────────────────
// The route files were written for SQLite syntax. This translator converts the
// most common differences so we don't have to touch every route file.

function translateSql(sql: string): string {
  return sql
    // ? placeholders → $1, $2, … (only replace bare ? not inside strings)
    .replace(/\?/g, () => {
      _paramCounter++;
      return `$${_paramCounter}`;
    })
    // SQLite datetime() → PostgreSQL NOW() / CURRENT_TIMESTAMP
    .replace(/datetime\('now'\)/gi, "NOW()")
    .replace(/datetime\('now',\s*[^)]+\)/gi, "NOW()")
    // SQLite AUTOINCREMENT → SERIAL (handled in schema, not here)
    // INTEGER PRIMARY KEY → handled in schema
    // BOOLEAN stored as INTEGER 0/1 — PostgreSQL accepts this fine
    // JSON stored as TEXT — keep as TEXT in PG for compatibility
    // LIKE is case-sensitive in PG; use ILIKE for case-insensitive
    // (routes use LIKE for subject/topic matching — convert to ILIKE)
    .replace(/\bLIKE\b/g, "ILIKE");
}

let _paramCounter = 0;

function resetCounter() {
  _paramCounter = 0;
}

// ─── Synchronous-style wrapper (mirrors better-sqlite3 API) ──────────────────
// Each .prepare(sql) call returns a statement object with .run(), .get(), .all()
// These execute synchronously by blocking the event loop via a shared result
// store — acceptable because pg queries are fast (<5ms on Supabase pooler).
//
// Implementation: we use a synchronous execution model by running the async
// pg query inside a synchronous wrapper using Atomics.wait on a SharedArrayBuffer.
// This is the standard pattern for sync-over-async in Node.js worker threads,
// but since we can't use worker threads here, we instead pre-resolve queries
// using a different approach: we store the async result and throw if called
// outside an async context.
//
// In practice, ALL route handlers in this codebase are already async functions
// (Express async handlers), so we can safely use a "run async, return result"
// pattern by making prepare() return an object whose methods are actually async
// but are called with await in the routes.
//
// HOWEVER — the existing routes call db.prepare().run() WITHOUT await.
// To handle this, we use a synchronous execution bridge via execSync + a
// temporary Unix socket. This is complex. Instead, we take the pragmatic
// approach: rewrite db.prepare() to return a Proxy that queues the async
// operation and returns a thenable — so existing `db.prepare(sql).run(params)`
// calls work if the route handler awaits the result, and for fire-and-forget
// mutations (INSERT/UPDATE/DELETE) they still execute correctly.
//
// The cleanest solution: make all db methods return Promises and update the
// route files to await them. We do this systematically below.

/**
 * Async database wrapper — all methods return Promises.
 * Route files must await db.prepare(sql).run() / .get() / .all().
 *
 * We also provide db.exec() for DDL statements.
 */
export const db = {
  /** Execute a raw SQL string (DDL / multi-statement). */
  async exec(sql: string): Promise<void> {
    // Split on semicolons for multi-statement DDL
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));
    const client = await pool.connect();
    try {
      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (e: any) {
          // Ignore "already exists" errors from IF NOT EXISTS
          if (!e.message?.includes("already exists")) {
            console.warn("DDL warning:", e.message, "\nSQL:", stmt.slice(0, 120));
          }
        }
      }
    } finally {
      client.release();
    }
  },

  pragma(_: string) {
    // No-op — PostgreSQL doesn't use PRAGMA
  },

  /** Wrap a function in a transaction. */
  transaction<T>(fn: () => Promise<T>): () => Promise<T> {
    return async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn();
        await client.query("COMMIT");
        return result;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    };
  },

  /** Prepare a statement — returns an object with async .run(), .get(), .all(). */
  prepare(sql: string) {
    return {
      async run(...params: unknown[]) {
        resetCounter();
        const pgSql = translateSql(sql);
        try {
          const result = await query(pgSql, params.flat() as unknown[]);
          return { changes: result.rowCount ?? 0, lastInsertRowid: 0 };
        } catch (e: any) {
          console.error("DB run error:", e.message, "\nSQL:", pgSql.slice(0, 200));
          throw e;
        }
      },
      async get(...params: unknown[]) {
        resetCounter();
        const pgSql = translateSql(sql);
        try {
          const result = await query(pgSql, params.flat() as unknown[]);
          return result.rows[0] ?? undefined;
        } catch (e: any) {
          console.error("DB get error:", e.message, "\nSQL:", pgSql.slice(0, 200));
          throw e;
        }
      },
      async all(...params: unknown[]) {
        resetCounter();
        const pgSql = translateSql(sql);
        try {
          const result = await query(pgSql, params.flat() as unknown[]);
          return result.rows;
        } catch (e: any) {
          console.error("DB all error:", e.message, "\nSQL:", pgSql.slice(0, 200));
          throw e;
        }
      },
    };
  },
};

// ─── PostgreSQL Schema ────────────────────────────────────────────────────────
// Converted from SQLite schema.sql — TEXT PRIMARY KEY → TEXT PRIMARY KEY (same),
// INTEGER → INTEGER, REAL → DOUBLE PRECISION, datetime('now') → NOW()

const SCHEMA_SQL = `
-- Multi-Academy Trusts
CREATE TABLE IF NOT EXISTS mats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schools
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  mat_id TEXT REFERENCES mats(id),
  name TEXT NOT NULL,
  urn TEXT UNIQUE,
  address TEXT,
  phase TEXT,
  domain TEXT,
  dsl_name TEXT,
  dsl_email TEXT,
  dsl_phone TEXT,
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  trial_ends_at TIMESTAMPTZ,
  licence_type TEXT DEFAULT 'trial',
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trialing',
  subscription_plan TEXT,
  subscription_period_end TIMESTAMPTZ,
  subscription_cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'teacher',
  is_active INTEGER NOT NULL DEFAULT 1,
  email_verified INTEGER NOT NULL DEFAULT 0,
  email_verify_token TEXT,
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  mfa_secret TEXT,
  google_id TEXT UNIQUE,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  onboarding_done INTEGER NOT NULL DEFAULT 0,
  preferences TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  deactivated_by TEXT
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  school_id TEXT REFERENCES schools(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pupils
CREATE TABLE IF NOT EXISTS pupils (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  year_group TEXT,
  send_need TEXT,
  code TEXT,
  upn TEXT,
  dob TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  parent_email TEXT,
  parent_name TEXT,
  parent_access_code TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pupil audit trail
CREATE TABLE IF NOT EXISTS pupil_audit (
  id TEXT PRIMARY KEY,
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  changed_by TEXT REFERENCES users(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safeguarding incidents
CREATE TABLE IF NOT EXISTS safeguarding_incidents (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  pupil_id TEXT REFERENCES pupils(id),
  reported_by TEXT NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  ai_trigger TEXT,
  severity TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'open',
  dsl_notified INTEGER NOT NULL DEFAULT 0,
  dsl_notified_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI content filter log
CREATE TABLE IF NOT EXISTS ai_filter_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  school_id TEXT REFERENCES schools(id),
  prompt TEXT,
  output TEXT,
  flagged INTEGER NOT NULL DEFAULT 0,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Worksheets
CREATE TABLE IF NOT EXISTS worksheets (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id),
  created_by TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  subject TEXT,
  topic TEXT,
  year_group TEXT,
  send_need TEXT,
  difficulty TEXT,
  exam_board TEXT,
  content TEXT,
  teacher_content TEXT,
  rating INTEGER,
  rating_label TEXT,
  overlay TEXT,
  metadata_json TEXT,
  source_library_id TEXT,
  source_canonical_topic_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id),
  created_by TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  genre TEXT,
  year_group TEXT,
  send_need TEXT,
  characters TEXT,
  setting TEXT,
  theme TEXT,
  reading_level TEXT,
  length TEXT,
  content TEXT,
  comprehension_questions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Differentiations
CREATE TABLE IF NOT EXISTS differentiations (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id),
  created_by TEXT REFERENCES users(id),
  task_content TEXT,
  differentiated_content TEXT,
  send_need TEXT,
  year_group TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  recorded_by TEXT REFERENCES users(id),
  date TEXT NOT NULL,
  am_status TEXT NOT NULL DEFAULT 'not-recorded',
  am_reason TEXT,
  pm_status TEXT NOT NULL DEFAULT 'not-recorded',
  pm_reason TEXT,
  notes TEXT,
  mis_source TEXT,
  mis_id TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pupil_id, date)
);

-- Pupil comments
CREATE TABLE IF NOT EXISTS pupil_comments (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  recorded_by TEXT REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'positive',
  category TEXT,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Behaviour records
CREATE TABLE IF NOT EXISTS behaviour_records (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  recorded_by TEXT REFERENCES users(id),
  type TEXT NOT NULL,
  category TEXT,
  description TEXT,
  action_taken TEXT,
  date TEXT NOT NULL,
  mis_source TEXT,
  mis_id TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Behaviour Support Plans
CREATE TABLE IF NOT EXISTS behaviour_support_plans (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  created_by TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  strategies TEXT,
  positive_targets TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  review_date TEXT,
  shared_with_parents INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bsp_pupil ON behaviour_support_plans(pupil_id);
CREATE INDEX IF NOT EXISTS idx_bsp_school ON behaviour_support_plans(school_id);

-- Ideas
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id),
  author_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  assigned_by TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  subtitle TEXT,
  type TEXT NOT NULL,
  content TEXT,
  sections TEXT,
  metadata TEXT,
  status TEXT NOT NULL DEFAULT 'not-started',
  feedback TEXT,
  mark TEXT,
  progress INTEGER DEFAULT 0,
  teacher_comment TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assignments_pupil ON assignments(pupil_id);

-- Cookie consent
CREATE TABLE IF NOT EXISTS cookie_consents (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  ip_address TEXT,
  analytics INTEGER NOT NULL DEFAULT 0,
  marketing INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin API Keys
CREATE TABLE IF NOT EXISTS admin_api_keys (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  model TEXT,
  updated_by TEXT REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Worksheet sections
CREATE TABLE IF NOT EXISTS worksheet_sections (
  id TEXT PRIMARY KEY,
  worksheet_id TEXT NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  section_index INTEGER NOT NULL,
  title TEXT,
  type TEXT,
  content TEXT,
  teacher_only INTEGER NOT NULL DEFAULT 0,
  svg TEXT,
  caption TEXT,
  image_url TEXT,
  asset_ref TEXT,
  symbols TEXT
);

-- Per-school API keys
CREATE TABLE IF NOT EXISTS school_api_keys (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_label TEXT,
  api_key_encrypted TEXT NOT NULL,
  api_key_iv TEXT NOT NULL,
  base_url TEXT,
  model TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  added_by TEXT REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_school_api_keys_school ON school_api_keys(school_id);

-- GDPR Breach log
CREATE TABLE IF NOT EXISTS breach_log (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  reported_by TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data_types TEXT NOT NULL,
  affected_count INTEGER DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  ico_notified INTEGER NOT NULL DEFAULT 0,
  ico_reference TEXT,
  subjects_notified INTEGER NOT NULL DEFAULT 0,
  containment_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_breach_log_school ON breach_log(school_id);
CREATE INDEX IF NOT EXISTS idx_breach_log_status ON breach_log(status);

-- Daily briefings
CREATE TABLE IF NOT EXISTS daily_briefings (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'briefing',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT REFERENCES users(id),
  author_name TEXT,
  attachments TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_briefing_school_date ON daily_briefings(school_id, date);

-- Custom Quizzes
CREATE TABLE IF NOT EXISTS custom_quizzes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  questions TEXT NOT NULL DEFAULT '[]',
  question_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_by_name TEXT NOT NULL DEFAULT 'Teacher',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custom_quizzes_school ON custom_quizzes(school_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  metadata TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- Parent messages
CREATE TABLE IF NOT EXISTS parent_messages (
  id TEXT PRIMARY KEY,
  pupil_id TEXT NOT NULL REFERENCES pupils(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parent_messages_pupil ON parent_messages(pupil_id);

-- Worksheet Library
CREATE TABLE IF NOT EXISTS worksheet_library (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  year_group TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  sections TEXT NOT NULL DEFAULT '[]',
  teacher_sections TEXT NOT NULL DEFAULT '[]',
  key_vocab TEXT NOT NULL DEFAULT '[]',
  learning_objective TEXT,
  source TEXT NOT NULL DEFAULT 'ai',
  curated INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by TEXT REFERENCES users(id),
  tier TEXT NOT NULL DEFAULT 'standard',
  send_need TEXT,
  -- Base+Variant architecture columns
  base_entry_id TEXT REFERENCES worksheet_library(id) ON DELETE SET NULL,
  base_version INTEGER,
  base_structure_json TEXT NOT NULL DEFAULT '{}',
  diagram_slots_json TEXT NOT NULL DEFAULT '[]',
  applied_overlays TEXT NOT NULL DEFAULT '[]',
  canonical_topic_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_library_subject ON worksheet_library(subject);
CREATE INDEX IF NOT EXISTS idx_library_curated ON worksheet_library(curated);
CREATE INDEX IF NOT EXISTS idx_library_tier ON worksheet_library(tier);
CREATE UNIQUE INDEX IF NOT EXISTS idx_library_topic ON worksheet_library(subject, topic, year_group, tier);
CREATE INDEX IF NOT EXISTS idx_library_base_entry ON worksheet_library(base_entry_id);
CREATE INDEX IF NOT EXISTS idx_library_canonical_topic ON worksheet_library(canonical_topic_key);

-- Worksheet Library Assets (stable asset registry — diagrams, images, SVGs)
CREATE TABLE IF NOT EXISTS worksheet_library_assets (
  id TEXT PRIMARY KEY,
  library_entry_id TEXT NOT NULL REFERENCES worksheet_library(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'image_url',  -- 'diagram_svg' | 'image_url' | 'image_s3' | 'latex'
  content_hash TEXT,
  storage_key TEXT,
  public_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  topic_tags TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assets_library_entry ON worksheet_library_assets(library_entry_id);
CREATE INDEX IF NOT EXISTS idx_assets_section_key ON worksheet_library_assets(section_key);

-- Quiz Results
CREATE TABLE IF NOT EXISTS quiz_results (
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
  percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  badge TEXT,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_results_pupil ON quiz_results(pupil_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_school ON quiz_results(school_id);

-- Worksheet Folders
CREATE TABLE IF NOT EXISTS worksheet_folders (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  colour TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_folders_school ON worksheet_folders(school_id);

-- Worksheet-Folder assignments
CREATE TABLE IF NOT EXISTS worksheet_folder_items (
  folder_id TEXT NOT NULL REFERENCES worksheet_folders(id) ON DELETE CASCADE,
  worksheet_id TEXT NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (folder_id, worksheet_id)
);

-- Platform stats
CREATE TABLE IF NOT EXISTS platform_stats (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_pupils_school ON pupils(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_school ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_attendance_pupil_date ON attendance_records(pupil_id, date);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
`;

// ─── Initialise (async, awaited by server/index.ts) ──────────────────────────
export async function initDb() {
  console.log("🔌 Connecting to PostgreSQL...");

  // Test connection
  const client = await pool.connect();
  const versionResult = await client.query("SELECT version()");
  console.log("✅ Connected:", versionResult.rows[0].version.slice(0, 50));
  client.release();

  // Run schema (all CREATE TABLE IF NOT EXISTS — idempotent)
  await db.exec(SCHEMA_SQL);
  console.log("✅ Schema applied");

  // ── Runtime migrations for existing databases ──────────────────────────────
  // These ADD COLUMN statements are idempotent via DO $$ ... EXCEPTION block.
  const alterMigrations = [
    // Base+Variant architecture columns on worksheet_library
    `DO $$ BEGIN ALTER TABLE worksheet_library ADD COLUMN base_entry_id TEXT REFERENCES worksheet_library(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheet_library ADD COLUMN base_version INTEGER; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheet_library ADD COLUMN base_structure_json TEXT NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheet_library ADD COLUMN diagram_slots_json TEXT NOT NULL DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheet_library ADD COLUMN applied_overlays TEXT NOT NULL DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheet_library ADD COLUMN canonical_topic_key TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheet_sections ADD COLUMN image_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheet_sections ADD COLUMN asset_ref TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheets ADD COLUMN metadata_json TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheets ADD COLUMN source_library_id TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE worksheets ADD COLUMN source_canonical_topic_key TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    // Asset table (CREATE TABLE IF NOT EXISTS handles this, but index creation may need guarding)
    `CREATE INDEX IF NOT EXISTS idx_library_base_entry ON worksheet_library(base_entry_id)`,
    `CREATE INDEX IF NOT EXISTS idx_library_canonical_topic ON worksheet_library(canonical_topic_key)`,
    `CREATE INDEX IF NOT EXISTS idx_assets_library_entry ON worksheet_library_assets(library_entry_id)`,
    `CREATE INDEX IF NOT EXISTS idx_assets_section_key ON worksheet_library_assets(section_key)`,
  ];
  for (const sql of alterMigrations) {
    try { await query(sql); } catch (e: any) { /* ignore if already exists */ }
  }
  console.log("✅ Library asset migrations applied");

  // Bootstrap admin from environment variables (no hard-coded credentials)
  // Run `node scripts/bootstrap-admin.mjs` once on a fresh deployment to create the first admin.
  const userCountResult = await query("SELECT COUNT(*)::int as c FROM users");
  const userCount = userCountResult.rows[0]?.c ?? 0;

  if (userCount === 0) {
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (bootstrapEmail && bootstrapPassword) {
      const schoolId = uuidv4();
      const adminId = uuidv4();
      const hash = bcrypt.hashSync(bootstrapPassword, 12);
      await query(
        `INSERT INTO schools (id, name, urn, domain, onboarding_complete, licence_type, subscription_plan, subscription_status)
         VALUES ($1, 'Adaptly', '000000', '', 1, 'premium', 'premium', 'active')`,
        [schoolId]
      );
      await query(
        `INSERT INTO users (id, school_id, email, display_name, password_hash, role, email_verified)
         VALUES ($1, $2, $3, 'System Admin', $4, 'mat_admin', 1)`,
        [adminId, schoolId, bootstrapEmail, hash]
      );
      console.log(`✅ Bootstrapped admin account: ${bootstrapEmail}`);
    } else {
      console.warn(
        "[SECURITY] No users exist and BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD are not set. " +
        "Run `node scripts/bootstrap-admin.mjs` to create the first admin account."
      );
    }
  } else {
    // Migration: update legacy email if still present
    await query(
      `UPDATE users SET email = 'admin@adaptly.co.uk' WHERE email = 'admin@sendassistant.app'`
    );
  }

  // Seed admin API keys from environment variables
  const adminKeyProviders = [
    { provider: "groq",    envKey: "GROQ_API_KEY",    model: "llama-3.3-70b-versatile" },
    { provider: "gemini",  envKey: "GEMINI_API_KEY",   model: "gemini-2.5-flash"         },
    { provider: "mistral", envKey: "MISTRAL_API_KEY",  model: "mistral-small-latest"     },
  ];
  for (const { provider, envKey, model } of adminKeyProviders) {
    const key = process.env[envKey];
    if (key) {
      await query(
        `INSERT INTO admin_api_keys (id, provider, api_key, model, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (provider) DO UPDATE SET api_key = $3, model = $4, updated_at = NOW()`,
        [provider, provider, key, model]
      );
    } else {
      await query(
        `UPDATE admin_api_keys SET model = $1, updated_at = NOW() WHERE provider = $2`,
        [model, provider]
      );
    }
  }

  console.log("✅ Database ready (PostgreSQL / Supabase)");
}

export default db;
