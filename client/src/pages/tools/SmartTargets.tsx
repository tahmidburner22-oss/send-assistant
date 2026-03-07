import AIToolPage from "@/components/AIToolPage";
import { CheckSquare } from "lucide-react";

const sendNeeds = ["Autism Spectrum Condition","ADHD","Dyslexia","Dyscalculia","Dyspraxia","Speech & Language Needs","Social, Emotional & Mental Health","Hearing Impairment","Visual Impairment","Physical Disability","Moderate Learning Difficulties","Severe Learning Difficulties","EAL"].map(n => ({ value: n, label: n }));
const areas = ["Reading","Writing","Maths","Communication","Social Skills","Behaviour & Self-Regulation","Independence","Fine Motor Skills","Gross Motor Skills","Attention & Focus","Emotional Regulation","Organisational Skills"].map(a => ({ value: a, label: a }));

export default function SmartTargets() {
  return (
    <AIToolPage
      title="SMART Targets Generator"
      description="Generate specific, measurable, achievable SEND targets for any area of need"
      icon={<CheckSquare className="w-5 h-5 text-white" />}
      accentColor="bg-teal-600"
      fields={[
        { id: "studentName", label: "Student Name", type: "text", placeholder: "e.g. Lily Chen", required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "text", placeholder: "e.g. Year 3", required: true, span: "half" },
        { id: "sendNeed", label: "SEND Need", type: "select", options: sendNeeds, required: true, span: "half" },
        { id: "area", label: "Target Area", type: "select", options: areas, required: true, span: "half" },
        { id: "currentLevel", label: "Current Level / Starting Point", type: "textarea", placeholder: "What can the student currently do? What is the baseline?", required: true, span: "full" },
        { id: "reviewPeriod", label: "Review Period", type: "select", options: [{ value: "6 weeks", label: "6 Weeks" }, { value: "1 term", label: "1 Term" }, { value: "2 terms", label: "2 Terms" }, { value: "1 year", label: "1 Year" }], span: "half" },
        { id: "numTargets", label: "Number of Targets", type: "select", options: [2,3,4,5].map(n => ({ value: String(n), label: String(n) })), span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert SENCO with 20 years of experience writing SMART targets for pupils with SEND. You write targets that are Specific, Measurable, Achievable, Relevant, and Time-bound. You use UK SEND Code of Practice 2015 terminology and person-centred language.`,
        user: `Generate ${v.numTargets || 3} SMART targets for:

Student: ${v.studentName}
Year Group: ${v.yearGroup}
SEND Need: ${v.sendNeed}
Target Area: ${v.area}
Review Period: ${v.reviewPeriod || "1 term"}

Current Level / Baseline:
${v.currentLevel}

For each target provide:
**Target:** [SMART statement — specific, measurable, time-bound]
**Baseline:** [Where the student is now]
**Success Criteria:** [3 measurable indicators — what does achievement look like?]
**Strategies:** [2-3 specific teaching/support strategies]
**Resources:** [Materials, interventions, or tools needed]
**Monitoring:** [How often and how progress will be tracked]

Make targets ambitious yet achievable. Use pupil-friendly language where possible. Ensure each target directly addresses the identified need.`,
        maxTokens: 2500,
      })}
      outputTitle={(v) => `SMART Targets — ${v.studentName} (${v.area})`}
    />
  );
}
