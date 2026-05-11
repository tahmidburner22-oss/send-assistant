// Adaptly — Core Data (Based on COBS Handbook & UK SEND Code of Practice)

export const subjects = [
  { id: "english", name: "English", icon: "BookOpen", color: "#7C3AED" },
  { id: "mathematics", name: "Mathematics", icon: "Calculator", color: "#10B981" },
  { id: "science", name: "Science", icon: "Flask", color: "#3B82F6" },
  { id: "biology", name: "Biology", icon: "Flask", color: "#22C55E" },
  { id: "chemistry", name: "Chemistry", icon: "Flask", color: "#F59E0B" },
  { id: "physics", name: "Physics", icon: "Flask", color: "#6366F1" },
  { id: "history", name: "History", icon: "Landmark", color: "#F59E0B" },
  { id: "geography", name: "Geography", icon: "Globe", color: "#06B6D4" },
  { id: "art", name: "Art & Design", icon: "Palette", color: "#EC4899" },
  { id: "music", name: "Music", icon: "Music", color: "#8B5CF6" },
  { id: "pe", name: "Physical Education", icon: "Dumbbell", color: "#EF4444" },
  { id: "computing", name: "Computing", icon: "Monitor", color: "#6366F1" },
  { id: "computer-science", name: "Computer Science", icon: "Monitor", color: "#6366F1" },
  { id: "dt", name: "Design & Technology", icon: "Wrench", color: "#F97316" },
  { id: "re", name: "Religious Education", icon: "Heart", color: "#14B8A6" },
  { id: "mfl", name: "Modern Foreign Languages", icon: "Languages", color: "#A855F7" },
  { id: "pshe", name: "PSHE", icon: "Users", color: "#22C55E" },
  { id: "business", name: "Business Studies", icon: "Briefcase", color: "#64748B" },
  { id: "drama", name: "Drama", icon: "Theater", color: "#E11D48" },
];

const PRIMARY_SUBJECT_IDS = new Set([
  "english",
  "mathematics",
  "science",
  "history",
  "geography",
  "art",
  "music",
  "pe",
  "computing",
  "dt",
  "re",
  "mfl",
  "pshe",
  "drama",
]);

const SECONDARY_SUBJECT_IDS = new Set([
  "english",
  "mathematics",
  "science",
  "biology",
  "chemistry",
  "physics",
  "history",
  "geography",
  "art",
  "music",
  "pe",
  "computer-science",
  "dt",
  "re",
  "mfl",
  "pshe",
  "business",
  "drama",
]);

export function getSubjectsForYearGroup(yearGroup?: string) {
  const year = Number.parseInt(String(yearGroup || "").replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(year)) return subjects;
  if (year >= 1 && year <= 6) return subjects.filter(subject => PRIMARY_SUBJECT_IDS.has(subject.id));
  if (year >= 7 && year <= 11) return subjects.filter(subject => SECONDARY_SUBJECT_IDS.has(subject.id));
  return subjects;
}

export const yearGroups = [
  "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
  "Year 7", "Year 8", "Year 9", "Year 10", "Year 11",
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
  maths: "tiered",
  science: "tiered",
  biology: "tiered",
  chemistry: "tiered",
  physics: "tiered",
  mfl: "tiered",
  english: "single",
  history: "levelled",
  geography: "levelled",
  art: "levelled",
  music: "levelled",
  pe: "levelled",
  computing: "levelled",
  "computer-science": "levelled",
  dt: "levelled",
  re: "levelled",
  pshe: "levelled",
  business: "levelled",
  drama: "levelled",
  "eleven-plus": "eleven-plus",
};

/**
 * Maps a subject ID to the display name used in the worksheet library.
 * The library stores subjects with specific names (Biology, Chemistry, Physics, Maths)
 * that may differ from the UI subject IDs.
 */
