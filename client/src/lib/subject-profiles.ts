/**
 * subject-profiles.ts
 *
 * Shared subject configuration used by BOTH the worksheet generator
 * (client/src/lib/ai.ts) AND the presentation generator
 * (client/src/pages/tools/PresentationMaker.tsx).
 *
 * Why share it?
 *  - Content must match across tools. If a pupil's lesson is Ohm's Law, the
 *    same notation, command words and spec points should appear in the
 *    slide deck and the follow-up worksheet.
 *  - Each subject has its own palette, slide plan and domain conventions.
 *  - One source of truth stops the two tools drifting apart.
 *
 * Ported from the user's subject-configs.js. Two additions:
 *  - `specAnchor`: a short prompt fragment that anchors the AI to real UK
 *    exam-board specification points, used by both generators.
 *  - `buildSubjectPromptFragments()`: a single helper that returns both the
 *    presentation-shaped block and the worksheet-shaped block so the two
 *    tools stay in lock-step.
 *
 * NEVER use a "#" prefix on any color value — pptxgenjs + our theme tokens
 * both expect bare hex.
 */

export type SubjectKey =
  | "science"
  | "mathematics"
  | "history"
  | "english"
  | "geography"
  | "biology"
  | "chemistry"
  | "physics"
  | "computer_science"
  | "french"
  | "art_design"
  | "physical_education";

export interface SubjectPalette {
  /** Dark page / slide background (hex, no '#') */
  darkBg: string;
  /** Light page / slide background */
  lightBg: string;
  /** Primary accent colour */
  accent1: string;
  /** Warm secondary accent */
  accent2: string;
  /** Dark card fill */
  cardDark: string;
  /** Card border colour */
  cardBorder: string;
}

export interface SubjectProfile {
  key: SubjectKey;
  label: string;
  palette: SubjectPalette;
  /** 12-slide deck structure tuned to the discipline. One slide per line. */
  slideStructure: string;
  /** Domain-specific do/don't rules the LLM must follow. */
  domainPatterns: string;
  /** Short spec-point anchor shared by worksheet + presentation. */
  specAnchor: string;
}

