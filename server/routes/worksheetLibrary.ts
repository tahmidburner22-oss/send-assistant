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
 * GET    /api/library/resolve             — resolve base/variant worksheet with stable assets
 * GET    /api/library/tiers               — list available tiers excluding the active tier
 * POST   /api/library/switch-tier         — switch tier and reapply active transforms
 * POST   /api/library/purge-assets        — remove all library entries/assets/variants (super-admin)
 * POST   /api/library/feedback            — store teacher quality feedback for tuning
 * PATCH  /api/library/entries/:id/curate  — mark as curated (admin)
 * DELETE /api/library/entries/:id         — delete a library entry (admin)
 */

import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import type { NextFunction } from "express";

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

// ── Types ─────────────────────────────────────────────────────────────────────

interface LibraryEntry {
  id: string;
  subject: string;
  topic: string;
  year_group: string;
  title: string;
  subtitle?: string;
  tier: string;              // 'standard' | 'foundation' | 'higher' | 'scaffolded'
  send_need?: string;        // optional SEND need this was built for
  sections: string;          // JSON string
  teacher_sections: string;  // JSON string
  key_vocab: string;         // JSON string
  learning_objective?: string;
  source: string;
  curated: number;
  version: number;
  uploaded_by?: string;
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

interface LibraryAsset {
  id: string;
  library_entry_id: string;
  section_key: string | null;
  asset_type: string;
  content_hash: string | null;
  storage_key: string | null;
  public_url: string | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  inline_svg?: string | null;
}

function buildSendSupportNote(sendNeed: string): string {
  const key = (sendNeed || "").toLowerCase();
  if (key.includes("dyslexia")) return "Use short instructions, larger spacing, and keyword highlighting.";
  if (key.includes("adhd")) return "Chunk tasks into short timed blocks and include explicit check-in prompts.";
  if (key.includes("autism")) return "Use predictable task sequence, explicit transitions, and concrete language.";
  if (key.includes("eal")) return "Pre-teach vocabulary and include simple sentence stems for responses.";
  return "Provide scaffolded prompts, visual supports, and reduced cognitive load instructions.";
}

function adaptSectionsForSend(sections: any[], sendNeed: string): any[] {
  const supportNote = buildSendSupportNote(sendNeed);
  return (sections || []).map((section: any) => {
    const content = typeof section?.content === "string" ? section.content : "";
    return {
      ...section,
      content: `${content}\n\nSEND Support (${sendNeed}): ${supportNote}`.trim(),
      // Preserve asset references if present so diagrams/images remain stable
      assetRefs: Array.isArray(section?.assetRefs) ? section.assetRefs : section?.assetRefs || [],
    };
  });
}

function validateSectionSchema(section: any): string[] {
  const errors: string[] = [];
  if (!section || typeof section !== "object") return ["Section is not an object"];
  if (!section.id || typeof section.id !== "string") errors.push("Missing string id");
  if (!section.type || typeof section.type !== "string") errors.push("Missing string type");
  if (!section.title || typeof section.title !== "string") errors.push("Missing string title");
  if (typeof section.content !== "string") errors.push("Missing string content");
  if (section.assetRefs && !Array.isArray(section.assetRefs)) errors.push("assetRefs must be an array");
  return errors;
}

function qualityScore(sections: any[], teacherSections: any[]): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 100;
  if (!sections?.length) { score -= 60; reasons.push("No student sections"); }
  if (!teacherSections?.length) { score -= 15; reasons.push("No teacher sections"); }
  const withContent = (sections || []).filter((s: any) => typeof s.content === "string" && s.content.trim().length > 20).length;
  const coverage = sections?.length ? withContent / sections.length : 0;
  if (coverage < 0.8) { score -= 20; reasons.push("Low section content coverage"); }
  const withMarks = (sections || []).filter((s: any) => typeof s.marks === "number" && s.marks > 0).length;
  if (withMarks === 0) { score -= 10; reasons.push("No marked questions"); }
  const diagramSections = (sections || []).filter((s: any) => (Array.isArray(s.assetRefs) && s.assetRefs.length > 0) || s.svg).length;
  if (diagramSections === 0) { score -= 8; reasons.push("No diagram/asset sections"); }
  return { score: Math.max(0, Math.min(100, score)), reasons };
}

