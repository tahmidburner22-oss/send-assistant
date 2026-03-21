import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import { FileCheck } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama","Business Studies","Economics","Psychology","Sociology","Physical Education","Overall Progress / Form Tutor"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));
const attainments = [
  { value: "exceeding", label: "Exceeding / Above Expected" },
  { value: "expected", label: "Meeting Expected" },
  { value: "approaching", label: "Approaching Expected" },
  { value: "below", label: "Below Expected" },
  { value: "significant-progress", label: "Significant Progress Made" },
  { value: "exceptional", label: "Exceptional / Outstanding" },
];
const tones = [
  { value: "positive", label: "Positive & Encouraging" },
  { value: "balanced", label: "Balanced (strengths + targets)" },
  { value: "concern", label: "Raising Concern Sensitively" },
  { value: "celebration", label: "Celebrating Achievement" },
];

export default function ReportComments() {
  const { preferences } = useUserPreferences();
  return (
    <AIToolPage
      title="Report Card Comments"
      assignable={true}
      description="Generate professional, personalised, parent-ready school report comments"
      icon={<FileCheck className="w-5 h-5 text-white" />}
      accentColor="bg-emerald-600"
      fields={[
        { id: "studentName", label: "Student Initials", type: "text", placeholder: "e.g. E.J.", required: true, span: "half", maxLength: 4, hint: "Initials only (max 4 chars) — GDPR compliance" },
        { id: "pronoun", label: "Pronoun", type: "select", options: [{ value: "She/her", label: "She/her" }, { value: "He/him", label: "He/him" }, { value: "They/them", label: "They/them" }], required: true, span: "half" },
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "attainment", label: "Attainment Level", type: "select", options: attainments, required: true, span: "half" },
        { id: "tone", label: "Tone", type: "select", options: tones, span: "half" },
        { id: "strengths", label: "Key Strengths / Achievements", type: "textarea", placeholder: "Be specific: topics mastered, skills demonstrated, improvements shown, notable work produced", required: true, span: "full" },
        { id: "targets", label: "Areas for Development / Next Steps", type: "textarea", placeholder: "Specific, actionable targets — what should they focus on to improve?", span: "full" },
        { id: "context", label: "Additional Context (optional)", type: "text", placeholder: "e.g. Joined mid-year, overcame illness, significant effort shown", span: "full" },
        { id: "wordCount", label: "Word Count", type: "select", options: [{ value: "50", label: "~50 words (brief)" }, { value: "75", label: "~75 words" }, { value: "100", label: "~100 words (standard)" }, { value: "150", label: "~150 words (detailed)" }, { value: "200", label: "~200 words (comprehensive)" }], span: "half" },
        { id: "numVariants", label: "Number of Variants", type: "select", options: [{ value: "1", label: "1 version" }, { value: "2", label: "2 versions" }, { value: "3", label: "3 versions" }], span: "half" },
      ]}
      buildPrompt={(v) => {
        const subjectPronoun = v.pronoun?.split("/")[0] || "they";
        const objectPronoun  = v.pronoun?.split("/")[1] || "them";
        const possessivePronoun = subjectPronoun === "she" ? "her" : subjectPronoun === "he" ? "his" : "their";
        return {
        system: `You are a highly experienced UK school teacher and report writer with 20+ years of experience writing professional school report comments. You are known for writing comments that are:

- **Specific and evidence-based**: Every claim references actual skills, topics, or behaviours — never vague generalisations
- **Genuinely personalised**: Each comment feels written for this individual student, not a template
- **Parent-accessible**: Clear, warm, professional language that parents can understand and act on
- **Constructively forward-looking**: Targets are specific, achievable, and motivating
- **Legally compliant**: GDPR-aware, no full names, no sensitive information
- **Grammatically impeccable**: Perfect spelling, grammar, and punctuation throughout

PRONOUN RULE — CRITICAL: This student uses ${subjectPronoun}/${objectPronoun} pronouns. Every single sentence in every comment MUST use "${subjectPronoun}" (subject), "${objectPronoun}" (object), and "${possessivePronoun}" (possessive) exclusively. Never use he, she, they, him, her, them, his, hers, or their unless it matches the specified pronoun. Before outputting, mentally re-read every sentence and replace any incorrect pronoun.

You never use tired clichés like "works hard", "is a pleasure to teach", "could try harder", or "has potential" without specific evidence.`,
        user: `Write ${v.numVariants || 1} professional school report comment(s) for:

**Student:** ${v.studentName} (pronouns: ${subjectPronoun}/${objectPronoun})
**Subject:** ${v.subject}
**Year Group:** ${v.yearGroup}
**Attainment Level:** ${v.attainment}
**Tone:** ${v.tone || "balanced"}
**Target Length:** approximately ${v.wordCount || 100} words per comment
${v.context ? `**Context:** ${v.context}` : ""}

**Strengths / Achievements:**
${v.strengths}

${v.targets ? `**Areas for Development / Targets:**\n${v.targets}` : ""}

**Requirements for each comment:**
1. Open with the student's initials (${v.studentName}) and a specific, genuine strength
2. Reference specific topics, skills, or work from the information provided
3. Use ONLY ${subjectPronoun}/${objectPronoun}/${possessivePronoun} pronouns — not he/she/they/them/his/her/their unless they match
4. Include a concrete, actionable next step (not vague advice)
5. Close with a forward-looking, motivating statement
6. Maintain a ${v.tone || "balanced"} tone throughout
7. Aim for exactly ~${v.wordCount || 100} words
8. Every sentence must add value — cut anything generic or filler

${v.numVariants && parseInt(v.numVariants) > 1 ? `Provide ${v.numVariants} distinct variants, each with a different opening, phrasing, and emphasis. Label them:\n**Option 1:**\n**Option 2:**\n${parseInt(v.numVariants) >= 3 ? "**Option 3:**" : ""}` : ""}

Write only the comment text — no preamble, no explanation, no notes.`,
        maxTokens: 2000,
        };
      }}
      outputTitle={(v) => `Report Comments — ${v.studentName} (${v.subject}, ${v.yearGroup})`}
      formatOutput={(text) => formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#059669", emoji: "📋", title: "Report Comments" })}
    />
  );
}
