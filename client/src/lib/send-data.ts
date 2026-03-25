// Adaptly — Core Data (Based on COBS Handbook & UK SEND Code of Practice)

export const subjects = [
  { id: "english", name: "English", icon: "BookOpen", color: "#7C3AED" },
  { id: "mathematics", name: "Mathematics", icon: "Calculator", color: "#10B981" },
  { id: "science", name: "Science", icon: "Flask", color: "#3B82F6" },
  { id: "history", name: "History", icon: "Landmark", color: "#F59E0B" },
  { id: "geography", name: "Geography", icon: "Globe", color: "#06B6D4" },
  { id: "art", name: "Art & Design", icon: "Palette", color: "#EC4899" },
  { id: "music", name: "Music", icon: "Music", color: "#8B5CF6" },
  { id: "pe", name: "Physical Education", icon: "Dumbbell", color: "#EF4444" },
  { id: "computing", name: "Computing", icon: "Monitor", color: "#6366F1" },
  { id: "dt", name: "Design & Technology", icon: "Wrench", color: "#F97316" },
  { id: "re", name: "Religious Education", icon: "Heart", color: "#14B8A6" },
  { id: "mfl", name: "Modern Foreign Languages", icon: "Languages", color: "#A855F7" },
  { id: "pshe", name: "PSHE", icon: "Users", color: "#22C55E" },
  { id: "business", name: "Business Studies", icon: "Briefcase", color: "#64748B" },
  { id: "drama", name: "Drama", icon: "Theater", color: "#E11D48" },
  { id: "eleven-plus", name: "11+ Preparation", icon: "Star", color: "#F97316" },
];

export const yearGroups = [
  "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
  "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13",
  "11+ Preparation",
];

export const examBoards = [
  { id: "none", name: "No Exam Board" },
  { id: "aqa", name: "AQA" },
  { id: "edexcel", name: "Edexcel (Pearson)" },
  { id: "ocr", name: "OCR" },
  { id: "wjec", name: "WJEC / Eduqas" },
];

export const difficulties = [
  { id: "foundation", name: "Foundation", description: "Heavily scaffolded with sentence starters" },
  { id: "mixed", name: "Mixed", description: "Range of difficulty levels" },
  { id: "higher", name: "Higher", description: "Stretch, challenge and extension" },
];

/**
 * Subject-specific tier mode:
 * - "tiered"      : GCSE Foundation / Higher (Maths, Sciences, MFL)
 * - "single"      : Single-tier GCSE with Entry/Standard/Extended scaffolding (English)
 * - "levelled"    : No formal GCSE tier — Access / Standard / Extended (Humanities, Arts, etc.)
 * - "eleven-plus" : Standard / Advanced (11+ prep)
 */
export type TierMode = "tiered" | "single" | "levelled" | "eleven-plus";

export const subjectTierMode: Record<string, TierMode> = {
  mathematics: "tiered",
  science: "tiered",
  mfl: "tiered",
  english: "single",
  history: "levelled",
  geography: "levelled",
  art: "levelled",
  music: "levelled",
  pe: "levelled",
  computing: "levelled",
  dt: "levelled",
  re: "levelled",
  pshe: "levelled",
  business: "levelled",
  drama: "levelled",
  "eleven-plus": "eleven-plus",
};

/** Returns the difficulty/tier buttons appropriate for a given subject. */
export function getDifficultyOptions(subject: string): { id: string; name: string; description: string }[] {
  const mode: TierMode = subjectTierMode[subject.toLowerCase()] ?? "levelled";
  switch (mode) {
    case "tiered":
      return [
        { id: "foundation", name: "Foundation", description: "GCSE Foundation tier — grades 1–5" },
        { id: "mixed",      name: "Mixed",       description: "Questions from both Foundation and Higher tiers" },
        { id: "higher",    name: "Higher",      description: "GCSE Higher tier — grades 4–9" },
      ];
    case "single":
      return [
        { id: "foundation", name: "Entry Level", description: "Entry-level scaffolded support" },
        { id: "mixed",      name: "Standard",   description: "Standard GCSE single-tier questions" },
        { id: "higher",    name: "Extended",   description: "Extended / stretch questions" },
      ];
    case "eleven-plus":
      return [
        { id: "foundation", name: "Standard",  description: "Standard 11+ difficulty" },
        { id: "higher",    name: "Advanced", description: "Advanced / selective school level" },
      ];
    case "levelled":
    default:
      return [
        { id: "foundation", name: "Access",   description: "Heavily scaffolded — access-level support" },
        { id: "mixed",      name: "Standard", description: "Standard curriculum level" },
        { id: "higher",    name: "Extended", description: "Extended / stretch and challenge" },
      ];
  }
}

export const storyGenres = [
  { id: "adventure", name: "Adventure", emoji: "🗺️" },
  { id: "fantasy", name: "Fantasy", emoji: "🧙" },
  { id: "mystery", name: "Mystery", emoji: "🔍" },
  { id: "sci-fi", name: "Science Fiction", emoji: "🚀" },
  { id: "historical", name: "Historical Fiction", emoji: "🏰" },
  { id: "comedy", name: "Comedy", emoji: "😄" },
  { id: "animal", name: "Animal Story", emoji: "🐾" },
  { id: "fairy-tale", name: "Fairy Tale", emoji: "🧚" },
  { id: "realistic", name: "Realistic Fiction", emoji: "🏠" },
  { id: "superhero", name: "Superhero", emoji: "🦸" },
  { id: "spooky", name: "Mild Horror / Spooky", emoji: "👻" },
  { id: "sports", name: "Sports Story", emoji: "⚽" },
];

export const storyLengths = [
  { id: "short", name: "Short", words: "~500 words" },
  { id: "medium", name: "Medium", words: "~1000 words" },
  { id: "long", name: "Long", words: "~1800 words" },
  { id: "extra-long", name: "Extra Long", words: "~3000 words" },
];
export const readingLevels = [
  { id: "age-appropriate", name: "Reading Age: Matched to Year Group" },
  { id: "reading-age-6-7", name: "Reading Age: 6–7 years" },
  { id: "reading-age-7-8", name: "Reading Age: 7–8 years" },
  { id: "reading-age-8-9", name: "Reading Age: 8–9 years" },
  { id: "reading-age-9-10", name: "Reading Age: 9–10 years" },
  { id: "reading-age-10-11", name: "Reading Age: 10–11 years" },
  { id: "reading-age-11-12", name: "Reading Age: 11–12 years" },
  { id: "reading-age-12-13", name: "Reading Age: 12–13 years" },
  { id: "reading-age-13-14", name: "Reading Age: 13–14 years" },
  { id: "reading-age-14-plus", name: "Reading Age: 14+ years" },
  { id: "reading-age-15-16", name: "Reading Age: 15-16 years" },
  { id: "reading-age-16-17", name: "Reading Age: 16-17 years" },
  { id: "reading-age-17-plus", name: "Reading Age: 17+ years" }
];

