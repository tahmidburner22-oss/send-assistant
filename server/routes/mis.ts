/**
 * MIS Integration Routes
 * Handles Bromcom and Arbor MIS data import:
 *  - POST /api/mis/import-csv   — parse uploaded CSV and bulk-upsert pupils
 *  - GET  /api/mis/sync/:provider — pull pupils from Bromcom or Arbor API (premium only)
 *  - GET  /api/mis/status        — return which MIS providers are configured
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth, requireAdmin, auditLog } from "../middleware/auth.js";

const router = Router();

// ── Helper: check if school is on premium plan ────────────────────────────────
function isPremiumSchool(schoolId: string): boolean {
  const school = db.prepare(
    "SELECT subscription_plan, licence_type FROM schools WHERE id = ?"
  ).get(schoolId) as any;
  if (!school) return false;
  const plan = (school.subscription_plan || school.licence_type || "").toLowerCase();
  return ["premium", "mat", "enterprise"].includes(plan);
}

// ── Helper: decrypt a stored MIS API key ─────────────────────────────────────
import crypto from "crypto";
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
  // Handle "Year 7", "Y7", "7", "KS3", "Reception", "Nursery" etc.
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

// ── POST /api/mis/import-csv ─────────────────────────────────────────────────
// Accepts a JSON body: { rows: Array<{ name, yearGroup, sendNeed, upn, dob }> }
// The frontend parses the CSV and sends the rows as JSON.
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

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  const insertStmt = db.prepare(
    `INSERT INTO pupils (id, school_id, name, year_group, send_need, code, upn, dob, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updateStmt = db.prepare(
    `UPDATE pupils SET name=?, year_group=?, send_need=?, dob=?, updated_at=datetime('now')
     WHERE school_id=? AND upn=? AND is_active=1`
  );
  const findByUpn = db.prepare(
    "SELECT id FROM pupils WHERE school_id=? AND upn=? AND is_active=1"
  );
  const findByName = db.prepare(
    "SELECT id FROM pupils WHERE school_id=? AND name=? AND is_active=1"
  );

  const importTx = db.transaction(() => {
    for (const row of rows) {
      const name = (row.name || row.Name || row["Preferred Name"] || row["Legal Name"] || "").toString().trim();
      if (!name) { skipped++; continue; }

      const yearGroup = normaliseYearGroup(row.yearGroup || row["Year Group"] || row["Year"] || row["year_group"] || "");
      const sendNeed = normaliseSendNeed(row.sendNeed || row["SEN Status"] || row["SEND Need"] || row["SEN Need"] || row["send_need"] || "");
      const upn = (row.upn || row.UPN || row["Unique Pupil Number"] || "").toString().trim() || null;
      const dob = (row.dob || row.DOB || row["Date of Birth"] || row["DateOfBirth"] || "").toString().trim() || null;

      // If UPN exists, try to update existing pupil
      if (upn) {
        const existing = findByUpn.get(schoolId, upn) as any;
        if (existing) {
          updateStmt.run(name, yearGroup || null, sendNeed || null, dob || null, schoolId, upn);
          updated++;
          continue;
        }
      } else {
        // No UPN — check by exact name match to avoid duplicates
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

  importTx();
  auditLog(req.user!.id, schoolId, "mis.csv_import", "pupils", "bulk", { created, updated, skipped }, req.ip);
  res.json({ success: true, created, updated, skipped, errors: errors.slice(0, 10) });
});

// ── GET /api/mis/status ───────────────────────────────────────────────────────
router.get("/status", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.json({ bromcom: false, arbor: false, isPremium: false });

  const isPremium = isPremiumSchool(schoolId);
  const bromcomRow = db.prepare(
    "SELECT id FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
  ).get(schoolId, "bromcom") as any;
  const arborRow = db.prepare(
    "SELECT id FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
  ).get(schoolId, "arbor") as any;

  res.json({
    isPremium,
    bromcom: !!bromcomRow,
    arbor: !!arborRow,
  });
});

// ── POST /api/mis/save-key ────────────────────────────────────────────────────
// Save Bromcom or Arbor API credentials (premium only)
router.post("/save-key", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });
  if (!isPremiumSchool(schoolId)) {
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
// Pull pupils from Bromcom or Arbor API and upsert into the pupils table
router.post("/sync/:provider", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  if (!isPremiumSchool(schoolId)) {
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

  try {
    let pupils: any[] = [];

    if (provider === "bromcom") {
      // Bromcom REST API: GET /students
      // Base URL: https://api.bromcom.com/v2 (or school-specific)
      const baseUrl = "https://api.bromcom.com/v2";
      const response = await fetch(`${baseUrl}/students?schoolId=${misSchoolId}&pageSize=500`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.status(502).json({
          error: `Bromcom API error (${response.status}): ${errText.slice(0, 200)}`,
        });
      }
      const data = await response.json() as any;
      // Bromcom returns { data: [...] } or an array
      const items = Array.isArray(data) ? data : (data.data || data.students || data.value || []);
      pupils = items.map((s: any) => ({
        name: [s.preferredFirstName || s.firstName || s.forename, s.preferredLastName || s.lastName || s.surname].filter(Boolean).join(" "),
        yearGroup: s.yearGroup || s.year_group || s.yearGroupName || "",
        sendNeed: s.senStatus || s.sendNeed || s.sen_status || "",
        upn: s.upn || s.UPN || s.uniquePupilNumber || "",
        dob: s.dateOfBirth || s.dob || "",
      }));
    } else {
      // Arbor REST API
      // Arbor uses school-specific subdomains: https://{school}.arbor.sc/api/rest/v2
      const baseUrl = misSchoolId
        ? `https://${misSchoolId}.arbor.sc/api/rest/v2`
        : "https://mis.arbor.sc/api/rest/v2";
      const response = await fetch(`${baseUrl}/students?page=1&perPage=500`, {
        headers: {
          "Authorization": `Basic ${Buffer.from(apiKey).toString("base64")}`,
          "Accept": "application/json",
        },
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.status(502).json({
          error: `Arbor API error (${response.status}): ${errText.slice(0, 200)}`,
        });
      }
      const data = await response.json() as any;
      const items = Array.isArray(data) ? data : (data.data || data.students || data.results || []);
      pupils = items.map((s: any) => ({
        name: [s.preferredFirstName || s.firstName, s.preferredLastName || s.lastName].filter(Boolean).join(" "),
        yearGroup: s.yearGroup?.code || s.yearGroup?.name || s.year_group || "",
        sendNeed: s.senStatus || s.send_status || "",
        upn: s.upn || s.UPN || "",
        dob: s.dateOfBirth || s.dob || "",
      }));
    }

    if (pupils.length === 0) {
      return res.json({ success: true, created: 0, updated: 0, skipped: 0, message: "No pupils returned from MIS. Check your credentials and school ID." });
    }

    // Reuse the same upsert logic as CSV import
    let created = 0, updated = 0, skipped = 0;
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

    const syncTx = db.transaction(() => {
      for (const p of pupils) {
        const name = (p.name || "").trim();
        if (!name) { skipped++; continue; }
        const yearGroup = normaliseYearGroup(p.yearGroup);
        const sendNeed = normaliseSendNeed(p.sendNeed);
        const upn = (p.upn || "").trim() || null;
        const dob = (p.dob || "").trim() || null;

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
        } catch { skipped++; }
      }
    });
    syncTx();

    auditLog(req.user!.id, schoolId, `mis.${provider}_sync`, "pupils", "bulk", { created, updated, skipped }, req.ip);
    res.json({ success: true, created, updated, skipped });
  } catch (err: any) {
    console.error(`[MIS Sync] ${provider} error:`, err);
    res.status(502).json({ error: `Failed to connect to ${provider} API: ${err.message}` });
  }
});

export default router;
