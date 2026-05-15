/**
 * Canonical Topic Normalizer
 *
 * Converts any free-text topic string into a stable canonical key
 * (e.g. "Atomic Structure" → "atomic_structure").
 *
 * This key is used to:
 *  1. Match worksheet library entries to diagram bank entries.
 *  2. Deduplicate library rows across different topic phrasings.
 *  3. Provide stable assetRef lookup keys.
 *
 * The normalizer is shared between server routes and the diagram bank.
 */

// ── Canonical topic map ────────────────────────────────────────────────────────
// Maps any known phrase variant → canonical key
const CANONICAL_TOPIC_MAP: Array<[string[], string]> = [
  // Physics
  [["atomic structure", "atomic model", "subatomic particles", "protons neutrons electrons", "nuclear model", "bohr model"], "atomic_structure"],
  [["electricity", "circuits", "ohm's law", "ohm", "current voltage resistance"], "electricity"],
  [["waves", "wave properties", "transverse longitudinal"], "waves"],
  [["forces", "motion", "newton's laws", "free body diagram", "resultant force"], "forces_and_motion"],
  [["energy", "energy transfer", "sankey diagram", "specific heat capacity"], "energy"],
  [["magnetism", "electromagnetism", "motor effect", "transformer", "fleming"], "electromagnetism"],
  [["nuclear", "radioactivity", "half-life", "alpha beta gamma", "nuclear decay"], "nuclear_physics"],
  [["particle model", "states of matter", "gas pressure", "kinetic theory"], "particle_model"],
  [["light", "optics", "ray diagram", "reflection refraction", "electromagnetic spectrum"], "light_and_optics"],
  [["pressure", "fluid pressure", "hydraulic", "upthrust"], "pressure"],
  [["space", "solar system", "star life cycle", "universe", "orbits"], "space"],
  // Biology
  [["cell biology", "cell structure", "mitosis", "cell division", "eukaryotic prokaryotic"], "cell_biology"],
  [["dna", "genetics", "inheritance", "alleles", "punnett square", "chromosomes"], "genetics"],
  [["photosynthesis", "bioenergetics", "chlorophyll", "glucose"], "photosynthesis"],
  [["heart", "circulatory system", "blood vessels", "cardiac cycle"], "circulatory_system"],
  [["homeostasis", "nervous system", "hormones", "thermoregulation", "blood glucose"], "homeostasis"],
  [["respiration", "aerobic anaerobic", "atp"], "respiration"],
  [["evolution", "natural selection", "adaptation", "darwin"], "evolution"],
  [["ecosystem", "food chain", "food web", "biodiversity", "habitat"], "ecology"],
  [["plant biology", "transpiration", "stomata", "xylem phloem"], "plant_biology"],
  // Chemistry
  [["ionic bonding", "ionic compounds", "lattice"], "ionic_bonding"],
  [["covalent bonding", "covalent bond", "molecular structure"], "covalent_bonding"],
  [["bonding", "metallic bonding", "intermolecular forces"], "chemical_bonding"],
  [["organic chemistry", "alkane", "alkene", "hydrocarbons", "functional groups"], "organic_chemistry"],
  [["periodic table", "groups periods", "electron configuration", "elements"], "periodic_table"],
  [["acids bases", "ph scale", "neutralisation", "titration"], "acids_and_bases"],
  [["rates of reaction", "reaction rate", "catalysts", "activation energy"], "rates_of_reaction"],
  [["equilibrium", "reversible reactions", "le chatelier"], "equilibrium"],
  [["electrolysis", "electrode", "anode cathode"], "electrolysis"],
  [["quantitative chemistry", "moles", "relative formula mass", "empirical formula"], "quantitative_chemistry"],
  [["atom economy", "percentage yield", "green chemistry"], "atom_economy"],
  // Maths
  [["quadratic equations", "quadratics", "solving quadratics", "quadratic formula", "completing the square", "factorising quadratics"], "quadratic_equations"],
  [["simultaneous equations", "simultaneous"], "simultaneous_equations"],
  [["linear equations", "solving equations", "one-step equations", "two-step equations"], "linear_equations"],
  [["algebraic fractions", "algebraic fraction"], "algebraic_fractions"],
  [["algebra", "algebraic expressions", "expanding brackets", "factorising", "simplifying expressions"], "algebra"],
  [["geometry", "angles", "shapes", "polygons", "circles"], "geometry"],
  [["probability", "chance", "likelihood", "tree diagram"], "probability"],
  [["statistics", "data", "mean median mode", "histograms", "cumulative frequency"], "statistics"],
  [["vectors", "vector addition", "magnitude direction"], "vectors"],
  [["fractions", "ratio", "proportion", "percentages", "decimals"], "number"],
  [["trigonometry", "sine cosine tangent", "pythagoras"], "trigonometry"],
  [["calculus", "differentiation", "integration", "gradient"], "calculus"],
  [["number", "integers", "prime factors", "indices", "surds"], "number"],
  // English
  [["shakespeare", "macbeth", "romeo and juliet", "othello", "hamlet"], "shakespeare"],
  [["poetry", "poem analysis", "poetic devices", "imagery"], "poetry"],
  [["comprehension", "reading skills", "inference", "analysis"], "reading_comprehension"],
  [["writing skills", "creative writing", "persuasive writing", "narrative"], "writing"],
  [["grammar", "punctuation", "sentence structure", "clauses"], "grammar"],
  // History
  [["world war 1", "ww1", "first world war", "trench warfare"], "world_war_1"],
  [["world war 2", "ww2", "second world war", "holocaust"], "world_war_2"],
  [["cold war", "ussr usa", "nuclear arms race", "cuban missile crisis"], "cold_war"],
  [["civil rights", "martin luther king", "rosa parks", "segregation"], "civil_rights"],
  [["industrial revolution", "factories", "victorian"], "industrial_revolution"],
  // Geography
  [["tectonic plates", "earthquakes", "volcanoes", "plate boundaries"], "tectonics"],
  [["rivers", "erosion deposition", "drainage basin", "flooding"], "rivers"],
  [["climate change", "global warming", "greenhouse effect", "carbon footprint"], "climate_change"],
  [["urbanisation", "cities", "urban growth", "megacities"], "urbanisation"],
  [["development", "gdp", "hdi", "inequality", "global development"], "global_development"],
  // ── Phase 3.5: Extended synonym mappings for diagram coverage ──────────────
  // Physics expansions
  [["distance time graph", "speed time graph", "velocity time graph", "motion graphs"], "forces_and_motion"],
  [["electromagnetic spectrum", "em spectrum", "radio waves", "microwaves", "infrared", "visible light", "ultraviolet", "x-rays", "gamma rays"], "light_and_optics"],
  [["circuit symbols", "series circuit", "parallel circuit", "resistance", "ammeter", "voltmeter"], "electricity"],
  // Biology expansions
  [["digestive system", "digestion", "enzymes in digestion", "villi", "small intestine", "large intestine"], "digestive_system"],
  [["animal cell", "animal cells", "cell membrane", "cytoplasm", "nucleus", "mitochondria"], "cell_biology"],
  [["plant cell", "plant cells", "cell wall", "chloroplast", "vacuole"], "plant_biology"],
  [["nervous system", "reflex arc", "synapse", "neurones", "receptor"], "homeostasis"],
  [["human body", "organ systems", "organ system"], "human_body"],
  // Chemistry expansions
  [["separation techniques", "distillation", "filtration", "chromatography", "crystallisation"], "separation_techniques"],
  [["periodic table groups", "group 1", "group 7", "noble gases", "halogens", "alkali metals", "transition metals"], "periodic_table"],
  // Maths expansions
  [["pythagoras", "pythagoras theorem", "pythagorean theorem", "finding the hypotenuse", "right-angled triangle"], "trigonometry"],
  [["coordinates", "plotting coordinates", "coordinate grid", "cartesian plane", "x and y axes"], "coordinates"],
  [["fractions decimals percentages", "fdp", "converting fractions", "fraction decimal percent"], "number"],
  [["area and perimeter", "area of shapes", "perimeter of shapes", "compound shapes area"], "geometry"],
  [["circle theorems", "tangent theorem", "angle in semicircle", "angles in same segment"], "geometry"],
  [["transformations", "rotation", "reflection", "translation", "enlargement"], "geometry"],
  [["3d shapes", "prisms", "nets", "surface area", "volume of shapes"], "geometry"],
  [["sequences", "nth term", "arithmetic sequence", "geometric sequence", "sequence patterns"], "algebra"],
  // History expansions
  [["battle of hastings", "1066", "william the conqueror", "harold godwinson", "norman conquest"], "norman_conquest"],
  [["medieval", "medieval life", "black death", "feudal system", "middle ages"], "medieval"],
  [["tudor", "tudors", "henry viii", "elizabeth i", "reformation"], "tudors"],
  [["roman", "romans", "roman empire", "roman britain"], "roman_empire"],
  // Geography expansions
  [["coastal erosion", "coastal features", "headlands bays", "stacks stumps", "longshore drift", "coastal management"], "coastal_geography"],
  [["water cycle", "hydrological cycle", "evaporation", "condensation", "precipitation"], "water_cycle"],
  [["population", "population growth", "population pyramid", "demographic transition"], "population"],
  // Computer Science expansions
  [["binary", "binary number", "binary to denary", "denary to binary", "binary addition"], "binary"],
  [["logic gates", "and gate", "or gate", "not gate", "truth table"], "logic_gates"],
  [["sorting algorithms", "bubble sort", "merge sort", "insertion sort", "algorithm efficiency"], "sorting_algorithms"],
  [["computer architecture", "cpu", "von neumann", "fetch decode execute", "ram rom"], "computer_architecture"],
  [["networking", "network topology", "star network", "protocols", "tcp ip", "packets"], "networking"],
];

/**
 * Convert a topic string to a canonical snake_case key.
 * Returns the canonical key if a match is found, otherwise generates
 * a normalised key from the raw topic string.
 */
export function canonicalTopicKey(topic: string): string {
  const lower = topic.toLowerCase().trim();

  // Try exact match first
  for (const [variants, key] of CANONICAL_TOPIC_MAP) {
    if (variants.some(v => v === lower)) return key;
  }

  // Try substring match (any variant contained in topic or vice versa)
  for (const [variants, key] of CANONICAL_TOPIC_MAP) {
    if (variants.some(v => lower.includes(v) || v.includes(lower))) return key;
  }

  // Fallback: normalise to snake_case from raw topic
  return lower
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

/**
 * Check if two topic strings resolve to the same canonical key.
 */
export function topicsMatch(topicA: string, topicB: string): boolean {
  return canonicalTopicKey(topicA) === canonicalTopicKey(topicB);
}

/**
 * Get all known variant phrases for a canonical key.
 */
export function getTopicVariants(canonicalKey: string): string[] {
  for (const [variants, key] of CANONICAL_TOPIC_MAP) {
    if (key === canonicalKey) return variants;
  }
  return [];
}

export default canonicalTopicKey;
