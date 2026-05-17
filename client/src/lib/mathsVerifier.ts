/**
 * mathsVerifier.ts — FEAT-PB2 · Phase B
 *
 * Symbolic maths verification (CAS round-trip).
 *
 * Re-evaluates numeric/algebraic answers on maths worksheets after
 * generation but before render. Mismatches surface as a teacher-only
 * banner; the worksheet is never blocked.
 *
 * Self-contained mini-CAS — no `mathjs` dep, ~0kb bundle delta.
 * Pure functions, no I/O, never throws. Every CAS error becomes an
 * `unverified` row, never a fatal failure.
 *
 * Capabilities (intentional minimum, expand only when teachers report drift):
 *   - Numeric arithmetic:    `Calculate 3 × 4 + 2`     → `14`
 *   - Linear equations:       `Solve 2x + 6 = 14`       → `x = 4`
 *   - Polynomial simplify:    `3x + 5x + 2 - 1`         → `8x + 1`
 *   - Anything else (calculus, geometry, prose) → `unverified` with reason.
 *
 * The narrow scope is deliberate. A noisy verifier that flags quadratics
 * as "unverified" wouldn't help; a tight verifier that catches the most
 * common drift patterns (wrong arithmetic, sign-flipped solve) does.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type VerificationKind = "numeric" | "expression" | "equation" | "unknown";
export type VerificationStatus = "ok" | "mismatch" | "unverified";

export interface ExtractedAnswer {
  kind: VerificationKind;
  /** LHS of an equation (e.g. "2x + 6") or the expression itself. */
  lhs?: string;
  /** RHS of an equation (e.g. "14"). */
  rhs?: string;
  /** Teacher-stated expected answer (e.g. "x = 4" or "14"). */
  expected: string;
  /** Original raw text the answer was extracted from (for the panel). */
  raw: string;
}

export interface VerificationResult {
  status: VerificationStatus;
  cas?: string;
  reason?: string;
}

export interface VerificationReport {
  perQuestion: Array<{
    sectionIndex: number;
    sectionTitle?: string;
    kind: VerificationKind;
    raw: string;
    expected: string;
    status: VerificationStatus;
    cas?: string;
    reason?: string;
  }>;
  counts: { ok: number; mismatch: number; unverified: number };
  ranAt?: string;
  durationMs?: number;
}

interface VerifierSection {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  marks?: number;
  [key: string]: unknown;
}

interface VerifierWorksheet {
  sections?: VerifierSection[];
  metadata?: { subject?: string; postValidatorWarnings?: string[]; [k: string]: unknown };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TOL = 1e-9;

// Sections we treat as "question containers" worth verifying.
const QUESTION_TYPES = new Set([
  "q-true-false", "q-mcq", "q-gap-fill", "q-short-answer", "q-extended",
  "q-data-table", "q-graph", "q-error-correction", "q-what-changed",
  "q-constraint-problem", "q-challenge", "challenge", "question", "questions",
  "extended-answer", "exam-question",
]);

const TEACHER_ANSWER_TYPES = new Set([
  "mark-scheme", "answers", "teacher-key", "teacher-notes",
]);

// ─── Subject gating ──────────────────────────────────────────────────────────

export function isMathsSubject(subject: string | undefined): boolean {
  if (!subject) return false;
  return /\b(maths?|mathematics|numeracy|further\s*maths)\b/i.test(subject);
}

// ─── Section detection ───────────────────────────────────────────────────────

function isQuestionSection(s: VerifierSection): boolean {
  if (s.teacherOnly) return false;
  const t = String(s.type || "").toLowerCase();
  if (QUESTION_TYPES.has(t)) return true;
  if (/^section\s*[a-c]\b/i.test(String(s.title || ""))) return true;
  return /\[\s*\d+\s*marks?\s*\]/i.test(String(s.content || ""));
}

function findMarkSchemeSection(sections: VerifierSection[]): VerifierSection | undefined {
  return sections.find((s) => {
    const t = String(s.type || "").toLowerCase();
    return TEACHER_ANSWER_TYPES.has(t) || /mark\s*scheme|answer\s*key|teacher\s*key/i.test(String(s.title || ""));
  });
}

// ─── Mark-scheme parsing: build a Q-number → answer-line map ────────────────

const MS_LINE_RE = /^\s*Q?(\d+)[\.\)\:]?\s*(.+?)\s*$/i;

