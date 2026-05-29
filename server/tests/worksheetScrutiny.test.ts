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
  getAllSendSpecs,
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
  enforceSectionQuestionCounts,
  enforceSpecAnchorPresence,
  enforceSelfReflectionTopicAnchor,
  enforceRevisionTipsPresence,
  type PostValidatorWorksheet,
} from "../../client/src/lib/worksheetPostValidator";

import {
  linesForMarks,
  shouldRenderWorkingOutBox,
  workingOutRowsForMarks,
  SECTION_QUESTION_TARGETS,
  TOTAL_QUESTIONS_TARGET,
  TOTAL_QUESTIONS_HARD_CAP,
  EAL_L1_LANGUAGES,
} from "../../client/src/lib/worksheetSectionTargets";

import {
  buildWorksheetPlan,
  validateWorksheetPlan,
} from "../../client/src/lib/worksheetConstraints";

import { applyOverlays } from "../lib/overlayEngine";
import { parseNaturalLanguageInput } from "../../client/src/lib/ai";

// Phase 2 — Topic-specific Self-Reflection builder. Imported here for the
// Phase 2 test suites at the bottom of this file. Pure / deterministic so
// every assertion is repeatable.
import {
  buildSelfReflection,
  renderSelfReflectionAsMarkerBlock,
  isGenericSelfReflection,
  extractTopicNounPhrase,
  pickCommandWords,
} from "../../client/src/lib/selfReflectionBuilder";

// Phase 3 — Examiner-voice Revision Tips builder. Imported here for the
// Phase 3 test suites at the bottom of this file. Pure / deterministic
// so every assertion is repeatable.
import {
  buildRevisionTips,
  renderRevisionTipsAsMarkerBlock,
  isGenericRevisionTips,
} from "../../client/src/lib/revisionTipsBuilder";

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

// ─── Phase 4 — SEND content rules (worksheetRulesContent) ───────────────────

describe("worksheetRulesContent — Phase 4 parity", () => {
  it("every SEND profile carries a worksheetRulesContent array with at least 3 entries", () => {
    const specs = getAllSendSpecs();
    expect(specs.length).toBe(21);
    for (const spec of specs) {
      expect(Array.isArray(spec.worksheetRulesContent)).toBe(true);
      expect(spec.worksheetRulesContent.length).toBeGreaterThanOrEqual(3);
      // Every entry is a non-trivial imperative string
      for (const rule of spec.worksheetRulesContent) {
        expect(typeof rule).toBe("string");
        expect(rule.trim().length).toBeGreaterThan(40);
      }
    }
  });

  it("content rules are distinct from presentation rules within a profile", () => {
    // The Phase 4 expansion only delivers value if content rules don't
    // duplicate the presentation rules verbatim. Allow incidental
    // word-overlap; require zero exact-duplicate lines.
    for (const spec of getAllSendSpecs()) {
      const presentation = new Set(spec.worksheetRules.map(r => r.trim()));
      for (const rule of spec.worksheetRulesContent) {
        expect(presentation.has(rule.trim())).toBe(false);
      }
    }
  });

  it("each profile's content rules read as imperatives — they start with a recognisable command verb", () => {
    // Imperative-mood smoke test — guards against future contributors writing
    // descriptive prose instead of an instruction. The opener whitelist is the
    // union of verbs actually used across the 21 profiles' content rules.
    const imperativeOpener = /^(every|use|avoid|replace|frame|pre-teach|pre-draw|open|introduce|lock|cap|limit|restrict|pull|frontload|pair|anchor|carry|add|offer|where|strip|embed|choose|present|reference|number|keep|q\d|all|each|favour|when|never|define|write)\b/i;
    for (const spec of getAllSendSpecs()) {
      for (const rule of spec.worksheetRulesContent) {
        expect(rule).toMatch(imperativeOpener);
      }
    }
  });
});

describe("worksheetRulesContent — pedagogy anchors", () => {
  it("ADHD content rules emphasise novelty and demand-variation, not just bolding", () => {
    const spec = resolveSendSpec("adhd")!;
    const joined = spec.worksheetRulesContent.join(" ").toLowerCase();
    expect(joined).toMatch(/novelty|novel|high-novelty|change|cognitive demand|attention|spaced/);
  });

  it("dyscalculia content rules require Concrete-Pictorial-Abstract progression", () => {
    const spec = resolveSendSpec("dyscalculia")!;
    const joined = spec.worksheetRulesContent.join(" ");
    expect(joined).toMatch(/Concrete\s*→\s*Pictorial\s*→\s*Abstract/i);
    // Small-number scaffolding: explicit upper bound on the introductory question
    expect(joined.toLowerCase()).toMatch(/small whole numbers/);
  });

  it("ASC base content rules ban inferred context and lock the question schema", () => {
    const spec = resolveSendSpec("asc")!;
    const joined = spec.worksheetRulesContent.join(" ").toLowerCase();
    expect(joined).toMatch(/decodable|inference|never require/);
    expect(joined).toMatch(/schema|template/);
  });

  it("EAL content rules call for cognate vocabulary and forbid UK-only colloquialisms", () => {
    const spec = resolveSendSpec("eal")!;
    const joined = spec.worksheetRulesContent.join(" ").toLowerCase();
    expect(joined).toMatch(/cognate/);
    // Forbid phrasal verbs / UK-specific contexts
    expect(joined).toMatch(/phrasal verb|idiom|uniquely-british|culturally neutral/);
  });

  it("older-learners content rules use adult contexts and reference an awarding body", () => {
    const spec = resolveSendSpec("older-learners")!;
    const joined = spec.worksheetRulesContent.join(" ").toLowerCase();
    expect(joined).toMatch(/workplace|finance|adult/);
    expect(joined).toMatch(/aqa|awarding[-\s]body|edexcel|ocr|ao1|ao2|gcse/);
  });

  it("working-memory content rules carry forward values and limit demand per question", () => {
    const spec = resolveSendSpec("working-memory")!;
    const joined = spec.worksheetRulesContent.join(" ").toLowerCase();
    expect(joined).toMatch(/carry forward|values? from the previous question|previous question/);
    expect(joined).toMatch(/one new fact|one recall|one new operation|split into/);
  });

  it("SEMH content rules open with a confidence-builder while preserving year-group rigour", () => {
    const spec = resolveSendSpec("semh")!;
    const joined = spec.worksheetRulesContent.join(" ").toLowerCase();
    expect(joined).toMatch(/confidence-builder|confidence builder|low-stakes/);
    // Must explicitly preserve curriculum demand
    expect(joined).toMatch(/year-group curriculum demand|does not lower the rigour/);
  });
});

describe("getSendNoteForWorksheet — Phase 4 prompt block", () => {
  it("renders BOTH the presentation-rules block and the content-rules block when a profile is selected", () => {
    const note = getSendNoteForWorksheet("dyscalculia");
    expect(note).toMatch(/PRESENTATION RULES/);
    expect(note).toMatch(/CONTENT RULES/);
    // Each block carries at least one numbered rule
    expect(note).toMatch(/PRESENTATION RULES[\s\S]*?\(1\)/);
    expect(note).toMatch(/CONTENT RULES[\s\S]*?\(1\)/);
  });

  it("the dyscalculia content block carries a Concrete-Pictorial-Abstract instruction", () => {
    const note = getSendNoteForWorksheet("dyscalculia");
    // Pull the content block specifically and check the pedagogy lands there
    const contentMatch = note.match(/CONTENT RULES[\s\S]*?(?=The 'What will change|$)/);
    expect(contentMatch).not.toBeNull();
    expect(contentMatch![0]).toMatch(/Concrete\s*→\s*Pictorial\s*→\s*Abstract/i);
  });

  it("the CRITICAL closing line acknowledges content adaptations while preserving curriculum rigour", () => {
    const note = getSendNoteForWorksheet("adhd");
    expect(note).toMatch(/CRITICAL/);
    // No longer claims content never changes (the Phase 1-3 wording).
    expect(note).not.toMatch(/never the academic rigour\b/);
    // But still locks year-group level / mark allocations / awarding-body fidelity
    expect(note.toLowerCase()).toMatch(/year[-\s]group/);
    expect(note.toLowerCase()).toMatch(/curriculum (content|demand)|academic rigour|awarding[-\s]body/);
  });

  it("returns an empty string when no SEND need is supplied (regression guard from Phase 1)", () => {
    expect(getSendNoteForWorksheet(undefined)).toBe("");
    expect(getSendNoteForWorksheet("none")).toBe("");
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
    // MCQ: the full pipeline removes pupil-facing answer hints entirely.
    const mcq = r.worksheet.sections!.find(s => s.type === "q-mcq")!;
    expect((mcq.content!.match(/✓/g) || []).length).toBe(0);
    expect(mcq.content).not.toMatch(/correct answer|\(correct\)/i);
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


describe("parseNaturalLanguageInput — worksheet quick prompt regressions", () => {
  it("keeps explicit biology/chemistry/physics subjects rather than collapsing them to generic science", () => {
    expect(parseNaturalLanguageInput("Create a Year 10 GCSE Biology mitosis worksheet with dyslexia support and reading age 9")).toMatchObject({
      subject: "biology",
      yearGroup: "Year 10",
      topic: "Mitosis",
      sendNeed: "dyslexia",
      readingAge: 9,
    });
    expect(parseNaturalLanguageInput("Year 11 Chemistry atomic structure higher reading age 10 ADHD")).toMatchObject({
      subject: "chemistry",
      yearGroup: "Year 11",
      topic: "Atomic Structure",
      sendNeed: "adhd",
      readingAge: 10,
      difficulty: "higher",
    });
    expect(parseNaturalLanguageInput("Make Year 11 Physics nuclear decay worksheet for ASC reading age 8")).toMatchObject({
      subject: "physics",
      yearGroup: "Year 11",
      topic: "Nuclear Decay",
      sendNeed: "asc",
      readingAge: 8,
    });
  });

  it("does not misclassify reading-age-only prompts as English just because they contain the word reading", () => {
    const parsed = parseNaturalLanguageInput("Create Year 11 maths ratio and proportion worksheet reading age 8 dyscalculia foundation");
    expect(parsed.subject).toBe("mathematics");
    expect(parsed.readingAge).toBe(8);
    expect(parsed.sendNeed).toBe("dyscalculia");
    expect(parsed.topic).toMatch(/ratio|proportion/i);
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

  it("strips inline live-generation formatting-rule leakage from content, questions, and options", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Biology", yearGroup: "Year 10" },
      sections: [
        {
          type: "q-mcq",
          content: "Circle the best answer. CRITICAL FORMATTING RULE: You MUST write exactly one correct answer and three distractors.",
          questions: [
            {
              question: "What happens in mitosis? RULE: EXACTLY one sentence only.",
              options: [
                "A two identical daughter cells ✓",
                "B one gamete [plausible distractor]",
                "C four different cells",
                "D no cells",
              ],
            },
          ],
        },
      ],
    };
    const r = runWorksheetPostValidators(ws, { subject: "biology", yearGroup: "Year 10" });
    const section: any = r.worksheet.sections![0];
    const rendered = [section.content, section.questions?.[0]?.question, ...(section.questions?.[0]?.options || [])].join("\n");
    expect(rendered).not.toMatch(/CRITICAL FORMATTING RULE|RULE:\s*EXACTLY|MUST write|plausible distractor|✓/i);
    expect(rendered).toMatch(/Circle the best answer/i);
    expect(rendered).toMatch(/What happens in mitosis/i);
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

  it("removes visible answer hints and placeholder instructions from pupil-facing content while leaving teacher sections intact", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "physics", yearGroup: "Year 11" },
      sections: [
        { type: "q-mcq", content: "Which radiation is stopped by paper?\nA alpha ✓\nB beta (correct)\nC gamma\nD neutron\n[plausible distractor]" },
        { type: "answers", teacherOnly: true, content: "A alpha ✓\nB beta (correct)" },
      ],
    };
    const r = runWorksheetPostValidators(ws, { subject: "physics", yearGroup: "Year 11" });
    const student = r.worksheet.sections![0].content || "";
    expect(student).not.toMatch(/✓|\(correct\)|plausible distractor/i);
    expect(r.worksheet.sections![1].content).toMatch(/✓|\(correct\)/);
    expect((r.worksheet.metadata as any).postValidatorWarnings.join(" ")).toMatch(/answer hints|placeholders/i);
  });
});


// ─── Phase 1 — Curriculum-aligned worksheet structure ──────────────────────

describe("Phase 1 / linesForMarks — exam-paper aligned ramp", () => {
  it("emits 0 lines for layouts that own their own answer affordance", () => {
    expect(linesForMarks(2, "q-mcq")).toBe(0);
    expect(linesForMarks(4, "q-true-false")).toBe(0);
    expect(linesForMarks(3, "q-gap-fill")).toBe(0);
    expect(linesForMarks(2, "q-matching")).toBe(0);
    expect(linesForMarks(2, "q-ordering")).toBe(0);
    expect(linesForMarks(4, "q-data-table")).toBe(0);
    expect(linesForMarks(2, "q-label-diagram")).toBe(0);
  });

  it("scales lines by mark tariff for written-answer questions", () => {
    expect(linesForMarks(1)).toBe(2);
    expect(linesForMarks(2)).toBe(3);
    expect(linesForMarks(3)).toBe(4);
    expect(linesForMarks(4)).toBe(6);
    expect(linesForMarks(5)).toBe(8);
    expect(linesForMarks(6)).toBe(8);
    expect(linesForMarks(7)).toBe(12);
    expect(linesForMarks(8)).toBe(12);
    expect(linesForMarks(9)).toBe(14);
    expect(linesForMarks(12)).toBe(14);
  });

  it("never returns a negative or NaN line count for malformed inputs", () => {
    expect(linesForMarks(0)).toBe(2);
    expect(linesForMarks(-1)).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(linesForMarks(0))).toBe(true);
  });

  it("exposes a sane working-out box height ramp", () => {
    expect(workingOutRowsForMarks(1)).toBe(6);
    expect(workingOutRowsForMarks(3)).toBe(10);
    expect(workingOutRowsForMarks(5)).toBe(14);
    expect(workingOutRowsForMarks(8)).toBe(18);
  });
});

describe("Phase 1 / shouldRenderWorkingOutBox — MATHS ONLY (steering-locked)", () => {
  it("returns true for maths calculate-stems", () => {
    expect(shouldRenderWorkingOutBox({
      stem: "Calculate the value of x when 2x + 3 = 11.",
      marks: 3,
      subject: "Mathematics",
    })).toBe(true);
    expect(shouldRenderWorkingOutBox({
      stem: "Solve 4x = 12.",
      marks: 2,
      subject: "Maths",
    })).toBe(true);
    expect(shouldRenderWorkingOutBox({
      stem: "Show that the area is 24 cm².",
      marks: 4,
      subject: "Mathematics",
    })).toBe(true);
  });

  it("returns true for high-mark maths stems even without an explicit calc verb", () => {
    expect(shouldRenderWorkingOutBox({
      stem: "Find the perimeter of the shape.",
      marks: 4,
      subject: "Mathematics",
    })).toBe(true);
  });

  it("returns FALSE for science calculate-stems — sciences use writing lines, not dot-grid", () => {
    expect(shouldRenderWorkingOutBox({
      stem: "Calculate the resultant force on the trolley.",
      marks: 3,
      subject: "Physics",
    })).toBe(false);
    expect(shouldRenderWorkingOutBox({
      stem: "Calculate the relative formula mass of CO2.",
      marks: 2,
      subject: "Chemistry",
    })).toBe(false);
    expect(shouldRenderWorkingOutBox({
      stem: "Calculate the rate of reaction.",
      marks: 4,
      subject: "Combined Science",
    })).toBe(false);
  });

  it("returns FALSE for English / humanities extended writing", () => {
    expect(shouldRenderWorkingOutBox({
      stem: "Explain how the writer builds tension in this extract.",
      marks: 6,
      subject: "English",
    })).toBe(false);
    expect(shouldRenderWorkingOutBox({
      stem: "Evaluate the impact of the Treaty of Versailles.",
      marks: 8,
      subject: "History",
    })).toBe(false);
  });

  it("respects the explicit workingOutBox override", () => {
    // Maths stem explicitly opted-out
    expect(shouldRenderWorkingOutBox({
      stem: "Calculate the area.",
      marks: 4,
      subject: "Mathematics",
      workingOutBox: false,
    })).toBe(false);
    // Non-maths stem explicitly opted-in (rare but supported)
    expect(shouldRenderWorkingOutBox({
      stem: "Describe the process.",
      marks: 2,
      subject: "English",
      workingOutBox: true,
    })).toBe(true);
  });

  it("returns FALSE when subject is unknown / empty (renderer fail-safe)", () => {
    expect(shouldRenderWorkingOutBox({
      stem: "Calculate 3 + 4.",
      marks: 2,
      subject: "",
    })).toBe(false);
  });
});

describe("Phase 1 / EAL_L1_LANGUAGES", () => {
  it("includes the top UK EAL L1s and the explicit Mirpuri (Pahari-Pothwari) entry", () => {
    expect(EAL_L1_LANGUAGES).toContain("Urdu");
    expect(EAL_L1_LANGUAGES).toContain("Polish");
    expect(EAL_L1_LANGUAGES).toContain("Bengali");
    expect(EAL_L1_LANGUAGES).toContain("Arabic");
    expect(EAL_L1_LANGUAGES).toContain("Panjabi");
    // Steering-locked: Mirpuri must appear as its own entry, not subsumed
    // into Panjabi/Urdu.
    expect(EAL_L1_LANGUAGES).toContain("Mirpuri (Pahari-Pothwari)");
    expect(EAL_L1_LANGUAGES.length).toBeGreaterThanOrEqual(10);
    // No duplicates (case-insensitive).
    const lowered = new Set(EAL_L1_LANGUAGES.map(l => l.toLowerCase()));
    expect(lowered.size).toBe(EAL_L1_LANGUAGES.length);
  });
});

describe("Phase 1 / buildWorksheetPlan — 7-7-5 + 1 secondary structure", () => {
  it("produces 7+7+5+1 = 20 questions for a Year 10 secondary worksheet", () => {
    const plan = buildWorksheetPlan(
      "Mathematics",
      "Algebraic notation",
      "Year 10",
      "mixed",
      "aqa",
      undefined,
    );
    const total = plan.sections.reduce((acc, s) => acc + s.questions.length, 0);
    expect(total).toBe(TOTAL_QUESTIONS_TARGET);
    expect(total).toBe(20);

    const recall = plan.sections.find(s => s.name === "recall")!;
    const understanding = plan.sections.find(s => s.name === "understanding")!;
    const application = plan.sections.find(s => s.name === "application")!;
    const challenge = plan.sections.find(s => s.name === "challenge")!;

    expect(recall.questions.length).toBe(SECTION_QUESTION_TARGETS.recall.target);
    expect(understanding.questions.length).toBe(SECTION_QUESTION_TARGETS.understanding.target);
    expect(application.questions.length).toBe(SECTION_QUESTION_TARGETS.application.target);
    expect(challenge.questions.length).toBe(SECTION_QUESTION_TARGETS.challenge.target);
    // Challenge question is now Q20 (was hard-coded "Question 10" pre-Phase 1).
    expect(challenge.questionRange).toBe(`Question ${TOTAL_QUESTIONS_TARGET}`);
  });

  it("produces 3-3-3 for primary worksheets (KS2)", () => {
    const plan = buildWorksheetPlan(
      "Mathematics",
      "Place value",
      "Year 4",
      "mixed",
      undefined,
      undefined,
    );
    const total = plan.sections.reduce((acc, s) => acc + s.questions.length, 0);
    expect(total).toBe(9);
    // Primary has no challenge section.
    expect(plan.sections.find(s => s.name === "challenge")).toBeUndefined();
  });
});

describe("Phase 1 / validateWorksheetPlan — cap lifted to 25", () => {
  it("accepts a 20-question secondary plan without a TOO_MANY_QUESTIONS error", () => {
    const plan = buildWorksheetPlan(
      "Mathematics",
      "Algebraic notation",
      "Year 10",
      "mixed",
      "aqa",
      undefined,
    );
    const result = validateWorksheetPlan(plan);
    const tooManyError = result.errors.find(e => e.code === "TOO_MANY_QUESTIONS");
    expect(tooManyError).toBeUndefined();
  });

  it("rejects a plan with more than TOTAL_QUESTIONS_HARD_CAP questions", () => {
    const plan = buildWorksheetPlan(
      "Mathematics",
      "Algebraic notation",
      "Year 10",
      "mixed",
      "aqa",
      undefined,
    );
    // Synthesise an oversized plan by cloning the first section's questions
    // until we cross the cap.
    const inflate: any = JSON.parse(JSON.stringify(plan));
    while (inflate.sections.flatMap((s: any) => s.questions).length <= TOTAL_QUESTIONS_HARD_CAP) {
      inflate.sections[0].questions.push(JSON.parse(JSON.stringify(inflate.sections[0].questions[0])));
    }
    const result = validateWorksheetPlan(inflate);
    const tooMany = result.errors.find(e => e.code === "TOO_MANY_QUESTIONS");
    expect(tooMany).toBeDefined();
    expect(tooMany!.message).toContain(String(TOTAL_QUESTIONS_HARD_CAP));
  });
});

// ─── Phase 1 / enforceSectionQuestionCounts ─────────────────────────────────

describe("Phase 1 / enforceSectionQuestionCounts", () => {
  function qSection(qn: number, type = "q-short-answer", title?: string): any {
    return {
      type,
      title: title ?? `Q${qn} — Practice`,
      content: `Question ${qn} body. [2 marks]`,
      questionNumber: qn,
    };
  }

  it("emits no warning when every section group hits its target count", () => {
    const sections: any[] = [];
    // Recall 7
    for (let i = 1; i <= 7; i++) sections.push(qSection(i));
    // Understanding 7
    for (let i = 8; i <= 14; i++) sections.push(qSection(i));
    // Application 5
    for (let i = 15; i <= 19; i++) sections.push(qSection(i));
    // Challenge 1
    sections.push(qSection(20, "challenge", "Challenge"));
    const ws: PostValidatorWorksheet = { sections };
    const r = enforceSectionQuestionCounts(ws);
    expect(r.warnings).toHaveLength(0);
  });

  it("warns when a section is below its minimum", () => {
    const sections: any[] = [];
    // Recall only 4 — under min of 6
    for (let i = 1; i <= 4; i++) sections.push(qSection(i));
    for (let i = 8; i <= 14; i++) sections.push(qSection(i));
    for (let i = 15; i <= 19; i++) sections.push(qSection(i));
    sections.push(qSection(20, "challenge", "Challenge"));
    const ws: PostValidatorWorksheet = { sections };
    const r = enforceSectionQuestionCounts(ws);
    expect(r.warnings.join(" ")).toMatch(/Section "recall".*below the minimum/);
  });

  it("warns when a section is above its maximum", () => {
    const sections: any[] = [];
    for (let i = 1; i <= 7; i++) sections.push(qSection(i));
    for (let i = 8; i <= 14; i++) sections.push(qSection(i));
    // Application: 7 — above max of 5 (we pad with overflow numbers)
    for (let i = 15; i <= 21; i++) sections.push(qSection(i));
    sections.push(qSection(22, "challenge", "Challenge"));
    const ws: PostValidatorWorksheet = { sections };
    const r = enforceSectionQuestionCounts(ws);
    expect(r.warnings.join(" ")).toMatch(/Section "application".*above the maximum/);
  });

  it("never mutates the worksheet (warnings only)", () => {
    const sections: any[] = [];
    for (let i = 1; i <= 4; i++) sections.push(qSection(i));
    const ws: PostValidatorWorksheet = { sections };
    const before = JSON.stringify(ws);
    const r = enforceSectionQuestionCounts(ws);
    expect(JSON.stringify(r.worksheet)).toBe(before);
  });

  it("is a no-op when the worksheet has no question sections at all", () => {
    const ws: PostValidatorWorksheet = {
      sections: [
        { type: "vocabulary", content: "term: def" },
        { type: "objective", content: "Describe..." },
      ],
    };
    const r = enforceSectionQuestionCounts(ws);
    expect(r.warnings).toHaveLength(0);
  });
});

// ─── Phase 1 / enforceSpecAnchorPresence ────────────────────────────────────

describe("Phase 1 / enforceSpecAnchorPresence — curriculum + GCSE spec lock", () => {
  it("fills missing specRef on a question by best-matching against the AQA Maths Y10 taxonomy", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", yearGroup: "Year 10", examBoard: "aqa" },
      sections: [
        {
          type: "q-short-answer",
          title: "Q1 — Algebra",
          content: "Simplify 3a + 5a. [1 mark]",
          ncRef: "Simplify and manipulate algebraic expressions",
        } as any,
      ],
    };
    const r = enforceSpecAnchorPresence(ws, {
      subject: "Mathematics",
      yearGroup: "Year 10",
      examBoard: "aqa",
    });
    const filled = r.worksheet.sections![0] as any;
    // AQA Maths Y10 A4 = "Simplify and manipulate algebraic expressions"
    expect(filled.specRef).toBe("A4");
  });

  it("warns when an existing specRef is invented (does not match any published code)", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", yearGroup: "Year 10", examBoard: "aqa" },
      sections: [
        {
          type: "q-short-answer",
          title: "Q1",
          content: "Solve 2x + 1 = 9. [2 marks]",
          specRef: "Z99-INVENTED",
        } as any,
      ],
    };
    const r = enforceSpecAnchorPresence(ws, {
      subject: "Mathematics",
      yearGroup: "Year 10",
      examBoard: "aqa",
    });
    expect(r.warnings.join(" ")).toMatch(/Z99-INVENTED.*does not match/i);
    // Must NOT silently overwrite — bug-visibility wins over auto-correct.
    const sec = r.worksheet.sections![0] as any;
    expect(sec.specRef).toBe("Z99-INVENTED");
  });

  it("leaves a valid specRef untouched", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", yearGroup: "Year 10", examBoard: "aqa" },
      sections: [
        {
          type: "q-short-answer",
          title: "Q1",
          content: "Substitute x = 4 into 3x + 2. [1 mark]",
          specRef: "A2",
        } as any,
      ],
    };
    const r = enforceSpecAnchorPresence(ws, {
      subject: "Mathematics",
      yearGroup: "Year 10",
      examBoard: "aqa",
    });
    expect(r.warnings).toHaveLength(0);
    expect((r.worksheet.sections![0] as any).specRef).toBe("A2");
  });

  it("warns once and skips when no taxonomy is bundled for the (board, subject, year)", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Sociology", yearGroup: "Year 12", examBoard: "aqa" },
      sections: [
        {
          type: "q-short-answer",
          title: "Q1",
          content: "Explain anomie. [4 marks]",
        } as any,
      ],
    };
    const r = enforceSpecAnchorPresence(ws, {
      subject: "Sociology",
      yearGroup: "Year 12",
      examBoard: "aqa",
    });
    expect(r.warnings.join(" ")).toMatch(/No spec-point taxonomy bundled/i);
    // Question is left untouched — no fabricated code.
    expect((r.worksheet.sections![0] as any).specRef).toBeUndefined();
  });

  it("falls back to the cross-board union when the per-board dataset is missing", () => {
    // OCR Maths Y10 isn't bundled, so the validator should union across
    // boards (AQA + Edexcel are bundled) and still find a match for an
    // algebra question.
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", yearGroup: "Year 10", examBoard: "ocr" },
      sections: [
        {
          type: "q-short-answer",
          title: "Q1 — Algebra",
          content: "Simplify 3a + 5a. [1 mark]",
          ncRef: "Simplify and manipulate algebraic expressions",
        } as any,
      ],
    };
    const r = enforceSpecAnchorPresence(ws, {
      subject: "Mathematics",
      yearGroup: "Year 10",
      examBoard: "ocr",
    });
    // The validator should have surfaced a code from the union (board-prefixed).
    const sec = r.worksheet.sections![0] as any;
    expect(sec.specRef).toBeDefined();
  });

  it("never invents a code when there is no usable hint at all", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", yearGroup: "Year 10", examBoard: "aqa" },
      sections: [
        {
          type: "q-short-answer",
          title: "",
          content: "",
        } as any,
      ],
    };
    const r = enforceSpecAnchorPresence(ws, {
      subject: "Mathematics",
      yearGroup: "Year 10",
      examBoard: "aqa",
    });
    expect((r.worksheet.sections![0] as any).specRef).toBeUndefined();
  });
});


