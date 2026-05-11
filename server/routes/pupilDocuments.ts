/**
 * Pupil Documents — CV, Personal Statement, Cover Letter.
 *
 * Storage model:
 *   - Pupil-owned content, authored via Parent Portal.
 *   - Teachers can view (read-only) from the Children / pupil profile page.
 *   - Access is one of:
 *       (a) authenticated teacher at the pupil's school, OR
 *       (b) parent with the correct pupil access code (via X-Parent-Code header
 *           or ?code= query param — matches the pupil's `code` column).
 *
 * Doc types allowed: 'cv' | 'personal_statement' | 'cover_letter'.
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { tryAuthOptional } from "../middleware/auth.js";

const router = Router();

const ALLOWED_TYPES = new Set(["cv", "personal_statement", "cover_letter"]);

let ensuredPupilDocuments = false;
async function ensurePupilDocumentsTable() {
  if (ensuredPupilDocuments) return;
  await db.exec(`
CREATE TABLE IF NOT EXISTS pupil_documents (
  id TEXT PRIMARY KEY,
  pupil_id TEXT NOT NULL REFERENCES pupils(id) ON DELETE CASCADE,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  fields_json TEXT NOT NULL DEFAULT '{}',
  content TEXT,
  updated_by TEXT REFERENCES users(id),
  updated_by_role TEXT NOT NULL DEFAULT 'parent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pupil_documents_pupil ON pupil_documents(pupil_id);
CREATE INDEX IF NOT EXISTS idx_pupil_documents_school ON pupil_documents(school_id);
`);
  const migrations = [
    `DO $$ BEGIN ALTER TABLE pupil_documents ADD COLUMN school_id TEXT REFERENCES schools(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE pupil_documents ADD COLUMN doc_type TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE pupil_documents ADD COLUMN title TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE pupil_documents ADD COLUMN fields_json TEXT NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE pupil_documents ADD COLUMN content TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE pupil_documents ADD COLUMN updated_by TEXT REFERENCES users(id); EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE pupil_documents ADD COLUMN updated_by_role TEXT NOT NULL DEFAULT 'parent'; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE pupil_documents ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE pupil_documents ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
  ];
  for (const sql of migrations) await db.exec(sql);
  ensuredPupilDocuments = true;
}

function handleRouteError(res: Response, label: string, err: any) {
  console.error(`[pupil-documents] ${label}:`, err?.message || err);
  if (!res.headersSent) res.status(500).json({ error: "Document tool is temporarily unavailable. Please try again." });
}

// ── Access helper ────────────────────────────────────────────────────────────
async function resolvePupilAccess(req: Request): Promise<
  | { pupil: any; role: "teacher" | "parent"; userId: string | null }
  | { error: string; status: number }
> {
  const pupilId = req.params.pupilId;
  if (!pupilId) return { error: "pupilId required", status: 400 };

  const pupil = (await db.prepare("SELECT * FROM pupils WHERE id = ?").get(pupilId)) as any;
  if (!pupil) return { error: "Pupil not found", status: 404 };

  const user = req.user;
  if (user && user.schoolId === pupil.school_id) {
    return { pupil, role: "teacher", userId: user.id };
  }

  const parentCode = (req.headers["x-parent-code"] as string) || (req.query.code as string) || "";
  if (parentCode) {
    const normalised = parentCode.trim().toUpperCase();
    const pupilCode = (pupil.code || "").toString().trim().toUpperCase();
    const parentAccessCode = (pupil.parent_access_code || "").toString().trim().toUpperCase();
    if (normalised && (normalised === pupilCode || normalised === parentAccessCode)) {
      return { pupil, role: "parent", userId: null };
    }
  }

  return { error: "Access denied", status: 403 };
}

// Parent routes don't require requireAuth (they use x-parent-code). Teacher
// routes need a valid session — we populate req.user if a valid token is
// present, but never respond with an error or hang the request if not. The
// route handler then decides which auth path succeeded.
//
// Previous implementation wrapped `requireAuth` and monkey-patched `res.status`
// to swallow 401s, but `requireAuth` never calls `next()` on failure, so the
// wrapper hung until the client timed out. That broke the CV / Personal
// Statement / Cover Letter builders entirely for parents.
const tryAuth = tryAuthOptional;

function rowToDoc(r: any) {
  if (!r) return null;
  let fields: any = {};
  try { fields = r.fields_json ? JSON.parse(r.fields_json) : {}; } catch {}
  return {
    id: r.id,
    pupilId: r.pupil_id,
    schoolId: r.school_id,
    docType: r.doc_type,
    title: r.title,
    fields,
    content: r.content || "",
    updatedBy: r.updated_by || null,
    updatedByRole: r.updated_by_role || "parent",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── GET /api/pupil-documents/:pupilId — list all docs for a pupil ────────────
router.get("/:pupilId", tryAuth, async (req: Request, res: Response) => {
  try {
  await ensurePupilDocumentsTable();
  const access = await resolvePupilAccess(req);
  if ("error" in access) return res.status(access.status).json({ error: access.error });

  const rows = (await db.prepare(
    `SELECT * FROM pupil_documents WHERE pupil_id = ? ORDER BY updated_at DESC`
  ).all(access.pupil.id)) as any[];
  res.json(rows.map(rowToDoc));
  } catch (err) { handleRouteError(res, "list", err); }
});

// ── GET /api/pupil-documents/:pupilId/:id — fetch a single doc ───────────────
router.get("/:pupilId/:id", tryAuth, async (req: Request, res: Response) => {
  try {
  await ensurePupilDocumentsTable();
  const access = await resolvePupilAccess(req);
  if ("error" in access) return res.status(access.status).json({ error: access.error });

  const row = (await db.prepare(
    `SELECT * FROM pupil_documents WHERE pupil_id = ? AND id = ?`
  ).get(access.pupil.id, req.params.id)) as any;
  if (!row) return res.status(404).json({ error: "Document not found" });
  res.json(rowToDoc(row));
  } catch (err) { handleRouteError(res, "get", err); }
});

// ── POST /api/pupil-documents/:pupilId — create a doc ────────────────────────
router.post("/:pupilId", tryAuth, async (req: Request, res: Response) => {
  try {
  await ensurePupilDocumentsTable();
  const access = await resolvePupilAccess(req);
  if ("error" in access) return res.status(access.status).json({ error: access.error });

  const { docType, title, fields, content } = req.body || {};
  if (!ALLOWED_TYPES.has(docType)) {
    return res.status(400).json({ error: `docType must be one of ${[...ALLOWED_TYPES].join(", ")}` });
  }
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title required" });
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  await db.prepare(
    `INSERT INTO pupil_documents
     (id, pupil_id, school_id, doc_type, title, fields_json, content, updated_by, updated_by_role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    access.pupil.id,
    access.pupil.school_id,
    docType,
    title.slice(0, 300),
    JSON.stringify(fields || {}),
    (content || "").slice(0, 20000),
    access.userId,
    access.role,
    now,
    now
  );

  const row = (await db.prepare(`SELECT * FROM pupil_documents WHERE id = ?`).get(id)) as any;
  res.status(201).json(rowToDoc(row));
  } catch (err) { handleRouteError(res, "create", err); }
});

// ── PUT /api/pupil-documents/:pupilId/:id — update a doc ─────────────────────
router.put("/:pupilId/:id", tryAuth, async (req: Request, res: Response) => {
  try {
  await ensurePupilDocumentsTable();
  const access = await resolvePupilAccess(req);
  if ("error" in access) return res.status(access.status).json({ error: access.error });

  const existing = (await db.prepare(
    `SELECT * FROM pupil_documents WHERE pupil_id = ? AND id = ?`
  ).get(access.pupil.id, req.params.id)) as any;
  if (!existing) return res.status(404).json({ error: "Document not found" });

  const { title, fields, content } = req.body || {};
  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE pupil_documents
     SET title = COALESCE(?, title),
         fields_json = COALESCE(?, fields_json),
         content = COALESCE(?, content),
         updated_by = ?,
         updated_by_role = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(
    title ? title.slice(0, 300) : null,
    fields !== undefined ? JSON.stringify(fields) : null,
    content !== undefined ? content.slice(0, 20000) : null,
    access.userId,
    access.role,
    now,
    req.params.id
  );

  const row = (await db.prepare(`SELECT * FROM pupil_documents WHERE id = ?`).get(req.params.id)) as any;
  res.json(rowToDoc(row));
  } catch (err) { handleRouteError(res, "update", err); }
});

// ── DELETE /api/pupil-documents/:pupilId/:id ─────────────────────────────────
router.delete("/:pupilId/:id", tryAuth, async (req: Request, res: Response) => {
  try {
  await ensurePupilDocumentsTable();
  const access = await resolvePupilAccess(req);
  if ("error" in access) return res.status(access.status).json({ error: access.error });

  await db.prepare(
    `DELETE FROM pupil_documents WHERE pupil_id = ? AND id = ?`
  ).run(access.pupil.id, req.params.id);
  res.json({ success: true });
  } catch (err) { handleRouteError(res, "delete", err); }
});

export default router;
