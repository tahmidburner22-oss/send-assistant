/**
 * worksheetPostValidator.ts
 *
 * Deterministic post-generation validators that run on the parsed worksheet
 * JSON *before* the SEND enforcer and overlay engine see it. Their job is to
 * catch the specific content bugs teachers flagged in live scrutiny reviews
 * and fix them reliably rather than relying on the LLM to obey every prompt
 * rule.
 *
 * Every validator is:
 *   - Pure (takes a worksheet, returns a new worksheet — no mutation)
 *   - Idempotent (running twice is the same as running once)
 *   - Conservative (never deletes content the LLM generated correctly)
 *   - Observable (appends a human-readable warning for every fix applied)
 *
 * Warnings are kept on worksheet.metadata.postValidatorWarnings so they show
 * up in the developer console and the teacher-facing "adaptations" panel
 * without blocking the worksheet from rendering.
 *
 * Validators included:
 *   1. enforceSingleMcqCorrect — MCQ blocks: at most one ✓ per question.
 *   2. dedupeWordBank          — Gap-fill word banks: each word appears once,
 *                                max 10 words.
 *   3. stripForeignDiagrams    — Science worksheets: remove diagrams from
 *                                other subjects (computing / algorithms /
 *                                binary representation, etc.).
 *   4. enforceYearGroupLock    — Strip any explicit year-group reference in
 *                                headings / body content that disagrees with
 *                                the worksheet's own year group.
 *   5. capWorkedExampleSteps   — Worked examples: at most 5 numbered / bullet
 *                                steps; later steps are clipped.
 */

import { reconcileMarkScheme } from "./markSchemeReconciler";
import {
  SECTION_QUESTION_TARGETS,
  getSectionQuestionRange,
} from "./worksheetSectionTargets";
import {
  getSpecPoints,
  getSpecPointsAcrossBoards,
  matchSpecPoint,
  type ExamBoard as TaxonomyExamBoard,
} from "./specPointTaxonomy";
import {
  buildSelfReflection,
  renderSelfReflectionAsMarkerBlock,
  isGenericSelfReflection,
} from "./selfReflectionBuilder";

// Phase 3 — Revision Tips. Single source of truth for the examiner-
// voice 5-tip panel. The validator below uses these helpers to detect
// generic / off-topic AI output and rewrite it deterministically.
import {
  buildRevisionTips,
  renderRevisionTipsAsMarkerBlock,
  isGenericRevisionTips,
} from "./revisionTipsBuilder";

// Phase 5 — Curriculum-authority invariants. Pure helpers from the
// curriculum-authority module: silent US → UK English rewriter
// (idempotent), banned-softener detector (warn only — silent rewrite
// would paper over a real generation failure), fabricated-AO-code
// detector (UK awarding bodies use AO1–AO4 only), placeholder-leakage
// detector. Used by enforceCurriculumAuthorityInvariants below.
import {
  applyUKEnglishSubstitutions,
  findBannedSofteners,
  findFabricatedAoCodes,
  findPlaceholderLeakage,
} from "./curriculumAuthorityPrompt";

export interface PostValidatorSection {
  id?: string;
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  imageUrl?: string;
  assetRef?: string;
  svg?: string;
  caption?: string;
  [key: string]: unknown;
}

export interface PostValidatorWorksheet {
  title?: string;
  subtitle?: string;
  sections?: PostValidatorSection[];
  metadata?: Record<string, unknown> & {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    postValidatorWarnings?: string[];
    /** FEAT-PB7 — per-MCQ misconception linkage (one entry per diagnosed distractor). */
    misconceptionLinks?: PostValidatorMisconceptionLink[];
  };
  [key: string]: unknown;
}

/**
 * One link between a specific MCQ distractor and the misconception it
 * diagnoses. Populated deterministically by extractMisconceptionLinks
 * from `TEACHER_DIAGNOSES: A=m-id, …` markers the LLM is asked to emit.
 */
export interface PostValidatorMisconceptionLink {
  /** 0-based index into worksheet.sections. */
  sectionIndex: number;
  /** Section title at extraction time (helpful in teacher views). */
  sectionTitle?: string;
  /** Distractor option letter (A | B | C | D | …). Upper-case, single char. */
  distractor: string;
  /** Misconception bank id, e.g. "m-frac-01". Lower-case. */
  misconceptionId: string;
}

export interface PostValidatorOptions {
  /** Subject string exactly as submitted to the generator. */
  subject?: string;
  /** Year group string exactly as submitted. */
  yearGroup?: string;
  /** SEND need/profile exactly as submitted, when available. */
  sendNeed?: string;
  /** Phase 1 — Awarding-body code (aqa | edexcel | ocr | wjec | ccea | …)
   *  exactly as submitted to the generator. Used by enforceSpecAnchorPresence
   *  to look up the published spec-point taxonomy and best-match unverified
   *  specRef strings. Empty / unknown boards trigger the cross-board union
   *  fallback. */
  examBoard?: string;
  /** Phase 2 — Topic exactly as submitted to the generator (e.g. "Adding
   *  fractions", "Macbeth Act 1 Scene 5"). Used by
   *  enforceSelfReflectionTopicAnchor to (a) detect when the AI emitted
   *  generic placeholder reflection content that doesn't name the topic,
   *  and (b) pass into selfReflectionBuilder when the section content has
   *  to be rebuilt deterministically. Falls back to ws.metadata.topic when
   *  not supplied. */
  topic?: string;
}

export interface PostValidatorResult {
  worksheet: PostValidatorWorksheet;
  warnings: string[];
}

// ─── Subject detection ───────────────────────────────────────────────────────

function isScienceSubject(subject: string | undefined): boolean {
  const s = (subject || "").toLowerCase();
  return (
    s.includes("science") ||
    s.includes("biology") ||
    s.includes("chemistry") ||
    s.includes("physics")
  );
}

function isMathsSubject(subject: string | undefined): boolean {
  const s = (subject || "").toLowerCase();
  return s.includes("math");
}

// ─── 1. MCQ single-correct enforcer ──────────────────────────────────────────
// Teacher feedback: the Science worksheet had multiple pre-ticked answers.
// Fix: when a question content string contains more than one ✓ at the end of
// MCQ option lines, keep only the first and strip the rest. Also strip any
// meta line like "CORRECT: B" that accidentally leaks into student-facing
// content.

const MCQ_OPTION_LINE = /^\s*[A-D][\s.)]/;
const MCQ_TICK_RE = /\s*[✓✔]\s*$/;

export function enforceSingleMcqCorrect(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    if (s.teacherOnly) return s;
    const type = String(s.type || "").toLowerCase();
    if (type !== "q-mcq" && type !== "mcq") return s;
    const content = String(s.content || "");
    if (!content) return s;

    const lines = content.split("\n");
    let tickedSoFar = 0;
    const newLines: string[] = [];
    for (const raw of lines) {
      // Strip any leaked "CORRECT: X" / "ANSWER: X" meta line — those belong
      // in the teacher key, never in the student-facing content.
      if (/^\s*(correct|answer|mark)\s*:/i.test(raw)) {
        warnings.push("Stripped leaked mark-scheme meta line from MCQ student content.");
        continue;
      }
      if (MCQ_OPTION_LINE.test(raw) && MCQ_TICK_RE.test(raw)) {
        tickedSoFar++;
        if (tickedSoFar > 1) {
          warnings.push("Removed a second ✓ from MCQ options (only one correct answer allowed).");
          newLines.push(raw.replace(MCQ_TICK_RE, ""));
          continue;
        }
      }
      newLines.push(raw);
    }
    return { ...s, content: newLines.join("\n") };
  });

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── 2. Word bank dedupe + cap ───────────────────────────────────────────────
// Teacher feedback: the Science gap-fill word bank included duplicates
// ("energy", "push", "pull" appeared twice). Fix: parse the WORD BANK or
// ANSWER BOX line, split on | , / or comma, drop case-insensitive duplicates,
// cap at 10 entries.

