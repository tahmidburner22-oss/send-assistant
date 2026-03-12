/**
 * MIS Integration Routes
 * Handles Bromcom and Arbor MIS data import:
 *  - POST /api/mis/import-csv        — parse uploaded CSV and bulk-upsert pupils
 *  - POST /api/mis/sync/:provider    — full sync: pupils + behaviour + attendance + comments
 *  - GET  /api/mis/status            — return which MIS providers are configured
 *  - POST /api/mis/save-key          — save encrypted MIS API credentials
 *  - DELETE /api/mis/remove-key/:p   — remove MIS credentials
 *  - GET  /api/mis/comments          — list pupil comments for the school
 *  - POST /api/mis/comments          — add a manual pupil comment
 *  - DELETE /api/mis/comments/:id    — delete a pupil comment
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, requireAdmin, auditLog } from "../middleware/auth.js";
import crypto from "crypto";

const router = Router();

// ── Helper: check if school is on premium plan ────────────────────────────────
const PLATFORM_OWNER_EMAILS = ["admin@adaptly.co.uk", "admin@sendassistant.app"];

function isPremiumSchool(schoolId: string, userEmail?: string): boolean {
  // 1. Direct check for platform owner email
  if (userEmail && PLATFORM_OWNER_EMAILS.includes(userEmail.toLowerCase())) return true;

  if (!schoolId) return false;

  // 2. Check if any platform owner user belongs to this school
  const ownerUser = db.prepare(
    "SELECT id FROM users WHERE school_id = ? AND email IN ('admin@adaptly.co.uk','admin@sendassistant.app') LIMIT 1"
  ).get(schoolId) as any;
  if (ownerUser) return true;

  // 3. Check school name and plan
  const school = db.prepare(
    "SELECT subscription_plan, licence_type, name FROM schools WHERE id = ?"
  ).get(schoolId) as any;
  if (!school) return false;
  const schoolName = (school.name || "").toLowerCase();
  if (schoolName === "adaptly" || schoolName === "adaptly demo" || schoolName === "system") return true;
  const plan = (school.subscription_plan || school.licence_type || "").toLowerCase();
  return ["premium", "mat", "enterprise"].includes(plan);
}

// ── Helper: decrypt a stored MIS API key ─────────────────────────────────────
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "adaptly-default-key-32-chars-pad";
const KEY_BUF = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));

function decryptKey(encryptedB64: string, ivB64: string): string {
  const data = Buffer.from(encryptedB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const tag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY_BUF, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

function encryptKey(plaintext: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY_BUF, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, tag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

// ── Helper: map year group strings from MIS to Adaptly format ────────────────
function normaliseYearGroup(raw: string | undefined): string {
  if (!raw) return "";
  const s = raw.toString().trim().toLowerCase();
  if (s === "nursery" || s === "n") return "Nursery";
  if (s === "reception" || s === "r" || s === "rec") return "Reception";
  const match = s.match(/(\d+)/);
  if (match) {
    const n = parseInt(match[1]);
    if (n >= 1 && n <= 13) return `Year ${n}`;
  }
  return raw.trim();
}

// ── Helper: map SEND need strings ────────────────────────────────────────────
function normaliseSendNeed(raw: string | undefined): string {
  if (!raw) return "";
  const s = raw.toString().trim().toLowerCase();
  if (s.includes("dyslexia")) return "Dyslexia";
  if (s.includes("adhd") || s.includes("attention")) return "ADHD";
  if (s.includes("autism") || s.includes("asc") || s.includes("asd")) return "Autism";
  if (s.includes("dyspraxia") || s.includes("dcd")) return "Dyspraxia";
  if (s.includes("dyscalculia")) return "Dyscalculia";
  if (s.includes("speech") || s.includes("slcn") || s.includes("language")) return "SLCN";
  if (s.includes("visual") || s.includes("vi")) return "Visual Impairment";
  if (s.includes("hearing") || s.includes("hi")) return "Hearing Impairment";
  if (s.includes("mld") || s.includes("learning difficulty")) return "MLD";
  if (s.includes("ehc") || s.includes("ehcp")) return "EHC Plan";
  if (s === "none" || s === "no send" || s === "") return "";
  return raw.trim();
}

// ── Helper: normalise attendance code from MIS ───────────────────────────────
function normaliseAttendanceStatus(code: string | undefined): string {
  if (!code) return "not-recorded";
  const c = code.toString().trim().toUpperCase();
  // Present codes
  if (["P", "L", "U", "B", "V", "W", "PRESENT", "1"].includes(c)) return "present";
  // Authorised absence
  if (["A", "H", "I", "J", "M", "R", "S", "T", "AUTHORISED", "AUTH"].includes(c)) return "authorised";
  // Unauthorised absence
  if (["G", "N", "O", "U", "X", "UNAUTHORISED", "UNAUTH"].includes(c)) return "unauthorised";
  // Late
  if (["L", "LATE"].includes(c)) return "late";
  return "not-recorded";
}

// ── Helper: normalise behaviour type ─────────────────────────────────────────
function normaliseBehaviourType(raw: string | undefined): "positive" | "concern" {
  if (!raw) return "concern";
  const s = raw.toString().trim().toLowerCase();
  if (s.includes("positive") || s.includes("reward") || s.includes("praise") ||
      s.includes("achievement") || s.includes("merit") || s.includes("good") ||
      s.includes("commendation") || s.includes("star") || s.includes("point")) {
    return "positive";
  }
  return "concern";
}

// ── Helper: normalise comment type ───────────────────────────────────────────
function normaliseCommentType(raw: string | undefined): "positive" | "negative" | "neutral" | "safeguarding" {
  if (!raw) return "neutral";
  const s = raw.toString().trim().toLowerCase();
  if (s.includes("positive") || s.includes("praise") || s.includes("good") || s.includes("achievement")) return "positive";
  if (s.includes("concern") || s.includes("negative") || s.includes("issue") || s.includes("incident")) return "negative";
  if (s.includes("safeguard") || s.includes("welfare") || s.includes("child protection")) return "safeguarding";
  return "neutral";
}

// ── Helper: safe ISO date string ─────────────────────────────────────────────
function toISODate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch { /* fall through */ }
  return new Date().toISOString().slice(0, 10);
}

