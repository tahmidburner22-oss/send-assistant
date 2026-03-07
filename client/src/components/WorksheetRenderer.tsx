/**
 * WorksheetRenderer — Professional, print-ready worksheet display component.
 * Matches PDF output pixel-for-pixel using CSS @media print.
 * Surpasses MagicSchool AI and Teachmate in visual quality.
 */
import { forwardRef } from "react";

export interface WorksheetSection {
  title: string;
  type: string;
  content: string;
  teacherOnly?: boolean;
  svg?: string;
  caption?: string;
}

export interface WorksheetData {
  title: string;
  subtitle?: string;
  sections: WorksheetSection[];
  metadata: {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    sendNeed?: string;
    difficulty?: string;
    examBoard?: string;
    totalMarks?: number;
    estimatedTime?: string;
    adaptations?: string[];
  };
  isAI?: boolean;
  provider?: string;
}

interface WorksheetRendererProps {
  worksheet: WorksheetData;
  viewMode: "teacher" | "student";
  textSize: number;
  overlayColor: string;
  editedSections?: Record<number, string>;
  onSectionClick?: (index: number) => void;
  editMode?: boolean;
  schoolName?: string;
  teacherName?: string;
}

// Section type → colour config
const SECTION_STYLES: Record<string, { border: string; bg: string; badge: string; badgeBg: string; icon: string; label: string }> = {
  "objective":     { border: "#0d9488", bg: "#f0fdfa", badge: "#0d9488", badgeBg: "#ccfbf1", icon: "🎯", label: "Learning Objectives" },
  "success":       { border: "#0d9488", bg: "#f0fdfa", badge: "#0d9488", badgeBg: "#ccfbf1", icon: "✅", label: "Success Criteria" },
  "vocabulary":    { border: "#7c3aed", bg: "#faf5ff", badge: "#7c3aed", badgeBg: "#ede9fe", icon: "📚", label: "Key Vocabulary" },
  "starter":       { border: "#ea580c", bg: "#fff7ed", badge: "#ea580c", badgeBg: "#fed7aa", icon: "🔥", label: "Starter Activity" },
  "example":       { border: "#4f46e5", bg: "#eef2ff", badge: "#4f46e5", badgeBg: "#e0e7ff", icon: "💡", label: "Worked Example" },
  "guided":        { border: "#2563eb", bg: "#eff6ff", badge: "#2563eb", badgeBg: "#dbeafe", icon: "🌟", label: "Foundation" },
  "independent":   { border: "#059669", bg: "#f0fdf4", badge: "#059669", badgeBg: "#d1fae5", icon: "📝", label: "Core Practice" },
  "challenge":     { border: "#9333ea", bg: "#fdf4ff", badge: "#9333ea", badgeBg: "#f3e8ff", icon: "🚀", label: "Stretch & Challenge" },
  "word-bank":     { border: "#0891b2", bg: "#ecfeff", badge: "#0891b2", badgeBg: "#cffafe", icon: "🔤", label: "Word Bank" },
  "sentence-starters": { border: "#0891b2", bg: "#ecfeff", badge: "#0891b2", badgeBg: "#cffafe", icon: "✏️", label: "Sentence Starters" },
  "self-assessment": { border: "#d97706", bg: "#fffbeb", badge: "#d97706", badgeBg: "#fef3c7", icon: "🔍", label: "Self Assessment" },
  "diagram":       { border: "#6366f1", bg: "#eef2ff", badge: "#6366f1", badgeBg: "#e0e7ff", icon: "📊", label: "Diagram" },
  "answers":       { border: "#16a34a", bg: "#f0fdf4", badge: "#16a34a", badgeBg: "#dcfce7", icon: "✓", label: "Answers" },
  "mark-scheme":   { border: "#ca8a04", bg: "#fefce8", badge: "#ca8a04", badgeBg: "#fef9c3", icon: "📋", label: "Mark Scheme" },
  "teacher-notes": { border: "#dc2626", bg: "#fef2f2", badge: "#dc2626", badgeBg: "#fee2e2", icon: "👩‍🏫", label: "Teacher Notes" },
  "send-support":  { border: "#7c3aed", bg: "#faf5ff", badge: "#7c3aed", badgeBg: "#ede9fe", icon: "♿", label: "SEND Support" },
  "default":       { border: "#6b7280", bg: "#f9fafb", badge: "#6b7280", badgeBg: "#f3f4f6", icon: "📄", label: "" },
};

