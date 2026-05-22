/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * AuditTrailPanel.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * "Why this worksheet looks like this" — single teacher-facing audit
 * panel that consolidates the ten different audit signals the worksheet
 * generator + post-validator chain stamp on `worksheet.metadata`.
 *
 * Closes audit item #79.
 *
 * Read-only. Adds no schema fields. Skips its own subsections gracefully
 * when the metadata field they consume is absent — older worksheets keep
 * rendering with blank tabs rather than erroring.
 *
 * Default-collapsed via a native `<details>` element so the panel works
 * even before React hydrates and is keyboard-accessible without extra
 * ARIA wiring. Print-hidden via the existing `ws-no-print-on-student`
 * class so the panel never bleeds into pupil printables.
 *
 * Surfaces:
 *   1. QA score breakdown                 — `metadata.qaScore`
 *   2. Curriculum coverage map            — `metadata.coverageMap`
 *   3. Assessment-objective histogram     — `metadata.aoHistogram`
 *   4. SEND fidelity audit                — `metadata.sendFidelityReport`
 *   5. MCQ → misconception linkage        — `metadata.misconceptionLinks`
 *   6. Post-validator warnings            — `metadata.postValidatorWarnings`
 *
 * The existing scattered teacher panels (FEAT-PB6 SEND fidelity card at
 * line ~7715, FEAT-PC10 coverage card at line ~8127) keep working —
 * this panel is additive and gives a one-stop view a teacher can hand
 * to a HoD or a TA without explanation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
// Every field is optional + read defensively because the panel must
// degrade gracefully on older worksheets.

export interface AuditTrailWorksheet {
  metadata?: Record<string, unknown> & {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    examBoard?: string;
    sendNeed?: string;
    generatorVersion?: string;
    qaScore?: QaScoreShape;
    validationStatus?: string;
    coverageMap?: CoverageMapShape;
    aoHistogram?: Record<string, number>;
    sendFidelityReport?: SendFidelityShape;
    misconceptionLinks?: Array<MisconceptionLinkShape>;
    postValidatorWarnings?: string[];
  };
}

interface QaScoreShape {
  total?: number;
  /** Legacy alias used by template-generator path (worksheet-generator.ts). */
  overallScore?: number;
  status?: string;
  curriculumAlignment?: number;
  examStyleAccuracy?: number;
  questionProgression?: number;
  diagramQuality?: number;
  sendAdaptationQuality?: number;
  layoutPrintQuality?: number;
  teacherKeyQuality?: number;
  notationAccuracy?: number;
  metadataValidity?: number;
  failConditions?: string[];
}

interface CoverageMapShape {
  totalQuestions?: number;
  totalMarks?: number;
  bloomDistribution?: Record<string, number>;
  commandWords?: string[];
  rows?: Array<{
    qNum?: number;
    sectionTitle?: string;
    marks?: number;
    bloom?: string;
    commandWord?: string;
    specRef?: string;
    misconceptionIds?: string[];
  }>;
}

interface SendFidelityShape {
  sendNeedName?: string;
  appliedCount?: number;
  totalCount?: number;
  fidelityRatio?: number;
  rules?: Array<{
    ruleIndex: number;
    rule: string;
    status: "applied" | "missing" | "not-checked";
    evidence?: string;
  }>;
  warnings?: string[];
}

interface MisconceptionLinkShape {
  sectionIndex?: number;
  sectionTitle?: string;
  distractor?: string;
  misconceptionId?: string;
}

export interface AuditTrailPanelProps {
  worksheet: AuditTrailWorksheet;
  /**
   * Only renders when `true`. The renderer already gates the QA banner
   * on `isTeacherView`; the panel mirrors that gate so the audit is
   * never accidentally exposed to pupils.
   */
  isTeacherView: boolean;
  /** Optional override — defaults to `false` (collapsed). */
  defaultExpanded?: boolean;
  /**
   * Optional class name appended to the panel root. Used by the renderer
   * to apply per-page-mode print rules.
   */
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the QA total, falling back to the legacy `overallScore`. */
function qaTotal(qa: QaScoreShape | undefined): number | undefined {
  if (!qa) return undefined;
  if (typeof qa.total === "number") return qa.total;
  if (typeof qa.overallScore === "number") return qa.overallScore;
  return undefined;
}

/** Bucketise post-validator warnings by their leading prefix so the
 *  panel can group "Phase 5 — UK English: …" warnings together. */
function bucketWarnings(warnings: string[] | undefined): Record<string, string[]> {
  const buckets: Record<string, string[]> = {};
  for (const w of warnings ?? []) {
    const m = w.match(/^\s*\[?(Phase \d+(?:\s+—\s+[^:\]]+)?|FEAT-\w+|PR-\d+|\w[\w -]*?)[\]:]/);
    const key = (m?.[1] ?? "Other").trim();
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(w);
  }
  return buckets;
}

