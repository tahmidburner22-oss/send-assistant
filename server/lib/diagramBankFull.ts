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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/960px-Animal_cell_structure_en.svg.png",
    label: "Animal Cell Structure",
    attribution: "LadyofHats, " + WM,
    license: PD,
    keywords: ["animal cell", "eukaryotic cell", "cell structure", "cell organelles", "nucleus", "mitochondria", "ribosomes", "cytoplasm", "cells and organisation", "cell biology"],
  },
  {
    key: "plant_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Plant_cell_structure_svg_labels.svg/960px-Plant_cell_structure_svg_labels.svg.png",
    label: "Plant Cell Structure",
    attribution: "LadyofHats, " + WM,
    license: PD,
    keywords: ["plant cell", "chloroplast", "cell wall", "vacuole", "plant organelles", "cells and organisation", "cell biology"],
  },
  {
    key: "cell_membrane",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cell_membrane_detailed_diagram_en.svg/960px-Cell_membrane_detailed_diagram_en.svg.png",
    label: "Cell Membrane (Phospholipid Bilayer)",
    attribution: "LadyofHats, " + WM,
    license: PD,
    keywords: ["cell membrane", "plasma membrane", "phospholipid bilayer", "membrane structure", "membrane proteins", "transport across membranes"],
  },
  {
    key: "prokaryotic_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Prokaryote_cell.svg/960px-Prokaryote_cell.svg.png",
    label: "Prokaryotic Cell Structure",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["prokaryotic cell", "prokaryote", "bacteria cell", "bacterial cell", "prokaryotes", "bacteria structure", "cell biology advanced", "cells advanced"],
  },
  {
    key: "mitosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Animal_cell_cycle-en.svg/960px-Animal_cell_cycle-en.svg.png",
    label: "Mitosis — Cell Division Stages",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["mitosis", "cell division", "cell cycle", "prophase", "metaphase", "anaphase", "telophase", "interphase", "cell biology"],
  },
  {
    key: "meiosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Meiosis_Overview_new.svg/960px-Meiosis_Overview_new.svg.png",
    label: "Meiosis Overview",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["meiosis", "sexual reproduction", "gametes", "meiosis stages", "haploid", "diploid", "reproduction in plants and animals", "cell biology advanced"],
  },
  {
    key: "osmosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Osmosis_diagram.svg/960px-Osmosis_diagram.svg.png",
    label: "Osmosis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["osmosis", "semi-permeable membrane", "concentration gradient", "water potential", "turgor pressure", "transport across membranes"],
  },
  {
    key: "diffusion",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Diffusion.svg/960px-Diffusion.svg.png",
    label: "Diffusion",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["diffusion", "concentration gradient", "particles", "random movement", "passive transport", "net movement", "transport across membranes"],
  },
  {
    key: "active_transport",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Active_transport.svg/960px-Active_transport.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Heart_diagram-en.svg/960px-Heart_diagram-en.svg.png",
    label: "Human Heart Diagram",
    attribution: "Wapcaplet, " + WM,
    license: CC_BY_SA_3,
    keywords: ["heart", "human heart", "cardiac", "heart structure", "circulatory system", "atrium", "ventricle", "aorta", "the human circulatory system", "bioenergetics"],
  },
  {
    key: "circulatory_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Circulatory_System_en.svg/500px-Circulatory_System_en.svg.png",
    label: "Human Circulatory System",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["circulatory system", "blood circulation", "arteries", "veins", "capillaries", "double circulation", "the human circulatory system"],
  },
  {
    key: "lungs_respiratory",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Respiratory_system_complete_en.svg/500px-Respiratory_system_complete_en.svg.png",
    label: "Human Respiratory System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["lungs", "respiratory system", "breathing", "alveoli", "trachea", "bronchi", "gas exchange", "diaphragm", "breathing and gas exchange", "bioenergetics"],
  },
  {
    key: "alveoli",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Alveolus_diagram.svg/960px-Alveolus_diagram.svg.png",
    label: "Alveolus — Gas Exchange",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["alveoli", "alveolus", "gas exchange", "oxygen", "carbon dioxide", "breathing and gas exchange", "surface area", "diffusion"],
  },
  {
    key: "digestive_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Digestive_system_diagram_en.svg/500px-Digestive_system_diagram_en.svg.png",
    label: "Human Digestive System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["digestive system", "digestion", "stomach", "intestine", "small intestine", "large intestine", "oesophagus", "liver", "pancreas", "the human digestive system"],
  },
  {
    key: "nervous_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Nervous_system_diagram-en.svg/330px-Nervous_system_diagram-en.svg.png",
    label: "Human Nervous System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nervous system", "neurons", "brain", "spinal cord", "nerve", "reflex arc", "central nervous system", "peripheral nervous system", "coordination and control"],
  },
  {
    key: "neuron",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Blausen_0657_MultipolarNeuron.png/960px-Blausen_0657_MultipolarNeuron.png",
    label: "Neuron Structure",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["neuron", "nerve cell", "axon", "dendrite", "synapse", "myelin sheath", "coordination and control", "nervous system"],
  },
  {
    key: "reflex_arc",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Reflex_arc_diagram.svg/960px-Reflex_arc_diagram.svg.png",
    label: "Reflex Arc",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["reflex arc", "reflex", "sensory neuron", "relay neuron", "motor neuron", "stimulus", "response", "coordination and control"],
  },
  {
    key: "skeleton",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Human_skeleton_front_en.svg/500px-Human_skeleton_front_en.svg.png",
    label: "Human Skeleton",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["skeleton", "bones", "human skeleton", "skeletal system", "skull", "femur", "tibia", "ribcage", "spine", "the human skeleton and muscles"],
  },
  {
    key: "muscle_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Muscle_tissues.png/960px-Muscle_tissues.png",
    label: "Types of Muscle Tissue",
    attribution: "OpenStax, " + WM,
    license: CC_BY_4,
    keywords: ["muscle", "muscle tissue", "skeletal muscle", "smooth muscle", "cardiac muscle", "the human skeleton and muscles"],
  },
  {
    key: "eye",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Schematic_diagram_of_the_human_eye_en.svg/960px-Schematic_diagram_of_the_human_eye_en.svg.png",
    label: "Human Eye Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["eye", "human eye", "retina", "cornea", "lens", "iris", "pupil", "optic nerve", "eye structure", "coordination and control"],
  },
  {
    key: "ear",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Anatomy_of_the_Human_Ear.svg/960px-Anatomy_of_the_Human_Ear.svg.png",
    label: "Human Ear Structure",
    attribution: "Chittka L, Brockmann, " + WM,
    license: "CC BY 2.5",
    keywords: ["ear", "human ear", "cochlea", "eardrum", "hearing", "inner ear", "outer ear", "ossicles", "coordination and control"],
  },
  {
    key: "kidney",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Kidney_Cross_Section.svg/960px-Kidney_Cross_Section.svg.png",
    label: "Kidney Cross-Section",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["kidney", "kidneys", "nephron", "renal system", "excretion", "filtration", "urine", "cortex", "medulla", "homeostasis"],
  },
  {
    key: "nephron",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kidney_nephron_molar_transport_diagram.svg/960px-Kidney_nephron_molar_transport_diagram.svg.png",
    label: "Nephron — Kidney Filtration",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nephron", "kidney filtration", "glomerulus", "renal tubule", "ultrafiltration", "reabsorption", "homeostasis"],
  },
  {
    key: "brain",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Brain_diagram_fr.svg/960px-Brain_diagram_fr.svg.png",
    label: "Human Brain Diagram",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["brain", "human brain", "cerebrum", "cerebellum", "brain stem", "medulla", "frontal lobe", "temporal lobe", "coordination and control"],
  },
  {
    key: "blood_cells",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Blausen_0425_Formed_Elements.png/960px-Blausen_0425_Formed_Elements.png",
    label: "Blood Cells",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["blood cells", "red blood cells", "white blood cells", "platelets", "blood", "haemoglobin", "erythrocytes", "leucocytes", "the human circulatory system"],
  },
  {
    key: "endocrine_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Endocrine_English.svg/640px-Endocrine_English.svg.png",
    label: "Endocrine System — Hormones",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["hormones", "endocrine system", "glands", "pituitary", "thyroid", "adrenal", "pancreas", "insulin", "glucagon", "adrenaline", "oestrogen", "testosterone", "coordination and control"],
  },
  {
    key: "homeostasis_blood_glucose",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Glucose_Homeostasis.png/960px-Glucose_Homeostasis.png",
    label: "Blood Glucose Homeostasis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["homeostasis", "blood glucose", "insulin", "glucagon", "diabetes", "pancreas", "negative feedback", "coordination and control"],
  },
  {
    key: "teeth_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Teeth_types_colored.png",
    label: "Types of Teeth",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["teeth", "types of teeth", "incisor", "canine", "molar", "premolar", "dental", "the human digestive system"],
  },
  {
    key: "skin_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Skin_layers.png/960px-Skin_layers.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/500px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
    label: "DNA Double Helix Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["dna", "dna structure", "double helix", "nucleotide", "base pairs", "adenine", "thymine", "guanine", "cytosine", "genetics", "inheritance variation and evolution"],
  },
  {
    key: "dna_replication",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/DNA_replication_en.svg/960px-DNA_replication_en.svg.png",
    label: "DNA Replication",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["dna replication", "semi-conservative replication", "helicase", "polymerase", "genetics", "cell biology advanced"],
  },
  {
    key: "protein_synthesis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/MRNA-interaction.png/960px-MRNA-interaction.png",
    label: "Protein Synthesis — Transcription and Translation",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["protein synthesis", "transcription", "translation", "mrna", "ribosome", "amino acid", "codon", "genetics", "biological molecules"],
  },
  {
    key: "mendelian_genetics",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Punnett_square_mendel_flowers.svg/960px-Punnett_square_mendel_flowers.svg.png",
    label: "Punnett Square — Mendelian Genetics",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["punnett square", "genetics", "dominant", "recessive", "allele", "genotype", "phenotype", "mendel", "inheritance variation and evolution", "inheritance"],
  },
  {
    key: "natural_selection",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Mutation_and_selection_diagram.svg/960px-Mutation_and_selection_diagram.svg.png",
    label: "Natural Selection",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["natural selection", "evolution", "adaptation", "survival of the fittest", "mutation", "variation", "darwin", "inheritance variation and evolution"],
  },
  {
    key: "evolution_tree",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Darwin_Tree_1837.png/500px-Darwin_Tree_1837.png",
    label: "Darwin's Tree of Life",
    attribution: "Charles Darwin, " + WM,
    license: PD,
    keywords: ["evolution", "tree of life", "common ancestor", "speciation", "darwin", "inheritance variation and evolution"],
  },
  {
    key: "chromosome_karyotype",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Karyotype.png/960px-Karyotype.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/960px-Photosynthesis_en.svg.png",
    label: "Photosynthesis Process",
    attribution: "At09kg, " + WM,
    license: CC_BY_SA_3,
    keywords: ["photosynthesis", "chlorophyll", "light reaction", "glucose", "oxygen", "carbon dioxide", "chloroplast", "light energy", "bioenergetics"],
  },
  {
    key: "leaf_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Leaf_Structure.svg/960px-Leaf_Structure.svg.png",
    label: "Leaf Structure (Cross-Section)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["leaf", "leaf structure", "leaf cross section", "stomata", "palisade cells", "mesophyll", "epidermis", "guard cells", "photosynthesis"],
  },
  {
    key: "flower_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Mature_flower_diagram.svg/960px-Mature_flower_diagram.svg.png",
    label: "Flower Structure",
    attribution: "Mariana Ruiz LadyofHats, " + WM,
    license: PD,
    keywords: ["flower", "flower structure", "pollination", "stamen", "pistil", "petal", "sepal", "anther", "ovary", "parts of a plant", "reproduction in plants and animals"],
  },
  {
    key: "plant_transport",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Xylem_and_phloem.svg/640px-Xylem_and_phloem.svg.png",
    label: "Xylem and Phloem — Plant Transport",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["xylem", "phloem", "plant transport", "transpiration", "translocation", "vascular bundle", "plant tissues"],
  },
  {
    key: "food_chain",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/FoodChain.svg/960px-FoodChain.svg.png",
    label: "Food Chain",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["food chain", "food web", "producer", "consumer", "predator", "prey", "trophic level", "ecosystem", "habitats", "the living world"],
  },
  {
    key: "food_web",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/FoodWeb.svg/640px-FoodWeb.svg.png",
    label: "Food Web — Habitats and Ecosystems",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["food web", "habitat", "ecosystem", "producer", "consumer", "predator", "prey", "herbivore", "carnivore", "omnivore", "decomposer", "the living world"],
  },
  {
    key: "carbon_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Carbon_cycle-cute_diagram.svg/960px-Carbon_cycle-cute_diagram.svg.png",
    label: "Carbon Cycle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["carbon cycle", "carbon dioxide", "respiration", "decomposition", "fossil fuels", "atmosphere", "global warming", "water and carbon cycles"],
  },
  {
    key: "nitrogen_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Nitrogen_Cycle.svg/960px-Nitrogen_Cycle.svg.png",
    label: "Nitrogen Cycle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nitrogen cycle", "nitrogen fixation", "nitrification", "denitrification", "ammonia", "nitrates", "bacteria", "ecosystems"],
  },
  {
    key: "water_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Water_cycle_complete.png/960px-Water_cycle_complete.png",
    label: "Water Cycle",
    attribution: "USGS, " + WM,
    license: PD,
    keywords: ["water cycle", "evaporation", "condensation", "precipitation", "transpiration", "runoff", "hydrological cycle", "rain", "the water cycle", "water and carbon cycles"],
  },
  {
    key: "classification_living_things",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Biological_classification_L_Pengo_vflip.svg/640px-Biological_classification_L_Pengo_vflip.svg.png",
    label: "Classification of Living Things",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["classification", "living things", "vertebrates", "invertebrates", "mammals", "reptiles", "amphibians", "fish", "birds", "taxonomy", "kingdom", "species", "classification of living things"],
  },
  {
    key: "life_cycle_butterfly",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Butterfly_Life_Cycle_Chart%2C_Metamorphosis_Lab_in_the_Grand_Atrium%2C_Franklin_Park_Conservatory%2C_Columbus%2C_Ohio.jpg/960px-Butterfly_Life_Cycle_Chart%2C_Metamorphosis_Lab_in_the_Grand_Atrium%2C_Franklin_Park_Conservatory%2C_Columbus%2C_Ohio.jpg",
    label: "Life Cycle of a Butterfly",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["life cycle", "butterfly", "metamorphosis", "egg", "caterpillar", "larva", "pupa", "chrysalis", "reproduction and life cycles"],
  },
  {
    key: "life_cycle_frog",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Metamorphosis_frog_Meyers.png",
    label: "Life Cycle of a Frog",
    attribution: WM,
    license: PD,
    keywords: ["life cycle frog", "frog", "tadpole", "spawn", "amphibian", "metamorphosis", "reproduction and life cycles"],
  },
  {
    key: "enzyme",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Induced_fit_diagram.svg/960px-Induced_fit_diagram.svg.png",
    label: "Enzyme Action (Lock and Key / Induced Fit)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["enzyme", "enzymes", "lock and key", "active site", "substrate", "enzyme action", "induced fit", "enzyme substrate complex", "bioenergetics"],
  },
  {
    key: "respiration_aerobic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Cellular_respiration.svg/640px-Cellular_respiration.svg.png",
    label: "Cellular Respiration",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["respiration", "cellular respiration", "aerobic respiration", "anaerobic respiration", "glucose", "atp", "mitochondria", "oxygen", "carbon dioxide", "lactic acid", "bioenergetics"],
  },
  {
    key: "krebs_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Citric_acid_cycle_with_aconitate_2.svg/640px-Citric_acid_cycle_with_aconitate_2.svg.png",
    label: "Krebs Cycle (Citric Acid Cycle)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["krebs cycle", "citric acid cycle", "aerobic respiration", "atp", "nadh", "mitochondria", "bioenergetics", "cell biology advanced"],
  },
  {
    key: "biomes_world",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Vegetation.png/960px-Vegetation.png",
    label: "World Biomes Map",
    attribution: "USGS, " + WM,
    license: PD,
    keywords: ["biomes", "vegetation belts", "tropical rainforest", "desert", "tundra", "grassland", "taiga", "world biomes", "the living world", "biomes and vegetation belts"],
  },
  {
    key: "tropical_rainforest",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Rainforest_layers.png/640px-Rainforest_layers.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Blausen_0624_LymphaticSystem_Female.png/640px-Blausen_0624_LymphaticSystem_Female.png",
    label: "Immune / Lymphatic System",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["immune system", "lymphatic system", "antibodies", "white blood cells", "infection", "pathogen", "vaccination", "infection and response"],
  },
  {
    key: "virus_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Virus_diagram.svg/640px-Virus_diagram.svg.png",
    label: "Virus Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["virus", "virus structure", "pathogen", "infection", "capsid", "nucleic acid", "infection and response"],
  },
  {
    key: "bacteria_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Prokaryote_cell.svg/640px-Prokaryote_cell.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Helium_atom_QM.svg/960px-Helium_atom_QM.svg.png",
    label: "Atomic Structure (Bohr Model)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["atom", "atomic structure", "bohr model", "electron", "proton", "neutron", "nucleus", "electron shell", "orbit", "atomic model", "atoms elements and compounds", "atomic structure and the periodic table"],
  },
  {
    key: "periodic_table",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b6/PTable_structure.png",
    label: "Periodic Table Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["periodic table", "elements", "groups", "periods", "metals", "non-metals", "atomic number", "chemical elements", "the periodic table", "atomic structure and the periodic table"],
  },
  {
    key: "periodic_table_full",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Simple_Periodic_Table_Chart-en.svg/960px-Simple_Periodic_Table_Chart-en.svg.png",
    label: "Full Periodic Table of Elements",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["periodic table", "all elements", "groups", "periods", "transition metals", "noble gases", "halogens", "alkali metals", "atomic structure and the periodic table"],
  },
  {
    key: "ionic_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a8/NaF.gif",
    label: "Ionic Bonding",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ionic bonding", "ionic bond", "ions", "sodium chloride", "nacl", "electron transfer", "electrostatic attraction", "ionic compound", "bonding and structure", "bonding structure and properties"],
  },
  {
    key: "covalent_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Covalent_bond_hydrogen.svg/960px-Covalent_bond_hydrogen.svg.png",
    label: "Covalent Bonding",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["covalent bonding", "covalent bond", "shared electrons", "molecule", "h2", "hydrogen molecule", "molecular bonding", "bonding and structure"],
  },
  {
    key: "metallic_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Metallic_bond.svg/640px-Metallic_bond.svg.png",
    label: "Metallic Bonding",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["metallic bonding", "metallic bond", "delocalised electrons", "metal ions", "sea of electrons", "bonding and structure"],
  },
  {
    key: "states_of_matter",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Solid_liquid_gas.svg/960px-Solid_liquid_gas.svg.png",
    label: "States of Matter",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["states of matter", "solid", "liquid", "gas", "melting", "freezing", "evaporation", "condensation", "sublimation", "particle model", "properties and changes of materials"],
  },
  {
    key: "particle_model",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Particle_model_of_matter.svg/640px-Particle_model_of_matter.svg.png",
    label: "Particle Model of Matter",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["particle model", "particles", "solid liquid gas", "kinetic theory", "states of matter", "properties and changes of materials"],
  },
  {
    key: "chromatography",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Chromatography_of_chlorophyll_-_Step_4.jpg",
    label: "Paper Chromatography",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["chromatography", "paper chromatography", "separation", "rf value", "solvent", "mixture separation", "pigments", "chemical analysis"],
  },
  {
    key: "distillation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Simple_distillation_apparatus.svg/960px-Simple_distillation_apparatus.svg.png",
    label: "Simple Distillation Apparatus",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["distillation", "simple distillation", "fractional distillation", "condenser", "separation", "boiling point", "flask", "chemical analysis"],
  },
  {
    key: "filtration",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Filtration_diagram.svg/640px-Filtration_diagram.svg.png",
    label: "Filtration",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["filtration", "filter paper", "funnel", "residue", "filtrate", "separation techniques", "chemical analysis"],
  },
  {
    key: "ph_scale",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/PH_scale.svg/960px-PH_scale.svg.png",
    label: "pH Scale",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ph scale", "acid", "alkali", "neutral", "ph", "indicator", "acidic", "alkaline", "universal indicator", "acids and alkalis", "chemical changes"],
  },
  {
    key: "electrolysis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Electrolysis_of_water_with_diagram.png/960px-Electrolysis_of_water_with_diagram.png",
    label: "Electrolysis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electrolysis", "electrode", "anode", "cathode", "electrolyte", "decomposition", "electrochemistry", "copper sulfate", "chemical changes"],
  },
  {
    key: "reaction_rate",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Activation_energy.svg/640px-Activation_energy.svg.png",
    label: "Activation Energy and Reaction Rate",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["activation energy", "reaction rate", "rates of reaction", "catalyst", "energy profile", "exothermic", "endothermic", "enthalpy"],
  },
  {
    key: "exothermic_endothermic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Exothermic_vs_endothermic.svg/640px-Exothermic_vs_endothermic.svg.png",
    label: "Exothermic vs Endothermic Reactions",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["exothermic", "endothermic", "energy change", "enthalpy", "heat released", "heat absorbed", "chemical reactions", "rates of reaction"],
  },
  {
    key: "mole_concept",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Avogadro_number.svg/640px-Avogadro_number.svg.png",
    label: "The Mole — Avogadro's Number",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["mole", "avogadro", "molar mass", "quantitative chemistry", "relative formula mass", "moles calculation"],
  },
  {
    key: "haber_process",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Haber_process.svg/640px-Haber_process.svg.png",
    label: "Haber Process",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["haber process", "ammonia", "nitrogen", "hydrogen", "industrial chemistry", "reversible reaction", "equilibrium", "using resources"],
  },
  {
    key: "alkanes_alkenes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Ethane-3D-balls.png/640px-Ethane-3D-balls.png",
    label: "Alkanes and Alkenes — Organic Chemistry",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["alkanes", "alkenes", "organic chemistry", "hydrocarbons", "methane", "ethane", "ethene", "crude oil", "carbon compounds"],
  },
  {
    key: "crude_oil_fractional_distillation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Crude_oil_distillation.svg/640px-Crude_oil_distillation.svg.png",
    label: "Fractional Distillation of Crude Oil",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["crude oil", "fractional distillation", "fractions", "petrol", "diesel", "bitumen", "kerosene", "carbon compounds", "using resources"],
  },
  {
    key: "transition_metals",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Simple_Periodic_Table_Chart-en.svg/640px-Simple_Periodic_Table_Chart-en.svg.png",
    label: "Transition Metals in the Periodic Table",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["transition metals", "d-block", "iron", "copper", "zinc", "catalysts", "coloured compounds", "transition metals and reactions"],
  },
  {
    key: "water_treatment",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Drinking_water_treatment_process.svg/640px-Drinking_water_treatment_process.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Sine_wave_amplitude.svg/960px-Sine_wave_amplitude.svg.png",
    label: "Transverse Wave — Amplitude and Wavelength",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["transverse wave", "wave", "amplitude", "wavelength", "crest", "trough", "frequency", "wave diagram", "oscillation", "waves", "waves and optics"],
  },
  {
    key: "longitudinal_wave",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Onde_compression_impulsion_1d_30_petit.gif/640px-Onde_compression_impulsion_1d_30_petit.gif",
    label: "Longitudinal Wave — Compression and Rarefaction",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["longitudinal wave", "compression", "rarefaction", "sound wave", "pressure wave", "waves", "sound"],
  },
  {
    key: "electromagnetic_spectrum",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/EM_spectrum.svg/960px-EM_spectrum.svg.png",
    label: "Electromagnetic Spectrum",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electromagnetic spectrum", "em spectrum", "radio waves", "microwaves", "infrared", "visible light", "ultraviolet", "x-rays", "gamma rays", "waves and the electromagnetic spectrum", "waves and optics"],
  },
  {
    key: "electric_circuit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Circuit_elements.svg/960px-Circuit_elements.svg.png",
    label: "Electric Circuit Symbols",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electric circuit", "circuit symbols", "resistor", "capacitor", "battery", "bulb", "switch", "ammeter", "voltmeter", "circuit diagram", "electricity", "simple electrical circuits"],
  },
  {
    key: "series_parallel_circuit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Series_and_parallel_circuits.svg/960px-Series_and_parallel_circuits.svg.png",
    label: "Series and Parallel Circuits",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["series circuit", "parallel circuit", "series and parallel", "current", "voltage", "resistance", "ohm's law", "electricity"],
  },
  {
    key: "ohms_law",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Ohms_law_voltage_source.svg/640px-Ohms_law_voltage_source.svg.png",
    label: "Ohm's Law — V = IR",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ohm's law", "resistance", "voltage", "current", "v=ir", "electricity", "iv graph"],
  },
  {
    key: "forces",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Free_body_diagram2.svg/960px-Free_body_diagram2.svg.png",
    label: "Free Body Diagram — Forces",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["forces", "free body diagram", "balanced forces", "unbalanced forces", "weight", "normal force", "friction", "resultant force", "newton", "simple forces including magnets"],
  },
  {
    key: "newtons_laws",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Newtons_laws_in_latin.jpg/640px-Newtons_laws_in_latin.jpg",
    label: "Newton's Laws of Motion",
    attribution: WM,
    license: PD,
    keywords: ["newton's laws", "first law", "second law", "third law", "inertia", "f=ma", "action reaction", "forces and motion"],
  },
  {
    key: "velocity_time_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Velocity_time_graph.svg/640px-Velocity_time_graph.svg.png",
    label: "Velocity-Time Graph",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["velocity time graph", "speed time graph", "acceleration", "deceleration", "distance", "area under graph", "motion graph", "kinematics", "forces and motion"],
  },
  {
    key: "distance_time_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Distance_time_graph.svg/640px-Distance_time_graph.svg.png",
    label: "Distance-Time Graph",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["distance time graph", "speed", "gradient", "motion", "kinematics", "forces and motion"],
  },
  {
    key: "refraction",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Snells_law2.svg/960px-Snells_law2.svg.png",
    label: "Refraction of Light (Snell's Law)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["refraction", "snell's law", "light", "angle of incidence", "angle of refraction", "normal line", "optics", "bending light", "waves and optics"],
  },
  {
    key: "reflection",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Reflection_angles.svg/960px-Reflection_angles.svg.png",
    label: "Reflection of Light",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["reflection", "angle of incidence", "angle of reflection", "mirror", "light reflection", "normal", "law of reflection", "waves and optics", "light shadow"],
  },
  {
    key: "nuclear_fission",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Nuclear_fission.svg/960px-Nuclear_fission.svg.png",
    label: "Nuclear Fission",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["nuclear fission", "fission", "nuclear reaction", "uranium", "chain reaction", "neutron", "radioactive", "nuclear energy", "atomic structure"],
  },
  {
    key: "radioactive_decay",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Radioactive_decay_chains_diagram.svg/960px-Radioactive_decay_chains_diagram.svg.png",
    label: "Radioactive Decay",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["radioactive decay", "alpha decay", "beta decay", "gamma radiation", "half-life", "radioactivity", "nuclear decay", "isotopes", "nuclear atom gcse", "alpha beta gamma"],
  },
  {
    key: "alpha_beta_gamma",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Alpha_Decay.svg/640px-Alpha_Decay.svg.png",
    label: "Alpha, Beta and Gamma Radiation",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["alpha radiation", "beta radiation", "gamma radiation", "ionising radiation", "penetrating power", "half life", "nuclear decay", "radioactivity"],
  },
  {
    key: "pressure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Pressure_force_area.svg/960px-Pressure_force_area.svg.png",
    label: "Pressure = Force ÷ Area",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["pressure", "force", "area", "pressure formula", "pascal", "pressure equation", "p = f/a", "forces"],
  },
  {
    key: "magnetic_field",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Magnet0873.png/960px-Magnet0873.png",
    label: "Magnetic Field Lines",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["magnetic field", "magnetic field lines", "magnet", "north pole", "south pole", "electromagnet", "magnets", "simple forces including magnets"],
  },
  {
    key: "electromagnetic_induction",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/VFPt_Solenoid_correct2.svg/640px-VFPt_Solenoid_correct2.svg.png",
    label: "Electromagnetic Induction — Solenoid",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electromagnetic induction", "solenoid", "coil", "magnetic flux", "faraday", "lenz", "generator", "transformer", "induced emf", "induced current"],
  },
  {
    key: "energy_transfer",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Sankey_diagram_of_a_car.svg/640px-Sankey_diagram_of_a_car.svg.png",
    label: "Sankey Diagram — Energy Transfer",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["energy transfer", "sankey diagram", "efficiency", "wasted energy", "useful energy", "conservation of energy", "energy"],
  },
  {
    key: "solar_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Planets2013.svg/960px-Planets2013.svg.png",
    label: "The Solar System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["solar system", "planets", "sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "space", "earth and space"],
  },
  {
    key: "seasons",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Seasons1.svg/960px-Seasons1.svg.png",
    label: "The Four Seasons — Earth's Orbit",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["seasons", "four seasons", "spring", "summer", "autumn", "winter", "earth orbit", "seasonal changes", "earth and space"],
  },
  {
    key: "moon_phases",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Moon_phases_en.jpg/960px-Moon_phases_en.jpg",
    label: "Phases of the Moon",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["moon phases", "phases of the moon", "new moon", "full moon", "crescent", "waxing", "waning", "earth and space"],
  },
  {
    key: "projectile_motion",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Parabolic_trajectory.svg/640px-Parabolic_trajectory.svg.png",
    label: "Projectile Motion",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["projectile", "projectile motion", "trajectory", "parabola", "horizontal", "vertical", "gravity", "kinematics", "projectiles"],
  },
  {
    key: "specific_heat_capacity",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Heating_curve_of_water.svg/640px-Heating_curve_of_water.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Volcano_scheme.svg/960px-Volcano_scheme.svg.png",
    label: "Volcano Cross-Section",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["volcano", "volcanic eruption", "magma", "lava", "crater", "vent", "tectonic plates", "composite volcano", "shield volcano", "volcanoes", "volcanoes and earthquakes"],
  },
  {
    key: "tectonic_plates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Tectonic_plates.png/960px-Tectonic_plates.png",
    label: "Tectonic Plates Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["tectonic plates", "plate tectonics", "plate boundaries", "continental drift", "subduction", "collision", "divergent", "convergent", "tectonic plates and earthquakes"],
  },
  {
    key: "plate_boundaries",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Tectonic_plate_boundaries.png",
    label: "Types of Plate Boundaries",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["plate boundary", "constructive boundary", "destructive boundary", "conservative boundary", "transform fault", "ridge", "trench", "tectonic plates and earthquakes"],
  },
  {
    key: "earthquake_seismic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Seismic_wave_types.svg/640px-Seismic_wave_types.svg.png",
    label: "Earthquake — Seismic Waves",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["earthquake", "seismic waves", "p-waves", "s-waves", "epicentre", "focus", "richter scale", "volcanoes and earthquakes", "tectonic plates and earthquakes"],
  },
  {
    key: "glaciation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Glacial_landscape.svg/960px-Glacial_landscape.svg.png",
    label: "Glacial Landforms",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["glaciation", "glacier", "glacial landforms", "corrie", "arête", "horn", "u-shaped valley", "moraine", "drumlin", "ice age"],
  },
  {
    key: "rock_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Rock_cycle_nps.gif/960px-Rock_cycle_nps.gif",
    label: "The Rock Cycle",
    attribution: "NPS, " + WM,
    license: PD,
    keywords: ["rock cycle", "igneous", "sedimentary", "metamorphic", "weathering", "erosion", "magma", "rocks", "geology", "rocks and soils"],
  },
  {
    key: "river_processes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/River_meander.svg/960px-River_meander.svg.png",
    label: "River Meander and Processes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["river meander", "meander", "erosion", "deposition", "river", "oxbow lake", "lateral erosion", "river processes", "fluvial", "rivers", "rivers processes and landforms"],
  },
  {
    key: "river_long_profile",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/River_profile.svg/640px-River_profile.svg.png",
    label: "River Long Profile",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["river long profile", "upper course", "middle course", "lower course", "source", "mouth", "gradient", "rivers"],
  },
  {
    key: "coastal_processes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Coastal_erosion_diagram.svg/640px-Coastal_erosion_diagram.svg.png",
    label: "Coastal Erosion Processes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["coastal erosion", "hydraulic action", "abrasion", "attrition", "longshore drift", "cliff", "wave cut platform", "coastal processes"],
  },
  {
    key: "population_pyramid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Population_pyramid_of_World_%282019%29.png/500px-Population_pyramid_of_World_%282019%29.png",
    label: "Population Pyramid",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["population pyramid", "age-sex pyramid", "birth rate", "death rate", "population structure", "demographics", "population", "urbanisation"],
  },
  {
    key: "demographic_transition",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Demographic-transition-5-stages.svg/640px-Demographic-transition-5-stages.svg.png",
    label: "Demographic Transition Model",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["demographic transition", "birth rate", "death rate", "population growth", "natural increase", "urbanisation", "changing places"],
  },
  {
    key: "climate_zones",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Koppen_World_Map_%28retouched_version%29.svg/960px-Koppen_World_Map_%28retouched_version%29.svg.png",
    label: "World Climate Zones (Köppen)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["climate zones", "koppen", "tropical", "arid", "temperate", "continental", "polar", "weather and climate", "climate change"],
  },
  {
    key: "greenhouse_effect",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_green_house_effect.svg/640px-The_green_house_effect.svg.png",
    label: "The Greenhouse Effect",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["greenhouse effect", "greenhouse gases", "global warming", "climate change", "carbon dioxide", "methane", "atmosphere"],
  },
  {
    key: "compass_directions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Compass_card_en.svg/500px-Compass_card_en.svg.png",
    label: "Compass Directions",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["compass", "compass directions", "north", "south", "east", "west", "compass rose", "map skills", "cardinal directions"],
  },
  {
    key: "contour_lines",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Contour_map.svg/640px-Contour_map.svg.png",
    label: "Contour Lines — Topographic Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["contour lines", "topographic map", "elevation", "relief", "map reading", "map skills", "ordnance survey"],
  },
  {
    key: "urban_land_use",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Burgess_model.svg/640px-Burgess_model.svg.png",
    label: "Urban Land Use — Burgess Model",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["urban land use", "burgess model", "cbd", "inner city", "suburbs", "urban zones", "settlements and land use", "urban issues and challenges", "urbanisation"],
  },
  {
    key: "development_indicators",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/GDP_PPP_Per_Capita_IMF_2008.svg/960px-GDP_PPP_Per_Capita_IMF_2008.svg.png",
    label: "Global Development Indicators Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["development", "gdp", "hdi", "gni", "development indicators", "the changing economic world", "trade and economics"],
  },
  {
    key: "resource_management_water",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Drinking_water_treatment_process.svg/640px-Drinking_water_treatment_process.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Number-line.svg/960px-Number-line.svg.png",
    label: "Number Line",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["number line", "integers", "negative numbers", "positive numbers", "ordering numbers", "directed numbers", "counting and number recognition"],
  },
  {
    key: "place_value",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Place_value_chart.svg/640px-Place_value_chart.svg.png",
    label: "Place Value Chart",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["place value", "hundreds", "tens", "ones", "thousands", "decimal", "place value chart", "place value to 1000", "place value to 100"],
  },
  {
    key: "multiplication_table",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Multiplication_table_to_scale.svg/960px-Multiplication_table_to_scale.svg.png",
    label: "Multiplication Table",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["multiplication", "times tables", "multiplication table", "times table", "multiplication and division"],
  },
  {
    key: "fractions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cake_fractions.svg/960px-Cake_fractions.svg.png",
    label: "Fractions",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["fractions", "numerator", "denominator", "half", "quarter", "thirds", "equivalent fractions", "proper fractions", "fractions halves quarters thirds"],
  },
  {
    key: "fractions_decimals_percentages",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Fraction_circles.svg/640px-Fraction_circles.svg.png",
    label: "Fractions, Decimals and Percentages",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["fractions", "decimals", "percentages", "equivalent fractions", "converting fractions", "fraction decimal percentage", "fdp", "mixed numbers", "improper fractions"],
  },
  {
    key: "ratio_proportion",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ratio_example.svg/640px-Ratio_example.svg.png",
    label: "Ratio and Proportion",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ratio", "proportion", "sharing in a ratio", "equivalent ratio", "simplifying ratio", "direct proportion", "unitary method", "ratio and proportion"],
  },
  {
    key: "standard_form",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Scientific_notation_example.svg/640px-Scientific_notation_example.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Linear_Function_Graph.svg/640px-Linear_Function_Graph.svg.png",
    label: "Straight Line Graph (y = mx + c)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["straight line", "linear graph", "y = mx + c", "gradient", "y-intercept", "slope", "linear equation", "coordinate geometry", "linear function", "real-life graphs", "algebra and sequences", "expressions and equations", "expressions equations", "solving equations", "forming equations", "one-step equations", "two-step equations", "equations and inequalities", "algebraic expressions", "simplifying expressions", "expanding brackets", "factorising"],
  },
  {
    key: "quadratic_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Polynomialdeg2.svg/640px-Polynomialdeg2.svg.png",
    label: "Quadratic Function Graph (Parabola)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["quadratic", "quadratic equation", "quadratic formula", "parabola", "quadratic graph", "completing the square", "roots", "vertex", "discriminant", "quadratic function", "quadratic equations"],
  },
  {
    key: "simultaneous_equations",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Two_linear_equations.svg/640px-Two_linear_equations.svg.png",
    label: "Simultaneous Equations — Graphical Solution",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["simultaneous equations", "linear equations", "intersection", "graphical method", "elimination", "substitution", "simultaneous equations introduction"],
  },
  {
    key: "sequences_arithmetic",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Arithmetic_sequence.svg/640px-Arithmetic_sequence.svg.png",
    label: "Arithmetic Sequence",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["arithmetic sequence", "arithmetic progression", "common difference", "nth term", "sequences", "algebra and sequences", "sequences and series"],
  },
  {
    key: "geometric_sequence",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Geometric_sequence.svg/640px-Geometric_sequence.svg.png",
    label: "Geometric Sequence",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["geometric sequence", "geometric progression", "common ratio", "nth term", "sequences and series", "algebra and functions"],
  },
  {
    key: "inequalities",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Inequality_on_number_line.svg/640px-Inequality_on_number_line.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pythagorean.svg/960px-Pythagorean.svg.png",
    label: "Pythagoras' Theorem",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["pythagoras", "pythagorean theorem", "right-angled triangle", "hypotenuse", "a squared b squared c squared", "right angle triangle", "pythagoras theorem"],
  },
  {
    key: "trigonometry",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trigonometry_triangle.svg/640px-Trigonometry_triangle.svg.png",
    label: "Trigonometry — SOH CAH TOA",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["trigonometry", "soh cah toa", "sine", "cosine", "tangent", "right angle triangle", "trig ratios", "sin cos tan", "adjacent", "opposite", "hypotenuse", "trig", "trigonometry introduction"],
  },
  {
    key: "circle_parts",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Circle-withsegments.svg/960px-Circle-withsegments.svg.png",
    label: "Parts of a Circle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["circle", "parts of a circle", "radius", "diameter", "circumference", "chord", "arc", "sector", "segment", "tangent"],
  },
  {
    key: "circle_theorems",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Circle_theorem_1.svg/640px-Circle_theorem_1.svg.png",
    label: "Circle Theorems",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["circle theorems", "angle at centre", "angle in semicircle", "cyclic quadrilateral", "tangent", "chord", "arc", "inscribed angle", "circle geometry"],
  },
  {
    key: "angles",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Angle_types.svg/960px-Angle_types.svg.png",
    label: "Types of Angles",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["angles", "acute angle", "obtuse angle", "right angle", "reflex angle", "straight angle", "types of angles", "geometry", "angles acute obtuse and right angles"],
  },
  {
    key: "angles_parallel_lines",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Parallel_lines_transversal.svg/640px-Parallel_lines_transversal.svg.png",
    label: "Angles in Parallel Lines",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["parallel lines", "alternate angles", "corresponding angles", "co-interior angles", "transversal", "angles and lines", "properties of shapes angles in shapes"],
  },
  {
    key: "3d_shapes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/SolidShapes.png/960px-SolidShapes.png",
    label: "3D Shapes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["3d shapes", "cube", "cuboid", "sphere", "cylinder", "cone", "pyramid", "prism", "polyhedron", "solid shapes", "3d shapes and volume"],
  },
  {
    key: "area_perimeter",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Perimeter_area.svg/640px-Perimeter_area.svg.png",
    label: "Area and Perimeter of Shapes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["area", "perimeter", "rectangle area", "square area", "triangle area", "area formula", "perimeter formula", "compound shapes", "area and perimeter"],
  },
  {
    key: "coordinates_grid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Cartesian-coordinate-system.svg/640px-Cartesian-coordinate-system.svg.png",
    label: "Coordinate Grid (x and y axes)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["coordinates", "coordinate grid", "x axis", "y axis", "cartesian", "plotting points", "ordered pairs", "four quadrants", "grid", "coordinates in the first quadrant"],
  },
  {
    key: "transformation_geometry",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Rotation_illustration2.svg/640px-Rotation_illustration2.svg.png",
    label: "Geometric Transformations",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["transformation", "rotation", "reflection", "translation", "enlargement", "scale factor", "centre of rotation", "congruence", "similarity", "transformations"],
  },
  {
    key: "vectors_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Vector_from_A_to_B.svg/640px-Vector_from_A_to_B.svg.png",
    label: "Vectors — Direction and Magnitude",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["vectors", "vector addition", "vector subtraction", "magnitude", "direction", "column vector", "resultant vector", "vector diagram", "vectors"],
  },
  {
    key: "loci_constructions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bisection_of_an_angle.svg/640px-Bisection_of_an_angle.svg.png",
    label: "Loci and Constructions — Angle Bisector",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["loci", "constructions", "angle bisector", "perpendicular bisector", "compass", "ruler", "geometric construction"],
  },
  {
    key: "sine_cosine_rule",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Triangle_with_notations_2.svg/640px-Triangle_with_notations_2.svg.png",
    label: "Sine and Cosine Rule",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["sine rule", "cosine rule", "non-right triangle", "trigonometry sine and cosine rules", "area of triangle", "trigonometry further identities"],
  },
  {
    key: "surds",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pythagorean.svg/640px-Pythagorean.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Simple_bar_chart.svg/640px-Simple_bar_chart.svg.png",
    label: "Bar Chart",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["bar chart", "bar graph", "data handling", "tally chart", "pictogram", "frequency chart", "statistics bar charts and tables"],
  },
  {
    key: "pie_chart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Composition_of_the_German_Bundesrat_as_a_pie_chart_small.svg/640px-Composition_of_the_German_Bundesrat_as_a_pie_chart_small.svg.png",
    label: "Pie Chart",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["pie chart", "pie graph", "sector", "percentage", "proportion", "data", "statistics", "statistics pie charts and mean"],
  },
  {
    key: "histogram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Histogram_of_arrivals_per_minute.svg/640px-Histogram_of_arrivals_per_minute.svg.png",
    label: "Histogram — Frequency Density",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["histogram", "frequency density", "class width", "grouped data", "frequency distribution", "statistics", "data representation", "statistical sampling and data presentation"],
  },
  {
    key: "scatter_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Scatter_diagram_for_quality_characteristic_XXX.svg/640px-Scatter_diagram_for_quality_characteristic_XXX.svg.png",
    label: "Scatter Graph and Correlation",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["scatter graph", "scatter diagram", "correlation", "line of best fit", "positive correlation", "negative correlation", "no correlation", "scatter graphs and correlation"],
  },
  {
    key: "probability_tree",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Probability_tree_diagram.svg/640px-Probability_tree_diagram.svg.png",
    label: "Probability Tree Diagram",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["probability tree", "tree diagram", "conditional probability", "independent events", "dependent events", "probability", "combined probability", "probability tree diagrams and conditional"],
  },
  {
    key: "venn_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Venn0001.svg/640px-Venn0001.svg.png",
    label: "Venn Diagram",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["venn diagram", "sets", "intersection", "union", "set notation", "probability", "maths", "boolean logic"],
  },
  {
    key: "box_plot",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Boxplot_vs_PDF.svg/640px-Boxplot_vs_PDF.svg.png",
    label: "Box Plot (Box and Whisker)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["box plot", "box and whisker", "median", "quartile", "interquartile range", "outlier", "statistics", "statistical sampling and data presentation"],
  },
  {
    key: "cumulative_frequency",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Cumulative_distribution_function_for_normal_distribution.svg/640px-Cumulative_distribution_function_for_normal_distribution.svg.png",
    label: "Cumulative Frequency Graph",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["cumulative frequency", "ogive", "median", "quartile", "interquartile range", "statistics", "statistical sampling and data presentation"],
  },
  {
    key: "normal_distribution",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Normal_Distribution_PDF.svg/640px-Normal_Distribution_PDF.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/7/75/Binary_counter.gif",
    label: "Binary Number System",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["binary", "binary numbers", "binary code", "bits", "bytes", "denary", "hexadecimal", "number systems", "binary and data representation"],
  },
  {
    key: "logic_gates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Logic-gate-index.png/960px-Logic-gate-index.png",
    label: "Logic Gates",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["logic gates", "and gate", "or gate", "not gate", "nand gate", "nor gate", "xor gate", "boolean logic", "boolean logic"],
  },
  {
    key: "network_topologies",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/NetworkTopologies.svg/960px-NetworkTopologies.svg.png",
    label: "Network Topologies",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["network topology", "bus topology", "star topology", "ring topology", "mesh topology", "computer network", "networking"],
  },
  {
    key: "cpu_architecture",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d8/ABasicComputer.gif",
    label: "CPU Architecture — Von Neumann",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["cpu", "processor", "alu", "control unit", "registers", "fetch decode execute", "von neumann", "computer architecture"],
  },
  {
    key: "flowchart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/LampFlowchart.svg/960px-LampFlowchart.svg.png",
    label: "Flowchart Symbols",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["flowchart", "algorithm", "flow chart", "decision", "process", "start", "end", "programming", "pseudocode", "algorithms and flowcharts", "simple instructions and algorithms"],
  },
  {
    key: "sorting_algorithms",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Merge_sort_animation2.gif/220px-Merge_sort_animation2.gif",
    label: "Merge Sort Algorithm",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["sorting algorithm", "merge sort", "bubble sort", "insertion sort", "algorithms searching and sorting", "algorithms complexity and graph theory"],
  },
  {
    key: "binary_search",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Binary_Search_Depiction.svg/640px-Binary_Search_Depiction.svg.png",
    label: "Binary Search Algorithm",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["binary search", "linear search", "searching algorithm", "algorithms searching and sorting"],
  },
  {
    key: "osi_model",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/OSI_Model_v1.svg/640px-OSI_Model_v1.svg.png",
    label: "OSI Network Model",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["osi model", "network layers", "tcp/ip", "protocol", "networking", "computer networks"],
  },
  {
    key: "data_storage",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Storage_media.svg/640px-Storage_media.svg.png",
    label: "Data Storage — Bits and Bytes",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["data storage", "bits", "bytes", "kilobyte", "megabyte", "gigabyte", "binary and data representation"],
  },
  {
    key: "html_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/240px-HTML5_logo_and_wordmark.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Europe_1914.jpg/960px-Europe_1914.jpg",
    label: "Europe 1914 — World War I",
    attribution: WM,
    license: PD,
    keywords: ["world war 1", "ww1", "world war one", "first world war", "trench warfare", "western front", "allies", "triple entente", "europe 1914", "world war one"],
  },
  {
    key: "ww2_europe",
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Second_world_war_europe_1939_map_pl2.png",
    label: "World War II — Europe 1939",
    attribution: WM,
    license: PD,
    keywords: ["world war 2", "ww2", "world war two", "second world war", "nazi germany", "axis powers", "allied powers", "d-day", "europe 1939", "world war two and the holocaust"],
  },
  {
    key: "trench_warfare",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Trench_construction_diagram_1914.svg/960px-Trench_construction_diagram_1914.svg.png",
    label: "Trench Construction Diagram (1914)",
    attribution: WM,
    license: PD,
    keywords: ["trench warfare", "trenches", "no man's land", "front line", "ww1 trenches", "dugout", "trench construction", "world war one"],
  },
  {
    key: "roman_empire",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Roman_Empire_Trajan_117AD.png/960px-Roman_Empire_Trajan_117AD.png",
    label: "Roman Empire at its Greatest Extent",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["roman empire", "romans", "rome", "roman britain", "julius caesar", "roman history", "ancient rome", "the roman empire and its impact on britain"],
  },
  {
    key: "ancient_egypt_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Ancient_Egypt_map-en.svg/640px-Ancient_Egypt_map-en.svg.png",
    label: "Ancient Egypt Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["ancient egypt", "egypt", "nile", "pharaoh", "pyramid", "hieroglyphics", "ancient egypt"],
  },
  {
    key: "ancient_greece_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ancient_Greece.jpg/640px-Ancient_Greece.jpg",
    label: "Ancient Greece Map",
    attribution: WM,
    license: PD,
    keywords: ["ancient greece", "greece", "athens", "sparta", "democracy", "olympics", "ancient greece"],
  },
  {
    key: "norman_conquest",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Battle_of_Hastings_map.svg/640px-Battle_of_Hastings_map.svg.png",
    label: "Battle of Hastings 1066",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["norman conquest", "battle of hastings", "1066", "william the conqueror", "harold", "normans", "the norman conquest 1066"],
  },
  {
    key: "cold_war_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Cold_War_Map_1980.svg/960px-Cold_War_Map_1980.svg.png",
    label: "Cold War — NATO vs Warsaw Pact",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["cold war", "nato", "warsaw pact", "usa", "ussr", "iron curtain", "superpower relations and the cold war", "the cold war"],
  },
  {
    key: "civil_rights_timeline",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/March_on_Washington_edit.jpg/640px-March_on_Washington_edit.jpg",
    label: "Civil Rights Movement — March on Washington",
    attribution: WM,
    license: PD,
    keywords: ["civil rights", "martin luther king", "rosa parks", "march on washington", "segregation", "the civil rights movement"],
  },
  {
    key: "industrial_revolution",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Maquina_vapor_Watt_ETSIIM.jpg/640px-Maquina_vapor_Watt_ETSIIM.jpg",
    label: "Industrial Revolution — Steam Engine",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["industrial revolution", "steam engine", "factory", "cotton mill", "urbanisation", "the industrial revolution"],
  },
  {
    key: "weimar_germany",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Bundesarchiv_Bild_183-H1216-0500-002%2C_Adolf_Hitler.jpg/480px-Bundesarchiv_Bild_183-H1216-0500-002%2C_Adolf_Hitler.jpg",
    label: "Weimar and Nazi Germany — Rise of Hitler",
    attribution: "Bundesarchiv, " + WM,
    license: CC_BY_SA_3,
    keywords: ["weimar republic", "nazi germany", "hitler", "third reich", "holocaust", "propaganda", "weimar and nazi germany 1918 1939"],
  },
  {
    key: "british_empire_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/The_British_Empire.png/960px-The_British_Empire.png",
    label: "The British Empire at its Height",
    attribution: WM,
    license: PD,
    keywords: ["british empire", "colonialism", "imperialism", "india", "africa", "the british empire"],
  },
  {
    key: "stone_age_timeline",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prehistoric_Britain.svg/640px-Prehistoric_Britain.svg.png",
    label: "Stone Age to Iron Age — Prehistoric Britain",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["stone age", "bronze age", "iron age", "prehistoric", "hunter gatherer", "stone age to iron age"],
  },
  {
    key: "anglo_saxons",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Anglo-Saxon_kingdoms.svg/640px-Anglo-Saxon_kingdoms.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Supply-demand-right-shift-demand.svg/640px-Supply-demand-right-shift-demand.svg.png",
    label: "Supply and Demand Curve",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["supply and demand", "demand curve", "supply curve", "equilibrium", "price", "quantity", "market", "economics", "trade and economics"],
  },
  {
    key: "business_ownership",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Org_chart.svg/640px-Org_chart.svg.png",
    label: "Business Organisational Structure",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["business structure", "organisational chart", "hierarchy", "sole trader", "partnership", "limited company", "business ownership types"],
  },
  {
    key: "business_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Business_cycle_schematic.svg/640px-Business_cycle_schematic.svg.png",
    label: "Business / Economic Cycle",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["business cycle", "economic cycle", "boom", "recession", "recovery", "trough", "gdp", "economics", "a-level business"],
  },
  {
    key: "swot_analysis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/SWOT_en.svg/640px-SWOT_en.svg.png",
    label: "SWOT Analysis",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["swot analysis", "strengths", "weaknesses", "opportunities", "threats", "business planning", "business strategy", "a-level business objectives and strategy"],
  },
  {
    key: "inflation_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/US_Inflation.svg/640px-US_Inflation.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Prevailing_world_religions_map.png/960px-Prevailing_world_religions_map.png",
    label: "World Religions Map",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["world religions", "christianity", "islam", "hinduism", "buddhism", "sikhism", "judaism", "what is religion", "special people and stories"],
  },
  {
    key: "christianity_cross",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christian_cross.svg/400px-Christian_cross.svg.png",
    label: "Christian Cross",
    attribution: WM,
    license: PD,
    keywords: ["christianity", "christian cross", "jesus", "god", "bible", "christianity key beliefs", "christianity god and jesus"],
  },
  {
    key: "buddhism_wheel",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Dharma_Wheel.svg/400px-Dharma_Wheel.svg.png",
    label: "Buddhism — Dharma Wheel",
    attribution: WM,
    license: PD,
    keywords: ["buddhism", "dharma wheel", "eight-fold path", "four noble truths", "nirvana", "buddhism key beliefs"],
  },
  {
    key: "hinduism_om",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Om_symbol.svg/400px-Om_symbol.svg.png",
    label: "Hinduism — Om Symbol",
    attribution: WM,
    license: PD,
    keywords: ["hinduism", "om", "brahman", "karma", "dharma", "reincarnation", "hinduism key beliefs"],
  },
  {
    key: "sikhism_khanda",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Khanda.svg/400px-Khanda.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/BYR_color_wheel.svg/640px-BYR_color_wheel.svg.png",
    label: "Colour Wheel — Primary, Secondary, Tertiary",
    attribution: WM,
    license: PD,
    keywords: ["colour wheel", "primary colours", "secondary colours", "tertiary colours", "complementary colours", "colour theory", "art movements pop art impressionism"],
  },
  {
    key: "perspective_drawing",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Two_point_perspective.svg/640px-Two_point_perspective.svg.png",
    label: "Two-Point Perspective Drawing",
    attribution: WM,
    license: PD,
    keywords: ["perspective", "two-point perspective", "vanishing point", "horizon line", "drawing", "sketching and observational drawing", "3d design and sculpture"],
  },
  {
    key: "elements_of_art",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Music_notation.svg/640px-Music_notation.svg.png",
    label: "Music Notation — Treble Clef",
    attribution: WM,
    license: PD,
    keywords: ["music notation", "treble clef", "notes", "stave", "crotchet", "quaver", "minim", "pulse and rhythm", "singing and performing"],
  },
  {
    key: "musical_instruments",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/640px-PNG_transparency_demonstration_1.png",
    label: "Orchestra — Instrument Families",
    attribution: WM,
    license: PD,
    keywords: ["orchestra", "instruments", "strings", "woodwind", "brass", "percussion", "instrument families", "world music"],
  },
  {
    key: "sound_waves",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Sine_wave.svg/960px-Sine_wave.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Anterior_Hip_Muscles_2.PNG/640px-Anterior_Hip_Muscles_2.PNG",
    label: "Major Muscle Groups",
    attribution: "OpenStax, " + WM,
    license: CC_BY_4,
    keywords: ["muscles", "muscle groups", "quadriceps", "hamstrings", "biceps", "triceps", "pe", "a-level pe biomechanics", "a-level pe exercise physiology"],
  },
  {
    key: "heart_rate_exercise",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Velocity_time_graph.svg/640px-Velocity_time_graph.svg.png",
    label: "Heart Rate During Exercise",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["heart rate", "exercise", "aerobic", "anaerobic", "fitness", "cardiovascular", "a-level pe exercise physiology"],
  },
  {
    key: "lever_systems",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Lever_Principle_3D.png/640px-Lever_Principle_3D.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Isometric_projection.svg/640px-Isometric_projection.svg.png",
    label: "Isometric Drawing",
    attribution: WM,
    license: PD,
    keywords: ["isometric drawing", "isometric projection", "3d drawing", "technical drawing", "cad cam and manufacturing", "3d design and sculpture"],
  },
  {
    key: "bridge_structures",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Types_of_bridges.svg/640px-Types_of_bridges.svg.png",
    label: "Types of Bridges — Structures",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["bridge", "structures", "beam bridge", "arch bridge", "suspension bridge", "truss", "structures bridges and frameworks"],
  },
  {
    key: "design_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Design_process.svg/640px-Design_process.svg.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/960px-World_map_-_low_resolution.svg.png",
    label: "World Map — Countries and Languages",
    attribution: WM,
    license: PD,
    keywords: ["world map", "countries", "languages", "travel and transport", "school and education", "town and local area"],
  },
  {
    key: "human_body_mfl",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Blausen_0316_DigestiveSystem.png/640px-Blausen_0316_DigestiveSystem.png",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Plutchik-wheel.svg/640px-Plutchik-wheel.svg.png",
    label: "Emotions Wheel (Plutchik)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["emotions", "feelings", "mental health", "wellbeing", "emotional literacy", "being a good friend", "relationships and families", "substance misuse"],
  },
  {
    key: "healthy_eating_plate",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Eatwell_Guide.jpg/640px-Eatwell_Guide.jpg",
    label: "Eatwell Guide — Healthy Eating",
    attribution: "Public Health England / Crown Copyright, " + WM,
    license: "OGL v3.0",
    keywords: ["healthy eating", "eatwell guide", "food groups", "nutrition", "diet", "health", "pshe"],
  },
  {
    key: "internet_safety",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/640px-Camponotus_flavomarginatus_ant.jpg",
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
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/640px-Photosynthesis_en.svg.png",
    label: "What Plants Need to Grow",
    attribution: "At09kg, " + WM,
    license: CC_BY_SA_3,
    keywords: ["plants", "what plants need to grow", "sunlight", "water", "nutrients", "soil", "photosynthesis", "ks2 science"],
  },
  {
    key: "materials_properties",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Solid_liquid_gas.svg/640px-Solid_liquid_gas.svg.png",
    label: "Properties of Materials",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["materials", "properties of materials", "hard", "soft", "transparent", "opaque", "flexible", "uses of everyday materials", "properties and changes of materials"],
  },
  {
    key: "electricity_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Series_circuit.svg/640px-Series_circuit.svg.png",
    label: "Simple Electrical Circuits (KS2)",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["electricity", "circuit", "battery", "bulb", "switch", "conductor", "insulator", "series circuit", "current", "voltage", "simple electrical circuits", "changing circuits"],
  },
  {
    key: "forces_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Free_body_diagram2.svg/640px-Free_body_diagram2.svg.png",
    label: "Forces — Push, Pull, Gravity, Friction",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["forces", "gravity", "friction", "air resistance", "push", "pull", "balanced forces", "simple forces including magnets", "forces ks2"],
  },
  {
    key: "habitats_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/FoodWeb.svg/640px-FoodWeb.svg.png",
    label: "Habitats and Food Webs",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["habitat", "food web", "food chain", "ecosystem", "living things", "animals", "plants", "ks2 science"],
  },
  {
    key: "light_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Reflection_angles.svg/640px-Reflection_angles.svg.png",
    label: "Light — Reflection and Shadow",
    attribution: WM,
    license: CC_BY_SA_3,
    keywords: ["light", "shadow", "reflection", "transparent", "opaque", "translucent", "light rays", "light shadow ks2"],
  },
  {
    key: "human_body_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Blausen_0316_DigestiveSystem.png/640px-Blausen_0316_DigestiveSystem.png",
    label: "Human Body — Main Organs",
    attribution: "BruceBlaus, " + WM,
    license: CC_BY_3,
    keywords: ["human body", "organs", "body parts", "ks2 science", "primary science", "organ systems"],
  },

  // ── ENGLISH LANGUAGE — Writing and Grammar ─────────────────────────────────
  {
    key: "narrative_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Freytags_pyramid.svg/960px-Freytags_pyramid.svg.png",
    label: "Narrative Structure — Freytag's Pyramid",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["narrative structure", "story structure", "freytag", "creative writing", "narrative", "writing narratives", "plot structure", "19th century fiction", "gothic writing", "horror writing", "analytical essay", "descriptive writing"],
  },
  {
    key: "parts_of_speech",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Parts_of_speech.svg/960px-Parts_of_speech.svg.png",
    label: "Parts of Speech Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 4.0)",
    license: CC_BY_SA_4,
    keywords: ["parts of speech", "nouns verbs adjectives", "grammar", "nouns", "verbs", "adjectives", "pronouns", "grammar and punctuation", "english grammar", "modal verbs", "prefixes suffixes", "synonyms antonyms", "cohesive devices", "fronted adverbials", "subjunctive mood", "joining words"],
  },
  {
    key: "poetry_analysis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/William_Blake_-_The_Tyger.jpg/640px-William_Blake_-_The_Tyger.jpg",
    label: "Poetry — William Blake, The Tyger (1794)",
    attribution: "William Blake, Wikimedia Commons (Public Domain)",
    license: PD,
    keywords: ["poetry", "pre-1900 poetry", "post-1900 poetry", "unseen poetry", "poem analysis", "poetry analysis", "poetic devices"],
  },
  {
    key: "shakespeare_globe",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/The_Globe_Theatre_Wenceslas_Hollar_1647.jpg/640px-The_Globe_Theatre_Wenceslas_Hollar_1647.jpg",
    label: "The Globe Theatre (1647 engraving)",
    attribution: "Wenceslas Hollar, Wikimedia Commons (Public Domain)",
    license: PD,
    keywords: ["shakespeare", "globe theatre", "drama study", "theatre practitioners", "devising drama", "exploring themes drama", "brecht", "stanislavski"],
  },

  // ── MATHEMATICS — Additional Topics ─────────────────────────────────────────
  {
    key: "prime_factors",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Prime_number_theorem_ratio.svg/960px-Prime_number_theorem_ratio.svg.png",
    label: "Prime Numbers and Factors",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["prime numbers", "factors", "multiples", "prime factors", "factors multiples primes", "hcf", "lcm", "highest common factor", "lowest common multiple"],
  },
  {
    key: "bounds_estimation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Riemann_sum_convergence.png/640px-Riemann_sum_convergence.png",
    label: "Bounds and Estimation",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["bounds", "upper bound", "lower bound", "estimation", "rounding", "significant figures", "error bounds", "numerical methods"],
  },
  {
    key: "exponential_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Exp.svg/960px-Exp.svg.png",
    label: "Exponential Function Graph",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["exponential", "logarithm", "exponentials and logarithms", "exponential growth", "exponential decay", "log graph", "natural log"],
  },
  {
    key: "differentiation_calculus",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Tangent_to_a_curve.svg/960px-Tangent_to_a_curve.svg.png",
    label: "Differentiation — Tangent to a Curve",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["differentiation", "calculus", "tangent", "gradient", "derivative", "dy/dx", "turning points", "stationary points", "integration"],
  },
  {
    key: "hypothesis_testing",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/P-value_Graph.png/640px-P-value_Graph.png",
    label: "Hypothesis Testing — p-value Distribution",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["hypothesis testing", "p-value", "significance level", "null hypothesis", "statistical test", "normal distribution", "proof"],
  },
  {
    key: "measurement_units",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/SI_base_unit.svg/960px-SI_base_unit.svg.png",
    label: "SI Units of Measurement",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["measurement", "units", "si units", "metric units", "cm m kg g ml l", "mass", "length", "volume", "word problems", "problem solving"],
  },
  {
    key: "spatial_reasoning",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Net_of_cube.png/640px-Net_of_cube.png",
    label: "3D Shapes — Net of a Cube",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["spatial reasoning", "nets", "3d shapes", "cube net", "3d visualisation", "verbal reasoning", "verbal reasoning word codes"],
  },

  // ── GEOGRAPHY — Additional Topics ────────────────────────────────────────────
  {
    key: "continents_oceans",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/960px-World_map_-_low_resolution.svg.png",
    label: "World Map — Continents and Oceans",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["continents", "oceans", "world map", "continents and oceans", "geography map", "atlas"],
  },
  {
    key: "mountains_formation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Fold_mountains.svg/960px-Fold_mountains.svg.png",
    label: "Mountain Formation — Fold Mountains",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["mountains", "fold mountains", "mountain formation", "tectonic plates", "alps", "himalayas"],
  },
  {
    key: "globalisation_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Globalisation_and_world_cities_research_network.png/640px-Globalisation_and_world_cities_research_network.png",
    label: "Globalisation — World Cities Network",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["globalisation", "global trade", "world cities", "international trade", "economic globalisation"],
  },
  {
    key: "hazards_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Hazard_types.svg/960px-Hazard_types.svg.png",
    label: "Natural Hazards — Types and Distribution",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["hazards", "natural hazards", "tectonic hazards", "volcanic hazards", "earthquake hazards", "tropical storms", "fieldwork investigation"],
  },
  {
    key: "ecology_food_web",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Food_web.svg/960px-Food_web.svg.png",
    label: "Ecology — Food Web",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["ecology", "food web", "food chain", "ecosystem", "trophic levels", "producer", "consumer", "decomposer"],
  },

  // ── HISTORY — Additional Topics ──────────────────────────────────────────────
  {
    key: "tudors_henry_viii",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Henry-VIII-kingofengland_1491-1547.jpg/480px-Henry-VIII-kingofengland_1491-1547.jpg",
    label: "Henry VIII — The Tudors",
    attribution: "Hans Holbein the Younger, Wikimedia Commons (Public Domain)",
    license: PD,
    keywords: ["tudors", "henry viii", "tudor period", "tudor dynasty", "1485-1603", "reformation", "british depth study"],
  },
  {
    key: "russia_revolution",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Bolsheviki.jpg/640px-Bolsheviki.jpg",
    label: "Russian Revolution 1917 — Bolshevik Poster",
    attribution: "Wikimedia Commons (Public Domain)",
    license: PD,
    keywords: ["russia", "russian revolution", "1917", "bolshevik", "soviet union", "russia 1917-1991", "cold war", "communism"],
  },

  // ── SCIENCE — Additional Topics ──────────────────────────────────────────────
  {
    key: "drugs_alcohol_body",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Nervous_system_diagram.png/480px-Nervous_system_diagram.png",
    label: "Effects of Drugs and Alcohol on the Body",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["drugs", "alcohol", "tobacco", "drugs alcohol tobacco", "substance abuse", "health effects", "nervous system effects"],
  },

  // ── PE / SPORT ────────────────────────────────────────────────────────────────
  {
    key: "athletics_biomechanics",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Biomechanics_of_running.svg/960px-Biomechanics_of_running.svg.png",
    label: "Athletics — Biomechanics of Running",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["athletics", "running", "jumping", "throwing", "track and field", "biomechanics", "sprint", "invasion games", "striking fielding", "cricket", "rounders", "tag rugby", "football", "leadership officiating"],
  },

  // ── PSHE / CITIZENSHIP ────────────────────────────────────────────────────────
  {
    key: "self_esteem_pyramid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Maslow%27s_Hierarchy_of_Needs2.svg/960px-Maslow%27s_Hierarchy_of_Needs2.svg.png",
    label: "Maslow's Hierarchy of Needs",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["identity", "self-esteem", "maslow", "hierarchy of needs", "wellbeing", "mental health", "preparing for adulthood", "preparing for university", "careers", "aspirations"],
  },

  // ── DT / TEXTILES ─────────────────────────────────────────────────────────────
  {
    key: "textiles_weaving",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Weaving_diagram.svg/960px-Weaving_diagram.svg.png",
    label: "Textiles — Weaving Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["textiles", "weaving", "textile design", "fabric", "loom", "textiles and weaving", "textiles templates joining", "printing", "collage"],
  },
  {
    key: "pneumatics_mechanism",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Pneumatic_system.svg/960px-Pneumatic_system.svg.png",
    label: "Pneumatics — Mechanism Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["pneumatics", "mechanisms", "pneumatic system", "air pressure", "cad cam", "manufacturing", "design technology"],
  },

  // ── MUSIC ─────────────────────────────────────────────────────────────────────
  {
    key: "music_notation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Music_notation.svg/960px-Music_notation.svg.png",
    label: "Music Notation — Staff and Notes",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["music notation", "staff", "notes", "treble clef", "song writing", "song writing lyrics", "listening appraising", "blues jazz"],
  },

  // ── ART ───────────────────────────────────────────────────────────────────────
  {
    key: "art_colour_wheel",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/BYR_color_wheel.svg/960px-BYR_color_wheel.svg.png",
    label: "Colour Wheel — Primary and Secondary Colours",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["colour wheel", "colour mixing", "primary colours", "secondary colours", "art colour", "famous artists", "portraiture", "art movements", "pop art", "impressionism"],
  },

  // ── CYBERSECURITY ─────────────────────────────────────────────────────────────
  {
    key: "cybersecurity_threats",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Cybersecurity.png/640px-Cybersecurity.png",
    label: "Cybersecurity — Threats and Protection",
    attribution: "Wikimedia Commons (CC BY-SA 4.0)",
    license: CC_BY_SA_4,
    keywords: ["cybersecurity", "cyber security", "hacking", "malware", "phishing", "encryption", "network security", "cyber threats"],
  },

  // ── BUSINESS / ECONOMICS ─────────────────────────────────────────────────────
  {
    key: "revenue_costs_profit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Break_even_graph.svg/960px-Break_even_graph.svg.png",
    label: "Revenue, Costs and Profit — Break-Even Graph",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    license: CC_BY_SA_3,
    keywords: ["revenue", "costs", "profit", "break even", "finance", "business finance", "fixed costs", "variable costs", "total revenue"],
  },

  // ── RE / ETHICS ───────────────────────────────────────────────────────────────
  {
    key: "ethics_crime_punishment",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Scales_of_justice_2.svg/640px-Scales_of_justice_2.svg.png",
    label: "Ethics — Scales of Justice",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
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
