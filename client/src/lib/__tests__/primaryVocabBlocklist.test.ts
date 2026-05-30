/**
 * Tests for the Lane 3.2 primary vocabulary blocklist:
 *   - the pure module (`primaryVocabBlocklist.ts`): band derivation,
 *     strict nesting (KS1 ⊃ LKS2 ⊃ UKS2), and the whole-word scanner.
 *   - the post-validator (`enforcePrimaryVocabBlocklist`): no-op for
 *     secondary, fail-closed detection on primary, structured metadata
 *     stamp, idempotency, and teacher-only skipping.
 *
 * Spec: docs/primary-worksheet-improvement-plan.md W1 step 2.
 */

import { describe, expect, it } from "vitest";
import {
  primaryBandForYear,
  primaryBandForYearGroup,
  blockedWordsForBand,
  findBlockedVocab,
  renderPrimaryVocabBlocklistPrompt,
  KS1_BLOCKED,
  LKS2_BLOCKED,
  UKS2_BLOCKED,
} from "../primaryVocabBlocklist";
import {
  enforcePrimaryVocabBlocklist,
  type PostValidatorWorksheet,
} from "../worksheetPostValidator";

// ── Band derivation ──────────────────────────────────────────────────────────

describe("primaryBandForYear", () => {
  it("maps Y1-2 → KS1, Y3-4 → LKS2, Y5-6 → UKS2", () => {
    expect(primaryBandForYear(1)).toBe("KS1");
    expect(primaryBandForYear(2)).toBe("KS1");
    expect(primaryBandForYear(3)).toBe("LKS2");
    expect(primaryBandForYear(4)).toBe("LKS2");
    expect(primaryBandForYear(5)).toBe("UKS2");
    expect(primaryBandForYear(6)).toBe("UKS2");
  });

  it("returns undefined for non-primary years", () => {
    for (const y of [0, 7, 8, 9, 10, 11, 12, 13, -1]) {
      expect(primaryBandForYear(y)).toBeUndefined();
    }
  });
});

describe("primaryBandForYearGroup", () => {
  it("resolves 'Year N' strings to the right band", () => {
    expect(primaryBandForYearGroup("Year 1")).toBe("KS1");
    expect(primaryBandForYearGroup("Year 4")).toBe("LKS2");
    expect(primaryBandForYearGroup("Year 6")).toBe("UKS2");
  });

  it("treats secondary year strings as non-primary", () => {
    for (const g of ["Year 7", "Year 9", "Year 10", "Year 11", "Year 13"]) {
      expect(primaryBandForYearGroup(g)).toBeUndefined();
    }
  });

  it("maps 11+ prep to UKS2 (top of KS2)", () => {
    expect(primaryBandForYearGroup("11+ Preparation")).toBe("UKS2");
    expect(primaryBandForYearGroup("11+")).toBe("UKS2");
  });

  it("maps generic key-stage strings: KS1 → KS1, KS2 → UKS2 (lightest, never over-block)", () => {
    expect(primaryBandForYearGroup("KS1")).toBe("KS1");
    expect(primaryBandForYearGroup("KS2")).toBe("UKS2");
  });

  it("does NOT misread KS3/KS4/KS5/GCSE/A-Level as a primary year", () => {
    for (const g of ["KS3", "KS4", "KS5", "GCSE", "A-Level", "A Level"]) {
      expect(primaryBandForYearGroup(g)).toBeUndefined();
    }
  });

  it("returns undefined for empty / undefined input", () => {
    expect(primaryBandForYearGroup(undefined)).toBeUndefined();
    expect(primaryBandForYearGroup("")).toBeUndefined();
  });
});

// ── Strict nesting KS1 ⊃ LKS2 ⊃ UKS2 ─────────────────────────────────────────

