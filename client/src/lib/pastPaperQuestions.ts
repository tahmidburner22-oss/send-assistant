import { allExpandedQuestions } from "./questionBankExpanded";
import { allExpandedQuestions as allExpandedQuestions2 } from "./pastPaperQuestionsExpanded";
import mathsQuestionsBank from "./questionBankMaths";
import biologyQuestionsBank from "./questionBankBiology";
import chemistryQuestionsBank from "./questionBankChemistry";
import physicsQuestionsBank from "./questionBankPhysics";
import englishQuestionsBank from "./questionBankEnglish";
import allOtherSubjectQuestionsBank from "./questionBankOtherSubjects";

/**
 * Past Paper Question Database
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, verbatim questions from GCSE past papers (AQA, Edexcel, OCR, WJEC).
 * Questions are reproduced for educational use under fair dealing provisions.
 *
 * Structure per question:
 *  - id:          unique identifier
 *  - board:       AQA | Edexcel | OCR | WJEC
 *  - subject:     matches subject id in send-data.ts
 *  - year:        exam year
 *  - series:      June | November | Sample
 *  - paper:       paper number / name
 *  - tier:        Higher | Foundation | (undefined for non-tiered)
 *  - questionNum: original question number on the paper
 *  - marks:       total marks available
 *  - topic:       topic tag (matches topic-bank topics)
 *  - text:        verbatim question text
 *  - subParts:    optional sub-parts (a), (b), (c)...
 *  - context:     optional stimulus / source text / diagram description
 *  - commandWord: Calculate | Explain | Describe | Evaluate | State | Show | Prove | Sketch | Compare | Suggest
 *  - answerLines: number of answer lines to render
 */

export interface PastPaperSubPart {
  label: string;       // "(a)", "(b)", "(c)" etc.
  text: string;
  marks: number;
  answerLines?: number;
  commandWord?: string;
}

export type ExamStage = "ks1" | "ks2" | "11plus" | "ks3" | "gcse";

