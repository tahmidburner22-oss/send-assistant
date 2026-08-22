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
  // PR-2 — new helpers added in the same module so the curriculum-
  // authority surface stays a single source of truth.
  findImperialUnits,
  isUnitConversionTopic,
  findOffSpecCommandWords,
  computeReadingAge,
} from "./curriculumAuthorityPrompt";

// PR-3 — typographic notation drift (× / − / °) for maths and the sciences.
// Pure rewriter exposed by `notationHygieneNormaliser.ts`. The validator
// `enforceMathsNotationHygiene` (added below) wraps this in the standard
// post-validator shape: silent rewrite of student-visible content + one
// warning per drift fixed.
import { normaliseMathNotation } from "./notationHygieneNormaliser";

// PR-4 — audit item #50 — Quality scorecard. Pure / idempotent. Wired
// as the LAST step in `runWorksheetPostValidators` so the score reflects
// every warning every prior validator stamped, plus all reports the
// audits attached to metadata (sendFidelityReport, commonMistakesAudit,
// specPointAuditReport, etc.). Single source of truth — see
// `qaScoreBuilder.ts` for the full deduction matrix.
import { applyQaScore } from "./qaScoreBuilder";

// PR-8 — audit item #74 — data-driven post-validator chain. The
// canonical chain order + per-validator name lives in
// `worksheetPostValidatorRegistry.ts`. `runWorksheetPostValidators`
// (defined at the bottom of this file) delegates to `runRegistry` so
// callers can disable individual validators per-tenant by name without
// forking the chain.
import { runRegistry } from "./worksheetPostValidatorRegistry";

// PR-10 to PR-18 (combined) — re-export new validators from focused
// modules so `worksheetPostValidatorRegistry.ts` can pull them by
// name. Each module is pure / idempotent / conservative and stamps
// metadata + warnings via the standard `{ worksheet, warnings }` shape.
export { enforceBiasSensitivity } from "./biasSensitivityAudit";
export { enforceMarkSchemeUpgrades } from "./markSchemeUpgrades";
export { enforceBloomProgression } from "./bloomProgressionAudit";
export { enforcePastPaperFingerprint } from "./pastPaperFingerprint";
export { enforceAccessibilityAudit } from "./accessibilityAudit";

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
  /** PR-8 — audit item #74. Optional per-validator enable / disable
   *  overrides keyed by the registry name (kebab-case, e.g.
   *  "command-word-fidelity"). Setting a key to `false` skips that
   *  validator for this run. Unknown keys are reported back via a
   *  `[Phase PR-8 — Validator registry]` warning so typos don't silently
   *  disable nothing. Pure / additive — when the field is absent, the
   *  full chain runs exactly as it did before this PR. See
   *  `worksheetPostValidatorRegistry.ts:WORKSHEET_POST_VALIDATORS` for
   *  the canonical name list. */
  validatorOverrides?: Readonly<Record<string, boolean>>;
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

  // IMP-03 — robust pre-pass. Strip RULE/INSTRUCTION/SCHEMA segments even when
  // they sit MID-LINE because the AI emitted literal "\n" escapes (backslash +
  // n) rather than real newlines — the gap-fill word bank leak
  // ("WORD BANK: …\nRULE: EXACTLY 7 sentences…") is exactly this shape, and the
  // line-anchored filters below never see it at a physical line start. Anchored
  // to a logical line boundary (string start, real newline, or a literal "\n"
  // escape — captured and preserved) so it never fires on legitimate prose such
  // as "the octet rule: electrons must …". The lazy match is bounded by a
  // literal "\n" escape OR a real end-of-line so it never swallows the
  // following sentence.
  const beforePre = content;
  content = content.replace(
    /(^|\n|\\n)([^\S\r\n]*)(?:(?:CRITICAL\s+)?(?:FORMATTING\s+)?(?:RULE|INSTRUCTION|SCHEMA|OUTPUT\s+RULE)\s*:\s*(?:EXACTLY|You\s+MUST|MUST|Do\s+NOT|Return|Write|Use|Include|Only)[^\n]*?)(?=\\n|$)/gim,
    "$1",
  );
  if (content !== beforePre) changed = true;

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

// ─── 6b. Mark-allocation bracket style (IMP-06) ──────────────────────────────
// GCSE papers write mark allocations in ROUND brackets — "(2 marks)" — but the
// LLM almost always emits SQUARE brackets — "[2 marks]" — despite the prompt.
// This deterministic rewrite guarantees the convention regardless of model
// output. Pure / idempotent: a second pass finds nothing left to convert
// because the output no longer contains a "[N marks]" token. The renderer
// accepts both forms, so this never changes which questions render a mark
// badge / answer-line ramp — it only normalises the visible glyph.
//
// Extended patterns handled:
//   [2 marks]        → (2 marks)
//   [2 marks total]  → (2 marks)
//   [2m]             → (2 marks)
//   [2M]             → (2 marks)
const MARKS_SQUARE_BRACKET_RE = /\[(\d+)\s*(marks?(?:\s+total)?)\]/gi;
const MARKS_SHORT_BRACKET_RE  = /\[(\d+)[Mm]\]/g;

function convertMarksBrackets(value: unknown): { value: unknown; changed: boolean } {
  if (typeof value !== "string" || !value) return { value, changed: false };
  let next = value;
  // Handle [Nm] / [NM] shorthand first, retaining singular grammar for one mark.
  next = next.replace(MARKS_SHORT_BRACKET_RE, (_m, n) => `(${n} ${Number(n) === 1 ? "mark" : "marks"})`);
  // Handle [N marks] / [N marks total] with the same visible grammar.
  next = next.replace(MARKS_SQUARE_BRACKET_RE, (_m, n, _word) => `(${n} ${Number(n) === 1 ? "mark" : "marks"})`);
  return { value: next, changed: next !== value };
}

export function enforceMarksBracketStyle(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  let changedCount = 0;

  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    let changed = false;
    const next: any = { ...s };
    for (const key of ["title", "subtitle", "content", "prompt", "question", "text", "stem", "caption"]) {
      const r = convertMarksBrackets(next[key]);
      if (r.changed) { next[key] = r.value; changed = true; }
    }
    if (Array.isArray(next.questions)) {
      next.questions = next.questions.map((q: any) => {
        if (!q || typeof q !== "object") return q;
        const nq = { ...q };
        for (const key of ["text", "prompt", "question", "stem", "content", "answer", "feedback"]) {
          const r = convertMarksBrackets(nq[key]);
          if (r.changed) { nq[key] = r.value; changed = true; }
        }
        if (Array.isArray(nq.options)) {
          nq.options = nq.options.map((o: any) => {
            const r = convertMarksBrackets(o);
            if (r.changed) changed = true;
            return r.value;
          });
        }
        return nq;
      });
    }
    if (changed) changedCount++;
    return changed ? (next as PostValidatorSection) : s;
  });

  if (changedCount > 0) {
    warnings.push(
      `[IMP-06] Normalised mark allocations to GCSE round-bracket style "(N marks)" in ${changedCount} section${changedCount === 1 ? "" : "s"}.`,
    );
  }
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

// Shared calculation-question detector (IMP-13 / IMP-14). Conservative on
// purpose: only fires on explicit calculation command words so prose / recall
// questions are never scaffolded as if they were numeric.
function isCalculationQuestionText(text: string): boolean {
  return /\bcalculat(?:e|ion|ing)\b|\bwork(?:ing)? out\b|\bhow (?:much|many|far|fast|long)\b|\bdetermine the\b|\bcompute\b/i.test(
    String(text || ""),
  );
}

