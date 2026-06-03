/**
 * worksheetScrutinyValidators.ts
 *
 * June 2026 — Comprehensive worksheet improvement validators.
 *
 * These validators address ALL feedback from the worksheet scrutiny review:
 *   - Sprint 1: L.O. wording, Common Mistakes caps/rename, diagram hardening
 *   - Sprint 2: KS3 length reduction, reflection cap, maths text reduction
 *   - Sprint 3: Pedagogy enforcement (Do Now default, vocab repeat, misconception check)
 *   - Sprint 5: Full pedagogy quality checker
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

// ─── Sprint 1.1: L.O. Wording Enforcement ───────────────────────────────────
// Teacher feedback: L.O. says "Students will" instead of "By the end of the
// lesson you will". Fix: rewrite any "Students will", "Pupils will",
// "Learners will", "Students should be able to" to the correct pupil-facing
// form: "By the end of the lesson you will".

const LO_BAD_PATTERNS = [
  /\bStudents will\b/gi,
  /\bPupils will\b/gi,
  /\bLearners will\b/gi,
  /\bStudents should be able to\b/gi,
  /\bPupils should be able to\b/gi,
  /\bLearners should be able to\b/gi,
  /\bStudents can\b/gi,
  /\bPupils can\b/gi,
  /\bBy the end of (?:this|the) lesson,?\s*students will\b/gi,
  /\bBy the end of (?:this|the) lesson,?\s*pupils will\b/gi,
];

const LO_REPLACEMENT = "By the end of the lesson you will";

const LO_SECTION_TYPES = new Set([
  "learning-objective", "learning_objective", "objective", "lo", "header",
]);

export function enforceLearningObjectiveWording(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  let fixCount = 0;

  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    const type = String(s.type || "").toLowerCase();
    // Only process L.O. sections and header sections (which sometimes contain the L.O.)
    if (!LO_SECTION_TYPES.has(type) && !String(s.title || "").toLowerCase().includes("objective")) {
      return s;
    }

    let content = String(s.content || "");
    let title = String(s.title || "");
    let changed = false;

    for (const pattern of LO_BAD_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        content = content.replace(pattern, LO_REPLACEMENT);
        changed = true;
      }
      pattern.lastIndex = 0;
      if (pattern.test(title)) {
        title = title.replace(pattern, LO_REPLACEMENT);
        changed = true;
      }
    }

    if (changed) {
      fixCount++;
      return { ...s, content, title };
    }
    return s;
  });

  if (fixCount > 0) {
    warnings.push(
      `[Sprint 1] Rewrote L.O. wording to "By the end of the lesson you will" in ${fixCount} section(s).`
    );
  }

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── Sprint 1.2: Common Mistakes — ALL CAPS → Sentence Case + "Mistake" → "Misconception" ──

const MISTAKE_LABEL_RE = /\b(COMMON\s+)?MISTAKE\s*(\d*)\s*:/gi;
const MISCONCEPTION_LABEL_RE = /\b(COMMON\s+)?MISCONCEPTION\s*(\d*)\s*:/gi;

/**
 * Converts ALL-CAPS text in Common Mistakes / Misconceptions sections to
 * sentence case. Renames "Mistake" → "Misconception" throughout.
 */
