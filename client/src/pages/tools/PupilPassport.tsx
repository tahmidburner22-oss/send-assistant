import AIToolPage from "@/components/AIToolPage";
import { IdCard } from "lucide-react";

const sendNeeds = ["Autism Spectrum Condition","ADHD","Dyslexia","Dyscalculia","Dyspraxia","Speech & Language Needs","Social, Emotional & Mental Health","Hearing Impairment","Visual Impairment","Physical Disability","Moderate Learning Difficulties","Severe Learning Difficulties","Complex Needs","EAL"].map(n => ({ value: n, label: n }));

export default function PupilPassport() {
  return (
    <AIToolPage
      title="Pupil Passport Generator"
      description="Create a one-page pupil passport that tells staff everything they need to know"
      icon={<IdCard className="w-5 h-5 text-white" />}
      accentColor="bg-amber-600"
      fields={[
        { id: "studentName", label: "Student Initials", type: "text", placeholder: "e.g. O.B.", required: true, span: "half", maxLength: 4, hint: "Initials only (max 4 chars) — do not enter full names (GDPR)" },
        { id: "yearGroup", label: "Year Group", type: "text", placeholder: "e.g. Year 4", required: true, span: "half" },
        { id: "sendNeed", label: "Primary SEND Need", type: "select", options: sendNeeds, required: true, span: "half" },
        { id: "pronoun", label: "Pronoun", type: "select", options: [{ value: "She/her", label: "She/her" }, { value: "He/him", label: "He/him" }, { value: "They/them", label: "They/them" }], span: "half" },
        { id: "strengths", label: "Strengths & Interests", type: "textarea", placeholder: "What does this student love? What are they good at?", required: true, span: "full" },
        { id: "challenges", label: "Challenges & Barriers to Learning", type: "textarea", placeholder: "What do they find difficult? What triggers difficulties?", required: true, span: "full" },
        { id: "strategies", label: "What Helps (Strategies that work)", type: "textarea", placeholder: "What strategies, adaptations, or support helps this student?", span: "full" },
        { id: "communication", label: "Communication Style", type: "textarea", placeholder: "How does this student communicate best? Any AAC, visual supports?", span: "full" },
        { id: "goals", label: "Current Targets / Goals", type: "textarea", placeholder: "Current IEP/EHCP targets or focus areas", span: "full" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert SENCO creating a professional, person-centred Pupil Passport. Pupil Passports are one-page documents that give all staff a quick, clear picture of a student — their strengths, needs, and how to support them. They are written in a positive, strengths-based way and are practical for teachers to use.`,
        user: `Create a Pupil Passport for:

Name: ${v.studentName}
Year Group: ${v.yearGroup}
SEND Need: ${v.sendNeed}
Pronoun: ${v.pronoun}

Strengths & Interests:
${v.strengths}

Challenges & Barriers:
${v.challenges}

${v.strategies ? `What Helps:\n${v.strategies}` : ""}
${v.communication ? `Communication:\n${v.communication}` : ""}
${v.goals ? `Current Targets:\n${v.goals}` : ""}

Format as a professional Pupil Passport with these clear sections:
1. **About Me** — brief, positive introduction in first person ("I am...")
2. **My Strengths & Interests** — what I'm good at and love
3. **What I Find Challenging** — honest but positive framing
4. **What Helps Me Learn** — practical strategies for teachers
5. **How to Communicate with Me** — communication preferences
6. **My Current Goals** — targets I'm working towards
7. **Please Remember** — 3-5 key bullet points for all staff

Write in a warm, positive, person-centred style. The "About Me" section should be written as if from the student's voice. The rest should be for staff. Keep it concise — this should fit on one page when printed.`,
        maxTokens: 2000,
      })}
      outputTitle={(v) => `Pupil Passport — ${v.studentName} (${v.yearGroup})`}
    />
  );
}