// ─── Phase 2 — Topic-specific Self-Reflection ────────────────────────────────
// These tests lock in the deterministic floor for the worksheet
// "How Did I Do?" / Self Reflection content surface. Before Phase 2 the AI
// could emit (and the renderer would happily ship) generic placeholder
// content like `I can ___.` and `I can apply what I have learned today`
// — pedagogical noise. The builder + post-validator now guarantee that
// every pupil-facing reflection block is anchored to the actual topic.

describe("Phase 2 / extractTopicNounPhrase", () => {
  it("strips generic article-prefixes that read awkwardly inside 'about X'", () => {
    expect(extractTopicNounPhrase("An Introduction to Photosynthesis")).toBe("photosynthesis");
    expect(extractTopicNounPhrase("Introduction to Bioenergetics")).toBe("bioenergetics");
    expect(extractTopicNounPhrase("The Heart")).toBe("the heart");
    expect(extractTopicNounPhrase("A Christmas Carol Stave 1")).toBe("christmas carol stave 1");
  });

  it("preserves proper-noun-led topics so they remain titlecased on the page", () => {
    expect(extractTopicNounPhrase("Macbeth Act 1 Scene 5")).toBe("Macbeth Act 1 Scene 5");
    expect(extractTopicNounPhrase("Newton's Laws")).toBe("Newton's Laws");
    expect(extractTopicNounPhrase("Romeo and Juliet")).toBe("Romeo and Juliet");
  });

  it("preserves all-caps acronyms (GDPR, NHS, BBC, GCSE) so the page does not say 'I can describe gdpr'", () => {
    expect(extractTopicNounPhrase("GDPR")).toBe("GDPR");
    expect(extractTopicNounPhrase("NHS")).toBe("NHS");
    expect(extractTopicNounPhrase("BBC")).toBe("BBC");
    expect(extractTopicNounPhrase("GCSE")).toBe("GCSE");
    expect(extractTopicNounPhrase("KS3")).toBe("KS3");
  });

  it("lower-cases multi-word common-noun topics so they read inside a sentence", () => {
    expect(extractTopicNounPhrase("Adding Fractions")).toBe("adding fractions");
    expect(extractTopicNounPhrase("Quadratic Equations")).toBe("quadratic equations");
  });

  it("lower-cases single-word common-noun topics that are not whitelisted proper nouns", () => {
    // Fix for the over-greedy startsWithProperNoun heuristic flagged in
    // PR #75 — these are common-noun curriculum titles that previously
    // leaked title case into mid-sentence templates.
    expect(extractTopicNounPhrase("Photosynthesis")).toBe("photosynthesis");
    expect(extractTopicNounPhrase("Respiration")).toBe("respiration");
    expect(extractTopicNounPhrase("Mitosis")).toBe("mitosis");
    expect(extractTopicNounPhrase("Bioenergetics")).toBe("bioenergetics");
    expect(extractTopicNounPhrase("Trigonometry")).toBe("trigonometry");
  });

  it("preserves apostrophe-led possessive proper nouns even when not whitelisted", () => {
    // Structural cue: any Title-Case first word ending in apostrophe-s is
    // treated as a proper noun ("Murphy's Law", "O'Brien's Castle").
    expect(extractTopicNounPhrase("Murphy's Law")).toBe("Murphy's Law");
    expect(extractTopicNounPhrase("Pythagoras' Theorem")).toBe("Pythagoras' Theorem");
  });

  it("preserves Act / Scene / Chapter references even when the head word isn't whitelisted", () => {
    // Structural cue: literary or historical works with a numbered Act /
    // Scene / Chapter / Volume / Part keep their casing.
    expect(extractTopicNounPhrase("Animal Farm Chapter 4")).toBe("Animal Farm Chapter 4");
    expect(extractTopicNounPhrase("The Tempest Act 2 Scene 1")).toBe("The Tempest Act 2 Scene 1");
  });

  it("returns a usable value for empty / whitespace topics", () => {
    expect(extractTopicNounPhrase("")).toBe("");
    expect(extractTopicNounPhrase("   ")).toBe("");
  });
});

describe("Phase 2 / pickCommandWords", () => {
  it("echoes the verbs from the worksheet's own questions when supplied", () => {
    const out = pickCommandWords("Mathematics", ["Calculate", "Solve", "Show that"], 5);
    expect(out.slice(0, 3)).toEqual(["Calculate", "Solve", "Show that"]);
    expect(out.length).toBe(5);
  });

  it("dedupes case-insensitively when the AI emits the same verb mixed casing", () => {
    const out = pickCommandWords("Mathematics", ["calculate", "CALCULATE", "Solve"], 5);
    expect(out[0]).toBe("Calculate");
    expect(out.filter(w => w === "Calculate").length).toBe(1);
  });

  it("pads from the per-subject default table when the worksheet's own list is short", () => {
    const out = pickCommandWords("Biology", ["Describe"], 5);
    expect(out[0]).toBe("Describe");
    // Padded from the science default table (Describe / Explain / Calculate
    // / Compare / Evaluate). Describe is already taken so the remaining 4
    // come from the rest of the table.
    expect(out.length).toBe(5);
    expect(out).toContain("Explain");
    expect(out).toContain("Compare");
  });

  it("falls back to a per-subject default when the question bank field is empty", () => {
    expect(pickCommandWords("Mathematics", [], 5)).toEqual(["Calculate", "Solve", "Find", "Show that", "Determine"]);
    expect(pickCommandWords("Biology", undefined, 5)).toEqual(["Describe", "Explain", "Calculate", "Compare", "Evaluate"]);
    expect(pickCommandWords("English Literature", [], 5)).toEqual(["Identify", "Describe", "Explain", "Analyse", "Evaluate"]);
    expect(pickCommandWords("History", [], 5)).toEqual(["Describe", "Explain", "Compare", "Analyse", "Evaluate"]);
  });
});

describe("Phase 2 / buildSelfReflection — topic-anchored output", () => {
  it("produces 5 I-can statements + 2 written prompts + a topic-anchored exit ticket for Year 9 Mathematics 'Adding fractions'", () => {
    const out = buildSelfReflection({
      topic: "Adding fractions",
      subject: "Mathematics",
      year: "Year 9",
      commandWordsUsed: ["Calculate", "Solve"],
    });
    expect(out.iCanStatements.length).toBe(5);
    expect(out.writtenPrompts.length).toBe(2);
    expect(out.exitTicket).toMatch(/adding fractions/i);
    // Every I-can statement must mention the topic noun.
    for (const s of out.iCanStatements) {
      expect(s.toLowerCase()).toContain("adding fractions");
      expect(s.startsWith("I can")).toBe(true);
    }
    // Maths verbs from the supplied list should win the leading slots.
    expect(out.iCanStatements[0]).toMatch(/^I can Calculate/);
    expect(out.iCanStatements[1]).toMatch(/^I can Solve/);
  });

  it("produces topic-anchored output for Year 11 English Literature 'Macbeth Act 1 Scene 5'", () => {
    const out = buildSelfReflection({
      topic: "Macbeth Act 1 Scene 5",
      subject: "English Literature",
      year: "Year 11",
    });
    expect(out.iCanStatements.length).toBe(5);
    for (const s of out.iCanStatements) {
      expect(s).toContain("Macbeth Act 1 Scene 5");
    }
    expect(out.exitTicket).toContain("Macbeth Act 1 Scene 5");
    // English Lit defaults: Identify / Describe / Explain / Analyse / Evaluate.
    expect(out.iCanStatements[0]).toMatch(/^I can Identify/);
    expect(out.iCanStatements[3]).toMatch(/^I can Analyse/);
  });

  it("produces topic-anchored output for Year 11 Biology 'Bioenergetics'", () => {
    const out = buildSelfReflection({
      topic: "Bioenergetics",
      subject: "Biology",
      year: "Year 11",
    });
    expect(out.iCanStatements.length).toBe(5);
    for (const s of out.iCanStatements) {
      expect(s.toLowerCase()).toContain("bioenergetics");
    }
    // Science defaults: Describe / Explain / Calculate / Compare / Evaluate.
    expect(out.iCanStatements[0]).toMatch(/^I can Describe/);
    expect(out.iCanStatements[1]).toMatch(/^I can Explain/);
  });

  it("produces topic-anchored output for KS3 History 'The Norman Conquest'", () => {
    const out = buildSelfReflection({
      topic: "The Norman Conquest",
      subject: "History",
      year: "Year 8",
    });
    expect(out.iCanStatements.length).toBe(5);
    // Topic noun phrase strips the leading "The" and lower-cases.
    for (const s of out.iCanStatements) {
      expect(s.toLowerCase()).toContain("norman conquest");
    }
    expect(out.exitTicket.toLowerCase()).toContain("norman conquest");
  });

  it("uses the sentence-starter SEND register for SLCN / EAL pupils", () => {
    const out = buildSelfReflection({
      topic: "Photosynthesis",
      subject: "Biology",
      sendKey: "eal",
    });
    expect(out.iCanStatements.length).toBe(5);
    // Sentence-starter register uses simpler frames than the standard
    // command-word frames — the lead frame is "I can talk about …".
    expect(out.iCanStatements[0]).toMatch(/^I can talk about photosynthesis/);
    // Every statement still names the topic noun phrase.
    for (const s of out.iCanStatements) {
      expect(s.toLowerCase()).toContain("photosynthesis");
    }
  });

  it("uses the emotional check-in SEND register for SEMH / Anxiety / PDA pupils", () => {
    const out = buildSelfReflection({
      topic: "Quadratic Equations",
      subject: "Mathematics",
      sendKey: "semh",
    });
    expect(out.subtitle).toBe("How are you feeling?");
    expect(out.exitTicket).toContain("quadratic equations");
    expect(out.writtenPrompts[0]).toMatch(/felt confident/i);
  });

  it("uses the older-learner register for adult / older-learners pupils", () => {
    const out = buildSelfReflection({
      topic: "GDPR",
      subject: "Citizenship",
      sendKey: "older-learners",
    });
    expect(out.subtitle).toBe("Review your learning.");
    expect(out.exitTicket).toMatch(/key point/i);
    expect(out.exitTicket).toContain("GDPR");
  });

  it("is a pure function — identical inputs produce identical output", () => {
    const a = buildSelfReflection({ topic: "Photosynthesis", subject: "Biology" });
    const b = buildSelfReflection({ topic: "Photosynthesis", subject: "Biology" });
    expect(a).toEqual(b);
  });
});

