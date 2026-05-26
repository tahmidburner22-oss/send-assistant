/**
 * GCSE Chemistry — diagram catalogue (Year 10–11).
 *
 * Anchored to AQA, Pearson Edexcel, OCR Gateway/21st-Century, WJEC and
 * Cambridge International GCSE Chemistry specifications. Heavy-priority
 * GCSE families flagged in the brief: atomic structure, periodic table
 * colour-coded by group, ionic / covalent bonding dot-and-cross,
 * electrolysis apparatus, Haber and contact processes, energy-profile
 * diagrams (exo / endo + activation energy), equilibria, fractional
 * distillation column, fuel cells.
 *
 * Target: ~150 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Chemistry", year_band: "GCSE" };
const STYLE_CHEM =
  "Clean line-art apparatus with glassware in pale grey, contents in colour, label leaders to the right";
const TAGS = ["GCSE", "chemistry"];

export function build(ctx) {
  // ── Atomic structure ────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Atomic structure",
    year_group: "Year 10",
    description: "Atomic-structure diagram for GCSE Chemistry.",
    style_notes: "Bohr-style atom, nucleus in red, electrons on shells, label leaders",
    tags: [...TAGS, "atomic-structure"],
  }, [
    "Atom — fully labelled (proton, neutron, electron, nucleus, shells)",
    "Sub-atomic particle table — relative mass and charge",
    "Electron configuration — first 20 elements (2,8,8,2 rule)",
    "Electron configuration — sodium (2,8,1)",
    "Electron configuration — chlorine (2,8,7)",
    "Electron configuration — calcium (2,8,8,2)",
    "Atomic number vs mass number — annotated card",
    "Isotopes — three isotopes of hydrogen (¹H, ²H, ³H)",
    "Isotopes — three isotopes of carbon (C-12, C-13, C-14)",
    "Relative atomic mass calculation — chlorine (35 and 37 weighted average)",
    "Development of the atom — Dalton → Thomson → Rutherford → Bohr → Chadwick timeline",
    "Plum-pudding model vs nuclear model card",
    "Rutherford's gold-foil experiment — apparatus and conclusions",
    "Ion — sodium loses one electron to become Na⁺",
    "Ion — chloride gains one electron to become Cl⁻",
    "Ion — magnesium loses two electrons to become Mg²⁺",
    "Ion — oxide gains two electrons to become O²⁻",
  ]);

  // ── Periodic table ──────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Periodic table",
    year_group: "Year 10",
    description: "Periodic-table reference diagram for GCSE.",
    style_notes: "Group colour-coding (alkali metals, halogens, noble gases), atomic number top-left",
    tags: [...TAGS, "periodic-table"],
  }, [
    "Periodic table — full GCSE reference, colour-coded by group",
    "Periodic table — metal vs non-metal divide highlighted",
    "Periodic table — transition metals block highlighted",
    "Group 1 alkali metals — reactivity trend with water",
    "Group 1 alkali metals — physical properties trend table",
    "Group 7 halogens — reactivity trend (decreasing down the group)",
    "Group 7 halogens — displacement reactions table",
    "Group 0 noble gases — physical properties trend",
    "Transition metals vs Group 1 — comparison table",
    "Mendeleev's periodic table — gaps and predictions",
    "Modern vs Mendeleev periodic table comparison",
    "Reactivity series — K Na Li Ca Mg Al (C) Zn Fe Sn Pb (H) Cu Ag Au",
    "Reactivity series — reactions with water and acid summary",
  ]);

  // ── Bonding ─────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Ionic bonding",
    year_group: "Year 10",
    description: "Ionic-bonding dot-and-cross diagram.",
    style_notes: "Dots for one element's electrons, crosses for the other, square brackets and charge above ions",
    tags: [...TAGS, "ionic-bonding", "dot-and-cross"],
  }, [
    "Ionic bond — sodium chloride (NaCl) dot-and-cross",
    "Ionic bond — magnesium oxide (MgO) dot-and-cross",
    "Ionic bond — calcium chloride (CaCl₂) dot-and-cross",
    "Ionic bond — potassium fluoride (KF) dot-and-cross",
    "Ionic bond — magnesium chloride (MgCl₂) dot-and-cross",
    "Ionic bond — aluminium oxide (Al₂O₃) dot-and-cross",
    "Ionic lattice — sodium chloride 3D structure",
    "Properties of ionic compounds — high MP, brittle, conduct when molten",
    "Ionic equation — neutralisation H⁺ + OH⁻ → H₂O",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Covalent bonding",
    year_group: "Year 10",
    description: "Covalent-bonding dot-and-cross / structure diagram.",
    style_notes: "Shared pair of electrons in overlap, dots and crosses to distinguish atoms",
    tags: [...TAGS, "covalent-bonding", "dot-and-cross"],
  }, [
    "Covalent bond — hydrogen (H₂) dot-and-cross",
    "Covalent bond — chlorine (Cl₂) dot-and-cross",
    "Covalent bond — oxygen (O₂) double-bond dot-and-cross",
    "Covalent bond — nitrogen (N₂) triple-bond dot-and-cross",
    "Covalent bond — water (H₂O) dot-and-cross",
    "Covalent bond — methane (CH₄) dot-and-cross",
    "Covalent bond — ammonia (NH₃) dot-and-cross",
    "Covalent bond — carbon dioxide (CO₂) dot-and-cross",
    "Covalent bond — hydrogen chloride (HCl) dot-and-cross",
    "Diamond — giant covalent structure",
    "Graphite — layered covalent structure",
    "Graphene — single layer of graphite",
    "Fullerenes — buckminsterfullerene C₆₀ structure",
    "Carbon nanotubes — rolled graphene",
    "Silicon dioxide — giant covalent structure",
    "Diamond vs graphite — properties comparison",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Metallic bonding and structures",
    year_group: "Year 10",
    description: "Metallic-bonding diagram for GCSE.",
    style_notes: "Lattice of positive ions in a sea of delocalised electrons",
    tags: [...TAGS, "metallic-bonding"],
  }, [
    "Metallic bonding — sea of delocalised electrons",
    "Properties of metals — explained by metallic structure",
    "Alloys — distorted lattice with different-sized atoms",
    "Pure metal vs alloy — slip-plane comparison",
    "States of matter and bonding — comparison table",
    "Polymer chain — long covalent backbone",
    "Polymers — addition vs condensation",
  ]);

  // ── Quantitative chemistry ──────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Quantitative chemistry",
    year_group: "Year 10",
    description: "Mole / yield / formula calculation card.",
    style_notes: "Equation centred, working steps highlighted",
    tags: [...TAGS, "quantitative", "moles"],
  }, [
    "Mass / Mr / moles triangle",
    "Conservation of mass — sealed flask card",
    "Why mass appears to change — open vs closed system",
    "Empirical formula — worked example (analysis to ratio)",
    "Molecular formula — from empirical and Mr",
    "Percentage yield formula card",
    "Atom economy formula card",
    "Mole calculation — moles of NaOH in 4 g",
    "Mole-mole stoichiometry — balanced equation card",
    "Mole-mass calculation — mass of product worked",
    "Concentration — g/dm³ vs mol/dm³",
    "Molar gas volume — 24 dm³ at rtp card",
    "Limiting reactant identification card",
    "Titration — burette / pipette / conical flask labelled",
    "Required practical — titration acid / alkali (procedure)",
    "Required practical — titration concordant results table",
  ]);

  // ── Reactions and energy ────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Chemical reactions",
    year_group: "Year 10",
    description: "Reaction-type diagram for GCSE.",
    style_notes: STYLE_CHEM,
    tags: [...TAGS, "reactions"],
  }, [
    "Acid + metal → salt + hydrogen — apparatus diagram",
    "Acid + metal carbonate → salt + water + CO₂ — apparatus",
    "Acid + metal oxide → salt + water — apparatus",
    "Neutralisation — H⁺ + OH⁻ → H₂O ionic equation card",
    "pH scale 0–14 with universal indicator colours",
    "Strong vs weak acid — particle diagram",
    "Concentrated vs dilute — particle diagram",
    "Required practical — making a soluble salt by reacting acid with insoluble base",
    "Solubility table — common salts",
    "Reactivity series — displacement reaction diagram (Fe in CuSO₄)",
    "Oxidation and reduction — OIL RIG mnemonic card",
    "Redox reaction — half-equations card",
    "Extraction of metals — by reactivity (electrolysis vs reduction with carbon)",
    "Blast furnace — iron extraction labelled",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Energy changes",
    year_group: "Year 10",
    description: "Energy-profile / calorimetry diagram for GCSE.",
    style_notes: "Energy y-axis, reaction progress x-axis, products higher or lower than reactants",
    tags: [...TAGS, "energy", "exo-endo"],
  }, [
    "Exothermic energy profile — products lower, ΔH negative",
    "Endothermic energy profile — products higher, ΔH positive",
    "Activation energy on an exothermic profile",
    "Activation energy on an endothermic profile",
    "Catalyst on an energy profile — lower Ea",
    "Bond energies — calculation worked example",
    "Calorimetry — combustion of a fuel apparatus",
    "Required practical — temperature change of neutralisation",
    "Required practical — temperature change with copper sulfate / zinc",
    "Hand warmer vs cold pack — exo vs endo card",
    "Cells and batteries — voltage vs reactivity diagram",
    "Hydrogen fuel cell — labelled (H₂ in, O₂ in, water out, electrolyte)",
    "Hydrogen fuel cell vs rechargeable battery — comparison",
  ]);

  // ── Rates and equilibria ────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Rates of reaction",
    year_group: "Year 11",
    description: "Rate-of-reaction diagram for GCSE.",
    style_notes: "Black axes with arrows, gas volume vs time curves",
    tags: [...TAGS, "rates"],
  }, [
    "Rate of reaction graph — typical curve flattening",
    "Rate of reaction graph — varying [acid] (three curves)",
    "Rate of reaction graph — varying temperature (three curves)",
    "Rate of reaction graph — surface area effect",
    "Rate of reaction graph — catalyst effect",
    "Mean rate calculation — gradient on a curve",
    "Tangent gradient method — rate at a point",
    "Collision theory — successful collision diagram",
    "Maxwell-Boltzmann distribution (informal at GCSE)",
    "Required practical — magnesium and HCl gas-collection",
    "Required practical — disappearing cross (sodium thiosulfate)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Equilibria",
    year_group: "Year 11",
    description: "Reversible-reaction / equilibria diagram for GCSE.",
    style_notes: "Double-arrow ⇌ in equation, particle diagram of dynamic equilibrium",
    tags: [...TAGS, "equilibria", "Le-Chatelier"],
  }, [
    "Reversible reaction — generic A + B ⇌ C + D card",
    "Dynamic equilibrium — particle diagram with both directions",
    "Closed-system requirement — sealed container",
    "Le Chatelier — temperature shift on exothermic forward",
    "Le Chatelier — pressure shift with fewer moles of gas",
    "Le Chatelier — concentration shift",
    "Haber process — N₂ + 3H₂ ⇌ 2NH₃ apparatus diagram",
    "Haber process — conditions chart (450 °C, 200 atm, iron catalyst)",
    "Haber process — yield vs temperature graph",
    "Haber process — yield vs pressure graph",
    "Contact process — making sulfuric acid stages",
    "Uses of ammonia — fertilisers (NPK)",
  ]);

  // ── Electrolysis ────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Electrolysis",
    year_group: "Year 11",
    description: "Electrolysis-apparatus diagram for GCSE.",
    style_notes: STYLE_CHEM + ", electrodes labelled +/−, ions migrating",
    tags: [...TAGS, "electrolysis"],
  }, [
    "Electrolysis of molten lead bromide — apparatus and products",
    "Electrolysis of molten sodium chloride — products at each electrode",
    "Electrolysis of brine (aqueous NaCl) — products and uses",
    "Electrolysis of copper sulfate (with copper electrodes) — purification",
    "Electrolysis of copper sulfate (with inert electrodes) — products",
    "Electrolysis of dilute sulfuric acid — products",
    "Aluminium extraction — electrolysis of molten Al₂O₃ in cryolite",
    "Half-equation card — at the cathode (reduction)",
    "Half-equation card — at the anode (oxidation)",
    "Electrolysis predictions — aqueous solutions rule card",
    "Required practical — electrolysis of aqueous solutions",
  ]);

  // ── Organic chemistry ───────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Organic chemistry",
    year_group: "Year 11",
    description: "Organic-chemistry diagram for GCSE.",
    style_notes: "Skeletal/structural formula in black, functional group highlighted",
    tags: [...TAGS, "organic", "hydrocarbons"],
  }, [
    "Alkanes — methane, ethane, propane, butane structures",
    "Alkanes — general formula CₙH₂ₙ₊₂ card",
    "Alkenes — ethene, propene, butene structures",
    "Alkenes — C=C double-bond bromine-water test",
    "Combustion — complete vs incomplete (CO and soot)",
    "Crude oil — fractional distillation column labelled",
    "Crude oil — uses of each fraction (gases, petrol, kerosene, diesel, fuel oil, bitumen)",
    "Cracking — long-chain to short-chain alkane and alkene",
    "Cracking apparatus — catalytic vs steam cracking",
    "Polymerisation — addition (ethene → polyethene)",
    "Polymerisation — condensation (diol + dicarboxylic acid → polyester + water)",
    "Alcohols — methanol, ethanol, propanol structures",
    "Alcohols — uses card",
    "Carboxylic acids — methanoic, ethanoic structures",
    "Esters — formation and naming card",
    "DNA / amino acids — naturally occurring polymers",
  ]);

  // ── Chemical analysis ───────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Chemical analysis",
    year_group: "Year 11",
    description: "Chemical-analysis / chromatography diagram for GCSE.",
    style_notes: STYLE_CHEM,
    tags: [...TAGS, "analysis", "chromatography"],
  }, [
    "Pure substance vs mixture card",
    "Boiling/melting point of a pure substance — sharp vs range",
    "Paper chromatography — labelled (baseline, solvent, spots)",
    "Paper chromatography — Rf calculation card",
    "Required practical — paper chromatography of inks",
    "Test for hydrogen — squeaky pop card",
    "Test for oxygen — glowing splint",
    "Test for carbon dioxide — limewater card",
    "Test for chlorine — damp blue litmus",
    "Test for water — anhydrous copper sulfate",
    "Test for water — purity by boiling/freezing point",
    "Flame test — colours of common metal cations",
    "Required practical — flame tests",
    "Sodium hydroxide test — metal cations precipitates",
    "Test for halide ions — silver nitrate colours",
    "Test for sulfate ions — barium chloride white precipitate",
    "Test for carbonate ions — acid + limewater",
    "Instrumental analysis — flame emission spectroscopy card",
  ]);

  // ── Atmosphere and Earth ────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Atmosphere and Earth",
    year_group: "Year 11",
    description: "Atmosphere / pollution diagram for GCSE.",
    style_notes: STYLE_CHEM,
    tags: [...TAGS, "atmosphere", "earth"],
  }, [
    "Composition of the modern atmosphere — pie chart (N₂, O₂, Ar, CO₂)",
    "Evolution of the atmosphere — four stages timeline",
    "Greenhouse effect — sunlight in / IR trapped",
    "Greenhouse gases — CO₂ and CH₄ comparison",
    "Climate change — global temperature anomaly graph",
    "Carbon footprint card — reducing it",
    "Combustion of fuels — products and pollutants",
    "Acid rain formation — SO₂ and NOₓ to H₂SO₄ and HNO₃",
    "Catalytic converter — schematic",
    "Particulate matter — health impact card",
    "Potable water — treatment process diagram",
    "Required practical — analysis and purification of water",
    "Sea-water desalination — distillation diagram",
  ]);

  // ── Using resources ─────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Using resources",
    year_group: "Year 11",
    description: "Resources / sustainability diagram for GCSE.",
    style_notes: STYLE_CHEM,
    tags: [...TAGS, "resources", "sustainability"],
  }, [
    "Finite vs renewable resources card",
    "Life-cycle assessment — four stages diagram",
    "Recycling — metals vs plastics comparison",
    "Phytomining and bioleaching — diagrams",
    "Haber process for fertilisers — link card",
    "NPK fertilisers — production diagram",
    "Glass production — soda-lime vs borosilicate",
    "Ceramics, composites, polymers — properties chart",
    "Corrosion — rust formation and prevention",
    "Galvanising — sacrificial protection diagram",
  ]);
}
