import { describe, expect, it } from "vitest";
import { canRenderScienceLandscape, renderScienceLandscape, type ScienceLandscapeOptions } from "../scienceLandscapeRenderer";
import { canRenderHumanitiesLandscape, renderHumanitiesLandscape, type HumanitiesLandscapeOptions } from "../humanitiesLandscapeRenderer";

const SEND_NEED_IDS = [
  "dyslexia", "dyspraxia", "mld", "dyscalculia", "slcn", "eal", "adhd",
  "asc", "asperger", "anxiety", "semh", "pda-odd", "vi", "hi", "tourettes",
  "older-learners", "working-memory", "asc-social", "asc-demand-avoidant",
  "asc-sensory", "asc-rigid",
] as const;
const READING_AGES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const;

const SCIENCE_CASES: ScienceLandscapeOptions[] = [
  { subject: "Science", yearGroup: "Year 1", topic: "Plants" },
  { subject: "Science", yearGroup: "Year 4", topic: "States of Matter" },
  { subject: "Science", yearGroup: "Year 6", topic: "Electricity" },
  { subject: "Chemistry", yearGroup: "Year 10", topic: "Atomic Structure" },
  { subject: "Chemistry", yearGroup: "Year 10", topic: "Concentration of Solutions" },
  { subject: "Chemistry", yearGroup: "Year 10", topic: "Metallic Bonding" },
  { subject: "Biology", yearGroup: "Year 10", topic: "Cells and Microscopy" },
  { subject: "Biology", yearGroup: "Year 10", topic: "Photosynthesis" },
  { subject: "Biology", yearGroup: "Year 10", topic: "Genetics and Inheritance" },
  { subject: "Physics", yearGroup: "Year 10", topic: "Forces" },
  { subject: "Physics", yearGroup: "Year 10", topic: "Energy Stores" },
  { subject: "Physics", yearGroup: "Year 10", topic: "Waves" },
];

const HUMANITIES_CASES: HumanitiesLandscapeOptions[] = [
  { subject: "English Language", yearGroup: "Year 7", topic: "Creative Reading" },
  { subject: "English Language", yearGroup: "Year 9", topic: "Creative Reading" },
  { subject: "English Language", yearGroup: "Year 11", topic: "Creative Reading" },
  { subject: "History", yearGroup: "Year 7", topic: "The Norman Conquest" },
  { subject: "History", yearGroup: "Year 9", topic: "The First World War" },
  { subject: "History", yearGroup: "Year 11", topic: "Elizabethan England" },
  { subject: "Geography", yearGroup: "Year 7", topic: "Rivers" },
  { subject: "Geography", yearGroup: "Year 9", topic: "Climate Change" },
  { subject: "Geography", yearGroup: "Year 11", topic: "Urban Issues" },
  { subject: "Business", yearGroup: "Year 10", topic: "Marketing" },
  { subject: "Business", yearGroup: "Year 11", topic: "Finance" },
];

describe("dedicated Science and Humanities exhaustive adaptation matrix", () => {
  it("keeps every supported Science renderer as a single white A4 landscape page under all profile/age combinations", () => {
    let checks = 0;
    for (const base of SCIENCE_CASES) {
      expect(canRenderScienceLandscape(base), `${base.subject} / ${base.topic}`).toBe(true);
      for (const sendNeedId of SEND_NEED_IDS) {
        for (const readingAge of READING_AGES) {
          const document = renderScienceLandscape({ ...base, sendNeedId, readingAge });
          const label = `${base.subject} / ${base.topic} / ${sendNeedId} / age-${readingAge}`;
          expect(document.html.match(/class="science-page"/g), label).toHaveLength(1);
          expect(document.html, label).toContain("@page { size: A4 landscape; margin: 0; }");
          expect(document.html, label).toContain("background: #ffffff");
          expect(document.html, label).toContain(`Age ${readingAge}`);
          expect(document.adaptations, label).toContain(`Age ${readingAge}`);
          checks += 1;
        }
      }
    }
    expect(checks).toBe(SCIENCE_CASES.length * SEND_NEED_IDS.length * READING_AGES.length);
  }, 60_000);

  it("keeps every supported English, History, Geography and Business route as two white A4 landscape pages under all profile/age combinations", () => {
    let checks = 0;
    for (const base of HUMANITIES_CASES) {
      expect(canRenderHumanitiesLandscape(base), `${base.subject} / ${base.yearGroup}`).toBe(true);
      for (const sendNeedId of SEND_NEED_IDS) {
        for (const readingAge of READING_AGES) {
          const document = renderHumanitiesLandscape({ ...base, sendNeedId, readingAge });
          const label = `${base.subject} / ${base.yearGroup} / ${sendNeedId} / age-${readingAge}`;
          expect(document.html.match(/class="humanities-page"/g), label).toHaveLength(2);
          expect(document.html, label).toContain("@page { size: A4 landscape; margin: 0; }");
          expect(document.html, label).toContain("background:#ffffff");
          expect(document.html, label).toContain(`Age ${readingAge}`);
          expect(document.adaptations, label).toContain(`Age ${readingAge}`);
          checks += 1;
        }
      }
    }
    expect(checks).toBe(HUMANITIES_CASES.length * SEND_NEED_IDS.length * READING_AGES.length);
  }, 60_000);
});