describe("Phase 2 / isGenericSelfReflection — generic-content detector", () => {
  const goodContent = renderSelfReflectionAsMarkerBlock(
    buildSelfReflection({ topic: "Adding fractions", subject: "Mathematics" }),
  );

  it("treats deterministic builder output as NOT generic", () => {
    expect(isGenericSelfReflection(goodContent, "Adding fractions")).toBe(false);
  });

  it("flags the literal `I can ___` placeholder as generic", () => {
    const bad = "SUBTITLE: Review.\nWRITTEN_PROMPTS:\nI can ___.\nEXIT_TICKET: Write ONE thing you learned today about Adding fractions:";
    expect(isGenericSelfReflection(bad, "Adding fractions")).toBe(true);
  });

  it("flags the long-standing 'apply what I have learned' fallback as generic", () => {
    const bad = "I can apply what I have learned today";
    expect(isGenericSelfReflection(bad, "Adding fractions")).toBe(true);
  });

  it("flags reflection blocks with fewer than 5 I-can statements as generic", () => {
    const bad = "CONFIDENCE_TABLE:\nI can Calculate adding fractions.\nI can Solve adding fractions.\nEXIT_TICKET: Write one thing you learned today about Adding fractions:";
    expect(isGenericSelfReflection(bad, "Adding fractions")).toBe(true);
  });

  it("flags an exit ticket that does not mention the topic noun as generic", () => {
    const bad = "CONFIDENCE_TABLE:\nI can Calculate adding fractions.\nI can Solve adding fractions.\nI can Find adding fractions.\nI can Show that adding fractions.\nI can Determine adding fractions.\nEXIT_TICKET: Write one thing you learned today.";
    expect(isGenericSelfReflection(bad, "Adding fractions")).toBe(true);
  });

  it("treats a ≥5-statement, topic-anchored block with a topic-named exit ticket as NOT generic", () => {
    const ok =
      "CONFIDENCE_TABLE:\n" +
      "I can Calculate confidently when the question is about quadratic equations.\n" +
      "I can Solve the key ideas in quadratic equations using the right vocabulary.\n" +
      "I can Find a question about quadratic equations with a worked answer.\n" +
      "I can Show that what I have learned about quadratic equations to a new problem.\n" +
      "I can Determine my own answer about quadratic equations and spot mistakes.\n" +
      "EXIT_TICKET: Write ONE thing you learned today about quadratic equations.";
    expect(isGenericSelfReflection(ok, "Quadratic Equations")).toBe(false);
  });

  it("returns true for empty content (so the validator builds something)", () => {
    expect(isGenericSelfReflection("", "Adding fractions")).toBe(true);
    expect(isGenericSelfReflection("   ", "Adding fractions")).toBe(true);
  });

  it("does not falsely anchor short topic acronyms against incidental substrings", () => {
    // Fix for the substring-anchor false positive flagged in PR #75:
    // topic="IT" used to substring-match "write" / "explain", and
    // topic="AI" used to substring-match "explain" / "fail" / "wait",
    // letting generic placeholder content sneak through as "topic-
    // anchored". Word-boundary matching for short needles closes that.
    const generic =
      "CONFIDENCE_TABLE:\n" +
      "I can write something interesting.\n" +
      "I can explain my thinking clearly.\n" +
      "I can find a good example.\n" +
      "I can show that I have understood.\n" +
      "I can determine my next step.\n" +
      "EXIT_TICKET: Write ONE thing you learned today.";
    expect(isGenericSelfReflection(generic, "IT")).toBe(true);
    expect(isGenericSelfReflection(generic, "AI")).toBe(true);
    expect(isGenericSelfReflection(generic, "UK")).toBe(true);
  });

  it("still anchors correctly when the short acronym is genuinely present as a word", () => {
    // The fix should not over-correct: when "IT" / "AI" appear as actual
    // standalone tokens (which is how the topic word would appear in a
    // genuine reflection statement), the validator should still treat
    // the content as topic-anchored.
    const ok =
      "CONFIDENCE_TABLE:\n" +
      "I can describe how IT is used in classrooms.\n" +
      "I can explain the role of IT in modern teaching.\n" +
      "I can identify IT systems used in primary schools.\n" +
      "I can compare different IT tools for SEND learners.\n" +
      "I can evaluate the benefits of IT for accessibility.\n" +
      "EXIT_TICKET: Write ONE thing you learned today about IT in a single sentence.";
    expect(isGenericSelfReflection(ok, "IT")).toBe(false);
  });
});

describe("Phase 2 / enforceSelfReflectionTopicAnchor", () => {
  /** Helper — the exact generic placeholder shape the AI used to emit on the
   *  SEND sentence-starter branch in ai.ts:2810 before Phase 2 fixed it. */
  const genericContent = "SUBTITLE: Review your understanding.\nWRITTEN_PROMPTS:\nI can ___.\nEXIT_TICKET: Write ONE thing you learned today about Adding fractions in a single sentence:";

  /** Helper — a realistic, topic-anchored content shape (the kind a
   *  well-behaved AI would emit). Five I-can statements all naming the
   *  topic, two written prompts, and a topic-named exit ticket. */
  const goodAiContent =
    "SUBTITLE: Review your understanding.\n" +
    "CONFIDENCE_TABLE:\n" +
    "I can Calculate the sum of two fractions with the same denominator about adding fractions.\n" +
    "I can Solve a missing-numerator problem about adding fractions.\n" +
    "I can Find a common denominator before performing adding fractions.\n" +
    "I can Show that two fractions are equal in a problem about adding fractions.\n" +
    "I can Determine a final simplified result when adding fractions.\n" +
    "WRITTEN_PROMPTS:\n" +
    "One thing I now understand about adding fractions is …\n" +
    "One question I still want to ask about adding fractions is …\n" +
    "EXIT_TICKET: Write ONE thing you learned today about adding fractions in a single sentence:";

  it("rewrites a generic Self-Reflection section to topic-anchored builder output", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "self-reflection", title: "Self Reflection", teacherOnly: false, content: genericContent },
      ],
    };
    const r = enforceSelfReflectionTopicAnchor(ws, {
      subject: "Mathematics",
      yearGroup: "Year 9",
      topic: "Adding fractions",
    });
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0]).toMatch(/generic|not topic-anchored/i);
    const replaced = r.worksheet.sections![0].content || "";
    expect(replaced).not.toMatch(/I can _{2,}/);
    expect(replaced.toLowerCase()).toContain("adding fractions");
    // After the rewrite the section is no longer generic.
    expect(isGenericSelfReflection(replaced, "Adding fractions")).toBe(false);
  });

  it("is a no-op when the AI emitted good topic-anchored content", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "self-reflection", title: "Self Reflection", teacherOnly: false, content: goodAiContent },
      ],
    };
    const r = enforceSelfReflectionTopicAnchor(ws, {
      subject: "Mathematics",
      yearGroup: "Year 9",
      topic: "Adding fractions",
    });
    expect(r.warnings.length).toBe(0);
    expect(r.worksheet.sections![0].content).toBe(goodAiContent);
  });

  it("never overwrites good non-generic content even when topic varies in case / inflection", () => {
    // Good content uses 'adding fractions' lower-case; topic is 'ADDING FRACTIONS'.
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "ADDING FRACTIONS", yearGroup: "Year 9" },
      sections: [
        { type: "self-reflection", title: "Self Reflection", teacherOnly: false, content: goodAiContent },
      ],
    };
    const r = enforceSelfReflectionTopicAnchor(ws, {
      subject: "Mathematics",
      yearGroup: "Year 9",
      topic: "ADDING FRACTIONS",
    });
    expect(r.warnings.length).toBe(0);
    expect(r.worksheet.sections![0].content).toBe(goodAiContent);
  });

  it("is idempotent — running twice produces the same worksheet", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "self-reflection", title: "Self Reflection", teacherOnly: false, content: genericContent },
      ],
    };
    const r1 = enforceSelfReflectionTopicAnchor(ws, {
      subject: "Mathematics",
      yearGroup: "Year 9",
      topic: "Adding fractions",
    });
    const r2 = enforceSelfReflectionTopicAnchor(r1.worksheet, {
      subject: "Mathematics",
      yearGroup: "Year 9",
      topic: "Adding fractions",
    });
    // Second pass adds no warnings (the rewrite is already topic-anchored).
    expect(r2.warnings.length).toBe(0);
    expect(r2.worksheet.sections![0].content).toBe(r1.worksheet.sections![0].content);
  });

  it("is a no-op when the worksheet has no Self-Reflection section", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions" },
      sections: [
        { type: "q-short-answer", title: "Q1", content: "Calculate 1/2 + 1/3.", teacherOnly: false },
      ],
    };
    const r = enforceSelfReflectionTopicAnchor(ws, { topic: "Adding fractions" });
    expect(r.warnings.length).toBe(0);
    expect(r.worksheet).toEqual(ws);
  });

  it("warns and skips when no topic is supplied (so the bug is visible)", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics" },
      sections: [
        { type: "self-reflection", title: "Self Reflection", teacherOnly: false, content: genericContent },
      ],
    };
    const r = enforceSelfReflectionTopicAnchor(ws, {});
    expect(r.warnings.join(" ")).toMatch(/no topic supplied/i);
    // Content untouched — we never rebuild without a topic to anchor to.
    expect(r.worksheet.sections![0].content).toBe(genericContent);
  });

  it("ignores teacher-only Self-Reflection sections (only fixes the pupil view)", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions" },
      sections: [
        { type: "self-reflection", title: "Self Reflection (Teacher Copy)", teacherOnly: true, content: genericContent },
      ],
    };
    const r = enforceSelfReflectionTopicAnchor(ws, { topic: "Adding fractions" });
    expect(r.warnings.length).toBe(0);
    expect(r.worksheet.sections![0].content).toBe(genericContent);
  });

  it("uses the SEND register inferred from opts.sendNeed when rewriting", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions" },
      sections: [
        { type: "self-reflection", title: "Self Reflection", teacherOnly: false, content: genericContent },
      ],
    };
    const r = enforceSelfReflectionTopicAnchor(ws, {
      subject: "Mathematics",
      topic: "Adding fractions",
      sendNeed: "EAL",
    });
    const replaced = r.worksheet.sections![0].content || "";
    // Sentence-starter register's lead frame.
    expect(replaced).toMatch(/I can talk about adding fractions/);
  });
});

// ─── Phase 3 — Revision Tips builder ─────────────────────────────────────────

describe("Phase 3 / buildRevisionTips — examiner-voice 5-tip output", () => {
  it("returns exactly 5 tips in the canonical category order", () => {
    const out = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics" });
    expect(out.tips).toHaveLength(5);
    expect(out.tips.map(t => t.category)).toEqual([
      "command-word",
      "misconception",
      "method",
      "mark-scheme",
      "time",
    ]);
    expect(out.tips.map(t => t.label)).toEqual([
      "COMMAND WORD",
      "WATCH OUT",
      "METHOD",
      "MARK SCHEME",
      "TIME",
    ]);
  });

  it("topic-anchors the misconception tip on Year 9 Mathematics 'Adding fractions'", () => {
    const out = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics", year: "Year 9" });
    const misconception = out.tips.find(t => t.category === "misconception")!;
    // Topic noun should appear lower-cased inside the misconception tip.
    expect(misconception.text.toLowerCase()).toContain("adding fractions");
    // Maths default mentions skipping a method line / converting units.
    expect(misconception.text).toMatch(/method line|convert(ing)? units/i);
  });

  it("topic-anchors on Year 10 English Literature 'Macbeth Act 1 Scene 5'", () => {
    const out = buildRevisionTips({
      topic: "Macbeth Act 1 Scene 5",
      subject: "English Literature",
      year: "Year 10",
    });
    const misconception = out.tips.find(t => t.category === "misconception")!;
    expect(misconception.text).toContain("Macbeth Act 1 Scene 5");
    // Literature method tip mentions embedding quotations.
    const method = out.tips.find(t => t.category === "method")!;
    expect(method.text).toMatch(/quotation|quote/i);
  });

  it("topic-anchors on Year 11 Biology 'Bioenergetics'", () => {
    const out = buildRevisionTips({
      topic: "Bioenergetics",
      subject: "Biology",
      year: "Year 11",
    });
    const misconception = out.tips.find(t => t.category === "misconception")!;
    // Lower-cased noun phrase ("bioenergetics") is what the noun
    // extractor returns for single-word common-noun topics.
    expect(misconception.text.toLowerCase()).toContain("bioenergetics");
    const method = out.tips.find(t => t.category === "method")!;
    expect(method.text).toMatch(/SI unit|formula|substitut/i);
  });

  it("topic-anchors on KS3 History 'Norman Conquest'", () => {
    const out = buildRevisionTips({
      topic: "Norman Conquest",
      subject: "History",
      year: "Year 8",
    });
    const misconception = out.tips.find(t => t.category === "misconception")!;
    // History uses the proper-noun-led casing path (Norman is whitelisted).
    expect(misconception.text).toContain("Norman Conquest");
    const method = out.tips.find(t => t.category === "method")!;
    expect(method.text).toMatch(/date|source|named figure/i);
  });

  it("echoes the FIRST command word actually used on the worksheet", () => {
    const out = buildRevisionTips({
      topic: "Quadratic equations",
      subject: "Mathematics",
      commandWordsUsed: ["solve", "Show that", "Find"],
    });
    const cw = out.tips.find(t => t.category === "command-word")!;
    // pickCommandWords canonicalises to "Solve" (title case).
    expect(cw.text).toContain("\"Solve");
  });

  it("falls back to the per-subject default command word when no list is supplied", () => {
    const mathsOut = buildRevisionTips({ topic: "Pythagoras", subject: "Mathematics" });
    const enLitOut = buildRevisionTips({ topic: "Macbeth", subject: "English Literature" });
    // Maths default ladder leads with Calculate.
    expect(mathsOut.tips[0].text).toContain("\"Calculate");
    // EnglishLit default ladder leads with Identify.
    expect(enLitOut.tips[0].text).toContain("\"Identify");
  });

  it("surfaces a supplied misconception verbatim (sentence-cased, bullet-stripped, capped)", () => {
    const out = buildRevisionTips({
      topic: "Adding fractions",
      subject: "Mathematics",
      misconceptions: [
        "• common mistake: pupils add the numerators AND denominators instead of finding a common denominator first.",
      ],
    });
    const m = out.tips.find(t => t.category === "misconception")!;
    expect(m.text).toMatch(/^Pupils add the numerators/);
    expect(m.text).not.toContain("•");
    expect(m.text).not.toMatch(/^common mistake/i);
  });

  it("anchors the time tip to the worksheet's total marks", () => {
    const out = buildRevisionTips({
      topic: "Algebra",
      subject: "Mathematics",
      marksUsed: [1, 1, 1, 2, 2, 3, 4, 5, 6, 8],
    });
    const time = out.tips.find(t => t.category === "time")!;
    // Total = 33 marks → ~33 minutes budget; tip mentions one minute per mark.
    expect(time.text).toMatch(/about\s+33\s+minutes/);
    expect(time.text).toMatch(/one minute per mark/i);
    // The 8-mark stretch question is name-checked.
    expect(time.text).toMatch(/8-mark stretch question/);
  });

  it("anchors the mark-scheme tip to the longest tariff and the awarding body", () => {
    const out = buildRevisionTips({
      topic: "Photosynthesis",
      subject: "Biology",
      examBoard: "AQA",
      marksUsed: [1, 1, 2, 6, 4],
    });
    const ms = out.tips.find(t => t.category === "mark-scheme")!;
    expect(ms.text).toContain("6-mark question");
    expect(ms.text).toContain("AQA");
  });

  it("falls back to a topic-only mark-scheme tip when no marks are supplied", () => {
    const out = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics" });
    const ms = out.tips.find(t => t.category === "mark-scheme")!;
    expect(ms.text).toContain("the longest question on adding fractions");
  });

  it("shortens tips on sentence-starter SEND register", () => {
    const standard = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics" });
    const eal = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics", sendKey: "eal" });
    // Sentence-starter register reads aloud — tips should be shorter
    // than the equivalent standard-register tip.
    for (let i = 0; i < 5; i++) {
      expect(eal.tips[i].text.length).toBeLessThanOrEqual(standard.tips[i].text.length);
    }
    // Subtitle is the read-aloud variant.
    expect(eal.subtitle).toMatch(/read\s+these\s+tips\s+out\s+loud/i);
  });

  it("uses the older-learner subtitle for adult-mode worksheets", () => {
    const out = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics", sendKey: "older-learners" });
    expect(out.subtitle).toMatch(/examiner tips before you attempt/i);
  });

  it("is pure — same inputs always yield the same output", () => {
    const a = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics", year: "Year 9" });
    const b = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics", year: "Year 9" });
    expect(a).toEqual(b);
  });
});

describe("Phase 3 / renderRevisionTipsAsMarkerBlock — marker block format", () => {
  it("emits SUBTITLE: + TIPS: + 5 numbered LABEL: lines", () => {
    const out = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics" });
    const text = renderRevisionTipsAsMarkerBlock(out);
    expect(text).toMatch(/^SUBTITLE: /m);
    expect(text).toMatch(/^TIPS:/m);
    expect(text).toMatch(/^1\. COMMAND WORD: /m);
    expect(text).toMatch(/^2\. WATCH OUT: /m);
    expect(text).toMatch(/^3\. METHOD: /m);
    expect(text).toMatch(/^4\. MARK SCHEME: /m);
    expect(text).toMatch(/^5\. TIME: /m);
  });

  it("round-trips a builder output through the marker-block format unchanged on isGenericRevisionTips", () => {
    const out = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics" });
    const text = renderRevisionTipsAsMarkerBlock(out);
    expect(isGenericRevisionTips(text, "Adding fractions")).toBe(false);
  });
});

describe("Phase 3 / isGenericRevisionTips — generic-content detection", () => {
  it("flags empty content", () => {
    expect(isGenericRevisionTips("", "Adding fractions")).toBe(true);
    expect(isGenericRevisionTips("   ", "Adding fractions")).toBe(true);
  });

  it("flags placeholder stems", () => {
    expect(isGenericRevisionTips("Make sure you revise carefully and study hard. Good luck!", "Adding fractions")).toBe(true);
    expect(isGenericRevisionTips("Make sure you understand the topic before the test.", "Adding fractions")).toBe(true);
    expect(isGenericRevisionTips("TIPS:\n1. [Tip 1]\n2. [Tip 2]\n3. [Tip 3]\n4. [Tip 4]\n5. [Tip 5]", "Adding fractions")).toBe(true);
    expect(isGenericRevisionTips("TIPS:\n1. _________\n2. _________\n3. _________\n4. _________\n5. _________", "Adding fractions")).toBe(true);
  });

  it("flags content with fewer than 5 tip-shaped lines", () => {
    expect(isGenericRevisionTips("TIPS:\n1. COMMAND WORD: Calculate carefully on adding fractions.", "Adding fractions")).toBe(true);
  });

  it("flags content that does not name the topic noun", () => {
    const offTopic = `TIPS:
1. COMMAND WORD: Calculate carefully — show every step.
2. WATCH OUT: Pupils often skip a method line.
3. METHOD: Always include the units.
4. MARK SCHEME: Top-band answers reach a clear judgement.
5. TIME: Spend about one minute per mark.`;
    expect(isGenericRevisionTips(offTopic, "Adding fractions")).toBe(true);
  });

  it("flags content that contains no UK awarding-body command word", () => {
    const noVerb = `TIPS:
1. THINK: Read the question on adding fractions.
2. PLAN: Write a sentence about adding fractions.
3. WORK: Try the adding fractions question.
4. CHECK: Look back at adding fractions.
5. RELAX: Take your time with adding fractions.`;
    expect(isGenericRevisionTips(noVerb, "Adding fractions")).toBe(true);
  });

  it("does NOT flag a builder-quality output", () => {
    const out = buildRevisionTips({ topic: "Adding fractions", subject: "Mathematics" });
    const text = renderRevisionTipsAsMarkerBlock(out);
    expect(isGenericRevisionTips(text, "Adding fractions")).toBe(false);
  });

  it("does NOT flag a teacher-edited variant that still has 5 tips, the topic and a command word", () => {
    const teacherEdited = `SUBTITLE: My own examiner notes for the class.
TIPS:
1. COMMAND WORD: When the question says "Calculate ...", just give the number.
2. WATCH OUT: Common slip on adding fractions — denominators are not added.
3. METHOD: Find the LCD first on adding fractions.
4. MARK SCHEME: One mark for the LCD, one for the answer in lowest terms.
5. TIME: Save 8 minutes for the longest adding-fractions question.`;
    expect(isGenericRevisionTips(teacherEdited, "Adding fractions")).toBe(false);
  });
});

