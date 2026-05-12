/**
 * worksheetScrutiny.test.ts
 *
 * Covers the worksheet-scrutiny improvements that teachers asked for after
 * reviewing live generated worksheets. These tests lock in the behaviour
 * without relying on the LLM, by exercising the deterministic pieces:
 *
 *  - resolveSendSpec maps the autism sub-profile ids to the right rules
 *  - getSendNoteForWorksheet reflects the chosen profile's rules
 *  - the shared asc rules describe one-box-per-section (not per-question)
 *  - worksheetPostValidator:
 *      - enforceSingleMcqCorrect removes duplicate ✓ ticks
 *      - dedupeWordBank removes duplicates and caps at 10
 *      - stripForeignDiagrams removes computing diagrams on science sheets
 *      - enforceYearGroupLock rewrites stray year references
 *      - capWorkedExampleSteps keeps only the first N steps
 *  - overlayEngine.applyOverlays inserts one 'What you need to do' box per
 *    section (not per question) for ASC
 */

import { describe, it, expect } from "vitest";

import {
  resolveSendSpec,
  getSendNoteForWorksheet,
} from "../../client/src/lib/sendPromptFragments";

import {
  enforceSingleMcqCorrect,
  dedupeWordBank,
  stripForeignDiagrams,
  stripEmptyDiagramPlaceholders,
  enforceYearGroupLock,
  capWorkedExampleSteps,
  stripLeakedGeneratorInstructions,
  reinforceDyscalculiaMathsScaffolding,
  runWorksheetPostValidators,
  type PostValidatorWorksheet,
} from "../../client/src/lib/worksheetPostValidator";

import { applyOverlays } from "../lib/overlayEngine";

// ─── SEND / autism sub-profiles ──────────────────────────────────────────────

describe("resolveSendSpec — autism sub-profiles", () => {
  it("resolves the social-communication profile to asc-social", () => {
    const spec = resolveSendSpec("asc-social");
    expect(spec).not.toBeNull();
    expect(spec!.id).toBe("asc-social");
    expect(spec!.worksheetRules.join(" ")).toMatch(/literal/i);
  });

  it("resolves the compound form 'asc:asc-demand-avoidant' to the demand-avoidant profile", () => {
    const spec = resolveSendSpec("asc:asc-demand-avoidant");
    expect(spec).not.toBeNull();
    expect(spec!.id).toBe("asc-demand-avoidant");
    // Demand-avoidant rules should use invitational language
    const rules = spec!.worksheetRules.join(" ").toLowerCase();
    expect(rules).toMatch(/might like to|have a go at/);
  });

  it("resolves asc-sensory to the sensory-dominant profile", () => {
    const spec = resolveSendSpec("asc-sensory");
    expect(spec).not.toBeNull();
    expect(spec!.id).toBe("asc-sensory");
    expect(spec!.worksheetRules.join(" ").toLowerCase()).toMatch(/muted|whitespace|no icons|no emojis/);
  });

  it("resolves asc-rigid to the rigid-thinking profile", () => {
    const spec = resolveSendSpec("asc-rigid");
    expect(spec).not.toBeNull();
    expect(spec!.id).toBe("asc-rigid");
    expect(spec!.worksheetRules.join(" ").toLowerCase()).toMatch(/identical|mirrors?/);
  });

  it("falls back to generic asc when no sub-profile is given", () => {
    const spec = resolveSendSpec("asc");
    expect(spec).not.toBeNull();
    expect(spec!.id).toBe("asc");
  });

  it("treats 'autism' as generic asc (the legacy label)", () => {
    const spec = resolveSendSpec("autism");
    expect(spec).not.toBeNull();
    expect(spec!.id).toBe("asc");
  });

  it("each autism sub-profile produces DIFFERENT worksheet rules from the others", () => {
    const ids = ["asc-social", "asc-demand-avoidant", "asc-sensory", "asc-rigid"];
    const rulesByProfile = ids.map(id => (resolveSendSpec(id)!.worksheetRules || []).join(" "));
    const unique = new Set(rulesByProfile);
    // The profiles must actually differ — otherwise the sub-profiles are
    // cosmetic and do not produce different worksheets.
    expect(unique.size).toBe(ids.length);
  });
});

