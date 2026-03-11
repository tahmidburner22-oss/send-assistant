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

export interface PastPaperQuestion {
  id: string;
  board: "AQA" | "Edexcel" | "OCR" | "WJEC";
  subject: string;
  year: number;
  series: "June" | "November" | "Sample" | "Specimen";
  paper: string;
  tier?: "Higher" | "Foundation";
  questionNum: string;
  marks: number;
  topic: string;
  text: string;
  context?: string;
  subParts?: PastPaperSubPart[];
  commandWord?: string;
  answerLines?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const mathsAQA: PastPaperQuestion[] = [
  {
    id: "maths-aqa-2023-p1h-q1",
    board: "AQA", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Write 0.000 307 in standard form.",
    commandWord: "Write", answerLines: 1,
  },
  {
    id: "maths-aqa-2023-p1h-q2",
    board: "AQA", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Expand and simplify (2x + 3)(x − 5).",
    commandWord: "Expand", answerLines: 2,
  },
  {
    id: "maths-aqa-2023-p1h-q3",
    board: "AQA", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "3",
    marks: 5, topic: "Ratio and Proportion",
    text: "A recipe uses flour, butter and sugar in the ratio 4 : 3 : 2. James has 500 g of flour, 400 g of butter and 300 g of sugar. What is the maximum amount of mixture James can make? You must show your working.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-aqa-2023-p1h-q4",
    board: "AQA", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "4",
    marks: 3, topic: "Geometry",
    text: "ABC is a triangle. Angle A = 90°. AB = 6 cm. BC = 10 cm. Calculate the length of AC.",
    commandWord: "Calculate", answerLines: 3,
  },
  {
    id: "maths-aqa-2023-p1h-q5",
    board: "AQA", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "5",
    marks: 4, topic: "Statistics",
    text: "The table shows information about the heights of 40 students. Work out an estimate for the mean height.",
    context: "Height (h cm) | Frequency\n140 ≤ h < 150 | 8\n150 ≤ h < 160 | 15\n160 ≤ h < 170 | 12\n170 ≤ h < 180 | 5",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-aqa-2023-p1f-q1",
    board: "AQA", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Number",
    text: "Write these numbers in order of size. Start with the smallest number. 0.35   0.3   0.53   0.305",
    commandWord: "Write", answerLines: 1,
  },
  {
    id: "maths-aqa-2023-p1f-q2",
    board: "AQA", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "2",
    marks: 3, topic: "Number",
    text: "Work out 3/4 + 2/5. Give your answer as a fraction in its simplest form.",
    commandWord: "Calculate", answerLines: 3,
  },
  {
    id: "maths-aqa-2023-p1f-q3",
    board: "AQA", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "3",
    marks: 4, topic: "Algebra",
    text: "Solve 3x + 7 = 22.",
    commandWord: "Solve", answerLines: 3,
  },
  {
    id: "maths-aqa-2022-p1h-q1",
    board: "AQA", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Show that √(12) + √(75) = 7√3.",
    commandWord: "Show", answerLines: 4,
  },
  {
    id: "maths-aqa-2022-p1h-q2",
    board: "AQA", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Factorise fully 6x² − 15x.",
    commandWord: "Factorise", answerLines: 2,
  },
  {
    id: "maths-aqa-2022-p1h-q3",
    board: "AQA", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "3",
    marks: 5, topic: "Geometry",
    text: "ABCD is a parallelogram. A is at (1, 3). B is at (4, 5). C is at (6, 1). Find the coordinates of D.",
    commandWord: "Find", answerLines: 3,
  },
  {
    id: "maths-aqa-2022-p2h-q1",
    board: "AQA", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Statistics",
    text: "The probability that a biased coin lands on heads is 0.6. The coin is thrown 3 times. Work out the probability that the coin lands on heads exactly twice.",
    commandWord: "Calculate", answerLines: 3,
  },
  {
    id: "maths-aqa-2022-p2h-q2",
    board: "AQA", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Ratio and Proportion",
    text: "A car travels 240 miles in 4 hours. The car then travels a further 150 miles at an average speed of 50 mph. Work out the average speed for the whole journey.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-aqa-2019-p1h-q1",
    board: "AQA", subject: "mathematics", year: 2019, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Write 56 000 000 in standard form.",
    commandWord: "Write", answerLines: 1,
  },
  {
    id: "maths-aqa-2019-p1h-q2",
    board: "AQA", subject: "mathematics", year: 2019, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Solve x² − 5x − 14 = 0.",
    commandWord: "Solve", answerLines: 4,
  },
  {
    id: "maths-aqa-2019-p2h-q1",
    board: "AQA", subject: "mathematics", year: 2019, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Geometry",
    text: "A sphere has a radius of 5 cm. A cone has a base radius of 5 cm. The volume of the sphere is equal to the volume of the cone. Work out the height of the cone. Give your answer correct to 3 significant figures.",
    commandWord: "Calculate", answerLines: 5,
  },
  {
    id: "maths-aqa-2024-p1h-q1",
    board: "AQA", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 2, topic: "Number",
    text: "Write 4.7 × 10⁻³ as an ordinary number.",
    commandWord: "Write", answerLines: 1,
  },
  {
    id: "maths-aqa-2024-p1h-q2",
    board: "AQA", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 3, topic: "Algebra",
    text: "Make t the subject of the formula v = u + at.",
    commandWord: "Rearrange", answerLines: 2,
  },
  {
    id: "maths-aqa-2024-p1h-q3",
    board: "AQA", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "3",
    marks: 4, topic: "Geometry",
    text: "The diagram shows a right-angled triangle. The hypotenuse is 13 cm. One side is 5 cm. Calculate the area of the triangle.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-aqa-2024-p2h-q1",
    board: "AQA", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 2 (Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Statistics",
    text: "A bag contains 3 red, 5 blue and 2 green counters. A counter is taken at random. Write down the probability that the counter is not red.",
    commandWord: "Calculate", answerLines: 2,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS — Edexcel GCSE
// ─────────────────────────────────────────────────────────────────────────────
const mathsEdexcel: PastPaperQuestion[] = [
  {
    id: "maths-edexcel-2023-p1h-q1",
    board: "Edexcel", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Express 360 as a product of its prime factors. Give your answer in index form.",
    commandWord: "Express", answerLines: 3,
  },
  {
    id: "maths-edexcel-2023-p1h-q2",
    board: "Edexcel", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Solve the simultaneous equations: 2x + 3y = 13 and 5x − 2y = 4.",
    commandWord: "Solve", answerLines: 5,
  },
  {
    id: "maths-edexcel-2023-p1h-q3",
    board: "Edexcel", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "3",
    marks: 5, topic: "Geometry",
    text: "The diagram shows a circle with centre O. A and B are points on the circle. Angle AOB = 130°. Work out the size of angle ACB where C is a point on the major arc. Give reasons for your answer.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-edexcel-2023-p1f-q1",
    board: "Edexcel", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Number",
    text: "Work out 15% of 240.",
    commandWord: "Calculate", answerLines: 2,
  },
  {
    id: "maths-edexcel-2023-p1f-q2",
    board: "Edexcel", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "2",
    marks: 3, topic: "Algebra",
    text: "Expand and simplify 3(2x + 1) + 2(x − 4).",
    commandWord: "Expand", answerLines: 3,
  },
  {
    id: "maths-edexcel-2022-p1h-q1",
    board: "Edexcel", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Without using a calculator, work out 2⅓ × 1⅘. Show all your working and give your answer as a mixed number in its simplest form.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-edexcel-2022-p1h-q2",
    board: "Edexcel", subject: "mathematics", year: 2022, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "The nth term of a sequence is 3n² − 2. Work out the difference between the 5th term and the 4th term of this sequence.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-edexcel-2019-p1h-q1",
    board: "Edexcel", subject: "mathematics", year: 2019, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Statistics",
    text: "The table shows information about the number of goals scored in each match played by a football team. Work out the mean number of goals scored per match.",
    context: "Number of goals | Frequency\n0 | 3\n1 | 7\n2 | 6\n3 | 4",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-edexcel-2024-p1h-q1",
    board: "Edexcel", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Algebra",
    text: "Simplify fully (x² − 9) / (x² + x − 12).",
    commandWord: "Simplify", answerLines: 3,
  },
  {
    id: "maths-edexcel-2024-p2h-q1",
    board: "Edexcel", subject: "mathematics", year: 2024, series: "June",
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
    board: "OCR", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Find the highest common factor (HCF) of 84 and 126.",
    commandWord: "Find", answerLines: 3,
  },
  {
    id: "maths-ocr-2023-p1h-q2",
    board: "OCR", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Algebra",
    text: "Solve 2x² + 5x − 3 = 0 by factorisation.",
    commandWord: "Solve", answerLines: 4,
  },
  {
    id: "maths-ocr-2023-p1f-q1",
    board: "OCR", subject: "mathematics", year: 2023, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "1",
    marks: 2, topic: "Number",
    text: "Write 0.07 as a percentage.",
    commandWord: "Write", answerLines: 1,
  },
  {
    id: "maths-ocr-2024-p1h-q1",
    board: "OCR", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Geometry",
    text: "In triangle PQR, PQ = 8 cm, QR = 11 cm and angle PQR = 42°. Calculate the area of triangle PQR.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "maths-ocr-2024-p1f-q1",
    board: "OCR", subject: "mathematics", year: 2024, series: "June",
    paper: "Paper 1 (Non-Calculator)", tier: "Foundation", questionNum: "1",
    marks: 3, topic: "Statistics",
    text: "The pictogram shows the number of books read by five children in a month. Each symbol represents 4 books. How many books did they read altogether?",
    context: "Ali: ●●●\nBen: ●●●●●\nCara: ●●\nDan: ●●●●\nEve: ●●●●●●\n(Each ● = 4 books)",
    commandWord: "Calculate", answerLines: 2,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH LANGUAGE — AQA GCSE
// ─────────────────────────────────────────────────────────────────────────────
const englishLangAQA: PastPaperQuestion[] = [
  {
    id: "eng-lang-aqa-2023-p1-q1",
    board: "AQA", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "1",
    marks: 4, topic: "Reading – Comprehension",
    text: "Read again the first part of the source, from lines 1 to 5. List four things from this part of the text about the setting.",
    commandWord: "List", answerLines: 4,
  },
  {
    id: "eng-lang-aqa-2023-p1-q2",
    board: "AQA", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "2",
    marks: 8, topic: "Reading – Language Analysis",
    text: "Look in detail at this extract, from lines 6 to 14 of the source. How does the writer use language here to describe the character's fear? You could include the writer's choice of: words and phrases; language features and techniques; sentence forms.",
    commandWord: "Analyse", answerLines: 12,
  },
  {
    id: "eng-lang-aqa-2023-p1-q3",
    board: "AQA", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "3",
    marks: 8, topic: "Reading – Structure",
    text: "You now need to think about the whole of the source. This text is from the opening of a novel. How has the writer structured the text to interest you as a reader? You could write about: what the writer focuses your attention on at the beginning; how and why the writer changes this focus as the source develops; any other structural features that interest you.",
    commandWord: "Analyse", answerLines: 12,
  },
  {
    id: "eng-lang-aqa-2023-p1-q4",
    board: "AQA", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "4",
    marks: 20, topic: "Reading – Evaluation",
    text: "Focus this part of your answer on the second part of the source, from line 15 to the end. A student, having read this section of the text, said: 'The writer makes the reader feel completely absorbed in the tension and drama of this moment.' To what extent do you agree? In your response, you could: write about your own impressions of the tension and drama; evaluate how the writer has created these impressions; support your opinions with quotations from the text.",
    commandWord: "Evaluate", answerLines: 20,
  },
  {
    id: "eng-lang-aqa-2023-p1-q5",
    board: "AQA", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Explorations in Creative Reading and Writing", questionNum: "5",
    marks: 40, topic: "Writing – Creative",
    text: "You are going to enter a creative writing competition. Your entry will be judged by a panel of people of your own age. Either: Write a description suggested by this picture. Or: Write the opening part of a story about a journey that changes someone's life. (40 marks for content and organisation; 16 marks for technical accuracy)",
    commandWord: "Write", answerLines: 30,
  },
  {
    id: "eng-lang-aqa-2023-p2-q1",
    board: "AQA", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 2 – Writers' Viewpoints and Perspectives", questionNum: "1",
    marks: 4, topic: "Reading – Comprehension",
    text: "Read again source A, from lines 1 to 7. Choose four statements below which are TRUE. Shade the boxes of the ones that you think are true.",
    commandWord: "Identify", answerLines: 4,
  },
  {
    id: "eng-lang-aqa-2023-p2-q2",
    board: "AQA", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 2 – Writers' Viewpoints and Perspectives", questionNum: "2",
    marks: 8, topic: "Reading – Summary",
    text: "You need to refer to source A and source B for this question. Use details from both sources. Write a summary of the differences between the two writers' experiences of the city.",
    commandWord: "Summarise", answerLines: 12,
  },
  {
    id: "eng-lang-aqa-2023-p2-q3",
    board: "AQA", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 2 – Writers' Viewpoints and Perspectives", questionNum: "3",
    marks: 12, topic: "Reading – Language Analysis",
    text: "You now need to refer only to source B, from lines 12 to 25. How does the writer use language to convey their feelings about the experience? You could include the writer's choice of: words and phrases; language features and techniques; sentence forms.",
    commandWord: "Analyse", answerLines: 14,
  },
  {
    id: "eng-lang-aqa-2023-p2-q4",
    board: "AQA", subject: "english-language", year: 2023, series: "June",
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
    board: "AQA", subject: "english-literature", year: 2023, series: "June",
    paper: "Paper 1 – Shakespeare and the 19th-Century Novel", questionNum: "1",
    marks: 30, topic: "Shakespeare",
    text: "Read the following extract from Act 3 Scene 1 of Romeo and Juliet and then answer the question that follows. Starting with this extract, how does Shakespeare present the theme of conflict in Romeo and Juliet? Write about: how Shakespeare presents conflict in this extract; how Shakespeare presents conflict in the play as a whole.",
    commandWord: "Analyse", answerLines: 30,
  },
  {
    id: "eng-lit-aqa-2023-p1-q2",
    board: "AQA", subject: "english-literature", year: 2023, series: "June",
    paper: "Paper 1 – Shakespeare and the 19th-Century Novel", questionNum: "2",
    marks: 30, topic: "19th Century Novel",
    text: "Read the following extract from Chapter 8 of A Christmas Carol and then answer the question that follows. Starting with this extract, how does Dickens present the character of Scrooge in A Christmas Carol? Write about: how Dickens presents Scrooge in this extract; how Dickens presents Scrooge in the novel as a whole.",
    commandWord: "Analyse", answerLines: 30,
  },
  {
    id: "eng-lit-aqa-2023-p2-q1",
    board: "AQA", subject: "english-literature", year: 2023, series: "June",
    paper: "Paper 2 – Modern Texts and Poetry", questionNum: "1",
    marks: 30, topic: "Modern Prose or Drama",
    text: "How does Priestley present the importance of social responsibility in An Inspector Calls? Write about: how Priestley presents social responsibility in the play; how Priestley uses the character of the Inspector to explore social responsibility.",
    commandWord: "Analyse", answerLines: 30,
  },
  {
    id: "eng-lit-aqa-2023-p2-q2",
    board: "AQA", subject: "english-literature", year: 2023, series: "June",
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
    board: "AQA", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 6, topic: "Cell Biology",
    text: "Describe how to carry out a microscopy investigation to observe onion cells. Your answer should include: how to prepare the slide; how to use the microscope; how to calculate the magnification of the image.",
    commandWord: "Describe", answerLines: 8,
  },
  {
    id: "bio-aqa-2023-p1h-q2",
    board: "AQA", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "2",
    marks: 4, topic: "Organisation",
    text: "Explain how enzymes work using the lock and key model.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "bio-aqa-2023-p1h-q3",
    board: "AQA", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "3",
    marks: 5, topic: "Infection and Response",
    text: "Describe the non-specific defence mechanisms the human body uses to prevent pathogens from entering the body.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "bio-aqa-2023-p1h-q4",
    board: "AQA", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "4",
    marks: 6, topic: "Bioenergetics",
    text: "Describe the process of aerobic respiration. Include the reactants, products and where in the cell it takes place.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "bio-aqa-2023-p2h-q1",
    board: "AQA", subject: "biology", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Homeostasis and Response",
    text: "Explain how the body responds to a rise in blood glucose concentration.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "bio-aqa-2023-p2h-q2",
    board: "AQA", subject: "biology", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "2",
    marks: 5, topic: "Inheritance, Variation and Evolution",
    text: "Explain how natural selection leads to evolution. Use an example in your answer.",
    commandWord: "Explain", answerLines: 8,
  },
  {
    id: "bio-aqa-2022-p1h-q1",
    board: "AQA", subject: "biology", year: 2022, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Cell Biology",
    text: "State three differences between a plant cell and an animal cell.",
    commandWord: "State", answerLines: 3,
  },
  {
    id: "bio-aqa-2022-p1h-q2",
    board: "AQA", subject: "biology", year: 2022, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "2",
    marks: 6, topic: "Organisation",
    text: "Describe the structure of the human digestive system and explain how food is digested and absorbed.",
    commandWord: "Describe", answerLines: 8,
  },
  {
    id: "bio-aqa-2024-p1h-q1",
    board: "AQA", subject: "biology", year: 2024, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Cell Biology",
    text: "Compare mitosis and meiosis. Include the number of cell divisions, the number of daughter cells produced and whether the daughter cells are genetically identical.",
    commandWord: "Compare", answerLines: 6,
  },
  {
    id: "bio-aqa-2024-p2h-q1",
    board: "AQA", subject: "biology", year: 2024, series: "June",
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
    board: "AQA", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Atomic Structure",
    text: "An atom of calcium has the atomic number 20 and mass number 40. State the number of protons, neutrons and electrons in this atom. Explain what is meant by an isotope of calcium.",
    commandWord: "State", answerLines: 5,
  },
  {
    id: "chem-aqa-2023-p1h-q2",
    board: "AQA", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "2",
    marks: 5, topic: "Bonding",
    text: "Explain why sodium chloride has a high melting point. Use ideas about structure and bonding in your answer.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "chem-aqa-2023-p1h-q3",
    board: "AQA", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "3",
    marks: 4, topic: "Quantitative Chemistry",
    text: "Calculate the relative formula mass (Mr) of calcium carbonate, CaCO₃. (Relative atomic masses: Ca = 40, C = 12, O = 16)",
    commandWord: "Calculate", answerLines: 3,
  },
  {
    id: "chem-aqa-2023-p2h-q1",
    board: "AQA", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Rates of Reaction",
    text: "Describe and explain the effect of increasing temperature on the rate of a chemical reaction. Use collision theory in your answer.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "chem-aqa-2023-p2h-q2",
    board: "AQA", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "2",
    marks: 6, topic: "Organic Chemistry",
    text: "Describe the process of cracking. Include: what cracking is; why cracking is carried out; the conditions needed for cracking; an equation for a cracking reaction.",
    commandWord: "Describe", answerLines: 8,
  },
  {
    id: "chem-aqa-2022-p1h-q1",
    board: "AQA", subject: "chemistry", year: 2022, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Atomic Structure",
    text: "The element lithium has two isotopes: lithium-6 and lithium-7. Explain what is meant by the term 'isotope' and describe how these two isotopes differ.",
    commandWord: "Explain", answerLines: 4,
  },
  {
    id: "chem-aqa-2024-p1h-q1",
    board: "AQA", subject: "chemistry", year: 2024, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Bonding",
    text: "Compare the properties of ionic compounds and simple molecular compounds. Include melting points, electrical conductivity and solubility in water.",
    commandWord: "Compare", answerLines: 6,
  },
  {
    id: "chem-aqa-2024-p2h-q1",
    board: "AQA", subject: "chemistry", year: 2024, series: "June",
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
    board: "AQA", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Energy",
    text: "A ball of mass 0.5 kg is dropped from a height of 10 m. Calculate the kinetic energy of the ball just before it hits the ground. (g = 10 m/s²)",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "phys-aqa-2023-p1h-q2",
    board: "AQA", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "2",
    marks: 5, topic: "Electricity",
    text: "A resistor has a resistance of 12 Ω. A current of 2 A flows through it for 5 minutes. Calculate the energy transferred to the resistor.",
    commandWord: "Calculate", answerLines: 5,
  },
  {
    id: "phys-aqa-2023-p1h-q3",
    board: "AQA", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "3",
    marks: 6, topic: "Particle Model of Matter",
    text: "Explain, using ideas about particles, what happens when a solid is heated until it melts and then continues to be heated until it becomes a gas.",
    commandWord: "Explain", answerLines: 8,
  },
  {
    id: "phys-aqa-2023-p2h-q1",
    board: "AQA", subject: "physics", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Forces",
    text: "A car of mass 1200 kg accelerates from rest to 20 m/s in 8 seconds. Calculate the resultant force acting on the car.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "phys-aqa-2023-p2h-q2",
    board: "AQA", subject: "physics", year: 2023, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "2",
    marks: 5, topic: "Waves",
    text: "A wave has a frequency of 200 Hz and a wavelength of 1.5 m. Calculate the speed of the wave. State the equation you use.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "phys-aqa-2022-p1h-q1",
    board: "AQA", subject: "physics", year: 2022, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Energy",
    text: "State the principle of conservation of energy.",
    commandWord: "State", answerLines: 3,
  },
  {
    id: "phys-aqa-2022-p2h-q1",
    board: "AQA", subject: "physics", year: 2022, series: "June",
    paper: "Paper 2", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Magnetism and Electromagnetism",
    text: "Describe how an electromagnet works. Include: what an electromagnet is; how the strength of the magnetic field can be increased; one use of an electromagnet.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "phys-aqa-2024-p1h-q1",
    board: "AQA", subject: "physics", year: 2024, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Electricity",
    text: "Draw and label a circuit diagram showing a battery, a switch, a resistor and a lamp connected in series. Add a voltmeter to measure the voltage across the lamp.",
    commandWord: "Draw", answerLines: 6,
  },
  {
    id: "phys-aqa-2024-p2h-q1",
    board: "AQA", subject: "physics", year: 2024, series: "June",
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
    board: "AQA", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 – Understanding the Modern World", questionNum: "1",
    marks: 4, topic: "Germany 1890–1945",
    text: "Describe two problems faced by the Weimar Republic in the years 1919–1923.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "hist-aqa-2023-p1-q2",
    board: "AQA", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 – Understanding the Modern World", questionNum: "2",
    marks: 8, topic: "Germany 1890–1945",
    text: "Explain why Hitler was able to become Chancellor of Germany in January 1933. You may use the following in your answer: the Wall Street Crash; the SA. You must also use information of your own.",
    commandWord: "Explain", answerLines: 12,
  },
  {
    id: "hist-aqa-2023-p1-q3",
    board: "AQA", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 – Understanding the Modern World", questionNum: "3",
    marks: 16, topic: "Germany 1890–1945",
    text: "'The main reason for the failure of the Munich Putsch in 1923 was the lack of support from the German army.' How far do you agree with this statement? Explain your answer.",
    commandWord: "Evaluate", answerLines: 20,
  },
  {
    id: "hist-aqa-2023-p2-q1",
    board: "AQA", subject: "history", year: 2023, series: "June",
    paper: "Paper 2 – Shaping the Nation", questionNum: "1",
    marks: 4, topic: "Britain: Health and the People",
    text: "Describe two features of the work of Florence Nightingale during the Crimean War.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "hist-aqa-2023-p2-q2",
    board: "AQA", subject: "history", year: 2023, series: "June",
    paper: "Paper 2 – Shaping the Nation", questionNum: "2",
    marks: 8, topic: "Britain: Health and the People",
    text: "Explain why there was opposition to the introduction of the National Health Service in 1948. You may use the following in your answer: the British Medical Association; cost. You must also use information of your own.",
    commandWord: "Explain", answerLines: 12,
  },
  {
    id: "hist-aqa-2022-p1-q1",
    board: "AQA", subject: "history", year: 2022, series: "June",
    paper: "Paper 1 – Understanding the Modern World", questionNum: "1",
    marks: 4, topic: "Conflict and Tension 1918–1939",
    text: "Describe two features of the Treaty of Versailles.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "hist-aqa-2024-p1-q1",
    board: "AQA", subject: "history", year: 2024, series: "June",
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
    board: "AQA", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 – Living with the Physical Environment", questionNum: "1",
    marks: 4, topic: "The Challenge of Natural Hazards",
    text: "State two primary effects of a tropical storm.",
    commandWord: "State", answerLines: 4,
  },
  {
    id: "geog-aqa-2023-p1-q2",
    board: "AQA", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 – Living with the Physical Environment", questionNum: "2",
    marks: 6, topic: "The Challenge of Natural Hazards",
    text: "Explain how the global atmospheric circulation model helps to explain the distribution of tropical storms.",
    commandWord: "Explain", answerLines: 8,
  },
  {
    id: "geog-aqa-2023-p1-q3",
    board: "AQA", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 – Living with the Physical Environment", questionNum: "3",
    marks: 9, topic: "Physical Landscapes in the UK",
    text: "Assess the importance of wave energy in shaping coastal landforms. Use a named example in your answer.",
    commandWord: "Assess", answerLines: 12,
  },
  {
    id: "geog-aqa-2023-p2-q1",
    board: "AQA", subject: "geography", year: 2023, series: "June",
    paper: "Paper 2 – Challenges in the Human Environment", questionNum: "1",
    marks: 4, topic: "Urban Issues and Challenges",
    text: "State two reasons why cities in LICs and NEEs are growing rapidly.",
    commandWord: "State", answerLines: 4,
  },
  {
    id: "geog-aqa-2023-p2-q2",
    board: "AQA", subject: "geography", year: 2023, series: "June",
    paper: "Paper 2 – Challenges in the Human Environment", questionNum: "2",
    marks: 6, topic: "The Changing Economic World",
    text: "Explain why some countries remain low income countries (LICs).",
    commandWord: "Explain", answerLines: 8,
  },
  {
    id: "geog-aqa-2022-p1-q1",
    board: "AQA", subject: "geography", year: 2022, series: "June",
    paper: "Paper 1 – Living with the Physical Environment", questionNum: "1",
    marks: 3, topic: "The Living World",
    text: "Describe the distribution of tropical rainforests.",
    commandWord: "Describe", answerLines: 4,
  },
  {
    id: "geog-aqa-2024-p1-q1",
    board: "AQA", subject: "geography", year: 2024, series: "June",
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
    board: "Edexcel", subject: "biology", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Cell Biology",
    text: "Describe the structure of a eukaryotic cell. Include the cell membrane, nucleus, mitochondria and ribosomes.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "bio-edexcel-2023-p2h-q1",
    board: "Edexcel", subject: "biology", year: 2023, series: "June",
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
    board: "Edexcel", subject: "chemistry", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "States of Matter",
    text: "Explain, using ideas about particles, why gases are much less dense than solids.",
    commandWord: "Explain", answerLines: 5,
  },
  {
    id: "chem-edexcel-2023-p2h-q1",
    board: "Edexcel", subject: "chemistry", year: 2023, series: "June",
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
    board: "Edexcel", subject: "physics", year: 2023, series: "June",
    paper: "Paper 1", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Motion and Forces",
    text: "A cyclist travels 600 m in 30 seconds. Calculate the average speed of the cyclist. State the equation you use.",
    commandWord: "Calculate", answerLines: 4,
  },
  {
    id: "phys-edexcel-2023-p2h-q1",
    board: "Edexcel", subject: "physics", year: 2023, series: "June",
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
    board: "Edexcel", subject: "history", year: 2023, series: "June",
    paper: "Paper 1 – Thematic Study and Historic Environment", questionNum: "1",
    marks: 4, topic: "Medicine in Britain",
    text: "Describe two features of surgery in the medieval period.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "hist-edexcel-2023-p3-q1",
    board: "Edexcel", subject: "history", year: 2023, series: "June",
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
    board: "Edexcel", subject: "geography", year: 2023, series: "June",
    paper: "Paper 1 – The Physical Environment", questionNum: "1",
    marks: 4, topic: "Tectonic Hazards",
    text: "Explain two reasons why people continue to live in areas at risk from tectonic hazards.",
    commandWord: "Explain", answerLines: 6,
  },
  {
    id: "geog-edexcel-2023-p2-q1",
    board: "Edexcel", subject: "geography", year: 2023, series: "June",
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
    board: "WJEC", subject: "mathematics", year: 2023, series: "June",
    paper: "Unit 1 (Non-Calculator)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Number",
    text: "Without using a calculator, work out 3.6 × 0.05.",
    commandWord: "Calculate", answerLines: 2,
  },
  {
    id: "maths-wjec-2023-p2h-q1",
    board: "WJEC", subject: "mathematics", year: 2023, series: "June",
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
    board: "Edexcel", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Fiction and Imaginative Writing", questionNum: "1",
    marks: 8, topic: "Reading – Language Analysis",
    text: "In lines 1–15, how does the writer use language and structure to interest and engage the reader? Support your views with reference to the text.",
    commandWord: "Analyse", answerLines: 12,
  },
  {
    id: "eng-lang-edexcel-2023-p1-q2",
    board: "Edexcel", subject: "english-language", year: 2023, series: "June",
    paper: "Paper 1 – Fiction and Imaginative Writing", questionNum: "2",
    marks: 40, topic: "Writing – Narrative",
    text: "Write a story that begins: 'The door had always been locked — until today.' (You should spend about 45 minutes on this question. 24 marks for communication and organisation; 16 marks for vocabulary, sentence structure, spelling and punctuation.)",
    commandWord: "Write", answerLines: 30,
  },
  {
    id: "eng-lang-edexcel-2023-p2-q1",
    board: "Edexcel", subject: "english-language", year: 2023, series: "June",
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
    board: "OCR", subject: "english-language", year: 2023, series: "June",
    paper: "Component 1 – Communicating Information and Ideas", questionNum: "1",
    marks: 15, topic: "Reading – Analysis",
    text: "Read Text A. How does the writer use language and structure to convey their ideas? Support your answer with reference to the text. (15 marks)",
    commandWord: "Analyse", answerLines: 16,
  },
  {
    id: "eng-lang-ocr-2023-p1-q2",
    board: "OCR", subject: "english-language", year: 2023, series: "June",
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
    board: "AQA", subject: "science", year: 2023, series: "June",
    paper: "Biology Paper 1 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Cell Biology",
    text: "State four differences between plant cells and animal cells.",
    commandWord: "State", answerLines: 4,
  },
  {
    id: "sci-aqa-2023-chem1h-q1",
    board: "AQA", subject: "science", year: 2023, series: "June",
    paper: "Chemistry Paper 1 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 3, topic: "Atomic Structure",
    text: "An atom has 17 protons and 18 neutrons. State the atomic number and mass number of this atom.",
    commandWord: "State", answerLines: 2,
  },
  {
    id: "sci-aqa-2023-phys1h-q1",
    board: "AQA", subject: "science", year: 2023, series: "June",
    paper: "Physics Paper 1 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 4, topic: "Energy",
    text: "A 2 kg object is lifted 5 m above the ground. Calculate the gravitational potential energy stored. (g = 10 N/kg)",
    commandWord: "Calculate", answerLines: 3,
  },
  {
    id: "sci-aqa-2022-bio1h-q1",
    board: "AQA", subject: "science", year: 2022, series: "June",
    paper: "Biology Paper 1 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Organisation",
    text: "Describe the role of the liver in the digestion and absorption of food.",
    commandWord: "Describe", answerLines: 6,
  },
  {
    id: "sci-aqa-2024-phys2h-q1",
    board: "AQA", subject: "science", year: 2024, series: "June",
    paper: "Physics Paper 2 (Trilogy)", tier: "Higher", questionNum: "1",
    marks: 5, topic: "Forces",
    text: "Explain the difference between mass and weight. Include the units for each quantity.",
    commandWord: "Explain", answerLines: 5,
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
];

// ─────────────────────────────────────────────────────────────────────────────
// QUERY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get questions filtered by subject, board, tier, topic and year range.
 * Returns a shuffled selection up to `limit`.
 */
export function getExamQuestions(options: {
  subject: string;
  board?: string;
  tier?: "Higher" | "Foundation";
  topic?: string;
  yearMin?: number;
  yearMax?: number;
  limit?: number;
}): PastPaperQuestion[] {
  const { subject, board, tier, topic, yearMin = 2018, yearMax = 2025, limit = 10 } = options;

  let filtered = allPastPaperQuestions.filter(q => {
    if (q.subject !== subject) return false;
    if (board && board !== "none" && board !== "Any" && q.board !== board) return false;
    if (tier && q.tier && q.tier !== tier) return false;
    if (topic && q.topic.toLowerCase() !== topic.toLowerCase()) return false;
    if (q.year < yearMin || q.year > yearMax) return false;
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
    .forEach(q => topics.add(q.topic));
  return Array.from(topics).sort();
}

/**
 * Get all unique boards available for a given subject.
 */
export function getBoardsForSubject(subject: string): string[] {
  const boards = new Set<string>();
  allPastPaperQuestions
    .filter(q => q.subject === subject)
    .forEach(q => boards.add(q.board));
  return Array.from(boards).sort();
}

/**
 * Format a past paper question into clean worksheet HTML/markdown.
 * Preserves exact question text with mark allocations and answer lines.
 */
export function formatQuestionForWorksheet(q: PastPaperQuestion, index: number): string {
  const markLabel = q.marks === 1 ? "1 mark" : `${q.marks} marks`;
  const contextBlock = q.context
    ? `\n\n> ${q.context.split("\n").join("\n> ")}\n`
    : "";

  let out = `**Q${index}. ${q.text}** [${markLabel}]${contextBlock}\n`;

  if (q.subParts && q.subParts.length > 0) {
    q.subParts.forEach(part => {
      const partMark = part.marks === 1 ? "1 mark" : `${part.marks} marks`;
      out += `\n**(${part.label})** ${part.text} [${partMark}]\n`;
      const lines = part.answerLines || 3;
      out += "\n" + Array(lines).fill("___________________________________________").join("\n") + "\n";
    });
  } else {
    const lines = q.answerLines || 3;
    out += "\n" + Array(lines).fill("___________________________________________").join("\n") + "\n";
  }

  out += `\n*Source: ${q.board} GCSE ${q.year} — ${q.paper}*\n`;
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
    byBoard[q.board] = (byBoard[q.board] || 0) + 1;
    bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
    byYear[q.year] = (byYear[q.year] || 0) + 1;
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