describe("Phase 3 / enforceRevisionTipsPresence — validator behaviour", () => {
  it("no-ops when no revision-tips section is present (Phase 3 is opt-in)", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "learning-objective", title: "LO", teacherOnly: false, content: "I can add fractions." },
      ],
    };
    const r = enforceRevisionTipsPresence(ws, { topic: "Adding fractions", subject: "Mathematics" });
    expect(r.warnings).toHaveLength(0);
    expect(r.worksheet.sections).toHaveLength(1);
    expect(r.worksheet.sections![0].content).toBe("I can add fractions.");
  });

  it("warns and skips when no topic is supplied (and metadata.topic is missing)", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics" },
      sections: [
        { type: "revision-tips", title: "Examiner Tips", teacherOnly: false, content: "revise carefully" },
      ],
    };
    const r = enforceRevisionTipsPresence(ws);
    expect(r.warnings.some(w => /no topic supplied/.test(w))).toBe(true);
    expect(r.worksheet.sections![0].content).toBe("revise carefully");
  });

  it("rewrites generic content with builder output", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "revision-tips", title: "Examiner Tips", teacherOnly: false, content: "Make sure you revise carefully and study hard. Good luck!" },
      ],
    };
    const r = enforceRevisionTipsPresence(ws, {
      topic: "Adding fractions",
      subject: "Mathematics",
      yearGroup: "Year 9",
    });
    expect(r.warnings.some(w => /Revision-Tips content was generic/.test(w))).toBe(true);
    const rewritten = r.worksheet.sections![0].content || "";
    expect(rewritten).toMatch(/^TIPS:/m);
    expect(rewritten).toMatch(/^1\. COMMAND WORD: /m);
    expect(rewritten.toLowerCase()).toContain("adding fractions");
  });

  it("never overwrites good topic-anchored content", () => {
    const good = renderRevisionTipsAsMarkerBlock(buildRevisionTips({
      topic: "Adding fractions",
      subject: "Mathematics",
    }));
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "revision-tips", title: "Examiner Tips", teacherOnly: false, content: good },
      ],
    };
    const r = enforceRevisionTipsPresence(ws, { topic: "Adding fractions", subject: "Mathematics" });
    expect(r.warnings).toHaveLength(0);
    expect(r.worksheet.sections![0].content).toBe(good);
  });

  it("is idempotent — running twice produces the same worksheet as running once", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "revision-tips", title: "Examiner Tips", teacherOnly: false, content: "study hard, good luck" },
      ],
    };
    const once = enforceRevisionTipsPresence(ws, { topic: "Adding fractions", subject: "Mathematics" });
    const twice = enforceRevisionTipsPresence(once.worksheet, { topic: "Adding fractions", subject: "Mathematics" });
    expect(twice.warnings).toHaveLength(0);
    expect(twice.worksheet.sections![0].content).toBe(once.worksheet.sections![0].content);
  });

  it("scrapes the worksheet's actual command words and uses them in the rewrite", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "q-extended", title: "Q1", teacherOnly: false, content: "Show that the sum of 1/2 and 1/3 is 5/6. [3 marks]", marks: 3 },
        { type: "q-short-answer", title: "Q2", teacherOnly: false, content: "Calculate 1/4 + 2/5. [2 marks]", marks: 2 },
        { type: "revision-tips", title: "Examiner Tips", teacherOnly: false, content: "revise carefully and good luck" },
      ],
    };
    const r = enforceRevisionTipsPresence(ws, { topic: "Adding fractions", subject: "Mathematics" });
    const rewritten = String(r.worksheet.sections![2].content || "");
    // First question's leading verb is "Show that" — should appear in
    // the COMMAND WORD tip rather than the default "Calculate".
    expect(rewritten).toMatch(/COMMAND WORD: When the question says "Show that/);
  });

  it("scrapes a misconception from the Common Mistakes section and surfaces it in the rewrite", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "common-mistakes", title: "Common Mistakes", teacherOnly: false, content: "• Pupils add both numerators AND denominators when adding two fractions, instead of finding a common denominator first." },
        { type: "revision-tips", title: "Examiner Tips", teacherOnly: false, content: "study hard for the test, good luck" },
      ],
    };
    const r = enforceRevisionTipsPresence(ws, { topic: "Adding fractions", subject: "Mathematics" });
    const rewritten = String(r.worksheet.sections![1].content || "");
    expect(rewritten).toMatch(/WATCH OUT: Pupils add both numerators AND denominators/);
  });

  it("scrapes the largest mark tariff and uses it in the rewrite", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Biology", topic: "Photosynthesis", yearGroup: "Year 11", examBoard: "AQA" },
      sections: [
        { type: "q-short-answer", title: "Q1", teacherOnly: false, content: "Describe photosynthesis. [2 marks]", marks: 2 },
        { type: "q-extended", title: "Q5", teacherOnly: false, content: "Evaluate the role of chlorophyll. [6 marks]", marks: 6 },
        { type: "revision-tips", title: "Examiner Tips", teacherOnly: false, content: "make sure you revise carefully" },
      ],
    };
    const r = enforceRevisionTipsPresence(ws, { topic: "Photosynthesis", subject: "Biology", examBoard: "AQA" });
    const rewritten = String(r.worksheet.sections![2].content || "");
    expect(rewritten).toContain("6-mark question");
    expect(rewritten).toContain("AQA");
  });

  it("ignores teacher-only revision-tips sections", () => {
    const ws: PostValidatorWorksheet = {
      metadata: { subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9" },
      sections: [
        { type: "revision-tips", title: "Teacher Tips", teacherOnly: true, content: "internal teacher notes" },
      ],
    };
    const r = enforceRevisionTipsPresence(ws, { topic: "Adding fractions", subject: "Mathematics" });
    expect(r.warnings).toHaveLength(0);
    expect(r.worksheet.sections![0].content).toBe("internal teacher notes");
  });
});


// ─── Phase 5 — Curriculum-authority preamble + UK English validator ─────────

import {
  buildCurriculumAuthorityPreamble,
  buildNonNegotiablesBlock,
  buildPedagogicalRegisterNote,
  classifyKeyStage,
  UK_ENGLISH_SUBSTITUTIONS,
  BANNED_SOFTENERS,
  FABRICATED_AO_CODE_RE,
  PLACEHOLDER_LEAKAGE_RE,
  isUKEnglishCompliant,
  applyUKEnglishSubstitutions,
  findBannedSofteners,
  findFabricatedAoCodes,
  findPlaceholderLeakage,
} from "../../client/src/lib/curriculumAuthorityPrompt";

import {
  enforceCurriculumAuthorityInvariants,
} from "../../client/src/lib/worksheetPostValidator";

describe("Phase 5 — classifyKeyStage", () => {
  it("maps year group strings to the canonical key-stage label", () => {
    expect(classifyKeyStage("Year 1")).toBe("KS1");
    expect(classifyKeyStage("Year 2")).toBe("KS1");
    expect(classifyKeyStage("Year 3")).toBe("KS2");
    expect(classifyKeyStage("Year 6")).toBe("KS2");
    expect(classifyKeyStage("Year 7")).toBe("KS3");
    expect(classifyKeyStage("Year 9")).toBe("KS3");
    expect(classifyKeyStage("Year 10")).toBe("GCSE");
    expect(classifyKeyStage("Year 11")).toBe("GCSE");
    expect(classifyKeyStage("Year 12")).toBe("A-Level");
    expect(classifyKeyStage("Year 13")).toBe("A-Level");
  });
  it("falls back to KS3 (the median classroom) for unknown / missing input", () => {
    expect(classifyKeyStage(undefined)).toBe("KS3");
    expect(classifyKeyStage("")).toBe("KS3");
    expect(classifyKeyStage("Reception")).toBe("KS3");
  });
});

describe("Phase 5 — buildCurriculumAuthorityPreamble", () => {
  it("is deterministic — same input yields the same string", () => {
    const a = buildCurriculumAuthorityPreamble({
      subject: "Mathematics", yearGroup: "Year 10", examBoard: "AQA",
      topic: "Adding fractions", isSTEM: true,
    });
    const b = buildCurriculumAuthorityPreamble({
      subject: "Mathematics", yearGroup: "Year 10", examBoard: "AQA",
      topic: "Adding fractions", isSTEM: true,
    });
    expect(a).toBe(b);
  });
  it("opens with CURRICULUM AUTHORITY and binds the (board × year × topic) tuple at GCSE", () => {
    const p = buildCurriculumAuthorityPreamble({
      subject: "Mathematics", yearGroup: "Year 10", examBoard: "AQA",
      topic: "Adding fractions",
    });
    expect(p).toMatch(/CURRICULUM AUTHORITY/);
    expect(p).toMatch(/UK National Curriculum/);
    expect(p).toMatch(/gov\.uk/);
    expect(p).toMatch(/AQA/);
    expect(p).toMatch(/Year 10/);
    expect(p).toMatch(/Adding fractions/);
    expect(p).toMatch(/AO1.*AO4/);
    expect(p).toMatch(/valid raw JSON/);
    expect(p).toMatch(/head of department/);
  });
  it("normalises the awarding-body label to its canonical UK form", () => {
    const edx = buildCurriculumAuthorityPreamble({
      subject: "Mathematics", yearGroup: "Year 10", examBoard: "edexcel",
      topic: "Quadratic equations",
    });
    expect(edx).toMatch(/Pearson Edexcel/);
    const wjec = buildCurriculumAuthorityPreamble({
      subject: "Geography", yearGroup: "Year 11", examBoard: "wjec",
      topic: "Coastal landscapes",
    });
    expect(wjec).toMatch(/WJEC/);
  });
  it("KS3 scaffolds with school scheme-of-work language and no awarding body", () => {
    const ks3 = buildCurriculumAuthorityPreamble({
      subject: "Science", yearGroup: "Year 8", topic: "Electricity",
    });
    expect(ks3).toMatch(/KS3 scheme of work/);
    expect(ks3).not.toMatch(/AQA|Pearson Edexcel|OCR/);
  });
  it("KS1 / KS2 uses class-teacher language and no awarding body", () => {
    const ks2 = buildCurriculumAuthorityPreamble({
      subject: "Mathematics", yearGroup: "Year 5", topic: "Fractions",
    });
    expect(ks2).toMatch(/Key Stage 2/);
    expect(ks2).toMatch(/class teacher/);
    expect(ks2).not.toMatch(/AQA|Pearson Edexcel|OCR/);
  });
  it("never includes US-LLM defaults in its own preamble text", () => {
    const p = buildCurriculumAuthorityPreamble({
      subject: "Mathematics", yearGroup: "Year 10", examBoard: "AQA",
      topic: "Adding fractions",
    });
    expect(isUKEnglishCompliant(p)).toBe(true);
  });
});

describe("Phase 5 — buildNonNegotiablesBlock", () => {
  it("is static — same call always yields the same string", () => {
    expect(buildNonNegotiablesBlock()).toBe(buildNonNegotiablesBlock());
  });
  it("names all six non-negotiable clauses with their canonical headers", () => {
    const block = buildNonNegotiablesBlock();
    expect(block).toMatch(/NON-NEGOTIABLES/);
    expect(block).toMatch(/^1\. UK ENGLISH ONLY/m);
    expect(block).toMatch(/^2\. SI UNITS ONLY/m);
    expect(block).toMatch(/^3\. UK CONTEXTS ONLY/m);
    expect(block).toMatch(/^4\. NO COPYRIGHTED PAST-PAPER TEXT VERBATIM/m);
    expect(block).toMatch(/^5\. AWARDING-BODY COMMAND WORDS ONLY/m);
    expect(block).toMatch(/^6\. NO FABRICATED CODES/m);
  });
  it("names the canonical UK spelling forms verbatim so the prompt teaches by example", () => {
    const block = buildNonNegotiablesBlock();
    expect(block).toMatch(/colour/);
    expect(block).toMatch(/metre/);
    expect(block).toMatch(/aluminium/);
    expect(block).toMatch(/maths/);
    expect(block).toMatch(/AO1/);
  });
});

describe("Phase 5 — buildPedagogicalRegisterNote", () => {
  it("scales by key stage — KS2 is friendly, GCSE is examiner voice, A-Level is academic", () => {
    const ks2 = buildPedagogicalRegisterNote({ yearGroup: "Year 5" });
    const gcse = buildPedagogicalRegisterNote({ yearGroup: "Year 11" });
    const aLevel = buildPedagogicalRegisterNote({ yearGroup: "Year 13" });
    expect(ks2).toMatch(/KS2/);
    expect(gcse).toMatch(/examiner voice/i);
    expect(aLevel).toMatch(/A-Level/);
    expect(ks2).not.toBe(gcse);
    expect(gcse).not.toBe(aLevel);
  });
  it("appends a sciences-only line on science subjects reminding the model not to use the maths dot-grid box", () => {
    const sci = buildPedagogicalRegisterNote({
      subject: "Biology", yearGroup: "Year 10",
    });
    expect(sci).toMatch(/SI units/);
    expect(sci).toMatch(/maths-only/);
    const maths = buildPedagogicalRegisterNote({
      subject: "Mathematics", yearGroup: "Year 10",
    });
    expect(maths).not.toMatch(/maths-only/);
  });
});

describe("Phase 5 — UK_ENGLISH_SUBSTITUTIONS + applyUKEnglishSubstitutions", () => {
  it("rewrites every common US drift to UK English in pupil-facing content", () => {
    const cases: Array<[string, string]> = [
      ["The color of the solution", "The colour of the solution"],
      ["A 100 meter sprint", "A 100 metre sprint"],
      ["100 kilometers per hour", "100 kilometres per hour"],
      ["aluminum oxide", "aluminium oxide"],
      ["Solve this math problem", "Solve this maths problem"],
      ["Organize the data", "Organise the data"],
      ["Their behavior changed", "Their behaviour changed"],
      ["Visit the theater", "Visit the theatre"],
      ["At the center of the circle", "At the centre of the circle"],
      ["The gray rock", "The grey rock"],
      ["A traveler in Europe", "A traveller in Europe"],
      ["Defense of the realm", "Defence of the realm"],
      ["Their favorite book", "Their favourite book"],
      ["In honor of", "In honour of"],
      ["A friendly neighbor", "A friendly neighbour"],
    ];
    for (const [input, expected] of cases) {
      expect(applyUKEnglishSubstitutions(input).rewritten).toBe(expected);
    }
  });
  it("preserves case (lower / Title / UPPER) when rewriting", () => {
    expect(applyUKEnglishSubstitutions("color").rewritten).toBe("colour");
    expect(applyUKEnglishSubstitutions("Color").rewritten).toBe("Colour");
    expect(applyUKEnglishSubstitutions("COLOR").rewritten).toBe("COLOUR");
  });
  it("never touches Greek-root or instrument-name words containing -meter / math-* / etc.", () => {
    // Compound length-units rewrite (kilometer → kilometre) but Greek-root
    // words like parameter / diameter / perimeter and instrument-name words
    // like voltmeter / thermometer / barometer / ammeter are NEVER rewritten
    // because the regex word-boundaries forbid mid-word matches.
    const survivors = [
      "parameter", "diameter", "perimeter",
      "voltmeter", "thermometer", "barometer", "ammeter", "speedometer",
      "mathematics", "mathematician", "mathematical",
      "aftermath",
    ];
    for (const word of survivors) {
      const input = `The ${word} matters here.`;
      expect(applyUKEnglishSubstitutions(input).rewritten).toBe(input);
    }
  });
  it("is idempotent — running twice produces the same result with zero new substitutions on the second pass", () => {
    const input = "The color of the 100 meter aluminum bar — math problem.";
    const first = applyUKEnglishSubstitutions(input);
    expect(first.substitutions.length).toBeGreaterThan(0);
    const second = applyUKEnglishSubstitutions(first.rewritten);
    expect(second.rewritten).toBe(first.rewritten);
    expect(second.substitutions).toEqual([]);
  });
  it("emits one substitutions[] entry per fix so the validator can warn per drift", () => {
    const r = applyUKEnglishSubstitutions("color and color and color");
    expect(r.substitutions.length).toBe(3);
    for (const s of r.substitutions) {
      expect(s.label).toBe("color→colour");
      expect(s.from).toBe("color");
      expect(s.to).toBe("colour");
    }
  });
  it("isUKEnglishCompliant agrees with applyUKEnglishSubstitutions's no-op detection", () => {
    expect(isUKEnglishCompliant("Calculate the area in metres squared.")).toBe(true);
    expect(isUKEnglishCompliant("")).toBe(true);
    expect(isUKEnglishCompliant(null)).toBe(true);
    expect(isUKEnglishCompliant("Calculate the area in meters squared.")).toBe(false);
    expect(isUKEnglishCompliant("aluminum")).toBe(false);
  });
});

describe("Phase 5 — findBannedSofteners", () => {
  it("flags every banned softener phrase in pupil-facing content", () => {
    expect(findBannedSofteners("Have a think about photosynthesis.")).toHaveLength(1);
    expect(findBannedSofteners("Talk about your answer with a partner.")).toHaveLength(1);
    expect(findBannedSofteners("Make sure you revise this topic.")).toHaveLength(1);
    expect(findBannedSofteners("Make sure you study this topic.")).toHaveLength(1);
    expect(findBannedSofteners("Good luck on the exam!")).toHaveLength(1);
    expect(findBannedSofteners("Do your best.")).toHaveLength(1);
    expect(findBannedSofteners("Try your best.")).toHaveLength(1);
    expect(findBannedSofteners("Give it a go.")).toHaveLength(1);
    expect(findBannedSofteners("Study hard for the test.")).toHaveLength(1);
  });
  it("does not flag legitimate command-word stems", () => {
    expect(findBannedSofteners("Calculate the rate of photosynthesis.")).toHaveLength(0);
    expect(findBannedSofteners("Explain why the metal reacts.")).toHaveLength(0);
    expect(findBannedSofteners("Describe the function of the chloroplast.")).toHaveLength(0);
  });
});

describe("Phase 5 — findFabricatedAoCodes", () => {
  it("flags AO5 and higher (UK boards use AO1–AO4 only)", () => {
    expect(findFabricatedAoCodes("This question is AO5.")).toEqual(["AO5"]);
    expect(findFabricatedAoCodes("AO6 / AO7")).toEqual(["AO6", "AO7"]);
    expect(findFabricatedAoCodes("AO12")).toEqual(["AO12"]);
  });
  it("does not flag AO1 / AO2 / AO3 / AO4", () => {
    expect(findFabricatedAoCodes("AO1, AO2, AO3, AO4")).toEqual([]);
    expect(findFabricatedAoCodes("Mix of AO1 and AO3.")).toEqual([]);
  });
});

describe("Phase 5 — findPlaceholderLeakage", () => {
  it("flags template-literal leakage and bracket placeholders", () => {
    expect(findPlaceholderLeakage("State the formula for ${topic}.").length)
      .toBeGreaterThan(0);
    expect(findPlaceholderLeakage("Define [topic] in your own words.").length)
      .toBeGreaterThan(0);
    expect(findPlaceholderLeakage("[N marks]").length).toBeGreaterThan(0);
  });
  it("does not flag legitimate question text", () => {
    expect(findPlaceholderLeakage("Calculate 3 + 4. [2 marks]")).toEqual([]);
    expect(findPlaceholderLeakage("Define photosynthesis.")).toEqual([]);
  });
});

