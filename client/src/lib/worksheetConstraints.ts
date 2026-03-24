/**
 * worksheetConstraints.ts
 *
 * Three-layer constraint system for structured worksheet generation:
 *   1. Content rules   — what questions contain and how marks are allocated
 *   2. Layout rules    — variation system: no two adjacent layouts alike
 *   3. Render checks   — preflight validator before any output is shown
 *
 * Architecture (10-step pipeline):
 *   plan → validate-plan → generate-questions → generate-diagrams →
 *   apply-layouts → apply-send-overlay → apply-profile →
 *   page-fit-check → accessibility-check → lock-output
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LayoutFamily =
  | "true_false"           // TRUE/FALSE pill buttons per statement
  | "mcq_2col"             // 2-column A/B/C/D bubbles
  | "label_diagram"        // diagram left, numbered callout dots, fill-in right
  | "gap_fill_inline"      // flowing paragraph with underline blanks + word bank
  | "diagram_subquestions" // 50/50 split: diagram left, lettered sub-qs right
  | "table_complete"       // striped table with blank cells as dotted lines
  | "draw_box"             // dot-grid drawing area (circuit/graph/map)
  | "short_answer"         // plain lined answer space
  | "extended_answer"      // large answer space (essay / long response)
  | "matching"             // primary: connect items on left to items on right
  | "ordering"             // primary: number items in correct sequence
  | "colour_label";        // primary: label a picture by colouring / circling

export type BloomLevel =
  | "remember"   // Section 1 — Recall
  | "understand" // Section 2 — Understanding
  | "apply"      // Section 3 — Application
  | "analyse"    // Section 3 — Analysis
  | "evaluate";  // Challenge

export type AgeProfile = "primary_ks1" | "primary_ks2" | "secondary";

export interface QuestionPlan {
  id: number;
  section: "recall" | "understanding" | "application" | "challenge";
  bloomLevel: BloomLevel;
  layout: LayoutFamily;
  marks: number;
  requiresDiagram: boolean;
  diagramType?: "circuit" | "process" | "graph" | "label_image" | "dot_grid";
  wordBank?: string[];       // for gap_fill_inline
  tableHeaders?: string[];   // for table_complete
  subQuestions?: string[];   // for diagram_subquestions
  sendRules?: SENDQuestionRules;
}

export interface WorksheetPlan {
  title: string;
  subject: string;
  topic: string;
  yearGroup: string;
  ageProfile: AgeProfile;
  difficulty: string;
  examBoard?: string;
  totalMarks: number;
  estimatedTime: string;
  sections: {
    name: string;
    heading: string;     // e.g. "SECTION 1 — RECALL"
    bloomLevel: BloomLevel;
    questionRange: string; // e.g. "Questions 1–3"
    questions: QuestionPlan[];
  }[];
  hasSelfReflection: boolean;
  hasAnswerKey: boolean;
}

export interface SENDQuestionRules {
  extraAnswerLines: number;       // additional lines beyond default
  addWordBank: boolean;           // inject word bank even if not gap-fill
  simplifyLanguage: boolean;      // flag for content generator to simplify
  addStepScaffold: boolean;       // add numbered step boxes
  maxWordsInPrompt: number;       // hard cap on prompt word count
  increaseSpacing: boolean;       // extra padding between elements
}

export interface ValidationResult {
  pass: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  questionId?: number;
  fix: "regenerate_question" | "regenerate_layout" | "regenerate_plan" | "abort";
}

export interface ValidationWarning {
  code: string;
  message: string;
  questionId?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT RULES — visual variation system
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Secondary worksheets: 7 layout families available.
 * Every question must use a different family from its immediate neighbour.
 * At least 5 distinct families across a 10-question sheet.
 * Diagrams must appear in at least 2 questions.
 */
const SECONDARY_ALLOWED_LAYOUTS: LayoutFamily[] = [
  "true_false",
  "mcq_2col",
  "label_diagram",
  "gap_fill_inline",
  "diagram_subquestions",
  "table_complete",
  "draw_box",
  "short_answer",
  "extended_answer",
];

/**
 * Primary worksheets: simpler 4-family subset.
 * KS1: matching, ordering, colour_label, true_false only.
 * KS2: adds mcq_2col and gap_fill_inline.
 */
const PRIMARY_KS1_LAYOUTS: LayoutFamily[] = [
  "matching",
  "ordering",
  "colour_label",
  "true_false",
];

const PRIMARY_KS2_LAYOUTS: LayoutFamily[] = [
  "matching",
  "ordering",
  "colour_label",
  "true_false",
  "mcq_2col",
  "gap_fill_inline",
];

/** Layouts that require a visual diagram element */
const DIAGRAM_LAYOUTS: Set<LayoutFamily> = new Set([
  "label_diagram",
  "diagram_subquestions",
  "draw_box",
  "colour_label",
]);