export const colorOverlays = [
  { id: "none", name: "None (White)", color: "#FFFFFF", description: "Standard white background" },
  { id: "cream", name: "Cream", color: "#FFF8E7", description: "Dyslexia — reduces contrast glare (COBS recommended)" },
  { id: "pale-yellow", name: "Pale Yellow", color: "#FFFDE7", description: "Dyslexia / Irlen Syndrome — coloured paper alternative" },
  { id: "mint-green", name: "Mint Green", color: "#E8F5E9", description: "Visual Processing / Irlen Syndrome" },
  { id: "pale-blue", name: "Pale Blue", color: "#E3F2FD", description: "Irlen Syndrome / Scotopic Sensitivity" },
  { id: "lavender", name: "Lavender", color: "#F3E5F5", description: "Visual Stress / Migraine sensitivity" },
  { id: "peach", name: "Peach", color: "#FFF3E0", description: "General visual comfort" },
  { id: "pale-pink", name: "Pale Pink", color: "#FCE4EC", description: "Visual Processing Disorder" },
];

export interface SendNeed {
  id: string;
  name: string;
  category: string;
  description: string;
  strategies: string[];
  worksheetAdaptations: string[];
  // What specifically changes in the generated worksheet when this need is selected
  worksheetChanges?: {
    summary: string;           // One-sentence summary shown in dropdown
    changes: Array<{           // Specific changes with why
      what: string;            // What changes
      why: string;             // Why this helps
    }>;
  };
}