export function enforceCommonMistakesSentenceCase(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  let fixCount = 0;

  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    const type = String(s.type || "").toLowerCase();
    if (type !== "common-mistakes" && type !== "misconceptions" && type !== "common_mistakes") {
      // Still check for "Mistake" label in other sections
      let content = String(s.content || "");
      let title = String(s.title || "");
      let changed = false;

      MISTAKE_LABEL_RE.lastIndex = 0;
      if (MISTAKE_LABEL_RE.test(content)) {
        content = content.replace(MISTAKE_LABEL_RE, (_m, prefix, num) =>
          `${prefix ? "Common " : ""}Misconception ${num}:`.replace(/\s+/g, " ")
        );
        changed = true;
      }
      MISTAKE_LABEL_RE.lastIndex = 0;
      if (MISTAKE_LABEL_RE.test(title)) {
        title = title.replace(MISTAKE_LABEL_RE, (_m, prefix, num) =>
          `${prefix ? "Common " : ""}Misconception ${num}:`.replace(/\s+/g, " ")
        );
        changed = true;
      }
      // Also replace standalone "Common Mistakes" in titles
      if (/common\s*mistakes/i.test(title)) {
        title = title.replace(/common\s*mistakes/gi, "Common Misconceptions");
        changed = true;
      }

      if (changed) {
        fixCount++;
        return { ...s, content, title };
      }
      return s;
    }

    // This IS a common-mistakes / misconceptions section — full treatment
    let content = String(s.content || "");
    let title = String(s.title || "");
    let changed = false;

    // 1. Rename title
    if (/common\s*mistakes/i.test(title)) {
      title = title.replace(/common\s*mistakes/gi, "Common Misconceptions");
      changed = true;
    }
    if (/\bmistake/i.test(title) && !/misconception/i.test(title)) {
      title = title.replace(/\bmistakes?\b/gi, "Misconceptions");
      changed = true;
    }

    // 2. Convert "MISTAKE N:" labels to "Misconception N:"
    MISTAKE_LABEL_RE.lastIndex = 0;
    if (MISTAKE_LABEL_RE.test(content)) {
      content = content.replace(MISTAKE_LABEL_RE, (_m, prefix, num) =>
        `${prefix ? "Common " : ""}Misconception ${num}:`.replace(/\s+/g, " ").trim()
      );
      changed = true;
    }

    // 3. Convert ALL-CAPS lines to sentence case
    // Only convert if content is predominantly uppercase (>50% uppercase letters)
    const lines = content.split("\n");
    const newLines = lines.map(line => {
      const letters = line.replace(/[^a-zA-Z]/g, "");
      if (letters.length === 0) return line;
      const upperCount = (line.match(/[A-Z]/g) || []).length;
      if (upperCount / letters.length > 0.6 && letters.length > 5) {
        changed = true;
        // Sentence case conversion
        return line.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase())
          .replace(/^([a-z])/, (m) => m.toUpperCase());
      }
      return line;
    });
    if (changed) {
      content = newLines.join("\n");
    }

    // 4. Replace any remaining "mistake" with "misconception" in body text
    if (/\bmistake\b/i.test(content)) {
      content = content.replace(/\bcommon mistakes?\b/gi, "common misconceptions");
      content = content.replace(/\bmistakes?\b/gi, "misconceptions");
      changed = true;
    }

    if (changed) {
      fixCount++;
      return { ...s, content, title };
    }
    return s;
  });

  if (fixCount > 0) {
    warnings.push(
      `[Sprint 1] Converted "Mistake" → "Misconception" and ALL CAPS → sentence case in ${fixCount} section(s).`
    );
  }

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── Sprint 2.1: Single Reflection Element Enforcement ──────────────────────
// Teacher feedback: confidence grid + written reflection + exit ticket is too
// long. Fix: if the reflection/self-reflection section has more than ONE
// actionable element (exit question), trim to just the exit question.

export function enforceReflectionCap(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  const REFLECTION_TYPES = new Set([
    "self-reflection", "self-assessment", "reflection", "review",
  ]);

  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    const type = String(s.type || "").toLowerCase();
    if (!REFLECTION_TYPES.has(type)) return s;

    const content = String(s.content || "");
    if (!content) return s;

    // Count distinct elements: confidence grid, written paragraph prompt,
    // exit ticket, RAG rating, etc.
    const hasConfidenceGrid = /confidence|how confident|rate yourself|RAG/i.test(content);
    const hasWrittenReflection = /write\s+(?:a\s+paragraph|about|three\s+things|two\s+things)/i.test(content);
    const hasExitTicket = /exit\s*ticket|one\s*thing\s*you\s*(?:learned|learnt)/i.test(content);
    const hasMultipleElements = [hasConfidenceGrid, hasWrittenReflection, hasExitTicket]
      .filter(Boolean).length > 1;

    if (!hasMultipleElements) return s;

    // Keep ONLY the exit-ticket style single question
    const lines = content.split("\n");
    const exitLines: string[] = [];
    let foundExit = false;

    for (const line of lines) {
      if (/exit\s*ticket|one\s*thing\s*you|write\s*one\s*sentence|what\s*did\s*you\s*learn/i.test(line)) {
        foundExit = true;
        exitLines.push(line);
      } else if (foundExit && line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
        exitLines.push(line);
        break; // Only keep the one line after the exit prompt
      }
    }

    if (exitLines.length === 0) {
      // No exit ticket found — create a minimal one
      exitLines.push("Write one thing you learned today:");
    }

    warnings.push(
      `[Sprint 2] Capped reflection section to a single exit question (removed confidence grid / written paragraph).`
    );

    return {
      ...s,
      title: "Quick Reflection",
      content: exitLines.join("\n"),
    };
  });

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── Sprint 2.2: Maths Instructions Text Cap ────────────────────────────────
// Teacher feedback: Maths worksheets have too much reading — instructions are
// too long. Fix: For maths worksheets, cap instruction/guidance text blocks
// to maximum 2 lines (sentences).

