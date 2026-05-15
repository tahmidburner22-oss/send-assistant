/**
 * Planning Hub — refactored to a numbered storyboard.
 * Same tool surface area, but presented as a workflow the teacher walks through
 * (map → plan → build → differentiate → check → evidence) rather than a grid
 * of feature cards.
 */
import HubStoryboard from "@/components/HubStoryboard";

export default function PlanningHub() {
  return (
    <HubStoryboard
      hubLabel="Planning Hub"
      hubBlurb="From half-term sequence to tomorrow's lesson — one workflow."
      breadcrumb="Planning Hub"
      accent="green"
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
          blurb: "Pull a row from the MTP into a full lesson plan with adaptive-teaching column for each named SEND pupil.",
          toolIds: ["lesson-planner"],
        },
        {
          n: "3",
          title: "Build the work",
          blurb: "Generate the worksheet, supporting story or comprehension passage from the same topic.",
          toolIds: ["worksheet-generator", "reading-and-stories"],
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
          blurb: "Live or async quiz, then a quick rubric to score the work consistently.",
          toolIds: ["quizblast", "rubric-generator"],
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
        body: "Start with the Medium-Term Planner to map your sequence, then use the Lesson Planner for individual lessons. Differentiate adapts the same resource for SEND and high-attainers in one click.",
      }}
    />
  );
}