function applyAssetIntegrity(sections: any[], assets: LibraryAsset[]): { sections: any[]; warnings: string[] } {
  const warnings: string[] = [];
  const assetIds = new Set((assets || []).map(a => a.id));
  const safeSections = (sections || []).map((s: any) => {
    const refs = Array.isArray(s.assetRefs) ? s.assetRefs : [];
    if (refs.length === 0) return s;
    const validRefs = refs.filter((ref: string) => assetIds.has(ref));
    if (validRefs.length !== refs.length) {
      warnings.push(`Section ${s.id || s.title || "unknown"} had orphaned assetRefs`);
    }
    if (validRefs.length === 0 && s.svg) {
      const fallbackId = `inline:${s.id || uuidv4()}`;
      assets.push({
        id: fallbackId,
        library_entry_id: "",
        section_key: s.id || null,
        asset_type: "diagram_svg",
        content_hash: null,
        storage_key: null,
        public_url: null,
        width: null,
        height: null,
        alt_text: "Inline diagram fallback",
        inline_svg: s.svg,
      });
      return { ...s, assetRefs: [fallbackId] };
    }
    return { ...s, assetRefs: validRefs };
  });
  return { sections: safeSections, warnings };
}

function applyReadingAgeTransform(sections: any[], readingAge?: number): any[] {
  if (!readingAge || readingAge <= 0) return sections;
  return (sections || []).map((s: any) => {
    const content = typeof s?.content === "string" ? s.content : "";
    // Text-only simplifier (keeps structure and assets intact)
    const simplified = content
      .replace(/\btherefore\b/gi, "so")
      .replace(/\bconsequently\b/gi, "so")
      .replace(/\bapproximately\b/gi, "about");
    return { ...s, content: simplified };
  });
}

function insertRetrievalAfterLO(sections: any[], retrievalTopic?: string): any[] {
  if (!retrievalTopic || !retrievalTopic.trim()) return sections;
  const retrievalSection = {
    id: "retrieval_dynamic",
    type: "retrieval",
    title: "Retrieval Practice",
    content: `Recall and answer quick questions on: ${retrievalTopic.trim()}\n1) Define one key term.\n2) Give one example.\n3) Explain one common misconception.`,
    marks: 3,
    assetRefs: [],
  };
  const idx = (sections || []).findIndex((s: any) =>
    ["learning-objective", "objectives", "lo", "objective"].includes((s?.type || "").toLowerCase())
  );
  if (idx >= 0) return [...sections.slice(0, idx + 1), retrievalSection, ...sections.slice(idx + 1)];
  return [retrievalSection, ...(sections || [])];
}

function applyFeatureTransforms(sections: any[], keyVocab: any[], features?: any): { sections: any[]; keyVocab: any[] } {
  if (!features?.bilingualKeywords?.enabled) return { sections, keyVocab };
  const lang = (features.bilingualKeywords.lang || "ro").toLowerCase();
  if (lang !== "ro") return { sections, keyVocab };
  const vocab = (keyVocab || []).map((v: any) => {
    const term = v.term || "";
    const definition = v.definition || v.definition_en || "";
    return {
      ...v,
      definition_en: definition,
      definition_ro: v.definition_ro || `RO: ${definition}`,
      term_ro: v.term_ro || `RO: ${term}`,
    };
  });
  return { sections, keyVocab: vocab };
}

// ── GET /api/library/entries — list all entries ───────────────────────────────

