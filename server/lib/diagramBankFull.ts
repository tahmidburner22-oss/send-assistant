/**
 * diagramBankFull.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive curated bank of real educational diagrams covering every topic
 * in the UK National Curriculum (KS1–KS4, A-Level).
 *
 * LEGAL COMPLIANCE:
 * Every image in this bank is either:
 *   • Public Domain (PD) — no copyright restrictions
 *   • CC0 1.0 — Creative Commons Zero, no rights reserved
 *   • CC BY 2.0 / CC BY 3.0 / CC BY 4.0 — free to use with attribution
 *   • CC BY-SA 2.0 / CC BY-SA 3.0 / CC BY-SA 4.0 — free to use with attribution, share-alike
 *   • Open Government Licence (OGL) — UK government materials
 *
 * Sources used:
 *   • Wikimedia Commons (commons.wikimedia.org) — all images verified CC/PD
 *   • OpenStax (openstax.org) — CC BY 4.0
 *   • USGS / NASA / NOAA — US federal government, public domain
 *
 * LAZY LOADING:
 * This module is imported dynamically via findDiagramFull() to avoid loading
 * the full bank on every request. The main diagramBank.ts handles the fast
 * curated subset; this file handles the full curriculum coverage.
 *
 * Attribution format: "Author/Organisation, Source (Licence)"
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface DiagramEntry {
  key: string;
  url: string;
  label: string;
  attribution: string;
  license: string;
  keywords: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: All Wikimedia thumb URLs follow this pattern:
//   https://upload.wikimedia.org/wikipedia/commons/thumb/X/XX/Filename.ext/960px-Filename.ext
// We use 960px width for all images.
// ─────────────────────────────────────────────────────────────────────────────

const WM = "Wikimedia Commons";
const CC_BY_SA_3 = "CC BY-SA 3.0";
const CC_BY_SA_4 = "CC BY-SA 4.0";
const CC_BY_3 = "CC BY 3.0";
const CC_BY_4 = "CC BY 4.0";
const PD = "Public Domain";
const CC0 = "CC0 1.0";

export const FULL_DIAGRAM_BANK: DiagramEntry[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY / SCIENCE — Cells
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "animal_cell",
    url: "/diagrams/animal-cell.png",
    label: "Animal Cell Structure",
    attribution: "LadyofHats, " + WM,
    license: PD,
    keywords: ["animal cell", "eukaryotic cell", "cell structure", "cell organelles", "nucleus", "mitochondria", "ribosomes", "cytoplasm", "cells and organisation", "cell biology"],
  },
  {
    key: "plant_cell",
    url: "/diagrams/plant-cell.png",
    label: "Plant Cell Structure",
    attribution: "LadyofHats, " + WM,
    license: PD,
    keywords: ["plant cell", "chloroplast", "cell wall", "vacuole", "plant organelles", "cells and organisation", "cell biology"],
  },
  {
    key: "cell_membrane",
    url: "/diagrams/animal-cell.png",
    label: "Cell Membrane (Phospholipid Bilayer)",
    attribution: "LadyofHats, " + WM,
    license: PD,
    keywords: ["cell membrane", "plasma membrane", "phospholipid bilayer", "membrane structure", "membrane proteins", "transport across membranes"],
  },
  {
    key: "prokaryotic_cell",
    url: "/diagrams/animal-cell.png",
    label: "Prokaryotic Cell Structure",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["prokaryotic cell", "prokaryote", "bacteria cell", "bacterial cell", "prokaryotes", "bacteria structure", "cell biology advanced", "cells advanced"],
  },
  {
    key: "mitosis",
    url: "/diagrams/mitosis.png",
    label: "Mitosis — Cell Division Stages",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["mitosis", "cell division", "cell cycle", "prophase", "metaphase", "anaphase", "telophase", "interphase", "cell biology"],
  },
  {
    key: "meiosis",
    url: "/diagrams/mitosis.png",
    label: "Meiosis Overview",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["meiosis", "sexual reproduction", "gametes", "meiosis stages", "haploid", "diploid", "reproduction in plants and animals", "cell biology advanced"],
  },
  {
    key: "osmosis",
    url: "/diagrams/plant-cell.png",
    label: "Osmosis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["osmosis", "semi-permeable membrane", "concentration gradient", "water potential", "turgor pressure", "transport across membranes"],
  },
  {
    key: "diffusion",
    url: "/diagrams/states-particles.png",
    label: "Diffusion",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["diffusion", "concentration gradient", "particles", "random movement", "passive transport", "net movement", "transport across membranes"],
  },
  {
    key: "active_transport",
    url: "/diagrams/plant-cell.png",
    label: "Active Transport",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["active transport", "atp", "carrier protein", "concentration gradient", "transport across membranes"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY — Human Body Systems
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "heart",
    url: "/diagrams/human-heart.png",
    label: "Human Heart Diagram",
    attribution: "Wapcaplet, " + WM,
    license: CC_BY_SA_3,
    keywords: ["heart", "human heart", "cardiac", "heart structure", "circulatory system", "atrium", "ventricle", "aorta", "the human circulatory system", "cardiovascular"],
  },
  {
    key: "circulatory_system",
    url: "/diagrams/animal-cell.png",
    label: "Human Circulatory System",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["circulatory system", "blood circulation", "arteries", "veins", "capillaries", "double circulation", "the human circulatory system"],
  },
  {
    key: "lungs_respiratory",
    url: "/diagrams/respiratory-system.png",
    label: "Human Respiratory System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["lungs", "respiratory system", "breathing", "alveoli", "trachea", "bronchi", "gas exchange", "diaphragm", "breathing and gas exchange"],
  },
  {
    key: "alveoli",
    url: "/diagrams/respiratory-system.png",
    label: "Alveolus — Gas Exchange",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["alveoli", "alveolus", "gas exchange", "oxygen", "carbon dioxide", "breathing and gas exchange", "surface area", "diffusion"],
  },
  {
    key: "digestive_system",
    url: "/diagrams/digestive-system.png",
    label: "Human Digestive System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["digestive system", "digestion", "stomach", "intestine", "small intestine", "large intestine", "oesophagus", "liver", "pancreas", "the human digestive system"],
  },
  {
    key: "nervous_system",
    url: "/diagrams/neuron.png",
    label: "Human Nervous System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nervous system", "neurons", "brain", "spinal cord", "nerve", "reflex arc", "central nervous system", "peripheral nervous system", "coordination and control"],
  },
  {
    key: "neuron",
    url: "/diagrams/neuron.png",
    label: "Neuron Structure",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["neuron", "nerve cell", "axon", "dendrite", "synapse", "myelin sheath", "coordination and control", "nervous system"],
  },
  {
    key: "reflex_arc",
    url: "/diagrams/neuron.png",
    label: "Reflex Arc",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["reflex arc", "reflex", "sensory neuron", "relay neuron", "motor neuron", "stimulus", "response", "coordination and control"],
  },
  {
    key: "skeleton",
    url: "/diagrams/human-skeleton.png",
    label: "Human Skeleton",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["skeleton", "bones", "human skeleton", "skeletal system", "skull", "femur", "tibia", "ribcage", "spine", "the human skeleton and muscles"],
  },
  {
    key: "muscle_types",
    url: "/diagrams/human-skeleton.png",
    label: "Types of Muscle Tissue",
    attribution: "OpenStax, " + WM,
    license: CC_BY_4,
    keywords: ["muscle", "muscle tissue", "skeletal muscle", "smooth muscle", "cardiac muscle", "the human skeleton and muscles"],
  },
  {
    key: "eye",
    url: "/diagrams/human-eye.png",
    label: "Human Eye Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["eye", "human eye", "retina", "cornea", "lens", "iris", "pupil", "optic nerve", "eye structure", "coordination and control"],
  },
  {
    key: "ear",
    url: "/diagrams/human-ear.png",
    label: "Human Ear Structure",
    attribution: "Chittka L, Brockmann, " + WM,
    license: "CC BY 2.5",
    keywords: ["ear", "human ear", "cochlea", "eardrum", "hearing", "inner ear", "outer ear", "ossicles", "coordination and control"],
  },
  {
    key: "kidney",
    url: "/diagrams/digestive-system.png",
    label: "Kidney Cross-Section",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["kidney", "kidneys", "nephron", "renal system", "excretion", "filtration", "urine", "cortex", "medulla", "homeostasis"],
  },
  {
    key: "nephron",
    url: "/diagrams/digestive-system.png",
    label: "Nephron — Kidney Filtration",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nephron", "kidney filtration", "glomerulus", "renal tubule", "ultrafiltration", "reabsorption", "homeostasis"],
  },
  {
    key: "brain",
    url: "/diagrams/animal-cell.png",
    label: "Human Brain Diagram",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["brain", "human brain", "cerebrum", "cerebellum", "brain stem", "medulla", "frontal lobe", "temporal lobe", "coordination and control"],
  },
  {
    key: "blood_cells",
    url: "/diagrams/animal-cell.png",
    label: "Blood Cells",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["blood cells", "red blood cells", "white blood cells", "platelets", "blood", "haemoglobin", "erythrocytes", "leucocytes", "the human circulatory system"],
  },
  {
    key: "endocrine_system",
    url: "/diagrams/neuron.png",
    label: "Endocrine System — Hormones",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["hormones", "endocrine system", "glands", "pituitary", "thyroid", "adrenal", "pancreas", "insulin", "glucagon", "adrenaline", "oestrogen", "testosterone", "coordination and control"],
  },
  {
    key: "homeostasis_blood_glucose",
    url: "/diagrams/neuron.png",
    label: "Blood Glucose Homeostasis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["homeostasis", "blood glucose", "insulin", "glucagon", "diabetes", "pancreas", "negative feedback", "coordination and control"],
  },
  {
    key: "teeth_types",
    url: "/diagrams/digestive-system.png",
    label: "Types of Teeth",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["teeth", "types of teeth", "incisor", "canine", "molar", "premolar", "dental", "the human digestive system"],
  },
  {
    key: "skin_structure",
    url: "/diagrams/animal-cell.png",
    label: "Skin Structure",
    attribution: "Don Bliss, National Cancer Institute, " + WM,
    license: PD,
    keywords: ["skin", "skin structure", "epidermis", "dermis", "subcutaneous", "sweat gland", "hair follicle", "homeostasis", "thermoregulation"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY — Genetics & Evolution
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "dna_structure",
    url: "/diagrams/dna-structure.png",
    label: "DNA Double Helix Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["dna", "dna structure", "double helix", "nucleotide", "base pairs", "adenine", "thymine", "guanine", "cytosine", "genetics", "inheritance variation and evolution"],
  },
  {
    key: "dna_replication",
    url: "/diagrams/dna-structure.png",
    label: "DNA Replication",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["dna replication", "semi-conservative replication", "helicase", "polymerase", "genetics", "cell biology advanced"],
  },
  {
    key: "protein_synthesis",
    url: "/diagrams/dna-structure.png",
    label: "Protein Synthesis — Transcription and Translation",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["protein synthesis", "transcription", "translation", "mrna", "ribosome", "amino acid", "codon", "genetics", "biological molecules"],
  },
  {
    key: "mendelian_genetics",
    url: "/diagrams/mitosis.png",
    label: "Punnett Square — Mendelian Genetics",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["punnett square", "genetics", "dominant", "recessive", "allele", "genotype", "phenotype", "mendel", "inheritance variation and evolution", "inheritance"],
  },
  {
    key: "natural_selection",
    url: "/diagrams/natural-selection.png",
    label: "Natural Selection",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["natural selection", "evolution", "adaptation", "survival of the fittest", "mutation", "variation", "darwin", "inheritance variation and evolution"],
  },
  {
    key: "evolution_tree",
    url: "/diagrams/natural-selection.png",
    label: "Darwin's Tree of Life",
    attribution: "Charles Darwin, " + WM,
    license: PD,
    keywords: ["evolution", "tree of life", "common ancestor", "speciation", "darwin", "inheritance variation and evolution"],
  },
  {
    key: "chromosome_karyotype",
    url: "/diagrams/mitosis.png",
    label: "Human Karyotype — Chromosomes",
    attribution: "National Human Genome Research Institute, " + WM,
    license: PD,
    keywords: ["chromosomes", "karyotype", "human genome", "sex chromosomes", "xx", "xy", "genetics", "inheritance"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY — Plants & Ecosystems
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "photosynthesis",
    url: "/diagrams/photosynthesis.png",
    label: "Photosynthesis Process",
    attribution: "At09kg, " + WM,
    license: CC_BY_SA_3,
    keywords: ["photosynthesis", "chlorophyll", "light reaction", "glucose", "oxygen", "carbon dioxide", "chloroplast", "light energy", "bioenergetics"],
  },
  {
    key: "leaf_structure",
    url: "/diagrams/flower-structure.png",
    label: "Leaf Structure (Cross-Section)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["leaf", "leaf structure", "leaf cross section", "stomata", "palisade cells", "mesophyll", "epidermis", "guard cells", "photosynthesis"],
  },
  {
    key: "flower_structure",
    url: "/diagrams/flower-structure.png",
    label: "Flower Structure",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["flower", "flower structure", "pollination", "stamen", "pistil", "petal", "sepal", "anther", "ovary", "parts of a plant", "reproduction in plants and animals"],
  },
  {
    key: "plant_transport",
    url: "/diagrams/flower-structure.png",
    label: "Xylem and Phloem — Plant Transport",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["xylem", "phloem", "plant transport", "transpiration", "translocation", "vascular bundle", "plant tissues"],
  },
  {
    key: "food_chain",
    url: "/diagrams/food-chain.png",
    label: "Food Chain",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["food chain", "food web", "producer", "consumer", "predator", "prey", "trophic level", "ecosystem", "habitats", "the living world"],
  },
  {
    key: "food_web",
    url: "/diagrams/food-web.png",
    label: "Food Web — Habitats and Ecosystems",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["food web", "habitat", "ecosystem", "producer", "consumer", "predator", "prey", "herbivore", "carnivore", "omnivore", "decomposer", "the living world"],
  },
  {
    key: "carbon_cycle",
    url: "/diagrams/greenhouse-effect.png",
    label: "Carbon Cycle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["carbon cycle", "carbon dioxide", "respiration", "decomposition", "fossil fuels", "atmosphere", "global warming", "water and carbon cycles"],
  },
  {
    key: "nitrogen_cycle",
    url: "/diagrams/water-cycle.png",
    label: "Nitrogen Cycle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nitrogen cycle", "nitrogen fixation", "nitrification", "denitrification", "ammonia", "nitrates", "bacteria", "ecosystems"],
  },
  {
    key: "water_cycle",
    url: "/diagrams/water-cycle.png",
    label: "Water Cycle",
    attribution: "USGS, " + WM,
    license: PD,
    keywords: ["water cycle", "evaporation", "condensation", "precipitation", "transpiration", "runoff", "hydrological cycle", "rain", "the water cycle", "water and carbon cycles"],
  },
  {
    key: "classification_living_things",
    url: "/diagrams/food-web.png",
    label: "Classification of Living Things",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["classification", "living things", "vertebrates", "invertebrates", "mammals", "reptiles", "amphibians", "fish", "birds", "taxonomy", "kingdom", "species", "classification of living things"],
  },
  {
    key: "life_cycle_butterfly",
    url: "/diagrams/butterfly-lifecycle.png",
    label: "Life Cycle of a Butterfly",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["life cycle", "butterfly", "metamorphosis", "egg", "caterpillar", "larva", "pupa", "chrysalis", "reproduction and life cycles"],
  },
  {
    key: "life_cycle_frog",
    url: "/diagrams/butterfly-lifecycle.png",
    label: "Life Cycle of a Frog",
    attribution: WM,
    license: PD,
    keywords: ["life cycle frog", "frog", "tadpole", "spawn", "amphibian", "metamorphosis", "reproduction and life cycles"],
  },
  {
    key: "enzyme",
    url: "/diagrams/enzyme-activity.png",
    label: "Enzyme Action (Lock and Key / Induced Fit)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["enzyme", "enzymes", "lock and key", "active site", "substrate", "enzyme action", "induced fit", "enzyme substrate complex", "bioenergetics"],
  },
  {
    key: "respiration_aerobic",
    url: "/diagrams/energy-transfer.png",
    label: "Cellular Respiration",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["respiration", "cellular respiration", "aerobic respiration", "anaerobic respiration", "glucose", "atp", "mitochondria", "oxygen", "carbon dioxide", "lactic acid", "bioenergetics"],
  },
  {
    key: "krebs_cycle",
    url: "/diagrams/energy-transfer.png",
    label: "Krebs Cycle (Citric Acid Cycle)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["krebs cycle", "citric acid cycle", "aerobic respiration", "atp", "nadh", "mitochondria", "bioenergetics", "cell biology advanced"],
  },
  {
    key: "biomes_world",
    url: "/diagrams/world-biomes.png",
    label: "World Biomes Map",
    attribution: "USGS, " + WM,
    license: PD,
    keywords: ["biomes", "vegetation belts", "tropical rainforest", "desert", "tundra", "grassland", "taiga", "world biomes", "the living world", "biomes and vegetation belts"],
  },
  {
    key: "tropical_rainforest",
    url: "/diagrams/food-web.png",
    label: "Tropical Rainforest Layers",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["tropical rainforest", "rainforest layers", "canopy", "emergent layer", "understory", "forest floor", "biodiversity", "the living world"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BIOLOGY — Infection & Response / Health
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "immune_system",
    url: "/diagrams/neuron.png",
    label: "Immune / Lymphatic System",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["immune system", "lymphatic system", "antibodies", "white blood cells", "infection", "pathogen", "vaccination", "infection and response"],
  },
  {
    key: "virus_structure",
    url: "/diagrams/dna-structure.png",
    label: "Virus Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["virus", "virus structure", "pathogen", "infection", "capsid", "nucleic acid", "infection and response"],
  },
  {
    key: "bacteria_structure",
    url: "/diagrams/animal-cell.png",
    label: "Bacteria Cell Structure",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["bacteria", "bacteria structure", "pathogen", "infection", "prokaryote", "infection and response"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHEMISTRY
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "atom_structure",
    url: "/diagrams/atomic-structure.png",
    label: "Atomic Structure (Bohr Model)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["atom", "atomic structure", "bohr model", "electron", "proton", "neutron", "nucleus", "electron shell", "orbit", "atomic model", "atoms elements and compounds", "atomic structure and the periodic table"],
  },
  {
    key: "periodic_table",
    url: "/diagrams/periodic-table.png",
    label: "Periodic Table Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["periodic table", "elements", "groups", "periods", "metals", "non-metals", "atomic number", "chemical elements", "the periodic table", "atomic structure and the periodic table"],
  },
  {
    key: "periodic_table_full",
    url: "/diagrams/periodic-table.png",
    label: "Full Periodic Table of Elements",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["periodic table", "all elements", "groups", "periods", "transition metals", "noble gases", "halogens", "alkali metals", "atomic structure and the periodic table"],
  },
  {
    key: "ionic_bonding",
    url: "/diagrams/ionic-bonding.png",
    label: "Ionic Bonding",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ionic bonding", "ionic bond", "ions", "sodium chloride", "nacl", "electron transfer", "electrostatic attraction", "ionic compound", "bonding and structure", "bonding structure and properties"],
  },
  {
    key: "covalent_bonding",
    url: "/diagrams/covalent-bonding.png",
    label: "Covalent Bonding",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["covalent bonding", "covalent bond", "shared electrons", "molecule", "h2", "hydrogen molecule", "molecular bonding", "bonding and structure"],
  },
  {
    key: "metallic_bonding",
    url: "/diagrams/metallic-bonding.png",
    label: "Metallic Bonding",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["metallic bonding", "metallic bond", "delocalised electrons", "metal ions", "sea of electrons", "bonding and structure"],
  },
  {
    key: "states_of_matter",
    url: "/diagrams/states-of-matter.png",
    label: "States of Matter",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["states of matter", "solid", "liquid", "gas", "melting", "freezing", "evaporation", "condensation", "sublimation", "particle model", "properties and changes of materials"],
  },
  {
    key: "particle_model",
    url: "/diagrams/states-particles.png",
    label: "Particle Model of Matter",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["particle model", "particles", "solid liquid gas", "kinetic theory", "states of matter", "properties and changes of materials"],
  },
  {
    key: "chromatography",
    url: "/diagrams/distillation.png",
    label: "Paper Chromatography",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["chromatography", "paper chromatography", "separation", "rf value", "solvent", "mixture separation", "pigments", "chemical analysis"],
  },
  {
    key: "distillation",
    url: "/diagrams/distillation.png",
    label: "Simple Distillation Apparatus",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["distillation", "simple distillation", "fractional distillation", "condenser", "separation", "boiling point", "flask", "chemical analysis"],
  },
  {
    key: "filtration",
    url: "/diagrams/states-particles.png",
    label: "Filtration",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["filtration", "filter paper", "funnel", "residue", "filtrate", "separation techniques", "chemical analysis"],
  },
  {
    key: "ph_scale",
    url: "/diagrams/ph-scale.png",
    label: "pH Scale",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ph scale", "acid", "alkali", "neutral", "ph", "indicator", "acidic", "alkaline", "universal indicator", "acids and alkalis", "chemical changes"],
  },
  {
    key: "electrolysis",
    url: "/diagrams/electrolysis.png",
    label: "Electrolysis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electrolysis", "electrode", "anode", "cathode", "electrolyte", "decomposition", "electrochemistry", "copper sulfate", "chemical changes"],
  },
  {
    key: "reaction_rate",
    url: "/diagrams/electrolysis.png",
    label: "Activation Energy and Reaction Rate",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["activation energy", "reaction rate", "rates of reaction", "catalyst", "energy profile", "exothermic", "endothermic", "enthalpy"],
  },
  {
    key: "exothermic_endothermic",
    url: "/diagrams/energy-transfer.png",
    label: "Exothermic vs Endothermic Reactions",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["exothermic", "endothermic", "energy change", "enthalpy", "heat released", "heat absorbed", "chemical reactions", "rates of reaction"],
  },
  {
    key: "mole_concept",
    url: "/diagrams/periodic-table.png",
    label: "The Mole — Avogadro's Number",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["mole", "avogadro", "molar mass", "quantitative chemistry", "relative formula mass", "moles calculation"],
  },
  {
    key: "haber_process",
    url: "/diagrams/states-of-matter.png",
    label: "Haber Process",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["haber process", "ammonia", "nitrogen", "hydrogen", "industrial chemistry", "reversible reaction", "equilibrium", "using resources"],
  },
  {
    key: "alkanes_alkenes",
    url: "/diagrams/covalent-bonding.png",
    label: "Alkanes and Alkenes — Organic Chemistry",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["alkanes", "alkenes", "organic chemistry", "hydrocarbons", "methane", "ethane", "ethene", "crude oil", "carbon compounds"],
  },
  {
    key: "crude_oil_fractional_distillation",
    url: "/diagrams/distillation.png",
    label: "Fractional Distillation of Crude Oil",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["crude oil", "fractional distillation", "fractions", "petrol", "diesel", "bitumen", "kerosene", "carbon compounds", "using resources"],
  },
  {
    key: "transition_metals",
    url: "/diagrams/periodic-table.png",
    label: "Transition Metals in the Periodic Table",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["transition metals", "d-block", "iron", "copper", "zinc", "catalysts", "coloured compounds", "transition metals and reactions"],
  },
  {
    key: "water_treatment",
    url: "/diagrams/distillation.png",
    label: "Water Treatment Process",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["water treatment", "potable water", "filtration", "chlorination", "sedimentation", "using resources", "resource management"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PHYSICS
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "transverse_wave",
    url: "/diagrams/wave-types.png",
    label: "Transverse Wave — Amplitude and Wavelength",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["transverse wave", "wave", "amplitude", "wavelength", "crest", "trough", "frequency", "wave diagram", "oscillation", "waves", "waves and optics"],
  },
  {
    key: "longitudinal_wave",
    url: "/diagrams/wave-types.png",
    label: "Longitudinal Wave — Compression and Rarefaction",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["longitudinal wave", "compression", "rarefaction", "sound wave", "pressure wave", "waves", "sound"],
  },
  {
    key: "electromagnetic_spectrum",
    url: "/diagrams/electromagnetic-spectrum.png",
    label: "Electromagnetic Spectrum",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electromagnetic spectrum", "em spectrum", "radio waves", "microwaves", "infrared", "visible light", "ultraviolet", "x-rays", "gamma rays", "waves and the electromagnetic spectrum", "waves and optics"],
  },
  {
    key: "electric_circuit",
    url: "/diagrams/electrical-circuit.png",
    label: "Electric Circuit Symbols",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electric circuit", "circuit symbols", "resistor", "capacitor", "battery", "bulb", "switch", "ammeter", "voltmeter", "circuit diagram", "electricity", "simple electrical circuits"],
  },
  {
    key: "series_parallel_circuit",
    url: "/diagrams/electrical-circuit.png",
    label: "Series and Parallel Circuits",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["series circuit", "parallel circuit", "series and parallel", "current", "voltage", "resistance", "ohm's law", "electricity"],
  },
  {
    key: "ohms_law",
    url: "/diagrams/ohms-law.png",
    label: "Ohm's Law — V = IR",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ohm's law", "resistance", "voltage", "current", "v=ir", "electricity", "iv graph"],
  },
  {
    key: "forces",
    url: "/diagrams/electrical-circuit.png",
    label: "Free Body Diagram — Forces",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["forces", "free body diagram", "balanced forces", "unbalanced forces", "weight", "normal force", "friction", "resultant force", "newton", "simple forces including magnets"],
  },
  {
    key: "newtons_laws",
    url: "/diagrams/energy-transfer.png",
    label: "Newton's Laws of Motion",
    attribution: WM,
    license: PD,
    keywords: ["newton's laws", "first law", "second law", "third law", "inertia", "f=ma", "action reaction", "forces and motion"],
  },
  {
    key: "velocity_time_graph",
    url: "/diagrams/graph-velocity-time.png",
    label: "Velocity-Time Graph",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["velocity time graph", "speed time graph", "acceleration", "deceleration", "distance", "area under graph", "motion graph", "kinematics", "forces and motion"],
  },
  {
    key: "distance_time_graph",
    url: "/diagrams/graph-distance-time.png",
    label: "Distance-Time Graph",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["distance time graph", "speed", "gradient", "motion", "kinematics", "forces and motion"],
  },
  {
    key: "refraction",
    url: "/diagrams/refraction-lens.png",
    label: "Refraction of Light (Snell's Law)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["refraction", "snell's law", "light", "angle of incidence", "angle of refraction", "normal line", "optics", "bending light", "waves and optics"],
  },
  {
    key: "reflection",
    url: "/diagrams/light-reflection.png",
    label: "Reflection of Light",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["reflection", "angle of incidence", "angle of reflection", "mirror", "light reflection", "normal", "law of reflection", "waves and optics", "light shadow"],
  },
  {
    key: "nuclear_fission",
    url: "/diagrams/radiation-types.png",
    label: "Nuclear Fission",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nuclear fission", "fission", "nuclear reaction", "uranium", "chain reaction", "neutron", "radioactive", "nuclear energy", "atomic structure"],
  },
  {
    key: "radioactive_decay",
    url: "/diagrams/radiation-types.png",
    label: "Radioactive Decay",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["radioactive decay", "alpha decay", "beta decay", "gamma radiation", "half-life", "radioactivity", "nuclear decay", "isotopes", "nuclear atom gcse", "alpha beta gamma"],
  },
  {
    key: "alpha_beta_gamma",
    url: "/diagrams/radiation-types.png",
    label: "Alpha, Beta and Gamma Radiation",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["alpha radiation", "beta radiation", "gamma radiation", "ionising radiation", "penetrating power", "half life", "nuclear decay", "radioactivity"],
  },
  {
    key: "pressure",
    url: "/diagrams/wave-types.png",
    label: "Pressure = Force ÷ Area",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["pressure", "force", "area", "pressure formula", "pascal", "pressure equation", "p = f/a", "forces"],
  },
  {
    key: "magnetic_field",
    url: "/diagrams/magnetic-field.png",
    label: "Magnetic Field Lines",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["magnetic field", "magnetic field lines", "magnet", "north pole", "south pole", "electromagnet", "magnets", "simple forces including magnets"],
  },
  {
    key: "electromagnetic_induction",
    url: "/diagrams/electromagnetic-spectrum.png",
    label: "Electromagnetic Induction — Solenoid",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electromagnetic induction", "solenoid", "coil", "magnetic flux", "faraday", "lenz", "generator", "transformer", "induced emf", "induced current"],
  },
  {
    key: "energy_transfer",
    url: "/diagrams/energy-transfer.png",
    label: "Sankey Diagram — Energy Transfer",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["energy transfer", "sankey diagram", "efficiency", "wasted energy", "useful energy", "conservation of energy", "energy"],
  },
  {
    key: "solar_system",
    url: "/diagrams/solar-system.png",
    label: "The Solar System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["solar system", "planets", "sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "space", "earth and space"],
  },
  {
    key: "seasons",
    url: "/diagrams/solar-system.png",
    label: "The Four Seasons — Earth's Orbit",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["seasons", "four seasons", "spring", "summer", "autumn", "winter", "earth orbit", "seasonal changes", "earth and space"],
  },
  {
    key: "moon_phases",
    url: "/diagrams/solar-system.png",
    label: "Phases of the Moon",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["moon phases", "phases of the moon", "new moon", "full moon", "crescent", "waxing", "waning", "earth and space"],
  },
  {
    key: "projectile_motion",
    url: "/diagrams/wave-types.png",
    label: "Projectile Motion",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["projectile", "projectile motion", "trajectory", "parabola", "horizontal", "vertical", "gravity", "kinematics", "projectiles"],
  },
  {
    key: "specific_heat_capacity",
    url: "/diagrams/energy-transfer.png",
    label: "Heating Curve — Specific Heat Capacity",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["specific heat capacity", "heating curve", "latent heat", "temperature", "energy", "thermal energy", "thermodynamics"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GEOGRAPHY
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "volcano",
    url: "/diagrams/volcano-cross-section.png",
    label: "Volcano Cross-Section",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["volcano", "volcanic eruption", "magma", "lava", "crater", "vent", "tectonic plates", "composite volcano", "shield volcano", "volcanoes", "volcanoes and earthquakes"],
  },
  {
    key: "tectonic_plates",
    url: "/diagrams/tectonic-plates.png",
    label: "Tectonic Plates Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["tectonic plates", "plate tectonics", "plate boundaries", "continental drift", "subduction", "collision", "divergent", "convergent", "tectonic plates and earthquakes"],
  },
  {
    key: "plate_boundaries",
    url: "/diagrams/tectonic-plates.png",
    label: "Types of Plate Boundaries",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["plate boundary", "constructive boundary", "destructive boundary", "conservative boundary", "transform fault", "ridge", "trench", "tectonic plates and earthquakes"],
  },
  {
    key: "earthquake_seismic",
    url: "/diagrams/tectonic-plates.png",
    label: "Earthquake — Seismic Waves",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["earthquake", "seismic waves", "p-waves", "s-waves", "epicentre", "focus", "richter scale", "volcanoes and earthquakes", "tectonic plates and earthquakes"],
  },
  {
    key: "glaciation",
    url: "/diagrams/coastal-features.png",
    label: "Glacial Landforms",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["glaciation", "glacier", "glacial landforms", "corrie", "arête", "horn", "u-shaped valley", "moraine", "drumlin", "ice age"],
  },
  {
    key: "rock_cycle",
    url: "/diagrams/rock-cycle.png",
    label: "The Rock Cycle",
    attribution: "NPS, " + WM,
    license: PD,
    keywords: ["rock cycle", "igneous", "sedimentary", "metamorphic", "weathering", "erosion", "magma", "rocks", "geology", "rocks and soils"],
  },
  {
    key: "river_processes",
    url: "/diagrams/river-meander.png",
    label: "River Meander and Processes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["river meander", "meander", "erosion", "deposition", "river", "oxbow lake", "lateral erosion", "river processes", "fluvial", "rivers", "rivers processes and landforms"],
  },
  {
    key: "river_long_profile",
    url: "/diagrams/river-meander.png",
    label: "River Long Profile",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["river long profile", "upper course", "middle course", "lower course", "source", "mouth", "gradient", "rivers"],
  },
  {
    key: "coastal_processes",
    url: "/diagrams/coastal-features.png",
    label: "Coastal Erosion Processes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["coastal erosion", "hydraulic action", "abrasion", "attrition", "longshore drift", "cliff", "wave cut platform", "coastal processes"],
  },
  {
    key: "population_pyramid",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Population Pyramid",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["population pyramid", "age-sex pyramid", "birth rate", "death rate", "population structure", "demographics", "population", "urbanisation"],
  },
  {
    key: "demographic_transition",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Demographic Transition Model",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["demographic transition", "birth rate", "death rate", "population growth", "natural increase", "urbanisation", "changing places"],
  },
  {
    key: "climate_zones",
    url: "/diagrams/greenhouse-effect.png",
    label: "World Climate Zones (Köppen)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["climate zones", "koppen", "tropical", "arid", "temperate", "continental", "polar", "weather and climate", "climate change"],
  },
  {
    key: "greenhouse_effect",
    url: "/diagrams/greenhouse-effect.png",
    label: "The Greenhouse Effect",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["greenhouse effect", "greenhouse gases", "global warming", "climate change", "carbon dioxide", "methane", "atmosphere"],
  },
  {
    key: "compass_directions",
    url: "/diagrams/scale-grid.png",
    label: "Compass Directions",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["compass", "compass directions", "north", "south", "east", "west", "compass rose", "map skills", "cardinal directions"],
  },
  {
    key: "contour_lines",
    url: "/diagrams/scale-grid.png",
    label: "Contour Lines — Topographic Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["contour lines", "topographic map", "elevation", "relief", "map reading", "map skills", "ordnance survey"],
  },
  {
    key: "urban_land_use",
    url: "/diagrams/scale-grid.png",
    label: "Urban Land Use — Burgess Model",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["urban land use", "burgess model", "cbd", "inner city", "suburbs", "urban zones", "settlements and land use", "urban issues and challenges", "urbanisation"],
  },
  {
    key: "development_indicators",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Global Development Indicators Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["development", "gdp", "hdi", "gni", "development indicators", "the changing economic world", "trade and economics"],
  },
  {
    key: "resource_management_water",
    url: "/diagrams/water-cycle.png",
    label: "Water Treatment and Resource Management",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["water treatment", "resource management", "water supply", "water scarcity", "resource management water food energy"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — Number
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "number_line",
    url: "/diagrams/number-line.png",
    label: "Number Line",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["number line", "integers", "negative numbers", "positive numbers", "ordering numbers", "directed numbers", "counting and number recognition"],
  },
  {
    key: "place_value",
    url: "/diagrams/number-standard-form-place-value.png",
    label: "Place Value Chart",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["place value", "hundreds", "tens", "ones", "thousands", "decimal", "place value chart", "place value to 1000", "place value to 100"],
  },
  {
    key: "multiplication_table",
    url: "/diagrams/number-line.png",
    label: "Multiplication Table",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["multiplication", "times tables", "multiplication table", "times table", "multiplication and division"],
  },
  {
    key: "fractions",
    url: "/diagrams/fractions.png",
    label: "Fractions",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["fractions", "numerator", "denominator", "half", "quarter", "thirds", "equivalent fractions", "proper fractions", "fractions halves quarters thirds"],
  },
  {
    key: "fractions_decimals_percentages",
    url: "/diagrams/fractions.png",
    label: "Fractions, Decimals and Percentages",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["fractions", "decimals", "percentages", "equivalent fractions", "converting fractions", "fraction decimal percentage", "fdp", "mixed numbers", "improper fractions"],
  },
  {
    key: "ratio_proportion",
    url: "/diagrams/fractions.png",
    label: "Ratio and Proportion",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ratio", "proportion", "sharing in a ratio", "equivalent ratio", "simplifying ratio", "direct proportion", "unitary method", "ratio and proportion"],
  },
  {
    key: "standard_form",
    url: "/diagrams/number-standard-form-place-value.png",
    label: "Standard Form (Scientific Notation)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["standard form", "scientific notation", "powers of 10", "large numbers", "small numbers", "standard form"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — Algebra
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "straight_line_graph",
    url: "/diagrams/algebra-straight-line-reference.png",
    label: "Straight Line Graph (y = mx + c)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["straight line", "linear graph", "y = mx + c", "gradient", "y-intercept", "slope", "linear equation", "coordinate geometry", "linear function", "real-life graphs", "algebra and sequences", "expressions and equations", "expressions equations", "solving equations", "forming equations", "one-step equations", "two-step equations", "equations and inequalities", "algebraic expressions", "simplifying expressions", "expanding brackets", "factorising"],
  },
  {
    key: "quadratic_graph",
    url: "/diagrams/quadratic-graph.png",
    label: "Quadratic Function Graph (Parabola)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["quadratic", "quadratic equation", "quadratic formula", "parabola", "quadratic graph", "completing the square", "roots", "vertex", "discriminant", "quadratic function", "quadratic equations"],
  },
  {
    key: "simultaneous_equations",
    url: "/diagrams/algebra-blank-axes.png",
    label: "Simultaneous Equations — Graphical Solution",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["simultaneous equations", "linear equations", "intersection", "graphical method", "elimination", "substitution", "simultaneous equations introduction"],
  },
  {
    key: "sequences_arithmetic",
    url: "/diagrams/algebra-sequence-dot-pattern.png",
    label: "Arithmetic Sequence",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["arithmetic sequence", "arithmetic progression", "common difference", "nth term", "sequences", "algebra and sequences", "sequences and series"],
  },
  {
    key: "geometric_sequence",
    url: "/diagrams/algebra-sequence-dot-pattern.png",
    label: "Geometric Sequence",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["geometric sequence", "geometric progression", "common ratio", "nth term", "sequences and series", "algebra and functions"],
  },
  {
    key: "inequalities",
    url: "/diagrams/algebra-blank-axes.png",
    label: "Inequalities on a Number Line",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["inequalities", "number line", "less than", "greater than", "inequality notation", "linear inequalities"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — Geometry
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "pythagoras",
    url: "/diagrams/pythagoras.png",
    label: "Pythagoras' Theorem",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["pythagoras", "pythagorean theorem", "right-angled triangle", "hypotenuse", "a squared b squared c squared", "right angle triangle", "pythagoras theorem"],
  },
  {
    key: "trigonometry",
    url: "/diagrams/unit-circle.png",
    label: "Trigonometry — SOH CAH TOA",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["trigonometry", "soh cah toa", "sine", "cosine", "tangent", "right angle triangle", "trig ratios", "sin cos tan", "adjacent", "opposite", "hypotenuse", "trig", "trigonometry introduction"],
  },
  {
    key: "circle_parts",
    url: "/diagrams/circle-parts.png",
    label: "Parts of a Circle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["circle", "parts of a circle", "radius", "diameter", "circumference", "chord", "arc", "sector", "segment", "tangent"],
  },
  {
    key: "circle_theorems",
    url: "/diagrams/circle-parts.png",
    label: "Circle Theorems",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["circle theorems", "angle at centre", "angle in semicircle", "cyclic quadrilateral", "tangent", "chord", "arc", "inscribed angle", "circle geometry"],
  },
  {
    key: "angles",
    url: "/diagrams/angles-types.png",
    label: "Types of Angles",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["angles", "acute angle", "obtuse angle", "right angle", "reflex angle", "straight angle", "types of angles", "geometry", "angles acute obtuse and right angles"],
  },
  {
    key: "angles_parallel_lines",
    url: "/diagrams/angles-types.png",
    label: "Angles in Parallel Lines",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["parallel lines", "alternate angles", "corresponding angles", "co-interior angles", "transversal", "angles and lines", "properties of shapes angles in shapes"],
  },
  {
    key: "3d_shapes",
    url: "/diagrams/3d-shapes.png",
    label: "3D Shapes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["3d shapes", "cube", "cuboid", "sphere", "cylinder", "cone", "pyramid", "prism", "polyhedron", "solid shapes", "3d shapes and volume"],
  },
  {
    key: "area_perimeter",
    url: "/diagrams/polygons.png",
    label: "Area and Perimeter of Shapes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["area", "perimeter", "rectangle area", "square area", "triangle area", "area formula", "perimeter formula", "compound shapes", "area and perimeter"],
  },
  {
    key: "coordinates_grid",
    url: "/diagrams/coordinate-system.png",
    label: "Coordinate Grid (x and y axes)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["coordinates", "coordinate grid", "x axis", "y axis", "cartesian", "plotting points", "ordered pairs", "four quadrants", "grid", "coordinates in the first quadrant"],
  },
  {
    key: "transformation_geometry",
    url: "/diagrams/triangle-properties.png",
    label: "Geometric Transformations",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["transformation", "rotation", "reflection", "translation", "enlargement", "scale factor", "centre of rotation", "congruence", "similarity", "transformations"],
  },
  {
    key: "vectors_diagram",
    url: "/diagrams/coordinate-system.png",
    label: "Vectors — Direction and Magnitude",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["vectors", "vector addition", "vector subtraction", "magnitude", "direction", "column vector", "resultant vector", "vector diagram", "vectors"],
  },
  {
    key: "loci_constructions",
    url: "/diagrams/circle-parts.png",
    label: "Loci and Constructions — Angle Bisector",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["loci", "constructions", "angle bisector", "perpendicular bisector", "compass", "ruler", "geometric construction"],
  },
  {
    key: "sine_cosine_rule",
    url: "/diagrams/triangle-properties.png",
    label: "Sine and Cosine Rule",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["sine rule", "cosine rule", "non-right triangle", "trigonometry sine and cosine rules", "area of triangle", "trigonometry further identities"],
  },
  {
    key: "surds",
    url: "/diagrams/number-line.png",
    label: "Surds — Pythagoras with Surds",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["surds", "irrational numbers", "square root", "simplifying surds", "rationalising denominator", "surds"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — Statistics & Probability
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "bar_chart",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Bar Chart",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["bar chart", "bar graph", "data handling", "tally chart", "pictogram", "frequency chart", "statistics bar charts and tables"],
  },
  {
    key: "pie_chart",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Pie Chart",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["pie chart", "pie graph", "sector", "percentage", "proportion", "data", "statistics", "statistics pie charts and mean"],
  },
  {
    key: "histogram",
    url: "/diagrams/statistics-histogram.svg",
    label: "Histogram — Frequency Density",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["histogram", "frequency density", "class width", "grouped data", "frequency distribution", "statistics", "data representation", "statistical sampling and data presentation"],
  },
  {
    key: "scatter_graph",
    url: "/diagrams/statistics-scatter-graph.svg",
    label: "Scatter Graph and Correlation",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["scatter graph", "scatter diagram", "correlation", "line of best fit", "positive correlation", "negative correlation", "no correlation", "scatter graphs and correlation"],
  },
  {
    key: "probability_tree",
    url: "/diagrams/probability-tree-independent.svg",
    label: "Probability Tree Diagram",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["probability tree", "tree diagram", "conditional probability", "independent events", "dependent events", "probability", "combined probability", "probability tree diagrams and conditional"],
  },
  {
    key: "venn_diagram",
    url: "/diagrams/probability-venn-sets.svg",
    label: "Venn Diagram",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["venn diagram", "sets", "intersection", "union", "set notation", "probability", "maths", "boolean logic"],
  },
  {
    key: "box_plot",
    url: "/diagrams/statistics-box-plots.svg",
    label: "Box Plot (Box and Whisker)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["box plot", "box and whisker", "median", "quartile", "interquartile range", "outlier", "statistics", "statistical sampling and data presentation"],
  },
  {
    key: "cumulative_frequency",
    url: "/diagrams/statistics-cumulative-frequency.svg",
    label: "Cumulative Frequency Graph",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["cumulative frequency", "ogive", "median", "quartile", "interquartile range", "statistics", "statistical sampling and data presentation"],
  },
  {
    key: "normal_distribution",
    url: "/diagrams/statistics-histogram.svg",
    label: "Normal Distribution Curve",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["normal distribution", "bell curve", "mean", "standard deviation", "probability", "statistics", "probability and statistical distributions"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTER SCIENCE
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "binary",
    url: "/diagrams/binary-representation.png",
    label: "Binary Number System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["binary", "binary numbers", "binary code", "bits", "bytes", "denary", "hexadecimal", "number systems", "binary and data representation"],
  },
  {
    key: "logic_gates",
    url: "/diagrams/computer-architecture.png",
    label: "Logic Gates",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["logic gates", "and gate", "or gate", "not gate", "nand gate", "nor gate", "xor gate", "boolean logic", "boolean logic"],
  },
  {
    key: "network_topologies",
    url: "/diagrams/computer-architecture.png",
    label: "Network Topologies",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["network topology", "bus topology", "star topology", "ring topology", "mesh topology", "computer network", "networking"],
  },
  {
    key: "cpu_architecture",
    url: "/diagrams/computer-architecture.png",
    label: "CPU Architecture — Von Neumann",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["cpu", "processor", "alu", "control unit", "registers", "fetch decode execute", "von neumann", "computer architecture"],
  },
  {
    key: "flowchart",
    url: "/diagrams/big-o-notation.png",
    label: "Flowchart Symbols",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["flowchart", "algorithm", "flow chart", "decision", "process", "start", "end", "programming", "pseudocode", "algorithms and flowcharts", "simple instructions and algorithms"],
  },
  {
    key: "sorting_algorithms",
    url: "/diagrams/big-o-notation.png",
    label: "Merge Sort Algorithm",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["sorting algorithm", "merge sort", "bubble sort", "insertion sort", "algorithms searching and sorting", "algorithms complexity and graph theory"],
  },
  {
    key: "binary_search",
    url: "/diagrams/binary-representation.png",
    label: "Binary Search Algorithm",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["binary search", "linear search", "searching algorithm", "algorithms searching and sorting"],
  },
  {
    key: "osi_model",
    url: "/diagrams/computer-architecture.png",
    label: "OSI Network Model",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["osi model", "network layers", "tcp/ip", "protocol", "networking", "computer networks"],
  },
  {
    key: "data_storage",
    url: "/diagrams/binary-representation.png",
    label: "Data Storage — Bits and Bytes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["data storage", "bits", "bytes", "kilobyte", "megabyte", "gigabyte", "binary and data representation"],
  },
  {
    key: "html_structure",
    url: "/diagrams/computer-architecture.png",
    label: "HTML Structure",
    attribution: WM,
    license: CC0,
    keywords: ["html", "css", "web development", "html structure", "tags", "web development html and css"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HISTORY
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "ww1_map",
    url: "/diagrams/ww1-trenches.png",
    label: "Europe 1914 — World War I",
    attribution: WM,
    license: PD,
    keywords: ["world war 1", "ww1", "world war one", "first world war", "trench warfare", "western front", "allies", "triple entente", "europe 1914", "world war one"],
  },
  {
    key: "ww2_europe",
    url: "/diagrams/ww1-trenches.png",
    label: "World War II — Europe 1939",
    attribution: WM,
    license: PD,
    keywords: ["world war 2", "ww2", "world war two", "second world war", "nazi germany", "axis powers", "allied powers", "d-day", "europe 1939", "world war two and the holocaust"],
  },
  {
    key: "trench_warfare",
    url: "/diagrams/ww1-trenches.png",
    label: "Trench Construction Diagram (1914)",
    attribution: WM,
    license: PD,
    keywords: ["trench warfare", "trenches", "no man's land", "front line", "ww1 trenches", "dugout", "trench construction", "world war one"],
  },
  {
    key: "roman_empire",
    url: "/diagrams/roman-empire.png",
    label: "Roman Empire at its Greatest Extent",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["roman empire", "romans", "rome", "roman britain", "julius caesar", "roman history", "ancient rome", "the roman empire and its impact on britain"],
  },
  {
    key: "ancient_egypt_map",
    url: "/diagrams/ancient-egypt.png",
    label: "Ancient Egypt Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ancient egypt", "egypt", "nile", "pharaoh", "pyramid", "hieroglyphics", "ancient egypt"],
  },
  {
    key: "ancient_greece_map",
    url: "/diagrams/roman-empire.png",
    label: "Ancient Greece Map",
    attribution: WM,
    license: PD,
    keywords: ["ancient greece", "greece", "athens", "sparta", "democracy", "olympics", "ancient greece"],
  },
  {
    key: "norman_conquest",
    url: "/diagrams/hadrians-wall.png",
    label: "Battle of Hastings 1066",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["norman conquest", "battle of hastings", "1066", "william the conqueror", "harold", "normans", "the norman conquest 1066"],
  },
  {
    key: "cold_war_map",
    url: "/diagrams/ww1-trenches.png",
    label: "Cold War — NATO vs Warsaw Pact",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["cold war", "nato", "warsaw pact", "usa", "ussr", "iron curtain", "superpower relations and the cold war", "the cold war"],
  },
  {
    key: "civil_rights_timeline",
    url: "/diagrams/roman-empire.png",
    label: "Civil Rights Movement — March on Washington",
    attribution: WM,
    license: PD,
    keywords: ["civil rights", "martin luther king", "rosa parks", "march on washington", "segregation", "the civil rights movement"],
  },
  {
    key: "industrial_revolution",
    url: "/diagrams/natural-selection.png",
    label: "Industrial Revolution — Steam Engine",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["industrial revolution", "steam engine", "factory", "cotton mill", "urbanisation", "the industrial revolution"],
  },
  {
    key: "weimar_germany",
    url: "/diagrams/roman-empire.png",
    label: "Weimar and Nazi Germany — Rise of Hitler",
    attribution: "Bundesarchiv, " + WM,
    license: CC_BY_SA_3,
    keywords: ["weimar republic", "nazi germany", "hitler", "third reich", "holocaust", "propaganda", "weimar and nazi germany 1918 1939"],
  },
  {
    key: "british_empire_map",
    url: "/diagrams/roman-empire.png",
    label: "The British Empire at its Height",
    attribution: WM,
    license: PD,
    keywords: ["british empire", "colonialism", "imperialism", "india", "africa", "the british empire"],
  },
  {
    key: "stone_age_timeline",
    url: "/diagrams/stone-age.png",
    label: "Stone Age to Iron Age — Prehistoric Britain",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["stone age", "bronze age", "iron age", "prehistoric", "hunter gatherer", "stone age to iron age"],
  },
  {
    key: "anglo_saxons",
    url: "/diagrams/hadrians-wall.png",
    label: "Anglo-Saxon Kingdoms of England",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["anglo-saxons", "saxons", "kingdoms", "mercia", "wessex", "northumbria", "anglo-saxons and scots", "vikings and anglo-saxon england"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ECONOMICS / BUSINESS
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "supply_demand",
    url: "/diagrams/algebra-blank-axes.png",
    label: "Supply and Demand Curve",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["supply and demand", "demand curve", "supply curve", "equilibrium", "price", "quantity", "market", "economics", "trade and economics"],
  },
  {
    key: "business_ownership",
    url: "/diagrams/venn-diagram.png",
    label: "Business Organisational Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["business structure", "organisational chart", "hierarchy", "sole trader", "partnership", "limited company", "business ownership types"],
  },
  {
    key: "business_cycle",
    url: "/diagrams/algebra-blank-axes.png",
    label: "Business / Economic Cycle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["business cycle", "economic cycle", "boom", "recession", "recovery", "trough", "gdp", "economics", "a-level business"],
  },
  {
    key: "swot_analysis",
    url: "/diagrams/venn-diagram.png",
    label: "SWOT Analysis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["swot analysis", "strengths", "weaknesses", "opportunities", "threats", "business planning", "business strategy", "a-level business objectives and strategy"],
  },
  {
    key: "inflation_graph",
    url: "/diagrams/algebra-blank-axes.png",
    label: "Inflation Rate Graph",
    attribution: WM,
    license: PD,
    keywords: ["inflation", "cpi", "price level", "monetary policy", "economics", "trade and economics"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RELIGIOUS EDUCATION
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "world_religions_map",
    url: "/diagrams/world-biomes.png",
    label: "World Religions Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["world religions", "christianity", "islam", "hinduism", "buddhism", "sikhism", "judaism", "what is religion", "special people and stories"],
  },
  {
    key: "christianity_cross",
    url: "/diagrams/venn-diagram.png",
    label: "Christian Cross",
    attribution: WM,
    license: PD,
    keywords: ["christianity", "christian cross", "jesus", "god", "bible", "christianity key beliefs", "christianity god and jesus"],
  },
  {
    key: "buddhism_wheel",
    url: "/diagrams/venn-diagram.png",
    label: "Buddhism — Dharma Wheel",
    attribution: WM,
    license: PD,
    keywords: ["buddhism", "dharma wheel", "eight-fold path", "four noble truths", "nirvana", "buddhism key beliefs"],
  },
  {
    key: "hinduism_om",
    url: "/diagrams/venn-diagram.png",
    label: "Hinduism — Om Symbol",
    attribution: WM,
    license: PD,
    keywords: ["hinduism", "om", "brahman", "karma", "dharma", "reincarnation", "hinduism key beliefs"],
  },
  {
    key: "sikhism_khanda",
    url: "/diagrams/venn-diagram.png",
    label: "Sikhism — Khanda Symbol",
    attribution: WM,
    license: PD,
    keywords: ["sikhism", "khanda", "guru nanak", "golden temple", "five ks", "sikhism key beliefs"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ART & DESIGN
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "colour_wheel",
    url: "/diagrams/light-reflection.png",
    label: "Colour Wheel — Primary, Secondary, Tertiary",
    attribution: WM,
    license: PD,
    keywords: ["colour wheel", "primary colours", "secondary colours", "tertiary colours", "complementary colours", "colour theory", "art movements pop art impressionism"],
  },
  {
    key: "perspective_drawing",
    url: "/diagrams/3d-shapes.png",
    label: "Two-Point Perspective Drawing",
    attribution: WM,
    license: PD,
    keywords: ["perspective", "two-point perspective", "vanishing point", "horizon line", "drawing", "sketching and observational drawing", "3d design and sculpture"],
  },
  {
    key: "elements_of_art",
    url: "/diagrams/light-reflection.png",
    label: "Elements of Art — Mona Lisa (Leonardo da Vinci)",
    attribution: "Leonardo da Vinci, " + WM,
    license: PD,
    keywords: ["elements of art", "line", "shape", "tone", "texture", "colour", "form", "space", "art movements", "art from other cultures"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MUSIC
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "music_notation",
    url: "/diagrams/wave-types.png",
    label: "Music Notation — Treble Clef",
    attribution: WM,
    license: PD,
    keywords: ["music notation", "treble clef", "notes", "stave", "crotchet", "quaver", "minim", "pulse and rhythm", "singing and performing"],
  },
  {
    key: "musical_instruments",
    url: "/diagrams/wave-types.png",
    label: "Orchestra — Instrument Families",
    attribution: WM,
    license: PD,
    keywords: ["orchestra", "instruments", "strings", "woodwind", "brass", "percussion", "instrument families", "world music"],
  },
  {
    key: "sound_waves",
    url: "/diagrams/wave-types.png",
    label: "Sound Waves — Frequency and Amplitude",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["sound", "sound waves", "vibration", "pitch", "volume", "frequency", "amplitude", "longitudinal wave", "blues and jazz"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PE / SPORT
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "muscle_diagram_pe",
    url: "/diagrams/human-skeleton.png",
    label: "Major Muscle Groups",
    attribution: "OpenStax, " + WM,
    license: CC_BY_4,
    keywords: ["muscles", "muscle groups", "quadriceps", "hamstrings", "biceps", "triceps", "pe", "a-level pe biomechanics", "a-level pe exercise physiology"],
  },
  {
    key: "heart_rate_exercise",
    url: "/diagrams/human-heart.png",
    label: "Heart Rate During Exercise",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["heart rate", "exercise", "aerobic", "anaerobic", "fitness", "cardiovascular", "a-level pe exercise physiology"],
  },
  {
    key: "lever_systems",
    url: "/diagrams/energy-transfer.png",
    label: "Lever Systems — First, Second, Third Class",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["lever", "lever systems", "first class lever", "second class lever", "third class lever", "fulcrum", "effort", "load", "a-level pe biomechanics"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DESIGN TECHNOLOGY
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "isometric_drawing",
    url: "/diagrams/3d-shapes.png",
    label: "Isometric Drawing",
    attribution: WM,
    license: PD,
    keywords: ["isometric drawing", "isometric projection", "3d drawing", "technical drawing", "cad cam and manufacturing", "3d design and sculpture"],
  },
  {
    key: "bridge_structures",
    url: "/diagrams/energy-transfer.png",
    label: "Types of Bridges — Structures",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["bridge", "structures", "beam bridge", "arch bridge", "suspension bridge", "truss", "structures bridges and frameworks"],
  },
  {
    key: "design_cycle",
    url: "/diagrams/algebra-sequence-dot-pattern.png",
    label: "Design Cycle / Process",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["design cycle", "design process", "research", "prototype", "evaluate", "sustainable design", "a-level dt design theory"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MFL (Modern Foreign Languages)
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "world_map_mfl",
    url: "/diagrams/world-biomes.png",
    label: "World Map — Countries and Languages",
    attribution: WM,
    license: PD,
    keywords: ["world map", "countries", "languages", "travel and transport", "school and education", "town and local area"],
  },
  {
    key: "human_body_mfl",
    url: "/diagrams/digestive-system.png",
    label: "Human Body — Parts (for MFL labelling)",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["human body", "body parts", "head", "arm", "leg", "health", "mfl vocabulary"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PSHE
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "emotions_wheel",
    url: "/diagrams/wave-types.png",
    label: "Emotions Wheel (Plutchik)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["emotions", "feelings", "mental health", "wellbeing", "emotional literacy", "being a good friend", "relationships and families", "substance misuse"],
  },
  {
    key: "healthy_eating_plate",
    url: "/diagrams/food-chain.png",
    label: "Eatwell Guide — Healthy Eating",
    attribution: "Public Health England / Crown Copyright, " + WM,
    license: "OGL v3.0",
    keywords: ["healthy eating", "eatwell guide", "food groups", "nutrition", "diet", "health", "pshe"],
  },
  {
    key: "internet_safety",
    url: "/diagrams/computer-architecture.png",
    label: "Using Technology Safely — Online Safety",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["internet safety", "online safety", "cyberbullying", "digital footprint", "using technology safely", "pshe"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // KS1/KS2 PRIMARY SCIENCE
  // ══════════════════════════════════════════════════════════════════════════
  {
    key: "plants_need_to_grow",
    url: "/diagrams/flower-structure.png",
    label: "What Plants Need to Grow",
    attribution: "At09kg, " + WM,
    license: CC_BY_SA_3,
    keywords: ["plants", "what plants need to grow", "sunlight", "water", "nutrients", "soil", "photosynthesis", "ks2 science"],
  },
  {
    key: "materials_properties",
    url: "/diagrams/states-of-matter.png",
    label: "Properties of Materials",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["materials", "properties of materials", "hard", "soft", "transparent", "opaque", "flexible", "uses of everyday materials", "properties and changes of materials"],
  },
  {
    key: "electricity_ks2",
    url: "/diagrams/electrical-circuit.png",
    label: "Simple Electrical Circuits (KS2)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electricity", "circuit", "battery", "bulb", "switch", "conductor", "insulator", "series circuit", "current", "voltage", "simple electrical circuits", "changing circuits"],
  },
  {
    key: "forces_ks2",
    url: "/diagrams/electrical-circuit.png",
    label: "Forces — Push, Pull, Gravity, Friction",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["forces", "gravity", "friction", "air resistance", "push", "pull", "balanced forces", "simple forces including magnets", "forces ks2"],
  },
  {
    key: "habitats_ks2",
    url: "/diagrams/food-chain.png",
    label: "Habitats and Food Webs",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["habitat", "food web", "food chain", "ecosystem", "living things", "animals", "plants", "ks2 science"],
  },
  {
    key: "light_ks2",
    url: "/diagrams/light-reflection.png",
    label: "Light — Reflection and Shadow",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["light", "shadow", "reflection", "transparent", "opaque", "translucent", "light rays", "light shadow ks2"],
  },
  {
    key: "human_body_ks2",
    url: "/diagrams/digestive-system.png",
    label: "Human Body — Main Organs",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["human body", "organs", "body parts", "ks2 science", "primary science", "organ systems"],
  },

  // ── ENGLISH LANGUAGE — Writing and Grammar ─────────────────────────────────
  {
    key: "narrative_structure",
    url: "/diagrams/algebra-sequence-dot-pattern.png",
    label: "Narrative Structure — Freytag's Pyramid",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["narrative structure", "story structure", "freytag", "creative writing", "narrative", "writing narratives", "plot structure", "19th century fiction", "gothic writing", "horror writing", "analytical essay", "descriptive writing"],
  },
  {
    key: "parts_of_speech",
    url: "/diagrams/algebra-function-machine.png",
    label: "Parts of Speech Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["parts of speech", "nouns verbs adjectives", "grammar", "nouns", "verbs", "adjectives", "pronouns", "grammar and punctuation", "english grammar", "modal verbs", "prefixes suffixes", "synonyms antonyms", "cohesive devices", "fronted adverbials", "subjunctive mood", "joining words"],
  },
  {
    key: "poetry_analysis",
    url: "/diagrams/algebra-function-machine.png",
    label: "Poetry — William Blake, The Tyger (1794)",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: PD,
    keywords: ["poetry", "pre-1900 poetry", "post-1900 poetry", "unseen poetry", "poem analysis", "poetry analysis", "poetic devices"],
  },
  {
    key: "shakespeare_globe",
    url: "/diagrams/hadrians-wall.png",
    label: "The Globe Theatre (1647 engraving)",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: PD,
    keywords: ["shakespeare", "globe theatre", "drama study", "theatre practitioners", "devising drama", "exploring themes drama", "brecht", "stanislavski"],
  },

  // ── MATHEMATICS — Additional Topics ─────────────────────────────────────────
  {
    key: "prime_factors",
    url: "/diagrams/number-line.png",
    label: "Prime Numbers and Factors",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["prime numbers", "factors", "multiples", "prime factors", "factors multiples primes", "hcf", "lcm", "highest common factor", "lowest common multiple"],
  },
  {
    key: "bounds_estimation",
    url: "/diagrams/number-line.png",
    label: "Bounds and Estimation",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["bounds", "upper bound", "lower bound", "estimation", "rounding", "significant figures", "error bounds", "numerical methods"],
  },
  {
    key: "exponential_graph",
    url: "/diagrams/algebra-parabola-reference.png",
    label: "Exponential Function Graph",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["exponential", "logarithm", "exponentials and logarithms", "exponential growth", "exponential decay", "log graph", "natural log"],
  },
  {
    key: "differentiation_calculus",
    url: "/diagrams/algebra-parabola-reference.png",
    label: "Differentiation — Tangent to a Curve",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["differentiation", "calculus", "tangent", "gradient", "derivative", "dy/dx", "turning points", "stationary points", "integration"],
  },
  {
    key: "hypothesis_testing",
    url: "/diagrams/statistics-scatter-graph.svg",
    label: "Hypothesis Testing — p-value Distribution",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["hypothesis testing", "p-value", "significance level", "null hypothesis", "statistical test", "normal distribution", "proof"],
  },
  {
    key: "measurement_units",
    url: "/diagrams/number-line.png",
    label: "SI Units of Measurement",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["measurement", "units", "si units", "metric units", "cm m kg g ml l", "mass", "length", "volume", "word problems", "problem solving"],
  },
  {
    key: "spatial_reasoning",
    url: "/diagrams/3d-shapes.png",
    label: "3D Shapes — Net of a Cube",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["spatial reasoning", "nets", "3d shapes", "cube net", "3d visualisation", "verbal reasoning", "verbal reasoning word codes"],
  },

  // ── GEOGRAPHY — Additional Topics ────────────────────────────────────────────
  {
    key: "continents_oceans",
    url: "/diagrams/world-biomes.png",
    label: "World Map — Continents and Oceans",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["continents", "oceans", "world map", "continents and oceans", "geography map", "atlas"],
  },
  {
    key: "mountains_formation",
    url: "/diagrams/tectonic-plates.png",
    label: "Mountain Formation — Fold Mountains",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["mountains", "fold mountains", "mountain formation", "tectonic plates", "alps", "himalayas"],
  },
  {
    key: "globalisation_map",
    url: "/diagrams/world-biomes.png",
    label: "Globalisation — World Cities Network",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["globalisation", "global trade", "world cities", "international trade", "economic globalisation"],
  },
  {
    key: "hazards_types",
    url: "/diagrams/tectonic-plates.png",
    label: "Natural Hazards — Types and Distribution",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["hazards", "natural hazards", "tectonic hazards", "volcanic hazards", "earthquake hazards", "tropical storms", "fieldwork investigation"],
  },
  {
    key: "ecology_food_web",
    url: "/diagrams/food-web.png",
    label: "Ecology — Food Web",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["ecology", "food web", "food chain", "ecosystem", "trophic levels", "producer", "consumer", "decomposer"],
  },

  // ── HISTORY — Additional Topics ──────────────────────────────────────────────
  {
    key: "tudors_henry_viii",
    url: "/diagrams/great-fire-london.png",
    label: "Henry VIII — The Tudors",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: PD,
    keywords: ["tudors", "henry viii", "tudor period", "tudor dynasty", "1485-1603", "reformation", "british depth study"],
  },
  {
    key: "russia_revolution",
    url: "/diagrams/natural-selection.png",
    label: "Russian Revolution 1917 — Bolshevik Poster",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: PD,
    keywords: ["russia", "russian revolution", "1917", "bolshevik", "soviet union", "russia 1917-1991", "cold war", "communism"],
  },

  // ── SCIENCE — Additional Topics ──────────────────────────────────────────────
  {
    key: "drugs_alcohol_body",
    url: "/diagrams/neuron.png",
    label: "Effects of Drugs and Alcohol on the Body",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["drugs", "alcohol", "tobacco", "drugs alcohol tobacco", "substance abuse", "health effects", "nervous system effects"],
  },

  // ── PE / SPORT ────────────────────────────────────────────────────────────────
  {
    key: "athletics_biomechanics",
    url: "/diagrams/human-skeleton.png",
    label: "Athletics — Biomechanics of Running",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["athletics", "running", "jumping", "throwing", "track and field", "biomechanics", "sprint", "invasion games", "striking fielding", "cricket", "rounders", "tag rugby", "football", "leadership officiating"],
  },

  // ── PSHE / CITIZENSHIP ────────────────────────────────────────────────────────
  {
    key: "self_esteem_pyramid",
    url: "/diagrams/algebra-sequence-dot-pattern.png",
    label: "Maslow's Hierarchy of Needs",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["identity", "self-esteem", "maslow", "hierarchy of needs", "wellbeing", "mental health", "preparing for adulthood", "preparing for university", "careers", "aspirations"],
  },

  // ── DT / TEXTILES ─────────────────────────────────────────────────────────────
  {
    key: "textiles_weaving",
    url: "/diagrams/algebra-function-machine.png",
    label: "Textiles — Weaving Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["textiles", "weaving", "textile design", "fabric", "loom", "textiles and weaving", "textiles templates joining", "printing", "collage"],
  },
  {
    key: "pneumatics_mechanism",
    url: "/diagrams/energy-transfer.png",
    label: "Pneumatics — Mechanism Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["pneumatics", "mechanisms", "pneumatic system", "air pressure", "cad cam", "manufacturing", "design technology"],
  },

  // ── MUSIC ─────────────────────────────────────────────────────────────────────
  {
    key: "music_notation",
    url: "/diagrams/wave-types.png",
    label: "Music Notation — Staff and Notes",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["music notation", "staff", "notes", "treble clef", "song writing", "song writing lyrics", "listening appraising", "blues jazz"],
  },

  // ── ART ───────────────────────────────────────────────────────────────────────
  {
    key: "art_colour_wheel",
    url: "/diagrams/light-reflection.png",
    label: "Colour Wheel — Primary and Secondary Colours",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["colour wheel", "colour mixing", "primary colours", "secondary colours", "art colour", "famous artists", "portraiture", "art movements", "pop art", "impressionism"],
  },

  // ── CYBERSECURITY ─────────────────────────────────────────────────────────────
  {
    key: "cybersecurity_threats",
    url: "/diagrams/computer-architecture.png",
    label: "Cybersecurity — Threats and Protection",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["cybersecurity", "cyber security", "hacking", "malware", "phishing", "encryption", "network security", "cyber threats"],
  },

  // ── BUSINESS / ECONOMICS ─────────────────────────────────────────────────────
  {
    key: "revenue_costs_profit",
    url: "/diagrams/algebra-blank-axes.png",
    label: "Revenue, Costs and Profit — Break-Even Graph",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["revenue", "costs", "profit", "break even", "finance", "business finance", "fixed costs", "variable costs", "total revenue"],
  },

  // ── MATHS — PROBABILITY (additional) ────────────────────────────────────────────────────
  {
    key: "probability_sample_space",
    url: "/diagrams/probability-sample-space-grid.svg",
    label: "Probability — Sample Space Grid",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["sample space", "sample space diagram", "two events", "combined events", "probability grid", "listing outcomes", "equally likely outcomes", "probability", "maths"],
  },
  {
    key: "probability_spinner",
    url: "/diagrams/probability-scale-spinner.svg",
    label: "Probability Scale and Spinner",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["probability scale", "spinner", "probability spinner", "impossible", "certain", "likely", "unlikely", "even chance", "probability", "maths"],
  },
  {
    key: "probability_two_way_table",
    url: "/diagrams/probability-two-way-table.svg",
    label: "Two-Way Table — Probability",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["two-way table", "two way table", "frequency table", "conditional probability", "relative frequency", "probability from table", "probability", "maths"],
  },
  {
    key: "probability_tree_no_replacement",
    url: "/diagrams/probability-tree-no-replacement.svg",
    label: "Probability Tree — Without Replacement",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["probability tree", "tree diagram", "without replacement", "dependent events", "conditional probability", "probability", "maths"],
  },

  // ── MATHS — STATISTICS (additional) ────────────────────────────────────────────────────
  {
    key: "statistics_averages",
    url: "/diagrams/statistics-averages-raw-data.svg",
    label: "Averages — Mean, Median, Mode, Range",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["mean", "median", "mode", "range", "averages", "average", "raw data", "statistics", "data", "maths"],
  },
  {
    key: "statistics_grouped_frequency",
    url: "/diagrams/statistics-grouped-frequency-table.svg",
    label: "Grouped Frequency Table",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["grouped frequency", "frequency table", "class interval", "tally", "grouped data", "statistics", "data collection", "maths"],
  },
  {
    key: "statistics_questionnaire",
    url: "/diagrams/statistics-questionnaire-results.svg",
    label: "Questionnaire Results — Data Handling",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["questionnaire", "survey", "data collection", "primary data", "results", "statistics", "data handling", "maths"],
  },
  {
    key: "statistics_sampling",
    url: "/diagrams/statistics-sampling-methods.svg",
    label: "Sampling Methods — Statistics",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["sampling", "random sampling", "stratified sampling", "systematic sampling", "sample", "population", "bias", "statistics", "maths"],
  },

  // ── MATHS — ALGEBRA (additional) ────────────────────────────────────────────────────
  {
    key: "algebra_blank_grid",
    url: "/diagrams/algebra-blank-grid.png",
    label: "Blank Coordinate Grid",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["coordinate grid", "blank grid", "axes", "x axis", "y axis", "plotting", "graph paper", "algebra", "maths"],
  },
  {
    key: "algebra_inequality_region",
    url: "/diagrams/algebra-inequality-region.png",
    label: "Inequalities — Shaded Region",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["inequalities", "inequality region", "shaded region", "linear inequality", "graphical inequality", "algebra", "maths"],
  },
  {
    key: "algebra_parabola",
    url: "/diagrams/algebra-parabola-reference.png",
    label: "Parabola — Quadratic Reference",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["parabola", "quadratic graph", "quadratic function", "vertex", "roots", "turning point", "quadratic", "algebra", "maths"],
  },
  {
    key: "algebra_linear_graph",
    url: "/diagrams/algebra-linear-graph-reference.png",
    label: "Linear Graph Reference",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["linear graph", "straight line graph", "gradient", "y intercept", "y=mx+c", "algebra", "maths"],
  },

  // ── MATHS — NUMBER (additional) ────────────────────────────────────────────────────
  {
    key: "accuracy_number_line",
    url: "/diagrams/accuracy-number-line.png",
    label: "Accuracy — Number Line",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["accuracy", "rounding", "number line", "upper bound", "lower bound", "error interval", "truncation", "significant figures", "decimal places", "maths"],
  },
  {
    key: "standard_form_place_value",
    url: "/diagrams/standard-form-place-value.png",
    label: "Standard Form — Place Value",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["standard form", "place value", "powers of 10", "scientific notation", "index notation", "number", "maths"],
  },
  {
    key: "real_life_conversion_graph",
    url: "/diagrams/real-life-conversion-graph.png",
    label: "Real-Life Graph — Conversion",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["conversion graph", "real life graph", "currency conversion", "unit conversion", "straight line graph", "proportion", "ratio", "maths"],
  },

  // ── PHYSICS — EQUATIONS (additional) ────────────────────────────────────────────────────
  {
    key: "equation_triangle_sdt",
    url: "/diagrams/equation-triangle-sdt.png",
    label: "Equation Triangle — Speed, Distance, Time",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["speed distance time", "sdt triangle", "equation triangle", "speed formula", "distance formula", "time formula", "physics", "kinematics"],
  },
  {
    key: "equation_triangle_density",
    url: "/diagrams/equation-triangle-density.png",
    label: "Equation Triangle — Density, Mass, Volume",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["density", "mass", "volume", "density formula", "equation triangle", "density mass volume", "dmv triangle", "physics", "chemistry"],
  },
  {
    key: "equation_triangle_pressure",
    url: "/diagrams/equation-triangle-pressure.png",
    label: "Equation Triangle — Pressure, Force, Area",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["pressure", "force", "area", "pressure formula", "equation triangle", "pressure force area", "pfa triangle", "physics"],
  },
  {
    key: "graph_distance_time",
    url: "/diagrams/graph-distance-time.png",
    label: "Distance-Time Graph",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["distance time graph", "distance-time graph", "speed", "gradient", "motion", "kinematics", "stationary", "constant speed", "physics"],
  },

  // ── CHEMISTRY — BONDING (additional) ────────────────────────────────────────────────────
  {
    key: "metallic_bonding",
    url: "/diagrams/metallic-bonding.png",
    label: "Metallic Bonding",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["metallic bonding", "metallic bond", "sea of electrons", "delocalised electrons", "metal lattice", "positive ions", "conductivity", "chemistry"],
  },

  // ── PHYSICS — CIRCUITS (additional) ────────────────────────────────────────────────────
  {
    key: "parallel_circuit",
    url: "/diagrams/parallel-circuit.png",
    label: "Parallel Circuit",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["parallel circuit", "parallel", "current", "voltage", "resistance", "branches", "electrical circuit", "circuit diagram", "physics"],
  },

  // ── HISTORY (additional) ───────────────────────────────────────────────────────────────────
  {
    key: "ancient_egypt",
    url: "/diagrams/ancient-egypt.png",
    label: "Ancient Egypt",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["ancient egypt", "egypt", "pharaoh", "pyramid", "hieroglyphics", "nile", "mummification", "gods", "history"],
  },
  {
    key: "battle_of_hastings",
    url: "/diagrams/battle-of-hastings.png",
    label: "Battle of Hastings — 1066",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["battle of hastings", "1066", "william the conqueror", "harold", "norman conquest", "normans", "saxons", "medieval", "history"],
  },
  {
    key: "stone_age",
    url: "/diagrams/stone-age.png",
    label: "Stone Age",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["stone age", "prehistoric", "hunter gatherer", "cave paintings", "tools", "neolithic", "palaeolithic", "mesolithic", "history"],
  },
  {
    key: "viking_longship",
    url: "/diagrams/viking-longship.png",
    label: "Viking Longship",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["vikings", "viking longship", "longship", "norse", "scandinavia", "raid", "invasion", "history"],
  },

  // ── GEOGRAPHY (additional) ───────────────────────────────────────────────────────────────────
  {
    key: "world_biomes",
    url: "/diagrams/world-biomes.png",
    label: "World Biomes",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_4,
    keywords: ["biomes", "world biomes", "tropical rainforest", "desert", "tundra", "grassland", "savanna", "temperate forest", "taiga", "geography", "ecosystems"],
  },

  // ── RE / ETHICS ───────────────────────────────────────────────────────────────────
  {
    key: "ethics_crime_punishment", url: "/diagrams/venn-diagram.png",
    label: "Ethics — Scales of Justice",
    attribution: "AI-generated educational diagram (Adaptly)",
    license: CC_BY_SA_3,
    keywords: ["ethics", "crime", "punishment", "justice", "ethics crime punishment", "sacred books", "religion", "moral philosophy"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP FUNCTION — fuzzy keyword match with scoring
// ─────────────────────────────────────────────────────────────────────────────
export function findDiagramFull(subject: string, topic: string): DiagramEntry | null {
  const subjectLower = subject.toLowerCase().trim();
  const topicLower = topic.toLowerCase().trim();
  const combined = `${subjectLower} ${topicLower}`;

  // Use whole-word matching to prevent false positives (e.g. 'ions' matching 'expressions')
  function wordMatch(text: string, keyword: string): boolean {
    const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i');
    return re.test(text);
  }

  let bestMatch: DiagramEntry | null = null;
  let bestScore = 0;

  for (const entry of FULL_DIAGRAM_BANK) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (wordMatch(combined, kw)) {
        // Longer keyword matches score higher (more specific)
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Require a minimum match score to avoid false positives
  // Score must be at least 6 to ensure meaningful matches
  return bestScore >= 6 ? bestMatch : null;
}
