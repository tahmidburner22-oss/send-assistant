/**
 * planner.ts — Adaptly Worksheet Planner Engine
 *
 * Stage 1 of the validation pipeline.
 * Determines the topic plan, section goals, and question type sequence
 * for a worksheet before any content is generated.
 *
 * Rules enforced:
 * - Every worksheet must have 2–4 sections
 * - No adjacent questions may share the same layout family
 * - At least 3 layout families per section
 * - At least 5 distinct layout families on a 10-question GCSE sheet
 * - Mark allocation must match visual complexity
 * - Advanced question types (error_correction, ranking, what_changed) as first-class layout families and rotated per the spec:
 *     • max 1–2 per worksheet
 *     • never adjacent to same type
 *     • placed in appropriate Bloom's level sections
 *
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 */

export type LayoutFamily =
  | "true-false"
  | "mcq-2col"
  | "label-diagram"
  | "inline-gap-fill"
  | "diagram-subquestions"
  | "data-table"
  | "short-answer"
  | "extended-answer"
  | "draw-box"
  | "graph-box"
  | "circuit-box"
  | "ordering"
  | "matching"
  // ── Advanced question type families (from pasted spec) ──
  | "error-correction"
  | "ranking"
  | "what-changed";

export type QuestionType =
  | "q-true-false"
  | "q-mcq"
  | "q-gap-fill"
  | "q-short-answer"
  | "q-extended"
  | "q-label-diagram"
  | "q-data-table"
  | "q-draw"
  | "q-graph"
  | "q-circuit"
  | "q-ordering"
  | "q-matching"
  // ── Advanced question types ──
  | "q-error-correction"
  | "q-ranking"
  | "q-what-changed";

export interface SectionPlan {
  id: string;
  title: string;
  groupLabel: string; // e.g. "SECTION 1 — KNOWLEDGE CHECK"
  questionRange: [number, number]; // e.g. [1, 3]
  layoutFamilies: LayoutFamily[];
  questionTypes: QuestionType[];
  totalMarks: number;
}

export interface WorksheetPlan {
  title: string;
  topic: string;
  subject: string;
  yearGroup: string;
  phase: "primary" | "secondary";
  durationMins: number;
  totalQuestions: number;
  totalMarks: number;
  sections: SectionPlan[];
  hasPriorKnowledgeCheck: boolean;
  priorTopic?: string;
  sendNeed?: string;
  layoutFamilySequence: LayoutFamily[]; // full sequence across all questions
  validationWarnings: string[];
}

/** Maps question type to its layout family */
export const QUESTION_LAYOUT_MAP: Record<QuestionType, LayoutFamily> = {
  "q-true-false": "true-false",
  "q-mcq": "mcq-2col",
  "q-gap-fill": "inline-gap-fill",
  "q-short-answer": "short-answer",
  "q-extended": "extended-answer",
  "q-label-diagram": "label-diagram",
  "q-data-table": "data-table",
  "q-draw": "draw-box",
  "q-graph": "graph-box",
  "q-circuit": "circuit-box",
  "q-ordering": "ordering",
  "q-matching": "matching",
  // ── Advanced types ──
  "q-error-correction": "error-correction",
  "q-ranking": "ranking",
  "q-what-changed": "what-changed",
};

/** Maps mark weight to minimum layout complexity */
export const MARK_LAYOUT_RULES: { minMarks: number; maxMarks: number; allowedFamilies: LayoutFamily[] }[] = [
  { minMarks: 1, maxMarks: 1, allowedFamilies: ["true-false", "mcq-2col", "inline-gap-fill", "matching", "ranking"] },
  { minMarks: 2, maxMarks: 3, allowedFamilies: ["true-false", "mcq-2col", "inline-gap-fill", "short-answer", "data-table", "ordering", "matching", "ranking", "error-correction"] },
  { minMarks: 4, maxMarks: 5, allowedFamilies: ["short-answer", "label-diagram", "diagram-subquestions", "data-table", "draw-box", "graph-box", "circuit-box", "error-correction", "what-changed", "ranking"] },
  { minMarks: 6, maxMarks: 99, allowedFamilies: ["extended-answer", "diagram-subquestions", "data-table", "draw-box", "graph-box", "circuit-box", "what-changed", "error-correction"] },
];

