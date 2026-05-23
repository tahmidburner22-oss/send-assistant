/**
 * Maths Auxiliary Diagrams
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates simple, fully-deterministic inline SVG diagrams for maths
 * questions — bar models for ratios, number lines for negative-number /
 * fractions / decimals questions, fraction bars for "what fraction is
 * shaded" questions, and so on.
 *
 * Why this exists:
 *   The freeform "labeled" SVG path (driven by an LLM placing labels at
 *   x/y coordinates) has historically produced overlapping text, lines
 *   crossing through labels, and boxes drifting off the canvas. Teachers
 *   report this as the single biggest source of unusable diagrams.
 *
 *   This module sidesteps that by ONLY using the deterministic shape
 *   types from SVGDiagram.tsx — number-line, fraction-bar and the new
 *   bar-model. Every input is a small set of integers, so the output
 *   geometry is provably the same every time and can never overlap or
 *   misplace text.
 *
 * Scope:
 *   Maths-only. Other subjects already use the diagram-library lookup
 *   (see /api/ai/diagram) where curated images are far more reliable.
 *
 * Output:
 *   A `[[DIAGRAM:{...}]]` marker string that drops straight into a
 *   worksheet section's `content` field. The renderer in
 *   WorksheetRenderer.tsx already extracts these markers and renders
 *   them inline beneath the question text via SVGDiagram.
 */

const SUBJECT_REGEX = /^(maths?|mathematics)$/i;

/**
 * True if the worksheet is a maths worksheet. Other subjects skip this path.
 */
export function isMathsForAuxDiagrams(subject: string | undefined | null): boolean {
  if (!subject) return false;
  return SUBJECT_REGEX.test(subject.trim());
}

/**
 * Lightweight detector for a [[DIAGRAM:...]] marker already present in the
 * question content. We never overwrite an existing diagram because the
 * library / AI-SVG pipeline may have placed something deliberate there.
 */
