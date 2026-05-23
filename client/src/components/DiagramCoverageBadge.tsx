/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * DiagramCoverageBadge.tsx — PR-19 carry-over for audit item #22 (UI half).
 *
 * Teacher-facing badge that shows whether the worksheet carries a
 * diagram for every section that should have one, based on
 * `metadata.diagramCoverage` stamped by PR-23's pipeline. Read-only,
 * additive, schema-free.
 *
 * Rendering rules:
 *   - Hidden when `isTeacherView === false` (pupils never see it).
 *   - Hidden when `metadata.diagramCoverage` is absent (older
 *     worksheets keep rendering unchanged).
 *   - Solid green badge when 100% coverage.
 *   - Amber badge when ≥ 50% but < 100%.
 *   - Red badge when < 50% — and the badge expands to list the
 *     specific missing sections.
 */

import React from "react";

export interface DiagramCoverageMetadata {
  /** Number of sections that ought to carry a diagram. */
  expected: number;
  /** Number of sections that actually carry a diagram. */
  present: number;
  /** Sections that should have a diagram but don't. */
  missingSections?: Array<{ index: number; title?: string; reason?: string }>;
  /** ISO timestamp the coverage check ran. */
  computedAt?: string;
}

export interface DiagramCoverageBadgeProps {
  diagramCoverage?: DiagramCoverageMetadata;
  isTeacherView: boolean;
  className?: string;
}

function pickTone(ratio: number): { bg: string; fg: string; label: string } {
  if (ratio >= 1) return { bg: "#dcfce7", fg: "#15803d", label: "✓ Full coverage" };
  if (ratio >= 0.5) return { bg: "#fef3c7", fg: "#92400e", label: "⚠ Partial" };
  return { bg: "#fee2e2", fg: "#7f1d1d", label: "✗ Gap" };
}

export function DiagramCoverageBadge(props: DiagramCoverageBadgeProps): React.ReactElement | null {
  const { diagramCoverage, isTeacherView, className } = props;
  if (!isTeacherView || !diagramCoverage) return null;
  const expected = Math.max(0, diagramCoverage.expected || 0);
  const present = Math.max(0, Math.min(expected, diagramCoverage.present || 0));
  if (expected === 0) return null;
  const ratio = present / expected;
  const tone = pickTone(ratio);
  const missing = diagramCoverage.missingSections || [];

  return (
    <details
      data-testid="diagram-coverage-badge"
      className={`ws-teacher-section ws-no-print-on-student ${className ?? ""}`.trim()}
      style={{
        display: "inline-block",
        marginRight: 6,
        padding: "2px 8px",
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.fg}`,
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <summary style={{ cursor: missing.length > 0 ? "pointer" : "default" }}>
        Diagram coverage: {present}/{expected} · {tone.label}
      </summary>
      {missing.length > 0 && (
        <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: 11, fontWeight: 600 }}>
          {missing.slice(0, 8).map((m, i) => (
            <li key={i} style={{ marginBottom: 2 }}>
              {m.title ? `Q${m.index + 1}: ${m.title}` : `Q${m.index + 1}`}
              {m.reason ? <span style={{ color: "#52525b", fontWeight: 400 }}> — {m.reason}</span> : null}
            </li>
          ))}
          {missing.length > 8 && (
            <li style={{ color: "#6b7280", fontWeight: 400, fontStyle: "italic" }}>… {missing.length - 8} more</li>
          )}
        </ul>
      )}
    </details>
  );
}

export default DiagramCoverageBadge;
