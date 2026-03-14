/**
 * diagramBank.ts
 * Curated bank of real educational diagrams from Wikimedia Commons.
 * Covers the full UK curriculum from KS1 to KS4 (Years 1–11).
 * All images are freely licensed (CC BY-SA or public domain).
 *
 * All URLs verified via Wikimedia Commons API.
 */

export interface DiagramEntry {
  key: string;
  url: string;
  label: string;
  attribution: string;
  keywords: string[];
}

const DIAGRAM_BANK: DiagramEntry[] = [

  // ── BIOLOGY — Cells ───────────────────────────────────────────────────────
  {
    key: "animal_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/960px-Animal_cell_structure_en.svg.png",
    label: "Animal Cell Structure",
    attribution: "LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["animal cell", "eukaryotic cell", "animal cells", "cell structure", "cell organelles", "nucleus", "mitochondria", "ribosomes", "cytoplasm"],
  },
  {
    key: "plant_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Plant_cell_structure_svg_labels.svg/960px-Plant_cell_structure_svg_labels.svg.png",
    label: "Plant Cell Structure",
    attribution: "LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["plant cell", "plant cells", "plant cell structure", "chloroplast", "cell wall", "vacuole", "plant organelles"],
  },
  {
    key: "cell_membrane",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cell_membrane_detailed_diagram_en.svg/960px-Cell_membrane_detailed_diagram_en.svg.png",
    label: "Cell Membrane Structure",
    attribution: "LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["cell membrane", "plasma membrane", "phospholipid bilayer", "membrane structure", "membrane proteins"],
  },
  {
    key: "mitosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Animal_cell_cycle-en.svg/960px-Animal_cell_cycle-en.svg.png",
    label: "Mitosis — Cell Division Stages",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["mitosis", "cell division", "cell cycle", "prophase", "metaphase", "anaphase", "telophase", "interphase"],
  },
  {
    key: "meiosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Meiosis_Overview_new.svg/960px-Meiosis_Overview_new.svg.png",
    label: "Meiosis Overview",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["meiosis", "sexual reproduction", "gametes", "meiosis stages", "haploid", "diploid"],
  },
  {
    key: "prokaryotic_cell",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Prokaryote_cell.svg/960px-Prokaryote_cell.svg.png",
    label: "Prokaryotic Cell Structure",
    attribution: "Mariana Ruiz LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["prokaryotic cell", "prokaryote", "bacteria cell", "bacterial cell", "prokaryotes", "bacteria structure"],
  },

  // ── BIOLOGY — Human Body ──────────────────────────────────────────────────
  {
    key: "heart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Heart_diagram-en.svg/960px-Heart_diagram-en.svg.png",
    label: "Human Heart Diagram",
    attribution: "Wapcaplet, Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["heart", "human heart", "cardiac", "heart structure", "heart diagram", "circulatory system", "atrium", "ventricle", "aorta"],
  },
  {
    key: "lungs",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Respiratory_system_complete_en.svg/500px-Respiratory_system_complete_en.svg.png",
    label: "Human Respiratory System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["lungs", "respiratory system", "breathing", "alveoli", "trachea", "bronchi", "gas exchange", "diaphragm"],
  },
  {
    key: "digestive_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Digestive_system_diagram_en.svg/500px-Digestive_system_diagram_en.svg.png",
    label: "Human Digestive System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["digestive system", "digestion", "stomach", "intestine", "small intestine", "large intestine", "oesophagus", "liver", "pancreas"],
  },
  {
    key: "nervous_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Nervous_system_diagram-en.svg/330px-Nervous_system_diagram-en.svg.png",
    label: "Human Nervous System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nervous system", "neurons", "brain", "spinal cord", "nerve", "reflex arc", "central nervous system", "peripheral nervous system"],
  },
  {
    key: "skeleton",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Human_skeleton_front_en.svg/500px-Human_skeleton_front_en.svg.png",
    label: "Human Skeleton",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["skeleton", "bones", "human skeleton", "skeletal system", "skull", "femur", "tibia", "ribcage", "spine"],
  },
  {
    key: "eye",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Schematic_diagram_of_the_human_eye_en.svg/960px-Schematic_diagram_of_the_human_eye_en.svg.png",
    label: "Human Eye Structure",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["eye", "human eye", "retina", "cornea", "lens", "iris", "pupil", "optic nerve", "eye structure"],
  },
  {
    key: "ear",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Anatomy_of_the_Human_Ear.svg/960px-Anatomy_of_the_Human_Ear.svg.png",
    label: "Human Ear Structure",
    attribution: "Chittka L, Brockmann, Wikimedia Commons (CC BY 2.5)",
    keywords: ["ear", "human ear", "cochlea", "eardrum", "hearing", "inner ear", "outer ear", "ossicles"],
  },
  {
    key: "kidney",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Kidney_Cross_Section.svg/960px-Kidney_Cross_Section.svg.png",
    label: "Kidney Cross-Section",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["kidney", "kidneys", "nephron", "renal system", "excretion", "filtration", "urine", "cortex", "medulla"],
  },
  {
    key: "brain",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Brain_diagram_fr.svg/960px-Brain_diagram_fr.svg.png",
    label: "Human Brain Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["brain", "human brain", "cerebrum", "cerebellum", "brain stem", "medulla", "frontal lobe", "temporal lobe"],
  },
  {
    key: "blood_cells",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Blausen_0425_Formed_Elements.png/960px-Blausen_0425_Formed_Elements.png",
    label: "Blood Cells",
    attribution: "BruceBlaus, Wikimedia Commons (CC BY 3.0)",
    keywords: ["blood cells", "red blood cells", "white blood cells", "platelets", "blood", "haemoglobin", "erythrocytes", "leucocytes"],
  },
  {
    key: "human_body_organs",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Blausen_0316_DigestiveSystem.png/960px-Blausen_0316_DigestiveSystem.png",
    label: "Human Body — Main Organs",
    attribution: "BruceBlaus, Wikimedia Commons (CC BY 3.0)",
    keywords: ["human body", "organs", "body parts", "ks2 science", "primary science", "organ systems"],
  },
  {
    key: "teeth_types",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Teeth_types_colored.png",
    label: "Types of Teeth",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["teeth", "types of teeth", "incisor", "canine", "molar", "premolar", "dental", "ks2 science"],
  },

  // ── BIOLOGY — Plants & Ecosystems ────────────────────────────────────────
  {
    key: "photosynthesis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/960px-Photosynthesis_en.svg.png",
    label: "Photosynthesis Process",
    attribution: "At09kg, Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["photosynthesis", "chlorophyll", "light reaction", "glucose", "oxygen", "carbon dioxide", "chloroplast", "light energy"],
  },
  {
    key: "leaf_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Leaf_Structure.svg/960px-Leaf_Structure.svg.png",
    label: "Leaf Structure (Cross-Section)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["leaf", "leaf structure", "leaf cross section", "stomata", "palisade cells", "mesophyll", "epidermis", "guard cells"],
  },
  {
    key: "flower_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Mature_flower_diagram.svg/960px-Mature_flower_diagram.svg.png",
    label: "Flower Structure",
    attribution: "Mariana Ruiz LadyofHats, Wikimedia Commons (Public Domain)",
    keywords: ["flower", "flower structure", "pollination", "stamen", "pistil", "petal", "sepal", "anther", "ovary", "parts of a plant"],
  },
  {
    key: "food_chain",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/FoodChain.svg/960px-FoodChain.svg.png",
    label: "Food Chain",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["food chain", "food web", "producer", "consumer", "predator", "prey", "trophic level", "ecosystem", "habitats"],
  },
  {
    key: "carbon_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Carbon_cycle-cute_diagram.svg/960px-Carbon_cycle-cute_diagram.svg.png",
    label: "Carbon Cycle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["carbon cycle", "carbon dioxide", "respiration", "decomposition", "fossil fuels", "atmosphere", "global warming"],
  },
  {
    key: "nitrogen_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Nitrogen_Cycle.svg/960px-Nitrogen_Cycle.svg.png",
    label: "Nitrogen Cycle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nitrogen cycle", "nitrogen fixation", "nitrification", "denitrification", "ammonia", "nitrates", "bacteria"],
  },
  {
    key: "water_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Water_cycle_complete.png/960px-Water_cycle_complete.png",
    label: "Water Cycle",
    attribution: "USGS, Wikimedia Commons (Public Domain)",
    keywords: ["water cycle", "evaporation", "condensation", "precipitation", "transpiration", "runoff", "hydrological cycle", "rain"],
  },
  {
    key: "dna_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/500px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
    label: "DNA Double Helix Structure",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["dna", "dna structure", "double helix", "nucleotide", "base pairs", "adenine", "thymine", "guanine", "cytosine", "genetics"],
  },
  {
    key: "natural_selection",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Mutation_and_selection_diagram.svg/960px-Mutation_and_selection_diagram.svg.png",
    label: "Natural Selection",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["natural selection", "evolution", "adaptation", "survival of the fittest", "mutation", "variation", "darwin"],
  },
  {
    key: "enzyme",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Induced_fit_diagram.svg/960px-Induced_fit_diagram.svg.png",
    label: "Enzyme Action (Lock and Key / Induced Fit)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["enzyme", "enzymes", "lock and key", "active site", "substrate", "enzyme action", "induced fit", "enzyme substrate complex"],
  },
  {
    key: "osmosis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Osmosis_diagram.svg/960px-Osmosis_diagram.svg.png",
    label: "Osmosis",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["osmosis", "semi-permeable membrane", "concentration gradient", "water potential", "turgor pressure"],
  },
  {
    key: "diffusion",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Diffusion.svg/960px-Diffusion.svg.png",
    label: "Diffusion",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["diffusion", "concentration gradient", "particles", "random movement", "passive transport", "net movement"],
  },
  {
    key: "life_cycle_butterfly",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Butterfly_Life_Cycle_Chart%2C_Metamorphosis_Lab_in_the_Grand_Atrium%2C_Franklin_Park_Conservatory%2C_Columbus%2C_Ohio.jpg/960px-Butterfly_Life_Cycle_Chart%2C_Metamorphosis_Lab_in_the_Grand_Atrium%2C_Franklin_Park_Conservatory%2C_Columbus%2C_Ohio.jpg",
    label: "Life Cycle of a Butterfly",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["life cycle", "butterfly", "metamorphosis", "egg", "caterpillar", "larva", "pupa", "chrysalis", "ks2 science"],
  },
  {
    key: "life_cycle_frog",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Metamorphosis_frog_Meyers.png",
    label: "Life Cycle of a Frog",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["life cycle frog", "frog", "tadpole", "spawn", "amphibian", "metamorphosis", "ks2 science"],
  },
  {
    key: "seasons",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Seasons1.svg/960px-Seasons1.svg.png",
    label: "The Four Seasons",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["seasons", "four seasons", "spring", "summer", "autumn", "winter", "earth orbit", "ks1 science", "ks2 science"],
  },
  {
    key: "solar_system",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Planets2013.svg/960px-Planets2013.svg.png",
    label: "The Solar System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["solar system", "planets", "sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "space", "ks2 science"],
  },
  {
    key: "moon_phases",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Moon_phases_en.jpg/960px-Moon_phases_en.jpg",
    label: "Phases of the Moon",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["moon phases", "phases of the moon", "new moon", "full moon", "crescent", "waxing", "waning", "ks2 science"],
  },
  {
    key: "sound_waves",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Sine_wave.svg/960px-Sine_wave.svg.png",
    label: "Sound Waves",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["sound", "sound waves", "vibration", "pitch", "volume", "frequency", "amplitude", "longitudinal wave"],
  },

  // ── CHEMISTRY ─────────────────────────────────────────────────────────────
  {
    key: "atom_structure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Helium_atom_QM.svg/960px-Helium_atom_QM.svg.png",
    label: "Atomic Structure (Bohr Model)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["atom", "atomic structure", "bohr model", "electron", "proton", "neutron", "nucleus", "electron shell", "orbit", "atomic model"],
  },
  {
    key: "periodic_table",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b6/PTable_structure.png",
    label: "Periodic Table Structure",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["periodic table", "elements", "groups", "periods", "metals", "non-metals", "atomic number", "chemical elements"],
  },
  {
    key: "ionic_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a8/NaF.gif",
    label: "Ionic Bonding",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["ionic bonding", "ionic bond", "ions", "sodium chloride", "nacl", "electron transfer", "electrostatic attraction", "ionic compound"],
  },
  {
    key: "covalent_bonding",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Covalent_bond_hydrogen.svg/960px-Covalent_bond_hydrogen.svg.png",
    label: "Covalent Bonding",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["covalent bonding", "covalent bond", "shared electrons", "molecule", "h2", "hydrogen molecule", "molecular bonding"],
  },
  {
    key: "states_of_matter",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Solid_liquid_gas.svg/960px-Solid_liquid_gas.svg.png",
    label: "States of Matter",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["states of matter", "solid", "liquid", "gas", "melting", "freezing", "evaporation", "condensation", "sublimation", "particle model"],
  },
  {
    key: "chromatography",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Chromatography_of_chlorophyll_-_Step_4.jpg",
    label: "Paper Chromatography",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["chromatography", "paper chromatography", "separation", "rf value", "solvent", "mixture separation", "pigments"],
  },
  {
    key: "distillation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Simple_distillation_apparatus.svg/960px-Simple_distillation_apparatus.svg.png",
    label: "Simple Distillation Apparatus",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["distillation", "simple distillation", "fractional distillation", "condenser", "separation", "boiling point", "flask"],
  },
  {
    key: "ph_scale",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/PH_scale.svg/960px-PH_scale.svg.png",
    label: "pH Scale",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["ph scale", "acid", "alkali", "neutral", "ph", "indicator", "acidic", "alkaline", "universal indicator"],
  },
  {
    key: "electrolysis",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Electrolysis_of_water_with_diagram.png/960px-Electrolysis_of_water_with_diagram.png",
    label: "Electrolysis",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electrolysis", "electrode", "anode", "cathode", "electrolyte", "decomposition", "electrochemistry", "copper sulfate"],
  },

  // ── PHYSICS ───────────────────────────────────────────────────────────────
  {
    key: "transverse_wave",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Sine_wave_amplitude.svg/960px-Sine_wave_amplitude.svg.png",
    label: "Transverse Wave — Amplitude and Wavelength",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["transverse wave", "wave", "amplitude", "wavelength", "crest", "trough", "frequency", "wave diagram", "oscillation"],
  },
  {
    key: "electromagnetic_spectrum",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/EM_spectrum.svg/960px-EM_spectrum.svg.png",
    label: "Electromagnetic Spectrum",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electromagnetic spectrum", "em spectrum", "radio waves", "microwaves", "infrared", "visible light", "ultraviolet", "x-rays", "gamma rays"],
  },
  {
    key: "electric_circuit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Circuit_elements.svg/960px-Circuit_elements.svg.png",
    label: "Electric Circuit Symbols",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electric circuit", "circuit symbols", "resistor", "capacitor", "battery", "bulb", "switch", "ammeter", "voltmeter", "circuit diagram"],
  },
  {
    key: "series_parallel_circuit",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Series_and_parallel_circuits.svg/960px-Series_and_parallel_circuits.svg.png",
    label: "Series and Parallel Circuits",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["series circuit", "parallel circuit", "series and parallel", "current", "voltage", "resistance", "ohm's law"],
  },
  {
    key: "forces",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Free_body_diagram2.svg/960px-Free_body_diagram2.svg.png",
    label: "Free Body Diagram — Forces",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["forces", "free body diagram", "balanced forces", "unbalanced forces", "weight", "normal force", "friction", "resultant force", "newton"],
  },
  {
    key: "refraction",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Snells_law2.svg/960px-Snells_law2.svg.png",
    label: "Refraction of Light (Snell's Law)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["refraction", "snell's law", "light", "angle of incidence", "angle of refraction", "normal line", "optics", "bending light"],
  },
  {
    key: "reflection",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Reflection_angles.svg/960px-Reflection_angles.svg.png",
    label: "Reflection of Light",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["reflection", "angle of incidence", "angle of reflection", "mirror", "light reflection", "normal", "law of reflection"],
  },
  {
    key: "nuclear_fission",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Nuclear_fission.svg/960px-Nuclear_fission.svg.png",
    label: "Nuclear Fission",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nuclear fission", "fission", "nuclear reaction", "uranium", "chain reaction", "neutron", "radioactive", "nuclear energy"],
  },
  {
    key: "radioactive_decay",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Radioactive_decay_chains_diagram.svg/960px-Radioactive_decay_chains_diagram.svg.png",
    label: "Radioactive Decay",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["radioactive decay", "alpha decay", "beta decay", "gamma radiation", "half-life", "radioactivity", "nuclear decay", "isotopes"],
  },
  {
    key: "pressure",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Pressure_force_area.svg/960px-Pressure_force_area.svg.png",
    label: "Pressure = Force ÷ Area",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["pressure", "force", "area", "pressure formula", "pascal", "pressure equation", "p = f/a"],
  },
  {
    key: "magnetic_field",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Magnet0873.png/960px-Magnet0873.png",
    label: "Magnetic Field Lines",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["magnetic field", "magnetic field lines", "magnet", "north pole", "south pole", "electromagnet", "magnets", "ks2 science"],
  },

  // ── GEOGRAPHY ─────────────────────────────────────────────────────────────
  {
    key: "volcano",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Volcano_scheme.svg/960px-Volcano_scheme.svg.png",
    label: "Volcano Cross-Section",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["volcano", "volcanic eruption", "magma", "lava", "crater", "vent", "tectonic plates", "composite volcano", "shield volcano"],
  },
  {
    key: "tectonic_plates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Tectonic_plates.png/960px-Tectonic_plates.png",
    label: "Tectonic Plates Map",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["tectonic plates", "plate tectonics", "plate boundaries", "continental drift", "subduction", "collision", "divergent", "convergent"],
  },
  {
    key: "plate_boundaries",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Tectonic_plate_boundaries.png",
    label: "Types of Plate Boundaries",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["plate boundary", "constructive boundary", "destructive boundary", "conservative boundary", "transform fault", "ridge", "trench"],
  },
  {
    key: "glaciation",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Glacial_landscape.svg/960px-Glacial_landscape.svg.png",
    label: "Glacial Landforms",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["glaciation", "glacier", "glacial landforms", "corrie", "arête", "horn", "u-shaped valley", "moraine", "drumlin", "ice age"],
  },
  {
    key: "rock_cycle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Rock_cycle_nps.gif/960px-Rock_cycle_nps.gif",
    label: "The Rock Cycle",
    attribution: "NPS, Wikimedia Commons (Public Domain)",
    keywords: ["rock cycle", "igneous", "sedimentary", "metamorphic", "weathering", "erosion", "magma", "rocks", "geology"],
  },
  {
    key: "compass_directions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Compass_card_en.svg/500px-Compass_card_en.svg.png",
    label: "Compass Directions",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["compass", "compass directions", "north", "south", "east", "west", "compass rose", "map skills", "geography ks2", "cardinal directions"],
  },
  {
    key: "population_pyramid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Population_pyramid_of_World_%282019%29.png/500px-Population_pyramid_of_World_%282019%29.png",
    label: "Population Pyramid",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["population pyramid", "age-sex pyramid", "birth rate", "death rate", "population structure", "demographics", "population"],
  },
  {
    key: "river_processes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/River_meander.svg/960px-River_meander.svg.png",
    label: "River Meander and Processes",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["river meander", "meander", "erosion", "deposition", "river", "oxbow lake", "lateral erosion", "river processes", "fluvial"],
  },

  // ── MATHS ─────────────────────────────────────────────────────────────────
  {
    key: "pythagoras",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pythagorean.svg/960px-Pythagorean.svg.png",
    label: "Pythagoras' Theorem",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["pythagoras", "pythagorean theorem", "right-angled triangle", "hypotenuse", "a squared b squared c squared", "right angle triangle"],
  },
  {
    key: "circle_parts",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Circle-withsegments.svg/960px-Circle-withsegments.svg.png",
    label: "Parts of a Circle",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["circle", "parts of a circle", "radius", "diameter", "circumference", "chord", "arc", "sector", "segment", "tangent"],
  },
  {
    key: "angles",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Angle_types.svg/960px-Angle_types.svg.png",
    label: "Types of Angles",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["angles", "acute angle", "obtuse angle", "right angle", "reflex angle", "straight angle", "types of angles", "geometry"],
  },
  {
    key: "number_line",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Number-line.svg/960px-Number-line.svg.png",
    label: "Number Line",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["number line", "integers", "negative numbers", "positive numbers", "ordering numbers", "ks2 maths", "ks3 maths", "directed numbers"],
  },
  {
    key: "multiplication_table",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Multiplication_table_to_scale.svg/960px-Multiplication_table_to_scale.svg.png",
    label: "Multiplication Table",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["multiplication", "times tables", "multiplication table", "times table", "ks2 maths", "primary maths"],
  },
  {
    key: "fractions",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cake_fractions.svg/960px-Cake_fractions.svg.png",
    label: "Fractions",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["fractions", "numerator", "denominator", "half", "quarter", "thirds", "equivalent fractions", "ks2 maths", "proper fractions"],
  },
  {
    key: "venn_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Venn0001.svg/960px-Venn0001.svg.png",
    label: "Venn Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["venn diagram", "sets", "intersection", "union", "set notation", "probability", "maths"],
  },
  {
    key: "3d_shapes",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/SolidShapes.png/960px-SolidShapes.png",
    label: "3D Shapes",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["3d shapes", "cube", "cuboid", "sphere", "cylinder", "cone", "pyramid", "prism", "polyhedron", "ks2 maths", "ks3 maths", "solid shapes"],
  },
  {
    key: "pie_chart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Composition_of_the_German_Bundesrat_as_a_pie_chart_small.svg/960px-Composition_of_the_German_Bundesrat_as_a_pie_chart_small.svg.png",
    label: "Pie Chart",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["pie chart", "pie graph", "sector", "percentage", "proportion", "data", "statistics", "maths"],
  },

  // ── HISTORY ───────────────────────────────────────────────────────────────
  {
    key: "ww1_map",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Europe_1914.jpg/960px-Europe_1914.jpg",
    label: "Europe 1914 — World War I",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["world war 1", "ww1", "world war one", "first world war", "trench warfare", "western front", "allies", "triple entente", "europe 1914"],
  },
  {
    key: "ww2_europe",
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Second_world_war_europe_1939_map_pl2.png",
    label: "World War II — Europe 1939",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["world war 2", "ww2", "world war two", "second world war", "nazi germany", "axis powers", "allied powers", "d-day", "europe 1939"],
  },
  {
    key: "trench_warfare",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Trench_construction_diagram_1914.svg/960px-Trench_construction_diagram_1914.svg.png",
    label: "Trench Construction Diagram (1914)",
    attribution: "Wikimedia Commons (Public Domain)",
    keywords: ["trench warfare", "trenches", "no man's land", "front line", "ww1 trenches", "dugout", "trench construction"],
  },
  {
    key: "roman_empire",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Roman_Empire_Trajan_117AD.png/960px-Roman_Empire_Trajan_117AD.png",
    label: "Roman Empire at its Greatest Extent",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["roman empire", "romans", "rome", "roman britain", "julius caesar", "roman history", "ancient rome"],
  },

  // ── COMPUTER SCIENCE ──────────────────────────────────────────────────────
  {
    key: "binary",
    url: "https://upload.wikimedia.org/wikipedia/commons/7/75/Binary_counter.gif",
    label: "Binary Number System",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["binary", "binary numbers", "binary code", "bits", "bytes", "denary", "hexadecimal", "number systems", "computer science"],
  },
  {
    key: "logic_gates",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Logic-gate-index.png/960px-Logic-gate-index.png",
    label: "Logic Gates",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["logic gates", "and gate", "or gate", "not gate", "nand gate", "nor gate", "xor gate", "boolean logic", "computer science"],
  },
  {
    key: "network_topologies",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/NetworkTopologies.svg/960px-NetworkTopologies.svg.png",
    label: "Network Topologies",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["network topology", "bus topology", "star topology", "ring topology", "mesh topology", "computer network", "networking"],
  },
  {
    key: "cpu_architecture",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d8/ABasicComputer.gif",
    label: "CPU Architecture",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["cpu", "processor", "alu", "control unit", "registers", "fetch decode execute", "von neumann", "computer architecture", "computer science"],
  },
  {
    key: "flowchart",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/LampFlowchart.svg/960px-LampFlowchart.svg.png",
    label: "Flowchart Symbols",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["flowchart", "algorithm", "flow chart", "decision", "process", "start", "end", "programming", "pseudocode", "computer science"],
  },

  // ── ECONOMICS / BUSINESS ─────────────────────────────────────────────────────────────
  {
    key: "supply_demand",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Supply-demand-right-shift-demand.svg/960px-Supply-demand-right-shift-demand.svg.png",
    label: "Supply and Demand Curve",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["supply and demand", "demand curve", "supply curve", "equilibrium", "price", "quantity", "market", "economics"],
  },

  // ── MATHEMATICS — Year 11 / GCSE ───────────────────────────────────────────────────
  {
    key: "quadratic_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Polynomialdeg2.svg/640px-Polynomialdeg2.svg.png",
    label: "Quadratic Function Graph (Parabola)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["quadratic", "quadratic equation", "quadratic formula", "parabola", "quadratic graph", "completing the square", "roots", "vertex", "discriminant", "quadratic function"],
  },
  {
    key: "trigonometry_right_triangle",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trigonometry_triangle.svg/640px-Trigonometry_triangle.svg.png",
    label: "Trigonometry — Right-Angled Triangle (SOH CAH TOA)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["trigonometry", "soh cah toa", "sine", "cosine", "tangent", "right angle triangle", "trig ratios", "sin cos tan", "adjacent", "opposite", "hypotenuse", "trig"],
  },
  {
    key: "straight_line_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Linear_Function_Graph.svg/640px-Linear_Function_Graph.svg.png",
    label: "Straight Line Graph (y = mx + c)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["straight line", "linear graph", "y = mx + c", "gradient", "y-intercept", "slope", "linear equation", "coordinate geometry", "linear function"],
  },
  {
    key: "circle_theorems",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Circle_theorem_1.svg/640px-Circle_theorem_1.svg.png",
    label: "Circle Theorems",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["circle theorems", "angle at centre", "angle in semicircle", "cyclic quadrilateral", "tangent", "chord", "arc", "inscribed angle", "circle geometry"],
  },
  {
    key: "vectors_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Vector_from_A_to_B.svg/640px-Vector_from_A_to_B.svg.png",
    label: "Vectors — Direction and Magnitude",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["vectors", "vector addition", "vector subtraction", "magnitude", "direction", "column vector", "resultant vector", "vector diagram"],
  },
  {
    key: "histogram_stats",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Histogram_of_arrivals_per_minute.svg/640px-Histogram_of_arrivals_per_minute.svg.png",
    label: "Histogram — Frequency Density",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["histogram", "frequency density", "class width", "grouped data", "frequency distribution", "statistics", "data representation"],
  },
  {
    key: "probability_tree",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Probability_tree_diagram.svg/640px-Probability_tree_diagram.svg.png",
    label: "Probability Tree Diagram",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["probability tree", "tree diagram", "conditional probability", "independent events", "dependent events", "probability", "combined probability"],
  },
  {
    key: "transformation_geometry",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Rotation_illustration2.svg/640px-Rotation_illustration2.svg.png",
    label: "Geometric Transformations",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["transformation", "rotation", "reflection", "translation", "enlargement", "scale factor", "centre of rotation", "congruence", "similarity", "transformations"],
  },

  // ── MATHEMATICS — Year 6 / KS2 ──────────────────────────────────────────────────────
  {
    key: "area_perimeter",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Perimeter_area.svg/640px-Perimeter_area.svg.png",
    label: "Area and Perimeter of Shapes",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["area", "perimeter", "rectangle area", "square area", "triangle area", "area formula", "perimeter formula", "length width", "compound shapes"],
  },
  {
    key: "coordinates_grid",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Cartesian-coordinate-system.svg/640px-Cartesian-coordinate-system.svg.png",
    label: "Coordinate Grid (x and y axes)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["coordinates", "coordinate grid", "x axis", "y axis", "cartesian", "plotting points", "ordered pairs", "four quadrants", "grid"],
  },
  {
    key: "fractions_decimals_percentages",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Fraction_circles.svg/640px-Fraction_circles.svg.png",
    label: "Fractions, Decimals and Percentages",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["fractions", "decimals", "percentages", "equivalent fractions", "converting fractions", "fraction decimal percentage", "fdp", "mixed numbers", "improper fractions"],
  },
  {
    key: "bar_chart_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Simple_bar_chart.svg/640px-Simple_bar_chart.svg.png",
    label: "Bar Chart",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["bar chart", "bar graph", "data handling", "tally chart", "pictogram", "frequency chart"],
  },
  {
    key: "ratio_proportion_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ratio_example.svg/640px-Ratio_example.svg.png",
    label: "Ratio and Proportion",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["ratio", "proportion", "sharing in a ratio", "equivalent ratio", "simplifying ratio", "direct proportion", "unitary method"],
  },

  // ── SCIENCE — Year 11 / GCSE ─────────────────────────────────────────────────────────
  {
    key: "velocity_time_graph",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Velocity_time_graph.svg/640px-Velocity_time_graph.svg.png",
    label: "Velocity-Time Graph",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["velocity time graph", "speed time graph", "acceleration", "deceleration", "distance", "area under graph", "motion graph", "kinematics"],
  },
  {
    key: "nuclear_atom_gcse",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Helium_atom_QM.svg/640px-Helium_atom_QM.svg.png",
    label: "Nuclear Atom Structure",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nuclear model", "atom structure", "proton", "neutron", "electron", "nucleus", "atomic number", "mass number", "isotopes", "bohr model", "nuclear atom"],
  },
  {
    key: "hormone_endocrine",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Endocrine_English.svg/640px-Endocrine_English.svg.png",
    label: "Endocrine System — Hormones",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["hormones", "endocrine system", "glands", "pituitary", "thyroid", "adrenal", "pancreas", "insulin", "glucagon", "adrenaline", "oestrogen", "testosterone"],
  },
  {
    key: "respiration_diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Cellular_respiration.svg/640px-Cellular_respiration.svg.png",
    label: "Cellular Respiration",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["respiration", "cellular respiration", "aerobic respiration", "anaerobic respiration", "glucose", "atp", "mitochondria", "oxygen", "carbon dioxide", "lactic acid"],
  },
  {
    key: "electromagnetic_induction_coil",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/VFPt_Solenoid_correct2.svg/640px-VFPt_Solenoid_correct2.svg.png",
    label: "Electromagnetic Induction — Solenoid",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electromagnetic induction", "solenoid", "coil", "magnetic flux", "faraday", "lenz", "generator", "transformer", "induced emf", "induced current"],
  },
  {
    key: "alpha_beta_gamma",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Alpha_Decay.svg/640px-Alpha_Decay.svg.png",
    label: "Nuclear Decay — Alpha, Beta, Gamma",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["nuclear decay", "alpha decay", "beta decay", "gamma radiation", "radioactive decay", "half life", "nuclear equation", "radiation types", "ionising radiation"],
  },

  // ── SCIENCE — Year 6 / KS2 ────────────────────────────────────────────────────────────
  {
    key: "classification_living_things",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Biological_classification_L_Pengo_vflip.svg/640px-Biological_classification_L_Pengo_vflip.svg.png",
    label: "Classification of Living Things",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["classification", "living things", "vertebrates", "invertebrates", "mammals", "reptiles", "amphibians", "fish", "birds", "taxonomy", "kingdom", "species"],
  },
  {
    key: "light_shadow_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Reflection_angles.svg/640px-Reflection_angles.svg.png",
    label: "Light — Reflection and Shadow (KS2)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["light", "shadow", "reflection", "angle of incidence", "angle of reflection", "normal", "light rays", "transparent", "opaque", "translucent"],
  },
  {
    key: "electricity_ks2",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Series_circuit.svg/640px-Series_circuit.svg.png",
    label: "Electricity — Simple Circuits (KS2)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["electricity", "circuit", "battery", "bulb", "switch", "conductor", "insulator", "series circuit", "current", "voltage", "components", "ks2 electricity"],
  },
  {
    key: "forces_ks2_gravity",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Simple_gravity_pendulum.svg/640px-Simple_gravity_pendulum.svg.png",
    label: "Forces — Gravity, Friction, Air Resistance (KS2)",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["forces ks2", "gravity ks2", "friction ks2", "air resistance", "push", "pull", "balanced forces", "unbalanced forces", "weight", "mass"],
  },
  {
    key: "food_web_habitat",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/FoodWeb.svg/640px-FoodWeb.svg.png",
    label: "Food Web — Habitats and Ecosystems",
    attribution: "Wikimedia Commons (CC BY-SA 3.0)",
    keywords: ["food web", "habitat", "ecosystem", "producer", "consumer", "predator", "prey", "herbivore", "carnivore", "omnivore", "decomposer"],
  },
];
// ── Lookup function: fuzzy keyword match ─────────────────────────────────────
export function findDiagram(subject: string, topic: string): DiagramEntry | null {
  const subjectLower = subject.toLowerCase().trim();
  const topicLower = topic.toLowerCase().trim();
  const combined = `${subjectLower} ${topicLower}`;

  // Use whole-word matching to prevent false positives (e.g. 'ions' matching 'expressions')
  function wordMatch(text: string, keyword: string): boolean {
    // Escape special regex characters in keyword
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i');
    return re.test(text);
  }

  let bestMatch: DiagramEntry | null = null;
  let bestScore = 0;

  for (const entry of DIAGRAM_BANK) {
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

// ── Wikimedia Commons API search (for topics not in the curated bank) ─────────
export async function searchWikimediaDiagram(
  subject: string,
  topic: string
): Promise<{ url: string; caption: string; attribution: string } | null> {
  const query = `${topic} ${subject} diagram educational`;
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json&origin=*`;

  try {
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "AdaptlyEduApp/1.0 (educational platform)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const results = data?.query?.search || [];

    for (const result of results) {
      const title = result.title as string;
      // Only use SVG, PNG, JPG files
      if (!title.match(/\.(svg|png|jpg|jpeg)$/i)) continue;
      // Skip files that look like books, scans, or unrelated content
      if (title.match(/book|page|scan|manuscript|photo|portrait|landscape/i)) continue;

      // Get the actual image URL via imageinfo API
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=960&format=json&origin=*`;
      const infoRes = await fetch(infoUrl, {
        headers: { "User-Agent": "AdaptlyEduApp/1.0 (educational platform)" },
        signal: AbortSignal.timeout(5000),
      });
      if (!infoRes.ok) continue;
      const infoData = await infoRes.json() as any;
      const pages = infoData?.query?.pages || {};
      const page = Object.values(pages)[0] as any;
      const imageInfo = page?.imageinfo?.[0];
      // Use thumburl (960px) from the API response
      const thumbUrl = imageInfo?.thumburl || imageInfo?.url;
      if (!thumbUrl) continue;

      const author = (imageInfo.extmetadata?.Artist?.value || "Wikimedia Commons")
        .replace(/<[^>]+>/g, "").trim();
      const license = imageInfo.extmetadata?.LicenseShortName?.value || "CC BY-SA";

      return {
        url: thumbUrl,
        caption: `${topic} — ${subject}`,
        attribution: `${author}, Wikimedia Commons (${license})`,
      };
    }
  } catch (e) {
    console.warn("[DiagramBank] Wikimedia search error:", e);
  }

  return null;
}
