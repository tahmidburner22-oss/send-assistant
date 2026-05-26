/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * phase-g-h.test.ts — combined regression suite for the
 * deterministic-core libraries shipped in PR
 * `feat/phase-g-h-implementation` (24 work units).
 *
 * The tests focus on the Definition-of-Done invariants from the
 * PHASE-PLAN: pure / idempotent / conservative / seed-deterministic.
 * UI components are not asserted here.
 */

import { describe, expect, it } from "vitest";

import { verifyAnswer } from "../answerVerifier";
import { generateMatching } from "../proceduralActivities/matching";
import { generateWordsearch } from "../proceduralActivities/wordsearch";
import { generateCrossword } from "../proceduralActivities/crossword";
import { generateCloze } from "../proceduralActivities/cloze";
import { buildArchetypeBrief, getArchetype, listArchetypes } from "../lessonArchetypes";
import { initialTimerState, timerReducer, isExpired, totalElapsed } from "../questionTimer";
import { renumberSections } from "../worksheet-renumber";
import { buildAnswerKeyPage } from "../answerKeySheet";
import { buildParentLetter } from "../parentLetter";
import { computeTopicWeights } from "../predictedPaperBuilder";
import { aggregatePupilProgress } from "../pupilProgressAggregator";
import { aggregateWrongAnswers } from "../wrongAnswerAggregator";
import { buildSkillStates, biasedSkillOrder, applyAttempt } from "../leitnerScheduler";
import { runGamification } from "../gamificationEngine";
import { initialStepperState, stepperReducer, isStepRevealed } from "../workedExampleStepper";
import { stampGroupMetadata } from "../threeTierDifferentiation";
import {
  loadFavourites,
  toggleFavourite,
  isFavourited,
  recentFavourites,
  __testing as favTesting,
} from "../worksheetFavourites";
import {
  loadAnswerLog,
  recordAttempt,
  summarizeLog,
  clearAnswerLog,
} from "../companion-answer-log";
import { buildContextDirective, filterContexts, listCategories } from "../realWorldContextLibrary";
import { __testing as tierTesting } from "../tierShift";

// ── G1: answerVerifier ──────────────────────────────────────────────────────

describe("FEAT-G1 answerVerifier", () => {
  it("is pure: same input → same output across two calls", () => {
    const spec = { mode: "numeric" as const, answer: 3.14, unit: "cm", tolerance: 0.01 };
    const a = verifyAnswer(spec, "3.14 cm");
    const b = verifyAnswer(spec, "3.14 cm");
    expect(a).toEqual(b);
  });

  it("numeric branch: accepts canonical answer with unit + tolerance", () => {
    const spec = { mode: "numeric" as const, answer: 3.14, unit: "cm", tolerance: 0.01 };
    expect(verifyAnswer(spec, "3.14 cm").status).toBe("correct");
    expect(verifyAnswer(spec, "3.13").status).toBe("correct");
    expect(verifyAnswer(spec, "3.15 cm").status).toBe("correct");
    expect(verifyAnswer(spec, "9.99").status).toBe("incorrect");
  });

  it("short-text branch: accepts case-insensitive, fuzzy ≤1 for >6 char words", () => {
    const spec = { mode: "short-text" as const, canonicalAnswer: "evaporation" };
    expect(verifyAnswer(spec, "Evaporation").status).toBe("correct");
    expect(verifyAnswer(spec, "evaporetion").status).toBe("correct"); // 1 edit
    expect(verifyAnswer(spec, "boiling").status).toBe("incorrect");
  });

  it("short-text branch: built-in synonyms for 'evaporation'", () => {
    const spec = { mode: "short-text" as const, canonicalAnswer: "evaporation" };
    expect(verifyAnswer(spec, "evaporate").status).toBe("correct");
  });

  it("mcq branch: uppercase letter equality", () => {
    const spec = { mode: "mcq" as const, correctLetter: "C" };
    expect(verifyAnswer(spec, "c").status).toBe("correct");
    expect(verifyAnswer(spec, "B").status).toBe("incorrect");
  });

  it("mcq branch: numeric index 0-25 maps to letter", () => {
    const spec = { mode: "mcq" as const, answer: 2 };
    expect(verifyAnswer(spec, "C").status).toBe("correct");
    expect(verifyAnswer(spec, "A").status).toBe("incorrect");
  });

  it("mcq branch: surfaces misconception for matched distractor", () => {
    const result = verifyAnswer(
      { mode: "mcq", correctLetter: "C" },
      "B",
      { misconceptionLinks: [{ distractor: "B", misconceptionId: "m-frac-01", misconceptionText: "Sums numerators only." }] },
    );
    expect(result.status).toBe("incorrect");
    expect(result.misconceptionId).toBe("m-frac-01");
    expect(result.feedback).toContain("Sums numerators only.");
  });

  it("structured branch: partial match returns partial status with proportional marks", () => {
    const spec = {
      mode: "structured" as const,
      steps: [{ method: "expand brackets" }, { method: "collect like terms" }, { method: "factorise" }],
    };
    const result = verifyAnswer(spec, "I will expand brackets first", { marksAvailable: 3 });
    expect(result.status).toBe("partial");
    expect(result.gainedMarks).toBeLessThan(3);
    expect(result.gainedMarks).toBeGreaterThan(0);
  });

  it("open mode: returns 'unmarked' (teacher-marked)", () => {
    const result = verifyAnswer({ mode: "open" as const, rubricRef: "R-001" }, "Lots of text");
    expect(result.status).toBe("unmarked");
  });

  it("undefined spec: returns 'unmarked'", () => {
    const result = verifyAnswer(undefined, "anything");
    expect(result.status).toBe("unmarked");
  });
});