describe("Phase 5 — enforceCurriculumAuthorityInvariants", () => {
  it("is a no-op on a clean worksheet — no warnings, identical worksheet ref", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "Calculate 3 + 4. [2 marks]" },
        { type: "q-short", title: "Q2", content: "Explain photosynthesis." },
      ],
    };
    const r = enforceCurriculumAuthorityInvariants(ws);
    expect(r.warnings).toEqual([]);
    expect(r.worksheet).toBe(ws); // reference equality — true idempotency
  });
  it("silently rewrites US drift in pupil-facing content and warns once per drift", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Color question", content: "What color is the 100 meter mark?" },
      ],
    };
    const r = enforceCurriculumAuthorityInvariants(ws);
    expect(r.worksheet.sections![0].title).toBe("Colour question");
    expect(r.worksheet.sections![0].content).toBe("What colour is the 100 metre mark?");
    expect(r.warnings.length).toBe(3); // title color + content colour + content metre
    for (const w of r.warnings) expect(w).toMatch(/Phase 5 — UK English/);
  });
  it("skips teacherOnly sections (teacher-facing register has its own rules)", () => {
    const ws = {
      sections: [
        { type: "teacher-key", teacherOnly: true, content: "The teacher should color in the diagram for the pupil." },
      ],
    };
    const r = enforceCurriculumAuthorityInvariants(ws);
    expect(r.warnings).toEqual([]);
    expect(r.worksheet.sections![0].content).toMatch(/color/);
  });
  it("warns on banned softeners but does NOT silently rewrite", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "Have a think about your answer." },
      ],
    };
    const r = enforceCurriculumAuthorityInvariants(ws);
    expect(r.worksheet.sections![0].content).toBe("Have a think about your answer.");
    expect(r.warnings.some((w) => /Banned softener/.test(w))).toBe(true);
  });
  it("clamps fabricated AO codes in the structured field to AO1 and warns", () => {
    const ws = {
      sections: [
        { type: "q-extended", title: "Q1", content: "Explain.", ao: "AO5" },
      ],
    };
    const r = enforceCurriculumAuthorityInvariants(ws);
    expect((r.worksheet.sections![0] as { ao?: string }).ao).toBe("AO1");
    expect(r.warnings.some((w) => /Fabricated AO code "AO5"/.test(w))).toBe(true);
  });
  it("preserves valid AO codes (AO1–AO4) in the structured field", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "State.", ao: "AO1" },
        { type: "q-extended", title: "Q2", content: "Evaluate.", ao: "AO3" },
      ],
    };
    const r = enforceCurriculumAuthorityInvariants(ws);
    expect((r.worksheet.sections![0] as { ao?: string }).ao).toBe("AO1");
    expect((r.worksheet.sections![1] as { ao?: string }).ao).toBe("AO3");
    expect(r.warnings.filter((w) => /Fabricated AO/.test(w))).toEqual([]);
  });
  it("warns on placeholder leakage in pupil-facing content", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "Define ${topic} in your own words." },
        { type: "q-short", title: "Q2", content: "List three properties of [topic]. [N marks]" },
      ],
    };
    const r = enforceCurriculumAuthorityInvariants(ws);
    const leakageWarnings = r.warnings.filter((w) => /Placeholder leakage/.test(w));
    expect(leakageWarnings.length).toBeGreaterThanOrEqual(3);
  });
  it("is idempotent — second run produces zero new warnings and identical sections", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "What color is the meter mark?" },
      ],
    };
    const r1 = enforceCurriculumAuthorityInvariants(ws);
    const r2 = enforceCurriculumAuthorityInvariants(r1.worksheet);
    expect(r2.warnings).toEqual([]);
    expect(r2.worksheet.sections![0].content).toBe(r1.worksheet.sections![0].content);
  });
  it("integrates with runWorksheetPostValidators — Phase 5 warnings appear in the chain output", () => {
    const ws: PostValidatorWorksheet = {
      title: "Adding fractions worksheet",
      metadata: { subject: "Mathematics", yearGroup: "Year 10", topic: "Adding fractions" },
      sections: [
        { type: "q-short", title: "Q1", content: "Calculate the color of 100 meters." },
      ],
    };
    const r = runWorksheetPostValidators(ws, {
      subject: "Mathematics", yearGroup: "Year 10", topic: "Adding fractions",
    });
    expect(r.warnings.some((w) => /Phase 5 — UK English/.test(w))).toBe(true);
    expect(r.worksheet.sections![0].content).toBe("Calculate the colour of 100 metres.");
  });
});


// ─── PR-2 — Pure post-validators: command-word, SI units, reading age ──────
//
// Audit items #1, #2, #14. Three new validators, each pure / idempotent,
// each warn-only (never rewrites question content). All three are wired
// at the end of `runWorksheetPostValidators` so they audit the FINAL
// post-validated content.

import {
  enforceCommandWordFidelity,
  enforceSiUnitNormalisation,
  enforceReadingAgeBudget,
} from "../../client/src/lib/worksheetPostValidator";

import {
  findImperialUnits,
  isUnitConversionTopic,
  findOffSpecCommandWords,
  extractLeadingCommandWord,
  computeReadingAge,
  countSyllables,
  getCommandWordsForBoard,
  COMMAND_WORDS_BY_BOARD,
} from "../../client/src/lib/curriculumAuthorityPrompt";

describe("PR-2 / extractLeadingCommandWord", () => {
  it("strips checkbox + question number + bold prefix and returns the canonical verb", () => {
    expect(extractLeadingCommandWord("[ ] 1. **Calculate** the value of x")).toBe("calculate");
    expect(extractLeadingCommandWord("Q1. **Explain** why")).toBe("explain");
    expect(extractLeadingCommandWord("3) Describe the process")).toBe("describe");
    expect(extractLeadingCommandWord("**Show that** y = 2x + 3")).toBe("show that");
    expect(extractLeadingCommandWord("Work out 7 × 8")).toBe("work out");
  });

  it("returns null when the stem opens with a non-verb", () => {
    expect(extractLeadingCommandWord("The diagram shows a circuit.")).toBeNull();
    expect(extractLeadingCommandWord("")).toBeNull();
    expect(extractLeadingCommandWord("   ")).toBeNull();
  });

  it("handles emoji + checkbox decorators (ADHD profile)", () => {
    expect(extractLeadingCommandWord("🌿 [ ] **Calculate** the area")).toBe("calculate");
  });
});

describe("PR-2 / getCommandWordsForBoard + COMMAND_WORDS_BY_BOARD", () => {
  it("returns a non-empty list for every UK awarding-body code", () => {
    for (const code of ["aqa", "edexcel", "pearson", "ocr", "wjec", "eduqas", "ccea", "cie", "cambridge"]) {
      const list = getCommandWordsForBoard(code);
      expect(list.length).toBeGreaterThan(20);
      // The neutral set ("calculate", "describe", "explain") must be present
      // on every per-board union.
      expect(list).toContain("calculate");
      expect(list).toContain("describe");
      expect(list).toContain("explain");
    }
  });

  it("returns the KS-neutral set for unknown / missing boards (so KS3 / KS1+2 stays permissive)", () => {
    expect(getCommandWordsForBoard("").length).toBeGreaterThan(20);
    expect(getCommandWordsForBoard(null as unknown as string).length).toBeGreaterThan(20);
    expect(getCommandWordsForBoard("not-a-board").length).toBeGreaterThan(20);
  });

  it("freezes the per-board lists so they cannot be mutated at runtime", () => {
    expect(() => {
      (COMMAND_WORDS_BY_BOARD.aqa as string[]).push("badverb");
    }).toThrow();
  });
});

describe("PR-2 / findOffSpecCommandWords", () => {
  it("flags invented verbs ('reflect on', 'brainstorm') as off-spec for AQA", () => {
    const text = "1. Reflect on the diagram.\n2. Brainstorm three ideas.\n3. Calculate the area.";
    const off = findOffSpecCommandWords(text, "aqa");
    expect(off).toContain("reflect on");
    expect(off).toContain("brainstorm");
    expect(off).not.toContain("calculate");
  });

  it("recognises Edexcel-specific 'Investigate' as on-spec for Edexcel but off-spec for AQA", () => {
    const text = "1. Investigate how temperature affects rate.";
    expect(findOffSpecCommandWords(text, "edexcel")).not.toContain("investigate");
    expect(findOffSpecCommandWords(text, "aqa")).toContain("investigate");
    // OCR doesn't carry "comment on" — Edexcel does.
    const ocrText = "1. Comment on the changes shown.";
    expect(findOffSpecCommandWords(ocrText, "ocr")).toContain("comment on");
    expect(findOffSpecCommandWords(ocrText, "edexcel")).not.toContain("comment on");
  });

  it("deduplicates so a worksheet that opens 12 questions with one off-spec verb produces one entry", () => {
    const text = Array.from({ length: 12 }, (_, i) => `${i + 1}. Reflect on this.`).join("\n");
    const off = findOffSpecCommandWords(text, "aqa");
    expect(off).toEqual(["reflect on"]);
  });

  it("ignores mid-sentence appearances — only flags leading verbs", () => {
    const text = "1. Calculate the value. Then reflect on your answer.";
    expect(findOffSpecCommandWords(text, "aqa")).toEqual([]);
  });
});

describe("PR-2 / enforceCommandWordFidelity", () => {
  it("warns once per off-spec verb, listing the question numbers it appeared in", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { examBoard: "aqa" },
      sections: [
        { type: "q-short", title: "Q1", content: "Reflect on the diagram." },
        { type: "q-short", title: "Q2", content: "Brainstorm three ideas." },
        { type: "q-short", title: "Q3", content: "Reflect on your answer." },
        { type: "q-short", title: "Q4", content: "Calculate the area." },
      ],
    };
    const r = enforceCommandWordFidelity(ws);
    expect(r.warnings.length).toBe(2);
    const reflectWarn = r.warnings.find(w => w.includes('"reflect on"'))!;
    expect(reflectWarn).toMatch(/Q1.*Q3|Q3.*Q1/);
    const brainstormWarn = r.warnings.find(w => w.includes('"brainstorm"'))!;
    expect(brainstormWarn).toMatch(/Q2/);
    expect(r.warnings.some(w => w.includes('"calculate"'))).toBe(false);
  });

  it("is a no-op when every leading verb is on-spec", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { examBoard: "aqa" },
      sections: [
        { type: "q-short", title: "Q1", content: "Calculate the value of x." },
        { type: "q-short", title: "Q2", content: "Explain why this happens." },
      ],
    };
    expect(enforceCommandWordFidelity(ws).warnings).toEqual([]);
  });

  it("never rewrites question content (warn-only)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { examBoard: "aqa" },
      sections: [{ type: "q-short", title: "Q1", content: "Reflect on the diagram." }],
    };
    const r = enforceCommandWordFidelity(ws);
    expect(r.worksheet.sections![0].content).toBe("Reflect on the diagram.");
  });

  it("is idempotent — running twice yields the same warnings", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { examBoard: "aqa" },
      sections: [{ type: "q-short", title: "Q1", content: "Reflect on the diagram." }],
    };
    const r1 = enforceCommandWordFidelity(ws);
    const r2 = enforceCommandWordFidelity(r1.worksheet);
    expect(r2.warnings).toEqual(r1.warnings);
  });
});

describe("PR-2 / findImperialUnits", () => {
  it("detects mph, °F, lbs, ft, in, miles, gallons", () => {
    const tokens = findImperialUnits("Calculate the speed if the car travels at 60 mph in 32°F weather. The 100 lbs mass falls 5 ft.");
    const labels = tokens.map(t => t.label).sort();
    expect(labels).toContain("miles per hour");
    expect(labels).toContain("degrees Fahrenheit");
    expect(labels).toContain("pounds (mass)");
    expect(labels).toContain("feet");
  });

  it("does not false-flag pounds-sterling", () => {
    expect(findImperialUnits("The book costs 5 pounds sterling.")).toEqual([]);
    expect(findImperialUnits("The total is 5 pounds (£5.00).")).toEqual([]);
  });

  it("deduplicates exact-match tokens", () => {
    const tokens = findImperialUnits("60 mph and 60 mph again — both at 60 mph.");
    const mphTokens = tokens.filter(t => t.label === "miles per hour");
    expect(mphTokens.length).toBe(1);
  });
});

describe("PR-2 / isUnitConversionTopic", () => {
  it("returns true when topic + subject indicate unit conversion", () => {
    expect(isUnitConversionTopic("Converting between metric and imperial units", "Mathematics")).toBe(true);
    expect(isUnitConversionTopic("Imperial to metric units", "Maths")).toBe(true);
    expect(isUnitConversionTopic("Converting units of measurement", "Mathematics")).toBe(true);
  });

  it("returns false for unrelated topics", () => {
    expect(isUnitConversionTopic("Forces and motion", "Physics")).toBe(false);
    expect(isUnitConversionTopic("Photosynthesis", "Biology")).toBe(false);
  });
});

describe("PR-2 / enforceSiUnitNormalisation", () => {
  it("warns per imperial unit type, listing the questions it appeared in", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Physics", topic: "Forces and motion" },
      sections: [
        { type: "q-short", title: "Q1", content: "A car travels at 60 mph." },
        { type: "q-short", title: "Q2", content: "The temperature is 32°F." },
        { type: "q-short", title: "Q3", content: "Another car at 40 mph." },
      ],
    };
    const r = enforceSiUnitNormalisation(ws);
    expect(r.warnings.length).toBe(2);
    const mphWarn = r.warnings.find(w => w.includes("miles per hour"))!;
    expect(mphWarn).toMatch(/Q1.*Q3|Q3.*Q1/);
    expect(mphWarn).toMatch(/km\/h/);
    const fWarn = r.warnings.find(w => w.includes("Fahrenheit"))!;
    expect(fWarn).toMatch(/Q2/);
    expect(fWarn).toMatch(/°C/);
  });

  it("is a no-op when the topic IS unit conversion (legitimate imperial usage)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Mathematics", topic: "Converting between imperial and metric units" },
      sections: [{ type: "q-short", title: "Q1", content: "Convert 60 mph to km/h." }],
    };
    expect(enforceSiUnitNormalisation(ws).warnings).toEqual([]);
  });

  it("never rewrites question content (warn-only)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Physics", topic: "Forces" },
      sections: [{ type: "q-short", title: "Q1", content: "A car travels at 60 mph." }],
    };
    const r = enforceSiUnitNormalisation(ws);
    expect(r.worksheet.sections![0].content).toBe("A car travels at 60 mph.");
  });

  it("is idempotent — running twice yields the same warnings", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Physics", topic: "Forces" },
      sections: [{ type: "q-short", title: "Q1", content: "A car at 60 mph." }],
    };
    const r1 = enforceSiUnitNormalisation(ws);
    const r2 = enforceSiUnitNormalisation(r1.worksheet);
    expect(r2.warnings).toEqual(r1.warnings);
  });
});

describe("PR-2 / countSyllables + computeReadingAge", () => {
  it("counts syllables on common UK academic vocabulary correctly enough for FK", () => {
    expect(countSyllables("calculate")).toBe(3);
    expect(countSyllables("photosynthesis")).toBeGreaterThanOrEqual(4);
    expect(countSyllables("the")).toBe(1);
    expect(countSyllables("a")).toBe(1);
    // Trailing silent 'e' rule: "make" = 1
    expect(countSyllables("make")).toBe(1);
    // Polysyllabic
    expect(countSyllables("mitochondria")).toBeGreaterThanOrEqual(4);
  });

  it("returns null for empty / sub-5-word inputs", () => {
    expect(computeReadingAge("")).toBeNull();
    expect(computeReadingAge(null)).toBeNull();
    expect(computeReadingAge("Too short.")).toBeNull();
  });

  it("computes plausible UK reading ages for KS2-level prose", () => {
    // Simple Year 4-ish text. Should land in the 8-11 reading age band.
    const text = "The cat sat on the mat. It was a sunny day. The cat was very happy.";
    const r = computeReadingAge(text)!;
    expect(r.readingAge).toBeGreaterThanOrEqual(5);
    expect(r.readingAge).toBeLessThanOrEqual(12);
  });

  it("computes plausible UK reading ages for GCSE-level prose", () => {
    const text =
      "Photosynthesis is the process by which green plants convert light energy " +
      "into chemical energy stored in glucose, demonstrating the fundamental " +
      "principles of energy conservation in biological systems.";
    const r = computeReadingAge(text)!;
    expect(r.readingAge).toBeGreaterThanOrEqual(13);
  });
});

describe("PR-2 / enforceReadingAgeBudget", () => {
  it("warns when actual reading age exceeds declared by more than 1.5 years", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { yearGroup: "Year 7" },
      sections: [
        {
          // GCSE-level prose declared as Year 7 (reading age ~11).
          type: "q-short",
          title: "Q1",
          content:
            "Photosynthesis is the biochemical process by which chlorophyll-containing organisms " +
            "transform electromagnetic radiation into the chemical energy stored within glucose " +
            "molecules, illustrating fundamental thermodynamic principles of biological systems.",
          expectedReadingAge: 11,
        },
      ],
    };
    const r = enforceReadingAgeBudget(ws);
    expect(r.warnings.length).toBeGreaterThanOrEqual(1);
    expect(r.warnings[0]).toMatch(/Q1/);
    expect(r.warnings[0]).toMatch(/Reading age/);
  });

  it("is a no-op when actual reading age is within the 1.5-year tolerance", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { yearGroup: "Year 4" },
      sections: [
        {
          type: "q-short",
          title: "Q1",
          content: "The cat sat on the mat. It was a sunny day. The cat was very happy.",
          expectedReadingAge: 9,
        },
      ],
    };
    const r = enforceReadingAgeBudget(ws);
    expect(r.warnings).toEqual([]);
  });

  it("falls back to a year-group default when expectedReadingAge is missing", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { yearGroup: "Year 7" },
      sections: [
        {
          type: "q-short",
          title: "Q1",
          content:
            "Photosynthesis is the biochemical process by which chlorophyll-containing organisms " +
            "transform electromagnetic radiation into the chemical energy stored within glucose " +
            "molecules, illustrating fundamental thermodynamic principles of biological systems.",
        },
      ],
    };
    const r = enforceReadingAgeBudget(ws);
    expect(r.warnings.length).toBeGreaterThanOrEqual(1);
  });

  it("never rewrites question content (warn-only)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { yearGroup: "Year 7" },
      sections: [
        {
          type: "q-short",
          title: "Q1",
          content:
            "Photosynthesis is the biochemical process by which chlorophyll-containing organisms " +
            "transform electromagnetic radiation into chemical energy stored within glucose molecules.",
          expectedReadingAge: 11,
        },
      ],
    };
    const before = ws.sections![0].content;
    const r = enforceReadingAgeBudget(ws);
    expect(r.worksheet.sections![0].content).toBe(before);
  });

  it("is idempotent — running twice yields the same warnings", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { yearGroup: "Year 7" },
      sections: [
        {
          type: "q-short",
          title: "Q1",
          content:
            "Photosynthesis is the biochemical process by which chlorophyll-containing organisms " +
            "transform electromagnetic radiation into chemical energy.",
          expectedReadingAge: 11,
        },
      ],
    };
    const r1 = enforceReadingAgeBudget(ws);
    const r2 = enforceReadingAgeBudget(r1.worksheet);
    expect(r2.warnings).toEqual(r1.warnings);
  });
});

describe("PR-2 / runWorksheetPostValidators integration", () => {
  it("the three new validators show up in the chain output", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa" },
      sections: [
        { type: "q-short", title: "Q1", content: "Reflect on a car travelling at 60 mph." },
      ],
    };
    const r = runWorksheetPostValidators(ws, {
      subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa",
    });
    // Command-word fidelity warning.
    expect(r.warnings.some(w => /Command-word fidelity.*reflect on/i.test(w))).toBe(true);
    // SI unit warning.
    expect(r.warnings.some(w => /SI units.*miles per hour/i.test(w))).toBe(true);
  });
});


// ─── PR-1 — SEND fidelity probes for the 12 missing profiles ───────────────
//
// Phase 4 follow-up. Before this PR, `sendFidelityAudit.ts` registered
// probes for 11 of the 21 SEND profiles in `sendPromptFragments.ts`. The
// other 10 (`asperger`, `asc-social`, `asc-demand-avoidant`, `asc-sensory`,
// `asc-rigid`, `mld`, `dyspraxia`, `tourettes`, `older-learners`, `semh`)
// silently emitted `not-checked` for every rule, so a worksheet that
// *claimed* to be SEND-adapted could ship with no enforced fidelity. This
// PR adds at least one deterministic probe per worksheet rule across all
// 10 profiles. Every probe must be:
//
//  - high-precision (a worksheet that follows the rule should never trip
//    the probe — `not-checked` is preferable to a false `missing`),
//  - pure (no side effects), and
//  - idempotent (running twice yields the same report).

import { runSendFidelityAudit, applySendFidelityAudit } from "../../client/src/lib/sendFidelityAudit";

/**
 * Convenience builder for a minimal worksheet shape the audit accepts.
 * Tests below extend this with profile-specific section content.
 */
function makeSheet(sections: Array<{ type?: string; title?: string; content?: string; teacherOnly?: boolean }>) {
  return {
    title: "Test worksheet",
    sections: sections.map((s) => ({ type: "q-short", title: "Q", content: "", teacherOnly: false, ...s })),
  };
}

