/**
 * Tests for `getPrimaryReadingProfile` and
 * `renderPrimaryReadingProfilePrompt` (Lane 3.1).
 *
 * The W1 spec
 * (docs/primary-worksheet-improvement-plan.md) defines six per-year
 * profiles for primary worksheets. These tests lock in the bucket
 * boundaries so a future edit can't quietly broaden Y1's word cap or
 * silently allow Tier 3 vocabulary in KS1.
 */

import { describe, expect, it } from "vitest";
import {
  getPrimaryReadingProfile,
  renderPrimaryReadingProfilePrompt,
} from "../primaryReadingProfile";

describe("getPrimaryReadingProfile", () => {
  it("returns a profile for every primary year (Y1..Y6)", () => {
    for (const y of [1, 2, 3, 4, 5, 6]) {
      const p = getPrimaryReadingProfile(y);
      expect(p, `profile for Y${y}`).toBeDefined();
      expect(p!.yearNum).toBe(y);
    }
  });

  it("returns undefined for non-primary years", () => {
    for (const y of [0, 7, 8, 9, 10, 11, 12, 13]) {
      expect(getPrimaryReadingProfile(y)).toBeUndefined();
    }
  });

  it("returns undefined for non-integer / NaN inputs", () => {
    expect(getPrimaryReadingProfile(2.5)).toBeUndefined();
    expect(getPrimaryReadingProfile(Number.NaN)).toBeUndefined();
    expect(getPrimaryReadingProfile(-1)).toBeUndefined();
  });

  it("Y1 hard-caps instructions at 6 words and is Tier 1 only", () => {
    const p = getPrimaryReadingProfile(1)!;
    expect(p.maxWordsPerInstruction).toBe(6);
    expect(p.maxVocabTier).toBe("tier1");
    expect(p.tier3CurriculumWordAllowed).toBe(false);
    expect(p.allowTwoClauseSentences).toBe(false);
    expect(p.phonicsPhase).toBe("phase-5");
    expect(p.readingAgeWindow).toEqual([5, 6]);
  });

  it("Y2 hard-caps at 8 words, still Tier 1, still single-clause", () => {
    const p = getPrimaryReadingProfile(2)!;
    expect(p.maxWordsPerInstruction).toBe(8);
    expect(p.maxVocabTier).toBe("tier1");
    expect(p.allowTwoClauseSentences).toBe(false);
    expect(p.phonicsPhase).toBe("phase-5-6");
  });

  it("Y3 hard-caps at 10 words, allows Tier 2 with definitions", () => {
    const p = getPrimaryReadingProfile(3)!;
    expect(p.maxWordsPerInstruction).toBe(10);
    expect(p.maxVocabTier).toBe("tier2");
    expect(p.allowTwoClauseSentences).toBe(false);
  });

  it("Y4 hard-caps at 12 words, two-clause allowed, Tier 2 OK", () => {
    const p = getPrimaryReadingProfile(4)!;
    expect(p.maxWordsPerInstruction).toBe(12);
    expect(p.allowTwoClauseSentences).toBe(true);
    expect(p.maxVocabTier).toBe("tier2");
  });

  it("Y5 hard-caps at 14 words, two-clause allowed, Tier 2 OK", () => {
    const p = getPrimaryReadingProfile(5)!;
    expect(p.maxWordsPerInstruction).toBe(14);
    expect(p.allowTwoClauseSentences).toBe(true);
    expect(p.maxVocabTier).toBe("tier2");
  });

  it("Y6 hard-caps at 16 words and is the ONLY year permitting one Tier 3 curriculum word per question", () => {
    const p = getPrimaryReadingProfile(6)!;
    expect(p.maxWordsPerInstruction).toBe(16);
    expect(p.maxVocabTier).toBe("tier3");
    expect(p.tier3CurriculumWordAllowed).toBe(true);
  });

  it("word caps are strictly monotonically increasing across primary years (no regression)", () => {
    const caps = [1, 2, 3, 4, 5, 6].map(
      (y) => getPrimaryReadingProfile(y)!.maxWordsPerInstruction,
    );
    for (let i = 1; i < caps.length; i++) {
      expect(caps[i]).toBeGreaterThan(caps[i - 1]);
    }
  });

  it("only Y6 permits Tier 3 curriculum words; Y1..Y5 forbid them", () => {
    for (const y of [1, 2, 3, 4, 5]) {
      expect(getPrimaryReadingProfile(y)!.tier3CurriculumWordAllowed).toBe(false);
    }
    expect(getPrimaryReadingProfile(6)!.tier3CurriculumWordAllowed).toBe(true);
  });
});

