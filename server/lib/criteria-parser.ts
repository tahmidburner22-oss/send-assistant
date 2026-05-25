/**
 * criteria-parser.ts — Parse teacher-uploaded criteria spreadsheets
 * for the Book Questions tab.
 *
 * Supports two file formats:
 *   - .xlsx / .xls (Microsoft Excel) — parsed via SheetJS
 *   - .csv         (comma-separated)  — parsed inline (no extra dep)
 *
 * The teacher's spreadsheet is expected to have a row per reading age
 * (or year group) with the matching criteria/mark scheme. We auto-detect
 * the columns by looking for headers containing keywords like
 * "reading age", "year", "criteria", "mark scheme", etc.
 *
 * If the spreadsheet has no header row that matches, we fall back to
 * "use the first non-empty cell of every row, joined".
 */

export interface ParsedCriteria {
  /** Per-row criteria rows, normalised. */
  rows: Array<{ readingAge: string; criteria: string }>;
  /** True when at least one row had an explicit reading-age column. */
  perAge: boolean;
  /** Concatenation of every row, useful as a fallback prompt section. */
  flat: string;
}

/**
 * Parse a buffer that the client uploaded. The mimetype is used as a
 * hint; if it's missing or unknown we try CSV first, then xlsx.
 */
export async function parseCriteriaFile(
  buffer: Buffer,
  mimetype?: string,
  filename?: string,
): Promise<ParsedCriteria> {
  const isCsv =
    mimetype === "text/csv" ||
    mimetype === "application/csv" ||
    (filename || "").toLowerCase().endsWith(".csv");
  const isXlsx =
    mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimetype === "application/vnd.ms-excel" ||
    (filename || "").toLowerCase().match(/\.xlsx?$/);

  if (isCsv) return parseCsv(buffer);
  if (isXlsx) return parseXlsx(buffer);
  // Last-resort: try CSV (cheap), then xlsx.
  try {
    return parseCsv(buffer);
  } catch {
    return parseXlsx(buffer);
  }
}

// ── CSV parsing — inline, no extra dependency ──────────────────────────────

function parseCsv(buffer: Buffer): ParsedCriteria {
  const text = buffer.toString("utf-8").replace(/^\uFEFF/, ""); // strip BOM
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], perAge: false, flat: "" };
  const records = lines.map(splitCsvLine);
  return rowsToCriteria(records);
}

