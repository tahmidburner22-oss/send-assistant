import { describe, expect, it } from "vitest";
import {
  BASELINE_BANKS,
  getBaselineQuestions,
  plannedAssessmentSeconds,
  totalAssessmentMarks,
} from "../baselineAssessmentBank";

const YEARS = ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"];
const SUBJECTS = ["mathematics", "english", "science"] as const;

describe("baseline assessment bank", () => {
  it("provides a complete original, marked and timed assessment for each subject and year", () => {
    for (const subject of SUBJECTS) {
      for (const year of YEARS) {
        const items = getBaselineQuestions(subject, year);
        expect(items).toHaveLength(12);
        expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
        expect(items.every((item) => item.subject === subject && item.yearGroup === year)).toBe(true);
        expect(items.every((item) => item.prompt.length > 12 && item.correctAnswer.length > 0)).toBe(true);
        expect(items.every((item) => item.marks >= 1 && item.suggestedSeconds >= 60)).toBe(true);
        // Retain sufficient weighted demand without inflating valid one-mark retrieval checks.
        expect(totalAssessmentMarks(items)).toBeGreaterThanOrEqual(14);
        // The 60-minute route is an upper time window; the authored diagnostic content must still provide at least 20 minutes of genuine working time.
        expect(plannedAssessmentSeconds(items)).toBeGreaterThanOrEqual(1200);
      }
    }
  });

  it("does not recycle an identical question prompt across year groups within a subject", () => {
    for (const subject of SUBJECTS) {
      const prompts = YEARS.flatMap((year) => BASELINE_BANKS[subject][year].map((item) => item.prompt));
      expect(new Set(prompts).size).toBe(prompts.length);
    }
  });

  it("builds assessments with breadth across curriculum domains", () => {
    for (const subject of SUBJECTS) {
      for (const year of YEARS) {
        const domains = new Set(getBaselineQuestions(subject, year).map((item) => item.domain));
        expect(domains.size).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