function escapeRegExpLiteral(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
// IMP-01 — broadened to capture BOTH maths (`m-…`) and science (`s-…`) and
// any other short subject-prefixed misconception IDs. The previous pattern
// only matched `m-…`, so science MCQ markers (e.g. `A=s-mass-01`) were never
// parsed — they fell through as "malformed" and only the line-strip saved us.
const TEACHER_DIAGNOSES_PAIR_RE = /\b([A-Da-d])\s*=\s*([a-z]{1,4}-[a-z0-9-]{2,})\b/g;
// IMP-01 / IMP-17 — robust marker strip. `[^\n]*?` plus a lookahead for a
// literal "\n" escape (backslash + n) OR a real end-of-line means the marker
// is removed whether the AI emitted real newlines or literal "\n" escapes
// (which collapse the whole block onto one physical line and defeat the
// line-anchored TEACHER_DIAGNOSES_LINE_RE above).
const TEACHER_DIAGNOSES_STRIP_RE = /TEACHER[_\s]?DIAGNOSES\s*:[^\n]*?(?=\\n|$)/gim;

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
    // Also detect markers that sit mid-line because the AI emitted literal
    // "\n" escapes rather than real newlines (the line-anchored match misses
    // those). Either signal means we must parse + strip.
    TEACHER_DIAGNOSES_STRIP_RE.lastIndex = 0;
    const hasMarker = !!lineMatch || TEACHER_DIAGNOSES_STRIP_RE.test(content);
    if (!hasMarker) return s;

    // Parse pairs from anywhere a marker appears (covers both real-newline and
    // literal-escape encodings). Reset regex state because of the `g` flag.
    const markerText = lineMatch
      ? lineMatch[1]
      : (content.match(/TEACHER[_\s]?DIAGNOSES\s*:[^\n]*?(?=\\n|$)/im)?.[0] ?? "");
    TEACHER_DIAGNOSES_PAIR_RE.lastIndex = 0;
    let pair: RegExpExecArray | null;
    let foundAny = false;
    while ((pair = TEACHER_DIAGNOSES_PAIR_RE.exec(markerText)) !== null) {
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

    // Strip the marker from student-visible content regardless. It is
    // teacher-only data; the parsed links live on metadata.misconceptionLinks
    // and are surfaced by the renderer's teacher view. The robust global strip
    // (TEACHER_DIAGNOSES_STRIP_RE) handles both real-newline and literal-"\n"
    // encodings; the trailing line filter cleans up the common own-line case.
    TEACHER_DIAGNOSES_STRIP_RE.lastIndex = 0;
    const cleaned = content
      .replace(TEACHER_DIAGNOSES_STRIP_RE, "")
      .split("\n")
      .filter((ln) => !TEACHER_DIAGNOSES_LINE_RE.test(ln))
      .join("\n")
      .replace(/[ \t]{2,}/g, " ")
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

export function stripVisiblePlaceholdersAndAnswerLeakage(ws: PostValidatorWorksheet): PostValidatorResult {
  const warnings: string[] = [];
  // Lane 1.8 — strengthened pattern. The original list was missing the
  // self-reflection table-row placeholders (e.g. "[5 specific skills/
  // concepts from Respiration]"), the primary "activity question N"
  // wrappers, the "[learning objective]" wrapper, and the
  // "[debatable claim about <topic>]" wrapper, all of which leak when
  // the AI returns the JSON shape-guide template verbatim. Now keyed
  // off an optional digit / "ONE" / "Single" / "One" prefix followed
  // by any of the canonical placeholder lead-words. Idempotent — a
  // second pass finds nothing left to strip.
  const PLACEHOLDER_RE = /\[(?:\s*(?:\d+(?:[-–]\d+)?\s+|ONE\s+|EXACTLY\s+|Single\s+|One\s+|optional\s+|short\s+)?(?:specific|plausible|correct\s+answer|incorrect\s+option|continue|word\d+|point\s+\d+|name\s+of\s+mistake|explanation|short|realistic|final\s+answer|first\s+step|second\s+step|third\s+step|key\s+point|statement\s+about|skills?\s*\/?\s*concepts?|skills?|concepts?|learning\s+objective|topic\s+name|key\s+terms?|key\s+vocabulary|model\s+answer|misconception|common\s+mistake|activity(?:\s+question)?|list\s+\d+|mark[-\s]scheme|brief\s+title|debatable|theme\s+or\s+technique|key\s+idea|question\s+about|extract|stimulus|scenario|EXAM-STYLE|specific\s+process|specific\s+calculation|.*?placeholder.*?))[^\]]*\]/gi;
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
 * DETERMINISTIC ENFORCEMENT (RC3):
 *   - For the application group: trims excess questions beyond the max (5).
 *     This is the most common failure mode (AI generates 6 exam-style Qs).
 *     The companion `enforceApplicationQuestionCap` already handles this;
 *     this function now also enforces it as a safety net.
 *   - For recall / understanding: emits a warning when below minimum so the
 *     teacher can see the shortfall. We do NOT pad these sections because
 *     padding would require generating new question content — that is the
 *     LLM’s job, not the post-validator’s.
 *   - For challenge: warn-only (1 challenge is the target; 0 is flagged).
 *
 * Pure / idempotent. The application trim is the only mutation; all other
 * groups remain warnings-only.
 */
export function enforceSectionQuestionCounts(
  ws: PostValidatorWorksheet,
  _opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];

  // Count per group
  const counts: Record<"recall" | "understanding" | "application" | "challenge", number> = {
    recall: 0,
    understanding: 0,
    application: 0,
    challenge: 0,
  };
  for (const section of sections) {
    const group = inferSectionGroup(section);
    if (group) counts[group]++;
  }

  // If every count is zero, this is almost certainly not a question-bearing
  // worksheet (e.g. a vocabulary-only library asset). Skip silently.
  const totalQuestionSections = counts.recall + counts.understanding + counts.application + counts.challenge;
  if (totalQuestionSections === 0) {
    return { worksheet: ws, warnings: [] };
  }

  // Deterministic trim for application (exam-style) questions exceeding max.
  // `enforceApplicationQuestionCap` also does this; this is a belt-and-braces
  // safety net that fires when the cap validator was skipped or ran first.
  let nextSections = sections;
  const appMax = SECTION_QUESTION_TARGETS.application.max;
  if (counts.application > appMax) {
    const appSections = sections
      .map((s, i) => ({ s, i, group: inferSectionGroup(s) }))
      .filter(x => x.group === "application")
      .sort((a, b) => sectionQuestionNumber(a.s) - sectionQuestionNumber(b.s));
    const keepIdx = new Set(appSections.slice(0, appMax).map(x => x.i));
    const dropCount = counts.application - appMax;
    nextSections = sections.filter((s, i) => inferSectionGroup(s) !== "application" || keepIdx.has(i));
    warnings.push(
      `[RC3] Trimmed ${dropCount} excess application question${dropCount === 1 ? "" : "s"} to enforce the 5-question cap (was ${counts.application}).`,
    );
    counts.application = appMax;
  }

  // Warn-only for all groups (recall, understanding, challenge) where we
  // cannot deterministically generate missing content.
  for (const group of ["recall", "understanding", "application", "challenge"] as const) {
    const got = counts[group];
    const targets = SECTION_QUESTION_TARGETS[group];
    if (got < targets.min) {
      warnings.push(
        `[RC3] Section "${group}" has ${got} question${got === 1 ? "" : "s"} — below the minimum of ${targets.min} (target ${targets.target}). The AI prompt must be fixed to generate the correct count.`,
      );
    } else if (got > targets.max) {
      warnings.push(
        `[RC3] Section "${group}" has ${got} questions — above the maximum of ${targets.max} (target ${targets.target}).`,
      );
    }
  }

  return { worksheet: { ...ws, sections: nextSections }, warnings };
}

/**
 * IMP-04 — enforce the GCSE Section 3 (Application & Analysis) cap.
 *
 * The audit found Section 3 reliably generating 6 exam-style questions when
 * the spec / SECTION_QUESTION_TARGETS both fix it at exactly 5. The original
 * `enforceSectionQuestionCounts` is warnings-only (a deliberate invariant), so
 * this companion validator does the deterministic trimming the audit asks for:
 * when more than `application.max` (5) question SECTIONS classify as the
 * application group, it drops the highest-numbered extras until exactly 5
 * remain. Conservative by design — it only ever acts on sections that
 * `inferSectionGroup` confidently labels "application", and it is a no-op when
 * the count is already ≤ 5 (so a well-formed sheet, and a malformed sheet whose
 * earlier sections under-generated, are both left untouched here — the prompt
 * constraints handle those cases).
 *
 * Pure / idempotent: a second pass finds ≤ 5 application sections and returns
 * the worksheet unchanged.
 */
function sectionQuestionNumber(section: PostValidatorSection): number {
  const explicitN = (section as any).questionNumber;
  if (typeof explicitN === "number" && Number.isFinite(explicitN)) return explicitN;
  const title = typeof section.title === "string" ? section.title : "";
  const m = title.match(/Q(\d+)/i);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

export function enforceApplicationQuestionCap(
  ws: PostValidatorWorksheet,
  _opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];
  const max = SECTION_QUESTION_TARGETS.application.max;
  // Anything past the Understanding range that is a question section (but NOT
  // the separate Challenge) is a Section 3 (application / exam-style) question.
  // Using the cutoff rather than the fixed application range is deliberate: a
  // 6th exam question is numbered just past the range and would otherwise be
  // misread as a second "challenge" — so the cap would never fire.
  const cutoff = getSectionQuestionRange("understanding", false).lastQ;

  const isApplicationQuestion = (s: PostValidatorSection): boolean => {
    const type = String(s.type || "").toLowerCase();
    if (type === "challenge" || type === "q-challenge") return false;
    const isQuestion =
      type.startsWith("q-") ||
      type === "extended-answer" ||
      type === "lor" ||
      type === "exam-question";
    if (!isQuestion) return false;
    const qn = sectionQuestionNumber(s);
    return Number.isFinite(qn) && qn !== Number.MAX_SAFE_INTEGER && qn > cutoff;
  };

  const applicationIdx = sections
    .map((s, i) => ({ i, qn: sectionQuestionNumber(s), keep: isApplicationQuestion(s) }))
    .filter((x) => x.keep);

  if (applicationIdx.length <= max) {
    return { worksheet: ws, warnings };
  }

  // Keep the `max` lowest-numbered application questions; drop the rest.
  const keepIdx = new Set(
    [...applicationIdx].sort((a, b) => a.qn - b.qn).slice(0, max).map((x) => x.i),
  );
  const dropCount = applicationIdx.length - keepIdx.size;
  const nextSections = sections.filter((s, i) => !isApplicationQuestion(s) || keepIdx.has(i));

  warnings.push(
    `[IMP-04] Trimmed ${dropCount} excess Section 3 (application) question${dropCount === 1 ? "" : "s"} to enforce the GCSE cap of ${max} exam-style questions.`,
  );
  return { worksheet: { ...ws, sections: nextSections }, warnings };
}

/**
 * RC4 / IMP-09 — Command-word tariff table + deterministic mark variety.
 *
 * The audit found every Section 3 question carrying the same tariff (always
 * "[4 marks]") regardless of command-word demand. This upgrade:
 *
 *   1. Builds a command-word tariff table (the GCSE standard mapping).
 *   2. Scans each Section 3 question stem for a leading command word.
 *   3. When ALL Section 3 questions carry an identical tariff AND the
 *      command words imply different tariffs, deterministically re-stamps
 *      the mark allocation in the section content to match the tariff table.
 *   4. Falls back to warn-only when no command word is detectable (safe).
 *
 * Pure / idempotent: a second pass finds the tariffs already correct and
 * returns the worksheet unchanged.
 */

// Command-word → canonical GCSE mark tariff (single value or range midpoint).
// Source: AQA / Edexcel / OCR examiner reports and mark-scheme conventions.
const COMMAND_WORD_TARIFF: ReadonlyMap<RegExp, number> = new Map([
  [/^\b(state|name|give|identify|list|circle|tick|underline|shade|label)\b/i, 1],
  [/^\b(define|recall|write(?:\s+down)?|complete|fill\s+in|match)\b/i, 2],
  [/^\b(describe|outline|summarise|summarize|suggest)\b/i, 3],
  [/^\b(explain|show(?:\s+that)?|justify|account\s+for|give\s+reasons?)\b/i, 4],
  [/^\b(calculate|determine|work\s+out|find(?:\s+the)?|compute|solve)\b/i, 4],
  [/^\b(compare|contrast|analyse|analyze|examine|assess|consider)\b/i, 5],
  [/^\b(evaluate|discuss|to\s+what\s+extent|critically\s+assess|argue)\b/i, 6],
]);

function commandWordTariff(stem: string): number | null {
  const trimmed = stem.trim();
  for (const [re, tariff] of COMMAND_WORD_TARIFF) {
    if (re.test(trimmed)) return tariff;
  }
  return null;
}

function sectionMarkTariff(section: PostValidatorSection): number | null {
  const explicit = (section as PostValidatorSection & { marks?: number }).marks;
  if (typeof explicit === "number" && explicit > 0) return explicit;
  const content = typeof section.content === "string" ? section.content : "";
  // First tariff on the stem. Accept both "[N marks]" and "(N marks)" (IMP-06).
  const m = content.match(/[[(](\d+)\s*marks?[\])]/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function enforceMarkAllocationVariety(
  ws: PostValidatorWorksheet,
  _opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];
  const cutoff = getSectionQuestionRange("understanding", false).lastQ;

  // Collect application question indices + their current tariffs + command-word tariffs.
  type AppQ = { idx: number; currentTariff: number | null; commandTariff: number | null };
  const appQuestions: AppQ[] = [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (s.teacherOnly) continue;
    const type = String(s.type || "").toLowerCase();
    if (type === "challenge" || type === "q-challenge") continue;
    const isQuestion =
      type.startsWith("q-") ||
      type === "extended-answer" ||
      type === "lor" ||
      type === "exam-question";
    if (!isQuestion) continue;
    const qn = sectionQuestionNumber(s);
    if (!Number.isFinite(qn) || qn === Number.MAX_SAFE_INTEGER || qn <= cutoff) continue;
    const currentTariff = sectionMarkTariff(s);
    const content = typeof s.content === "string" ? s.content : "";
    const commandTariff = commandWordTariff(content);
    appQuestions.push({ idx: i, currentTariff, commandTariff });
  }

  if (appQuestions.length < 3) {
    return { worksheet: ws, warnings };
  }

  const currentTariffs = appQuestions.map(q => q.currentTariff).filter((t): t is number => t !== null);
  const allSame = currentTariffs.length >= 3 && new Set(currentTariffs).size === 1;

  if (!allSame) {
    // Already varied — nothing to do.
    return { worksheet: ws, warnings };
  }

  // All questions share the same tariff. Check whether command words imply different tariffs.
  const commandTariffs = appQuestions.map(q => q.commandTariff);
  const hasCommandVariety = commandTariffs.filter(t => t !== null).length >= 2 &&
    new Set(commandTariffs.filter(t => t !== null)).size > 1;

  if (!hasCommandVariety) {
    // No detectable command-word variety — warn only, cannot safely re-tariff.
    warnings.push(
      `[RC4/IMP-09] All ${appQuestions.length} Section 3 questions carry an identical tariff of (${currentTariffs[0]} marks). ` +
      `No command-word variety detected to auto-correct. GCSE convention: State/Name=1, Describe/Explain=2-4, Evaluate/Discuss=6. Review manually.`,
    );
    return { worksheet: ws, warnings };
  }

  // Deterministic re-stamp: replace the mark allocation in each question's content
  // with the command-word-derived tariff. Only fires when command words are clear.
  let nextSections = [...sections];
  let reStampedCount = 0;
  for (const q of appQuestions) {
    if (q.commandTariff === null || q.commandTariff === q.currentTariff) continue;
    const s = nextSections[q.idx];
    const content = typeof s.content === "string" ? s.content : "";
    const newTariff = q.commandTariff;
    const wordLabel = newTariff === 1 ? "mark" : "marks";
    // Replace the FIRST mark allocation token in the content.
    const updated = content.replace(
      /[[(](\d+)\s*marks?[\])]/i,
      `(${newTariff} ${wordLabel})`,
    );
    if (updated !== content) {
      nextSections[q.idx] = { ...s, content: updated };
      reStampedCount++;
    }
  }

  if (reStampedCount > 0) {
    warnings.push(
      `[RC4/IMP-09] Re-stamped mark allocations on ${reStampedCount} Section 3 question${reStampedCount === 1 ? "" : "s"} ` +
      `to match command-word tariff table (was: all ${currentTariffs[0]} marks).`,
    );
  } else {
    warnings.push(
      `[RC4/IMP-09] All ${appQuestions.length} Section 3 questions carry an identical tariff of (${currentTariffs[0]} marks). ` +
      `Command-word variety detected but mark tokens could not be updated. Review manually.`,
    );
  }

  return { worksheet: { ...ws, sections: nextSections }, warnings };
}

/**
 * IMP-22 — Common Mistakes topic relevance (warn-only).
 *
 * The audit found a Forces (Physics) worksheet whose "Common Mistakes" block
 * referenced "successive percentage changes" — a Maths concept with nothing to
 * do with the topic. We can't deterministically rewrite a mistake (it needs
 * subject knowledge), so this flags drift: if the Common Mistakes section
 * shares NO keyword with the worksheet's own topic noun-phrase or Key
 * Vocabulary, it is almost certainly off-topic. Pure; never mutates content.
 */
export function enforceCommonMistakesTopicRelevance(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];

  const mistakes = sections.find(s => {
    if (s.teacherOnly) return false;
    const t = String(s.type || "").toLowerCase();
    if (t === "common-mistakes" || t === "common_mistakes") return true;
    const title = String(s.title || "").toLowerCase();
    return /common mistakes|mistakes to avoid/.test(title);
  });
  if (!mistakes) return { worksheet: ws, warnings };
  const content = String(mistakes.content || "").toLowerCase();
  if (!content.trim()) return { worksheet: ws, warnings };

  // Build the keyword set: significant words from the topic + vocabulary terms.
  const topic = (opts.topic || String(ws.metadata?.topic || "")).toLowerCase();
  const vocab = collectVocabularyTerms(ws).map(v => v.toLowerCase());
  const STOP = new Set([
    "the", "and", "for", "with", "this", "that", "from", "into", "your", "are",
    "use", "using", "what", "how", "why", "a", "an", "of", "to", "in", "on",
  ]);
  const keywords = new Set<string>();
  for (const src of [topic, ...vocab]) {
    for (const w of src.split(/[^a-z0-9]+/)) {
      if (w.length >= 4 && !STOP.has(w)) keywords.add(w);
    }
  }
  if (keywords.size === 0) return { worksheet: ws, warnings };

  // Does the mistakes content mention ANY topic/vocab keyword (whole word)?
  const mentionsTopic = [...keywords].some(k =>
    new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(content),
  );
  if (!mentionsTopic) {
    warnings.push(
      `[IMP-22] The "Common Mistakes" section does not mention "${topic || "the topic"}" or any of its key vocabulary — it may reference an unrelated subject/topic (the audit saw "successive percentage changes" on a Forces sheet). Review for topic relevance.`,
    );
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
 * Lane 1.6 + 1.7 — Phase 4 SEND-overlay marker enforcer.
 *
 * Phase 4's audit doc requires specific deterministic markers per SEND
 * need (see `docs/worksheet-generator-audit.md`):
 *
 *   - **HI** — a "Topic Summary" block at the top of Section 1 so deaf
 *     pupils have the same starting knowledge as hearing peers (who
 *     would have heard the teacher introduce the topic). Audit doc
 *     acceptance criterion: "A topic summary block appears at the top
 *     of Section 1 for HI students".
 *   - **Anxiety** — Challenge re-labelled "OPTIONAL BONUS — only if you
 *     want to!" and Section 1 re-labelled to start with "WARM-UP".
 *     Audit doc acceptance criteria: "Anxiety worksheets rename Section
 *     1 to 'WARM-UP (no pressure — you've got this!)'" and "Anxiety
 *     worksheets label the challenge as 'OPTIONAL BONUS'".
 *
 * Before this PR these rules existed only in the prompt fragments
 * (`sendPromptFragments.ts`). The AI was *asked* to insert / rename;
 * nothing checked it actually did. SEND is the USP — the prompts ask,
 * but this validator is the deterministic backstop that means a deaf
 * or anxious pupil never receives a worksheet missing their marker.
 *
 * Behaviours by sendKey:
 *   - "hi" / "hearing-impairment" / "deaf" → ensure a section with type
 *     "topic-summary" titled "Topic Summary — read first" exists
 *     immediately before the first question section. If absent, INSERT
 *     a deterministic synthesis built from the worksheet's existing
 *     Learning Objective + Key Vocabulary sections. We never call the
 *     AI here — synthesis is local and stable.
 *   - "anxiety" / "semh" / "mental-health" → rename the Challenge
 *     section title to "OPTIONAL BONUS — only if you want to!"; rename
 *     any title starting "Section 1" / "SECTION 1" / "Section A" to
 *     prepend "WARM-UP — ".
 *
 * Lane 2.2 — extended to cover the remaining SEND needs the audit
 * doc / `sendPromptFragments.ts` specifies:
 *
 *   - "adhd" → tick-box prefix `"[ ] "` on every pupil-facing
 *     question; brain-break section inserted mid-sheet if missing;
 *     Challenge titled "BONUS — only if you want to!" (note:
 *     different from Anxiety's "OPTIONAL BONUS").
 *   - "dyslexia" → step-by-step method box inserted before Section
 *     A if missing.
 *   - "mld" → topic-context block at top of each pupil-facing
 *     section if missing.
 *   - "dyscalculia" → "Number Steps" cue stamped on every
 *     calculation question that lacks one (the existing
 *     `reinforceDyscalculiaMathsScaffolding` covers maths;
 *     dyscalculia on non-maths sheets still gets working-memory
 *     support).
 *   - "eal" / "esl" → sentence-frame appended to every
 *     extended-response question that doesn't already have one.
 *     The bilingual glossary (Lane 1.5) is additive on top.
 *   - "vi" / "visual-impairment" → diagram-dependent questions
 *     without a text fallback emit a warning (don't auto-rewrite —
 *     diagram description is an LLM job and a wrong fallback is
 *     worse than no fallback).
 *   - "dyspraxia" / "dcd" → Section A is checked for ≥ 3
 *     non-writing answer formats (MCQ / matching / circle); if
 *     fewer, warn. Challenge using extended-writing emits a warning
 *     because Dyspraxia/DCD pupils tire on sustained handwriting.
 *
 * Pure / idempotent — running twice on the same worksheet yields the
 * same result. Every insertion path checks for existing markers
 * before creating new sections. Every rewrite path checks for the
 * literal target wording before mutating.
 *
 * Registered in `worksheetPostValidatorRegistry.ts` BEFORE
 * `enforceSelfReflectionTopicAnchor` so reflection sees the final
 * section titles.
 */
export function enforceSendOverlayMarkers(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const rawSendKey = (opts.sendNeed || String(ws.metadata?.sendNeed || ""))
    .toLowerCase();
  if (!rawSendKey.trim()) return { worksheet: ws, warnings };

  // Lane 2.3 — Stacked-need dispatcher.
  //
  // A `+`, `&` or `,` separator in the sendNeed string (e.g.
  // "hi+eal", "adhd+dyslexia", "anxiety,mld") fans out into one
  // branch per need, applied in deterministic priority order so that:
  //
  //   - Insertions (HI topic-summary, Dyslexia method-box, MLD
  //     topic-context) land before per-question rewrites can see
  //     them.
  //   - Anxiety's threat-softening Challenge title rewrite runs
  //     BEFORE ADHD's, so for a stacked Anxiety+ADHD pupil the
  //     gentler "OPTIONAL BONUS" wording wins via the
  //     `SEND_RENAMED_CHALLENGE_TITLES` first-rename-wins guard
  //     introduced in commit d2d48d8.
  //   - VI and Dyspraxia warn-only audits run last so their
  //     checks see the FINAL post-validated state, not an
  //     intermediate one.
  //
  // Each branch is already pure + idempotent so re-entering this
  // dispatcher per part is safe. Single-need (no separator) takes
  // the fast path below — byte-for-byte equivalent to pre-Lane-2.3
  // behaviour.
  //
  // NOTE: compound detection runs BEFORE the colon-prefix strip
  // below so a value like "send:hi + send:eal" is treated as a
  // compound "send:hi" + "send:eal" (the per-part normaliser then
  // strips "send:" off each individually). If we colon-stripped
  // first the `.split(":").pop()` would collapse the whole string
  // to just "eal".
  if (/[+&,]/.test(rawSendKey)) {
    return runStackedSendMarkers(ws, rawSendKey, opts);
  }

  // Single-need path. Collapse whitespace / underscores to dashes
  // (e.g. "hearing impairment" → "hearing-impairment") and strip
  // any compound prefix like "asc:asc-demand-avoidant" — same
  // normalisation as overlayEngine.applySendSupport.
  const collapsed = rawSendKey.replace(/[\s_]/g, "-");
  const sendKey = collapsed.includes(":")
    ? collapsed.split(":").pop() || collapsed
    : collapsed;
  const sections = ws.sections || [];
  if (sections.length === 0) return { worksheet: ws, warnings };

  // ── HI — Topic Summary block ─────────────────────────────────────────────
  if (sendKey === "hi" || sendKey === "hearing-impairment" || sendKey === "deaf") {
    const summary = enforceHiTopicSummary(ws, sections, warnings, opts);
    return enforceHiInlineDefinitions(
      summary.worksheet,
      summary.worksheet.sections || [],
      summary.warnings,
      opts,
    );
  }

  // ── Anxiety / SEMH — section title rewrites ──────────────────────────────
  if (
    sendKey === "anxiety" ||
    sendKey === "semh" ||
    sendKey === "mental-health" ||
    sendKey === "anxiety-semh"
  ) {
    return enforceAnxietySectionTitles(ws, sections, warnings);
  }

  // ── ADHD — tick-box prefix + brain break + BONUS rename ──────────────────
  if (sendKey === "adhd") {
    return enforceAdhdMarkers(ws, sections, warnings);
  }

  // ── Dyslexia — method-box insertion ──────────────────────────────────────
  if (sendKey === "dyslexia") {
    return enforceDyslexiaMarkers(ws, sections, warnings, opts);
  }

  // ── MLD — topic-context block per section ────────────────────────────────
  if (sendKey === "mld") {
    return enforceMldMarkers(ws, sections, warnings, opts);
  }

  // ── Dyscalculia — Number-Steps cue on calculation questions ──────────────
  if (sendKey === "dyscalculia") {
    return enforceDyscalculiaMarkers(ws, sections, warnings);
  }

  // ── EAL / ESL — sentence frame on extended-response questions ────────────
  if (sendKey === "eal" || sendKey === "esl") {
    return enforceEalMarkers(ws, sections, warnings);
  }

  // ── VI — diagram-dependent question audit (warn-only) ────────────────────
  if (sendKey === "vi" || sendKey === "visual-impairment" || sendKey === "visual") {
    return enforceViMarkers(ws, sections, warnings);
  }

  // ── Dyspraxia / DCD — Section A format + Challenge format audit ──────────
  if (sendKey === "dyspraxia" || sendKey === "dcd") {
    return enforceDyspraxiaMarkers(ws, sections, warnings);
  }

  return { worksheet: ws, warnings };
}

/**
 * Lane 1.6 — HI Topic Summary insertion.
 *
 * Inserts a fresh `topic-summary` section immediately before the first
 * question section if (and only if) one does not already exist. The
 * inserted section is built deterministically from the worksheet's own
 * Learning Objective + Key Vocabulary sections so the pupil sees the
 * same content the teacher would have spoken aloud.
 */
function enforceHiTopicSummary(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
  opts: PostValidatorOptions,
): PostValidatorResult {
  // IMP-16 — a Topic Summary may already exist (AI-generated). If so, do NOT
  // synthesise a second one, but DO guarantee it carries the explicit
  // "TOPIC SUMMARY" heading the audit requires (the AI often titles it
  // "Topic: <subject>" or similar). Normalise the title in place.
  const existingIdx = sections.findIndex(
    s => String(s.type || "").toLowerCase() === "topic-summary" && !s.teacherOnly,
  );
  if (existingIdx >= 0) {
    const existing = sections[existingIdx];
    const title = typeof existing.title === "string" ? existing.title : "";
    if (/topic\s*summary/i.test(title)) return { worksheet: ws, warnings };
    const newTitle = title.trim()
      ? `TOPIC SUMMARY — ${title.trim()}`
      : "TOPIC SUMMARY — read first";
    const nextSections = sections.map((s, i) =>
      i === existingIdx ? { ...s, title: newTitle } : s,
    );
    warnings.push(
      `[Phase 4 — HI] Added the explicit "TOPIC SUMMARY" heading to an existing summary block (was "${title || "(untitled)"}") so a Hearing-Impairment pupil can locate it at a glance.`,
    );
    return { worksheet: { ...ws, sections: nextSections }, warnings };
  }

  // Find the first pupil-facing question section.
  const firstQIdx = sections.findIndex(s => {
    if (s.teacherOnly) return false;
    const t = String(s.type || "").toLowerCase();
    return (
      t.startsWith("q-") ||
      t === "challenge" ||
      t === "extended-answer" ||
      t === "exam-question" ||
      t === "lor"
    );
  });
  if (firstQIdx < 0) return { worksheet: ws, warnings };

  // Synthesise the summary from existing sections — never call the AI.
  const topic = (
    (opts.topic && opts.topic.trim()) ||
    opts_topic_or_metadata(ws) ||
    "this topic"
  );
  const lo = findFirstSectionContent(sections, [
    "objective",
    "learning-objective",
    "learning_objective",
    "lo",
  ]);
  const vocabRaw = findFirstSectionContent(sections, [
    "vocabulary",
    "key-vocabulary",
    "key-terms",
    "key-vocab",
    "glossary",
  ]);
  const vocabTerms = vocabRaw ? extractVocabularyTerms(vocabRaw) : [];

  const lines: string[] = [];
  lines.push(`Topic: ${topic}`);
  if (lo && lo.trim()) {
    lines.push("");
    lines.push(`Learning objective: ${lo.trim()}`);
  }
  if (vocabTerms.length > 0) {
    lines.push("");
    lines.push("Key terms used in this worksheet:");
    for (const term of vocabTerms.slice(0, 5)) {
      lines.push(`- ${term}`);
    }
  }
  lines.push("");
  lines.push(
    "This information is here because you may not have heard all of " +
      "the teacher's spoken explanation. Read it carefully before you " +
      "start the questions — every detail you need is on the page.",
  );

  const newSection: PostValidatorSection = {
    id: `topic-summary-hi-${firstQIdx}`,
    type: "topic-summary",
    title: "TOPIC SUMMARY — read first",
    content: lines.join("\n"),
    teacherOnly: false,
  };

  const nextSections = [
    ...sections.slice(0, firstQIdx),
    newSection,
    ...sections.slice(firstQIdx),
  ];
  warnings.push(
    "[Phase 4 — HI] Topic Summary block was missing for a Hearing-Impairment worksheet; " +
      "inserted deterministically from Learning Objective + Key Vocabulary so a deaf pupil " +
      "has the same starting knowledge as a hearing peer.",
  );
  return { worksheet: { ...ws, sections: nextSections }, warnings };
}

/**
 * IMP-11 — HI inline definitions.
 *
 * Hearing-impaired pupils may have missed the teacher's spoken gloss of a
 * technical term, so the Key Vocabulary box at the top is not enough: they
 * need the definition at point of use. This injects a short `(= plain
 * definition)` annotation on the FIRST occurrence of each Key-Vocabulary term
 * within each pupil-facing question, sourced from the worksheet's own
 * vocabulary box (never the AI). Idempotent (skips a term already annotated)
 * and preprocessor-safe (definitions are short prose with no leading digits).
 * Skips structured items (gap-fill / true-false) whose fixed layout would be
 * cluttered by inline glosses.
 */
function extractVocabularyDefinitions(content: string): Array<{ term: string; definition: string }> {
  return content
    .split(/\n+/)
    .map(line => line.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .map(line => {
      const m = line.match(/^([^:|–—-]{2,60})\s*[:|–—-]\s*(.+)$/);
      if (!m) return null;
      const term = m[1].trim();
      // Keep the gloss short so the inline annotation stays readable; trim a
      // trailing full stop and any "(unit)" tail.
      let definition = m[2].trim().replace(/\s*\([^)]*\)\s*$/, "").replace(/[.;]+$/, "").trim();
      if (definition.length > 70) definition = definition.slice(0, 67).trimEnd() + "…";
      return term.length > 1 && definition.length > 1 ? { term, definition } : null;
    })
    .filter((d): d is { term: string; definition: string } => d !== null);
}

function enforceHiInlineDefinitions(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
  _opts: PostValidatorOptions,
): PostValidatorResult {
  const vocabRaw = findFirstSectionContent(sections, [
    "vocabulary",
    "key-vocabulary",
    "key-terms",
    "key-vocab",
    "glossary",
  ]);
  if (!vocabRaw) return { worksheet: ws, warnings };

  // Longest term first so "aerobic respiration" is matched before "respiration".
  const defs = extractVocabularyDefinitions(vocabRaw).sort(
    (a, b) => b.term.length - a.term.length,
  );
  if (defs.length === 0) return { worksheet: ws, warnings };

  let annotatedTotal = 0;
  let questionsTouched = 0;
  const ANNOTATABLE_TYPES = new Set([
    "q-short-answer", "q-extended", "exam-question", "extended-answer", "q-mcq", "challenge", "q-challenge",
  ]);

  const next = sections.map(s => {
    if (s.teacherOnly) return s;
    const type = String(s.type || "").toLowerCase();
    if (!ANNOTATABLE_TYPES.has(type)) return s;
    let content = typeof s.content === "string" ? s.content : "";
    if (!content.trim()) return s;

    let changedHere = false;
    for (const { term, definition } of defs) {
      const escaped = escapeRegExpLiteral(term);
      // Already annotated for this term in the section? Skip. Word-boundaried
      // so "aerobic respiration" is not considered annotated just because
      // "anaerobic respiration (= …)" contains it as a substring.
      if (new RegExp(`\\b${escaped}\\b\\s*\\(=`, "i").test(content)) continue;
      const firstOccurrence = new RegExp(`\\b${escaped}\\b`, "i");
      if (!firstOccurrence.test(content)) continue;
      // Inject on the FIRST occurrence only. Function replacement avoids any
      // `$` in the definition being treated as a back-reference.
      content = content.replace(firstOccurrence, (m) => `${m} (= ${definition})`);
      changedHere = true;
      annotatedTotal++;
    }
    if (!changedHere) return s;
    questionsTouched++;
    return { ...s, content };
  });

  if (annotatedTotal > 0) {
    warnings.push(
      `[Phase 4 — HI] Injected ${annotatedTotal} inline "(= definition)" annotation${annotatedTotal === 1 ? "" : "s"} across ${questionsTouched} question${questionsTouched === 1 ? "" : "s"} so a deaf pupil meets each key term's meaning at the point of use (IMP-11).`,
    );
  }
  if (annotatedTotal === 0) return { worksheet: ws, warnings };
  return { worksheet: { ...ws, sections: next }, warnings };
}

/**
 * Lane 1.7 — Anxiety section title rewrites.
 *
 * Renames the Challenge section to "OPTIONAL BONUS — only if you want
 * to!" and any "Section 1" / "Section A" titled section to prepend
 * "WARM-UP — ". Idempotent: a second pass detects the target wording
 * and skips. Never touches `id`, `type`, `content`, `marks`, `imageUrl`
 * or `assetRef` — only the `title` field.
 */
const ANXIETY_OPTIONAL_BONUS_TITLE = "OPTIONAL BONUS — only if you want to!";
const ANXIETY_WARMUP_PREFIX = "WARM-UP — no pressure!";

function enforceAnxietySectionTitles(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
): PostValidatorResult {
  let mutated = false;
  const next = sections.map(s => {
    if (s.teacherOnly) return s;
    const title = typeof s.title === "string" ? s.title : "";
    const type = String(s.type || "").toLowerCase();

    // Challenge — rename whole title (idempotent).
    if (type === "challenge" || type === "q-challenge" || /^challenge\b/i.test(title)) {
      if (title === ANXIETY_OPTIONAL_BONUS_TITLE) return s;
      // Lane 2.3 — also skip if a different SEND need has already
      // softened the title; whichever rename ships first wins.
      if (SEND_RENAMED_CHALLENGE_TITLES.has(title)) return s;
      mutated = true;
      warnings.push(
        `[Phase 4 — Anxiety] Renamed challenge title "${title || "(untitled)"}" → "${ANXIETY_OPTIONAL_BONUS_TITLE}" to remove threat-language for an Anxiety/SEMH worksheet.`,
      );
      return { ...s, title: ANXIETY_OPTIONAL_BONUS_TITLE };
    }

    // Section 1 / Section A — prepend the WARM-UP banner (idempotent).
    if (
      /^section\s*(1|a|i)\b/i.test(title) &&
      !title.toUpperCase().startsWith("WARM-UP")
    ) {
      const newTitle = `${ANXIETY_WARMUP_PREFIX} (${title.trim()})`;
      mutated = true;
      warnings.push(
        `[Phase 4 — Anxiety] Renamed "${title}" → "${newTitle}" so the opening section reads as invitational for an Anxiety/SEMH worksheet.`,
      );
      return { ...s, title: newTitle };
    }

    return s;
  });

  if (!mutated) return { worksheet: ws, warnings };
  return { worksheet: { ...ws, sections: next }, warnings };
}

/**
 * Lane 2.2 — ADHD markers.
 *
 * Three deterministic rules:
 *   1. Every pupil-facing question content begins with `"[ ] "` (open
 *      square-bracket, space, close square-bracket, space) — the
 *      visible tick-box that gives ADHD pupils the dopamine hit of
 *      ticking off completed work. If absent, prepend.
 *   2. A brain-break section exists somewhere in the middle of the
 *      pupil-facing flow. Detection: any section whose content
 *      contains "BRAIN BREAK" (case-insensitive). If absent, INSERT a
 *      send-support section after the median question.
 *   3. The Challenge section is titled `"BONUS — only if you want
 *      to!"` (note: ADHD uses "BONUS"; Anxiety uses "OPTIONAL BONUS"
 *      — different by design per `sendPromptFragments.ts`).
 *
 * Idempotent: every check looks for the target marker before
 * mutating.
 */
const ADHD_BONUS_TITLE = "BONUS — only if you want to!";
const ADHD_TICK_PREFIX = "[ ] ";
const ADHD_BRAIN_BREAK_LINE =
  "🧠 BRAIN BREAK — stand up and stretch for 30 seconds before continuing!";

/**
 * Lane 2.3 — Set of titles that any SEND need's marker enforcer has
 * already softened. When a worksheet is generated for a pupil with
 * stacked SEND needs, the post-validator runs once per need in
 * sequence; we don't want a later pass to clobber an earlier pass's
 * softened title (e.g. ADHD overwriting Anxiety's "OPTIONAL BONUS"
 * with its own "BONUS"). Whichever rename ships first wins. */
const SEND_RENAMED_CHALLENGE_TITLES = new Set([
  "OPTIONAL BONUS — only if you want to!", // Anxiety / SEMH
  ADHD_BONUS_TITLE,                          // ADHD
]);

function enforceAdhdMarkers(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
): PostValidatorResult {
  let mutated = false;
  let prefixedCount = 0;
  let renamedChallenge = false;

  // Walk sections; (a) prefix tick-box on questions, (b) rename
  // Challenge title.
  let next: PostValidatorSection[] = sections.map(s => {
    if (s.teacherOnly) return s;
    const type = String(s.type || "").toLowerCase();
    const isQuestion =
      type.startsWith("q-") ||
      type === "challenge" ||
      type === "q-challenge" ||
      type === "extended-answer" ||
      type === "exam-question" ||
      type === "lor";
    let updated = s;
    let didMutate = false;

    // (a) Tick-box prefix on every question's content.
    if (isQuestion && typeof s.content === "string") {
      const content = s.content;
      // Idempotent: skip if already prefixed (most reliable signal —
      // first non-blank line starts with "[ ] ").
      const firstLine = (content.split("\n").find(l => l.trim()) || "").trim();
      if (!firstLine.startsWith(ADHD_TICK_PREFIX.trim())) {
        updated = { ...updated, content: `${ADHD_TICK_PREFIX}${content}` };
        didMutate = true;
        prefixedCount++;
      }
    }

    // (b) Challenge title rename.
    const title = typeof updated.title === "string" ? updated.title : "";
    if (
      (type === "challenge" || type === "q-challenge" || /^challenge\b/i.test(title)) &&
      title !== ADHD_BONUS_TITLE &&
      !SEND_RENAMED_CHALLENGE_TITLES.has(title)
    ) {
      updated = { ...updated, title: ADHD_BONUS_TITLE };
      didMutate = true;
      renamedChallenge = true;
    }

    if (didMutate) mutated = true;
    return updated;
  });

  // (c) Brain-break sections: IMP-12 — scale the number of movement breaks to
  // the worksheet length and space them evenly. A single fixed break is not
  // enough for a 15+ question sheet; ADHD attention benefits from a break
  // roughly every quarter. Targets: <10 Qs → 1 break, 10-15 → 2, 16+ → 3
  // (and none for very short sheets of <4 Qs). Existing breaks are honoured —
  // we only top up to the target and never place a new break within 3
  // questions of an existing one.
  const questionIndices: number[] = [];
  next.forEach((s, idx) => {
    if (s.teacherOnly) return;
    const t = String(s.type || "").toLowerCase();
    if (
      t.startsWith("q-") ||
      t === "challenge" ||
      t === "extended-answer" ||
      t === "exam-question" ||
      t === "lor"
    ) {
      questionIndices.push(idx);
    }
  });
  const nQuestions = questionIndices.length;
  const targetBreaks = nQuestions < 4 ? 0 : nQuestions < 10 ? 1 : nQuestions <= 15 ? 2 : 3;

  // Ordinal (1-based position in the question stream) of every existing break,
  // approximated by how many question sections precede it.
  const existingBreakOrdinals: number[] = [];
  next.forEach((s, idx) => {
    if (typeof s.content === "string" && /brain\s*break/i.test(s.content)) {
      const ordinal = questionIndices.filter((qi) => qi < idx).length;
      existingBreakOrdinals.push(ordinal);
    }
  });

  if (targetBreaks > 0 && existingBreakOrdinals.length < targetBreaks) {
    // Evenly spaced desired ordinals: e.g. target 3 over 16 Qs → after Q4, Q8, Q12.
    const desiredOrdinals = Array.from({ length: targetBreaks }, (_, j) =>
      Math.max(1, Math.min(nQuestions - 1, Math.round((nQuestions * (j + 1)) / (targetBreaks + 1)))),
    );
    const chosenOrdinals: number[] = [];
    const tooClose = (o: number) =>
      existingBreakOrdinals.some((e) => Math.abs(e - o) < 3) ||
      chosenOrdinals.some((c) => Math.abs(c - o) < 3);
    for (const o of desiredOrdinals) {
      if (existingBreakOrdinals.length + chosenOrdinals.length >= targetBreaks) break;
      if (!tooClose(o)) chosenOrdinals.push(o);
    }

    if (chosenOrdinals.length > 0) {
      // Map each chosen ordinal to the section index it should follow, then
      // rebuild the array in one pass so shifting indices never corrupt
      // placement.
      const insertAfterSectionIdx = new Set(
        chosenOrdinals.map((o) => questionIndices[o - 1]),
      );
      const rebuilt: PostValidatorSection[] = [];
      next.forEach((s, idx) => {
        rebuilt.push(s);
        if (insertAfterSectionIdx.has(idx)) {
          rebuilt.push({
            id: `brain-break-adhd-${idx}`,
            type: "send-support",
            title: "Brain break",
            content: ADHD_BRAIN_BREAK_LINE,
            teacherOnly: false,
          });
        }
      });
      next = rebuilt;
      mutated = true;
      warnings.push(
        `[Phase 4 — ADHD] Inserted ${chosenOrdinals.length} brain-break${chosenOrdinals.length === 1 ? "" : "s"} ` +
          `(target ${targetBreaks} for ${nQuestions} questions) so an ADHD pupil gets a movement checkpoint roughly every quarter.`,
      );
    }
  }

  if (prefixedCount > 0) {
    warnings.push(
      `[Phase 4 — ADHD] Prepended tick-box "[ ] " to ${prefixedCount} question${prefixedCount === 1 ? "" : "s"} that lacked one — visible progress tracking sustains ADHD attention.`,
    );
  }
  if (renamedChallenge) {
    warnings.push(
      `[Phase 4 — ADHD] Renamed Challenge title to "${ADHD_BONUS_TITLE}" so the extension reads as optional, not as a graded demand.`,
    );
  }

  if (!mutated) return { worksheet: ws, warnings };
  return { worksheet: { ...ws, sections: next }, warnings };
}

/**
 * Lane 2.2 — Dyslexia markers.
 *
 * One deterministic rule (the cosmetic ones — line-height, bold first
 * use of subject terms — live in the renderer / overlay engine):
 *
 *   1. A "Method steps" box exists immediately before the first
 *      question section so the dyslexic pupil has a visible reference
 *      while answering. If absent, INSERT one synthesised from the
 *      worked-example or learning-objective content. Never calls the
 *      AI.
 */
function enforceDyslexiaMarkers(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
  opts: PostValidatorOptions,
): PostValidatorResult {
  // Already present? No-op. Detection: section type contains "method"
  // OR title contains "method steps" / "step-by-step".
  const hasMethodBox = sections.some(s => {
    if (s.teacherOnly) return false;
    const t = String(s.type || "").toLowerCase();
    const title = String(s.title || "").toLowerCase();
    return (
      t === "method-box" ||
      t === "method-steps" ||
      /method\s*step|step[-\s]by[-\s]step/i.test(title)
    );
  });
  if (hasMethodBox) return { worksheet: ws, warnings };

  // Find the first pupil-facing question section.
  const firstQIdx = sections.findIndex(s => {
    if (s.teacherOnly) return false;
    const t = String(s.type || "").toLowerCase();
    return (
      t.startsWith("q-") ||
      t === "challenge" ||
      t === "extended-answer" ||
      t === "exam-question" ||
      t === "lor"
    );
  });
  if (firstQIdx < 0) return { worksheet: ws, warnings };

  // Synthesise from worked example > LO > generic fallback.
  const workedExample = findFirstSectionContent(sections, [
    "example",
    "worked-example",
    "worked_example",
  ]);
  const lo = findFirstSectionContent(sections, [
    "objective",
    "learning-objective",
    "learning_objective",
    "lo",
  ]);

  const lines: string[] = [];
  lines.push("Method steps — refer back to this while you work:");
  lines.push("");
  if (workedExample && workedExample.trim()) {
    // Pull numbered/Step lines from the worked example, capped at 5.
    const steps = workedExample
      .split("\n")
      .map(l => l.trim())
      .filter(l => /^(?:step\s*\d+|^\d+[.)])/i.test(l))
      .slice(0, 5);
    if (steps.length > 0) {
      for (const step of steps) lines.push(`- ${step.replace(/^step\s*\d+\s*[:.\-]?\s*/i, "Step: ")}`);
    } else {
      // No structured steps — emit a 3-line skeleton.
      lines.push("- Step 1: Read the question carefully.");
      lines.push("- Step 2: Use the worked example above as your guide.");
      lines.push("- Step 3: Check your answer makes sense before moving on.");
    }
  } else if (lo && lo.trim()) {
    lines.push(`- Goal: ${lo.trim()}`);
    lines.push("- Step 1: Read each question once before you start writing.");
    lines.push("- Step 2: Use the worked example or word bank if you need to.");
    lines.push("- Step 3: Check your answer makes sense before moving on.");
  } else {
    const topic =
      (opts.topic && opts.topic.trim()) ||
      opts_topic_or_metadata(ws) ||
      "this topic";
    lines.push(`- Goal: work through the questions on ${topic}.`);
    lines.push("- Step 1: Read each question once before you start writing.");
    lines.push("- Step 2: Look at the word bank for any tricky terms.");
    lines.push("- Step 3: Check your answer matches the question asked.");
  }

  const newSection: PostValidatorSection = {
    id: `method-steps-dyslexia-${firstQIdx}`,
    type: "method-box",
    title: "Method steps — keep this in view",
    content: lines.join("\n"),
    teacherOnly: false,
  };

  const next = [
    ...sections.slice(0, firstQIdx),
    newSection,
    ...sections.slice(firstQIdx),
  ];
  warnings.push(
    "[Phase 4 — Dyslexia] Method-steps box was missing for a Dyslexia worksheet; " +
      "inserted deterministically so the pupil has a working-memory reference while answering.",
  );
  return { worksheet: { ...ws, sections: next }, warnings };
}

/**
 * Lane 2.2 — MLD markers.
 *
 * One deterministic rule:
 *   1. A topic-context block exists at the top of the pupil-facing
 *      flow so MLD pupils have an explicit, written reminder of what
 *      they are working on. Detection: section before the first
 *      question with type "topic-context" or "topic-summary" (HI
 *      pupils get this too — we don't double-insert if HI's
 *      topic-summary is already there). If absent, INSERT one.
 */
function enforceMldMarkers(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
  opts: PostValidatorOptions,
): PostValidatorResult {
  let working = sections;
  let mutated = false;

  // (a) Topic-context working-memory anchor — insert if missing.
  const hasContextBlock = sections.some(s => {
    if (s.teacherOnly) return false;
    const t = String(s.type || "").toLowerCase();
    return t === "topic-context" || t === "topic-summary";
  });

  const firstQIdx = working.findIndex(s => {
    if (s.teacherOnly) return false;
    const t = String(s.type || "").toLowerCase();
    return (
      t.startsWith("q-") ||
      t === "challenge" ||
      t === "extended-answer" ||
      t === "exam-question" ||
      t === "lor"
    );
  });

  if (!hasContextBlock && firstQIdx >= 0) {
    const topic =
      (opts.topic && opts.topic.trim()) ||
      opts_topic_or_metadata(ws) ||
      "this topic";
    const lo = findFirstSectionContent(sections, [
      "objective",
      "learning-objective",
      "learning_objective",
      "lo",
    ]);

    const lines: string[] = [];
    lines.push(`Remember: in this worksheet we are working on ${topic}.`);
    if (lo && lo.trim()) {
      lines.push("");
      lines.push(`What we are learning today: ${lo.trim()}`);
    }
    lines.push("");
    lines.push("Tips while you work:");
    lines.push("- Take your time on each question.");
    lines.push("- Check the word bank or worked example if you get stuck.");
    lines.push("- It is OK to ask your teacher if a word is unfamiliar.");

    const newSection: PostValidatorSection = {
      id: `topic-context-mld-${firstQIdx}`,
      type: "topic-context",
      title: "What we are working on",
      content: lines.join("\n"),
      teacherOnly: false,
    };

    working = [
      ...working.slice(0, firstQIdx),
      newSection,
      ...working.slice(firstQIdx),
    ];
    mutated = true;
    warnings.push(
      "[Phase 4 — MLD] Topic-context block was missing for an MLD worksheet; " +
        "inserted deterministically so the pupil has a working-memory anchor while answering.",
    );
  }

  // (b) IMP-14 — formula HELP BOX on calculation questions. MLD pupils carry a
  // smaller working-memory load, so a dedicated reminder to write the formula
  // before substituting numbers offloads the method. Idempotent (skips a
  // question that already shows a HELP BOX). Preprocessor-safe (no bare
  // numbers).
  let helpBoxCount = 0;
  working = working.map(s => {
    if (s.teacherOnly) return s;
    const type = String(s.type || "").toLowerCase();
    const isQuestion =
      type.startsWith("q-") ||
      type === "challenge" ||
      type === "extended-answer" ||
      type === "exam-question";
    if (!isQuestion) return s;
    const content = typeof s.content === "string" ? s.content : "";
    if (!content.trim()) return s;
    if (/HELP BOX/i.test(content)) return s;
    if (!isCalculationQuestionText(content)) return s;
    const helpBox =
      "\n\nHELP BOX: write the formula you need at the top, then put in the numbers from the question one at a time. Check the worked example if you are not sure which formula to use.";
    helpBoxCount++;
    return { ...s, content: content + helpBox };
  });
  if (helpBoxCount > 0) {
    mutated = true;
    warnings.push(
      `[Phase 4 — MLD] Added a formula HELP BOX to ${helpBoxCount} calculation question${helpBoxCount === 1 ? "" : "s"} so the pupil does not have to hold the method in working memory (IMP-14).`,
    );
  }

  if (!mutated) return { worksheet: ws, warnings };
  return { worksheet: { ...ws, sections: working }, warnings };
}

/**
 * Lane 2.2 — Dyscalculia markers.
 *
 * One deterministic rule:
 *   1. Every pupil-facing question whose content contains a number
 *      gets a "Numbers in this question" cue appended unless one
 *      already exists. The full 5-step calculation recipe is handled
 *      by `reinforceDyscalculiaMathsScaffolding` (maths only); this
 *      validator covers non-maths sheets where dyscalculia is still
 *      reported (e.g. Y10 Geography rivers — discharge calculations,
 *      data tables) so the pupil still gets a number-aware highlight.
 *
 * Idempotent: skips questions that already contain "Numbers in this
 * question" or "Number Steps".
 */
function enforceDyscalculiaMarkers(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
): PostValidatorResult {
  let mutated = false;
  let cuedCount = 0;
  let recipeCount = 0;
  // IMP-13 — science-adapted 5-step calculation recipe. The maths-only
  // `reinforceDyscalculiaMathsScaffolding` never touched Science sheets, so a
  // dyscalculic pupil tackling a Physics/Chemistry calculation had no method
  // scaffold. We add one ONLY to calculation questions (so prose/recall
  // questions stay uncluttered). Format is preprocessor-safe: every step
  // number sits after "Step " (a space, not a split delimiter) and is followed
  // by ":" (not "."/")"/space), so the renderer never mis-reads a step as a
  // new numbered question.
  const DYSCALCULIA_CALC_RECIPE = [
    "Calculation steps to follow:",
    "Step 1: write down the formula you need.",
    "Step 2: find the values given in the question.",
    "Step 3: put the values into the formula.",
    "Step 4: work it out, one line of working at a time.",
    "Step 5: write your answer with the correct units.",
  ].join("\n");
  const isCalculationQuestion = (text: string): boolean => isCalculationQuestionText(text);
  const next = sections.map(s => {
    if (s.teacherOnly) return s;
    const type = String(s.type || "").toLowerCase();
    const isQuestion =
      type.startsWith("q-") ||
      type === "challenge" ||
      type === "extended-answer" ||
      type === "exam-question";
    if (!isQuestion) return s;
    const content = typeof s.content === "string" ? s.content : "";
    if (!content.trim()) return s;
    // Skip if a sibling Number Steps / Numbers cue / recipe already exists.
    if (/numbers\s+in\s+this\s+question|number\s+steps|calculation steps to follow/i.test(content)) return s;
    const isCalc = isCalculationQuestion(content);
    // Detect any digit (decimal, fraction, integer).
    const numbers = content.match(/-?\d+(?:\.\d+)?/g);
    let addition = "";
    if (numbers && numbers.length > 0) {
      const uniqueNumbers = Array.from(new Set(numbers)).slice(0, 6);
      // IMP-02 — preprocessor-safe cue format. The renderer's numbered-question
      // pre-processor splits on "<delimiter><number><.)/space>" patterns to
      // separate bunched questions. The previous cue ("…: 1, 2, 3. Underline…")
      // put bare numbers straight after a colon / comma, so the trailing
      // "3. Underline" was rewritten into a spurious numbered item — duplicating
      // question numbers and inflating section counts. We now (a) keep the
      // numbers AFTER the explanatory text and (b) wrap each in single quotes so
      // no number is ever immediately preceded by a split delimiter or followed
      // by a "."/")"/space. The renderer also renders this line as a dedicated
      // callout (see WorksheetRenderer formatContent) so it is never treated as
      // question content. The literal substring "Numbers in this question" is
      // preserved for downstream detection / idempotency.
      const numberList = uniqueNumbers.map((n) => `'${n}'`).join(", ");
      addition += `\n\nNumbers in this question to underline as you read so you do not lose them: ${numberList}`;
      cuedCount++;
    }
    if (isCalc) {
      addition += `\n\n${DYSCALCULIA_CALC_RECIPE}`;
      recipeCount++;
    }
    if (!addition) return s;
    mutated = true;
    return { ...s, content: content + addition };
  });

  if (cuedCount > 0) {
    warnings.push(
      `[Phase 4 — Dyscalculia] Appended a "Numbers in this question" cue to ${cuedCount} question${cuedCount === 1 ? "" : "s"} so the pupil can anchor each digit before reasoning about it.`,
    );
  }
  if (recipeCount > 0) {
    warnings.push(
      `[Phase 4 — Dyscalculia] Added a 5-step calculation recipe to ${recipeCount} calculation question${recipeCount === 1 ? "" : "s"} so a dyscalculic pupil has an explicit method scaffold (IMP-13).`,
    );
  }

  if (!mutated) return { worksheet: ws, warnings };
  return { worksheet: { ...ws, sections: next }, warnings };
}

/**
 * Lane 2.2 — EAL / ESL markers.
 *
 * One deterministic rule:
 *   1. Every pupil-facing extended-response question gets a
 *      "Sentence frame:" line appended unless one already exists.
 *      EAL pupils often have the knowledge but lack the syntactic
 *      scaffolding to express it; a frame removes the language
 *      barrier without simplifying the assessed skill.
 *
 * The bilingual glossary (Lane 1.5) is additive — it lives on the
 * Key Vocabulary section, not on individual questions. Per-section
 * Key Vocabulary boxes are a Lane 3 follow-up.
 *
 * Idempotent: skips questions that already contain "Sentence frame"
 * or "Frame:" or a generic starter pattern.
 */
function enforceEalMarkers(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
): PostValidatorResult {
  let mutated = false;
  let framedCount = 0;
  let next = sections.map(s => {
    if (s.teacherOnly) return s;
    const type = String(s.type || "").toLowerCase();
    // Only frame extended / short-answer questions — MCQs / matching /
    // gap-fill etc. own their own answer affordance.
    const isWritten =
      type === "q-extended" ||
      type === "extended-answer" ||
      type === "q-short-answer" ||
      type === "q-short" ||
      type === "exam-question" ||
      type === "lor" ||
      type === "challenge";
    if (!isWritten) return s;
    const content = typeof s.content === "string" ? s.content : "";
    if (!content.trim()) return s;
    // Idempotent: skip if a sentence frame is already present.
    if (/sentence\s+frame|^frame\s*:|starter\s*:/im.test(content)) return s;
    // Pick a frame appropriate to the command word in the stem.
    const stemLower = content.toLowerCase();
    let frame: string;
    if (/\b(calculate|work\s+out|find|solve|determine)\b/.test(stemLower)) {
      frame = "Sentence frame: The answer is ___ because ___.";
    } else if (/\b(explain|why|because)\b/.test(stemLower)) {
      frame = "Sentence frame: This happens because ___. This shows that ___.";
    } else if (/\b(compare|contrast)\b/.test(stemLower)) {
      frame = "Sentence frame: Both ___ and ___ are similar because ___. They are different because ___.";
    } else if (/\b(describe|state|identify)\b/.test(stemLower)) {
      frame = "Sentence frame: ___ is ___. One example is ___.";
    } else if (/\b(evaluate|justify|discuss)\b/.test(stemLower)) {
      frame = "Sentence frame: One reason for ___ is ___. However, ___. Overall, I think ___ because ___.";
    } else {
      frame = "Sentence frame: The answer is ___ because ___.";
    }
    framedCount++;
    mutated = true;
    return { ...s, content: `${content}\n\n${frame}` };
  });

  if (framedCount > 0) {
    warnings.push(
      `[Phase 4 — EAL] Appended a sentence frame to ${framedCount} written-response question${framedCount === 1 ? "" : "s"} so the pupil has scaffolding to express what they know.`,
    );
  }

  // IMP-15 — command-word decoder. EAL pupils may know the content but not the
  // exam verb. Insert a compact decoder box before the first question if one is
  // not already present. (The bilingual glossary is intentionally NOT
  // synthesised here — it needs the pupil's home language, which the
  // post-validator does not have; it remains an additive, data-driven feature.)
  const hasDecoder = next.some(
    s => /command\s*word/i.test(String(s.title || "")) || /command words —/i.test(String(s.content || "")),
  );
  const firstQIdx = next.findIndex(s => {
    if (s.teacherOnly) return false;
    const t = String(s.type || "").toLowerCase();
    return (
      t.startsWith("q-") ||
      t === "challenge" ||
      t === "extended-answer" ||
      t === "exam-question" ||
      t === "lor"
    );
  });
  if (!hasDecoder && firstQIdx >= 0) {
    const decoder: PostValidatorSection = {
      id: `command-word-decoder-eal-${firstQIdx}`,
      type: "send-support",
      title: "Command words — what the question is asking you to do",
      content: [
        "Command words — what the question is asking you to do:",
        "Describe — say what something is like, using details.",
        "Explain — say how or why something happens.",
        "Compare — say what is the same and what is different.",
        "Calculate — work out a number and show your working.",
        "Evaluate — give both sides, then say what you think and why.",
      ].join("\n"),
      teacherOnly: false,
    };
    next = [
      ...next.slice(0, firstQIdx),
      decoder,
      ...next.slice(firstQIdx),
    ];
    mutated = true;
    warnings.push(
      "[Phase 4 — EAL] Inserted a command-word decoder box so the pupil can translate the exam verb before answering (IMP-15).",
    );
  }

  if (!mutated) return { worksheet: ws, warnings };
  return { worksheet: { ...ws, sections: next }, warnings };
}

/**
 * Lane 2.2 — VI markers.
 *
 * Warn-only. We do NOT auto-rewrite diagram alt-text — a wrong
 * fallback is worse than no fallback for a screen-reader user. Two
 * checks:
 *   1. Any pupil-facing question whose stem references "the diagram"
 *      / "shown above" / "label X on the diagram" should have a text
 *      description elsewhere in the worksheet (a non-empty caption,
 *      altText, or a sibling section with type "diagram-description").
 *      If not, warn.
 *   2. Any diagram section with empty or missing alt-text raises a
 *      separate warning so the teacher can fix it before printing.
 */
function enforceViMarkers(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
): PostValidatorResult {
  let qNum = 0;
  for (const s of sections) {
    if (s.teacherOnly) continue;
    const type = String(s.type || "").toLowerCase();
    const isQuestion =
      type.startsWith("q-") ||
      type === "challenge" ||
      type === "extended-answer" ||
      type === "exam-question" ||
      type === "lor";
    if (!isQuestion) continue;
    qNum++;
    const content = typeof s.content === "string" ? s.content : "";
    if (!content.trim()) continue;
    // Diagram-dependent stem signals.
    const referencesDiagram = /\b(?:the\s+diagram|shown\s+above|in\s+the\s+image|in\s+the\s+figure|label\s+(?:the\s+)?diagram)\b/i.test(content);
    if (!referencesDiagram) continue;
    // Look for a sibling diagram section with a useful text equivalent.
    const hasTextEquivalent = sections.some(other => {
      const ot = String(other.type || "").toLowerCase();
      const isDiagramish = ot.includes("diagram") || ot === "topic-summary";
      if (!isDiagramish) return false;
      const cap = String((other as { caption?: string }).caption || "").trim();
      const alt = String((other as { altText?: string }).altText || "").trim();
      const desc = String(other.content || "").trim();
      return cap.length > 20 || alt.length > 20 || desc.length > 80;
    });
    if (!hasTextEquivalent) {
      warnings.push(
        `[Phase 4 — VI] Q${qNum} references "the diagram" but no text equivalent (caption / altText / description ≥ 20 chars) was found on any diagram section. A VI pupil cannot answer this question via screen reader. Add a written description before printing.`,
      );
    }
  }

  for (const s of sections) {
    if (s.teacherOnly) continue;
    const type = String(s.type || "").toLowerCase();
    if (!type.includes("diagram")) continue;
    const cap = String((s as { caption?: string }).caption || "").trim();
    const alt = String((s as { altText?: string }).altText || "").trim();
    if (cap.length === 0 && alt.length === 0) {
      warnings.push(
        `[Phase 4 — VI] Diagram section "${s.title || s.type}" has no caption or altText. Add a one-sentence description before printing so a screen-reader pupil can access the visual content.`,
      );
    }
  }

  return { worksheet: ws, warnings };
}

/**
 * Lane 2.2 — Dyspraxia / DCD markers.
 *
 * Warn-only. Two audits — neither auto-rewrites because the right
 * answer is an LLM rewrite (changing a question format on the fly
 * could break its assessment validity).
 *
 *   1. Section A (recall) should use a non-writing format (MCQ /
 *      matching / true-false / circle-the-answer / gap-fill) for at
 *      least 3 questions to reduce the handwriting burden.
 *   2. The Challenge section should use a tick / circle / label
 *      format, not extended writing — sustained handwriting is
 *      fatiguing for DCD pupils.
 */
const DYSPRAXIA_NON_WRITING_TYPES = new Set([
  "q-mcq",
  "mcq",
  "q-true-false",
  "true-false",
  "true_false",
  "q-matching",
  "matching",
  "q-gap-fill",
  "gap-fill",
  "cloze",
  "q-label-diagram",
  "label-diagram",
  "q-ordering",
  "ordering",
]);

function enforceDyspraxiaMarkers(
  ws: PostValidatorWorksheet,
  sections: PostValidatorSection[],
  warnings: string[],
): PostValidatorResult {
  // Audit 1 — Section A non-writing question count.
  let recallCount = 0;
  let recallNonWritingCount = 0;
  for (const s of sections) {
    if (s.teacherOnly) continue;
    const type = String(s.type || "").toLowerCase();
    const title = String(s.title || "");
    // A "recall" question is one in the Phase-1 recall range OR with
    // a Section-A title.
    const titleN = title.match(/Q(\d+)/i);
    const qn = titleN ? parseInt(titleN[1], 10) : NaN;
    const inRecallRange =
      Number.isFinite(qn) && qn >= 1 && qn <= SECTION_QUESTION_TARGETS.recall.max;
    const isSectionA = /^section\s*(?:1|a)\b/i.test(title);
    const isQuestion =
      type.startsWith("q-") ||
      type === "extended-answer" ||
      type === "exam-question";
    if (!isQuestion) continue;
    if (!(inRecallRange || isSectionA)) continue;
    recallCount++;
    if (DYSPRAXIA_NON_WRITING_TYPES.has(type)) recallNonWritingCount++;
  }
  if (recallCount > 0 && recallNonWritingCount < 3) {
    warnings.push(
      `[Phase 4 — Dyspraxia] Section A has ${recallNonWritingCount} non-writing question${recallNonWritingCount === 1 ? "" : "s"} (MCQ / matching / circle-the-answer) out of ${recallCount}. The audit doc requires at least 3 non-writing formats so a DCD pupil can demonstrate knowledge without the handwriting burden. Regenerate or convert at least ${3 - recallNonWritingCount} question${3 - recallNonWritingCount === 1 ? "" : "s"} to a non-writing format.`,
    );
  }

  // Audit 2 — Challenge non-writing format.
  for (const s of sections) {
    if (s.teacherOnly) continue;
    const type = String(s.type || "").toLowerCase();
    const isChallenge =
      type === "challenge" ||
      type === "q-challenge" ||
      /^challenge\b/i.test(String(s.title || "")) ||
      /^bonus\b/i.test(String(s.title || ""));
    if (!isChallenge) continue;
    const isExtendedWriting =
      type === "q-extended" ||
      type === "extended-answer" ||
      type === "lor";
    if (isExtendedWriting) {
      warnings.push(
        `[Phase 4 — Dyspraxia] Challenge section "${s.title || s.type}" uses extended-writing format. Sustained handwriting is fatiguing for DCD pupils — the audit doc requires the Challenge to use a tick / circle / label format. Regenerate the Challenge with a non-writing layout.`,
      );
    }
  }

  return { worksheet: ws, warnings };
}

/**
 * Lane 2.3 — Stacked-need dispatcher.
 *
 * Splits a compound sendNeed string (e.g. "hi+eal", "adhd&dyslexia",
 * "anxiety,mld") into its component keys, orders them by a
 * deterministic priority map, and recurses into
 * `enforceSendOverlayMarkers` once per part — threading the worksheet
 * through so each branch operates on the previous branch's output.
 *
 * Order rationale (lower number runs first):
 *   - 10 HI / hearing-impairment / deaf — insert topic-summary at top
 *     so MLD's topic-context check sees it (and skips, avoiding a
 *     duplicate "What we are working on" block).
 *   - 20 Dyslexia — insert method-box before first question.
 *   - 30 MLD — insert topic-context (no-op when HI's topic-summary is
 *     already present, by design — see enforceMldMarkers).
 *   - 40 Anxiety / SEMH / mental-health — rename Challenge title to
 *     "OPTIONAL BONUS — only if you want to!" + WARM-UP prefix on
 *     Section 1/A. Runs BEFORE ADHD so the gentler title wins via
 *     the `SEND_RENAMED_CHALLENGE_TITLES` first-rename-wins guard
 *     (commit d2d48d8).
 *   - 50 ADHD — prefix every question with "[ ] ", add brain-break
 *     section, conditionally rename Challenge → "BONUS" (skipped if
 *     Anxiety has already softened it).
 *   - 60 Dyscalculia — append "Numbers in this question:" cue. Runs
 *     after ADHD so the cue lands on already-prefixed content.
 *   - 70 EAL / ESL — append sentence frames. Runs after ADHD and
 *     Dyscalculia so frames land at the very end of the content.
 *   - 80 VI / visual-impairment — warn-only diagram audit. Runs late
 *     so it sees the FINAL state including any inserted sections.
 *   - 90 Dyspraxia / DCD — warn-only Section A + Challenge format
 *     audit. Runs last for the same reason as VI.
 *
 * Unknown keys (e.g. "asc", "slcn", "working-memory") are silently
 * dropped — they have no marker enforcer today (Lane 2.1 / Lane 3
 * follow-up). When all keys in a compound are unknown, returns the
 * worksheet untouched.
 */
const STACKED_SEND_PRIORITY: Readonly<Record<string, number>> = {
  hi: 10,
  "hearing-impairment": 10,
  deaf: 10,
  dyslexia: 20,
  mld: 30,
  anxiety: 40,
  semh: 40,
  "mental-health": 40,
  "anxiety-semh": 40,
  adhd: 50,
  dyscalculia: 60,
  eal: 70,
  esl: 70,
  vi: 80,
  "visual-impairment": 80,
  visual: 80,
  dyspraxia: 90,
  dcd: 90,
};

export function runStackedSendMarkers(
  ws: PostValidatorWorksheet,
  compoundKey: string,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  // Split on +, &, comma. Per-part normalisation:
  //   1. trim surrounding whitespace
  //   2. lowercase (defensive — the dispatcher entry already does this
  //      but this function is also publicly exported)
  //   3. drop any leading "send:" prefix (e.g. "send:hi" → "hi")
  //   4. collapse remaining inner whitespace / underscores to dashes
  //      (matches the single-need normalisation above)
  //   5. strip leading / trailing dashes that arose from any of the
  //      previous steps
  const parts = compoundKey
    .split(/[+&,]/)
    .map((p) =>
      p
        .trim()
        .toLowerCase()
        .replace(/^send:/, "")
        .replace(/[\s_]/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean);

  // De-dupe while preserving the priority-ordered run order.
  const seen = new Set<string>();
  const ordered = parts
    .filter((p) => {
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    })
    .sort((a, b) => {
      const pa = STACKED_SEND_PRIORITY[a] ?? 999;
      const pb = STACKED_SEND_PRIORITY[b] ?? 999;
      return pa - pb;
    });

  const recognised = ordered.filter((p) => STACKED_SEND_PRIORITY[p] !== undefined);
  if (recognised.length === 0) {
    return { worksheet: ws, warnings: [] };
  }

  let current = ws;
  const allWarnings: string[] = [];
  for (const part of recognised) {
    // Recurse with a single-need opts override. Each branch is pure +
    // idempotent so re-entering the dispatcher per part is safe.
    const result = enforceSendOverlayMarkers(current, {
      ...opts,
      sendNeed: part,
    });
    current = result.worksheet;
    allWarnings.push(...result.warnings);
  }

  // Single "Stacked SEND" framing warning, prepended only when ≥2
  // needs ran AND at least one branch actually mutated. Re-runs on
  // already-marked worksheets stay a clean no-op (every branch is
  // idempotent → second pass produces empty allWarnings → the
  // framing tag is also suppressed).
  if (recognised.length >= 2 && allWarnings.length > 0) {
    allWarnings.unshift(
      `[Phase 4 — Stacked SEND] Applied markers for ${recognised.length} stacked needs in priority order: ${recognised.join(" → ")}.`,
    );
  }

  return { worksheet: current, warnings: allWarnings };
}

// ── Helpers used by enforceSendOverlayMarkers ────────────────────────────────

function opts_topic_or_metadata(ws: PostValidatorWorksheet): string | undefined {
  const t = ws.metadata?.topic;
  return typeof t === "string" && t.trim() ? t.trim() : undefined;
}

function findFirstSectionContent(
  sections: PostValidatorSection[],
  acceptedTypes: readonly string[],
): string | undefined {
  const wanted = new Set(acceptedTypes.map(t => t.toLowerCase()));
  for (const s of sections) {
    if (s.teacherOnly) continue;
    const t = String(s.type || "").toLowerCase();
    if (!wanted.has(t)) continue;
    if (typeof s.content === "string" && s.content.trim()) return s.content;
  }
  return undefined;
}

function extractVocabularyTerms(content: string): string[] {
  return content
    .split(/\n+/)
    .map(line => line.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .map(line => {
      // Lines look like "term — definition" or "term: definition" or
      // "term | definition". Take everything before the first separator.
      const m = line.match(/^([^:|–—-]{2,80})\s*[:|–—-]/);
      return (m ? m[1] : line).trim();
    })
    .filter(t => t.length > 1 && t.length < 80)
    .slice(0, 8);
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
    // Accept BOTH "[N marks]" and "(N marks)" — IMP-06 normalises mark tariffs
    // to GCSE round brackets, and this collector runs AFTER that pass.
    const m = content.match(/[[(](\d+)\s*marks?[\])]/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > 0) out.push(n);
    }
  }
  return out;
}

/**
 * Lane 2.7 — Scrape vocabulary terms from the worksheet's pupil-facing
 * Key Vocabulary section so the new revision-tips Tip 1 (VOCABULARY)
 * can echo them verbatim. Returns up to 8 terms; deduplicated;
 * lower-cased only when the original was all upper-case so proper
 * nouns are preserved.
 */
function collectVocabularyTerms(ws: PostValidatorWorksheet): string[] {
  const acceptedTypes = new Set([
    "vocabulary",
    "key-vocabulary",
    "key-vocab",
    "key-terms",
    "glossary",
  ]);
  for (const s of ws.sections || []) {
    if (s.teacherOnly) continue;
    const t = String(s.type || "").toLowerCase();
    if (!acceptedTypes.has(t)) continue;
    const content = typeof s.content === "string" ? s.content : "";
    if (!content.trim()) continue;
    const out: string[] = [];
    const seen = new Set<string>();
    for (const raw of content.split(/\n+/)) {
      const line = raw.replace(/^[-•*\d.)\s]+/, "").trim();
      if (!line) continue;
      // Lines look like "term — definition" or "term: definition" or
      // "term | definition". Take everything before the first separator.
      const m = line.match(/^([^:|–—-]{2,80})\s*[:|–—-]/);
      const term = (m ? m[1] : line).trim();
      if (term.length < 2 || term.length > 80) continue;
      const key = term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(term);
      if (out.length >= 8) break;
    }
    if (out.length > 0) return out;
  }
  return [];
}

/**
 * Lane 2.7 — Scrape the Learning Objective sentence from the
 * worksheet's pupil-facing Learning Objective section so the new
 * revision-tips Tip 6 (LEARNING OBJECTIVE) can quote it verbatim.
 * Returns a single sentence, with the leading "LO:" / "Objective:" /
 * "Learning Objective:" / "Students will be able to" stripped.
 * Empty string if no LO section is found.
 */
function collectLearningObjective(ws: PostValidatorWorksheet): string {
  const acceptedTypes = new Set([
    "objective",
    "learning-objective",
    "learning_objective",
    "lo",
  ]);
  for (const s of ws.sections || []) {
    if (s.teacherOnly) continue;
    const t = String(s.type || "").toLowerCase();
    if (!acceptedTypes.has(t)) continue;
    const content = typeof s.content === "string" ? s.content : "";
    if (!content.trim()) continue;
    // Take the first non-blank line, strip common LO prefixes, cap at
    // 200 chars so the panel stays readable.
    const firstLine = content.split("\n").map(l => l.trim()).find(Boolean) || "";
    if (!firstLine) continue;
    let lo = firstLine
      .replace(/^(?:learning\s+objective|lo|objective)\s*[:\-—]\s*/i, "")
      .replace(/^students?\s+will\s+be\s+able\s+to\s*/i, "")
      .trim();
    if (lo.length > 200) lo = lo.slice(0, 197).trimEnd() + "…";
    return lo;
  }
  return "";
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
  // Lane 2.7 — also scrape vocabulary + learningObjective from the
  // worksheet itself so the new 6-category builder can anchor Tip 1
  // (VOCABULARY) and Tip 6 (LEARNING OBJECTIVE) verbatim.
  const vocabulary = collectVocabularyTerms(ws);
  const learningObjective = collectLearningObjective(ws);
  const built = buildRevisionTips({
    topic,
    subject: opts.subject || String(ws.metadata?.subject || ""),
    year: opts.yearGroup || String(ws.metadata?.yearGroup || ""),
    examBoard: opts.examBoard || String(ws.metadata?.examBoard || ""),
    sendKey,
    commandWordsUsed,
    misconceptions,
    marksUsed,
    vocabulary,
    learningObjective,
  });
  const rebuilt = renderRevisionTipsAsMarkerBlock(built);

  warnings.push(
    `Revision-Tips content was generic / not topic-anchored (fewer than 6 tip-shaped lines, or generic stems like "revise carefully"). Replaced with deterministic builder output — six audit-doc-named tips (vocabulary, worked-example, common-mistake, past-papers, retrieval, learning-objective), all naming "${topic}".`,
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

// ─── PR-2 — Awarding-body command-word fidelity (audit item #2) ────────────
//
// Walks every pupil-facing question section. For each leading command word
// that's NOT on the named board's published list, emits a single warning
// per OFF-SPEC verb (deduplicated across questions — a worksheet that
// opens 12 questions with "Reflect on" produces one warning, not twelve).
//
// Never rewrites — the assessed skill is encoded in the verb, so silent
// substitution could change the question's pedagogy. Teachers must
// intervene. Conservative by design.
//
// Pure / idempotent. No-op when the worksheet has no questions, no
// exam board metadata, or every leading verb is on-spec.

const QUESTION_SECTION_PREFIXES = ["q-", "challenge", "extended-answer", "exam-question", "lor"];
function isPupilQuestion(section: PostValidatorSection): boolean {
  if (section.teacherOnly) return false;
  const t = String(section.type || "").toLowerCase();
  return QUESTION_SECTION_PREFIXES.some(p => t === p || t.startsWith(p));
}

export function enforceCommandWordFidelity(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];
  const board = (opts.examBoard ?? (ws.metadata?.examBoard as string | undefined) ?? "").trim();

  // Aggregate the union of off-spec verbs across all question sections so
  // we emit one warning per UNIQUE drift, not one per question.
  const offSpecPerSection: Array<{ qNum: number; offSpec: string[] }> = [];
  let qNum = 0;
  for (const s of sections) {
    if (!isPupilQuestion(s)) continue;
    qNum += 1;
    const text = `${String(s.title || "")}\n${String(s.content || "")}`;
    const off = findOffSpecCommandWords(text, board);
    if (off.length > 0) {
      offSpecPerSection.push({ qNum, offSpec: off });
    }
  }

  // De-dup at worksheet level — list each off-spec verb once.
  const allDriftSet = new Set<string>();
  for (const entry of offSpecPerSection) {
    for (const v of entry.offSpec) allDriftSet.add(v);
  }
  if (allDriftSet.size === 0) {
    return { worksheet: ws, warnings };
  }

  const boardLabel = board ? board.toUpperCase() : "the awarding body's published list";
  for (const verb of Array.from(allDriftSet).sort()) {
    const offendingQs = offSpecPerSection
      .filter(e => e.offSpec.includes(verb))
      .map(e => `Q${e.qNum}`)
      .join(", ");
    warnings.push(
      `[Phase 5 — Command-word fidelity] "${verb}" is not on ${boardLabel}'s command-word list — ` +
      `${offendingQs} should open with a published verb (Calculate / Describe / Explain / Evaluate / etc.). ` +
      `Off-spec verbs leave pupils unprepared for the real exam.`,
    );
  }

  return { worksheet: ws, warnings };
}

// ─── PR-2 — SI unit normalisation (audit item #14) ────────────────────────
//
// Phase 5's manifesto names "SI units only" as a non-negotiable. This
// validator turns the rule into a per-question probe. WARN-ONLY — never
// silently rewrites the value, because numeric conversion is non-trivial
// (60 mph → 96.6 km/h ≠ 60 km/h) and a unit-only rewrite would make the
// question factually wrong. Teachers fix manually.
//
// No-op when the worksheet's topic is itself unit conversion (heuristic:
// topic / subject contains "convert" + "units" / "imperial" / "metric").
// Those questions legitimately need imperial values.
//
// Pure / idempotent.

export function enforceSiUnitNormalisation(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const topic = opts.topic ?? (ws.metadata?.topic as string | undefined);
  const subject = opts.subject ?? (ws.metadata?.subject as string | undefined);

  if (isUnitConversionTopic(topic, subject)) {
    return { worksheet: ws, warnings };
  }

  const sections = ws.sections || [];
  let qNum = 0;
  // Aggregate per-unit drift across the worksheet so we don't blow up the
  // teacher banner with one warning per occurrence.
  const driftByUnit: Map<string, { si: string; questions: string[] }> = new Map();

  for (const s of sections) {
    if (s.teacherOnly) continue;
    const isQ = isPupilQuestion(s);
    if (isQ) qNum += 1;
    const text = `${String(s.title || "")}\n${String(s.content || "")}`;
    const matches = findImperialUnits(text);
    for (const m of matches) {
      const key = m.label;
      const entry = driftByUnit.get(key) || { si: m.siEquivalent, questions: [] };
      const tag = isQ ? `Q${qNum}` : (s.title || s.type || "section");
      if (!entry.questions.includes(tag)) entry.questions.push(tag);
      driftByUnit.set(key, entry);
    }
  }

  if (driftByUnit.size === 0) {
    return { worksheet: ws, warnings };
  }

  for (const [unit, info] of driftByUnit) {
    warnings.push(
      `[Phase 5 — SI units] imperial unit "${unit}" detected in ${info.questions.join(", ")} — ` +
      `rewrite to ${info.si}. Imperial units are forbidden in UK worksheet content unless the topic IS unit conversion.`,
    );
  }

  return { worksheet: ws, warnings };
}

// ─── PR-2 — Per-question reading-age budget (audit item #1) ───────────────
//
// PB1 stamps `expectedReadingAge` on every question (5–18 years). This
// validator computes Flesch-Kincaid on the rendered stem and warns when
// the actual reading age exceeds the declared one by more than 1.5 years
// (the published BDA / National Literacy Trust tolerance band for
// "comfortable independent reading").
//
// Falls back to the worksheet's declared reading age (PB1 metadata level)
// when a question section has no per-question `expectedReadingAge`. When
// neither is available, infers a year-group default (Year 7 = 11, Year
// 10 = 14, etc.) so we still catch egregious drift on legacy worksheets.
//
// Pure / idempotent. No-op for sections shorter than 5 words (Flesch-
// Kincaid is unreliable on tiny passages).

function inferDefaultReadingAge(yearGroup: string | undefined): number | null {
  const n = parseInt((yearGroup || "").replace(/\D/g, "") || "", 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  // UK National Literacy Trust median reading-age-by-year-group table
  // (rounded). Pupils with EAL / SEND read below this; Phase 4 handles
  // those via the SEND register override on the prompt.
  if (n <= 1) return 6;
  if (n === 2) return 7;
  if (n === 3) return 8;
  if (n === 4) return 9;
  if (n === 5) return 10;
  if (n === 6) return 11;
  if (n === 7) return 11;  // KS3 settles on ~11 then climbs slowly
  if (n === 8) return 12;
  if (n === 9) return 13;
  if (n === 10) return 14;
  if (n === 11) return 15;
  if (n === 12) return 16;
  return 17; // Year 13 / A-Level
}

/** 1.5-year tolerance band — published BDA "independent reading" range. */
const READING_AGE_TOLERANCE_YEARS = 1.5;

export function enforceReadingAgeBudget(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];
  const yearGroup = opts.yearGroup ?? (ws.metadata?.yearGroup as string | undefined);

  let qNum = 0;
  const breaches: Array<{ qNum: number; declared: number; actual: number; gap: number }> = [];
  for (const s of sections) {
    if (!isPupilQuestion(s)) continue;
    qNum += 1;
    const stem = String(s.content || "");
    const result = computeReadingAge(stem);
    if (!result) continue; // too short to score reliably
    const declared =
      typeof (s as { expectedReadingAge?: number }).expectedReadingAge === "number"
        ? (s as { expectedReadingAge?: number }).expectedReadingAge!
        : inferDefaultReadingAge(yearGroup);
    if (declared == null) continue;
    const gap = result.readingAge - declared;
    if (gap > READING_AGE_TOLERANCE_YEARS) {
      breaches.push({ qNum, declared, actual: result.readingAge, gap: Math.round(gap * 10) / 10 });
    }
  }

  if (breaches.length === 0) {
    return { worksheet: ws, warnings };
  }

  // One warning per breach — they're rare and per-question detail is
  // useful for the teacher banner.
  for (const b of breaches) {
    warnings.push(
      `[Phase 1 — Reading age] Q${b.qNum} reads at ${b.actual} years vs declared ${b.declared} ` +
      `(gap +${b.gap} > ${READING_AGE_TOLERANCE_YEARS}-year tolerance). Shorten sentences ` +
      `(target ≤ 14 words) or replace polysyllabic vocabulary.`,
    );
  }

  return { worksheet: ws, warnings };
}

// ─── PR-3 — Diagram-question coupling integrity (audit item #15) ──────────
//
// When a question stem references "Diagram A" / "Diagram B" / "the figure" /
// "the graph" / "the table above", the named section MUST exist on the
// worksheet. Otherwise the pupil is asked to interpret a diagram that's
// not on the page — pedagogy collapses.
//
// We never STRIP the question (the diagram may still be on its way from
// the library in a future regenerate). We warn so the teacher knows to
// either supply the diagram or rewrite the stem to be self-contained.
//
// Pure / idempotent. No-op when no questions reference a diagram.

const DIAGRAM_REFERENCE_RE =
  /\b(?:diagram\s+([A-Z])|figure\s+(\d+)|the\s+(?:figure|graph|chart|table)(?!\s+below)|in\s+(?:figure|graph|chart|table)\s+([A-Z0-9]+))\b/gi;

function getDiagramSectionLetter(section: PostValidatorSection): string | null {
  const t = String(section.type || "").toLowerCase();
  if (t === "diagram-a") return "A";
  if (t === "diagram-b") return "B";
  // Title-based fallback ("Diagram A", "Diagram B", "Figure 1", ...).
  const title = String(section.title || "");
  const m = title.match(/^\s*(?:diagram|figure)\s+([A-Z0-9]+)/i);
  if (m) return m[1].toUpperCase();
  return null;
}

export function enforceDiagramDependencyIntegrity(
  ws: PostValidatorWorksheet,
  _opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];

  // Catalogue every diagram-section identifier present on the worksheet.
  const diagramLetters = new Set<string>();
  let hasGenericDiagram = false;
  for (const s of sections) {
    const t = String(s.type || "").toLowerCase();
    if (!t.includes("diagram") && !/figure/i.test(String(s.title || ""))) continue;
    const letter = getDiagramSectionLetter(s);
    if (letter) diagramLetters.add(letter);
    else hasGenericDiagram = true;
  }

  // Walk question sections and look for cross-references.
  let qNum = 0;
  // Aggregate: one warning per UNIQUE missing reference, listing the
  // offending questions.
  const missingByRef: Map<string, string[]> = new Map();
  for (const s of sections) {
    if (!isPupilQuestion(s)) continue;
    qNum += 1;
    const text = `${String(s.title || "")}\n${String(s.content || "")}`;
    const seen = new Set<string>();
    DIAGRAM_REFERENCE_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = DIAGRAM_REFERENCE_RE.exec(text)) !== null) {
      const letter = (m[1] || m[4] || "").toUpperCase();
      const figureNum = m[2] || "";
      const generic = !letter && !figureNum && !!m[0];
      let refKey: string;
      if (letter) refKey = `Diagram ${letter}`;
      else if (figureNum) refKey = `Figure ${figureNum}`;
      else refKey = `the ${m[0].split(/\s+/).pop()?.toLowerCase() || "diagram"}`;
      if (seen.has(refKey)) continue;
      seen.add(refKey);
      // Resolve: is this reference satisfied?
      const satisfied =
        (letter && diagramLetters.has(letter)) ||
        (figureNum && diagramLetters.has(figureNum)) ||
        (generic && (hasGenericDiagram || diagramLetters.size > 0));
      if (!satisfied) {
        const list = missingByRef.get(refKey) || [];
        list.push(`Q${qNum}`);
        missingByRef.set(refKey, list);
      }
    }
    DIAGRAM_REFERENCE_RE.lastIndex = 0;
  }

  for (const [ref, qs] of missingByRef) {
    warnings.push(
      `[Phase 1 — Diagram integrity] ${qs.join(", ")} reference "${ref}" but no matching diagram section exists. ` +
      `Either supply the diagram or rewrite the stem to be self-contained.`,
    );
  }

  return { worksheet: ws, warnings };
}

