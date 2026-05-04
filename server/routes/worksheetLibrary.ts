/**
 * Worksheet Library Routes
 * Master worksheet library — curated and AI-generated worksheets stored for instant retrieval.
 *
 * GET    /api/library/entries              — list all library entries (admin)
 * GET    /api/library/lookup              — lookup by subject+topic+yearGroup (any authenticated user)
 * GET    /api/library/entries/:id         — get single entry (admin)
 * POST   /api/library/entries             — create/upsert a library entry (admin)
 * POST   /api/library/auto-save           — auto-save AI-generated worksheet (any authenticated user)
 * POST   /api/library/ingest-pdf          — parse a PDF and ingest it into the library (admin)
 * PATCH  /api/library/entries/:id/curate  — mark as curated (admin)
 * DELETE /api/library/entries/:id         — delete a library entry (admin)
 */

import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import db from "../db/index.js";
import { query } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import type { NextFunction } from "express";
import { applyOverlays, extractBaseStructure, extractDiagramSlots, computeStructuralHash } from "../lib/overlayEngine.js";
import { canonicalTopicKey } from "../lib/topicNormalizer.js";

// Only the platform super-admin can access the library
const SUPER_ADMIN_EMAILS = ["admin@adaptly.co.uk", "admin@sendassistant.app"];
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  if (!SUPER_ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ error: "Super-admin access required" });
  }
  next();
}

const pdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

function normalizeTier(value?: string | null): string {
  const tier = (value || "mixed").toLowerCase().trim();
  if (["base", "standard", "mixed"].includes(tier)) return "mixed";
  if (["send", "scaffolded"].includes(tier)) return "scaffolded";
  if (["foundation", "higher", "mixed", "scaffolded"].includes(tier)) return tier;
  return "mixed";
}

function tierCandidates(value?: string | null): string[] {
  const normal = normalizeTier(value);
  if (normal === "mixed") return ["mixed", "base", "standard"];
  if (normal === "scaffolded") return ["scaffolded", "send"];
  return [normal];
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LibraryEntry {
  id: string;
  subject: string;
  topic: string;
  year_group: string;
  title: string;
  subtitle?: string;
  tier: string;              // 'mixed' | 'foundation' | 'higher' | 'scaffolded' | 'standard'
  send_need?: string;        // optional SEND need this was built for
  sections: string;          // JSON string
  teacher_sections: string;  // JSON string
  key_vocab: string;         // JSON string
  learning_objective?: string;
  source: string;
  curated: number;
  version: number;
  uploaded_by?: string;
  // Base+Variant architecture
  base_entry_id?: string;    // null = this IS a base entry; set = this is a variant
  base_version?: number;     // version of base entry this was derived from
  base_structure_json: string;  // JSON: { sectionIds, sectionTypes, diagramSlotIds, structuralHash }
  diagram_slots_json: string;   // JSON array of diagram slot descriptors
  applied_overlays: string;     // JSON array of AppliedOverlay objects
  canonical_topic_key?: string; // normalised topic key (e.g. 'atomic_structure')
  created_at: string;
  updated_at: string;
}

interface LibraryAsset {
  id: string;
  library_entry_id: string;
  section_key: string;
  asset_type: string;
  content_hash?: string;
  storage_key?: string;
  public_url: string;
  width?: number;
  height?: number;
  alt_text?: string;
  topic_tags: string; // JSON string
  created_at: string;
  updated_at: string;
}

interface ParsedWorksheet {
  title?: string;
  sections: any[];
  teacherSections: any[];
  keyVocab: Array<{ term: string; definition: string }>;
  learningObjective: string;
}

// ── GET /api/library/entries — list all entries ───────────────────────────────

router.get("/entries", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { subject, curated, search } = req.query as Record<string, string>;
    let sql = `SELECT id, subject, topic, year_group, tier, title, source, curated, version, created_at, updated_at,
               COALESCE(json_array_length(NULLIF(sections, '')::json), 0) as sections_count,
               COALESCE(json_array_length(NULLIF(teacher_sections, '')::json), 0) as teacher_sections_count
               FROM worksheet_library WHERE 1=1`;
    const params: unknown[] = [];

    if (subject) { sql += " AND subject = ?"; params.push(subject); }
    if (curated !== undefined) { sql += " AND curated = ?"; params.push(curated === "true" ? 1 : 0); }
    if (search) { sql += " AND (topic LIKE ? OR title LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

    sql += " ORDER BY subject ASC, year_group ASC, topic ASC";

    const entries = await db.prepare(sql).all(...params);
    res.json({ entries });
  } catch (err: any) {
    console.error("Library list error:", err.message);
    res.status(500).json({ error: "Failed to list library" });
  }
});

/// ── Subject expansion map: broad UI subject → specific library subjects ─────────
const SUBJECT_EXPANSION: Record<string, string[]> = {
  // Science expands to all science subjects
  Science:  ["Physics", "Biology", "Chemistry", "Science", "physics", "biology", "chemistry", "science"],
  science:  ["Physics", "Biology", "Chemistry", "Science", "physics", "biology", "chemistry", "science"],
  // Individual sciences — match both capitalised and lowercase (PDFs ingested as lowercase)
  Chemistry: ["Chemistry", "chemistry"],
  chemistry: ["Chemistry", "chemistry"],
  Biology:   ["Biology", "biology"],
  biology:   ["Biology", "biology"],
  Physics:   ["Physics", "physics"],
  physics:   ["Physics", "physics"],
  // Maths
  Maths:    ["Maths", "Mathematics", "maths", "mathematics"],
  maths:    ["Maths", "Mathematics", "maths", "mathematics"],
  Mathematics: ["Maths", "Mathematics", "maths", "mathematics"],
  mathematics: ["Maths", "Mathematics", "maths", "mathematics"],
  // Other subjects
  "Computer Science": ["Computer Science", "Computing"],
  "computer science": ["Computer Science", "Computing"],
  Computing: ["Computing", "Computer Science"],
  computing: ["Computing", "Computer Science"],
  "Design & Technology": ["Design & Technology", "DT"],
  "Religious Education": ["Religious Education", "RE"],
  "Business Studies": ["Business Studies", "Business"],
  "Physical Education": ["PE", "Physical Education"],
  PE: ["PE", "Physical Education"],
  pe: ["PE", "Physical Education"],
  MFL: ["MFL", "French", "Spanish", "German"],
  mfl: ["MFL", "French", "Spanish", "German"],
  "Art & Design": ["Art", "Art & Design"],
  "art & design": ["Art", "Art & Design"],
  Art: ["Art", "Art & Design"],
  art: ["Art", "Art & Design"],
  "Modern Foreign Languages": ["MFL", "French", "Spanish", "German", "Modern Foreign Languages"],
  "modern foreign languages": ["MFL", "French", "Spanish", "German", "Modern Foreign Languages"],
};

