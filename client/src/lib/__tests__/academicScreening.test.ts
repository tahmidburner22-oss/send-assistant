import { describe, expect, it } from "vitest";
import {
  buildAcademicScreening,
  getAssessmentBlueprint,
  getItemCount,
  markAcademicScreening,
  type AcademicSubject,
  type AssessmentDuration,
} from "../academicScreening";

const subjects: AcademicSubject[] = ["mathematics", "english", "science"];
const durations: AssessmentDuration[] = [15, 30, 60];

describe("academic baseline assessment engine", () => {
  it("builds the required number of distinct, marked and timed questions for every subject and duration", () => {
    for (const subject of subjects) {
      for (const duration of durations) {
        const items = buildAcademicScreening({ subject, yearGroup: "Year 9", duration });
        expect(items).toHaveLength(getItemCount(duration));
        expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
        expect(items.every((item) => item.marks >= 1 && item.suggestedSeconds >= 60)).toBe(true);
        expect(items.every((item) => item.curriculumReference.length > 0)).toBe(true);
      }
    }
  });

  it("keeps every authored multiple-choice answer within its displayed options", () => {
    for (const subject of subjects) {
      const items = buildAcademicScreening({ subject, yearGroup: "Year 8", duration: 60 });
      for (const item of items.filter((candidate) => candidate.kind === "multiple-choice")) {
        expect(item.options).toContain(item.correctAnswer);
      }
    }
  });

  it("keeps the authored Year 7 cell-function answer scientifically accurate", () => {
    const [item] = buildAcademicScreening({ subject: "science", yearGroup: "Year 7", duration: 15 });
    expect(item.prompt).toContain("controls the activities of a cell");
    expect(item.correctAnswer).toBe("nucleus");
    expect(item.options).toContain("nucleus");
    expect(item.explanation).toContain("nucleus");
  });

  it("uses a different baseline for different year groups", () => {
    const year7 = buildAcademicScreening({ subject: "mathematics", yearGroup: "Year 7", duration: 60 });
    const year11 = buildAcademicScreening({ subject: "mathematics", yearGroup: "Year 11", duration: 60 });
    expect(year7.map((item) => item.id)).not.toEqual(year11.map((item) => item.id));
    expect(year7.map((item) => item.prompt)).not.toEqual(year11.map((item) => item.prompt));
  });

  it("marks authored answers safely against available marks rather than raw item count", () => {
    const config = { subject: "english" as const, yearGroup: "Year 7", duration: 15 as const };
    const items = buildAcademicScreening(config);
    const answers = Object.fromEntries(items.map((item) => [item.id, `  ${item.correctAnswer.toUpperCase()}.  `]));
    const report = markAcademicScreening(items, answers, config, 810);
    expect(report.score).toBe(report.total);
    expect(report.total).toBeGreaterThan(items.length);
    expect(report.percentage).toBe(100);
    expect(report.itemResults.every((result) => result.marksAwarded === result.marksAvailable)).toBe(true);
    expect(report.focusAreas).toHaveLength(0);
    expect(report.curriculumAge).toMatch(/years/);
  });

  it("awards transparent partial marks when a question defines independently creditable scientific components", () => {
    const config = { subject: "science" as const, yearGroup: "Year 7", duration: 60 as const };
    const items = buildAcademicScreening(config);
    const answer = "carbon dioxide + water -> sugar";
    const report = markAcademicScreening(items, { "y7s-plant": answer }, config, 1200);
    const result = report.itemResults.find((item) => item.itemId === "y7s-plant");
    expect(result?.marksAvailable).toBe(4);
    expect(result?.marksAwarded).toBe(3);
    expect(result?.correct).toBe(false);
  });

  it("publishes a realistic time-and-coverage blueprint for a full baseline", () => {
    const blueprint = getAssessmentBlueprint({ subject: "english", yearGroup: "Year 10", duration: 60 });
    expect(blueprint.itemCount).toBe(12);
    expect(blueprint.totalMarks).toBeGreaterThanOrEqual(14);
    expect(blueprint.plannedSeconds).toBeGreaterThanOrEqual(1500);
    expect(blueprint.domains.length).toBeGreaterThanOrEqual(4);
  });

  it("identifies focus areas and revision actions from low domain performance", () => {
    const items = buildAcademicScreening({ subject: "science", yearGroup: "Year 9", duration: 30 });
    const report = markAcademicScreening(items, {}, { subject: "science", yearGroup: "Year 9", duration: 30 }, 1200);
    expect(report.score).toBe(0);
    expect(report.focusAreas.length).toBeGreaterThan(0);
    expect(report.revisionTips.length).toBe(report.focusAreas.length);
    expect(report.curriculumAgeMonths).toBeGreaterThanOrEqual(84);
  });
});
