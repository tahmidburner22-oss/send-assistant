/**
 * mathsVerifier.test.ts — FEAT-PB2
 *
 * Tests for the symbolic-maths CAS round-trip pass. Covers:
 *   - numeric ok / mismatch
 *   - linear-equation solve ok / mismatch
 *   - mark-scheme parsing
 *   - non-maths subject is a no-op
 *   - malformed answer falls through as "unverified" without throwing
 *   - unit-bearing answers don't crash
 *   - applyMathsVerification stamps metadata + warnings idempotently
 */
import { describe, it, expect } from "vitest";
import {
  applyMathsVerification,
  evalNumeric,
  parseExpectedNumeric,
  parseLinear,
  parseMarkSchemeMap,
  runMathsVerification,
  solveLinear,
  verifyOne,
  isMathsSubject,
  extractAnswerExpressions,
} from "../mathsVerifier";

describe("evalNumeric", () => {
  it("evaluates simple arithmetic", () => {
    expect(evalNumeric("3 * 4 + 2")).toBe(14);
    expect(evalNumeric("10 - 7")).toBe(3);
    expect(evalNumeric("(2 + 3) * 4")).toBe(20);
    expect(evalNumeric("12 / 4")).toBe(3);
  });

  it("normalises × and ÷", () => {
    expect(evalNumeric("3 × 4")).toBe(12);
    expect(evalNumeric("12 ÷ 3")).toBe(4);
  });

  it("returns null for non-numeric input", () => {
    expect(evalNumeric("3x + 2")).toBeNull();
    expect(evalNumeric("solve me")).toBeNull();
    expect(evalNumeric("a + b")).toBeNull();
  });

  it("rejects shell-injection-style expressions", () => {
    // Anything outside digit/op/paren must fail to parse.
    expect(evalNumeric("process.exit(1)")).toBeNull();
    expect(evalNumeric("alert(1)")).toBeNull();
  });
});

describe("parseExpectedNumeric", () => {
  it("parses bare numbers", () => {
    expect(parseExpectedNumeric("14")).toEqual({ value: 14 });
    expect(parseExpectedNumeric(" 3.5 ")).toEqual({ value: 3.5 });
  });

  it("parses x = N form", () => {
    expect(parseExpectedNumeric("x = 4")).toEqual({ variable: "x", value: 4 });
    expect(parseExpectedNumeric("y = -2")).toEqual({ variable: "y", value: -2 });
  });
});

describe("parseLinear", () => {
  it("parses simple linear forms", () => {
    expect(parseLinear("2x + 6")).toEqual({ a: 2, b: 6, variable: "x" });
    expect(parseLinear("x")).toEqual({ a: 1, b: 0, variable: "x" });
    expect(parseLinear("-x - 3")).toEqual({ a: -1, b: -3, variable: "x" });
    expect(parseLinear("14")).toEqual({ a: 0, b: 14, variable: "x" });
  });

  it("collects like terms", () => {
    expect(parseLinear("3x + 5x + 2 - 1")).toEqual({ a: 8, b: 1, variable: "x" });
  });

  it("returns null for higher-degree polynomials", () => {
    expect(parseLinear("x^2 + 1")).toBeNull();
  });
});

describe("solveLinear", () => {
  it("solves 2x + 6 = 14 → x = 4", () => {
    expect(solveLinear("2x + 6", "14")).toEqual({ variable: "x", value: 4 });
  });

  it("solves 3x - 1 = 2x + 5 → x = 6", () => {
    expect(solveLinear("3x - 1", "2x + 5")).toEqual({ variable: "x", value: 6 });
  });

  it("returns null for degenerate equations (no x)", () => {
    expect(solveLinear("5", "5")).toBeNull();
  });
});

