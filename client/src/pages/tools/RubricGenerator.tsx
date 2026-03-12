import AIToolPage from "@/components/AIToolPage";
import { Table2 } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));

export default function RubricGenerator() {
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
      buildPrompt={(v) => ({
        system: `You are an expert UK teacher and assessment specialist. You create clear, fair, and detailed assessment rubrics that help teachers mark consistently and help students understand what is expected of them. Your rubrics are aligned to UK curriculum expectations and use clear, student-friendly language.`,
        user: `Create an assessment rubric for:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Performance Levels: ${v.levels || "4"}
Format: ${v.format || "table"}

Task Description:
${v.taskDescription}

${v.criteria ? `Assessment Criteria:\n${v.criteria}` : "Generate appropriate assessment criteria for this task."}

Requirements:
- Create 4-6 clear assessment criteria if not provided
- For each criterion, write clear descriptors for each performance level
- Use specific, observable language (not vague terms like "good" or "excellent")
- Include marks/weighting for each criterion if appropriate
- Make descriptors genuinely distinguishable between levels
- Use UK curriculum language and expectations
- Format as a clear table with criteria as rows and performance levels as columns
- After the rubric, include a brief "How to Use This Rubric" note for teachers`,
        maxTokens: 3000,
      })}
      outputTitle={(v) => `${v.subject} Rubric — ${v.yearGroup}`}
    />
  );
}
