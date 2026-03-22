import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import { Ticket } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));

const ANSWER_KEY_SEPARATOR = "--- TEACHER ANSWER KEY ---";

function mdToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[-•]\s+(.+)$/gm, "<li style='margin-left:16px'>$1</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

function ExitTicketOutput({ text, logoUrl, schoolName }: { text: string; logoUrl?: string; schoolName?: string }) {
  const sepIdx = text.indexOf(ANSWER_KEY_SEPARATOR);
  const studentPart = sepIdx >= 0 ? text.slice(0, sepIdx).trim() : text.trim();
  const answerPart  = sepIdx >= 0 ? text.slice(sepIdx + ANSWER_KEY_SEPARATOR.length).trim() : null;

  return (
    <div className="space-y-4">
      {/* Student section */}
      <div style={{ border: "2px solid #a855f7", borderRadius: "12px", overflow: "hidden", pageBreakInside: "avoid" }}>
        <div style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 800, fontSize: "14px", color: "#fff" }}>Exit Ticket — Student Copy</div>
          <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Print & give to students</span>
        </div>
        <div style={{ padding: "14px 16px", background: "#faf5ff", fontSize: "13px", lineHeight: "1.7" }}
             dangerouslySetInnerHTML={{ __html: mdToHtml(studentPart) }} />
      </div>

      {/* Teacher answer key */}
      {answerPart && (
        <div style={{ border: "2px solid #0891b2", borderRadius: "12px", overflow: "hidden", pageBreakInside: "avoid" }}>
          <div style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "#fff" }}>Teacher Answer Key</div>
            <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Do not distribute to students</span>
          </div>
          <div style={{ padding: "14px 16px", background: "#ecfeff", fontSize: "13px", lineHeight: "1.7" }}
               dangerouslySetInnerHTML={{ __html: mdToHtml(answerPart) }} />
        </div>
      )}
    </div>
  );
}

export default function ExitTicket() {
  const { preferences } = useUserPreferences();
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
- ${v.sendAdapted === "yes" ? "Visual supports (tick boxes, simple language)" : "Clear, unambiguous questions"}
- Format as a compact half-A4 slip

IMPORTANT — output structure:
First output the complete student-facing exit ticket(s) with NO answers embedded.
Then output EXACTLY this separator on its own line: ${ANSWER_KEY_SEPARATOR}
Then output the teacher answer key with: model answers for each question, marking guidance, and a "What to do next lesson" note based on common responses.`,
        maxTokens: 2000,
      })}
      outputTitle={(v) => `Exit Ticket — ${v.subject}: ${v.learningObjective}`}
      formatOutput={(text) => {
        // Check for our separator — if present, use the custom split renderer
        if (text.includes(ANSWER_KEY_SEPARATOR)) {
          return `<div data-exit-ticket="${encodeURIComponent(text)}"></div>`;
        }
        return formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#c026d3", emoji: "🎫", title: "Exit Ticket" });
      }}
    />
  );
}