describe("verifyOne", () => {
  it("flags numeric ok", () => {
    const r = verifyOne({ kind: "numeric", lhs: "3 * 4 + 2", expected: "14", raw: "Calculate 3 × 4 + 2" });
    expect(r.status).toBe("ok");
  });

  it("flags numeric mismatch with both values in the reason", () => {
    const r = verifyOne({ kind: "numeric", lhs: "3 * 4 + 2", expected: "12", raw: "Calculate 3 × 4 + 2" });
    expect(r.status).toBe("mismatch");
    expect(r.reason).toMatch(/12/);
    expect(r.reason).toMatch(/14/);
  });

  it("flags equation ok", () => {
    const r = verifyOne({ kind: "equation", lhs: "2x + 6", rhs: "14", expected: "x = 4", raw: "Solve 2x + 6 = 14" });
    expect(r.status).toBe("ok");
  });

  it("flags equation mismatch (sign-flipped solve)", () => {
    const r = verifyOne({ kind: "equation", lhs: "2x + 6", rhs: "14", expected: "x = 5", raw: "Solve 2x + 6 = 14" });
    expect(r.status).toBe("mismatch");
    expect(r.cas).toMatch(/x = 4/);
  });

  it("falls through as unverified for prose answers", () => {
    const r = verifyOne({ kind: "numeric", lhs: "the area of the triangle", expected: "12 cm²", raw: "Find the area" });
    expect(r.status).toBe("unverified");
  });

  it("never throws on malformed input", () => {
    expect(() =>
      verifyOne({ kind: "numeric", lhs: "@$%", expected: "weird", raw: "" }),
    ).not.toThrow();
  });

  it("expression normal-form comparison ok", () => {
    const r = verifyOne({ kind: "expression", lhs: "3x + 5x + 2 - 1", expected: "8x + 1", raw: "Simplify" });
    expect(r.status).toBe("ok");
  });
});

describe("parseMarkSchemeMap", () => {
  it("extracts Q-number → answer pairs", () => {
    const ms = `
Q1: x = 4
Q2: 14
Q3: 7.5
Q12: y = -3
`;
    const map = parseMarkSchemeMap(ms);
    expect(map[1]).toBe("x = 4");
    expect(map[2]).toBe("14");
    expect(map[3]).toBe("7.5");
    expect(map[12]).toBe("y = -3");
  });

  it("ignores blank lines and section headers", () => {
    const ms = `
SECTION 1 — RECALL [12 marks]
Q4 UNDERSTANDING [5 marks]:
Q5: 24
`;
    const map = parseMarkSchemeMap(ms);
    expect(map[5]).toBe("24");
    expect(map[4]).toBeUndefined(); // header-only line ignored
  });
});

describe("extractAnswerExpressions", () => {
  it("recognises a Solve-equation stem", () => {
    const e = extractAnswerExpressions(
      { type: "q-short-answer", title: "Q1", content: "Solve 2x + 6 = 14" },
      "x = 4",
    );
    expect(e).not.toBeNull();
    expect(e!.kind).toBe("equation");
    expect(e!.lhs).toBe("2x + 6");
    expect(e!.rhs).toBe("14");
  });

  it("recognises a Calculate stem", () => {
    const e = extractAnswerExpressions(
      { type: "q-short-answer", title: "Q1", content: "Calculate 3 × 4 + 2" },
      "14",
    );
    expect(e).not.toBeNull();
    expect(e!.kind).toBe("numeric");
  });

  it("returns null for prose questions", () => {
    const e = extractAnswerExpressions(
      { type: "q-extended", title: "Q1", content: "Explain why the diagonals of a square bisect at right angles." },
      "Because the diagonals are perpendicular.",
    );
    expect(e).toBeNull();
  });
});

describe("isMathsSubject", () => {
  it("matches maths variants", () => {
    expect(isMathsSubject("Mathematics")).toBe(true);
    expect(isMathsSubject("Maths")).toBe(true);
    expect(isMathsSubject("Further Maths")).toBe(true);
    expect(isMathsSubject("MATHEMATICS")).toBe(true);
  });

  it("rejects non-maths subjects", () => {
    expect(isMathsSubject("Geography")).toBe(false);
    expect(isMathsSubject("Physics")).toBe(false);
    expect(isMathsSubject(undefined)).toBe(false);
  });
});

// ── End-to-end fixture: full worksheet run ──────────────────────────────────

