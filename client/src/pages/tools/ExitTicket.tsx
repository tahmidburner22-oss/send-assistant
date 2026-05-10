import DOMPurify from "dompurify";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import AIToolPage from "@/components/AIToolPage";
import { Ticket } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));

const ANSWER_KEY_SEPARATOR = "--- TEACHER ANSWER KEY ---";

// Alternative separators produced by some AI providers when they ignore the exact instruction
const FALLBACK_SEPARATORS = [
  /^-{2,}\s*teacher\s*(answer\s*key|copy|key|answers?)\s*-{0,}\s*$/im,
  /^#{1,3}\s*teacher\s*(answer\s*key|copy|key|answers?)\s*$/im,
  /^#{1,3}\s*answer\s*key\s*$/im,
  /^#{1,3}\s*mark\s*scheme\s*$/im,
];

/** Split a raw exit-ticket response into student vs teacher parts, with fallback separator detection. */
function splitExitTicket(text: string): { student: string; teacher: string | null } {
  const exact = text.indexOf(ANSWER_KEY_SEPARATOR);
  if (exact >= 0) {
    return {
      student: text.slice(0, exact).trim(),
      teacher: text.slice(exact + ANSWER_KEY_SEPARATOR.length).trim(),
    };
  }
  for (const rx of FALLBACK_SEPARATORS) {
    const m = text.match(rx);
    if (m && m.index !== undefined) {
      return {
        student: text.slice(0, m.index).trim(),
        teacher: text.slice(m.index + m[0].length).trim(),
      };
    }
  }
  return { student: text.trim(), teacher: null };
}

/** Minimal markdown → HTML conversion that also turns `[ ]` / `- [ ]` into real checkboxes. */
function mdToHtml(text: string): string {
  // Render tickbox markers that the AI produces when SEND-adapted is on
  // e.g. "- [ ] I can add fractions" → checkbox + label
  const withBoxes = text
    // list checkbox form ("- [ ] ..." or "- [x] ...")
    .replace(/^[-*•]\s*\[\s*([ xX])\s*\]\s+(.+)$/gm, (_, mark, label) => {
      const checked = /x/i.test(mark) ? "checked" : "";
      return `<label style='display:flex;align-items:flex-start;gap:8px;margin:4px 0'><input type='checkbox' ${checked} disabled style='margin-top:3px;flex-shrink:0' /><span>${label}</span></label>`;
    })
    // standalone inline "[ ]" anywhere in a line
    .replace(/\[\s*([ xX])\s*\]/g, (_, mark) => {
      const checked = /x/i.test(mark) ? "checked" : "";
      return `<input type='checkbox' ${checked} disabled style='margin:0 4px;vertical-align:middle' />`;
    });

  return withBoxes
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[-•]\s+(.+)$/gm, "<li style='margin-left:16px'>$1</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

const SANITIZE_OPTS = {
  ALLOWED_TAGS: ["strong", "em", "br", "li", "ul", "ol", "label", "input", "span", "div", "p", "h3", "h4"],
  ALLOWED_ATTR: ["style", "type", "checked", "disabled", "class"],
};

function ExitTicketOutput({ text }: { text: string }) {
  const { student, teacher } = splitExitTicket(text);

  return (
    <div className="space-y-4">
      {/* Student section */}
      <div style={{ border: "2px solid #a855f7", borderRadius: "12px", overflow: "hidden", pageBreakInside: "avoid" }}>
        <div style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 800, fontSize: "14px", color: "#fff" }}>Exit Ticket — Student Copy</div>
          <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Print & give to students</span>
        </div>
        <div
          style={{ padding: "14px 16px", background: "#faf5ff", fontSize: "13px", lineHeight: "1.7" }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mdToHtml(student), SANITIZE_OPTS) }}
        />
      </div>

      {/* Teacher answer key */}
      {teacher && (
        <div style={{ border: "2px solid #0891b2", borderRadius: "12px", overflow: "hidden", pageBreakInside: "avoid" }}>
          <div style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "#fff" }}>Teacher Answer Key</div>
            <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Do not distribute to students</span>
          </div>
          <div
            style={{ padding: "14px 16px", background: "#ecfeff", fontSize: "13px", lineHeight: "1.7" }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(mdToHtml(teacher), SANITIZE_OPTS) }}
          />
        </div>
      )}
    </div>
  );
}

