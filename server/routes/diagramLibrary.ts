import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { canonicalTopicKey, topicsMatch } from "../lib/topicNormalizer.js";

interface DiagramLibraryEntry {
  id: string;
  title?: string | null;
  subject?: string | null;
  topic?: string | null;
  year_group?: string | null;
  description?: string | null;
  image_url?: string | null;
  asset_ref?: string | null;
  tags?: string | null;
  source?: string | null;
  curated?: boolean | number | null;
  diagram_type?: string | null;
  stage?: string | null;
  discipline?: string | null;
  subtopic?: string | null;
  canonical_topic_key?: string | null;
  canonical_subtopic_key?: string | null;
  visual_profile?: string | null;
  specification_refs?: string | null;
  required_practical?: boolean | number | null;
  generator_model?: string | null;
  prompt_version?: string | null;
  review_status?: string | null;
  alt_text?: string | null;
}

const router = Router();

// ─── GET /api/diagram-library/entries ───────────────────────────────────────
// List all diagram library entries (includes diagram_type column)
router.get("/entries", requireAuth, async (req: any, res) => {
  try {
    const result = await query(
      `SELECT id, title, subject, topic, year_group, description, image_url, asset_ref,
              tags, source, curated, diagram_type, stage, discipline, subtopic,
              canonical_topic_key, canonical_subtopic_key, visual_profile, specification_refs,
              required_practical, generator_model, prompt_version, review_status, alt_text,
              created_at, updated_at
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

    // New science-library assets must have GPT Image 2 provenance and a completed
    // scientific review. Legacy or unreviewed images must never be selected for science.
    const scienceRequest = ["science", "biology", "chemistry", "physics", "combined science", "triple science"].includes(subjectRaw);
    const sciencePublishFilter = scienceRequest
      ? " AND generator_model = 'gpt-image-2' AND review_status = 'approved'"
      : "";

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
         WHERE diagram_type IN (${placeholders})${sciencePublishFilter}
         ORDER BY curated DESC, subject ASC, title ASC`,
        types
      );
      return r.rows as DiagramLibraryEntry[];
    };

    // Fetch primary entries first
    let entries: DiagramLibraryEntry[] = typeFilter
      ? await fetchByTypes([typeFilter])
      : ((await query(
          `SELECT id, title, subject, topic, year_group, description, image_url, asset_ref,
                  tags, source, curated, diagram_type
           FROM diagram_library
           WHERE 1 = 1${sciencePublishFilter}
           ORDER BY curated DESC, subject ASC, title ASC`
        )).rows as DiagramLibraryEntry[]);
    if (!entries.length) {
      return res.json({ entry: null });
    }

    const subjectFamily = (s: string) => {
      const v = s.toLowerCase().trim();
      if (["biology", "chemistry", "physics", "science", "combined science", "triple science"].includes(v)) return "science";
      if (["math", "maths", "mathematics"].includes(v)) return "maths";
      if (["english", "english language", "english literature", "literacy"].includes(v)) return "english";
      if (["history"].includes(v)) return "history";
      if (["geography"].includes(v)) return "geography";
      if (["computing", "computer science", "ict"].includes(v)) return "computing";
      if (["re", "religious education", "religious studies"].includes(v)) return "re";
      return v;
    };
    // Cross-family pairs that should NEVER be matched (e.g. history diagram for a
    // maths worksheet). If the library entry's family differs from the requested
    // family, we reject the match outright regardless of keyword score. This
    // prevents the "wrong diagram for wrong subject" class of bug.
    const familiesCompatible = (a: string, b: string): boolean => {
      if (!a || !b) return true; // unknown → permissive
      const fa = subjectFamily(a);
      const fb = subjectFamily(b);
      if (fa === fb) return true;
      // Biology/Chemistry/Physics all collapse to "science" — handled above.
      // Explicit compatibility table for subject → umbrella mappings.
      const scienceFamily = new Set(["science", "biology", "chemistry", "physics"]);
      if (scienceFamily.has(fa) && scienceFamily.has(fb)) return true;
      return false;
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
      // Family compatibility is a hard gate — entries from the wrong subject family
      // (e.g. a history diagram for a maths worksheet) are rejected outright.
      const familyOk = !subjectRaw || !eSubject || familiesCompatible(eSubject, subjectRaw);
      const subjectMatch = familyOk && (!subjectRaw || !eSubject ||
        eSubject === subjectRaw || subjectFamily(eSubject) === subjectFamily(subjectRaw) ||
        eSubject.includes(subjectRaw) || subjectRaw.includes(eSubject));
      const yearGroupMatch = !yearGroupRaw || !eYearGroup || eYearGroup === yearGroupRaw || eYearGroup.includes(yearGroupRaw);

      let score = 0;
      if (subjectMatch) score += 25; else score -= 100;
      if (canonicalMatch) score += 70;
      if (exactTopicMatch) score += 20;
      if (subtopicMatch) score += 15;
      if (yearGroupMatch) score += 8; else score -= 10;
      if (topicRaw && eTitle.includes(topicRaw)) score += 10;
      if (topicRaw) {
        const topicWords = topicRaw.split(/\s+/).filter(w => w.length > 3);
        const matchedWords = topicWords.filter(tw => searchable.includes(tw));
        // Bumped from *4 capped at 12 to *8 capped at 24 so partial topic-word
        // matches contribute enough to clear the threshold for maths searches
        // where the library row's topic phrasing rarely matches verbatim.
        score += Math.min(matchedWords.length * 8, 24);
      }
      if (e.curated) score += 8;

      // Hard gate: family must be compatible, subject must match, year group must
      // match, and for topic-based searches we require canonical/exact/subtopic
      // relevance. Any failure here returns null rather than a wrong diagram.
      const passesGate = familyOk && subjectMatch && yearGroupMatch && (!topicRaw || canonicalMatch || exactTopicMatch || subtopicMatch);
      return { entry: e, score, passesGate, reasons: { canonicalMatch, exactTopicMatch, subtopicMatch, subjectMatch, yearGroupMatch, familyOk } };
    }).filter(s => s.passesGate);

    scored.sort((a, b) => b.score - a.score);
    let best = scored[0];
    // Threshold lowered for maths-family searches: maths library entries
    // rarely share a canonical topic key with the worksheet topic phrasing
    // (e.g. "Adding fractions" vs library "Fractions"), so the previous
    // single threshold of 75 was effectively excluding maths from the
    // diagram pipeline. The passesGate hard checks (subject + year + topic
    // relevance) still apply, so this only widens acceptance.
    const requestedFamily = subjectRaw ? subjectFamily(subjectRaw) : "";
    const isMathsSearch = requestedFamily === "maths";
    const primaryThreshold = topicRaw ? (isMathsSearch ? 60 : 75) : 25;
    if (!best || best.score < primaryThreshold) {
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
            const familyOk = !subjectRaw || !eSubject || familiesCompatible(eSubject, subjectRaw);
            const subjectMatch = familyOk && (!subjectRaw || !eSubject || eSubject === subjectRaw || subjectFamily(eSubject) === subjectFamily(subjectRaw) || eSubject.includes(subjectRaw) || subjectRaw.includes(eSubject));
            const yearGroupMatch = !yearGroupRaw || !eYearGroup || eYearGroup === yearGroupRaw || eYearGroup.includes(yearGroupRaw);
            let score = 0;
            if (subjectMatch) score += 25; else score -= 100;
            if (canonicalMatch) score += 70;
            if (exactTopicMatch) score += 20;
            if (subtopicMatch) score += 15;
            if (yearGroupMatch) score += 8; else score -= 10;
            if (topicRaw && eTitle.includes(topicRaw)) score += 10;
            // Bumped from *4 capped at 12 to *8 capped at 24 to mirror the
            // primary scorer — partial topic-word matches are the typical
            // case for maths topics and need more weight to clear the gate.
            if (topicRaw) { const tw = topicRaw.split(/\s+/).filter(w => w.length > 3); score += Math.min(tw.filter(w => searchable.includes(w)).length * 8, 24); }
            if (e.curated) score += 8;
            const passesGate = familyOk && subjectMatch && yearGroupMatch && (!topicRaw || canonicalMatch || exactTopicMatch || subtopicMatch);
            return { entry: e, score, passesGate, reasons: { canonicalMatch, exactTopicMatch, subtopicMatch, subjectMatch, yearGroupMatch, familyOk } };
          }).filter(s => s.passesGate);
          backupScored.sort((a, b) => b.score - a.score);
          const backupBest = backupScored[0];
          if (backupBest && backupBest.score >= primaryThreshold) {
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
    const {
      title, subject, topic, year_group, description, image_url, asset_ref, tags, diagram_type,
      stage, discipline, subtopic, canonical_topic_key, canonical_subtopic_key, visual_profile,
      specification_refs, required_practical, generator_model, generation_prompt, prompt_version,
      review_status, scientific_review_notes, alt_text, source,
    } = req.body;
    if (!title || !image_url) return res.status(400).json({ error: "title and image_url are required" });
    const tagsArr = Array.isArray(tags) ? tags : [];
    const scienceAsset = ["science", "biology", "chemistry", "physics", "combined science", "triple science"].includes(String(subject || "").toLowerCase().trim());
    if (scienceAsset && generator_model !== "gpt-image-2") {
      return res.status(400).json({ error: "Science diagram assets must be generated with gpt-image-2." });
    }
    if (scienceAsset && !subtopic) {
      return res.status(400).json({ error: "Science diagram assets require a precise subtopic." });
    }
    if (scienceAsset && !generation_prompt) {
      return res.status(400).json({ error: "Science diagram assets require an immutable generation prompt." });
    }
    // Auto-detect diagram_type from title if not provided
    let dtype = diagram_type || "diagram_a";
    if (!diagram_type) {
      const tl = title.toLowerCase();
      if (tl.includes("diagram b")) dtype = "diagram_b";
      else if (tl.includes("revision map") || tl.includes("revision mat")) dtype = "revision_map";
    }
    const id = uuidv4();
    await query(
      `INSERT INTO diagram_library (
         id, title, subject, topic, year_group, description, image_url, asset_ref, tags, source, curated, diagram_type,
         stage, discipline, subtopic, canonical_topic_key, canonical_subtopic_key, visual_profile, specification_refs,
         required_practical, generator_model, generation_prompt, prompt_version, review_status, scientific_review_notes, alt_text,
         created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11,
         $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
         NOW(), NOW()
       )`,
      [
        id, title, subject || null, topic || null, year_group || null,
        description || null, image_url, asset_ref || null, JSON.stringify(tagsArr), source || "ai",
        dtype, stage || null, discipline || null, subtopic || "", canonical_topic_key || null,
        canonical_subtopic_key || null, visual_profile || null, JSON.stringify(Array.isArray(specification_refs) ? specification_refs : []),
        required_practical ? 1 : 0, generator_model || null, generation_prompt || null, prompt_version || null,
        review_status || (scienceAsset ? "pending_scientific_review" : "legacy"), scientific_review_notes || null, alt_text || null,
      ]
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

// ─── GET /api/diagram-library/coverage ──────────────────────────────────────
// Coverage audit: returns the list of (subject, topic) combinations that are
// MISSING a diagram_a and/or diagram_b in the library. Use this to identify
// gaps that need curated diagrams uploaded via the admin panel.
router.get("/coverage", requireAuth, async (_req: any, res) => {
  try {
    // The canonical curriculum list — every subject/topic combination we
    // expect a diagram for. Mirrors client/src/lib/topic-bank.ts so the two
    // stay in sync. Kept here so the endpoint is self-contained.
    const CURRICULUM: Record<string, string[]> = {
      mathematics: [
        "Place Value and Rounding", "Addition and Subtraction", "Multiplication and Division",
        "Fractions", "Decimals and Percentages", "Ratio and Proportion",
        "Algebra — Expressions and Equations", "Geometry — Angles and Shapes",
        "Area and Perimeter", "Statistics — Mean, Median, Mode", "Probability",
        "Pythagoras' Theorem", "Linear Graphs", "Quadratic Equations", "Trigonometry",
        "Simultaneous Equations", "Inequalities", "Vectors", "Transformations",
        "Circle Theorems", "Bearings", "Sequences", "Standard Form",
      ],
      english: [
        "Nouns, Verbs and Adjectives", "Sentence Structure and Punctuation",
        "Descriptive Writing", "Narrative Writing — Story Structure",
        "Persuasive Writing", "Reading Comprehension — Inference",
        "Poetry — Rhyme and Rhythm", "Shakespeare — Key Themes",
        "Non-Fiction — Report Writing", "Figurative Language",
      ],
      biology: [
        "Cells — Structure and Function", "Photosynthesis", "Respiration",
        "The Digestive System", "The Circulatory System", "Genetics and Inheritance",
        "Evolution and Natural Selection", "Ecosystems and Food Chains",
        "The Nervous System", "Plant Biology", "Homeostasis", "DNA Structure",
        "Mitosis and Meiosis", "Enzymes", "The Heart", "The Eye", "The Ear",
        "The Skeleton", "The Respiratory System",
      ],
      chemistry: [
        "Atoms and the Periodic Table", "Chemical Bonding", "Ionic Bonding",
        "Covalent Bonding", "Metallic Bonding", "Chemical Reactions and Equations",
        "Acids and Alkalis", "Rates of Reaction", "Organic Chemistry",
        "Electrolysis", "States of Matter", "Chromatography", "Distillation",
        "The pH Scale", "Crude Oil", "The Haber Process", "Reactivity Series",
      ],
      physics: [
        "Forces and Motion", "Energy Transfers", "Electricity and Circuits",
        "Waves — Light and Sound", "Magnetism and Electromagnetism",
        "Nuclear Physics", "Space Physics", "Pressure", "Moments and Levers",
        "The Electromagnetic Spectrum", "Ohm's Law", "Motion Graphs",
        "Radioactive Decay", "Specific Heat Capacity", "The Solar System",
      ],
      history: [
        "The Romans in Britain", "The Anglo-Saxons", "The Norman Conquest 1066",
        "The Black Death", "The Tudor Period", "The English Civil War",
        "The Industrial Revolution", "World War One", "World War Two",
        "The Cold War", "The Civil Rights Movement", "Ancient Egypt",
        "The Vikings", "The Stone Age", "The British Empire",
      ],
      geography: [
        "Map Skills and Grid References", "Weather and Climate",
        "Rivers and Erosion", "Tectonic Plates and Earthquakes", "Volcanoes",
        "Ecosystems and Biomes", "Urbanisation", "Development and Inequality",
        "Climate Change", "Coastal Processes", "The Water Cycle",
        "The Carbon Cycle", "The Rock Cycle", "Glaciation", "Population",
      ],
      computing: [
        "Binary and Data Representation", "Algorithms and Flowcharts",
        "Programming — Variables and Loops", "Boolean Logic",
        "Networks and the Internet", "Cybersecurity", "Databases",
        "Computational Thinking", "Logic Gates", "CPU Architecture",
      ],
    };

    // Fetch every (subject, topic, diagram_type) triple we have
    const result = await query(
      `SELECT LOWER(COALESCE(subject, '')) AS subject,
              LOWER(COALESCE(topic, '')) AS topic,
              LOWER(COALESCE(title, '')) AS title,
              COALESCE(diagram_type, 'diagram_a') AS diagram_type
       FROM diagram_library`
    );
    const have = {
      diagram_a: new Set<string>(),
      diagram_b: new Set<string>(),
    };
    for (const r of result.rows) {
      const key = canonicalTopicKey(r.topic || r.title);
      if (r.diagram_type === "diagram_a" || r.diagram_type === "diagram_a_backup") {
        have.diagram_a.add(`${subjectFamilyStatic(r.subject)}::${key}`);
      } else if (r.diagram_type === "diagram_b" || r.diagram_type === "diagram_b_backup") {
        have.diagram_b.add(`${subjectFamilyStatic(r.subject)}::${key}`);
      }
    }

    const missing: Array<{ subject: string; topic: string; canonicalKey: string; missingA: boolean; missingB: boolean }> = [];
    for (const [subject, topics] of Object.entries(CURRICULUM)) {
      for (const topic of topics) {
        const canonicalKey = canonicalTopicKey(topic);
        const family = subjectFamilyStatic(subject);
        const lookupKey = `${family}::${canonicalKey}`;
        const missingA = !have.diagram_a.has(lookupKey);
        const missingB = !have.diagram_b.has(lookupKey);
        if (missingA || missingB) {
          missing.push({ subject, topic, canonicalKey, missingA, missingB });
        }
      }
    }

    res.json({
      totalCurriculumTopics: Object.values(CURRICULUM).reduce((n, arr) => n + arr.length, 0),
      totalLibraryEntries: result.rows.length,
      topicsWithDiagramA: have.diagram_a.size,
      topicsWithDiagramB: have.diagram_b.size,
      missing,
    });
  } catch (err: any) {
    console.error("[diagramLibrary] GET /coverage error:", err);
    res.status(500).json({ error: "Failed to compute coverage" });
  }
});

// Helper: collapse any subject string into the canonical family used for
// coverage look-ups. Kept separate from the inline helper in /search so the
// coverage response stays stable even if /search evolves.
function subjectFamilyStatic(s: string): string {
  const v = (s || "").toLowerCase().trim();
  if (["biology", "chemistry", "physics", "science", "combined science", "triple science"].includes(v)) return "science";
  if (["math", "maths", "mathematics"].includes(v)) return "maths";
  if (["english", "english language", "english literature", "literacy"].includes(v)) return "english";
  if (["computing", "computer science", "ict"].includes(v)) return "computing";
  return v;
}

export default router;


// ─── POST /api/diagram-library/science-batch ─────────────────────────────────
// Imports or updates generated science assets from the validated taxonomy manifest.
// This route deliberately rejects every non-GPT Image 2 asset and leaves entries
// pending until a scientific reviewer has approved them.
router.post("/science-batch", requireAuth, async (req: any, res) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (!["admin", "superadmin"].includes(role)) {
      return res.status(403).json({ error: "Only administrators can import the science image library." });
    }

    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (!entries.length) return res.status(400).json({ error: "entries must be a non-empty array" });
    if (entries.length > 100) return res.status(400).json({ error: "Import no more than 100 entries per request" });

    const allowedTypes = new Set(["diagram_a", "diagram_b", "revision_map"]);
    const allowedStages = new Set(["KS1", "KS2", "KS3", "GCSE"]);
    let imported = 0;
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") return res.status(400).json({ error: "Every entry must be an object" });
      if (entry.generatorModel !== "gpt-image-2") return res.status(400).json({ error: "Only gpt-image-2 assets may enter the science library." });
      if (!allowedTypes.has(entry.diagramType)) return res.status(400).json({ error: "Invalid science diagram type" });
      if (!allowedStages.has(entry.stage)) return res.status(400).json({ error: "Invalid science stage" });
      if (!entry.assetId || !entry.title || !entry.topic || !entry.subtopic || !entry.imageUrl || !entry.prompt || !entry.promptVersion) {
        return res.status(400).json({ error: "Science entries require assetId, title, topic, subtopic, imageUrl, prompt and promptVersion" });
      }
      if (!String(entry.imageUrl).startsWith("/diagram-library/science/")) {
        return res.status(400).json({ error: "Science imageUrl must point to the deployed diagram-library/science asset directory" });
      }
      const tags = Array.isArray(entry.tags) ? entry.tags : [];
      const specificationRefs = Array.isArray(entry.specificationRefs) ? entry.specificationRefs : [];
      const reviewStatus = entry.reviewStatus === "approved" ? "approved" : "pending_scientific_review";
      await query(
        `INSERT INTO diagram_library (
           id, title, subject, topic, year_group, description, image_url, asset_ref, tags, source, curated, diagram_type,
           stage, discipline, subtopic, canonical_topic_key, canonical_subtopic_key, visual_profile, specification_refs,
           required_practical, generator_model, generation_prompt, prompt_version, review_status, scientific_review_notes, alt_text,
           created_at, updated_at
         ) VALUES (
           $1, $2, 'Science', $3, $4, $5, $6, $7, $8, 'science-gpt-image-2', 1, $9,
           $10, $11, $12, $13, $14, $15, $16, $17, 'gpt-image-2', $18, $19, $20, $21, $22,
           NOW(), NOW()
         ) ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           topic = EXCLUDED.topic,
           year_group = EXCLUDED.year_group,
           description = EXCLUDED.description,
           image_url = EXCLUDED.image_url,
           asset_ref = EXCLUDED.asset_ref,
           tags = EXCLUDED.tags,
           diagram_type = EXCLUDED.diagram_type,
           stage = EXCLUDED.stage,
           discipline = EXCLUDED.discipline,
           subtopic = EXCLUDED.subtopic,
           canonical_topic_key = EXCLUDED.canonical_topic_key,
           canonical_subtopic_key = EXCLUDED.canonical_subtopic_key,
           visual_profile = EXCLUDED.visual_profile,
           specification_refs = EXCLUDED.specification_refs,
           required_practical = EXCLUDED.required_practical,
           generator_model = EXCLUDED.generator_model,
           generation_prompt = EXCLUDED.generation_prompt,
           prompt_version = EXCLUDED.prompt_version,
           review_status = EXCLUDED.review_status,
           scientific_review_notes = EXCLUDED.scientific_review_notes,
           alt_text = EXCLUDED.alt_text,
           updated_at = NOW()`,
        [
          entry.assetId, entry.title, entry.topic, (entry.yearGroups || []).join(", "), entry.learningFocus || null,
          entry.imageUrl, entry.assetId, JSON.stringify(tags), entry.diagramType,
          entry.stage, entry.discipline || null, entry.subtopic, entry.canonicalTopicKey || canonicalTopicKey(entry.topic),
          entry.canonicalSubtopicKey || canonicalTopicKey(entry.subtopic), entry.visualProfile || null, JSON.stringify(specificationRefs),
          entry.requiredPractical ? 1 : 0, entry.prompt, entry.promptVersion, reviewStatus,
          entry.scientificReviewNotes || null, entry.altText || null,
        ]
      );
      imported += 1;
    }
    res.json({ success: true, imported, status: "Science assets were imported with GPT Image 2 provenance." });
  } catch (err: any) {
    console.error("[diagramLibrary] POST /science-batch error:", err);
    res.status(500).json({ error: "Failed to import science image batch" });
  }
});
