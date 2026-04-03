/**
 * School API Keys — per-organisation AI provider key management
 *
 * Keys are encrypted at rest using AES-256-GCM with a server-side secret
 * (KEY_ENCRYPTION_SECRET env var, falls back to a derived constant).
 * The raw key is NEVER returned to the client — only a masked version.
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import db from "../db/index.js";
import { requireAuth, requireAdmin, auditLog } from "../middleware/auth.js";

const router = Router();

// ── Encryption helpers ────────────────────────────────────────────────────────
// KEY_ENCRYPTION_SECRET must be set via env var — no weak constant fallback
const _KEY_ENC_SECRET_RAW = process.env.KEY_ENCRYPTION_SECRET;
if (!_KEY_ENC_SECRET_RAW) {
  if (process.env.NODE_ENV === "production") {
    console.error("[SECURITY] FATAL: KEY_ENCRYPTION_SECRET env var is not set. School API keys will use an ephemeral random secret and will be unreadable after restart. Set KEY_ENCRYPTION_SECRET in Railway environment variables.");
  } else {
    console.warn("[SECURITY] DEV: KEY_ENCRYPTION_SECRET not set — using ephemeral secret. Set KEY_ENCRYPTION_SECRET in .env for persistent school API keys.");
  }
}
const ENC_SECRET = _KEY_ENC_SECRET_RAW || crypto.randomBytes(32).toString("hex");
const ENC_KEY = crypto.scryptSync(ENC_SECRET, "adaptly-salt", 32);

function encryptKey(plaintext: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, tag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

function decryptKey(encryptedB64: string, ivB64: string): string {
  const iv = Buffer.from(ivB64, "base64");
  const data = Buffer.from(encryptedB64, "base64");
  const tag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

// ── Exported helper — used by ai.ts to resolve the best key for a school ─────
export async function getSchoolKey(schoolId: string, provider: string): Promise<{ key: string; model: string; baseUrl?: string } | null> {
  try {
    const row = await db.prepare(
      "SELECT api_key_encrypted, api_key_iv, model, base_url FROM school_api_keys WHERE school_id=? AND provider=? AND enabled=1"
    ).get(schoolId, provider) as any;
    if (!row) return null;
    const key = decryptKey(row.api_key_encrypted, row.api_key_iv);
    return { key, model: row.model || "", baseUrl: row.base_url || undefined };
  } catch (_) {
    return null;
  }
}

// ── GET /api/school-keys — list all providers for the caller's school ─────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });

  const rows = await db.prepare(
    "SELECT id, provider, provider_label, model, base_url, enabled, updated_at FROM school_api_keys WHERE school_id=? ORDER BY provider"
  ).all(schoolId) as any[];

  // Return masked keys — never the raw value
  const keys = rows.map(r => ({
    id: r.id,
    provider: r.provider,
    providerLabel: r.provider_label || r.provider,
    model: r.model || "",
    baseUrl: r.base_url || "",
    enabled: r.enabled === 1,
    updatedAt: r.updated_at,
    hasKey: true,
  }));

  res.json({ keys });
});

// ── POST /api/school-keys — add or update a provider key ─────────────────────
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });

  const { provider, apiKey, model, baseUrl, providerLabel } = req.body;
  if (!provider || !apiKey) return res.status(400).json({ error: "provider and apiKey are required" });
  if (apiKey.length < 8) return res.status(400).json({ error: "API key appears too short" });

  // Validate provider name (alphanumeric + hyphens only)
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(provider)) {
    return res.status(400).json({ error: "Invalid provider name" });
  }

  const { encrypted, iv } = encryptKey(apiKey.trim());
  const existing = await db.prepare("SELECT id FROM school_api_keys WHERE school_id=? AND provider=?").get(schoolId, provider) as any;

  if (existing) {
    await db.prepare(
      "UPDATE school_api_keys SET api_key_encrypted=?, api_key_iv=?, model=?, base_url=?, provider_label=?, enabled=1, added_by=?, updated_at=NOW() WHERE school_id=? AND provider=?"
    ).run(encrypted, iv, model || null, baseUrl || null, providerLabel || provider, req.user!.id, schoolId, provider);
  } else {
    await db.prepare(
      "INSERT INTO school_api_keys (id, school_id, provider, provider_label, api_key_encrypted, api_key_iv, model, base_url, enabled, added_by) VALUES (?,?,?,?,?,?,?,?,1,?)"
    ).run(uuidv4(), schoolId, provider, providerLabel || provider, encrypted, iv, model || null, baseUrl || null, req.user!.id);
  }

  auditLog(req.user!.id, schoolId, "school.api_key_set", "school_api_keys", provider, { provider }, req.ip);
  res.json({ success: true, message: `${providerLabel || provider} key saved successfully` });
});

// ── PUT /api/school-keys/:id — update a provider key by row ID ───────────────
router.put("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });

  const { apiKey, model, baseUrl, providerLabel } = req.body;
  const row = await db.prepare("SELECT * FROM school_api_keys WHERE id=? AND school_id=?").get(req.params.id, schoolId) as any;
  if (!row) return res.status(404).json({ error: "Key not found" });

  if (apiKey && apiKey.trim()) {
    const { encrypted, iv } = encryptKey(apiKey.trim());
    await db.prepare(
      "UPDATE school_api_keys SET api_key_encrypted=?, api_key_iv=?, model=?, base_url=?, provider_label=?, added_by=?, updated_at=NOW() WHERE id=? AND school_id=?"
    ).run(encrypted, iv, model || row.model || null, baseUrl || row.base_url || null, providerLabel || row.provider_label, req.user!.id, req.params.id, schoolId);
  } else {
    await db.prepare(
      "UPDATE school_api_keys SET model=?, base_url=?, provider_label=?, updated_at=NOW() WHERE id=? AND school_id=?"
    ).run(model || row.model || null, baseUrl || row.base_url || null, providerLabel || row.provider_label, req.params.id, schoolId);
  }

  auditLog(req.user!.id, schoolId, "school.api_key_updated", "school_api_keys", row.provider, { provider: row.provider }, req.ip);
  res.json({ success: true, message: "Key updated successfully" });
});

// ── DELETE /api/school-keys/:provider — remove a provider key ────────────────
router.delete("/:provider", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });

  await db.prepare("DELETE FROM school_api_keys WHERE school_id=? AND provider=?").run(schoolId, req.params.provider);
  auditLog(req.user!.id, schoolId, "school.api_key_deleted", "school_api_keys", req.params.provider, {}, req.ip);
  res.json({ success: true });
});

// ── PATCH /api/school-keys/:provider/toggle — enable/disable ─────────────────
router.patch("/:provider/toggle", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school associated with your account" });

  const row = await db.prepare("SELECT enabled FROM school_api_keys WHERE school_id=? AND provider=?").get(schoolId, req.params.provider) as any;
  if (!row) return res.status(404).json({ error: "Provider not found" });

  const newEnabled = row.enabled === 1 ? 0 : 1;
  await db.prepare("UPDATE school_api_keys SET enabled=? WHERE school_id=? AND provider=?").run(newEnabled, schoolId, req.params.provider);
  res.json({ success: true, enabled: newEnabled === 1 });
});

// ── GET /api/school-keys/status — check if school has any keys configured ────
router.get("/status", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.json({ hasKeys: false, count: 0 });

  const count = (await db.prepare("SELECT COUNT(*) as c FROM school_api_keys WHERE school_id=? AND enabled=1").get(schoolId) as any)?.c || 0;
  res.json({ hasKeys: count > 0, count });
});

export default router;
