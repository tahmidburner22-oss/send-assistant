/**
 * Communications Hub — numbered storyboard.
 * Routine: write → adapt the language → schedule → push → measure read-rate.
 */
import HubStoryboard from "@/components/HubStoryboard";
import { MessageCircle } from "lucide-react";

export default function CommunicationsHub() {
  return (
    <HubStoryboard
      hubLabel="Communications Hub"
      hubBlurb="Reach parents, log consent, schedule meetings — auditable end-to-end."
      breadcrumb="Communications Hub"
      accent="pink"
      hubId="communications"
      heroIcon={MessageCircle}
      steps={[
        {
          n: "1",
          title: "Write what parents need to know",
          blurb: "Draft the newsletter at the right reading age; lint catches PII / attendance pressure / missing photo consent.",
          toolIds: ["parent-newsletter"],
        },
        {
          n: "2",
          title: "Adapt the language",
          blurb: "Rewrite any text for a target reading age, or simplify jargon for parent-facing copy.",
          toolIds: ["text-rewriter"],
        },
        {
          n: "3",
          title: "Make it personal",
          blurb: "Per-pupil report comments — house-style calibrated, gendered-language flagged, evidence quotes injected.",
          toolIds: ["report-comments"],
        },
        {
          n: "4",
          title: "Schedule the meetings",
          blurb: "EHCP reviews / parent meetings / interventions, with statutory-deadline guardrails and parent-self-booking links.",
          toolIds: ["scheduler"],
        },
        {
          n: "5",
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