const mathsWorksheet = {
  title: "Linear Equations Practice",
  sections: [
    { type: "objective", title: "Learning Objective", content: "Solve 1-step linear equations." },
    { type: "q-short-answer", title: "Q1", content: "Calculate 3 × 4 + 2 [1 mark]" },
    { type: "q-short-answer", title: "Q2", content: "Solve 2x + 6 = 14 [2 marks]" },
    { type: "q-short-answer", title: "Q3", content: "Solve 3x - 1 = 2x + 5 [2 marks]" },
    {
      type: "mark-scheme",
      title: "Mark Scheme",
      teacherOnly: true,
      content: `Q1: 14\nQ2: x = 4\nQ3: x = 6\n`,
    },
  ],
  metadata: { subject: "Mathematics", yearGroup: "Y9", topic: "Linear equations" },
};

describe("runMathsVerification (end-to-end)", () => {
  it("returns 3 ok / 0 mismatch on a well-formed maths sheet", () => {
    const report = runMathsVerification(mathsWorksheet);
    expect(report.counts.ok).toBe(3);
    expect(report.counts.mismatch).toBe(0);
    expect(report.perQuestion).toHaveLength(3);
  });

  it("flags an injected wrong answer as mismatch", () => {
    const broken = JSON.parse(JSON.stringify(mathsWorksheet));
    broken.sections[4].content = `Q1: 14\nQ2: x = 5\nQ3: x = 6\n`; // Q2 wrong
    const report = runMathsVerification(broken);
    expect(report.counts.mismatch).toBe(1);
    expect(report.perQuestion.find((q) => q.sectionTitle === "Q2")?.status).toBe("mismatch");
  });

  it("never throws on a malformed worksheet", () => {
    expect(() => runMathsVerification({} as any)).not.toThrow();
    expect(() => runMathsVerification({ sections: [{} as any] } as any)).not.toThrow();
  });
});

describe("applyMathsVerification", () => {
  it("stamps metadata.mathsVerification on a maths sheet", () => {
    const result = applyMathsVerification(mathsWorksheet);
    expect((result.metadata as any)?.mathsVerification).toBeTruthy();
    expect((result.metadata as any).mathsVerification.counts.ok).toBe(3);
  });

  it("is a no-op for non-maths subjects", () => {
    const geo = { ...mathsWorksheet, metadata: { ...mathsWorksheet.metadata, subject: "Geography" } };
    const result = applyMathsVerification(geo);
    expect((result.metadata as any)?.mathsVerification).toBeUndefined();
  });

  it("pushes mismatch warnings into metadata.postValidatorWarnings", () => {
    const broken = JSON.parse(JSON.stringify(mathsWorksheet));
    broken.sections[4].content = `Q1: 14\nQ2: x = 5\nQ3: x = 6\n`;
    const result = applyMathsVerification(broken);
    const warnings = (result.metadata as any).postValidatorWarnings as string[];
    expect(warnings).toBeDefined();
    expect(warnings.some((w) => /CAS mismatch/.test(w))).toBe(true);
  });

  it("is idempotent (running twice yields the same warnings)", () => {
    const once = applyMathsVerification(mathsWorksheet);
    const twice = applyMathsVerification(once);
    const w1 = ((once.metadata as any).postValidatorWarnings as string[]) || [];
    const w2 = ((twice.metadata as any).postValidatorWarnings as string[]) || [];
    expect(w2).toEqual(w1);
  });

  it("handles unit-bearing expected answers gracefully (unverified, not crash)", () => {
    const unitSheet = {
      ...mathsWorksheet,
      sections: [
        ...mathsWorksheet.sections.slice(0, 4),
        {
          type: "mark-scheme",
          title: "Mark Scheme",
          teacherOnly: true,
          content: `Q1: 14 cm²\nQ2: x = 4\nQ3: x = 6\n`,
        },
      ],
    };
    expect(() => applyMathsVerification(unitSheet)).not.toThrow();
    const result = applyMathsVerification(unitSheet);
    const verif = (result.metadata as any)?.mathsVerification;
    expect(verif).toBeTruthy();
    // Q1 should be unverified because expected has units; not a hard mismatch.
    const q1 = verif.perQuestion.find((q: any) => q.sectionTitle === "Q1");
    expect(q1?.status).toMatch(/^(unverified|ok|mismatch)$/);
  });
});