// ─── Subject profiles ────────────────────────────────────────────────────────
export const SUBJECT_PROFILES: Record<SubjectKey, SubjectProfile> = {
  science: {
    key: "science",
    label: "Science",
    palette: {
      darkBg: "0D1B2A",
      lightBg: "F0F6FF",
      accent1: "00C8FF",
      accent2: "F7B731",
      cardDark: "1A3A5C",
      cardBorder: "00C8FF",
    },
    slideStructure: `
1.  Title slide — dark bg, topic in Arial Black, 4 topic-pill badges (key concepts covered)
2.  "What is [topic]?" — numbered key points left, atom/science icon circle right, key-idea footer
3.  Core concept A — stat callout box (symbol + unit + measurement name), content cards left
4.  Core concept B — two-column comparison cards (two types / two states / two forces)
5.  Key formula/law — large Consolas formula box, VIR triangle or cover-up method, worked example
6.  Diagrams & processes — circuit/cell/body diagram drawn with pptxgenjs shapes + labels
7.  Experimental method — numbered step cards (hypothesis → method → results → conclusion)
8.  Units & measurements — 2×3 grid cards (quantity, symbol, unit, instrument)
9.  Real-world applications — 3 application cards with emoji and description
10. Common mistakes — warning cards, 2-column grid, X wrong / OK correct pattern
11. Key formulas table — full-width reference table (quantity, symbol, unit, formula)
12. Summary & exam questions — 5 bullet takeaways + 3 exam-style questions with mark allocation
`,
    domainPatterns: `
- Use "Consolas" font for ALL formulas and equations
- Use large symbol callout boxes (font 52-60pt italic) when introducing new quantities
- Worked examples must show every calculation step on its own line
- Label all diagram components with leader lines (addShape LINE + addText label)
- Exam questions should specify marks: "Calculate the resistance. [3 marks]"
`,
    specAnchor: "AQA/Edexcel/OCR GCSE Science. Use correct SI units, state symbols, and official command words (describe, explain, calculate, evaluate).",
  },

  mathematics: {
    key: "mathematics",
    label: "Mathematics",
    palette: {
      darkBg: "0A1628",
      lightBg: "F5FFF9",
      accent1: "00C875",
      accent2: "FFD166",
      cardDark: "0F2A1A",
      cardBorder: "00C875",
    },
    slideStructure: `
1.  Title slide — dark bg, topic in Arial Black, prerequisite knowledge pills at bottom
2.  Prior knowledge check — "You need to already know..." bullet list, concept map shapes
3.  Key definitions — definition cards with term highlighted in accent, formal notation
4.  Worked example A (basic) — step-by-step worked solution, each step in its own card
5.  Worked example B (intermediate) — more complex example, common pitfall highlighted
6.  Key rules / identities — formula reference cards in 2×3 grid, Consolas font
7.  Visual / graphical representation — axes drawn with shapes, curve labelled
8.  Your turn — 3 practice questions of increasing difficulty, space for working
9.  Worked example C (exam-style) — full mark-scheme style solution
10. Common errors — X/OK comparison cards showing the wrong vs correct approach
11. Formula & reference sheet — complete table of all rules introduced in this lesson
12. Summary & extension — recap bullets + one challenge/extension question
`,
    domainPatterns: `
- ALL mathematical notation must use Consolas font
- Use large display boxes for key equations (fontSize 40-52pt, high contrast)
- Steps in worked examples: number each step, one step per line
- Difficulty indicators: label questions as [Foundation] [Higher] [Extension]
- Graph axes: draw with addShape LINE for x and y axes, label at ends with addText
- Fraction notation: write as "a/b" in Consolas — do not attempt unicode fractions
`,
    specAnchor: "AQA/Edexcel/OCR GCSE Maths. Use official command words (work out, show that, prove, hence). Mark allocations on every exam question.",
  },

  history: {
    key: "history",
    label: "History",
    palette: {
      darkBg: "1C1008",
      lightBg: "FDF6EC",
      accent1: "C0622F",
      accent2: "F0C040",
      cardDark: "2E1A0E",
      cardBorder: "C0622F",
    },
    slideStructure: `
1.  Title slide — dark bg with parchment-feel, era/period badge, topic in Arial Black
2.  Historical context — "When & Where?" timeline shapes showing the period, key background
3.  Key causes / factors — factor cards with ranking or categorisation (PENS/MAIN/etc.)
4.  Key events — vertical timeline drawn with shapes + event cards, dates prominent
5.  Key individuals — 2-column cards (name, role, significance, dates lived)
6.  Turning points — before/after comparison cards, significance explained
7.  Primary source analysis — quote box (styled border), source evaluation framework
8.  Consequences — short-term vs long-term two-column comparison
9.  Historian interpretations — different viewpoint cards with historian name + key argument
10. Common misconceptions — myth vs reality cards in 2-column grid
11. Key dates & facts table — chronological reference table (date, event, significance)
12. Exam technique — model answer structure + sample question with mark scheme
`,
    domainPatterns: `
- Date labels: always bold and in accent color (e.g. "1914" prominent)
- Timeline slides: draw timeline as a horizontal LINE shape, events as vertical tick marks + text above/below
- Primary source quotes: use a distinctive bordered box, attribution in italic below
- Significance ratings: use colored rectangles as visual "importance bars"
- Historian names: always italicised when cited as interpretations
- Exam questions: frame as "[Source A] / How far do you agree... [16 marks]" style
`,
    specAnchor: "AQA/Edexcel/OCR GCSE History. Use source analysis framework (provenance, content, reliability) and official question stems (Describe, Explain why, How far).",
  },

  english: {
    key: "english",
    label: "English",
    palette: {
      darkBg: "1A0A2E",
      lightBg: "FDF8FF",
      accent1: "9B59B6",
      accent2: "F39C12",
      cardDark: "2C1054",
      cardBorder: "9B59B6",
    },
    slideStructure: `
1.  Title slide — dark purple bg, text/author/context badges, literary quote as subtitle
2.  Context & background — author biography cards, historical/social context of the work
3.  Key themes — theme cards in 2×3 grid with theme name + brief explanation
4.  Language & structure — technique cards (device name, definition, effect on reader)
5.  Close reading — short extract in styled quote box, annotation arrows pointing to techniques
6.  Character analysis — character cards (name, role, key traits, development arc)
7.  Writer's methods — P.E.E/P.E.A structure worked example for a key quotation
8.  Comparative element — two-column comparison (text A vs text B, or chapter vs chapter)
9.  Contextual links — connection cards linking text to its time period/movement
10. Common mistakes — X/OK cards (e.g. "describing" vs "analysing" language)
11. Key quotes table — table of essential quotes, technique used, and effect
12. Exam technique — question deconstruction, timed writing tips, mark scheme breakdown
`,
    domainPatterns: `
- Literary quotes: always in italic, in a distinctively bordered box, with attribution below
- Technique labels: bold in accent color (e.g. "Metaphor:", "Sibilance:", "Enjambment:")
- P.E.E structure: use three connected card shapes with Point / Evidence / Effect labels
- Writer's intention: always phrase as "Shakespeare presents..." not "Shakespeare says..."
- Avoid plot summary framing — frame every point as analysis of writer's choices
- Exam questions: "[30 marks + 4 SPaG]" style with clear mark allocation shown
`,
    specAnchor: "AQA/Edexcel/OCR GCSE English Literature & Language. Assessment objectives AO1–AO4. Always frame responses as analysis of writer's methods.",
  },

  geography: {
    key: "geography",
    label: "Geography",
    palette: {
      darkBg: "0D2B1A",
      lightBg: "F0FBF4",
      accent1: "27AE60",
      accent2: "3498DB",
      cardDark: "103D25",
      cardBorder: "27AE60",
    },
    slideStructure: `
1.  Title slide — dark green bg, key scale/location badges, topic in Arial Black
2.  Where & what — location context cards, scale overview (local → global)
3.  Key processes — process flow diagram drawn with shapes + arrows
4.  Case study A — case study card with location, date, facts, human impact
5.  Case study B — second contrasting case study (often HIC vs LIC comparison)
6.  Causes — factor cards categorised by type (physical vs human, short vs long term)
7.  Effects — social / economic / environmental three-column cards
8.  Responses — management/mitigation strategy cards with effectiveness rating
9.  Data & statistics — large stat callout cards with data, trend description
10. Geographical skills — map/graph interpretation tips, command word guidance
11. Key terms table — glossary table (term, definition, example) for the topic
12. Exam technique — 4/6/9-mark question frameworks + sample question
`,
    domainPatterns: `
- Case studies: always include a "Fast Facts" box (location, date, scale, death toll/GDP impact)
- HIC/LIC comparisons: two-column cards with clear country label headers
- Processes: use connected rectangle shapes with arrows to show sequence/cycle
- Data citations: always note the source and year of statistics
- Geographical scale: explicitly label whether points are local / national / global
- Exam questions: mirror AQA/Edexcel command words: "Describe", "Explain", "Assess", "Evaluate"
`,
    specAnchor: "AQA/Edexcel/OCR GCSE Geography. Include named case studies with real dates, places and figures. Use official command words (Describe, Explain, Assess, Evaluate).",
  },

  biology: {
    key: "biology",
    label: "Biology",
    palette: {
      darkBg: "0D1F12",
      lightBg: "F2FFF5",
      accent1: "2ECC71",
      accent2: "E74C3C",
      cardDark: "142B1C",
      cardBorder: "2ECC71",
    },
    slideStructure: `
1.  Title slide — dark forest green bg, topic in Arial Black, specification point badges
2.  Key definitions — definition cards with bold term, clear explanation, example organism
3.  Structure & components — labelled diagram drawn with pptxgenjs shapes + label lines
4.  Function — how-it-works process cards with numbered steps
5.  Classification / types — 2×3 grid cards (type name, key features, example)
6.  Adaptations — adaptation cards (structural / physiological / behavioural)
7.  Processes & reactions — equation in Consolas + step-by-step breakdown
8.  Human applications / medical links — application cards with real-world context
9.  Required practicals — method steps + what to measure + variables (IV/DV/CV)
10. Common misconceptions — X/OK comparison cards
11. Key terms & equations table — glossary + formula reference table
12. Exam questions — 1-mark recall → 6-mark extended response, mark scheme shown
`,
    domainPatterns: `
- Equations (e.g. photosynthesis): use Consolas font in a styled formula box
- Required practical slides: clearly label Independent Variable, Dependent Variable, Control Variables
- Diagrams: use OVAL shapes for cells, RECTANGLE for organelles, LINE for membranes
- Classification: always show the full hierarchy where relevant (Kingdom → Species)
- Exam questions: include command words appropriate to marks (State=1, Describe=2-3, Explain=4-6)
`,
    specAnchor: "AQA/Edexcel/OCR GCSE Biology. Reference real required practicals, use correct binomial names, and the specified units for every measurement.",
  },

  chemistry: {
    key: "chemistry",
    label: "Chemistry",
    palette: {
      darkBg: "0D0D2B",
      lightBg: "F5F5FF",
      accent1: "8E44AD",
      accent2: "F39C12",
      cardDark: "1A1A40",
      cardBorder: "8E44AD",
    },
    slideStructure: `
1.  Title slide — dark indigo bg, topic in Arial Black, topic area badges
2.  Key definitions & concepts — definition cards with bold term + example
3.  Particle / atomic model — diagram drawn with shapes, labels, electron configuration
4.  Key equations & reactions — equation in Consolas, state symbols, balancing shown
5.  Worked calculation — step-by-step moles/mass/concentration calculation
6.  Periodic table context — element card (symbol, proton number, group, period, properties)
7.  Experimental method — required practical steps, safety precautions, results table
8.  Bonding / structure — comparison cards (ionic vs covalent vs metallic)
9.  Real-world applications — industrial process or everyday application cards
10. Common errors — X/OK cards (e.g. balancing equations, state symbols)
11. Key equations & data table — formula reference (moles, concentration, Avogadro, etc.)
12. Exam questions — calculation question + written explanation question with mark scheme
`,
    domainPatterns: `
- Chemical equations: always in Consolas, show state symbols (s) (l) (g) (aq)
- Moles calculations: show the formula triangle like the physics VIR triangle
- Element cards: proton number top-left, symbol large center, name below, mass bottom
- Required practicals: safety hazards must be mentioned (COSHH awareness)
- Exam questions: calculation questions must show the formula, substitution, and answer with units
`,
    specAnchor: "AQA/Edexcel/OCR GCSE Chemistry. Balanced symbol equations with state symbols. Real required-practical contexts. Show working for every calculation.",
  },

  physics: {
    key: "physics",
    label: "Physics",
    palette: {
      darkBg: "0A0A1E",
      lightBg: "F0F0FF",
      accent1: "00C8FF",
      accent2: "F7B731",
      cardDark: "12123A",
      cardBorder: "00C8FF",
    },
    slideStructure: `
1.  Title slide — near-black bg, topic in Arial Black, unit/module badge pills
2.  Definitions & quantities — quantity cards (name, symbol, unit, measuring instrument)
3.  Key equations — formula box (large Consolas), formula triangle, all rearrangements
4.  Worked example A — substitution → rearrangement → answer with units, step by step
5.  Worked example B — harder multi-step calculation, show sig figs guidance
6.  Graphs & relationships — axes drawn with shapes, curve/line labelled, gradient meaning
7.  Experimental method — required practical method, variables, results table structure
8.  Core concept diagram — force diagram / ray diagram / circuit / wave drawn with shapes
9.  Real-world context — application cards (technology, engineering, space, medicine)
10. Common errors — X/OK cards focused on calculation mistakes and unit errors
11. Equation sheet — full reference table (quantity, symbol, unit, equation)
12. Exam questions — 2-mark recall + 4-mark application + 6-mark evaluation
`,
    domainPatterns: `
- Every quantity introduced must show: name, symbol, unit and measuring instrument
- Formula triangles: three adjacent shapes (cover the unknown to get its formula)
- Always show units in every line of a calculation — lose-a-mark-for-no-units culture
- Graphs: axes drawn as addShape LINE, label axes with quantity AND unit e.g. "Time (s)"
- Required practicals: label IV, DV, and at least two CVs explicitly
`,
    specAnchor: "AQA/Edexcel/OCR GCSE Physics. Use SI units on every line of calculations, real required practicals, and official command words.",
  },

  computer_science: {
    key: "computer_science",
    label: "Computer Science",
    palette: {
      darkBg: "0D0D0D",
      lightBg: "F5F5F5",
      accent1: "00FF88",
      accent2: "FF6B35",
      cardDark: "1A1A1A",
      cardBorder: "00FF88",
    },
    slideStructure: `
1.  Title slide — near-black terminal bg, monospace font topic title, topic area badge pills
2.  Key concepts — definition cards with term in accent, plain-English explanation
3.  How it works — process flow diagram with shapes + arrows, numbered steps
4.  Code example A — code block in Consolas on dark bg card, annotated with leader lines
5.  Code example B — second example showing variation or error handling
6.  Trace table / dry run — table showing variable values at each step
7.  Algorithms & pseudocode — pseudocode in Consolas box, flowchart in shapes
8.  Data representation — binary/hex/ASCII table or conversion worked example
9.  Real-world systems — where this concept is used in actual software/hardware
10. Exam technique — command words, common mistakes, how marks are awarded
11. Key terms table — terminology reference table (term, definition, example)
12. Practice questions — short-answer + pseudocode writing + extended response
`,
    domainPatterns: `
- Code blocks: dark rectangle card (#1A1A1A), Consolas font, accent-colored keywords
- Pseudocode: indent with spaces, keywords in CAPITALS (IF, WHILE, FOR, OUTPUT)
- Trace tables: use addTable with alternating row colors, column headers for each variable
- Flowchart shapes: RECTANGLE for process, OVAL for start/end, DIAMOND for decision
- Binary: show conversion steps (128, 64, 32, 16, 8, 4, 2, 1) as header row in a table
- Never write actual language-specific syntax as the answer — always pseudocode in exams
`,
    specAnchor: "AQA/OCR GCSE Computer Science. Pseudocode (not any specific language) for exam answers. Trace tables for algorithms. Binary/hex conversions shown in full.",
  },

  french: {
    key: "french",
    label: "French",
    palette: {
      darkBg: "00209F",
      lightBg: "FFF8F0",
      accent1: "EF4135",
      accent2: "FFFFFF",
      cardDark: "001A7A",
      cardBorder: "EF4135",
    },
    slideStructure: `
1.  Title slide — French tricolor-inspired dark blue bg, topic in Arial Black, CEFR level badge
2.  Vocabulary introduction — 2-column vocab cards (French left, English right, gender marked)
3.  Grammar rule — rule box in Consolas, English explanation, conjugation table
4.  Worked examples — example sentences with key grammar highlighted in accent color
5.  Pronunciation guide — phoneme cards with IPA and tip
6.  Listening/reading stimulus — stimulus text/transcript + comprehension questions
7.  Speaking practice — structured speaking frame with sentence starters
8.  Writing task — model answer with annotations, connectives highlighted
9.  Cultural context — cultural facts cards about France/Francophone world
10. Common errors — English interference mistakes X/OK correction cards
11. Vocabulary reference table — full vocab list with gender, English, example sentence
12. Exam technique — AQA/Edexcel task types, timing, mark scheme breakdown
`,
    domainPatterns: `
- All French words in italic when inline with English text
- Gender markers: color-code — masculine in blue, feminine in red
- Conjugation tables: use addTable with subject pronouns as row headers
- Verb infinitives: always shown in bold before conjugation
- Accent characters: é è ê ë à â î ï ô ù û ü ç — write these correctly in all text
- Model answers: highlight connectives in accent color (cependant, de plus, en revanche)
`,
    specAnchor: "AQA/Edexcel GCSE French. Correct accents, gender agreement, and CEFR-appropriate vocabulary. Model answers use connectives to boost writing band.",
  },

  art_design: {
    key: "art_design",
    label: "Art & Design",
    palette: {
      darkBg: "1A1A1A",
      lightBg: "FAFAFA",
      accent1: "E63946",
      accent2: "F4A261",
      cardDark: "2D2D2D",
      cardBorder: "E63946",
    },
    slideStructure: `
1.  Title slide — stark dark bg, bold oversized topic text, movement/era badge pills
2.  Context & movement — art movement/period overview, key dates, cultural context
3.  Key artists — artist cards (name, nationality, dates, style summary)
4.  Formal elements — element cards in 2×3 grid (line, shape, tone, color, texture, form)
5.  Artist study A — analysis card (composition, color palette, technique, meaning)
6.  Artist study B — comparative analysis with second artist
7.  Techniques & media — technique cards with step description and media used
8.  Critical analysis — CAPA/ACCESS framework applied to a sample work
9.  Annotation guide — how to annotate sketchbook work effectively
10. Common weaknesses — what examiners look for X/OK cards
11. Key vocabulary table — art vocabulary reference (term, definition, visual example)
12. Exam guidance — portfolio requirements, written paper tips, mark band descriptors
`,
    domainPatterns: `
- Color palette for this subject should feel designed and bold — the slides ARE the art lesson
- Formal element cards: use accent-colored left border bars to differentiate each element
- Artist name: always bold in accent color when first introduced
- Analysis framework: show the acronym (CAPA etc.) spelled out as a visual structure
- Sketchbook annotation tips: show "weak" vs "strong" annotation examples side by side
`,
    specAnchor: "AQA/Edexcel/OCR GCSE Art & Design. Assessment objectives AO1–AO4. Always tie practical work back to an artist reference.",
  },

  physical_education: {
    key: "physical_education",
    label: "Physical Education",
    palette: {
      darkBg: "0A2240",
      lightBg: "F0F8FF",
      accent1: "00A8E8",
      accent2: "FF6B00",
      cardDark: "0F3060",
      cardBorder: "00A8E8",
    },
    slideStructure: `
1.  Title slide — dark sports bg, topic in Arial Black, specification topic badges
2.  Key concepts — definition cards with clear accessible language
3.  Anatomy / physiology — body system diagram drawn with shapes, labelled
4.  Training principles — FITT/SPORT principle cards in a grid
5.  Training methods — method cards (type, intensity, duration, benefit, sport example)
6.  Data & fitness testing — test name, protocol, norms table, what it measures
7.  Skill classification — continuum diagrams drawn with shapes (open/closed, etc.)
8.  Psychological factors — concept cards (arousal, motivation, anxiety, attribution)
9.  Socio-cultural influences — factor cards (media, funding, participation barriers)
10. Common exam mistakes — X/OK correction cards for typical errors
11. Key terms & values table — reference table for norms, principles, and definitions
12. Exam technique — command words, 1-mark vs 4-mark vs 8-mark responses, sample questions
`,
    domainPatterns: `
- Anatomy labels: draw body outlines with OVALs and RECTANGLEs, add LINE pointers
- Training method tables: always include columns for sets/reps OR duration/intensity
- Fitness test norms: present as a table with gender-separate columns and rating bands
- Continuum diagrams: horizontal LINE shape with labels at each extreme, topic plotted on it
- Exam questions: PE often has data-response questions — include a sample graph stimulus
`,
    specAnchor: "AQA/Edexcel/OCR GCSE PE. Mix of theory and applied anatomy. Data-response questions with graphs. Real sports contexts for every principle.",
  },
};

