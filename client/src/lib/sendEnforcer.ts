/**
 * sendEnforcer.ts
 *
 * Defensive post-processor that runs on the generated worksheet BEFORE the
 * server overlay engine freezes the sections. Its job is to enforce the
 * SEND-specific rules that cannot safely be delegated to the LLM:
 *
 *  - ADHD: every question content starts with '[ ]'; action verb bolded;
 *          hard cap of 3 Section A / 5 Section B; 'BRAIN BREAK' after Q3 of
 *          Section B; challenge labelled 'BONUS — only if you want to!'.
 *  - Dyslexia: strip italic emphasis from question text (bold-only policy).
 *  - Anxiety / PDA / ASC: these are handled by the LLM prompt and server
 *    overlay. The enforcer just renames sections if the LLM forgot.
 *
 * The module exports a single top-level entry point `enforceSendAdaptations`
 * that dispatches to per-need enforcers. It is idempotent — calling it twice
 * on the same input returns the same output.
 *
 * Design note: this module NEVER mutates arithmetic, mark allocations, or
 * diagram markers. It only ever adds/rewrites the leading text of a question
 * string. The server's `assertBaseSectionsPreserved` runs AFTER enforcement,
 * so the post-hash records the enforced state as the base — which is fine
 * because the enforcement is part of generation, not overlay.
 */

import { getSendSectionTitles, resolveSendSpec } from "./sendPromptFragments";

// ─── Types (mirrors the generator's WorksheetSection shape) ──────────────────

interface EnforceableSection {
  id?: string;
  sectionId?: string;
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  marks?: number;
  [key: string]: unknown;
}

