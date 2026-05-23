/**
 * generationCache.test.ts
 *
 * PR-11 tests — worksheet versioning pure helpers.
 */

import { describe, it, expect } from "vitest";
import {
  diffWorksheetSections,
  diffText,
  nextVersionNumber,
  enforceVersionCap,
  MAX_VERSIONS,
  type VersionSnapshot,
} from "../../client/src/lib/worksheetVersioning";

describe("PR-11 / worksheetVersioning — section diff", () => {
  it("identical sections produce all 'unchanged' statuses", () => {
    const sections = [
      { title: "Q1", content: "What is 2+2?", type: "q-short" },
      { title: "Q2", content: "What is 3+3?", type: "q-short" },
    ];
    const result = diffWorksheetSections(sections, sections);
    expect(result.totalChanged).toBe(0);
    expect(result.totalAdded).toBe(0);
    expect(result.totalRemoved).toBe(0);
    expect(result.sections.every((s) => s.status === "unchanged")).toBe(true);
  });

  it("edited section content is detected", () => {
    const before = [{ title: "Q1", content: "What is 2+2?", type: "q-short" }];
    const after = [{ title: "Q1", content: "What is 3+3?", type: "q-short" }];
    const result = diffWorksheetSections(before, after);
    expect(result.totalChanged).toBe(1);
    expect(result.sections[0].status).toBe("edited");
  });

  it("added sections at the end are detected", () => {
    const before = [{ title: "Q1", content: "A", type: "q" }];
    const after = [{ title: "Q1", content: "A", type: "q" }, { title: "Q2", content: "B", type: "q" }];
    const result = diffWorksheetSections(before, after);
    expect(result.totalAdded).toBe(1);
    expect(result.sections[1].status).toBe("added");
  });

  it("removed sections at the end are detected", () => {
    const before = [{ title: "Q1", content: "A", type: "q" }, { title: "Q2", content: "B", type: "q" }];
    const after = [{ title: "Q1", content: "A", type: "q" }];
    const result = diffWorksheetSections(before, after);
    expect(result.totalRemoved).toBe(1);
    expect(result.sections[1].status).toBe("removed");
  });
});

describe("PR-11 / worksheetVersioning — text diff", () => {
  it("identical text produces all 'same' tokens", () => {
    const tokens = diffText("hello world", "hello world");
    expect(tokens.every((t) => t.status === "same")).toBe(true);
  });

  it("added word is detected", () => {
    const tokens = diffText("hello world", "hello beautiful world");
    expect(tokens.some((t) => t.status === "added" && t.word === "beautiful")).toBe(true);
  });

  it("removed word is detected", () => {
    const tokens = diffText("hello beautiful world", "hello world");
    expect(tokens.some((t) => t.status === "removed" && t.word === "beautiful")).toBe(true);
  });
});

describe("PR-11 / worksheetVersioning — version number + cap", () => {
  it("nextVersionNumber returns 1 for empty array", () => {
    expect(nextVersionNumber([])).toBe(1);
  });

  it("nextVersionNumber returns max + 1", () => {
    const versions = [
      { versionNumber: 1, trigger: "manual-save", sections: [], createdAt: "" },
      { versionNumber: 3, trigger: "ai-edit", sections: [], createdAt: "" },
    ] as VersionSnapshot[];
    expect(nextVersionNumber(versions)).toBe(4);
  });

  it("enforceVersionCap keeps only newest MAX_VERSIONS entries", () => {
    const versions = Array.from({ length: 25 }, (_, i) => ({
      versionNumber: i + 1,
      trigger: "manual-save",
      sections: [],
      createdAt: "",
    })) as VersionSnapshot[];
    const capped = enforceVersionCap(versions);
    expect(capped.length).toBe(MAX_VERSIONS);
    expect(capped[0].versionNumber).toBe(6); // dropped 1-5
  });
});
