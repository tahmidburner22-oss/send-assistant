import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { canonicalTopicKey, topicsMatch } from "../lib/topicNormalizer.js";

const router = Router();

// ─── GET /api/diagram-library/entries ───────────────────────────────────────
// List all diagram library entries (includes diagram_type column)
router.get("/entries", requireAuth, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT id, title, subject, topic, year_group, description, image_url, asset_ref,
              tags, source, curated, diagram_type, created_at, updated_at
       FROM diagram_library
       ORDER BY curated DESC, subject ASC, title ASC`
    );
    const entries = result.rows.map((e: any) => {
      try { e.tags = JSON.parse(e.tags || "[]"); } catch { e.tags = []; }
      // Ensure diagram_type has a sensible default for legacy rows
      if (!e.diagram_type) {
        if ((e.title || "").toLowerCase().includes("diagram b")) e.diagram_type = "diagram_b";
        else if ((e.title || "").toLowerCase().includes("revision map") || (e.title || "").toLowerCase().includes("revision mat")) e.diagram_type = "revision_map";
        else e.diagram_type = "diagram_a";
      }
      return e;
    });
    res.json({ entries });
  } catch (err: any) {
    console.error("[diagramLibrary] GET /entries error:", err);
    res.status(500).json({ error: "Failed to load diagram library" });
  }
});

// ─── GET /api/diagram-library/search?subject=&topic=&slot= ──────────────────
// Smart search: finds the best-matching diagram for a given subject + topic + slot.
// slot = 'a' → diagram_type = 'diagram_a'
// slot = 'b' → diagram_type = 'diagram_b'
// slot = 'revision' → diagram_type = 'revision_map'
// (no slot) → any type, best match
router.get("/search", requireAuth, async (req: any, res) => {
  try {
    const subjectRaw = String(req.query.subject || "").toLowerCase().trim();
    const topicRaw = String(req.query.topic || "").toLowerCase().trim();
    const subtopicRaw = String(req.query.subtopic || "").toLowerCase().trim();
    const yearGroupRaw = String(req.query.yearGroup || req.query.year_group || "").toLowerCase().trim();
    const slot = String(req.query.slot || "").toLowerCase().trim(); // 'a', 'b', 'revision', or ''
    if (!subjectRaw && !topicRaw) {
      return res.status(400).json({ error: "subject or topic required" });
    }

    // Map slot to diagram_type filter (primary + backup fallback)
    let typeFilter: string | null = null;
    let backupTypeFilter: string | null = null;
    if (slot === "a") { typeFilter = "diagram_a"; backupTypeFilter = "diagram_a_backup"; }
    else if (slot === "b") { typeFilter = "diagram_b"; backupTypeFilter = "diagram_b_backup"; }
    else if (slot === "revision") { typeFilter = "revision_map"; backupTypeFilter = "revision_map_backup"; }

    // Helper to fetch entries by type(s)
    const fetchByTypes = async (types: string[]) => {
      const placeholders = types.map((_, i) => `$${i + 1}`).join(", ");
      const r = await query(
        `SELECT id, title, subject, topic, year_group, description, image_url, asset_ref,
                tags, source, curated, diagram_type
         FROM diagram_library
         WHERE diagram_type IN (${placeholders})
         ORDER BY curated DESC, subject ASC, title ASC`,
        types
      );
      return r.rows;
    };

    // Fetch primary entries first
    let entries: any[] = typeFilter
      ? await fetchByTypes([typeFilter])
      : (await query(
          `SELECT id, title, subject, topic, year_group, description, image_url, asset_ref,
                  tags, source, curated, diagram_type
           FROM diagram_library
           ORDER BY curated DESC, subject ASC, title ASC`
        )).rows;
    if (!entries.length) {
      return res.json({ entry: null });
    }

    const subjectFamily = (s: string) => {
      const v = s.toLowerCase().trim();
      if (["biology", "chemistry", "physics", "science", "combined science", "triple science"].includes(v)) return "science";
      if (["math", "maths", "mathematics"].includes(v)) return "maths";
      return v;
    };
    const requestedTopicKey = canonicalTopicKey([topicRaw, subtopicRaw].filter(Boolean).join(" ") || topicRaw);

    // Score each entry with hard relevance gates. A diagram should not be returned
    // merely because it shares one generic word with the worksheet topic.
    const scored = entries.map((e) => {
      const eSubject = (e.subject || "").toLowerCase().trim();
      const eTopic = (e.topic || "").toLowerCase().trim();
      const eYearGroup = String(e.year_group || "").toLowerCase().trim();
      const eTitle = (e.title || "").toLowerCase().trim();
      const eTags: string[] = (() => {
        try { return JSON.parse(e.tags || "[]").map((t: string) => String(t).toLowerCase().trim()); } catch { return []; }
      })();
      const searchable = [eTopic, eTitle, ...eTags].filter(Boolean).join(" ");
      const entryTopicKey = canonicalTopicKey(eTopic || eTitle || eTags.join(" "));
      const exactTopicMatch = !!topicRaw && (eTopic === topicRaw || topicsMatch(eTopic, topicRaw));
      const subtopicMatch = !!subtopicRaw && (searchable.includes(subtopicRaw) || topicsMatch(searchable, subtopicRaw));
      const canonicalMatch = !!topicRaw && (entryTopicKey === requestedTopicKey || exactTopicMatch || subtopicMatch);
      const subjectMatch = !subjectRaw || !eSubject ||
        eSubject === subjectRaw || subjectFamily(eSubject) === subjectFamily(subjectRaw) ||
        eSubject.includes(subjectRaw) || subjectRaw.includes(eSubject);
      const yearGroupMatch = !yearGroupRaw || !eYearGroup || eYearGroup === yearGroupRaw || eYearGroup.includes(yearGroupRaw);

      let score = 0;
      if (subjectMatch) score += 25; else score -= 50;
      if (canonicalMatch) score += 70;
      if (exactTopicMatch) score += 20;
      if (subtopicMatch) score += 15;
      if (yearGroupMatch) score += 8; else score -= 10;
      if (topicRaw && eTitle.includes(topicRaw)) score += 10;
      if (topicRaw) {
        const topicWords = topicRaw.split(/\s+/).filter(w => w.length > 3);
        const matchedWords = topicWords.filter(tw => searchable.includes(tw));
        score += Math.min(matchedWords.length * 4, 12);
      }
      if (e.curated) score += 8;

      // Hard gate: for topic-based searches, require canonical/exact/subtopic relevance
      // plus subject compatibility. This returns null rather than a wrong diagram.
      const passesGate = subjectMatch && yearGroupMatch && (!topicRaw || canonicalMatch || exactTopicMatch || subtopicMatch);
      return { entry: e, score, passesGate, reasons: { canonicalMatch, exactTopicMatch, subtopicMatch, subjectMatch, yearGroupMatch } };
    }).filter(s => s.passesGate);

    scored.sort((a, b) => b.score - a.score);
    let best = scored[0];
    if (!best || best.score < (topicRaw ? 75 : 25)) {
      // No confident match in primary — try backup folder if available
      if (backupTypeFilter) {
        const backupEntries = await fetchByTypes([backupTypeFilter]);
        if (backupEntries.length) {
          const backupScored = backupEntries.map((e) => {
            const eSubject = (e.subject || "").toLowerCase().trim();
            const eTopic = (e.topic || "").toLowerCase().trim();
            const eYearGroup = String(e.year_group || "").toLowerCase().trim();
            const eTitle = (e.title || "").toLowerCase().trim();
            const eTags: string[] = (() => { try { return JSON.parse(e.tags || "[]").map((t: string) => String(t).toLowerCase().trim()); } catch { return []; } })();
            const searchable = [eTopic, eTitle, ...eTags].filter(Boolean).join(" ");
            const entryTopicKey = canonicalTopicKey(eTopic || eTitle || eTags.join(" "));
            const exactTopicMatch = !!topicRaw && (eTopic === topicRaw || topicsMatch(eTopic, topicRaw));
            const subtopicMatch = !!subtopicRaw && (searchable.includes(subtopicRaw) || topicsMatch(searchable, subtopicRaw));
            const canonicalMatch = !!topicRaw && (entryTopicKey === requestedTopicKey || exactTopicMatch || subtopicMatch);
            const subjectMatch = !subjectRaw || !eSubject || eSubject === subjectRaw || subjectFamily(eSubject) === subjectFamily(subjectRaw) || eSubject.includes(subjectRaw) || subjectRaw.includes(eSubject);
            const yearGroupMatch = !yearGroupRaw || !eYearGroup || eYearGroup === yearGroupRaw || eYearGroup.includes(yearGroupRaw);
            let score = 0;
            if (subjectMatch) score += 25; else score -= 50;
            if (canonicalMatch) score += 70;
            if (exactTopicMatch) score += 20;
            if (subtopicMatch) score += 15;
            if (yearGroupMatch) score += 8; else score -= 10;
            if (topicRaw && eTitle.includes(topicRaw)) score += 10;
            if (topicRaw) { const tw = topicRaw.split(/\s+/).filter(w => w.length > 3); score += Math.min(tw.filter(w => searchable.includes(w)).length * 4, 12); }
            if (e.curated) score += 8;
            const passesGate = subjectMatch && yearGroupMatch && (!topicRaw || canonicalMatch || exactTopicMatch || subtopicMatch);
            return { entry: e, score, passesGate, reasons: { canonicalMatch, exactTopicMatch, subtopicMatch, subjectMatch, yearGroupMatch } };
          }).filter(s => s.passesGate);
          backupScored.sort((a, b) => b.score - a.score);
          const backupBest = backupScored[0];
          if (backupBest && backupBest.score >= (topicRaw ? 75 : 25)) {
            console.log(`[DiagramLibrary] Using BACKUP match for "${topicRaw}" (${subjectRaw}) slot=${slot || "any"}: "${backupBest.entry.title}" score=${backupBest.score}`);
            return res.json({ entry: backupBest.entry, confidence: backupBest.score, reasons: backupBest.reasons, isBackup: true });
          }
        }
      }
      console.log(`[DiagramLibrary] No confident match for "${topicRaw}" (${subjectRaw}) slot=${slot || "any"}; bestScore=${best?.score ?? 0}`);
      return res.json({ entry: null, confidence: best?.score ?? 0 });
    }
    console.log(`[DiagramLibrary] Best match for "${topicRaw}" (${subjectRaw}) slot=${slot || "any"}: "${best.entry.title}" score=${best.score}`);
    return res.json({ entry: best.entry, confidence: best.score, reasons: best.reasons });
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
    const { title, subject, topic, year_group, description, image_url, asset_ref, tags, diagram_type } = req.body;
    if (!title || !image_url) return res.status(400).json({ error: "title and image_url are required" });
    const tagsArr = Array.isArray(tags) ? tags : [];
    // Auto-detect diagram_type from title if not provided
    let dtype = diagram_type || "diagram_a";
    if (!diagram_type) {
      const tl = title.toLowerCase();
      if (tl.includes("diagram b")) dtype = "diagram_b";
      else if (tl.includes("revision map") || tl.includes("revision mat")) dtype = "revision_map";
    }
    const id = uuidv4();
    await query(
      `INSERT INTO diagram_library (id, title, subject, topic, year_group, description, image_url, asset_ref, tags, source, curated, diagram_type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ai', 0, $10, NOW(), NOW())`,
      [id, title, subject || null, topic || null, year_group || null,
       description || null, image_url, asset_ref || null, JSON.stringify(tagsArr), dtype]
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

// ─── PATCH /api/diagram-library/entries/:id/type ────────────────────────────
// Update the diagram_type (folder) for a diagram entry
router.patch("/entries/:id/type", requireAuth, async (req: any, res) => {
  try {
    const { diagram_type } = req.body;
    const validTypes = ["diagram_a", "diagram_b", "revision_map", "diagram_a_backup", "diagram_b_backup", "revision_map_backup"];
    if (!validTypes.includes(diagram_type)) {
      return res.status(400).json({ error: "diagram_type must be one of: diagram_a, diagram_b, revision_map" });
    }
    await query(
      `UPDATE diagram_library SET diagram_type = $1, updated_at = NOW() WHERE id = $2`,
      [diagram_type, req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update diagram type" });
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

// ─── GET /api/diagram-library/revision-map-topics ───────────────────────────
// Returns a lightweight list of { subject, topic } pairs that have a revision_map diagram.
// Used by the client to decide whether the Revision Mat toggle should be enabled.
router.get("/revision-map-topics", requireAuth, async (_req: any, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT subject, topic
       FROM diagram_library
       WHERE diagram_type = 'revision_map'
          OR tags::text ILIKE '%revision-map%'
          OR tags::text ILIKE '%revision map%'
       ORDER BY subject ASC, topic ASC`
    );
    res.json({ topics: result.rows });
  } catch (err: any) {
    console.error("[diagramLibrary] GET /revision-map-topics error:", err);
    res.status(500).json({ error: "Failed to load revision map topics" });
  }
});

export default router;