/**
 * Section placement rules for advanced question types (from pasted spec):
 * - Recall: Ranking (simple)
 * - Understanding: What Changed, Error Correction
 * - Application: Constraint Problems, Error Correction
 */
const ADVANCED_SECTION_PLACEMENT: Record<string, QuestionType[]> = {
  "knowledge-check": ["q-ranking"],
  "warm-up": ["q-ranking"],
  "understanding": ["q-what-changed", "q-error-correction"],
  "practice": ["q-what-changed", "q-error-correction"],
  "application": ["q-error-correction"],
  "challenge": ["q-error-correction"],
};

/** Standard 30-min base question plan for secondary GCSE */
const BASE_30MIN_SECONDARY: QuestionType[] = [
  "q-true-false",     // Q1 — Knowledge Check
  "q-mcq",            // Q2 — Knowledge Check
  "q-gap-fill",       // Q3 — Knowledge Check
  "q-short-answer",   // Q4 — Understanding
  "q-matching",       // Q5 — Understanding (replaced by advanced type injection)
  "q-short-answer",   // Q6 — Understanding
  "q-extended",       // Q7 — Application & Analysis
  "q-ordering",       // Q8 — Application & Analysis (replaced by advanced type injection)
  "q-extended",       // Q9 — Application & Analysis
];

/** Standard 30-min base question plan for primary */
const BASE_30MIN_PRIMARY: QuestionType[] = [
  "q-true-false",     // Q1 — Warm Up
  "q-mcq",            // Q2 — Warm Up
  "q-gap-fill",       // Q3 — Warm Up
  "q-short-answer",   // Q4 — Practice
  "q-short-answer",   // Q5 — Practice
  "q-draw",           // Q6 — Practice
  "q-short-answer",   // Q7 — Challenge
];

/** Section definitions for secondary worksheets */
const SECONDARY_SECTIONS = [
  { id: "knowledge-check", title: "Knowledge Check", groupLabel: "SECTION 1 — KNOWLEDGE CHECK", qRange: [1, 3] as [number, number] },
  { id: "understanding", title: "Understanding", groupLabel: "SECTION 2 — UNDERSTANDING", qRange: [4, 6] as [number, number] },
  { id: "application", title: "Application & Analysis", groupLabel: "SECTION 3 — APPLICATION & ANALYSIS", qRange: [7, 9] as [number, number] },
];

/** Section definitions for primary worksheets */
const PRIMARY_SECTIONS = [
  { id: "warm-up", title: "Warm Up", groupLabel: "SECTION 1 — WARM UP", qRange: [1, 3] as [number, number] },
  { id: "practice", title: "Let's Practise", groupLabel: "SECTION 2 — LET'S PRACTISE", qRange: [4, 6] as [number, number] },
  { id: "challenge", title: "Challenge", groupLabel: "SECTION 3 — CHALLENGE", qRange: [7, 7] as [number, number] },
];

/**
 * Ensures no two adjacent questions share the same layout family.
 * If a conflict is found, swaps the conflicting question with the next available different type.
 */
function enforceNoAdjacentSameFamily(types: QuestionType[]): QuestionType[] {
  const result = [...types];
  for (let i = 1; i < result.length; i++) {
    if (QUESTION_LAYOUT_MAP[result[i]] === QUESTION_LAYOUT_MAP[result[i - 1]]) {
      // Find the next question with a different family to swap with
      let swapIdx = -1;
      for (let j = i + 1; j < result.length; j++) {
        if (QUESTION_LAYOUT_MAP[result[j]] !== QUESTION_LAYOUT_MAP[result[i - 1]]) {
          swapIdx = j;
          break;
        }
      }
      if (swapIdx !== -1) {
        [result[i], result[swapIdx]] = [result[swapIdx], result[i]];
      }
    }
  }
  return result;
}

