import AIToolPage from "@/components/AIToolPage";
import { CalendarDays } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));
const terms = [{ value: "Autumn 1", label: "Autumn 1" }, { value: "Autumn 2", label: "Autumn 2" }, { value: "Spring 1", label: "Spring 1" }, { value: "Spring 2", label: "Spring 2" }, { value: "Summer 1", label: "Summer 1" }, { value: "Summer 2", label: "Summer 2" }];

export default function MediumTermPlanner() {
  return (
    <AIToolPage
      title="Medium Term Planner"
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
      buildPrompt={(v) => ({
        system: `You are an outstanding UK teacher with expertise in curriculum planning and SEND-inclusive pedagogy. You create detailed, practical medium-term plans that are fully aligned to the UK National Curriculum and include SEND adaptations throughout.`,
        user: `Create a medium-term plan for:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Topic: ${v.topic}
Term: ${v.term || ""}
Duration: ${v.weeks || 6} weeks, ${v.lessonsPerWeek || 3} lessons per week
SEND Needs: ${v.sendNeeds || "Mixed ability class"}
Prior Learning: ${v.priorLearning || "Standard prior knowledge"}

Structure the plan as follows:

**Unit Overview**
- Learning objectives for the unit
- Key vocabulary
- Cross-curricular links
- Assessment opportunities

**Week-by-Week Breakdown**
For each week provide:
- Week number and focus
- Learning objectives (tiered: Must/Should/Could)
- Key activities (starter, main, plenary)
- Resources needed
- SEND adaptations
- Assessment for learning

**End of Unit Assessment**
- How learning will be assessed
- Success criteria

**SEND Provision Summary**
- Specific adaptations for the needs mentioned
- Recommended resources and interventions

Make it practical and ready to use. Be specific about activities, not just topics.`,
        maxTokens: 4000,
      })}
      outputTitle={(v) => `Medium Term Plan — ${v.subject}: ${v.topic} (${v.yearGroup})`}
    />
  );
}
