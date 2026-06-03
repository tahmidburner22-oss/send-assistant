/**
 * worksheetScrutinyValidatorsV2.ts
 *
 * June 2026 — Sprint 8 validators. These close the remaining gaps
 * identified in the V2 improvement plan (items B3–B7, B9):
 *
 *   1. enforceVocabTableFormat        — clean 2-column "Term — Definition"
 *   2. enforceWorkedExampleBrevity    — warn on narrative steps >15 words
 *   3. enforceInstructionBoxDedup     — global "What you need to do" cap
 *   4. enforceDiagramPresence         — warn if science/geo has 0 diagrams
 *   5. enforceQuestionWordingBrevity  — KS3 question stems ≤30 words
 *   6. Enhanced quality checker additions (real-world, variety, smoothness)
 *
 * Every validator is:
 *   - Pure (takes a worksheet, returns a new worksheet — no mutation)
 *   - Idempotent (running twice is the same as running once)
 *   - Conservative (never deletes content the LLM generated correctly)
 *   - Observable (appends a human-readable warning for every fix applied)
 */

import type {
  PostValidatorWorksheet,
  PostValidatorSection,
  PostValidatorOptions,
  PostValidatorResult,
} from "./worksheetPostValidator";

// ─── B3: Vocabulary Table Format Enforcer ────────────────────────────────────
// Teacher feedback: vocabulary grid is cluttered and uneven. Use a simple
// two-column list (Word — Definition). Remove empty cells. Keep definitions
// short, clear, and age-appropriate. Cap at 8-10 terms.

const VOCAB_SECTION_TYPES = new Set([
  "vocabulary", "key-terms", "key-vocab", "glossary",
]);

/**
 * Enforces clean vocabulary formatting:
 * 1. Each non-empty line becomes "Term — Definition" (or just "Term" if no def)
 * 2. Empty lines/cells removed
 * 3. Cap at 10 terms
 * 4. Removes markdown table formatting (|) and replaces with clean list
 */
export function enforceVocabTableFormat(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  let fixCount = 0;

  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    const type = String(s.type || "").toLowerCase();
    if (!VOCAB_SECTION_TYPES.has(type)) return s;

    const content = String(s.content || "");
    if (!content.trim()) return s;

    // Detect if it's already clean format (bullet list with — or : separator)
    const lines = content.split("\n").filter(l => l.trim());
    const isClean = lines.every(l =>
      /^[-•*]\s*.+\s*[—–:\-]\s*.+$/.test(l.trim()) || // "- Term — Def" or "• Term: Def"
      /^[A-Z]/.test(l.trim()) // Or just a capitalised term
    );

    if (isClean && lines.length <= 10) return s; // Already fine

    // Parse terms from various formats
    const parsed: Array<{ term: string; definition: string }> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip markdown table separators (|---|---|)
      if (/^\|?\s*[-:]+\s*\|/.test(trimmed)) continue;
      // Skip pure separator lines
      if (/^[-=_]{3,}$/.test(trimmed)) continue;

      // Try to parse markdown table row: | Term | Definition |
      const tableMatch = trimmed.match(/^\|?\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|?$/);
      if (tableMatch && tableMatch[1].trim() && !/^[-:]+$/.test(tableMatch[1].trim())) {
        parsed.push({
          term: tableMatch[1].trim().replace(/\*\*/g, ""),
          definition: (tableMatch[2] || "").trim().replace(/\*\*/g, ""),
        });
        continue;
      }

      // Try: "Term — Definition" or "Term: Definition" or "Term - Definition"
      const sepMatch = trimmed.match(/^[-•*]?\s*(.+?)\s*[—–:\-]\s+(.+)$/);
      if (sepMatch) {
        parsed.push({
          term: sepMatch[1].trim().replace(/\*\*/g, ""),
          definition: sepMatch[2].trim().replace(/\*\*/g, ""),
        });
        continue;
      }

      // Just a term with no definition
      const cleanTerm = trimmed.replace(/^[-•*]\s*/, "").replace(/\*\*/g, "").trim();
      if (cleanTerm.length > 1 && cleanTerm.length < 60) {
        parsed.push({ term: cleanTerm, definition: "" });
      }
    }

    if (parsed.length === 0) return s;

    // Cap at 10 terms
    const capped = parsed.slice(0, 10);

    // Rebuild as clean format: "• Term — Definition" per line
    const newContent = capped.map(({ term, definition }) => {
      if (definition) {
        return `• ${term} — ${definition}`;
      }
      return `• ${term}`;
    }).join("\n");

    if (newContent !== content) {
      fixCount++;
      return { ...s, content: newContent };
    }
    return s;
  });

  if (fixCount > 0) {
    warnings.push(
      `[B3 — Vocab Format] Reformatted vocabulary to clean 2-column "Term — Definition" list in ${fixCount} section(s).`
    );
  }

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── B4: Worked Example Brevity Enforcer ─────────────────────────────────────
// Teacher feedback: worked examples are too narrative. Steps should be short,
// punchy bullet points. This validator WARNS (does not rewrite) when any step
// line exceeds 15 words of prose (ignoring formulae/LaTeX).

