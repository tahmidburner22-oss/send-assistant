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

// ─── Canonical topic key (import from server normalizer for consistency) ─────
// We re-implement the exact map here to avoid importing the server module
// which may have different module resolution requirements.
const CANONICAL_TOPIC_MAP: Array<[string[], string]> = [
  [["algebra \u2014 simple formulae and sequences", "algebra \u2014 simple formulae and sequences", "algebra simple formulae and sequences", "simple formulae and sequences"], "algebra_simple_formulae_and_sequences"],
  [["algebraic expressions", "expanding brackets", "expanding single brackets", "expanding double brackets", "factorising expressions"], "algebraic_expressions"],
  [["angles", "angles in parallel lines", "angles in polygons", "angles on a straight line"], "angles"],
  [["area and perimeter", "area of rectangles", "circumference of a circle", "area of a circle"], "area_and_perimeter"],
  [["decimals and percentages", "percentages as fractions and decimals", "comparing fractions decimals and percentages"], "decimals_and_percentages"],
  [["decimals \u2014 all operations", "decimals \u2014 all operations", "decimals all operations", "adding and subtracting decimals", "multiplying decimals", "dividing decimals"], "decimals_all_operations"],
  [["four operations and order of operations", "bidmas", "bodmas", "bidmas/bodmas", "order of operations"], "four_operations_order_of_operations"],
  [["fractions \u2014 all operations", "fractions \u2014 all operations", "fractions all operations"], "fractions_all_operations"],
  [["fractions \u2014 secondary", "fractions \u2014 secondary", "fractions secondary", "algebraic fractions", "simplifying algebraic fractions"], "fractions_secondary"],
  [["fractions, decimals and percentages", "converting between fractions decimals and percentages", "recurring decimals", "ordering fdp"], "fractions_decimals_and_percentages"],
  [["fractions", "adding and subtracting fractions", "fractions basics"], "fractions"],
  [["functions and graphs", "function notation", "composite and inverse functions", "transformations of graphs"], "functions_and_graphs"],
  [["indices and standard form", "laws of indices", "negative and fractional indices", "standard form", "calculations in standard form"], "indices_and_standard_form"],
  [["linear inequalities", "solving linear inequalities", "inequalities on a number line", "double inequalities"], "linear_inequalities"],
  [["multiplication and division (2, 5, 10 times tables)", "2 times table", "5 times table", "10 times table"], "times_tables_2_5_10"],
  [["multiplication and division (3, 4, 8 times tables)", "3 times table", "4 times table", "8 times table"], "times_tables_3_4_8"],
  [["multiplication and division (times tables to 12\u00d712)", "multiplication and division (times tables to 12x12)", "times tables to 12x12"], "times_tables_12x12"],
  [["multiplication and division (multi-digit)", "long multiplication", "long division", "multi-digit multiplication"], "multiplication_division_multi_digit"],
  [["percentages of amounts", "finding percentages of amounts", "reverse percentages"], "percentages_of_amounts"],
  [["percentages", "percentage of an amount", "compound interest", "depreciation"], "percentages"],
  [["place value and ordering integers", "reading and writing large integers", "ordering positive and negative integers", "rounding to significant figures"], "place_value_and_ordering_integers"],
  [["probability", "chance", "likelihood", "tree diagram", "conditional probability"], "probability"],
  [["proportion", "direct proportion", "inverse proportion", "proportion graphs"], "proportion"],
  [["pythagoras' theorem", "pythagoras theorem", "pythagoras", "finding the hypotenuse", "finding a shorter side"], "pythagoras_theorem"],
  [["quadratic equations", "quadratics", "solving quadratics", "quadratic formula", "completing the square"], "quadratic_equations"],
  [["ratio and proportion", "writing and simplifying ratios", "dividing quantities in a given ratio", "scale factors"], "ratio_and_proportion"],
  [["ratio", "simplifying ratios", "dividing in a ratio", "ratio problems"], "ratio"],
  [["sequences", "arithmetic sequences", "geometric sequences", "quadratic sequences", "nth term"], "sequences"],
  [["simultaneous equations", "simultaneous", "solving by elimination", "solving by substitution"], "simultaneous_equations"],
  [["solving linear equations", "one-step equations", "two-step equations", "equations with unknowns on both sides"], "solving_linear_equations"],
  [["straight-line graphs", "straight line graphs", "plotting straight-line graphs", "gradient and y-intercept", "y = mx + c"], "straight_line_graphs"],
  [["statistics", "data", "mean median mode", "histograms", "cumulative frequency"], "statistics"],
  [["surds", "simplifying surds", "rationalising the denominator"], "surds"],
  [["transformations", "reflection", "rotation", "translation", "enlargement"], "transformations"],
  [["trigonometry", "sine cosine tangent", "soh cah toa", "sine and cosine rules"], "trigonometry"],
  [["vectors", "vector addition", "magnitude direction", "vector geometry proofs"], "vectors"],
  [["volume and surface area", "volume of prisms", "surface area of prisms"], "volume_and_surface_area"],
];

