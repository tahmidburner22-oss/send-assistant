/**
 * KS3 Mathematics — diagram catalogue (Year 7–9).
 *
 * Anchored to the DfE KS3 Mathematics Programme of Study (gov.uk) and the
 * "ready for GCSE" command-word list (Calculate, Work out, Show that,
 * Explain). Designed to fill gaps the live diagram_library has for KS3 —
 * standard manipulation diagrams, graph templates, and geometry stems.
 *
 * Target: ~140 entries.
 */
import { range, emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Mathematics", year_band: "KS3" };
const STYLE_GRAPH =
  "Black axes with arrowheads, light grey gridlines, axis titles 12pt sans-serif, single coloured plot";
const STYLE_GEO =
  "Clean line-art, vertices marked with filled dots, side-lengths labelled with arrow ticks";
const TAGS_KS3 = ["KS3", "national-curriculum"];

export function build(ctx) {
  // ── Number — directed numbers, indices, primes, surds ─────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Directed numbers",
    year_group: "Year 7",
    description: "Number-line diagram for arithmetic with negatives.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_KS3, "directed-numbers", "number-line"],
  }, [
    "Number line −10..10 — every integer marked",
    "Number line −20..20 — step 2",
    "Directed addition — −3 + 5 jump diagram",
    "Directed subtraction — 4 − 7 jump diagram",
    "Multiplying negatives — sign rule grid (+,−,×,÷)",
    "Order directed numbers — six-card sort",
    "Temperature line — −15 °C to 25 °C with seasons labelled",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Factors, multiples and primes",
    year_group: "Year 7",
    description: "Factor / multiple / prime diagram for KS3.",
    style_notes: "Coloured cards with bold integers, divider lines",
    tags: [...TAGS_KS3, "factors", "multiples", "primes"],
  }, [
    "Prime number sieve to 100 (Eratosthenes)",
    "Factor tree — 60 worked example",
    "Factor tree — 84 worked example",
    "Factor tree — 360 worked example",
    "Venn diagram — HCF and LCM of 24 and 36",
    "Venn diagram — HCF and LCM of 18 and 30",
    "Prime factorisation — 100 = 2² × 5²",
    "Prime factorisation — 144 = 2⁴ × 3²",
    "Common multiples list strip — 6 and 8",
    "Common factors list strip — 24 and 36",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Indices and standard form",
    year_group: "Year 8",
    description: "Index-laws or standard-form representation card.",
    style_notes: "Equation typeset in serif maths font, key term highlighted",
    tags: [...TAGS_KS3, "indices", "standard-form"],
  }, [
    "Index laws poster — multiplication, division, power of a power",
    "Index law card — a^m × a^n = a^(m+n)",
    "Index law card — a^m ÷ a^n = a^(m−n)",
    "Index law card — (a^m)^n = a^(mn)",
    "Index law card — a^0 = 1",
    "Index law card — a^(−n) = 1/a^n",
    "Standard form intro — 3.4 × 10^5 = 340 000 conversion",
    "Standard form ladder — powers of 10 from 10^−3 to 10^6",
    "Square numbers 1²..15² grid",
    "Cube numbers 1³..10³ grid",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Fractions, decimals and percentages",
    year_group: "Year 7",
    description: "FDP equivalence diagram for KS3.",
    style_notes: "Three-cell card with arrows, percentage strip overlay",
    tags: [...TAGS_KS3, "FDP", "fractions"],
  }, [
    "FDP triangle — fraction ↔ decimal ↔ percentage conversions",
    "Percentage of an amount — bar-model worked example",
    "Percentage increase — 20% on £80 bar model",
    "Percentage decrease — 15% off £60 bar model",
    "Reverse percentage — find the original after 25% off",
    "Compound percentage — 5% growth over 3 years staircase",
    "Recurring decimal — 1/3 = 0.3̇ recurrence dot notation",
    "Recurring decimal to fraction — 0.7̇ method",
    "Adding mixed numbers — 2 1/3 + 1 5/6 fraction strips",
    "Dividing fractions — keep, change, flip diagram",
  ]);

  // ── Ratio and proportion ─────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Ratio and proportion",
    year_group: "Year 8",
    description: "Bar model or double number line for KS3 ratio.",
    style_notes: "Coloured bars with brackets, equal-step ticks",
    tags: [...TAGS_KS3, "ratio", "proportion"],
  }, [
    "Ratio bar model — split £60 in ratio 2:3",
    "Ratio bar model — split 200 g in ratio 3:5",
    "Ratio bar model — split 480 in ratio 2:3:5",
    "Ratio bar model — find total when one part is 24 (ratio 4:5)",
    "Direct proportion graph — y = kx straight line",
    "Inverse proportion graph — y = k/x curve",
    "Best buy comparison — two-column unit-price chart",
    "Recipe scaling — 4 to 6 portions ingredient chart",
    "Map scale — 1:50 000 with 2 cm worked example",
    "Currency conversion — £ ↔ € double number line",
  ]);

  // ── Algebra — expressions, equations, sequences, graphs ──────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Algebraic expressions",
    year_group: "Year 7",
    description: "Algebra-tiles or grid diagram showing manipulation of expressions.",
    style_notes: "Algebra tiles in green/blue/red, signs preserved",
    tags: [...TAGS_KS3, "algebra", "expressions"],
  }, [
    "Algebra tiles — collect like terms 3x + 2 + 4x − 1",
    "Algebra tiles — expand 3(x + 2)",
    "Grid method — expand 2(3x − 4)",
    "Grid method — expand (x + 3)(x + 5)",
    "Function machine — 2x + 3 single block",
    "Function machine chain — ÷2, then +5",
    "Substitution worked card — find 3a − 2b when a = 4, b = −1",
    "Like terms sort — six-card matching grid",
    "Factorising single bracket — 6x + 9 = 3(2x + 3)",
    "Sequence dot pattern — 1, 4, 9, 16 (square numbers)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Linear equations",
    year_group: "Year 8",
    description: "Balance-method visual for solving linear equations.",
    style_notes: "Equation balance scale with bricks for x and units",
    tags: [...TAGS_KS3, "linear-equations", "solving"],
  }, [
    "Balance scales — solve 2x + 5 = 13",
    "Balance scales — solve 3x − 4 = 11",
    "Balance scales — solve 5x = 2x + 12",
    "Solve linear — 4(x − 2) = 12",
    "Solve linear with brackets — 3(2x + 1) = 21",
    "Solve linear with fractions — x/3 + 2 = 7",
    "Forming equations — angles on a straight line worded card",
    "Forming equations — perimeter of a rectangle 2(3x+1) + 2x",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Sequences",
    year_group: "Year 8",
    description: "Sequence pattern or term-to-term diagram.",
    style_notes: "Numbered cards with arrows showing rule",
    tags: [...TAGS_KS3, "sequences", "nth-term"],
  }, [
    "Linear sequence pattern — 3, 7, 11, 15 with rule +4",
    "Linear sequence pattern — 5, 8, 11, 14 with rule +3",
    "Sequence dot pattern — triangular numbers 1, 3, 6, 10",
    "Sequence dot pattern — square numbers 1, 4, 9, 16",
    "Find nth term — 2n + 3 worked card",
    "Find nth term — 5n − 1 worked card",
    "Fibonacci spiral — 1, 1, 2, 3, 5, 8, 13",
    "Geometric sequence — common ratio ×2 staircase",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Linear graphs",
    year_group: "Year 8",
    description: "Coordinate-plane diagram for KS3 linear graphs.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_KS3, "linear-graphs", "y=mx+c"],
  }, [
    "Plot y = x — table and line on −5..5 grid",
    "Plot y = 2x — table and line on −5..5 grid",
    "Plot y = x + 3 — table and line",
    "Plot y = 2x − 1 — table and line",
    "Plot y = −x + 4 — table and line",
    "Identify gradient and intercept — y = 3x − 2 annotated",
    "Identify gradient and intercept — y = −2x + 5 annotated",
    "Parallel lines — y = 2x and y = 2x + 3 same gradient",
    "Horizontal line y = 4 vs vertical line x = −2",
    "Real-life linear graph — distance vs time",
  ]);

  // ── Geometry and measures ────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Angle facts",
    year_group: "Year 7",
    description: "Angle-rule reference diagram for KS3.",
    style_notes: STYLE_GEO + ", angle arcs in red",
    tags: [...TAGS_KS3, "angles", "angle-facts"],
  }, [
    "Angles on a straight line sum to 180°",
    "Angles around a point sum to 360°",
    "Vertically opposite angles are equal",
    "Angles in a triangle sum to 180°",
    "Angles in a quadrilateral sum to 360°",
    "Exterior angle of a triangle = sum of two opposite interiors",
    "Co-interior (allied) angles sum to 180° (parallel lines)",
    "Alternate angles are equal (Z-angles, parallel lines)",
    "Corresponding angles are equal (F-angles, parallel lines)",
    "Sum of interior angles in an n-gon = (n−2) × 180°",
    "Each exterior angle of a regular n-gon = 360° ÷ n",
    "Bearing diagram — three-figure bearing 075° from A",
    "Bearing diagram — back bearing 255°",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Area and perimeter",
    year_group: "Year 7",
    description: "Polygon-area diagram with measurements labelled.",
    style_notes: STYLE_GEO,
    tags: [...TAGS_KS3, "area", "perimeter"],
  }, [
    "Area of a parallelogram — base × perpendicular height",
    "Area of a triangle — ½ × base × perpendicular height",
    "Area of a trapezium — ½ × (a + b) × h",
    "Area of a rhombus — ½ × d₁ × d₂",
    "Compound rectangles — L-shape split labelled",
    "Compound rectangles — staircase shape split",
    "Perimeter of a compound shape — find the missing side first",
    "Circle parts — radius, diameter, circumference, chord, tangent, arc, sector",
    "Circumference — C = πd worked example",
    "Area of a circle — A = πr² worked example",
    "Area of a sector — fraction × πr² with 60° example",
    "Arc length — fraction × πd with 90° example",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Volume and surface area",
    year_group: "Year 8",
    description: "3D solid with dimensions and formula reminder.",
    style_notes: "Isometric 3D shape, hidden edges dashed, formula in pill below",
    tags: [...TAGS_KS3, "volume", "surface-area", "3D"],
  }, [
    "Volume of a cuboid — 5 × 3 × 4 worked example",
    "Volume of a cube — side³ worked example",
    "Volume of a triangular prism — area × length",
    "Volume of a cylinder — πr²h worked example",
    "Surface area of a cuboid — net method",
    "Surface area of a cylinder — 2πr² + 2πrh",
    "Net of a cuboid — labelled with letters A–F",
    "Net of a triangular prism — five panels",
    "Net of a cylinder — two circles and a rectangle",
    "Plan, front and side elevations — five-cube building",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Transformations",
    year_group: "Year 8",
    description: "Coordinate-grid transformation card showing object and image.",
    style_notes: STYLE_GRAPH + ", object blue, image red, mirror line dashed",
    tags: [...TAGS_KS3, "transformations"],
  }, [
    "Reflection — triangle in y = 0 (x-axis)",
    "Reflection — triangle in x = 0 (y-axis)",
    "Reflection — triangle in y = x",
    "Reflection — triangle in y = −x",
    "Reflection — triangle in x = 2",
    "Translation — vector (3, −2) on a triangle",
    "Translation — vector (−4, 1) on a quadrilateral",
    "Rotation — 90° clockwise about origin",
    "Rotation — 180° about (1, 1)",
    "Rotation — 270° clockwise about (−1, 0)",
    "Enlargement — scale factor 2, centre origin",
    "Enlargement — scale factor ½, centre (3, 3)",
    "Enlargement — scale factor −1, centre origin",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Pythagoras' theorem",
    year_group: "Year 9",
    description: "Right-angled triangle diagram introducing Pythagoras.",
    style_notes: STYLE_GEO + ", right angle marked with square",
    tags: [...TAGS_KS3, "pythagoras", "right-triangle"],
  }, [
    "Pythagoras introduction — squares on each side, areas labelled",
    "Pythagoras worked example — 3, 4, 5 triangle",
    "Pythagoras worked example — 5, 12, 13 triangle",
    "Pythagoras finding hypotenuse — 6, 8, ?",
    "Pythagoras finding shorter side — 13, ?, 12",
    "Pythagoras in real-life — ladder against a wall",
    "Pythagoras on a coordinate grid — distance between two points",
  ]);

  // ── Statistics and probability ───────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Statistics",
    year_group: "Year 8",
    description: "Statistical chart template common in KS3 schemes of work.",
    style_notes: STYLE_GRAPH + ", category colours from a gentle palette",
    tags: [...TAGS_KS3, "statistics", "data-handling"],
  }, [
    "Frequency table — tally and frequency columns",
    "Bar chart — favourite subjects (frequency 0–30)",
    "Dual bar chart — boys vs girls favourite sport",
    "Pictogram with key — 1 picture = 5 votes",
    "Pie chart with angle calculation steps",
    "Stem-and-leaf diagram — test scores",
    "Back-to-back stem-and-leaf diagram — boys vs girls",
    "Scatter graph — positive correlation",
    "Scatter graph — negative correlation",
    "Scatter graph — no correlation",
    "Scatter graph with line of best fit (positive)",
    "Time-series line graph — temperature across a week",
    "Frequency polygon — overlay on histogram",
    "Mean from a frequency table — fx column worked",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Probability",
    year_group: "Year 9",
    description: "Probability diagram introducing sample space and tree diagrams.",
    style_notes: "Probability fractions on each branch, outcomes listed at leaves",
    tags: [...TAGS_KS3, "probability"],
  }, [
    "Probability scale 0..1 — labelled (impossible / unlikely / even / likely / certain)",
    "Sample space diagram — two dice, sum table",
    "Sample space diagram — coin and spinner combinations",
    "Two-way table — boys/girls vs glasses/no-glasses",
    "Frequency tree — disease test, 100 patients",
    "Tree diagram — two coin flips, all four outcomes",
    "Tree diagram — drawing two counters with replacement",
    "Tree diagram — drawing two counters without replacement",
    "Venn diagram — two-set with intersection labelled",
    "Venn diagram — three-set with regions labelled",
    "Mutually exclusive events — addition rule card",
    "Independent events — multiplication rule card",
  ]);
}