export function dedupeWordBank(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    if (s.teacherOnly) return s;
    const type = String(s.type || "").toLowerCase();
    if (type !== "q-gap-fill" && type !== "gap-fill") return s;
    const content = String(s.content || "");
    if (!content) return s;

    // Match "WORD BANK: a | b | c" or "ANSWER BOX: a | b | c"
    const re = /^(WORD\s*BANK|ANSWER\s*BOX)\s*:\s*(.+)$/gim;
    let changed = false;
    const newContent = content.replace(re, (_match, label, payload) => {
      const parts = String(payload)
        .split(/\s*[|,/]\s*/)
        .map(p => p.trim())
        .filter(Boolean);
      const seen = new Set<string>();
      const deduped: string[] = [];
      for (const p of parts) {
        const key = p.toLowerCase();
        if (seen.has(key)) {
          changed = true;
          continue;
        }
        seen.add(key);
        deduped.push(p);
      }
      const capped = deduped.slice(0, 10);
      if (capped.length < deduped.length) {
        changed = true;
      }
      return `${String(label).toUpperCase()}: ${capped.join(" | ")}`;
    });

    if (changed) {
      warnings.push("De-duplicated and capped word bank / answer box to 10 unique entries.");
    }
    return { ...s, content: newContent };
  });

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── 3. Science diagram subject-lock ─────────────────────────────────────────
// Teacher feedback: the Science worksheet had irrelevant computing diagrams.
// Fix: if the worksheet subject is science/biology/chemistry/physics, remove
// any diagram section whose type/title/content references a foreign subject
// or whose embedded [[DIAGRAM:...]] spec names a computing-only type.

const FOREIGN_DIAGRAM_TOKENS = [
  // Computing / CS diagrams
  "computer-architecture", "computer_architecture", "big-o", "big_o",
  "binary-representation", "binary_representation", "algorithm-flowchart",
  "ascii", "von neumann", "opcode", "compiler", "interpreter",
  "pseudocode", "flowchart-computing", "network-topology", "osi-model",
];

export function stripForeignDiagrams(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const subject = opts.subject || String(ws.metadata?.subject || "");
  if (!isScienceSubject(subject)) {
    return { worksheet: ws, warnings };
  }

  const hasForeignToken = (text: string): boolean => {
    const lower = text.toLowerCase();
    return FOREIGN_DIAGRAM_TOKENS.some(t => lower.includes(t));
  };

  const sections = (ws.sections || []).filter((s): boolean => {
    const type = String(s.type || "").toLowerCase();
    if (type !== "diagram" && type !== "diagram-a" && type !== "diagram-b") return true;
    const haystack = [
      String(s.title || ""),
      String(s.content || ""),
      String(s.caption || ""),
      String(s.assetRef || ""),
      String((s as any).diagramType || ""),
      String((s as any).diagramId || ""),
      String((s as any).kind || ""),
    ].join(" ");
    if (hasForeignToken(haystack)) {
      warnings.push(`Removed foreign diagram "${String(s.title || s.id || "").slice(0, 50)}" from science worksheet.`);
      return false;
    }
    return true;
  });

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── 3b. Empty / unresolved diagram placeholder removal ───────────────────────
// Live verification found that an unresolved diagram-library lookup can still
// produce a learner-visible section whose title/content/caption effectively read
// "Diagram None". If there is no usable image/SVG/asset marker, remove the
// placeholder section entirely rather than rendering a broken diagram block.

function isDiagramSectionType(type: string): boolean {
  const t = type.toLowerCase();
  return t === "diagram" || t === "diagram-a" || t === "diagram-b" || t.startsWith("diagram-") || t.includes("diagram");
}

function normaliseDiagramPlaceholderText(text: string | undefined): string {
  return String(text || "")
    .replace(/\[\[DIAGRAM:\{[\s\S]*?\}\]\]/g, "")
    .replace(/[—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isPlaceholderDiagramText(text: string | undefined): boolean {
  const normalised = normaliseDiagramPlaceholderText(text);
  if (!normalised) return true;
  return /^(?:diagram\s*)?(?:none|null|undefined|n\/a|not available|no diagram|unavailable)$/i.test(normalised)
    || /^diagram\s+(?:none|null|undefined|n\/a|not available)$/i.test(normalised);
}

function isGenericDiagramTitle(text: string | undefined): boolean {
  const normalised = normaliseDiagramPlaceholderText(text);
  return !normalised || /^diagram(?:\s+[a-z])?$/.test(normalised);
}

export function stripEmptyDiagramPlaceholders(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = (ws.sections || []).filter((s): boolean => {
    const type = String(s.type || "").toLowerCase();
    if (!isDiagramSectionType(type)) return true;

    const visualFields = [s.svg, s.imageUrl, (s as any).diagramImageUrl, (s as any).diagramSvg, (s as any).image, s.assetRef, (s as any).assetUrl];
    const hasRealVisual = visualFields.some(value => {
      const text = String(value || "").trim();
      return Boolean(text) && !isPlaceholderDiagramText(text);
    });
    if (hasRealVisual) return true;

    const title = String(s.title || "");
    const content = String(s.content || "");
    const caption = String(s.caption || "");
    const allPlaceholder = [title, content, caption].every(value => isPlaceholderDiagramText(value));
    const genericTitleWithNoPayload = isGenericDiagramTitle(title) && isPlaceholderDiagramText(content) && isPlaceholderDiagramText(caption);
    const placeholderHeaderWithDiagramQuestions = isPlaceholderDiagramText(title) && isPlaceholderDiagramText(caption) && /\bdiagram\b/i.test(content);
    const unresolvedDiagramQuestion = type.includes("diagram") && isPlaceholderDiagramText(caption) && /\bdiagram\b/i.test(content);
    const joinedPlaceholder = isPlaceholderDiagramText([title, content, caption].filter(Boolean).join(" "));

    if (allPlaceholder || genericTitleWithNoPayload || placeholderHeaderWithDiagramQuestions || unresolvedDiagramQuestion || joinedPlaceholder) {
      warnings.push("Removed unresolved diagram placeholder section before rendering/export.");
      return false;
    }
    return true;
  });

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── 4. Year-group lock ──────────────────────────────────────────────────────
// Teacher feedback: the Maths worksheet mixed "Year 11" and "Year 9" in
// different places. Fix: any reference to a DIFFERENT year group in a
// heading or body sentence is replaced with the worksheet's declared year.
// We only rewrite the standard "Year N" or "YrN" forms; we never touch
// LaTeX / math expressions.

export function enforceYearGroupLock(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const yearGroup = opts.yearGroup || String(ws.metadata?.yearGroup || "").trim();
  if (!yearGroup) return { worksheet: ws, warnings };

  const declaredYearNum = parseInt(yearGroup.replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(declaredYearNum)) return { worksheet: ws, warnings };

  const re = /\bYear\s*([0-9]{1,2})\b/g;

  const rewrite = (text: string | undefined): string | undefined => {
    if (!text) return text;
    let rewritten = text;
    rewritten = rewritten.replace(re, (match, capturedYear) => {
      const n = parseInt(capturedYear, 10);
      if (!Number.isFinite(n)) return match;
      if (n !== declaredYearNum) {
        warnings.push(`Rewrote stray "Year ${n}" reference to "${yearGroup}" for year-group consistency.`);
        return yearGroup;
      }
      return match;
    });
    return rewritten;
  };

  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    return {
      ...s,
      title: rewrite(s.title as string | undefined),
      content: rewrite(s.content as string | undefined),
    };
  });

  return { worksheet: { ...ws, sections, title: rewrite(ws.title), subtitle: rewrite(ws.subtitle) }, warnings };
}

// ─── 5. Worked-example step cap ──────────────────────────────────────────────
// Teacher feedback: the Maths worked example was overlong and narrative.
// Fix: if the worked example has more than 5 numbered / bulleted steps,
// keep only the first 5. We only clip the steps themselves — the intro,
// worked question line, and "✓ Key point" footer are preserved.

const STEP_LINE_RE = /^\s*(?:Step\s*\d+[:.\)]|[0-9]+[.\)]|[-•])\s+/i;

export function capWorkedExampleSteps(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const isMaths = isMathsSubject(opts.subject || String(ws.metadata?.subject || ""));
  // Maths uses a strict 4-step cap (matches the mixed-number rule); everyone
  // else uses 5.
  const MAX_STEPS = isMaths ? 4 : 5;

  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    const type = String(s.type || "").toLowerCase();
    if (type !== "example" && type !== "worked-example" && type !== "q-worked-example") return s;
    const content = String(s.content || "");
    if (!content) return s;

    const lines = content.split("\n");
    let stepCount = 0;
    let cappedAt = -1;
    for (let i = 0; i < lines.length; i++) {
      if (STEP_LINE_RE.test(lines[i])) {
        stepCount++;
        if (stepCount > MAX_STEPS && cappedAt === -1) cappedAt = i;
      }
    }
    if (cappedAt === -1) return s;

    // Keep everything up to and including the MAX_STEPS-th step, then keep
    // any trailing non-step lines (e.g. "✓ Key point:", "Answer:") that come
    // AFTER the last step we kept and were BEFORE the extra steps — in
    // practice the key-point line usually appears at the very end of the
    // content, so we look for it and re-append it at the bottom.
    const kept = lines.slice(0, cappedAt);
    const trailer = lines.slice(cappedAt).filter(l =>
      /^\s*(✓|✔|Answer\s*:|Key\s*point|\u2713)/i.test(l)
    );
    const newLines = [...kept, ...trailer];
    warnings.push(`Capped worked example to ${MAX_STEPS} steps (had ${stepCount}).`);
    return { ...s, content: newLines.join("\n").trimEnd() };
  });

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── 6. Leaked generator-instruction sanitiser ───────────────────────────────
// Live testing found that prompt/schema instructions such as "RULE: EXACTLY..."
// and bracketed "[Write EXACTLY...]" text can leak into student-facing sections.
// These lines are not learning content, so remove them before rendering/export.