export const sendNeeds: SendNeed[] = [
  {
    id: "asc",
    name: "Autism Spectrum Condition (ASC)",
    category: "Communication & Interaction",
    description: "Affects social communication, social understanding, information processing, sensory processing. Four key areas: social communication, social understanding, information processing & interests, sensory processing (COBS Handbook).",
    strategies: [
      "Structured routine with clear visual schedules",
      "Literal and unambiguous instructions",
      "Sensory-friendly environment",
      "Pre-teach new topic vocabulary with visual clues",
      "Interest-based learning to increase engagement",
    ],
    worksheetAdaptations: [
      "Literal and unambiguous instructions",
      "Highly structured layout with consistent formatting",
      "Clear, numbered step-by-step instructions",
      "Visual supports alongside text",
      "Sans-serif font, uncluttered layout, generous spacing",
    ],
    worksheetChanges: {
      summary: "Every instruction is literal and unambiguous; sections have a 'What you need to do' box; questions mirror the worked example exactly.",
      changes: [
        { what: "'What you need to do' box added before every section", why: "ASC affects the ability to infer unstated expectations — explicit structure removes ambiguity and reduces anxiety" },
        { what: "Worked example immediately precedes Section A with identical structure", why: "Students with ASC process information more reliably when new tasks closely mirror a known model" },
        { what: "Consistent terminology throughout — one word per concept, no synonyms", why: "Switching between 'calculate', 'find', 'work out' can be interpreted as different tasks; consistency prevents confusion" },
        { what: "Neutral, factual contexts only — no social or emotional scenarios", why: "Social scenarios require theory of mind processing which is an area of difficulty in ASC; neutral contexts keep focus on the subject" },
        { what: "Completion checklist in reflection (tick boxes, not open writing)", why: "Open-ended reflection requires social-emotional inference; structured checklists are more accessible" },
      ],
    },
  },
  {
    id: "asperger",
    name: "Asperger Syndrome",
    category: "Communication & Interaction",
    description: "A form of autism characterised by difficulties with social interaction and non-verbal communication, alongside restricted interests and repetitive behaviours (COBS Handbook).",
    strategies: [
      "Structured environment with clear, predictable routines",
      "Clear, direct communication",
      "Visual supports: schedules, charts, social stories",
      "Sensory accommodations",
      "Positive reinforcement and interest-based learning",
    ],
    worksheetAdaptations: [
      "Clear, direct language with no ambiguity",
      "Structured, predictable layout",
      "Visual supports and diagrams",
      "Step-by-step instructions with numbered points",
      "Interest-based context where possible",
    ],
    worksheetChanges: {
      summary: "Direct, unambiguous language with a predictable layout; worked example mirrors Section A questions; step-by-step numbered instructions throughout.",
      changes: [
        { what: "All instructions are direct and literal — no figurative language", why: "Asperger Syndrome involves difficulty interpreting non-literal language; direct instructions prevent misunderstanding" },
        { what: "Identical layout structure across every section", why: "Predictable formatting reduces cognitive load and allows the student to focus on content rather than navigation" },
        { what: "Step-by-step numbered instructions for every task", why: "Sequential processing is often a strength; numbered steps leverage this while reducing working memory demands" },
        { what: "Visual diagrams and supports alongside text", why: "Visual processing is often stronger than verbal; diagrams provide an alternative access route to the content" },
      ],
    },
  },
  {
    id: "pda-odd",
    name: "PDA / ODD",
    category: "Communication & Interaction",
    description: "Pathological Demand Avoidance / Oppositional Defiant Disorder — anxiety-driven need to avoid demands and maintain control. PANDA approach (COBS Handbook).",
    strategies: [
      "Build trusting relationship through a key worker",
      "Provide choices to give sense of control",
      "Reduce demands to prevent anxiety escalation",
      "Collaborative communication",
      "PANDA approach: Pick battles, Anxiety management, Negotiation, Disguise demands, Adaptation",
    ],
    worksheetAdaptations: [
      "Offer choices within tasks",
      "Disguise demands as fun activities",
      "Use collaborative language",
      "Shorter tasks with natural stopping points",
      "Calm, uncluttered design",
    ],
    worksheetChanges: {
      summary: "Demands are reframed as choices and invitations; sections are renamed 'Explore', 'Investigate', 'Secret Mission'; collaborative 'we' language used throughout.",
      changes: [
        { what: "Section A renamed 'Explore — choose where to start'", why: "PDA is driven by anxiety around perceived demands; removing the sense of obligation reduces the anxiety trigger" },
        { what: "Challenge renamed 'Secret Mission — if you choose to accept it'", why: "Framing tasks as optional missions gives the student a sense of control, which is the core need in PDA" },
        { what: "'You must' replaced with 'You might like to...' throughout", why: "Demand language triggers avoidance in PDA; invitational language achieves the same goal without the anxiety response" },
        { what: "Natural break points built into every section", why: "Allowing the student to pause and re-engage reduces escalation when anxiety builds" },
        { what: "'Take a break here if you need to' prompt midway", why: "Explicit permission to pause is more effective than implicit expectation of sustained engagement" },
      ],
    },
  },
  {
    id: "slcn",
    name: "Speech, Language & Communication Needs (SLCN)",
    category: "Communication & Interaction",
    description: "Difficulties with speech production, language comprehension, or communication (COBS Handbook).",
    strategies: [
      "Pre-teaching vocabulary before lessons",
      "Visual supports and word walls",
      "Instructions broken into manageable chunks",
      "Multi-sensory approaches",
      "Talking buddies to encourage responses",
    ],
    worksheetAdaptations: [
      "Simplified vocabulary with key terms defined",
      "Sentence starters where appropriate",
      "Visual cues alongside text",
      "Short, clear sentences",
      "Word banks for key vocabulary",
    ],
    worksheetChanges: {
      summary: "Word Bank added to every section; sentence frames provided for all answers; short simple sentences; visual cues alongside all text questions.",
      changes: [
        { what: "Word Bank with plain-English definitions at the start of each section", why: "SLCN affects vocabulary retrieval and comprehension; a visible word bank reduces the cognitive load of recalling terms" },
        { what: "Sentence frames for every answer (e.g. 'The answer is ___ because ___')", why: "Expressive language difficulties mean students know the answer but cannot formulate the sentence; frames scaffold production" },
        { what: "Maximum sentence length of 12 words; subject-verb-object structure only", why: "Complex sentence structures are harder to decode for students with language processing difficulties" },
        { what: "Matching, labelling, and multiple-choice formats used in Section B", why: "These formats reduce language production demands while still assessing subject knowledge" },
        { what: "Visual cues (arrows, diagrams) alongside every text question", why: "Visual processing is often stronger than verbal in SLCN; images provide an alternative comprehension route" },
      ],
    },
  },
  {
    id: "dyslexia",
    name: "Dyslexia",
    category: "Cognition & Learning",
    description: "A specific learning difficulty affecting reading, writing, and spelling. Strengths include creativity, problem-solving, and verbal reasoning (COBS Handbook).",
    strategies: [
      "Dyslexia-friendly fonts (sans-serif, min 12pt)",
      "Cream/coloured paper backgrounds",
      "1.5 line spacing, left-justified text",
      "Multi-sensory teaching methods",
      "Bold for emphasis — avoid italics and underlining",
    ],
    worksheetAdaptations: [
      "Sans-serif font, minimum 12pt",
      "Cream or coloured background",
      "1.5 line spacing throughout",
      "Short sentences, bold key vocabulary",
      "Structured step-by-step modelling",
    ],
    worksheetChanges: {
      summary: "Questions are max 12 words each; every key term is bolded; sentence starters and answer frames in Section A; step-by-step method box before guided practice.",
      changes: [
        { what: "Every question limited to one sentence (max 12 words)", why: "Dyslexia affects decoding fluency; shorter sentences reduce the reading load so the student can focus on the subject content" },
        { what: "Bold on every key term at first use", why: "Visual emphasis helps students identify the most important words without re-reading, compensating for slower decoding speed" },
        { what: "Sentence starters and answer frames in Section A", why: "Dyslexia often affects written expression as well as reading; frames reduce the writing barrier so knowledge can be demonstrated" },
        { what: "Step-by-step method box immediately before Section A", why: "Working memory difficulties in dyslexia mean students benefit from a visible reference rather than relying on recall" },
        { what: "1.5 line spacing and generous white space throughout", why: "BDA guidelines show that increased spacing reduces visual crowding, which is a significant barrier for many dyslexic readers" },
      ],
    },
  },
  {
    id: "dyscalculia",
    name: "Dyscalculia",
    category: "Cognition & Learning",
    description: "A specific learning difficulty affecting understanding of numbers and mathematical concepts (COBS Handbook).",
    strategies: [
      "Visual aids: number lines, charts, graphs",
      "Concrete manipulatives before abstract concepts",
      "Real-world context for mathematical problems",
      "Step-by-step worked examples",
      "Extra time for processing",
    ],
    worksheetAdaptations: [
      "Visual aids alongside all calculations",
      "Number lines and reference charts included",
      "Step-by-step worked examples",
      "Gradual increase in difficulty",
      "Real-world context for problems",
    ],
    worksheetChanges: {
      summary: "Section A questions broken into numbered sub-steps with blanks; number line and key facts box included; every arithmetic step shown in worked example with 'why' annotation.",
      changes: [
        { what: "Every Section A question split into sub-steps: 'Step 1: ___ Step 2: ___ Step 3: ___'", why: "Dyscalculia affects number sense and the ability to hold multiple steps in working memory; sub-steps externalise the process" },
        { what: "Number line or place value chart reference included", why: "Dyscalculia involves difficulty with the mental number line; a visible reference compensates for this specific deficit" },
        { what: "Every arithmetic step shown in worked example with 'why' annotation", why: "Students with dyscalculia often understand the procedure but lose the meaning; annotating why each step is done builds conceptual understanding" },
        { what: "Key Facts box at top of Section B (multiplication facts, formulas)", why: "Retrieval of number facts is impaired in dyscalculia; a reference box removes this barrier so the student can demonstrate reasoning" },
        { what: "Real-world contexts for all word problems", why: "Concrete contexts make abstract numbers meaningful, which is a core principle of dyscalculia intervention (concrete-pictorial-abstract approach)" },
      ],
    },
  },
  {
    id: "dyspraxia",
    name: "Dyspraxia (DCD)",
    category: "Cognition & Learning",
    description: "Developmental Coordination Disorder affecting motor skills, coordination, and planning of movements (COBS Handbook).",
    strategies: [
      "Occupational therapy support",
      "Regular physical breaks",
      "Assistive technology for writing",
      "Clear workspace organisation",
      "Extra time for written tasks",
    ],
    worksheetAdaptations: [
      "Larger writing spaces",
      "Reduced amount of handwriting required",
      "Multiple choice or matching options",
      "Clear, uncluttered layout",
      "Digital alternatives where possible",
    ],
    worksheetChanges: {
      summary: "Writing demands minimised — tick boxes, circle-the-answer, and matching formats used; large answer spaces; Section A uses multiple-choice or matching for at least 3 questions.",
      changes: [
        { what: "Multiple-choice, matching, and circle-the-answer formats in Section A", why: "Dyspraxia (DCD) affects fine motor control; reducing handwriting demands allows the student to demonstrate knowledge without the physical barrier" },
        { what: "Large answer boxes and generous line spacing throughout", why: "Students with DCD need more space to write legibly; cramped answer lines cause additional frustration and fatigue" },
        { what: "Structured answer frames (tables, fill-in-the-blank) rather than open writing", why: "Organising written responses on a blank page is cognitively demanding for DCD; structured formats remove the planning burden" },
        { what: "Challenge question uses diagram, circle, or tick format — no extended writing", why: "Sustained writing is tiring for students with DCD; alternative formats allow access to higher-order thinking without the motor barrier" },
      ],
    },
  },
  {
    id: "mld",
    name: "Moderate Learning Difficulties (MLD)",
    category: "Cognition & Learning",
    description: "Learning difficulties requiring additional support. Children may struggle with basic literacy and numeracy (COBS Handbook).",
    strategies: [
      "Scaffolded learning with gradual release",
      "Concrete-pictorial-abstract approach",
      "Repetition and overlearning",
      "Reduced cognitive load",
      "Visual supports and graphic organisers",
    ],
    worksheetAdaptations: [
      "Scaffolded examples before independent tasks",
      "Reduced cognitive load",
      "Guided questions before independent practice",
      "Gradual increase in difficulty",
      "Visual supports throughout",
    ],
    worksheetChanges: {
      summary: "Concrete-pictorial-abstract approach; model answer for Q1; 'Help Box' with key facts; every Section A question has a hint, sentence starter, or partially completed answer.",
      changes: [
        { what: "Question 1 in Section A has a fully completed model answer", why: "MLD affects the ability to generalise from instruction to independent application; a worked model provides a direct template" },
        { what: "Every Section A question has a hint, sentence starter, or partial answer", why: "Scaffolded release of responsibility (I do, we do, you do) is the evidence-based approach for MLD — full independence comes after guided practice" },
        { what: "'Help Box' at top of Section B with key facts and vocabulary", why: "Students with MLD have difficulty retaining information from earlier in the lesson; a visible reference reduces the memory burden" },
        { what: "KS2 reading level language throughout", why: "MLD often co-occurs with literacy difficulties; accessible language ensures the barrier is the subject content, not the reading" },
        { what: "Concrete-pictorial-abstract progression in Section A", why: "Research (Bruner, 1966; EEF guidance) consistently shows CPA is the most effective approach for students with learning difficulties" },
      ],
    },
  },
  {
    id: "adhd",
    name: "ADHD",
    category: "Social, Emotional & Mental Health",
    description: "Attention Deficit Hyperactivity Disorder affecting concentration, impulsivity, and activity levels. Strengths include creativity and hyper-focus (COBS Handbook).",
    strategies: [
      "Structured routine with clear expectations",
      "Break tasks into small, manageable chunks",
      "Movement breaks and fidget tools",
      "Positive reinforcement",
      "Seating position to minimise distractions",
    ],
    worksheetAdaptations: [
      "Break work into small tasks",
      "Numbered steps and checklist prompts",
      "Short questions with visible progress markers",
      "Clear start and end points",
      "Engaging, varied question types",
    ],
    worksheetChanges: {
      summary: "Checkboxes next to every question; max 3 questions in Section A; varied question types (calculation, fill-in, true/false); 'BRAIN BREAK' prompt midway; challenge is clearly optional.",
      changes: [
        { what: "Tick checkbox next to every question for visible progress tracking", why: "ADHD impairs working memory and time perception; visible progress markers provide the dopamine feedback that sustains motivation" },
        { what: "Maximum 3 questions in Section A, 5 in Section B", why: "ADHD attention span is shorter and more variable; smaller chunks allow the student to complete a section before focus lapses" },
        { what: "'BRAIN BREAK — stand up and stretch!' prompt midway through Section B", why: "Movement breaks are evidence-based for ADHD — brief physical activity restores attention capacity (Pontifex et al., 2013)" },
        { what: "Varied question types: calculation, fill-in, matching, true/false", why: "Novelty sustains attention in ADHD; varying the format prevents the habituation that causes disengagement" },
        { what: "Action word bolded in every instruction (e.g. 'Calculate the area')", why: "ADHD affects selective attention; bolding the key instruction word helps the student identify what to do without reading every word" },
      ],
    },
  },
  {
    id: "anxiety",
    name: "Anxiety / Mental Health",
    category: "Social, Emotional & Mental Health",
    description: "Anxiety and mental health difficulties affecting engagement, concentration, and emotional regulation.",
    strategies: [
      "Safe space and calm-down strategies",
      "Predictable routines",
      "Zones of Regulation framework",
      "Gradual exposure to challenging situations",
      "Positive self-talk strategies",
    ],
    worksheetAdaptations: [
      "Calm, reassuring tone throughout",
      "Clear expectations and success criteria",
      "Optional challenge questions (not mandatory)",
      "Gentle colour palette",
      "Positive encouragement built in",
    ],
    worksheetChanges: {
      summary: "Section A renamed 'Warm-Up — no pressure!'; challenge is 'OPTIONAL BONUS'; warm encouraging tone throughout; emoji check-in at start and end; no threatening language.",
      changes: [
        { what: "Section A renamed 'Warm-Up — no pressure!'", why: "Anxiety activates the threat response which shuts down the prefrontal cortex needed for learning; reducing perceived threat is the first priority" },
        { what: "Challenge clearly labelled 'OPTIONAL BONUS — only if you want to!'", why: "Mandatory challenge questions create performance anxiety; making them optional removes the fear of failure" },
        { what: "Positive statement at the start of each section ('You already know this — let's practise!')", why: "Positive priming reduces anticipatory anxiety and activates approach motivation rather than avoidance motivation" },
        { what: "'How are you feeling?' emoji check-in at start and end", why: "Emotional regulation check-ins are a core component of the Zones of Regulation framework recommended for anxiety in the SEND Code of Practice" },
        { what: "'Must', 'should', 'need to' replaced with 'try to', 'have a go at'", why: "Obligation language triggers anxiety responses; invitational language achieves the same goal without the threat" },
      ],
    },
  },
  {
    id: "vi",
    name: "Visual Impairment",
    category: "Sensory & Physical",
    description: "A condition affecting a person's ability to see, requiring adaptations to visual materials (COBS Handbook).",
    strategies: [
      "Large print materials (min 18pt)",
      "High contrast formatting",
      "Audio descriptions and text-to-speech",
      "Tactile resources",
      "Preferential seating",
    ],
    worksheetAdaptations: [
      "Large font (minimum 18pt)",
      "High contrast formatting",
      "Clear spacing, no cluttered layouts",
      "Bold headings and clear structure",
      "Audio alternative where possible",
    ],
    worksheetChanges: {
      summary: "Large print formatting; high-contrast layout; no diagram-only questions; all visual content described in text; generous spacing between all elements.",
      changes: [
        { what: "Minimum 18pt equivalent font size throughout", why: "Visual impairment reduces acuity; larger text ensures the student can read the content without additional strain or assistive technology" },
        { what: "High-contrast formatting — dark text on light background, bold headings", why: "Low contrast is the most common accessibility barrier for VI students; high contrast is the primary RNIB recommendation" },
        { what: "All diagram content described in text as well", why: "Students with VI may not be able to interpret diagrams; text descriptions ensure no information is inaccessible" },
        { what: "No questions that rely solely on visual interpretation", why: "Diagram-only questions create an insurmountable barrier; all assessment must be accessible through text" },
        { what: "Generous spacing between questions and sections", why: "Visual crowding is a significant barrier for VI; white space helps the student locate and navigate the worksheet independently" },
      ],
    },
  },
  {
    id: "hi",
    name: "Hearing Impairment",
    category: "Sensory & Physical",
    description: "A condition affecting a person's ability to hear, requiring visual and written support.",
    strategies: [
      "Visual instructions and demonstrations",
      "Written instructions alongside verbal",
      "Preferential seating facing the teacher",
      "Use of visual aids and gestures",
      "Checking understanding regularly",
    ],
    worksheetAdaptations: [
      "Clear written instructions",
      "Visual diagrams and supports",
      "Key vocabulary clearly defined",
      "Structured layout with clear sections",
      "No reliance on audio content",
    ],
    worksheetChanges: {
      summary: "All instructions fully written (no verbal reliance); Word Bank included; every question fully self-contained; visual diagrams alongside text; no audio-dependent content.",
      changes: [
        { what: "All instructions written in full — no reliance on verbal explanation", why: "Students with hearing impairment may miss verbal instructions entirely; the worksheet must be fully self-contained" },
        { what: "Word Bank with definitions for all key terms", why: "Students with HI may have gaps in incidental vocabulary learning (which typically happens through listening); explicit definitions compensate for this" },
        { what: "Every question contains all necessary information within itself", why: "Students cannot ask for clarification as easily; self-contained questions prevent frustration from missing context" },
        { what: "Visual diagrams and supports alongside every text question", why: "Visual processing is often the primary learning channel for students with HI; visual supports enhance comprehension" },
        { what: "No audio-dependent content or references to listening tasks", why: "Any content requiring hearing creates an insurmountable barrier; all assessment must be accessible through text and visuals" },
      ],
    },
  },
  {
    id: "tourettes",
    name: "Tourette's Syndrome",
    category: "Sensory & Physical",
    description: "A neurological condition causing involuntary movements and sounds (tics). Commonly co-occurs with ADHD. Strengths include creativity, hyper-focus, empathy (COBS Handbook).",
    strategies: [
      "Understanding and acceptance from school community",
      "Relaxation techniques",
      "Supportive, non-judgmental environment",
      "Flexible seating and movement breaks",
      "Focus on strengths",
    ],
    worksheetAdaptations: [
      "Flexible completion expectations",
      "Calm, supportive tone",
      "Clear structure with natural break points",
      "Reduced writing demands where appropriate",
      "Multiple response formats",
    ],
    worksheetChanges: {
      summary: "Flexible completion format; reduced writing demands; natural break points; multiple response formats (tick, circle, fill-in); calm supportive tone; no timed pressure language.",
      changes: [
        { what: "Multiple response formats: tick, circle, fill-in, short answer", why: "Tourette's involves involuntary tics that can disrupt sustained writing; varied formats reduce the impact of tics on task completion" },
        { what: "Natural break points built into every section", why: "Tic suppression requires cognitive effort; natural pauses allow the student to release suppressed tics without disrupting the task" },
        { what: "Reduced writing demands — avoid long written responses", why: "Extended writing is particularly affected by motor tics; shorter responses reduce the window for tic interference" },
        { what: "Calm, supportive, non-judgmental tone throughout", why: "Stress and anxiety worsen tic frequency; a calm, pressure-free tone helps regulate the student's anxiety level" },
        { what: "No timed pressure language ('quickly', 'in 5 minutes')", why: "Time pressure increases anxiety which directly increases tic frequency; removing urgency language reduces the tic trigger" },
      ],
    },
  },
  {
    id: "older-learners",
    name: "Older Learners (KS3/KS4/KS5)",
    category: "Cognition & Learning",
    description: "Older pupils with SEND who struggle with lecture-based presentations, note-taking, concentration over longer lessons, and organising material (COBS Handbook).",
    strategies: [
      "Structured note-taking frameworks",
      "Chunked lessons with varied activities",
      "Graphic organisers for complex topics",
      "Study skills support",
      "Age-appropriate resources",
    ],
    worksheetAdaptations: [
      "Age-appropriate content and context",
      "Structured frameworks for extended responses",
      "Graphic organisers included",
      "Clear section breaks",
      "Study tips integrated",
    ],
    worksheetChanges: {
      summary: "Age-appropriate academic language; graphic organiser for extended responses; Cornell-style note section; clear section breaks with study tips integrated.",
      changes: [
        { what: "Graphic organiser or table provided for extended responses", why: "Older learners with SEND often struggle to organise complex information; a visual framework reduces the cognitive planning burden" },
        { what: "Cornell-style note section at the end of each section", why: "Structured note-taking frameworks improve retention and revision — particularly beneficial for students who struggle with lecture-based learning" },
        { what: "Age-appropriate academic language and contexts throughout", why: "SEND resources are often pitched at younger ages; age-appropriate content maintains dignity and engagement for KS3–KS5 students" },
        { what: "Study tip box at the start of each section", why: "Older learners benefit from explicit metacognitive strategies; brief study tips build independent learning skills" },
        { what: "Clear section breaks with estimated time for each section", why: "Time management is a common difficulty for older learners with SEND; visible time guides help with self-regulation and pacing" },
      ],
    },
  },
  {
    id: "eal",
    name: "English as an Additional Language (EAL)",
    category: "Communication & Interaction",
    description: "Students whose first language is not English. May have strong subject knowledge but need language support to access written tasks. NALDIC guidelines emphasise visual supports, simplified language, and culturally inclusive contexts.",
    strategies: [
      "Pre-teach key vocabulary with visual supports before the lesson",
      "Use bilingual glossaries and word banks where appropriate",
      "Culturally neutral and inclusive contexts — avoid UK-specific idioms",
      "Visual aids alongside all text-based instructions",
      "Sentence frames and writing scaffolds for all written responses",
    ],
    worksheetAdaptations: [
      "Key vocabulary with plain-English definitions at the start of each section",
      "Culturally neutral contexts — no UK-specific idioms or unfamiliar cultural references",
      "Sentence frames for all written responses",
      "Short, clear sentences with simple grammatical structures",
      "Visual supports (diagrams, arrows) alongside all text questions",
    ],
    worksheetChanges: {
      summary: "Key Vocabulary box with plain-English definitions; sentence frames for all answers; culturally neutral contexts; short simple sentences; visual supports alongside all text.",
      changes: [
        { what: "Key Vocabulary box at the start of every section with plain-English definitions", why: "EAL students may lack the academic vocabulary needed to access tasks; visible definitions remove this barrier without requiring teacher intervention" },
        { what: "Sentence frames for all written responses (e.g. 'The answer is ___ because ___')", why: "EAL students often know the subject content but struggle to produce written English independently; frames scaffold language production" },
        { what: "Culturally neutral contexts — no UK-specific idioms, colloquialisms, or cultural references", why: "Questions rooted in unfamiliar cultural contexts disadvantage EAL students; neutral contexts ensure assessment measures subject knowledge, not cultural familiarity" },
        { what: "Maximum 15 words per instruction; subject-verb-object sentence structure only", why: "Complex sentence structures are harder to decode for EAL students; simpler syntax ensures instructions are fully accessible at all English proficiency levels" },
        { what: "Visual supports (diagrams, arrows, icons) alongside all text questions", why: "Visual information is often more accessible than text for EAL students; images provide an alternative comprehension route independent of English proficiency" },
      ],
    },
  },
];

