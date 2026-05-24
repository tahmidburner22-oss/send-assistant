/**
 * curriculumBank.test.ts — Phase F · FEAT-PF1
 *
 * Pure-function tests for the curriculum bank. The bank is the substrate
 * for the tier-aware differentiator and the topic-aware scaffolder, so
 * these tests cover:
 *
 *   - lookupBySpecRef returns a merged entry (spec-point + exemplars +
 *     scaffold) and degrades gracefully when the spec-point doesn't exist.
 *   - lookupByTopic returns spec-titled rows that contain the topic
 *     substring and ranks them by match strength.
 *   - filterByTier excludes off-tier rows: Foundation excludes
 *     `tier: "higher"` and Higher excludes `tier: "foundation"`.
 *   - listSpecRefsForTier returns DIFFERENT spec-ref sets for Foundation
 *     vs Higher on a real bundled dataset (acceptance criterion).
 *   - targetAoHistogramForTier returns the documented proportions.
 *   - buildExemplarPromptBlock formats and respects maxTotal /
 *     maxPerSpecRef.
 *   - buildScaffoldPromptBlock formats with sentence frames + word bank.
 *   - enforceTierAoHistogram stamps the report and a p1 warning only
 *     when drift exceeds the ±15pp tolerance.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  _exemplarCount,
  _resetRegistriesForTests,
  _scaffoldCount,
  buildExemplarPromptBlock,
  buildScaffoldPromptBlock,
  filterByTier,
  listSpecRefsForTier,
  lookupBySpecRef,
  lookupByTopic,
  registerExemplars,
  registerScaffolds,
  targetAoHistogramForTier,
  type CurriculumEntry,
  type ExemplarDataset,
  type ScaffoldDataset,
} from "../curriculumBank";
import { enforceTierAoHistogram } from "../worksheetPostValidator";

// ─── Test fixtures ─────────────────────────────────────────────────────────
// Use AQA Combined Science Y10 because that bundle ships in main and has a
// real HT-only row (C5.1.3 transition metals) we can rely on for tier
// filtering tests without depending on the new Phase F data.

const FIX_BOARD = "aqa";
const FIX_SUBJECT = "Combined Science";
const FIX_YEAR = "Year 10";

const FIX_EXEMPLARS: ExemplarDataset = {
  board: "aqa",
  subject: "Combined Science",
  yearGroup: "Year 10",
  source: "test fixture",
  exemplars: [
    {
      specRef: "B4.4.2",
      tier: "foundation",
      ao: "AO1",
      marks: 2,
      stem: "Name two products of aerobic respiration.",
      markScheme: "1 mark each: carbon dioxide; water.",
      commandVerb: "Name",
      source: "test paraphrase",
    },
    {
      specRef: "B4.4.2",
      tier: "higher",
      ao: "AO2",
      marks: 4,
      stem: "Compare the energy yield of aerobic vs anaerobic respiration in muscle.",
      markScheme: "1 mark each for: aerobic uses O2; anaerobic does not; aerobic releases more energy; anaerobic produces lactic acid.",
      commandVerb: "Compare",
      source: "test paraphrase",
    },
    {
      specRef: "C5.1.3",
      tier: "higher",
      ao: "AO1",
      marks: 4,
      stem: "Compare typical properties of transition metals with Group 1 metals.",
      markScheme: "Any 4: higher mp; harder; denser; less reactive; coloured compounds; catalysts.",
      commandVerb: "Compare",
      source: "test paraphrase",
    },
  ],
};

const FIX_SCAFFOLDS: ScaffoldDataset = {
  board: "aqa",
  subject: "Combined Science",
  yearGroup: "Year 10",
  source: "test fixture",
  rows: [
    {
      specRef: "B4.4.2",
      sentenceFrames: ["Aerobic respiration uses ______ to break down ______."],
      wordBank: [
        { term: "respiration", definition: "the process of releasing energy from glucose" },
      ],
      stepLadder: [
        "Write the word equation.",
        "Identify the products.",
      ],
      commonPitfalls: ["Saying anaerobic respiration produces no energy."],
    },
  ],
};

beforeEach(() => {
  _resetRegistriesForTests();
  registerExemplars(FIX_EXEMPLARS);
  registerScaffolds(FIX_SCAFFOLDS);
});

afterEach(() => {
  _resetRegistriesForTests();
});

// ─── lookupBySpecRef ────────────────────────────────────────────────────────

describe("lookupBySpecRef", () => {
  it("returns a merged entry with spec-point + exemplars + scaffold", () => {
    const entry = lookupBySpecRef(FIX_BOARD, FIX_SUBJECT, FIX_YEAR, "B4.4.2");
    expect(entry).not.toBeNull();
    expect(entry!.specPoint.specRef).toBe("B4.4.2");
    expect(entry!.exemplars.length).toBe(2); // foundation + higher
    expect(entry!.scaffold).not.toBeNull();
    expect(entry!.scaffold!.sentenceFrames.length).toBe(1);
  });

  it("returns null when the spec-point doesn't exist in the dataset", () => {
    const entry = lookupBySpecRef(
      FIX_BOARD,
      FIX_SUBJECT,
      FIX_YEAR,
      "NOT_A_REAL_SPEC_REF",
    );
    expect(entry).toBeNull();
  });

  it("returns spec-point alone when bank registries are empty", () => {
    _resetRegistriesForTests();
    const entry = lookupBySpecRef(FIX_BOARD, FIX_SUBJECT, FIX_YEAR, "B4.4.2");
    expect(entry).not.toBeNull();
    expect(entry!.exemplars.length).toBe(0);
    expect(entry!.scaffold).toBeNull();
  });
});

// ─── lookupByTopic ──────────────────────────────────────────────────────────

describe("lookupByTopic", () => {
  it("returns rows whose specTitle contains the topic substring", () => {
    const rows = lookupByTopic(FIX_BOARD, FIX_SUBJECT, FIX_YEAR, "respiration");
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((r) => r.specPoint.specTitle.toLowerCase().includes("respiration")),
    ).toBe(true);
  });

  it("returns empty array for an unrecognised topic", () => {
    const rows = lookupByTopic(
      FIX_BOARD,
      FIX_SUBJECT,
      FIX_YEAR,
      "completely-unrelated-topic-xyz123",
    );
    expect(rows).toEqual([]);
  });

  it("respects the limit option", () => {
    const rows = lookupByTopic(FIX_BOARD, FIX_SUBJECT, FIX_YEAR, "cell", { limit: 2 });
    expect(rows.length).toBeLessThanOrEqual(2);
  });
});

// ─── filterByTier ───────────────────────────────────────────────────────────

describe("filterByTier", () => {
  function entry(tier: "foundation" | "higher" | "both"): CurriculumEntry {
    return {
      specPoint: { specRef: "X1", specTitle: "Test point", tier },
      exemplars: [],
      scaffold: null,
    };
  }

  it("Foundation excludes Higher-only rows", () => {
    const out = filterByTier(
      [entry("foundation"), entry("higher"), entry("both")],
      "foundation",
    );
    expect(out.map((e) => e.specPoint.tier)).toEqual(["foundation", "both"]);
  });

  it("Higher excludes Foundation-only rows", () => {
    const out = filterByTier(
      [entry("foundation"), entry("higher"), entry("both")],
      "higher",
    );
    expect(out.map((e) => e.specPoint.tier)).toEqual(["higher", "both"]);
  });

  it("'both' returns every entry untouched", () => {
    const all = [entry("foundation"), entry("higher"), entry("both")];
    expect(filterByTier(all, "both")).toHaveLength(3);
  });
});

// ─── listSpecRefsForTier (acceptance criterion) ────────────────────────────

describe("listSpecRefsForTier", () => {
  it("Foundation and Higher produce demonstrably different spec-ref sets on AQA Y10 Combined Science", () => {
    const foundation = listSpecRefsForTier(
      FIX_BOARD,
      FIX_SUBJECT,
      FIX_YEAR,
      "foundation",
    );
    const higher = listSpecRefsForTier(
      FIX_BOARD,
      FIX_SUBJECT,
      FIX_YEAR,
      "higher",
    );
    // The Higher set must contain at least one spec-ref the Foundation set
    // does not — that is what makes Higher genuinely different.
    const onlyHigher = higher.filter((r) => !foundation.includes(r));
    expect(onlyHigher.length).toBeGreaterThan(0);
    // C5.1.3 transition metals is HT-only in the bundled dataset.
    expect(onlyHigher).toContain("C5.1.3");
  });
});

// ─── targetAoHistogramForTier ──────────────────────────────────────────────

describe("targetAoHistogramForTier", () => {
  it("Foundation skews AO1 (recall heavy)", () => {
    const t = targetAoHistogramForTier("foundation");
    expect(t.AO1).toBeGreaterThanOrEqual(t.AO2);
    expect(t.AO1 + t.AO2 + t.AO3 + t.AO4).toBeCloseTo(1, 2);
  });

  it("Higher pushes AO2 + AO3", () => {
    const t = targetAoHistogramForTier("higher");
    expect(t.AO2 + t.AO3).toBeGreaterThan(t.AO1);
    expect(t.AO1 + t.AO2 + t.AO3 + t.AO4).toBeCloseTo(1, 2);
  });
});

// ─── buildExemplarPromptBlock ─────────────────────────────────────────────

describe("buildExemplarPromptBlock", () => {
  it("includes the tier label in its header", () => {
    const entries = [lookupBySpecRef(FIX_BOARD, FIX_SUBJECT, FIX_YEAR, "B4.4.2")!];
    const block = buildExemplarPromptBlock(entries, { tier: "higher" });
    expect(block).toMatch(/HIGHER TIER/);
    expect(block).toMatch(/EXEMPLAR/);
  });

  it("returns an empty string when no exemplars are bundled for the entries", () => {
    _resetRegistriesForTests();
    const entries = [lookupBySpecRef(FIX_BOARD, FIX_SUBJECT, FIX_YEAR, "B4.4.2")!];
    const block = buildExemplarPromptBlock(entries, { tier: "higher" });
    expect(block).toBe("");
  });

  it("respects maxTotal", () => {
    const entries = [lookupBySpecRef(FIX_BOARD, FIX_SUBJECT, FIX_YEAR, "B4.4.2")!];
    const block = buildExemplarPromptBlock(entries, {
      tier: "both",
      maxTotal: 1,
    });
    // Each exemplar line begins with "• "; assert at most one such line.
    const lines = block.split("\n").filter((l) => l.startsWith("• "));
    expect(lines.length).toBeLessThanOrEqual(1);
  });
});

// ─── buildScaffoldPromptBlock ─────────────────────────────────────────────

describe("buildScaffoldPromptBlock", () => {
  it("emits sentence frames, word bank and step ladder for the row", () => {
    const entries = [lookupBySpecRef(FIX_BOARD, FIX_SUBJECT, FIX_YEAR, "B4.4.2")!];
    const block = buildScaffoldPromptBlock(entries, "Dyslexia");
    expect(block).toMatch(/Sentence frames:/);
    expect(block).toMatch(/Word bank:/);
    expect(block).toMatch(/Step ladder/);
    expect(block).toMatch(/Aerobic respiration uses/);
  });

  it("returns empty string when none of the entries carry a scaffold row", () => {
    _resetRegistriesForTests(); // wipe the scaffold registry
    const entries = [lookupBySpecRef(FIX_BOARD, FIX_SUBJECT, FIX_YEAR, "B4.4.2")!];
    expect(buildScaffoldPromptBlock(entries)).toBe("");
  });
});

// ─── _exemplarCount / _scaffoldCount ──────────────────────────────────────

describe("registry counters", () => {
  it("exemplarCount and scaffoldCount reflect the registered fixtures", () => {
    expect(_exemplarCount(FIX_BOARD, FIX_SUBJECT, FIX_YEAR)).toBe(3);
    expect(_scaffoldCount(FIX_BOARD, FIX_SUBJECT, FIX_YEAR)).toBe(1);
  });
});

// ─── enforceTierAoHistogram (post-validator) ──────────────────────────────

describe("enforceTierAoHistogram", () => {
  it("no-ops when tier or aoHistogram is missing", () => {
    const ws = { sections: [], metadata: { aoHistogram: { AO1: 5, AO2: 2, AO3: 1, AO4: 0 } } };
    const r = enforceTierAoHistogram(ws);
    expect(r.warnings).toHaveLength(0);
  });

  it("stamps the report and zero warnings when AO distribution matches the Foundation target", () => {
    const ws = {
      sections: [],
      metadata: {
        tier: "foundation" as const,
        aoHistogram: { AO1: 6, AO2: 3, AO3: 1, AO4: 0 },
      },
    };
    const r = enforceTierAoHistogram(ws);
    const meta = r.worksheet.metadata as Record<string, unknown>;
    expect(meta.tierAoHistogramReport).toBeDefined();
    expect(r.warnings).toHaveLength(0);
  });

  it("raises a p1 warning when Higher tier is AO1-heavy (off-target by > 15pp)", () => {
    const ws = {
      sections: [],
      metadata: {
        tier: "higher" as const,
        // 80% AO1, well over the 40% Higher target.
        aoHistogram: { AO1: 8, AO2: 1, AO3: 1, AO4: 0 },
      },
    };
    const r = enforceTierAoHistogram(ws);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0]).toMatch(/Tier AO histogram/);
    expect(r.warnings[0]).toMatch(/p1/);
  });
});
