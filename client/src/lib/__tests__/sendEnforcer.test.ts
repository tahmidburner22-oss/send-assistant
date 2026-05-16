/**
 * sendEnforcer.test.ts
 *
 * Unit tests for the SEND adaptation enforcer that guarantees the
 * rules shown in the UI ("What will change in your worksheet") actually
 * appear in the generated output — even when the LLM skips them.
 */
import { describe, it, expect } from "vitest";
import { enforceSendAdaptations } from "../sendEnforcer";

const sampleWorksheet = {
  title: "Fractions Worksheet",
  sections: [
    { id: "h", type: "header", title: "Header", content: "Name:" },
    { id: "lo", type: "learning-objective", title: "Objective", content: "Add fractions." },
    {
      id: "a",
      type: "recall",
      title: "Section A",
      content: [
        "1. Calculate 1/2 + 1/4",
        "2. Calculate 1/3 + 1/6",
        "3. Calculate 2/5 + 1/5",
        "4. Calculate 3/7 + 2/7",
        "5. Calculate 1/8 + 1/8",
      ].join("\n"),
    },
    {
      id: "b",
      type: "understanding",
      title: "Section B",
      content: [
        "1. Solve 1/2 − 1/3",
        "2. Work out 2/3 − 1/6",
        "3. Find the difference between 3/4 and 1/8",
        "4. Calculate 5/6 − 1/3",
        "5. Calculate 7/8 − 1/4",
      ].join("\n"),
    },
    { id: "c", type: "challenge", title: "Challenge", content: "1. Work out 3/5 of 40 then add 1/4." },
    { id: "tk", type: "teacher-key", title: "Answer Key", content: "Q1: 3/4", teacherOnly: true },
  ],
};

describe("sendEnforcer — ADHD", () => {
  it("caps Section A to 3 questions", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd");
    const sectionA = result.worksheet.sections!.find(s => s.id === "a")!;
    const questionLines = String(sectionA.content).split("\n").filter(l => /^\s*(?:\[\s\]\s+)?\d/.test(l));
    expect(questionLines.length).toBe(3);
    expect(result.warnings.some(w => /capped/.test(w))).toBe(true);
  });

  it("prepends '[ ] ' to every question line in Section A", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd");
    const sectionA = result.worksheet.sections!.find(s => s.id === "a")!;
    const lines = String(sectionA.content).split("\n");
    for (const l of lines) {
      if (l.trim()) expect(l).toMatch(/^\s*\d+\.\s+\[\s\]\s+/);
    }
  });

  it("bolds the action verb at the start of every question", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd");
    const sectionA = result.worksheet.sections!.find(s => s.id === "a")!;
    expect(String(sectionA.content)).toMatch(/\*\*Calculate\*\*/);
  });

  it("inserts a BRAIN BREAK mid-way through Section B", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd");
    const sectionB = result.worksheet.sections!.find(s => s.id === "b")!;
    expect(String(sectionB.content)).toMatch(/BRAIN\s*BREAK/i);
  });

  it("is idempotent — running twice does not double-enforce", () => {
    const once = enforceSendAdaptations(sampleWorksheet, "adhd").worksheet;
    const twice = enforceSendAdaptations(once, "adhd").worksheet;
    expect(JSON.stringify(once.sections)).toBe(JSON.stringify(twice.sections));
  });

  it("does not touch teacherOnly sections", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd");
    const tk = result.worksheet.sections!.find(s => s.id === "tk")!;
    expect(tk.content).toBe("Q1: 3/4");
  });

  it("renames the challenge to BONUS", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd");
    const challenge = result.worksheet.sections!.find(s => s.id === "c")!;
    expect(String(challenge.title)).toMatch(/BONUS/);
  });
});

