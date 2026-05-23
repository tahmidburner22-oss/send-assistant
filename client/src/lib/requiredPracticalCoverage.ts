/**
 * requiredPracticalCoverage.ts — PR-19 / audit item #37.
 *
 * Required Practical (RP) coverage tracker over a Scheme of Work.
 * Pure, deterministic, no LLM.
 *
 * KS4 sciences (AQA / Edexcel / OCR) require schools to deliver a
 * fixed set of "Required Practicals" (e.g. AQA Biology has 7 RPs;
 * Chemistry has 8; Physics has 10). This audit takes a SoW corpus
 * (worksheets) plus the curated RP list and reports which RPs are
 * not represented anywhere in the SoW.
 *
 * Each worksheet carries `metadata.requiredPractical?.id` (stamped
 * by FEAT-PC9). For sheets that don't carry the metadata yet, we
 * fall back to a conservative title regex.
 */

import { REQUIRED_PRACTICAL_BANK } from "./requiredPractical-bank";

export interface RpCoverageWorksheet {
  title?: string;
  metadata?: {
    subject?: string;
    examBoard?: string;
    requiredPractical?: { id?: string; specCode?: string };
    topic?: string;
  } & Record<string, unknown>;
}

export interface RpCoverageFinding {
  id: string;
  title: string;
  specCode: string;
  occurrenceCount: number;
  uncovered: boolean;
}

export interface RpCoverageReport {
  /** Subject filter applied to the audit ("biology" | "chemistry" | "physics" | undefined for all). */
  subject?: string;
  /** Awarding-body filter applied ("aqa" | "edexcel" | "ocr" | undefined for all). */
  examBoard?: string;
  findings: RpCoverageFinding[];
  totalRequired: number;
  coveredCount: number;
  uncoveredCount: number;
  warnings: string[];
}

interface MinimalRpEntry {
  id: string;
  title: string;
  specCode: string;
  subject: string;
  examBoard?: string;
}

/** Hand-curated minimal RP list as a fallback when the bank module
 *  ships an incompatible shape. The audit prefers REQUIRED_PRACTICALS
 *  when it exposes the canonical fields. */
const FALLBACK_RP_LIST: MinimalRpEntry[] = [
  { id: "aqa-bio-rp1", title: "Microscopy", specCode: "RP1", subject: "biology", examBoard: "aqa" },
  { id: "aqa-bio-rp2", title: "Osmosis", specCode: "RP2", subject: "biology", examBoard: "aqa" },
  { id: "aqa-chem-rp1", title: "Making salts", specCode: "RP1", subject: "chemistry", examBoard: "aqa" },
  { id: "aqa-phys-rp1", title: "Specific heat capacity", specCode: "RP1", subject: "physics", examBoard: "aqa" },
];

function loadRpList(): MinimalRpEntry[] {
  try {
    const list = REQUIRED_PRACTICAL_BANK as unknown;
    if (Array.isArray(list)) {
      const mapped: MinimalRpEntry[] = [];
      for (const e of list as Array<Record<string, unknown>>) {
        const id = String(e.id ?? "").trim();
        const title = String(e.title ?? "").trim();
        // Pick the AQA spec code by default; fall back to the first
        // entry in `specCodes` when AQA is absent.
        const specCodes = (e.specCodes as Record<string, string> | undefined) || {};
        const specCode =
          specCodes.aqa || specCodes.edexcel || specCodes.ocr || Object.values(specCodes)[0] || "";
        const subject = String(e.subject ?? "").toLowerCase();
        const boards = Array.isArray(e.boards) ? (e.boards as string[]).map((b) => b.toLowerCase()) : [];
        const examBoard = boards.find((b) => b !== "any");
        if (id && title) {
          mapped.push({ id, title, specCode, subject, examBoard });
        }
      }
      if (mapped.length > 0) return mapped;
    }
  } catch {
    // Bank module shape changed — fall back.
  }
  return FALLBACK_RP_LIST;
}

/** Detect an RP id on a single worksheet. Prefers the metadata stamp;
 *  falls back to a title-regex match against the curated list. */
export function detectRpOnWorksheet(
  ws: RpCoverageWorksheet,
  rpList: MinimalRpEntry[],
): MinimalRpEntry | undefined {
  const stampedId = ws.metadata?.requiredPractical?.id;
  if (stampedId) {
    const hit = rpList.find((e) => e.id === stampedId);
    if (hit) return hit;
  }
  const title = String(ws.title || "").toLowerCase();
  const topic = String(ws.metadata?.topic || "").toLowerCase();
  const haystack = `${title} ${topic}`.trim();
  if (!haystack) return undefined;
  return rpList.find((e) => haystack.includes(e.title.toLowerCase()));
}

/**
 * Audit a SoW corpus against the curated RP list, optionally filtered
 * by subject / exam board.
 */
export function runRequiredPracticalAudit(
  corpus: RpCoverageWorksheet[],
  filter: { subject?: string; examBoard?: string } = {},
): RpCoverageReport {
  const all = loadRpList();
  const subject = filter.subject?.toLowerCase();
  const examBoard = filter.examBoard?.toLowerCase();
  const rpList = all.filter((e) => {
    if (subject && e.subject !== subject) return false;
    if (examBoard && e.examBoard && e.examBoard !== examBoard) return false;
    return true;
  });

  const counts: Record<string, number> = Object.create(null);
  for (const e of rpList) counts[e.id] = 0;

  for (const ws of corpus) {
    const hit = detectRpOnWorksheet(ws, rpList);
    if (hit) counts[hit.id] = (counts[hit.id] || 0) + 1;
  }

  const findings: RpCoverageFinding[] = rpList.map((e) => ({
    id: e.id,
    title: e.title,
    specCode: e.specCode,
    occurrenceCount: counts[e.id] || 0,
    uncovered: (counts[e.id] || 0) === 0,
  }));
  const uncoveredCount = findings.filter((f) => f.uncovered).length;
  const coveredCount = findings.length - uncoveredCount;

  const warnings: string[] = [];
  if (uncoveredCount > 0) {
    const missing = findings
      .filter((f) => f.uncovered)
      .map((f) => `${f.specCode} ${f.title}`)
      .join(", ");
    warnings.push(
      `[Phase PR-19 — Required Practicals] ${uncoveredCount} of ${findings.length} RPs not yet covered in this SoW: ${missing}.`,
    );
  }

  return {
    subject,
    examBoard,
    findings,
    totalRequired: findings.length,
    coveredCount,
    uncoveredCount,
    warnings,
  };
}

/**
 * Worksheet-level slice — no-op (RP coverage is a SoW property; an
 * individual sheet can correctly cover zero RPs without it being a
 * defect). Provided so the registry adapter pattern still applies.
 */
export function enforceRequiredPracticalCoverage(
  ws: RpCoverageWorksheet,
): { worksheet: RpCoverageWorksheet; warnings: string[] } {
  return { worksheet: ws, warnings: [] };
}
