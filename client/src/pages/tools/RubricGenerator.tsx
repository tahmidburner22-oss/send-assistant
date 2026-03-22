import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import { Table2 } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));

export default function RubricGenerator() {
  const { preferences } = useUserPreferences();
  return (
    <AIToolPage
      title="Rubric / Mark Scheme Generator"
      assignable={true}
      description="Create detailed assessment rubrics and mark schemes for any task"
      icon={<Table2 className="w-5 h-5 text-white" />}
      accentColor="bg-violet-600"
      fields={[
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "taskDescription", label: "Task / Assignment Description", type: "textarea", placeholder: "Describe the task students are being assessed on...", required: true, span: "full" },
        { id: "criteria", label: "Assessment Criteria (optional)", type: "textarea", placeholder: "List the criteria to assess, or leave blank for AI to generate", span: "full" },
        { id: "levels", label: "Performance Levels", type: "select", options: [{ value: "4", label: "4 levels (Below/Approaching/Meeting/Exceeding)" }, { value: "5", label: "5 levels (1-5)" }, { value: "gcse", label: "GCSE style (0-9 bands)" }, { value: "eyfs", label: "EYFS (Emerging/Expected/Exceeding)" }], span: "half" },
        { id: "format", label: "Format", type: "select", options: [{ value: "table", label: "Table (criteria × levels)" }, { value: "checklist", label: "Checklist" }, { value: "holistic", label: "Holistic descriptors" }], span: "half" },
      ]}
      buildPrompt={(v) => {
        const isGCSE = v.levels === "gcse";
        const isEYFS = v.levels === "eyfs";
        const isPrimary = /year [1-6]|ks1|ks2/i.test(v.yearGroup || "");
        const isALevel = /year 12|year 13|sixth|a.level/i.test(v.yearGroup || "");

        let levelDescriptors = "";
        if (isGCSE) {
          levelDescriptors = `Use UK GCSE marking bands. The rubric MUST use these exact grade bands as columns:
| Band | Grade | Marks |
| Level 4 (High) | Grade 7–9 | Top marks |
| Level 3 (Mid) | Grade 5–6 | Mid marks |
| Level 2 (Low) | Grade 3–4 | Lower marks |
| Level 1 (Basic) | Grade 1–2 | Lowest marks |

For each Assessment Objective (AO) criterion:
- Use the specific AO language from the exam board style (AO1: Knowledge, AO2: Application, AO3: Analysis/Evaluation, AO4: Communication where relevant)
- Descriptors must use the GCSE band language: Level 4 = "comprehensive, perceptive, sustained"; Level 3 = "clear, explained, developed"; Level 2 = "some, limited, basic"; Level 1 = "simple, isolated, minimal"
- Include typical mark allocations per AO (e.g. AO1: 4 marks, AO2: 8 marks)
- Add a "Levels of Response Mark Scheme" note explaining how to award marks holistically`;
        } else if (isEYFS) {
          levelDescriptors = `Use EYFS Development Matters language with three columns: Emerging | Expected | Exceeding. Use EYFS prime/specific areas of learning language.`;
        } else if (isALevel) {
          levelDescriptors = `Use A-Level mark scheme language with 5 levels (Level 5: 17-20 marks, Level 4: 13-16, Level 3: 9-12, Level 2: 5-8, Level 1: 1-4). Use A-Level Assessment Objective language.`;
        } else if (isPrimary) {
          levelDescriptors = `Use KS${/year [1-2]/i.test(v.yearGroup||"") ? "1" : "2"} National Curriculum attainment language. Columns: Working Towards Expected | Expected Standard | Greater Depth. Use NC programme of study language.`;
        } else {
          levelDescriptors = v.levels === "4" ? "4 columns: Below Standard | Approaching Standard | Meeting Standard | Exceeding Standard" :
                             v.levels === "5" ? "5 columns numbered 1–5 (1=lowest, 5=highest)" :
                             "Appropriate performance levels for the year group";
        }

        return {
          system: `You are an expert UK teacher, examiner, and assessment specialist with experience writing AQA, Edexcel, and OCR mark schemes. You create rubrics that are genuinely aligned to UK curriculum and exam board expectations — not generic A/B/C/D bands. Your descriptors use precise, observable language that teachers can apply consistently.`,
          user: `Create an assessment rubric/mark scheme for:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Format: ${v.format || "table"}

Task Description:
${v.taskDescription}

${v.criteria ? `Assessment Criteria to include:\n${v.criteria}` : "Generate 4–6 appropriate assessment criteria/Assessment Objectives for this task and subject."}

PERFORMANCE LEVELS — ${levelDescriptors}

Requirements:
- Each descriptor must be specific and observable (never use vague terms like "good", "excellent", or "well done")
- Descriptors must be genuinely distinguishable between adjacent levels
- Use precise UK curriculum/exam board language throughout
- Include marks or mark allocations for each criterion
- Format as a professional table: criteria as rows, levels as columns
- After the rubric, include:
  1. A "How to mark" guidance note for teachers
  2. A "What this means for students" summary in student-friendly language
  3. If GCSE: note that this is indicative — teachers must use the official exam board mark scheme for formal assessment`,
          maxTokens: 3500,
        };
      }}
      outputTitle={(v) => `${v.subject} Rubric — ${v.yearGroup}`}
      formatOutput={(text) => formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#7c3aed", emoji: "📊", title: "Rubric / Mark Scheme" })}
    />
  );
}
