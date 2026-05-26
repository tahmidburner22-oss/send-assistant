/**
 * GCSE Mathematics — diagram catalogue (Year 10–11).
 *
 * Anchored to AQA, Pearson Edexcel and OCR GCSE Mathematics specifications
 * (foundation + higher tier). Heavy-priority diagram families flagged in
 * the brief: probability trees, cumulative-frequency curves, histograms
 * with unequal class widths, transformations, vectors, the eight standard
 * circle theorems, trig graphs, surds / index notation cards.
 *
 * Target: ~250 entries.
 */
import { range, emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Mathematics", year_band: "GCSE" };
const STYLE_GRAPH =
  "Black axes with arrowheads, light grey gridlines, axis titles 12pt sans-serif, single coloured plot, exam-paper white background";
const STYLE_GEO =
  "Clean line-art, vertices marked with filled dots, side-lengths labelled, angles arced in red";
const TAGS = ["GCSE", "mathematics"];

export function build(ctx) {
  // ── Number — surds, indices, standard form ───────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Surds",
    year_group: "Year 10",
    description: "Surd manipulation flashcard with worked rule and example.",
    style_notes: "Equation in serif maths font, key step highlighted in colour",
    tags: [...TAGS, "surds", "higher"],
  }, [
    "Surd rule — √(ab) = √a × √b (worked: √50 = √25 × √2 = 5√2)",
    "Surd rule — √(a/b) = √a / √b (worked: √(9/4) = 3/2)",
    "Surd simplification — √72 to 6√2",
    "Surd simplification — √128 to 8√2",
    "Surd simplification — √200 to 10√2",
    "Adding surds — 3√2 + 5√2 = 8√2",
    "Subtracting surds — 7√3 − 2√3 = 5√3",
    "Multiplying surds — (2√3)(5√2) = 10√6",
    "Rationalising the denominator — 1/√3 = √3/3",
    "Rationalising the denominator — 5/(2√7) = 5√7/14",
    "Rationalising — conjugate method (1/(2 + √3))",
    "Surd in coordinates — distance √2 between (1,1) and (2,2)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Indices and standard form",
    year_group: "Year 10",
    description: "Index-law / standard-form flashcard.",
    style_notes: "Equation in serif maths font, rule label in pill",
    tags: [...TAGS, "indices", "standard-form"],
  }, [
    "Index law — a^m × a^n = a^(m+n)",
    "Index law — a^m ÷ a^n = a^(m−n)",
    "Index law — (a^m)^n = a^(mn)",
    "Index law — a^0 = 1",
    "Index law — a^(−n) = 1/a^n",
    "Index law — a^(1/n) = ⁿ√a",
    "Index law — a^(m/n) = (ⁿ√a)^m",
    "Standard form — 4.5 × 10^6 to ordinary number",
    "Standard form — 0.000 23 to 2.3 × 10^−4",
    "Standard form — multiplying (3 × 10^4)(2 × 10^3) = 6 × 10^7",
    "Standard form — dividing (8 × 10^9) ÷ (4 × 10^4) = 2 × 10^5",
    "Standard form — adding with same exponent",
  ]);

  // ── Algebra — quadratics, simultaneous, inequalities ────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Quadratic equations",
    year_group: "Year 11",
    description: "Quadratic-method worked-example card.",
    style_notes: "Equation centred, factor pair / formula highlighted, solution circled",
    tags: [...TAGS, "quadratics", "higher", "algebra"],
  }, [
    "Factorising — x² + 5x + 6 = (x + 2)(x + 3)",
    "Factorising — x² − 7x + 12 = (x − 3)(x − 4)",
    "Factorising — x² + 2x − 15 = (x + 5)(x − 3)",
    "Factorising difference of two squares — x² − 49 = (x + 7)(x − 7)",
    "Factorising difference of two squares — 9x² − 16 = (3x + 4)(3x − 4)",
    "Factorising harder — 2x² + 7x + 3 = (2x + 1)(x + 3)",
    "Factorising harder — 6x² − 13x + 6 = (2x − 3)(3x − 2)",
    "Solving by factorising — x² − 5x + 6 = 0",
    "Quadratic formula card — x = (−b ± √(b² − 4ac)) / 2a",
    "Quadratic formula worked — 2x² + 3x − 5 = 0",
    "Completing the square — x² + 6x + 5 → (x + 3)² − 4",
    "Completing the square — 2x² − 8x + 6 → 2(x − 2)² − 2",
    "Discriminant — b² − 4ac and root counts (3 cases)",
    "Quadratic graph — y = x², parabola through origin",
    "Quadratic graph — y = (x − 2)² + 1, vertex translation",
    "Quadratic graph — y = −x² + 4, downward parabola",
    "Quadratic graph — roots from intersection with x-axis",
    "Quadratic graph — turning point and axis of symmetry labelled",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Simultaneous equations",
    year_group: "Year 10",
    description: "Simultaneous-equation worked-method card.",
    style_notes: "Two equations stacked, elimination/substitution arrows in red",
    tags: [...TAGS, "simultaneous", "algebra"],
  }, [
    "Linear simultaneous — elimination method (3x + 2y = 12, x − y = 1)",
    "Linear simultaneous — substitution method (y = 2x + 1, 3x + y = 13)",
    "Linear simultaneous — graphical solution intersection",
    "Linear simultaneous — same gradient (no solution) graph",
    "Linear simultaneous — coincident lines (infinite solutions)",
    "Quadratic and linear simultaneous — y = x² and y = x + 2",
    "Word problem — coffee and tea pricing simultaneous",
    "Word problem — perimeter and area simultaneous",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Inequalities",
    year_group: "Year 11",
    description: "Inequality / number-line / region diagram.",
    style_notes: "Open vs closed circle on number line, shaded region in graph",
    tags: [...TAGS, "inequalities", "algebra"],
  }, [
    "Linear inequality — x > 3 number line",
    "Linear inequality — x ≤ −2 number line (closed circle)",
    "Linear inequality — −1 < x ≤ 4 number line",
    "Solving inequality — 3x + 5 > 14 worked",
    "Solving inequality — sign flip when dividing by negative",
    "Quadratic inequality — x² − 4 > 0 sketch",
    "Graphical region — y > x + 1, shaded above line",
    "Graphical region — three-inequality system shaded",
    "Set notation — {x : x > 3} card",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Algebraic fractions and identities",
    year_group: "Year 11",
    description: "Algebraic-fraction worked card.",
    style_notes: "Fraction stacked vertically, factorisation steps shown",
    tags: [...TAGS, "algebraic-fractions", "higher"],
  }, [
    "Simplify (x² − 9)/(x − 3) = x + 3",
    "Simplify (x² + 5x + 6)/(x + 2) = x + 3",
    "Add (1/x) + (1/(x+1)) = (2x+1)/(x(x+1))",
    "Subtract (3/(x−1)) − (2/(x+2)) common denominator",
    "Multiply algebraic fractions — cancellation example",
    "Divide algebraic fractions — KCF method",
    "Equation with algebraic fractions — solve and check non-permissible value",
    "Identity vs equation — ≡ symbol explainer card",
    "Proof identity — (n + 1)² − n² ≡ 2n + 1",
  ]);

  // ── Functions and graphs ─────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Functions and graphs",
    year_group: "Year 11",
    description: "Function-notation or transformation card.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS, "functions", "transformations"],
  }, [
    "Function notation — f(x) = 2x + 1 with f(3) substitution",
    "Composite function — fg(x) order matters card",
    "Inverse function — f⁻¹(x) reflection in y = x",
    "Cubic graph — y = x³, point of inflection at origin",
    "Cubic graph — y = x³ − 3x² with three turning points sketched",
    "Reciprocal graph — y = 1/x, two branches",
    "Reciprocal graph — y = −1/x, opposite asymptotes",
    "Exponential graph — y = 2^x growth",
    "Exponential graph — y = (1/2)^x decay",
    "Sine graph — y = sin x, 0–360° two cycles",
    "Cosine graph — y = cos x, 0–360°",
    "Tangent graph — y = tan x, asymptotes at 90° and 270°",
    "Transformation — y = f(x) + a (vertical shift)",
    "Transformation — y = f(x + a) (horizontal shift)",
    "Transformation — y = af(x) (vertical stretch)",
    "Transformation — y = f(ax) (horizontal stretch)",
    "Transformation — y = −f(x) (reflection in x-axis)",
    "Transformation — y = f(−x) (reflection in y-axis)",
    "Estimating area under a curve — trapezium rule strips",
    "Estimating gradient at a point — tangent on curve",
  ]);

  // ── Geometry and measures ────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Pythagoras and trigonometry",
    year_group: "Year 10",
    description: "Pythagoras / trigonometry worked-card.",
    style_notes: STYLE_GEO + ", right-angle squared mark",
    tags: [...TAGS, "pythagoras", "trigonometry"],
  }, [
    "Pythagoras — find the hypotenuse (5, 12, ?)",
    "Pythagoras — find a shorter side (?, 8, 17)",
    "Pythagoras in 3D — diagonal of a cuboid",
    "SOHCAHTOA mnemonic poster",
    "Trig — find an angle (sin θ = 0.5)",
    "Trig — find a side (cos 30° × 8)",
    "Trig — sides of an isosceles right triangle",
    "Sine rule — a/sin A = b/sin B card",
    "Cosine rule — a² = b² + c² − 2bc cos A card",
    "Area of a triangle — ½ab sin C card",
    "Bearings problem — three-figure bearing on a sketch map",
    "Exact trig values — 0°, 30°, 45°, 60°, 90° table",
    "Angle of elevation vs depression — labelled card",
  ]);

  // The 8 standard circle theorems — one diagram each, plus extras
  emitTitled(ctx, {
    ...COMMON,
    topic: "Circle theorems",
    year_group: "Year 11",
    description: "Standard circle-theorem diagram with rule labelled.",
    style_notes: "Circle in black, radii / chords coloured, theorem statement underneath",
    tags: [...TAGS, "circle-theorems", "higher", "geometry"],
  }, [
    "Circle theorem 1 — angle at the centre is twice the angle at the circumference",
    "Circle theorem 2 — angle in a semicircle is 90°",
    "Circle theorem 3 — angles in the same segment are equal",
    "Circle theorem 4 — opposite angles in a cyclic quadrilateral sum to 180°",
    "Circle theorem 5 — tangent meets radius at 90°",
    "Circle theorem 6 — two tangents from an external point are equal",
    "Circle theorem 7 — alternate segment theorem",
    "Circle theorem 8 — perpendicular from centre to chord bisects the chord",
    "Circle parts reference — radius, diameter, chord, tangent, secant, arc, sector, segment",
    "Circle equation — x² + y² = r² card",
    "Equation of a tangent — perpendicular gradient method",
    "Mixed circle-theorem worked example (two theorems combined)",
  ]);

  // ── Vectors ─────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Vectors",
    year_group: "Year 11",
    description: "Vector-notation diagram for GCSE Maths higher tier.",
    style_notes: "Bold lower-case letter for vector, arrows on lines, parallelogram law shown",
    tags: [...TAGS, "vectors", "higher"],
  }, [
    "Column vector — (3, 2) plotted from origin",
    "Column vector — (−4, 1) plotted from origin",
    "Vector addition — triangle law (a + b)",
    "Vector addition — parallelogram law",
    "Vector subtraction — a − b = a + (−b)",
    "Scalar multiplication — 2a is twice as long",
    "Negative vector — −a is the reverse of a",
    "Magnitude of a vector — |a| = √(x² + y²)",
    "Position vectors — points A and B from origin",
    "Vector geometry — midpoint of AB",
    "Vector geometry — proving three points collinear",
    "Vector geometry — ratio division of a line (1:2)",
    "Resolved vector — i and j component form",
  ]);

  // ── Transformations ──────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Transformations",
    year_group: "Year 10",
    description: "Coordinate-grid transformation card with object and image.",
    style_notes: STYLE_GRAPH + ", object blue, image red, mirror line dashed",
    tags: [...TAGS, "transformations"],
  }, [
    "Reflection in y = x — triangle worked",
    "Reflection in y = −x — triangle worked",
    "Reflection in x = 3 — triangle worked",
    "Reflection in y = −1 — triangle worked",
    "Translation by (4, −3) — labelled column vector",
    "Translation by (−2, 5) — labelled column vector",
    "Rotation 90° anticlockwise about origin",
    "Rotation 180° about (1, 2)",
    "Rotation 90° clockwise about (−1, 1)",
    "Enlargement scale factor 2 about (0, 0)",
    "Enlargement scale factor 3 about (1, 1)",
    "Enlargement fractional scale factor 1/2 about origin",
    "Enlargement negative scale factor −1 about origin",
    "Enlargement negative scale factor −2 about (3, 0)",
    "Combination — reflect then translate, sequence card",
    "Describing a transformation — flowchart for which to identify",
  ]);

  // ── Statistics — heavy GCSE focus ────────────────────────────────────────
  // Cumulative frequency curves
  emitTitled(ctx, {
    ...COMMON,
    topic: "Cumulative frequency",
    year_group: "Year 11",
    description: "Cumulative-frequency-curve diagram.",
    style_notes: STYLE_GRAPH + ", S-shaped curve, median / quartile dashed lines",
    tags: [...TAGS, "cumulative-frequency", "higher", "statistics"],
  }, [
    "Cumulative frequency curve — single S-curve template (axes only)",
    "Cumulative frequency curve — example with median read off",
    "Cumulative frequency curve — example with lower and upper quartiles",
    "Cumulative frequency curve — example with interquartile range",
    "Cumulative frequency curve — comparing two curves (boys vs girls)",
    "Box plot from cumulative frequency — five-number summary",
    "Box plot — comparing distributions side by side",
    "Frequency density formula — fd = frequency / class width card",
  ]);

  // Histograms with unequal class widths
  emitTitled(ctx, {
    ...COMMON,
    topic: "Histograms",
    year_group: "Year 11",
    description: "Histogram with unequal class widths and frequency density.",
    style_notes: STYLE_GRAPH + ", bars touching, frequency density axis label",
    tags: [...TAGS, "histograms", "higher", "statistics"],
  }, [
    "Histogram — equal class widths reminder card",
    "Histogram — unequal class widths with frequency density",
    "Histogram — find frequency from a bar (area = freq)",
    "Histogram — find a missing frequency",
    "Histogram — compare two distributions",
    "Histogram — estimate the median by counting half",
    "Histogram — modal class identification",
    "Histogram vs bar chart — side-by-side comparison card",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Averages and spread",
    year_group: "Year 10",
    description: "Averages / spread reference card or worked example.",
    style_notes: "Data set listed, working space underneath",
    tags: [...TAGS, "averages", "statistics"],
  }, [
    "Mean from a frequency table — fx column worked",
    "Modal class from a grouped frequency table",
    "Median from a frequency table — half-way method",
    "Estimated mean from a grouped frequency table",
    "Range from raw data card",
    "Interquartile range from a list",
    "Stem-and-leaf — find the median",
    "Outlier identification — using IQR rule",
    "Comparing two distributions — average and spread sentence stems",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Probability",
    year_group: "Year 11",
    description: "Probability tree or sample-space diagram.",
    style_notes: "Branches labelled with probabilities, outcomes at leaves",
    tags: [...TAGS, "probability", "tree-diagrams"],
  }, [
    "Probability tree — two coin flips (independent)",
    "Probability tree — drawing two counters with replacement",
    "Probability tree — drawing two counters without replacement",
    "Probability tree — three-stage independent events",
    "Probability tree — conditional with red/blue marbles",
    "Probability tree — disease test with prevalence and accuracy",
    "Sample-space diagram — two dice sum",
    "Sample-space diagram — two dice product",
    "Two-way table — boys/girls vs subject choice",
    "Venn diagram — two-set with intersection",
    "Venn diagram — three-set with regions labelled",
    "Set notation — A ∪ B vs A ∩ B vs A' card",
    "Mutually exclusive events — addition rule card",
    "Conditional probability — P(A | B) formula card",
    "Frequency tree — given 1000 patients, two stages",
  ]);

  // ── Number — ratio, proportion, growth/decay, iteration ─────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Ratio and proportion",
    year_group: "Year 10",
    description: "GCSE ratio / proportion worked card.",
    style_notes: "Bar model in colour with clear brackets",
    tags: [...TAGS, "ratio", "proportion"],
  }, [
    "Ratio bar model — split £450 in ratio 4:5",
    "Ratio bar model — given one part, find the total",
    "Ratio change — 3:5 becomes 1:2 after additions",
    "Direct proportion graph — through origin",
    "Inverse proportion graph — y = k/x",
    "Direct proportion — y ∝ x² parabola",
    "Inverse proportion — y ∝ 1/x²",
    "Compound interest formula — A = P(1 + r/100)^n card",
    "Depreciation — exponential decay graph",
    "Speed-distance-time triangle",
    "Density-mass-volume triangle",
    "Pressure-force-area triangle",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Iteration and numerical methods",
    year_group: "Year 11",
    description: "Iteration diagram for higher-tier GCSE Maths.",
    style_notes: STYLE_GRAPH + ", staircase / cobweb pattern between curve and y = x",
    tags: [...TAGS, "iteration", "higher"],
  }, [
    "Iterative formula — x_(n+1) = √(2x_n + 1) staircase",
    "Iterative formula — x_(n+1) = 1 + 3/x_n cobweb",
    "Trial and improvement — narrowing the bracket",
    "Newton-style improvement — using a tangent (informal)",
    "Calculator iteration — repeated press of ANS",
  ]);

  // ── Geometry — congruency, similarity, 3D problems ──────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Congruency and similarity",
    year_group: "Year 11",
    description: "Congruency / similarity proof diagram.",
    style_notes: STYLE_GEO,
    tags: [...TAGS, "congruency", "similarity"],
  }, [
    "Congruency conditions — SSS, SAS, ASA, AAS, RHS poster",
    "Congruency proof — two triangles in a kite",
    "Similar triangles — corresponding sides ratio",
    "Similar triangles inside a triangle — parallel-line setup",
    "Similar shapes — area scale factor (k²)",
    "Similar shapes — volume scale factor (k³)",
    "Similar shapes — given volume ratio, find length ratio",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Volume and surface area",
    year_group: "Year 10",
    description: "3D-shape volume / surface-area card.",
    style_notes: "Isometric solid with hidden edges dashed, formula reminder pill",
    tags: [...TAGS, "volume", "surface-area"],
  }, [
    "Volume of a prism — A × length card",
    "Volume of a cylinder — πr²h worked",
    "Volume of a cone — ⅓πr²h worked",
    "Volume of a sphere — (4/3)πr³ worked",
    "Volume of a pyramid — ⅓ × base area × height",
    "Volume of a frustum — subtract small cone",
    "Surface area of a cylinder — 2πr² + 2πrh",
    "Surface area of a sphere — 4πr²",
    "Surface area of a cone — πr² + πrl",
    "Compound 3D — hemisphere on a cylinder",
    "Compound 3D — cone on a cylinder",
  ]);

  // ── Sequences — including geometric and quadratic ───────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Sequences",
    year_group: "Year 10",
    description: "Sequence-type card for GCSE.",
    style_notes: "Number cards in a row with rule arrow",
    tags: [...TAGS, "sequences"],
  }, [
    "Linear sequence — find nth term (3n + 2)",
    "Linear sequence — find nth term given first three terms",
    "Quadratic sequence — second-difference method",
    "Quadratic sequence — find nth term (n² + 2)",
    "Geometric sequence — common ratio card",
    "Fibonacci-type sequence — recursive rule",
    "Arithmetic sequence — sum of first n terms (informal)",
    "Sequence of triangular numbers — 1, 3, 6, 10, 15",
    "Sequence of square numbers — 1, 4, 9, 16, 25",
    "Sequence of cube numbers — 1, 8, 27, 64",
  ]);

  // ── Constructions and loci ──────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Constructions and loci",
    year_group: "Year 10",
    description: "Construction or locus diagram with arc marks visible.",
    style_notes: "Pencil-style line, compass arcs visible, instruction caption",
    tags: [...TAGS, "constructions", "loci"],
  }, [
    "Perpendicular bisector of a line segment",
    "Perpendicular from a point to a line",
    "Perpendicular at a point on a line",
    "Angle bisector",
    "60° angle construction",
    "Equilateral triangle construction",
    "Triangle from SSS construction",
    "Triangle from ASA construction",
    "Locus — equidistant from a point (circle)",
    "Locus — equidistant from a line (parallels)",
    "Locus — equidistant from two points",
    "Locus — equidistant from two intersecting lines",
    "Combined locus — region inside a field",
  ]);

  // ── Foundation-tier specific topics that aren't only for higher ─────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Foundation tier essentials",
    year_group: "Year 10",
    description: "Foundation-tier core diagram.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS, "foundation", "core"],
  }, [
    "Place-value chart — to billions and to thousandths",
    "Long multiplication — grid method (314 × 27)",
    "Long division — bus-stop method (846 ÷ 6)",
    "BIDMAS poster",
    "Mixed-number to top-heavy fraction conversion",
    "Decimal-to-percentage-to-fraction triangle",
    "Calculator non-key vs key card",
    "Estimating with significant figures (1 s.f. method)",
    "Rounding to 2 decimal places card",
    "Bounds — error interval [12.5, 13.5)",
  ]);

  // Number-line probability scale repeated for foundation
  range(11, (i) => {
    const p = i / 10;
    ctx.add({
      ...COMMON,
      title: `Probability scale — ${p} marked`,
      topic: "Probability",
      year_group: "Year 10",
      description: `Probability scale 0..1 with an arrow on ${p} and a written-word label (impossible / unlikely / even chance / likely / certain).`,
      style_notes: "Horizontal line, ticks at 0, 0.5, 1, key words underneath",
      tags: [...TAGS, "probability", "foundation", "number-line"],
    });
  });
}