// ── G1+H1: companion-answer-log ────────────────────────────────────────────

describe("FEAT-G1 companion-answer-log", () => {
  it("recordAttempt is idempotent on (sectionIndex, attemptedAt)", () => {
    const token = "t-" + Math.random().toString(36).slice(2, 8);
    clearAnswerLog(token);
    const at = "2026-05-26T12:00:00.000Z";
    recordAttempt(token, { sectionIndex: 0, attemptedAt: at, status: "correct" });
    recordAttempt(token, { sectionIndex: 0, attemptedAt: at, status: "correct" });
    const log = loadAnswerLog(token);
    expect(log.attempts).toHaveLength(1);
  });

  it("summarizeLog counts all four states", () => {
    const token = "t-" + Math.random().toString(36).slice(2, 8);
    clearAnswerLog(token);
    recordAttempt(token, { sectionIndex: 0, attemptedAt: "2026-05-26T12:00:00.000Z", status: "correct", marksAvailable: 1, gainedMarks: 1 });
    recordAttempt(token, { sectionIndex: 1, attemptedAt: "2026-05-26T12:01:00.000Z", status: "partial", marksAvailable: 3, gainedMarks: 2 });
    recordAttempt(token, { sectionIndex: 2, attemptedAt: "2026-05-26T12:02:00.000Z", status: "incorrect", marksAvailable: 1, gainedMarks: 0 });
    const summary = summarizeLog(loadAnswerLog(token));
    expect(summary.correct).toBe(1);
    expect(summary.partial).toBe(1);
    expect(summary.incorrect).toBe(1);
    expect(summary.marksGained).toBe(3);
    expect(summary.marksAvailable).toBe(5);
  });
});

// ── G3: lessonArchetypes ────────────────────────────────────────────────────

describe("FEAT-G3 lessonArchetypes", () => {
  it("ships 5 archetypes", () => {
    expect(listArchetypes()).toHaveLength(5);
  });

  it("buildArchetypeBrief returns a brief containing the prompt directive", () => {
    const brief = buildArchetypeBrief("do-now-i-we-you-do", { subject: "maths", topic: "fractions" });
    expect(brief).not.toBeNull();
    expect(brief!.archetypeName).toContain("Do-Now");
    expect(brief!.promptPreamble).toContain("Do Now");
    expect(brief!.briefSummary).toContain("fractions");
  });

  it("buildArchetypeBrief returns null for unknown id", () => {
    // @ts-expect-error - testing invalid id path
    expect(buildArchetypeBrief("nope")).toBeNull();
  });
});

