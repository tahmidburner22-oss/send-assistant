/**
 * pillarAValidator.ts — Pillar A post-generation validators (FEAT-PA-001/002/003).
 *
 * Pillar A — Exam-style questions for Year 9+. This module owns the
 * deterministic post-generation passes that:
 *
 *   1. assertAoPresent      — Stamps metadata.aoHistogram for every question
 *                             section on a Y9+ worksheet, infers AO from
 *                             command word / marks if the LLM omitted the
 *                             tag, and warns on Y9+ exam-style sheets where
 *                             AO is still missing for >25% of questions.
 *
 *   2. assertLorPresent     — On Y10/Y11 science / humanities / English
 *                             worksheets, asserts there is exactly ONE
 *                             6-mark Levelled Open Response (LOR) with a
 *                             three-band level grid in the teacher key.
 *                             Stamps metadata.lorPresent / lorBands /
 *                             lorMarks. Warns when missing.
 *
 *   3. assertSynopticLinks  — On Y10/Y11 worksheets, asserts ≥1 question
 *                             section explicitly links to a prior topic.
 *                             Stamps metadata.synopticLinks. Warns on
 *                             missing links (non-blocking).
 *
 * All three passes are pure (return a new worksheet object), idempotent
 * (re-running is a no-op), and non-blocking (they never reject the
 * worksheet — they only annotate metadata). Warnings are appended to
 * metadata.postValidatorWarnings so they surface in the developer console
 * and the teacher-facing audit panel without breaking generation.
 *
 * Pattern matches mathsStrandTagger.ts and coverageMapBuilder.ts —
 * generic-typed entry points that preserve the caller's worksheet shape.
 */

import type { AssessmentObjective } from "./pastPaperQuestions";

// ─── Shared shape (mirrors coverageMapBuilder.CoverableWorksheet) ────────────

interface PillarASection {
  type?: string;
  title?: string;
  content?: string;
  marks?: number;
  teacherOnly?: boolean;
  /** Pillar A — per-question AO tag stamped by the LLM or post-validator. */
  ao?: AssessmentObjective | string;
  /** Pillar A — synoptic link target topic (set by the LLM or planner). */
  synopticLink?: string;
  [key: string]: unknown;
}

interface PillarAWorksheet {
  sections?: PillarASection[];
  metadata?: Record<string, unknown> & {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    examBoard?: string;
    paper?: "P1" | "P2" | "P3";
    calculator?: boolean;
    priorTopics?: string[];
    aoHistogram?: Record<AssessmentObjective, number>;
    lorPresent?: boolean;
    lorMarks?: number;
    lorBands?: string[];
    synopticLinks?: Array<{ sectionIndex: number; priorTopic: string; sectionTitle?: string }>;
    postValidatorWarnings?: string[];
  };
  [key: string]: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shallow-clones a worksheet so passes never mutate the caller's object. */
function cloneWorksheet<W extends PillarAWorksheet>(ws: W): W {
  return {
    ...ws,
    sections: ws.sections ? ws.sections.map(s => ({ ...s })) : ws.sections,
    metadata: { ...(ws.metadata ?? {}) },
  } as W;
}

/** Pushes a warning onto metadata.postValidatorWarnings without duplicates. */
function pushWarning(ws: PillarAWorksheet, warning: string): void {
  const existing = (ws.metadata?.postValidatorWarnings ?? []) as string[];
  if (existing.includes(warning)) return;
  ws.metadata = {
    ...(ws.metadata ?? {}),
    postValidatorWarnings: [...existing, warning],
  };
}

/** Parses the year group string ("10", "Year 10", "Y10") into a number. */
function parseYearNumber(yearGroup: string | undefined): number {
  if (!yearGroup) return 0;
  const m = yearGroup.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/** True for sections that hold a question (vs LO / vocab / diagram / reflection). */
function isQuestionSection(section: PillarASection): boolean {
  const type = (section.type || "").toLowerCase();
  if (
    type.startsWith("q-") ||
    type === "question" ||
    type === "questions" ||
    type === "section-a" ||
    type === "section-b" ||
    type === "section-c" ||
    type === "challenge" ||
    type === "extended-answer" ||
    type === "lor" ||
    type === "exam-question"
  ) {
    return true;
  }
  // If it has a [N marks] tag in content treat it as a question.
  return /\[\s*\d+\s*marks?\s*\]/i.test(section.content || "");
}

const COMMAND_WORD_RE = /^(\s*\d+[a-z\)\.\s]*)?\s*(calculate|describe|explain|evaluate|state|name|identify|define|list|outline|show|prove|sketch|compare|contrast|analyse|assess|justify|discuss|suggest|solve|work out|determine|to what extent|how far|deduce|interpret|comment)/i;

/** Extracts the first command word in a question's content. */
function extractCommandWord(content: string): string {
  const m = (content || "").match(COMMAND_WORD_RE);
  return m ? m[2].toLowerCase() : "";
}

/** Heuristic AO inference for legacy / unstamped questions. */
function inferAoFromContent(content: string, marks: number): AssessmentObjective {
  const cmd = extractCommandWord(content);
  if (/^(evaluate|analyse|assess|compare|justify|to what extent|how far|discuss)/.test(cmd)) return "AO3";
  if (marks >= 6) return "AO3";
  if (/^(calculate|apply|solve|work out|determine|explain|show|prove|suggest|deduce|interpret)/.test(cmd)) return "AO2";
  if (marks >= 3) return "AO2";
  return "AO1";
}

/** Pulls "[6 marks]" / "[1 mark]" out of a question content string. */
function extractMarksFromContent(content: string): number {
  const m = (content || "").match(/\[\s*(\d+)\s*marks?\s*\]/i);
  return m ? parseInt(m[1], 10) : 0;
}

// ─── 1. assertAoPresent — FEAT-PA-001 ─────────────────────────────────────────

export interface AoAuditOptions {
  subject?: string;
  yearGroup?: string;
  examStyle?: boolean;
}

/**
 * Stamps metadata.aoHistogram and warns when too many questions are missing
 * AO tags on a Y9+ exam-style worksheet. Sections that do not have an `ao`
 * field get one inferred from command word + marks (so the histogram is
 * always populated for downstream UI).
 */
export function assertAoPresent<W extends PillarAWorksheet>(
  worksheet: W,
  opts: AoAuditOptions = {},
): W {
  const yearNum = parseYearNumber(opts.yearGroup ?? worksheet.metadata?.yearGroup);
  const result = cloneWorksheet(worksheet);
  const sections = result.sections ?? [];

  const histogram: Record<AssessmentObjective, number> = { AO1: 0, AO2: 0, AO3: 0, AO4: 0, AO5: 0 };
  let missing = 0;
  let total = 0;

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!isQuestionSection(s)) continue;
    total += 1;

