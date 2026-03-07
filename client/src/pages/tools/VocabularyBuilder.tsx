import AIToolPage from "@/components/AIToolPage";
import { BookType } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));

export default function VocabularyBuilder() {
  return (
    <AIToolPage
      title="Vocabulary Builder"
      description="Generate rich vocabulary lists with definitions, examples, and activities"
      icon={<BookType className="w-5 h-5 text-white" />}
      accentColor="bg-lime-700"
      fields={[
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "topic", label: "Topic", type: "text", placeholder: "e.g. The Water Cycle, World War 2, Fractions", required: true, span: "full" },
        { id: "numWords", label: "Number of Words", type: "select", options: [8,10,12,15,20].map(n => ({ value: String(n), label: String(n) })), span: "half" },
        { id: "format", label: "Output Format", type: "select", options: [{ value: "full", label: "Full (word, definition, example, activity)" }, { value: "mat", label: "Vocabulary Mat (word + definition)" }, { value: "tiered", label: "Tiered (Tier 1/2/3 vocabulary)" }], span: "half" },
        { id: "sendAdapted", label: "SEND Adapted", type: "select", options: [{ value: "yes", label: "Yes — simple definitions, visual prompts" }, { value: "no", label: "Standard" }], span: "half" },
        { id: "includeActivities", label: "Include Activities", type: "select", options: [{ value: "yes", label: "Yes — word activities" }, { value: "no", label: "No" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert UK teacher and literacy specialist. You create high-quality vocabulary resources that help students understand and use new words in context. You use Beck, McKeown & Kucan's tiered vocabulary framework where appropriate.`,
        user: `Create a vocabulary resource for:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Topic: ${v.topic}
Number of Words: ${v.numWords || 10}
Format: ${v.format || "full"}
SEND Adapted: ${v.sendAdapted === "yes" ? "Yes" : "No"}
Include Activities: ${v.includeActivities !== "no" ? "Yes" : "No"}

${v.format === "tiered" ? `Organise words into:
- Tier 1: Everyday words students may not know
- Tier 2: High-frequency academic words (most important for teaching)
- Tier 3: Subject-specific technical vocabulary` : ""}

For each word provide:
- **Word** (with phonetic pronunciation if complex)
- **Part of speech** (noun, verb, adjective, etc.)
- **Definition** — ${v.sendAdapted === "yes" ? "simple, clear language suitable for SEND learners" : "age-appropriate, clear definition"}
- **Example sentence** — in context of the topic
- **Word family** — related words (if applicable)
${v.includeActivities !== "no" ? "- **Activity** — a quick activity to practise this word (e.g. draw it, use in a sentence, find synonyms)" : ""}

${v.format === "mat" ? "Format as a clean vocabulary mat suitable for printing and laminating." : ""}`,
        maxTokens: 2500,
      })}
      outputTitle={(v) => `Vocabulary — ${v.subject}: ${v.topic} (${v.yearGroup})`}
    />
  );
}