const LEAKED_INSTRUCTION_LINE_RE = /^\s*(?:(?:CRITICAL\s+)?(?:FORMATTING\s+)?RULE|INSTRUCTION|FORMAT|OUTPUT|SCHEMA|CONSTRAINT|CRITICAL|IMPORTANT)\s*:/i;
const LEAKED_BRACKET_BLOCK_RE = /\[[^\]\n]*(?:EXACTLY|MUST|Do NOT|continue for|correct answers|plausible distractors|word\d+|Result:)[^\]\n]*\]/gi;
const LEAKED_PHRASE_RE = /\b(?:Return EXACTLY this JSON|raw JSON only|no markdown fences|follow this EXACTLY)\b/i;
const LEAKED_INLINE_INSTRUCTION_RE = /\b(?:(?:CRITICAL\s+)?FORMATTING\s+RULE|CRITICAL\s+RULE|RULE|INSTRUCTION|OUTPUT\s+RULE)\s*:\s*(?:You\s+MUST|MUST|EXACTLY|Do\s+NOT|Return|Write|Use|Include|Only)[^\n.!?]*(?:[.!?]|$)/gi;

function cleanLeakedGeneratorInstructions(content: string): { content: string; changed: boolean } {
  let changed = false;
  const lines = content.split("\n");
  const kept: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (LEAKED_INSTRUCTION_LINE_RE.test(line) || LEAKED_PHRASE_RE.test(line)) {
      changed = true;
      continue;
    }
    const cleaned = raw
      .replace(LEAKED_BRACKET_BLOCK_RE, "")
      .replace(LEAKED_INLINE_INSTRUCTION_RE, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([?.!,;:])/g, "$1")
      .trimEnd();
    if (cleaned !== raw) changed = true;
    if (cleaned.trim().length > 0) kept.push(cleaned);
  }

  return { content: kept.join("\n").trim(), changed };
}

export function stripLeakedGeneratorInstructions(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  const cleanField = (value: unknown): { value: unknown; changed: boolean } => {
    if (typeof value !== "string" || !value.trim()) return { value, changed: false };
    const cleaned = cleanLeakedGeneratorInstructions(value);
    return { value: cleaned.content, changed: cleaned.changed };
  };

  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    if (s.teacherOnly) return s;
    let changed = false;
    const next: any = { ...s };

    for (const key of ["title", "subtitle", "content", "prompt", "question", "text", "stem", "caption"]) {
      const cleaned = cleanField(next[key]);
      if (cleaned.changed) {
        next[key] = cleaned.value;
        changed = true;
      }
    }

    if (Array.isArray(next.questions)) {
      next.questions = next.questions.map((q: any) => {
        if (!q || typeof q !== "object") return q;
        const nq = { ...q };
        for (const key of ["text", "prompt", "question", "stem", "content", "answer", "feedback"]) {
          const cleaned = cleanField(nq[key]);
          if (cleaned.changed) {
            nq[key] = cleaned.value;
            changed = true;
          }
        }
        if (Array.isArray(nq.options)) {
          nq.options = nq.options.map((o: any) => {
            const cleaned = cleanField(o);
            if (cleaned.changed) changed = true;
            return cleaned.value;
          });
        }
        return nq;
      });
    }

    if (!changed) return s;
    warnings.push(`Stripped leaked generator instructions from ${String(s.type || "worksheet")} section.`);
    return next as PostValidatorSection;
  });
  return { worksheet: { ...ws, sections }, warnings };
}

// ─── 7. Dyscalculia maths scaffold reinforcement ─────────────────────────────
// Generic "show your working" is too vague for dyscalculia. Add a short,
// concrete checklist to maths questions when a dyscalculia profile is selected.

function isDyscalculiaNeed(sendNeed: string | undefined): boolean {
  return /dyscalcul/i.test(sendNeed || "");
}

const MATHS_QUESTION_TYPES = new Set([
  "q-short-answer", "q-extended", "q-data-table", "q-challenge", "q-graph", "q-mcq", "q-gap-fill",
]);

export function reinforceDyscalculiaMathsScaffolding(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const subject = opts.subject || String(ws.metadata?.subject || "");
  if (!isMathsSubject(subject) || !isDyscalculiaNeed(opts.sendNeed)) {
    return { worksheet: ws, warnings };
  }

  let changedCount = 0;
  const scaffold = "\nScaffold: 1) Underline the numbers. 2) Choose the operation. 3) Estimate first. 4) Use a number line or place-value grid if helpful. 5) Write one step per line.";
  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    const type = String(s.type || "").toLowerCase();
    const content = String(s.content || "");
    if (s.teacherOnly || !MATHS_QUESTION_TYPES.has(type) || !content.trim()) return s;
    if (/number line|place-value|place value|one step per line|estimate first/i.test(content)) return s;

    const updated = content
      .replace(/\bshow all (?:of )?your working\b[.!]?/gi, "Show one step per line.")
      .replace(/\bshow all working\b[.!]?/gi, "Show one step per line.")
      .trimEnd() + scaffold;
    if (updated !== content) changedCount++;
    return { ...s, content: updated };
  });

  if (changedCount > 0) warnings.push(`Added dyscalculia maths working scaffold to ${changedCount} question section(s).`);
  return { worksheet: { ...ws, sections }, warnings };
}

