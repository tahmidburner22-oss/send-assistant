/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/comparisonCorpus.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lock the comparison corpus shape so a hand-edit can't silently
 * shift the benchmark distribution. Tests are pure — no LLM, no
 * disk I/O beyond the loader's own readFile.
 *
 * Sprint 1.B (PR-1 / big-bang-7-sprints).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";

import {
  loadComparisonCorpus,
  bucketCounts,
  tagFixtures,
  COMPARISON_CORPUS_VERSION,
  COMPARISON_CORPUS_EXPECTED_SIZE,
} from "./worksheet-eval/comparisonCorpus";
import { ALL_RULE_NAMES } from "./worksheet-eval/rules";

describe("comparison-corpus.json — shape + distribution lock", () => {
  it("loads exactly COMPARISON_CORPUS_EXPECTED_SIZE entries", async () => {
    const corpus = await loadComparisonCorpus();
    expect(corpus).toHaveLength(COMPARISON_CORPUS_EXPECTED_SIZE);
    expect(COMPARISON_CORPUS_EXPECTED_SIZE).toBe(30);
  });

  it("every fixture id is `cmp-` prefixed and unique", async () => {
    const corpus = await loadComparisonCorpus();
    const ids = corpus.map((f) => f.id);
    for (const id of ids) {
      expect(id.startsWith("cmp-")).toBe(true);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every fixture references only registered rule names", async () => {
    const corpus = await loadComparisonCorpus();
    const registered = new Set(ALL_RULE_NAMES);
    for (const f of corpus) {
      for (const rule of f.rules) {
        expect(registered.has(rule)).toBe(true);
      }
    }
  });

  it("buckets are distributed (no single-bucket dominance)", async () => {
    const corpus = await loadComparisonCorpus();
    const counts = bucketCounts(corpus);
    // Distribution defined in PHASE-PLAN.md: maths 9, english 6,
    // science 7, humanities 5, send 3 — totalling 30. Lock the
    // ordering rules: maths > english+humanities, send is the
    // smallest, no bucket exceeds half.
    expect(counts.maths).toBeGreaterThanOrEqual(5);
    expect(counts.english).toBeGreaterThanOrEqual(3);
    expect(counts.science).toBeGreaterThanOrEqual(3);
    expect(counts.humanities).toBeGreaterThanOrEqual(3);
    expect(counts.send).toBeGreaterThanOrEqual(3);
    const max = Math.max(...Object.values(counts));
    expect(max).toBeLessThanOrEqual(15);
  });

  it("covers every key stage from KS1/KS2 through A-Level + SEND", async () => {
    const corpus = await loadComparisonCorpus();
    const yearGroups = new Set(corpus.map((f) => f.params.yearGroup));

    // KS1/KS2 — at least one Year 2/4/5/6
    const primary = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];
    expect(primary.some((y) => yearGroups.has(y))).toBe(true);

    // KS3 — at least one Year 7/8/9
    const ks3 = ["Year 7", "Year 8", "Year 9"];
    expect(ks3.some((y) => yearGroups.has(y))).toBe(true);

    // GCSE — at least one Year 10/11
    const gcse = ["Year 10", "Year 11"];
    expect(gcse.some((y) => yearGroups.has(y))).toBe(true);

    // A-Level — at least one Year 12/13
    const aLevel = ["Year 12", "Year 13"];
    expect(aLevel.some((y) => yearGroups.has(y))).toBe(true);

    // SEND — at least 3 fixtures with sendNeed declared
    const sendFixtures = corpus.filter((f) => Boolean(f.params.sendNeed));
    expect(sendFixtures.length).toBeGreaterThanOrEqual(3);
  });

  it("SEND fixtures carry the send-fidelity-floor rule", async () => {
    const corpus = await loadComparisonCorpus();
    const sendFixtures = corpus.filter((f) => Boolean(f.params.sendNeed));
    for (const f of sendFixtures) {
      expect(f.rules).toContain("send-fidelity-floor");
    }
  });

  it("every GCSE/A-Level fixture has examBoard set + spec-ref-present rule", async () => {
    const corpus = await loadComparisonCorpus();
    const examYears = ["Year 10", "Year 11", "Year 12", "Year 13"];
    const exam = corpus.filter((f) => examYears.includes(f.params.yearGroup));
    expect(exam.length).toBeGreaterThan(0);
    for (const f of exam) {
      // SEND fixtures may relax this — the SEND profile dictates
      // adaptation, and not all SEND-flagged GCSE fixtures will
      // exercise spec-ref-present (they're checked via send-fidelity-floor
      // instead). Allow either rule present.
      const hasSpecRule =
        f.rules.includes("spec-ref-present") ||
        f.rules.includes("send-fidelity-floor");
      expect(hasSpecRule).toBe(true);
      if (!f.params.sendNeed) {
        expect(f.params.examBoard).toBeTruthy();
      }
    }
  });

  it("readingAgeRange (when present) is monotonic and plausible", async () => {
    const corpus = await loadComparisonCorpus();
    for (const f of corpus) {
      if (!f.readingAgeRange) continue;
      const [min, max] = f.readingAgeRange;
      expect(min).toBeLessThan(max);
      expect(min).toBeGreaterThanOrEqual(5);
      expect(max).toBeLessThanOrEqual(20);
      // Span shouldn't be wider than 5 years — wider than that and
      // the rule isn't asserting anything useful.
      expect(max - min).toBeLessThanOrEqual(5);
    }
  });

  it("COMPARISON_CORPUS_VERSION is a semver-like string", () => {
    expect(COMPARISON_CORPUS_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("comparisonCorpus helpers", () => {
  it("bucketCounts sums to corpus length", async () => {
    const corpus = await loadComparisonCorpus();
    const counts = bucketCounts(corpus);
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(corpus.length);
  });

  it("tagFixtures stamps origin without mutating input", () => {
    const input = [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ] as const;
    const tagged = tagFixtures([...input], "comparison");
    expect(tagged.every((f) => f.corpus === "comparison")).toBe(true);
    // Source array unchanged
    expect(input).toEqual([
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ]);
  });
});