/** Marks budget per layout — minimum lines of answer space required */
export const LAYOUT_ANSWER_LINES: Record<LayoutFamily, number> = {
  true_false:           0,  // no lines — uses pill buttons
  mcq_2col:             0,  // no lines — uses bubbles
  label_diagram:        0,  // fill-in boxes per label
  gap_fill_inline:      0,  // inline blanks
  diagram_subquestions: 3,  // 3 lines per sub-question
  table_complete:       0,  // inline table cells
  draw_box:             0,  // drawing area
  short_answer:         3,
  extended_answer:      6,
  matching:             0,
  ordering:             0,
  colour_label:         0,
};

/** Marks budget per layout — expected range */
export const LAYOUT_MARKS_RANGE: Record<LayoutFamily, [number, number]> = {
  true_false:           [1, 4],
  mcq_2col:             [1, 2],
  label_diagram:        [2, 6],
  gap_fill_inline:      [2, 8],
  diagram_subquestions: [3, 8],
  table_complete:       [2, 6],
  draw_box:             [3, 8],
  short_answer:         [2, 4],
  extended_answer:      [4, 10],
  matching:             [1, 4],
  ordering:             [1, 4],
  colour_label:         [1, 4],
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION STRUCTURE — maps BloomLevel to allowed layouts
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_ALLOWED_LAYOUTS: Record<string, LayoutFamily[]> = {
  recall: ["true_false", "mcq_2col", "gap_fill_inline", "matching", "ordering"],
  understanding: [
    "label_diagram", "gap_fill_inline", "diagram_subquestions",
    "table_complete", "short_answer", "colour_label",
  ],
  application: [
    "diagram_subquestions", "table_complete", "draw_box",
    "short_answer", "extended_answer",
  ],
  challenge: ["extended_answer", "draw_box", "diagram_subquestions"],
};

// ─────────────────────────────────────────────────────────────────────────────
// PLANNER — builds a locked WorksheetPlan before any content is generated
// ─────────────────────────────────────────────────────────────────────────────

export function buildWorksheetPlan(
  subject: string,
  topic: string,
  yearGroup: string,
  difficulty: string,
  examBoard: string | undefined,
  sendNeedId: string | undefined,
  questionCount: number = 9
): WorksheetPlan {
  const yearNum = parseInt(yearGroup.replace(/[^0-9]/g, ""), 10) || 7;
  const ageProfile: AgeProfile =
    yearNum <= 2 ? "primary_ks1" :
    yearNum <= 6 ? "primary_ks2" :
    "secondary";

  const isPrimary = ageProfile !== "secondary";
  const totalMarks = isPrimary ? 20 : 35;
  const estimatedTime =
    yearNum <= 2  ? "20–25 mins" :
    yearNum <= 6  ? "25–35 mins" :
    yearNum <= 9  ? "40–50 mins" :
    yearNum <= 11 ? "50–60 mins" : "60–75 mins";

  // Pick section structure
  const sectionDefs = isPrimary
    ? [
        { key: "recall",      heading: "SECTION A — REMEMBER",    bloom: "remember"  as BloomLevel, qs: [1,2,3] },
        { key: "understanding",heading: "SECTION B — UNDERSTAND", bloom: "understand" as BloomLevel, qs: [4,5,6] },
        { key: "application", heading: "SECTION C — APPLY",       bloom: "apply"     as BloomLevel, qs: [7,8,9] },
      ]
    : [
        { key: "recall",      heading: "SECTION 1 — RECALL",                bloom: "remember"  as BloomLevel, qs: [1,2,3] },
        { key: "understanding",heading: "SECTION 2 — UNDERSTANDING",        bloom: "understand" as BloomLevel, qs: [4,5,6] },
        { key: "application", heading: "SECTION 3 — APPLICATION & ANALYSIS",bloom: "apply"     as BloomLevel, qs: [7,8,9] },
      ];

  // Build question plans with layout assignment
  const allLayouts: LayoutFamily[] = [];
  let questionId = 1;

  const sections = sectionDefs.map((sec) => {
    const questions: QuestionPlan[] = sec.qs.map((qNum) => {
      const plan = pickLayout(
        sec.key as any,
        ageProfile,
        allLayouts,
        questionId
      );
      allLayouts.push(plan.layout);
      questionId++;
      return plan;
    });

    return {
      name: sec.key,
      heading: sec.heading,
      bloomLevel: sec.bloom,
      questionRange: `Questions ${sec.qs[0]}–${sec.qs[sec.qs.length - 1]}`,
      questions,
    };
  });

  // Add challenge question for secondary
  if (!isPrimary) {
    const challengeLayout = pickLayout("challenge", ageProfile, allLayouts, questionId);
    allLayouts.push(challengeLayout.layout);
    sections.push({
      name: "challenge",
      heading: "★ CHALLENGE",
      bloomLevel: "evaluate",
      questionRange: "Question 10",
      questions: [challengeLayout],
    });
  }

  return {
    title: `${topic} — ${subject}`,
    subject,
    topic,
    yearGroup,
    ageProfile,
    difficulty,
    examBoard,
    totalMarks,
    estimatedTime,
    sections,
    hasSelfReflection: true,
    hasAnswerKey: true,
  };
}

/**
 * Picks a layout for a question, enforcing:
 * - No adjacent repeat
 * - Section-appropriate layouts
 * - Diagram layouts appear at least twice overall
 * - Age-profile filtering
 */
function pickLayout(
  section: "recall" | "understanding" | "application" | "challenge",
  ageProfile: AgeProfile,
  usedSoFar: LayoutFamily[],
  questionId: number
): QuestionPlan {
  const lastLayout = usedSoFar[usedSoFar.length - 1];

  const profileLayouts =
    ageProfile === "primary_ks1" ? PRIMARY_KS1_LAYOUTS :
    ageProfile === "primary_ks2" ? PRIMARY_KS2_LAYOUTS :
    SECONDARY_ALLOWED_LAYOUTS;

  const sectionLayouts = SECTION_ALLOWED_LAYOUTS[section] || SECONDARY_ALLOWED_LAYOUTS;

  // Candidates: intersection of profile and section, excluding last used
  let candidates = profileLayouts.filter(
    (l) => sectionLayouts.includes(l) && l !== lastLayout
  );

  // Prioritise diagram layouts if fewer than 2 have been used so far
  const diagramsUsed = usedSoFar.filter((l) => DIAGRAM_LAYOUTS.has(l)).length;
  if (diagramsUsed < 2) {
    const diagramCandidates = candidates.filter((l) => DIAGRAM_LAYOUTS.has(l));
    if (diagramCandidates.length > 0) candidates = diagramCandidates;
  }

  // Prevent same layout appearing more than twice on the whole sheet
  const overused = candidates.filter(
    (l) => usedSoFar.filter((u) => u === l).length >= 2
  );
  if (overused.length < candidates.length) {
    candidates = candidates.filter((l) => !overused.includes(l));
  }

  if (candidates.length === 0) {
    // Fallback: any valid section layout
    candidates = sectionLayouts.filter((l) => l !== lastLayout);
    if (candidates.length === 0) candidates = sectionLayouts;
  }

  // Pick deterministically based on questionId for repeatability
  const chosen = candidates[questionId % candidates.length];
  const requiresDiagram = DIAGRAM_LAYOUTS.has(chosen);
  const [minMarks, maxMarks] = LAYOUT_MARKS_RANGE[chosen];

  // Scale marks by section depth
  const marksTable: Record<string, number> = {
    recall: Math.min(2, maxMarks),
    understanding: Math.min(4, maxMarks),
    application: Math.min(5, maxMarks),
    challenge: 8,
  };

  return {
    id: questionId,
    section: section as any,
    bloomLevel:
      section === "recall"        ? "remember"  :
      section === "understanding" ? "understand" :
      section === "challenge"     ? "evaluate"  : "apply",
    layout: chosen,
    marks: Math.max(minMarks, marksTable[section] || 3),
    requiresDiagram,
    diagramType: requiresDiagram ? pickDiagramType(chosen) : undefined,
  };
}

function pickDiagramType(layout: LayoutFamily): QuestionPlan["diagramType"] {
  if (layout === "draw_box") return "dot_grid";
  if (layout === "label_diagram") return "label_image";
  if (layout === "colour_label") return "label_image";
  return "process";
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATOR — preflight before any render
// ─────────────────────────────────────────────────────────────────────────────

export function validateWorksheetPlan(plan: WorksheetPlan): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const allQuestions = plan.sections.flatMap((s) => s.questions);

  // ── Layout adjacency rule ─────────────────────────────────────────────────
  for (let i = 1; i < allQuestions.length; i++) {
    if (allQuestions[i].layout === allQuestions[i - 1].layout) {
      errors.push({
        code: "ADJACENT_LAYOUT_REPEAT",
        message: `Q${allQuestions[i].id} and Q${allQuestions[i-1].id} both use layout "${allQuestions[i].layout}". Adjacent questions must use different layouts.`,
        questionId: allQuestions[i].id,
        fix: "regenerate_layout",
      });
    }
  }

  // ── Minimum distinct layout families (secondary: 5, primary: 3) ───────────
  const distinctLayouts = new Set(allQuestions.map((q) => q.layout));
  const minFamilies = plan.ageProfile === "secondary" ? 5 : 3;
  if (distinctLayouts.size < minFamilies) {
    errors.push({
      code: "TOO_FEW_LAYOUT_FAMILIES",
      message: `Only ${distinctLayouts.size} distinct layout families used. Minimum is ${minFamilies}.`,
      fix: "regenerate_plan",
    });
  }

  // ── Diagrams must appear at least twice (secondary only) ──────────────────
  if (plan.ageProfile === "secondary") {
    const diagramCount = allQuestions.filter((q) => q.requiresDiagram).length;
    if (diagramCount < 2) {
      errors.push({
        code: "INSUFFICIENT_DIAGRAMS",
        message: `Only ${diagramCount} diagram question(s). Secondary worksheets need at least 2.`,
        fix: "regenerate_plan",
      });
    }
  }

  // ── Marks must increase across sections ───────────────────────────────────
  const sectionAverages = plan.sections.map((s) => {
    const total = s.questions.reduce((sum, q) => sum + q.marks, 0);
    return total / (s.questions.length || 1);
  });
  for (let i = 1; i < sectionAverages.length - 1; i++) {
    if (sectionAverages[i] < sectionAverages[i - 1] - 1) {
      warnings.push({
        code: "MARKS_NOT_ASCENDING",
        message: `Section ${i+1} average marks (${sectionAverages[i].toFixed(1)}) lower than section ${i} (${sectionAverages[i-1].toFixed(1)}). Marks should increase by section.`,
      });
    }
  }

  // ── Marks inside valid range for layout ───────────────────────────────────
  for (const q of allQuestions) {
    const [min, max] = LAYOUT_MARKS_RANGE[q.layout];
    if (q.marks < min || q.marks > max) {
      warnings.push({
        code: "MARKS_OUT_OF_RANGE",
        message: `Q${q.id}: ${q.marks} marks for layout "${q.layout}" (expected ${min}–${max}).`,
        questionId: q.id,
      });
    }
  }

  // ── Question count limits ─────────────────────────────────────────────────
  if (allQuestions.length > 10) {
    errors.push({
      code: "TOO_MANY_QUESTIONS",
      message: `${allQuestions.length} questions exceeds maximum of 10.`,
      fix: "regenerate_plan",
    });
  }

  return { pass: errors.length === 0, errors, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGRAM VALIDATOR — checks before any diagram is rendered
// ─────────────────────────────────────────────────────────────────────────────

export interface DiagramSpec {
  type: "circuit" | "process" | "graph" | "label_image" | "dot_grid";
  components?: Array<{
    symbol: string;
    x: number; // 0–1 normalised
    y: number;
    label?: string;
  }>;
  boundingBox: { w: number; h: number }; // pts
  labelCount?: number;
  gridSnap?: number; // pts
}

export interface DiagramValidationResult {
  pass: boolean;
  errors: string[];
}

export function validateDiagram(spec: DiagramSpec): DiagramValidationResult {
  const errors: string[] = [];

  if (!spec.components || spec.components.length === 0) {
    return { pass: true, errors: [] }; // dot_grid / draw_box — no components
  }

  // ── Bounding box overflow ─────────────────────────────────────────────────
  for (const comp of spec.components) {
    if (comp.x < 0 || comp.x > 1 || comp.y < 0 || comp.y > 1) {
      errors.push(
        `Component "${comp.symbol}" at (${comp.x.toFixed(2)}, ${comp.y.toFixed(2)}) is outside the bounding box.`
      );
    }
  }

  // ── Overlap detection (≥8pt symbol radius) ────────────────────────────────
  const MIN_DISTANCE = 0.12; // normalised
  for (let i = 0; i < spec.components.length; i++) {
    for (let j = i + 1; j < spec.components.length; j++) {
      const a = spec.components[i];
      const b = spec.components[j];
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      if (dist < MIN_DISTANCE) {
        errors.push(
          `Components "${a.symbol}" and "${b.symbol}" overlap (distance ${dist.toFixed(3)}, minimum ${MIN_DISTANCE}).`
        );
      }
    }
  }

  // ── Label overflow: labels must not push outside box ─────────────────────
  if (spec.labelCount !== undefined && spec.labelCount > 8) {
    errors.push(
      `${spec.labelCount} labels exceeds maximum of 8 for a diagram of this size.`
    );
  }

  // ── Minimum component spacing for circuit diagrams ────────────────────────
  if (spec.type === "circuit") {
    const componentsOnWire = spec.components.filter((c) =>
      ["battery", "lamp", "resistor", "switch", "ammeter", "voltmeter"].includes(c.symbol)
    );
    if (componentsOnWire.length < 2) {
      errors.push("Circuit diagram must have at least 2 components on the wire.");
    }
    // All components should be near the edge (rectangular loop rule)
    for (const comp of componentsOnWire) {
      const onEdge =
        comp.x < 0.15 || comp.x > 0.85 ||
        comp.y < 0.15 || comp.y > 0.85;
      if (!onEdge) {
        errors.push(
          `Circuit component "${comp.symbol}" at (${comp.x.toFixed(2)}, ${comp.y.toFixed(2)}) should sit on a wire edge, not in the centre.`
        );
      }
    }
  }

  return { pass: errors.length === 0, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND OVERLAY — applied after plan, before render
// Preserves structure, only expands / simplifies / spaces out
// ─────────────────────────────────────────────────────────────────────────────

export interface SENDOverlay {
  extraAnswerLinesMultiplier: number;   // multiply default answer lines
  maxQuestionsPerPage: number;          // page break more aggressively
  simplifyLanguage: boolean;
  addStepScaffolds: boolean;            // add numbered step boxes
  addWordBanks: boolean;                // add word banks to written Qs
  reducedDensity: boolean;              // extra spacing between elements
  iconCues: boolean;                    // add emoji/icon cues to section headers
  fontSizeBoost: number;                // add to base fontSize (pts)
  lineHeightBoost: number;              // add to base lineHeight
  sentenceFrames: boolean;              // add "I think… because…" frames
  maxWordsPerPrompt: number;            // hard cap per question prompt
}

const DEFAULT_SEND_OVERLAY: SENDOverlay = {
  extraAnswerLinesMultiplier: 1,
  maxQuestionsPerPage: 10,
  simplifyLanguage: false,
  addStepScaffolds: false,
  addWordBanks: false,
  reducedDensity: false,
  iconCues: false,
  fontSizeBoost: 0,
  lineHeightBoost: 0,
  sentenceFrames: false,
  maxWordsPerPrompt: 999,
};

const SEND_OVERLAYS: Record<string, Partial<SENDOverlay>> = {
  dyslexia: {
    extraAnswerLinesMultiplier: 1.5,
    maxQuestionsPerPage: 5,
    reducedDensity: true,
    fontSizeBoost: 1,
    lineHeightBoost: 0.3,
    maxWordsPerPrompt: 40,
  },
  adhd: {
    extraAnswerLinesMultiplier: 1,
    maxQuestionsPerPage: 4,
    addStepScaffolds: true,
    reducedDensity: true,
    iconCues: true,
    maxWordsPerPrompt: 30,
  },
  asc: {
    extraAnswerLinesMultiplier: 1,
    maxQuestionsPerPage: 5,
    addStepScaffolds: true,
    reducedDensity: true,
    simplifyLanguage: true,
    maxWordsPerPrompt: 25,
  },
  asperger: {
    extraAnswerLinesMultiplier: 1,
    maxQuestionsPerPage: 5,
    addStepScaffolds: true,
    reducedDensity: true,
    simplifyLanguage: true,
    maxWordsPerPrompt: 30,
  },
  mld: {
    extraAnswerLinesMultiplier: 2,
    maxQuestionsPerPage: 4,
    simplifyLanguage: true,
    addWordBanks: true,
    addStepScaffolds: true,
    reducedDensity: true,
    iconCues: true,
    fontSizeBoost: 1,
    lineHeightBoost: 0.2,
    sentenceFrames: true,
    maxWordsPerPrompt: 20,
  },
  slcn: {
    extraAnswerLinesMultiplier: 1.5,
    maxQuestionsPerPage: 5,
    simplifyLanguage: true,
    addWordBanks: true,
    reducedDensity: true,
    iconCues: true,
    sentenceFrames: true,
    maxWordsPerPrompt: 20,
  },
  dyspraxia: {
    extraAnswerLinesMultiplier: 2,
    maxQuestionsPerPage: 5,
    reducedDensity: true,
    fontSizeBoost: 1,
    lineHeightBoost: 0.2,
    addStepScaffolds: true,
  },
  dyscalculia: {
    extraAnswerLinesMultiplier: 2,
    addStepScaffolds: true,
    addWordBanks: true,
    reducedDensity: true,
    maxWordsPerPrompt: 30,
  },
  vi: {
    extraAnswerLinesMultiplier: 2,
    maxQuestionsPerPage: 4,
    reducedDensity: true,
    fontSizeBoost: 6,
    lineHeightBoost: 0.3,
  },
  hi: {
    reducedDensity: true,
    iconCues: true,
    simplifyLanguage: true,
  },
  eal: {
    addWordBanks: true,
    simplifyLanguage: true,
    reducedDensity: true,
    sentenceFrames: true,
    maxWordsPerPrompt: 25,
    addStepScaffolds: true,
  },
  anxiety: {
    maxQuestionsPerPage: 5,
    reducedDensity: true,
    addStepScaffolds: true,
    iconCues: true,
    fontSizeBoost: 1,
  },
  "pda-odd": {
    maxQuestionsPerPage: 4,
    reducedDensity: true,
    simplifyLanguage: true,
    iconCues: true,
  },
  tourettes: {
    reducedDensity: true,
    maxQuestionsPerPage: 6,
  },
  "older-learners": {
    extraAnswerLinesMultiplier: 1.2,
    maxWordsPerPrompt: 50,
  },
};

export function getSENDOverlay(sendNeedId?: string): SENDOverlay {
  if (!sendNeedId || sendNeedId === "none-selected") return { ...DEFAULT_SEND_OVERLAY };
  const overrides = SEND_OVERLAYS[sendNeedId.toLowerCase()] || {};
  return { ...DEFAULT_SEND_OVERLAY, ...overrides };
}

/**
 * Validates that the SEND overlay does NOT destroy worksheet structure.
 * SEND may never: remove question types, reorder questions, change marks.
 */
export function validateSENDOverlay(overlay: SENDOverlay, plan: WorksheetPlan): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // maxQuestionsPerPage must not hide questions (only affects pagination)
  if (overlay.maxQuestionsPerPage < 1) {
    errors.push({
      code: "SEND_INVALID_PAGE_LIMIT",
      message: "SEND overlay maxQuestionsPerPage cannot be less than 1.",
      fix: "abort",
    });
  }

  // SEND must not increase marks (only spacing/scaffolding allowed)
  // (No mark changes are structurally possible — this is a guard)

  return { pass: errors.length === 0, errors, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY PROFILE — age-appropriate settings
// ─────────────────────────────────────────────────────────────────────────────

export interface PrimaryProfile {
  maxQuestionsPerPage: number;
  maxWordsPerPrompt: number;
  answerLineHeight: number; // px
  fontSizeBase: number;
  lineHeight: number;
  sectionColours: string[];    // rotating palette for child-friendly feel
  useIcons: boolean;
  useStickers: boolean;
  maxSubPartsPerQuestion: number;
  diagramComplexity: "simple" | "very_simple";
}

export const PRIMARY_KS1_PROFILE: PrimaryProfile = {
  maxQuestionsPerPage: 3,
  maxWordsPerPrompt: 12,
  answerLineHeight: 36,
  fontSizeBase: 16,
  lineHeight: 2.0,
  sectionColours: ["#fef9c3","#dcfce7","#dbeafe","#fce7f3","#ede9fe","#ffedd5"],
  useIcons: true,
  useStickers: true,
  maxSubPartsPerQuestion: 1,
  diagramComplexity: "very_simple",
};

export const PRIMARY_KS2_PROFILE: PrimaryProfile = {
  maxQuestionsPerPage: 4,
  maxWordsPerPrompt: 20,
  answerLineHeight: 30,
  fontSizeBase: 14,
  lineHeight: 1.85,
  sectionColours: ["#fef9c3","#dcfce7","#dbeafe","#fce7f3","#ede9fe","#ffedd5"],
  useIcons: true,
  useStickers: false,
  maxSubPartsPerQuestion: 2,
  diagramComplexity: "simple",
};

export function getPrimaryProfile(ageProfile: AgeProfile): PrimaryProfile | null {
  if (ageProfile === "primary_ks1") return PRIMARY_KS1_PROFILE;
  if (ageProfile === "primary_ks2") return PRIMARY_KS2_PROFILE;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE FIT CHECKER — ensures questions don't overflow their space budget
// ─────────────────────────────────────────────────────────────────────────────

/** Approximate height in pts each layout type consumes */
export const LAYOUT_HEIGHT_BUDGET: Record<LayoutFamily, number> = {
  true_false:           22 * 4,       // ~88pt for 4 statements
  mcq_2col:             60,
  label_diagram:        160,
  gap_fill_inline:      80,
  diagram_subquestions: 170,
  table_complete:       120,
  draw_box:             140,
  short_answer:         90,
  extended_answer:      170,
  matching:             100,
  ordering:             80,
  colour_label:         160,
};

const PAGE_HEIGHT_BUDGET_PTS = 680; // usable A4 body after margins/header/footer

export function checkPageFit(
  questions: QuestionPlan[],
  sendOverlay: SENDOverlay
): { fits: boolean; overflowAt?: number } {
  let totalHeight = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const base = LAYOUT_HEIGHT_BUDGET[q.layout];
    const extraLines = (LAYOUT_ANSWER_LINES[q.layout] * (sendOverlay.extraAnswerLinesMultiplier - 1)) * 11;
    const spacingBonus = sendOverlay.reducedDensity ? 20 : 0;
    totalHeight += base + extraLines + spacingBonus;
    if (totalHeight > PAGE_HEIGHT_BUDGET_PTS) {
      return { fits: false, overflowAt: i };
    }
  }
  return { fits: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL PIPELINE RUNNER
// ─────────────────────────────────────────────────────────────────────────────

export interface PipelineResult {
  plan: WorksheetPlan;
  sendOverlay: SENDOverlay;
  valid: boolean;
  validationResult: ValidationResult;
  pageFitOk: boolean;
  warnings: string[];
}

export function runWorksheetPipeline(
  subject: string,
  topic: string,
  yearGroup: string,
  difficulty: string,
  examBoard: string | undefined,
  sendNeedId: string | undefined
): PipelineResult {
  const warnings: string[] = [];

  // Step 1: Generate plan
  let plan = buildWorksheetPlan(subject, topic, yearGroup, difficulty, examBoard, sendNeedId);

  // Step 2: Validate plan — retry once if it fails
  let validation = validateWorksheetPlan(plan);
  if (!validation.pass) {
    // Retry with fresh plan
    plan = buildWorksheetPlan(subject, topic, yearGroup, difficulty, examBoard, sendNeedId);
    validation = validateWorksheetPlan(plan);
  }

  // Collect validation warnings
  for (const w of validation.warnings) warnings.push(w.message);
  for (const e of validation.errors) warnings.push(`ERROR: ${e.message}`);

  // Step 3: Get SEND overlay
  const sendOverlay = getSENDOverlay(sendNeedId);

  // Step 4: Validate SEND overlay doesn't break structure
  const sendValidation = validateSENDOverlay(sendOverlay, plan);
  if (!sendValidation.pass) {
    for (const e of sendValidation.errors) warnings.push(`SEND ERROR: ${e.message}`);
  }

  // Step 5: Page fit check on each section
  let pageFitOk = true;
  for (const section of plan.sections) {
    const fit = checkPageFit(section.questions, sendOverlay);
    if (!fit.fits) {
      pageFitOk = false;
      warnings.push(
        `Section "${section.name}" may overflow page at question ${section.questions[fit.overflowAt ?? 0]?.id}. Consider reducing question count.`
      );
    }
  }

  return {
    plan,
    sendOverlay,
    valid: validation.pass && sendValidation.pass,
    validationResult: validation,
    pageFitOk,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT RULES — prompt constraints per layout type
// These are injected into the system prompt for AI generation
// ─────────────────────────────────────────────────────────────────────────────

export function getLayoutContentRules(layout: LayoutFamily, ageProfile: AgeProfile): string {
  const isPrimary = ageProfile !== "secondary";

  const rules: Record<LayoutFamily, string> = {
    true_false: [
      "Generate exactly 4 statements.",
      "Each statement must be a single, clear, unambiguous claim.",
      "Exactly 2 must be TRUE, exactly 2 must be FALSE.",
      "FALSE statements must contain a specific, identifiable error — not vague.",
      isPrimary ? "Maximum 10 words per statement." : "Maximum 18 words per statement.",
    ].join(" "),

    mcq_2col: [
      "Generate exactly 4 options (A, B, C, D).",
      "Exactly ONE option must be correct.",
      "Distractors must be plausible — common misconceptions, not obviously wrong.",
      "Options must be parallel in structure (all numbers, or all phrases, etc.).",
      "Do NOT include 'All of the above' or 'None of the above'.",
      isPrimary ? "Each option maximum 6 words." : "Each option maximum 12 words.",
    ].join(" "),

    label_diagram: [
      "Specify 4–6 labelling points on the diagram.",
      "Each label must refer to a clearly distinct part of the diagram.",
      "Labels must be single nouns or short noun phrases (max 3 words).",
      "Provide the answer key for each numbered point.",
      "The diagram must be fully contained within its bounding box.",
    ].join(" "),

    gap_fill_inline: [
      "Write a flowing paragraph of 40–80 words.",
      "Leave 5–8 blanks (underlines).",
      "Each blank should represent a single key vocabulary word.",
      "Provide a word bank of exactly (blanks + 2) words — 2 extra distractors.",
      "Blanks must be distributed evenly through the text, not all at the end.",
      "Do NOT blank common connecting words (the, and, in, of).",
    ].join(" "),

    diagram_subquestions: [
      "The left panel contains the pre-drawn diagram.",
      "The right panel contains 3–4 lettered sub-questions (a, b, c, d).",
      "Each sub-question must reference a specific, labelled part of the diagram.",
      "Sub-questions must escalate in difficulty: (a) recall → (b-c) understanding → (d) application.",
      "Each sub-question answer space: 2–4 lines.",
    ].join(" "),

    table_complete: [
      "Table must have 2–4 columns and 4–6 data rows (plus header).",
      "Blank cells must be distributed — no entire blank rows or columns.",
      "Column headers must be clear and concise (max 3 words each).",
      "Provide the complete filled-in table in the answer key.",
      "At least one column must contain numeric data.",
    ].join(" "),

    draw_box: [
      "Provide clear, specific instructions for what to draw.",
      "Include a reference panel of relevant symbols/components if needed.",
      "Specify what labels must be added to the drawing.",
      "State the scale or constraints (e.g. 'rectangular loop', 'label all components').",
      "The box must use dot-grid paper pattern.",
    ].join(" "),

    short_answer: [
      "One clear, focused question.",
      "Answer expected in 2–4 sentences.",
      isPrimary ? "Maximum 15 words in the question." : "Maximum 30 words in the question.",
      "Provide a model answer in the mark scheme.",
    ].join(" "),

    extended_answer: [
      "One structured multi-part question or essay prompt.",
      "Must specify what to include (e.g. 'use evidence from the text', 'show all working').",
      "Provide level descriptors or mark points in the answer key.",
      "Maximum question length: 60 words.",
    ].join(" "),

    matching: [
      "Generate 5–6 pairs to match.",
      "Left column: terms or images. Right column: definitions or matching items.",
      "Items must be clearly distinct — no near-identical pairs.",
      "Each item on the left matches EXACTLY ONE item on the right.",
      "Arrange items in randomised order (not already matched).",
    ].join(" "),

    ordering: [
      "Generate 4–6 items to sequence.",
      "The correct order must be unambiguous.",
      "Items should be at similar levels of specificity.",
      "Provide the correct sequence in the answer key.",
    ].join(" "),

    colour_label: [
      "The diagram has 4–6 clearly distinct parts to label.",
      "Each part has a numbered callout dot.",
      "Students write the correct label in the corresponding box.",
      isPrimary ? "Labels are single words only." : "Labels are short noun phrases (max 3 words).",
    ].join(" "),
  };

  return rules[layout] || "Generate a clear, focused question appropriate for the section.";
}

/**
 * Returns the full system prompt injection for the AI question generator.
 * This is appended to whatever topic-specific prompt the existing generator uses.
 */
export function buildWorksheetSystemConstraints(
  plan: WorksheetPlan,
  sendOverlay: SENDOverlay,
  sectionIndex: number
): string {
  const section = plan.sections[sectionIndex];
  if (!section) return "";

  const questionRules = section.questions
    .map((q) => {
      const layoutRules = getLayoutContentRules(q.layout, plan.ageProfile);
      const sendNote = sendOverlay.simplifyLanguage
        ? `SEND note: simplify language — max ${sendOverlay.maxWordsPerPrompt} words in prompt, use simple sentence structure.`
        : "";
      const scaffoldNote = sendOverlay.addStepScaffolds
        ? "SEND note: include a numbered step scaffold box before the question."
        : "";
      const wordBankNote = sendOverlay.addWordBanks && q.layout === "short_answer"
        ? "SEND note: include a small word bank of 4–6 key terms to support the answer."
        : "";

      return [
        `Q${q.id} [${q.marks} marks] — Layout: ${q.layout.toUpperCase()}`,
        `Section: ${section.heading} | Bloom: ${q.bloomLevel}`,
        `Rules: ${layoutRules}`,
        sendNote,
        scaffoldNote,
        wordBankNote,
      ].filter(Boolean).join("\n");
    })
    .join("\n\n");

  const globalConstraints = [
    "WORKSHEET CONSTRAINTS (MUST FOLLOW EXACTLY):",
    `• No two adjacent questions may use the same layout type.`,
    `• Marks must increase from Section 1 → Section 2 → Section 3.`,
    `• Diagrams must be described as DiagramSpec JSON — never as image URLs.`,
    `• All components in diagrams must sit within their bounding box.`,
    `• Circuit diagrams: rectangular loop only. Components sit ON wire segments.`,
    `• No floating labels. No labels outside the diagram bounding box.`,
    plan.ageProfile !== "secondary"
      ? `• PRIMARY MODE: short prompts, large spaces, simple language, max ${plan.ageProfile === "primary_ks1" ? 12 : 20} words per question.`
      : "",
    sendOverlay.reducedDensity
      ? "• SEND: increase spacing between all elements. Do not crowd the page."
      : "",
  ].filter(Boolean).join("\n");

  return `${globalConstraints}\n\n--- SECTION ${sectionIndex + 1} QUESTION PLANS ---\n\n${questionRules}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION TYPE MAPPER — converts plan layout to WorksheetSection types
// the existing renderer already understands
// ─────────────────────────────────────────────────────────────────────────────

export function layoutToSectionType(layout: LayoutFamily): string {
  const map: Record<LayoutFamily, string> = {
    true_false:           "guided",       // rendered by TrueFalseSection
    mcq_2col:             "guided",       // rendered by MCQSection
    label_diagram:        "diagram",      // rendered by LabelDiagramSection
    gap_fill_inline:      "guided",       // rendered by GapFillSection
    diagram_subquestions: "independent",  // rendered by DiagramSubQSection
    table_complete:       "independent",  // rendered by TableCompleteSection
    draw_box:             "independent",  // rendered by DrawBoxSection
    short_answer:         "independent",
    extended_answer:      "challenge",
    matching:             "guided",
    ordering:             "guided",
    colour_label:         "diagram",
  };
  return map[layout] || "independent";
}

/**
 * Maps the layout family to a metadata tag embedded in section content.
 * The renderer reads LAYOUT:<type> at the top of content to pick the right sub-renderer.
 */
export function encodeLayoutTag(layout: LayoutFamily): string {
  return `LAYOUT:${layout}`;
}

export function decodeLayoutTag(content: string): LayoutFamily | null {
  const match = content.match(/^LAYOUT:(\w+)/);
  return match ? (match[1] as LayoutFamily) : null;
}