// ─── SEND-specific formatting specs ─────────────────────────────────────────
// Based on COBS Handbook, BDA guidelines, RNIB, NDCS, and UK SEND Code of Practice.
// Typography references: BDA Style Guide 2023, RNIB Clear Print Guidelines, NICE NG41

export interface SendFormatting {
  fontFamily: string;
  fontSize: number;        // minimum px (overrides user textSize if larger)
  lineHeight: number;      // CSS line-height multiplier
  letterSpacing: string;   // CSS letter-spacing
  wordSpacing: string;     // CSS word-spacing
  fontWeight: number;      // base font weight
  textAlign: "left" | "justify";
  paragraphSpacing: string;
  // Visual theme fields — used by WorksheetRenderer for section card styling
  theme: "standard" | "dyslexia" | "high-contrast" | "calm" | "minimal" | "chunked" | "adult";
  sectionBgColor: string;       // tinted section background
  accentColor: string;          // primary accent (gradients, borders)
  headerStyle: "gradient" | "solid" | "stripe" | "minimal";
  answerLineHeight: number;     // px height of each answer line
  showCheckboxes: boolean;      // render [ ] as visual checkboxes (ADHD)
  borderRadius: number;         // section card border radius in px
  sectionPadding: string;       // section content padding
  headerTextSize: number;       // section header font size modifier (+n)
  showSectionNumbers: boolean;  // show step numbers (ASC/MLD)
}