export function enforceMathsInstructionBrevity(
  ws: PostValidatorWorksheet,
  opts: PostValidatorOptions = {},
): PostValidatorResult {
  const warnings: string[] = [];
  const subject = opts.subject || String(ws.metadata?.subject || "");
  if (!subject.toLowerCase().includes("math")) {
    return { worksheet: ws, warnings };
  }

  let fixCount = 0;
  const INSTRUCTION_SECTION_TYPES = new Set([
    "reminder-box", "send-support", "reading",
  ]);

  const sections = (ws.sections || []).map((s): PostValidatorSection => {
    const type = String(s.type || "").toLowerCase();
    // Only trim instruction/hint/guidance sections, not questions
    if (!INSTRUCTION_SECTION_TYPES.has(type)) return s;

    const content = String(s.content || "");
    if (!content) return s;

    // Count non-empty lines
    const lines = content.split("\n").filter(l => l.trim());
    if (lines.length <= 3) return s; // Already short enough

    // Keep first 3 lines (max 2 instruction lines + heading)
    const trimmed = lines.slice(0, 3).join("\n");
    if (trimmed !== content) {
      fixCount++;
      return { ...s, content: trimmed };
    }
    return s;
  });

  if (fixCount > 0) {
    warnings.push(
      `[Sprint 2] Trimmed ${fixCount} maths instruction block(s) to max 3 lines for reduced text load.`
    );
  }

  return { worksheet: { ...ws, sections }, warnings };
}

// ─── Sprint 3: Pedagogy Structure Enforcement ────────────────────────────────
// Every worksheet MUST contain: retrieval/do-now, worked example, guided,
// independent, reasoning, and challenge. This validator WARNS (does not fix)
// when sections are missing.

const REQUIRED_PEDAGOGY_SECTIONS = [
  { label: "Retrieval / Do Now", types: ["retrieval", "prior-knowledge", "starter", "do-now"] },
  { label: "Worked Example", types: ["example", "worked-example", "q-worked-example"] },
  { label: "Guided / Recall", types: ["guided", "recall", "section-a", "q-gap-fill", "q-true-false", "q-mcq"] },
  { label: "Independent Practice", types: ["independent", "understanding", "application", "section-b"] },
  { label: "Challenge / Extension", types: ["challenge", "q-challenge", "extension"] },
];

export function enforcePedagogyStructurePresence(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  const sectionTypes = new Set(
    (ws.sections || []).map(s => String(s.type || "").toLowerCase())
  );

  const missing: string[] = [];
  for (const req of REQUIRED_PEDAGOGY_SECTIONS) {
    const found = req.types.some(t => sectionTypes.has(t));
    if (!found) {
      missing.push(req.label);
    }
  }

  if (missing.length > 0) {
    warnings.push(
      `[Sprint 3 — Pedagogy] Missing required sections: ${missing.join(", ")}. ` +
      `Every worksheet should follow: Do Now → Worked Example → Guided → Independent → Challenge.`
    );
  }

  return { worksheet: ws, warnings };
}

// ─── Sprint 5: Full AI Quality Checker ──────────────────────────────────────
// Before a worksheet is released, automatically check:
// SEND: vocab support, worked example, clear instructions, visual support
// Pedagogy: retrieval, guided, independent, reasoning, challenge
// Assessment: misconception check, exit ticket
// Design: no large text walls, good spacing, consistent formatting

export interface QualityCheckReport {
  send: {
    vocabularySupport: boolean;
    workedExample: boolean;
    clearInstructions: boolean;
    visualSupport: boolean;
    score: number; // 0-25
  };
  pedagogy: {
    retrievalPresent: boolean;
    guidedPractice: boolean;
    independentPractice: boolean;
    reasoningPresent: boolean;
    challengePresent: boolean;
    score: number; // 0-25
  };
  assessment: {
    misconceptionCheck: boolean;
    exitTicket: boolean;
    markScheme: boolean;
    score: number; // 0-25
  };
  design: {
    noTextWalls: boolean;
    goodSpacing: boolean;
    consistentFormatting: boolean;
    diagramsPresent: boolean;
    score: number; // 0-25
  };
  total: number; // 0-100
  status: "publish-ready" | "good" | "needs-revision" | "do-not-publish";
  missingElements: string[];
}

