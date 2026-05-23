/**
 * KnowledgeOrganiserPanel.tsx — PR-10 / PD10
 *
 * Collapsible teacher-facing panel that derives and displays a
 * Knowledge Organiser from worksheet content.
 * Uses native <details> for collapse (same pattern as AuditTrailPanel.tsx).
 */
import React from "react";
import {
  deriveKnowledgeOrganiserFromWorksheet,
  knowledgeOrganiserHtml,
  type WorksheetInput,
} from "@/lib/knowledgeOrganiserBuilder";

interface Props {
  worksheet: WorksheetInput;
}

export function KnowledgeOrganiserPanel({ worksheet }: Props): React.ReactElement | null {
  const ko = deriveKnowledgeOrganiserFromWorksheet(worksheet);

  // Skip if nothing was extracted
  if (ko.vocabulary.length === 0 && ko.keyFacts.length === 0 && ko.stickyQuestions.length === 0) {
    return null;
  }

  const handlePrint = () => {
    const html = knowledgeOrganiserHtml(ko);
    const win = window.open("", "_blank", "width=900,height=600");
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><title>Knowledge Organiser</title></head><body>${html}</body></html>`);
      win.document.close();
    }
  };

  return (
    <details
      className="ws-no-print-on-student"
      style={{
        marginTop: "12px",
        padding: "10px 14px",
        background: "#f0fdf4",
        border: "1.5px solid #15803d",
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
        <span aria-hidden>📋</span>
        <span>Knowledge Organiser</span>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); handlePrint(); }}
          style={{
            marginLeft: "auto",
            padding: "2px 10px",
            fontSize: "11px",
            borderRadius: "4px",
            border: "1px solid #15803d",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Print KO
        </button>
      </summary>

      <div style={{ marginTop: "8px" }}>
        {ko.vocabulary.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ fontSize: "11px", color: "#166534" }}>Vocabulary</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "11px", lineHeight: 1.5 }}>
              {ko.vocabulary.map((v, i) => (
                <li key={i}><strong>{v.term}</strong> &mdash; {v.definition}</li>
              ))}
            </ul>
          </div>
        )}

        {ko.keyFacts.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ fontSize: "11px", color: "#1e40af" }}>Key Facts</strong>
            <ol style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "11px", lineHeight: 1.5 }}>
              {ko.keyFacts.map((f, i) => <li key={i}>{f}</li>)}
            </ol>
          </div>
        )}

        {ko.stickyQuestions.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ fontSize: "11px", color: "#9a3412" }}>Sticky Questions</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "11px", lineHeight: 1.5 }}>
              {ko.stickyQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
        )}

        {ko.diagramHint && (
          <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#6b7280" }}>
            <strong>Diagram slot:</strong> {ko.diagramHint}
          </p>
        )}
      </div>
    </details>
  );
}

export default KnowledgeOrganiserPanel;
