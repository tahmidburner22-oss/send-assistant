import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── GET /api/presentation-library/entries ──────────────────────────────────
// List all presentation library entries (metadata only, no slides_json)
router.get("/entries", requireAuth, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT id, title, subject, topic, year_group, tier, slide_count, thumbnail_url,
              source, curated, tags, created_at, updated_at,
              jsonb_array_length(CASE WHEN slides_json IS NULL OR slides_json = '' OR slides_json = '[]' THEN '[]'::jsonb ELSE slides_json::jsonb END) AS slides_count
       FROM presentation_library
       ORDER BY curated DESC, created_at DESC`
    );
    res.json({ entries: result.rows });
  } catch (err: any) {
    console.error("[presentationLibrary] GET /entries error:", err);
    res.status(500).json({ error: "Failed to load presentation library" });
  }
});

// ─── GET /api/presentation-library/entries/:id ──────────────────────────────
// Get a single presentation entry with full slides_json
router.get("/entries/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT * FROM presentation_library WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Not found" });
    const entry = result.rows[0];
    try { entry.slides = JSON.parse(entry.slides_json || "[]"); } catch { entry.slides = []; }
    try { entry.tags = JSON.parse(entry.tags || "[]"); } catch { entry.tags = []; }
    res.json({ entry });
  } catch (err: any) {
    console.error("[presentationLibrary] GET /entries/:id error:", err);
    res.status(500).json({ error: "Failed to load entry" });
  }
});

// ─── POST /api/presentation-library/entries ─────────────────────────────────
// Create a new presentation library entry
router.post("/entries", requireAuth, async (req: any, res) => {
  try {
    const { title, subject, topic, year_group, tier, slides, thumbnail_url, tags } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const slidesArr = Array.isArray(slides) ? slides : [];
    const tagsArr = Array.isArray(tags) ? tags : [];
    const id = uuidv4();
    await query(
      `INSERT INTO presentation_library (id, title, subject, topic, year_group, tier, slide_count, slides_json, thumbnail_url, source, curated, tags, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ai', 0, $10, $11, NOW(), NOW())`,
      [id, title, subject || null, topic || null, year_group || null, tier || null,
       slidesArr.length, JSON.stringify(slidesArr), thumbnail_url || null,
       JSON.stringify(tagsArr), req.user?.id || null]
    );
    res.json({ id, message: "Presentation saved to library" });
  } catch (err: any) {
    console.error("[presentationLibrary] POST /entries error:", err);
    res.status(500).json({ error: "Failed to save presentation" });
  }
});

// ─── PATCH /api/presentation-library/entries/:id/curate ─────────────────────
router.patch("/entries/:id/curate", requireAuth, async (req: any, res) => {
  try {
    const { curated } = req.body;
    await query(
      `UPDATE presentation_library SET curated = $1, updated_at = NOW() WHERE id = $2`,
      [curated ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// ─── DELETE /api/presentation-library/entries/:id ───────────────────────────
router.delete("/entries/:id", requireAuth, async (req: any, res) => {
  try {
    await query(`DELETE FROM presentation_library WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
