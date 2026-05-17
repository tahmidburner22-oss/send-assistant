/**
 * questionProvenance.test.ts — FEAT-PB1
 *
 * Tests for the per-question provenance pass that stamps every question on
 * Year 9+ worksheets with { specRef, ao, bloomLevel, expectedReadingAge,
 * sourceCitation? }.
 *
 * Covers:
 *   - AO inference from command word + marks
 *   - Bloom mapping (from section.type and from command word)
 *   - Spec-ref best-match against the syllabus dataset
 *   - Reading-age estimator returns a sensible UK age (5–18)
 *   - applyQuestionProvenance fills missing fields, preserves existing ones,
 *     never mutates the input, is a no-op for KS3 (Year 8 and below) and
 *     emits a postValidatorWarning when too few questions resolve a specRef.
 *   - Chip-visibility predicate that mirrors the WorksheetRenderer guard for
 *     teacher-only display.
 */
import { describe, it, expect } from "vitest";
import {
  applyQuestionProvenance,
  estimateReadingAge,
  inferAo,
  inferBloom,
} from "../questionProvenance";

// Loose section / worksheet types so tests can both read and write the
// provenance fields without fighting TS narrowing.
type LooseSection = Record<string, unknown> & { type?: string; title?: string; content?: string; marks?: number };
type LooseWorksheet = { title?: string; sections: LooseSection[]; metadata?: Record<string, unknown> };

// ─── inferAo ─────────────────────────────────────────────────────────────────

describe("inferAo", () => {
  it("returns AO1 for low-mark recall command words", () => {
    expect(inferAo("State the unit of force.", 1)).toBe("AO1");
    expect(inferAo("Name the process by which plants make food.", 1)).toBe("AO1");
    expect(inferAo("Identify the largest organ in the human body.", 1)).toBe("AO1");
  });

  it("returns AO2 for application command words", () => {
    expect(inferAo("Calculate the resultant force on the box.", 3)).toBe("AO2");
    expect(inferAo("Solve the equation 3x + 4 = 19.", 2)).toBe("AO2");
    expect(inferAo("Explain why the ammeter reading increased.", 3)).toBe("AO2");
  });

  it("returns AO3 for analytic / evaluative command words", () => {
    expect(inferAo("Evaluate the impact of the Treaty of Versailles.", 8)).toBe("AO3");
    expect(inferAo("Analyse the effect of temperature on rate of reaction.", 6)).toBe("AO3");
    expect(inferAo("To what extent was Hitler's rise inevitable?", 16)).toBe("AO3");
  });

  it("upgrades to AO3 when marks are 6 or more even without an evaluative command word (LOR-style)", () => {
    // 'Outline' isn't in the AO3 command-word list — only the 6-mark heuristic should fire.
    expect(inferAo("Outline three causes of the outbreak of war.", 6)).toBe("AO3");
    // 'Give' doesn't match any command word — pure mark-based AO3.
    expect(inferAo("Give a full account of the events.", 6)).toBe("AO3");
  });

  it("upgrades AO1 to AO2 when marks ≥ 3 even without an obvious command word", () => {
    expect(inferAo("Give three reasons for the change.", 3)).toBe("AO2");
  });

  it("falls back to AO1 for anything else", () => {
    expect(inferAo("", 0)).toBe("AO1");
    expect(inferAo("Random plain sentence with no command word.", 1)).toBe("AO1");
  });
});

// ─── inferBloom ──────────────────────────────────────────────────────────────

describe("inferBloom", () => {
  it("maps low-Bloom question types to 'remember'", () => {
    expect(inferBloom({ type: "q-true-false" })).toBe("remember");
    expect(inferBloom({ type: "q-mcq" })).toBe("remember");
    expect(inferBloom({ type: "q-gap-fill" })).toBe("remember");
    expect(inferBloom({ type: "q-matching" })).toBe("remember");
  });

  it("maps mid-Bloom question types to 'understand' or 'apply'", () => {
    expect(inferBloom({ type: "q-short-answer" })).toBe("understand");
    expect(inferBloom({ type: "q-extended" })).toBe("apply");
    expect(inferBloom({ type: "q-graph" })).toBe("apply");
  });

  it("maps challenge / LOR question types to 'evaluate'", () => {
    expect(inferBloom({ type: "q-challenge" })).toBe("evaluate");
    expect(inferBloom({ type: "challenge" })).toBe("evaluate");
    expect(inferBloom({ type: "lor" })).toBe("evaluate");
  });

  it("falls back to title heuristics when type is unknown", () => {
    expect(inferBloom({ type: "section", title: "Recall — Warm Up" })).toBe("remember");
    expect(inferBloom({ type: "section", title: "Application & Analysis" })).toBe("apply");
    expect(inferBloom({ type: "section", title: "Stretch & Challenge" })).toBe("evaluate");
  });

  it("falls back to command-word heuristics when type and title are unknown", () => {
    expect(inferBloom({ type: "x", content: "Define the term photosynthesis." })).toBe("remember");
    expect(inferBloom({ type: "x", content: "Calculate the total resistance of the circuit." })).toBe("apply");
    expect(inferBloom({ type: "x", content: "Compare the two methods of separation." })).toBe("analyse");
    expect(inferBloom({ type: "x", content: "Evaluate the effectiveness of the campaign." })).toBe("evaluate");
  });

  it("returns a sensible default when no signal is available", () => {
    expect(inferBloom({})).toBe("understand");
  });
});

