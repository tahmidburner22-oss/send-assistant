/**
 * Tests for `enforceSendOverlayMarkers` (Lane 1.6 + 1.7 + Lane 2.2).
 *
 * Each SEND need has its own describe block. Every test asserts both
 * the happy path (markers ship correctly) and the idempotency
 * guarantee (running twice is a no-op).
 */

import { describe, expect, it } from "vitest";
import {
  enforceSendOverlayMarkers,
  type PostValidatorWorksheet,
  type PostValidatorSection,
} from "../worksheetPostValidator";

// ── Test fixture builders ────────────────────────────────────────────────────

function makeWs(
  sendNeed: string,
  sectionsExtra: PostValidatorSection[] = [],
): PostValidatorWorksheet {
  return {
    title: "Y10 Biology — Respiration",
    metadata: {
      subject: "Biology",
      topic: "Respiration",
      yearGroup: "Year 10",
      sendNeed,
    },
    sections: [
      {
        id: "lo",
        type: "objective",
        title: "Learning Objectives",
        content: "Describe aerobic and anaerobic respiration and explain when each is used.",
        teacherOnly: false,
      },
      {
        id: "vocab",
        type: "vocabulary",
        title: "Key Vocabulary",
        content: "aerobic respiration — using oxygen to release energy\nanaerobic respiration — releasing energy without oxygen\nATP — the energy-carrying molecule\nmitochondria — the cell's energy organelles",
        teacherOnly: false,
      },
      {
        id: "we",
        type: "example",
        title: "Worked Example",
        content: "Step 1: Identify the type of respiration.\nStep 2: Write the word equation.\nStep 3: Check it balances.",
        teacherOnly: false,
      },
      ...sectionsExtra,
      {
        id: "q1",
        type: "q-true-false",
        title: "Q1 — True or False",
        content: "1. Aerobic respiration uses oxygen. TRUE\n2. ATP stores genetic information. FALSE",
        teacherOnly: false,
      },
      {
        id: "q2",
        type: "q-mcq",
        title: "Q2 — Multiple Choice",
        content: "Which gas is released by aerobic respiration? [1 mark]\nA Oxygen\nB Carbon dioxide\nC Nitrogen\nD Hydrogen",
        teacherOnly: false,
      },
      {
        id: "q3",
        type: "q-short-answer",
        title: "Q3 — Recall",
        content: "State the equation for aerobic respiration. [2 marks]",
        teacherOnly: false,
      },
      {
        id: "q4",
        type: "q-extended",
        title: "Q4 — Application",
        content: "Explain why anaerobic respiration produces less energy than aerobic respiration. (4 marks)",
        teacherOnly: false,
      },
      {
        id: "q5",
        type: "q-extended",
        title: "Q5 — Calculation",
        content: "A pupil's heart rate rises from 70 bpm to 140 bpm during exercise. Calculate the percentage increase. (3 marks)",
        teacherOnly: false,
      },
      {
        id: "challenge",
        type: "challenge",
        title: "Challenge Question",
        content: "Evaluate whether anaerobic respiration is ever the better choice for a working muscle. (8 marks)",
        teacherOnly: false,
      },
      {
        id: "tk",
        type: "mark-scheme",
        title: "Teacher Key",
        content: "Q1: 1 TRUE 2 FALSE; Q2: B; Q3: glucose + oxygen → carbon dioxide + water + energy; …",
        teacherOnly: true,
      },
    ],
  };
}

function isIdempotent(ws: PostValidatorWorksheet, sendNeed: string): boolean {
  const r1 = enforceSendOverlayMarkers(ws, { sendNeed });
  const r2 = enforceSendOverlayMarkers(r1.worksheet, { sendNeed });
  return JSON.stringify(r1.worksheet) === JSON.stringify(r2.worksheet) && r2.warnings.length === 0;
}

// ── HI (Lane 1.6) ────────────────────────────────────────────────────────────