interface EnforceableWorksheet {
  title?: string;
  subtitle?: string;
  sections?: EnforceableSection[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─── Question detection ──────────────────────────────────────────────────────
// Worksheets are sometimes structured as one section-per-question (e.g.
// q-short-answer) and sometimes as one section per section-of-questions
// (e.g. a Recall section with 3 bullet questions inside). We enforce at
// BOTH granularities so ADHD's "[ ]" marker always appears next to every
// actual question the pupil sees.

const QUESTION_SECTION_TYPES = new Set([
  "q-short-answer", "q-extended", "q-challenge", "q-free-response", "q-mcq",
  "q-gap-fill", "q-true-false", "q-label-diagram", "q-data-table", "q-graph",
  "q-circuit", "q-draw", "q-ordering", "q-matching", "q-primary-activity",
  "short-answer", "free-response", "guided", "independent", "challenge",
  "section-a", "section-b", "section-c",
  // Canonical Adaptly spec §3.1 types (client/src/lib/worksheet-generator.ts)
  "recall", "understanding", "application",
]);

const NON_QUESTION_TYPES = new Set([
  "header", "learning-objective", "objective", "retrieval", "vocabulary",
  "key-terms", "common-mistakes", "misconceptions", "worked-example", "example",
  "diagram", "diagram-a", "diagram-b", "q-label-diagram",
  "reflection", "self-reflection", "teacher-key", "mark-scheme", "answers",
  "adaptations", "review", "teacher-notes", "extension", "prior-knowledge",
]);

function isQuestionSection(s: EnforceableSection): boolean {
  const t = String(s.type || "").toLowerCase();
  if (NON_QUESTION_TYPES.has(t)) return false;
  if (QUESTION_SECTION_TYPES.has(t)) return true;
  // Fallback: the title contains a question number indicator.
  return /\bq\s*\d|question\s*\d|^[\s]*\d+[\.\)]/i.test(String(s.title || ""));
}

// ─── ADHD: inline '[ ]' + bold action verb ───────────────────────────────────

/**
 * The action verbs we'll bold at the start of a question line.
 * Ordered most-specific first so "Work out" matches before "Work".
 */
const ACTION_VERBS = [
  "Work out", "Show that", "Give one", "Give a", "Write down",
  "Read", "Calculate", "Compute", "Evaluate", "Simplify", "Solve",
  "Factorise", "Factorize", "Expand", "Round", "Estimate", "Convert",
  "Identify", "Classify", "Name", "Label", "List", "Define", "Describe",
  "Explain", "Compare", "Contrast", "Match", "Circle", "Tick",
  "Fill in", "Complete", "Rearrange", "Plot", "Sketch", "Draw",
  "Find", "Determine", "State", "Suggest", "Justify", "Analyse",
];

const ACTION_VERB_RE = new RegExp(
  "^(\\s*)(" +
    ACTION_VERBS.map(v => v.replace(/ /g, "\\s+")).join("|") +
  ")\\b",
  "i"
);

/**
 * Rewrites a single question line so it begins with '[ ] ' and the first
 * action verb is wrapped in markdown **bold**.
 * Idempotent — if the line already starts with '[ ]' and the verb is already
 * bolded, returns it unchanged.
 */
function enforceAdhdLine(line: string): string {
  if (!line || !line.trim()) return line;

  let out = line;

  // Skip lines that are obviously not questions — blank lines, markdown
  // tables, diagram markers, and "Answer:" hints.
  if (/^(\s*\|)|(^\s*\[\[DIAGRAM:)|(^\s*Answer\s*:)/i.test(out)) return out;

  // 1. Prepend '[ ] ' if not already present.
  //    Match checkbox variants: '[ ]', '[x]', '☐', '□', '- [ ]'.
  const hasCheckbox = /^\s*(?:-\s*)?(?:\[\s*[xX]?\s*\]|☐|□)\s+/.test(out);
  if (!hasCheckbox) {
    // Preserve a leading question number ("1.", "Q1.", "2)") but put the
    // checkbox AFTER it so numbering is still first.
    const numMatch = out.match(/^(\s*)((?:Q?\d+[\.\):])\s+)?(.*)$/);
    if (numMatch) {
      out = `${numMatch[1]}${numMatch[2] || ""}[ ] ${numMatch[3]}`;
    } else {
      out = `[ ] ${out}`;
    }
  }

  // 2. Bold the first action verb, if present and not already bolded.
  //    We only bold ONE verb per line (the first one).
  if (!/\*\*[A-Za-z]/.test(out)) {
    out = out.replace(ACTION_VERB_RE, (_m, lead, verb) => `${lead}**${verb}**`);
  }

  return out;
}

/**
 * Enforce ADHD at the CONTENT level: every line of a question section that
 * looks like a question gets the '[ ] ' prefix + bold action verb.
 */
function enforceAdhdOnContent(content: string): string {
  if (!content) return content;

  // Split on newlines, preserve diagram markers intact (they can span lines
  // but are already single-line by our convention — defensive anyway).
  const lines = content.split("\n");
  const processed = lines.map(l => enforceAdhdLine(l));
  return processed.join("\n");
}

/**
 * Hard cap Section A to 3 questions and Section B to 5. We do this by
 * trimming trailing bullet lines inside a section. We never drop mid-line
 * content — only surplus numbered items at the end.
 *
 * Returns a tuple of [capped content, warning message if we had to trim].
 */
function capQuestionCount(content: string, maxQuestions: number): [string, string | null] {
  if (!content) return [content, null];

  const lines = content.split("\n");
  const questionIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Treat a line as a question if it begins with a number + punctuation
    // or a checkbox.
    if (/^\s*(?:\[\s*[xX]?\s*\]\s+)?(?:Q?\d+[\.\):])\s+/.test(l) ||
        /^\s*\[\s*[xX]?\s*\]\s+/.test(l)) {
      questionIndices.push(i);
    }
  }

  if (questionIndices.length <= maxQuestions) return [content, null];

  // Keep the first `maxQuestions` questions plus any leading non-question
  // preamble. Drop everything from the (max+1)-th question onwards.
  const cutoffLine = questionIndices[maxQuestions];
  const kept = lines.slice(0, cutoffLine).join("\n").trimEnd();
  const warning = `ADHD enforcer capped a Section to ${maxQuestions} questions (found ${questionIndices.length}).`;
  return [kept, warning];
}

/**
 * Insert a 'BRAIN BREAK' line after the 3rd question of a section that has
 * 5 questions. Idempotent — never adds a second copy.
 */
