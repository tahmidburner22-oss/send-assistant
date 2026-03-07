import AIToolPage from "@/components/AIToolPage";
import { FileCheck } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama","Overall Progress"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));
const attainments = [{ value: "exceeding", label: "Exceeding / Above Expected" }, { value: "expected", label: "Meeting Expected" }, { value: "below", label: "Below Expected" }, { value: "significant-progress", label: "Significant Progress Made" }];
const tones = [{ value: "positive", label: "Positive & Encouraging" }, { value: "balanced", label: "Balanced (strengths + targets)" }, { value: "concern", label: "Raising Concern Sensitively" }];

export default function ReportComments() {
  return (
    <AIToolPage
      title="Report Card Comments"
      description="Generate professional, personalised school report comments in seconds"
      icon={<FileCheck className="w-5 h-5 text-white" />}
      accentColor="bg-emerald-600"
      fields={[
        { id: "studentName", label: "Student Name", type: "text", placeholder: "e.g. Emma Johnson", required: true, span: "half" },
        { id: "pronoun", label: "Pronoun", type: "select", options: [{ value: "She/her", label: "She/her" }, { value: "He/him", label: "He/him" }, { value: "They/them", label: "They/them" }], required: true, span: "half" },
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "attainment", label: "Attainment Level", type: "select", options: attainments, required: true, span: "half" },
        { id: "tone", label: "Tone", type: "select", options: tones, span: "half" },
        { id: "strengths", label: "Key Strengths / Achievements", type: "textarea", placeholder: "What has this student done well?", required: true, span: "full" },
        { id: "targets", label: "Areas for Development / Targets", type: "textarea", placeholder: "What should they work on next?", span: "full" },
        { id: "wordCount", label: "Word Count", type: "select", options: [{ value: "50", label: "~50 words" }, { value: "100", label: "~100 words" }, { value: "150", label: "~150 words" }, { value: "200", label: "~200 words" }], span: "half" },
        { id: "numVariants", label: "Number of Variants", type: "select", options: [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an experienced UK primary/secondary school teacher writing professional school report comments. Your comments are personalised, specific, positive, and professional. You avoid generic phrases like "works hard" without context. You use the student's name and specific examples. Comments are parent-friendly — clear, warm, and informative.`,
        user: `Write ${v.numVariants || 1} school report comment(s) for:

Student: ${v.studentName} (${v.pronoun})
Subject: ${v.subject}
Year Group: ${v.yearGroup}
Attainment: ${v.attainment}
Tone: ${v.tone || "balanced"}
Target word count: ~${v.wordCount || 100} words each

Strengths / Achievements:
${v.strengths}

${v.targets ? `Areas for Development:\n${v.targets}` : ""}

Requirements:
- Start with the student's first name
- Be specific — reference actual skills, topics, or behaviours
- Use ${v.pronoun.split("/")[0]} pronouns
- Include a forward-looking target or next step
- Professional but warm tone suitable for parents
- No clichés or filler phrases
${v.numVariants && parseInt(v.numVariants) > 1 ? `\nLabel each variant as "Option 1:", "Option 2:", etc.` : ""}`,
        maxTokens: 1500,
      })}
      outputTitle={(v) => `Report Comments — ${v.studentName} (${v.subject})`}
    />
  );
}
