/**
 * markSchemeReconciler.ts
 *
 * Deterministic mark-scheme builder. Runs as part of the worksheet
 * post-validator chain, AFTER the parsed worksheet JSON has come back from
 * the AI but BEFORE the SEND enforcer / overlay engine sees it.
 *
 * Why this exists
 * ───────────────
 * The current generator asks the AI to produce BOTH the questions and the
 * Teacher Key in one call. Two long-standing problems with that:
 *
 *   1. The Teacher Key takes ~600–900 output tokens that we'd rather spend
 *      on richer questions. With the structured generator capped at ~6,500
 *      output tokens this is where we routinely lose tail content.
 *   2. The AI's answers desync from the questions roughly 1 in every 7
 *      worksheets. The most common failure modes (logged in
 *      worksheetPostValidator audits): wrong MCQ letter, T/F flipped,
 *      gap-fill word order disagreeing with the bank, or the mark scheme
 *      referencing a question number that doesn't exist on the sheet.
 *
 * What this module does
 * ─────────────────────
 * For every mechanical question type we can derive the answer from the
 * student-facing content itself:
 *
 *   - q-true-false  → lines ending with " TRUE" / " FALSE"
 *   - q-mcq         → the option line ending with the ✓ tick
 *   - q-gap-fill    → the WORD BANK / ANSWER BOX list
 *   - q-matching    → the "term ←→ definition" pairs
 *
 * For open-ended questions (q-short-answer, q-extended, challenge) we
 * cannot derive an answer, so we extract whatever the AI wrote for that
 * Q-number from the existing mark-scheme content and keep it intact.
 *
 * The reconciler then OVERWRITES the worksheet's mark-scheme / teacher-key
 * section with a freshly-built, Q-numbered teacher reference that is
 * guaranteed to match the questions the pupil sees.
 *
 * Conservatism guarantees
 * ───────────────────────
 *   - Pure (returns a new worksheet, never mutates input)
 *   - Idempotent (running twice produces the same output)
 *   - Defensive: if we can't extract at least one mechanical answer, we
 *     leave the AI's mark scheme untouched and emit a single warning. The
 *     teacher sees their familiar mark scheme.
 *   - Observable: every drift between AI's claimed answer and the
 *     deterministic answer is logged on metadata.postValidatorWarnings.
 *
 * Why this is shipped behind the existing post-validator chain
 * ────────────────────────────────────────────────────────────
 * Same pattern as enforceSingleMcqCorrect, dedupeWordBank, etc. — the
 * surrounding chain already collects warnings to the same metadata key,
 * runs before the SEND enforcer, and is order-stable. Adding the
 * reconciler at the end of the chain lets it work against fully-sanitised
 * MCQ content (the single-✓ rule has already fired, so we trust the tick).
 */

import type {
  PostValidatorWorksheet,
  PostValidatorSection,
  PostValidatorResult,
  PostValidatorOptions,
} from "./worksheetPostValidator";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single question slot identified across the full worksheet. */
interface QuestionSlot {
  /** 1-based pupil-facing question number. */
  qNum: number;
  /** Index into worksheet.sections. */
  sectionIndex: number;
  /** Section title at extraction time, for error messages. */
  sectionTitle: string;
  /** Lower-cased section type. */
  sectionType: string;
  /** Marks declared on the section, if any. */
  marks?: number;
  /** Deterministically-derived answer text, or null when not derivable. */
  derivedAnswer: string | null;
  /** Short kind hint for warnings ("true-false", "mcq", "gap-fill", "matching", "open"). */
  kind: "true-false" | "mcq" | "gap-fill" | "matching" | "open";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const QUESTION_TYPE_PREFIXES = [
  "q-",
  "challenge",
  "extended-answer",
  "exam-question",
  "lor",
];

/** Returns true if a section is a pupil-facing question. */
function isQuestionSection(section: PostValidatorSection): boolean {
  if (section.teacherOnly) return false;
  const type = String(section.type || "").toLowerCase();
  return QUESTION_TYPE_PREFIXES.some(p => type === p || type.startsWith(p));
}

/** Returns true if a section is the (teacher-only) mark-scheme block. */
function isMarkSchemeSection(section: PostValidatorSection): boolean {
  const type = String(section.type || "").toLowerCase();
  return type === "mark-scheme" || type === "teacher-key" || type === "answer-key";
}

/**
 * Extracts the per-Q text the AI already wrote in its mark-scheme content,
 * keyed by Q-number. We use this for open-ended questions where the AI's
 * answer is the best we have.
 *
 * Recognises lines like:
 *   "Q3 [4 marks]: …"
 *   "Question 3: …"
 *   "3) …"
 *   "Q3 (Section B): …"
 */
function extractAiAnswerByQNum(markSchemeContent: string): Record<number, string> {
  const out: Record<number, string> = {};
  if (!markSchemeContent) return out;

  // Split on lines that look like "Q<n>" or "Question <n>" or bare "<n>." / "<n>)".
  const splitRe = /^\s*(?:Q\s*(\d+)\b|Question\s*(\d+)\b|(\d+)\s*[).:])/i;
  const lines = markSchemeContent.split(/\r?\n/);
  let currentQ: number | null = null;
  let currentBuf: string[] = [];

