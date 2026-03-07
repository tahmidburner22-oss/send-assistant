import AIToolPage from "@/components/AIToolPage";
import { Layers } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));

export default function FlashCards() {
  return (
    <AIToolPage
      title="Flash Card Generator"
      description="Create printable flash cards for vocabulary, key facts, and revision"
      icon={<Layers className="w-5 h-5 text-white" />}
      accentColor="bg-yellow-600"
      fields={[
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "topic", label: "Topic", type: "text", placeholder: "e.g. The Water Cycle, Fractions, WW2 Key Events", required: true, span: "full" },
        { id: "cardType", label: "Card Type", type: "select", options: [{ value: "vocab", label: "Vocabulary (term + definition)" }, { value: "qa", label: "Question & Answer" }, { value: "concept", label: "Concept + Example" }, { value: "dates", label: "Dates & Events" }], span: "half" },
        { id: "numCards", label: "Number of Cards", type: "select", options: [5,8,10,12,15,20].map(n => ({ value: String(n), label: String(n) })), span: "half" },
        { id: "sendAdapted", label: "SEND Adapted", type: "select", options: [{ value: "yes", label: "Yes — simple language, visual prompts" }, { value: "no", label: "No — standard level" }], span: "half" },
        { id: "includeHints", label: "Include Memory Hints", type: "select", options: [{ value: "yes", label: "Yes — mnemonics/memory aids" }, { value: "no", label: "No" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert UK teacher creating high-quality flash cards for student revision. Your flash cards are clear, concise, and memorable. For SEND students, you use simple language, visual descriptions, and memory aids.`,
        user: `Create ${v.numCards || 10} flash cards for:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Topic: ${v.topic}
Card Type: ${v.cardType || "vocab"}
SEND Adapted: ${v.sendAdapted === "yes" ? "Yes — use simple language" : "No"}
Include Memory Hints: ${v.includeHints === "yes" ? "Yes" : "No"}

Format each card as:
---
**Card [number]**
FRONT: [term/question/concept]
BACK: [definition/answer/explanation]
${v.includeHints === "yes" ? "MEMORY HINT: [mnemonic, visual description, or memory aid]" : ""}
---

Requirements:
- Keep front side brief (1 line if possible)
- Keep back side concise but complete (2-4 lines max)
- Use age-appropriate language for ${v.yearGroup}
- ${v.sendAdapted === "yes" ? "Use simple vocabulary, short sentences, and suggest visual representations where helpful" : "Use appropriate academic vocabulary"}
- Cover the most important/examinable content for this topic
- Include a mix of key facts, definitions, and concepts`,
        maxTokens: 2500,
      })}
      outputTitle={(v) => `Flash Cards — ${v.subject}: ${v.topic} (${v.yearGroup})`}
    />
  );
}