/**
 * Minimal RFC-4180-ish CSV line splitter — handles double-quoted fields
 * with embedded commas and escaped quotes. Good enough for teacher-
 * created criteria files where fancy edge cases are unlikely.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

// ── XLSX parsing — dynamic import so the dep can be optional at runtime ──

async function parseXlsx(buffer: Buffer): Promise<ParsedCriteria> {
  // Dynamic import keeps TypeScript happy when the dep is missing in a
  // dev environment, mirroring how the rest of this codebase loads
  // pdf-parse and mammoth.
  const xlsx = await import("xlsx" as any);
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return { rows: [], perAge: false, flat: "" };
  const sheet = workbook.Sheets[firstSheetName];
  // header:1 returns a 2-D array of cell values — what we want.
  const records: string[][] = (xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" }) as any[][])
    .map(row => row.map(cell => (cell == null ? "" : String(cell)).trim()));
  return rowsToCriteria(records);
}

// ── Shared: rows → ParsedCriteria ──────────────────────────────────────────

const READING_AGE_HEADERS = [
  "reading age", "readingage", "age", "year group", "year", "level", "ks",
];
const CRITERIA_HEADERS = [
  "criteria", "mark scheme", "markscheme", "objectives", "learning objectives", "los",
  "skills", "focus", "questions",
];

function findHeaderIndex(header: string[], keywords: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const cell = (header[i] || "").toLowerCase().trim();
    if (!cell) continue;
    for (const kw of keywords) if (cell.includes(kw)) return i;
  }
  return -1;
}

function rowsToCriteria(records: string[][]): ParsedCriteria {
  if (records.length === 0) return { rows: [], perAge: false, flat: "" };

  // Look for header row in the first 3 rows.
  let headerRowIndex = -1;
  let ageCol = -1;
  let critCol = -1;
  for (let i = 0; i < Math.min(3, records.length); i++) {
    const row = records[i];
    const a = findHeaderIndex(row, READING_AGE_HEADERS);
    const c = findHeaderIndex(row, CRITERIA_HEADERS);
    if (a >= 0 || c >= 0) {
      headerRowIndex = i; ageCol = a; critCol = c;
      break;
    }
  }

  if (headerRowIndex >= 0 && ageCol >= 0 && critCol >= 0) {
    const rows: ParsedCriteria["rows"] = [];
    for (let i = headerRowIndex + 1; i < records.length; i++) {
      const r = records[i];
      const readingAge = (r[ageCol] || "").trim();
      const criteria = (r[critCol] || "").trim();
      if (readingAge || criteria) rows.push({ readingAge, criteria });
    }
    const flat = rows.map(r => r.readingAge ? `${r.readingAge}: ${r.criteria}` : r.criteria).filter(Boolean).join("\n");
    return { rows, perAge: rows.some(r => r.readingAge.length > 0), flat };
  }

  // No clear header — flatten all non-empty cells, one row per line,
  // and hand the whole thing back as `flat`.
  const flatRows = records
    .map(r => r.filter(c => c).join(" | "))
    .filter(line => line.trim().length > 0);
  return {
    rows: flatRows.map(line => ({ readingAge: "", criteria: line })),
    perAge: false,
    flat: flatRows.join("\n"),
  };
}

// ── Reading-age matcher ─────────────────────────────────────────────────────

/**
 * From a parsed criteria sheet, pick the row that best matches the
 * pupil's reading age / year. Matching is forgiving:
 *   - "reading-age-8-9" matches a row labelled "8-9", "Age 8-9", "Year 4"
 *   - "Year 4" matches a row labelled "Year 4" or an age 8-9 row
 *
 * Returns the criteria text from the best-matching row, or the flat
 * concatenation if no row matched well.
 */
export function selectCriteriaForReadingAge(
  parsed: ParsedCriteria,
  readingAgeOrYear: string,
): { criteria: string; matchedRow?: string; reason: "matched" | "flat" | "empty" } {
  if (!parsed || parsed.rows.length === 0) {
    return { criteria: "", reason: "empty" };
  }
  if (!parsed.perAge) {
    return { criteria: parsed.flat, reason: "flat" };
  }

  const target = (readingAgeOrYear || "").toLowerCase();
  const targetAges = extractAges(target);
  const targetYear = extractYear(target);

  let best: { row: ParsedCriteria["rows"][number]; score: number } | null = null;
  for (const row of parsed.rows) {
    const label = row.readingAge.toLowerCase();
    let score = 0;
    if (label && target && label.includes(target)) score += 5;
    if (target && label && target.includes(label)) score += 4;
    if (targetYear && new RegExp(`\\byear\\s*${targetYear}\\b`).test(label)) score += 6;
    const rowAges = extractAges(label);
    for (const a of rowAges) if (targetAges.includes(a)) score += 3;
    if (score > 0 && (!best || score > best.score)) best = { row, score };
  }

  if (best) {
    return { criteria: best.row.criteria, matchedRow: best.row.readingAge, reason: "matched" };
  }
  return { criteria: parsed.flat, reason: "flat" };
}

function extractAges(text: string): number[] {
  const out = new Set<number>();
  // Matches "8", "8-9", "8 to 9", "ages 8 9".
  for (const m of text.matchAll(/(\d{1,2})\s*(?:[-–to]\s*)?(\d{1,2})?/g)) {
    const a = parseInt(m[1], 10);
    if (a >= 4 && a <= 18) out.add(a);
    if (m[2]) {
      const b = parseInt(m[2], 10);
      if (b >= 4 && b <= 18) out.add(b);
    }
  }
  return [...out];
}

function extractYear(text: string): number | null {
  const m = text.match(/\byear\s*(\d{1,2})\b/i);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return y >= 1 && y <= 13 ? y : null;
}
