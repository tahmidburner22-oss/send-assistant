/**
 * Behaviour Support Plan Tool
 * Generates a PBS plan via AI and optionally saves it to a pupil's Parent Portal.
 */
import { useState } from "react";
import AIToolPage from "@/components/AIToolPage";
import { ShieldAlert, Save, CheckCircle2, Users } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { pupils as pupilsApi } from "@/lib/api";
import { toast } from "sonner";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";

// ── Save-to-Portal widget ─────────────────────────────────────────────────────
function SaveToPupilPortal({
  result,
  values,
}: {
  result: string | null;
  values: Record<string, string>;
}) {
  const { children } = useApp();
  const [selectedPupilId, setSelectedPupilId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!result) return null;

  const handleSave = async () => {
    if (!selectedPupilId) {
      toast.error("Please select a pupil first.");
      return;
    }
    setSaving(true);
    try {
      // Short summary for the portal card (strip markdown)
      const plain = result.replace(/\*\*/g, "").replace(/#{1,3} /g, "");
      const summary = plain.slice(0, 300) + (plain.length > 300 ? "…" : "");

      // Extract strategies section
      const strategiesMatch = plain.match(
        /(?:Preventative Strategies|Teaching Replacement|Response Strategies)[^\n]*\n([\s\S]{0,500}?)(?:\n\d+\.|\n#{1,3})/i
      );
      const strategies = strategiesMatch
        ? strategiesMatch[1].trim().slice(0, 400)
        : undefined;

      // Extract positive targets / reward section
      const targetsMatch = plain.match(
        /(?:Reward|Positive Targets?|Reinforcement)[^\n]*\n([\s\S]{0,300}?)(?:\n\d+\.|\n#{1,3})/i
      );
      const positiveTargets = targetsMatch
        ? targetsMatch[1].trim().slice(0, 300)
        : undefined;

      await pupilsApi.saveSupportPlan(selectedPupilId, {
        title: `Behaviour Support Plan — ${values.studentName || "Pupil"} (${values.yearGroup || ""})`,
        content: result,
        summary,
        strategies,
        positiveTargets,
        status: "active",
        sharedWithParents: true,
      });
      setSaved(true);
      toast.success("Plan saved to Parent Portal!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save plan.");
    }
    setSaving(false);
  };

  return (
    <div className="mt-4 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-indigo-600" />
        <p className="font-semibold text-sm text-indigo-900">Save to Parent Portal</p>
      </div>
      <p className="text-xs text-indigo-700 mb-3">
        Link this plan to a pupil so it appears in their Parent Portal under "Behaviour Support Plans".
      </p>
      {saved ? (
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">Saved to Parent Portal!</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={selectedPupilId}
            onChange={(e) => setSelectedPupilId(e.target.value)}
            className="flex-1 h-10 px-3 text-sm border border-indigo-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Select pupil…</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.yearGroup})
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving || !selectedPupilId}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BehaviourPlan() {
  const { preferences } = useUserPreferences();
  const [latestResult, setLatestResult] = useState<string | null>(null);
  const [latestValues, setLatestValues] = useState<Record<string, string>>({});

  return (
    <div>
      <AIToolPage
        title="Behaviour Support Plan"
        assignable={true}
        description="Generate a structured, positive behaviour support plan for individual pupils"
        icon={<ShieldAlert className="w-5 h-5 text-white" />}
        accentColor="bg-orange-600"
        fields={[
          {
            id: "studentName",
            label: "Student Initials",
            type: "text",
            placeholder: "e.g. M.W.",
            required: true,
            span: "half",
            maxLength: 4,
            hint: "Initials only (max 4 chars) — do not enter full names (GDPR)",
          },
          {
            id: "yearGroup",
            label: "Year Group",
            type: "text",
            placeholder: "e.g. Year 6",
            required: true,
            span: "half",
          },
          {
            id: "behaviours",
            label: "Behaviours of Concern",
            type: "textarea",
            placeholder:
              "Describe the specific behaviours — what, when, how often, how severe?",
            required: true,
            span: "full",
          },
          {
            id: "triggers",
            label: "Known Triggers / Antecedents",
            type: "textarea",
            placeholder: "What tends to trigger or precede these behaviours?",
            span: "full",
          },
          {
            id: "strengths",
            label: "Student Strengths & Motivators",
            type: "textarea",
            placeholder: "What does the student enjoy? What motivates them?",
            span: "full",
          },
          {
            id: "background",
            label: "Relevant Background (optional)",
            type: "textarea",
            placeholder:
              "SEND diagnosis, home situation, previous strategies tried...",
            span: "full",
          },
          {
            id: "reviewPeriod",
            label: "Review Period",
            type: "select",
            options: [
              { value: "4 weeks", label: "4 Weeks" },
              { value: "6 weeks", label: "6 Weeks" },
              { value: "1 term", label: "1 Term" },
            ],
            span: "half",
          },
        ]}
        buildPrompt={(v) => {
          setLatestValues(v);
          return {
            system: `You are an expert SENCO and behaviour specialist with 20 years of experience in UK schools. You write positive behaviour support plans (BSPs) that are evidence-based, compassionate, and practical. You use the ABC (Antecedent-Behaviour-Consequence) framework and Positive Behaviour Support (PBS) principles. Your plans are strengths-based and focus on teaching replacement behaviours, not just managing challenging ones.`,
            user: `Create a Positive Behaviour Support Plan for:

Student: ${v.studentName}
Year Group: ${v.yearGroup}
Review Period: ${v.reviewPeriod || "6 weeks"}

Behaviours of Concern:
${v.behaviours}

${v.triggers ? `Known Triggers:\n${v.triggers}` : ""}
${v.strengths ? `Strengths & Motivators:\n${v.strengths}` : ""}
${v.background ? `Background:\n${v.background}` : ""}

IMPORTANT — The review period is "${v.reviewPeriod || "6 weeks"}". This MUST shape the entire plan:
${(v.reviewPeriod || "6 weeks") === "4 weeks" ? `- 4-week plan: This is a SHORT, FOCUSED plan. Set 1-2 very specific, immediately measurable targets only. Weekly check-ins are essential. Keep strategies to 2-3 maximum — manageable in one month. Include specific week-by-week milestones (Week 1: baseline, Week 2: introduce strategy, Week 3: monitor, Week 4: review). The plan should be concise and laser-focused.` : ""}
${(v.reviewPeriod || "6 weeks") === "6 weeks" ? `- 6-week plan: Set 2-3 focused targets. Fortnightly check-in points. Include a mid-point review note at week 3. Strategies should be established within the first 2 weeks, then consistently applied.` : ""}
${(v.reviewPeriod || "6 weeks") === "1 term" ? `- Termly plan (approximately 12 weeks): Set 3-4 targets with clear progression over the term. Include half-term review checkpoint. Strategies can be more comprehensive. Include a staged implementation timeline showing which strategies are introduced when during the term. Allow for generalisation of skills in the final phase.` : ""}

Section 10 (Monitoring & Review) MUST include:
- The specific review date (${(v.reviewPeriod || "6 weeks") === "1 term" ? "end of term" : `${v.reviewPeriod || "6 weeks"} from today`})
- ${(v.reviewPeriod || "6 weeks") === "4 weeks" ? "Weekly" : (v.reviewPeriod || "6 weeks") === "6 weeks" ? "Fortnightly" : "Half-termly"} monitoring checkpoints with specific measurable indicators
- A clear success threshold — what improvement would indicate the plan is working?

Structure the plan with these sections:
1. **Student Profile** — brief strengths-based summary
2. **Behaviour Description** — clear, objective description (avoid judgmental language)
3. **Function of Behaviour** — what need is the behaviour meeting? (attention, escape, sensory, tangible)
4. **Triggers & Warning Signs** — early indicators and antecedents
5. **Preventative Strategies** — environmental and proactive changes to reduce triggers
6. **Teaching Replacement Behaviours** — what to teach instead, with specific strategies
7. **Response Strategies** — how staff should respond when behaviour occurs (de-escalation steps)
8. **Reward & Reinforcement System** — personalised to student's motivators
9. **Crisis Response** — if behaviour escalates, clear step-by-step protocol
10. **Monitoring & Review** — review date, ${(v.reviewPeriod || "6 weeks") === "4 weeks" ? "weekly" : (v.reviewPeriod || "6 weeks") === "6 weeks" ? "fortnightly" : "half-termly"} check-in schedule, success indicators
11. **Roles & Responsibilities** — who does what
12. **Communication with Family** — how parents/carers will be kept informed

Use positive, strengths-based language throughout. Be specific and practical. Calibrate the depth and number of strategies to the ${v.reviewPeriod || "6 weeks"} review period — shorter plans need fewer, sharper targets.`,
            maxTokens: 3500,
          };
        }}
        onResult={(text, vals) => {
          setLatestResult(text);
          setLatestValues(vals);
        }}
        outputTitle={(v) =>
          `Behaviour Support Plan — ${v.studentName} (${v.yearGroup})`
        }
        formatOutput={(text) => formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#ea580c", emoji: "⚡", title: "Behaviour Support Plan" })}
      />
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <SaveToPupilPortal result={latestResult} values={latestValues} />
      </div>
    </div>
  );
}
