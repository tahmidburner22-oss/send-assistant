/**
 * Revision Hub — numbered storyboard.
 * Routine: pick the topic → consume in the right modality → drill → assess.
 */
import HubStoryboard from "@/components/HubStoryboard";
import { GraduationCap } from "lucide-react";

export default function RevisionHubSection() {
  return (
    <HubStoryboard
      hubLabel="Revision Hub"
      hubBlurb="Pick a topic, consume in any modality, drill it, then assess on a real past paper."
      breadcrumb="Revision Hub"
      accent="indigo"
      hubId="revision"
      heroIcon={GraduationCap}
      steps={[
        {
          n: "1",
          title: "Pick the topic",
          blurb: "Pull a worksheet on the topic at the right ability level — same topic flows through every other revision step.",
          toolIds: ["worksheet-generator"],
        },
        {
          n: "2",
          title: "Listen on the move",
          blurb: "Audio summary with karaoke highlight + voice navigation — strongest engagement for SEND and EAL learners.",
          toolIds: ["audio-revision-hub"],
        },
        {
          n: "3",
          title: "Drill the recall",
          blurb: "Spaced-repetition flashcards (SM-2) auto-generated from the worksheet — cloze + image-occlusion modes.",
          toolIds: ["flash-cards"],
        },
        {
          n: "4",
          title: "Assess against a real paper",
          blurb: "SEND-adapted question pack (extra time, dyslexia font, large print) auto-marked against the AO grid.",
          toolIds: ["past-papers"],
        },
        {
          n: "5",
          title: "Build a mock exam paper",
          blurb: "Pick subject, topics and total marks — the bank assembles a real-style mock paper with warm-up / core / stretch sections, balanced AOs, and a teacher mark scheme.",
          toolIds: ["create-exam-paper"],
        },
      ]}
      tip={{
        title: "Revision tip",
        body: "Same topic flows through worksheet → audio → flashcards → past-paper question. Every output is logged on the pupil's timeline, so revision time is also evidence time.",
      }}
    />
  );
}
