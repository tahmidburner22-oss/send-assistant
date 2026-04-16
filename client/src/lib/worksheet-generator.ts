import { sendNeeds, examBoards } from "./send-data";
import { expandedMathTopics } from './mathTopicsExpanded';

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
  type: "objective" | "vocabulary" | "example" | "guided" | "independent" | "challenge" | "answers" | "adaptations" | "review" | "teacher-notes" | "mark-scheme" | "extension" | "prior-knowledge";
  content: string;
  teacherOnly?: boolean;
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
// MATHEMATICS TOPICS (Maths Genie / TES style)
// ─────────────────────────────────────────────────────────────────────────────
const mathTopics: Record<string, any> = {
  "fractions": {
    title: "Fractions — Adding, Subtracting, Multiplying and Dividing",
    objective: "Add, subtract, multiply and divide fractions, including mixed numbers. Simplify answers to their lowest terms.",
    priorKnowledge: "Students should be able to: identify numerators and denominators; find common multiples; simplify fractions by dividing by the HCF.",
    vocabulary: ["Numerator", "Denominator", "Equivalent fraction", "Common denominator", "Simplify", "Lowest common multiple (LCM)", "Mixed number", "Improper fraction", "Reciprocal"],
    teacherNotes: "Use fraction walls or bar models to support visual learners. Encourage students to always simplify final answers. For SEND students, provide a multiplication grid and a list of common LCMs. Common misconception: students add denominators when adding fractions — address this explicitly with the modelled example. Suggested lesson structure: 10 min recap equivalent fractions, 15 min guided practice, 20 min independent, 5 min plenary.",
    markScheme: [
      { q: "1.1", marks: 1, answer: "9/12", method: "Multiply numerator and denominator by 3" },
      { q: "1.2", marks: 2, answer: "5/12", method: "LCD = 12; 3/12 + 2/12 = 5/12" },
      { q: "1.3", marks: 2, answer: "5/8", method: "LCD = 8; 3/8 + 2/8 = 5/8" },
      { q: "2.1", marks: 2, answer: "13/15", method: "LCD = 15; 10/15 + 3/15" },
      { q: "2.2", marks: 2, answer: "7/12", method: "LCD = 12; 10/12 - 3/12" },
      { q: "2.3", marks: 3, answer: "23/21 = 1 2/21", method: "LCD = 21; 9/21 + 14/21" },
      { q: "2.4", marks: 3, answer: "11/40", method: "LCD = 40; 35/40 - 24/40" },
      { q: "2.5", marks: 2, answer: "11/12 cup", method: "LCD = 12; 8/12 + 3/12" },
      { q: "2.6", marks: 3, answer: "5/24", method: "LCD = 24; 9/24 - 4/24" },
      { q: "3.1", marks: 2, answer: "3/10", method: "Multiply numerators, multiply denominators: 1×3 / 2×5" },
      { q: "3.2", marks: 2, answer: "8/3 = 2 2/3", method: "Multiply by reciprocal: 4/1 × 2/3" },
      { q: "Challenge", marks: 4, answer: "7/24", method: "5/8 - 1/3 = 15/24 - 8/24 = 7/24" },
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
        "Answer: 11/15"
      ]
    },
    guided: [
      { q: "1.1  Convert 3/4 to twelfths.    3/4 = ___/12", a: "9/12", marks: 1 },
      { q: "1.2  Calculate 1/4 + 1/6.   Show your working. (LCD = ___)", a: "5/12", marks: 2 },
      { q: "1.3  Calculate 3/8 + 1/4.   Hint: What is the LCD of 8 and 4?", a: "5/8", marks: 2 },
    ],
    independent: [
      { q: "2.1  Calculate 2/3 + 1/5", a: "13/15", marks: 2 },
      { q: "2.2  Calculate 5/6 − 1/4", a: "7/12", marks: 2 },
      { q: "2.3  Calculate 3/7 + 2/3.   Give your answer as a mixed number.", a: "23/21 = 1 2/21", marks: 3 },
      { q: "2.4  Calculate 7/8 − 3/5", a: "11/40", marks: 3 },
      { q: "2.5  A recipe needs 2/3 cup of flour and 1/4 cup of sugar. How much is that in total?", a: "11/12 cup", marks: 2 },
      { q: "2.6  Sarah ate 3/8 of a pizza. Tom ate 1/6. How much more did Sarah eat than Tom?", a: "5/24", marks: 3 },
      { q: "3.1  Calculate 1/2 × 3/5   (Multiply the numerators together, then the denominators)", a: "3/10", marks: 2 },
      { q: "3.2  Calculate 4 ÷ 3/2   (Hint: dividing by a fraction = multiply by its reciprocal)", a: "8/3 = 2 2/3", marks: 2 },
    ],
    challenge: "A water tank is 5/8 full. After using 1/3 of the total capacity for irrigation, what fraction of the tank remains? Show all your working clearly.",
    challengeAnswer: "5/8 − 1/3 = 15/24 − 8/24 = 7/24 of the tank remains",
    extension: "Research: What is a 'complex fraction'? Can you simplify (1/2) ÷ (3/4 + 1/8)? Show your method."
  },

  "equations": {
    title: "Solving Linear Equations",
    objective: "Solve one-step, two-step and multi-step linear equations. Form and solve equations from word problems.",
    priorKnowledge: "Students should be able to: use inverse operations; substitute values into expressions; understand what 'balance' means in algebra.",
    vocabulary: ["Equation", "Variable", "Unknown", "Inverse operation", "Coefficient", "Solution", "Balance", "Expand", "Collect like terms"],
    teacherNotes: "Use balance scales as a visual metaphor — whatever you do to one side, you must do to the other. Encourage students to write each step on a new line. For SEND students, provide a 'steps to solve' prompt card. Common misconception: students forget to apply the operation to BOTH sides. Highlight this with colour coding. Exam tip: always check the answer by substituting back into the original equation.",
    markScheme: [
      { q: "1.1", marks: 1, answer: "x = 5", method: "Subtract 7 from both sides" },
      { q: "1.2", marks: 1, answer: "x = 7", method: "Divide both sides by 2" },
      { q: "1.3", marks: 2, answer: "x = 4", method: "Add 3, then divide by 4" },
      { q: "2.1", marks: 2, answer: "x = 5", method: "Subtract 2, divide by 5" },
      { q: "2.2", marks: 2, answer: "x = 8", method: "Add 8, divide by 3" },
      { q: "2.3", marks: 2, answer: "x = 5", method: "Subtract 4, divide by 7" },
      { q: "2.4", marks: 3, answer: "x = 4", method: "Expand brackets: 2x + 6 = 14, then solve" },
      { q: "2.5", marks: 3, answer: "x = 7", method: "Collect x terms: 2x = 14" },
      { q: "Challenge", marks: 5, answer: "x = 6", method: "Expand both sides, collect terms" },
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
        "Answer: x = 5"
      ]
    },
    guided: [
      { q: "1.1  Solve x + 7 = 12   (What do you subtract from both sides?)", a: "x = 5", marks: 1 },
      { q: "1.2  Solve 2x = 14   (What do you divide both sides by?)", a: "x = 7", marks: 1 },
      { q: "1.3  Solve 4x − 3 = 13   (Step 1: add 3 to both sides. Step 2: divide by 4)", a: "x = 4", marks: 2 },
    ],
    independent: [
      { q: "2.1  Solve 5x + 2 = 27", a: "x = 5", marks: 2 },
      { q: "2.2  Solve 3x − 8 = 16", a: "x = 8", marks: 2 },
      { q: "2.3  Solve 7x + 4 = 39", a: "x = 5", marks: 2 },
      { q: "2.4  Solve 2(x + 3) = 14   (Expand the brackets first)", a: "x = 4", marks: 3 },
      { q: "2.5  Solve 6x − 5 = 4x + 9   (Collect x terms on one side)", a: "x = 7", marks: 3 },
      { q: "2.6  The perimeter of a rectangle is 30 cm. The length is (2x + 1) cm and the width is x cm. Form an equation and solve it to find x.", a: "6x + 2 = 30, x = 4.67 cm", marks: 4 },
    ],
    challenge: "Solve 3(2x − 1) + 4 = 5(x + 2) − 3. Show every line of working. Check your answer.",
    challengeAnswer: "6x − 3 + 4 = 5x + 10 − 3 → 6x + 1 = 5x + 7 → x = 6. Check: 3(11) + 4 = 37 and 5(8) − 3 = 37 ✓",
    extension: "Can you write your own two-step equation where the answer is x = −3? Swap with a partner to solve."
  },

  "percentages": {
    title: "Percentages — Increase, Decrease, Reverse and Compound",
    objective: "Calculate percentage increase and decrease using multipliers. Find the original amount using reverse percentages. Calculate compound interest.",
    priorKnowledge: "Students should be able to: convert between fractions, decimals and percentages; multiply decimals; understand the concept of 'of' in maths.",
    vocabulary: ["Percentage", "Multiplier", "Percentage increase", "Percentage decrease", "Original amount", "Reverse percentage", "Compound interest", "Simple interest"],
    teacherNotes: "Multiplier method is the most efficient and exam-friendly approach. Stress that for reverse percentages, students divide by the multiplier (not subtract the percentage). For compound interest, show the repeated multiplication pattern before introducing the formula. SEND adaptation: provide a multiplier reference card (e.g., 15% increase = × 1.15, 20% decrease = × 0.80).",
    markScheme: [
      { q: "1.1", marks: 1, answer: "£96", method: "£80 × 1.20" },
      { q: "1.2", marks: 1, answer: "£105", method: "£150 × 0.70" },
      { q: "1.3", marks: 2, answer: "£50", method: "£55 ÷ 1.10" },
      { q: "2.1", marks: 2, answer: "504", method: "450 × 1.12" },
      { q: "2.2", marks: 2, answer: "£240", method: "£320 × 0.75" },
      { q: "2.3", marks: 3, answer: "£120", method: "£78 ÷ 0.65" },
      { q: "2.4", marks: 3, answer: "£250,000", method: "£270,000 ÷ 1.08" },
      { q: "2.5", marks: 3, answer: "£80", method: "£96 ÷ 1.20" },
      { q: "Challenge", marks: 4, answer: "32% reduction", method: "0.80 × 0.85 = 0.68, so 32% reduction" },
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
        "Answer: £276   (Both methods give the same answer)"
      ]
    },
    guided: [
      { q: "1.1  Increase £80 by 20%   Multiplier = 1.__   Answer = £80 × ___ = £___", a: "£96", marks: 1 },
      { q: "1.2  Decrease £150 by 30%   Multiplier = 0.__   Answer = £150 × ___ = £___", a: "£105", marks: 1 },
      { q: "1.3  A price after a 10% increase is £55. What was the original price?   (Divide by the multiplier: £55 ÷ ___)", a: "£50", marks: 2 },
    ],
    independent: [
      { q: "2.1  Increase 450 by 12%", a: "504", marks: 2 },
      { q: "2.2  Decrease £320 by 25%", a: "£240", marks: 2 },
      { q: "2.3  A coat costs £78 after a 35% reduction. What was the original price?", a: "£120", marks: 3 },
      { q: "2.4  A house increases in value by 8% to £270,000. What was the original value?", a: "£250,000", marks: 3 },
      { q: "2.5  VAT at 20% is added to a bill. The total is £96. What was the pre-VAT amount?", a: "£80", marks: 3 },
      { q: "2.6  £5,000 is invested at 3% compound interest per year. How much is it worth after 4 years? Give your answer to the nearest penny.", a: "£5,000 × 1.03⁴ = £5,627.54", marks: 4 },
    ],
    challenge: "A shop reduces all items by 20% for a sale. During the sale, they reduce the already-reduced prices by a further 15%. What is the overall percentage reduction from the original price? Show your working.",
    challengeAnswer: "Overall multiplier = 0.80 × 0.85 = 0.68. This means 68% of original price remains, so overall reduction = 32%",
    extension: "Is a 20% increase followed by a 20% decrease the same as no change? Investigate with an example and explain why."
  },

  "pythagoras": {
    title: "Pythagoras' Theorem",
    objective: "Apply Pythagoras' theorem to find missing sides in right-angled triangles. Determine whether a triangle is right-angled.",
    priorKnowledge: "Students should be able to: square numbers; find square roots; identify the hypotenuse in a right-angled triangle.",
    vocabulary: ["Hypotenuse", "Right angle", "Pythagoras' theorem", "Square root", "Adjacent", "Opposite", "Pythagorean triple"],
    teacherNotes: "Always encourage students to draw and label a diagram. The hypotenuse is always opposite the right angle and is always the longest side. Common error: students square root the individual terms rather than the sum. Provide a formula card: a² + b² = c². Pythagorean triples (3,4,5), (5,12,13), (8,15,17) are worth memorising for speed in exams.",
    markScheme: [
      { q: "1.1", marks: 1, answer: "c = 5cm", method: "3² + 4² = 9 + 16 = 25, √25 = 5" },
      { q: "1.2", marks: 1, answer: "c = 13cm", method: "5² + 12² = 25 + 144 = 169, √169 = 13" },
      { q: "1.3", marks: 2, answer: "b = 15cm", method: "17² - 8² = 289 - 64 = 225, √225 = 15" },
      { q: "2.1", marks: 2, answer: "c = 15cm", method: "9² + 12² = 81 + 144 = 225, √225 = 15" },
      { q: "2.2", marks: 2, answer: "a = 7cm", method: "25² - 24² = 625 - 576 = 49, √49 = 7" },
      { q: "2.3", marks: 3, answer: "4m", method: "5² - 3² = 25 - 9 = 16, √16 = 4" },
      { q: "2.4", marks: 3, answer: "17cm", method: "8² + 15² = 64 + 225 = 289, √289 = 17" },
      { q: "Challenge", marks: 4, answer: "20km", method: "12² + 16² = 144 + 256 = 400, √400 = 20" },
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
        "Rearrange:   a² = c² − b² = 15² − 12² = 225 − 144 = 81   →   a = 9cm"
      ]
    },
    guided: [
      { q: "1.1  Find the hypotenuse: a = 3cm, b = 4cm\n         a² + b² = ___ + ___ = ___   →   c = ___", a: "c = 5cm", marks: 1 },
      { q: "1.2  Find the hypotenuse: a = 5cm, b = 12cm", a: "c = 13cm", marks: 1 },
      { q: "1.3  Find the shorter side b: a = 8cm, c = 17cm\n         b² = c² − a² = ___ − ___ = ___   →   b = ___", a: "b = 15cm", marks: 2 },
    ],
    independent: [
      { q: "2.1  Find the hypotenuse: a = 9cm, b = 12cm", a: "c = 15cm", marks: 2 },
      { q: "2.2  Find side a: b = 24cm, c = 25cm", a: "a = 7cm", marks: 2 },
      { q: "2.3  A ladder 5m long leans against a wall. The base of the ladder is 3m from the wall. How high up the wall does the ladder reach? Draw a diagram.", a: "4m", marks: 3 },
      { q: "2.4  Calculate the length of the diagonal of a rectangle that is 8cm wide and 15cm tall.", a: "17cm", marks: 3 },
      { q: "2.5  Is a triangle with sides 7cm, 24cm and 25cm a right-angled triangle? Show your working and explain your answer.", a: "Yes: 7² + 24² = 49 + 576 = 625 = 25² ✓", marks: 3 },
    ],
    challenge: "A ship sails 12km due North, then 16km due East. Calculate the shortest distance back to the starting point. Give your answer to 1 decimal place.",
    challengeAnswer: "√(12² + 16²) = √(144 + 256) = √400 = 20km",
    extension: "Investigate Pythagorean triples. Can you find a formula to generate them? (Hint: try m² − n², 2mn, m² + n²)"
  },

  "ratio": {
    title: "Ratio and Proportion",
    objective: "Simplify ratios, share quantities in a given ratio, and solve direct and inverse proportion problems.",
    priorKnowledge: "Students should be able to: find HCF; multiply and divide; understand fractions as parts of a whole.",
    vocabulary: ["Ratio", "Proportion", "Simplify", "Share", "Equivalent ratio", "Unitary method", "Direct proportion", "Inverse proportion"],
    teacherNotes: "Ratio is often confused with fractions — clarify that 3:5 means 3 parts to 5 parts (total 8 parts), not 3 out of 5. The unitary method is the most reliable for proportion problems. Encourage students to always check their answers add up to the original total. Real-life contexts (recipes, maps, scale drawings) help make ratio meaningful.",
    markScheme: [
      { q: "1.1", marks: 1, answer: "2:3", method: "Divide both by HCF = 6" },
      { q: "1.2", marks: 2, answer: "£15 and £45", method: "Total parts = 4; 1 part = £15" },
      { q: "2.1", marks: 2, answer: "£60 and £140", method: "Total parts = 10; 1 part = £20" },
      { q: "2.2", marks: 2, answer: "16 boys", method: "Total parts = 9; 1 part = 4 students; 4 × 4 = 16" },
      { q: "2.3", marks: 2, answer: "450g", method: "300 ÷ 4 × 6 = 450" },
      { q: "Challenge", marks: 5, answer: "£100", method: "Cara's fraction = 7/20; 7/20 = £35 → total = £100" },
    ],
    example: {
      question: "Share £120 in the ratio 3:5",
      steps: [
        "Step 1: Find the total number of parts → 3 + 5 = 8 parts",
        "Step 2: Find the value of ONE part → £120 ÷ 8 = £15 per part",
        "Step 3: Multiply each share by the value of one part",
        "         First share:  3 × £15 = £45",
        "         Second share: 5 × £15 = £75",
        "Step 4: Check: £45 + £75 = £120 ✓",
        "Answer: £45 and £75"
      ]
    },
    guided: [
      { q: "1.1  Simplify the ratio 12:18   (Divide both by the HCF = ___)", a: "2:3", marks: 1 },
      { q: "1.2  Share £60 in the ratio 1:3\n         Total parts = ___   One part = £___   Shares = £___ and £___", a: "£15 and £45", marks: 2 },
      { q: "1.3  Share 45 sweets in the ratio 2:3:4", a: "10, 15, 20", marks: 2 },
    ],
    independent: [
      { q: "2.1  Share £200 in the ratio 3:7", a: "£60 and £140", marks: 2 },
      { q: "2.2  The ratio of boys to girls in a class is 4:5. There are 36 students in total. How many are boys?", a: "16 boys", marks: 2 },
      { q: "2.3  A recipe for 4 people needs 300g of flour. How much flour is needed for 6 people?", a: "450g", marks: 2 },
      { q: "2.4  Purple paint is made by mixing red and blue in the ratio 3:5. How much blue paint is needed to make 400ml of purple paint?", a: "250ml", marks: 3 },
      { q: "2.5  On a map, 1cm represents 5km. Two cities are 8.5cm apart on the map. What is the real distance between them?", a: "42.5km", marks: 2 },
    ],
    challenge: "Ali, Ben and Cara share some money. Ali gets 1/4, Ben gets 2/5, and Cara gets the rest. If Cara receives £35, how much money was shared in total? Show all your working.",
    challengeAnswer: "Cara's fraction = 1 − 1/4 − 2/5 = 20/20 − 5/20 − 8/20 = 7/20. If 7/20 = £35, then 1/20 = £5, so total = 20 × £5 = £100",
    extension: "Investigate inverse proportion: if 4 workers take 6 days to complete a job, how long would 8 workers take? What about 3 workers?"
  },

  "histograms-cumulative-frequency": {
    title: "Histograms and Cumulative Frequency",
    objective: "Draw and interpret histograms and cumulative frequency graphs using complete grouped data and frequency density.",
    priorKnowledge: "Students should be able to: read grouped frequency tables; calculate class width; divide frequency by class width; plot coordinates on axes.",
    vocabulary: ["Histogram", "Cumulative frequency", "Frequency density", "Class interval", "Grouped data"],
    teacherNotes: "Use the same grouped table throughout the worksheet so the questions, diagrams and answers stay consistent. Remind students that histogram bar height is frequency density, not frequency. For cumulative frequency, students should use upper class boundaries and a running total.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Frequency density values: 0-10 -> 0.8, 10-20 -> 1.2, 20-30 -> 1.6, 30-50 -> 0.9, 50-60 -> 0.5", method: "Divide each frequency by its class width" },
      { q: "1.2", marks: 2, answer: "Cumulative frequencies: 8, 20, 36, 54, 59", method: "Keep a running total across the grouped table" },
      { q: "2.1", marks: 3, answer: "Estimated number below 35 minutes is about 45", method: "Read from the cumulative frequency graph at 35 minutes" },
      { q: "2.2", marks: 2, answer: "Modal class is 20-30 minutes", method: "Highest frequency density gives the modal class" },
      { q: "2.3", marks: 3, answer: "Median is approximately 27 minutes", method: "Find the 30th value on the cumulative frequency graph and read across" },
      { q: "Challenge", marks: 4, answer: "About 9 students", method: "Use graph estimates between 40 and 50 minutes and subtract cumulative totals" }
    ],
    example: {
      question: "A teacher records the time, in minutes, that 59 students spend on homework in one evening.",
      steps: [
        "Use this grouped table for every question in the worksheet:",
        "0-10: 8 students",
        "10-20: 12 students",
        "20-30: 16 students",
        "30-50: 18 students",
        "50-60: 5 students",
        "",
        "Step 1: Work out each class width.",
        "Widths are 10, 10, 10, 20 and 10.",
        "Step 2: Calculate frequency density = frequency ÷ class width.",
        "So the densities are 0.8, 1.2, 1.6, 0.9 and 0.5.",
        "Step 3: For cumulative frequency, add the frequencies as a running total.",
        "The cumulative frequencies are 8, 20, 36, 54 and 59.",
        "Step 4: Plot the histogram using frequency density, then plot the cumulative frequency graph using upper class boundaries 10, 20, 30, 50 and 60."
      ]
    },
    guided: [
      { q: "1.1  For the grouped table below, calculate the missing frequency densities.\n         0-10: 8\n         10-20: 12\n         20-30: 16\n         30-50: 18\n         50-60: 5", a: "0.8, 1.2, 1.6, 0.9, 0.5", marks: 2 },
      { q: "1.2  Using the same data, complete the cumulative frequency column for the class intervals 0-10, 10-20, 20-30, 30-50 and 50-60.", a: "8, 20, 36, 54, 59", marks: 2 },
      { q: "1.3  Which class interval would have the tallest bar in the histogram, and why?", a: "20-30, because it has the highest frequency density of 1.6", marks: 2 }
    ],
    independent: [
      { q: "2.1  Draw a histogram for the homework-time data using these class intervals and frequencies: 0-10: 8, 10-20: 12, 20-30: 16, 30-50: 18, 50-60: 5. Label the axes clearly.", a: "Histogram with correct unequal-width bars and heights 0.8, 1.2, 1.6, 0.9 and 0.5", marks: 3 },
      { q: "2.2  Draw a cumulative frequency graph for the same data. Plot the points (10,8), (20,20), (30,36), (50,54) and (60,59), then join them with a smooth curve.", a: "Correct cumulative frequency graph through the listed points", marks: 3 },
      { q: "2.3  Use your cumulative frequency graph to estimate how many students spent less than 35 minutes on homework.", a: "About 45 students", marks: 3 },
      { q: "2.4  Estimate the median homework time from your cumulative frequency graph.", a: "About 27 minutes", marks: 3 },
      { q: "2.5  Explain why the 30-50 class interval does not have the tallest histogram bar even though it has the highest frequency.", a: "Its class width is larger, so its frequency density is only 0.9; histogram height depends on frequency density, not raw frequency", marks: 3 }
    ],
    challenge: "Between 40 and 50 minutes, approximately how many students spent that long on homework? Use the cumulative frequency graph to explain your estimate.",
    challengeAnswer: "Read the cumulative frequency at 40 minutes as about 50 and at 50 minutes as 54, so approximately 4 students are between 40 and 50 minutes. Accept close estimates from a correctly drawn graph.",
    extension: "Create a second grouped table of your own with unequal class widths, then write one histogram question and one cumulative frequency question for a partner to answer."
  },

  "area": {
    title: "Area and Perimeter",
    objective: "Calculate the area and perimeter of rectangles, triangles, parallelograms, trapezoids and composite shapes.",
    priorKnowledge: "Students should know multiplication facts; understand what area and perimeter mean; be able to identify 2D shapes.",
    vocabulary: ["Area", "Perimeter", "Rectangle", "Triangle", "Parallelogram", "Trapezium", "Composite shape", "Formula", "Square units"],
    teacherNotes: "Emphasise the difference between area (space inside) and perimeter (distance around). Provide formula cards for SEND students. Composite shapes: encourage students to split into simpler shapes and label all dimensions before calculating. Common error: using wrong formula for triangle (forgetting to halve).",
    markScheme: [
      { q: "1.1", marks: 1, answer: "24cm²", method: "6 × 4 = 24" },
      { q: "1.2", marks: 1, answer: "20cm", method: "2(6 + 4) = 20" },
      { q: "1.3", marks: 2, answer: "15cm²", method: "½ × 6 × 5 = 15" },
      { q: "2.1", marks: 2, answer: "32cm²", method: "½ × 8 × 8 = 32" },
      { q: "2.2", marks: 2, answer: "48cm²", method: "8 × 6 = 48" },
      { q: "2.3", marks: 3, answer: "35cm²", method: "½(5+9) × 5 = 35" },
      { q: "Challenge", marks: 4, answer: "Requires splitting into rectangle + triangle" },
    ],
    example: {
      question: "Find the area of a triangle with base 8cm and height 5cm",
      steps: [
        "Formula for area of a triangle:   Area = ½ × base × height",
        "Step 1: Identify base = 8cm, height = 5cm",
        "         IMPORTANT: The height must be perpendicular (at right angles) to the base",
        "Step 2: Substitute:   Area = ½ × 8 × 5",
        "Step 3: Calculate:   Area = ½ × 40 = 20cm²",
        "Answer: 20cm²",
        "",
        "Key formulae to remember:",
        "Rectangle:      Area = length × width",
        "Triangle:       Area = ½ × base × height",
        "Parallelogram:  Area = base × height",
        "Trapezium:      Area = ½(a + b) × height"
      ]
    },
    guided: [
      { q: "1.1  Find the area of a rectangle with length 6cm and width 4cm.\n         Area = ___ × ___ = ___cm²", a: "24cm²", marks: 1 },
      { q: "1.2  Find the perimeter of the same rectangle.\n         Perimeter = 2 × (___ + ___) = ___cm", a: "20cm", marks: 1 },
      { q: "1.3  Find the area of a triangle with base 6cm and perpendicular height 5cm.", a: "15cm²", marks: 2 },
    ],
    independent: [
      { q: "2.1  Find the area of a right-angled triangle with legs 8cm and 8cm.", a: "32cm²", marks: 2 },
      { q: "2.2  A parallelogram has base 8cm and perpendicular height 6cm. Find its area.", a: "48cm²", marks: 2 },
      { q: "2.3  Find the area of a trapezium with parallel sides 5cm and 9cm, and a height of 5cm.", a: "35cm²", marks: 3 },
      { q: "2.4  An L-shaped room has dimensions shown. [Rectangle 10m × 6m with a 4m × 3m rectangle removed from one corner.] Find the total floor area.", a: "10×6 − 4×3 = 60 − 12 = 48m²", marks: 4 },
    ],
    challenge: "A composite shape is made from a rectangle 12cm × 5cm with a semicircle of diameter 5cm attached to one end. Calculate the total area. Give your answer to 1 decimal place. (π = 3.14)",
    challengeAnswer: "Rectangle: 12 × 5 = 60cm². Semicircle: ½ × π × 2.5² = ½ × 3.14 × 6.25 = 9.8cm². Total = 69.8cm²",
    extension: "A farmer has 100m of fencing. What dimensions should a rectangular field have to maximise the area? Investigate and explain."
  },

  "statistics": {
    title: "Statistics — Mean, Median, Mode and Range",
    objective: "Calculate mean, median, mode and range from lists of data and frequency tables. Interpret statistical measures.",
    priorKnowledge: "Students should be able to: order numbers; add a list of numbers; divide by whole numbers.",
    vocabulary: ["Mean", "Median", "Mode", "Range", "Average", "Frequency", "Data set", "Outlier", "Frequency table"],
    teacherNotes: "Use the mnemonic 'MMMR' (Mean, Median, Mode, Range). Stress that mean is affected by outliers but median is not — this is an important conceptual point. For frequency tables, students often forget to multiply value × frequency. Provide a structured table template for SEND students.",
    markScheme: [
      { q: "1.1", marks: 1, answer: "Mode = 7", method: "7 appears most often (3 times)" },
      { q: "1.2", marks: 1, answer: "Median = 7", method: "Order data: 3,5,6,7,7,7,9,10,12 — middle value" },
      { q: "1.3", marks: 2, answer: "Mean = 7.33", method: "Sum = 66, ÷ 9 = 7.33" },
      { q: "1.4", marks: 1, answer: "Range = 9", method: "12 − 3 = 9" },
    ],
    example: {
      question: "Find the mean, median, mode and range of: 4, 7, 2, 9, 7, 3, 7, 5",
      steps: [
        "Step 1: ORDER the data first → 2, 3, 4, 5, 7, 7, 7, 9",
        "",
        "MODE (most common): 7 appears 3 times → Mode = 7",
        "",
        "MEDIAN (middle value): 8 values, so median = average of 4th and 5th values",
        "         4th value = 5,  5th value = 7   →   Median = (5 + 7) ÷ 2 = 6",
        "",
        "MEAN (add all, divide by how many):",
        "         2 + 3 + 4 + 5 + 7 + 7 + 7 + 9 = 44",
        "         44 ÷ 8 = 5.5   →   Mean = 5.5",
        "",
        "RANGE (highest − lowest):   9 − 2 = 7   →   Range = 7"
      ]
    },
    guided: [
      { q: "1.1  Find the MODE of: 3, 7, 5, 7, 9, 10, 7, 6, 12   (Which number appears most?)", a: "Mode = 7", marks: 1 },
      { q: "1.2  Find the MEDIAN of the same data set.   (Order the data first: ___, ___, ___, ___, ___, ___, ___, ___, ___)", a: "Median = 7", marks: 1 },
      { q: "1.3  Find the MEAN of the same data set.   Sum = ___   ÷ 9 = ___", a: "Mean = 7.33", marks: 2 },
      { q: "1.4  Find the RANGE.   Highest − Lowest = ___ − ___ = ___", a: "Range = 9", marks: 1 },
    ],
    independent: [
      { q: "2.1  The ages of 7 students are: 11, 13, 12, 11, 14, 11, 15. Find the mean, median, mode and range.", a: "Mean = 12.43, Median = 12, Mode = 11, Range = 4", marks: 4 },
      { q: "2.2  A class scored these marks in a test: 45, 62, 71, 58, 62, 79, 45, 62, 88, 51. Find the mean and median. Which is a better average? Explain.", a: "Mean = 62.3, Median = 62. Both similar here; median better if outliers present.", marks: 4 },
      { q: "2.3  The mean of 5 numbers is 8. Four of the numbers are 6, 9, 7, 10. What is the fifth number?", a: "Total = 5 × 8 = 40. Fifth number = 40 − 32 = 8", marks: 3 },
    ],
    challenge: "A student scores 72, 68, 75 and 81 in four tests. What score does she need in the fifth test to achieve a mean of 75? Show your working.",
    challengeAnswer: "Total needed = 5 × 75 = 375. Current total = 296. Fifth score = 375 − 296 = 79",
    extension: "Research: What is a 'weighted mean'? When would you use it? Give a real-life example."
  },

  "trigonometry": {
    title: "Trigonometry — SOH CAH TOA",
    objective: "Use trigonometric ratios (sin, cos, tan) to find missing sides and angles in right-angled triangles.",
    priorKnowledge: "Students should know Pythagoras' theorem; be able to use a scientific calculator; understand ratio.",
    vocabulary: ["Sine (sin)", "Cosine (cos)", "Tangent (tan)", "Hypotenuse", "Opposite", "Adjacent", "Trigonometric ratio", "Inverse function"],
    teacherNotes: "SOH CAH TOA is the key mnemonic. Ensure students can correctly identify opposite and adjacent sides relative to the angle being used. Calculator skills are essential — check students know how to use sin⁻¹, cos⁻¹, tan⁻¹. Common error: using the wrong ratio or mixing up opposite/adjacent.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "x = 5.74cm", method: "sin 35° = x/10, x = 10 sin 35°" },
      { q: "1.2", marks: 2, answer: "x = 8.19cm", method: "cos 35° = x/10, x = 10 cos 35°" },
      { q: "2.1", marks: 3, answer: "x = 9.06cm", method: "tan 42° = x/10.1, x = 10.1 tan 42°" },
      { q: "2.2", marks: 3, answer: "θ = 36.9°", method: "sin θ = 6/10, θ = sin⁻¹(0.6)" },
    ],
    example: {
      question: "Find side x in a right-angled triangle where the hypotenuse = 12cm and angle = 40°, with x opposite the angle.",
      steps: [
        "Step 1: Label the sides relative to the 40° angle",
        "         Hypotenuse (H) = 12cm  (longest side, opposite right angle)",
        "         Opposite (O) = x  (opposite the 40° angle)",
        "         Adjacent (A) = the remaining side",
        "Step 2: Choose the correct ratio — we have O and H, so use SOH",
        "         sin θ = Opposite / Hypotenuse",
        "Step 3: Substitute:   sin 40° = x / 12",
        "Step 4: Rearrange:   x = 12 × sin 40°",
        "Step 5: Calculate:   x = 12 × 0.6428 = 7.71cm",
        "Answer: x = 7.71cm (2 d.p.)",
        "",
        "FINDING AN ANGLE — use inverse functions:",
        "If sin θ = 0.5, then θ = sin⁻¹(0.5) = 30°"
      ]
    },
    guided: [
      { q: "1.1  In a right-angled triangle, hypotenuse = 10cm, angle = 35°. Find the side OPPOSITE the angle.\n         Which ratio? SOH / CAH / TOA   →   sin 35° = x / ___   →   x = ___", a: "x = 5.74cm", marks: 2 },
      { q: "1.2  Same triangle. Find the side ADJACENT to the 35° angle.\n         cos 35° = x / ___   →   x = ___", a: "x = 8.19cm", marks: 2 },
    ],
    independent: [
      { q: "2.1  Find x: right-angled triangle, angle = 42°, adjacent = 10.1cm, find opposite.", a: "x = 9.06cm", marks: 3 },
      { q: "2.2  Find angle θ: opposite = 6cm, hypotenuse = 10cm. Give your answer to 1 d.p.", a: "θ = 36.9°", marks: 3 },
      { q: "2.3  A ramp rises 2m over a horizontal distance of 5m. Calculate the angle the ramp makes with the ground.", a: "tan θ = 2/5, θ = tan⁻¹(0.4) = 21.8°", marks: 3 },
    ],
    challenge: "From the top of a cliff 80m high, the angle of depression to a boat is 32°. Calculate the horizontal distance from the base of the cliff to the boat. Give your answer to the nearest metre.",
    challengeAnswer: "tan 32° = 80/d, d = 80/tan 32° = 80/0.6249 = 128m",
    extension: "Investigate: what is the sine rule and when is it used? How does it extend trigonometry beyond right-angled triangles?"
  },

  "algebra": {
    title: "Algebra — Expanding and Factorising",
    objective: "Expand single and double brackets. Factorise expressions by taking out common factors. Expand and simplify (a + b)(c + d).",
    priorKnowledge: "Students should be able to: collect like terms; multiply positive and negative numbers; understand index notation.",
    vocabulary: ["Expand", "Factorise", "Brackets", "Common factor", "Like terms", "Coefficient", "Expression", "Simplify", "FOIL"],
    teacherNotes: "Use the grid method alongside FOIL for double brackets — it is more reliable for SEND students. Emphasise that factorising is the reverse of expanding. Colour-coding each term helps students track multiplications. Common error: sign errors when expanding (x − 3)².",
    markScheme: [
      { q: "1.1", marks: 1, answer: "3x + 12", method: "3(x) + 3(4)" },
      { q: "1.2", marks: 1, answer: "10x − 15", method: "5(2x) + 5(−3)" },
      { q: "1.3", marks: 2, answer: "x² + 7x + 12", method: "FOIL: x² + 4x + 3x + 12" },
      { q: "2.1", marks: 2, answer: "x² + 5x + 6", method: "FOIL: x² + 3x + 2x + 6" },
      { q: "2.2", marks: 2, answer: "x² − x − 12", method: "FOIL: x² + 3x − 4x − 12" },
      { q: "2.3", marks: 2, answer: "4(2x + 3)", method: "HCF of 8x and 12 is 4" },
    ],
    example: {
      question: "Expand and simplify (x + 3)(x + 4)",
      steps: [
        "Method 1 — FOIL (First, Outer, Inner, Last):",
        "         F: x × x = x²",
        "         O: x × 4 = 4x",
        "         I: 3 × x = 3x",
        "         L: 3 × 4 = 12",
        "         Combine: x² + 4x + 3x + 12 = x² + 7x + 12",
        "",
        "Method 2 — Grid method:",
        "         |   x  |  +3  |",
        "     x   |  x²  |  3x  |",
        "    +4   |  4x  |  12  |",
        "         Total: x² + 3x + 4x + 12 = x² + 7x + 12",
        "",
        "Answer: x² + 7x + 12"
      ]
    },
    guided: [
      { q: "1.1  Expand 3(x + 4)   →   3 × x = ___   and   3 × 4 = ___   →   Answer: ___", a: "3x + 12", marks: 1 },
      { q: "1.2  Expand 5(2x − 3)", a: "10x − 15", marks: 1 },
      { q: "1.3  Expand (x + 3)(x + 4) using FOIL or the grid method.", a: "x² + 7x + 12", marks: 2 },
    ],
    independent: [
      { q: "2.1  Expand and simplify (x + 2)(x + 3)", a: "x² + 5x + 6", marks: 2 },
      { q: "2.2  Expand and simplify (x + 3)(x − 4)", a: "x² − x − 12", marks: 2 },
      { q: "2.3  Factorise 8x + 12   (Find the HCF of 8 and 12 first)", a: "4(2x + 3)", marks: 2 },
      { q: "2.4  Factorise x² + 5x + 6   (Find two numbers that multiply to 6 and add to 5)", a: "(x + 2)(x + 3)", marks: 3 },
      { q: "2.5  Expand and simplify (2x + 1)(3x − 2)", a: "6x² − x − 2", marks: 3 },
    ],
    challenge: "Show that (x + 3)² − (x − 1)² = 8(x + 1). Start by expanding each bracket separately.",
    challengeAnswer: "(x+3)² = x²+6x+9; (x−1)² = x²−2x+1; Difference = 8x+8 = 8(x+1) ✓",
    extension: "Investigate: what is the 'difference of two squares'? Can you factorise x² − 16? What about 4x² − 9?"
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH TOPICS
// ─────────────────────────────────────────────────────────────────────────────
const englishTopics: Record<string, any> = {
  "comprehension": {
    title: "Reading Comprehension — Inference, Deduction and Analysis",
    objective: "Use inference and deduction to interpret meaning. Analyse language choices and their effects on the reader.",
    priorKnowledge: "Students should be able to: identify explicit information; use PEE (Point, Evidence, Explain) structure; understand basic literary terms.",
    vocabulary: ["Inference", "Deduction", "Evidence", "Imply", "Suggest", "Interpret", "Connotation", "Tone", "Atmosphere", "Explicit", "Implicit"],
    teacherNotes: "Model the difference between explicit (directly stated) and implicit (implied) information. PEE structure is essential — display it prominently. For SEND students, provide sentence starters: 'This suggests that...', 'The word ___ implies...', 'The reader feels... because...'. Encourage students to always quote from the text using inverted commas.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "A lonely, eerie, abandoned atmosphere", method: "Evidence: 'creaked', 'dark and empty' — 2 marks for atmosphere + evidence" },
      { q: "1.2", marks: 2, answer: "Suggests the house is uninhabited and neglected", method: "1 mark inference, 1 mark explanation" },
      { q: "2.1", marks: 4, answer: "Two pieces of evidence with explanation of how each shows nervousness", method: "2 marks per piece of evidence (quote + explanation)" },
      { q: "2.2", marks: 3, answer: "Oxymoron — silence cannot literally be deafening; emphasises how uncomfortable and noticeable the silence was", method: "1 mark technique, 2 marks explanation" },
    ],
    example: {
      question: "Read: 'Maya's hands trembled as she reached for the door handle. She had been standing outside for twenty minutes, unable to move.' What can you infer about Maya's feelings?",
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
        "         EXPLAIN: This physical reaction suggests she is so nervous that she has lost control of her body, implying she is dreading what lies beyond the door.",
        "",
        "Tip: Always use the word 'suggests', 'implies' or 'shows' to signal an inference."
      ]
    },
    guided: [
      { q: "1.1  Read: 'The old house creaked in the wind, its windows dark and empty.' What atmosphere is created? Use evidence from the text.", a: "A lonely, eerie atmosphere — 'creaked', 'dark and empty' suggest abandonment and neglect.", marks: 2 },
      { q: "1.2  What does the phrase 'dark and empty' suggest about the house? (Think about what this implies beyond the literal meaning)", a: "It implies the house is uninhabited and has been neglected — no warmth or life remains.", marks: 2 },
      { q: "1.3  Write a PEE paragraph about the atmosphere in the passage. Use the structure: Point → Evidence → Explain.", a: "Model answer: The writer creates a tense, unsettling atmosphere. The word 'creaked' suggests the house is unstable and threatening. This makes the reader feel uneasy, as if something dangerous might happen.", marks: 3 },
    ],
    independent: [
      { q: "2.1  Read the extract provided. Identify TWO pieces of evidence that show the character is nervous. For each, explain what it suggests.", a: "Two quotes with explanation of how each shows nervousness. Award 2 marks per point (quote + explanation).", marks: 4 },
      { q: "2.2  Explain what the writer means by 'the silence was deafening'. What technique is used and what effect does it have on the reader?", a: "Oxymoron — silence cannot literally be deafening. Emphasises how oppressive and uncomfortable the silence was, creating tension.", marks: 3 },
      { q: "2.3  How does the writer use language to create tension in the opening paragraph? Refer to at least two language techniques.", a: "Analysis of techniques (e.g., short sentences for pace, personification, sensory language) with evidence and explanation.", marks: 6 },
      { q: "2.4  Compare how the two characters respond to the situation. What does this tell us about their personalities?", a: "Comparative analysis with evidence from the text for each character.", marks: 4 },
    ],
    challenge: "Compare how two writers use language to present different attitudes towards the same theme. Use evidence from both texts and analyse the effect on the reader.",
    challengeAnswer: "Comparative analysis with PEE paragraphs from both texts, including: identification of techniques, embedded quotations, analysis of effect, and comparison language ('whereas', 'in contrast', 'similarly').",
    extension: "Research the term 'pathetic fallacy'. Find an example in a novel or poem you have studied and write a paragraph analysing its effect."
  },

  "creative-writing": {
    title: "Creative Writing — Descriptive and Narrative Techniques",
    objective: "Use a range of descriptive and narrative techniques to create vivid, engaging writing. Structure writing effectively for impact.",
    priorKnowledge: "Students should know: basic punctuation; sentence types (simple, compound, complex); some literary devices (simile, metaphor).",
    vocabulary: ["Simile", "Metaphor", "Personification", "Sensory language", "Pathetic fallacy", "Imagery", "Foreshadowing", "Narrative voice", "Tone", "Pace", "Tension"],
    teacherNotes: "Provide a 'techniques toolkit' card for SEND students. Encourage planning before writing — even a brief spider diagram helps structure. Discuss how professional authors use short sentences for tension and longer sentences for description. Peer assessment against the mark scheme builds metacognitive awareness. For GCSE, remind students that GCSE marks for: communication and organisation (24 marks) and technical accuracy (16 marks).",
    markScheme: [
      { q: "1.1", marks: 2, answer: "A simile comparing the sea to something else, with a reason for the comparison", method: "1 mark for simile, 1 mark for explanation" },
      { q: "1.2", marks: 2, answer: "Personification of the moon with a verb showing human action", method: "1 mark for personification, 1 mark for effect" },
      { q: "2.1", marks: 8, answer: "Extended writing marked on: range of techniques (3), sensory detail (2), vocabulary (2), structure (1)", method: "See GCSE-style mark bands" },
      { q: "Challenge", marks: 16, answer: "Extended writing: 8 marks communication/organisation, 8 marks technical accuracy", method: "GCSE mark bands" },
    ],
    example: {
      question: "Write a descriptive paragraph about a storm using at least three techniques.",
      steps: [
        "PLANNING — think about all five senses:",
        "   Sight: dark clouds, lightning, sheets of rain",
        "   Sound: thunder, howling wind, rain hammering",
        "   Touch: cold, wet, wind pushing",
        "   Smell: petrichor (smell of rain on earth)",
        "   Taste: metallic air before lightning",
        "",
        "EXAMPLE PARAGRAPH:",
        "The storm descended without warning. Black clouds, thick as bruises, swallowed the last of the afternoon light.",
        "Rain fell like needles — sharp, relentless, merciless. The wind howled its fury at the trembling trees,",
        "tearing leaves from their branches as if punishing them for simply existing. In the distance,",
        "a crack of thunder split the sky in two.",
        "",
        "TECHNIQUES USED:",
        "   Simile: 'like needles'",
        "   Personification: 'howled its fury', 'punishing them'",
        "   Pathetic fallacy: storm reflects danger/threat",
        "   Short sentence: 'Rain fell like needles' — creates impact",
        "   Rule of three: 'sharp, relentless, merciless'"
      ]
    },
    guided: [
      { q: "1.1  Write a SIMILE to describe the sea. Start with: 'The sea stretched out like...'", a: "The sea stretched out like a sheet of crumpled silk. / The sea was like a restless grey mirror.", marks: 2 },
      { q: "1.2  Write a sentence using PERSONIFICATION about the moon.", a: "The moon watched over the sleeping town. / The moon crept across the sky, hiding behind clouds.", marks: 2 },
      { q: "1.3  Write a sentence using PATHETIC FALLACY to show a character is sad.", a: "The rain hammered against the window, as though the sky itself was weeping.", marks: 2 },
      { q: "1.4  Rewrite this dull sentence to make it more descriptive: 'The man walked down the street.'", a: "Various improved versions — look for specific verbs, adjectives, adverbs, and sensory detail.", marks: 2 },
    ],
    independent: [
      { q: "2.1  Write a paragraph (8–10 sentences) describing a busy market using all FIVE senses. Use at least three literary techniques.", a: "Extended writing response. Mark on: range of senses (2), techniques (3), vocabulary (2), structure (1).", marks: 8 },
      { q: "2.2  Write an opening paragraph for a story set in a haunted house. Use pathetic fallacy, personification and at least one short sentence for impact.", a: "Extended writing response. Mark on: techniques used (3), atmosphere created (2), vocabulary (2), sentence variety (1).", marks: 8 },
      { q: "2.3  Write a narrative paragraph from the perspective of someone who has just received unexpected good news. Show — don't tell — their emotions.", a: "Extended writing response. Look for: physical reactions, internal thoughts, varied sentence lengths, specific details.", marks: 6 },
    ],
    challenge: "Write a 200-word description of a setting that shifts from peaceful to threatening. Use a range of techniques including extended metaphor, pathetic fallacy, and varied sentence lengths for effect.",
    challengeAnswer: "Extended creative writing response. Mark on: GCSE bands — communication/organisation (8 marks) and technical accuracy (8 marks). Look for: clear structural shift, sustained extended metaphor, range of techniques, accurate punctuation.",
    extension: "Read the opening paragraph of a novel of your choice. Identify three techniques the author uses and explain how each creates an effect on the reader."
  },

  "grammar": {
    title: "Grammar and Punctuation — Sentences, Clauses and Punctuation",
    objective: "Identify and use different sentence types. Use a range of punctuation accurately including colons, semicolons and dashes.",
    priorKnowledge: "Students should know: nouns, verbs, adjectives, adverbs; basic punctuation (full stops, commas, question marks).",
    vocabulary: ["Simple sentence", "Compound sentence", "Complex sentence", "Subordinate clause", "Main clause", "Conjunction", "Colon", "Semicolon", "Parenthesis", "Dash"],
    teacherNotes: "Colour-code sentence types — simple (green), compound (yellow), complex (red). Semicolons connect two closely related independent clauses — a common exam technique. Colons introduce lists or explanations. Dashes add parenthetical information or create dramatic effect. Provide a punctuation reference card for SEND students.",
    markScheme: [
      { q: "1.1", marks: 1, answer: "Simple sentence — one main clause, one verb", method: "" },
      { q: "1.2", marks: 2, answer: "Compound sentence using FANBOYS conjunction", method: "1 mark structure, 1 mark correct conjunction" },
      { q: "1.3", marks: 2, answer: "Complex sentence with subordinate clause", method: "1 mark subordinate clause, 1 mark correct conjunction" },
    ],
    example: {
      question: "Identify the sentence type and explain how to write each one.",
      steps: [
        "SIMPLE SENTENCE: One main clause, one subject, one verb.",
        "   Example: 'The dog barked.'",
        "",
        "COMPOUND SENTENCE: Two main clauses joined by a coordinating conjunction (FANBOYS: For, And, Nor, But, Or, Yet, So).",
        "   Example: 'The dog barked, and the cat ran away.'",
        "",
        "COMPLEX SENTENCE: One main clause + one or more subordinate clauses, joined by a subordinating conjunction (because, although, when, if, since, while, unless).",
        "   Example: 'Although the dog barked loudly, the cat refused to move.'",
        "",
        "PUNCTUATION — Colon (:) introduces a list or explanation:",
        "   'She had everything she needed: courage, determination and hope.'",
        "",
        "PUNCTUATION — Semicolon (;) joins two related independent clauses:",
        "   'It was raining heavily; the match was cancelled.'"
      ]
    },
    guided: [
      { q: "1.1  Identify the sentence type: 'The wind howled through the trees.'", a: "Simple sentence — one main clause, one verb.", marks: 1 },
      { q: "1.2  Write a COMPOUND sentence about the weather using a conjunction from FANBOYS.", a: "e.g., 'The rain fell heavily, but the children continued to play.'", marks: 2 },
      { q: "1.3  Write a COMPLEX sentence about going to school, starting with 'Although...'", a: "e.g., 'Although she was tired, she arrived at school on time.'", marks: 2 },
    ],
    independent: [
      { q: "2.1  Rewrite these two simple sentences as one complex sentence: 'She was nervous. She walked into the exam hall.'", a: "Although she was nervous, she walked into the exam hall. / She walked into the exam hall, even though she was nervous.", marks: 2 },
      { q: "2.2  Add a colon to this sentence correctly: 'The recipe requires three ingredients flour, eggs and butter.'", a: "The recipe requires three ingredients: flour, eggs and butter.", marks: 1 },
      { q: "2.3  Write a sentence using a semicolon to connect two related ideas about school.", a: "e.g., 'The library was silent; everyone was revising for exams.'", marks: 2 },
      { q: "2.4  Identify and correct the punctuation error: 'Its a beautiful day, isnt it'", a: "It's a beautiful day, isn't it? (apostrophes for contractions, question mark)", marks: 2 },
    ],
    challenge: "Rewrite this paragraph to improve it by varying sentence types, adding punctuation for effect, and using at least one colon and one semicolon: 'The boy was scared. He ran. He fell. He got up. He ran again.'",
    challengeAnswer: "Model answer: Terrified, the boy ran — stumbling, falling, scrambling back to his feet. His heart hammered; his lungs burned. Still, he ran. He had no choice.",
    extension: "Research: what is a 'fronted adverbial'? Write three sentences that begin with a fronted adverbial and explain the effect each creates."
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCIENCE TOPICS
// ─────────────────────────────────────────────────────────────────────────────
const scienceTopics: Record<string, any> = {
  "cells": {
    title: "Cell Structure and Function",
    objective: "Identify and describe the structure and function of plant and animal cells. Compare prokaryotic and eukaryotic cells.",
    priorKnowledge: "Students should know: living things are made of cells; cells are the basic unit of life; organisms can be unicellular or multicellular.",
    vocabulary: ["Cell membrane", "Nucleus", "Cytoplasm", "Mitochondria", "Cell wall", "Chloroplast", "Vacuole", "Ribosome", "Prokaryote", "Eukaryote"],
    teacherNotes: "Use microscopy practical to make cells tangible. Emphasise that the cell wall is NOT the same as the cell membrane. Mnemonics help: 'MCM' (Membrane, Cytoplasm, Mitochondria) for animal cells; add 'CWV' (Cell Wall, Vacuole, Chloroplast) for plant cells. For SEND students, provide a labelled diagram to annotate rather than drawing from scratch.",
    markScheme: [
      { q: "1.1", marks: 1, answer: "Controls the cell's activities; contains genetic information (DNA)", method: "" },
      { q: "1.2", marks: 2, answer: "Cell wall AND chloroplasts (also accept large permanent vacuole)", method: "1 mark each, max 2" },
      { q: "1.3", marks: 2, answer: "Site of aerobic respiration; releases energy (ATP) for the cell", method: "1 mark site, 1 mark function" },
      { q: "2.1", marks: 4, answer: "Diagram with 4+ correctly labelled structures", method: "1 mark per correct label" },
      { q: "2.2", marks: 3, answer: "Cell wall provides structural support and rigidity; prevents cell from bursting; animal cells don't need this as they have flexible membranes", method: "" },
      { q: "Challenge", marks: 4, answer: "Root hair cells are underground — no light for photosynthesis; chloroplasts require light to function; having them would waste energy", method: "" },
    ],
    example: {
      question: "Name three structures found in BOTH plant and animal cells, and give the function of each.",
      steps: [
        "Step 1: Recall the structures of an animal cell:",
        "         Cell membrane, nucleus, cytoplasm, mitochondria, ribosomes",
        "Step 2: Recall the structures of a plant cell:",
        "         All of the above PLUS: cell wall, chloroplasts, large permanent vacuole",
        "Step 3: Identify the COMMON structures:",
        "",
        "   CELL MEMBRANE — controls what enters and leaves the cell (selective permeability)",
        "   NUCLEUS — contains DNA; controls cell activities and reproduction",
        "   CYTOPLASM — jelly-like fluid where chemical reactions take place",
        "   MITOCHONDRIA — site of aerobic respiration; releases energy for the cell",
        "",
        "Answer: Cell membrane, nucleus, cytoplasm (also mitochondria and ribosomes)"
      ]
    },
    guided: [
      { q: "1.1  What is the function of the NUCLEUS?", a: "Controls the cell's activities and contains genetic information (DNA).", marks: 1 },
      { q: "1.2  Name TWO structures found ONLY in plant cells.", a: "Cell wall and chloroplasts (also accept large permanent vacuole).", marks: 2 },
      { q: "1.3  What is the function of MITOCHONDRIA?", a: "Site of aerobic respiration — releases energy (ATP) for the cell.", marks: 2 },
      { q: "1.4  What is the difference between a cell membrane and a cell wall?", a: "Cell membrane: controls entry/exit of substances (all cells). Cell wall: provides structural support and rigidity (plant cells only).", marks: 2 },
    ],
    independent: [
      { q: "2.1  Draw and label an animal cell showing at least FOUR structures. Include the function of each structure next to its label.", a: "Diagram with correct labels and functions. 1 mark per correct label + function.", marks: 4 },
      { q: "2.2  Explain why plant cells have a cell wall but animal cells do not.", a: "Cell wall provides structural support and rigidity; prevents the cell from bursting when turgid. Animal cells are flexible and don't require this rigid support.", marks: 3 },
      { q: "2.3  A student examines a cell under a microscope and observes chloroplasts. Is this a plant or animal cell? Explain your reasoning.", a: "Plant cell — chloroplasts are only found in plant cells. They contain chlorophyll for photosynthesis.", marks: 2 },
      { q: "2.4  Complete the table: [Structure | Found in animal cells? | Found in plant cells? | Function] for: nucleus, cell wall, mitochondria, chloroplast, cell membrane", a: "Nucleus: both, controls activities. Cell wall: plant only, support. Mitochondria: both, respiration. Chloroplast: plant only, photosynthesis. Cell membrane: both, controls entry/exit.", marks: 5 },
    ],
    challenge: "Explain why root hair cells do not contain chloroplasts, even though they are plant cells. In your answer, refer to the function of chloroplasts and the conditions needed for photosynthesis.",
    challengeAnswer: "Root hair cells are found underground where there is no light. Chloroplasts require light energy to carry out photosynthesis. Since no light reaches the roots, chloroplasts would serve no purpose and would waste the cell's resources to produce and maintain them.",
    extension: "Research the difference between prokaryotic and eukaryotic cells. Draw a comparison table. Why are bacteria classified as prokaryotes?"
  },

  "forces": {
    title: "Forces and Motion",
    objective: "Understand balanced and unbalanced forces. Apply Newton's Laws of Motion. Calculate resultant forces and acceleration.",
    priorKnowledge: "Students should know: forces are measured in Newtons; forces can be contact or non-contact; gravity acts downward.",
    vocabulary: ["Force", "Newton (N)", "Friction", "Gravity", "Air resistance", "Balanced forces", "Unbalanced forces", "Resultant force", "Acceleration", "Newton's Laws"],
    teacherNotes: "Force diagrams (free body diagrams) are essential — always draw them before calculating. Newton's First Law: objects continue in their current state unless acted on by an unbalanced force. Newton's Second Law: F = ma. Newton's Third Law: equal and opposite reactions. For SEND students, provide a forces reference card with diagrams of common scenarios (falling object, car accelerating, etc.).",
    markScheme: [
      { q: "1.1", marks: 1, answer: "Newtons (N)", method: "" },
      { q: "1.2", marks: 2, answer: "Weight (gravity) downward; normal reaction force upward", method: "1 mark each" },
      { q: "1.3", marks: 1, answer: "Balanced — the book is stationary, so forces are equal and opposite", method: "" },
      { q: "2.1", marks: 2, answer: "200N forward", method: "800 − 600 = 200N" },
      { q: "2.2", marks: 2, answer: "Balanced forces — weight equals air resistance at terminal velocity", method: "" },
      { q: "Challenge", marks: 5, answer: "Resultant = 3000N upward; a = F/m = 3000/1200 = 2.5 m/s²", method: "" },
    ],
    example: {
      question: "A car has a driving force of 500N and friction of 300N. What is the resultant force and what does this mean for the car's motion?",
      steps: [
        "Step 1: Draw a force diagram — label all forces with direction",
        "         Driving force: 500N → (forward)",
        "         Friction:      300N ← (backward)",
        "Step 2: Calculate the resultant force",
        "         Forces are in OPPOSITE directions, so subtract:",
        "         Resultant = 500N − 300N = 200N",
        "Step 3: State the direction of the resultant",
        "         200N forward (in the direction of the driving force)",
        "Step 4: Interpret — what does this mean?",
        "         The forces are UNBALANCED → the car ACCELERATES forward",
        "",
        "Key rule: Balanced forces → constant speed (or stationary)",
        "          Unbalanced forces → acceleration or deceleration"
      ]
    },
    guided: [
      { q: "1.1  What unit is force measured in?", a: "Newtons (N)", marks: 1 },
      { q: "1.2  A book sits on a table. Name the TWO forces acting on it and state their directions.", a: "Weight (gravity) acting downward; Normal reaction force acting upward.", marks: 2 },
      { q: "1.3  Are the forces on the stationary book balanced or unbalanced? Explain.", a: "Balanced — the book is not moving, so the forces must be equal and opposite.", marks: 1 },
    ],
    independent: [
      { q: "2.1  Calculate the resultant force: 800N forward, 600N backward. State the direction.", a: "200N forward", marks: 2 },
      { q: "2.2  A skydiver falls at constant speed (terminal velocity). What can you say about the forces acting on them?", a: "Forces are balanced — weight (gravity) equals air resistance. No resultant force, so no acceleration.", marks: 2 },
      { q: "2.3  Explain why a car eventually reaches a top speed even if the engine keeps running.", a: "As speed increases, air resistance increases. Eventually air resistance equals the driving force. Forces are balanced — no further acceleration.", marks: 3 },
      { q: "2.4  Using F = ma, calculate the acceleration of a 1,500kg car with a resultant force of 3,000N.", a: "a = F/m = 3,000/1,500 = 2 m/s²", marks: 2 },
      { q: "2.5  Draw a force diagram for a ball thrown upward at its highest point. Label all forces.", a: "Only weight acting downward. (At the highest point, velocity = 0 but weight still acts.)", marks: 2 },
    ],
    challenge: "A rocket has a thrust of 15,000N and weighs 12,000N. (a) Calculate the resultant force. (b) If the rocket's mass is 1,200kg, calculate its acceleration. (c) As the rocket burns fuel, its mass decreases. What happens to its acceleration? Explain.",
    challengeAnswer: "(a) Resultant = 15,000 − 12,000 = 3,000N upward. (b) a = F/m = 3,000/1,200 = 2.5 m/s². (c) Acceleration increases — same force, less mass, so F/m increases (Newton's 2nd Law).",
    extension: "Research Newton's Third Law. Find three real-life examples of Newton's Third Law in action and explain each one."
  },

  "photosynthesis": {
    title: "Photosynthesis and Respiration",
    objective: "Write and interpret the equations for photosynthesis and aerobic respiration. Understand the factors affecting the rate of photosynthesis.",
    priorKnowledge: "Students should know: plants make their own food; cells need energy; the role of chlorophyll.",
    vocabulary: ["Photosynthesis", "Respiration", "Chlorophyll", "Chloroplast", "Carbon dioxide", "Glucose", "Oxygen", "Light intensity", "Limiting factor"],
    teacherNotes: "Emphasise that photosynthesis and respiration are NOT opposites — plants do both. The word equation must be memorised. For limiting factors, use graphs to show how light intensity, CO₂ concentration and temperature each affect the rate. Practical: measure oxygen bubble production in pondweed (Elodea) at different light intensities.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Carbon dioxide + water → glucose + oxygen (in presence of light and chlorophyll)", method: "1 mark reactants, 1 mark products" },
      { q: "1.2", marks: 2, answer: "Glucose + oxygen → carbon dioxide + water (+ energy)", method: "1 mark reactants, 1 mark products" },
      { q: "2.1", marks: 3, answer: "Chloroplasts — contain chlorophyll which absorbs light energy for photosynthesis", method: "" },
    ],
    example: {
      question: "Write the word equation for photosynthesis and explain what each substance is used for.",
      steps: [
        "WORD EQUATION FOR PHOTOSYNTHESIS:",
        "   Carbon dioxide + Water  →  Glucose + Oxygen",
        "   (In the presence of: light energy and chlorophyll)",
        "",
        "WHAT EACH SUBSTANCE DOES:",
        "   Carbon dioxide (CO₂): raw material absorbed through stomata in leaves",
        "   Water (H₂O): raw material absorbed through roots; also used in photolysis",
        "   Light energy: provides energy to drive the reaction (absorbed by chlorophyll)",
        "   Chlorophyll: the green pigment in chloroplasts that captures light energy",
        "   Glucose (C₆H₁₂O₆): the product — used for energy (respiration), growth, and storage",
        "   Oxygen (O₂): the by-product — released through stomata",
        "",
        "SYMBOL EQUATION: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂"
      ]
    },
    guided: [
      { q: "1.1  Complete the word equation for photosynthesis:\n         ___________ + water → ___________ + ___________", a: "Carbon dioxide + water → glucose + oxygen", marks: 2 },
      { q: "1.2  Complete the word equation for aerobic respiration:\n         Glucose + ___________ → ___________ + water (+ energy)", a: "Glucose + oxygen → carbon dioxide + water (+ energy)", marks: 2 },
      { q: "1.3  Where in the cell does photosynthesis take place?", a: "In the chloroplasts (which contain chlorophyll).", marks: 1 },
    ],
    independent: [
      { q: "2.1  Explain why leaves are green.", a: "Leaves contain chlorophyll, a green pigment in chloroplasts. Chlorophyll absorbs red and blue light but reflects green light, which is why leaves appear green.", marks: 3 },
      { q: "2.2  Name THREE factors that can limit the rate of photosynthesis.", a: "Light intensity, carbon dioxide concentration, temperature (also water availability).", marks: 3 },
      { q: "2.3  A plant is placed in a dark room. Explain what happens to its rate of photosynthesis and why.", a: "Rate of photosynthesis falls to zero — no light means no light energy for the reaction. The plant still respires but cannot photosynthesise.", marks: 3 },
      { q: "2.4  Describe an experiment to investigate how light intensity affects the rate of photosynthesis in pondweed.", a: "Place pondweed in water + NaHCO₃ (CO₂ source). Count oxygen bubbles per minute at different distances from lamp. Control: temperature, CO₂ concentration. Repeat for reliability.", marks: 6 },
    ],
    challenge: "Explain why a plant kept in a sealed, transparent container in bright light will eventually stop growing, even though it has plenty of light and water.",
    challengeAnswer: "As the plant photosynthesises, it uses up all the CO₂ in the sealed container. CO₂ becomes the limiting factor — without it, photosynthesis cannot continue regardless of light or water. The plant will also eventually use up water.",
    extension: "Research: what is the difference between C3 and C4 photosynthesis? Why are C4 plants (like maize) more efficient in hot, dry conditions?"
  },
  // ── CHEMISTRY TOPICS ─────────────────────────────────────────────────────
  "atoms": {
    title: "Atoms, Elements and Compounds",
    objective: "Describe the structure of an atom. Distinguish between elements, compounds and mixtures. Interpret chemical formulae and equations.",
    priorKnowledge: "Students should know: matter is made of particles; the periodic table lists all elements; substances can be pure or mixed.",
    vocabulary: ["Atom", "Element", "Compound", "Mixture", "Proton", "Neutron", "Electron", "Nucleus", "Atomic number", "Mass number", "Chemical formula", "Chemical equation"],
    teacherNotes: "Use the Bohr model to introduce atomic structure. Emphasise the difference between elements (one type of atom), compounds (chemically bonded atoms of different elements) and mixtures (not chemically bonded). Common misconception: students confuse atomic number and mass number — atomic number = protons, mass number = protons + neutrons.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Protons and neutrons in the nucleus; electrons in shells/orbitals around the nucleus", method: "1 mark nucleus content, 1 mark electrons" },
      { q: "1.2", marks: 1, answer: "Atomic number = number of protons (= number of electrons in a neutral atom)", method: "" },
      { q: "2.1", marks: 2, answer: "Compound: two or more different elements chemically bonded together; can only be separated by chemical reactions", method: "1 mark definition, 1 mark separation" },
    ],
    example: {
      question: "Describe the structure of a sodium atom (atomic number 11, mass number 23).",
      steps: [
        "ATOMIC STRUCTURE OF SODIUM (Na):",
        "   Atomic number = 11 → 11 protons in the nucleus",
        "   In a neutral atom: protons = electrons → 11 electrons",
        "   Mass number = 23 → neutrons = 23 − 11 = 12 neutrons",
        "",
        "ELECTRON CONFIGURATION:",
        "   Shell 1: 2 electrons",
        "   Shell 2: 8 electrons",
        "   Shell 3: 1 electron",
        "   Written as: 2, 8, 1",
        "",
        "SUMMARY: Sodium has 11 protons, 12 neutrons, 11 electrons arranged 2,8,1"
      ]
    },
    guided: [
      { q: "1.1  An atom of carbon has atomic number 6 and mass number 12.\n         (a) How many protons does it have?\n         (b) How many neutrons does it have?\n         (c) How many electrons does it have?", a: "(a) 6 protons  (b) 6 neutrons (12−6)  (c) 6 electrons", marks: 3 },
      { q: "1.2  State the difference between an element and a compound.", a: "An element contains only one type of atom. A compound contains two or more different elements chemically bonded together.", marks: 2 },
      { q: "1.3  Is water (H₂O) an element, compound or mixture? Explain.", a: "Water is a compound — it contains hydrogen and oxygen atoms chemically bonded together.", marks: 2 },
    ],
    independent: [
      { q: "2.1  Explain why isotopes of the same element have the same chemical properties but different physical properties.", a: "Isotopes have the same number of protons and electrons (same atomic number) so they have the same electron configuration and react the same way chemically. However, they have different numbers of neutrons, giving them different mass numbers and therefore different physical properties such as density and melting point.", marks: 4 },
      { q: "2.2  Describe how you could separate a mixture of salt and sand. Explain each step.", a: "Add water to dissolve the salt (salt is soluble, sand is not). Filter to remove the sand. Evaporate the water from the filtrate to recover the salt. (Award 1 mark per correct step with explanation.)", marks: 3 },
      { q: "2.3  Magnesium (Mg, atomic number 12) reacts with oxygen to form magnesium oxide. Write the word equation and balanced symbol equation for this reaction.", a: "Word: Magnesium + oxygen → magnesium oxide. Symbol: 2Mg + O₂ → 2MgO", marks: 3 },
    ],
    challenge: "Explain why noble gases (Group 0) are unreactive, using your knowledge of electron configuration.",
    challengeAnswer: "Noble gases have a full outer electron shell (helium: 2; others: 8). A full outer shell is a very stable arrangement. Because they are already stable, noble gases have no tendency to gain, lose or share electrons — so they do not form chemical bonds and are essentially unreactive.",
    extension: "Research the development of the atomic model from Dalton to Bohr to the modern quantum model. How did each model improve on the previous one?"
  },
  "periodic-table": {
    title: "The Periodic Table",
    objective: "Describe the organisation of the periodic table. Explain trends in groups and periods. Predict properties of elements from their position.",
    priorKnowledge: "Students should know: elements are made of one type of atom; atoms have protons, neutrons and electrons; electron configuration determines chemical properties.",
    vocabulary: ["Period", "Group", "Metal", "Non-metal", "Alkali metal", "Halogen", "Noble gas", "Reactivity", "Electron configuration", "Atomic radius", "Ionisation energy"],
    teacherNotes: "Emphasise that the periodic table is arranged in order of increasing atomic number. Groups have the same number of outer electrons. Periods indicate the number of electron shells. Key groups to know: Group 1 (alkali metals), Group 7 (halogens), Group 0 (noble gases). Reactivity trends: Group 1 reactivity increases down the group; Group 7 reactivity decreases down the group.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Elements are arranged in order of increasing atomic number; elements with similar properties are in the same vertical column (group)", method: "1 mark each" },
      { q: "1.2", marks: 2, answer: "Group number = number of electrons in the outer shell; Period number = number of electron shells", method: "1 mark each" },
    ],
    example: {
      question: "Explain why lithium, sodium and potassium are all in Group 1 of the periodic table and show similar chemical properties.",
      steps: [
        "ELECTRON CONFIGURATIONS:",
        "   Lithium (Li):   2, 1  — 1 outer electron",
        "   Sodium (Na):    2, 8, 1  — 1 outer electron",
        "   Potassium (K):  2, 8, 8, 1  — 1 outer electron",
        "",
        "WHY THEY ARE IN GROUP 1:",
        "   All have 1 electron in their outer shell → placed in Group 1",
        "",
        "WHY THEY HAVE SIMILAR PROPERTIES:",
        "   Same number of outer electrons → same type of bonding behaviour",
        "   All readily lose 1 electron to form +1 ions",
        "   All react vigorously with water to produce hydrogen gas and a metal hydroxide"
      ]
    },
    guided: [
      { q: "1.1  Sodium has atomic number 11. Write its electron configuration and state which group and period it is in.", a: "Electron configuration: 2, 8, 1. Group 1 (1 outer electron). Period 3 (3 electron shells).", marks: 3 },
      { q: "1.2  State the trend in reactivity going down Group 1. Explain this trend.", a: "Reactivity increases going down Group 1. As you go down, the outer electron is in a higher energy shell, further from the nucleus. The nuclear attraction is weaker (more shielding), so the electron is lost more easily.", marks: 3 },
    ],
    independent: [
      { q: "2.1  Chlorine (Cl) and bromine (Br) are both in Group 7. Predict which is more reactive and explain why.", a: "Chlorine is more reactive. Going down Group 7, the outer shell is further from the nucleus and there is more electron shielding. Chlorine gains an electron more easily because its outer shell is closer to the nucleus with less shielding, so the nuclear attraction is stronger.", marks: 4 },
      { q: "2.2  An unknown element X is in Period 3, Group 2. Predict: (a) its electron configuration, (b) whether it is a metal or non-metal, (c) the charge of its ion.", a: "(a) 2, 8, 2  (b) Metal (Group 2 elements are all metals)  (c) 2+ ion (loses 2 outer electrons)", marks: 3 },
    ],
    challenge: "Explain why the atomic radius decreases across a period (left to right) but increases down a group.",
    challengeAnswer: "Across a period: the number of protons increases but electrons are added to the same shell. Greater nuclear charge pulls electrons closer to the nucleus, reducing atomic radius. Down a group: each successive element has an additional electron shell, which is further from the nucleus, so atomic radius increases despite increasing nuclear charge (shielding effect).",
    extension: "Research Mendeleev's original periodic table. How did he arrange elements, and why did he leave gaps? Which elements were later discovered to fill those gaps?"
  },
  "chemical-reactions": {
    title: "Chemical Reactions and Equations",
    objective: "Identify types of chemical reactions. Write and balance chemical equations. Describe exothermic and endothermic reactions.",
    priorKnowledge: "Students should know: atoms are rearranged in chemical reactions; mass is conserved; elements and compounds can react together.",
    vocabulary: ["Reactant", "Product", "Exothermic", "Endothermic", "Combustion", "Oxidation", "Reduction", "Neutralisation", "Precipitation", "Conservation of mass", "Balanced equation"],
    teacherNotes: "Emphasise conservation of mass — atoms are neither created nor destroyed. Balancing equations is a key skill. Exothermic reactions release energy (temperature rises); endothermic reactions absorb energy (temperature falls). Common reactions to know: combustion, neutralisation, precipitation, thermal decomposition.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Exothermic: releases energy to surroundings; temperature of surroundings increases. Examples: combustion, neutralisation, oxidation.", method: "1 mark definition, 1 mark example" },
      { q: "1.2", marks: 2, answer: "Endothermic: absorbs energy from surroundings; temperature of surroundings decreases. Examples: thermal decomposition, dissolving ammonium chloride.", method: "1 mark definition, 1 mark example" },
    ],
    example: {
      question: "Balance the equation for the combustion of methane: CH₄ + O₂ → CO₂ + H₂O",
      steps: [
        "STEP 1 — Count atoms on each side (unbalanced):",
        "   Left:  C=1, H=4, O=2",
        "   Right: C=1, H=2, O=3",
        "",
        "STEP 2 — Balance hydrogen first (H=4 on left, so need 2H₂O):",
        "   CH₄ + O₂ → CO₂ + 2H₂O",
        "   Left: C=1, H=4, O=2  |  Right: C=1, H=4, O=4",
        "",
        "STEP 3 — Balance oxygen (O=4 on right, so need 2O₂):",
        "   CH₄ + 2O₂ → CO₂ + 2H₂O",
        "   Left: C=1, H=4, O=4  |  Right: C=1, H=4, O=4  ✓",
        "",
        "BALANCED EQUATION: CH₄ + 2O₂ → CO₂ + 2H₂O"
      ]
    },
    guided: [
      { q: "1.1  Balance the following equation:\n         Mg + HCl → MgCl₂ + H₂", a: "Mg + 2HCl → MgCl₂ + H₂", marks: 1 },
      { q: "1.2  State the law of conservation of mass and explain what it means for chemical reactions.", a: "The total mass of reactants equals the total mass of products. In a chemical reaction, atoms are rearranged but not created or destroyed, so the total mass is conserved.", marks: 2 },
      { q: "1.3  Classify each reaction as exothermic or endothermic:\n         (a) Burning wood  (b) Cooking an egg  (c) Hand warmers", a: "(a) Exothermic  (b) Endothermic  (c) Exothermic", marks: 3 },
    ],
    independent: [
      { q: "2.1  Write the balanced symbol equation for the complete combustion of ethanol (C₂H₅OH).", a: "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O", marks: 2 },
      { q: "2.2  Explain why the temperature drops when ammonium chloride dissolves in water.", a: "Dissolving ammonium chloride is an endothermic process — it absorbs energy from the surroundings. This energy is used to break the ionic bonds in the solid. As energy is taken from the water, the temperature of the solution falls.", marks: 3 },
      { q: "2.3  A student burns 1.0 g of magnesium ribbon in air. She collects the magnesium oxide product and finds it has a mass of 1.67 g. Explain why the mass has increased.", a: "Magnesium reacts with oxygen from the air. The oxygen atoms bond to the magnesium atoms, adding their mass to the product. Total mass is conserved — the extra 0.67 g is the mass of oxygen that combined with the magnesium.", marks: 3 },
    ],
    challenge: "Explain, using bond energies, why combustion reactions are exothermic.",
    challengeAnswer: "In combustion, bonds in the fuel and oxygen are broken (endothermic step, requires energy input) and new bonds are formed in CO₂ and H₂O (exothermic step, releases energy). The energy released forming the new bonds is greater than the energy needed to break the original bonds, so the overall reaction releases energy — it is exothermic.",
    extension: "Research the difference between complete and incomplete combustion of hydrocarbons. What products are formed in each case and why is incomplete combustion dangerous?"
  },
  "acids-bases": {
    title: "Acids, Bases and Neutralisation",
    objective: "Describe the pH scale and properties of acids and alkalis. Write ionic equations for neutralisation. Explain titration and salt formation.",
    priorKnowledge: "Students should know: acids and alkalis are common substances; indicators change colour in acids and alkalis; pH is a measure of acidity.",
    vocabulary: ["Acid", "Alkali", "Base", "Neutralisation", "pH scale", "Indicator", "Salt", "Hydrogen ion", "Hydroxide ion", "Titration", "Concentration", "Mole"],
    teacherNotes: "pH scale: 0–6 acid, 7 neutral, 8–14 alkali. Strong acids fully dissociate (HCl, H₂SO₄, HNO₃); weak acids partially dissociate (ethanoic acid). Neutralisation: acid + base → salt + water. The ionic equation for neutralisation is always H⁺ + OH⁻ → H₂O. Titration is used to find the concentration of an unknown acid or alkali.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Acids produce H⁺ ions in solution; pH below 7. Alkalis produce OH⁻ ions in solution; pH above 7.", method: "1 mark each" },
      { q: "1.2", marks: 1, answer: "Neutralisation: acid + base → salt + water", method: "" },
    ],
    example: {
      question: "Write the balanced equation for the reaction between hydrochloric acid and sodium hydroxide. Name the salt formed.",
      steps: [
        "WORD EQUATION:",
        "   Hydrochloric acid + sodium hydroxide → sodium chloride + water",
        "",
        "BALANCED SYMBOL EQUATION:",
        "   HCl + NaOH → NaCl + H₂O",
        "",
        "IONIC EQUATION (for all neutralisation reactions):",
        "   H⁺(aq) + OH⁻(aq) → H₂O(l)",
        "",
        "SALT FORMED: Sodium chloride (NaCl) — common table salt",
        "",
        "NAMING SALTS: first part from the metal/base, second part from the acid",
        "   HCl → chloride salts",
        "   H₂SO₄ → sulfate salts",
        "   HNO₃ → nitrate salts"
      ]
    },
    guided: [
      { q: "1.1  Write the word equation for the reaction between sulfuric acid and potassium hydroxide.", a: "Sulfuric acid + potassium hydroxide → potassium sulfate + water", marks: 2 },
      { q: "1.2  A solution has a pH of 2. State whether it is acidic, neutral or alkaline, and describe what happens when universal indicator is added.", a: "pH 2 is strongly acidic. Universal indicator turns red.", marks: 2 },
      { q: "1.3  Write the ionic equation for any neutralisation reaction.", a: "H⁺(aq) + OH⁻(aq) → H₂O(l)", marks: 2 },
    ],
    independent: [
      { q: "2.1  In a titration, 25.0 cm³ of sodium hydroxide solution is neutralised by 20.0 cm³ of 0.1 mol/dm³ hydrochloric acid. Calculate the concentration of the sodium hydroxide solution.", a: "Moles HCl = 0.1 × 20.0/1000 = 0.002 mol. Ratio HCl:NaOH = 1:1, so moles NaOH = 0.002 mol. Concentration NaOH = 0.002 / (25.0/1000) = 0.08 mol/dm³.", marks: 4 },
      { q: "2.2  Explain the difference between a strong acid and a weak acid. Give one example of each.", a: "A strong acid fully dissociates in water to produce H⁺ ions (e.g. hydrochloric acid, HCl). A weak acid only partially dissociates, so only a small proportion of molecules release H⁺ ions (e.g. ethanoic acid, CH₃COOH). At the same concentration, a strong acid has a lower pH than a weak acid.", marks: 4 },
    ],
    challenge: "A student adds excess calcium carbonate to hydrochloric acid. Describe what they observe and write the balanced equation. Explain why excess carbonate is used.",
    challengeAnswer: "Observations: fizzing/bubbling (CO₂ gas produced); solid dissolves; eventually fizzing stops when acid is used up. Equation: CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂. Excess carbonate ensures all the acid reacts — the carbonate is the limiting factor, guaranteeing complete neutralisation of the acid.",
    extension: "Research the industrial manufacture of ammonia by the Haber process. Why is the pH of the ocean changing, and what effect does this have on marine life?"
  },
  "electricity": {
    title: "Electricity and Circuits",
    objective: "Describe current, voltage and resistance. Apply Ohm's Law. Analyse series and parallel circuits. Describe electrical power and energy.",
    priorKnowledge: "Students should know: circuits need a complete loop; batteries provide energy; some materials conduct electricity and others do not.",
    vocabulary: ["Current", "Voltage", "Resistance", "Ohm's Law", "Series circuit", "Parallel circuit", "Ammeter", "Voltmeter", "Power", "Energy", "Coulomb", "Ohm"],
    teacherNotes: "Key equations: V = IR (Ohm's Law); P = IV; E = Pt. In series circuits: current is the same throughout; voltages add up; resistances add up. In parallel circuits: voltage is the same across each branch; currents add up; total resistance is less than the smallest individual resistance. Common misconception: students think current is 'used up' in a circuit — emphasise charge is conserved.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Current (I) is the rate of flow of charge, measured in amperes (A). Voltage (V) is the energy transferred per unit charge, measured in volts (V).", method: "1 mark each" },
      { q: "1.2", marks: 2, answer: "V = IR; rearranged: I = V/R and R = V/I. Ohm's Law states that current through a conductor is directly proportional to the voltage across it (at constant temperature).", method: "" },
    ],
    example: {
      question: "A resistor has a resistance of 10 Ω. A voltage of 5 V is applied across it. Calculate the current through the resistor.",
      steps: [
        "GIVEN:",
        "   Resistance R = 10 Ω",
        "   Voltage V = 5 V",
        "",
        "FORMULA: V = IR  →  rearrange to find I:",
        "   I = V ÷ R",
        "",
        "CALCULATION:",
        "   I = 5 ÷ 10 = 0.5 A",
        "",
        "ANSWER: The current through the resistor is 0.5 A (amperes)",
        "",
        "UNITS CHECK: V ÷ Ω = A  ✓"
      ]
    },
    guided: [
      { q: "1.1  A lamp has a resistance of 20 Ω and a current of 0.3 A flows through it. Calculate the voltage across the lamp.", a: "V = IR = 0.3 × 20 = 6 V", marks: 2 },
      { q: "1.2  State TWO differences between a series circuit and a parallel circuit.", a: "Series: current is the same throughout; if one component breaks, the whole circuit stops. Parallel: voltage is the same across each branch; if one component breaks, others continue to work.", marks: 2 },
      { q: "1.3  Calculate the power of a device that draws a current of 2 A from a 230 V supply.", a: "P = IV = 2 × 230 = 460 W", marks: 2 },
    ],
    independent: [
      { q: "2.1  Two resistors of 6 Ω and 12 Ω are connected in parallel. Calculate the total resistance of the combination.", a: "1/R_total = 1/6 + 1/12 = 2/12 + 1/12 = 3/12 = 1/4. Therefore R_total = 4 Ω.", marks: 3 },
      { q: "2.2  A 60 W light bulb is left on for 3 hours. Calculate the energy transferred in joules.", a: "E = Pt = 60 × (3 × 3600) = 60 × 10,800 = 648,000 J (648 kJ)", marks: 3 },
      { q: "2.3  Explain why adding more lamps in parallel to a circuit increases the total current drawn from the battery.", a: "Each lamp in parallel provides an additional current path. The voltage across each lamp remains the same (equal to the battery voltage). Each lamp draws its own current (I = V/R). The total current is the sum of the individual branch currents, so total current increases as more lamps are added.", marks: 4 },
    ],
    challenge: "A student measures the current through a filament lamp at different voltages and finds the I-V graph is not a straight line. Explain why, and what this tells us about the lamp's resistance.",
    challengeAnswer: "A filament lamp does not obey Ohm's Law — it is a non-ohmic conductor. As current increases, the filament heats up. Higher temperature increases the resistance of the metal filament (more collisions between electrons and vibrating ions). So resistance increases with temperature, causing the I-V graph to curve (gradient decreases at higher voltages).",
    extension: "Research how a diode works and sketch the I-V characteristic curve for a diode. How is a diode used in rectification?"
  },
  "waves": {
    title: "Waves — Properties and Types",
    objective: "Describe the properties of transverse and longitudinal waves. Calculate wave speed, frequency and wavelength. Describe reflection, refraction and the electromagnetic spectrum.",
    priorKnowledge: "Students should know: waves transfer energy; sound and light are types of waves; waves have amplitude and frequency.",
    vocabulary: ["Wavelength", "Frequency", "Amplitude", "Wave speed", "Transverse", "Longitudinal", "Reflection", "Refraction", "Diffraction", "Electromagnetic spectrum", "Hertz"],
    teacherNotes: "Key equation: wave speed = frequency × wavelength (v = fλ). Transverse waves: oscillations perpendicular to direction of travel (light, water waves). Longitudinal waves: oscillations parallel to direction of travel (sound). The electromagnetic spectrum in order: radio, microwave, infrared, visible, ultraviolet, X-ray, gamma. All EM waves travel at 3 × 10⁸ m/s in a vacuum.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Transverse: oscillations perpendicular to direction of energy transfer (e.g. light). Longitudinal: oscillations parallel to direction of energy transfer (e.g. sound).", method: "1 mark each" },
      { q: "1.2", marks: 2, answer: "v = fλ; wave speed (m/s) = frequency (Hz) × wavelength (m)", method: "" },
    ],
    example: {
      question: "A wave has a frequency of 200 Hz and a wavelength of 1.5 m. Calculate its wave speed.",
      steps: [
        "GIVEN:",
        "   Frequency f = 200 Hz",
        "   Wavelength λ = 1.5 m",
        "",
        "FORMULA: v = fλ",
        "",
        "CALCULATION:",
        "   v = 200 × 1.5 = 300 m/s",
        "",
        "ANSWER: Wave speed = 300 m/s",
        "",
        "UNITS CHECK: Hz × m = (1/s) × m = m/s  ✓"
      ]
    },
    guided: [
      { q: "1.1  A radio wave has a frequency of 100 MHz (1 × 10⁸ Hz) and travels at 3 × 10⁸ m/s. Calculate its wavelength.", a: "λ = v/f = (3 × 10⁸) / (1 × 10⁸) = 3 m", marks: 2 },
      { q: "1.2  State the order of the electromagnetic spectrum from longest to shortest wavelength.", a: "Radio → Microwave → Infrared → Visible light → Ultraviolet → X-rays → Gamma rays", marks: 2 },
      { q: "1.3  Explain what happens to a light ray when it passes from air into glass (refraction).", a: "The light slows down as it enters the denser glass. If it hits the boundary at an angle, it bends towards the normal. The wavelength decreases but the frequency stays the same.", marks: 3 },
    ],
    independent: [
      { q: "2.1  Explain the difference between the amplitude and the frequency of a wave. How does each affect what we hear for a sound wave?", a: "Amplitude is the maximum displacement from the rest position — for sound, greater amplitude means louder sound. Frequency is the number of complete waves per second — for sound, higher frequency means higher pitch.", marks: 4 },
      { q: "2.2  Describe one use and one hazard of ultraviolet radiation.", a: "Use: detecting forged banknotes (fluorescent ink glows under UV); sterilising water/surfaces; treating skin conditions. Hazard: causes sunburn; can damage DNA in skin cells, increasing risk of skin cancer.", marks: 2 },
    ],
    challenge: "Explain why sound cannot travel through a vacuum but light can.",
    challengeAnswer: "Sound is a longitudinal mechanical wave — it requires a medium (particles) to travel through, as it is caused by the compression and rarefaction of particles. A vacuum has no particles, so sound cannot propagate. Light is an electromagnetic wave — it consists of oscillating electric and magnetic fields that do not require a medium. Electromagnetic waves can therefore travel through a vacuum at 3 × 10⁸ m/s.",
    extension: "Research how seismic waves (P-waves and S-waves) have been used to determine the internal structure of the Earth."
  },
  "energy": {
    title: "Energy Transfers and Resources",
    objective: "Describe different energy stores and pathways. Apply the principle of conservation of energy. Compare renewable and non-renewable energy resources.",
    priorKnowledge: "Students should know: energy cannot be created or destroyed; fuels store energy; electricity is generated in power stations.",
    vocabulary: ["Kinetic energy", "Potential energy", "Thermal energy", "Chemical energy", "Elastic energy", "Conservation of energy", "Efficiency", "Renewable", "Non-renewable", "Joule", "Watt"],
    teacherNotes: "Energy is always conserved — it is transferred between stores, not created or destroyed. Key equations: KE = ½mv²; GPE = mgh; efficiency = (useful output / total input) × 100%. Renewable sources: solar, wind, hydroelectric, tidal, geothermal, biomass. Non-renewable: coal, oil, natural gas, nuclear (uranium). Emphasise that 'wasted' energy is not lost — it is dissipated as thermal energy.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Kinetic energy: energy of a moving object. KE = ½mv². Gravitational potential energy: energy stored due to position in a gravitational field. GPE = mgh.", method: "1 mark each with formula" },
      { q: "1.2", marks: 2, answer: "Efficiency = (useful energy output / total energy input) × 100%. A more efficient device wastes less energy as heat/sound.", method: "" },
    ],
    example: {
      question: "A ball of mass 0.5 kg is dropped from a height of 10 m. Calculate its kinetic energy just before it hits the ground (assume no air resistance).",
      steps: [
        "STEP 1 — Calculate the gravitational potential energy at the top:",
        "   GPE = mgh = 0.5 × 10 × 10 = 50 J",
        "   (using g = 10 m/s²)",
        "",
        "STEP 2 — Apply conservation of energy:",
        "   All GPE converts to KE (no air resistance)",
        "   KE = GPE = 50 J",
        "",
        "ANSWER: Kinetic energy just before impact = 50 J",
        "",
        "BONUS — find the velocity:",
        "   KE = ½mv²  →  50 = ½ × 0.5 × v²  →  v² = 200  →  v = 14.1 m/s"
      ]
    },
    guided: [
      { q: "1.1  A car of mass 1,200 kg is travelling at 20 m/s. Calculate its kinetic energy.", a: "KE = ½mv² = ½ × 1200 × 20² = ½ × 1200 × 400 = 240,000 J (240 kJ)", marks: 2 },
      { q: "1.2  A light bulb is 15% efficient. If 100 J of electrical energy is supplied, calculate the useful light energy output and the wasted energy.", a: "Useful light energy = 15% × 100 = 15 J. Wasted energy (heat) = 85 J.", marks: 2 },
      { q: "1.3  State TWO advantages and ONE disadvantage of wind power compared to coal.", a: "Advantages: renewable (will not run out); no CO₂ emissions during operation. Disadvantage: intermittent (only generates when wind blows); visual/noise impact; lower power output per unit area.", marks: 3 },
    ],
    independent: [
      { q: "2.1  A hydroelectric dam generates 500 MW of power. Calculate the energy generated in one day.", a: "E = Pt = 500 × 10⁶ × (24 × 3600) = 500 × 10⁶ × 86,400 = 4.32 × 10¹³ J (43.2 TJ)", marks: 3 },
      { q: "2.2  Explain why burning fossil fuels contributes to climate change.", a: "Fossil fuels contain carbon compounds. When burned, they release CO₂ (and other greenhouse gases). CO₂ in the atmosphere traps infrared radiation emitted by the Earth's surface (the greenhouse effect). This causes the Earth's average temperature to rise — global warming — leading to climate change.", marks: 4 },
    ],
    challenge: "A pumped-storage hydroelectric system pumps water uphill when electricity demand is low and releases it downhill to generate electricity when demand is high. Calculate the efficiency of the system if 1,000 MJ of electrical energy is used to pump the water up, but only 750 MJ of electrical energy is generated when it flows back down.",
    challengeAnswer: "Efficiency = (useful output / total input) × 100% = (750 / 1000) × 100% = 75%. The 25% energy loss is due to friction in pumps and turbines, electrical resistance in generators, and some energy dissipated as heat and sound.",
    extension: "Research the energy mix of the UK electricity grid. How has it changed over the past 20 years, and what are the targets for renewable energy by 2030?"
  },
  "cell-biology": {
    title: "Cell Biology — Structure and Function",
    objective: "Compare animal, plant and bacterial cells. Describe cell specialisation and organisation. Explain diffusion, osmosis and active transport.",
    priorKnowledge: "Students should know: living things are made of cells; cells are the basic unit of life; organisms can be unicellular or multicellular.",
    vocabulary: ["Cell membrane", "Nucleus", "Cytoplasm", "Mitochondria", "Cell wall", "Chloroplast", "Vacuole", "Ribosome", "Prokaryote", "Eukaryote", "Diffusion", "Osmosis"],
    teacherNotes: "Use microscopy practical to make cells tangible. Emphasise that the cell wall is NOT the same as the cell membrane. Common misconception: students think plant cells always have chloroplasts — only cells in green parts of the plant do. For transport: diffusion = passive, high to low concentration; osmosis = water movement through semi-permeable membrane; active transport = against concentration gradient, requires energy (ATP).",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Prokaryotic cells: no nucleus (DNA is free in cytoplasm), smaller, no membrane-bound organelles. Eukaryotic cells: have a nucleus containing DNA, larger, have membrane-bound organelles.", method: "1 mark each" },
      { q: "1.2", marks: 2, answer: "Osmosis: movement of water molecules from a region of higher water potential (dilute solution) to a region of lower water potential (concentrated solution) through a partially permeable membrane.", method: "" },
    ],
    example: {
      question: "Describe three differences between a plant cell and an animal cell.",
      steps: [
        "PLANT CELL has — ANIMAL CELL does NOT have:",
        "   1. Cell wall (made of cellulose) — provides structural support and rigidity",
        "   2. Chloroplasts (in green parts) — contain chlorophyll for photosynthesis",
        "   3. Large permanent vacuole — filled with cell sap, maintains turgor pressure",
        "",
        "BOTH plant and animal cells have:",
        "   Cell membrane, nucleus, cytoplasm, mitochondria, ribosomes",
        "",
        "REMEMBER: Not all plant cells have chloroplasts (e.g. root cells are underground)"
      ]
    },
    guided: [
      { q: "1.1  Name THREE structures found in both plant and animal cells.", a: "Any three from: cell membrane, nucleus, cytoplasm, mitochondria, ribosomes.", marks: 3 },
      { q: "1.2  Explain why red blood cells have no nucleus.", a: "Red blood cells are specialised to carry oxygen. Having no nucleus means more space for haemoglobin (the oxygen-carrying protein). The cell is also more flexible and can squeeze through narrow capillaries.", marks: 3 },
      { q: "1.3  Describe what happens to a plant cell when it is placed in a concentrated salt solution.", a: "Water moves out of the cell by osmosis (from high water potential inside to low water potential outside). The vacuole shrinks, the cytoplasm pulls away from the cell wall — the cell becomes plasmolysed.", marks: 3 },
    ],
    independent: [
      { q: "2.1  Explain the difference between diffusion and active transport.", a: "Diffusion: passive movement of particles from high to low concentration; no energy required; moves down the concentration gradient. Active transport: movement of particles against the concentration gradient (low to high); requires energy (ATP) from respiration; uses carrier proteins in the cell membrane.", marks: 4 },
      { q: "2.2  A student places potato cylinders in solutions of different concentrations and measures the change in mass. Explain the results: (a) in distilled water the mass increases; (b) in a concentrated salt solution the mass decreases.", a: "(a) In distilled water: water potential outside > water potential inside the potato. Water enters the potato cells by osmosis, causing them to swell (become turgid) — mass increases. (b) In concentrated salt solution: water potential outside < water potential inside. Water leaves the potato cells by osmosis — cells lose water, become flaccid — mass decreases.", marks: 4 },
    ],
    challenge: "Explain why cystic fibrosis affects the lungs and digestive system, linking your answer to cell biology.",
    challengeAnswer: "Cystic fibrosis is caused by a faulty CFTR gene. The CFTR protein normally acts as a chloride ion channel in cell membranes. Without it, chloride ions accumulate inside cells. This lowers the water potential inside cells, so water moves into cells by osmosis rather than out. This causes the mucus produced by cells lining the lungs and digestive system to be thick and sticky rather than thin and watery. Thick mucus blocks airways (causing breathing difficulties) and blocks the pancreatic duct (reducing enzyme release, causing digestive problems).",
    extension: "Research stem cell therapy. What are the ethical arguments for and against using embryonic stem cells to treat diseases?"
  },
  "infection-response": {
    title: "Infection and Response",
    objective: "Describe how pathogens cause disease. Explain the body's defence mechanisms. Describe how vaccines and medicines work.",
    priorKnowledge: "Students should know: microorganisms can cause disease; the immune system protects the body; vaccines prevent disease.",
    vocabulary: ["Pathogen", "Bacteria", "Virus", "Fungi", "Protist", "Antibody", "Antigen", "Phagocytosis", "Lymphocyte", "Vaccine", "Antibiotic", "Immunity"],
    teacherNotes: "Key distinction: bacteria are living cells that can be killed by antibiotics; viruses are not living and cannot be treated with antibiotics (antivirals are used instead). The immune response: phagocytes engulf pathogens (non-specific); lymphocytes produce antibodies specific to antigens (specific). Vaccination: introduces antigens (weakened/dead pathogen) to stimulate antibody production without causing disease.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Bacteria: living cells; reproduce by binary fission; can be killed by antibiotics. Viruses: not living; replicate inside host cells; cannot be treated with antibiotics (use antivirals).", method: "1 mark each" },
      { q: "1.2", marks: 3, answer: "Vaccines contain weakened/dead pathogens or their antigens. These stimulate the immune system to produce antibodies and memory cells. If the real pathogen enters later, memory cells rapidly produce large amounts of antibodies to destroy it before it causes disease.", method: "" },
    ],
    example: {
      question: "Explain how the body responds to a bacterial infection.",
      steps: [
        "STEP 1 — DETECTION:",
        "   Bacteria enter the body and release toxins",
        "   White blood cells detect foreign antigens on the bacteria",
        "",
        "STEP 2 — NON-SPECIFIC RESPONSE (Phagocytosis):",
        "   Phagocytes engulf and digest the bacteria",
        "   This is non-specific — works against any pathogen",
        "",
        "STEP 3 — SPECIFIC IMMUNE RESPONSE:",
        "   Lymphocytes recognise specific antigens on the bacteria",
        "   Lymphocytes produce specific antibodies that bind to the antigens",
        "   Antibodies neutralise toxins and mark bacteria for destruction",
        "",
        "STEP 4 — MEMORY CELLS:",
        "   Memory lymphocytes remain after infection",
        "   On re-exposure, they rapidly produce antibodies — faster immune response"
      ]
    },
    guided: [
      { q: "1.1  Name FOUR types of pathogen.", a: "Bacteria, viruses, fungi, protists", marks: 4 },
      { q: "1.2  Explain why antibiotics cannot be used to treat viral infections.", a: "Antibiotics work by targeting structures found in bacteria (e.g. cell walls, ribosomes). Viruses do not have these structures — they replicate inside host cells using the host's own machinery. Antibiotics have no target in viruses and therefore cannot kill them.", marks: 3 },
      { q: "1.3  Describe how a vaccine protects against future infection.", a: "A vaccine introduces antigens (from weakened/dead pathogens) into the body. The immune system responds by producing antibodies and memory cells. If the real pathogen enters later, memory cells quickly produce large amounts of the correct antibodies, destroying the pathogen before it causes disease.", marks: 4 },
    ],
    independent: [
      { q: "2.1  Explain why new vaccines need to be developed each year for influenza (flu).", a: "Influenza viruses mutate rapidly, changing the antigens on their surface. The antibodies and memory cells produced in response to last year's flu strain no longer recognise the new antigens. A new vaccine is needed each year to match the current strain's antigens and stimulate production of the correct antibodies.", marks: 4 },
      { q: "2.2  Evaluate the use of antibiotics in modern medicine, including the risk of antibiotic resistance.", a: "Antibiotics have saved millions of lives by treating bacterial infections. However, overuse and misuse (e.g. not completing courses, use in farming) has led to natural selection of antibiotic-resistant bacteria (e.g. MRSA). Resistant strains are harder to treat. To reduce resistance: complete antibiotic courses; do not use antibiotics for viral infections; develop new antibiotics.", marks: 6 },
    ],
    challenge: "Explain how herd immunity works and why it is important for people who cannot be vaccinated.",
    challengeAnswer: "Herd immunity occurs when a large proportion of a population is immune to a disease (through vaccination or previous infection). This reduces the likelihood of an infected person encountering a susceptible person, breaking the chain of transmission. Even people who cannot be vaccinated (e.g. newborns, immunocompromised patients) are protected because the pathogen cannot spread easily through the population. The threshold for herd immunity varies by disease — for measles it is approximately 95%.",
    extension: "Research the development of the COVID-19 mRNA vaccines. How do they differ from traditional vaccines, and what are their advantages?"
  },
  "genetics": {
    title: "Genetics, Inheritance and Evolution",
    objective: "Describe DNA structure and the genetic code. Explain inheritance using Punnett squares. Describe natural selection and evolution.",
    priorKnowledge: "Students should know: offspring inherit characteristics from parents; DNA carries genetic information; variation exists within species.",
    vocabulary: ["DNA", "Gene", "Allele", "Dominant", "Recessive", "Genotype", "Phenotype", "Homozygous", "Heterozygous", "Punnett square", "Natural selection", "Evolution"],
    teacherNotes: "DNA is a double helix made of nucleotides (sugar, phosphate, base). Each gene codes for a protein. Alleles are different versions of a gene. Dominant alleles are expressed when present; recessive alleles are only expressed when homozygous. Punnett squares show the probability of offspring genotypes. Natural selection: variation → selection pressure → survival of the fittest → reproduction → inherited by offspring.",
    markScheme: [
      { q: "1.1", marks: 3, answer: "DNA is a double helix. It is made of nucleotides, each containing a sugar (deoxyribose), a phosphate group, and one of four bases (A, T, C, G). Complementary base pairs: A-T and C-G, held by hydrogen bonds.", method: "" },
      { q: "1.2", marks: 4, answer: "Punnett square for Tt × Tt: TT (25%), Tt (50%), tt (25%). Phenotype ratio: 3 tall : 1 short (if T = tall is dominant).", method: "" },
    ],
    example: {
      question: "Cystic fibrosis is caused by a recessive allele (f). Two carrier parents (Ff × Ff) have children. Calculate the probability of a child having cystic fibrosis.",
      steps: [
        "PUNNETT SQUARE (Ff × Ff):",
        "         F        f",
        "   F  |  FF  |  Ff  |",
        "   f  |  Ff  |  ff  |",
        "",
        "GENOTYPE RATIOS:",
        "   FF : Ff : ff = 1 : 2 : 1",
        "   (25% FF, 50% Ff, 25% ff)",
        "",
        "PHENOTYPE:",
        "   ff = cystic fibrosis (homozygous recessive)",
        "   FF and Ff = unaffected (F is dominant)",
        "",
        "PROBABILITY of having cystic fibrosis = 25% (1 in 4)",
        "PROBABILITY of being a carrier = 50% (2 in 4)"
      ]
    },
    guided: [
      { q: "1.1  Define the terms: (a) genotype  (b) phenotype  (c) heterozygous", a: "(a) Genotype: the genetic makeup of an organism (the alleles it carries, e.g. Tt). (b) Phenotype: the observable characteristics of an organism (e.g. tall). (c) Heterozygous: having two different alleles for a gene (e.g. Tt).", marks: 3 },
      { q: "1.2  In pea plants, tall (T) is dominant over short (t). Cross a homozygous tall plant (TT) with a short plant (tt). Draw a Punnett square and state the phenotype ratio of the offspring.", a: "All offspring are Tt (heterozygous). All offspring are tall. Phenotype ratio: 4 tall : 0 short (100% tall).", marks: 3 },
    ],
    independent: [
      { q: "2.1  Explain how natural selection leads to evolution over many generations, using antibiotic resistance in bacteria as an example.", a: "In a population of bacteria, random mutations cause variation in antibiotic resistance. When antibiotics are used, bacteria without resistance are killed (selection pressure). Resistant bacteria survive and reproduce, passing on the resistance allele. Over many generations, the proportion of resistant bacteria increases. Eventually, the entire population may be resistant — the species has evolved.", marks: 6 },
      { q: "2.2  Explain the difference between continuous and discontinuous variation. Give one example of each.", a: "Continuous variation: characteristics that show a range of values with no distinct categories (e.g. height, mass, foot size). Discontinuous variation: characteristics that fall into distinct categories with no intermediate values (e.g. blood group, tongue rolling ability, sex).", marks: 4 },
    ],
    challenge: "Explain why identical twins may have different phenotypes despite having identical genotypes.",
    challengeAnswer: "Identical (monozygotic) twins have the same DNA sequence. However, phenotype is determined by both genotype AND environment. Environmental factors such as diet, exercise, sun exposure, stress, and disease can affect how genes are expressed (epigenetics). For example, one twin may develop a disease if exposed to a trigger while the other is not. Gene expression can also be influenced by methylation of DNA, which can differ between twins over time.",
    extension: "Research epigenetics. How can environmental factors affect gene expression without changing the DNA sequence? Give two examples."
  },
  "homeostasis": {
    title: "Homeostasis and Response",
    objective: "Explain the importance of homeostasis. Describe the nervous system and reflex arc. Describe hormonal control including blood glucose regulation.",
    priorKnowledge: "Students should know: the body needs to maintain stable internal conditions; the brain controls many body functions; hormones are chemical messengers.",
    vocabulary: ["Homeostasis", "Stimulus", "Receptor", "Effector", "Reflex arc", "Synapse", "Hormone", "Insulin", "Glucagon", "Pancreas", "Negative feedback", "Thermoregulation"],
    teacherNotes: "Homeostasis maintains optimal conditions for enzyme activity. Key examples: body temperature (37°C), blood glucose, water balance. Nervous system: stimulus → receptor → sensory neurone → relay neurone → motor neurone → effector. Reflex arcs bypass the brain for speed. Hormonal control: slower but longer-lasting. Blood glucose: insulin (lowers glucose, released by pancreas when glucose is high); glucagon (raises glucose, released when glucose is low). Negative feedback is the key mechanism.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Homeostasis: the maintenance of a stable internal environment within narrow limits, despite changes in external conditions. Important because enzymes and cells function optimally only within specific temperature, pH and concentration ranges.", method: "" },
      { q: "1.2", marks: 4, answer: "Reflex arc: stimulus → receptor → sensory neurone → relay neurone (in spinal cord) → motor neurone → effector (muscle or gland). Bypasses the brain for a faster response.", method: "" },
    ],
    example: {
      question: "Describe how the body responds to a rise in blood glucose concentration after a meal.",
      steps: [
        "STEP 1 — DETECTION:",
        "   Blood glucose rises after eating carbohydrates",
        "   The pancreas (beta cells) detects the rise in blood glucose",
        "",
        "STEP 2 — HORMONE RELEASE:",
        "   Pancreas releases insulin into the bloodstream",
        "",
        "STEP 3 — RESPONSE:",
        "   Insulin causes liver and muscle cells to absorb glucose from the blood",
        "   Glucose is converted to glycogen for storage (glycogenesis)",
        "   Blood glucose level falls back to normal",
        "",
        "STEP 4 — NEGATIVE FEEDBACK:",
        "   When blood glucose returns to normal, insulin release stops",
        "   This is negative feedback — the response counteracts the change"
      ]
    },
    guided: [
      { q: "1.1  State THREE conditions that are regulated by homeostasis in the human body.", a: "Any three from: body temperature, blood glucose concentration, water content (osmolarity), blood CO₂ concentration, blood pH.", marks: 3 },
      { q: "1.2  Describe the role of glucagon in blood glucose regulation.", a: "When blood glucose falls below normal, the pancreas (alpha cells) releases glucagon. Glucagon causes the liver to break down glycogen into glucose (glycogenolysis) and release it into the blood. Blood glucose rises back to normal.", marks: 3 },
      { q: "1.3  Explain why a reflex action is faster than a voluntary response.", a: "A reflex arc bypasses the brain — the signal travels from receptor to spinal cord and back to the effector without going to the brain. This shorter pathway means the response is faster. Voluntary responses require signals to travel to the brain for processing, which takes longer.", marks: 3 },
    ],
    independent: [
      { q: "2.1  Compare Type 1 and Type 2 diabetes, including their causes and treatments.", a: "Type 1: autoimmune condition where the immune system destroys insulin-producing beta cells in the pancreas. No insulin is produced. Treatment: insulin injections. Type 2: body cells become resistant to insulin, or the pancreas produces insufficient insulin. Associated with obesity and poor diet. Treatment: diet and exercise, medication (e.g. metformin), sometimes insulin.", marks: 6 },
      { q: "2.2  Explain how the body responds to overheating (hyperthermia).", a: "Thermoreceptors in the skin and hypothalamus detect the rise in temperature. The hypothalamus sends signals to effectors: (1) sweat glands produce sweat — evaporation cools the skin; (2) blood vessels in the skin vasodilate — more blood flows near the surface, increasing heat loss by radiation; (3) hairs lie flat — reduces insulating air layer. Body temperature falls back to 37°C (negative feedback).", marks: 5 },
    ],
    challenge: "Explain why people with untreated Type 1 diabetes may have glucose in their urine.",
    challengeAnswer: "Normally, glucose is filtered from the blood in the kidney but is completely reabsorbed back into the blood by active transport in the kidney tubules. In Type 1 diabetes, blood glucose is very high (no insulin to lower it). The concentration of glucose in the filtrate exceeds the maximum reabsorption capacity of the kidney tubules. The excess glucose cannot all be reabsorbed and passes into the urine — this is called glycosuria.",
    extension: "Research the role of the hypothalamus as the body's 'thermostat'. How does it communicate with the rest of the body to regulate temperature?"
  },
  "ecology": {
    title: "Ecology — Ecosystems and Biodiversity",
    objective: "Describe the organisation of ecosystems. Explain feeding relationships and nutrient cycles. Describe factors affecting biodiversity and conservation.",
    priorKnowledge: "Students should know: organisms depend on each other and their environment; food chains show feeding relationships; humans affect the environment.",
    vocabulary: ["Ecosystem", "Population", "Community", "Habitat", "Producer", "Consumer", "Decomposer", "Food web", "Biodiversity", "Carbon cycle", "Nitrogen cycle", "Conservation"],
    teacherNotes: "Hierarchy: organism → population → community → ecosystem → biosphere. Producers make their own food (photosynthesis); primary consumers eat producers; secondary consumers eat primary consumers. Decomposers break down dead material, recycling nutrients. Biodiversity is important for ecosystem stability. Human threats: deforestation, pollution, climate change, overfishing. Conservation: protected areas, captive breeding, seed banks.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "A food web shows the feeding relationships between multiple organisms in an ecosystem. It is more realistic than a food chain as most organisms eat more than one type of food.", method: "" },
      { q: "1.2", marks: 3, answer: "Decomposers (bacteria and fungi) break down dead organisms and waste products. They release nutrients (e.g. nitrates, phosphates) back into the soil, making them available for plants. This is essential for nutrient cycling.", method: "" },
    ],
    example: {
      question: "Describe the carbon cycle and explain how human activities are disrupting it.",
      steps: [
        "THE CARBON CYCLE — key processes:",
        "   1. PHOTOSYNTHESIS: plants absorb CO₂ from atmosphere, fix carbon into glucose",
        "   2. RESPIRATION: all organisms release CO₂ back to atmosphere",
        "   3. FEEDING: carbon passes along food chains",
        "   4. DECOMPOSITION: decomposers break down dead matter, releasing CO₂",
        "   5. FOSSILISATION: some carbon stored in fossil fuels over millions of years",
        "",
        "HUMAN DISRUPTION:",
        "   Burning fossil fuels: releases stored carbon as CO₂ rapidly",
        "   Deforestation: removes trees that absorb CO₂; burning releases more CO₂",
        "   Both increase atmospheric CO₂ → enhanced greenhouse effect → climate change"
      ]
    },
    guided: [
      { q: "1.1  Define the term 'biodiversity' and explain why it is important.", a: "Biodiversity: the variety of different species in an ecosystem (and the genetic variation within species). Important because: greater biodiversity means more stable ecosystems; more resilience to environmental change; more resources for medicine, food and industry.", marks: 3 },
      { q: "1.2  Explain what happens to the population of foxes if the rabbit population suddenly decreases.", a: "Rabbits are a food source for foxes. If rabbit numbers decrease, foxes have less food. Fox population decreases due to starvation and reduced reproduction. Eventually, with fewer foxes, rabbit numbers may recover — this is a predator-prey cycle.", marks: 3 },
    ],
    independent: [
      { q: "2.1  Describe the role of nitrogen-fixing bacteria in the nitrogen cycle.", a: "Nitrogen-fixing bacteria (e.g. Rhizobium in root nodules of legumes) convert atmospheric nitrogen gas (N₂) into ammonia (NH₃) or nitrates (NO₃⁻). This 'fixes' nitrogen into a form that plants can absorb and use to make proteins. Without nitrogen fixation, the nitrogen in the atmosphere would be unavailable to most organisms.", marks: 4 },
      { q: "2.2  Evaluate the effectiveness of creating nature reserves as a conservation strategy.", a: "Advantages: protects habitats from development; allows populations to recover; prevents poaching; maintains biodiversity. Disadvantages: may not be large enough for viable populations; isolated reserves reduce genetic diversity (inbreeding); climate change may make reserves unsuitable; expensive to maintain and enforce. Overall: effective as part of a wider conservation strategy but not sufficient alone.", marks: 6 },
    ],
    challenge: "Explain why removing a top predator from an ecosystem can have unexpected consequences for the entire food web (trophic cascade).",
    challengeAnswer: "Top predators regulate the populations of their prey. If a top predator is removed, its prey population increases unchecked. This increased prey population overgrazes or overhunts its own food source, causing that population to decline. The effects ripple down the food web — a trophic cascade. Example: removal of wolves from Yellowstone caused elk populations to explode, overgrazing vegetation along rivers, causing erosion and loss of habitat for many other species. Reintroducing wolves reversed this cascade.",
    extension: "Research the concept of 'rewilding'. What are the arguments for and against reintroducing extinct species (e.g. wolves, lynx) to ecosystems in the UK?"
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY TOPICS
// ─────────────────────────────────────────────────────────────────────────────
const historyTopics: Record<string, any> = {
  "ww2": {
    title: "World War Two — Causes, Key Events and Impact",
    objective: "Explain the causes of WW2. Describe key events including the Holocaust, D-Day and the atomic bombs. Evaluate the impact of WW2 on Britain and the world.",
    priorKnowledge: "Students should know: the outcome of WW1; the Treaty of Versailles; the rise of Hitler and the Nazi Party.",
    vocabulary: ["Appeasement", "Blitzkrieg", "Holocaust", "Evacuation", "Propaganda", "Rationing", "D-Day", "Atomic bomb", "Genocide", "Resistance"],
    teacherNotes: "Handle the Holocaust with sensitivity — follow your school's guidance on teaching this topic. Use primary sources (photographs, speeches, diary extracts) to develop historical thinking skills. Encourage students to consider multiple perspectives. For SEND students, provide a timeline of key events as a scaffold. Exam technique: GCSE history answers should always include evidence and explanation.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Any two from: Treaty of Versailles, Great Depression, rise of Hitler/Nazism, failure of appeasement, invasion of Poland", method: "1 mark each" },
      { q: "2.1", marks: 4, answer: "Description of the Holocaust with specific details: 6 million Jews killed, concentration camps, Nuremberg Laws, Kristallnacht", method: "1 mark per relevant point, up to 4" },
      { q: "Challenge", marks: 8, answer: "Balanced argument with evidence for and against, reaching a justified conclusion", method: "GCSE mark bands" },
    ],
    example: {
      question: "Explain why Hitler was able to rise to power in Germany.",
      steps: [
        "A strong history answer uses the structure: POINT → EVIDENCE → EXPLAIN → LINK",
        "",
        "POINT: The economic crisis caused by the Great Depression helped Hitler gain support.",
        "EVIDENCE: By 1932, over 6 million Germans were unemployed.",
        "EXPLAIN: People were desperate for change and turned to extreme parties like the Nazis,",
        "          who promised jobs, strong leadership and national pride.",
        "LINK: This shows that economic hardship was a key factor in Hitler's rise to power.",
        "",
        "OTHER FACTORS TO CONSIDER:",
        "   - Resentment over the Treaty of Versailles (war guilt, reparations, loss of territory)",
        "   - Weakness of the Weimar Republic",
        "   - Nazi propaganda and Hitler's powerful speeches",
        "   - Fear of communism among the middle classes and industrialists",
        "   - Use of the SA (Brownshirts) to intimidate opponents"
      ]
    },
    guided: [
      { q: "1.1  Name TWO causes of World War Two.", a: "Any two from: Treaty of Versailles, Great Depression, rise of Hitler, failure of appeasement, invasion of Poland.", marks: 2 },
      { q: "1.2  What was 'appeasement'? Give an example.", a: "Appeasement: giving into demands to avoid war. Example: Munich Agreement (1938) — Britain and France allowed Hitler to take the Sudetenland.", marks: 2 },
      { q: "1.3  Why did Britain declare war on Germany in September 1939?", a: "Germany invaded Poland on 1 September 1939. Britain had promised to defend Poland, so declared war on 3 September 1939.", marks: 2 },
    ],
    independent: [
      { q: "2.1  Describe what happened during the Holocaust. Include at least THREE specific details.", a: "The Holocaust was the systematic murder of 6 million Jews by the Nazis. Jews were stripped of rights (Nuremberg Laws, 1935), sent to concentration camps (Auschwitz, Treblinka), and killed in gas chambers. Also targeted: Roma, disabled people, LGBTQ+ individuals.", marks: 4 },
      { q: "2.2  Explain how the Second World War affected life on the Home Front in Britain.", a: "Evacuation of children from cities; rationing of food, clothing and fuel; women working in factories; Blitz bombing of cities; blackouts; Anderson shelters; propaganda posters.", marks: 4 },
      { q: "2.3  Describe the events of D-Day (6 June 1944). Why was it a turning point in the war?", a: "Allied forces (US, Britain, Canada) landed on beaches of Normandy, France. Largest seaborne invasion in history. Opened a Western Front, forcing Germany to fight on two fronts. Led to liberation of Western Europe.", marks: 4 },
    ],
    challenge: "Was the dropping of atomic bombs on Hiroshima and Nagasaki justified? Write a balanced argument considering both sides, then reach a justified conclusion.",
    challengeAnswer: "FOR: Ended the war quickly, avoided a costly land invasion of Japan (estimated 1 million Allied casualties), Japan refused to surrender. AGAINST: 200,000+ civilian deaths, radiation sickness for years, disproportionate force, Japan was already weakened. CONCLUSION: Must be justified with evidence.",
    extension: "Research: what was the Nuremberg Trials? Why were they historically significant for international law?"
  },

  "ancient-egypt": {
    title: "Ancient Egypt — Society, Religion and Legacy",
    objective: "Describe the key features of Ancient Egyptian society. Explain the significance of religion, pharaohs and the afterlife.",
    priorKnowledge: "Students should know: Egypt is in North Africa; the Nile is a major river; civilisations developed around rivers.",
    vocabulary: ["Pharaoh", "Hieroglyphics", "Pyramid", "Mummification", "Afterlife", "Nile", "Irrigation", "Polytheism", "Sphinx", "Papyrus"],
    teacherNotes: "Use visual sources extensively — hieroglyphics, tomb paintings, artefacts. The British Museum has excellent online resources. For SEND students, provide a visual timeline and a glossary card. Mummification is often a high-engagement topic — use it as a hook. Exam technique: always explain WHY something was significant, not just WHAT it was.",
    markScheme: [
      { q: "1.1", marks: 2, answer: "Any two: pharaoh, priests, nobles, scribes, craftsmen, farmers, slaves (in order)", method: "1 mark each" },
      { q: "2.1", marks: 4, answer: "Explanation of mummification process + why Egyptians did it (belief in afterlife, preservation of body for soul's return)", method: "" },
    ],
    example: {
      question: "Explain why the River Nile was so important to Ancient Egypt.",
      steps: [
        "POINT: The Nile was the source of life for Ancient Egypt.",
        "EVIDENCE: The Nile flooded every year, depositing rich black silt on the surrounding land.",
        "EXPLAIN: This made the soil incredibly fertile, allowing Egyptians to grow crops such as wheat and barley.",
        "          Without the Nile, Egypt would be entirely desert and unable to support a large population.",
        "LINK: This shows that Egyptian civilisation was entirely dependent on the Nile for food, water and trade.",
        "",
        "OTHER USES OF THE NILE:",
        "   - Transport: boats carried goods and people along the river",
        "   - Trade: connected Egypt to other civilisations",
        "   - Building: water transported heavy stone for pyramids",
        "   - Religion: the Nile was worshipped as a god (Hapi)"
      ]
    },
    guided: [
      { q: "1.1  Name TWO groups of people in Ancient Egyptian society.", a: "Any two from: pharaoh, priests, nobles, scribes, craftsmen, farmers, slaves.", marks: 2 },
      { q: "1.2  What was the role of the pharaoh in Ancient Egypt?", a: "The pharaoh was the ruler of Egypt, considered a god on Earth. They controlled the army, religion and government.", marks: 2 },
    ],
    independent: [
      { q: "2.1  Describe the process of mummification. Why did Egyptians mummify their dead?", a: "Process: remove organs (stored in canopic jars), dry body with natron salt, wrap in linen bandages. Reason: belief in afterlife — body preserved so soul (ka) could return to it.", marks: 4 },
      { q: "2.2  Why were pyramids built? What do they tell us about Ancient Egyptian society?", a: "Tombs for pharaohs; show wealth and power of pharaohs; demonstrate advanced engineering and organisation; reflect belief in afterlife.", marks: 4 },
    ],
    challenge: "How significant was religion in Ancient Egyptian society? Use evidence to support your answer.",
    challengeAnswer: "Religion was central to every aspect of Egyptian life: government (pharaoh as god), architecture (temples, pyramids), daily life (prayers, offerings), death (mummification, Book of the Dead). Evidence: 2,000+ gods worshipped, vast resources spent on temples and tombs.",
    extension: "Research the Rosetta Stone. Why was it so important for understanding Ancient Egypt?"
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GEOGRAPHY TOPICS
// ─────────────────────────────────────────────────────────────────────────────
const geographyTopics: Record<string, any> = {
  "rivers": {
    title: "Rivers — Processes, Landforms and Management",
    objective: "Describe and explain river processes (erosion, transportation, deposition). Identify and explain river landforms. Evaluate river management strategies.",
    priorKnowledge: "Students should know: the water cycle; rivers flow from source to mouth; rivers shape the landscape over time.",
    vocabulary: ["Erosion", "Transportation", "Deposition", "Hydraulic action", "Abrasion", "Attrition", "Meander", "Oxbow lake", "Floodplain", "Levee", "Watershed"],
    teacherNotes: "Use OS maps to identify river features. Fieldwork opportunities: measure river width, depth and velocity at different points. For SEND students, provide annotated diagrams of landforms. Exam technique: for 6-mark questions, use PEEL structure and include named examples.",
    markScheme: [
      { q: "1.1", marks: 4, answer: "Hydraulic action, abrasion, attrition, solution — 1 mark each with brief explanation", method: "" },
      { q: "2.1", marks: 6, answer: "Formation of meander with stages: fast/slow water, erosion on outside, deposition on inside, neck narrows, oxbow lake forms", method: "" },
    ],
    example: {
      question: "Explain how a waterfall is formed.",
      steps: [
        "Step 1: A river flows over a band of hard rock overlying softer rock.",
        "Step 2: The softer rock is eroded more quickly (by hydraulic action and abrasion).",
        "Step 3: The hard rock is undercut, forming an overhang.",
        "Step 4: The overhang collapses due to gravity.",
        "Step 5: A plunge pool forms at the base from the force of falling water.",
        "Step 6: Over time, the waterfall retreats upstream, forming a gorge.",
        "",
        "Named example: High Force waterfall, River Tees, County Durham."
      ]
    },
    guided: [
      { q: "1.1  Name and describe FOUR processes of river erosion.", a: "Hydraulic action (force of water), abrasion (rocks scraping bed), attrition (rocks hitting each other), solution (dissolving rock).", marks: 4 },
      { q: "1.2  What is the difference between erosion and deposition?", a: "Erosion: wearing away of rock/soil. Deposition: dropping of sediment when river loses energy.", marks: 2 },
    ],
    independent: [
      { q: "2.1  Explain how an oxbow lake is formed. Use a diagram to support your answer.", a: "Meander forms; erosion on outer bend, deposition on inner bend; neck of meander narrows; river breaks through during flood; old meander cut off; oxbow lake formed.", marks: 6 },
      { q: "2.2  Describe TWO hard engineering strategies used to manage flooding. Evaluate the advantages and disadvantages of each.", a: "Dams/reservoirs: store water, generate electricity, but expensive, displace communities. Embankments/levees: protect settlements, but can increase flood risk downstream.", marks: 6 },
    ],
    challenge: "Evaluate the effectiveness of soft engineering strategies compared to hard engineering strategies for flood management. Use named examples in your answer.",
    challengeAnswer: "Soft: floodplain zoning, afforestation, river restoration — cheaper, sustainable, work with nature. Hard: dams, embankments, channelisation — more reliable short-term but expensive, can cause problems elsewhere. Named examples required.",
    extension: "Research the 2015 Cumbria floods. What caused them? How effective were the flood management strategies in place?"
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC MAP
// ─────────────────────────────────────────────────────────────────────────────
// Merge original + expanded maths topics (expanded takes precedence for updated topics)
const mergedMathTopics = { ...mathTopics, ...expandedMathTopics };

const allTopics: Record<string, Record<string, any>> = {
  mathematics: mergedMathTopics,
  english: englishTopics,
  science: scienceTopics,
  history: historyTopics,
  geography: geographyTopics,
};

function getAdaptations(sendNeedId?: string): string[] {
  if (!sendNeedId || sendNeedId === "none-selected") return [];
  const need = sendNeeds.find(n => n.id === sendNeedId);
  return need?.worksheetAdaptations || [];
}

function getExamBoardNote(examBoardId?: string): string {
  if (!examBoardId || examBoardId === "none") return "";
  const board = examBoards.find(b => b.id === examBoardId);
  if (!board) return "";
  return `This worksheet follows ${board.name} specification guidelines. Questions are structured in exam-style format with appropriate mark allocations.`;
}

function findTopicData(subject: string, topic: string): any {
  const subjectTopics = allTopics[subject.toLowerCase()];
  if (!subjectTopics) {
    const mathSubject = allTopics["mathematics"];
    return mathSubject[Object.keys(mathSubject)[0]];
  }
  const topicLower = topic.toLowerCase().trim();

  if (subject.toLowerCase() === "mathematics") {
    const statisticsAliases: Record<string, string> = {
      "histograms and cumulative frequency": "histograms-cumulative-frequency",
      "histogram and cumulative frequency": "histograms-cumulative-frequency",
      "histograms": "histograms-cumulative-frequency",
      "histogram": "histograms-cumulative-frequency",
      "cumulative frequency": "histograms-cumulative-frequency",
      "cumulative frequency graphs": "histograms-cumulative-frequency",
      "cumulative frequency graph": "histograms-cumulative-frequency",
      "grouped data": "histograms-cumulative-frequency",
      "grouped frequency": "histograms-cumulative-frequency",
      "frequency density": "histograms-cumulative-frequency",
      // Quadratics
      "quadratic equations": "quadratics",
      "quadratic equation": "quadratics",
      "solving quadratics": "quadratics",
      "quadratic formula": "quadratics",
      "completing the square": "quadratics",
      "factorising quadratics": "quadratics",
      "factorising quadratic": "quadratics",
      // Algebraic fractions
      "algebraic fractions": "algebraic-fractions",
      "algebraic fraction": "algebraic-fractions",
      // Simultaneous equations
      "simultaneous equations": "simultaneous-equations",
      "simultaneous equation": "simultaneous-equations",
      // Linear equations
      "linear equations": "linear-equations",
      "solving equations": "linear-equations",
      "solving linear equations": "linear-equations",
      // Inequalities
      "inequalities": "inequalities",
      "linear inequalities": "inequalities",
      "quadratic inequalities": "inequalities",
      // Sequences
      "sequences": "sequences",
      "arithmetic sequences": "sequences",
      "geometric sequences": "sequences",
      "nth term": "sequences",
    };
    const aliasedKey = statisticsAliases[topicLower];
    if (aliasedKey && subjectTopics[aliasedKey]) return subjectTopics[aliasedKey];
  }
  // 1. Exact key match
  if (subjectTopics[topicLower]) return subjectTopics[topicLower];
  // 2. Title match
  const titleKey = Object.keys(subjectTopics).find(k =>
    subjectTopics[k].title?.toLowerCase() === topicLower
  );
  if (titleKey) return subjectTopics[titleKey];
  // 3. Keyword match — any word in the topic matches key or title
  const words = topicLower.split(/[\s\-\/]+/).filter(w => w.length > 3);
  const partialKey = Object.keys(subjectTopics).find(k => {
    const kLower = k.toLowerCase();
    const kTitle = (subjectTopics[k].title || '').toLowerCase();
    return words.some(w => kLower.includes(w) || kTitle.includes(w) || topicLower.includes(kLower));
  });
  if (partialKey) return subjectTopics[partialKey];
  // 4. No match — pick the most subject-appropriate fallback topic.
  // IMPORTANT: Do NOT always use the first topic (e.g. 'cells' for science) as it will
  // inject Biology-specific prior knowledge and vocabulary into Chemistry/Physics worksheets.
  const topicKeys = Object.keys(subjectTopics);
  const subjectLower = subject.toLowerCase();
  let bestFallbackKey = topicKeys[topicKeys.length - 1];
  if (subjectLower === 'science') {
    const topicL = topicLower;
    const isChemistry = ['atom', 'element', 'compound', 'acid', 'base', 'react', 'bond', 'periodic', 'mole', 'titrat', 'organic', 'polymer', 'electrolys', 'oxidat', 'reduc', 'rate', 'equilibr', 'enthalpy'].some(kw => topicL.includes(kw));
    const isPhysics = ['force', 'motion', 'energy', 'wave', 'electric', 'magnet', 'nuclear', 'radioact', 'optic', 'mechanic', 'pressure', 'momentum', 'velocity', 'accelerat', 'gravitati', 'circuit', 'resist', 'current', 'voltage'].some(kw => topicL.includes(kw));
    const isBiology = ['cell', 'organ', 'gene', 'dna', 'evolut', 'inherit', 'ecolog', 'photosyn', 'respirat', 'homeosta', 'infect', 'immun', 'nervous', 'hormone', 'reproduct', 'biolog'].some(kw => topicL.includes(kw));
    if (isChemistry && subjectTopics['chemical-reactions']) bestFallbackKey = 'chemical-reactions';
    else if (isPhysics && subjectTopics['energy']) bestFallbackKey = 'energy';
    else if (isBiology && subjectTopics['cell-biology']) bestFallbackKey = 'cell-biology';
    else if (subjectTopics['energy']) bestFallbackKey = 'energy';
  }
  const fallbackData = { ...subjectTopics[bestFallbackKey] };
  fallbackData.title = `${topic.charAt(0).toUpperCase() + topic.slice(1)} — ${subject.charAt(0).toUpperCase() + subject.slice(1)}`;
  fallbackData.objective = `Develop understanding of ${topic} through structured exam-style practice.`;
  fallbackData.vocabulary = [];
  fallbackData.priorKnowledge = `Students should have prior knowledge of ${subject} relevant to ${topic}.`;
  return fallbackData;
}


// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED WORKSHEET GENERATOR  (v3)
//
// Three-layer system:
//   1. CONTENT RULES  — what each question type must contain
//   2. LAYOUT RULES   — no two adjacent questions share the same layout family;
//                       at least 5 distinct families per secondary sheet
//   3. RENDER CHECKS  — preflight validator before output is displayed
//
// 10-step pipeline:
//   plan → validate-plan → build-sections → apply-send-overlay →
//   apply-profile → page-fit-check → accessibility-check → lock-output
//
// Layout families (7 core + 3 extras):
//   true_false | mcq_2col | label_diagram | gap_fill_inline |
//   diagram_subquestions | table_complete | draw_box |
//   short_answer | extended_answer | matching | ordering
// ─────────────────────────────────────────────────────────────────────────────

// ── Layout family type ───────────────────────────────────────────────────────
type LayoutFamily =
  | "true_false"
  | "mcq_2col"
  | "label_diagram"
  | "gap_fill_inline"
  | "diagram_subquestions"
  | "table_complete"
  | "draw_box"
  | "short_answer"
  | "extended_answer"
  | "matching"
  | "ordering";

// ── Layout rules ─────────────────────────────────────────────────────────────
// Which layouts are permitted per section (Bloom-aligned)
const SECTION_LAYOUTS: Record<string, LayoutFamily[]> = {
  recall: [
    "true_false", "mcq_2col", "gap_fill_inline", "matching", "ordering",
  ],
  understanding: [
    "label_diagram", "gap_fill_inline", "diagram_subquestions",
    "table_complete", "short_answer",
  ],
  application: [
    "diagram_subquestions", "table_complete", "draw_box",
    "short_answer", "extended_answer",
  ],
  challenge: ["extended_answer", "draw_box", "diagram_subquestions"],
};

// Primary-only layouts (KS1 only uses first 4)
const PRIMARY_KS1_LAYOUTS: LayoutFamily[] = ["true_false", "matching", "ordering", "mcq_2col"];
const PRIMARY_KS2_LAYOUTS: LayoutFamily[] = ["true_false", "mcq_2col", "matching", "ordering", "gap_fill_inline", "label_diagram"];

// Layouts that produce a visual diagram element
const DIAGRAM_LAYOUTS = new Set<LayoutFamily>([
  "label_diagram", "diagram_subquestions", "draw_box",
]);

// Marks budget per layout [min, max]
const MARKS_RANGE: Record<LayoutFamily, [number, number]> = {
  true_false:           [1, 4],
  mcq_2col:             [1, 2],
  label_diagram:        [2, 6],
  gap_fill_inline:      [2, 8],
  diagram_subquestions: [3, 8],
  table_complete:       [2, 6],
  draw_box:             [3, 8],
  short_answer:         [2, 5],
  extended_answer:      [4, 10],
  matching:             [1, 4],
  ordering:             [1, 4],
};

// ── Layout picker ─────────────────────────────────────────────────────────────
function pickLayout(
  section: string,
  usedSoFar: LayoutFamily[],
  questionId: number,
  ageProfile: "primary_ks1" | "primary_ks2" | "secondary",
  diagramsUsed: number,
  hasDiagramData: boolean = true
): LayoutFamily {
  const last = usedSoFar[usedSoFar.length - 1];

  const profileLayouts: LayoutFamily[] =
    ageProfile === "primary_ks1" ? PRIMARY_KS1_LAYOUTS :
    ageProfile === "primary_ks2" ? PRIMARY_KS2_LAYOUTS :
    ["true_false","mcq_2col","label_diagram","gap_fill_inline",
     "diagram_subquestions","table_complete","draw_box","short_answer","extended_answer","matching","ordering"];

  const sectionLayouts = SECTION_LAYOUTS[section] || profileLayouts;

  // Intersection: must be in both profile and section
  // Gate label_diagram: only allow it if the topic has actual diagram data
  let candidates = profileLayouts.filter(l => {
    if (!hasDiagramData && l === "label_diagram") return false;
    return sectionLayouts.includes(l) && l !== last;
  });

  // Prefer diagram layouts if < 2 used so far
  if (diagramsUsed < 2 && ageProfile === "secondary") {
    const diagrams = candidates.filter(l => DIAGRAM_LAYOUTS.has(l));
    if (diagrams.length > 0) candidates = diagrams;
  }

  // Avoid layouts used ≥ 2 times already
  const overused = candidates.filter(l => usedSoFar.filter(u => u === l).length >= 2);
  if (overused.length < candidates.length) {
    candidates = candidates.filter(l => !overused.includes(l));
  }

  if (candidates.length === 0) {
    candidates = sectionLayouts.filter(l => l !== last);
    if (candidates.length === 0) candidates = sectionLayouts;
  }

  return candidates[questionId % candidates.length];
}

// ── Plan validator ────────────────────────────────────────────────────────────
interface QuestionPlan {
  id: number;
  section: string;
  layout: LayoutFamily;
  marks: number;
  requiresDiagram: boolean;
}

function validatePlan(questions: QuestionPlan[], ageProfile: string): string[] {
  const errors: string[] = [];

  // No adjacent repeat
  for (let i = 1; i < questions.length; i++) {
    if (questions[i].layout === questions[i-1].layout) {
      errors.push(`Q${questions[i].id} and Q${questions[i-1].id} share layout "${questions[i].layout}" — no adjacent repeats allowed.`);
    }
  }

  // Min distinct families
  const distinct = new Set(questions.map(q => q.layout)).size;
  const minFamilies = ageProfile === "secondary" ? 5 : 3;
  if (distinct < minFamilies) {
    errors.push(`Only ${distinct} layout families (minimum ${minFamilies}).`);
  }

  // Diagrams ≥ 2 (secondary only)
  if (ageProfile === "secondary") {
    const diagramCount = questions.filter(q => q.requiresDiagram).length;
    if (diagramCount < 2) {
      errors.push(`Only ${diagramCount} diagram question(s) — need at least 2.`);
    }
  }

  return errors;
}

// ── SEND overlay spec ─────────────────────────────────────────────────────────
interface SENDOverlay {
  extraAnswerLinesMultiplier: number;
  simplifyLanguage: boolean;
  addStepScaffolds: boolean;
  addWordBanks: boolean;
  reducedDensity: boolean;
  maxWordsPerPrompt: number;
  iconCues: boolean;
  sentenceFrames: boolean;
  fontSizeBoost: number;
  lineHeightBoost: number;
}

const DEFAULT_SEND_OVERLAY: SENDOverlay = {
  extraAnswerLinesMultiplier: 1,
  simplifyLanguage: false,
  addStepScaffolds: false,
  addWordBanks: false,
  reducedDensity: false,
  maxWordsPerPrompt: 999,
  iconCues: false,
  sentenceFrames: false,
  fontSizeBoost: 0,
  lineHeightBoost: 0,
};

const SEND_OVERLAY_MAP: Record<string, Partial<SENDOverlay>> = {
  dyslexia:       { extraAnswerLinesMultiplier: 1.5, reducedDensity: true, fontSizeBoost: 1, lineHeightBoost: 0.3, maxWordsPerPrompt: 40 },
  adhd:           { addStepScaffolds: true, reducedDensity: true, iconCues: true, maxWordsPerPrompt: 30 },
  asc:            { addStepScaffolds: true, reducedDensity: true, simplifyLanguage: true, maxWordsPerPrompt: 25 },
  asperger:       { addStepScaffolds: true, reducedDensity: true, simplifyLanguage: true, maxWordsPerPrompt: 30 },
  mld:            { extraAnswerLinesMultiplier: 2, simplifyLanguage: true, addWordBanks: true, addStepScaffolds: true, reducedDensity: true, iconCues: true, fontSizeBoost: 1, lineHeightBoost: 0.2, sentenceFrames: true, maxWordsPerPrompt: 20 },
  slcn:           { extraAnswerLinesMultiplier: 1.5, simplifyLanguage: true, addWordBanks: true, reducedDensity: true, iconCues: true, sentenceFrames: true, maxWordsPerPrompt: 20 },
  dyspraxia:      { extraAnswerLinesMultiplier: 2, reducedDensity: true, fontSizeBoost: 1, lineHeightBoost: 0.2, addStepScaffolds: true },
  dyscalculia:    { extraAnswerLinesMultiplier: 2, addStepScaffolds: true, addWordBanks: true, reducedDensity: true, maxWordsPerPrompt: 30 },
  vi:             { extraAnswerLinesMultiplier: 2, reducedDensity: true, fontSizeBoost: 6, lineHeightBoost: 0.3 },
  hi:             { reducedDensity: true, iconCues: true, simplifyLanguage: true },
  eal:            { addWordBanks: true, simplifyLanguage: true, reducedDensity: true, sentenceFrames: true, maxWordsPerPrompt: 25, addStepScaffolds: true },
  anxiety:        { reducedDensity: true, addStepScaffolds: true, iconCues: true, fontSizeBoost: 1 },
  "pda-odd":      { reducedDensity: true, simplifyLanguage: true, iconCues: true },
  tourettes:      { reducedDensity: true },
  "older-learners":{ maxWordsPerPrompt: 50 },
};

function getSENDOverlay(sendNeedId?: string): SENDOverlay {
  if (!sendNeedId || sendNeedId === "none-selected") return { ...DEFAULT_SEND_OVERLAY };
  const overrides = SEND_OVERLAY_MAP[sendNeedId.toLowerCase()] || {};
  return { ...DEFAULT_SEND_OVERLAY, ...overrides };
}

// ── Content-rule tags embedded in section content ─────────────────────────────
// The renderer reads LAYOUT:<type> as the first line to pick the right sub-renderer.
// This means ALL existing renderer logic still works — we're adding signals to
// existing string content, not changing the section schema.
function layoutTag(layout: LayoutFamily): string {
  return `LAYOUT:${layout}\n`;
}

// ── Strip hints from question text (student view) ─────────────────────────────
function stripHints(text: string): string {
  return text
    .replace(/\s*Hint:[^\n]*/gi, '')
    .replace(/\s*\(Hint:[^)]*\)/gi, '')
    .replace(/\s*\[Hint:[^\]]*\]/gi, '')
    .replace(/\s*Remember:[^\n]*/gi, '')
    .trim();
}

// ── SEND scaffold wrappers ────────────────────────────────────────────────────
function wrapWithStepScaffold(content: string): string {
  return `📌 Step-by-step:\n${content}`;
}

function wrapWithSentenceFrame(content: string, type: string): string {
  const frames: Record<string, string> = {
    recall:        "I know that... because...",
    understanding: "This shows that... which means...",
    application:   "I would... because...",
    default:       "I think... because...",
  };
  const frame = frames[type] || frames.default;
  return `${content}\n\n💬 Sentence frame: "${frame}"`;
}

// ── Marks calculator ──────────────────────────────────────────────────────────
function marksForLayout(layout: LayoutFamily, section: string): number {
  const [min, max] = MARKS_RANGE[layout];
  const bySection: Record<string, number> = {
    recall: Math.min(2, max),
    understanding: Math.min(4, max),
    application: Math.min(5, max),
    challenge: 8,
  };
  return Math.max(min, bySection[section] || 3);
}

// ── Section content builders ──────────────────────────────────────────────────
// Each builder returns the section content string with a LAYOUT tag header.
// The existing WorksheetRenderer picks up these tags in the new render path.

function buildTrueFalseContent(
  statements: Array<{ stmt: string; answer: boolean }>,
  sendOverlay: SENDOverlay,
  includeAnswers: boolean
): string {
  let out = layoutTag("true_false");
  statements.forEach((s, i) => {
    const ans = includeAnswers ? `  → ${s.answer ? "TRUE" : "FALSE"}` : "";
    out += `${i + 1}. ${stripHints(s.stmt)}${ans}\n`;
  });
  return out.trim();
}

function buildMCQContent(
  question: string,
  options: string[],
  correctIndex: number,
  includeAnswers: boolean
): string {
  let out = layoutTag("mcq_2col");
  out += `${stripHints(question)}\n\n`;
  const labels = ["A", "B", "C", "D"];
  options.forEach((opt, i) => {
    const tick = includeAnswers && i === correctIndex ? " ✓" : "";
    out += `${labels[i]}  ${opt}${tick}\n`;
  });
  return out.trim();
}

function buildGapFillContent(
  paragraph: string,
  wordBank: string[],
  answers: string[],
  sendOverlay: SENDOverlay,
  includeAnswers: boolean
): string {
  let out = layoutTag("gap_fill_inline");
  const answerBankNote = sendOverlay.addWordBanks || true
    ? `\nWORD BANK: ${wordBank.join("  |  ")}\n`
    : "";
  out += paragraph + answerBankNote;
  if (includeAnswers) {
    out += `\nAnswers: ${answers.join(", ")}`;
  }
  return out.trim();
}

function buildMatchingContent(
  pairs: Array<{ left: string; right: string }>,
  sendOverlay: SENDOverlay,
  includeAnswers: boolean
): string {
  let out = layoutTag("matching");
  const shuffled = [...pairs].sort(() => 0.5 - Math.random());
  out += "Draw a line to match each item on the left to its pair on the right.\n\n";
  const leftCol = pairs.map(p => p.left);
  const rightCol = shuffled.map(p => p.right);
  leftCol.forEach((l, i) => {
    out += `${i + 1}. ${l}   ←→   ${rightCol[i]}\n`;
  });
  if (includeAnswers) {
    out += "\nAnswer key:\n";
    pairs.forEach(p => { out += `${p.left} → ${p.right}\n`; });
  }
  return out.trim();
}

function buildOrderingContent(
  items: string[],
  correctOrder: number[],
  sendOverlay: SENDOverlay,
  includeAnswers: boolean
): string {
  let out = layoutTag("ordering");
  out += "Number the boxes 1–" + items.length + " to put these in the correct order.\n\n";
  items.forEach((item, i) => {
    out += `☐  ${item}\n`;
  });
  if (includeAnswers) {
    out += `\nCorrect order: ${correctOrder.map(n => items[n]).join(" → ")}`;
  }
  return out.trim();
}

function buildTableContent(
  headers: string[],
  rows: Array<Array<string | null>>,
  includeAnswers: boolean
): string {
  let out = layoutTag("table_complete");
  out += `| ${headers.join(" | ")} |\n`;
  out += `| ${headers.map(() => "---").join(" | ")} |\n`;
  rows.forEach(row => {
    const cells = row.map(cell => cell === null ? (includeAnswers ? "___" : "......") : cell);
    out += `| ${cells.join(" | ")} |\n`;
  });
  return out.trim();
}

function buildDrawBoxContent(
  instructions: string,
  symbolReference: string | null,
  requirements: string[]
): string {
  let out = layoutTag("draw_box");
  out += `${instructions}\n`;
  if (requirements.length > 0) {
    out += "\nYour drawing must include:\n";
    requirements.forEach(r => { out += `• ${r}\n`; });
  }
  if (symbolReference) {
    out += `\nSymbol reference: ${symbolReference}`;
  }
  return out.trim();
}

function buildShortAnswerContent(
  question: string,
  sendOverlay: SENDOverlay,
  section: string,
  includeAnswers: boolean,
  modelAnswer?: string
): string {
  let out = layoutTag("short_answer");
  let q = stripHints(question);
  if (sendOverlay.addStepScaffolds) q = wrapWithStepScaffold(q);
  if (sendOverlay.sentenceFrames) q = wrapWithSentenceFrame(q, section);
  if (sendOverlay.addWordBanks) {
    out += `Key words: [relevant vocabulary listed here]\n\n`;
  }
  out += q;
  if (includeAnswers && modelAnswer) {
    out += `\n\n**Model answer:** ${modelAnswer}`;
  }
  return out.trim();
}

function buildExtendedAnswerContent(
  question: string,
  sendOverlay: SENDOverlay,
  includeAnswers: boolean,
  markPoints?: string[]
): string {
  let out = layoutTag("extended_answer");
  let q = stripHints(question);
  if (sendOverlay.addStepScaffolds) q = wrapWithStepScaffold(q);
  if (sendOverlay.sentenceFrames) q = wrapWithSentenceFrame(q, "application");
  out += q;
  if (includeAnswers && markPoints && markPoints.length > 0) {
    out += `\n\n**Mark points:**\n`;
    markPoints.forEach((mp, i) => { out += `[${i+1}] ${mp}\n`; });
  }
  return out.trim();
}

// ── Answer-line count per layout + SEND ───────────────────────────────────────
function answerLinesForLayout(
  layout: LayoutFamily,
  marks: number,
  sendOverlay: SENDOverlay
): number {
  const base: Record<LayoutFamily, number> = {
    true_false: 0, mcq_2col: 0, gap_fill_inline: 0,
    label_diagram: 0, matching: 0, ordering: 0, table_complete: 0,
    diagram_subquestions: 3,
    draw_box: 0,
    short_answer: Math.max(3, marks),
    extended_answer: Math.max(5, marks + 1),
  };
  const b = base[layout] ?? 3;
  return Math.round(b * sendOverlay.extraAnswerLinesMultiplier);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function generateWorksheet(params: WorksheetParams): GeneratedWorksheet {
  const { subject, topic, yearGroup, sendNeed, difficulty, examBoard, includeAnswers } = params;

  const topicData = findTopicData(subject, topic);
  const adaptations = getAdaptations(sendNeed);
  const examNote = getExamBoardNote(examBoard);

  const sections: WorksheetSection[] = [];

  // ── Phase 1: Year-group calibration ────────────────────────────────────────
  const yearNum = parseInt((yearGroup || "").replace(/[^0-9]/g, ""), 10) || 7;
  const phase =
    yearNum <= 2  ? "KS1" :
    yearNum <= 6  ? "KS2" :
    yearNum <= 9  ? "KS3" :
    yearNum <= 11 ? "KS4/GCSE" : "KS5/A-Level";
  const estimatedTime =
    yearNum <= 6  ? "20–30 mins" :
    yearNum <= 9  ? "35–45 mins" :
    yearNum <= 11 ? "45–60 mins" : "60–90 mins";

  const ageProfile: "primary_ks1" | "primary_ks2" | "secondary" =
    yearNum <= 2 ? "primary_ks1" :
    yearNum <= 6 ? "primary_ks2" :
    "secondary";
  const isPrimary = ageProfile !== "secondary";

  // ── Phase 2: SEND overlay ──────────────────────────────────────────────────
  const sendOverlay = getSENDOverlay(sendNeed);

  const title = topicData.title || `${topic} — ${subject}`;
  const subtitle = `${yearGroup} (${phase}) | ${subject} | ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty${examBoard && examBoard !== "none" ? ` | ${examBoards.find(b => b.id === examBoard)?.name}` : ""} | ${estimatedTime}`;

  // ── Phase 3: Build layout plan ─────────────────────────────────────────────
  const allUsedLayouts: LayoutFamily[] = [];
  let diagramsUsed = 0;
  let questionId = 1;

  // Only allow label_diagram layout when the topic has real diagram data
  const hasDiagramData = !!(topicData.diagram || topicData.diagramSubQ);

  interface PlanEntry { section: string; layout: LayoutFamily; marks: number; requiresDiagram: boolean; }
  const questionPlan: PlanEntry[] = [];

  const sectionDefs = isPrimary
    ? [
        { key: "recall",      qs: 3 },
        { key: "understanding", qs: 3 },
        { key: "application", qs: 3 },
      ]
    : [
        { key: "recall",      qs: 3 },
        { key: "understanding", qs: 3 },
        { key: "application", qs: 3 },
      ];

  for (const sec of sectionDefs) {
    for (let q = 0; q < sec.qs; q++) {
      const layout = pickLayout(sec.key, allUsedLayouts, questionId, ageProfile, diagramsUsed, hasDiagramData);
      const requiresDiagram = DIAGRAM_LAYOUTS.has(layout);
      if (requiresDiagram) diagramsUsed++;
      allUsedLayouts.push(layout);
      questionPlan.push({ section: sec.key, layout, marks: marksForLayout(layout, sec.key), requiresDiagram });
      questionId++;
    }
  }

  // ── Phase 4: Validate layout plan ─────────────────────────────────────────
  const planValidationErrors = validatePlan(
    questionPlan.map((p, i) => ({ id: i+1, section: p.section, layout: p.layout, marks: p.marks, requiresDiagram: p.requiresDiagram })),
    ageProfile
  );
  // Errors are advisory — we log them but never crash; the fallback plan still produces a worksheet

  // ── Phase 5: Teacher-only prior knowledge ─────────────────────────────────
  if (topicData.priorKnowledge) {
    sections.push({
      title: "Prior Knowledge Required",
      type: "prior-knowledge",
      content: topicData.priorKnowledge + (examNote ? `\n\n${examNote}` : ""),
      teacherOnly: true,
    });
  }

  // ── Phase 6: PAGE 1 — Header sections ─────────────────────────────────────

  // Learning Objective
  sections.push({
    title: "Learning Objective",
    type: "objective",
    content: topicData.objective,
  });

  // Key Vocabulary — always present, uses existing VocabSection renderer
  const vocabWords = topicData.vocabulary || [];
  sections.push({
    title: "KEY VOCABULARY",
    type: "vocabulary",
    content: vocabWords.join(" | "),
  });

  // Common Mistakes — mapped to misconceptions type
  if (topicData.commonMistakes || topicData.teacherNotes) {
    const mistakeContent = topicData.commonMistakes
      ? topicData.commonMistakes.map((m: any) =>
          typeof m === "string" ? `✗ ${m}` : `✗ ${m.head}\n  → ${m.body}`
        ).join("\n")
      : "";
    if (mistakeContent) {
      sections.push({
        title: "COMMON MISTAKES TO AVOID",
        type: "misconceptions",
        content: mistakeContent,
      });
    }
  }

  // Worked Example
  if (topicData.example) {
    const exContent = `**${topicData.example.question}**\n\n${topicData.example.steps.join("\n")}`;
    sections.push({
      title: "WORKED EXAMPLE — Work Through This Together",
      type: "example",
      content: exContent,
    });
  }

  // ── Phase 7: SECTION 1 — RECALL (Questions 1–3) ─────────────────────────────────
  const recallQuestions = questionPlan.filter(p => p.section === "recall");
  const recallContent: string[] = [];

  recallQuestions.forEach((plan, idx) => {
    const qNum = idx + 1;
    const markStr = `[${plan.marks} mark${plan.marks > 1 ? "s" : ""}]`;

    if (plan.layout === "true_false" && topicData.trueFalse) {
      const stmts = topicData.trueFalse.slice(0, 4);
      recallContent.push(
        `**${qNum}** Circle TRUE or FALSE for each statement. ${markStr}\n` +
        buildTrueFalseContent(stmts, sendOverlay, includeAnswers)
      );
    } else if (plan.layout === "mcq_2col" && topicData.guided?.[idx]) {
      const g = topicData.guided[idx];
      const q = stripHints(g.q);
      const opts = topicData.mcqOptions?.[idx] || [g.a, `Not ${g.a}`, "Cannot be determined", "None of the above"];
      recallContent.push(
        `**${qNum}** ${q} ${markStr}\n` +
        buildMCQContent(q, opts, 0, includeAnswers)
      );
    } else if (plan.layout === "gap_fill_inline" && topicData.gapFill) {
      const gf = topicData.gapFill;
      recallContent.push(
        `**${qNum}** Complete the paragraph using words from the word bank. ${markStr}\n` +
        buildGapFillContent(gf.paragraph, gf.wordBank, gf.answers, sendOverlay, includeAnswers)
      );
    } else if (plan.layout === "matching" && topicData.vocabulary) {
      const pairs = topicData.vocabulary.slice(0, 5).map((v: string) => {
        const [term, def] = v.includes(":") ? v.split(":").map((s: string) => s.trim()) : [v, v];
        return { left: term, right: def };
      });
      recallContent.push(
        `**${qNum}** Match each term to its definition. ${markStr}\n` +
        buildMatchingContent(pairs, sendOverlay, includeAnswers)
      );
    } else if (plan.layout === "ordering" && topicData.ordering) {
      const items = topicData.ordering.items || topicData.ordering;
      const order = topicData.ordering.correctOrder || items.map((_: any, i: number) => i);
      recallContent.push(
        `**${qNum}** Number the items in the correct order. ${markStr}\n` +
        buildOrderingContent(items, order, sendOverlay, includeAnswers)
      );
    } else {
      // Fallback: use guided question as short answer
      const g = topicData.guided?.[idx];
      const q = g ? stripHints(g.q) : `Recall a key fact about ${topic}.`;
      recallContent.push(
        `**${qNum}** ${q} ${markStr}\n` +
        buildShortAnswerContent(q, sendOverlay, "recall", includeAnswers, g?.a)
      );
    }
  });

  sections.push({
    title: `SECTION 1 — RECALL`,
    type: "guided",
    content: recallContent.join("\n\n─────\n\n"),
  });

  // ── Phase 8: SECTION 2 — UNDERSTANDING (Questions 4–6) ────────────────────
  const understandingQuestions = questionPlan.filter(p => p.section === "understanding");
  const understandingContent: string[] = [];

  understandingQuestions.forEach((plan, idx) => {
    const qNum = idx + 4;
    const markStr = `[${plan.marks} mark${plan.marks > 1 ? "s" : ""}]`;
    const g = topicData.guided?.[idx] || topicData.independent?.[idx];

    if (plan.layout === "label_diagram" && topicData.diagram) {
      const d = topicData.diagram;
      understandingContent.push(
        `**${qNum}** Label the diagram using the terms provided. ${markStr}\n` +
        `LAYOUT:label_diagram\n` +
        `DIAGRAM_TYPE:${d.type || "label_image"}\n` +
        `LABELS:${(d.labels || []).join("|")}\n` +
        (includeAnswers ? `ANSWERS:${(d.answers || d.labels || []).join("|")}` : "")
      );
    } else if (plan.layout === "gap_fill_inline" && topicData.gapFill) {
      const gf = topicData.gapFill;
      understandingContent.push(
        `**${qNum}** Complete the paragraph using words from the word bank. ${markStr}\n` +
        buildGapFillContent(gf.paragraph, gf.wordBank, gf.answers, sendOverlay, includeAnswers)
      );
    } else if (plan.layout === "diagram_subquestions" && topicData.diagramSubQ) {
      const dsq = topicData.diagramSubQ;
      understandingContent.push(
        `**${qNum}** Use the diagram to answer the questions. ${markStr}\n` +
        `LAYOUT:diagram_subquestions\n` +
        `DIAGRAM_TYPE:${dsq.type || "circuit"}\n` +
        dsq.questions.map((q: string, i: number) => `(${String.fromCharCode(97+i)}) ${q}`).join("\n")
      );
    } else if (plan.layout === "table_complete" && topicData.table) {
      const t = topicData.table;
      understandingContent.push(
        `**${qNum}** Complete the table. ${markStr}\n` +
        buildTableContent(t.headers, t.rows, includeAnswers)
      );
    } else if (plan.layout === "short_answer" && g) {
      const q = stripHints(g.q);
      understandingContent.push(
        `**${qNum}** ${q} ${markStr}\n` +
        buildShortAnswerContent(q, sendOverlay, "understanding", includeAnswers, g.a)
      );
    } else {
      const indQ = topicData.independent?.[idx];
      const q = indQ ? stripHints(indQ.q) : `Explain a key concept in ${topic}.`;
      understandingContent.push(
        `**${qNum}** ${q} ${markStr}\n` +
        buildShortAnswerContent(q, sendOverlay, "understanding", includeAnswers, indQ?.a)
      );
    }
  });

  sections.push({
    title: `SECTION 2 — UNDERSTANDING`,
    type: "independent",
    content: understandingContent.join("\n\n─────\n\n"),
  });

  // ── Phase 9: SECTION 3 — APPLICATION & ANALYSIS (Questions 7–9) ───────────
  const applicationQuestions = questionPlan.filter(p => p.section === "application");
  const applicationContent: string[] = [];

  // Scale independent questions: difficulty controls how many
  const independentQs = difficulty === "foundation" || difficulty === "basic"
    ? topicData.independent?.slice(0, 4) ?? []
    : difficulty === "higher" || difficulty === "stretch"
    ? topicData.independent ?? []
    : topicData.independent?.slice(0, Math.ceil((topicData.independent?.length || 0) * 0.75)) ?? [];

  applicationQuestions.forEach((plan, idx) => {
    const qNum = idx + 7;
    const markStr = `[${plan.marks} mark${plan.marks > 1 ? "s" : ""}]`;
    const indQ = independentQs[idx];

    if (plan.layout === "draw_box" && topicData.drawTask) {
      const dt = topicData.drawTask;
      applicationContent.push(
        `**${qNum}** ${dt.instruction} ${markStr}\n` +
        buildDrawBoxContent(dt.instruction, dt.symbolReference || null, dt.requirements || [])
      );
    } else if (plan.layout === "diagram_subquestions" && topicData.diagramSubQ) {
      const dsq = topicData.diagramSubQ;
      applicationContent.push(
        `**${qNum}** Use the diagram to answer the questions. ${markStr}\n` +
        `LAYOUT:diagram_subquestions\n` +
        `DIAGRAM_TYPE:${dsq.type || "circuit"}\n` +
        dsq.questions.map((q: string, i: number) => `(${String.fromCharCode(97+i)}) ${q}`).join("\n")
      );
    } else if (plan.layout === "table_complete" && topicData.table) {
      const t = topicData.table;
      applicationContent.push(
        `**${qNum}** Complete the table. ${markStr}\n` +
        buildTableContent(t.headers, t.rows, includeAnswers)
      );
    } else if (plan.layout === "extended_answer" && indQ) {
      const q = stripHints(indQ.q);
      applicationContent.push(
        `**${qNum}** ${q} ${markStr}\n` +
        buildExtendedAnswerContent(q, sendOverlay, includeAnswers, indQ.a ? [indQ.a] : [])
      );
    } else if (indQ) {
      const q = stripHints(indQ.q);
      applicationContent.push(
        `**${qNum}** ${q} ${markStr}\n` +
        buildShortAnswerContent(q, sendOverlay, "application", includeAnswers, indQ.a)
      );
    } else {
      applicationContent.push(
        `**${qNum}** Apply your knowledge of ${topic} to solve this problem. ${markStr}\n` +
        buildShortAnswerContent(`Apply your knowledge of ${topic} to solve this problem.`, sendOverlay, "application", false)
      );
    }
  });

  sections.push({
    title: `SECTION 3 — APPLICATION & ANALYSIS`,
    type: "independent",
    content: applicationContent.join("\n\n─────\n\n"),
  });

  // ── Phase 10: CHALLENGE (★) ────────────────────────────────────────────────
  if (difficulty === "higher" || difficulty === "stretch" || difficulty === "mixed") {
    const challengeLayout = pickLayout("challenge", allUsedLayouts, questionId, ageProfile, diagramsUsed, hasDiagramData);
    const challengeMarks = 8;
    const markStr = `[${challengeMarks} marks]`;

    let challengeContent = layoutTag(challengeLayout);
    if (topicData.challenge) {
      challengeContent += `${topicData.challenge} ${markStr}`;
      if (includeAnswers && topicData.challengeAnswer) {
        challengeContent += `\n\n**Answer:** ${topicData.challengeAnswer}`;
      }
    }
    if (sendOverlay.addStepScaffolds) challengeContent = wrapWithStepScaffold(challengeContent);

    sections.push({
      title: "★ CHALLENGE QUESTION",
      type: "challenge",
      content: challengeContent,
    });
  }

  // ── Phase 11: Extension / Homework ────────────────────────────────────────
  if (topicData.extension && (difficulty === "higher" || difficulty === "stretch")) {
    sections.push({
      title: "Extension / Homework Task",
      type: "extension",
      content: topicData.extension,
    });
  }

  // ── Phase 12: Self Reflection ─────────────────────────────────────────────
  const reflectionTopics = [
    `Understanding of ${topic}`,
    "Using key vocabulary correctly",
    "Applying knowledge to new problems",
    "Explaining my reasoning clearly",
    "Checking my work for errors",
  ].slice(0, isPrimary ? 3 : 5);

  sections.push({
    title: "SELF REFLECTION",
    type: "self-reflection",
    content: [
      "A  How confident do you feel? Tick the column that best describes you.\n",
      reflectionTopics.map(t => `${t} | Not Yet | Getting There | Confident`).join("\n"),
      "\nB  Written reflection:\n",
      "One concept I feel confident about is ...\n",
      "One area I still need to practise is ...\n",
      "A question I still want to ask my teacher is ...\n",
      "\nExit Ticket: Write ONE thing you learned today in one sentence:",
    ].join("\n"),
  });

  // ── Phase 13: Teacher-only sections ──────────────────────────────────────

  // Answer Key
  if (includeAnswers) {
    const allAnswers: string[] = [];

    // Guided (Section 1)
    topicData.guided?.forEach((g: any, i: number) => {
      allAnswers.push(`Q${i + 1}. ${g.a}${g.marks ? ` [${g.marks}m]` : ""}`);
    });

    // Independent (Sections 2+3)
    independentQs.forEach((q: any, i: number) => {
      allAnswers.push(`Q${i + 4}. ${q.a}${q.marks ? ` [${q.marks}m]` : ""}`);
    });

    if ((difficulty === "higher" || difficulty === "stretch" || difficulty === "mixed") && topicData.challengeAnswer) {
      allAnswers.push(`Challenge: ${topicData.challengeAnswer} [8m]`);
    }

    sections.push({
      title: "Answer Key",
      type: "answers",
      content: allAnswers.join("\n"),
      teacherOnly: true,
    });
  }

  // Mark Scheme
  if (includeAnswers && topicData.markScheme) {
    const msContent = topicData.markScheme.map((m: any) =>
      `Q${m.q}: ${m.answer}${m.method ? ` — Method: ${m.method}` : ""} [${m.marks} mark${m.marks > 1 ? "s" : ""}]`
    ).join("\n");
    sections.push({
      title: "Mark Scheme",
      type: "mark-scheme",
      content: msContent,
      teacherOnly: true,
    });
  }

  // Teacher Notes
  if (topicData.teacherNotes) {
    sections.push({
      title: "Teacher Notes & Implementation Guide",
      type: "teacher-notes",
      content: topicData.teacherNotes,
      teacherOnly: true,
    });
  }

  // SEND Adaptations
  if (adaptations.length > 0) {
    const adaptContent = [
      ...adaptations.map((a: any) => typeof a === "string" ? `• ${a}` : `• ${a.what}\n  Why: ${a.why}`),
      "",
      `SEND overlay applied: ${sendNeed}`,
      `• Reduced density: ${sendOverlay.reducedDensity}`,
      `• Answer lines multiplier: ×${sendOverlay.extraAnswerLinesMultiplier}`,
      `• Step scaffolds: ${sendOverlay.addStepScaffolds}`,
      `• Word banks added: ${sendOverlay.addWordBanks}`,
      `• Sentence frames: ${sendOverlay.sentenceFrames}`,
      `• Language simplified: ${sendOverlay.simplifyLanguage}`,
      sendOverlay.fontSizeBoost > 0 ? `• Font size +${sendOverlay.fontSizeBoost}pt` : "",
      planValidationErrors.length > 0
        ? `\nLayout validation notes:\n${planValidationErrors.map(e => `  ⚠ ${e}`).join("\n")}`
        : "",
    ].filter(Boolean).join("\n");

    sections.push({
      title: "SEND Adaptations Applied",
      type: "adaptations",
      content: adaptContent,
      teacherOnly: true,
    });
  }

  // ── Calculate total marks ─────────────────────────────────────────────────
  const totalMarks = topicData.markScheme
    ? topicData.markScheme.reduce((sum: number, m: any) => sum + (m.marks || 0), 0)
    : questionPlan.reduce((sum, p) => sum + p.marks, 0);

  return {
    title,
    subtitle,
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
  story += `${characters[0]} stood at the ${getStartLocation(genre, loc)}, heart pounding with a mixture of excitement and nervousness. "${getOpeningDialogue(genre, characters)}" ${characters[0]} whispered, clutching ${getItem(genre)} tightly.\n\n`;

  if (characters.length > 1) {
    story += `${characters[1]} appeared beside them, eyes wide with ${getEmotion(genre)}. "Are you sure about this?" ${characters[1]} asked, glancing around ${getGlanceDescription(genre, loc)}.\n\n`;
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
    story += getTurningPoint(genre, characters, loc, th);
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

function getStartLocation(genre: string, setting: string): string {
  return `entrance to ${setting}`;
}

function getOpeningDialogue(genre: string, characters: string[]): string {
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

function getGlanceDescription(genre: string, setting: string): string {
  return `at the shadows of ${setting}`;
}

function getMiddleContent(genre: string, characters: string[], setting: string, theme: string): string {
  return `As they ventured deeper into ${setting}, ${characters[0]} noticed something extraordinary. The path ahead split into two directions, each one seeming to call out with its own promise and danger.\n\n"Look at this!" ${characters[0]} exclaimed, pointing at ${genre === "mystery" ? "a set of unusual footprints" : genre === "fantasy" ? "a shimmering portal" : genre === "sci-fi" ? "an alien signal on the scanner" : "something remarkable"} that had appeared seemingly from nowhere.\n\nThe discovery changed everything. What had started as ${genre === "comedy" ? "a ridiculous misunderstanding" : "a simple journey"} was now becoming something far more significant. ${characters[0]} felt a surge of determination — this was about more than just ${theme}. This was about proving that even the most unexpected person could make a real difference.\n\n${characters.length > 1 ? `${characters[1]} studied the discovery carefully. "I think I understand," ${characters[1]} said slowly. "This means we need to work together. Neither of us can do this alone."\n\nIt was in that moment that the true meaning of ${theme} became clear to both of them.` : `Standing alone, ${characters[0]} realised that true ${theme} sometimes meant facing challenges head-on, even when nobody else was watching.`}`;
}

function getChallengeContent(genre: string, characters: string[], setting: string, theme: string): string {
  return `The challenge was greater than either of them had imagined. ${genre === "spooky" ? "Strange sounds echoed through the corridors" : genre === "adventure" ? "The terrain became treacherous and unpredictable" : genre === "sports" ? "The opposing team was stronger than expected" : "Obstacles appeared at every turn"}, testing their resolve at every step.\n\n${characters[0]} stumbled, nearly giving up. "I can't do this," they muttered, frustration building like a storm.\n\nBut then — a moment of clarity. Everything they had learned, every challenge they had faced, had been preparing them for exactly this. ${characters[0]} took a deep breath and tried again.\n\n${characters.length > 1 ? `"You can do it," ${characters[1]} said quietly. "I believe in you."\n\nThose words were all ${characters[0]} needed.` : `Sometimes, believing in yourself is the hardest thing of all. But ${characters[0]} found that belief, buried deep inside, waiting to be discovered.`}`;
}

function getTurningPoint(genre: string, characters: string[], setting: string, theme: string): string {
  return `Everything changed in an instant. What had seemed impossible suddenly became clear — the answer had been there all along, hidden in plain sight.\n\n${characters[0]} looked around at ${setting} with new eyes. The fear that had gripped them began to loosen its hold. In its place grew something stronger: purpose.\n\n"I know what we have to do," ${characters[0]} said, voice steady for the first time. They explained the plan — bold, risky, but exactly right.\n\n${characters.length > 1 ? `${characters[1]} listened carefully, then nodded. "It's brilliant," they said. "Completely mad — but brilliant."\n\nTogether, they prepared for the final challenge.` : `It would not be easy. Nothing worth doing ever was. But ${characters[0]} was ready.`}`;
}

function getEnding(genre: string, characters: string[], setting: string, theme: string): string {
  return `When it was all over, ${characters[0]} stood quietly in ${setting}, taking in everything that had happened. The world looked different now — not because it had changed, but because they had.\n\n${genre === "mystery" ? "The mystery had been solved, the truth finally revealed." : genre === "adventure" ? "The adventure had been everything they had hoped for — and more." : genre === "sports" ? "Win or lose, they had given everything. That was what mattered." : genre === "spooky" ? "The ghost was gone, the secret buried once more." : "The journey had come to an end, but the memories would last forever."}\n\n${characters.length > 1 ? `${characters[1]} smiled. "We did it," they said simply.\n\n"We did," ${characters[0]} agreed. "Together."\n\nAnd that, more than anything else, was what ${theme} truly meant.` : `${characters[0]} smiled to themselves. They had done it. Not because it was easy, but because they had refused to give up.\n\nAnd that made all the difference.`}\n\n*The End*`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export function renderWorksheetText(worksheet: GeneratedWorksheet, isTeacher: boolean): string {
  return worksheet.sections
    .filter(s => isTeacher || !s.teacherOnly)
    .map(s => `${s.title}\n${"─".repeat(s.title.length)}\n${s.content}`)
    .join("\n\n");
}

export function renderWorksheetHtml(worksheet: GeneratedWorksheet, isTeacher: boolean): string {
  return worksheet.sections
    .filter(s => isTeacher || !s.teacherOnly)
    .map(s => {
      const contentHtml = s.content
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
      return `<div class="section"><h2>${s.title}</h2><div>${contentHtml}</div></div>`;
    })
    .join("");
}