// ── Helper: fetch from MIS API with retry ────────────────────────────────────
async function misFetch(url: string, headers: Record<string, string>): Promise<any> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ── Helper: build MIS API headers ────────────────────────────────────────────
function buildHeaders(provider: string, apiKey: string): Record<string, string> {
  if (provider === "bromcom") {
    return { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" };
  }
  // Arbor uses HTTP Basic auth
  return {
    "Authorization": `Basic ${Buffer.from(apiKey).toString("base64")}`,
    "Accept": "application/json",
  };
}

// ── POST /api/mis/import-csv ─────────────────────────────────────────────────
router.post("/import-csv", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });

  const { rows } = req.body as { rows: any[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "No rows provided" });
  }
  if (rows.length > 2000) {
    return res.status(400).json({ error: "Maximum 2000 pupils per import" });
  }

  let created = 0, updated = 0, skipped = 0;
  const errors: string[] = [];

  const insertStmt = db.prepare(
    `INSERT INTO pupils (id, school_id, name, year_group, send_need, code, upn, dob, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updateStmt = db.prepare(
    `UPDATE pupils SET name=?, year_group=?, send_need=?, dob=?, updated_at=datetime('now')
     WHERE school_id=? AND upn=? AND is_active=1`
  );
  const findByUpn = db.prepare("SELECT id FROM pupils WHERE school_id=? AND upn=? AND is_active=1");
  const findByName = db.prepare("SELECT id FROM pupils WHERE school_id=? AND name=? AND is_active=1");

  const importTx = db.transaction(() => {
    for (const row of rows) {
      const name = (row.name || row.Name || row["Preferred Name"] || row["Legal Name"] || "").toString().trim();
      if (!name) { skipped++; continue; }
      const yearGroup = normaliseYearGroup(row.yearGroup || row["Year Group"] || row["Year"] || row["year_group"] || "");
      const sendNeed = normaliseSendNeed(row.sendNeed || row["SEN Status"] || row["SEND Need"] || row["SEN Need"] || row["send_need"] || "");
      const upn = (row.upn || row.UPN || row["Unique Pupil Number"] || "").toString().trim() || null;
      const dob = (row.dob || row.DOB || row["Date of Birth"] || row["DateOfBirth"] || "").toString().trim() || null;

      if (upn) {
        const existing = findByUpn.get(schoolId, upn) as any;
        if (existing) {
          updateStmt.run(name, yearGroup || null, sendNeed || null, dob || null, schoolId, upn);
          updated++;
          continue;
        }
      } else {
        const existing = findByName.get(schoolId, name) as any;
        if (existing) { skipped++; continue; }
      }

      const id = uuidv4();
      const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();
      try {
        insertStmt.run(id, schoolId, name, yearGroup || null, sendNeed || null, code, upn, dob, req.user!.id);
        created++;
      } catch (e: any) {
        errors.push(`Row "${name}": ${e.message}`);
        skipped++;
      }
    }
  });

  try {
    importTx();
  } catch (e: any) {
    return res.status(500).json({ error: "Import failed: " + e.message });
  }
  auditLog(req.user!.id, schoolId, "mis.csv_import", "pupils", "bulk", { created, updated, skipped }, req.ip);
  res.json({ success: true, created, updated, skipped, errors: errors.slice(0, 10) });
});

// ── GET /api/mis/status ───────────────────────────────────────────────────────
router.get("/status", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const userEmail = req.user!.email;
  
  const isPremium = isPremiumSchool(schoolId || "", userEmail);
  if (!schoolId && !isPremium) return res.json({ bromcom: false, arbor: false, isPremium: false });
  const bromcomRow = db.prepare(
    "SELECT id FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
  ).get(schoolId, "bromcom") as any;
  const arborRow = db.prepare(
    "SELECT id FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
  ).get(schoolId, "arbor") as any;

  // Last sync info
  const lastSync = db.prepare(
    `SELECT details, created_at FROM audit_logs
     WHERE school_id=? AND action LIKE 'mis.%_sync'
     ORDER BY created_at DESC LIMIT 1`
  ).get(schoolId) as any;

  res.json({
    isPremium,
    bromcom: !!bromcomRow,
    arbor: !!arborRow,
    lastSync: lastSync ? {
      at: lastSync.created_at,
      details: JSON.parse(lastSync.details || "{}"),
    } : null,
  });
});

// ── POST /api/mis/save-key ────────────────────────────────────────────────────
router.post("/save-key", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const userEmail = req.user!.email;
  if (!schoolId && !PLATFORM_OWNER_EMAILS.includes(userEmail.toLowerCase())) {
    return res.status(400).json({ error: "No school associated with your account" });
  }
  if (!isPremiumSchool(schoolId || "", userEmail)) {
    return res.status(403).json({ error: "MIS API integration requires a Premium plan" });
  }

  const { provider, apiKey, schoolId: misSchoolId, baseUrl } = req.body;
  if (!["bromcom", "arbor"].includes(provider)) {
    return res.status(400).json({ error: "Provider must be bromcom or arbor" });
  }
  if (!apiKey) return res.status(400).json({ error: "API key is required" });

  const { encrypted, iv } = encryptKey(apiKey.trim());
  const label = provider === "bromcom" ? "Bromcom MIS" : "Arbor MIS";
  const existing = db.prepare(
    "SELECT id FROM school_api_keys WHERE school_id=? AND provider=?"
  ).get(schoolId, provider) as any;

  if (existing) {
    db.prepare(
      `UPDATE school_api_keys SET api_key_encrypted=?, api_key_iv=?, base_url=?, provider_label=?, enabled=1, added_by=?, updated_at=datetime('now')
       WHERE school_id=? AND provider=?`
    ).run(encrypted, iv, misSchoolId || baseUrl || null, label, req.user!.id, schoolId, provider);
  } else {
    db.prepare(
      `INSERT INTO school_api_keys (id, school_id, provider, provider_label, api_key_encrypted, api_key_iv, base_url, enabled, added_by)
       VALUES (?,?,?,?,?,?,?,1,?)`
    ).run(uuidv4(), schoolId, provider, label, encrypted, iv, misSchoolId || baseUrl || null, req.user!.id);
  }

  auditLog(req.user!.id, schoolId, "mis.key_saved", "school_api_keys", provider, { provider }, req.ip);
  res.json({ success: true, message: `${label} credentials saved` });
});

// ── DELETE /api/mis/remove-key/:provider ─────────────────────────────────────
router.delete("/remove-key/:provider", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  db.prepare("DELETE FROM school_api_keys WHERE school_id=? AND provider=?").run(schoolId, req.params.provider);
  auditLog(req.user!.id, schoolId, "mis.key_removed", "school_api_keys", req.params.provider, {}, req.ip);
  res.json({ success: true });
});

// ── POST /api/mis/sync/:provider ─────────────────────────────────────────────
// Full sync: pupils + behaviour + attendance + comments
router.post("/sync/:provider", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const userEmail = req.user!.email;
  if (!schoolId && !PLATFORM_OWNER_EMAILS.includes(userEmail.toLowerCase())) {
    return res.status(400).json({ error: "No school" });
  }
  if (!isPremiumSchool(schoolId || "", userEmail)) {
    return res.status(403).json({ error: "MIS API integration requires a Premium plan" });
  }

  const provider = req.params.provider as "bromcom" | "arbor";
  if (!["bromcom", "arbor"].includes(provider)) {
    return res.status(400).json({ error: "Invalid provider" });
  }

  const keyRow = db.prepare(
    "SELECT api_key_encrypted, api_key_iv, base_url FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
  ).get(schoolId, provider) as any;

  if (!keyRow) {
    return res.status(404).json({ error: `No ${provider} credentials found. Please add them in Settings first.` });
  }

  let apiKey: string;
  try {
    apiKey = decryptKey(keyRow.api_key_encrypted, keyRow.api_key_iv);
  } catch {
    return res.status(500).json({ error: "Failed to decrypt API key" });
  }

  const misSchoolId = keyRow.base_url || "";
  const headers = buildHeaders(provider, apiKey);

  // Base URLs
  const bromcomBase = "https://api.bromcom.com/v2";
  const arborBase = misSchoolId
    ? `https://${misSchoolId}.arbor.sc/api/rest/v2`
    : "https://mis.arbor.sc/api/rest/v2";
  const base = provider === "bromcom" ? bromcomBase : arborBase;

  const results = {
    pupils: { created: 0, updated: 0, skipped: 0 },
    behaviour: { created: 0, skipped: 0 },
    attendance: { created: 0, updated: 0, skipped: 0 },
    comments: { created: 0, skipped: 0 },
    errors: [] as string[],
  };

  // ── Prepared statements ──────────────────────────────────────────────────────
  const findByUpn = db.prepare("SELECT id FROM pupils WHERE school_id=? AND upn=? AND is_active=1");
  const findByName = db.prepare("SELECT id FROM pupils WHERE school_id=? AND name=? AND is_active=1");
  const insertPupil = db.prepare(
    `INSERT INTO pupils (id, school_id, name, year_group, send_need, code, upn, dob, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updatePupil = db.prepare(
    `UPDATE pupils SET name=?, year_group=?, send_need=?, dob=?, updated_at=datetime('now')
     WHERE school_id=? AND upn=? AND is_active=1`
  );
  const insertBehaviour = db.prepare(
    `INSERT OR IGNORE INTO behaviour_records
     (id, school_id, pupil_id, type, category, description, action_taken, date, points, mis_source, mis_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  );
  const insertAttendance = db.prepare(
    `INSERT INTO attendance_records
     (id, school_id, pupil_id, date, am_status, am_reason, pm_status, pm_reason, notes, mis_source, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(pupil_id, date) DO UPDATE SET
       am_status=excluded.am_status, am_reason=excluded.am_reason,
       pm_status=excluded.pm_status, pm_reason=excluded.pm_reason,
       notes=excluded.notes, mis_source=excluded.mis_source`
  );
  const insertComment = db.prepare(
    `INSERT OR IGNORE INTO pupil_comments
     (id, school_id, pupil_id, type, category, content, date, mis_source, mis_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  );

  // ── STEP 1: Sync Pupils ──────────────────────────────────────────────────────
  try {
    let rawPupils: any[] = [];
    if (provider === "bromcom") {
      const data = await misFetch(`${base}/students?schoolId=${misSchoolId}&pageSize=500`, headers);
      rawPupils = Array.isArray(data) ? data : (data.data || data.students || data.value || []);
    } else {
      const data = await misFetch(`${base}/students?page=1&perPage=500`, headers);
      rawPupils = Array.isArray(data) ? data : (data.data || data.students || data.results || []);
    }

    const pupilTx = db.transaction(() => {
      for (const s of rawPupils) {
        const name = provider === "bromcom"
          ? [s.preferredFirstName || s.firstName || s.forename, s.preferredLastName || s.lastName || s.surname].filter(Boolean).join(" ").trim()
          : [s.preferredFirstName || s.firstName, s.preferredLastName || s.lastName].filter(Boolean).join(" ").trim();
        if (!name) { results.pupils.skipped++; continue; }

        const yearGroup = normaliseYearGroup(s.yearGroup || s.year_group || s.yearGroupName || s.yearGroup?.name || "");
        const sendNeed = normaliseSendNeed(s.senStatus || s.sendNeed || s.sen_status || s.send_status || "");
        const upn = (s.upn || s.UPN || s.uniquePupilNumber || "").toString().trim() || null;
        const dob = (s.dateOfBirth || s.dob || "").toString().trim() || null;

        if (upn) {
          const existing = findByUpn.get(schoolId, upn) as any;
          if (existing) {
            updatePupil.run(name, yearGroup || null, sendNeed || null, dob || null, schoolId, upn);
            results.pupils.updated++;
            continue;
          }
        } else {
          const existing = findByName.get(schoolId, name) as any;
          if (existing) { results.pupils.skipped++; continue; }
        }

        const id = uuidv4();
        const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();
        try {
          insertPupil.run(id, schoolId, name, yearGroup || null, sendNeed || null, code, upn, dob, null);
          results.pupils.created++;
        } catch { results.pupils.skipped++; }
      }
    });
    pupilTx();
  } catch (err: any) {
    results.errors.push(`Pupils sync failed: ${err.message}`);
  }

  // ── Build pupil lookup map (misStudentId → localPupilId) ────────────────────
  // We need to map MIS student IDs to our internal pupil IDs for behaviour/attendance
  const allPupils = db.prepare(
    "SELECT id, upn, name FROM pupils WHERE school_id=? AND is_active=1"
  ).all(schoolId) as any[];
  const pupilByUpn = new Map<string, string>();
  const pupilByName = new Map<string, string>();
  for (const p of allPupils) {
    if (p.upn) pupilByUpn.set(p.upn.trim(), p.id);
    pupilByName.set(p.name.trim().toLowerCase(), p.id);
  }

  function resolvePupilId(misStudent: any): string | null {
    const upn = (misStudent?.upn || misStudent?.UPN || misStudent?.uniquePupilNumber || "").toString().trim();
    if (upn && pupilByUpn.has(upn)) return pupilByUpn.get(upn)!;
    const name = [
      misStudent?.preferredFirstName || misStudent?.firstName || misStudent?.forename || "",
      misStudent?.preferredLastName || misStudent?.lastName || misStudent?.surname || "",
    ].filter(Boolean).join(" ").trim().toLowerCase();
    if (name && pupilByName.has(name)) return pupilByName.get(name)!;
    // Try by studentId field if MIS returns a student object with id
    const studentId = (misStudent?.studentId || misStudent?.id || "").toString().trim();
    if (studentId) {
      // Look up by mis_id stored on pupil (if we stored it) — fallback to name
    }
    return null;
  }

  // ── STEP 2: Sync Behaviour Records ──────────────────────────────────────────
  try {
    let rawBehaviour: any[] = [];
    if (provider === "bromcom") {
      // Bromcom: GET /behaviourincidents or /behaviour
      try {
        const data = await misFetch(
          `${base}/behaviourincidents?schoolId=${misSchoolId}&pageSize=500&sortBy=date&sortOrder=desc`,
          headers
        );
        rawBehaviour = Array.isArray(data) ? data : (data.data || data.incidents || data.value || []);
      } catch {
        // Try alternate endpoint
        const data = await misFetch(`${base}/behaviour?schoolId=${misSchoolId}&pageSize=500`, headers);
        rawBehaviour = Array.isArray(data) ? data : (data.data || data.value || []);
      }
    } else {
      // Arbor: GET /behaviour-incidents
      try {
        const data = await misFetch(`${base}/behaviour-incidents?page=1&perPage=500`, headers);
        rawBehaviour = Array.isArray(data) ? data : (data.data || data.results || []);
      } catch {
        const data = await misFetch(`${base}/student-behaviour?page=1&perPage=500`, headers);
        rawBehaviour = Array.isArray(data) ? data : (data.data || data.results || []);
      }
    }

    // Process in batches of 100 to avoid locking DB for too long
    const BATCH = 100;
    for (let i = 0; i < rawBehaviour.length; i += BATCH) {
      const batch = rawBehaviour.slice(i, i + BATCH);
      const bTx = db.transaction(() => {
        for (const b of batch) {
          // Resolve pupil
          const student = b.student || b.pupil || b;
          const pupilId = resolvePupilId(student) ||
            (b.pupilId ? (db.prepare("SELECT id FROM pupils WHERE school_id=? AND id=?").get(schoolId, b.pupilId) as any)?.id : null);
          if (!pupilId) { results.behaviour.skipped++; continue; }

          const misId = (b.id || b.incidentId || b.behaviourId || "").toString();
          const type = normaliseBehaviourType(b.type || b.behaviourType || b.incidentType || b.category || "");
          const category = (b.category || b.behaviourCategory || b.incidentCategory || b.type || "").toString().slice(0, 100);
          const description = (b.description || b.notes || b.comment || b.incidentDescription || "").toString().slice(0, 1000);
          const actionTaken = (b.actionTaken || b.action || b.consequence || "").toString().slice(0, 500);
          const date = toISODate(b.date || b.incidentDate || b.behaviourDate || b.created_at);
          const points = parseInt(b.points || b.rewardPoints || b.demerits || "0") || 0;

          try {
            insertBehaviour.run(
              uuidv4(), schoolId, pupilId, type, category || null, description || null,
              actionTaken || null, date, points, provider, misId || null
            );
            results.behaviour.created++;
          } catch { results.behaviour.skipped++; }
        }
      });
      bTx();
    }
  } catch (err: any) {
    results.errors.push(`Behaviour sync failed: ${err.message}`);
  }

  // ── STEP 3: Sync Attendance Records ─────────────────────────────────────────
  try {
    let rawAttendance: any[] = [];
    if (provider === "bromcom") {
      try {
        const data = await misFetch(
          `${base}/attendance?schoolId=${misSchoolId}&pageSize=500&sortBy=date&sortOrder=desc`,
          headers
        );
        rawAttendance = Array.isArray(data) ? data : (data.data || data.attendance || data.value || []);
      } catch {
        const data = await misFetch(`${base}/attendanceregisters?schoolId=${misSchoolId}&pageSize=500`, headers);
        rawAttendance = Array.isArray(data) ? data : (data.data || data.value || []);
      }
    } else {
      try {
        const data = await misFetch(`${base}/attendance-marks?page=1&perPage=500`, headers);
        rawAttendance = Array.isArray(data) ? data : (data.data || data.results || []);
      } catch {
        const data = await misFetch(`${base}/student-attendance?page=1&perPage=500`, headers);
        rawAttendance = Array.isArray(data) ? data : (data.data || data.results || []);
      }
    }

    const BATCH = 100;
    for (let i = 0; i < rawAttendance.length; i += BATCH) {
      const batch = rawAttendance.slice(i, i + BATCH);
      const aTx = db.transaction(() => {
        for (const a of batch) {
          const student = a.student || a.pupil || a;
          const pupilId = resolvePupilId(student) ||
            (a.pupilId ? (db.prepare("SELECT id FROM pupils WHERE school_id=? AND id=?").get(schoolId, a.pupilId) as any)?.id : null);
          if (!pupilId) { results.attendance.skipped++; continue; }

          const date = toISODate(a.date || a.attendanceDate || a.sessionDate || a.created_at);

          // Handle both session-based (AM/PM) and single-mark formats
          let amStatus: string, pmStatus: string, amReason: string | null, pmReason: string | null;
          if (a.amMark !== undefined || a.amStatus !== undefined) {
            amStatus = normaliseAttendanceStatus(a.amMark || a.amStatus || a.am_mark);
            pmStatus = normaliseAttendanceStatus(a.pmMark || a.pmStatus || a.pm_mark);
            amReason = (a.amReason || a.am_reason || null)?.toString().slice(0, 200) || null;
            pmReason = (a.pmReason || a.pm_reason || null)?.toString().slice(0, 200) || null;
          } else {
            // Single mark — apply to both sessions
            const status = normaliseAttendanceStatus(a.mark || a.code || a.attendanceMark || a.status);
            amStatus = status;
            pmStatus = status;
            amReason = (a.reason || a.absenceReason || null)?.toString().slice(0, 200) || null;
            pmReason = amReason;
          }

          const notes = (a.notes || a.comment || "").toString().slice(0, 500) || null;

          try {
            insertAttendance.run(
              uuidv4(), schoolId, pupilId, date,
              amStatus, amReason, pmStatus, pmReason,
              notes, provider
            );
            results.attendance.created++;
          } catch { results.attendance.skipped++; }
        }
      });
      aTx();
    }
  } catch (err: any) {
    results.errors.push(`Attendance sync failed: ${err.message}`);
  }

  // ── STEP 4: Sync Comments / Notes ───────────────────────────────────────────
  try {
    let rawComments: any[] = [];
    if (provider === "bromcom") {
      try {
        const data = await misFetch(
          `${base}/studentnotes?schoolId=${misSchoolId}&pageSize=500`,
          headers
        );
        rawComments = Array.isArray(data) ? data : (data.data || data.notes || data.value || []);
      } catch {
        // Bromcom may also have /comments endpoint
        const data = await misFetch(`${base}/comments?schoolId=${misSchoolId}&pageSize=500`, headers);
        rawComments = Array.isArray(data) ? data : (data.data || data.value || []);
      }
    } else {
      try {
        const data = await misFetch(`${base}/student-notes?page=1&perPage=500`, headers);
        rawComments = Array.isArray(data) ? data : (data.data || data.results || []);
      } catch {
        const data = await misFetch(`${base}/pastoral-notes?page=1&perPage=500`, headers);
        rawComments = Array.isArray(data) ? data : (data.data || data.results || []);
      }
    }

    const BATCH = 100;
    for (let i = 0; i < rawComments.length; i += BATCH) {
      const batch = rawComments.slice(i, i + BATCH);
      const cTx = db.transaction(() => {
        for (const c of batch) {
          const student = c.student || c.pupil || c;
          const pupilId = resolvePupilId(student) ||
            (c.pupilId ? (db.prepare("SELECT id FROM pupils WHERE school_id=? AND id=?").get(schoolId, c.pupilId) as any)?.id : null);
          if (!pupilId) { results.comments.skipped++; continue; }

          const misId = (c.id || c.noteId || c.commentId || "").toString();
          const type = normaliseCommentType(c.type || c.noteType || c.category || "");
          const category = (c.category || c.noteCategory || c.subject || "Pastoral").toString().slice(0, 100);
          const content = (c.content || c.note || c.text || c.description || "").toString().slice(0, 2000);
          if (!content) { results.comments.skipped++; continue; }
          const date = toISODate(c.date || c.noteDate || c.created_at);

          try {
            insertComment.run(
              uuidv4(), schoolId, pupilId, type, category, content, date, provider, misId || null
            );
            results.comments.created++;
          } catch { results.comments.skipped++; }
        }
      });
      cTx();
    }
  } catch (err: any) {
    results.errors.push(`Comments sync failed: ${err.message}`);
  }

  auditLog(req.user!.id, schoolId, `mis.${provider}_sync`, "all", "bulk", results, req.ip);
  res.json({ success: true, provider, ...results });
});

// ── GET /api/mis/comments ─────────────────────────────────────────────────────
// List all pupil comments for the school (with optional filters)
router.get("/comments", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });

  const { pupilId, type, limit = "50", offset = "0" } = req.query as Record<string, string>;
  let query = `SELECT pc.*, p.name as pupil_name, p.year_group
               FROM pupil_comments pc
               JOIN pupils p ON p.id = pc.pupil_id
               WHERE pc.school_id = ?`;
  const params: any[] = [schoolId];

  if (pupilId) { query += " AND pc.pupil_id = ?"; params.push(pupilId); }
  if (type) { query += " AND pc.type = ?"; params.push(type); }

  query += " ORDER BY pc.date DESC, pc.created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit) || 50, parseInt(offset) || 0);

  const rows = db.prepare(query).all(...params);
  const total = (db.prepare(
    `SELECT COUNT(*) as n FROM pupil_comments WHERE school_id=?${pupilId ? " AND pupil_id=?" : ""}${type ? " AND type=?" : ""}`
  ).get(...params.slice(0, params.length - 2)) as any)?.n || 0;

  res.json({ comments: rows, total });
});

// ── POST /api/mis/comments ────────────────────────────────────────────────────
// Manually add a pupil comment
router.post("/comments", requireAuth, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });

  const { pupilId, type = "neutral", category = "Pastoral", content, date } = req.body;
  if (!pupilId || !content) return res.status(400).json({ error: "pupilId and content are required" });

  // Verify pupil belongs to this school
  const pupil = db.prepare("SELECT id FROM pupils WHERE id=? AND school_id=? AND is_active=1").get(pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  const id = uuidv4();
  db.prepare(
    `INSERT INTO pupil_comments (id, school_id, pupil_id, recorded_by, type, category, content, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, schoolId, pupilId, req.user!.id, type, category, content.slice(0, 2000), date || new Date().toISOString().slice(0, 10));

  auditLog(req.user!.id, schoolId, "comment.add", "pupil_comments", id, { pupilId, type }, req.ip);
  res.json({ success: true, id });
});

// ── DELETE /api/mis/comments/:id ─────────────────────────────────────────────
router.delete("/comments/:id", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  db.prepare("DELETE FROM pupil_comments WHERE id=? AND school_id=?").run(req.params.id, schoolId);
  auditLog(req.user!.id, schoolId, "comment.delete", "pupil_comments", req.params.id, {}, req.ip);
  res.json({ success: true });
});


