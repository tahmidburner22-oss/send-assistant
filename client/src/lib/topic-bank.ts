/**
 * Topic Bank — rotating curriculum topics per subject for the AI scheduler.
 * Topics are ordered to build on each other (spiral curriculum).
 * The scheduler picks the next topic in the sequence, cycling back to the start.
 */

export interface TopicEntry {
  topic: string;
  keyVocabulary: string[];   // words the AI should test in recall
}

export const TOPIC_BANK: Record<string, TopicEntry[]> = {
  mathematics: [
    { topic: "Place Value and Rounding", keyVocabulary: ["digit", "place value", "round", "estimate"] },
    { topic: "Addition and Subtraction", keyVocabulary: ["sum", "difference", "carry", "borrow"] },
    { topic: "Multiplication and Division", keyVocabulary: ["product", "quotient", "factor", "multiple"] },
    { topic: "Fractions", keyVocabulary: ["numerator", "denominator", "equivalent", "simplify"] },
    { topic: "Decimals and Percentages", keyVocabulary: ["decimal point", "percent", "convert", "proportion"] },
    { topic: "Ratio and Proportion", keyVocabulary: ["ratio", "proportion", "scale", "unitary method"] },
    { topic: "Algebra — Expressions and Equations", keyVocabulary: ["variable", "expression", "equation", "solve"] },
    { topic: "Geometry — Angles and Shapes", keyVocabulary: ["angle", "polygon", "parallel", "perpendicular"] },
    { topic: "Area and Perimeter", keyVocabulary: ["area", "perimeter", "formula", "composite shape"] },
    { topic: "Statistics — Mean, Median, Mode", keyVocabulary: ["mean", "median", "mode", "range"] },
    { topic: "Probability", keyVocabulary: ["probability", "event", "outcome", "likelihood"] },
    { topic: "Pythagoras' Theorem", keyVocabulary: ["hypotenuse", "right angle", "square root", "theorem"] },
    { topic: "Linear Graphs", keyVocabulary: ["gradient", "y-intercept", "coordinate", "linear"] },
    { topic: "Quadratic Equations", keyVocabulary: ["quadratic", "factorize", "roots", "parabola"] },
    { topic: "Trigonometry", keyVocabulary: ["sine", "cosine", "tangent", "opposite", "adjacent"] },
  ],
  english: [
    { topic: "Nouns, Verbs and Adjectives", keyVocabulary: ["noun", "verb", "adjective", "modify"] },
    { topic: "Sentence Structure and Punctuation", keyVocabulary: ["clause", "phrase", "comma", "full stop"] },
    { topic: "Descriptive Writing", keyVocabulary: ["imagery", "simile", "metaphor", "atmosphere"] },
    { topic: "Narrative Writing — Story Structure", keyVocabulary: ["exposition", "climax", "resolution", "protagonist"] },
    { topic: "Persuasive Writing", keyVocabulary: ["argument", "evidence", "rhetorical question", "counter-argument"] },
    { topic: "Reading Comprehension — Inference", keyVocabulary: ["infer", "imply", "evidence", "quote"] },
    { topic: "Poetry — Rhyme and Rhythm", keyVocabulary: ["rhyme", "rhythm", "stanza", "verse"] },
    { topic: "Shakespeare — Key Themes", keyVocabulary: ["theme", "tragedy", "soliloquy", "dramatic irony"] },
    { topic: "Non-Fiction — Report Writing", keyVocabulary: ["formal", "objective", "subheading", "fact"] },
    { topic: "Spoken Language — Debate and Discussion", keyVocabulary: ["perspective", "bias", "tone", "register"] },
    { topic: "Vocabulary in Context", keyVocabulary: ["context", "connotation", "denotation", "synonym"] },
    { topic: "Figurative Language", keyVocabulary: ["personification", "alliteration", "onomatopoeia", "hyperbole"] },
  ],
  science: [
    { topic: "Cells — Structure and Function", keyVocabulary: ["nucleus", "cell membrane", "cytoplasm", "mitochondria"] },
    { topic: "Photosynthesis", keyVocabulary: ["chlorophyll", "glucose", "carbon dioxide", "oxygen"] },
    { topic: "The Digestive System", keyVocabulary: ["enzyme", "absorption", "oesophagus", "villi"] },
    { topic: "Forces and Motion", keyVocabulary: ["force", "friction", "gravity", "acceleration"] },
    { topic: "Electricity and Circuits", keyVocabulary: ["current", "voltage", "resistance", "series circuit"] },
    { topic: "The Periodic Table", keyVocabulary: ["element", "atom", "proton", "electron"] },
    { topic: "Chemical Reactions", keyVocabulary: ["reactant", "product", "exothermic", "endothermic"] },
    { topic: "Waves — Light and Sound", keyVocabulary: ["wavelength", "frequency", "amplitude", "reflection"] },
    { topic: "Genetics and Inheritance", keyVocabulary: ["gene", "chromosome", "dominant", "recessive"] },
    { topic: "Ecosystems and Food Chains", keyVocabulary: ["producer", "consumer", "predator", "prey"] },
    { topic: "The Solar System", keyVocabulary: ["orbit", "gravity", "planet", "satellite"] },
    { topic: "Acids and Alkalis", keyVocabulary: ["pH", "neutralisation", "indicator", "salt"] },
  ],
  history: [
    { topic: "The Romans in Britain", keyVocabulary: ["empire", "legion", "conquest", "Hadrian's Wall"] },
    { topic: "The Anglo-Saxons", keyVocabulary: ["kingdom", "thane", "Beowulf", "settlement"] },
    { topic: "The Norman Conquest 1066", keyVocabulary: ["Battle of Hastings", "feudal system", "Domesday Book", "William I"] },
    { topic: "The Black Death", keyVocabulary: ["plague", "bubonic", "mortality", "quarantine"] },
    { topic: "The Tudor Period", keyVocabulary: ["Reformation", "monarch", "dissolution", "Protestant"] },
    { topic: "The English Civil War", keyVocabulary: ["Royalist", "Parliamentarian", "Cromwell", "republic"] },
    { topic: "The Industrial Revolution", keyVocabulary: ["factory", "urbanisation", "steam engine", "child labour"] },
    { topic: "World War One", keyVocabulary: ["trench warfare", "alliance", "armistice", "propaganda"] },
    { topic: "World War Two", keyVocabulary: ["Holocaust", "Blitz", "evacuation", "D-Day"] },
    { topic: "The Cold War", keyVocabulary: ["USSR", "NATO", "nuclear", "Iron Curtain"] },
    { topic: "The Civil Rights Movement", keyVocabulary: ["segregation", "discrimination", "protest", "equality"] },
  ],
  geography: [
    { topic: "Map Skills and Grid References", keyVocabulary: ["grid reference", "contour", "scale", "compass"] },
    { topic: "Weather and Climate", keyVocabulary: ["precipitation", "temperature", "climate zone", "humidity"] },
    { topic: "Rivers and Erosion", keyVocabulary: ["erosion", "deposition", "meander", "floodplain"] },
    { topic: "Tectonic Plates and Earthquakes", keyVocabulary: ["tectonic plate", "fault line", "magnitude", "epicentre"] },
    { topic: "Volcanoes", keyVocabulary: ["magma", "lava", "eruption", "crater"] },
    { topic: "Ecosystems and Biomes", keyVocabulary: ["biome", "ecosystem", "biodiversity", "habitat"] },
    { topic: "Urbanisation", keyVocabulary: ["urban", "rural", "migration", "infrastructure"] },
    { topic: "Development and Inequality", keyVocabulary: ["GDP", "HDI", "development gap", "aid"] },
    { topic: "Climate Change", keyVocabulary: ["greenhouse gas", "carbon footprint", "global warming", "renewable"] },
    { topic: "Coastal Processes", keyVocabulary: ["wave", "erosion", "longshore drift", "cliff"] },
  ],
  computing: [
    { topic: "Binary and Data Representation", keyVocabulary: ["binary", "bit", "byte", "hexadecimal"] },
    { topic: "Algorithms and Flowcharts", keyVocabulary: ["algorithm", "flowchart", "sequence", "iteration"] },
    { topic: "Programming — Variables and Loops", keyVocabulary: ["variable", "loop", "iteration", "condition"] },
    { topic: "Boolean Logic", keyVocabulary: ["AND", "OR", "NOT", "truth table"] },
    { topic: "Networks and the Internet", keyVocabulary: ["IP address", "router", "protocol", "bandwidth"] },
    { topic: "Cybersecurity", keyVocabulary: ["encryption", "phishing", "firewall", "malware"] },
    { topic: "Databases", keyVocabulary: ["table", "query", "record", "field"] },
    { topic: "Computational Thinking", keyVocabulary: ["decomposition", "abstraction", "pattern recognition", "algorithm"] },
  ],
  biology: [
    { topic: "Cells — Structure and Function", keyVocabulary: ["nucleus", "cell membrane", "cytoplasm", "mitochondria"] },
    { topic: "Photosynthesis", keyVocabulary: ["chlorophyll", "glucose", "carbon dioxide", "oxygen"] },
    { topic: "Respiration", keyVocabulary: ["aerobic", "anaerobic", "ATP", "glucose"] },
    { topic: "The Digestive System", keyVocabulary: ["enzyme", "absorption", "oesophagus", "villi"] },
    { topic: "The Circulatory System", keyVocabulary: ["heart", "artery", "vein", "capillary"] },
    { topic: "Genetics and Inheritance", keyVocabulary: ["gene", "chromosome", "dominant", "recessive"] },
    { topic: "Evolution and Natural Selection", keyVocabulary: ["adaptation", "mutation", "selection", "species"] },
    { topic: "Ecosystems and Food Chains", keyVocabulary: ["producer", "consumer", "predator", "prey"] },
  ],
  chemistry: [
    { topic: "Atoms and the Periodic Table", keyVocabulary: ["proton", "neutron", "electron", "atomic number"] },
    { topic: "Chemical Bonding", keyVocabulary: ["ionic", "covalent", "metallic", "bond"] },
    { topic: "Chemical Reactions and Equations", keyVocabulary: ["reactant", "product", "balanced equation", "symbol"] },
    { topic: "Acids and Alkalis", keyVocabulary: ["pH", "neutralisation", "indicator", "salt"] },
    { topic: "Rates of Reaction", keyVocabulary: ["catalyst", "concentration", "temperature", "surface area"] },
    { topic: "Organic Chemistry", keyVocabulary: ["hydrocarbon", "alkane", "alkene", "polymer"] },
  ],
  physics: [
    { topic: "Forces and Motion", keyVocabulary: ["force", "friction", "gravity", "acceleration"] },
    { topic: "Energy Transfers", keyVocabulary: ["kinetic", "potential", "thermal", "conservation"] },
    { topic: "Electricity and Circuits", keyVocabulary: ["current", "voltage", "resistance", "Ohm's law"] },
    { topic: "Waves — Light and Sound", keyVocabulary: ["wavelength", "frequency", "amplitude", "reflection"] },
    { topic: "Magnetism and Electromagnetism", keyVocabulary: ["magnetic field", "solenoid", "motor effect", "induction"] },
    { topic: "Nuclear Physics", keyVocabulary: ["nucleus", "radioactive", "half-life", "isotope"] },
    { topic: "Space Physics", keyVocabulary: ["orbit", "gravity", "light year", "galaxy"] },
  ],
  mfl: [
    { topic: "Greetings and Introductions", keyVocabulary: ["bonjour", "hola", "ciao", "introduce"] },
    { topic: "Family and Relationships", keyVocabulary: ["famille", "familia", "sibling", "describe"] },
    { topic: "School and Education", keyVocabulary: ["matière", "asignatura", "timetable", "lesson"] },
    { topic: "Food and Eating Out", keyVocabulary: ["restaurant", "menu", "order", "preference"] },
    { topic: "Travel and Transport", keyVocabulary: ["transport", "journey", "direction", "ticket"] },
    { topic: "Holidays and Free Time", keyVocabulary: ["vacances", "vacaciones", "hobby", "activity"] },
    { topic: "Environment and Global Issues", keyVocabulary: ["environment", "pollution", "recycle", "climate"] },
  ],
  re: [
    { topic: "Christianity — Key Beliefs", keyVocabulary: ["Trinity", "salvation", "resurrection", "scripture"] },
    { topic: "Islam — Key Beliefs and Practices", keyVocabulary: ["Allah", "prophet", "Quran", "Five Pillars"] },
    { topic: "Judaism — Key Beliefs and Practices", keyVocabulary: ["Torah", "Shabbat", "synagogue", "covenant"] },
    { topic: "Hinduism — Key Beliefs", keyVocabulary: ["dharma", "karma", "moksha", "reincarnation"] },
    { topic: "Ethics — Right and Wrong", keyVocabulary: ["morality", "conscience", "justice", "virtue"] },
    { topic: "Life After Death", keyVocabulary: ["resurrection", "reincarnation", "heaven", "judgement"] },
  ],
  pshe: [
    { topic: "Mental Health and Wellbeing", keyVocabulary: ["wellbeing", "anxiety", "resilience", "mindfulness"] },
    { topic: "Healthy Relationships", keyVocabulary: ["respect", "consent", "boundary", "communication"] },
    { topic: "Online Safety and Cyberbullying", keyVocabulary: ["cyberbullying", "privacy", "digital footprint", "report"] },
    { topic: "Healthy Lifestyles", keyVocabulary: ["nutrition", "exercise", "sleep", "balance"] },
    { topic: "Equality and Diversity", keyVocabulary: ["equality", "diversity", "discrimination", "inclusion"] },
    { topic: "Careers and Aspirations", keyVocabulary: ["career", "aspiration", "skill", "qualification"] },
  ],
  business: [
    { topic: "Business Ownership Types", keyVocabulary: ["sole trader", "partnership", "limited company", "franchise"] },
    { topic: "Marketing and the Marketing Mix", keyVocabulary: ["product", "price", "place", "promotion"] },
    { topic: "Finance — Revenue and Costs", keyVocabulary: ["revenue", "cost", "profit", "break-even"] },
    { topic: "Human Resources", keyVocabulary: ["recruitment", "motivation", "training", "retention"] },
    { topic: "Business Planning", keyVocabulary: ["business plan", "market research", "SWOT", "objective"] },
    { topic: "Globalisation and International Trade", keyVocabulary: ["globalisation", "import", "export", "tariff"] },
  ],
};

