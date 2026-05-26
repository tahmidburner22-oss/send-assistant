/**
 * GCSE Business and Economics — diagram catalogue (Year 10–11).
 *
 * Anchored to AQA, Pearson Edexcel and OCR Business and Economics GCSE
 * specs. Heavy-priority families flagged in the brief: supply / demand
 * curves, PED elasticity grid, cost curves (TC / AC / MC), break-even
 * chart, SWOT / PESTLE / Porter's, Ansoff matrix, BCG matrix, circular
 * flow of income.
 *
 * Target: ~130 entries combined.
 */
import { emitTitled } from "../../_helpers.mjs";

const STYLE_GRAPH =
  "Black axes with arrowheads, axis titles 12pt sans-serif, single coloured plot, exam-paper feel";
const TAGS_B = ["GCSE", "business"];
const TAGS_E = ["GCSE", "economics"];

export function build(ctx) {
  // ── Business ────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Business",
    year_band: "GCSE",
    topic: "Business activity and ownership",
    year_group: "Year 10",
    description: "Business-activity diagram for GCSE.",
    style_notes: "Concept pill at top, examples branching out",
    tags: [...TAGS_B, "ownership"],
  }, [
    "Aims and objectives — SMART targets card",
    "Business sectors — primary / secondary / tertiary / quaternary",
    "Sole trader vs partnership vs Ltd vs PLC comparison",
    "Public vs private vs not-for-profit comparison",
    "Stakeholder map — internal / external",
    "Stakeholder conflict diagram",
    "Mission vs vision statement card",
    "Limited vs unlimited liability card",
  ]);

  emitTitled(ctx, {
    subject: "Business",
    year_band: "GCSE",
    topic: "Marketing",
    year_group: "Year 10",
    description: "Marketing-strategy diagram for GCSE.",
    style_notes: "Matrix or 4-quadrant layout, label per quadrant",
    tags: [...TAGS_B, "marketing"],
  }, [
    "Marketing mix — 4 Ps (Product / Price / Place / Promotion)",
    "Marketing mix — 7 Ps extension (People / Process / Physical evidence)",
    "Product life cycle — labelled phases",
    "Boston (BCG) matrix — Stars / Cash Cows / Question Marks / Dogs",
    "Ansoff matrix — Market Penetration / Development / Product Development / Diversification",
    "Pricing strategies — penetration / skimming / competitive / premium / cost-plus",
    "Promotion mix — advertising / PR / sales promotion / personal selling",
    "Marketing segmentation — demographic / geographic / psychographic / behavioural",
    "Market research — primary vs secondary card",
    "Brand identity diagram — logo / values / positioning",
    "USP card — Unique Selling Point",
    "AIDA model — Attention / Interest / Desire / Action",
  ]);

  emitTitled(ctx, {
    subject: "Business",
    year_band: "GCSE",
    topic: "Operations and finance",
    year_group: "Year 11",
    description: "Operations / finance diagram for GCSE.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_B, "operations", "finance"],
  }, [
    "Job vs batch vs flow production comparison",
    "Just-in-time vs just-in-case stock control",
    "Quality assurance vs quality control comparison",
    "Lean production — kaizen, jidoka, 5S poster",
    "Supply chain — raw materials to consumer",
    "Break-even chart — labelled with TR, TC, BEP",
    "Break-even calculation card — fixed costs / contribution per unit",
    "Margin of safety on a break-even chart",
    "Cash-flow forecast template",
    "Profit and loss account template",
    "Balance sheet template — assets vs liabilities",
    "Sources of finance — short-term vs long-term comparison",
    "Gross profit margin / net profit margin formula card",
    "Return on capital employed (ROCE) card",
  ]);

  emitTitled(ctx, {
    subject: "Business",
    year_band: "GCSE",
    topic: "Strategy and external environment",
    year_group: "Year 11",
    description: "Strategy-tool diagram for GCSE Business.",
    style_notes: "Matrix or quadrant layout",
    tags: [...TAGS_B, "strategy"],
  }, [
    "SWOT analysis — four-quadrant template",
    "PESTLE analysis — six-segment poster",
    "Porter's Five Forces — diamond layout",
    "Maslow's hierarchy of needs — pyramid",
    "Herzberg's two-factor theory — hygiene vs motivators",
    "Taylor's scientific management card",
    "McGregor X vs Y theory comparison",
    "Organisational structure — tall vs flat",
    "Span of control diagram",
    "Centralised vs decentralised decision-making",
    "Communication flow — formal vs informal",
    "Recruitment process — six steps",
    "Job description vs person specification card",
    "Internal vs external recruitment comparison",
    "Globalisation — exports / imports diagram",
    "Multinational corporation map",
    "Ethics and CSR — triple bottom line (people / planet / profit)",
  ]);

  // ── Economics ───────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Economics",
    year_band: "GCSE",
    topic: "Demand and supply",
    year_group: "Year 10",
    description: "Demand / supply curve diagram for GCSE Economics.",
    style_notes: STYLE_GRAPH + ", price on y-axis, quantity on x-axis",
    tags: [...TAGS_E, "demand", "supply"],
  }, [
    "Demand curve — downward sloping",
    "Supply curve — upward sloping",
    "Market equilibrium — supply meets demand",
    "Shift in demand — outward (increase)",
    "Shift in demand — inward (decrease)",
    "Shift in supply — outward (increase)",
    "Shift in supply — inward (decrease)",
    "Excess demand (shortage) graph",
    "Excess supply (surplus) graph",
    "Substitute goods diagram",
    "Complementary goods diagram",
    "Inferior vs normal good demand response",
    "Price elasticity of demand grid — perfectly inelastic to perfectly elastic",
    "PED calculation card — % change in Qd / % change in P",
    "Income elasticity of demand grid",
    "Price elasticity of supply grid",
  ]);

  emitTitled(ctx, {
    subject: "Economics",
    year_band: "GCSE",
    topic: "Costs and revenue",
    year_group: "Year 10",
    description: "Cost-and-revenue curve diagram for GCSE Economics.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_E, "costs", "revenue"],
  }, [
    "Total cost (TC) curve",
    "Average cost (AC) curve — U-shape",
    "Marginal cost (MC) curve",
    "AC and MC on the same axes — MC cuts AC at minimum",
    "Total revenue (TR) curve — perfect competition (straight line)",
    "Total revenue (TR) curve — monopoly (curve)",
    "Profit maximisation point — MC = MR",
    "Economies of scale — falling AC card",
    "Diseconomies of scale — rising AC card",
    "Internal vs external economies of scale comparison",
  ]);

  emitTitled(ctx, {
    subject: "Economics",
    year_band: "GCSE",
    topic: "Macroeconomics",
    year_group: "Year 11",
    description: "Macroeconomic diagram for GCSE.",
    style_notes: STYLE_GRAPH,
    tags: [...TAGS_E, "macroeconomics"],
  }, [
    "Circular flow of income — two-sector simplified",
    "Circular flow of income — four-sector with leakages and injections",
    "Aggregate demand and aggregate supply diagram",
    "Government spending circular-flow injection",
    "Inflation — demand-pull diagram",
    "Inflation — cost-push diagram",
    "CPI vs RPI comparison card",
    "Unemployment types — frictional / structural / cyclical / seasonal",
    "Phillips curve — inflation vs unemployment",
    "Business cycle — boom / recession / slump / recovery",
    "Economic growth — GDP graph",
    "Balance of payments — current vs capital account",
    "Exchange rates — depreciation / appreciation impact card",
    "Monetary policy — interest rate transmission diagram",
    "Fiscal policy — multiplier effect chain",
    "Tax types — direct vs indirect, progressive / proportional / regressive",
    "Government spending pie chart",
    "Public goods vs private goods comparison",
    "Market failure — externalities diagram",
    "Negative externality — production / consumption examples",
    "Government intervention — subsidy / tax / regulation card",
  ]);
}
