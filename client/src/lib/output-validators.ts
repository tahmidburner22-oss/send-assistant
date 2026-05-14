/**
 * output-validators.ts — programmatic post-generation rules for AI tool output.
 *
 * Today, the only thing policing AI output quality is the prompt itself.
 * SmartTargets *asks* the AI to confirm "Specific ✓ Measurable ✓ ..." but
 * nothing actually checks the output contains a measurable verb or a date.
 * Word-count promises in ReportComments are honoured roughly 60% of the time.
 * ExitTicket has a fragile separator detection but never warns when the
 * separator is missing.
 *
 * This module fixes that for tools that opt-in. A validator is a pure
 * function (text, values) → ValidationResult. AIToolPage runs the relevant
 * validators after generation and surfaces any issues as a yellow banner
 * with a single-click "Auto-fix" that re-prompts the AI with the specific
 * failure, instead of silently shipping a poor result.
 *
 * This is the difference between "AI tool" and "audit-ready AI tool".
 */

export interface ValidationIssue {
  /** Stable code so callers can branch on specific failures. */
  code: string;
  /** Human-readable message shown in the warning banner. */
  message: string;
  /** Optional severity — "error" surfaces in red, "warn" in amber. */
  severity?: "error" | "warn";
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  /**
   * Optional plain-language fix instruction to feed back to the AI when
   * the user clicks "Auto-fix". Defaults to a generic summary of the issues.
   */
  autoFixInstruction?: string;
}

export type Validator = (text: string, values: Record<string, string>) => ValidationResult;

const ok = (): ValidationResult => ({ ok: true, issues: [] });