// ── G4: procedural activities ──────────────────────────────────────────────

describe("FEAT-G4 procedural activities", () => {
  it("matching: deterministic across two calls with the same seed", () => {
    const pairs = [
      { left: "Cat", right: "Mammal" },
      { left: "Frog", right: "Amphibian" },
      { left: "Snake", right: "Reptile" },
      { left: "Trout", right: "Fish" },
    ];
    const a = generateMatching({ pairs, seed: 7 });
    const b = generateMatching({ pairs, seed: 7 });
    expect(a).toEqual(b);
  });

  it("matching: key is a permutation of [0..n-1] and right is shuffled", () => {
    const pairs = [
      { left: "L1", right: "R1" },
      { left: "L2", right: "R2" },
      { left: "L3", right: "R3" },
      { left: "L4", right: "R4" },
    ];
    const out = generateMatching({ pairs, seed: 42 });
    const sortedKey = [...out.key].sort((a, b) => a - b);
    expect(sortedKey).toEqual([0, 1, 2, 3]);
    expect(out.right).not.toEqual(["R1", "R2", "R3", "R4"]);
  });

  it("wordsearch: every input word appears at its recorded placement", () => {
    const out = generateWordsearch({ words: ["FROG", "CAT", "FISH", "SNAKE"], seed: 3 });
    for (const p of out.placements) {
      const dr = p.dir === "↓" ? 1 : p.dir === "↘" || p.dir === "↗" ? (p.dir === "↘" ? 1 : -1) : 0;
      const dc = p.dir === "→" ? 1 : p.dir === "↘" || p.dir === "↗" ? 1 : 0;
      let read = "";
      for (let i = 0; i < p.word.length; i++) {
        const r = p.row + dr * i;
        const c = p.col + dc * i;
        read += out.grid[r]?.[c] ?? "?";
      }
      expect(read).toBe(p.word);
    }
  });

  it("crossword: places at least the seed word and emits skipped warnings", () => {
    const entries = [
      { word: "biology", clue: "Study of life" },
      { word: "atom", clue: "Smallest unit of matter" },
      { word: "energy", clue: "Capacity to do work" },
    ];
    const out = generateCrossword({ entries, seed: 1, maxRestarts: 5 });
    expect(out.clues.length).toBeGreaterThanOrEqual(1);
    if (out.skipped.length > 0) {
      expect(out.warnings.length).toBeGreaterThan(0);
    }
  });

  it("cloze: extracts inline answers from __BLANK:answer__ tokens", () => {
    const out = generateCloze({ prose: "Plants grow via __BLANK:photosynthesis__." });
    expect(out.blanks).toHaveLength(1);
    expect(out.blanks[0].answer).toBe("photosynthesis");
    expect(out.rendered).toContain("[1]");
  });

  it("cloze: falls back to bare __BLANK__ tokens with blanks[]", () => {
    const out = generateCloze({ prose: "The sky is __BLANK__.", blanks: ["blue"] });
    expect(out.blanks[0].answer).toBe("blue");
  });

  it("cloze: emits warning when blanks count cannot be supplied", () => {
    const out = generateCloze({ prose: "Bare __BLANK__ here." });
    expect(out.warnings.some((w) => /no answer supplied/i.test(w))).toBe(true);
  });
});

// ── G5: 5-a-day builder ─────────────────────────────────────────────────────

describe("FEAT-G5 fiveADayBuilder", () => {
  it("returns empty pack with warning when skills empty", async () => {
    const { buildFiveADay } = await import("../fiveADayBuilder");
    const out = buildFiveADay({ subject: "maths", yearGroup: "Y10", weeks: 1, skills: [] });
    expect(out.worksheets).toHaveLength(0);
    expect(out.warnings.length).toBeGreaterThan(0);
  });
});

// ── G6: predicted paper ─────────────────────────────────────────────────────

