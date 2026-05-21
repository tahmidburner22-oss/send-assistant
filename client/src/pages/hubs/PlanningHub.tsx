/**
 * Planning Hub — workflow storyboard from half-term sequence to tomorrow's
 * lesson. Surfaces every planning tool: medium-term planner, lesson planner,
 * differentiation, comprehension, vocabulary, exit ticket, rubric,
 * presentation maker, quiz generator, worksheets and more.
 */
import HubStoryboard from "@/components/HubStoryboard";
import { Pencil } from "lucide-react";

export default function PlanningHub() {
  return (
    <HubStoryboard
      hubLabel="Planning Hub"
      hubBlurb="From half-term sequence to tomorrow's lesson — one workflow."
      breadcrumb="Planning Hub"
      accent="green"
      hubId="planning"
      heroIcon={Pencil}
      steps={[
        {
          n: "1",
          title: "Map the half-term",
          blurb: "Sequence the unit backwards from the assessment, with NC objectives and retrieval slots auto-inserted.",
          toolIds: ["medium-term-planner"],
        },
        {
          n: "2",
          title: "Plan tomorrow",
          blurb: "Pull a row from the MTP into a full lesson plan with an adaptive-teaching column for each named SEND pupil.",
          toolIds: ["lesson-planner", "presentation-maker"],
        },
        {
          n: "3",
          title: "Build the work",
          blurb: "Generate the worksheet, comprehension passage, vocabulary mat or supporting story from the same topic.",
          toolIds: ["worksheet-generator", "comprehension-generator", "vocabulary-builder", "reading-and-stories"],
        },
        {
          n: "4",
          title: "Differentiate",
          blurb: "Adapt the resource for individual SEND profiles, EAL learners and reading-age targets.",
          toolIds: ["differentiate"],
        },
        {
          n: "5",
          title: "Check learning",
          blurb: "Live or async quiz, exit ticket and a quick rubric to score the work consistently.",
          toolIds: ["quiz-generator", "quizblast", "exit-ticket", "rubric-generator"],
        },
        {
          n: "6",
          title: "Roll into evidence",
          blurb: "Skill ladder rungs update, comment seeds queue for report season — no double-entry.",
          toolIds: ["skill-ladder", "report-comments"],
        },
      ]}
      tip={{
        title: "Planning tip",
        body: "Start with the Medium-Term Planner to map your sequence, then drop into Lesson Planner. Differentiate adapts the same resource for SEND and high-attainers in one click — and the Presentation Maker turns it into a slide deck.",
      }}
    />
  );
}
