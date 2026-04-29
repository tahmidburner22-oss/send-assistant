import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── GET /api/diagram-library/entries ───────────────────────────────────────
// List all diagram library entries
router.get("/entries", requireAuth, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT id, title, subject, topic, year_group, description, image_url, asset_ref,
              tags, source, curated, created_at, updated_at
       FROM diagram_library
       ORDER BY curated DESC, subject ASC, title ASC`
    );
    res.json({ entries: result.rows });
  } catch (err: any) {
    console.error("[diagramLibrary] GET /entries error:", err);
    res.status(500).json({ error: "Failed to load diagram library" });
  }
});

// ─── GET /api/diagram-library/search?subject=&topic= ────────────────────────
// Smart search: finds the best-matching diagram for a given subject + topic.
// Priority: curated > subject+topic match > subject-only match > title keyword match.
router.get("/search", requireAuth, async (req: any, res) => {
  try {
    const subjectRaw = String(req.query.subject || "").toLowerCase().trim();
    const topicRaw = String(req.query.topic || "").toLowerCase().trim();

    if (!subjectRaw && !topicRaw) {
      return res.status(400).json({ error: "subject or topic required" });
    }

    // Fetch all entries (1722 rows — still fast with index on subject)
    const result = await query(
      `SELECT id, title, subject, topic, year_group, description, image_url, asset_ref,
              tags, source, curated
       FROM diagram_library
       ORDER BY curated DESC, subject ASC, title ASC`
    );
    const entries: any[] = result.rows;

    if (!entries.length) {
      return res.json({ entry: null });
    }

    // Score each entry: higher = better match
    const scored = entries.map((e) => {
      const eSubject = (e.subject || "").toLowerCase();
      const eTopic = (e.topic || "").toLowerCase();
      const eTitle = (e.title || "").toLowerCase();
      const eTags: string[] = (() => {
        try { return JSON.parse(e.tags || "[]").map((t: string) => t.toLowerCase()); } catch { return []; }
      })();

      let score = 0;

      // Subject match
      const subjectMatch =
        subjectRaw &&
        (eSubject.includes(subjectRaw) || subjectRaw.includes(eSubject) ||
         eTitle.includes(subjectRaw) || eTags.some(t => t.includes(subjectRaw)));
      if (subjectMatch) score += 10;

      // Topic match — exact
      if (topicRaw && eTopic === topicRaw) score += 50;
      else if (topicRaw && eTopic.includes(topicRaw)) score += 30;
      else if (topicRaw && topicRaw.includes(eTopic) && eTopic.length > 3) score += 20;
      else if (topicRaw && eTitle.includes(topicRaw)) score += 15;
      else if (topicRaw && topicRaw.includes(eTitle) && eTitle.length > 3) score += 10;

      // Tag match
      if (topicRaw) {
        const topicWords = topicRaw.split(/\s+/).filter(w => w.length > 3);
        for (const tw of topicWords) {
          if (eTopic.includes(tw) || eTitle.includes(tw) || eTags.some(t => t.includes(tw))) {
            score += 5;
          }
        }
      }

      // Curated bonus
      if (e.curated) score += 8;

      return { entry: e, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (!best || best.score === 0) {
      return res.json({ entry: null });
    }

    console.log(`[DiagramLibrary] Best match for "${topicRaw}" (${subjectRaw}): "${best.entry.title}" score=${best.score}`);
    return res.json({ entry: best.entry });
  } catch (err: any) {
    console.error("[diagramLibrary] GET /search error:", err);
    res.status(500).json({ error: "Failed to search diagram library" });
  }
});

// ─── GET /api/diagram-library/entries/:id ───────────────────────────────────
router.get("/entries/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT * FROM diagram_library WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Not found" });
    const entry = result.rows[0];
    try { entry.tags = JSON.parse(entry.tags || "[]"); } catch { entry.tags = []; }
    res.json({ entry });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load entry" });
  }
});

// ─── POST /api/diagram-library/entries ──────────────────────────────────────
// Create a new diagram entry
router.post("/entries", requireAuth, async (req: any, res) => {
  try {
    const { title, subject, topic, year_group, description, image_url, asset_ref, tags } = req.body;
    if (!title || !image_url) return res.status(400).json({ error: "title and image_url are required" });
    const tagsArr = Array.isArray(tags) ? tags : [];
    const id = uuidv4();
    await query(
      `INSERT INTO diagram_library (id, title, subject, topic, year_group, description, image_url, asset_ref, tags, source, curated, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ai', 0, NOW(), NOW())`,
      [id, title, subject || null, topic || null, year_group || null,
       description || null, image_url, asset_ref || null, JSON.stringify(tagsArr)]
    );
    res.json({ id, message: "Diagram saved to library" });
  } catch (err: any) {
    console.error("[diagramLibrary] POST /entries error:", err);
    res.status(500).json({ error: "Failed to save diagram" });
  }
});

// ─── PATCH /api/diagram-library/entries/:id/curate ──────────────────────────
router.patch("/entries/:id/curate", requireAuth, async (req: any, res) => {
  try {
    const { curated } = req.body;
    await query(
      `UPDATE diagram_library SET curated = $1, updated_at = NOW() WHERE id = $2`,
      [curated ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// ─── DELETE /api/diagram-library/entries/:id ────────────────────────────────
router.delete("/entries/:id", requireAuth, async (req: any, res) => {
  try {
    await query(`DELETE FROM diagram_library WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
