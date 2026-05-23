/**
 * specPointTaxonomyAudit.ts — PR-19 / audit items #35 and #84.
 *
 * Spec-point taxonomy completeness audit. Pure, deterministic, no LLM.
 *
 * Counterpart to `enforceSpecAnchorPresence` (a worksheet-level
 * validator that warns when a single sheet is missing a `specRef`).
 * This module is the corpus-level companion: given a curated taxonomy
 * (the awarding body's full spec-point list, e.g. AQA GCSE Chemistry
 * 4.1.1.1 → 4.1.1.5) and a corpus of worksheets, it reports which
 * spec points have NEVER been covered and which have been over-covered.
 *
 * Single source of truth: `client/src/lib/specPointTaxonomy.ts` already
 * ships the per-subject taxonomy data. This module is just the audit
 * runner — it does not embed any spec-point strings.
 */

export interface TaxonomyAuditWorksheet {
  metadata?: {
    subject?: string;
    yearGroup?: string;
    examBoard?: string;
    topic?: string;
    coverageMap?: { rows?: Array<{ specRef?: string }> };
  } & Record<string, unknown>;
  sections?: Array<{ specRef?: string; [k: string]: unknown }>;
}

export interface SpecPointTaxonomyEntry {
  /** Awarding-body spec code, e.g. "4.1.1.1" or "AO1: Reading". */
  code: string;
  /** Human-readable label, e.g. "Atomic structure and the periodic table". */
  label: string;
  /** Subject id (lowercased) the spec belongs to. */
  subject: string;
  /** Key stage / year band: ks3 | ks4 | ks5. */
  keyStage: "ks3" | "ks4" | "ks5";
}

export interface TaxonomyCoverageFinding {
  code: string;
  label: string;
  occurrenceCount: number;
  /** True when the code appeared in zero worksheets. */
  uncovered: boolean;
}

export interface TaxonomyAuditReport {
  findings: TaxonomyCoverageFinding[];
  totalSpecPoints: number;
  coveredCount: number;
  uncoveredCount: number;
  /** Top-3 most-repeated codes — when the same spec point shows up on
   *  > 3 different worksheets, the SoW may be over-rotating it at the
   *  expense of less-covered points. */
  overRepresented: Array<{ code: string; occurrenceCount: number }>;
  warnings: string[];
}

/** Pull the spec ref from every section + the coverage-map rows. */
function collectSpecRefs(ws: TaxonomyAuditWorksheet): string[] {
  const refs = new Set<string>();
  for (const s of ws.sections || []) {
    if (typeof s.specRef === "string" && s.specRef.trim()) refs.add(s.specRef.trim());
  }
  const cm = ws.metadata?.coverageMap;
  if (cm && Array.isArray(cm.rows)) {
    for (const r of cm.rows) {
      if (typeof r.specRef === "string" && r.specRef.trim()) refs.add(r.specRef.trim());
    }
  }
  return Array.from(refs);
}

/**
 * Audit a corpus of worksheets against a taxonomy. Returns one
 * finding per spec point with its occurrence count across the corpus.
 */
export function runSpecPointTaxonomyAudit(
  corpus: TaxonomyAuditWorksheet[],
  taxonomy: SpecPointTaxonomyEntry[],
): TaxonomyAuditReport {
  const counts: Record<string, number> = Object.create(null);
  for (const e of taxonomy) counts[e.code] = 0;

  for (const ws of corpus) {
    const refs = collectSpecRefs(ws);
    for (const ref of refs) {
      // Count an occurrence both for an exact code match and for any
      // taxonomy code that is a prefix of the ref (so "4.1.1.1.a"
      // counts as covering "4.1.1.1").
      for (const e of taxonomy) {
        if (ref === e.code || ref.startsWith(`${e.code} `) || ref.startsWith(`${e.code}.`)) {
          counts[e.code] = (counts[e.code] || 0) + 1;
        }
      }
    }
  }

  const findings: TaxonomyCoverageFinding[] = taxonomy.map((e) => ({
    code: e.code,
    label: e.label,
    occurrenceCount: counts[e.code] || 0,
    uncovered: (counts[e.code] || 0) === 0,
  }));

  const uncoveredCount = findings.filter((f) => f.uncovered).length;
  const coveredCount = findings.length - uncoveredCount;
  const overRepresented = [...findings]
    .filter((f) => f.occurrenceCount >= 4)
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
    .slice(0, 3)
    .map((f) => ({ code: f.code, occurrenceCount: f.occurrenceCount }));

  const warnings: string[] = [];
  if (uncoveredCount > 0) {
    warnings.push(
      `[Phase PR-19 — Spec taxonomy] ${uncoveredCount} of ${findings.length} spec points are uncovered across the corpus.`,
    );
  }
  if (overRepresented.length > 0) {
    warnings.push(
      `[Phase PR-19 — Spec taxonomy] Over-represented: ${overRepresented
        .map((o) => `${o.code} (×${o.occurrenceCount})`)
        .join(", ")}.`,
    );
  }

  return {
    findings,
    totalSpecPoints: findings.length,
    coveredCount,
    uncoveredCount,
    overRepresented,
    warnings,
  };
}

/**
 * Worksheet-level slice. Warns when an exam-aligned worksheet ships
 * with no `specRef` on any section AND no coverage-map. Conservative —
 * the dedicated `enforceSpecAnchorPresence` validator handles the
 * deeper per-section check; this is just a corpus-aware tripwire.
 */
export function enforceSpecPointTaxonomy(
  ws: TaxonomyAuditWorksheet,
): { worksheet: TaxonomyAuditWorksheet; warnings: string[] } {
  const refs = collectSpecRefs(ws);
  const warnings: string[] = [];
  const yearGroup = String(ws.metadata?.yearGroup || "");
  const isExamYear = /Year\s*1[01]|Y1[01]|Year\s*1[23]|Y1[23]/.test(yearGroup);
  if (isExamYear && refs.length === 0) {
    warnings.push(
      `[Phase PR-19 — Spec taxonomy] No spec refs on any question for ${ws.metadata?.subject || "subject"} ${yearGroup} worksheet.`,
    );
  }
  return { worksheet: ws, warnings };
}