// ─── Auto-detection ───────────────────────────────────────────────────────────

/**
 * Detects the subject from a free-text subject label or topic.
 * Used when the caller does not pass an explicit subject key.
 */
export function detectSubject(input: string | undefined | null): SubjectKey {
  const text = (input || "").toLowerCase();
  // Cheap substring-based routing. Order matters (biology/chem/physics beat "science").
  const map: Array<[RegExp, SubjectKey]> = [
    [/(biolog|cell|organ|photosynth|respirat|enzyme|dna|genetic|evolution|ecosystem)/, "biology"],
    [/(chemist|mole|titration|bonding|periodic|acid|ionic|covalent|electrolys)/, "chemistry"],
    [/(physic|force|wave|current|voltage|motion|nuclear|optic|circuit|newton|gravity)/, "physics"],
    [/(comput|algorithm|binary|code|pseudocode|cpu|network|programming|data structure)/, "computer_science"],
    [/(math|algebra|calculus|trigonometry|geometry|statistic|probability|fraction|equation)/, "mathematics"],
    [/(histor|world war|empire|revolution|civil war|cold war|tudor|medieval)/, "history"],
    [/(english|poem|novel|shakespeare|macbeth|metaphor|theme|character|literature|language paper)/, "english"],
    [/(geograph|climate|migration|urbanisation|river|coastal|earthquake|tectonic|population)/, "geography"],
    [/(french|français|vocabulaire|grammaire|conjugaison)/, "french"],
    [/(\bart\b|design|artist|sketchbook|painting|sculpture|composition|colour theory)/, "art_design"],
    [/(physical education|\bpe\b|muscle|training|fitness|sport|anatomy|exercise)/, "physical_education"],
    [/(science)/, "science"], // generic science fallback
  ];
  for (const [re, key] of map) {
    if (re.test(text)) return key;
  }
  return "science";
}