const DEFAULT_FORMATTING: SendFormatting = {
  fontFamily: "'Segoe UI', Arial, sans-serif",
  fontSize: 14,
  lineHeight: 1.7,
  letterSpacing: "normal",
  wordSpacing: "normal",
  fontWeight: 400,
  textAlign: "left",
  paragraphSpacing: "6px",
  theme: "standard",
  sectionBgColor: "#ffffff",
  accentColor: "#1B2A4A",
  headerStyle: "flat",
  answerLineHeight: 26,
  showCheckboxes: false,
  borderRadius: 8,
  sectionPadding: "10px 13px",
  headerTextSize: 1,
  showSectionNumbers: false,
};

// Map from SEND need ID → formatting overrides
// Sources: BDA Style Guide 2023, RNIB Clear Print, NDCS, NICE NG41, COBS Handbook,
// Patoss Dyslexia Style Guide, NAS (National Autistic Society) design guidance
const SEND_FORMATTING_MAP: Record<string, Partial<SendFormatting>> = {

  // ── DYSLEXIA ─────────────────────────────────────────────────────────────────
  // BDA: sans-serif ≥12pt, 1.5+ line spacing, 35% increased letter spacing,
  // left-aligned only, cream/pastel background reduces visual stress,
  // word spacing 3.5pt minimum, avoid narrow columns
  dyslexia: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.9,          // BDA minimum 1.5, ideally 2.0
    letterSpacing: "0.06em",  // BDA: wider than normal
    wordSpacing: "0.12em",    // BDA: increased word spacing
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "12px",
    theme: "dyslexia",
    sectionBgColor: "#fefce8",  // warm cream — reduces visual stress (Irlen)
    accentColor: "#b45309",     // amber — warm, readable, not harsh
    headerStyle: "solid",
    answerLineHeight: 30,
    showCheckboxes: false,
    borderRadius: 6,
    sectionPadding: "12px 14px",
    headerTextSize: 1,
    showSectionNumbers: false,
  },

  // ── VISUAL IMPAIRMENT ─────────────────────────────────────────────────────────
  // RNIB Clear Print: minimum 18pt (24px), Arial/Helvetica, bold headers,
  // high contrast (minimum 7:1 ratio), no colour-only information,
  // generous margins, 1.5x line spacing minimum, no reversed text
  vi: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 20,             // RNIB: 18pt minimum = 24px, we use 20 as base (user can increase)
    lineHeight: 2.0,          // RNIB: 1.5 minimum
    letterSpacing: "0.03em",
    wordSpacing: "0.08em",
    fontWeight: 500,          // RNIB: medium-bold weight improves readability
    textAlign: "left",
    paragraphSpacing: "16px",
    theme: "high-contrast",
    sectionBgColor: "#ffffff",
    accentColor: "#111827",   // near-black — maximum contrast
    headerStyle: "solid",     // no gradients — solid block colour
    answerLineHeight: 36,     // larger writing space
    showCheckboxes: false,
    borderRadius: 4,          // minimal border radius — less visual noise
    sectionPadding: "14px 16px",
    headerTextSize: 2,
    showSectionNumbers: true,
  },

  // ── AUTISM SPECTRUM CONDITION ─────────────────────────────────────────────────
  // NAS: consistent layout, no visual clutter, unambiguous instructions,
  // muted colours (no harsh saturation), predictable structure, clear chunking
  asc: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.02em",
    wordSpacing: "normal",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "minimal",
    sectionBgColor: "#f8fafc",  // very light cool grey — neutral, non-stimulating
    accentColor: "#2563eb",     // clear, consistent blue
    headerStyle: "solid",
    answerLineHeight: 26,
    showCheckboxes: false,
    borderRadius: 4,            // minimal radius — predictable geometry
    sectionPadding: "10px 12px",
    headerTextSize: 1,
    showSectionNumbers: true,   // numbered steps — helps predictability
  },

  asperger: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.02em",
    wordSpacing: "normal",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "minimal",
    sectionBgColor: "#f8fafc",
    accentColor: "#2563eb",
    headerStyle: "solid",
    answerLineHeight: 26,
    showCheckboxes: false,
    borderRadius: 4,
    sectionPadding: "10px 12px",
    headerTextSize: 1,
    showSectionNumbers: true,
  },

  // ── ADHD ───────────────────────────────────────────────────────────────────────
  // CHADD/ADHD Foundation: chunked content, visible progress, variety,
  // checkbox affordances, clear section breaks, movement prompts
  adhd: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.8,
    letterSpacing: "0.01em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "chunked",
    sectionBgColor: "#ffffff",
    accentColor: "#7c3aed",     // vivid purple — engaging, motivating
    headerStyle: "gradient",
    answerLineHeight: 28,
    showCheckboxes: true,       // KEY: render [ ] as actual checkboxes
    borderRadius: 10,
    sectionPadding: "12px 14px",
    headerTextSize: 1,
    showSectionNumbers: false,
  },

  // ── SPEECH, LANGUAGE & COMMUNICATION NEEDS ───────────────────────────────────
  // RCSLT: clear visual hierarchy, word banks, sentence frames, short sentences,
  // visual supports alongside all text
  slcn: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.02em",
    wordSpacing: "0.06em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "standard",
    sectionBgColor: "#f0f9ff",  // very light blue — visual clarity
    accentColor: "#0284c7",     // sky blue — clear and unambiguous
    headerStyle: "gradient",
    answerLineHeight: 28,
    showCheckboxes: false,
    borderRadius: 8,
    sectionPadding: "10px 13px",
    headerTextSize: 1,
    showSectionNumbers: false,
  },

  // ── ANXIETY / SEMH ───────────────────────────────────────────────────────────
  // Anna Freud Centre: gentle, no red/harsh colours, soft rounded edges,
  // positive framing, no timed language, calm aesthetics
  anxiety: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.01em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "calm",
    sectionBgColor: "#fdf4ff",  // softest lavender — calming, non-threatening
    accentColor: "#9333ea",     // gentle purple — used across all anxiety research
    headerStyle: "gradient",
    answerLineHeight: 28,
    showCheckboxes: false,
    borderRadius: 14,           // very rounded — soft, welcoming
    sectionPadding: "12px 14px",
    headerTextSize: 1,
    showSectionNumbers: false,
  },

  // ── EAL ─────────────────────────────────────────────────────────────────────
  // NALDIC: visual supports, bilingual-friendly, culturally neutral contexts
  eal: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.02em",
    wordSpacing: "0.06em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "standard",
    sectionBgColor: "#f0fdf4",  // very light green — fresh, international feel
    accentColor: "#16a34a",
    headerStyle: "gradient",
    answerLineHeight: 26,
    showCheckboxes: false,
    borderRadius: 8,
    sectionPadding: "10px 13px",
    headerTextSize: 1,
    showSectionNumbers: false,
  },

  // ── DYSPRAXIA / DCD ─────────────────────────────────────────────────────────
  // DCD Ireland / Dyspraxia Foundation: minimise handwriting, large clear spaces,
  // tick/circle formats, structured tables, no fine motor demands
  dyspraxia: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.9,
    letterSpacing: "0.02em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "12px",
    theme: "standard",
    sectionBgColor: "#fff7ed",  // warm peach — energising, friendly
    accentColor: "#ea580c",
    headerStyle: "gradient",
    answerLineHeight: 34,       // extra tall lines — less precise motor needed
    showCheckboxes: true,       // tick-box formats reduce handwriting
    borderRadius: 8,
    sectionPadding: "12px 14px",
    headerTextSize: 1,
    showSectionNumbers: false,
  },

  // ── MODERATE LEARNING DIFFICULTIES ──────────────────────────────────────────
  // AQA Unit Award: simplified language, concrete examples, visual hierarchy,
  // slightly larger font, clear numbered structure
  mld: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 16,             // slightly larger than standard
    lineHeight: 2.0,
    letterSpacing: "0.02em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "12px",
    theme: "standard",
    sectionBgColor: "#f0fdf4",  // light green — encouraging, natural
    accentColor: "#15803d",
    headerStyle: "gradient",
    answerLineHeight: 32,
    showCheckboxes: false,
    borderRadius: 8,
    sectionPadding: "12px 14px",
    headerTextSize: 1,
    showSectionNumbers: true,
  },

  // ── PDA / ODD ────────────────────────────────────────────────────────────────
  // PANDA network: choice-based, no demands, invitational language, calm palette
  "pda-odd": {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.01em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "calm",
    sectionBgColor: "#fdf4ff",
    accentColor: "#9333ea",
    headerStyle: "gradient",
    answerLineHeight: 28,
    showCheckboxes: false,
    borderRadius: 14,
    sectionPadding: "12px 14px",
    headerTextSize: 1,
    showSectionNumbers: false,
  },

  // ── DYSCALCULIA ─────────────────────────────────────────────────────────────
  // BDA Dyscalculia Network: number lines, structured sub-steps, visual grouping
  dyscalculia: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.02em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "chunked",
    sectionBgColor: "#fffbeb",  // warm cream-yellow — distinct from plain white
    accentColor: "#d97706",
    headerStyle: "gradient",
    answerLineHeight: 32,
    showCheckboxes: false,
    borderRadius: 8,
    sectionPadding: "12px 14px",
    headerTextSize: 1,
    showSectionNumbers: true,
  },

  // ── HEARING IMPAIRMENT ───────────────────────────────────────────────────────
  // NDCS: all visual, no audio references, strong visual hierarchy, BSL-friendly
  hi: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.02em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "standard",
    sectionBgColor: "#f0f9ff",
    accentColor: "#0369a1",
    headerStyle: "gradient",
    answerLineHeight: 28,
    showCheckboxes: false,
    borderRadius: 8,
    sectionPadding: "10px 13px",
    headerTextSize: 1,
    showSectionNumbers: true,
  },

  // ── TOURETTE'S SYNDROME ─────────────────────────────────────────────────────
  // Tourettes Action: calm, uncluttered, minimal sensory triggers,
  // no flashing or high-contrast clashing colours, patient tone
  tourettes: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.01em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "calm",
    sectionBgColor: "#f8fafc",    // neutral cool grey — no sensory stimulation
    accentColor: "#475569",       // muted slate — calm, not attention-grabbing
    headerStyle: "solid",         // no loud gradients
    answerLineHeight: 28,
    showCheckboxes: false,
    borderRadius: 8,
    sectionPadding: "10px 13px",
    headerTextSize: 1,
    showSectionNumbers: false,
  },

  // ── OLDER LEARNERS ──────────────────────────────────────────────────────────
  // Adult literacy standards (Entry Level 3 – Level 2): professional register,
  // adult-appropriate topics, no childish visuals, Times New Roman or Calibri-like
  "older-learners": {
    fontFamily: "'Segoe UI', 'Calibri', Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.75,
    letterSpacing: "0.01em",
    wordSpacing: "0.03em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "8px",
    theme: "adult",
    sectionBgColor: "#f8fafc",
    accentColor: "#1e40af",       // deep professional blue
    headerStyle: "solid",
    answerLineHeight: 28,
    showCheckboxes: false,
    borderRadius: 6,
    sectionPadding: "10px 13px",
    headerTextSize: 0,
    showSectionNumbers: false,
  },
};

