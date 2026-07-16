#!/usr/bin/env tsx
/**
 * Import converted maths worksheets into the worksheet_library table.
 *
 * Usage:
 *   DATABASE_URL=<url> npx tsx scripts/import-maths-worksheets.ts
 *   # Or with --dry-run to just validate without inserting:
 *   DATABASE_URL=<url> npx tsx scripts/import-maths-worksheets.ts --dry-run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Configuration ───────────────────────────────────────────────────────────

const WORKSHEETS_DIR = path.join(
  __dirname,
  "..",
  "worksheet-library",
  "worksheets",
  "maths"
);

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Canonical topic key (simplified version of server/lib/topicNormalizer.ts) ─

function canonicalTopicKey(topic: string): string {
  const lower = topic.toLowerCase().trim();
  return lower
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface WorksheetFile {
  subject: string;
  topic: string;
  subtopic: string;
  yearGroup: string;
  tier: string;
  title: string;
  subtitle: string;
  learning_objective: string;
  key_vocab: Array<{ term: string; definition: string }>;
  sections: Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    marks?: number;
    [key: string]: unknown;
  }>;
  teacher_sections: Array<{
    id: string;
    title: string;
    type: string;
    teacherOnly: boolean;
    content: string;
    [key: string]: unknown;
  }>;
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL && !DRY_RUN) {
    console.error(
      "ERROR: DATABASE_URL environment variable is required (or use --dry-run)"
    );
    process.exit(1);
  }

  // Read all worksheet files
  const files = fs
    .readdirSync(WORKSHEETS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  console.log(`Found ${files.length} worksheet files to import`);

  if (DRY_RUN) {
    console.log("=== DRY RUN MODE - validating only ===\n");
  }

  let pool: pg.Pool | null = null;
  if (!DRY_RUN) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    const filePath = path.join(WORKSHEETS_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data: WorksheetFile = JSON.parse(raw);

      // Validate required fields
      if (!data.subject || !data.topic || !data.yearGroup) {
        throw new Error("Missing required fields: subject, topic, or yearGroup");
      }
      if (!data.sections || data.sections.length < 5) {
        throw new Error(
          `Insufficient sections: ${data.sections?.length || 0} (need >= 5)`
        );
      }

      // Validate all sections have ids
      for (const section of data.sections) {
        if (!section.id) throw new Error("Section missing id field");
        if (!section.type) throw new Error(`Section ${section.id} missing type`);
      }

      const id = uuidv4();
      const topicKey = canonicalTopicKey(data.topic);

      if (!DRY_RUN && pool) {
        // Upsert: use ON CONFLICT to make idempotent
        await pool.query(
          `INSERT INTO worksheet_library (
            id, subject, topic, year_group, title, subtitle,
            sections, teacher_sections, key_vocab,
            learning_objective, source, curated, version,
            tier, canonical_topic_key,
            base_structure_json, diagram_slots_json, applied_overlays,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15,
            $16, $17, $18,
            NOW(), NOW()
          )
          ON CONFLICT (subject, topic, year_group, tier)
          DO UPDATE SET
            title = EXCLUDED.title,
            subtitle = EXCLUDED.subtitle,
            sections = EXCLUDED.sections,
            teacher_sections = EXCLUDED.teacher_sections,
            key_vocab = EXCLUDED.key_vocab,
            learning_objective = EXCLUDED.learning_objective,
            source = EXCLUDED.source,
            curated = EXCLUDED.curated,
            version = worksheet_library.version + 1,
            canonical_topic_key = EXCLUDED.canonical_topic_key,
            base_structure_json = EXCLUDED.base_structure_json,
            diagram_slots_json = EXCLUDED.diagram_slots_json,
            applied_overlays = EXCLUDED.applied_overlays,
            updated_at = NOW()`,
          [
            id,
            data.subject,
            data.topic,
            data.yearGroup,
            data.title,
            data.subtitle || null,
            JSON.stringify(data.sections),
            JSON.stringify(data.teacher_sections),
            JSON.stringify(data.key_vocab),
            data.learning_objective || null,
            "curated",
            1, // curated = true
            1, // version
            data.tier || "mixed",
            topicKey,
            JSON.stringify({
              sectionIds: data.sections.map((s) => s.id),
              sectionTypes: data.sections.map((s) => s.type),
            }),
            "[]", // diagram_slots_json
            "[]", // applied_overlays
          ]
        );
      }

      successCount++;
      if (DRY_RUN) {
        console.log(
          `  VALID: ${file} -> topic="${data.topic}", subtopic="${data.subtopic}"`
        );
      } else {
        console.log(`  IMPORTED: ${file}`);
      }
    } catch (err: any) {
      errorCount++;
      errors.push({ file, error: err.message });
      console.error(`  ERROR: ${file}: ${err.message}`);
    }
  }

  if (pool) {
    await pool.end();
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `${DRY_RUN ? "Validated" : "Imported"}: ${successCount}/${files.length} files`
  );
  if (errors.length > 0) {
    console.log(`Errors: ${errorCount}`);
    for (const { file, error } of errors) {
      console.log(`  - ${file}: ${error}`);
    }
  }

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