// ── Topic keyword map: UI topic keywords → library topic keywords ─────────────
// Used for fuzzy matching when exact topic name doesn't match
const TOPIC_KEYWORD_MAP: Array<[string[], string[]]> = [
  [["electricity", "circuit", "ohm"], ["electricity", "circuit", "electrical"]],
  [["atomic structure", "atomic model", "subatomic"], ["atomic structure", "atomic", "nuclear", "subatomic", "proton", "neutron", "electron"]],
  [["waves"], ["waves", "wave"]],
  [["forces", "motion", "newton"], ["forces", "motion", "free body", "vector"]],
  [["energy"], ["energy", "sankey", "specific heat"]],
  [["magnetism", "electromagnetism", "motor"], ["motor effect", "magnetic", "transformer", "fleming"]],
  [["nuclear", "radioactiv"], ["nuclear", "half-life", "half life", "decay"]],
  [["particle", "states of matter"], ["particle model", "states"]],
  [["light", "optics", "ray"], ["ray diagram", "electromagnetic spectrum"]],
  [["pressure", "fluid"], ["pressure", "fluid", "hydraulic"]],
  [["space", "solar system", "star"], ["solar system", "star life cycle"]],
  [["mitosis", "cell division", "cell biology"], ["mitosis", "cell"]],
  [["dna", "genetics", "inheritance"], ["dna", "genetics", "inheritance"]],
  [["photosynthesis", "bioenergetics"], ["photosynthesis"]],
  [["heart", "circulatory"], ["heart", "circulatory"]],
  [["homeostasis", "nervous", "hormone"], ["homeostasis", "nervous", "hormone"]],
  [["ionic", "covalent", "bonding"], ["ionic bonding", "covalent", "bonding"]],
  [["organic chemistry", "alkane", "alkene"], ["alkane", "alkene", "organic"]],
  [["quadratic", "quadratics"], ["quadratic", "quadratics"]],
  [["linear equation", "solving equation", "simple equation"], ["linear equation", "solving equation", "simple equation", "one-step", "two-step"]],
  [["algebraic fraction"], ["algebraic fraction"]],
  [["algebra", "algebraic"], ["algebra", "algebraic", "expression", "expand", "factorise", "simplify"]],
  [["geometry", "angles", "shape"], ["geometry", "angles", "shape"]],
  [["probability"], ["probability"]],
  [["statistics", "data"], ["statistics", "data"]],
  [["vectors"], ["vectors", "vector"]],
  [["fractions", "ratio", "number"], ["fractions", "ratio", "number"]],
];

function expandSubjects(subject: string): string[] {
  return SUBJECT_EXPANSION[subject] || SUBJECT_EXPANSION[subject.toLowerCase()] || [subject];
}

function topicKeywordsMatch(uiTopic: string, libraryTopic: string): boolean {
  const ui = uiTopic.toLowerCase().trim();
  const lib = libraryTopic.toLowerCase().trim();
  // Exact match
  if (lib === ui) return true;
  // Direct substring match — require whole-word boundary to avoid
  // "Atom Economy" matching "Atomic Structure"
  const wordBoundaryMatch = (haystack: string, needle: string): boolean => {
    if (needle.length < 4) return false; // too short to be reliable
    const re = new RegExp("(^|[\\s,:\\-])(" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")($|[\\s,:\\-])", "i");
    return re.test(haystack);
  };
  if (wordBoundaryMatch(lib, ui) || wordBoundaryMatch(ui, lib)) return true;
  // Keyword group match — use word-boundary matching for each keyword
  for (const [uiKeys, libKeys] of TOPIC_KEYWORD_MAP) {
    const uiMatch = uiKeys.some(k => k.length >= 4 && wordBoundaryMatch(ui, k));
    const libMatch = libKeys.some(k => k.length >= 4 && wordBoundaryMatch(lib, k));
    if (uiMatch && libMatch) return true;
  }
  return false;
}

function isSafeTierTopicMatch(uiTopic: string, libraryTopic: string): boolean {
  const normalizeTokens = (value: string) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => token.length > 2)
    .filter(token => ![
      "maths",
      "math",
      "mathematics",
      "worksheet",
      "worksheets",
      "question",
      "questions",
      "year",
      "higher",
      "foundation",
      "standard",
      "scaffolded",
      "gcse",
      "ks3",
      "ks4",
      "tier",
      "level",
      "topic",
    ].includes(token));

  const ui = uiTopic.toLowerCase().trim();
  const lib = libraryTopic.toLowerCase().trim();

  if (lib.includes(ui) || ui.includes(lib)) {
    return true;
  }

  const uiTokens = normalizeTokens(uiTopic);
  const libTokens = normalizeTokens(libraryTopic);
  const sharedTokens = uiTokens.filter(token => libTokens.includes(token));

  if (sharedTokens.length >= 2) {
    return true;
  }

  return false;
}

// ── GET /api/library/lookup — lookup by subject+topic+yearGroup[+tier] ──────────
// Returns the matching entry enriched for immediate worksheet rendering.
router.get("/lookup", requireAuth, async (req: Request, res: Response) => {
  try {
    const { subject, topic, yearGroup, tier } = req.query as Record<string, string>;
    if (!subject || !topic || !yearGroup) {
      return res.status(400).json({ error: "subject, topic and yearGroup are required" });
    }

    const requestedTier = (tier || "mixed").toLowerCase().trim();
    const entry = await findLibraryEntry(subject, topic, yearGroup, requestedTier);
    if (!entry) {
      return res.json({ found: false });
    }

    const sections: any[] = JSON.parse(entry.sections || "[]");
    const teacherSections: any[] = JSON.parse(entry.teacher_sections || "[]");
    const keyVocab: any[] = JSON.parse(entry.key_vocab || "[]");
     const assets = await resolveEntryAssets(entry.id);
    const sectionsWithAssets = injectAssetRefs(sections, assets);
    const availableTiers = await findAvailableTiers(subject, topic, yearGroup);
    // If the entry has fewer than 5 sections it is incomplete — signal the client
    // to fall through to AI generation rather than serving a broken worksheet.
    const isComplete = sectionsWithAssets.length >= 5;
    if (!isComplete) {
      return res.json({ found: false, incomplete: true });
    }
    res.json({
      found: true,
      // Return sections at the top level so the client (libData.sections) can read them directly.
      sections: sectionsWithAssets,
      teacherSections,
      title: entry.title,
      subtitle: entry.subtitle,
      curated: !!entry.curated,
      worksheetManifest: {
        sourceLibraryId: entry.id,
        canonicalTopicKey: entry.canonical_topic_key || canonicalTopicKey(topic),
        tier: entry.tier,
        yearGroup,
      },
      entry: {
        ...entry,
        sections: sectionsWithAssets,
        teacher_sections: teacherSections,
        key_vocab: keyVocab,
        curated: !!entry.curated,
      },
      availableTiers,
      canonicalTopicKey: entry.canonical_topic_key || canonicalTopicKey(topic),
      structuralHash: computeStructuralHash(sections),
      assets: assets.map(a => ({ id: a.id, sectionKey: a.section_key, publicUrl: a.public_url, assetType: a.asset_type })),
    });
  } catch (err: any) {
    console.error("Library lookup error:", err.message);
    res.status(500).json({ error: "Failed to lookup library" });
  }
});

// ── GET /api/library/lookup-tier — lookup a specific tier for differentiation ──
// Used by the Differentiate button to fetch the correct tier worksheet.

