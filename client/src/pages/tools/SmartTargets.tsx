import { useState, useEffect } from "react";
import AIToolPage from "@/components/AIToolPage";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import { CheckSquare } from "lucide-react";

const sendNeeds = ["Autism Spectrum Condition","ADHD","Dyslexia","Dyscalculia","Dyspraxia","Speech & Language Needs","Social, Emotional & Mental Health","Hearing Impairment","Visual Impairment","Physical Disability","Moderate Learning Difficulties","Severe Learning Difficulties","EAL"].map(n => ({ value: n, label: n }));
const areas = ["Reading","Writing","Maths","Communication","Social Skills","Behaviour & Self-Regulation","Independence","Fine Motor Skills","Gross Motor Skills","Attention & Focus","Emotional Regulation","Organisational Skills"].map(a => ({ value: a, label: a }));

// Map screener section IDs to the sendNeeds options
const SCREENER_ID_TO_SEND_NEED: Record<string, string> = {
  adhd: "ADHD",
  dyslexia: "Dyslexia",
  autism: "Autism Spectrum Condition",
  dyscalculia: "Dyscalculia",
  dyspraxia: "Dyspraxia",
  slcn: "Speech & Language Needs",
  semh: "Social, Emotional & Mental Health",
  mld: "Moderate Learning Difficulties",
};

export default function SmartTargets() {
  const { preferences } = useUserPreferences();
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check for pre-population data from SEND Screener
    const raw = sessionStorage.getItem("screener_smart_targets_prefill");
    if (raw) {
      try {
        const data = JSON.parse(raw) as { baseline: string; sendNeed: string; notes: string };
        sessionStorage.removeItem("screener_smart_targets_prefill");
        setInitialValues({
          currentLevel: data.baseline,
          sendNeed: SCREENER_ID_TO_SEND_NEED[data.sendNeed] || "",
        });
      } catch {
        // ignore malformed data
      }
    }
  }, []);

  return (
    <AIToolPage
      assignable={true}
      title="SMART Targets Generator"
      description="Generate specific, measurable, achievable SEND targets for any area of need"
      icon={<CheckSquare className="w-5 h-5 text-white" />}
      accentColor="bg-teal-600"
      initialValues={initialValues}
      fields={[
        { id: "studentName", label: "Student Initials", type: "text", placeholder: "e.g. L.C.", required: true, span: "half", maxLength: 4, hint: "Initials only (max 4 chars) — do not enter full names (GDPR)" },
        { id: "yearGroup", label: "Year Group", type: "text", placeholder: "e.g. Year 3", required: true, span: "half" },
        { id: "sendNeed", label: "SEND Need", type: "select", options: sendNeeds, required: true, span: "half" },
        { id: "area", label: "Target Area", type: "select", options: areas, required: true, span: "half" },
        { id: "currentLevel", label: "Current Level / Starting Point", type: "textarea", placeholder: "What can the student currently do? What is the baseline?", required: true, span: "full" },
        { id: "reviewPeriod", label: "Review Period", type: "select", options: [{ value: "6 weeks", label: "6 Weeks" }, { value: "1 term", label: "1 Term" }, { value: "2 terms", label: "2 Terms" }, { value: "1 year", label: "1 Year" }], span: "half" },
        { id: "numTargets", label: "Number of Targets", type: "select", options: [2,3,4,5].map(n => ({ value: String(n), label: String(n) })), span: "half" },
      ]}
        buildPrompt={(v) => ({
        system: `You are an expert SENCO with 20 years of experience writing SMART targets for pupils with SEND. You write targets that are Specific, Measurable, Achievable, Relevant, and Time-bound. You use UK SEND Code of Practice 2015 terminology and person-centred language.

SMART VALIDATION RULE — CRITICAL: Before outputting any target, mentally check it against all 5 SMART criteria:
- SPECIFIC: Does it name the exact skill, behaviour, or outcome? (Not "improve reading" — instead "read CVC words with 90% accuracy")
- MEASURABLE: Is there a number, frequency, or observable criterion? (Not "make progress" — instead "on 4 out of 5 occasions")
- ACHIEVABLE: Is it realistic given the baseline and review period? (Not a leap of 3 years in 6 weeks)
- RELEVANT: Does it directly address the identified SEND need and area?
- TIME-BOUND: Does it specify "By [review date]" or "within [review period]"?
If any criterion is missing, rewrite the target before outputting it. Never output a target that fails any SMART criterion.`,
        user: `Generate ${v.numTargets || 3} SMART targets for:
Student: ${v.studentName}
Year Group: ${v.yearGroup}
SEND Need: ${v.sendNeed}
Target Area: ${v.area}
Review Period: ${v.reviewPeriod || "1 term"}
Current Level / Baseline:
${v.currentLevel}

For each target, provide ALL of the following sections:
**Target ${1}:** [Full SMART statement — must include: specific skill, measurable criterion (number/frequency), and time-bound phrase "By [review date]" or "Within [review period]"]
**SMART Check:** [One sentence confirming: Specific ✓ Measurable ✓ Achievable ✓ Relevant ✓ Time-bound ✓ — or rewrite if any fail]
**Baseline:** [Precise current level — what the student can/cannot do now]
**Success Criteria:** [Exactly 3 measurable indicators — observable, countable evidence of achievement]
**Strategies:** [2-3 specific, evidence-based teaching/support strategies for this SEND need]
**Resources:** [Named interventions, tools, or materials — e.g. "Toe by Toe programme", "visual timer", "Word Wasp"]
**Monitoring:** [Specific frequency and method — e.g. "Weekly 5-minute probe test recorded on tracking sheet"]

Make targets ambitious yet achievable given the baseline. Use person-centred language. Ensure each target directly addresses ${v.sendNeed} in the area of ${v.area}.`,
        maxTokens: 3000,
      })}
      outputTitle={(v) => `SMART Targets — ${v.studentName} (${v.area})`}
      formatOutput={(text) => formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#0d9488", emoji: "🎯", title: "SMART Targets" })}
    />
  );
}
