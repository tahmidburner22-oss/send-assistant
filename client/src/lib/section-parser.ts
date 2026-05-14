/**
 * section-parser.ts — split a markdown AI output into navigable sections.
 *
 * Used by AIToolPage to render section-level "Regenerate this part" buttons
 * for tools whose output is naturally segmented (BehaviourPlan, IEPGenerator,
 * RiskAssessment, SmartTargets, etc.). The parser is intentionally lenient
 * because the AI's heading style varies between tools and runs.
 *
 * It recognises three heading styles:
 *   1. Markdown ATX headings:    "## My section"
 *   2. Bold-only headings:       "**Section 7: Response Strategies**"
 *   3. Numbered prefixes:        "7. Response Strategies"
 *
 * Each section retains its body text up to the next heading, so callers can
 * regenerate one section and splice the new content back in.
 */

export interface ParsedSection {
  /** Stable index for splice-back. */
  index: number;
  /** The raw heading line (e.g. "**Section 7: Response Strategies**"). */
  heading: string;
  /** Just the human title without markup ("Section 7: Response Strategies"). */
  title: string;
  /** Body text (may contain multiple lines, trimmed). */
  body: string;
  /** Start/end line indices of the heading line in the original text. */
  startLine: number;
  endLine: number;
}

const HEADING_PATTERNS: RegExp[] = [
  // ATX-style heading
  /^\s{0,3}(#{1,4})\s+(.+?)\s*#*\s*$/,
  // Bold-only line that is the entire content of a line
  /^\s*\*\*(.+?)\*\*\s*:?\s*$/,
  // Numbered "1. " or "1) " or "1: " line that *looks like* a heading (short line, ≤ 80 chars)
  /^\s*(\d{1,2})[\.\)\:]\s+(.{1,80})$/,
];

function looksLikeHeading(line: string): boolean {
  if (line.length > 120) return false;
  return HEADING_PATTERNS.some(rx => rx.test(line));
}

function stripHeading(line: string): string {
  for (const rx of HEADING_PATTERNS) {
    const m = line.match(rx);
    if (m) {
      // ATX: title in group 2; bold/numbered: depends on pattern
      return (m[2] || m[1] || "").replace(/[*_`]/g, "").trim();
    }
  }
  return line.trim();
}

export function parseSections(text: string): ParsedSection[] {
  if (!text || !text.trim()) return [];

  const lines = text.split("\n");
  const headings: { i: number; line: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (looksLikeHeading(lines[i])) headings.push({ i, line: lines[i] });
  }

  if (headings.length === 0) return [];

  const sections: ParsedSection[] = [];
  for (let h = 0; h < headings.length; h++) {
    const { i, line } = headings[h];
    const nextStart = h + 1 < headings.length ? headings[h + 1].i : lines.length;
    const bodyLines = lines.slice(i + 1, nextStart);
    sections.push({
      index: h,
      heading: line,
      title: stripHeading(line),
      body: bodyLines.join("\n").trim(),
      startLine: i,
      endLine: nextStart - 1,
    });
  }
  return sections;
}

/**
 * Replace the body of one section in the original text and return the new text.
 * Caller passes the section index and the AI-generated replacement body
 * (with or without the heading — this function preserves the original heading).
 */
export function replaceSectionBody(text: string, sectionIndex: number, newBody: string): string {
  const sections = parseSections(text);
  const target = sections[sectionIndex];
  if (!target) return text;

  const lines = text.split("\n");
  const before = lines.slice(0, target.startLine + 1); // include heading
  const after  = lines.slice(target.endLine + 1);

  // Strip the heading from newBody if the model echoed it back.
  const cleanedBody = newBody
    .split("\n")
    .filter((l, idx) => !(idx === 0 && looksLikeHeading(l)))
    .join("\n")
    .trim();

  return [...before, cleanedBody, ...after].join("\n");
}