/**
 * Returns the subject profile for the given subject key or free-text label.
 * Always returns a profile — falls back to `science` if the subject is unknown.
 */
export function getSubjectProfile(subjectOrKey: string | SubjectKey | undefined): SubjectProfile {
  if (!subjectOrKey) return SUBJECT_PROFILES.science;
  const exact = SUBJECT_PROFILES[subjectOrKey as SubjectKey];
  if (exact) return exact;
  return SUBJECT_PROFILES[detectSubject(String(subjectOrKey))];
}

// ─── Prompt fragments (shared by worksheet + presentation) ───────────────────

export interface SubjectPromptFragments {
  /** Colour palette block — both generators render this for designers/LLMs. */
  paletteBlock: string;
  /** Slide structure block (presentation only). */
  slideStructureBlock: string;
  /** Domain rules block (both generators). */
  domainRulesBlock: string;
  /** Spec-point anchor — forces content to match the real UK exam spec. */
  specAnchorBlock: string;
  /** Raw profile for callers that need the palette values. */
  profile: SubjectProfile;
}

/**
 * Builds the prompt fragments the worksheet and presentation generators both
 * inject into their system prompt. This is the SINGLE source of truth for
 * "what does this subject look/sound like".
 */
export function buildSubjectPromptFragments(subjectOrKey: string | SubjectKey | undefined): SubjectPromptFragments {
  const profile = getSubjectProfile(subjectOrKey);
  const { palette } = profile;

  const paletteBlock = `### Subject palette (use these colours; never use a '#' prefix in values)
- Dark background: ${palette.darkBg}
- Light background: ${palette.lightBg}
- Primary accent: ${palette.accent1}
- Warm highlight accent: ${palette.accent2}
- Dark card fill: ${palette.cardDark}
- Card border colour: ${palette.cardBorder}`;

  const slideStructureBlock = `### Slide structure for ${profile.label} (follow this 12-slide plan)
${profile.slideStructure.trim()}`;

  const domainRulesBlock = `### Domain-specific rules for ${profile.label}
${profile.domainPatterns.trim()}`;

  const specAnchorBlock = `### UK curriculum anchor
${profile.specAnchor}
Content MUST match real GCSE specification points — use genuine examples, real formulae, real dates/places, and official command words. Do NOT invent facts. Do NOT drift into generic material.`;

  return {
    paletteBlock,
    slideStructureBlock,
    domainRulesBlock,
    specAnchorBlock,
    profile,
  };
}