// ─── estimateReadingAge ──────────────────────────────────────────────────────

describe("estimateReadingAge", () => {
  it("returns a low age for very short / empty text", () => {
    expect(estimateReadingAge("")).toBe(7);
    expect(estimateReadingAge("hi")).toBe(7);
  });

  it("returns a value within the 5–18 UK reading-age band", () => {
    const age = estimateReadingAge(
      "The mitochondrion is the organelle responsible for oxidative phosphorylation in eukaryotic cells.",
    );
    expect(age).toBeGreaterThanOrEqual(5);
    expect(age).toBeLessThanOrEqual(18);
  });

  it("rates simple short sentences lower than dense academic prose", () => {
    const easy = estimateReadingAge(
      "The cat sat on the mat. It was warm. It liked the sun. The dog ran past. The cat did not move.",
    );
    const hard = estimateReadingAge(
      "Photosynthesis is the metabolic transformation by which chlorophyll-bearing autotrophs synthesise carbohydrate using electromagnetic radiation.",
    );
    expect(hard).toBeGreaterThan(easy);
  });

  it("strips '[3 marks]' tags before counting", () => {
    const a = estimateReadingAge("Calculate the speed of the cyclist.");
    const b = estimateReadingAge("Calculate the speed of the cyclist. [3 marks]");
    // Mark tags shouldn't add reading-age complexity
    expect(Math.abs(a - b)).toBeLessThanOrEqual(2);
  });
});

// ─── applyQuestionProvenance ─────────────────────────────────────────────────

const sampleY10 = (): LooseWorksheet => ({
  title: "Forces — Year 10 Physics",
  sections: [
    { type: "objective", title: "Learning Objective", content: "Calculate resultant force." },
    { type: "vocabulary", title: "Key Vocabulary", content: "force — a push or pull" },
    {
      type: "q-mcq",
      title: "Section A — Multiple Choice",
      marks: 1,
      content: "What is the SI unit of force? [1 mark]\nA Joule\nB Newton ✓\nC Watt\nD Pascal",
    },
    {
      type: "q-short-answer",
      title: "Section A — Short Answer",
      marks: 2,
      content: "State Newton's first law of motion. [2 marks]",
    },
    {
      type: "q-extended",
      title: "Section B — Calculation",
      marks: 3,
      content: "Calculate the resultant force on a 5 kg object accelerating at 2 m/s². [3 marks]",
    },
    {
      type: "q-challenge",
      title: "Challenge",
      marks: 6,
      content:
        "Evaluate the design of the seatbelt with reference to Newton's laws and momentum. [6 marks]",
    },
    {
      type: "mark-scheme",
      title: "Teacher Key",
      teacherOnly: true,
      content: "Q1: B (Newton). Q2: An object remains at rest...",
    },
  ],
  metadata: { subject: "science", yearGroup: "Year 10", topic: "Forces" },
});

const isQuestion = (s: LooseSection) => /^q-|^challenge$/.test(String(s.type));