// ─── PR-3 — MCQ distractor pedagogy probe (audit item #4) ─────────────────
//
// Every MCQ wrong-answer distractor should be a SUBSTANTIVE misconception
// the teacher could diagnose from. "Obviously wrong" decoys (the literal
// correct answer with a typo, an empty option, a same-letter different
// number when the question isn't about magnitude) waste a question slot
// and leave the teacher unable to use the response data diagnostically.
//
// Heuristics (warn-only, never rewrites):
//   1. A distractor that's identical to another distractor.
//   2. A distractor that's the correct answer with one whitespace / punctuation
//      change (typo decoy).
//   3. A distractor that's empty / a single character.
//   4. Fewer than 3 unique distractors per MCQ (UK exam-style requires 3 or 4).
//
// `misconceptionLinks` (FEAT-PB7 metadata) is checked when present —
// distractors with linked misconception ids are exempt from heuristic 1.

function levenshtein1(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  // Try insertion (l has one extra char) or substitution (lengths equal).
  if (s.length === l.length) {
    let diff = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== l[i]) diff++;
      if (diff > 1) return false;
    }
    return diff === 1;
  }
  // l is exactly one longer — try every deletion of one char from l.
  for (let i = 0; i < l.length; i++) {
    if (l.slice(0, i) + l.slice(i + 1) === s) return true;
  }
  return false;
}

