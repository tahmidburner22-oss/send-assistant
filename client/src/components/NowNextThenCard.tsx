/**
 * NowNextThenCard.tsx — PR-10 / PD11
 *
 * Collapsible teacher-facing panel that shows the Now/Next/Then
 * lesson flow card derived from worksheet metadata.
 * Uses native <details> for collapse (same pattern as AuditTrailPanel.tsx).
 */
import React from "react";
import {
  buildNowNextThenForWorksheet,
  nowNextThenHtml,
  type WorksheetInput,
} from "@/lib/nowNextThenBuilder";

interface Props {
  worksheet: WorksheetInput;
}

export function NowNextThenCard({ worksheet }: Props): React.ReactElement | null {
  const strip = buildNowNextThenForWorksheet(worksheet);

  const handlePrint = () => {
    const html = nowNextThenHtml(strip);
    const win = window.open("", "_blank", "width=600,height=400");
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><title>Now / Next / Then</title></head><body>${html}</body></html>`);
      win.document.close();
    }
  };

  const slotStyle = (color: string): React.CSSProperties => ({
    flex: 1,
    border: `1.5px solid ${color}`,
    borderRadius: "5px",
    padding: "6px 8px",
    textAlign: "center",
  });

  return (
    <details
      className="ws-no-print-on-student"
      style={{
        marginTop: "12px",
        padding: "10px 14px",
        background: "#fffbeb",
        border: "1.5px solid #b45309",
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
        <span aria-hidden>⏱️</span>
        <span>Now / Next / Then</span>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); handlePrint(); }}
          style={{
            marginLeft: "auto",
            padding: "2px 10px",
            fontSize: "11px",
            borderRadius: "4px",
            border: "1px solid #b45309",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Print Card
        </button>
      </summary>

      <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
        <div style={slotStyle("#15803d")}>
          <div style={{ fontWeight: 700, fontSize: "10px", color: "#15803d" }}>{strip.now.label}</div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#15803d" }}>{strip.now.minutes} min</div>
          {strip.now.detail && <div style={{ fontSize: "9px", color: "#4b5563", marginTop: "2px" }}>{strip.now.detail}</div>}
        </div>
        <div style={slotStyle("#1d4ed8")}>
          <div style={{ fontWeight: 700, fontSize: "10px", color: "#1d4ed8" }}>{strip.next.label}</div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#1d4ed8" }}>{strip.next.minutes} min</div>
          {strip.next.detail && <div style={{ fontSize: "9px", color: "#4b5563", marginTop: "2px" }}>{strip.next.detail}</div>}
        </div>
        <div style={slotStyle("#b45309")}>
          <div style={{ fontWeight: 700, fontSize: "10px", color: "#b45309" }}>{strip.then.label}</div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#b45309" }}>{strip.then.minutes} min</div>
          {strip.then.detail && <div style={{ fontSize: "9px", color: "#4b5563", marginTop: "2px" }}>{strip.then.detail}</div>}
        </div>
      </div>
    </details>
  );
}

export default NowNextThenCard;
