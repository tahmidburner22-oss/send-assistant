import { describe, expect, it } from "vitest";
import { SCIENCE_IMAGE_TAXONOMY, SCIENCE_IMAGE_TAXONOMY_SUMMARY } from "./scienceImageTaxonomy.js";
import {
  SCIENCE_IMAGE_GENERATOR_MODEL,
  buildScienceImageManifest,
  validateScienceImageManifest,
} from "./scienceImageGeneration.js";

describe("science image taxonomy", () => {
  it("covers all required school stages with a meaningful subtopic library", () => {
    expect(SCIENCE_IMAGE_TAXONOMY_SUMMARY.byStage.KS1).toBeGreaterThanOrEqual(20);
    expect(SCIENCE_IMAGE_TAXONOMY_SUMMARY.byStage.KS2).toBeGreaterThanOrEqual(45);
    expect(SCIENCE_IMAGE_TAXONOMY_SUMMARY.byStage.KS3).toBeGreaterThanOrEqual(55);
    expect(SCIENCE_IMAGE_TAXONOMY_SUMMARY.byStage.GCSE).toBeGreaterThanOrEqual(90);
    expect(SCIENCE_IMAGE_TAXONOMY.some((entry) => entry.requiredPractical)).toBe(true);
  });

  it("has a unique canonical identity for every taxonomy record", () => {
    const identities = SCIENCE_IMAGE_TAXONOMY.map((entry) => entry.id);
    expect(new Set(identities).size).toBe(identities.length);
    expect(SCIENCE_IMAGE_TAXONOMY.every((entry) => entry.topic && entry.subtopic && entry.learningFocus)).toBe(true);
  });
});

describe("science image generation manifest", () => {
  it("uses GPT Image 2 for every generated science asset and supplies complementary slots", () => {
    const manifest = buildScienceImageManifest({ includeRevisionMaps: true });
    expect(manifest.length).toBeGreaterThanOrEqual(500);
    expect(manifest.every((entry) => entry.generatorModel === SCIENCE_IMAGE_GENERATOR_MODEL)).toBe(true);
    expect(manifest.filter((entry) => entry.diagramType === "diagram_a").length).toBe(SCIENCE_IMAGE_TAXONOMY.length);
    expect(manifest.filter((entry) => entry.diagramType === "diagram_b").length).toBe(SCIENCE_IMAGE_TAXONOMY.length);
    expect(validateScienceImageManifest(manifest)).toEqual([]);
  });

  it("includes practical-specific guards for every required practical asset", () => {
    const practicalAssets = buildScienceImageManifest().filter((entry) => entry.requiredPractical);
    expect(practicalAssets.length).toBeGreaterThan(0);
    expect(practicalAssets.every((entry) => entry.prompt.toLowerCase().includes("required-practical"))).toBe(true);
    expect(practicalAssets.every((entry) => entry.reviewChecklist.some((item) => item.includes("required-practical")))).toBe(true);
  });
});
