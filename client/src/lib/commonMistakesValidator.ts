/**
 * commonMistakesValidator.ts — PR-M3
 *
 * Maths worksheets ship with a child-friendly "Common Mistakes to Avoid"
 * section made of three mistake blocks. Each block is required to have FOUR
 * labelled parts:
 *
 *     Mistake N: <short name>
 *     What pupils often write:        ← realistic wrong working with numbers
 *     Why that's wrong (in plain words):
 *     How to do it right:
 *     Quick check: <one-line self-test>
 *
 * The generator template demands this structure, but the LLM occasionally
 * drops a label or replaces "what pupils often write" with prose. Worse, it
 * sometimes writes the wrong-working line as words instead of numbers (e.g.
 * "they add the tops AND the bottoms") — exactly the failure mode this
 * validator was built to catch: a kid needs to SEE the wrong sum, not read
 * about it in the abstract.
 *
 * This module is the deterministic post-pass. Same shape as
 * mathsProgressionAudit.ts and mathsStrandTagger.ts:
 *
 *   1. Scan the worksheet for the common-mistakes section. If the subject
 *      isn't maths, no-op (the simpler non-maths template doesn't apply).
 *   2. Split the section content into mistake blocks at "Mistake N:" / the
 *      legacy "MISTAKE N:" header.
 *   3. For each block, verify the four labelled parts exist AND the
 *      wrong-working line contains at least two numeric tokens.
 *   4. Stamp metadata.commonMistakesAudit with the report and push any
 *      warnings into metadata.postValidatorWarnings so the existing
 *      teacher-facing yellow banner picks them up.
 *
 * No regeneration loop. No LLM calls. Deterministic, zero-cost, and
 * non-blocking by design — the audit is advisory only. (PR-M3-followup may
 * upgrade to active regeneration once we have field data.)
 *
 * No-op for non-maths subjects.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MistakeBlockReport {
  /** 1-indexed block number, in the order they appeared. */
  blockNumber: number;
  /** Whether the four labelled parts were all detected. */
  hasFourParts: boolean;
  /** Specific labels we couldn't find — empty when hasFourParts === true. */
  missingLabels: string[];
  /** Number of distinct numeric tokens in the wrong-working line. */
  wrongWorkingNumericTokenCount: number;
  /** True when the wrong-working line has >= 2 numeric tokens. */
  hasNumbersInWrongWorking: boolean;
  /** First ~80 chars of the block, for the warning preview. */
  preview: string;
}

export interface CommonMistakesAuditReport {
  /** True when a common-mistakes section was found at all. */
  sectionFound: boolean;
  /** Number of mistake blocks detected (after splitting). */
  blockCount: number;
  /** Per-block reports, ordered by appearance. */
  blocks: MistakeBlockReport[];
  /** True when every block passes both checks (four parts + numbers). */
  allBlocksPass: boolean;
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
    commonMistakesAudit?: CommonMistakesAuditReport;
    postValidatorWarnings?: string[];
  };
  [key: string]: unknown;
}

export interface CommonMistakesAuditOptions {
  subject?: string;
}

// ─── Subject + section detection ─────────────────────────────────────────────

function isMathsSubject(subject: string | undefined): boolean {
  return /math/i.test(subject || "");
}

/**
 * Find the (first) common-mistakes section. Match by `type` first because the
 * generator stamps `"type": "common-mistakes"`; fall back to title regex for
 * any legacy or alternative shape.
 */
function findCommonMistakesSection(
  sections: AuditableSection[] | undefined,
): AuditableSection | undefined {
  if (!sections || sections.length === 0) return undefined;
  const byType = sections.find(
    s => String(s.type || "").toLowerCase() === "common-mistakes",
  );
  if (byType) return byType;
  return sections.find(s =>
    /common\s+mistakes?/i.test(String(s.title || "")),
  );
}

// ─── Block splitting ─────────────────────────────────────────────────────────

/**
 * Split content into mistake blocks. Recognises both the new
 * "Mistake N:" header and the legacy "MISTAKE N:" header so the audit
 * works on freshly generated sheets AND on regenerated sections from
 * before PR-M3.
 *
 * Returns the substring that follows each header (i.e. the block body).
 */
function splitIntoMistakeBlocks(content: string): string[] {
  if (!content) return [];
  // Header pattern: optional leading whitespace, "Mistake" or "MISTAKE",
  // optional space, a digit, optional ":" / "-" / "—", then end-of-line OR
  // a single space before the rest of the title.
  const headerRe = /(^|\n)\s*MISTAKE\s*\d+\s*[:\-\u2013\u2014]?/gi;
  const matches: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(content)) !== null) {
    // Push the start index of the header itself, not the leading newline.
    const headerStart = m.index + (m[1] === "\n" ? 1 : 0);
    matches.push(headerStart);
    // Guard against zero-width matches infinitely looping.
    if (m.index === headerRe.lastIndex) headerRe.lastIndex++;
  }
  if (matches.length === 0) return [];
  const blocks: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1] : content.length;
    blocks.push(content.slice(start, end).trim());
  }
  return blocks;
}