function getSectionStyle(type: string) {
  return SECTION_STYLES[type] || SECTION_STYLES["default"];
}

function formatContent(content: string, textSize: number): React.ReactNode {
  if (!content) return null;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let listItems: string[] = [];

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return;
    const rows = tableRows.map(r => r.split("|").map(c => c.trim()).filter(Boolean));
    const header = rows[0];
    const body = rows.slice(1);
    elements.push(
      <div key={key} className="ws-table-wrap" style={{ overflowX: "auto", margin: "8px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: `${textSize - 1}px` }}>
          <thead>
            <tr>
              {header.map((h, hi) => (
                <th key={hi} style={{ padding: "8px 12px", background: "#7c3aed", color: "white", textAlign: "left", fontWeight: 600, border: "1px solid #ddd" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f9fafb" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "7px 12px", border: "1px solid #e5e7eb", fontSize: `${textSize - 1}px` }}>
                    <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key} style={{ margin: "6px 0 6px 20px", padding: 0 }}>
        {listItems.map((item, ii) => (
          <li key={ii} style={{ marginBottom: "4px", fontSize: `${textSize}px`, lineHeight: 1.6 }}>
            <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Table row
    if (trimmed.includes("|") && !trimmed.startsWith("Hint:") && !trimmed.startsWith("Step")) {
      if (listItems.length) flushList(`list-${idx}`);
      inTable = true;
      if (!trimmed.match(/^[\|\s\-]+$/)) { // skip separator rows
        tableRows.push(trimmed);
      }
      return;
    }
    if (inTable) flushTable(`table-${idx}`);

    // Empty line
    if (!trimmed) {
      if (listItems.length) flushList(`list-${idx}`);
      elements.push(<div key={`sp-${idx}`} style={{ height: "6px" }} />);
      return;
    }

    // Bullet list
    if (trimmed.startsWith("• ") || trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const text = trimmed.replace(/^[•\*\-]\s+/, "");
      listItems.push(text);
      return;
    }
    if (listItems.length) flushList(`list-${idx}`);

    // Numbered list
    const numberedMatch = trimmed.match(/^(\d+[a-z]?[.)]\s+)(.+)$/);
    if (numberedMatch) {
      elements.push(
        <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: `${textSize}px`, lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600, minWidth: "24px", color: "#374151" }}>{numberedMatch[1]}</span>
          <span dangerouslySetInnerHTML={{ __html: numberedMatch[2].replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
        </div>
      );
      return;
    }

    // Hint line
    if (trimmed.startsWith("Hint:") || trimmed.startsWith("💡")) {
      elements.push(
        <div key={idx} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "6px 10px", margin: "6px 0", fontSize: `${textSize - 1}px`, color: "#1d4ed8" }}>
          💡 <span dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
        </div>
      );
      return;
    }

    // Step line
    if (trimmed.match(/^Step \d+:/)) {
      elements.push(
        <div key={idx} style={{ fontWeight: 700, color: "#059669", marginTop: "8px", marginBottom: "2px", fontSize: `${textSize}px` }}>
          {trimmed}
        </div>
      );
      return;
    }

    // Mark allocation
    const markMatch = trimmed.match(/^(.+?)(\[\d+ marks?\])(.*)$/i);
    if (markMatch) {
      elements.push(
        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", fontSize: `${textSize}px`, lineHeight: 1.6 }}>
          <span dangerouslySetInnerHTML={{ __html: markMatch[1].replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
          <span style={{ background: "#374151", color: "white", fontSize: `${textSize - 3}px`, padding: "1px 6px", borderRadius: "4px", whiteSpace: "nowrap", marginLeft: "8px", fontWeight: 700 }}>{markMatch[2]}</span>
        </div>
      );
      return;
    }

    // Answer line (underscores)
    if (trimmed.match(/^_{5,}$/)) {
      elements.push(
        <div key={idx} style={{ borderBottom: "1px solid #9ca3af", margin: "8px 0", height: "24px" }} />
      );
      return;
    }

    // Bold heading (standalone **text**)
    if (trimmed.match(/^\*\*.+\*\*$/)) {
      elements.push(
        <div key={idx} style={{ fontWeight: 700, fontSize: `${textSize + 1}px`, marginTop: "8px", marginBottom: "4px", color: "#111827" }}>
          {trimmed.replace(/\*\*/g, "")}
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={idx} style={{ margin: "0 0 6px 0", fontSize: `${textSize}px`, lineHeight: 1.7, color: "#1f2937" }}>
        <span dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>") }} />
      </p>
    );
  });

  if (inTable) flushTable("table-end");
  if (listItems.length) flushList("list-end");

  return <>{elements}</>;
}

function VocabSection({ content, textSize }: { content: string; textSize: number }) {
  const lines = content.split("\n").filter(l => l.trim() && !l.trim().toUpperCase().startsWith("TERM"));
  const entries = lines.map(l => {
    const parts = l.split("|");
    if (parts.length >= 2) return { term: parts[0].trim(), def: parts.slice(1).join("|").trim() };
    const colonIdx = l.indexOf(":");
    if (colonIdx > 0) return { term: l.slice(0, colonIdx).trim(), def: l.slice(colonIdx + 1).trim() };
    return null;
  }).filter(Boolean) as { term: string; def: string }[];

  if (entries.length === 0) {
    return <div style={{ fontSize: `${textSize}px`, lineHeight: 1.7 }}>{content}</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px" }}>
      {entries.map((e, i) => (
        <div key={i} style={{ background: "white", border: "1px solid #e9d5ff", borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ fontWeight: 700, color: "#7c3aed", fontSize: `${textSize}px` }}>{e.term}</div>
          <div style={{ color: "#374151", fontSize: `${textSize - 1}px`, lineHeight: 1.5 }}>{e.def}</div>
        </div>
      ))}
    </div>
  );
}

function SelfAssessmentSection({ content, textSize }: { content: string; textSize: number }) {
  const lines = content.split("\n").filter(l => l.trim());
  return (
    <div>
      {lines.map((line, i) => {
        const clean = line.replace(/^[•\-\*]\s*/, "").replace(/^I can\s*/i, "").trim();
        if (!clean) return null;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: i < lines.length - 1 ? "1px solid #e5e7eb" : "none" }}>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              {["🔴", "🟡", "🟢"].map((emoji, ci) => (
                <div key={ci} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                  {emoji}
                </div>
              ))}
            </div>
            <span style={{ fontSize: `${textSize}px`, color: "#374151" }}>I can {clean}</span>
          </div>
        );
      })}
      <div style={{ marginTop: "8px", fontSize: `${textSize - 2}px`, color: "#6b7280", fontStyle: "italic" }}>
        🔴 Not yet &nbsp;|&nbsp; 🟡 Getting there &nbsp;|&nbsp; 🟢 I've got it!
      </div>
    </div>
  );
}

function WordBankSection({ content, textSize }: { content: string; textSize: number }) {
  const words = content.split(/[\n,|]/).map(w => w.trim()).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {words.map((word, i) => (
        <span key={i} style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "20px", fontSize: `${textSize - 1}px`, fontWeight: 500, border: "1px solid #bfdbfe" }}>
          {word}
        </span>
      ))}
    </div>
  );
}

function SentenceStartersSection({ content, textSize }: { content: string; textSize: number }) {
  const starters = content.split("\n").filter(l => l.trim()).map(l => l.replace(/^[•\-\*\d.)\s]+/, "").trim());
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px" }}>
      {starters.map((s, i) => (
        <div key={i} style={{ background: "#ecfeff", border: "1px dashed #06b6d4", borderRadius: "6px", padding: "6px 10px", fontSize: `${textSize - 1}px`, color: "#0e7490", fontStyle: "italic" }}>
          "{s}..."
        </div>
      ))}
    </div>
  );
}

