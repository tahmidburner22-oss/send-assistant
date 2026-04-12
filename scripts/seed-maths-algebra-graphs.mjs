/**
 * Seed script — Maths: Algebra & Graphs (Year 10/11)
 *
 * Purpose:
 *  - Create curated Algebra & Graphs library entries that load instantly.
 *  - Provide four distinct variants: Foundation, Higher, Mixed, and Scaffolded.
 *  - Scaffolded variant wording is derived from Foundation level, not Higher.
 *  - Each variant includes a comprehensive teacher key (mark scheme + teacher notes).
 *
 * Run:
 *   APP_URL=https://adaptly.co.uk node scripts/seed-maths-algebra-graphs.mjs
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Mathematics";
const TOPIC = "Algebra — Graphs";
const YEAR_GROUP = "Year 10";
const SOURCE = "Adaptly Curated";

// ─── Shared Content ───────────────────────────────────────────────────────────

const KEY_VOCAB = [
  { term: "Expression", definition: "A mathematical phrase containing numbers, variables and operations but no equals sign." },
  { term: "Equation", definition: "A mathematical statement showing two expressions are equal, containing an equals sign." },
  { term: "Variable", definition: "A letter used to represent an unknown or changing value." },
  { term: "Coefficient", definition: "The number multiplied by a variable in a term, e.g. in 3x the coefficient is 3." },
  { term: "Like terms", definition: "Terms that have the same variable(s) raised to the same power and can be combined." },
  { term: "Expand", definition: "To multiply out brackets, removing them from an expression." },
  { term: "Factorise", definition: "To write an expression as a product of its factors by taking out common factors." },
  { term: "Gradient", definition: "The steepness of a line, calculated as rise ÷ run (change in y ÷ change in x)." },
  { term: "y-intercept", definition: "The point where a line crosses the y-axis; the value of y when x = 0." },
  { term: "Linear graph", definition: "A straight-line graph representing a linear equation of the form y = mx + c." },
  { term: "Substitute", definition: "To replace a variable with a given numerical value." },
  { term: "Solve", definition: "To find the value(s) of the variable that make an equation true." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Simplify algebraic expressions by collecting like terms.\n" +
  "2. Expand single and double brackets.\n" +
  "3. Factorise expressions by taking out common factors.\n" +
  "4. Substitute values into expressions and formulae.\n" +
  "5. Plot and interpret straight-line graphs using y = mx + c.\n" +
  "6. Find the gradient and y-intercept of a linear graph.";

const KEY_VOCAB_CONTENT =
  "**Expression** — A mathematical phrase containing numbers, variables and operations but no equals sign.\n" +
  "**Equation** — A mathematical statement showing two expressions are equal, containing an equals sign.\n" +
  "**Variable** — A letter used to represent an unknown or changing value.\n" +
  "**Coefficient** — The number multiplied by a variable in a term, e.g. in 3x the coefficient is 3.\n" +
  "**Like terms** — Terms that have the same variable(s) raised to the same power and can be combined.\n" +
  "**Expand** — To multiply out brackets, removing them from an expression.\n" +
  "**Factorise** — To write an expression as a product of its factors by taking out common factors.\n" +
  "**Gradient** — The steepness of a line, calculated as rise ÷ run (change in y ÷ change in x).\n" +
  "**y-intercept** — The point where a line crosses the y-axis; the value of y when x = 0.\n" +
  "**Linear graph** — A straight-line graph representing a linear equation of the form y = mx + c.\n" +
  "**Substitute** — To replace a variable with a given numerical value.\n" +
  "**Solve** — To find the value(s) of the variable that make an equation true.";

const COMMON_MISTAKES =
  "1. When collecting like terms, only combine terms with the same variable and power (e.g. 3x and 5x can be combined, but 3x and 3x² cannot).\n" +
  "2. When expanding brackets, multiply every term inside the bracket by the term outside (e.g. 3(x + 4) = 3x + 12, not 3x + 4).\n" +
  "3. When factorising, always check by expanding your answer to verify it matches the original expression.\n" +
  "4. The gradient m in y = mx + c is the coefficient of x, not the constant.\n" +
  "5. The y-intercept is where the line crosses the y-axis (x = 0), not the x-axis.\n" +
  "6. When substituting negative values, use brackets to avoid sign errors (e.g. if x = -2, write (-2)² = 4, not -2² = -4).";

const WORKED_EXAMPLE =
  "Worked example: Plotting y = 2x + 1\n\n" +
  "Step 1: Identify the gradient and y-intercept. In y = 2x + 1, gradient m = 2 and y-intercept c = 1.\n" +
  "Step 2: Plot the y-intercept. Mark the point (0, 1) on the y-axis.\n" +
  "Step 3: Use the gradient to find a second point. Gradient = 2 means go right 1, up 2. From (0, 1) → (1, 3).\n" +
  "Step 4: Plot the second point (1, 3) and draw a straight line through both points, extending it across the grid.\n" +
  "Step 5: Check by substituting a third value. When x = 2: y = 2(2) + 1 = 5. Point (2, 5) should lie on the line.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Algebra & Graphs?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can simplify expressions by collecting like terms.|Not yet|Almost|Got it!\n" +
  "I can expand single and double brackets.|Not yet|Almost|Got it!\n" +
  "I can factorise expressions by taking out common factors.|Not yet|Almost|Got it!\n" +
  "I can substitute values into expressions and formulae.|Not yet|Almost|Got it!\n" +
  "I can plot a straight-line graph using y = mx + c.|Not yet|Almost|Got it!\n" +
  "I can find the gradient and y-intercept from a graph or equation.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What is the difference between an expression and an equation?\n" +
  "Explain in your own words what the gradient of a line tells you.\n" +
  "EXIT_TICKET: A line has equation y = 3x − 2. State the gradient and y-intercept, then plot the line for x = 0, 1 and 2.";

// ─── Mark Schemes ─────────────────────────────────────────────────────────────

const MIXED_MARK_SCHEME =
  "**Q1 - Collecting like terms**\n" +
  "a) 7x + 3y  b) 5a² + 2a − 4  c) 4p − 2q + 6\n\n" +
  "**Q2 - Expanding brackets**\n" +
  "a) 4x + 12  b) 6a − 15  c) x² + 5x + 6  d) 2x² + x − 6\n\n" +
  "**Q3 - Factorising**\n" +
  "a) 3(x + 4)  b) 5a(2a − 3)  c) (x + 2)(x + 5)\n\n" +
  "**Q4 - Substitution**\n" +
  "a) 14  b) −1  c) 25\n\n" +
  "**Q5 - Gradient and y-intercept**\n" +
  "a) m = 3, c = −2  b) m = −½, c = 4  c) m = 2, c = 0\n\n" +
  "**Q6 - Plotting y = 2x + 1**\n" +
  "Table: x=0 → y=1; x=1 → y=3; x=2 → y=5; x=3 → y=7. Straight line through these points.\n\n" +
  "**Q7 - Finding the equation**\n" +
  "Gradient = (5−1)/(2−0) = 2; y-intercept = 1; equation: y = 2x + 1\n\n" +
  "**Q8 - Solving equations**\n" +
  "a) x = 5  b) x = −3  c) x = 4\n\n" +
  "**Q9 - Parallel lines**\n" +
  "Parallel lines have the same gradient. y = 3x + 7 is parallel to y = 3x − 2.\n\n" +
  "**Q10 - Challenge**\n" +
  "a) x = 3, y = 7  b) The lines intersect at (3, 7).";

const HIGHER_MARK_SCHEME =
  "**Q1 - Collecting like terms**\n" +
  "a) 7x + 3y  b) 5a² + 2a − 4  c) 4p − 2q + 6\n\n" +
  "**Q2 - Expanding and simplifying**\n" +
  "a) 4x + 12  b) x² + 5x + 6  c) 2x² + x − 6  d) 4x² − 9 (difference of two squares)\n\n" +
  "**Q3 - Factorising**\n" +
  "a) 3(x + 4)  b) 5a(2a − 3)  c) (x + 2)(x + 5)  d) (2x − 3)(x + 2)\n\n" +
  "**Q4 - Substitution and formulae**\n" +
  "a) 14  b) −1  c) 25  d) v = 22 m/s\n\n" +
  "**Q5 - Gradient and y-intercept**\n" +
  "a) m = 3, c = −2  b) m = −½, c = 4  c) Rearrange: y = 2x − 3; m = 2, c = −3\n\n" +
  "**Q6 - Plotting and interpreting**\n" +
  "Table: x=−1 → y=−1; x=0 → y=1; x=1 → y=3; x=2 → y=5. Straight line through these points.\n\n" +
  "**Q7 - Finding the equation from two points**\n" +
  "Gradient = (7−1)/(3−0) = 2; y-intercept = 1; equation: y = 2x + 1\n\n" +
  "**Q8 - Solving equations**\n" +
  "a) x = 5  b) x = −3  c) x = 4  d) x = 2.5\n\n" +
  "**Q9 - Perpendicular lines**\n" +
  "Perpendicular gradient = −⅓; equation: y = −⅓x + 5\n\n" +
  "**Q10 - Simultaneous equations**\n" +
  "x = 3, y = 7 (by substitution or elimination)\n\n" +
  "**Q11 - Challenge: Quadratic graphs**\n" +
  "y = x² − 4: roots at x = ±2; vertex at (0, −4); U-shaped parabola.";

const TEACHER_NOTES =
  "- Ensure students understand the difference between an expression and an equation before beginning.\n" +
  "- Emphasise that collecting like terms only applies to terms with identical variable parts.\n" +
  "- Use the FOIL method (First, Outer, Inner, Last) to support double bracket expansion.\n" +
  "- For graph work, ensure students have access to squared paper or a printed grid.\n" +
  "- Remind students to always label axes and give the graph a title.\n" +
  "- The gradient can be positive (line goes up left to right) or negative (line goes down left to right).\n" +
  "- For the Scaffolded tier: sentence starters and step-by-step frames are included after key questions.";

const HIGHER_TEACHER_NOTES =
  TEACHER_NOTES +
  "\n\n- Higher tier introduces perpendicular lines and simultaneous equations graphically.\n" +
  "- Encourage students to verify simultaneous equation solutions by substituting back into both equations.\n" +
  "- Quadratic graphs should be plotted using a table of values; discuss the axis of symmetry.";

// ─── Section factory ──────────────────────────────────────────────────────────

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-algebra-graphs", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-algebra-graphs", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-algebra-graphs", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-algebra-graphs", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function selfReflectionSection() {
  return section("self-reflection-algebra-graphs", "self-reflection", "Self Reflection", SELF_REFLECTION);
}

function teacherSections(markScheme = MIXED_MARK_SCHEME, extraNotes = "") {
  return [
    { id: "teacher-answer-key", title: "Teacher Answer Key", type: "mark-scheme", teacherOnly: true, content: markScheme },
    { id: "teacher-notes", title: "Teacher Notes", type: "teacher-notes", teacherOnly: true, content: TEACHER_NOTES + extraNotes },
  ];
}

// ─── Questions: Mixed / Foundation ────────────────────────────────────────────

const Q1_MIXED = section(
  "q1-like-terms",
  "q-short-answer",
  "Q1 - Collecting Like Terms",
  "Simplify each expression by collecting like terms.\n\na) 3x + 4y + 4x − y\n\nb) 2a² + 3a − 4 + 3a²  − a\n\nc) 7p − 3q + 2 − 3p + q + 4"
);

const Q1_FOUNDATION = section(
  "q1-like-terms",
  "q-short-answer",
  "Q1 - Collecting Like Terms",
  "Simplify each expression by collecting like terms.\nRemember: only add or subtract terms with the same letter and power.\n\na) 3x + 4y + 4x − y\n\nb) 2a² + 3a − 4 + 3a² − a\n\nc) 7p − 3q + 2 − 3p + q + 4"
);

const Q2_MIXED = section(
  "q2-expanding",
  "q-short-answer",
  "Q2 - Expanding Brackets",
  "Expand each expression.\n\na) 4(x + 3)\n\nb) 3(2a − 5)\n\nc) (x + 2)(x + 3)\n\nd) (2x − 3)(x + 2)"
);

const Q2_FOUNDATION = section(
  "q2-expanding",
  "q-short-answer",
  "Q2 - Expanding Brackets",
  "Expand each expression. Multiply every term inside the bracket by the term outside.\n\na) 4(x + 3)\n\nb) 3(2a − 5)\n\nc) (x + 2)(x + 3)  Hint: use FOIL — First, Outer, Inner, Last.\n\nd) (2x − 3)(x + 2)"
);

const Q2_HIGHER = section(
  "q2-expanding",
  "q-short-answer",
  "Q2 - Expanding and Simplifying",
  "Expand and simplify each expression.\n\na) 4(x + 3)\n\nb) (x + 2)(x + 3)\n\nc) (2x − 3)(x + 2)\n\nd) (2x + 3)(2x − 3)"
);

const Q3_MIXED = section(
  "q3-factorising",
  "q-short-answer",
  "Q3 - Factorising",
  "Factorise each expression fully.\n\na) 3x + 12\n\nb) 10a² − 15a\n\nc) x² + 7x + 10"
);

const Q3_FOUNDATION = section(
  "q3-factorising",
  "q-short-answer",
  "Q3 - Factorising",
  "Factorise each expression fully. Find the highest common factor first.\n\na) 3x + 12  Hint: what number goes into both 3 and 12?\n\nb) 10a² − 15a  Hint: what goes into both terms?\n\nc) x² + 7x + 10  Hint: find two numbers that multiply to 10 and add to 7."
);

const Q3_HIGHER = section(
  "q3-factorising",
  "q-short-answer",
  "Q3 - Factorising",
  "Factorise each expression fully.\n\na) 3x + 12\n\nb) 10a² − 15a\n\nc) x² + 7x + 10\n\nd) 2x² + x − 6"
);

const Q4_MIXED = section(
  "q4-substitution",
  "q-short-answer",
  "Q4 - Substitution",
  "Evaluate each expression when x = 3 and y = −2.\n\na) 4x + 2\n\nb) x² − 2y − 6\n\nc) (x + y)²"
);

const Q4_FOUNDATION = section(
  "q4-substitution",
  "q-short-answer",
  "Q4 - Substitution",
  "Evaluate each expression when x = 3 and y = −2.\nReplace each letter with its value and calculate carefully.\n\na) 4x + 2\n\nb) x² − 2y − 6  Hint: remember (−2) × (−2) = +4 for y terms.\n\nc) (x + y)²  Hint: work out the bracket first."
);

const Q4_HIGHER = section(
  "q4-substitution",
  "q-short-answer",
  "Q4 - Substitution and Formulae",
  "a) Evaluate 4x + 2 when x = 3.\n\nb) Evaluate x² − 2y − 6 when x = 3 and y = −2.\n\nc) Evaluate (x + y)² when x = 3 and y = −2.\n\nd) The formula for velocity is v = u + at. Find v when u = 4, a = 3 and t = 6."
);

const Q5_MIXED = section(
  "q5-gradient-intercept",
  "q-short-answer",
  "Q5 - Gradient and y-intercept",
  "For each equation, state the gradient and y-intercept.\n\na) y = 3x − 2\n\nb) y = −½x + 4\n\nc) y = 2x"
);

const Q5_FOUNDATION = section(
  "q5-gradient-intercept",
  "q-short-answer",
  "Q5 - Gradient and y-intercept",
  "For each equation in the form y = mx + c, state the gradient (m) and y-intercept (c).\n\na) y = 3x − 2\n\nb) y = −½x + 4\n\nc) y = 2x  Hint: what is the value of c here?"
);

const Q5_HIGHER = section(
  "q5-gradient-intercept",
  "q-short-answer",
  "Q5 - Gradient and y-intercept",
  "For each equation, state the gradient and y-intercept. Rearrange if necessary.\n\na) y = 3x − 2\n\nb) y = −½x + 4\n\nc) 2y − 4x = −6"
);

const Q6_MIXED = section(
  "q6-plotting",
  "q-graph",
  "Q6 - Plotting a Straight-Line Graph",
  "Complete the table of values for y = 2x + 1, then plot the graph on the grid provided.\n\n| x | 0 | 1 | 2 | 3 |\n|---|---|---|---|---|\n| y | [answer] | [answer] | [answer] | [answer] |"
);

const Q6_FOUNDATION = section(
  "q6-plotting",
  "q-graph",
  "Q6 - Plotting a Straight-Line Graph",
  "Complete the table of values for y = 2x + 1, then plot the graph on the grid provided.\nTo find y: substitute each x value into the equation.\n\n| x | 0 | 1 | 2 | 3 |\n|---|---|---|---|---|\n| y | [answer] | [answer] | [answer] | [answer] |"
);

const Q6_HIGHER = section(
  "q6-plotting",
  "q-graph",
  "Q6 - Plotting and Interpreting",
  "a) Complete the table of values for y = 2x + 1 for x = −1, 0, 1, 2.\n\n| x | −1 | 0 | 1 | 2 |\n|---|---|---|---|---|\n| y | [answer] | [answer] | [answer] | [answer] |\n\nb) Plot the graph and label it.\n\nc) On the same axes, plot y = −x + 4. State the coordinates of the intersection."
);

const Q7_MIXED = section(
  "q7-find-equation",
  "q-short-answer",
  "Q7 - Finding the Equation of a Line",
  "A straight line passes through the points (0, 1) and (2, 5).\n\na) Calculate the gradient.\n\nb) Write the equation of the line in the form y = mx + c."
);

const Q7_FOUNDATION = section(
  "q7-find-equation",
  "q-short-answer",
  "Q7 - Finding the Equation of a Line",
  "A straight line passes through the points (0, 1) and (2, 5).\n\na) Calculate the gradient. Hint: gradient = (change in y) ÷ (change in x) = (5 − 1) ÷ (2 − 0).\n\nb) Write the equation of the line in the form y = mx + c. Hint: the y-intercept is the y value when x = 0."
);

const Q7_HIGHER = section(
  "q7-find-equation",
  "q-short-answer",
  "Q7 - Finding the Equation from Two Points",
  "A straight line passes through (0, 1) and (3, 7).\n\na) Calculate the gradient.\n\nb) Write the equation of the line in the form y = mx + c.\n\nc) Does the point (5, 11) lie on this line? Show your working."
);

const Q8_MIXED = section(
  "q8-solving",
  "q-short-answer",
  "Q8 - Solving Linear Equations",
  "Solve each equation.\n\na) 3x − 4 = 11\n\nb) 2(x + 1) = −4\n\nc) 5x + 3 = 2x + 15"
);

const Q8_FOUNDATION = section(
  "q8-solving",
  "q-short-answer",
  "Q8 - Solving Linear Equations",
  "Solve each equation. Show your working step by step.\n\na) 3x − 4 = 11  Hint: add 4 to both sides first.\n\nb) 2(x + 1) = −4  Hint: expand the bracket first.\n\nc) 5x + 3 = 2x + 15  Hint: collect x terms on one side."
);

const Q8_HIGHER = section(
  "q8-solving",
  "q-short-answer",
  "Q8 - Solving Equations",
  "Solve each equation. Show full working.\n\na) 3x − 4 = 11\n\nb) 2(x + 1) = −4\n\nc) 5x + 3 = 2x + 15\n\nd) (3x + 1)/2 = 4"
);

const Q9_MIXED = section(
  "q9-parallel",
  "q-short-answer",
  "Q9 - Parallel Lines",
  "a) Write down the gradient of a line parallel to y = 3x − 2.\n\nb) Write the equation of a line parallel to y = 3x − 2 that passes through (0, 7)."
);

const Q9_FOUNDATION = section(
  "q9-parallel",
  "q-short-answer",
  "Q9 - Parallel Lines",
  "Parallel lines have the same gradient.\n\na) Write down the gradient of a line parallel to y = 3x − 2.\n\nb) Write the equation of a line parallel to y = 3x − 2 that passes through (0, 7). Hint: use y = mx + c with the same m."
);

const Q9_HIGHER = section(
  "q9-perpendicular",
  "q-short-answer",
  "Q9 - Perpendicular Lines",
  "A line has equation y = 3x − 2.\n\na) State the gradient of a line perpendicular to this line.\n\nb) Find the equation of the perpendicular line that passes through (0, 5)."
);

const Q10_MIXED = section(
  "q10-challenge",
  "q-challenge",
  "Q10 - Challenge Question",
  "Two lines are y = 2x + 1 and y = −x + 10.\n\na) Solve the simultaneous equations to find the point of intersection.\n\nb) Verify your answer by substituting back into both equations."
);

const Q10_FOUNDATION = section(
  "q10-challenge",
  "q-challenge",
  "Q10 - Challenge Question",
  "Two lines are y = 2x + 1 and y = −x + 10.\n\na) Complete the table and plot both lines on the same grid.\n\nb) Read off the coordinates of the point where the lines cross.\n\nc) Check your answer: substitute the coordinates into both equations."
);

const Q10_HIGHER = section(
  "q10-simultaneous",
  "q-challenge",
  "Q10 - Simultaneous Equations",
  "Solve the simultaneous equations algebraically and verify graphically.\n\ny = 2x + 1\ny = −x + 10\n\na) Solve algebraically.\n\nb) Verify by substitution.\n\nc) What is the geometric meaning of the solution?"
);

const Q11_HIGHER = section(
  "q11-quadratic-graphs",
  "q-challenge",
  "Q11 - Challenge: Quadratic Graphs",
  "a) Complete the table of values for y = x² − 4 for x = −3, −2, −1, 0, 1, 2, 3.\n\n| x | −3 | −2 | −1 | 0 | 1 | 2 | 3 |\n|---|---|---|---|---|---|---|---|\n| y | [answer] | [answer] | [answer] | [answer] | [answer] | [answer] | [answer] |\n\nb) Plot the graph.\n\nc) State the roots (where y = 0) and the minimum point."
);

// ─── Sentence Starters (Scaffolded only) ──────────────────────────────────────

const SS_Q1 = section("ss-q1", "sentence-starters", "Q1 - Sentence Starters", "Sentence starters: The like terms in this expression are...\nI can combine them to get...\nThe simplified expression is...");
const SS_Q2 = section("ss-q2", "sentence-starters", "Q2 - Sentence Starters", "Sentence starters: I multiply the term outside by...\nThe first term becomes...\nThe expanded expression is...");
const SS_Q3 = section("ss-q3", "sentence-starters", "Q3 - Sentence Starters", "Sentence starters: The highest common factor of both terms is...\nI can write this as...\nTo check, I expand and get...");
const SS_Q5 = section("ss-q5", "sentence-starters", "Q5 - Sentence Starters", "Sentence starters: In the equation y = mx + c, the gradient is...\nThe y-intercept is...\nI know this because...");
const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: When x = 0, y = ...\nWhen x = 1, y = ...\nI plot the points and draw a straight line through...");
const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: The gradient is calculated by...\nThe change in y is...\nThe change in x is...\nThe equation of the line is...");
const SS_Q8 = section("ss-q8", "sentence-starters", "Q8 - Sentence Starters", "Sentence starters: First I...\nThen I...\nThe solution is x = ...");

const FORMULA_REFERENCE = section(
  "formula-reference",
  "reminder-box",
  "Formula Reference Card",
  "Key reminders:\n- Gradient = (change in y) ÷ (change in x)\n- y = mx + c: m is gradient, c is y-intercept\n- To expand: multiply every term inside the bracket by the term outside\n- To factorise: find the highest common factor\n- To substitute: replace the letter with its value (use brackets for negatives)"
);

// ─── Section arrays ────────────────────────────────────────────────────────────

const MIXED_SECTIONS = [
  ...openingSections(),
  Q1_MIXED,
  Q2_MIXED,
  Q3_MIXED,
  Q4_MIXED,
  Q5_MIXED,
  Q6_MIXED,
  Q7_MIXED,
  Q8_MIXED,
  Q9_MIXED,
  Q10_MIXED,
  selfReflectionSection(),
];

const FOUNDATION_SECTIONS = [
  ...openingSections(),
  Q1_FOUNDATION,
  Q2_FOUNDATION,
  Q3_FOUNDATION,
  Q4_FOUNDATION,
  Q5_FOUNDATION,
  Q6_FOUNDATION,
  Q7_FOUNDATION,
  Q8_FOUNDATION,
  Q9_FOUNDATION,
  Q10_FOUNDATION,
  selfReflectionSection(),
];

const HIGHER_SECTIONS = [
  ...openingSections(),
  Q1_MIXED,
  Q2_HIGHER,
  Q3_HIGHER,
  Q4_HIGHER,
  Q5_HIGHER,
  Q6_HIGHER,
  Q7_HIGHER,
  Q8_HIGHER,
  Q9_HIGHER,
  Q10_HIGHER,
  Q11_HIGHER,
  selfReflectionSection(),
];

// Scaffolded: wording derived from Foundation, not Higher
const SCAFFOLDED_SECTIONS = [
  ...openingSections(),
  FORMULA_REFERENCE,
  Q1_FOUNDATION,
  SS_Q1,
  Q2_FOUNDATION,
  SS_Q2,
  Q3_FOUNDATION,
  SS_Q3,
  Q4_FOUNDATION,
  Q5_FOUNDATION,
  SS_Q5,
  Q6_FOUNDATION,
  SS_Q6,
  Q7_FOUNDATION,
  SS_Q7,
  Q8_FOUNDATION,
  SS_Q8,
  Q9_FOUNDATION,
  Q10_FOUNDATION,
  selfReflectionSection(),
];

// ─── Tier definitions ─────────────────────────────────────────────────────────

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Algebra & Graphs - Mixed (Year 10 Maths)",
    subtitle: "Curated GCSE Maths worksheet - Mixed",
    sections: MIXED_SECTIONS,
    teacher_sections: teacherSections(MIXED_MARK_SCHEME),
  },
  {
    tier: "foundation",
    title: "Algebra & Graphs - Foundation (Year 10 Maths)",
    subtitle: "Curated GCSE Maths worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(MIXED_MARK_SCHEME),
  },
  {
    tier: "higher",
    title: "Algebra & Graphs - Higher (Year 10 Maths)",
    subtitle: "Curated GCSE Maths worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: [
      { id: "teacher-answer-key", title: "Teacher Answer Key", type: "mark-scheme", teacherOnly: true, content: HIGHER_MARK_SCHEME },
      { id: "teacher-notes", title: "Teacher Notes", type: "teacher-notes", teacherOnly: true, content: HIGHER_TEACHER_NOTES },
    ],
  },
  {
    tier: "scaffolded",
    title: "Algebra & Graphs - Scaffolded (Year 10 Maths)",
    subtitle: "Curated GCSE Maths worksheet - Scaffolded SEND version",
    sections: SCAFFOLDED_SECTIONS,
    teacher_sections: teacherSections(
      MIXED_MARK_SCHEME,
      "\n\nScaffolded version notes: sentence starters are intentionally included after key written questions. " +
      "All wording is derived from Foundation level. " +
      "Use the dyslexia-friendly display formatting in the renderer when that SEND profile is selected."
    ),
  },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${options.method || "GET"} ${url} failed (${res.status}): ${err}`);
  }
  return res.json();
}

async function login() {
  const data = await requestJson(`${APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  return data.token || data.accessToken;
}

async function upsertEntry(token, tierDef) {
  const payload = {
    subject: SUBJECT,
    topic: TOPIC,
    yearGroup: YEAR_GROUP,
    title: tierDef.title,
    subtitle: tierDef.subtitle,
    learning_objective: LEARNING_OBJECTIVE,
    tier: tierDef.tier,
    source: SOURCE,
    curated: true,
    key_vocab: KEY_VOCAB,
    sections: tierDef.sections,
    teacher_sections: tierDef.teacher_sections,
  };

  const result = await requestJson(`${APP_URL}/api/library/entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return result.id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Logging in to ${APP_URL} as ${ADMIN_EMAIL}...`);
  const token = await login();
  console.log("Logged in successfully.");

  for (const tierDef of TIER_DEFINITIONS) {
    console.log(`\nUpserting ${tierDef.tier} worksheet...`);
    const entryId = await upsertEntry(token, tierDef);
    console.log(`  entry id: ${entryId}`);
  }

  console.log("\nAlgebra & Graphs curated worksheets seeded successfully.");
  console.log(`Subject: ${SUBJECT}`);
  console.log(`Topic: ${TOPIC}`);
  console.log(`Year group: ${YEAR_GROUP}`);
  console.log("Tiers: mixed, foundation, higher, scaffolded");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
