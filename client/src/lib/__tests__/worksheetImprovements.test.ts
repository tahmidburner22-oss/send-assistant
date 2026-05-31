/**
 * Regression tests for the worksheet-generator audit fixes documented in
 * `audit/IMPROVEMENTS.md` (Sprint 1 quick wins + criticals):
 *
 *   IMP-01  TEACHER_DIAGNOSES leaking into student view
 *   IMP-02  Dyscalculia number-tracking cue corrupting question numbering
 *   IMP-03  Prompt "RULE:" instructions leaking into student view
 *   IMP-06  Mark allocations using [N marks] instead of (N marks)
 *
 * These mirror the "Test criterion" blocks in the improvements document so a
 * future regression is caught deterministically (no live site required).
 */
import { describe, it, expect } from "vitest";
import {
  enforceMarksBracketStyle,
  extractMisconceptionLinks,
  stripLeakedGeneratorInstructions,
  enforceSendOverlayMarkers,
  enforceApplicationQuestionCap,
  runWorksheetPostValidators,
  type PostValidatorWorksheet,
} from "../worksheetPostValidator";
import { isAnxietySendProfile, toInvitationalSectionLabel } from "../sendSectionLabels";

function ws(sections: any[], metadata: Record<string, unknown> = {}): PostValidatorWorksheet {
  return { sections, metadata } as PostValidatorWorksheet;
}