describe("getSendNoteForWorksheet", () => {
  it("includes the profile name in the injected prompt note", () => {
    const note = getSendNoteForWorksheet("asc-demand-avoidant");
    expect(note).toMatch(/DEMAND-AVOIDANT/i);
    // And pulls through at least one profile-specific rule
    expect(note.toLowerCase()).toMatch(/might like to|have a go at|secret mission/);
  });

  it("returns an empty string when no SEND need is supplied", () => {
    expect(getSendNoteForWorksheet(undefined)).toBe("");
    expect(getSendNoteForWorksheet(null)).toBe("");
    expect(getSendNoteForWorksheet("none")).toBe("");
    expect(getSendNoteForWorksheet("")).toBe("");
  });
});

describe("shared asc worksheetRule text", () => {
  it("specifies ONE 'What you need to do' box per section, not per question", () => {
    const spec = resolveSendSpec("asc")!;
    const joined = spec.worksheetRules.join("\n").toLowerCase();
    expect(joined).toMatch(/one 'what you need to do'|one per section|once per section/);
    // Sanity: must NOT instruct the generator to repeat the box per question
    expect(joined).not.toMatch(/per question|every question begins with a 'what you need to do'/);
  });
});

// ─── Post-validator: MCQ single-correct ─────────────────────────────────────

describe("enforceSingleMcqCorrect", () => {
  it("leaves a single-tick MCQ unchanged", () => {
    const ws: PostValidatorWorksheet = {
      sections: [
        {
          type: "q-mcq",
          content: "What is 2+2? [1 mark]\nA  3\nB  4 ✓\nC  5\nD  6",
        },
      ],
    };
    const r = enforceSingleMcqCorrect(ws);
    expect(r.warnings).toHaveLength(0);
    expect(r.worksheet.sections![0].content).toContain("B  4 ✓");
  });

  it("removes all but the first ✓ when multiple options are ticked", () => {
    const ws: PostValidatorWorksheet = {
      sections: [
        {
          type: "q-mcq",
          content: "What is 2+2? [1 mark]\nA  3\nB  4 ✓\nC  5 ✓\nD  6",
        },
      ],
    };
    const r = enforceSingleMcqCorrect(ws);
    expect(r.warnings.length).toBeGreaterThan(0);
    const out = r.worksheet.sections![0].content!;
    const tickCount = (out.match(/✓/g) || []).length;
    expect(tickCount).toBe(1);
    expect(out).toContain("B  4 ✓");
    expect(out).toContain("C  5");
    expect(out).not.toContain("C  5 ✓");
  });

  it("strips leaked 'CORRECT: X' meta lines from student-facing MCQ content", () => {
    const ws: PostValidatorWorksheet = {
      sections: [
        {
          type: "q-mcq",
          content: "Q: ...\nA  opt1\nB  opt2 ✓\nC  opt3\nD  opt4\nCORRECT: B",
        },
      ],
    };
    const r = enforceSingleMcqCorrect(ws);
    expect(r.worksheet.sections![0].content).not.toMatch(/CORRECT\s*:/i);
  });

  it("does not touch teacher-only sections", () => {
    const ws: PostValidatorWorksheet = {
      sections: [
        {
          type: "q-mcq",
          teacherOnly: true,
          content: "CORRECT: B ✓\nD  6 ✓",
        },
      ],
    };
    const r = enforceSingleMcqCorrect(ws);
    // Teacher sections are left alone
    expect(r.worksheet.sections![0].content).toMatch(/CORRECT\s*:/);
  });
});

// ─── Post-validator: word bank dedupe + cap ─────────────────────────────────