function canonicalTopicKey(topic: string): string {
  const lower = topic.toLowerCase().trim();
  // Try exact match
  for (const [variants, key] of CANONICAL_TOPIC_MAP) {
    if (variants.some(v => v === lower)) return key;
  }
  // Try substring match
  for (const [variants, key] of CANONICAL_TOPIC_MAP) {
    if (variants.some(v => lower.includes(v) || v.includes(lower))) return key;
  }
  // Fallback: normalise to snake_case
  return lower.replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "_");
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

  // Read all worksheet files (sorted alphabetically so first-per-topic is deterministic)
  const files = fs
    .readdirSync(WORKSHEETS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  console.log(`Found ${files.length} worksheet files in directory`);

  // ─── Deduplication ─────────────────────────────────────────────────────────
  //
  // The worksheet_library table has a UNIQUE constraint on (subject, topic,
  // year_group, tier). Multiple subtopics share the same topic/yearGroup/tier
  // (e.g., 4 "Angles" subtopics all map to Angles/Year 9/mixed).
  //
  // The gold worksheet system (client/src/data/maths-gold/) already handles
  // per-subtopic rendering with PDF-accurate layout + SEND CSS themes for all
  // 128 entries. The library import is a FALLBACK used when:
  //   1. No subtopic is selected (just a topic)
  //   2. Gold entry lookup fails
  //
  // To avoid unique constraint violations, we import only ONE representative
  // worksheet per unique (subject, topic, yearGroup, tier) combination. We
  // pick the first alphabetically from each group. All 128 JSON files are
  // retained in the directory as documentation/reference.
  // ───────────────────────────────────────────────────────────────────────────

  const deduplicatedFiles: string[] = [];
  const seenKeys = new Set<string>();
  const skippedFiles: Array<{ file: string; key: string; reason: string }> = [];

  for (const file of files) {
    const filePath = path.join(WORKSHEETS_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data: WorksheetFile = JSON.parse(raw);
      const key = [
        (data.subject || "").toLowerCase(),
        (data.topic || "").toLowerCase(),
        (data.yearGroup || "").toLowerCase(),
        (data.tier || "mixed").toLowerCase(),
      ].join("|");

      if (seenKeys.has(key)) {
        skippedFiles.push({
          file,
          key,
          reason: `Duplicate key - gold system handles subtopic "${data.subtopic}" directly`,
        });
      } else {
        seenKeys.add(key);
        deduplicatedFiles.push(file);
      }
    } catch (err: any) {
      // Still include files with parse errors so they get reported below
      deduplicatedFiles.push(file);
    }
  }

  console.log(
    `Deduplicated: ${deduplicatedFiles.length} unique (subject, topic, yearGroup, tier) entries`
  );
  console.log(
    `Skipped: ${skippedFiles.length} duplicate subtopics (handled by gold worksheet system)`
  );

  if (DRY_RUN) {
    console.log("\n=== DRY RUN MODE - validating only ===\n");
    if (skippedFiles.length > 0) {
      console.log("Skipped files (duplicate topic keys):");
      for (const { file, reason } of skippedFiles) {
        console.log(`  SKIP: ${file} - ${reason}`);
      }
      console.log("");
    }
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

  for (const file of deduplicatedFiles) {
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
        // Upsert: use ON CONFLICT to make idempotent.
        // Only one representative subtopic per topic is stored here; the gold
        // worksheet system renders the specific subtopic when selected.
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
          `  VALID: ${file} -> topic="${data.topic}", subtopic="${data.subtopic}" [REPRESENTATIVE]`
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
    `${DRY_RUN ? "Validated" : "Imported"}: ${successCount}/${deduplicatedFiles.length} unique entries (from ${files.length} total files)`
  );
  console.log(
    `Skipped duplicates: ${skippedFiles.length} (served by gold worksheet system)`
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