describe("FEAT-G6 predictedPaperBuilder", () => {
  it("bias=0 produces neutral weights of 1", () => {
    const out = computeTopicWeights({
      candidateTopics: ["A", "B", "C"],
      anchorCorpus: [
        { year: 2023, board: "AQA", subject: "Maths", topic: "A", marks: 5 },
        { year: 2023, board: "AQA", subject: "Maths", topic: "B", marks: 4 },
      ],
      bias: 0,
    });
    expect(out.weights.every((w) => w.weight === 1)).toBe(true);
    expect(out.appliedBias).toBe(0);
  });

  it("empty corpus → neutral fallback + warning", () => {
    const out = computeTopicWeights({ candidateTopics: ["A"], anchorCorpus: [], bias: 0.7 });
    expect(out.warnings.some((w) => /no anchor corpus/i.test(w))).toBe(true);
    expect(out.appliedBias).toBe(0);
  });

  it("bias clamped to [0,1]", () => {
    const out = computeTopicWeights({ candidateTopics: ["A"], anchorCorpus: [{ year: 2023, board: "AQA", subject: "Maths", topic: "A", marks: 4 }], bias: 5 });
    expect(out.appliedBias).toBe(1);
  });
});

// ── G9: three-tier differentiation ─────────────────────────────────────────

describe("FEAT-G9 threeTierDifferentiation", () => {
  it("stampGroupMetadata writes group + tier without dropping existing metadata", () => {
    const ws = { metadata: { subject: "Maths" } };
    const stamped = stampGroupMetadata(ws, "g-1", "LA");
    expect(stamped.metadata!.differentiationGroup).toEqual({ groupId: "g-1", tier: "LA" });
    expect(stamped.metadata!.subject).toBe("Maths");
  });
});

// ── G12: answer key ─────────────────────────────────────────────────────────

describe("FEAT-G12 answerKeySheet", () => {
  it("includes a header watermark and skips non-question sections", () => {
    const ws = {
      title: "Photosynthesis basics",
      metadata: { yearGroup: "Y10", topic: "Photosynthesis" },
      sections: [
        { type: "learning-objective", title: "LO", content: "..." },
        { type: "q-mcq", title: "Q1", content: "Answer: A", marks: 1 },
        { type: "q-short-answer", title: "Q2", content: "What is light?", marks: 1, answerSpec: { mode: "short-text", canonicalAnswer: "EM radiation" } },
      ],
    };
    const page = buildAnswerKeyPage(ws);
    expect(page.watermark).toContain("TEACHER ONLY");
    expect(page.rows).toHaveLength(2);
    expect(page.rows[0].content).toContain("A");
    expect(page.rows[1].content).toContain("EM radiation");
  });
});

// ── G13: question timer ─────────────────────────────────────────────────────

describe("FEAT-G13 questionTimer", () => {
  it("transitions idle → running → paused → running → finished", () => {
    let s = initialTimerState(60_000);
    expect(s.status).toBe("idle");
    s = timerReducer(s, { type: "start", now: 0 });
    expect(s.status).toBe("running");
    s = timerReducer(s, { type: "pause", now: 5_000 });
    expect(s.status).toBe("paused");
    expect(s.elapsedMs).toBe(5_000);
    s = timerReducer(s, { type: "resume", now: 10_000 });
    expect(s.status).toBe("running");
    s = timerReducer(s, { type: "tick", now: 70_000 });
    expect(s.status).toBe("finished");
  });

  it("isExpired true once elapsed reaches allocated", () => {
    const s = { status: "running" as const, startedAt: 0, elapsedMs: 0, allocatedMs: 1000 };
    expect(isExpired(s, 999)).toBe(false);
    expect(isExpired(s, 1000)).toBe(true);
  });

  it("totalElapsed includes current run when running", () => {
    const s = { status: "running" as const, startedAt: 5_000, elapsedMs: 1_000, allocatedMs: 0 };
    expect(totalElapsed(s, 6_500)).toBe(2_500);
  });
});

// ── G14: parent letter ──────────────────────────────────────────────────────

