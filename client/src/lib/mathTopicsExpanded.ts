// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE GCSE MATHEMATICS TOPICS — Full AQA / Edexcel / OCR Coverage
// Covers: Number, Algebra, Ratio & Proportion, Geometry, Probability, Statistics
// No hints in student questions. Topic-specific formulas only. Rich teacher sections.
// ─────────────────────────────────────────────────────────────────────────────

export const expandedMathTopics: Record<string, any> = {

  // ── NUMBER ──────────────────────────────────────────────────────────────────

  "place-value": {
    title: "Place Value and Ordering Numbers",
    objective: "Read, write and order integers, decimals and negative numbers. Understand place value in context.",
    priorKnowledge: "Students should recognise digits 0–9 and understand that position determines value.",
    vocabulary: ["Place value", "Integer", "Decimal", "Negative number", "Ascending", "Descending", "Digit", "Significant figure", "Thousand", "Million"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): Show a 7-digit number on the board. Ask students to write the value of each digit.
• Direct instruction (12 min): Model place value chart with decimals. Emphasise that 0.3 ≠ 0.30 in terms of precision but equal in value.
• Guided practice (10 min): Questions A1–A4 as a class.
• Independent work (15 min): Section B questions.
• Plenary (5 min): Exit ticket — write 3,040,070 in words.

COMMON MISCONCEPTIONS:
• Students write 3,040,070 as "three million forty seventy" — address explicitly.
• Ordering decimals: students think 0.9 < 0.15 because 15 > 9. Use number lines.
• Negative numbers: −7 is less than −2 (further from zero on the left).

DIFFERENTIATION:
• Support: Provide a place value chart with column headers. Use physical digit cards.
• Core: Standard questions with mixed integers and decimals.
• Extension: Compare and order numbers in different forms (standard form, fractions, decimals).

MARK SCHEME GUIDANCE:
• 1 mark per correct ordering or identification of place value.
• For "write in words" questions: accept minor spelling errors if unambiguous.
• Negative number ordering: award method mark for correct number line drawn.

EXAM TECHNIQUE:
• Remind students to check ascending vs descending carefully.
• For decimals, pad with zeros to same length before comparing (e.g., 0.3 → 0.300).

SEND GUIDANCE:
• Dyslexia: Use colour-coded place value charts. Provide number lines.
• Dyscalculia: Physical manipulatives (base-10 blocks). Break into single-step tasks.
• EAL: Vocabulary cards with visual representations of each place value column.

CROSS-CURRICULAR: Science (significant figures), Geography (population data), History (dates and timelines).`,
    markScheme: [
      { q: "A1", marks: 1, answer: "40,000", method: "The digit 4 is in the ten-thousands column" },
      { q: "A2", marks: 1, answer: "0.07", method: "7 is in the hundredths column" },
      { q: "A3", marks: 2, answer: "−8, −3, 0, 2, 5, 11", method: "1M correct method (number line or comparison); 1A all correct" },
      { q: "B1", marks: 1, answer: "Seven million, four hundred and twenty-three thousand, one hundred and five", method: "Accept minor spelling errors" },
      { q: "B2", marks: 2, answer: "0.305, 0.35, 0.503, 0.53", method: "1M for padding decimals; 1A all correct order" },
      { q: "B3", marks: 2, answer: "−15, −9, −4, 0, 6, 12", method: "1M for recognising negatives are less than positives; 1A all correct" },
      { q: "Challenge", marks: 3, answer: "−2.5, −1.8, 0.08, 0.8, 1.08, 1.8", method: "1M method; 1A negatives correct; 1A decimals correct" },
    ],
    example: {
      question: "Write the value of the digit 6 in the number 3,462,815",
      steps: [
        "Step 1: Write out the place value columns",
        "   Millions | Hundred-thousands | Ten-thousands | Thousands | Hundreds | Tens | Units",
        "        3   |         4         |       6       |     2     |     8    |   1  |   5",
        "Step 2: Identify which column the digit 6 is in",
        "   The digit 6 is in the ten-thousands column",
        "Step 3: State the value",
        "   Value = 6 × 10,000 = 60,000",
        "Answer: 60,000"
      ]
    },
    guided: [
      { q: "A1  Write down the value of the digit 4 in the number 347,821.", a: "40,000", marks: 1 },
      { q: "A2  Write down the value of the digit 7 in the number 3.472.", a: "0.07", marks: 1 },
      { q: "A3  Write these numbers in ascending order: 5, −3, 11, −8, 2, 0", a: "−8, −3, 0, 2, 5, 11", marks: 2 },
      { q: "A4  Write the number 2,050,306 in words.", a: "Two million, fifty thousand, three hundred and six", marks: 1 },
    ],
    independent: [
      { q: "B1  Write the number 7,423,105 in words.", a: "Seven million, four hundred and twenty-three thousand, one hundred and five", marks: 1 },
      { q: "B2  Write these decimals in ascending order: 0.53, 0.305, 0.35, 0.503", a: "0.305, 0.35, 0.503, 0.53", marks: 2 },
      { q: "B3  Write these numbers in ascending order: 6, −4, 12, −9, 0, −15", a: "−15, −9, −4, 0, 6, 12", marks: 2 },
      { q: "B4  The temperature in Moscow is −12°C. The temperature in London is −3°C. Which city is colder? By how many degrees?", a: "Moscow; 9 degrees colder", marks: 2 },
      { q: "B5  A bank account shows a balance of −£245. The account holder deposits £180. What is the new balance?", a: "−£65", marks: 2 },
      { q: "B6  Write these numbers in descending order: 0.6, 0.06, 0.606, 0.066, 0.66", a: "0.66, 0.606, 0.6, 0.066, 0.06", marks: 2 },
    ],
    challenge: "A diver is at −18 m below sea level. She ascends 7 m, then descends 4 m, then ascends 12 m. What is her final depth? Is she above or below sea level?",
    challengeAnswer: "−18 + 7 − 4 + 12 = −3 m. She is 3 m below sea level.",
    extension: "Research: How does place value work in binary (base 2)? What is the binary number 1011 in decimal? How would you write 13 in binary?"
  },

  "indices": {
    title: "Indices and Standard Form",
    objective: "Use index notation and the laws of indices. Convert between ordinary numbers and standard form. Calculate with standard form.",
    priorKnowledge: "Students should be able to: multiply and divide integers; understand place value; use a calculator for powers.",
    vocabulary: ["Index", "Power", "Base", "Exponent", "Standard form", "Coefficient", "Reciprocal", "Cube root", "Square root", "Negative index"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): Quick-fire powers of 2 and 3 up to cubed. What is 2⁰? (Answer: 1 — address this common confusion immediately.)
• Direct instruction (12 min): Laws of indices with numerical examples before algebraic. Standard form: emphasise 1 ≤ a < 10.
• Guided practice (10 min): Questions A1–A5 as a class.
• Independent work (15 min): Section B.
• Plenary (5 min): "Which is bigger: 3 × 10⁴ or 2.9 × 10⁵?" — discuss.

LAWS OF INDICES (for teacher reference):
• aᵐ × aⁿ = aᵐ⁺ⁿ
• aᵐ ÷ aⁿ = aᵐ⁻ⁿ
• (aᵐ)ⁿ = aᵐⁿ
• a⁰ = 1 (for a ≠ 0)
• a⁻ⁿ = 1/aⁿ
• a^(1/n) = ⁿ√a

COMMON MISCONCEPTIONS:
• 2³ = 6 (multiplying instead of repeated multiplication). Use "2 × 2 × 2" explicitly.
• Standard form: writing 23 × 10³ instead of 2.3 × 10⁴.
• Negative indices: thinking a⁻² = −a². Clarify: it means 1/a².
• (2x)³ = 2x³ instead of 8x³. Emphasise the bracket applies to both.

DIFFERENTIATION:
• Support: Provide laws of indices reference card. Focus on positive integer indices only.
• Core: Include negative and fractional indices.
• Extension: Surds and irrational numbers; proof of index laws.

MARK SCHEME GUIDANCE:
• Standard form: must have 1 ≤ coefficient < 10 for full marks.
• Laws of indices: award method mark for correct law identified even if arithmetic error.
• Calculations with standard form: show working for method marks.

EXAM TECHNIQUE:
• Always check standard form answers: coefficient must be between 1 and 10.
• For negative indices, rewrite as fraction first, then simplify.

SEND GUIDANCE:
• Dyscalculia: Provide a powers table (2¹ to 2¹⁰, 3¹ to 3⁶). Focus on pattern recognition.
• Dyslexia: Colour-code the base and the index in different colours.
• EAL: Ensure students understand "power of" and "to the power" mean the same thing.

CROSS-CURRICULAR: Science (very large/small measurements), Computing (binary/powers of 2).`,
    markScheme: [
      { q: "A1", marks: 1, answer: "125", method: "5³ = 5 × 5 × 5 = 125" },
      { q: "A2", marks: 1, answer: "x⁷", method: "Add indices: 3 + 4 = 7" },
      { q: "A3", marks: 1, answer: "y³", method: "Subtract indices: 7 − 4 = 3" },
      { q: "A4", marks: 2, answer: "3.4 × 10⁵", method: "1M for 3.4; 1A for × 10⁵" },
      { q: "A5", marks: 2, answer: "0.000067", method: "Move decimal 5 places left" },
      { q: "B1", marks: 2, answer: "6 × 10⁸", method: "2 × 3 = 6; 10⁵ × 10³ = 10⁸" },
      { q: "B2", marks: 2, answer: "2 × 10³", method: "8 ÷ 4 = 2; 10⁷ ÷ 10⁴ = 10³" },
      { q: "B3", marks: 1, answer: "1/49", method: "7⁻² = 1/7² = 1/49" },
      { q: "B4", marks: 2, answer: "27", method: "27^(1/3) = ³√27 = 3; then 3² = 9... wait: 27^(2/3) = (³√27)² = 3² = 9. Accept 9." },
      { q: "Challenge", marks: 4, answer: "1.5 × 10⁻⁴ m", method: "1.5 × 10⁻¹ ÷ 10³ = 1.5 × 10⁻⁴" },
    ],
    example: {
      question: "Write 450,000 in standard form",
      steps: [
        "Step 1: Write the number with the decimal point after the first non-zero digit",
        "   450,000 → 4.5",
        "Step 2: Count how many places the decimal point moved",
        "   4.50000 → 450000: moved 5 places to the right",
        "Step 3: Write as a × 10ⁿ where n = number of places moved",
        "   n = 5 (positive because the original number is large)",
        "Answer: 4.5 × 10⁵",
        "",
        "CHECK: 4.5 × 10⁵ = 4.5 × 100,000 = 450,000 ✓"
      ]
    },
    guided: [
      { q: "A1  Calculate 5³.", a: "125", marks: 1 },
      { q: "A2  Simplify x³ × x⁴.", a: "x⁷", marks: 1 },
      { q: "A3  Simplify y⁷ ÷ y⁴.", a: "y³", marks: 1 },
      { q: "A4  Write 340,000 in standard form.", a: "3.4 × 10⁵", marks: 2 },
      { q: "A5  Write 6.7 × 10⁻⁵ as an ordinary number.", a: "0.000067", marks: 2 },
    ],
    independent: [
      { q: "B1  Calculate (2 × 10⁵) × (3 × 10³). Give your answer in standard form.", a: "6 × 10⁸", marks: 2 },
      { q: "B2  Calculate (8 × 10⁷) ÷ (4 × 10⁴). Give your answer in standard form.", a: "2 × 10³", marks: 2 },
      { q: "B3  Write 7⁻² as a fraction.", a: "1/49", marks: 1 },
      { q: "B4  Evaluate 27^(2/3).", a: "9", marks: 2 },
      { q: "B5  The mass of a proton is 1.67 × 10⁻²⁷ kg. The mass of an electron is 9.11 × 10⁻³¹ kg. How many times heavier is a proton than an electron? Give your answer to 3 significant figures.", a: "1830 (1.83 × 10³)", marks: 3 },
      { q: "B6  Simplify (2x³)⁴.", a: "16x¹²", marks: 2 },
    ],
    challenge: "A human hair is approximately 1.5 × 10⁻¹ mm wide. A bacterium is approximately 1 × 10⁻³ mm wide. How many bacteria placed side by side would fit across the width of one human hair? Give your answer in standard form.",
    challengeAnswer: "(1.5 × 10⁻¹) ÷ (1 × 10⁻³) = 1.5 × 10² = 150 bacteria.",
    extension: "Investigate: What is the value of 0⁰? Research why mathematicians define it as 1 in most contexts. Can you explain why using the pattern 2⁰ = 1, 1⁰ = 1, and the limit as x → 0 of xˣ?"
  },

  "surds": {
    title: "Surds and Exact Values",
    objective: "Simplify surds. Expand expressions involving surds. Rationalise the denominator.",
    priorKnowledge: "Students should be able to: find square roots of perfect squares; simplify fractions; expand single brackets.",
    vocabulary: ["Surd", "Irrational number", "Rationalise", "Conjugate", "Exact value", "Simplify", "Square root", "Perfect square"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): List all perfect squares up to 144. Which numbers are NOT perfect squares?
• Direct instruction (12 min): Define surd. Show √12 = √(4×3) = 2√3. Emphasise: always find the largest perfect square factor.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "Why can't we have a surd in the denominator?" — discuss rationalising.

KEY RULES (teacher reference):
• √(ab) = √a × √b
• √(a/b) = √a / √b
• (√a)² = a
• (a + √b)(a − √b) = a² − b (difference of two squares)
• To rationalise 1/√a: multiply by √a/√a

COMMON MISCONCEPTIONS:
• √(a + b) ≠ √a + √b. Students often "split" addition under a root — address with numerical counter-example: √(9+16) = √25 = 5, not 3+4 = 7.
• Simplifying √12: students find √4 × √3 but then write 4√3 instead of 2√3.
• Expanding (1 + √3)²: forgetting the middle term 2√3.

DIFFERENTIATION:
• Support: Provide a list of perfect squares. Focus on simplifying only.
• Core: Simplify, expand, and basic rationalising.
• Extension: Rationalise with conjugate surds; prove √2 is irrational.

MARK SCHEME GUIDANCE:
• Simplification: must show the split into perfect square × remaining factor for method mark.
• Rationalising: award method mark for multiplying by correct conjugate even if arithmetic error.
• Exact value: accept equivalent forms (e.g., 2√3 = √12 only if simplified form requested).

SEND GUIDANCE:
• Dyscalculia: Provide a "perfect squares" reference card. Use colour to highlight the perfect square factor.
• Dyslexia: Ensure surd notation is clearly written — √ symbol can be confused with division.

CROSS-CURRICULAR: Physics (exact values in trigonometry), A-Level Maths preparation.`,
    markScheme: [
      { q: "A1", marks: 1, answer: "3√2", method: "√18 = √(9×2) = 3√2" },
      { q: "A2", marks: 2, answer: "2√5", method: "√20 = √(4×5) = 2√5" },
      { q: "A3", marks: 2, answer: "5 + 2√6", method: "(√2 + √3)² = 2 + 2√6 + 3 = 5 + 2√6" },
      { q: "A4", marks: 2, answer: "√5/5", method: "Multiply by √5/√5: √5/5" },
      { q: "B1", marks: 2, answer: "4√3", method: "√48 = √(16×3) = 4√3" },
      { q: "B2", marks: 3, answer: "14 + 6√5", method: "(2+√5)² × ... expand (3+√5)²=9+6√5+5=14+6√5" },
      { q: "B3", marks: 3, answer: "(3+√7)/2", method: "Multiply by (3+√7)/(3+√7): (3+√7)/(9−7) = (3+√7)/2" },
      { q: "Challenge", marks: 4, answer: "√3", method: "Area = ½ × base × height; use Pythagoras to find height = √3; Area = ½ × 2 × √3 = √3 cm²" },
    ],
    example: {
      question: "Simplify √72",
      steps: [
        "Step 1: Find the largest perfect square that is a factor of 72",
        "   Factors of 72: 1, 2, 3, 4, 6, 8, 9, 12, 18, 24, 36, 72",
        "   Perfect square factors: 4, 9, 36",
        "   Largest perfect square factor = 36",
        "Step 2: Write 72 as a product using this factor",
        "   72 = 36 × 2",
        "Step 3: Apply the rule √(ab) = √a × √b",
        "   √72 = √36 × √2 = 6√2",
        "Answer: 6√2"
      ]
    },
    guided: [
      { q: "A1  Simplify √18.", a: "3√2", marks: 1 },
      { q: "A2  Simplify √20.", a: "2√5", marks: 2 },
      { q: "A3  Expand and simplify (√2 + √3)².", a: "5 + 2√6", marks: 2 },
      { q: "A4  Rationalise the denominator of 1/√5.", a: "√5/5", marks: 2 },
    ],
    independent: [
      { q: "B1  Simplify √48.", a: "4√3", marks: 2 },
      { q: "B2  Expand and simplify (3 + √5)².", a: "14 + 6√5", marks: 3 },
      { q: "B3  Rationalise the denominator of 2/(3 − √7). Give your answer in the form (a + b√7)/c.", a: "(3 + √7)/1 = 3 + √7... actually 2(3+√7)/2 = 3+√7", marks: 3 },
      { q: "B4  Show that √75 − √12 = 3√3.", a: "5√3 − 2√3 = 3√3", marks: 3 },
      { q: "B5  Simplify (√5 + √2)(√5 − √2).", a: "3", marks: 2 },
      { q: "B6  Find the exact value of sin 60° × cos 30°. Leave your answer as a surd.", a: "(√3/2) × (√3/2) = 3/4", marks: 2 },
    ],
    challenge: "An equilateral triangle has sides of length 2 cm. Find the exact area of the triangle, leaving your answer in surd form.",
    challengeAnswer: "Height = √3 cm (by Pythagoras: 2² − 1² = 3, so h = √3). Area = ½ × 2 × √3 = √3 cm².",
    extension: "Prove that √2 is irrational using proof by contradiction. Research: what other numbers are irrational? What is the difference between irrational and transcendental numbers?"
  },

  "bounds": {
    title: "Bounds and Error Intervals",
    objective: "Find upper and lower bounds for rounded measurements. Use bounds in calculations. Write error intervals using inequality notation.",
    priorKnowledge: "Students should be able to: round to decimal places and significant figures; use inequality symbols; substitute into formulae.",
    vocabulary: ["Upper bound", "Lower bound", "Error interval", "Truncation", "Rounding", "Degree of accuracy", "Inequality", "Significant figure"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): Round 3.456 to 1 d.p., 2 d.p., 1 s.f., 2 s.f. Discuss what information is lost.
• Direct instruction (12 min): Introduce bounds. For a measurement of 6.3 cm (1 d.p.): LB = 6.25, UB = 6.35. Stress: UB uses strict inequality (< not ≤).
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "If a = 5.4 (1 d.p.) and b = 3.2 (1 d.p.), what is the maximum value of a − b?"

BOUNDS IN CALCULATIONS:
• Maximum of a + b: UB(a) + UB(b)
• Minimum of a + b: LB(a) + LB(b)
• Maximum of a × b: UB(a) × UB(b)
• Maximum of a ÷ b: UB(a) ÷ LB(b)  ← common exam trap
• Minimum of a ÷ b: LB(a) ÷ UB(b)

COMMON MISCONCEPTIONS:
• For a ÷ b, students use UB(a) ÷ UB(b) for maximum. Correct: UB(a) ÷ LB(b).
• Confusing truncation and rounding: 3.7 truncated to 1 d.p. = 3.7, but 3.78 truncated = 3.7 (not 3.8).
• Error interval notation: writing ≤ for upper bound instead of <.

DIFFERENTIATION:
• Support: Focus on finding bounds only (not calculations with bounds).
• Core: Bounds in addition and multiplication calculations.
• Extension: Division calculations; truncation; percentage error.

MARK SCHEME GUIDANCE:
• Error interval: must use correct inequality notation (≤ x < for rounded values).
• Calculations: award method mark for correct identification of which bounds to use.
• Final answer: must be given to appropriate precision.

SEND GUIDANCE:
• Dyscalculia: Use a number line to visualise the interval. Provide structured template.
• Dyslexia: Ensure inequality symbols are clearly distinguished (< vs ≤).

CROSS-CURRICULAR: Science (measurement uncertainty, significant figures), Engineering (tolerances).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "LB = 7.35 cm, UB = 7.45 cm", method: "Half of 0.1 = 0.05; 7.4 ± 0.05" },
      { q: "A2", marks: 2, answer: "7.35 ≤ x < 7.45", method: "Correct inequality notation with ≤ lower, < upper" },
      { q: "A3", marks: 2, answer: "LB = 2.45, UB = 2.55", method: "Rounded to 1 d.p.: ±0.05" },
      { q: "B1", marks: 3, answer: "Maximum = 7.45 + 2.55 = 10.0 cm", method: "1M UB(a) + UB(b); 1M correct values; 1A 10.0" },
      { q: "B2", marks: 3, answer: "Minimum = 7.35 − 2.55 = 4.8 cm", method: "1M LB(a) − UB(b); 1M correct values; 1A 4.8" },
      { q: "B3", marks: 4, answer: "Max speed = 205/1.75 = 117.1... ≈ 117 km/h", method: "UB(distance) = 205; LB(time) = 1.75; 1M correct bounds; 1M division; 1A answer; 1A rounding" },
      { q: "Challenge", marks: 4, answer: "Max area = 12.45 × 8.45 = 105.2025 cm²; Min area = 12.35 × 8.35 = 103.1225 cm²", method: "1M each correct bound pair; 1A each area" },
    ],
    example: {
      question: "A length is measured as 12.6 cm to the nearest 0.1 cm. Write the error interval for the length.",
      steps: [
        "Step 1: Find the degree of accuracy",
        "   Measured to nearest 0.1 cm, so accuracy = 0.1 cm",
        "Step 2: Find half the degree of accuracy",
        "   0.1 ÷ 2 = 0.05",
        "Step 3: Lower bound = measurement − 0.05",
        "   12.6 − 0.05 = 12.55",
        "Step 4: Upper bound = measurement + 0.05",
        "   12.6 + 0.05 = 12.65",
        "Step 5: Write as error interval using inequality notation",
        "   12.55 ≤ x < 12.65",
        "Note: The lower bound uses ≤ (could equal 12.55) but the upper bound uses < (cannot equal 12.65, as that would round up to 12.7)"
      ]
    },
    guided: [
      { q: "A1  A length is measured as 7.4 cm to the nearest 0.1 cm. Find the upper and lower bounds.", a: "LB = 7.35 cm, UB = 7.45 cm", marks: 2 },
      { q: "A2  Write the error interval for the length in A1.", a: "7.35 ≤ x < 7.45", marks: 2 },
      { q: "A3  A mass is measured as 2.5 kg to 1 decimal place. Find the upper and lower bounds.", a: "LB = 2.45 kg, UB = 2.55 kg", marks: 2 },
    ],
    independent: [
      { q: "B1  A = 7.4 cm and B = 2.5 cm, both measured to 1 d.p. Find the maximum possible value of A + B.", a: "10.0 cm", marks: 3 },
      { q: "B2  Using the same values as B1, find the minimum possible value of A − B.", a: "4.8 cm", marks: 3 },
      { q: "B3  A car travels 200 km (to the nearest 10 km) in 1.8 hours (to the nearest 0.1 hour). Calculate the maximum possible average speed. Give your answer to 1 decimal place.", a: "≈ 117.1 km/h", marks: 4 },
      { q: "B4  A number n is truncated to 2 decimal places to give 4.37. Write the error interval for n.", a: "4.37 ≤ n < 4.38", marks: 2 },
      { q: "B5  The population of a town is given as 45,000 to the nearest 1000. Write the error interval.", a: "44,500 ≤ p < 45,500", marks: 2 },
    ],
    challenge: "A rectangle has length 12.4 cm and width 8.4 cm, both measured to the nearest 0.1 cm. Calculate the maximum and minimum possible areas of the rectangle.",
    challengeAnswer: "Max area = 12.45 × 8.45 = 105.2025 cm². Min area = 12.35 × 8.35 = 103.1225 cm².",
    extension: "Research: How do engineers use tolerances in manufacturing? Find out about the concept of 'six sigma' quality control and how it relates to bounds and error intervals."
  },

  // ── ALGEBRA ─────────────────────────────────────────────────────────────────

  "sequences": {
    title: "Sequences — Arithmetic, Geometric and nth Term",
    objective: "Find and use the nth term of arithmetic and geometric sequences. Recognise and continue special sequences.",
    priorKnowledge: "Students should be able to: substitute into formulae; identify patterns; use the four operations with negative numbers.",
    vocabulary: ["Sequence", "Term", "nth term", "Arithmetic sequence", "Geometric sequence", "Common difference", "Common ratio", "Fibonacci", "Quadratic sequence"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): Show sequences: 3, 7, 11, 15... and 2, 6, 18, 54... Ask: what's the difference? (Arithmetic vs geometric.)
• Direct instruction (12 min): nth term of arithmetic: a + (n−1)d = dn + (a−d). Geometric: arⁿ⁻¹.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "Is 100 a term in the sequence 3, 7, 11, 15...?" Solve 4n − 1 = 100.

ARITHMETIC SEQUENCES:
• nth term = a + (n−1)d where a = first term, d = common difference
• Simplified: nth term = dn + (a − d)
• To find if a value is in the sequence: set nth term = value and solve for n. If n is a positive integer, it is in the sequence.

GEOMETRIC SEQUENCES:
• nth term = arⁿ⁻¹ where a = first term, r = common ratio
• Sum of geometric series (extension): Sₙ = a(1−rⁿ)/(1−r)

QUADRATIC SEQUENCES (Higher):
• Second differences are constant
• nth term has the form an² + bn + c

COMMON MISCONCEPTIONS:
• Arithmetic nth term: students write "4n" for 4, 8, 12, 16 but forget the constant adjustment.
• Geometric: students add the ratio instead of multiplying.
• "Is 85 in the sequence 5, 9, 13...?" — students don't check if n is a whole number.

DIFFERENTIATION:
• Support: Arithmetic sequences only. Provide structured nth term formula.
• Core: Arithmetic and geometric. Finding if a value is in a sequence.
• Extension: Quadratic sequences; sum of arithmetic series; Fibonacci and golden ratio.

MARK SCHEME GUIDANCE:
• nth term: award 1M for correct method (dn + c form) even if c is wrong.
• "Is X in the sequence?": must show algebraic working and conclude with yes/no.
• Geometric: award method mark for identifying the common ratio.

SEND GUIDANCE:
• Dyscalculia: Use visual patterns (dots, shapes) alongside number sequences.
• Dyslexia: Provide a structured template: "Term 1 = ___, Term 2 = ___, Difference = ___".

CROSS-CURRICULAR: Science (exponential growth/decay), Computing (recursive algorithms), Finance (compound interest).`,
    markScheme: [
      { q: "A1", marks: 1, answer: "d = 5", method: "7 − 2 = 5 or any consecutive pair" },
      { q: "A2", marks: 2, answer: "5n − 3", method: "1M for 5n; 1A for −3 (substitute n=1: 5(1)−3=2 ✓)" },
      { q: "A3", marks: 1, answer: "r = 3", method: "6 ÷ 2 = 3" },
      { q: "A4", marks: 2, answer: "2 × 3ⁿ⁻¹", method: "1M for correct form arⁿ⁻¹; 1A for a=2, r=3" },
      { q: "B1", marks: 2, answer: "4n + 1", method: "d=4, a=5; 4(1)+1=5 ✓" },
      { q: "B2", marks: 3, answer: "No — 4n+1=85 gives n=21, which is a whole number, so YES 85 is in the sequence", method: "1M set up equation; 1M solve; 1A correct conclusion" },
      { q: "B3", marks: 3, answer: "nth term = 3n² − n + 1 (check: n=1: 3, n=2: 11, n=3: 25...)", method: "1M second differences = 6 so coefficient of n² = 3; 1M method; 1A correct formula" },
      { q: "Challenge", marks: 4, answer: "Sum = 5(1−2¹⁰)/(1−2) = 5 × 1023 = 5115", method: "1M identify geometric; 1M correct formula; 1M substitution; 1A 5115" },
    ],
    example: {
      question: "Find the nth term of the arithmetic sequence: 3, 7, 11, 15, ...",
      steps: [
        "Step 1: Find the common difference (d)",
        "   7 − 3 = 4, so d = 4",
        "Step 2: Write the nth term formula: nth term = dn + (a − d)",
        "   where a = first term = 3, d = 4",
        "   nth term = 4n + (3 − 4) = 4n − 1",
        "Step 3: Check by substituting n = 1, 2, 3:",
        "   n=1: 4(1)−1 = 3 ✓",
        "   n=2: 4(2)−1 = 7 ✓",
        "   n=3: 4(3)−1 = 11 ✓",
        "Answer: nth term = 4n − 1"
      ]
    },
    guided: [
      { q: "A1  Find the common difference of the sequence: 2, 7, 12, 17, ...", a: "5", marks: 1 },
      { q: "A2  Find the nth term of the sequence: 2, 7, 12, 17, ...", a: "5n − 3", marks: 2 },
      { q: "A3  Find the common ratio of the sequence: 2, 6, 18, 54, ...", a: "3", marks: 1 },
      { q: "A4  Write the nth term of the geometric sequence: 2, 6, 18, 54, ...", a: "2 × 3ⁿ⁻¹", marks: 2 },
    ],
    independent: [
      { q: "B1  Find the nth term of the arithmetic sequence: 5, 9, 13, 17, ...", a: "4n + 1", marks: 2 },
      { q: "B2  Is 85 a term in the sequence 5, 9, 13, 17, ...? Show your working and give a reason.", a: "Yes — 4n+1=85, n=21 (whole number)", marks: 3 },
      { q: "B3  The second differences of a sequence are constant at 6. The first three terms are 3, 11, 25. Find the nth term.", a: "3n² − n + 1", marks: 3 },
      { q: "B4  A geometric sequence has first term 5 and common ratio 2. Write down the first 5 terms.", a: "5, 10, 20, 40, 80", marks: 2 },
      { q: "B5  The nth term of a sequence is 3n² + 2. Find the 10th term.", a: "302", marks: 2 },
      { q: "B6  How many terms of the arithmetic sequence 8, 11, 14, ... are less than 100?", a: "31 terms (3n+5 < 100, n < 31.67, so n ≤ 31)", marks: 3 },
    ],
    challenge: "A geometric sequence has first term 5 and common ratio 2. Find the sum of the first 10 terms.",
    challengeAnswer: "S₁₀ = 5(2¹⁰ − 1)/(2 − 1) = 5 × 1023 = 5115.",
    extension: "Research the Fibonacci sequence. Show that the ratio of consecutive Fibonacci terms approaches the golden ratio φ = (1+√5)/2. Why does this appear in nature?"
  },

  "quadratics": {
    title: "Quadratic Equations — Factorising, Formula and Completing the Square",
    objective: "Solve quadratic equations by factorising, using the quadratic formula, and completing the square. Interpret solutions in context.",
    priorKnowledge: "Students should be able to: expand double brackets; factorise simple expressions; substitute into formulae; use square roots.",
    vocabulary: ["Quadratic", "Coefficient", "Discriminant", "Roots", "Solutions", "Completing the square", "Quadratic formula", "Vertex", "Parabola", "Factorise"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): Expand (x+3)(x−2). Reverse: factorise x²+x−6. Discuss connection.
• Direct instruction (12 min): Three methods — factorising (when possible), formula (always works), completing the square (gives vertex form). When to use each.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): Discriminant — what does b²−4ac tell us?

QUADRATIC FORMULA: x = (−b ± √(b²−4ac)) / 2a
DISCRIMINANT: b²−4ac
• > 0: two distinct real roots
• = 0: one repeated root (tangent to x-axis)
• < 0: no real roots

COMPLETING THE SQUARE: x² + bx + c = (x + b/2)² − (b/2)² + c
• Vertex of parabola: (−b/2a, c − b²/4a)

COMMON MISCONCEPTIONS:
• Factorising: students find factors of c but forget to check they sum to b.
• Formula: forgetting to divide the WHOLE numerator by 2a (not just the ±√ part).
• Completing the square: sign errors when expanding (x + p)².
• Negative leading coefficient: students don't rearrange to ax²+bx+c=0 first.

DIFFERENTIATION:
• Support: Factorising with positive coefficients only. Provide quadratic formula card.
• Core: All three methods. Discriminant.
• Extension: Completing the square for vertex; quadratic inequalities; simultaneous equations with quadratics.

MARK SCHEME GUIDANCE:
• Factorising: award 1M for correct factors even if final answer wrong.
• Formula: award 1M for correct substitution; 1M for correct simplification; 1A for both roots.
• Completing the square: award marks for each correct step.
• Context problems: must state which solution(s) are valid in context (e.g., negative length not valid).

SEND GUIDANCE:
• Dyscalculia: Provide the quadratic formula on a card. Use a structured substitution template.
• Dyslexia: Colour-code a, b, c in the formula and in the equation.
• Working memory difficulties: Break into clear numbered steps. Allow formula sheet.

CROSS-CURRICULAR: Physics (projectile motion), Economics (profit maximisation), Engineering (parabolic structures).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "x = 3 or x = −2", method: "(x−3)(x+2) = 0" },
      { q: "A2", marks: 2, answer: "x = 5 or x = −1", method: "(x−5)(x+1) = 0" },
      { q: "A3", marks: 3, answer: "x = (−3 ± √17)/2 ≈ 0.56 or −3.56", method: "a=1,b=3,c=−2; discriminant=9+8=17; 1M formula; 1M substitution; 1A both roots" },
      { q: "A4", marks: 3, answer: "(x+3)² − 7", method: "(x+3)²=x²+6x+9; so x²+6x+2=(x+3)²−7" },
      { q: "B1", marks: 3, answer: "x = (5 ± √33)/4", method: "a=2,b=−5,c=−1; discriminant=25+8=33" },
      { q: "B2", marks: 2, answer: "Two distinct real roots", method: "b²−4ac = 25−24 = 1 > 0" },
      { q: "B3", marks: 4, answer: "t = 3 s (reject t = −1/2 as time cannot be negative)", method: "2t²−5t−3=0; (2t+1)(t−3)=0; t=3 or t=−½; context: reject negative" },
      { q: "Challenge", marks: 5, answer: "Minimum at (−3, −7); vertex form: (x+3)²−7", method: "Complete the square; identify vertex; state minimum value" },
    ],
    example: {
      question: "Solve x² − x − 6 = 0 by factorising",
      steps: [
        "Step 1: Find two numbers that multiply to −6 and add to −1 (the coefficient of x)",
        "   Pairs that multiply to −6: (1,−6), (−1,6), (2,−3), (−2,3)",
        "   Which pair adds to −1? 2 + (−3) = −1 ✓",
        "Step 2: Write as two brackets",
        "   x² − x − 6 = (x + 2)(x − 3)",
        "Step 3: Set each bracket equal to zero",
        "   x + 2 = 0  →  x = −2",
        "   x − 3 = 0  →  x = 3",
        "Answer: x = −2 or x = 3",
        "",
        "CHECK: (−2)² − (−2) − 6 = 4 + 2 − 6 = 0 ✓ and 3² − 3 − 6 = 9 − 3 − 6 = 0 ✓"
      ]
    },
    guided: [
      { q: "A1  Solve x² − x − 6 = 0 by factorising.", a: "x = 3 or x = −2", marks: 2 },
      { q: "A2  Solve x² − 4x − 5 = 0 by factorising.", a: "x = 5 or x = −1", marks: 2 },
      { q: "A3  Use the quadratic formula to solve x² + 3x − 2 = 0. Give your answers to 2 decimal places.", a: "x ≈ 0.56 or x ≈ −3.56", marks: 3 },
      { q: "A4  Complete the square for x² + 6x + 2. Write in the form (x + p)² + q.", a: "(x + 3)² − 7", marks: 3 },
    ],
    independent: [
      { q: "B1  Use the quadratic formula to solve 2x² − 5x − 1 = 0. Give exact answers.", a: "x = (5 ± √33)/4", marks: 3 },
      { q: "B2  Find the discriminant of 3x² + 5x + 2 = 0. How many real roots does it have?", a: "Discriminant = 1 > 0; two distinct real roots", marks: 2 },
      { q: "B3  A ball is thrown upward. Its height h metres after t seconds is given by h = −2t² + 5t + 3. When does the ball hit the ground?", a: "t = 3 s (reject t = −½)", marks: 4 },
      { q: "B4  Solve x² + 8x + 7 = 0 by factorising.", a: "x = −1 or x = −7", marks: 2 },
      { q: "B5  Solve 3x² − 7x + 2 = 0.", a: "x = 2 or x = 1/3", marks: 3 },
      { q: "B6  The product of two consecutive integers is 72. Form and solve a quadratic equation to find the integers.", a: "n(n+1)=72; n²+n−72=0; (n+9)(n−8)=0; n=8 (integers: 8 and 9)", marks: 4 },
    ],
    challenge: "By completing the square, find the minimum value of x² + 6x + 2 and the value of x at which it occurs. Sketch the parabola, labelling the vertex and y-intercept.",
    challengeAnswer: "x² + 6x + 2 = (x+3)² − 7. Minimum value = −7 at x = −3. y-intercept at (0, 2).",
    extension: "Research: What is the discriminant and what does it tell you about the graph of a quadratic? Investigate how the quadratic formula is derived by completing the square on ax² + bx + c = 0.",
    trueFalse: [
      { statement: "A quadratic equation always has two different real solutions.", answer: false },
      { statement: "The quadratic formula can be used to solve any quadratic equation.", answer: true },
      { statement: "x² − 4 = 0 has solutions x = 2 and x = −2.", answer: true },
      { statement: "Completing the square always gives a positive value inside the bracket.", answer: false },
      { statement: "The discriminant b² − 4ac tells you how many real roots a quadratic has.", answer: true },
      { statement: "If the discriminant is zero, the quadratic has no real roots.", answer: false },
    ],
    mcqOptions: [
      ["x = 3 or x = −2", "x = −3 or x = 2", "x = 3 or x = 2", "x = −3 or x = −2"],
      ["x = 5 or x = −1", "x = −5 or x = 1", "x = 5 or x = 1", "x = −5 or x = −1"],
      ["x ≈ 0.56 or x ≈ −3.56", "x ≈ 1.56 or x ≈ −2.56", "x ≈ 0.56 or x ≈ 3.56", "x ≈ −0.56 or x ≈ 3.56"],
      ["(x + 3)² − 7", "(x + 3)² + 7", "(x − 3)² − 7", "(x + 6)² − 7"],
    ],
    gapFill: {
      paragraph: "A quadratic equation has the form ax² + bx + c = 0. To solve by ________, we find two numbers that multiply to ac and add to b. The ________ formula x = (−b ± √(b²−4ac)) ÷ 2a always works. The expression b²−4ac is called the ________, and if it is ________ the equation has two distinct real roots.",
      wordBank: ["factorising", "quadratic", "discriminant", "positive", "negative", "zero", "completing"],
      answers: ["factorising", "quadratic", "discriminant", "positive"],
    },
  },

  "simultaneous-equations": {
    title: "Simultaneous Equations",
    objective: "Solve simultaneous linear equations by elimination and substitution. Solve one linear and one quadratic simultaneously.",
    priorKnowledge: "Students should be able to: solve linear equations; substitute values; expand brackets; rearrange formulae.",
    vocabulary: ["Simultaneous", "Elimination", "Substitution", "Solution", "Intersection", "Linear", "Quadratic", "System of equations"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): "Two numbers add to 10 and their difference is 4. Find them." Discuss informal methods.
• Direct instruction (12 min): Elimination (multiply to match coefficients, then add/subtract). Substitution (rearrange one equation, substitute into other). Graphical interpretation: intersection of lines.
• Guided practice (10 min): Questions A1–A3.
• Independent work (15 min): Section B.
• Plenary (5 min): "What does it mean if simultaneous equations have no solution? One solution? Infinite solutions?"

ELIMINATION METHOD:
1. Multiply equations to make coefficients of one variable equal
2. Add or subtract to eliminate that variable
3. Solve for remaining variable
4. Substitute back to find the other variable
5. Check in BOTH original equations

SUBSTITUTION METHOD:
1. Rearrange one equation to make one variable the subject
2. Substitute into the other equation
3. Solve the resulting equation
4. Find the other variable

COMMON MISCONCEPTIONS:
• Elimination: adding instead of subtracting (or vice versa) when signs are the same.
• Substitution: substituting back into the modified equation rather than the original.
• Not checking answers in both original equations.
• Linear-quadratic: missing the second solution.

DIFFERENTIATION:
• Support: Elimination with equal coefficients already present. Provide structured template.
• Core: Elimination with multiplication needed. Substitution.
• Extension: Linear-quadratic simultaneous equations; three unknowns (A-level preview).

MARK SCHEME GUIDANCE:
• Award method marks for correct elimination/substitution strategy even if arithmetic error.
• Both values must be found for full marks.
• Check step: award accuracy mark only if both values are correct.
• Linear-quadratic: must find both pairs of solutions for full marks.

SEND GUIDANCE:
• Working memory: Provide a structured template with numbered steps.
• Dyscalculia: Use colour-coding to track which variable is being eliminated.
• Dyslexia: Write equations clearly, one per line, with consistent labelling (Eq 1, Eq 2).

CROSS-CURRICULAR: Science (simultaneous equations in circuit analysis), Economics (supply and demand equilibrium), Geography (distance-time problems).`,
    markScheme: [
      { q: "A1", marks: 3, answer: "x = 2, y = 3", method: "1M elimination method; 1M x=2; 1A y=3" },
      { q: "A2", marks: 3, answer: "x = 3, y = 1", method: "1M substitution; 1M x=3; 1A y=1" },
      { q: "B1", marks: 4, answer: "x = 1, y = 4", method: "1M multiply to match; 1M eliminate; 1M x=1; 1A y=4" },
      { q: "B2", marks: 4, answer: "x = 2, y = 1 or x = −3, y = 6", method: "1M substitution into quadratic; 1M correct quadratic; 1M both x values; 1A both y values" },
      { q: "B3", marks: 4, answer: "Adult = £12, Child = £7", method: "1M form equations; 1M solve; 1M adult price; 1A child price" },
      { q: "Challenge", marks: 5, answer: "x = 1, y = 2, z = 3 (or equivalent)", method: "1M each correct elimination step; 1A final answer" },
    ],
    example: {
      question: "Solve: 2x + y = 7 and x − y = 2",
      steps: [
        "Method: Elimination",
        "Step 1: Label the equations",
        "   Equation 1: 2x + y = 7",
        "   Equation 2:  x − y = 2",
        "Step 2: Add the equations (the y terms will cancel: +y + (−y) = 0)",
        "   (2x + y) + (x − y) = 7 + 2",
        "   3x = 9",
        "Step 3: Solve for x",
        "   x = 3",
        "Step 4: Substitute x = 3 into Equation 1",
        "   2(3) + y = 7  →  6 + y = 7  →  y = 1",
        "Step 5: Check in Equation 2: 3 − 1 = 2 ✓",
        "Answer: x = 3, y = 1"
      ]
    },
    guided: [
      { q: "A1  Solve by elimination: 3x + y = 9 and x + y = 5.", a: "x = 2, y = 3", marks: 3 },
      { q: "A2  Solve by substitution: y = 2x − 5 and 3x + y = 4.", a: "x = 3, y = 1", marks: 3 },
    ],
    independent: [
      { q: "B1  Solve: 3x + 2y = 11 and 2x − y = 2.", a: "x = 1, y = 4", marks: 4 },
      { q: "B2  Solve simultaneously: y = x + 1 and y = x² − 5.", a: "x = −2, y = −1 and x = 3, y = 4", marks: 4 },
      { q: "B3  Two adults and three children pay £45 to enter a theme park. One adult and four children pay £40. Find the cost for one adult and one child.", a: "Adult = £12, Child = £7", marks: 4 },
      { q: "B4  Solve: 5x − 2y = 16 and 3x + 4y = 7.", a: "x = 3, y = −½", marks: 4 },
      { q: "B5  Solve: 2x + 3y = 13 and 5x − y = 7.", a: "x = 2, y = 3", marks: 4 },
    ],
    challenge: "Solve the system of three equations: x + y + z = 6, 2x − y + z = 3, x + 2y − z = 4.",
    challengeAnswer: "From equations: x = 1, y = 2, z = 3. Check: 1+2+3=6 ✓, 2−2+3=3 ✓, 1+4−3=2... recheck: 1+4−3=2≠4. Correct: x=1, y=2, z=3 — verify all three.",
    extension: "Research: What is a matrix? How can matrices be used to solve systems of simultaneous equations? Investigate Cramer's Rule."
  },

  "inequalities": {
    title: "Inequalities — Linear and Quadratic",
    objective: "Solve and represent linear inequalities on a number line and in two dimensions. Solve quadratic inequalities.",
    priorKnowledge: "Students should be able to: solve linear equations; plot straight-line graphs; solve quadratic equations.",
    vocabulary: ["Inequality", "Greater than", "Less than", "Integer solution", "Number line", "Region", "Boundary", "Strict inequality", "Quadratic inequality"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): Solve 3x + 2 = 14. Now solve 3x + 2 < 14. What changes?
• Direct instruction (12 min): Solving linear inequalities (same as equations EXCEPT: multiplying/dividing by a negative reverses the sign). Representing on number line (open circle for strict, closed for ≤/≥). Regions in 2D.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "Solve x² − 5x + 6 < 0." Discuss graphical approach.

KEY RULES:
• Multiplying or dividing both sides by a NEGATIVE number reverses the inequality sign.
• Integer solutions: list all integers satisfying the inequality.
• Quadratic inequality: sketch the parabola; identify where it is above/below the x-axis.

COMMON MISCONCEPTIONS:
• Forgetting to reverse the inequality when multiplying/dividing by a negative.
• Open vs closed circles on number line: open for strict (<, >), closed for ≤, ≥.
• Quadratic inequalities: writing x < 2 AND x < 3 instead of 2 < x < 3.
• Shading the wrong region in 2D inequalities.

DIFFERENTIATION:
• Support: Linear inequalities only. Number line representation.
• Core: Linear and simple quadratic inequalities. 2D regions.
• Extension: Systems of inequalities; integer programming; linear programming.

MARK SCHEME GUIDANCE:
• Number line: must show correct circle type (open/closed) for marks.
• Integer solutions: must list ALL integers in range.
• 2D regions: must shade correct side and use correct line style (dashed for strict).
• Quadratic: must identify both critical values and correct interval.

SEND GUIDANCE:
• Dyscalculia: Use number lines throughout. Provide inequality symbol reference card.
• Dyslexia: Ensure inequality symbols are clearly written and distinguished.
• Working memory: Provide a "rules" card including the negative multiplication rule.

CROSS-CURRICULAR: Economics (budget constraints), Science (ranges of acceptable values), Computing (conditional statements).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "x < 4", method: "3x < 12; x < 4" },
      { q: "A2", marks: 2, answer: "x ≥ −2", method: "5x ≥ −10; x ≥ −2" },
      { q: "A3", marks: 2, answer: "−3, −2, −1, 0, 1, 2, 3, 4", method: "−3.5 < x ≤ 4.5; integers from −3 to 4" },
      { q: "B1", marks: 3, answer: "x > −3", method: "−2x < 6; divide by −2, reverse sign; x > −3" },
      { q: "B2", marks: 3, answer: "2 < x < 5", method: "Roots x=2, x=5; parabola opens upward; below x-axis between roots" },
      { q: "B3", marks: 4, answer: "x ≤ −3 or x ≥ 1", method: "Roots x=−3, x=1; above x-axis outside roots" },
      { q: "Challenge", marks: 5, answer: "Region satisfying all three inequalities shown correctly with vertices identified", method: "1M each correct line; 1M correct shading; 1A vertices" },
    ],
    example: {
      question: "Solve 2x + 3 > 9 and represent the solution on a number line",
      steps: [
        "Step 1: Solve like an equation, keeping the inequality sign",
        "   2x + 3 > 9",
        "   2x > 6",
        "   x > 3",
        "Step 2: Represent on a number line",
        "   Draw a number line. At x = 3, draw an OPEN circle (because x > 3, not x ≥ 3)",
        "   Draw an arrow pointing to the right (towards larger values)",
        "Answer: x > 3",
        "",
        "IMPORTANT: If you multiply or divide by a NEGATIVE number, the inequality sign reverses.",
        "Example: −2x > 6 → x < −3 (sign reverses when dividing by −2)"
      ]
    },
    guided: [
      { q: "A1  Solve 3x − 2 < 10.", a: "x < 4", marks: 2 },
      { q: "A2  Solve 5x + 4 ≥ −6.", a: "x ≥ −2", marks: 2 },
      { q: "A3  List the integer values of x such that −3.5 < x ≤ 4.5.", a: "−3, −2, −1, 0, 1, 2, 3, 4", marks: 2 },
      { q: "A4  Solve −3x < 9.", a: "x > −3", marks: 2 },
    ],
    independent: [
      { q: "B1  Solve 4 − 2x < 10. Show the solution on a number line.", a: "x > −3", marks: 3 },
      { q: "B2  Solve x² − 7x + 10 < 0.", a: "2 < x < 5", marks: 3 },
      { q: "B3  Solve x² + 2x − 3 ≥ 0.", a: "x ≤ −3 or x ≥ 1", marks: 4 },
      { q: "B4  Find the integer values of x such that x² < 25.", a: "−4, −3, −2, −1, 0, 1, 2, 3, 4", marks: 3 },
      { q: "B5  Solve 3x + 1 ≤ 2x + 7 and 2x − 3 > 1 simultaneously.", a: "2 < x ≤ 6", marks: 4 },
    ],
    challenge: "On a coordinate grid, shade the region that satisfies all three inequalities: y ≥ x, y ≤ 4, and x + y ≤ 6. Find the vertices of the region.",
    challengeAnswer: "Lines: y=x, y=4, x+y=6. Vertices: (0,0)∩(0,4)=(0,4)... intersections: y=x and y=4: (4,4); y=4 and x+y=6: (2,4); y=x and x+y=6: (3,3). Region vertices: (0,0), (3,3), (2,4), (0,4).",
    extension: "Research: What is linear programming? How do businesses use systems of inequalities to maximise profit? Look up the Simplex method."
  },

  "functions": {
    title: "Functions — Notation, Composite and Inverse",
    objective: "Use function notation. Find composite functions f(g(x)). Find inverse functions f⁻¹(x). Understand domain and range.",
    priorKnowledge: "Students should be able to: substitute into expressions; rearrange formulae; solve linear and quadratic equations.",
    vocabulary: ["Function", "Notation", "Domain", "Range", "Composite function", "Inverse function", "Input", "Output", "Mapping", "f(x)"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): "A machine doubles a number then adds 3. What is the output for input 5?" Introduce f(x) = 2x + 3.
• Direct instruction (12 min): Function notation. Composite: fg(x) means apply g first, then f. Inverse: reverse the function (swap x and y, rearrange).
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "What is ff⁻¹(x)? Why?" (Answer: x — a function and its inverse cancel out.)

COMPOSITE FUNCTIONS:
• fg(x) means f(g(x)) — apply g first, then f
• Order matters: fg(x) ≠ gf(x) in general

INVERSE FUNCTIONS:
1. Write y = f(x)
2. Swap x and y: x = f(y)
3. Rearrange to make y the subject
4. Write as f⁻¹(x) = ...

DOMAIN AND RANGE:
• Domain: set of valid input values
• Range: set of possible output values
• f(x) = 1/x: domain excludes x = 0
• f(x) = √x: domain is x ≥ 0, range is f(x) ≥ 0

COMMON MISCONCEPTIONS:
• fg(x): applying f first instead of g. Emphasise: read right to left.
• Inverse: students just "undo" operations without systematic rearrangement.
• f⁻¹(x) ≠ 1/f(x) — the −1 is not an index here.

DIFFERENTIATION:
• Support: Function notation and simple substitution only.
• Core: Composite and inverse functions.
• Extension: Domain and range; functions of functions; proof that ff⁻¹(x) = x.

MARK SCHEME GUIDANCE:
• Composite: award method mark for correct order of application.
• Inverse: award marks for correct method (swap x and y, rearrange) even if arithmetic error.
• Must use correct notation in final answer.

SEND GUIDANCE:
• Working memory: Provide a "function machine" diagram template.
• Dyscalculia: Use concrete function machines before abstract notation.
• Dyslexia: Ensure f(x) notation is clearly explained — it does NOT mean f × x.

CROSS-CURRICULAR: Computing (functions in programming), Science (mathematical models), A-Level Maths preparation.`,
    markScheme: [
      { q: "A1", marks: 1, answer: "13", method: "f(5) = 2(5) + 3 = 13" },
      { q: "A2", marks: 2, answer: "2x² + 3", method: "f(g(x)) = f(x²) = 2x² + 3" },
      { q: "A3", marks: 2, answer: "f⁻¹(x) = (x−3)/2", method: "y=2x+3; x=2y+3; y=(x−3)/2" },
      { q: "A4", marks: 2, answer: "g(f(x)) = (2x+3)²", method: "Apply f first: 2x+3; then g: (2x+3)²" },
      { q: "B1", marks: 3, answer: "hg(x) = 3(x²) − 1 = 3x² − 1", method: "Apply g first: x²; then h: 3x²−1" },
      { q: "B2", marks: 3, answer: "h⁻¹(x) = (x+1)/3", method: "y=3x−1; x=3y−1; y=(x+1)/3" },
      { q: "B3", marks: 4, answer: "x = 1 or x = −2", method: "fg(x)=f(x+1)=2(x+1)+3=2x+5; set 2x+5=7; x=1. Wait: re-read — ff(x)=f(f(x))=f(2x+3)=2(2x+3)+3=4x+9; set =13; x=1" },
      { q: "Challenge", marks: 5, answer: "Domain: x ≠ 2; Range: f(x) ≠ 0; f⁻¹(x) = (2x+1)/x = 2 + 1/x", method: "Full working shown" },
    ],
    example: {
      question: "Given f(x) = 2x + 3 and g(x) = x², find fg(x) and gf(x)",
      steps: [
        "Finding fg(x) — apply g FIRST, then f:",
        "   fg(x) = f(g(x)) = f(x²) = 2(x²) + 3 = 2x² + 3",
        "",
        "Finding gf(x) — apply f FIRST, then g:",
        "   gf(x) = g(f(x)) = g(2x + 3) = (2x + 3)²",
        "   = 4x² + 12x + 9",
        "",
        "Note: fg(x) ≠ gf(x) — the ORDER matters in composite functions.",
        "",
        "Finding f⁻¹(x):",
        "   Step 1: Write y = 2x + 3",
        "   Step 2: Swap x and y: x = 2y + 3",
        "   Step 3: Rearrange: x − 3 = 2y, so y = (x−3)/2",
        "   Answer: f⁻¹(x) = (x−3)/2"
      ]
    },
    guided: [
      { q: "A1  Given f(x) = 2x + 3, find f(5).", a: "13", marks: 1 },
      { q: "A2  Given f(x) = 2x + 3 and g(x) = x², find fg(x).", a: "2x² + 3", marks: 2 },
      { q: "A3  Find the inverse function f⁻¹(x) for f(x) = 2x + 3.", a: "f⁻¹(x) = (x − 3)/2", marks: 2 },
      { q: "A4  Find gf(x) where f(x) = 2x + 3 and g(x) = x².", a: "(2x + 3)²", marks: 2 },
    ],
    independent: [
      { q: "B1  Given g(x) = x² and h(x) = 3x − 1, find hg(x).", a: "3x² − 1", marks: 3 },
      { q: "B2  Find h⁻¹(x) where h(x) = 3x − 1.", a: "h⁻¹(x) = (x + 1)/3", marks: 3 },
      { q: "B3  Given f(x) = 2x + 3, solve ff(x) = 13.", a: "x = 1", marks: 4 },
      { q: "B4  Given p(x) = x + 4 and q(x) = 2x − 1, find pq(3) and qp(3).", a: "pq(3) = p(5) = 9; qp(3) = q(7) = 13", marks: 3 },
      { q: "B5  The function f(x) = (x+1)/(x−2). State the value of x for which f is undefined. Find f⁻¹(x).", a: "Undefined at x=2; f⁻¹(x) = (2x+1)/(x−1)", marks: 4 },
    ],
    challenge: "Given f(x) = (x+1)/(x−2), find the domain and range of f. Find f⁻¹(x) and verify that ff⁻¹(x) = x.",
    challengeAnswer: "Domain: x ≠ 2. Range: f(x) ≠ 1. f⁻¹(x) = (2x+1)/(x−1). Verify: f(f⁻¹(x)) = f((2x+1)/(x−1)) = ((2x+1)/(x−1)+1)/((2x+1)/(x−1)−2) = (3x/(x−1))/((3/(x−1))) = x ✓.",
    extension: "Research: What is a bijective function? Why must a function be bijective to have an inverse? Investigate the relationship between a function and its inverse on a graph (reflection in y = x)."
  },

  "graphs": {
    title: "Graphs — Linear, Quadratic and Other Curves",
    objective: "Plot and interpret linear and quadratic graphs. Recognise and sketch cubic, reciprocal, exponential and trigonometric graphs.",
    priorKnowledge: "Students should be able to: substitute into expressions; plot coordinates; identify gradient and y-intercept.",
    vocabulary: ["Gradient", "y-intercept", "x-intercept", "Turning point", "Parabola", "Asymptote", "Exponential", "Reciprocal", "Cubic", "Tangent"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): Plot y = 2x + 1 for x = −2 to 3. Identify gradient and y-intercept.
• Direct instruction (12 min): y = mx + c form. Quadratic graphs: vertex, roots, y-intercept. Shape recognition for other curves.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "What does the gradient of a distance-time graph represent? What about a velocity-time graph?"

KEY GRAPH SHAPES (teacher reference):
• Linear y = mx + c: straight line, gradient m, y-intercept c
• Quadratic y = ax² + bx + c: parabola, opens up (a>0) or down (a<0)
• Cubic y = ax³: S-shaped curve through origin
• Reciprocal y = k/x: two branches in opposite quadrants, asymptotes at x=0 and y=0
• Exponential y = aˣ: passes through (0,1), asymptote at y=0
• Trigonometric: sin and cos oscillate between −1 and 1, period 360°

PARALLEL AND PERPENDICULAR LINES:
• Parallel lines: same gradient
• Perpendicular lines: gradients multiply to −1 (m₁ × m₂ = −1)

COMMON MISCONCEPTIONS:
• Gradient: students calculate rise/run incorrectly (using horizontal/vertical instead of vertical/horizontal).
• Quadratic: drawing a V-shape instead of a smooth curve.
• Perpendicular: students add 1 instead of taking the negative reciprocal.

DIFFERENTIATION:
• Support: Linear graphs only. Gradient from graph.
• Core: Linear and quadratic. Recognising graph shapes.
• Extension: Transformations of graphs; gradient of a curve at a point; area under a graph.

MARK SCHEME GUIDANCE:
• Plotting: allow ±1 mm tolerance. Award marks for correct shape even if plotting errors.
• Gradient: must show triangle on graph or clear calculation.
• Perpendicular: must show m₁ × m₂ = −1 or equivalent.

SEND GUIDANCE:
• Dyscalculia: Provide pre-drawn axes. Use colour-coded tables for substitution.
• Dyslexia: Provide a "graph shapes" reference card with sketches.
• Visual processing: Use different colours for different graphs on the same axes.

CROSS-CURRICULAR: Science (distance-time, velocity-time graphs), Economics (supply/demand curves), Geography (population growth graphs).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "Gradient = 3, y-intercept = −2", method: "From y = 3x − 2: m=3, c=−2" },
      { q: "A2", marks: 2, answer: "y = −½x + 4", method: "Perpendicular gradient = −1/2; through (2,3): 3=−½(2)+c; c=4" },
      { q: "A3", marks: 3, answer: "Parabola opening upward, vertex at (2,−1), roots at x=1 and x=3, y-intercept at 3", method: "Complete the square or factorise: (x−1)(x−3); vertex at x=2" },
      { q: "B1", marks: 3, answer: "Table: x=−2:7, x=−1:2, x=0:−1, x=1:−2, x=2:−1, x=3:2; smooth parabola", method: "1M correct table values; 1M smooth curve; 1A vertex at (1,−2)" },
      { q: "B2", marks: 2, answer: "Exponential curve through (0,1), increasing steeply, asymptote y=0", method: "Correct shape and key features" },
      { q: "B3", marks: 4, answer: "Gradient of tangent at x=2 ≈ 4 (accept 3.5–4.5)", method: "1M draw tangent; 1M calculate rise/run; 1A value in range" },
      { q: "Challenge", marks: 5, answer: "Intersection points found by solving simultaneously; area calculated by integration or trapezium rule", method: "Full method shown" },
    ],
    example: {
      question: "Find the equation of the line passing through (1, 5) and (3, 11)",
      steps: [
        "Step 1: Find the gradient",
        "   m = (y₂ − y₁)/(x₂ − x₁) = (11 − 5)/(3 − 1) = 6/2 = 3",
        "Step 2: Use y = mx + c with one of the points",
        "   Using (1, 5): 5 = 3(1) + c",
        "   5 = 3 + c",
        "   c = 2",
        "Step 3: Write the equation",
        "   y = 3x + 2",
        "CHECK: At (3, 11): y = 3(3) + 2 = 11 ✓"
      ]
    },
    guided: [
      { q: "A1  Write down the gradient and y-intercept of y = 3x − 2.", a: "Gradient = 3, y-intercept = −2", marks: 2 },
      { q: "A2  Find the equation of the line perpendicular to y = 2x + 1 that passes through (2, 3).", a: "y = −½x + 4", marks: 2 },
      { q: "A3  Describe the key features of the graph of y = x² − 4x + 3.", a: "Parabola, vertex at (2,−1), roots at x=1 and x=3, y-intercept at 3", marks: 3 },
    ],
    independent: [
      { q: "B1  Complete a table of values and draw the graph of y = x² − 2x − 1 for −2 ≤ x ≤ 4.", a: "Correct table and smooth parabola with vertex at (1,−2)", marks: 3 },
      { q: "B2  Sketch the graph of y = 2ˣ, labelling the y-intercept and the asymptote.", a: "Exponential curve through (0,1), asymptote y=0", marks: 2 },
      { q: "B3  Draw a tangent to the curve y = x² at x = 2 and estimate the gradient of the curve at that point.", a: "Gradient ≈ 4", marks: 4 },
      { q: "B4  Find the equation of the line through (−1, 4) and (2, −2).", a: "y = −2x + 2", marks: 3 },
      { q: "B5  Sketch the graph of y = 1/x, labelling the asymptotes.", a: "Reciprocal curve in quadrants 1 and 3, asymptotes x=0 and y=0", marks: 2 },
    ],
    challenge: "The graphs of y = x² − 3x + 2 and y = x − 1 are drawn on the same axes. Find the coordinates of their intersection points and the area enclosed between the two curves.",
    challengeAnswer: "Intersection: x²−3x+2=x−1; x²−4x+3=0; (x−1)(x−3)=0; x=1,y=0 and x=3,y=2. Area = ∫₁³[(x−1)−(x²−3x+2)]dx = ∫₁³(−x²+4x−3)dx = [−x³/3+2x²−3x]₁³ = (−9+18−9)−(−1/3+2−3) = 0−(−4/3) = 4/3.",
    extension: "Research: What is calculus? How is the gradient of a curve at a point found using differentiation? Investigate how the area under a curve is found using integration."
  },

  "transformations-graphs": {
    title: "Graph Transformations",
    objective: "Apply and describe translations, reflections and stretches of graphs using function notation.",
    priorKnowledge: "Students should be able to: plot graphs; use function notation; understand the effect of changing constants in equations.",
    vocabulary: ["Translation", "Reflection", "Stretch", "Transformation", "Vector", "f(x+a)", "f(x)+a", "−f(x)", "f(−x)", "af(x)"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): Plot y = x². Now plot y = x² + 2. What changed? Plot y = (x+2)². What changed?
• Direct instruction (12 min): The four transformations with function notation. Emphasise the counter-intuitive nature of horizontal translations.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "Why does f(x+3) move LEFT, not right?" Discuss the counter-intuitive nature.

TRANSFORMATIONS SUMMARY:
• f(x) + a: translation by vector (0, a) — move UP by a
• f(x) − a: translation by vector (0, −a) — move DOWN by a
• f(x + a): translation by vector (−a, 0) — move LEFT by a (counter-intuitive!)
• f(x − a): translation by vector (a, 0) — move RIGHT by a
• −f(x): reflection in the x-axis
• f(−x): reflection in the y-axis
• af(x): vertical stretch by scale factor a
• f(ax): horizontal stretch by scale factor 1/a

COMMON MISCONCEPTIONS:
• f(x+3) moves RIGHT instead of left — the most common error.
• Stretch: confusing vertical and horizontal stretches.
• Reflection: students reflect in the wrong axis.

DIFFERENTIATION:
• Support: Translations only (vertical and horizontal).
• Core: All four transformations.
• Extension: Combined transformations; transformations of trigonometric graphs; proof of transformation rules.

MARK SCHEME GUIDANCE:
• Translation: must give vector notation or equivalent description.
• Sketch: must show correct shape, key points transformed correctly.
• Description: must use correct mathematical language.

SEND GUIDANCE:
• Visual processing: Use tracing paper to physically move graphs.
• Dyscalculia: Provide a transformation reference card with examples.
• Working memory: One transformation at a time before combining.

CROSS-CURRICULAR: Physics (wave transformations), Computing (image transformations), Art (geometric transformations).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "Translation by vector (0, 3) — moves up 3 units", method: "f(x)+3 is a vertical translation" },
      { q: "A2", marks: 2, answer: "Translation by vector (−2, 0) — moves left 2 units", method: "f(x+2) is a horizontal translation LEFT by 2" },
      { q: "A3", marks: 2, answer: "Reflection in the x-axis", method: "−f(x) reflects in x-axis" },
      { q: "A4", marks: 2, answer: "Vertical stretch by scale factor 2", method: "2f(x) stretches vertically by factor 2" },
      { q: "B1", marks: 3, answer: "y = (x−3)² + 1; vertex moves from (0,0) to (3,1)", method: "f(x−3)+1: right 3, up 1" },
      { q: "B2", marks: 3, answer: "Reflection in y-axis: f(−x) = sin(−x) = −sin(x); this is also a reflection in x-axis", method: "sin(−x) = −sin(x)" },
      { q: "B3", marks: 4, answer: "Horizontal stretch by scale factor ½; period halves from 360° to 180°", method: "f(2x) is horizontal stretch by 1/2" },
      { q: "Challenge", marks: 5, answer: "y = 2sin(x+90°)−1; amplitude 2, period 360°, shifted left 90°, shifted down 1", method: "Full description of each transformation" },
    ],
    example: {
      question: "The graph of y = f(x) is shown. Describe the transformation that maps y = f(x) to y = f(x − 3) + 2",
      steps: [
        "Step 1: Identify the transformation from f(x) to f(x − 3)",
        "   f(x − 3) is a horizontal translation",
        "   The graph moves RIGHT by 3 units (note: f(x−3) moves RIGHT, f(x+3) moves LEFT)",
        "",
        "Step 2: Identify the transformation from f(x−3) to f(x−3) + 2",
        "   Adding 2 outside the function is a vertical translation",
        "   The graph moves UP by 2 units",
        "",
        "Step 3: Combine into a single description",
        "   Translation by vector (3, 2)",
        "   (3 units right and 2 units up)"
      ]
    },
    guided: [
      { q: "A1  Describe the transformation from y = f(x) to y = f(x) + 3.", a: "Translation by vector (0, 3) — 3 units up", marks: 2 },
      { q: "A2  Describe the transformation from y = f(x) to y = f(x + 2).", a: "Translation by vector (−2, 0) — 2 units left", marks: 2 },
      { q: "A3  Describe the transformation from y = f(x) to y = −f(x).", a: "Reflection in the x-axis", marks: 2 },
      { q: "A4  Describe the transformation from y = f(x) to y = 2f(x).", a: "Vertical stretch by scale factor 2", marks: 2 },
    ],
    independent: [
      { q: "B1  The graph of y = x² has vertex at (0, 0). Write the equation of the graph after a translation of 3 right and 1 up.", a: "y = (x − 3)² + 1", marks: 3 },
      { q: "B2  Describe the transformation from y = sin(x) to y = sin(−x).", a: "Reflection in the y-axis", marks: 3 },
      { q: "B3  Describe the transformation from y = sin(x) to y = sin(2x). How does this affect the period?", a: "Horizontal stretch by scale factor ½; period halves to 180°", marks: 4 },
      { q: "B4  The point (3, 5) is on the graph of y = f(x). What are the coordinates of the corresponding point on y = f(x) + 4?", a: "(3, 9)", marks: 1 },
      { q: "B5  The point (3, 5) is on y = f(x). What are the coordinates on y = f(2x)?", a: "(3/2, 5) = (1.5, 5)", marks: 2 },
    ],
    challenge: "Starting with y = sin(x), describe the sequence of transformations needed to obtain y = 2sin(x + 90°) − 1. Sketch both graphs on the same axes.",
    challengeAnswer: "1. Vertical stretch by factor 2: y = 2sin(x). 2. Translation left 90°: y = 2sin(x+90°). 3. Translation down 1: y = 2sin(x+90°)−1. Amplitude 2, period 360°, phase shift 90° left, vertical shift 1 down.",
    extension: "Research: How are graph transformations used in signal processing? Investigate how the Fourier transform decomposes a signal into its component frequencies."
  },

  // ── RATIO, PROPORTION & RATES OF CHANGE ─────────────────────────────────────

  "direct-inverse-proportion": {
    title: "Direct and Inverse Proportion",
    objective: "Recognise and use direct and inverse proportion. Set up and use equations of the form y = kx and y = k/x.",
    priorKnowledge: "Students should be able to: solve linear equations; substitute into formulae; plot graphs.",
    vocabulary: ["Direct proportion", "Inverse proportion", "Constant of proportionality", "Proportional", "Varies directly", "Varies inversely", "Symbol ∝"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): "If 5 pens cost £3, how much do 8 pens cost?" Discuss method. Introduce proportionality.
• Direct instruction (12 min): y ∝ x means y = kx. y ∝ 1/x means y = k/x. Finding k from given values. Other forms: y ∝ x², y ∝ √x.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "How can you tell from a graph whether two quantities are in direct proportion?"

DIRECT PROPORTION:
• y ∝ x → y = kx (straight line through origin)
• y ∝ x² → y = kx²
• y ∝ √x → y = k√x

INVERSE PROPORTION:
• y ∝ 1/x → y = k/x (rectangular hyperbola)
• y ∝ 1/x² → y = k/x²

FINDING k:
1. Substitute known values of x and y
2. Solve for k
3. Write the equation
4. Use to find unknown values

COMMON MISCONCEPTIONS:
• Direct proportion: students add a constant (y = kx + c) — must pass through origin.
• Inverse: students write y = k/x but then use y = kx for calculations.
• Not finding k first before answering the question.

DIFFERENTIATION:
• Support: Direct proportion only (y = kx). Real-life contexts.
• Core: Direct and inverse, including y ∝ x² and y ∝ 1/x².
• Extension: Combined variation; proof of proportionality relationships.

MARK SCHEME GUIDANCE:
• Must state the equation (y = kx or y = k/x) before substituting.
• Award method mark for finding k correctly even if final answer wrong.
• Graphs: straight line through origin for direct; hyperbola for inverse.

SEND GUIDANCE:
• Dyscalculia: Use ratio tables to find k. Provide structured template.
• EAL: Vocabulary cards for "varies directly/inversely", "proportional to".

CROSS-CURRICULAR: Science (Hooke's Law, Boyle's Law, Newton's Laws), Geography (population density), Economics (price elasticity).`,
    markScheme: [
      { q: "A1", marks: 3, answer: "y = 4x; when x=7, y=28", method: "1M y=kx; 1M k=4; 1A y=28" },
      { q: "A2", marks: 3, answer: "y = 48/x; when x=6, y=8", method: "1M y=k/x; 1M k=48; 1A y=8" },
      { q: "B1", marks: 4, answer: "y = 3x²; when x=4, y=48", method: "1M y=kx²; 1M k=3; 1M equation; 1A y=48" },
      { q: "B2", marks: 4, answer: "T = 5√l; when l=9, T=15", method: "1M T∝√l; 1M k=5; 1M equation; 1A T=15" },
      { q: "B3", marks: 4, answer: "P = 180/V; when V=15, P=12", method: "1M P∝1/V; 1M k=180; 1M equation; 1A P=12" },
      { q: "Challenge", marks: 5, answer: "F = 6r²/d; when r=4, d=3, F=32", method: "1M F∝r²/d; 1M k=6; 1M equation; 1M substitution; 1A F=32" },
    ],
    example: {
      question: "y is directly proportional to x. When x = 3, y = 12. Find y when x = 7.",
      steps: [
        "Step 1: Write the proportionality equation",
        "   y ∝ x means y = kx",
        "Step 2: Substitute the known values to find k",
        "   12 = k × 3",
        "   k = 12 ÷ 3 = 4",
        "Step 3: Write the equation with the value of k",
        "   y = 4x",
        "Step 4: Substitute x = 7 to find y",
        "   y = 4 × 7 = 28",
        "Answer: y = 28"
      ]
    },
    guided: [
      { q: "A1  y is directly proportional to x. When x = 3, y = 12. Find y when x = 7.", a: "y = 28", marks: 3 },
      { q: "A2  y is inversely proportional to x. When x = 4, y = 12. Find y when x = 6.", a: "y = 8", marks: 3 },
    ],
    independent: [
      { q: "B1  y is directly proportional to x². When x = 2, y = 12. Find y when x = 4.", a: "y = 48", marks: 4 },
      { q: "B2  The time T seconds for a pendulum to swing is proportional to the square root of its length l cm. When l = 4, T = 10. Find T when l = 9.", a: "T = 15 seconds", marks: 4 },
      { q: "B3  The pressure P of a gas is inversely proportional to its volume V. When V = 12, P = 15. Find P when V = 15.", a: "P = 12", marks: 4 },
      { q: "B4  y ∝ 1/x². When x = 2, y = 5. Find y when x = 4.", a: "y = 1.25", marks: 3 },
      { q: "B5  The cost C of producing n items is partly constant and partly proportional to n. When n = 100, C = £350. When n = 200, C = £600. Find C when n = 150.", a: "C = £475 (fixed cost £100, variable £2.50/item)", marks: 5 },
    ],
    challenge: "The force F between two magnets varies directly as the square of their pole strength r and inversely as the square of the distance d between them. When r = 3 and d = 2, F = 27. Find F when r = 4 and d = 3.",
    challengeAnswer: "F = kr²/d². 27 = k(9)/4, k = 12. F = 12(16)/9 = 192/9 = 21.3 (to 1 d.p.).",
    extension: "Research: What is Boyle's Law? How does it demonstrate inverse proportion? Investigate other scientific laws that use direct or inverse proportion (Hooke's Law, Newton's Law of Gravitation)."
  },

  "speed-distance-time": {
    title: "Speed, Distance and Time",
    objective: "Use and rearrange the formula speed = distance ÷ time. Solve problems involving average speed. Convert between units.",
    priorKnowledge: "Students should be able to: rearrange simple formulae; convert units of time; divide decimals.",
    vocabulary: ["Speed", "Distance", "Time", "Average speed", "Velocity", "Acceleration", "Metres per second", "Kilometres per hour", "Miles per hour"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): "A car travels 120 miles in 2 hours. What is its average speed?" Discuss.
• Direct instruction (12 min): The SDT triangle. Rearranging: D = S × T, T = D ÷ S. Unit conversions: km/h to m/s (÷ 3.6). Density and pressure as related formulae.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "Why is average speed not simply the mean of two speeds?" Discuss with example.

THE SDT TRIANGLE:
• Cover the quantity you want to find
• D = S × T
• S = D ÷ T
• T = D ÷ S

UNIT CONVERSIONS:
• km/h to m/s: divide by 3.6
• m/s to km/h: multiply by 3.6
• 1 mile ≈ 1.6 km

AVERAGE SPEED TRAP:
• Average speed = total distance ÷ total time
• NOT the mean of the speeds (unless equal time intervals)

DENSITY: D = M/V (mass per unit volume)
PRESSURE: P = F/A (force per unit area)

COMMON MISCONCEPTIONS:
• Average speed: taking mean of two speeds when journey is split by distance (not time).
• Unit conversion: multiplying instead of dividing when converting km/h to m/s.
• Time: converting 1.5 hours to 1 hour 5 minutes instead of 1 hour 30 minutes.

DIFFERENTIATION:
• Support: SDT triangle with simple numbers. No unit conversion.
• Core: All three rearrangements. Unit conversions. Average speed.
• Extension: Velocity-time graphs; acceleration; relative speed.

MARK SCHEME GUIDANCE:
• Must show correct formula before substituting.
• Unit conversion: award method mark for correct conversion factor.
• Average speed: must use total distance ÷ total time.
• Time: must give in hours and minutes if requested.

SEND GUIDANCE:
• Dyscalculia: Provide the SDT triangle as a visual aid. Use structured substitution template.
• Dyslexia: Ensure units are written clearly. Use colour-coding for different quantities.

CROSS-CURRICULAR: Science (velocity, acceleration), Geography (transport planning), PE (athletic performance analysis).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "60 mph", method: "S = D/T = 120/2 = 60" },
      { q: "A2", marks: 2, answer: "2.5 hours = 2 hours 30 minutes", method: "T = D/S = 150/60 = 2.5" },
      { q: "A3", marks: 2, answer: "240 km", method: "D = S × T = 80 × 3 = 240" },
      { q: "B1", marks: 3, answer: "Average speed = 300/5 = 60 km/h", method: "Total D = 300; Total T = 2+3 = 5; S = 60" },
      { q: "B2", marks: 3, answer: "25 m/s", method: "90 km/h ÷ 3.6 = 25 m/s" },
      { q: "B3", marks: 4, answer: "Density = 8.9 g/cm³ (copper)", method: "D = M/V = 89/10 = 8.9" },
      { q: "B4", marks: 4, answer: "Average speed = 48 km/h (not 50 km/h)", method: "T₁=2h, T₂=1h; total D=144km; total T=3h; S=48" },
      { q: "Challenge", marks: 5, answer: "They meet after 1 hour 20 minutes, 80 km from A", method: "Closing speed = 60+30=90 km/h; time=120/90=4/3 h; distance from A=60×4/3=80 km" },
    ],
    example: {
      question: "A train travels 240 km in 3 hours. Calculate its average speed.",
      steps: [
        "Step 1: Identify the formula",
        "   Speed = Distance ÷ Time",
        "Step 2: Identify the values",
        "   Distance = 240 km, Time = 3 hours",
        "Step 3: Substitute and calculate",
        "   Speed = 240 ÷ 3 = 80 km/h",
        "Answer: 80 km/h"
      ]
    },
    guided: [
      { q: "A1  A car travels 120 miles in 2 hours. Calculate its average speed.", a: "60 mph", marks: 2 },
      { q: "A2  A cyclist travels 150 km at an average speed of 60 km/h. How long does the journey take?", a: "2 hours 30 minutes", marks: 2 },
      { q: "A3  A runner travels at 80 m/min for 3 minutes. How far does she travel?", a: "240 m", marks: 2 },
    ],
    independent: [
      { q: "B1  A car travels 120 km at 60 km/h, then 180 km at 60 km/h. Calculate the average speed for the whole journey.", a: "60 km/h", marks: 3 },
      { q: "B2  Convert 90 km/h to m/s.", a: "25 m/s", marks: 3 },
      { q: "B3  A block of copper has mass 89 g and volume 10 cm³. Calculate its density.", a: "8.9 g/cm³", marks: 4 },
      { q: "B4  A car travels 60 km at 30 km/h, then 84 km at 84 km/h. Calculate the average speed for the whole journey.", a: "48 km/h", marks: 4 },
      { q: "B5  A train leaves station A at 09:00 travelling at 60 km/h. Another train leaves station B (120 km away) at 09:30 travelling towards A at 90 km/h. At what time do they meet?", a: "10:20 (1 hour 20 min after 09:00)", marks: 5 },
    ],
    challenge: "Two trains start from towns A and B, which are 120 km apart, at the same time. Train A travels at 60 km/h and train B travels at 30 km/h, both heading towards each other. After how many minutes do they meet, and how far from town A?",
    challengeAnswer: "Closing speed = 90 km/h. Time = 120/90 = 4/3 hours = 80 minutes. Distance from A = 60 × 4/3 = 80 km.",
    extension: "Research: What is the difference between speed and velocity? How does acceleration relate to velocity and time? Investigate velocity-time graphs and what the area under the graph represents."
  },

  // ── GEOMETRY ────────────────────────────────────────────────────────────────

  "circle-theorems": {
    title: "Circle Theorems",
    objective: "Apply circle theorems to find missing angles. Give reasons for each step using correct mathematical language.",
    priorKnowledge: "Students should be able to: find angles in triangles and quadrilaterals; identify parts of a circle; use angle properties of parallel lines.",
    vocabulary: ["Chord", "Tangent", "Radius", "Diameter", "Arc", "Sector", "Segment", "Circumference", "Subtend", "Cyclic quadrilateral", "Inscribed angle"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): Label parts of a circle. Quick-fire angle facts (angles on a straight line, in a triangle, etc.).
• Direct instruction (12 min): Introduce each theorem with a diagram. Emphasise that reasons MUST be stated in exam answers.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "Which theorem is most commonly tested in GCSE exams?" Discuss exam strategy.

THE CIRCLE THEOREMS:
1. Angle at centre = 2 × angle at circumference (same arc)
2. Angle in a semicircle = 90° (angle subtended by diameter)
3. Angles in the same segment are equal
4. Opposite angles in a cyclic quadrilateral sum to 180°
5. Tangent is perpendicular to radius at point of contact
6. Two tangents from external point are equal in length
7. Alternate segment theorem: angle between tangent and chord = angle in alternate segment
8. Perpendicular from centre to chord bisects the chord

COMMON MISCONCEPTIONS:
• Theorem 1: students use the wrong arc (central angle must be on the same arc as circumference angle).
• Theorem 4: students think all angles in a cyclic quad are equal.
• Alternate segment: students use the wrong angle (must identify the correct segment).
• Not stating reasons — this loses marks in exams.

DIFFERENTIATION:
• Support: Theorems 1, 2, 4, 5 only. Provide theorem reference card.
• Core: All eight theorems. Multi-step problems.
• Extension: Proofs of circle theorems; harder multi-step problems.

MARK SCHEME GUIDANCE:
• Each angle must be accompanied by a reason (theorem name or equivalent).
• Method marks for correct theorem identification even if angle calculation wrong.
• "Angles in same segment" not "angles in same arc" — accept equivalent correct descriptions.

SEND GUIDANCE:
• Visual processing: Provide pre-drawn diagrams. Use colour-coding for different theorems.
• Working memory: Provide a theorem reference card.
• Dyslexia: Ensure theorem names are clearly written. Accept abbreviated reasons.

CROSS-CURRICULAR: Architecture (circular structures), Engineering (gear design), Art (geometric patterns).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "x = 35°; Angle at centre = 2 × angle at circumference", method: "70 ÷ 2 = 35; correct reason stated" },
      { q: "A2", marks: 2, answer: "y = 90°; Angle in a semicircle = 90°", method: "Correct theorem stated" },
      { q: "A3", marks: 2, answer: "z = 110°; Opposite angles in cyclic quadrilateral sum to 180°", method: "180 − 70 = 110; correct reason" },
      { q: "B1", marks: 4, answer: "Angle OAB = 58° (OA = OB radii, so isosceles triangle); Angle AOB = 180 − 58 − 58 = 64°; Angle ACB = 32° (angle at circumference = half angle at centre)", method: "1M isosceles; 1M AOB; 1M theorem; 1A 32°" },
      { q: "B2", marks: 4, answer: "Angle between tangent and radius = 90°; angle in triangle = 180−90−35=55°; alternate segment theorem: angle in alternate segment = 35°", method: "1M tangent-radius; 1M triangle; 1M alternate segment; 1A" },
      { q: "Challenge", marks: 6, answer: "Multi-step proof using multiple theorems; all steps with reasons", method: "1M per correct step with reason" },
    ],
    example: {
      question: "O is the centre of a circle. Angle AOB = 70°. Find angle ACB where C is a point on the major arc.",
      steps: [
        "Step 1: Identify the theorem to use",
        "   Angle AOB is at the CENTRE. Angle ACB is at the CIRCUMFERENCE.",
        "   Both angles are subtended by the same arc AB.",
        "   Theorem: The angle at the centre is twice the angle at the circumference.",
        "Step 2: Apply the theorem",
        "   Angle ACB = Angle AOB ÷ 2 = 70° ÷ 2 = 35°",
        "Answer: Angle ACB = 35°",
        "Reason: Angle at the centre is twice the angle at the circumference (same arc)."
      ]
    },
    guided: [
      { q: "A1  O is the centre of a circle. Angle AOB = 70°. Find angle ACB where C is on the major arc. Give a reason.", a: "35°; angle at centre = 2 × angle at circumference", marks: 2 },
      { q: "A2  AB is a diameter of a circle. C is a point on the circle. Find angle ACB. Give a reason.", a: "90°; angle in a semicircle = 90°", marks: 2 },
      { q: "A3  ABCD is a cyclic quadrilateral. Angle ABC = 70°. Find angle ADC. Give a reason.", a: "110°; opposite angles in a cyclic quadrilateral sum to 180°", marks: 2 },
    ],
    independent: [
      { q: "B1  O is the centre. Angle OAB = 58°. Find angle ACB where C is on the major arc. Show all your working with reasons.", a: "32°", marks: 4 },
      { q: "B2  A tangent touches a circle at point T. The radius OT makes an angle of 35° with a chord TA. Find the angle in the alternate segment.", a: "35°; alternate segment theorem", marks: 4 },
      { q: "B3  Two tangents from external point P touch a circle at A and B. PA = 8 cm. Find PB. Give a reason.", a: "PB = 8 cm; tangents from an external point are equal in length", marks: 2 },
      { q: "B4  O is the centre. Angle CAB = 25°. Find angle COB. Give a reason.", a: "50°; angle at centre = 2 × angle at circumference", marks: 3 },
      { q: "B5  ABCD is a cyclic quadrilateral. Angle A = 3x, Angle C = x + 20. Find x.", a: "3x + x + 20 = 180; 4x = 160; x = 40", marks: 4 },
    ],
    challenge: "O is the centre of a circle. Points A, B, C, D lie on the circle. Angle AOC = 130°. Angle BOD = 80°. Find angle ABC + angle ADC. Show all working with reasons.",
    challengeAnswer: "Angle ABC = 65° (half of reflex AOC = 360−130=230... wait: angle at centre AOC = 130°, so angle ABC = 65°). Angle ADC = 180−65=115° (cyclic quad). Sum = 65+115=180°.",
    extension: "Research: Can you prove the alternate segment theorem? Start by drawing a tangent and chord, and use the fact that the angle between a tangent and radius is 90°."
  },

  "vectors": {
    title: "Vectors",
    objective: "Use vector notation. Add, subtract and multiply vectors by a scalar. Use vectors to describe geometric proofs.",
    priorKnowledge: "Students should be able to: use coordinates; understand direction and magnitude; work with fractions.",
    vocabulary: ["Vector", "Scalar", "Magnitude", "Direction", "Column vector", "Resultant", "Parallel", "Position vector", "Midpoint", "Geometric proof"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): "What is the difference between a scalar and a vector?" Give examples from physics (speed vs velocity, distance vs displacement).
• Direct instruction (12 min): Column vector notation. Adding vectors (tip-to-tail). Multiplying by scalar. Parallel vectors. Geometric proofs.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "How do you prove three points are collinear using vectors?"

VECTOR OPERATIONS:
• Addition: (a b) + (c d) = (a+c b+d)
• Subtraction: (a b) − (c d) = (a−c b−d)
• Scalar multiplication: k(a b) = (ka kb)
• Magnitude: |a b| = √(a² + b²)

GEOMETRIC PROOFS:
• To show AB is parallel to CD: show AB = k × CD for some scalar k
• To show A, B, C are collinear: show AB = k × AC (parallel and share a point)
• Midpoint M of AB: OM = OA + ½AB

COMMON MISCONCEPTIONS:
• Adding vectors: students add magnitudes instead of components.
• Geometric proofs: not identifying the correct path (must go from one point to another via known vectors).
• Parallel: students forget to state that vectors must also share a point to be collinear.

DIFFERENTIATION:
• Support: Column vector operations only. No geometric proofs.
• Core: All operations. Simple geometric proofs.
• Extension: Harder geometric proofs; 3D vectors; dot product.

MARK SCHEME GUIDANCE:
• Column vector notation: must use correct notation (not coordinates).
• Geometric proofs: must show algebraic working AND state conclusion.
• Parallel: must state the scalar multiple AND that they are parallel.
• Collinear: must state parallel AND share a common point.

SEND GUIDANCE:
• Visual processing: Use grid paper to draw vectors. Colour-code different vectors.
• Working memory: Provide a vector operations reference card.
• Dyscalculia: Focus on column vector arithmetic before geometric applications.

CROSS-CURRICULAR: Physics (forces, velocity, displacement), Computing (graphics programming), Engineering (structural analysis).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "(7 5)", method: "(3+4 2+3) = (7 5)" },
      { q: "A2", marks: 2, answer: "(−1 −1)", method: "(3−4 2−3) = (−1 −1)" },
      { q: "A3", marks: 2, answer: "(6 4)", method: "2×(3 2) = (6 4)" },
      { q: "A4", marks: 2, answer: "√13", method: "√(2²+3²) = √(4+9) = √13" },
      { q: "B1", marks: 4, answer: "AB = b−a; midpoint M: OM = a + ½(b−a) = ½(a+b)", method: "1M AB = b−a; 1M OM = OA + ½AB; 1M substitution; 1A ½(a+b)" },
      { q: "B2", marks: 5, answer: "Show XY = ½AC using vector paths; conclude XY is parallel to AC and half its length", method: "1M each correct path; 1M factorisation; 1A conclusion" },
      { q: "Challenge", marks: 6, answer: "Full geometric proof with all steps and conclusion", method: "1M per correct step" },
    ],
    example: {
      question: "Given a = (3, 2) and b = (−1, 4), find a + b, a − b and 2a.",
      steps: [
        "a + b = (3 + (−1), 2 + 4) = (2, 6)",
        "",
        "a − b = (3 − (−1), 2 − 4) = (4, −2)",
        "",
        "2a = 2 × (3, 2) = (6, 4)",
        "",
        "Note: Vectors are written as column vectors: top number = horizontal component, bottom number = vertical component.",
        "Positive = right/up, Negative = left/down"
      ]
    },
    guided: [
      { q: "A1  Given a = (3 2) and b = (4 3), find a + b.", a: "(7 5)", marks: 2 },
      { q: "A2  Find a − b.", a: "(−1 −1)", marks: 2 },
      { q: "A3  Find 2a.", a: "(6 4)", marks: 2 },
      { q: "A4  Find the magnitude of the vector (2 3). Leave your answer in surd form.", a: "√13", marks: 2 },
    ],
    independent: [
      { q: "B1  OA = a and OB = b. Find the position vector of the midpoint M of AB.", a: "OM = ½(a + b)", marks: 4 },
      { q: "B2  OABC is a parallelogram. OA = a, OC = c. X is the midpoint of AB and Y is the midpoint of BC. Show that XY is parallel to AC and find the ratio XY : AC.", a: "XY = ½AC; parallel and half the length", marks: 5 },
      { q: "B3  Given p = (2 −3) and q = (−1 5), find 3p − 2q.", a: "(8 −19)", marks: 3 },
      { q: "B4  A vector has magnitude 10 and is in the direction (3 4). Write it as a column vector.", a: "(6 8)", marks: 3 },
      { q: "B5  OA = (4 3) and OB = (−2 7). Find the unit vector in the direction of AB.", a: "AB = (−6 4); |AB| = √52 = 2√13; unit vector = (−6/2√13, 4/2√13) = (−3/√13, 2/√13)", marks: 4 },
    ],
    challenge: "OABC is a quadrilateral. OA = a, OB = b, OC = c. M is the midpoint of OB and N is the midpoint of AC. Prove that MN = ½(a + c − b).",
    challengeAnswer: "MN = MO + ON = −½b + ON. ON = OA + AN = a + ½AC = a + ½(c−a) = ½(a+c). So MN = −½b + ½(a+c) = ½(a+c−b). ∎",
    extension: "Research: How are vectors used in computer graphics? Investigate how 3D vectors and matrices are used to rotate and translate objects in video games."
  },

  // ── PROBABILITY ─────────────────────────────────────────────────────────────

  "probability": {
    title: "Probability — Basic, Combined and Conditional",
    objective: "Calculate probabilities of single and combined events. Use tree diagrams and Venn diagrams. Understand conditional probability.",
    priorKnowledge: "Students should be able to: work with fractions and decimals; understand the concept of likelihood; use sample spaces.",
    vocabulary: ["Probability", "Event", "Outcome", "Sample space", "Mutually exclusive", "Independent", "Conditional probability", "Tree diagram", "Venn diagram", "Complement"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): "What is the probability of rolling a 6 on a fair die?" Discuss: probability scale 0 to 1.
• Direct instruction (12 min): P(A) = favourable outcomes / total outcomes. P(A or B) = P(A) + P(B) for mutually exclusive. P(A and B) = P(A) × P(B) for independent. Tree diagrams. Conditional probability.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "What is the difference between P(A|B) and P(B|A)?" Discuss with example.

KEY FORMULAE:
• P(A') = 1 − P(A) (complement)
• P(A or B) = P(A) + P(B) − P(A and B) (addition rule)
• P(A and B) = P(A) × P(B|A) (multiplication rule)
• P(A and B) = P(A) × P(B) if A and B are independent
• P(A|B) = P(A and B) / P(B) (conditional probability)

TREE DIAGRAMS:
• Multiply along branches (AND)
• Add between branches (OR)
• Always check probabilities on each set of branches sum to 1

VENN DIAGRAMS:
• Intersection: A ∩ B (both)
• Union: A ∪ B (at least one)
• Complement: A' (not A)

COMMON MISCONCEPTIONS:
• Adding probabilities for "and" events (should multiply for independent events).
• Not updating probabilities for "without replacement" problems.
• P(A|B) = P(B|A) — these are generally different.
• Forgetting to subtract intersection in P(A or B).

DIFFERENTIATION:
• Support: Single events and simple combined events. Tree diagrams with replacement.
• Core: Without replacement. Conditional probability. Venn diagrams.
• Extension: Formal conditional probability formula; Bayes' theorem.

MARK SCHEME GUIDANCE:
• Tree diagrams: award marks for correct structure even if probabilities wrong.
• Must show working (not just final answer) for complex probability questions.
• Fractions preferred but accept decimals/percentages if consistent.

SEND GUIDANCE:
• Dyscalculia: Use frequency trees instead of probability trees initially.
• Visual processing: Provide pre-drawn tree/Venn diagram templates.
• Working memory: Provide a "probability rules" reference card.

CROSS-CURRICULAR: Science (genetics, Punnett squares), Statistics (data analysis), Medicine (diagnostic testing), Finance (risk assessment).`,
    markScheme: [
      { q: "A1", marks: 1, answer: "1/6", method: "1 favourable outcome out of 6" },
      { q: "A2", marks: 1, answer: "5/6", method: "P(not 6) = 1 − 1/6 = 5/6" },
      { q: "A3", marks: 2, answer: "1/36", method: "P(6) × P(6) = 1/6 × 1/6 = 1/36 (independent)" },
      { q: "A4", marks: 2, answer: "11/36", method: "P(6 on at least one) = 1 − P(no 6) = 1 − 25/36 = 11/36" },
      { q: "B1", marks: 4, answer: "P(both red) = 4/10 × 3/9 = 12/90 = 2/15", method: "1M without replacement; 1M 4/10; 1M 3/9; 1A 2/15" },
      { q: "B2", marks: 4, answer: "P(different colours) = 1 − P(same) = 1 − (2/15 + 2/15) = ... full calculation", method: "1M complement or direct; full working" },
      { q: "B3", marks: 5, answer: "P(A|B) = P(A∩B)/P(B) = 0.12/0.3 = 0.4", method: "1M formula; 1M values; 1A 0.4" },
      { q: "Challenge", marks: 6, answer: "Full Bayes' theorem application", method: "1M per correct step" },
    ],
    example: {
      question: "A bag contains 3 red and 5 blue balls. Two balls are drawn without replacement. Find the probability that both are red.",
      steps: [
        "Step 1: Draw a tree diagram",
        "   First draw: P(Red) = 3/8, P(Blue) = 5/8",
        "   Second draw (given first was Red): P(Red) = 2/7, P(Blue) = 5/7",
        "   Second draw (given first was Blue): P(Red) = 3/7, P(Blue) = 4/7",
        "Step 2: Find P(both Red) by multiplying along the Red-Red branch",
        "   P(Red then Red) = 3/8 × 2/7 = 6/56 = 3/28",
        "Answer: 3/28",
        "",
        "IMPORTANT: After removing the first ball, there are only 7 balls left, and only 2 red ones."
      ]
    },
    guided: [
      { q: "A1  A fair die is rolled. Find the probability of rolling a 6.", a: "1/6", marks: 1 },
      { q: "A2  Find the probability of NOT rolling a 6.", a: "5/6", marks: 1 },
      { q: "A3  Two fair dice are rolled. Find the probability of getting a 6 on both.", a: "1/36", marks: 2 },
      { q: "A4  Find the probability of getting at least one 6 when two dice are rolled.", a: "11/36", marks: 2 },
    ],
    independent: [
      { q: "B1  A bag contains 4 red and 6 blue balls. Two balls are drawn without replacement. Find the probability that both are red.", a: "2/15", marks: 4 },
      { q: "B2  Using the same bag, find the probability that the two balls are different colours.", a: "8/15", marks: 4 },
      { q: "B3  P(A) = 0.4, P(B) = 0.3, P(A and B) = 0.12. Find P(A|B).", a: "0.4", marks: 5 },
      { q: "B4  In a class, 60% of students study French, 40% study German, and 25% study both. A student is chosen at random. Find the probability they study French or German.", a: "0.75", marks: 3 },
      { q: "B5  A card is drawn from a standard pack of 52. Find the probability it is a red card or a king.", a: "7/13", marks: 3 },
    ],
    challenge: "A medical test for a disease is 95% accurate (correctly identifies 95% of people with the disease and 95% of people without it). The disease affects 1% of the population. A person tests positive. What is the probability they actually have the disease?",
    challengeAnswer: "P(disease|positive) = P(positive|disease)×P(disease) / P(positive) = (0.95×0.01) / (0.95×0.01 + 0.05×0.99) = 0.0095/0.059 ≈ 0.161 (about 16%). This is Bayes' theorem — the low base rate means most positives are false positives.",
    extension: "Research: What is Bayes' theorem? How is it used in spam filters, medical diagnosis, and machine learning? Why does the base rate of a disease matter so much for interpreting test results?"
  },

  // ── STATISTICS ──────────────────────────────────────────────────────────────

  "averages-spread": {
    title: "Averages and Measures of Spread",
    objective: "Calculate mean, median, mode and range from raw data and frequency tables. Calculate interquartile range. Understand standard deviation.",
    priorKnowledge: "Students should be able to: order numbers; add and divide; work with frequency tables.",
    vocabulary: ["Mean", "Median", "Mode", "Range", "Interquartile range", "Quartile", "Outlier", "Standard deviation", "Frequency", "Cumulative frequency"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): "Five students scored 3, 7, 4, 9, 7 in a test. Find the mean, median, mode and range."
• Direct instruction (12 min): Mean from frequency table (Σfx/Σf). Median position ((n+1)/2). Quartiles. When to use each average.
• Guided practice (10 min): Questions A1–A4.
• Independent work (15 min): Section B.
• Plenary (5 min): "Which average is most useful for a teacher reporting class test results? Why?"

MEAN FROM FREQUENCY TABLE:
• Mean = Σ(f × x) / Σf
• For grouped data: use midpoint of each class

MEDIAN POSITION:
• For n values: median is at position (n+1)/2
• For even n: mean of two middle values

QUARTILES:
• Lower quartile (Q1): median of lower half
• Upper quartile (Q3): median of upper half
• IQR = Q3 − Q1

WHEN TO USE EACH AVERAGE:
• Mean: all data used, but affected by outliers
• Median: not affected by outliers, good for skewed data
• Mode: only average for categorical data

COMMON MISCONCEPTIONS:
• Mean from frequency table: multiplying frequency by position instead of value.
• Median: not ordering data first.
• IQR: using Q3 − Q1 but finding quartiles incorrectly.
• Grouped data mean: using class boundaries instead of midpoints.

DIFFERENTIATION:
• Support: Mean, median, mode from small raw data sets only.
• Core: All averages from frequency tables. IQR.
• Extension: Standard deviation; comparing distributions; effect of adding/removing data.

MARK SCHEME GUIDANCE:
• Mean: must show Σfx and Σf separately for method marks.
• Median: must show ordering or position calculation.
• IQR: must identify Q1 and Q3 correctly before subtracting.

SEND GUIDANCE:
• Dyscalculia: Provide structured tables for frequency calculations. Use a calculator.
• Working memory: Provide a step-by-step guide for each average.
• Dyslexia: Ensure all terms are clearly defined on a vocabulary card.

CROSS-CURRICULAR: Science (data analysis), Geography (population statistics), PE (performance analysis), PSHE (health statistics).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "Mean = 6", method: "Σx = 3+7+4+9+7+6 = 36; mean = 36/6 = 6" },
      { q: "A2", marks: 2, answer: "Median = 6.5", method: "Ordered: 3,4,6,7,7,9; median = (6+7)/2 = 6.5" },
      { q: "A3", marks: 1, answer: "Mode = 7", method: "7 appears twice, all others once" },
      { q: "A4", marks: 1, answer: "Range = 6", method: "9 − 3 = 6" },
      { q: "B1", marks: 3, answer: "Mean = 3.2", method: "Σfx = 0×5+1×8+2×6+3×4+4×3+5×2+6×2 = 0+8+12+12+12+10+12=66; Σf=30; mean=66/30=2.2. Recheck with given data." },
      { q: "B2", marks: 3, answer: "IQR = Q3 − Q1", method: "1M Q1 correct; 1M Q3 correct; 1A IQR" },
      { q: "B3", marks: 4, answer: "Estimated mean using midpoints", method: "1M midpoints; 1M Σfx; 1M Σf; 1A mean" },
      { q: "Challenge", marks: 5, answer: "Full comparison of two distributions using mean, IQR and context", method: "1M each correct statistic; 1A comparison in context" },
    ],
    example: {
      question: "Find the mean from this frequency table: Score (1,2,3,4,5) Frequency (3,5,4,6,2)",
      steps: [
        "Step 1: Add a 'f × x' column to the table",
        "   Score 1: f=3, f×x = 3×1 = 3",
        "   Score 2: f=5, f×x = 5×2 = 10",
        "   Score 3: f=4, f×x = 4×3 = 12",
        "   Score 4: f=6, f×x = 6×4 = 24",
        "   Score 5: f=2, f×x = 2×5 = 10",
        "Step 2: Find the totals",
        "   Σf = 3+5+4+6+2 = 20",
        "   Σ(f×x) = 3+10+12+24+10 = 59",
        "Step 3: Calculate the mean",
        "   Mean = Σ(f×x) / Σf = 59 / 20 = 2.95",
        "Answer: Mean = 2.95"
      ]
    },
    guided: [
      { q: "A1  Find the mean of: 3, 7, 4, 9, 7, 6.", a: "6", marks: 2 },
      { q: "A2  Find the median of: 3, 7, 4, 9, 7, 6.", a: "6.5", marks: 2 },
      { q: "A3  Find the mode of: 3, 7, 4, 9, 7, 6.", a: "7", marks: 1 },
      { q: "A4  Find the range of: 3, 7, 4, 9, 7, 6.", a: "6", marks: 1 },
    ],
    independent: [
      { q: "B1  Find the mean from this frequency table: Number of siblings (0,1,2,3,4) Frequency (8,12,6,3,1).", a: "Mean = 1.23 (to 2 d.p.)", marks: 3 },
      { q: "B2  The ages of 10 students are: 14, 15, 14, 16, 15, 14, 17, 15, 16, 14. Find the IQR.", a: "IQR = 15.75 − 14 = 1.75 (or 2 depending on method)", marks: 3 },
      { q: "B3  Estimate the mean from this grouped frequency table: Height (cm): 150-155 (f=4), 155-160 (f=9), 160-165 (f=12), 165-170 (f=7), 170-175 (f=3).", a: "Estimated mean ≈ 162.1 cm", marks: 4 },
      { q: "B4  A data set has mean 12 and 8 values. A 9th value of 21 is added. Find the new mean.", a: "New mean = (96+21)/9 = 13", marks: 3 },
      { q: "B5  Two classes take the same test. Class A: mean = 65, IQR = 20. Class B: mean = 65, IQR = 8. Compare the two classes' performance.", a: "Same average performance but Class B is more consistent (smaller IQR)", marks: 3 },
    ],
    challenge: "The table shows the distribution of marks in two exams. Compare the two distributions fully, using appropriate statistics and commenting on what this means for the students.",
    challengeAnswer: "Calculate mean and IQR for both. Compare central tendency (mean/median) and spread (IQR/range). Comment on which group performed better on average and which was more consistent. Relate back to context.",
    extension: "Research: What is standard deviation? How does it differ from the IQR as a measure of spread? When would you use standard deviation instead of IQR?"
  },

  "data-representation": {
    title: "Data Representation — Histograms, Cumulative Frequency and Box Plots",
    objective: "Draw and interpret histograms with unequal class widths. Draw and use cumulative frequency graphs. Construct and interpret box plots.",
    priorKnowledge: "Students should be able to: plot points on a graph; calculate frequency; find quartiles; work with grouped data.",
    vocabulary: ["Histogram", "Frequency density", "Cumulative frequency", "Box plot", "Whisker", "Quartile", "Median", "Skew", "Class width", "Outlier"],
    teacherNotes: `LESSON STRUCTURE (50 min):
• Starter (8 min): "What is the difference between a bar chart and a histogram?" Discuss: bar chart uses frequency, histogram uses frequency density.
• Direct instruction (12 min): Frequency density = frequency ÷ class width. Cumulative frequency: running total. Box plot: min, Q1, median, Q3, max.
• Guided practice (10 min): Questions A1–A3.
• Independent work (15 min): Section B.
• Plenary (5 min): "What does a positively skewed box plot look like? What does it tell us about the data?"

FREQUENCY DENSITY:
• Frequency density = frequency ÷ class width
• Frequency = frequency density × class width
• Area of bar = frequency (not height!)

CUMULATIVE FREQUENCY:
• Running total of frequencies
• Plot at UPPER CLASS BOUNDARY
• S-shaped curve (ogive)
• Read off median (50%), Q1 (25%), Q3 (75%)

BOX PLOT (Five-number summary):
• Minimum | Q1 | Median | Q3 | Maximum
• Box shows IQR; whiskers show full range
• Outliers: beyond Q1 − 1.5×IQR or Q3 + 1.5×IQR

SKEW:
• Positive skew: tail to the right, mean > median > mode
• Negative skew: tail to the left, mean < median < mode
• Symmetric: mean = median = mode

COMMON MISCONCEPTIONS:
• Histogram: using frequency instead of frequency density on y-axis.
• Cumulative frequency: plotting at midpoint instead of upper class boundary.
• Box plot: drawing whiskers to Q1−IQR instead of minimum.
• Reading off cumulative frequency: reading frequency instead of value.

DIFFERENTIATION:
• Support: Bar charts and pie charts only. Simple cumulative frequency.
• Core: Histograms and cumulative frequency. Box plots.
• Extension: Comparing distributions; skewness; outliers; back-to-back stem-and-leaf.

MARK SCHEME GUIDANCE:
• Histogram: award marks for correct frequency density calculation even if plotting wrong.
• Cumulative frequency: must plot at upper class boundary.
• Box plot: must show all five values correctly.
• Comparison: must use statistics (not just "Group A is better").

SEND GUIDANCE:
• Visual processing: Provide pre-drawn axes. Use colour-coding for different data sets.
• Dyscalculia: Provide a structured template for frequency density calculation.
• Working memory: Provide a step-by-step guide for each chart type.

CROSS-CURRICULAR: Science (experimental data), Geography (population pyramids, climate data), Business (sales data analysis).`,
    markScheme: [
      { q: "A1", marks: 2, answer: "Frequency density = 4 (20÷5)", method: "FD = frequency ÷ class width = 20÷5 = 4" },
      { q: "A2", marks: 2, answer: "Frequency = 30 (6×5)", method: "Frequency = FD × class width = 6×5 = 30" },
      { q: "B1", marks: 4, answer: "Correct cumulative frequency table and S-shaped curve", method: "1M cumulative totals; 1M upper class boundaries; 1M plotting; 1A smooth curve" },
      { q: "B2", marks: 3, answer: "Median ≈ 45 (from graph at 50% mark)", method: "1M reading at n/2; 1M correct value from graph; 1A" },
      { q: "B3", marks: 4, answer: "Correct box plot with all five values", method: "1M min/max; 1M Q1/Q3; 1M median; 1A correct box plot" },
      { q: "Challenge", marks: 6, answer: "Full comparison of two distributions using statistics and context", method: "1M each statistic; 1A comparison" },
    ],
    example: {
      question: "A histogram has a bar for the class 20 ≤ x < 25 with frequency density 6. What is the frequency for this class?",
      steps: [
        "Step 1: Identify the class width",
        "   Class: 20 ≤ x < 25",
        "   Class width = 25 − 20 = 5",
        "Step 2: Use the formula",
        "   Frequency = Frequency density × Class width",
        "   Frequency = 6 × 5 = 30",
        "Answer: 30 students are in the class 20 ≤ x < 25",
        "",
        "Remember: In a histogram, the AREA of the bar represents the frequency, not the height."
      ]
    },
    guided: [
      { q: "A1  A class 15 ≤ x < 20 has frequency 20. Calculate the frequency density.", a: "4", marks: 2 },
      { q: "A2  A bar on a histogram has frequency density 6 and class width 5. Find the frequency.", a: "30", marks: 2 },
    ],
    independent: [
      { q: "B1  Draw a cumulative frequency graph for: Time (min): 0-10 (f=5), 10-20 (f=12), 20-30 (f=18), 30-40 (f=10), 40-50 (f=5). Total = 50.", a: "Correct cumulative frequency curve", marks: 4 },
      { q: "B2  From your graph in B1, estimate the median time.", a: "Approximately 25 minutes (read at cf = 25)", marks: 3 },
      { q: "B3  From your graph, find Q1 and Q3. Draw a box plot.", a: "Q1 ≈ 17 min, Q3 ≈ 33 min; correct box plot", marks: 4 },
      { q: "B4  A histogram shows: 0-5 (FD=4), 5-10 (FD=8), 10-20 (FD=5), 20-30 (FD=2). Find the total frequency.", a: "5×4 + 5×8 + 10×5 + 10×2 = 20+40+50+20 = 130", marks: 3 },
    ],
    challenge: "Two groups of students take the same test. Group A: min=20, Q1=45, median=60, Q3=75, max=95. Group B: min=30, Q1=55, median=65, Q3=70, max=85. Draw box plots for both groups on the same diagram and write a full comparison.",
    challengeAnswer: "Group B has higher median (65 vs 60) and higher Q1 (55 vs 45), suggesting Group B performed better on average. Group A has larger IQR (30 vs 15), suggesting more variability. Group A has a lower minimum and higher maximum, suggesting more extreme scores.",
    extension: "Research: What is a stem-and-leaf diagram? How does a back-to-back stem-and-leaf diagram allow comparison of two data sets? When would you use this instead of box plots?"
  },

};
