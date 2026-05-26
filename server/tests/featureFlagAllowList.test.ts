/**
 * featureFlagAllowList.test.ts — W3 / FEAT-H8 admin wiring.
 *
 * Covers the pure validation + serialisation branches in
 * `server/lib/featureFlagAllowList.ts` (the disk-touching wrappers
 * sit on top of `parseAllowList` + `serializeAllowList`).
 */

import { describe, it, expect } from "vitest";
import {
  validateAllowEntry,
  parseAllowList,
  serializeAllowList,
  DARK_FLAG_NAMES,
} from "../lib/featureFlagAllowList";

describe("validateAllowEntry — happy path", () => {
  it("accepts a minimal valid entry", () => {
    const entry = validateAllowEntry({
      schoolId: "school-1",
      flag: "PROMPT_AB_ENABLED",
      enabled: true,
    });
    expect(entry).toEqual({
      schoolId: "school-1",
      flag: "PROMPT_AB_ENABLED",
      enabled: true,
      subjects: undefined,
      questionTypes: undefined,
    });
  });

  it("preserves optional subjects + questionTypes scopes", () => {
    const entry = validateAllowEntry({
      schoolId: "school-2",
      flag: "GENERATION_CACHE_ENABLED",
      enabled: false,
      subjects: ["maths", "physics"],
      questionTypes: ["mcq"],
    });
    expect(entry.subjects).toEqual(["maths", "physics"]);
    expect(entry.questionTypes).toEqual(["mcq"]);
  });
});

describe("validateAllowEntry — rejection branches", () => {
  it("rejects entries missing schoolId", () => {
    expect(() =>
      validateAllowEntry({ flag: "PROMPT_AB_ENABLED", enabled: true }),
    ).toThrow(/schoolId/);
  });

  it("rejects unknown flag names", () => {
    expect(() =>
      validateAllowEntry({
        schoolId: "school-3",
        flag: "NOT_A_REAL_FLAG",
        enabled: true,
      }),
    ).toThrow(/flag must be one of/);
  });

  it("rejects non-boolean enabled", () => {
    expect(() =>
      validateAllowEntry({
        schoolId: "school-4",
        flag: "PROMPT_FAMILIES_ENABLED",
        enabled: "yes",
      }),
    ).toThrow(/enabled must be a boolean/);
  });

  it("rejects non-array subjects", () => {
    expect(() =>
      validateAllowEntry({
        schoolId: "school-5",
        flag: "PROMPT_FAMILIES_ENABLED",
        enabled: true,
        subjects: "maths",
      }),
    ).toThrow(/subjects must be an array/);
  });
});

describe("parseAllowList — branch coverage", () => {
  it("returns an empty allow-list for empty input", () => {
    const file = parseAllowList("");
    expect(file).toEqual({ version: 1, entries: [] });
  });

  it("skips malformed entries but keeps valid siblings", () => {
    const raw = JSON.stringify({
      entries: [
        { schoolId: "ok", flag: "PROMPT_AB_ENABLED", enabled: true },
        { flag: "PROMPT_AB_ENABLED", enabled: true }, // missing schoolId
        { schoolId: "ok-2", flag: "BAD_FLAG", enabled: true }, // bad flag
      ],
    });
    const parsed = parseAllowList(raw);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].schoolId).toBe("ok");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseAllowList("{not json")).toThrow(/JSON parse failed/);
  });
});

describe("serializeAllowList", () => {
  it("emits version + updatedAt when supplied", () => {
    const out = serializeAllowList({
      version: 1,
      entries: [{ schoolId: "x", flag: "PROMPT_AB_ENABLED", enabled: true }],
      updatedAt: "2026-05-26T00:00:00.000Z",
    });
    const reparsed = JSON.parse(out);
    expect(reparsed.version).toBe(1);
    expect(reparsed.entries).toHaveLength(1);
    expect(reparsed.updatedAt).toBe("2026-05-26T00:00:00.000Z");
  });

  it("auto-stamps updatedAt when missing", () => {
    const out = serializeAllowList({ version: 1, entries: [] });
    const reparsed = JSON.parse(out);
    expect(typeof reparsed.updatedAt).toBe("string");
    expect(reparsed.updatedAt.length).toBeGreaterThan(10);
  });
});

describe("DARK_FLAG_NAMES", () => {
  it("is the canonical 5-flag list", () => {
    expect(DARK_FLAG_NAMES).toContain("PROMPT_AB_ENABLED");
    expect(DARK_FLAG_NAMES).toContain("GENERATION_CACHE_ENABLED");
    expect(DARK_FLAG_NAMES).toHaveLength(5);
  });
});