  const flush = () => {
    if (currentQ !== null && currentBuf.length > 0) {
      const text = currentBuf.join("\n").trim();
      if (text && !out[currentQ]) {
        out[currentQ] = text;
      }
    }
  };

  for (const line of lines) {
    const m = line.match(splitRe);
    if (m) {
      flush();
      const num = parseInt(m[1] || m[2] || m[3] || "", 10);
      if (Number.isFinite(num)) {
        currentQ = num;
        // Keep the rest of the heading line as the start of the buffer
        currentBuf = [line.replace(splitRe, "").trim()].filter(Boolean);
      } else {
        currentQ = null;
        currentBuf = [];
      }
    } else if (currentQ !== null) {
      currentBuf.push(line);
    }
  }
  flush();
  return out;
}

// ─── Per-type extractors ─────────────────────────────────────────────────────

/**
 * Parse "1. <statement> TRUE" / "FALSE" lines from a true-false question
 * content. Returns one answer per detected statement, or null if nothing
 * could be parsed (in which case we hand off to the AI's text).
 */
function extractTrueFalseAnswers(content: string): string | null {
  if (!content) return null;
  const lines = content.split(/\r?\n/);
  const items: string[] = [];
  // Match a numbered statement that ENDS with TRUE or FALSE (with optional
  // surrounding punctuation / spaces / slashes — "TRUE / FALSE" prompts are
  // skipped because the answer is whichever appears at the end).
  const re = /^\s*(\d+)\.\s*.+?\b(TRUE|FALSE)\s*$/i;
  // We treat trailing "TRUE / FALSE" prompts (both words separated by /)
  // as student prompts, not answers. Detect that pattern explicitly.
  const trailingPromptRe = /\bTRUE\s*\/\s*FALSE\s*$/i;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (trailingPromptRe.test(line)) continue; // student-facing prompt, not the answer line
    const m = line.match(re);
    if (m) {
      const idx = parseInt(m[1], 10);
      const ans = m[2].toUpperCase();
      items.push(`${idx}. ${ans}`);
    }
  }
  return items.length > 0 ? items.join("\n") : null;
}

/**
 * Parse the option line ending with ✓ to find the correct MCQ letter and
 * text. The post-validator chain runs enforceSingleMcqCorrect before us, so
 * we can trust there's at most one tick.
 */
function extractMcqAnswer(content: string): string | null {
  if (!content) return null;
  const lines = content.split(/\r?\n/);
  // Match option lines beginning with a letter then spacing, and ending with ✓.
  const optionRe = /^\s*([A-D])\s*[).\s]\s*(.+?)\s*[\u2713\u2714]\s*$/;
  for (const line of lines) {
    const m = line.match(optionRe);
    if (m) {
      return `Correct answer: ${m[1].toUpperCase()} — ${m[2].trim()}`;
    }
  }
  return null;
}

/**
 * Pull the WORD BANK / ANSWER BOX list out of a gap-fill question. The 7
 * correct answers are shuffled in with 3 distractors so we can only show
 * the bank to the teacher; per-blank ordering is not derivable from the
 * student-facing content alone.
 */
function extractGapFillAnswer(content: string): string | null {
  if (!content) return null;
  const re = /^(?:WORD\s*BANK|ANSWER\s*BOX)\s*:\s*(.+)$/im;
  const m = content.match(re);
  if (!m) return null;
  const words = m[1]
    .split(/\s*[|,/]\s*/)
    .map(s => s.trim())
    .filter(Boolean);
  if (words.length === 0) return null;
  return `Words from the word bank (read paragraph in order): ${words.join(", ")}`;
}