const MCQ_OPTION_LINE_RE = /^\s*([A-D])\s*[).\s]\s*(.+?)\s*([\u2713\u2714]?)\s*$/;

export function enforceDistractorPedagogy(
  ws: PostValidatorWorksheet,
  _opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];

  let qNum = 0;
  for (const s of sections) {
    if (!isPupilQuestion(s)) continue;
    qNum += 1;
    const t = String(s.type || "").toLowerCase();
    if (t !== "q-mcq" && t !== "mcq") continue;
    const content = String(s.content || "");
    const optionLines = content.split("\n").map(l => MCQ_OPTION_LINE_RE.exec(l)).filter(Boolean) as RegExpExecArray[];
    if (optionLines.length < 2) continue;

    // Identify the correct option (the one with ✓).
    let correctText = "";
    const distractors: string[] = [];
    for (const m of optionLines) {
      const [, , body, tick] = m;
      if (tick) {
        correctText = body.trim();
      } else {
        distractors.push(body.trim());
      }
    }

    // Heuristic 1: duplicate distractors.
    const seen = new Set<string>();
    for (const d of distractors) {
      const key = d.toLowerCase();
      if (seen.has(key)) {
        warnings.push(
          `[Phase 1 — Distractor pedagogy] Q${qNum} has a duplicate distractor "${d}". Each wrong answer should diagnose a distinct misconception.`,
        );
      } else {
        seen.add(key);
      }
    }

    // Heuristic 2: typo of the correct answer.
    if (correctText) {
      for (const d of distractors) {
        if (!d) continue;
        if (d.toLowerCase() === correctText.toLowerCase()) continue;
        if (levenshtein1(d.toLowerCase(), correctText.toLowerCase())) {
          warnings.push(
            `[Phase 1 — Distractor pedagogy] Q${qNum} distractor "${d}" is one character away from the correct answer "${correctText}" — looks like a typo decoy, not a misconception.`,
          );
        }
      }
    }

    // Heuristic 3: empty / single-character distractor.
    for (const d of distractors) {
      if (d.length <= 1) {
        warnings.push(
          `[Phase 1 — Distractor pedagogy] Q${qNum} has a near-empty distractor "${d}". Use a substantive misconception, not a placeholder.`,
        );
      }
    }

    // Heuristic 4: too few unique distractors.
    if (seen.size < 2 && distractors.length > 0) {
      warnings.push(
        `[Phase 1 — Distractor pedagogy] Q${qNum} has only ${seen.size} unique distractor(s). UK exam-style MCQs need 3 distinct wrong answers.`,
      );
    }
  }

  return { worksheet: ws, warnings };
}

