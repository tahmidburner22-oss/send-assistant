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
  // Maths — specific topic entries (must come before broad catch-alls)
  [["algebra \u2014 simple formulae and sequences", "algebra — simple formulae and sequences", "algebra simple formulae and sequences", "simple formulae and sequences"], "algebra_simple_formulae_and_sequences"],
  [["algebraic expressions", "expanding brackets", "expanding single brackets", "expanding double brackets", "factorising expressions"], "algebraic_expressions"],
  [["angles", "angles in parallel lines", "angles in polygons", "angles on a straight line"], "angles"],
  [["area and perimeter", "area of rectangles", "circumference of a circle", "area of a circle"], "area_and_perimeter"],
  [["decimals and percentages", "percentages as fractions and decimals", "comparing fractions decimals and percentages"], "decimals_and_percentages"],
  [["decimals \u2014 all operations", "decimals — all operations", "decimals all operations", "adding and subtracting decimals", "multiplying decimals", "dividing decimals"], "decimals_all_operations"],
  [["four operations and order of operations", "bidmas", "bodmas", "bidmas/bodmas", "order of operations"], "four_operations_order_of_operations"],
  [["fractions \u2014 all operations", "fractions — all operations", "fractions all operations", "adding and subtracting fractions different denominators", "multiplying fractions", "dividing fractions"], "fractions_all_operations"],
  [["fractions \u2014 secondary", "fractions — secondary", "fractions secondary", "algebraic fractions", "simplifying algebraic fractions"], "fractions_secondary"],
  [["fractions, decimals and percentages", "converting between fractions decimals and percentages", "recurring decimals", "ordering fdp"], "fractions_decimals_and_percentages"],
  [["fractions", "adding and subtracting fractions", "fractions basics"], "fractions"],
  [["functions and graphs", "function notation", "composite and inverse functions", "transformations of graphs"], "functions_and_graphs"],
  [["indices and standard form", "laws of indices", "negative and fractional indices", "standard form", "calculations in standard form"], "indices_and_standard_form"],
  [["linear inequalities", "solving linear inequalities", "inequalities on a number line", "double inequalities"], "linear_inequalities"],
  [["multiplication and division (2, 5, 10 times tables)", "2 times table", "5 times table", "10 times table"], "times_tables_2_5_10"],
  [["multiplication and division (3, 4, 8 times tables)", "3 times table", "4 times table", "8 times table"], "times_tables_3_4_8"],
  [["multiplication and division (times tables to 12\u00d712)", "multiplication and division (times tables to 12x12)", "times tables to 12x12", "6 7 9 11 12 times tables"], "times_tables_12x12"],
  [["multiplication and division (multi-digit)", "long multiplication", "long division", "multi-digit multiplication"], "multiplication_division_multi_digit"],
  [["percentages of amounts", "finding percentages of amounts", "percentage increase and decrease", "reverse percentages"], "percentages_of_amounts"],
  [["percentages", "percentage of an amount", "compound interest", "depreciation"], "percentages"],
  [["place value and ordering integers", "reading and writing large integers", "ordering positive and negative integers", "rounding to significant figures"], "place_value_and_ordering_integers"],
  [["probability", "chance", "likelihood", "tree diagram", "conditional probability"], "probability"],
  [["proportion", "direct proportion", "inverse proportion", "proportion graphs"], "proportion"],
  [["pythagoras' theorem", "pythagoras theorem", "pythagoras", "finding the hypotenuse", "finding a shorter side"], "pythagoras_theorem"],
  [["quadratic equations", "quadratics", "solving quadratics", "quadratic formula", "completing the square", "factorising quadratics"], "quadratic_equations"],
  [["ratio and proportion", "writing and simplifying ratios", "dividing quantities in a given ratio", "scale factors"], "ratio_and_proportion"],
  [["ratio", "simplifying ratios", "dividing in a ratio", "ratio problems"], "ratio"],
  [["sequences", "arithmetic sequences", "geometric sequences", "quadratic sequences", "nth term"], "sequences"],
  [["simultaneous equations", "simultaneous", "solving by elimination", "solving by substitution"], "simultaneous_equations"],
  [["solving linear equations", "one-step equations", "two-step equations", "equations with unknowns on both sides"], "solving_linear_equations"],
  [["straight-line graphs", "straight line graphs", "plotting straight-line graphs", "gradient and y-intercept", "y = mx + c"], "straight_line_graphs"],
  [["statistics", "data", "mean median mode", "histograms", "cumulative frequency"], "statistics"],
  [["surds", "simplifying surds", "rationalising the denominator"], "surds"],
  [["transformations", "reflection", "rotation", "translation", "enlargement"], "transformations"],
  [["trigonometry", "sine cosine tangent", "soh cah toa", "sine and cosine rules", "exact trigonometric values"], "trigonometry"],
  [["vectors", "vector addition", "magnitude direction", "vector geometry proofs"], "vectors"],
  [["volume and surface area", "volume of prisms", "surface area of prisms", "volume of pyramids cones and spheres"], "volume_and_surface_area"],
  // Maths — broad fallback entries (only match if no specific entry matched above)
  [["algebra", "simplifying expressions"], "algebra"],
  [["geometry", "shapes", "polygons", "circles"], "geometry"],
  [["calculus", "differentiation", "integration", "gradient"], "calculus"],
  [["number", "integers", "prime factors"], "number"],
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