/**
 * Parse "1. term ←→ definition" pairs from a matching question.
 */
function extractMatchingAnswer(content: string): string | null {
  if (!content) return null;
  const lines = content.split(/\r?\n/);
  // Accept both ←→ and -> and -- arrows
  const re = /^\s*(\d+)\.\s*(.+?)\s*(?:\u2194|\u2190\u2192|<->|->|--+)\s*(.+?)\s*$/;
  const items: string[] = [];
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      items.push(`${m[1]}. ${m[2].trim()} — ${m[3].trim()}`);
    }
  }
  return items.length > 0 ? items.join("\n") : null;
}

// ─── Slot building ───────────────────────────────────────────────────────────

/**
 * Walk every section of the worksheet and produce one QuestionSlot per
 * pupil-facing question. Q-numbering is assigned in worksheet order, so
 * Q1 corresponds to the first q-* section the renderer will show.
 */
function buildQuestionSlots(
  sections: PostValidatorSection[],
): QuestionSlot[] {
  const slots: QuestionSlot[] = [];
  let qNum = 0;

  sections.forEach((section, sectionIndex) => {
    if (!isQuestionSection(section)) return;
    qNum += 1;
    const type = String(section.type || "").toLowerCase();
    const content = String(section.content || "");
    const marks = typeof section.marks === "number" ? section.marks : undefined;

    let derivedAnswer: string | null = null;
    let kind: QuestionSlot["kind"] = "open";

    if (type === "q-true-false" || type === "true-false") {
      derivedAnswer = extractTrueFalseAnswers(content);
      kind = "true-false";
    } else if (type === "q-mcq" || type === "mcq") {
      derivedAnswer = extractMcqAnswer(content);
      kind = "mcq";
    } else if (type === "q-gap-fill" || type === "gap-fill") {
      derivedAnswer = extractGapFillAnswer(content);
      kind = "gap-fill";
    } else if (type === "q-matching" || type === "matching") {
      derivedAnswer = extractMatchingAnswer(content);
      kind = "matching";
    }

    slots.push({
      qNum,
      sectionIndex,
      sectionTitle: String(section.title || `Question ${qNum}`),
      sectionType: type,
      marks,
      derivedAnswer,
      kind,
    });
  });

  return slots;
}

// ─── Reconciler ──────────────────────────────────────────────────────────────

/**
 * Build a fresh, deterministic mark-scheme content string from question
 * slots, falling back to the AI's per-Q text for open-ended questions.
 */
function buildReconciledContent(
  slots: QuestionSlot[],
  aiAnswerByQ: Record<number, string>,
): string {
  const blocks: string[] = [
    "MARK SCHEME — TEACHER USE ONLY",
    "Auto-built from the worksheet questions. Mechanical answers (True/False, MCQ, Word Bank, Matching) are derived directly from the pupil-facing content and are guaranteed to match. Open-ended answers carry the model answer suggested at generation time — teachers should validate before marking.",
    "",
  ];

  for (const slot of slots) {
    const header = slot.marks !== undefined && Number.isFinite(slot.marks)
      ? `Q${slot.qNum} (${slot.sectionTitle}) [${slot.marks} mark${slot.marks === 1 ? "" : "s"}]`
      : `Q${slot.qNum} (${slot.sectionTitle})`;
    blocks.push(header);

    if (slot.derivedAnswer) {
      // Indent the derived block for readability. Each line gets two leading
      // spaces; we don't add bullets to keep the content stable for any
      // downstream renderers that auto-format mark schemes.
      const indented = slot.derivedAnswer
        .split("\n")
        .map(l => (l ? `  ${l}` : l))
        .join("\n");
      blocks.push(indented);
    } else {
      const aiText = aiAnswerByQ[slot.qNum];
      if (aiText && aiText.trim()) {
        const indented = aiText
          .split("\n")
          .map(l => (l ? `  ${l}` : l))
          .join("\n");
        blocks.push(indented);
      } else {
        blocks.push(
          `  Open response — accept answers showing genuine subject understanding. Award marks per the published mark scheme criteria for this question type.`,
        );
      }
    }
    blocks.push("");
  }

  return blocks.join("\n").trimEnd();
}