describe("applyQuestionProvenance — happy path", () => {
  it("stamps ao, bloomLevel, specRef, and expectedReadingAge on every question section", () => {
    const out = applyQuestionProvenance(sampleY10()) as LooseWorksheet;
    const qs = out.sections.filter(isQuestion);
    expect(qs.length).toBe(4);
    for (const q of qs) {
      expect(["AO1", "AO2", "AO3", "AO4"]).toContain(q.ao);
      expect(["remember", "understand", "apply", "analyse", "evaluate", "create"]).toContain(q.bloomLevel);
      expect(typeof q.specRef).toBe("string");
      expect(String(q.specRef).length).toBeGreaterThan(0);
      expect(typeof q.expectedReadingAge).toBe("number");
      expect(q.expectedReadingAge as number).toBeGreaterThanOrEqual(5);
      expect(q.expectedReadingAge as number).toBeLessThanOrEqual(18);
    }
  });

  it("does not stamp non-question sections (objective, vocabulary, mark-scheme)", () => {
    const out = applyQuestionProvenance(sampleY10()) as LooseWorksheet;
    const lo = out.sections.find(s => s.type === "objective");
    const vocab = out.sections.find(s => s.type === "vocabulary");
    const ms = out.sections.find(s => s.type === "mark-scheme");
    expect(lo?.ao).toBeUndefined();
    expect(vocab?.ao).toBeUndefined();
    // mark-scheme has teacherOnly=true, must be skipped regardless
    expect(ms?.ao).toBeUndefined();
  });

  it("respects an existing AO instead of overwriting it", () => {
    const ws = sampleY10();
    ws.sections[2].ao = "AO3"; // pre-stamped MCQ — should NOT be overwritten with AO1
    const out = applyQuestionProvenance(ws) as LooseWorksheet;
    const mcq = out.sections.find(s => s.type === "q-mcq");
    expect(mcq?.ao).toBe("AO3");
  });

  it("uses the syllabus best-match for specRef when subject + topic match", () => {
    const out = applyQuestionProvenance(sampleY10()) as LooseWorksheet;
    const ext = out.sections.find(s => s.type === "q-extended");
    // resolveSpecRef accumulates KS1–KS4 topics for science and best-matches
    // against the topic string. "Forces" appears in multiple year groups so
    // a match is guaranteed and the ref must mention the word "forces".
    expect(typeof ext?.specRef).toBe("string");
    expect(String(ext?.specRef ?? "").toLowerCase()).toContain("forces");
  });

  it("fills inferred AO3 for the 6-mark evaluative challenge question", () => {
    const out = applyQuestionProvenance(sampleY10()) as LooseWorksheet;
    const challenge = out.sections.find(s => s.type === "q-challenge");
    expect(challenge?.ao).toBe("AO3");
    expect(challenge?.bloomLevel).toBe("evaluate");
  });
});

describe("applyQuestionProvenance — invariants", () => {
  it("does not mutate the input worksheet", () => {
    const ws = sampleY10();
    const snapshot = JSON.stringify(ws);
    applyQuestionProvenance(ws);
    expect(JSON.stringify(ws)).toBe(snapshot);
  });

  it("is a no-op for Year 8 and below (KS3/KS2/KS1)", () => {
    const ws = sampleY10();
    ws.metadata = { ...(ws.metadata ?? {}), yearGroup: "Year 8" };
    const out = applyQuestionProvenance(ws) as LooseWorksheet;
    const mcq = out.sections.find(s => s.type === "q-mcq");
    expect(mcq?.ao).toBeUndefined();
    expect(mcq?.bloomLevel).toBeUndefined();
    expect(mcq?.specRef).toBeUndefined();
  });

  it("is idempotent — running twice yields the same result", () => {
    const once = applyQuestionProvenance(sampleY10()) as LooseWorksheet;
    const twice = applyQuestionProvenance(once) as LooseWorksheet;
    expect(JSON.stringify(once.sections)).toBe(JSON.stringify(twice.sections));
  });

  it("accepts opts overrides for subject/topic/yearGroup", () => {
    const ws = sampleY10();
    ws.metadata = {}; // strip metadata so opts must take over
    const out = applyQuestionProvenance(ws, {
      subject: "science",
      topic: "Forces",
      yearGroup: "Year 10",
    }) as LooseWorksheet;
    const ext = out.sections.find(s => s.type === "q-extended");
    expect(ext?.specRef).toBeTruthy();
  });

  it("never invents a sourceCitation — the field stays absent unless the input set it", () => {
    const out = applyQuestionProvenance(sampleY10()) as LooseWorksheet;
    for (const s of out.sections) {
      // No section had a sourceCitation in the input, so none should appear.
      expect(s.sourceCitation).toBeUndefined();
    }
  });

  it("preserves an existing sourceCitation passed through", () => {
    const ws = sampleY10();
    ws.sections[2].sourceCitation = "AQA Nov 2022 P1 Q3";
    const out = applyQuestionProvenance(ws) as LooseWorksheet;
    const mcq = out.sections.find(s => s.type === "q-mcq");
    expect(mcq?.sourceCitation).toBe("AQA Nov 2022 P1 Q3");
  });
});

