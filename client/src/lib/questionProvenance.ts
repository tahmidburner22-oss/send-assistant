/**
 * questionProvenance.ts — FEAT-PB1 · Phase B
 *
 * Post-generation pass that stamps every question section with structured
 * provenance metadata: { specRef, ao, bloomLevel, expectedReadingAge }.
 *
 * Design:
 *   - Pure, idempotent, non-blocking (never rejects a worksheet).
 *   - Reuses helper logic from coverageMapBuilder.ts and pillarAValidator.ts
 *     (bloom mapping, spec-ref resolution, AO inference from command words).
 *   - Missing fields emit a postValidatorWarning; they never error.
 *   - sourceCitation is always optional — the AI may leave it blank.
 *
 * Run order: AFTER applyPillarAAudits (which stamps section.ao) and AFTER
 * applyCoverageMap. This pass fills any remaining gaps.
 */

import { getSyllabusTopics, type SyllabusTopic } from "./syllabus-data";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AO = "AO1" | "AO2" | "AO3" | "AO4";
export type BloomLevel = "remember" | "understand" | "apply" | "analyse" | "evaluate" | "create";

interface ProvenanceSection {
  type?: string;
  title?: string;
  content?: string;
  marks?: number;
  teacherOnly?: boolean;
  ao?: string;
  specRef?: string;
  bloomLevel?: string;
  expectedReadingAge?: number;
  sourceCitation?: string;
  [key: string]: unknown;
}

interface ProvenanceWorksheet {
  sections?: ProvenanceSection[];
  metadata?: Record<string, unknown> & {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    postValidatorWarnings?: string[];
  };
  [key: string]: unknown;
}

// ─── Question detection (matches coverageMapBuilder) ─────────────────────────

const QUESTION_TYPES = new Set([
  "q-true-false", "q-mcq", "q-gap-fill", "q-short-answer", "q-extended",
  "q-label-diagram", "q-data-table", "q-draw", "q-graph", "q-circuit",
  "q-ordering", "q-matching", "q-error-correction", "q-ranking",
  "q-what-changed", "q-constraint-problem", "q-challenge", "challenge",
  "question", "questions", "section-a", "section-b", "section-c",
  "extended-answer", "lor", "exam-question",
]);

function isQuestionSection(s: ProvenanceSection): boolean {
  if (s.teacherOnly) return false;
  const t = String(s.type || "").toLowerCase();
  if (QUESTION_TYPES.has(t)) return true;
  if (/^section\s*[a-c]\b|recall|understanding|application/i.test(String(s.title || ""))) return true;
  return /\[\s*\d+\s*marks?\s*\]/i.test(s.content || "");
}

// ─── AO inference (extracted from pillarAValidator) ──────────────────────────

const COMMAND_WORD_RE = /^(\s*\d+[a-z)\.\s]*)?\s*(calculate|describe|explain|evaluate|state|name|identify|define|list|outline|show|prove|sketch|compare|contrast|analyse|assess|justify|discuss|suggest|solve|work out|determine|to what extent|how far|deduce|interpret|comment)/i;

function extractCommandWord(content: string): string {
  const m = (content || "").match(COMMAND_WORD_RE);
  return m ? m[2].toLowerCase() : "";
}

function extractMarks(s: ProvenanceSection): number {
  if (typeof s.marks === "number" && s.marks > 0) return s.marks;
  const m = (s.content || "").match(/\[\s*(\d+)\s*marks?\s*\]/i);
  return m ? parseInt(m[1], 10) : 0;
}

export function inferAo(content: string, marks: number): AO {
  const cmd = extractCommandWord(content);
  if (/^(evaluate|analyse|assess|compare|justify|to what extent|how far|discuss)/.test(cmd)) return "AO3";
  if (marks >= 6) return "AO3";
  if (/^(calculate|apply|solve|work out|determine|explain|show|prove|suggest|deduce|interpret)/.test(cmd)) return "AO2";
  if (marks >= 3) return "AO2";
  return "AO1";
}

// ─── Bloom mapping (extended from coverageMapBuilder's 4-level to full 6-level) ─

const BLOOM_FROM_TYPE: Record<string, BloomLevel> = {
  "q-true-false": "remember",
  "q-mcq": "remember",
  "q-gap-fill": "remember",
  "q-matching": "remember",
  "q-ordering": "remember",
  "q-ranking": "remember",
  "recall": "remember",
  "q-short-answer": "understand",
  "q-data-table": "understand",
  "q-label-diagram": "understand",
  "q-error-correction": "understand",
  "q-what-changed": "understand",
  "understanding": "understand",
  "q-extended": "apply",
  "q-graph": "apply",
  "q-draw": "apply",
  "q-circuit": "apply",
  "q-constraint-problem": "analyse",
  "application": "apply",
  "q-challenge": "evaluate",
  "challenge": "evaluate",
  "extended-answer": "evaluate",
  "lor": "evaluate",
};

