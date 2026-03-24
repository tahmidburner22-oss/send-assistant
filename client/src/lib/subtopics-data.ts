/**
 * subtopics-data.ts
 * Maps every curriculum topic to a list of specific subtopics.
 * Used to populate the second-level dropdown in the worksheet generator.
 *
 * Structure: SUBTOPICS_MAP[topicName] = string[]
 * The topic name must match exactly what appears in syllabus-data.ts.
 */

export const SUBTOPICS_MAP: Record<string, string[]> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — PRIMARY
  // ═══════════════════════════════════════════════════════════════════════════

  "Counting and Number Recognition (to 20)": [
    "Counting forwards and backwards to 20",
    "Writing numbers in words",
    "Ordering numbers on a number line",
    "One more and one less",
  ],
  "Counting in 2s, 5s and 10s": [
    "Counting in 2s",
    "Counting in 5s",
    "Counting in 10s",
    "Identifying patterns in sequences",
  ],
  "Addition and Subtraction (within 20)": [
    "Adding single-digit numbers",
    "Subtracting single-digit numbers",
    "Number bonds to 10 and 20",
    "Using a number line for addition and subtraction",
  ],
  "Place Value (Tens and Ones)": [
    "Partitioning 2-digit numbers",
    "Comparing and ordering 2-digit numbers",
    "Representing numbers with base-10 blocks",
    "Writing numbers in expanded form",
  ],
  "Place Value (to 100)": [
    "Partitioning 2-digit numbers",
    "Comparing and ordering numbers to 100",
    "Counting in tens",
    "Finding 10 more and 10 less",
  ],
  "Place Value (to 1000)": [
    "Hundreds, tens and ones",
    "Comparing and ordering 3-digit numbers",
    "Counting in 100s",
    "Finding 100 more and 100 less",
  ],
  "Place Value (to 10,000)": [
    "Thousands, hundreds, tens and ones",
    "Rounding to the nearest 10, 100 and 1000",
    "Negative numbers",
    "Roman numerals to 1000",
  ],
  "Place Value (to 1,000,000)": [
    "Reading and writing numbers to 1,000,000",
    "Rounding any number",
    "Negative numbers in context",
    "Powers of 10",
  ],
  "Place Value (to 10,000,000 and Negative Numbers)": [
    "Reading and writing numbers to 10,000,000",
    "Ordering and comparing large numbers",
    "Negative numbers — ordering and calculating",
    "Using negative numbers in context",
  ],
  "Addition and Subtraction (Two-Digit Numbers)": [
    "Column addition (no regrouping)",
    "Column addition (with regrouping)",
    "Column subtraction (no regrouping)",
    "Column subtraction (with regrouping)",
  ],
  "Addition and Subtraction (3-Digit Numbers)": [
    "Column addition with 3-digit numbers",
    "Column subtraction with 3-digit numbers",
    "Estimating and checking answers",
    "Problem solving with addition and subtraction",
  ],
  "Addition and Subtraction (4-Digit Numbers)": [
    "Column addition with 4-digit numbers",
    "Column subtraction with 4-digit numbers",
    "Multi-step addition and subtraction",
    "Inverse operations",
  ],
  "Addition and Subtraction (Large Numbers)": [
    "Adding numbers with more than 4 digits",
    "Subtracting numbers with more than 4 digits",
    "Mental strategies for large numbers",
    "Solving multi-step problems",
  ],
  "Multiplication and Division (2, 5, 10 Times Tables)": [
    "2 times table",
    "5 times table",
    "10 times table",
    "Division as the inverse of multiplication",
  ],
  "Multiplication and Division (3, 4, 8 Times Tables)": [
    "3 times table",
    "4 times table",
    "8 times table",
    "Mixed times table practice",
  ],
  "Multiplication and Division (Times Tables to 12×12)": [
    "6, 7, 9, 11, 12 times tables",
    "Short multiplication",
    "Short division",
    "Factor pairs and commutativity",
  ],
  "Multiplication and Division (Multi-Digit)": [
    "Long multiplication",
    "Long division",
    "Multiplying by 10, 100 and 1000",
    "Dividing by 10, 100 and 1000",
  ],
  "Four Operations and Order of Operations": [
    "BIDMAS/BODMAS",
    "Multi-step calculations",
    "Using brackets",
    "Checking answers using inverse operations",
  ],
  "Fractions (Halves, Quarters, Thirds)": [
    "Finding a half of a shape and quantity",
    "Finding a quarter of a shape and quantity",
    "Finding a third of a shape and quantity",
    "Comparing simple fractions",
  ],
  "Fractions — Unit and Non-Unit Fractions": [
    "Unit fractions on a number line",
    "Non-unit fractions",
    "Equivalent fractions",
    "Comparing and ordering fractions",
  ],
  "Fractions and Decimals (Tenths, Hundredths)": [
    "Tenths as fractions and decimals",
    "Hundredths as fractions and decimals",
    "Ordering decimals",
    "Rounding decimals",
  ],
  "Fractions — Adding and Subtracting": [
    "Adding fractions with the same denominator",
    "Subtracting fractions with the same denominator",
    "Adding mixed numbers",
    "Subtracting mixed numbers",
  ],
  "Fractions — All Operations": [
    "Adding and subtracting fractions (different denominators)",
    "Multiplying fractions",
    "Dividing fractions",
    "Fractions of amounts",
  ],
  "Decimals and Percentages": [
    "Percentages as fractions and decimals",
    "Finding percentages of amounts",
    "Percentage increase and decrease",
    "Comparing fractions, decimals and percentages",
  ],
  "Decimals — All Operations": [
    "Adding and subtracting decimals",
    "Multiplying decimals",
    "Dividing decimals",
    "Rounding decimals to decimal places",
  ],
  "Percentages of Amounts": [
    "Finding 10%, 25%, 50%, 75%",
    "Finding any percentage of an amount",
    "Percentage increase and decrease",
    "Reverse percentages",
  ],
  "Ratio and Proportion": [
    "Writing and simplifying ratios",
    "Dividing quantities in a given ratio",
    "Proportion problems",
    "Scale factors",
  ],
  "Algebra — Simple Formulae and Sequences": [
    "Using and writing simple formulae",
    "Number sequences and term-to-term rules",
    "Substitution into expressions",
    "Solving one-step equations",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS — SECONDARY
  // ═══════════════════════════════════════════════════════════════════════════

  "Place Value and Ordering Integers": [
    "Reading and writing large integers",
    "Ordering positive and negative integers",
    "Rounding to significant figures",
    "Estimating calculations",
  ],
  "Fractions, Decimals and Percentages": [
    "Converting between fractions, decimals and percentages",
    "Ordering FDP",
    "Recurring decimals",
    "Percentage change",
  ],
  "Indices and Standard Form": [
    "Laws of indices",
    "Negative and fractional indices",
    "Standard form — writing and converting",
    "Calculations in standard form",
  ],
  "Surds": [
    "Simplifying surds",
    "Adding and subtracting surds",
    "Multiplying and dividing surds",
    "Rationalising the denominator",
  ],
  "Algebraic Expressions": [
    "Simplifying expressions",
    "Expanding single brackets",
    "Expanding double brackets",
    "Factorising expressions",
  ],
  "Solving Linear Equations": [
    "One-step equations",
    "Two-step equations",
    "Equations with unknowns on both sides",
    "Equations with brackets",
  ],
  "Linear Inequalities": [
    "Writing and solving linear inequalities",
    "Representing inequalities on a number line",
    "Double inequalities",
    "Inequalities in two variables",
  ],
  "Sequences": [
    "Arithmetic sequences — nth term",
    "Geometric sequences",
    "Quadratic sequences",
    "Fibonacci-type sequences",
  ],
  "Straight-Line Graphs": [
    "Plotting straight-line graphs",
    "Gradient and y-intercept",
    "Equation of a straight line (y = mx + c)",
    "Parallel and perpendicular lines",
  ],
  "Quadratic Equations": [
    "Factorising quadratics",
    "Completing the square",
    "Using the quadratic formula",
    "Discriminant",
  ],
  "Simultaneous Equations": [
    "Solving by elimination",
    "Solving by substitution",
    "Graphical solutions",
    "Non-linear simultaneous equations",
  ],
  "Functions and Graphs": [
    "Function notation",
    "Composite and inverse functions",
    "Transformations of graphs",
    "Sketching quadratic, cubic and reciprocal graphs",
  ],
  "Fractions — Secondary": [
    "Adding and subtracting algebraic fractions",
    "Multiplying and dividing algebraic fractions",
    "Simplifying algebraic fractions",
    "Equations involving fractions",
  ],
  "Fractions": [
    "Adding and subtracting fractions",
    "Multiplying fractions",
    "Dividing fractions",
    "Algebraic fractions",
  ],
  "Percentages": [
    "Percentage of an amount",
    "Percentage increase and decrease",
    "Reverse percentages",
    "Compound interest and depreciation",
  ],
  "Angles": [
    "Angles on a straight line and at a point",
    "Angles in triangles and quadrilaterals",
    "Angles in parallel lines",
    "Angles in polygons",
  ],
  "Pythagoras' Theorem": [
    "Finding the hypotenuse",
    "Finding a shorter side",
    "Applying Pythagoras in 2D problems",
    "Applying Pythagoras in 3D problems",
  ],
  "Trigonometry": [
    "SOH CAH TOA — finding sides",
    "SOH CAH TOA — finding angles",
    "Exact trigonometric values",
    "Sine and cosine rules",
  ],
  "Area and Perimeter": [
    "Area of rectangles, triangles and parallelograms",
    "Area of trapeziums and composite shapes",
    "Circumference of a circle",
    "Area of a circle",
  ],
  "Volume and Surface Area": [
    "Volume of prisms and cylinders",
    "Volume of pyramids, cones and spheres",
    "Surface area of prisms",
    "Surface area of cylinders and spheres",
  ],
  "Transformations": [
    "Reflection",
    "Rotation",
    "Translation",
    "Enlargement",
  ],
  "Vectors": [
    "Writing and representing vectors",
    "Adding and subtracting vectors",
    "Multiplying vectors by a scalar",
    "Vector geometry proofs",
  ],
  "Probability": [
    "Basic probability — single events",
    "Mutually exclusive events",
    "Tree diagrams",
    "Conditional probability and Venn diagrams",
  ],
  "Statistics": [
    "Mean, median, mode and range",
    "Frequency tables and grouped data",
    "Cumulative frequency and box plots",
    "Histograms",
  ],
  "Ratio": [
    "Simplifying ratios",
    "Dividing in a ratio",
    "Ratio and proportion problems",
    "Best value problems",
  ],
  "Proportion": [
    "Direct proportion",
    "Inverse proportion",
    "Proportion graphs",
    "Proportion in context (recipes, maps, scale)",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGLISH — PRIMARY
  // ═══════════════════════════════════════════════════════════════════════════

  "Phonics — Phase 2": [
    "s, a, t, p, i, n sounds",
    "m, d, g, o, c, k sounds",
    "Blending CVC words",
    "Reading simple sentences",
  ],
  "Phonics — Phase 3": [
    "Consonant digraphs (ch, sh, th, ng)",
    "Long vowel sounds (ai, ee, igh, oa, oo)",
    "Blending CVCC and CCVC words",
    "Tricky words",
  ],
  "Phonics — Phase 4 and 5": [
    "Adjacent consonants",
    "Alternative spellings of vowel sounds",
    "Split digraphs (a-e, e-e, i-e, o-e, u-e)",
    "Applying phonics in reading and writing",
  ],
  "Sentence Structure": [
    "Capital letters and full stops",
    "Question marks and exclamation marks",
    "Joining sentences with 'and'",
    "Writing simple and compound sentences",
  ],
  "Punctuation": [
    "Capital letters and full stops",
    "Commas in lists",
    "Apostrophes for contraction",
    "Apostrophes for possession",
    "Inverted commas for speech",
    "Colons and semi-colons",
  ],
  "Grammar — Nouns, Verbs and Adjectives": [
    "Identifying nouns",
    "Identifying verbs",
    "Identifying adjectives",
    "Using adjectives to expand noun phrases",
  ],
  "Grammar — Adverbs and Prepositions": [
    "Adverbs of manner",
    "Adverbs of time and place",
    "Prepositions of place",
    "Prepositions of time",
  ],
  "Grammar — Tenses": [
    "Simple past tense",
    "Simple present tense",
    "Progressive (continuous) tense",
    "Perfect tense",
  ],
  "Comprehension — Fiction": [
    "Retrieving information from a text",
    "Inference and deduction",
    "Predicting what might happen next",
    "Summarising a text",
  ],
  "Comprehension — Non-Fiction": [
    "Identifying the main idea",
    "Retrieving facts and information",
    "Explaining the purpose of a text",
    "Comparing information from two texts",
  ],
  "Creative Writing — Stories": [
    "Story structure (beginning, middle, end)",
    "Character description",
    "Setting description",
    "Using dialogue in stories",
  ],
  "Creative Writing — Poetry": [
    "Rhyme and rhythm",
    "Simile and metaphor",
    "Personification",
    "Writing free verse poetry",
  ],
  "Spelling — Common Exception Words": [
    "Year 3/4 common exception words",
    "Year 5/6 common exception words",
    "Homophones and near-homophones",
    "Prefixes and suffixes",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGLISH — SECONDARY
  // ═══════════════════════════════════════════════════════════════════════════

  "Macbeth": [
    "Act 1 — The witches and Macbeth's ambition",
    "Act 2 — The murder of King Duncan",
    "Act 3 — Banquo's ghost and Macbeth's tyranny",
    "Act 4 — The witches' prophecies and Macduff",
    "Act 5 — Lady Macbeth's breakdown and Macbeth's downfall",
    "Themes — Ambition and power",
    "Themes — Guilt and conscience",
    "Themes — Appearance vs reality",
    "Themes — Gender and masculinity",
    "Character — Macbeth",
    "Character — Lady Macbeth",
    "Character — The witches",
    "Character — Banquo",
    "Language analysis — key quotations",
    "Context — Jacobean society and divine right of kings",
  ],
  "Romeo and Juliet": [
    "Act 1 — The feud and first meeting",
    "Act 2 — The balcony scene and marriage",
    "Act 3 — Mercutio's death and Romeo's banishment",
    "Act 4 — Juliet's plan and the sleeping potion",
    "Act 5 — The tragic ending",
    "Themes — Love and hate",
    "Themes — Fate and free will",
    "Themes — Family and loyalty",
    "Character — Romeo",
    "Character — Juliet",
    "Character — Friar Lawrence",
    "Language analysis — key quotations",
    "Context — Elizabethan society",
  ],
  "A Christmas Carol": [
    "Stave 1 — Scrooge and Marley's ghost",
    "Stave 2 — The Ghost of Christmas Past",
    "Stave 3 — The Ghost of Christmas Present",
    "Stave 4 — The Ghost of Christmas Yet to Come",
    "Stave 5 — Scrooge's redemption",
    "Themes — Poverty and social responsibility",
    "Themes — Redemption and change",
    "Themes — Christmas and generosity",
    "Character — Scrooge",
    "Character — Bob Cratchit and Tiny Tim",
    "Language analysis — key quotations",
    "Context — Victorian England and the Poor Laws",
  ],
  "An Inspector Calls": [
    "Act 1 — The Birling family and Gerald",
    "Act 2 — Sheila and Gerald's involvement",
    "Act 3 — Eric's confession and the Inspector's identity",
    "Themes — Social responsibility",
    "Themes — Class and inequality",
    "Themes — Gender and power",
    "Character — Inspector Goole",
    "Character — Mr Birling",
    "Character — Sheila Birling",
    "Language analysis — key quotations",
    "Context — 1912 vs 1945",
  ],
  "Power and Conflict Poetry": [
    "Ozymandias — Shelley",
    "London — Blake",
    "The Prelude — Wordsworth",
    "My Last Duchess — Browning",
    "Charge of the Light Brigade — Tennyson",
    "Exposure — Owen",
    "Storm on the Island — Heaney",
    "Bayonet Charge — Hughes",
    "Remains — Armitage",
    "Poppies — Weir",
    "War Photographer — Duffy",
    "Tissue — Dharker",
    "The Emigrée — Rumens",
    "Kamikaze — Garland",
    "Checking Out Me History — Agard",
    "Comparing poems — themes and methods",
  ],
  "Love and Relationships Poetry": [
    "Sonnet 29 — Shakespeare",
    "La Belle Dame Sans Merci — Keats",
    "Porphyria's Lover — Browning",
    "Neutral Tones — Hardy",
    "The Farmer's Bride — Mew",
    "Walking Away — Day Lewis",
    "Eden Rock — Causley",
    "Follower — Heaney",
    "Before You Were Mine — Duffy",
    "Winter Swans — Sheers",
    "Singh Song! — Nagra",
    "Climbing My Grandfather — Waterhouse",
    "Comparing poems — themes and methods",
  ],
  "Language Paper 1 — Fiction Reading": [
    "Q1 — Identifying true statements",
    "Q2 — Language analysis (word and phrase level)",
    "Q3 — Structural features",
    "Q4 — Evaluating the writer's methods",
    "Identifying language techniques",
    "Writing about structure",
  ],
  "Language Paper 2 — Non-Fiction Reading": [
    "Q1 — Identifying true statements",
    "Q2 — Summarising and synthesising",
    "Q3 — Language analysis",
    "Q4 — Comparing writers' perspectives",
    "Comparing texts",
    "Identifying writer's viewpoint",
  ],
  "Language Paper 1 — Creative Writing": [
    "Descriptive writing techniques",
    "Narrative writing — story structure",
    "Openings and endings",
    "Using varied sentence structures",
    "Vocabulary choices for effect",
  ],
  "Language Paper 2 — Transactional Writing": [
    "Writing to argue",
    "Writing to persuade",
    "Writing to advise",
    "Formal letter writing",
    "Speech writing",
    "Article writing",
  ],
  "Reading — Comprehension and Analysis": [
    "Retrieving information",
    "Inference and deduction",
    "Language analysis — word level",
    "Language analysis — sentence level",
    "Structural analysis",
    "Evaluating a writer's methods",
  ],
  "Writing — Descriptive and Narrative": [
    "Descriptive writing",
    "Narrative writing",
    "Character development",
    "Setting and atmosphere",
    "Dialogue and speech",
  ],
  "Writing — Transactional": [
    "Formal letter",
    "Persuasive speech",
    "Newspaper article",
    "Report writing",
    "Review writing",
  ],
  "Grammar and Punctuation": [
    "Sentence types — simple, compound, complex",
    "Punctuation — commas, colons, semi-colons",
    "Apostrophes",
    "Inverted commas",
    "Active and passive voice",
    "Tenses",
  ],
  "Spoken Language": [
    "Preparing a formal presentation",
    "Responding to questions",
    "Analysing spoken language features",
    "Standard and non-standard English",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // SCIENCE
  // ═══════════════════════════════════════════════════════════════════════════

  "Electricity and Circuits": [
    "Components of a circuit",
    "Series and parallel circuits",
    "Current, voltage and resistance",
    "Ohm's Law",
    "Electrical power",
    "Domestic electricity and safety",
  ],
  "Forces and Motion": [
    "Types of forces",
    "Newton's Laws of Motion",
    "Speed, distance and time",
    "Acceleration",
    "Friction and air resistance",
    "Gravity and weight",
  ],
  "Waves — Light": [
    "Properties of light",
    "Reflection and refraction",
    "Lenses and mirrors",
    "The electromagnetic spectrum",
    "Colour and filters",
  ],
  "Waves — Sound": [
    "Properties of sound waves",
    "Speed of sound",
    "Loudness and pitch",
    "Echoes and reflection",
    "Hearing and the ear",
  ],
  "Energy": [
    "Forms of energy",
    "Energy transfers and transformations",
    "Conservation of energy",
    "Efficiency",
    "Renewable and non-renewable energy sources",
  ],
  "Magnetism and Electromagnetism": [
    "Magnetic fields and poles",
    "Permanent and induced magnets",
    "Electromagnets",
    "Uses of electromagnets",
    "The motor effect",
  ],
  "Atomic Structure": [
    "Protons, neutrons and electrons",
    "Atomic number and mass number",
    "Isotopes",
    "Electronic configuration",
    "History of atomic models",
  ],
  "Periodic Table": [
    "Structure of the periodic table",
    "Groups and periods",
    "Properties of metals and non-metals",
    "Group 1 — Alkali metals",
    "Group 7 — Halogens",
    "Group 0 — Noble gases",
    "Transition metals",
  ],
  "Chemical Bonding": [
    "Ionic bonding",
    "Covalent bonding",
    "Metallic bonding",
    "Properties of ionic compounds",
    "Properties of covalent substances",
  ],
  "Acids and Bases": [
    "pH scale and indicators",
    "Neutralisation reactions",
    "Reactions of acids with metals",
    "Reactions of acids with carbonates",
    "Making salts",
  ],
  "Rates of Reaction": [
    "Factors affecting rate of reaction",
    "Collision theory",
    "Catalysts",
    "Measuring rates of reaction",
    "Reversible reactions and equilibrium",
  ],
  "Organic Chemistry": [
    "Alkanes and alkenes",
    "Combustion reactions",
    "Cracking",
    "Polymers",
    "Alcohols and carboxylic acids",
  ],
  "Cell Biology": [
    "Animal and plant cells",
    "Cell organelles",
    "Prokaryotic and eukaryotic cells",
    "Diffusion, osmosis and active transport",
    "Mitosis and cell division",
  ],
  "Genetics and Evolution": [
    "DNA structure and genes",
    "Chromosomes and inheritance",
    "Monohybrid crosses and Punnett squares",
    "Mutations",
    "Natural selection and evolution",
    "Evidence for evolution",
  ],
  "Ecology": [
    "Food chains and food webs",
    "Biotic and abiotic factors",
    "Adaptations",
    "The carbon cycle",
    "The water cycle",
    "Human impact on ecosystems",
    "Biodiversity",
  ],
  "Human Biology — Digestion": [
    "Organs of the digestive system",
    "Enzymes in digestion",
    "Absorption of nutrients",
    "Diet and nutrition",
  ],
  "Human Biology — Circulation": [
    "The heart and blood vessels",
    "Blood and its components",
    "The cardiac cycle",
    "Coronary heart disease",
  ],
  "Human Biology — Respiration": [
    "Aerobic respiration",
    "Anaerobic respiration",
    "The respiratory system",
    "Gas exchange in the lungs",
  ],
  "Human Biology — Nervous System": [
    "The central nervous system",
    "Neurones and synapses",
    "Reflex arcs",
    "The brain",
  ],
  "Human Biology — Hormones": [
    "The endocrine system",
    "Insulin and blood glucose control",
    "Adrenaline",
    "Reproductive hormones",
    "Hormones in contraception and fertility treatment",
  ],
  "Photosynthesis": [
    "The equation for photosynthesis",
    "Factors affecting the rate of photosynthesis",
    "Leaf structure and adaptations",
    "Limiting factors",
    "Investigating photosynthesis",
  ],
  "Respiration": [
    "Aerobic respiration equation",
    "Anaerobic respiration",
    "ATP and energy release",
    "Investigating respiration",
  ],
  "Space Physics": [
    "The Solar System",
    "Gravity and orbits",
    "The life cycle of stars",
    "Red-shift and the Big Bang",
    "Space exploration",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY
  // ═══════════════════════════════════════════════════════════════════════════

  "The Norman Conquest": [
    "The Battle of Hastings 1066",
    "William the Conqueror",
    "The Domesday Book",
    "Norman castles and control",
    "Changes to English society",
  ],
  "Medieval England": [
    "The feudal system",
    "The Black Death",
    "Magna Carta and the barons",
    "The Crusades",
    "Medieval towns and trade",
  ],
  "The Tudors": [
    "Henry VII and the end of the Wars of the Roses",
    "Henry VIII and the break with Rome",
    "The dissolution of the monasteries",
    "Edward VI and Protestant reforms",
    "Mary I and the Counter-Reformation",
    "Elizabeth I and the Elizabethan era",
    "The Spanish Armada",
  ],
  "World War One": [
    "Causes of WWI — MAIN factors",
    "The assassination of Franz Ferdinand",
    "Trench warfare",
    "Key battles — Somme, Ypres, Verdun",
    "Life on the Home Front",
    "The end of the war and the Treaty of Versailles",
  ],
  "World War Two": [
    "Causes of WWII — rise of Hitler and Nazi Germany",
    "The Holocaust",
    "The Blitz and the Home Front",
    "D-Day and the liberation of Europe",
    "The Pacific War and the atomic bombs",
    "The end of the war and its aftermath",
  ],
  "The Cold War": [
    "Origins of the Cold War",
    "The Berlin Wall",
    "The Cuban Missile Crisis",
    "The Space Race",
    "The end of the Cold War",
  ],
  "Civil Rights in America": [
    "Segregation and Jim Crow laws",
    "Rosa Parks and the Montgomery Bus Boycott",
    "Martin Luther King Jr.",
    "The Civil Rights Act 1964",
    "Malcolm X and Black Power",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // GEOGRAPHY
  // ═══════════════════════════════════════════════════════════════════════════

  "Tectonic Hazards": [
    "Structure of the Earth",
    "Plate boundaries",
    "Earthquakes — causes and effects",
    "Volcanoes — types and eruptions",
    "Case studies — Christchurch, Haiti, Iceland",
    "Managing tectonic hazards",
  ],
  "Weather and Climate": [
    "UK weather patterns",
    "Tropical storms — formation and effects",
    "Climate zones",
    "Factors affecting climate",
    "Case studies — Hurricane Katrina, Typhoon Haiyan",
  ],
  "Climate Change": [
    "Evidence for climate change",
    "Causes — natural and human",
    "Effects on ecosystems and people",
    "Mitigation strategies",
    "Adaptation strategies",
    "International agreements",
  ],
  "Rivers": [
    "The water cycle",
    "River processes — erosion, transportation, deposition",
    "River landforms — waterfalls, meanders, oxbow lakes",
    "Flooding — causes and effects",
    "Managing floods",
    "Case study — River Severn or Boscastle",
  ],
  "Coasts": [
    "Coastal processes — erosion, transportation, deposition",
    "Coastal landforms — cliffs, bays, headlands, spits",
    "Coastal flooding",
    "Managing coasts — hard and soft engineering",
    "Case study — Holderness or Chesil Beach",
  ],
  "Urbanisation": [
    "What is urbanisation?",
    "Push and pull factors",
    "Urban growth in LICs — squatter settlements",
    "Urban growth in HICs — suburbanisation and counter-urbanisation",
    "Case study — Rio de Janeiro or Mumbai",
  ],
  "Development": [
    "Measuring development — GNI, HDI, literacy",
    "The development gap",
    "Causes of uneven development",
    "Aid and trade",
    "Case study — Ethiopia or India",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // RELIGIOUS STUDIES
  // ═══════════════════════════════════════════════════════════════════════════

  "Christianity — Beliefs": [
    "The nature of God — omnipotent, omniscient, omnibenevolent",
    "The Trinity",
    "Creation",
    "Incarnation and Jesus",
    "Salvation and atonement",
    "Afterlife — heaven, hell, purgatory",
  ],
  "Christianity — Practices": [
    "Worship — prayer and church services",
    "Sacraments — baptism and Eucharist",
    "The role of the Church in the community",
    "Pilgrimage",
    "Festivals — Christmas and Easter",
  ],
  "Islam — Beliefs": [
    "The six articles of faith",
    "Tawhid — the oneness of Allah",
    "Prophethood and Muhammad (pbuh)",
    "The Quran",
    "Angels and the Day of Judgement",
    "Predestination",
  ],
  "Islam — Practices": [
    "The Five Pillars",
    "Salah — prayer",
    "Sawm — fasting during Ramadan",
    "Zakat — charity",
    "Hajj — pilgrimage",
    "Jihad",
  ],
  "Ethics — Crime and Punishment": [
    "Causes of crime",
    "Aims of punishment",
    "Capital punishment",
    "Forgiveness and redemption",
    "Religious attitudes to crime and punishment",
  ],
  "Ethics — Peace and Conflict": [
    "Just War theory",
    "Holy War",
    "Pacifism",
    "Nuclear weapons",
    "Religious responses to conflict",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTER SCIENCE
  // ═══════════════════════════════════════════════════════════════════════════

  "Algorithms": [
    "What is an algorithm?",
    "Flowcharts",
    "Pseudocode",
    "Searching algorithms — linear and binary search",
    "Sorting algorithms — bubble, merge, insertion sort",
  ],
  "Programming Fundamentals": [
    "Variables and data types",
    "Input and output",
    "Sequence, selection and iteration",
    "Functions and procedures",
    "Arrays and lists",
  ],
  "Data Representation": [
    "Binary and denary conversion",
    "Hexadecimal",
    "Binary arithmetic",
    "Representing text — ASCII and Unicode",
    "Representing images",
    "Representing sound",
  ],
  "Computer Systems": [
    "CPU components — ALU, CU, registers, cache",
    "The fetch-decode-execute cycle",
    "Primary and secondary storage",
    "Input and output devices",
    "Operating systems",
  ],
  "Networks": [
    "Types of networks — LAN and WAN",
    "Network topologies",
    "Protocols — TCP/IP, HTTP, FTP",
    "The Internet and World Wide Web",
    "Network security — firewalls, encryption",
  ],
  "Cyber Security": [
    "Types of cyber attack — malware, phishing, brute force",
    "Social engineering",
    "Network security measures",
    "Encryption",
    "Ethical and legal issues",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // MODERN FOREIGN LANGUAGES
  // ═══════════════════════════════════════════════════════════════════════════

  "French — Present Tense": [
    "Regular -er verbs",
    "Regular -ir verbs",
    "Regular -re verbs",
    "Common irregular verbs — être, avoir, aller, faire",
    "Reflexive verbs",
  ],
  "French — Past Tenses": [
    "Passé composé with avoir",
    "Passé composé with être",
    "Imparfait",
    "Using passé composé and imparfait together",
  ],
  "French — Future Tense": [
    "Futur proche (aller + infinitive)",
    "Futur simple",
    "Conditional tense",
  ],
  "Spanish — Present Tense": [
    "Regular -ar verbs",
    "Regular -er and -ir verbs",
    "Common irregular verbs — ser, estar, tener, ir",
    "Reflexive verbs",
    "Radical-changing verbs",
  ],
  "Spanish — Past Tenses": [
    "Pretérito indefinido (regular)",
    "Pretérito indefinido (irregular)",
    "Pretérito imperfecto",
    "Using preterite and imperfect together",
  ],
  "Spanish — Future Tense": [
    "Ir a + infinitive",
    "Futuro simple",
    "Conditional tense",
  ],
  "German — Present Tense": [
    "Regular verb conjugation",
    "Common irregular verbs — sein, haben, werden",
    "Modal verbs",
    "Separable verbs",
  ],
  "German — Past Tenses": [
    "Perfekt with haben",
    "Perfekt with sein",
    "Imperfekt",
    "Using Perfekt and Imperfekt",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS STUDIES
  // ═══════════════════════════════════════════════════════════════════════════

  "Business Ownership": [
    "Sole traders",
    "Partnerships",
    "Limited companies (Ltd and PLC)",
    "Franchises",
    "Social enterprises",
  ],
  "Marketing": [
    "The marketing mix — 4Ps",
    "Market research",
    "Target markets and segmentation",
    "Advertising and promotion",
    "Pricing strategies",
  ],
  "Finance": [
    "Revenue, costs and profit",
    "Break-even analysis",
    "Cash flow forecasting",
    "Sources of finance",
    "Financial statements",
  ],
  "Human Resources": [
    "Recruitment and selection",
    "Training and development",
    "Motivation theories",
    "Organisational structures",
    "Employment law",
  ],
  "Operations": [
    "Production methods",
    "Quality control and assurance",
    "Supply chain management",
    "Lean production",
    "Technology in operations",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // PSYCHOLOGY
  // ═══════════════════════════════════════════════════════════════════════════

  "Social Influence": [
    "Types of conformity — compliance, identification, internalisation",
    "Asch's conformity study",
    "Milgram's obedience study",
    "Situational and dispositional factors",
    "Resistance to social influence",
    "Social change",
  ],
  "Memory": [
    "The multi-store model",
    "The working memory model",
    "Types of long-term memory",
    "Forgetting — interference and retrieval failure",
    "Eyewitness testimony",
    "Cognitive interview",
  ],
  "Attachment": [
    "Caregiver-infant interactions",
    "Schaffer's stages of attachment",
    "Ainsworth's Strange Situation",
    "Types of attachment",
    "Bowlby's theory of attachment",
    "Effects of institutionalisation",
  ],
  "Psychopathology": [
    "Definitions of abnormality",
    "Phobias — characteristics and treatments",
    "Depression — characteristics and treatments",
    "OCD — characteristics and treatments",
    "Cognitive behavioural therapy (CBT)",
  ],
  "Approaches in Psychology": [
    "The behaviourist approach",
    "The social learning theory",
    "The cognitive approach",
    "The biological approach",
    "The psychodynamic approach",
    "The humanistic approach",
  ],
  "Research Methods": [
    "Experimental methods",
    "Observations",
    "Self-report methods",
    "Correlations",
    "Ethical issues in research",
    "Data analysis — mean, median, mode, range",
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ECONOMICS
  // ═══════════════════════════════════════════════════════════════════════════

  "Supply and Demand": [
    "The law of demand",
    "The law of supply",
    "Market equilibrium",
    "Shifts in demand and supply",
    "Price elasticity of demand",
    "Price elasticity of supply",
  ],
  "Market Failure": [
    "Externalities — positive and negative",
    "Public goods",
    "Information failure",
    "Government intervention",
    "Taxes and subsidies",
  ],
  "Macroeconomics": [
    "GDP and economic growth",
    "Inflation",
    "Unemployment",
    "The balance of payments",
    "Fiscal and monetary policy",
  ],
  "International Trade": [
    "Comparative advantage",
    "Free trade and protectionism",
    "Trade barriers",
    "Globalisation",
    "Exchange rates",
  ],
};

/**
 * Get subtopics for a given topic name.
 * Returns an empty array if no subtopics are defined.
 */
export function getSubtopics(topicName: string): string[] {
  if (!topicName) return [];
  // Try exact match first
  if (SUBTOPICS_MAP[topicName]) return SUBTOPICS_MAP[topicName];
  // Try case-insensitive match
  const lower = topicName.toLowerCase();
  const key = Object.keys(SUBTOPICS_MAP).find(k => k.toLowerCase() === lower);
  if (key) return SUBTOPICS_MAP[key];
  // Try partial match (topic name contains a known key)
  const partialKey = Object.keys(SUBTOPICS_MAP).find(k =>
    topicName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(topicName.toLowerCase())
  );
  if (partialKey) return SUBTOPICS_MAP[partialKey];
  return [];
}
