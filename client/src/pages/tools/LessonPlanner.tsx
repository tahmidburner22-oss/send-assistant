import AIToolPage from "@/components/AIToolPage";
import { BookOpen } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama","Citizenship"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));
const durations = ["30 minutes","45 minutes","60 minutes","75 minutes","90 minutes"].map(d => ({ value: d, label: d }));

export default function LessonPlanner() {
  return (
    <AIToolPage
      title="Lesson Plan Generator"
      description="Generate detailed, SEND-inclusive lesson plans aligned to the UK National Curriculum"
      icon={<BookOpen className="w-5 h-5 text-white" />}
      accentColor="bg-blue-600"
      fields={[
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "topic", label: "Topic / Learning Focus", type: "text", placeholder: "e.g. Fractions, The Water Cycle, WW2", required: true, span: "full" },
        { id: "duration", label: "Lesson Duration", type: "select", options: durations, span: "half" },
        { id: "sendNeeds", label: "SEND Needs in Class", type: "text", placeholder: "e.g. 2 pupils with dyslexia, 1 with autism", span: "half" },
        { id: "priorLearning", label: "Prior Learning / Starting Point", type: "textarea", placeholder: "What do pupils already know?", span: "full" },
        { id: "objectives", label: "Learning Objectives (optional)", type: "textarea", placeholder: "Leave blank for AI to generate from topic", span: "full" },
        { id: "resources", label: "Available Resources", type: "text", placeholder: "e.g. iPads, mini whiteboards, manipulatives", span: "full" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an outstanding UK primary/secondary school teacher with expertise in SEND-inclusive pedagogy. You write detailed, practical lesson plans that follow the UK National Curriculum and include differentiation for all learners. Your lessons are engaging, structured, and ready to teach.`,
        user: `Write a detailed lesson plan:

Subject: ${v.subject}
Year Group: ${v.yearGroup}
Topic: ${v.topic}
Duration: ${v.duration || "60 minutes"}
SEND Needs: ${v.sendNeeds || "Mixed ability class"}
Prior Learning: ${v.priorLearning || "Standard prior knowledge for this year group"}
${v.objectives ? `Learning Objectives: ${v.objectives}` : ""}
${v.resources ? `Available Resources: ${v.resources}` : ""}

Include:
1. **Learning Objectives** (3 tiered: Must / Should / Could)
2. **Success Criteria** (pupil-friendly "I can" statements)
3. **Starter / Hook** (5-10 min — engaging activity to activate prior knowledge)
4. **Main Teaching** (direct instruction, modelling, explanation)
5. **Guided Practice** (teacher-led activity with class)
6. **Independent Activity** (3 differentiated tasks: Support / Core / Extension)
7. **SEND Adaptations** (specific strategies for needs mentioned)
8. **Plenary / Exit Ticket** (consolidation and assessment)
9. **Assessment for Learning** (how you'll check understanding throughout)
10. **Resources Needed**
11. **Key Vocabulary** (with definitions)
12. **Homework / Follow-up** (optional)

Format with clear headers. Be specific and practical — a supply teacher should be able to deliver this lesson.`,
        maxTokens: 3500,
      })}
      outputTitle={(v) => `Lesson Plan: ${v.subject} — ${v.topic} (${v.yearGroup})`}
    />
  );
}