describe("dedupeWordBank", () => {
  it("removes duplicate words (case-insensitive)", () => {
    const ws: PostValidatorWorksheet = {
      sections: [
        {
          type: "q-gap-fill",
          content:
            "Fill in the blanks.\nWORD BANK: energy | push | pull | Energy | PUSH | friction | force | gravity",
        },
      ],
    };
    const r = dedupeWordBank(ws);
    expect(r.warnings.length).toBeGreaterThan(0);
    const out = r.worksheet.sections![0].content!;
    // After dedupe there should be 6 unique words
    const bankLine = out.split("\n").find(l => /WORD\s*BANK:/i.test(l))!;
    const words = bankLine.split(":")[1].split("|").map(s => s.trim()).filter(Boolean);
    expect(words.length).toBe(6);
    // All words lower-cased should be unique
    const lowered = new Set(words.map(w => w.toLowerCase()));
    expect(lowered.size).toBe(words.length);
  });

  it("caps the word bank at 10 entries even when there are no duplicates", () => {
    const words = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const ws: PostValidatorWorksheet = {
      sections: [
        {
          type: "q-gap-fill",
          content: `WORD BANK: ${words.join(" | ")}`,
        },
      ],
    };
    const r = dedupeWordBank(ws);
    const bankLine = r.worksheet.sections![0].content!.split("\n").find(l => /WORD\s*BANK:/i.test(l))!;
    const parsed = bankLine.split(":")[1].split("|").map(s => s.trim()).filter(Boolean);
    expect(parsed.length).toBe(10);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("leaves a clean word bank untouched", () => {
    const ws: PostValidatorWorksheet = {
      sections: [
        {
          type: "q-gap-fill",
          content: "WORD BANK: force | friction | weight | mass | gravity | acceleration",
        },
      ],
    };
    const r = dedupeWordBank(ws);
    expect(r.warnings).toHaveLength(0);
  });
});

// ─── Post-validator: science diagram subject-lock ───────────────────────────

describe("stripForeignDiagrams", () => {
  it("removes a computer-architecture diagram from a physics worksheet", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "physics" },
      sections: [
        { type: "learning-objective", content: "Understand forces." },
        {
          type: "diagram-a",
          title: "Diagram A — computer-architecture overview",
          content: "[[DIAGRAM:{\"type\":\"computer-architecture\"}]]",
        },
        {
          type: "diagram-b",
          title: "Diagram B — Force arrows",
          content: "Force diagram",
        },
      ],
    };
    const r = stripForeignDiagrams(ws);
    expect(r.worksheet.sections!.length).toBe(2);
    expect(r.worksheet.sections!.map(s => s.type)).not.toContain("diagram-a");
    expect(r.warnings.length).toBe(1);
  });

  it("removes a big-o diagram from a science sheet", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "biology" },
      sections: [
        { type: "diagram-a", title: "Big-O notation reference", content: "" },
      ],
    };
    const r = stripForeignDiagrams(ws);
    expect(r.worksheet.sections!.length).toBe(0);
  });

  it("does nothing when the subject is not a science subject", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "computing" },
      sections: [
        { type: "diagram-a", title: "Big-O notation reference", content: "" },
      ],
    };
    const r = stripForeignDiagrams(ws);
    expect(r.worksheet.sections!.length).toBe(1);
    expect(r.warnings).toHaveLength(0);
  });


  it("removes unresolved placeholder diagram sections that would render as 'Diagram None'", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "science" },
      sections: [
        { type: "objective", content: "Understand forces." },
        { type: "diagram", title: "Diagram", content: "None", caption: "None" },
      ],
    };
    const r = stripEmptyDiagramPlaceholders(ws);
    expect(r.worksheet.sections!.length).toBe(1);
    expect(r.worksheet.sections!.map(s => `${s.title || ""} ${s.content || ""} ${s.caption || ""}`).join(" ")).not.toMatch(/Diagram\s+None/i);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("removes unresolved q-diagram sections whose placeholder header would render as 'None — Diagram None'", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "science" },
      sections: [
        { type: "objective", content: "Understand forces." },
        {
          type: "q-diagram",
          title: "None",
          caption: "Diagram None",
          content: "Q1. Identify the force labelled in the diagram that opposes motion.",
        },
      ],
    };
    const r = stripEmptyDiagramPlaceholders(ws);
    expect(r.worksheet.sections!.length).toBe(1);
    expect(r.worksheet.sections![0].type).toBe("objective");
    expect(r.worksheet.sections!.map(s => `${s.title || ""} ${s.content || ""} ${s.caption || ""}`).join(" ")).not.toMatch(/Diagram\s+None/i);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("removes unresolved q-diagram sections when diagramImageUrl is the string 'None'", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "science" },
      sections: [
        { type: "objective", content: "Understand forces." },
        {
          type: "q-diagram",
          title: "Diagram Questions",
          caption: "Diagram None",
          diagramTitle: "None",
          diagramImageUrl: "None",
          content: "Q1. Using the diagram, identify the force that opposes motion.",
        },
      ],
    };
    const r = stripEmptyDiagramPlaceholders(ws);
    expect(r.worksheet.sections!.length).toBe(1);
    expect(r.worksheet.sections![0].type).toBe("objective");
    expect(r.worksheet.sections!.map(s => `${s.title || ""} ${s.content || ""} ${s.caption || ""} ${(s as any).diagramImageUrl || ""}`).join(" ")).not.toMatch(/Diagram\s+None|diagramImageUrl.*None/i);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("does not remove a legitimate science diagram", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "physics" },
      sections: [
        {
          type: "diagram-a",
          title: "Diagram A — Circuit with battery and bulb",
          content: "[[DIAGRAM:{\"type\":\"circuit\"}]]",
        },
      ],
    };
    const r = stripForeignDiagrams(ws);
    expect(r.worksheet.sections!.length).toBe(1);
    expect(r.warnings).toHaveLength(0);
  });
});