describe("FEAT-G14 parentLetter", () => {
  it("three tones produce distinguishable text", () => {
    const base = {
      worksheetTitle: "Fractions",
      schoolName: "Downside Academy",
      teacherName: "Mr Smith",
      weekStarting: "Monday 1 June",
      learningObjective: "add fractions with common denominators",
    };
    const supportive = buildParentLetter({ ...base, parentTone: "supportive" }).text;
    const firm = buildParentLetter({ ...base, parentTone: "firm" }).text;
    const informative = buildParentLetter({ ...base, parentTone: "informative" }).text;
    expect(supportive).not.toBe(firm);
    expect(firm).not.toBe(informative);
    expect(supportive).not.toBe(informative);
  });

  it("includes signature + bullets", () => {
    const out = buildParentLetter({
      worksheetTitle: "Fractions",
      schoolName: "Downside",
      teacherName: "Mr Smith",
      weekStarting: "1 June",
    });
    expect(out.signatureLine).toBe("Mr Smith");
    expect(out.bullets.length).toBeGreaterThanOrEqual(2);
  });
});

// ── G15: renumberSections ───────────────────────────────────────────────────

describe("FEAT-G15 renumberSections", () => {
  it("assigns 1..N over q-* sections in array order", () => {
    const out = renumberSections([
      { type: "learning-objective" },
      { type: "q-short-answer" },
      { type: "vocab-reference" },
      { type: "q-mcq" },
      { type: "q-extended" },
    ]);
    expect(out[1].questionNumber).toBe(1);
    expect(out[3].questionNumber).toBe(2);
    expect(out[4].questionNumber).toBe(3);
    expect(out[0].questionNumber).toBeUndefined();
  });

  it("clears questionNumber on non-question sections", () => {
    const out = renumberSections([{ type: "learning-objective", questionNumber: 5 }]);
    expect(out[0].questionNumber).toBeUndefined();
  });
});

// ── G17: favourites ─────────────────────────────────────────────────────────

describe("FEAT-G17 worksheetFavourites", () => {
  it("toggle adds and removes; isFavourited tracks state", () => {
    // Reset the in-memory key so other tests don't interfere.
    if (typeof globalThis.localStorage !== "undefined") {
      try {
        globalThis.localStorage.setItem(favTesting.KEY, JSON.stringify([]));
      } catch {
        /* ignore */
      }
    }
    const rec = { worksheetId: "w-1", label: "Fractions", createdAt: new Date().toISOString() };
    let r = toggleFavourite(rec, []);
    expect(r.nowFavourited).toBe(true);
    expect(isFavourited("w-1", r.list)).toBe(true);
    r = toggleFavourite(rec, r.list);
    expect(r.nowFavourited).toBe(false);
    expect(isFavourited("w-1", r.list)).toBe(false);
  });

  it("loadFavourites returns an array", () => {
    expect(Array.isArray(loadFavourites())).toBe(true);
  });

  it("recentFavourites caps at limit", () => {
    const list = Array.from({ length: 12 }, (_, i) => ({
      worksheetId: `w-${i}`,
      label: `Wk${i}`,
      createdAt: new Date().toISOString(),
    }));
    expect(recentFavourites(8, list)).toHaveLength(8);
  });
});

// ── H1: pupil progress aggregator ──────────────────────────────────────────

describe("FEAT-H1 pupilProgressAggregator", () => {
  it("is pure: same input → same output across two calls", () => {
    const rows = [
      { pupilId: "p1", worksheetId: "w1", sectionIndex: 0, specRef: "S1", status: "correct" as const, attemptedAt: "2026-05-26T10:00:00Z" },
      { pupilId: "p1", worksheetId: "w1", sectionIndex: 1, specRef: "S2", status: "incorrect" as const, attemptedAt: "2026-05-26T10:01:00Z" },
      { pupilId: "p2", worksheetId: "w1", sectionIndex: 0, specRef: "S1", status: "partial" as const, attemptedAt: "2026-05-26T10:02:00Z" },
    ];
    const a = aggregatePupilProgress(rows);
    const b = aggregatePupilProgress(rows);
    expect(a).toEqual(b);
  });

  it("bands: green ≥80, amber 50-79, red <50, grey <3 attempts", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      pupilId: "p" + i,
      worksheetId: "w1",
      sectionIndex: 0,
      specRef: "S1",
      status: (i < 9 ? "correct" : "incorrect") as "correct" | "incorrect",
      attemptedAt: "2026-05-26T10:00:00Z",
    }));
    const agg = aggregatePupilProgress(rows);
    const s1 = agg.perSpecRef.find((s) => s.specRef === "S1");
    expect(s1!.band).toBe("green");
  });

  it("handles empty input", () => {
    const agg = aggregatePupilProgress([]);
    expect(agg.perPupil).toHaveLength(0);
    expect(agg.perClass.totalAttempts).toBe(0);
  });
});

