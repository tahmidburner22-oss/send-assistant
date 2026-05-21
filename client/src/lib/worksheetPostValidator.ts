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
