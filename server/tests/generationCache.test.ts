/**
 * generationCache.test.ts — PR-10 tests
 *
 * Tests for the Knowledge Organiser, Anchor Poster, and Now/Next/Then
 * builder modules.
 */
import { describe, it, expect } from "vitest";

// ── PR-10 tests ──────────────────────────────────────────────────────────────
import { deriveKnowledgeOrganiserFromWorksheet } from "../../client/src/lib/knowledgeOrganiserBuilder";
import { buildAnchorPoster } from "../../client/src/lib/anchorPosterBuilder";
import { buildNowNextThenForWorksheet } from "../../client/src/lib/nowNextThenBuilder";

describe("PR-10 / Knowledge Organiser + Anchor Poster + Now/Next/Then", () => {
  const sampleWorksheet = {
    title: "Adding Fractions - Year 7 Maths",
    sections: [
      { type: "learning-objective", title: "Learning Objectives", content: "Students will be able to:\n1. Add fractions with the same denominator\n2. Add fractions with different denominators\n3. Simplify their answers" },
      { type: "word-bank", title: "Key Vocabulary", content: "numerator - the top number in a fraction\ndenominator - the bottom number in a fraction\ncommon denominator - a shared bottom number\nequivalent - having the same value\nsimplify - reduce to lowest terms" },
      { type: "q-short-answer", title: "Q1", content: "Calculate 1/4 + 2/4" },
      { type: "q-short-answer", title: "Q2", content: "Calculate 1/3 + 1/6" },
      { type: "diagram", title: "Fraction Wall", content: "Visual representation" },
      { type: "self-reflection", title: "Self-Reflection", content: "Can I add fractions with the same denominator?\nCan I find a common denominator?\nDo I know how to simplify my answer?" },
      { type: "revision-tips", title: "Revision Tips", content: "Practice converting to equivalent fractions daily." },
      { type: "mark-scheme", title: "Teacher Key", content: "Q1: 3/4 [1 mark]" },
    ],
    metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 7" },
  };

  it("deriveKnowledgeOrganiserFromWorksheet extracts vocab from word-bank section", () => {
    const ko = deriveKnowledgeOrganiserFromWorksheet(sampleWorksheet);
    expect(ko.vocabulary.length).toBeGreaterThanOrEqual(3);
    expect(ko.vocabulary[0].term).toBeTruthy();
    expect(ko.vocabulary[0].definition).toBeTruthy();
  });

  it("deriveKnowledgeOrganiserFromWorksheet extracts sticky questions from self-reflection", () => {
    const ko = deriveKnowledgeOrganiserFromWorksheet(sampleWorksheet);
    expect(ko.stickyQuestions.length).toBeGreaterThan(0);
    expect(ko.stickyQuestions.some(q => q.includes("?"))).toBe(true);
  });

  it("deriveKnowledgeOrganiserFromWorksheet returns empty arrays for minimal worksheet", () => {
    const ko = deriveKnowledgeOrganiserFromWorksheet({ title: "Minimal", sections: [] });
    expect(ko.vocabulary).toEqual([]);
    expect(ko.keyFacts).toEqual([]);
    expect(ko.stickyQuestions).toEqual([]);
  });

  it("buildAnchorPoster returns vocabRing from word-bank", () => {
    const poster = buildAnchorPoster(sampleWorksheet);
    expect(poster.vocabRing.length).toBeGreaterThan(0);
    expect(poster.vocabRing.length).toBeLessThanOrEqual(8);
  });

  it("buildAnchorPoster returns conceptMap from learning-objective", () => {
    const poster = buildAnchorPoster(sampleWorksheet);
    expect(poster.conceptMap.length).toBeGreaterThan(0);
    expect(poster.conceptMap.length).toBeLessThanOrEqual(6);
  });

  it("buildNowNextThenForWorksheet returns valid flow with minutes summing to ~50", () => {
    const flow = buildNowNextThenForWorksheet(sampleWorksheet);
    expect(flow.now.label).toBeTruthy();
    expect(flow.next.label).toBeTruthy();
    expect(flow.then.label).toBeTruthy();
    const total = flow.now.minutes + flow.next.minutes + flow.then.minutes;
    expect(total).toBeGreaterThanOrEqual(45);
    expect(total).toBeLessThanOrEqual(55);
  });
});
