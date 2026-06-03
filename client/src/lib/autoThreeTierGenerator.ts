/**
 * autoThreeTierGenerator.ts
 *
 * June 2026 — Part B / Sprint 9 (item B8): Three-Tier Auto-Generation.
 *
 * Given a completed *Standard*-tier worksheet, deterministically derive the
 * two sibling tiers (Foundation and Higher) so a teacher can print a whole-
 * class pack — Support / Core / Challenge — from a single generation.
 *
 *   Foundation  →  reduce marks by 30%, add scaffold hints to every question,
 *                  add sentence starters, simplify language (shorter sentences),
 *                  add a word bank to extended questions.
 *   Standard    →  the untouched core version (returned as a deep clone).
 *   Higher      →  increase marks by 20%, remove ALL scaffolding hints, add a
 *                  reasoning demand ("explain why", "justify"), add a
 *                  synoptic / cross-topic link.
 *
 * All three versions share the SAME base structure (same sections, same topic);
 * only the scaffolding level, marks and language demand differ.
 *
 * Every transform is:
 *   - Pure (the input worksheet is never mutated — we deep clone first).
 *   - Deterministic (no AI / network calls — safe to run offline & in tests).
 *   - Idempotent-friendly (markers are detected before being re-added).
 */

import type {
  GeneratedWorksheet,
  WorksheetSection,
} from "./worksheet-generator";

// ─── Tunable factors ─────────────────────────────────────────────────────────

/** Foundation reduces the mark tariff by 30%. */
const FOUNDATION_MARK_FACTOR = 0.7;
/** Higher increases the mark tariff by 20%. */
const HIGHER_MARK_FACTOR = 1.2;

// ─── Scaffold markers (single source of truth for add + strip) ────────────────

const HINT_PREFIX = "Hint:";
const STEPS_PREFIX = "Steps:";
const SENTENCE_STARTER_PREFIX = "Sentence starter:";
const WORD_BANK_PREFIX = "Word bank:";
const SYNOPTIC_PREFIX = "Synoptic link:";

/** Lines a Higher tier must never contain (all scaffolding hint forms). */
const SCAFFOLD_LINE_PATTERNS: RegExp[] = [
  /^\s*(?:💡\s*)?hint\s*:/i,
  /^\s*steps?\s*:/i,
  /^\s*sentence\s*starter\s*:/i,
  /^\s*word\s*bank\s*:/i,
  /^\s*scaffold\s*:/i,
];

// ─── Section-type helpers ─────────────────────────────────────────────────────

/** Question / practice section types that carry marks and answers. */
const QUESTION_TYPES = new Set<string>([
  "recall", "understanding", "application", "challenge",
  "guided", "independent", "extension",
  "q-true-false", "q-mcq", "q-gap-fill", "q-short-answer", "q-extended",
  "q-data-table", "q-label-diagram", "q-ordering", "q-matching", "q-challenge",
  "q-circuit", "q-draw", "q-graph", "questions", "question", "word-problems",
]);

/** Section types that demand an extended written response. */
const EXTENDED_TYPES = new Set<string>([
  "q-extended", "challenge", "q-challenge", "application", "extension",
]);

function sectionTypeOf(section: WorksheetSection): string {
  return String(section.type || "").toLowerCase();
}

function isQuestionSection(section: WorksheetSection): boolean {
  return QUESTION_TYPES.has(sectionTypeOf(section));
}

function isExtendedSection(section: WorksheetSection): boolean {
  return EXTENDED_TYPES.has(sectionTypeOf(section));
}

function isChallengeSection(section: WorksheetSection): boolean {
  const t = sectionTypeOf(section);
  return t === "challenge" || t === "q-challenge" || t === "extension";
}

// ─── Deep clone (structuredClone with JSON fallback) ──────────────────────────

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      /* fall through to JSON clone */
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

// ─── Marks adjustment ─────────────────────────────────────────────────────────

/** Scales a numeric mark by `factor`, clamped to a minimum of 1. */
function scaleMark(mark: number, factor: number): number {
  if (!Number.isFinite(mark) || mark <= 0) return mark;
  return Math.max(1, Math.round(mark * factor));
}

/**
 * Rewrites inline "(N marks)" / "(N mark)" tariffs inside a content string by
 * the given factor. Leaves all other text untouched.
 */
function rescaleInlineMarks(content: string, factor: number): string {
  if (!content) return content;
  return content.replace(/\((\d+)\s*(marks?)\)/gi, (_m, n: string, word: string) => {
    const scaled = scaleMark(parseInt(n, 10), factor);
    const unit = scaled === 1 ? "mark" : "marks";
    // Preserve original casing of the word where possible.
    const finalUnit = /MARKS?/.test(word) ? unit.toUpperCase() : unit;
    return `(${scaled} ${finalUnit})`;
  });
}

