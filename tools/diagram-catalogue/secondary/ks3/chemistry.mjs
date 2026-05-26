/**
 * KS3 Chemistry — diagram catalogue (Year 7–9).
 *
 * Anchored to the DfE KS3 Science Programme of Study. Diagrams introduce
 * the particle model, atomic structure, the periodic table and reaction
 * types that pupils will deepen at GCSE.
 *
 * Target: ~70 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Chemistry", year_band: "KS3" };
const STYLE_CHEM =
  "Clean line-art apparatus with glassware in pale grey, contents in colour, label leaders to the right";
const TAGS_KS3 = ["KS3", "chemistry", "national-curriculum"];

export function build(ctx) {
  // ── Particle model and states of matter ──────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Particle model",
    year_group: "Year 7",
    description: "Particle-arrangement diagram for KS3.",
    style_notes: "Coloured circular particles, container outline, motion arrows",
    tags: [...TAGS_KS3, "particle-model", "states"],
  }, [
    "Particle arrangement — solid (regular, tightly packed)",
    "Particle arrangement — liquid (close, irregular)",
    "Particle arrangement — gas (far apart, fast moving)",
    "Particle arrangement — three states side by side",
    "Changes of state — melting / freezing / evaporating / condensing arrows",
    "Heating curve — temperature vs time with plateau at MP and BP",
    "Cooling curve — temperature vs time",
    "Diffusion — bromine gas spreading in a tube",
    "Diffusion — potassium permanganate in water",
    "Brownian motion — pollen grains random walk",
    "Gas pressure — particles colliding with container walls",
    "Compressing a gas — piston diagram with particle view",
  ]);

  // ── Atomic structure and the periodic table (KS3 level) ──────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Atomic structure",
    year_group: "Year 8",
    description: "KS3 atom-structure diagram with sub-atomic particles labelled.",
    style_notes: "Bohr-style atom, nucleus in red, orbiting electrons on rings",
    tags: [...TAGS_KS3, "atomic-structure", "atoms"],
  }, [
    "Atom diagram — hydrogen (1 proton, 0 neutrons, 1 electron)",
    "Atom diagram — helium (2,2,2)",
    "Atom diagram — lithium (3,4,3)",
    "Atom diagram — carbon (6,6,6)",
    "Atom diagram — oxygen (8,8,8)",
    "Atom diagram — sodium (11,12,11)",
    "Sub-atomic particles table — relative mass and charge",
    "Element / compound / mixture — particle representations side by side",
    "Pure substance vs mixture — particle diagram",
    "Atomic number vs mass number labelled card",
    "Isotopes — three isotopes of carbon (C-12, C-13, C-14)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Periodic table",
    year_group: "Year 8",
    description: "KS3 periodic-table introduction diagram.",
    style_notes: "Colour-coded groups, atomic number top-left, element symbol large",
    tags: [...TAGS_KS3, "periodic-table"],
  }, [
    "Periodic table KS3 — colour-coded by metal / non-metal / metalloid",
    "Group 1 alkali metals — Li, Na, K reactivity trend",
    "Group 7 halogens — F, Cl, Br, I reactivity trend",
    "Group 0 noble gases — He, Ne, Ar appearance",
    "Reading the periodic table — atomic number vs mass number",
    "First 20 elements — symbols flashcards",
    "Mendeleev's first periodic table sketch",
  ]);

  // ── Reactions and chemistry skills ───────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Chemical reactions",
    year_group: "Year 8",
    description: "Reaction-type diagram for KS3.",
    style_notes: STYLE_CHEM,
    tags: [...TAGS_KS3, "reactions", "chemistry"],
  }, [
    "Word equation card — magnesium + oxygen → magnesium oxide",
    "Word equation card — copper carbonate → copper oxide + carbon dioxide",
    "Conservation of mass — sealed flask before/after reaction",
    "Combustion of methane — labelled flame test",
    "Burning a candle — wax / wick / flame regions",
    "Acid + metal → salt + hydrogen — apparatus diagram",
    "Acid + carbonate → salt + water + carbon dioxide — apparatus diagram",
    "Acid + alkali → salt + water — neutralisation diagram",
    "pH scale 0–14 — universal indicator colours",
    "Reactivity series ladder — K Na Ca Mg Al Zn Fe Cu Ag Au",
    "Displacement reaction — iron in copper sulfate solution colour change",
    "Endothermic vs exothermic — temperature change cards",
  ]);

  // ── Mixtures and separation techniques ───────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Separating mixtures",
    year_group: "Year 7",
    description: "Separation-technique apparatus diagram for KS3.",
    style_notes: STYLE_CHEM,
    tags: [...TAGS_KS3, "separation-techniques", "practical"],
  }, [
    "Filtration apparatus — funnel, filter paper, beaker",
    "Evaporation — basin on tripod with Bunsen",
    "Crystallisation — evaporating dish over water bath",
    "Simple distillation — round-bottom flask, condenser, conical flask",
    "Fractional distillation — KS3 column with thermometer",
    "Chromatography — paper, baseline, solvent, spots",
    "Decanting — pouring liquid off sediment",
    "Magnetic separation — iron filings from sand",
    "Chromatography — pencil baseline with three colour spots",
    "Solvent / solute / solution / saturated card",
  ]);

  // ── Earth and atmosphere ─────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Earth and atmosphere",
    year_group: "Year 9",
    description: "Earth-science diagram for KS3.",
    style_notes: STYLE_CHEM,
    tags: [...TAGS_KS3, "earth-science", "atmosphere"],
  }, [
    "Earth's structure — crust, mantle, outer core, inner core (labelled with state)",
    "Rock cycle — sedimentary / metamorphic / igneous arrows",
    "Sedimentary rock formation — layers and compaction",
    "Igneous rock — intrusive vs extrusive cooling",
    "Metamorphic rock — heat and pressure formation",
    "Composition of the atmosphere — pie chart (N₂ 78%, O₂ 21%, others)",
    "Greenhouse effect — sunlight in / IR trapped diagram",
    "Carbon cycle — KS3 simplified",
    "Water cycle — labelled processes",
    "Combustion of fuels — products labelled",
    "Acid rain — formation and effects diagram",
  ]);
}
