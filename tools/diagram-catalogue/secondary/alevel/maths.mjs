/**
 * A-Level Mathematics and Further Mathematics — diagram catalogue.
 *
 * Anchored to AQA, Pearson Edexcel, OCR A and OCR MEI A-Level Maths and
 * Further Maths specifications.
 *
 * Target: ~230 entries combined.
 */
import { emitTitled } from "../../_helpers.mjs";

const STYLE_GRAPH =
  "Black axes with arrowheads, light grey gridlines, axis titles 12pt sans-serif, single coloured plot, exam-paper feel";
const STYLE_DIAG =
  "Clean line-art with vertices marked, side-lengths labelled, angles arced where relevant";
const TAGS_M = ["A-Level", "mathematics"];
const TAGS_FM = ["A-Level", "further-mathematics"];

export function build(ctx) {
  // ── Pure mathematics core ───────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Mathematics",
    year_band: "A-Level",
    topic: "Algebra and functions",
    year_group: "Year 12",
    description: "Pure-mathematics graph or function-card for A-Level.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_M, "pure", "functions"],
  }, [
    "Quadratic completing the square — y = a(x − h)² + k vertex form",
    "Discriminant — three cases of roots",
    "Polynomial division — synthetic division card",
    "Factor theorem and remainder theorem cards",
    "Function transformation — y = f(x) + a / f(x + a) / af(x) / f(ax)",
    "Modulus function — y = |x| graph",
    "Modulus equation — solving |x − 3| = 5 graphically",
    "Inverse function — reflection in y = x",
    "Composite function — order matters card",
    "Domain and range card",
    "Partial fractions — proper / improper card",
    "Binomial expansion — (1 + x)^n series and convergence",
    "Binomial coefficient — Pascal's triangle to nCr",
    "Sequences — arithmetic / geometric formulas card",
    "Sigma notation — Σ from i=1 to n card",
    "Convergent vs divergent geometric series",
    "Sum to infinity — |r| < 1 card",
  ]);

  emitTitled(ctx, {
    subject: "Mathematics",
    year_band: "A-Level",
    topic: "Trigonometry",
    year_group: "Year 12",
    description: "Trigonometry graph or identity card for A-Level.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_M, "trigonometry"],
  }, [
    "y = sin x, y = cos x, y = tan x — full curves with asymptotes",
    "Reciprocal trig graphs — sec x, cosec x, cot x",
    "Inverse trig graphs — arcsin / arccos / arctan",
    "Unit circle — sin / cos / tan exact values",
    "CAST diagram — sign of trig in each quadrant",
    "Pythagorean identity — sin²θ + cos²θ ≡ 1 card",
    "Double-angle formulas card",
    "Compound-angle formulas card",
    "Sine rule and cosine rule card",
    "Area of a triangle — ½ab sin C",
    "Solving trig equations — common pitfalls flowchart",
    "Radians vs degrees conversion card",
    "Arc length and sector area in radians",
    "Small-angle approximations card",
    "Harmonic form — R sin(x + α) and R cos(x + α)",
  ]);

  emitTitled(ctx, {
    subject: "Mathematics",
    year_band: "A-Level",
    topic: "Calculus",
    year_group: "Year 13",
    description: "Calculus diagram or formula card for A-Level.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_M, "calculus"],
  }, [
    "Differentiation from first principles — limit definition",
    "Differentiation rules card — power, sum, product, quotient, chain",
    "Derivatives of common functions — sin, cos, tan, e^x, ln x",
    "Tangent and normal at a point",
    "Increasing / decreasing functions card",
    "Stationary points — first and second derivative tests",
    "Concavity and points of inflection",
    "Implicit differentiation — worked example",
    "Parametric differentiation — chain-rule formulation",
    "Related rates of change — water flow worked example",
    "Integration — indefinite and definite card",
    "Standard integrals card",
    "Integration by substitution",
    "Integration by parts",
    "Integration of partial fractions",
    "Volume of revolution — about the x-axis",
    "Volume of revolution — about the y-axis",
    "Trapezium rule estimation",
    "Mid-ordinate rule",
    "Simpson's rule",
    "Differential equation — variables-separable solution",
    "Differential equation — exponential growth and decay",
    "Modelling with differential equations — Newton's law of cooling",
  ]);

  emitTitled(ctx, {
    subject: "Mathematics",
    year_band: "A-Level",
    topic: "Coordinate geometry",
    year_group: "Year 12",
    description: "Coordinate-geometry diagram for A-Level.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_M, "coordinate-geometry"],
  }, [
    "Equation of a straight line — y = mx + c and ax + by + c = 0",
    "Perpendicular and parallel gradients card",
    "Equation of a circle — (x − a)² + (y − b)² = r²",
    "Tangent to a circle — perpendicular to radius",
    "Intersections of a line and a circle — discriminant interpretation",
    "Parametric equations — x = a cos t, y = a sin t (circle)",
    "Parametric equations — projectile path",
  ]);

  // ── Statistics and probability ──────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Mathematics",
    year_band: "A-Level",
    topic: "Statistics",
    year_group: "Year 13",
    description: "A-Level Statistics chart or distribution diagram.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_M, "statistics"],
  }, [
    "Histogram with frequency density",
    "Cumulative frequency curve with quartiles",
    "Box plot and outlier rule (1.5 × IQR)",
    "Scatter graph with PMCC interpretation",
    "Correlation strength — r values card",
    "Regression line — least squares idea",
    "Standard deviation — formula and intuition",
    "Discrete random variable — probability table",
    "Binomial distribution — bar chart for X~B(n, p)",
    "Binomial distribution — formula card",
    "Normal distribution — labelled bell curve",
    "Standard normal Z = (X − μ)/σ card",
    "Empirical 68/95/99.7 rule",
    "Hypothesis testing — null vs alternative card",
    "Hypothesis testing — one-tail vs two-tail diagram",
    "Hypothesis test for binomial — critical region",
    "Hypothesis test for normal mean using Z",
    "Hypothesis test for PMCC ρ using critical values",
    "Sampling — random / stratified / systematic / opportunity / quota",
    "Conditional probability — P(A | B) tree",
    "Bayes-style probability tree",
    "Venn diagram — three-set with regions labelled",
  ]);

  // ── Mechanics ───────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Mathematics",
    year_band: "A-Level",
    topic: "Mechanics",
    year_group: "Year 13",
    description: "Mechanics diagram or graph for A-Level Maths.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_M, "mechanics"],
  }, [
    "Suvat equations — five named equations card",
    "Velocity-time graph — area under = displacement",
    "Velocity-time graph — gradient = acceleration",
    "Free-body diagram — block on rough inclined plane",
    "Free-body diagram — particle on a string over a pulley",
    "Free-body diagram — connected particles on a smooth table",
    "Newton's Second Law — F = ma worked",
    "Newton's Third Law — pair force diagram",
    "Friction model — μR limiting friction card",
    "Projectile motion — independent horizontal and vertical components",
    "Projectile motion — range and maximum height formulas",
    "Centre of mass of a system of particles",
    "Moments — taking moments about a point card",
    "Equilibrium — sum of forces / moments zero",
    "Vector mechanics — i, j, k components card",
    "Variable force — F(t) and integration",
  ]);

  // ── Proof and modelling ─────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Mathematics",
    year_band: "A-Level",
    topic: "Proof and modelling",
    year_group: "Year 12",
    description: "Proof / modelling diagram for A-Level.",
    style_notes: "Equation-typeset card with reasoning steps",
    tags: [...TAGS_M, "proof", "modelling"],
  }, [
    "Proof by deduction — example card",
    "Proof by exhaustion — example card",
    "Proof by contradiction — example (√2 irrational)",
    "Proof by counter-example card",
    "Disproof using a numerical counter-example",
    "Mathematical modelling cycle — five steps",
  ]);

  // ── Further Mathematics ─────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Further Mathematics",
    year_band: "A-Level",
    topic: "Further pure",
    year_group: "Year 12",
    description: "Further Pure topic card.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_FM, "further-pure"],
  }, [
    "Argand diagram — complex numbers as points",
    "Modulus and argument of a complex number",
    "Polar form — r(cos θ + i sin θ)",
    "Exponential form — re^(iθ)",
    "De Moivre's theorem card",
    "Roots of unity — n-th roots on a unit circle",
    "Locus on the Argand plane — circle, perpendicular bisector",
    "2×2 matrix — multiplication and determinant",
    "3×3 matrix — determinant by cofactor expansion",
    "Inverse matrix — 2×2 formula",
    "Simultaneous equations — matrix method",
    "Linear transformation matrices — rotation, reflection, enlargement, stretch, shear",
    "Eigenvalues and eigenvectors card",
    "Vector equation of a line — r = a + λb",
    "Vector equation of a plane — r·n = d",
    "Scalar product (dot product) and angle between vectors",
    "Vector product (cross product) and area",
    "Hyperbolic functions — sinh, cosh, tanh graphs",
    "Hyperbolic identities card",
    "Conic sections — ellipse, hyperbola, parabola",
  ]);

  emitTitled(ctx, {
    subject: "Further Mathematics",
    year_band: "A-Level",
    topic: "Further mechanics, statistics and decision",
    year_group: "Year 13",
    description: "Further Mechanics / Statistics / Decision Maths diagram.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_FM, "applied"],
  }, [
    "Impulse and momentum card — F·t = Δ(mv)",
    "Coefficient of restitution e — collision diagram",
    "Centre of mass of a uniform lamina",
    "Simple harmonic motion — graphs of x, v, a",
    "Damped oscillation graph",
    "Forced oscillation and resonance graph",
    "Poisson distribution — bar chart and formula card",
    "Geometric distribution — bar chart and formula card",
    "Continuous random variable — pdf and cdf relationship",
    "Chi-squared test — observed vs expected card",
    "Goodness-of-fit test setup",
    "Contingency table chi-squared test",
    "Algorithm — Dijkstra's shortest path step diagram",
    "Algorithm — Prim's minimum spanning tree",
    "Algorithm — Kruskal's minimum spanning tree",
    "Algorithm — Floyd's all-pairs shortest path",
    "Linear programming — feasible region with optimal corner",
    "Critical path analysis — activity-on-node network",
    "Critical path analysis — Gantt chart",
    "Flow networks — maximum flow / minimum cut",
    "Travelling salesperson — nearest-neighbour heuristic",
  ]);
}
