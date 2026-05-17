/**
 * mathsProgressionAudit.ts — PR-M2
 *
 * Every maths worksheet must show a difficulty curve from Section A → Section
 * B → Section C. The generator now emits three structured sections with
 * specific mark-per-question targets, but the LLM occasionally drifts (e.g.
 * fills Section B with 1-mark Qs, or slips a "describe / explain" command
 * word into Section C against the calculation-only rule).
 *
 * This module is the deterministic post-pass that checks the rule actually
 * held. It is *non-blocking* by design — it follows the same shape as
 * mathsStrandTagger.ts and pillarAValidator.ts:
 *
 *   1. Read the worksheet sections, find the three maths question blocks.
 *   2. Parse mark allocations from each numbered question (`[N mark]` /
 *      `[N marks]`). Compute average marks-per-question per section.
 *   3. Check progression: avg(A) < avg(B) < avg(C). Strict inequality so a
 *      sheet that ties A and B (e.g. all 2-mark) trips the warning.
 *   4. Check Section C command words: every numbered question must START with
 *      an allowed calculation verb. Forbidden verbs (describe, explain, etc.)
 *      raise a per-question warning.
 *   5. Stamp metadata.mathsProgressionAudit with the full report and push
 *      any warnings into metadata.postValidatorWarnings so the existing
 *      teacher-facing yellow banner picks them up automatically.
 *
 * No regeneration loop. No LLM calls. Deterministic and zero-cost. If active
 * regeneration becomes desirable later, the audit report contains everything
 * the orchestrator needs to make that decision.
 *
 * No-op for non-maths subjects.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProgressionSlot = "A" | "B" | "C";

export interface ProgressionSectionReport {
  slot: ProgressionSlot;
  sectionTitle: string;
  questionCount: number;
  totalMarks: number;
  /** Total marks divided by question count, rounded to 2 d.p. */
  avgMarks: number;
  /** Per-question mark values in the order they appeared. */
  perQuestionMarks: number[];
}

export interface ProgressionCommandWordViolation {
  slot: ProgressionSlot;
  questionNumber: number;
  bannedVerb: string;
  preview: string;
}

export interface MathsProgressionAuditReport {
  /** Per-section breakdown, ordered A → B → C. Only sections present on the
   *  worksheet appear here. */
  sections: ProgressionSectionReport[];
  /** True when avg(A) < avg(B) < avg(C) (strict). Treated as "n/a" — i.e.
   *  not failed — when one or more sections are missing. */
  progressionHolds: boolean | "n/a";
  /** Section C command-word audit. */
  commandWordViolations: ProgressionCommandWordViolation[];
  /** Detected year group as a number (7-11), or undefined if not parseable. */
  yearNumber?: number;
  /** Branch chosen for Section C: "problem-solving" (Y7-8) or "exam-style"
   *  (Y9-11), or undefined when year-group can't be parsed. */
  sectionCBranch?: "problem-solving" | "exam-style";
  /** Human-readable warnings, suitable for the teacher banner. */
  warnings: string[];
}

interface AuditableSection {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  [key: string]: unknown;
}

interface AuditableWorksheet {
  title?: string;
  sections?: AuditableSection[];
  metadata?: Record<string, unknown> & {
    subject?: string;
    mathsProgressionAudit?: MathsProgressionAuditReport;
    postValidatorWarnings?: string[];
  };
  [key: string]: unknown;
}

export interface MathsProgressionAuditOptions {
  subject?: string;
  yearGroup?: string;
}

// ─── Subject + section detection ─────────────────────────────────────────────

function isMathsSubject(subject: string | undefined): boolean {
  return /math/i.test(subject || "");
}

/**
 * Decide which slot (A/B/C) — if any — a section belongs to. Match the
 * exact titles emitted by ai.ts for the maths path. Section C is the
 * "Section C — Problem Solving" / "Section C — Exam-Style Practice" /
 * "Section C — Core Practice" / "Challenge Question" block. The legacy
 * "Challenge Question" title is included for backwards compatibility with
 * worksheets generated before PR-M2.
 */
function classifySectionSlot(
  s: AuditableSection,
): ProgressionSlot | undefined {
  if (s.teacherOnly) return undefined;
  const title = String(s.title || "").toLowerCase();
  // Skip the gap-fill warm-up — its title is "Warm-Up …" so won't match
  // "section a" anyway, but be explicit to be safe.
  if (/warm[-\s]?up/.test(title)) return undefined;
  // Section A — first numbered-question block, marked as "Section A …".
  if (/\bsection\s*a\b/.test(title)) return "A";
  if (/\bsection\s*b\b/.test(title)) return "B";
  if (/\bsection\s*c\b/.test(title)) return "C";
  // Legacy fallback: pre-PR-M2 sheets used "Challenge Question" as the
  // last block. Treat it as the C slot for the audit.
  if (/^challenge\b/.test(title)) return "C";
  return undefined;
}

