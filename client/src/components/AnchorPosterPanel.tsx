/**
 * AnchorPosterPanel.tsx — PR-10 / PD11
 *
 * Collapsible teacher-facing panel that derives and displays an
 * Anchor Poster from worksheet content.
 * Uses native <details> for collapse (same pattern as AuditTrailPanel.tsx).
 */
import React from "react";
import {
  buildAnchorPoster,
  anchorPosterHtml,
  type WorksheetInput,
} from "@/lib/anchorPosterBuilder";

interface Props {
  worksheet: WorksheetInput;
}

export function AnchorPosterPanel({ worksheet }: Props): React.ReactElement | null {
  const poster = buildAnchorPoster(worksheet);

  // Skip if nothing meaningful was extracted
  if (poster.conceptMap.length === 0 && poster.vocabRing.length === 0) {
    return null;
  }

  const handlePrint = () => {
    const html = anchorPosterHtml(poster);
    const win = window.open("", "_blank", "width=1100,height=700");
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><title>Anchor Poster</title></head><body>${html}</body></html>`);
      win.document.close();
    }
  };

  return (
    <details
      className="ws-no-print-on-student"
      style={{
        marginTop: "12px",
        padding: "10px 14px",
        background: "#eff6ff",
        border: "1.5px solid #1d4ed8",
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
        <span aria-hidden>🖼️</span>
        <span>Anchor Poster</span>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); handlePrint(); }}
          style={{
            marginLeft: "auto",
            padding: "2px 10px",
            fontSize: "11px",
            borderRadius: "4px",
            border: "1px solid #1d4ed8",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Print Poster
        </button>
      </summary>

      <div style={{ marginTop: "8px" }}>
        <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 700, color: "#1e40af" }}>
          {poster.titleBlock}
        </p>

        {poster.conceptMap.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ fontSize: "11px", color: "#1e40af" }}>Key Concepts</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
              {poster.conceptMap.map((c, i) => (
                <span key={i} style={{ padding: "2px 8px", border: "1px solid #1d4ed8", borderRadius: "4px", fontSize: "10px", background: "#dbeafe" }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {poster.vocabRing.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ fontSize: "11px", color: "#15803d" }}>Vocabulary Ring</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
              {poster.vocabRing.map((v, i) => (
                <span key={i} style={{ padding: "2px 8px", border: "1px solid #15803d", borderRadius: "12px", fontSize: "10px", background: "#dcfce7" }}>{v}</span>
              ))}
            </div>
          </div>
        )}

        {poster.visualSlots.length > 0 && (
          <div>
            <strong style={{ fontSize: "11px", color: "#6b7280" }}>Visual Slots</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "10px", color: "#6b7280" }}>
              {poster.visualSlots.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

export default AnchorPosterPanel;