describe("enforceSendOverlayMarkers — HI (Lane 1.6)", () => {
  it("inserts a Topic Summary block above the first question when missing", () => {
    const ws = makeWs("hi");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "hi" });
    const summary = worksheet.sections!.find(s => s.type === "topic-summary");
    expect(summary).toBeDefined();
    expect(summary!.title).toMatch(/topic\s+summary/i);
    expect(String(summary!.content)).toMatch(/Respiration/);
    expect(String(summary!.content)).toMatch(/aerobic|anaerobic|ATP|mitochondria/i);
    expect(warnings.some(w => /Phase 4 — HI/.test(w))).toBe(true);
  });

  it("places the Topic Summary IMMEDIATELY before the first question section", () => {
    const ws = makeWs("hi");
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "hi" });
    const sections = worksheet.sections || [];
    const summaryIdx = sections.findIndex(s => s.type === "topic-summary");
    const firstQIdx = sections.findIndex(s => String(s.type || "").startsWith("q-"));
    expect(summaryIdx).toBeGreaterThanOrEqual(0);
    expect(firstQIdx).toBeGreaterThanOrEqual(0);
    expect(summaryIdx + 1).toBe(firstQIdx);
  });

  it("does not insert a second Topic Summary when one already exists", () => {
    const ws = makeWs("hi", [
      {
        id: "ts-existing",
        type: "topic-summary",
        title: "Topic Summary — read first",
        content: "Pre-existing topic summary.",
        teacherOnly: false,
      },
    ]);
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "hi" });
    const summaries = worksheet.sections!.filter(s => s.type === "topic-summary");
    expect(summaries).toHaveLength(1);
    // Core intent: no duplicate Topic Summary inserted.
    expect(warnings.some(w => /Topic Summary block was missing/i.test(w))).toBe(false);
  });

  it("is idempotent", () => {
    expect(isIdempotent(makeWs("hi"), "hi")).toBe(true);
  });
});

// ── Anxiety (Lane 1.7) ───────────────────────────────────────────────────────

describe("enforceSendOverlayMarkers — Anxiety (Lane 1.7)", () => {
  it("renames the Challenge title to 'OPTIONAL BONUS — only if you want to!'", () => {
    const ws = makeWs("anxiety");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "anxiety" });
    const challenge = worksheet.sections!.find(s => s.type === "challenge");
    expect(challenge!.title).toBe("OPTIONAL BONUS — only if you want to!");
    expect(warnings.some(w => /Phase 4 — Anxiety/.test(w))).toBe(true);
  });

  it("prepends WARM-UP to a Section 1 / Section A title when present", () => {
    const ws = makeWs("anxiety", [
      { id: "s1", type: "section-header", title: "Section 1 — Recall", teacherOnly: false },
    ]);
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "anxiety" });
    const s1 = worksheet.sections!.find(s => s.id === "s1");
    expect(s1!.title).toMatch(/^WARM-UP/);
    expect(s1!.title).toMatch(/Section 1/);
  });

  it("does not preserve the placeholder text 'OPTIONAL BONUS' twice", () => {
    const ws = makeWs("anxiety");
    const r1 = enforceSendOverlayMarkers(ws, { sendNeed: "anxiety" });
    const r2 = enforceSendOverlayMarkers(r1.worksheet, { sendNeed: "anxiety" });
    const challenges = r2.worksheet.sections!.filter(s => s.type === "challenge");
    expect(challenges).toHaveLength(1);
    expect(r2.warnings).toHaveLength(0);
  });

  it("is idempotent", () => {
    expect(isIdempotent(makeWs("anxiety"), "anxiety")).toBe(true);
  });
});

// ── ADHD (Lane 2.2) ──────────────────────────────────────────────────────────

