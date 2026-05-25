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
  | "spanish"
  | "german"
  | "mfl_generic"
  | "art_design"
  | "physical_education"
  | "religious_studies"
  | "sociology"
  | "psychology"
  | "business"
  | "drama"
  | "music"
  | "media"
  | "design_technology"
  | "pshe";

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

  // ── Phase 2 additions: 12 missing subjects ─────────────────────────────────
  // Each follows the same 12-slide pedagogy spine as the original profiles so
  // the prompt builder treats them identically — palette, slideStructure,
  // domainPatterns and specAnchor are all populated.

  spanish: {
    key: "spanish",
    label: "Spanish",
    palette: { darkBg: "AA151B", lightBg: "FFF8F0", accent1: "F1BF00", accent2: "FFFFFF", cardDark: "8B1117", cardBorder: "F1BF00" },
    slideStructure: `
1.  Title — Spanish flag-inspired bg, topic + CEFR badge
2.  Vocabulary — French-style 2-column cards (Spanish | English, gender)
3.  Grammar rule — table with conjugation pattern
4.  Worked sentences — examples highlighting target structure
5.  Pronunciation — phoneme cards + IPA
6.  Listening / reading stimulus + comprehension Qs
7.  Speaking frame — sentence starters and discourse markers
8.  Writing model with annotated connectives
9.  Cultural context — Spain or Hispanophone world facts
10. Common errors (anglicisms, false friends)
11. Vocabulary reference table
12. Exam technique — AQA/Edexcel task types
`,
    domainPatterns: `
- All Spanish words in italic when inline with English
- Gender markers: el (blue), la (red)
- Accents and tildes: á é í ó ú ñ ¿ ¡ — render correctly
- Conjugation tables: row headers yo/tú/él/nosotros/vosotros/ellos
- Highlight discourse markers (sin embargo, además, por lo tanto) in accent
`,
    specAnchor: "AQA/Edexcel GCSE Spanish. CEFR-appropriate vocabulary, accent marks correct, model answers use connectives.",
  },

  german: {
    key: "german",
    label: "German",
    palette: { darkBg: "000000", lightBg: "FFFAEC", accent1: "DD0000", accent2: "FFCE00", cardDark: "1A1A1A", cardBorder: "DD0000" },
    slideStructure: `
1.  Title — German flag-inspired stripe, CEFR badge
2.  Vocabulary — 2-column cards with der/die/das colour-coded
3.  Grammar rule — case table (Nom/Acc/Dat/Gen) with worked example
4.  Worked sentences — word-order callouts (verb second, verb-final)
5.  Pronunciation — umlauts, ß, ch tips
6.  Listening/reading stimulus
7.  Speaking frame
8.  Writing model with sentence-builder
9.  Cultural context — DACH region
10. Common errors (article gender, word-order)
11. Vocabulary reference table
12. Exam technique
`,
    domainPatterns: `
- Articles colour-coded: der (blue), die (red), das (green)
- Cases as a 4-row table (Nom/Acc/Dat/Gen × der/die/das/plural)
- Umlauts ä ö ü and ß rendered correctly
- Verb-second rule highlighted in worked sentences
`,
    specAnchor: "AQA/Edexcel GCSE German. Cases correct, gender colour-coded, model answers use subordinate clauses.",
  },

  mfl_generic: {
    key: "mfl_generic",
    label: "Modern Foreign Languages",
    palette: { darkBg: "1E1B4B", lightBg: "FFF8F0", accent1: "8B5CF6", accent2: "F59E0B", cardDark: "2D2456", cardBorder: "8B5CF6" },
    slideStructure: `
1.  Title — CEFR badge, target language flag
2.  Vocabulary — bilingual 2-column cards
3.  Grammar rule with conjugation/declension table
4.  Worked sentences highlighting structure
5.  Pronunciation tips
6.  Listening/reading stimulus
7.  Speaking frame
8.  Writing model
9.  Cultural context
10. Common errors
11. Vocabulary reference
12. Exam technique
`,
    domainPatterns: `
- Target-language words in italic when inline with English
- Conjugation tables with subject pronoun row headers
- Highlight discourse markers / connectives
- Always provide model answers with annotated structures
`,
    specAnchor: "AQA/Edexcel GCSE MFL. CEFR-appropriate, accents and special characters correct.",
  },

  religious_studies: {
    key: "religious_studies",
    label: "Religious Studies",
    palette: { darkBg: "451A03", lightBg: "FFFAF0", accent1: "C2410C", accent2: "EAB308", cardDark: "5C2710", cardBorder: "C2410C" },
    slideStructure: `
1.  Title — illuminated-manuscript feel, faith icon badges
2.  Key teachings/scripture — quote box with citation
3.  Beliefs about [topic] — comparison cards across denominations/faiths
4.  Sources of authority — primary text excerpts
5.  Religious responses — application to ethical dilemma
6.  Non-religious / secular view — humanist/utilitarian counterpoint
7.  Case study or contemporary issue
8.  Key thinkers — card grid (Aquinas, Mill, Bentham, etc.)
9.  Evaluation framework — strengths/weaknesses two-column
10. Common misconceptions about the faith
11. Key terms reference table
12. Exam technique — 12-mark "evaluate" question structure
`,
    domainPatterns: `
- Scripture/quote: italic in bordered box with full citation (book + chapter + verse)
- Cross-tradition comparisons: clear column headers per denomination/faith
- Frame "evaluate" answers with thesis + counter + reasoned conclusion
- Avoid generalisations — use named scholars and specific texts
- Cite real quotes — never paraphrase scripture without marking it as paraphrase
`,
    specAnchor: "AQA/Edexcel/OCR GCSE Religious Studies. Use named scholars, real scripture citations, balanced denominational coverage.",
  },

  sociology: {
    key: "sociology",
    label: "Sociology",
    palette: { darkBg: "2E1065", lightBg: "FAF5FF", accent1: "9333EA", accent2: "F59E0B", cardDark: "3F1380", cardBorder: "9333EA" },
    slideStructure: `
1.  Title — academic editorial feel, paradigm badges
2.  Key concept definition with example
3.  Theoretical perspectives — Functionalist / Marxist / Feminist / Interactionist comparison
4.  Key sociologists — name + study + key claim cards
5.  Empirical evidence — study card (researcher, year, sample, finding)
6.  Methods — strengths/weaknesses of methodological choice
7.  Application to contemporary society
8.  Synoptic links — across topics (family, education, crime, etc.)
9.  Critical evaluation — counter-arguments and limitations
10. Common misconceptions
11. Key thinkers reference table
12. Exam technique — 10/20/30-mark essay structure
`,
    domainPatterns: `
- Always cite a named sociologist for any claim (Durkheim, Marx, Parsons, Willis, Becker, etc.)
- Compare perspectives in side-by-side columns
- Empirical studies: include researcher, year, sample size, key finding
- Critical evaluation framing: "however..." "on the other hand..."
- 30-mark essays: PEEL paragraphs with theory + evidence + evaluation
`,
    specAnchor: "AQA/Edexcel/OCR/Eduqas GCSE/A-level Sociology. Named sociologists with real studies. Balanced theoretical perspectives.",
  },

  psychology: {
    key: "psychology",
    label: "Psychology",
    palette: { darkBg: "0C2E5E", lightBg: "F0F7FF", accent1: "1D4ED8", accent2: "06B6D4", cardDark: "0F3D7C", cardBorder: "1D4ED8" },
    slideStructure: `
1.  Title — clinical clean feel, approach badges
2.  Key concept definition with example
3.  Approaches — Cognitive / Biological / Behaviourist / Psychodynamic / Humanistic comparison
4.  Key studies — Milgram, Asch, Loftus, etc., as named cards
5.  Methodology — IV/DV/sample/results structure card
6.  Ethics — Gold / BPS guidelines callouts where relevant
7.  Theory worked example — applying to a real-world scenario
8.  Evaluation — strengths/weaknesses + counter-evidence
9.  Application to therapy or real life
10. Common misconceptions (e.g. correlation vs causation)
11. Key terms reference table (operationalisation, demand characteristics, etc.)
12. Exam technique — 8/12/16-mark essay structure
`,
    domainPatterns: `
- Studies must include researcher, year, IV, DV, sample, key finding
- IV/DV explicitly labelled in any methodology slide
- Ethical issues flagged where present (deception, consent, withdrawal)
- Counter-evidence: name the contradicting study
- Statistical claims: include p-value or effect size where relevant
`,
    specAnchor: "AQA/Edexcel GCSE/A-level Psychology. Named studies with real methodology. BPS ethics framework. Quantitative + qualitative balance.",
  },

  business: {
    key: "business",
    label: "Business Studies",
    palette: { darkBg: "0F172A", lightBg: "F8FAFC", accent1: "0EA5E9", accent2: "FACC15", cardDark: "1E293B", cardBorder: "0EA5E9" },
    slideStructure: `
1.  Title — corporate-clean feel, sector badges
2.  Key concept definition with real-company example
3.  Stakeholders — 6-card grid (owners, employees, customers, suppliers, gov, community)
4.  Calculation worked example — formula + substitution + answer
5.  Real case study — named company with year + facts + figures
6.  Internal vs external factors — two-column compare
7.  Decision tree / SWOT / PESTLE framework applied
8.  Financial data table — interpret a P&L or cash flow snippet
9.  Marketing / Operations / Finance / HR mini-strands
10. Common errors (margin vs markup, gross vs net, fixed vs variable)
11. Key formulas reference table
12. Exam technique — 9/12-mark analyse/evaluate structure
`,
    domainPatterns: `
- Always cite real companies for case studies (Apple, Tesco, Unilever, etc.)
- Calculations show formula → substitution → answer with units (% or £)
- Frameworks (SWOT, PESTLE, Boston Matrix, Ansoff) drawn as 2×2 grids with shapes
- Numbers always include units (£, %, units sold)
- Evaluation: justified judgement at the end
`,
    specAnchor: "AQA/Edexcel/OCR GCSE Business. Real companies, accurate formulas, justified evaluation in long-answer questions.",
  },

  drama: {
    key: "drama",
    label: "Drama",
    palette: { darkBg: "1F1147", lightBg: "FAF5FF", accent1: "DB2777", accent2: "F59E0B", cardDark: "2C175B", cardBorder: "DB2777" },
    slideStructure: `
1.  Title — stage-light dark bg, practitioner badges
2.  Practitioner study — Stanislavski / Brecht / Artaud / Berkoff / Frantic Assembly card
3.  Key techniques — physicalisation, status, ensemble, etc., as cards
4.  Set text scene analysis — extract in quote box + technique annotations
5.  Vocal & physical skills — checklist
6.  Devising stimulus — image/text/object as starting point
7.  Live theatre review — production card (company, venue, date, key scene)
8.  Role-on-the-wall / hot-seating / forum theatre activities
9.  Design elements — lighting / sound / set / costume per character
10. Common errors (describing vs analysing, plot summary vs effect)
11. Key terminology reference
12. Exam technique — Component 3 written paper structure
`,
    domainPatterns: `
- Practitioner names always bold + italicised on first use
- Live theatre: real venue, real production company, real date
- Quote boxes for extracts, with line numbers and character attribution
- Frame analysis as "the audience experiences X because of [technique]"
- Avoid plot summary — every point must analyse intention/effect
`,
    specAnchor: "AQA/Edexcel/OCR/Eduqas GCSE Drama. Named practitioners with techniques. Real live theatre productions cited.",
  },

  music: {
    key: "music",
    label: "Music",
    palette: { darkBg: "0E1424", lightBg: "F8F9FF", accent1: "EF4444", accent2: "F59E0B", cardDark: "1A2138", cardBorder: "EF4444" },
    slideStructure: `
1.  Title — stave-line decoration, set work badge
2.  Set work analysis — composer, year, genre, key facts
3.  Musical elements — Tempo / Dynamics / Pitch / Rhythm / Texture / Tonality cards
4.  Score extract — bars highlighted with technique annotation
5.  Performance technique cards (instrument-specific)
6.  Composition stimulus — chord progression or motif
7.  Genre/style context — historical/cultural background
8.  Listening identification — short audio cue references
9.  Comparative listening — two excerpts side-by-side
10. Common errors (describing what you hear vs analysing)
11. Key terminology reference
12. Exam technique — listening paper structure
`,
    domainPatterns: `
- Composer names with dates (Bach 1685–1750)
- Bar numbers cited for any score reference
- Chord names use standard notation (C, Am, G7, Dsus4)
- Tempo markings in Italian (Allegro, Andante) with bpm where relevant
- Frame as "the composer creates X effect by Y technique"
`,
    specAnchor: "AQA/Edexcel/Eduqas GCSE Music. Set works with bar numbers. Real-genre conventions. Composition tied to a brief.",
  },

  media: {
    key: "media",
    label: "Media Studies",
    palette: { darkBg: "0B0F1A", lightBg: "F1F5F9", accent1: "F472B6", accent2: "06B6D4", cardDark: "131A2D", cardBorder: "F472B6" },
    slideStructure: `
1.  Title — magazine-cover feel, set product badges
2.  Set product analysis — title, year, audience, ownership card
3.  Media language — Barthes / Todorov / Levi-Strauss / Propp theorist cards
4.  Representation — gender / ethnicity / age / class / region per product
5.  Audience theory — Hall / Blumler-Katz / Bandura applied
6.  Industry context — ownership, regulation, distribution
7.  Genre conventions cards
8.  Comparative analysis — two set products side-by-side
9.  Wider contexts — historical / political / social
10. Common errors (description vs analysis)
11. Key theorist reference table
12. Exam technique — Component 2 question types
`,
    domainPatterns: `
- Always cite a named theorist with their concept (Barthes — denotation/connotation)
- Set products: real titles, dates, audience demographics
- Use the Eduqas / OCR / AQA-prescribed set products only
- Frame as "the producer constructs X representation by Y choice"
- Reception theory: name the reading position (preferred / negotiated / oppositional)
`,
    specAnchor: "AQA/Eduqas/OCR GCSE Media. Set products from the spec. Named theorists with real concepts.",
  },

  design_technology: {
    key: "design_technology",
    label: "Design & Technology",
    palette: { darkBg: "0E1A2A", lightBg: "F0F7FF", accent1: "0284C7", accent2: "F97316", cardDark: "162B47", cardBorder: "0284C7" },
    slideStructure: `
1.  Title — workshop-feel dark bg, material category badges
2.  Materials — properties cards (timber, polymer, metal, textile, paper)
3.  Manufacturing process — step-by-step with shape diagrams
4.  Tools & equipment — health & safety callouts
5.  Iterative design — sketch → prototype → test cycle
6.  CAD/CAM context — software/process card
7.  Designer study — Dyson / Conran / Eames / Newson card
8.  Material costs / sustainability / 6 Rs framework
9.  Specification & user-centred design checklist
10. Common errors (describe vs evaluate, vague specifications)
11. Key terminology reference
12. Exam technique — written paper structure
`,
    domainPatterns: `
- Materials: include name, key property, typical use, cost band
- Manufacturing: numbered steps with safety considerations flagged
- Designer names with dates and signature product
- Sustainability: explicit 6 Rs (Reduce, Reuse, Recycle, Refuse, Repair, Rethink)
- CAD/CAM: name the software (Fusion 360, SolidWorks, TinkerCAD)
`,
    specAnchor: "AQA/Edexcel/OCR/Eduqas GCSE D&T. Real designers, accurate material properties, named tools and processes.",
  },

  pshe: {
    key: "pshe",
    label: "PSHE",
    palette: { darkBg: "164E63", lightBg: "F0FDFF", accent1: "0891B2", accent2: "FACC15", cardDark: "1F6082", cardBorder: "0891B2" },
    slideStructure: `
1.  Title — calm, supportive tone, theme badges (Health/Relationships/Living)
2.  Lesson aim — pupil-friendly objective
3.  Ground rules — confidentiality, respect, opt-out
4.  Concept introduction — definition + healthy/unhealthy contrast
5.  Real-life scenario / dilemma cards
6.  Skills practice — what to say / how to respond cards
7.  Discussion frame — sentence starters
8.  Where to go for help — named services with contact info
9.  Reflection — anonymous feedback or check-in
10. Common misconceptions (especially around stigma)
11. Key terminology reference
12. Exit ticket — one thing I'll do differently
`,
    domainPatterns: `
- Always include "where to go for help" — Childline, Samaritans, school safeguarding lead
- Avoid graphic detail — focus on skills and decision-making
- Sentence starters for sensitive discussion ("It's OK to feel..." "I think...")
- Anonymity options for any reflective question
- Clear opt-out language for sensitive topics
`,
    specAnchor: "DfE PSHE statutory guidance. Age-appropriate. Always signposts to support services.",
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
    // Phase 2 subject additions
    [/(spanish|español|vocabulario|conjugaci)/, "spanish"],
    [/(german|deutsch|grammatik|akkusativ|dativ)/, "german"],
    [/(modern foreign language|\bmfl\b|language learning)/, "mfl_generic"],
    [/(french|français|vocabulaire|grammaire|conjugaison)/, "french"],
    [/(religious studies|\brs\b|religion|christian|islam|jud|hindu|buddh|sikh|theolog)/, "religious_studies"],
    [/(sociolog|durkheim|marx(ism)?|functionalism|interactionism|feminism)/, "sociology"],
    [/(psycholog|cognitive|behaviou?ral|milgram|asch|loftus|freud|piaget)/, "psychology"],
    [/(business|economics|marketing|enterprise|finance|stakeholder)/, "business"],
    [/(drama|theatre|theater|stanislavski|brecht|playwright|stage)/, "drama"],
    [/(\bmusic\b|composer|melody|harmony|rhythm|tonality|score|stave)/, "music"],
    [/(media studies|representation|audience theory|barthes|todorov)/, "media"],
    [/(design technology|\bdt\b|workshop|cad|cam|materials|polymer|timber)/, "design_technology"],
    [/(pshe|relationships education|wellbeing|mental health lesson|drugs lesson)/, "pshe"],
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


// ────────────────────────────────────────────────────────────────────────────
// Pillar A — 6-mark Levelled Open-Response (LOR) block (FEAT-PA-002)
// ────────────────────────────────────────────────────────────────────────────
//
// AQA / Edexcel / OCR Science 6-mark LOR has a specific Level 1 (1–2m basic) /
// Level 2 (3–4m linked) / Level 3 (5–6m evaluative) format with indicative-
// content bullets. Humanities + English follow the same three-band shape but
// with subject-specific assessment objectives and indicative content.
//
// buildLorBlock returns a prompt fragment the worksheet generator injects
// once per Y10/Y11 sheet for biology/chemistry/physics/history/geography/
// English. The model is told to emit:
//   - one 3-line stem with an explicit "linking words required" cue
//   - exactly 6 marks
//   - a teacher-key 3-band level grid with indicative content per level

/** Maps a subject string onto the LOR persona used in the prompt. */
function lorSubjectFamily(subject: string | undefined): "science" | "history" | "geography" | "english" | "rs" | "other" {
  const s = (subject || "").toLowerCase();
  if (s.includes("biology") || s.includes("chemistry") || s.includes("physics") || s.includes("science")) return "science";
  if (s.includes("history")) return "history";
  if (s.includes("geograph")) return "geography";
  if (s.includes("english")) return "english";
  if (s.includes("religious") || /\brs\b/.test(s)) return "rs";
  return "other";
}

/** Subject-specific level-grid descriptors for 6-mark LOR. */
const LOR_LEVEL_DESCRIPTORS: Record<
  "science" | "history" | "geography" | "english" | "rs" | "other",
  { level1: string; level2: string; level3: string; ao: string }
> = {
  science: {
    level1: "Basic — 1–2 marks. Simple statements, no linking. Some relevant points but not developed.",
    level2: "Clear — 3–4 marks. Linked points using scientific vocabulary. Cause-and-effect described.",
    level3: "Detailed — 5–6 marks. Logical, evaluative answer. Uses key terms accurately, links cause to effect, draws an evidence-based conclusion.",
    ao: "AO1 (recall) + AO2 (apply) + AO3 (analyse / evaluate)",
  },
  history: {
    level1: "Basic — 1–2 marks. Single point with little support; little awareness of context.",
    level2: "Developed — 3–4 marks. Two or more points with relevant detail and linking phrases. Some judgement implied.",
    level3: "Sustained — 5–6 marks. Coherent argument with specific evidence (dates, names, places). Reaches a clear, supported judgement on the question.",
    ao: "AO1 (knowledge) + AO2 (concepts) + AO3/AO4 (evidence + interpretation)",
  },
  geography: {
    level1: "Basic — 1–2 marks. Simple description, vague locations, minimal use of geographical terminology.",
    level2: "Clear — 3–4 marks. Specific examples and place names. Some explanation of processes; identifies links between cause and effect.",
    level3: "Detailed — 5–6 marks. Sustained explanation using a named case study. Explicit links between physical and human processes; reasoned conclusion.",
    ao: "AO1 (knowledge) + AO2 (understanding) + AO3 (application) + AO4 (skills)",
  },
  english: {
    level1: "Basic — 1–2 marks. Simple references to the text. Generalisations; little use of subject terminology.",
    level2: "Clear — 3–4 marks. Relevant references and quotations. Some analysis of writer's methods and effects.",
    level3: "Detailed — 5–6 marks. Perceptive analysis of writer's methods. Judicious choice of references; sustained personal response.",
    ao: "AO1 (read + interpret) + AO2 (analyse language) + AO3 (context where required)",
  },
  rs: {
    level1: "Basic — 1–2 marks. One viewpoint with limited reasoning.",
    level2: "Developed — 3–4 marks. Two viewpoints with reasoning and religious teaching reference.",
    level3: "Detailed — 5–6 marks. Balanced argument with religious + non-religious viewpoints, reasoned judgement and supporting evidence.",
    ao: "AO1 (knowledge) + AO2 (evaluation)",
  },
  other: {
    level1: "Basic — 1–2 marks. Simple, unlinked points with limited specialist vocabulary.",
    level2: "Clear — 3–4 marks. Linked points with relevant evidence and specialist vocabulary.",
    level3: "Detailed — 5–6 marks. Sustained, evaluative response with clear conclusion.",
    ao: "AO1 + AO2 + AO3",
  },
};

/** Subject-family-specific stem/linking-word guidance. */
function lorStemHint(family: keyof typeof LOR_LEVEL_DESCRIPTORS, topic: string): string {
  switch (family) {
    case "science":
      return `Write a 3-line scenario about "${topic}" then ask: "Explain how [concept from the scenario] affects [outcome]. Use linking words such as because, therefore and as a result. [6 marks]"`;
    case "history":
      return `Provide a 3-line source / context paragraph related to "${topic}" then ask: "How far do you agree that [interpretation about ${topic}]? Explain your answer using your knowledge of the period. [6 marks]"`;
    case "geography":
      return `Provide a 3-line scenario / case-study reference for "${topic}" then ask: "Assess the [physical or human] impact of ${topic}. Use a named case study to support your answer. [6 marks]"`;
    case "english":
      return `Provide a 3-line stimulus extract or quotation linked to "${topic}" then ask: "Analyse how the writer presents [theme or character] in the extract. Refer to language and structure. [6 marks]"`;
    case "rs":
      return `Provide a 3-line ethical scenario about "${topic}" then ask: "Evaluate the statement: \\"[viewpoint about ${topic}]\\". Refer to religious and non-religious arguments in your answer. [6 marks]"`;
    default:
      return `Provide a 3-line stimulus paragraph about "${topic}" then ask the student to evaluate / analyse / explain a related claim using linking words. [6 marks]`;
  }
}

export interface BuildLorBlockOptions {
  subject: string;
  topic: string;
  /** Optional exam-board hint (AQA / Edexcel / OCR / WJEC). */
  board?: string;
}

/**
 * Returns a prompt fragment that forces exactly one 6-mark Levelled Open
 * Response question into the worksheet, with a 3-band level grid in the
 * teacher key. Returns "" for non-LOR subjects.
 */
export function buildLorBlock({ subject, topic, board }: BuildLorBlockOptions): string {
  const family = lorSubjectFamily(subject);
  if (family === "other") return "";

  const desc = LOR_LEVEL_DESCRIPTORS[family];
  const stemHint = lorStemHint(family, topic);
  const boardLine = board && board !== "none" ? `Board: ${board}.` : "";

  return [
    `### Pillar A — Six-mark Levelled Open Response (LOR) — REQUIRED`,
    `${boardLine} Subject family: ${family}. Topic: ${topic}.`,
    `Include EXACTLY ONE 6-mark extended-answer question in the Application section (Section 3).`,
    `Stem requirement: ${stemHint}`,
    `Mark scheme requirement: include a teacher-key Level 1 / Level 2 / Level 3 grid using these descriptors verbatim:`,
    `- Level 1 (1–2 marks): ${desc.level1}`,
    `- Level 2 (3–4 marks): ${desc.level2}`,
    `- Level 3 (5–6 marks): ${desc.level3}`,
    `AO mapping for the LOR: ${desc.ao}.`,
    `Indicative content: list 4–6 specific bullet points the student is expected to mention (real facts, named examples, formulae or quotes — never placeholders).`,
    `Tag the section with type "extended-answer", marks 6, ao "AO3" and levelDescriptor "Level 3".`,
  ].join("\n");
}

// ────────────────────────────────────────────────────────────────────────────
// Pillar A — Subject-specific exam-paper templates (FEAT-PA-004)
// ────────────────────────────────────────────────────────────────────────────
//
// Real GCSE papers don't use a generic Recall / Understanding / Application /
// Challenge template. AQA English Lang Paper 1 is 1m identify → 4m language →
// 8m structure → 12m evaluate → 40m write. AQA History is Source A vs B +
// "How far…" 16m. AQA Geography is case study + 9-mark AO3/AO4.
//
// getExamPaperTemplate returns a typed sequence of question slots. ai.ts
// dispatches to this template (instead of the generic 1/2/3-section
// template) when examStyle:true and yearGroup ≥ 10.

export type ExamPaperLayoutFamily =
  | "short-answer"
  | "extended-answer"
  | "essay"
  | "source-comparison"
  | "case-study"
  | "fieldwork-data"
  | "language-analysis"
  | "structure-analysis"
  | "evaluation"
  | "creative-writing"
  | "calc"
  | "mcq";

export interface ExamPaperSlot {
  /** 1-based question number on the paper. */
  qNum: number;
  /** Layout family for the planner / renderer to dispatch on. */
  layoutFamily: ExamPaperLayoutFamily;
  /** Total marks for the question. */
  marks: number;
  /** Assessment Objective (AO1/AO2/AO3/AO4). */
  ao: "AO1" | "AO2" | "AO3" | "AO4";
  /** Canonical command word for the slot. */
  commandWord: string;
  /** Format hint shown in the prompt to anchor the LLM (e.g. "1m identify"). */
  format: string;
}

export interface GetExamPaperTemplateOptions {
  subject: string;
  yearGroup: string;
  paper: "P1" | "P2" | "P3";
  board?: string;
}

/** Lower-cased subject + paper key used as the template lookup. */
function templateKey(subject: string, paper: "P1" | "P2" | "P3", board?: string): string {
  const subj = (subject || "").toLowerCase();
  const b = (board || "aqa").toLowerCase();
  let family = "other";
  if (subj.includes("english")) {
    if (subj.includes("lit")) family = "english_lit";
    else family = "english_lang";
  } else if (subj.includes("history")) family = "history";
  else if (subj.includes("geograph")) family = "geography";
  else if (subj.includes("biology")) family = "biology";
  else if (subj.includes("chemistry")) family = "chemistry";
  else if (subj.includes("physics")) family = "physics";
  else if (subj.includes("science")) family = "science";
  else if (subj.includes("math")) family = "mathematics";
  return `${b}:${family}:${paper}`;
}

const EXAM_PAPER_TEMPLATES: Record<string, ExamPaperSlot[]> = {
  // ── AQA English Language Paper 1 — Explorations in Creative Reading & Writing
  // Reference: 1m identify → 4m language → 8m structure → 12m evaluate → 40m write.
  "aqa:english_lang:P1": [
    { qNum: 1, layoutFamily: "short-answer", marks: 1, ao: "AO1", commandWord: "Identify",   format: "List 4 things from the source about [topic]. (4 x 1 mark = 4)" },
    { qNum: 2, layoutFamily: "language-analysis",  marks: 8, ao: "AO2", commandWord: "Analyse",    format: "Comment on language — how the writer uses words / phrases / techniques. [8 marks]" },
    { qNum: 3, layoutFamily: "structure-analysis", marks: 8, ao: "AO2", commandWord: "Analyse",    format: "Comment on structure — beginning / middle / end + shifts in focus. [8 marks]" },
    { qNum: 4, layoutFamily: "evaluation",         marks: 20, ao: "AO4", commandWord: "Evaluate", format: "To what extent do you agree with [statement about source]? Use the whole source. [20 marks]" },
    { qNum: 5, layoutFamily: "creative-writing",   marks: 40, ao: "AO3", commandWord: "Describe / Narrate", format: "Either describe the scene shown OR write a story suggested by the title [...]. [24 + 16 marks]" },
  ],

  // ── AQA English Language Paper 2 — Writers' Viewpoints & Perspectives
  "aqa:english_lang:P2": [
    { qNum: 1, layoutFamily: "short-answer",       marks: 4, ao: "AO1", commandWord: "Identify", format: "Choose the four statements that are TRUE about Source A. [4 marks]" },
    { qNum: 2, layoutFamily: "source-comparison",  marks: 8, ao: "AO1", commandWord: "Summarise", format: "Use details from BOTH Source A and Source B. Summarise the differences. [8 marks]" },
    { qNum: 3, layoutFamily: "language-analysis",  marks: 12, ao: "AO2", commandWord: "Analyse",  format: "How does the writer of Source B use language to [effect]? [12 marks]" },
    { qNum: 4, layoutFamily: "evaluation",         marks: 16, ao: "AO3", commandWord: "Compare",  format: "Compare how the two writers convey their different attitudes to [topic]. [16 marks]" },
    { qNum: 5, layoutFamily: "creative-writing",   marks: 40, ao: "AO4", commandWord: "Write",   format: "Write an article / letter / leaflet on [topic]. AQA spec maps this slot to AO5 (content/organisation) + AO6 (technical accuracy). [24 + 16 marks]" },
  ],

  // ── AQA History — Paper 1 (Period Study + Wider World Depth)
  "aqa:history:P1": [
    { qNum: 1, layoutFamily: "source-comparison", marks: 4,  ao: "AO3", commandWord: "Describe",  format: "Source A: describe the message of the source. [4 marks]" },
    { qNum: 2, layoutFamily: "extended-answer",   marks: 8,  ao: "AO1", commandWord: "Explain",   format: "Explain two consequences of [event]. [4 + 4 = 8 marks]" },
    { qNum: 3, layoutFamily: "essay",             marks: 8,  ao: "AO2", commandWord: "Account for", format: "Write an account of how [event] affected [group]. [8 marks]" },
    { qNum: 4, layoutFamily: "essay",             marks: 16, ao: "AO2", commandWord: "How far",   format: "How far do you agree with this statement about [topic]? Explain your answer. [16 + 4 SPaG]" },
  ],

  // ── AQA History — Paper 2 (British Depth + Thematic)
  "aqa:history:P2": [
    { qNum: 1, layoutFamily: "source-comparison", marks: 4,  ao: "AO3", commandWord: "Identify",   format: "Source A: how useful is the source for studying [topic]? [4 marks]" },
    { qNum: 2, layoutFamily: "source-comparison", marks: 8,  ao: "AO3", commandWord: "Compare",    format: "Compare Source A and Source B as evidence about [topic]. [8 marks]" },
    { qNum: 3, layoutFamily: "essay",             marks: 8,  ao: "AO1", commandWord: "Explain",    format: "Explain the significance of [individual / event]. [8 marks]" },
    { qNum: 4, layoutFamily: "essay",             marks: 16, ao: "AO2", commandWord: "How far",    format: "Has [factor] been the main reason for [change]? Explain your answer. [16 + 4 SPaG]" },
  ],

  // ── AQA Geography — Paper 1 (Living with the Physical Environment)
  "aqa:geography:P1": [
    { qNum: 1, layoutFamily: "mcq",            marks: 1, ao: "AO1", commandWord: "Identify",  format: "MCQ identifying a physical process. [1 mark]" },
    { qNum: 2, layoutFamily: "short-answer",   marks: 2, ao: "AO1", commandWord: "Define",    format: "Define [physical geography term]. [2 marks]" },
    { qNum: 3, layoutFamily: "fieldwork-data", marks: 4, ao: "AO4", commandWord: "Calculate", format: "Use Figure 1 (data table / graph) to calculate / describe a trend. [4 marks]" },
    { qNum: 4, layoutFamily: "extended-answer", marks: 6, ao: "AO2", commandWord: "Explain",  format: "Explain how [physical process] affects [landform / hazard]. [6 marks]" },
    { qNum: 5, layoutFamily: "case-study",     marks: 9, ao: "AO3", commandWord: "Assess",    format: "Using a named case study, assess [physical impact]. [9 + 3 SPaG]" },
  ],

  // ── AQA Geography — Paper 2 (Challenges in the Human Environment)
  "aqa:geography:P2": [
    { qNum: 1, layoutFamily: "mcq",            marks: 1, ao: "AO1", commandWord: "Identify",  format: "MCQ identifying a human-environment fact. [1 mark]" },
    { qNum: 2, layoutFamily: "fieldwork-data", marks: 3, ao: "AO4", commandWord: "Describe",  format: "Use Figure 2 to describe the pattern shown. [3 marks]" },
    { qNum: 3, layoutFamily: "extended-answer", marks: 6, ao: "AO2", commandWord: "Suggest",  format: "Suggest reasons for [human-geography pattern]. [6 marks]" },
    { qNum: 4, layoutFamily: "case-study",     marks: 9, ao: "AO3", commandWord: "Evaluate",  format: "Using a named case study, evaluate management strategies for [topic]. [9 marks]" },
  ],

  // ── AQA Biology — Paper 1
  "aqa:biology:P1": [
    { qNum: 1, layoutFamily: "mcq",             marks: 4,  ao: "AO1", commandWord: "Tick",      format: "Multiple-choice on [topic]. (4 x 1 mark)" },
    { qNum: 2, layoutFamily: "short-answer",    marks: 4,  ao: "AO1", commandWord: "Describe",  format: "Describe the structure / process of [topic]. [4 marks]" },
    { qNum: 3, layoutFamily: "fieldwork-data",  marks: 4,  ao: "AO4", commandWord: "Calculate", format: "Use the data table to calculate [quantity]. Show your working. [4 marks]" },
    { qNum: 4, layoutFamily: "extended-answer", marks: 6,  ao: "AO3", commandWord: "Explain",   format: "Required practical: explain how [variable] affects [outcome]. [6 marks LOR with Level 1/2/3]" },
  ],

  // ── AQA Chemistry — Paper 1
  "aqa:chemistry:P1": [
    { qNum: 1, layoutFamily: "mcq",             marks: 4,  ao: "AO1", commandWord: "Tick",      format: "Multiple-choice on [topic]. (4 x 1 mark)" },
    { qNum: 2, layoutFamily: "short-answer",    marks: 4,  ao: "AO2", commandWord: "Calculate", format: "Balance the equation / calculate moles / Mr. [4 marks]" },
    { qNum: 3, layoutFamily: "fieldwork-data",  marks: 4,  ao: "AO4", commandWord: "Plot",      format: "Plot the data on the grid and draw a line of best fit. [4 marks]" },
    { qNum: 4, layoutFamily: "extended-answer", marks: 6,  ao: "AO3", commandWord: "Explain",   format: "Required practical: explain how [reactant] affects [outcome]. [6 marks LOR with Level 1/2/3]" },
  ],

  // ── AQA Physics — Paper 1
  "aqa:physics:P1": [
    { qNum: 1, layoutFamily: "mcq",             marks: 4,  ao: "AO1", commandWord: "Tick",      format: "Multiple-choice on [topic]. (4 x 1 mark)" },
    { qNum: 2, layoutFamily: "calc",            marks: 4,  ao: "AO2", commandWord: "Calculate", format: "Use the equation [F = ma / E = mcΔθ / V = IR] to calculate [quantity]. [4 marks]" },
    { qNum: 3, layoutFamily: "fieldwork-data",  marks: 4,  ao: "AO4", commandWord: "Plot",      format: "Plot the data and describe the relationship. [4 marks]" },
    { qNum: 4, layoutFamily: "extended-answer", marks: 6,  ao: "AO3", commandWord: "Explain",   format: "Required practical: evaluate the effect of [variable] on [outcome]. [6 marks LOR with Level 1/2/3]" },
  ],

  // ── AQA Maths — Paper 1 (Non-Calculator)
  "aqa:mathematics:P1": [
    { qNum: 1, layoutFamily: "calc",  marks: 1, ao: "AO1", commandWord: "Work out",  format: "Number — non-calc fluency. [1 mark]" },
    { qNum: 2, layoutFamily: "calc",  marks: 3, ao: "AO1", commandWord: "Calculate", format: "Number / fractions — non-calc, must show working. [3 marks]" },
    { qNum: 3, layoutFamily: "calc",  marks: 4, ao: "AO2", commandWord: "Solve",     format: "Algebra — solve linear equation / expand brackets. [4 marks]" },
    { qNum: 4, layoutFamily: "calc",  marks: 4, ao: "AO2", commandWord: "Show",      format: "Reasoning — show that [statement] is true. [4 marks]" },
    { qNum: 5, layoutFamily: "extended-answer", marks: 5, ao: "AO3", commandWord: "Prove",       format: "Problem-solving — multi-step real-world context. [5 marks, no calculator]" },
  ],

  // ── AQA Maths — Paper 2 (Calculator)
  "aqa:mathematics:P2": [
    { qNum: 1, layoutFamily: "calc",  marks: 2, ao: "AO1", commandWord: "Calculate", format: "Calculator fluency — % / interest / standard form. [2 marks]" },
    { qNum: 2, layoutFamily: "calc",  marks: 3, ao: "AO2", commandWord: "Calculate", format: "Geometry — Pythagoras / trig / area. [3 marks]" },
    { qNum: 3, layoutFamily: "calc",  marks: 4, ao: "AO2", commandWord: "Calculate", format: "Statistics — mean / median / range from a table. [4 marks]" },
    { qNum: 4, layoutFamily: "extended-answer", marks: 5, ao: "AO3", commandWord: "Justify", format: "Problem-solving — calculator question with context. [5 marks]" },
  ],
};

/**
 * Returns the canonical question sequence for the requested
 * (subject, paper, board) combination. Falls back to a generic Y10/Y11
 * 1m → 3m → 6m → 9m sequence when no specific template exists.
 */
export function getExamPaperTemplate(opts: GetExamPaperTemplateOptions): ExamPaperSlot[] {
  const yearNum = parseInt((opts.yearGroup || "").replace(/[^0-9]/g, ""), 10) || 0;
  if (yearNum < 9) return [];

  const key = templateKey(opts.subject, opts.paper, opts.board);
  const direct = EXAM_PAPER_TEMPLATES[key];
  if (direct) return direct;

  // Try without board (fall back from "edexcel:..." → "aqa:...").
  const subjectKey = key.split(":").slice(1).join(":");
  for (const board of ["aqa", "edexcel", "ocr", "wjec"]) {
    const candidate = EXAM_PAPER_TEMPLATES[`${board}:${subjectKey}`];
    if (candidate) return candidate;
  }

  // Generic fallback — always returns a sensible 4-slot Y10/Y11 sequence.
  return [
    { qNum: 1, layoutFamily: "short-answer",    marks: 1, ao: "AO1", commandWord: "Identify", format: "Recall / definition. [1 mark]" },
    { qNum: 2, layoutFamily: "short-answer",    marks: 3, ao: "AO1", commandWord: "Describe", format: "Apply key knowledge. [3 marks]" },
    { qNum: 3, layoutFamily: "extended-answer", marks: 6, ao: "AO3", commandWord: "Explain",  format: "6-mark LOR with Level 1/2/3 grid." },
    { qNum: 4, layoutFamily: "extended-answer", marks: 9, ao: "AO3", commandWord: "Evaluate", format: "Sustained extended response. [9 marks]" },
  ];
}

/**
 * Builds a prompt fragment that lists the chosen template's question slots
 * so the LLM emits a real exam-paper structure instead of the generic
 * Section 1/2/3 template. Returns "" if no template is available.
 */
export function buildExamPaperTemplateBlock(opts: GetExamPaperTemplateOptions): string {
  const slots = getExamPaperTemplate(opts);
  if (slots.length === 0) return "";
  const subjectFamily = templateKey(opts.subject, opts.paper, opts.board).split(":")[1];
  const lines = slots.map(s =>
    `Q${s.qNum}: layoutFamily=${s.layoutFamily}, marks=${s.marks}, ao=${s.ao}, commandWord=${s.commandWord}. Format: ${s.format}`,
  );
  const totalMarks = slots.reduce((acc, s) => acc + s.marks, 0);
  return [
    `### Pillar A — Exam-paper template — REQUIRED`,
    `Board: ${opts.board || "AQA"}. Subject: ${subjectFamily}. Paper: ${opts.paper}. Year: ${opts.yearGroup}.`,
    `Use this question sequence VERBATIM in question count, marks, AO and command word. Do NOT use the generic Section 1/2/3 template.`,
    ...lines,
    `Total target marks: ${totalMarks}. Stamp metadata.examPaperTemplate = "${templateKey(opts.subject, opts.paper, opts.board)}".`,
  ].join("\n");
}