// ─── Label detection ─────────────────────────────────────────────────────────

/**
 * The four labels we expect per block. Each entry is a regex that matches
 * the label heading anywhere in the block (case-insensitive). The order
 * here is the order they should appear in pupil-facing output, but the
 * audit doesn't enforce order — only presence.
 */
const REQUIRED_LABELS: Array<{ key: string; re: RegExp }> = [
  // "What pupils often write:" / "Common wrong answer:" / "What gets written:"
  {
    key: "what-pupils-write",
    re: /(what\s+pupils\s+often\s+write|common\s+wrong\s+answer|what\s+gets\s+written|what\s+pupils\s+write)\s*[:\-\u2013\u2014]/i,
  },
  // "Why that's wrong (in plain words):" / "Why it's wrong:" / "Why this is wrong:"
  {
    key: "why-wrong",
    re: /(why\s+(that['\u2019]?s|it['\u2019]?s|this\s+is)\s+wrong|why\s+wrong)/i,
  },
  // "How to do it right:" / "The right way:" / "Correct method:"
  {
    key: "how-to-do-right",
    re: /(how\s+to\s+do\s+it\s+right|the\s+right\s+way|correct\s+method|do\s+it\s+correctly)\s*[:\-\u2013\u2014]/i,
  },
  // "Quick check:" / "Try it:" / "Self check:"
  {
    key: "quick-check",
    re: /(quick\s+check|try\s+it(\s+yourself)?|self[\-\s]check|check\s+yourself)\s*[:\-\u2013\u2014]/i,
  },
];

function checkLabels(block: string): { hasFourParts: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const { key, re } of REQUIRED_LABELS) {
    if (!re.test(block)) missing.push(key);
  }
  return { hasFourParts: missing.length === 0, missing };
}

// ─── Numeric-token detection in wrong-working line ───────────────────────────

/**
 * Pull out the "what pupils often write" body — the lines that follow the
 * label until the next labelled section. Returns the concatenated body
 * text, or the empty string if the label isn't present.
 */
function extractWrongWorkingBody(block: string): string {
  const startMatch =
    /(what\s+pupils\s+often\s+write|common\s+wrong\s+answer|what\s+gets\s+written|what\s+pupils\s+write)\s*[:\-\u2013\u2014]/i.exec(
      block,
    );
  if (!startMatch) return "";
  const startIdx = startMatch.index + startMatch[0].length;
  // Find the start of the NEXT label (any of the other three) so we don't
  // bleed into the right-working numbers and accidentally count those.
  const nextLabelRe =
    /(why\s+(that['\u2019]?s|it['\u2019]?s|this\s+is)\s+wrong|how\s+to\s+do\s+it\s+right|the\s+right\s+way|correct\s+method|do\s+it\s+correctly|quick\s+check|try\s+it|self[\-\s]check)/i;
  const remainder = block.slice(startIdx);
  const nextMatch = nextLabelRe.exec(remainder);
  const body = nextMatch ? remainder.slice(0, nextMatch.index) : remainder;
  return body;
}

/**
 * Count distinct numeric tokens in the wrong-working body. We accept:
 *   - integers      (12, 100, -3)
 *   - decimals      (0.5, 3.14)
 *   - fractions     (1/2, 3/4)
 *   - percentages   (50%)
 * The bar for "real numbers" is intentionally low: as long as the pupil
 * SEES at least two numbers shown as a calculation, the block passes.
 *
 * Tokens like "Mistake 1" don't count — the regex requires the number to
 * be either standalone, part of a fraction, decimal, or followed by an
 * operator/equals/percent sign.
 */
function countNumericTokens(body: string): number {
  if (!body) return 0;
  const tokens = new Set<string>();
  // Fractions like "1/2"
  const fractionRe = /-?\d+\s*\/\s*\d+/g;
  let m: RegExpExecArray | null;
  while ((m = fractionRe.exec(body)) !== null) tokens.add(m[0].replace(/\s+/g, ""));
  // Numbers adjacent to an operator (+ - × * ÷ / = %) or surrounded by
  // calculation context. We also accept a number followed by a unit like %.
  const calcRe = /(?<![A-Za-z])-?\d+(?:\.\d+)?(?=\s*(?:[+\-\u00d7\u00f7*=%]|\s*$|\n|\)|,))/g;
  while ((m = calcRe.exec(body)) !== null) tokens.add(m[0]);
  // Numbers that follow an operator (catches "= 5/6" or "+ 3")
  const afterOpRe = /(?:[+\-\u00d7\u00f7*=])\s*-?\d+(?:\.\d+)?/g;
  while ((m = afterOpRe.exec(body)) !== null) {
    const num = /-?\d+(?:\.\d+)?$/.exec(m[0]);
    if (num) tokens.add(num[0]);
  }
  return tokens.size;
}