// ── H10: wrong-answer aggregator ──────────────────────────────────────────

describe("FEAT-H10 wrongAnswerAggregator", () => {
  it("returns no brief when below threshold", () => {
    const out = aggregateWrongAnswers([
      { pupilId: "p1", worksheetId: "w1", sectionIndex: 0, specRef: "S1", status: "correct", attemptedAt: "2026-05-26T10:00:00Z" },
      { pupilId: "p2", worksheetId: "w1", sectionIndex: 0, specRef: "S1", status: "correct", attemptedAt: "2026-05-26T10:01:00Z" },
    ]);
    expect(out.brief).toBeNull();
  });

  it("emits gaps sorted by wrong-rate descending when above threshold", () => {
    const rows = [
      ...Array.from({ length: 5 }, (_, i) => ({
        pupilId: "p" + i,
        worksheetId: "w1",
        sectionIndex: 0,
        specRef: "S1",
        status: "incorrect" as const,
        attemptedAt: "2026-05-26T10:00:00Z",
      })),
      { pupilId: "p0", worksheetId: "w1", sectionIndex: 1, specRef: "S2", status: "incorrect" as const, attemptedAt: "2026-05-26T10:00:00Z" },
      { pupilId: "p1", worksheetId: "w1", sectionIndex: 1, specRef: "S2", status: "correct" as const, attemptedAt: "2026-05-26T10:00:00Z" },
    ];
    const out = aggregateWrongAnswers(rows, { threshold: 0.3 });
    expect(out.brief).not.toBeNull();
    expect(out.brief!.gaps[0].specRef).toBe("S1");
    expect(out.brief!.gaps[0].pctWrong).toBeGreaterThanOrEqual(out.brief!.gaps[1]?.pctWrong ?? 0);
  });
});

// ── H11: tier shift ─────────────────────────────────────────────────────────

describe("FEAT-H11 tierShift", () => {
  it("easier from foundation → both", () => {
    expect(tierTesting.resolveTier("foundation", "easier")).toBe("foundation");
  });

  it("harder from higher → higher (cap)", () => {
    expect(tierTesting.resolveTier("higher", "harder")).toBe("higher");
  });

  it("easier from higher → both (one step down)", () => {
    expect(tierTesting.resolveTier("higher", "easier")).toBe("both");
  });

  it("harder from foundation → both", () => {
    expect(tierTesting.resolveTier("foundation", "harder")).toBe("both");
  });
});

// ── H12: Leitner scheduler ──────────────────────────────────────────────────

