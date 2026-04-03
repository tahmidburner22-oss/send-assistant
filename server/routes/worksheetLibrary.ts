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
  sections: any[];
  teacherSections: any[];
  keyVocab: Array<{ term: string; definition: string }>;
  learningObjective: string;
}

// ── GET /api/library/entries — list all entries ───────────────────────────────

router.get("/entries", requireAuth, requireSuperAdmin, (req: Request, res: Response) => {
  try {
    const { subject, curated, search } = req.query as Record<string, string>;
    let sql = `SELECT id, subject, topic, year_group, title, source, curated, version, created_at, updated_at
               FROM worksheet_library WHERE 1=1`;
    const params: unknown[] = [];

    if (subject) { sql += " AND subject = ?"; params.push(subject); }
    if (curated !== undefined) { sql += " AND curated = ?"; params.push(curated === "true" ? 1 : 0); }
    if (search) { sql += " AND (topic LIKE ? OR title LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

    sql += " ORDER BY subject ASC, year_group ASC, topic ASC";

    const entries = db.prepare(sql).all(...params);
    res.json({ entries });
  } catch (err: any) {
    console.error("Library list error:", err.message);
    res.status(500).json({ error: "Failed to list library" });
  }
});

// ── GET /api/library/lookup — lookup by subject+topic+yearGroup[+tier] ──────────
// Returns the matching entry. If tier is specified, returns that tier.
// Also returns a `tiers` array listing all available tiers for this topic.

router.get("/lookup", requireAuth, (req: Request, res: Response) => {
  try {
    const { subject, topic, yearGroup, tier } = req.query as Record<string, string>;
    if (!subject || !topic || !yearGroup) {
      return res.status(400).json({ error: "subject, topic and yearGroup are required" });
    }

    // Normalise topic for fuzzy matching
    const topicNorm = topic.toLowerCase().trim();

    // Helper to parse an entry
    const parseEntry = (e: LibraryEntry) => ({
      ...e,
      sections: JSON.parse(e.sections || "[]"),
      teacher_sections: JSON.parse(e.teacher_sections || "[]"),
      key_vocab: JSON.parse(e.key_vocab || "[]"),
      curated: !!e.curated,
    });

    // Find all tiers available for this topic (exact + fuzzy)
    let allTiers = db.prepare(
      `SELECT id, tier, title FROM worksheet_library
       WHERE subject = ? AND (topic = ? OR LOWER(topic) = ?) AND year_group = ?
       ORDER BY tier ASC`
    ).all(subject, topic, topicNorm, yearGroup) as { id: string; tier: string; title: string }[];

    // Fuzzy fallback: any year group
    if (allTiers.length === 0) {
      allTiers = db.prepare(
        `SELECT id, tier, title FROM worksheet_library
         WHERE subject = ? AND (topic = ? OR LOWER(topic) = ?)
         ORDER BY tier ASC`
      ).all(subject, topic, topicNorm) as { id: string; tier: string; title: string }[];
    }

    if (allTiers.length === 0) {
      return res.json({ found: false });
    }

    // Select the requested tier, or fall back to 'standard', then first available
    const wantedTier = tier || "standard";
    const targetTier = allTiers.find(t => t.tier === wantedTier)
      || allTiers.find(t => t.tier === "standard")
      || allTiers[0];

    const entry = db.prepare("SELECT * FROM worksheet_library WHERE id = ?")
      .get(targetTier.id) as LibraryEntry | undefined;

    if (!entry) return res.json({ found: false });

    res.json({
      found: true,
      entry: parseEntry(entry),
      availableTiers: allTiers.map(t => t.tier),
    });
  } catch (err: any) {
    console.error("Library lookup error:", err.message);
    res.status(500).json({ error: "Failed to lookup library" });
  }
});

// ── GET /api/library/lookup-tier — lookup a specific tier for differentiation ──
// Used by the Differentiate button to fetch the correct tier worksheet.

router.get("/lookup-tier", requireAuth, (req: Request, res: Response) => {
  try {
    const { subject, topic, yearGroup, tier } = req.query as Record<string, string>;
    if (!subject || !topic || !yearGroup || !tier) {
      return res.status(400).json({ error: "subject, topic, yearGroup and tier are required" });
    }

    const topicNorm = topic.toLowerCase().trim();

    // Try exact match with requested tier
    let entry = db.prepare(
      `SELECT * FROM worksheet_library
       WHERE subject = ? AND (topic = ? OR LOWER(topic) = ?) AND year_group = ? AND tier = ?`
    ).get(subject, topic, topicNorm, yearGroup, tier) as LibraryEntry | undefined;

    // Fuzzy: any year group with this tier
    if (!entry) {
      entry = db.prepare(
        `SELECT * FROM worksheet_library
         WHERE subject = ? AND (topic = ? OR LOWER(topic) = ?) AND tier = ?
         ORDER BY curated DESC, updated_at DESC LIMIT 1`
      ).get(subject, topic, topicNorm, tier) as LibraryEntry | undefined;
    }

    // Fallback: standard tier for this topic
    if (!entry) {
      entry = db.prepare(
        `SELECT * FROM worksheet_library
         WHERE subject = ? AND (topic = ? OR LOWER(topic) = ?)
         ORDER BY CASE tier WHEN 'standard' THEN 0 ELSE 1 END, curated DESC LIMIT 1`
      ).get(subject, topic, topicNorm) as LibraryEntry | undefined;
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

router.get("/entries/:id", requireAuth, requireSuperAdmin, (req: Request, res: Response) => {
  try {
    const entry = db.prepare("SELECT * FROM worksheet_library WHERE id = ?").get(req.params.id) as LibraryEntry | undefined;
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

// ── POST /api/library/entries — create or upsert a library entry ──────────────

router.post("/entries", requireAuth, (req: Request, res: Response) => {
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
    const existing = db.prepare(
      "SELECT id, version, curated FROM worksheet_library WHERE subject = ? AND topic = ? AND year_group = ? AND tier = ?"
    ).get(subject, topic, year_group, tier) as { id: string; version: number; curated: number } | undefined;

    // Don't overwrite curated entries with non-curated ones
    if (existing?.curated && !curated) {
      return res.json({ success: true, id: existing.id, skipped: true, reason: "curated entry preserved" });
    }

    const id = existing?.id || uuidv4();
    const version = existing ? (existing.version + 1) : 1;

    if (existing) {
      db.prepare(`
        UPDATE worksheet_library SET
          title = ?, subtitle = ?, sections = ?, teacher_sections = ?,
          key_vocab = ?, learning_objective = ?, source = ?, curated = ?,
          tier = ?, version = ?, uploaded_by = ?, updated_at = datetime('now')
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
      db.prepare(`
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

router.post("/auto-save", requireAuth, (req: Request, res: Response) => {
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
    const existing = db.prepare(
      "SELECT id, curated FROM worksheet_library WHERE subject = ? AND topic = ? AND year_group = ?"
    ).get(subject, topic, year_group) as { id: string; curated: number } | undefined;

    if (existing?.curated) {
      return res.json({ success: true, skipped: true, reason: "curated entry preserved" });
    }

    const id = existing?.id || uuidv4();

    if (existing) {
      db.prepare(`
        UPDATE worksheet_library SET
          title = ?, subtitle = ?, sections = ?, teacher_sections = ?,
          key_vocab = ?, learning_objective = ?, source = 'ai',
          updated_at = datetime('now')
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
      db.prepare(`
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
      try {
        const pdfParse = (await import("pdf-parse" as any)).default;
        const result = await pdfParse(req.file.buffer);
        pdfText = result.text || "";
        console.log(`[library/ingest-pdf] Extracted ${pdfText.length} chars from PDF`);
      } catch (e: any) {
        console.warn("[library/ingest-pdf] pdf-parse failed:", e?.message);
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
    const existing = db.prepare(
      "SELECT id, version FROM worksheet_library WHERE subject = ? AND topic = ? AND year_group = ? AND tier = ?"
    ).get(subject, topic, year_group, tier) as { id: string; version: number } | undefined;

    const id = existing?.id || uuidv4();
    const version = existing ? (existing.version + 1) : 1;
    const entryTitle = title || parsed.sections[0]?.title || `${topic} — ${subject} Worksheet`;

    if (existing) {
      db.prepare(`
        UPDATE worksheet_library SET
          title = ?, subtitle = ?, sections = ?, teacher_sections = ?,
          key_vocab = ?, learning_objective = ?, source = 'pdf', curated = 1,
          tier = ?, version = ?, uploaded_by = ?, updated_at = datetime('now')
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
      db.prepare(`
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

router.patch("/entries/:id/curate", requireAuth, requireSuperAdmin, (req: Request, res: Response) => {
  try {
    const { curated } = req.body;
    db.prepare(
      "UPDATE worksheet_library SET curated = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(curated ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update curation status" });
  }
});

// ── DELETE /api/library/entries/:id — delete a library entry ─────────────────

router.delete("/entries/:id", requireAuth, requireSuperAdmin, (req: Request, res: Response) => {
  try {
    db.prepare("DELETE FROM worksheet_library WHERE id = ?").run(req.params.id);
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

  const truncatedText = pdfText.slice(0, 12000);

  const systemPrompt = `You are an expert at parsing educational worksheets into structured JSON.
You will receive raw text extracted from a PDF worksheet and must convert it into a structured JSON object.

Return ONLY valid JSON with this exact structure:
{
  "title": "string — worksheet title",
  "subtitle": "string — subtitle or null",
  "learningObjective": "string — the learning objective or empty string",
  "keyVocab": [{"term": "string", "definition": "string"}],
  "sections": [
    {
      "id": "unique-id-string",
      "type": "one of: q-mcq | q-gap-fill | q-true-false | q-short-answer | q-free-response | q-label-diagram | q-worked-example | self-reflection | key-terms | brain-break | stop-check",
      "title": "string",
      "label": "string — e.g. MULTIPLE CHOICE, GAP FILL, TRUE / FALSE, SHORT ANSWER",
      "content": "string — the full question text",
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
- Each question in the worksheet becomes a separate section object
- Identify question types: MCQ (multiple choice A/B/C/D), gap fill (blanks/word bank), true/false, short answer, free response
- Teacher answer keys go in teacherSections with teacherOnly: true
- Self-reflection tables go in sections with type "self-reflection"
- Brain breaks go with type "brain-break"
- Stop/check prompts go with type "stop-check"
- Key vocabulary goes in the keyVocab array AND as a section with type "key-terms"
- Preserve all question text exactly as written
- Generate unique IDs like "s1", "s2", "s3" etc.
- Do not include markdown, only return the JSON object`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Parse this ${subject} worksheet about "${topic}" into structured JSON:\n\n${truncatedText}` },
    ],
    temperature: 0.1,
    max_tokens: 6000,
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

export default router;
