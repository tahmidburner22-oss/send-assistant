/**
 * mathsStrandTagger.ts — FEAT-PC8
 *
 * UK National Curriculum and GCSE Mathematics specifications mandate an
 * explicit Fluency / Reasoning / Problem-Solving (FRP) balance across every
 * sequence of taught content. The current generator enforces "calculation
 * only" for maths but never tags or balances the strands — a sheet can be
 * 9-out-of-9 fluency drill with no reasoning or problem-solving, which fails
 * the spec.
 *
 * This module fixes that as a *post-generation* deterministic pass:
 *
 *   1. classifyMathsQuestion(text) → "fluency" | "reasoning" | "problem_solving"
 *      Uses lightweight command-word + structural fingerprints. NEVER calls
 *      the LLM — keeping cost at zero and the result reproducible.
 *
 *   2. tagMathsStrands(worksheet) — runs over every question section in a
 *      maths worksheet, stamps metadata.mathsStrandBalance with counts +
 *      target band + per-section strand assignments, and surfaces warnings
 *      when the balance fails the target.
 *
 *   3. applyMathsStrandTagging(ws, opts) — top-level entry point used by
 *      ai.ts. No-op for non-maths subjects.
 *
 * Strand definitions (from DfE NC + AQA/Edexcel/OCR GCSE):
 *   - Fluency           — accurate recall + procedural calculation; "Calculate",
 *                         "Work out", "Simplify", "Round", "Convert", straight
 *                         arithmetic without context.
 *   - Reasoning         — explanation, justification, proof; "Show that",
 *                         "Prove", "Explain why", "Justify", "Compare", or
 *                         questions that ask the pupil to make and defend a
 *                         mathematical claim.
 *   - Problem-Solving   — multi-step, real-world / contextual problems where
 *                         the pupil must choose the method; markers include
 *                         multi-part sub-questions, real-world contexts
 *                         (£/cost/distance/recipe/percentage of), and
 *                         "Hence" / "Use ... to find" instructions.
 *
 * Target band (9-question Y9+ maths worksheet):
 *   - fluency:         ≥ 4
 *   - reasoning:       ≥ 3
 *   - problem-solving: ≥ 2
 * Smaller worksheets scale proportionally (≥40% / ≥30% / ≥20%).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type MathsStrand = "fluency" | "reasoning" | "problem_solving";

export interface MathsStrandAssignment {
  /** 0-based section index within the worksheet. */
  sectionIndex: number;
  sectionTitle?: string;
  sectionType?: string;
  strand: MathsStrand;
  /** Which fingerprint(s) caused the classification (for the teacher panel). */
  evidence: string;
}

export interface MathsStrandBalance {
  /** Per-question assignments, in worksheet order. */
  assignments: MathsStrandAssignment[];
  counts: Record<MathsStrand, number>;
  /** Targets at the time of the audit (depends on worksheet length). */
  targets: Record<MathsStrand, number>;
  /** Total number of question sections audited. */
  totalQuestions: number;
  /** True only when every strand meets its target. */
  meetsTarget: boolean;
  /** Human-readable warnings when the balance is off. */
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
    mathsStrandBalance?: MathsStrandBalance;
    postValidatorWarnings?: string[];
  };
  [key: string]: unknown;
}

export interface MathsStrandOptions {
  /** Subject string exactly as supplied to the generator. */
  subject?: string;
  /** Year group (used to scale target counts down for shorter primary sheets). */
  yearGroup?: string;
}

// ─── Subject + question detection ────────────────────────────────────────────

function isMathsSubject(subject: string | undefined): boolean {
  return /math/i.test(subject || "");
}

const QUESTION_SECTION_TYPES = new Set([
  "q-short-answer", "q-extended", "q-challenge", "q-free-response", "q-mcq",
  "q-gap-fill", "q-true-false", "q-data-table", "q-graph", "q-draw",
  "q-ordering", "q-matching",
  "q-error-correction", "q-ranking", "q-what-changed", "q-constraint-problem",
  "challenge",
]);

