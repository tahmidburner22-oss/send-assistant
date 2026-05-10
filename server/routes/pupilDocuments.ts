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
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const ALLOWED_TYPES = new Set(["cv", "personal_statement", "cover_letter"]);

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
  if (parentCode && parentCode.toUpperCase().trim() === (pupil.code || "").toUpperCase()) {
    return { pupil, role: "parent", userId: null };
  }

  return { error: "Access denied", status: 403 };
}

// Parent routes don't require requireAuth (they use x-parent-code). Teacher
// routes need a valid session. We try to authenticate without responding on
// failure — if no valid token is present, req.user stays undefined and the
// parent-code path is tried instead.
async function tryAuth(req: Request, res: Response, next: () => void) {
  // Only attempt JWT-based auth if there's a token. We can't call requireAuth
  // directly because it responds with 401 on failure, which would prevent the
  // parent-code fallback from running.
  const hasCookie = typeof req.headers.cookie === "string" && /(?:^|;\s*)token=/.test(req.headers.cookie);
  const hasAuthHeader = typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ");

  if (!hasCookie && !hasAuthHeader) {
    // No token provided — skip straight to parent-code fallback
    return next();
  }

  // Create a fake response that swallows 401s so requireAuth doesn't short-circuit
  const originalStatus = res.status.bind(res);
  const originalJson = res.json.bind(res);
  let intercepted = false;
  (res as any).status = (code: number) => {
    if (code === 401 || code === 403) { intercepted = true; return { json: () => res }; }
    return originalStatus(code);
  };
  (res as any).json = (body: unknown) => {
    if (intercepted) { return res; }
    return originalJson(body);
  };

  try {
    await new Promise<void>((resolve) => {
      requireAuth(req, res, (() => resolve()) as any);
    });
  } catch {
    /* ignore */
  } finally {
    (res as any).status = originalStatus;
    (res as any).json = originalJson;
  }
  next();
}

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
  const access = await resolvePupilAccess(req);
  if ("error" in access) return res.status(access.status).json({ error: access.error });

  const rows = (await db.prepare(
    `SELECT * FROM pupil_documents WHERE pupil_id = ? ORDER BY updated_at DESC`
  ).all(access.pupil.id)) as any[];
  res.json(rows.map(rowToDoc));
});

// ── GET /api/pupil-documents/:pupilId/:id — fetch a single doc ───────────────
router.get("/:pupilId/:id", tryAuth, async (req: Request, res: Response) => {
  const access = await resolvePupilAccess(req);
  if ("error" in access) return res.status(access.status).json({ error: access.error });

  const row = (await db.prepare(
    `SELECT * FROM pupil_documents WHERE pupil_id = ? AND id = ?`
  ).get(access.pupil.id, req.params.id)) as any;
  if (!row) return res.status(404).json({ error: "Document not found" });
  res.json(rowToDoc(row));
});

// ── POST /api/pupil-documents/:pupilId — create a doc ────────────────────────
router.post("/:pupilId", tryAuth, async (req: Request, res: Response) => {
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
});

// ── PUT /api/pupil-documents/:pupilId/:id — update a doc ─────────────────────
router.put("/:pupilId/:id", tryAuth, async (req: Request, res: Response) => {
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
});

// ── DELETE /api/pupil-documents/:pupilId/:id ─────────────────────────────────
router.delete("/:pupilId/:id", tryAuth, async (req: Request, res: Response) => {
  const access = await resolvePupilAccess(req);
  if ("error" in access) return res.status(access.status).json({ error: access.error });

  await db.prepare(
    `DELETE FROM pupil_documents WHERE pupil_id = ? AND id = ?`
  ).run(access.pupil.id, req.params.id);
  res.json({ success: true });
});

export default router;