// ── IMP-06 — round-bracket mark style ────────────────────────────────────────
describe("IMP-06 — enforceMarksBracketStyle", () => {
  it("converts [N marks] / [N mark] to (N marks) / (N mark)", () => {
    const r = enforceMarksBracketStyle(
      ws([
        { type: "q-short-answer", title: "Q1", content: "State the formula for glucose. [2 marks]" },
        { type: "q-extended", title: "Q2", content: "Evaluate the impact. [6 marks]\nName one product. [1 mark]" },
      ]),
    );
    const text = r.worksheet.sections!.map((s) => s.content).join("\n");
    expect(text).not.toMatch(/\[\d+\s*marks?\]/i);
    expect(text).toContain("(2 marks)");
    expect(text).toContain("(6 marks)");
    expect(text).toContain("(1 mark)");
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("is idempotent and leaves existing round brackets untouched", () => {
    const input = ws([{ type: "q-short-answer", content: "Describe photosynthesis. (4 marks)" }]);
    const once = enforceMarksBracketStyle(input);
    expect(once.worksheet.sections![0].content).toContain("(4 marks)");
    expect(once.warnings.length).toBe(0); // nothing to convert
    const twice = enforceMarksBracketStyle(once.worksheet);
    expect(twice.worksheet.sections![0].content).toBe(once.worksheet.sections![0].content);
  });

  it("normalises marks inside MCQ option arrays and question objects too", () => {
    const r = enforceMarksBracketStyle(
      ws([
        {
          type: "q-mcq",
          questions: [{ text: "Which is correct? [2 marks]", options: ["A [1 mark]", "B"] }],
        },
      ]),
    );
    const q = (r.worksheet.sections![0] as any).questions[0];
    expect(q.text).toContain("(2 marks)");
    expect(q.options[0]).toBe("A (1 mark)");
  });
});

// ── IMP-01 — TEACHER_DIAGNOSES stripping ─────────────────────────────────────
describe("IMP-01 — extractMisconceptionLinks strips TEACHER_DIAGNOSES", () => {
  it("removes a real-newline marker and parses a science (s-) misconception id", () => {
    const r = extractMisconceptionLinks(
      ws([
        {
          type: "q-mcq",
          title: "Q7",
          content: "Which shows the atom?\nA outside ✓\nB inside\nTEACHER_DIAGNOSES: A=s-mass-01",
        },
      ]),
    );
    expect(String(r.worksheet.sections![0].content)).not.toContain("TEACHER_DIAGNOSES");
    const links = (r.worksheet.metadata as any).misconceptionLinks;
    expect(links).toEqual([
      expect.objectContaining({ distractor: "A", misconceptionId: "s-mass-01" }),
    ]);
  });

  it("removes a marker that sits mid-line because the AI emitted a literal \\n escape", () => {
    // The whole MCQ collapsed onto one physical line via literal "\n" escapes.
    const leaked = "Which is the unit?\\nA Amperes\\nC Ohms ✓\\nTEACHER_DIAGNOSES: A=s-unit-01, B=s-unit-01\\nNext part";
    const r = extractMisconceptionLinks(ws([{ type: "q-mcq", content: leaked }]));
    const out = String(r.worksheet.sections![0].content);
    expect(out).not.toContain("TEACHER_DIAGNOSES");
    expect(out).toContain("Next part"); // surrounding content preserved
    const links = (r.worksheet.metadata as any).misconceptionLinks;
    expect(links.map((l: any) => l.misconceptionId)).toContain("s-unit-01");
  });

  it("is idempotent", () => {
    const input = ws([{ type: "q-mcq", content: "Q\nA ✓\nTEACHER_DIAGNOSES: A=m-frac-02" }]);
    const once = extractMisconceptionLinks(input);
    const twice = extractMisconceptionLinks(once.worksheet);
    expect(twice.worksheet.sections![0].content).toBe(once.worksheet.sections![0].content);
    expect((twice.worksheet.metadata as any).misconceptionLinks.length).toBe(1);
  });
});

// ── IMP-03 — RULE: prompt-instruction leak ───────────────────────────────────
describe("IMP-03 — stripLeakedGeneratorInstructions strips RULE: leaks", () => {
  it("strips a RULE: line that leaks at the start of a real line", () => {
    const r = stripLeakedGeneratorInstructions(
      ws([
        {
          type: "q-gap-fill",
          content: "Complete the paragraph.\nWORD BANK: cell | oxygen | ATP\nRULE: EXACTLY 7 sentences, EXACTLY 7 blanks.",
        },
      ]),
    );
    const out = String(r.worksheet.sections![0].content);
    expect(out).not.toMatch(/RULE:/i);
    expect(out).toContain("WORD BANK"); // legitimate content preserved
  });

  it("strips a mid-line RULE: leak caused by literal \\n escapes without eating the next sentence", () => {
    const leaked =
      "Complete the paragraph.\\nWORD BANK: cell | oxygen | ATP\\nRULE: EXACTLY 7 sentences, EXACTLY 7 blanks.\\nThis sentence must survive.";
    const r = stripLeakedGeneratorInstructions(ws([{ type: "q-gap-fill", content: leaked }]));
    const out = String(r.worksheet.sections![0].content);
    expect(out).not.toMatch(/RULE:\s*EXACTLY/i);
    expect(out).toContain("This sentence must survive.");
  });
});

// ── IMP-02 — dyscalculia cue must not corrupt numbering ──────────────────────
describe("IMP-02 — dyscalculia 'Numbers in this question' cue is preprocessor-safe", () => {
  const calcSheet = () =>
    ws([
      {
        type: "q-short-answer",
        title: "Q5",
        content: "A pupil's heart rate rises from 70 bpm to 140 bpm during exercise. Calculate the percentage increase. (3 marks)",
      },
    ]);

  it("appends a cue that keeps the 'Numbers in this question' phrase and the digits", () => {
    const r = enforceSendOverlayMarkers(calcSheet(), { sendNeed: "dyscalculia" });
    const out = String(r.worksheet.sections![0].content);
    expect(out).toMatch(/Numbers in this question/i);
    expect(out).toContain("70");
    expect(out).toContain("140");
  });

  it("never places a bare number immediately after a split delimiter (the renderer numbering trigger)", () => {
    const r = enforceSendOverlayMarkers(calcSheet(), { sendNeed: "dyscalculia" });
    // Isolate just the appended cue line.
    const cue = String(r.worksheet.sections![0].content)
      .split("\n")
      .find((l) => /Numbers in this question/i.test(l))!;
    // The renderer's numbered-question pre-processor splits on these patterns;
    // the cue must contain none of them or it spawns a spurious "N." item.
    expect(cue).not.toMatch(/:\s+\d/); // colon + number
    expect(cue).not.toMatch(/,\s*\d/); // comma + number
    expect(cue).not.toMatch(/\.\s+\d/); // period + number
    expect(cue).not.toMatch(/;\s*\d/); // semicolon + number
    // Numbers are wrapped in quotes so they sit between non-delimiter chars.
    expect(cue).toMatch(/'70'/);
  });

  it("does not change the section count and is idempotent", () => {
    const before = calcSheet();
    const once = enforceSendOverlayMarkers(before, { sendNeed: "dyscalculia" });
    expect(once.worksheet.sections!.length).toBe(before.sections!.length);
    const twice = enforceSendOverlayMarkers(once.worksheet, { sendNeed: "dyscalculia" });
    expect(twice.worksheet.sections![0].content).toBe(once.worksheet.sections![0].content);
  });
});


// ── IMP-04 — Section 3 (application) must be exactly 5 ───────────────────────
describe("IMP-04 — enforceApplicationQuestionCap trims Section 3 to 5", () => {
  function buildSheet(applicationCount: number): PostValidatorWorksheet {
    const sections: any[] = [];
    // Recall 7 (Q1–Q7), Understanding 7 (Q8–Q14) so the application range
    // (Q15+) is correctly inferred.
    for (let i = 1; i <= 14; i++) {
      sections.push({ type: "q-short-answer", title: `Q${i}`, content: `Body ${i}. (2 marks)`, questionNumber: i });
    }
    for (let i = 0; i < applicationCount; i++) {
      const qn = 15 + i;
      sections.push({ type: "q-extended", title: `Q${qn}`, content: `Exam question ${qn}. (4 marks)`, questionNumber: qn });
    }
    sections.push({ type: "challenge", title: "Challenge", content: "Stretch. (6 marks)" });
    return { sections } as PostValidatorWorksheet;
  }

  it("removes the excess (6th) application question so exactly 5 remain", () => {
    const r = enforceApplicationQuestionCap(buildSheet(6));
    const appQs = (r.worksheet.sections || []).filter(
      (s) => String(s.type) === "q-extended",
    );
    expect(appQs.length).toBe(5);
    // The highest-numbered (Q20) is the one dropped.
    expect(appQs.map((s) => (s as any).questionNumber)).toEqual([15, 16, 17, 18, 19]);
    expect(r.warnings.join(" ")).toMatch(/Trimmed 1 excess Section 3/);
    // Challenge is never touched.
    expect((r.worksheet.sections || []).some((s) => String(s.type) === "challenge")).toBe(true);
  });

  it("is a no-op when Section 3 already has 5 (or fewer) questions", () => {
    const five = buildSheet(5);
    const r = enforceApplicationQuestionCap(five);
    expect(r.worksheet.sections!.length).toBe(five.sections!.length);
    expect(r.warnings.length).toBe(0);
  });

  it("is idempotent", () => {
    const once = enforceApplicationQuestionCap(buildSheet(7));
    const twice = enforceApplicationQuestionCap(once.worksheet);
    expect(twice.worksheet.sections!.length).toBe(once.worksheet.sections!.length);
    expect(twice.warnings.length).toBe(0);
  });
});


// ── IMP-17 — fixes must survive the full validator chain ─────────────────────
describe("IMP-17 — fixes propagate through runWorksheetPostValidators", () => {
  it("strips TEACHER_DIAGNOSES + RULE: leaks and round-brackets marks end-to-end", () => {
    const ws0: PostValidatorWorksheet = {
      metadata: { subject: "Science", topic: "Atomic Structure", yearGroup: "Year 10" },
      sections: [
        {
          type: "q-mcq",
          title: "Q7",
          content:
            "Which shows the correct parts of an atom? [2 marks]\nA Protons outside\nB Protons and neutrons in the nucleus ✓\nTEACHER_DIAGNOSES: A=s-mass-01",
        },
        {
          type: "q-gap-fill",
          title: "Q3",
          content:
            "Complete the paragraph.\nWORD BANK: atom | shells | atomic\nRULE: EXACTLY 7 sentences, EXACTLY 7 blanks, EXACTLY 10 words in word bank.",
        },
      ],
    };
    const out = runWorksheetPostValidators(ws0, { subject: "Science", topic: "Atomic Structure", yearGroup: "Year 10" });
    const allContent = (out.worksheet.sections || []).map((s) => String(s.content)).join("\n");
    expect(allContent).not.toContain("TEACHER_DIAGNOSES");
    expect(allContent).not.toMatch(/RULE:\s*EXACTLY/i);
    expect(allContent).not.toMatch(/\[\d+\s*marks?\]/i); // square brackets gone
    expect(allContent).toContain("(2 marks)"); // round brackets present
  });
});


// ════════════════════════════════════════════════════════════════════════════
// Sprint 2 — SEND overlay fixes (IMP-10 through IMP-16)
// ════════════════════════════════════════════════════════════════════════════

// ── IMP-10 — Anxiety invitational section labels ─────────────────────────────
describe("IMP-10 — anxiety invitational section labels", () => {
  it("detects anxiety / SEMH profiles and ignores others", () => {
    expect(isAnxietySendProfile("anxiety")).toBe(true);
    expect(isAnxietySendProfile("Anxiety")).toBe(true);
    expect(isAnxietySendProfile("semh")).toBe(true);
    expect(isAnxietySendProfile("mental-health")).toBe(true);
    expect(isAnxietySendProfile("adhd")).toBe(false);
    expect(isAnxietySendProfile(null)).toBe(false);
  });

  it("remaps Section 1 → WARM-UP and Challenge → OPTIONAL BONUS", () => {
    expect(toInvitationalSectionLabel("SECTION 1 — RECALL")).toContain("WARM-UP");
    expect(toInvitationalSectionLabel("SECTION 2 — UNDERSTANDING")).toContain("BUILDING YOUR UNDERSTANDING");
    expect(toInvitationalSectionLabel("SECTION 3 — APPLICATION & ANALYSIS")).toContain("STRETCH YOURSELF");
    expect(toInvitationalSectionLabel("CHALLENGE QUESTION")).toMatch(/OPTIONAL/);
  });

  it("leaves unknown labels unchanged", () => {
    expect(toInvitationalSectionLabel("TEACHER NOTES")).toBe("TEACHER NOTES");
  });
});

// Shared HI fixture: Learning Objective + Key Vocabulary + questions using the terms.
function hiSheet(): PostValidatorWorksheet {
  return ws([
    { id: "lo", type: "objective", title: "Learning objective", content: "Describe aerobic respiration." },
    {
      id: "vocab",
      type: "key-vocabulary",
      title: "Key Vocabulary",
      content:
        "aerobic respiration — using oxygen to release energy from glucose\nanaerobic respiration — releasing energy without oxygen\nATP — the energy-carrying molecule",
    },
    { id: "q1", type: "q-short-answer", title: "Q1", content: "State one product of aerobic respiration. (2 marks)" },
    { id: "q2", type: "q-extended", title: "Q2", content: "Explain how aerobic respiration releases energy using ATP. (4 marks)" },
    { id: "q3", type: "q-mcq", title: "Q3", content: "Which process is anaerobic respiration? (1 mark)\nA Uses oxygen\nB No oxygen" },
  ]);
}

// ── IMP-16 — HI TOPIC SUMMARY heading ────────────────────────────────────────
describe("IMP-16 — HI 'TOPIC SUMMARY' heading", () => {
  it("synthesises a topic-summary whose title contains the literal 'TOPIC SUMMARY'", () => {
    const r = enforceSendOverlayMarkers(hiSheet(), { sendNeed: "hi", topic: "Respiration" });
    const summary = r.worksheet.sections!.find((s) => s.type === "topic-summary");
    expect(summary).toBeDefined();
    expect(String(summary!.title)).toContain("TOPIC SUMMARY");
  });

  it("normalises a pre-existing topic-summary title to include 'TOPIC SUMMARY'", () => {
    const sheet = ws([
      { id: "ts", type: "topic-summary", title: "Topic: Respiration", content: "Some summary." },
      { id: "q1", type: "q-short-answer", title: "Q1", content: "State X. (2 marks)" },
    ]);
    const r = enforceSendOverlayMarkers(sheet, { sendNeed: "hi" });
    const summary = r.worksheet.sections!.find((s) => s.type === "topic-summary");
    expect(r.worksheet.sections!.filter((s) => s.type === "topic-summary")).toHaveLength(1);
    expect(String(summary!.title)).toContain("TOPIC SUMMARY");
  });
});

// ── IMP-11 — HI inline (= definition) annotations ────────────────────────────
describe("IMP-11 — HI inline definitions", () => {
  it("annotates the first use of a key term with (= definition)", () => {
    const r = enforceSendOverlayMarkers(hiSheet(), { sendNeed: "hi" });
    const qText = r.worksheet
      .sections!.filter((s) => String(s.type).startsWith("q-"))
      .map((s) => String(s.content))
      .join("\n");
    expect(qText).toMatch(/aerobic respiration \(= [^)]+\)/i);
    expect((qText.match(/\(= [^)]+\)/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it("does not double-annotate the same term in a question", () => {
    const r = enforceSendOverlayMarkers(hiSheet(), { sendNeed: "hi" });
    const q2 = r.worksheet.sections!.find((s) => s.id === "q2");
    // "ATP" appears once in q2 and should be annotated at most once.
    expect((String(q2!.content).match(/ATP \(=/g) || []).length).toBeLessThanOrEqual(1);
  });

  it("is idempotent", () => {
    const r1 = enforceSendOverlayMarkers(hiSheet(), { sendNeed: "hi" });
    const r2 = enforceSendOverlayMarkers(r1.worksheet, { sendNeed: "hi" });
    expect(JSON.stringify(r2.worksheet)).toBe(JSON.stringify(r1.worksheet));
  });
});

// ── IMP-12 — ADHD brain-break scaling ────────────────────────────────────────
describe("IMP-12 — ADHD brain-break scaling", () => {
  const sheetWithQuestions = (n: number) =>
    ws(
      Array.from({ length: n }, (_, i) => ({
        id: `q${i + 1}`,
        type: "q-short-answer",
        title: `Q${i + 1}`,
        content: `Question ${i + 1}: state a fact. (2 marks)`,
      })),
    );
  const countBreaks = (w: PostValidatorWorksheet) =>
    (w.sections || []).filter((s) => typeof s.content === "string" && /brain\s*break/i.test(s.content)).length;

  it("inserts 3 spaced brain breaks for a 16-question sheet", () => {
    const r = enforceSendOverlayMarkers(sheetWithQuestions(16), { sendNeed: "adhd" });
    expect(countBreaks(r.worksheet)).toBe(3);
  });

  it("inserts 2 brain breaks for a 12-question sheet", () => {
    const r = enforceSendOverlayMarkers(sheetWithQuestions(12), { sendNeed: "adhd" });
    expect(countBreaks(r.worksheet)).toBe(2);
  });

  it("inserts a single brain break for a short 6-question sheet", () => {
    const r = enforceSendOverlayMarkers(sheetWithQuestions(6), { sendNeed: "adhd" });
    expect(countBreaks(r.worksheet)).toBe(1);
  });

  it("is idempotent (does not keep adding breaks)", () => {
    const r1 = enforceSendOverlayMarkers(sheetWithQuestions(16), { sendNeed: "adhd" });
    const r2 = enforceSendOverlayMarkers(r1.worksheet, { sendNeed: "adhd" });
    expect(countBreaks(r2.worksheet)).toBe(3);
  });
});

// ── IMP-13 — Dyscalculia 5-step recipe on science calculation questions ──────
describe("IMP-13 — dyscalculia 5-step calculation recipe", () => {
  const sheet = () =>
    ws([
      {
        id: "calc",
        type: "q-extended",
        title: "Q1",
        content: "Calculate the number of neutrons in an atom with mass number 23 and atomic number 11. (3 marks)",
      },
      { id: "prose", type: "q-extended", title: "Q2", content: "Explain why metals conduct electricity. (4 marks)" },
    ]);

  it("adds the 5-step recipe to a calculation question but NOT a prose question", () => {
    const r = enforceSendOverlayMarkers(sheet(), { sendNeed: "dyscalculia", subject: "Science" });
    const calc = r.worksheet.sections!.find((s) => s.id === "calc");
    const prose = r.worksheet.sections!.find((s) => s.id === "prose");
    expect(String(calc!.content)).toContain("Step 1");
    expect(String(calc!.content)).toContain("Calculation steps to follow");
    expect(String(prose!.content)).not.toContain("Step 1");
  });

  it("is idempotent", () => {
    const r1 = enforceSendOverlayMarkers(sheet(), { sendNeed: "dyscalculia", subject: "Science" });
    const r2 = enforceSendOverlayMarkers(r1.worksheet, { sendNeed: "dyscalculia", subject: "Science" });
    expect(JSON.stringify(r2.worksheet)).toBe(JSON.stringify(r1.worksheet));
  });
});

// ── IMP-14 — MLD formula HELP BOX on calculation questions ───────────────────
describe("IMP-14 — MLD formula HELP BOX", () => {
  const sheet = () =>
    ws([
      { id: "lo", type: "objective", title: "Learning objective", content: "Work with atoms." },
      {
        id: "calc",
        type: "q-extended",
        title: "Q1",
        content: "Calculate the number of neutrons (mass number 23, atomic number 11). (3 marks)",
      },
      { id: "prose", type: "q-short-answer", title: "Q2", content: "Name the parts of an atom. (2 marks)" },
    ]);

  it("adds a HELP BOX to calculation questions only", () => {
    const r = enforceSendOverlayMarkers(sheet(), { sendNeed: "mld", topic: "Atomic Structure" });
    const calc = r.worksheet.sections!.find((s) => s.id === "calc");
    const prose = r.worksheet.sections!.find((s) => s.id === "prose");
    expect(String(calc!.content)).toMatch(/HELP BOX/);
    expect(String(prose!.content)).not.toMatch(/HELP BOX/);
  });

  it("is idempotent", () => {
    const r1 = enforceSendOverlayMarkers(sheet(), { sendNeed: "mld", topic: "Atomic Structure" });
    const r2 = enforceSendOverlayMarkers(r1.worksheet, { sendNeed: "mld", topic: "Atomic Structure" });
    expect(JSON.stringify(r2.worksheet)).toBe(JSON.stringify(r1.worksheet));
  });
});


// ── IMP-15 — EAL support (sentence frames + command-word decoder) ────────────
describe("IMP-15 — EAL support", () => {
  const ealSheet = () =>
    ws([
      { id: "lo", type: "objective", title: "Learning objective", content: "Understand respiration." },
      { id: "q1", type: "q-extended", title: "Q1", content: "Explain why aerobic respiration releases more energy. (4 marks)" },
      { id: "q2", type: "q-short-answer", title: "Q2", content: "Compare aerobic and anaerobic respiration. (3 marks)" },
    ]);

  it("appends command-word-aware sentence frames to written questions", () => {
    const r = enforceSendOverlayMarkers(ealSheet(), { sendNeed: "eal" });
    const q1 = r.worksheet.sections!.find((s) => s.id === "q1");
    const q2 = r.worksheet.sections!.find((s) => s.id === "q2");
    expect(String(q1!.content)).toMatch(/Sentence frame:/);
    expect(String(q1!.content)).toMatch(/because/i); // "Explain" frame
    expect(String(q2!.content)).toMatch(/similar|different/i); // "Compare" frame
  });

  it("inserts a command-word decoder box before the first question", () => {
    const r = enforceSendOverlayMarkers(ealSheet(), { sendNeed: "eal" });
    const decoder = r.worksheet.sections!.find((s) => /command\s*word/i.test(String(s.title || "")));
    expect(decoder).toBeDefined();
    expect(String(decoder!.content)).toMatch(/Explain —/);
    expect(String(decoder!.content)).toMatch(/Compare —/);
    const decoderIdx = r.worksheet.sections!.findIndex((s) => /command\s*word/i.test(String(s.title || "")));
    const firstQIdx = r.worksheet.sections!.findIndex((s) => String(s.type).startsWith("q-"));
    expect(decoderIdx).toBeLessThan(firstQIdx);
  });

  it("is idempotent", () => {
    const r1 = enforceSendOverlayMarkers(ealSheet(), { sendNeed: "eal" });
    const r2 = enforceSendOverlayMarkers(r1.worksheet, { sendNeed: "eal" });
    expect(JSON.stringify(r2.worksheet)).toBe(JSON.stringify(r1.worksheet));
  });
});