    let ao = (s.ao || "").toString().trim().toUpperCase();
    const isValid = ao === "AO1" || ao === "AO2" || ao === "AO3" || ao === "AO4" || ao === "AO5";

    if (!isValid) {
      missing += 1;
      const marks = s.marks ?? extractMarksFromContent(s.content || "");
      ao = inferAoFromContent(s.content || s.title || "", marks);
      s.ao = ao;
    }

    histogram[ao as AssessmentObjective] = (histogram[ao as AssessmentObjective] ?? 0) + 1;
  }

  if (total > 0) {
    result.metadata = { ...(result.metadata ?? {}), aoHistogram: histogram };
  }

  if (yearNum >= 9 && opts.examStyle && total >= 4 && missing / total > 0.25) {
    pushWarning(
      result,
      `Pillar A AO audit: ${missing}/${total} questions had no explicit AO tag — inferred from command word + marks.`,
    );
  }

  return result;
}

// ─── 2. assertLorPresent — FEAT-PA-002 ────────────────────────────────────────

const LOR_SUBJECTS_RE = /\b(biology|chemistry|physics|combined science|history|geography|english|religious studies|rs)\b/i;

export interface LorAuditOptions {
  subject?: string;
  yearGroup?: string;
  topic?: string;
  examBoard?: string;
}

/** True for Y10/Y11 worksheets where the spec mandates a 6-mark LOR. */
function isLorRequiredYearGroup(yearNum: number): boolean {
  return yearNum >= 10 && yearNum <= 11;
}

/** True for science / humanities / English subjects. */
function isLorRequiredSubject(subject: string | undefined): boolean {
  return !!subject && LOR_SUBJECTS_RE.test(subject);
}

/**
 * Detects a 6-mark Levelled Open Response. Looks for:
 *   - 6 marks in the section.marks or in the content "[6 marks]" tag
 *   - AND either a section type of "extended-answer" / "challenge" / "lor"
 *     OR a content body containing the level-grid markers ("Level 1",
 *     "Level 2", "Level 3", "indicative content").
 */
function detectLor(section: PillarASection): { detected: boolean; bands?: string[] } {
  const marks = section.marks ?? extractMarksFromContent(section.content || "");
  if (marks !== 6) return { detected: false };

  const type = (section.type || "").toLowerCase();
  const looksLor =
    type === "extended-answer" ||
    type === "lor" ||
    type === "challenge" ||
    type === "q-extended" ||
    type.includes("extended");

  const content = section.content || "";
  const hasBands =
    /level\s*1[\)\.\s:]/i.test(content) &&
    /level\s*2[\)\.\s:]/i.test(content) &&
    /level\s*3[\)\.\s:]/i.test(content);
  const hasIndicative = /indicative content/i.test(content);

  if (!looksLor && !hasBands) return { detected: false };

  const bands: string[] = [];
  for (const tag of ["Level 1", "Level 2", "Level 3"]) {
    const re = new RegExp(`${tag}[^\\n]*`, "i");
    const m = content.match(re);
    if (m) bands.push(m[0].slice(0, 200));
  }
  if (bands.length === 0 && hasIndicative) bands.push("Indicative content provided (bands not parsed)");
  if (bands.length === 0 && looksLor) bands.push("LOR slot detected without explicit level grid");

  return { detected: true, bands };
}