// ─── Audit core ──────────────────────────────────────────────────────────────

function auditBlock(block: string, blockNumber: number): MistakeBlockReport {
  const { hasFourParts, missing } = checkLabels(block);
  const wrongWorkingBody = extractWrongWorkingBody(block);
  const numericCount = countNumericTokens(wrongWorkingBody);
  const preview = block
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return {
    blockNumber,
    hasFourParts,
    missingLabels: missing,
    wrongWorkingNumericTokenCount: numericCount,
    hasNumbersInWrongWorking: numericCount >= 2,
    preview,
  };
}

/**
 * Run the audit against a worksheet. Returns undefined for non-maths
 * subjects. Returns a populated report for maths sheets, even when the
 * common-mistakes section is missing (so callers can stamp the metadata
 * regardless).
 */
export function auditCommonMistakes(
  worksheet: AuditableWorksheet,
  opts: CommonMistakesAuditOptions = {},
): CommonMistakesAuditReport | undefined {
  const subject = opts.subject ?? worksheet.metadata?.subject;
  if (!isMathsSubject(subject)) return undefined;

  const section = findCommonMistakesSection(worksheet.sections);
  const warnings: string[] = [];

  if (!section) {
    return {
      sectionFound: false,
      blockCount: 0,
      blocks: [],
      allBlocksPass: true, // vacuously true — no section, no failure
      warnings,
    };
  }

  const blocks = splitIntoMistakeBlocks(String(section.content || ""));
  const blockReports = blocks.map((b, i) => auditBlock(b, i + 1));
  const allBlocksPass =
    blockReports.length > 0 &&
    blockReports.every(r => r.hasFourParts && r.hasNumbersInWrongWorking);

  // Warnings are emitted per failing block for actionable teacher feedback.
  if (blockReports.length === 0) {
    warnings.push(
      `[Common Mistakes] Section is present but no mistake blocks could be detected — expected 3 blocks beginning "Mistake 1:" / "Mistake 2:" / "Mistake 3:".`,
    );
  } else if (blockReports.length < 3) {
    warnings.push(
      `[Common Mistakes] Only ${blockReports.length} mistake block(s) detected — maths sheets should have 3.`,
    );
  }
  for (const r of blockReports) {
    if (!r.hasFourParts) {
      warnings.push(
        `[Common Mistakes] Block ${r.blockNumber} is missing labels: ${r.missingLabels.join(", ")}. Each block must show wrong working, why it's wrong, the correct method, and a quick check.`,
      );
    }
    if (!r.hasNumbersInWrongWorking) {
      warnings.push(
        `[Common Mistakes] Block ${r.blockNumber} has only ${r.wrongWorkingNumericTokenCount} number(s) in the wrong-working line — pupils need to SEE the wrong sum, not read about it.`,
      );
    }
  }

  return {
    sectionFound: true,
    blockCount: blockReports.length,
    blocks: blockReports,
    allBlocksPass,
    warnings,
  };
}

/**
 * Run the audit and stamp the result onto worksheet.metadata, accumulating
 * warnings into metadata.postValidatorWarnings. No-op for non-maths.
 *
 * Generic-typed entry-point — preserves the caller's worksheet shape.
 */
export function applyCommonMistakesAudit<W extends AuditableWorksheet>(
  worksheet: W,
  opts: CommonMistakesAuditOptions = {},
): W {
  const report = auditCommonMistakes(worksheet, opts);
  if (!report) return worksheet;
  const existingWarnings = Array.isArray(worksheet.metadata?.postValidatorWarnings)
    ? (worksheet.metadata!.postValidatorWarnings as string[])
    : [];
  return {
    ...worksheet,
    metadata: {
      ...(worksheet.metadata || {}),
      commonMistakesAudit: report,
      postValidatorWarnings: [...existingWarnings, ...report.warnings],
    },
  } as W;
}

// Tiny test-only export — used by future unit tests.
export const __test__ = {
  findCommonMistakesSection,
  splitIntoMistakeBlocks,
  checkLabels,
  extractWrongWorkingBody,
  countNumericTokens,
  auditBlock,
};
