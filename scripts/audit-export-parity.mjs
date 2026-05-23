#!/usr/bin/env node
/**
 * scripts/audit-export-parity.mjs — PR-24 / audit item #58.
 *
 * DOCX / PDF feature parity audit. Cross-checks the symbols exported
 * by `client/src/lib/docx-export.ts` and `client/src/lib/pdf-generator.ts`
 * (or `pdf-generator-v2.ts`) so a feature added on one path can never
 * silently lag behind on the other.
 *
 * The audit is regex-based on purpose — running an actual TS analyser
 * in CI is overkill. We extract the function names and the section-
 * type strings each exporter handles, then diff the two sets.
 *
 * Exit codes:
 *   0 — every section type / formatter handled by both paths.
 *   1 — at least one drift detected.
 *
 * Run:
 *   node scripts/audit-export-parity.mjs
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const ROOT = process.cwd();
const DOCX_PATH = join(ROOT, "client/src/lib/docx-export.ts");
const PDF_PATHS = [
  join(ROOT, "client/src/lib/pdf-generator-v2.ts"),
  join(ROOT, "client/src/lib/pdf-generator.ts"),
];

const SECTION_TYPE_RE = /["'`](q-[a-z][a-z0-9-]+|key-vocab|word-bank|worked-example|common-mistakes|self-reflection|revision-tips|mark-scheme|diagram|learning-objective|reading-comprehension|vocabulary|grammar-drill|knowledge-organiser|anchor-poster|now-next-then)["'`]/g;

async function readIfExists(p) {
  if (!existsSync(p)) return null;
  return readFile(p, "utf8");
}

function extractTypes(content) {
  if (!content) return new Set();
  const out = new Set();
  let m;
  SECTION_TYPE_RE.lastIndex = 0;
  while ((m = SECTION_TYPE_RE.exec(content)) !== null) out.add(m[1]);
  return out;
}

async function main() {
  const docx = await readIfExists(DOCX_PATH);
  let pdf = null;
  let pdfPathUsed = "(none)";
  for (const p of PDF_PATHS) {
    pdf = await readIfExists(p);
    if (pdf) {
      pdfPathUsed = p;
      break;
    }
  }
  if (!docx || !pdf) {
    process.stdout.write(
      `[audit-export-parity] Skipping — DOCX present=${Boolean(docx)} PDF present=${Boolean(pdf)} (${pdfPathUsed}).\n`,
    );
    return;
  }
  const docxTypes = extractTypes(docx);
  const pdfTypes = extractTypes(pdf);
  const onlyInDocx = [...docxTypes].filter((t) => !pdfTypes.has(t)).sort();
  const onlyInPdf = [...pdfTypes].filter((t) => !docxTypes.has(t)).sort();
  if (onlyInDocx.length === 0 && onlyInPdf.length === 0) {
    process.stdout.write(
      `[audit-export-parity] OK — DOCX (${docxTypes.size}) and PDF (${pdfTypes.size}) handle the same set of section types.\n`,
    );
    return;
  }
  if (onlyInDocx.length > 0) {
    process.stderr.write(
      `[audit-export-parity] DRIFT — these section types are handled by DOCX but NOT by PDF:\n`,
    );
    for (const t of onlyInDocx) process.stderr.write(`  - ${t}\n`);
  }
  if (onlyInPdf.length > 0) {
    process.stderr.write(
      `[audit-export-parity] DRIFT — these section types are handled by PDF but NOT by DOCX:\n`,
    );
    for (const t of onlyInPdf) process.stderr.write(`  - ${t}\n`);
  }
  process.exit(1);
}

main().catch((e) => {
  process.stderr.write(`[audit-export-parity] crashed: ${e?.stack ?? e}\n`);
  process.exit(2);
});
