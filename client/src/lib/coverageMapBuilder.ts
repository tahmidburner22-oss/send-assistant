/**
 * coverageMapBuilder.ts — FEAT-PC10
 *
 * For every Y9+ worksheet we generate, build a teacher-only "coverage map"
 * that documents — per question — the Bloom level, exam command word,
 * mark count, best-match curriculum spec reference, and any linked
 * misconception. Teachers need this to prove curriculum alignment to SLT,
 * answer parental queries, and audit a single sheet against an exam-board
 * specification in seconds.
 *
 * The data is mostly already inferable from elsewhere in the worksheet:
 *   - command word            ←  first action verb in the question content
 *   - marks                   ←  [N marks] tag in the content (or section.marks)
 *   - Bloom level             ←  section type (recall / understanding / application / challenge)
 *   - spec ref                ←  syllabus-data.ts best-match against (subject, year, topic)
 *   - misconception link      ←  metadata.misconceptionLinks (FEAT-PB7) when present
 *
 * The builder is **post-generation** and never mutates question content. It
 * just records a structured array on `metadata.coverageMap` and the renderer
 * decides whether to display it. No-op for KS1/KS2 — coverage maps don't
 * make sense before formal command words appear.
 */

import { getSyllabusTopics, type SyllabusTopic } from "./syllabus-data";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BloomLevel = "recall" | "understanding" | "application" | "challenge" | "uncategorised";

export interface CoverageMapRow {
  /** 1-based question number — stable across the worksheet. */
  qNum: number;
  /** 0-based section index for back-pointer. */
  sectionIndex: number;
  /** Section title for display. */
  sectionTitle?: string;
  /** Section type (e.g. q-mcq, q-short-answer, recall). */
  sectionType?: string;
  /** Marks for the question (best-effort — looks at content tag then section.marks). */
  marks: number;
  /** Bloom level (mapped from section type / title). */
  bloom: BloomLevel;
  /** Detected exam command word (first verb in the content). Empty when none. */
  commandWord: string;
  /** Best-match spec reference, e.g. "AQA Physics RP-1" or "Y10 Maths — Algebra (linear graphs)". */
  specRef: string;
  /** Misconception ids this question's distractors target (from metadata.misconceptionLinks). */
  misconceptionIds: string[];
}

export interface CoverageMap {
  rows: CoverageMapRow[];
  totalQuestions: number;
  totalMarks: number;
  /** Distribution of Bloom levels across the worksheet. */
  bloomDistribution: Record<BloomLevel, number>;
  /** Distinct command words seen on the sheet (e.g. ["Calculate", "Explain", "Evaluate"]). */
  commandWords: string[];
  /** Subject + year used to resolve spec refs (echoed back for the renderer). */
  subject?: string;
  yearGroup?: string;
  /** Topic the worksheet was generated for. */
  topic?: string;
}

// ─── Section / question detection ────────────────────────────────────────────

interface CoverableSection {
  type?: string;
  title?: string;
  content?: string;
  marks?: number;
  teacherOnly?: boolean;
  [key: string]: unknown;
}

interface CoverableWorksheet {
  sections?: CoverableSection[];
  metadata?: Record<string, unknown> & {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    misconceptionLinks?: Array<{
      sectionIndex: number;
      sectionTitle?: string;
      distractor: string;
      misconceptionId: string;
    }>;
    coverageMap?: CoverageMap;
    postValidatorWarnings?: string[];
  };
  [key: string]: unknown;
}

const QUESTION_TYPES = new Set([
  "q-true-false", "q-mcq", "q-gap-fill", "q-short-answer", "q-extended",
  "q-label-diagram", "q-data-table", "q-draw", "q-graph", "q-circuit",
  "q-ordering", "q-matching", "q-error-correction", "q-ranking",
  "q-what-changed", "q-constraint-problem", "q-challenge", "challenge",
]);

function isQuestionSection(s: CoverableSection): boolean {
  if (s.teacherOnly) return false;
  const t = String(s.type || "").toLowerCase();
  if (QUESTION_TYPES.has(t)) return true;
  // Some templates emit Section A/B/C blocks with multiple Qs inside.
  return /^section\s*[a-c]\b|recall|understanding|application/i.test(String(s.title || ""));
}

// ─── Bloom mapping ───────────────────────────────────────────────────────────