// ─── 8. Per-MCQ misconception linkage (FEAT-PB7) ─────────────────────────────
// The misconception-bank prompt asks the LLM to append a single teacher-only
// marker line to each MCQ whose distractors target a known pupil error:
//
//   TEACHER_DIAGNOSES: A=m-frac-02, C=m-frac-01
//
// This validator parses those markers, deduplicates them, lifts them onto
// `metadata.misconceptionLinks` as structured records, and strips the marker
// line from the section's content so it never reaches the pupil. Pure +
// idempotent — running twice yields the same metadata array and an unchanged
// content string on the second pass.

const TEACHER_DIAGNOSES_LINE_RE = /^\s*TEACHER[_\s]?DIAGNOSES\s*:\s*(.+?)\s*$/im;
const TEACHER_DIAGNOSES_PAIR_RE = /\b([A-Da-d])\s*=\s*(m-[a-z0-9-]{2,})\b/g;

export function extractMisconceptionLinks(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  const collected: PostValidatorMisconceptionLink[] = [];
  // Preserve any links already present (idempotent re-runs) so we can
  // dedupe against them rather than blindly re-appending.
  const existing = Array.isArray(ws.metadata?.misconceptionLinks)
    ? (ws.metadata!.misconceptionLinks as PostValidatorMisconceptionLink[])
    : [];
  const seen = new Set<string>();
  const keyFor = (l: PostValidatorMisconceptionLink) =>
    `${l.sectionIndex}|${l.distractor}|${l.misconceptionId}`;
  for (const l of existing) seen.add(keyFor(l));

  const sections = (ws.sections || []).map((s, idx): PostValidatorSection => {
    const type = String(s.type || "").toLowerCase();
    if (type !== "q-mcq" && type !== "mcq") return s;
    const content = String(s.content || "");
    if (!content) return s;

    const lineMatch = content.match(TEACHER_DIAGNOSES_LINE_RE);
    if (!lineMatch) return s;

    // Parse pairs from the marker line. Reset the regex state because it has
    // the `g` flag.
    TEACHER_DIAGNOSES_PAIR_RE.lastIndex = 0;
    let pair: RegExpExecArray | null;
    let foundAny = false;
    while ((pair = TEACHER_DIAGNOSES_PAIR_RE.exec(lineMatch[1])) !== null) {
      foundAny = true;
      const link: PostValidatorMisconceptionLink = {
        sectionIndex: idx,
        sectionTitle: typeof s.title === "string" ? s.title : undefined,
        distractor: pair[1].toUpperCase(),
        misconceptionId: pair[2].toLowerCase(),
      };
      const k = keyFor(link);
      if (!seen.has(k)) {
        seen.add(k);
        collected.push(link);
      }
    }

    if (!foundAny) {
      // Marker line present but unparseable — strip it so it doesn't reach
      // pupils, but record a warning for diagnostics.
      warnings.push(`Stripped malformed TEACHER_DIAGNOSES line from MCQ at section ${idx}.`);
    }

    // Strip the marker line from student-visible content regardless. It is
    // teacher-only data; the parsed links live on metadata.misconceptionLinks
    // and are surfaced by the renderer's teacher view.
    const cleaned = content
      .split("\n")
      .filter((ln) => !TEACHER_DIAGNOSES_LINE_RE.test(ln))
      .join("\n")
      .trimEnd();
    return { ...s, content: cleaned };
  });

  if (collected.length > 0) {
    warnings.push(`Linked ${collected.length} MCQ distractor(s) to misconception bank entries.`);
  }

  // Always re-stamp the merged misconceptionLinks array (even if no new ones
  // were extracted) so the shape is stable for downstream consumers.
  const mergedLinks = [...existing, ...collected];
  return {
    worksheet: {
      ...ws,
      sections,
      metadata: {
        ...(ws.metadata || {}),
        misconceptionLinks: mergedLinks,
      },
    },
    warnings,
  };
}

function stripVisiblePlaceholdersAndAnswerLeakage(ws: PostValidatorWorksheet): PostValidatorResult {
  const warnings: string[] = [];
  const PLACEHOLDER_RE = /\[(?:specific|plausible|correct answer|incorrect option|continue|word\d+|point \d+|name of mistake|explanation|short|realistic|final answer|first step|second step|third step|key point|statement about|.*?placeholder.*?).*?\]/gi;
  const CORRECT_ANSWER_HINT_RE = /\s*(?:✓|✔|\(correct\)|correct answer|mark with\s*[✓✔])\s*$/i;

  const cleanText = (value: unknown): string => {
    let text = String(value ?? "");
    const before = text;
    text = text
      .replace(PLACEHOLDER_RE, "")
      .replace(LEAKED_BRACKET_BLOCK_RE, "")
      .replace(LEAKED_INLINE_INSTRUCTION_RE, "")
      .replace(/^\s*[✓✔]\s*(?=Key\s+point\b)/gim, "Key point: ");
    text = text
      .split("\n")
      .map(line => {
        if (/^\s*[A-D][\).\s]/.test(line)) return line.replace(CORRECT_ANSWER_HINT_RE, "").trimEnd();
        return line;
      })
      .join("\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text !== before) warnings.push("Removed visible placeholders or student-facing answer hints from generated content.");
    return text || String(value ?? "");
  };

  const sections = (ws.sections || []).map((section: any) => {
    if (!section || section.teacherOnly || section.type === "answers" || section.type === "mark-scheme") return section;
    const next = { ...section };
    if (typeof next.content === "string") next.content = cleanText(next.content);
    if (Array.isArray(next.questions)) {
      next.questions = next.questions.map((q: any) => {
        if (!q || typeof q !== "object") return q;
        const nq = { ...q };
        for (const key of ["text", "prompt", "question", "stem", "content"]) {
          if (typeof nq[key] === "string") nq[key] = cleanText(nq[key]);
        }
        if (Array.isArray(nq.options)) nq.options = nq.options.map((o: any) => typeof o === "string" ? cleanText(o) : o);
        return nq;
      });
    }
    return next;
  });

  return { worksheet: { ...ws, sections }, warnings };
}



// ─── Phase 1 / curriculum-aligned structure ─────────────────────────────────

/**
 * Returns the section group ("recall" | "understanding" | "application" |
 * "challenge") a worksheet section belongs to, by inferring the question
 * number from the explicit `questionNumber` field, then the section title
 * (matches `Q\d+` patterns), then the section type (`challenge`).
 *
 * Returns null for non-question sections (header, vocabulary, worked-example,
 * diagram-a, diagram-b, retrieval, common-mistakes, self-reflection, …) so
 * the count enforcer can skip them cleanly.
 */
function inferSectionGroup(
  section: PostValidatorSection,
): "recall" | "understanding" | "application" | "challenge" | null {
  const type = String(section.type || "").toLowerCase();
  // Strong signals first — explicit challenge type wins.
  if (type === "challenge" || type === "q-challenge") return "challenge";
  // Only consider question sections for recall/understanding/application.
  const isQuestion =
    type.startsWith("q-") ||
    type === "extended-answer" ||
    type === "lor" ||
    type === "exam-question";
  if (!isQuestion) return null;

  // Phase 1 schema field wins over title heuristics.
  const explicitN = (section as any).questionNumber;
  let qn: number | null = null;
  if (typeof explicitN === "number" && Number.isFinite(explicitN)) qn = explicitN;
  if (qn === null) {
    const title = typeof section.title === "string" ? section.title : "";
    const m = title.match(/Q(\d+)/i);
    qn = m ? parseInt(m[1], 10) : null;
  }
  if (qn === null) return null;

  const recall = getSectionQuestionRange("recall", false);
  const understanding = getSectionQuestionRange("understanding", false);
  const application = getSectionQuestionRange("application", false);
  if (qn >= recall.firstQ && qn <= recall.lastQ) return "recall";
  if (qn >= understanding.firstQ && qn <= understanding.lastQ) return "understanding";
  if (qn >= application.firstQ && qn <= application.lastQ) return "application";
  // Anything beyond the application range is treated as challenge so we
  // don't lose it — the count enforcer will simply find 1 challenge
  // (target) or warn if there are extras.
  return "challenge";
}