export function getLibrarySubjectName(subjectId: string): string {
  const map: Record<string, string> = {
    biology: "Biology",
    chemistry: "Chemistry",
    physics: "Physics",
    maths: "Maths",
    mathematics: "Maths",
    science: "Science",
    english: "English",
    history: "History",
    geography: "Geography",
    art: "Art",
    music: "Music",
    pe: "PE",
    computing: "Computing",
    "computer-science": "Computer Science",
    dt: "Design & Technology",
    re: "Religious Education",
    mfl: "MFL",
    pshe: "PSHE",
    business: "Business Studies",
    drama: "Drama",
  };
  return map[subjectId.toLowerCase()] ?? subjectId;
}

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
  // Structured, clinician-style description used by SENDInfoPanel and teacher-facing
  // help text. When present, this is preferred over the flat `description` string —
  // the info panel renders each field as a labelled block so teachers see the
  // "How it presents / Barriers / What changes on the worksheet" breakdown.
  descriptionBlocks?: {
    presentation: string;    // How the need typically presents in the classroom
    barriers: string;        // What makes a standard worksheet inaccessible
    whatChanges: string;     // What the generator will change in response
  };
  // What specifically changes in the generated worksheet when this need is selected
  worksheetChanges?: {
    summary: string;           // One-sentence summary shown in dropdown
    changes: Array<{           // Specific changes with why
      what: string;            // What changes
      why: string;             // Why this helps
    }>;
  };
  // Optional sub-profiles. Used primarily for autism, which covers a wide range of
  // presentations — one uniform "ASC" prompt cannot capture them all. When the
  // teacher picks a SEND need that has sub-profiles, the UI shows a second
  // selector and the chosen profile id is appended to the sendNeed value as
  // `${sendNeed.id}:${profile.id}` (e.g. "asc:asc-social"). The worksheet
  // generator resolves the profile via resolveSendSpec() in sendPromptFragments.ts.
  subProfiles?: SendSubProfile[];
}

export interface SendSubProfile {
  id: string;                // e.g. "asc-social", "asc-demand-avoidant"
  name: string;              // Short label shown in the picker
  summary: string;           // One-line summary shown under the label
  focus: string;             // Primary adaptation focus for the generator
}