// Map from display name → ID for cases where metadata stores the name instead of the ID
// (e.g. AI returns "Dyslexia" rather than "dyslexia")
const SEND_NAME_TO_ID: Record<string, string> = {
  "autism spectrum condition (asc)": "asc",
  "autism spectrum condition": "asc",
  "asc": "asc",
  "asperger syndrome": "asperger",
  "asperger's syndrome": "asperger",
  "asperger": "asperger",
  "pda / odd": "pda-odd",
  "pda/odd": "pda-odd",
  "pda-odd": "pda-odd",
  "pda": "pda-odd",
  "speech, language & communication needs (slcn)": "slcn",
  "speech, language and communication needs": "slcn",
  "slcn": "slcn",
  "dyslexia": "dyslexia",
  "dyscalculia": "dyscalculia",
  "dyspraxia (dcd)": "dyspraxia",
  "dyspraxia": "dyspraxia",
  "dcd": "dyspraxia",
  "moderate learning difficulties (mld)": "mld",
  "moderate learning difficulties": "mld",
  "mld": "mld",
  "adhd": "adhd",
  "attention deficit hyperactivity disorder": "adhd",
  "anxiety / mental health": "anxiety",
  "anxiety/mental health": "anxiety",
  "anxiety": "anxiety",
  "mental health": "anxiety",
  "visual impairment": "vi",
  "vi": "vi",
  "hearing impairment": "hi",
  "hi": "hi",
  "tourette's syndrome": "tourettes",
  "tourettes syndrome": "tourettes",
  "tourettes": "tourettes",
  "older learners (ks3/ks4/ks5)": "older-learners",
  "older learners": "older-learners",
  "older-learners": "older-learners",
  "english as an additional language (eal)": "eal",
  "english as an additional language": "eal",
  "eal": "eal",
};

