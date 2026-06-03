/**
 * Regression test for the QA-score / SEND-fidelity ORDERING fix.
 *
 * Bug: `qaScoreBuilder.computeQaScore` scores `sendAdaptationQuality` (/15)
 * from `metadata.sendFidelityReport`. In the structured generation path the
 * QA scorer used to run (inside `runWorksheetPostValidators`) BEFORE
 * `applySendFidelityAudit` stamped that report — so for every SEND-tagged
 * worksheet the report was `undefined` at scoring time and the sheet silently
 * lost a flat 6/15 against a report that simply did not exist yet.
 *
 * Fix: re-run the (pure, idempotent) `applyQaScore` as the genuine LAST step,
 * after the fidelity report is present. These tests pin the scorer behaviour
 * that makes the ordering matter — and prove re-running after the report is
 * stamped yields the correct, higher score.
 */
import { describe, it, expect } from "vitest";
import { computeQaScore, applyQaScore, type QaScorableWorksheet } from "../qaScoreBuilder";

function sendWs(report?: QaScorableWorksheet["metadata"]["sendFidelityReport"]): QaScorableWorksheet {
  return {
    title: "T",
    sections: [
      { type: "objective" },
      { type: "vocabulary" },
      { type: "example" },
      { type: "recall", specRef: "x" },
      { type: "understanding", specRef: "x" },
      { type: "application", specRef: "x" },
      { type: "q-extended", specRef: "x" },
      { type: "challenge", specRef: "x" },
      { type: "teacher-key" },
    ],
    metadata: {
      subject: "Biology",
      topic: "Cells",
      yearGroup: "Year 9",
      examBoard: "AQA",
      generatorVersion: "v1",
      sendNeed: "dyslexia",
      ...(report ? { sendFidelityReport: report } : {}),
    },
  };
}

describe("QA score — SEND fidelity ordering", () => {
  it("loses 6/15 on a SEND sheet scored BEFORE the fidelity report exists", () => {
    const score = computeQaScore(sendWs(undefined));
    expect(score.sendAdaptationQuality).toBe(9); // 15 - 6
  });

  it("awards full SEND marks once the fidelity report (all rules ok) is present", () => {
    const score = computeQaScore(
      sendWs({ sendNeedId: "dyslexia", rules: [{ status: "ok" }, { status: "ok" }, { status: "ok" }] }),
    );
    expect(score.sendAdaptationQuality).toBe(15);
  });

  it("scales the deduction with the proportion of missing rules", () => {
    const score = computeQaScore(
      sendWs({
        sendNeedId: "dyslexia",
        rules: [{ status: "missing" }, { status: "ok" }, { status: "ok" }, { status: "ok" }],
      }),
    );
    // missRatio 0.25 → round(0.25*12)=3 → 15-3 = 12
    expect(score.sendAdaptationQuality).toBe(12);
  });

  it("the re-run (applyQaScore after the report is stamped) beats the SEND-blind score", () => {
    const blind = applyQaScore(sendWs(undefined));
    const informed = applyQaScore(
      sendWs({ sendNeedId: "dyslexia", rules: [{ status: "ok" }, { status: "ok" }] }),
    );
    const blindScore = (blind.metadata as any).qaScore.total as number;
    const informedScore = (informed.metadata as any).qaScore.total as number;
    expect(informedScore).toBeGreaterThan(blindScore);
    expect(informedScore - blindScore).toBe(6);
  });

  it("applyQaScore is idempotent", () => {
    const once = applyQaScore(sendWs({ sendNeedId: "dyslexia", rules: [{ status: "ok" }] }));
    const twice = applyQaScore(once);
    expect((twice.metadata as any).qaScore).toEqual((once.metadata as any).qaScore);
  });
});