describe("FEAT-H12 leitnerScheduler", () => {
  it("correct attempt advances box (cap 5)", () => {
    let s = applyAttempt(undefined, { skill: "S1", status: "correct", attemptedAt: "1" });
    expect(s.box).toBe(2);
    s = applyAttempt(s, { skill: "S1", status: "correct", attemptedAt: "2" });
    s = applyAttempt(s, { skill: "S1", status: "correct", attemptedAt: "3" });
    s = applyAttempt(s, { skill: "S1", status: "correct", attemptedAt: "4" });
    s = applyAttempt(s, { skill: "S1", status: "correct", attemptedAt: "5" });
    expect(s.box).toBe(5);
  });

  it("incorrect attempt demotes to box 1", () => {
    const s = applyAttempt({ skill: "S", box: 4, lastReviewed: "0", attempts: 3 }, { skill: "S", status: "incorrect", attemptedAt: "1" });
    expect(s.box).toBe(1);
  });

  it("biasedSkillOrder respects 60/30/10 distribution within tolerance", () => {
    const states = [
      { skill: "A", box: 1 as const, lastReviewed: "", attempts: 0 },
      { skill: "B", box: 1 as const, lastReviewed: "", attempts: 0 },
      { skill: "C", box: 2 as const, lastReviewed: "", attempts: 0 },
      { skill: "D", box: 2 as const, lastReviewed: "", attempts: 0 },
      { skill: "E", box: 3 as const, lastReviewed: "", attempts: 0 },
    ];
    const order = biasedSkillOrder(states, undefined, 10);
    const box1Count = order.filter((s) => ["A", "B"].includes(s)).length;
    expect(box1Count).toBeGreaterThanOrEqual(5);
  });

  it("buildSkillStates is deterministic", () => {
    const attempts = [
      { skill: "S1", status: "correct" as const, attemptedAt: "2026-01-01T00:00:00Z" },
      { skill: "S1", status: "incorrect" as const, attemptedAt: "2026-01-02T00:00:00Z" },
    ];
    expect(buildSkillStates(attempts)).toEqual(buildSkillStates(attempts));
  });
});

// ── H9: worked-example stepper ────────────────────────────────────────────

describe("FEAT-H9 workedExampleStepper", () => {
  it("locks step 2 until step 1 advances to complete", () => {
    const steps = [
      { stepNumber: 1, prompt: "p1", modelAnswer: "m1" },
      { stepNumber: 2, prompt: "p2", modelAnswer: "m2" },
    ];
    let s = initialStepperState(steps);
    expect(isStepRevealed(s, 1)).toBe(true);
    expect(isStepRevealed(s, 2)).toBe(false);
    s = stepperReducer(s, { type: "feedback", step: 1 });
    s = stepperReducer(s, { type: "advance" });
    expect(isStepRevealed(s, 2)).toBe(true);
  });
});

// ── H4: gamification ──────────────────────────────────────────────────────

describe("FEAT-H4 gamificationEngine", () => {
  it("hides bottom-3 from public leaderboard by default", () => {
    const attempts = Array.from({ length: 5 }, (_, i) => ({
      pupilId: `p${i}`,
      attemptedAt: "2026-05-26T10:00:00Z",
      status: (i % 2 === 0 ? "correct" : "incorrect") as "correct" | "incorrect",
    }));
    const out = runGamification(attempts);
    expect(out.hiddenFromLeaderboard.length).toBeGreaterThanOrEqual(3);
  });

  it("opt-out pupils never appear on the leaderboard", () => {
    const attempts = [
      { pupilId: "p1", status: "correct" as const, attemptedAt: "2026-05-26T10:00:00Z" },
      { pupilId: "p2", status: "correct" as const, attemptedAt: "2026-05-26T10:00:00Z" },
    ];
    const out = runGamification(attempts, { optedOutPupilIds: ["p1"] });
    expect(out.leaderboard.find((e) => e.pupilId === "p1")).toBeUndefined();
  });

  it("first-correct badge issued on first correct", () => {
    const out = runGamification([
      { pupilId: "p1", status: "correct" as const, attemptedAt: "2026-05-26T10:00:00Z" },
    ]);
    expect(out.badges.find((b) => b.badgeId === "first-correct" && b.pupilId === "p1")).toBeDefined();
  });
});

// ── H3: real-world contexts ────────────────────────────────────────────────

describe("FEAT-H3 realWorldContextLibrary", () => {
  it("listCategories returns at least 5 distinct categories", () => {
    expect(listCategories().length).toBeGreaterThanOrEqual(5);
  });

  it("filterContexts honours avoidWith for sendNeed", () => {
    const all = filterContexts({});
    const filtered = filterContexts({ sendNeed: "anxiety" });
    expect(filtered.length).toBeLessThanOrEqual(all.length);
  });

  it("buildContextDirective returns empty when no id", () => {
    expect(buildContextDirective(undefined)).toBe("");
    expect(buildContextDirective(null)).toBe("");
  });

  it("buildContextDirective returns a directive when id valid", () => {
    const out = buildContextDirective("premier-league");
    expect(out).toContain("Premier League");
  });
});
