import AIToolPage from "@/components/AIToolPage";
import { Heart } from "lucide-react";

const concerns = ["Anxiety","Low mood / depression","Bereavement","Friendship difficulties","Bullying","School refusal","Self-harm (risk)","Trauma","Family breakdown","Transition anxiety","Low self-esteem","Anger management","Social isolation","Eating concerns","Sleep difficulties","Academic pressure"].map(c => ({ value: c, label: c }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));

export default function WellbeingSupport() {
  return (
    <AIToolPage
      assignable={true}
      title="Wellbeing Support Generator"
      description="Generate evidence-based wellbeing strategies, scripts, and support plans"
      icon={<Heart className="w-5 h-5 text-white" />}
      accentColor="bg-red-500"
      fields={[
        { id: "concern", label: "Wellbeing Concern", type: "select", options: concerns, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "context", label: "Context / Situation", type: "textarea", placeholder: "Describe the situation, what you've observed, any relevant background...", required: true, span: "full" },
        { id: "outputType", label: "What Do You Need?", type: "select", options: [{ value: "strategies", label: "Classroom strategies for teacher" }, { value: "script", label: "Conversation script for talking to student" }, { value: "plan", label: "Wellbeing support plan" }, { value: "parent-letter", label: "Letter to parents" }, { value: "referral", label: "Referral summary" }], required: true, span: "half" },
        { id: "urgency", label: "Urgency Level", type: "select", options: [{ value: "monitoring", label: "Monitoring — low level concern" }, { value: "early-help", label: "Early help — needs support" }, { value: "urgent", label: "Urgent — significant concern" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an experienced UK school pastoral lead, SENCO, and mental health first aider. You provide evidence-based, trauma-informed wellbeing support guidance. You follow UK safeguarding procedures, KCSIE (Keeping Children Safe in Education), and the Mental Health in Schools guidance. You always signpost to appropriate professional services when needed. You never provide clinical diagnoses or replace professional mental health support.`,
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
4. **Monitoring** (what to watch for, how to track)
5. **When to escalate** (clear indicators to refer to SENCO/pastoral lead)
6. **Signposting** (relevant resources, organisations, helplines)` : ""}

${v.outputType === "script" ? `Provide a sensitive, age-appropriate conversation script for a teacher to use when checking in with this student. Include:
- Opening (how to start the conversation)
- Key questions to ask (open, non-leading)
- Active listening prompts
- How to respond to different answers
- How to close the conversation
- What to do after (record, refer, follow up)` : ""}

${v.outputType === "plan" ? `Create a structured wellbeing support plan with:
- Student profile (anonymised)
- Identified needs
- Support strategies
- Roles and responsibilities
- Review schedule
- Escalation pathway` : ""}

${v.outputType === "parent-letter" ? "Write a sensitive, professional letter to parents/carers about the concern and the school's support approach." : ""}

${v.outputType === "referral" ? "Write a professional referral summary suitable for CAMHS, school counsellor, or external agency." : ""}

**Important:** Always include a safeguarding note if the urgency is 'urgent'. Always signpost to professional services. This guidance supports but does not replace professional mental health support.`,
        maxTokens: 2500,
      })}
      outputTitle={(v) => `Wellbeing Support — ${v.concern} (${v.yearGroup})`}
    />
  );
}
