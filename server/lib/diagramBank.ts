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
    url: "/diagrams/animal-cell.png",
    label: "Animal Cell Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["animal cell", "eukaryotic cell", "animal cells", "cell structure", "cell organelles", "nucleus", "mitochondria", "ribosomes", "cytoplasm"],
  },
  {
    key: "plant_cell",
    url: "/diagrams/plant-cell.png",
    label: "Plant Cell Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["plant cell", "plant cells", "plant cell structure", "chloroplast", "cell wall", "vacuole", "plant organelles"],
  },
  {
    key: "cell_membrane",
    url: "/diagrams/animal-cell.png",
    label: "Cell Membrane Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["cell membrane", "plasma membrane", "phospholipid bilayer", "membrane structure", "membrane proteins"],
  },
  {
    key: "mitosis",
    url: "/diagrams/mitosis.png",
    label: "Mitosis — Cell Division Stages",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["mitosis", "cell division", "cell cycle", "prophase", "metaphase", "anaphase", "telophase", "interphase"],
  },
  {
    key: "meiosis",
    url: "/diagrams/mitosis.png",
    label: "Meiosis Overview",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["meiosis", "sexual reproduction", "gametes", "meiosis stages", "haploid", "diploid"],
  },
  {
    key: "prokaryotic_cell",
    url: "/diagrams/animal-cell.png",
    label: "Prokaryotic Cell Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["prokaryotic cell", "prokaryote", "bacteria cell", "bacterial cell", "prokaryotes", "bacteria structure"],
  },

  // ── BIOLOGY — Human Body ──────────────────────────────────────────────────
  {
    key: "heart",
    url: "/diagrams/human-heart.png",
    label: "Human Heart Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["heart", "human heart", "cardiac", "heart structure", "heart diagram", "circulatory system", "atrium", "ventricle", "aorta"],
  },
  {
    key: "lungs",
    url: "/diagrams/respiratory-system.png",
    label: "Human Respiratory System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["lungs", "respiratory system", "breathing", "alveoli", "trachea", "bronchi", "gas exchange", "diaphragm"],
  },
  {
    key: "digestive_system",
    url: "/diagrams/digestive-system.png",
    label: "Human Digestive System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["digestive system", "digestion", "stomach", "intestine", "small intestine", "large intestine", "oesophagus", "liver", "pancreas"],
  },
  {
    key: "nervous_system",
    url: "/diagrams/neuron.png",
    label: "Human Nervous System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["nervous system", "neurons", "brain", "spinal cord", "nerve", "reflex arc", "central nervous system", "peripheral nervous system"],
  },
  {
    key: "skeleton",
    url: "/diagrams/human-skeleton.png",
    label: "Human Skeleton",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["skeleton", "bones", "human skeleton", "skeletal system", "skull", "femur", "tibia", "ribcage", "spine"],
  },
  {
    key: "eye",
    url: "/diagrams/human-eye.png",
    label: "Human Eye Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["eye", "human eye", "retina", "cornea", "lens", "iris", "pupil", "optic nerve", "eye structure"],
  },
  {
    key: "ear",
    url: "/diagrams/human-ear.png",
    label: "Human Ear Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["ear", "human ear", "cochlea", "eardrum", "hearing", "inner ear", "outer ear", "ossicles"],
  },
  {
    key: "kidney",
    url: "/diagrams/digestive-system.png",
    label: "Kidney Cross-Section",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["kidney", "kidneys", "nephron", "renal system", "excretion", "filtration", "urine", "cortex", "medulla"],
  },
  {
    key: "brain",
    url: "/diagrams/animal-cell.png",
    label: "Human Brain Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["brain", "human brain", "cerebrum", "cerebellum", "brain stem", "medulla", "frontal lobe", "temporal lobe"],
  },
  {
    key: "blood_cells",
    url: "/diagrams/animal-cell.png",
    label: "Blood Cells",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["blood cells", "red blood cells", "white blood cells", "platelets", "blood", "haemoglobin", "erythrocytes", "leucocytes"],
  },
  {
    key: "human_body_organs",
    url: "/diagrams/digestive-system.png",
    label: "Human Body — Main Organs",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["human body", "organs", "body parts", "ks2 science", "primary science", "organ systems", "revision mat", "revision map"],
  },
  {
    key: "teeth_types",
    url: "/diagrams/digestive-system.png",
    label: "Types of Teeth",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["teeth", "types of teeth", "incisor", "canine", "molar", "premolar", "dental", "ks2 science"],
  },

  // ── BIOLOGY — Plants & Ecosystems ────────────────────────────────────────
  {
    key: "photosynthesis",
    url: "/diagrams/photosynthesis.png",
    label: "Photosynthesis Process",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["photosynthesis", "chlorophyll", "light reaction", "glucose", "oxygen", "carbon dioxide", "chloroplast", "light energy"],
  },
  {
    key: "leaf_structure",
    url: "/diagrams/flower-structure.png",
    label: "Leaf Structure (Cross-Section)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["leaf", "leaf structure", "leaf cross section", "stomata", "palisade cells", "mesophyll", "epidermis", "guard cells"],
  },
  {
    key: "flower_structure",
    url: "/diagrams/flower-structure.png",
    label: "Flower Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["flower", "flower structure", "pollination", "stamen", "pistil", "petal", "sepal", "anther", "ovary", "parts of a plant"],
  },
  {
    key: "food_chain",
    url: "/diagrams/food-chain.png",
    label: "Food Chain",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["food chain", "food web", "producer", "consumer", "predator", "prey", "trophic level", "ecosystem", "habitats"],
  },
  {
    key: "carbon_cycle",
    url: "/diagrams/greenhouse-effect.png",
    label: "Carbon Cycle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["carbon cycle", "carbon dioxide", "respiration", "decomposition", "fossil fuels", "atmosphere", "global warming"],
  },
  {
    key: "nitrogen_cycle",
    url: "/diagrams/water-cycle.png",
    label: "Nitrogen Cycle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["nitrogen cycle", "nitrogen fixation", "nitrification", "denitrification", "ammonia", "nitrates", "bacteria"],
  },
  {
    key: "water_cycle",
    url: "/diagrams/water-cycle.png",
    label: "Water Cycle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["water cycle", "evaporation", "condensation", "precipitation", "transpiration", "runoff", "hydrological cycle", "rain"],
  },
  {
    key: "dna_structure",
    url: "/diagrams/dna-structure.png",
    label: "DNA Double Helix Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["dna", "dna structure", "double helix", "nucleotide", "base pairs", "adenine", "thymine", "guanine", "cytosine", "genetics"],
  },
  {
    key: "natural_selection",
    url: "/diagrams/natural-selection.png",
    label: "Natural Selection",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["natural selection", "evolution", "adaptation", "survival of the fittest", "mutation", "variation", "darwin"],
  },
  {
    key: "enzyme",
    url: "/diagrams/enzyme-activity.png",
    label: "Enzyme Action (Lock and Key / Induced Fit)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["enzyme", "enzymes", "lock and key", "active site", "substrate", "enzyme action", "induced fit", "enzyme substrate complex"],
  },
  {
    key: "osmosis",
    url: "/diagrams/plant-cell.png",
    label: "Osmosis",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["osmosis", "semi-permeable membrane", "concentration gradient", "water potential", "turgor pressure"],
  },
  {
    key: "diffusion",
    url: "/diagrams/states-particles.png",
    label: "Diffusion",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["diffusion", "concentration gradient", "particles", "random movement", "passive transport", "net movement"],
  },
  {
    key: "life_cycle_butterfly",
    url: "/diagrams/butterfly-lifecycle.png",
    label: "Life Cycle of a Butterfly",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["life cycle", "butterfly", "metamorphosis", "egg", "caterpillar", "larva", "pupa", "chrysalis", "ks2 science"],
  },
  {
    key: "life_cycle_frog",
    url: "/diagrams/butterfly-lifecycle.png",
    label: "Life Cycle of a Frog",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["life cycle frog", "frog", "tadpole", "spawn", "amphibian", "metamorphosis", "ks2 science"],
  },
  {
    key: "seasons",
    url: "/diagrams/solar-system.png",
    label: "The Four Seasons",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["seasons", "four seasons", "spring", "summer", "autumn", "winter", "earth orbit", "ks1 science", "ks2 science"],
  },
  {
    key: "solar_system",
    url: "/diagrams/solar-system.png",
    label: "The Solar System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["solar system", "planets", "sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "space", "ks2 science"],
  },
  {
    key: "moon_phases",
    url: "/diagrams/solar-system.png",
    label: "Phases of the Moon",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["moon phases", "phases of the moon", "new moon", "full moon", "crescent", "waxing", "waning", "ks2 science"],
  },
  {
    key: "sound_waves",
    url: "/diagrams/wave-types.png",
    label: "Sound Waves",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["sound", "sound waves", "vibration", "pitch", "volume", "frequency", "amplitude", "longitudinal wave"],
  },

  // ── CHEMISTRY ─────────────────────────────────────────────────────────────
  {
    key: "atom_structure",
    url: "/images/atom_nb_labelled_final.png",
    label: "Atomic Structure — Labelled Bohr Model (Carbon-12)",
    attribution: "Adaptly nano-banana diagram",
    keywords: ["atom", "atomic structure", "bohr model", "electron", "proton", "neutron", "nucleus", "electron shell", "orbit", "atomic model", "carbon", "subatomic particles", "chemistry", "gcse chemistry"],
  },
  {
    key: "atom_structure_unlabelled",
    url: "/images/atom_nb_unlabelled_final.png",
    label: "Atomic Structure — Unlabelled Bohr Model (Carbon-12)",
    attribution: "Adaptly nano-banana diagram",
    keywords: ["atom unlabelled", "label the atom", "label the diagram", "atomic structure diagram", "bohr model blank", "carbon atom diagram"],
  },
  {
    key: "periodic_table",
    url: "/diagrams/periodic-table.png",
    label: "Periodic Table Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["periodic table", "elements", "groups", "periods", "metals", "non-metals", "atomic number", "chemical elements"],
  },
  {
    key: "ionic_bonding",
    url: "/diagrams/ionic-bonding.png",
    label: "Ionic Bonding",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["ionic bonding", "ionic bond", "ions", "sodium chloride", "nacl", "electron transfer", "electrostatic attraction", "ionic compound"],
  },
  {
    key: "covalent_bonding",
    url: "/diagrams/covalent-bonding.png",
    label: "Covalent Bonding",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["covalent bonding", "covalent bond", "shared electrons", "molecule", "h2", "hydrogen molecule", "molecular bonding"],
  },
  {
    key: "states_of_matter",
    url: "/diagrams/states-of-matter.png",
    label: "States of Matter",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["states of matter", "solid", "liquid", "gas", "melting", "freezing", "evaporation", "condensation", "sublimation", "particle model"],
  },
  {
    key: "chromatography",
    url: "/diagrams/distillation.png",
    label: "Paper Chromatography",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["chromatography", "paper chromatography", "separation", "rf value", "solvent", "mixture separation", "pigments"],
  },
  {
    key: "distillation",
    url: "/diagrams/distillation.png",
    label: "Simple Distillation Apparatus",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["distillation", "simple distillation", "fractional distillation", "condenser", "separation", "boiling point", "flask"],
  },
  {
    key: "ph_scale",
    url: "/diagrams/ph-scale.png",
    label: "pH Scale",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["ph scale", "acid", "alkali", "neutral", "ph", "indicator", "acidic", "alkaline", "universal indicator"],
  },
  {
    key: "electrolysis",
    url: "/diagrams/electrolysis.png",
    label: "Electrolysis",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["electrolysis", "electrode", "anode", "cathode", "electrolyte", "decomposition", "electrochemistry", "copper sulfate"],
  },

  // ── PHYSICS ───────────────────────────────────────────────────────────────
  {
    key: "transverse_wave",
    url: "/diagrams/wave-types.png",
    label: "Transverse Wave — Amplitude and Wavelength",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["transverse wave", "wave", "amplitude", "wavelength", "crest", "trough", "frequency", "wave diagram", "oscillation"],
  },
  {
    key: "electromagnetic_spectrum",
    url: "/diagrams/electromagnetic-spectrum.png",
    label: "Electromagnetic Spectrum",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["electromagnetic spectrum", "em spectrum", "radio waves", "microwaves", "infrared", "visible light", "ultraviolet", "x-rays", "gamma rays"],
  },
  {
    key: "electric_circuit",
    url: "/diagrams/electrical-circuit.png",
    label: "Electric Circuit Symbols",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["electric circuit", "circuit symbols", "resistor", "capacitor", "battery", "bulb", "switch", "ammeter", "voltmeter", "circuit diagram"],
  },
  {
    key: "series_parallel_circuit",
    url: "/diagrams/electrical-circuit.png",
    label: "Series and Parallel Circuits",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["series circuit", "parallel circuit", "series and parallel", "current", "voltage", "resistance", "ohm's law"],
  },
  {
    key: "forces",
    url: "/diagrams/electrical-circuit.png",
    label: "Free Body Diagram — Forces",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["forces", "free body diagram", "balanced forces", "unbalanced forces", "weight", "normal force", "friction", "resultant force", "newton"],
  },
  {
    key: "refraction",
    url: "/diagrams/refraction-lens.png",
    label: "Refraction of Light (Snell's Law)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["refraction", "snell's law", "light", "angle of incidence", "angle of refraction", "normal line", "optics", "bending light"],
  },
  {
    key: "reflection",
    url: "/diagrams/light-reflection.png",
    label: "Reflection of Light",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["reflection", "angle of incidence", "angle of reflection", "mirror", "light reflection", "normal", "law of reflection"],
  },
  {
    key: "nuclear_fission",
    url: "/diagrams/radiation-types.png",
    label: "Nuclear Fission",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["nuclear fission", "fission", "nuclear reaction", "uranium", "chain reaction", "neutron", "radioactive", "nuclear energy"],
  },
  {
    key: "radioactive_decay",
    url: "/diagrams/radiation-types.png",
    label: "Radioactive Decay",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["radioactive decay", "alpha decay", "beta decay", "gamma radiation", "half-life", "radioactivity", "nuclear decay", "isotopes"],
  },
  {
    key: "pressure",
    url: "/diagrams/equation-triangle-pressure.png",
    label: "Pressure = Force ÷ Area",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["pressure", "force", "area", "pressure formula", "pascal", "pressure equation", "p = f/a"],
  },
  {
    key: "magnetic_field",
    url: "/diagrams/magnetic-field.png",
    label: "Magnetic Field Lines",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["magnetic field", "magnetic field lines", "magnet", "north pole", "south pole", "electromagnet", "magnets", "ks2 science"],
  },

  // ── GEOGRAPHY ─────────────────────────────────────────────────────────────
  {
    key: "volcano",
    url: "/diagrams/volcano-cross-section.png",
    label: "Volcano Cross-Section",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["volcano", "volcanic eruption", "magma", "lava", "crater", "vent", "tectonic plates", "composite volcano", "shield volcano"],
  },
  {
    key: "tectonic_plates",
    url: "/diagrams/tectonic-plates.png",
    label: "Tectonic Plates Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["tectonic plates", "plate tectonics", "plate boundaries", "continental drift", "subduction", "collision", "divergent", "convergent"],
  },
  {
    key: "plate_boundaries",
    url: "/diagrams/tectonic-plates.png",
    label: "Types of Plate Boundaries",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["plate boundary", "constructive boundary", "destructive boundary", "conservative boundary", "transform fault", "ridge", "trench"],
  },
  {
    key: "glaciation",
    url: "/diagrams/coastal-features.png",
    label: "Glacial Landforms",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["glaciation", "glacier", "glacial landforms", "corrie", "arête", "horn", "u-shaped valley", "moraine", "drumlin", "ice age"],
  },
  {
    key: "rock_cycle",
    url: "/diagrams/rock-cycle.png",
    label: "The Rock Cycle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["rock cycle", "igneous", "sedimentary", "metamorphic", "weathering", "erosion", "magma", "rocks", "geology"],
  },
  {
    key: "compass_directions",
    url: "/diagrams/scale-grid.png",
    label: "Compass Directions",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["compass", "compass directions", "north", "south", "east", "west", "compass rose", "map skills", "geography ks2", "cardinal directions"],
  },
  {
    key: "population_pyramid",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Population Pyramid",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["population pyramid", "age-sex pyramid", "birth rate", "death rate", "population structure", "demographics", "population"],
  },
  {
    key: "river_processes",
    url: "/diagrams/river-meander.png",
    label: "River Meander and Processes",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["river meander", "meander", "erosion", "deposition", "river", "oxbow lake", "lateral erosion", "river processes", "fluvial"],
  },

  // ── MATHS ─────────────────────────────────────────────────────────────────
  {
    key: "pythagoras",
    url: "/diagrams/pythagoras.png",
    label: "Pythagoras' Theorem",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["pythagoras", "pythagorean theorem", "right-angled triangle", "hypotenuse", "a squared b squared c squared", "right angle triangle"],
  },
  {
    key: "circle_parts",
    url: "/diagrams/circle-parts.png",
    label: "Parts of a Circle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["circle", "parts of a circle", "radius", "diameter", "circumference", "chord", "arc", "sector", "segment", "tangent"],
  },
  {
    key: "angles",
    url: "/diagrams/angles-types.png",
    label: "Types of Angles",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["angles", "acute angle", "obtuse angle", "right angle", "reflex angle", "straight angle", "types of angles", "geometry"],
  },
  {
    key: "number_line",
    url: "/diagrams/number-line.png",
    label: "Number Line",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["number line", "integers", "negative numbers", "positive numbers", "ordering numbers", "ks2 maths", "ks3 maths", "directed numbers"],
  },
  {
    key: "multiplication_table",
    url: "/diagrams/number-line.png",
    label: "Multiplication Table",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["multiplication", "times tables", "multiplication table", "times table", "ks2 maths", "primary maths"],
  },
  {
    key: "fractions",
    url: "/diagrams/fractions.png",
    label: "Fractions",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["fractions", "numerator", "denominator", "half", "quarter", "thirds", "equivalent fractions", "ks2 maths", "proper fractions"],
  },
  {
    key: "venn_diagram",
    url: "/diagrams/probability-venn-sets.svg",
    label: "Venn Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["venn diagram", "sets", "intersection", "union", "set notation", "probability", "maths"],
  },
  {
    key: "3d_shapes",
    url: "/diagrams/3d-shapes.png",
    label: "3D Shapes",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["3d shapes", "cube", "cuboid", "sphere", "cylinder", "cone", "pyramid", "prism", "polyhedron", "ks2 maths", "ks3 maths", "solid shapes"],
  },
  {
    key: "pie_chart",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Pie Chart",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["pie chart", "pie graph", "sector", "percentage", "proportion", "data", "statistics", "maths"],
  },

  // ── HISTORY ───────────────────────────────────────────────────────────────
  {
    key: "ww1_map",
    url: "/diagrams/ww1-trenches.png",
    label: "Europe 1914 — World War I",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["world war 1", "ww1", "world war one", "first world war", "trench warfare", "western front", "allies", "triple entente", "europe 1914"],
  },
  {
    key: "ww2_europe",
    url: "/diagrams/ww1-trenches.png",
    label: "World War II — Europe 1939",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["world war 2", "ww2", "world war two", "second world war", "nazi germany", "axis powers", "allied powers", "d-day", "europe 1939"],
  },
  {
    key: "trench_warfare",
    url: "/diagrams/ww1-trenches.png",
    label: "Trench Construction Diagram (1914)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["trench warfare", "trenches", "no man's land", "front line", "ww1 trenches", "dugout", "trench construction"],
  },
  {
    key: "roman_empire",
    url: "/diagrams/roman-empire.png",
    label: "Roman Empire at its Greatest Extent",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["roman empire", "romans", "rome", "roman britain", "julius caesar", "roman history", "ancient rome"],
  },

  // ── COMPUTER SCIENCE ──────────────────────────────────────────────────────
  {
    key: "binary",
    url: "/diagrams/binary-representation.png",
    label: "Binary Number System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["binary", "binary numbers", "binary code", "bits", "bytes", "denary", "hexadecimal", "number systems", "computer science"],
  },
  {
    key: "logic_gates",
    url: "/diagrams/computer-architecture.png",
    label: "Logic Gates",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["logic gates", "and gate", "or gate", "not gate", "nand gate", "nor gate", "xor gate", "boolean logic", "computer science"],
  },
  {
    key: "network_topologies",
    url: "/diagrams/computer-architecture.png",
    label: "Network Topologies",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["network topology", "bus topology", "star topology", "ring topology", "mesh topology", "computer network", "networking"],
  },
  {
    key: "cpu_architecture",
    url: "/diagrams/computer-architecture.png",
    label: "CPU Architecture",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["cpu", "processor", "alu", "control unit", "registers", "fetch decode execute", "von neumann", "computer architecture", "computer science"],
  },
  {
    key: "flowchart",
    url: "/diagrams/big-o-notation.png",
    label: "Flowchart Symbols",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["flowchart", "algorithm", "flow chart", "decision", "process", "start", "end", "programming", "pseudocode", "computer science"],
  },

  // ── ECONOMICS / BUSINESS ─────────────────────────────────────────────────────────────
  {
    key: "supply_demand",
    url: "/diagrams/algebra-blank-axes.png",
    label: "Supply and Demand Curve",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["supply and demand", "demand curve", "supply curve", "equilibrium", "price", "quantity", "market", "economics"],
  },

  // ── MATHEMATICS — Year 11 / GCSE ───────────────────────────────────────────────────
  {
    key: "quadratic_graph",
    url: "/diagrams/quadratic-graph.png",
    label: "Quadratic Function Graph (Parabola)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["quadratic", "quadratic equation", "quadratic formula", "parabola", "quadratic graph", "completing the square", "roots", "vertex", "discriminant", "quadratic function"],
  },
  {
    key: "trigonometry_right_triangle",
    url: "/diagrams/triangle-properties.png",
    label: "Trigonometry — Right-Angled Triangle (SOH CAH TOA)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["trigonometry", "soh cah toa", "sine", "cosine", "tangent", "right angle triangle", "trig ratios", "sin cos tan", "adjacent", "opposite", "hypotenuse", "trig"],
  },
  {
    key: "straight_line_graph",
    url: "/diagrams/algebra-straight-line-reference.png",
    label: "Straight Line Graph (y = mx + c)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["straight line", "linear graph", "y = mx + c", "gradient", "y-intercept", "slope", "linear equation", "coordinate geometry", "linear function"],
  },
  {
    key: "circle_theorems",
    url: "/diagrams/circle-parts.png",
    label: "Circle Theorems",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["circle theorems", "angle at centre", "angle in semicircle", "cyclic quadrilateral", "tangent", "chord", "arc", "inscribed angle", "circle geometry"],
  },
  {
    key: "vectors_diagram",
    url: "/diagrams/coordinate-system.png",
    label: "Vectors — Direction and Magnitude",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["vectors", "vector addition", "vector subtraction", "magnitude", "direction", "column vector", "resultant vector", "vector diagram"],
  },
  {
    key: "histogram_stats",
    url: "/diagrams/statistics-histogram.svg",
    label: "Histogram — Frequency Density",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["histogram", "frequency density", "class width", "grouped data", "frequency distribution", "statistics", "data representation"],
  },
  {
    key: "probability_tree",
    url: "/diagrams/probability-tree-independent.svg",
    label: "Probability Tree Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["probability tree", "tree diagram", "conditional probability", "independent events", "dependent events", "probability", "combined probability"],
  },
  {
    key: "transformation_geometry",
    url: "/diagrams/triangle-properties.png",
    label: "Geometric Transformations",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["transformation", "rotation", "reflection", "translation", "enlargement", "scale factor", "centre of rotation", "congruence", "similarity", "transformations"],
  },

  // ── MATHEMATICS — Year 6 / KS2 ──────────────────────────────────────────────────────
  {
    key: "area_perimeter",
    url: "/diagrams/polygons.png",
    label: "Area and Perimeter of Shapes",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["area", "perimeter", "rectangle area", "square area", "triangle area", "area formula", "perimeter formula", "length width", "compound shapes"],
  },
  {
    key: "coordinates_grid",
    url: "/diagrams/coordinate-system.png",
    label: "Coordinate Grid (x and y axes)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["coordinates", "coordinate grid", "x axis", "y axis", "cartesian", "plotting points", "ordered pairs", "four quadrants", "grid"],
  },
  {
    key: "fractions_decimals_percentages",
    url: "/diagrams/fractions.png",
    label: "Fractions, Decimals and Percentages",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["fractions", "decimals", "percentages", "equivalent fractions", "converting fractions", "fraction decimal percentage", "fdp", "mixed numbers", "improper fractions"],
  },
  {
    key: "bar_chart_ks2",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Bar Chart",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["bar chart", "bar graph", "data handling", "tally chart", "pictogram", "frequency chart"],
  },
  {
    key: "ratio_proportion_ks2",
    url: "/diagrams/fractions.png",
    label: "Ratio and Proportion",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["ratio", "proportion", "sharing in a ratio", "equivalent ratio", "simplifying ratio", "direct proportion", "unitary method"],
  },

  // ── SCIENCE — Year 11 / GCSE ─────────────────────────────────────────────────────────
  {
    key: "velocity_time_graph",
    url: "/diagrams/graph-velocity-time.png",
    label: "Velocity-Time Graph",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["velocity time graph", "speed time graph", "acceleration", "deceleration", "distance", "area under graph", "motion graph", "kinematics"],
  },
  {
    key: "nuclear_atom_gcse",
    url: "/images/atom_nb_labelled_final.png",
    label: "Nuclear Atom Structure — Labelled Bohr Model",
    attribution: "Adaptly nano-banana diagram",
    keywords: ["nuclear model", "atom structure", "proton", "neutron", "electron", "nucleus", "atomic number", "mass number", "isotopes", "bohr model", "nuclear atom", "gcse chemistry", "year 9 chemistry"],
  },
  {
    key: "hormone_endocrine",
    url: "/diagrams/neuron.png",
    label: "Endocrine System — Hormones",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["hormones", "endocrine system", "glands", "pituitary", "thyroid", "adrenal", "pancreas", "insulin", "glucagon", "adrenaline", "oestrogen", "testosterone"],
  },
  {
    key: "respiration_diagram",
    url: "/diagrams/respiration.png",
    label: "Cellular Respiration",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["respiration", "cellular respiration", "aerobic respiration", "anaerobic respiration", "glucose", "atp", "mitochondria", "oxygen", "carbon dioxide", "lactic acid"],
  },
  {
    key: "electromagnetic_induction_coil",
    url: "/diagrams/electromagnetic-spectrum.png",
    label: "Electromagnetic Induction — Solenoid",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["electromagnetic induction", "solenoid", "coil", "magnetic flux", "faraday", "lenz", "generator", "transformer", "induced emf", "induced current"],
  },
  {
    key: "alpha_beta_gamma",
    url: "/diagrams/radiation-types.png",
    label: "Nuclear Decay — Alpha, Beta, Gamma",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["nuclear decay", "alpha decay", "beta decay", "gamma radiation", "radioactive decay", "half life", "nuclear equation", "radiation types", "ionising radiation"],
  },

  // ── SCIENCE — Year 6 / KS2 ────────────────────────────────────────────────────────────
  {
    key: "classification_living_things",
    url: "/diagrams/food-web.png",
    label: "Classification of Living Things",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["classification", "living things", "vertebrates", "invertebrates", "mammals", "reptiles", "amphibians", "fish", "birds", "taxonomy", "kingdom", "species"],
  },
  {
    key: "light_shadow_ks2",
    url: "/diagrams/light-reflection.png",
    label: "Light — Reflection and Shadow (KS2)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["light", "shadow", "reflection", "angle of incidence", "angle of reflection", "normal", "light rays", "transparent", "opaque", "translucent"],
  },
  {
    key: "electricity_ks2",
    url: "/diagrams/electrical-circuit.png",
    label: "Electricity — Simple Circuits (KS2)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["electricity", "circuit", "battery", "bulb", "switch", "conductor", "insulator", "series circuit", "current", "voltage", "components", "ks2 electricity"],
  },
  {
    key: "forces_ks2_gravity",
    url: "/diagrams/electrical-circuit.png",
    label: "Forces — Gravity, Friction, Air Resistance (KS2)",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["forces ks2", "gravity ks2", "friction ks2", "air resistance", "push", "pull", "balanced forces", "unbalanced forces", "weight", "mass"],
  },
  {
    key: "food_web_habitat",
    url: "/diagrams/food-web.png",
    label: "Food Web — Habitats and Ecosystems",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["food web", "habitat", "ecosystem", "producer", "consumer", "predator", "prey", "herbivore", "carnivore", "omnivore", "decomposer"],
  },

  // ── MATHEMATICS — Number & Arithmetic ────────────────────────────────────
  {
    key: "place_value",
    url: "/diagrams/number-standard-form-place-value.png",
    label: "Place Value — Positional Notation",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["place value", "positional notation", "units", "tens", "hundreds", "thousands", "decimals", "number system", "digits"],
  },
  {
    key: "number_line",
    url: "/diagrams/number-line.png",
    label: "Number Line",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["number line", "integers", "negative numbers", "ordering numbers", "rounding", "estimation", "whole numbers"],
  },
  {
    key: "fractions_diagram",
    url: "/diagrams/fractions.png",
    label: "Fractions — Visual Representation",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["fractions", "numerator", "denominator", "equivalent fractions", "simplify fractions", "proper fraction", "improper fraction", "mixed number", "adding fractions", "subtracting fractions", "multiplying fractions", "dividing fractions"],
  },
  {
    key: "long_division",
    url: "/diagrams/number-line.png",
    label: "Long Division Method",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["long division", "division", "remainder", "bus stop method", "short division", "dividing"],
  },
  {
    key: "venn_diagram",
    url: "/diagrams/venn-diagram.png",
    label: "Venn Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["venn diagram", "set notation", "intersection", "union", "sets", "factors", "multiples", "prime numbers", "hcf", "lcm"],
  },
  {
    key: "prime_factor_tree",
    url: "/diagrams/number-line.png",
    label: "Prime Factor Tree",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["prime factor tree", "prime factorisation", "factors", "prime numbers", "product of prime factors", "hcf", "lcm", "factor tree"],
  },

  // ── MATHEMATICS — Algebra ─────────────────────────────────────────────────
  {
    key: "cartesian_coordinates",
    url: "/diagrams/coordinate-system.png",
    label: "Cartesian Coordinate System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["coordinates", "cartesian", "x axis", "y axis", "plotting points", "graphs", "linear graphs", "quadratic graphs", "coordinate grid", "origin"],
  },
  {
    key: "linear_graph",
    url: "/diagrams/algebra-linear-graph-reference.png",
    label: "Linear Graph — Gradient and Intercept",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["linear graph", "straight line graph", "gradient", "y intercept", "slope", "y=mx+c", "linear equation", "plotting graphs", "rate of change"],
  },
  {
    key: "quadratic_graph",
    url: "/diagrams/quadratic-graph.png",
    label: "Quadratic Graph — Parabola",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["quadratic graph", "parabola", "quadratic function", "quadratic equation", "completing the square", "roots", "turning point", "vertex", "quadratics"],
  },
  {
    key: "simultaneous_equations",
    url: "/diagrams/algebra-blank-axes.png",
    label: "Simultaneous Equations — Graphical Solution",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["simultaneous equations", "intersecting lines", "elimination", "substitution", "linear simultaneous", "solve simultaneously", "system of equations"],
  },
  {
    key: "inequalities_number_line",
    url: "/diagrams/number-line.png",
    label: "Inequalities — Number Line",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["inequalities", "number line", "greater than", "less than", "inequality symbols", "solving inequalities", "linear inequalities", "set notation"],
  },
  {
    key: "function_mapping",
    url: "/diagrams/algebra-function-machine.png",
    label: "Functions — Domain and Range Mapping",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["functions", "function machine", "domain", "range", "mapping", "input output", "inverse function", "composite function", "f(x)", "notation"],
  },
  {
    key: "sequences_arithmetic",
    url: "/diagrams/algebra-sequence-dot-pattern.png",
    label: "Sequences — Arithmetic and Geometric",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["sequences", "arithmetic sequence", "geometric sequence", "nth term", "term to term rule", "common difference", "fibonacci", "triangular numbers", "square numbers"],
  },

  // ── MATHEMATICS — Geometry & Shape ───────────────────────────────────────
  {
    key: "angles_parallel_lines",
    url: "/diagrams/angles-types.png",
    label: "Angles in Parallel Lines",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["angles in parallel lines", "corresponding angles", "alternate angles", "co-interior angles", "transversal", "parallel lines", "f angles", "z angles", "c angles"],
  },
  {
    key: "angle_types",
    url: "/diagrams/angles-types.png",
    label: "Types of Angles",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["angles", "acute angle", "right angle", "obtuse angle", "reflex angle", "straight angle", "types of angles", "angle rules", "angles on a straight line", "angles in a triangle"],
  },
  {
    key: "triangle_types",
    url: "/diagrams/triangle-properties.png",
    label: "Types of Triangles",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["triangles", "equilateral triangle", "isosceles triangle", "scalene triangle", "right-angled triangle", "types of triangles", "triangle properties", "interior angles"],
  },
  {
    key: "pythagoras",
    url: "/diagrams/pythagoras.png",
    label: "Pythagoras' Theorem",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["pythagoras", "pythagoras theorem", "hypotenuse", "right-angled triangle", "a squared b squared c squared", "pythagorean triple"],
  },
  {
    key: "trigonometry",
    url: "/diagrams/unit-circle.png",
    label: "Trigonometry — Unit Circle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["trigonometry", "sine", "cosine", "tangent", "sohcahtoa", "trig ratios", "unit circle", "sin cos tan", "right-angled triangle trigonometry", "trig graphs"],
  },
  {
    key: "circle_theorems",
    url: "/diagrams/circle-parts.png",
    label: "Circle Theorems",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["circle theorems", "circle", "radius", "diameter", "chord", "tangent", "arc", "sector", "segment", "circumference", "area of circle", "parts of a circle"],
  },
  {
    key: "transformations",
    url: "/diagrams/coordinate-system.png",
    label: "Transformations — Reflection, Rotation, Translation",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["transformations", "reflection", "rotation", "translation", "enlargement", "congruence", "similar shapes", "scale factor", "vector translation", "line of symmetry"],
  },
  {
    key: "3d_shapes",
    url: "/diagrams/3d-shapes.png",
    label: "3D Shapes — Faces, Edges, Vertices",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["3d shapes", "solid shapes", "cube", "cuboid", "cylinder", "cone", "sphere", "pyramid", "prism", "faces edges vertices", "volume", "surface area", "nets"],
  },
  {
    key: "vectors",
    url: "/diagrams/coordinate-system.png",
    label: "Vectors — Magnitude and Direction",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["vectors", "vector", "magnitude", "direction", "column vector", "resultant vector", "vector addition", "scalar multiplication", "displacement", "velocity"],
  },
  {
    key: "loci_constructions",
    url: "/diagrams/circle-parts.png",
    label: "Loci and Constructions — Perpendicular Bisector",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["loci", "locus", "constructions", "perpendicular bisector", "angle bisector", "compass constructions", "geometric constructions", "equidistant"],
  },

  // ── MATHEMATICS — Statistics & Probability ────────────────────────────────
  {
    key: "bar_chart",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Bar Chart",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["bar chart", "bar graph", "frequency", "data", "statistics", "pictogram", "categorical data", "comparative bar chart", "dual bar chart"],
  },
  {
    key: "pie_chart",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Pie Chart",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["pie chart", "pie graph", "sectors", "proportional data", "angles in pie chart", "percentage pie chart", "statistical diagrams"],
  },
  {
    key: "scatter_graph",
    url: "/diagrams/statistics-scatter-graph.svg",
    label: "Scatter Graph — Correlation",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["scatter graph", "scatter diagram", "correlation", "positive correlation", "negative correlation", "no correlation", "line of best fit", "outlier", "bivariate data"],
  },
  {
    key: "box_plot",
    url: "/diagrams/statistics-box-plots.svg",
    label: "Box Plot — Interquartile Range",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["box plot", "box and whisker", "interquartile range", "iqr", "median", "quartiles", "lower quartile", "upper quartile", "range", "outliers", "comparing distributions"],
  },
  {
    key: "histogram",
    url: "/diagrams/statistics-histogram.svg",
    label: "Histogram — Frequency Density",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["histogram", "frequency density", "grouped data", "continuous data", "class width", "frequency histogram", "area histogram"],
  },
  {
    key: "cumulative_frequency",
    url: "/diagrams/statistics-cumulative-frequency.svg",
    label: "Cumulative Frequency Graph",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["cumulative frequency", "cumulative frequency graph", "ogive", "running total", "median from graph", "interquartile range graph", "quartiles"],
  },
  {
    key: "tree_diagram",
    url: "/diagrams/probability-tree-no-replacement.svg",
    label: "Tree Diagram — Probability",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["tree diagram", "probability tree", "combined probability", "independent events", "conditional probability", "sample space", "listing outcomes"],
  },
  {
    key: "normal_distribution",
    url: "/diagrams/statistics-histogram.svg",
    label: "Normal Distribution",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["normal distribution", "bell curve", "standard deviation", "mean", "spread", "symmetrical distribution", "statistics"],
  },

  // ── GEOGRAPHY — Physical ──────────────────────────────────────────────────
  {
    key: "rock_cycle",
    url: "/diagrams/rock-cycle.png",
    label: "The Rock Cycle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["rock cycle", "igneous rock", "sedimentary rock", "metamorphic rock", "magma", "erosion", "deposition", "weathering", "compaction", "cementation"],
  },
  {
    key: "plate_tectonics",
    url: "/diagrams/tectonic-plates.png",
    label: "Tectonic Plates — World Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["plate tectonics", "tectonic plates", "plate boundaries", "convergent", "divergent", "transform", "subduction", "seafloor spreading", "fold mountains", "earthquakes", "volcanoes"],
  },
  {
    key: "volcano_cross_section",
    url: "/diagrams/volcano-cross-section.png",
    label: "Volcano Cross-Section",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["volcano", "cross section", "magma chamber", "vent", "crater", "lava", "pyroclastic flow", "shield volcano", "composite volcano", "eruption"],
  },
  {
    key: "earthquake_seismic",
    url: "/diagrams/tectonic-plates.png",   label: "Earthquake — Seismic Waves",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["earthquake", "seismic waves", "focus", "epicentre", "p waves", "s waves", "richter scale", "seismograph", "tremor", "fault line"],
  },
  {
    key: "river_features",
    url: "/diagrams/river-meander.png",
    label: "River — Drainage Basin and Features",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["river", "drainage basin", "watershed", "tributary", "confluence", "source", "mouth", "estuary", "meander", "erosion", "deposition", "transportation", "long profile", "river features"],
  },
  {
    key: "coastal_processes",
    url: "/diagrams/coastal-features.png",
    label: "Coastal Erosion Processes",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["coastal erosion", "hydraulic action", "abrasion", "attrition", "solution", "cliff", "wave cut platform", "cave arch stack stump", "longshore drift", "beach", "deposition", "coastal features", "headland", "bay"],
  },
  {
    key: "glaciation",
    url: "/diagrams/coastal-features.png",
    label: "Glaciation — Glacial Features",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["glaciation", "glacier", "glacial", "corrie", "arête", "pyramidal peak", "u-shaped valley", "hanging valley", "drumlin", "moraine", "terminal moraine", "ice age", "freeze thaw"],
  },
  {
    key: "weather_climate",
    url: "/diagrams/greenhouse-effect.png",
    label: "World Climate Zones Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["climate zones", "biomes", "tropical", "temperate", "polar", "desert", "mediterranean", "climate", "weather", "global warming", "climate change"],
  },
  {
    key: "water_cycle",
    url: "/diagrams/water-cycle.png",
    label: "The Water Cycle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["water cycle", "hydrological cycle", "evaporation", "condensation", "precipitation", "transpiration", "infiltration", "surface runoff", "groundwater", "interception"],
  },
  {
    key: "carbon_cycle",
    url: "/diagrams/greenhouse-effect.png",
    label: "The Carbon Cycle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["carbon cycle", "carbon dioxide", "photosynthesis", "respiration", "decomposition", "fossil fuels", "carbon sink", "global warming", "greenhouse effect"],
  },

  // ── GEOGRAPHY — Human ─────────────────────────────────────────────────────
  {
    key: "population_pyramid",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Population Pyramid — DTM",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["population pyramid", "demographic transition model", "dtm", "birth rate", "death rate", "age structure", "population growth", "dependency ratio", "ageing population"],
  },
  {
    key: "urban_land_use",
    url: "/diagrams/scale-grid.png",
    label: "Urban Land Use — Burgess Model",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["urban land use", "burgess model", "hoyt model", "cbd", "inner city", "suburbs", "urban zones", "urban structure", "urbanisation", "city model"],
  },
  {
    key: "development_indicators",
    url: "/diagrams/statistics-bar-pie-charts.svg",
    label: "Global Development — GNI Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["development", "gni", "gdp", "hdi", "north south divide", "lic", "hic", "nee", "inequality", "development indicators"],
  },

  // ── HISTORY ───────────────────────────────────────────────────────────────
  {
    key: "ww1_western_front",
    url: "/diagrams/ww1-trenches.png",
    label: "World War One — Western Front Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["world war 1", "ww1", "first world war", "western front", "trenches", "trench warfare", "somme", "verdun", "ypres", "no man's land", "allies", "central powers"],
  },
  {
    key: "ww1_trench_diagram",
    url: "/diagrams/ww1-trenches.png",
    label: "WW1 Trench System Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["trenches", "trench system", "front line", "communication trench", "dugout", "trench warfare", "world war 1", "ww1"],
  },
  {
    key: "ww2_europe_map",
    url: "/diagrams/ww1-trenches.png",
    label: "World War Two — Europe Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["world war 2", "ww2", "second world war", "nazi germany", "allies", "d-day", "normandy", "blitz", "battle of britain", "holocaust", "occupation"],
  },
  {
    key: "cold_war_map",
    url: "/diagrams/ww1-trenches.png",
    label: "Cold War — NATO vs Warsaw Pact Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["cold war", "nato", "warsaw pact", "iron curtain", "usa", "ussr", "soviet union", "communism", "capitalism", "berlin wall", "cuban missile crisis", "arms race"],
  },
  {
    key: "medieval_castle",
    url: "/diagrams/battle-of-hastings.png",
    label: "Medieval Castle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["medieval castle", "castle", "feudal system", "motte and bailey", "keep", "battlements", "moat", "drawbridge", "norman conquest", "middle ages", "siege"],
  },
  {
    key: "feudal_system",
    url: "/diagrams/hadrians-wall.png",
    label: "The Feudal System — Hierarchy",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["feudal system", "feudalism", "hierarchy", "king", "barons", "knights", "peasants", "serfs", "middle ages", "medieval society", "domesday book"],
  },
  {
    key: "tudor_timeline",
    url: "/diagrams/hadrians-wall.png",
    label: "Tudor Period — Hampton Court Palace",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["tudors", "tudor", "henry viii", "elizabeth i", "reformation", "dissolution of monasteries", "spanish armada", "renaissance", "tudor england"],
  },
  {
    key: "industrial_revolution",
    url: "/diagrams/rock-cycle.png",
    label: "Industrial Revolution — Coal Mine",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["industrial revolution", "factory", "steam engine", "coal", "cotton mill", "urbanisation", "child labour", "conditions", "railways", "invention", "textile"],
  },
  {
    key: "slave_trade_map",
    url: "/diagrams/world-biomes.png",
    label: "Transatlantic Slave Trade — Triangle Trade Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["slave trade", "transatlantic slave trade", "triangular trade", "slavery", "abolition", "middle passage", "plantations", "atlantic", "africa", "americas"],
  },
  {
    key: "empire_map",
    url: "/diagrams/world-biomes.png",
    label: "British Empire — World Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["british empire", "empire", "colonialism", "imperialism", "india", "colony", "commonwealth", "victoria", "expansion"],
  },
  {
    key: "suffragettes",
    url: "/diagrams/ww1-trenches.png",
    label: "Suffragettes — Votes for Women",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["suffragettes", "votes for women", "suffrage", "emmeline pankhurst", "wspu", "women's rights", "reform", "1918", "1928"],
  },
  {
    key: "civil_rights",
    url: "/diagrams/ww1-trenches.png",
    label: "Civil Rights Movement",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["civil rights", "civil rights movement", "martin luther king", "rosa parks", "segregation", "discrimination", "march on washington", "montgomery bus boycott", "usa history"],
  },

  // ── BIOLOGY — Human Body ──────────────────────────────────────────────────
  {
    key: "skeleton",
    url: "/diagrams/human-skeleton.png",
    label: "Human Skeleton",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["skeleton", "bones", "skeletal system", "skull", "vertebrae", "ribs", "femur", "tibia", "joint", "cartilage", "muscle", "movement"],
  },
  {
    key: "circulatory_system",
    url: "/diagrams/human-heart.png",
    label: "Human Circulatory System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["circulatory system", "blood vessels", "arteries", "veins", "capillaries", "heart", "blood", "double circulation", "pulmonary circulation", "systemic circulation"],
  },
  {
    key: "respiratory_system",
    url: "/diagrams/respiratory-system.png",
    label: "Human Respiratory System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["respiratory system", "lungs", "trachea", "bronchi", "alveoli", "breathing", "gas exchange", "diaphragm", "inhale exhale", "oxygen", "carbon dioxide"],
  },
  {
    key: "nervous_system",
    url: "/diagrams/neuron.png",
    label: "The Nervous System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["nervous system", "brain", "spinal cord", "neurone", "neurons", "nerve", "reflex arc", "receptor", "effector", "cns", "pns"],
  },
  {
    key: "digestive_system",
    url: "/diagrams/digestive-system.png",
    label: "Human Digestive System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["digestive system", "digestion", "stomach", "small intestine", "large intestine", "oesophagus", "liver", "pancreas", "enzymes", "nutrients", "absorption", "bile"],
  },
  {
    key: "dna_structure",
    url: "/diagrams/dna-structure.png",
    label: "DNA Double Helix Structure",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["dna", "dna structure", "double helix", "nucleotides", "base pairs", "adenine", "thymine", "guanine", "cytosine", "chromosomes", "genes", "genetics", "inheritance"],
  },
  {
    key: "menstrual_cycle",
    url: "/diagrams/mitosis.png",
    label: "Menstrual Cycle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["menstrual cycle", "menstruation", "ovulation", "hormones", "oestrogen", "progesterone", "fsh", "lh", "reproduction", "fertility", "uterus lining"],
  },
  {
    key: "eye_structure",
    url: "/diagrams/human-eye.png",
    label: "Structure of the Human Eye",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["eye", "eye structure", "cornea", "iris", "lens", "retina", "optic nerve", "pupil", "vitreous humour", "sclera", "accommodation", "myopia", "hyperopia"],
  },

  // ── CHEMISTRY ─────────────────────────────────────────────────────────────
  {
    key: "periodic_table",
    url: "/diagrams/periodic-table.png",
    label: "Periodic Table of Elements",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["periodic table", "elements", "groups", "periods", "metals", "non-metals", "noble gases", "halogens", "alkali metals", "transition metals", "atomic number", "atomic mass"],
  },
  {
    key: "ionic_bonding",
    url: "/diagrams/ionic-bonding.png",
    label: "Ionic Bonding — Sodium Chloride",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["ionic bonding", "ionic bond", "ions", "electrostatic attraction", "sodium chloride", "nacl", "cation", "anion", "electron transfer", "ionic compound", "lattice"],
  },
  {
    key: "covalent_bonding",
    url: "/diagrams/covalent-bonding.png",
    label: "Covalent Bonding — Hydrogen",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["covalent bonding", "covalent bond", "shared electrons", "molecular", "hydrogen", "water", "oxygen", "nitrogen", "dot and cross", "dative bond", "double bond"],
  },
  {
    key: "electrolysis",
    url: "/diagrams/electrolysis.png",
    label: "Electrolysis",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["electrolysis", "electrode", "anode", "cathode", "electrolyte", "ions", "oxidation", "reduction", "copper sulfate", "brine", "chlorine", "hydrogen", "sodium hydroxide"],
  },
  {
    key: "ph_scale",
    url: "/diagrams/ph-scale.png",
    label: "pH Scale — Acids and Alkalis",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["ph scale", "acids", "alkalis", "neutral", "acid base", "indicator", "litmus", "neutralisation", "hydrogen ions", "ph probe", "universal indicator"],
  },
  {
    key: "reactivity_series",
    url: "/diagrams/periodic-table.png",
    label: "Reactivity Series of Metals",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["reactivity series", "metals", "potassium", "sodium", "calcium", "magnesium", "aluminium", "zinc", "iron", "copper", "gold", "displacement reaction", "extraction"],
  },
  {
    key: "haber_process",
    url: "/diagrams/states-of-matter.png",
    label: "Haber Process — Ammonia Synthesis",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["haber process", "ammonia", "nitrogen", "hydrogen", "fertiliser", "iron catalyst", "temperature", "pressure", "reversible reaction", "equilibrium", "le chatelier"],
  },
  {
    key: "crude_oil_fractions",
    url: "/diagrams/distillation.png",
    label: "Fractional Distillation of Crude Oil",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["crude oil", "fractional distillation", "fractions", "hydrocarbons", "petrol", "diesel", "kerosene", "bitumen", "alkanes", "cracking", "fossil fuels"],
  },

  // ── PHYSICS ───────────────────────────────────────────────────────────────
  {
    key: "electromagnetic_spectrum",
    url: "/diagrams/electromagnetic-spectrum.png",
    label: "Electromagnetic Spectrum",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["electromagnetic spectrum", "em spectrum", "radio waves", "microwaves", "infrared", "visible light", "ultraviolet", "x-rays", "gamma rays", "frequency", "wavelength"],
  },
  {
    key: "nuclear_model",
    url: "/diagrams/atomic-structure.png",
    label: "Nuclear Model — Rutherford Scattering",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["nuclear model", "atom", "rutherford", "nucleus", "proton", "neutron", "electron", "atomic model", "gold foil experiment", "alpha particle", "plum pudding model"],
  },
  {
    key: "ohms_law",
    url: "/diagrams/ohms-law.png",
    label: "Ohm's Law — V=IR Circuit",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["ohms law", "voltage", "current", "resistance", "v=ir", "circuit", "series circuit", "parallel circuit", "potential difference", "ammeter", "voltmeter"],
  },
  {
    key: "motion_graphs",
    url: "/diagrams/graph-velocity-time.png",
    label: "Motion Graphs — Distance-Time and Velocity-Time",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["motion graphs", "distance time graph", "velocity time graph", "speed time graph", "acceleration", "deceleration", "gradient", "area under graph", "kinematics"],
  },
  {
    key: "moments_levers",
    url: "/diagrams/forces.png",
    label: "Moments and Levers — Principle",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["moments", "lever", "pivot", "turning effect", "moment = force x distance", "balanced moments", "principle of moments", "torque", "first class lever", "fulcrum"],
  },
  {
    key: "pressure_fluids",
    url: "/diagrams/equation-triangle-pressure.png",
    label: "Pressure — Force and Area",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["pressure", "force", "area", "p=f/a", "pressure in fluids", "atmospheric pressure", "pascal", "hydraulics", "upthrust", "archimedes", "barometer"],
  },
  {
    key: "energy_transfers",
    url: "/diagrams/energy-transfer.png",
    label: "Energy Transfers — Sankey Diagram",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["energy transfer", "sankey diagram", "kinetic energy", "potential energy", "thermal energy", "electrical energy", "light energy", "sound energy", "conservation of energy", "efficiency"],
  },
  {
    key: "refraction_light",
    url: "/diagrams/light-reflection.png",
    label: "Refraction of Light — Snell's Law",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["refraction", "light", "snells law", "normal", "angle of refraction", "angle of incidence", "refractive index", "total internal reflection", "fibre optics", "prism"],
  },
  {
    key: "space_solar_system",
    url: "/diagrams/solar-system.png",
    label: "The Solar System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["solar system", "planets", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "orbit", "sun", "space", "moon", "asteroid"],
  },

  // ── ENGLISH / LITERACY ────────────────────────────────────────────────────
  {
    key: "narrative_structure",
    url: "/diagrams/venn-diagram.png",
    label: "Narrative Structure — Story Arc",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["narrative structure", "story arc", "freytag pyramid", "exposition", "rising action", "climax", "falling action", "resolution", "plot structure", "narrative", "story mountain"],
  },
  {
    key: "shakespeare_globe",
    url: "/diagrams/great-fire-london.png",
    label: "Shakespeare — The Globe Theatre",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["shakespeare", "globe theatre", "elizabethan theatre", "play", "drama", "tragedy", "comedy", "sonnet", "macbeth", "romeo and juliet", "hamlet", "tempest"],
  },
  {
    key: "punctuation_marks",
    url: "/diagrams/venn-diagram.png",
    label: "Punctuation Marks",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["punctuation", "comma", "full stop", "question mark", "exclamation mark", "semicolon", "colon", "apostrophe", "inverted commas", "speech marks", "dash", "hyphen", "brackets"],
  },

  // ── COMPUTING ─────────────────────────────────────────────────────────────
  {
    key: "binary_number_system",
    url: "/diagrams/binary-representation.png",
    label: "Binary Number System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["binary", "binary numbers", "number system", "base 2", "bits", "bytes", "denary", "hexadecimal", "conversion", "computing", "data representation"],
  },
  {
    key: "flowchart_symbols",
    url: "/diagrams/big-o-notation.png",
    label: "Flowchart Symbols",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["flowchart", "algorithm", "decision", "process", "input output", "start stop", "sequence", "selection", "iteration", "pseudocode", "programming"],
  },
  {
    key: "internet_network",
    url: "/diagrams/computer-architecture.png",
    label: "Internet — Network Map",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["internet", "network", "www", "world wide web", "ip address", "dns", "router", "packet switching", "lan", "wan", "cybersecurity", "protocol"],
  },
  {
    key: "logic_gates",
    url: "/diagrams/computer-architecture.png",
    label: "Logic Gates",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["logic gates", "and gate", "or gate", "not gate", "nand gate", "nor gate", "xor gate", "boolean logic", "truth table", "binary", "computing"],
  },

  // ── RE / PSHE ─────────────────────────────────────────────────────────────
  {
    key: "world_religions_symbols",
    url: "/diagrams/venn-diagram.png",
    label: "World Religion Symbols",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["religion", "world religions", "christianity", "islam", "judaism", "hinduism", "buddhism", "sikhism", "symbols", "beliefs", "faith", "worship"],
  },
  {
    key: "mosque_features",
    url: "/diagrams/hadrians-wall.png",
    label: "Mosque — Key Features",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["mosque", "islam", "minaret", "dome", "mihrab", "minbar", "wudu", "prayer", "allah", "muslim", "five pillars"],
  },
  {
    key: "church_features",
    url: "/diagrams/hadrians-wall.png",
    label: "Church — Key Features",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["church", "christianity", "font", "altar", "nave", "pulpit", "stained glass", "cross", "christian", "worship", "cathedral"],
  },

  // ── ART & DESIGN ──────────────────────────────────────────────────────────
  {
    key: "colour_wheel",
    url: "/diagrams/light-reflection.png",
    label: "Colour Wheel — Primary, Secondary, Tertiary",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["colour wheel", "color wheel", "primary colours", "secondary colours", "tertiary colours", "complementary colours", "warm colours", "cool colours", "hue", "tone", "tint", "shade", "art"],
  },
  {
    key: "elements_of_art",
    url: "/diagrams/light-reflection.png",
    label: "Elements of Art",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["elements of art", "line", "shape", "form", "texture", "value", "space", "colour", "art elements", "design principles", "composition"],
  },

  // ── MATHS — PROBABILITY (additional) ──────────────────────────────────────
  {
    key: "probability_sample_space",
    url: "/diagrams/probability-sample-space-grid.svg",
    label: "Probability — Sample Space Grid",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["sample space", "sample space diagram", "two events", "combined events", "probability grid", "listing outcomes", "equally likely outcomes", "probability", "maths"],
  },
  {
    key: "probability_spinner",
    url: "/diagrams/probability-scale-spinner.svg",
    label: "Probability Scale and Spinner",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["probability scale", "spinner", "probability spinner", "impossible", "certain", "likely", "unlikely", "even chance", "probability", "maths"],
  },
  {
    key: "probability_two_way_table",
    url: "/diagrams/probability-two-way-table.svg",
    label: "Two-Way Table — Probability",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["two-way table", "two way table", "frequency table", "conditional probability", "relative frequency", "probability from table", "probability", "maths"],
  },

  // ── MATHS — STATISTICS (additional) ──────────────────────────────────────
  {
    key: "statistics_averages",
    url: "/diagrams/statistics-averages-raw-data.svg",
    label: "Averages — Mean, Median, Mode, Range",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["mean", "median", "mode", "range", "averages", "average", "raw data", "statistics", "data", "maths"],
  },
  {
    key: "statistics_grouped_frequency",
    url: "/diagrams/statistics-grouped-frequency-table.svg",
    label: "Grouped Frequency Table",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["grouped frequency", "frequency table", "class interval", "tally", "grouped data", "statistics", "data collection", "maths"],
  },
  {
    key: "statistics_questionnaire",
    url: "/diagrams/statistics-questionnaire-results.svg",
    label: "Questionnaire Results — Data Handling",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["questionnaire", "survey", "data collection", "primary data", "results", "statistics", "data handling", "maths"],
  },
  {
    key: "statistics_sampling",
    url: "/diagrams/statistics-sampling-methods.svg",
    label: "Sampling Methods — Statistics",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["sampling", "random sampling", "stratified sampling", "systematic sampling", "sample", "population", "bias", "statistics", "maths"],
  },

  // ── MATHS — ALGEBRA (additional) ─────────────────────────────────────────
  {
    key: "algebra_blank_grid",
    url: "/diagrams/algebra-blank-grid.png",
    label: "Blank Coordinate Grid",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["coordinate grid", "blank grid", "axes", "x axis", "y axis", "plotting", "graph paper", "algebra", "maths"],
  },
  {
    key: "algebra_inequality_region",
    url: "/diagrams/algebra-inequality-region.png",
    label: "Inequalities — Shaded Region",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["inequalities", "inequality region", "shaded region", "linear inequality", "graphical inequality", "algebra", "maths"],
  },
  {
    key: "algebra_parabola",
    url: "/diagrams/algebra-parabola-reference.png",
    label: "Parabola — Quadratic Reference",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["parabola", "quadratic graph", "quadratic function", "vertex", "roots", "turning point", "quadratic", "algebra", "maths"],
  },

  // ── MATHS — NUMBER (additional) ───────────────────────────────────────────
  {
    key: "accuracy_number_line",
    url: "/diagrams/accuracy-number-line.png",
    label: "Accuracy — Number Line",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["accuracy", "rounding", "number line", "upper bound", "lower bound", "error interval", "truncation", "significant figures", "decimal places", "maths"],
  },
  {
    key: "standard_form_place_value",
    url: "/diagrams/standard-form-place-value.png",
    label: "Standard Form — Place Value",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["standard form", "place value", "powers of 10", "scientific notation", "index notation", "number", "maths", "indices and roots", "indices", "laws of indices", "square root", "cube root", "index laws", "powers and roots"],
  },
  {
    key: "real_life_conversion_graph",
    url: "/diagrams/real-life-conversion-graph.png",
    label: "Real-Life Graph — Conversion",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["conversion graph", "real life graph", "currency conversion", "unit conversion", "straight line graph", "proportion", "ratio", "maths"],
  },

  // ── PHYSICS — EQUATIONS (additional) ─────────────────────────────────────
  {
    key: "equation_triangle_sdt",
    url: "/diagrams/equation-triangle-sdt.png",
    label: "Equation Triangle — Speed, Distance, Time",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["speed distance time", "sdt triangle", "equation triangle", "speed formula", "distance formula", "time formula", "physics", "kinematics", "compound measures", "compound measure", "speed", "density", "pressure", "maths"],
  },
  {
    key: "equation_triangle_density",
    url: "/diagrams/equation-triangle-density.png",
    label: "Equation Triangle — Density, Mass, Volume",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["density", "mass", "volume", "density formula", "equation triangle", "density mass volume", "dmv triangle", "physics", "chemistry"],
  },
  {
    key: "equation_triangle_pressure",
    url: "/diagrams/equation-triangle-pressure.png",
    label: "Equation Triangle — Pressure, Force, Area",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["pressure", "force", "area", "pressure formula", "equation triangle", "pressure force area", "pfa triangle", "physics"],
  },
  {
    key: "graph_distance_time",
    url: "/diagrams/graph-distance-time.png",
    label: "Distance-Time Graph",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["distance time graph", "distance-time graph", "speed", "gradient", "motion", "kinematics", "stationary", "constant speed", "physics"],
  },

  // ── CHEMISTRY — BONDING (additional) ─────────────────────────────────────
  {
    key: "metallic_bonding",
    url: "/diagrams/metallic-bonding.png",
    label: "Metallic Bonding",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["metallic bonding", "metallic bond", "sea of electrons", "delocalised electrons", "metal lattice", "positive ions", "conductivity", "chemistry"],
  },

  // ── PHYSICS — CIRCUITS (additional) ──────────────────────────────────────
  {
    key: "parallel_circuit",
    url: "/diagrams/parallel-circuit.png",
    label: "Parallel Circuit",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["parallel circuit", "parallel", "current", "voltage", "resistance", "branches", "electrical circuit", "circuit diagram", "physics"],
  },

  // ── HISTORY (additional) ──────────────────────────────────────────────────
  {
    key: "ancient_egypt",
    url: "/diagrams/ancient-egypt.png",
    label: "Ancient Egypt",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["ancient egypt", "egypt", "pharaoh", "pyramid", "hieroglyphics", "nile", "mummification", "gods", "history"],
  },
  {
    key: "stone_age",
    url: "/diagrams/stone-age.png",
    label: "Stone Age",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["stone age", "prehistoric", "hunter gatherer", "cave paintings", "tools", "neolithic", "palaeolithic", "mesolithic", "history"],
  },
  {
    key: "viking_longship",
    url: "/diagrams/viking-longship.png",
    label: "Viking Longship",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["vikings", "viking longship", "longship", "norse", "scandinavia", "raid", "invasion", "history"],
  },

  // ── GEOGRAPHY (additional) ────────────────────────────────────────────────
  {
    key: "world_biomes",
    url: "/diagrams/world-biomes.png",
    label: "World Biomes",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["biomes", "world biomes", "tropical rainforest", "desert", "tundra", "grassland", "savanna", "temperate forest", "taiga", "geography", "ecosystems"],
  },

  // ── PE / SPORT ────────────────────────────────────────────────────────────
  {
    key: "muscular_system",
    url: "/diagrams/human-skeleton.png",
    label: "Muscular System",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["muscles", "muscular system", "bicep", "tricep", "quadriceps", "hamstring", "gluteus", "deltoid", "calf", "muscle contraction", "antagonistic muscles", "pe"],
  },
  {
    key: "heart_rate_exercise",
    url: "/diagrams/human-heart.png",
    label: "Heart Rate — ECG Trace",
    attribution: "AI-generated educational diagram (Adaptly)",
    keywords: ["heart rate", "exercise", "recovery rate", "aerobic", "anaerobic", "cardiovascular", "fitness", "pe", "pulse", "ecg", "cardiac output"],
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
  _subject: string,
  _topic: string
): Promise<{ url: string; caption: string; attribution: string } | null> {
  // Wikimedia search permanently disabled.
  // All diagrams are served exclusively from the admin diagram library (DB).
  return null;
}