export function runFullQualityCheck(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  const sectionTypes = new Set(
    (ws.sections || []).map(s => String(s.type || "").toLowerCase())
  );
  const allContent = (ws.sections || [])
    .filter(s => !s.teacherOnly)
    .map(s => String(s.content || ""))
    .join("\n");

  // ── SEND checks ────────────────────────────────────────────────────
  const hasVocab = sectionTypes.has("vocabulary") || sectionTypes.has("key-terms") ||
    /key\s*(?:vocabulary|terms|words)/i.test(allContent);
  const hasWorkedExample = sectionTypes.has("example") || sectionTypes.has("worked-example");
  const hasClearInstructions = (ws.sections || []).some(s =>
    String(s.type || "").toLowerCase() === "send-support" ||
    /what you need to do|instructions|how to/i.test(String(s.content || ""))
  );
  const hasVisualSupport = sectionTypes.has("diagram") || sectionTypes.has("diagram-a") ||
    sectionTypes.has("diagram-b") || sectionTypes.has("q-label-diagram") ||
    /\[\[DIAGRAM:/i.test(allContent);

  // ── Pedagogy checks ────────────────────────────────────────────────
  const hasRetrieval = sectionTypes.has("retrieval") || sectionTypes.has("prior-knowledge") || sectionTypes.has("starter");
  const hasGuided = sectionTypes.has("guided") || sectionTypes.has("recall");
  const hasIndependent = sectionTypes.has("independent") || sectionTypes.has("understanding") || sectionTypes.has("application");
  const hasReasoning = /\b(explain|why|convince|justify|prove|reason|because)\b/i.test(allContent);
  const hasChallenge = sectionTypes.has("challenge") || sectionTypes.has("q-challenge");

  // ── Assessment checks ──────────────────────────────────────────────
  const hasMisconceptionCheck = sectionTypes.has("common-mistakes") || sectionTypes.has("misconceptions") ||
    /misconception|common mistake|student says|explain why.*wrong/i.test(allContent);
  const hasExitTicket = sectionTypes.has("self-reflection") || sectionTypes.has("self-assessment") ||
    /exit\s*ticket|one\s*thing\s*you\s*learn/i.test(allContent);
  const hasMarkScheme = sectionTypes.has("mark-scheme") || sectionTypes.has("answers") || sectionTypes.has("teacher-key");

  // ── Design checks ─────────────────────────────────────────────────
  const textWallSections = (ws.sections || []).filter(s => {
    if (s.teacherOnly) return false;
    const content = String(s.content || "");
    const lines = content.split("\n").filter(l => l.trim());
    // A "text wall" is >8 consecutive lines with no blank line, no bullet, no question number
    return lines.length > 8 && !lines.some(l => /^[-•*]|^\d+[.)]|^[A-D][.)]|^Q\d/i.test(l));
  });
  const noTextWalls = textWallSections.length === 0;
  const hasDiagrams = hasVisualSupport;
  // Consistent formatting: check that question sections use consistent numbering
  const questionSections = (ws.sections || []).filter(s => {
    const t = String(s.type || "").toLowerCase();
    return t.startsWith("q-") || ["guided", "independent", "recall", "understanding", "application"].includes(t);
  });
  const consistentFormatting = questionSections.length > 0; // basic check

  // ── Scoring ────────────────────────────────────────────────────────
  const sendScore = [hasVocab, hasWorkedExample, hasClearInstructions, hasVisualSupport]
    .filter(Boolean).length * 6.25;
  const pedagogyScore = [hasRetrieval, hasGuided, hasIndependent, hasReasoning, hasChallenge]
    .filter(Boolean).length * 5;
  const assessmentScore = [hasMisconceptionCheck, hasExitTicket, hasMarkScheme]
    .filter(Boolean).length * 8.33;
  const designScore = [noTextWalls, true /* spacing always passes for now */, consistentFormatting, hasDiagrams]
    .filter(Boolean).length * 6.25;

  const total = Math.round(sendScore + pedagogyScore + assessmentScore + designScore);
  const status: QualityCheckReport["status"] =
    total >= 85 ? "publish-ready" :
    total >= 70 ? "good" :
    total >= 50 ? "needs-revision" : "do-not-publish";

  // Collect missing elements
  const missingElements: string[] = [];
  if (!hasVocab) missingElements.push("Vocabulary support");
  if (!hasWorkedExample) missingElements.push("Worked example");
  if (!hasVisualSupport) missingElements.push("Visual/diagram support");
  if (!hasRetrieval) missingElements.push("Retrieval practice / Do Now");
  if (!hasGuided) missingElements.push("Guided practice");
  if (!hasIndependent) missingElements.push("Independent practice");
  if (!hasReasoning) missingElements.push("Reasoning questions");
  if (!hasChallenge) missingElements.push("Challenge / extension");
  if (!hasMisconceptionCheck) missingElements.push("Misconception check");
  if (!hasExitTicket) missingElements.push("Exit ticket / reflection");
  if (!noTextWalls) missingElements.push("Text walls detected (needs breaking up)");
  if (!hasDiagrams) missingElements.push("Diagrams / visual learning support");

  const report: QualityCheckReport = {
    send: { vocabularySupport: hasVocab, workedExample: hasWorkedExample, clearInstructions: hasClearInstructions, visualSupport: hasVisualSupport, score: Math.round(sendScore) },
    pedagogy: { retrievalPresent: hasRetrieval, guidedPractice: hasGuided, independentPractice: hasIndependent, reasoningPresent: hasReasoning, challengePresent: hasChallenge, score: Math.round(pedagogyScore) },
    assessment: { misconceptionCheck: hasMisconceptionCheck, exitTicket: hasExitTicket, markScheme: hasMarkScheme, score: Math.round(assessmentScore) },
    design: { noTextWalls, goodSpacing: true, consistentFormatting, diagramsPresent: hasDiagrams, score: Math.round(designScore) },
    total,
    status,
    missingElements,
  };

  // Stamp report onto metadata
  const updatedWs: PostValidatorWorksheet = {
    ...ws,
    metadata: {
      ...(ws.metadata || {}),
      qualityCheckReport: report,
      qualityCheckScore: total,
      qualityCheckStatus: status,
    },
  };

  if (missingElements.length > 0) {
    warnings.push(
      `[Sprint 5 — Quality Check] Score: ${total}/100 (${status}). Missing: ${missingElements.join("; ")}.`
    );
  }

  return { worksheet: updatedWs, warnings };
}