// Normalise text for word-count and pattern checks.
function wordCount(text: string): number {
  return text.replace(/[`*_#>~|]/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

// ─── Tool-specific validators ────────────────────────────────────────────────

/** SMART targets must each contain a number, a frequency-style word, and a date phrase. */
export const smartTargetsValidator: Validator = (text) => {
  const issues: ValidationIssue[] = [];

  // Find every "**Target N:**" block (lenient regex covering markdown variants)
  const blocks = text.split(/(?=\*\*Target\s*\d+\s*:\*\*)/i).filter(b => /\*\*Target\s*\d+\s*:\*\*/i.test(b));
  if (blocks.length === 0) {
    issues.push({ code: "no-target-blocks", message: "No \"**Target N:**\" sections were found in the output.", severity: "error" });
  }

  blocks.forEach((block, idx) => {
    const measurable = /\b\d+(\.\d+)?\b|\b(once|twice|three|four|five|daily|weekly|fortnightly|every|each|per)\b/i.test(block);
    const timeBound  = /\b(by|within|over|across|after)\b.*?(\d+\s*(week|term|month|year)s?|review\s+date|end\s+of\s+(term|year|spring|summer|autumn))/i.test(block);
    if (!measurable) issues.push({ code: `target-${idx + 1}-not-measurable`, message: `Target ${idx + 1} is missing a measurable criterion (number, frequency, or count).`, severity: "warn" });
    if (!timeBound)  issues.push({ code: `target-${idx + 1}-not-time-bound`,  message: `Target ${idx + 1} is missing a clear time-bound phrase ("by …", "within …", or a review date).`, severity: "warn" });
  });

  return {
    ok: issues.length === 0,
    issues,
    autoFixInstruction: issues.length > 0
      ? "For every target that fails the SMART check, rewrite it so it explicitly includes (a) a measurable criterion such as a number or frequency word, and (b) a time-bound phrase like \"by [date]\" or \"within [N] weeks\". Keep the rest of the document unchanged."
      : undefined,
  };
};

/** ReportComments: word count within ±25% of target, and no banned clichés. */
const REPORT_BANNED_CLICHES = [
  /\bworks hard\b/i,
  /\bis a pleasure to teach\b/i,
  /\bcould try harder\b/i,
  /\bhas potential\b/i,
  /\bgoing forward\b/i,
];

export const reportCommentsValidator: Validator = (text, values) => {
  const issues: ValidationIssue[] = [];
  const targetWords = parseInt(values.wordCount || "100", 10) || 100;
  const variants = parseInt(values.numVariants || "1", 10) || 1;

  // Strip "Option N:" headers so we count words in the actual prose.
  const stripped = text.replace(/\*\*Option\s*\d+\s*:\*\*/gi, "");
  const actual   = wordCount(stripped);
  const expected = targetWords * variants;
  const lower    = Math.floor(expected * 0.75);
  const upper    = Math.ceil(expected * 1.25);

  if (actual < lower) {
    issues.push({ code: "report-too-short", message: `Output is ${actual} words; expected approximately ${expected} (±25%). Consider expanding.`, severity: "warn" });
  } else if (actual > upper) {
    issues.push({ code: "report-too-long", message: `Output is ${actual} words; expected approximately ${expected} (±25%). Consider tightening.`, severity: "warn" });
  }

  for (const rx of REPORT_BANNED_CLICHES) {
    if (rx.test(text)) {
      issues.push({ code: `cliche-${rx.source}`, message: `Cliché detected: "${rx.source.replace(/\\b/g, "")}". Replace with specific evidence-based language.`, severity: "warn" });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    autoFixInstruction: issues.length > 0
      ? `Rewrite the comment(s) so the total length is approximately ${expected} words (±10%) and remove any of the following clichés if present: "works hard", "is a pleasure to teach", "could try harder", "has potential", "going forward". Replace each cliché with specific, evidence-based language drawn from the input.`
      : undefined,
  };
};

/** ExitTicket: must contain the teacher answer-key separator. */
export const exitTicketValidator: Validator = (text) => {
  const hasExact   = text.includes("--- TEACHER ANSWER KEY ---");
  const hasFallback = /^-{2,}\s*teacher\s*(answer\s*key|copy|key|answers?)\s*-{0,}\s*$/im.test(text)
                  || /^#{1,3}\s*answer\s*key\s*$/im.test(text)
                  || /^#{1,3}\s*mark\s*scheme\s*$/im.test(text);

  if (!hasExact && !hasFallback) {
    return {
      ok: false,
      issues: [{ code: "no-answer-key", message: "No teacher answer key was found. Students would receive the ticket without a marking scheme.", severity: "error" }],
      autoFixInstruction: "Append a teacher answer key separated from the student section by exactly this line on its own: --- TEACHER ANSWER KEY --- — followed by model answers and one-line marking guidance.",
    };
  }
  return ok();
};

/** BehaviourPlan: must include all 12 numbered sections (lenient — allow 10+). */
export const behaviourPlanValidator: Validator = (text) => {
  const sectionMatches = text.match(/^\s*(?:#{1,3}\s*)?(?:\*\*)?\s*\d+\s*[\.\):]/gm) || [];
  if (sectionMatches.length < 10) {
    return {
      ok: false,
      issues: [{
        code: "missing-sections",
        message: `Behaviour plan only contains ${sectionMatches.length} numbered sections; expected at least 10.`,
        severity: "warn",
      }],
      autoFixInstruction: "Re-issue the plan as twelve numbered sections (1.–12.) covering: pupil profile, triggers, escalation phases, de-escalation strategies, response strategies, restorative actions, communication, monitoring, review schedule, staff responsibilities, parental engagement, and emergency procedures.",
    };
  }
  return ok();
};

/** Generic minimum-length safety net. */
export const minimumLengthValidator: Validator = (text) => {
  if (text.trim().length < 200) {
    return {
      ok: false,
      issues: [{ code: "too-short", message: "Output is unusually short — it may have been truncated.", severity: "warn" }],
      autoFixInstruction: "Expand the response with more specific detail, examples, and structure. Aim for the typical length expected of this tool.",
    };
  }
  return ok();
};

// ─── Registry ────────────────────────────────────────────────────────────────
// Map a tool slug (matches AIToolPage's derived slug) to its validator chain.

export const TOOL_VALIDATORS: Record<string, Validator[]> = {
  "smart-targets-generator":     [smartTargetsValidator, minimumLengthValidator],
  "report-card-comments":        [reportCommentsValidator, minimumLengthValidator],
  "exit-ticket-generator":       [exitTicketValidator],
  "behaviour-plan-generator":    [behaviourPlanValidator, minimumLengthValidator],
  "behaviour-plan":              [behaviourPlanValidator, minimumLengthValidator],
};

/** Run all registered validators for a given tool slug. */
export function runValidators(toolSlug: string, text: string, values: Record<string, string>): ValidationResult {
  const chain = TOOL_VALIDATORS[toolSlug];
  if (!chain || chain.length === 0) return ok();
  const allIssues: ValidationIssue[] = [];
  const fixHints: string[] = [];
  for (const v of chain) {
    const r = v(text, values);
    if (!r.ok) {
      allIssues.push(...r.issues);
      if (r.autoFixInstruction) fixHints.push(r.autoFixInstruction);
    }
  }
  return {
    ok: allIssues.length === 0,
    issues: allIssues,
    autoFixInstruction: fixHints.length > 0 ? fixHints.join(" ") : undefined,
  };
}