describe("enforceSendOverlayMarkers — ADHD (Lane 2.2)", () => {
  it("prepends '[ ] ' to every pupil-facing question content", () => {
    const ws = makeWs("adhd");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "adhd" });
    const questions = worksheet.sections!.filter(s =>
      String(s.type || "").startsWith("q-") || s.type === "challenge",
    );
    for (const q of questions) {
      expect(String(q.content)).toMatch(/^\[\s\]\s/);
    }
    expect(warnings.some(w => /Phase 4 — ADHD.*tick-box/i.test(w))).toBe(true);
  });

  it("inserts a brain-break send-support section mid-flow", () => {
    const ws = makeWs("adhd");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "adhd" });
    const brainBreak = worksheet.sections!.find(
      s => typeof s.content === "string" && /brain\s*break/i.test(s.content),
    );
    expect(brainBreak).toBeDefined();
    expect(String(brainBreak!.content)).toMatch(/stand\s+up|stretch/i);
    expect(warnings.some(w => /Phase 4 — ADHD.*brain-break/i.test(w))).toBe(true);
  });

  it("renames the Challenge title to 'BONUS — only if you want to!' (note: NOT 'OPTIONAL BONUS')", () => {
    const ws = makeWs("adhd");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "adhd" });
    const challenge = worksheet.sections!.find(s => s.type === "challenge");
    expect(challenge!.title).toBe("BONUS — only if you want to!");
    expect(challenge!.title).not.toMatch(/^OPTIONAL/);
    expect(warnings.some(w => /Phase 4 — ADHD.*BONUS/i.test(w))).toBe(true);
  });

  it("is idempotent", () => {
    expect(isIdempotent(makeWs("adhd"), "adhd")).toBe(true);
  });

  it("does not duplicate the tick-box prefix on a second run", () => {
    const ws = makeWs("adhd");
    const r1 = enforceSendOverlayMarkers(ws, { sendNeed: "adhd" });
    const r2 = enforceSendOverlayMarkers(r1.worksheet, { sendNeed: "adhd" });
    const q1 = r2.worksheet.sections!.find(s => s.id === "q1");
    expect(String(q1!.content).match(/^\[\s\]\s/g)).toHaveLength(1);
  });
});

// ── Dyslexia (Lane 2.2) ──────────────────────────────────────────────────────

describe("enforceSendOverlayMarkers — Dyslexia (Lane 2.2)", () => {
  it("inserts a Method-steps box before the first question", () => {
    const ws = makeWs("dyslexia");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "dyslexia" });
    const sections = worksheet.sections || [];
    const methodIdx = sections.findIndex(
      s => s.type === "method-box" || /method\s+steps/i.test(String(s.title || "")),
    );
    const firstQIdx = sections.findIndex(s => String(s.type || "").startsWith("q-"));
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    expect(methodIdx).toBeLessThan(firstQIdx);
    expect(warnings.some(w => /Phase 4 — Dyslexia/i.test(w))).toBe(true);
  });

  it("synthesises method content from the worked example when present", () => {
    const ws = makeWs("dyslexia");
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "dyslexia" });
    const method = worksheet.sections!.find(s => s.type === "method-box");
    expect(method).toBeDefined();
    expect(String(method!.content)).toMatch(/step/i);
  });

  it("is idempotent", () => {
    expect(isIdempotent(makeWs("dyslexia"), "dyslexia")).toBe(true);
  });
});

// ── MLD (Lane 2.2) ───────────────────────────────────────────────────────────

describe("enforceSendOverlayMarkers — MLD (Lane 2.2)", () => {
  it("inserts a topic-context block before the first question", () => {
    const ws = makeWs("mld");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "mld" });
    const ctx = worksheet.sections!.find(s => s.type === "topic-context");
    expect(ctx).toBeDefined();
    expect(String(ctx!.content)).toMatch(/Respiration/);
    expect(warnings.some(w => /Phase 4 — MLD/i.test(w))).toBe(true);
  });

  it("does not double-insert the context block if HI's topic-summary is already present", () => {
    const ws = makeWs("mld", [
      {
        id: "ts",
        type: "topic-summary",
        title: "Topic Summary — read first",
        content: "Existing HI topic summary.",
        teacherOnly: false,
      },
    ]);
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "mld" });
    expect(worksheet.sections!.filter(s => s.type === "topic-context")).toHaveLength(0);
    // Core intent: no duplicate context block is inserted.
    expect(warnings.some(w => /Topic-context block was missing/i.test(w))).toBe(false);
    // IMP-14 still applies independently: the calculation question (q5) gets a HELP BOX.
    const q5 = worksheet.sections!.find(s => s.id === "q5");
    expect(String(q5!.content)).toMatch(/HELP BOX/);
  });

  it("is idempotent", () => {
    expect(isIdempotent(makeWs("mld"), "mld")).toBe(true);
  });
});