// ─── PR-3 — Tier-3 vocabulary declared in Word Bank (audit item #10) ──────
//
// Worksheets emit a `vocabulary` section listing Tier 2 / Tier 3 terms.
// But there's no audit that every Tier 3 word appearing in a question
// stem is actually declared in that section. Pupils meet undefined
// technical terms; SEND-aware reading-age rules can't help.
//
// Tier 3 detection (Beck / McKeown / Kucan model):
//   - Subject-specific words ≥ 4 syllables (rough proxy)
//   - OR matches a curated subject-family list (per family)
//
// We probe the union: any word with ≥ 4 syllables that appears in any
// question stem is checked against the worksheet's vocabulary section.
// Tier 1 (everyday) and Tier 2 (cross-curricular academic) are exempt.
//
// Pure / warn-only. False-positive rate is the main risk, so the
// syllable threshold is conservative (≥ 4).

// Length-based proxy for Tier-3-shaped words. PR-2 has now landed
// `countSyllables` in `curriculumAuthorityPrompt.ts`; the syllable-based
// detector is the planned upgrade path (see PR-21 carve-up sweep notes).
// For now the conservative ≥ 11-character threshold preserves the same
// false-positive / false-negative tradeoff on the UK GCSE corpus.
const TIER3_LENGTH_THRESHOLD = 11;