// ─── Mark parsing ────────────────────────────────────────────────────────────

/**
 * Pull numbered questions and their mark allocations out of a section's
 * content string. Examples we need to handle:
 *   "1. Calculate ... [2 marks]"
 *   "2. Work out ... [1 mark]"
 *   "3. Find x given ... [3 marks]"
 *
 * Returns one entry per numbered question, in order. Skips non-question
 * preamble (the "Answer all questions. Show all working. [N marks]" line).
 */
function extractQuestions(
  content: string,
): Array<{ number: number; text: string; marks: number }> {
  const out: Array<{ number: number; text: string; marks: number }> = [];
  if (!content) return out;
  // Split on lines that start with "1." / "2." / etc. We accept up to two
  // leading spaces of indentation but require a digit then a dot.
  const lines = content.split(/\r?\n/);
  let buffer = "";
  let currentNum: number | null = null;
  const flush = () => {
    if (currentNum === null) return;
    const marks = parseMarksFromLine(buffer);
    out.push({ number: currentNum, text: buffer.trim(), marks });
    currentNum = null;
    buffer = "";
  };
  for (const line of lines) {
    const m = /^\s*(\d+)\.\s+(.*)$/.exec(line);
    if (m) {
      flush();
      currentNum = Number(m[1]);
      buffer = m[2];
    } else if (currentNum !== null) {
      buffer += "\n" + line;
    }
  }
  flush();
  return out;
}

/**
 * Pull the trailing "[N mark]" / "[N marks]" out of a question line. If
 * absent, default to 1 — matching the renderer's fallback.
 */
