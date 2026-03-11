import AIToolPage from "@/components/AIToolPage";
import { AlignLeft } from "lucide-react";

const readingLevels = [
  { value: "age-5-6", label: "Age 5-6 (Reception / Year 1)" },
  { value: "age-7-8", label: "Age 7-8 (Year 2-3)" },
  { value: "age-9-10", label: "Age 9-10 (Year 4-5)" },
  { value: "age-11-12", label: "Age 11-12 (Year 6-7)" },
  { value: "age-13-14", label: "Age 13-14 (Year 8-9)" },
  { value: "age-15-16", label: "Age 15-16 (Year 10-11)" },
  { value: "simple-send", label: "Simplified — SEND/SEN support" },
  { value: "eal-beginner", label: "EAL Beginner" },
  { value: "eal-intermediate", label: "EAL Intermediate" },
];

const purposes = [
  { value: "simplify", label: "Simplify (make easier)" },
  { value: "extend", label: "Extend (make harder)" },
  { value: "eal", label: "Adapt for EAL learners" },
  { value: "send", label: "Adapt for SEND learners" },
  { value: "formal", label: "Make more formal/academic" },
  { value: "accessible", label: "Make more accessible" },
];

export default function TextRewriter() {
  return (
    <AIToolPage
      assignable={true}
      title="Text Rewriter"
      description="Rewrite any text to a different reading level or for specific learner needs"
      icon={<AlignLeft className="w-5 h-5 text-white" />}
      accentColor="bg-cyan-600"
      fields={[
        { id: "originalText", label: "Original Text", type: "textarea", placeholder: "Paste the text you want to rewrite...", required: true, span: "full" },
        { id: "purpose", label: "Purpose", type: "select", options: purposes, required: true, span: "half" },
        { id: "targetLevel", label: "Target Reading Level", type: "select", options: readingLevels, required: true, span: "half" },
        { id: "preserveContent", label: "Content Preservation", type: "select", options: [{ value: "strict", label: "Strict — preserve all key facts" }, { value: "moderate", label: "Moderate — preserve main ideas" }, { value: "loose", label: "Loose — simplify freely" }], span: "half" },
        { id: "addSupports", label: "Add Learning Supports", type: "select", options: [{ value: "none", label: "None" }, { value: "vocab", label: "Key vocabulary glossary" }, { value: "questions", label: "Comprehension questions" }, { value: "both", label: "Both" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert UK teacher and literacy specialist. You rewrite texts to make them accessible for different learners while preserving the key content and meaning. You are skilled at adjusting vocabulary, sentence complexity, and structure for different reading levels and learner needs.`,
        user: `Rewrite the following text for:

Purpose: ${v.purpose}
Target Level: ${v.targetLevel}
Content Preservation: ${v.preserveContent || "moderate"}

Original Text:
${v.originalText}

Requirements:
- Adjust vocabulary complexity to match the target level
- Adjust sentence length and structure appropriately
- ${v.purpose === "simplify" || v.purpose === "send" || v.purpose === "eal" ? "Use shorter sentences, simpler words, and clearer structure" : ""}
- ${v.purpose === "extend" || v.purpose === "formal" ? "Use more sophisticated vocabulary, complex sentences, and academic language" : ""}
- ${v.purpose === "eal" ? "Avoid idioms, use literal language, define any cultural references" : ""}
- ${v.purpose === "send" ? "Use visual structure (bullet points, bold key words), short sentences, active voice" : ""}
- Preserve the key information and meaning
${v.addSupports === "vocab" || v.addSupports === "both" ? "\nAfter the rewritten text, add a KEY VOCABULARY section with definitions for any challenging words." : ""}
${v.addSupports === "questions" || v.addSupports === "both" ? "\nAfter the rewritten text, add 3-5 COMPREHENSION QUESTIONS to check understanding." : ""}

Present the rewritten text clearly. If the original has structure (paragraphs, headings), maintain that structure.`,
        maxTokens: 2500,
      })}
      outputTitle={() => "Rewritten Text"}
    />
  );
}