function insertBrainBreakMidway(content: string): string {
  if (!content) return content;
  if (/BRAIN\s*BREAK/i.test(content)) return content;

  const lines = content.split("\n");
  const questionIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(?:\[\s*[xX]?\s*\]\s+)?(?:Q?\d+[\.\):])\s+/.test(lines[i])) {
      questionIndices.push(i);
    }
  }
  if (questionIndices.length < 4) return content;

  const midpoint = questionIndices[Math.floor(questionIndices.length / 2) - 1] + 1;
  // Insert the brain break line after the midpoint question line, then a
  // blank line so the next question starts fresh.
  lines.splice(
    midpoint,
    0,
    "",
    "🧠 **BRAIN BREAK — stand up and stretch for 30 seconds before continuing!**",
    ""
  );
  return lines.join("\n");
}

function sectionLooksLikeSectionA(s: EnforceableSection): boolean {
  const title = String(s.title || "").toLowerCase();
  const type = String(s.type || "").toLowerCase();
  return (
    /section\s*a\b/.test(title) ||
    /warm[\s-]?up/.test(title) ||
    /quick\s*start/.test(title) ||
    type === "section-a" ||
    type === "guided" ||
    type === "recall"
  );
}

function sectionLooksLikeSectionB(s: EnforceableSection): boolean {
  const title = String(s.title || "").toLowerCase();
  const type = String(s.type || "").toLowerCase();
  return (
    /section\s*b\b/.test(title) ||
    /main\s*practice/.test(title) ||
    type === "section-b" ||
    type === "independent" ||
    type === "understanding" ||
    type === "application"
  );
}

function sectionLooksLikeChallenge(s: EnforceableSection): boolean {
  const title = String(s.title || "").toLowerCase();
  const type = String(s.type || "").toLowerCase();
  return (
    /challenge|bonus|secret\s*mission/.test(title) ||
    type === "challenge" ||
    type === "q-challenge"
  );
}

/** ADHD end-to-end enforcer. */
function enforceAdhd(
  ws: EnforceableWorksheet,
  preserveStems: boolean,
): { worksheet: EnforceableWorksheet; warnings: string[] } {
  const warnings: string[] = [];
  const sectionTitles = getSendSectionTitles("adhd");

  const sections = (ws.sections || []).map((s): EnforceableSection => {
    if (s.teacherOnly) return s;

    let content = String(s.content || "");
    let title = String(s.title || "");

    // Rename canonical sections to the agreed ADHD titles so the overlay
    // engine and the renderer can find them.
    // (Section-title rewrites are ADDITIVE — they never touch question content
    // — so we apply them in both rewrite and preserve-stem modes.)
    if (sectionLooksLikeSectionA(s) && !title.includes("Quick Start")) {
      title = sectionTitles.sectionA;
    } else if (sectionLooksLikeSectionB(s) && !title.includes("Main Practice")) {
      title = sectionTitles.sectionB;
    } else if (sectionLooksLikeChallenge(s) && !/BONUS/i.test(title)) {
      title = sectionTitles.challenge;
    }

    // Stem-preserving guard: under exam-style Y9+, SEND adaptations must
    // never mutate question stems — checkbox prefixes, action-verb bolding,
    // section caps, and BRAIN BREAK insertion all rewrite question content,
    // so we skip them. Renaming the section title (above) is the only
    // permitted ADHD adjustment in this mode.
    if (preserveStems) {
      return { ...s, title, content };
    }

    if (isQuestionSection(s) || sectionLooksLikeSectionA(s) || sectionLooksLikeSectionB(s)) {
      // 1. Hard cap — Phase 1 update: Section 1 = 6 questions, Section 2 = 8 questions.
      // (Old caps of 3/5 were for the legacy 3-question-per-section structure.)
      if (sectionLooksLikeSectionA(s)) {
        const [capped, warn] = capQuestionCount(content, 6);
        content = capped;
        if (warn) warnings.push(warn);
      } else if (sectionLooksLikeSectionB(s)) {
        const [capped, warn] = capQuestionCount(content, 8);
        content = capped;
        if (warn) warnings.push(warn);
      }

      // 2. Inline '[ ]' + bold action verb on every question line
      content = enforceAdhdOnContent(content);

      // 3. Brain break after Q3 in Section B
      if (sectionLooksLikeSectionB(s)) {
        content = insertBrainBreakMidway(content);
      }
    }

    return { ...s, title, content };
  });

  return {
    worksheet: { ...ws, sections },
    warnings,
  };
}