describe("renderPrimaryReadingProfilePrompt", () => {
  it("returns the empty string for non-primary years", () => {
    expect(renderPrimaryReadingProfilePrompt(0)).toBe("");
    expect(renderPrimaryReadingProfilePrompt(7)).toBe("");
    expect(renderPrimaryReadingProfilePrompt(11)).toBe("");
  });

  it("Y1 prompt names Phase 5 phonics, the 6-word cap, the icon-cue rule, and forbids two-clause sentences", () => {
    const out = renderPrimaryReadingProfilePrompt(1);
    expect(out).toMatch(/Year 1/);
    expect(out).toMatch(/Phase 5 phonics/);
    expect(out).toMatch(/Maximum 6 words/);
    expect(out).toMatch(/icon cue/i);
    expect(out).toMatch(/ONE clause per sentence/);
    // No Tier 3 escape hatch in Y1 prompt.
    expect(out).not.toMatch(/Tier 3.*allowed/);
  });

  it("Y2 prompt names Phase 5/6 phonics and the 8-word cap and forbids subordinate clauses", () => {
    const out = renderPrimaryReadingProfilePrompt(2);
    expect(out).toMatch(/Year 2/);
    expect(out).toMatch(/Phase 5\/6 phonics/);
    expect(out).toMatch(/Maximum 8 words/);
    expect(out).toMatch(/ONE clause per sentence/);
    expect(out).not.toMatch(/icon cue/i);
  });

  it("Y3 prompt names the 10-word cap and the inline-definition rule", () => {
    const out = renderPrimaryReadingProfilePrompt(3);
    expect(out).toMatch(/Year 3/);
    expect(out).toMatch(/Maximum 10 words/);
    expect(out).toMatch(/one-line definition/);
  });

  it("Y4 prompt allows two-clause sentences and names the 12-word cap", () => {
    const out = renderPrimaryReadingProfilePrompt(4);
    expect(out).toMatch(/Year 4/);
    expect(out).toMatch(/Maximum 12 words/);
    expect(out).toMatch(/Two-clause sentences are allowed/);
  });

  it("Y5 prompt names the 14-word cap and Tier 2 with-definitions rule", () => {
    const out = renderPrimaryReadingProfilePrompt(5);
    expect(out).toMatch(/Year 5/);
    expect(out).toMatch(/Maximum 14 words/);
    expect(out).toMatch(/Tier 2.*defined inline/);
  });

  it("Y6 prompt names the 16-word cap and the one-Tier-3-word-per-question escape hatch", () => {
    const out = renderPrimaryReadingProfilePrompt(6);
    expect(out).toMatch(/Year 6/);
    expect(out).toMatch(/Maximum 16 words/);
    expect(out).toMatch(/ONE Tier 3.*word per question/);
    expect(out).toMatch(/curriculum word being taught/);
  });

  it("renders a stable, byte-equal prompt block when called twice (deterministic)", () => {
    for (const y of [1, 2, 3, 4, 5, 6]) {
      expect(renderPrimaryReadingProfilePrompt(y)).toBe(
        renderPrimaryReadingProfilePrompt(y),
      );
    }
  });
});
