/**
 * markSchemeEnhancer.ts — PR-13
 *
 * Three mark-scheme quality enhancements:
 * 1. Synonym expansion — auto-expand single-word answers with common equivalents
 * 2. M/A/B itemisation — detect multi-mark calculation answers and split into M1/M2/A1 breakdown
 * 3. Plausibility rail — flag numerical answers that are implausibly large/small for context
 *
 * Pure / deterministic / idempotent. No I/O, no LLM calls.
 */

export interface MarkSchemeSection {
  type?: string;
  title?: string;
  content?: string;
  marks?: number;
  [key: string]: unknown;
}

export interface MarkSchemeWarning {
  message: string;
  sectionIndex?: number;
}

// ── 1. Synonym expansion ────────────────────────────────────────────────────

/** Common UK curriculum synonym groups for mark-scheme answer matching. */
const SYNONYM_GROUPS: string[][] = [
  ["increase", "rise", "go up", "grow"],
  ["decrease", "fall", "go down", "drop", "reduce", "decline"],
  ["photosynthesis", "photo-synthesis"],
  ["respiration", "cellular respiration"],
  ["evaporation", "evaporating", "vaporisation"],
  ["condensation", "condensing"],
  ["friction", "drag", "air resistance"],
  ["oxidation", "rusting", "corrosion"],
  ["dissolve", "dissolving", "soluble"],
  ["insoluble", "does not dissolve", "undissolved"],
  ["proportion", "ratio", "fraction"],
  ["equation", "formula", "expression"],
  ["perpendicular", "at right angles", "90 degrees"],
  ["parallel", "same direction", "equidistant"],
  ["numerator", "top number"],
  ["denominator", "bottom number"],
  ["integer", "whole number"],
  ["vertex", "corner", "vertices"],
  ["edge", "side"],
  ["face", "surface"],
  ["area", "space covered", "surface area"],
  ["volume", "space inside", "capacity"],
  ["perimeter", "distance around"],
  ["mean", "average"],
  ["median", "middle value"],
  ["mode", "most common", "most frequent"],
  ["range", "spread", "difference between highest and lowest"],
  ["probability", "chance", "likelihood"],
  ["acceleration", "speeding up"],
  ["deceleration", "slowing down"],
  ["velocity", "speed in a direction"],
  ["displacement", "distance in a direction"],
  ["nucleus", "cell nucleus", "nuclear"],
  ["mitosis", "cell division"],
  ["allele", "gene variant", "version of a gene"],
  ["dominant", "expressed", "shown"],
  ["recessive", "hidden", "not expressed"],
];

/** Build a lookup from normalised word/phrase to its synonym group (excluding itself). */
function buildSynonymLookup(): Map<string, string[]> {
  const lookup = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
      const others = group.filter((t) => t !== term);
      lookup.set(term.toLowerCase(), others);
    }
  }
  return lookup;
}

const SYNONYM_LOOKUP = buildSynonymLookup();

/**
 * Pattern to detect an answer line:
 * - "Q1: answer [N mark(s)]"  or  "QN: answer [N]"
 * - "Answer: answer [N mark(s)]"
 * - "answer [N mark(s)]"  (where [N marks] is at end of line)
 */
const ANSWER_LINE_PATTERN =
  /^(?:(?:Q\d+|Answer)\s*[:.]?\s*)?(.+?)\s*\[(\d+)\s*(?:marks?|)\]\s*$/i;

/** Marker that shows a line was already expanded (idempotency guard). */
const EXPANSION_MARKER = "(OR ";

/**
 * Expand single-word or short-phrase answers in mark-scheme sections
 * with known synonyms. Appends " (OR synonym1 / synonym2)" to the answer line.
 * Returns { content, expanded } where expanded is the number of expansions made.
 */
export function expandMarkSchemeSynonyms(
  content: string,
): { content: string; expanded: number } {
  const lines = content.split("\n");
  let expanded = 0;

  const result = lines.map((line) => {
    // Skip lines already expanded (idempotency)
    if (line.includes(EXPANSION_MARKER)) return line;

    const match = line.match(ANSWER_LINE_PATTERN);
    if (!match) return line;

    const answerPart = match[1].trim();
    // Normalise for lookup
    const normalised = answerPart.toLowerCase();

    // Check direct match
    const synonyms = SYNONYM_LOOKUP.get(normalised);
    if (synonyms && synonyms.length > 0) {
      expanded++;
      return `${line} (OR ${synonyms.join(" / ")})`;
    }

    return line;
  });

  return { content: result.join("\n"), expanded };
}

