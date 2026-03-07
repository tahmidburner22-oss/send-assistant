import AIToolPage from "@/components/AIToolPage";
import { Mail } from "lucide-react";

const tones = [{ value: "warm", label: "Warm & Friendly" }, { value: "professional", label: "Professional" }, { value: "celebratory", label: "Celebratory" }, { value: "informative", label: "Informative" }];

export default function ParentNewsletter() {
  return (
    <AIToolPage
      title="Parent Newsletter / Letter"
      description="Generate professional parent communications, newsletters, and letters in seconds"
      icon={<Mail className="w-5 h-5 text-white" />}
      accentColor="bg-pink-600"
      fields={[
        { id: "schoolName", label: "School Name", type: "text", placeholder: "e.g. Oakwood Primary School", required: true, span: "half" },
        { id: "type", label: "Communication Type", type: "select", options: [{ value: "newsletter", label: "Class Newsletter" }, { value: "letter", label: "Parent Letter" }, { value: "send-update", label: "SEND Progress Update" }, { value: "trip", label: "School Trip Letter" }, { value: "behaviour", label: "Behaviour Concern Letter" }, { value: "achievement", label: "Achievement Letter" }, { value: "meeting", label: "Meeting Invitation" }], required: true, span: "half" },
        { id: "yearGroup", label: "Year Group / Class", type: "text", placeholder: "e.g. Year 4 / Class 4B", span: "half" },
        { id: "tone", label: "Tone", type: "select", options: tones, span: "half" },
        { id: "content", label: "Key Points to Include", type: "textarea", placeholder: "What should this communication cover? Key dates, achievements, concerns, information...", required: true, span: "full" },
        { id: "teacherName", label: "Teacher / SENCO Name", type: "text", placeholder: "e.g. Mrs Johnson", span: "half" },
        { id: "date", label: "Date", type: "text", placeholder: "e.g. March 2026", span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an experienced UK primary/secondary school teacher writing professional parent communications. Your writing is clear, warm, and professional. You use plain English (avoiding jargon), are inclusive and positive, and always put children's wellbeing first.`,
        user: `Write a ${v.type || "newsletter"} for parents:

School: ${v.schoolName}
Year Group/Class: ${v.yearGroup || ""}
Tone: ${v.tone || "warm"}
Teacher/SENCO: ${v.teacherName || ""}
Date: ${v.date || ""}

Key Points to Include:
${v.content}

Format requirements:
- Professional school letterhead format (School name, date, salutation)
- Clear, friendly opening
- Well-structured body with the key points
- Positive, solution-focused language
- Clear call to action if needed
- Professional sign-off
- For SEND communications: be sensitive, focus on progress and support, avoid deficit language
- Use plain English — accessible to all parents including EAL families
- Appropriate length for the type (newsletter: 300-400 words; letter: 150-250 words)`,
        maxTokens: 1500,
      })}
      outputTitle={(v) => `${v.type === "newsletter" ? "Newsletter" : "Letter"} — ${v.schoolName}`}
    />
  );
}
