/**
 * worksheet-generator.ts
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary — unauthorised copying, modification, or distribution is strictly prohibited.
 *
 * STRUCTURED WORKSHEET GENERATOR (v4)
 * Produces PDF-matching worksheets with:
 *   - Navy header block with subject/year/topic
 *   - Name/Date/Class row
 *   - Learning Objective
 *   - Key Vocabulary (two-column grid)
 *   - Common Mistakes To Avoid
 *   - Worked Example (step table)
 *   - Section 1 RECALL (Q1–Q3, varied layouts)
 *   - Section 2 UNDERSTANDING (Q4–Q6, varied layouts)
 *   - Section 3 APPLICATION & ANALYSIS (Q7–Q9, varied layouts)
 *   - ★ CHALLENGE QUESTION
 *   - SELF REFLECTION (confidence table + exit ticket)
 *   - TEACHER COPY — Answer Key + Mark Scheme + Teacher Notes
 *
 * Layout families (7 core + 3 extras):
 *   true_false | mcq_2col | gap_fill_inline | label_diagram |
 *   diagram_subquestions | table_complete | draw_box |
 *   short_answer | extended_answer | matching | ordering
 *
 * Rules enforced:
 *   - No two adjacent questions share the same layout family
 *   - Every section mixes ≥3 layout families
 *   - Secondary worksheets use ≥5 distinct layout families total
 *   - Diagrams appear ≥2 times per secondary worksheet
 *   - Marks ascend by section (recall < understanding < application)
 *   - SEND overlays applied without removing layouts or changing marks
 */

import { expandedMathTopics } from './mathTopicsExpanded';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

interface WorksheetParams {
  subject: string;
  topic: string;
  yearGroup: string;
  sendNeed?: string;
  difficulty: string;
  examBoard?: string;
  includeAnswers: boolean;
  additionalInstructions?: string;
}

export interface WorksheetSection {
  title: string;
  type: "objective" | "vocabulary" | "example" | "guided" | "independent" |
        "challenge" | "answers" | "adaptations" | "review" | "teacher-notes" |
        "mark-scheme" | "extension" | "prior-knowledge" | "self-reflection" |
        "misconceptions" | "recall" | "understanding" | "application" |
        "diagram" | "word-bank" | "sentence-starters" | "reminder-box" |
        "word-problems" | "self-assessment" | "questions" | "reading" |
        "passage" | "source-text" | "comprehension" | string;
  content: string;
  teacherOnly?: boolean;
  svg?: string;
  caption?: string;
  imageUrl?: string;
  attribution?: string;
}

