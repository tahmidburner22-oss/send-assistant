import AIToolPage from "@/components/AIToolPage";
import { Ticket } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));

export default function ExitTicket() {
  return (
    <AIToolPage
      assignable={true}
      title="Exit Ticket Generator"
      description="Create quick end-of-lesson checks to assess understanding in under 5 minutes"
      icon={<Ticket className="w-5 h-5 text-white" />}
      accentColor="bg-fuchsia-600"
      fields={[
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "learningObjective", label: "Today's Learning Objective", type: "text", placeholder: "e.g. Understand how to add fractions with different denominators", required: true, span: "full" },
        { id: "format", label: "Format", type: "select", options: [{ value: "3-2-1", label: "3-2-1 (3 things learned, 2 questions, 1 connection)" }, { value: "traffic-light", label: "Traffic Light self-assessment" }, { value: "questions", label: "3 quick questions" }, { value: "thumbs", label: "Thumbs up/middle/down + reason" }, { value: "muddiest", label: "Muddiest Point" }, { value: "custom", label: "Mixed format" }], span: "half" },
        { id: "sendAdapted", label: "SEND Adapted", type: "select", options: [{ value: "yes", label: "Yes — visual supports, simple language" }, { value: "no", label: "Standard" }], span: "half" },
        { id: "numVariants", label: "Variants (for differentiation)", type: "select", options: [{ value: "1", label: "1 version" }, { value: "2", label: "2 versions (standard + support)" }, { value: "3", label: "3 versions (support/core/extension)" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert UK teacher specialising in formative assessment. You create effective exit tickets that quickly reveal what students have understood and what they haven't. Your exit tickets are quick to complete (under 5 minutes), easy to mark, and give actionable information for the next lesson.`,
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

Requirements:
- Quick to complete (max 5 minutes)
- Directly assesses the learning objective
- Easy for teacher to scan and assess quickly
- Include a student name/class/date field at the top
- ${v.sendAdapted === "yes" ? "Use visual supports (tick boxes, smiley faces, simple language)" : ""}
- After the exit ticket(s), include a brief "What to do with responses" note for the teacher

Format it as a ready-to-print slip (it should be compact — half an A4 page).`,
        maxTokens: 1500,
      })}
      outputTitle={(v) => `Exit Ticket — ${v.subject}: ${v.learningObjective}`}
    />
  );
}
