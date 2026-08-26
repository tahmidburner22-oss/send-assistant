export type BaselineSubject = "mathematics" | "english" | "science";

export interface BaselineQuestion {
  id: string;
  subject: BaselineSubject;
  yearGroup: string;
  domain: string;
  kind: "multiple-choice" | "short-answer";
  prompt: string;
  context?: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
  marks: number;
  suggestedSeconds: number;
  curriculumReference: string;
}

const short = (
  subject: BaselineSubject,
  yearGroup: string,
  id: string,
  domain: string,
  prompt: string,
  correctAnswer: string,
  explanation: string,
  marks: number,
  suggestedSeconds: number,
  curriculumReference: string,
  acceptedAnswers: string[] = [],
  context?: string,
): BaselineQuestion => ({ id, subject, yearGroup, domain, kind: "short-answer", prompt, correctAnswer, acceptedAnswers, explanation, marks, suggestedSeconds, curriculumReference, context });

const choice = (
  subject: BaselineSubject,
  yearGroup: string,
  id: string,
  domain: string,
  prompt: string,
  options: string[],
  correctAnswer: string,
  explanation: string,
  marks: number,
  suggestedSeconds: number,
  curriculumReference: string,
  context?: string,
): BaselineQuestion => ({ id, subject, yearGroup, domain, kind: "multiple-choice", prompt, options, correctAnswer, explanation, marks, suggestedSeconds, curriculumReference, context });

/**
 * Original diagnostic questions, intentionally authored rather than copied from
 * examination papers. Each cohort has its own coverage and assessment demand.
 * Item order is deliberate: a 15-minute screen uses the first five items,
 * 30 minutes uses eight, and 60 minutes uses all twelve.
 */