export interface GeneratedWorksheet {
  title: string;
  subtitle: string;
  sections: WorksheetSection[];
  metadata: {
    subject: string;
    topic: string;
    yearGroup: string;
    sendNeed?: string;
    difficulty: string;
    examBoard?: string;
    adaptations: string[];
    totalMarks?: number;
    estimatedTime?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT FAMILIES
// ─────────────────────────────────────────────────────────────────────────────

type LayoutFamily =
  | "true_false"
  | "mcq_2col"
  | "gap_fill_inline"
  | "label_diagram"
  | "diagram_subquestions"
  | "table_complete"
  | "draw_box"
  | "short_answer"
  | "extended_answer"
  | "matching"
  | "ordering";

const DIAGRAM_LAYOUTS = new Set<LayoutFamily>(["label_diagram", "diagram_subquestions", "draw_box"]);

// Layouts allowed per section
const SECTION_LAYOUTS: Record<string, LayoutFamily[]> = {
  recall:        ["true_false", "mcq_2col", "gap_fill_inline", "matching", "ordering", "short_answer"],
  understanding: ["label_diagram", "diagram_subquestions", "table_complete", "gap_fill_inline", "short_answer", "mcq_2col"],
  application:   ["short_answer", "extended_answer", "diagram_subquestions", "table_complete", "draw_box"],
  challenge:     ["extended_answer", "draw_box", "diagram_subquestions"],
};

// Primary school layout profiles
const PRIMARY_KS1_LAYOUTS: LayoutFamily[] = ["true_false", "mcq_2col", "gap_fill_inline", "matching", "short_answer"];
const PRIMARY_KS2_LAYOUTS: LayoutFamily[] = ["true_false", "mcq_2col", "gap_fill_inline", "matching", "ordering", "table_complete", "short_answer"];

// Marks range per layout [min, max]
const MARKS_RANGE: Record<LayoutFamily, [number, number]> = {
  true_false:           [1, 4],
  mcq_2col:             [1, 2],
  gap_fill_inline:      [2, 5],
  label_diagram:        [2, 6],
  diagram_subquestions: [3, 8],
  table_complete:       [2, 6],
  draw_box:             [3, 8],
  short_answer:         [2, 5],
  extended_answer:      [4, 10],
  matching:             [1, 4],
  ordering:             [1, 4],
};

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS TOPICS
// ─────────────────────────────────────────────────────────────────────────────

const mathTopics: Record<string, any> = {
  "fractions": {
    title: "Fractions — Adding, Subtracting, Multiplying and Dividing",
    objective: "Add, subtract, multiply and divide fractions, including mixed numbers. Simplify answers to their lowest terms.",
    priorKnowledge: "Students should be able to: identify numerators and denominators; find common multiples; simplify fractions by dividing by the HCF.",
    vocabulary: [
      "Numerator: the top number in a fraction — shows how many parts are taken",
      "Denominator: the bottom number — shows how many equal parts the whole is divided into",
      "Equivalent fraction: a fraction that represents the same value (e.g. 1/2 = 2/4)",
      "Common denominator: a shared multiple of two denominators",
      "Simplify: divide numerator and denominator by their HCF",
      "Lowest common multiple (LCM): the smallest number that is a multiple of two numbers",
      "Mixed number: a whole number combined with a proper fraction (e.g. 2 3/4)",
      "Improper fraction: numerator is larger than denominator (e.g. 7/4)",
      "Reciprocal: the fraction flipped upside down (e.g. reciprocal of 2/3 is 3/2)",
    ],
    commonMistakes: [
      { head: "Adding denominators", body: "When adding fractions, NEVER add the denominators. Find the LCD first." },
      { head: "Forgetting to simplify", body: "Always check if your answer can be simplified by dividing by the HCF." },
      { head: "Dividing fractions", body: "When dividing, multiply by the RECIPROCAL of the second fraction." },
    ],
    teacherNotes: "Use fraction walls or bar models to support visual learners. Encourage students to always simplify final answers. For SEND students, provide a multiplication grid and a list of common LCMs. Common misconception: students add denominators when adding fractions — address this explicitly with the modelled example.",
    markScheme: [
      { q: "1", marks: 4, answer: "4 TRUE/FALSE statements answered correctly", method: "1 mark each" },
      { q: "2", marks: 2, answer: "B — 5/12", method: "LCD = 12; 3/12 + 2/12 = 5/12" },
      { q: "3", marks: 3, answer: "Gaps: denominator, numerators, denominator, simplify", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Fraction bar diagram labelled correctly", method: "2 marks labels, 2 marks positions" },
      { q: "5", marks: 4, answer: "Table completed: 5/12, 7/12, 11/12, 1/12", method: "1 mark per correct cell" },
      { q: "6", marks: 3, answer: "2/3 + 1/5 = 13/15", method: "LCD = 15; 10/15 + 3/15" },
      { q: "7", marks: 3, answer: "5/6 − 1/4 = 7/12", method: "LCD = 12; 10/12 − 3/12" },
      { q: "8", marks: 4, answer: "1/2 × 3/5 = 3/10; 4 ÷ 3/2 = 8/3 = 2 2/3", method: "2 marks each" },
      { q: "Challenge", marks: 8, answer: "5/8 − 1/3 = 7/24", method: "LCD = 24; 15/24 − 8/24 = 7/24" },
    ],
    example: {
      question: "Calculate 2/5 + 1/3",
      steps: [
        "Step 1: Find the Lowest Common Denominator (LCD) of 5 and 3",
        "         Multiples of 5: 5, 10, 15, 20...   Multiples of 3: 3, 6, 9, 12, 15...",
        "         LCD = 15",
        "Step 2: Convert both fractions to equivalent fractions with denominator 15",
        "         2/5 = 6/15   (multiply top and bottom by 3)",
        "         1/3 = 5/15   (multiply top and bottom by 5)",
        "Step 3: Add the numerators — keep the denominator the same",
        "         6/15 + 5/15 = 11/15",
        "Step 4: Check if the answer can be simplified. 11 and 15 share no common factors.",
        "Answer: 11/15",
      ],
    },
    trueFalse: [
      { stmt: "To add fractions, you must find a common denominator first.", answer: true },
      { stmt: "1/2 + 1/3 = 2/5", answer: false },
      { stmt: "The reciprocal of 3/4 is 4/3.", answer: true },
      { stmt: "5/10 simplified is 1/2.", answer: true },
    ],
    mcqOptions: [
      ["A  7/12", "B  5/12", "C  2/6", "D  4/12"],
    ],
    mcqQuestion: "Calculate 1/4 + 1/6. What is the answer in its simplest form?",
    mcqCorrect: 1,
    gapFill: {
      paragraph: "To add fractions with different _____, we first find the lowest common _____. We then convert each fraction so they share this common _____. We add only the _____, keeping the denominator the same. Finally, we _____ the answer if possible.",
      wordBank: ["denominators", "denominator", "numerators", "simplify", "multiple", "numerator"],
      answers: ["denominators", "multiple", "denominator", "numerators", "simplify"],
    },
    diagram: {
      type: "fraction_bar",
      labels: ["Numerator", "Fraction bar", "Denominator", "Equivalent fraction"],
      answers: ["Numerator", "Fraction bar", "Denominator", "Equivalent fraction"],
    },
    table: {
      headers: ["Calculation", "LCD", "Answer"],
      rows: [
        ["1/3 + 1/4", "12", null],
        ["3/4 − 1/6", "12", null],
        ["5/6 + 1/12", "12", null],
        ["7/12 − 1/2", "12", null],
      ],
    },
    guided: [
      { q: "Calculate 2/3 + 1/5. Show your working clearly.", a: "13/15", marks: 3 },
      { q: "Calculate 5/6 − 1/4. Show your working clearly.", a: "7/12", marks: 3 },
    ],
    independent: [
      { q: "Calculate 1/2 × 3/5. Show your working.", a: "3/10", marks: 2 },
      { q: "Calculate 4 ÷ 3/2. Show your working. (Hint: dividing by a fraction = multiply by its reciprocal)", a: "8/3 = 2 2/3", marks: 2 },
      { q: "A recipe needs 2/3 cup of flour and 1/4 cup of sugar. How much is that in total?", a: "11/12 cup", marks: 3 },
      { q: "Sarah ate 3/8 of a pizza. Tom ate 1/6. How much more did Sarah eat than Tom?", a: "5/24", marks: 3 },
    ],
    challenge: "A water tank is 5/8 full. After using 1/3 of the total capacity for irrigation, what fraction of the tank remains? Show all your working clearly, including the LCD and each step of your calculation.",
    challengeAnswer: "5/8 − 1/3 = 15/24 − 8/24 = 7/24 of the tank remains. LCD = 24; 5/8 = 15/24; 1/3 = 8/24; 15/24 − 8/24 = 7/24.",
    extension: "Research: What is a 'complex fraction'? Can you simplify (1/2) ÷ (3/4 + 1/8)? Show your method.",
    drawTask: {
      instruction: "Draw a number line from 0 to 1. Mark and label the following fractions accurately: 1/4, 1/3, 1/2, 2/3, 3/4.",
      requirements: ["Number line from 0 to 1", "All 5 fractions marked", "Fractions labelled correctly", "Positions are accurate"],
      symbolReference: null,
    },
    diagramSubQ: {
      type: "fraction_diagram",
      questions: [
        "What fraction of the shape is shaded?",
        "Write an equivalent fraction for the shaded part.",
        "What fraction is NOT shaded?",
      ],
    },
    ordering: {
      items: ["Find the LCD", "Convert fractions to equivalent fractions", "Add or subtract the numerators", "Keep the denominator the same", "Simplify the answer"],
      correctOrder: [0, 1, 2, 3, 4],
    },
  },

  "equations": {
    title: "Solving Linear Equations",
    objective: "Solve one-step, two-step and multi-step linear equations. Form and solve equations from word problems.",
    priorKnowledge: "Students should be able to: use inverse operations; substitute values into expressions; understand what 'balance' means in algebra.",
    vocabulary: [
      "Equation: a mathematical statement showing two expressions are equal",
      "Variable: a letter representing an unknown value",
      "Unknown: the value we are trying to find",
      "Inverse operation: the opposite operation (e.g. + and − are inverses)",
      "Coefficient: the number multiplied by a variable (e.g. in 3x, the coefficient is 3)",
      "Solution: the value of the variable that makes the equation true",
      "Balance: whatever you do to one side, you must do to the other",
      "Expand: multiply out brackets",
      "Collect like terms: group terms with the same variable together",
    ],
    commonMistakes: [
      { head: "Not applying to both sides", body: "Whatever operation you perform, it MUST be done to BOTH sides of the equation." },
      { head: "Sign errors", body: "When moving a term across the equals sign, the sign changes (+ becomes −, − becomes +)." },
      { head: "Forgetting to check", body: "Always substitute your answer back into the original equation to verify it is correct." },
    ],
    teacherNotes: "Use balance scales as a visual metaphor. Encourage students to write each step on a new line. Common misconception: students forget to apply the operation to BOTH sides.",
    markScheme: [
      { q: "1", marks: 4, answer: "TRUE: x=5; FALSE: x=3; TRUE: x=4; FALSE: x=7", method: "1 mark each" },
      { q: "2", marks: 2, answer: "C — x = 4", method: "4x − 3 = 13; 4x = 16; x = 4" },
      { q: "3", marks: 3, answer: "Gaps: both sides, inverse, subtract, divide", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Balance diagram labelled correctly", method: "2 marks labels, 2 marks steps" },
      { q: "5", marks: 4, answer: "Table: x=5, x=8, x=5, x=4", method: "1 mark per row" },
      { q: "6", marks: 3, answer: "x = 5", method: "5x + 2 = 27; 5x = 25; x = 5" },
      { q: "7", marks: 3, answer: "x = 8", method: "3x − 8 = 16; 3x = 24; x = 8" },
      { q: "8", marks: 4, answer: "x = 4 (from perimeter equation)", method: "2(2x+1) + 2x = 30; 6x + 2 = 30; x = 4.67" },
      { q: "Challenge", marks: 8, answer: "x = 6", method: "Expand both sides, collect terms" },
    ],
    example: {
      question: "Solve 3x + 5 = 20",
      steps: [
        "Step 1: Identify what operation is being done to x",
        "         x is being multiplied by 3, then 5 is added",
        "Step 2: Use inverse operations — work backwards",
        "         Subtract 5 from both sides:   3x + 5 − 5 = 20 − 5   →   3x = 15",
        "Step 3: Divide both sides by 3:   3x ÷ 3 = 15 ÷ 3   →   x = 5",
        "Step 4: CHECK by substituting back:   3(5) + 5 = 15 + 5 = 20 ✓",
        "Answer: x = 5",
      ],
    },
    trueFalse: [
      { stmt: "The solution to x + 7 = 12 is x = 5.", answer: true },
      { stmt: "The solution to 2x = 6 is x = 3. This means 2(3) = 6 ✓", answer: true },
      { stmt: "To solve 4x − 3 = 13, you first divide by 4.", answer: false },
      { stmt: "The solution to 3x + 1 = 22 is x = 7.", answer: false },
    ],
    mcqOptions: [
      ["A  x = 2", "B  x = 3", "C  x = 4", "D  x = 5"],
    ],
    mcqQuestion: "Solve 4x − 3 = 13. What is the value of x?",
    mcqCorrect: 2,
    gapFill: {
      paragraph: "To solve an equation, we apply inverse operations to _____ sides. We work _____ from the last operation applied to x. If x has been multiplied, we _____. If a number has been added, we _____. We always check our answer by substituting it _____ into the original equation.",
      wordBank: ["both", "backwards", "divide", "subtract", "back", "forwards", "add", "multiply"],
      answers: ["both", "backwards", "divide", "subtract", "back"],
    },
    diagram: {
      type: "balance_scale",
      labels: ["Left pan (expression)", "Right pan (value)", "Balance point", "Equal sign"],
      answers: ["Left pan (expression)", "Right pan (value)", "Balance point", "Equal sign"],
    },
    table: {
      headers: ["Equation", "Step 1", "Step 2", "Solution"],
      rows: [
        ["5x + 2 = 27", null, null, null],
        ["3x − 8 = 16", null, null, null],
        ["7x + 4 = 39", null, null, null],
        ["2(x + 3) = 14", null, null, null],
      ],
    },
    guided: [
      { q: "Solve 5x + 2 = 27. Show every step of your working.", a: "x = 5", marks: 3 },
      { q: "Solve 3x − 8 = 16. Show every step of your working.", a: "x = 8", marks: 3 },
    ],
    independent: [
      { q: "Solve 7x + 4 = 39. Show your working.", a: "x = 5", marks: 3 },
      { q: "Solve 2(x + 3) = 14. Expand the brackets first.", a: "x = 4", marks: 3 },
      { q: "Solve 6x − 5 = 4x + 9. Collect x terms on one side.", a: "x = 7", marks: 4 },
      { q: "The perimeter of a rectangle is 30 cm. The length is (2x + 1) cm and the width is x cm. Form an equation and solve it to find x.", a: "6x + 2 = 30, x ≈ 4.67 cm", marks: 4 },
    ],
    challenge: "Solve 3(2x − 1) + 4 = 5(x + 2) − 3. Show every line of working. Check your answer by substituting back into the original equation.",
    challengeAnswer: "6x − 3 + 4 = 5x + 10 − 3 → 6x + 1 = 5x + 7 → x = 6. Check: 3(11) + 4 = 37 and 5(8) − 3 = 37 ✓",
    extension: "Can you write your own two-step equation where the answer is x = −3? Swap with a partner to solve.",
    drawTask: {
      instruction: "Draw a balance scale diagram to represent the equation 2x + 3 = 11. Show each step of solving it on the diagram.",
      requirements: ["Balance scale drawn", "Equation shown on scale", "Steps to solve shown", "Solution clearly stated"],
      symbolReference: null,
    },
    diagramSubQ: {
      type: "balance_diagram",
      questions: [
        "What is on the left side of the balance?",
        "What must you do to both sides to isolate x?",
        "What is the value of x?",
      ],
    },
    ordering: {
      items: ["Write the equation", "Apply inverse operations to both sides", "Isolate the variable", "Solve for x", "Check by substituting back"],
      correctOrder: [0, 1, 2, 3, 4],
    },
  },

  "percentages": {
    title: "Percentages — Increase, Decrease, Reverse and Compound",
    objective: "Calculate percentage increase and decrease using multipliers. Find the original amount using reverse percentages. Calculate compound interest.",
    priorKnowledge: "Students should be able to: convert between fractions, decimals and percentages; multiply decimals; understand the concept of 'of' in maths.",
    vocabulary: [
      "Percentage: a number expressed as a fraction of 100",
      "Multiplier: the decimal used to calculate a percentage change (e.g. 20% increase = ×1.20)",
      "Percentage increase: the new value is higher than the original",
      "Percentage decrease: the new value is lower than the original",
      "Original amount: the starting value before any percentage change",
      "Reverse percentage: finding the original amount when given the changed amount",
      "Compound interest: interest calculated on both the principal and accumulated interest",
      "Simple interest: interest calculated only on the original principal",
    ],
    commonMistakes: [
      { head: "Subtracting the percentage", body: "For reverse percentages, DIVIDE by the multiplier — do NOT subtract the percentage from the answer." },
      { head: "Wrong multiplier", body: "A 15% increase uses multiplier 1.15. A 15% decrease uses multiplier 0.85 (not 0.15)." },
      { head: "Simple vs compound", body: "For compound interest, apply the multiplier repeatedly — do NOT just multiply by the number of years." },
    ],
    teacherNotes: "Multiplier method is the most efficient and exam-friendly approach. Stress that for reverse percentages, students divide by the multiplier (not subtract the percentage).",
    markScheme: [
      { q: "1", marks: 4, answer: "TRUE: ×1.20; FALSE: ×0.80 not 0.20; TRUE: divide by 1.10; FALSE: £276 not £288", method: "1 mark each" },
      { q: "2", marks: 2, answer: "B — £240", method: "£320 × 0.75 = £240" },
      { q: "3", marks: 3, answer: "Gaps: multiplier, 1.15, 1.15, divide", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Percentage bar labelled correctly", method: "2 marks labels, 2 marks values" },
      { q: "5", marks: 4, answer: "Table: £96, £105, £50, £120", method: "1 mark per row" },
      { q: "6", marks: 3, answer: "504", method: "450 × 1.12" },
      { q: "7", marks: 3, answer: "£120", method: "£78 ÷ 0.65" },
      { q: "8", marks: 4, answer: "£5,627.54", method: "£5,000 × 1.03⁴" },
      { q: "Challenge", marks: 8, answer: "32% reduction", method: "0.80 × 0.85 = 0.68" },
    ],
    example: {
      question: "Increase £240 by 15%",
      steps: [
        "Method 1 — Multiplier (most efficient for exams):",
        "Step 1: Find the multiplier → 100% + 15% = 115% = 1.15",
        "Step 2: Multiply → £240 × 1.15 = £276",
        "",
        "Method 2 — Find 15% then add:",
        "Step 1: Find 10% of £240 = £24",
        "Step 2: Find 5% of £240 = £12",
        "Step 3: 15% = £24 + £12 = £36",
        "Step 4: £240 + £36 = £276",
        "",
        "Answer: £276   (Both methods give the same answer)",
      ],
    },
    trueFalse: [
      { stmt: "A 20% increase uses the multiplier 1.20.", answer: true },
      { stmt: "A 20% decrease uses the multiplier 0.20.", answer: false },
      { stmt: "To find the original price after a 10% increase, divide by 1.10.", answer: true },
      { stmt: "£240 increased by 20% is £288.", answer: false },
    ],
    mcqOptions: [
      ["A  £80", "B  £240", "C  £260", "D  £280"],
    ],
    mcqQuestion: "Decrease £320 by 25%. What is the answer?",
    mcqCorrect: 1,
    gapFill: {
      paragraph: "To calculate a percentage change, we use a _____. For a 15% increase, the multiplier is _____. For a 15% decrease, the multiplier is 0.85. To find the original amount after a percentage increase, we _____ by the multiplier. This is called a _____ percentage.",
      wordBank: ["multiplier", "1.15", "divide", "reverse", "0.15", "multiply", "1.85"],
      answers: ["multiplier", "1.15", "divide", "reverse"],
    },
    diagram: {
      type: "percentage_bar",
      labels: ["Original amount (100%)", "Increase amount", "New amount", "Multiplier"],
      answers: ["Original amount (100%)", "Increase amount", "New amount", "Multiplier"],
    },
    table: {
      headers: ["Calculation", "Multiplier", "Answer"],
      rows: [
        ["Increase £80 by 20%", "1.20", null],
        ["Decrease £150 by 30%", "0.70", null],
        ["Original price after 10% increase = £55", "÷ 1.10", null],
        ["Original price after 35% decrease = £78", "÷ 0.65", null],
      ],
    },
    guided: [
      { q: "Increase 450 by 12%. Show your working.", a: "504", marks: 3 },
      { q: "A coat costs £78 after a 35% reduction. What was the original price?", a: "£120", marks: 3 },
    ],
    independent: [
      { q: "Decrease £320 by 25%. Show your working.", a: "£240", marks: 3 },
      { q: "A house increases in value by 8% to £270,000. What was the original value?", a: "£250,000", marks: 3 },
      { q: "VAT at 20% is added to a bill. The total is £96. What was the pre-VAT amount?", a: "£80", marks: 3 },
      { q: "£5,000 is invested at 3% compound interest per year. How much is it worth after 4 years? Give your answer to the nearest penny.", a: "£5,000 × 1.03⁴ = £5,627.54", marks: 4 },
    ],
    challenge: "A shop reduces all items by 20% for a sale. During the sale, they reduce the already-reduced prices by a further 15%. What is the overall percentage reduction from the original price? Show all your working and explain why the answer is NOT 35%.",
    challengeAnswer: "Overall multiplier = 0.80 × 0.85 = 0.68. This means 68% of original price remains, so overall reduction = 32%. It is not 35% because the second reduction is applied to the already-reduced price, not the original.",
    extension: "Is a 20% increase followed by a 20% decrease the same as no change? Investigate with an example and explain why.",
    drawTask: {
      instruction: "Draw a percentage bar diagram to show how £200 increases by 25% to £250. Label the original amount, the increase, and the new amount.",
      requirements: ["Bar drawn to scale", "Original amount labelled", "Increase amount labelled", "New amount labelled"],
      symbolReference: null,
    },
    diagramSubQ: {
      type: "percentage_diagram",
      questions: [
        "What is the multiplier for a 30% increase?",
        "A price after a 20% increase is £120. What was the original price?",
        "Show the calculation for compound interest at 5% for 2 years on £1,000.",
      ],
    },
    ordering: {
      items: ["Identify the percentage change", "Find the multiplier", "Multiply the original amount", "Check the answer is reasonable", "State the final answer with units"],
      correctOrder: [0, 1, 2, 3, 4],
    },
  },

  "pythagoras": {
    title: "Pythagoras' Theorem",
    objective: "Apply Pythagoras' theorem to find missing sides in right-angled triangles. Determine whether a triangle is right-angled.",
    priorKnowledge: "Students should be able to: square numbers; find square roots; identify the hypotenuse in a right-angled triangle.",
    vocabulary: [
      "Hypotenuse: the longest side of a right-angled triangle, opposite the right angle",
      "Right angle: an angle of exactly 90°",
      "Pythagoras' theorem: a² + b² = c², where c is the hypotenuse",
      "Square root: the inverse of squaring (√25 = 5)",
      "Adjacent: the side next to the angle of interest",
      "Opposite: the side opposite the angle of interest",
      "Pythagorean triple: three whole numbers that satisfy a² + b² = c² (e.g. 3, 4, 5)",
    ],
    commonMistakes: [
      { head: "Square rooting individual terms", body: "Do NOT square root each term separately. Square root the SUM: c = √(a² + b²)." },
      { head: "Wrong side as hypotenuse", body: "The hypotenuse is ALWAYS opposite the right angle — it is always the longest side." },
      { head: "Rearranging incorrectly", body: "To find a shorter side: a² = c² − b². Subtract, then square root." },
    ],
    teacherNotes: "Always encourage students to draw and label a diagram. Common error: students square root the individual terms rather than the sum.",
    markScheme: [
      { q: "1", marks: 4, answer: "TRUE: c=5; FALSE: subtract not add; TRUE: 3,4,5 is triple; FALSE: √(9+16)=5 not 7", method: "1 mark each" },
      { q: "2", marks: 2, answer: "C — 15cm", method: "9² + 12² = 81 + 144 = 225, √225 = 15" },
      { q: "3", marks: 3, answer: "Gaps: hypotenuse, square, square root, subtract", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Triangle diagram labelled correctly", method: "2 marks labels, 2 marks values" },
      { q: "5", marks: 4, answer: "Table: 5, 13, 15, 17", method: "1 mark per row" },
      { q: "6", marks: 3, answer: "c = 15cm", method: "9² + 12² = 225, √225 = 15" },
      { q: "7", marks: 3, answer: "4m", method: "5² − 3² = 16, √16 = 4" },
      { q: "8", marks: 4, answer: "Yes — 7² + 24² = 625 = 25²", method: "Check all three sides" },
      { q: "Challenge", marks: 8, answer: "20km", method: "12² + 16² = 400, √400 = 20" },
    ],
    example: {
      question: "Find the hypotenuse of a right-angled triangle with shorter sides 6cm and 8cm.",
      steps: [
        "Step 1: Label the sides — the hypotenuse (c) is opposite the right angle",
        "         a = 6cm,  b = 8cm,  c = ? (hypotenuse)",
        "Step 2: Write Pythagoras' theorem:   a² + b² = c²",
        "Step 3: Substitute the values:   6² + 8² = c²",
        "Step 4: Calculate:   36 + 64 = c²   →   c² = 100",
        "Step 5: Square root both sides:   c = √100 = 10cm",
        "Answer: The hypotenuse = 10cm",
        "",
        "FINDING A SHORTER SIDE — Example: a = ?, b = 12cm, c = 15cm",
        "Rearrange:   a² = c² − b² = 15² − 12² = 225 − 144 = 81   →   a = 9cm",
      ],
    },
    trueFalse: [
      { stmt: "In a 3-4-5 triangle, the hypotenuse is 5.", answer: true },
      { stmt: "To find a shorter side, you add a² + b².", answer: false },
      { stmt: "3, 4, 5 is a Pythagorean triple.", answer: true },
      { stmt: "√(3² + 4²) = 3 + 4 = 7", answer: false },
    ],
    mcqOptions: [
      ["A  13cm", "B  14cm", "C  15cm", "D  17cm"],
    ],
    mcqQuestion: "Find the hypotenuse of a right-angled triangle with shorter sides 9cm and 12cm.",
    mcqCorrect: 2,
    gapFill: {
      paragraph: "Pythagoras' theorem states that in a right-angled triangle, the square of the _____ equals the sum of the squares of the other two sides. To find the hypotenuse, we _____ the shorter sides and then find the _____. To find a shorter side, we _____ the squares.",
      wordBank: ["hypotenuse", "square", "square root", "subtract", "add", "divide", "multiply"],
      answers: ["hypotenuse", "square", "square root", "subtract"],
    },
    diagram: {
      type: "right_triangle",
      labels: ["Hypotenuse (c)", "Side a", "Side b", "Right angle (90°)"],
      answers: ["Hypotenuse (c)", "Side a", "Side b", "Right angle (90°)"],
    },
    table: {
      headers: ["Side a", "Side b", "Hypotenuse c"],
      rows: [
        ["3cm", "4cm", null],
        ["5cm", "12cm", null],
        ["8cm", null, "17cm"],
        [null, "15cm", "17cm"],
      ],
    },
    guided: [
      { q: "Find the hypotenuse: a = 9cm, b = 12cm. Show all working.", a: "c = 15cm", marks: 3 },
      { q: "A ladder 5m long leans against a wall. The base is 3m from the wall. How high up the wall does it reach? Draw a diagram.", a: "4m", marks: 3 },
    ],
    independent: [
      { q: "Find side a: b = 24cm, c = 25cm. Show all working.", a: "a = 7cm", marks: 3 },
      { q: "Calculate the length of the diagonal of a rectangle that is 8cm wide and 15cm tall.", a: "17cm", marks: 3 },
      { q: "Is a triangle with sides 7cm, 24cm and 25cm a right-angled triangle? Show your working and explain your answer.", a: "Yes: 7² + 24² = 49 + 576 = 625 = 25² ✓", marks: 4 },
      { q: "A ship sails 12km due North, then 16km due East. Calculate the shortest distance back to the starting point.", a: "20km", marks: 4 },
    ],
    challenge: "A ship sails 12km due North, then 16km due East. Calculate the shortest distance back to the starting point. Give your answer to 1 decimal place and draw a clearly labelled diagram to support your working.",
    challengeAnswer: "√(12² + 16²) = √(144 + 256) = √400 = 20km",
    extension: "Investigate Pythagorean triples. Can you find a formula to generate them? (Hint: try m² − n², 2mn, m² + n²)",
    drawTask: {
      instruction: "Draw a right-angled triangle with sides 3cm, 4cm and 5cm. Label all three sides and the right angle. Show that Pythagoras' theorem holds for this triangle.",
      requirements: ["Triangle drawn accurately", "All three sides labelled with lengths", "Right angle marked", "Pythagoras' theorem shown"],
      symbolReference: null,
    },
    diagramSubQ: {
      type: "right_triangle_diagram",
      questions: [
        "Label the hypotenuse on the diagram.",
        "Which side is opposite the right angle?",
        "Write Pythagoras' theorem using the letters on the diagram.",
      ],
    },
    ordering: {
      items: ["Draw and label the triangle", "Identify which side is the hypotenuse", "Write Pythagoras' theorem", "Substitute the known values", "Calculate and square root"],
      correctOrder: [0, 1, 2, 3, 4],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH TOPICS
// ─────────────────────────────────────────────────────────────────────────────

const englishTopics: Record<string, any> = {
  "macbeth": {
    title: "Macbeth — Shakespeare's Tragedy of Ambition",
    objective: "Analyse Shakespeare's presentation of ambition, power and guilt in Macbeth. Use PEE structure with embedded quotations to support analysis.",
    priorKnowledge: "Students should know: the plot of Macbeth; key characters; how to use PEE structure; basic literary devices (metaphor, imagery, foreshadowing).",
    vocabulary: [
      "Ambition: a strong desire to achieve something, often at any cost",
      "Tragic hero: a protagonist who is noble but brought down by a fatal flaw",
      "Soliloquy: a speech in which a character reveals their thoughts to the audience",
      "Aside: a remark spoken to the audience, not heard by other characters",
      "Foreshadowing: hints at future events in the plot",
      "Imagery: descriptive language that creates a picture in the reader's mind",
      "Motif: a recurring symbol or theme (e.g. blood, darkness in Macbeth)",
      "Hubris: excessive pride or self-confidence that leads to downfall",
      "Nemesis: the punishment or downfall that follows hubris",
    ],
    commonMistakes: [
      { head: "Retelling the plot", body: "Do NOT just describe what happens. ANALYSE how Shakespeare presents ideas through language and structure." },
      { head: "Quotations without analysis", body: "Always explain HOW the quotation supports your point. What technique is used? What effect does it have?" },
      { head: "Ignoring context", body: "Reference the Jacobean context — Shakespeare's audience would have been deeply concerned about regicide and the divine right of kings." },
    ],
    teacherNotes: "Encourage students to embed quotations rather than dropping them in. Model the difference between retelling and analysis. For SEND students, provide sentence starters and a quotation bank.",
    markScheme: [
      { q: "1", marks: 4, answer: "TRUE: Macbeth kills Duncan; FALSE: Lady Macbeth is stronger initially; TRUE: witches prophecy; FALSE: Banquo not killed by Macbeth directly", method: "1 mark each" },
      { q: "2", marks: 2, answer: "B — Ambition", method: "The 'vaulting ambition' soliloquy shows Macbeth's fatal flaw" },
      { q: "3", marks: 3, answer: "Gaps: soliloquy, ambition, regicide, guilt", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Character web labelled correctly", method: "2 marks labels, 2 marks relationships" },
      { q: "5", marks: 4, answer: "Table completed with themes and evidence", method: "1 mark per row" },
      { q: "6", marks: 3, answer: "PEE paragraph on ambition with embedded quotation", method: "1 mark point, 1 mark evidence, 1 mark explanation" },
      { q: "7", marks: 4, answer: "Analysis of 'Out, damned spot' with technique and effect", method: "2 marks technique, 2 marks effect" },
      { q: "8", marks: 6, answer: "Extended analysis of power with multiple quotations", method: "GCSE mark bands" },
      { q: "Challenge", marks: 8, answer: "Essay on whether Macbeth is a villain or victim", method: "GCSE mark bands" },
    ],
    example: {
      question: "How does Shakespeare present Macbeth's ambition in Act 1?",
      steps: [
        "POINT: Shakespeare presents Macbeth's ambition as dangerous and all-consuming.",
        "",
        "EVIDENCE: In his soliloquy, Macbeth describes his 'vaulting ambition, which o'erleaps itself'.",
        "",
        "EXPLAIN: The metaphor of 'vaulting' suggests ambition that leaps beyond what is safe or reasonable.",
        "         The word 'o'erleaps' implies that Macbeth's ambition will cause his own downfall —",
        "         like a horse jumping too high and falling on the other side.",
        "",
        "CONTEXT: A Jacobean audience would have seen ambition as a sin — to desire the king's throne",
        "          was to challenge the divine right of kings, which God had ordained.",
        "",
        "LINK: This shows that from the very beginning, Shakespeare signals that Macbeth's ambition",
        "      will lead to tragedy.",
      ],
    },
    trueFalse: [
      { stmt: "Macbeth kills King Duncan to become King of Scotland.", answer: true },
      { stmt: "Lady Macbeth is weaker than Macbeth throughout the play.", answer: false },
      { stmt: "The witches prophesy that Macbeth will become Thane of Cawdor.", answer: true },
      { stmt: "Macbeth personally kills Banquo with his own hands.", answer: false },
    ],
    mcqOptions: [
      ["A  Loyalty", "B  Ambition", "C  Jealousy", "D  Cowardice"],
    ],
    mcqQuestion: "Which of the following is described as Macbeth's 'fatal flaw' in the play?",
    mcqCorrect: 1,
    gapFill: {
      paragraph: "In his famous _____, Macbeth reveals that his 'vaulting _____' will lead to his downfall. Shakespeare uses the metaphor of a horse jumping too high to suggest that Macbeth's desire for the throne will cause him to fall. The act of killing the king, known as _____, was considered the worst possible sin in Jacobean England. As the play progresses, Macbeth is consumed by _____ and paranoia.",
      wordBank: ["soliloquy", "ambition", "regicide", "guilt", "aside", "loyalty", "hubris"],
      answers: ["soliloquy", "ambition", "regicide", "guilt"],
    },
    diagram: {
      type: "character_web",
      labels: ["Macbeth", "Lady Macbeth", "Banquo", "Duncan", "Witches", "Malcolm"],
      answers: ["Macbeth (protagonist)", "Lady Macbeth (manipulator)", "Banquo (foil)", "Duncan (victim)", "Witches (catalyst)", "Malcolm (heir)"],
    },
    table: {
      headers: ["Theme", "Key Quotation", "Act/Scene", "Effect"],
      rows: [
        ["Ambition", null, "Act 1 Scene 7", null],
        ["Guilt", null, "Act 5 Scene 1", null],
        ["Power", null, "Act 3 Scene 4", null],
        ["Fate vs Free Will", null, "Act 1 Scene 3", null],
      ],
    },
    guided: [
      { q: "Write a PEE paragraph analysing how Shakespeare presents guilt in Act 5 Scene 1 ('Out, damned spot'). Use an embedded quotation.", a: "Point: guilt; Evidence: 'Out, damned spot'; Explain: Lady Macbeth's hallucination shows guilt has driven her to madness", marks: 4 },
      { q: "How does Shakespeare use the witches to create a sense of fate and inevitability? Refer to specific language in your answer.", a: "Analysis of 'Fair is foul and foul is fair' — paradox creates confusion and moral ambiguity; witches represent fate", marks: 4 },
    ],
    independent: [
      { q: "Analyse how Shakespeare presents the theme of power in Macbeth. Use at least two quotations and refer to language techniques.", a: "Extended analysis with PEE structure, embedded quotations, language techniques, and contextual reference", marks: 6 },
      { q: "Compare how Macbeth and Lady Macbeth respond to the murder of Duncan. What does this tell us about their characters?", a: "Comparative analysis: Macbeth — guilt, hallucinations; Lady Macbeth — initially cold, later guilt-ridden. Character development.", marks: 6 },
    ],
    challenge: "Is Macbeth a villain or a victim? Write a balanced argument considering both perspectives. Use evidence from the play and refer to the Jacobean context. Reach a justified conclusion.",
    challengeAnswer: "Villain: he makes choices, kills repeatedly, becomes a tyrant. Victim: manipulated by witches and Lady Macbeth, ambition is a human flaw, tragic hero structure. Conclusion must be justified with evidence.",
    extension: "Research the historical Macbeth. How does Shakespeare's version differ from the real king? Why might Shakespeare have made these changes?",
    drawTask: {
      instruction: "Create a spider diagram showing the key themes in Macbeth. For each theme, add one quotation as evidence and name the literary technique used.",
      requirements: ["At least 5 themes shown", "One quotation per theme", "Literary technique named", "Clear connections between themes"],
      symbolReference: null,
    },
    diagramSubQ: {
      type: "character_relationship_diagram",
      questions: [
        "Who is the protagonist of the play?",
        "What relationship does Lady Macbeth have with Macbeth?",
        "Who is Macbeth's foil in the play?",
      ],
    },
    ordering: {
      items: ["Duncan is murdered by Macbeth", "Macbeth meets the witches", "Macbeth becomes King", "Banquo is murdered", "Lady Macbeth sleepwalks", "Macbeth is killed by Macduff"],
      correctOrder: [1, 0, 2, 3, 4, 5],
    },
  },

  "comprehension": {
    title: "Reading Comprehension — Inference, Deduction and Analysis",
    objective: "Use inference and deduction to interpret meaning. Analyse language choices and their effects on the reader.",
    priorKnowledge: "Students should be able to: identify explicit information; use PEE structure; understand basic literary terms.",
    vocabulary: [
      "Inference: reading between the lines — working out what is implied but not directly stated",
      "Deduction: drawing a logical conclusion from evidence in the text",
      "Evidence: a quotation or reference from the text that supports a point",
      "Imply: to suggest something without stating it directly",
      "Connotation: the emotional associations of a word beyond its literal meaning",
      "Tone: the attitude of the writer towards the subject or reader",
      "Atmosphere: the mood or feeling created in a piece of writing",
      "Explicit: directly stated in the text",
      "Implicit: suggested or implied, not directly stated",
    ],
    commonMistakes: [
      { head: "Quoting without explaining", body: "A quotation alone earns no marks. You must explain WHAT the quotation shows and HOW the language creates an effect." },
      { head: "Paraphrasing instead of quoting", body: "Use the exact words from the text in inverted commas. Paraphrasing is not a quotation." },
      { head: "Literal interpretation only", body: "Go beyond the literal meaning. Ask: what does this SUGGEST? What does this IMPLY about the character/setting/theme?" },
    ],
    teacherNotes: "Model the difference between explicit and implicit information. PEE structure is essential. For SEND students, provide sentence starters.",
    markScheme: [
      { q: "1", marks: 4, answer: "TRUE: atmosphere is eerie; FALSE: 'creaked' is a verb not adjective; TRUE: implicit meaning; FALSE: pathetic fallacy not simile", method: "1 mark each" },
      { q: "2", marks: 2, answer: "B — Pathetic fallacy", method: "Weather/setting reflects character's mood" },
      { q: "3", marks: 3, answer: "Gaps: inference, evidence, implies, connotation", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Annotation diagram completed correctly", method: "2 marks technique, 2 marks effect" },
      { q: "5", marks: 4, answer: "Table: technique, quotation, effect for 4 examples", method: "1 mark per row" },
      { q: "6", marks: 4, answer: "PEE paragraph on atmosphere with embedded quotation", method: "GCSE mark bands" },
      { q: "7", marks: 3, answer: "Explanation of 'deafening silence' oxymoron", method: "1 mark technique, 2 marks effect" },
      { q: "8", marks: 6, answer: "Extended analysis of language techniques", method: "GCSE mark bands" },
      { q: "Challenge", marks: 8, answer: "Comparative analysis of two texts", method: "GCSE mark bands" },
    ],
    example: {
      question: "What can you infer about Maya's feelings from: 'Her hands trembled as she reached for the door handle. She had been standing outside for twenty minutes, unable to move.'",
      steps: [
        "Step 1: Identify the key words that suggest emotion",
        "         'hands trembled' — physical sign of fear/anxiety",
        "         'unable to move' — paralysed by emotion",
        "         'twenty minutes' — prolonged hesitation",
        "Step 2: Make an inference (what does this suggest?)",
        "         Maya is extremely anxious or frightened about going inside",
        "Step 3: Write your answer using PEE structure:",
        "         POINT: Maya appears to be overwhelmed with anxiety.",
        "         EVIDENCE: The writer describes how 'her hands trembled'",
        "         EXPLAIN: This physical reaction suggests she is so nervous she has lost control",
        "                  of her body, implying she is dreading what lies beyond the door.",
        "",
        "Tip: Always use 'suggests', 'implies' or 'shows' to signal an inference.",
      ],
    },
    trueFalse: [
      { stmt: "An eerie atmosphere is created in the passage through words like 'creaked' and 'dark and empty'.", answer: true },
      { stmt: "The word 'creaked' is an adjective.", answer: false },
      { stmt: "Implicit meaning is something that is suggested rather than directly stated.", answer: true },
      { stmt: "Pathetic fallacy is a type of simile.", answer: false },
    ],
    mcqOptions: [
      ["A  Simile", "B  Pathetic fallacy", "C  Alliteration", "D  Onomatopoeia"],
    ],
    mcqQuestion: "When a writer uses the weather to reflect a character's mood, this technique is called:",
    mcqCorrect: 1,
    gapFill: {
      paragraph: "When we read between the lines to work out what a writer is suggesting, this is called _____. We support our points with _____ from the text. The word 'dark' _____ that the house is threatening and unwelcoming. The _____ of the word 'empty' suggests loneliness and abandonment.",
      wordBank: ["inference", "evidence", "implies", "connotation", "deduction", "suggests", "tone"],
      answers: ["inference", "evidence", "implies", "connotation"],
    },
    diagram: {
      type: "annotation_diagram",
      labels: ["Technique used", "Quotation from text", "Effect on reader", "Context/connotation"],
      answers: ["Technique used", "Quotation from text", "Effect on reader", "Context/connotation"],
    },
    table: {
      headers: ["Technique", "Example from text", "Effect on reader"],
      rows: [
        ["Metaphor", null, null],
        ["Personification", null, null],
        ["Simile", null, null],
        ["Pathetic fallacy", null, null],
      ],
    },
    guided: [
      { q: "Read: 'The old house creaked in the wind, its windows dark and empty.' Write a PEE paragraph about the atmosphere created. Use an embedded quotation.", a: "Point: eerie atmosphere; Evidence: 'creaked', 'dark and empty'; Explain: suggests abandonment and neglect", marks: 4 },
      { q: "Explain what the writer means by 'the silence was deafening'. What technique is used and what effect does it have?", a: "Oxymoron — silence cannot literally be deafening. Emphasises how oppressive and uncomfortable the silence was, creating tension.", marks: 3 },
    ],
    independent: [
      { q: "How does the writer use language to create tension in the opening paragraph? Refer to at least two language techniques.", a: "Analysis of techniques with evidence and explanation", marks: 6 },
      { q: "Compare how two characters respond to the situation. What does this tell us about their personalities?", a: "Comparative analysis with evidence from the text for each character", marks: 6 },
    ],
    challenge: "Compare how two writers use language to present different attitudes towards the same theme. Use evidence from both texts and analyse the effect on the reader. Use comparative language ('whereas', 'in contrast', 'similarly').",
    challengeAnswer: "Comparative analysis with PEE paragraphs from both texts, including: identification of techniques, embedded quotations, analysis of effect, and comparison language.",
    extension: "Research the term 'pathetic fallacy'. Find an example in a novel or poem you have studied and write a paragraph analysing its effect.",
    drawTask: {
      instruction: "Create an annotation diagram for the following quotation: 'The storm raged like a wild beast, tearing at the trees.' Label the technique, the effect, and the connotation of key words.",
      requirements: ["Quotation written clearly", "Technique identified and labelled", "Effect on reader explained", "Connotation of at least one word analysed"],
      symbolReference: null,
    },
    diagramSubQ: {
      type: "text_annotation",
      questions: [
        "What technique is used in the phrase 'hands trembled'?",
        "What does this suggest about the character's feelings?",
        "How does this create tension for the reader?",
      ],
    },
    ordering: {
      items: ["Make a point", "Select evidence from the text", "Embed the quotation", "Explain the technique used", "Analyse the effect on the reader"],
      correctOrder: [0, 1, 2, 3, 4],
    },
  },

  "creative-writing": {
    title: "Creative Writing — Descriptive and Narrative Techniques",
    objective: "Use a range of descriptive and narrative techniques to create vivid, engaging writing. Structure writing effectively for impact.",
    priorKnowledge: "Students should know: basic punctuation; sentence types; some literary devices (simile, metaphor).",
    vocabulary: [
      "Simile: a comparison using 'like' or 'as' (e.g. 'as cold as ice')",
      "Metaphor: a direct comparison without 'like' or 'as' (e.g. 'the moon is a silver coin')",
      "Personification: giving human qualities to non-human things",
      "Sensory language: language that appeals to the five senses",
      "Pathetic fallacy: using weather/setting to reflect a character's mood",
      "Imagery: descriptive language that creates a picture in the reader's mind",
      "Foreshadowing: hints at future events in the narrative",
      "Narrative voice: the perspective from which a story is told",
      "Pace: the speed at which a narrative moves",
    ],
    commonMistakes: [
      { head: "Telling instead of showing", body: "Don't write 'She was scared.' Instead SHOW it: 'Her hands trembled and her breath came in short, sharp gasps.'" },
      { head: "Overusing adjectives", body: "One well-chosen adjective is more powerful than three ordinary ones. Be selective." },
      { head: "Ignoring structure", body: "Vary sentence length deliberately. Short sentences create tension. Longer sentences build atmosphere." },
    ],
    teacherNotes: "Provide a 'techniques toolkit' card for SEND students. Encourage planning before writing. Discuss how professional authors use short sentences for tension.",
    markScheme: [
      { q: "1", marks: 4, answer: "TRUE: simile uses like/as; FALSE: metaphor is direct; TRUE: short sentences create tension; FALSE: pathetic fallacy is weather not dialogue", method: "1 mark each" },
      { q: "2", marks: 2, answer: "C — Personification", method: "Giving human qualities to non-human things" },
      { q: "3", marks: 3, answer: "Gaps: sensory, show, vary, atmosphere", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Techniques diagram labelled correctly", method: "2 marks labels, 2 marks examples" },
      { q: "5", marks: 4, answer: "Table: technique, example, effect for 4 techniques", method: "1 mark per row" },
      { q: "6", marks: 8, answer: "Descriptive paragraph with 3+ techniques", method: "GCSE mark bands" },
      { q: "7", marks: 8, answer: "Narrative opening with atmosphere", method: "GCSE mark bands" },
      { q: "8", marks: 6, answer: "Show don't tell paragraph", method: "GCSE mark bands" },
      { q: "Challenge", marks: 16, answer: "Extended creative writing", method: "GCSE mark bands" },
    ],
    example: {
      question: "Write a descriptive paragraph about a storm using at least three techniques.",
      steps: [
        "PLANNING — think about all five senses:",
        "   Sight: dark clouds, lightning, sheets of rain",
        "   Sound: thunder, howling wind, rain hammering",
        "   Touch: cold, wet, wind pushing",
        "   Smell: petrichor (smell of rain on earth)",
        "",
        "EXAMPLE PARAGRAPH:",
        "The storm descended without warning. Black clouds, thick as bruises, swallowed the last of the afternoon light.",
        "Rain fell like needles — sharp, relentless, merciless. The wind howled its fury at the trembling trees,",
        "tearing leaves from their branches as if punishing them for simply existing.",
        "",
        "TECHNIQUES USED:",
        "   Simile: 'like needles', 'thick as bruises'",
        "   Personification: 'howled its fury', 'punishing them'",
        "   Pathetic fallacy: storm reflects danger/threat",
        "   Rule of three: 'sharp, relentless, merciless'",
      ],
    },
    trueFalse: [
      { stmt: "A simile makes a comparison using 'like' or 'as'.", answer: true },
      { stmt: "A metaphor says something IS something else, using 'like' or 'as'.", answer: false },
      { stmt: "Short sentences can be used to create tension in a narrative.", answer: true },
      { stmt: "Pathetic fallacy means using dialogue to reflect a character's mood.", answer: false },
    ],
    mcqOptions: [
      ["A  Simile", "B  Metaphor", "C  Personification", "D  Alliteration"],
    ],
    mcqQuestion: "Which technique gives human qualities to non-human things?",
    mcqCorrect: 2,
    gapFill: {
      paragraph: "Effective descriptive writing appeals to all five _____ senses. Rather than telling the reader how a character feels, we _____ their emotions through physical reactions and behaviour. We _____ sentence length to control the pace of the narrative. Short sentences create tension; longer sentences build _____.",
      wordBank: ["sensory", "show", "vary", "atmosphere", "tell", "hide", "ignore"],
      answers: ["sensory", "show", "vary", "atmosphere"],
    },
    diagram: {
      type: "techniques_spider",
      labels: ["Simile", "Metaphor", "Personification", "Pathetic fallacy", "Sensory language", "Rule of three"],
      answers: ["Simile: comparison using like/as", "Metaphor: direct comparison", "Personification: human qualities", "Pathetic fallacy: weather = mood", "Sensory language: 5 senses", "Rule of three: emphasis"],
    },
    table: {
      headers: ["Technique", "Example", "Effect on reader"],
      rows: [
        ["Simile", null, null],
        ["Personification", null, null],
        ["Pathetic fallacy", null, null],
        ["Rule of three", null, null],
      ],
    },
    guided: [
      { q: "Write a paragraph (8–10 sentences) describing a busy market using all FIVE senses. Use at least three literary techniques.", a: "Extended writing. Mark on: range of senses (2), techniques (3), vocabulary (2), structure (1).", marks: 8 },
      { q: "Write an opening paragraph for a story set in a haunted house. Use pathetic fallacy, personification and at least one short sentence for impact.", a: "Extended writing. Mark on: techniques used (3), atmosphere created (2), vocabulary (2), sentence variety (1).", marks: 8 },
    ],
    independent: [
      { q: "Write a narrative paragraph from the perspective of someone who has just received unexpected good news. Show — don't tell — their emotions.", a: "Extended writing. Look for: physical reactions, internal thoughts, varied sentence lengths, specific details.", marks: 6 },
      { q: "Rewrite the following dull sentence to make it vivid and descriptive: 'The man walked down the street.' Use at least three different techniques.", a: "Various improved versions — look for specific verbs, adjectives, sensory detail, and literary techniques.", marks: 6 },
    ],
    challenge: "Write a 200-word description of a setting that shifts from peaceful to threatening. Use a range of techniques including extended metaphor, pathetic fallacy, and varied sentence lengths for effect. Annotate your writing to identify the techniques you have used.",
    challengeAnswer: "Extended creative writing response. Mark on: GCSE bands — communication/organisation (8 marks) and technical accuracy (8 marks). Look for: clear structural shift, sustained extended metaphor, range of techniques, accurate punctuation.",
    extension: "Read the opening paragraph of a novel of your choice. Identify three techniques the author uses and explain how each creates an effect on the reader.",
    drawTask: {
      instruction: "Create a planning spider diagram for a descriptive piece about 'a city at night'. Include ideas for all five senses and at least three literary techniques you will use.",
      requirements: ["Spider diagram with central topic", "All five senses included", "At least three techniques planned", "Specific vocabulary ideas noted"],
      symbolReference: null,
    },
    diagramSubQ: {
      type: "writing_techniques",
      questions: [
        "Name the technique used in 'the moon watched over the sleeping town'.",
        "What effect does this technique create?",
        "Write your own sentence using the same technique.",
      ],
    },
    ordering: {
      items: ["Plan your writing (spider diagram)", "Write a powerful opening sentence", "Build atmosphere using descriptive techniques", "Vary sentence length for effect", "End with a memorable closing line"],
      correctOrder: [0, 1, 2, 3, 4],
    },
  },

  "grammar": {
    title: "Grammar and Punctuation — Sentences, Clauses and Punctuation",
    objective: "Identify and use a range of sentence structures. Apply punctuation accurately including commas, semicolons, colons and dashes.",
    priorKnowledge: "Students should know: basic sentence structure (subject + verb + object); full stops and capital letters; simple and compound sentences.",
    vocabulary: [
      "Simple sentence: one independent clause with a subject and verb",
      "Compound sentence: two independent clauses joined by a coordinating conjunction (FANBOYS)",
      "Complex sentence: an independent clause joined to a dependent clause",
      "Subordinate clause: a clause that depends on the main clause for meaning",
      "Coordinating conjunction: joins two equal clauses (for, and, nor, but, or, yet, so)",
      "Subordinating conjunction: introduces a subordinate clause (because, although, when, if)",
      "Semicolon: used to join two closely related independent clauses",
      "Colon: introduces a list, explanation, or quotation",
    ],
    commonMistakes: [
      { head: "Comma splice", body: "Do NOT join two independent clauses with just a comma. Use a semicolon, conjunction, or full stop." },
      { head: "Misplaced apostrophes", body: "Apostrophes show possession (the dog's bone) or contraction (don't). They are NOT used for plurals." },
      { head: "Sentence fragments", body: "Every sentence needs a subject AND a verb. 'Running down the street.' is a fragment — not a sentence." },
    ],
    teacherNotes: "Use colour coding to identify different clause types. Provide a FANBOYS card for SEND students. Common error: comma splice — address explicitly.",
    markScheme: [
      { q: "1", marks: 4, answer: "TRUE: semicolons join clauses; FALSE: comma splice is incorrect; TRUE: complex sentence has subordinate clause; FALSE: apostrophes not for plurals", method: "1 mark each" },
      { q: "2", marks: 2, answer: "B — Semicolon", method: "Joins two closely related independent clauses" },
      { q: "3", marks: 3, answer: "Gaps: independent, subordinate, coordinating, semicolon", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Sentence diagram labelled correctly", method: "2 marks labels, 2 marks structure" },
      { q: "5", marks: 4, answer: "Table: sentence type, example, punctuation for 4 types", method: "1 mark per row" },
      { q: "6", marks: 3, answer: "Three sentences rewritten correctly", method: "1 mark each" },
      { q: "7", marks: 4, answer: "Paragraph with varied sentence structures", method: "GCSE mark bands" },
      { q: "8", marks: 6, answer: "Extended writing with accurate punctuation", method: "GCSE mark bands" },
      { q: "Challenge", marks: 8, answer: "Annotated paragraph with all punctuation explained", method: "GCSE mark bands" },
    ],
    example: {
      question: "Identify the sentence type and explain the punctuation used: 'Although it was raining heavily, she decided to walk to school; she enjoyed the fresh air.'",
      steps: [
        "SENTENCE TYPE: Complex + compound (a compound-complex sentence)",
        "",
        "CLAUSE 1 (subordinate): 'Although it was raining heavily'",
        "   — 'Although' is a subordinating conjunction",
        "   — This clause cannot stand alone",
        "",
        "CLAUSE 2 (main): 'she decided to walk to school'",
        "   — This is the independent (main) clause",
        "",
        "CLAUSE 3 (main): 'she enjoyed the fresh air'",
        "   — Another independent clause",
        "",
        "PUNCTUATION:",
        "   Comma after 'heavily' — separates the subordinate clause from the main clause",
        "   Semicolon after 'school' — joins two closely related independent clauses",
      ],
    },
    trueFalse: [
      { stmt: "A semicolon can be used to join two closely related independent clauses.", answer: true },
      { stmt: "Using a comma to join two independent clauses is always correct.", answer: false },
      { stmt: "A complex sentence contains at least one subordinate clause.", answer: true },
      { stmt: "Apostrophes are used to make nouns plural (e.g. apple's).", answer: false },
    ],
    mcqOptions: [
      ["A  Comma", "B  Semicolon", "C  Colon", "D  Dash"],
    ],
    mcqQuestion: "Which punctuation mark is used to join two closely related independent clauses?",
    mcqCorrect: 1,
    gapFill: {
      paragraph: "A simple sentence contains one _____ clause. A complex sentence contains a main clause and a _____ clause. The two main clauses in a compound sentence are joined by a _____ conjunction. A _____ can be used instead of a conjunction to join two closely related independent clauses.",
      wordBank: ["independent", "subordinate", "coordinating", "semicolon", "dependent", "comma", "colon"],
      answers: ["independent", "subordinate", "coordinating", "semicolon"],
    },
    diagram: {
      type: "sentence_structure",
      labels: ["Main clause", "Subordinate clause", "Coordinating conjunction", "Subordinating conjunction"],
      answers: ["Main clause (independent)", "Subordinate clause (dependent)", "Coordinating conjunction (FANBOYS)", "Subordinating conjunction (because, although...)"],
    },
    table: {
      headers: ["Sentence Type", "Example", "Key Feature"],
      rows: [
        ["Simple", null, null],
        ["Compound", null, null],
        ["Complex", null, null],
        ["Compound-complex", null, null],
      ],
    },
    guided: [
      { q: "Rewrite these sentences correctly: (a) She ran quickly, she was late. (b) Its a beautiful day. (c) Running down the street.", a: "(a) She ran quickly; she was late. (b) It's a beautiful day. (c) She was running down the street.", marks: 3 },
      { q: "Write a complex sentence about a journey to school. Underline the subordinate clause.", a: "Various answers — must contain a subordinating conjunction and a subordinate clause", marks: 3 },
    ],
    independent: [
      { q: "Write a paragraph of 5–6 sentences describing your favourite place. Use at least one of each: simple, compound, and complex sentence. Label each sentence type.", a: "Extended writing with varied sentence structures labelled correctly", marks: 6 },
      { q: "Correct all the punctuation errors in the following passage: [passage provided]. Explain each correction you make.", a: "All errors corrected with explanations", marks: 6 },
    ],
    challenge: "Write a paragraph of 8–10 sentences on any topic. Use every type of punctuation covered in this worksheet at least once: comma, semicolon, colon, dash, apostrophe. Annotate each use of punctuation to explain why you have used it.",
    challengeAnswer: "Extended writing with all punctuation types used correctly and annotated with explanations",
    extension: "Research the Oxford comma. What is it? When is it used? Write three examples — one where it changes the meaning and one where it doesn't.",
    drawTask: {
      instruction: "Draw a diagram showing the structure of a compound-complex sentence. Label the main clauses, subordinate clause, coordinating conjunction, and subordinating conjunction.",
      requirements: ["Compound-complex sentence written", "Main clauses labelled", "Subordinate clause labelled", "Conjunctions identified"],
      symbolReference: null,
    },
    diagramSubQ: {
      type: "sentence_diagram",
      questions: [
        "Identify the main clause in the sentence.",
        "Identify the subordinate clause.",
        "What punctuation is used between the clauses and why?",
      ],
    },
    ordering: {
      items: ["Simple sentence (one clause)", "Compound sentence (two main clauses)", "Complex sentence (main + subordinate)", "Compound-complex sentence (two main + subordinate)", "Minor sentence (fragment for effect)"],
      correctOrder: [0, 1, 2, 3, 4],
    },
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// SCIENCE TOPICS
// ─────────────────────────────────────────────────────────────────────────────

const scienceTopics: Record<string, any> = {
  "electricity": {
    title: "Electricity — Circuits, Current and Resistance",
    objective: "Describe how current, voltage and resistance are related using Ohm's Law. Analyse series and parallel circuits.",
    priorKnowledge: "Students should know: what current, voltage and resistance are; basic circuit symbols; how to draw circuit diagrams.",
    vocabulary: [
      "Current (I): the flow of electric charge, measured in amperes (A)",
      "Voltage (V): the energy transferred per unit charge, measured in volts (V)",
      "Resistance (R): opposition to the flow of current, measured in ohms (Ω)",
      "Ohm's Law: V = IR — voltage equals current multiplied by resistance",
      "Series circuit: components connected in a single loop — current is the same throughout",
      "Parallel circuit: components connected in separate branches — voltage is the same across each branch",
      "Ammeter: measures current — connected in series",
      "Voltmeter: measures voltage — connected in parallel",
    ],
    commonMistakes: [
      { head: "Confusing current and voltage", body: "Current (A) flows through components. Voltage (V) is measured across components. They are NOT the same thing." },
      { head: "Series vs parallel", body: "In series: current is the same everywhere. In parallel: voltage is the same across each branch." },
      { head: "Ohm's Law rearrangement", body: "V = IR. To find I: I = V/R. To find R: R = V/I. Always check your units." },
    ],
    teacherNotes: "Use the water analogy: voltage = water pressure, current = flow rate, resistance = pipe width. Practical circuits help cement understanding.",
    markScheme: [
      { q: "1", marks: 4, answer: "TRUE: V=IR; FALSE: series same current not voltage; TRUE: ammeter in series; FALSE: parallel same voltage not current", method: "1 mark each" },
      { q: "2", marks: 2, answer: "C — 6Ω", method: "R = V/I = 12/2 = 6Ω" },
      { q: "3", marks: 3, answer: "Gaps: current, voltage, resistance, series", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Circuit diagram labelled correctly", method: "2 marks symbols, 2 marks labels" },
      { q: "5", marks: 4, answer: "Table: 6Ω, 2A, 9V, 4Ω", method: "1 mark per row" },
      { q: "6", marks: 3, answer: "I = 0.5A", method: "I = V/R = 6/12 = 0.5A" },
      { q: "7", marks: 3, answer: "R_total = 15Ω", method: "Series: 5 + 10 = 15Ω" },
      { q: "8", marks: 4, answer: "Parallel: V same, I splits", method: "V = 12V across each; I_1 = 4A, I_2 = 2A" },
      { q: "Challenge", marks: 8, answer: "Full circuit analysis with working", method: "2 marks per correct calculation" },
    ],
    example: {
      question: "A resistor has a resistance of 4Ω and a current of 3A flows through it. Calculate the voltage across it.",
      steps: [
        "Step 1: Write down the formula:   V = IR",
        "Step 2: Identify the known values:   I = 3A,   R = 4Ω",
        "Step 3: Substitute into the formula:   V = 3 × 4",
        "Step 4: Calculate:   V = 12V",
        "Step 5: State the answer with units:   V = 12 volts",
        "",
        "REARRANGING OHM'S LAW:",
        "   To find current:   I = V ÷ R",
        "   To find resistance:   R = V ÷ I",
        "   Memory tip: use the OHM triangle — cover the quantity you want to find",
      ],
    },
    trueFalse: [
      { stmt: "Ohm's Law states that V = IR.", answer: true },
      { stmt: "In a series circuit, the voltage is the same at every point.", answer: false },
      { stmt: "An ammeter is connected in series to measure current.", answer: true },
      { stmt: "In a parallel circuit, the current is the same through each branch.", answer: false },
    ],
    mcqOptions: [
      ["A  2Ω", "B  4Ω", "C  6Ω", "D  8Ω"],
    ],
    mcqQuestion: "A circuit has a voltage of 12V and a current of 2A. What is the resistance?",
    mcqCorrect: 2,
    gapFill: {
      paragraph: "Electric _____ is the flow of charge around a circuit, measured in amperes. _____ is the energy transferred per unit charge, measured in volts. _____ opposes the flow of current and is measured in ohms. In a _____ circuit, the current is the same at every point.",
      wordBank: ["current", "Voltage", "Resistance", "series", "parallel", "power", "charge"],
      answers: ["current", "Voltage", "Resistance", "series"],
    },
    diagram: {
      type: "circuit_diagram",
      labels: ["Battery", "Switch", "Resistor", "Ammeter", "Voltmeter", "Bulb"],
      answers: ["Battery (power source)", "Switch (opens/closes circuit)", "Resistor (limits current)", "Ammeter (measures current)", "Voltmeter (measures voltage)", "Bulb (converts electrical to light energy)"],
    },
    table: {
      headers: ["Voltage (V)", "Current (A)", "Resistance (Ω)"],
      rows: [
        ["12V", "2A", null],
        ["6V", null, "3Ω"],
        [null, "3A", "3Ω"],
        ["16V", "4A", null],
      ],
    },
    guided: [
      { q: "A circuit has a voltage of 6V and a resistance of 12Ω. Calculate the current. Show your working.", a: "I = V/R = 6/12 = 0.5A", marks: 3 },
      { q: "Two resistors of 5Ω and 10Ω are connected in series. What is the total resistance?", a: "R_total = 5 + 10 = 15Ω", marks: 3 },
    ],
    independent: [
      { q: "A bulb has a resistance of 8Ω and a current of 1.5A flows through it. Calculate the voltage across the bulb.", a: "V = IR = 1.5 × 8 = 12V", marks: 3 },
      { q: "In a parallel circuit, two branches have resistances of 3Ω and 6Ω. The supply voltage is 12V. Calculate the current through each branch.", a: "I₁ = 12/3 = 4A; I₂ = 12/6 = 2A", marks: 4 },
      { q: "A student measures a current of 2A through a 5Ω resistor. What voltage is being applied?", a: "V = IR = 2 × 5 = 10V", marks: 3 },
      { q: "Explain the difference between a series and a parallel circuit. Use the words 'current' and 'voltage' in your answer.", a: "Series: same current throughout, voltage shared. Parallel: same voltage across each branch, current splits.", marks: 4 },
    ],
    challenge: "Design a circuit with three resistors (2Ω, 4Ω, 6Ω) — two in parallel and one in series with the parallel combination. The supply voltage is 12V. Calculate: (a) the resistance of the parallel combination, (b) the total resistance, (c) the total current, (d) the voltage across each part.",
    challengeAnswer: "(a) 1/R_p = 1/4 + 1/6 = 5/12, R_p = 2.4Ω (b) R_total = 2 + 2.4 = 4.4Ω (c) I = 12/4.4 = 2.73A (d) V_series = 2.73×2 = 5.45V; V_parallel = 12 − 5.45 = 6.55V",
    extension: "Research superconductors. What happens to resistance at very low temperatures? What practical applications does this have?",
    drawTask: {
      instruction: "Draw a complete series circuit containing: a 6V battery, a switch, a 3Ω resistor, and an ammeter. Use correct circuit symbols. Label all components.",
      requirements: ["All 4 components present", "Correct circuit symbols used", "Components connected in series", "All components labelled"],
      symbolReference: {
        "Battery": "Two parallel lines (long + short)",
        "Switch": "Line with gap and dot",
        "Resistor": "Rectangle",
        "Ammeter": "Circle with A",
      },
    },
    diagramSubQ: {
      type: "circuit_diagram",
      questions: [
        "Label the ammeter and voltmeter on the diagram.",
        "Is this a series or parallel circuit? How can you tell?",
        "If the voltage is 9V and resistance is 3Ω, calculate the current.",
      ],
    },
    ordering: {
      items: ["Identify the known values (V, I, R)", "Choose the correct form of Ohm's Law", "Substitute the values", "Calculate the answer", "State the answer with correct units"],
      correctOrder: [0, 1, 2, 3, 4],
    },
  },

  "forces": {
    title: "Forces — Newton's Laws and Motion",
    objective: "Apply Newton's three laws of motion. Calculate resultant force, acceleration and momentum.",
    priorKnowledge: "Students should know: what a force is; units of force (newtons); speed and velocity; basic equation rearrangement.",
    vocabulary: [
      "Force: a push or pull that can change an object's motion, measured in newtons (N)",
      "Resultant force: the single force that has the same effect as all forces combined",
      "Newton's 1st Law: an object remains at rest or moves at constant velocity unless acted on by a resultant force",
      "Newton's 2nd Law: F = ma — force equals mass times acceleration",
      "Newton's 3rd Law: every action has an equal and opposite reaction",
      "Acceleration: the rate of change of velocity, measured in m/s²",
      "Momentum: mass × velocity, measured in kg m/s",
      "Inertia: the tendency of an object to resist changes in its motion",
    ],
    commonMistakes: [
      { head: "Confusing mass and weight", body: "Mass (kg) is the amount of matter. Weight (N) is the gravitational force on that mass. W = mg." },
      { head: "Newton's 3rd Law pairs", body: "Action-reaction pairs act on DIFFERENT objects — they do NOT cancel each other out." },
      { head: "Direction of forces", body: "Forces are vectors — direction matters. A force of 10N left and 10N right gives a resultant of ZERO." },
    ],
    teacherNotes: "Use free body diagrams throughout. Newton's 3rd Law is commonly misunderstood — stress that the forces act on different objects.",
    markScheme: [
      { q: "1", marks: 4, answer: "TRUE: F=ma; FALSE: 3rd law pairs on different objects; TRUE: resultant zero = constant velocity; FALSE: weight in newtons not kg", method: "1 mark each" },
      { q: "2", marks: 2, answer: "B — 15 m/s²", method: "a = F/m = 30/2 = 15 m/s²" },
      { q: "3", marks: 3, answer: "Gaps: resultant, mass, acceleration, reaction", method: "1 mark per correct gap" },
      { q: "4", marks: 4, answer: "Free body diagram labelled correctly", method: "2 marks forces, 2 marks labels" },
      { q: "5", marks: 4, answer: "Table: 15 m/s², 500N, 3 m/s², 20N", method: "1 mark per row" },
      { q: "6", marks: 3, answer: "a = 2.5 m/s²", method: "a = F/m = 500/200 = 2.5" },
      { q: "7", marks: 3, answer: "p = 1500 kg m/s", method: "p = mv = 1000 × 1.5" },
      { q: "8", marks: 4, answer: "Resultant = 200N right", method: "500 − 300 = 200N" },
      { q: "Challenge", marks: 8, answer: "Full analysis of car braking", method: "2 marks per correct step" },
    ],
    example: {
      question: "A car of mass 1,200 kg accelerates at 3 m/s². Calculate the resultant force.",
      steps: [
        "Step 1: Write Newton's 2nd Law:   F = ma",
        "Step 2: Identify the known values:   m = 1,200 kg,   a = 3 m/s²",
        "Step 3: Substitute:   F = 1,200 × 3",
        "Step 4: Calculate:   F = 3,600 N",
        "Step 5: State with units:   Resultant force = 3,600 N",
        "",
        "REARRANGING F = ma:",
        "   To find acceleration:   a = F ÷ m",
        "   To find mass:   m = F ÷ a",
      ],
    },
    trueFalse: [
      { stmt: "Newton's 2nd Law states that F = ma.", answer: true },
      { stmt: "Newton's 3rd Law pairs act on the same object.", answer: false },
      { stmt: "If the resultant force on an object is zero, it moves at constant velocity.", answer: true },
      { stmt: "Weight is measured in kilograms.", answer: false },
    ],
    mcqOptions: [
      ["A  10 m/s²", "B  15 m/s²", "C  20 m/s²", "D  60 m/s²"],
    ],
    mcqQuestion: "A force of 30N acts on a 2kg object. What is the acceleration?",
    mcqCorrect: 1,
    gapFill: {
      paragraph: "Newton's 2nd Law states that force equals _____ times _____. The _____ force is the single force that represents the combined effect of all forces. Newton's 3rd Law states that every action has an equal and opposite _____.",
      wordBank: ["mass", "acceleration", "resultant", "reaction", "velocity", "momentum", "weight"],
      answers: ["mass", "acceleration", "resultant", "reaction"],
    },
    diagram: {
      type: "free_body_diagram",
      labels: ["Weight (downward)", "Normal reaction (upward)", "Driving force (right)", "Friction (left)"],
      answers: ["Weight (W = mg, downward)", "Normal reaction (N, upward)", "Driving force (F, right)", "Friction (f, left)"],
    },
    table: {
      headers: ["Force (N)", "Mass (kg)", "Acceleration (m/s²)"],
      rows: [
        ["30N", "2kg", null],
        [null, "50kg", "10 m/s²"],
        ["600N", null, "3 m/s²"],
        ["100N", "5kg", null],
      ],
    },
    guided: [
      { q: "A car of mass 200kg has a resultant force of 500N. Calculate its acceleration.", a: "a = F/m = 500/200 = 2.5 m/s²", marks: 3 },
      { q: "A car of mass 1,000kg travels at 1.5 m/s. Calculate its momentum.", a: "p = mv = 1000 × 1.5 = 1500 kg m/s", marks: 3 },
    ],
    independent: [
      { q: "A car has a driving force of 500N and a friction force of 300N. Calculate the resultant force and state its direction.", a: "Resultant = 500 − 300 = 200N in the direction of motion", marks: 3 },
      { q: "A rocket of mass 500kg accelerates at 20 m/s². Calculate the resultant force.", a: "F = ma = 500 × 20 = 10,000N", marks: 3 },
      { q: "Explain Newton's 3rd Law using the example of a swimmer pushing off a wall.", a: "Swimmer pushes wall backward (action); wall pushes swimmer forward (reaction). Forces are equal and opposite but act on different objects.", marks: 4 },
      { q: "A 60kg person stands on scales in a lift accelerating upward at 2 m/s². What is the reading on the scales? (g = 10 m/s²)", a: "F = m(g + a) = 60(10 + 2) = 720N", marks: 4 },
    ],
    challenge: "A car of mass 1,200kg travelling at 20 m/s brakes to a stop in 4 seconds. Calculate: (a) the deceleration, (b) the braking force, (c) the momentum before braking, (d) the impulse. Show all working and state units.",
    challengeAnswer: "(a) a = (20−0)/4 = 5 m/s² (b) F = ma = 1200×5 = 6000N (c) p = mv = 1200×20 = 24,000 kg m/s (d) Impulse = Ft = 6000×4 = 24,000 Ns",
    extension: "Research terminal velocity. Draw a velocity-time graph for a skydiver from jump to landing. Explain each phase of the graph.",
    drawTask: {
      instruction: "Draw a free body diagram for a car travelling at constant velocity on a flat road. Label all four forces acting on the car and indicate their relative sizes.",
      requirements: ["Car drawn", "All 4 forces shown with arrows", "Forces labelled (weight, normal, drive, friction)", "Equal forces shown as equal length arrows"],
      symbolReference: null,
    },
    diagramSubQ: {
      type: "free_body_diagram",
      questions: [
        "How many forces are acting on the object?",
        "What is the resultant force? Explain how you know.",
        "Is the object accelerating? Explain your answer.",
      ],
    },
    ordering: {
      items: ["Identify all forces acting on the object", "Draw a free body diagram", "Calculate the resultant force", "Apply F = ma", "State the answer with units"],
      correctOrder: [0, 1, 2, 3, 4],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

function findTopicData(subject: string, topic: string): any | null {
  const subj = subject.toLowerCase();
  const topicKey = topic.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  if (subj === "maths" || subj === "mathematics") {
    // Direct lookup
    if (mathTopics[topicKey]) return mathTopics[topicKey];
    // Fuzzy lookup
    for (const key of Object.keys(mathTopics)) {
      if (topicKey.includes(key) || key.includes(topicKey)) return mathTopics[key];
    }
    // Expanded topics
    if (typeof expandedMathTopics !== "undefined" && expandedMathTopics) {
      const expanded = (expandedMathTopics as any)[topicKey] || (expandedMathTopics as any)[topic.toLowerCase()];
      if (expanded) return expanded;
    }
    return mathTopics["fractions"]; // fallback
  }

  if (subj === "english" || subj === "english language" || subj === "english literature") {
    if (englishTopics[topicKey]) return englishTopics[topicKey];
    for (const key of Object.keys(englishTopics)) {
      if (topicKey.includes(key) || key.includes(topicKey)) return englishTopics[key];
    }
    return englishTopics["comprehension"]; // fallback
  }

  if (subj === "science" || subj === "physics" || subj === "chemistry" || subj === "biology") {
    if (scienceTopics[topicKey]) return scienceTopics[topicKey];
    for (const key of Object.keys(scienceTopics)) {
      if (topicKey.includes(key) || key.includes(topicKey)) return scienceTopics[key];
    }
    return scienceTopics["electricity"]; // fallback
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT PICKER
// ─────────────────────────────────────────────────────────────────────────────

function pickLayouts(
  sectionName: "recall" | "understanding" | "application",
  count: number,
  isPrimary: boolean,
  yearGroup: string,
  prevLayouts: LayoutFamily[]
): LayoutFamily[] {
  const pool = isPrimary
    ? (yearGroup.toLowerCase().includes("ks1") || yearGroup.toLowerCase().includes("year 1") || yearGroup.toLowerCase().includes("year 2")
        ? PRIMARY_KS1_LAYOUTS
        : PRIMARY_KS2_LAYOUTS)
    : SECTION_LAYOUTS[sectionName];

  const picked: LayoutFamily[] = [];
  let lastLayout: LayoutFamily | null = prevLayouts.length > 0 ? prevLayouts[prevLayouts.length - 1] : null;

  for (let i = 0; i < count; i++) {
    // Filter out the last used layout to avoid adjacency
    const available = pool.filter(l => l !== lastLayout);
    // Prefer layouts not yet used in this section
    const unused = available.filter(l => !picked.includes(l));
    const candidates = unused.length > 0 ? unused : available;
    // Pick randomly from candidates
    const layout = candidates[Math.floor(Math.random() * candidates.length)];
    picked.push(layout);
    lastLayout = layout;
  }

  return picked;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildTrueFalseContent(data: any): string {
  const stmts = data.trueFalse || [];
  let content = "LAYOUT:true_false\n\n";
  content += "**Decide whether each statement is TRUE or FALSE. Circle your answer.**\n\n";
  stmts.forEach((item: any, i: number) => {
    content += `${i + 1}. ${item.stmt}\n`;
    content += `   ○ TRUE     ○ FALSE\n\n`;
  });
  return content;
}

function buildMCQContent(data: any): string {
  const q = data.mcqQuestion || "Select the correct answer.";
  const opts = data.mcqOptions?.[0] || ["A  Option A", "B  Option B", "C  Option C", "D  Option D"];
  let content = "LAYOUT:mcq_2col\n\n";
  content += `**${q}**\n\n`;
  // 2-column layout: A/B on left, C/D on right
  content += `a. ${opts[0]?.replace(/^[A-D]\s+/, "") || opts[0]}\n`;
  content += `b. ${opts[1]?.replace(/^[A-D]\s+/, "") || opts[1]}\n`;
  content += `c. ${opts[2]?.replace(/^[A-D]\s+/, "") || opts[2]}\n`;
  content += `d. ${opts[3]?.replace(/^[A-D]\s+/, "") || opts[3]}\n`;
  return content;
}

function buildGapFillContent(data: any): string {
  const gf = data.gapFill;
  if (!gf) return "LAYOUT:gap_fill_inline\n\nComplete the paragraph by filling in the missing words.\n\n___\n";
  let content = "LAYOUT:gap_fill_inline\n\n";
  content += "**Fill in the gaps using the word bank below.**\n\n";
  content += gf.paragraph + "\n\n";
  content += "**Word Bank:**\n";
  content += gf.wordBank.join("  |  ") + "\n";
  return content;
}

function buildLabelDiagramContent(data: any): string {
  const diag = data.diagram;
  if (!diag) return "LAYOUT:label_diagram\n\nLabel the diagram using the words provided.\n\n";
  let content = "LAYOUT:label_diagram\n\n";
  content += `**Label the diagram below. Use the word bank to help you.**\n\n`;
  content += `DIAGRAM_TYPE:${diag.type}\n\n`;
  content += "**Labels to use:**\n";
  (diag.labels || []).forEach((label: string, i: number) => {
    content += `${i + 1}. ${label.split(":")[0]}\n`;
  });
  return content;
}

function buildTableContent(data: any): string {
  const table = data.table;
  if (!table) return "LAYOUT:table_complete\n\nComplete the table.\n\n";
  let content = "LAYOUT:table_complete\n\n";
  content += "**Complete the table. Show your working where required.**\n\n";
  // Headers
  content += "| " + table.headers.join(" | ") + " |\n";
  content += "| " + table.headers.map(() => "---").join(" | ") + " |\n";
  // Rows
  (table.rows || []).forEach((row: any[]) => {
    const cells = row.map((cell: any) => cell === null ? "___" : String(cell));
    content += "| " + cells.join(" | ") + " |\n";
  });
  return content;
}

function buildDiagramSubQContent(data: any): string {
  const dsq = data.diagramSubQ;
  if (!dsq) return "LAYOUT:diagram_subquestions\n\nRefer to the diagram and answer the questions.\n\n";
  let content = "LAYOUT:diagram_subquestions\n\n";
  content += `DIAGRAM_TYPE:${dsq.type}\n\n`;
  content += "**Use the diagram to answer the following questions.**\n\n";
  (dsq.questions || []).forEach((q: string, i: number) => {
    const letter = String.fromCharCode(97 + i); // a, b, c
    content += `(${letter}) ${q}\n\n`;
    content += `___\n\n`;
  });
  return content;
}

function buildDrawBoxContent(data: any): string {
  const dt = data.drawTask;
  if (!dt) return "LAYOUT:draw_box\n\nDraw your answer in the box below.\n\n";
  let content = "LAYOUT:draw_box\n\n";
  content += `**${dt.instruction}**\n\n`;
  if (dt.requirements && dt.requirements.length > 0) {
    content += "**Your drawing must include:**\n";
    dt.requirements.forEach((req: string) => {
      content += `• ${req}\n`;
    });
    content += "\n";
  }
  if (dt.symbolReference) {
    content += "**Symbol Reference:**\n";
    Object.entries(dt.symbolReference).forEach(([sym, desc]) => {
      content += `• ${sym}: ${desc}\n`;
    });
    content += "\n";
  }
  return content;
}

function buildShortAnswerContent(questions: Array<{q: string, a: string, marks: number}>): string {
  let content = "LAYOUT:short_answer\n\n";
  questions.forEach((item, i) => {
    content += `${i + 1}. ${item.q} [${item.marks} mark${item.marks !== 1 ? "s" : ""}]\n\n`;
    content += `___\n\n`;
  });
  return content;
}

function buildExtendedAnswerContent(questions: Array<{q: string, a: string, marks: number}>): string {
  let content = "LAYOUT:extended_answer\n\n";
  questions.forEach((item, i) => {
    content += `${i + 1}. ${item.q} [${item.marks} mark${item.marks !== 1 ? "s" : ""}]\n\n`;
    content += `___\n\n`;
  });
  return content;
}

function buildMatchingContent(data: any): string {
  const vocab = data.vocabulary || [];
  if (vocab.length < 4) return buildShortAnswerContent([{ q: "Define the key terms for this topic.", a: "", marks: 3 }]);
  let content = "LAYOUT:matching\n\n";
  content += "**Draw a line to match each term to its correct definition.**\n\n";
  // Take first 5 vocab items
  const items = vocab.slice(0, 5);
  const terms = items.map((v: string) => v.split(":")[0].trim());
  const defs = items.map((v: string) => v.split(":").slice(1).join(":").trim());
  // Shuffle definitions
  const shuffledDefs = [...defs].sort(() => Math.random() - 0.5);
  content += "**Terms:**\n";
  terms.forEach((t: string, i: number) => { content += `${i + 1}. ${t}\n`; });
  content += "\n**Definitions:**\n";
  shuffledDefs.forEach((d: string, i: number) => { content += `${String.fromCharCode(65 + i)}. ${d}\n`; });
  return content;
}

function buildOrderingContent(data: any): string {
  const ord = data.ordering;
  if (!ord) return buildShortAnswerContent([{ q: "Put the following steps in the correct order.", a: "", marks: 3 }]);
  let content = "LAYOUT:ordering\n\n";
  content += "**Number the steps 1–" + ord.items.length + " to put them in the correct order.**\n\n";
  // Shuffle items
  const shuffled = [...ord.items].sort(() => Math.random() - 0.5);
  shuffled.forEach((item: string) => {
    content += `___ ${item}\n`;
  });
  return content;
}


// ─────────────────────────────────────────────────────────────────────────────
// SEND ADAPTATIONS
// ─────────────────────────────────────────────────────────────────────────────

function getSendAdaptations(sendNeed: string): string[] {
  const need = (sendNeed || "").toLowerCase().replace(/[^a-z0-9]/g, "-");
  const map: Record<string, string[]> = {
    "dyslexia": [
      "Font enlarged to 14pt with 1.5× line spacing",
      "Sentence starters provided for extended writing",
      "Word bank included for all gap-fill activities",
      "Questions broken into smaller steps",
    ],
    "dyscalculia": [
      "Number line and multiplication grid provided",
      "Step-by-step scaffolding for all calculations",
      "Visual representations alongside numerical problems",
      "Calculator permitted for multi-step problems",
    ],
    "adhd": [
      "Tasks broken into short, clearly numbered steps",
      "Visual timers suggested (5–10 min per section)",
      "Fidget breaks built into self-reflection section",
      "Reduced question density per page",
    ],
    "autism": [
      "Clear, literal language used throughout",
      "Explicit instructions for every task type",
      "Consistent layout and formatting",
      "Predictable structure with clear section headings",
    ],
    "esl": [
      "Key vocabulary defined with visual examples",
      "Sentence frames provided for written responses",
      "Simplified language in question stems",
      "Bilingual glossary available on request",
    ],
    "visual-impairment": [
      "Large print format (16pt minimum)",
      "High contrast black and white layout",
      "Diagrams described in text",
      "Braille version available on request",
    ],
    "hearing-impairment": [
      "All instructions in written form",
      "No audio-dependent activities",
      "Visual cues used throughout",
      "BSL glossary available on request",
    ],
    "mld": [
      "Simplified language and shorter sentences",
      "Visual support for all key concepts",
      "Worked examples for every question type",
      "Additional scaffolding and sentence starters",
    ],
    "sld": [
      "Highly simplified language",
      "Symbol support available",
      "One task per page",
      "Adult support recommended",
    ],
    "gifted": [
      "Extended challenge questions included",
      "Open-ended investigation tasks",
      "Cross-curricular connections highlighted",
      "Independent research extension tasks",
    ],
  };

  for (const key of Object.keys(map)) {
    if (need.includes(key) || key.includes(need)) return map[key];
  }
  return [
    "Adapted for individual learning needs",
    "Additional support available from class teacher",
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export async function generateWorksheet(params: WorksheetParams): Promise<GeneratedWorksheet> {
  const { subject, topic, yearGroup, sendNeed, difficulty, examBoard, includeAnswers, additionalInstructions } = params;

  // Detect primary school
  const yg = yearGroup.toLowerCase();
  const isPrimary = yg.includes("reception") || yg.includes("year 1") || yg.includes("year 2") ||
    yg.includes("year 3") || yg.includes("year 4") || yg.includes("year 5") || yg.includes("year 6") ||
    yg.includes("ks1") || yg.includes("ks2") || yg.includes("primary");

  // Find topic data
  const data = findTopicData(subject, topic);

  // Build worksheet title
  const subjectDisplay = subject.charAt(0).toUpperCase() + subject.slice(1);
  const worksheetTitle = data?.title || `${subjectDisplay}: ${topic}`;

  // Subtitle line
  const examBoardStr = examBoard ? ` | ${examBoard}` : "";
  const diffStr = difficulty === "foundation" ? " | Foundation" : difficulty === "higher" ? " | Higher" : "";
  const worksheetSubtitle = `${subjectDisplay} | ${yearGroup}${examBoardStr}${diffStr} | GCSE`;

  // ── SECTIONS ARRAY ──────────────────────────────────────────────────────────
  const sections: WorksheetSection[] = [];

  // ── 1. LEARNING OBJECTIVE ──────────────────────────────────────────────────
  sections.push({
    title: "Learning Objective",
    type: "objective",
    content: data?.objective || `Understand and apply key concepts in ${topic}.`,
  });

  // ── 2. PRIOR KNOWLEDGE ────────────────────────────────────────────────────
  if (data?.priorKnowledge) {
    sections.push({
      title: "Prior Knowledge",
      type: "prior-knowledge",
      content: data.priorKnowledge,
    });
  }

  // ── 3. KEY VOCABULARY ─────────────────────────────────────────────────────
  const vocabItems = data?.vocabulary || [];
  if (vocabItems.length > 0) {
    sections.push({
      title: "Key Vocabulary",
      type: "vocabulary",
      content: vocabItems.join("\n"),
    });
  }

  // ── 4. COMMON MISTAKES TO AVOID ───────────────────────────────────────────
  const mistakes = data?.commonMistakes || [];
  if (mistakes.length > 0) {
    let mistakesContent = "";
    mistakes.forEach((m: any) => {
      mistakesContent += `✗ **${m.head}**\n→ ${m.body}\n\n`;
    });
    sections.push({
      title: "Common Mistakes to Avoid",
      type: "misconceptions",
      content: mistakesContent.trim(),
    });
  }

  // ── 5. WORKED EXAMPLE ─────────────────────────────────────────────────────
  if (data?.example) {
    const ex = data.example;
    let exContent = `**Question:** ${ex.question}\n\n`;
    ex.steps.forEach((step: string) => {
      exContent += `${step}\n`;
    });
    sections.push({
      title: "Worked Example",
      type: "example",
      content: exContent.trim(),
    });
  }

  // ── LAYOUT PLANNING ────────────────────────────────────────────────────────
  // Pick layouts for each section ensuring variety and no adjacency repeats
  const allLayouts: LayoutFamily[] = [];

  const recallLayouts = pickLayouts("recall", 3, isPrimary, yearGroup, allLayouts);
  allLayouts.push(...recallLayouts);

  const understandingLayouts = pickLayouts("understanding", 3, isPrimary, yearGroup, allLayouts);
  allLayouts.push(...understandingLayouts);

  const applicationLayouts = pickLayouts("application", 3, isPrimary, yearGroup, allLayouts);
  allLayouts.push(...applicationLayouts);

  // Ensure at least 2 diagram layouts in secondary worksheets
  if (!isPrimary) {
    const diagramCount = allLayouts.filter(l => DIAGRAM_LAYOUTS.has(l)).length;
    if (diagramCount < 2) {
      // Replace one non-diagram layout in understanding with a diagram layout
      for (let i = 0; i < understandingLayouts.length; i++) {
        if (!DIAGRAM_LAYOUTS.has(understandingLayouts[i])) {
          understandingLayouts[i] = "label_diagram";
          break;
        }
      }
    }
  }

  // ── 6. SECTION 1: RECALL ──────────────────────────────────────────────────
  let questionNumber = 1;
  const recallSections: WorksheetSection[] = [];

  for (let i = 0; i < 3; i++) {
    const layout = recallLayouts[i];
    let content = "";
    let marks = MARKS_RANGE[layout][0] + Math.floor(Math.random() * (MARKS_RANGE[layout][1] - MARKS_RANGE[layout][0] + 1));
    marks = Math.max(MARKS_RANGE[layout][0], Math.min(MARKS_RANGE[layout][1], marks));

    switch (layout) {
      case "true_false":
        content = buildTrueFalseContent(data);
        marks = (data?.trueFalse?.length || 4);
        break;
      case "mcq_2col":
        content = buildMCQContent(data);
        marks = 2;
        break;
      case "gap_fill_inline":
        content = buildGapFillContent(data);
        marks = data?.gapFill?.answers?.length || 4;
        break;
      case "matching":
        content = buildMatchingContent(data);
        marks = Math.min(5, data?.vocabulary?.length || 4);
        break;
      case "ordering":
        content = buildOrderingContent(data);
        marks = data?.ordering?.items?.length || 4;
        break;
      case "short_answer":
        content = buildShortAnswerContent(data?.guided?.slice(0, 2) || [
          { q: `State two key facts about ${topic}.`, a: "", marks: 2 },
          { q: `Define the main term used in ${topic}.`, a: "", marks: 2 },
        ]);
        marks = 4;
        break;
      default:
        content = buildTrueFalseContent(data);
        marks = 4;
    }

    recallSections.push({
      title: `Question ${questionNumber}`,
      type: "recall",
      content,
    });
    questionNumber++;
  }

  sections.push({
    title: "Section 1: Recall",
    type: "recall",
    content: "**Answer all questions in this section.** These questions test your knowledge and memory of the topic.",
  });
  sections.push(...recallSections);

  // ── 7. SECTION 2: UNDERSTANDING ──────────────────────────────────────────
  const understandingSections: WorksheetSection[] = [];

  for (let i = 0; i < 3; i++) {
    const layout = understandingLayouts[i];
    let content = "";

    switch (layout) {
      case "label_diagram":
        content = buildLabelDiagramContent(data);
        break;
      case "diagram_subquestions":
        content = buildDiagramSubQContent(data);
        break;
      case "table_complete":
        content = buildTableContent(data);
        break;
      case "gap_fill_inline":
        content = buildGapFillContent(data);
        break;
      case "short_answer":
        content = buildShortAnswerContent(data?.guided?.slice(0, 2) || [
          { q: `Explain how ${topic} works in your own words.`, a: "", marks: 3 },
          { q: `Give an example of ${topic} in a real-world context.`, a: "", marks: 3 },
        ]);
        break;
      case "mcq_2col":
        content = buildMCQContent(data);
        break;
      default:
        content = buildLabelDiagramContent(data);
    }

    understandingSections.push({
      title: `Question ${questionNumber}`,
      type: "understanding",
      content,
    });
    questionNumber++;
  }

  sections.push({
    title: "Section 2: Understanding",
    type: "understanding",
    content: "**Answer all questions in this section.** These questions test your understanding and ability to apply the topic.",
  });
  sections.push(...understandingSections);

  // ── 8. SECTION 3: APPLICATION & ANALYSIS ─────────────────────────────────
  const applicationSections: WorksheetSection[] = [];

  for (let i = 0; i < 3; i++) {
    const layout = applicationLayouts[i];
    let content = "";

    switch (layout) {
      case "short_answer":
        content = buildShortAnswerContent(data?.independent?.slice(i * 1, i * 1 + 2) || [
          { q: `Apply your knowledge of ${topic} to solve a problem.`, a: "", marks: 4 },
          { q: `Analyse the following scenario using ${topic}.`, a: "", marks: 4 },
        ]);
        break;
      case "extended_answer":
        content = buildExtendedAnswerContent(data?.independent?.slice(i * 1, i * 1 + 1) || [
          { q: `Explain and evaluate the key concepts of ${topic}. Use examples to support your answer.`, a: "", marks: 6 },
        ]);
        break;
      case "diagram_subquestions":
        content = buildDiagramSubQContent(data);
        break;
      case "table_complete":
        content = buildTableContent(data);
        break;
      case "draw_box":
        content = buildDrawBoxContent(data);
        break;
      default:
        content = buildShortAnswerContent(data?.independent?.slice(0, 2) || [
          { q: `Apply your knowledge of ${topic}.`, a: "", marks: 4 },
        ]);
    }

    applicationSections.push({
      title: `Question ${questionNumber}`,
      type: "application",
      content,
    });
    questionNumber++;
  }

  sections.push({
    title: "Section 3: Application & Analysis",
    type: "application",
    content: "**Answer all questions in this section.** These questions require you to apply and analyse your knowledge.",
  });
  sections.push(...applicationSections);

  // ── 9. CHALLENGE QUESTION ─────────────────────────────────────────────────
  const challengeContent = data?.challenge
    ? `LAYOUT:extended_answer\n\n**★ Challenge Question** [8 marks]\n\n${data.challenge}\n\n___`
    : `LAYOUT:extended_answer\n\n**★ Challenge Question** [8 marks]\n\nUsing everything you have learned about ${topic}, write an extended response that demonstrates your deepest understanding. Include examples, calculations or analysis as appropriate.\n\n___`;

  sections.push({
    title: "★ Challenge Question",
    type: "challenge",
    content: challengeContent,
  });

  // ── 10. SELF REFLECTION ───────────────────────────────────────────────────
  const selfReflectionContent = `**How confident are you with each skill?**\n\nRate yourself: ○ Not yet  ○ Getting there  ○ Confident  ○ I could teach it!\n\n` +
    (data?.vocabulary?.slice(0, 5) || [`Understanding ${topic}`]).map((v: string, i: number) =>
      `${i + 1}. ${v.split(":")[0].trim()}\n   ○ Not yet  ○ Getting there  ○ Confident  ○ I could teach it!`
    ).join("\n\n") +
    `\n\n**What went well?**\n___\n\n**What do I need to practise more?**\n___\n\n**Exit Ticket:** Write one thing you learned today in one sentence.\n___`;

  sections.push({
    title: "Self Reflection",
    type: "self-reflection",
    content: selfReflectionContent,
  });

  // ── 11. TEACHER COPY ──────────────────────────────────────────────────────
  if (includeAnswers) {
    // Teacher Notes
    if (data?.teacherNotes) {
      sections.push({
        title: "Teacher Notes",
        type: "teacher-notes",
        content: data.teacherNotes,
        teacherOnly: true,
      });
    }

    // Mark Scheme
    if (data?.markScheme) {
      let msContent = "**MARK SCHEME — TEACHER COPY**\n\n";
      msContent += "| Question | Marks | Answer | Method |\n";
      msContent += "| --- | --- | --- | --- |\n";
      data.markScheme.forEach((row: any) => {
        msContent += `| Q${row.q} | ${row.marks} | ${row.answer} | ${row.method || ""} |\n`;
      });
      const totalMarks = data.markScheme.reduce((sum: number, row: any) => sum + (row.marks || 0), 0);
      msContent += `\n**Total Marks: ${totalMarks}**`;

      sections.push({
        title: "Mark Scheme",
        type: "mark-scheme",
        content: msContent,
        teacherOnly: true,
      });
    }

    // Answer Key
    const answerContent = buildAnswerKey(data, recallLayouts, understandingLayouts, applicationLayouts);
    sections.push({
      title: "Answer Key",
      type: "answers",
      content: answerContent,
      teacherOnly: true,
    });

    // Extension
    if (data?.extension) {
      sections.push({
        title: "Extension Task",
        type: "extension",
        content: data.extension,
        teacherOnly: true,
      });
    }
  }

  // ── SEND ADAPTATIONS ──────────────────────────────────────────────────────
  const adaptations = sendNeed ? getSendAdaptations(sendNeed) : [];

  // ── CALCULATE TOTAL MARKS ─────────────────────────────────────────────────
  const totalMarks = data?.markScheme
    ? data.markScheme.reduce((sum: number, row: any) => sum + (row.marks || 0), 0)
    : 40;

  // ── ESTIMATED TIME ────────────────────────────────────────────────────────
  const estimatedTime = isPrimary ? "30–40 minutes" : "50–60 minutes";

  return {
    title: worksheetTitle,
    subtitle: worksheetSubtitle,
    sections,
    metadata: {
      subject,
      topic,
      yearGroup,
      sendNeed,
      difficulty,
      examBoard,
      adaptations,
      totalMarks,
      estimatedTime,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ANSWER KEY BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildAnswerKey(
  data: any,
  recallLayouts: LayoutFamily[],
  understandingLayouts: LayoutFamily[],
  applicationLayouts: LayoutFamily[]
): string {
  if (!data) return "Answers not available for this topic.";

  let content = "**ANSWER KEY — TEACHER COPY ONLY**\n\n";

  // Section 1 Recall answers
  content += "**SECTION 1: RECALL**\n\n";
  recallLayouts.forEach((layout, i) => {
    content += `Q${i + 1} (${layout.replace(/_/g, " ")}):\n`;
    switch (layout) {
      case "true_false":
        (data.trueFalse || []).forEach((item: any, j: number) => {
          content += `  ${j + 1}. ${item.answer ? "TRUE" : "FALSE"}\n`;
        });
        break;
      case "mcq_2col":
        const correct = data.mcqOptions?.[0]?.[data.mcqCorrect || 0] || "B";
        content += `  Answer: ${correct}\n`;
        break;
      case "gap_fill_inline":
        (data.gapFill?.answers || []).forEach((ans: string, j: number) => {
          content += `  Gap ${j + 1}: ${ans}\n`;
        });
        break;
      case "matching":
        (data.vocabulary || []).slice(0, 5).forEach((v: string, j: number) => {
          const [term, def] = v.split(":");
          content += `  ${j + 1}. ${term.trim()} → ${def?.trim() || ""}\n`;
        });
        break;
      case "ordering":
        content += `  Correct order: ${(data.ordering?.correctOrder || []).map((n: number) => n + 1).join(" → ")}\n`;
        break;
      default:
        content += `  See mark scheme for full answers.\n`;
    }
    content += "\n";
  });

  // Section 2 Understanding answers
  content += "**SECTION 2: UNDERSTANDING**\n\n";
  understandingLayouts.forEach((layout, i) => {
    content += `Q${i + 4} (${layout.replace(/_/g, " ")}):\n`;
    switch (layout) {
      case "label_diagram":
        (data.diagram?.answers || data.diagram?.labels || []).forEach((label: string, j: number) => {
          content += `  ${j + 1}. ${label}\n`;
        });
        break;
      case "table_complete":
        content += `  See mark scheme for table answers.\n`;
        break;
      case "diagram_subquestions":
        (data.diagramSubQ?.questions || []).forEach((q: string, j: number) => {
          content += `  (${String.fromCharCode(97 + j)}) See mark scheme.\n`;
        });
        break;
      default:
        content += `  See mark scheme for full answers.\n`;
    }
    content += "\n";
  });

  // Section 3 Application answers
  content += "**SECTION 3: APPLICATION & ANALYSIS**\n\n";
  applicationLayouts.forEach((layout, i) => {
    content += `Q${i + 7} (${layout.replace(/_/g, " ")}):\n`;
    const ind = data.independent || [];
    if (ind[i]) {
      content += `  ${ind[i].a}\n`;
    } else {
      content += `  See mark scheme for full answers.\n`;
    }
    content += "\n";
  });

  // Challenge answer
  content += "**CHALLENGE QUESTION:**\n";
  content += data.challengeAnswer || "See mark scheme for full answer.\n";
  content += "\n";

  return content;
}

// ─────────────────────────────────────────────────────────────────────────────
// DIFFERENTIATE WORKSHEET (used by the Differentiate button)
// ─────────────────────────────────────────────────────────────────────────────

export async function differentiateWorksheet(
  worksheet: GeneratedWorksheet,
  targetDifficulty: "foundation" | "higher",
  sendNeed?: string
): Promise<GeneratedWorksheet> {
  // Clone the worksheet
  const newWorksheet = JSON.parse(JSON.stringify(worksheet)) as GeneratedWorksheet;

  // Update metadata
  newWorksheet.metadata.difficulty = targetDifficulty;
  if (sendNeed) {
    newWorksheet.metadata.sendNeed = sendNeed;
    newWorksheet.metadata.adaptations = getSendAdaptations(sendNeed);
  }

  // Update subtitle
  const diffStr = targetDifficulty === "foundation" ? " | Foundation" : " | Higher";
  newWorksheet.subtitle = newWorksheet.subtitle.replace(/\s*\|\s*(Foundation|Higher)/, "") + diffStr;

  // For foundation: add scaffolding to challenge and application sections
  if (targetDifficulty === "foundation") {
    newWorksheet.sections = newWorksheet.sections.map(section => {
      if (section.type === "challenge") {
        return {
          ...section,
          content: section.content + "\n\n**Scaffolding:**\n• Break the problem into steps\n• Show all your working\n• Use the worked example to help you",
        };
      }
      if (section.type === "application") {
        return {
          ...section,
          content: section.content + "\n\n**Hint:** Refer back to the worked example if you need help.",
        };
      }
      return section;
    });
  }

  // For higher: add extension prompts
  if (targetDifficulty === "higher") {
    newWorksheet.sections = newWorksheet.sections.map(section => {
      if (section.type === "challenge") {
        return {
          ...section,
          content: section.content + "\n\n**Extension:** Can you generalise your answer? What would happen if the values changed?",
        };
      }
      return section;
    });
  }

  return newWorksheet;
}

// ─────────────────────────────────────────────────────────────────────────────
// REVISION MAT GENERATOR (used by the Revision Mat button)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateRevisionMat(params: WorksheetParams): Promise<GeneratedWorksheet> {
  const base = await generateWorksheet({ ...params, includeAnswers: false });

  // Mark as revision mat
  (base.metadata as any).isRevisionMat = true;

  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY WORKSHEET GENERATOR (for primary narrative worksheets)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStoryWorksheet(params: WorksheetParams): Promise<GeneratedWorksheet> {
  return generateWorksheet(params);
}

// Default export
export default generateWorksheet;

// ─────────────────────────────────────────────────────────────────────────────
// STORY CONTENT GENERATOR (local fallback for Stories page)
// ─────────────────────────────────────────────────────────────────────────────

export function generateStoryContent(params: {
  genre: string;
  yearGroup: string;
  sendNeed?: string;
  characters: string[];
  setting?: string;
  theme?: string;
  readingLevel: string;
  length: string;
}): { title: string; content: string } {
  const { genre, characters, setting, theme, length } = params;
  const charNames = characters.length > 0 ? characters : ["Alex", "Sam"];
  const storyTitle = getStoryTitle(genre, charNames);
  const storyContent = buildStory(genre, charNames, setting, theme, length);
  return { title: storyTitle, content: storyContent };
}

function getStoryTitle(genre: string, characters: string[]): string {
  const titles: Record<string, string[]> = {
    adventure: [`${characters[0]}'s Great Adventure`, `The Quest of ${characters[0]}`],
    fantasy: [`${characters[0]} and the Enchanted Kingdom`, `The Magic of ${characters[0]}`],
    mystery: [`The Mystery of the Missing Key`, `${characters[0]}: Detective for a Day`],
    "sci-fi": [`${characters[0]} and the Space Station`, `Journey to Planet Zara`],
    historical: [`${characters[0]} in Ancient Times`, `The Time Traveller's Secret`],
    comedy: [`The Funniest Day Ever`, `${characters[0]}'s Hilarious Mix-Up`],
    animal: [`${characters[0]} and the Talking Animals`, `The Secret Animal Club`],
    "fairy-tale": [`${characters[0]} and the Three Wishes`, `The Enchanted Forest`],
    realistic: [`${characters[0]}'s New Beginning`, `The Big Move`],
    superhero: [`${characters[0]}: The Unlikely Hero`, `Super ${characters[0]}`],
    spooky: [`The Haunted School`, `${characters[0]} and the Ghost of Room 13`],
    sports: [`${characters[0]}'s Big Match`, `The Championship Dream`],
  };
  const options = titles[genre] || [`${characters[0]}'s Story`];
  return options[Math.floor(Math.random() * options.length)];
}

function buildStory(genre: string, characters: string[], setting?: string, theme?: string, length?: string): string {
  const loc = setting || getDefaultSetting(genre);
  const th = theme || "friendship";
  const charStr = characters.join(" and ");
  const wordTarget = length === "short" ? 500 : length === "long" ? 1800 : 1000;

  let story = `# ${getStoryTitle(genre, characters)}\n\n`;
  story += `## Chapter 1: The Beginning\n\n`;
  story += `${charStr} had always known that ${loc} held secrets. But nothing could have prepared them for what was about to happen on this particular ${getDayDescription(genre)}.\n\n`;
  story += `${characters[0]} stood at the ${getStartLocation(loc)}, heart pounding with a mixture of excitement and nervousness. "${getOpeningDialogue(genre)}" ${characters[0]} whispered, clutching ${getItem(genre)} tightly.\n\n`;

  if (characters.length > 1) {
    story += `${characters[1]} appeared beside them, eyes wide with ${getEmotion(genre)}. "Are you sure about this?" ${characters[1]} asked, glancing around ${getGlanceDescription(loc)}.\n\n`;
    story += `"We have to," ${characters[0]} replied firmly. "It's about ${th}."\n\n`;
  }

  story += `## Chapter 2: The Discovery\n\n`;
  story += getMiddleContent(genre, characters, loc, th);

  if (wordTarget > 500) {
    story += `\n\n## Chapter 3: The Challenge\n\n`;
    story += getChallengeContent(genre, characters, loc, th);
  }

  if (wordTarget > 1000) {
    story += `\n\n## Chapter 4: The Turning Point\n\n`;
    story += getTurningPoint(characters, loc, th);
  }

  story += `\n\n## ${wordTarget > 1000 ? "Chapter 5" : wordTarget > 500 ? "Chapter 4" : "Chapter 3"}: The Resolution\n\n`;
  story += getEnding(genre, characters, loc, th);

  return story;
}

function getDefaultSetting(genre: string): string {
  const settings: Record<string, string> = {
    adventure: "the ancient forest beyond the village",
    fantasy: "the enchanted kingdom of Luminos",
    mystery: "the old Victorian school",
    "sci-fi": "the orbiting space station Artemis",
    historical: "the bustling streets of medieval London",
    comedy: "the chaotic school canteen",
    animal: "the peaceful meadow by the river",
    "fairy-tale": "the magical forest of Evergreen",
    realistic: "the new neighbourhood",
    superhero: "the busy city centre",
    spooky: "the abandoned mansion on the hill",
    sports: "the local football pitch",
  };
  return settings[genre] || "the school";
}

function getDayDescription(genre: string): string {
  const days: Record<string, string> = {
    adventure: "misty morning", fantasy: "moonlit evening", mystery: "foggy afternoon",
    "sci-fi": "zero-gravity morning", historical: "cold winter's day", comedy: "absolutely bonkers Tuesday",
    animal: "sunny spring morning", "fairy-tale": "enchanted twilight", realistic: "ordinary Monday",
    superhero: "seemingly normal Wednesday", spooky: "dark and stormy night", sports: "match day Saturday",
  };
  return days[genre] || "Tuesday morning";
}

function getStartLocation(setting: string): string {
  return `entrance to ${setting}`;
}

function getOpeningDialogue(genre: string): string {
  const dialogues: Record<string, string> = {
    adventure: "This is it. There's no turning back now.",
    fantasy: "I can feel the magic already...",
    mystery: "Something doesn't add up here.",
    "sci-fi": "Systems are online. Let's do this.",
    historical: "If only they could see us now.",
    comedy: "What could possibly go wrong?",
    animal: "Did that squirrel just wave at me?",
    "fairy-tale": "Once upon a time starts right here.",
    realistic: "New place, new start.",
    superhero: "The city needs us.",
    spooky: "Did you hear that?",
    sports: "This is our moment.",
  };
  return dialogues[genre] || "Here we go.";
}

function getItem(genre: string): string {
  const items: Record<string, string> = {
    adventure: "an old compass", fantasy: "a glowing crystal", mystery: "a magnifying glass",
    "sci-fi": "a holographic map", historical: "a worn leather journal", comedy: "a rubber chicken",
    animal: "a bag of treats", "fairy-tale": "a golden key", realistic: "a well-worn notebook",
    superhero: "a mysterious device", spooky: "a flickering torch", sports: "their lucky boots",
  };
  return items[genre] || "a small bag";
}

function getEmotion(genre: string): string {
  const emotions: Record<string, string> = {
    adventure: "anticipation", fantasy: "wonder", mystery: "suspicion",
    "sci-fi": "determination", historical: "curiosity", comedy: "barely contained laughter",
    animal: "delight", "fairy-tale": "awe", realistic: "uncertainty",
    superhero: "resolve", spooky: "fear", sports: "nervous energy",
  };
  return emotions[genre] || "excitement";
}

function getGlanceDescription(setting: string): string {
  return `at the shadows of ${setting}`;
}

function getMiddleContent(genre: string, characters: string[], setting: string, theme: string): string {
  return `As they ventured deeper into ${setting}, ${characters[0]} noticed something extraordinary. The path ahead split into two directions, each one seeming to call out with its own promise and danger.\n\n"Look at this!" ${characters[0]} exclaimed, pointing at ${genre === "mystery" ? "a set of unusual footprints" : genre === "fantasy" ? "a shimmering portal" : genre === "sci-fi" ? "an alien signal on the scanner" : "something remarkable"} that had appeared seemingly from nowhere.\n\nThe discovery changed everything. What had started as ${genre === "comedy" ? "a ridiculous misunderstanding" : "a simple journey"} was now becoming something far more significant. ${characters[0]} felt a surge of determination — this was about more than just ${theme}. This was about proving that even the most unexpected person could make a real difference.\n\n${characters.length > 1 ? `${characters[1]} studied the discovery carefully. "I think I understand," ${characters[1]} said slowly. "This means we need to work together. Neither of us can do this alone."\n\nIt was in that moment that the true meaning of ${theme} became clear to both of them.` : `Standing alone, ${characters[0]} realised that true ${theme} sometimes meant facing challenges head-on, even when nobody else was watching.`}`;
}

function getChallengeContent(genre: string, characters: string[], setting: string, theme: string): string {
  return `The challenge was greater than either of them had imagined. ${genre === "spooky" ? "Strange sounds echoed through the corridors" : genre === "adventure" ? "The terrain became treacherous and unpredictable" : genre === "sports" ? "The opposing team was stronger than expected" : "Obstacles appeared at every turn"}, testing their resolve at every step.\n\n${characters[0]} stumbled, nearly giving up. "I can't do this," they muttered, frustration building like a storm.\n\nBut then — a moment of clarity. Everything they had learned, every challenge they had faced, had been preparing them for exactly this. ${characters[0]} took a deep breath and tried again.\n\n${characters.length > 1 ? `"You can do it," ${characters[1]} said quietly. "I believe in you."\n\nThose words were all ${characters[0]} needed.` : `Sometimes, believing in yourself is the hardest thing of all. But ${characters[0]} found that belief, buried deep inside, waiting to be discovered.`}`;
}

function getTurningPoint(characters: string[], setting: string, theme: string): string {
  return `Everything changed in an instant. What had seemed impossible suddenly became clear — the answer had been there all along, hidden in plain sight.\n\n${characters[0]} looked around at ${setting} with new eyes. The fear that had gripped them began to loosen its hold. In its place grew something stronger: purpose.\n\n"I know what we have to do," ${characters[0]} said, voice steady for the first time. They explained the plan — bold, risky, but exactly right.\n\n${characters.length > 1 ? `${characters[1]} listened carefully, then nodded. "It's brilliant," they said. "Completely mad — but brilliant."\n\nTogether, they prepared for the final challenge.` : `It would not be easy. Nothing worth doing ever was. But ${characters[0]} was ready.`}`;
}

function getEnding(genre: string, characters: string[], setting: string, theme: string): string {
  return `When it was all over, ${characters[0]} stood quietly in ${setting}, taking in everything that had happened. The world looked different now — not because it had changed, but because they had.\n\n${genre === "mystery" ? "The mystery had been solved, the truth finally revealed." : genre === "adventure" ? "The adventure had been everything they had hoped for — and more." : genre === "sports" ? "Win or lose, they had given everything. That was what mattered." : genre === "spooky" ? "The ghost was gone, the secret buried once more." : "The journey had come to an end, but the memories would last forever."}\n\n${characters.length > 1 ? `${characters[1]} smiled. "We did it," they said simply.\n\n"We did," ${characters[0]} agreed. "Together."\n\nAnd that, more than anything else, was what ${theme} truly meant.` : `${characters[0]} smiled to themselves. They had done it. Not because it was easy, but because they had refused to give up.\n\nAnd that made all the difference.`}\n\n*The End*`;
}
