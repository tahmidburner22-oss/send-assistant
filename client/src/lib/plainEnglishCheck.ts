/**
 * plainEnglishCheck.ts — FEAT-PC7 · Phase C (WCAG / Plain English)
 * ──────────────────────────────────────────────────────────────────────────
 * Flesch–Kincaid readability scorer, used to flag worksheet sections whose
 * reading age exceeds the plain-English ceiling (default: age 12). Pure
 * function, no DOM/network deps so it works in tests and in the browser.
 *
 * The codebase already has FK helpers scattered across feature-specific
 * files (parent-newsletter-enhancements, comprehension-enhancements,
 * differentiate-enhancements). This module consolidates a single
 * implementation that the WCAG audit and the EAL pipeline both reuse.
 */

// ─── Tokenisation helpers ──────────────────────────────────────────────────

const SENTENCE_RE = /[^.!?]+[.!?]+/g;
const WORD_RE = /[A-Za-z]+(?:[''][A-Za-z]+)?/g;

/**
 * Approximate syllable count for an English word. Deliberately conservative
 * — close enough for FK band classification but inexpensive.
 */
export function countSyllables(rawWord: string): number {
  if (!rawWord) return 0;
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  // Drop trailing 'e' but only when not preceded by 'l' (handles "table").
  let stripped = word.replace(/(?:[^aeiou])e\b/g, (m) => m[0]);
  // Collapse vowel groups → one syllable each.
  const groups = stripped.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  // Common adjustments
  if (stripped.endsWith("le") && stripped.length > 2 && !"aeiouy".includes(stripped[stripped.length - 3])) {
    count++;
  }
  if (stripped.endsWith("ed") && !/[td]ed$/.test(stripped)) {
    count = Math.max(1, count - 1);
  }
  return Math.max(1, count);
}

function countSentences(text: string): number {
  const matches = text.match(SENTENCE_RE);
  if (!matches || matches.length === 0) {
    // Fall back to "whole input is one sentence" if no terminator found.
    return text.trim().length > 0 ? 1 : 0;
  }
  return matches.length;
}

function listWords(text: string): string[] {
  return text.match(WORD_RE) || [];
}

// ─── Public API ────────────────────────────────────────────────────────────

export type ReadabilityLevel = "easy" | "ok" | "difficult";

export interface PlainEnglishReport {
  /** Flesch–Kincaid grade level (US grade). */
  fk: number;
  /** Flesch Reading Ease (0–100, higher = easier). */
  fre: number;
  /** Approximate UK reading age (years). */
  readingAge: number;
  /** Banded label suitable for chip display. */
  level: ReadabilityLevel;
  /** Total words counted (>= 0). */
  words: number;
  /** Total sentences counted (>= 0). */
  sentences: number;
  /** Quick suggestions to lower reading age, derived from the input. */
  suggestions: string[];
}

const EMPTY_REPORT: PlainEnglishReport = {
  fk: 0,
  fre: 100,
  readingAge: 5,
  level: "easy",
  words: 0,
  sentences: 0,
  suggestions: [],
};

/**
 * Score plain-English readability of a string.
 * Returns a deterministic report; never throws.
 */
export function scorePlainEnglish(text: string): PlainEnglishReport {
  const trimmed = (text || "").trim();
  if (!trimmed) return EMPTY_REPORT;

  const words = listWords(trimmed);
  const sentences = Math.max(1, countSentences(trimmed));
  if (words.length === 0) return { ...EMPTY_REPORT, sentences };

  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const wordsPerSentence = words.length / sentences;
  const syllablesPerWord = syllables / words.length;

  // Flesch–Kincaid Grade Level
  const fk = Math.max(0, 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59);
  // Flesch Reading Ease
  const fre = Math.max(
    0,
    Math.min(100, 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord),
  );

  const readingAge = Math.round(Math.max(5, Math.min(18, fk + 5)));

  let level: ReadabilityLevel;
  if (readingAge <= 9) level = "easy";
  else if (readingAge <= 12) level = "ok";
  else level = "difficult";

  const suggestions: string[] = [];
  if (wordsPerSentence > 18) {
    suggestions.push(
      `Average sentence length is ${wordsPerSentence.toFixed(1)} words — aim for 12–16.`,
    );
  }
  if (syllablesPerWord > 1.7) {
    suggestions.push("Several long/complex words — replace with shorter everyday equivalents.");
  }
  if (level === "difficult") {
    suggestions.push("Reading age is above 12 — run the Reading Level slider or the EAL simplifier.");
  }

  return {
    fk: Math.round(fk * 10) / 10,
    fre: Math.round(fre * 10) / 10,
    readingAge,
    level,
    words: words.length,
    sentences,
    suggestions,
  };
}

// ─── Section-level audit ───────────────────────────────────────────────────

export interface SectionLike {
  title?: string;
  content?: string;
  type?: string;
  teacherOnly?: boolean;
}

export interface PlainEnglishSectionFlag {
  index: number;
  title: string;
  report: PlainEnglishReport;
}

export interface WorksheetReadabilitySummary {
  /** Average reading age across pupil-facing sections. */
  averageReadingAge: number;
  /** Highest reading age observed across pupil-facing sections. */
  worstReadingAge: number;
  /** Sections whose reading age exceeds the threshold. */
  flagged: PlainEnglishSectionFlag[];
  /** True when at least one pupil-facing section is flagged. */
  passesPlainEnglish: boolean;
}

/**
 * Run plain-English check across pupil-facing sections of a worksheet.
 * Sections marked teacherOnly are skipped — they are not pupil-read.
 *
 * `threshold` is the maximum acceptable UK reading age (default 12 — i.e.
 * GOV.UK plain-English ceiling).
 */
export function checkWorksheetReadability(
  sections: SectionLike[] | undefined | null,
  threshold = 12,
): WorksheetReadabilitySummary {
  const list = (sections || []).filter((s) => !s.teacherOnly);
  if (list.length === 0) {
    return {
      averageReadingAge: 0,
      worstReadingAge: 0,
      flagged: [],
      passesPlainEnglish: true,
    };
  }

  const reports = list.map((s, i) => ({
    index: i,
    title: s.title || `Section ${i + 1}`,
    report: scorePlainEnglish(`${s.title || ""}\n\n${s.content || ""}`),
  }));

  const ages = reports.map((r) => r.report.readingAge);
  const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
  const worst = Math.max(...ages);
  const flagged = reports.filter((r) => r.report.readingAge > threshold);

  return {
    averageReadingAge: Math.round(avg * 10) / 10,
    worstReadingAge: worst,
    flagged,
    passesPlainEnglish: flagged.length === 0,
  };
}