function isQuestionSection(s: AuditableSection): boolean {
  if (s.teacherOnly) return false;
  const t = String(s.type || "").toLowerCase();
  if (QUESTION_SECTION_TYPES.has(t)) return true;
  // Some legacy worksheets nest questions inside section-A/B/C blocks. Fall
  // back to title-pattern matching.
  return /\bq\s*\d|^section\s*[a-c]\b|recall|understanding|application/i.test(String(s.title || ""));
}

// ─── Classification fingerprints ─────────────────────────────────────────────

const REASONING_FINGERPRINTS: Array<[RegExp, string]> = [
  [/\bshow\s+that\b/i, '"Show that" — proof / justification'],
  [/\bprove\b/i, '"Prove" — formal reasoning'],
  [/\bexplain\s+why\b/i, '"Explain why" — reasoned explanation'],
  [/\bjustify\b/i, '"Justify" — defended claim'],
  [/\bdeduce\b/i, '"Deduce" — chain of reasoning'],
  [/\bgive\s+a\s+reason\b/i, '"Give a reason" — single-sentence justification'],
  [/\bcompare\b.*\bexplain\b/is, '"Compare … Explain" — contrastive reasoning'],
  [/\bwhich.*greater.*explain\b/is, '"Which is greater? Explain" — reasoning'],
];

const PROBLEM_SOLVING_FINGERPRINTS: Array<[RegExp, string]> = [
  // Multi-step indicators
  [/\(a\)[\s\S]*\(b\)[\s\S]*\(c\)/i, "multi-part (a)(b)(c) — multi-step"],
  [/\bhence\b/i, '"Hence" — uses previous part'],
  [/\buse\s+(?:your|the)\s+(?:answer|result)\s+(?:from\s+)?(?:part\s+\(?[a-d]\)?|above)/i, '"Use your answer from …" — multi-step'],
  // Real-world context tokens
  [/\b(?:£|\$|€)\s*\d/i, "monetary context"],
  [/\b\d+\s*(?:km|metres?|miles?|seconds?|minutes?|hours?|kg|grams?)\b/i, "physical-quantity context"],
  [/\b(?:cost|price|budget|profit|loss|sale|discount|bill|recipe|cooking|ingredient|train|bus|journey|distance|speed|petrol|fuel|garden|paint|tile|wall|fence|fabric)\b/i, "real-world context"],
  // Higher-load problem-solving markers
  [/\bbest\s+(?:value|deal|buy)\b/i, '"Best value/deal" — comparison problem'],
  [/\bhow\s+(?:much|many)\s+(?:more|less|extra)\b/i, '"How much more/less" — multi-step'],
  [/\bdesign\b|\bplan\b/i, '"Design / plan" — open-ended'],
];

const FLUENCY_FINGERPRINTS: Array<[RegExp, string]> = [
  [/\bcalculate\b/i, '"Calculate"'],
  [/\bwork\s+out\b/i, '"Work out"'],
  [/\bsimplify\b/i, '"Simplify"'],
  [/\bevaluate\b/i, '"Evaluate"'],
  [/\bsolve\b/i, '"Solve"'],
  [/\bfactorise\b|\bfactorize\b/i, '"Factorise"'],
  [/\bexpand\b/i, '"Expand"'],
  [/\bround\b/i, '"Round"'],
  [/\bconvert\b/i, '"Convert"'],
  [/\bestimate\b/i, '"Estimate"'],
  [/\bwrite\s+down\b/i, '"Write down"'],
];

/**
 * Classifies a maths question by command-word + structural fingerprints.
 * Precedence: Reasoning > Problem-solving > Fluency. The first reasoning
 * fingerprint wins because reasoning is the rarest strand and the most
 * costly to mis-classify.
 */
export function classifyMathsQuestion(text: string): { strand: MathsStrand; evidence: string } {
  const t = String(text || "");
  for (const [re, label] of REASONING_FINGERPRINTS) {
    if (re.test(t)) return { strand: "reasoning", evidence: label };
  }
  for (const [re, label] of PROBLEM_SOLVING_FINGERPRINTS) {
    if (re.test(t)) return { strand: "problem_solving", evidence: label };
  }
  for (const [re, label] of FLUENCY_FINGERPRINTS) {
    if (re.test(t)) return { strand: "fluency", evidence: label };
  }
  // Default — pure calculation with no obvious context defaults to fluency.
  return { strand: "fluency", evidence: "no command-word fingerprint — default to fluency" };
}