/** Applies a mark factor to a section's `marks` field and inline tariffs. */
function applyMarkFactor(section: WorksheetSection, factor: number): WorksheetSection {
  const next: WorksheetSection = { ...section };
  if (typeof next.marks === "number") {
    next.marks = scaleMark(next.marks, factor);
  }
  if (typeof next.content === "string") {
    next.content = rescaleInlineMarks(next.content, factor);
  }
  return next;
}

// ─── Language simplification (Foundation) ─────────────────────────────────────

/**
 * Splits long sentences into shorter ones at natural conjunction boundaries,
 * so Foundation pupils read fewer words per sentence. Conservative: only acts
 * on sentences longer than ~15 words and only splits at safe joiners.
 */
function simplifyLanguage(content: string): string {
  if (!content) return content;
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      // Don't touch markers, list items, tables, blanks, or formulae.
      if (
        trimmed === "" ||
        /^[-*•|#>]/.test(trimmed) ||
        /^\d+[.)]/.test(trimmed) ||
        /\[\[/.test(trimmed) ||
        /[=×÷√]/.test(trimmed)
      ) {
        return line;
      }
      const wordCount = trimmed.split(/\s+/).length;
      if (wordCount <= 15) return line;
      // Break at conjunctions: ", and ", ", but ", ", so ", "; " — and
      // capitalise the first letter of each new sentence for readability.
      return line.replace(
        /\s*(?:,\s+(?:and|but|so|because|which|while)|;)\s+([a-z])/gi,
        (_m, nextChar: string) => `. ${nextChar.toUpperCase()}`,
      );
    })
    .join("\n");
}

// ─── Foundation scaffolds ─────────────────────────────────────────────────────

function contentHasMarker(content: string, pattern: RegExp): boolean {
  return content.split("\n").some((l) => pattern.test(l.trim()));
}

/** Adds a scaffold hint line to every question (idempotent). */
function addScaffoldHint(section: WorksheetSection): WorksheetSection {
  const content = String(section.content || "");
  if (contentHasMarker(content, /^\s*(?:💡\s*)?hint\s*:/i) || contentHasMarker(content, /^\s*steps?\s*:/i)) {
    return section;
  }
  const hint = `${HINT_PREFIX} break this into smaller steps. Start with what you already know, then work towards the answer one step at a time.`;
  return { ...section, content: content ? `${content}\n${hint}` : hint };
}

/** Adds a sentence starter to written-response questions (idempotent). */
function addSentenceStarter(section: WorksheetSection): WorksheetSection {
  const content = String(section.content || "");
  if (contentHasMarker(content, /^\s*sentence\s*starter\s*:/i)) return section;
  const starter = `${SENTENCE_STARTER_PREFIX} "I know that ________ because ________."`;
  return { ...section, content: content ? `${content}\n${starter}` : starter };
}

/** Adds a word bank to extended questions, seeded from worksheet vocabulary. */
function addWordBank(section: WorksheetSection, vocabularyTerms: string[]): WorksheetSection {
  const content = String(section.content || "");
  if (contentHasMarker(content, /^\s*word\s*bank\s*:/i)) return section;
  const terms = vocabularyTerms.slice(0, 8);
  const list = terms.length > 0 ? terms.join(" · ") : "key terms from the lesson";
  const wb = `${WORD_BANK_PREFIX} ${list}`;
  return { ...section, content: content ? `${content}\n${wb}` : wb };
}

// ─── Higher transforms ────────────────────────────────────────────────────────

/** Strips every scaffold hint line from a section's content. */
function removeScaffolding(section: WorksheetSection): WorksheetSection {
  const content = String(section.content || "");
  if (!content) return section;
  const cleaned = content
    .split("\n")
    .filter((line) => !SCAFFOLD_LINE_PATTERNS.some((re) => re.test(line.trim())))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { ...section, content: cleaned };
}

/** Appends a reasoning demand to questions that don't already ask for one. */
function addReasoningDemand(section: WorksheetSection): WorksheetSection {
  const content = String(section.content || "");
  if (/\b(explain why|justify|prove|evaluate|to what extent)\b/i.test(content)) {
    return section;
  }
  const demand = "Explain why your answer is correct and justify each step of your reasoning.";
  return { ...section, content: content ? `${content}\n${demand}` : demand };
}

/** Adds a synoptic / cross-topic link to a section (idempotent). */
function addSynopticLink(section: WorksheetSection, topic: string): WorksheetSection {
  const content = String(section.content || "");
  if (contentHasMarker(content, /^\s*synoptic\s*link\s*:/i)) return section;
  const link = `${SYNOPTIC_PREFIX} connect ${topic || "this idea"} to a related topic you have studied and explain how they relate.`;
  return { ...section, content: content ? `${content}\n${link}` : link };
}