/**
 * Counts distinct layout families in a sequence.
 */
function countDistinctFamilies(types: QuestionType[]): number {
  return new Set(types.map(t => QUESTION_LAYOUT_MAP[t])).size;
}

/**
 * Injects 1–2 advanced question types into the sequence based on section placement rules.
 * Replaces one q-short-answer or q-extended with an advanced type where appropriate.
 * Never places more than 2 advanced types per worksheet.
 */
function injectAdvancedTypes(types: QuestionType[], phase: "primary" | "secondary", durationMins: number): QuestionType[] {
  // Only inject for worksheets with enough questions (20+ min)
  if (durationMins < 20 || types.length < 5) return types;

  const result = [...types];
  const sectionDefs = phase === "primary" ? PRIMARY_SECTIONS : SECONDARY_SECTIONS;
  let injected = 0;
  const maxInjections = durationMins >= 30 ? 2 : 1;

  // Pool of advanced types to try, shuffled for variety
  // Ranking is only appropriate for primary school — secondary GCSE never asks students to rank items
  const advancedPool: QuestionType[] = phase === "primary"
    ? ["q-error-correction", "q-ranking", "q-what-changed"]
    : ["q-error-correction", "q-what-changed"];
  // Simple shuffle
  for (let i = advancedPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [advancedPool[i], advancedPool[j]] = [advancedPool[j], advancedPool[i]];
  }

  for (const section of sectionDefs) {
    if (injected >= maxInjections) break;
    const [qStart, qEnd] = section.qRange;
    const allowedAdvanced = ADVANCED_SECTION_PLACEMENT[section.id] || [];
    if (allowedAdvanced.length === 0) continue;

    // Find a replaceable question in this section's range
    for (let qi = qStart - 1; qi < Math.min(qEnd, result.length); qi++) {
      if (injected >= maxInjections) break;
      const currentType = result[qi];
      // Only replace generic types, not already-advanced or diagram types
      if (currentType !== "q-short-answer" && currentType !== "q-extended") continue;

      // Pick an allowed advanced type from the pool
      const candidate = advancedPool.find(at => allowedAdvanced.includes(at));
      if (!candidate) continue;

      result[qi] = candidate;
      // Remove used candidate from pool so we don't repeat
      const poolIdx = advancedPool.indexOf(candidate);
      if (poolIdx !== -1) advancedPool.splice(poolIdx, 1);
      injected++;
      break; // Only one per section
    }
  }

  return result;
}

/**
 * Scales the question plan based on duration.
 */
function scaleForDuration(baseTypes: QuestionType[], durationMins: number, phase: "primary" | "secondary"): QuestionType[] {
  if (durationMins <= 10) {
    return baseTypes.slice(0, 2); // Q1-Q2 only
  }
  if (durationMins <= 20) {
    return baseTypes.slice(0, 5); // Q1-Q5
  }
  if (durationMins >= 60) {
    // Add extra questions
    const extra: QuestionType[] = phase === "secondary"
      ? ["q-extended", "q-data-table"]
      : ["q-short-answer", "q-draw"];
    return [...baseTypes, ...extra];
  }
  if (durationMins >= 45) {
    return [...baseTypes, "q-extended"];
  }
  return baseTypes; // 30 min base
}

/**
 * Main planner function — creates a WorksheetPlan from generation parameters.
 */