/**
 * Get the next topic for a child's scheduler, cycling through the bank.
 * Uses localStorage to track the current index per child+subject.
 */
export function getNextTopic(childId: string, subject: string): TopicEntry {
  const key = `scheduler_topic_idx_${childId}_${subject}`;
  const bank = TOPIC_BANK[subject] || TOPIC_BANK.mathematics;
  const currentIdx = parseInt(localStorage.getItem(key) || "0", 10);
  const nextIdx = (currentIdx + 1) % bank.length;
  localStorage.setItem(key, String(nextIdx));
  return bank[currentIdx];
}

/**
 * Peek at the current topic without advancing the index.
 */
export function peekCurrentTopic(childId: string, subject: string): TopicEntry {
  const key = `scheduler_topic_idx_${childId}_${subject}`;
  const bank = TOPIC_BANK[subject] || TOPIC_BANK.mathematics;
  const currentIdx = parseInt(localStorage.getItem(key) || "0", 10);
  return bank[currentIdx];
}

/**
 * Get the previous topic (for recall questions).
 */
export function getPreviousTopic(childId: string, subject: string): TopicEntry | null {
  const key = `scheduler_topic_idx_${childId}_${subject}`;
  const bank = TOPIC_BANK[subject] || TOPIC_BANK.mathematics;
  const currentIdx = parseInt(localStorage.getItem(key) || "0", 10);
  if (currentIdx === 0) return null; // no previous topic yet
  const prevIdx = (currentIdx - 1 + bank.length) % bank.length;
  return bank[prevIdx];
}

/**
 * Reset topic index for a child+subject (e.g. when subject changes).
 */
export function resetTopicIndex(childId: string, subject: string): void {
  const key = `scheduler_topic_idx_${childId}_${subject}`;
  localStorage.removeItem(key);
}