describe("sendEnforcer — dyslexia", () => {
  it("strips single-asterisk italics from question text", () => {
    const ws = {
      ...sampleWorksheet,
      sections: [
        ...sampleWorksheet.sections.slice(0, 2),
        { id: "a", type: "recall", title: "Section A", content: "1. Read *the passage* carefully" },
      ],
    };
    const result = enforceSendAdaptations(ws, "dyslexia");
    const a = result.worksheet.sections!.find(s => s.id === "a")!;
    expect(String(a.content)).not.toMatch(/\*the passage\*/);
    expect(String(a.content)).toMatch(/the passage/);
  });

  it("preserves double-asterisk bold", () => {
    const ws = {
      ...sampleWorksheet,
      sections: [
        { id: "a", type: "recall", title: "Section A", content: "1. **Read** carefully" },
      ],
    };
    const result = enforceSendAdaptations(ws, "dyslexia");
    const a = result.worksheet.sections!.find(s => s.id === "a")!;
    expect(String(a.content)).toMatch(/\*\*Read\*\*/);
  });
});

describe("sendEnforcer — no-op cases", () => {
  it("returns worksheet unchanged for 'none'", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "none");
    expect(result.enforcedFor).toBeNull();
    expect(result.worksheet).toBe(sampleWorksheet);
  });

  it("returns worksheet unchanged for unknown SEND key", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "not-a-real-need");
    expect(result.enforcedFor).toBeNull();
  });
});

// FEAT-PB5 — exam-style Y9+ stem-preserving SEND mode
describe("sendEnforcer — preserveStems (FEAT-PB5)", () => {
  it("does not prepend '[ ]' to question stems for ADHD when preserveStems=true", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd", { preserveStems: true });
    const sectionA = result.worksheet.sections!.find((s: any) => s.id === "a")!;
    expect(String(sectionA.content)).not.toMatch(/\[\s\]\s+Calculate/);
  });

  it("does not insert BRAIN BREAK in Section B when preserveStems=true", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd", { preserveStems: true });
    const sectionB = result.worksheet.sections!.find((s: any) => s.id === "b")!;
    expect(String(sectionB.content)).not.toMatch(/BRAIN\s*BREAK/i);
  });

  it("does not bold action verbs when preserveStems=true", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd", { preserveStems: true });
    const sectionA = result.worksheet.sections!.find((s: any) => s.id === "a")!;
    expect(String(sectionA.content)).not.toMatch(/\*\*Calculate\*\*/);
  });

  it("still renames the challenge to BONUS when preserveStems=true (title-only is allowed)", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd", { preserveStems: true });
    const challenge = result.worksheet.sections!.find((s: any) => s.id === "c")!;
    expect(String(challenge.title)).toMatch(/BONUS/);
  });

  it("does not strip dyslexia italics from question stems when preserveStems=true", () => {
    const ws = {
      ...sampleWorksheet,
      sections: [
        ...sampleWorksheet.sections.slice(0, 2),
        { id: "a", type: "recall", title: "Section A", content: "1. Read *the passage* carefully" },
      ],
    };
    const result = enforceSendAdaptations(ws, "dyslexia", { preserveStems: true });
    const a = result.worksheet.sections!.find((s: any) => s.id === "a")!;
    expect(String(a.content)).toMatch(/\*the passage\*/);
  });

  it("records preserveStems on metadata", () => {
    const result = enforceSendAdaptations(sampleWorksheet, "adhd", { preserveStems: true });
    expect((result.worksheet.metadata as any)?.sendEnforcerPreserveStems).toBe(true);
    expect(result.preserveStems).toBe(true);
  });

  it("preserves the SHA of question content under preserveStems=true (no rewrites)", () => {
    const ws = {
      ...sampleWorksheet,
      sections: sampleWorksheet.sections.map((s) => ({ ...s })),
    };
    const before = ws.sections.find((s: any) => s.id === "a")!.content;
    const result = enforceSendAdaptations(ws, "adhd", { preserveStems: true });
    const after = result.worksheet.sections!.find((s: any) => s.id === "a")!.content;
    expect(after).toBe(before);
  });
});