export function parseMarkSchemeMap(content: string | undefined): Record<number, string> {
  const out: Record<number, string> = {};
  if (!content) return out;
  const lines = String(content).split(/\n+/);
  for (const line of lines) {
    const m = MS_LINE_RE.exec(line);
    if (!m) continue;
    const qNum = parseInt(m[1], 10);
    if (!Number.isFinite(qNum) || qNum <= 0 || qNum > 99) continue;
    const answer = m[2].trim();
    if (answer.length === 0 || answer.length > 1000) continue;
    // Skip headings like "Q4 UNDERSTANDING [5 marks]:" with no answer body.
    if (/^[A-Z][A-Z\s]+\[\d+\s*marks?\]:?$/.test(answer)) continue;
    if (!out[qNum]) out[qNum] = answer;
  }
  return out;
}

// ─── Answer extraction from a question + mark-scheme line ───────────────────

const EQ_PATTERN_RE = /([a-z])\s*=\s*(-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)/i;
const NUMERIC_ANSWER_RE = /(?:^|[\s=:])(-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*$/;
const SOLVE_STEM_RE = /\b(solve|find\s+the\s+value\s+of|find\s+x|work\s+out\s+x)\b[^.]{0,200}?([\-+\d\.\sa-zA-Z\(\)\^\*\/]+?=\s*[\-+\d\.\sa-zA-Z\(\)\^\*\/]+)/i;
const CALC_STEM_RE = /\b(calculate|evaluate|work\s+out|compute|find\s+the\s+result\s+of)\b\s*:?\s*([\-+\d\.\s\(\)\*\/×÷]+?)(?=\s*(?:[.?!\[]|$))/i;

/**
 * Extracts a verifiable expression from the *question* content. Returns null
 * when the question isn't a recognisable numeric/equation form.
 */
export function extractAnswerExpressions(question: VerifierSection, expected: string): ExtractedAnswer | null {
  const content = normaliseMath(String(question.content || ""));
  // 1. Equation form: "Solve 2x + 6 = 14" → kind=equation, lhs="2x+6", rhs="14"
  const solveMatch = SOLVE_STEM_RE.exec(content);
  if (solveMatch) {
    const eqStr = solveMatch[2].trim();
    const eqParts = eqStr.split("=");
    if (eqParts.length === 2) {
      return {
        kind: "equation",
        lhs: eqParts[0].trim(),
        rhs: eqParts[1].trim(),
        expected: expected.trim(),
        raw: solveMatch[0].trim(),
      };
    }
  }
  // 2. Numeric calculation form: "Calculate 3 × 4 + 2"
  const calcMatch = CALC_STEM_RE.exec(content);
  if (calcMatch) {
    return {
      kind: "numeric",
      lhs: calcMatch[2].trim(),
      expected: expected.trim(),
      raw: calcMatch[0].trim(),
    };
  }
  // 3. Bare numeric expected ("Q3: 14") → treat the question stem as the
  //    expression if it looks like pure arithmetic.
  if (NUMERIC_ANSWER_RE.test(expected) && /^[\-+\d\.\s\(\)\*\/×÷]+$/.test(stripPrompt(content))) {
    return {
      kind: "numeric",
      lhs: stripPrompt(content),
      expected: expected.trim(),
      raw: content.slice(0, 200),
    };
  }
  return null;
}

function stripPrompt(s: string): string {
  return s
    .replace(/^[^a-zA-Z0-9]*\d+\.\s*/, "")
    .replace(/\[\s*\d+\s*marks?\s*\]/gi, "")
    .replace(/[?!]/g, "")
    .trim();
}

/** Normalise common AI-emitted math symbols to ASCII. */
function normaliseMath(s: string): string {
  return s
    .replace(/[×✕]/g, "*")
    .replace(/÷/g, "/")
    .replace(/−|–|—/g, "-")
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\\frac\{(-?\d+)\}\{(-?\d+)\}/g, "($1/$2)")
    .replace(/\^/g, "**");
}

// ─── Numeric evaluation (sandboxed) ──────────────────────────────────────────

const NUMERIC_SAFE_RE = /^[\d+\-*/.()\s]+$/;

/**
 * Evaluates a pure-arithmetic expression. Returns null on any parse error or
 * if the input contains anything other than digits, basic operators and parens.
 */
export function evalNumeric(expr: string): number | null {
  const cleaned = normaliseMath(expr).replace(/\*\*/g, "^");
  // Convert ^ back to ** then strict-validate the remaining chars.
  const withPow = cleaned.replace(/\^/g, "**");
  if (!NUMERIC_SAFE_RE.test(withPow.replace(/\*\*/g, ""))) return null;
  try {
    // Use Function (not eval) so the expression evaluates in its own scope.
    // Input is whitelisted to digits/operators/parens above.
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${withPow});`);
    const v = fn();
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}

/** Parse "x = 4" or "14" or "1/2" → number (variable answer or fraction). */
export function parseExpectedNumeric(expected: string): { variable?: string; value: number } | null {
  const trimmed = expected.trim().replace(/[,]/g, "");
  // Variable form: "x = 4"
  const varMatch = EQ_PATTERN_RE.exec(trimmed);
  if (varMatch) {
    const v = evalNumeric(varMatch[2]);
    if (v !== null) return { variable: varMatch[1].toLowerCase(), value: v };
  }
  // Plain numeric (with optional fraction "12/4")
  const plainNum = evalNumeric(trimmed);
  if (plainNum !== null) return { value: plainNum };
  return null;
}

// ─── Polynomial: linear-form parser & solver ────────────────────────────────

/** Linear polynomial in a single variable: a*x + b. */
export interface Linear { a: number; b: number; variable: string }

const LINEAR_TERM_RE = /([+-]?\s*\d*\.?\d*)\s*\*?\s*([a-z])(?!\w)|([+-]?\s*\d+(?:\.\d+)?)/gi;

export function parseLinear(expr: string): Linear | null {
  const cleaned = normaliseMath(expr).replace(/\s+/g, "").replace(/\*\*/g, "^");
  // Reject anything containing exponents on the variable beyond ^1, parens, or other vars at the same time.
  if (/[a-z]\^[2-9]/i.test(cleaned)) return null;
  if (/[\(\)]/.test(cleaned)) return null;
  let a = 0;
  let b = 0;
  let variable = "";
  let consumed = 0;
  LINEAR_TERM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = LINEAR_TERM_RE.exec(cleaned)) !== null) {
    if (m[2]) {
      // Variable term
      const v = m[2].toLowerCase();
      if (variable && variable !== v) return null;
      variable = v;
      const coeffStr = (m[1] || "").replace(/\s+/g, "");
      const coeff = coeffStr === "" || coeffStr === "+" ? 1 :
                    coeffStr === "-" ? -1 : parseFloat(coeffStr);
      if (!Number.isFinite(coeff)) return null;
      a += coeff;
      consumed += m[0].length;
    } else if (m[3]) {
      const c = parseFloat(m[3].replace(/\s+/g, ""));
      if (!Number.isFinite(c)) return null;
      b += c;
      consumed += m[0].length;
    }
  }
  if (consumed !== cleaned.length) return null;
  return { a, b, variable: variable || "x" };
}

/** Solve `ax + b = cx + d` for the variable. */
export function solveLinear(lhs: string, rhs: string): { variable: string; value: number } | null {
  const L = parseLinear(lhs);
  const R = parseLinear(rhs);
  if (!L || !R) return null;
  const variable = L.variable !== "x" ? L.variable : R.variable;
  // (L.a - R.a) * x = (R.b - L.b)
  const slope = L.a - R.a;
  const constant = R.b - L.b;
  if (Math.abs(slope) < TOL) return null; // 0 = constant — degenerate
  const value = constant / slope;
  if (!Number.isFinite(value)) return null;
  return { variable, value };
}

// ─── verifyOne ───────────────────────────────────────────────────────────────

export function verifyOne(answer: ExtractedAnswer): VerificationResult {
  if (answer.kind === "unknown") {
    return { status: "unverified", reason: "Question kind not recognised" };
  }
  if (answer.kind === "numeric") {
    const computed = evalNumeric(answer.lhs || "");
    const expected = parseExpectedNumeric(answer.expected);
    if (computed === null || expected === null) {
      return { status: "unverified", reason: "Could not evaluate expression or parse expected answer" };
    }
    const ok = Math.abs(computed - expected.value) <= Math.max(TOL, Math.abs(expected.value) * TOL);
    return ok
      ? { status: "ok", cas: String(computed) }
      : {
          status: "mismatch",
          cas: String(computed),
          reason: `AI says ${expected.value}, CAS says ${computed}`,
        };
  }
  if (answer.kind === "equation") {
    const solution = solveLinear(answer.lhs || "", answer.rhs || "");
    const expected = parseExpectedNumeric(answer.expected);
    if (!solution || !expected) {
      return { status: "unverified", reason: "Equation outside linear-CAS scope" };
    }
    if (expected.variable && expected.variable !== solution.variable) {
      return {
        status: "unverified",
        reason: `Variable mismatch: expected ${expected.variable}, equation in ${solution.variable}`,
      };
    }
    const ok = Math.abs(solution.value - expected.value) <= Math.max(TOL, Math.abs(expected.value) * TOL);
    return ok
      ? { status: "ok", cas: `${solution.variable} = ${solution.value}` }
      : {
          status: "mismatch",
          cas: `${solution.variable} = ${solution.value}`,
          reason: `AI says ${solution.variable} = ${expected.value}, CAS says ${solution.variable} = ${solution.value}`,
        };
  }
  if (answer.kind === "expression") {
    // Simplifiable expressions: compare normalised linear forms.
    const lhs = parseLinear(answer.lhs || "");
    const rhs = parseLinear(answer.expected);
    if (!lhs || !rhs) return { status: "unverified", reason: "Expression outside linear-CAS scope" };
    const ok = Math.abs(lhs.a - rhs.a) <= TOL && Math.abs(lhs.b - rhs.b) <= TOL;
    return ok
      ? { status: "ok", cas: `${lhs.a}${lhs.variable} + ${lhs.b}` }
      : {
          status: "mismatch",
          cas: `${lhs.a}${lhs.variable} + ${lhs.b}`,
          reason: `Normal forms differ: ${lhs.a}${lhs.variable}+${lhs.b} vs ${rhs.a}${rhs.variable}+${rhs.b}`,
        };
  }
  return { status: "unverified", reason: "Unhandled kind" };
}

// ─── runMathsVerification ───────────────────────────────────────────────────

/**
 * Iterates every question section and runs CAS round-trip verification.
 * Pure, no I/O, never throws.
 */
export function runMathsVerification(worksheet: VerifierWorksheet): VerificationReport {
  const start = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const sections = worksheet.sections || [];
  const ms = findMarkSchemeSection(sections);
  const msMap = parseMarkSchemeMap(ms?.content);

  const perQuestion: VerificationReport["perQuestion"] = [];
  let qNum = 0;

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!isQuestionSection(s)) continue;
    qNum += 1;
    const expected = msMap[qNum] || "";
    if (!expected) {
      // No paired mark-scheme entry — silent skip (not "unverified" — that
      // would clutter the panel for retrieval/recall sections).
      continue;
    }
    let result: VerificationResult;
    let kind: VerificationKind = "unknown";
    let raw = "";
    let expectedNorm = expected;
    try {
      const extracted = extractAnswerExpressions(s, expected);
      if (!extracted) {
        result = { status: "unverified", reason: "Question stem not parseable as numeric/equation" };
        raw = String(s.content || "").slice(0, 200);
      } else {
        kind = extracted.kind;
        raw = extracted.raw;
        expectedNorm = extracted.expected;
        result = verifyOne(extracted);
      }
    } catch (err) {
      result = { status: "unverified", reason: `CAS error: ${err instanceof Error ? err.message : String(err)}` };
    }
    perQuestion.push({
      sectionIndex: i,
      sectionTitle: typeof s.title === "string" ? s.title : undefined,
      kind,
      raw,
      expected: expectedNorm,
      status: result.status,
      ...(result.cas ? { cas: result.cas } : {}),
      ...(result.reason ? { reason: result.reason } : {}),
    });
  }

  const counts = perQuestion.reduce(
    (acc, r) => {
      acc[r.status] += 1;
      return acc;
    },
    { ok: 0, mismatch: 0, unverified: 0 },
  );

  const end = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  return {
    perQuestion,
    counts,
    ranAt: new Date().toISOString(),
    durationMs: Math.round(end - start),
  };
}

// ─── applyMathsVerification ─────────────────────────────────────────────────

/**
 * Stamps `metadata.mathsVerification` onto a worksheet. No-op for non-maths
 * subjects or worksheets without question sections. Pushes a one-line summary
 * into `metadata.postValidatorWarnings` for any mismatches so the existing
 * teacher banner picks them up.
 */
export function applyMathsVerification<W extends VerifierWorksheet>(
  worksheet: W,
  opts: { subject?: string } = {},
): W {
  const subject = opts.subject || worksheet.metadata?.subject;
  if (!isMathsSubject(subject)) return worksheet;

  const sections = worksheet.sections || [];
  const hasMaths = sections.some((s) => {
    if (!isQuestionSection(s)) return false;
    const c = String(s.content || "");
    return /[+\-*/=]|\bsolve\b|\bcalculate\b|\bevaluate\b/i.test(c);
  });
  if (!hasMaths) return worksheet;

  let report: VerificationReport;
  try {
    report = runMathsVerification(worksheet);
  } catch (err) {
    // Never fail render — fall back to an empty report with a warning.
    const existing = (worksheet.metadata?.postValidatorWarnings as string[]) || [];
    return {
      ...worksheet,
      metadata: {
        ...(worksheet.metadata || {}),
        postValidatorWarnings: [
          ...existing,
          `PB2 maths verification skipped: ${err instanceof Error ? err.message : String(err)}`,
        ],
      },
    } as W;
  }

  if (report.perQuestion.length === 0) return worksheet;

  const warnings: string[] = [];
  for (const r of report.perQuestion) {
    if (r.status === "mismatch") {
      warnings.push(
        `PB2 maths CAS mismatch · ${r.sectionTitle || `Q${r.sectionIndex + 1}`}: ${r.reason || "see panel"}`,
      );
    }
  }
  const existing = (worksheet.metadata?.postValidatorWarnings as string[]) || [];
  const allWarnings = [...existing, ...warnings.filter((w) => !existing.includes(w))];

  return {
    ...worksheet,
    metadata: {
      ...(worksheet.metadata || {}),
      mathsVerification: report,
      ...(allWarnings.length > 0 ? { postValidatorWarnings: allWarnings } : {}),
    },
  } as W;
}
