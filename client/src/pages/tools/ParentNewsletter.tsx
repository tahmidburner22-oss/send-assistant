import AIToolPage from "@/components/AIToolPage";
import { Mail } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

const tones = [
  { value: "warm", label: "Warm & Friendly" },
  { value: "professional", label: "Professional & Formal" },
  { value: "celebratory", label: "Celebratory & Upbeat" },
  { value: "informative", label: "Informative & Clear" },
  { value: "supportive", label: "Supportive & Empathetic" },
];

const commTypes = [
  { value: "newsletter", label: "Class Newsletter" },
  { value: "letter", label: "General Parent Letter" },
  { value: "send-update", label: "SEND Progress Update" },
  { value: "trip", label: "School Trip Letter" },
  { value: "behaviour", label: "Behaviour Concern Letter" },
  { value: "achievement", label: "Achievement / Celebration Letter" },
  { value: "meeting", label: "Meeting Invitation" },
  { value: "curriculum", label: "Curriculum Information Letter" },
  { value: "safeguarding", label: "Safeguarding / Welfare Communication" },
  { value: "attendance", label: "Attendance Concern Letter" },
  { value: "transition", label: "Transition / New Year Letter" },
];

export default function ParentNewsletter() {
  const { saveParentNewsletter } = useApp() as any;

  return (
    <AIToolPage
      title="Parent Newsletter / Letter"
      assignable={true}
      description="Generate professional, parent-ready communications, newsletters, and letters"
      icon={<Mail className="w-5 h-5 text-white" />}
      accentColor="bg-pink-600"
      fields={[
        { id: "schoolName", label: "School Name", type: "text", placeholder: "e.g. Oakwood Primary School", required: true, span: "half" },
        { id: "type", label: "Communication Type", type: "select", options: commTypes, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group / Class", type: "text", placeholder: "e.g. Year 4 / Class 4B", span: "half" },
        { id: "tone", label: "Tone", type: "select", options: tones, span: "half" },
        { id: "content", label: "Key Points to Include", type: "textarea", placeholder: "What should this communication cover? Key dates, achievements, events, information, concerns...", required: true, span: "full" },
        { id: "teacherName", label: "Teacher / SENCO Name", type: "text", placeholder: "e.g. Mrs Johnson", span: "half" },
        { id: "date", label: "Date", type: "text", placeholder: "e.g. March 2026", span: "half" },
        { id: "actionRequired", label: "Action Required from Parents?", type: "text", placeholder: "e.g. Return reply slip by Friday, Attend meeting on 15th March", span: "full" },
        { id: "uploadToPortal", label: "Upload to Parent Portal after generating?", type: "select", options: [{ value: "yes", label: "Yes — upload automatically" }, { value: "no", label: "No — just generate" }], span: "full" },
      ]}
      buildPrompt={(v) => ({
        system: `You are a highly experienced UK school communications specialist and teacher with 20+ years of experience writing exemplary parent communications. You are known for writing communications that are:

- **Crystal clear**: Plain English accessible to all parents, including EAL families (Flesch-Kincaid Grade 8 or below)
- **Warmly professional**: The right balance of approachable and authoritative
- **Structurally excellent**: Logical flow, clear headings where appropriate, easy to skim
- **Action-oriented**: Parents always know exactly what (if anything) they need to do
- **Legally appropriate**: GDPR-aware, safeguarding-conscious, no sensitive personal data
- **Inclusive**: Welcoming tone for all family structures and backgrounds
- **Impeccably written**: Perfect spelling, grammar, punctuation, and formatting

You understand the difference between a newsletter (informative, celebratory, multi-topic) and a letter (focused, action-driven, single purpose) and write each appropriately.`,
        user: `Write a professional ${v.type || "newsletter"} for parents with the following details:

**School:** ${v.schoolName}
**Communication Type:** ${commTypes.find(t => t.value === v.type)?.label || v.type || "Newsletter"}
**Year Group / Class:** ${v.yearGroup || "Whole school"}
**Tone:** ${tones.find(t => t.value === v.tone)?.label || "Warm & Friendly"}
**Teacher / Author:** ${v.teacherName || "The Class Teacher"}
**Date:** ${v.date || ""}
${v.actionRequired ? `**Action Required from Parents:** ${v.actionRequired}` : ""}

**Key Points to Cover:**
${v.content}

**Formatting Requirements:**
1. Begin with a proper school letterhead format:
   - School name prominently at the top
   - Date (right-aligned)
   - "Dear Parents and Carers," salutation
2. Write a warm, engaging opening paragraph that sets the tone
3. Cover all key points in a logical, well-structured order
4. Use clear subheadings for newsletters with multiple topics
5. ${v.actionRequired ? `Include a clear, prominent "Action Required" section: ${v.actionRequired}` : "End with an open invitation for parents to get in touch with any questions"}
6. Close with a professional sign-off:
   - "Warm regards," / "Kind regards," (appropriate to tone)
   - ${v.teacherName || "The Class Teacher"}
   - ${v.schoolName}

**Content Guidelines:**
- For newsletters: 350–500 words, celebratory and informative
- For letters: 200–300 words, focused and action-oriented
- For SEND communications: Strengths-based, progress-focused, sensitive and empowering
- For behaviour concerns: Solution-focused, non-blaming, partnership approach
- For achievement letters: Specific, genuine, motivating
- Use plain English throughout — avoid educational jargon
- Be inclusive and welcoming to all family structures
- If mentioning any dates or deadlines, make them clear and prominent

Write the complete communication, ready to print and send.`,
        maxTokens: 2000,
      })}
      outputTitle={(v) => `${commTypes.find(t => t.value === v.type)?.label || "Newsletter"} — ${v.schoolName}${v.date ? ` (${v.date})` : ""}`}
      onResult={(text, values) => {
        if (values.uploadToPortal === "yes" && saveParentNewsletter) {
          const title = `${commTypes.find(t => t.value === values.type)?.label || "Newsletter"} — ${values.schoolName}${values.date ? ` (${values.date})` : ""}`;
          saveParentNewsletter({ title, content: text, date: values.date || new Date().toLocaleDateString("en-GB"), type: values.type || "newsletter" });
          toast.success("Newsletter uploaded to Parent Portal!");
        }
      }}
    />
  );
}