/**
 * Returns the SEND-specific formatting for a given SEND need ID or display name.
 * Falls back to default formatting if no specific overrides are defined.
 * The userTextSize is respected unless the SEND need requires a larger minimum.
 */
export function getSendFormatting(sendNeedId: string | undefined, userTextSize: number = 14): SendFormatting {
  if (!sendNeedId) return { ...DEFAULT_FORMATTING, fontSize: Math.max(userTextSize, DEFAULT_FORMATTING.fontSize) };
  // Normalise: try the raw value first, then lowercase lookup via name-to-ID map
  const normalised = sendNeedId.toLowerCase().trim();
  const resolvedId = SEND_FORMATTING_MAP[sendNeedId]
    ? sendNeedId
    : SEND_FORMATTING_MAP[normalised]
      ? normalised
      : SEND_NAME_TO_ID[normalised] || sendNeedId;
  const overrides = SEND_FORMATTING_MAP[resolvedId] || {};
  const base: SendFormatting = { ...DEFAULT_FORMATTING, ...overrides };
  // Enforce minimum font size: use whichever is larger — user's choice or SEND minimum
  base.fontSize = Math.max(userTextSize, base.fontSize);
  return base;
}

export const cobsTips = [
  "The Zones of Regulation framework helps pupils identify their emotional state using four colour-coded zones: Blue (low energy), Green (calm), Yellow (heightened), Red (extreme).",
  "COBS uses a graduated approach: Quality First Teaching → Targeted Interventions → Specialist Support → EHCP Assessment.",
  "The PANDA approach for PDA: Pick battles, Anxiety management, Negotiation & collaboration, Disguise & manage demands, Adaptation.",
  "Dyslexia-friendly formatting: sans-serif font, min 12pt, 1.5 line spacing, left-justified, bold for emphasis, cream/coloured backgrounds.",
  "The four broad areas of SEND need: Communication & Interaction, Cognition & Learning, Social Emotional & Mental Health, Sensory & Physical.",
  "Trauma-informed practice recognises that many behaviours are responses to adverse experiences and focuses on safety, trust, and empowerment.",
  "External agencies supporting SEND include: EPS (Educational Psychology), PSS (Pupil & School Support), OT (Occupational Therapy), CAT (Communication & Autism Team).",
  "SEND Support (K) students need targeted intervention to narrow the gap within approximately six academic terms.",
  "Students with EHCP (E) have statutory action outlined that must be implemented by the school and external agencies.",
  "Multi-sensory teaching engages visual, auditory, and kinesthetic learning styles — essential for dyslexia and SLCN support.",
  "For ADHD students: break tasks into small chunks, use numbered steps, provide visible progress markers, and allow movement breaks.",
  "Autism-friendly worksheets should use literal language, consistent formatting, numbered instructions, and avoid idioms or metaphors.",
  "The SENCO team works closely with Educational Psychologists for strategic and caseload work including psychological assessments.",
  "Occupational Therapists support with sensory diets, handwriting, life skills, and Zones of Regulation training.",
  "For visual impairment: use minimum 18pt font, high contrast, clear spacing, and avoid cluttered layouts.",
  "EAL (English as an Additional Language) pupils benefit from pre-taught vocabulary, sentence frames, bilingual glossaries, and culturally neutral contexts in all resources (NALDIC guidance).",
];