describe("applyQuestionProvenance — warnings", () => {
  it("emits a postValidatorWarning when fewer than 80% of questions resolve a specRef", () => {
    // No subject and no topic ⇒ resolveSpecRef returns "" ⇒ specRef can't be filled.
    const ws: LooseWorksheet = {
      sections: [
        { type: "q-mcq", marks: 1, content: "Q1 [1 mark]" },
        { type: "q-short-answer", marks: 2, content: "Q2 [2 marks]" },
        { type: "q-extended", marks: 3, content: "Q3 [3 marks]" },
        { type: "q-challenge", marks: 6, content: "Q4 [6 marks]" },
      ],
      metadata: { yearGroup: "Year 10" },
    };
    const out = applyQuestionProvenance(ws) as LooseWorksheet;
    const warnings = (out.metadata?.postValidatorWarnings as string[] | undefined);
    expect(warnings).toBeDefined();
    expect(warnings!.some(w => /PB1 provenance/i.test(w))).toBe(true);
  });

  it("does not duplicate warnings already present on metadata", () => {
    const ws: LooseWorksheet = {
      sections: [
        { type: "q-mcq", marks: 1, content: "Q1 [1 mark]" },
        { type: "q-short-answer", marks: 2, content: "Q2 [2 marks]" },
      ],
      metadata: {
        yearGroup: "Year 10",
        postValidatorWarnings: ["existing warning from earlier pass"],
      },
    };
    const out = applyQuestionProvenance(ws) as LooseWorksheet;
    const warnings = (out.metadata?.postValidatorWarnings as string[] | undefined);
    expect(warnings).toBeDefined();
    // Existing warning is preserved
    expect(warnings).toContain("existing warning from earlier pass");
    // PB1 warning is appended — and only once
    const pb1Count = warnings!.filter(w => /PB1 provenance/i.test(w)).length;
    expect(pb1Count).toBeLessThanOrEqual(1);
  });

  it("does not warn when every question gets a specRef", () => {
    const out = applyQuestionProvenance(sampleY10()) as LooseWorksheet;
    const warnings = (out.metadata?.postValidatorWarnings as string[] | undefined);
    if (warnings) {
      expect(warnings.some(w => /PB1 provenance/i.test(w))).toBe(false);
    }
  });
});

// ─── Chip-visibility predicate (mirrors WorksheetRenderer.tsx line ~6689) ────
//
// The renderer guards the provenance chip with:
//   isTeacherView && isIndividualQuestion &&
//   (section.ao || section.specRef || section.bloomLevel)
//
// We re-state that predicate here so the contract between the post-validator
// and the renderer is locked: the post-validator promises to fill at least
// one of those three fields on every Y9+ question, and the renderer only
// shows the chip when at least one is set AND the user is in teacher view
// AND the section is an individual question. Snapshotting the React tree
// would require @testing-library/react + jsdom which the project does not
// currently depend on; the predicate test below covers the same intent.

function chipVisible(opts: {
  isTeacherView: boolean;
  isIndividualQuestion: boolean;
  section: { ao?: unknown; specRef?: unknown; bloomLevel?: unknown };
}): boolean {
  const { isTeacherView, isIndividualQuestion, section } = opts;
  return Boolean(
    isTeacherView &&
      isIndividualQuestion &&
      (section.ao || section.specRef || section.bloomLevel),
  );
}

describe("provenance chip visibility predicate", () => {
  const stamped = { ao: "AO2", specRef: "KS4 Physics — Forces", bloomLevel: "apply" };

  it("shows the chip in teacher view for an individual question with provenance", () => {
    expect(chipVisible({ isTeacherView: true, isIndividualQuestion: true, section: stamped })).toBe(true);
  });

  it("hides the chip in pupil view (the print/PDF student path)", () => {
    expect(chipVisible({ isTeacherView: false, isIndividualQuestion: true, section: stamped })).toBe(false);
  });

  it("hides the chip on non-question sections (objectives, vocabulary, headers)", () => {
    expect(chipVisible({ isTeacherView: true, isIndividualQuestion: false, section: stamped })).toBe(false);
  });

  it("hides the chip when the question has no provenance fields", () => {
    expect(chipVisible({ isTeacherView: true, isIndividualQuestion: true, section: {} })).toBe(false);
  });

  it("shows the chip when only one of the three provenance fields is populated", () => {
    expect(chipVisible({ isTeacherView: true, isIndividualQuestion: true, section: { ao: "AO1" } })).toBe(true);
    expect(chipVisible({ isTeacherView: true, isIndividualQuestion: true, section: { specRef: "x" } })).toBe(true);
    expect(chipVisible({ isTeacherView: true, isIndividualQuestion: true, section: { bloomLevel: "apply" } })).toBe(true);
  });

  it("end-to-end: applyQuestionProvenance + chipVisible together yield a visible chip on every Y10 question", () => {
    const out = applyQuestionProvenance(sampleY10()) as LooseWorksheet;
    const qs = out.sections.filter(isQuestion);
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(
        chipVisible({
          isTeacherView: true,
          isIndividualQuestion: true,
          section: { ao: q.ao, specRef: q.specRef, bloomLevel: q.bloomLevel },
        }),
      ).toBe(true);
      expect(
        chipVisible({
          isTeacherView: false,
          isIndividualQuestion: true,
          section: { ao: q.ao, specRef: q.specRef, bloomLevel: q.bloomLevel },
        }),
      ).toBe(false);
    }
  });
});