// ─── Dyslexia: strip italic emphasis ────────────────────────────────────────
// Dyslexia spec says "Bold for emphasis — avoid italics and underlining". We
// cannot rewrite inside diagram specs or answer keys, but inside question
// content we convert italic *foo* to plain text and keep **bold** as-is.

function enforceDyslexia(
  ws: EnforceableWorksheet,
  preserveStems: boolean,
): { worksheet: EnforceableWorksheet; warnings: string[] } {
  // Stripping italic emphasis IS a stem mutation — even if mostly cosmetic —
  // so under preserve-stem mode we leave the LLM's output untouched.
  if (preserveStems) {
    return { worksheet: ws, warnings: [] };
  }
  const sections = (ws.sections || []).map((s): EnforceableSection => {
    if (s.teacherOnly) return s;
    if (!isQuestionSection(s)) return s;
    const content = String(s.content || "");
    // Only strip single-asterisk italics — keep double-asterisk bold intact.
    const stripped = content.replace(/(^|[^*])\*(?!\*)([^*\n]+?)\*(?!\*)/g, "$1$2");
    return { ...s, content: stripped };
  });
  return { worksheet: { ...ws, sections }, warnings: [] };
}

// ─── Top-level dispatcher ────────────────────────────────────────────────────

export interface SendEnforcementResult {
  worksheet: EnforceableWorksheet;
  warnings: string[];
  enforcedFor: string | null;
  /** Whether the enforcer ran in stem-preserving mode (no question-content mutations). */
  preserveStems: boolean;
}

/**
 * Optional flags that change how aggressively the enforcer rewrites content.
 *
 *  - `preserveStems`: when true, the enforcer is forbidden from touching any
 *    student-facing question text. Section TITLE renames are still applied
 *    (they are presentation-only) but ADHD checkbox prefixes, action-verb
 *    bolding, hard caps, BRAIN BREAK insertion, and dyslexia italic stripping
 *    are all skipped. Used for exam-style Y9+ sheets where the academic
 *    rigour of the stem must remain byte-identical to the un-adapted version.
 */
export interface SendEnforcementOptions {
  preserveStems?: boolean;
}

/**
 * Runs the defensive SEND enforcers on a freshly-generated worksheet.
 *
 * The function is a no-op when no SEND need is supplied, or when the SEND
 * need does not map to a known spec.
 */
export function enforceSendAdaptations(
  worksheet: EnforceableWorksheet,
  sendNeed: string | undefined | null,
  options: SendEnforcementOptions = {},
): SendEnforcementResult {
  const preserveStems = Boolean(options.preserveStems);
  const spec = resolveSendSpec(sendNeed);
  if (!spec) {
    return { worksheet, warnings: [], enforcedFor: null, preserveStems };
  }

  let out: EnforceableWorksheet = worksheet;
  const warnings: string[] = [];

  // Dispatch by canonical id (resolveSendSpec already normalised it).
  if (spec.id === "adhd") {
    const r = enforceAdhd(out, preserveStems);
    out = r.worksheet;
    warnings.push(...r.warnings);
  } else if (spec.id === "dyslexia") {
    const r = enforceDyslexia(out, preserveStems);
    out = r.worksheet;
    warnings.push(...r.warnings);
  }
  // Other SEND needs are enforced purely via prompt + server overlay.

  // Record the enforcement in metadata for traceability (spec §31).
  // FIX-SEND-02: Also stamp the canonical sendNeed and sendNeedId so that
  // the renderer, footer, and audit tools all read a consistent value
  // regardless of what the LLM returned in its metadata block.
  out = {
    ...out,
    metadata: {
      ...(out.metadata || {}),
      sendNeed: spec.id,
      sendNeedId: spec.id,
      sendEnforcerApplied: spec.id,
      sendEnforcerWarnings: warnings,
      sendEnforcerPreserveStems: preserveStems,
    },
  };

  return { worksheet: out, warnings, enforcedFor: spec.id, preserveStems };
}
