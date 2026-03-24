/**
 * WorksheetRenderer.tsx
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary — unauthorised copying, modification, or distribution is strictly prohibited.
 *
 * PDF-matching worksheet renderer.
 * Visual grammar sourced from ws_primitives.py (ReportLab spec):
 *   NAVY  = #1B3A6B  (header bar, section badges, rules)
 *   TEAL  = #2A7F7F  (accent, question number badges)
 *   MID   = #444444  (body text)
 *   LIGHT = #888888  (secondary text, prompts)
 *   SOFT  = #F0F4F8  (section background)
 *   RULE  = #CCCCCC  (horizontal rules, answer lines)
 *
 * Layout families rendered:
 *   true_false | mcq_2col | gap_fill_inline | label_diagram |
 *   diagram_subquestions | table_complete | draw_box |
 *   short_answer | extended_answer | matching | ordering
 */

import React, { forwardRef } from "react";
import { getSendFormatting } from "@/lib/send-data";
import { extractDiagramSpec, stripDiagramMarker } from "@/lib/ai";
import SVGDiagram from "@/components/SVGDiagram";
import katex from "katex";
import "katex/dist/katex.min.css";

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE (matches ws_primitives.py exactly)
// ─────────────────────────────────────────────────────────────────────────────
const NAVY  = "#1B3A6B";
const TEAL  = "#2A7F7F";
const MID   = "#444444";
const LIGHT = "#888888";
const SOFT  = "#F0F4F8";
const RULE  = "#CCCCCC";
const WHITE = "#FFFFFF";
const RED   = "#7B0000";  // teacher copy header

// ─────────────────────────────────────────────────────────────────────────────
// MATH RENDERER (KaTeX)
// ─────────────────────────────────────────────────────────────────────────────

export function renderMath(text: string | any): string {
  if (text === null || text === undefined) return "";
  if (typeof text !== "string") {
    if (Array.isArray(text)) {
      text = (text as any[]).map((item: any) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const q = item.q || item.question || item.text || item.content || "";
          const a = item.a || item.answer || "";
          if (q && a) return `${q}\n   Answer: ${a}`;
          if (q) return q;
          return JSON.stringify(item);
        }
        return String(item);
      }).join("\n\n");
    } else if (typeof text === "object") {
      const c = text as any;
      const q = c.q || c.question || c.text || c.content || "";
      const a = c.a || c.answer || "";
      if (q && a) text = `${q}\n   Answer: ${a}`;
      else if (q) text = q;
      else { try { text = JSON.stringify(c); } catch { text = String(c); } }
    } else {
      text = String(text);
    }
  }
  if (!text) return "";

  text = text.replace(/\\n/g, "\n").replace(/\\t/g, "\t");

  let result = text;

  // Strip pre-rendered KaTeX HTML back to LaTeX
  if (result.includes('class="katex"') || result.includes("class='katex'")) {
    const extractKatexBlocks = (input: string): string => {
      let out = input;
      for (const pat of ['class="katex"', "class='katex'"]) {
        let safety = 0;
        while (out.includes(pat) && safety < 200) {
          safety++;
          const marker = "<span " + pat;
          const startIdx = out.indexOf(marker);
          if (startIdx === -1) break;
          let depth = 0, i = startIdx, endIdx = -1;
          while (i < out.length) {
            if (out.startsWith("<span", i)) { depth++; const gt = out.indexOf(">", i); i = gt !== -1 ? gt + 1 : i + 5; }
            else if (out.startsWith("</span>", i)) { depth--; if (depth === 0) { endIdx = i + 7; break; } i += 7; }
            else { i++; }
          }
          if (endIdx === -1) break;
          const block = out.substring(startIdx, endIdx);
          const annotRegex = /<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/gi;
          let last: RegExpExecArray | null = null, m: RegExpExecArray | null = null;
          while ((m = annotRegex.exec(block)) !== null) last = m;
          out = out.substring(0, startIdx) + (last ? `\\(${last[1].trim()}\\)` : "") + out.substring(endIdx);
        }
      }
      return out;
    };
    result = extractKatexBlocks(result);
  }

  // Strip raw HTML
  result = result.replace(/<\/?(?:span|div|p|a|font|section|article|header|footer|nav|ul|ol|li|table|tr|td|th|thead|tbody|tfoot|blockquote|pre|code|mark|small|del|ins|u|s|abbr|cite|dfn|kbd|samp|var|time|details|summary|form|input|select|textarea|button|label|fieldset|legend|canvas|script|style|link|meta)[^>]*>/gi, "");

  // Render LaTeX \(...\) inline
  result = result.replace(/\\\(([^)]*)\\\)/g, (_, latex) => {
    try { return katex.renderToString(latex, { displayMode: false, throwOnError: false }); }
    catch { return latex; }
  });
  // Render LaTeX \[...\] display
  result = result.replace(/\\\[([^\]]*)\\\]/g, (_, latex) => {
    try { return katex.renderToString(latex, { displayMode: true, throwOnError: false }); }
    catch { return latex; }
  });

  // Simple fractions: 3/4, x/y
  const proseBlocklist = new Set(["and","or","the","a","an","to","of","in","is","it","he","she","they","we","his","her","our","their","with","for","on","at","by","as","be","was","are","has","had","have","but","not","no","yes","eg","ie","etc","vs","re","mr","mrs","ms","dr","st","rd","nd","th","am","pm","uk","us","eu"]);
  result = result.replace(/([A-Za-z0-9]+)\/([A-Za-z0-9]+)/g, (full, num, den) => {
    if (/^\d{4,}$/.test(num) || /^\d{4,}$/.test(den)) return full;
    if (proseBlocklist.has(num.toLowerCase()) || proseBlocklist.has(den.toLowerCase())) return full;
    const isNum = (s: string) => /^\d+$/.test(s);
    const isVar = (s: string) => /^[A-Za-z]$/.test(s);
    if (!isNum(num) && !isVar(num) && !isNum(den) && !isVar(den)) return full;
    try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
    catch { return full; }
  });

  // Bold markdown
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*\*/g, "");
  return result;
}