router.get("/lookup-tier", requireAuth, async (req: Request, res: Response) => {
  try {
    const { subject, topic, yearGroup, tier } = req.query as Record<string, string>;
    if (!subject || !topic || !yearGroup || !tier) {
      return res.status(400).json({ error: "subject, topic, yearGroup and tier are required" });
    }

    const topicNorm = topic.toLowerCase().trim();
    const subjectsToSearch = expandSubjects(subject);
    // Normalise subjects to lowercase for case-insensitive matching
    const subjectsNorm = subjectsToSearch.map(s => s.toLowerCase());
    const placeholders = subjectsNorm.map(() => "?").join(",");
    const ygNum = yearGroup.replace(/[^0-9]/g, "");

    // Normalise tier name: handle both old naming (standard/scaffolded) and new naming (base/send)
    // The main library uses 'base' for standard/mixed, 'send' for SEND scaffolded
    // Older entries use 'standard' and 'scaffolded'
    const normalizedTier = tier.toLowerCase().trim();
    const tierAliases: Record<string, string[]> = {
      base:       ["base", "standard", "mixed"],
      standard:   ["standard", "base", "mixed"],
      mixed:      ["mixed", "base", "standard"],
      send:       ["send", "scaffolded"],
      scaffolded: ["scaffolded", "send"],
      foundation: ["foundation"],
      higher:     ["higher"],
    };
    const tiersToTry = tierAliases[normalizedTier] || [normalizedTier];

    let entry: LibraryEntry | undefined;

    // Try each tier alias in order
    for (const t of tiersToTry) {
      // Try exact match with requested tier + year group (case-insensitive subject)
      entry = await db.prepare(
        `SELECT * FROM worksheet_library
         WHERE LOWER(subject) IN (${placeholders})
           AND (LOWER(topic) = ? OR LOWER(topic) LIKE ?)
           AND (year_group = ? OR year_group LIKE ? OR year_group LIKE ?)
           AND tier = ?
         ORDER BY curated DESC LIMIT 1`
      ).get(...subjectsNorm, topicNorm, `%${topicNorm}%`, yearGroup, `%${ygNum}%`, `%/${ygNum}%`, t) as LibraryEntry | undefined;
      if (entry) break;

      // Fuzzy: any year group with this tier
      entry = await db.prepare(
        `SELECT * FROM worksheet_library
         WHERE LOWER(subject) IN (${placeholders}) AND (LOWER(topic) = ? OR LOWER(topic) LIKE ?) AND tier = ?
         ORDER BY curated DESC, updated_at DESC LIMIT 1`
      ).get(...subjectsNorm, topicNorm, `%${topicNorm}%`, t) as LibraryEntry | undefined;
      if (entry) break;

      // Fuzzy topic keyword match with this tier
      const allEntriesForTier = await db.prepare(
        `SELECT * FROM worksheet_library WHERE LOWER(subject) IN (${placeholders}) AND tier = ? ORDER BY curated DESC`
      ).all(...subjectsNorm, t) as LibraryEntry[];
      entry = allEntriesForTier.find(e => topicKeywordsMatch(topic, e.topic));
      if (entry) break;
    }

    // Fallback: any tier for this topic (keyword match), prefer base/standard
    if (!entry) {
      const allEntries = await db.prepare(
        `SELECT * FROM worksheet_library WHERE LOWER(subject) IN (${placeholders}) ORDER BY CASE tier WHEN 'base' THEN 0 WHEN 'standard' THEN 0 ELSE 1 END, curated DESC`
      ).all(...subjectsNorm) as LibraryEntry[];
      entry = allEntries.find(e => topicKeywordsMatch(topic, e.topic));
    }

    if (!entry) {
      return res.json({ found: false });
    }

    res.json({
      found: true,
      entry: {
        ...entry,
        sections: JSON.parse(entry.sections || "[]"),
        teacher_sections: JSON.parse(entry.teacher_sections || "[]"),
        key_vocab: JSON.parse(entry.key_vocab || "[]"),
        curated: !!entry.curated,
      },
    });
  } catch (err: any) {
    console.error("Library lookup-tier error:", err.message);
    res.status(500).json({ error: "Failed to lookup tier" });
  }
});

// ── GET /api/library/entries/:id — get single entry ──────────────────────────

router.get("/entries/:id", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const entry = await db.prepare("SELECT * FROM worksheet_library WHERE id = ?").get(req.params.id) as LibraryEntry | undefined;
    if (!entry) return res.status(404).json({ error: "Not found" });

    res.json({
      entry: {
        ...entry,
        sections: JSON.parse(entry.sections || "[]"),
        teacher_sections: JSON.parse(entry.teacher_sections || "[]"),
        key_vocab: JSON.parse(entry.key_vocab || "[]"),
        curated: !!entry.curated,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get entry" });
  }
});

/// ── PUT /api/library/entries/:id — update a library entry directly by ID ────────
router.put("/entries/:id", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sections, teacher_sections, key_vocab, title, subtitle, learning_objective } = req.body;
    const existing = await db.prepare("SELECT id, version FROM worksheet_library WHERE id = ?").get(id) as { id: string; version: number } | undefined;
    if (!existing) return res.status(404).json({ error: "Entry not found" });
    const version = existing.version + 1;
    await db.prepare(`
      UPDATE worksheet_library SET
        sections = ?, teacher_sections = ?, key_vocab = ?,
        title = COALESCE(?, title), subtitle = COALESCE(?, subtitle),
        learning_objective = COALESCE(?, learning_objective),
        version = ?, updated_at = NOW()
      WHERE id = ?
    `).run(
      JSON.stringify(sections || []),
      JSON.stringify(teacher_sections || []),
      JSON.stringify(key_vocab || []),
      title || null, subtitle || null, learning_objective || null,
      version, id
    );
    res.json({ success: true, id, version });
  } catch (err: any) {
    console.error("Library update error:", err.message);
    res.status(500).json({ error: "Failed to update library entry" });
  }
});