export default function ExitTicket() {
  // Preferences kept for parity with other tools — currently unused after refactor
  useUserPreferences();
  return (
    <AIToolPage
      assignable={true}
      title="Exit Ticket Generator"
      description="Quick end-of-lesson checks with separate student and teacher answer key sections"
      icon={<Ticket className="w-5 h-5 text-white" />}
      accentColor="bg-fuchsia-600"
      fields={[
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "learningObjective", label: "Today's Learning Objective", type: "text", placeholder: "e.g. Understand how to add fractions with different denominators", required: true, span: "full" },
        { id: "format", label: "Format", type: "select", options: [
          { value: "3-2-1",        label: "3-2-1 (3 things learned, 2 questions, 1 connection)" },
          { value: "traffic-light", label: "Traffic Light self-assessment" },
          { value: "questions",    label: "3 quick questions" },
          { value: "thumbs",       label: "Thumbs up/middle/down + reason" },
          { value: "muddiest",     label: "Muddiest Point" },
          { value: "custom",       label: "Mixed format" },
        ], span: "half" },
        { id: "sendAdapted", label: "SEND Adapted", type: "select", options: [{ value: "yes", label: "Yes — visual supports, simple language" }, { value: "no", label: "Standard" }], span: "half" },
        { id: "numVariants", label: "Variants", type: "select", options: [{ value: "1", label: "1 version" }, { value: "2", label: "2 versions (standard + support)" }, { value: "3", label: "3 versions (support/core/extension)" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert UK teacher specialising in formative assessment. You create effective exit tickets that quickly reveal what students have understood. Exit tickets must be quick to complete (under 5 minutes), easy to mark, and give actionable information for the next lesson.`,
        user: `Create ${v.numVariants || "1"} exit ticket(s) for:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Learning Objective: ${v.learningObjective}
Format: ${v.format || "questions"}
SEND Adapted: ${v.sendAdapted === "yes" ? "Yes" : "No"}

${parseInt(v.numVariants || "1") > 1 ? `Create ${v.numVariants} differentiated versions:
- Version 1: Support (scaffolded, simpler language, visual prompts)
${parseInt(v.numVariants || "1") >= 2 ? "- Version 2: Core (standard level)" : ""}
${parseInt(v.numVariants || "1") >= 3 ? "- Version 3: Extension (deeper thinking, application)" : ""}` : ""}

Student ticket requirements:
- Name / Class / Date field at the top
- Quick to complete (max 5 minutes)
- Directly assesses the learning objective
- ${v.sendAdapted === "yes" ? "Use markdown checkbox syntax \"- [ ] option text\" for tick-box questions so they render as real checkboxes. Keep language simple and offer visual/pictorial hints where possible." : "Clear, unambiguous questions"}
- Format as a compact half-A4 slip

CRITICAL — output structure (follow EXACTLY):
1. First output the complete student-facing exit ticket(s) with NO answers embedded.
2. Then output EXACTLY this separator on its own line: ${ANSWER_KEY_SEPARATOR}
3. Then output the teacher answer key with: model answers for each question, marking guidance, and a "What to do next lesson" note based on common responses.

Do not substitute the separator. Do not wrap it in a markdown heading.`,
        maxTokens: 2000,
      })}
      outputTitle={(v) => `Exit Ticket — ${v.subject}: ${v.learningObjective}`}
      renderCustomOutput={(text) => <ExitTicketOutput text={text} />}
      transformBeforeAssign={(text) => splitExitTicket(text).student}
    />
  );
}
