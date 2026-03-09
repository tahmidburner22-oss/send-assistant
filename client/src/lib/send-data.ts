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
];

export const yearGroups = [
  "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
  "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13",
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
];

export const readingLevels = [
  { id: "age-appropriate", name: "Age appropriate (default)" },
  { id: "below", name: "Below age level" },
  { id: "well-below", name: "Well below age level" },
  { id: "above", name: "Above age level" },
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
  },
];

// ─── SEND-specific formatting specs ─────────────────────────────────────────
// Based on COBS Handbook, BDA guidelines, and UK SEND Code of Practice.

export interface SendFormatting {
  fontFamily: string;
  fontSize: number;        // minimum px (overrides user textSize if larger)
  lineHeight: number;      // CSS line-height multiplier
  letterSpacing: string;   // CSS letter-spacing
  wordSpacing: string;     // CSS word-spacing
  fontWeight: number;      // base font weight
  textAlign: "left" | "justify"; // left-justify for dyslexia
  paragraphSpacing: string; // extra margin-bottom on paragraphs
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
};

// Map from SEND need ID → formatting overrides
const SEND_FORMATTING_MAP: Record<string, Partial<SendFormatting>> = {
  // Dyslexia: BDA recommends sans-serif ≥12pt, 1.5 line spacing, left-aligned,
  // increased letter/word spacing, avoid justified text
  dyslexia: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.8,
    letterSpacing: "0.05em",
    wordSpacing: "0.1em",
    textAlign: "left",
    paragraphSpacing: "10px",
  },
  // Visual Impairment: large print ≥18pt, high contrast, clear spacing
  vi: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 18,
    lineHeight: 2.0,
    letterSpacing: "0.03em",
    wordSpacing: "0.08em",
    fontWeight: 500,
    textAlign: "left",
    paragraphSpacing: "12px",
  },
  // ASC / Asperger: uncluttered, generous spacing, sans-serif
  asc: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.9,
    letterSpacing: "0.02em",
    textAlign: "left",
    paragraphSpacing: "10px",
  },
  asperger: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.9,
    letterSpacing: "0.02em",
    textAlign: "left",
    paragraphSpacing: "10px",
  },
  // ADHD: clear chunked layout, slightly larger line height
  adhd: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.8,
    textAlign: "left",
    paragraphSpacing: "8px",
  },
  // SLCN: clear, short sentences, larger spacing
  slcn: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.8,
    letterSpacing: "0.02em",
    textAlign: "left",
    paragraphSpacing: "8px",
  },
  // Dyspraxia: larger writing spaces, clear layout
  dyspraxia: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.9,
    textAlign: "left",
    paragraphSpacing: "10px",
  },
  // MLD: reduced cognitive load, clear spacing
  mld: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 15,
    lineHeight: 1.9,
    textAlign: "left",
    paragraphSpacing: "10px",
  },
  // PDA/ODD: calm, uncluttered
  "pda-odd": {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.8,
    textAlign: "left",
    paragraphSpacing: "8px",
  },
  // Anxiety: calm, gentle, clear
  anxiety: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.8,
    textAlign: "left",
    paragraphSpacing: "8px",
  },
  // Dyscalculia: clear visual layout
  dyscalculia: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.8,
    textAlign: "left",
    paragraphSpacing: "8px",
  },
  // Hearing Impairment: clear visual layout, no reliance on audio cues,
  // generous spacing to support lip-reading context and BSL users
  hi: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.8,
    letterSpacing: "0.02em",
    textAlign: "left",
    paragraphSpacing: "8px",
  },
  // Tourette's Syndrome: calm, uncluttered layout, avoid sensory overload
  tourettes: {
    fontFamily: "Arial, 'Helvetica Neue', sans-serif",
    fontSize: 14,
    lineHeight: 1.8,
    textAlign: "left",
    paragraphSpacing: "8px",
  },
  // Older Learners (KS3/KS4/KS5): adult-appropriate, clear professional layout
  "older-learners": {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.75,
    textAlign: "left",
    paragraphSpacing: "8px",
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
};

/**
 * Returns the SEND-specific formatting for a given SEND need ID or display name.
 * Falls back to default formatting if no specific overrides are defined.
 * The userTextSize is respected unless the SEND need requires a larger minimum.
 */
export function getSendFormatting(sendNeedId: string | undefined, userTextSize: number = 14): SendFormatting {
  if (!sendNeedId) return { ...DEFAULT_FORMATTING, fontSize: userTextSize };
  // Normalise: try the raw value first, then lowercase lookup via name-to-ID map
  const normalised = sendNeedId.toLowerCase().trim();
  const resolvedId = SEND_FORMATTING_MAP[sendNeedId]
    ? sendNeedId
    : SEND_FORMATTING_MAP[normalised]
      ? normalised
      : SEND_NAME_TO_ID[normalised] || sendNeedId;
  const overrides = SEND_FORMATTING_MAP[resolvedId] || {};
  const base = { ...DEFAULT_FORMATTING, ...overrides };
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
];
