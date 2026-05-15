/**
 * Communications Hub — numbered storyboard.
 * Routine: write → schedule → push → log consent → measure read-rate.
 */
import HubStoryboard from "@/components/HubStoryboard";

export default function CommunicationsHub() {
  return (
    <HubStoryboard
      hubLabel="Communications Hub"
      hubBlurb="Reach parents, log consent, schedule meetings — auditable end-to-end."
      breadcrumb="Communications Hub"
      accent="pink"
      steps={[
        {
          n: "1",
          title: "Write what parents need to know",
          blurb: "Draft the newsletter at the right reading age; lint catches PII / attendance pressure / missing photo consent.",
          toolIds: ["parent-newsletter"],
        },
        {
          n: "2",
          title: "Make it personal",
          blurb: "Per-pupil report comments — house-style calibrated, gendered-language flagged, evidence quotes injected.",
          toolIds: ["report-comments"],
        },
        {
          n: "3",
          title: "Schedule the meetings",
          blurb: "EHCP reviews / parent meetings / interventions, with statutory-deadline guardrails and parent-self-booking links.",
          toolIds: ["scheduler"],
        },
        {
          n: "4",
          title: "Deliver to parents",
          blurb: "Push to the Parent Portal in their language — read-receipts logged, unread items auto-nudged after 7 days.",
          toolIds: ["parent-portal"],
        },
      ]}
      tip={{
        title: "Communications tip",
        body: "Translation, audio version and read-receipts mean a single SENCO can reach a multilingual cohort and prove every parent had access — without picking up the phone.",
      }}
    />
  );
}
