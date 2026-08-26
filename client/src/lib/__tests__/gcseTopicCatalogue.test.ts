import { describe, expect, it } from "vitest";
import {
  GCSE_TOPIC_CATALOGUE,
  getGcseTopicChoices,
  isGcseTopicCatalogueSubject,
} from "../gcseTopicCatalogue";

describe("GCSE topic catalogue", () => {
  it("contains granular Mathematics and Science choices for both GCSE years", () => {
    for (const subject of ["mathematics", "science"] as const) {
      for (const yearGroup of ["Year 10", "Year 11"] as const) {
        expect(GCSE_TOPIC_CATALOGUE.some((entry) => entry.subject === subject && entry.yearGroup === yearGroup)).toBe(true);
      }
    }
  });

  it("only exposes Higher-only choices to Higher tier", () => {
    const foundation = getGcseTopicChoices("mathematics", "Year 10", "foundation");
    const higher = getGcseTopicChoices("mathematics", "Year 10", "higher");
    expect(foundation.some((entry) => entry.tier === "higher")).toBe(false);
    expect(higher.some((entry) => entry.tier === "higher")).toBe(true);
  });

  it("keeps shared content available to both Foundation and Higher pathways", () => {
    const foundation = getGcseTopicChoices("science", "Year 10", "foundation").map((entry) => entry.topic);
    const higher = getGcseTopicChoices("science", "Year 10", "higher").map((entry) => entry.topic);
    expect(foundation).toContain("Photosynthesis");
    expect(higher).toContain("Photosynthesis");
  });

  it("provides a non-empty learning objective for every choice", () => {
    expect(GCSE_TOPIC_CATALOGUE.every((entry) => entry.objective.trim().length > 20)).toBe(true);
  });

  it("recognises the worksheet subject ids used by the interface", () => {
    expect(isGcseTopicCatalogueSubject("mathematics")).toBe(true);
    expect(isGcseTopicCatalogueSubject("maths")).toBe(true);
    expect(isGcseTopicCatalogueSubject("science")).toBe(true);
    expect(isGcseTopicCatalogueSubject("english")).toBe(false);
  });
});
