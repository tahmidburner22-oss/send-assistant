import { describe, expect, it } from "vitest";
import { MATHS_GOLD_MANIFEST, hasGoldWorksheet } from "@/data/maths-gold/manifest";
import { getSyllabusTopics } from "@/lib/syllabus-data";
import { getSubtopics } from "@/lib/subtopics-data";

const approvedTopics = new Set(MATHS_GOLD_MANIFEST.map((entry) => entry.topic));

describe("KS3/KS4 approved Maths selector coverage", () => {
  it("shows only Maths curriculum topics with an approved two-page subtopic", () => {
    for (const yearGroup of ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"]) {
      const displayed = getSyllabusTopics("mathematics", yearGroup)
        .filter((entry) => approvedTopics.has(entry.topic));
      expect(displayed.length, yearGroup).toBeGreaterThan(0);
      for (const topic of displayed) {
        const approvedSubtopics = getSubtopics(topic.topic)
          .filter((subtopic) => hasGoldWorksheet(topic.topic, subtopic));
        expect(approvedSubtopics.length, `${yearGroup}: ${topic.topic}`).toBeGreaterThan(0);
      }
    }
  });

  it("excludes legacy subtopics that have no approved gold JSON template", () => {
    const approvedQuadratics = getSubtopics("Quadratic Equations")
      .filter((subtopic) => hasGoldWorksheet("Quadratic Equations", subtopic));
    const approvedIndices = getSubtopics("Indices and Standard Form")
      .filter((subtopic) => hasGoldWorksheet("Indices and Standard Form", subtopic));
    expect(approvedQuadratics).not.toContain("Using the quadratic formula");
    expect(approvedIndices).not.toContain("Laws of indices");
    expect(approvedIndices).not.toContain("Negative and fractional indices");
  });
});