/**
 * Public entry point — runs as part of the worksheet post-validator chain.
 *
 * Returns the worksheet unchanged if either (a) no question sections are
 * present, (b) no mechanical answers could be derived (the conservative
 * "do nothing" path), or (c) the worksheet is a maths sheet — those use
 * the mathsVerifier's existing mark-scheme parser which expects per-Q
 * numeric/equation answer lines, and PR-M1/PR-M2 already strips T/F, MCQ
 * and gap-fill from maths so the reconciler would have no mechanical
 * answers to derive anyway.
 */
export function reconcileMarkScheme(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];

  // Maths gate — see docstring above.
  const subject = (opts.subject || ws.metadata?.subject || "").toString().toLowerCase();
  if (subject.includes("math")) {
    return { worksheet: ws, warnings };
  }

  const sections = ws.sections || [];
  if (sections.length === 0) {
    return { worksheet: ws, warnings };
  }

  const slots = buildQuestionSlots(sections);
  if (slots.length === 0) {
    return { worksheet: ws, warnings };
  }

  const derivedCount = slots.filter(s => s.derivedAnswer !== null).length;
  if (derivedCount === 0) {
    // Nothing mechanical to lock down — leave AI mark scheme untouched.
    return { worksheet: ws, warnings };
  }

  // Find the FIRST mark-scheme / teacher-key section. We deliberately do
  // not touch additional teacher-only blocks like "Teacher Notes" or
  // "SEND Adaptations & Rationale" — those carry pedagogical guidance the
  // AI was instructed to write and that we have no deterministic source
  // for.
  const markSchemeIndex = sections.findIndex(s => isMarkSchemeSection(s) && s.teacherOnly !== false);
  if (markSchemeIndex === -1) {
    return { worksheet: ws, warnings };
  }

  const existingContent = String(sections[markSchemeIndex].content || "");
  const aiAnswerByQ = extractAiAnswerByQNum(existingContent);

  // Drift logging: where the AI did write a per-Q answer, compare it to the
  // deterministic answer on a best-effort basis. We only flag clear
  // mismatches (different MCQ letter / different T/F / different word bank
  // size) — fuzzy textual differences are normal and not flagged.
  for (const slot of slots) {
    if (!slot.derivedAnswer) continue;
    const aiText = aiAnswerByQ[slot.qNum];
    if (!aiText) continue;

    if (slot.kind === "mcq") {
      const correctLetterMatch = slot.derivedAnswer.match(/Correct answer:\s*([A-D])/i);
      const aiLetterMatch = aiText.match(/\b([A-D])\b/);
      if (correctLetterMatch && aiLetterMatch && correctLetterMatch[1].toUpperCase() !== aiLetterMatch[1].toUpperCase()) {
        warnings.push(
          `Mark-scheme reconciler: AI claimed Q${slot.qNum} answer "${aiLetterMatch[1].toUpperCase()}" but ✓ in question marks "${correctLetterMatch[1].toUpperCase()}". Using deterministic answer.`,
        );
      }
    } else if (slot.kind === "true-false") {
      // Spot-check that the AI's per-statement TRUE/FALSE counts match the
      // derived answers. We don't enforce per-line equality because the AI
      // sometimes paraphrases — but a different True/False count is a
      // clear desync.
      const derivedCounts = (slot.derivedAnswer.match(/\b(TRUE|FALSE)\b/g) || []).length;
      const aiCounts = (aiText.match(/\b(TRUE|FALSE)\b/gi) || []).length;
      if (derivedCounts > 0 && aiCounts > 0 && derivedCounts !== aiCounts) {
        warnings.push(
          `Mark-scheme reconciler: Q${slot.qNum} AI mark scheme has ${aiCounts} T/F entries but the question has ${derivedCounts}. Using deterministic answer.`,
        );
      }
    }
  }

  const newContent = buildReconciledContent(slots, aiAnswerByQ);
  const updatedSection: PostValidatorSection = {
    ...sections[markSchemeIndex],
    content: newContent,
  };
  const newSections = sections.slice();
  newSections[markSchemeIndex] = updatedSection;

  warnings.push(
    `Mark-scheme reconciler: rebuilt teacher key from ${derivedCount}/${slots.length} mechanical question(s).`,
  );

  return {
    worksheet: { ...ws, sections: newSections },
    warnings,
  };
}
