/**
 * syllabus-data.ts
 * Comprehensive UK National Curriculum syllabus data.
 * Maps every subject to year-group-appropriate topics for Primary (Y1-6),
 * Secondary (Y7-11), and College/Sixth Form (Y12-13).
 *
 * Sources:
 * - DfE National Curriculum programmes of study (KS1-KS4)
 * - Oak National Academy curriculum sequences
 * - AQA, Edexcel, OCR GCSE and A-Level specifications
 */

export interface SyllabusTopic {
  topic: string;
  keyVocabulary: string[];
  yearGroup?: string; // originating year group label, e.g. "Year 7"
}

export type YearGroupKey =
  | "Year 1" | "Year 2" | "Year 3" | "Year 4" | "Year 5" | "Year 6"
  | "Year 7" | "Year 8" | "Year 9" | "Year 10" | "Year 11"
  | "Year 12" | "Year 13" | "11+ Preparation";

/**
 * SYLLABUS_DATA[subjectId][yearGroup] → SyllabusTopic[]
 * When a teacher selects a subject + year group, the UI should offer
 * these topics as suggestions (dropdown or autocomplete).
 */
export const SYLLABUS_DATA: Record<string, Partial<Record<YearGroupKey, SyllabusTopic[]>>> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS
  // ═══════════════════════════════════════════════════════════════════════════
  mathematics: {
    "Year 1": [
      { topic: "Counting and Number Recognition (to 20)", keyVocabulary: ["count", "number", "digit", "order"] },
      { topic: "Counting in 2s, 5s and 10s", keyVocabulary: ["skip count", "pattern", "sequence", "multiple"] },
      { topic: "Addition and Subtraction (within 20)", keyVocabulary: ["add", "subtract", "total", "difference"] },
      { topic: "Place Value (Tens and Ones)", keyVocabulary: ["tens", "ones", "place value", "partition"] },
      { topic: "2D and 3D Shapes", keyVocabulary: ["circle", "square", "triangle", "cube", "sphere"] },
      { topic: "Measurement — Length and Height", keyVocabulary: ["long", "short", "tall", "measure"] },
      { topic: "Measurement — Weight and Capacity", keyVocabulary: ["heavy", "light", "full", "empty"] },
      { topic: "Time — O'clock and Half Past", keyVocabulary: ["o'clock", "half past", "hour", "clock"] },
      { topic: "Money — Recognising Coins", keyVocabulary: ["penny", "pound", "coin", "note"] },
      { topic: "Position and Direction", keyVocabulary: ["left", "right", "above", "below", "turn"] },
    ],
    "Year 2": [
      { topic: "Place Value (to 100)", keyVocabulary: ["tens", "ones", "compare", "order"] },
      { topic: "Addition and Subtraction (Two-Digit Numbers)", keyVocabulary: ["add", "subtract", "regroup", "column"] },
      { topic: "Multiplication and Division (2, 5, 10 Times Tables)", keyVocabulary: ["multiply", "divide", "groups of", "share"] },
      { topic: "Fractions (Halves, Quarters, Thirds)", keyVocabulary: ["half", "quarter", "third", "equal parts"] },
      { topic: "Measurement — cm, m, kg, g, ml, l", keyVocabulary: ["centimetre", "metre", "kilogram", "litre"] },
      { topic: "Time — Quarter Past and Quarter To", keyVocabulary: ["quarter past", "quarter to", "minutes", "duration"] },
      { topic: "Statistics — Tally Charts and Pictograms", keyVocabulary: ["tally", "pictogram", "data", "count"] },
      { topic: "Properties of 2D and 3D Shapes", keyVocabulary: ["sides", "vertices", "edges", "faces", "symmetry"] },
      { topic: "Money — Making Amounts and Giving Change", keyVocabulary: ["total", "change", "cost", "price"] },
    ],
    "Year 3": [
      { topic: "Place Value (to 1000)", keyVocabulary: ["hundreds", "tens", "ones", "thousand"] },
      { topic: "Addition and Subtraction (3-Digit Numbers)", keyVocabulary: ["column addition", "column subtraction", "exchange", "estimate"] },
      { topic: "Multiplication and Division (3, 4, 8 Times Tables)", keyVocabulary: ["times table", "product", "quotient", "remainder"] },
      { topic: "Fractions — Unit and Non-Unit Fractions", keyVocabulary: ["numerator", "denominator", "unit fraction", "equivalent"] },
      { topic: "Measurement — Perimeter", keyVocabulary: ["perimeter", "length", "width", "total distance"] },
      { topic: "Time — Analogue and Digital (12-Hour)", keyVocabulary: ["analogue", "digital", "a.m.", "p.m."] },
      { topic: "Angles — Right Angles and Turns", keyVocabulary: ["right angle", "quarter turn", "half turn", "full turn"] },
      { topic: "Statistics — Bar Charts and Tables", keyVocabulary: ["bar chart", "table", "axis", "label"] },
    ],
    "Year 4": [
      { topic: "Place Value (to 10,000)", keyVocabulary: ["thousands", "ten thousands", "round", "compare"] },
      { topic: "Addition and Subtraction (4-Digit Numbers)", keyVocabulary: ["column method", "estimate", "inverse", "check"] },
      { topic: "Multiplication and Division (Times Tables to 12×12)", keyVocabulary: ["factor", "multiple", "product", "short multiplication"] },
      { topic: "Fractions and Decimals (Tenths, Hundredths)", keyVocabulary: ["tenth", "hundredth", "decimal point", "equivalent fraction"] },
      { topic: "Measurement — Area", keyVocabulary: ["area", "square centimetre", "length", "width"] },
      { topic: "Time — 24-Hour Clock", keyVocabulary: ["24-hour", "convert", "duration", "timetable"] },
      { topic: "Angles — Acute, Obtuse and Right Angles", keyVocabulary: ["acute", "obtuse", "right angle", "degrees"] },
      { topic: "Coordinates in the First Quadrant", keyVocabulary: ["coordinate", "x-axis", "y-axis", "plot"] },
      { topic: "Statistics — Line Graphs", keyVocabulary: ["line graph", "axis", "scale", "interpret"] },
      { topic: "Roman Numerals", keyVocabulary: ["I", "V", "X", "L", "C"] },
    ],
    "Year 5": [
      { topic: "Place Value (to 1,000,000)", keyVocabulary: ["million", "round", "negative number", "compare"] },
      { topic: "Addition and Subtraction (Large Numbers)", keyVocabulary: ["mental strategies", "estimate", "inverse", "multi-step"] },
      { topic: "Multiplication and Division (Multi-Digit)", keyVocabulary: ["long multiplication", "short division", "factor", "prime"] },
      { topic: "Fractions — Adding and Subtracting", keyVocabulary: ["common denominator", "equivalent", "simplify", "mixed number"] },
      { topic: "Decimals and Percentages", keyVocabulary: ["decimal", "percentage", "convert", "fraction"] },
      { topic: "Measurement — Converting Units", keyVocabulary: ["convert", "metric", "kilometre", "millilitre"] },
      { topic: "Measurement — Volume", keyVocabulary: ["volume", "cubic centimetre", "capacity", "estimate"] },
      { topic: "Angles — Measuring with a Protractor", keyVocabulary: ["protractor", "degrees", "angle on a line", "reflex"] },
      { topic: "Properties of Shapes — Regular and Irregular Polygons", keyVocabulary: ["regular", "irregular", "polygon", "interior angle"] },
      { topic: "Position and Direction — Reflection and Translation", keyVocabulary: ["reflect", "translate", "mirror line", "coordinate"] },
      { topic: "Statistics — Tables and Timetables", keyVocabulary: ["two-way table", "timetable", "interpret", "compare"] },
    ],
    "Year 6": [
      { topic: "Place Value (to 10,000,000 and Negative Numbers)", keyVocabulary: ["ten million", "negative", "round", "order"] },
      { topic: "Four Operations and Order of Operations", keyVocabulary: ["BODMAS", "long division", "multi-step", "estimate"] },
      { topic: "Fractions — All Operations", keyVocabulary: ["multiply fractions", "divide fractions", "mixed number", "simplify"] },
      { topic: "Decimals — All Operations", keyVocabulary: ["decimal places", "multiply decimals", "divide decimals", "round"] },
      { topic: "Percentages of Amounts", keyVocabulary: ["percentage", "of", "amount", "calculate"] },
      { topic: "Ratio and Proportion", keyVocabulary: ["ratio", "proportion", "scale", "simplify"] },
      { topic: "Algebra — Simple Formulae and Sequences", keyVocabulary: ["formula", "variable", "sequence", "nth term"] },
      { topic: "Measurement — Area of Triangles and Parallelograms", keyVocabulary: ["base", "height", "area", "formula"] },
      { topic: "Properties of Shapes — Angles in Shapes", keyVocabulary: ["angle sum", "triangle", "quadrilateral", "missing angle"] },
      { topic: "Position and Direction — Four Quadrants", keyVocabulary: ["quadrant", "negative coordinate", "reflect", "translate"] },
      { topic: "Statistics — Pie Charts and Mean", keyVocabulary: ["pie chart", "mean", "average", "interpret"] },
    ],
    "Year 7": [
      { topic: "Place Value and Ordering Integers", keyVocabulary: ["integer", "place value", "compare", "order"] },
      { topic: "Four Operations with Integers", keyVocabulary: ["addition", "subtraction", "multiplication", "division"] },
      { topic: "Factors, Multiples and Primes", keyVocabulary: ["factor", "multiple", "prime", "HCF", "LCM"] },
      { topic: "Fractions, Decimals and Percentages", keyVocabulary: ["convert", "equivalent", "fraction", "decimal", "percentage"] },
      { topic: "Introduction to Algebra", keyVocabulary: ["variable", "expression", "simplify", "substitute"] },
      { topic: "Coordinates and Linear Graphs", keyVocabulary: ["coordinate", "plot", "linear", "gradient"] },
      { topic: "Angles and Lines", keyVocabulary: ["acute", "obtuse", "reflex", "vertically opposite", "parallel"] },
      { topic: "Area and Perimeter", keyVocabulary: ["area", "perimeter", "formula", "compound shape"] },
      { topic: "Statistics — Mean, Median, Mode, Range", keyVocabulary: ["mean", "median", "mode", "range"] },
    ],
    "Year 8": [
      { topic: "Ratio and Proportion", keyVocabulary: ["ratio", "proportion", "unitary method", "scale"] },
      { topic: "Expressions and Equations", keyVocabulary: ["expand", "factorise", "solve", "equation"] },
      { topic: "Sequences", keyVocabulary: ["term", "nth term", "arithmetic", "geometric"] },
      { topic: "Real-Life Graphs", keyVocabulary: ["distance-time", "conversion", "interpret", "gradient"] },
      { topic: "Transformations", keyVocabulary: ["reflection", "rotation", "translation", "enlargement"] },
      { topic: "Constructions and Loci", keyVocabulary: ["compass", "bisector", "locus", "perpendicular"] },
      { topic: "Probability", keyVocabulary: ["probability", "event", "outcome", "sample space"] },
      { topic: "3D Shapes and Volume", keyVocabulary: ["prism", "cylinder", "volume", "surface area"] },
      { topic: "Percentages — Increase and Decrease", keyVocabulary: ["percentage increase", "percentage decrease", "multiplier", "original"] },
    ],
    "Year 9": [
      { topic: "Standard Form", keyVocabulary: ["standard form", "power of 10", "convert", "calculate"] },
      { topic: "Indices and Roots", keyVocabulary: ["index", "power", "square root", "cube root", "laws of indices"] },
      { topic: "Linear Equations and Inequalities", keyVocabulary: ["solve", "inequality", "number line", "integer solutions"] },
      { topic: "Simultaneous Equations (Introduction)", keyVocabulary: ["simultaneous", "elimination", "substitution", "solution"] },
      { topic: "Pythagoras' Theorem", keyVocabulary: ["hypotenuse", "right angle", "square root", "theorem"] },
      { topic: "Trigonometry (Introduction)", keyVocabulary: ["sine", "cosine", "tangent", "opposite", "adjacent"] },
      { topic: "Scatter Graphs and Correlation", keyVocabulary: ["scatter graph", "correlation", "line of best fit", "outlier"] },
      { topic: "Compound Measures", keyVocabulary: ["speed", "density", "pressure", "formula"] },
    ],
    "Year 10": [
      { topic: "Surds", keyVocabulary: ["surd", "simplify", "rationalise", "denominator"] },
      { topic: "Algebraic Fractions", keyVocabulary: ["algebraic fraction", "simplify", "add", "multiply"] },
      { topic: "Quadratic Equations", keyVocabulary: ["quadratic", "factorise", "formula", "completing the square"] },
      { topic: "Simultaneous Equations", keyVocabulary: ["linear", "quadratic", "elimination", "substitution"] },
      { topic: "Inequalities (Graphical)", keyVocabulary: ["inequality", "region", "boundary", "shading"] },
      { topic: "Circle Theorems", keyVocabulary: ["tangent", "chord", "arc", "theorem", "cyclic quadrilateral"] },
      { topic: "Trigonometry — Sine and Cosine Rules", keyVocabulary: ["sine rule", "cosine rule", "area of triangle", "non-right-angled"] },
      { topic: "Vectors", keyVocabulary: ["vector", "magnitude", "direction", "column vector"] },
      { topic: "Probability — Tree Diagrams and Conditional", keyVocabulary: ["tree diagram", "conditional", "independent", "dependent"] },
      { topic: "Histograms and Cumulative Frequency", keyVocabulary: ["histogram", "frequency density", "cumulative frequency", "box plot"] },
    ],
    "Year 11": [
      { topic: "Direct and Inverse Proportion", keyVocabulary: ["direct proportion", "inverse proportion", "constant", "graph"] },
      { topic: "Iteration", keyVocabulary: ["iteration", "formula", "converge", "decimal search"] },
      { topic: "Functions and Transformations of Graphs", keyVocabulary: ["function", "transformation", "translate", "stretch"] },
      { topic: "Growth and Decay", keyVocabulary: ["exponential", "growth", "decay", "multiplier"] },
      { topic: "Similarity and Congruence", keyVocabulary: ["similar", "congruent", "scale factor", "proof"] },
      { topic: "Area and Volume — Cones, Spheres, Pyramids", keyVocabulary: ["cone", "sphere", "pyramid", "frustum"] },
      { topic: "Bounds", keyVocabulary: ["upper bound", "lower bound", "error interval", "truncation"] },
      { topic: "Proof", keyVocabulary: ["prove", "show that", "algebraic proof", "counter-example"] },
    ],
    "Year 12": [
      { topic: "Proof", keyVocabulary: ["proof by deduction", "proof by exhaustion", "disproof", "counter-example"] },
      { topic: "Algebra and Functions", keyVocabulary: ["polynomial", "factor theorem", "remainder theorem", "partial fractions"] },
      { topic: "Coordinate Geometry", keyVocabulary: ["straight line", "circle", "parametric", "equation"] },
      { topic: "Sequences and Series", keyVocabulary: ["arithmetic", "geometric", "sigma notation", "sum to n terms"] },
      { topic: "Trigonometry", keyVocabulary: ["radian", "arc length", "sector area", "trigonometric identity"] },
      { topic: "Exponentials and Logarithms", keyVocabulary: ["exponential", "logarithm", "natural log", "laws of logs"] },
      { topic: "Differentiation", keyVocabulary: ["derivative", "gradient", "tangent", "normal", "chain rule"] },
      { topic: "Integration", keyVocabulary: ["integral", "area under curve", "definite", "indefinite"] },
      { topic: "Vectors", keyVocabulary: ["position vector", "magnitude", "scalar product", "unit vector"] },
      { topic: "Statistical Sampling and Data Presentation", keyVocabulary: ["sampling", "histogram", "cumulative frequency", "box plot"] },
      { topic: "Probability and Statistical Distributions", keyVocabulary: ["binomial", "probability", "distribution", "expected value"] },
      { topic: "Kinematics", keyVocabulary: ["displacement", "velocity", "acceleration", "suvat"] },
      { topic: "Forces and Newton's Laws", keyVocabulary: ["Newton's laws", "resultant force", "equilibrium", "friction"] },
    ],
    "Year 13": [
      { topic: "Further Algebra", keyVocabulary: ["partial fractions", "binomial expansion", "algebraic division", "modulus"] },
      { topic: "Functions and Modelling", keyVocabulary: ["composite function", "inverse function", "modelling", "domain"] },
      { topic: "Trigonometry — Further Identities", keyVocabulary: ["double angle", "addition formulae", "R cos/sin", "harmonic form"] },
      { topic: "Differentiation — Further Methods", keyVocabulary: ["product rule", "quotient rule", "implicit", "parametric"] },
      { topic: "Integration — Further Methods", keyVocabulary: ["integration by parts", "substitution", "partial fractions", "differential equations"] },
      { topic: "Numerical Methods", keyVocabulary: ["Newton-Raphson", "trapezium rule", "iteration", "sign change"] },
      { topic: "Hypothesis Testing", keyVocabulary: ["null hypothesis", "alternative hypothesis", "significance level", "critical value"] },
      { topic: "Normal Distribution", keyVocabulary: ["normal distribution", "z-score", "standard deviation", "probability"] },
      { topic: "Moments", keyVocabulary: ["moment", "torque", "equilibrium", "pivot"] },
      { topic: "Projectiles", keyVocabulary: ["projectile", "trajectory", "range", "maximum height"] },
    ],
    "11+ Preparation": [
      { topic: "Arithmetic — Four Operations", keyVocabulary: ["add", "subtract", "multiply", "divide"] },
      { topic: "Fractions, Decimals and Percentages", keyVocabulary: ["fraction", "decimal", "percentage", "convert"] },
      { topic: "Ratio and Proportion", keyVocabulary: ["ratio", "proportion", "share", "scale"] },
      { topic: "Algebra and Sequences", keyVocabulary: ["sequence", "pattern", "rule", "missing number"] },
      { topic: "Geometry — Area, Perimeter and Volume", keyVocabulary: ["area", "perimeter", "volume", "formula"] },
      { topic: "Word Problems and Problem Solving", keyVocabulary: ["solve", "method", "working out", "answer"] },
      { topic: "Data Handling and Statistics", keyVocabulary: ["mean", "chart", "table", "interpret"] },
      { topic: "Verbal Reasoning — Word Codes and Analogies", keyVocabulary: ["code", "analogy", "pattern", "sequence"] },
      { topic: "Non-Verbal Reasoning — Patterns and Shapes", keyVocabulary: ["pattern", "rotation", "reflection", "odd one out"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════════════════════════════════
  english: {
    "Year 1": [
      { topic: "Phonics and Decoding", keyVocabulary: ["phoneme", "grapheme", "blend", "segment"] },
      { topic: "Common Exception Words", keyVocabulary: ["the", "said", "was", "because"] },
      { topic: "Capital Letters and Full Stops", keyVocabulary: ["capital letter", "full stop", "sentence", "finger space"] },
      { topic: "Joining Words with 'and'", keyVocabulary: ["and", "join", "sentence", "conjunction"] },
      { topic: "Sequencing Sentences to Form Narratives", keyVocabulary: ["beginning", "middle", "end", "story"] },
      { topic: "Labels, Lists and Captions", keyVocabulary: ["label", "list", "caption", "describe"] },
    ],
    "Year 2": [
      { topic: "Expanded Noun Phrases", keyVocabulary: ["noun", "adjective", "expanded noun phrase", "describe"] },
      { topic: "Past and Present Tense", keyVocabulary: ["past tense", "present tense", "verb", "-ed ending"] },
      { topic: "Subordination and Coordination", keyVocabulary: ["when", "if", "because", "and", "but", "or"] },
      { topic: "Apostrophes — Contractions and Possession", keyVocabulary: ["apostrophe", "contraction", "possession", "it's/its"] },
      { topic: "Commas in Lists", keyVocabulary: ["comma", "list", "separate", "items"] },
      { topic: "Reading Comprehension — Prediction and Inference", keyVocabulary: ["predict", "infer", "evidence", "clue"] },
      { topic: "Writing Narratives and Recounts", keyVocabulary: ["narrative", "recount", "time words", "sequence"] },
    ],
    "Year 3": [
      { topic: "Paragraphs", keyVocabulary: ["paragraph", "topic sentence", "indent", "organise"] },
      { topic: "Headings and Subheadings", keyVocabulary: ["heading", "subheading", "non-fiction", "organise"] },
      { topic: "Prepositions", keyVocabulary: ["preposition", "before", "after", "during", "above"] },
      { topic: "Conjunctions — when, before, after, while", keyVocabulary: ["conjunction", "subordinate clause", "main clause", "complex sentence"] },
      { topic: "Present Perfect Tense", keyVocabulary: ["present perfect", "has/have", "past participle", "tense"] },
      { topic: "Inverted Commas (Speech Marks)", keyVocabulary: ["speech marks", "inverted commas", "dialogue", "said"] },
      { topic: "Prefixes and Suffixes", keyVocabulary: ["prefix", "suffix", "un-", "dis-", "-ness", "-ful"] },
    ],
    "Year 4": [
      { topic: "Fronted Adverbials", keyVocabulary: ["fronted adverbial", "comma", "time", "place", "manner"] },
      { topic: "Paragraphs Organised Around a Theme", keyVocabulary: ["theme", "topic sentence", "cohesion", "link"] },
      { topic: "Pronouns and Nouns for Cohesion", keyVocabulary: ["pronoun", "noun", "cohesion", "he/she/they"] },
      { topic: "Possessive Apostrophes (Plural)", keyVocabulary: ["possessive", "plural", "apostrophe", "girls'/children's"] },
      { topic: "Standard English Verb Forms", keyVocabulary: ["standard English", "was/were", "did/done", "formal"] },
      { topic: "Expanded Noun Phrases with Modifiers", keyVocabulary: ["modifier", "prepositional phrase", "expanded", "detail"] },
      { topic: "Dictionary and Thesaurus Skills", keyVocabulary: ["dictionary", "thesaurus", "synonym", "definition"] },
    ],
    "Year 5": [
      { topic: "Relative Clauses", keyVocabulary: ["relative clause", "who", "which", "that", "whose"] },
      { topic: "Modal Verbs", keyVocabulary: ["modal verb", "could", "should", "might", "must"] },
      { topic: "Parenthesis — Brackets, Dashes, Commas", keyVocabulary: ["parenthesis", "brackets", "dashes", "embedded clause"] },
      { topic: "Cohesive Devices", keyVocabulary: ["cohesion", "adverbial", "conjunction", "pronoun"] },
      { topic: "Formal and Informal Writing", keyVocabulary: ["formal", "informal", "tone", "register"] },
      { topic: "Verb Prefixes (dis-, de-, mis-, over-, re-)", keyVocabulary: ["prefix", "dis-", "mis-", "re-", "meaning"] },
      { topic: "Reading — Summarising and Inference", keyVocabulary: ["summarise", "infer", "evidence", "main idea"] },
    ],
    "Year 6": [
      { topic: "Passive and Active Voice", keyVocabulary: ["passive voice", "active voice", "subject", "agent"] },
      { topic: "Subjunctive Mood", keyVocabulary: ["subjunctive", "formal", "if I were", "that he be"] },
      { topic: "Semi-Colons, Colons and Dashes", keyVocabulary: ["semi-colon", "colon", "dash", "independent clause"] },
      { topic: "Hyphens", keyVocabulary: ["hyphen", "compound word", "man-eating", "well-known"] },
      { topic: "Synonyms and Antonyms", keyVocabulary: ["synonym", "antonym", "vocabulary", "word choice"] },
      { topic: "Formal and Informal Register", keyVocabulary: ["register", "formal", "informal", "audience"] },
      { topic: "Reading — Comparison and Critical Analysis", keyVocabulary: ["compare", "contrast", "evaluate", "author's purpose"] },
    ],
    "Year 7": [
      { topic: "Nouns, Verbs and Adjectives", keyVocabulary: ["noun", "verb", "adjective", "modify"] },
      { topic: "Sentence Structure and Punctuation", keyVocabulary: ["clause", "phrase", "comma", "full stop"] },
      { topic: "Descriptive Writing", keyVocabulary: ["imagery", "simile", "metaphor", "atmosphere"] },
      { topic: "Narrative Writing — Story Structure", keyVocabulary: ["exposition", "climax", "resolution", "protagonist"] },
      { topic: "Reading Comprehension — Inference", keyVocabulary: ["infer", "imply", "evidence", "quote"] },
      { topic: "Poetry — Rhyme and Rhythm", keyVocabulary: ["rhyme", "rhythm", "stanza", "verse"] },
      { topic: "Non-Fiction — Report Writing", keyVocabulary: ["formal", "objective", "subheading", "fact"] },
    ],
    "Year 8": [
      { topic: "Persuasive Writing", keyVocabulary: ["argument", "evidence", "rhetorical question", "counter-argument"] },
      { topic: "Figurative Language", keyVocabulary: ["personification", "alliteration", "onomatopoeia", "hyperbole"] },
      { topic: "Vocabulary in Context", keyVocabulary: ["context", "connotation", "denotation", "synonym"] },
      { topic: "Spoken Language — Debate and Discussion", keyVocabulary: ["perspective", "bias", "tone", "register"] },
      { topic: "Shakespeare — Introduction", keyVocabulary: ["playwright", "Elizabethan", "iambic pentameter", "soliloquy"] },
      { topic: "Gothic and Horror Writing", keyVocabulary: ["gothic", "suspense", "tension", "pathetic fallacy"] },
      { topic: "Media and Non-Fiction Texts", keyVocabulary: ["bias", "audience", "purpose", "headline"] },
    ],
    "Year 9": [
      { topic: "Shakespeare — Key Themes and Characters", keyVocabulary: ["theme", "tragedy", "soliloquy", "dramatic irony"] },
      { topic: "19th Century Fiction", keyVocabulary: ["Victorian", "narrator", "social class", "morality"] },
      { topic: "Poetry Analysis", keyVocabulary: ["imagery", "structure", "form", "tone", "enjambment"] },
      { topic: "Transactional Writing — Letters and Articles", keyVocabulary: ["formal letter", "article", "audience", "purpose"] },
      { topic: "Analytical Essay Writing", keyVocabulary: ["thesis", "evidence", "analysis", "conclusion"] },
      { topic: "Creative Writing — Narrative and Descriptive", keyVocabulary: ["narrative voice", "setting", "characterisation", "tension"] },
    ],
    "Year 10": [
      { topic: "Shakespeare — Macbeth / Romeo and Juliet", keyVocabulary: ["tragedy", "ambition", "fate", "soliloquy", "dramatic irony"] },
      { topic: "19th Century Novel — A Christmas Carol / Jekyll and Hyde", keyVocabulary: ["Victorian", "morality", "duality", "social responsibility"] },
      { topic: "Modern Text — An Inspector Calls / Lord of the Flies", keyVocabulary: ["social class", "responsibility", "allegory", "power"] },
      { topic: "Poetry Anthology — Power and Conflict / Love and Relationships", keyVocabulary: ["comparison", "structure", "imagery", "context"] },
      { topic: "Language Paper 1 — Fiction Reading and Creative Writing", keyVocabulary: ["inference", "language analysis", "structure", "evaluate"] },
      { topic: "Language Paper 2 — Non-Fiction Reading and Transactional Writing", keyVocabulary: ["viewpoint", "compare", "persuade", "argue"] },
    ],
    "Year 11": [
      { topic: "Unseen Poetry", keyVocabulary: ["unseen", "comparison", "analysis", "interpretation"] },
      { topic: "Revision — Shakespeare Set Text", keyVocabulary: ["extract", "context", "theme", "character development"] },
      { topic: "Revision — 19th Century Novel", keyVocabulary: ["quotation", "analysis", "context", "theme"] },
      { topic: "Revision — Modern Text", keyVocabulary: ["theme", "character", "context", "essay structure"] },
      { topic: "Exam Technique — Language Papers", keyVocabulary: ["timing", "structure", "evidence", "analysis"] },
      { topic: "Exam Technique — Literature Papers", keyVocabulary: ["essay planning", "quotation", "context", "conclusion"] },
    ],
    "Year 12": [
      { topic: "Introduction to Literary Theory", keyVocabulary: ["feminism", "Marxism", "post-colonialism", "structuralism"] },
      { topic: "Poetry — Pre-1900 and Post-1900", keyVocabulary: ["Romantic", "modernist", "form", "voice"] },
      { topic: "Prose Study — Novel Analysis", keyVocabulary: ["narrative technique", "characterisation", "theme", "context"] },
      { topic: "Drama Study", keyVocabulary: ["tragedy", "comedy", "staging", "dramatic technique"] },
      { topic: "Language Investigation (English Language)", keyVocabulary: ["sociolect", "idiolect", "register", "discourse"] },
      { topic: "Original Writing and Commentary", keyVocabulary: ["genre", "voice", "style", "commentary"] },
    ],
    "Year 13": [
      { topic: "Comparative Literature", keyVocabulary: ["compare", "contrast", "intertextuality", "thematic link"] },
      { topic: "Critical Anthology and Theory", keyVocabulary: ["critical theory", "interpretation", "evaluation", "argument"] },
      { topic: "Language Change and Development", keyVocabulary: ["etymology", "semantic change", "standardisation", "globalisation"] },
      { topic: "NEA — Non-Exam Assessment Coursework", keyVocabulary: ["independent study", "research", "analysis", "evaluation"] },
    ],
    "11+ Preparation": [
      { topic: "Reading Comprehension", keyVocabulary: ["comprehension", "inference", "evidence", "main idea"] },
      { topic: "Vocabulary and Spelling", keyVocabulary: ["synonym", "antonym", "spelling", "definition"] },
      { topic: "Grammar and Punctuation", keyVocabulary: ["clause", "punctuation", "tense", "conjunction"] },
      { topic: "Creative Writing", keyVocabulary: ["narrative", "describe", "character", "setting"] },
      { topic: "Verbal Reasoning", keyVocabulary: ["code", "analogy", "word pattern", "sequence"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCIENCE
  // ═══════════════════════════════════════════════════════════════════════════
  science: {
    "Year 1": [
      { topic: "Naming and Grouping Animals", keyVocabulary: ["mammal", "bird", "fish", "reptile", "amphibian", "insect"] },
      { topic: "Seasonal Changes", keyVocabulary: ["spring", "summer", "autumn", "winter", "weather", "daylight"] },
      { topic: "Human Body Parts", keyVocabulary: ["head", "arm", "leg", "senses", "eyes", "ears"] },
      { topic: "Identifying Plants and Their Parts", keyVocabulary: ["root", "stem", "leaf", "flower", "petal"] },
      { topic: "Everyday Materials", keyVocabulary: ["wood", "plastic", "metal", "glass", "fabric", "material"] },
    ],
    "Year 2": [
      { topic: "Uses of Everyday Materials", keyVocabulary: ["suitable", "property", "waterproof", "flexible", "rigid"] },
      { topic: "Growing Plants", keyVocabulary: ["seed", "bulb", "germinate", "grow", "water", "sunlight"] },
      { topic: "New Life — Offspring and Growth", keyVocabulary: ["offspring", "baby", "adult", "life cycle", "grow"] },
      { topic: "Introduction to Food Chains", keyVocabulary: ["food chain", "producer", "consumer", "predator", "prey"] },
      { topic: "Living Things and Their Habitats", keyVocabulary: ["habitat", "living", "dead", "never alive", "micro-habitat"] },
      { topic: "Keeping Healthy", keyVocabulary: ["exercise", "food", "hygiene", "healthy", "diet"] },
    ],
    "Year 3": [
      { topic: "Rocks and Soils", keyVocabulary: ["igneous", "sedimentary", "metamorphic", "fossil", "soil"] },
      { topic: "The Human Skeleton and Muscles", keyVocabulary: ["skeleton", "bone", "muscle", "support", "protect", "move"] },
      { topic: "Simple Forces Including Magnets", keyVocabulary: ["push", "pull", "magnet", "attract", "repel", "friction"] },
      { topic: "Healthy Eating and Nutrition", keyVocabulary: ["nutrient", "carbohydrate", "protein", "fat", "vitamin"] },
      { topic: "What Plants Need to Grow", keyVocabulary: ["water", "light", "soil", "nutrients", "air", "transport"] },
      { topic: "Introduction to Light and Shadows", keyVocabulary: ["light source", "shadow", "reflect", "dark", "opaque", "transparent"] },
    ],
    "Year 4": [
      { topic: "The Human Digestive System", keyVocabulary: ["mouth", "oesophagus", "stomach", "intestine", "enzyme"] },
      { topic: "States of Matter", keyVocabulary: ["solid", "liquid", "gas", "melt", "freeze", "evaporate", "condense"] },
      { topic: "Simple Electrical Circuits", keyVocabulary: ["battery", "bulb", "wire", "switch", "circuit", "conductor"] },
      { topic: "Introduction to Sound", keyVocabulary: ["vibration", "sound", "pitch", "volume", "ear"] },
      { topic: "Living Things and Their Environments", keyVocabulary: ["environment", "habitat", "classify", "vertebrate", "invertebrate"] },
      { topic: "Food Chains and Food Webs", keyVocabulary: ["food chain", "food web", "producer", "consumer", "decomposer"] },
    ],
    "Year 5": [
      { topic: "Properties and Changes of Materials", keyVocabulary: ["dissolve", "solution", "filter", "reversible", "irreversible"] },
      { topic: "Forces Including Simple Machines", keyVocabulary: ["gravity", "air resistance", "friction", "lever", "pulley", "gear"] },
      { topic: "Earth, Sun and Moon", keyVocabulary: ["orbit", "rotate", "axis", "day", "night", "phases of the moon"] },
      { topic: "Reproduction and Life Cycles — Plants", keyVocabulary: ["pollination", "seed dispersal", "germination", "fertilisation"] },
      { topic: "Reproduction and Life Cycles — Animals", keyVocabulary: ["life cycle", "metamorphosis", "reproduction", "mammal", "amphibian"] },
      { topic: "Human Development and Ageing", keyVocabulary: ["baby", "child", "teenager", "adult", "elderly", "puberty"] },
    ],
    "Year 6": [
      { topic: "The Human Circulatory System", keyVocabulary: ["heart", "blood", "artery", "vein", "capillary", "oxygen"] },
      { topic: "Changing Circuits", keyVocabulary: ["voltage", "component", "brightness", "series circuit", "symbol"] },
      { topic: "Keeping Healthy — Diet and Lifestyle", keyVocabulary: ["diet", "exercise", "drugs", "alcohol", "tobacco"] },
      { topic: "Classification of Living Things", keyVocabulary: ["classify", "kingdom", "species", "characteristics", "key"] },
      { topic: "Evolution and Inheritance", keyVocabulary: ["evolution", "adaptation", "inheritance", "fossil", "variation"] },
      { topic: "Light and How It Travels", keyVocabulary: ["light ray", "reflection", "refraction", "prism", "spectrum"] },
    ],
    "Year 7": [
      { topic: "Cells and Organisation", keyVocabulary: ["cell", "nucleus", "cytoplasm", "cell membrane", "tissue", "organ"] },
      { topic: "Particles and Their Behaviour", keyVocabulary: ["particle", "solid", "liquid", "gas", "diffusion", "density"] },
      { topic: "Forces and Motion", keyVocabulary: ["force", "Newton", "speed", "distance", "time", "friction"] },
      { topic: "Atoms, Elements and Compounds", keyVocabulary: ["atom", "element", "compound", "molecule", "periodic table"] },
      { topic: "Energy Transfers and Resources", keyVocabulary: ["kinetic", "thermal", "potential", "conservation", "renewable"] },
      { topic: "Reproduction in Plants and Animals", keyVocabulary: ["fertilisation", "gamete", "pollination", "puberty"] },
      { topic: "Acids and Alkalis", keyVocabulary: ["acid", "alkali", "neutral", "pH", "indicator"] },
      { topic: "Sound", keyVocabulary: ["vibration", "frequency", "pitch", "amplitude", "wave"] },
    ],
    "Year 8": [
      { topic: "Breathing and Gas Exchange", keyVocabulary: ["lungs", "alveoli", "diaphragm", "oxygen", "carbon dioxide"] },
      { topic: "Chemical Reactions", keyVocabulary: ["reactant", "product", "exothermic", "endothermic", "word equation"] },
      { topic: "Light", keyVocabulary: ["reflection", "refraction", "spectrum", "lens", "colour"] },
      { topic: "Electricity and Magnetism", keyVocabulary: ["current", "voltage", "resistance", "magnet", "electromagnet"] },
      { topic: "Health and Lifestyle", keyVocabulary: ["nutrient", "enzyme", "drug", "alcohol", "balanced diet"] },
      { topic: "The Periodic Table", keyVocabulary: ["group", "period", "metal", "non-metal", "noble gas"] },
      { topic: "Ecosystems", keyVocabulary: ["ecosystem", "food web", "biodiversity", "adaptation", "competition"] },
      { topic: "Earth and Atmosphere", keyVocabulary: ["rock cycle", "atmosphere", "greenhouse effect", "climate change"] },
    ],
    "Year 9": [
      { topic: "Genetics and Evolution", keyVocabulary: ["gene", "chromosome", "DNA", "mutation", "natural selection"] },
      { topic: "Rates of Reaction", keyVocabulary: ["rate", "catalyst", "concentration", "temperature", "surface area"] },
      { topic: "Waves and the Electromagnetic Spectrum", keyVocabulary: ["wavelength", "frequency", "electromagnetic", "gamma", "infrared"] },
      { topic: "Energy and Power", keyVocabulary: ["power", "watt", "efficiency", "energy transfer", "dissipation"] },
      { topic: "Cell Biology — Advanced", keyVocabulary: ["mitosis", "stem cell", "differentiation", "microscopy"] },
      { topic: "Bonding and Structure", keyVocabulary: ["ionic", "covalent", "metallic", "giant structure", "polymer"] },
      { topic: "Motion and Pressure", keyVocabulary: ["velocity", "acceleration", "pressure", "Pascal", "upthrust"] },
    ],
    "Year 10": [
      { topic: "Cell Biology and Organisation", keyVocabulary: ["cell", "organ system", "enzyme", "diffusion", "osmosis"] },
      { topic: "Atomic Structure and the Periodic Table", keyVocabulary: ["proton", "neutron", "electron", "isotope", "electronic structure"] },
      { topic: "Energy", keyVocabulary: ["kinetic energy", "potential energy", "specific heat capacity", "power", "efficiency"] },
      { topic: "Infection and Response", keyVocabulary: ["pathogen", "bacteria", "virus", "antibiotic", "vaccination"] },
      { topic: "Bonding, Structure and Properties", keyVocabulary: ["ionic bonding", "covalent bonding", "metallic bonding", "properties"] },
      { topic: "Electricity", keyVocabulary: ["current", "voltage", "resistance", "Ohm's law", "power"] },
      { topic: "Bioenergetics", keyVocabulary: ["photosynthesis", "respiration", "aerobic", "anaerobic", "metabolism"] },
      { topic: "Quantitative Chemistry", keyVocabulary: ["mole", "relative atomic mass", "concentration", "yield"] },
      { topic: "Forces", keyVocabulary: ["resultant force", "Newton's laws", "momentum", "stopping distance"] },
    ],
    "Year 11": [
      { topic: "Homeostasis and Response", keyVocabulary: ["homeostasis", "nervous system", "hormone", "reflex arc", "diabetes"] },
      { topic: "Chemical Changes", keyVocabulary: ["oxidation", "reduction", "electrolysis", "reactivity series"] },
      { topic: "Waves", keyVocabulary: ["transverse", "longitudinal", "electromagnetic spectrum", "reflection", "refraction"] },
      { topic: "Inheritance, Variation and Evolution", keyVocabulary: ["DNA", "gene", "allele", "natural selection", "speciation"] },
      { topic: "Organic Chemistry", keyVocabulary: ["hydrocarbon", "alkane", "alkene", "polymer", "crude oil"] },
      { topic: "Magnetism and Electromagnetism", keyVocabulary: ["magnetic field", "solenoid", "motor effect", "transformer"] },
      { topic: "Ecology", keyVocabulary: ["ecosystem", "biodiversity", "decomposition", "carbon cycle", "water cycle"] },
      { topic: "Chemical Analysis", keyVocabulary: ["chromatography", "flame test", "pure substance", "formulation"] },
      { topic: "Using Resources", keyVocabulary: ["life cycle assessment", "potable water", "Haber process", "sustainability"] },
    ],
    "Year 12": [
      { topic: "Biological Molecules", keyVocabulary: ["carbohydrate", "protein", "lipid", "nucleic acid", "enzyme"] },
      { topic: "Cells — Advanced", keyVocabulary: ["eukaryote", "prokaryote", "mitosis", "meiosis", "cell cycle"] },
      { topic: "Physical Chemistry — Atomic Structure and Bonding", keyVocabulary: ["ionisation energy", "electron configuration", "electronegativity"] },
      { topic: "Particles and Radiation", keyVocabulary: ["quark", "lepton", "boson", "antimatter", "photoelectric effect"] },
      { topic: "Exchange and Transport", keyVocabulary: ["gas exchange", "mass transport", "haemoglobin", "transpiration"] },
      { topic: "Inorganic Chemistry — Periodicity and Groups", keyVocabulary: ["periodicity", "Group 2", "Group 7", "trend"] },
      { topic: "Waves and Optics", keyVocabulary: ["superposition", "diffraction", "interference", "standing wave"] },
      { topic: "Mechanics and Materials", keyVocabulary: ["stress", "strain", "Young's modulus", "momentum"] },
      { topic: "Electricity — Advanced", keyVocabulary: ["EMF", "internal resistance", "potential divider", "superconductor"] },
    ],
    "Year 13": [
      { topic: "Genetic Information and Variation", keyVocabulary: ["DNA replication", "transcription", "translation", "mutation"] },
      { topic: "Organic Chemistry — Advanced", keyVocabulary: ["carbonyl", "carboxylic acid", "ester", "amine", "polymer"] },
      { topic: "Fields and Their Consequences", keyVocabulary: ["gravitational field", "electric field", "capacitor", "magnetic flux"] },
      { topic: "Energy Transfers in Organisms", keyVocabulary: ["ATP", "chemiosmosis", "Calvin cycle", "light-dependent reaction"] },
      { topic: "Transition Metals and Reactions", keyVocabulary: ["transition metal", "ligand", "complex ion", "redox titration"] },
      { topic: "Nuclear Physics", keyVocabulary: ["radioactive decay", "half-life", "binding energy", "fission", "fusion"] },
      { topic: "Organisms Respond to Changes", keyVocabulary: ["nerve impulse", "synapse", "muscle contraction", "homeostasis"] },
      { topic: "Genetics, Populations and Ecosystems", keyVocabulary: ["Hardy-Weinberg", "speciation", "succession", "nutrient cycle"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY
  // ═══════════════════════════════════════════════════════════════════════════
  history: {
    "Year 1": [
      { topic: "Changes Within Living Memory", keyVocabulary: ["past", "present", "old", "new", "change"] },
      { topic: "Significant Individuals — Florence Nightingale", keyVocabulary: ["nurse", "hospital", "Crimean War", "hygiene"] },
      { topic: "Significant Individuals — Neil Armstrong", keyVocabulary: ["astronaut", "moon landing", "space", "1969"] },
    ],
    "Year 2": [
      { topic: "The Great Fire of London", keyVocabulary: ["fire", "Samuel Pepys", "1666", "London", "rebuild"] },
      { topic: "Events Beyond Living Memory — First Flight", keyVocabulary: ["Wright brothers", "aeroplane", "invention", "transport"] },
      { topic: "Significant Individuals — Mary Seacole and Rosa Parks", keyVocabulary: ["equality", "courage", "rights", "discrimination"] },
    ],
    "Year 3": [
      { topic: "Stone Age to Iron Age", keyVocabulary: ["Stone Age", "Bronze Age", "Iron Age", "hunter-gatherer", "Skara Brae"] },
      { topic: "Ancient Egypt", keyVocabulary: ["pharaoh", "pyramid", "hieroglyphics", "Nile", "mummy"] },
    ],
    "Year 4": [
      { topic: "The Roman Empire and Its Impact on Britain", keyVocabulary: ["empire", "legion", "conquest", "Hadrian's Wall", "roads"] },
      { topic: "Anglo-Saxons and Scots", keyVocabulary: ["kingdom", "thane", "settlement", "Sutton Hoo"] },
    ],
    "Year 5": [
      { topic: "Vikings and Anglo-Saxon England", keyVocabulary: ["Viking", "raid", "Danelaw", "Alfred the Great", "longship"] },
      { topic: "A Non-European Society — Mayan Civilisation", keyVocabulary: ["Maya", "civilisation", "temple", "calendar", "Central America"] },
    ],
    "Year 6": [
      { topic: "A Study of British History Beyond 1066", keyVocabulary: ["monarchy", "parliament", "reform", "empire"] },
      { topic: "Ancient Greece", keyVocabulary: ["democracy", "Athens", "Sparta", "Olympics", "philosophy"] },
    ],
    "Year 7": [
      { topic: "The Norman Conquest 1066", keyVocabulary: ["Battle of Hastings", "feudal system", "Domesday Book", "William I"] },
      { topic: "Medieval England", keyVocabulary: ["castle", "church", "peasant", "Magna Carta"] },
      { topic: "The Black Death", keyVocabulary: ["plague", "bubonic", "mortality", "quarantine"] },
      { topic: "The Peasants' Revolt", keyVocabulary: ["revolt", "Wat Tyler", "poll tax", "serfdom"] },
    ],
    "Year 8": [
      { topic: "The Tudor Period", keyVocabulary: ["Reformation", "monarch", "dissolution", "Protestant", "Catholic"] },
      { topic: "The English Civil War", keyVocabulary: ["Royalist", "Parliamentarian", "Cromwell", "republic"] },
      { topic: "The Slave Trade and Abolition", keyVocabulary: ["slavery", "abolition", "Middle Passage", "Wilberforce"] },
      { topic: "The Industrial Revolution", keyVocabulary: ["factory", "urbanisation", "steam engine", "child labour"] },
    ],
    "Year 9": [
      { topic: "World War One", keyVocabulary: ["trench warfare", "alliance", "armistice", "propaganda"] },
      { topic: "World War Two and the Holocaust", keyVocabulary: ["Holocaust", "Blitz", "evacuation", "D-Day"] },
      { topic: "The Cold War", keyVocabulary: ["USSR", "NATO", "nuclear", "Iron Curtain"] },
      { topic: "The Civil Rights Movement", keyVocabulary: ["segregation", "discrimination", "protest", "equality"] },
    ],
    "Year 10": [
      { topic: "Medicine Through Time", keyVocabulary: ["Galen", "Harvey", "Pasteur", "NHS", "public health"] },
      { topic: "Weimar and Nazi Germany 1918–1939", keyVocabulary: ["Weimar", "hyperinflation", "Hitler", "Nazi", "propaganda"] },
      { topic: "Elizabethan England", keyVocabulary: ["Elizabeth I", "Spanish Armada", "exploration", "theatre"] },
      { topic: "The American West", keyVocabulary: ["frontier", "Native Americans", "homesteaders", "railroad"] },
    ],
    "Year 11": [
      { topic: "Superpower Relations and the Cold War", keyVocabulary: ["détente", "Cuban Missile Crisis", "Berlin Wall", "arms race"] },
      { topic: "Conflict and Tension — World War One", keyVocabulary: ["Schlieffen Plan", "Somme", "Verdun", "Treaty of Versailles"] },
      { topic: "British Depth Study — Norman England / Restoration England", keyVocabulary: ["feudalism", "church", "monarchy", "society"] },
    ],
    "Year 12": [
      { topic: "The Tudors 1485–1603", keyVocabulary: ["Henry VII", "Henry VIII", "Reformation", "Elizabeth I"] },
      { topic: "Russia 1917–1991", keyVocabulary: ["Bolshevik", "Lenin", "Stalin", "Cold War", "Gorbachev"] },
      { topic: "The French Revolution", keyVocabulary: ["revolution", "Bastille", "Napoleon", "Terror", "republic"] },
    ],
    "Year 13": [
      { topic: "The Making of Modern Britain 1951–2007", keyVocabulary: ["welfare state", "Thatcher", "Blair", "devolution"] },
      { topic: "The British Empire", keyVocabulary: ["colonialism", "decolonisation", "Commonwealth", "independence"] },
      { topic: "Non-Exam Assessment — Historical Investigation", keyVocabulary: ["primary source", "interpretation", "analysis", "argument"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GEOGRAPHY
  // ═══════════════════════════════════════════════════════════════════════════
  geography: {
    "Year 1": [
      { topic: "The United Kingdom — Countries and Capitals", keyVocabulary: ["England", "Scotland", "Wales", "Northern Ireland", "capital"] },
      { topic: "Weather and Seasons", keyVocabulary: ["sunny", "rainy", "windy", "season", "temperature"] },
      { topic: "Our Local Area", keyVocabulary: ["school", "home", "shop", "road", "map"] },
    ],
    "Year 2": [
      { topic: "Continents and Oceans", keyVocabulary: ["continent", "ocean", "Africa", "Asia", "Pacific"] },
      { topic: "Hot and Cold Places", keyVocabulary: ["equator", "North Pole", "South Pole", "hot", "cold"] },
      { topic: "Comparing Localities", keyVocabulary: ["compare", "similar", "different", "urban", "rural"] },
    ],
    "Year 3": [
      { topic: "Volcanoes and Earthquakes", keyVocabulary: ["volcano", "earthquake", "magma", "tectonic plate", "eruption"] },
      { topic: "Climate Zones", keyVocabulary: ["tropical", "temperate", "polar", "desert", "climate"] },
      { topic: "Map Skills — Compass Directions and Keys", keyVocabulary: ["north", "south", "east", "west", "key", "symbol"] },
    ],
    "Year 4": [
      { topic: "Rivers", keyVocabulary: ["source", "mouth", "tributary", "meander", "estuary"] },
      { topic: "The Water Cycle", keyVocabulary: ["evaporation", "condensation", "precipitation", "collection"] },
      { topic: "Settlements and Land Use", keyVocabulary: ["settlement", "village", "town", "city", "land use"] },
    ],
    "Year 5": [
      { topic: "Mountains", keyVocabulary: ["mountain", "summit", "range", "altitude", "erosion"] },
      { topic: "Biomes and Vegetation Belts", keyVocabulary: ["biome", "rainforest", "desert", "tundra", "savanna"] },
      { topic: "Map Skills — OS Maps and Grid References", keyVocabulary: ["grid reference", "contour", "scale", "Ordnance Survey"] },
    ],
    "Year 6": [
      { topic: "Trade and Economics", keyVocabulary: ["trade", "import", "export", "economy", "fair trade"] },
      { topic: "Natural Resources and Sustainability", keyVocabulary: ["resource", "renewable", "non-renewable", "sustainable", "fossil fuel"] },
      { topic: "Fieldwork Investigation", keyVocabulary: ["fieldwork", "data", "survey", "observe", "conclude"] },
    ],
    "Year 7": [
      { topic: "Map Skills and Grid References", keyVocabulary: ["grid reference", "contour", "scale", "compass"] },
      { topic: "Weather and Climate", keyVocabulary: ["precipitation", "temperature", "climate zone", "humidity"] },
      { topic: "Ecosystems", keyVocabulary: ["ecosystem", "biome", "food web", "adaptation"] },
      { topic: "Rivers — Processes and Landforms", keyVocabulary: ["erosion", "deposition", "meander", "floodplain"] },
    ],
    "Year 8": [
      { topic: "Tectonic Plates and Earthquakes", keyVocabulary: ["tectonic plate", "fault line", "magnitude", "epicentre"] },
      { topic: "Volcanoes", keyVocabulary: ["magma", "lava", "eruption", "crater", "shield volcano"] },
      { topic: "Urbanisation", keyVocabulary: ["urban", "rural", "migration", "infrastructure", "megacity"] },
      { topic: "Development and Inequality", keyVocabulary: ["GDP", "HDI", "development gap", "aid"] },
    ],
    "Year 9": [
      { topic: "Climate Change", keyVocabulary: ["greenhouse gas", "carbon footprint", "global warming", "renewable"] },
      { topic: "Coastal Processes", keyVocabulary: ["wave", "erosion", "longshore drift", "cliff", "spit"] },
      { topic: "Globalisation", keyVocabulary: ["globalisation", "TNC", "trade", "culture", "interdependence"] },
      { topic: "Resource Management", keyVocabulary: ["resource", "water stress", "food security", "energy mix"] },
    ],
    "Year 10": [
      { topic: "The Living World — Ecosystems and Tropical Rainforests", keyVocabulary: ["ecosystem", "biodiversity", "deforestation", "sustainability"] },
      { topic: "Physical Landscapes — Rivers", keyVocabulary: ["erosion", "transportation", "deposition", "flood management"] },
      { topic: "Physical Landscapes — Coasts", keyVocabulary: ["wave-cut platform", "spit", "bar", "coastal management"] },
      { topic: "Urban Issues and Challenges", keyVocabulary: ["urbanisation", "regeneration", "sustainability", "deprivation"] },
      { topic: "The Changing Economic World", keyVocabulary: ["development", "NEE", "HIC", "LIC", "economic growth"] },
    ],
    "Year 11": [
      { topic: "Natural Hazards — Tectonic and Weather", keyVocabulary: ["earthquake", "volcano", "tropical storm", "risk management"] },
      { topic: "Resource Management — Water, Food, Energy", keyVocabulary: ["water stress", "food security", "energy mix", "sustainability"] },
      { topic: "Geographical Skills and Fieldwork", keyVocabulary: ["fieldwork", "data presentation", "analysis", "evaluation"] },
    ],
    "Year 12": [
      { topic: "Water and Carbon Cycles", keyVocabulary: ["hydrological cycle", "carbon cycle", "flux", "store"] },
      { topic: "Coastal Systems and Landscapes", keyVocabulary: ["system", "input", "output", "feedback", "landform"] },
      { topic: "Hazards", keyVocabulary: ["tectonic", "volcanic", "seismic", "disaster risk reduction"] },
      { topic: "Changing Places", keyVocabulary: ["place", "identity", "representation", "lived experience"] },
    ],
    "Year 13": [
      { topic: "Global Systems and Governance", keyVocabulary: ["globalisation", "governance", "migration", "sovereignty"] },
      { topic: "Population and the Environment", keyVocabulary: ["carrying capacity", "demographic transition", "food security"] },
      { topic: "NEA — Independent Investigation", keyVocabulary: ["hypothesis", "methodology", "data collection", "analysis"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTING
  // ═══════════════════════════════════════════════════════════════════════════
  computing: {
    "Year 1": [
      { topic: "Using Technology Safely", keyVocabulary: ["safe", "internet", "password", "kind", "tell an adult"] },
      { topic: "Simple Instructions and Algorithms", keyVocabulary: ["instruction", "order", "sequence", "algorithm"] },
    ],
    "Year 2": [
      { topic: "Creating Simple Programs", keyVocabulary: ["program", "command", "debug", "predict"] },
      { topic: "Using Technology Purposefully", keyVocabulary: ["keyboard", "mouse", "save", "create"] },
    ],
    "Year 3": [
      { topic: "Algorithms and Sequences", keyVocabulary: ["algorithm", "sequence", "selection", "repetition"] },
      { topic: "Internet Safety and Digital Literacy", keyVocabulary: ["internet", "search", "reliable", "safe"] },
    ],
    "Year 4": [
      { topic: "Programming with Scratch — Loops and Selection", keyVocabulary: ["loop", "if/else", "variable", "Scratch"] },
      { topic: "Data and Information", keyVocabulary: ["data", "collect", "present", "branching database"] },
    ],
    "Year 5": [
      { topic: "Programming — Variables and Functions", keyVocabulary: ["variable", "function", "input", "output"] },
      { topic: "Online Safety and Digital Footprint", keyVocabulary: ["digital footprint", "privacy", "copyright", "responsible"] },
    ],
    "Year 6": [
      { topic: "Programming — Text-Based (Python Introduction)", keyVocabulary: ["Python", "syntax", "variable", "print", "input"] },
      { topic: "Networks and the Internet", keyVocabulary: ["network", "internet", "server", "browser", "URL"] },
    ],
    "Year 7": [
      { topic: "Binary and Data Representation", keyVocabulary: ["binary", "bit", "byte", "hexadecimal"] },
      { topic: "Algorithms and Flowcharts", keyVocabulary: ["algorithm", "flowchart", "sequence", "iteration"] },
      { topic: "Programming — Variables and Loops", keyVocabulary: ["variable", "loop", "iteration", "condition"] },
    ],
    "Year 8": [
      { topic: "Boolean Logic", keyVocabulary: ["AND", "OR", "NOT", "truth table"] },
      { topic: "Networks and the Internet", keyVocabulary: ["IP address", "router", "protocol", "bandwidth"] },
      { topic: "Cybersecurity", keyVocabulary: ["encryption", "phishing", "firewall", "malware"] },
    ],
    "Year 9": [
      { topic: "Databases", keyVocabulary: ["table", "query", "record", "field", "SQL"] },
      { topic: "Computational Thinking", keyVocabulary: ["decomposition", "abstraction", "pattern recognition", "algorithm"] },
      { topic: "Web Development — HTML and CSS", keyVocabulary: ["HTML", "CSS", "tag", "element", "style"] },
    ],
    "Year 10": [
      { topic: "Computer Systems — Hardware and Software", keyVocabulary: ["CPU", "RAM", "storage", "operating system"] },
      { topic: "Programming Fundamentals", keyVocabulary: ["variable", "selection", "iteration", "subroutine", "array"] },
      { topic: "Data Representation — Binary, Hex, ASCII", keyVocabulary: ["binary", "hexadecimal", "ASCII", "Unicode", "bitmap"] },
      { topic: "Networks and Protocols", keyVocabulary: ["TCP/IP", "DNS", "HTTP", "packet switching", "topology"] },
    ],
    "Year 11": [
      { topic: "Algorithms — Searching and Sorting", keyVocabulary: ["linear search", "binary search", "bubble sort", "merge sort"] },
      { topic: "Programming Project", keyVocabulary: ["design", "implement", "test", "evaluate", "documentation"] },
      { topic: "Ethical, Legal and Environmental Issues", keyVocabulary: ["Data Protection Act", "Computer Misuse Act", "copyright", "e-waste"] },
    ],
    "Year 12": [
      { topic: "Fundamentals of Programming", keyVocabulary: ["OOP", "class", "inheritance", "polymorphism", "encapsulation"] },
      { topic: "Data Structures", keyVocabulary: ["stack", "queue", "linked list", "tree", "hash table"] },
      { topic: "Computer Architecture", keyVocabulary: ["Von Neumann", "fetch-decode-execute", "register", "bus"] },
      { topic: "Theory of Computation", keyVocabulary: ["finite state machine", "regular expression", "Turing machine"] },
    ],
    "Year 13": [
      { topic: "Algorithms — Complexity and Graph Theory", keyVocabulary: ["Big O", "Dijkstra", "A*", "NP-complete"] },
      { topic: "Databases and SQL", keyVocabulary: ["normalisation", "entity-relationship", "SQL", "transaction"] },
      { topic: "Programming Project (NEA)", keyVocabulary: ["analysis", "design", "implementation", "testing", "evaluation"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ART & DESIGN
  // ═══════════════════════════════════════════════════════════════════════════
  art: {
    "Year 1": [
      { topic: "Drawing — Lines and Shapes", keyVocabulary: ["line", "shape", "pattern", "pencil", "crayon"] },
      { topic: "Colour Mixing", keyVocabulary: ["primary colour", "mix", "red", "blue", "yellow"] },
      { topic: "Collage and Texture", keyVocabulary: ["collage", "texture", "stick", "cut", "material"] },
    ],
    "Year 2": [
      { topic: "Painting Techniques", keyVocabulary: ["brush", "wash", "thick", "thin", "blend"] },
      { topic: "Sculpture and 3D Forms", keyVocabulary: ["sculpture", "mould", "shape", "clay", "3D"] },
      { topic: "Printing", keyVocabulary: ["print", "stamp", "repeat", "pattern", "press"] },
    ],
    "Year 3": [
      { topic: "Sketching and Observational Drawing", keyVocabulary: ["sketch", "observe", "shade", "proportion", "detail"] },
      { topic: "Famous Artists — Study of a Painter", keyVocabulary: ["artist", "style", "technique", "gallery", "inspiration"] },
    ],
    "Year 4": [
      { topic: "Colour Theory — Secondary and Tertiary Colours", keyVocabulary: ["secondary", "tertiary", "warm", "cool", "complementary"] },
      { topic: "Textiles and Weaving", keyVocabulary: ["textile", "weave", "thread", "fabric", "loom"] },
    ],
    "Year 5": [
      { topic: "Perspective Drawing", keyVocabulary: ["perspective", "vanishing point", "horizon", "foreground", "background"] },
      { topic: "Mixed Media", keyVocabulary: ["mixed media", "combine", "layer", "texture", "composition"] },
    ],
    "Year 6": [
      { topic: "Art Movements — Pop Art, Impressionism", keyVocabulary: ["movement", "Pop Art", "Impressionism", "style", "influence"] },
      { topic: "Digital Art and Photography", keyVocabulary: ["digital", "photograph", "edit", "composition", "filter"] },
    ],
    "Year 7": [
      { topic: "Formal Elements — Line, Tone, Colour, Shape", keyVocabulary: ["line", "tone", "colour", "shape", "form", "texture"] },
      { topic: "Portraiture", keyVocabulary: ["portrait", "proportion", "feature", "expression", "self-portrait"] },
    ],
    "Year 8": [
      { topic: "Printmaking Techniques", keyVocabulary: ["lino print", "monoprint", "relief", "edition", "ink"] },
      { topic: "Art from Other Cultures", keyVocabulary: ["culture", "tradition", "pattern", "symbolism", "influence"] },
    ],
    "Year 9": [
      { topic: "Personal Project — Theme Development", keyVocabulary: ["theme", "research", "develop", "refine", "evaluate"] },
      { topic: "3D Design and Sculpture", keyVocabulary: ["sculpture", "form", "structure", "material", "installation"] },
    ],
    "Year 10": [
      { topic: "GCSE Portfolio — Component 1", keyVocabulary: ["portfolio", "artist study", "experimentation", "refinement"] },
      { topic: "Critical Studies and Artist Analysis", keyVocabulary: ["analyse", "compare", "context", "influence", "technique"] },
    ],
    "Year 11": [
      { topic: "GCSE Externally Set Assignment", keyVocabulary: ["exam", "preparation", "final piece", "annotation", "evaluation"] },
    ],
    "Year 12": [
      { topic: "Personal Investigation — Component 1", keyVocabulary: ["investigation", "theme", "experimentation", "critical analysis"] },
    ],
    "Year 13": [
      { topic: "Externally Set Assignment — Component 2", keyVocabulary: ["exam", "sustained project", "final outcome", "evaluation"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MUSIC
  // ═══════════════════════════════════════════════════════════════════════════
  music: {
    "Year 1": [
      { topic: "Pulse and Rhythm", keyVocabulary: ["pulse", "beat", "rhythm", "clap", "pattern"] },
      { topic: "Singing and Performing", keyVocabulary: ["sing", "perform", "loud", "quiet", "together"] },
    ],
    "Year 2": [
      { topic: "Pitch — High and Low Sounds", keyVocabulary: ["pitch", "high", "low", "note", "tune"] },
      { topic: "Instruments and Sounds", keyVocabulary: ["instrument", "percussion", "strum", "blow", "sound"] },
    ],
    "Year 3": [
      { topic: "Musical Notation — Introduction", keyVocabulary: ["note", "rest", "crotchet", "quaver", "stave"] },
      { topic: "Composition — Creating Simple Melodies", keyVocabulary: ["compose", "melody", "pattern", "repeat", "change"] },
    ],
    "Year 4": [
      { topic: "Ensemble Performance", keyVocabulary: ["ensemble", "part", "harmony", "tempo", "dynamics"] },
      { topic: "Music from Different Cultures", keyVocabulary: ["culture", "tradition", "instrument", "style", "rhythm"] },
    ],
    "Year 5": [
      { topic: "Song Writing and Lyrics", keyVocabulary: ["lyrics", "verse", "chorus", "bridge", "rhyme"] },
      { topic: "Music Technology — Introduction", keyVocabulary: ["technology", "record", "loop", "layer", "digital"] },
    ],
    "Year 6": [
      { topic: "Music History — Classical to Modern", keyVocabulary: ["classical", "baroque", "jazz", "pop", "composer"] },
      { topic: "Performance and Evaluation", keyVocabulary: ["perform", "evaluate", "improve", "audience", "expression"] },
    ],
    "Year 7": [
      { topic: "Elements of Music", keyVocabulary: ["pitch", "duration", "dynamics", "tempo", "timbre", "texture"] },
      { topic: "Keyboard Skills", keyVocabulary: ["keyboard", "chord", "melody", "bass", "notation"] },
    ],
    "Year 8": [
      { topic: "Blues and Jazz", keyVocabulary: ["blues", "jazz", "improvisation", "12-bar", "swing"] },
      { topic: "Film Music", keyVocabulary: ["soundtrack", "leitmotif", "underscore", "mood", "tension"] },
    ],
    "Year 9": [
      { topic: "Popular Music and Songwriting", keyVocabulary: ["pop", "rock", "structure", "riff", "hook"] },
      { topic: "World Music", keyVocabulary: ["gamelan", "samba", "raga", "African drumming", "pentatonic"] },
    ],
    "Year 10": [
      { topic: "GCSE Performance", keyVocabulary: ["solo", "ensemble", "technique", "expression", "accuracy"] },
      { topic: "GCSE Composition", keyVocabulary: ["compose", "develop", "structure", "harmony", "melody"] },
    ],
    "Year 11": [
      { topic: "Listening and Appraising", keyVocabulary: ["analyse", "compare", "context", "style", "period"] },
    ],
    "Year 12": [
      { topic: "Advanced Performance", keyVocabulary: ["recital", "interpretation", "technique", "musicianship"] },
      { topic: "Harmony and Composition", keyVocabulary: ["four-part harmony", "counterpoint", "modulation", "cadence"] },
    ],
    "Year 13": [
      { topic: "Music Analysis and Context", keyVocabulary: ["analysis", "set work", "context", "comparison"] },
      { topic: "Extended Composition or Performance", keyVocabulary: ["portfolio", "extended", "evaluation", "refinement"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PE
  // ═══════════════════════════════════════════════════════════════════════════
  pe: {
    "Year 1": [
      { topic: "Fundamental Movement Skills", keyVocabulary: ["run", "jump", "throw", "catch", "balance"] },
      { topic: "Gymnastics — Basic Shapes and Balances", keyVocabulary: ["tuck", "star", "pike", "balance", "roll"] },
      { topic: "Dance — Rhythm and Movement", keyVocabulary: ["dance", "rhythm", "move", "copy", "perform"] },
    ],
    "Year 2": [
      { topic: "Team Games — Throwing and Catching", keyVocabulary: ["team", "throw", "catch", "aim", "cooperate"] },
      { topic: "Athletics — Running, Jumping, Throwing", keyVocabulary: ["sprint", "jump", "throw", "distance", "speed"] },
    ],
    "Year 3": [
      { topic: "Invasion Games (Tag Rugby, Football)", keyVocabulary: ["attack", "defend", "pass", "score", "team"] },
      { topic: "Swimming and Water Safety", keyVocabulary: ["swim", "float", "stroke", "safety", "water"] },
    ],
    "Year 4": [
      { topic: "Net and Wall Games (Tennis, Badminton)", keyVocabulary: ["rally", "serve", "forehand", "backhand", "court"] },
      { topic: "Outdoor and Adventurous Activities", keyVocabulary: ["orienteering", "map", "teamwork", "challenge", "navigate"] },
    ],
    "Year 5": [
      { topic: "Striking and Fielding (Cricket, Rounders)", keyVocabulary: ["bat", "bowl", "field", "catch", "run"] },
      { topic: "Gymnastics — Sequences and Apparatus", keyVocabulary: ["sequence", "apparatus", "vault", "flight", "landing"] },
    ],
    "Year 6": [
      { topic: "Competitive Sports and Sportsmanship", keyVocabulary: ["competition", "fair play", "rules", "respect", "teamwork"] },
      { topic: "Fitness and Health", keyVocabulary: ["fitness", "heart rate", "stamina", "strength", "flexibility"] },
    ],
    "Year 7": [
      { topic: "Fitness Testing and Training", keyVocabulary: ["fitness", "endurance", "strength", "flexibility", "speed"] },
      { topic: "Team Sports (Football, Netball, Basketball)", keyVocabulary: ["tactics", "position", "strategy", "teamwork"] },
    ],
    "Year 8": [
      { topic: "Athletics — Track and Field", keyVocabulary: ["sprint", "relay", "shot put", "long jump", "technique"] },
      { topic: "Individual Sports (Badminton, Table Tennis)", keyVocabulary: ["serve", "rally", "footwork", "tactics"] },
    ],
    "Year 9": [
      { topic: "Leadership and Officiating", keyVocabulary: ["leader", "official", "rules", "decision", "communicate"] },
      { topic: "Health, Fitness and Wellbeing", keyVocabulary: ["health", "wellbeing", "diet", "exercise", "lifestyle"] },
    ],
    "Year 10": [
      { topic: "GCSE PE — Anatomy and Physiology", keyVocabulary: ["muscle", "bone", "joint", "cardiovascular", "respiratory"] },
      { topic: "GCSE PE — Physical Training", keyVocabulary: ["training method", "principle", "overload", "specificity"] },
      { topic: "GCSE PE — Practical Performance", keyVocabulary: ["technique", "tactics", "rules", "performance"] },
    ],
    "Year 11": [
      { topic: "GCSE PE — Sport Psychology", keyVocabulary: ["motivation", "aggression", "arousal", "personality"] },
      { topic: "GCSE PE — Socio-Cultural Influences", keyVocabulary: ["participation", "commercialisation", "ethics", "drugs in sport"] },
    ],
    "Year 12": [
      { topic: "A-Level PE — Exercise Physiology", keyVocabulary: ["VO2 max", "lactate threshold", "cardiac output", "energy systems"] },
      { topic: "A-Level PE — Biomechanics", keyVocabulary: ["force", "lever", "angular motion", "projectile", "Newton's laws"] },
    ],
    "Year 13": [
      { topic: "A-Level PE — Sport and Society", keyVocabulary: ["globalisation", "deviance", "commercialisation", "Olympic movement"] },
      { topic: "A-Level PE — Technology in Sport", keyVocabulary: ["VAR", "Hawk-Eye", "wearable technology", "data analysis"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DESIGN & TECHNOLOGY
  // ═══════════════════════════════════════════════════════════════════════════
  dt: {
    "Year 1": [
      { topic: "Cutting, Shaping and Joining Materials", keyVocabulary: ["cut", "shape", "join", "glue", "scissors"] },
      { topic: "Healthy Eating — Preparing Fruit and Vegetables", keyVocabulary: ["fruit", "vegetable", "wash", "chop", "healthy"] },
    ],
    "Year 2": [
      { topic: "Mechanisms — Sliders and Levers", keyVocabulary: ["slider", "lever", "pivot", "mechanism", "move"] },
      { topic: "Textiles — Templates and Joining", keyVocabulary: ["fabric", "template", "sew", "join", "decorate"] },
    ],
    "Year 3": [
      { topic: "Structures — Shell Structures", keyVocabulary: ["structure", "strong", "stable", "net", "3D shape"] },
      { topic: "Food — Healthy Sandwiches", keyVocabulary: ["ingredient", "hygiene", "prepare", "taste", "healthy"] },
    ],
    "Year 4": [
      { topic: "Mechanisms — Pneumatics", keyVocabulary: ["pneumatic", "air", "pressure", "syringe", "mechanism"] },
      { topic: "Electrical Systems — Simple Circuits in Products", keyVocabulary: ["circuit", "battery", "motor", "switch", "buzzer"] },
    ],
    "Year 5": [
      { topic: "Mechanisms — Cams and Gears", keyVocabulary: ["cam", "gear", "axle", "follower", "rotation"] },
      { topic: "Food — Celebrating Culture and Seasonality", keyVocabulary: ["seasonal", "culture", "recipe", "nutrition", "method"] },
    ],
    "Year 6": [
      { topic: "Structures — Bridges and Frameworks", keyVocabulary: ["bridge", "framework", "reinforce", "load", "stability"] },
      { topic: "Programming and Control — Monitoring Systems", keyVocabulary: ["program", "sensor", "control", "monitor", "input"] },
    ],
    "Year 7": [
      { topic: "Design Process and Materials", keyVocabulary: ["design", "prototype", "material", "evaluate", "specification"] },
      { topic: "Working with Wood, Metal and Plastic", keyVocabulary: ["wood", "metal", "plastic", "tool", "technique"] },
    ],
    "Year 8": [
      { topic: "Electronics and Systems", keyVocabulary: ["circuit", "component", "resistor", "LED", "PCB"] },
      { topic: "Food Technology — Nutrition and Cooking", keyVocabulary: ["nutrition", "macronutrient", "cooking method", "food safety"] },
    ],
    "Year 9": [
      { topic: "CAD/CAM and Manufacturing", keyVocabulary: ["CAD", "CAM", "laser cutter", "3D printing", "manufacture"] },
      { topic: "Sustainable Design", keyVocabulary: ["sustainability", "recycle", "reduce", "reuse", "environmental impact"] },
    ],
    "Year 10": [
      { topic: "GCSE DT — Core Technical Principles", keyVocabulary: ["material property", "force", "energy", "system", "mechanism"] },
      { topic: "GCSE DT — Specialist Technical Principles", keyVocabulary: ["timber", "polymer", "metal", "textile", "electronic"] },
    ],
    "Year 11": [
      { topic: "GCSE DT — NEA (Non-Exam Assessment)", keyVocabulary: ["brief", "investigate", "design", "make", "evaluate"] },
    ],
    "Year 12": [
      { topic: "A-Level DT — Design Theory and Innovation", keyVocabulary: ["innovation", "ergonomics", "anthropometrics", "design movement"] },
    ],
    "Year 13": [
      { topic: "A-Level DT — NEA Major Project", keyVocabulary: ["iterative design", "prototype", "manufacture", "evaluation"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RELIGIOUS EDUCATION
  // ═══════════════════════════════════════════════════════════════════════════
  re: {
    "Year 1": [
      { topic: "Special People and Stories", keyVocabulary: ["special", "story", "kind", "help", "believe"] },
      { topic: "Celebrations and Festivals", keyVocabulary: ["Christmas", "Diwali", "Eid", "celebrate", "festival"] },
    ],
    "Year 2": [
      { topic: "Places of Worship", keyVocabulary: ["church", "mosque", "temple", "synagogue", "worship"] },
      { topic: "Sacred Books", keyVocabulary: ["Bible", "Quran", "Torah", "sacred", "story"] },
    ],
    "Year 3": [
      { topic: "Christianity — Key Beliefs", keyVocabulary: ["God", "Jesus", "Bible", "prayer", "church"] },
      { topic: "Hinduism — Key Beliefs", keyVocabulary: ["Brahman", "dharma", "karma", "mandir", "Diwali"] },
    ],
    "Year 4": [
      { topic: "Islam — Key Beliefs and Practices", keyVocabulary: ["Allah", "Muhammad", "Quran", "mosque", "Five Pillars"] },
      { topic: "Judaism — Key Beliefs and Practices", keyVocabulary: ["Torah", "Shabbat", "synagogue", "covenant", "Passover"] },
    ],
    "Year 5": [
      { topic: "Sikhism — Key Beliefs", keyVocabulary: ["Guru", "Gurdwara", "langar", "Khalsa", "equality"] },
      { topic: "Buddhism — Key Beliefs", keyVocabulary: ["Buddha", "enlightenment", "Four Noble Truths", "meditation"] },
    ],
    "Year 6": [
      { topic: "Ethics — Right and Wrong", keyVocabulary: ["morality", "conscience", "justice", "virtue", "choice"] },
      { topic: "Life After Death", keyVocabulary: ["resurrection", "reincarnation", "heaven", "judgement", "afterlife"] },
    ],
    "Year 7": [
      { topic: "What Is Religion?", keyVocabulary: ["religion", "belief", "faith", "secular", "worldview"] },
      { topic: "Christianity — God and Jesus", keyVocabulary: ["Trinity", "incarnation", "salvation", "resurrection"] },
    ],
    "Year 8": [
      { topic: "Islam — Beliefs and Practices", keyVocabulary: ["Allah", "prophet", "Quran", "Five Pillars", "Hajj"] },
      { topic: "Philosophy — Does God Exist?", keyVocabulary: ["argument", "evidence", "faith", "reason", "proof"] },
    ],
    "Year 9": [
      { topic: "Ethics — Crime and Punishment", keyVocabulary: ["justice", "punishment", "forgiveness", "death penalty", "reform"] },
      { topic: "Relationships and Families", keyVocabulary: ["marriage", "divorce", "family", "gender", "equality"] },
    ],
    "Year 10": [
      { topic: "GCSE RE — Christian Beliefs and Practices", keyVocabulary: ["Trinity", "salvation", "worship", "sacrament", "pilgrimage"] },
      { topic: "GCSE RE — Islam Beliefs and Practices", keyVocabulary: ["Tawhid", "Risalah", "Akhirah", "Salah", "Zakah"] },
    ],
    "Year 11": [
      { topic: "GCSE RE — Themes (Peace, Crime, Human Rights)", keyVocabulary: ["peace", "conflict", "human rights", "social justice", "prejudice"] },
    ],
    "Year 12": [
      { topic: "Philosophy of Religion", keyVocabulary: ["ontological", "cosmological", "teleological", "problem of evil"] },
      { topic: "Ethics — Natural Law and Situation Ethics", keyVocabulary: ["natural law", "situation ethics", "utilitarianism", "deontology"] },
    ],
    "Year 13": [
      { topic: "Developments in Christian Thought", keyVocabulary: ["liberation theology", "secularism", "pluralism", "feminist theology"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODERN FOREIGN LANGUAGES
  // ═══════════════════════════════════════════════════════════════════════════
  mfl: {
    "Year 7": [
      { topic: "Greetings and Introductions", keyVocabulary: ["bonjour", "hola", "name", "age", "introduce"] },
      { topic: "Family and Relationships", keyVocabulary: ["family", "brother", "sister", "parent", "describe"] },
      { topic: "School and Education", keyVocabulary: ["subject", "teacher", "classroom", "timetable", "lesson"] },
    ],
    "Year 8": [
      { topic: "Food and Eating Out", keyVocabulary: ["restaurant", "menu", "order", "preference", "meal"] },
      { topic: "Travel and Transport", keyVocabulary: ["transport", "journey", "direction", "ticket", "station"] },
      { topic: "Holidays and Free Time", keyVocabulary: ["holiday", "hobby", "sport", "activity", "weekend"] },
    ],
    "Year 9": [
      { topic: "Town and Local Area", keyVocabulary: ["town", "shop", "direction", "building", "neighbourhood"] },
      { topic: "Health and Fitness", keyVocabulary: ["health", "body", "illness", "exercise", "diet"] },
      { topic: "Environment and Global Issues", keyVocabulary: ["environment", "pollution", "recycle", "climate", "protect"] },
    ],
    "Year 10": [
      { topic: "GCSE — Identity and Culture", keyVocabulary: ["identity", "culture", "tradition", "festival", "custom"] },
      { topic: "GCSE — Local, National and Global Areas of Interest", keyVocabulary: ["charity", "volunteering", "social media", "technology"] },
      { topic: "GCSE — Current and Future Study and Employment", keyVocabulary: ["career", "ambition", "qualification", "job", "university"] },
    ],
    "Year 11": [
      { topic: "GCSE — Speaking and Writing Exam Preparation", keyVocabulary: ["opinion", "justify", "compare", "narrate", "describe"] },
      { topic: "GCSE — Listening and Reading Exam Preparation", keyVocabulary: ["comprehension", "inference", "translate", "summarise"] },
    ],
    "Year 12": [
      { topic: "A-Level — Social Issues and Trends", keyVocabulary: ["immigration", "multiculturalism", "inequality", "discrimination"] },
      { topic: "A-Level — Film or Literary Text Study", keyVocabulary: ["character", "theme", "symbolism", "narrative", "director"] },
    ],
    "Year 13": [
      { topic: "A-Level — Political and Artistic Culture", keyVocabulary: ["politics", "art", "music", "heritage", "influence"] },
      { topic: "A-Level — Independent Research Project", keyVocabulary: ["research", "present", "analyse", "evaluate", "argue"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PSHE
  // ═══════════════════════════════════════════════════════════════════════════
  pshe: {
    "Year 1": [
      { topic: "Keeping Safe", keyVocabulary: ["safe", "danger", "trusted adult", "road", "stranger"] },
      { topic: "Feelings and Emotions", keyVocabulary: ["happy", "sad", "angry", "scared", "kind"] },
    ],
    "Year 2": [
      { topic: "Healthy Lifestyles", keyVocabulary: ["healthy", "exercise", "sleep", "food", "hygiene"] },
      { topic: "Being a Good Friend", keyVocabulary: ["friend", "share", "kind", "listen", "respect"] },
    ],
    "Year 3": [
      { topic: "Bullying and How to Deal With It", keyVocabulary: ["bully", "unkind", "tell", "support", "stand up"] },
      { topic: "Respecting Differences", keyVocabulary: ["respect", "different", "same", "culture", "family"] },
    ],
    "Year 4": [
      { topic: "Online Safety", keyVocabulary: ["internet", "safe", "password", "personal information", "report"] },
      { topic: "Growing and Changing", keyVocabulary: ["grow", "change", "body", "puberty", "feelings"] },
    ],
    "Year 5": [
      { topic: "Mental Health and Wellbeing", keyVocabulary: ["wellbeing", "anxiety", "resilience", "mindfulness", "support"] },
      { topic: "Healthy Relationships", keyVocabulary: ["respect", "consent", "boundary", "communication", "trust"] },
    ],
    "Year 6": [
      { topic: "Transition to Secondary School", keyVocabulary: ["transition", "change", "worry", "excited", "prepare"] },
      { topic: "Drugs, Alcohol and Tobacco", keyVocabulary: ["drug", "alcohol", "tobacco", "risk", "choice"] },
    ],
    "Year 7": [
      { topic: "Identity and Self-Esteem", keyVocabulary: ["identity", "self-esteem", "confidence", "values", "strengths"] },
      { topic: "Online Safety and Cyberbullying", keyVocabulary: ["cyberbullying", "privacy", "digital footprint", "report"] },
    ],
    "Year 8": [
      { topic: "Healthy Relationships", keyVocabulary: ["respect", "consent", "boundary", "communication", "trust"] },
      { topic: "Substance Misuse", keyVocabulary: ["drug", "alcohol", "risk", "peer pressure", "support"] },
    ],
    "Year 9": [
      { topic: "Equality and Diversity", keyVocabulary: ["equality", "diversity", "discrimination", "inclusion", "prejudice"] },
      { topic: "Careers and Aspirations", keyVocabulary: ["career", "aspiration", "skill", "qualification", "pathway"] },
    ],
    "Year 10": [
      { topic: "Mental Health Awareness", keyVocabulary: ["mental health", "depression", "anxiety", "support", "stigma"] },
      { topic: "Relationships and Sex Education", keyVocabulary: ["consent", "contraception", "STI", "healthy relationship"] },
    ],
    "Year 11": [
      { topic: "Financial Literacy", keyVocabulary: ["budget", "savings", "debt", "tax", "payslip"] },
      { topic: "Preparing for Adulthood", keyVocabulary: ["independence", "responsibility", "rights", "voting", "citizenship"] },
    ],
    "Year 12": [
      { topic: "Personal Finance and Budgeting", keyVocabulary: ["budget", "student loan", "credit", "investment", "tax"] },
    ],
    "Year 13": [
      { topic: "Preparing for University and Employment", keyVocabulary: ["UCAS", "personal statement", "CV", "interview", "gap year"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS STUDIES
  // ═══════════════════════════════════════════════════════════════════════════
  business: {
    "Year 10": [
      { topic: "Business Ownership Types", keyVocabulary: ["sole trader", "partnership", "limited company", "franchise"] },
      { topic: "Marketing and the Marketing Mix", keyVocabulary: ["product", "price", "place", "promotion"] },
      { topic: "Finance — Revenue, Costs and Profit", keyVocabulary: ["revenue", "cost", "profit", "break-even"] },
      { topic: "Human Resources", keyVocabulary: ["recruitment", "motivation", "training", "retention"] },
    ],
    "Year 11": [
      { topic: "Business Planning", keyVocabulary: ["business plan", "market research", "SWOT", "objective"] },
      { topic: "Globalisation and International Trade", keyVocabulary: ["globalisation", "import", "export", "tariff"] },
      { topic: "Business Ethics and the Environment", keyVocabulary: ["ethics", "sustainability", "CSR", "stakeholder"] },
    ],
    "Year 12": [
      { topic: "A-Level — Business Objectives and Strategy", keyVocabulary: ["mission", "objective", "strategy", "SWOT", "stakeholder"] },
      { topic: "A-Level — Financial Planning and Accounts", keyVocabulary: ["cash flow", "profit and loss", "balance sheet", "ratio analysis"] },
      { topic: "A-Level — Marketing Strategy", keyVocabulary: ["segmentation", "targeting", "positioning", "market research"] },
    ],
    "Year 13": [
      { topic: "A-Level — Operations Management", keyVocabulary: ["lean production", "quality", "supply chain", "capacity"] },
      { topic: "A-Level — Global Business", keyVocabulary: ["globalisation", "emerging market", "exchange rate", "competitiveness"] },
      { topic: "A-Level — Business Decision Making", keyVocabulary: ["decision tree", "investment appraisal", "risk", "uncertainty"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAMA
  // ═══════════════════════════════════════════════════════════════════════════
  drama: {
    "Year 7": [
      { topic: "Introduction to Drama — Improvisation", keyVocabulary: ["improvise", "character", "scene", "audience", "perform"] },
      { topic: "Mime and Physical Theatre", keyVocabulary: ["mime", "gesture", "movement", "expression", "physical theatre"] },
    ],
    "Year 8": [
      { topic: "Script Work and Characterisation", keyVocabulary: ["script", "character", "motivation", "dialogue", "stage direction"] },
      { topic: "Devising Drama", keyVocabulary: ["devise", "stimulus", "collaborate", "rehearse", "perform"] },
    ],
    "Year 9": [
      { topic: "Theatre Practitioners — Brecht, Stanislavski", keyVocabulary: ["practitioner", "epic theatre", "naturalism", "technique"] },
      { topic: "Exploring Themes Through Drama", keyVocabulary: ["theme", "issue", "explore", "represent", "audience"] },
    ],
    "Year 10": [
      { topic: "GCSE Drama — Component 1: Devising", keyVocabulary: ["devise", "stimulus", "process", "performance", "evaluate"] },
      { topic: "GCSE Drama — Component 2: Scripted Performance", keyVocabulary: ["script", "rehearse", "character", "direction", "perform"] },
    ],
    "Year 11": [
      { topic: "GCSE Drama — Component 3: Written Exam (Live Theatre)", keyVocabulary: ["analyse", "evaluate", "live theatre", "design", "performance"] },
    ],
    "Year 12": [
      { topic: "A-Level Drama — Practitioners and Styles", keyVocabulary: ["Artaud", "Berkoff", "Frantic Assembly", "style", "technique"] },
    ],
    "Year 13": [
      { topic: "A-Level Drama — Text in Performance", keyVocabulary: ["text", "interpretation", "direction", "design", "evaluation"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 11+ PREPARATION
  // ═══════════════════════════════════════════════════════════════════════════
  "eleven-plus": {
    "11+ Preparation": [
      { topic: "Verbal Reasoning — Word Codes and Analogies", keyVocabulary: ["code", "analogy", "pattern", "sequence", "logic"] },
      { topic: "Non-Verbal Reasoning — Patterns and Shapes", keyVocabulary: ["pattern", "rotation", "reflection", "odd one out", "sequence"] },
      { topic: "Maths — Arithmetic and Word Problems", keyVocabulary: ["calculate", "solve", "method", "word problem", "answer"] },
      { topic: "Maths — Fractions, Decimals and Percentages", keyVocabulary: ["fraction", "decimal", "percentage", "convert", "calculate"] },
      { topic: "English — Reading Comprehension", keyVocabulary: ["comprehension", "inference", "evidence", "vocabulary", "summary"] },
      { topic: "English — Grammar and Punctuation", keyVocabulary: ["clause", "punctuation", "tense", "conjunction", "apostrophe"] },
      { topic: "Creative Writing", keyVocabulary: ["narrative", "describe", "character", "setting", "atmosphere"] },
      { topic: "Spatial Reasoning", keyVocabulary: ["spatial", "3D", "net", "fold", "rotate"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BIOLOGY (GCSE separate science)
  // ═══════════════════════════════════════════════════════════════════════════
  biology: {
    "Year 7": [
      { topic: "Cells and Organisation", keyVocabulary: ["cell", "nucleus", "cytoplasm", "cell membrane", "tissue", "organ"] },
      { topic: "Reproduction in Plants and Animals", keyVocabulary: ["fertilisation", "gamete", "pollination", "puberty"] },
      { topic: "Ecosystems and Food Webs", keyVocabulary: ["ecosystem", "food web", "producer", "consumer", "decomposer"] },
    ],
    "Year 8": [
      { topic: "Breathing and Gas Exchange", keyVocabulary: ["lungs", "alveoli", "diaphragm", "oxygen", "carbon dioxide"] },
      { topic: "Health and Lifestyle", keyVocabulary: ["nutrient", "enzyme", "drug", "alcohol", "balanced diet"] },
      { topic: "Genetics and Evolution", keyVocabulary: ["gene", "chromosome", "DNA", "mutation", "natural selection"] },
    ],
    "Year 9": [
      { topic: "Cell Biology", keyVocabulary: ["mitosis", "stem cell", "differentiation", "microscopy"] },
      { topic: "Bioenergetics", keyVocabulary: ["photosynthesis", "respiration", "aerobic", "anaerobic", "metabolism"] },
      { topic: "Infection and Response", keyVocabulary: ["pathogen", "bacteria", "virus", "antibiotic", "vaccination"] },
    ],
    "Year 10": [
      { topic: "Cell Biology and Organisation", keyVocabulary: ["cell", "organ system", "enzyme", "diffusion", "osmosis"] },
      { topic: "Bioenergetics", keyVocabulary: ["photosynthesis", "respiration", "aerobic", "anaerobic", "metabolism"] },
      { topic: "Infection and Response", keyVocabulary: ["pathogen", "bacteria", "virus", "antibiotic", "vaccination"] },
      { topic: "Enzymes", keyVocabulary: ["enzyme", "substrate", "active site", "denaturation", "catalyst"] },
      { topic: "The Heart", keyVocabulary: ["heart", "ventricle", "atrium", "valve", "coronary artery"] },
      { topic: "The Kidney", keyVocabulary: ["kidney", "nephron", "filtration", "reabsorption", "urea"] },
      { topic: "The Eye", keyVocabulary: ["retina", "cornea", "lens", "iris", "optic nerve"] },
      { topic: "Eukaryotic Cells", keyVocabulary: ["eukaryote", "nucleus", "mitochondria", "ribosome", "cell wall"] },
      { topic: "DNA and Genetics", keyVocabulary: ["DNA", "gene", "allele", "dominant", "recessive"] },
      { topic: "Digestive System", keyVocabulary: ["digestion", "enzyme", "stomach", "intestine", "absorption"] },
      { topic: "Hormones", keyVocabulary: ["hormone", "gland", "insulin", "adrenaline", "oestrogen"] },
      { topic: "Nervous System", keyVocabulary: ["neuron", "synapse", "reflex arc", "receptor", "effector"] },
      { topic: "Plant Biology", keyVocabulary: ["photosynthesis", "transpiration", "xylem", "phloem", "stomata"] },
      { topic: "Ecology", keyVocabulary: ["ecosystem", "biodiversity", "food web", "adaptation", "competition"] },
    ],
    "Year 11": [
      { topic: "Homeostasis and Response", keyVocabulary: ["homeostasis", "nervous system", "hormone", "reflex arc", "diabetes"] },
      { topic: "Inheritance, Variation and Evolution", keyVocabulary: ["DNA", "gene", "allele", "natural selection", "speciation"] },
      { topic: "Ecology", keyVocabulary: ["ecosystem", "biodiversity", "decomposition", "carbon cycle", "water cycle"] },
      { topic: "Enzymes", keyVocabulary: ["enzyme", "substrate", "active site", "denaturation", "catalyst"] },
      { topic: "The Heart", keyVocabulary: ["heart", "ventricle", "atrium", "valve", "coronary artery"] },
      { topic: "The Kidney", keyVocabulary: ["kidney", "nephron", "filtration", "reabsorption", "urea"] },
      { topic: "DNA and Genetics", keyVocabulary: ["DNA", "gene", "allele", "dominant", "recessive"] },
    ],
    "Year 12": [
      { topic: "Biological Molecules", keyVocabulary: ["carbohydrate", "protein", "lipid", "nucleic acid", "enzyme"] },
      { topic: "Cells — Advanced", keyVocabulary: ["eukaryote", "prokaryote", "mitosis", "meiosis", "cell cycle"] },
      { topic: "Exchange and Transport", keyVocabulary: ["gas exchange", "mass transport", "haemoglobin", "transpiration"] },
    ],
    "Year 13": [
      { topic: "Genetic Information and Variation", keyVocabulary: ["DNA replication", "transcription", "translation", "mutation"] },
      { topic: "Energy Transfers in Organisms", keyVocabulary: ["ATP", "chemiosmosis", "Calvin cycle", "light-dependent reaction"] },
      { topic: "Organisms Respond to Changes", keyVocabulary: ["nerve impulse", "synapse", "muscle contraction", "homeostasis"] },
      { topic: "Genetics, Populations and Ecosystems", keyVocabulary: ["Hardy-Weinberg", "speciation", "succession", "nutrient cycle"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHEMISTRY (GCSE separate science)
  // ═══════════════════════════════════════════════════════════════════════════
  chemistry: {
    "Year 7": [
      { topic: "Atoms, Elements and Compounds", keyVocabulary: ["atom", "element", "compound", "molecule", "periodic table"] },
      { topic: "Acids and Alkalis", keyVocabulary: ["acid", "alkali", "neutral", "pH", "indicator"] },
      { topic: "Particles and Their Behaviour", keyVocabulary: ["particle", "solid", "liquid", "gas", "diffusion"] },
    ],
    "Year 8": [
      { topic: "Chemical Reactions", keyVocabulary: ["reactant", "product", "exothermic", "endothermic", "word equation"] },
      { topic: "The Periodic Table", keyVocabulary: ["group", "period", "metal", "non-metal", "noble gas"] },
      { topic: "Earth and Atmosphere", keyVocabulary: ["rock cycle", "atmosphere", "greenhouse effect", "climate change"] },
    ],
    "Year 9": [
      { topic: "Atomic Structure and the Periodic Table", keyVocabulary: ["proton", "neutron", "electron", "isotope", "electronic structure"] },
      { topic: "Bonding and Structure", keyVocabulary: ["ionic", "covalent", "metallic", "giant structure", "polymer"] },
      { topic: "Rates of Reaction", keyVocabulary: ["rate", "catalyst", "concentration", "temperature", "surface area"] },
    ],
    "Year 10": [
      { topic: "Atomic Structure and the Periodic Table", keyVocabulary: ["proton", "neutron", "electron", "isotope", "electronic structure"] },
      { topic: "Bonding, Structure and Properties", keyVocabulary: ["ionic bonding", "covalent bonding", "metallic bonding", "properties"] },
      { topic: "Quantitative Chemistry", keyVocabulary: ["mole", "relative atomic mass", "concentration", "yield"] },
      { topic: "Chemical Changes", keyVocabulary: ["oxidation", "reduction", "electrolysis", "reactivity series"] },
      { topic: "Rates of Reaction", keyVocabulary: ["rate", "catalyst", "concentration", "temperature", "surface area"] },
      { topic: "Organic Chemistry", keyVocabulary: ["hydrocarbon", "alkane", "alkene", "polymer", "crude oil"] },
      { topic: "Chemical Analysis", keyVocabulary: ["chromatography", "flame test", "pure substance", "formulation"] },
      { topic: "Acids and Bases", keyVocabulary: ["acid", "base", "neutralisation", "pH", "salt"] },
      { topic: "Electrolysis", keyVocabulary: ["electrolysis", "electrode", "anode", "cathode", "electrolyte"] },
      { topic: "Energy Changes", keyVocabulary: ["exothermic", "endothermic", "bond energy", "activation energy", "enthalpy"] },
    ],
    "Year 11": [
      { topic: "Atomic Structure", keyVocabulary: ["proton", "neutron", "electron", "isotope", "electronic structure", "subatomic particle"] },
      { topic: "Chemical Changes", keyVocabulary: ["oxidation", "reduction", "electrolysis", "reactivity series"] },
      { topic: "Organic Chemistry", keyVocabulary: ["hydrocarbon", "alkane", "alkene", "polymer", "crude oil"] },
      { topic: "Chemical Analysis", keyVocabulary: ["chromatography", "flame test", "pure substance", "formulation"] },
      { topic: "Using Resources", keyVocabulary: ["life cycle assessment", "potable water", "Haber process", "sustainability"] },
      { topic: "Quantitative Chemistry", keyVocabulary: ["mole", "relative atomic mass", "concentration", "yield"] },
    ],
    "Year 12": [
      { topic: "Physical Chemistry — Atomic Structure and Bonding", keyVocabulary: ["ionisation energy", "electron configuration", "electronegativity"] },
      { topic: "Inorganic Chemistry — Periodicity and Groups", keyVocabulary: ["periodicity", "Group 2", "Group 7", "trend"] },
    ],
    "Year 13": [
      { topic: "Organic Chemistry — Advanced", keyVocabulary: ["carbonyl", "carboxylic acid", "ester", "amine", "polymer"] },
      { topic: "Transition Metals and Reactions", keyVocabulary: ["transition metal", "ligand", "complex ion", "redox titration"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHYSICS (GCSE separate science)
  // ═══════════════════════════════════════════════════════════════════════════
  physics: {
    "Year 7": [
      { topic: "Forces and Motion", keyVocabulary: ["force", "Newton", "speed", "distance", "time", "friction"] },
      { topic: "Energy Transfers and Resources", keyVocabulary: ["kinetic", "thermal", "potential", "conservation", "renewable"] },
      { topic: "Sound", keyVocabulary: ["vibration", "frequency", "pitch", "amplitude", "wave"] },
    ],
    "Year 8": [
      { topic: "Light", keyVocabulary: ["reflection", "refraction", "spectrum", "lens", "colour"] },
      { topic: "Electricity and Magnetism", keyVocabulary: ["current", "voltage", "resistance", "magnet", "electromagnet"] },
      { topic: "Motion and Pressure", keyVocabulary: ["velocity", "acceleration", "pressure", "Pascal", "upthrust"] },
    ],
    "Year 9": [
      { topic: "Waves and the Electromagnetic Spectrum", keyVocabulary: ["wavelength", "frequency", "electromagnetic", "gamma", "infrared"] },
      { topic: "Energy and Power", keyVocabulary: ["power", "watt", "efficiency", "energy transfer", "dissipation"] },
      { topic: "Motion and Pressure", keyVocabulary: ["velocity", "acceleration", "pressure", "Pascal", "upthrust"] },
    ],
    "Year 10": [
      { topic: "Energy", keyVocabulary: ["kinetic energy", "potential energy", "specific heat capacity", "power", "efficiency"] },
      { topic: "Electricity", keyVocabulary: ["current", "voltage", "resistance", "Ohm's law", "power"] },
      { topic: "Forces", keyVocabulary: ["resultant force", "Newton's laws", "momentum", "stopping distance"] },
      { topic: "Waves", keyVocabulary: ["transverse", "longitudinal", "electromagnetic spectrum", "reflection", "refraction"] },
      { topic: "Radioactivity", keyVocabulary: ["alpha", "beta", "gamma", "half-life", "ionisation"] },
      { topic: "Circuit Diagrams", keyVocabulary: ["circuit", "component", "series", "parallel", "symbol"] },
      { topic: "Electromagnetic Spectrum", keyVocabulary: ["wavelength", "frequency", "gamma", "infrared", "ultraviolet"] },
      { topic: "Energy Transfers", keyVocabulary: ["conduction", "convection", "radiation", "insulation", "efficiency"] },
      { topic: "Vectors", keyVocabulary: ["vector", "scalar", "magnitude", "direction", "resultant"] },
      { topic: "Space Physics", keyVocabulary: ["orbit", "gravity", "planet", "star", "galaxy"] },
    ],
    "Year 11": [
      { topic: "Waves", keyVocabulary: ["transverse", "longitudinal", "electromagnetic spectrum", "reflection", "refraction"] },
      { topic: "Magnetism and Electromagnetism", keyVocabulary: ["magnetic field", "solenoid", "motor effect", "transformer"] },
      { topic: "Forces", keyVocabulary: ["resultant force", "Newton's laws", "momentum", "stopping distance"] },
      { topic: "Radioactivity", keyVocabulary: ["alpha", "beta", "gamma", "half-life", "ionisation"] },
      { topic: "Space Physics", keyVocabulary: ["orbit", "gravity", "planet", "star", "galaxy"] },
      { topic: "Vectors", keyVocabulary: ["vector", "scalar", "magnitude", "direction", "resultant"] },
    ],
    "Year 12": [
      { topic: "Particles and Radiation", keyVocabulary: ["quark", "lepton", "boson", "antimatter", "photoelectric effect"] },
      { topic: "Waves and Optics", keyVocabulary: ["superposition", "diffraction", "interference", "standing wave"] },
      { topic: "Mechanics and Materials", keyVocabulary: ["stress", "strain", "Young's modulus", "momentum"] },
      { topic: "Electricity — Advanced", keyVocabulary: ["EMF", "internal resistance", "potential divider", "superconductor"] },
    ],
    "Year 13": [
      { topic: "Fields and Their Consequences", keyVocabulary: ["gravitational field", "electric field", "capacitor", "magnetic flux"] },
      { topic: "Nuclear Physics", keyVocabulary: ["radioactive decay", "half-life", "binding energy", "fission", "fusion"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATHS (separate from Mathematics for library matching)
  // ═══════════════════════════════════════════════════════════════════════════
  maths: {
    "Year 7": [
      { topic: "Number and Place Value", keyVocabulary: ["integer", "decimal", "place value", "rounding", "estimation"] },
      { topic: "Fractions, Decimals and Percentages", keyVocabulary: ["fraction", "decimal", "percentage", "equivalent", "convert"] },
      { topic: "Algebra — Introduction", keyVocabulary: ["variable", "expression", "equation", "term", "simplify"] },
      { topic: "Geometry — Angles and Shapes", keyVocabulary: ["angle", "triangle", "quadrilateral", "parallel", "perpendicular"] },
    ],
    "Year 8": [
      { topic: "Ratio and Proportion", keyVocabulary: ["ratio", "proportion", "scale factor", "direct proportion", "unitary method"] },
      { topic: "Algebra — Linear Equations", keyVocabulary: ["equation", "solve", "balance", "unknown", "linear"] },
      { topic: "Statistics and Probability", keyVocabulary: ["mean", "median", "mode", "range", "probability"] },
      { topic: "Geometry — Area and Perimeter", keyVocabulary: ["area", "perimeter", "circumference", "radius", "diameter"] },
    ],
    "Year 9": [
      { topic: "Algebra — Quadratics", keyVocabulary: ["quadratic", "factorise", "expand", "roots", "parabola"] },
      { topic: "Trigonometry", keyVocabulary: ["sine", "cosine", "tangent", "hypotenuse", "SOHCAHTOA"] },
      { topic: "Probability", keyVocabulary: ["probability", "event", "outcome", "tree diagram", "Venn diagram"] },
      { topic: "Geometry — Transformations", keyVocabulary: ["translation", "rotation", "reflection", "enlargement", "vector"] },
    ],
    "Year 10": [
      { topic: "Algebra — Graphs", keyVocabulary: ["gradient", "intercept", "linear", "quadratic", "coordinate"] },
      { topic: "Trigonometry", keyVocabulary: ["sine", "cosine", "tangent", "hypotenuse", "SOHCAHTOA"] },
      { topic: "Statistics", keyVocabulary: ["mean", "median", "mode", "range", "frequency"] },
      { topic: "Geometry — Circles", keyVocabulary: ["radius", "diameter", "circumference", "arc", "sector"] },
      { topic: "Vectors", keyVocabulary: ["vector", "scalar", "magnitude", "direction", "resultant"] },
      { topic: "Simultaneous Equations", keyVocabulary: ["simultaneous", "eliminate", "substitute", "solution", "linear"] },
      { topic: "Inequalities", keyVocabulary: ["inequality", "greater than", "less than", "number line", "region"] },
      { topic: "Sequences", keyVocabulary: ["sequence", "term", "nth term", "arithmetic", "geometric"] },
    ],
    "Year 11": [
      { topic: "Algebra — Quadratics", keyVocabulary: ["quadratic", "factorise", "expand", "roots", "parabola"] },
      { topic: "Trigonometry", keyVocabulary: ["sine", "cosine", "tangent", "hypotenuse", "SOHCAHTOA"] },
      { topic: "Probability", keyVocabulary: ["probability", "event", "outcome", "tree diagram", "Venn diagram"] },
      { topic: "Vectors", keyVocabulary: ["vector", "scalar", "magnitude", "direction", "resultant"] },
      { topic: "Statistics", keyVocabulary: ["mean", "median", "mode", "range", "frequency"] },
      { topic: "Geometry — Circles", keyVocabulary: ["radius", "diameter", "circumference", "arc", "sector"] },
      { topic: "Simultaneous Equations", keyVocabulary: ["simultaneous", "eliminate", "substitute", "solution", "linear"] },
    ],
    "Year 12": [
      { topic: "Pure Mathematics — Algebra and Functions", keyVocabulary: ["function", "domain", "range", "composite", "inverse"] },
      { topic: "Pure Mathematics — Calculus", keyVocabulary: ["differentiation", "integration", "gradient", "area under curve"] },
      { topic: "Statistics — Probability Distributions", keyVocabulary: ["binomial", "normal distribution", "hypothesis test", "p-value"] },
    ],
    "Year 13": [
      { topic: "Pure Mathematics — Advanced Calculus", keyVocabulary: ["integration by parts", "differential equation", "parametric"] },
      { topic: "Mechanics", keyVocabulary: ["force", "momentum", "projectile", "kinematics", "equilibrium"] },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTER SCIENCE
  // ═══════════════════════════════════════════════════════════════════════════
  "computer-science": {
    "Year 7": [
      { topic: "Introduction to Programming", keyVocabulary: ["algorithm", "variable", "loop", "condition", "function"] },
      { topic: "Digital Literacy and E-Safety", keyVocabulary: ["password", "phishing", "cyberbullying", "privacy", "digital footprint"] },
    ],
    "Year 8": [
      { topic: "Data Representation", keyVocabulary: ["binary", "bit", "byte", "hexadecimal", "ASCII"] },
      { topic: "Networks and the Internet", keyVocabulary: ["network", "router", "IP address", "protocol", "bandwidth"] },
    ],
    "Year 9": [
      { topic: "Algorithms and Problem Solving", keyVocabulary: ["algorithm", "pseudocode", "flowchart", "decomposition", "abstraction"] },
      { topic: "Programming Concepts", keyVocabulary: ["variable", "function", "loop", "array", "object-oriented"] },
    ],
    "Year 10": [
      { topic: "Computer Systems", keyVocabulary: ["CPU", "RAM", "storage", "operating system", "fetch-decode-execute"] },
      { topic: "Algorithms and Data Structures", keyVocabulary: ["sorting", "searching", "array", "linked list", "stack"] },
      { topic: "Programming", keyVocabulary: ["variable", "function", "loop", "condition", "debugging"] },
      { topic: "Networks and Cybersecurity", keyVocabulary: ["encryption", "firewall", "malware", "protocol", "network topology"] },
    ],
    "Year 11": [
      { topic: "Computer Systems", keyVocabulary: ["CPU", "RAM", "storage", "operating system", "fetch-decode-execute"] },
      { topic: "Algorithms and Data Structures", keyVocabulary: ["sorting", "searching", "array", "linked list", "stack"] },
      { topic: "Programming", keyVocabulary: ["variable", "function", "loop", "condition", "debugging"] },
      { topic: "Databases", keyVocabulary: ["table", "query", "SQL", "primary key", "relationship"] },
    ],
  },

};

/**
 * Get syllabus topics for a given subject and year group.
 * Returns the specific topics for that year group, or falls back to
 * the closest available year group's topics.
 */
export function getSyllabusTopics(subject: string, yearGroup: string): SyllabusTopic[] {
  const subjectData = SYLLABUS_DATA[subject.toLowerCase()];
  if (!subjectData) return [];

  const yearNum = parseInt(yearGroup.replace(/[^0-9]/g, ""), 10);

  // Handle non-numeric year groups (e.g. "11+ Preparation")
  if (isNaN(yearNum)) {
    const yg = yearGroup as YearGroupKey;
    return subjectData[yg] || [];
  }

  // Define cumulative ranges per key stage:
  // Primary:   Y1–Y6  → accumulate from Y1 up to selected year
  // Secondary: Y7–Y11 → accumulate from Y7 up to selected year
  // Sixth Form: Y12–Y13 → accumulate from Y12 up to selected year
  let startYear: number;
  if (yearNum >= 1 && yearNum <= 6) {
    startYear = 1;
  } else if (yearNum >= 7 && yearNum <= 11) {
    startYear = 7;
  } else if (yearNum >= 12 && yearNum <= 13) {
    startYear = 12;
  } else {
    // Fallback: just return the exact year
    const yg = yearGroup as YearGroupKey;
    return subjectData[yg] || [];
  }

  // Accumulate topics from startYear up to and including yearNum
  // Attach the originating year group label to each topic for display in the dropdown
  const accumulated: SyllabusTopic[] = [];
  const seenTopics = new Set<string>();

  for (let y = startYear; y <= yearNum; y++) {
    const key = `Year ${y}` as YearGroupKey;
    const topics = subjectData[key];
    if (topics) {
      for (const t of topics) {
        if (!seenTopics.has(t.topic)) {
          seenTopics.add(t.topic);
          accumulated.push({ ...t, yearGroup: key });
        }
      }
    }
  }

  // If we found topics, return them sorted with current year's topics first
  if (accumulated.length > 0) return accumulated;

  // Final fallback: try adjacent years
  for (let offset = 1; offset <= 3; offset++) {
    const above = `Year ${yearNum + offset}` as YearGroupKey;
    const below = `Year ${yearNum - offset}` as YearGroupKey;
    if (subjectData[above]) return subjectData[above]!;
    if (subjectData[below]) return subjectData[below]!;
  }

  return [];
}

/**
 * Get all available year groups for a given subject.
 */
export function getAvailableYearGroups(subject: string): YearGroupKey[] {
  const subjectData = SYLLABUS_DATA[subject.toLowerCase()];
  if (!subjectData) return [];
  return Object.keys(subjectData) as YearGroupKey[];
}
