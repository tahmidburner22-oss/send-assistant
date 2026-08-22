import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import { HelpCircle } from "lucide-react";
import { SUBJECTS_PRIMARY as subjects, YEAR_GROUPS as years } from "@/lib/tool-vocab";

const quizTypes = [{ value: "multiple-choice", label: "Multiple Choice" }, { value: "true-false", label: "True / False" }, { value: "short-answer", label: "Short Answer" }, { value: "mixed", label: "Mixed Format" }, { value: "fill-in-blanks", label: "Fill in the Blanks" }];

export default function QuizGenerator() {
  const { preferences } = useUserPreferences();
  return (
    <AIToolPage
      assignable={true}
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
        { id: "difficulty", label: "Curriculum challenge", type: "select", options: [{ value: "foundation", label: "Foundation — teacher-selected starting point" }, { value: "expected", label: "Expected — year-group standard" }, { value: "extension", label: "Extension — greater depth" }, { value: "mixed", label: "Mixed challenge" }], span: "half" },
        { id: "includeAnswers", label: "Include Answer Key", type: "select", options: [{ value: "yes", label: "Yes — with explanations" }, { value: "answers-only", label: "Yes — answers only" }, { value: "no", label: "No" }], span: "half" },
        { id: "context", label: "Additional Context (optional)", type: "textarea", placeholder: "Any specific content, vocabulary, or learning objectives to focus on?", span: "full" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert UK teacher creating high-quality, curriculum-aligned quizzes. Your questions are clear, unambiguous and age-appropriate. You include recall, understanding and application. When teacher-reviewed pupil access guidance is supplied separately, use it only to improve wording, presentation, processing and authorised response routes. Never infer a diagnosis, name a pupil, remove the stated learning objective, weaken command words or lower the evidence required.`,
        user: `Create a ${v.numQuestions || 10}-question quiz:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Topic: ${v.topic}
Question Type: ${v.quizType || "mixed"}
Curriculum challenge: ${v.difficulty || "mixed"}
Include Answer Key: ${v.includeAnswers || "yes"}

${v.context ? `Additional Context:\n${v.context}` : ""}

Format requirements:
- Number each question clearly
- For multiple choice: provide 4 options (A, B, C, D) with only one correct answer
- For fill-in-blanks: use ________ for blanks
- For short answer: indicate expected answer length (1 sentence, 2-3 sentences, etc.)
- Include a mix of curriculum challenge only if "mixed" is selected
- If teacher-reviewed access guidance is injected, preserve the same stated topic coverage, key vocabulary, command words, correct answers and evidence standard; adapt the route into the question, not what is assessed
- ${v.includeAnswers !== "no" ? "Include a clearly separated ANSWER KEY at the end" : "Do not include answers"}
- ${v.includeAnswers === "yes" ? "For each answer, include a brief explanation (1 sentence)" : ""}

Make questions that test genuine understanding, not just memorisation. Include at least 2 higher-order thinking questions (analysis, evaluation, application) where appropriate for the teacher-selected curriculum challenge.`,
        maxTokens: 3000,
      })}
      outputTitle={(v) => `${v.subject} Quiz — ${v.topic} (${v.yearGroup})`}
      formatOutput={(text) => formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#4f46e5", emoji: "❓", title: "Quiz" })}
    />
  );
}