export function hasInlineDiagramMarker(content: string | undefined | null): boolean {
  if (!content) return false;
  return /\[\[DIAGRAM:\{/.test(content);
}

/**
 * Pull a small integer (1–24) from a question stem. Returns the FIRST one
 * found unless `index` is supplied, in which case it returns the n-th.
 * Used to seed bar-model sizes from the question's actual numbers so the
 * visual matches what the student is reading.
 */
function extractInt(content: string, index = 0, max = 24, min = 1): number | null {
  const matches = content.match(/(?<![\w.])(\d{1,2})(?!\d)/g);
  if (!matches || index >= matches.length) return null;
  const n = parseInt(matches[index], 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

/**
 * Find a ratio in the form "a:b" or "a : b" (also "a:b:c"). Returns the
 * normalised parts, OR null if no ratio is present or if any part falls
 * outside the safe geometric range (1–12 per part, 30 total cells).
 */
function extractRatio(content: string): number[] | null {
  const m = content.match(/(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?/);
  if (!m) return null;
  const parts = [m[1], m[2], m[3]]
    .filter((s): s is string => typeof s === "string")
    .map(s => parseInt(s, 10))
    .filter(n => Number.isFinite(n) && n >= 1 && n <= 12);
  if (parts.length < 2) return null;
  if (parts.reduce((s, n) => s + n, 0) > 30) return null;
  return parts;
}

/**
 * Find a "fraction of an amount" pattern like "1/3 of 60" or "find 1/4 of 24".
 * Returns { numerator, denominator, total } or null.
 */
function extractFractionOfAmount(content: string): { num: number; den: number; total: number } | null {
  const m = content.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*(?:of|×|x|\*)\s*(\d{1,3})/i);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  const den = parseInt(m[2], 10);
  const total = parseInt(m[3], 10);
  if (!Number.isFinite(num) || !Number.isFinite(den) || !Number.isFinite(total)) return null;
  if (den < 2 || den > 10 || num < 1 || num >= den) return null;
  if (total < 1 || total > 999) return null;
  return { num, den, total };
}

/**
 * Find a "what fraction is shaded" pattern: "shaded", "what fraction".
 * Returns { numerator, denominator } heuristically — defaults to 3/4 when
 * no explicit fraction is found, since the question text itself names the
 * fraction the student should produce. We pick a fraction that the
 * student does NOT already see, so the visual prompts an answer.
 */
function extractFractionShaded(content: string, topic: string): { num: number; den: number } | null {
  const t = `${content} ${topic}`.toLowerCase();
  if (!/shaded|what fraction|fraction.*shown|fraction.*represented/.test(t)) return null;
  // Try to read explicit "3 out of 8" / "3/8"
  const explicit = t.match(/(\d{1,2})\s*\/\s*(\d{1,2})/) || t.match(/(\d{1,2})\s+out of\s+(\d{1,2})/);
  if (explicit) {
    const num = parseInt(explicit[1], 10);
    const den = parseInt(explicit[2], 10);
    if (den >= 2 && den <= 10 && num >= 1 && num < den) return { num, den };
  }
  // Default visual — the student answers "3/4". Teachers can edit if needed.
  return { num: 3, den: 4 };
}

/**
 * Build a bar-model marker from a ratio. e.g. "Ratio 3:2" → 5 equal cells,
 * 3 of them in row A and 2 in row B. The student can count cells to find
 * proportions, fractions of the whole, or "share into the ratio" amounts.
 */
function buildBarModelFromRatio(parts: number[], topic: string, total: number | null): string {
  const partLabels = parts.map((_, i) => `Part ${String.fromCharCode(65 + i)}`);
  const spec = {
    type: "bar-model",
    title: `Ratio ${parts.join(":")}${topic ? " — " + topic : ""}`,
    parts: parts.map((value, i) => ({ label: partLabels[i], value })),
    ...(total !== null ? { total } : {}),
  };
  return `[[DIAGRAM:${JSON.stringify(spec)}]]`;
}

/**
 * Build a bar-model marker for a "fraction of an amount" question. We
 * draw `denominator` equal cells in a single row, with the first
 * `numerator` cells coloured. The total caption shows the original amount.
 */
function buildBarModelFromFractionOfAmount(
  num: number, den: number, total: number, topic: string
): string {
  const spec = {
    type: "bar-model",
    title: `${num}/${den} of ${total}${topic ? " — " + topic : ""}`,
    parts: [
      { label: `${num}/${den}`, value: num },
      { label: "remaining", value: den - num },
    ],
    total,
  };
  return `[[DIAGRAM:${JSON.stringify(spec)}]]`;
}

/**
 * Build a fraction-bar marker for "what fraction is shaded" type questions.
 */
function buildFractionBar(num: number, den: number, topic: string): string {
  const spec = {
    type: "fraction-bar",
    title: topic ? `${topic}` : undefined,
    numerator: num,
    denominator: den,
    fractionLabel: `${num}/${den}`,
  };
  return `[[DIAGRAM:${JSON.stringify(spec)}]]`;
}

/**
 * Build a number-line marker for negative numbers / ordering / decimals.
 * We pick a sensible range based on the largest number found in the stem.
 */
function buildNumberLine(content: string, topic: string): string | null {
  const t = `${content} ${topic}`.toLowerCase();
  const wantsNegative = /negative|integer|temperature|below zero|minus/.test(t);
  // Try to find one or two integers in the content to mark on the line.
  const ints: number[] = [];
  const matches = content.match(/-?\d{1,2}/g);
  if (matches) {
    for (const m of matches) {
      const n = parseInt(m, 10);
      if (Number.isFinite(n) && n >= -10 && n <= 20) ints.push(n);
      if (ints.length >= 3) break;
    }
  }
  // Determine line range
  let start = 0;
  let end = 10;
  if (wantsNegative) {
    start = -10;
    end = 10;
  } else if (ints.length > 0) {
    const max = Math.max(...ints, 5);
    end = Math.min(20, Math.max(10, Math.ceil(max / 5) * 5));
  }
  const marked = ints.filter(n => n >= start && n <= end);
  // Number lines look cluttered when range > 20 — bail out rather than
  // produce something the student cannot read.
  if (end - start > 20) return null;
  const spec = {
    type: "number-line",
    title: topic || undefined,
    start,
    end,
    marked: marked.length > 0 ? marked : undefined,
  };
  return `[[DIAGRAM:${JSON.stringify(spec)}]]`;
}

/**
 * Public API — given a maths question, decide whether to attach a simple
 * deterministic SVG diagram and return the marker string. Returns null if
 * no clean match — the question is left untouched.
 *
 * Match priority (most specific first):
 *   1. Ratio in the question stem (a:b or a:b:c)         → bar-model
 *   2. "Fraction of an amount" pattern (e.g. 1/3 of 60)  → bar-model
 *   3. "What fraction is shaded" / fraction visual prompt → fraction-bar
 *   4. Negative-number / ordering / number-line topic    → number-line
 *
 * @param subject  Worksheet subject — must be Maths.
 * @param topic    Worksheet topic, used for diagram titles + heuristics.
 * @param content  The question's stem text (already in plain form, no markdown stripping needed).
 * @returns A `[[DIAGRAM:{...}]]` marker string, or null when no safe match.
 */
export function buildMathsAuxiliaryDiagram(params: {
  subject: string;
  topic: string;
  content: string;
}): string | null {
  if (!isMathsForAuxDiagrams(params.subject)) return null;
  if (!params.content || params.content.length < 4) return null;
  if (hasInlineDiagramMarker(params.content)) return null;

  const content = params.content;
  const topic = params.topic || "";
  const topicLower = topic.toLowerCase();
  const contentLower = content.toLowerCase();

  // 1. Ratios
  if (/ratio|share|proportion|in the ratio/.test(`${contentLower} ${topicLower}`)) {
    const ratio = extractRatio(content);
    if (ratio) {
      const total = extractInt(content, ratio.length, 999) ?? null;
      return buildBarModelFromRatio(ratio, topic, total);
    }
  }

  // 2. Fraction of an amount
  if (/fraction|percent/.test(`${contentLower} ${topicLower}`)) {
    const foa = extractFractionOfAmount(content);
    if (foa) return buildBarModelFromFractionOfAmount(foa.num, foa.den, foa.total, topic);
  }

  // 3. What fraction is shaded
  if (/fraction/.test(topicLower) || /shaded|what fraction/.test(contentLower)) {
    const sh = extractFractionShaded(content, topic);
    if (sh) return buildFractionBar(sh.num, sh.den, topic);
  }

  // 4. Number line topics
  if (/number line|negative|integer|ordering|temperature|place value|decimal/.test(`${contentLower} ${topicLower}`)) {
    return buildNumberLine(content, topic);
  }

  return null;
}

/**
 * Apply maths-aux diagrams to every textual question section in a worksheet,
 * mutating the section's `content` to append a marker IF and only if:
 *   - The worksheet's subject is maths
 *   - The section is a question type
 *   - The section does not already have an inline diagram marker
 *   - One of the deterministic templates matches the question content
 *
 * Section types that already render their own diagram (q-label-diagram,
 * diagram, diagram-a, diagram-b) are skipped — their image comes from the
 * diagram library and the bar-model/number-line would duplicate it.
 */
export function applyMathsAuxiliaryDiagrams<
  S extends { type?: string; content?: string }
>(
  sections: S[] | undefined,
  metadata: { subject?: string; topic?: string } | undefined
): { sections: S[]; appliedCount: number } {
  const result: S[] = [];
  let appliedCount = 0;
  if (!sections) return { sections: [], appliedCount };
  if (!isMathsForAuxDiagrams(metadata?.subject)) return { sections, appliedCount };

  const SKIP_TYPES = new Set([
    "diagram", "diagram-a", "diagram-b", "q-label-diagram",
    "header", "instructions", "info-box", "objective", "vocabulary",
    "self-reflection", "revision-tips", "answers", "mark-scheme",
    "teacher-notes", "teacher-note", "teacher-key", "send-support",
  ]);
  const QUESTION_TYPES = new Set([
    "q-short-answer", "q-extended", "q-mcq", "q-gap-fill", "q-true-false",
    "q-data-table", "q-graph", "q-ordering", "q-matching", "q-challenge",
    "q-circuit", "q-draw", "q-primary-activity",
    "short-answer", "free-response", "guided", "independent", "challenge",
    "question",
  ]);

  for (const section of sections) {
    const type = String(section?.type || "").toLowerCase();
    const content = typeof section?.content === "string" ? section.content : "";
    if (!type || SKIP_TYPES.has(type) || !QUESTION_TYPES.has(type) || !content) {
      result.push(section);
      continue;
    }
    if (hasInlineDiagramMarker(content)) {
      result.push(section);
      continue;
    }
    const marker = buildMathsAuxiliaryDiagram({
      subject: metadata?.subject || "",
      topic: metadata?.topic || "",
      content,
    });
    if (!marker) {
      result.push(section);
      continue;
    }
    result.push({ ...section, content: `${content}\n\n${marker}` });
    appliedCount++;
  }
  return { sections: result, appliedCount };
}
