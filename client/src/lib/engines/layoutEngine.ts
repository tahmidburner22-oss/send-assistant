/**
 * layoutEngine.ts — Adaptly Layout Engine
 *
 * Stage 2 of the validation pipeline.
 * Assigns page templates, spacing rules, and whitespace budgets to each question.
 *
 * Rules enforced:
 * - No two adjacent questions share the same layout family
 * - No page repeats the same visual structure twice in a row
 * - Every question reserves its own whitespace budget
 * - Mark allocation must match visual complexity
 * - draw-box, graph-box, circuit-box are distinct templates (not text styles)
 */

import type { LayoutFamily, QuestionType, WorksheetPlan } from "./planner";

// ─── Page geometry constants (A4 at 96dpi screen equivalent) ──────────────────
export const PAGE = {
  widthPx: 794,       // A4 width at 96dpi
  heightPx: 1123,     // A4 height at 96dpi
  marginPx: 48,       // 12.7mm margins
  contentWidthPx: 698, // 794 - 2*48
  headerHeightPx: 80,
  footerHeightPx: 32,
  sectionDividerHeightPx: 36,
  questionBadgeSize: 28,
} as const;

// ─── Whitespace budget per mark weight ────────────────────────────────────────
// Each mark = approximately 32px of answer space (one ruled line)
const ANSWER_LINE_HEIGHT_PX = 32;
const MIN_ANSWER_LINES_PER_MARK = 1;

export function getAnswerHeightPx(marks: number): number {
  const lines = Math.max(marks * MIN_ANSWER_LINES_PER_MARK, 2);
  return lines * ANSWER_LINE_HEIGHT_PX;
}

// ─── Layout template definitions ──────────────────────────────────────────────
export interface LayoutTemplate {
  family: LayoutFamily;
  /** Minimum height in px this layout requires */
  minHeightPx: number;
  /** Whether this layout can contain an embedded diagram */
  supportsDiagram: boolean;
  /** Whether this layout uses a split (left content + right answer) */
  isSplitLayout: boolean;
  /** CSS class name for the renderer */
  cssClass: string;
  /** Human-readable description */
  description: string;
}

export const LAYOUT_TEMPLATES: Record<LayoutFamily, LayoutTemplate> = {
  "true-false": {
    family: "true-false",
    minHeightPx: 160,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-true-false",
    description: "True/False pill buttons in a vertical list",
  },
  "mcq-2col": {
    family: "mcq-2col",
    minHeightPx: 140,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-mcq-2col",
    description: "2×2 grid of circle-badge MCQ options",
  },
  "inline-gap-fill": {
    family: "inline-gap-fill",
    minHeightPx: 180,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-gap-fill",
    description: "Cloze paragraph with underline blanks + bordered word bank",
  },
  "short-answer": {
    family: "short-answer",
    minHeightPx: 120,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-short-answer",
    description: "Question text + ruled answer lines",
  },
  "extended-answer": {
    family: "extended-answer",
    minHeightPx: 200,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-extended-answer",
    description: "Extended question text + multiple ruled answer lines",
  },
  "label-diagram": {
    family: "label-diagram",
    minHeightPx: 280,
    supportsDiagram: true,
    isSplitLayout: true,
    cssClass: "layout-label-diagram",
    description: "Diagram on left, label lines on right",
  },
  "diagram-subquestions": {
    family: "diagram-subquestions",
    minHeightPx: 300,
    supportsDiagram: true,
    isSplitLayout: true,
    cssClass: "layout-diagram-subq",
    description: "Diagram on left, sub-questions + answer lines on right",
  },
  "data-table": {
    family: "data-table",
    minHeightPx: 200,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-data-table",
    description: "Bordered table with headers and fill-in cells",
  },
  "draw-box": {
    family: "draw-box",
    minHeightPx: 200,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-draw-box",
    description: "Blank bordered box for student drawing with instruction label",
  },
  "graph-box": {
    family: "graph-box",
    minHeightPx: 240,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-graph-box",
    description: "Pre-drawn axes with grid lines for student plotting",
  },
  "circuit-box": {
    family: "circuit-box",
    minHeightPx: 240,
    supportsDiagram: true,
    isSplitLayout: true,
    cssClass: "layout-circuit-box",
    description: "Circuit diagram using approved vector symbols with sub-questions",
  },
  "ordering": {
    family: "ordering",
    minHeightPx: 160,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-ordering",
    description: "Numbered boxes for student to arrange items in order",
  },
  "matching": {
    family: "matching",
    minHeightPx: 160,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-matching",
    description: "Two columns connected by student-drawn lines",
  },
  // ── Advanced question type layouts ──────────────────────────────────────────
  "error-correction": {
    family: "error-correction",
    minHeightPx: 280,
    supportsDiagram: false,
    isSplitLayout: true,
    cssClass: "layout-error-correction",
    description: "Boxed worked solution on left, structured correction questions on right",
  },
  "ranking": {
    family: "ranking",
    minHeightPx: 200,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-ranking",
    description: "Item list with numbered ranking boxes (1 = highest) and explanation space",
  },
  "what-changed": {
    family: "what-changed",
    minHeightPx: 300,
    supportsDiagram: true,
    isSplitLayout: true,
    cssClass: "layout-what-changed",
    description: "Scenario A vs B side-by-side with structured analysis questions",
  },
  "constraint-problem": {
    family: "constraint-problem",
    minHeightPx: 320,
    supportsDiagram: false,
    isSplitLayout: false,
    cssClass: "layout-constraint-problem",
    description: "Boxed constraint list + working/drawing space + explanation section",
  },
};