// ── 2. M/A/B itemisation ────────────────────────────────────────────────────

/**
 * Pattern to detect multi-mark lines: content [N marks] where N >= 2.
 */
const MULTI_MARK_PATTERN = /^(.+?)\s*\[(\d+)\s*marks?\]\s*$/i;

/**
 * Pattern to detect calculation-like content: contains =, or numbers with operators.
 */
const CALCULATION_PATTERN = /(?:\d+\s*[×x*+\-÷/]\s*\d+|=\s*\d)/i;

/** Marker for idempotency: if M1/A1 breakdown is already present, skip. */
const ITEMISATION_MARKER = /^\s*[MAB]\d\s*:/m;

/**
 * Detect multi-mark calculation answers (2+ marks) and add M1/M2/A1 breakdown.
 * E.g. "5 x 3 = 15 [2 marks]" adds breakdown:
 *   "  M1: method shown (5 x 3)"
 *   "  A1: 15"
 * Returns { content, itemised } where itemised is the count of questions enhanced.
 */
export function itemiseMarkAllocation(
  content: string,
): { content: string; itemised: number } {
  // If already itemised (idempotency), return unchanged
  if (ITEMISATION_MARKER.test(content)) {
    return { content, itemised: 0 };
  }

  const lines = content.split("\n");
  const result: string[] = [];
  let itemised = 0;

  for (const line of lines) {
    const match = line.match(MULTI_MARK_PATTERN);
    if (!match) {
      result.push(line);
      continue;
    }

    const expression = match[1].trim();
    const marks = parseInt(match[2], 10);

    // Only itemise if marks >= 2 and the line contains a calculation
    if (marks < 2 || !CALCULATION_PATTERN.test(expression)) {
      result.push(line);
      continue;
    }

    // Extract method and answer from the expression
    const eqParts = expression.split("=");
    const hasEquals = eqParts.length >= 2;
    const method = hasEquals ? eqParts.slice(0, -1).join("=").trim() : expression;
    const answer = hasEquals ? eqParts[eqParts.length - 1].trim() : "";

    // Push original line
    result.push(line);
    // Add breakdown based on mark count
    if (marks === 2) {
      result.push(`  M1: ${method}`);
      result.push(`  A1: ${answer || "correct answer"}`);
    } else if (marks === 3) {
      // For 3 marks: M1 (setup), M2 (calculation), A1 (answer)
      result.push(`  M1: selects correct method`);
      result.push(`  M2: ${method}`);
      result.push(`  A1: ${answer || "correct answer"}`);
    } else if (marks >= 4) {
      // For 4+ marks: M1, M2, A1, B1 (units/communication)
      result.push(`  M1: selects correct method`);
      result.push(`  M2: ${method}`);
      result.push(`  A1: ${answer || "correct answer"}`);
      result.push(`  B1: correct units / communication`);
    }

    itemised++;
  }

  return { content: result.join("\n"), itemised };
}

// ── 3. Plausibility rail ────────────────────────────────────────────────────

/** Context-aware plausibility bounds for numerical answers. */
const PLAUSIBILITY_BOUNDS: Record<string, { min: number; max: number; unit?: string }> = {
  age: { min: 0, max: 120 },
  temperature_c: { min: -50, max: 60 },
  speed_mph: { min: 0, max: 200 },
  speed_ms: { min: 0, max: 100 },
  percentage: { min: 0, max: 100 },
  probability: { min: 0, max: 1 },
  mass_kg: { min: 0, max: 10000 },
  length_cm: { min: 0, max: 100000 },
  angle_degrees: { min: 0, max: 360 },
  money_gbp: { min: 0, max: 1000000 },
  people: { min: 0, max: 8000000000 },
};

