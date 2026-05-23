/**
 * diagramPageFitAudit.ts — PR-23 / audit item #56.
 *
 * Diagram page-fit + complexity budget audit. Pure / deterministic.
 *
 * The renderer prints worksheets at A4 portrait by default. A
 * diagram with > 800 px reported height OR > 12 distinct labels
 * tends to overflow into the next page or shrink past readability.
 * This audit checks the diagram metadata stamp and warns when a
 * section's diagram is over-budget.
 *
 * The pipeline cannot resize the diagram itself from this module
 * (that requires a renderer round-trip with measured DOM); we only
 * stamp warnings + a structured report.
 */

export interface DiagramPageFitSection {
  type?: string;
  title?: string;
  /** Reported diagram dimensions, when the renderer measured them. */
  diagramBounds?: { widthPx?: number; heightPx?: number };
  /** Distinct labels on the diagram (counted from the SVG). */
  diagramLabelCount?: number;
  imageUrl?: string;
  svg?: string;
  assetRef?: string;
}

export interface DiagramPageFitWorksheet {
  metadata?: Record<string, unknown> & { diagramCoverage?: unknown };
  sections?: DiagramPageFitSection[];
}

export interface DiagramPageFitFinding {
  sectionIndex: number;
  title: string;
  /** "page-fit" = too tall / wide; "complexity" = too many labels. */
  bucket: "page-fit" | "complexity";
  message: string;
}

export interface DiagramPageFitReport {
  findings: DiagramPageFitFinding[];
  oversizedCount: number;
  overComplexCount: number;
  warnings: string[];
}

/** Default budget tuned for A4 portrait at 96 DPI: full page is
 *  ≈ 2480 × 3508 px. Diagrams shouldn't exceed half a page in
 *  height when paired with a question stem. */
export const DIAGRAM_BUDGET = {
  maxHeightPx: 800,
  maxWidthPx: 1100,
  maxLabelCount: 12,
};

function isDiagramSection(s: DiagramPageFitSection): boolean {
  if (String(s.type || "").toLowerCase() === "diagram") return true;
  return Boolean(s.imageUrl || s.svg || s.assetRef);
}

export function auditDiagramPageFit(
  ws: DiagramPageFitWorksheet,
): DiagramPageFitReport {
  const findings: DiagramPageFitFinding[] = [];
  const warnings: string[] = [];
  const sections = ws.sections || [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!isDiagramSection(s)) continue;
    const h = s.diagramBounds?.heightPx ?? 0;
    const w = s.diagramBounds?.widthPx ?? 0;
    if (h > DIAGRAM_BUDGET.maxHeightPx) {
      findings.push({
        sectionIndex: i,
        title: String(s.title || `Section ${i + 1}`),
        bucket: "page-fit",
        message: `Diagram is ${h}px tall; budget is ${DIAGRAM_BUDGET.maxHeightPx}px.`,
      });
    }
    if (w > DIAGRAM_BUDGET.maxWidthPx) {
      findings.push({
        sectionIndex: i,
        title: String(s.title || `Section ${i + 1}`),
        bucket: "page-fit",
        message: `Diagram is ${w}px wide; budget is ${DIAGRAM_BUDGET.maxWidthPx}px.`,
      });
    }
    const labels = s.diagramLabelCount ?? 0;
    if (labels > DIAGRAM_BUDGET.maxLabelCount) {
      findings.push({
        sectionIndex: i,
        title: String(s.title || `Section ${i + 1}`),
        bucket: "complexity",
        message: `Diagram has ${labels} labels; budget is ${DIAGRAM_BUDGET.maxLabelCount}.`,
      });
    }
  }
  const oversizedCount = findings.filter((f) => f.bucket === "page-fit").length;
  const overComplexCount = findings.filter((f) => f.bucket === "complexity").length;
  if (oversizedCount > 0) {
    warnings.push(
      `[Phase PR-23 — Diagram page-fit] ${oversizedCount} diagram(s) exceed the A4 page-fit budget (max ${DIAGRAM_BUDGET.maxHeightPx}px tall × ${DIAGRAM_BUDGET.maxWidthPx}px wide).`,
    );
  }
  if (overComplexCount > 0) {
    warnings.push(
      `[Phase PR-23 — Diagram page-fit] ${overComplexCount} diagram(s) exceed the complexity budget (max ${DIAGRAM_BUDGET.maxLabelCount} labels).`,
    );
  }
  return { findings, oversizedCount, overComplexCount, warnings };
}

/**
 * Stamp the report onto `metadata.diagramPageFit`. Pure / idempotent.
 * Compatible with the registry adapter shape.
 */
export function enforceDiagramPageFit(
  ws: DiagramPageFitWorksheet,
): { worksheet: DiagramPageFitWorksheet; warnings: string[] } {
  const report = auditDiagramPageFit(ws);
  return {
    worksheet: {
      ...ws,
      metadata: {
        ...(ws.metadata || {}),
        diagramPageFit: {
          oversizedCount: report.oversizedCount,
          overComplexCount: report.overComplexCount,
          findings: report.findings,
        },
      },
    },
    warnings: report.warnings,
  };
}
