/**
 * Classroom Hub — numbered storyboard for the in-the-room workflow.
 * Routine: warm-up → teach → check → adapt-on-the-fly → close.
 */
import HubStoryboard from "@/components/HubStoryboard";

export default function ClassroomHub() {
  return (
    <HubStoryboard
      hubLabel="Classroom Hub"
      hubBlurb="In-the-room tools — start the lesson, check learning, adapt on the fly."
      breadcrumb="Classroom Hub"
      accent="blue"
      steps={[
        {
          n: "1",
          title: "Warm up the class",
          blurb: "Open the Visual Timetable so pupils know the shape of the lesson; live read-aloud for any pupil who needs it.",
          toolIds: ["visual-timetable"],
        },
        {
          n: "2",
          title: "Read together",
          blurb: "Pull a passage at the right reading age — auto-generated or from your library — with comprehension questions ready.",
          toolIds: ["reading-and-stories"],
        },
        {
          n: "3",
          title: "Check for understanding",
          blurb: "Live QuizBlast for whole class; per-question miss-rate heatmap surfaces the pupils who need a reteach.",
          toolIds: ["quizblast"],
        },
        {
          n: "4",
          title: "Track progress on the rung",
          blurb: "Quiz / exit-ticket results auto-update the Skill Ladder. Cohort gaps surface as small-group worksheets.",
          toolIds: ["skill-ladder"],
        },
        {
          n: "5",
          title: "Step back and look across",
          blurb: "Cohort and intervention-ROI views from the Analytics dashboard — drill through to the named pupils underneath.",
          toolIds: ["analytics-dashboard"],
        },
      ]}
      tip={{
        title: "Classroom tip",
        body: "Drop the Skill Ladder on the board for the last 5 minutes of the lesson — pupils visibly see which rung they've moved up today, and you have your evidence the moment the bell goes.",
      }}
    />
  );
}