describe("Phase 4 follow-up — SEND fidelity audit covers all 21 profiles", () => {
  it("registers a probe array for every spec id (no profile silently returns not-checked everywhere)", () => {
    // Every profile id should resolve to a non-null fidelity report with at
    // least one rule. This is the mechanical wiring guarantee: it does NOT
    // assert that the resolved spec is the same as the input id (the
    // resolver currently maps `semh` -> anxiety due to matcher order — see
    // SESSION-HANDOFF), only that no profile produces a silent null result.
    for (const spec of getAllSendSpecs()) {
      const ws = makeSheet([{ content: "placeholder content" }]);
      const report = runSendFidelityAudit(ws, spec.id);
      expect(report, `no fidelity report for ${spec.id}`).not.toBeNull();
      expect(report!.rules.length).toBeGreaterThan(0);
    }
  });

  it("every probed profile produces at least one applied OR missing verdict on a moderately-rich worksheet (no all-not-checked outcomes for the 11 newly-probed profiles)", () => {
    const richContent = makeSheet([
      { type: "vocabulary", title: "Key Vocabulary", content: "Word Bank: photosynthesis, mitochondria" },
      { type: "worked-example", title: "Worked example", content: "Calculate 2+3 = 5" },
      { type: "q-short", title: "Section A — Guided Practice", content: "What you need to do:\n1. Read.\n2. Answer.\nQ1. **Calculate** 4+5\nQ2. **Calculate** 6+7" },
      { type: "q-mcq", title: "Q3", content: "A. yes\nB. no ✓" },
      { type: "q-matching", title: "Q4", content: "match these" },
      { type: "q-true-false", title: "Q5", content: "TRUE / FALSE" },
      { type: "q-data-table", title: "Q6", content: "fill in the table" },
      { type: "challenge", title: "OPTIONAL BONUS — only if you want to", content: "Take a breath here — come back when you are ready." },
      { type: "reflection", title: "Reflection", content: "[ ] I learned a new fact today.\nWrite one fact you learned today: __________\n[ ] Calm   [ ] OK   [ ] Need a break" },
    ]);
    // 11 profiles that previously returned all-not-checked — now require at
    // least one applied or missing verdict.
    const previouslyUnprobedIds = [
      "asperger", "asc-social", "asc-demand-avoidant", "asc-sensory", "asc-rigid",
      "mld", "dyspraxia", "tourettes", "older-learners",
      // semh is omitted because the resolver-order bug routes "semh" to anxiety
      // (which is already probed). The semh-specific probe is exercised via
      // the "social-emotional" sendNeed input in its dedicated describe block.
    ];
    for (const id of previouslyUnprobedIds) {
      const report = runSendFidelityAudit(richContent, id)!;
      const verdicts = report.rules.filter((r) => r.status !== "not-checked");
      expect(verdicts.length, `${id} produced no applied/missing verdicts on a moderately-rich worksheet`).toBeGreaterThan(0);
    }
  });
});

describe("Phase 4 follow-up — asc-social fidelity probes", () => {
  it("registers applied for happy-path content (Word Bank + numbered steps + 'What you need to do' + tick-box reflection with exit question)", () => {
    const ws = makeSheet([
      { type: "vocabulary", title: "Key Vocabulary", content: "Word Bank: photosynthesis = the process plants use to make food" },
      { type: "q-short", title: "Section A — Guided Practice", content: "What you need to do:\n1. Read the question.\n2. Underline the key word.\n3. Write your answer." },
      { type: "reflection", title: "Reflection", content: "[ ] I learned a new fact today.\nWrite one fact you learned today: __________" },
    ]);
    const report = runSendFidelityAudit(ws, "asc-social")!;
    const applied = report.rules.filter((r) => r.status === "applied").map((r) => r.ruleIndex);
    expect(applied).toContain(3); // Word Bank
    expect(applied).toContain(4); // numbered steps
    expect(applied).toContain(5); // What you need to do
    expect(applied).toContain(6); // tick-box reflection + exit question
  });

  it("flags missing rule 5 ('What you need to do' box) when the section opens without it", () => {
    const ws = makeSheet([{ type: "q-short", title: "Section A", content: "1. Read the question." }]);
    const report = runSendFidelityAudit(ws, "asc-social")!;
    const r5 = report.rules.find((r) => r.ruleIndex === 5)!;
    expect(r5.status).toBe("missing");
  });
});

describe("Phase 4 follow-up — asc-demand-avoidant fidelity probes", () => {
  it("flags 'you must' / 'you need to' demand-language as missing rule 1", () => {
    const ws = makeSheet([{ type: "q-short", title: "Section A", content: "You must answer all the questions." }]);
    const report = runSendFidelityAudit(ws, "asc-demand-avoidant")!;
    const r1 = report.rules.find((r) => r.ruleIndex === 1)!;
    expect(r1.status).toBe("missing");
  });

  it("registers applied for invitational content (might like / Option A / Explore section / Take a break / no checkboxes / invitational reflection)", () => {
    const ws = makeSheet([
      { type: "q-short", title: "Explore — choose where to start", content: "What you need to do:\nYou might like to try:\nOption A: a fraction question\nOption B: a decimal question\nTake a break here if you need to — come back when ready." },
      { type: "reflection", title: "Reflection", content: "If you would like to, write one thing you noticed today: __________" },
    ]);
    const report = runSendFidelityAudit(ws, "asc-demand-avoidant")!;
    const applied = report.rules.filter((r) => r.status === "applied").map((r) => r.ruleIndex);
    expect(applied).toContain(1); // no demand-language
    expect(applied).toContain(2); // What you need to do + invitational
    expect(applied).toContain(3); // Option A / Option B
    expect(applied).toContain(4); // Explore renamed
    expect(applied).toContain(5); // Take a break
    expect(applied).toContain(6); // no checkboxes
    expect(applied).toContain(7); // invitational reflection
  });

  it("flags rule 6 (no checkboxes) when a checkbox is present in student-visible content", () => {
    const ws = makeSheet([{ type: "q-short", title: "Explore — choose where to start", content: "[ ] try this question" }]);
    const report = runSendFidelityAudit(ws, "asc-demand-avoidant")!;
    const r6 = report.rules.find((r) => r.ruleIndex === 6)!;
    expect(r6.status).toBe("missing");
  });
});

describe("Phase 4 follow-up — asc-sensory fidelity probes", () => {
  it("flags decorative emojis (🌟 / 🎉 / face emojis) as missing rule 3", () => {
    const ws = makeSheet([{ type: "q-short", title: "Section A", content: "🌟 Have a go at this question 🎉" }]);
    const report = runSendFidelityAudit(ws, "asc-sensory")!;
    const r3 = report.rules.find((r) => r.ruleIndex === 3)!;
    expect(r3.status).toBe("missing");
  });

  it("does not false-flag MCQ ✓ tick markers (U+2713) as decorative", () => {
    const ws = makeSheet([
      { type: "q-mcq", title: "Q1", content: "A. positive\nB. negative ✓\nC. neutral\nD. zero" },
      { type: "q-short", title: "Section A", content: "What you need to do:\nAnswer each question." },
      { type: "reflection", title: "Reflection", content: "[ ] I learned something new today." },
    ]);
    const report = runSendFidelityAudit(ws, "asc-sensory")!;
    const r3 = report.rules.find((r) => r.ruleIndex === 3)!;
    expect(r3.status).toBe("applied");
  });
});

describe("Phase 4 follow-up — asc-rigid fidelity probes", () => {
  it("registers applied when a single lead verb is used across all questions", () => {
    const ws = makeSheet([
      { type: "worked-example", title: "Worked example A", content: "Calculate 2+3 = 5" },
      { type: "q-short", title: "Section A", content: "What you need to do:\nUse the same method as the worked example.\n1. **Calculate** 4+5\n2. **Calculate** 6+7" },
      { type: "worked-example", title: "Worked example B", content: "Calculate 10+1 = 11" },
      { type: "q-short", title: "Section B", content: "3. **Calculate** 12+8\n4. **Calculate** 9+2" },
      { type: "q-short", title: "Optional Challenge", content: "5. **Calculate** 100+250" },
      { type: "reflection", title: "Reflection", content: "[ ] I followed the same steps every time." },
    ]);
    const report = runSendFidelityAudit(ws, "asc-rigid")!;
    const r3 = report.rules.find((r) => r.ruleIndex === 3)!;
    expect(r3.status).toBe("applied");
    expect(r3.evidence).toMatch(/1 distinct lead verb/);
  });

  it("flags rule 3 when multiple distinct lead verbs are used", () => {
    const ws = makeSheet([{ type: "q-short", title: "Section A", content: "1. **Calculate** 2+3\n2. **Find** the value of x\n3. **Solve** for y" }]);
    const report = runSendFidelityAudit(ws, "asc-rigid")!;
    const r3 = report.rules.find((r) => r.ruleIndex === 3)!;
    expect(r3.status).toBe("missing");
    expect(r3.evidence).toMatch(/3 distinct lead verbs/);
  });

  it("flags rule 5 (no Optional label) when bonus items aren't visibly separated", () => {
    const ws = makeSheet([{ type: "q-short", title: "Section A", content: "1. **Calculate** something." }]);
    const report = runSendFidelityAudit(ws, "asc-rigid")!;
    const r5 = report.rules.find((r) => r.ruleIndex === 5)!;
    expect(r5.status).toBe("missing");
  });
});

describe("Phase 4 follow-up — asperger fidelity probes", () => {
  it("registers applied for 'What you need to do' + tick-box reflection", () => {
    const ws = makeSheet([
      { type: "q-short", title: "Section A", content: "What you need to do:\n1. Read.\n2. Answer." },
      { type: "reflection", title: "Reflection", content: "[ ] I completed the worksheet." },
    ]);
    const report = runSendFidelityAudit(ws, "asperger")!;
    const applied = report.rules.filter((r) => r.status === "applied").map((r) => r.ruleIndex);
    expect(applied).toContain(1);
    expect(applied).toContain(6);
  });

  it("returns not-checked for narrative rules 2-5 (literal language / synonyms / layout / interest)", () => {
    const ws = makeSheet([{ type: "q-short", title: "Section A", content: "What you need to do:\n1. Read." }]);
    const report = runSendFidelityAudit(ws, "asperger")!;
    for (const idx of [2, 3, 4, 5]) {
      const r = report.rules.find((rr) => rr.ruleIndex === idx)!;
      expect(r.status).toBe("not-checked");
      expect(r.evidence).toMatch(/narrative|hard to|too narrative|rendered via CSS|per-pupil profile/i);
    }
  });
});

describe("Phase 4 follow-up — mld fidelity probes", () => {
  it("registers applied for Q1 model answer + hint scaffolds + Help Box + single-step + Optional challenge", () => {
    const ws = makeSheet([
      { type: "recall", title: "Section A — Guided Practice", content: "Q1. Calculate 2+3. Answer: 5\nHint: count up from 2.\nQ2. Calculate 4+5 = ___\nQ3. Sentence starter: 'The answer is ___'" },
      { type: "understanding", title: "Section B — Main Practice", content: "Help Box:\n- Adding two numbers means combining them.\nQ4. Calculate 10+5." },
      { type: "challenge", title: "OPTIONAL BONUS — only if you want to", content: "Calculate something harder." },
    ]);
    const report = runSendFidelityAudit(ws, "mld")!;
    const applied = report.rules.filter((r) => r.status === "applied").map((r) => r.ruleIndex);
    expect(applied).toContain(1); // Q1 model
    expect(applied).toContain(2); // hints / starters
    expect(applied).toContain(3); // Help Box near B
    expect(applied).toContain(6); // single-step Section A
    expect(applied).toContain(7); // Challenge optional
  });

  it("flags rule 6 when Section A has multi-step questions", () => {
    const ws = makeSheet([
      { type: "recall", title: "Section A", content: "Q1. (a) Calculate 2+3\n(b) Calculate 4+5" },
    ]);
    const report = runSendFidelityAudit(ws, "mld")!;
    const r6 = report.rules.find((r) => r.ruleIndex === 6)!;
    expect(r6.status).toBe("missing");
  });
});

describe("Phase 4 follow-up — dyspraxia fidelity probes", () => {
  it("registers applied when Section A uses ≥3 reduced-handwriting types and Challenge is reduced-writing", () => {
    const ws = makeSheet([
      { type: "recall", title: "Section A", content: "Q1." },
      { type: "q-mcq", title: "Q1", content: "A. yes ✓\nB. no" },
      { type: "q-matching", title: "Q2", content: "match these" },
      { type: "q-true-false", title: "Q3", content: "TRUE / FALSE" },
      { type: "q-data-table", title: "Q4 (Section B)", content: "fill in the table" },
      { type: "q-mcq", title: "Challenge", content: "A. ✓\nB." },
      { type: "worked-example", title: "Example", content: "- Step 1\n- Step 2\n- Step 3" },
    ]);
    const report = runSendFidelityAudit(ws, "dyspraxia")!;
    const applied = report.rules.filter((r) => r.status === "applied").map((r) => r.ruleIndex);
    expect(applied).toContain(1); // ≥3 reduced types
    expect(applied).toContain(3); // structured frame
    expect(applied).toContain(4); // challenge reduced-writing
    expect(applied).toContain(5); // worked example brief bullets
  });

  it("flags rule 4 when Challenge demands extended writing", () => {
    const ws = makeSheet([
      { type: "challenge", title: "Challenge", content: "Discuss in detail the consequences of climate change in an extended response." },
    ]);
    const report = runSendFidelityAudit(ws, "dyspraxia")!;
    const r4 = report.rules.find((r) => r.ruleIndex === 4)!;
    expect(r4.status).toBe("missing");
  });
});

describe("Phase 4 follow-up — tourettes fidelity probes", () => {
  it("registers applied for varied formats + Take a breath markers + ≤4 in Section A + no urgency", () => {
    const ws = makeSheet([
      { type: "recall", title: "Section A", content: "Q1. Match.\nQ2. Tick.\nQ3. Fill in.\nQ4. Short answer." },
      { type: "q-mcq", title: "Q5", content: "A.\nB.\nC.\nD." },
      { type: "q-matching", title: "Q6", content: "match" },
      { type: "q-true-false", title: "Q7", content: "TRUE / FALSE" },
      { type: "q-short", title: "Section B", content: "Take a breath here if you need to." },
    ]);
    const report = runSendFidelityAudit(ws, "tourettes")!;
    const applied = report.rules.filter((r) => r.status === "applied").map((r) => r.ruleIndex);
    expect(applied).toContain(1); // varied formats
    expect(applied).toContain(2); // take a breath
    expect(applied).toContain(3); // Section A ≤4
    expect(applied).toContain(4); // no urgency
  });

  it("flags rule 4 when urgency / time-pressure language is present", () => {
    const ws = makeSheet([{ type: "q-short", title: "Section A", content: "Quickly answer in 5 minutes — hurry!" }]);
    const report = runSendFidelityAudit(ws, "tourettes")!;
    const r4 = report.rules.find((r) => r.ruleIndex === 4)!;
    expect(r4.status).toBe("missing");
  });

  it("flags rule 3 when Section A has more than 4 questions", () => {
    const ws = makeSheet([
      { type: "recall", title: "Section A", content: "Q1.\nQ2.\nQ3.\nQ4.\nQ5.\nQ6." },
    ]);
    const report = runSendFidelityAudit(ws, "tourettes")!;
    const r3 = report.rules.find((r) => r.ruleIndex === 3)!;
    expect(r3.status).toBe("missing");
  });
});

describe("Phase 4 follow-up — older-learners fidelity probes", () => {
  it("registers applied for Cornell + Study Tips + estimated times + What-went-well reflection", () => {
    const ws = makeSheet([
      { type: "q-short", title: "Section A (≈ 10 min) — Skills Practice", content: "Study Tips: read carefully.\nKey terms\nSummary\nCornell-style note." },
      { type: "q-short", title: "Section B (≈ 15 min) — Application", content: "Q1." },
      { type: "reflection", title: "Reflection", content: "What went well?\nWhat do I need to revise further?" },
    ]);
    const report = runSendFidelityAudit(ws, "older-learners")!;
    const applied = report.rules.filter((r) => r.status === "applied").map((r) => r.ruleIndex);
    expect(applied).toContain(2); // Cornell
    expect(applied).toContain(4); // Study Tips
    expect(applied).toContain(5); // estimated time
    expect(applied).toContain(6); // What went well
  });

  it("flags rule 5 when section headers have no estimated time", () => {
    const ws = makeSheet([
      { type: "q-short", title: "Section A — Skills Practice", content: "Q1." },
      { type: "q-short", title: "Section B — Application", content: "Q2." },
    ]);
    const report = runSendFidelityAudit(ws, "older-learners")!;
    const r5 = report.rules.find((r) => r.ruleIndex === 5)!;
    expect(r5.status).toBe("missing");
  });
});

describe("Phase 4 follow-up — semh fidelity probes (resolver-direct)", () => {
  // The resolver currently masks the SEMH spec id behind `anxiety` for the
  // bare input "semh" (see `resolveSendSpec` matcher order in
  // sendPromptFragments.ts: the `anxiety|semh|mental` regex appears
  // BEFORE the `semh|social.emotional|emotional.mental` regex). The tests
  // below pass "social-emotional" so the SEMH-specific regex wins and we
  // actually exercise the new probe table. The resolver-order fix is
  // tracked in SESSION-HANDOFF for a follow-up PR.
  it("registers applied for emotional check-in + Warm-Up framing + take a breath + check-in reflection", () => {
    const ws = makeSheet([
      { type: "q-short", title: "Warm-Up — no pressure!", content: "[ ] Calm   [ ] OK   [ ] Need a break — let your teacher know\nLet's have a go at this together." },
      { type: "q-short", title: "Section B", content: "Take a breath here — come back when you are ready." },
      { type: "challenge", title: "OPTIONAL BONUS — only if you want to", content: "An extra question." },
      { type: "reflection", title: "Reflection", content: "[ ] Calm   [ ] OK   [ ] Need a break" },
    ]);
    const report = runSendFidelityAudit(ws, "social-emotional")!;
    expect(report.sendNeedId).toBe("semh");
    const applied = report.rules.filter((r) => r.status === "applied").map((r) => r.ruleIndex);
    expect(applied).toContain(1); // emotional check-in
    expect(applied).toContain(2); // Warm-Up + OPTIONAL BONUS
    expect(applied).toContain(4); // no must / should / need to
    expect(applied).toContain(5); // take a breath
    expect(applied).toContain(6); // reflection check-in
  });

  it("flags rule 4 when 'you must / should / need to' demand-language is present", () => {
    const ws = makeSheet([{ type: "q-short", title: "Warm-Up — no pressure!", content: "You must answer all the questions." }]);
    const report = runSendFidelityAudit(ws, "social-emotional")!;
    expect(report.sendNeedId).toBe("semh");
    const r4 = report.rules.find((r) => r.ruleIndex === 4)!;
    expect(r4.status).toBe("missing");
  });
});

describe("Phase 4 follow-up — applySendFidelityAudit is idempotent across all 21 profiles", () => {
  it("running the audit twice on the same worksheet produces an identical report", () => {
    for (const spec of getAllSendSpecs()) {
      const ws = makeSheet([
        { type: "q-short", title: "Section A", content: "What you need to do:\n1. Read.\n[ ] Calm" },
        { type: "reflection", title: "Reflection", content: "[ ] I learned." },
      ]);
      const r1 = applySendFidelityAudit(ws, spec.id);
      const r2 = applySendFidelityAudit(r1, spec.id);
      expect(r2.metadata?.sendFidelityReport).toEqual(r1.metadata?.sendFidelityReport);
    }
  });
});

describe("Phase 4 follow-up — applySendFidelityAudit accumulates warnings into postValidatorWarnings", () => {
  it("warnings stamped by the audit are appended to existing postValidatorWarnings", () => {
    const ws = {
      title: "T",
      sections: [{ type: "q-short", title: "Section A", content: "You must answer all questions." }],
      metadata: { postValidatorWarnings: ["pre-existing warning"] },
    };
    const out = applySendFidelityAudit(ws, "asc-demand-avoidant");
    const warnings = (out.metadata?.postValidatorWarnings as string[]) || [];
    expect(warnings).toContain("pre-existing warning");
    expect(warnings.some((w) => /SEND fidelity.*Demand-Avoidant.*rule 1/i.test(w))).toBe(true);
  });
});

