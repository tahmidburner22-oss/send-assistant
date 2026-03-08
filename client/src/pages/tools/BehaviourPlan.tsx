import AIToolPage from "@/components/AIToolPage";
import { ShieldAlert } from "lucide-react";

export default function BehaviourPlan() {
  return (
    <AIToolPage
      title="Behaviour Support Plan"
      description="Generate a structured, positive behaviour support plan for individual pupils"
      icon={<ShieldAlert className="w-5 h-5 text-white" />}
      accentColor="bg-orange-600"
      fields={[
        { id: "studentName", label: "Student Initials", type: "text", placeholder: "e.g. M.W.", required: true, span: "half", maxLength: 4, hint: "Initials only (max 4 chars) — do not enter full names (GDPR)" },
        { id: "yearGroup", label: "Year Group", type: "text", placeholder: "e.g. Year 6", required: true, span: "half" },
        { id: "behaviours", label: "Behaviours of Concern", type: "textarea", placeholder: "Describe the specific behaviours — what, when, how often, how severe?", required: true, span: "full" },
        { id: "triggers", label: "Known Triggers / Antecedents", type: "textarea", placeholder: "What tends to trigger or precede these behaviours?", span: "full" },
        { id: "strengths", label: "Student Strengths & Motivators", type: "textarea", placeholder: "What does the student enjoy? What motivates them?", span: "full" },
        { id: "background", label: "Relevant Background (optional)", type: "textarea", placeholder: "SEND diagnosis, home situation, previous strategies tried...", span: "full" },
        { id: "reviewPeriod", label: "Review Period", type: "select", options: [{ value: "4 weeks", label: "4 Weeks" }, { value: "6 weeks", label: "6 Weeks" }, { value: "1 term", label: "1 Term" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
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
10. **Monitoring & Review** — how progress will be tracked, review date
11. **Roles & Responsibilities** — who does what
12. **Communication with Family** — how parents/carers will be kept informed

Use positive, strengths-based language throughout. Be specific and practical.`,
        maxTokens: 3500,
      })}
      outputTitle={(v) => `Behaviour Support Plan — ${v.studentName} (${v.yearGroup})`}
    />
  );
}
