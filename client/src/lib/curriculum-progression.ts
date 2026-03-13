/**
 * Curriculum Progression Model
 * Each topic has a skill ladder of 3–5 sequential steps.
 * Steps build on each other — the system suggests the next step based on pupil performance.
 */

export interface SkillStep {
  id: string;
  title: string;
  description: string; // short descriptor for the AI worksheet prompt
  keyVocabulary: string[];
}

export interface TopicProgression {
  topicId: string;
  topicName: string;
  subject: string;
  steps: SkillStep[];
}

export const CURRICULUM_PROGRESSIONS: TopicProgression[] = [

  // ─────────────────────────────────────────────────────────────────────────
  // MATHEMATICS
  // ─────────────────────────────────────────────────────────────────────────
  {
    topicId: "maths-fractions",
    topicName: "Fractions",
    subject: "mathematics",
    steps: [
      { id: "maths-fractions-1", title: "Understanding Fractions", description: "Identify and name fractions as parts of a whole; shade fractions of shapes", keyVocabulary: ["numerator", "denominator", "part", "whole"] },
      { id: "maths-fractions-2", title: "Equivalent Fractions", description: "Find and generate equivalent fractions; simplify fractions to lowest terms", keyVocabulary: ["equivalent", "simplify", "cancel", "common factor"] },
      { id: "maths-fractions-3", title: "Comparing & Ordering Fractions", description: "Compare fractions using common denominators; order fractions on a number line", keyVocabulary: ["greater than", "less than", "common denominator", "order"] },
      { id: "maths-fractions-4", title: "Adding & Subtracting Fractions", description: "Add and subtract fractions with same and different denominators; mixed numbers", keyVocabulary: ["add", "subtract", "like denominator", "unlike denominator", "mixed number"] },
      { id: "maths-fractions-5", title: "Multiplying & Dividing Fractions", description: "Multiply and divide fractions and mixed numbers; fraction word problems", keyVocabulary: ["multiply", "divide", "reciprocal", "product", "quotient"] },
    ],
  },
  {
    topicId: "maths-algebra",
    topicName: "Algebra — Expressions & Equations",
    subject: "mathematics",
    steps: [
      { id: "maths-algebra-1", title: "Algebraic Notation", description: "Understand and write algebraic expressions; identify terms, coefficients and constants", keyVocabulary: ["variable", "expression", "term", "coefficient"] },
      { id: "maths-algebra-2", title: "Simplifying Expressions", description: "Collect like terms; expand single brackets; substitute values into expressions", keyVocabulary: ["like terms", "simplify", "expand", "substitute"] },
      { id: "maths-algebra-3", title: "Solving Linear Equations", description: "Solve one-step and two-step equations; balance method; unknown on both sides", keyVocabulary: ["equation", "solve", "balance", "inverse operation"] },
      { id: "maths-algebra-4", title: "Forming & Solving Equations", description: "Form equations from word problems; solve and interpret answers in context", keyVocabulary: ["form", "context", "interpret", "word problem"] },
    ],
  },
  {
    topicId: "maths-quadratics",
    topicName: "Quadratic Equations",
    subject: "mathematics",
    steps: [
      { id: "maths-quadratics-1", title: "Expanding Double Brackets", description: "Expand and simplify double brackets; recognise quadratic expressions", keyVocabulary: ["expand", "double brackets", "quadratic", "FOIL"] },
      { id: "maths-quadratics-2", title: "Factorising Quadratics", description: "Factorise quadratic expressions of the form x² + bx + c", keyVocabulary: ["factorise", "factor pair", "roots", "quadratic"] },
      { id: "maths-quadratics-3", title: "Solving by Factorising", description: "Solve quadratic equations by factorising; find the roots", keyVocabulary: ["solve", "roots", "zero", "solution"] },
      { id: "maths-quadratics-4", title: "The Quadratic Formula", description: "Use the quadratic formula to solve equations that cannot be easily factorised", keyVocabulary: ["quadratic formula", "discriminant", "exact form", "surd"] },
      { id: "maths-quadratics-5", title: "Quadratic Graphs", description: "Sketch and interpret quadratic graphs; identify vertex, roots and line of symmetry", keyVocabulary: ["parabola", "vertex", "turning point", "line of symmetry"] },
    ],
  },
  {
    topicId: "maths-pythagoras",
    topicName: "Pythagoras' Theorem",
    subject: "mathematics",
    steps: [
      { id: "maths-pythagoras-1", title: "Right-Angled Triangles", description: "Identify the hypotenuse and legs of right-angled triangles; label sides", keyVocabulary: ["hypotenuse", "right angle", "legs", "triangle"] },
      { id: "maths-pythagoras-2", title: "Finding the Hypotenuse", description: "Apply Pythagoras' theorem to find the hypotenuse given two shorter sides", keyVocabulary: ["a² + b² = c²", "square", "square root", "hypotenuse"] },
      { id: "maths-pythagoras-3", title: "Finding a Shorter Side", description: "Rearrange and apply Pythagoras' theorem to find a shorter side", keyVocabulary: ["rearrange", "subtract", "shorter side", "theorem"] },
      { id: "maths-pythagoras-4", title: "Pythagoras in Context", description: "Apply Pythagoras' theorem to real-life problems and coordinate geometry", keyVocabulary: ["distance", "coordinate", "diagonal", "real-life"] },
    ],
  },
  {
    topicId: "maths-statistics",
    topicName: "Statistics — Mean, Median, Mode",
    subject: "mathematics",
    steps: [
      { id: "maths-statistics-1", title: "Mode and Median", description: "Find the mode and median of small data sets; understand what they represent", keyVocabulary: ["mode", "median", "middle value", "data set"] },
      { id: "maths-statistics-2", title: "Mean and Range", description: "Calculate the mean and range; understand when to use each average", keyVocabulary: ["mean", "range", "average", "sum"] },
      { id: "maths-statistics-3", title: "Comparing Distributions", description: "Compare two data sets using averages and range; interpret results in context", keyVocabulary: ["compare", "consistent", "spread", "interpret"] },
    ],
  },
  {
    topicId: "maths-trigonometry",
    topicName: "Trigonometry",
    subject: "mathematics",
    steps: [
      { id: "maths-trigonometry-1", title: "Labelling Triangles", description: "Label opposite, adjacent and hypotenuse relative to a given angle", keyVocabulary: ["opposite", "adjacent", "hypotenuse", "angle"] },
      { id: "maths-trigonometry-2", title: "SOH CAH TOA", description: "Use sine, cosine and tangent ratios to find missing sides in right-angled triangles", keyVocabulary: ["sine", "cosine", "tangent", "SOH CAH TOA"] },
      { id: "maths-trigonometry-3", title: "Finding Missing Angles", description: "Use inverse trigonometric functions to find missing angles", keyVocabulary: ["inverse sine", "inverse cosine", "inverse tangent", "arcsin"] },
      { id: "maths-trigonometry-4", title: "Trigonometry in Context", description: "Apply trigonometry to real-life problems including bearings and elevation", keyVocabulary: ["angle of elevation", "bearing", "real-life", "context"] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ENGLISH
  // ─────────────────────────────────────────────────────────────────────────
  {
    topicId: "english-descriptive-writing",
    topicName: "Descriptive Writing",
    subject: "english",
    steps: [
      { id: "english-desc-1", title: "Sensory Language", description: "Use the five senses to describe a scene; identify and write sensory details", keyVocabulary: ["sight", "sound", "smell", "touch", "taste"] },
      { id: "english-desc-2", title: "Figurative Language", description: "Use similes, metaphors and personification to create vivid descriptions", keyVocabulary: ["simile", "metaphor", "personification", "imagery"] },
      { id: "english-desc-3", title: "Varied Sentence Structure", description: "Use short and long sentences for effect; vary sentence openings", keyVocabulary: ["sentence structure", "short sentence", "complex sentence", "effect"] },
      { id: "english-desc-4", title: "Extended Descriptive Piece", description: "Write a full descriptive piece using all techniques; structure with clear paragraphs", keyVocabulary: ["paragraph", "structure", "atmosphere", "extended writing"] },
    ],
  },
  {
    topicId: "english-persuasive-writing",
    topicName: "Persuasive Writing",
    subject: "english",
    steps: [
      { id: "english-pers-1", title: "Persuasive Techniques", description: "Identify and use AFOREST techniques: alliteration, facts, opinions, repetition, emotive language, statistics, triples", keyVocabulary: ["AFOREST", "rhetorical question", "emotive language", "statistics"] },
      { id: "english-pers-2", title: "Structuring an Argument", description: "Organise a persuasive text with introduction, points, counter-argument and conclusion", keyVocabulary: ["argument", "counter-argument", "conclusion", "structure"] },
      { id: "english-pers-3", title: "Formal Persuasive Writing", description: "Write a formal persuasive letter or article using appropriate register and tone", keyVocabulary: ["formal register", "tone", "audience", "purpose"] },
    ],
  },
  {
    topicId: "english-shakespeare",
    topicName: "Shakespeare — Key Themes",
    subject: "english",
    steps: [
      { id: "english-shakes-1", title: "Plot and Characters", description: "Identify key characters and summarise the main plot events of the play", keyVocabulary: ["protagonist", "antagonist", "plot", "character"] },
      { id: "english-shakes-2", title: "Key Themes", description: "Identify and explain key themes such as power, love, jealousy or ambition with textual evidence", keyVocabulary: ["theme", "evidence", "quote", "explore"] },
      { id: "english-shakes-3", title: "Language Analysis", description: "Analyse Shakespeare's language choices including metaphor, dramatic irony and soliloquy", keyVocabulary: ["language", "metaphor", "dramatic irony", "soliloquy"] },
      { id: "english-shakes-4", title: "Extended Essay Response", description: "Write a structured essay response to a Shakespeare question using PEE paragraphs", keyVocabulary: ["PEE", "point", "evidence", "explanation", "essay"] },
    ],
  },
  {
    topicId: "english-reading-comprehension",
    topicName: "Reading Comprehension — Inference",
    subject: "english",
    steps: [
      { id: "english-comp-1", title: "Retrieval", description: "Find and copy information directly from a text; answer literal questions", keyVocabulary: ["retrieve", "find", "copy", "literal"] },
      { id: "english-comp-2", title: "Inference", description: "Read between the lines; infer meaning from clues in the text", keyVocabulary: ["infer", "suggest", "imply", "clue"] },
      { id: "english-comp-3", title: "Language Effect", description: "Explain the effect of a writer's language choices on the reader", keyVocabulary: ["effect", "reader", "language choice", "connotation"] },
      { id: "english-comp-4", title: "Comparison", description: "Compare how two texts present a theme or idea; use comparative language", keyVocabulary: ["compare", "contrast", "similarly", "whereas"] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SCIENCE
  // ─────────────────────────────────────────────────────────────────────────
  {
    topicId: "science-chemical-reactions",
    topicName: "Chemical Reactions",
    subject: "science",
    steps: [
      { id: "science-chem-1", title: "Reactants and Products", description: "Identify reactants and products in a chemical reaction; understand what a chemical change is", keyVocabulary: ["reactant", "product", "chemical change", "reaction"] },
      { id: "science-chem-2", title: "Word Equations", description: "Write and balance word equations for common chemical reactions", keyVocabulary: ["word equation", "arrow", "reactant", "product"] },
      { id: "science-chem-3", title: "Types of Reactions", description: "Identify and describe exothermic and endothermic reactions; combustion, oxidation, neutralisation", keyVocabulary: ["exothermic", "endothermic", "combustion", "neutralisation"] },
      { id: "science-chem-4", title: "Symbol Equations", description: "Write and balance symbol equations; understand conservation of mass", keyVocabulary: ["symbol equation", "balance", "conservation of mass", "formula"] },
    ],
  },
  {
    topicId: "science-forces",
    topicName: "Forces and Motion",
    subject: "science",
    steps: [
      { id: "science-forces-1", title: "Types of Forces", description: "Identify contact and non-contact forces; describe gravity, friction, air resistance and tension", keyVocabulary: ["force", "gravity", "friction", "contact force"] },
      { id: "science-forces-2", title: "Balanced and Unbalanced Forces", description: "Explain the effect of balanced and unbalanced forces on motion; resultant force", keyVocabulary: ["balanced", "unbalanced", "resultant force", "stationary"] },
      { id: "science-forces-3", title: "Speed, Distance and Time", description: "Calculate speed using speed = distance ÷ time; interpret distance-time graphs", keyVocabulary: ["speed", "distance", "time", "distance-time graph"] },
      { id: "science-forces-4", title: "Newton's Laws", description: "Apply Newton's three laws of motion to explain everyday situations", keyVocabulary: ["Newton's first law", "Newton's second law", "acceleration", "mass"] },
    ],
  },
  {
    topicId: "science-cells",
    topicName: "Cells — Structure and Function",
    subject: "science",
    steps: [
      { id: "science-cells-1", title: "Animal and Plant Cells", description: "Label and describe the key parts of animal and plant cells; identify differences", keyVocabulary: ["nucleus", "cell membrane", "cytoplasm", "cell wall", "chloroplast"] },
      { id: "science-cells-2", title: "Specialised Cells", description: "Describe how specialised cells are adapted for their function", keyVocabulary: ["specialised", "adapted", "red blood cell", "nerve cell", "root hair cell"] },
      { id: "science-cells-3", title: "Cell Division", description: "Describe mitosis and explain why cells divide; growth and repair", keyVocabulary: ["mitosis", "cell division", "chromosome", "growth"] },
    ],
  },
  {
    topicId: "science-photosynthesis",
    topicName: "Photosynthesis",
    subject: "science",
    steps: [
      { id: "science-photo-1", title: "The Photosynthesis Equation", description: "Write and explain the word equation for photosynthesis; identify reactants and products", keyVocabulary: ["photosynthesis", "carbon dioxide", "water", "glucose", "oxygen"] },
      { id: "science-photo-2", title: "Factors Affecting Photosynthesis", description: "Explain how light intensity, CO2 concentration and temperature affect the rate of photosynthesis", keyVocabulary: ["limiting factor", "light intensity", "rate", "chlorophyll"] },
      { id: "science-photo-3", title: "Leaf Structure", description: "Describe the structure of a leaf and explain how it is adapted for photosynthesis", keyVocabulary: ["palisade cell", "stomata", "chloroplast", "adaptation"] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HISTORY
  // ─────────────────────────────────────────────────────────────────────────
  {
    topicId: "history-world-war-1",
    topicName: "World War One",
    subject: "history",
    steps: [
      { id: "history-ww1-1", title: "Causes of WWI", description: "Explain the long and short-term causes of WWI using MAIN (Militarism, Alliances, Imperialism, Nationalism)", keyVocabulary: ["militarism", "alliance", "imperialism", "nationalism", "assassination"] },
      { id: "history-ww1-2", title: "Trench Warfare", description: "Describe conditions in the trenches; explain the stalemate on the Western Front", keyVocabulary: ["trench", "no man's land", "stalemate", "Western Front"] },
      { id: "history-ww1-3", title: "Key Battles and Turning Points", description: "Describe key battles (Somme, Passchendaele) and explain why they were significant", keyVocabulary: ["Battle of the Somme", "turning point", "casualties", "significance"] },
      { id: "history-ww1-4", title: "End of WWI and Legacy", description: "Explain why WWI ended and evaluate the impact of the Treaty of Versailles", keyVocabulary: ["armistice", "Treaty of Versailles", "reparations", "legacy"] },
    ],
  },
  {
    topicId: "history-world-war-2",
    topicName: "World War Two",
    subject: "history",
    steps: [
      { id: "history-ww2-1", title: "Causes of WWII", description: "Explain how the Treaty of Versailles, the Great Depression and the rise of Hitler led to WWII", keyVocabulary: ["Hitler", "Nazi", "appeasement", "invasion of Poland"] },
      { id: "history-ww2-2", title: "The Holocaust", description: "Describe the persecution of Jewish people and others; explain how the Holocaust happened", keyVocabulary: ["Holocaust", "persecution", "genocide", "concentration camp"] },
      { id: "history-ww2-3", title: "Key Events and Turning Points", description: "Describe key events (Dunkirk, D-Day, Blitz) and explain their significance", keyVocabulary: ["Dunkirk", "D-Day", "Blitz", "turning point"] },
      { id: "history-ww2-4", title: "End of WWII and Aftermath", description: "Explain why WWII ended and evaluate the impact on the world including the Cold War", keyVocabulary: ["VE Day", "atomic bomb", "United Nations", "Cold War"] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GEOGRAPHY
  // ─────────────────────────────────────────────────────────────────────────
  {
    topicId: "geography-rivers",
    topicName: "Rivers",
    subject: "geography",
    steps: [
      { id: "geography-rivers-1", title: "The Water Cycle", description: "Describe the stages of the water cycle: evaporation, condensation, precipitation, run-off", keyVocabulary: ["evaporation", "condensation", "precipitation", "run-off"] },
      { id: "geography-rivers-2", title: "River Processes", description: "Explain erosion, transportation and deposition processes in rivers", keyVocabulary: ["erosion", "transportation", "deposition", "hydraulic action", "abrasion"] },
      { id: "geography-rivers-3", title: "River Landforms", description: "Describe and explain how V-shaped valleys, waterfalls, meanders and oxbow lakes form", keyVocabulary: ["V-shaped valley", "waterfall", "meander", "oxbow lake"] },
      { id: "geography-rivers-4", title: "River Flooding", description: "Explain the causes and effects of river flooding; evaluate flood management strategies", keyVocabulary: ["flood", "flood plain", "hard engineering", "soft engineering"] },
    ],
  },
  {
    topicId: "geography-climate-change",
    topicName: "Climate Change",
    subject: "geography",
    steps: [
      { id: "geography-cc-1", title: "The Greenhouse Effect", description: "Explain the natural and enhanced greenhouse effect; identify greenhouse gases", keyVocabulary: ["greenhouse gas", "carbon dioxide", "methane", "global warming"] },
      { id: "geography-cc-2", title: "Causes of Climate Change", description: "Distinguish between natural and human causes of climate change", keyVocabulary: ["deforestation", "fossil fuels", "natural causes", "human activity"] },
      { id: "geography-cc-3", title: "Effects of Climate Change", description: "Describe the effects of climate change on people and the environment globally", keyVocabulary: ["sea level rise", "extreme weather", "biodiversity", "food security"] },
      { id: "geography-cc-4", title: "Responses to Climate Change", description: "Evaluate mitigation and adaptation strategies at local, national and global scales", keyVocabulary: ["mitigation", "adaptation", "renewable energy", "Paris Agreement"] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MODERN FOREIGN LANGUAGES (MFL)
  // ─────────────────────────────────────────────────────────────────────────
  {
    topicId: "mfl-present-tense",
    topicName: "Present Tense Verbs",
    subject: "mfl",
    steps: [
      { id: "mfl-present-1", title: "Regular Verbs", description: "Conjugate regular -ar/-er/-ir (or equivalent) verbs in the present tense", keyVocabulary: ["conjugate", "verb", "present tense", "regular"] },
      { id: "mfl-present-2", title: "Common Irregular Verbs", description: "Use common irregular verbs (to be, to have, to go) in the present tense", keyVocabulary: ["irregular", "ser/estar", "avoir/être", "to be", "to have"] },
      { id: "mfl-present-3", title: "Negatives and Questions", description: "Form negative sentences and questions in the present tense", keyVocabulary: ["negative", "question", "ne...pas", "no", "interrogative"] },
    ],
  },
];

/**
 * Get the progression for a specific topic by subject and topic name (fuzzy match)
 */
export function getProgressionForTopic(subject: string, topicName: string): TopicProgression | null {
  const subjectLower = subject.toLowerCase();
  const topicLower = topicName.toLowerCase();
  return CURRICULUM_PROGRESSIONS.find(p =>
    p.subject === subjectLower &&
    (p.topicName.toLowerCase() === topicLower ||
     p.topicName.toLowerCase().includes(topicLower) ||
     topicLower.includes(p.topicName.toLowerCase().split(' ')[0].toLowerCase()))
  ) || null;
}

/**
 * Get all progressions for a subject
 */
export function getProgressionsForSubject(subject: string): TopicProgression[] {
  return CURRICULUM_PROGRESSIONS.filter(p => p.subject === subject.toLowerCase());
}

/**
 * Get the next step in a progression given the current step index
 * Returns null if already at the last step
 */
export function getNextStep(progression: TopicProgression, currentStepIndex: number): SkillStep | null {
  if (currentStepIndex >= progression.steps.length - 1) return null;
  return progression.steps[currentStepIndex + 1];
}

/**
 * Determine the recommended next step based on performance
 * If score >= threshold, advance; otherwise repeat current step
 */
export function getRecommendedStep(
  progression: TopicProgression,
  currentStepIndex: number,
  lastScore: number,
  masteryThreshold = 70
): { step: SkillStep; shouldAdvance: boolean; reason: string } {
  const currentStep = progression.steps[currentStepIndex];
  if (lastScore >= masteryThreshold && currentStepIndex < progression.steps.length - 1) {
    const nextStep = progression.steps[currentStepIndex + 1];
    return {
      step: nextStep,
      shouldAdvance: true,
      reason: `Great work! Score ${lastScore}% — ready to move on to the next step.`,
    };
  } else if (lastScore >= masteryThreshold && currentStepIndex === progression.steps.length - 1) {
    return {
      step: currentStep,
      shouldAdvance: false,
      reason: `Topic complete! Score ${lastScore}% — all steps mastered.`,
    };
  } else {
    return {
      step: currentStep,
      shouldAdvance: false,
      reason: `Score ${lastScore}% — let's practise this step a bit more before moving on.`,
    };
  }
}
