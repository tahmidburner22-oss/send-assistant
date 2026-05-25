/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * client/src/lib/__tests__/perSubjectPromptFamilies.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lock the per-subject prompt-family routing surface. Pure tests —
 * no LLM, no I/O. Purpose: prevent silent regressions to
 * `lookupPromptFamily` (e.g. a refactor that drops the
 * english-language branch causing every English worksheet to fall
 * through to "general").
 *
 * Sprint 3.C (PR-1 / big-bang-7-sprints).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";

import {
  PROMPT_FAMILIES,
  lookupPromptFamily,
  renderPromptFamily,
  type PromptFamily,
  type PromptFamilyKey,
} from "../perSubjectPromptFamilies";

// ─── Identity / shape ────────────────────────────────────────────────────────

describe("PROMPT_FAMILIES registry", () => {
  it("contains exactly the seven expected family keys", () => {
    const keys = Object.keys(PROMPT_FAMILIES).sort();
    expect(keys).toEqual(
      [
        "creative",
        "english-lang",
        "english-lit",
        "general",
        "humanities",
        "maths",
        "science",
      ].sort(),
    );
  });

  it("every family declares a non-empty header", () => {
    for (const key of Object.keys(PROMPT_FAMILIES) as PromptFamilyKey[]) {
      const f = PROMPT_FAMILIES[key];
      expect(f.header).toBeTruthy();
      expect(f.header.length).toBeGreaterThan(20); // not just a placeholder
    }
  });

  it("every family declares at least one extraDirective", () => {
    for (const key of Object.keys(PROMPT_FAMILIES) as PromptFamilyKey[]) {
      const f = PROMPT_FAMILIES[key];
      expect(f.extraDirectives.length).toBeGreaterThan(0);
    }
  });

  it("every family's `key` field matches its registry slot", () => {
    for (const key of Object.keys(PROMPT_FAMILIES) as PromptFamilyKey[]) {
      expect(PROMPT_FAMILIES[key].key).toBe(key);
    }
  });

  it("the registry is frozen (defensive immutability check)", () => {
    expect(() => {
      // @ts-expect-error — testing runtime freeze
      PROMPT_FAMILIES.maths = { key: "maths", header: "x", extraDirectives: [], forbiddenPatterns: [] };
    }).toThrow();
  });
});

// ─── lookupPromptFamily routing ──────────────────────────────────────────────

describe("lookupPromptFamily — primary subject routing", () => {
  it.each([
    ["Maths", "maths"],
    ["Mathematics", "maths"],
    ["GCSE Maths", "maths"],
    ["maths", "maths"], // case-insensitive
    ["MATHEMATICS", "maths"],
    ["A-Level Mathematics", "maths"],
  ])("'%s' → %s", (subject, expected) => {
    expect(lookupPromptFamily(subject).key).toBe(expected);
  });

  it.each([
    ["Biology", "science"],
    ["Chemistry", "science"],
    ["Physics", "science"],
    ["Combined Science", "science"],
    ["Triple Science", "science"],
    ["GCSE Biology", "science"],
  ])("'%s' → %s", (subject, expected) => {
    expect(lookupPromptFamily(subject).key).toBe(expected);
  });

  it.each([
    ["English Literature", "english-lit"],
    ["English Lit", "english-lit"],
    ["GCSE English Literature", "english-lit"],
    ["A-Level English Literature", "english-lit"],
  ])("'%s' → %s", (subject, expected) => {
    expect(lookupPromptFamily(subject).key).toBe(expected);
  });

  it.each([
    ["English Language", "english-lang"],
    ["English Lang", "english-lang"],
    ["GCSE English Language", "english-lang"],
  ])("'%s' → %s", (subject, expected) => {
    expect(lookupPromptFamily(subject).key).toBe(expected);
  });

  it.each([
    ["History", "humanities"],
    ["Geography", "humanities"],
    ["Religious Studies", "humanities"],
    ["Religious Education", "humanities"],
    ["Economics", "humanities"],
  ])("'%s' → %s", (subject, expected) => {
    expect(lookupPromptFamily(subject).key).toBe(expected);
  });

  it.each([
    ["Art", "creative"],
    ["Music", "creative"],
    ["Drama", "creative"],
    ["Design and Technology", "creative"],
    ["Art and Design", "creative"],
  ])("'%s' → %s", (subject, expected) => {
    expect(lookupPromptFamily(subject).key).toBe(expected);
  });

  it("unknown subjects fall back to 'general'", () => {
    expect(lookupPromptFamily("Underwater basket weaving").key).toBe("general");
    expect(lookupPromptFamily("").key).toBe("general");
    expect(lookupPromptFamily(undefined).key).toBe("general");
  });

  it("Maths NEVER routes to english-lit (the load-bearing test)", () => {
    // The whole point of Sprint 3.C is to prevent a refactor from
    // accidentally swapping the maths and english-lit prompts —
    // which would silently degrade quality on the largest worksheet
    // segment.
    const maths = lookupPromptFamily("GCSE Maths Higher");
    expect(maths.key).toBe("maths");
    expect(maths.key).not.toBe("english-lit");
    expect(maths).not.toBe(PROMPT_FAMILIES["english-lit"]);
  });

  it("English Literature NEVER routes to english-lang", () => {
    const lit = lookupPromptFamily("AQA GCSE English Literature");
    expect(lit.key).toBe("english-lit");
    expect(lit.key).not.toBe("english-lang");
  });
});

