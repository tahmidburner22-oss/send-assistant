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
  };
  [key: string]: unknown;
}

export interface PostValidatorOptions {
  /** Subject string exactly as submitted to the generator. */
  subject?: string;
  /** Year group string exactly as submitted. */
  yearGroup?: string;
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
    ].join(" ");
    if (hasForeignToken(haystack)) {
      warnings.push(`Removed foreign diagram "${String(s.title || s.id || "").slice(0, 50)}" from science worksheet.`);
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

// ─── Top-level entry point ───────────────────────────────────────────────────

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
    (ws: PostValidatorWorksheet) => enforceYearGroupLock(ws, opts),
    (ws: PostValidatorWorksheet) => capWorkedExampleSteps(ws, opts),
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
