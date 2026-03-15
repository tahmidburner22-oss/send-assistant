import AIToolPage from "@/components/AIToolPage";
import { BookOpen } from "lucide-react";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama","Citizenship","Business Studies","Economics","Psychology","Sociology","Law","Media Studies","Film Studies","Physical Education","Health & Social Care"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));
const durations = ["20 minutes","30 minutes","45 minutes","50 minutes","60 minutes","75 minutes","90 minutes","100 minutes"].map(d => ({ value: d, label: d }));
const phases = [
  { value: "EYFS", label: "EYFS" },
  { value: "KS1", label: "KS1 (Years 1–2)" },
  { value: "KS2", label: "KS2 (Years 3–6)" },
  { value: "KS3", label: "KS3 (Years 7–9)" },
  { value: "KS4", label: "KS4 / GCSE (Years 10–11)" },
  { value: "KS5", label: "KS5 / A-Level (Years 12–13)" },
];

export default function LessonPlanner() {
  return (
    <AIToolPage
      title="Lesson Plan Generator"
      assignable={true}
      worksheetLink={true}
      description="Generate detailed, SEND-inclusive, curriculum-aligned lesson plans ready to teach"
      icon={<BookOpen className="w-5 h-5 text-white" />}
      accentColor="bg-blue-600"
      fields={[
        { id: "subject", label: "Subject", type: "select", options: subjects, required: true, span: "half" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "topic", label: "Topic / Learning Focus", type: "text", placeholder: "e.g. Fractions, The Water Cycle, WW2 Causes", required: true, span: "full" },
        { id: "duration", label: "Lesson Duration", type: "select", options: durations, span: "half" },
        { id: "classSize", label: "Class Size", type: "text", placeholder: "e.g. 28 pupils", span: "half" },
        { id: "sendNeeds", label: "SEND / Additional Needs", type: "text", placeholder: "e.g. 3 pupils with dyslexia, 2 with ADHD, 1 EAL", span: "full" },
        { id: "priorLearning", label: "Prior Learning / Starting Point", type: "textarea", placeholder: "What do pupils already know? What misconceptions might they have?", span: "full" },
        { id: "objectives", label: "Learning Objectives (optional — leave blank for AI to generate)", type: "textarea", placeholder: "e.g. Students will be able to explain the causes of WW2", span: "full" },
        { id: "resources", label: "Available Resources", type: "text", placeholder: "e.g. iPads, mini whiteboards, manipulatives, textbooks", span: "full" },
        { id: "examBoard", label: "Exam Board (if applicable)", type: "text", placeholder: "e.g. AQA, Edexcel, OCR, WJEC", span: "half" },
        { id: "teachingStyle", label: "Teaching Approach", type: "select", options: [
          { value: "direct", label: "Direct Instruction" },
          { value: "inquiry", label: "Inquiry-Based Learning" },
          { value: "collaborative", label: "Collaborative / Group Work" },
          { value: "flipped", label: "Flipped Classroom" },
          { value: "mixed", label: "Mixed / Blended" },
        ], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an outstanding, award-winning UK teacher with 15+ years of experience and expertise in SEND-inclusive pedagogy, curriculum design, and evidence-based teaching. You have deep knowledge of the UK National Curriculum, Ofsted inspection framework, and best practices from the Education Endowment Foundation (EEF). You write lesson plans that are detailed, practical, and immediately ready to deliver — a supply teacher with no subject knowledge should be able to pick this up and teach it confidently.

Your lesson plans are distinguished by:
- Precise, measurable learning objectives aligned to curriculum standards
- Expertly structured pedagogy using Rosenshine's Principles, retrieval practice, and spaced learning
- Genuine, meaningful SEND adaptations (not tokenistic)
- Engaging, age-appropriate activities that build deep understanding
- Built-in assessment for learning throughout every phase
- Professional, publication-quality formatting`,
        user: `Create a comprehensive, professional-grade lesson plan with the following details:

**Subject:** ${v.subject}
**Year Group:** ${v.yearGroup}
**Topic:** ${v.topic}
**Duration:** ${v.duration || "60 minutes"}
**Class Size:** ${v.classSize || "Mixed ability class"}
**SEND / Additional Needs:** ${v.sendNeeds || "Mixed ability — standard differentiation required"}
**Prior Learning:** ${v.priorLearning || "Standard prior knowledge for this year group and topic"}
**Teaching Approach:** ${v.teachingStyle || "Mixed / Blended"}
${v.objectives ? `**Specified Learning Objectives:** ${v.objectives}` : ""}
${v.resources ? `**Available Resources:** ${v.resources}` : ""}
${v.examBoard ? `**Exam Board:** ${v.examBoard}` : ""}

Please produce a fully detailed lesson plan with ALL of the following sections:

## LESSON OVERVIEW
- Subject, Year Group, Topic, Duration, Date (leave blank)
- NC/Curriculum reference (specific programme of study link)
- Lesson number in unit (e.g. Lesson 3 of 6)

## LEARNING OBJECTIVES
Three tiered objectives:
- **Must** (all pupils): Core knowledge/skill every pupil will achieve
- **Should** (most pupils): Expected progress for the majority
- **Could** (some pupils): Challenge/extension for higher attainers

## SUCCESS CRITERIA
Pupil-friendly "I can..." statements (3–5 statements) that pupils can self-assess against

## KEY VOCABULARY
Table with 6–10 key words, their definitions, and example usage in context

## RESOURCES REQUIRED
Complete list of everything needed (including any preparation required)

## LESSON STRUCTURE

### STARTER / HOOK (${Math.round(parseInt(v.duration || "60") * 0.12)} minutes)
Engaging retrieval/activation activity — specific instructions, questions to ask, expected pupil responses

### MAIN TEACHING — EXPLICIT INSTRUCTION (${Math.round(parseInt(v.duration || "60") * 0.25)} minutes)
Step-by-step teacher explanation with:
- Exact key points to cover
- Worked examples to model
- Common misconceptions to address
- Questions to check understanding (include specific questions with expected answers)

### GUIDED PRACTICE (${Math.round(parseInt(v.duration || "60") * 0.18)} minutes)
Teacher-led activity with the class — specific task with instructions

### INDEPENDENT PRACTICE (${Math.round(parseInt(v.duration || "60") * 0.3)} minutes)
Three differentiated tasks:
- **Support Task** (scaffolded): Specific task with sentence starters, word banks, or frames
- **Core Task** (expected): Main independent activity
- **Extension Task** (challenge): Higher-order thinking, application, or evaluation

### PLENARY (${Math.round(parseInt(v.duration || "60") * 0.1)} minutes)
Consolidation activity — specific exit ticket question or activity

## SEND ADAPTATIONS
For each need mentioned, provide specific, practical strategies:
- Seating arrangements
- Scaffolding tools (word mats, sentence frames, visual supports)
- Adult support deployment
- Alternative recording methods
- Sensory/environmental adjustments

## ASSESSMENT FOR LEARNING
- Formative assessment strategies used throughout (with specific timing)
- Key questions to ask at each phase (include 2–3 specific questions)
- Success indicators — what does good look like?
- Next steps — how will this lesson inform the next?

## HOMEWORK / FOLLOW-UP (optional)
Specific homework task with clear instructions

## TEACHER NOTES
- Potential misconceptions and how to address them
- Subject knowledge notes for non-specialists
- Links to prior and future learning

Format everything with clear markdown headers and be extremely specific and practical throughout. Every activity should have precise instructions, timings, and expected outcomes.`,
        maxTokens: 4000,
      })}
      outputTitle={(v) => `Lesson Plan: ${v.subject} — ${v.topic} (${v.yearGroup})`}
    />
  );
}