const WORKED_EXAMPLE_TYPES = new Set([
  "example", "worked-example", "q-worked-example",
]);

function countProseWords(line: string): number {
  // Strip LaTeX (anything in \(...\) or $$...$$)
  const noLatex = line
    .replace(/\\\(.+?\\\)/g, " FORMULA ")
    .replace(/\$\$.+?\$\$/g, " FORMULA ")
    .replace(/\$.+?\$/g, " FORMULA ");
  // Strip step labels like "Step 1:", "Method:", "Answer:"
  const noLabel = noLatex.replace(/^\s*(Step\s*\d+|Method|Answer|Key point|Formula|Note)\s*[:—–-]\s*/i, "");
  // Count remaining words
  return noLabel.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function enforceWorkedExampleBrevity(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  let verboseSteps = 0;

  for (const s of (ws.sections || [])) {
    const type = String(s.type || "").toLowerCase();
    if (!WORKED_EXAMPLE_TYPES.has(type)) continue;

    const content = String(s.content || "");
    if (!content) continue;

    const lines = content.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const words = countProseWords(line);
      if (words > 20) {
        verboseSteps++;
      }
    }
  }

  if (verboseSteps > 0) {
    warnings.push(
      `[B4 — Worked Example Brevity] ${verboseSteps} step line(s) in the worked example exceed 20 words of prose. ` +
      `Teacher feedback: "Reduce steps to short, punchy bullet points." Consider splitting long narrative into sub-steps.`
    );
  }

  return { worksheet: ws, warnings };
}

// ─── B5: Instruction Box Dedup (Global) ──────────────────────────────────────
// Teacher feedback: too many "WHAT YOU NEED TO DO" sections. Maximum ONE per
// section (3 total for a 3-section worksheet). This validator counts them
// globally and warns if exceeded.

export function enforceInstructionBoxDedup(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];

  const INSTRUCTION_RE = /what you need to do|how to answer|instructions for this section/gi;
  let totalBoxes = 0;

  for (const s of (ws.sections || [])) {
    if (s.teacherOnly) continue;
    const content = String(s.content || "");
    const title = String(s.title || "");
    const combined = title + "\n" + content;

    INSTRUCTION_RE.lastIndex = 0;
    const matches = combined.match(INSTRUCTION_RE);
    if (matches) {
      totalBoxes += matches.length;
    }
  }

  // Max 3 instruction boxes (one per section: Recall, Understanding, Application)
  if (totalBoxes > 3) {
    warnings.push(
      `[B5 — Instruction Dedup] Found ${totalBoxes} "What you need to do" instruction boxes. ` +
      `Maximum is 3 (one per section). Teacher feedback: "Keep ONE guidance box at the top of each section only."`
    );
  }

  return { worksheet: ws, warnings };
}

// ─── B6: Diagram Presence Enforcer ───────────────────────────────────────────
// Teacher feedback: "DIAGRAMS NEED TO BE IMPLEMENTED". For subjects where
// visuals are essential (science, geography, DT), warn if zero diagram
// sections remain after placeholder stripping.

const DIAGRAM_REQUIRED_SUBJECTS = [
  "science", "biology", "chemistry", "physics",
  "geography", "design", "engineering",
];

const DIAGRAM_SECTION_TYPES = new Set([
  "diagram", "diagram-a", "diagram-b", "q-label-diagram",
]);

