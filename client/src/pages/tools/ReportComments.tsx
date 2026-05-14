import { useState } from "react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import { ReportCommentsBatch } from "@/components/ReportCommentsBatch";
import { FileCheck, Users } from "lucide-react";
import {
  SUBJECTS_WITH_OVERALL as subjects,
  YEAR_GROUPS as years,
  ATTAINMENT_LEVELS as attainments,
  TONES_REPORT as tones,
} from "@/lib/tool-vocab";

export default function ReportComments() {
  const { preferences } = useUserPreferences();
  const [mode, setMode] = useState<"single" | "batch">("single");

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            mode === "single" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 inline mr-1.5" />Single Student
        </button>
        <button
          onClick={() => setMode("batch")}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            mode === "batch" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-3.5 h-3.5 inline mr-1.5" />Batch Mode (Whole Class)
        </button>
      </div>

      {mode === "batch" ? (
        <ReportCommentsBatch />
      ) : (
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

You never use tired clichés like "works hard", "is a pleasure to teach", "could try harder", or "has potential" without specific evidence.

BIAS DETECTION — CRITICAL: Before outputting any comment, scan it for the following and remove or rewrite:
- Gendered language stereotypes (e.g. "boys will be boys", "naturally gifted at maths" for boys, "naturally gifted at English" for girls)
- Ability labels that could be stigmatising (e.g. "low ability", "weak", "slow", "bright" without evidence)
- Effort-shaming language (e.g. "if only they tried harder", "lacks motivation" without evidence)
- Comparisons to other students (never compare to peers)
- Language that attributes achievement to innate ability rather than effort and strategy
- Any phrase that could be read as dismissive of a student's genuine effort
Instead: attribute success to specific strategies, effort, and practice; frame targets as next steps, not deficits.`,
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
      )}
    </div>
  );
}
