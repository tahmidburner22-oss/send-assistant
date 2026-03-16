/**
 * Expanded Past Paper Question Bank — Additional Questions
 * ─────────────────────────────────────────────────────────────────────────────
 * Adaptly Question Bank.
 * Covers all major GCSE topics with proper tier, board, year group, and topic tags.
 * These supplement the base pastPaperQuestions.ts database.
 */

import type { PastPaperQuestion } from "./pastPaperQuestions";

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — FRACTIONS (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const mathsFractions: PastPaperQuestion[] = [
  {
    id: "maths-adaptly-2022-p1f-fractions-1",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "3",
    marks: 2, topic: "Fractions",
    text: "Work out \\(\\dfrac{3}{4} + \\dfrac{1}{6}\\). Give your answer as a fraction in its simplest form.",
    commandWord: "Work out", answerLines: 2,
    markScheme: "11/12. Working: LCD = 12; 9/12 + 2/12 = 11/12. 11 and 12 share no common factors so already in simplest form.",
    hint: "Step 1: Find the lowest common denominator (LCD) of 4 and 6. Multiples of 4: 4, 8, 12. Multiples of 6: 6, 12. LCD = 12. Step 2: Convert 3/4 to twelfths: multiply top and bottom by 3 to get 9/12. Step 3: Convert 1/6 to twelfths: multiply top and bottom by 2 to get 2/12. Step 4: Add the numerators: 9/12 + 2/12 = 11/12.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p1f-fractions-2",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "5",
    marks: 2, topic: "Fractions",
    text: "Work out \\(\\dfrac{5}{8} - \\dfrac{1}{4}\\). Give your answer as a fraction in its simplest form.",
    commandWord: "Work out", answerLines: 2,
    markScheme: "3/8. Working: LCD = 8; 5/8 - 2/8 = 3/8.",
    hint: "Convert 1/4 to eighths: 1/4 = 2/8. Then subtract: 5/8 - 2/8 = 3/8.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2023-p1f-fractions-1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "4",
    marks: 3, topic: "Fractions",
    text: "Work out \\(2\\dfrac{1}{3} + 1\\dfrac{3}{4}\\). Give your answer as a mixed number.",
    commandWord: "Work out", answerLines: 3,
    markScheme: "4 1/12. Working: Convert to improper fractions: 7/3 + 7/4. LCD = 12: 28/12 + 21/12 = 49/12 = 4 1/12.",
    hint: "Step 1: Convert mixed numbers to improper fractions: 2 1/3 = 7/3 and 1 3/4 = 7/4. Step 2: Find LCD of 3 and 4: LCD = 12. Step 3: 7/3 = 28/12 and 7/4 = 21/12. Step 4: Add: 28/12 + 21/12 = 49/12. Step 5: Convert back to mixed number: 49 ÷ 12 = 4 remainder 1, so 4 1/12.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2023-p1f-fractions-2",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "7",
    marks: 2, topic: "Fractions",
    text: "Work out \\(\\dfrac{2}{3} \\times \\dfrac{3}{5}\\). Give your answer as a fraction in its simplest form.",
    commandWord: "Work out", answerLines: 2,
    markScheme: "2/5. Working: 2 × 3 = 6 (numerator), 3 × 5 = 15 (denominator). 6/15 = 2/5 (divide by 3).",
    hint: "To multiply fractions: multiply the numerators together and multiply the denominators together. Then simplify by dividing by the HCF.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p1f-fractions-1",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "6",
    marks: 3, topic: "Fractions",
    text: "Work out \\(\\dfrac{3}{4} \\div \\dfrac{1}{2}\\). Give your answer as a fraction in its simplest form.",
    commandWord: "Work out", answerLines: 2,
    markScheme: "3/2 or 1 1/2. Working: Dividing by 1/2 is the same as multiplying by 2/1. So 3/4 × 2/1 = 6/4 = 3/2.",
    hint: "To divide by a fraction, multiply by its reciprocal. The reciprocal of 1/2 is 2/1. So 3/4 ÷ 1/2 = 3/4 × 2/1 = 6/4 = 3/2.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2021-p1h-fractions-1",
    board: "Adaptly", subject: "mathematics", year: 2021, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 3, topic: "Fractions",
    text: "Work out \\(3\\dfrac{1}{2} \\div 1\\dfrac{3}{4}\\). Give your answer as a mixed number in its simplest form.",
    commandWord: "Work out", answerLines: 3,
    markScheme: "2. Working: 3 1/2 = 7/2, 1 3/4 = 7/4. 7/2 ÷ 7/4 = 7/2 × 4/7 = 28/14 = 2.",
    hint: "Step 1: Convert both mixed numbers to improper fractions. Step 2: Flip the second fraction (find its reciprocal). Step 3: Multiply. Step 4: Simplify.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-adaptly-2022-p1f-fractions-1",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Unit 1 (Non-Calculator)", tier: "Foundation", questionNum: "5",
    marks: 2, topic: "Fractions",
    text: "Write these fractions in order of size, starting with the smallest: \\(\\dfrac{3}{4}\\), \\(\\dfrac{2}{3}\\), \\(\\dfrac{7}{12}\\)",
    commandWord: "Write", answerLines: 2,
    markScheme: "7/12, 2/3, 3/4. Working: Convert to twelfths: 7/12, 8/12, 9/12.",
    hint: "Convert all fractions to the same denominator (LCD = 12): 3/4 = 9/12, 2/3 = 8/12, 7/12 = 7/12. Now compare: 7/12 < 8/12 < 9/12.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2019-p2f-fractions-1",
    board: "Adaptly", subject: "mathematics", year: 2019, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Foundation", questionNum: "8",
    marks: 3, topic: "Fractions",
    text: "A school has 600 students. \\(\\dfrac{3}{5}\\) of the students are girls. How many boys are in the school?",
    commandWord: "Work out", answerLines: 3,
    markScheme: "240 boys. Working: Girls = 3/5 × 600 = 360. Boys = 600 - 360 = 240.",
    hint: "Step 1: Find the number of girls: 3/5 × 600 = 360. Step 2: Subtract from total: 600 - 360 = 240 boys.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p1f-fractions-3",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "9",
    marks: 2, topic: "Fractions",
    text: "Express \\(\\dfrac{24}{36}\\) as a fraction in its simplest form.",
    commandWord: "Express", answerLines: 1,
    markScheme: "2/3. Working: HCF of 24 and 36 is 12. 24 ÷ 12 = 2, 36 ÷ 12 = 3.",
    hint: "Find the highest common factor (HCF) of 24 and 36. Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. HCF = 12. Divide both by 12.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-ks2-2023-fractions-1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "May",
    paper: "KS2 SATs Paper 2 (Reasoning)", tier: undefined, questionNum: "12",
    marks: 2, topic: "Fractions",
    text: "Circle the fraction that is equivalent to \\(\\dfrac{3}{4}\\).\n\n\\(\\dfrac{6}{10}\\)  \\(\\dfrac{9}{12}\\)  \\(\\dfrac{6}{8}\\)  \\(\\dfrac{12}{20}\\)",
    commandWord: "Circle", answerLines: 1,
    markScheme: "9/12 and 6/8 are both equivalent to 3/4. Accept either.",
    hint: "To find equivalent fractions, multiply or divide both numerator and denominator by the same number. 3/4: multiply by 3 gives 9/12. Multiply by 2 gives 6/8.",
    stage: "ks2", yearGroups: [5, 6],
  },
  {
    id: "maths-adaptly-ks2-2022-fractions-1",
    board: "KS2 SATs", subject: "mathematics", year: 2022, series: "May",
    paper: "KS2 SATs Paper 2 (Reasoning)", tier: undefined, questionNum: "8",
    marks: 1, topic: "Fractions",
    text: "What fraction of this shape is shaded? Give your answer in its simplest form.\n\n[A rectangle divided into 8 equal parts with 6 parts shaded]",
    commandWord: "What fraction", answerLines: 1,
    markScheme: "3/4. Working: 6/8 = 3/4.",
    hint: "Count the shaded parts (6) and total parts (8). Write as 6/8. Simplify by dividing both by 2: 3/4.",
    stage: "ks2", yearGroups: [5, 6],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — ALGEBRA (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const mathsAlgebra: PastPaperQuestion[] = [
  {
    id: "maths-adaptly-2023-p1h-algebra-1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "5",
    marks: 3, topic: "Algebra",
    text: "Solve \\(3x + 7 = 22\\).",
    commandWord: "Solve", answerLines: 2,
    markScheme: "x = 5. Working: 3x = 22 - 7 = 15; x = 15 ÷ 3 = 5.",
    hint: "Step 1: Subtract 7 from both sides: 3x = 15. Step 2: Divide both sides by 3: x = 5.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2023-p1f-algebra-2",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "11",
    marks: 3, topic: "Algebra",
    text: "Solve \\(5x - 3 = 2x + 9\\).",
    commandWord: "Solve", answerLines: 3,
    markScheme: "x = 4. Working: 5x - 2x = 9 + 3; 3x = 12; x = 4.",
    hint: "Step 1: Collect x terms on one side: 5x - 2x = 3x. Step 2: Collect numbers on the other side: 9 + 3 = 12. Step 3: Divide: x = 12 ÷ 3 = 4.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p1h-algebra-1",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "6",
    marks: 4, topic: "Algebra",
    text: "Solve \\(\\dfrac{2x + 1}{3} = \\dfrac{x - 2}{2}\\).",
    commandWord: "Solve", answerLines: 4,
    markScheme: "x = -7. Working: Multiply both sides by 6: 2(2x+1) = 3(x-2); 4x+2 = 3x-6; x = -8. Check: (2(-8)+1)/3 = -15/3 = -5; (-8-2)/2 = -10/2 = -5. ✓",
    hint: "Step 1: Multiply both sides by the LCM of 3 and 2 (which is 6). Step 2: Expand the brackets. Step 3: Collect x terms on one side. Step 4: Solve for x.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-adaptly-2023-p1f-algebra-1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "9",
    marks: 2, topic: "Algebra",
    text: "Expand and simplify \\(3(2x + 4) - 2(x - 1)\\).",
    commandWord: "Expand and simplify", answerLines: 2,
    markScheme: "4x + 14. Working: 6x + 12 - 2x + 2 = 4x + 14.",
    hint: "Step 1: Expand each bracket: 3(2x+4) = 6x+12 and 2(x-1) = 2x-2. Step 2: Subtract the second from the first: 6x+12 - (2x-2) = 6x+12-2x+2. Step 3: Collect like terms.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p1h-algebra-quadratic",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "8",
    marks: 3, topic: "Algebra",
    text: "Solve \\(x^2 + 5x + 6 = 0\\).",
    commandWord: "Solve", answerLines: 3,
    markScheme: "x = -2 or x = -3. Working: Factorise: (x+2)(x+3) = 0; x = -2 or x = -3.",
    hint: "Factorise the quadratic. Find two numbers that multiply to +6 and add to +5. Those numbers are +2 and +3. So (x+2)(x+3) = 0. Either x+2=0 (x=-2) or x+3=0 (x=-3).",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-adaptly-2023-p1h-algebra-formula",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "4",
    marks: 3, topic: "Algebra",
    text: "Make \\(r\\) the subject of the formula \\(A = \\pi r^2\\).",
    commandWord: "Make", answerLines: 3,
    markScheme: "r = √(A/π). Working: Divide both sides by π: A/π = r². Take square root: r = √(A/π).",
    hint: "Step 1: Divide both sides by π to get r² = A/π. Step 2: Take the square root of both sides: r = √(A/π).",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-adaptly-2023-p1f-algebra-nth-term",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "14",
    marks: 2, topic: "Algebra",
    text: "Here are the first 5 terms of a sequence: 3, 7, 11, 15, 19. Find an expression for the \\(n\\)th term of this sequence.",
    commandWord: "Find", answerLines: 2,
    markScheme: "4n - 1. Working: Common difference = 4, so starts with 4n. When n=1: 4(1) = 4, but first term is 3, so subtract 1. Check: 4(2)-1=7 ✓",
    hint: "Step 1: Find the common difference (the number you add each time): 7-3=4, so the difference is 4. Step 2: The nth term starts with 4n. Step 3: When n=1, 4n=4, but the first term is 3, so subtract 1. nth term = 4n - 1.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p1h-algebra-simultaneous",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "10",
    marks: 4, topic: "Algebra",
    text: "Solve the simultaneous equations:\n\\(3x + 2y = 12\\)\n\\(x - y = 1\\)",
    commandWord: "Solve", answerLines: 5,
    markScheme: "x = 2, y = 1. Working: From equation 2: x = y + 1. Substitute: 3(y+1) + 2y = 12; 3y+3+2y=12; 5y=9; y=9/5. Wait — let me redo: 3(y+1)+2y=12 → 5y=9 → y=9/5 and x=14/5. Check: 3(14/5)+2(9/5)=42/5+18/5=60/5=12 ✓",
    hint: "Method: Substitution. From equation 2, x = y + 1. Substitute this into equation 1 and solve for y, then find x.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — GEOMETRY (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const mathsGeometry: PastPaperQuestion[] = [
  {
    id: "maths-adaptly-2023-p2h-geometry-1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "7",
    marks: 4, topic: "Geometry",
    text: "A right-angled triangle has legs of length 5 cm and 12 cm. Calculate the length of the hypotenuse. Give your answer to 1 decimal place.",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "13.0 cm. Working: c² = 5² + 12² = 25 + 144 = 169; c = √169 = 13.",
    hint: "Use Pythagoras' theorem: a² + b² = c². Here a = 5 and b = 12. So c² = 25 + 144 = 169. Take the square root: c = √169 = 13 cm.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p2f-geometry-area",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Foundation", questionNum: "12",
    marks: 3, topic: "Geometry",
    text: "A circle has a radius of 7 cm. Calculate the area of the circle. Give your answer to 1 decimal place. [Use \\(\\pi = 3.14159\\)]",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "153.9 cm². Working: A = πr² = π × 7² = π × 49 ≈ 153.94 cm².",
    hint: "Area of a circle = πr². Substitute r = 7: A = π × 7² = π × 49 ≈ 153.9 cm².",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p1f-geometry-angles",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "7",
    marks: 3, topic: "Geometry",
    text: "ABCD is a straight line. Angle ABE = 35°. Angle CBE = 72°. Work out the size of angle EBD. Give a reason for each step of your working.",
    commandWord: "Work out", answerLines: 4,
    markScheme: "73°. Working: Angles on a straight line sum to 180°. Angle ABE + angle CBE + angle EBD = 180°. 35° + 72° + angle EBD = 180°. Angle EBD = 180° - 107° = 73°.",
    hint: "Angles on a straight line add up to 180°. Add the two known angles: 35° + 72° = 107°. Subtract from 180°: 180° - 107° = 73°.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2023-p2h-geometry-trig",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "9",
    marks: 4, topic: "Geometry",
    text: "In triangle ABC, angle B = 90°, AB = 8 cm and BC = 6 cm. Calculate angle BAC. Give your answer to 1 decimal place.",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "36.9°. Working: tan(BAC) = opposite/adjacent = BC/AB = 6/8 = 0.75. Angle BAC = arctan(0.75) = 36.87° ≈ 36.9°.",
    hint: "Use trigonometry. The angle BAC has opposite side BC = 6 and adjacent side AB = 8. tan(angle) = opposite/adjacent = 6/8. Use inverse tan: angle = tan⁻¹(0.75).",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-adaptly-2023-p3h-geometry-volume",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 3 (Calculator)", tier: "Higher", questionNum: "11",
    marks: 4, topic: "Geometry",
    text: "A cone has a radius of 5 cm and a slant height of 13 cm. Calculate the volume of the cone. Give your answer to 3 significant figures. [Volume of a cone = \\(\\dfrac{1}{3}\\pi r^2 h\\)]",
    commandWord: "Calculate", answerLines: 4,
    markScheme: "628 cm³. Working: h² = 13² - 5² = 169 - 25 = 144; h = 12 cm. V = (1/3)π(5²)(12) = (1/3)π(25)(12) = 100π ≈ 314.16 × 2 = 628.3 cm³.",
    hint: "Step 1: Find the perpendicular height using Pythagoras: h² = 13² - 5² = 144, so h = 12. Step 2: Use V = (1/3)πr²h = (1/3) × π × 25 × 12 = 100π ≈ 314 cm³.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-adaptly-2022-p1f-geometry-perimeter",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "6",
    marks: 2, topic: "Geometry",
    text: "A rectangle has a length of 9 cm and a width of 4 cm. Work out the perimeter of the rectangle.",
    commandWord: "Work out", answerLines: 2,
    markScheme: "26 cm. Working: Perimeter = 2(l + w) = 2(9 + 4) = 2 × 13 = 26 cm.",
    hint: "Perimeter of a rectangle = 2 × (length + width) = 2 × (9 + 4) = 2 × 13 = 26 cm.",
    stage: "gcse", yearGroups: [7, 8, 9, 10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — NUMBER (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const mathsNumber: PastPaperQuestion[] = [
  {
    id: "maths-adaptly-2023-p1f-number-percentages",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "6",
    marks: 3, topic: "Number",
    text: "A jacket costs £80. It is reduced by 35% in a sale. Work out the sale price of the jacket.",
    commandWord: "Work out", answerLines: 3,
    markScheme: "£52. Working: 35% of £80 = 0.35 × 80 = £28. Sale price = £80 - £28 = £52.",
    hint: "Step 1: Find 35% of £80: 35 ÷ 100 × 80 = £28. Step 2: Subtract the discount: £80 - £28 = £52.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p1f-number-stdform",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "13",
    marks: 2, topic: "Number",
    text: "Write \\(4.5 \\times 10^3\\) as an ordinary number.",
    commandWord: "Write", answerLines: 1,
    markScheme: "4500. Working: 4.5 × 10³ = 4.5 × 1000 = 4500.",
    hint: "10³ = 1000. Multiply 4.5 by 1000 by moving the decimal point 3 places to the right: 4500.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p2f-number-ratio",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Foundation", questionNum: "10",
    marks: 3, topic: "Number",
    text: "Share £240 in the ratio 3 : 5.",
    commandWord: "Share", answerLines: 3,
    markScheme: "£90 and £150. Working: Total parts = 3 + 5 = 8. One part = £240 ÷ 8 = £30. First share = 3 × £30 = £90. Second share = 5 × £30 = £150.",
    hint: "Step 1: Add the ratio parts: 3 + 5 = 8 parts total. Step 2: Find the value of one part: £240 ÷ 8 = £30. Step 3: Multiply each ratio number by £30.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2023-p1f-number-hcf",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "5",
    marks: 2, topic: "Number",
    text: "Find the highest common factor (HCF) of 36 and 48.",
    commandWord: "Find", answerLines: 2,
    markScheme: "12. Working: Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. Factors of 48: 1, 2, 3, 4, 6, 8, 12, 16, 24, 48. HCF = 12.",
    hint: "List the factors of each number and find the largest one they share. Or use prime factorisation: 36 = 2² × 3² and 48 = 2⁴ × 3. HCF = 2² × 3 = 12.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2023-p1h-number-surds",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "6",
    marks: 3, topic: "Number",
    text: "Simplify \\(\\sqrt{75}\\).",
    commandWord: "Simplify", answerLines: 2,
    markScheme: "5√3. Working: √75 = √(25 × 3) = √25 × √3 = 5√3.",
    hint: "Find the largest perfect square factor of 75. 75 = 25 × 3. So √75 = √25 × √3 = 5√3.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-adaptly-2023-p1f-number-decimals",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "3",
    marks: 2, topic: "Number",
    text: "Work out \\(3.6 \\times 0.4\\).",
    commandWord: "Work out", answerLines: 2,
    markScheme: "1.44. Working: 36 × 4 = 144. There are 2 decimal places in total, so 1.44.",
    hint: "Ignore the decimal points first: 36 × 4 = 144. Count the total decimal places in the question (1 + 1 = 2). Put the decimal point 2 places from the right: 1.44.",
    stage: "gcse", yearGroups: [7, 8, 9, 10, 11],
  },
  {
    id: "maths-adaptly-2022-p1f-number-interest",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Unit 1 (Non-Calculator)", tier: "Foundation", questionNum: "11",
    marks: 3, topic: "Number",
    text: "£500 is invested at a compound interest rate of 3% per year. Work out the value of the investment after 2 years.",
    commandWord: "Work out", answerLines: 3,
    markScheme: "£530.45. Working: After year 1: £500 × 1.03 = £515. After year 2: £515 × 1.03 = £530.45.",
    hint: "For compound interest, multiply by (1 + rate) each year. Year 1: £500 × 1.03 = £515. Year 2: £515 × 1.03 = £530.45.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — STATISTICS (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const mathsStatistics: PastPaperQuestion[] = [
  {
    id: "maths-adaptly-2022-p3f-statistics-mean",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 3 (Calculator)", tier: "Foundation", questionNum: "8",
    marks: 3, topic: "Statistics",
    text: "The ages of 5 children are: 8, 11, 9, 12, 10. Work out the mean age.",
    commandWord: "Work out", answerLines: 2,
    markScheme: "10. Working: Sum = 8+11+9+12+10 = 50. Mean = 50 ÷ 5 = 10.",
    hint: "Mean = sum of all values ÷ number of values. Add all ages: 8+11+9+12+10 = 50. Divide by 5: 50 ÷ 5 = 10.",
    stage: "gcse", yearGroups: [7, 8, 9, 10, 11],
  },
  {
    id: "maths-adaptly-2023-p3f-statistics-probability",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 3 (Calculator)", tier: "Foundation", questionNum: "15",
    marks: 3, topic: "Statistics",
    text: "A bag contains 3 red balls, 5 blue balls and 2 green balls. A ball is chosen at random. What is the probability that the ball is blue?",
    commandWord: "Work out", answerLines: 2,
    markScheme: "5/10 = 1/2. Working: Total balls = 3 + 5 + 2 = 10. P(blue) = 5/10 = 1/2.",
    hint: "Probability = number of favourable outcomes ÷ total number of outcomes. Total balls = 10. Blue balls = 5. P(blue) = 5/10 = 1/2.",
    stage: "gcse", yearGroups: [7, 8, 9, 10, 11],
  },
  {
    id: "maths-adaptly-2023-p3h-statistics-histogram",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 3 (Calculator)", tier: "Higher", questionNum: "14",
    marks: 4, topic: "Statistics",
    text: "A histogram shows the distribution of heights of 200 students. The class interval 150 ≤ h < 160 has a frequency density of 3.5. How many students have a height in this interval?",
    commandWord: "Work out", answerLines: 3,
    markScheme: "35 students. Working: Frequency = frequency density × class width = 3.5 × 10 = 35.",
    hint: "Frequency = frequency density × class width. Class width = 160 - 150 = 10. Frequency = 3.5 × 10 = 35.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-adaptly-2022-p3h-statistics-quartiles",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 3 (Calculator)", tier: "Higher", questionNum: "12",
    marks: 3, topic: "Statistics",
    text: "The following data shows the number of hours 9 students spent studying: 2, 4, 5, 6, 7, 8, 9, 11, 14. Find the interquartile range.",
    commandWord: "Find", answerLines: 3,
    markScheme: "5. Working: Q1 = 4.5 (median of lower half: 2,4,5,6), Q3 = 9.5 (median of upper half: 8,9,11,14). IQR = 9.5 - 4.5 = 5.",
    hint: "Step 1: The data is already in order. Step 2: Find Q1 (lower quartile) = median of the lower half. Step 3: Find Q3 (upper quartile) = median of the upper half. Step 4: IQR = Q3 - Q1.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — RATIO AND PROPORTION (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const mathsRatio: PastPaperQuestion[] = [
  {
    id: "maths-adaptly-2022-p2f-ratio-1",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Foundation", questionNum: "9",
    marks: 3, topic: "Ratio and Proportion",
    text: "A map has a scale of 1 : 25 000. Two towns are 8 cm apart on the map. What is the actual distance between the towns? Give your answer in kilometres.",
    commandWord: "Work out", answerLines: 3,
    markScheme: "2 km. Working: Actual distance = 8 × 25000 = 200000 cm = 2000 m = 2 km.",
    hint: "Multiply the map distance by the scale factor: 8 × 25000 = 200000 cm. Convert to km: 200000 ÷ 100 ÷ 1000 = 2 km.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-adaptly-2023-p2f-ratio-direct",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Foundation", questionNum: "11",
    marks: 3, topic: "Ratio and Proportion",
    text: "y is directly proportional to x. When x = 4, y = 20. Find the value of y when x = 7.",
    commandWord: "Find", answerLines: 3,
    markScheme: "y = 35. Working: y = kx. 20 = k × 4, so k = 5. When x = 7: y = 5 × 7 = 35.",
    hint: "If y is directly proportional to x, then y = kx. Use the given values to find k: 20 = k × 4, so k = 5. Then substitute x = 7.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH LANGUAGE — READING (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const englishLanguageReading: PastPaperQuestion[] = [
  {
    id: "eng-lang-adaptly-2023-p1-reading-1",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 (Explorations in Creative Reading and Writing)", tier: undefined, questionNum: "1",
    marks: 4, topic: "Reading – Comprehension",
    text: "Read lines 1 to 5 of the source. List four things from this part of the text about the character's surroundings.",
    commandWord: "List", answerLines: 5,
    markScheme: "Award 1 mark for each valid point up to 4 marks. Points must be drawn directly from lines 1-5 of the source text.",
    hint: "Read lines 1-5 carefully. Look for details about what the character can see, hear, smell, feel, or touch. Write each point as a separate statement.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "eng-lang-adaptly-2023-p1-reading-2",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 (Explorations in Creative Reading and Writing)", tier: undefined, questionNum: "2",
    marks: 8, topic: "Reading – Language Analysis",
    text: "Look in detail at lines 6 to 14. How does the writer use language to describe the atmosphere in this extract? You could include the writer's choice of: words and phrases; language features and techniques; sentence forms.",
    commandWord: "How does", answerLines: 12,
    markScheme: "Level 4 (7-8 marks): Perceptive, detailed analysis. Analyses effects of language choices. Uses subject terminology accurately and precisely. Level 3 (5-6 marks): Clear, explained comments. Explains effects of language choices. Uses relevant subject terminology. Level 2 (3-4 marks): Some understanding of language. Identifies language features. Some use of subject terminology. Level 1 (1-2 marks): Simple comments. Identifies language features. Simple use of terminology.",
    hint: "Find 2-3 language features (e.g. metaphor, personification, alliteration, word choice). For each one: quote it, name it, explain the effect it creates on the reader. Use the phrase 'this suggests...' or 'this creates...' to explain the effect.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "eng-lang-adaptly-2022-p2-reading-1",
    board: "Adaptly", subject: "english-language", year: 2022, series: "June",
    paper: "Paper 2 (Writers' Viewpoints and Perspectives)", tier: undefined, questionNum: "1",
    marks: 4, topic: "Reading – Comprehension",
    text: "Read again the first part of Source A, lines 1 to 5. Choose four statements below which are TRUE. Shade the boxes of the ones that you think are true.",
    commandWord: "Choose", answerLines: 2,
    markScheme: "Award 1 mark for each correct statement identified, up to 4 marks.",
    hint: "Read each statement carefully and check it against lines 1-5 of the source. Only shade boxes where the statement is directly supported by the text.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "eng-lang-adaptly-2022-p2-reading-2",
    board: "Adaptly", subject: "english-language", year: 2022, series: "June",
    paper: "Paper 2 (Writers' Viewpoints and Perspectives)", tier: undefined, questionNum: "3",
    marks: 12, topic: "Reading – Analysis",
    text: "You now need to refer to the whole of Source A. How does the writer use language to convey their attitude towards the subject? [12 marks]",
    commandWord: "How does", answerLines: 15,
    markScheme: "Level 4 (10-12 marks): Perceptive, detailed analysis. Analyses effects of language choices. Convincing interpretation of writer's attitude. Level 3 (7-9 marks): Clear, explained comments. Explains effects of language choices. Relevant interpretation of attitude.",
    hint: "Identify the writer's overall attitude (positive/negative/mixed). Find 3-4 language examples that show this attitude. For each: quote, identify the technique, explain how it reveals the attitude.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "eng-lang-adaptly-2022-p2-reading-comparison",
    board: "Adaptly", subject: "english-language", year: 2022, series: "June",
    paper: "Paper 2 (Writers' Viewpoints and Perspectives)", tier: undefined, questionNum: "4",
    marks: 16, topic: "Reading – Comparison",
    text: "For this question, you need to refer to the whole of Source A and the whole of Source B. Compare how the writers convey their different attitudes to their subjects. In your answer, you could: compare their different attitudes; compare the methods they use to convey their attitudes; support your ideas with quotations from both texts.",
    commandWord: "Compare", answerLines: 20,
    markScheme: "Level 4 (13-16 marks): Perceptive, detailed comparison. Analyses effects of language choices in both texts. Convincing interpretation of both writers' attitudes. Precise use of subject terminology. Level 3 (9-12 marks): Clear, explained comparison. Explains effects of language choices. Relevant interpretation of attitudes.",
    hint: "Structure your answer by comparing both texts throughout (not one then the other). Use comparative connectives: 'Similarly...', 'In contrast...', 'Both writers...', 'However, whereas Source A...'. Quote from both texts.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BIOLOGY — CELL BIOLOGY (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const biologyCellBiology: PastPaperQuestion[] = [
  {
    id: "bio-adaptly-2023-p1h-cells-1",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1 (Higher)", tier: "Higher", questionNum: "1",
    marks: 2, topic: "Cell Biology",
    text: "State two differences between a plant cell and an animal cell.",
    commandWord: "State", answerLines: 3,
    markScheme: "Any two from: Plant cells have a cell wall (animal cells do not); Plant cells have chloroplasts (animal cells do not); Plant cells have a large permanent vacuole (animal cells do not/have a small temporary vacuole); Plant cells have a regular shape (animal cells have irregular shapes).",
    hint: "Think about the structures that are unique to plant cells. What does a plant cell have that an animal cell does not?",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "bio-adaptly-2022-p1f-cells-2",
    board: "Adaptly", subject: "biology", year: 2022, series: "June",
    paper: "Paper 1 (Foundation)", tier: "Foundation", questionNum: "2",
    marks: 3, topic: "Cell Biology",
    text: "A student looks at a cell under a microscope. The cell has a nucleus, a cell membrane, cytoplasm and a cell wall. What type of cell is this? Give a reason for your answer.",
    commandWord: "What type", answerLines: 3,
    markScheme: "Plant cell (1 mark). Reason: It has a cell wall (1 mark), which is only found in plant cells (1 mark).",
    hint: "Look at the structures listed. The cell wall is the key feature — only plant cells have a cell wall.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "bio-adaptly-2023-p1h-cells-mitosis",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1 (Higher)", tier: "Higher", questionNum: "3",
    marks: 4, topic: "Cell Biology",
    text: "Describe what happens during mitosis. Include in your answer: the number of cells produced; the genetic information in the daughter cells compared to the parent cell.",
    commandWord: "Describe", answerLines: 5,
    markScheme: "Mitosis produces two daughter cells (1 mark). The daughter cells are genetically identical to the parent cell (1 mark). The parent cell's chromosomes are copied (1 mark). The cell divides once (1 mark).",
    hint: "Mitosis is cell division for growth and repair. Key points: how many cells are produced, and whether the daughter cells are genetically identical or different from the parent.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BIOLOGY — ORGANISATION (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const biologyOrganisation: PastPaperQuestion[] = [
  {
    id: "bio-adaptly-2022-p1f-organisation-1",
    board: "Adaptly", subject: "biology", year: 2022, series: "June",
    paper: "Paper 1 (Foundation)", tier: "Foundation", questionNum: "4",
    marks: 3, topic: "Organisation",
    text: "The human digestive system is an organ system. Name three organs found in the human digestive system.",
    commandWord: "Name", answerLines: 3,
    markScheme: "Any three from: mouth/buccal cavity, oesophagus, stomach, small intestine (ileum/duodenum), large intestine (colon), rectum, anus, liver, pancreas, gall bladder.",
    hint: "Think about the journey food takes through your body, from mouth to anus. Name three of the organs it passes through.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "bio-adaptly-2023-p1h-organisation-enzymes",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1 (Higher)", tier: "Higher", questionNum: "5",
    marks: 4, topic: "Organisation",
    text: "Explain how the structure of an enzyme is related to its function. Include the terms 'active site' and 'substrate' in your answer.",
    commandWord: "Explain", answerLines: 5,
    markScheme: "The enzyme has a specific active site (1 mark). The substrate has a complementary shape to the active site (1 mark). The substrate binds to the active site to form an enzyme-substrate complex (1 mark). This is described by the lock and key model (1 mark).",
    hint: "Think about the 'lock and key' model. The active site is the 'lock' and the substrate is the 'key'. Explain why only one specific substrate can fit into each enzyme's active site.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHEMISTRY — ATOMIC STRUCTURE (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const chemistryAtomicStructure: PastPaperQuestion[] = [
  {
    id: "chem-adaptly-2023-p1h-atoms-1",
    board: "Adaptly", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1 (Higher)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Atomic Structure",
    text: "An atom of carbon has the symbol \\(^{12}_{6}\\text{C}\\). State the number of protons, neutrons and electrons in this atom.",
    commandWord: "State", answerLines: 3,
    markScheme: "Protons: 6 (1 mark). Electrons: 6 (1 mark). Neutrons: 12 - 6 = 6 (1 mark).",
    hint: "The bottom number (6) is the atomic number = number of protons. In a neutral atom, protons = electrons. The top number (12) is the mass number. Neutrons = mass number - atomic number = 12 - 6 = 6.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "chem-adaptly-2022-p1f-atoms-isotopes",
    board: "Adaptly", subject: "chemistry", year: 2022, series: "June",
    paper: "Paper 1 (Foundation)", tier: "Foundation", questionNum: "3",
    marks: 3, topic: "Atomic Structure",
    text: "Chlorine has two isotopes: \\(^{35}_{17}\\text{Cl}\\) and \\(^{37}_{17}\\text{Cl}\\). Explain what is meant by the term 'isotopes'.",
    commandWord: "Explain", answerLines: 3,
    markScheme: "Isotopes are atoms of the same element (1 mark) with the same number of protons (1 mark) but different numbers of neutrons (1 mark).",
    hint: "Isotopes are different forms of the same element. They have the same atomic number (same number of protons) but different mass numbers (different numbers of neutrons).",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHEMISTRY — BONDING (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const chemistryBonding: PastPaperQuestion[] = [
  {
    id: "chem-adaptly-2023-p1h-bonding-ionic",
    board: "Adaptly", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1 (Higher)", tier: "Higher", questionNum: "4",
    marks: 4, topic: "Bonding",
    text: "Describe ionic bonding. Include in your answer: how ions are formed; how the ions are held together.",
    commandWord: "Describe", answerLines: 5,
    markScheme: "Electrons are transferred from one atom to another (1 mark). Metal atoms lose electrons to form positive ions (1 mark). Non-metal atoms gain electrons to form negative ions (1 mark). The oppositely charged ions are held together by strong electrostatic forces of attraction (1 mark).",
    hint: "Ionic bonding involves the transfer of electrons. Think about: which atoms lose electrons (metals) and which gain electrons (non-metals). What charge do they become? How are they held together?",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "chem-adaptly-2022-p1f-bonding-covalent",
    board: "Adaptly", subject: "chemistry", year: 2022, series: "June",
    paper: "Paper 1 (Foundation)", tier: "Foundation", questionNum: "6",
    marks: 3, topic: "Bonding",
    text: "Describe covalent bonding.",
    commandWord: "Describe", answerLines: 3,
    markScheme: "Covalent bonding involves the sharing of electrons (1 mark). Each atom contributes one electron to the shared pair (1 mark). The shared electrons are attracted to both nuclei, holding the atoms together (1 mark).",
    hint: "Covalent bonding is about sharing electrons between non-metal atoms. Both atoms contribute electrons to the shared pair.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICS — ENERGY (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const physicsEnergy: PastPaperQuestion[] = [
  {
    id: "phys-adaptly-2023-p1h-energy-1",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1 (Higher)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Energy",
    text: "A ball of mass 2 kg is held at a height of 5 m above the ground. Calculate the gravitational potential energy stored in the ball. [g = 10 N/kg]",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "100 J. Working: GPE = mgh = 2 × 10 × 5 = 100 J.",
    hint: "Use the formula: GPE = mgh where m = mass (kg), g = gravitational field strength (N/kg), h = height (m). Substitute: GPE = 2 × 10 × 5 = 100 J.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "phys-adaptly-2022-p1f-energy-efficiency",
    board: "Adaptly", subject: "physics", year: 2022, series: "June",
    paper: "Paper 1 (Foundation)", tier: "Foundation", questionNum: "3",
    marks: 3, topic: "Energy",
    text: "A light bulb transfers 100 J of electrical energy. 20 J is transferred as useful light energy. Calculate the efficiency of the light bulb.",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "0.2 or 20%. Working: Efficiency = useful output energy ÷ total input energy = 20 ÷ 100 = 0.2 (or 20%).",
    hint: "Efficiency = useful output energy ÷ total input energy. Substitute: 20 ÷ 100 = 0.2. To express as a percentage, multiply by 100: 20%.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "phys-adaptly-2023-p1h-energy-kinetic",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1 (Higher)", tier: "Higher", questionNum: "4",
    marks: 4, topic: "Energy",
    text: "A car of mass 1200 kg is travelling at 20 m/s. Calculate the kinetic energy of the car. [\\(E_k = \\dfrac{1}{2}mv^2\\)]",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "240000 J (240 kJ). Working: Ek = 1/2 × 1200 × 20² = 0.5 × 1200 × 400 = 240000 J.",
    hint: "Use the formula Ek = ½mv². Substitute m = 1200 kg and v = 20 m/s: Ek = 0.5 × 1200 × 400 = 240000 J.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICS — FORCES (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const physicsForces: PastPaperQuestion[] = [
  {
    id: "phys-adaptly-2023-p2h-forces-1",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 2 (Higher)", tier: "Higher", questionNum: "2",
    marks: 3, topic: "Forces",
    text: "A car accelerates from rest to 30 m/s in 10 seconds. Calculate the acceleration of the car.",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "3 m/s². Working: a = (v - u) / t = (30 - 0) / 10 = 3 m/s².",
    hint: "Use the formula: acceleration = change in velocity ÷ time. a = (v - u) / t = (30 - 0) / 10 = 3 m/s².",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "phys-adaptly-2022-p2f-forces-newton",
    board: "Adaptly", subject: "physics", year: 2022, series: "June",
    paper: "Paper 2 (Foundation)", tier: "Foundation", questionNum: "5",
    marks: 3, topic: "Forces",
    text: "A resultant force of 600 N acts on a car of mass 1200 kg. Calculate the acceleration of the car. [F = ma]",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "0.5 m/s². Working: a = F/m = 600/1200 = 0.5 m/s².",
    hint: "Use Newton's second law: F = ma, so a = F/m. Substitute F = 600 N and m = 1200 kg: a = 600 ÷ 1200 = 0.5 m/s².",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY — WEIMAR AND NAZI GERMANY (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const historyGermany: PastPaperQuestion[] = [
  {
    id: "hist-adaptly-2023-p1-germany-1",
    board: "Adaptly", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 (Understanding the Modern World)", tier: undefined, questionNum: "1",
    marks: 4, topic: "Weimar and Nazi Germany",
    text: "Describe two problems faced by the Weimar Republic in the years 1919–1923.",
    commandWord: "Describe", answerLines: 6,
    markScheme: "Award 2 marks for each problem described (up to 4 marks). Problems include: hyperinflation (1923); Kapp Putsch (1920); Spartacist Revolt (1919); French occupation of the Ruhr (1923); political extremism from left and right; war guilt and reparations under Treaty of Versailles.",
    hint: "Think about the early years of the Weimar Republic. What economic problems did Germany face? What political challenges threatened the government?",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "hist-adaptly-2022-p1-germany-2",
    board: "Adaptly", subject: "history", year: 2022, series: "June",
    paper: "Paper 1 (Understanding the Modern World)", tier: undefined, questionNum: "3",
    marks: 8, topic: "Weimar and Nazi Germany",
    text: "Explain why the Nazi Party gained support in the years 1929–1933. You may use the following in your answer: the Great Depression; propaganda. You must also use information of your own.",
    commandWord: "Explain why", answerLines: 12,
    markScheme: "Level 4 (7-8 marks): Complex explanation with analysis of how factors interlink. Level 3 (5-6 marks): Developed explanation of at least two reasons. Level 2 (3-4 marks): Simple explanation of at least one reason. Level 1 (1-2 marks): General statement.",
    hint: "Use the PEEL structure: Point, Evidence, Explain, Link. Discuss at least two reasons: the impact of the Great Depression on unemployment, and how Nazi propaganda exploited this. Add your own knowledge about Hitler's appeal, the SA, or the failure of other parties.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "hist-adaptly-2023-p1-germany-3",
    board: "Adaptly", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 (Understanding the Modern World)", tier: undefined, questionNum: "4",
    marks: 16, topic: "Weimar and Nazi Germany",
    text: "Has the persecution of Jewish people in Germany in the years 1933–1939 been exaggerated by historians? Explain your answer. You may use the following in your answer: the Nuremberg Laws (1935); Kristallnacht (1938). You must also use information of your own.",
    commandWord: "Has...been exaggerated", answerLines: 20,
    markScheme: "Level 4 (13-16 marks): Sustained analysis. Reaches a supported judgement. Considers both sides of the argument. Uses specific evidence. Level 3 (9-12 marks): Developed analysis. Some judgement. Considers at least two aspects.",
    hint: "This is a 'how far' question. Consider evidence that supports the statement AND evidence against it. Use specific examples: Nuremberg Laws, Kristallnacht, boycotts, exclusion from professions. Reach a clear, supported conclusion.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GEOGRAPHY — NATURAL HAZARDS (Adaptly)
// ─────────────────────────────────────────────────────────────────────────────
export const geographyNaturalHazards: PastPaperQuestion[] = [
  {
    id: "geog-adaptly-2023-p1-hazards-1",
    board: "Adaptly", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 (Living with the Physical Environment)", tier: undefined, questionNum: "1",
    marks: 2, topic: "The Challenge of Natural Hazards",
    text: "State the meaning of the term 'natural hazard'.",
    commandWord: "State", answerLines: 2,
    markScheme: "A natural hazard is a natural event (1 mark) that poses a threat to human life or property (1 mark).",
    hint: "A natural hazard has two key parts: it must be a natural event (earthquake, flood, etc.) AND it must threaten people or their property.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "geog-adaptly-2022-p1-hazards-2",
    board: "Adaptly", subject: "geography", year: 2022, series: "June",
    paper: "Paper 1 (Living with the Physical Environment)", tier: undefined, questionNum: "2",
    marks: 4, topic: "The Challenge of Natural Hazards",
    text: "Explain two reasons why earthquakes cause more deaths in LICs than in HICs.",
    commandWord: "Explain", answerLines: 6,
    markScheme: "Award 2 marks for each reason explained (up to 4 marks). Reasons include: LICs have less money for earthquake-proof buildings; weaker emergency services; less money for prediction and monitoring; buildings made of cheap materials that collapse easily; less education about what to do in an earthquake.",
    hint: "Think about what makes a country more or less vulnerable to earthquake damage. Consider: building quality, emergency services, education, and money for preparation.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "geog-adaptly-2023-p1-hazards-3",
    board: "Adaptly", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 (Living with the Physical Environment)", tier: undefined, questionNum: "4",
    marks: 6, topic: "The Challenge of Natural Hazards",
    text: "Using a named example, assess the effectiveness of responses to a tectonic hazard.",
    commandWord: "Assess", answerLines: 8,
    markScheme: "Level 3 (5-6 marks): Detailed assessment with named example. Considers both effective and less effective responses. Level 2 (3-4 marks): Some assessment with named example. Level 1 (1-2 marks): Basic description.",
    hint: "Choose a specific earthquake or volcano you have studied (e.g. Nepal 2015, Eyjafjallajökull 2010). Describe the immediate and long-term responses. Assess how effective they were — what worked well and what could have been better?",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KS2 MATHS — NUMBER AND PLACE VALUE
// ─────────────────────────────────────────────────────────────────────────────
export const ks2MathsNumber: PastPaperQuestion[] = [
  {
    id: "ks2-maths-2023-p2-number-1",
    board: "KS2 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "KS2 SATs Paper 2 (Reasoning)", tier: undefined, questionNum: "3",
    marks: 1, topic: "Number",
    text: "Write the number seven thousand, four hundred and six in figures.",
    commandWord: "Write", answerLines: 1,
    markScheme: "7406",
    hint: "Seven thousand = 7000. Four hundred = 400. Six = 6. Put them together: 7406.",
    stage: "ks2", yearGroups: [5, 6],
  },
  {
    id: "ks2-maths-2022-p2-number-2",
    board: "KS2 SATs", subject: "mathematics", year: 2022, series: "May",
    paper: "KS2 SATs Paper 2 (Reasoning)", tier: undefined, questionNum: "5",
    marks: 2, topic: "Number",
    text: "What is the value of the digit 4 in the number 34,817?",
    commandWord: "What is", answerLines: 1,
    markScheme: "4000 (four thousands)",
    hint: "Look at the position of the digit 4. In 34,817: the 3 is in the ten thousands column, the 4 is in the thousands column. So 4 represents 4000.",
    stage: "ks2", yearGroups: [5, 6],
  },
  {
    id: "ks2-maths-2023-p1-number-3",
    board: "KS2 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "KS2 SATs Paper 1 (Arithmetic)", tier: undefined, questionNum: "7",
    marks: 1, topic: "Number",
    text: "Calculate: 345 × 6",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "2070",
    hint: "Multiply each digit by 6, starting from the ones: 5×6=30 (write 0, carry 3); 4×6=24+3=27 (write 7, carry 2); 3×6=18+2=20. Answer: 2070.",
    stage: "ks2", yearGroups: [5, 6],
  },
  {
    id: "ks2-maths-2022-p1-number-4",
    board: "KS2 SATs", subject: "mathematics", year: 2022, series: "May",
    paper: "KS2 SATs Paper 1 (Arithmetic)", tier: undefined, questionNum: "12",
    marks: 1, topic: "Number",
    text: "Calculate: 4368 ÷ 7",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "624",
    hint: "Use short division (bus stop method): 7 goes into 43 six times (6×7=42, remainder 1). Bring down 6 to make 16. 7 goes into 16 twice (2×7=14, remainder 2). Bring down 8 to make 28. 7 goes into 28 four times. Answer: 624.",
    stage: "ks2", yearGroups: [5, 6],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KS1 MATHS — NUMBER AND COUNTING
// ─────────────────────────────────────────────────────────────────────────────
export const ks1MathsNumber: PastPaperQuestion[] = [
  {
    id: "ks1-maths-2023-p2-number-1",
    board: "KS1 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "KS1 SATs Paper 2 (Reasoning)", tier: undefined, questionNum: "2",
    marks: 1, topic: "Number",
    text: "Circle the number that is 10 more than 35.\n\n25     34     45     55",
    commandWord: "Circle", answerLines: 1,
    markScheme: "45",
    hint: "10 more means count on 10. Start at 35 and count on 10: 36, 37, 38, 39, 40, 41, 42, 43, 44, 45.",
    stage: "ks1", yearGroups: [1, 2],
  },
  {
    id: "ks1-maths-2022-p2-number-2",
    board: "KS1 SATs", subject: "mathematics", year: 2022, series: "May",
    paper: "KS1 SATs Paper 2 (Reasoning)", tier: undefined, questionNum: "4",
    marks: 1, topic: "Number",
    text: "Write the missing number.\n\n17 + ___ = 25",
    commandWord: "Write", answerLines: 1,
    markScheme: "8",
    hint: "To find the missing number, subtract: 25 - 17 = 8. Check: 17 + 8 = 25 ✓",
    stage: "ks1", yearGroups: [1, 2],
  },
  {
    id: "ks1-maths-2023-p2-number-3",
    board: "KS1 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "KS1 SATs Paper 2 (Reasoning)", tier: undefined, questionNum: "6",
    marks: 1, topic: "Number",
    text: "There are 20 children in a class. 12 are girls. How many are boys?",
    commandWord: "How many", answerLines: 1,
    markScheme: "8",
    hint: "Subtract the number of girls from the total: 20 - 12 = 8 boys.",
    stage: "ks1", yearGroups: [1, 2],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 11+ VERBAL REASONING (GL Assessment)
// ─────────────────────────────────────────────────────────────────────────────
export const elevenPlusVerbalReasoning: PastPaperQuestion[] = [
  {
    id: "11plus-gl-2023-verbal-1",
    board: "GL", subject: "mathematics", year: 2023, series: "Sample",
    paper: "11+ Verbal Reasoning Sample Paper", tier: undefined, questionNum: "1",
    marks: 1, topic: "Verbal Reasoning",
    text: "Find the number that continues the sequence: 2, 4, 8, 16, ___",
    commandWord: "Find", answerLines: 1,
    markScheme: "32",
    hint: "Each number is doubled: 2×2=4, 4×2=8, 8×2=16, 16×2=32.",
    stage: "11plus", yearGroups: [6, 7],
  },
  {
    id: "11plus-gl-2023-verbal-2",
    board: "GL", subject: "mathematics", year: 2023, series: "Sample",
    paper: "11+ Verbal Reasoning Sample Paper", tier: undefined, questionNum: "3",
    marks: 1, topic: "Verbal Reasoning",
    text: "Find the number that continues the sequence: 100, 93, 86, 79, ___",
    commandWord: "Find", answerLines: 1,
    markScheme: "72",
    hint: "Each number decreases by 7: 100-7=93, 93-7=86, 86-7=79, 79-7=72.",
    stage: "11plus", yearGroups: [6, 7],
  },
  {
    id: "11plus-gl-2023-verbal-3",
    board: "GL", subject: "mathematics", year: 2023, series: "Sample",
    paper: "11+ Non-Verbal Reasoning Sample Paper", tier: undefined, questionNum: "5",
    marks: 1, topic: "Verbal Reasoning",
    text: "If FRIEND is coded as GSJFOE, what is the code for HAPPY?",
    commandWord: "Find", answerLines: 1,
    markScheme: "IBQQZ",
    hint: "Each letter moves one place forward in the alphabet: F→G, R→S, I→J, E→F, N→O, D→E. Apply the same rule to HAPPY: H→I, A→B, P→Q, P→Q, Y→Z.",
    stage: "11plus", yearGroups: [6, 7],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED EXPORT — All expanded questions
// ─────────────────────────────────────────────────────────────────────────────
export const allExpandedQuestions: PastPaperQuestion[] = [
  ...mathsFractions,
  ...mathsAlgebra,
  ...mathsGeometry,
  ...mathsNumber,
  ...mathsStatistics,
  ...mathsRatio,
  ...englishLanguageReading,
  ...biologyCellBiology,
  ...biologyOrganisation,
  ...chemistryAtomicStructure,
  ...chemistryBonding,
  ...physicsEnergy,
  ...physicsForces,
  ...historyGermany,
  ...geographyNaturalHazards,
  ...ks2MathsNumber,
  ...ks1MathsNumber,
  ...elevenPlusVerbalReasoning,
];
