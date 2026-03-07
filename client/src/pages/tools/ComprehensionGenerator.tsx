import AIToolPage from "@/components/AIToolPage";
import { BookMarked } from "lucide-react";

const years = ["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));

export default function ComprehensionGenerator() {
  return (
    <AIToolPage
      title="Comprehension Generator"
      description="Create differentiated reading comprehension activities from any text"
      icon={<BookMarked className="w-5 h-5 text-white" />}
      accentColor="bg-sky-600"
      fields={[
        { id: "text", label: "Source Text", type: "textarea", placeholder: "Paste the reading passage here...", required: true, span: "full" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "numQuestions", label: "Number of Questions", type: "select", options: [3,5,6,8,10].map(n => ({ value: String(n), label: String(n) })), span: "half" },
        { id: "questionTypes", label: "Question Types", type: "select", options: [{ value: "mixed", label: "Mixed (literal + inferential + evaluative)" }, { value: "literal", label: "Literal only" }, { value: "inference", label: "Inference focused" }, { value: "vipers", label: "VIPERS format" }], span: "half" },
        { id: "differentiation", label: "Differentiation", type: "select", options: [{ value: "3-way", label: "3-way (Support/Core/Extension)" }, { value: "single", label: "Single level" }, { value: "send", label: "SEND adapted" }], span: "half" },
        { id: "includeAnswers", label: "Include Answer Key", type: "select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], span: "half" },
        { id: "includeVocab", label: "Include Vocabulary Activity", type: "select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert UK English teacher specialising in reading comprehension and literacy. You create high-quality comprehension activities that develop genuine reading skills — not just recall. You use the VIPERS framework (Vocabulary, Inference, Prediction, Explanation, Retrieval, Sequence/Summarise) where appropriate.`,
        user: `Create a comprehension activity for ${v.yearGroup} based on this text:

${v.text}

Requirements:
- ${v.numQuestions || 5} questions
- Question types: ${v.questionTypes || "mixed"}
- Differentiation: ${v.differentiation || "3-way"}
- Include answer key: ${v.includeAnswers !== "no" ? "Yes" : "No"}
- Include vocabulary activity: ${v.includeVocab !== "no" ? "Yes" : "No"}

${v.differentiation === "3-way" ? `Structure as three tiers:
**Support Level** (scaffolded questions with sentence starters)
**Core Level** (standard questions)
**Extension Level** (higher-order thinking, analysis, evaluation)` : ""}

${v.questionTypes === "vipers" ? "Label each question with its VIPERS skill (V/I/P/E/R/S)" : ""}

For each question:
- Make it clear and unambiguous
- Vary question types (multiple choice, short answer, extended response)
- Include marks allocation
- ${v.includeAnswers !== "no" ? "Provide model answers with mark scheme guidance" : ""}

${v.includeVocab !== "no" ? "\nVOCABULARY ACTIVITY: Select 5-8 key vocabulary words from the text. For each: definition, example sentence, and a task (e.g. use in a sentence, find synonyms)." : ""}`,
        maxTokens: 3000,
      })}
      outputTitle={(v) => `Comprehension Activity (${v.yearGroup})`}
    />
  );
}