// ─── Post-validator: year-group lock ────────────────────────────────────────

describe("enforceYearGroupLock", () => {
  it("rewrites stray 'Year 11' references when the worksheet is declared Year 9", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { yearGroup: "Year 9" },
      title: "Fractions — Year 9 Mathematics Worksheet",
      sections: [
        {
          type: "objective",
          title: "Year 11 Objectives",
          content: "By the end of this Year 11 lesson you will be able to add fractions.",
        },
      ],
    };
    const r = enforceYearGroupLock(ws);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.worksheet.sections![0].title).toContain("Year 9");
    expect(r.worksheet.sections![0].content).toContain("Year 9");
    expect(r.worksheet.sections![0].content).not.toContain("Year 11");
  });

  it("leaves matching year-group references untouched", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { yearGroup: "Year 9" },
      sections: [
        { type: "objective", title: "Year 9 Objectives", content: "" },
      ],
    };
    const r = enforceYearGroupLock(ws);
    expect(r.warnings).toHaveLength(0);
  });

  it("is a no-op when no year group is declared", () => {
    const ws: PostValidatorWorksheet = {
      sections: [{ type: "objective", title: "Year 11 Objectives", content: "" }],
    };
    const r = enforceYearGroupLock(ws);
    expect(r.worksheet.sections![0].title).toBe("Year 11 Objectives");
  });
});

// ─── Post-validator: worked-example step cap ────────────────────────────────

