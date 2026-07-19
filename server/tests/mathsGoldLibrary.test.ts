import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { applyOverlays, computeStructuralHash } from "../lib/overlayEngine.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const worksheetsDir = path.resolve(here, "../../worksheet-library/worksheets/maths");

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/×/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadWorksheets() {
  return fs.readdirSync(worksheetsDir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ({
      file,
      worksheet: JSON.parse(fs.readFileSync(path.join(worksheetsDir, file), "utf8")),
    }));
}

describe("converted maths gold library", () => {
  const files = loadWorksheets();

  it("contains exactly 128 independently addressable KS3/KS4 curated worksheets", () => {
    expect(files).toHaveLength(128);

    const identities = new Set<string>();
    const legacyTopicIdentities = new Set<string>();
    for (const { file, worksheet } of files) {
      expect(worksheet.subject).toMatch(/^math(?:s|ematics)$/i);
      expect(["Year 9", "Year 10", "Year 11"]).toContain(worksheet.yearGroup);
      expect(worksheet.topic).toBeTruthy();
      expect(worksheet.subtopic).toBeTruthy();
      expect(worksheet.sections.length).toBeGreaterThanOrEqual(5);
      expect(worksheet.teacher_sections.length).toBeGreaterThan(0);
      expect(worksheet.sections.every((section: any) => section.id && section.type)).toBe(true);
      expect(worksheet.sections.every((section: any) => section.isOverlay !== true)).toBe(true);

      const [topicFileSlug, subtopicFileSlug] = file.replace(/\.json$/, "").split("__");
      expect(topicFileSlug.replace(/[^a-z0-9]/g, "")).toBe(slug(worksheet.topic).replace(/-/g, ""));
      expect(subtopicFileSlug.replace(/[^a-z0-9]/g, "")).toBe(slug(worksheet.subtopic).replace(/-/g, ""));

      identities.add([
        worksheet.subject,
        worksheet.topic,
        worksheet.subtopic,
        worksheet.yearGroup,
        worksheet.tier || "mixed",
      ].join("|"));
      legacyTopicIdentities.add([
        worksheet.subject,
        worksheet.topic,
        worksheet.yearGroup,
        worksheet.tier || "mixed",
      ].join("|"));
    }

    expect(identities.size).toBe(128);
    // This guards against reintroducing the old topic-level importer collapse.
    expect(legacyTopicIdentities.size).toBe(37);
  });

  it("adds visible SEND and reading-age support without removing or rewriting base maths", () => {
    const sample = files.find(({ worksheet }) =>
      worksheet.topic === "Solving Linear Equations" &&
      worksheet.subtopic === "One-step equations"
    )?.worksheet;
    expect(sample).toBeTruthy();

    const baseSections = sample.sections;
    const baseHash = computeStructuralHash(baseSections);
    const result = applyOverlays(baseSections, {
      sendNeed: "dyslexia",
      readingAge: "11",
    });

    expect(result.baseStructuralHash).toBe(baseHash);
    expect(result.structurePreserved).toBe(true);
    expect(result.appliedOverlays.map((overlay) => overlay.type)).toEqual(
      expect.arrayContaining(["send_need", "reading_age"]),
    );

    const supportSections = result.sections.filter((section) => section.isOverlay && !section.teacherOnly);
    expect(supportSections.length).toBeGreaterThan(0);
    expect(supportSections.some((section) => section.type === "send-support")).toBe(true);
    expect(supportSections.every((section) => String(section.title || section.content || "").trim().length > 0)).toBe(true);

    for (const original of baseSections) {
      const rendered = result.sections.find((section) => section.id === original.id && !section.isOverlay);
      expect(rendered).toBeTruthy();
      expect(rendered?.type).toBe(original.type);
      expect(String(rendered?.content || "")).toContain(String(original.content || ""));
      expect(rendered?.imageUrl).toBe(original.imageUrl);
      expect(rendered?.assetRef).toBe(original.assetRef);
    }
  });
});