const WorksheetRenderer = forwardRef<HTMLDivElement, WorksheetRendererProps>(({
  worksheet,
  viewMode,
  textSize,
  overlayColor,
  editedSections = {},
  onSectionClick,
  editMode = false,
  schoolName,
  teacherName,
}, ref) => {
  const isTeacherView = viewMode === "teacher";

  return (
    <div
      ref={ref}
      className="worksheet-print-root"
      style={{ backgroundColor: overlayColor || "white", fontFamily: "'Segoe UI', Arial, sans-serif" }}
    >
      {/* ── Professional Header ── */}
      <div className="ws-header" style={{
        borderBottom: "3px solid #7c3aed",
        paddingBottom: "16px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
      }}>
        <div style={{ flex: 1 }}>
          {/* School branding bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: "16px" }}>A</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#7c3aed" }}>{schoolName || "Adaptly"}</div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>SEND-Informed Learning Resource</div>
            </div>
          </div>
          <h1 style={{ fontSize: `${textSize + 10}px`, fontWeight: 800, color: "#111827", margin: "0 0 4px 0", lineHeight: 1.2 }}>
            {worksheet.title}
          </h1>
          {worksheet.subtitle && (
            <p style={{ fontSize: `${textSize - 1}px`, color: "#6b7280", margin: "0 0 8px 0" }}>{worksheet.subtitle}</p>
          )}
          {/* Metadata badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {worksheet.metadata.yearGroup && (
              <span style={{ background: "#ede9fe", color: "#7c3aed", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                {worksheet.metadata.yearGroup}
              </span>
            )}
            {worksheet.metadata.subject && (
              <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                {worksheet.metadata.subject}
              </span>
            )}
            {worksheet.metadata.examBoard && worksheet.metadata.examBoard !== "General" && (
              <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                {worksheet.metadata.examBoard}
              </span>
            )}
            {worksheet.metadata.sendNeed && (
              <span style={{ background: "#fce7f3", color: "#9d174d", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                ♿ {worksheet.metadata.sendNeed}
              </span>
            )}
            {worksheet.metadata.estimatedTime && (
              <span style={{ background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                ⏱ {worksheet.metadata.estimatedTime}
              </span>
            )}
            {worksheet.metadata.totalMarks && (
              <span style={{ background: "#fff7ed", color: "#9a3412", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                ★ {worksheet.metadata.totalMarks} marks
              </span>
            )}
            {worksheet.isAI && (
              <span style={{ background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                ✨ AI Generated
              </span>
            )}
          </div>
        </div>
        {/* Name/Date/Class fields */}
        <div style={{ flexShrink: 0, minWidth: "200px" }}>
          {[
            { label: "Name", value: "" },
            { label: "Date", value: new Date().toLocaleDateString("en-GB") },
            { label: "Class", value: "" },
            ...(teacherName ? [{ label: "Teacher", value: teacherName }] : []),
          ].map((field, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", minWidth: "50px" }}>{field.label}:</span>
              <div style={{ flex: 1, borderBottom: "1.5px solid #9ca3af", minWidth: "120px", height: "18px", display: "flex", alignItems: "flex-end" }}>
                <span style={{ fontSize: "11px", color: "#374151", paddingBottom: "1px" }}>{field.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sections ── */}
      {worksheet.sections.map((section, i) => {
        // Hide teacher sections in student view
        if (!isTeacherView && (section.teacherOnly || section.type === "answers" || section.type === "mark-scheme" || section.type === "teacher-notes")) {
          return null;
        }

        const content = editedSections[i] !== undefined ? editedSections[i] : section.content;
        const style = getSectionStyle(section.type);
        const isTeacherSection = section.teacherOnly || section.type === "teacher-notes" || section.type === "mark-scheme";

        return (
          <div
            key={i}
            className={`ws-section ws-section-${section.type}${isTeacherSection ? " ws-teacher-section" : ""}`}
            onClick={() => editMode && onSectionClick?.(i)}
            style={{
              marginBottom: "16px",
              borderRadius: "8px",
              border: `1px solid ${style.border}30`,
              borderLeft: `4px solid ${style.border}`,
              background: style.bg,
              overflow: "hidden",
              cursor: editMode ? "pointer" : "default",
              outline: editMode && editedSections[i] !== undefined ? `2px solid ${style.border}` : "none",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            {/* Section header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 14px",
              borderBottom: `1px solid ${style.border}20`,
              background: `${style.border}10`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>{style.icon}</span>
                <span style={{ fontWeight: 700, fontSize: `${textSize + 1}px`, color: style.border }}>
                  {section.title}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {isTeacherSection && (
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 700 }}>
                    👩‍🏫 TEACHER ONLY
                  </span>
                )}
                {section.type === "guided" && (
                  <span style={{ background: style.badgeBg, color: style.badge, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    ⭐ Foundation
                  </span>
                )}
                {section.type === "independent" && (
                  <span style={{ background: style.badgeBg, color: style.badge, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    📝 Core
                  </span>
                )}
                {section.type === "challenge" && (
                  <span style={{ background: style.badgeBg, color: style.badge, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    🚀 Extension
                  </span>
                )}
              </div>
            </div>

            {/* Section content */}
            <div style={{ padding: "12px 14px" }}>
              {section.type === "diagram" && section.svg ? (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{ display: "inline-block", width: "100%", maxWidth: "560px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "white" }}
                    dangerouslySetInnerHTML={{ __html: section.svg }}
                  />
                  {section.caption && (
                    <p style={{ fontSize: `${textSize - 2}px`, color: "#6b7280", marginTop: "6px", fontStyle: "italic" }}>
                      Figure: {section.caption}
                    </p>
                  )}
                </div>
              ) : section.type === "vocabulary" ? (
                <VocabSection content={content} textSize={textSize} />
              ) : section.type === "self-assessment" ? (
                <SelfAssessmentSection content={content} textSize={textSize} />
              ) : section.type === "word-bank" ? (
                <WordBankSection content={content} textSize={textSize} />
              ) : section.type === "sentence-starters" ? (
                <SentenceStartersSection content={content} textSize={textSize} />
              ) : (
                <div>{formatContent(content, textSize)}</div>
              )}

              {/* Answer lines for practice sections */}
              {!isTeacherSection && (section.type === "independent" || section.type === "guided") && (
                <div style={{ marginTop: "12px", borderTop: "1px dashed #e5e7eb", paddingTop: "10px" }}>
                  <div style={{ fontSize: `${textSize - 2}px`, color: "#9ca3af", marginBottom: "6px" }}>Your answers:</div>
                  {[1, 2, 3].map(n => (
                    <div key={n} style={{ borderBottom: "1px solid #d1d5db", height: "28px", marginBottom: "6px" }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Footer ── */}
      <div className="ws-footer" style={{
        marginTop: "24px",
        paddingTop: "12px",
        borderTop: "2px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "10px",
        color: "#9ca3af",
      }}>
        <span>Generated by Adaptly — SEND-Informed Learning Resources</span>
        <span>{worksheet.metadata.subject} | {worksheet.metadata.yearGroup} | {new Date().toLocaleDateString("en-GB")}</span>
        <span>adaptly.app</span>
      </div>
    </div>
  );
});

WorksheetRenderer.displayName = "WorksheetRenderer";
export default WorksheetRenderer;