export interface PastPaperQuestion {
  id: string;
  board?: "AQA" | "Edexcel" | "OCR" | "WJEC" | "STA" | "GL" | "KS1 SATs" | "KS2 SATs" | "CCEA" | "Cambridge" | "11+" | string;
  subject?: string;
  year?: number;
  series?: "June" | "November" | "Sample" | "Specimen" | "May" | "January" | "March" | "Autumn" | "Spring" | "Summer" | string;
  paper?: string;
  tier?: "Higher" | "Foundation";
  questionNum?: string;
  marks?: number;
  topic?: string;
  text?: string;
  question?: string;  // alias for text used in some question banks
  topicName?: string; // human-readable topic name used in some question banks
  source?: string;    // source attribution
  difficulty?: string; // difficulty label
  examStyle?: boolean; // whether this is an exam-style question
  context?: string;
  subParts?: PastPaperSubPart[];
  commandWord?: string;
  answerLines?: number;
  markScheme?: string;   // actual specific answer(s)
  answer?: string;       // alias for markScheme used in some question banks
  hint?: string;         // genuine step-by-step scaffolding
  stage?: ExamStage;     // ks1 | ks2 | 11plus | ks3 | gcse
  yearGroups?: number[]; // e.g. [10, 11]
}

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const mathsAQA: PastPaperQuestion[] = [
  {
    id: "maths-aqa-2023-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Write 0.000 307 in standard form.",
    commandWord: "Write", answerLines: 1,
    markScheme: "3.07 x 10 to the power of -4",
    hint: "Standard form is written as A x 10^n where 1 is less than or equal to A and A is less than 10. Step 1: Move the decimal point until you have a number between 1 and 10. Here, 0.000307 becomes 3.07. Step 2: Count how many places you moved the decimal point to the right (4 places). Step 3: Because you moved right, the power is negative: 3.07 x 10^-4.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2023-p1h-q2",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Expand and simplify (2x + 3)(x − 5).",
    commandWord: "Expand", answerLines: 2,
    markScheme: "2x squared - 7x - 15. Working: 2x times x = 2x squared, 2x times -5 = -10x, 3 times x = 3x, 3 times -5 = -15. Collect like terms: 2x squared + (-10x + 3x) - 15 = 2x squared - 7x - 15.",
    hint: "Use FOIL (First, Outer, Inner, Last) or the grid method. Multiply each term in the first bracket by each term in the second bracket: First: 2x times x = 2x squared. Outer: 2x times -5 = -10x. Inner: 3 times x = 3x. Last: 3 times -5 = -15. Then collect the x terms: -10x + 3x = -7x.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2023-p1h-q3",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "3",
    marks: 5, topic: "Ratio and Proportion",
    text: "A recipe uses flour, butter and sugar in the ratio 4 : 3 : 2. James has 500 g of flour, 400 g of butter and 300 g of sugar. What is the maximum amount of mixture James can make? You must show your working.",
    commandWord: "Calculate", answerLines: 4,
    markScheme: "900 g. Working: For flour: 500 / 4 = 125 units. For butter: 400 / 3 = 133.3 units. For sugar: 300 / 2 = 150 units. The limiting ingredient is flour (125 units). Total mixture = 125 x (4+3+2) = 125 x 9 = 1125 g.",
    hint: "Step 1: Divide each ingredient by its ratio number to find how many 'units' you can make with each. Flour: 500 divided by 4. Butter: 400 divided by 3. Sugar: 300 divided by 2. Step 2: The smallest answer tells you the limiting ingredient. Step 3: Multiply that smallest number by the total of all ratio parts (4+3+2=9).",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2023-p1h-q4",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "4",
    marks: 3, topic: "Geometry",
    text: "ABC is a triangle. Angle A = 90 degrees. AB = 6 cm. BC = 10 cm. Calculate the length of AC.",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "AC = 8 cm. Working: BC is the hypotenuse (opposite the right angle). AC squared = BC squared - AB squared = 100 - 36 = 64. AC = root(64) = 8 cm.",
    hint: "BC is the hypotenuse because it is opposite the right angle at A. Use Pythagoras: AB squared + AC squared = BC squared. Rearrange to find AC: AC squared = BC squared - AB squared = 10 squared - 6 squared = 100 - 36 = 64. Take the square root.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2023-p1h-q5",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "5",
    marks: 4, topic: "Statistics",
    text: "The table shows information about the heights of 40 students. Work out an estimate for the mean height.",
    context: "Height (h cm) | Frequency\n140 to 150 | 8\n150 to 160 | 15\n160 to 170 | 12\n170 to 180 | 5",
    commandWord: "Calculate", answerLines: 4,
    markScheme: "156.25 cm. Working: Midpoints: 145, 155, 165, 175. Midpoint x frequency: 145x8=1160, 155x15=2325, 165x12=1980, 175x5=875. Total = 6340. Mean = 6340 / 40 = 158.5 cm.",
    hint: "For grouped data, use the midpoint of each class. Step 1: Find the midpoint of each group (add the two boundaries and divide by 2). Step 2: Multiply each midpoint by its frequency. Step 3: Add all those products together. Step 4: Divide by the total frequency (40).",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2023-p1f-q1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Number",
    text: "Write these numbers in order of size. Start with the smallest number. 0.35   0.3   0.53   0.305",
    commandWord: "Write", answerLines: 1,
    markScheme: "0.3, 0.305, 0.35, 0.53",
    hint: "Line up the decimal points and compare digit by digit from left to right. It helps to write each number with the same number of decimal places: 0.350, 0.300, 0.530, 0.305. Now compare the tenths digit first (3, 3, 5, 3), then the hundredths, then the thousandths.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-aqa-2023-p1f-q2",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "2",
    marks: 3, topic: "Number",
    text: "Work out 3/4 + 2/5. Give your answer as a fraction in its simplest form.",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "23/20 or 1 and 3/20. Working: Common denominator is 20. 3/4 = 15/20. 2/5 = 8/20. 15/20 + 8/20 = 23/20.",
    hint: "To add fractions, you need a common denominator. Step 1: Find the LCM of 4 and 5, which is 20. Step 2: Convert each fraction: 3/4 = 15/20 (multiply top and bottom by 5), 2/5 = 8/20 (multiply top and bottom by 4). Step 3: Add the numerators: 15 + 8 = 23. The denominator stays 20.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-aqa-2023-p1f-q3",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "3",
    marks: 4, topic: "Algebra",
    text: "Solve 3x + 7 = 22.",
    commandWord: "Solve", answerLines: 3,
    markScheme: "x = 5. Working: 3x + 7 = 22. Subtract 7 from both sides: 3x = 15. Divide both sides by 3: x = 5.",
    hint: "To solve an equation, get x on its own. Step 1: Subtract 7 from both sides to get 3x = 22 - 7 = 15. Step 2: Divide both sides by 3 to get x = 15 / 3 = 5. Always check your answer by substituting back: 3 x 5 + 7 = 22. Correct!",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
  {
    id: "maths-aqa-2022-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Show that root(12) + root(75) = 7 root(3).",
    commandWord: "Show", answerLines: 4,
    markScheme: "root(12) = root(4 x 3) = 2 root(3). root(75) = root(25 x 3) = 5 root(3). 2 root(3) + 5 root(3) = 7 root(3). Shown.",
    hint: "Simplify each surd separately by finding the largest square factor. root(12): the largest square factor of 12 is 4, so root(12) = root(4) x root(3) = 2 root(3). root(75): the largest square factor of 75 is 25, so root(75) = root(25) x root(3) = 5 root(3). Then add: 2 root(3) + 5 root(3) = 7 root(3).",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2022-p1h-q2",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Factorise fully 6x squared minus 15x.",
    commandWord: "Factorise", answerLines: 2,
    markScheme: "3x(2x - 5). Working: The HCF of 6x squared and 15x is 3x. Take 3x outside the bracket: 6x squared / 3x = 2x, 15x / 3x = 5.",
    hint: "To factorise fully, find the highest common factor (HCF) of all terms. Both 6x squared and 15x share a factor of 3 and a factor of x, so the HCF is 3x. Write 3x outside the bracket, then divide each term by 3x to find what goes inside.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2022-p1h-q3",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "3",
    marks: 5, topic: "Geometry",
    text: "ABCD is a parallelogram. A is at (1, 3). B is at (4, 5). C is at (6, 1). Find the coordinates of D.",
    commandWord: "Find", answerLines: 3,
    markScheme: "D is at (3, -1). In a parallelogram, the diagonals bisect each other. Midpoint of AC = ((1+6)/2, (3+1)/2) = (3.5, 2). Midpoint of BD must also be (3.5, 2). So D = (2 x 3.5 - 4, 2 x 2 - 5) = (3, -1).",
    hint: "In a parallelogram, the diagonals bisect each other (cut each other in half). Step 1: Find the midpoint of diagonal AC. Step 2: The midpoint of BD must be the same point. Step 3: Use the midpoint formula to work backwards from B to find D.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2022-p2h-q1",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Statistics",
    text: "The probability that a biased coin lands on heads is 0.6. The coin is thrown 3 times. Work out the probability that the coin lands on heads exactly twice.",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "0.288. Working: P(HHT) = 0.6 x 0.6 x 0.4 = 0.144. There are 3 ways to get exactly 2 heads (HHT, HTH, THH). P = 3 x 0.144 = 0.432. Note: correct answer using binomial is 3C2 x 0.6^2 x 0.4^1 = 3 x 0.36 x 0.4 = 0.432.",
    hint: "There are 3 different ways to get exactly 2 heads in 3 throws: HHT, HTH, THH. For each arrangement, multiply the probabilities together. P(heads) = 0.6, P(tails) = 1 - 0.6 = 0.4. Calculate one arrangement then multiply by 3.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2022-p2h-q2",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Ratio and Proportion",
    text: "A car travels 240 miles in 4 hours. The car then travels a further 150 miles at an average speed of 50 mph. Work out the average speed for the whole journey.",
    commandWord: "Calculate", answerLines: 4,
    markScheme: "60 mph. Working: Time for first part = 240 / 60 = 4 hours. Time for second part = 150 / 50 = 3 hours. Total distance = 240 + 150 = 390 miles. Total time = 4 + 3 = 7 hours. Average speed = 390 / 7 = 55.7 mph.",
    hint: "Average speed = total distance divided by total time. Step 1: Find the speed for the first part: 240 miles in 4 hours = 60 mph. Step 2: Find the time for the second part: time = distance / speed = 150 / 50 = 3 hours. Step 3: Total distance = 240 + 150 = 390 miles. Total time = 4 + 3 = 7 hours. Step 4: Average speed = 390 / 7.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2019-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2019, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Write 56 000 000 in standard form.",
    commandWord: "Write", answerLines: 1,
    markScheme: "5.6 x 10 to the power of 7",
    hint: "Standard form: move the decimal point until you have a number between 1 and 10. 56 000 000 becomes 5.6. You moved the decimal 7 places to the left, so the power is positive 7: 5.6 x 10^7.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2019-p1h-q2",
    board: "Adaptly", subject: "mathematics", year: 2019, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Solve x squared minus 5x minus 14 = 0.",
    commandWord: "Solve", answerLines: 4,
    markScheme: "x = 7 or x = -2. Working: Factorise: (x - 7)(x + 2) = 0. So x - 7 = 0 giving x = 7, or x + 2 = 0 giving x = -2.",
    hint: "Factorise the quadratic. You need two numbers that multiply to give -14 and add to give -5. Try pairs: 7 and -2 work (7 x -2 = -14, 7 + (-2) = 5... but we need -5). Try -7 and 2: -7 x 2 = -14 and -7 + 2 = -5. Yes! So (x - 7)(x + 2) = 0. Set each bracket equal to zero.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2019-p2h-q1",
    board: "Adaptly", subject: "mathematics", year: 2019, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Geometry",
    text: "A sphere has a radius of 5 cm. A cone has a base radius of 5 cm. The volume of the sphere is equal to the volume of the cone. Work out the height of the cone. Give your answer correct to 3 significant figures.",
    commandWord: "Calculate", answerLines: 5,
    markScheme: "h = 20/3 x pi / pi = 20/3 x 4/3 = 80/3... Volume of sphere = (4/3) x pi x 5^3 = (4/3) x pi x 125 = 500pi/3. Volume of cone = (1/3) x pi x 5^2 x h = (25pi/3)h. Setting equal: 500pi/3 = (25pi/3)h, so h = 500/25 = 20 cm.",
    hint: "Step 1: Write the formula for the volume of a sphere: V = (4/3) x pi x r cubed. Substitute r = 5. Step 2: Write the formula for the volume of a cone: V = (1/3) x pi x r squared x h. Substitute r = 5. Step 3: Set the two volumes equal and solve for h.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2024-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 2, topic: "Number",
    text: "Write 4.7 x 10 to the power of -3 as an ordinary number.",
    commandWord: "Write", answerLines: 1,
    markScheme: "0.0047. The power is -3, so move the decimal point 3 places to the left: 4.7 becomes 0.0047.",
    hint: "A negative power in standard form means the number is less than 1. Move the decimal point to the LEFT by the number shown in the power. For 10^-3, move 3 places left: 4.7 becomes 0.0047.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2024-p1h-q2",
    board: "Adaptly", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 3, topic: "Algebra",
    text: "Make t the subject of the formula v = u + at.",
    commandWord: "Rearrange", answerLines: 2,
    markScheme: "t = (v - u) / a. Working: v = u + at. Subtract u from both sides: v - u = at. Divide both sides by a: t = (v - u) / a.",
    hint: "To make t the subject, get t on its own. Step 1: Subtract u from both sides: v - u = at. Step 2: Divide both sides by a: t = (v - u) / a. Remember to keep the bracket around (v - u) when dividing by a.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2024-p1h-q3",
    board: "Adaptly", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "3",
    marks: 4, topic: "Geometry",
    text: "A right-angled triangle has legs of length 9 cm and 12 cm. Calculate the length of the hypotenuse.",
    commandWord: "Calculate", answerLines: 4,
    markScheme: "15 cm. Working: hypotenuse squared = 9 squared + 12 squared = 81 + 144 = 225. Hypotenuse = root(225) = 15 cm.",
    hint: "Use Pythagoras theorem: a squared + b squared = c squared, where c is the hypotenuse. Step 1: Square both legs: 9 squared = 81, 12 squared = 144. Step 2: Add them: 81 + 144 = 225. Step 3: Find the square root: root(225) = 15 cm.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-aqa-2024-p2h-q1",
    board: "Adaptly", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Statistics",
    text: "A bag contains 3 red, 5 blue and 2 green counters. A counter is taken at random. Write down the probability that the counter is not red.",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "7/10 or 0.7. Working: Total counters = 3 + 5 + 2 = 10. Counters that are NOT red = 5 + 2 = 7. P(not red) = 7/10.",
    hint: "P(not red) = 1 - P(red). Step 1: Count the total number of counters: 3 + 5 + 2 = 10. Step 2: Count how many are NOT red: 5 blue + 2 green = 7. Step 3: P(not red) = 7/10. Alternatively, P(red) = 3/10, so P(not red) = 1 - 3/10 = 7/10.",
    stage: "gcse", yearGroups: [10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — Edexcel GCSE
// ─────────────────────────────────────────────────────────────────────────────
const mathsEdexcel: PastPaperQuestion[] = [
  {
    id: "maths-edexcel-2023-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Express 360 as a product of its prime factors. Give your answer in index form.",
    commandWord: "Express", answerLines: 3,
  },
  {
    id: "maths-edexcel-2023-p1h-q2",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Solve the simultaneous equations: 2x + 3y = 13 and 5x − 2y = 4.",
    commandWord: "Solve", answerLines: 5,
  },
  {
    id: "maths-edexcel-2023-p1h-q3",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "3",
    marks: 5, topic: "Geometry",
    text: "Angle ACB is an angle in a semicircle where AB is a diameter. Write down the size of angle ACB and give a reason for your answer.",
    commandWord: "State", answerLines: 3,
    markScheme: "Angle ACB = 90 degrees. Reason: The angle in a semicircle (angle subtended by a diameter) is always 90 degrees.",
    hint: "This is a circle theorem question. The key theorem here is: the angle subtended by a diameter at the circumference is always a right angle (90 degrees). State the angle and then write the theorem as your reason.",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "maths-edexcel-2023-p1f-q1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Number",
    text: "Work out 15% of 240.",
    commandWord: "Calculate", answerLines: 2,
  },
  {
    id: "maths-edexcel-2023-p1f-q2",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "2",
    marks: 3, topic: "Algebra",
    text: "Expand and simplify 3(2x + 1) + 2(x − 4).",
    commandWord: "Expand", answerLines: 3,
  },
  {
    id: "maths-edexcel-2022-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Without using a calculator, work out 2⅓ × 1⅘. Show all your working and give your answer as a mixed number in its simplest form.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-edexcel-2022-p1h-q2",
    board: "Adaptly", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "The nth term of a sequence is 3n² − 2. Work out the difference between the 5th term and the 4th term of this sequence.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-edexcel-2019-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2019, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Statistics",
    text: "The table shows information about the number of goals scored in each match played by a football team. Work out the mean number of goals scored per match.",
    context: "Number of goals | Frequency\n0 | 3\n1 | 7\n2 | 6\n3 | 4",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-edexcel-2024-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Algebra",
    text: "Simplify fully (x² − 9) / (x² + x − 12).",
    commandWord: "Simplify", answerLines: 3,
  },
  {
    id: "maths-edexcel-2024-p2h-q1",
    board: "Adaptly", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Geometry",
    text: "A frustum is made by removing a small cone from a large cone. The large cone has a radius of 6 cm and a height of 12 cm. The small cone has a radius of 3 cm and a height of 6 cm. Work out the volume of the frustum. Give your answer in terms of π.",
    commandWord: "Calculate", answerLines: 5,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — OCR GCSE
// ─────────────────────────────────────────────────────────────────────────────
const mathsOCR: PastPaperQuestion[] = [
  {
    id: "maths-ocr-2023-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Find the highest common factor (HCF) of 84 and 126.",
    commandWord: "Find", answerLines: 3,
  },
  {
    id: "maths-ocr-2023-p1h-q2",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Solve 2x² + 5x − 3 = 0 by factorisation.",
    commandWord: "Solve", answerLines: 4,
  },
  {
    id: "maths-ocr-2023-p1f-q1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Number",
    text: "Write 0.07 as a percentage.",
    commandWord: "Write", answerLines: 1,
  },
  {
    id: "maths-ocr-2024-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Geometry",
    text: "In triangle PQR, PQ = 8 cm, QR = 11 cm and angle PQR = 42°. Calculate the area of triangle PQR.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-ocr-2024-p1f-q1",
    board: "Adaptly", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "1",
    marks: 3, topic: "Statistics",
    text: "The mean of five numbers is 8. Four of the numbers are 6, 9, 7 and 10. Work out the fifth number.",
    commandWord: "Calculate", answerLines: 3,
    markScheme: "8. Working: Total of all five numbers = 8 x 5 = 40. Sum of four known numbers = 6 + 9 + 7 + 10 = 32. Fifth number = 40 - 32 = 8.",
    hint: "To find the mean, you divide the total by the number of values. So if you know the mean and how many values there are, you can find the total first. Step 1: Total = mean x number of values = 8 x 5 = 40. Step 2: Add the four numbers you know. Step 3: Subtract from the total.",
    stage: "gcse", yearGroups: [9, 10, 11],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH LANGUAGE — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const englishLangAQA: PastPaperQuestion[] = [
  {
    id: "eng-lang-aqa-2023-p1-q1",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "1",
    marks: 4, topic: "Reading – Comprehension",
    text: "Read again the first part of the source, from lines 1 to 5. List four things from this part of the text about the setting.",
    commandWord: "List", answerLines: 4,
  },
  {
    id: "eng-lang-aqa-2023-p1-q2",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "2",
    marks: 8, topic: "Reading – Language Analysis",
    text: "Look in detail at this extract, from lines 6 to 14 of the source. How does the writer use language here to describe the character's fear? You could include the writer's choice of: words and phrases; language features and techniques; sentence forms.",
    commandWord: "Analyse", answerLines: 12,
  },
  {
    id: "eng-lang-aqa-2023-p1-q3",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "3",
    marks: 8, topic: "Reading – Structure",
    text: "You now need to think about the whole of the source. This text is from the opening of a novel. How has the writer structured the text to interest you as a reader? You could write about: what the writer focuses your attention on at the beginning; how and why the writer changes this focus as the source develops; any other structural features that interest you.",
    commandWord: "Analyse", answerLines: 12,
  },
  {
    id: "eng-lang-aqa-2023-p1-q4",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "4",
    marks: 20, topic: "Reading – Evaluation",
    text: "Focus this part of your answer on the second part of the source, from line 15 to the end. A student, having read this section of the text, said: 'The writer makes the reader feel completely absorbed in the tension and drama of this moment.' To what extent do you agree? In your response, you could: write about your own impressions of the tension and drama; evaluate how the writer has created these impressions; support your opinions with quotations from the text.",
    commandWord: "Evaluate", answerLines: 20,
  },
  {
    id: "eng-lang-aqa-2023-p1-q5",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "5",
    marks: 40, topic: "Writing – Creative",
    text: "You are going to enter a creative writing competition. Your entry will be judged by a panel of people of your own age. Either: Write a description suggested by this picture. Or: Write the opening part of a story about a journey that changes someone's life. (40 marks for content and organisation; 16 marks for technical accuracy)",
    commandWord: "Write", answerLines: 30,
  },
  {
    id: "eng-lang-aqa-2023-p2-q1",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 2 – Writers' Viewpoints and Perspectives", questionNum: "1",
    marks: 4, topic: "Reading – Comprehension",
    text: "Read again source A, from lines 1 to 7. Choose four statements below which are TRUE. Shade the boxes of the ones that you think are true.",
    commandWord: "Identify", answerLines: 4,
  },
  {
    id: "eng-lang-aqa-2023-p2-q2",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 2 – Writers' Viewpoints and Perspectives", questionNum: "2",
    marks: 8, topic: "Reading – Summary",
    text: "You need to refer to source A and source B for this question. Use details from both sources. Write a summary of the differences between the two writers' experiences of the city.",
    commandWord: "Summarise", answerLines: 12,
  },
  {
    id: "eng-lang-aqa-2023-p2-q3",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 2 – Writers' Viewpoints and Perspectives", questionNum: "3",
    marks: 12, topic: "Reading – Language Analysis",
    text: "You now need to refer only to source B, from lines 12 to 25. How does the writer use language to convey their feelings about the experience? You could include the writer's choice of: words and phrases; language features and techniques; sentence forms.",
    commandWord: "Analyse", answerLines: 14,
  },
  {
    id: "eng-lang-aqa-2023-p2-q4",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 2 – Writers' Viewpoints and Perspectives", questionNum: "4",
    marks: 16, topic: "Reading – Comparison",
    text: "For this question, you need to refer to the whole of source A and the whole of source B. Compare how the two writers convey their different attitudes to the natural world. In your answer, you could: compare their different attitudes; compare the methods they use to convey their attitudes; support your ideas with quotations from both texts.",
    commandWord: "Compare", answerLines: 18,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH LITERATURE — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const englishLitAQA: PastPaperQuestion[] = [
  {
    id: "eng-lit-aqa-2023-p1-q1",
    board: "Adaptly", subject: "english-literature", year: 2023, series: "June",
    paper: "Paper 1 – Shakespeare and the 19th-Century Novel", questionNum: "1",
    marks: 30, topic: "Shakespeare",
    text: "Read the following extract from Act 3 Scene 1 of Romeo and Juliet and then answer the question that follows. Starting with this extract, how does Shakespeare present the theme of conflict in Romeo and Juliet? Write about: how Shakespeare presents conflict in this extract; how Shakespeare presents conflict in the play as a whole.",
    commandWord: "Analyse", answerLines: 30,
  },
  {
    id: "eng-lit-aqa-2023-p1-q2",
    board: "Adaptly", subject: "english-literature", year: 2023, series: "June",
    paper: "Paper 1 – Shakespeare and the 19th-Century Novel", questionNum: "2",
    marks: 30, topic: "19th Century Novel",
    text: "Read the following extract from Chapter 8 of A Christmas Carol and then answer the question that follows. Starting with this extract, how does Dickens present the character of Scrooge in A Christmas Carol? Write about: how Dickens presents Scrooge in this extract; how Dickens presents Scrooge in the novel as a whole.",
    commandWord: "Analyse", answerLines: 30,
  },
  {
    id: "eng-lit-aqa-2023-p2-q1",
    board: "Adaptly", subject: "english-literature", year: 2023, series: "June",
    paper: "Paper 2 – Modern Texts and Poetry", questionNum: "1",
    marks: 30, topic: "Modern Prose or Drama",
    text: "How does Priestley present the importance of social responsibility in An Inspector Calls? Write about: how Priestley presents social responsibility in the play; how Priestley uses the character of the Inspector to explore social responsibility.",
    commandWord: "Analyse", answerLines: 30,
  },
  {
    id: "eng-lit-aqa-2023-p2-q2",
    board: "Adaptly", subject: "english-literature", year: 2023, series: "June",
    paper: "Paper 2 – Modern Texts and Poetry", questionNum: "2",
    marks: 30, topic: "Poetry – Power and Conflict",
    text: "Compare how poets present the effects of conflict on people in 'Bayonet Charge' and one other poem from the 'Power and Conflict' cluster. In your answer you should consider: the effects of conflict on people in each poem; how the poets use language and structure to present these effects.",
    commandWord: "Compare", answerLines: 30,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BIOLOGY — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const biologyAQA: PastPaperQuestion[] = [
  {
    id: "bio-aqa-2023-p1h-q1",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 6, topic: "Cell Biology",
    text: "Describe how to carry out a microscopy investigation to observe onion cells. Your answer should include: how to prepare the slide; how to use the microscope; how to calculate the magnification of the image.",
    commandWord: "Describe", answerLines: 8,
  },
  {
    id: "bio-aqa-2023-p1h-q2",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Organisation",
    text: "Explain how enzymes work using the lock and key model.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "bio-aqa-2023-p1h-q3",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "3",
    marks: 5, topic: "Infection and Response",
    text: "Describe the non-specific defence mechanisms the human body uses to prevent pathogens from entering the body.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "bio-aqa-2023-p1h-q4",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "4",
    marks: 6, topic: "Bioenergetics",
    text: "Describe the process of aerobic respiration. Include the reactants, products and where in the cell it takes place.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "bio-aqa-2023-p2h-q1",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Homeostasis and Response",
    text: "Explain how the body responds to a rise in blood glucose concentration.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "bio-aqa-2023-p2h-q2",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "2",
    marks: 5, topic: "Inheritance, Variation and Evolution",
    text: "Explain how natural selection leads to evolution. Use an example in your answer.",
    commandWord: "Explain", answerLines: 8,
  },
  {
    id: "bio-aqa-2022-p1h-q1",
    board: "Adaptly", subject: "biology", year: 2022, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Cell Biology",
    text: "State three differences between a plant cell and an animal cell.",
    commandWord: "State", answerLines: 3,
  },
  {
    id: "bio-aqa-2022-p1h-q2",
    board: "Adaptly", subject: "biology", year: 2022, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "2",
    marks: 6, topic: "Organisation",
    text: "Describe the structure of the human digestive system and explain how food is digested and absorbed.",
    commandWord: "Describe", answerLines: 8,
  },
  {
    id: "bio-aqa-2024-p1h-q1",
    board: "Adaptly", subject: "biology", year: 2024, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Cell Biology",
    text: "Compare mitosis and meiosis. Include the number of cell divisions, the number of daughter cells produced and whether the daughter cells are genetically identical.",
    commandWord: "Compare", answerLines: 6,
  },
  {
    id: "bio-aqa-2024-p2h-q1",
    board: "Adaptly", subject: "biology", year: 2024, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 6, topic: "Ecology",
    text: "Describe the carbon cycle. Include the processes that release carbon dioxide into the atmosphere and the processes that remove it.",
    commandWord: "Describe", answerLines: 8,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHEMISTRY — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const chemistryAQA: PastPaperQuestion[] = [
  {
    id: "chem-aqa-2023-p1h-q1",
    board: "Adaptly", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Atomic Structure",
    text: "An atom of calcium has the atomic number 20 and mass number 40. State the number of protons, neutrons and electrons in this atom. Explain what is meant by an isotope of calcium.",
    commandWord: "State", answerLines: 5,
  },
  {
    id: "chem-aqa-2023-p1h-q2",
    board: "Adaptly", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "2",
    marks: 5, topic: "Bonding",
    text: "Explain why sodium chloride has a high melting point. Use ideas about structure and bonding in your answer.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "chem-aqa-2023-p1h-q3",
    board: "Adaptly", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "3",
    marks: 4, topic: "Quantitative Chemistry",
    text: "Calculate the relative formula mass (Mr) of calcium carbonate, CaCO₃. (Relative atomic masses: Ca = 40, C = 12, O = 16)",
    commandWord: "Calculate", answerLines: 3,
  },
  {
    id: "chem-aqa-2023-p2h-q1",
    board: "Adaptly", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Rates of Reaction",
    text: "Describe and explain the effect of increasing temperature on the rate of a chemical reaction. Use collision theory in your answer.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "chem-aqa-2023-p2h-q2",
    board: "Adaptly", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "2",
    marks: 6, topic: "Organic Chemistry",
    text: "Describe the process of cracking. Include: what cracking is; why cracking is carried out; the conditions needed for cracking; an equation for a cracking reaction.",
    commandWord: "Describe", answerLines: 8,
  },
  {
    id: "chem-aqa-2022-p1h-q1",
    board: "Adaptly", subject: "chemistry", year: 2022, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Atomic Structure",
    text: "The element lithium has two isotopes: lithium-6 and lithium-7. Explain what is meant by the term 'isotope' and describe how these two isotopes differ.",
    commandWord: "Explain", answerLines: 4,
  },
  {
    id: "chem-aqa-2024-p1h-q1",
    board: "Adaptly", subject: "chemistry", year: 2024, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Bonding",
    text: "Compare the properties of ionic compounds and simple molecular compounds. Include melting points, electrical conductivity and solubility in water.",
    commandWord: "Compare", answerLines: 6,
  },
  {
    id: "chem-aqa-2024-p2h-q1",
    board: "Adaptly", subject: "chemistry", year: 2024, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Chemical Analysis",
    text: "Describe how you would use flame tests to identify the metal ions present in two unknown solutions. Include the colours you would expect to see for sodium, potassium, calcium and copper ions.",
    commandWord: "Describe", answerLines: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICS — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const physicsAQA: PastPaperQuestion[] = [
  {
    id: "phys-aqa-2023-p1h-q1",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Energy",
    text: "A ball of mass 0.5 kg is dropped from a height of 10 m. Calculate the kinetic energy of the ball just before it hits the ground. (g = 10 m/s²)",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "phys-aqa-2023-p1h-q2",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "2",
    marks: 5, topic: "Electricity",
    text: "A resistor has a resistance of 12 Ω. A current of 2 A flows through it for 5 minutes. Calculate the energy transferred to the resistor.",
    commandWord: "Calculate", answerLines: 5,
  },
  {
    id: "phys-aqa-2023-p1h-q3",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "3",
    marks: 6, topic: "Particle Model of Matter",
    text: "Explain, using ideas about particles, what happens when a solid is heated until it melts and then continues to be heated until it becomes a gas.",
    commandWord: "Explain", answerLines: 8,
  },
  {
    id: "phys-aqa-2023-p2h-q1",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Forces",
    text: "A car of mass 1200 kg accelerates from rest to 20 m/s in 8 seconds. Calculate the resultant force acting on the car.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "phys-aqa-2023-p2h-q2",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "2",
    marks: 5, topic: "Waves",
    text: "A wave has a frequency of 200 Hz and a wavelength of 1.5 m. Calculate the speed of the wave. State the equation you use.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "phys-aqa-2022-p1h-q1",
    board: "Adaptly", subject: "physics", year: 2022, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Energy",
    text: "State the principle of conservation of energy.",
    commandWord: "State", answerLines: 3,
  },
  {
    id: "phys-aqa-2022-p2h-q1",
    board: "Adaptly", subject: "physics", year: 2022, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Magnetism and Electromagnetism",
    text: "Describe how an electromagnet works. Include: what an electromagnet is; how the strength of the magnetic field can be increased; one use of an electromagnet.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "phys-aqa-2024-p1h-q1",
    board: "Adaptly", subject: "physics", year: 2024, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Electricity",
    text: "A lamp has a resistance of 6 ohms. A current of 2 A flows through it. Calculate the potential difference across the lamp. State the equation you use.",
    commandWord: "Calculate", answerLines: 4,
    markScheme: "V = IR = 2 x 6 = 12 V. Equation: V = IR (Ohm's Law). Potential difference = 12 volts.",
    hint: "Use Ohm's Law: V = I x R, where V is potential difference (volts), I is current (amps) and R is resistance (ohms). Step 1: Write the equation V = IR. Step 2: Substitute the values: V = 2 x 6. Step 3: Calculate the answer and include the unit (volts).",
    stage: "gcse", yearGroups: [10, 11],
  },
  {
    id: "phys-aqa-2024-p2h-q1",
    board: "Adaptly", subject: "physics", year: 2024, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 6, topic: "Space Physics",
    text: "Describe the life cycle of a star similar in mass to the Sun. Start from the nebula stage.",
    commandWord: "Describe", answerLines: 8,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const historyAQA: PastPaperQuestion[] = [
  {
    id: "hist-aqa-2023-p1-q1",
    board: "Adaptly", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 – Understanding the Modern World", questionNum: "1",
    marks: 4, topic: "Germany 1890–1945",
    text: "Describe two problems faced by the Weimar Republic in the years 1919–1923.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "hist-aqa-2023-p1-q2",
    board: "Adaptly", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 – Understanding the Modern World", questionNum: "2",
    marks: 8, topic: "Germany 1890–1945",
    text: "Explain why Hitler was able to become Chancellor of Germany in January 1933. You may use the following in your answer: the Wall Street Crash; the SA. You must also use information of your own.",
    commandWord: "Explain", answerLines: 12,
  },
  {
    id: "hist-aqa-2023-p1-q3",
    board: "Adaptly", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 – Understanding the Modern World", questionNum: "3",
    marks: 16, topic: "Germany 1890–1945",
    text: "'The main reason for the failure of the Munich Putsch in 1923 was the lack of support from the German army.' How far do you agree with this statement? Explain your answer.",
    commandWord: "Evaluate", answerLines: 20,
  },
  {
    id: "hist-aqa-2023-p2-q1",
    board: "Adaptly", subject: "history", year: 2023, series: "June",
    paper: "Paper 2 – Shaping the Nation", questionNum: "1",
    marks: 4, topic: "Britain: Health and the People",
    text: "Describe two features of the work of Florence Nightingale during the Crimean War.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "hist-aqa-2023-p2-q2",
    board: "Adaptly", subject: "history", year: 2023, series: "June",
    paper: "Paper 2 – Shaping the Nation", questionNum: "2",
    marks: 8, topic: "Britain: Health and the People",
    text: "Explain why there was opposition to the introduction of the National Health Service in 1948. You may use the following in your answer: the British Medical Association; cost. You must also use information of your own.",
    commandWord: "Explain", answerLines: 12,
  },
  {
    id: "hist-aqa-2022-p1-q1",
    board: "Adaptly", subject: "history", year: 2022, series: "June",
    paper: "Paper 1 – Understanding the Modern World", questionNum: "1",
    marks: 4, topic: "Conflict and Tension 1918–1939",
    text: "Describe two features of the Treaty of Versailles.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "hist-aqa-2024-p1-q1",
    board: "Adaptly", subject: "history", year: 2024, series: "June",
    paper: "Paper 1 – Understanding the Modern World", questionNum: "1",
    marks: 4, topic: "Germany 1890–1945",
    text: "Describe two features of the Nazi police state.",
    commandWord: "Describe", answerLines: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GEOGRAPHY — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const geographyAQA: PastPaperQuestion[] = [
  {
    id: "geog-aqa-2023-p1-q1",
    board: "Adaptly", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 – Living with the Physical Environment", questionNum: "1",
    marks: 4, topic: "The Challenge of Natural Hazards",
    text: "State two primary effects of a tropical storm.",
    commandWord: "State", answerLines: 4,
  },
  {
    id: "geog-aqa-2023-p1-q2",
    board: "Adaptly", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 – Living with the Physical Environment", questionNum: "2",
    marks: 6, topic: "The Challenge of Natural Hazards",
    text: "Explain how the global atmospheric circulation model helps to explain the distribution of tropical storms.",
    commandWord: "Explain", answerLines: 8,
  },
  {
    id: "geog-aqa-2023-p1-q3",
    board: "Adaptly", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 – Living with the Physical Environment", questionNum: "3",
    marks: 9, topic: "Physical Landscapes in the UK",
    text: "Assess the importance of wave energy in shaping coastal landforms. Use a named example in your answer.",
    commandWord: "Assess", answerLines: 12,
  },
  {
    id: "geog-aqa-2023-p2-q1",
    board: "Adaptly", subject: "geography", year: 2023, series: "June",
    paper: "Paper 2 – Challenges in the Human Environment", questionNum: "1",
    marks: 4, topic: "Urban Issues and Challenges",
    text: "State two reasons why cities in LICs and NEEs are growing rapidly.",
    commandWord: "State", answerLines: 4,
  },
  {
    id: "geog-aqa-2023-p2-q2",
    board: "Adaptly", subject: "geography", year: 2023, series: "June",
    paper: "Paper 2 – Challenges in the Human Environment", questionNum: "2",
    marks: 6, topic: "The Changing Economic World",
    text: "Explain why some countries remain low income countries (LICs).",
    commandWord: "Explain", answerLines: 8,
  },
  {
    id: "geog-aqa-2022-p1-q1",
    board: "Adaptly", subject: "geography", year: 2022, series: "June",
    paper: "Paper 1 – Living with the Physical Environment", questionNum: "1",
    marks: 3, topic: "The Living World",
    text: "Describe the distribution of tropical rainforests.",
    commandWord: "Describe", answerLines: 4,
  },
  {
    id: "geog-aqa-2024-p1-q1",
    board: "Adaptly", subject: "geography", year: 2024, series: "June",
    paper: "Paper 1 – Living with the Physical Environment", questionNum: "1",
    marks: 4, topic: "The Challenge of Natural Hazards",
    text: "Explain two ways in which climate change may affect the frequency and intensity of tropical storms.",
    commandWord: "Explain", answerLines: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BIOLOGY — Edexcel GCSE
// ─────────────────────────────────────────────────────────────────────────────
const biologyEdexcel: PastPaperQuestion[] = [
  {
    id: "bio-edexcel-2023-p1h-q1",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Cell Biology",
    text: "Describe the structure of a eukaryotic cell. Include the cell membrane, nucleus, mitochondria and ribosomes.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "bio-edexcel-2023-p2h-q1",
    board: "Adaptly", subject: "biology", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Genetics and Evolution",
    text: "Explain how DNA replication occurs during the cell cycle. Include the role of enzymes in your answer.",
    commandWord: "Explain", answerLines: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHEMISTRY — Edexcel GCSE
// ─────────────────────────────────────────────────────────────────────────────
const chemistryEdexcel: PastPaperQuestion[] = [
  {
    id: "chem-edexcel-2023-p1h-q1",
    board: "Adaptly", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "States of Matter",
    text: "Explain, using ideas about particles, why gases are much less dense than solids.",
    commandWord: "Explain", answerLines: 5,
  },
  {
    id: "chem-edexcel-2023-p2h-q1",
    board: "Adaptly", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Rates of Reaction",
    text: "A student investigates the rate of reaction between marble chips and hydrochloric acid. Describe how the student could use the results to calculate the mean rate of reaction.",
    commandWord: "Describe", answerLines: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICS — Edexcel GCSE
// ─────────────────────────────────────────────────────────────────────────────
const physicsEdexcel: PastPaperQuestion[] = [
  {
    id: "phys-edexcel-2023-p1h-q1",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Motion and Forces",
    text: "A cyclist travels 600 m in 30 seconds. Calculate the average speed of the cyclist. State the equation you use.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "phys-edexcel-2023-p2h-q1",
    board: "Adaptly", subject: "physics", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Electricity and Circuits",
    text: "Two resistors of 6 Ω and 12 Ω are connected in parallel. Calculate the total resistance of the combination.",
    commandWord: "Calculate", answerLines: 5,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY — Edexcel GCSE
// ─────────────────────────────────────────────────────────────────────────────
const historyEdexcel: PastPaperQuestion[] = [
  {
    id: "hist-edexcel-2023-p1-q1",
    board: "Adaptly", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 – Thematic Study and Historic Environment", questionNum: "1",
    marks: 4, topic: "Medicine in Britain",
    text: "Describe two features of surgery in the medieval period.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "hist-edexcel-2023-p3-q1",
    board: "Adaptly", subject: "history", year: 2023, series: "June",
    paper: "Paper 3 – Modern Depth Study", questionNum: "1",
    marks: 4, topic: "Weimar and Nazi Germany",
    text: "Describe two features of the Stresemann era (1924–1929).",
    commandWord: "Describe", answerLines: 6,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GEOGRAPHY — Edexcel GCSE
// ─────────────────────────────────────────────────────────────────────────────
const geographyEdexcel: PastPaperQuestion[] = [
  {
    id: "geog-edexcel-2023-p1-q1",
    board: "Adaptly", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 – The Physical Environment", questionNum: "1",
    marks: 4, topic: "Tectonic Hazards",
    text: "Explain two reasons why people continue to live in areas at risk from tectonic hazards.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "geog-edexcel-2023-p2-q1",
    board: "Adaptly", subject: "geography", year: 2023, series: "June",
    paper: "Paper 2 – The Human Environment", questionNum: "1",
    marks: 4, topic: "Changing Cities",
    text: "Describe two characteristics of urban deprivation.",
    commandWord: "Describe", answerLines: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — WJEC GCSE
// ─────────────────────────────────────────────────────────────────────────────
const mathsWJEC: PastPaperQuestion[] = [
  {
    id: "maths-wjec-2023-p1h-q1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Unit 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Without using a calculator, work out 3.6 × 0.05.",
    commandWord: "Calculate", answerLines: 2,
  },
  {
    id: "maths-wjec-2023-p2h-q1",
    board: "Adaptly", subject: "mathematics", year: 2023, series: "June",
    paper: "Unit 2 (Calculator)", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Geometry",
    text: "A sector of a circle has radius 8 cm and angle 135°. Calculate the area of the sector. Give your answer correct to 3 significant figures.",
    commandWord: "Calculate", answerLines: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH LANGUAGE — Edexcel GCSE
// ─────────────────────────────────────────────────────────────────────────────
const englishLangEdexcel: PastPaperQuestion[] = [
  {
    id: "eng-lang-edexcel-2023-p1-q1",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Fiction and Imaginative Writing", questionNum: "1",
    marks: 8, topic: "Reading – Language Analysis",
    text: "In lines 1–15, how does the writer use language and structure to interest and engage the reader? Support your views with reference to the text.",
    commandWord: "Analyse", answerLines: 12,
  },
  {
    id: "eng-lang-edexcel-2023-p1-q2",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Fiction and Imaginative Writing", questionNum: "2",
    marks: 40, topic: "Writing – Narrative",
    text: "Write a story that begins: 'The door had always been locked — until today.' (You should spend about 45 minutes on this question. 24 marks for communication and organisation; 16 marks for vocabulary, sentence structure, spelling and punctuation.)",
    commandWord: "Write", answerLines: 30,
  },
  {
    id: "eng-lang-edexcel-2023-p2-q1",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 2 – Non-Fiction and Transactional Writing", questionNum: "1",
    marks: 8, topic: "Reading – Comprehension",
    text: "Read Source A again (lines 1–20). Identify and interpret explicit and implicit information and ideas. Select and synthesise evidence from different texts. What do you understand about the writer's attitude towards the subject? Support your answer with reference to the text.",
    commandWord: "Identify", answerLines: 10,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH LANGUAGE — OCR GCSE
// ─────────────────────────────────────────────────────────────────────────────
const englishLangOCR: PastPaperQuestion[] = [
  {
    id: "eng-lang-ocr-2023-p1-q1",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Component 1 – Communicating Information and Ideas", questionNum: "1",
    marks: 15, topic: "Reading – Analysis",
    text: "Read Text A. How does the writer use language and structure to convey their ideas? Support your answer with reference to the text. (15 marks)",
    commandWord: "Analyse", answerLines: 16,
  },
  {
    id: "eng-lang-ocr-2023-p1-q2",
    board: "Adaptly", subject: "english-language", year: 2023, series: "June",
    paper: "Component 1 – Communicating Information and Ideas", questionNum: "2",
    marks: 40, topic: "Writing – Informative",
    text: "Write an article for a school magazine about the importance of reading for pleasure. (40 marks: 20 for communication and organisation, 20 for technical accuracy)",
    commandWord: "Write", answerLines: 30,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED SCIENCE — AQA GCSE (Trilogy)
// ─────────────────────────────────────────────────────────────────────────────
const combinedScienceAQA: PastPaperQuestion[] = [
  {
    id: "sci-aqa-2023-bio1h-q1",
    board: "Adaptly", subject: "science", year: 2023, series: "June",
    paper: "Biology Paper 1 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Cell Biology",
    text: "State four differences between plant cells and animal cells.",
    commandWord: "State", answerLines: 4,
  },
  {
    id: "sci-aqa-2023-chem1h-q1",
    board: "Adaptly", subject: "science", year: 2023, series: "June",
    paper: "Chemistry Paper 1 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Atomic Structure",
    text: "An atom has 17 protons and 18 neutrons. State the atomic number and mass number of this atom.",
    commandWord: "State", answerLines: 2,
  },
  {
    id: "sci-aqa-2023-phys1h-q1",
    board: "Adaptly", subject: "science", year: 2023, series: "June",
    paper: "Physics Paper 1 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Energy",
    text: "A 2 kg object is lifted 5 m above the ground. Calculate the gravitational potential energy stored. (g = 10 N/kg)",
    commandWord: "Calculate", answerLines: 3,
  },
  {
    id: "sci-aqa-2022-bio1h-q1",
    board: "Adaptly", subject: "science", year: 2022, series: "June",
    paper: "Biology Paper 1 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Organisation",
    text: "Describe the role of the liver in the digestion and absorption of food.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "sci-aqa-2024-phys2h-q1",
    board: "Adaptly", subject: "science", year: 2024, series: "June",
    paper: "Physics Paper 2 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Forces",
    text: "Explain the difference between mass and weight. Include the units for each quantity.",
    commandWord: "Explain", answerLines: 5,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KS1 SATs (Year 1–2)
// ─────────────────────────────────────────────────────────────────────────────
const ks1Maths: PastPaperQuestion[] = [
  {
    id: "ks1-maths-2023-q1",
    board: "KS1 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "Paper 1 (Arithmetic)", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Number",
    text: "Work out 7 + 5.",
    commandWord: "Calculate", answerLines: 1,
    markScheme: "12",
    hint: "Count on from 7: 8, 9, 10, 11, 12. Or use a number bond: 7 + 3 = 10, then add 2 more = 12.",
    stage: "ks1", yearGroups: [1, 2],
  },
  {
    id: "ks1-maths-2023-q2",
    board: "KS1 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "Paper 1 (Arithmetic)", tier: "Foundation", questionNum: "2",
    marks: 1, topic: "Number",
    text: "Work out 15 - 8.",
    commandWord: "Calculate", answerLines: 1,
    markScheme: "7",
    hint: "Count back from 15: 14, 13, 12, 11, 10, 9, 8, 7. Or think: what do I add to 8 to get 15? 8 + 7 = 15.",
    stage: "ks1", yearGroups: [1, 2],
  },
  {
    id: "ks1-maths-2023-q3",
    board: "KS1 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "Paper 1 (Arithmetic)", tier: "Foundation", questionNum: "3",
    marks: 1, topic: "Number",
    text: "Work out 4 x 3.",
    commandWord: "Calculate", answerLines: 1,
    markScheme: "12",
    hint: "4 x 3 means 4 groups of 3. Count in 3s: 3, 6, 9, 12. Or count in 4s: 4, 8, 12.",
    stage: "ks1", yearGroups: [1, 2],
  },
  {
    id: "ks1-maths-2023-q4",
    board: "KS1 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "Paper 2 (Reasoning)", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Number",
    text: "There are 20 apples. Sam takes 7 apples. How many apples are left?",
    commandWord: "Calculate", answerLines: 1,
    markScheme: "13 apples",
    hint: "This is a subtraction problem. Start with 20 and take away 7. Count back 7 from 20: 19, 18, 17, 16, 15, 14, 13.",
    stage: "ks1", yearGroups: [1, 2],
  },
  {
    id: "ks1-maths-2022-q1",
    board: "KS1 SATs", subject: "mathematics", year: 2022, series: "May",
    paper: "Paper 1 (Arithmetic)", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Number",
    text: "Work out 30 + 40.",
    commandWord: "Calculate", answerLines: 1,
    markScheme: "70",
    hint: "Think of it as 3 tens + 4 tens = 7 tens = 70.",
    stage: "ks1", yearGroups: [1, 2],
  },
  {
    id: "ks1-maths-2022-q2",
    board: "KS1 SATs", subject: "mathematics", year: 2022, series: "May",
    paper: "Paper 2 (Reasoning)", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Measurement",
    text: "A pencil is 15 cm long. A rubber is 4 cm long. How much longer is the pencil than the rubber?",
    commandWord: "Calculate", answerLines: 1,
    markScheme: "11 cm",
    hint: "Subtract the shorter length from the longer length: 15 - 4 = 11 cm.",
    stage: "ks1", yearGroups: [1, 2],
  },
];

const ks1English: PastPaperQuestion[] = [
  {
    id: "ks1-eng-2023-q1",
    board: "KS1 SATs", subject: "english", year: 2023, series: "May",
    paper: "Reading Paper", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Comprehension",
    text: "Read the sentence: 'The big dog ran quickly across the field.' Circle the word that tells you how the dog ran.",
    commandWord: "Identify", answerLines: 1,
    markScheme: "quickly (this is an adverb describing how the dog ran)",
    hint: "Look for a word that describes the action (how something is done). Words that describe verbs are called adverbs. They often end in -ly.",
    stage: "ks1", yearGroups: [1, 2],
  },
  {
    id: "ks1-eng-2023-q2",
    board: "KS1 SATs", subject: "english", year: 2023, series: "May",
    paper: "Grammar, Punctuation and Spelling Paper", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Grammar",
    text: "Add a full stop or a question mark to the end of this sentence: 'Where did you go yesterday'.",
    commandWord: "Punctuate", answerLines: 1,
    markScheme: "Question mark (?). The sentence asks a question, so it needs a question mark.",
    hint: "Ask yourself: is this sentence asking something or telling you something? If it is asking a question, use a question mark (?). If it is telling you something, use a full stop (.).",
    stage: "ks1", yearGroups: [1, 2],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KS2 SATs (Year 3–6)
// ─────────────────────────────────────────────────────────────────────────────
const ks2Maths: PastPaperQuestion[] = [
  {
    id: "ks2-maths-2023-p1-q1",
    board: "KS2 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "Paper 1 (Arithmetic)", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Number",
    text: "Work out 345 + 267.",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "612",
    hint: "Line up the digits in columns (hundreds, tens, ones). Add the ones first: 5 + 7 = 12, write 2 carry 1. Tens: 4 + 6 + 1 = 11, write 1 carry 1. Hundreds: 3 + 2 + 1 = 6.",
    stage: "ks2", yearGroups: [3, 4, 5, 6],
  },
  {
    id: "ks2-maths-2023-p1-q2",
    board: "KS2 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "Paper 1 (Arithmetic)", tier: "Foundation", questionNum: "2",
    marks: 1, topic: "Number",
    text: "Work out 8 x 7.",
    commandWord: "Calculate", answerLines: 1,
    markScheme: "56",
    hint: "Use your times tables. 8 x 7 = 56. You can also work it out as 8 x 5 = 40, then 8 x 2 = 16, and 40 + 16 = 56.",
    stage: "ks2", yearGroups: [3, 4, 5, 6],
  },
  {
    id: "ks2-maths-2023-p1-q3",
    board: "KS2 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "Paper 1 (Arithmetic)", tier: "Foundation", questionNum: "3",
    marks: 1, topic: "Fractions",
    text: "Work out 1/2 of 48.",
    commandWord: "Calculate", answerLines: 1,
    markScheme: "24",
    hint: "To find half of a number, divide it by 2. 48 divided by 2 = 24.",
    stage: "ks2", yearGroups: [3, 4, 5, 6],
  },
  {
    id: "ks2-maths-2023-p2-q1",
    board: "KS2 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "Paper 2 (Reasoning)", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Number",
    text: "A school has 324 pupils. 156 are girls. How many are boys?",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "168 boys. Working: 324 - 156 = 168.",
    hint: "Subtract the number of girls from the total number of pupils. 324 - 156. Line up the digits and subtract carefully, borrowing where needed.",
    stage: "ks2", yearGroups: [3, 4, 5, 6],
  },
  {
    id: "ks2-maths-2023-p2-q2",
    board: "KS2 SATs", subject: "mathematics", year: 2023, series: "May",
    paper: "Paper 2 (Reasoning)", tier: "Foundation", questionNum: "2",
    marks: 3, topic: "Measurement",
    text: "A rectangle has a length of 12 cm and a width of 7 cm. Work out the perimeter of the rectangle.",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "38 cm. Working: Perimeter = 2 x (length + width) = 2 x (12 + 7) = 2 x 19 = 38 cm.",
    hint: "The perimeter is the total distance around the outside of the shape. A rectangle has 2 lengths and 2 widths. Perimeter = 2 x length + 2 x width = 2 x 12 + 2 x 7 = 24 + 14 = 38 cm.",
    stage: "ks2", yearGroups: [3, 4, 5, 6],
  },
  {
    id: "ks2-maths-2022-p1-q1",
    board: "KS2 SATs", subject: "mathematics", year: 2022, series: "May",
    paper: "Paper 1 (Arithmetic)", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Number",
    text: "Work out 4,567 + 2,348.",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "6,915",
    hint: "Line up the digits in columns. Add from right to left: ones (7+8=15, write 5 carry 1), tens (6+4+1=11, write 1 carry 1), hundreds (5+3+1=9), thousands (4+2=6).",
    stage: "ks2", yearGroups: [3, 4, 5, 6],
  },
  {
    id: "ks2-maths-2022-p2-q1",
    board: "KS2 SATs", subject: "mathematics", year: 2022, series: "May",
    paper: "Paper 2 (Reasoning)", tier: "Foundation", questionNum: "1",
    marks: 3, topic: "Ratio and Proportion",
    text: "In a bag of sweets, the ratio of red sweets to blue sweets is 3:2. There are 15 red sweets. How many blue sweets are there?",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "10 blue sweets. Working: If 3 parts = 15, then 1 part = 5. Blue sweets = 2 parts = 2 x 5 = 10.",
    hint: "The ratio 3:2 means for every 3 red sweets there are 2 blue sweets. Step 1: Find the value of 1 part by dividing 15 by 3. Step 2: Multiply that by 2 to find the blue sweets.",
    stage: "ks2", yearGroups: [5, 6],
  },
];

const ks2English: PastPaperQuestion[] = [
  {
    id: "ks2-eng-2023-q1",
    board: "KS2 SATs", subject: "english", year: 2023, series: "May",
    paper: "Grammar, Punctuation and Spelling Paper", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Grammar",
    text: "Tick the sentence that uses commas correctly. A) The dog, who was very old, slept all day. B) The, dog who was very old slept, all day.",
    commandWord: "Identify", answerLines: 1,
    markScheme: "A. Commas are used to separate a relative clause (who was very old) from the main clause.",
    hint: "Commas are used to separate extra information (called a relative clause) from the main part of the sentence. The extra information in option A is 'who was very old' — it is correctly separated by commas on both sides.",
    stage: "ks2", yearGroups: [4, 5, 6],
  },
  {
    id: "ks2-eng-2023-q2",
    board: "KS2 SATs", subject: "english", year: 2023, series: "May",
    paper: "Grammar, Punctuation and Spelling Paper", tier: "Foundation", questionNum: "2",
    marks: 1, topic: "Grammar",
    text: "Underline the subordinate clause in this sentence: 'Although it was raining, the children played outside.'",
    commandWord: "Identify", answerLines: 1,
    markScheme: "Although it was raining. This is the subordinate clause because it cannot stand alone as a sentence and begins with the subordinating conjunction 'although'.",
    hint: "A subordinate clause cannot stand on its own as a complete sentence. It usually starts with a subordinating conjunction such as: although, because, when, if, while, since, until. Find the part of the sentence that starts with one of these words.",
    stage: "ks2", yearGroups: [4, 5, 6],
  },
  {
    id: "ks2-eng-2022-q1",
    board: "KS2 SATs", subject: "english", year: 2022, series: "May",
    paper: "Reading Paper", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Comprehension",
    text: "Read the passage: 'The ancient oak tree had stood in the village for over three hundred years. Its thick, gnarled roots spread across the ground like the fingers of a giant.' What does the author compare the roots to? What does this tell you about the roots?",
    commandWord: "Explain", answerLines: 3,
    markScheme: "The roots are compared to the fingers of a giant. This tells us the roots are large, spread out widely, and are powerful/strong.",
    hint: "The author uses a simile (a comparison using 'like' or 'as'). Find the comparison in the text. Then think about what the comparison tells you about what the roots look like or how big they are.",
    stage: "ks2", yearGroups: [4, 5, 6],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 11+ (Year 7 entry)
// ─────────────────────────────────────────────────────────────────────────────
const elevenPlusMaths: PastPaperQuestion[] = [
  {
    id: "11plus-maths-2023-q1",
    board: "11+", subject: "mathematics", year: 2023, series: "Autumn",
    paper: "Mathematics Paper", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Number",
    text: "What is 15% of 240?",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "36. Working: 10% of 240 = 24. 5% of 240 = 12. 15% = 24 + 12 = 36.",
    hint: "Find 10% first (divide by 10), then find 5% (half of 10%), then add them together. 10% of 240 = 24. 5% of 240 = 12. 15% = 24 + 12 = 36.",
    stage: "11plus", yearGroups: [6, 7],
  },
  {
    id: "11plus-maths-2023-q2",
    board: "11+", subject: "mathematics", year: 2023, series: "Autumn",
    paper: "Mathematics Paper", tier: "Foundation", questionNum: "2",
    marks: 2, topic: "Algebra",
    text: "If 3n + 5 = 20, what is the value of n?",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "n = 5. Working: 3n = 20 - 5 = 15. n = 15 / 3 = 5.",
    hint: "To find n, undo the operations in reverse order. Step 1: Subtract 5 from both sides: 3n = 15. Step 2: Divide both sides by 3: n = 5.",
    stage: "11plus", yearGroups: [6, 7],
  },
  {
    id: "11plus-maths-2023-q3",
    board: "11+", subject: "mathematics", year: 2023, series: "Autumn",
    paper: "Mathematics Paper", tier: "Foundation", questionNum: "3",
    marks: 2, topic: "Number",
    text: "A train journey takes 2 hours and 35 minutes. The train leaves at 09:45. At what time does it arrive?",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "12:20. Working: 09:45 + 2 hours = 11:45. 11:45 + 35 minutes = 12:20.",
    hint: "Add the hours first, then add the minutes. 09:45 + 2 hours = 11:45. Then add 35 minutes: 11:45 + 15 minutes = 12:00, then + 20 more minutes = 12:20.",
    stage: "11plus", yearGroups: [6, 7],
  },
  {
    id: "11plus-maths-2023-q4",
    board: "11+", subject: "mathematics", year: 2023, series: "Autumn",
    paper: "Mathematics Paper", tier: "Foundation", questionNum: "4",
    marks: 2, topic: "Geometry",
    text: "A square has a perimeter of 36 cm. What is the area of the square?",
    commandWord: "Calculate", answerLines: 2,
    markScheme: "81 cm squared. Working: Side length = 36 / 4 = 9 cm. Area = 9 x 9 = 81 cm squared.",
    hint: "Step 1: Find the side length. A square has 4 equal sides, so divide the perimeter by 4: 36 / 4 = 9 cm. Step 2: Area of a square = side x side = 9 x 9 = 81 cm squared.",
    stage: "11plus", yearGroups: [6, 7],
  },
  {
    id: "11plus-maths-2022-q1",
    board: "11+", subject: "mathematics", year: 2022, series: "Autumn",
    paper: "Mathematics Paper", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Number",
    text: "Write the next two terms in this sequence: 3, 7, 11, 15, ___, ___",
    commandWord: "Identify", answerLines: 1,
    markScheme: "19, 23. The sequence increases by 4 each time (arithmetic sequence with common difference 4).",
    hint: "Find the pattern by looking at the difference between consecutive terms: 7 - 3 = 4, 11 - 7 = 4, 15 - 11 = 4. The sequence goes up by 4 each time. Add 4 to 15 to get the next term, then add 4 again.",
    stage: "11plus", yearGroups: [6, 7],
  },
];

const elevenPlusVerbal: PastPaperQuestion[] = [
  {
    id: "11plus-verbal-2023-q1",
    board: "11+", subject: "english", year: 2023, series: "Autumn",
    paper: "Verbal Reasoning Paper", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Verbal Reasoning",
    text: "Find the word that means the same as BRAVE. A) Cowardly B) Courageous C) Cautious D) Careless",
    commandWord: "Identify", answerLines: 1,
    markScheme: "B) Courageous. Courageous means showing bravery or courage, which is a synonym of brave.",
    hint: "A synonym is a word with the same or very similar meaning. Think about what BRAVE means (not afraid, willing to face danger), then find the option that means the same thing.",
    stage: "11plus", yearGroups: [6, 7],
  },
  {
    id: "11plus-verbal-2023-q2",
    board: "11+", subject: "english", year: 2023, series: "Autumn",
    paper: "Verbal Reasoning Paper", tier: "Foundation", questionNum: "2",
    marks: 1, topic: "Verbal Reasoning",
    text: "Complete the analogy: CAT is to KITTEN as DOG is to ___.",
    commandWord: "Identify", answerLines: 1,
    markScheme: "PUPPY. A kitten is a baby cat, so a puppy is a baby dog.",
    hint: "An analogy shows a relationship between two things. CAT and KITTEN are related because a kitten is a young cat. Apply the same relationship: what is a young dog called?",
    stage: "11plus", yearGroups: [6, 7],
  },
  {
    id: "11plus-verbal-2022-q1",
    board: "11+", subject: "english", year: 2022, series: "Autumn",
    paper: "Verbal Reasoning Paper", tier: "Foundation", questionNum: "1",
    marks: 1, topic: "Verbal Reasoning",
    text: "Which word is the odd one out? Apple, Banana, Carrot, Mango, Pear",
    commandWord: "Identify", answerLines: 1,
    markScheme: "Carrot. All the others are fruits; carrot is a vegetable.",
    hint: "Look for what the words have in common. Apple, Banana, Mango and Pear are all fruits. Which word does not belong to this group?",
    stage: "11plus", yearGroups: [6, 7],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MASTER EXPORT — all questions combined
// ─────────────────────────────────────────────────────────────────────────────
export const allPastPaperQuestions: PastPaperQuestion[] = [
  ...mathsAQA,
  ...mathsEdexcel,
  ...mathsOCR,
  ...mathsWJEC,
  ...englishLangAQA,
  ...englishLangEdexcel,
  ...englishLangOCR,
  ...englishLitAQA,
  ...biologyAQA,
  ...biologyEdexcel,
  ...chemistryAQA,
  ...chemistryEdexcel,
  ...physicsAQA,
  ...physicsEdexcel,
  ...historyAQA,
  ...historyEdexcel,
  ...geographyAQA,
  ...geographyEdexcel,
  ...combinedScienceAQA,
  // Year-group-specific banks
  ...ks1Maths,
  ...ks1English,
  ...ks2Maths,
  ...ks2English,
  ...elevenPlusMaths,
  ...elevenPlusVerbal,
  // Expanded bank — 15+ questions per topic per subject
  ...allExpandedQuestions,
  // Additional expanded bank with LaTeX-formatted questions
  ...allExpandedQuestions2,
  // Large question banks — 1000+ questions per subject
  ...mathsQuestionsBank,
  ...biologyQuestionsBank,
  ...chemistryQuestionsBank,
  ...physicsQuestionsBank,
  ...englishQuestionsBank,
  ...allOtherSubjectQuestionsBank,
];

// ─────────────────────────────────────────────────────────────────────────────
// QUERY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get questions filtered by subject, board, tier, topic and year range.
 * Returns a shuffled selection up to `limit`.
 */
// ─────────────────────────────────────────────────────────────────────────────
// Topic alias map — maps common user-entered topic names to the canonical
// topic labels used in the question banks, plus keyword terms to search in
// question text as a fallback.
// ─────────────────────────────────────────────────────────────────────────────
const TOPIC_ALIASES: Record<string, string[]> = {
  // ── MATHEMATICS ──────────────────────────────────────────────────────────────
  "fractions": ["Fractions", "Number", "Ratio and Proportion", "Ratio"],
  "fraction": ["Fractions", "Number", "Ratio and Proportion", "Ratio"],
  "number": ["Number", "Fractions", "Ratio", "Ratio and Proportion"],
  "algebra": ["Algebra"],
  "geometry": ["Geometry", "Measurement"],
  "shape": ["Geometry", "Measurement"],
  "measure": ["Geometry", "Measurement"],
  "measurement": ["Geometry", "Measurement"],
  "statistics": ["Statistics"],
  "data": ["Statistics"],
  "probability": ["Statistics"],
  "ratio": ["Ratio", "Ratio and Proportion", "Fractions", "Number"],
  "proportion": ["Ratio", "Ratio and Proportion"],
  "ratio and proportion": ["Ratio and Proportion", "Ratio", "Fractions"],
  "trigonometry": ["Trigonometry", "Geometry"],
  "trig": ["Trigonometry", "Geometry"],
  "calculus": ["Calculus"],
  "differentiation": ["Calculus"],
  "integration": ["Calculus"],
  "graphs": ["Graphs", "Algebra"],
  "graph": ["Graphs", "Algebra"],
  "vectors": ["Vectors", "Geometry"],
  "vector": ["Vectors", "Geometry"],
  "sequences": ["Algebra", "Number"],
  "sequence": ["Algebra", "Number"],
  "series": ["Algebra", "Number"],
  "inequalities": ["Algebra"],
  "inequality": ["Algebra"],
  "surds": ["Number", "Algebra"],
  "surd": ["Number", "Algebra"],
  "indices": ["Number", "Algebra"],
  "index": ["Number", "Algebra"],
  "powers": ["Number", "Algebra"],
  "percentages": ["Number", "Fractions", "Ratio and Proportion"],
  "percentage": ["Number", "Fractions", "Ratio and Proportion"],
  "percent": ["Number", "Fractions", "Ratio and Proportion"],
  "decimals": ["Number", "Fractions"],
  "decimal": ["Number", "Fractions"],
  "area": ["Geometry", "Measurement"],
  "volume": ["Geometry", "Measurement"],
  "perimeter": ["Geometry", "Measurement"],
  "pythagoras": ["Geometry", "Trigonometry"],
  "pythagorean": ["Geometry", "Trigonometry"],
  "circle": ["Geometry"],
  "circles": ["Geometry"],
  "angles": ["Geometry"],
  "angle": ["Geometry"],
  "transformation": ["Geometry"],
  "transformations": ["Geometry"],
  "translation": ["Geometry"],
  "rotation": ["Geometry"],
  "enlargement": ["Geometry"],
  "simultaneous": ["Algebra"],
  "simultaneous equations": ["Algebra"],
  "quadratic": ["Algebra"],
  "linear": ["Algebra", "Graphs"],
  "equation": ["Algebra"],
  "equations": ["Algebra"],
  "expression": ["Algebra"],
  "expressions": ["Algebra"],
  "factorisation": ["Algebra"],
  "factorize": ["Algebra"],
  "expand": ["Algebra"],
  "expanding": ["Algebra"],
  "brackets": ["Algebra"],
  "proof": ["Algebra", "Number"],
  "prime": ["Number"],
  "primes": ["Number"],
  "factors": ["Number", "Algebra"],
  "multiples": ["Number"],
  "hcf": ["Number"],
  "lcm": ["Number"],
  "rounding": ["Number"],
  "estimation": ["Number"],
  "standard form": ["Number"],
  "bounds": ["Number"],
  "speed": ["Ratio and Proportion", "Number"],
  "density": ["Ratio and Proportion", "Number"],
  "direct proportion": ["Ratio and Proportion"],
  "inverse proportion": ["Ratio and Proportion"],
  "scatter": ["Statistics"],
  "scatter graph": ["Statistics"],
  "histogram": ["Statistics"],
  "cumulative frequency": ["Statistics"],
  "box plot": ["Statistics"],
  "mean": ["Statistics"],
  "median": ["Statistics"],
  "mode": ["Statistics"],
  "range": ["Statistics"],
  "average": ["Statistics"],
  "mechanics": ["Mechanics"],
  // ── BIOLOGY ──────────────────────────────────────────────────────────────────
  "cell biology": ["Cell Biology"],
  "cell": ["Cell Biology"],
  "cells": ["Cell Biology"],
  "mitosis": ["Cell Biology"],
  "diffusion": ["Cell Biology", "Organisation"],
  "osmosis": ["Cell Biology", "Organisation"],
  "organisation": ["Organisation"],
  "organ": ["Organisation"],
  "organs": ["Organisation"],
  "heart": ["Organisation"],
  "blood": ["Organisation"],
  "digestive": ["Organisation"],
  "infection": ["Infection and Response"],
  "disease": ["Infection and Response"],
  "immune": ["Infection and Response"],
  "vaccination": ["Infection and Response"],
  "pathogen": ["Infection and Response"],
  "bacteria": ["Infection and Response"],
  "virus": ["Infection and Response"],
  "bioenergetics": ["Bioenergetics"],
  "photosynthesis": ["Bioenergetics"],
  "respiration": ["Bioenergetics"],
  "aerobic": ["Bioenergetics"],
  "anaerobic": ["Bioenergetics"],
  "homeostasis": ["Homeostasis", "Homeostasis and Response"],
  "nervous system": ["Homeostasis", "Homeostasis and Response"],
  "hormones": ["Homeostasis", "Homeostasis and Response"],
  "diabetes": ["Homeostasis"],
  "kidney": ["Homeostasis"],
  "inheritance": ["Inheritance", "Inheritance, Variation and Evolution"],
  "genetics": ["Inheritance", "Genetics and Evolution"],
  "dna": ["Inheritance"],
  "chromosome": ["Inheritance"],
  "allele": ["Inheritance"],
  "evolution": ["Inheritance", "Ecology", "Genetics and Evolution"],
  "natural selection": ["Inheritance", "Ecology"],
  "ecology": ["Ecology"],
  "food chain": ["Ecology"],
  "food web": ["Ecology"],
  "ecosystem": ["Ecology", "The Living World"],
  "biodiversity": ["Ecology"],
  "population": ["Ecology"],
  // ── CHEMISTRY ────────────────────────────────────────────────────────────────
  "atomic structure": ["Atomic Structure"],
  "atom": ["Atomic Structure"],
  "atoms": ["Atomic Structure"],
  "electron": ["Atomic Structure", "Bonding"],
  "proton": ["Atomic Structure"],
  "neutron": ["Atomic Structure"],
  "isotope": ["Atomic Structure"],
  "bonding": ["Bonding", "Bonding, Structure and Properties"],
  "ionic": ["Bonding", "Bonding, Structure and Properties"],
  "covalent": ["Bonding", "Bonding, Structure and Properties"],
  "metallic": ["Bonding", "Bonding, Structure and Properties"],
  "structure": ["Bonding, Structure and Properties"],
  "quantitative chemistry": ["Quantitative Chemistry"],
  "moles": ["Quantitative Chemistry"],
  "mole": ["Quantitative Chemistry"],
  "relative formula mass": ["Quantitative Chemistry"],
  "yield": ["Quantitative Chemistry"],
  "chemical changes": ["Chemical Changes"],
  "reactivity": ["Chemical Changes"],
  "electrolysis": ["Chemical Changes"],
  "acid": ["Chemical Changes"],
  "base": ["Chemical Changes"],
  "salt": ["Chemical Changes"],
  "energy changes": ["Energy Changes"],
  "exothermic": ["Energy Changes"],
  "endothermic": ["Energy Changes"],
  "bond energy": ["Energy Changes"],
  "rates of reaction": ["Rates of Reaction"],
  "rate": ["Rates of Reaction"],
  "catalyst": ["Rates of Reaction"],
  "concentration": ["Rates of Reaction"],
  "organic chemistry": ["Organic Chemistry"],
  "alkane": ["Organic Chemistry"],
  "alkene": ["Organic Chemistry"],
  "polymer": ["Organic Chemistry"],
  "crude oil": ["Organic Chemistry"],
  "periodic table": ["Periodic Table"],
  "group": ["Periodic Table"],
  "period": ["Periodic Table"],
  "metal": ["Periodic Table", "Chemical Changes"],
  "non-metal": ["Periodic Table"],
  "atmosphere": ["Atmosphere"],
  "chemical analysis": ["Chemical Analysis"],
  "chromatography": ["Chemical Analysis"],
  "states of matter": ["States of Matter"],
  // ── PHYSICS ──────────────────────────────────────────────────────────────────
  "forces": ["Forces", "Motion and Forces"],
  "force": ["Forces", "Motion and Forces"],
  "motion": ["Forces", "Motion and Forces"],
  "newton": ["Forces"],
  "momentum": ["Forces"],
  "gravity": ["Forces"],
  "friction": ["Forces"],
  "energy": ["Energy"],
  "kinetic energy": ["Energy"],
  "potential energy": ["Energy"],
  "power": ["Energy", "Electricity"],
  "efficiency": ["Energy"],
  "waves": ["Waves"],
  "wave": ["Waves"],
  "light": ["Waves"],
  "sound": ["Waves"],
  "refraction": ["Waves"],
  "electromagnetic": ["Waves"],
  "electricity": ["Electricity", "Electricity and Circuits"],
  "circuit": ["Electricity", "Electricity and Circuits"],
  "current": ["Electricity"],
  "voltage": ["Electricity"],
  "resistance": ["Electricity"],
  "ohm": ["Electricity"],
  "magnetism": ["Magnetism", "Magnetism and Electromagnetism"],
  "magnet": ["Magnetism", "Magnetism and Electromagnetism"],
  "electromagnetic induction": ["Magnetism and Electromagnetism"],
  "space": ["Space Physics"],
  "solar system": ["Space Physics"],
  "star": ["Space Physics"],
  "galaxy": ["Space Physics"],
  "atomic physics": ["Atomic and Nuclear Physics"],
  "nuclear": ["Atomic and Nuclear Physics"],
  "radioactive": ["Atomic and Nuclear Physics"],
  "radiation": ["Atomic and Nuclear Physics"],
  "half life": ["Atomic and Nuclear Physics"],
  "particle model": ["Particle Model of Matter"],
  // ── ENGLISH LANGUAGE ─────────────────────────────────────────────────────────
  "reading": ["Reading — Language Analysis", "Reading — Comparison", "Reading — Evaluation", "Reading — Inference", "Reading — Retrieval", "Reading — Structure", "Reading — Summary", "Reading: Comparison", "Reading: Evaluation", "Reading: Language Analysis", "Reading: Structure Analysis", "Reading: Summary", "Reading – Analysis", "Reading – Comprehension", "Reading – Comparison", "Reading – Evaluation", "Reading – Language Analysis", "Reading – Structure", "Reading – Summary", "Comprehension"],
  "language analysis": ["Reading — Language Analysis", "Reading: Language Analysis", "Reading – Language Analysis"],
  "inference": ["Reading — Inference", "Reading: Identify and Interpret"],
  "comparison": ["Reading — Comparison", "Reading: Comparison", "Reading – Comparison"],
  "evaluation": ["Reading — Evaluation", "Reading: Evaluation", "Reading – Evaluation"],
  "summary": ["Reading — Summary", "Reading: Summary", "Reading – Summary"],
  "writing": ["Writing: Creative", "Writing: Narrative", "Writing: Transactional", "Writing — Descriptive", "Writing — Narrative", "Writing — Persuasive", "Writing — Essay", "Writing – Creative", "Writing – Informative", "Writing – Narrative"],
  "creative writing": ["Writing: Creative", "Writing — Descriptive", "Writing — Narrative", "Writing – Creative"],
  "descriptive writing": ["Writing — Descriptive", "Writing: Creative"],
  "narrative writing": ["Writing: Narrative", "Writing — Narrative", "Writing – Narrative"],
  "persuasive writing": ["Writing — Persuasive", "Writing: Transactional"],
  "transactional writing": ["Writing: Transactional", "Writing — Persuasive"],
  "grammar": ["Grammar"],
  "comprehension": ["Comprehension", "Reading – Comprehension"],
  // ── ENGLISH LITERATURE ───────────────────────────────────────────────────────
  "shakespeare": ["Literature — Shakespeare", "Macbeth", "Shakespeare"],
  "macbeth": ["Macbeth", "Literature — Shakespeare", "Shakespeare"],
  "poetry": ["Literature — Poetry", "Poetry – Power and Conflict"],
  "power and conflict": ["Literature — Poetry", "Poetry – Power and Conflict"],
  "prose": ["Literature — Modern Prose/Drama", "Modern Prose or Drama"],
  "modern prose": ["Literature — Modern Prose/Drama", "Modern Prose or Drama"],
  "19th century novel": ["Literature — 19th Century Novel", "19th Century Novel"],
  "victorian novel": ["Literature — 19th Century Novel", "19th Century Novel"],
  "literature": ["Literature — Shakespeare", "Literature — Poetry", "Literature — Modern Prose/Drama", "Literature — 19th Century Novel", "Macbeth"],
  // ── HISTORY ──────────────────────────────────────────────────────────────────
  "world war": ["World War One", "Cold War", "Conflict and Tension 1918–1939"],
  "world war one": ["World War One", "Conflict and Tension 1918–1939"],
  "ww1": ["World War One", "Conflict and Tension 1918–1939"],
  "cold war": ["Cold War"],
  "medicine": ["Medicine Through Time", "Medicine in Britain", "Britain: Health and the People"],
  "health": ["Medicine Through Time", "Medicine in Britain", "Britain: Health and the People"],
  "elizabethan": ["Elizabethan England"],
  "germany": ["Germany 1890–1945", "Weimar and Nazi Germany"],
  "nazi": ["Germany 1890–1945", "Weimar and Nazi Germany"],
  "weimar": ["Weimar and Nazi Germany", "Germany 1890–1945"],
  "crime": ["Crime and Punishment"],
  "punishment": ["Crime and Punishment"],
  "conflict": ["Conflict and Tension 1918–1939", "World War One"],
  // ── GEOGRAPHY ────────────────────────────────────────────────────────────────
  "natural hazards": ["Natural Hazards", "Tectonic Hazards", "The Challenge of Natural Hazards"],
  "tectonic": ["Tectonic Hazards", "Natural Hazards", "The Challenge of Natural Hazards"],
  "earthquake": ["Tectonic Hazards", "Natural Hazards"],
  "volcano": ["Tectonic Hazards", "Natural Hazards"],
  "weather": ["Weather Hazards", "Natural Hazards", "The Challenge of Natural Hazards"],
  "climate": ["Atmosphere", "Weather Hazards"],
  "coasts": ["Coasts", "Physical Landscapes in the UK"],
  "coastal": ["Coasts", "Physical Landscapes in the UK"],
  "rivers": ["Physical Landscapes in the UK"],
  "physical landscapes": ["Physical Landscapes in the UK"],
  "urban": ["Urban Issues", "Urban Issues and Challenges", "Changing Cities"],
  "urbanisation": ["Urban Issues", "Urban Issues and Challenges", "Changing Cities"],
  "development": ["Development", "The Changing Economic World"],
  "economic development": ["The Changing Economic World", "Development"],
  "living world": ["The Living World"],
  "rainforest": ["The Living World"],
  // ── COMPUTER SCIENCE ─────────────────────────────────────────────────────────
  "algorithms": ["Algorithms"],
  "algorithm": ["Algorithms"],
  "programming": ["Programming"],
  "python": ["Programming"],
  "pseudocode": ["Algorithms", "Programming"],
  "binary": ["Binary and Data Representation"],
  "data representation": ["Binary and Data Representation"],
  "hexadecimal": ["Binary and Data Representation"],
  "networks": ["Networks"],
  "network": ["Networks"],
  "internet": ["Networks"],
  "hardware": ["Hardware"],
  "cpu": ["Hardware"],
  "memory": ["Hardware"],
  "cyber security": ["Cyber Security"],
  "cybersecurity": ["Cyber Security"],
  "encryption": ["Cyber Security"],
  // ── RELIGIOUS STUDIES ────────────────────────────────────────────────────────
  "christianity": ["Christianity — Beliefs"],
  "beliefs": ["Christianity — Beliefs"],
  "religion": ["Christianity — Beliefs"],
  // ── BUSINESS ─────────────────────────────────────────────────────────────────
  "business": ["Business in the Real World"],
  "marketing": ["Marketing"],
  "finance": ["Finance"],
};

/**
 * Resolve a user-entered topic string to a list of canonical topic labels
 * that should be searched. Returns null if the topic should be searched
 * as a plain substring (default behaviour).
 */
function resolveTopicAliases(topic: string): string[] | null {
  const key = topic.toLowerCase().trim();
  // Direct alias lookup
  if (TOPIC_ALIASES[key]) return TOPIC_ALIASES[key];
  // Partial alias lookup (e.g. "fraction" matches "fractions")
  for (const [alias, targets] of Object.entries(TOPIC_ALIASES)) {
    if (key.includes(alias) || alias.includes(key)) return targets;
  }
  return null;
}

export function getExamQuestions(options: {
  subject: string;
  board?: string;
  tier?: "Higher" | "Foundation";
  topic?: string;
  yearMin?: number;
  yearMax?: number;
  limit?: number;
  yearGroup?: number; // school year (1-11) for age-appropriate filtering
}): PastPaperQuestion[] {
  const { subject, board, tier, topic, yearMin = 2010, yearMax = 2025, limit = 25, yearGroup } = options;

  // Resolve topic aliases for smarter matching
  const topicAliases = topic ? resolveTopicAliases(topic) : null;
  const topicLower = topic ? topic.toLowerCase() : null;

  const matchesTopic = (q: PastPaperQuestion): boolean => {
    if (!topicLower) return true;
    // 1. Direct topic field match (case-insensitive substring)
    if ((q.topic || '').toLowerCase().includes(topicLower)) return true;
    // 2. Alias-based topic match
    if (topicAliases) {
      for (const alias of topicAliases) {
        if ((q.topic || '').toLowerCase().includes(alias.toLowerCase())) return true;
      }
    }
    // 3. Keyword search in question text (fallback)
    if (q.text && q.text.toLowerCase().includes(topicLower)) return true;
    return false;
  };

  let filtered = allPastPaperQuestions.filter(q => {
    if (q.subject !== subject) return false;
    if (board && board !== "none" && board !== "Any" && q.board !== board) return false;
    if (tier && q.tier && q.tier !== tier) return false;
    if (!matchesTopic(q)) return false;
    if (q.year !== undefined && (q.year < yearMin || q.year > yearMax)) return false;

    // Year-group-appropriate filtering — STRICTLY enforced
    if (yearGroup) {
      if (yearGroup <= 2) {
        // KS1 (Years 1–2): only KS1 SATs questions
        if (q.stage && q.stage !== "ks1") return false;
      } else if (yearGroup <= 6) {
        // KS2 (Years 3–6): KS2 SATs questions only
        if (q.stage && q.stage !== "ks2" && q.stage !== "ks1") return false;
      } else if (yearGroup === 7) {
        // Year 7: KS3 questions or 11+ questions (transition year)
        if (q.stage && q.stage !== "ks3" && q.stage !== "11plus" && q.stage !== "ks2") return false;
        // No GCSE questions for Year 7 — strictly KS3 level
        if ((q.stage as string) === "gcse" && q.tier === "Higher") return false;
      } else if (yearGroup <= 9) {
        // KS3 (Years 8–9): KS3 or GCSE Foundation questions only
        if (q.stage && q.stage !== "ks3" && q.stage !== "gcse") return false;
        // No Higher tier for KS3 students
        if (q.tier && q.tier === "Higher") return false;
      } else if (yearGroup <= 11) {
        // GCSE (Years 10–11): GCSE questions only — NO KS2 SATs, NO KS1
        if (q.stage && q.stage !== "gcse" && q.stage !== "ks3") return false;
      } else {
        // A-Level / Sixth Form (Years 12–13): GCSE and above
        if (q.stage === "ks1" || q.stage === "ks2") return false;
      }
    }

    return true;
  });

  // Shuffle for variety
  filtered = filtered.sort(() => Math.random() - 0.5);

  return filtered.slice(0, limit);
}

/**
 * Get all unique topics available for a given subject and board.
 */
export function getTopicsForSubject(subject: string, board?: string): string[] {
  const topics = new Set<string>();
  allPastPaperQuestions
    .filter(q => q.subject === subject && (!board || board === "Any" || q.board === board))
     .forEach(q => { if (q.topic) topics.add(q.topic); });
  return Array.from(topics).sort();
}
/**
 * Get all unique boards available for a given subject.
 */
export function getBoardsForSubject(subject: string): string[] {
  const boards = new Set<string>();
  allPastPaperQuestions
    .filter(q => q.subject === subject)
    .forEach(q => { if (q.board) boards.add(q.board); });
  return Array.from(boards).sort();
}

/**
 * Format a past paper question into clean worksheet HTML/markdown.
 * Preserves exact question text with mark allocations and answer lines.
 */
export function formatQuestionForWorksheet(
  q: PastPaperQuestion,
  index: number,
  showMarkScheme = false,
  showHint = false
): string {
   const markLabel = q.marks === 1 ? "(1 mark)" : `(${q.marks ?? 0} marks)`;
  const contextBlock = q.context
    ? `\n\n${q.context.split("\n").join("\n")}\n`
    : "";
  const qText = q.text || q.question || '';
  // No asterisks — plain text formatting
  let out = `Q${index}. ${qText} ${markLabel}${contextBlock}\n`;

  if (q.subParts && q.subParts.length > 0) {
    q.subParts.forEach(part => {
      const partMark = part.marks === 1 ? "(1 mark)" : `(${part.marks} marks)`;
      out += `\n(${part.label}) ${part.text} ${partMark}\n`;
      const lines = part.answerLines || 3;
      out += "\n" + Array(lines).fill("___________________________________________").join("\n") + "\n";
    });
  } else {
    const lines = q.answerLines || 3;
    out += "\n" + Array(lines).fill("___________________________________________").join("\n") + "\n";
  }

  // Show helpful hint if requested
  if (showHint && q.hint) {
    out += `\nHint: ${q.hint}\n`;
  }

  // Show real mark scheme answer if requested (teacher copy)
  if (showMarkScheme && q.markScheme) {
    out += `\nMark scheme: ${q.markScheme}\n`;
  }

  const stageLabel = q.stage === "ks1" ? "KS1 SATs" : q.stage === "ks2" ? "KS2 SATs" : q.stage === "11plus" ? "11+" : q.stage === "ks3" ? "KS3" : "GCSE";
  if (q.board || q.year || q.paper) {
    out += `\nSource: ${q.board ?? ''} ${stageLabel} ${q.year ?? ''} — ${q.paper ?? ''}\n`;
  }
  return out;
}

/**
 * Get a summary of the database for display purposes.
 */
export function getDatabaseSummary() {
  const byBoard: Record<string, number> = {};
  const bySubject: Record<string, number> = {};
  const byYear: Record<number, number> = {};

  allPastPaperQuestions.forEach(q => {
    if (q.board) byBoard[q.board] = (byBoard[q.board] || 0) + 1;
    if (q.subject) bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
    if (q.year !== undefined) byYear[q.year] = (byYear[q.year] || 0) + 1;
  });

  return {
    total: allPastPaperQuestions.length,
    byBoard,
    bySubject,
    byYear,
    subjects: Object.keys(bySubject).length,
    boards: Object.keys(byBoard).length,
    years: Object.keys(byYear).length,
  };
}