const BLOOM_FROM_TYPE: Record<string, BloomLevel> = {
  // Recall
  "q-true-false": "recall",
  "q-mcq": "recall",
  "q-gap-fill": "recall",
  "q-matching": "recall",
  "q-ordering": "recall",
  "q-ranking": "recall",
  "recall": "recall",
  // Understanding
  "q-short-answer": "understanding",
  "q-data-table": "understanding",
  "q-label-diagram": "understanding",
  "q-error-correction": "understanding",
  "q-what-changed": "understanding",
  "understanding": "understanding",
  // Application
  "q-extended": "application",
  "q-graph": "application",
  "q-draw": "application",
  "q-circuit": "application",
  "q-constraint-problem": "application",
  "application": "application",
  // Challenge
  "q-challenge": "challenge",
  "challenge": "challenge",
};

function bloomFor(section: CoverableSection): BloomLevel {
  const t = String(section.type || "").toLowerCase();
  if (BLOOM_FROM_TYPE[t]) return BLOOM_FROM_TYPE[t];
  const title = String(section.title || "").toLowerCase();
  if (/section\s*a|recall|warm.up|quick\s*start/.test(title)) return "recall";
  if (/section\s*b|main\s*practice|understanding/.test(title)) return "understanding";
  if (/section\s*c|application|analysis|exam.style/.test(title)) return "application";
  if (/challenge|bonus|stretch|secret\s*mission/.test(title)) return "challenge";
  return "uncategorised";
}

// ─── Marks + command word extraction ─────────────────────────────────────────

const MARK_TAG_RE = /\[(\d+)\s*marks?\]/i;
function extractMarks(section: CoverableSection): number {
  if (typeof section.marks === "number" && section.marks > 0) return section.marks;
  const content = String(section.content || "");
  // Sum all "[N marks]" tags (e.g. when one section bundles 3 questions)
  let total = 0;
  const re = /\[(\d+)\s*marks?\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) total += parseInt(m[1], 10) || 0;
  if (total > 0) return total;
  // Fallback: single tag
  const single = MARK_TAG_RE.exec(content);
  return single ? parseInt(single[1], 10) || 0 : 0;
}

const EXAM_COMMAND_VERBS = [
  // Order longest-first so "Show that" beats "Show".
  "Work out", "Show that", "Give a reason", "Give one reason",
  "Write down", "Explain why", "Explain how",
  "Calculate", "Evaluate", "Analyse", "Justify", "Compare",
  "Describe", "Explain", "State", "Identify", "Suggest", "Define",
  "Discuss", "Prove", "Solve", "Sketch", "Plot", "Round",
  "Convert", "Estimate", "Simplify", "Factorise", "Expand",
  "Substitute", "Find", "Determine", "Complete", "Match",
  "Circle", "Tick", "Label", "Draw", "Hence",
];

const COMMAND_VERB_RE = new RegExp(
  "\\b(" + EXAM_COMMAND_VERBS.map((v) => v.replace(/ /g, "\\s+")).join("|") + ")\\b",
  "i",
);