describe("capWorkedExampleSteps", () => {
  it("caps a maths worked example to 4 steps", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "mathematics" },
      sections: [
        {
          type: "example",
          content:
            "Question: compute 3 1/4 - 1 2/3.\n" +
            "Step 1: Convert 3 1/4 to 13/4.\n" +
            "Step 2: Convert 1 2/3 to 5/3.\n" +
            "Step 3: Common denominator 12: 39/12 - 20/12.\n" +
            "Step 4: Subtract: 19/12.\n" +
            "Step 5: Extra narrative step that should be clipped.\n" +
            "Step 6: Another extra that should also go.\n" +
            "✓ Key point: convert then subtract.",
        },
      ],
    };
    const r = capWorkedExampleSteps(ws, { subject: "mathematics" });
    const content = r.worksheet.sections![0].content!;
    expect(content).toMatch(/Step 4/);
    expect(content).not.toMatch(/Step 5|Step 6/);
    // ✓ Key point line must be preserved as a trailer
    expect(content).toMatch(/Key point/);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("caps a non-maths worked example to 5 steps", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "physics" },
      sections: [
        {
          type: "example",
          content:
            "1. First\n2. Second\n3. Third\n4. Fourth\n5. Fifth\n6. Sixth\n7. Seventh",
        },
      ],
    };
    const r = capWorkedExampleSteps(ws, { subject: "physics" });
    const content = r.worksheet.sections![0].content!;
    expect(content).toMatch(/5\./);
    expect(content).not.toMatch(/6\./);
    expect(content).not.toMatch(/7\./);
  });

  it("leaves a compact worked example untouched", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "mathematics" },
      sections: [
        { type: "example", content: "Step 1: a\nStep 2: b" },
      ],
    };
    const r = capWorkedExampleSteps(ws, { subject: "mathematics" });
    expect(r.warnings).toHaveLength(0);
  });
});

// ─── runWorksheetPostValidators end-to-end ──────────────────────────────────

describe("runWorksheetPostValidators end-to-end", () => {
  it("applies every validator and stamps warnings onto metadata", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "physics", yearGroup: "Year 9" },
      title: "Forces — Year 11 Science Worksheet",
      sections: [
        {
          type: "q-mcq",
          content: "What force opposes motion? [1 mark]\nA  gravity ✓\nB  friction ✓\nC  mass\nD  weight",
        },
        {
          type: "q-gap-fill",
          content:
            "A _____ can cause a change in _____.\nWORD BANK: force | energy | Force | energy | push | pull | push | pull | friction | gravity | inertia",
        },
        {
          type: "diagram-a",
          title: "Big-O notation reference",
          content: "[[DIAGRAM:{\"type\":\"big-o\"}]]",
        },
      ],
    };
    const r = runWorksheetPostValidators(ws, { subject: "physics", yearGroup: "Year 9" });
    expect(r.warnings.length).toBeGreaterThan(0);
    // MCQ: only one tick
    const mcq = r.worksheet.sections!.find(s => s.type === "q-mcq")!;
    expect((mcq.content!.match(/✓/g) || []).length).toBe(1);
    // Word bank: no duplicates, capped
    const bank = r.worksheet.sections!.find(s => s.type === "q-gap-fill")!;
    const bankLine = bank.content!.split("\n").find(l => /WORD\s*BANK:/i.test(l))!;
    const words = bankLine.split(":")[1].split("|").map(s => s.trim()).filter(Boolean);
    expect(new Set(words.map(w => w.toLowerCase())).size).toBe(words.length);
    expect(words.length).toBeLessThanOrEqual(10);
    // Foreign diagram removed
    expect(r.worksheet.sections!.find(s => s.type === "diagram-a")).toBeUndefined();
    // Year-group lock rewrote the title
    expect(r.worksheet.title).toContain("Year 9");
    expect(r.worksheet.title).not.toContain("Year 11");
    // Warnings recorded on metadata for observability
    expect((r.worksheet.metadata as any).postValidatorWarnings).toBeDefined();
    expect(((r.worksheet.metadata as any).postValidatorWarnings as string[]).length).toBeGreaterThan(0);
  });

  it("is idempotent", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "physics", yearGroup: "Year 9" },
      sections: [
        {
          type: "q-mcq",
          content: "Q? [1 mark]\nA ✓\nB ✓\nC\nD",
        },
      ],
    };
    const first = runWorksheetPostValidators(ws, { subject: "physics", yearGroup: "Year 9" });
    const second = runWorksheetPostValidators(first.worksheet, { subject: "physics", yearGroup: "Year 9" });
    // Second pass finds no fresh issues (warnings-array is empty from the
    // second run — previous warnings are still in metadata)
    expect(second.warnings).toHaveLength(0);
  });
});

