/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * ClassPackVisualDiff.tsx — PR-19 carry-over for audit item #31.
 *
 * Per-pupil section visual diff for Class Packs. The Class Pack
 * generator produces N variants of a single base worksheet (one per
 * pupil) by tweaking SEND adaptations, reading age, and
 * misconception-targeting. Teachers want a single panel that shows,
 * at a glance, which sections changed for which pupil so they can
 * spot drift / over-fitting / accidental homogenisation.
 *
 * The AuditTrailPanel scaffold (PR-6) imports this component as
 * `<ClassPackVisualDiff packs={…} />`. This file is the concrete
 * implementation. Read-only, additive, no schema changes — every
 * input is read from data the Class-Pack generator already stamps.
 *
 * Design choices:
 *
 *   - djb2 content hashing, stable across renders, matches the hash
 *     used in `worksheetVersionDiff.ts` (PR-11) so the two surfaces
 *     are interoperable.
 *
 *   - Section diff at title level: cells are
 *       ✓  (identical content),
 *       ~  (same title, different content),
 *       +  (added in this pupil's variant),
 *       −  (removed in this pupil's variant).
 *
 *   - Pure component — no internal state, no effects. The parent
 *     decides when to remount. Default-collapsed via a native
 *     <details>.
 */

import React from "react";
import {
  diffPupilSections,
  hashSectionContent,
  type ClassPackPupilSection,
  type ClassPackPupilEntry,
  type DiffCell,
} from "../lib/classPackVisualDiff";

// Re-export the pure helpers so existing imports keep working.
export { diffPupilSections, hashSectionContent };
export type { ClassPackPupilSection, ClassPackPupilEntry };

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClassPackVisualDiffProps {
  /** The base worksheet sections — every pupil variant is diffed against
   *  this. When omitted, the FIRST entry in `packs` is used as the base. */
  baseSections?: ClassPackPupilSection[];
  packs: ClassPackPupilEntry[];
  /** Optional override — defaults to `false` (collapsed). */
  defaultExpanded?: boolean;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const STATUS_GLYPH: Record<DiffCell["status"], string> = {
  same: "✓",
  changed: "~",
  added: "+",
  removed: "−",
};

const STATUS_COLOUR: Record<DiffCell["status"], string> = {
  same: "#9ca3af",
  changed: "#b45309",
  added: "#15803d",
  removed: "#b91c1c",
};

export function ClassPackVisualDiff(props: ClassPackVisualDiffProps): React.ReactElement | null {
  const { packs, defaultExpanded = false, className } = props;
  if (!Array.isArray(packs) || packs.length === 0) return null;

  const base = props.baseSections ?? packs[0]?.sections ?? [];
  if (!Array.isArray(base) || base.length === 0) return null;

  // Pre-compute every pupil's diff so the table can render in one pass.
  const pupilDiffs = packs.map((p) => ({
    pupilId: p.pupilId,
    pupilName: p.pupilName,
    rows: diffPupilSections(base, p.sections || []),
  }));

  // Build the ordered union of section titles across every pupil so
  // the table has a stable column-or-row axis.
  const titleOrder: string[] = [];
  for (const d of pupilDiffs) {
    for (const r of d.rows) {
      if (!titleOrder.includes(r.title)) titleOrder.push(r.title);
    }
  }

  return (
    <details
      open={defaultExpanded}
      data-testid="class-pack-visual-diff"
      className={`ws-teacher-section ws-no-print-on-student ${className ?? ""}`.trim()}
      style={{
        marginTop: "10px",
        padding: "8px 12px",
        background: "#fffbeb",
        border: "1.5px solid #fbbf24",
        borderRadius: "6px",
        fontSize: "12px",
        color: "#1f2937",
      }}
    >
      <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: "12px" }}>
        Class Pack — per-pupil section diff <span style={{ color: "#6b7280", fontWeight: 600 }}>({pupilDiffs.length} pupils)</span>
      </summary>
      <div style={{ marginTop: "8px", overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr>
              <th style={{ padding: "4px 8px", textAlign: "left", color: "#374151", fontWeight: 700, borderBottom: "1px solid #e5e7eb" }}>
                Pupil
              </th>
              {titleOrder.map((t) => (
                <th
                  key={t}
                  style={{
                    padding: "4px 8px",
                    textAlign: "center",
                    color: "#374151",
                    fontWeight: 700,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pupilDiffs.map((d) => (
              <tr key={d.pupilId}>
                <td style={{ padding: "4px 8px", color: "#1f2937", fontWeight: 600 }}>{d.pupilName}</td>
                {titleOrder.map((t) => {
                  const row = d.rows.find((r) => r.title === t);
                  const cell = row?.cell ?? { status: "removed" as const };
                  return (
                    <td
                      key={t}
                      title={cell.hashPreview ? `${cell.status} · ${cell.hashPreview}` : cell.status}
                      style={{
                        padding: "4px 8px",
                        textAlign: "center",
                        color: STATUS_COLOUR[cell.status],
                        fontWeight: 700,
                      }}
                    >
                      {STATUS_GLYPH[cell.status]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: "6px", fontSize: "10px", color: "#52525b" }}>
        ✓ identical · ~ changed · + added · − removed
      </div>
    </details>
  );
}

export default ClassPackVisualDiff;
