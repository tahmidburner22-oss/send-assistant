import AIToolPage from "@/components/AIToolPage";
import { Target } from "lucide-react";

const yearGroups = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));
const sendNeeds = ["Autism Spectrum Condition","ADHD","Dyslexia","Dyscalculia","Dyspraxia","Speech & Language Needs","Social, Emotional & Mental Health","Hearing Impairment","Visual Impairment","Physical Disability","Moderate Learning Difficulties","Severe Learning Difficulties","Complex Needs","EAL"].map(n => ({ value: n, label: n }));
const areas = ["Communication & Interaction","Cognition & Learning","Social, Emotional & Mental Health","Sensory & Physical"].map(a => ({ value: a, label: a }));

export default function IEPGenerator() {
  return (
    <AIToolPage
      title="IEP / EHCP Goals Generator"
      description="Generate SMART, legally-compliant IEP and EHCP targets tailored to each pupil's needs"
      icon={<Target className="w-5 h-5 text-white" />}
      accentColor="bg-purple-600"
      fields={[
        { id: "studentName", label: "Student Name", type: "text", placeholder: "e.g. Jamie Smith", required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: yearGroups, required: true, span: "half" },
        { id: "sendNeed", label: "Primary SEND Need", type: "select", options: sendNeeds, required: true, span: "half" },
        { id: "area", label: "Area of Need (EHCP)", type: "select", options: areas, required: true, span: "half" },
        { id: "currentLevel", label: "Current Level / Baseline", type: "textarea", placeholder: "Describe current attainment, strengths, and difficulties...", required: true, span: "full" },
        { id: "aspirations", label: "Student / Parent Aspirations (optional)", type: "textarea", placeholder: "What does the student/family want to achieve?", span: "full" },
        { id: "numGoals", label: "Number of Goals", type: "select", options: [3,4,5,6].map(n => ({ value: String(n), label: String(n) })), span: "half" },
        { id: "termLength", label: "Review Period", type: "select", options: [{ value: "1 term", label: "1 Term" }, { value: "2 terms", label: "2 Terms" }, { value: "1 year", label: "1 Year" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert SENCO and educational psychologist with 20 years of experience writing IEPs and EHCPs in UK schools. You write SMART targets that are specific, measurable, achievable, relevant, and time-bound. You use UK SEND Code of Practice 2015 terminology. Your goals are aspirational yet realistic, and always person-centred.`,
        user: `Generate ${v.numGoals || 4} SMART IEP/EHCP goals for:

Student: ${v.studentName}
Year Group: ${v.yearGroup}
Primary SEND Need: ${v.sendNeed}
EHCP Area of Need: ${v.area}
Review Period: ${v.termLength || "1 term"}

Current Level / Baseline:
${v.currentLevel}

${v.aspirations ? `Student/Family Aspirations:\n${v.aspirations}` : ""}

For each goal provide:
1. **Goal Statement** — clear, SMART target
2. **Success Criteria** — 3 measurable indicators of achievement
3. **Strategies & Provision** — specific interventions, resources, and adult support
4. **Monitoring** — how and how often progress will be tracked
5. **Responsible Person** — who will lead this target (SENCO, class teacher, TA, specialist)

Format each goal clearly with headers. Use UK SEND Code of Practice language. Make goals ambitious but achievable within the review period.`,
        maxTokens: 3000,
      })}
      outputTitle={(v) => `IEP Goals — ${v.studentName} (${v.yearGroup})`}
    />
  );
}