// ─── Phase G prework — bare 'semh' resolver fix (Tier 4 bug G18) ──────────
//
// Before this fix, the matcher row [/\b(anxiety|semh|mental)\b/, "anxiety"]
// in resolveSendSpec ran BEFORE the dedicated SEMH matcher
// [/\b(semh|social.emotional|emotional.mental)\b/, "semh"], so the bare
// token "semh" was eaten by the anxiety branch and the SEMH spec was
// unreachable for the most natural input shape. The fix removes `semh`
// from the anxiety regex (keeping `mental` there because mental-health
// language is still anxiety territory) so the dedicated row wins.

describe("Phase G prework — resolveSendSpec routes bare 'semh' to the SEMH spec", () => {
  it("returns the spec with id 'semh' (not 'anxiety') for the bare token", () => {
    const spec = resolveSendSpec("semh")!;
    expect(spec).not.toBeNull();
    expect(spec.id).toBe("semh");
    expect(spec.name).toMatch(/Social, Emotional and Mental Health/);
  });

  it("still routes 'anxiety' and 'mental health' tokens to the anxiety spec", () => {
    expect(resolveSendSpec("anxiety")!.id).toBe("anxiety");
    expect(resolveSendSpec("mental health")!.id).toBe("anxiety");
  });

  it("compound forms like 'social-emotional' continue to resolve to semh", () => {
    expect(resolveSendSpec("social-emotional")!.id).toBe("semh");
    expect(resolveSendSpec("emotional-mental")!.id).toBe("semh");
  });
});

describe("Phase G prework — semh fidelity audit works for the bare token", () => {
  it("runSendFidelityAudit('semh') returns a report with sendNeedId='semh'", () => {
    const ws = makeSheet([
      { type: "q-short", title: "Warm-Up — no pressure!", content: "[ ] Calm   [ ] OK   [ ] Need a break — let your teacher know\nLet's have a go at this together." },
      { type: "q-short", title: "Section B", content: "Take a breath here — come back when you are ready." },
      { type: "challenge", title: "OPTIONAL BONUS — only if you want to", content: "An extra question." },
      { type: "reflection", title: "Reflection", content: "[ ] Calm   [ ] OK   [ ] Need a break" },
    ]);
    const report = runSendFidelityAudit(ws, "semh")!;
    expect(report).not.toBeNull();
    expect(report.sendNeedId).toBe("semh");
  });
});

// ─── Phase G prework — applySendFidelityAudit warning idempotency (G19) ───
//
// Before this fix, calling applySendFidelityAudit twice on the same
// worksheet produced a postValidatorWarnings array with each warning
// listed twice — the function read existing warnings and appended the
// freshly-computed report's warnings unconditionally. The
// sendFidelityReport itself was already idempotent (deep-equal across
// calls); only the warnings array duplicated. The fix dedupes by
// string equality before merge.

describe("Phase G prework — applySendFidelityAudit dedupes warnings on the second call", () => {
  it("running the audit twice produces a postValidatorWarnings array with no duplicates", () => {
    const ws = {
      title: "T",
      sections: [{ type: "q-short", title: "Section A", content: "You must answer all questions." }],
      metadata: {},
    };
    const r1 = applySendFidelityAudit(ws, "asc-demand-avoidant");
    const r2 = applySendFidelityAudit(r1, "asc-demand-avoidant");
    const w1 = (r1.metadata?.postValidatorWarnings as string[]) || [];
    const w2 = (r2.metadata?.postValidatorWarnings as string[]) || [];
    expect(w2).toEqual(w1);
    // Hard-check: every entry in w2 is unique.
    expect(new Set(w2).size).toBe(w2.length);
  });

  it("preserves any pre-existing unrelated warnings on every call", () => {
    const ws = {
      title: "T",
      sections: [{ type: "q-short", title: "Section A", content: "You must answer all questions." }],
      metadata: { postValidatorWarnings: ["pre-existing warning"] },
    };
    const r1 = applySendFidelityAudit(ws, "asc-demand-avoidant");
    const r2 = applySendFidelityAudit(r1, "asc-demand-avoidant");
    const w2 = (r2.metadata?.postValidatorWarnings as string[]) || [];
    expect(w2).toContain("pre-existing warning");
    expect(w2.filter((w) => w === "pre-existing warning")).toHaveLength(1);
    expect(new Set(w2).size).toBe(w2.length);
  });
});



// ─── PR-4 — Quality scorecard (audit item #50) ─────────────────────────────
//
// Wires the existing `WorksheetQAScore` schema field to a deterministic
// scorer that reads the post-validator warnings + structured reports
// (sendFidelityReport, commonMistakesAudit, etc.) and produces a /100
// score. Pure / idempotent. Stamped onto `metadata.qaScore` and
// `metadata.validationStatus` as the LAST step in the post-validator
// chain.

import { computeQaScore, applyQaScore, mapStatusToValidation } from "../../client/src/lib/qaScoreBuilder";

describe("PR-4 / computeQaScore — happy path on a strong worksheet", () => {
  it("returns publish-ready when the worksheet has every required surface and no warnings", () => {
    const ws = {
      title: "Adding fractions",
      sections: [
        { type: "learning-objective", title: "LO", content: "Add proper fractions with different denominators." },
        { type: "q-short-answer", title: "Q1", content: "Calculate 1/2 + 1/4", specRef: "AQA-N-2-a" },
        { type: "q-short-answer", title: "Q2", content: "Calculate 2/3 + 1/6", specRef: "AQA-N-2-a" },
        { type: "q-extended", title: "Q3", content: "Show that 3/8 + 1/4 = 5/8", specRef: "AQA-N-2-b" },
        { type: "q-mcq", title: "Q4", content: "A. 1/4\nB. 1/3 ✓\nC. 1/2", specRef: "AQA-N-2-a" },
        { type: "challenge", title: "Challenge", content: "Calculate 5/6 - 3/8", specRef: "AQA-N-2-b" },
        { type: "diagram", title: "Diagram A", content: "fraction wall", imageUrl: "/diagrams/fraction-wall.png" },
        { type: "vocabulary", title: "Word Bank", content: "numerator, denominator" },
        { type: "self-reflection", title: "Reflection", content: "I can calculate adding fractions confidently." },
        { type: "mark-scheme", title: "Teacher Key", content: "Q1: 3/4 [1]" },
      ],
      metadata: {
        subject: "Mathematics",
        topic: "Adding fractions",
        yearGroup: "Year 9",
        examBoard: "aqa",
        generatorVersion: "v3",
        readingAge: 11,
      },
    };
    const score = computeQaScore(ws);
    expect(score.failConditions).toEqual([]);
    expect(score.total).toBeGreaterThanOrEqual(90);
    expect(score.status).toBe("publish-ready");
  });
});

describe("PR-4 / computeQaScore — deductions are bucket-targeted", () => {
  it("command-word warnings only deduct from examStyleAccuracy", () => {
    const baseSections = [
      { type: "learning-objective", title: "LO", content: "..." },
      { type: "q-short-answer", title: "Q1", content: "...", specRef: "AQA-X" },
      { type: "challenge", title: "Q2", content: "...", specRef: "AQA-X" },
      { type: "mark-scheme", title: "Teacher Key", content: "..." },
    ];
    const meta = {
      subject: "S", topic: "T", yearGroup: "Y10", examBoard: "aqa",
      generatorVersion: "v1", readingAge: 11,
      postValidatorWarnings: [
        "Command-word fidelity: 'reflect on' is not on AQA's published list",
        "Command-word fidelity: 'discuss with a friend' is not on AQA's published list",
      ],
    };
    const ws = { title: "T", sections: baseSections, metadata: meta };
    const score = computeQaScore(ws);
    expect(score.examStyleAccuracy).toBe(11); // 15 − 2*2
    expect(score.notationAccuracy).toBe(10);  // untouched
    expect(score.curriculumAlignment).toBe(15); // untouched
  });

  it("notation hygiene warnings deduct from notationAccuracy only", () => {
    const ws = {
      title: "T",
      sections: [
        { type: "learning-objective", title: "LO", content: "..." },
        { type: "q-short-answer", title: "Q1", content: "Calculate 3 × 4", specRef: "S-1" },
        { type: "challenge", title: "Q2", content: "...", specRef: "S-1" },
        { type: "mark-scheme", title: "TK", content: "..." },
      ],
      metadata: {
        subject: "S", topic: "T", yearGroup: "Y9", examBoard: "aqa", generatorVersion: "v1", readingAge: 11,
        postValidatorWarnings: [
          "notation hygiene: rewrote x to ×",
          "notation hygiene: rewrote o to °",
        ],
      },
    };
    const score = computeQaScore(ws);
    expect(score.notationAccuracy).toBe(8); // 10 − 2*1
    expect(score.examStyleAccuracy).toBe(15);
  });

  it("placeholder leakage drives layoutPrintQuality down AND triggers an auto-fail at ≥3 placeholders", () => {
    const ws = {
      title: "T",
      sections: [
        { type: "learning-objective", title: "LO", content: "..." },
        { type: "q-short-answer", title: "Q1", content: "...", specRef: "S-1" },
        { type: "challenge", title: "Q2", content: "...", specRef: "S-1" },
        { type: "mark-scheme", title: "TK", content: "..." },
      ],
      metadata: {
        subject: "S", topic: "T", yearGroup: "Y10", examBoard: "aqa", generatorVersion: "v1", readingAge: 11,
        postValidatorWarnings: [
          "Phase 5: placeholder leakage detected — '${topic}'",
          "Phase 5: placeholder leakage detected — '[N marks]'",
          "Phase 5: placeholder leakage detected — '___'",
        ],
      },
    };
    const score = computeQaScore(ws);
    expect(score.layoutPrintQuality).toBe(4); // 10 − 4 (cap) − 2 (distinct types <6)
    expect(score.failConditions).toContain(
      "Multiple placeholder leakage warnings — output not pupil-ready",
    );
    expect(score.status).toBe("do-not-publish");
  });
});

describe("PR-4 / computeQaScore — fail conditions", () => {
  it("auto-fails with do-not-publish when there are no question sections", () => {
    const ws = {
      title: "T",
      sections: [
        { type: "learning-objective", title: "LO", content: "..." },
        { type: "vocabulary", title: "WB", content: "..." },
      ],
      metadata: { subject: "S", topic: "T", yearGroup: "Y9", examBoard: "aqa", generatorVersion: "v1" },
    };
    const score = computeQaScore(ws);
    expect(score.failConditions).toContain("No question sections present");
    expect(score.failConditions).toContain("Missing Teacher Key");
    expect(score.status).toBe("do-not-publish");
    expect(score.questionProgression).toBe(0);
  });

  it("auto-fails when more than 50% of SEND fidelity rules are missing", () => {
    const ws = {
      title: "T",
      sections: [
        { type: "learning-objective", title: "LO", content: "..." },
        { type: "q-short-answer", title: "Q1", content: "...", specRef: "S-1" },
        { type: "challenge", title: "Q2", content: "...", specRef: "S-1" },
        { type: "mark-scheme", title: "TK", content: "..." },
      ],
      metadata: {
        subject: "S", topic: "T", yearGroup: "Y9", examBoard: "aqa", generatorVersion: "v1", readingAge: 11,
        sendNeed: "asc-rigid",
        sendFidelityReport: {
          sendNeedId: "asc-rigid",
          rules: [
            { status: "missing" }, { status: "missing" }, { status: "missing" },
            { status: "missing" }, { status: "applied" }, { status: "applied" },
            { status: "not-checked" },
          ],
        },
      },
    };
    const score = computeQaScore(ws);
    expect(score.failConditions).toContain(
      "SEND adaptation severely incomplete (> 50% rules missing)",
    );
    expect(score.status).toBe("do-not-publish");
    expect(score.sendAdaptationQuality).toBeLessThan(15);
  });
});

describe("PR-4 / computeQaScore — purity and idempotency", () => {
  it("running computeQaScore twice on the same input returns deep-equal output", () => {
    const ws = {
      title: "T",
      sections: [
        { type: "learning-objective", title: "LO", content: "Add fractions." },
        { type: "q-short-answer", title: "Q1", content: "Calculate 1/2 + 1/4", specRef: "AQA-N-2-a" },
        { type: "challenge", title: "Q2", content: "Calculate 5/6 - 3/8", specRef: "AQA-N-2-b" },
        { type: "mark-scheme", title: "TK", content: "Q1: 3/4" },
      ],
      metadata: {
        subject: "S", topic: "T", yearGroup: "Y9", examBoard: "aqa", generatorVersion: "v1", readingAge: 11,
        postValidatorWarnings: ["Command-word fidelity: 'reflect on' is not on AQA's list"],
      },
    };
    const a = computeQaScore(ws);
    const b = computeQaScore(ws);
    expect(b).toEqual(a);
  });

  it("applyQaScore is idempotent — running it twice yields identical metadata", () => {
    const ws = {
      title: "T",
      sections: [
        { type: "learning-objective", title: "LO", content: "..." },
        { type: "q-short-answer", title: "Q1", content: "...", specRef: "S-1" },
        { type: "challenge", title: "Q2", content: "...", specRef: "S-1" },
        { type: "mark-scheme", title: "TK", content: "..." },
      ],
      metadata: {
        subject: "S", topic: "T", yearGroup: "Y9", examBoard: "aqa", generatorVersion: "v1", readingAge: 11,
      },
    };
    const a = applyQaScore(ws);
    const b = applyQaScore(a);
    expect(b.metadata?.qaScore).toEqual(a.metadata?.qaScore);
    expect(b.metadata?.validationStatus).toBe(a.metadata?.validationStatus);
  });
});

describe("PR-4 / mapStatusToValidation — legacy three-bucket mapping", () => {
  it("publish-ready and good map to pass", () => {
    expect(mapStatusToValidation("publish-ready")).toBe("pass");
    expect(mapStatusToValidation("good")).toBe("pass");
    expect(mapStatusToValidation("pass")).toBe("pass");
  });

  it("needs-revision maps to warn", () => {
    expect(mapStatusToValidation("needs-revision")).toBe("warn");
    expect(mapStatusToValidation("warn")).toBe("warn");
  });

  it("regenerate and do-not-publish map to fail", () => {
    expect(mapStatusToValidation("regenerate")).toBe("fail");
    expect(mapStatusToValidation("do-not-publish")).toBe("fail");
    expect(mapStatusToValidation("fail")).toBe("fail");
  });
});

describe("PR-4 / runWorksheetPostValidators — qaScore stamped on every output", () => {
  it("the post-validator chain attaches qaScore + validationStatus to metadata", () => {
    const ws = {
      title: "T",
      sections: [
        { type: "learning-objective", title: "LO", content: "Add proper fractions." },
        { type: "q-short-answer", title: "Q1", content: "Calculate 1/2 + 1/4", specRef: "AQA-N-2-a" },
        { type: "challenge", title: "Q2", content: "Calculate 5/6 - 3/8", specRef: "AQA-N-2-b" },
        { type: "mark-scheme", title: "TK", content: "Q1: 3/4 [1]" },
      ],
      metadata: {
        subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9",
        examBoard: "aqa", generatorVersion: "v3", readingAge: 11,
      },
    };
    const r = runWorksheetPostValidators(ws, {
      subject: "Mathematics", topic: "Adding fractions", yearGroup: "Year 9", examBoard: "aqa",
    });
    expect(r.worksheet.metadata?.qaScore).toBeDefined();
    expect(typeof (r.worksheet.metadata as any)?.qaScore?.total).toBe("number");
    expect((r.worksheet.metadata as any)?.qaScore?.total).toBeGreaterThan(0);
    expect((r.worksheet.metadata as any)?.qaScore?.total).toBeLessThanOrEqual(100);
    expect((r.worksheet.metadata as any)?.validationStatus).toMatch(/pass|warn|fail/);
  });
});

// ─── PR-3 — Diagram coupling, distractor pedagogy, vocab tier, notation hygiene ──
//
// Audit items #4, #10, #13, #15. Four new pure / idempotent validators.
// #16 (Common Mistakes for non-maths) is deferred to a follow-up PR — see
// SESSION-HANDOFF.

import {
  enforceDiagramDependencyIntegrity,
  enforceDistractorPedagogy,
  enforceTier3VocabularyDeclared,
  enforceMathsNotationHygiene,
} from "../../client/src/lib/worksheetPostValidator";

import {
  normaliseMathNotation,
  findNotationDrift,
  isNotationClean,
} from "../../client/src/lib/notationHygieneNormaliser";

describe("PR-3 / normaliseMathNotation", () => {
  it("rewrites Latin x to × between numeric operands", () => {
    const r = normaliseMathNotation("Calculate 2 x 3");
    expect(r.rewritten).toBe("Calculate 2 × 3");
    expect(r.substitutions.length).toBe(1);
    expect(r.substitutions[0].label).toBe("x→×");
  });

  it("does not rewrite x in narrative prose", () => {
    expect(normaliseMathNotation("the bus to school takes ten minutes").rewritten)
      .toBe("the bus to school takes ten minutes");
    expect(normaliseMathNotation("solve x = 5").rewritten).toBe("solve x = 5");
  });

  it("rewrites hyphen to typographic minus only between numbers with surrounding whitespace", () => {
    const r = normaliseMathNotation("Calculate 5 - 3");
    expect(r.rewritten).toBe("Calculate 5 − 3");
    expect(r.substitutions[0].label).toBe("-→−");
  });

  it("does not rewrite hyphens in compound words", () => {
    expect(normaliseMathNotation("step-by-step method").rewritten).toBe("step-by-step method");
    expect(normaliseMathNotation("a well-known fact").rewritten).toBe("a well-known fact");
  });

  it("rewrites letter o to ° after numeric values for temperature", () => {
    const r = normaliseMathNotation("Heat to 90 o C");
    expect(r.rewritten).toBe("Heat to 90°C");
    expect(r.substitutions[0].label).toBe("o→°");
    expect(normaliseMathNotation("Cool to 5oC").rewritten).toBe("Cool to 5°C");
  });

  it("is idempotent — running twice yields the same output", () => {
    const input = "Calculate 2 x 3 and 5 - 1, heat to 90 o C.";
    const r1 = normaliseMathNotation(input);
    const r2 = normaliseMathNotation(r1.rewritten);
    expect(r2.rewritten).toBe(r1.rewritten);
    expect(r2.substitutions.length).toBe(0);
  });

  it("isNotationClean returns true for clean text", () => {
    expect(isNotationClean("Calculate 2 × 3 = 6")).toBe(true);
    expect(isNotationClean("Calculate 2 x 3 = 6")).toBe(false);
  });

  it("findNotationDrift returns the same substitutions list as normaliseMathNotation", () => {
    const text = "Calculate 2 x 3";
    expect(findNotationDrift(text).length).toBe(normaliseMathNotation(text).substitutions.length);
  });
});

describe("PR-3 / enforceMathsNotationHygiene", () => {
  it("rewrites student-visible content and produces one warning per drift type", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        { type: "q-short", title: "Q1", content: "Calculate 2 x 3" },
        { type: "q-short", title: "Q2", content: "Calculate 5 - 1 and 4 x 2" },
      ],
    };
    const r = enforceMathsNotationHygiene(ws);
    expect(r.worksheet.sections![0].content).toBe("Calculate 2 × 3");
    expect(r.worksheet.sections![1].content).toBe("Calculate 5 − 1 and 4 × 2");
    expect(r.warnings.some(w => /x→×/.test(w))).toBe(true);
    expect(r.warnings.some(w => /-→−/.test(w))).toBe(true);
  });

  it("skips teacher-only sections", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        { type: "mark-scheme", title: "MS", teacherOnly: true, content: "answer: 2 x 3 = 6" },
      ],
    };
    const r = enforceMathsNotationHygiene(ws);
    expect(r.worksheet.sections![0].content).toBe("answer: 2 x 3 = 6");
    expect(r.warnings).toEqual([]);
  });

  it("is idempotent — running twice yields the same content + no new warnings", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [{ type: "q-short", title: "Q1", content: "Calculate 2 x 3" }],
    };
    const r1 = enforceMathsNotationHygiene(ws);
    const r2 = enforceMathsNotationHygiene(r1.worksheet);
    expect(r2.worksheet.sections![0].content).toBe(r1.worksheet.sections![0].content);
    expect(r2.warnings).toEqual([]);
  });
});