// ─── overlayEngine.buildAscSupport — one box per section, not per question ──

describe("overlayEngine — ASC 'What you need to do' is per section", () => {
  it("inserts ONE 'What you need to do' box per section regardless of question count", () => {
    const baseSections = [
      { id: "lo", type: "learning-objective", content: "Objective." },
      { id: "s1", type: "header", title: "Section 1 — Fluency" },
      { id: "q1", type: "q-short-answer", content: "Calculate 12 + 7." },
      { id: "q2", type: "q-short-answer", content: "Calculate 15 - 3." },
      { id: "q3", type: "q-short-answer", content: "Calculate 9 x 4." },
      { id: "s2", type: "header", title: "Section 2 — Reasoning" },
      { id: "q4", type: "q-short-answer", content: "Show that 2 + 3 = 5." },
      { id: "q5", type: "q-short-answer", content: "Show that 10 - 4 = 6." },
    ];

    const r = applyOverlays(baseSections as any, { sendNeed: "asc" });
    const supportTitles = r.sections
      .filter(s => s.type === "send-support")
      .map(s => s.title);

    // One WYNTD box per section, not per question. 2 sections → 2 boxes.
    const wyntd = supportTitles.filter(t => /what you need to do/i.test(t || ""));
    expect(wyntd.length).toBe(2);

    // And every pupil question section should still be present (overlay
    // engine must not remove content).
    const qIds = r.sections.filter(s => /^q\d+$/.test(String(s.id || ""))).map(s => s.id);
    expect(qIds).toEqual(["q1", "q2", "q3", "q4", "q5"]);
  });

  it("inserts zero boxes when there are no question sections", () => {
    const baseSections = [
      { id: "lo", type: "learning-objective", content: "Objective." },
    ];
    const r = applyOverlays(baseSections as any, { sendNeed: "asc" });
    const wyntd = r.sections.filter(s => /what you need to do/i.test(String(s.title || "")));
    expect(wyntd.length).toBe(0);
  });
});


describe("worksheetPostValidator — live gap regressions", () => {
  it("removes foreign science diagrams by structured diagramType as well as text tokens", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Science", yearGroup: "Year 7" },
      sections: [
        { id: "bad", type: "diagram", title: "Reference image", diagramType: "computer-architecture", content: "A diagram placeholder." },
        { id: "good", type: "q-short-answer", content: "What is a force?" },
      ],
    };
    const r = stripForeignDiagrams(ws, { subject: "Science" });
    expect(r.worksheet.sections!.map(s => s.id)).toEqual(["good"]);
    expect(r.warnings.join(" ")).toMatch(/foreign diagram/i);
  });

  it("strips leaked prompt/schema instructions from student-facing worksheet content", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Maths", yearGroup: "Year 7" },
      sections: [
        { type: "q-gap-fill", content: "Complete the paragraph.\n[Write EXACTLY 7 sentences. Do NOT number the blanks.]\nRULE: EXACTLY 7 blanks.\nWORD BANK: numerator | denominator | fraction" },
      ],
    };
    const r = stripLeakedGeneratorInstructions(ws);
    const content = r.worksheet.sections![0].content || "";
    expect(content).not.toMatch(/RULE:|EXACTLY|Do NOT|Write EXACTLY/i);
    expect(content).toContain("WORD BANK: numerator | denominator | fraction");
  });

  it("adds concrete dyscalculia maths scaffolding instead of only generic working-out prompts", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Maths", yearGroup: "Year 7" },
      sections: [
        { type: "q-short-answer", content: "Calculate 3/4 + 1/8. Show all working." },
      ],
    };
    const r = reinforceDyscalculiaMathsScaffolding(ws, { subject: "Maths", sendNeed: "dyscalculia" });
    const content = r.worksheet.sections![0].content || "";
    expect(content).toMatch(/Show one step per line/i);
    expect(content).toMatch(/number line|place-value|estimate first/i);
  });
});
