/**
 * GCSE Combined Science — diagram catalogue (Year 10–11).
 *
 * Combined Science (Trilogy / Synergy / Gateway) shares ~75% of content
 * with the separate-science specs but trims a small subset of higher-tier
 * material. This module fills the *Combined-only* gaps where the
 * separate-science modules don't quite serve, without duplicating titles.
 *
 * Target: ~50 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const STYLE = "Clean line-art, label leaders to the right, exam-paper white background";
const TAGS = ["GCSE", "combined-science"];

export function build(ctx) {
  emitTitled(ctx, {
    subject: "Combined Science",
    year_band: "GCSE",
    topic: "Cross-paper essentials",
    year_group: "Year 11",
    description: "Combined Science exam-essential diagram — designed to be reusable across Bio / Chem / Physics papers.",
    style_notes: STYLE,
    tags: [...TAGS, "essentials"],
  }, [
    "Working scientifically — IV / DV / control variables card",
    "Working scientifically — accuracy / precision / repeatability / reproducibility",
    "Working scientifically — error sources card (random, systematic, zero)",
    "Drawing a graph — ten-step flowchart",
    "Drawing a line of best fit — Combined Science exam rules",
    "Naming a variable — quantitative vs categorical",
    "Drawing a results table — exam rules card",
    "Calculating mean from repeats card",
    "Identifying anomalous results card",
    "Risk assessment template — hazard / risk / control",
    "Required practical — Combined Science checklist (10 RPs Biology)",
    "Required practical — Combined Science checklist (10 RPs Chemistry)",
    "Required practical — Combined Science checklist (10 RPs Physics)",
    "Significant figures — rounding rule card",
    "Standard form — quick-conversion card",
    "Unit prefixes — pico / nano / micro / milli / kilo / mega / giga",
    "Maths-in-science — rearranging formulae card",
    "Maths-in-science — using the formula triangle (limits)",
    "Equation sheet quick-reference — Combined Science Physics",
    "Periodic table quick-reference — Combined Science",
    "Reactivity series quick-reference — Combined Science",
    "Cell-types comparison — eukaryotic vs prokaryotic cards (Combined)",
    "Specialised cell — gametes summary card",
    "Diffusion / osmosis / active transport summary card",
    "Required practical — Combined microscopy",
    "Required practical — Combined osmosis (potato)",
    "Required practical — Combined enzymes (amylase / starch / iodine)",
    "Required practical — Combined photosynthesis (light intensity)",
    "Required practical — Combined neutralisation temperature",
    "Required practical — Combined I-V characteristics",
    "Required practical — Combined density",
    "Required practical — Combined Hooke's law",
    "Required practical — Combined waves on string",
    "Photosynthesis equation card (Combined)",
    "Aerobic respiration equation card (Combined)",
    "Anaerobic respiration in muscles vs yeast (Combined)",
    "Heart cross-section — Combined-tier labelling",
    "Reflex arc — Combined tier",
    "Digestive system — Combined-tier label set",
    "Respiratory system — Combined-tier label set",
    "Atomic structure — Combined-tier label set",
    "Periodic table groups — Combined-tier label set",
    "Bonding triangle — ionic / covalent / metallic Combined card",
    "Energy stores wheel — Combined Physics",
    "Sankey diagram — Combined-tier example",
    "EM spectrum — Combined-tier strip with uses",
    "Half-life decay curve — Combined-tier example",
    "Forces and motion summary — Combined card",
    "Electrolysis summary — Combined-tier card",
    "Equilibrium summary — Combined-tier card (no Haber detail)",
    "Required practical — Combined chromatography",
  ]);
}