describe("blocklist nesting", () => {
  const words = (list: readonly { word: string }[]) =>
    new Set(list.map((w) => w.word));

  it("UKS2 ⊆ LKS2 ⊆ KS1 (each broader band contains the lighter one)", () => {
    const u = words(UKS2_BLOCKED);
    const l = words(LKS2_BLOCKED);
    const k = words(KS1_BLOCKED);
    for (const w of u) expect(l.has(w)).toBe(true);
    for (const w of l) expect(k.has(w)).toBe(true);
  });

  it("each broader band is strictly larger (adds at least one word)", () => {
    expect(LKS2_BLOCKED.length).toBeGreaterThan(UKS2_BLOCKED.length);
    expect(KS1_BLOCKED.length).toBeGreaterThan(LKS2_BLOCKED.length);
  });

  it("upper-KS2 subject words (circumference, photosynthesis) are blocked at LKS2/KS1 but NOT at UKS2", () => {
    const u = words(UKS2_BLOCKED);
    const l = words(LKS2_BLOCKED);
    for (const w of ["circumference", "photosynthesis", "perpendicular", "denominator"]) {
      expect(u.has(w)).toBe(false);
      expect(l.has(w)).toBe(true);
    }
  });

  it("genuinely secondary words (analyse, evaluate) are blocked at every band", () => {
    for (const w of ["analyse", "evaluate", "synthesise", "equilibrium"]) {
      expect(words(UKS2_BLOCKED).has(w)).toBe(true);
      expect(words(LKS2_BLOCKED).has(w)).toBe(true);
      expect(words(KS1_BLOCKED).has(w)).toBe(true);
    }
  });

  it("KS1-only everyday-academic words (describe, predict) appear only at KS1", () => {
    for (const w of ["describe", "predict", "compare"]) {
      expect(words(UKS2_BLOCKED).has(w)).toBe(false);
      expect(words(LKS2_BLOCKED).has(w)).toBe(false);
      expect(words(KS1_BLOCKED).has(w)).toBe(true);
    }
  });

  it("blockedWordsForBand returns the right list per band", () => {
    expect(blockedWordsForBand("KS1")).toBe(KS1_BLOCKED);
    expect(blockedWordsForBand("LKS2")).toBe(LKS2_BLOCKED);
    expect(blockedWordsForBand("UKS2")).toBe(UKS2_BLOCKED);
  });
});

// ── Scanner ──────────────────────────────────────────────────────────────────

describe("findBlockedVocab", () => {
  it("finds a blocked word case-insensitively and reports the count", () => {
    const hits = findBlockedVocab("Analyse the data. Then analyse it again.", "KS1");
    const analyse = hits.find((h) => h.word === "analyse");
    expect(analyse).toBeDefined();
    expect(analyse!.count).toBe(2);
  });

  it("matches inflections of a blocked stem (plurals / -ing / -ed)", () => {
    const hits = findBlockedVocab("Evaluating the criteria and evaluated the results.", "KS1");
    expect(hits.some((h) => h.word === "evaluate")).toBe(true);
    expect(hits.some((h) => h.word === "criteria")).toBe(true);
  });

  it("does NOT fire on a sub-string inside an unrelated word", () => {
    // "ionic" must not match inside "ironic"; "reduction" must not match
    // inside "reductionism" is OK to match (stem), but "ionic" in "ironic"
    // is a false positive we must avoid via \b boundaries.
    const hits = findBlockedVocab("That was an ironic twist.", "KS1");
    expect(hits.some((h) => h.word === "ionic")).toBe(false);
  });

  it("returns the plain-English replacement when the entry carries one", () => {
    const hits = findBlockedVocab("Explain photosynthesis in plants.", "KS1");
    const photo = hits.find((h) => h.word === "photosynthesis");
    expect(photo).toBeDefined();
    expect(photo!.replacement).toMatch(/how plants make food/);
  });

  it("UKS2 does not flag a Y6 curriculum word like 'circumference'", () => {
    const hits = findBlockedVocab("Measure the circumference of the circle.", "UKS2");
    expect(hits.some((h) => h.word === "circumference")).toBe(false);
  });

  it("LKS2 DOES flag 'circumference' (too early for Y3/Y4)", () => {
    const hits = findBlockedVocab("Measure the circumference of the circle.", "LKS2");
    expect(hits.some((h) => h.word === "circumference")).toBe(true);
  });

  it("returns an empty array for empty / non-string input", () => {
    expect(findBlockedVocab("", "KS1")).toEqual([]);
    // @ts-expect-error — exercising the runtime guard
    expect(findBlockedVocab(null, "KS1")).toEqual([]);
  });
});

// ── Validator integration ────────────────────────────────────────────────────

function makePrimaryWs(content: string, yearGroup = "Year 1"): PostValidatorWorksheet {
  return {
    title: "Plants",
    metadata: { subject: "Science", topic: "Plants", yearGroup },
    sections: [
      { id: "q1", type: "q-short-answer", title: "Q1", content, teacherOnly: false },
      {
        id: "tk",
        type: "mark-scheme",
        title: "Teacher Key",
        content: "Analyse the photosynthesis process: evaluate the rate.",
        teacherOnly: true,
      },
    ],
  };
}