/** Words to skip even if syllable-heavy (Tier 1 / Tier 2 / proper nouns). */
const TIER3_VOCAB_STOP_WORDS = new Set<string>([
  "everybody", "anybody", "somebody", "nobody",
  "everything", "anything", "something", "nothing",
  "everyone", "anyone", "someone",
  "yourself", "themselves", "ourselves", "myself", "himself", "herself",
  "actually", "particularly", "especially", "approximately", "immediately",
  "interesting", "interested", "important", "different", "available",
  "calculator", "thermometer", "centimetre", "kilometre", "millimetre",
  "necessary", "necessarily", "additionally", "alternatively",
  "investigate", "investigated", "investigating", "investigation",
  "evaluation", "evaluating", "demonstrate", "demonstrating",
]);

export function enforceTier3VocabularyDeclared(
  ws: PostValidatorWorksheet,
  _opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];

  // Build the declared-vocabulary lower-cased set.
  const declared = new Set<string>();
  for (const s of sections) {
    const type = String(s.type || "").toLowerCase();
    const title = String(s.title || "").toLowerCase();
    if (type !== "vocabulary" && type !== "key-terms" && !/(word\s*bank|key\s*vocabulary|glossary)/i.test(title)) continue;
    const content = String(s.content || "");
    // Pull words / phrases that look like vocabulary entries — bullets,
    // numbered list items, "Term: definition" lines, comma-separated lists.
    const lines = content.split(/\r?\n/);
    for (const ln of lines) {
      // "Photosynthesis: the process by which..." → grab "photosynthesis"
      const colonMatch = ln.match(/^\s*[•\-\*\d.)]?\s*([A-Za-z][A-Za-z\s'-]+?)\s*[:=]/);
      if (colonMatch) {
        const term = colonMatch[1].trim().toLowerCase();
        for (const w of term.split(/\s+/)) {
          if (w.length >= 3) declared.add(w);
        }
        continue;
      }
      // Comma-separated: "Mitochondria, ribosome, nucleus"
      if (/,/.test(ln) && !/[.!?]$/.test(ln)) {
        for (const part of ln.split(/[,;]/)) {
          const cleaned = part.replace(/[•\-\*\d.)\s]+/g, " ").trim();
          for (const w of cleaned.split(/\s+/)) {
            if (w.length >= 3) declared.add(w.toLowerCase());
          }
        }
      }
    }
  }

  if (declared.size === 0) {
    // No vocabulary section at all. We don't warn here — the worksheet
    // may legitimately not need one (e.g. KS1 number-bond practice).
    return { worksheet: ws, warnings };
  }

  // Walk question sections, find Tier-3-shaped words missing from the
  // declared set.
  const undeclared: Map<string, string[]> = new Map(); // word -> qs
  let qNum = 0;
  for (const s of sections) {
    if (!isPupilQuestion(s)) continue;
    qNum += 1;
    const text = String(s.content || "");
    const tokens = text.match(/[A-Za-z][A-Za-z']{3,}/g) || [];
    for (const tok of tokens) {
      const lower = tok.toLowerCase();
      if (declared.has(lower)) continue;
      if (TIER3_VOCAB_STOP_WORDS.has(lower)) continue;
      // Word stems too: "photosynthesis" should match declared "photosynthetic".
      if (Array.from(declared).some(d => d.startsWith(lower.slice(0, 6)) && Math.abs(d.length - lower.length) <= 4)) continue;
      if (lower.length < TIER3_LENGTH_THRESHOLD) continue;
      const qs = undeclared.get(lower) || [];
      const tag = `Q${qNum}`;
      if (!qs.includes(tag)) qs.push(tag);
      undeclared.set(lower, qs);
    }
  }

  for (const [word, qs] of undeclared) {
    warnings.push(
      `[Phase 1 — Vocabulary tier] Tier 3 word "${word}" used in ${qs.join(", ")} but not declared in the Word Bank / Key Vocabulary section. ` +
      `Either add the term + plain-English definition or replace it with a Tier 1 / Tier 2 alternative.`,
    );
  }

  return { worksheet: ws, warnings };
}

// ─── PR-3 — Mathematical notation hygiene (audit item #13) ────────────────
//
// Wraps `notationHygieneNormaliser.ts`. Silent rewrite of student-visible
// content (× for x, − for hyphen between numbers, ° for letter o after
// digits) plus one warning per drift fixed.
//
// Pure / idempotent — running twice yields the same output as running
// once. Skips teacher-only sections so mark schemes / answer keys keep
// their existing notation.

export function enforceMathsNotationHygiene(
  ws: PostValidatorWorksheet,
  _opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const sections = ws.sections || [];
  let mutated = false;
  // Aggregate per-label so one warning per drift type rather than one per
  // occurrence.
  const driftCounts: Map<string, number> = new Map();

  const next = sections.map((s): PostValidatorSection => {
    if (s.teacherOnly) return s;
    const content = String(s.content || "");
    if (!content) return s;
    const r = normaliseMathNotation(content);
    if (r.substitutions.length === 0) return s;
    mutated = true;
    for (const sub of r.substitutions) {
      driftCounts.set(sub.label, (driftCounts.get(sub.label) || 0) + 1);
    }
    return { ...s, content: r.rewritten };
  });

  for (const [label, count] of driftCounts) {
    warnings.push(
      `[Phase 1 — Notation hygiene] Rewrote ${count} typographic drift(s) (${label}) — ` +
      `UK exam papers use the typographic forms (× for multiplication, − for subtraction, ° for degrees).`,
    );
  }

  return {
    worksheet: mutated ? { ...ws, sections: next } : ws,
    warnings,
  };
}

/**
 * Phase F · FEAT-PF1 — tier-AO histogram check.
 *
 * When the worksheet metadata carries a tier ("foundation" | "higher"),
 * the AO distribution emitted by the LLM (already stamped on
 * metadata.aoHistogram by pillarAValidator.assertAoPresent) is compared
 * against the curriculum bank's tier target:
 *
 *   Foundation  AO1 ≈ 60%, AO2 ≈ 30%, AO3 ≈ 10%
 *   Higher      AO1 ≈ 40%, AO2 ≈ 40%, AO3 ≈ 20%
 *
 * If any AO is more than ±15 percentage points off target, a p1 warning
 * is stamped onto metadata.postValidatorWarnings (and the per-AO drift
 * is recorded on metadata.tierAoHistogramReport for the audit-trail
 * panel). The check is skipped when tier or aoHistogram is missing.
 */
export function enforceTierAoHistogram(
  ws: PostValidatorWorksheet,
  _opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const meta = (ws.metadata || {}) as Record<string, unknown>;
  const tier = (meta.tier ?? meta.difficulty) as string | undefined;
  const histogram = meta.aoHistogram as
    | Partial<Record<"AO1" | "AO2" | "AO3" | "AO4", number>>
    | undefined;

  if (!tier || (tier !== "foundation" && tier !== "higher") || !histogram) {
    return { worksheet: ws, warnings };
  }

  const targets =
    tier === "foundation"
      ? { AO1: 0.6, AO2: 0.3, AO3: 0.1 }
      : { AO1: 0.4, AO2: 0.4, AO3: 0.2 };

  const total =
    (histogram.AO1 || 0) +
    (histogram.AO2 || 0) +
    (histogram.AO3 || 0) +
    (histogram.AO4 || 0);
  if (total === 0) return { worksheet: ws, warnings };

  const actual = {
    AO1: (histogram.AO1 || 0) / total,
    AO2: (histogram.AO2 || 0) / total,
    AO3: (histogram.AO3 || 0) / total,
  };
  const drift = {
    AO1: actual.AO1 - targets.AO1,
    AO2: actual.AO2 - targets.AO2,
    AO3: actual.AO3 - targets.AO3,
  };
  const tolerance = 0.15;
  const offTarget = (Object.keys(drift) as Array<keyof typeof drift>).filter(
    (k) => Math.abs(drift[k]) > tolerance,
  );

  const report = {
    tier,
    target: targets,
    actual,
    drift,
    questionCount: total,
    offTarget,
  };
  const updatedMeta = {
    ...(ws.metadata || {}),
    tierAoHistogramReport: report,
  };

  if (offTarget.length > 0) {
    const driftSummary = offTarget
      .map(
        (k) =>
          `${k} actual ${Math.round(actual[k] * 100)}% vs target ${Math.round(
            targets[k as "AO1" | "AO2" | "AO3"] * 100,
          )}% (${drift[k] > 0 ? "+" : ""}${Math.round(drift[k] * 100)}pp)`,
      )
      .join("; ");
    warnings.push(
      `[Phase F — Tier AO histogram | p1] ${tier.toUpperCase()} tier worksheet has AO distribution off target: ${driftSummary}. Targets: AO1 ${Math.round(
        targets.AO1 * 100,
      )}% / AO2 ${Math.round(targets.AO2 * 100)}% / AO3 ${Math.round(
        targets.AO3 * 100,
      )}%.`,
    );
  }

  return {
    worksheet: { ...ws, metadata: updatedMeta },
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
  // PR-8 — audit item #74. The 22-step validator chain is now a
  // data-driven registry in `worksheetPostValidatorRegistry.ts`. This
  // entry point delegates to that registry's `runRegistry` so the
  // legacy callers see the same behaviour while new callers (per-tenant
  // feature flags, eval-harness focus runs, regression-bisecting a
  // flaky validator) can pass `opts.validatorOverrides` to disable
  // individual validators by name without forking the chain.
  const registryResult = runRegistry(
    worksheet,
    opts,
    opts.validatorOverrides || {},
  );

  let current = registryResult.worksheet;
  const allWarnings: string[] = [...registryResult.warnings];

  // Surface caller-side typos in `validatorOverrides`. We don't fail
  // the chain — unknown names just get a single warning (one per
  // unknown name) so flag drift in tenant config is observable.
  if (registryResult.unknownOverrides.length > 0) {
    for (const name of registryResult.unknownOverrides) {
      allWarnings.push(
        `[Phase PR-8 — Validator registry] Unknown validatorOverrides key '${name}' was ignored; ` +
          `see WORKSHEET_POST_VALIDATORS for the canonical name list.`,
      );
    }
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

  // PR-4 — audit item #50. Quality scorecard. Pure / idempotent. Stamps
  // `metadata.qaScore` (a `WorksheetQAScore`) and `metadata.validationStatus`
  // (legacy "pass" | "warn" | "fail" derived from the scorecard's richer
  // status). Runs LAST so it sees every warning above and any report
  // earlier validators / audits attached to metadata. The teacher-view
  // banner in `WorksheetRenderer.tsx` (lines 4705 / 4792) already renders
  // this — wiring it here makes the banner appear on every AI-generated
  // worksheet, not just legacy template-built ones.
  current = applyQaScore(current);

  return { worksheet: current, warnings: allWarnings };
}
