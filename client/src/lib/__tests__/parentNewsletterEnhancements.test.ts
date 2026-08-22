import { describe, expect, it } from "vitest";
import {
  analyseReadability,
  buildFamilyDraftReviewGate,
  summariseGdpr,
} from "../parent-newsletter-enhancements";

describe("family communication review gate", () => {
  it("blocks personalised export when high-severity private information is present", () => {
    const draft = "Dear Parents and Carers, pupil Sam Jones has ADHD and uses medication at school.";
    const gate = buildFamilyDraftReviewGate({
      privacy: summariseGdpr(draft),
      readability: analyseReadability(draft),
      communicationType: "send-update",
    });

    expect(gate.status).toBe("blocked");
    expect(gate.mayExportPersonalisedCopies).toBe(false);
    expect(gate.blockers.join(" ")).toMatch(/privacy|safeguarding/i);
  });

  it("requires a human review even when automated checks find no high-risk issue", () => {
    const draft = "Dear Parents and Carers, our Year 4 class will visit the library on Friday. Please return the permission slip by Wednesday.";
    const gate = buildFamilyDraftReviewGate({
      privacy: summariseGdpr(draft),
      readability: analyseReadability(draft),
      communicationType: "letter",
    });

    expect(gate.status).toBe("review");
    expect(gate.mayExportPersonalisedCopies).toBe(true);
    expect(gate.checks.join(" ")).toMatch(/recipients|accuracy|approval/i);
  });
});
