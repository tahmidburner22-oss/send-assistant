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
