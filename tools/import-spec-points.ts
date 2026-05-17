/**
 * tools/import-spec-points.ts — FEAT-PC4 (UI half) · Phase C
 *
 * CLI stub that converts an awarding-body CSV table of spec points into the
 * JSON shape consumed by client/src/data/spec-points/. Run it once per
 * (board, subject, year-group) tuple after dropping a CSV exported from a
 * spec PDF (Tabula, Adobe Export, or copy-paste-then-clean works fine).
 *
 *   pnpm tsx tools/import-spec-points.ts \
 *     --board aqa \
 *     --subject "English Language" \
 *     --year-group "Year 10" \
 *     --qualification "GCSE 8700" \
 *     --source "AQA GCSE English Language 8700 specification (2015 onwards)" \
 *     --in  ./drafts/aqa-english-y10.csv \
 *     --out ./client/src/data/spec-points/aqa-english-y10.json
 *
 * CSV input format (header row required, comma-separated, UTF-8):
 *
 *   specRef,specTitle,ao,tier,band,bloomLevel
 *
 *   - specRef    (required)  awarding-body short code (e.g. "N1", "AO2-3")
 *   - specTitle  (required)  human-readable description
 *   - ao         (optional)  AO1 | AO2 | AO3 | AO4
 *   - tier       (optional)  foundation | higher | both
 *   - band       (optional)  awarding-body grade band, e.g. "5–9"
 *   - bloomLevel (optional)  recall | understanding | application | challenge
 *
 * The script does *not* call out to any awarding-body API — those PDFs are
 * still copyrighted. The teacher / curriculum lead is responsible for the
 * data-licensing path; this tool is the cheap "make it JSON" step.
 *
 * Stub: this file is intentionally minimal. It validates the input + writes
 * a well-formed dataset, but does not yet support things like merging into
 * an existing JSON file or fetching from a URL. Add those when the second
 * dataset arrives — premature features cost more than they save.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { argv, exit } from "node:process";

interface Args {
  board: string;
  subject: string;
  yearGroup: string;
  qualification?: string;
  source?: string;
  in: string;
  out: string;
}

const KNOWN_BOARDS = new Set(["aqa", "edexcel", "ocr", "cie", "sqa", "ccea", "white-rose"]);
const KNOWN_TIERS = new Set(["foundation", "higher", "both"]);
const KNOWN_AOS = new Set(["AO1", "AO2", "AO3", "AO4"]);

function fail(msg: string): never {
  console.error(`[import-spec-points] ${msg}`);
  exit(1);
}

function parseArgs(): Args {
  const out: Record<string, string> = {};
  // Trivial --key value parser. Sufficient for a CLI that only ever runs
  // locally and never sees attacker-controlled input.
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) fail(`Missing value for --${key}`);
      out[key] = value;
      i++;
    }
  }
  for (const required of ["board", "subject", "year-group", "in", "out"]) {
    if (!out[required]) fail(`--${required} is required`);
  }
  if (!KNOWN_BOARDS.has(out.board)) {
    fail(`Unknown board "${out.board}". Expected one of: ${Array.from(KNOWN_BOARDS).join(", ")}`);
  }
  return {
    board: out.board,
    subject: out.subject,
    yearGroup: out["year-group"],
    qualification: out.qualification,
    source: out.source,
    in: out.in,
    out: out.out,
  };
}

/**
 * Tiny CSV parser. Handles quoted fields, embedded commas, and escaped
 * double quotes ("" → "). Doesn't attempt to be RFC 4180 perfect — the
 * input is teacher-curated, not an arbitrary export.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch === "\r") { /* swallow */ }
      else { field += ch; }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function main() {
  const args = parseArgs();
  const inPath = resolve(args.in);
  if (!existsSync(inPath)) fail(`Input file not found: ${inPath}`);
  const raw = readFileSync(inPath, "utf-8");
  const rows = parseCsv(raw).filter((r) => r.some((c) => c.trim().length > 0));
  if (rows.length < 2) fail(`CSV at ${inPath} appears to be empty or header-only.`);

  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const refIdx = idx("specRef");
  const titleIdx = idx("specTitle");
  if (refIdx < 0 || titleIdx < 0) fail(`CSV header must include specRef and specTitle. Got: ${header.join(", ")}`);
  const aoIdx = idx("ao");
  const tierIdx = idx("tier");
  const bandIdx = idx("band");
  const bloomIdx = idx("bloomLevel");

  const specPoints: Array<Record<string, string>> = [];
  const seen = new Set<string>();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const specRef = (row[refIdx] || "").trim();
    const specTitle = (row[titleIdx] || "").trim();
    if (!specRef || !specTitle) continue;
    if (seen.has(specRef)) {
      console.warn(`[import-spec-points] Duplicate specRef "${specRef}" on row ${r + 1} — keeping first occurrence.`);
      continue;
    }
    seen.add(specRef);
    const point: Record<string, string> = { specRef, specTitle };
    if (aoIdx >= 0) {
      const v = (row[aoIdx] || "").trim();
      if (v) {
        if (!KNOWN_AOS.has(v)) console.warn(`[import-spec-points] Row ${r + 1}: ao="${v}" is not AO1–AO4 — keeping verbatim.`);
        point.ao = v;
      }
    }
    if (tierIdx >= 0) {
      const v = (row[tierIdx] || "").trim().toLowerCase();
      if (v) {
        if (!KNOWN_TIERS.has(v)) console.warn(`[import-spec-points] Row ${r + 1}: tier="${v}" is not foundation/higher/both — keeping verbatim.`);
        point.tier = v;
      }
    }
    if (bandIdx >= 0 && (row[bandIdx] || "").trim()) point.band = row[bandIdx].trim();
    if (bloomIdx >= 0 && (row[bloomIdx] || "").trim()) point.bloomLevel = row[bloomIdx].trim();
    specPoints.push(point);
  }

  if (specPoints.length === 0) fail(`No usable rows after parsing. Check that specRef and specTitle are populated.`);

  const dataset = {
    board: args.board,
    subject: args.subject,
    yearGroup: args.yearGroup,
    ...(args.qualification ? { qualification: args.qualification } : {}),
    source: args.source ?? `Imported from ${inPath}`,
    specPoints,
  };

  writeFileSync(resolve(args.out), JSON.stringify(dataset, null, 2) + "\n", "utf-8");
  console.log(`[import-spec-points] Wrote ${specPoints.length} spec points → ${args.out}`);
  console.log(`[import-spec-points] Don't forget to register the dataset in client/src/lib/specPointTaxonomy.ts.`);
}

main();