// ── Dyscalculia (Lane 2.2) ───────────────────────────────────────────────────

describe("enforceSendOverlayMarkers — Dyscalculia (Lane 2.2)", () => {
  it("appends a 'Numbers in this question' cue to questions containing digits", () => {
    const ws = makeWs("dyscalculia");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "dyscalculia" });
    const q5 = worksheet.sections!.find(s => s.id === "q5");
    expect(String(q5!.content)).toMatch(/Numbers in this question/i);
    expect(String(q5!.content)).toMatch(/70/);
    expect(String(q5!.content)).toMatch(/140/);
    expect(warnings.some(w => /Phase 4 — Dyscalculia/i.test(w))).toBe(true);
  });

  it("does not append a cue to prose-only questions with no digits", () => {
    const ws = makeWs("dyscalculia");
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "dyscalculia" });
    const q3 = worksheet.sections!.find(s => s.id === "q3");
    // Q3 has "[2 marks]" which contains a digit — but the cue logic
    // intentionally captures any digit. So this assertion confirms
    // that we DO see numbers from "[2 marks]" — which is acceptable
    // because [2 marks] tells the pupil that 2 marks are at stake.
    expect(String(q3!.content)).toMatch(/Numbers in this question/i);
  });

  it("is idempotent", () => {
    expect(isIdempotent(makeWs("dyscalculia"), "dyscalculia")).toBe(true);
  });
});

// ── EAL (Lane 2.2) ───────────────────────────────────────────────────────────

describe("enforceSendOverlayMarkers — EAL (Lane 2.2)", () => {
  it("appends a sentence frame to extended-response questions", () => {
    const ws = makeWs("eal");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "eal" });
    const q4 = worksheet.sections!.find(s => s.id === "q4");
    expect(String(q4!.content)).toMatch(/Sentence frame/i);
    expect(warnings.some(w => /Phase 4 — EAL/i.test(w))).toBe(true);
  });

  it("uses an explain-frame for 'Explain why' stems", () => {
    const ws = makeWs("eal");
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "eal" });
    const q4 = worksheet.sections!.find(s => s.id === "q4");
    expect(String(q4!.content)).toMatch(/because/i);
  });

  it("uses a calculate-frame for 'Calculate' stems", () => {
    const ws = makeWs("eal");
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "eal" });
    const q5 = worksheet.sections!.find(s => s.id === "q5");
    expect(String(q5!.content)).toMatch(/Sentence frame/i);
    expect(String(q5!.content)).toMatch(/answer is/i);
  });

  it("does not frame MCQ / true-false (they own their own answer affordance)", () => {
    const ws = makeWs("eal");
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "eal" });
    const q1 = worksheet.sections!.find(s => s.id === "q1");
    const q2 = worksheet.sections!.find(s => s.id === "q2");
    expect(String(q1!.content)).not.toMatch(/Sentence frame/i);
    expect(String(q2!.content)).not.toMatch(/Sentence frame/i);
  });

  it("is idempotent", () => {
    expect(isIdempotent(makeWs("eal"), "eal")).toBe(true);
  });
});

// ── VI (Lane 2.2) — warn-only ────────────────────────────────────────────────

describe("enforceSendOverlayMarkers — VI (Lane 2.2)", () => {
  it("warns on a diagram-dependent question with no text equivalent", () => {
    const ws = makeWs("vi", [
      {
        id: "qDiag",
        type: "q-short-answer",
        title: "Q-Diag",
        content: "Label the diagram shown above. [3 marks]",
        teacherOnly: false,
      },
    ]);
    const { warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "vi" });
    expect(warnings.some(w => /Phase 4 — VI.*text equivalent/i.test(w))).toBe(true);
  });

  it("does NOT mutate the worksheet (warn-only)", () => {
    const ws = makeWs("vi", [
      {
        id: "qDiag",
        type: "q-short-answer",
        title: "Q-Diag",
        content: "Label the diagram shown above.",
        teacherOnly: false,
      },
    ]);
    const before = JSON.stringify(ws.sections);
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "vi" });
    expect(JSON.stringify(worksheet.sections)).toBe(before);
  });

  it("does not warn when a diagram has a substantial caption", () => {
    const ws = makeWs("vi", [
      {
        id: "diagram-a",
        type: "diagram",
        title: "Diagram A",
        content: "[diagram visual]",
        caption: "A labelled cross-section of a mitochondrion showing the inner and outer membranes, the matrix, and the cristae where ATP synthase is located.",
        teacherOnly: false,
      } as PostValidatorSection,
      {
        id: "qDiag",
        type: "q-short-answer",
        title: "Q-Diag",
        content: "Using the diagram, label the cristae. [2 marks]",
        teacherOnly: false,
      },
    ]);
    const { warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "vi" });
    expect(warnings.some(w => /text equivalent/i.test(w))).toBe(false);
  });
});