/**
 * Phase 1 — Enforce the 7-7-5 + 1 section question counts.
 *
 * Counts question sections per group via inferSectionGroup() and emits a
 * warning when a section is outside SECTION_QUESTION_TARGETS[group].{min,max}.
 *
 * Pure / idempotent. NEVER mutates content — warnings only — so an off-by-
 * one count never blocks a worksheet from rendering. The legacy 3-3-3
 * Q1-Q9 worksheet template will warn on every section here until the AI
 * has fully migrated; that is intentional and gives us an observability
 * signal in metadata.postValidatorWarnings to track migration progress.
 */
export function enforceSectionQuestionCounts(
  ws: PostValidatorWorksheet,
  _opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const counts: Record<"recall" | "understanding" | "application" | "challenge", number> = {
    recall: 0,
    understanding: 0,
    application: 0,
    challenge: 0,
  };
  for (const section of ws.sections || []) {
    const group = inferSectionGroup(section);
    if (group) counts[group]++;
  }
  // If every count is zero, this is almost certainly not a question-bearing
  // worksheet (e.g. a vocabulary-only library asset). Skip silently.
  const totalQuestionSections = counts.recall + counts.understanding + counts.application + counts.challenge;
  if (totalQuestionSections === 0) {
    return { worksheet: ws, warnings: [] };
  }
  for (const group of ["recall", "understanding", "application", "challenge"] as const) {
    const got = counts[group];
    const targets = SECTION_QUESTION_TARGETS[group];
    if (got < targets.min) {
      warnings.push(
        `Section "${group}" has ${got} question${got === 1 ? "" : "s"} — below the minimum of ${targets.min} (target ${targets.target}).`,
      );
    } else if (got > targets.max) {
      warnings.push(
        `Section "${group}" has ${got} questions — above the maximum of ${targets.max} (target ${targets.target}).`,
      );
    }
  }
  return { worksheet: ws, warnings };
}

/**
 * Phase 1 — Curriculum + GCSE spec lock.
 *
 * For every question section (type starts with "q-", or is "challenge" /
 * "extended-answer" / "lor" / "exam-question"), enforces a populated
 * `specRef` field that matches a published awarding-body code:
 *
 *   1. If `specRef` is already set and matches a code in the bundled
 *      taxonomy for (examBoard, subject, yearGroup), leave it alone.
 *   2. If `specRef` is empty / missing, attempt a best-match against the
 *      taxonomy (using the section's `ncRef` or title as the search hint)
 *      and stamp the matched code.
 *   3. If `specRef` is set but does NOT match any published code, warn —
 *      that's almost always an invented code. We DO NOT silently overwrite
 *      a non-empty value because doing so would mask a generation bug.
 *   4. If no taxonomy is bundled for the request, warn once at the worksheet
 *      level and leave specRef untouched.
 *
 * Pure / idempotent. Never invents a code; the post-validator only ever
 * surfaces a code that already exists in the published list.
 */
export function enforceSpecAnchorPresence(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const subject = opts.subject || String(ws.metadata?.subject || "");
  const yearGroup = opts.yearGroup || String(ws.metadata?.yearGroup || "");
  const board = (opts.examBoard || String(ws.metadata?.examBoard || ""))
    .toLowerCase()
    .replace(/\s+/g, "");
  if (!subject || !yearGroup) {
    return { worksheet: ws, warnings };
  }

  // Resolve the per-board dataset, falling back to the cross-board union so
  // we still catch invented codes when the school's specific board isn't
  // bundled. matchSpecPoint expects a SpecPointDataset — we synthesise a
  // tiny one from the union when needed.
  let dataset = board
    ? getSpecPoints(board as TaxonomyExamBoard, subject, yearGroup)
    : null;
  let pool = dataset?.specPoints || [];
  if (pool.length === 0) {
    pool = getSpecPointsAcrossBoards(subject, yearGroup);
  }
  if (pool.length === 0) {
    warnings.push(
      `No spec-point taxonomy bundled for board="${board || "unspecified"}" subject="${subject}" year="${yearGroup}"; skipping specRef enforcement.`,
    );
    return { worksheet: ws, warnings };
  }

  // Synthesise a dataset shape compatible with matchSpecPoint when we
  // fell through to the cross-board union (matchSpecPoint signature
  // requires a dataset, not a bare specPoints list).
  const effectiveDataset = dataset ?? {
    board: (board || "aqa") as TaxonomyExamBoard,
    subject,
    yearGroup,
    source: "cross-board-union",
    specPoints: pool,
  };
  const knownRefs = new Set(pool.map(sp => sp.specRef.toLowerCase()));
  // For cross-board entries the specRefs are prefixed with "<board>:" by
  // getSpecPointsAcrossBoards — accept those too.
  for (const sp of pool) knownRefs.add(sp.specRef.split(":").pop()!.toLowerCase());

  let filledCount = 0;
  let invalidCount = 0;
  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    if (s.teacherOnly) return s;
    const type = String(s.type || "").toLowerCase();
    const isQuestion =
      type === "challenge" ||
      type === "q-challenge" ||
      type === "extended-answer" ||
      type === "lor" ||
      type === "exam-question" ||
      type.startsWith("q-");
    if (!isQuestion) return s;

    const sec = s as any;
    const existing = typeof sec.specRef === "string" ? sec.specRef.trim() : "";
    if (existing) {
      const matched = matchSpecPoint(existing, effectiveDataset);
      if (matched) return s;
      // The AI stamped a code that does not exist in the published list —
      // almost always an invented code. Warn but DO NOT silently overwrite,
      // so the bug stays visible in the teacher-facing warnings panel.
      invalidCount++;
      warnings.push(
        `Question "${s.title || "(untitled)"}" carries specRef="${existing}" which does not match any published code in the ${effectiveDataset.board.toUpperCase()} ${subject} ${yearGroup} taxonomy.`,
      );
      return s;
    }

    // Try to fill from ncRef → title → content. matchSpecPoint does
    // case-insensitive id and substring matching against specTitle.
    const hint =
      (typeof sec.ncRef === "string" && sec.ncRef.trim()) ||
      (typeof s.title === "string" && s.title.trim()) ||
      (typeof s.content === "string" && s.content.slice(0, 200).trim()) ||
      "";
    if (!hint) return s;
    const matched = matchSpecPoint(hint, effectiveDataset);
    if (!matched) return s;
    filledCount++;
    return { ...s, specRef: matched.specRef } as PostValidatorSection;
  });

  if (filledCount > 0) {
    warnings.push(
      `Filled missing specRef on ${filledCount} question${filledCount === 1 ? "" : "s"} from the ${effectiveDataset.board.toUpperCase()} ${subject} ${yearGroup} taxonomy.`,
    );
  }
  if (invalidCount > 0) {
    warnings.push(
      `${invalidCount} question${invalidCount === 1 ? "" : "s"} carry an invented specRef. Investigate and remove from generation prompt.`,
    );
  }
  return { worksheet: { ...ws, sections }, warnings };
}