describe("enforcePrimaryVocabBlocklist", () => {
  it("is a no-op for a secondary year group (no warnings, worksheet untouched)", () => {
    const ws = makePrimaryWs("Analyse the graph and evaluate the trend.", "Year 10");
    const before = JSON.stringify(ws);
    const { worksheet, warnings } = enforcePrimaryVocabBlocklist(ws, { yearGroup: "Year 10" });
    expect(warnings).toHaveLength(0);
    expect(JSON.stringify(worksheet)).toBe(before);
  });

  it("flags a blocked word in pupil-facing content on a KS1 sheet", () => {
    const ws = makePrimaryWs("Analyse the picture and tell me what you see.", "Year 1");
    const { worksheet, warnings } = enforcePrimaryVocabBlocklist(ws, { yearGroup: "Year 1" });
    expect(warnings.some((w) => /blocked word "analyse"/i.test(w))).toBe(true);
    const violations = (worksheet.metadata as any).primaryVocabViolations;
    expect(Array.isArray(violations)).toBe(true);
    expect(violations.some((v: any) => v.word === "analyse" && v.band === "KS1")).toBe(true);
  });

  it("surfaces the plain-English replacement in the warning when available", () => {
    const ws = makePrimaryWs("Describe photosynthesis to a friend.", "Year 1");
    const { warnings } = enforcePrimaryVocabBlocklist(ws, { yearGroup: "Year 1" });
    expect(warnings.some((w) => /how plants make food/.test(w))).toBe(true);
  });

  it("does NOT scan teacher-only sections (mark scheme legitimately uses subject words)", () => {
    // The pupil section here is clean; only the teacher-only mark scheme
    // contains blocked words. No violations should be raised.
    const ws = makePrimaryWs("Look at the plant. Circle the leaf.", "Year 1");
    const { worksheet, warnings } = enforcePrimaryVocabBlocklist(ws, { yearGroup: "Year 1" });
    expect(warnings).toHaveLength(0);
    expect((worksheet.metadata as any).primaryVocabViolations).toHaveLength(0);
  });

  it("is idempotent — a second pass adds no fresh warnings and is deep-equal", () => {
    const ws = makePrimaryWs("Analyse and evaluate the picture.", "Year 1");
    const first = enforcePrimaryVocabBlocklist(ws, { yearGroup: "Year 1" });
    expect(first.warnings.length).toBeGreaterThan(0);
    const second = enforcePrimaryVocabBlocklist(first.worksheet, { yearGroup: "Year 1" });
    expect(second.warnings).toHaveLength(0);
    expect(JSON.stringify(second.worksheet)).toBe(JSON.stringify(first.worksheet));
  });

  it("reads the year group from worksheet metadata when opts.yearGroup is absent", () => {
    const ws = makePrimaryWs("Analyse the diagram.", "Year 2");
    const { warnings } = enforcePrimaryVocabBlocklist(ws, {});
    expect(warnings.some((w) => /KS1 worksheet/.test(w))).toBe(true);
  });

  it("a UKS2 sheet using only its own curriculum subject words raises no violation", () => {
    const ws = makePrimaryWs("Find the circumference and the diameter of the circle.", "Year 6");
    const { warnings, worksheet } = enforcePrimaryVocabBlocklist(ws, { yearGroup: "Year 6" });
    expect(warnings).toHaveLength(0);
    expect((worksheet.metadata as any).primaryVocabViolations).toHaveLength(0);
  });
});

// ── Prompt renderer ──────────────────────────────────────────────────────────

describe("renderPrimaryVocabBlocklistPrompt", () => {
  it("returns the empty string for non-primary year groups", () => {
    expect(renderPrimaryVocabBlocklistPrompt("Year 9")).toBe("");
    expect(renderPrimaryVocabBlocklistPrompt("GCSE")).toBe("");
    expect(renderPrimaryVocabBlocklistPrompt(undefined)).toBe("");
  });

  it("names the band and lists blocked words with their replacements", () => {
    const out = renderPrimaryVocabBlocklistPrompt("Year 1");
    expect(out).toMatch(/KS1 blocklist/);
    expect(out).toMatch(/analyse/);
    expect(out).toMatch(/photosynthesis \(use 'how plants make food'\)/);
  });

  it("is band-appropriate: KS1 lists more words than UKS2 (stricter)", () => {
    const ks1 = renderPrimaryVocabBlocklistPrompt("Year 1");
    const uks2 = renderPrimaryVocabBlocklistPrompt("Year 6");
    // KS1-only words appear in the Y1 prompt but not the Y6 prompt.
    expect(ks1).toMatch(/\bdescribe\b/);
    expect(uks2).not.toMatch(/\bdescribe\b/);
    // Y6 (UKS2) prompt does NOT forbid its own curriculum word.
    expect(uks2).not.toMatch(/\bcircumference\b/);
  });
});