router.get("/entries", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { subject, curated, search } = req.query as Record<string, string>;
    let sql = `SELECT id, subject, topic, year_group, title, source, curated, version, created_at, updated_at
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
  [["atomic structure", "atomic", "atom"], ["atomic", "atom", "nuclear", "alpha"]],
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
  [["algebra", "equation"], ["algebra", "equation", "linear", "quadratic"]],
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
  const ui = uiTopic.toLowerCase();
  const lib = libraryTopic.toLowerCase();
  // Direct substring match
  if (lib.includes(ui) || ui.includes(lib)) return true;
  // Keyword group match
  for (const [uiKeys, libKeys] of TOPIC_KEYWORD_MAP) {
    const uiMatch = uiKeys.some(k => ui.includes(k));
    const libMatch = libKeys.some(k => lib.includes(k));
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
// Returns the matching entry. If tier is specified, returns that tier.
// Also returns a `tiers` array listing all available tiers for this topic.
router.get("/lookup", requireAuth, async (req: Request, res: Response) => {
  try {
    const { subject, topic, yearGroup, tier } = req.query as Record<string, string>;
    if (!subject || !topic || !yearGroup) {
      return res.status(400).json({ error: "subject, topic and yearGroup are required" });
    }
    // Normalise topic for fuzzy matching
    const topicNorm = topic.toLowerCase().trim();
    // Expand subject to handle broad subjects like "Science"
    const subjectsToSearch = expandSubjects(subject);
    // Helper to parse an entry
    const parseEntry = (e: LibraryEntry) => ({
      ...e,
      sections: JSON.parse(e.sections || "[]"),
      teacher_sections: JSON.parse(e.teacher_sections || "[]"),
      key_vocab: JSON.parse(e.key_vocab || "[]"),
      curated: !!e.curated,
    });
    // Helper: find all tiers for a given subject list + topic (async)
    // Normalise subjects to lowercase for case-insensitive matching
    const subjectsLower = subjectsToSearch.map(s => s.toLowerCase());
    const findTiersForSubjects = async (subjects: string[], topicStr: string, yg?: string): Promise<{ id: string; tier: string; title: string }[]> => {
      const subjectsNorm = subjects.map(s => s.toLowerCase());
      const placeholders = subjectsNorm.map(() => "?").join(",");
      if (yg) {
        // Match year group: exact, ILIKE, or range match (e.g. 'Year 10/11' matches 'Year 11')
        const ygNum = yg.replace(/[^0-9]/g, "");
        return await db.prepare(
          `SELECT id, tier, title FROM worksheet_library
           WHERE LOWER(subject) IN (${placeholders})
             AND (LOWER(topic) = ? OR LOWER(topic) LIKE ?)
             AND (year_group = ? OR LOWER(year_group) LIKE ? OR (? != '' AND year_group LIKE ?))
           ORDER BY curated DESC, tier ASC`
        ).all(...subjectsNorm, topicStr.toLowerCase(), `%${topicStr.toLowerCase()}%`, yg, `%${ygNum}%`, ygNum, `%${ygNum}%`) as { id: string; tier: string; title: string }[];
      }
      return await db.prepare(
        `SELECT id, tier, title FROM worksheet_library
         WHERE LOWER(subject) IN (${placeholders}) AND (LOWER(topic) = ? OR LOWER(topic) LIKE ?)
         ORDER BY curated DESC, tier ASC`
      ).all(...subjectsNorm, topicStr.toLowerCase(), `%${topicStr.toLowerCase()}%`) as { id: string; tier: string; title: string }[];
    };
    // 1. Exact topic match with year group
    let allTiers = await findTiersForSubjects(subjectsToSearch, topic, yearGroup);
    // 2. Exact topic match, any year group
    if (allTiers.length === 0) {
      allTiers = await findTiersForSubjects(subjectsToSearch, topic);
    }
    // 3. Safe fuzzy topic match.
    // Prefer entries in the requested year group, and only accept topic matches with
    // meaningful token overlap so broad keywords like "equation" do not pull in the
    // wrong worksheet from the library.
    if (allTiers.length === 0) {
      const subjectsNormFuzzy = subjectsToSearch.map(s => s.toLowerCase());
      const placeholdersFuzzy = subjectsNormFuzzy.map(() => "?").join(",");
      const ygNum = yearGroup.replace(/[^0-9]/g, "");
      const allEntries = await db.prepare(
        `SELECT id, tier, title, topic, year_group FROM worksheet_library
         WHERE LOWER(subject) IN (${placeholdersFuzzy})
         ORDER BY curated DESC, updated_at DESC`
      ).all(...subjectsNormFuzzy) as { id: string; tier: string; title: string; topic: string; year_group: string }[];

      const sameYearMatches = allEntries.filter((entry) => {
        const entryYgNum = entry.year_group.replace(/[^0-9]/g, "");
        const matchesYearGroup = entry.year_group === yearGroup
          || entry.year_group.toLowerCase().includes(ygNum)
          || entryYgNum.includes(ygNum)
          || ygNum.includes(entryYgNum);
        return matchesYearGroup && isSafeTierTopicMatch(topic, entry.topic);
      });

      const safeMatches = sameYearMatches.length > 0
        ? sameYearMatches
        : allEntries.filter((entry) => isSafeTierTopicMatch(topic, entry.topic));

      allTiers = safeMatches.map(({ id, tier, title }) => ({ id, tier, title }));
    }
    if (allTiers.length === 0) {
      return res.json({ found: false });
    }

    // Select the requested tier, or fall back to 'base'/'standard', then first available
    // Handle both old naming (standard/scaffolded) and new naming (base/send)
    const wantedTier = tier || "base";
    const tierAliasMap: Record<string, string[]> = {
      base:       ["base", "standard"],
      standard:   ["standard", "base"],
      send:       ["send", "scaffolded"],
      scaffolded: ["scaffolded", "send"],
      foundation: ["foundation"],
      higher:     ["higher"],
    };
    const wantedAliases = tierAliasMap[wantedTier] || [wantedTier];
    const targetTier = wantedAliases.reduce((found: any, alias: string) => found || allTiers.find((t: any) => t.tier === alias), null)
      || allTiers.find((t: any) => t.tier === "base")
      || allTiers.find((t: any) => t.tier === "standard")
      || allTiers[0];

    const entry = await db.prepare("SELECT * FROM worksheet_library WHERE id = ?")
      .get(targetTier.id) as LibraryEntry | undefined;

    if (!entry) return res.json({ found: false });

    res.json({
      found: true,
      entry: parseEntry(entry),
      // Deduplicate tiers — each tier should appear only once
      availableTiers: [...new Set(allTiers.map(t => t.tier))],
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
    const tierAliases: Record<string, string[]> = {
      base:       ["base", "standard"],
      standard:   ["standard", "base"],
      send:       ["send", "scaffolded"],
      scaffolded: ["scaffolded", "send"],
      foundation: ["foundation"],
      higher:     ["higher"],
    };
    const tiersToTry = tierAliases[tier] || [tier];

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

// ── DELETE /api/library/entries/:id — delete a library entry ─────────────────

router.delete("/entries/:id", requireAuth, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    await db.prepare("DELETE FROM worksheet_library WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete entry" });
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

// ── GET /api/library/resolve — base-or-variant retrieval with assets ─────────
router.get("/resolve", requireAuth, async (req: Request, res: Response) => {
  try {
    const { subject, topic, yearGroup, tier = "standard", sendNeed } = req.query as Record<string, string>;
    if (!subject || !topic || !yearGroup) {
      return res.status(400).json({ error: "subject, topic and yearGroup are required" });
    }

    const base = await db.prepare(
      `SELECT * FROM worksheet_library
       WHERE LOWER(subject)=LOWER(?) AND LOWER(topic)=LOWER(?) AND year_group=? AND tier=?
       ORDER BY curated DESC, updated_at DESC
       LIMIT 1`
    ).get(subject, topic, yearGroup, tier) as LibraryEntry | undefined;

    if (!base) {
      return res.status(404).json({ error: "No base worksheet found in library" });
    }

    const assets = await db.prepare(
      `SELECT * FROM worksheet_library_assets WHERE library_entry_id = ? ORDER BY created_at ASC`
    ).all(base.id) as LibraryAsset[];

    const parsedBase = {
      ...base,
      sections: JSON.parse(base.sections || "[]"),
      teacher_sections: JSON.parse(base.teacher_sections || "[]"),
      key_vocab: JSON.parse(base.key_vocab || "[]"),
      assets,
    };

    const baseSectionErrors = parsedBase.sections.flatMap((s: any, idx: number) =>
      validateSectionSchema(s).map((e) => `Section ${idx + 1}: ${e}`)
    );
    if (baseSectionErrors.length > 0) {
      return res.status(422).json({ error: "Library entry failed schema validation", details: baseSectionErrors.slice(0, 12) });
    }
    const baseAssetIntegrity = applyAssetIntegrity(parsedBase.sections, parsedBase.assets as LibraryAsset[]);
    parsedBase.sections = baseAssetIntegrity.sections;

    if (!sendNeed) {
      const baseQuality = qualityScore(parsedBase.sections, parsedBase.teacher_sections);
      if (baseQuality.score < 55) {
        return res.status(422).json({
          error: "Library worksheet quality gate failed",
          qualityScore: baseQuality.score,
          reasons: baseQuality.reasons,
          warnings: baseAssetIntegrity.warnings,
        });
      }
      return res.json({ source: "base", entry: parsedBase, quality: baseQuality, assetWarnings: baseAssetIntegrity.warnings });
    }

    const variant = await db.prepare(
      `SELECT * FROM worksheet_library_variants
       WHERE base_entry_id = ? AND LOWER(send_need)=LOWER(?)
       ORDER BY version DESC, updated_at DESC
       LIMIT 1`
    ).get(base.id, sendNeed) as any;

    if (variant) {
      const variantSections = JSON.parse(variant.adapted_sections || "[]");
      const variantTeacher = JSON.parse(variant.adapted_teacher_sections || "[]");
      const variantErrors = variantSections.flatMap((s: any, idx: number) =>
        validateSectionSchema(s).map((e) => `Variant section ${idx + 1}: ${e}`)
      );
      if (variantErrors.length > 0) {
        return res.status(422).json({ error: "Variant failed schema validation", details: variantErrors.slice(0, 12) });
      }
      const variantAssetIntegrity = applyAssetIntegrity(variantSections, parsedBase.assets as LibraryAsset[]);
      const variantQuality = qualityScore(variantAssetIntegrity.sections, variantTeacher);
      if (variantQuality.score < 55) {
        return res.status(422).json({
          error: "Variant quality gate failed",
          qualityScore: variantQuality.score,
          reasons: variantQuality.reasons,
          warnings: variantAssetIntegrity.warnings,
        });
      }
      return res.json({
        source: "variant-cache",
        entry: {
          ...parsedBase,
          send_need: sendNeed,
          sections: variantAssetIntegrity.sections,
          teacher_sections: variantTeacher,
          adaptation_meta: JSON.parse(variant.adaptation_meta || "{}"),
          base_entry_id: base.id,
        },
        quality: variantQuality,
        assetWarnings: variantAssetIntegrity.warnings,
      });
    }

    // Create deterministic text-only variant from base while preserving assets
    const adaptedSections = adaptSectionsForSend(parsedBase.sections, sendNeed);
    const adaptedTeacherSections = adaptSectionsForSend(parsedBase.teacher_sections, sendNeed);
    const variantId = uuidv4();
    const adaptationMeta = {
      mode: "text-only",
      sendNeed,
      generatedAt: new Date().toISOString(),
      preservedAssets: assets.length,
    };

    await db.prepare(
      `INSERT INTO worksheet_library_variants
       (id, base_entry_id, send_need, version, adapted_sections, adapted_teacher_sections, adaptation_meta, created_by)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?)`
    ).run(
      variantId,
      base.id,
      sendNeed,
      JSON.stringify(adaptedSections),
      JSON.stringify(adaptedTeacherSections),
      JSON.stringify(adaptationMeta),
      req.user!.id
    );

    const generatedErrors = adaptedSections.flatMap((s: any, idx: number) =>
      validateSectionSchema(s).map((e) => `Generated variant section ${idx + 1}: ${e}`)
    );
    if (generatedErrors.length > 0) {
      return res.status(422).json({ error: "Generated variant failed schema validation", details: generatedErrors.slice(0, 12) });
    }
    const generatedIntegrity = applyAssetIntegrity(adaptedSections, parsedBase.assets as LibraryAsset[]);
    const generatedQuality = qualityScore(generatedIntegrity.sections, adaptedTeacherSections);
    if (generatedQuality.score < 55) {
      return res.status(422).json({
        error: "Generated variant quality gate failed",
        qualityScore: generatedQuality.score,
        reasons: generatedQuality.reasons,
        warnings: generatedIntegrity.warnings,
      });
    }

    res.json({
      source: "variant-generated",
      entry: {
        ...parsedBase,
        send_need: sendNeed,
        sections: generatedIntegrity.sections,
        teacher_sections: adaptedTeacherSections,
        adaptation_meta: adaptationMeta,
        base_entry_id: base.id,
      },
      quality: generatedQuality,
      assetWarnings: generatedIntegrity.warnings,
    });
  } catch (err: any) {
    console.error("Library resolve error:", err.message);
    res.status(500).json({ error: "Failed to resolve library worksheet" });
  }
});

// ── GET /api/library/tiers — return available tiers excluding current ─────────
router.get("/tiers", requireAuth, async (req: Request, res: Response) => {
  try {
    const { subject, topic, yearGroup, currentTier } = req.query as Record<string, string>;
    if (!subject || !topic || !yearGroup) {
      return res.status(400).json({ error: "subject, topic and yearGroup are required" });
    }
    const rows = await db.prepare(
      `SELECT DISTINCT tier FROM worksheet_library
       WHERE LOWER(subject)=LOWER(?) AND LOWER(topic)=LOWER(?) AND year_group=?
       ORDER BY tier ASC`
    ).all(subject, topic, yearGroup) as Array<{ tier: string }>;
    const tiers = rows.map(r => r.tier).filter(t => t !== currentTier);
    return res.json({ tiers });
  } catch (err: any) {
    console.error("Library tiers error:", err.message);
    return res.status(500).json({ error: "Failed to fetch tiers" });
  }
});

// ── POST /api/library/switch-tier — switch tier and reapply transforms ────────
router.post("/switch-tier", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      subject, topic, yearGroup, targetTier,
      transforms = {},
    } = req.body as any;
    if (!subject || !topic || !yearGroup || !targetTier) {
      return res.status(400).json({ error: "subject, topic, yearGroup and targetTier are required" });
    }

    const base = await db.prepare(
      `SELECT * FROM worksheet_library
       WHERE LOWER(subject)=LOWER(?) AND LOWER(topic)=LOWER(?) AND year_group=? AND tier=?
       ORDER BY curated DESC, updated_at DESC LIMIT 1`
    ).get(subject, topic, yearGroup, targetTier) as LibraryEntry | undefined;
    if (!base) {
      return res.status(404).json({ error: "Requested tier not found in library" });
    }

    const assets = await db.prepare(`SELECT * FROM worksheet_library_assets WHERE library_entry_id=?`).all(base.id) as LibraryAsset[];
    let sections = JSON.parse(base.sections || "[]");
    const teacherSections = JSON.parse(base.teacher_sections || "[]");
    let keyVocab = JSON.parse(base.key_vocab || "[]");

    sections = applyReadingAgeTransform(sections, Number(transforms.readingAge || 0));
    if (transforms.sendNeed) sections = adaptSectionsForSend(sections, transforms.sendNeed);
    sections = insertRetrievalAfterLO(sections, transforms.retrievalTopic);
    ({ sections, keyVocab } = applyFeatureTransforms(sections, keyVocab, transforms.features || {}));

    const schemaErrors = sections.flatMap((s: any, idx: number) =>
      validateSectionSchema(s).map((e) => `Section ${idx + 1}: ${e}`)
    );
    if (schemaErrors.length > 0) {
      return res.status(422).json({ error: "Tier switch failed schema validation", details: schemaErrors.slice(0, 12) });
    }
    const integrity = applyAssetIntegrity(sections, assets);
    const quality = qualityScore(integrity.sections, teacherSections);
    if (quality.score < 55) {
      return res.status(422).json({ error: "Tier switch failed quality gate", qualityScore: quality.score, reasons: quality.reasons });
    }

    return res.json({
      entry: {
        ...base,
        sections: integrity.sections,
        teacher_sections: teacherSections,
        key_vocab: keyVocab,
        assets,
      },
      quality,
      assetWarnings: integrity.warnings,
      appliedTransforms: transforms,
    });
  } catch (err: any) {
    console.error("Library switch-tier error:", err.message);
    return res.status(500).json({ error: "Failed to switch tier" });
  }
});

// ── POST /api/library/purge-assets — remove current library assets/entries ───
router.post("/purge-assets", requireAuth, requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const deletedVariants = await db.prepare("DELETE FROM worksheet_library_variants").run();
    const deletedAssets = await db.prepare("DELETE FROM worksheet_library_assets").run();
    const deletedEntries = await db.prepare("DELETE FROM worksheet_library").run();
    res.json({
      ok: true,
      deleted: {
        variants: deletedVariants.changes || 0,
        assets: deletedAssets.changes || 0,
        entries: deletedEntries.changes || 0,
      },
    });
  } catch (err: any) {
    console.error("Library purge error:", err.message);
    res.status(500).json({ error: "Failed to purge library assets" });
  }
});

// ── POST /api/library/feedback — teacher quality loop for base/variants ──────
router.post("/feedback", requireAuth, async (req: Request, res: Response) => {
  try {
    const { baseEntryId, variantId, sendNeed, rating, easeLevel, issues, comments } = req.body as any;
    if (!baseEntryId || typeof baseEntryId !== "string") {
      return res.status(400).json({ error: "baseEntryId is required" });
    }
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }
    const issueList = Array.isArray(issues) ? issues.slice(0, 20) : [];
    const feedbackId = uuidv4();
    await db.prepare(
      `INSERT INTO worksheet_library_feedback
       (id, base_entry_id, variant_id, send_need, rating, ease_level, issues, comments, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      feedbackId,
      baseEntryId,
      variantId || null,
      sendNeed || null,
      numericRating,
      easeLevel || null,
      JSON.stringify(issueList),
      comments || null,
      req.user!.id
    );
    return res.status(201).json({ ok: true, feedbackId });
  } catch (err: any) {
    console.error("Library feedback error:", err.message);
    return res.status(500).json({ error: "Failed to save worksheet feedback" });
  }
});

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

export default router;
