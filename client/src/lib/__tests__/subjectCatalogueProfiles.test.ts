import { describe, expect, it } from "vitest";
import { subjects } from "../send-data";
import { getSubjectProfile } from "../subject-profiles";

const EXPECTED_PROFILE_LABELS: Record<string, string> = {
  english: "English",
  mathematics: "Mathematics",
  science: "Science",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  history: "History",
  geography: "Geography",
  art: "Art & Design",
  music: "Music",
  pe: "Physical Education",
  computing: "Computer Science",
  "computer-science": "Computer Science",
  dt: "Design & Technology",
  re: "Religious Studies",
  mfl: "Modern Foreign Languages",
  pshe: "PSHE",
  business: "Business Studies",
  drama: "Drama",
};

describe("advertised worksheet subject catalogue", () => {
  it("routes every advertised subject to its own curriculum profile", () => {
    for (const subject of subjects) {
      expect(getSubjectProfile(subject.id).label, subject.id).toBe(EXPECTED_PROFILE_LABELS[subject.id]);
    }
  });
});