/**
 * Phase 2 — Topic-specific Self-Reflection enforcement.
 *
 * Walks the worksheet looking for the pupil-facing Self-Reflection section
 * (type "self-reflection", not teacher-only). When found, runs
 * `isGenericSelfReflection` on its content. If the content reads as
 * generic placeholder text (literal `I can ___`, the `apply what I have
 * learned today` fallback, fewer than 5 `I can …` statements, or an
 * exit-ticket sentence that doesn't mention the topic), it rewrites the
 * content with a deterministic topic-anchored block from
 * `selfReflectionBuilder` and stamps a warning.
 *
 * Behaviours:
 *   1. If no Self-Reflection section exists, no-op (no warning).
 *   2. If `topic` is unknown (neither `opts.topic` nor `ws.metadata.topic`
 *      is set), no-op with a single worksheet-level warning so the bug is
 *      visible — we don't rebuild reflection content without a topic to
 *      anchor it to.
 *   3. If the existing content passes `isGenericSelfReflection` (i.e. it
 *      already names the topic across ≥5 `I can …` statements), no-op.
 *   4. Otherwise, replace the section's `content` with the builder output
 *      and append a warning. The replacement preserves the renderer's
 *      marker-block format (SUBTITLE / CONFIDENCE_TABLE / WRITTEN_PROMPTS
 *      / EXIT_TICKET) so `SelfReflectionSection` keeps rendering it the
 *      same way.
 *
 * Pure / idempotent — running the validator twice on the same worksheet
 * yields the same result (a rewrite from the builder always passes
 * `isGenericSelfReflection`, so the second pass becomes a no-op).
 *
 * The builder is fed `topic / subject / year / sendKey` so its output
 * matches the SEND register the rest of the worksheet uses.
 */
export function enforceSelfReflectionTopicAnchor(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];

  // 1. Find the pupil-facing Self-Reflection section. There is normally
  //    exactly one. The teacher copy of the reflection (if any) is marked
  //    teacherOnly and skipped here — Phase 2 only fixes the pupil view.
  const idx = sections.findIndex(
    s => String(s.type || "").toLowerCase() === "self-reflection" && !s.teacherOnly,
  );
  if (idx < 0) {
    return { worksheet: ws, warnings };
  }
  const section = sections[idx];

  // 2. Resolve topic. Required for any meaningful rewrite — the whole
  //    point of this validator is the topic anchor.
  const topic = (opts.topic || String(ws.metadata?.topic || "")).trim();
  if (!topic) {
    warnings.push(
      `Self-Reflection topic-anchor enforcement skipped: no topic supplied (neither opts.topic nor metadata.topic).`,
    );
    return { worksheet: ws, warnings };
  }

  // 3. Already topic-anchored? No-op.
  const content = typeof section.content === "string" ? section.content : "";
  if (!isGenericSelfReflection(content, topic)) {
    return { worksheet: ws, warnings };
  }

  // 4. Rewrite via the deterministic builder. SEND register inferred from
  //    opts.sendNeed (mirrors the keying ai.ts uses internally so the
  //    rewrite matches the rest of the pupil-facing surface).
  const sendKey = (opts.sendNeed || "").toLowerCase().replace(/[\s_]/g, "-");
  const built = buildSelfReflection({
    topic,
    subject: opts.subject || String(ws.metadata?.subject || ""),
    year: opts.yearGroup || String(ws.metadata?.yearGroup || ""),
    sendKey,
  });
  const rebuilt = renderSelfReflectionAsMarkerBlock(built);

  warnings.push(
    `Self-Reflection content was generic / not topic-anchored (no I-can statements naming "${topic}", or contained "I can ___" / "apply what I have learned" placeholder). Replaced with deterministic builder output (5 I-can statements + 2 written prompts + exit ticket, all naming the topic).`,
  );

  const newSections = sections.slice();
  newSections[idx] = { ...section, content: rebuilt };
  return { worksheet: { ...ws, sections: newSections }, warnings };
}

// ─── Phase 3 — Revision Tips presence enforcement ───────────────────────────

/**
 * Scrape command words actually used on the question sections of a
 * worksheet. We look in two places:
 *   1. The structured `commandWord` field on each section (Phase 1
 *      schema field — populated by the AI when present).
 *   2. The first word of the section content's first non-blank line,
 *      restricted to a curated awarding-body command-word list.
 *
 * Returns at most 8 distinct entries, in order of first appearance.
 * Used by the revision-tips builder to anchor the COMMAND WORD tip to
 * the verbs the pupil is about to see.
 */
function collectCommandWordsUsed(ws: PostValidatorWorksheet): string[] {
  const KNOWN_VERBS = new Set([
    "calculate", "work out", "solve", "find", "show that", "prove that",
    "determine", "evaluate", "estimate", "describe", "explain", "compare",
    "contrast", "analyse", "identify", "state", "list", "outline",
    "suggest", "discuss", "justify", "assess", "interpret", "deduce",
    "predict", "define", "draw", "sketch", "plot", "label",
  ]);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of ws.sections || []) {
    if (s.teacherOnly) continue;
    const t = String(s.type || "").toLowerCase();
    if (!/^(q-|question$|challenge$|extended-answer$|exam-question$|lor$)/.test(t)) continue;
    // Schema-shaped commandWord first.
    const explicit = (s as PostValidatorSection & { commandWord?: string }).commandWord;
    if (explicit) {
      const key = explicit.trim().toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); out.push(explicit.trim()); }
      continue;
    }
    // Fall back to the leading word(s) of the section content.
    const content = typeof s.content === "string" ? s.content : "";
    const firstLine = content.split("\n").map(l => l.trim()).find(l => l && !/^answer\s+all\s+questions/i.test(l)) || "";
    if (!firstLine) continue;
    const lower = firstLine.toLowerCase();
    // Match longest first so "show that" wins over "show".
    const matched = Array.from(KNOWN_VERBS).sort((a, b) => b.length - a.length).find(v => lower.startsWith(v));
    if (matched && !seen.has(matched)) {
      seen.add(matched);
      out.push(matched.charAt(0).toUpperCase() + matched.slice(1));
    }
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * Scrape a topic-specific misconception from a worksheet's existing
 * Common Mistakes section. Returns the first non-empty line, with
 * bullet markers and "Common mistake:" prefixes stripped, capped at
 * 200 chars. Returns an empty array when no usable content is present
 * — the builder will then fall back to its per-subject default text.
 */
function collectMisconceptions(ws: PostValidatorWorksheet): string[] {
  const out: string[] = [];
  for (const s of ws.sections || []) {
    if (s.teacherOnly) continue;
    const t = String(s.type || "").toLowerCase();
    if (t !== "common-mistakes" && t !== "misconceptions") continue;
    const content = typeof s.content === "string" ? s.content : "";
    if (!content.trim()) continue;
    for (const raw of content.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      // Skip stem / heading lines.
      if (/^common\s+mistakes?\s*[:\-—]?\s*$/i.test(line)) continue;
      const stripped = line
        .replace(/^[\u2022\-\*\d.)\s]+/, "")
        .replace(/^(common\s+mistake|misconception|watch\s+out)\s*[:\-—]\s*/i, "")
        .trim();
      if (!stripped) continue;
      out.push(stripped.length > 200 ? stripped.slice(0, 197) + "…" : stripped);
      if (out.length >= 4) break;
    }
    if (out.length > 0) break;
  }
  return out;
}

/**
 * Scrape per-question marks tariffs from a worksheet so the time-tip
 * and mark-scheme-tip can anchor to the actual paper. Looks at
 * `section.marks` first (Phase 1 schema field), then falls back to
 * matching `[N marks]` inline in the content. Returns an array, in
 * order, of every positive integer found.
 */
function collectMarksUsed(ws: PostValidatorWorksheet): number[] {
  const out: number[] = [];
  for (const s of ws.sections || []) {
    if (s.teacherOnly) continue;
    const t = String(s.type || "").toLowerCase();
    if (!/^(q-|question$|challenge$|extended-answer$|exam-question$|lor$)/.test(t)) continue;
    const explicit = (s as PostValidatorSection & { marks?: number }).marks;
    if (typeof explicit === "number" && explicit > 0) {
      out.push(explicit);
      continue;
    }
    const content = typeof s.content === "string" ? s.content : "";
    const m = content.match(/\[(\d+)\s*marks?\]/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > 0) out.push(n);
    }
  }
  return out;
}