// ─── Forbidden-pattern lock ──────────────────────────────────────────────────

describe("forbidden-pattern lock", () => {
  it("maths forbids imperial / fahrenheit units", () => {
    const maths = PROMPT_FAMILIES.maths;
    expect(maths.forbiddenPatterns).toContain("mph");
    expect(maths.forbiddenPatterns).toContain("lbs");
    expect(maths.forbiddenPatterns).toContain("°F");
  });

  it("science forbids the maths-only working-out box (Phase 1 lock)", () => {
    const sci = PROMPT_FAMILIES.science;
    expect(sci.forbiddenPatterns).toContain("dot-grid working out");
    expect(sci.forbiddenPatterns).toContain("workingOutBox: true");
  });

  it("english-lit forbids plot summary (Phase 5 / lit-spec lock)", () => {
    const lit = PROMPT_FAMILIES["english-lit"];
    expect(lit.forbiddenPatterns).toContain("plot summary");
    expect(lit.forbiddenPatterns).toContain("what happens next");
  });
});

// ─── renderPromptFamily ──────────────────────────────────────────────────────

describe("renderPromptFamily", () => {
  it("includes the family header verbatim", () => {
    const rendered = renderPromptFamily(PROMPT_FAMILIES.maths);
    expect(rendered).toContain(PROMPT_FAMILIES.maths.header);
  });

  it("includes every extraDirective as a bullet line", () => {
    const family = PROMPT_FAMILIES.maths;
    const rendered = renderPromptFamily(family);
    for (const directive of family.extraDirectives) {
      expect(rendered).toContain(`- ${directive}`);
    }
  });

  it("includes the forbidden-patterns block when present", () => {
    const rendered = renderPromptFamily(PROMPT_FAMILIES.maths);
    expect(rendered).toContain("FORBIDDEN PATTERNS");
    expect(rendered).toContain("- mph");
    expect(rendered).toContain("- lbs");
  });

  it("omits the forbidden-patterns block when the family has none", () => {
    // english-lang has [] forbidden patterns
    const rendered = renderPromptFamily(PROMPT_FAMILIES["english-lang"]);
    expect(rendered).not.toContain("FORBIDDEN PATTERNS");
  });

  it("output is non-empty for every family", () => {
    for (const key of Object.keys(PROMPT_FAMILIES) as PromptFamilyKey[]) {
      const f: PromptFamily = PROMPT_FAMILIES[key];
      const rendered = renderPromptFamily(f);
      expect(rendered.length).toBeGreaterThan(50);
    }
  });
});