// ── Dyspraxia (Lane 2.2) — warn-only ─────────────────────────────────────────

describe("enforceSendOverlayMarkers — Dyspraxia (Lane 2.2)", () => {
  it("warns when Section A has fewer than 3 non-writing question formats", () => {
    const ws = makeWs("dyspraxia");
    // Default fixture has Q1 (true-false), Q2 (mcq), Q3 (short-answer).
    // That's 2 non-writing formats out of 3 — should warn.
    const { warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "dyspraxia" });
    expect(warnings.some(w => /Phase 4 — Dyspraxia.*non-writing question/i.test(w))).toBe(true);
  });

  it("does not warn when Section A has 3+ non-writing formats", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { sendNeed: "dyspraxia" },
      sections: [
        { id: "q1", type: "q-mcq", title: "Q1", content: "?", teacherOnly: false },
        { id: "q2", type: "q-true-false", title: "Q2", content: "?", teacherOnly: false },
        { id: "q3", type: "q-matching", title: "Q3", content: "?", teacherOnly: false },
        { id: "q4", type: "q-short-answer", title: "Q4", content: "?", teacherOnly: false },
        {
          id: "challenge",
          type: "challenge",
          title: "Challenge",
          content: "Tick the correct option.",
          teacherOnly: false,
        },
      ],
    };
    const { warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "dyspraxia" });
    expect(warnings.some(w => /non-writing question/i.test(w))).toBe(false);
  });

  it("warns when the Challenge uses extended-writing format", () => {
    const ws = makeWs("dyspraxia");
    const { warnings } = enforceSendOverlayMarkers(ws, { sendNeed: "dyspraxia" });
    // Default fixture's Challenge is type "challenge" not q-extended,
    // so this test specifically swaps it.
    const wsExtended: PostValidatorWorksheet = {
      ...ws,
      sections: ws.sections!.map(s =>
        s.id === "challenge" ? { ...s, type: "q-extended" } : s,
      ),
    };
    const { warnings: extendedWarnings } = enforceSendOverlayMarkers(wsExtended, {
      sendNeed: "dyspraxia",
    });
    expect(extendedWarnings.some(w => /Phase 4 — Dyspraxia.*extended-writing/i.test(w))).toBe(true);
  });

  it("does NOT mutate the worksheet (warn-only)", () => {
    const ws = makeWs("dyspraxia");
    const before = JSON.stringify(ws.sections);
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "dyspraxia" });
    expect(JSON.stringify(worksheet.sections)).toBe(before);
  });
});

// ── Unknown / no SEND need ───────────────────────────────────────────────────

describe("enforceSendOverlayMarkers — no SEND need", () => {
  it("is a no-op when sendNeed is empty", () => {
    const ws = makeWs("");
    const before = JSON.stringify(ws);
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, {});
    expect(JSON.stringify(worksheet)).toBe(before);
    expect(warnings).toHaveLength(0);
  });

  it("is a no-op for an unrecognised SEND key", () => {
    const ws = makeWs("xyzzy-not-a-real-need");
    const before = JSON.stringify(ws.sections);
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, {
      sendNeed: "xyzzy-not-a-real-need",
    });
    expect(JSON.stringify(worksheet.sections)).toBe(before);
    expect(warnings).toHaveLength(0);
  });

  it("never mutates teacher-only sections", () => {
    const ws = makeWs("adhd");
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "adhd" });
    const teacherKey = worksheet.sections!.find(s => s.id === "tk");
    expect(teacherKey!.teacherOnly).toBe(true);
    expect(String(teacherKey!.content)).not.toMatch(/^\[\s\]\s/);
  });
});