// ─── Assigned question layout ─────────────────────────────────────────────────
export interface AssignedQuestion {
  questionNumber: number;
  type: QuestionType;
  family: LayoutFamily;
  template: LayoutTemplate;
  marks: number;
  answerHeightPx: number;
  totalHeightPx: number;
  sectionId: string;
  hasDiagram: boolean;
}

// ─── Page layout plan ─────────────────────────────────────────────────────────
export interface PageLayoutPlan {
  pageNumber: number;
  questions: AssignedQuestion[];
  totalHeightPx: number;
  hasOverflow: boolean;
}

/**
 * Assigns layout templates and whitespace budgets to all questions in a plan.
 * Returns an array of assigned questions and a page layout plan.
 */
export function assignLayouts(plan: WorksheetPlan, marksPerQuestion: number[]): {
  assignedQuestions: AssignedQuestion[];
  pages: PageLayoutPlan[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const assignedQuestions: AssignedQuestion[] = [];

  let qIndex = 0;
  for (const section of plan.sections) {
    for (let i = 0; i < section.questionTypes.length; i++) {
      const qNum = section.questionRange[0] + i;
      const qType = section.questionTypes[i];
      const family = section.layoutFamilies[i % section.layoutFamilies.length];
      const template = LAYOUT_TEMPLATES[family];
      const marks = marksPerQuestion[qIndex] ?? 3;
      const answerHeight = getAnswerHeightPx(marks);

      // Validate mark-layout compatibility
      const markRule = MARK_LAYOUT_RULES_CHECK(marks, family);
      if (!markRule.valid) {
        warnings.push(`Q${qNum}: ${marks} marks assigned to "${family}" layout. ${markRule.reason}`);
      }

      // Check adjacent family rule
      if (assignedQuestions.length > 0) {
        const prev = assignedQuestions[assignedQuestions.length - 1];
        if (prev.family === family) {
          warnings.push(`Q${qNum} and Q${qNum - 1} both use "${family}" layout. Adjacent questions must use different layout families.`);
        }
      }

      const totalHeight = template.minHeightPx + answerHeight + 16; // 16px padding

      assignedQuestions.push({
        questionNumber: qNum,
        type: qType,
        family,
        template,
        marks,
        answerHeightPx: answerHeight,
        totalHeightPx: totalHeight,
        sectionId: section.id,
        hasDiagram: template.supportsDiagram,
      });

      qIndex++;
    }
  }

  // ── Page fitting ──────────────────────────────────────────────────────────
  const pages: PageLayoutPlan[] = [];
  let currentPage: PageLayoutPlan = { pageNumber: 1, questions: [], totalHeightPx: PAGE.headerHeightPx + PAGE.footerHeightPx, hasOverflow: false };
  const availableHeight = PAGE.heightPx - PAGE.headerHeightPx - PAGE.footerHeightPx - PAGE.marginPx * 2;

  for (const aq of assignedQuestions) {
    const needed = aq.totalHeightPx + PAGE.sectionDividerHeightPx;
    if (currentPage.totalHeightPx + needed > availableHeight && currentPage.questions.length > 0) {
      pages.push(currentPage);
      currentPage = {
        pageNumber: currentPage.pageNumber + 1,
        questions: [],
        totalHeightPx: PAGE.footerHeightPx,
        hasOverflow: false,
      };
    }
    currentPage.questions.push(aq);
    currentPage.totalHeightPx += aq.totalHeightPx;
  }
  if (currentPage.questions.length > 0) pages.push(currentPage);

  return { assignedQuestions, pages, warnings };
}

/** Validates that mark weight is compatible with layout family */
function MARK_LAYOUT_RULES_CHECK(marks: number, family: LayoutFamily): { valid: boolean; reason: string } {
  if (marks >= 5 && (family === "true-false" || family === "mcq-2col")) {
    return { valid: false, reason: `High mark questions (${marks}+) should not use simple layout families like true-false or MCQ.` };
  }
  if (marks === 1 && family === "extended-answer") {
    return { valid: false, reason: `1-mark questions should not use extended-answer layout (too much space).` };
  }
  return { valid: true, reason: "" };
}

// Re-export for use in validator
export { MARK_LAYOUT_RULES_CHECK };