export function stripKatexToPlainText(html: string): string {
  if (!html) return "";
  let result = html;
  const latexToPlain = (tex: string) => tex
    .replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\pi/g, "π")
    .replace(/\\[a-zA-Z]+/g, "").replace(/[{}^_]/g, "").trim();
  for (const pat of ['class="katex"', "class='katex'"]) {
    let safety = 0;
    while (result.includes(pat) && safety < 200) {
      safety++;
      const marker = "<span " + pat;
      const startIdx = result.indexOf(marker);
      if (startIdx === -1) break;
      let depth = 0, i = startIdx, endIdx = -1;
      while (i < result.length) {
        if (result.startsWith("<span", i)) { depth++; const gt = result.indexOf(">", i); i = gt !== -1 ? gt + 1 : i + 5; }
        else if (result.startsWith("</span>", i)) { depth--; if (depth === 0) { endIdx = i + 7; break; } i += 7; }
        else { i++; }
      }
      if (endIdx === -1) break;
      const block = result.substring(startIdx, endIdx);
      const annotRegex = /<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/gi;
      let last: RegExpExecArray | null = null, m: RegExpExecArray | null = null;
      while ((m = annotRegex.exec(block)) !== null) last = m;
      result = result.substring(0, startIdx) + (last ? latexToPlain(last[1]) : "") + result.substring(endIdx);
    }
  }
  return result.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function stripLatexFromPlainText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\\\(([^)]*)\\\)/g, "$1")
    .replace(/\\\[([^\]]*)\\\]/g, "$1")
    .replace(/\\d?frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\(times|div|cdot|pm|leq|geq|neq|approx|sqrt|pi)\b/g, (_, cmd) => {
      const s: Record<string, string> = { times: "×", div: "÷", cdot: "·", pm: "±", leq: "≤", geq: "≥", neq: "≠", approx: "≈", sqrt: "√", pi: "π" };
      return s[cmd] || cmd;
    })
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface WorksheetSection {
  title: string;
  type: string;
  content: string;
  teacherOnly?: boolean;
  svg?: string;
  caption?: string;
  imageUrl?: string;
  attribution?: string;
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
    sendNeedId?: string;
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
  schoolLogoUrl?: string;
  teacherName?: string;
  hiddenSections?: Set<number>;
  answerBoxSizes?: Record<number, number>;
  onAnswerBoxSizeChange?: (sectionIndex: number, lines: number) => void;
  onAnswerBoxRemove?: (sectionIndex: number) => void;
  isRevisionMat?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION STYLES (PDF-matching palette)
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_STYLES: Record<string, { border: string; bg: string; badge: string; badgeBg: string; icon: string; label: string; headerBg: string; headerText: string }> = {
  "objective":       { border: NAVY,  bg: SOFT,    badge: NAVY,  badgeBg: "#dbeafe", icon: "🎯", label: "Learning Objective",    headerBg: NAVY,  headerText: WHITE },
  "prior-knowledge": { border: TEAL,  bg: SOFT,    badge: TEAL,  badgeBg: "#d1fae5", icon: "📋", label: "Prior Knowledge",       headerBg: TEAL,  headerText: WHITE },
  "vocabulary":      { border: NAVY,  bg: SOFT,    badge: NAVY,  badgeBg: "#dbeafe", icon: "📚", label: "Key Vocabulary",        headerBg: NAVY,  headerText: WHITE },
  "misconceptions":  { border: "#c0392b", bg: "#fff5f5", badge: "#c0392b", badgeBg: "#fee2e2", icon: "⚠", label: "Common Mistakes to Avoid", headerBg: "#c0392b", headerText: WHITE },
  "example":         { border: TEAL,  bg: SOFT,    badge: TEAL,  badgeBg: "#d1fae5", icon: "💡", label: "Worked Example",        headerBg: TEAL,  headerText: WHITE },
  "recall":          { border: NAVY,  bg: WHITE,   badge: NAVY,  badgeBg: "#dbeafe", icon: "",   label: "Section 1: Recall",     headerBg: NAVY,  headerText: WHITE },
  "understanding":   { border: TEAL,  bg: WHITE,   badge: TEAL,  badgeBg: "#d1fae5", icon: "",   label: "Section 2: Understanding", headerBg: TEAL, headerText: WHITE },
  "application":     { border: "#2d6a4f", bg: WHITE, badge: "#2d6a4f", badgeBg: "#d1fae5", icon: "", label: "Section 3: Application", headerBg: "#2d6a4f", headerText: WHITE },
  "challenge":       { border: "#7c3aed", bg: "#faf5ff", badge: "#7c3aed", badgeBg: "#ede9fe", icon: "★", label: "★ Challenge Question", headerBg: "#7c3aed", headerText: WHITE },
  "self-reflection": { border: NAVY,  bg: SOFT,    badge: NAVY,  badgeBg: "#dbeafe", icon: "📊", label: "Self Reflection",       headerBg: NAVY,  headerText: WHITE },
  "self-assessment": { border: NAVY,  bg: SOFT,    badge: NAVY,  badgeBg: "#dbeafe", icon: "📊", label: "Self Assessment",       headerBg: NAVY,  headerText: WHITE },
  "guided":          { border: TEAL,  bg: SOFT,    badge: TEAL,  badgeBg: "#d1fae5", icon: "⭐", label: "Foundation",            headerBg: TEAL,  headerText: WHITE },
  "independent":     { border: NAVY,  bg: WHITE,   badge: NAVY,  badgeBg: "#dbeafe", icon: "★",  label: "Core Practice",         headerBg: NAVY,  headerText: WHITE },
  "word-bank":       { border: TEAL,  bg: SOFT,    badge: TEAL,  badgeBg: "#d1fae5", icon: "📝", label: "Word Bank",             headerBg: TEAL,  headerText: WHITE },
  "sentence-starters":{ border: NAVY, bg: SOFT,    badge: NAVY,  badgeBg: "#dbeafe", icon: "💬", label: "Sentence Starters",    headerBg: NAVY,  headerText: WHITE },
  "reminder-box":    { border: TEAL,  bg: SOFT,    badge: TEAL,  badgeBg: "#d1fae5", icon: "📌", label: "Key Steps",             headerBg: TEAL,  headerText: WHITE },
  "word-problems":   { border: NAVY,  bg: WHITE,   badge: NAVY,  badgeBg: "#dbeafe", icon: "📝", label: "Real-Life Problems",    headerBg: NAVY,  headerText: WHITE },
  "diagram":         { border: TEAL,  bg: SOFT,    badge: TEAL,  badgeBg: "#d1fae5", icon: "📐", label: "Diagram",               headerBg: TEAL,  headerText: WHITE },
  "questions":       { border: NAVY,  bg: WHITE,   badge: NAVY,  badgeBg: "#dbeafe", icon: "❓", label: "Exam Questions",        headerBg: NAVY,  headerText: WHITE },
  "reading":         { border: NAVY,  bg: SOFT,    badge: NAVY,  badgeBg: "#dbeafe", icon: "📖", label: "Reading Passage",       headerBg: NAVY,  headerText: WHITE },
  "passage":         { border: NAVY,  bg: SOFT,    badge: NAVY,  badgeBg: "#dbeafe", icon: "📖", label: "Reading Passage",       headerBg: NAVY,  headerText: WHITE },
  "source-text":     { border: NAVY,  bg: SOFT,    badge: NAVY,  badgeBg: "#dbeafe", icon: "📜", label: "Source Text",           headerBg: NAVY,  headerText: WHITE },
  "comprehension":   { border: TEAL,  bg: SOFT,    badge: TEAL,  badgeBg: "#d1fae5", icon: "🔍", label: "Comprehension",         headerBg: TEAL,  headerText: WHITE },
  "answers":         { border: RED,   bg: "#fff5f5", badge: RED, badgeBg: "#fee2e2", icon: "✔",  label: "Answer Key",            headerBg: RED,   headerText: WHITE },
  "mark-scheme":     { border: RED,   bg: "#fff5f5", badge: RED, badgeBg: "#fee2e2", icon: "✔",  label: "Mark Scheme",           headerBg: RED,   headerText: WHITE },
  "teacher-notes":   { border: RED,   bg: "#fff5f5", badge: RED, badgeBg: "#fee2e2", icon: "📋", label: "Teacher Notes",         headerBg: RED,   headerText: WHITE },
  "extension":       { border: "#7c3aed", bg: "#faf5ff", badge: "#7c3aed", badgeBg: "#ede9fe", icon: "🔭", label: "Extension Task", headerBg: "#7c3aed", headerText: WHITE },
  "default":         { border: NAVY,  bg: WHITE,   badge: NAVY,  badgeBg: "#dbeafe", icon: "",   label: "",                      headerBg: NAVY,  headerText: WHITE },
};

function getSectionStyle(type: string) {
  return SECTION_STYLES[type] || SECTION_STYLES["default"];
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY SCHOOL COLOUR PALETTE (cheerful, per-section colours)
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY_COLOURS = [
  { header: "#4f46e5", bg: "#f5f3ff", border: "#4f46e5" },
  { header: "#2563eb", bg: "#eff6ff", border: "#2563eb" },
  { header: "#7c3aed", bg: "#faf5ff", border: "#7c3aed" },
  { header: "#0891b2", bg: "#ecfeff", border: "#0891b2" },
  { header: "#059669", bg: "#ecfdf5", border: "#059669" },
  { header: "#d97706", bg: "#fffbeb", border: "#d97706" },
  { header: "#dc2626", bg: "#fef2f2", border: "#dc2626" },
  { header: "#7c3aed", bg: "#faf5ff", border: "#7c3aed" },
];


// ─────────────────────────────────────────────────────────────────────────────
// ANSWER LINES (matches ws_primitives.py AnswerLines)
// ─────────────────────────────────────────────────────────────────────────────

function AnswerLines({ n, lineH = 28 }: { n: number; lineH?: number }) {
  return (
    <div style={{ marginTop: "8px" }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ borderBottom: `1px solid ${RULE}`, height: `${lineH}px`, marginBottom: "2px" }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT FAMILY RENDERERS
// Each renderer takes the raw content string and produces the correct PDF-matching layout.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TRUE / FALSE — pill-style TRUE / FALSE buttons per statement.
 * Matches ws_primitives.py PillTrueFalse.
 */
function TrueFalseRenderer({ content, fontSize, fontFamily, isTeacher }: {
  content: string; fontSize: number; fontFamily: string; isTeacher: boolean;
}) {
  // Parse statements from content
  // Format: "1. Statement text\n2. Statement text..."
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  // Strip the question-level instruction line (starts with bold or "Decide...")
  const stmtLines = lines.filter(l => /^\d+[.)]\s/.test(l.trim()) || /^[•\-]\s/.test(l.trim()));

  if (stmtLines.length === 0) {
    // Fallback: treat every non-empty line as a statement
    const fallback = lines.filter(l => l.trim().length > 5);
    return (
      <div>
        {fallback.map((line, i) => (
          <TrueFalseRow key={i} index={i + 1} text={line.replace(/^\d+[.)]\s*/, "").trim()} fontSize={fontSize} fontFamily={fontFamily} answer={null} isTeacher={isTeacher} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {stmtLines.map((line, i) => {
        const text = line.replace(/^\d+[.)]\s*/, "").replace(/^[•\-]\s*/, "").trim();
        // Check if teacher answer is embedded: "Statement [TRUE]" or "Statement [FALSE]"
        const ansMatch = text.match(/\[(TRUE|FALSE)\]\s*$/i);
        const cleanText = ansMatch ? text.replace(/\[(TRUE|FALSE)\]\s*$/i, "").trim() : text;
        const answer = ansMatch ? ansMatch[1].toUpperCase() : null;
        return (
          <TrueFalseRow key={i} index={i + 1} text={cleanText} fontSize={fontSize} fontFamily={fontFamily} answer={answer} isTeacher={isTeacher} />
        );
      })}
    </div>
  );
}

function TrueFalseRow({ index, text, fontSize, fontFamily, answer, isTeacher }: {
  index: number; text: string; fontSize: number; fontFamily: string; answer: string | null; isTeacher: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
      {/* Statement number badge */}
      <div style={{
        background: TEAL, color: WHITE, borderRadius: "50%",
        width: "24px", height: "24px", minWidth: "24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: `${fontSize - 2}px`, fontWeight: 700, fontFamily,
      }}>
        {index}
      </div>
      {/* Statement text */}
      <div style={{ flex: 1, fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.5" }}
        dangerouslySetInnerHTML={{ __html: renderMath(text) }} />
      {/* TRUE pill */}
      <div style={{
        padding: "4px 16px", borderRadius: "999px",
        border: `1.5px solid ${TEAL}`,
        background: isTeacher && answer === "TRUE" ? TEAL : WHITE,
        color: isTeacher && answer === "TRUE" ? WHITE : TEAL,
        fontSize: `${fontSize - 1}px`, fontWeight: 700, fontFamily,
        cursor: "default", minWidth: "56px", textAlign: "center" as const,
      }}>
        TRUE
      </div>
      {/* FALSE pill */}
      <div style={{
        padding: "4px 16px", borderRadius: "999px",
        border: `1.5px solid #c0392b`,
        background: isTeacher && answer === "FALSE" ? "#c0392b" : WHITE,
        color: isTeacher && answer === "FALSE" ? WHITE : "#c0392b",
        fontSize: `${fontSize - 1}px`, fontWeight: 700, fontFamily,
        cursor: "default", minWidth: "56px", textAlign: "center" as const,
      }}>
        FALSE
      </div>
    </div>
  );
}

/**
 * MCQ 2-COLUMN — 2-column option grid with circle bubbles.
 * Matches ws_primitives.py MCQOptions.
 */
function MCQRenderer({ content, fontSize, fontFamily, isTeacher }: {
  content: string; fontSize: number; fontFamily: string; isTeacher: boolean;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  // Separate question stem from options (a. b. c. d.)
  const optionLines = lines.filter(l => /^[a-dA-D][.)]\s/.test(l.trim()));
  const questionLines = lines.filter(l => !/^[a-dA-D][.)]\s/.test(l.trim()));

  return (
    <div>
      {/* Question stem */}
      {questionLines.map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "10px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
      {/* Options in 2-column grid */}
      {optionLines.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginTop: "8px" }}>
          {optionLines.map((opt, i) => {
            const letter = opt.trim().charAt(0).toUpperCase();
            const text = opt.trim().replace(/^[a-dA-D][.)]\s*/, "");
            // Teacher: highlight correct answer (marked with [CORRECT] or ✓)
            const isCorrect = isTeacher && (opt.includes("[CORRECT]") || opt.includes("✓"));
            const cleanText = text.replace(/\[CORRECT\]|\s*✓/g, "").trim();
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "6px 10px",
                border: `1.5px solid ${isCorrect ? TEAL : RULE}`,
                borderRadius: "6px",
                background: isCorrect ? "#ecfdf5" : WHITE,
              }}>
                {/* Circle bubble */}
                <div style={{
                  width: "22px", height: "22px", minWidth: "22px",
                  borderRadius: "50%",
                  border: `1.5px solid ${isCorrect ? TEAL : LIGHT}`,
                  background: isCorrect ? TEAL : WHITE,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: `${fontSize - 2}px`, fontWeight: 700, fontFamily,
                  color: isCorrect ? WHITE : LIGHT,
                }}>
                  {letter}
                </div>
                <span style={{ fontSize: `${fontSize}px`, fontFamily, color: MID }}
                  dangerouslySetInnerHTML={{ __html: renderMath(cleanText) }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * GAP FILL INLINE — paragraph with blanks rendered as underlines.
 * Word bank shown if present.
 */
function GapFillRenderer({ content, fontSize, fontFamily }: {
  content: string; fontSize: number; fontFamily: string;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  // Detect word bank line
  const wbIdx = lines.findIndex(l => /^word bank:/i.test(l.trim()) || /^word bank\s*$/i.test(l.trim()));
  const wbLine = wbIdx >= 0 ? lines[wbIdx + 1] || lines[wbIdx] : null;
  const wordBankWords = wbLine ? wbLine.replace(/^word bank:\s*/i, "").split(/[,|]/).map(w => w.trim()).filter(Boolean) : [];
  const paraLines = wbIdx >= 0 ? lines.slice(0, wbIdx) : lines;

  return (
    <div>
      {/* Paragraph with blanks */}
      {paraLines.map((line, i) => {
        // Render ___ as underline blanks
        const parts = line.split(/(_+)/);
        return (
          <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.8", marginBottom: "6px" }}>
            {parts.map((part, pi) =>
              /^_+$/.test(part)
                ? <span key={pi} style={{ display: "inline-block", borderBottom: `1.5px solid ${MID}`, minWidth: "60px", marginLeft: "2px", marginRight: "2px" }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                : <span key={pi} dangerouslySetInnerHTML={{ __html: renderMath(part) }} />
            )}
          </div>
        );
      })}
      {/* Word bank */}
      {wordBankWords.length > 0 && (
        <div style={{ marginTop: "12px", padding: "8px 12px", background: SOFT, border: `1px solid ${RULE}`, borderRadius: "4px" }}>
          <div style={{ fontSize: `${fontSize - 2}px`, fontWeight: 700, color: NAVY, fontFamily, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Word Bank
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {wordBankWords.map((word, i) => (
              <span key={i} style={{
                padding: "3px 10px", border: `1px solid ${NAVY}`, borderRadius: "4px",
                fontSize: `${fontSize - 1}px`, fontFamily, color: NAVY, background: WHITE,
              }}>
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * LABEL DIAGRAM — diagram box with numbered label arrows.
 * Renders a placeholder diagram box with label lines.
 */
function LabelDiagramRenderer({ content, fontSize, fontFamily, accentColor }: {
  content: string; fontSize: number; fontFamily: string; accentColor: string;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  // Extract label items (numbered list)
  const labelLines = lines.filter(l => /^\d+[.)]\s/.test(l.trim()));
  const questionLines = lines.filter(l => !/^\d+[.)]\s/.test(l.trim()));

  return (
    <div>
      {questionLines.map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "8px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
      {/* Diagram placeholder box — clipped, padded, faint border (matches DiagramBox in ws_primitives.py) */}
      <div style={{
        border: `1px solid ${RULE}`,
        borderRadius: "4px",
        background: SOFT,
        padding: "16px",
        margin: "10px 0",
        minHeight: "120px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{ color: LIGHT, fontSize: `${fontSize - 2}px`, fontFamily, fontStyle: "italic", textAlign: "center" }}>
          [Diagram — label the parts indicated by the arrows]
        </div>
      </div>
      {/* Label answer lines */}
      {labelLines.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          {labelLines.map((line, i) => {
            const num = line.trim().match(/^(\d+)/)?.[1] || String(i + 1);
            const text = line.trim().replace(/^\d+[.)]\s*/, "");
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{
                  background: TEAL, color: WHITE, borderRadius: "50%",
                  width: "22px", height: "22px", minWidth: "22px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: `${fontSize - 2}px`, fontWeight: 700, fontFamily,
                }}>
                  {num}
                </div>
                <div style={{ flex: 1, borderBottom: `1px solid ${RULE}`, height: "26px", fontSize: `${fontSize}px`, fontFamily, color: MID }}
                  dangerouslySetInnerHTML={{ __html: renderMath(text) }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * DIAGRAM SUBQUESTIONS — diagram box with sub-questions (a) (b) (c).
 */
function DiagramSubQRenderer({ content, fontSize, fontFamily, accentColor, isTeacher }: {
  content: string; fontSize: number; fontFamily: string; accentColor: string; isTeacher: boolean;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  const subQLines = lines.filter(l => /^\([a-e]\)|\b[a-e]\)\s/.test(l.trim()) || /^[a-e]\.\s/.test(l.trim()));
  const questionLines = lines.filter(l => !subQLines.includes(l));

  return (
    <div>
      {questionLines.map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "8px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
      {/* Diagram box */}
      <div style={{
        border: `1px solid ${RULE}`, borderRadius: "4px", background: SOFT,
        padding: "16px", margin: "10px 0", minHeight: "100px",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <div style={{ color: LIGHT, fontSize: `${fontSize - 2}px`, fontFamily, fontStyle: "italic", textAlign: "center" }}>
          [Refer to the diagram when answering the questions below]
        </div>
      </div>
      {/* Sub-questions */}
      {subQLines.map((line, i) => {
        const letter = String.fromCharCode(97 + i);
        const text = line.trim().replace(/^\([a-e]\)\s*|^[a-e][.)]\s*/i, "");
        const markMatch = text.match(/\[(\d+)\s*marks?\]/i);
        const marks = markMatch ? parseInt(markMatch[1]) : 2;
        const cleanText = text.replace(/\[\d+\s*marks?\]/i, "").trim();
        return (
          <div key={i} style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <div style={{
                background: NAVY, color: WHITE, borderRadius: "4px",
                padding: "2px 8px", fontSize: `${fontSize - 1}px`, fontWeight: 700, fontFamily,
                flexShrink: 0,
              }}>
                ({letter})
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.5", marginBottom: "6px" }}
                  dangerouslySetInnerHTML={{ __html: renderMath(cleanText) }} />
                <AnswerLines n={marks >= 4 ? 4 : 2} />
              </div>
              <div style={{ fontSize: `${fontSize - 2}px`, color: LIGHT, fontFamily, whiteSpace: "nowrap" }}>
                [{marks} mark{marks !== 1 ? "s" : ""}]
              </div>
            </div>
          </div>
        );
      })}
      {subQLines.length === 0 && <AnswerLines n={4} />}
    </div>
  );
}

/**
 * TABLE COMPLETE — table with blank cells to fill in.
 */
function TableCompleteRenderer({ content, fontSize, fontFamily, isTeacher }: {
  content: string; fontSize: number; fontFamily: string; isTeacher: boolean;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  // Find table rows (contain |)
  const tableLines = lines.filter(l => l.includes("|") && !l.match(/^[\|\s\-]+$/));
  const questionLines = lines.filter(l => !l.includes("|"));

  if (tableLines.length === 0) {
    return (
      <div>
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "6px" }}
            dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
        ))}
        <AnswerLines n={4} />
      </div>
    );
  }

  const rows = tableLines.map(l => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim()));
  const firstRowIsHeader = rows[0]?.every(c => /^[A-Z]/.test(c) && c.length < 30 && c.split(" ").length <= 4);
  const header = firstRowIsHeader ? rows[0] : [];
  const body = firstRowIsHeader ? rows.slice(1) : rows;

  return (
    <div>
      {questionLines.map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "8px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
      <div style={{ overflowX: "auto", marginTop: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: `${fontSize}px`, fontFamily }}>
          {header.length > 0 && (
            <thead>
              <tr>
                {header.map((h, hi) => (
                  <th key={hi} style={{ padding: "8px 12px", background: NAVY, color: WHITE, textAlign: "left", fontWeight: 700, border: `1px solid ${RULE}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? WHITE : SOFT }}>
                {row.map((cell, ci) => {
                  const isBlank = !cell || cell === "null" || cell === "___" || cell === "..." || cell === "-";
                  return (
                    <td key={ci} style={{ padding: "8px 12px", border: `1px solid ${RULE}`, minWidth: "80px", minHeight: "32px" }}>
                      {isBlank
                        ? <div style={{ borderBottom: `1px solid ${RULE}`, height: "24px" }} />
                        : <span dangerouslySetInnerHTML={{ __html: renderMath(cell) }} />
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * DRAW BOX — large blank drawing area with instructions.
 * Matches ws_primitives.py DiagramBox (padded, clipped, faint border).
 */
function DrawBoxRenderer({ content, fontSize, fontFamily }: {
  content: string; fontSize: number; fontFamily: string;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  const requirementLines = lines.filter(l => /^[•\-\*]\s/.test(l.trim()));
  const instructionLines = lines.filter(l => !/^[•\-\*]\s/.test(l.trim()));

  return (
    <div>
      {instructionLines.map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "6px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
      {requirementLines.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          {requirementLines.map((line, i) => (
            <div key={i} style={{ fontSize: `${fontSize - 1}px`, fontFamily, color: LIGHT, lineHeight: "1.5" }}>
              {line.replace(/^[•\-\*]\s*/, "• ")}
            </div>
          ))}
        </div>
      )}
      {/* Drawing box — padded, clipped, faint border (DiagramBox style) */}
      <div style={{
        border: `1px solid ${RULE}`,
        borderRadius: "4px",
        background: WHITE,
        padding: "8px",
        minHeight: "160px",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Inner clipped area (matches DiagramBox clipPath) */}
        <div style={{
          position: "absolute", inset: "8px",
          border: `1px dashed ${RULE}`,
          borderRadius: "2px",
        }} />
        <div style={{
          position: "absolute", bottom: "12px", right: "12px",
          fontSize: `${fontSize - 3}px`, color: LIGHT, fontFamily, fontStyle: "italic",
        }}>
          Draw your answer here
        </div>
      </div>
    </div>
  );
}

/**
 * SHORT ANSWER — numbered questions with ruled answer lines.
 * Marks badge shown top-right.
 */
function ShortAnswerRenderer({ content, fontSize, fontFamily, isTeacher }: {
  content: string; fontSize: number; fontFamily: string; isTeacher: boolean;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  const qLines = lines.filter(l => /^\d+[.)]\s/.test(l.trim()));
  const introLines = lines.filter(l => !/^\d+[.)]\s/.test(l.trim()) && !/^___/.test(l.trim()));

  if (qLines.length === 0) {
    return (
      <div>
        {lines.filter(l => !/^___/.test(l.trim())).map((line, i) => (
          <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "6px" }}
            dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
        ))}
        <AnswerLines n={4} />
      </div>
    );
  }

  return (
    <div>
      {introLines.map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "8px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
      {qLines.map((line, i) => {
        const num = line.trim().match(/^(\d+)/)?.[1] || String(i + 1);
        const text = line.trim().replace(/^\d+[.)]\s*/, "");
        const markMatch = text.match(/\[(\d+)\s*marks?\]/i);
        const marks = markMatch ? parseInt(markMatch[1]) : 2;
        const cleanText = text.replace(/\[\d+\s*marks?\]/i, "").trim();
        // Teacher: show answer if embedded "Answer: ..."
        const answerMatch = cleanText.match(/Answer:\s*(.+)$/i);
        const displayText = isTeacher ? cleanText : cleanText.replace(/Answer:\s*.+$/i, "").trim();

        return (
          <div key={i} style={{ marginBottom: "16px", pageBreakInside: "avoid", breakInside: "avoid" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
              {/* Question number badge */}
              <div style={{
                background: TEAL, color: WHITE, borderRadius: "50%",
                width: "26px", height: "26px", minWidth: "26px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: `${fontSize - 1}px`, fontWeight: 700, fontFamily,
              }}>
                {num}
              </div>
              <div style={{ flex: 1, fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6" }}
                dangerouslySetInnerHTML={{ __html: renderMath(displayText) }} />
              {/* Marks badge */}
              <div style={{ fontSize: `${fontSize - 2}px`, color: LIGHT, fontFamily, whiteSpace: "nowrap", paddingTop: "2px" }}>
                [{marks} mark{marks !== 1 ? "s" : ""}]
              </div>
            </div>
            {isTeacher && answerMatch ? (
              <div style={{ marginLeft: "36px", padding: "6px 10px", background: "#ecfdf5", border: `1px solid ${TEAL}`, borderRadius: "4px", fontSize: `${fontSize - 1}px`, fontFamily, color: "#166534" }}>
                ✓ {answerMatch[1]}
              </div>
            ) : (
              <div style={{ marginLeft: "36px" }}>
                <AnswerLines n={marks >= 4 ? 4 : 2} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * EXTENDED ANSWER — single question with large writing area.
 */
function ExtendedAnswerRenderer({ content, fontSize, fontFamily, isTeacher }: {
  content: string; fontSize: number; fontFamily: string; isTeacher: boolean;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  const markMatch = content.match(/\[(\d+)\s*marks?\]/i);
  const marks = markMatch ? parseInt(markMatch[1]) : 6;
  const numLines = marks >= 8 ? 10 : marks >= 6 ? 8 : 6;

  return (
    <div>
      {lines.filter(l => !/^___/.test(l.trim())).map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "6px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
      <AnswerLines n={numLines} />
    </div>
  );
}

/**
 * MATCHING — two-column match-up activity.
 */
function MatchingRenderer({ content, fontSize, fontFamily }: {
  content: string; fontSize: number; fontFamily: string;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  const termsStart = lines.findIndex(l => /^terms:/i.test(l.trim()) || /^\*\*terms/i.test(l.trim()));
  const defsStart = lines.findIndex(l => /^definitions:/i.test(l.trim()) || /^\*\*definitions/i.test(l.trim()));
  const introLines = lines.slice(0, Math.max(0, termsStart >= 0 ? termsStart : defsStart >= 0 ? defsStart : 1));

  let terms: string[] = [];
  let defs: string[] = [];

  if (termsStart >= 0 && defsStart >= 0) {
    terms = lines.slice(termsStart + 1, defsStart).filter(l => /^\d+[.)]\s/.test(l.trim())).map(l => l.trim().replace(/^\d+[.)]\s*/, ""));
    defs = lines.slice(defsStart + 1).filter(l => /^[A-Z][.)]\s/.test(l.trim())).map(l => l.trim().replace(/^[A-Z][.)]\s*/, ""));
  } else {
    // Fallback: numbered items are terms, lettered items are definitions
    terms = lines.filter(l => /^\d+[.)]\s/.test(l.trim())).map(l => l.trim().replace(/^\d+[.)]\s*/, ""));
    defs = lines.filter(l => /^[A-Z][.)]\s/.test(l.trim())).map(l => l.trim().replace(/^[A-Z][.)]\s*/, ""));
  }

  return (
    <div>
      {introLines.map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "8px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginTop: "8px" }}>
        {/* Terms column */}
        <div>
          <div style={{ fontSize: `${fontSize - 1}px`, fontWeight: 700, color: NAVY, fontFamily, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Terms
          </div>
          {terms.map((term, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{
                background: TEAL, color: WHITE, borderRadius: "50%",
                width: "22px", height: "22px", minWidth: "22px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: `${fontSize - 2}px`, fontWeight: 700, fontFamily,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, fontSize: `${fontSize}px`, fontFamily, color: MID }}
                dangerouslySetInnerHTML={{ __html: renderMath(term) }} />
            </div>
          ))}
        </div>
        {/* Definitions column */}
        <div>
          <div style={{ fontSize: `${fontSize - 1}px`, fontWeight: 700, color: NAVY, fontFamily, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Definitions
          </div>
          {defs.map((def, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
              <div style={{
                background: NAVY, color: WHITE, borderRadius: "4px",
                padding: "1px 7px", fontSize: `${fontSize - 2}px`, fontWeight: 700, fontFamily,
                flexShrink: 0,
              }}>
                {String.fromCharCode(65 + i)}
              </div>
              <div style={{ flex: 1, fontSize: `${fontSize}px`, fontFamily, color: MID }}
                dangerouslySetInnerHTML={{ __html: renderMath(def) }} />
            </div>
          ))}
        </div>
      </div>
      {/* Answer grid */}
      {terms.length > 0 && (
        <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {terms.map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{
                background: TEAL, color: WHITE, borderRadius: "50%",
                width: "20px", height: "20px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: `${fontSize - 3}px`, fontWeight: 700, fontFamily,
              }}>
                {i + 1}
              </div>
              <div style={{ borderBottom: `1px solid ${RULE}`, width: "28px", height: "20px" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ORDERING — numbered blanks to order steps.
 */
function OrderingRenderer({ content, fontSize, fontFamily }: {
  content: string; fontSize: number; fontFamily: string;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  const stepLines = lines.filter(l => /^___\s/.test(l.trim()) || /^_+\s/.test(l.trim()));
  const introLines = lines.filter(l => !/^___\s/.test(l.trim()) && !/^_+\s/.test(l.trim()));

  return (
    <div>
      {introLines.map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "8px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
      {stepLines.map((line, i) => {
        const text = line.trim().replace(/^_+\s*/, "");
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
            {/* Blank for number */}
            <div style={{
              width: "32px", height: "32px", minWidth: "32px",
              border: `1.5px solid ${NAVY}`, borderRadius: "4px",
              background: WHITE,
            }} />
            <div style={{ flex: 1, fontSize: `${fontSize}px`, fontFamily, color: MID }}
              dangerouslySetInnerHTML={{ __html: renderMath(text) }} />
          </div>
        );
      })}
      {stepLines.length === 0 && lines.map((line, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
          <div style={{ width: "32px", height: "32px", minWidth: "32px", border: `1.5px solid ${NAVY}`, borderRadius: "4px", background: WHITE }} />
          <div style={{ flex: 1, fontSize: `${fontSize}px`, fontFamily, color: MID }}
            dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
        </div>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT DISPATCHER
// Detects the LAYOUT: tag embedded in content and routes to the correct renderer.
// ─────────────────────────────────────────────────────────────────────────────

function detectLayout(content: string): string {
  const m = content.match(/^LAYOUT:(\S+)/m);
  if (m) return m[1];
  // Auto-detect from content patterns
  if (/TRUE\s*\/?\s*FALSE|true.*false/i.test(content) && /^\d+[.)]/m.test(content)) return "true_false";
  if (/^[a-d][.)]\s/m.test(content)) return "mcq_2col";
  if (/___/.test(content) && /word bank/i.test(content)) return "gap_fill_inline";
  if (/match.*term|draw a line/i.test(content)) return "matching";
  if (/correct order|number.*steps/i.test(content)) return "ordering";
  if (/label.*diagram|diagram.*label/i.test(content)) return "label_diagram";
  if (/draw.*box|draw.*diagram|draw.*circuit/i.test(content)) return "draw_box";
  return "short_answer";
}

function renderLayoutContent({
  content, layout, fontSize, fontFamily, accentColor, isTeacher,
}: {
  content: string; layout: string; fontSize: number; fontFamily: string; accentColor: string; isTeacher: boolean;
}): React.ReactNode {
  switch (layout) {
    case "true_false":
      return <TrueFalseRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} isTeacher={isTeacher} />;
    case "mcq_2col":
      return <MCQRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} isTeacher={isTeacher} />;
    case "gap_fill_inline":
      return <GapFillRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} />;
    case "label_diagram":
      return <LabelDiagramRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} accentColor={accentColor} />;
    case "diagram_subquestions":
      return <DiagramSubQRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} accentColor={accentColor} isTeacher={isTeacher} />;
    case "table_complete":
      return <TableCompleteRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} isTeacher={isTeacher} />;
    case "draw_box":
      return <DrawBoxRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} />;
    case "extended_answer":
      return <ExtendedAnswerRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} isTeacher={isTeacher} />;
    case "matching":
      return <MatchingRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} />;
    case "ordering":
      return <OrderingRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} />;
    case "short_answer":
    default:
      return <ShortAnswerRenderer content={content} fontSize={fontSize} fontFamily={fontFamily} isTeacher={isTeacher} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER (matches ws_primitives.py section_header)
// Navy/teal bar with white bold title, marks badge on right.
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ title, headerBg, headerText, marks, icon, fontSize, fontFamily }: {
  title: string; headerBg: string; headerText: string; marks?: number; icon?: string; fontSize: number; fontFamily: string;
}) {
  return (
    <div style={{
      background: headerBg,
      color: headerText,
      padding: "8px 14px",
      borderRadius: "4px 4px 0 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {icon && <span style={{ fontSize: `${fontSize}px` }}>{icon}</span>}
        <span style={{ fontWeight: 700, fontSize: `${fontSize + 1}px`, fontFamily, letterSpacing: "0.02em" }}>
          {title}
        </span>
      </div>
      {marks !== undefined && marks > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.2)", color: headerText,
          padding: "2px 10px", borderRadius: "999px",
          fontSize: `${fontSize - 2}px`, fontWeight: 700, fontFamily,
          whiteSpace: "nowrap",
        }}>
          {marks} mark{marks !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BLOCK (matches ws_primitives.py question_block)
// Numbered badge + question text + layout-specific content + marks.
// ─────────────────────────────────────────────────────────────────────────────

function QuestionBlock({ questionNumber, content, layout, marks, fontSize, fontFamily, accentColor, isTeacher, hasSvg, svgContent, caption }: {
  questionNumber: number; content: string; layout: string; marks: number;
  fontSize: number; fontFamily: string; accentColor: string; isTeacher: boolean;
  hasSvg?: boolean; svgContent?: string; caption?: string;
}) {
  // Strip LAYOUT: tag from display
  const displayContent = content.replace(/^LAYOUT:\S+\s*/m, "").trim();

  return (
    <div style={{
      border: `1px solid ${RULE}`,
      borderRadius: "6px",
      marginBottom: "16px",
      overflow: "hidden",
      pageBreakInside: "avoid",
      breakInside: "avoid",
    }}>
      {/* Question number bar */}
      <div style={{
        background: accentColor,
        color: WHITE,
        padding: "6px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            background: WHITE, color: accentColor,
            borderRadius: "50%", width: "24px", height: "24px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: `${fontSize - 1}px`, fontFamily,
          }}>
            {questionNumber}
          </div>
          <span style={{ fontWeight: 600, fontSize: `${fontSize}px`, fontFamily, opacity: 0.9 }}>
            Question {questionNumber}
          </span>
        </div>
        {marks > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.2)", color: WHITE,
            padding: "2px 10px", borderRadius: "999px",
            fontSize: `${fontSize - 2}px`, fontWeight: 700, fontFamily,
          }}>
            {marks} mark{marks !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      {/* Content area */}
      <div style={{ padding: "14px 16px", background: WHITE }}>
        {/* SVG diagram if present */}
        {hasSvg && svgContent && (
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                border: `1px solid ${RULE}`, borderRadius: "4px", background: SOFT,
                padding: "8px", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
            {caption && (
              <div style={{ fontSize: `${fontSize - 2}px`, color: LIGHT, fontFamily, textAlign: "center", marginTop: "4px", fontStyle: "italic" }}>
                {caption}
              </div>
            )}
          </div>
        )}
        {renderLayoutContent({ content: displayContent, layout, fontSize, fontFamily, accentColor, isTeacher })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELF-REFLECTION TABLE (matches ws_primitives.py self_reflection_page)
// ─────────────────────────────────────────────────────────────────────────────

function SelfReflectionTable({ fontSize, fontFamily }: { fontSize: number; fontFamily: string }) {
  const rows = [
    { label: "I can recall the key facts", emoji: "📚" },
    { label: "I understand the main concepts", emoji: "💡" },
    { label: "I can apply my knowledge", emoji: "🔧" },
    { label: "I completed the challenge question", emoji: "★" },
    { label: "I need more practice on...", emoji: "📝" },
  ];
  const cols = ["😊 Confident", "🙂 Getting There", "😕 Need Help"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: `${fontSize}px`, fontFamily }}>
        <thead>
          <tr>
            <th style={{ padding: "8px 12px", background: NAVY, color: WHITE, textAlign: "left", fontWeight: 700, border: `1px solid ${RULE}`, width: "40%" }}>
              Learning Objective
            </th>
            {cols.map((col, ci) => (
              <th key={ci} style={{ padding: "8px 12px", background: NAVY, color: WHITE, textAlign: "center", fontWeight: 700, border: `1px solid ${RULE}` }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? WHITE : SOFT }}>
              <td style={{ padding: "10px 12px", border: `1px solid ${RULE}`, fontSize: `${fontSize}px`, fontFamily, color: MID }}>
                <span style={{ marginRight: "6px" }}>{row.emoji}</span>{row.label}
              </td>
              {cols.map((_, ci) => (
                <td key={ci} style={{ padding: "10px 12px", border: `1px solid ${RULE}`, textAlign: "center" }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "50%",
                    border: `1.5px solid ${RULE}`, margin: "0 auto",
                    background: WHITE,
                  }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Target box */}
      <div style={{ marginTop: "12px", padding: "10px 14px", border: `1px solid ${RULE}`, borderRadius: "4px", background: SOFT }}>
        <div style={{ fontSize: `${fontSize - 1}px`, fontWeight: 700, color: NAVY, fontFamily, marginBottom: "6px" }}>
          My target for next lesson:
        </div>
        <AnswerLines n={2} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGE BLOCK (matches ws_primitives.py challenge_block)
// ─────────────────────────────────────────────────────────────────────────────

function ChallengeBlock({ content, fontSize, fontFamily, isTeacher }: {
  content: string; fontSize: number; fontFamily: string; isTeacher: boolean;
}) {
  const lines = content.split("\n").filter(l => l.trim() && !l.startsWith("LAYOUT:"));
  return (
    <div style={{
      border: `2px solid #7c3aed`,
      borderRadius: "6px",
      overflow: "hidden",
      marginBottom: "16px",
    }}>
      <div style={{
        background: "#7c3aed", color: WHITE,
        padding: "8px 14px",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        <span style={{ fontSize: `${fontSize + 2}px` }}>★</span>
        <span style={{ fontWeight: 700, fontSize: `${fontSize + 1}px`, fontFamily }}>
          Challenge Question
        </span>
        <span style={{ marginLeft: "auto", fontSize: `${fontSize - 1}px`, opacity: 0.8 }}>
          Extension
        </span>
      </div>
      <div style={{ padding: "14px 16px", background: "#faf5ff" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "6px" }}
            dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
        ))}
        <AnswerLines n={6} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOCABULARY SECTION (matches ws_primitives.py vocab_section)
// ─────────────────────────────────────────────────────────────────────────────

function VocabularySection({ content, fontSize, fontFamily }: {
  content: string; fontSize: number; fontFamily: string;
}) {
  const lines = content.split("\n").filter(l => l.trim());
  const items = lines.map(l => {
    const colonIdx = l.indexOf(":");
    if (colonIdx > 0) {
      return { term: l.slice(0, colonIdx).trim(), def: l.slice(colonIdx + 1).trim() };
    }
    const dashIdx = l.indexOf(" — ");
    if (dashIdx > 0) {
      return { term: l.slice(0, dashIdx).trim(), def: l.slice(dashIdx + 3).trim() };
    }
    const dashIdx2 = l.indexOf(" - ");
    if (dashIdx2 > 0) {
      return { term: l.slice(0, dashIdx2).trim(), def: l.slice(dashIdx2 + 3).trim() };
    }
    return { term: l.trim(), def: "" };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px" }}>
      {items.map((item, i) => (
        <div key={i} style={{
          border: `1px solid ${RULE}`, borderRadius: "4px",
          overflow: "hidden",
        }}>
          <div style={{
            background: NAVY, color: WHITE,
            padding: "5px 10px",
            fontWeight: 700, fontSize: `${fontSize - 1}px`, fontFamily,
          }}>
            {item.term}
          </div>
          <div style={{
            padding: "6px 10px", background: WHITE,
            fontSize: `${fontSize - 1}px`, fontFamily, color: MID, lineHeight: "1.4",
          }}>
            {item.def || <span style={{ color: LIGHT, fontStyle: "italic" }}>definition</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMON MISTAKES SECTION (matches ws_primitives.py mistakes_section)
// ─────────────────────────────────────────────────────────────────────────────

function MistakesSection({ content, fontSize, fontFamily }: {
  content: string; fontSize: number; fontFamily: string;
}) {
  const lines = content.split("\n").filter(l => l.trim());
  const items: { head: string; body: string }[] = [];
  let cur: { head: string; body: string } | null = null;

  for (const line of lines) {
    if (line.startsWith("✗") || line.startsWith("×") || /^MISTAKE:/i.test(line)) {
      if (cur) items.push(cur);
      cur = { head: line.replace(/^[✗×]\s*\*?\*?/, "").replace(/\*?\*?$/, "").replace(/^MISTAKE:\s*/i, "").trim(), body: "" };
    } else if (line.startsWith("→") || line.startsWith("✓") || /^FIX:/i.test(line)) {
      if (cur) cur.body = line.replace(/^[→✓]\s*/, "").replace(/^FIX:\s*/i, "").trim();
    } else if (cur && !cur.body) {
      cur.body = line.trim();
    } else if (!cur) {
      items.push({ head: line.trim(), body: "" });
    }
  }
  if (cur) items.push(cur);

  if (items.length === 0) {
    return (
      <div>
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "6px" }}
            dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item, i) => (
        <div key={i} style={{
          border: `1px solid #fee2e2`, borderRadius: "4px", overflow: "hidden",
        }}>
          <div style={{ background: "#fee2e2", padding: "5px 10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#c0392b", fontWeight: 700, fontSize: `${fontSize}px` }}>✗</span>
            <span style={{ fontWeight: 700, fontSize: `${fontSize - 1}px`, fontFamily, color: "#7b0000" }}
              dangerouslySetInnerHTML={{ __html: renderMath(item.head) }} />
          </div>
          {item.body && (
            <div style={{ padding: "6px 10px", background: "#fff5f5", display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <span style={{ color: TEAL, fontWeight: 700, fontSize: `${fontSize}px` }}>→</span>
              <span style={{ fontSize: `${fontSize - 1}px`, fontFamily, color: MID }}
                dangerouslySetInnerHTML={{ __html: renderMath(item.body) }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKED EXAMPLE SECTION (matches ws_primitives.py worked_example_section)
// ─────────────────────────────────────────────────────────────────────────────

function WorkedExampleSection({ content, fontSize, fontFamily }: {
  content: string; fontSize: number; fontFamily: string;
}) {
  const lines = content.split("\n").filter(l => l.trim());
  const qLine = lines.find(l => /^question:/i.test(l.trim()) || /^\*\*question/i.test(l.trim()));
  const stepLines = lines.filter(l => /^step\s*\d+|^\d+\.\s/i.test(l.trim()) || /^→/.test(l.trim()));
  const otherLines = lines.filter(l => l !== qLine && !stepLines.includes(l));

  return (
    <div>
      {qLine && (
        <div style={{
          padding: "8px 12px", background: SOFT, border: `1px solid ${RULE}`,
          borderRadius: "4px", marginBottom: "10px",
          fontSize: `${fontSize}px`, fontFamily, color: MID, fontWeight: 600,
        }}
          dangerouslySetInnerHTML={{ __html: renderMath(qLine.replace(/^\*\*question:\*\*\s*/i, "").replace(/^question:\s*/i, "")) }} />
      )}
      {stepLines.map((line, i) => (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "flex-start" }}>
          <div style={{
            background: TEAL, color: WHITE, borderRadius: "4px",
            padding: "2px 8px", fontSize: `${fontSize - 2}px`, fontWeight: 700, fontFamily,
            flexShrink: 0, marginTop: "2px",
          }}>
            {i + 1}
          </div>
          <div style={{ flex: 1, fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.5" }}
            dangerouslySetInnerHTML={{ __html: renderMath(line.replace(/^step\s*\d+[:.]\s*/i, "").replace(/^→\s*/, "").replace(/^\d+\.\s*/, "")) }} />
        </div>
      ))}
      {otherLines.map((line, i) => (
        <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "6px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC CONTENT RENDERER (fallback for non-layout sections)
// ─────────────────────────────────────────────────────────────────────────────

function GenericContent({ content, fontSize, fontFamily, isTeacher }: {
  content: string; fontSize: number; fontFamily: string; isTeacher: boolean;
}) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { nodes.push(<div key={i} style={{ height: "8px" }} />); i++; continue; }

    // Numbered question lines
    if (/^\d+[.)]\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)/)?.[1] || "";
      const text = trimmed.replace(/^\d+[.)]\s*/, "");
      const markMatch = text.match(/\[(\d+)\s*marks?\]/i);
      const marks = markMatch ? parseInt(markMatch[1]) : 0;
      const cleanText = text.replace(/\[\d+\s*marks?\]/i, "").trim();
      nodes.push(
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
          <div style={{
            background: TEAL, color: WHITE, borderRadius: "50%",
            width: "24px", height: "24px", minWidth: "24px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: `${fontSize - 1}px`, fontWeight: 700, fontFamily,
          }}>
            {num}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "6px" }}
              dangerouslySetInnerHTML={{ __html: renderMath(cleanText) }} />
            {!isTeacher && <AnswerLines n={marks >= 4 ? 4 : 2} />}
          </div>
          {marks > 0 && (
            <div style={{ fontSize: `${fontSize - 2}px`, color: LIGHT, fontFamily, whiteSpace: "nowrap", paddingTop: "2px" }}>
              [{marks} mark{marks !== 1 ? "s" : ""}]
            </div>
          )}
        </div>
      );
      i++; continue;
    }

    // Bullet points
    if (/^[•\-\*]\s/.test(trimmed)) {
      nodes.push(
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "4px", alignItems: "flex-start" }}>
          <span style={{ color: TEAL, fontWeight: 700, fontSize: `${fontSize}px`, flexShrink: 0, marginTop: "1px" }}>•</span>
          <div style={{ flex: 1, fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.5" }}
            dangerouslySetInnerHTML={{ __html: renderMath(trimmed.replace(/^[•\-\*]\s*/, "")) }} />
        </div>
      );
      i++; continue;
    }

    // Default paragraph
    nodes.push(
      <div key={i} style={{ fontSize: `${fontSize}px`, fontFamily, color: MID, lineHeight: "1.6", marginBottom: "6px" }}
        dangerouslySetInnerHTML={{ __html: renderMath(trimmed) }} />
    );
    i++;
  }

  return <div>{nodes}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION RENDERER
// Wraps each section in the PDF-matching card style.
// ─────────────────────────────────────────────────────────────────────────────

function renderSection({
  section, sectionIndex, questionCounter, fontSize, fontFamily,
  isTeacher, isPrimary, primaryColourIndex, editedContent, isEditing,
  onSectionClick, editMode, hiddenSections, answerBoxSizes,
  onAnswerBoxSizeChange, onAnswerBoxRemove,
}: {
  section: WorksheetSection;
  sectionIndex: number;
  questionCounter: { value: number };
  fontSize: number;
  fontFamily: string;
  isTeacher: boolean;
  isPrimary: boolean;
  primaryColourIndex: number;
  editedContent?: string;
  isEditing?: boolean;
  onSectionClick?: (index: number) => void;
  editMode?: boolean;
  hiddenSections?: Set<number>;
  answerBoxSizes?: Record<number, number>;
  onAnswerBoxSizeChange?: (sectionIndex: number, lines: number) => void;
  onAnswerBoxRemove?: (sectionIndex: number) => void;
}): React.ReactNode {
  if (hiddenSections?.has(sectionIndex)) return null;
  if (!isTeacher && section.teacherOnly) return null;

  const content = editedContent !== undefined ? editedContent : section.content;
  const type = section.type;
  const style = getSectionStyle(type);

  // Primary school uses rotating colour palette
  const headerBg = isPrimary ? PRIMARY_COLOURS[primaryColourIndex % PRIMARY_COLOURS.length].header : style.headerBg;
  const borderColor = isPrimary ? PRIMARY_COLOURS[primaryColourIndex % PRIMARY_COLOURS.length].border : style.border;
  const bgColor = isPrimary ? PRIMARY_COLOURS[primaryColourIndex % PRIMARY_COLOURS.length].bg : style.bg;

  // Detect if this is a question section (recall/understanding/application)
  const isQuestionSection = ["recall", "understanding", "application"].includes(type);
  const isSectionHeader = isQuestionSection && !section.title.startsWith("Question");
  const isQuestionCard = isQuestionSection && section.title.startsWith("Question");

  // Extract marks from content
  const markMatch = content.match(/\[(\d+)\s*marks?\]/i);
  const marks = markMatch ? parseInt(markMatch[1]) : 0;

  // Detect layout
  const layout = detectLayout(content);

  // Handle SVG diagram
  let svgContent: string | undefined;
  let cleanContent = content;
  if (section.svg) {
    svgContent = section.svg;
  } else {
    const diagramSpec = extractDiagramSpec(content);
    if (diagramSpec) {
      svgContent = undefined; // SVGDiagram component will handle this
      cleanContent = stripDiagramMarker(content);
    }
  }

  // ── SECTION DIVIDER (Section 1/2/3 header) ──────────────────────────────
  if (isSectionHeader) {
    return (
      <div key={sectionIndex} style={{
        background: headerBg, color: WHITE,
        borderRadius: "6px", padding: "10px 16px",
        marginBottom: "12px", marginTop: "8px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        pageBreakInside: "avoid", breakInside: "avoid",
        cursor: editMode ? "pointer" : "default",
      }}
        onClick={() => editMode && onSectionClick?.(sectionIndex)}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: `${fontSize + 2}px`, fontFamily, letterSpacing: "0.02em" }}>
            {section.title}
          </div>
          {content && (
            <div style={{ fontSize: `${fontSize - 1}px`, fontFamily, opacity: 0.85, marginTop: "2px" }}
              dangerouslySetInnerHTML={{ __html: renderMath(content.replace(/\*\*/g, "")) }} />
          )}
        </div>
      </div>
    );
  }

  // ── QUESTION CARD ────────────────────────────────────────────────────────
  if (isQuestionCard) {
    const qNum = questionCounter.value++;
    const accentColor = headerBg;
    return (
      <div key={sectionIndex}
        onClick={() => editMode && onSectionClick?.(sectionIndex)}
        style={{ cursor: editMode ? "pointer" : "default", outline: isEditing ? `2px solid ${TEAL}` : "none", borderRadius: "6px" }}
      >
        <QuestionBlock
          questionNumber={qNum}
          content={cleanContent}
          layout={layout}
          marks={marks}
          fontSize={fontSize}
          fontFamily={fontFamily}
          accentColor={accentColor}
          isTeacher={isTeacher}
          hasSvg={!!svgContent}
          svgContent={svgContent}
          caption={section.caption}
        />
      </div>
    );
  }

  // ── CHALLENGE SECTION ────────────────────────────────────────────────────
  if (type === "challenge") {
    return (
      <div key={sectionIndex}
        onClick={() => editMode && onSectionClick?.(sectionIndex)}
        style={{ cursor: editMode ? "pointer" : "default", outline: isEditing ? `2px solid ${TEAL}` : "none", borderRadius: "6px" }}
      >
        <ChallengeBlock content={content} fontSize={fontSize} fontFamily={fontFamily} isTeacher={isTeacher} />
      </div>
    );
  }

  // ── SELF-REFLECTION SECTION ──────────────────────────────────────────────
  if (type === "self-reflection" || type === "self-assessment") {
    return (
      <div key={sectionIndex} style={{
        border: `1px solid ${borderColor}`, borderRadius: "6px",
        overflow: "hidden", marginBottom: "16px",
        pageBreakInside: "avoid", breakInside: "avoid",
      }}
        onClick={() => editMode && onSectionClick?.(sectionIndex)}
      >
        <SectionHeader
          title={section.title || style.label}
          headerBg={headerBg}
          headerText={WHITE}
          icon={style.icon}
          fontSize={fontSize}
          fontFamily={fontFamily}
        />
        <div style={{ padding: "14px 16px", background: bgColor }}>
          <SelfReflectionTable fontSize={fontSize} fontFamily={fontFamily} />
        </div>
      </div>
    );
  }

  // ── VOCABULARY SECTION ───────────────────────────────────────────────────
  if (type === "vocabulary") {
    return (
      <div key={sectionIndex} style={{
        border: `1px solid ${borderColor}`, borderRadius: "6px",
        overflow: "hidden", marginBottom: "16px",
        pageBreakInside: "avoid", breakInside: "avoid",
      }}
        onClick={() => editMode && onSectionClick?.(sectionIndex)}
      >
        <SectionHeader
          title={section.title || style.label}
          headerBg={headerBg}
          headerText={WHITE}
          icon={style.icon}
          fontSize={fontSize}
          fontFamily={fontFamily}
        />
        <div style={{ padding: "14px 16px", background: bgColor }}>
          <VocabularySection content={content} fontSize={fontSize} fontFamily={fontFamily} />
        </div>
      </div>
    );
  }

  // ── MISCONCEPTIONS / COMMON MISTAKES ────────────────────────────────────
  if (type === "misconceptions") {
    return (
      <div key={sectionIndex} style={{
        border: `1px solid ${borderColor}`, borderRadius: "6px",
        overflow: "hidden", marginBottom: "16px",
        pageBreakInside: "avoid", breakInside: "avoid",
      }}
        onClick={() => editMode && onSectionClick?.(sectionIndex)}
      >
        <SectionHeader
          title={section.title || style.label}
          headerBg={headerBg}
          headerText={WHITE}
          icon={style.icon}
          fontSize={fontSize}
          fontFamily={fontFamily}
        />
        <div style={{ padding: "14px 16px", background: bgColor }}>
          <MistakesSection content={content} fontSize={fontSize} fontFamily={fontFamily} />
        </div>
      </div>
    );
  }

  // ── WORKED EXAMPLE ───────────────────────────────────────────────────────
  if (type === "example") {
    return (
      <div key={sectionIndex} style={{
        border: `1px solid ${borderColor}`, borderRadius: "6px",
        overflow: "hidden", marginBottom: "16px",
        pageBreakInside: "avoid", breakInside: "avoid",
      }}
        onClick={() => editMode && onSectionClick?.(sectionIndex)}
      >
        <SectionHeader
          title={section.title || style.label}
          headerBg={headerBg}
          headerText={WHITE}
          icon={style.icon}
          fontSize={fontSize}
          fontFamily={fontFamily}
        />
        <div style={{ padding: "14px 16px", background: bgColor }}>
          <WorkedExampleSection content={content} fontSize={fontSize} fontFamily={fontFamily} />
        </div>
      </div>
    );
  }

  // ── TEACHER-ONLY SECTIONS (answers, mark-scheme, teacher-notes, extension) ──
  if (section.teacherOnly || ["answers", "mark-scheme", "teacher-notes", "extension"].includes(type)) {
    if (!isTeacher) return null;
    return (
      <div key={sectionIndex} style={{
        border: `2px solid ${RED}`, borderRadius: "6px",
        overflow: "hidden", marginBottom: "16px",
        pageBreakInside: "avoid", breakInside: "avoid",
      }}
        onClick={() => editMode && onSectionClick?.(sectionIndex)}
      >
        <div style={{ background: RED, color: WHITE, padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: 700, fontSize: `${fontSize + 1}px`, fontFamily }}>
            🔒 {section.title || style.label}
          </span>
          <span style={{ marginLeft: "auto", fontSize: `${fontSize - 2}px`, opacity: 0.8 }}>Teacher Copy Only</span>
        </div>
        <div style={{ padding: "14px 16px", background: "#fff5f5" }}>
          <GenericContent content={content} fontSize={fontSize} fontFamily={fontFamily} isTeacher={isTeacher} />
        </div>
      </div>
    );
  }

  // ── DEFAULT SECTION ──────────────────────────────────────────────────────
  return (
    <div key={sectionIndex} style={{
      border: `1px solid ${borderColor}`, borderRadius: "6px",
      overflow: "hidden", marginBottom: "16px",
      pageBreakInside: "avoid", breakInside: "avoid",
    }}
      onClick={() => editMode && onSectionClick?.(sectionIndex)}
      >
      <SectionHeader
        title={section.title || style.label}
        headerBg={headerBg}
        headerText={WHITE}
        icon={style.icon}
        marks={marks > 0 ? marks : undefined}
        fontSize={fontSize}
        fontFamily={fontFamily}
      />
      <div style={{ padding: "14px 16px", background: bgColor }}>
        {/* SVG diagram if present */}
        {section.svg && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{ border: `1px solid ${RULE}`, borderRadius: "4px", background: SOFT, padding: "8px", overflow: "hidden" }}
              dangerouslySetInnerHTML={{ __html: section.svg }} />
            {section.caption && (
              <div style={{ fontSize: `${fontSize - 2}px`, color: LIGHT, fontFamily, textAlign: "center", marginTop: "4px", fontStyle: "italic" }}>
                {section.caption}
              </div>
            )}
          </div>
        )}
        <GenericContent content={cleanContent} fontSize={fontSize} fontFamily={fontFamily} isTeacher={isTeacher} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE HEADER (matches ws_primitives.py page_header + name_date_class_row)
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle, schoolName, schoolLogoUrl, teacherName, isTeacher, fontSize, fontFamily }: {
  title: string; subtitle?: string; schoolName?: string; schoolLogoUrl?: string;
  teacherName?: string; isTeacher: boolean; fontSize: number; fontFamily: string;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Main navy header bar */}
      <div style={{
        background: isTeacher ? RED : NAVY,
        color: WHITE,
        borderRadius: "6px 6px 0 0",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}>
        {/* Left: logo + school name */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          {schoolLogoUrl && (
            <img src={schoolLogoUrl} alt="School logo" style={{ height: "40px", width: "40px", objectFit: "contain", borderRadius: "4px", background: WHITE, padding: "2px" }} />
          )}
          <div>
            {schoolName && (
              <div style={{ fontSize: `${fontSize - 2}px`, fontFamily, opacity: 0.85, fontWeight: 500 }}>
                {schoolName}
              </div>
            )}
            {isTeacher && (
              <div style={{ fontSize: `${fontSize - 2}px`, fontFamily, opacity: 0.85, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                🔒 Teacher Copy
              </div>
            )}
          </div>
        </div>
        {/* Centre: title */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: `${fontSize + 6}px`, fontFamily, letterSpacing: "0.01em", lineHeight: "1.2" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: `${fontSize - 1}px`, fontFamily, opacity: 0.85, marginTop: "4px" }}>
              {subtitle}
            </div>
          )}
        </div>
        {/* Right: Adaptly branding */}
        <div style={{ fontSize: `${fontSize - 3}px`, fontFamily, opacity: 0.7, textAlign: "right", whiteSpace: "nowrap" }}>
          <div style={{ fontWeight: 700 }}>Adaptly</div>
          <div>AI Worksheets</div>
        </div>
      </div>

      {/* Name / Date / Class row (matches ws_primitives.py name_date_class_row) */}
      <div style={{
        background: SOFT,
        border: `1px solid ${RULE}`,
        borderTop: "none",
        borderRadius: "0 0 6px 6px",
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
        flexWrap: "wrap",
      }}>
        {[
          { label: "Name", width: "160px" },
          { label: "Date", width: "100px" },
          { label: "Class", width: "100px" },
          { label: "Teacher", width: "120px" },
        ].map(({ label, width }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: `${fontSize - 1}px`, fontWeight: 700, color: NAVY, fontFamily, whiteSpace: "nowrap" }}>
              {label}:
            </span>
            <div style={{ borderBottom: `1.5px solid ${NAVY}`, width, height: "22px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND OVERLAY (coloured overlay for accessibility)
// ─────────────────────────────────────────────────────────────────────────────

function SendOverlay({ color }: { color: string }) {
  if (!color || color === "none" || color === "transparent") return null;
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none",
      background: color, opacity: 0.15, zIndex: 1000,
      mixBlendMode: "multiply",
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const WorksheetRenderer = forwardRef<HTMLDivElement, WorksheetRendererProps>(function WorksheetRenderer(
  {
    worksheet, viewMode, textSize, overlayColor,
    editedSections, onSectionClick, editMode,
    schoolName, schoolLogoUrl, teacherName,
    hiddenSections, answerBoxSizes, onAnswerBoxSizeChange, onAnswerBoxRemove,
    isRevisionMat,
  },
  ref
) {
  const isTeacher = viewMode === "teacher";
  const sendNeedId = worksheet.metadata?.sendNeedId || worksheet.metadata?.sendNeed || "";
  const fmt = getSendFormatting(sendNeedId);
  const fontSize = textSize || fmt.fontSize || 14;
  const fontFamily = fmt.fontFamily || "'Helvetica Neue', Arial, sans-serif";

  // Detect primary school
  const yg = (worksheet.metadata?.yearGroup || "").toLowerCase();
  const isPrimary = yg.includes("reception") || yg.includes("year 1") || yg.includes("year 2") ||
    yg.includes("year 3") || yg.includes("year 4") || yg.includes("year 5") || yg.includes("year 6") ||
    yg.includes("ks1") || yg.includes("ks2") || yg.includes("primary");

  // Question counter (shared across all question sections)
  const questionCounter = { value: 1 };

  // Primary colour index (increments per section)
  let primaryColourIndex = 0;

  return (
    <>
      <SendOverlay color={overlayColor} />
      <div
        ref={ref}
        className="worksheet-renderer"
        style={{
          maxWidth: "794px", // A4 width
          margin: "0 auto",
          padding: "24px",
          background: WHITE,
          fontFamily,
          fontSize: `${fontSize}px`,
          color: MID,
          lineHeight: "1.5",
          position: "relative",
        }}
      >
        {/* Page header */}
        <PageHeader
          title={worksheet.title}
          subtitle={worksheet.subtitle}
          schoolName={schoolName}
          schoolLogoUrl={schoolLogoUrl}
          teacherName={teacherName}
          isTeacher={isTeacher}
          fontSize={fontSize}
          fontFamily={fontFamily}
        />

        {/* Sections */}
        {worksheet.sections.map((section, idx) => {
          const editedContent = editedSections?.[idx];
          const isEditing = editMode && onSectionClick !== undefined;

          const node = renderSection({
            section,
            sectionIndex: idx,
            questionCounter,
            fontSize,
            fontFamily,
            isTeacher,
            isPrimary,
            primaryColourIndex: primaryColourIndex++,
            editedContent,
            isEditing,
            onSectionClick,
            editMode,
            hiddenSections,
            answerBoxSizes,
            onAnswerBoxSizeChange,
            onAnswerBoxRemove,
          });

          return node;
        })}

        {/* Footer */}
        <div style={{
          marginTop: "24px",
          paddingTop: "12px",
          borderTop: `1px solid ${RULE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: `${fontSize - 3}px`,
          color: LIGHT,
          fontFamily,
        }}>
          <div>© {new Date().getFullYear()} Adaptly Ltd — Generated by AI. Always review before use.</div>
          <div style={{ display: "flex", gap: "16px" }}>
            {worksheet.metadata?.totalMarks && (
              <span>Total: {worksheet.metadata.totalMarks} marks</span>
            )}
            {worksheet.metadata?.estimatedTime && (
              <span>⏱ {worksheet.metadata.estimatedTime}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default WorksheetRenderer;