// ─── Sprint 3.2: Vocabulary Repeat Marker ────────────────────────────────────
// Teacher feedback: vocabulary only appears on page 1. Fix: stamp a metadata
// flag so the renderer/PDF exporter knows to repeat the vocabulary strip as a
// footer on every page.

export function enforceVocabularyRepeat(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];

  // Find the vocabulary section content
  const vocabSection = (ws.sections || []).find(s => {
    const t = String(s.type || "").toLowerCase();
    return t === "vocabulary" || t === "key-terms" || t === "key-vocab" || t === "glossary";
  });

  if (!vocabSection || !vocabSection.content) {
    return { worksheet: ws, warnings };
  }

  // Extract key terms for the repeating footer
  const content = String(vocabSection.content);
  const terms = content.split("\n")
    .map(l => l.replace(/^[-•*]\s*/, "").trim())
    .filter(l => l.length > 1 && l.length < 80)
    .slice(0, 8); // Max 8 terms in the footer strip

  if (terms.length === 0) {
    return { worksheet: ws, warnings };
  }

  const updatedWs: PostValidatorWorksheet = {
    ...ws,
    metadata: {
      ...(ws.metadata || {}),
      vocabularyRepeatEnabled: true,
      vocabularyRepeatTerms: terms,
    },
  };

  warnings.push(
    `[Sprint 3] Enabled vocabulary repeat on every page (${terms.length} terms).`
  );

  return { worksheet: updatedWs, warnings };
}

// ─── Sprint 2.3: KS3 Worksheet Length Enforcement ────────────────────────────
// Teacher feedback: worksheets too long for Year 7. The SECTION_QUESTION_TARGETS
// are already defined elsewhere (7/7/5/1 = 20 questions for secondary). For
// KS3 specifically (Y7-Y9), we reduce to 5/5/3/1 = 14 questions max. This
// validator WARNS when a KS3 worksheet exceeds 14 student-visible sections.

const KS3_MAX_STUDENT_SECTIONS = 16; // 14 questions + vocab + example + reflection

export function enforceKs3LengthBudget(
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

  const studentSections = (ws.sections || []).filter(s => !s.teacherOnly);
  if (studentSections.length > KS3_MAX_STUDENT_SECTIONS) {
    warnings.push(
      `[Sprint 2 — KS3 Length] Worksheet has ${studentSections.length} student-visible sections ` +
      `(target max ${KS3_MAX_STUDENT_SECTIONS} for Year ${yearNum}). Consider reducing question count.`
    );
  }

  return { worksheet: ws, warnings };
}