/**
 * Phase 3 — examiner-voice Revision Tips enforcement.
 *
 * Walks the worksheet looking for the pupil-facing Revision-Tips
 * section (type "revision-tips", not teacher-only). When found, runs
 * `isGenericRevisionTips` on its content. If the content reads as
 * generic placeholder text (fewer than 5 numbered/labelled tips, no
 * topic anchor, no UK awarding-body command word, generic stems like
 * "revise carefully" / "study hard", literal placeholders like `[Tip
 * 1]` / `___`), the section content is replaced with the deterministic
 * builder output.
 *
 * When the section is missing entirely the validator does NOT auto-
 * insert it — Phase 3 is opt-in via the section toggle, mirroring how
 * `enforceSelfReflectionTopicAnchor` behaves.
 *
 * Pure / idempotent — running the validator twice on the same
 * worksheet yields the same result (a rewrite from the builder always
 * passes `isGenericRevisionTips`, so the second pass is a no-op).
 *
 * The builder is fed `topic / subject / year / examBoard / sendKey`,
 * plus `commandWordsUsed`, `misconceptions` and `marksUsed` scraped
 * from the worksheet itself, so the rewrite mirrors the actual
 * questions the pupil is about to attempt.
 */
export function enforceRevisionTipsPresence(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];

  // 1. Find the pupil-facing Revision-Tips section. Teacher copies
  //    (if any) are skipped.
  const idx = sections.findIndex(
    s => String(s.type || "").toLowerCase() === "revision-tips" && !s.teacherOnly,
  );
  if (idx < 0) {
    return { worksheet: ws, warnings };
  }
  const section = sections[idx];

  // 2. Resolve topic. Required for any meaningful rewrite — the whole
  //    point of this validator is the topic anchor.
  const topic = (opts.topic || String(ws.metadata?.topic || "")).trim();
  if (!topic) {
    warnings.push(
      `Revision-Tips presence enforcement skipped: no topic supplied (neither opts.topic nor metadata.topic).`,
    );
    return { worksheet: ws, warnings };
  }

  // 3. Already topic-anchored and well-formed? No-op.
  const content = typeof section.content === "string" ? section.content : "";
  if (!isGenericRevisionTips(content, topic)) {
    return { worksheet: ws, warnings };
  }

  // 4. Rewrite via the deterministic builder. The builder is fed the
  //    actual command words, misconceptions and mark tariffs from the
  //    rest of the worksheet so the rewrite mirrors what the pupil
  //    sees on the questions.
  const sendKey = (opts.sendNeed || "").toLowerCase().replace(/[\s_]/g, "-");
  const commandWordsUsed = collectCommandWordsUsed(ws);
  const misconceptions = collectMisconceptions(ws);
  const marksUsed = collectMarksUsed(ws);
  const built = buildRevisionTips({
    topic,
    subject: opts.subject || String(ws.metadata?.subject || ""),
    year: opts.yearGroup || String(ws.metadata?.yearGroup || ""),
    examBoard: opts.examBoard || String(ws.metadata?.examBoard || ""),
    sendKey,
    commandWordsUsed,
    misconceptions,
    marksUsed,
  });
  const rebuilt = renderRevisionTipsAsMarkerBlock(built);

  warnings.push(
    `Revision-Tips content was generic / not topic-anchored (fewer than 5 tip-shaped lines, no command-word reference, or generic stems like "revise carefully"). Replaced with deterministic builder output (5 tips: command-word, misconception, method, mark-scheme, time — all naming "${topic}").`,
  );

  const newSections = sections.slice();
  newSections[idx] = { ...section, content: rebuilt };
  return { worksheet: { ...ws, sections: newSections }, warnings };
}

/**
 * Phase 5 — Curriculum-authority invariants.
 *
 * The voice-and-authority counterpart to the Phase 1–4 enforcers.
 * Phase 5 ships a manifesto at the top of the system prompt that
 * binds every worksheet to the UK National Curriculum, the named
 * awarding body, UK English, SI units and the awarding-body
 * command-word vocabulary. This validator is the post-generation
 * safety net for the bits a prompt alone cannot reliably enforce
 * across providers (OpenAI / Groq / Cerebras / Anthropic — all
 * trained on US-heavy corpora).
 *
 * Four detection rules, applied to every pupil-facing section:
 *
 *   1. SILENT UK ENGLISH REWRITE. Walks UK_ENGLISH_SUBSTITUTIONS
 *      over title + content. Every match is rewritten in place —
 *      "color" → "colour", "aluminum" → "aluminium", "math" →
 *      "maths" (standalone only — never `mathematics`),
 *      "kilometer" → "kilometre", "organize" → "organise", and
 *      every -re/-our/-ll- variant the table covers. One warning
 *      per drift fixed so the regression is traceable. Compound
 *      words (`voltmeter`, `parameter`, `diameter`) and Greek-root
 *      words are NEVER touched — the regex word boundaries
 *      naturally exclude them.
 *
 *   2. BANNED SOFTENERS. Warn only — never silently rewritten.
 *      Phrases like "Have a think about", "Talk about", "Make sure
 *      you revise", "Good luck", "Do your best" are noise the
 *      manifesto explicitly bans. Silent rewriting would paper
 *      over a real generation failure that the prompt should be
 *      teaching the model to avoid. The warning surfaces in the
 *      developer console + adaptations panel so the regression is
 *      visible.
 *
 *   3. FABRICATED AO CODES. UK awarding bodies use AO1–AO4 only.
 *      AO5 / AO6 / AO7+ do not exist on any UK GCSE or A-Level
 *      specification. When the structured `ao` field on a question
 *      section carries a fabricated code we clamp to "AO1" and
 *      warn (the field is structurally invalid — better a known
 *      conservative value than a fabrication). When a fabricated
 *      code appears in pupil-facing content we warn only — content
 *      rewrites can mask the underlying spec-mapping failure.
 *
 *   4. PLACEHOLDER LEAKAGE. `${...}` template-literal syntax,
 *      literal `[topic]` / `[subject]` / `[year]` / `[N marks]`
 *      tokens — all signs that the model copied the worked-example
 *      template instead of filling it in. Warn only — these are
 *      generation bugs the model should be taught to avoid, not
 *      papered over.
 *
 * Skip rules:
 *   - Sections with `teacherOnly === true` are skipped — the
 *     teacher answer key may legitimately mention "the teacher
 *     should..." or similar that would otherwise look like a
 *     softener; teacher-facing content has its own register.
 *
 * Pure / idempotent — running the validator twice produces the
 * same result; the second run finds zero substitutions to apply
 * and emits zero warnings.
 *
 * Runs LAST in the post-validator chain so it normalises any text
 * earlier validators may have written (e.g. the deterministic
 * Self-Reflection / Revision-Tips rewrites in Phases 2 / 3).
 */