// ── POST /api/mis/sync-demo ───────────────────────────────────────────────────
// Inserts realistic mock MIS data for testing without real API credentials.
// Creates 20 demo pupils with behaviour, attendance, and comment records.
router.post("/sync-demo", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });

  const results = {
    pupils: { created: 0, updated: 0, skipped: 0 },
    behaviour: { created: 0, skipped: 0 },
    attendance: { created: 0, skipped: 0 },
    comments: { created: 0, skipped: 0 },
    errors: [] as string[],
  };

  const mockPupils = [
    { name: "Amelia Johnson",    yearGroup: "Year 7",  sendNeed: "Dyslexia",           upn: "DEMO001", dob: "2012-03-14" },
    { name: "Oliver Smith",      yearGroup: "Year 8",  sendNeed: "ADHD",               upn: "DEMO002", dob: "2011-07-22" },
    { name: "Isla Williams",     yearGroup: "Year 9",  sendNeed: "Autism",             upn: "DEMO003", dob: "2010-11-05" },
    { name: "Noah Brown",        yearGroup: "Year 7",  sendNeed: "",                   upn: "DEMO004", dob: "2012-01-30" },
    { name: "Sophia Jones",      yearGroup: "Year 10", sendNeed: "Dyslexia",           upn: "DEMO005", dob: "2009-09-18" },
    { name: "Liam Davis",        yearGroup: "Year 8",  sendNeed: "SLCN",               upn: "DEMO006", dob: "2011-04-02" },
    { name: "Emily Wilson",      yearGroup: "Year 11", sendNeed: "",                   upn: "DEMO007", dob: "2008-06-25" },
    { name: "James Taylor",      yearGroup: "Year 9",  sendNeed: "MLD",                upn: "DEMO008", dob: "2010-02-14" },
    { name: "Mia Anderson",      yearGroup: "Year 7",  sendNeed: "Dyspraxia",          upn: "DEMO009", dob: "2012-08-09" },
    { name: "Benjamin Thomas",   yearGroup: "Year 10", sendNeed: "ADHD",               upn: "DEMO010", dob: "2009-12-03" },
    { name: "Charlotte Jackson", yearGroup: "Year 8",  sendNeed: "",                   upn: "DEMO011", dob: "2011-05-17" },
    { name: "Ethan White",       yearGroup: "Year 9",  sendNeed: "Autism",             upn: "DEMO012", dob: "2010-10-28" },
    { name: "Poppy Harris",      yearGroup: "Year 11", sendNeed: "Dyslexia",           upn: "DEMO013", dob: "2008-03-07" },
    { name: "Alexander Martin",  yearGroup: "Year 7",  sendNeed: "",                   upn: "DEMO014", dob: "2012-11-19" },
    { name: "Grace Thompson",    yearGroup: "Year 10", sendNeed: "EHC Plan",           upn: "DEMO015", dob: "2009-07-11" },
    { name: "Harry Garcia",      yearGroup: "Year 8",  sendNeed: "Dyscalculia",        upn: "DEMO016", dob: "2011-09-23" },
    { name: "Lily Martinez",     yearGroup: "Year 9",  sendNeed: "",                   upn: "DEMO017", dob: "2010-04-16" },
    { name: "Oscar Robinson",    yearGroup: "Year 11", sendNeed: "ADHD",               upn: "DEMO018", dob: "2008-01-08" },
    { name: "Freya Clark",       yearGroup: "Year 7",  sendNeed: "Hearing Impairment", upn: "DEMO019", dob: "2012-06-30" },
    { name: "Jack Lewis",        yearGroup: "Year 10", sendNeed: "",                   upn: "DEMO020", dob: "2009-02-21" },
  ];

  const findByUpn   = db.prepare("SELECT id FROM pupils WHERE school_id=? AND upn=?");
  const insertPupil = db.prepare(
    `INSERT INTO pupils (id, school_id, name, year_group, send_need, code, upn, dob, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updatePupil = db.prepare(
    `UPDATE pupils SET year_group=?, send_need=?, updated_at=datetime('now') WHERE school_id=? AND upn=?`
  );

  const pupilIds: Record<string, string> = {};

  const pupilTx = db.transaction(() => {
    for (const p of mockPupils) {
      const existing = findByUpn.get(schoolId, p.upn) as any;
      if (existing) {
        updatePupil.run(p.yearGroup, p.sendNeed, schoolId, p.upn);
        pupilIds[p.upn] = existing.id;
        results.pupils.updated++;
      } else {
        const id   = uuidv4();
        const code = "P" + Math.random().toString(36).slice(2, 7).toUpperCase();
        try {
          insertPupil.run(id, schoolId, p.name, p.yearGroup, p.sendNeed, code, p.upn, p.dob, req.user!.id);
          pupilIds[p.upn] = id;
          results.pupils.created++;
        } catch { results.pupils.skipped++; }
      }
    }
  });
  pupilTx();

  // ── Mock behaviour records ─────────────────────────────────────────────────
  const insertBehaviour = db.prepare(
    `INSERT OR IGNORE INTO behaviour_records (id, school_id, pupil_id, recorded_by, type, category, description, action_taken, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const behaviourData = [
    { upn: "DEMO001", type: "positive", category: "Academic",   description: "Excellent effort on reading comprehension task",                  action: "Verbal praise",                          date: "2026-03-01" },
    { upn: "DEMO002", type: "concern",  category: "Behaviour",  description: "Difficulty staying on task during independent work",              action: "Seat moved, check-in scheduled",          date: "2026-03-03" },
    { upn: "DEMO003", type: "positive", category: "Social",     description: "Supported a classmate during group activity",                     action: "Positive note sent home",                date: "2026-03-05" },
    { upn: "DEMO005", type: "concern",  category: "Academic",   description: "Struggling with written tasks despite strong verbal understanding",action: "SEND support referral made",              date: "2026-03-02" },
    { upn: "DEMO008", type: "positive", category: "Academic",   description: "Completed all extension work independently",                      action: "Certificate awarded",                    date: "2026-03-04" },
    { upn: "DEMO010", type: "concern",  category: "Behaviour",  description: "Impulsive outburst during transition time",                       action: "Restorative conversation, parent informed",date: "2026-03-06" },
    { upn: "DEMO012", type: "positive", category: "Wellbeing",  description: "Used self-regulation strategies independently",                   action: "Shared with SENCO",                      date: "2026-03-07" },
    { upn: "DEMO015", type: "concern",  category: "Attendance", description: "Third late arrival this week",                                    action: "Parent contact made",                    date: "2026-03-08" },
  ];
  const behaviourTx = db.transaction(() => {
    for (const b of behaviourData) {
      const pupilId = pupilIds[b.upn];
      if (!pupilId) { results.behaviour.skipped++; continue; }
      try {
        insertBehaviour.run(uuidv4(), schoolId, pupilId, req.user!.id, b.type, b.category, b.description, b.action, b.date);
        results.behaviour.created++;
      } catch { results.behaviour.skipped++; }
    }
  });
  behaviourTx();

  // ── Mock attendance records (last 5 school days) ───────────────────────────
  const insertAttendance = db.prepare(
    `INSERT OR IGNORE INTO attendance_records (id, school_id, pupil_id, recorded_by, date, am_status, pm_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const recentDates = ["2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"];
  const attendanceTx = db.transaction(() => {
    for (const [upn, pupilId] of Object.entries(pupilIds)) {
      for (const date of recentDates) {
        const absent = ["DEMO015", "DEMO018"].includes(upn) && date >= "2026-03-11";
        const late   = ["DEMO002", "DEMO010"].includes(upn) && date === "2026-03-12";
        const am = absent ? "absent-unauthorised" : late ? "late" : "present";
        const pm = absent ? "absent-unauthorised" : "present";
        try {
          insertAttendance.run(uuidv4(), schoolId, pupilId, req.user!.id, date, am, pm, absent ? "Unauthorised absence" : "");
          results.attendance.created++;
        } catch { results.attendance.skipped++; }
      }
    }
  });
  attendanceTx();

  // ── Mock pupil comments ────────────────────────────────────────────────────
  const insertComment = db.prepare(
    `INSERT INTO pupil_comments (id, school_id, pupil_id, recorded_by, type, category, content, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const commentData = [
    { upn: "DEMO001", type: "positive", category: "Academic",   content: "Amelia has made excellent progress with her reading this term. Her confidence has grown significantly.", date: "2026-03-10" },
    { upn: "DEMO002", type: "neutral",  category: "Pastoral",   content: "Oliver's parents contacted school regarding homework difficulties. Meeting scheduled for next week.",    date: "2026-03-08" },
    { upn: "DEMO005", type: "neutral",  category: "SEND",       content: "Sophia's EHCP annual review is due next month. SENCO to arrange meeting with parents.",                  date: "2026-03-05" },
    { upn: "DEMO012", type: "positive", category: "Wellbeing",  content: "Ethan has been using his sensory toolkit effectively. Staff report much calmer transitions.",            date: "2026-03-11" },
    { upn: "DEMO015", type: "neutral",  category: "Attendance", content: "Grace's attendance has dropped to 87% this term. Attendance officer to follow up.",                      date: "2026-03-12" },
  ];
  const commentTx = db.transaction(() => {
    for (const c of commentData) {
      const pupilId = pupilIds[c.upn];
      if (!pupilId) { results.comments.skipped++; continue; }
      try {
        insertComment.run(uuidv4(), schoolId, pupilId, req.user!.id, c.type, c.category, c.content, c.date);
        results.comments.created++;
      } catch { results.comments.skipped++; }
    }
  });
  commentTx();

  auditLog(req.user!.id, schoolId, "mis.demo_sync", "pupils", schoolId, { results }, req.ip);
  res.json({ success: true, provider: "demo", results });
  } catch (err: any) {
    console.error("[sync-demo] Error:", err?.message || err);
    res.status(500).json({ error: err?.message || "Demo sync failed" });
  }
});

export default router;