function parseMarksFromLine(line: string): number {
  const m = /\[\s*(\d+)\s*marks?\s*\]/i.exec(line);
  if (!m) return 1;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// ─── Section C command-word audit ────────────────────────────────────────────

/**
 * Forbidden writing verbs for Section C — these signal an "explain in
 * words" question, which the maths spec forbids. The detector flags any
 * Section C question whose stem starts with one of these. The allowed
 * calculation verbs (Calculate, Work out, Find, Solve, Show that, …) are
 * encoded implicitly: anything not on the forbidden list passes.
 */
const FORBIDDEN_WRITING_VERBS = [
  "describe",
  "explain",
  "discuss",
  "comment on",
  "compare",
  "justify",
  "outline",
  "state why",
  "give reasons",
  "to what extent",
];

function detectBannedVerb(questionText: string): string | undefined {
  const t = questionText.trim().toLowerCase();
  // Strip a leading "(a)" / "a)" / "i)" sub-question marker so multi-part
  // questions are checked against their actual command word.
  const stripped = t.replace(/^[\(\[]?[a-z0-9]{1,2}[\)\.\]]\s+/i, "");
  for (const v of FORBIDDEN_WRITING_VERBS) {
    if (stripped.startsWith(v + " ") || stripped.startsWith(v + ",")) {
      return v;
    }
  }
  return undefined;
}

// ─── Year-group parsing ──────────────────────────────────────────────────────

function parseYearNumber(yearGroup: string | undefined): number | undefined {
  if (!yearGroup) return undefined;
  const m = /year\s*(\d+)/i.exec(yearGroup);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

function pickSectionCBranch(
  yearNumber: number | undefined,
): "problem-solving" | "exam-style" | undefined {
  if (yearNumber === undefined) return undefined;
  return yearNumber >= 9 ? "exam-style" : "problem-solving";
}

// ─── Audit core ──────────────────────────────────────────────────────────────

function buildSectionReport(
  slot: ProgressionSlot,
  s: AuditableSection,
): ProgressionSectionReport {
  const qs = extractQuestions(String(s.content || ""));
  const totalMarks = qs.reduce((acc, q) => acc + q.marks, 0);
  const avgMarks = qs.length > 0
    ? Math.round((totalMarks / qs.length) * 100) / 100
    : 0;
  return {
    slot,
    sectionTitle: String(s.title || ""),
    questionCount: qs.length,
    totalMarks,
    avgMarks,
    perQuestionMarks: qs.map(q => q.marks),
  };
}

/**
 * Run the audit against a worksheet. Returns undefined for non-maths
 * subjects. Returns a populated report for maths sheets, even when no
 * sections are present (so callers can stamp the metadata regardless).
 */
export function auditMathsProgression(
  worksheet: AuditableWorksheet,
  opts: MathsProgressionAuditOptions = {},
): MathsProgressionAuditReport | undefined {
  const subject = opts.subject ?? worksheet.metadata?.subject;
  if (!isMathsSubject(subject)) return undefined;

  const yearNumber = parseYearNumber(opts.yearGroup);
  const sectionCBranch = pickSectionCBranch(yearNumber);

  const sectionReports: ProgressionSectionReport[] = [];
  const seen: Partial<Record<ProgressionSlot, true>> = {};
  for (const s of worksheet.sections ?? []) {
    const slot = classifySectionSlot(s);
    if (!slot) continue;
    // Only audit the FIRST occurrence of each slot. Defends against
    // worksheets that reuse the title accidentally.
    if (seen[slot]) continue;
    seen[slot] = true;
    sectionReports.push(buildSectionReport(slot, s));
  }
  // Sort A → B → C so downstream consumers can rely on the order.
  const order: Record<ProgressionSlot, number> = { A: 0, B: 1, C: 2 };
  sectionReports.sort((x, y) => order[x.slot] - order[y.slot]);

  const warnings: string[] = [];

  // ── Progression check ────────────────────────────────────────────────────
  const a = sectionReports.find(r => r.slot === "A");
  const b = sectionReports.find(r => r.slot === "B");
  const c = sectionReports.find(r => r.slot === "C");
  let progressionHolds: boolean | "n/a" = "n/a";
  if (a && b && c) {
    const aLtB = a.avgMarks < b.avgMarks;
    const bLtC = b.avgMarks < c.avgMarks;
    progressionHolds = aLtB && bLtC;
    if (!aLtB) {
      warnings.push(
        `[Maths progression] Section A avg ${a.avgMarks} marks/Q is not less than Section B avg ${b.avgMarks} marks/Q — Section B should be harder.`,
      );
    }
    if (!bLtC) {
      warnings.push(
        `[Maths progression] Section B avg ${b.avgMarks} marks/Q is not less than Section C avg ${c.avgMarks} marks/Q — Section C should be harder.`,
      );
    }
  } else {
    // Don't warn loudly when sections are simply absent — the teacher may
    // have unticked them. Only warn if a maths sheet has SOME questions
    // but is missing the expected three-section spine.
    const totalQs = sectionReports.reduce(
      (acc, r) => acc + r.questionCount,
      0,
    );
    if (totalQs > 0) {
      const missing: string[] = [];
      if (!a) missing.push("Section A");
      if (!b) missing.push("Section B");
      if (!c) missing.push("Section C");
      if (missing.length > 0 && missing.length < 3) {
        warnings.push(
          `[Maths progression] missing ${missing.join(", ")} — progression check skipped.`,
        );
      }
    }
  }

  // ── Section C command-word check ─────────────────────────────────────────
  const commandWordViolations: ProgressionCommandWordViolation[] = [];
  if (c) {
    const sourceSection = (worksheet.sections ?? []).find(
      sx => classifySectionSlot(sx) === "C",
    );
    if (sourceSection) {
      const qs = extractQuestions(String(sourceSection.content || ""));
      for (const q of qs) {
        const banned = detectBannedVerb(q.text);
        if (banned) {
          commandWordViolations.push({
            slot: "C",
            questionNumber: q.number,
            bannedVerb: banned,
            preview: q.text.slice(0, 80),
          });
        }
      }
    }
  }
  if (commandWordViolations.length > 0) {
    warnings.push(
      `[Maths progression] Section C contains ${commandWordViolations.length} non-calculation question(s) — banned verbs: ${commandWordViolations.map(v => `Q${v.questionNumber} "${v.bannedVerb}"`).join(", ")}.`,
    );
  }

  // ── Section C branch sanity (informational only) ─────────────────────────
  // No warning emitted — the audit only records which branch SHOULD have
  // been used. PR-M2 does not block on this.

  return {
    sections: sectionReports,
    progressionHolds,
    commandWordViolations,
    yearNumber,
    sectionCBranch,
    warnings,
  };
}

/**
 * Run the audit and stamp the result onto worksheet.metadata, accumulating
 * warnings into metadata.postValidatorWarnings. No-op for non-maths.
 *
 * Generic-typed entry-point — preserves the caller's worksheet shape.
 */
export function applyMathsProgressionAudit<W extends AuditableWorksheet>(
  worksheet: W,
  opts: MathsProgressionAuditOptions = {},
): W {
  const report = auditMathsProgression(worksheet, opts);
  if (!report) return worksheet;
  const existingWarnings = Array.isArray(worksheet.metadata?.postValidatorWarnings)
    ? (worksheet.metadata!.postValidatorWarnings as string[])
    : [];
  return {
    ...worksheet,
    metadata: {
      ...(worksheet.metadata || {}),
      mathsProgressionAudit: report,
      postValidatorWarnings: [...existingWarnings, ...report.warnings],
    },
  } as W;
}

// Tiny test-only export — used by a future unit test, no impact on prod.
export const __test__ = {
  classifySectionSlot,
  extractQuestions,
  parseMarksFromLine,
  detectBannedVerb,
  parseYearNumber,
  pickSectionCBranch,
};