// ── POST /api/library/entries — create or upsert a library entry ──────────────
router.post("/entries", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      subject, topic, yearGroup, title, subtitle,
      sections, teacher_sections, key_vocab,
      learning_objective, source, curated,
    } = req.body;

    const year_group = yearGroup || req.body.year_group;
    // tier: 'standard' | 'foundation' | 'higher' | 'scaffolded' — each stored as a separate row
    const tier = (req.body.tier || "standard").toLowerCase().trim();

    if (!subject || !topic || !year_group || !title) {
      return res.status(400).json({ error: "subject, topic, yearGroup and title are required" });
    }

    // Check if already exists — keyed by subject + topic + year_group + tier
    const existing = await db.prepare(
      "SELECT id, version, curated FROM worksheet_library WHERE subject = ? AND topic = ? AND year_group = ? AND tier = ?"
    ).get(subject, topic, year_group, tier) as { id: string; version: number; curated: number } | undefined;

    // Don't overwrite curated entries with non-curated ones
    if (existing?.curated && !curated) {
      return res.json({ success: true, id: existing.id, skipped: true, reason: "curated entry preserved" });
    }

    const id = existing?.id || uuidv4();
    const version = existing ? (existing.version + 1) : 1;

    if (existing) {
      await db.prepare(`
        UPDATE worksheet_library SET
          title = ?, subtitle = ?, sections = ?, teacher_sections = ?,
          key_vocab = ?, learning_objective = ?, source = ?, curated = ?,
          tier = ?, version = ?, uploaded_by = ?, updated_at = NOW()
        WHERE id = ?
      `).run(
        title, subtitle || null,
        JSON.stringify(sections || []),
        JSON.stringify(teacher_sections || []),
        JSON.stringify(key_vocab || []),
        learning_objective || null,
        source || "upload",
        curated ? 1 : 0,
        tier,
        version,
        (req as any).user?.id || null,
        id
      );
    } else {
      await db.prepare(`
        INSERT INTO worksheet_library
          (id, subject, topic, year_group, title, subtitle, sections, teacher_sections,
           key_vocab, learning_objective, source, curated, tier, version, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, subject, topic, year_group, title, subtitle || null,
        JSON.stringify(sections || []),
        JSON.stringify(teacher_sections || []),
        JSON.stringify(key_vocab || []),
        learning_objective || null,
        source || "upload",
        curated ? 1 : 0,
        tier,
        version,
        (req as any).user?.id || null
      );
    }

    res.json({ success: true, id, version, upserted: !!existing });
  } catch (err: any) {
    console.error("Library create error:", err.message);
    res.status(500).json({ error: "Failed to save library entry" });
  }
});

// ── POST /api/library/auto-save — auto-save AI-generated worksheet ────────────

router.post("/auto-save", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      subject, topic, yearGroup, title, subtitle,
      sections, teacher_sections, key_vocab, learning_objective,
    } = req.body;

    const year_group = yearGroup || req.body.year_group;

    if (!subject || !topic || !year_group || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Only auto-save if no curated entry exists
    const existing = await db.prepare(
      "SELECT id, curated FROM worksheet_library WHERE subject = ? AND topic = ? AND year_group = ?"
    ).get(subject, topic, year_group) as { id: string; curated: number } | undefined;

    if (existing?.curated) {
      return res.json({ success: true, skipped: true, reason: "curated entry preserved" });
    }

    const id = existing?.id || uuidv4();

    if (existing) {
      await db.prepare(`
        UPDATE worksheet_library SET
          title = ?, subtitle = ?, sections = ?, teacher_sections = ?,
          key_vocab = ?, learning_objective = ?, source = 'ai',
          updated_at = NOW()
        WHERE id = ?
      `).run(
        title, subtitle || null,
        JSON.stringify(sections || []),
        JSON.stringify(teacher_sections || []),
        JSON.stringify(key_vocab || []),
        learning_objective || null,
        id
      );
    } else {
      await db.prepare(`
        INSERT INTO worksheet_library
          (id, subject, topic, year_group, title, subtitle, sections, teacher_sections,
           key_vocab, learning_objective, source, curated, version, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ai', 0, 1, ?)
      `).run(
        id, subject, topic, year_group, title, subtitle || null,
        JSON.stringify(sections || []),
        JSON.stringify(teacher_sections || []),
        JSON.stringify(key_vocab || []),
        learning_objective || null,
        (req as any).user?.id || null
      );
    }

    res.json({ success: true, id });
  } catch (err: any) {
    console.error("Library auto-save error:", err.message);
    res.status(500).json({ error: "Failed to auto-save" });
  }
});

// ── POST /api/library/ingest-pdf — parse PDF and ingest into library ──────────

router.post("/ingest-pdf", requireAuth, requireSuperAdmin, pdfUpload.single("pdf"), async (req: Request, res: Response) => {
  try {
    const { subject, topic, yearGroup, title, subtitle, learning_objective } = req.body;
    const year_group = yearGroup || req.body.year_group;
    // tier: 'standard' | 'foundation' | 'higher' | 'scaffolded' — each stored as a separate row
    const tier = (req.body.tier || "standard").toLowerCase().trim();

    if (!subject || !topic || !year_group) {
      return res.status(400).json({ error: "subject, topic and yearGroup are required" });
    }

    // Extract text from the uploaded PDF
    let pdfText = "";
    if (req.file) {
      // Primary: pdf-parse (works on text-based PDFs)
      try {
        const pdfParse = (await import("pdf-parse" as any)).default;
        const result = await pdfParse(req.file.buffer);
        pdfText = result.text || "";
        console.log(`[library/ingest-pdf] pdf-parse extracted ${pdfText.length} chars`);
      } catch (e: any) {
        console.warn("[library/ingest-pdf] pdf-parse failed:", e?.message);
      }

      // Fallback: pdftotext (poppler-utils) for image-based or complex PDFs
      if (!pdfText || pdfText.trim().length < 50) {
        try {
          const { execSync } = await import("child_process");
          const { writeFileSync, unlinkSync } = await import("fs");
          const os = await import("os");
          const path = await import("path");
          const tmpIn = path.join(os.tmpdir(), `ingest_${Date.now()}.pdf`);
          const tmpOut = path.join(os.tmpdir(), `ingest_${Date.now()}.txt`);
          writeFileSync(tmpIn, req.file.buffer);
          try {
            execSync(`pdftotext -layout "${tmpIn}" "${tmpOut}"`, { timeout: 30000 });
            const { readFileSync } = await import("fs");
            pdfText = readFileSync(tmpOut, "utf8");
            console.log(`[library/ingest-pdf] pdftotext extracted ${pdfText.length} chars`);
          } finally {
            try { unlinkSync(tmpIn); } catch {}
            try { unlinkSync(tmpOut); } catch {}
          }
        } catch (e2: any) {
          console.warn("[library/ingest-pdf] pdftotext fallback failed:", e2?.message);
        }
      }

      if (!pdfText || pdfText.trim().length < 50) {
        return res.status(422).json({ error: "Could not extract text from PDF. Ensure the file contains readable text." });
      }
    } else if (req.body.pdfText) {
      pdfText = req.body.pdfText;
    } else {
      return res.status(400).json({ error: "No PDF file or pdfText provided" });
    }

    if (!pdfText || pdfText.trim().length < 50) {
      return res.status(422).json({ error: "Not enough text extracted from PDF." });
    }

    // Use OpenAI to intelligently parse the PDF into worksheet sections
    let parsed: ParsedWorksheet;
    try {
      parsed = await parsePdfWithAI(pdfText, subject, topic);
    } catch (aiErr: any) {
      console.warn("[library/ingest-pdf] AI parse failed, falling back to regex parser:", aiErr?.message);
      parsed = parsePdfToSections(pdfText, subject, topic);
    }

    // Check if already exists — keyed by subject + topic + year_group + tier
    // Each tier (standard/foundation/higher/scaffolded) is stored as a separate row.
    const existing = await db.prepare(
      "SELECT id, version FROM worksheet_library WHERE subject = ? AND topic = ? AND year_group = ? AND tier = ?"
    ).get(subject, topic, year_group, tier) as { id: string; version: number } | undefined;

    const id = existing?.id || uuidv4();
    const version = existing ? (existing.version + 1) : 1;
    // Use explicit title if provided, otherwise use the parsed title from AI, otherwise use topic name
    // Never use the first section's title (e.g. "Question 1") as the worksheet title
    const parsedTitle = parsed.title && !parsed.title.match(/^question\s*\d/i) ? parsed.title : null;
    const entryTitle = title || parsedTitle || topic;

    if (existing) {
      await db.prepare(`
        UPDATE worksheet_library SET
          title = ?, subtitle = ?, sections = ?, teacher_sections = ?,
          key_vocab = ?, learning_objective = ?, source = 'pdf', curated = 1,
          tier = ?, version = ?, uploaded_by = ?, updated_at = NOW()
        WHERE id = ?
      `).run(
        entryTitle, subtitle || null,
        JSON.stringify(parsed.sections),
        JSON.stringify(parsed.teacherSections),
        JSON.stringify(parsed.keyVocab),
        learning_objective || parsed.learningObjective || null,
        tier, version, (req as any).user?.id || null, id
      );
    } else {
      await db.prepare(`
        INSERT INTO worksheet_library
          (id, subject, topic, year_group, title, subtitle, sections, teacher_sections,
           key_vocab, learning_objective, source, curated, tier, version, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pdf', 1, ?, ?, ?)
      `).run(
        id, subject, topic, year_group, entryTitle, subtitle || null,
        JSON.stringify(parsed.sections),
        JSON.stringify(parsed.teacherSections),
        JSON.stringify(parsed.keyVocab),
        learning_objective || parsed.learningObjective || null,
        tier, version, (req as any).user?.id || null
      );
    }

    res.json({
      success: true,
      id,
      version,
      upserted: !!existing,
      sections_count: parsed.sections.length,
      teacher_sections_count: parsed.teacherSections.length,
      key_vocab_count: parsed.keyVocab.length,
      learning_objective: parsed.learningObjective,
    });
  } catch (err: any) {
    console.error("Library ingest-pdf error:", err.message);
    res.status(500).json({ error: "Failed to ingest PDF: " + err.message });
  }
});

// ── PATCH /api/library/entries/:id/curate — mark as curated ──────────────────

router.patch("/entries/:id/curate", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { curated } = req.body;
    await db.prepare(
      "UPDATE worksheet_library SET curated = ?, updated_at = NOW() WHERE id = ?"
    ).run(curated ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update curation status" });
  }
});

// ── PATCH /api/library/entries/:id/reingest-teacher — re-parse teacher sections from PDF ──

router.patch("/entries/:id/reingest-teacher", requireAuth, requireSuperAdmin, pdfUpload.single("pdf"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.prepare("SELECT id FROM worksheet_library WHERE id = ?").get(id) as { id: string } | undefined;
    if (!existing) return res.status(404).json({ error: "Entry not found" });
    let pdfText = "";
    if (req.file) {
      try {
        const pdfParse = (await import("pdf-parse" as any)).default;
        const result = await pdfParse(req.file.buffer);
        pdfText = result.text || "";
      } catch (e: any) {
        console.warn("[reingest-teacher] pdf-parse failed:", e?.message);
      }
      if (!pdfText || pdfText.trim().length < 50) {
        try {
          const { execSync } = await import("child_process");
          const { writeFileSync, unlinkSync, readFileSync } = await import("fs");
          const os = await import("os");
          const path = await import("path");
          const tmpIn = path.join(os.tmpdir(), `reingest_${Date.now()}.pdf`);
          const tmpOut = path.join(os.tmpdir(), `reingest_${Date.now()}.txt`);
          writeFileSync(tmpIn, req.file.buffer);
          try {
            execSync(`pdftotext -layout "${tmpIn}" "${tmpOut}"`, { timeout: 30000 });
            pdfText = readFileSync(tmpOut, "utf8");
          } finally {
            try { unlinkSync(tmpIn); } catch {}
            try { unlinkSync(tmpOut); } catch {}
          }
        } catch (e2: any) {
          console.warn("[reingest-teacher] pdftotext fallback failed:", e2?.message);
        }
      }
    } else if (req.body && req.body.pdfText) {
      pdfText = req.body.pdfText;
    }
    if (!pdfText) return res.status(400).json({ error: "No PDF text could be extracted" });
    const teacherSections: any[] = [];
    const teacherMatch = pdfText.match(/TEACHER COPY[\s\S]*$/i);
    if (teacherMatch) {
      teacherSections.push({
        id: uuidv4(),
        type: "q-teacher-answers",
        title: "ANSWER KEY",
        content: teacherMatch[0].trim(),
        teacherOnly: true,
      });
    }
    await db.prepare("UPDATE worksheet_library SET teacher_sections = ?, updated_at = NOW() WHERE id = ?").run(
      JSON.stringify(teacherSections), id
    );
    res.json({ success: true, teacherSectionsCount: teacherSections.length, preview: teacherSections[0]?.content?.substring(0, 200) });
  } catch (err: any) {
    console.error("[reingest-teacher] error:", err.message);
    res.status(500).json({ error: "Failed to re-ingest teacher sections", detail: err.message });
  }
});

// ── DELETE /api/library/entries/:id — delete a library entry ─────────────────

router.delete("/entries/:id", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    await db.prepare("DELETE FROM worksheet_library WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

// ── DELETE /api/library/entries — delete ALL library entries (super-admin only) ──

router.delete("/entries", requireAuth, requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await db.prepare("DELETE FROM worksheet_library").run();
    res.json({ success: true, deleted: (result as any).changes ?? 0 });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete all entries", detail: err.message });
  }
});

// ── AI-powered PDF Parser ─────────────────────────────────────────────────────

/**
 * Use OpenAI to intelligently parse PDF text into structured WorksheetSection objects.
 */
async function parsePdfWithAI(pdfText: string, subject: string, topic: string): Promise<ParsedWorksheet> {
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Use up to 20,000 chars to capture full multi-page worksheets
  const truncatedText = pdfText.slice(0, 20000);

  const systemPrompt = `You are an expert at parsing educational worksheets into structured JSON.
You will receive raw text extracted from a PDF worksheet and must convert it into a structured JSON object.

Return ONLY valid JSON with this exact structure:
{
  "title": "string — the worksheet topic title (e.g. 'Atomic Structure', NOT 'Question 1')",
  "subtitle": "string — subtitle or null",
  "learningObjective": "string — the learning objective or empty string",
  "keyVocab": [{"term": "string", "definition": "string"}],
  "sections": [
    {
      "id": "unique-id-string",
      "type": "one of: q-mcq | q-gap-fill | q-true-false | q-short-answer | q-free-response | q-label-diagram | q-worked-example | self-reflection | key-terms | brain-break | stop-check",
      "title": "string",
      "label": "string — e.g. MULTIPLE CHOICE, GAP FILL, TRUE / FALSE, SHORT ANSWER",
      "content": "string — the full question text including all sub-parts (a), (b), (c) etc.",
      "marks": number or null,
      "teacherOnly": false
    }
  ],
  "teacherSections": [
    {
      "id": "unique-id-string",
      "type": "q-teacher-answers",
      "title": "ANSWER KEY",
      "content": "string — all teacher answers",
      "teacherOnly": true
    }
  ]
}

Rules:
- The title MUST be the topic name (e.g. 'Atomic Structure'), NEVER a question number
- Each question in the worksheet becomes a separate section object
- Include ALL questions — do not truncate or skip any
- Identify question types: MCQ (multiple choice A/B/C/D), gap fill (blanks/word bank), true/false, short answer, free response
- For short answer questions with multiple sub-parts (a)(b)(c), keep them in ONE section with type q-short-answer
- COMMON MISTAKES sections MUST be extracted as a section with type "common-mistakes"
- WORKED EXAMPLE sections MUST be extracted as a section with type "q-worked-example"
- KEY VOCABULARY sections go in the keyVocab array AND as a section with type "key-terms"
- Teacher answer keys go in teacherSections with teacherOnly: true
- Self-reflection tables go in sections with type "self-reflection"
- Brain breaks go with type "brain-break"
- Stop/check prompts go with type "stop-check"
- Preserve all question text exactly as written, including word banks and answer options
- Generate unique IDs like "s1", "s2", "s3" etc.
- Do not include markdown, only return the JSON object`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Parse this ${subject} worksheet about "${topic}" into structured JSON:\n\n${truncatedText}` },
    ],
    temperature: 0.1,
    max_tokens: 10000,
  });

  const rawJson = response.choices[0]?.message?.content?.trim() || "";
  const cleanJson = rawJson.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(cleanJson);

  const sections = (parsed.sections || []).map((s: any, i: number) => ({
    ...s,
    id: s.id || `s${i + 1}`,
  }));
  const teacherSections = (parsed.teacherSections || []).map((s: any, i: number) => ({
    ...s,
    id: s.id || `ts${i + 1}`,
    teacherOnly: true,
  }));

  return {
    title: parsed.title || undefined,
    sections,
    teacherSections,
    keyVocab: parsed.keyVocab || [],
    learningObjective: parsed.learningObjective || "",
  };
}