describe("PR-3 / enforceDiagramDependencyIntegrity", () => {
  it("warns when a question references Diagram A but no Diagram A section exists", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        { type: "q-short", title: "Q1", content: "Use Diagram A to identify the labelled cell." },
        { type: "q-short", title: "Q2", content: "What is shown in Diagram A?" },
      ],
    };
    const r = enforceDiagramDependencyIntegrity(ws);
    expect(r.warnings.length).toBeGreaterThanOrEqual(1);
    expect(r.warnings[0]).toMatch(/Diagram A/);
    expect(r.warnings[0]).toMatch(/Q1.*Q2|Q2.*Q1/);
  });

  it("is a no-op when the referenced diagram section exists (matched by type)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        { type: "diagram-a", title: "Diagram A", content: "(diagram of cell)" },
        { type: "q-short", title: "Q1", content: "Use Diagram A to identify the labelled cell." },
      ],
    };
    expect(enforceDiagramDependencyIntegrity(ws).warnings).toEqual([]);
  });

  it("is a no-op when no question references any diagram", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [{ type: "q-short", title: "Q1", content: "What is 2 + 2?" }],
    };
    expect(enforceDiagramDependencyIntegrity(ws).warnings).toEqual([]);
  });

  it("never rewrites content (warn-only)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [{ type: "q-short", title: "Q1", content: "Use Diagram A here." }],
    };
    const r = enforceDiagramDependencyIntegrity(ws);
    expect(r.worksheet.sections![0].content).toBe("Use Diagram A here.");
  });

  it("is idempotent", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [{ type: "q-short", title: "Q1", content: "Use Diagram A here." }],
    };
    const r1 = enforceDiagramDependencyIntegrity(ws);
    const r2 = enforceDiagramDependencyIntegrity(r1.worksheet);
    expect(r2.warnings).toEqual(r1.warnings);
  });
});

describe("PR-3 / enforceDistractorPedagogy", () => {
  it("warns when an MCQ has duplicate distractors", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        {
          type: "q-mcq",
          title: "Q1",
          content: "Which is the largest planet?\nA. Jupiter ✓\nB. Mars\nC. Mars\nD. Saturn",
        },
      ],
    };
    const r = enforceDistractorPedagogy(ws);
    expect(r.warnings.some(w => /duplicate distractor/i.test(w))).toBe(true);
  });

  it("warns when a distractor is one character away from the correct answer (typo decoy)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        {
          type: "q-mcq",
          title: "Q1",
          content: "What is photosynthesis?\nA. The process plants use to make food ✓\nB. The process plants use to make foods\nC. Respiration\nD. Pollination",
        },
      ],
    };
    const r = enforceDistractorPedagogy(ws);
    expect(r.warnings.some(w => /one character away|typo decoy/i.test(w))).toBe(true);
  });

  it("warns on near-empty distractors", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        {
          type: "q-mcq",
          title: "Q1",
          content: "What is 2 + 2?\nA. 4 ✓\nB. 5\nC. 6\nD. -",
        },
      ],
    };
    const r = enforceDistractorPedagogy(ws);
    expect(r.warnings.some(w => /near-empty distractor/i.test(w))).toBe(true);
  });

  it("is a no-op when distractors are substantive misconceptions", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        {
          type: "q-mcq",
          title: "Q1",
          content: "What is 4/8 in lowest terms?\nA. 1/2 ✓\nB. 4/8\nC. 2/4\nD. 0.5",
        },
      ],
    };
    expect(enforceDistractorPedagogy(ws).warnings).toEqual([]);
  });

  it("is idempotent — running twice yields the same warnings", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        {
          type: "q-mcq",
          title: "Q1",
          content: "What is 2 + 2?\nA. 4 ✓\nB. 4\nC. 5\nD. 6",
        },
      ],
    };
    const r1 = enforceDistractorPedagogy(ws);
    const r2 = enforceDistractorPedagogy(r1.worksheet);
    expect(r2.warnings).toEqual(r1.warnings);
  });
});

describe("PR-3 / enforceTier3VocabularyDeclared", () => {
  it("warns when a Tier 3 word in a question stem is not in the Word Bank", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        {
          type: "vocabulary",
          title: "Key Vocabulary",
          content: "Photosynthesis: process of making food from light",
        },
        {
          type: "q-short",
          title: "Q1",
          content: "Describe how photosynthesis relates to respiration in mitochondria.",
        },
      ],
    };
    const r = enforceTier3VocabularyDeclared(ws);
    // "respiration" and "mitochondria" are >= 11 chars and not in vocab
    expect(r.warnings.some(w => /respiration/.test(w))).toBe(true);
    expect(r.warnings.some(w => /mitochondria/.test(w))).toBe(true);
    // "photosynthesis" IS in vocab — should NOT warn
    expect(r.warnings.some(w => /photosynthesis/.test(w))).toBe(false);
  });

  it("is a no-op when the worksheet has no vocabulary section (KS1 / number-bond practice)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        { type: "q-short", title: "Q1", content: "Describe how photosynthesis works." },
      ],
    };
    expect(enforceTier3VocabularyDeclared(ws).warnings).toEqual([]);
  });

  it("does not flag everyday polysyllabic words on the stop list", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        { type: "vocabulary", title: "Key Vocabulary", content: "Force: a push or pull" },
        { type: "q-short", title: "Q1", content: "Investigate the force using a thermometer carefully." },
      ],
    };
    const r = enforceTier3VocabularyDeclared(ws);
    // "investigate" and "thermometer" are on the stop list
    expect(r.warnings.some(w => /investigate/.test(w))).toBe(false);
    expect(r.warnings.some(w => /thermometer/.test(w))).toBe(false);
  });

  it("never rewrites content (warn-only)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        { type: "vocabulary", title: "Key Vocabulary", content: "Force: a push or pull" },
        { type: "q-short", title: "Q1", content: "Describe photosynthesis briefly." },
      ],
    };
    const before = ws.sections![1].content;
    const r = enforceTier3VocabularyDeclared(ws);
    expect(r.worksheet.sections![1].content).toBe(before);
  });

  it("is idempotent", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      sections: [
        { type: "vocabulary", title: "Key Vocabulary", content: "Force: a push" },
        { type: "q-short", title: "Q1", content: "Describe photosynthesis briefly." },
      ],
    };
    const r1 = enforceTier3VocabularyDeclared(ws);
    const r2 = enforceTier3VocabularyDeclared(r1.worksheet);
    expect(r2.warnings).toEqual(r1.warnings);
  });
});

describe("PR-3 / runWorksheetPostValidators integration", () => {
  it("the four new validators show up in the chain output", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Mathematics", topic: "Multiplication", yearGroup: "Year 7" },
      sections: [
        { type: "vocabulary", title: "Key Vocabulary", content: "Multiplication: repeated addition" },
        { type: "q-mcq", title: "Q1", content: "What is 3 x 4?\nA. 12 ✓\nB. 12\nC. 7\nD. 7" },
        { type: "q-short", title: "Q2", content: "Use Diagram A to find the answer." },
      ],
    };
    const r = runWorksheetPostValidators(ws, {
      subject: "Mathematics", topic: "Multiplication", yearGroup: "Year 7",
    });
    // Notation hygiene rewrote `3 x 4` to `3 × 4`
    expect(r.worksheet.sections![1].content).toMatch(/3 × 4/);
    // Diagram integrity warned about missing Diagram A
    expect(r.warnings.some(w => /Diagram A/.test(w))).toBe(true);
    // Distractor pedagogy warned about duplicate distractors
    expect(r.warnings.some(w => /duplicate distractor/i.test(w))).toBe(true);
  });
});



// ─── PR-8 — Data-driven post-validator chain (audit item #74) ────────────────
//
// The 22-step validator chain that `runWorksheetPostValidators` walks
// is now a data-driven registry: `WORKSHEET_POST_VALIDATORS` in
// `worksheetPostValidatorRegistry.ts`. The legacy entry point still
// exposes the same `runWorksheetPostValidators(ws, opts)` API, but
// callers can now pass `opts.validatorOverrides` (a
// `Record<name, boolean>`) to disable individual validators by name
// without forking the chain. This block locks the registry's
// observable behaviour:
//
//   - Order is preserved (and matches the pre-PR-8 inline chain).
//   - Disabling a validator by name skips it (no warnings from that
//     row, no rewrites that row would have made).
//   - Unknown override keys are surfaced via a warning so a typo in
//     tenant config is observable instead of silently disabling
//     nothing.
//   - The runner stays idempotent: running twice on the same input is
//     deep-equal to running once.

import {
  WORKSHEET_POST_VALIDATORS,
  listValidatorNames,
  runRegistry,
} from "../../client/src/lib/worksheetPostValidatorRegistry";

describe("PR-8 / WORKSHEET_POST_VALIDATORS — registry order matches the pre-refactor chain", () => {
  // The exact order the legacy `for (const fn of [ … ])` block ran in,
  // captured here as a string array so a future reorder shows up as a
  // diff rather than passing silently.
  //
  // Lane 1 (pre-pilot fixes) — synced this list to the actual registry
  // including (a) the new `send-overlay-markers` validator added in
  // 1.6+1.7, and (b) the PR-10 through PR-27 validators that were
  // already registered but never reflected in this test array. The
  // mismatch was a pre-existing bug on main: a fresh `npm test`
  // surfaced two failing assertions (`registry order` /
  // `WORKSHEET_POST_VALIDATORS has one entry per expected validator`)
  // before any Lane 1 change. This list is now the true source of
  // truth — future PRs adding a validator must extend this array.
  const EXPECTED_ORDER: readonly string[] = [
    "single-mcq-correct",
    "dedupe-word-bank",
    "strip-foreign-diagrams",
    "strip-empty-diagram-placeholders",
    "year-group-lock",
    "cap-worked-example-steps",
    "strip-leaked-generator-instructions",
    "strip-visible-placeholders-and-answer-leakage",
    "reinforce-dyscalculia-maths-scaffolding",
    "reconcile-mark-scheme",
    "extract-misconception-links",
    "section-question-counts",
    "spec-anchor-presence",
    // Lane 1.6 + 1.7 — Phase 4 SEND-overlay marker enforcer (HI Topic
    // Summary insertion + Anxiety section title rewrites).
    "send-overlay-markers",
    "self-reflection-topic-anchor",
    "revision-tips-presence",
    "curriculum-authority-invariants",
    "command-word-fidelity",
    "si-unit-normalisation",
    "reading-age-budget",
    "maths-notation-hygiene",
    "diagram-dependency-integrity",
    "distractor-pedagogy",
    "tier3-vocabulary-declared",
    // PR-10 through PR-27 — validators registered in the registry but
    // missing from this expected list before Lane 1.
    "bias-sensitivity",
    "mark-scheme-upgrades",
    "bloom-progression",
    "past-paper-fingerprint",
    "accessibility-audit",
    "sp-vocabulary-library",
    "spec-point-taxonomy",
    "ks5-synoptic",
    "diagram-page-fit",
    "citation-grounding",
    "tier-ao-histogram",
  ];

  it("listValidatorNames() returns the registered order", () => {
    expect(listValidatorNames()).toEqual(EXPECTED_ORDER);
  });

  it("WORKSHEET_POST_VALIDATORS has one entry per expected validator (no duplicates, no gaps)", () => {
    const names = WORKSHEET_POST_VALIDATORS.map((r) => r.name);
    expect(names).toEqual(EXPECTED_ORDER);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every registered validator has a kebab-case name (no whitespace, no camelCase)", () => {
    const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const entry of WORKSHEET_POST_VALIDATORS) {
      expect(entry.name).toMatch(KEBAB);
    }
  });

  it("WORKSHEET_POST_VALIDATORS is frozen — registry mutation is rejected", () => {
    expect(Object.isFrozen(WORKSHEET_POST_VALIDATORS)).toBe(true);
  });
});

describe("PR-8 / runRegistry — ranNames + skippedNames audit trail", () => {
  it("runs every registered validator by default and reports each in ranNames", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "English", topic: "Macbeth", yearGroup: "Year 10" },
      sections: [{ type: "q-short", title: "Q1", content: "Explain how Macbeth feels." }],
    };
    const r = runRegistry(ws, { subject: "English", topic: "Macbeth", yearGroup: "Year 10" });
    expect(r.ranNames).toEqual(listValidatorNames());
    expect(r.skippedNames).toEqual([]);
  });

  it("disabling a validator by name skips it and records the skip", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "English", topic: "Macbeth", yearGroup: "Year 10" },
      sections: [{ type: "q-short", title: "Q1", content: "Explain how Macbeth feels." }],
    };
    const r = runRegistry(
      ws,
      { subject: "English", topic: "Macbeth", yearGroup: "Year 10" },
      { "command-word-fidelity": false },
    );
    expect(r.ranNames).not.toContain("command-word-fidelity");
    expect(r.skippedNames).toContain("command-word-fidelity");
    // Other validators still ran.
    expect(r.ranNames).toContain("single-mcq-correct");
    expect(r.ranNames).toContain("tier3-vocabulary-declared");
  });

  it("setting an override to true is a no-op (defaults are already enabled)", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "English", topic: "Macbeth", yearGroup: "Year 10" },
      sections: [{ type: "q-short", title: "Q1", content: "Explain Macbeth." }],
    };
    const baseline = runRegistry(ws, { subject: "English" });
    const explicit = runRegistry(ws, { subject: "English" }, { "command-word-fidelity": true });
    expect(explicit.ranNames).toEqual(baseline.ranNames);
    expect(explicit.skippedNames).toEqual(baseline.skippedNames);
  });
});

describe("PR-8 / runRegistry — disabling a validator stops its warnings", () => {
  it("disabling si-unit-normalisation suppresses the SI-unit warning", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa" },
      sections: [
        { type: "q-short", title: "Q1", content: "A car travels at 60 mph. Calculate the time." },
      ],
    };

    const onChain = runRegistry(ws, {
      subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa",
    });
    expect(onChain.warnings.some((w) => /SI units/i.test(w))).toBe(true);

    const offChain = runRegistry(
      ws,
      { subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa" },
      { "si-unit-normalisation": false },
    );
    expect(offChain.warnings.some((w) => /SI units/i.test(w))).toBe(false);
    expect(offChain.skippedNames).toContain("si-unit-normalisation");
  });

  it("disabling maths-notation-hygiene leaves `x` un-rewritten", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Mathematics", topic: "Multiplication", yearGroup: "Year 7" },
      sections: [{ type: "q-short", title: "Q1", content: "Calculate 3 x 4." }],
    };

    const offChain = runRegistry(
      ws,
      { subject: "Mathematics", topic: "Multiplication", yearGroup: "Year 7" },
      { "maths-notation-hygiene": false },
    );
    // The rewriter never ran, so `3 x 4` is preserved verbatim.
    expect(offChain.worksheet.sections![0].content).toMatch(/3 x 4/);
    expect(offChain.skippedNames).toContain("maths-notation-hygiene");
  });
});

describe("PR-8 / runRegistry — unknown overrides are reported, never silent", () => {
  it("collects unknown override keys into result.unknownOverrides", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "English", yearGroup: "Year 10" },
      sections: [{ type: "q-short", title: "Q1", content: "Explain." }],
    };
    const r = runRegistry(
      ws,
      {},
      {
        "command-word-fidelity": false,
        "not-a-real-validator": false,
        "another-typo-name": true,
      },
    );
    expect(r.unknownOverrides).toEqual(
      expect.arrayContaining(["not-a-real-validator", "another-typo-name"]),
    );
    expect(r.unknownOverrides).not.toContain("command-word-fidelity");
  });

  it("an unknown override does not stop the rest of the chain from running", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "English", yearGroup: "Year 10" },
      sections: [{ type: "q-short", title: "Q1", content: "Explain." }],
    };
    const r = runRegistry(ws, {}, { "not-a-real-validator": false });
    expect(r.ranNames).toEqual(listValidatorNames());
    expect(r.skippedNames).toEqual([]);
  });
});

describe("PR-8 / runRegistry — purity and idempotency", () => {
  it("running the registry twice produces deep-equal results", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa" },
      sections: [
        { type: "q-short", title: "Q1", content: "A car travels at 60 mph. Calculate the time." },
        { type: "q-mcq", title: "Q2", content: "What is 3 x 4?\nA. 12\nB. 11\nC. 7\nD. 13" },
      ],
    };
    const opts = { subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa" };
    const r1 = runRegistry(ws, opts);
    const r2 = runRegistry(r1.worksheet, opts);
    // Warnings on the SECOND pass should be empty (the first pass
    // already rewrote / warned on every drift), or at minimum equal
    // to itself across consecutive idempotent passes — i.e. the
    // worksheet has reached a fixed point.
    const r3 = runRegistry(r2.worksheet, opts);
    expect(r3.worksheet.sections).toEqual(r2.worksheet.sections);
    expect(r3.warnings).toEqual(r2.warnings);
  });

  it("does not mutate the input worksheet", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Mathematics", topic: "Multiplication", yearGroup: "Year 7" },
      sections: [{ type: "q-short", title: "Q1", content: "Calculate 3 x 4." }],
    };
    const before = JSON.parse(JSON.stringify(ws));
    runRegistry(ws, { subject: "Mathematics", topic: "Multiplication", yearGroup: "Year 7" });
    expect(ws).toEqual(before);
  });

  it("does not mutate the overrides object", () => {
    const overrides = { "command-word-fidelity": false };
    const before = { ...overrides };
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "English", yearGroup: "Year 10" },
      sections: [{ type: "q-short", title: "Q1", content: "Explain." }],
    };
    runRegistry(ws, {}, overrides);
    expect(overrides).toEqual(before);
  });
});

describe("PR-8 / runWorksheetPostValidators — backwards compatibility", () => {
  it("legacy callers (no validatorOverrides) get the same warning surface as before", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa" },
      sections: [
        { type: "q-short", title: "Q1", content: "Reflect on a car travelling at 60 mph." },
      ],
    };
    const r = runWorksheetPostValidators(ws, {
      subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa",
    });
    // Both PR-2 warnings are still present (proves the chain still
    // runs end-to-end after the registry refactor).
    expect(r.warnings.some((w) => /Command-word fidelity.*reflect on/i.test(w))).toBe(true);
    expect(r.warnings.some((w) => /SI units.*miles per hour/i.test(w))).toBe(true);
    // qaScore stamping (PR-4) still happens after the chain.
    expect(r.worksheet.metadata?.qaScore).toBeDefined();
  });

  it("validatorOverrides on PostValidatorOptions disables a single row of the chain", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa" },
      sections: [
        { type: "q-short", title: "Q1", content: "Reflect on a car travelling at 60 mph." },
      ],
    };
    const r = runWorksheetPostValidators(ws, {
      subject: "Physics", topic: "Forces", yearGroup: "Year 10", examBoard: "aqa",
      validatorOverrides: { "command-word-fidelity": false },
    });
    // SI-unit warning still fires …
    expect(r.warnings.some((w) => /SI units.*miles per hour/i.test(w))).toBe(true);
    // … but the disabled command-word-fidelity warning does not.
    expect(r.warnings.some((w) => /Command-word fidelity/i.test(w))).toBe(false);
  });

  it("an unknown validatorOverrides key produces a `[Phase PR-8 — Validator registry]` warning", () => {
    const ws: PostValidatorWorksheet = {
      title: "T",
      metadata: { subject: "English", yearGroup: "Year 10" },
      sections: [{ type: "q-short", title: "Q1", content: "Explain." }],
    };
    const r = runWorksheetPostValidators(ws, {
      validatorOverrides: { "not-a-real-validator": false },
    });
    expect(
      r.warnings.some((w) =>
        /\[Phase PR-8 — Validator registry\] Unknown validatorOverrides key 'not-a-real-validator'/.test(
          w,
        ),
      ),
    ).toBe(true);
  });
});
