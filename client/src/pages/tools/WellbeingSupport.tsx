import { useState } from "react";
import AIToolPage from "@/components/AIToolPage";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import { Heart, AlertTriangle, Phone, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const concerns = ["Anxiety","Low mood / depression","Bereavement","Friendship difficulties","Bullying","School refusal","Self-harm (risk)","Trauma","Family breakdown","Transition anxiety","Low self-esteem","Anger management","Social isolation","Eating concerns","Sleep difficulties","Academic pressure"].map(c => ({ value: c, label: c }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));

/**
 * Full-screen safeguarding checkpoint shown when "Urgent — significant concern" is selected.
 * Must be cleared BEFORE any AI document generation begins.
 */
function SafeguardingCheckpoint({ onConfirmed, onBack }: { onConfirmed: () => void; onBack: () => void }) {
  const [dslInformed, setDslInformed]   = useState(false);
  const [recordMade, setRecordMade]     = useState(false);
  const [parentsConsidered, setParentsConsidered] = useState(false);

  const allChecked = dslInformed && recordMade && parentsConsidered;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-900">Safeguarding Checkpoint</h2>
            <p className="text-sm text-red-700 mt-1">
              You have indicated an <strong>urgent significant concern</strong>. Before generating any document,
              please complete the steps below. If a child is in immediate danger, call 999 or contact your local authority's
              children's social care duty line immediately.
            </p>
          </div>
        </div>

        {/* Emergency contacts */}
        <div className="rounded-xl bg-white border border-red-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">Key contacts</p>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span><strong>Emergency:</strong> 999</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span><strong>NSPCC Helpline:</strong> 0808 800 5000 (free, 24/7)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span><strong>Childline:</strong> 0800 1111 (for children)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span><strong>Local MASH / Children's Social Care:</strong> contact your school's DSL for your authority's duty line number</span>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-red-800">Confirm before continuing:</p>

          {[
            { id: "dsl", label: "I have informed (or am about to inform) my Designated Safeguarding Lead (DSL) about this concern.", checked: dslInformed, set: setDslInformed },
            { id: "record", label: "I have made or will make a written record of the concern using my school's safeguarding recording process.", checked: recordMade, set: setRecordMade },
            { id: "parents", label: "I have considered whether it is safe and appropriate to inform parents/carers at this stage (some disclosures must NOT be shared with parents — check with DSL).", checked: parentsConsidered, set: setParentsConsidered },
          ].map(item => (
            <label key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${item.checked ? "border-green-400 bg-green-50" : "border-gray-200 bg-white hover:border-red-300"}`}>
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${item.checked ? "bg-green-500" : "border-2 border-gray-300"}`}
                   onClick={() => item.set(!item.checked)}>
                {item.checked && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <span className="text-sm text-gray-700 leading-snug" onClick={() => item.set(!item.checked)}>{item.label}</span>
            </label>
          ))}
        </div>

        <p className="text-xs text-red-600 italic">
          This tool can help you generate referral summaries and support documents. It does not replace your school's
          safeguarding procedures under KCSIE. Your DSL is the primary point of contact for any safeguarding concern.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button
            onClick={onConfirmed}
            disabled={!allChecked}
            className={`flex-1 font-semibold ${allChecked ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            DSL informed — continue to document
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WellbeingSupport() {
  const { preferences } = useUserPreferences();
  const [urgency, setUrgency] = useState("monitoring");
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointCleared, setCheckpointCleared] = useState(false);
  const [pendingValues, setPendingValues] = useState<Record<string, string> | null>(null);

  // If urgent is selected and checkpoint not yet cleared, intercept
  if (showCheckpoint && !checkpointCleared) {
    return (
      <SafeguardingCheckpoint
        onConfirmed={() => { setCheckpointCleared(true); setShowCheckpoint(false); }}
        onBack={() => { setShowCheckpoint(false); setUrgency("monitoring"); }}
      />
    );
  }

  return (
    <AIToolPage
      assignable={true}
      title="Wellbeing Support Generator"
      description="Generate evidence-based wellbeing strategies, scripts, and support plans"
      icon={<Heart className="w-5 h-5 text-white" />}
      accentColor="bg-rose-600"
      fields={[
        { id: "concern", label: "Wellbeing Concern", type: "select", options: concerns, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "context", label: "Context / Situation", type: "textarea", placeholder: "Describe the situation, what you've observed, any relevant background...", required: true, span: "full" },
        { id: "outputType", label: "What Do You Need?", type: "select", options: [
          { value: "strategies", label: "Classroom strategies for teacher" },
          { value: "script",     label: "Conversation script for talking to student" },
          { value: "plan",       label: "Wellbeing support plan" },
          { value: "parent-letter", label: "Letter to parents" },
          { value: "referral",   label: "Referral summary" },
        ], required: true, span: "half" },
        { id: "urgency", label: "Urgency Level", type: "select", options: [
          { value: "monitoring",  label: "Monitoring — low level concern" },
          { value: "early-help",  label: "Early help — needs support" },
          { value: "urgent",      label: "Urgent — significant concern (safeguarding checkpoint required)" },
        ], span: "half",
          // Use onChange to intercept urgent selection
          onChange: (val: string) => {
            setUrgency(val);
            if (val === "urgent" && !checkpointCleared) {
              setShowCheckpoint(true);
            }
          },
        },
      ]}
      buildPrompt={(v) => {
        // Double-check: if urgency is urgent and checkpoint wasn't cleared, refuse silently
        if (v.urgency === "urgent" && !checkpointCleared) {
          setShowCheckpoint(true);
          return { system: "", user: "", maxTokens: 1 };
        }
        return {
          system: `You are an experienced UK school pastoral lead, SENCO, and mental health first aider. You provide evidence-based, trauma-informed wellbeing support guidance. You follow UK safeguarding procedures, KCSIE (Keeping Children Safe in Education), and the Mental Health in Schools guidance. You always signpost to appropriate professional services. You never provide clinical diagnoses or replace professional mental health support.`,
          user: `Generate wellbeing support guidance for:

Concern: ${v.concern}
Year Group: ${v.yearGroup}
Urgency: ${v.urgency || "monitoring"}
Output Type: ${v.outputType}

Context:
${v.context}

${v.outputType === "strategies" ? `Provide:
1. **Immediate classroom strategies** (what the teacher can do now)
2. **Environmental adjustments** (changes to the learning environment)
3. **Communication strategies** (how to talk to and support the student)
4. **Monitoring** (what to watch for, how to track progress)
5. **When to escalate** (clear indicators to refer to SENCO/pastoral lead)
6. **Signposting** (relevant resources, organisations, helplines)` : ""}
${v.outputType === "script" ? `Write a sensitive, age-appropriate conversation script for a teacher checking in with this student. Include opening, key open questions, active listening prompts, responses to different answers, how to close, and what to do after (record, refer, follow up).` : ""}
${v.outputType === "plan" ? `Create a structured wellbeing support plan: student profile (anonymised), identified needs, support strategies, roles and responsibilities, review schedule, and escalation pathway.` : ""}
${v.outputType === "parent-letter" ? "Write a sensitive, professional letter to parents/carers about the concern and the school's support approach." : ""}
${v.outputType === "referral" ? "Write a professional referral summary suitable for CAMHS, school counsellor, or external agency. Include presenting concerns, background, interventions tried, and reason for referral." : ""}

${v.urgency === "urgent" ? `**SAFEGUARDING NOTE:** This has been flagged as an urgent significant concern. The DSL has been informed. Include at the top of this document: a clear safeguarding header, reminder that this document must be stored securely per your school's safeguarding policy, and the NSPCC helpline (0808 800 5000).` : ""}

Always signpost to professional services. This guidance supports but does not replace professional mental health support.`,
          maxTokens: 2500,
        };
      }}
      outputTitle={(v) => `Wellbeing Support — ${v.concern} (${v.yearGroup})`}
      formatOutput={(text) => formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#e11d48", emoji: "❤️", title: "Wellbeing Support" })}
    />
  );
}