// ─── Target band ─────────────────────────────────────────────────────────────

/**
 * Returns the per-strand minimum count for a worksheet of `total` questions.
 * The 9-question reference target (≥4 / ≥3 / ≥2) is scaled proportionally
 * for shorter sheets — but we never ask for fractional questions, so the
 * minimum is rounded down to give the LLM and the teacher some slack.
 */
function targetsForLength(total: number): Record<MathsStrand, number> {
  if (total <= 0) return { fluency: 0, reasoning: 0, problem_solving: 0 };
  const ratio = total / 9;
  return {
    fluency: Math.max(1, Math.floor(4 * ratio)),
    reasoning: Math.max(1, Math.floor(3 * ratio)),
    problem_solving: Math.max(0, Math.floor(2 * ratio)),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Tag every question section in a maths worksheet with its FRP strand and
 * compute the overall balance. Pure — never mutates the worksheet or the
 * sections array.
 */
export function tagMathsStrands(
  worksheet: AuditableWorksheet,
  opts: MathsStrandOptions = {},
): MathsStrandBalance | null {
  const subject = opts.subject || String(worksheet.metadata?.subject || "");
  if (!isMathsSubject(subject)) return null;

  const sections = worksheet.sections || [];
  const assignments: MathsStrandAssignment[] = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!isQuestionSection(s)) continue;
    const haystack = `${String(s.title || "")}\n${String(s.content || "")}`;
    const { strand, evidence } = classifyMathsQuestion(haystack);
    assignments.push({
      sectionIndex: i,
      sectionTitle: typeof s.title === "string" ? s.title : undefined,
      sectionType: typeof s.type === "string" ? s.type : undefined,
      strand,
      evidence,
    });
  }

  const counts: Record<MathsStrand, number> = {
    fluency: assignments.filter((a) => a.strand === "fluency").length,
    reasoning: assignments.filter((a) => a.strand === "reasoning").length,
    problem_solving: assignments.filter((a) => a.strand === "problem_solving").length,
  };
  const total = assignments.length;
  const targets = targetsForLength(total);
  const warnings: string[] = [];
  if (counts.fluency < targets.fluency)
    warnings.push(`[FRP balance] only ${counts.fluency}/${targets.fluency} fluency questions — below target.`);
  if (counts.reasoning < targets.reasoning)
    warnings.push(`[FRP balance] only ${counts.reasoning}/${targets.reasoning} reasoning questions — add a "Show that" / "Explain why" / "Justify" question.`);
  if (counts.problem_solving < targets.problem_solving)
    warnings.push(`[FRP balance] only ${counts.problem_solving}/${targets.problem_solving} problem-solving questions — add a multi-step real-world question.`);
  const meetsTarget =
    counts.fluency >= targets.fluency &&
    counts.reasoning >= targets.reasoning &&
    counts.problem_solving >= targets.problem_solving;

  return {
    assignments,
    counts,
    targets,
    totalQuestions: total,
    meetsTarget,
    warnings,
  };
}

/**
 * Apply the strand tagger and stamp the result onto the worksheet metadata.
 * Also accumulates any balance warnings into postValidatorWarnings so the
 * existing teacher-facing yellow banner picks them up automatically. No-op
 * for non-maths subjects.
 */
export function applyMathsStrandTagging<W extends AuditableWorksheet>(
  worksheet: W,
  opts: MathsStrandOptions = {},
): W {
  const balance = tagMathsStrands(worksheet, opts);
  if (!balance) return worksheet;
  const existingWarnings = Array.isArray(worksheet.metadata?.postValidatorWarnings)
    ? (worksheet.metadata!.postValidatorWarnings as string[])
    : [];
  return {
    ...worksheet,
    metadata: {
      ...(worksheet.metadata || {}),
      mathsStrandBalance: balance,
      postValidatorWarnings: [...existingWarnings, ...balance.warnings],
    },
  } as W;
}