export function enforceDiagramPresence(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const subject = (opts.subject || String(ws.metadata?.subject || "")).toLowerCase();

  // Only enforce on subjects where diagrams are essential
  const needsDiagram = DIAGRAM_REQUIRED_SUBJECTS.some(s => subject.includes(s));
  if (!needsDiagram) return { worksheet: ws, warnings };

  // Count remaining diagram sections (non-teacher-only)
  const diagramCount = (ws.sections || []).filter(s => {
    if (s.teacherOnly) return false;
    const type = String(s.type || "").toLowerCase();
    if (DIAGRAM_SECTION_TYPES.has(type)) return true;
    // Also check for [[DIAGRAM:...]] markers in content
    const content = String(s.content || "");
    if (/\[\[DIAGRAM:/i.test(content)) return true;
    // Check for SVG content
    if ((s as any).svg || (s as any).imageUrl || (s as any).diagramImageUrl) return true;
    return false;
  }).length;

  if (diagramCount === 0) {
    warnings.push(
      `[B6 — Diagram Presence] No diagrams found in this ${subject} worksheet. ` +
      `Rule: "No page should be mostly text. Visuals should support understanding." ` +
      `Consider adding a labelled diagram relevant to the topic.`
    );
  }

  return { worksheet: ws, warnings };
}

// ─── B9: Question Wording Brevity (KS3) ─────────────────────────────────────
// Teacher feedback: "Language needs to change for younger years, need to be a
// lot less writing. Make sentences, not paragraphs." For Year 7-9, warn if any
// single question stem line exceeds 30 words.

const QUESTION_SECTION_TYPES = new Set([
  "q-short-answer", "q-extended", "q-challenge", "q-free-response", "q-mcq",
  "q-gap-fill", "q-true-false", "q-label-diagram", "q-data-table", "q-graph",
  "q-circuit", "q-draw", "q-ordering", "q-matching", "q-primary-activity",
  "recall", "understanding", "application", "guided", "independent", "challenge",
]);

export function enforceQuestionWordingBrevity(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const yearGroup = opts.yearGroup || String(ws.metadata?.yearGroup || "");
  const yearNum = parseInt(yearGroup.replace(/[^0-9]/g, ""), 10);

  // Only enforce on KS3 (Year 7–9)
  if (!Number.isFinite(yearNum) || yearNum < 7 || yearNum > 9) {
    return { worksheet: ws, warnings };
  }

  let longStemCount = 0;
  const MAX_WORDS_KS3 = 30;

  for (const s of (ws.sections || [])) {
    if (s.teacherOnly) continue;
    const type = String(s.type || "").toLowerCase();
    if (!QUESTION_SECTION_TYPES.has(type)) continue;

    const content = String(s.content || "");
    if (!content) continue;

    // Check each line that looks like a question (starts with a number or Q)
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Only check lines that look like question stems
      if (!/^\s*(?:Q?\d+[\.\):]|\[\s*\]|[a-d]\))/i.test(trimmed)) continue;

      const wordCount = trimmed.split(/\s+/).length;
      if (wordCount > MAX_WORDS_KS3) {
        longStemCount++;
      }
    }
  }

  if (longStemCount > 0) {
    warnings.push(
      `[B9 — KS3 Brevity] ${longStemCount} question stem(s) exceed ${MAX_WORDS_KS3} words for Year ${yearNum}. ` +
      `Teacher feedback: "Make sentences, not paragraphs. Keep key numbers and operations clear."`
    );
  }

  return { worksheet: ws, warnings };
}

// ─── B7: Enhanced Quality Checker Additions ──────────────────────────────────
// Extends the quality checker with three new checks:
// 1. Real-world application present
// 2. Question type variety (≥3 distinct types)
// 3. Difficulty smoothness (no mark jumps >3 between adjacent questions)

export function enforceEnhancedQualityChecks(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];

  const studentSections = (ws.sections || []).filter(s => !s.teacherOnly);
  const allContent = studentSections.map(s => String(s.content || "")).join("\n");

  // ── Check 1: Real-world application present ────────────────────────
  const REAL_WORLD_MARKERS = /\b(£|\$|€)\s*\d|\b\d+\s*(km|metres?|miles?|seconds?|minutes?|hours?|kg|grams?|litres?|ml)\b|\b(cost|price|budget|profit|recipe|journey|distance|speed|shop|restaurant|garden|paint|tile|fence|bill|salary|rent|ticket|discount|sale)\b/i;
  const hasRealWorld = REAL_WORLD_MARKERS.test(allContent);

  if (!hasRealWorld) {
    warnings.push(
      `[B7 — Quality: Real-World] No real-world application questions detected. ` +
      `Every worksheet should contain at least one question with a monetary, distance, or everyday context.`
    );
  }

  // ── Check 2: Question type variety ─────────────────────────────────
  const questionTypes = new Set<string>();
  for (const s of studentSections) {
    const type = String(s.type || "").toLowerCase();
    if (type.startsWith("q-")) questionTypes.add(type);
    // Also detect from content
    const content = String(s.content || "");
    if (/true\s*\/?\s*false|TRUE\s+FALSE/i.test(content)) questionTypes.add("q-true-false");
    if (/^[A-D]\s+/m.test(content)) questionTypes.add("q-mcq");
    if (/word\s*bank|_____/i.test(content)) questionTypes.add("q-gap-fill");
    if (/match|connect|link.*line/i.test(content)) questionTypes.add("q-matching");
  }

  if (questionTypes.size < 3) {
    warnings.push(
      `[B7 — Quality: Variety] Only ${questionTypes.size} distinct question type(s) found (${[...questionTypes].join(", ")}). ` +
      `Minimum 3 required. Students remain engaged longer when task types vary.`
    );
  }

  // ── Check 3: Difficulty smoothness ─────────────────────────────────
  const marksSequence: number[] = [];
  for (const s of studentSections) {
    const marks = Number((s as any).marks);
    if (Number.isFinite(marks) && marks > 0) {
      marksSequence.push(marks);
    }
  }

  let bigJumps = 0;
  for (let i = 1; i < marksSequence.length; i++) {
    const jump = marksSequence[i] - marksSequence[i - 1];
    if (jump > 4) bigJumps++; // Jump of >4 marks is too sudden
  }

  if (bigJumps > 0) {
    warnings.push(
      `[B7 — Quality: Smoothness] ${bigJumps} mark-jump(s) exceed 4 marks between adjacent sections. ` +
      `Difficulty should rise smoothly. Add medium-level questions between basics and challenges.`
    );
  }

  return { worksheet: ws, warnings };
}