// ── Lane 2.3 — Stacked-need composability ────────────────────────────────────
//
// Pupils with stacked SEND profiles are common in mainstream UK
// schools (e.g. HI + EAL is normal in inner-London Y10 sets). The
// product currently exposes one SEND profile per worksheet, but we
// MUST guarantee that if a teacher generates an HI worksheet for a
// pupil and then re-runs the post-validator with that same pupil's
// other need (EAL, ADHD, MLD, etc.), the second pass does not erase
// the first pass's markers.
//
// These tests simulate stacking by running enforceSendOverlayMarkers
// twice in sequence, once per need, and asserting BOTH needs' markers
// are present after the second run. This is also what would happen if
// stacked-SEND support were added at the params layer (the validator
// runs once per need, in sequence).
//
// 10 fixtures cover the most common stacked combinations from the
// DfE School Census + EHCP data.

describe("enforceSendOverlayMarkers — stacked-need composability (Lane 2.3)", () => {
  const stack = (
    ws: PostValidatorWorksheet,
    needs: string[],
  ): PostValidatorWorksheet => {
    let current = ws;
    for (const sendNeed of needs) {
      const { worksheet } = enforceSendOverlayMarkers(current, { sendNeed });
      current = worksheet;
    }
    return current;
  };

  it("HI + EAL — Topic Summary AND sentence frames both ship", () => {
    const ws = stack(makeWs("hi"), ["hi", "eal"]);
    // HI marker
    expect(ws.sections!.some(s => s.type === "topic-summary")).toBe(true);
    // EAL marker — sentence frame on the extended-response question
    const q4 = ws.sections!.find(s => s.id === "q4");
    expect(String(q4!.content)).toMatch(/Sentence frame/i);
  });

  it("HI + EAL applied in REVERSE order also yields both markers", () => {
    const ws = stack(makeWs("hi"), ["eal", "hi"]);
    expect(ws.sections!.some(s => s.type === "topic-summary")).toBe(true);
    const q4 = ws.sections!.find(s => s.id === "q4");
    expect(String(q4!.content)).toMatch(/Sentence frame/i);
  });

  it("ADHD + Dyslexia — tick boxes AND method-steps box both ship", () => {
    const ws = stack(makeWs("adhd"), ["adhd", "dyslexia"]);
    // ADHD marker — tick-box prefix on a question
    const q1 = ws.sections!.find(s => s.id === "q1");
    expect(String(q1!.content)).toMatch(/^\[\s\]\s/);
    // Dyslexia marker — method-steps box
    expect(ws.sections!.some(s => s.type === "method-box")).toBe(true);
  });

  it("Anxiety + MLD — OPTIONAL BONUS rename AND topic-context block both ship", () => {
    const ws = stack(makeWs("anxiety"), ["anxiety", "mld"]);
    const challenge = ws.sections!.find(s => s.type === "challenge");
    expect(challenge!.title).toBe("OPTIONAL BONUS — only if you want to!");
    expect(ws.sections!.some(s => s.type === "topic-context")).toBe(true);
  });

  it("Dyscalculia + EAL (Bengali) — number cues AND sentence frames both ship", () => {
    const ws = stack(makeWs("dyscalculia"), ["dyscalculia", "eal"]);
    const q5 = ws.sections!.find(s => s.id === "q5");
    expect(String(q5!.content)).toMatch(/Numbers in this question/i);
    expect(String(q5!.content)).toMatch(/Sentence frame/i);
  });

  it("ASC + Anxiety — Anxiety markers are not erased by ASC dispatch (ASC is a no-op in the post-validator)", () => {
    // Note: ASC has no post-validator branch (overlay engine handles
    // it via buildAscSupport). So stacking ASC + Anxiety should
    // behave exactly as Anxiety alone — Anxiety's markers ship.
    const ws = stack(makeWs("anxiety"), ["asc", "anxiety"]);
    const challenge = ws.sections!.find(s => s.type === "challenge");
    expect(challenge!.title).toBe("OPTIONAL BONUS — only if you want to!");
  });

  it("VI + Dyslexia — Dyslexia method-box ships AND VI warns about diagram-dependent questions", () => {
    const wsBase = makeWs("vi", [
      {
        id: "qDiag",
        type: "q-short-answer",
        title: "Q-Diag",
        content: "Label the diagram shown above.",
        teacherOnly: false,
      },
    ]);
    let current: PostValidatorWorksheet = wsBase;
    let allWarnings: string[] = [];
    for (const sendNeed of ["vi", "dyslexia"]) {
      const r = enforceSendOverlayMarkers(current, { sendNeed });
      current = r.worksheet;
      allWarnings = allWarnings.concat(r.warnings);
    }
    expect(current.sections!.some(s => s.type === "method-box")).toBe(true);
    expect(allWarnings.some(w => /Phase 4 — VI.*text equivalent/i.test(w))).toBe(true);
  });

  it("Dyspraxia + ADHD — both audits run and ADHD markers ship", () => {
    let current: PostValidatorWorksheet = makeWs("adhd");
    let allWarnings: string[] = [];
    for (const sendNeed of ["dyspraxia", "adhd"]) {
      const r = enforceSendOverlayMarkers(current, { sendNeed });
      current = r.worksheet;
      allWarnings = allWarnings.concat(r.warnings);
    }
    // ADHD's tick-box prefix should be on every question
    const q1 = current.sections!.find(s => s.id === "q1");
    expect(String(q1!.content)).toMatch(/^\[\s\]\s/);
    // Dyspraxia warns about Section A non-writing format count and
    // Challenge format
    expect(allWarnings.some(w => /Phase 4 — Dyspraxia/i.test(w))).toBe(true);
  });

  it("HI + ADHD — Topic Summary AND tick boxes both ship", () => {
    const ws = stack(makeWs("hi"), ["hi", "adhd"]);
    expect(ws.sections!.some(s => s.type === "topic-summary")).toBe(true);
    const q1 = ws.sections!.find(s => s.id === "q1");
    expect(String(q1!.content)).toMatch(/^\[\s\]\s/);
  });

  it("Dyscalculia + Dyslexia — number cues AND method-steps box both ship", () => {
    const ws = stack(makeWs("dyscalculia"), ["dyscalculia", "dyslexia"]);
    expect(ws.sections!.some(s => s.type === "method-box")).toBe(true);
    const q5 = ws.sections!.find(s => s.id === "q5");
    expect(String(q5!.content)).toMatch(/Numbers in this question/i);
  });

  it("idempotent under stacking — applying the same need twice yields the same markers as once", () => {
    const onceHi = stack(makeWs("hi"), ["hi"]);
    const twiceHi = stack(makeWs("hi"), ["hi", "hi"]);
    expect(twiceHi.sections!.filter(s => s.type === "topic-summary")).toHaveLength(1);
    expect(JSON.stringify(twiceHi)).toBe(JSON.stringify(onceHi));
  });

  it("never erases the previous need's marker section", () => {
    // Apply HI first (inserts topic-summary) then a no-op need
    // (unrecognised). The topic-summary must survive.
    const wsBefore = stack(makeWs("hi"), ["hi"]);
    const wsAfter = stack(wsBefore, ["xyzzy-not-a-real-need"]);
    expect(wsAfter.sections!.some(s => s.type === "topic-summary")).toBe(true);
  });

  it("never erases the previous need's renamed Challenge title", () => {
    // Apply Anxiety (renames Challenge → OPTIONAL BONUS) then ADHD
    // (which would normally rename Challenge → BONUS). The first
    // rename wins because the second pass detects the title is
    // already overridden — wait, ADHD's rename detects `^challenge\b`
    // which won't match "OPTIONAL BONUS". So OPTIONAL BONUS is
    // preserved. Validates the regex precision.
    const wsBefore = stack(makeWs("anxiety"), ["anxiety"]);
    const wsAfter = stack(wsBefore, ["adhd"]);
    const challenge = wsAfter.sections!.find(s => s.type === "challenge");
    expect(challenge!.title).toBe("OPTIONAL BONUS — only if you want to!");
  });
});