export const BASELINE_BANKS: Record<BaselineSubject, Record<string, BaselineQuestion[]>> = {
  mathematics: {
    "Year 7": [
      short("mathematics", "Year 7", "y7m-place-value", "Number", "Write 4,083 in words.", "four thousand and eighty-three", "The digit 4 represents four thousands; read the number from left to right.", 1, 90, "KS3 number and place value", ["four thousand eighty-three"]),
      short("mathematics", "Year 7", "y7m-integer", "Number", "Calculate: -7 + 12", "5", "Moving 12 steps right from -7 lands on 5.", 1, 90, "KS3 directed number"),
      short("mathematics", "Year 7", "y7m-fraction", "Fractions", "Work out 3/4 of 28.", "21", "Divide 28 by 4, then multiply by 3.", 2, 150, "KS3 fractions"),
      short("mathematics", "Year 7", "y7m-ratio", "Ratio", "Share £36 in the ratio 1:2. Give the larger share.", "24", "There are 3 equal parts, so each part is £12; the larger share is 2 parts.", 2, 180, "KS3 ratio"),
      short("mathematics", "Year 7", "y7m-perimeter", "Geometry", "A rectangle is 9 cm long and 5 cm wide. Calculate its perimeter in cm.", "28", "Add all four sides: 9 + 5 + 9 + 5.", 2, 180, "KS3 perimeter"),
      short("mathematics", "Year 7", "y7m-equation", "Algebra", "Solve: 5x = 35", "7", "Divide both sides by 5.", 1, 120, "KS3 algebraic notation and equations"),
      short("mathematics", "Year 7", "y7m-sequence", "Algebra", "The sequence is 4, 7, 10, 13, ... Write the next two terms, separated by a comma.", "16, 19", "The rule is add 3 each time.", 2, 150, "KS3 sequences", ["16,19"]),
      short("mathematics", "Year 7", "y7m-angle", "Geometry", "Angles on a straight line add to 180°. One angle is 127°. Calculate the other angle.", "53", "Subtract 127 from 180.", 1, 120, "KS3 angle facts", ["53°"]),
      short("mathematics", "Year 7", "y7m-mean", "Statistics", "Find the mean of 5, 7, 8 and 12.", "8", "The total is 32 and there are 4 values.", 2, 180, "KS3 statistics"),
      choice("mathematics", "Year 7", "y7m-probability", "Probability", "A bag contains 3 red, 5 blue and 2 green counters. What is the probability of choosing a green counter?", ["1/5", "2/5", "1/2", "2/10"], "1/5", "There are 2 green counters out of 10 in total; 2/10 simplifies to 1/5.", 2, 180, "KS3 probability"),
      short("mathematics", "Year 7", "y7m-area", "Geometry", "A garden is made from a 6 m by 4 m rectangle. A 1 m by 1 m pond is inside the garden. Calculate the area of grass in m².", "23", "The rectangle has area 24 m². Remove the 1 m² pond.", 2, 210, "KS3 area"),
      short("mathematics", "Year 7", "y7m-data", "Statistics", "The temperatures on four days were 11°C, 14°C, 14°C and 17°C. State the mode.", "14", "The mode is the value that occurs most often.", 1, 120, "KS3 data handling", ["14°c"]),
    ],
    "Year 8": [
      short("mathematics", "Year 8", "y8m-index", "Number", "Calculate 3² + 4².", "25", "3² is 9 and 4² is 16.", 1, 90, "KS3 powers and roots"),
      short("mathematics", "Year 8", "y8m-percentage", "Number", "Increase £80 by 15%.", "92", "15% of 80 is 12, then add it to 80.", 2, 120, "KS3 percentages", ["£92"]),
      short("mathematics", "Year 8", "y8m-fraction-add", "Fractions", "Calculate 2/3 + 1/4. Give your answer as a fraction in its simplest form.", "11/12", "Use a common denominator of 12: 8/12 + 3/12.", 2, 150, "KS3 fraction arithmetic"),
      short("mathematics", "Year 8", "y8m-proportion", "Ratio and proportion", "4 notebooks cost £7.20. Work out the cost of 7 notebooks.", "12.60", "Find the cost of one notebook, then multiply by 7.", 2, 180, "KS3 direct proportion", ["£12.60", "12.6"]),
      short("mathematics", "Year 8", "y8m-expand", "Algebra", "Expand and simplify: 3(x + 4)", "3x + 12", "Multiply both terms inside the bracket by 3.", 2, 180, "KS3 algebraic manipulation", ["3x+12"]),
      short("mathematics", "Year 8", "y8m-equation", "Algebra", "Solve: 3x - 5 = 19", "8", "Add 5, then divide by 3.", 2, 180, "KS3 linear equations"),
      short("mathematics", "Year 8", "y8m-scale", "Geometry", "A map has scale 1:50,000. Two towns are 6 cm apart on the map. Give the real distance in km.", "3", "6 cm represents 300,000 cm, which is 3 km.", 3, 240, "KS3 scale drawings", ["3 km"]),
      short("mathematics", "Year 8", "y8m-interior", "Geometry", "The interior angles of a quadrilateral total 360°. Three angles are 88°, 101° and 76°. Calculate the fourth angle.", "95", "Subtract the three known angles from 360°.", 2, 180, "KS3 polygons", ["95°"]),
      short("mathematics", "Year 8", "y8m-pythagoras", "Geometry", "A right-angled triangle has shorter sides 6 cm and 8 cm. Calculate the hypotenuse.", "10", "6² + 8² = 36 + 64 = 100, so the square root is 10.", 3, 240, "KS3 Pythagoras", ["10 cm"]),
      short("mathematics", "Year 8", "y8m-frequency", "Statistics", "The scores are 2, 3, 3, 4, 5, 5, 5, 6. State the median.", "4.5", "There are 8 values, so find the mean of the fourth and fifth values.", 2, 180, "KS3 averages"),
      short("mathematics", "Year 8", "y8m-probability", "Probability", "A fair spinner has 8 equal sections: 3 yellow, 2 red and 3 blue. Calculate P(not red).", "3/4", "Six of the eight sections are not red, and 6/8 simplifies to 3/4.", 2, 180, "KS3 probability"),
      short("mathematics", "Year 8", "y8m-coordinate", "Geometry", "Point A is (2, -3). It is translated by vector (4, 5). Write the coordinates of A'.", "6, 2", "Add 4 to x and 5 to y.", 2, 180, "KS3 transformations", ["(6, 2)", "(6,2)"]),
    ],
    "Year 9": [
      short("mathematics", "Year 9", "y9m-standard-form", "Number", "Write 0.00056 in standard form.", "5.6 x 10^-4", "Move the decimal 4 places right, so the power is -4.", 2, 120, "GCSE readiness: standard form", ["5.6 × 10^-4", "5.6x10-4", "5.6 x 10-4"]),
      short("mathematics", "Year 9", "y9m-percent-reverse", "Number", "After a 20% discount, a jacket costs £48. Work out its original price.", "60", "£48 is 80% of the original; divide by 0.8.", 3, 180, "GCSE readiness: reverse percentages", ["£60"]),
      short("mathematics", "Year 9", "y9m-surds", "Number", "Simplify √72.", "6√2", "√72 = √(36 × 2) = 6√2.", 2, 180, "GCSE readiness: surds", ["6root2", "6 sqrt 2"]),
      short("mathematics", "Year 9", "y9m-linear-graph", "Algebra", "For y = 3x - 2, calculate y when x = 5.", "13", "Substitute x = 5: 3 × 5 - 2.", 2, 150, "GCSE readiness: linear graphs"),
      short("mathematics", "Year 9", "y9m-factorise", "Algebra", "Factorise fully: 5x + 15.", "5(x + 3)", "The highest common factor is 5.", 2, 150, "GCSE readiness: factorising", ["5(x+3)"]),
      short("mathematics", "Year 9", "y9m-simultaneous", "Algebra", "Solve the simultaneous equations: x + y = 11 and x - y = 3. Give x, y.", "7, 4", "Add the equations to get 2x = 14, then substitute to find y.", 3, 240, "GCSE readiness: simultaneous equations", ["x=7, y=4", "7,4"]),
      short("mathematics", "Year 9", "y9m-circle", "Geometry", "Calculate the circumference of a circle with diameter 10 cm. Give your answer in terms of π.", "10π", "Circumference = πd.", 2, 150, "GCSE readiness: circles", ["10pi", "10 π"]),
      short("mathematics", "Year 9", "y9m-volume", "Geometry", "A cuboid measures 8 cm by 5 cm by 3 cm. Calculate its volume.", "120", "Multiply the three dimensions.", 2, 150, "GCSE readiness: volume", ["120 cm3", "120 cm³"]),
      short("mathematics", "Year 9", "y9m-inequality", "Algebra", "Solve: 4x + 3 < 19", "x < 4", "Subtract 3 then divide by 4; the inequality direction does not change.", 2, 180, "GCSE readiness: inequalities", ["x<4"]),
      short("mathematics", "Year 9", "y9m-histogram", "Statistics", "A class interval 10 < h ≤ 20 has frequency 15. Calculate its frequency density.", "1.5", "Frequency density = frequency ÷ class width = 15 ÷ 10.", 2, 180, "GCSE readiness: histograms"),
      short("mathematics", "Year 9", "y9m-tree", "Probability", "A bag contains 3 black and 2 white counters. One counter is chosen and replaced, then another is chosen. Calculate P(black then white).", "6/25", "With replacement, multiply 3/5 by 2/5.", 3, 210, "GCSE readiness: probability trees"),
      short("mathematics", "Year 9", "y9m-bounds", "Number", "A length is 7.2 cm correct to the nearest 0.1 cm. Write its lower bound.", "7.15", "The lower bound is half a unit of accuracy below 7.2.", 2, 180, "GCSE readiness: bounds"),
    ],
    "Year 10": [
      short("mathematics", "Year 10", "y10m-fractional", "Number", "Calculate 3/5 ÷ 9/10. Give your answer in its simplest form.", "2/3", "Divide by a fraction by multiplying by its reciprocal: 3/5 × 10/9.", 2, 120, "GCSE number"),
      short("mathematics", "Year 10", "y10m-index-laws", "Algebra", "Simplify: x^4 × x^7 ÷ x^3", "x^8", "Add powers when multiplying and subtract when dividing.", 2, 150, "GCSE algebra: indices", ["x8"]),
      short("mathematics", "Year 10", "y10m-quadratic", "Algebra", "Solve x² - 5x + 6 = 0.", "2, 3", "Factorise to (x - 2)(x - 3) = 0.", 3, 180, "GCSE algebra: quadratics", ["x=2, x=3", "2,3"]),
      short("mathematics", "Year 10", "y10m-iteration", "Algebra", "The nth term of a sequence is 4n - 1. Calculate the 20th term.", "79", "Substitute n = 20.", 2, 150, "GCSE algebra: sequences"),
      short("mathematics", "Year 10", "y10m-trigonometry", "Geometry", "In a right-angled triangle, the side opposite θ is 6 cm and the hypotenuse is 10 cm. Calculate sin θ.", "0.6", "sin θ = opposite ÷ hypotenuse.", 2, 180, "GCSE geometry: trigonometry"),
      short("mathematics", "Year 10", "y10m-similarity", "Geometry", "Two similar shapes have scale factor 3 from A to B. The area of A is 12 cm². Calculate the area of B.", "108", "Area scale factor is 3² = 9; 12 × 9.", 3, 240, "GCSE geometry: similarity", ["108 cm2", "108 cm²"]),
      short("mathematics", "Year 10", "y10m-vector", "Geometry", "a = (2, 1) and b = (-1, 3). Work out 2a + b.", "3, 5", "2a is (4, 2); then add b.", 2, 180, "GCSE geometry: vectors", ["(3, 5)", "(3,5)"]),
      short("mathematics", "Year 10", "y10m-conditional", "Probability", "P(A) = 0.4, P(B) = 0.5 and P(A and B) = 0.2. Calculate P(A or B).", "0.7", "Add P(A) and P(B), then subtract the overlap.", 3, 240, "GCSE probability"),
      short("mathematics", "Year 10", "y10m-boxplot", "Statistics", "The lower quartile is 12 and upper quartile is 27. Calculate the interquartile range.", "15", "IQR = upper quartile - lower quartile.", 1, 90, "GCSE statistics"),
      short("mathematics", "Year 10", "y10m-gradient", "Algebra", "Find the gradient of the line through (2, 3) and (6, 11).", "2", "Gradient = change in y ÷ change in x = 8 ÷ 4.", 2, 180, "GCSE coordinate geometry"),
      short("mathematics", "Year 10", "y10m-compound", "Number", "£500 is invested at 4% compound interest for 2 years. Calculate the final amount.", "540.80", "Calculate 500 × 1.04².", 3, 240, "GCSE number: compound measures", ["£540.80", "540.8"]),
      short("mathematics", "Year 10", "y10m-exchange", "Number", "The exchange rate is £1 = €1.18. Convert £75 to euros.", "88.50", "Multiply pounds by 1.18.", 2, 150, "GCSE number: exchange rates", ["€88.50", "88.5"]),
    ],
    "Year 11": [
      short("mathematics", "Year 11", "y11m-standard-form", "Number", "Calculate (6 × 10^5) ÷ (3 × 10^2). Give your answer in standard form.", "2 x 10^3", "Divide coefficients and subtract powers: 6 ÷ 3 and 10^(5-2).", 2, 120, "GCSE number: standard form", ["2 × 10^3", "2x10^3"]),
      short("mathematics", "Year 11", "y11m-reverse-percent", "Number", "A price after a 15% increase is £92. Work out the original price.", "80", "£92 is 115% of the original, so divide by 1.15.", 3, 180, "GCSE number: reverse percentages", ["£80"]),
      short("mathematics", "Year 11", "y11m-completing-square", "Algebra", "Write x² + 6x + 1 in the form (x + a)² + b.", "(x + 3)^2 - 8", "Half the coefficient of x is 3; (x + 3)² gives x² + 6x + 9, so subtract 8.", 3, 210, "GCSE algebra: completing the square", ["(x+3)^2-8"]),
      short("mathematics", "Year 11", "y11m-simultaneous-nonlinear", "Algebra", "Solve y = x + 1 and y = x² - 5. Give the x-values.", "-2, 3", "Set x + 1 = x² - 5, then solve x² - x - 6 = 0.", 3, 240, "GCSE algebra: simultaneous equations", ["-2,3"]),
      short("mathematics", "Year 11", "y11m-sine-rule", "Geometry", "In triangle ABC, a = 8 cm, A = 30° and B = 45°. Calculate b to 1 decimal place.", "11.3", "Use b/sin B = a/sin A, so b = 8sin45°/sin30°.", 3, 240, "GCSE geometry: sine rule", ["11.3 cm"]),
      short("mathematics", "Year 11", "y11m-cosine-rule", "Geometry", "Two sides of a triangle are 7 cm and 9 cm with included angle 60°. Calculate the third side.", "7.81", "Use c² = a² + b² - 2ab cos C, then square root. 7.81 is acceptable to 2 d.p.", 4, 300, "GCSE geometry: cosine rule", ["7.8", "7.81 cm"]),
      short("mathematics", "Year 11", "y11m-circle-theorem", "Geometry", "An angle at the centre of a circle is 124°. Calculate the angle at the circumference standing on the same arc.", "62", "The angle at the centre is twice the angle at the circumference.", 2, 150, "GCSE geometry: circle theorems", ["62°"]),
      short("mathematics", "Year 11", "y11m-functions", "Algebra", "f(x) = 3x - 4. Calculate f^-1(11).", "5", "Set 3x - 4 = 11 and solve for x.", 2, 180, "GCSE algebra: functions"),
      short("mathematics", "Year 11", "y11m-histogram", "Statistics", "A class interval 20 < t ≤ 35 has frequency density 1.6. Calculate its frequency.", "24", "Frequency = density × class width = 1.6 × 15.", 2, 180, "GCSE statistics: histograms"),
      short("mathematics", "Year 11", "y11m-cumulative", "Statistics", "The median of 80 values is estimated from a cumulative frequency graph. State which cumulative frequency is used.", "40", "The median is the middle value, so use half of 80.", 1, 90, "GCSE statistics: cumulative frequency"),
      short("mathematics", "Year 11", "y11m-conditional", "Probability", "P(A) = 0.6 and P(B|A) = 0.4. Calculate P(A and B).", "0.24", "P(A and B) = P(A) × P(B|A).", 2, 180, "GCSE probability: conditional probability"),
      short("mathematics", "Year 11", "y11m-growth", "Number", "A population starts at 12,000 and grows by 2.5% each year. Calculate the population after 3 years, to the nearest whole number.", "12923", "Calculate 12000 × 1.025³ then round.", 3, 240, "GCSE number: compound growth"),
    ],
  },
  english: {
    "Year 7": [
      choice("english", "Year 7", "y7e-word", "Vocabulary", "Choose the closest meaning of 'reluctant'.", ["unwilling", "dangerous", "cheerful", "noisy"], "unwilling", "Reluctant means not willing or hesitant.", 1, 90, "KS3 vocabulary"),
      short("english", "Year 7", "y7e-punctuation", "Grammar and punctuation", "Add the missing punctuation: when did you arrive asked Sam", "When did you arrive? asked Sam.", "A direct question needs a capital letter and question mark.", 2, 120, "KS3 punctuation", ["When did you arrive? Asked Sam."]),
      choice("english", "Year 7", "y7e-wordclass", "Grammar and punctuation", "In the sentence 'The swift fox crossed the field', which word is an adjective?", ["swift", "fox", "crossed", "the"], "swift", "An adjective describes a noun.", 1, 90, "KS3 word classes"),
      short("english", "Year 7", "y7e-inference", "Reading", "What does the phrase 'Mina gripped the rail as thunder rolled' suggest about Mina?", "She is frightened", "The verb 'gripped' and the thunder create a tense atmosphere; an inference needs evidence from the words.", 2, 150, "KS3 reading inference", ["frightened", "scared", "nervous"]),
      short("english", "Year 7", "y7e-device", "Reading", "Name the language device in 'The rain tapped impatiently on the window.'", "personification", "Rain is given a human action: tapping impatiently.", 1, 120, "KS3 language analysis"),
      short("english", "Year 7", "y7e-sentence", "Writing craft", "Write a compound sentence using 'because' to explain why a character stayed indoors.", "because", "A valid response should join two complete ideas with the requested conjunction.", 2, 180, "KS3 sentence construction", ["because"]),
      choice("english", "Year 7", "y7e-apostrophe", "Grammar and punctuation", "Which sentence uses an apostrophe correctly?", ["The dog's collar was red.", "The dogs' collar was red.", "The dog's' collar was red.", "The dogs collar was red."], "The dog's collar was red.", "One dog owns the collar, so use dog's.", 1, 120, "KS3 apostrophes"),
      short("english", "Year 7", "y7e-structure", "Reading", "A writer begins with a quiet setting and ends a paragraph with 'the door slammed'. What effect does this ending create?", "tension", "The sudden change creates surprise and tension.", 2, 180, "KS3 structural analysis", ["suspense", "shock"]),
      choice("english", "Year 7", "y7e-spelling", "Spelling", "Choose the correctly spelled word.", ["separate", "seperate", "seperete", "separrate"], "separate", "Separate has 'a' in the second syllable.", 1, 90, "KS3 spelling"),
      short("english", "Year 7", "y7e-summary", "Reading", "Give one word that sums up the mood in: 'The empty corridor echoed with each careful step.'", "eerie", "A precise mood word must match the empty, echoing setting.", 1, 120, "KS3 summarising", ["tense", "scary", "frightening"]),
      short("english", "Year 7", "y7e-dialogue", "Writing craft", "Write the correct opening punctuation for this speech: ___ I cannot see the path, said Aisha.", "\"", "Direct speech opens with an inverted comma before the spoken words.", 1, 120, "KS3 direct speech", ["“"]),
      short("english", "Year 7", "y7e-compare", "Reading", "Text A calls a storm 'wild'. Text B calls it 'gentle'. State the difference in one phrase.", "Text A presents the storm as dangerous while Text B presents it as calm", "Comparison requires both texts and contrasting ideas.", 2, 180, "KS3 comparison", ["A is dangerous and B is calm"]),
    ],
    "Year 8": [
      choice("english", "Year 8", "y8e-connotation", "Vocabulary", "Which word has the most negative connotations?", ["slender", "scrawny", "tall", "thin"], "scrawny", "Scrawny suggests an unhealthy or unattractive thinness.", 1, 90, "KS3 connotations"),
      short("english", "Year 8", "y8e-semicolon", "Grammar and punctuation", "Choose the correct punctuation: The path was steep ___ we continued climbing.", ";", "A semicolon can join two closely related independent clauses.", 1, 120, "KS3 sentence punctuation", ["semicolon"]),
      short("english", "Year 8", "y8e-inference", "Reading", "The writer describes a character 'checking the clock for the fifth time'. What does this imply?", "The character is anxious or impatient", "Repeated clock-checking suggests concern about time.", 2, 150, "KS3 inference", ["anxious", "impatient", "worried"]),
      short("english", "Year 8", "y8e-language", "Reading", "Explain the effect of the metaphor 'the city was a maze of glass'.", "It suggests the city is confusing and full of glass buildings", "A full explanation identifies the idea and links it to the image.", 2, 180, "KS3 language analysis", ["confusing"]),
      short("english", "Year 8", "y8e-verb", "Grammar and punctuation", "Write the past tense of 'to freeze'.", "froze", "Freeze is an irregular verb.", 1, 90, "KS3 verb forms"),
      short("english", "Year 8", "y8e-structure", "Reading", "A paragraph moves from a wide view of a town to a close-up of one cracked window. What is the structural shift?", "from wide to close focus", "Name the movement in focus, not merely the objects described.", 2, 180, "KS3 structural analysis", ["wide to close", "zoom in"]),
      choice("english", "Year 8", "y8e-register", "Writing craft", "Which opening is most suitable for a formal letter to a headteacher?", ["Dear Headteacher, I am writing to raise a concern about the school library.", "Hi, the library is rubbish.", "Hey! Sort out the books.", "Yo, I need more books."], "Dear Headteacher, I am writing to raise a concern about the school library.", "Formal register is polite, precise and purposeful.", 2, 150, "KS3 writing for audience"),
      short("english", "Year 8", "y8e-embedded", "Grammar and punctuation", "Add commas around the embedded clause: The bicycle which had a bent wheel was left outside.", "The bicycle, which had a bent wheel, was left outside.", "The extra information is enclosed by commas.", 2, 180, "KS3 clause punctuation"),
      short("english", "Year 8", "y8e-compare", "Reading", "Text A uses 'marched' and Text B uses 'wandered'. Compare how the verbs present movement.", "Text A is purposeful while Text B is aimless", "Comparison needs a point about each selected verb.", 2, 180, "KS3 comparison", ["A purposeful B aimless"]),
      short("english", "Year 8", "y8e-spelling", "Spelling", "Choose the correct spelling: ___ is a useful skill for solving problems.", "perseverance", "Perseverance is the correct noun spelling.", 1, 90, "KS3 spelling"),
      short("english", "Year 8", "y8e-summary", "Reading", "Summarise in one phrase: 'The abandoned boat rocked slowly, its sail torn and its deck covered in salt.'", "The boat is damaged and abandoned", "Select the two key ideas rather than copying every detail.", 2, 180, "KS3 summarising", ["damaged abandoned boat"]),
      short("english", "Year 8", "y8e-craft", "Writing craft", "Write a sentence beginning with an adverbial to create a tense setting.", "adverbial", "A successful response begins with a time, place or manner adverbial and creates tension.", 2, 180, "KS3 descriptive writing", ["adverbial"]),
    ],
    "Year 9": [
      choice("english", "Year 9", "y9e-method", "Language analysis", "Which method is used in 'The wind clawed at the roof'?", ["personification", "simile", "rule of three", "rhetorical question"], "personification", "The wind is given the animal or human action 'clawed'.", 1, 90, "KS3 to GCSE language analysis"),
      short("english", "Year 9", "y9e-quotation", "Reading", "Select one word from 'a fragile thread of hope remained' that suggests hope may not last.", "fragile", "A precise quotation can be a single word.", 1, 90, "KS3 evidence selection"),
      short("english", "Year 9", "y9e-analysis", "Language analysis", "Explain how 'a fragile thread of hope' presents hope.", "It presents hope as weak and easily broken", "Name the method or word, explain its meaning, then link to the idea.", 2, 180, "KS3 analytical writing", ["weak", "easily broken"]),
      short("english", "Year 9", "y9e-structure", "Structure", "A writer withholds the identity of a caller until the final line. Why might they do this?", "to create suspense", "Delayed information controls the reader's response.", 2, 150, "KS3 to GCSE structural analysis", ["suspense", "tension"]),
      short("english", "Year 9", "y9e-viewpoint", "Writing craft", "Give one feature of a persuasive speech that would engage an audience.", "rhetorical question", "A valid feature is paired with an awareness of audience impact.", 1, 120, "KS3 persuasive writing", ["rule of three", "direct address", "emotive language"]),
      short("english", "Year 9", "y9e-accurate", "Grammar and punctuation", "Rewrite accurately: despite the rain we kept walking however we arrived late", "Despite the rain, we kept walking; however, we arrived late.", "Use commas after the opening phrase and around the connective; a semicolon links the clauses.", 3, 240, "KS3 sentence control", ["Despite the rain, we kept walking; however, we arrived late."]),
      choice("english", "Year 9", "y9e-register", "Writing craft", "Which phrase is most appropriate for a formal complaint?", ["I would be grateful if this issue could be reviewed.", "You need to fix this now.", "This is totally unfair!", "Sort it out, please."], "I would be grateful if this issue could be reviewed.", "Formal complaint writing uses measured, courteous language.", 1, 120, "KS3 formality"),
      short("english", "Year 9", "y9e-compare", "Comparison", "Text A calls a crowd 'a sea of faces'; Text B calls it 'a wall of bodies'. State one difference in the images.", "Text A suggests fluid movement while Text B suggests obstruction", "Compare the implied ideas, not just the different nouns.", 2, 180, "KS3 comparison", ["A fluid B obstructive"]),
      short("english", "Year 9", "y9e-terminal", "Grammar and punctuation", "Name the sentence type: 'What a remarkable discovery this is!'.", "exclamatory", "It expresses strong feeling and ends with an exclamation mark.", 1, 90, "KS3 sentence types"),
      short("english", "Year 9", "y9e-vocab", "Vocabulary", "Give a synonym for 'reluctant' that fits a formal analysis sentence.", "hesitant", "Hesitant is a precise academic synonym.", 1, 120, "KS3 academic vocabulary", ["unwilling"]),
      short("english", "Year 9", "y9e-evaluate", "Evaluation", "A review states that a documentary is 'informative but occasionally slow'. Give the balanced judgement in one phrase.", "informative but slow", "Evaluation recognises both a strength and limitation.", 2, 180, "KS3 evaluation", ["good information but slow"]),
      short("english", "Year 9", "y9e-paragraph", "Writing craft", "Name the paragraph structure Point, Evidence, Explain, Link.", "PEEL", "PEEL gives a clear structure for analytical paragraphs.", 1, 90, "KS3 analytical writing"),
    ],
    "Year 10": [
      choice("english", "Year 10", "y10e-language", "Language analysis", "In 'the street swallowed the last light', which method is most prominent?", ["personification", "alliteration", "oxymoron", "hyperbole"], "personification", "The street is given the human action of swallowing.", 1, 90, "GCSE English Language AO2"),
      short("english", "Year 10", "y10e-wordeffect", "Language analysis", "Explain one effect of the verb 'swallowed' in 'the street swallowed the last light'.", "It suggests darkness takes over completely", "A strong response zooms in on the verb and explains its connotations.", 2, 180, "GCSE English Language AO2", ["darkness takes over"]),
      short("english", "Year 10", "y10e-inference", "Reading", "A character keeps their coat on indoors and avoids eye contact. Give one inference.", "The character is uncomfortable or wants to leave", "Inference must arise from the details, not an unsupported story.", 2, 150, "GCSE English Language AO1", ["uncomfortable", "wants to leave"]),
      short("english", "Year 10", "y10e-structure", "Structure", "A writer begins a text with an empty house and then introduces a single lit room. What does the narrowed focus do?", "It draws attention to the lit room and creates intrigue", "Structural comments track where focus moves and why.", 2, 180, "GCSE English Language AO2", ["creates intrigue", "focuses reader"]),
      short("english", "Year 10", "y10e-compare", "Comparison", "Text A presents a train as 'gliding'; Text B presents it as 'thundering'. Compare the writers' attitudes.", "Text A is calm while Text B is powerful or threatening", "Both attitudes need to be made clear.", 2, 180, "GCSE English Language AO3", ["A calm B powerful"]),
      choice("english", "Year 10", "y10e-register", "Writing craft", "Which phrase uses the most effective formal register for a speech to governors?", ["Our proposal offers a practical and affordable improvement.", "Our idea is pretty good.", "You guys should do this.", "This is awesome."], "Our proposal offers a practical and affordable improvement.", "Formal persuasive writing uses deliberate vocabulary and a clear purpose.", 1, 120, "GCSE English Language AO5"),
      short("english", "Year 10", "y10e-punctuation", "Technical accuracy", "Add the missing punctuation: The committee agreed that the plan was risky nevertheless it approved it", "The committee agreed that the plan was risky; nevertheless, it approved it.", "A semicolon joins the clauses and a comma follows the connective.", 3, 240, "GCSE English Language AO6", ["The committee agreed that the plan was risky; nevertheless, it approved it."]),
      short("english", "Year 10", "y10e-literature", "Literature", "Name one way a writer can show a character has power in a drama extract.", "through stage directions", "A valid response identifies a dramatic method.", 1, 120, "GCSE English Literature methods", ["dialogue", "imperatives", "lighting"]),
      short("english", "Year 10", "y10e-context", "Literature", "In literature analysis, what does 'context' mean?", "the social and historical circumstances around a text", "Context is relevant background that helps explain a writer's choices.", 1, 120, "GCSE English Literature AO3", ["social historical background"]),
      short("english", "Year 10", "y10e-evaluate", "Evaluation", "State one reason why a first-person narrator might be unreliable.", "They may be biased", "First-person narrators show one limited viewpoint.", 2, 180, "GCSE English Language evaluation", ["biased", "limited viewpoint"]),
      short("english", "Year 10", "y10e-vocab", "Vocabulary", "Choose an analytical verb to complete: 'The writer ___ the reader to question the decision.'", "encourages", "An analytical verb states the writer's effect deliberately.", 1, 90, "GCSE analytical vocabulary", ["invites", "persuades"]),
      short("english", "Year 10", "y10e-transactional", "Writing craft", "Give one structural feature suitable for an article aimed at teenagers.", "subheading", "A valid feature helps organise material for the intended audience.", 1, 120, "GCSE English Language AO5", ["headline", "paragraph", "image"]),
    ],
    "Year 11": [
      choice("english", "Year 11", "y11e-ao2", "Language analysis", "Which is the strongest AO2 opening?", ["The verb 'clawed' suggests the wind is violent and predatory.", "The writer uses a verb.", "This is good language.", "It makes the reader read on."], "The verb 'clawed' suggests the wind is violent and predatory.", "A strong analysis names a method, selects evidence and explains a precise effect.", 2, 120, "GCSE English Language AO2"),
      short("english", "Year 11", "y11e-synthesis", "Comparison", "Text A describes a beach as 'silent'; Text B describes it as 'buzzing'. What is the key difference?", "Text A presents the beach as quiet while Text B presents it as busy", "Synthesis compares viewpoints clearly and directly.", 2, 150, "GCSE English Language AO3", ["A quiet B busy"]),
      short("english", "Year 11", "y11e-evaluation", "Evaluation", "A reviewer claims, 'The writer makes the setting feel hostile.' Give one detail that would support this claim.", "a threatening description", "Select relevant textual evidence that supports the stated judgement.", 2, 180, "GCSE English Language AO4", ["hostile word", "negative description"]),
      short("english", "Year 11", "y11e-rhetoric", "Writing craft", "Name the technique in 'How much longer can we ignore this problem?'.", "rhetorical question", "The question is asked for effect rather than an answer.", 1, 90, "GCSE English Language AO5"),
      short("english", "Year 11", "y11e-sentence", "Technical accuracy", "Correct this sentence: its clear the schools plans need revising", "It's clear the school's plans need revising.", "Use it's for 'it is' and school's for singular possession.", 3, 210, "GCSE English Language AO6", ["It's clear the school's plans need revising."]),
      short("english", "Year 11", "y11e-literature-method", "Literature", "Give one reason a playwright may use dramatic irony.", "to create tension because the audience knows more than a character", "Dramatic irony depends on the audience having information that a character lacks.", 2, 180, "GCSE English Literature methods", ["create tension"]),
      short("english", "Year 11", "y11e-theme", "Literature", "What is a theme in a literary text?", "a central idea explored in a text", "A theme is a recurring idea, such as power, conflict or identity.", 1, 90, "GCSE English Literature AO1", ["central idea"]),
      short("english", "Year 11", "y11e-context", "Literature", "Explain why contextual points should be linked to the writer's methods rather than added separately.", "because context should support analysis of the text", "Relevant context illuminates a specific choice or idea in the text.", 2, 180, "GCSE English Literature AO3", ["support analysis"]),
      short("english", "Year 11", "y11e-structure", "Structure", "A text ends by returning to the image used in its opening. Name this structural method.", "cyclical structure", "Returning to an opening image creates a circular or cyclical structure.", 1, 120, "GCSE English Language AO2", ["circular structure"]),
      short("english", "Year 11", "y11e-form", "Writing craft", "Name one feature of an effective formal letter conclusion.", "a clear call to action", "Conclusions should restate purpose and make a clear requested next step.", 1, 120, "GCSE English Language AO5", ["sign off", "summary"]),
      short("english", "Year 11", "y11e-vocab", "Vocabulary", "Give a synonym for 'angry' that is suitable for analytical writing.", "indignant", "Indignant is a precise formal alternative where justified by the text.", 1, 120, "GCSE analytical vocabulary", ["furious", "outraged"]),
      short("english", "Year 11", "y11e-judgement", "Evaluation", "Complete: 'The writer's use of short sentences is effective because ...'", "it creates tension", "An evaluative point must name an effect and be supportable by the method.", 2, 180, "GCSE English Language AO4", ["creates tension", "adds emphasis"]),
    ],
  },
  science: {
    "Year 7": [
      choice("science", "Year 7", "y7s-cell", "Biology", "Which structure controls the activities of a cell?", ["nucleus", "cell membrane", "cytoplasm", "cell wall"], "nucleus", "The nucleus contains genetic material and controls cell activities.", 1, 90, "KS3 biology: cells"),
      short("science", "Year 7", "y7s-ecosystem", "Biology", "Name the role of an organism that makes its own food using light.", "producer", "Plants are producers because they make food by photosynthesis.", 1, 90, "KS3 biology: ecosystems"),
      choice("science", "Year 7", "y7s-particle", "Chemistry", "Which state has particles close together that can move past one another?", ["liquid", "solid", "gas", "plasma"], "liquid", "Liquid particles remain close but are not fixed in place.", 1, 120, "KS3 chemistry: particle model"),
      short("science", "Year 7", "y7s-separation", "Chemistry", "Name the method used to separate sand from water.", "filtration", "The sand is insoluble and is trapped by filter paper.", 1, 120, "KS3 chemistry: separation", ["filtering"]),
      short("science", "Year 7", "y7s-force", "Physics", "A box is pushed with 20 N to the right and 12 N to the left. Calculate the resultant force, including direction.", "8 N to the right", "Subtract opposing forces; the greater force determines direction.", 2, 180, "KS3 physics: forces", ["8n right", "8 N right"]),
      short("science", "Year 7", "y7s-circuit", "Physics", "What must be true for a bulb to light in a simple circuit?", "the circuit must be complete", "Electric current only flows through a closed, complete circuit.", 1, 120, "KS3 physics: electricity", ["complete circuit", "closed circuit"]),
      short("science", "Year 7", "y7s-variable", "Working scientifically", "In an investigation of how temperature affects dissolving, name the variable that is changed.", "temperature", "The independent variable is the factor deliberately changed.", 1, 150, "KS3 working scientifically"),
      short("science", "Year 7", "y7s-table", "Working scientifically", "A result is 4.6 cm. State the best unit for recording the length of a paper clip.", "cm", "Centimetres are appropriate for the length of a paper clip.", 1, 90, "KS3 measurement", ["centimetres"]),
      short("science", "Year 7", "y7s-plant", "Biology", "Write the word equation for photosynthesis.", "carbon dioxide + water -> glucose + oxygen", "Award one mark for each correct substance: carbon dioxide, water, glucose and oxygen. Plants use light energy to convert carbon dioxide and water into glucose and oxygen.", 4, 240, "KS3 biology: photosynthesis", ["carbon dioxide + water = glucose + oxygen"]),
      short("science", "Year 7", "y7s-change", "Chemistry", "Is melting ice a chemical or physical change?", "physical", "No new substance is formed and the change can be reversed.", 1, 120, "KS3 chemistry: changes"),
      short("science", "Year 7", "y7s-energy", "Physics", "Name the energy store of a moving bicycle.", "kinetic", "Moving objects have energy in the kinetic store.", 1, 90, "KS3 physics: energy"),
      short("science", "Year 7", "y7s-risk", "Working scientifically", "State one safety precaution when heating a test tube.", "wear safety goggles", "Goggles protect eyes from splashes or broken glass.", 1, 150, "KS3 laboratory safety", ["goggles"]),
    ],
    "Year 8": [
      short("science", "Year 8", "y8s-diffusion", "Biology", "Name the process by which particles spread from an area of high concentration to low concentration.", "diffusion", "Diffusion is net movement down a concentration gradient.", 1, 90, "KS3 biology: organisation"),
      short("science", "Year 8", "y8s-respiration", "Biology", "Write the word equation for aerobic respiration.", "glucose + oxygen -> carbon dioxide + water", "Aerobic respiration releases energy from glucose using oxygen.", 2, 150, "KS3 biology: respiration", ["glucose + oxygen = carbon dioxide + water"]),
      choice("science", "Year 8", "y8s-element", "Chemistry", "Which statement describes an element?", ["A substance made from one type of atom", "Two substances mixed together", "A substance with two compounds", "A material that can be filtered"], "A substance made from one type of atom", "An element contains only one type of atom.", 1, 120, "KS3 chemistry: elements"),
      short("science", "Year 8", "y8s-acid", "Chemistry", "What colour does universal indicator turn in a strong acid?", "red", "Strong acids have low pH and turn universal indicator red.", 1, 90, "KS3 chemistry: acids and alkalis"),
      short("science", "Year 8", "y8s-density", "Physics", "A block has mass 54 g and volume 18 cm³. Calculate its density.", "3", "Density = mass ÷ volume = 54 ÷ 18.", 2, 180, "KS3 physics: density", ["3 g/cm3", "3 g/cm³"]),
      short("science", "Year 8", "y8s-pressure", "Physics", "Explain why a sharp knife cuts more easily than a blunt knife.", "It has a smaller area so produces greater pressure", "Pressure is force divided by area; smaller area gives greater pressure for the same force.", 2, 180, "KS3 physics: pressure", ["smaller area greater pressure"]),
      short("science", "Year 8", "y8s-variables", "Working scientifically", "In a test of insulation materials, what should be measured to find out which material is best?", "temperature change", "The dependent variable should show how much heat is lost.", 1, 150, "KS3 working scientifically", ["change in temperature"]),
      short("science", "Year 8", "y8s-graph", "Working scientifically", "Which graph is normally best for continuous temperature data over time?", "line graph", "Continuous variables are usually shown with a line graph.", 1, 90, "KS3 data presentation"),
      short("science", "Year 8", "y8s-adaptation", "Biology", "State one adaptation of a cactus that reduces water loss.", "spines", "Spines have a small surface area; a waxy cuticle is another accepted adaptation.", 1, 150, "KS3 biology: adaptations", ["waxy cuticle", "small leaves"]),
      short("science", "Year 8", "y8s-atom", "Chemistry", "Name the particle in an atom with a negative charge.", "electron", "Electrons have negative charge and move around the nucleus.", 1, 90, "KS3 chemistry: atomic structure"),
      short("science", "Year 8", "y8s-speed", "Physics", "A runner travels 100 m in 20 s. Calculate speed in m/s.", "5", "Speed = distance ÷ time = 100 ÷ 20.", 2, 180, "KS3 physics: motion", ["5 m/s"]),
      short("science", "Year 8", "y8s-evaluate", "Working scientifically", "Why should a scientist repeat measurements?", "to identify anomalies and improve reliability", "Repeats reveal variation and make a mean more reliable.", 2, 180, "KS3 working scientifically", ["improve reliability", "identify anomalies"]),
    ],
    "Year 9": [
      short("science", "Year 9", "y9s-enzyme", "Biology", "What happens to the rate of an enzyme-controlled reaction above the optimum temperature?", "it decreases", "High temperature can denature the enzyme so fewer reactions occur.", 2, 120, "GCSE readiness: enzymes", ["decreases", "slows"]),
      short("science", "Year 9", "y9s-dna", "Biology", "Where in a cell is most DNA found?", "nucleus", "Most genetic material is contained in the nucleus.", 1, 90, "GCSE readiness: cell biology"),
      short("science", "Year 9", "y9s-formula", "Chemistry", "Write the chemical formula for magnesium oxide.", "MgO", "Magnesium ions and oxide ions combine in a 1:1 ratio.", 1, 120, "GCSE readiness: chemical formulae", ["mgo"]),
      short("science", "Year 9", "y9s-conservation", "Chemistry", "A reaction happens in a sealed flask. Explain why total mass stays the same.", "No atoms are created or destroyed", "Atoms are rearranged in chemical reactions; in a sealed system none leave.", 2, 180, "GCSE readiness: conservation of mass", ["atoms are not created or destroyed"]),
      short("science", "Year 9", "y9s-energy", "Physics", "Calculate the energy transferred when a 40 W lamp is on for 30 s.", "1200", "Energy = power × time = 40 × 30.", 2, 180, "GCSE readiness: energy", ["1200 J", "1200j"]),
      short("science", "Year 9", "y9s-wave", "Physics", "State the unit used to measure frequency.", "hertz", "Frequency is measured in hertz (Hz).", 1, 90, "GCSE readiness: waves", ["Hz", "hz"]),
      short("science", "Year 9", "y9s-independent", "Working scientifically", "A student changes wire length and measures resistance. State the independent variable.", "wire length", "The independent variable is the one deliberately changed.", 1, 150, "GCSE readiness: practical skills"),
      short("science", "Year 9", "y9s-anomaly", "Working scientifically", "Results are 12, 13, 12 and 28 cm. Which is likely an anomaly?", "28", "28 is far from the cluster of other results.", 1, 120, "GCSE readiness: data analysis", ["28 cm"]),
      short("science", "Year 9", "y9s-ecosystem", "Biology", "Explain why biodiversity can make an ecosystem more stable.", "More species means food webs are less affected if one species changes", "A diversity of organisms creates alternative links in food webs.", 2, 210, "GCSE readiness: ecology", ["more species makes ecosystem stable"]),
      short("science", "Year 9", "y9s-ph", "Chemistry", "A solution has pH 3. Is it acidic, neutral or alkaline?", "acidic", "Values below pH 7 are acidic.", 1, 90, "GCSE readiness: acids"),
      short("science", "Year 9", "y9s-newton", "Physics", "A 6 N force acts on a 2 kg object. Calculate acceleration.", "3", "Use F = ma, so a = F ÷ m.", 2, 180, "GCSE readiness: forces", ["3 m/s2", "3 m/s²"]),
      short("science", "Year 9", "y9s-risk", "Working scientifically", "State why a risk assessment is carried out before a practical.", "to identify hazards and control risks", "Risk assessment identifies what could cause harm and how to reduce it.", 2, 180, "GCSE readiness: practical skills", ["identify hazards"]),
    ],
    "Year 10": [
      short("science", "Year 10", "y10s-osmosis", "Biology", "Define osmosis.", "net movement of water molecules through a partially permeable membrane from dilute to concentrated solution", "A full definition needs water, partially permeable membrane and direction of movement.", 3, 150, "GCSE Biology: cell transport", ["water moves through a partially permeable membrane from dilute to concentrated"]),
      short("science", "Year 10", "y10s-infection", "Biology", "Name the type of microorganism that causes measles.", "virus", "Measles is caused by a virus.", 1, 90, "GCSE Biology: infection"),
      short("science", "Year 10", "y10s-moles", "Chemistry", "Calculate the relative formula mass of CO₂. (C = 12, O = 16)", "44", "12 + (2 × 16) = 44.", 2, 120, "GCSE Chemistry: quantitative chemistry", ["44 g/mol"]),
      short("science", "Year 10", "y10s-bonding", "Chemistry", "Explain why ionic compounds conduct electricity when molten.", "Their ions are free to move", "Molten ionic compounds have mobile charged particles.", 2, 180, "GCSE Chemistry: bonding", ["ions can move"]),
      short("science", "Year 10", "y10s-kinetic", "Physics", "Calculate kinetic energy of a 2 kg object moving at 6 m/s. Use KE = 0.5mv².", "36", "0.5 × 2 × 6² = 36 J.", 2, 180, "GCSE Physics: energy", ["36 J", "36j"]),
      short("science", "Year 10", "y10s-circuit", "Physics", "A current of 0.5 A flows through a 12 Ω resistor. Calculate potential difference.", "6", "V = IR = 0.5 × 12.", 2, 180, "GCSE Physics: electricity", ["6 V", "6v"]),
      short("science", "Year 10", "y10s-required", "Working scientifically", "Why is a control variable kept the same in an investigation?", "to make it a fair test", "Keeping other variables constant means differences can be attributed to the independent variable.", 2, 180, "GCSE practical skills", ["fair test"]),
      short("science", "Year 10", "y10s-graph", "Working scientifically", "A line of best fit slopes down from left to right. Describe the correlation.", "negative correlation", "As one variable increases, the other tends to decrease.", 1, 90, "GCSE data analysis"),
      short("science", "Year 10", "y10s-homeostasis", "Biology", "Name the organ that detects changes in blood glucose concentration and releases insulin.", "pancreas", "The pancreas detects blood glucose changes and produces insulin.", 1, 120, "GCSE Biology: homeostasis"),
      short("science", "Year 10", "y10s-electrolysis", "Chemistry", "What is oxidation at the positive electrode in electrolysis?", "loss of electrons", "Oxidation is loss of electrons; reduction is gain.", 1, 120, "GCSE Chemistry: electrolysis", ["loses electrons"]),
      short("science", "Year 10", "y10s-radioactivity", "Physics", "State one property of alpha radiation.", "it is stopped by paper", "Alpha particles are strongly ionising but have low penetration.", 1, 120, "GCSE Physics: atomic structure", ["stopped by paper", "positive charge"]),
      short("science", "Year 10", "y10s-evaluate", "Working scientifically", "A result is inconsistent with three repeated results. State one action a scientist should take.", "repeat the measurement", "Repeating can check whether an anomaly was caused by error.", 1, 150, "GCSE practical skills", ["repeat"]),
    ],
    "Year 11": [
      short("science", "Year 11", "y11s-inheritance", "Biology", "Define a dominant allele.", "an allele expressed when only one copy is present", "A dominant allele affects the phenotype in a heterozygous pair.", 2, 120, "GCSE Biology: inheritance", ["expressed with one copy"]),
      short("science", "Year 11", "y11s-ecology", "Biology", "State one way to estimate the population size of daisies in a field.", "use quadrats", "Quadrats provide a sample that can be used to estimate a plant population.", 1, 120, "GCSE Biology: ecology", ["quadrat sampling", "random quadrats"]),
      short("science", "Year 11", "y11s-rate", "Chemistry", "Give one change that would increase the rate of reaction between marble chips and acid.", "increase temperature", "Higher temperature increases collision frequency and energy; surface area or concentration are also valid.", 1, 120, "GCSE Chemistry: rates", ["increase surface area", "increase concentration", "use catalyst"]),
      short("science", "Year 11", "y11s-equilibrium", "Chemistry", "What happens to the position of equilibrium when pressure is increased in a reaction with fewer gas moles on the product side?", "it shifts to the products", "Higher pressure favours the side with fewer gas molecules.", 2, 180, "GCSE Chemistry: equilibrium", ["moves right"]),
      short("science", "Year 11", "y11s-transformer", "Physics", "A transformer has 200 turns on the primary coil and 50 on the secondary coil. The primary voltage is 240 V. Calculate the secondary voltage.", "60", "Vs/Vp = Ns/Np, so 240 × 50/200.", 3, 210, "GCSE Physics: electricity", ["60 V", "60v"]),
      short("science", "Year 11", "y11s-momentum", "Physics", "Calculate momentum of a 4 kg trolley moving at 3 m/s.", "12", "Momentum = mass × velocity.", 1, 120, "GCSE Physics: forces", ["12 kg m/s", "12kgm/s"]),
      short("science", "Year 11", "y11s-method", "Working scientifically", "Why should a scientist use a range of values for the independent variable?", "to identify the pattern or relationship", "A range makes a trend easier to detect and support with evidence.", 2, 180, "GCSE practical skills", ["see pattern", "identify trend"]),
      short("science", "Year 11", "y11s-uncertainty", "Working scientifically", "A ruler has millimetre divisions. State a reasonable uncertainty for one length reading in mm.", "1", "A measurement uncertainty is usually about ±1 mm for a ruler reading.", 1, 120, "GCSE practical skills", ["±1", "+/-1"]),
      short("science", "Year 11", "y11s-cycles", "Biology", "Name the process that returns carbon dioxide to the atmosphere from organisms.", "respiration", "Respiration releases carbon dioxide as organisms transfer energy from glucose.", 1, 90, "GCSE Biology: ecology"),
      short("science", "Year 11", "y11s-organic", "Chemistry", "Name the functional group in an alcohol.", "OH", "Alcohols contain the hydroxyl functional group, -OH.", 1, 120, "GCSE Chemistry: organic chemistry", ["-OH", "hydroxyl"]),
      short("science", "Year 11", "y11s-wave", "Physics", "A wave has frequency 50 Hz and wavelength 2 m. Calculate wave speed.", "100", "Wave speed = frequency × wavelength.", 2, 180, "GCSE Physics: waves", ["100 m/s"]),
      short("science", "Year 11", "y11s-evaluate", "Working scientifically", "A student concludes that fertiliser caused taller plants, but used only one plant in each group. State one limitation.", "the sample size is too small", "One plant per group is not enough evidence because individual variation can distort the result.", 2, 180, "GCSE practical skills", ["small sample", "not reliable"]),
    ],
  },
};

export function getBaselineQuestions(subject: BaselineSubject, yearGroup: string): BaselineQuestion[] {
  return BASELINE_BANKS[subject][yearGroup] || BASELINE_BANKS[subject]["Year 7"];
}

export function plannedAssessmentSeconds(items: BaselineQuestion[]): number {
  return items.reduce((total, item) => total + item.suggestedSeconds, 0);
}

export function totalAssessmentMarks(items: BaselineQuestion[]): number {
  return items.reduce((total, item) => total + item.marks, 0);
}
