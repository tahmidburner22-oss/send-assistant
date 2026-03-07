import AIToolPage from "@/components/AIToolPage";
import { HelpCircle } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));
const quizTypes = [{ value: "multiple-choice", label: "Multiple Choice" }, { value: "true-false", label: "True / False" }, { value: "short-answer", label: "Short Answer" }, { value: "mixed", label: "Mixed Format" }, { value: "fill-in-blanks", label: "Fill in the Blanks" }];

export default function QuizGenerator() {
  return (
    <AIToolPage
      title="Quiz Generator"
      description="Create engaging, differentiated quizzes with answer keys for any topic"
      icon={<HelpCircle className="w-5 h-5 text-white" />}
      accentColor="bg-indigo-600"
      fields={[
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "topic", label: "Topic", type: "text", placeholder: "e.g. The Water Cycle, World War 2, Fractions", required: true, span: "full" },
        { id: "quizType", label: "Question Type", type: "select", options: quizTypes, span: "half" },
        { id: "numQuestions", label: "Number of Questions", type: "select", options: [5,8,10,12,15,20].map(n => ({ value: String(n), label: String(n) })), span: "half" },
        { id: "difficulty", label: "Difficulty", type: "select", options: [{ value: "easy", label: "Easy (SEND/SEN support)" }, { value: "medium", label: "Medium (Expected)" }, { value: "hard", label: "Hard (Extension)" }, { value: "mixed", label: "Mixed Difficulty" }], span: "half" },
        { id: "includeAnswers", label: "Include Answer Key", type: "select", options: [{ value: "yes", label: "Yes — with explanations" }, { value: "answers-only", label: "Yes — answers only" }, { value: "no", label: "No" }], span: "half" },
        { id: "context", label: "Additional Context (optional)", type: "textarea", placeholder: "Any specific content, vocabulary, or learning objectives to focus on?", span: "full" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert UK teacher creating high-quality, curriculum-aligned quizzes. Your questions are clear, unambiguous, and age-appropriate. You include a mix of recall, understanding, and application questions. For SEND students, you use simple language and clear formatting.`,
        user: `Create a ${v.numQuestions || 10}-question quiz:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Topic: ${v.topic}
Question Type: ${v.quizType || "mixed"}
Difficulty: ${v.difficulty || "mixed"}
Include Answer Key: ${v.includeAnswers || "yes"}

${v.context ? `Additional Context:\n${v.context}` : ""}

Format requirements:
- Number each question clearly
- For multiple choice: provide 4 options (A, B, C, D) with only one correct answer
- For fill-in-blanks: use ________ for blanks
- For short answer: indicate expected answer length (1 sentence, 2-3 sentences, etc.)
- Include a mix of difficulty levels if "mixed" selected
- ${v.includeAnswers !== "no" ? "Include a clearly separated ANSWER KEY at the end" : "Do not include answers"}
- ${v.includeAnswers === "yes" ? "For each answer, include a brief explanation (1 sentence)" : ""}

Make questions that test genuine understanding, not just memorisation. Include at least 2 higher-order thinking questions (analysis, evaluation, application).`,
        maxTokens: 3000,
      })}
      outputTitle={(v) => `${v.subject} Quiz — ${v.topic} (${v.yearGroup})`}
    />
  );
}