/** Per-component QA score row — bar chart cell. */
function ScoreRow(props: { label: string; got: number | undefined; max: number }) {
  const { label, got, max } = props;
  const pct = typeof got === "number" ? Math.max(0, Math.min(100, (got / max) * 100)) : 0;
  const isMissing = typeof got !== "number";
  const tone = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
      <div style={{ width: "180px", fontSize: "11px", color: "#1f2937" }}>{label}</div>
      <div
        style={{
          flex: 1,
          height: "8px",
          background: "#e5e7eb",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: isMissing ? "#9ca3af" : tone,
          }}
        />
      </div>
      <div style={{ width: "56px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#1f2937" }}>
        {isMissing ? "—" : `${got}/${max}`}
      </div>
    </div>
  );
}

// ─── Subsections ─────────────────────────────────────────────────────────────

function QaScoreSection({ qa }: { qa: QaScoreShape | undefined }) {
  if (!qa) return null;
  const total = qaTotal(qa);
  const status = qa.status ?? "—";
  const fails = qa.failConditions ?? [];
  return (
    <section style={{ marginTop: "10px" }}>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 800, color: "#111827" }}>
        Quality score
        {typeof total === "number" && (
          <span
            style={{
              marginLeft: "8px",
              padding: "1px 8px",
              fontSize: "11px",
              borderRadius: "10px",
              background: "#1f2937",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {total}/100 · {status}
          </span>
        )}
      </h4>
      <ScoreRow label="Curriculum alignment" got={qa.curriculumAlignment} max={15} />
      <ScoreRow label="Exam-style accuracy" got={qa.examStyleAccuracy} max={15} />
      <ScoreRow label="Question progression" got={qa.questionProgression} max={10} />
      <ScoreRow label="Diagram quality" got={qa.diagramQuality} max={10} />
      <ScoreRow label="SEND adaptation quality" got={qa.sendAdaptationQuality} max={15} />
      <ScoreRow label="Layout / print quality" got={qa.layoutPrintQuality} max={10} />
      <ScoreRow label="Teacher-key quality" got={qa.teacherKeyQuality} max={10} />
      <ScoreRow label="Notation accuracy" got={qa.notationAccuracy} max={10} />
      <ScoreRow label="Metadata validity" got={qa.metadataValidity} max={5} />
      {fails.length > 0 && (
        <div
          style={{
            marginTop: "6px",
            padding: "6px 8px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "4px",
            fontSize: "11px",
            color: "#7f1d1d",
          }}
        >
          <strong>Fail conditions:</strong>
          <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
            {fails.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CoverageMapSection({ cm }: { cm: CoverageMapShape | undefined }) {
  if (!cm) return null;
  const dist = cm.bloomDistribution ?? {};
  const bloomColor = (b: string) =>
    b === "recall" ? "#0891b2"
    : b === "understanding" ? "#7c3aed"
    : b === "application" ? "#c2410c"
    : b === "challenge" ? "#b91c1c"
    : "#6b7280";
  const bloomKeys = ["recall", "understanding", "application", "challenge"] as const;
  return (
    <section style={{ marginTop: "10px" }}>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 800, color: "#111827" }}>
        Curriculum coverage
        <span
          style={{
            marginLeft: "8px",
            padding: "1px 8px",
            fontSize: "11px",
            borderRadius: "10px",
            background: "#374151",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          {cm.totalQuestions ?? 0} Qs · {cm.totalMarks ?? 0} marks
        </span>
      </h4>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
        {bloomKeys.map((b) => {
          const n = dist[b] ?? 0;
          if (!n) return null;
          return (
            <span
              key={b}
              style={{
                padding: "1px 8px",
                borderRadius: "10px",
                background: bloomColor(b) + "1a",
                color: bloomColor(b),
                fontSize: "10px",
                fontWeight: 700,
                border: `1px solid ${bloomColor(b)}`,
              }}
            >
              {b} ×{n}
            </span>
          );
        })}
      </div>
      {(cm.commandWords ?? []).length > 0 && (
        <div style={{ fontSize: "11px", color: "#374151", marginTop: "4px" }}>
          <strong>Command words:</strong> {(cm.commandWords ?? []).join(", ")}
        </div>
      )}
    </section>
  );
}

function AoHistogramSection({ histogram }: { histogram: Record<string, number> | undefined }) {
  if (!histogram) return null;
  const aoKeys = ["AO1", "AO2", "AO3", "AO4"];
  const max = Math.max(1, ...aoKeys.map((k) => histogram[k] ?? 0));
  return (
    <section style={{ marginTop: "10px" }}>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 800, color: "#111827" }}>
        Assessment objectives
      </h4>
      {aoKeys.map((k) => {
        const n = histogram[k] ?? 0;
        const pct = (n / max) * 100;
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
            <div style={{ width: "40px", fontSize: "11px", fontWeight: 700, color: "#1f2937" }}>{k}</div>
            <div style={{ flex: 1, height: "8px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "#3b82f6" }} />
            </div>
            <div style={{ width: "30px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#1f2937" }}>
              {n}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function SendFidelitySection({ report }: { report: SendFidelityShape | undefined }) {
  if (!report) return null;
  const probeable = (report.rules ?? []).filter((r) => r.status !== "not-checked").length;
  const ratio = typeof report.fidelityRatio === "number" ? Math.round(report.fidelityRatio * 100) : 0;
  return (
    <section style={{ marginTop: "10px" }}>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 800, color: "#111827" }}>
        SEND fidelity
        {report.sendNeedName && (
          <span style={{ marginLeft: "6px", color: "#6b7280", fontWeight: 600 }}>· {report.sendNeedName}</span>
        )}
        <span
          style={{
            marginLeft: "8px",
            padding: "1px 8px",
            fontSize: "11px",
            borderRadius: "10px",
            background: "#374151",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          {report.appliedCount ?? 0}/{probeable} ({ratio}%)
        </span>
      </h4>
      <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.45, fontSize: "11px" }}>
        {(report.rules ?? []).map((r) => {
          const tick = r.status === "applied" ? "✓" : r.status === "missing" ? "✗" : "·";
          const colour = r.status === "applied" ? "#15803d" : r.status === "missing" ? "#b91c1c" : "#6b7280";
          return (
            <li key={r.ruleIndex} style={{ marginBottom: "2px", color: colour }}>
              <strong style={{ marginRight: "4px" }}>{tick}</strong>
              <span>Rule {r.ruleIndex}: {r.rule}</span>
              {r.evidence ? (
                <span style={{ display: "block", fontSize: "10px", color: "#52525b", marginLeft: "16px" }}>
                  {r.evidence}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MisconceptionLinksSection({ links }: { links: MisconceptionLinkShape[] | undefined }) {
  if (!links || links.length === 0) return null;
  return (
    <section style={{ marginTop: "10px" }}>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 800, color: "#111827" }}>
        MCQ → misconception linkage
        <span
          style={{
            marginLeft: "8px",
            padding: "1px 8px",
            fontSize: "11px",
            borderRadius: "10px",
            background: "#374151",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          {links.length} link{links.length === 1 ? "" : "s"}
        </span>
      </h4>
      <ul style={{ margin: 0, paddingLeft: "18px", lineHeight: 1.45, fontSize: "11px" }}>
        {links.map((l, i) => (
          <li key={i}>
            <strong>{l.distractor}</strong> →{" "}
            <code style={{ background: "#f3f4f6", padding: "0 4px", borderRadius: "3px" }}>
              {l.misconceptionId}
            </code>
            {l.sectionTitle ? (
              <span style={{ color: "#6b7280" }}> &nbsp;({l.sectionTitle})</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PostValidatorWarningsSection({ warnings }: { warnings: string[] | undefined }) {
  if (!warnings || warnings.length === 0) return null;
  const buckets = bucketWarnings(warnings);
  return (
    <section style={{ marginTop: "10px" }}>
      <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: 800, color: "#111827" }}>
        Post-validator warnings
        <span
          style={{
            marginLeft: "8px",
            padding: "1px 8px",
            fontSize: "11px",
            borderRadius: "10px",
            background: "#374151",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          {warnings.length}
        </span>
      </h4>
      {Object.entries(buckets).map(([bucket, msgs]) => (
        <details key={bucket} style={{ marginBottom: "4px" }}>
          <summary
            style={{
              cursor: "pointer",
              fontSize: "11px",
              color: "#374151",
              fontWeight: 700,
            }}
          >
            {bucket} ({msgs.length})
          </summary>
          <ul style={{ margin: "4px 0 0 16px", paddingLeft: 0, fontSize: "11px", lineHeight: 1.45 }}>
            {msgs.slice(0, 25).map((m, i) => (
              <li key={i} style={{ marginBottom: "2px", color: "#52525b" }}>
                {m}
              </li>
            ))}
            {msgs.length > 25 && (
              <li style={{ color: "#6b7280", fontStyle: "italic" }}>… {msgs.length - 25} more</li>
            )}
          </ul>
        </details>
      ))}
    </section>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

export function AuditTrailPanel(props: AuditTrailPanelProps): React.ReactElement | null {
  const { worksheet, isTeacherView, defaultExpanded = false, className } = props;
  if (!isTeacherView) return null;
  const meta = worksheet.metadata;
  if (!meta) return null;

  // Skip the panel entirely when there's nothing to show. Otherwise an
  // older worksheet would render a "Why this looks like this" header
  // with no content underneath.
  const hasAnything =
    Boolean(meta.qaScore) ||
    Boolean(meta.coverageMap) ||
    Boolean(meta.aoHistogram) ||
    Boolean(meta.sendFidelityReport) ||
    (Array.isArray(meta.misconceptionLinks) && meta.misconceptionLinks.length > 0) ||
    (Array.isArray(meta.postValidatorWarnings) && meta.postValidatorWarnings.length > 0);
  if (!hasAnything) return null;

  const qaTotalNum = qaTotal(meta.qaScore);

  return (
    <details
      open={defaultExpanded}
      data-testid="audit-trail-panel"
      className={`ws-teacher-section ws-no-print-on-student ${className ?? ""}`.trim()}
      style={{
        marginTop: "12px",
        padding: "10px 14px",
        background: "#fafafa",
        border: "1.5px solid #6b7280",
        borderRadius: "6px",
        fontSize: "12px",
        color: "#1f2937",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          fontWeight: 800,
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span aria-hidden>🔍</span>
        <span>Why this worksheet looks like this</span>
        {typeof qaTotalNum === "number" && (
          <span
            style={{
              marginLeft: "auto",
              padding: "1px 8px",
              fontSize: "11px",
              borderRadius: "10px",
              background:
                meta.validationStatus === "fail"
                  ? "#7f1d1d"
                  : meta.validationStatus === "warn"
                  ? "#92400e"
                  : "#064e3b",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            QA {qaTotalNum}/100
          </span>
        )}
      </summary>

      {/* Header strip — context the teacher needs to interpret the
          numbers below. Always rendered when the panel renders. */}
      <div style={{ marginTop: "6px", fontSize: "11px", color: "#374151", lineHeight: 1.5 }}>
        Read-only audit trail. Combines every audit signal the generator
        and the post-validator chain stamped on this worksheet. Empty
        sections mean that audit didn't run for this worksheet — usually
        because the relevant feature is opt-in or the bundled taxonomy
        doesn't cover the (board, subject, year) combination.
        {meta.subject || meta.yearGroup || meta.examBoard ? (
          <>
            {" "}
            <strong>Context:</strong>{" "}
            {[meta.subject, meta.yearGroup, meta.examBoard].filter(Boolean).join(" · ")}
            {meta.sendNeed ? ` · SEND: ${meta.sendNeed}` : ""}
            {meta.generatorVersion ? ` · gen ${meta.generatorVersion}` : ""}
          </>
        ) : null}
      </div>

      <QaScoreSection qa={meta.qaScore} />
      <CoverageMapSection cm={meta.coverageMap} />
      <AoHistogramSection histogram={meta.aoHistogram} />
      <SendFidelitySection report={meta.sendFidelityReport} />
      <MisconceptionLinksSection links={meta.misconceptionLinks} />
      <PostValidatorWarningsSection warnings={meta.postValidatorWarnings} />
    </details>
  );
}

export default AuditTrailPanel;