export function enforceCurriculumAuthorityInvariants(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections;

  if (!Array.isArray(sections) || sections.length === 0) {
    return { worksheet: ws, warnings };
  }

  let mutated = false;

  const rewrittenSections = sections.map((section, idx) => {
    if (section.teacherOnly === true) return section;

    const sectionLabel = section.title?.trim()
      || section.type
      || `section ${idx + 1}`;

    let nextTitle = section.title;
    let nextContent = section.content;
    let titleChanged = false;
    let contentChanged = false;

    // 1. Silent UK English rewrite — title.
    if (typeof nextTitle === "string" && nextTitle.length > 0) {
      const r = applyUKEnglishSubstitutions(nextTitle);
      if (r.substitutions.length > 0) {
        nextTitle = r.rewritten;
        titleChanged = true;
        for (const sub of r.substitutions) {
          warnings.push(
            `Phase 5 — UK English: "${sub.from}" → "${sub.to}" in "${sectionLabel}" (title).`,
          );
        }
      }
    }

    // 1. Silent UK English rewrite — content.
    if (typeof nextContent === "string" && nextContent.length > 0) {
      const r = applyUKEnglishSubstitutions(nextContent);
      if (r.substitutions.length > 0) {
        nextContent = r.rewritten;
        contentChanged = true;
        for (const sub of r.substitutions) {
          warnings.push(
            `Phase 5 — UK English: "${sub.from}" → "${sub.to}" in "${sectionLabel}".`,
          );
        }
      }
    }

    // 2. Banned softeners — warn only on the post-rewrite text.
    for (const [fieldName, fieldValue] of [
      ["title", nextTitle],
      ["content", nextContent],
    ] as const) {
      if (typeof fieldValue !== "string") continue;
      const hits = findBannedSofteners(fieldValue);
      for (const hit of hits) {
        warnings.push(
          `Phase 5 — Banned softener "${hit}" in "${sectionLabel}" (${fieldName}). Rewrite the stem with an awarding-body command word.`,
        );
      }
    }

    // 3. Fabricated AO code — structured field clamp + content warn.
    const aoField = (section as { ao?: unknown }).ao;
    let nextAo: string | undefined = typeof aoField === "string" ? aoField : undefined;
    let aoChanged = false;
    if (typeof aoField === "string" && aoField.length > 0) {
      const hits = findFabricatedAoCodes(aoField);
      if (hits.length > 0) {
        warnings.push(
          `Phase 5 — Fabricated AO code "${aoField}" in "${sectionLabel}".ao. UK awarding bodies use AO1–AO4 only. Clamped to AO1.`,
        );
        nextAo = "AO1";
        aoChanged = true;
      }
    }
    if (typeof nextContent === "string") {
      const hits = findFabricatedAoCodes(nextContent);
      for (const hit of hits) {
        warnings.push(
          `Phase 5 — Fabricated AO code "${hit}" in "${sectionLabel}" content. UK awarding bodies use AO1–AO4 only.`,
        );
      }
    }

    // 4. Placeholder leakage — warn only on title + content.
    for (const [fieldName, fieldValue] of [
      ["title", nextTitle],
      ["content", nextContent],
    ] as const) {
      if (typeof fieldValue !== "string") continue;
      const hits = findPlaceholderLeakage(fieldValue);
      for (const hit of hits) {
        warnings.push(
          `Phase 5 — Placeholder leakage "${hit}" in "${sectionLabel}" (${fieldName}). The prompt template was not fully filled in.`,
        );
      }
    }

    if (!titleChanged && !contentChanged && !aoChanged) return section;

    mutated = true;
    const next: PostValidatorSection = { ...section };
    if (titleChanged) next.title = nextTitle;
    if (contentChanged) next.content = nextContent;
    if (aoChanged) (next as { ao?: string }).ao = nextAo;
    return next;
  });

  if (!mutated && warnings.length === 0) {
    return { worksheet: ws, warnings };
  }

  return {
    worksheet: mutated ? { ...ws, sections: rewrittenSections } : ws,
    warnings,
  };
}

/**
 * Runs every post-generation validator in order. Collects warnings and
 * stamps them onto worksheet.metadata.postValidatorWarnings.
 */
export function runWorksheetPostValidators(
  worksheet: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const allWarnings: string[] = [];
  let current: PostValidatorWorksheet = worksheet;

  for (const fn of [
    enforceSingleMcqCorrect,
    dedupeWordBank,
    (ws: PostValidatorWorksheet) => stripForeignDiagrams(ws, opts),
    stripEmptyDiagramPlaceholders,
    (ws: PostValidatorWorksheet) => enforceYearGroupLock(ws, opts),
    (ws: PostValidatorWorksheet) => capWorkedExampleSteps(ws, opts),
    stripLeakedGeneratorInstructions,
    stripVisiblePlaceholdersAndAnswerLeakage,
    (ws: PostValidatorWorksheet) => reinforceDyscalculiaMathsScaffolding(ws, opts),
    // PR worksheet-gen-efficiency #7 — deterministic mark-scheme reconciler.
    // Runs AFTER MCQ/word-bank fixes so we work against sanitised content,
    // and BEFORE the misconception-link extractor so the mark scheme is
    // settled before any teacher-facing diagnostics are emitted.
    (ws: PostValidatorWorksheet) => reconcileMarkScheme(ws, opts),
    // FEAT-PB7 — extract per-MCQ misconception linkage AFTER all other
    // content rewrites so we work against the final, sanitised MCQ text.
    extractMisconceptionLinks,
    // Phase 1 — section-count contract enforcement (7-7-5 + 1).
    // Counts question sections per group and warns when outside the
    // SECTION_QUESTION_TARGETS[section].{min,max} window. No mutation —
    // warnings only — so an off-by-one count never blocks a worksheet.
    (ws: PostValidatorWorksheet) => enforceSectionQuestionCounts(ws, opts),
    // Phase 1 — curriculum + GCSE spec lock. Fills missing specRef on
    // every question section by best-matching against the awarding-body
    // taxonomy. Never invents codes; warns when no taxonomy is bundled
    // for the (board, subject, year) combination.
    (ws: PostValidatorWorksheet) => enforceSpecAnchorPresence(ws, opts),
    // Phase 2 — topic-specific Self-Reflection. Detects generic
    // placeholder content ("I can ___", "apply what I have learned",
    // <5 I-can statements, exit ticket without the topic noun) on the
    // pupil-facing Self-Reflection section and rewrites it with
    // deterministic builder output that names the actual topic. Pure /
    // idempotent — never overwrites good topic-anchored content. Runs
    // last so it sees the final post-validated section list (e.g. after
    // any earlier passes have settled the section types and titles).
    (ws: PostValidatorWorksheet) => enforceSelfReflectionTopicAnchor(ws, opts),
    // Phase 3 — examiner-voice Revision Tips. Detects generic placeholder
    // content (fewer than 5 tip-shaped lines, no command-word reference,
    // no topic anchor, generic stems like "revise carefully", literal
    // placeholders like `[Tip 1]` / `___`) on the pupil-facing
    // Revision-Tips section and rewrites it with deterministic builder
    // output that names "${opts.topic}" / metadata.topic, mirrors the
    // worksheet's actual command words and mark tariffs, and surfaces a
    // real misconception when the Common Mistakes section is populated.
    // Pure / idempotent. Runs last so it sees the final post-validated
    // section list — including any reconciled mark-scheme that the
    // earlier reconcileMarkScheme pass has settled.
    (ws: PostValidatorWorksheet) => enforceRevisionTipsPresence(ws, opts),
    // Phase 5 — curriculum-authority invariants. Walks every pupil-
    // facing section and (a) silently rewrites US-English drift to UK
    // English, (b) warns on banned softener phrases ("Have a think
    // about", "Make sure you revise", "Good luck", "Do your best"),
    // (c) clamps fabricated assessment-objective codes (AO5+) to AO1
    // and warns on the same fabrication in pupil-facing content,
    // (d) warns on template-literal / placeholder leakage. Pure /
    // idempotent. Runs LAST so any text written by earlier validators
    // (e.g. deterministic Self-Reflection / Revision-Tips rewrites in
    // Phases 2 / 3) is also normalised to UK English before the
    // worksheet leaves the post-validator chain.
    enforceCurriculumAuthorityInvariants,
  ]) {
    const r = fn(current);
    current = r.worksheet;
    allWarnings.push(...r.warnings);
  }

  if (allWarnings.length > 0) {
    current = {
      ...current,
      metadata: {
        ...(current.metadata || {}),
        postValidatorWarnings: [
          ...((current.metadata?.postValidatorWarnings as string[] | undefined) || []),
          ...allWarnings,
        ],
      },
    };
  }

  return { worksheet: current, warnings: allWarnings };
}