// ─── Vocabulary extraction (for Foundation word banks) ────────────────────────

function extractVocabularyTerms(worksheet: GeneratedWorksheet): string[] {
  const vocabSection = (worksheet.sections || []).find(
    (s) => sectionTypeOf(s) === "vocabulary" || sectionTypeOf(s) === "key-terms",
  );
  if (!vocabSection || !vocabSection.content) return [];
  return String(vocabSection.content)
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").split(/[-–—:|]/)[0].trim())
    .filter((t) => t.length > 1 && t.length < 40)
    .slice(0, 10);
}

// ─── Tier builders ────────────────────────────────────────────────────────────

function buildFoundation(standard: GeneratedWorksheet): GeneratedWorksheet {
  const ws = deepClone(standard);
  const vocabularyTerms = extractVocabularyTerms(ws);

  ws.sections = (ws.sections || []).map((section) => {
    if (!isQuestionSection(section)) {
      // Still simplify reading-heavy prose (e.g. worked examples / passages).
      return { ...section, content: simplifyLanguage(String(section.content || "")) };
    }
    let next = applyMarkFactor(section, FOUNDATION_MARK_FACTOR);
    next = { ...next, content: simplifyLanguage(String(next.content || "")) };
    next = addScaffoldHint(next);
    next = addSentenceStarter(next);
    if (isExtendedSection(section)) {
      next = addWordBank(next, vocabularyTerms);
    }
    return next;
  });

  ws.metadata = {
    ...ws.metadata,
    abilityTier: "foundation",
    difficulty: "foundation",
    derivedFromTier: "standard",
    totalMarks: sumMarks(ws.sections),
  } as GeneratedWorksheet["metadata"];

  ws.subtitle = retierSubtitle(ws.subtitle, "Foundation");
  return ws;
}

function buildHigher(standard: GeneratedWorksheet): GeneratedWorksheet {
  const ws = deepClone(standard);
  const topic = String(ws.metadata?.topic || "");

  ws.sections = (ws.sections || []).map((section) => {
    // Remove scaffolding from EVERY section (hints can appear anywhere).
    let next = removeScaffolding(section);
    if (!isQuestionSection(section)) return next;
    next = applyMarkFactor(next, HIGHER_MARK_FACTOR);
    next = addReasoningDemand(next);
    if (isChallengeSection(section) || isExtendedSection(section)) {
      next = addSynopticLink(next, topic);
    }
    return next;
  });

  ws.metadata = {
    ...ws.metadata,
    abilityTier: "higher",
    difficulty: "higher",
    derivedFromTier: "standard",
    totalMarks: sumMarks(ws.sections),
  } as GeneratedWorksheet["metadata"];

  ws.subtitle = retierSubtitle(ws.subtitle, "Higher");
  return ws;
}

function buildStandard(standard: GeneratedWorksheet): GeneratedWorksheet {
  const ws = deepClone(standard);
  ws.metadata = {
    ...ws.metadata,
    abilityTier: ws.metadata?.abilityTier ?? "standard",
  } as GeneratedWorksheet["metadata"];
  return ws;
}

// ─── Small utilities ──────────────────────────────────────────────────────────

function sumMarks(sections: WorksheetSection[] | undefined): number | undefined {
  if (!sections) return undefined;
  const total = sections.reduce((acc, s) => acc + (typeof s.marks === "number" ? s.marks : 0), 0);
  return total > 0 ? total : undefined;
}

/** Replaces an existing tier token in the subtitle, or appends one. */
function retierSubtitle(subtitle: string | undefined, tierLabel: string): string {
  const base = String(subtitle || "");
  if (/\b(Foundation|Standard|Core|Higher)\b/.test(base)) {
    return base.replace(/\b(Foundation|Standard|Core|Higher)\b/, tierLabel);
  }
  return base ? `${base} | ${tierLabel}` : tierLabel;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ThreeTierPack {
  foundation: GeneratedWorksheet;
  standard: GeneratedWorksheet;
  higher: GeneratedWorksheet;
}

/**
 * Produces a Foundation / Standard / Higher pack from a single Standard-tier
 * worksheet. The input is never mutated. All three results share the same
 * sections and topic but differ in scaffolding, marks and reasoning demand.
 *
 * @param standardWorksheet A completed Standard-tier worksheet JSON.
 * @returns `{ foundation, standard, higher }`
 */
export function generateThreeTierPack(standardWorksheet: GeneratedWorksheet): ThreeTierPack {
  if (!standardWorksheet || !Array.isArray(standardWorksheet.sections)) {
    throw new Error("generateThreeTierPack: a worksheet with a sections array is required.");
  }
  return {
    foundation: buildFoundation(standardWorksheet),
    standard: buildStandard(standardWorksheet),
    higher: buildHigher(standardWorksheet),
  };
}

export default generateThreeTierPack;