/**
 * Asserts a 6-mark LOR is present on Y10/Y11 science/humanities/English
 * worksheets. Stamps metadata.lorPresent / lorMarks / lorBands.
 */
export function assertLorPresent<W extends PillarAWorksheet>(
  worksheet: W,
  opts: LorAuditOptions = {},
): W {
  const yearNum = parseYearNumber(opts.yearGroup ?? worksheet.metadata?.yearGroup);
  const subject = opts.subject ?? worksheet.metadata?.subject;
  if (!isLorRequiredYearGroup(yearNum) || !isLorRequiredSubject(subject)) {
    return worksheet;
  }

  const result = cloneWorksheet(worksheet);
  const sections = result.sections ?? [];

  let detectedBands: string[] | undefined;
  for (const s of sections) {
    const { detected, bands } = detectLor(s);
    if (detected) {
      detectedBands = bands;
      break;
    }
  }

  result.metadata = {
    ...(result.metadata ?? {}),
    lorPresent: !!detectedBands,
    lorMarks: 6,
    lorBands: detectedBands ?? [],
  };

  if (!detectedBands) {
    pushWarning(
      result,
      `Pillar A LOR audit: Y${yearNum} ${subject} worksheet does not contain a 6-mark Level 1/2/3 extended response.`,
    );
  } else if (detectedBands.length < 3) {
    pushWarning(
      result,
      `Pillar A LOR audit: 6-mark LOR detected but only ${detectedBands.length}/3 level bands recognised in the teacher key.`,
    );
  }

  return result;
}

// ─── 3. assertSynopticLinks — FEAT-PA-003 ─────────────────────────────────────

export interface SynopticAuditOptions {
  subject?: string;
  yearGroup?: string;
  topic?: string;
  priorTopics?: string[];
}

/**
 * Detects "links to prior learning" / synoptic question sections. Two paths:
 *   - The LLM stamped a `synopticLink: "<prior topic id>"` field on the section.
 *   - The content body mentions a prior topic from `opts.priorTopics`
 *     alongside an explicit "link" / "previous" / "earlier" cue.
 */
function detectSynopticLink(
  section: PillarASection,
  priorTopics: string[],
): string | undefined {
  if (typeof section.synopticLink === "string" && section.synopticLink.trim().length > 0) {
    return section.synopticLink.trim();
  }
  const content = (section.content || "").toLowerCase();
  if (content.length === 0) return undefined;
  const hasCue =
    /link(s)? to prior/i.test(section.content || "") ||
    /prior\s*topic/i.test(section.content || "") ||
    /from\s+(your|the)\s+previous/i.test(section.content || "") ||
    /earlier\s+in\s+the\s+course/i.test(section.content || "");
  if (!hasCue) return undefined;
  for (const t of priorTopics) {
    if (t && content.includes(t.toLowerCase())) return t;
  }
  return priorTopics[0] || "prior-topic";
}

/**
 * Stamps metadata.synopticLinks and warns when a Y10/Y11 sheet has zero
 * synoptic questions. Non-blocking.
 */
export function assertSynopticLinks<W extends PillarAWorksheet>(
  worksheet: W,
  opts: SynopticAuditOptions = {},
): W {
  const yearNum = parseYearNumber(opts.yearGroup ?? worksheet.metadata?.yearGroup);
  if (yearNum < 10 || yearNum > 11) return worksheet;

  const priorTopics =
    opts.priorTopics ??
    (Array.isArray(worksheet.metadata?.priorTopics) ? worksheet.metadata!.priorTopics! : []);

  const result = cloneWorksheet(worksheet);
  const sections = result.sections ?? [];
  const links: Array<{ sectionIndex: number; priorTopic: string; sectionTitle?: string }> = [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!isQuestionSection(s)) continue;
    const link = detectSynopticLink(s, priorTopics);
    if (link) {
      links.push({ sectionIndex: i, priorTopic: link, sectionTitle: s.title });
    }
  }

  result.metadata = { ...(result.metadata ?? {}), synopticLinks: links };
  if (priorTopics.length > 0 && links.length === 0) {
    pushWarning(
      result,
      `Pillar A synoptic audit: Y${yearNum} sheet has 0 questions linking to prior topics (${priorTopics.slice(0, 3).join(", ")}).`,
    );
  }
  return result;
}

// ─── Combined entry point ────────────────────────────────────────────────────

export interface PillarAAuditOptions extends AoAuditOptions, LorAuditOptions, SynopticAuditOptions {
  examStyle?: boolean;
}

/**
 * Runs all three Pillar A audits in order: AO → LOR → synoptic. Each pass
 * is a no-op when its preconditions aren't met (year group / subject), so
 * this is safe to call on every worksheet.
 */
export function applyPillarAAudits<W extends PillarAWorksheet>(
  worksheet: W,
  opts: PillarAAuditOptions = {},
): W {
  let out = assertAoPresent(worksheet, opts);
  out = assertLorPresent(out, opts);
  out = assertSynopticLinks(out, opts);
  return out;
}