// ── Regex-based PDF Parser (fallback) ─────────────────────────────────────────

/**
 * Fallback parser using regex to parse standard Adaptly worksheet format.
 */
function parsePdfToSections(text: string, subject: string, topic: string): ParsedWorksheet {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const sections: any[] = [];
  const teacherSections: any[] = [];
  const keyVocab: Array<{ term: string; definition: string }> = [];
  let learningObjective = "";

  for (const line of lines) {
    if (line.toLowerCase().startsWith("learning objective:")) {
      learningObjective = line.replace(/learning objective:/i, "").trim();
      break;
    }
  }

  let inVocab = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^KEY VOCAB/i.test(line)) { inVocab = true; continue; }
    if (inVocab && /^(SECTION|COMMON MISTAKES|WORKED EXAMPLE|TEACHER COPY)/i.test(line)) { inVocab = false; }
    if (inVocab) {
      const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (colonMatch) {
        keyVocab.push({ term: colonMatch[1].trim(), definition: colonMatch[2].trim() });
      }
    }
  }

  const sectionBoundaries: Array<{ index: number; title: string; isTeacher: boolean }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^SECTION\s+\d+\s*[—–-]/i.test(line) || /^SECTION\s+\d+$/i.test(line)) {
      sectionBoundaries.push({ index: i, title: line, isTeacher: false });
    } else if (/^(H\s+)?CHALLENGE QUESTION/i.test(line)) {
      sectionBoundaries.push({ index: i, title: "CHALLENGE QUESTION", isTeacher: false });
    } else if (/^SELF REFLECTION/i.test(line)) {
      sectionBoundaries.push({ index: i, title: "SELF REFLECTION", isTeacher: false });
    } else if (/^TEACHER COPY|^ANSWER KEY/i.test(line)) {
      sectionBoundaries.push({ index: i, title: "TEACHER COPY — ANSWER KEY", isTeacher: true });
    }
  }

  for (let s = 0; s < sectionBoundaries.length; s++) {
    const start = sectionBoundaries[s].index;
    const end = s + 1 < sectionBoundaries.length ? sectionBoundaries[s + 1].index : lines.length;
    const sectionLines = lines.slice(start, end);
    const sectionTitle = sectionBoundaries[s].title;
    const isTeacher = sectionBoundaries[s].isTeacher;

    if (isTeacher) {
      teacherSections.push({
        id: uuidv4(),
        type: "q-teacher-answers",
        title: "ANSWER KEY",
        content: sectionLines.join("\n"),
        teacherOnly: true,
      });
      continue;
    }

    if (/SELF REFLECTION/i.test(sectionTitle)) {
      sections.push({ id: uuidv4(), type: "self-reflection", title: "SELF REFLECTION", content: sectionLines.slice(1).join("\n") });
      continue;
    }

    if (/CHALLENGE/i.test(sectionTitle)) {
      sections.push({ id: uuidv4(), type: "q-free-response", title: "CHALLENGE QUESTION", label: "CHALLENGE", content: sectionLines.slice(1).join("\n").trim(), marks: 8 });
      continue;
    }

    let qNum = 0;
    let i = 1;
    while (i < sectionLines.length) {
      const line = sectionLines[i];
      const qMatch = line.match(/^(\d+)\s+(.+)$/);
      if (qMatch) {
        qNum = parseInt(qMatch[1]);
        const qContent: string[] = [qMatch[2]];
        i++;
        while (i < sectionLines.length && !sectionLines[i].match(/^(\d+)\s+[A-Z]/)) {
          qContent.push(sectionLines[i]);
          i++;
        }
        const fullContent = qContent.join("\n").trim();
        const section = buildQuestionSection(qNum, fullContent, sectionTitle);
        if (section) sections.push(section);
      } else {
        i++;
      }
    }
  }

  if (sections.length === 0) {
    sections.push({ id: uuidv4(), type: "q-free-response", title: `${topic} — ${subject}`, content: text.substring(0, 3000) });
  }

  return { sections, teacherSections, keyVocab, learningObjective };
}

