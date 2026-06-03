/**
 * sendDescriptionsEnhanced.ts
 *
 * June 2026 — Enhanced SEND need descriptions with detailed elaboration.
 *
 * Teacher feedback: "SEND needs need to have more of a description and for
 * autism there are many different types so it needs to elaborate on how its
 * adapting to each need."
 *
 * This module provides comprehensive, teacher-facing descriptions of every
 * SEND need Adaptly supports, including:
 *   - What the condition is (plain English)
 *   - How it affects learning specifically
 *   - How Adaptly adapts for this need
 *   - Sub-types (where applicable, e.g. autism)
 *   - Practical classroom tips
 *
 * Used by: SEND adaptations panel, teacher copy footer, worksheet metadata.
 */

export interface SendNeedDescription {
  id: string;
  label: string;
  shortDescription: string;
  fullDescription: string;
  howItAffectsLearning: string[];
  howAdaptlyAdapts: string[];
  subtypes?: SendSubtype[];
  classroomTips: string[];
  sendCodeOfPracticeRef: string;
}

export interface SendSubtype {
  name: string;
  characteristics: string[];
  specificAdaptations: string[];
}

export const SEND_DESCRIPTIONS: Record<string, SendNeedDescription> = {
  dyslexia: {
    id: "dyslexia",
    label: "Dyslexia",
    shortDescription: "A specific learning difficulty affecting reading, writing, and spelling.",
    fullDescription: "Dyslexia is a neurological difference that primarily affects the ability to read, write, and spell. It is not related to intelligence. Pupils with dyslexia may read more slowly, confuse similar-looking letters, lose their place on the page, or struggle to decode unfamiliar words. Their verbal understanding is often excellent, but transferring thoughts to paper can be challenging.",
    howItAffectsLearning: [
      "Reading speed is significantly slower — long text blocks cause frustration",
      "Decoding unfamiliar or technical vocabulary takes extra processing time",
      "Working memory is taxed by reading, leaving less capacity for comprehension",
      "Written output may not reflect the pupil's true understanding",
      "Tracking lines on a page is difficult — pupils lose their place",
      "Sequencing information (multi-step problems) requires extra support",
    ],
    howAdaptlyAdapts: [
      "Sans-serif font (Arial/Verdana) at minimum 12pt for readability",
      "Increased line spacing (1.5x) to reduce visual crowding",
      "Bold key terms at first use — no italic emphasis (harder to read)",
      "Maximum 12 words per instruction sentence",
      "Sentence starters and answer frames provided for every extended question",
      "One instruction per line — no compound instructions",
      "Cream/pastel background option (reduces glare)",
      "Working one line at a time encouraged — cover-rest-of-page guidance",
      "Pre-teaching of key vocabulary at the start of the worksheet",
    ],
    classroomTips: [
      "Provide a reading ruler or coloured overlay",
      "Allow extra time (typically 25% additional)",
      "Read questions aloud if needed — dyslexia does not affect listening comprehension",
      "Praise effort and reasoning, not spelling accuracy",
      "Use text-to-speech technology where available",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.30 — Specific Learning Difficulty (SpLD)",
  },

  adhd: {
    id: "adhd",
    label: "ADHD / Focus Support",
    shortDescription: "Attention Deficit Hyperactivity Disorder affecting focus, impulse control, and executive function.",
    fullDescription: "ADHD is a neurodevelopmental condition affecting attention regulation, impulse control, and executive function (planning, organising, task-switching). Pupils may present as primarily inattentive (daydreaming, losing focus), primarily hyperactive-impulsive (fidgeting, calling out), or combined. ADHD is not a behaviour choice — it is a neurological difference in dopamine regulation.",
    howItAffectsLearning: [
      "Sustained attention on written tasks drops after 8–12 minutes",
      "Executive function deficits make multi-step tasks overwhelming",
      "Impulsivity may cause rushing through questions without reading fully",
      "Working memory is often reduced — forgets instructions mid-task",
      "Transitioning between task types is difficult without clear signals",
      "Long, uniform worksheets cause rapid disengagement",
    ],
    howAdaptlyAdapts: [
      "Checkbox [ ] next to every question — provides dopamine hit on completion",
      "Bold action verb at the start of every instruction (Calculate, Explain, etc.)",
      "Maximum 3 questions per section before a visual break",
      "BRAIN BREAK prompts inserted every 3–4 questions (stand, stretch, breathe)",
      "Varied question types — no two adjacent questions use the same format",
      "Challenge labelled as BONUS — reduces anxiety about unfinished work",
      "Clear section boundaries with different visual treatments",
      "Timer cues where appropriate (⏱️ 5 minutes for this section)",
      "Short, punchy instructions — max 30 words per question prompt",
    ],
    subtypes: [
      {
        name: "Predominantly Inattentive (ADHD-PI)",
        characteristics: ["Daydreaming", "Difficulty sustaining focus", "Loses materials", "Appears not to listen"],
        specificAdaptations: ["Extra visual cues to recapture attention", "Name on every page as a prompt", "Reduced page density"],
      },
      {
        name: "Predominantly Hyperactive-Impulsive (ADHD-HI)",
        characteristics: ["Fidgeting", "Calling out", "Difficulty waiting", "Moving around the room"],
        specificAdaptations: ["Movement breaks more frequent", "Hands-on tasks prioritised", "Standing workstation option noted"],
      },
      {
        name: "Combined Type (ADHD-C)",
        characteristics: ["Both inattentive and hyperactive-impulsive features"],
        specificAdaptations: ["All adaptations from both subtypes applied", "Most structured format with maximum visual variety"],
      },
    ],
    classroomTips: [
      "Seat near the front, away from distractions (windows, doors)",
      "Give one instruction at a time — wait for completion before the next",
      "Use a visual timer so the pupil can see time remaining",
      "Allow fidget tools that don't distract others",
      "Praise on-task behaviour specifically ('I can see you're focused on Q3')",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.32 — Social, Emotional and Mental Health (SEMH)",
  },

  asc: {
    id: "asc",
    label: "Autism Spectrum Condition (ASC)",
    shortDescription: "A neurodevelopmental condition affecting social communication, flexible thinking, and sensory processing.",
    fullDescription: "Autism (Autism Spectrum Condition) is a lifelong neurodevelopmental difference that affects how a person communicates, interacts with others, and experiences the world. It is a spectrum — every autistic person is different. Key areas of difference include social communication, flexible thinking (adapting to changes), sensory processing, and intense interests. Autism is not a deficit — it is a different way of processing information.",
    howItAffectsLearning: [
      "Ambiguous language (idioms, metaphors, sarcasm) is taken literally",
      "Unpredictable changes to routine cause significant anxiety",
      "Open-ended questions without clear boundaries are overwhelming",
      "Processing time for verbal/written instructions is longer",
      "Sensory overload (noise, visual clutter) reduces capacity to focus",
      "Abstract concepts need concrete, visual anchoring",
      "Executive function differences affect planning and organising multi-step work",
    ],
    howAdaptlyAdapts: [
      "Literal, precise language — no idioms, metaphors, or ambiguous phrasing",
      "Every section opens with exactly ONE 'What you need to do' instruction box",
      "Numbered steps (1, 2, 3, 4) for every multi-step process",
      "Same structural layout as the previous worksheet (predictable pattern)",
      "5-minute warning before transitions (noted in teacher copy)",
      "Clear, unambiguous success criteria ('Write 3 sentences' not 'Write about...')",
      "Visual schedules: section order shown at the top",
      "Reduced visual clutter — clean, consistent spacing",
      "Pre-agreed response format (typed option noted for fine motor difficulties)",
    ],
    subtypes: [
      {
        name: "High Masking / Internalising Profile",
        characteristics: [
          "Appears to cope but is internally overwhelmed",
          "May be quiet and compliant but highly anxious",
          "Often girls/women — historically under-identified",
          "Exhausted by maintaining a social 'mask' all day",
        ],
        specificAdaptations: [
          "Offer a quiet working option without requiring the pupil to ask",
          "Check-in prompts ('How are you finding this?') built into worksheet",
          "Reduced social demands — no mandatory group/partner activities",
          "Exit card system noted for teacher (pupil can leave if overwhelmed)",
        ],
      },
      {
        name: "PDA Profile (Pathological Demand Avoidance)",
        characteristics: [
          "Extreme anxiety-driven need to avoid demands",
          "May refuse or negotiate endlessly",
          "Responds to indirect, playful, choice-based approaches",
          "Traditional rewards/consequences often escalate behaviour",
        ],
        specificAdaptations: [
          "Questions framed as choices, not demands ('Which would you like to try first?')",
          "Challenge labelled as 'Secret Mission' or 'Puzzle' — not 'You must...'",
          "Collaborative language ('Let's figure out...' not 'Complete...')",
          "Fewer questions with genuine choice about which to attempt",
          "No visible consequence language (no 'if you don't finish...')",
        ],
      },
      {
        name: "High Support Needs / Non-Speaking",
        characteristics: [
          "May communicate via AAC, PECS, or Makaton",
          "Requires highly visual, symbol-supported materials",
          "Fine motor difficulties may limit written output",
          "Processing time significantly extended",
        ],
        specificAdaptations: [
          "Symbol-supported instructions alongside text",
          "Multiple-choice and point/select response types prioritised",
          "Maximum 5 questions per worksheet",
          "Very large answer spaces or alternative response methods noted",
          "Visual-first design — every question has an accompanying image/diagram",
        ],
      },
      {
        name: "Monotropism / Intense Interests",
        characteristics: [
          "Deep focus on specific interests",
          "Difficulty switching attention between topics",
          "Highly motivated when interest is engaged",
          "May struggle to engage with topics outside their interest area",
        ],
        specificAdaptations: [
          "Where possible, real-world examples link to common interest areas",
          "Clear time boundaries for each section",
          "Transition warnings between sections built into worksheet flow",
          "Interest-linked challenge extensions offered",
        ],
      },
    ],
    classroomTips: [
      "Warn 5 minutes before any transition",
      "Use the pupil's name before giving an instruction (attention cue)",
      "Avoid idioms and sarcasm — be literal and specific",
      "Provide a quiet workspace option",
      "Maintain consistent routines — same worksheet structure every lesson",
      "Allow processing time (minimum 10 seconds after asking a question)",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.29 — Communication and Interaction",
  },

  mld: {
    id: "mld",
    label: "Moderate Learning Difficulties (MLD)",
    shortDescription: "A general learning difficulty affecting the speed and depth of learning across all areas.",
    fullDescription: "Moderate Learning Difficulties (MLD) is a general term for pupils who learn at a significantly slower pace than their peers across most areas of the curriculum. This is distinct from a specific learning difficulty (like dyslexia) because it affects all areas rather than one. Pupils with MLD can and do make progress — they need more repetition, concrete examples, smaller steps, and additional processing time.",
    howItAffectsLearning: [
      "Processing speed is slower — needs 2–3x longer to understand new concepts",
      "Working memory is limited — cannot hold multiple pieces of information",
      "Abstract concepts are very difficult without concrete/visual anchoring",
      "Reading age is typically 2–4 years below chronological age",
      "Transfer of skills between contexts is not automatic",
      "Multi-step instructions are overwhelming — needs one step at a time",
    ],
    howAdaptlyAdapts: [
      "Fully completed model answer for Question 1 (see-and-copy scaffold)",
      "Hint, sentence starter, or partial answer on EVERY question",
      "Help Box with key facts and vocabulary on every page",
      "KS2 reading-level language (regardless of actual year group)",
      "Concrete → Pictorial → Abstract progression in worked examples",
      "Maximum 20 words per question prompt",
      "2x answer space (room for larger handwriting)",
      "Sentence frames: 'I think ___ because ___'",
      "Maximum 4 questions per page for reduced visual load",
      "Icon cues alongside all section headers",
    ],
    classroomTips: [
      "Pre-teach vocabulary before the lesson",
      "Use concrete manipulatives before moving to abstract",
      "Repeat key information in different ways (visual, verbal, kinesthetic)",
      "Chunk learning into very small steps with frequent success moments",
      "Allow use of reference materials (formula cards, word mats)",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.30 — Cognition and Learning",
  },

  eal: {
    id: "eal",
    label: "EAL (English as an Additional Language)",
    shortDescription: "Pupils whose first language is not English, requiring language support alongside curriculum content.",
    fullDescription: "EAL (English as an Additional Language) pupils are learning curriculum content simultaneously with learning the language of instruction. This is NOT a learning difficulty — many EAL pupils are highly capable but are temporarily limited by language access. The priority is ensuring they can access the curriculum content while their English develops. Tier 2 (academic) and Tier 3 (subject-specific) vocabulary need explicit teaching.",
    howItAffectsLearning: [
      "Tier 2 academic vocabulary (analyse, evaluate, calculate) may be unfamiliar",
      "Tier 3 subject vocabulary is entirely new (photosynthesis, denominator, etc.)",
      "Processing time is longer — translating internally before responding",
      "Cultural references in examples may not be familiar",
      "Passive constructions and complex grammar add unnecessary load",
      "Reading speed depends on literacy in first language (literate L1 = faster progress)",
    ],
    howAdaptlyAdapts: [
      "Bilingual keyword strip (English + L1 translation) for Tier 3 vocabulary",
      "Word banks provided for all written response questions",
      "Simplified grammar: active voice, short sentences, no idioms",
      "Visual supports (diagrams, arrows) alongside ALL text questions",
      "Sentence stems: 'This shows that...', 'One reason is...'",
      "Numbered step scaffolds for multi-step problems",
      "Allow first-language drafting noted in teacher copy",
      "Maximum 25 words per question prompt",
      "Cultural context explained where UK-specific references are used",
    ],
    classroomTips: [
      "Allow bilingual dictionaries",
      "Pair with a supportive peer who speaks the same L1 where possible",
      "Pre-teach 5 key vocabulary words with visuals before the lesson",
      "Allow extra processing time (10-second wait after questions)",
      "Use dual-language labelling in the classroom",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.24 — EAL pupils should not be treated as having SEND solely because of their EAL status",
  },

  dyscalculia: {
    id: "dyscalculia",
    label: "Dyscalculia",
    shortDescription: "A specific learning difficulty affecting understanding of numbers, mathematical concepts, and arithmetic.",
    fullDescription: "Dyscalculia is a specific learning difficulty that affects the ability to acquire arithmetical skills. Pupils with dyscalculia may have difficulty understanding simple number concepts, lack an intuitive grasp of numbers, and have problems learning number facts and procedures. It is NOT about intelligence — it is a specific neurological difference in how the brain processes numerical information.",
    howItAffectsLearning: [
      "Number sense is weak — difficulty estimating, comparing, or sequencing numbers",
      "Memorising times tables and number bonds is extremely difficult",
      "Multi-step calculations overwhelm working memory",
      "Place value concept may be fragile even in secondary school",
      "Word problems require decoding language AND maths simultaneously",
      "Anxiety around maths is very common (maths anxiety cycle)",
    ],
    howAdaptlyAdapts: [
      "Every calculation broken into numbered sub-steps with blanks (Step 1: ___, Step 2: ___)",
      "Number line or key facts box included on every page",
      "Every arithmetic step shown in the worked example with 'why' annotations",
      "Real-world contexts for all word problems (concrete before abstract)",
      "2x answer space for working out",
      "Formula/method card repeated on every page",
      "Estimation prompt before every calculation ('Roughly, will this be bigger or smaller than...?')",
      "Reduced number of questions — quality over quantity",
      "Calculator option noted where appropriate in teacher copy",
    ],
    classroomTips: [
      "Provide a multiplication grid and number line",
      "Allow use of a calculator for checking (not as a crutch)",
      "Use concrete manipulatives (Dienes blocks, Cuisenaire rods)",
      "Never time maths tests — time pressure amplifies anxiety",
      "Celebrate the METHOD even when the answer is wrong",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.30 — Specific Learning Difficulty (SpLD)",
  },

  slcn: {
    id: "slcn",
    label: "Speech, Language and Communication Needs (SLCN)",
    shortDescription: "Difficulties with speech production, understanding language, or using language to communicate.",
    fullDescription: "SLCN covers a wide range of difficulties with speech (producing sounds), language (understanding and using words, sentences, and discourse), and communication (using language socially). Some pupils understand more than they can express (expressive difficulty); others struggle to understand spoken/written language (receptive difficulty). SLCN can affect all subjects because language is the medium of instruction.",
    howItAffectsLearning: [
      "Following multi-part verbal or written instructions is extremely difficult",
      "Vocabulary knowledge is typically reduced — both breadth and depth",
      "Expressing ideas in writing takes much longer than peers",
      "Processing spoken language takes extra time — may appear to not listen",
      "Inference and implied meaning are challenging",
      "Grammar and sentence structure may be simplified in output",
    ],
    howAdaptlyAdapts: [
      "Pre-teach 5 key words with visual definitions at the start",
      "Maximum 20 words per question prompt",
      "One instruction per sentence — no compound instructions",
      "Sentence frames for all written responses ('The answer is ___ because ___')",
      "Visual supports and symbol cues alongside text",
      "Word bank provided for every written question",
      "Allow extra processing time (noted in teacher copy: 10-second wait)",
      "Icon cues on section headers to support decoding",
      "Reduced reliance on extended writing — use tick/circle/match where possible",
    ],
    classroomTips: [
      "Give one instruction at a time and check understanding",
      "Use visuals to support every verbal instruction",
      "Allow 10 seconds of thinking time before expecting a response",
      "Model sentence structures before asking pupils to write",
      "Pre-teach vocabulary with actions/gestures (Makaton if appropriate)",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.28 — Communication and Interaction",
  },

  semh: {
    id: "semh",
    label: "Social, Emotional and Mental Health (SEMH)",
    shortDescription: "Difficulties with emotional regulation, social interaction, or mental health that impact learning.",
    fullDescription: "SEMH encompasses a range of conditions including anxiety, depression, attachment difficulties, conduct disorders, and the impact of trauma (ACEs). Pupils with SEMH needs are not choosing to be disruptive — their behaviour reflects an underlying difficulty with emotional regulation, often linked to adverse experiences. The priority is creating a safe, predictable learning environment.",
    howItAffectsLearning: [
      "Anxiety can freeze executive function — pupil cannot start work",
      "Emotional dysregulation may cause outbursts or withdrawal",
      "Low self-esteem means pupil avoids risk of failure (won't attempt harder questions)",
      "Concentration is disrupted by internal emotional processing",
      "Trust in adults/peers may be low — resistance to help",
      "Perfectionism (in some presentations) causes extreme distress over mistakes",
    ],
    howAdaptlyAdapts: [
      "Reduced page density — generous white space reduces overwhelm",
      "Challenge labelled as optional/bonus — no pressure language",
      "Step-by-step scaffolds reduce the 'blank page' anxiety",
      "Success built in early (Section A designed for all to achieve)",
      "Positive, encouraging micro-feedback notes in section headers",
      "No punitive language (no 'you must', 'you should have')",
      "Font size slightly larger for readability during stress",
      "Icon cues provide alternative entry points beyond text",
      "Maximum 5 questions per page — prevents overwhelm",
    ],
    classroomTips: [
      "Greet by name at the door — predictable, warm start",
      "Offer a 'safe' exit route if overwhelmed (exit card system)",
      "Praise effort, not outcome",
      "Avoid public correction — speak privately",
      "Maintain predictable routines and structures",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.32 — Social, Emotional and Mental Health Difficulties",
  },

  vi: {
    id: "vi",
    label: "Visual Impairment (VI)",
    shortDescription: "Significant reduction in vision that affects access to print and visual materials.",
    fullDescription: "Visual Impairment ranges from partial sight to total blindness. Pupils may use enlarged print, screen magnification, or Braille. All visual materials (diagrams, graphs, colour-coding) need alternative access methods. The key principle is that no learning should depend solely on vision.",
    howItAffectsLearning: [
      "Standard print size is inaccessible — needs enlargement or screen reader",
      "Diagrams, graphs, and images need verbal/tactile description",
      "Colour-coded information is inaccessible without text labels",
      "Reading speed is significantly slower — fatigue sets in quickly",
      "Board work and projected materials may be invisible from pupil's seat",
      "Fine motor tasks (drawing, labelling) may be difficult",
    ],
    howAdaptlyAdapts: [
      "Font size boosted by 6pt (minimum 18pt for partial sight)",
      "High contrast (black on white or white on black)",
      "All diagrams include detailed alt-text descriptions",
      "Maximum 4 questions per page (enlarged format)",
      "2x line spacing to prevent line-merging",
      "No reliance on colour alone — all colour-coded items also have text labels",
      "Reduced visual density — generous margins and spacing",
      "Large answer spaces for handwriting difficulties",
      "Braille-ready text version available (clean formatting, no complex layout)",
    ],
    classroomTips: [
      "Seat at the front, near natural light source",
      "Provide enlarged print copies in advance",
      "Describe all visual content verbally",
      "Allow use of magnification tools",
      "Ensure all digital content is screen-reader compatible",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.34 — Sensory and/or Physical Needs",
  },

  hi: {
    id: "hi",
    label: "Hearing Impairment (HI)",
    shortDescription: "Significant reduction in hearing that affects access to spoken language and instruction.",
    fullDescription: "Hearing Impairment ranges from mild hearing loss to profound deafness. Some pupils use hearing aids, cochlear implants, or British Sign Language (BSL). The key challenge is that most classroom instruction and peer interaction relies on spoken language, which is partially or fully inaccessible. Written materials become the primary access route.",
    howItAffectsLearning: [
      "Verbal instructions may be missed or partially heard",
      "Group discussions are very difficult to follow",
      "Vocabulary development may be delayed due to reduced language exposure",
      "Fatigue from concentrated listening (with hearing aids) is significant",
      "Lip-reading only captures about 30% of spoken English",
      "Background noise makes any residual hearing less useful",
    ],
    howAdaptlyAdapts: [
      "All instructions written clearly on the worksheet (not reliant on verbal delivery)",
      "Simplified, clear language — no reliance on phonics-based cues",
      "Visual icons and symbols support meaning alongside text",
      "Topic summary section included (captures what might be said verbally)",
      "Reduced density for visual clarity",
      "Clear section headings and visual structure",
      "All audio/verbal activities have a written alternative noted",
      "Sign-supported key vocabulary noted where available",
    ],
    classroomTips: [
      "Face the pupil when speaking (lip-reading access)",
      "Reduce background noise where possible",
      "Use visual signals for transitions (not just verbal cues)",
      "Check understanding through written responses, not just verbal",
      "Provide a note-taker or written copy of verbal explanations",
    ],
    sendCodeOfPracticeRef: "SEND Code of Practice 2015 §6.34 — Sensory and/or Physical Needs",
  },
};

/**
 * Returns the full enhanced description for a given SEND need.
 * Falls back to a generic description if the need is not in the catalogue.
 */
export function getSendDescription(needId: string): SendNeedDescription | null {
  const normalised = needId.toLowerCase().replace(/[\s-_]+/g, "");
  // Direct match
  if (SEND_DESCRIPTIONS[needId]) return SEND_DESCRIPTIONS[needId];
  // Normalised match
  for (const [key, desc] of Object.entries(SEND_DESCRIPTIONS)) {
    if (key.replace(/[\s-_]+/g, "") === normalised) return desc;
  }
  // Partial match (e.g. "autism" → "asc")
  if (/autism|asc|asperger/i.test(needId)) return SEND_DESCRIPTIONS.asc;
  if (/anxiety|mental.*health/i.test(needId)) return SEND_DESCRIPTIONS.semh;
  if (/pda|demand.*avoid/i.test(needId)) return SEND_DESCRIPTIONS.asc; // PDA is a subtype of ASC
  if (/speech|language|slcn/i.test(needId)) return SEND_DESCRIPTIONS.slcn;
  if (/visual|blind|sight/i.test(needId)) return SEND_DESCRIPTIONS.vi;
  if (/hear|deaf|hoh/i.test(needId)) return SEND_DESCRIPTIONS.hi;
  if (/memory|working.*mem/i.test(needId)) return SEND_DESCRIPTIONS.adhd; // Working memory often overlaps with ADHD profile
  return null;
}

/**
 * Returns a concise adaptation rationale paragraph for the teacher copy,
 * explaining HOW the worksheet has been adapted and WHY.
 */
export function buildAdaptationRationale(needId: string): string {
  const desc = getSendDescription(needId);
  if (!desc) return `Adapted for: ${needId}. Standard SEND adaptations applied.`;

  const adaptations = desc.howAdaptlyAdapts.slice(0, 5).join("; ");
  const affects = desc.howItAffectsLearning.slice(0, 2).join(". ");

  return [
    `ADAPTED FOR: ${desc.label}`,
    ``,
    `WHY: ${affects}.`,
    ``,
    `HOW: ${adaptations}.`,
    ``,
    `REFERENCE: ${desc.sendCodeOfPracticeRef}`,
    ``,
    `CLASSROOM TIPS: ${desc.classroomTips.slice(0, 3).join(". ")}.`,
  ].join("\n");
}
