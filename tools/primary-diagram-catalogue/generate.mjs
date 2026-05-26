#!/usr/bin/env node
/**
 * Primary diagram catalogue generator.
 *
 * Composes per-subject modules into a single CSV at
 *   docs/primary-diagram-library.csv
 *
 * The CSV columns map 1:1 to the diagram_library DB schema (see
 * server/db/index.ts) plus two editorial extras:
 *   - year_band   — KS1 / LKS2 / UKS2 (derived from year_group)
 *   - style_notes — guidance for the artist / image-gen step
 *
 * Run from repo root:
 *   node tools/primary-diagram-catalogue/generate.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeContext, rowsToCsv } from "./_helpers.mjs";

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

const SUBJECT_BUILDERS = [
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const ctx = makeContext();
const summary = [];

for (const [name, build] of SUBJECT_BUILDERS) {
  const before = ctx.count;
  build(ctx);
  const added = ctx.count - before;
  summary.push({ subject: name, count: added });
}

// ── Write CSV ────────────────────────────────────────────────────────────────
const csvPath = path.join(repoRoot, "docs", "primary-diagram-library.csv");
fs.mkdirSync(path.dirname(csvPath), { recursive: true });
fs.writeFileSync(csvPath, rowsToCsv(ctx.rows), "utf8");

// ── Write summary markdown ───────────────────────────────────────────────────
const total = ctx.count;
const summaryLines = [
  "# Primary Diagram Library — Catalogue Summary",
  "",
  `Generated: **${total}** unique diagram briefs across ${summary.length} subjects.`,
  "",
  "| Subject | Count |",
  "| --- | ---: |",
  ...summary.map((s) => `| ${s.subject} | ${s.count} |`),
  `| **Total** | **${total}** |`,
  "",
  "Each row in `docs/primary-diagram-library.csv` is a *brief*: a unique title,",
  "topic and description that an artist or image-gen step can produce. Once an",
  "image is uploaded via Admin Panel → Diagram Library, the row's `image_url`",
  "and `asset_ref` are filled in and `curated` flips to 1.",
  "",
  "Re-run with:",
  "",
  "```bash",
  "node tools/primary-diagram-catalogue/generate.mjs",
  "```",
  "",
  "## Year-band coverage",
  "",
];

const bandCounts = new Map();
for (const r of ctx.rows) {
  bandCounts.set(r.year_band, (bandCounts.get(r.year_band) || 0) + 1);
}
const bandOrder = ["KS1", "LKS2", "UKS2", "KS1+KS2", "KS2", "Year 1-6"];
const seenBands = [...bandCounts.keys()];
const sortedBands = [
  ...bandOrder.filter((b) => seenBands.includes(b)),
  ...seenBands.filter((b) => !bandOrder.includes(b)).sort(),
];
summaryLines.push("| Band | Count |", "| --- | ---: |");
for (const b of sortedBands) {
  summaryLines.push(`| ${b} | ${bandCounts.get(b)} |`);
}

// Sample rows
summaryLines.push(
  "",
  "## Sample rows (first 30)",
  "",
  "| ID | Subject | Year | Topic | Title |",
  "| --- | --- | --- | --- | --- |",
);
for (const r of ctx.rows.slice(0, 30)) {
  summaryLines.push(`| ${r.id} | ${r.subject} | ${r.year_group} | ${r.topic} | ${r.title} |`);
}

const summaryPath = path.join(repoRoot, "docs", "primary-diagram-library-summary.md");
fs.writeFileSync(summaryPath, summaryLines.join("\n") + "\n", "utf8");

console.log(`Wrote ${total} rows`);
console.log(`  CSV:     ${path.relative(repoRoot, csvPath)}`);
console.log(`  Summary: ${path.relative(repoRoot, summaryPath)}`);
console.log("");
for (const s of summary) {
  console.log(`  ${s.subject.padEnd(18)} ${s.count}`);
}