function buildQuestionSection(qNum: number, content: string, sectionLabel: string): any | null {
  const lower = content.toLowerCase();

  if (lower.includes("true") && lower.includes("false") && lower.includes("circle")) {
    return { id: uuidv4(), type: "q-true-false", title: `Question ${qNum}`, label: "TRUE / FALSE", content };
  }
  if (/\bA\b.*\bB\b.*\bC\b.*\bD\b/s.test(content) || /^[ABCD]\s/m.test(content)) {
    return { id: uuidv4(), type: "q-mcq", title: `Question ${qNum}`, label: "MULTIPLE CHOICE", content };
  }
  if (content.includes("WORD BANK") || content.includes("___")) {
    return { id: uuidv4(), type: "q-gap-fill", title: `Question ${qNum}`, label: "GAP FILL", content };
  }
  const marksMatch = content.match(/\[(\d+)\s*marks?\]/i);
  if (marksMatch) {
    return { id: uuidv4(), type: "q-short-answer", title: `Question ${qNum}`, label: "SHORT ANSWER", content, marks: parseInt(marksMatch[1]) };
  }
  return { id: uuidv4(), type: "q-free-response", title: `Question ${qNum}`, label: "ANSWER", content };
}


// ── POST /api/library/resolve — fetch library worksheet and apply overlays ────
// Single entry point for worksheet generator when a library match is found.
// Returns the base worksheet with all requested overlays applied.
// Structure and diagrams of the base worksheet are NEVER modified.
router.post("/resolve", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      subject, topic, yearGroup, tier, retrievalTopic, additionalInstructions,
      sendNeed, readingAge, canonicalTopicKey: requestedTopicKey, sourceLibraryId, featureFlags,
    } = req.body;

    if (!subject || !topic || !yearGroup) {
      return res.status(400).json({ error: "subject, topic, yearGroup are required" });
    }

    const entry = await findLibraryEntry(subject, topic, yearGroup, tier || "mixed", {
      canonicalTopicKey: requestedTopicKey,
      sourceLibraryId,
    });
    if (!entry) return res.json({ found: false });

    const sections: any[] = JSON.parse(entry.sections || "[]");
    const teacherSections: any[] = JSON.parse(entry.teacher_sections || "[]");
    let keyVocab: any[] = JSON.parse(entry.key_vocab || "[]");

    // ── Key vocab fallback: if the key_vocab column is empty, extract from the
    // key-terms section's `terms` array (populated during PDF ingestion).
    if (keyVocab.length === 0) {
      const vocabSection = sections.find((s: any) =>
        s.type === "key-terms" || s.type === "vocabulary" || s.type === "key-vocab" || s.type === "glossary"
      );
      if (vocabSection?.terms && Array.isArray(vocabSection.terms) && vocabSection.terms.length > 0) {
        keyVocab = vocabSection.terms.map((t: any) =>
          typeof t === "string" ? { term: t } : { term: t.term || "", definition: t.definition || "" }
        ).filter((t: any) => t.term);
      } else if (vocabSection?.content && typeof vocabSection.content === "string" && vocabSection.content.trim()) {
        keyVocab = vocabSection.content
          .split(/[\n|]+/)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .map((s: string) => {
            const match = s.match(/^([^:–\-]{2,60})\s*[:–\-]\s*(.+)$/);
            return match ? { term: match[1].trim(), definition: match[2].trim() } : { term: s };
          })
          .filter((t: any) => t.term && t.term.length > 1)
          .slice(0, 12);
      }
    }

    // ── Maths structure enforcement: filter out vocabulary/key-terms sections.
    // Maths worksheets are strictly question-based with no vocabulary section.
    const isMathsEntry = /^maths?$|^mathematics$|^math$/i.test((entry.subject || "").trim());
    const filteredSections = isMathsEntry
      ? sections.filter((s: any) => {
          const t = (s.type || "").toLowerCase();
          // Maths structure: Header, LO, Common Mistakes, Worked Example, Section 1/2/3 Questions, Challenge, Self Reflection, Teacher Key
          // Remove: key vocab, exit tickets, formula references, match columns, gap fills, MCQ, true-false
          return t !== "key-terms" && t !== "vocabulary" && t !== "key-vocab" && t !== "glossary" && t !== "key-vocabulary"
            && t !== "exit-ticket" && t !== "formula-reference" && t !== "q-match" && t !== "q-gap-fill"
            && t !== "q-true-false" && t !== "q-mcq" && t !== "match-column" && t !== "gap-fill" && t !== "true-false";
        })
      : sections;

    const assets = await resolveEntryAssets(entry.id);
    const sectionsWithAssets = injectAssetRefs(filteredSections, assets);
    const availableTiers = await findAvailableTiers(subject, topic, yearGroup, {
      canonicalTopicKey: entry.canonical_topic_key || requestedTopicKey || canonicalTopicKey(topic),
      sourceLibraryId: entry.id,
    });

    const overlayResult = applyOverlays(sectionsWithAssets, {
      retrievalTopic: retrievalTopic || null,
      additionalInstructions: additionalInstructions || null,
      sendNeed: sendNeed || null,
      readingAge: readingAge || null,
      featureFlags: featureFlags || null,
    });

    if (!entry.base_structure_json || entry.base_structure_json === "{}") {
      const baseStructure = extractBaseStructure(filteredSections);
      const diagramSlots = extractDiagramSlots(filteredSections);
      const topicKey = entry.canonical_topic_key || requestedTopicKey || canonicalTopicKey(topic);
      await db.prepare(
        `UPDATE worksheet_library SET base_structure_json = ?, diagram_slots_json = ?, canonical_topic_key = ?, updated_at = NOW() WHERE id = ?`
      ).run(JSON.stringify(baseStructure), JSON.stringify(diagramSlots), topicKey, entry.id);
    }

    res.json({
      found: true,
      entry: {
        id: entry.id,
        title: entry.title,
        subtitle: entry.subtitle,
        subject: entry.subject,
        topic: entry.topic,
        year_group: entry.year_group,
        tier: normalizeTier(entry.tier),
        curated: !!entry.curated,
        canonical_topic_key: entry.canonical_topic_key || requestedTopicKey || canonicalTopicKey(topic),
      },
      libraryId: entry.id,
      tier: normalizeTier(entry.tier),
      availableTiers,
      title: entry.title,
      subtitle: entry.subtitle,
      learningObjective: entry.learning_objective,
      keyVocab,
      sections: overlayResult.sections,
      teacherSections,
      curated: !!entry.curated,
      version: entry.version,
      canonicalTopicKey: entry.canonical_topic_key || requestedTopicKey || canonicalTopicKey(topic),
      appliedOverlays: overlayResult.appliedOverlays,
      structuralHash: overlayResult.baseStructuralHash,
      assets: assets.map(a => ({ id: a.id, sectionKey: a.section_key, publicUrl: a.public_url, assetType: a.asset_type })),
      worksheetManifest: {
        sourceLibraryId: entry.id,
        sourceTopic: entry.topic,
        canonicalTopicKey: entry.canonical_topic_key || requestedTopicKey || canonicalTopicKey(topic),
        tier: normalizeTier(entry.tier),
        yearGroup,
        retrievalTopic: retrievalTopic || null,
        additionalInstructions: additionalInstructions || null,
        sendNeed: sendNeed || null,
        readingAge: readingAge || null,
        featureFlags: featureFlags || null,
      },
    });
  } catch (err: any) {
    console.error("Library resolve error:", err.message);
    res.status(500).json({ error: "Failed to resolve library worksheet" });
  }
});

