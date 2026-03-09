-- SEND Assistant Database Schema
-- Self-contained SQLite, no external dependencies

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- Multi-Academy Trusts
CREATE TABLE IF NOT EXISTS mats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Schools
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  mat_id TEXT REFERENCES mats(id),
  name TEXT NOT NULL,
  urn TEXT UNIQUE,
  address TEXT,
  phase TEXT, -- primary/secondary/all-through
  domain TEXT, -- e.g. school.sch.uk for domain-restricted registration
  dsl_name TEXT,
  dsl_email TEXT,
  dsl_phone TEXT,
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  trial_ends_at TEXT,
  licence_type TEXT DEFAULT 'trial', -- trial/starter/professional/enterprise
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'teacher', -- mat_admin/school_admin/senco/teacher/ta
  is_active INTEGER NOT NULL DEFAULT 1,
  email_verified INTEGER NOT NULL DEFAULT 0,
  email_verify_token TEXT,
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  mfa_secret TEXT,
  google_id TEXT UNIQUE,
  last_login_at TEXT,
  onboarding_done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deactivated_at TEXT,
  deactivated_by TEXT
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  school_id TEXT REFERENCES schools(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT, -- JSON
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pupils (children)
CREATE TABLE IF NOT EXISTS pupils (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  year_group TEXT,
  send_need TEXT,
  code TEXT,
  upn TEXT, -- Unique Pupil Number
  dob TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pupil audit trail
CREATE TABLE IF NOT EXISTS pupil_audit (
  id TEXT PRIMARY KEY,
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  changed_by TEXT REFERENCES users(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Safeguarding incidents
CREATE TABLE IF NOT EXISTS safeguarding_incidents (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  pupil_id TEXT REFERENCES pupils(id),
  reported_by TEXT NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  ai_trigger TEXT, -- what AI output triggered this
  severity TEXT NOT NULL DEFAULT 'low', -- low/medium/high/critical
  status TEXT NOT NULL DEFAULT 'open', -- open/reviewed/closed
  dsl_notified INTEGER NOT NULL DEFAULT 0,
  dsl_notified_at TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  characters TEXT, -- JSON array
  setting TEXT,
  theme TEXT,
  reading_level TEXT,
  length TEXT,
  content TEXT,
  comprehension_questions TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(pupil_id, date)
);

-- Behaviour records
CREATE TABLE IF NOT EXISTS behaviour_records (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  recorded_by TEXT REFERENCES users(id),
  type TEXT NOT NULL, -- positive/concern
  category TEXT,
  description TEXT,
  action_taken TEXT,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Behaviour Support Plans (saved from AI tool, visible in Parent Portal)
CREATE TABLE IF NOT EXISTS behaviour_support_plans (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  created_by TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,           -- full AI-generated plan text
  summary TEXT,                    -- short summary for parent portal card
  strategies TEXT,                 -- extracted strategies for parent portal
  positive_targets TEXT,           -- extracted positive targets
  status TEXT NOT NULL DEFAULT 'active', -- active | review | archived
  review_date TEXT,
  shared_with_parents INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bsp_pupil ON behaviour_support_plans(pupil_id);
CREATE INDEX IF NOT EXISTS idx_bsp_school ON behaviour_support_plans(school_id);

-- Ideas (community board)
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id),
  author_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  pupil_id TEXT NOT NULL REFERENCES pupils(id),
  assigned_by TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- worksheet/story
  content TEXT,
  status TEXT NOT NULL DEFAULT 'not-started',
  feedback TEXT,
  mark TEXT,
  progress INTEGER DEFAULT 0,
  teacher_comment TEXT,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cookie consent
CREATE TABLE IF NOT EXISTS cookie_consents (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  ip_address TEXT,
  analytics INTEGER NOT NULL DEFAULT 0,
  marketing INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Admin API Keys (server-side keys set by admin, used as fallback for all users)
CREATE TABLE IF NOT EXISTS admin_api_keys (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE, -- groq/gemini/openai/openrouter/claude/huggingface
  api_key TEXT NOT NULL,
  model TEXT, -- optional preferred model
  updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- System settings (key-value store for admin-configurable settings)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Worksheet sections (for full re-editing support)
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
  symbols TEXT -- JSON: array of {word, svgPath} for Widgit-style symbols
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_pupils_school ON pupils(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_school ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_pupil_date ON attendance_records(pupil_id, date);

-- Per-school AI API keys (set by school admin, used by all users in that school)
-- Keys are stored encrypted using AES-256-GCM with a server-side secret
CREATE TABLE IF NOT EXISTS school_api_keys (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- groq/gemini/openai/openrouter/claude/huggingface/custom
  provider_label TEXT, -- display name for custom providers
  api_key_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted
  api_key_iv TEXT NOT NULL, -- initialisation vector for decryption
  base_url TEXT, -- for custom/self-hosted providers
  model TEXT, -- preferred model for this provider
  enabled INTEGER NOT NULL DEFAULT 1,
  added_by TEXT REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(school_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_school_api_keys_school ON school_api_keys(school_id);

-- ── GDPR Data Breach Notification Log (Art. 33/34 UK GDPR) ──────────────────
CREATE TABLE IF NOT EXISTS breach_log (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  reported_by TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data_types TEXT NOT NULL,         -- comma-separated: names, emails, SEND data, etc.
  affected_count INTEGER DEFAULT 0, -- estimated number of affected individuals
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  status TEXT NOT NULL DEFAULT 'open',     -- open | investigating | resolved | closed
  ico_notified INTEGER NOT NULL DEFAULT 0, -- 1 = ICO notified within 72hrs
  ico_reference TEXT,               -- ICO case reference if notified
  subjects_notified INTEGER NOT NULL DEFAULT 0, -- 1 = affected data subjects notified
  containment_action TEXT,          -- steps taken to contain the breach
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_breach_log_school ON breach_log(school_id);
CREATE INDEX IF NOT EXISTS idx_breach_log_status ON breach_log(status);
