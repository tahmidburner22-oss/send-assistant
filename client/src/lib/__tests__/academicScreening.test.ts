import { describe, expect, it } from "vitest";
import {
  buildAcademicScreening,
  getItemCount,
  markAcademicScreening,
  type AcademicSubject,
  type AssessmentDuration,
} from "../academicScreening";

const subjects: AcademicSubject[] = ["mathematics", "english", "science"];
const durations: AssessmentDuration[] = [15, 30, 60];

describe("academic screening engine", () => {
  it("builds the required number of original mixed-format questions for every subject and duration", () => {
    for (const subject of subjects) {
      for (const duration of durations) {
        const items = buildAcademicScreening({ subject, yearGroup: "Year 9", duration });
        expect(items).toHaveLength(getItemCount(duration));
        expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
        expect(items.some((item) => item.kind === "multiple-choice")).toBe(true);
        expect(items.some((item) => item.kind === "short-answer")).toBe(true);
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

  it("keeps the authored cell-function answer scientifically accurate", () => {
    const [item] = buildAcademicScreening({ subject: "science", yearGroup: "Year 10", duration: 15 });
    expect(item.prompt).toContain("controls the activities of the cell");
    expect(item.correctAnswer).toBe("Nucleus");
    expect(item.options).toContain("Nucleus");
    expect(item.explanation).toContain("nucleus");
  });

  it("returns the same balanced item sequence for the same configuration", () => {
    const first = buildAcademicScreening({ subject: "mathematics", yearGroup: "Year 10", duration: 30 });
    const second = buildAcademicScreening({ subject: "mathematics", yearGroup: "Year 10", duration: 30 });
    expect(second).toEqual(first);
  });

  it("marks case, trailing punctuation, and whitespace safely for authored short answers", () => {
    const items = buildAcademicScreening({ subject: "english", yearGroup: "Year 7", duration: 15 });
    const answers = Object.fromEntries(items.map((item) => [item.id, `  ${item.correctAnswer.toUpperCase()}.  `]));
    const report = markAcademicScreening(items, answers, { subject: "english", yearGroup: "Year 7", duration: 15 }, 810);
    expect(report.score).toBe(items.length);
    expect(report.percentage).toBe(100);
    expect(report.strengths.length).toBeGreaterThan(0);
    expect(report.focusAreas).toHaveLength(0);
    expect(report.curriculumAge).toMatch(/years/);
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
