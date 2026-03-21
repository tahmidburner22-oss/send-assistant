import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import { BookType } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));

export default function VocabularyBuilder() {
  const { preferences } = useUserPreferences();
  return (
    <AIToolPage
      assignable={true}
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
      buildPrompt={(v) => {
        const system = `You are an expert UK teacher and literacy specialist. You create high-quality vocabulary resources that help students understand and use new words in context. You use Beck, McKeown & Kucan's tiered vocabulary framework where appropriate.`;
        let user: string;
        if (v.format === "mat") {
          user = `Create a VOCABULARY MAT for printing and laminating.

Subject: ${v.subject} | Year Group: ${v.yearGroup} | Topic: ${v.topic}
Number of Words: ${v.numWords || 10}
${v.sendAdapted === "yes" ? "SEND Adapted: Yes — use very simple, plain-English definitions (max 10 words each)" : ""}

OUTPUT FORMAT — a clean two-column markdown table ONLY. No extra text before or after except the heading below.

Heading line first: **${v.topic} — ${v.subject} Vocabulary Mat (${v.yearGroup})**

Then the table:
| Word | Definition |
|------|------------|
| [word] | [max 10-word plain-English definition] |

Rules:
- One row per word, alphabetical order
- Definitions must be brief enough to fit in a small printed cell
- No example sentences, no activities, no pronunciation guides
- No bold/italic within cells`;
        } else if (v.format === "tiered") {
          user = `Create a TIERED VOCABULARY list using the Beck, McKeown & Kucan framework.

Subject: ${v.subject} | Year Group: ${v.yearGroup} | Topic: ${v.topic}
Number of Words: ${v.numWords || 10}
${v.sendAdapted === "yes" ? "SEND Adapted: Yes — use simple, accessible definitions" : ""}

Organise into three clearly labelled tiers:
**Tier 1 — Everyday words** students may not know in this context
**Tier 2 — High-frequency academic words** (highest teaching priority)
**Tier 3 — Subject-specific technical vocabulary**

For each word: Word | Part of speech | Clear definition | Example sentence using the word in the context of ${v.topic}
${v.includeActivities !== "no" ? "Add a brief activity for each (e.g. draw it, use in a sentence, find a synonym)" : ""}`;
        } else {
          user = `Create a FULL VOCABULARY RESOURCE.

Subject: ${v.subject} | Year Group: ${v.yearGroup} | Topic: ${v.topic}
Number of Words: ${v.numWords || 10}
${v.sendAdapted === "yes" ? "SEND Adapted: Yes — use simple, clear language suitable for SEND learners" : ""}

For each word provide ALL of the following:
- **Word** (phonetic pronunciation if the word is complex)
- **Part of speech** (noun / verb / adjective / adverb etc.)
- **Definition** — ${v.sendAdapted === "yes" ? "simple, SEND-friendly language" : "age-appropriate, clear"}
- **Example sentence** — the word used in the context of ${v.topic}
- **Word family** — 2–3 related words
${v.includeActivities !== "no" ? "- **Activity** — one quick activity (e.g. draw it, use in a sentence, find synonyms, spot it in the text)" : ""}`;
        }
        return { system, user, maxTokens: 2500 };
      }}
      outputTitle={(v) => `Vocabulary — ${v.subject} (${v.yearGroup})`}
      formatOutput={(text) => formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#65a30d", emoji: "📝", title: "Vocabulary Builder" })}
    />
  );
}