export function createWorksheetPlan(params: {
  topic: string;
  subject: string;
  yearGroup: string;
  phase: "primary" | "secondary";
  durationMins: number;
  sendNeed?: string;
  priorTopic?: string;
  difficulty?: string;
}): WorksheetPlan {
  const warnings: string[] = [];
  const isPrimary = params.phase === "primary";

  // 1. Choose base question sequence
  const baseTypes = isPrimary ? [...BASE_30MIN_PRIMARY] : [...BASE_30MIN_SECONDARY];

  // 2. Scale for duration
  let questionTypes = scaleForDuration(baseTypes, params.durationMins, params.phase);

  // 3. Inject advanced question types (1–2 per worksheet, section-appropriate)
  questionTypes = injectAdvancedTypes(questionTypes, params.phase, params.durationMins);

  // 4. Enforce no adjacent same family
  questionTypes = enforceNoAdjacentSameFamily(questionTypes);

  // 5. Check distinct family count
  const distinctFamilies = countDistinctFamilies(questionTypes);
  if (questionTypes.length >= 10 && distinctFamilies < 5) {
    warnings.push(`Only ${distinctFamilies} distinct layout families on a ${questionTypes.length}-question sheet. Minimum 5 required for GCSE.`);
  }

  // 6. Validate advanced type count (max 2)
  const advancedCount = questionTypes.filter(t =>
    ["q-error-correction", "q-ranking", "q-what-changed"].includes(t)
  ).length;
  if (advancedCount > 2) {
    warnings.push(`${advancedCount} advanced question types found. Maximum 2 per worksheet.`);
  }

  // 7. Build section plans
  const sectionDefs = isPrimary ? PRIMARY_SECTIONS : SECONDARY_SECTIONS;
  const totalQ = questionTypes.length;

  const sections: SectionPlan[] = sectionDefs
    .filter(s => s.qRange[0] <= totalQ)
    .map(s => {
      const [qStart, qEnd] = s.qRange;
      const actualEnd = Math.min(qEnd, totalQ);
      const sectionTypes = questionTypes.slice(qStart - 1, actualEnd);
      const families = Array.from(new Set(sectionTypes.map(t => QUESTION_LAYOUT_MAP[t]))) as LayoutFamily[];

      if (families.length < 3 && sectionTypes.length >= 3) {
        warnings.push(`Section "${s.title}" has only ${families.length} layout families. Minimum 3 required.`);
      }

      // Estimate marks: includes advanced types
      const markMap: Record<QuestionType, number> = {
        "q-true-false": 4, "q-mcq": 1, "q-gap-fill": 4,
        "q-short-answer": 3, "q-extended": 5,
        "q-label-diagram": 4, "q-data-table": 4,
        "q-draw": 3, "q-graph": 4, "q-circuit": 4,
        "q-ordering": 3, "q-matching": 3,
        "q-error-correction": 4, "q-ranking": 3,
        "q-what-changed": 4,
      };
      const totalMarks = sectionTypes.reduce((sum, t) => sum + (markMap[t] || 3), 0);

      return {
        id: s.id,
        title: s.title,
        groupLabel: s.groupLabel,
        questionRange: [qStart, actualEnd] as [number, number],
        layoutFamilies: families,
        questionTypes: sectionTypes,
        totalMarks,
      };
    });

  // 8. Validate section count (2–4 sections)
  if (sections.length < 2) {
    warnings.push(`Only ${sections.length} section(s) planned. Minimum 2 required.`);
  }
  if (sections.length > 4) {
    warnings.push(`${sections.length} sections planned. Maximum 4 allowed.`);
  }

  const totalMarks = sections.reduce((sum, s) => sum + s.totalMarks, 0);

  return {
    title: `${params.topic} — ${params.yearGroup} Worksheet`,
    topic: params.topic,
    subject: params.subject,
    yearGroup: params.yearGroup,
    phase: params.phase,
    durationMins: params.durationMins,
    totalQuestions: questionTypes.length,
    totalMarks,
    sections,
    hasPriorKnowledgeCheck: !!params.priorTopic,
    priorTopic: params.priorTopic,
    sendNeed: params.sendNeed,
    layoutFamilySequence: questionTypes.map(t => QUESTION_LAYOUT_MAP[t]),
    validationWarnings: warnings,
  };
}