/** Keywords that map to plausibility bound categories. */
const CONTEXT_KEYWORDS: [RegExp, string][] = [
  [/\btemperature\b|°C|\bdegrees?\s*(?:c|celsius)\b/i, "temperature_c"],
  [/\bspeed\b.*\bmph\b|\bmph\b/i, "speed_mph"],
  [/\bspeed\b.*\bm\/?s\b|\bm\/?s\b/i, "speed_ms"],
  [/\bpercentage\b|\bpercent\b|%/i, "percentage"],
  [/\bprobability\b|\bchance\b|\blikelihood\b/i, "probability"],
  [/\bangle\b|°(?!C)|degrees(?!\s*c)/i, "angle_degrees"],
  [/\bmass\b.*\bkg\b|\bkg\b|\bkilogram/i, "mass_kg"],
  [/\blength\b.*\bcm\b|\bcm\b|\bcentimetre/i, "length_cm"],
  [/£|\bgbp\b|\bpound|\bpence\b|\bcost\b|\bprice\b|\bmoney\b/i, "money_gbp"],
  [/\bage\b|\byears?\s*old\b/i, "age"],
  [/\bpeople\b|\bpopulation\b|\bpupils\b|\bstudents\b/i, "people"],
];

/**
 * Extract numerical answer and its surrounding context from a line.
 * Returns null if no numerical answer is found.
 */
function extractNumericalAnswer(line: string): { value: number; context: string } | null {
  // Look for patterns like "= 500" or "Answer: 500" or "500 [1 mark]"
  const numPatterns = [
    /=\s*(-?\d+(?:\.\d+)?)/,
    /(?:Answer|A1|A2)\s*[:.]?\s*(-?\d+(?:\.\d+)?)/i,
    /^(?:Q\d+\s*[:.]?\s*)?(-?\d+(?:\.\d+)?)\s*(?:°[CF]?|%|mph|m\/s|kg|cm|£|p)?\s*\[\d+/i,
  ];

  for (const pattern of numPatterns) {
    const match = line.match(pattern);
    if (match) {
      return { value: parseFloat(match[1]), context: line };
    }
  }
  return null;
}

/**
 * Determine which plausibility bound applies to a line based on context keywords.
 */
function detectBoundCategory(context: string): string | null {
  for (const [pattern, category] of CONTEXT_KEYWORDS) {
    if (pattern.test(context)) {
      return category;
    }
  }
  return null;
}

/**
 * Check numerical answers in mark schemes against plausibility bounds.
 * Flags answers that are implausibly large or small.
 * Returns { warnings } array of findings.
 */
export function checkAnswerPlausibility(
  content: string,
  subject?: string,
): MarkSchemeWarning[] {
  const warnings: MarkSchemeWarning[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const extracted = extractNumericalAnswer(line);
    if (!extracted) continue;

    const { value, context } = extracted;
    const category = detectBoundCategory(context);
    if (!category) continue;

    const bounds = PLAUSIBILITY_BOUNDS[category];
    if (!bounds) continue;

    if (value < bounds.min || value > bounds.max) {
      warnings.push({
        message: `${category} answer ${value} is outside plausible range [${bounds.min}, ${bounds.max}]`,
        sectionIndex: i,
      });
    }
  }

  return warnings;
}

// ── Combined enhancer ───────────────────────────────────────────────────────

export interface MarkSchemeEnhanceResult {
  content: string;
  warnings: string[];
  synonymsExpanded: number;
  questionsItemised: number;
  plausibilityFlags: number;
}

/**
 * Run all three mark-scheme enhancements on a mark-scheme section's content.
 * Pure / deterministic / idempotent.
 */
export function enhanceMarkScheme(
  content: string,
  subject?: string,
): MarkSchemeEnhanceResult {
  const { content: withSynonyms, expanded } = expandMarkSchemeSynonyms(content);
  const { content: withItemisation, itemised } = itemiseMarkAllocation(withSynonyms);
  const plausibilityWarnings = checkAnswerPlausibility(withItemisation, subject);

  const warnings: string[] = [];
  if (expanded > 0) warnings.push(`Mark-scheme: expanded ${expanded} answer(s) with synonyms.`);
  if (itemised > 0) warnings.push(`Mark-scheme: itemised ${itemised} multi-mark answer(s) into M/A/B.`);
  for (const pw of plausibilityWarnings) {
    warnings.push(`Mark-scheme plausibility: ${pw.message}`);
  }

  return {
    content: withItemisation,
    warnings,
    synonymsExpanded: expanded,
    questionsItemised: itemised,
    plausibilityFlags: plausibilityWarnings.length,
  };
}