function extractCommandWord(section: CoverableSection): string {
  // Strip checkbox prefix, sentence frames, and instruction headers from the
  // first line so the verb is detected on the actual question stem.
  const content = String(section.content || "")
    .replace(/^\s*\[\s*[xX]?\s*\]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*\(\w\)\s+/gm, "");
  const m = COMMAND_VERB_RE.exec(content);
  return m ? toTitleCase(m[1]) : "";
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

// ─── Spec reference resolution ───────────────────────────────────────────────

/**
 * Resolves a best-match spec reference for the worksheet's (subject, year,
 * topic) tuple by looking up syllabus-data.ts. Returns a short human-readable
 * string the renderer can show in the coverage table.
 *
 * We do NOT pretend to return an exam-board sub-section code (e.g.
 * "AQA Maths 4.2.1") because that bank doesn't exist in syllabus-data.
 * Instead we return: "<KS> <subject> — <closest topic>" or fall back to the
 * worksheet's own topic + year if no match is found.
 */
function resolveSpecRef(
  subject: string | undefined,
  yearGroup: string | undefined,
  topic: string | undefined,
): string {
  if (!subject || !yearGroup) return topic ? `${yearGroup ?? "?"} — ${topic}` : "—";
  const topics = (() => {
    try {
      return getSyllabusTopics(subject, yearGroup);
    } catch {
      return [] as SyllabusTopic[];
    }
  })();
  const topicKey = (topic || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  if (!topicKey) {
    return `${yearGroup} ${capitalise(subject)} — programme of study`;
  }
  // Score each syllabus topic by keyword overlap.
  let best: { topic: SyllabusTopic; score: number } | null = null;
  for (const t of topics) {
    const haystack = (t.topic + " " + t.keyVocabulary.join(" ")).toLowerCase();
    let score = 0;
    if (haystack.includes(topicKey)) score += 5;
    for (const word of topicKey.split(/\s+/)) {
      if (word.length >= 4 && haystack.includes(word)) score += 1;
    }
    if (!best || score > best.score) best = { topic: t, score };
  }
  if (best && best.score > 0) {
    const ks = best.topic.ksStage || "";
    return `${ks ? ks + " " : ""}${capitalise(subject)} — ${best.topic.topic}`;
  }
  return `${yearGroup} ${capitalise(subject)} — ${topic}`;
}

function capitalise(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface CoverageMapOptions {
  subject?: string;
  topic?: string;
  yearGroup?: string;
}

function isY9Plus(yearGroup: string | undefined): boolean {
  const m = (yearGroup || "").match(/(\d+)/);
  if (!m) return false;
  const y = parseInt(m[1], 10);
  return y >= 9 && y <= 13;
}

/**
 * Build a coverage map for the worksheet. Returns null when the worksheet is
 * KS1/KS2 (no formal command words / spec refs) or has no question sections.
 */
export function buildCoverageMap(
  worksheet: CoverableWorksheet,
  opts: CoverageMapOptions = {},
): CoverageMap | null {
  const subject = opts.subject || worksheet.metadata?.subject;
  const yearGroup = opts.yearGroup || worksheet.metadata?.yearGroup;
  const topic = opts.topic || worksheet.metadata?.topic;
  if (!isY9Plus(yearGroup)) return null;

  const sections = worksheet.sections || [];
  const links = Array.isArray(worksheet.metadata?.misconceptionLinks)
    ? (worksheet.metadata!.misconceptionLinks as Array<{
        sectionIndex: number;
        misconceptionId: string;
      }>)
    : [];

  const rows: CoverageMapRow[] = [];
  let qNum = 0;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!isQuestionSection(s)) continue;
    qNum += 1;
    const marks = extractMarks(s);
    const bloom = bloomFor(s);
    const commandWord = extractCommandWord(s);
    const specRef = resolveSpecRef(subject, yearGroup, topic);
    const misconceptionIds = links
      .filter((l) => l.sectionIndex === i)
      .map((l) => l.misconceptionId);
    rows.push({
      qNum,
      sectionIndex: i,
      sectionTitle: typeof s.title === "string" ? s.title : undefined,
      sectionType: typeof s.type === "string" ? s.type : undefined,
      marks,
      bloom,
      commandWord,
      specRef,
      misconceptionIds,
    });
  }

  if (rows.length === 0) return null;

  const bloomDistribution: Record<BloomLevel, number> = {
    recall: 0,
    understanding: 0,
    application: 0,
    challenge: 0,
    uncategorised: 0,
  };
  for (const r of rows) bloomDistribution[r.bloom] += 1;

  const commandWords = Array.from(new Set(rows.map((r) => r.commandWord).filter(Boolean)));
  const totalMarks = rows.reduce((sum, r) => sum + r.marks, 0);

  return {
    rows,
    totalQuestions: rows.length,
    totalMarks,
    bloomDistribution,
    commandWords,
    subject,
    yearGroup,
    topic,
  };
}

/**
 * Stamp `metadata.coverageMap` onto a worksheet (immutably). No-op for
 * worksheets where buildCoverageMap returns null. Idempotent — running twice
 * yields the same metadata array.
 */
export function applyCoverageMap<W extends CoverableWorksheet>(
  worksheet: W,
  opts: CoverageMapOptions = {},
): W {
  const map = buildCoverageMap(worksheet, opts);
  if (!map) return worksheet;
  return {
    ...worksheet,
    metadata: {
      ...(worksheet.metadata || {}),
      coverageMap: map,
    },
  } as W;
}