// ── GET /api/library/assets/:entryId — get all assets for a library entry ────
router.get("/assets/:entryId", requireAuth, async (req: Request, res: Response) => {
  try {
    const assets = await resolveEntryAssets(req.params.entryId);
    res.json({ assets: assets.map(a => ({
      id: a.id,
      sectionKey: a.section_key,
      assetType: a.asset_type,
      publicUrl: a.public_url,
      width: a.width,
      height: a.height,
      altText: a.alt_text,
      topicTags: JSON.parse(a.topic_tags || "[]"),
    })) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get assets" });
  }
});

// ── POST /api/library/assets — register an asset for a library entry ─────────
router.post("/assets", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { libraryEntryId, sectionKey, assetType, publicUrl, width, height, altText, topicTags, contentHash } = req.body;
    if (!libraryEntryId || !sectionKey || !publicUrl) {
      return res.status(400).json({ error: "libraryEntryId, sectionKey and publicUrl are required" });
    }
    const id = uuidv4();
    await db.prepare(
      `INSERT INTO worksheet_library_assets (id, library_entry_id, section_key, asset_type, public_url, width, height, alt_text, topic_tags, content_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, libraryEntryId, sectionKey, assetType || "image_url", publicUrl, width || null, height || null, altText || null, JSON.stringify(topicTags || []), contentHash || null);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to register asset" });
  }
});

// ── POST /api/library/assets/verify — check for broken asset URLs ─────────────
router.post("/assets/verify", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const assets = await db.prepare("SELECT id, public_url FROM worksheet_library_assets").all() as { id: string; public_url: string }[];
    const results: { id: string; url: string; ok: boolean }[] = [];
    for (const asset of assets) {
      try {
        const r = await fetch(asset.public_url, { method: "HEAD" });
        results.push({ id: asset.id, url: asset.public_url, ok: r.ok });
      } catch {
        results.push({ id: asset.id, url: asset.public_url, ok: false });
      }
    }
    const broken = results.filter(r => !r.ok);
    res.json({ total: results.length, broken: broken.length, brokenAssets: broken });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to verify assets" });
  }
});

// ── POST /api/library/switch-tier — switch tier and re-apply all overlays ─────
// Used by the Differentiate button. Loads the target tier from the library and
// re-applies the exact same overlay state that was applied to the current worksheet.
router.post("/switch-tier", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      subject, topic, yearGroup, targetTier, retrievalTopic, additionalInstructions,
      sendNeed, readingAge, canonicalTopicKey: requestedTopicKey, sourceLibraryId, featureFlags,
    } = req.body;

    if (!subject || !topic || !yearGroup || !targetTier) {
      return res.status(400).json({ error: "subject, topic, yearGroup and targetTier are required" });
    }

    const entry = await findLibraryEntry(subject, topic, yearGroup, targetTier, {
      canonicalTopicKey: requestedTopicKey,
      sourceLibraryId,
    });
    if (!entry) {
      return res.json({ found: false, message: `No ${targetTier} tier found for this topic` });
    }

    const sections: any[] = JSON.parse(entry.sections || "[]");
    const teacherSections: any[] = JSON.parse(entry.teacher_sections || "[]");
    const keyVocab: any[] = JSON.parse(entry.key_vocab || "[]");
    const availableTiers = await findAvailableTiers(subject, topic, yearGroup, {
      canonicalTopicKey: entry.canonical_topic_key || requestedTopicKey || canonicalTopicKey(topic),
      sourceLibraryId: sourceLibraryId || entry.id,
    });

    const assets = await resolveEntryAssets(entry.id);
    const sectionsWithAssets = injectAssetRefs(sections, assets);
    const overlayResult = applyOverlays(sectionsWithAssets, {
      retrievalTopic: retrievalTopic || null,
      additionalInstructions: additionalInstructions || null,
      sendNeed: sendNeed || null,
      readingAge: readingAge || null,
      featureFlags: featureFlags || null,
    });

    res.json({
      found: true,
      libraryId: entry.id,
      tier: normalizeTier(entry.tier),
      availableTiers,
      title: entry.title,
      subtitle: entry.subtitle,
      learningObjective: entry.learning_objective,
      keyVocab,
      sections: overlayResult.sections,
      teacherSections,
      curated: !!entry.curated,
      version: entry.version,
      canonicalTopicKey: entry.canonical_topic_key || requestedTopicKey || canonicalTopicKey(topic),
      appliedOverlays: overlayResult.appliedOverlays,
      structuralHash: overlayResult.baseStructuralHash,
      assets: assets.map(a => ({ id: a.id, sectionKey: a.section_key, publicUrl: a.public_url, assetType: a.asset_type })),
      worksheetManifest: {
        sourceLibraryId: entry.id,
        sourceTopic: entry.topic,
        canonicalTopicKey: entry.canonical_topic_key || requestedTopicKey || canonicalTopicKey(topic),
        tier: normalizeTier(entry.tier),
        yearGroup,
        retrievalTopic: retrievalTopic || null,
        additionalInstructions: additionalInstructions || null,
        sendNeed: sendNeed || null,
        readingAge: readingAge || null,
        featureFlags: featureFlags || null,
      },
    });
  } catch (err: any) {
    console.error("Library switch-tier error:", err.message);
    res.status(500).json({ error: "Failed to switch tier" });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// ── Shared helper functions ─────────────────────────────────────────────────────────────────────────────

/**
 * Find a library entry for the given subject/topic/yearGroup/tier.
 * Tries exact match first, then tier aliases, then fuzzy topic matching.
 */
async function findLibraryEntry(
  subject: string,
  topic: string,
  yearGroup: string,
  tier: string,
  opts?: { canonicalTopicKey?: string | null; sourceLibraryId?: string | null }
): Promise<LibraryEntry | undefined> {
  const topicNorm = topic.toLowerCase().trim();
  const subjectsToSearch = expandSubjects(subject);
  const subjectsNorm = subjectsToSearch.map((s: string) => s.toLowerCase());
  const placeholders = subjectsNorm.map(() => "?").join(",");
  const ygNum = yearGroup.replace(/[^0-9]/g, "");
  const topicKey = opts?.canonicalTopicKey || canonicalTopicKey(topic);
  const tiersToTry = tierCandidates(tier);

  if (opts?.sourceLibraryId) {
    const source = await db.prepare("SELECT id, base_entry_id, canonical_topic_key, year_group, topic FROM worksheet_library WHERE id = ? LIMIT 1").get(opts.sourceLibraryId) as any;
    if (source) {
      for (const candidateTier of tiersToTry) {
        const sibling = await db.prepare(
          `SELECT * FROM worksheet_library
           WHERE (id = ? OR base_entry_id = ? OR base_entry_id = ?)
             AND tier = ?
           ORDER BY curated DESC, updated_at DESC
           LIMIT 1`
        ).get(source.id, source.base_entry_id || source.id, source.id, candidateTier) as LibraryEntry | undefined;
        if (sibling) return sibling;
      }
    }
  }

  for (const candidateTier of tiersToTry) {
    const entry = await db.prepare(
      `SELECT * FROM worksheet_library
       WHERE LOWER(subject) IN (${placeholders})
         AND tier = ?
         AND (
           LOWER(topic) = ? OR
           LOWER(topic) ILIKE ? OR
           canonical_topic_key = ?
         )
         AND (year_group = ? OR year_group ILIKE ? OR year_group ILIKE ?)
       ORDER BY curated DESC, updated_at DESC
       LIMIT 1`
    ).get(...subjectsNorm, candidateTier, topicNorm, `%${topicNorm}%`, topicKey, yearGroup, `%${ygNum}%`, `%/${ygNum}%`) as LibraryEntry | undefined;
    if (entry) return entry;
  }

  for (const candidateTier of tiersToTry) {
    const allForTier = await db.prepare(
      `SELECT * FROM worksheet_library WHERE LOWER(subject) IN (${placeholders}) AND tier = ? ORDER BY curated DESC, updated_at DESC`
    ).all(...subjectsNorm, candidateTier) as LibraryEntry[];
    const byCanonical = allForTier.filter(entry => entry.canonical_topic_key && entry.canonical_topic_key === topicKey);
    const canonicalMatch = byCanonical.find(entry => !ygNum || entry.year_group.replace(/[^0-9]/g, "").includes(ygNum));
    if (canonicalMatch) return canonicalMatch;
    const fuzzyYearMatch = allForTier.find(entry => topicKeywordsMatch(topic, entry.topic) && (!ygNum || entry.year_group.replace(/[^0-9]/g, "").includes(ygNum)));
    if (fuzzyYearMatch) return fuzzyYearMatch;
    const fuzzyMatch = allForTier.find(entry => topicKeywordsMatch(topic, entry.topic));
    if (fuzzyMatch) return fuzzyMatch;
  }

  return undefined;
}

async function findAvailableTiers(
  subject: string,
  topic: string,
  yearGroup: string,
  opts?: { canonicalTopicKey?: string | null; sourceLibraryId?: string | null }
): Promise<string[]> {
  const topicNorm = topic.toLowerCase().trim();
  const subjectsToSearch = expandSubjects(subject);
  const subjectsNorm = subjectsToSearch.map((s: string) => s.toLowerCase());
  const placeholders = subjectsNorm.map(() => "?").join(",");
  const topicKey = opts?.canonicalTopicKey || canonicalTopicKey(topic);

  let rows: { tier: string }[] = [];
  if (opts?.sourceLibraryId) {
    rows = await db.prepare(
      `SELECT DISTINCT tier FROM worksheet_library
       WHERE id = ? OR base_entry_id = (SELECT COALESCE(base_entry_id, id) FROM worksheet_library WHERE id = ?) OR base_entry_id = ?
       ORDER BY tier ASC`
    ).all(opts.sourceLibraryId, opts.sourceLibraryId, opts.sourceLibraryId) as { tier: string }[];
  }

  if (rows.length === 0) {
    rows = await db.prepare(
      `SELECT DISTINCT tier FROM worksheet_library
       WHERE LOWER(subject) IN (${placeholders})
         AND ((LOWER(topic) = ? OR LOWER(topic) ILIKE ?) OR canonical_topic_key = ?)
       ORDER BY tier ASC`
    ).all(...subjectsNorm, topicNorm, `%${topicNorm}%`, topicKey) as { tier: string }[];
  }

  return [...new Set(rows.map(row => normalizeTier(row.tier)))];
}

/**
 * Resolve all assets registered for a library entry.
 */
async function resolveEntryAssets(libraryEntryId: string): Promise<LibraryAsset[]> {
  try {
    return await db.prepare(
      `SELECT * FROM worksheet_library_assets WHERE library_entry_id = ? ORDER BY section_key ASC`
    ).all(libraryEntryId) as LibraryAsset[];
  } catch {
    return [];
  }
}

/**
 * Inject assetRef IDs into sections where the imageUrl matches a registered asset.
 * This replaces brittle raw URLs with stable asset references.
 */
function injectAssetRefs(sections: any[], assets: LibraryAsset[]): any[] {
  if (!assets.length) return sections;
  const assetsByUrl = new Map<string, LibraryAsset>();
  const assetsBySectionKey = new Map<string, LibraryAsset>();
  for (const asset of assets) {
    assetsByUrl.set(asset.public_url, asset);
    assetsBySectionKey.set(asset.section_key, asset);
  }
  return sections.map(section => {
    // Match by section ID or imageUrl
    const asset = assetsBySectionKey.get(section.id) || (section.imageUrl ? assetsByUrl.get(section.imageUrl) : undefined);
    if (asset && !section.assetRef) {
      return { ...section, assetRef: asset.id, imageUrl: asset.public_url };
    }
    return section;
  });
}

export default router;