export function inferBloom(section: ProvenanceSection): BloomLevel {
  const t = String(section.type || "").toLowerCase();
  if (BLOOM_FROM_TYPE[t]) return BLOOM_FROM_TYPE[t];
  const title = String(section.title || "").toLowerCase();
  if (/recall|warm.up|quick\s*start/.test(title)) return "remember";
  if (/understanding|main\s*practice/.test(title)) return "understand";
  if (/application|analysis|exam.style/.test(title)) return "apply";
  if (/challenge|bonus|stretch|secret\s*mission/.test(title)) return "evaluate";
  // Infer from command word
  const cmd = extractCommandWord(section.content || "");
  if (/^(state|name|identify|define|list)/.test(cmd)) return "remember";
  if (/^(describe|outline|explain)/.test(cmd)) return "understand";
  if (/^(calculate|solve|work out|determine|show|prove|suggest|sketch)/.test(cmd)) return "apply";
  if (/^(analyse|compare|contrast|interpret|deduce)/.test(cmd)) return "analyse";
  if (/^(evaluate|assess|justify|discuss|to what extent|how far)/.test(cmd)) return "evaluate";
  return "understand";
}

// ─── Spec-ref resolution (reuses syllabus-data) ──────────────────────────────

function resolveSpecRef(
  subject: string | undefined,
  yearGroup: string | undefined,
  topic: string | undefined,
): string {
  if (!subject || !yearGroup) return topic ? `${yearGroup ?? "?"} — ${topic}` : "";
  let topics: SyllabusTopic[] = [];
  try {
    topics = getSyllabusTopics(subject, yearGroup);
  } catch {
    return `${yearGroup} ${capitalise(subject)} — ${topic || "programme of study"}`;
  }
  const topicKey = (topic || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  if (!topicKey) return `${yearGroup} ${capitalise(subject)} — programme of study`;

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

// ─── Reading age estimation (simplified Flesch-Kincaid) ──────────────────────

/**
 * Simplified Flesch-Kincaid reading age for a text snippet.
 * Returns a UK reading age (roughly 5–18). Approximate but deterministic.
 */
export function estimateReadingAge(text: string): number {
  if (!text || text.length < 10) return 7;
  // Strip marks tags, markdown, and special chars
  const clean = text
    .replace(/\[\d+\s*marks?\]/gi, "")
    .replace(/[#*_\[\](){}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0 || sentences.length === 0) return 7;
  // Count syllables (heuristic)
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllableCount / words.length;
  // Flesch-Kincaid Grade Level → UK reading age (grade + 5)
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  const readingAge = Math.round(Math.max(5, Math.min(18, gradeLevel + 5)));
  return readingAge;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  // Silent e
  if (w.endsWith("e") && count > 1) count--;
  // -le at end counts
  if (w.endsWith("le") && w.length > 2 && !vowels.includes(w[w.length - 3])) count++;
  return Math.max(1, count);
}

// ─── Year check ──────────────────────────────────────────────────────────────

function parseYear(yearGroup: string | undefined): number {
  if (!yearGroup) return 0;
  const m = yearGroup.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface QuestionProvenanceOptions {
  subject?: string;
  topic?: string;
  yearGroup?: string;
}

/**
 * Stamps provenance fields (specRef, ao, bloomLevel, expectedReadingAge) onto
 * every question section. Non-destructive: only fills fields that are missing.
 * Returns a new worksheet object (never mutates the input).
 */
export function applyQuestionProvenance<W extends ProvenanceWorksheet>(
  worksheet: W,
  opts: QuestionProvenanceOptions = {},
): W {
  const subject = opts.subject || worksheet.metadata?.subject;
  const yearGroup = opts.yearGroup || worksheet.metadata?.yearGroup;
  const topic = opts.topic || worksheet.metadata?.topic;
  const yearNum = parseYear(yearGroup);

  // Only apply provenance for Y9+ (formal exam-style questions)
  if (yearNum < 9) return worksheet;

  const sections = worksheet.sections ? [...worksheet.sections.map(s => ({ ...s }))] : [];
  const warnings: string[] = [];
  let totalQuestions = 0;
  let specRefFilled = 0;

  const baseSpecRef = resolveSpecRef(subject, yearGroup, topic);

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!isQuestionSection(s)) continue;
    totalQuestions++;

    // ── AO: respect existing (from pillarAValidator), fill if missing
    if (!s.ao || !["AO1", "AO2", "AO3", "AO4"].includes(String(s.ao).toUpperCase())) {
      const marks = extractMarks(s);
      s.ao = inferAo(s.content || s.title || "", marks);
    } else {
      s.ao = String(s.ao).toUpperCase();
    }

    // ── Bloom level: fill if missing
    if (!s.bloomLevel) {
      s.bloomLevel = inferBloom(s);
    }

    // ── Spec ref: fill if missing
    if (!s.specRef) {
      if (baseSpecRef) {
        s.specRef = baseSpecRef;
        specRefFilled++;
      }
      // If no specRef could be resolved, leave undefined (warning below)
    } else {
      specRefFilled++;
    }

    // ── Reading age: fill if missing
    if (s.expectedReadingAge === undefined || s.expectedReadingAge === null) {
      s.expectedReadingAge = estimateReadingAge(s.content || "");
    }
  }

  // Warn if <80% of questions got a specRef
  if (totalQuestions > 0 && specRefFilled / totalQuestions < 0.8) {
    warnings.push(
      `PB1 provenance: only ${specRefFilled}/${totalQuestions} questions have a specRef — could not resolve from syllabus data.`
    );
  }

  const existingWarnings = (worksheet.metadata?.postValidatorWarnings as string[]) || [];
  const allWarnings = [...existingWarnings, ...warnings.filter(w => !existingWarnings.includes(w))];

  return {
    ...worksheet,
    sections,
    metadata: {
      ...(worksheet.metadata || {}),
      ...(allWarnings.length > 0 ? { postValidatorWarnings: allWarnings } : {}),
    },
  } as W;
}
