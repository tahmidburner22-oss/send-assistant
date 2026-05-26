#!/usr/bin/env node
/**
 * Diagram catalogue generator (Reception → A-Level).
 *
 * Composes per-subject modules (primary at root, secondary under
 * `secondary/{ks3,gcse,alevel}/`) into a single CSV at
 *   docs/diagram-library-catalogue.csv
 *
 * The CSV columns map 1:1 to the diagram_library DB schema (see
 * server/db/index.ts) plus two editorial extras:
 *   - year_band   — KS1 / LKS2 / UKS2 / KS3 / GCSE / A-Level
 *   - style_notes — guidance for the artist / image-gen step
 *
 * Run from repo root:
 *   node tools/diagram-catalogue/generate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeContext, rowsToCsv } from "./_helpers.mjs";

// ── Primary builders (Y1–Y6) ─────────────────────────────────────────────────
import { build as buildMaths } from "./maths.mjs";
import { build as buildEnglish } from "./english.mjs";
import { build as buildScience } from "./science.mjs";
import { build as buildGeography } from "./geography.mjs";
import { build as buildHistory } from "./history.mjs";
import { build as buildComputing } from "./computing.mjs";
import { build as buildArtDt } from "./art-dt.mjs";
import { build as buildMusic } from "./music.mjs";
import { build as buildPe } from "./pe.mjs";
import { build as buildRe } from "./re.mjs";
import { build as buildMfl } from "./mfl.mjs";
import { build as buildPshe } from "./pshe.mjs";
import { build as buildCross } from "./cross-curricular.mjs";

// ── KS3 builders (Y7–Y9) ─────────────────────────────────────────────────────
import { build as buildKs3Maths } from "./secondary/ks3/maths.mjs";
import { build as buildKs3English } from "./secondary/ks3/english.mjs";
import { build as buildKs3Biology } from "./secondary/ks3/biology.mjs";
import { build as buildKs3Chemistry } from "./secondary/ks3/chemistry.mjs";
import { build as buildKs3Physics } from "./secondary/ks3/physics.mjs";
import { build as buildKs3Geography } from "./secondary/ks3/geography.mjs";
import { build as buildKs3History } from "./secondary/ks3/history.mjs";
import { build as buildKs3Computing } from "./secondary/ks3/computing.mjs";
import { build as buildKs3Mfl } from "./secondary/ks3/mfl.mjs";
import { build as buildKs3CreativePeReDrama } from "./secondary/ks3/creative-pe-re-drama.mjs";

// ── GCSE builders (Y10–Y11) ──────────────────────────────────────────────────
import { build as buildGcseMaths } from "./secondary/gcse/maths.mjs";
import { build as buildGcseBiology } from "./secondary/gcse/biology.mjs";
import { build as buildGcseChemistry } from "./secondary/gcse/chemistry.mjs";
import { build as buildGcsePhysics } from "./secondary/gcse/physics.mjs";
import { build as buildGcseCombined } from "./secondary/gcse/combined-science.mjs";
import { build as buildGcseEnglishLit } from "./secondary/gcse/english-lit.mjs";
import { build as buildGcseEnglishLang } from "./secondary/gcse/english-lang.mjs";
import { build as buildGcseComputing } from "./secondary/gcse/computing.mjs";
import { build as buildGcseHistory } from "./secondary/gcse/history.mjs";
import { build as buildGcseGeography } from "./secondary/gcse/geography.mjs";
import { build as buildGcseSocial } from "./secondary/gcse/social-sciences.mjs";
import { build as buildGcseCreative } from "./secondary/gcse/creative.mjs";
import { build as buildGcseMflPeRe } from "./secondary/gcse/mfl-pe-re-statistics.mjs";
import { build as buildGcseBusinessEcon } from "./secondary/gcse/business-economics.mjs";

// ── A-Level builders (Y12–Y13) ───────────────────────────────────────────────
import { build as buildALevelMaths } from "./secondary/alevel/maths.mjs";
import { build as buildALevelSciences } from "./secondary/alevel/sciences.mjs";
import { build as buildALevelApplied } from "./secondary/alevel/applied-and-creative.mjs";
import { build as buildALevelHumanities } from "./secondary/alevel/humanities.mjs";

// ── Builder list grouped by phase for the summary ────────────────────────────
const PRIMARY_BUILDERS = [
  ["Mathematics", buildMaths],
  ["English", buildEnglish],
  ["Science", buildScience],
  ["Geography", buildGeography],
  ["History", buildHistory],
  ["Computing", buildComputing],
  ["Art & DT", buildArtDt],
  ["Music", buildMusic],
  ["PE", buildPe],
  ["RE", buildRe],
  ["MFL", buildMfl],
  ["PSHE/RSE", buildPshe],
  ["Cross-curricular", buildCross],
];

const KS3_BUILDERS = [
  ["KS3 Mathematics", buildKs3Maths],
  ["KS3 English", buildKs3English],
  ["KS3 Biology", buildKs3Biology],
  ["KS3 Chemistry", buildKs3Chemistry],
  ["KS3 Physics", buildKs3Physics],
  ["KS3 Geography", buildKs3Geography],
  ["KS3 History", buildKs3History],
  ["KS3 Computing", buildKs3Computing],
  ["KS3 MFL", buildKs3Mfl],
  ["KS3 Creative/PE/RE/Drama", buildKs3CreativePeReDrama],
];

const GCSE_BUILDERS = [
  ["GCSE Mathematics", buildGcseMaths],
  ["GCSE Biology", buildGcseBiology],
  ["GCSE Chemistry", buildGcseChemistry],
  ["GCSE Physics", buildGcsePhysics],
  ["GCSE Combined Science", buildGcseCombined],
  ["GCSE English Literature", buildGcseEnglishLit],
  ["GCSE English Language", buildGcseEnglishLang],
  ["GCSE Computing", buildGcseComputing],
  ["GCSE History", buildGcseHistory],
  ["GCSE Geography", buildGcseGeography],
  ["GCSE Social Sciences", buildGcseSocial],
  ["GCSE Creative", buildGcseCreative],
  ["GCSE MFL/PE/RE/Stats", buildGcseMflPeRe],
  ["GCSE Business/Economics", buildGcseBusinessEcon],
];

const ALEVEL_BUILDERS = [
  ["A-Level Mathematics", buildALevelMaths],
  ["A-Level Sciences", buildALevelSciences],
  ["A-Level Applied/Creative", buildALevelApplied],
  ["A-Level Humanities", buildALevelHumanities],
];

const PHASES = [
  ["Primary (Y1–Y6)", PRIMARY_BUILDERS],
  ["KS3 (Y7–Y9)", KS3_BUILDERS],
  ["GCSE (Y10–Y11)", GCSE_BUILDERS],
  ["A-Level (Y12–Y13)", ALEVEL_BUILDERS],
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const ctx = makeContext();
const phaseSummary = [];
const subjectSummary = [];

for (const [phaseName, builders] of PHASES) {
  let phaseTotal = 0;
  for (const [subjectName, build] of builders) {
    const before = ctx.count;
    build(ctx);
    const added = ctx.count - before;
    phaseTotal += added;
    subjectSummary.push({ phase: phaseName, subject: subjectName, count: added });
  }
  phaseSummary.push({ phase: phaseName, count: phaseTotal });
}

// ── Validate: no duplicate titles across the whole catalogue ────────────────
const titleCounts = new Map();
for (const r of ctx.rows) {
  const key = r.title;
  titleCounts.set(key, (titleCounts.get(key) || 0) + 1);
}
const duplicates = [...titleCounts.entries()].filter(([, n]) => n > 1);
if (duplicates.length > 0) {
  console.error("\n❌ Duplicate titles detected (each must be unique):");
  for (const [title, count] of duplicates) {
    console.error(`  ${count}× "${title}"`);
  }
  process.exit(1);
}

// ── Write CSV ────────────────────────────────────────────────────────────────
const csvPath = path.join(repoRoot, "docs", "diagram-library-catalogue.csv");
fs.mkdirSync(path.dirname(csvPath), { recursive: true });
fs.writeFileSync(csvPath, rowsToCsv(ctx.rows), "utf8");

// ── Build summary markdown ───────────────────────────────────────────────────
const total = ctx.count;

const bandCounts = new Map();
for (const r of ctx.rows) {
  bandCounts.set(r.year_band, (bandCounts.get(r.year_band) || 0) + 1);
}
const bandOrder = [
  "KS1",
  "LKS2",
  "UKS2",
  "KS1+KS2",
  "KS2",
  "Year 1-6",
  "KS3",
  "GCSE",
  "A-Level",
];
const seenBands = [...bandCounts.keys()];
const sortedBands = [
  ...bandOrder.filter((b) => seenBands.includes(b)),
  ...seenBands.filter((b) => !bandOrder.includes(b)).sort(),
];

const summaryLines = [
  "# Diagram Library — Catalogue Summary",
  "",
  `Generated: **${total}** unique diagram briefs across ${subjectSummary.length} subject modules,`,
  `spanning Reception through A-Level.`,
  "",
  "## Phase totals",
  "",
  "| Phase | Count |",
  "| --- | ---: |",
  ...phaseSummary.map((s) => `| ${s.phase} | ${s.count} |`),
  `| **Total** | **${total}** |`,
  "",
  "## Subject totals",
  "",
  "| Phase | Subject module | Count |",
  "| --- | --- | ---: |",
  ...subjectSummary.map((s) => `| ${s.phase} | ${s.subject} | ${s.count} |`),
  "",
  "## Year-band coverage",
  "",
  "| Band | Count |",
  "| --- | ---: |",
  ...sortedBands.map((b) => `| ${b} | ${bandCounts.get(b)} |`),
  "",
  "Each row in `docs/diagram-library-catalogue.csv` is a *brief*: a unique title,",
  "topic and description that an artist or image-gen step can produce. Once an",
  "image is uploaded via Admin Panel → Diagram Library, the row's `image_url`",
  "and `asset_ref` are filled in and `curated` flips to 1.",
  "",
  "Re-run with:",
  "",
  "```bash",
  "node tools/diagram-catalogue/generate.mjs",
  "```",
  "",
  "## Sample rows (first 30)",
  "",
  "| ID | Subject | Year | Topic | Title |",
  "| --- | --- | --- | --- | --- |",
  ...ctx.rows
    .slice(0, 30)
    .map((r) => `| ${r.id} | ${r.subject} | ${r.year_group} | ${r.topic} | ${r.title} |`),
  "",
  "## Sample secondary rows (first 30 KS3+ rows)",
  "",
  "| ID | Subject | Year | Topic | Title |",
  "| --- | --- | --- | --- | --- |",
  ...ctx.rows
    .filter((r) => ["KS3", "GCSE", "A-Level"].includes(r.year_band))
    .slice(0, 30)
    .map((r) => `| ${r.id} | ${r.subject} | ${r.year_group} | ${r.topic} | ${r.title} |`),
];

const summaryPath = path.join(repoRoot, "docs", "diagram-library-catalogue-summary.md");
fs.writeFileSync(summaryPath, summaryLines.join("\n") + "\n", "utf8");

console.log(`Wrote ${total} rows`);
console.log(`  CSV:     ${path.relative(repoRoot, csvPath)}`);
console.log(`  Summary: ${path.relative(repoRoot, summaryPath)}`);
console.log("");
for (const phase of phaseSummary) {
  console.log(`  ${phase.phase.padEnd(20)} ${phase.count}`);
}
