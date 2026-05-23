/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * client/src/pages/admin/telemetry.tsx — PR-27.
 *
 * Admin telemetry dashboard. Surfaces three aggregations from
 * `client/src/lib/telemetryAggregators.ts`:
 *
 *   1. Validator-firing histogram (#70)
 *   2. Per-topic regeneration heat-map (#71)
 *   3. Token + cost roll-up (#42)
 *
 * The page is purely presentational — it accepts pre-aggregated
 * summaries via props so it stays unit-testable without API mocks.
 * A parent container (added in a follow-up PR) will hydrate the
 * props from the server-side telemetry log.
 */

import React from "react";
import type {
  ValidatorFiringHistogram,
  RegenerationHeatmap,
  TokenCostRollup,
} from "../../lib/telemetryAggregators";

export interface AdminTelemetryPageProps {
  validatorFirings: ValidatorFiringHistogram;
  regenerationHeatmap: RegenerationHeatmap;
  tokenCostRollup: TokenCostRollup;
}

const SEVERITY_TONE: Record<"p0" | "p1" | "p2", string> = {
  p0: "#7f1d1d",
  p1: "#92400e",
  p2: "#374151",
};

function Section(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 24,
        padding: 16,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>{props.title}</h2>
      {props.subtitle && (
        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>{props.subtitle}</p>
      )}
      {props.children}
    </section>
  );
}

export function AdminTelemetryPage(props: AdminTelemetryPageProps): React.ReactElement {
  const { validatorFirings, regenerationHeatmap, tokenCostRollup } = props;

  return (
    <main
      data-testid="admin-telemetry-page"
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "DM Sans, system-ui, sans-serif",
        color: "#1f2937",
        background: "#f9fafb",
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Telemetry</h1>
        <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
          Validator firings, regeneration heat-map and token / cost roll-up.
        </p>
      </header>

      <Section
        title="Validator firings"
        subtitle={`${validatorFirings.totalFirings} firings · p0 ${validatorFirings.severityTotals.p0} · p1 ${validatorFirings.severityTotals.p1} · p2 ${validatorFirings.severityTotals.p2}`}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Validator</th>
              <th style={{ textAlign: "right", padding: "6px 8px" }}>Count</th>
              <th style={{ textAlign: "right", padding: "6px 8px" }}>%</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Severity</th>
            </tr>
          </thead>
          <tbody>
            {validatorFirings.rows.slice(0, 30).map((r) => (
              <tr key={r.validatorName} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{r.validatorName}</td>
                <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700 }}>{r.count}</td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>{(r.pctOfTotal * 100).toFixed(1)}%</td>
                <td
                  style={{
                    padding: "4px 8px",
                    color: r.severity ? SEVERITY_TONE[r.severity] : "#9ca3af",
                    fontWeight: 700,
                  }}
                >
                  {r.severity ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title="Regeneration heat-map"
        subtitle={`${regenerationHeatmap.totalRegenerations} regenerations across ${regenerationHeatmap.rows.length} topics`}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Topic</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Subject</th>
              <th style={{ textAlign: "right", padding: "6px 8px" }}>Count</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Top section</th>
            </tr>
          </thead>
          <tbody>
            {regenerationHeatmap.rows.slice(0, 30).map((r) => (
              <tr key={r.topic} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "4px 8px" }}>{r.topic}</td>
                <td style={{ padding: "4px 8px", color: "#52525b" }}>{r.subject ?? "—"}</td>
                <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700 }}>{r.count}</td>
                <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "#52525b" }}>{r.topSectionType ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title="Token + cost roll-up"
        subtitle={`${tokenCostRollup.totalCalls} calls · ${(tokenCostRollup.totalPromptTokens + tokenCostRollup.totalCompletionTokens).toLocaleString()} tokens · $${tokenCostRollup.totalEstimatedUsd.toFixed(2)}`}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Day</th>
              <th style={{ textAlign: "right", padding: "6px 8px" }}>Calls</th>
              <th style={{ textAlign: "right", padding: "6px 8px" }}>Tokens</th>
              <th style={{ textAlign: "right", padding: "6px 8px" }}>USD</th>
            </tr>
          </thead>
          <tbody>
            {tokenCostRollup.byDay.map((d) => (
              <tr key={d.day} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{d.day}</td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>{d.callCount}</td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>{d.totalTokens.toLocaleString()}</td>
                <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700 }}>${d.estimatedUsd.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 6 }}>By provider</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Provider</th>
              <th style={{ textAlign: "right", padding: "6px 8px" }}>Calls</th>
              <th style={{ textAlign: "right", padding: "6px 8px" }}>USD</th>
            </tr>
          </thead>
          <tbody>
            {tokenCostRollup.byProvider.map((p) => (
              <tr key={p.provider} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{p.provider}</td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>{p.calls}</td>
                <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700 }}>${p.estimatedUsd.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </main>
  );
}

export default AdminTelemetryPage;