export const sendNeeds: SendNeed[] = [
  {
    id: "asc",
    name: "Autism Spectrum Condition (ASC)",
    category: "Communication & Interaction",
    description: "Autism is a lifelong developmental condition that affects how a person communicates with others, processes information, experiences the sensory world, and manages change. It is a spectrum: two pupils with the same ASC diagnosis can present in very different ways, so a single 'autism-friendly' template is rarely enough (SEND Code of Practice 2015; COBS Handbook; NAS guidance).",
    descriptionBlocks: {
      presentation: "Pupils with ASC vary widely. Some find social and emotive language hard to decode; some need very predictable routines and struggle when instructions are ambiguous; some experience strong sensory responses to bright colour, clutter, or dense text; some cope best with short, bounded tasks and clear stopping points. Choose the sub-profile that best matches the pupil so the adaptation is targeted, not generic.",
      barriers: "Standard worksheets often hide the expected steps (leaving the pupil to infer them), switch between synonyms for the same action ('find' / 'work out' / 'calculate'), embed social or emotive scenarios that require theory-of-mind processing, and pack dense visual information into small boxes. Each of these creates unnecessary friction that masks what the pupil actually knows.",
      whatChanges: "Every section opens with an explicit 'What you need to do' box (once per section, not per question), the worked example mirrors the first practice question exactly, terminology is locked to one word per concept, contexts are neutral and factual, and the reflection becomes a tick-box checklist. The sub-profile further narrows the adaptation — e.g. more sensory control for a sensory-dominant profile, more choice for a demand-avoidant profile.",
    },
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
    subProfiles: [
      {
        id: "asc-social",
        name: "Social Communication profile",
        summary: "Struggles most with inferred expectations, idioms, and socially-framed contexts",
        focus: "literal language, neutral contexts, explicit steps",
      },
      {
        id: "asc-demand-avoidant",
        name: "Demand-Avoidant profile",
        summary: "Anxiety around perceived demands; responds best to invitation and choice",
        focus: "invitational language, choices, optional challenge",
      },
      {
        id: "asc-sensory",
        name: "Sensory-Dominant profile",
        summary: "Sensitive to visual clutter, bright colour, dense layout, and unexpected change",
        focus: "muted palette, generous spacing, minimal icons, predictable layout",
      },
      {
        id: "asc-rigid",
        name: "Rigid-Thinking / Routine profile",
        summary: "Works best when every section has the same shape and order as the example",
        focus: "identical layout across sections, worked example mirrors every practice question",
      },
    ],
    worksheetChanges: {
      summary: "Every instruction is literal and unambiguous; sections have a 'What you need to do' box; questions mirror the worked example exactly.",
      changes: [
        { what: "'What you need to do' box added once per section", why: "ASC affects the ability to infer unstated expectations — explicit structure removes ambiguity and reduces anxiety. One box per section (not per question) avoids repetition fatigue." },
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
    description: "Asperger Syndrome is a profile within the autism spectrum marked by difficulties with social interaction and non-verbal communication alongside strong, focused interests and a preference for predictable structure. Pupils usually have age-appropriate or advanced vocabulary and subject knowledge, so the barrier is typically about how instructions are worded and laid out — not cognitive load (SEND Code of Practice 2015; COBS Handbook).",
    descriptionBlocks: {
      presentation: "Pupils often present as verbally articulate, logical, and rule-driven. They may take written instructions literally, struggle with figurative language, and find unpredictable formatting or changes of task mid-page stressful. They often have a deep area of interest that can be a powerful engagement lever.",
      barriers: "Ambiguous wording, idioms ('find x', 'hit the numbers'), mixed synonyms, inconsistent layout between sections, and open-ended instructions. These barriers are presentation-based — the pupil typically has the knowledge, but the framing blocks access.",
      whatChanges: "All instructions are direct and literal, layout is identical across every section, step-by-step numbered instructions are standard, and where the pupil's interest area is known it can be used as the real-world context. Reflection is a tick-box rather than open writing.",
    },
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
    description: "Pathological Demand Avoidance (a profile within the autism spectrum) and Oppositional Defiant Disorder both involve anxiety-driven avoidance of perceived demands and a strong need to maintain control. The recommended approach is the PANDA framework: Pick battles, Anxiety management, Negotiation and collaboration, Disguise and manage demands, Adaptation (SEND Code of Practice 2015; COBS Handbook).",
    descriptionBlocks: {
      presentation: "Pupils experience high anxiety when they feel controlled, observed, or required to perform. Direct instructions ('You must…', 'Answer the following…') can trigger avoidance even when the pupil is capable of the task. Behaviour may look oppositional but is typically a self-protective response to overwhelm.",
      barriers: "Demand-heavy language ('must', 'need to', 'complete all'), compulsory challenge questions, timed pressure, public-looking progress trackers, and dense tasks with no stopping points. All of these amplify the perceived demand and tip the pupil into avoidance.",
      whatChanges: "Section names are reframed as invitations ('Explore', 'Investigate', 'Secret Mission'), 'must/need' language is replaced with 'you might like to', options are offered within questions, and explicit break points are built in. The challenge is always framed as a choice the pupil can accept or decline.",
    },
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
    description: "SLCN covers a wide range of difficulties with speech production, language comprehension, expressive language, and pragmatic communication. Pupils often know more than they can show: the bottleneck is understanding complex instructions or producing written sentences, not the subject content itself (RCSLT guidelines; SEND Code of Practice 2015).",
    descriptionBlocks: {
      presentation: "Pupils may take longer to process multi-step or complex sentences, struggle to retrieve subject vocabulary under time pressure, and find it hard to organise a full written answer even when they understand the concept. Some also have difficulty with question-form language ('what', 'why', 'how') or with abstract connectives ('although', 'whereas').",
      barriers: "Long, multi-clause instructions; high-density vocabulary without definitions; answer boxes that expect extended prose with no scaffolding; mixed question types without visual cues; and abstract comparison prompts ('compare and contrast') without a frame.",
      whatChanges: "A plain-English Word Bank sits at the top of every section, every answer has a sentence frame, instructions are max 12 words in subject-verb-object form, Section B uses matching / labelling / MCQ where possible, and visual cues sit beside every text question. Reflection is 'I can…' tick-box.",
    },
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
    description: "Dyslexia is a specific learning difficulty primarily affecting decoding, reading fluency, spelling, and written expression. It is unrelated to intelligence and commonly co-occurs with strengths in verbal reasoning, creative thinking, and problem-solving. Typography, pacing, and working-memory demands — not subject difficulty — are the usual worksheet barriers (British Dyslexia Association Style Guide 2023; Rose Review; SEND Code of Practice 2015).",
    descriptionBlocks: {
      presentation: "Pupils often read more slowly than peers, may lose their place on dense pages, and need more working memory for decoding — leaving less for the subject content. Spelling and written expression can lag well behind oral understanding.",
      barriers: "Small or tightly-kerned text, narrow line spacing, italicised or underlined emphasis, long sentences, multi-step instructions with no visible method, and high-density word lists without definitions all create disproportionate load for dyslexic readers.",
      whatChanges: "Every question is one short sentence (max 12 words), every key term is bolded at first use, a Step-by-Step Method box sits immediately before Section A, a Word Bank runs at the top of each section, and line spacing / white space is generous. Italics and underlining are removed in favour of bold.",
    },
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
    description: "Dyscalculia is a specific learning difficulty affecting number sense — the ability to understand, manipulate, and reason with quantities. Pupils may reliably mis-estimate, struggle to sequence arithmetic steps, and find abstract notation inaccessible without a visible reference (BDA Dyscalculia Network; EEF guidance).",
    descriptionBlocks: {
      presentation: "Pupils often lose track of where they are in a multi-step calculation, rely on counting rather than number bonds, reverse digits, and find it hard to retrieve times-table facts quickly. They may understand the conceptual question but be blocked by the arithmetic machinery.",
      barriers: "Questions written as dense prose, worked examples that skip method steps, implicit knowledge of times-tables or formulas, and abstract 'a number is chosen…' contexts all compound the difficulty and hide what the pupil actually understands.",
      whatChanges: "Every Section A question is broken into explicit sub-steps with blanks, a number line or place-value chart sits before Section A, a Key Facts box (times-tables, number bonds, formulas) sits at the top of Section B, and all word problems use real-world concrete contexts. Reflection uses a Great / OK / Struggling tick-box.",
    },
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
    description: "Developmental Coordination Disorder (DCD / dyspraxia) affects the planning and execution of coordinated movement. In a classroom context this usually shows up as a handwriting and layout barrier: pupils know the answer but struggle to get it onto the page legibly and at pace (Dyspraxia Foundation guidance; COBS Handbook).",
    descriptionBlocks: {
      presentation: "Handwriting is often effortful, slow, and tiring; ruled lines may feel too narrow; organising a response on a blank page can be overwhelming; fine motor drawing tasks (graphs, diagrams) take disproportionately long.",
      barriers: "Small answer spaces, expectations of extended prose, unlined or inconsistent answer areas, and challenge questions that require precise drawing or extensive writing all make it hard for DCD pupils to demonstrate what they know.",
      whatChanges: "Section A uses multiple-choice, matching or circle-the-answer formats, every answer box is generously sized (3+ lines), Section B uses tables or fill-in-the-blank frames, the challenge uses tick / circle / label-the-diagram, and worked examples are brief bullet steps.",
    },
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
    description: "Moderate Learning Difficulties describes pupils whose attainment is significantly below age-expected levels across most areas of the curriculum, typically alongside difficulties with basic literacy, numeracy, and generalising from one task to another. The evidence base is clear: scaffolded release of responsibility (I do, we do, you do) and concrete-pictorial-abstract progression are the most effective approaches (EEF guidance; SEND Code of Practice 2015).",
    descriptionBlocks: {
      presentation: "Pupils often take longer to secure new concepts, benefit from repeated exposure in varied contexts, struggle with open-ended tasks, and find it hard to transfer a method from a worked example to a blank page without explicit scaffolding.",
      barriers: "Worksheets that jump straight into independent practice, dense vocabulary without definitions, abstract-only representations, and multi-step problems without breakdown create a cliff edge that MLD pupils cannot cross unaided.",
      whatChanges: "Question 1 is a fully completed model answer, every Section A question has a hint / sentence starter / partial answer, a Help Box sits at the top of Section B, reading level is held at KS2, and Section A progresses Concrete → Pictorial → Abstract. No multi-step problems in Section A; the challenge is always optional.",
    },
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
    description: "Attention Deficit Hyperactivity Disorder affects executive function — specifically sustained attention, impulse control, working memory, and time perception. Pupils can be highly creative and capable of hyper-focus on engaging tasks; the challenge is sustaining effort on tasks that are long, repetitive, or lack visible progress (CHADD; ADHD Foundation; COBS Handbook).",
    descriptionBlocks: {
      presentation: "Attention is variable rather than absent: pupils may complete the first two questions at pace, hit a wall, and struggle to restart without a visible cue. Boredom, repetition, and unclear expectations are disproportionate risks. Movement breaks genuinely restore attention capacity.",
      barriers: "Long undifferentiated sections, identical question formats back-to-back, no visible progress markers, no stopping points, and instructions that bury the action verb in mid-sentence all accelerate loss of focus.",
      whatChanges: "Section A is hard-capped at 3 questions and Section B at 5; every question gets a physical '[ ]' checkbox; question types are varied so no two in a row are the same; the action verb is bolded; a Brain Break prompt is inserted mid-Section B; and the challenge is framed as an optional bonus.",
    },
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
    description: "Anxiety and related mental health difficulties directly affect the brain's capacity to learn: threat-response activation reduces working memory, narrows attention, and triggers avoidance. Reducing perceived threat is not a 'soft' adjustment — it is a prerequisite for any cognitive work (Anna Freud Centre; Zones of Regulation; SEND Code of Practice 2015).",
    descriptionBlocks: {
      presentation: "Pupils may appear quiet and compliant but find it hard to begin, re-read the same question repeatedly, under-perform when asked to show working, or freeze on challenge questions. Physical signs include trembling, fidgeting, or avoidance of eye contact with the task.",
      barriers: "High-stakes language ('must', 'quickly', 'only N minutes'), mandatory challenge questions, unpredictable formatting, and reflection prompts that require exposing uncertainty all amplify threat response and shut down learning.",
      whatChanges: "Section A is renamed 'Warm-Up — no pressure!', the challenge is clearly 'Optional Bonus', each section opens with a positive priming line, obligation words are swapped for invitation words, and an emoji check-in bookends the worksheet. No time pressure language anywhere.",
    },
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
    description: "Visual impairment covers a spectrum from mild low vision through to blindness. Worksheet access depends on three levers: font size, contrast ratio, and whether any information is conveyed by visuals alone. RNIB's 'Clear Print' guidelines are the authoritative reference (RNIB Clear Print; NICE NG41).",
    descriptionBlocks: {
      presentation: "Pupils may need significantly larger print, struggle with pale greys or low-contrast colour, experience eye strain on dense pages, and be unable to interpret fine diagrams without a described alternative. Pupils using screen readers require every visual to have a textual equivalent.",
      barriers: "Font sizes below 18pt equivalent, low-contrast colour schemes, diagram-only questions, cramped layouts, and reliance on colour alone to convey information all create insurmountable barriers for VI pupils.",
      whatChanges: "Minimum 18pt equivalent font throughout, high-contrast dark-on-light formatting, every diagram is described in text immediately alongside it, no question relies solely on visual interpretation, and generous spacing helps the pupil navigate independently.",
    },
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
    description: "Hearing impairment ranges from mild to profound. The core principle is that the worksheet must be fully self-contained in text and visuals — never relying on anything the pupil would only get by listening. Pupils may also have gaps in incidental vocabulary that hearing peers absorb from conversation (NDCS; COBS Handbook).",
    descriptionBlocks: {
      presentation: "Pupils read every instruction from the page rather than picking it up from the teacher's verbal explanation. Subject vocabulary that peers acquire through listening may be less secure. Lip-reading is tiring and incomplete.",
      barriers: "Instructions like 'as I explained' or 'as your teacher said', audio-dependent tasks, references to listening stimuli, and undefined subject vocabulary all lock the pupil out of the task.",
      whatChanges: "Every instruction is written in full, a Word Bank with plain-English definitions is standard, each question is fully self-contained with no cross-references, and visual diagrams support every text question. No audio-dependent content anywhere.",
    },
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
    description: "Tourette's Syndrome is a neurological condition causing involuntary movements and sounds (tics). Tic suppression requires conscious effort and depletes the same cognitive resources needed for sustained task work. It commonly co-occurs with ADHD and anxiety (Tourettes Action; COBS Handbook).",
    descriptionBlocks: {
      presentation: "Tics vary day-to-day and are worsened by stress, concentration, or tiredness. Extended writing in particular is affected by motor tics. Pupils may work in short bursts, need movement breaks, and benefit from varied response formats that reduce the handwriting window.",
      barriers: "Long written responses, timed pressure language, rigid single-format sections, and public-facing progress boards all increase anxiety and therefore tic frequency.",
      whatChanges: "Response formats are varied (tick / circle / fill-in / short answer), natural break points are built into each section, extended writing is minimised, timing language is removed, and the tone is calm and supportive throughout.",
    },
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
    description: "Older pupils with SEND need age-appropriate content and register alongside scaffolded access. Resources pitched too young damage engagement and dignity; resources pitched at the wrong cognitive level leave the pupil unable to access the curriculum. The answer is adult-register language with embedded scaffolds, not simplified content (EEF guidance; COBS Handbook).",
    descriptionBlocks: {
      presentation: "Pupils respond well to real-world KS3–KS5 contexts (workplace, finance, media, technology, current affairs), benefit from explicit metacognitive strategies, and often struggle with note-taking and organising extended responses under lesson pressure.",
      barriers: "Childish imagery and primary-coded design damage engagement; blank-page extended responses overwhelm without a graphic organiser; lack of visible time guides leads to pacing difficulties; and generic scaffolds feel patronising.",
      whatChanges: "Extended-response questions include a graphic organiser or table frame, each section ends with a Cornell-style note box, age-appropriate academic language is used throughout, a Study Tips box opens each section with 1–2 exam technique reminders, and each section header shows an estimated time.",
    },
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
    description: "EAL pupils are learning English alongside the curriculum. Subject knowledge may be strong in their home language; the barrier is almost always academic English, UK-specific cultural references, and idiomatic phrasing. NALDIC's evidence base emphasises visual supports, explicit vocabulary teaching, and culturally neutral contexts.",
    descriptionBlocks: {
      presentation: "Pupils can often tackle the underlying subject concept in their first language but struggle to decode the question itself, retrieve academic English vocabulary under time pressure, or generate extended written responses in English.",
      barriers: "UK-specific idioms ('piece of cake', 'bob's your uncle'), cultural references (Premier League teams, UK food brands), complex grammar, and dense vocabulary without definitions all exclude EAL pupils.",
      whatChanges: "A Key Vocabulary box with plain-English definitions sits at the start of every section, sentence frames scaffold every written response, contexts are culturally neutral, sentences are short and SVO, and visual supports sit beside every text question.",
    },
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
  {
    id: "working-memory",
    name: "Working Memory Difficulties",
    category: "Cognition & Learning",
    description: "Working memory is the ability to hold and manipulate information in mind while completing a task. Pupils with working memory difficulties may understand each step of a process but lose it before they can apply it — not a knowledge problem but a capacity problem. The evidence-based response is to externalise as much information as possible onto the page (Gathercole & Alloway research; EEF guidance).",
    descriptionBlocks: {
      presentation: "Pupils often forget multi-step instructions midway through, lose their place on longer questions, need vocabulary and formulas repeated, and can appear to 'know it yesterday, not today' because the information was never fully encoded.",
      barriers: "Multi-part instructions in a single sentence, invisible formulas, worked examples placed too far from practice, and reliance on recalled facts all overload working memory.",
      whatChanges: "A Memory Aid box with key facts and vocabulary opens every question section, multi-step questions are broken into numbered sub-steps with blanks, a word bank / key facts box is always visible, the worked example sits immediately before each practice block, and one instruction per line is enforced.",
    },
    strategies: [
      "Chunk instructions into single steps",
      "Provide written reference materials (word banks, key facts boxes)",
      "Worked examples available throughout the task",
      "Reduce the amount of information to hold at once",
      "Repetition and review built into the task structure",
    ],
    worksheetAdaptations: [
      "Memory Aid box before every question section",
      "Step-by-step numbered sub-steps for every multi-step question",
      "Visible word bank and key facts box on every section",
      "Worked example immediately before every practice section",
      "One instruction per line only",
    ],
    worksheetChanges: {
      summary: "Memory Aid box before every section; step-by-step sub-steps for every question; visible word bank and key facts; worked example before every practice section; one instruction per line.",
      changes: [
        { what: "Memory Aid box before every question section with key facts and vocabulary", why: "Working memory difficulties mean students cannot hold multiple pieces of information simultaneously; externalising key facts removes this barrier" },
        { what: "Every multi-step question broken into numbered sub-steps with blanks", why: "Sub-steps externalise the process so students do not need to hold the method in working memory" },
        { what: "Visible word bank and key facts box at the top of every section", why: "Removes the need to recall vocabulary or formulas from memory, freeing cognitive resources for the task" },
        { what: "Fully worked example immediately before every practice section", why: "Provides a reference model so students do not need to hold the method in memory while practising" },
        { what: "One instruction per line — no multi-part questions", why: "Multi-part instructions overload working memory; single-step instructions are fully accessible" },
      ],
    },
  },
  {
    id: "semh",
    name: "Social, Emotional and Mental Health (SEMH)",
    category: "Social, Emotional & Mental Health",
    description: "SEMH is one of the four broad areas of need in the SEND Code of Practice (2015) and covers a wide spectrum — from attachment difficulties through ADHD-related regulation, to anxiety, depression, and self-harm. The shared thread is that emotional state directly mediates access to learning: a dysregulated pupil cannot learn regardless of cognitive ability.",
    descriptionBlocks: {
      presentation: "Pupils may present with withdrawal, volatility, avoidance, or rapid fluctuation between engagement and disengagement. Relationships with a trusted adult and predictable routines are primary access requirements. Emotional check-ins help both pupil and teacher identify when a pause is needed.",
      barriers: "High-pressure or judgemental language, mandatory challenge, lack of stopping points, and open-ended reflection prompts that ask the pupil to expose difficulty all escalate rather than contain dysregulation.",
      whatChanges: "An emotional check-in bookends the worksheet, Section A is renamed 'Warm-Up', every section opens with a positive priming line, obligation words are swapped for invitational words, natural breaks are built in, and an Encouragement box precedes each question section.",
    },
    strategies: [
      "Trauma-informed approaches and positive relationships",
      "Zones of Regulation framework",
      "Predictable routines and clear expectations",
      "Safe space and de-escalation strategies",
      "Restorative approaches and emotional literacy",
    ],
    worksheetAdaptations: [
      "Emotional check-in at start and end",
      "Positive, encouraging language throughout",
      "Optional challenge — never mandatory",
      "Natural break points built in",
      "Encouragement box before every section",
    ],
    worksheetChanges: {
      summary: "Emotional check-in at start and end; Section A renamed 'Warm-Up'; positive statements before every section; no pressure language; natural break points; optional challenge.",
      changes: [
        { what: "Emotional check-in at the start and end of the worksheet", why: "SEMH needs affect emotional regulation; check-ins normalise self-monitoring and help students identify when they need support" },
        { what: "Positive, encouraging language throughout — no pressure or urgency", why: "Anxiety and low self-esteem are common in SEMH; supportive language reduces barriers and activates approach motivation" },
        { what: "Challenge clearly labelled 'OPTIONAL BONUS — only if you want to!'", why: "Mandatory challenge tasks increase anxiety; optional framing maintains engagement without threat" },
        { what: "Natural break points built into every section", why: "SEMH needs can affect concentration and emotional regulation; breaks allow self-regulation without disrupting the task" },
        { what: "Encouragement box before every question section", why: "Explicit encouragement builds confidence and reduces avoidance behaviour" },
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
  headerStyle: "solid",
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
    sectionBgColor: "#ffffff",  // white — cream removed per design update
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
    sectionBgColor: "#ffffff",  // white — cream removed per design update
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
  // ── WORKING MEMORY ────────────────────────────────────────────────────────────────────────────
  // Chunked layout, generous spacing, visible reference materials at all times
  "working-memory": {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.01em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "chunked",
    sectionBgColor: "#f0fdf4",    // soft green — calm and focused
    accentColor: "#15803d",       // forest green
    headerStyle: "gradient",
    answerLineHeight: 30,
    showCheckboxes: false,
    borderRadius: 8,
    sectionPadding: "12px 14px",
    headerTextSize: 1,
    showSectionNumbers: true,     // numbered steps help with sequencing
  },
  // ── SEMH ────────────────────────────────────────────────────────────────────────────────────────
  // Calm palette, gentle encouragement, no pressure language
  "semh": {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.85,
    letterSpacing: "0.01em",
    wordSpacing: "0.05em",
    fontWeight: 400,
    textAlign: "left",
    paragraphSpacing: "10px",
    theme: "calm",
    sectionBgColor: "#fdf4ff",    // very soft lavender — calming
    accentColor: "#9333ea",       // gentle purple
    headerStyle: "gradient",
    answerLineHeight: 28,
    showCheckboxes: false,
    borderRadius: 10,             // softer corners — less clinical
    sectionPadding: "12px 14px",
    headerTextSize: 1,
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
  "working memory difficulties": "working-memory",
  "working memory": "working-memory",
  "working-memory": "working-memory",
  "memory difficulties": "working-memory",
  "social, emotional and mental health (semh)": "semh",
  "social, emotional and mental health": "semh",
  "semh": "semh",
  "social emotional mental health": "semh",
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
