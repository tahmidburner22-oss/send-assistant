import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import { CalendarDays } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));
const terms = [{ value: "Autumn 1", label: "Autumn 1" }, { value: "Autumn 2", label: "Autumn 2" }, { value: "Spring 1", label: "Spring 1" }, { value: "Spring 2", label: "Spring 2" }, { value: "Summer 1", label: "Summer 1" }, { value: "Summer 2", label: "Summer 2" }];

export default function MediumTermPlanner() {
  const { preferences } = useUserPreferences();
  return (
    <AIToolPage
      title="Medium Term Planner"
      assignable={true}
      worksheetLink={true}
      description="Generate a full half-term topic plan with weekly breakdowns and SEND adaptations"
      icon={<CalendarDays className="w-5 h-5 text-white" />}
      accentColor="bg-green-700"
      fields={[
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "topic", label: "Topic / Unit Title", type: "text", placeholder: "e.g. The Romans, Fractions & Decimals, Creative Writing", required: true, span: "full" },
        { id: "term", label: "Term", type: "select", options: terms, span: "half" },
        { id: "weeks", label: "Number of Weeks", type: "select", options: [4,5,6,7,8].map(n => ({ value: String(n), label: `${n} weeks` })), span: "half" },
        { id: "lessonsPerWeek", label: "Lessons Per Week", type: "select", options: [1,2,3,4,5].map(n => ({ value: String(n), label: String(n) })), span: "half" },
        { id: "sendNeeds", label: "SEND Needs in Class", type: "text", placeholder: "e.g. 2 dyslexia, 1 autism, 3 EAL", span: "half" },
        { id: "priorLearning", label: "Prior Learning / Starting Point", type: "textarea", placeholder: "What do pupils already know about this topic?", span: "full" },
      ]}
      buildPrompt={(v) => {
        const weeks = parseInt(v.weeks || "6");
        const lessonsPerWeek = parseInt(v.lessonsPerWeek || "3");
        const totalLessons = weeks * lessonsPerWeek;
        // Build explicit numbered lesson list so AI cannot under-generate
        const lessonLines: string[] = [];
        for (let i = 0; i < totalLessons; i++) {
          const week = Math.floor(i / lessonsPerWeek) + 1;
          const lessonInWeek = (i % lessonsPerWeek) + 1;
          lessonLines.push(`Lesson ${i + 1} (Week ${week}, Lesson ${lessonInWeek} of ${lessonsPerWeek})`);
        }
        return {
          system: `You are an outstanding UK teacher with expertise in curriculum planning and SEND-inclusive pedagogy. You create detailed, practical medium-term plans fully aligned to the UK National Curriculum. You are meticulous about lesson counts — if asked for ${totalLessons} lessons you produce EXACTLY ${totalLessons} lesson entries.`,
          user: `Create a medium-term plan for:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Topic: ${v.topic}
Term: ${v.term || ""}
Duration: ${weeks} weeks x ${lessonsPerWeek} lessons per week = EXACTLY ${totalLessons} lessons total
SEND Needs: ${v.sendNeeds || "Mixed ability class"}
Prior Learning: ${v.priorLearning || "Standard prior knowledge"}

CRITICAL: You MUST produce entries for ALL ${totalLessons} lessons listed below. Do not skip, merge, or summarise any lessons.

Lessons to plan:
${lessonLines.join("\n")}

Structure output as follows:

**Unit Overview**
- Unit title and rationale
- Overall learning objectives for the unit
- Key vocabulary (6-10 terms with definitions)
- Cross-curricular links
- Assessment opportunities

**Lesson-by-Lesson Plan**
For EACH of the ${totalLessons} lessons, provide a SEPARATE entry:

**[Lesson N (Week W, Lesson L): Lesson Title]**
- Learning objective: one specific, measurable objective
- Starter (5-10 min): specific task with instructions
- Main activity: step-by-step with differentiation (Support/Core/Extension)
- Plenary (5 min): consolidation or exit task
- Resources needed
- SEND adaptation for this specific lesson

**End of Unit Assessment**
- Assessment task with clear instructions
- Success criteria (Must/Should/Could)

**SEND Provision Summary**
- Specific adaptations for mentioned needs across the unit

Be specific about activities — name actual tasks, not just "discuss the topic".`,
          maxTokens: 6000,
        };
      }}
      outputTitle={(v) => `Medium Term Plan — ${v.subject} (${v.yearGroup})`}
      formatOutput={(text) => formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#15803d", emoji: "📅", title: "Medium Term Planner" })}
    />
  );
}
