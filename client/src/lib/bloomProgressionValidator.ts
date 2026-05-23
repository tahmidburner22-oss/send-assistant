/**
 * bloomProgressionValidator.ts — PR-14
 *
 * Two validators:
 * 1. Bloom monotonicity — questions should generally progress from lower to higher
 *    Bloom levels (remember -> understand -> apply -> analyse -> evaluate -> create).
 *    Non-monotone sequences are warned (not rewritten).
 * 2. Science working-space stub — science calculation questions should have a
 *    "Working:" stub to prompt students to show method. Warns if missing.
 *
 * Pure / deterministic / idempotent. No I/O, no LLM calls.
 */

export type BloomLevel = "remember" | "understand" | "apply" | "analyse" | "evaluate" | "create";

export const BLOOM_ORDER: BloomLevel[] = ["remember", "understand", "apply", "analyse", "evaluate", "create"];

export interface BloomAssignment {
  sectionIndex: number;
  sectionTitle?: string;
  inferredBloom: BloomLevel;
  evidence: string;
}

export interface BloomProgressionResult {
  assignments: BloomAssignment[];
  isMonotone: boolean;
  violations: Array<{ fromIndex: number; toIndex: number; fromLevel: BloomLevel; toLevel: BloomLevel }>;
  warnings: string[];
}

/** Command words that signal each Bloom level. */
const BLOOM_COMMAND_WORDS: Record<BloomLevel, string[]> = {
  remember: ["state", "name", "list", "define", "recall", "identify", "label", "match"],
  understand: ["describe", "explain", "summarise", "outline", "interpret", "classify"],
  apply: ["calculate", "solve", "use", "demonstrate", "show", "work out", "find", "determine", "compute"],
  analyse: ["compare", "contrast", "analyse", "distinguish", "examine", "investigate", "deduce"],
  evaluate: ["evaluate", "justify", "assess", "discuss", "to what extent", "critique"],
  create: ["design", "plan", "create", "construct", "devise", "propose", "formulate"],
};

/**
 * Infer the Bloom level of a section based on its command words and content.
 */
export function inferBloomLevel(content: string, title?: string): BloomLevel {
  const text = `${title || ""} ${content || ""}`.toLowerCase();
  // Check each Bloom level from highest to lowest — take the highest match
  for (let i = BLOOM_ORDER.length - 1; i >= 0; i--) {
    const level = BLOOM_ORDER[i];
    const words = BLOOM_COMMAND_WORDS[level];
    if (words.some((w) => text.includes(w))) {
      return level;
    }
  }
  return "remember"; // default fallback
}

/**
 * Check Bloom monotonicity across question sections of a worksheet.
 * Questions should generally progress from lower to higher Bloom levels.
 * Warns (does not rewrite) when violations are found.
 */
export function checkBloomMonotonicity(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): BloomProgressionResult {
  // Filter to question sections only
  const questionSections = sections
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter((s) => /^q-|^question|^challenge/i.test(s.type || ""));

  const assignments: BloomAssignment[] = [];
  for (const qs of questionSections) {
    const level = inferBloomLevel(qs.content || "", qs.title);
    assignments.push({
      sectionIndex: qs.originalIndex,
      sectionTitle: qs.title,
      inferredBloom: level,
      evidence: `Command word detection in "${(qs.title || qs.content || "").slice(0, 50)}"`,
    });
  }

  // Check monotonicity
  const violations: BloomProgressionResult["violations"] = [];
  for (let i = 1; i < assignments.length; i++) {
    const prev = BLOOM_ORDER.indexOf(assignments[i - 1].inferredBloom);
    const curr = BLOOM_ORDER.indexOf(assignments[i].inferredBloom);
    if (curr < prev - 1) { // Allow one step back (not strict monotone, but no large drops)
      violations.push({
        fromIndex: assignments[i - 1].sectionIndex,
        toIndex: assignments[i].sectionIndex,
        fromLevel: assignments[i - 1].inferredBloom,
        toLevel: assignments[i].inferredBloom,
      });
    }
  }

  const warnings: string[] = [];
  if (violations.length > 0) {
    warnings.push(
      `Bloom progression: ${violations.length} violation(s) — questions drop more than one Bloom level. ` +
      `Consider reordering to maintain cognitive progression.`
    );
  }

  return { assignments, isMonotone: violations.length === 0, violations, warnings };
}

// ── Science working-space stub ──────────────────────────────────────────────

export interface WorkingSpaceResult {
  sectionsNeedingWorkingSpace: number[];
  warnings: string[];
}

/** Patterns that indicate a calculation question in science. */
const SCIENCE_CALC_PATTERNS = [
  /\bcalculate\b/i,
  /\bwork\s*out\b/i,
  /\bfind\s+the\s+(?:value|speed|force|mass|weight|energy|power|distance|time|voltage|current|resistance)\b/i,
  /\buse\s+the\s+(?:equation|formula)\b/i,
  /=\s*\?\s*$|^\s*\w+\s*=\s*$/m,
];

/** Patterns that indicate a "Working:" stub is already present. */
const WORKING_STUB_PATTERN = /\bworking\s*:/i;

/**
 * Check science calculation questions for "Working:" stubs.
 * Warns if a calculation question doesn't have a working-space prompt.
 */
export function checkScienceWorkingSpace(
  sections: Array<{ type?: string; title?: string; content?: string }>,
  subject?: string,
): WorkingSpaceResult {
  const warnings: string[] = [];
  const sectionsNeedingWorkingSpace: number[] = [];

  // Only apply to science subjects
  const subjectLower = (subject || "").toLowerCase();
  const isScience = /science|physics|chemistry|biology/i.test(subjectLower);
  if (!isScience) return { sectionsNeedingWorkingSpace: [], warnings: [] };

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!s.type || !/^q-/i.test(s.type)) continue;

    const content = s.content || "";
    const isCalc = SCIENCE_CALC_PATTERNS.some((p) => p.test(content));
    if (!isCalc) continue;

    const hasWorkingStub = WORKING_STUB_PATTERN.test(content);
    if (!hasWorkingStub) {
      sectionsNeedingWorkingSpace.push(i);
    }
  }

  if (sectionsNeedingWorkingSpace.length > 0) {
    warnings.push(
      `Science working space: ${sectionsNeedingWorkingSpace.length} calculation question(s) missing "Working:" stub. ` +
      `Add to prompt students to show method.`
    );
  }

  return { sectionsNeedingWorkingSpace, warnings };
}
