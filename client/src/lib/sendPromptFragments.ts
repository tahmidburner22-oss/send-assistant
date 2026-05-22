/**
 * sendPromptFragments.ts
 *
 * Single source of truth for the per-SEND-need prompt fragments used by
 * BOTH the worksheet generator (client/src/lib/ai.ts) and the presentation
 * generator (client/src/pages/tools/PresentationMaker.tsx).
 *
 * Each fragment is the faithful translation of the 5 bullets in
 * `send-data.ts → sendNeeds[].worksheetChanges.changes`. If the
 * pedagogical spec ever changes in send-data.ts, update here — ai.ts and
 * PresentationMaker.tsx will pick it up for free.
 *
 * We also export:
 *   - getSendAdhdSectionTitles(): canonical Section A/B/Challenge titles
 *     used by ADHD worksheets, so the overlay engine and the client
 *     generator do not disagree on what the sections are called.
 *   - getSendNoteForWorksheet(): the block that ai.ts injects into its
 *     system prompt.
 *   - getSendNoteForPresentation(): the presentation-shaped version of
 *     the same fragment (slide-level verbs, no "Section A" references,
 *     scoped to how a deck is structured instead of a page).
 *
 * Why two shapes?
 * - Worksheets are page-based: sections A/B, challenge, reflection.
 * - Presentations are slide-based: warm-up slide, content slides, check,
 *   exit-ticket. The same pedagogy translates but the anchors differ.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SendAdaptationBullet {
  /** Exact wording from send-data.ts `what` field. */
  what: string;
  /** Why this adaptation, used in teacher notes. */
  why: string;
}

export interface SendAdaptationSpec {
  id: string;
  /** Matches send-data.ts name. */
  name: string;
  /** 5-ish concrete bullets the generator must honour. */
  bullets: SendAdaptationBullet[];
  /** Sentence the LLM must echo in the worksheet prompt. One imperative line per bullet. */
  worksheetRules: string[];
  /**
   * Phase 4 — content-level adaptations. Imperatives that change the SUBSTANCE
   * of the questions: concept progression, context choice, vocabulary, cognitive
   * demand, misconception scaffolding. Distinct from `worksheetRules` which are
   * mostly presentation pedagogy (layout, font, spacing, visible scaffolds).
   * Both arrays are rendered to the AI as separate labelled blocks by
   * `getSendNoteForWorksheet`. Curriculum rigour is unchanged — these rules
   * adapt HOW concepts are approached, not the year-group level.
   */
  worksheetRulesContent: string[];
  /** Slide-shaped rules for the presentation generator. */
  presentationRules: string[];
}

// ─── Canonical section titles ────────────────────────────────────────────────

/**
 * Returns Section A/B/Challenge titles that the client worksheet prompt,
 * the server overlay engine, and the ADHD enforcer all agree on.
 *
 * Ensuring one function owns these strings prevents the classic bug where
 * the overlay engine looks for "Section A — Quick Start" while the
 * generator emits "Section A: Quick Start" and the cap never triggers.
 */
export function getSendSectionTitles(sendNeed?: string | null): {
  sectionA: string;
  sectionB: string;
  challenge: string;
} {
  const sn = (sendNeed || "").toLowerCase();
  if (sn.includes("anxiety") || sn.includes("semh") || sn.includes("mental"))
    return {
      sectionA: "Section A — Warm-Up — no pressure!",
      sectionB: "Section B — Main Practice — you've got this!",
      challenge: "OPTIONAL BONUS — only if you want to!",
    };
  if (sn.includes("pda") || sn.includes("odd"))
    return {
      sectionA: "Explore — choose where to start",
      sectionB: "Investigate",
      challenge: "Secret Mission — if you choose to accept it",
    };
  if (sn.includes("adhd"))
    return {
      sectionA: "Section A — Quick Start",
      sectionB: "Section B — Main Practice",
      challenge: "BONUS — only if you want to!",
    };
  return {
    sectionA: "Section A — Guided Practice",
    sectionB: "Section B — Core Practice",
    challenge: "Challenge Question",
  };
}

// ─── The spec table ──────────────────────────────────────────────────────────
// Keep this aligned to client/src/lib/send-data.ts → sendNeeds[].worksheetChanges.
// One change per bullet. ai.ts no longer owns these — it reads from here.

const SEND_ADAPTATION_SPECS: SendAdaptationSpec[] = [
  {
    id: "adhd",
    name: "ADHD",
    bullets: [
      { what: "Tick checkbox next to every question for visible progress tracking",
        why: "Visible progress markers provide dopamine feedback that sustains motivation." },
      { what: "Maximum 3 questions in Section A, 5 in Section B",
        why: "Shorter chunks let the student complete a section before focus lapses." },
      { what: "'BRAIN BREAK — stand up and stretch!' prompt midway through Section B",
        why: "Movement breaks restore attention capacity (Pontifex et al., 2013)." },
      { what: "Varied question types: calculation, fill-in, matching, true/false",
        why: "Novelty sustains attention; varying format prevents habituation." },
      { what: "Action word bolded in every instruction (e.g. 'Calculate the area')",
        why: "Bolding the key instruction word helps the student identify what to do." },
    ],
    worksheetRules: [
      "Start EVERY question content string with '[ ] ' (open square-bracket, space, close square-bracket, space) so the student can physically tick each question.",
      "HARD CAP: Section A = exactly 3 questions. Section B = exactly 5 questions. Do not exceed these. Do not add extra items to a section.",
      "Across the worksheet use varied question types: include at least one calculation, one fill-in / cloze, one matching, and one true/false. No two adjacent questions may use the same format.",
      "Bold the ACTION VERB at the start of every question (e.g. **Calculate** the area, **Identify** the correct label, **Explain** why). Use markdown **bold**.",
      "After the middle question of Section B (e.g. after Q3 of 5), insert a dedicated line on its own: '🧠 BRAIN BREAK — stand up and stretch for 30 seconds before continuing!'",
      "Label the challenge 'BONUS — only if you want to!'. Reflection ends with: 'How focused were you today? 1 / 2 / 3 / 4 / 5'.",
      "Worked example: maximum 5 numbered steps. Numbered bullet points only — no embedded instructions.",
    ],
    worksheetRulesContent: [
      "Pull each section's contexts from a high-novelty real-world domain (current cultural references, sport, gaming, music) — never abstract 'consider a number n'. Novelty is the engagement lever for ADHD, not just bolding.",
      "Frontload Section A with one spaced-recall question on a previously-taught skill the pupil already mastered, before the new-skill questions begin. The pupil starts with a confident win, which sustains attention into the harder items.",
      "Each consecutive question must change at least one cognitive demand from the previous one (the operation, the representation, OR the context). Never test the same micro-skill in the same way twice in a row — habituation kills attention.",
      "When stretch is used, embed it as the surface dressing on a familiar skill rather than a new method on top — ADHD pupils can carry the new context but lose focus across two new things at once.",
    ],
    presentationRules: [
      "Every activity / check slide shows a visible '[ ] Done' checkbox next to each instruction so the pupil can track progress.",
      "Every content slide: maximum 3 bullets. Every bullet maximum 8 words.",
      "Bold the ACTION VERB at the start of every instruction ('**Calculate** …', '**Match** …').",
      "Insert one 'Brain Break' slide roughly mid-deck: title 'BRAIN BREAK', body 'Stand up and stretch for 30 seconds', no other content.",
      "Vary slide types — no two adjacent content slides may use the same layout or question format.",
      "Challenge / extension slides labelled 'BONUS — only if you want to!'.",
    ],
  },
  {
    id: "dyslexia",
    name: "Dyslexia",
    bullets: [
      { what: "Every question limited to one sentence (max 12 words)",
        why: "Shorter sentences reduce decoding load so the student focuses on the subject." },
      { what: "Bold on every key term at first use",
        why: "Visual emphasis compensates for slower decoding speed." },
      { what: "Sentence starters and answer frames in Section A",
        why: "Frames reduce the writing barrier so knowledge can be demonstrated." },
      { what: "Step-by-step method box immediately before Section A",
        why: "Visible reference supports working-memory difficulties." },
      { what: "1.5 line spacing and generous white space throughout",
        why: "BDA guidelines: increased spacing reduces visual crowding." },
    ],
    worksheetRules: [
      "Every question is ONE sentence, maximum 12 words.",
      "Bold every key subject term at its first use (use markdown **bold**). Do NOT use italics or underlining for emphasis.",
      "In Section A, every question must include a sentence starter or an answer frame (e.g. 'The answer is ___ because ___').",
      "Insert a 'Step-by-step method' box IMMEDIATELY before Section A showing the canonical method as numbered steps.",
      "Use generous line spacing (equivalent to 1.5x) and leave clear vertical white space between every question.",
      "Include a Word Bank at the top of each section (4–6 terms + plain-English definitions).",
      "Reflection uses tick-box 'I can …' statements, not open writing.",
    ],
    worksheetRulesContent: [
      "Introduce every new key term with a phoneme breakdown alongside the definition (e.g. 'photosynthesis = pho-to-syn-the-sis') so the pupil can decode the word before reasoning about it.",
      "Present every new concept first via a labelled diagram or worked image, THEN in text. On a first encounter with a topic the visual is the primary route to meaning; the text is the second route.",
      "Use high-frequency everyday vocabulary in question stems. Reserve technical vocabulary for the specific subject term being assessed and gloss it inline on first use. Never use a polysyllabic everyday word where a short one will do.",
      "Avoid homophone-rich question stems where possible (e.g. 'their/there/they're', 'too/two/to', 'effect/affect') — when the topic forces them, gloss the relevant homophone inline at first use.",
    ],
    presentationRules: [
      "Every slide: sentences max 12 words. Bullets max 8 words.",
      "Bold every key subject term at first use. No italics, no ALL CAPS.",
      "Activity slides include a sentence starter or answer frame the pupil can copy.",
      "Include a dedicated 'Method steps' slide before the first practice slide.",
      "Use generous padding and 1.5× line spacing on every slide. Never fill a slide edge-to-edge with text.",
      "Key-terms slide placed early in the deck and referenced from later slides.",
    ],
  },
  {
    id: "dyscalculia",
    name: "Dyscalculia",
    bullets: [
      { what: "Every Section A question split into sub-steps: 'Step 1: ___ Step 2: ___ Step 3: ___'",
        why: "Sub-steps externalise the process for working memory." },
      { what: "Number line or place value chart reference included",
        why: "Visible reference compensates for impaired mental number line." },
      { what: "Every arithmetic step shown in worked example with 'why' annotation",
        why: "Annotating why each step is done builds conceptual understanding." },
      { what: "Key Facts box at top of Section B (multiplication facts, formulas)",
        why: "Removes the retrieval barrier so reasoning can be demonstrated." },
      { what: "Real-world contexts for all word problems",
        why: "Concrete-pictorial-abstract: concrete contexts make abstract numbers meaningful." },
    ],
    worksheetRules: [
      "Split every Section A question into explicit sub-steps with blanks: 'Step 1: ___ Step 2: ___ Step 3: ___ Answer: ___'.",
      "Include a reference number line OR place value chart immediately before Section A (as a [[DIAGRAM:number-line …]] or [[DIAGRAM:place-value …]] block).",
      "In the worked example, annotate every arithmetic step with a one-line 'why' explanation in plain English.",
      "Place a 'Key Facts' box at the top of Section B with the multiplication facts, formulas and number bonds needed for the questions.",
      "Every word problem uses a real-world context (shopping, cooking, travel, sports) — never abstract 'a number'.",
      "Use small whole numbers (1–20) in Section A. No timed pressure language.",
      "Reflection uses a tick-box 'Great / OK / Struggling' scale.",
    ],
    worksheetRulesContent: [
      "Introduce every new method with small whole numbers (≤ 12) in the first practice question before scaling to the full year-group range. Section A is small numbers; Section B is the year-group range; the challenge may use the full range.",
      "Every concept follows Concrete → Pictorial → Abstract within Section A: Q1 uses real objects or counters, Q2 uses a diagram, Q3 uses the symbolic form. The pupil meets the same idea three times before symbolic-only practice.",
      "Add an explicit estimation step ('Roughly, what answer do you expect?') before exact calculation in every multi-mark question. Externalises the number-sense check the dyscalculic pupil cannot perform internally.",
      "Avoid mid-question changes of representation — never start a question with a fraction and finish it with a decimal unless the topic IS the conversion. Pick one representation per question and stay in it.",
    ],
    presentationRules: [
      "Every calculation slide shows steps with blanks: 'Step 1: ___ Step 2: ___'.",
      "Include a 'Key Facts' slide near the start with times-tables / number bonds / formulas the pupil can refer back to.",
      "Worked-example slides annotate every arithmetic step with a short 'why' line underneath.",
      "All word problems use real-world contexts with concrete objects, not abstract symbols.",
      "Include one slide showing a number line or place value chart the pupil can use as a reference.",
    ],
  },
  {
    id: "asc",
    name: "Autism Spectrum Condition (ASC)",
    bullets: [
      { what: "One-time 'What you need to do' box opens every section",
        why: "Removes ambiguity once per section without creating repetitive clutter." },
      { what: "Worked example immediately precedes Section A with identical structure",
        why: "New tasks process more reliably when they mirror a known model." },
      { what: "Consistent terminology throughout — one word per concept, no synonyms",
        why: "Synonyms can be interpreted as different tasks; consistency prevents confusion." },
      { what: "Neutral, factual contexts only — no social or emotional scenarios",
        why: "Social scenarios require theory-of-mind processing, an area of difficulty in ASC." },
      { what: "Completion checklist in reflection (tick boxes, not open writing)",
        why: "Structured checklists are more accessible than open-ended reflection." },
    ],
    worksheetRules: [
      "Each section opens with ONE 'What you need to do' box listing exact steps. Add a single box at section level only; do not duplicate it inside individual questions.",
      "Place a fully worked example immediately before Section A, using identical wording and structure to Section A's questions.",
      "Use one word per concept. Never mix synonyms (pick either 'calculate' OR 'work out' — stick to it everywhere).",
      "Use literal, unambiguous language. No idioms, no figurative language (write 'calculate the value of x', not 'find x').",
      "Contexts must be neutral and factual. No social scenarios, no emotions.",
      "Reflection is a tick-box checklist: '[ ] I completed Section A   [ ] I completed Section B   [ ] I tried the Challenge'. Plus ONE exit question: 'Write one thing you learned today.'",
      "Use identical layout across every section — predictable is the goal.",
    ],
    worksheetRulesContent: [
      "Every question must be fully decodable from its own text. Never require inference of an unspoken context (no 'Sarah is upset because…' or 'the team decides…'). The pupil should not need to guess what is meant.",
      "Use a single predictable problem schema across the whole worksheet: every question follows the same template ([command verb] + [object] + [literal context]). The pupil transfers the worked example to every item without re-parsing the structure.",
      "Pre-teach every subject term in the Word Bank with one fixed plain-English definition. Never use a synonym or alternative phrasing of the same concept across the worksheet — synonyms read as new concepts.",
      "Use literal command words drawn from the awarding-body list (identify, list, calculate, define, label, match). Avoid command words that depend on inference (suggest, imply, interpret) unless paired with a literal restatement on the same line.",
    ],
    presentationRules: [
      "Every activity slide opens with a 'What you need to do:' box listing exact steps.",
      "Place a worked-example slide immediately before every practice slide, using identical wording to the practice slide.",
      "One word per concept — never swap synonyms across the deck.",
      "Literal, unambiguous language. No idioms. No emotive contexts.",
      "Exit-ticket slide uses a tick-box checklist rather than open-ended reflection.",
      "Keep every slide's layout identical (same title position, same bullet area, same font size).",
    ],
  },
  // ── Autism Spectrum Condition sub-profiles ─────────────────────────────────
  // The feedback from teachers is that autism is a broad spectrum and a single
  // uniform "ASC" prompt doesn't actually adapt to each presentation. These
  // profiles narrow the adaptation. They inherit the base ASC rules and add
  // profile-specific ones on top; resolveSendSpec() resolves the specific id
  // first and falls back to `asc` when the profile is not recognised.
  {
    id: "asc-social",
    name: "ASC — Social Communication profile",
    bullets: [
      { what: "Zero social or emotive wording in question content",
        why: "Social framing requires theory-of-mind processing that is the core difficulty in this profile." },
      { what: "Every abstract or figurative phrase rewritten literally",
        why: "Literal processing is a reliable strength; figurative phrasing is not." },
      { what: "All subject terms defined in plain English on first use",
        why: "Inference from context is less reliable — definitions must be explicit." },
      { what: "Step-by-step numbered instructions — no embedded sub-clauses",
        why: "Sequential processing leverages a strength; embedded clauses hide the steps." },
      { what: "'What you need to do' box opens every section",
        why: "Removes unstated expectations that would otherwise need to be inferred." },
    ],
    worksheetRules: [
      "All contexts are factual and literal — NO social scenarios (no 'Sarah is upset', no 'the team decides', no 'friends argue').",
      "Rewrite every idiom or figurative phrase in literal form before emitting the question.",
      "Every subject term the question uses must be defined in plain English at first use, either in-line or in the Key Vocabulary box.",
      "Every multi-step instruction is broken into numbered steps (1. 2. 3.) on separate lines — no embedded clauses.",
      "Each section opens with ONE 'What you need to do:' box that lists the exact numbered steps.",
      "Reflection is a tick-box checklist ONLY. One exit question: 'Write one fact you learned today.'",
    ],
    worksheetRulesContent: [
      "Strip every question of social inference. Replace 'what does the character feel' / 'how does the team react' with 'identify which sentence shows X' or 'match each line to a feature'. The skill assessed is unchanged; the theory-of-mind step is removed.",
      "Replace pronouns with explicit nouns in every question stem. Write 'Lady Macbeth says…' not 'she says…', 'the Prime Minister announced…' not 'he announced…'. The referent is never ambiguous.",
      "Use literal command words only — identify, list, underline, circle, match, calculate, define. Avoid interpret, suggest, imply, infer, evaluate. Where the curriculum requires inference (e.g. English Lit AO2), keep the awarding-body wording but pair it with a literal restatement on the same line.",
    ],
    presentationRules: [
      "All slide contexts are factual and literal — no social framing.",
      "Every idiom rewritten literally on the slide before it is shown.",
      "Every slide defines its subject term in plain English on first use.",
      "Every activity slide opens with a numbered 'What you need to do' box.",
      "Exit-ticket slide is a tick-box checklist only.",
    ],
  },
  {
    id: "asc-demand-avoidant",
    name: "ASC — Demand-Avoidant profile",
    bullets: [
      { what: "Invitational language throughout — 'you might like to', 'have a go at'",
        why: "Direct demand language triggers anxiety-driven avoidance in this profile." },
      { what: "Every section offers a choice of entry point",
        why: "Choice restores the sense of control that removes the perceived demand." },
      { what: "Challenge framed as an optional 'Secret Mission'",
        why: "Optional missions preserve dignity and lower the perceived stakes." },
      { what: "Natural break points after every 3 questions",
        why: "Explicit permission to pause is more effective than implicit expectation." },
      { what: "No progress trackers or visible ticking off",
        why: "Public progress tracking is experienced as surveillance and triggers avoidance." },
    ],
    worksheetRules: [
      "Replace 'You must' / 'You need to' / 'Answer the following' with 'You might like to try …' / 'Have a go at …' in every instruction.",
      "Each section opens with ONE 'What you need to do' box, BUT the steps are framed as 'You might like to 1. … 2. … 3. …' rather than imperatives.",
      "Offer two options within each practice question where possible ('Option A: calculation with whole numbers / Option B: calculation with decimals').",
      "Rename Section A to 'Explore — choose where to start'. Section B to 'Investigate'. Challenge to 'Secret Mission — if you choose to accept it'.",
      "Insert a horizontal rule + 'Take a break here if you need to — come back when you are ready.' after every 3 questions.",
      "No checkboxes, no progress bars, no 'Questions completed: x/y' — remove any visible progress tracker.",
      "Reflection is a single invitation: 'If you would like to, write one thing you noticed today.' — not a tick-box.",
    ],
    worksheetRulesContent: [
      "Frame the worksheet content as a series of choices, not a sequence. Each section opens with two equivalent practice questions on the same skill and the pupil picks one ('You might like to try Question 1A or 1B — both teach the same idea').",
      "Choose real-world contexts that cast the pupil as the agent (collecting, building, exploring, designing). Avoid contexts that cast the pupil as a recipient of instruction (no 'the teacher asks', 'follow these rules', 'do as you are told').",
      "Replace 'right answer' framing with 'your answer' framing — questions ask 'What did you find?' rather than 'What is the answer?'. The mark scheme is unchanged; the request language removes the perceived demand.",
    ],
    presentationRules: [
      "Replace 'must'/'need to' language with 'might like to' / 'have a go at' on every slide.",
      "Every activity slide opens with an invitational 'You might like to …' box.",
      "Rename the challenge slide to 'Secret Mission — if you choose to accept it'.",
      "Include two options on every practice slide.",
      "Insert a 'Take a breath' slide every 3 practice slides.",
      "No progress trackers anywhere in the deck.",
    ],
  },
  {
    id: "asc-sensory",
    name: "ASC — Sensory-Dominant profile",
    bullets: [
      { what: "Muted, low-saturation palette — no bright primary colours",
        why: "High-saturation colour is a sensory trigger for pupils with sensory-dominant ASC." },
      { what: "Generous whitespace between every element",
        why: "Visual density is experienced as sensory overload, shutting down task engagement." },
      { what: "No icons, emojis, or decorative marks",
        why: "Extra visual elements add load without adding information." },
      { what: "Identical, predictable layout across every section",
        why: "Unexpected visual changes between sections cause disorientation." },
      { what: "Text-only diagrams where possible; labelled diagrams otherwise",
        why: "Dense visual diagrams can overwhelm; text descriptions sit alongside every diagram." },
    ],
    worksheetRules: [
      "Use a muted, low-saturation palette. No bright primary colours. No decorative gradients.",
      "Leave generous whitespace between every section and between every question within a section.",
      "NO icons, NO emojis, NO decorative marks (☆, ★, ✨). Keep the page visually clean.",
      "Every section uses identical layout — same title position, same spacing, same question numbering style.",
      "Every diagram has a plain-text description alongside it the pupil can use instead.",
      "Each section opens with ONE calm 'What you need to do:' box in neutral grey, not coloured.",
      "Reflection is a minimal tick-box checklist — no large emotional scale, no colour-coded confidence grid.",
    ],
    worksheetRulesContent: [
      "Use calm, neutral subject contexts only. No descriptions of busy, loud, crowded, or strong-smelling settings (avoid markets, festivals, fairgrounds, sports crowds). Pick still-life or single-actor contexts (a library, a workshop, a single tree, one cell under a microscope).",
      "Strip sensory adjectives from question stems. Write 'the bell rings at 9am' not 'the bell rings loudly'; 'the box weighs 2kg' not 'the heavy box'. Keep numbers and nouns; drop the sensory texture words.",
      "When the topic itself has a sensory dimension (Sound in physics, Taste / Smell in biology, Light in chemistry), introduce the concept with the measurable quantity first (decibels, ions detected, lux) and only mention the sensory experience as a secondary, optional context.",
    ],
    presentationRules: [
      "Every slide uses a muted palette — no high-saturation brand colours.",
      "Generous padding on every slide; never fill edge-to-edge.",
      "No slide icons, emojis, or decorative marks.",
      "Identical layout on every slide (same title position, same bullet area, same font size).",
      "Every diagram slide has a text-description sidebar.",
    ],
  },
  {
    id: "asc-rigid",
    name: "ASC — Rigid-Thinking / Routine profile",
    bullets: [
      { what: "Every section has the same shape as the worked example",
        why: "Pupils with a rigid-thinking profile generalise best when every task mirrors a known model." },
      { what: "Worked example shown IMMEDIATELY before every practice section",
        why: "Re-anchoring the method before each section prevents mid-worksheet disorientation." },
      { what: "Question stems use the identical verb and structure across the sheet",
        why: "Changing the verb from 'Calculate' to 'Find' mid-sheet reads as a new task." },
      { what: "Fixed question count per section, fixed order of types",
        why: "Predictable numerical structure is itself a support — the pupil knows what to expect." },
      { what: "No optional or bonus items hidden inside a section",
        why: "'If there is time, also try Q8' is disorienting. Optional items are clearly separated." },
    ],
    worksheetRules: [
      "Section A, Section B, and Section C each have a fixed number of questions that matches the worked example's structure exactly.",
      "Place a fresh worked example immediately before every practice section — not just once at the top.",
      "Every question stem in the worksheet uses the SAME imperative verb (pick one of 'Calculate' / 'Work out' / 'Find' and use it everywhere).",
      "Every question follows the identical structure: [verb] [object] [context]. No 'For the next 4 questions, …' re-framing.",
      "Optional / bonus items are placed in their own clearly labelled 'Optional' section, never hidden inside Section A / B / C.",
      "Each section opens with ONE 'What you need to do' box whose steps match the worked example one-to-one.",
      "Reflection is a tick-box checklist only.",
    ],
    worksheetRulesContent: [
      "Lock the question schema for the whole worksheet to the structure of the worked example: same number of given values, same order of given values, same ask. Never invert the schema mid-worksheet (don't ask for the input given the output if the worked example asked for the output given the input).",
      "Where multiple valid methods exist (e.g. column addition vs. partitioning), present BOTH in the worked example with an explicit note that any one of them is correct. Pre-empts the rigid-thinking pupil rejecting a peer's correct alternative as 'wrong'.",
      "Number every step of every method to the SAME numbering depth across the whole worksheet (always 1, 2, 3 — never sometimes 1a, 1b, sometimes flat 1, 2, 3). Inconsistent depth reads as inconsistent rules.",
      "Keep every question's mark tariff identical within a section (e.g. Section A is 2-mark questions throughout, Section B is 4-mark questions throughout). Tariff changes mid-section read as schema changes.",
    ],
    presentationRules: [
      "Every practice slide mirrors the worked-example slide's layout exactly.",
      "Insert a worked-example slide immediately before every practice slide.",
      "Every practice slide uses the identical imperative verb and stem structure.",
      "Optional / bonus slides sit in their own clearly labelled section at the end of the deck.",
    ],
  },
  {
    id: "asperger",
    name: "Asperger Syndrome",
    bullets: [
      { what: "'What you need to do' box added before every section",
        why: "Removes ambiguity and reduces anxiety caused by unstated expectations." },
      { what: "Direct, literal language with no figurative phrasing",
        why: "Asperger Syndrome involves difficulty interpreting non-literal language." },
      { what: "Identical, predictable layout across every slide",
        why: "Predictable formatting reduces cognitive load so pupils focus on content." },
      { what: "Interest-based contexts permitted where relevant",
        why: "Interest-based learning sustains engagement and is an Asperger-specific strength." },
      { what: "Visual diagrams and supports alongside text",
        why: "Visual processing is often stronger than verbal." },
    ],
    worksheetRules: [
      "Every section begins with a 'What you need to do:' box listing exact steps.",
      "Use direct, literal language. No idioms, no figurative phrasing.",
      "Use one word per concept. Never swap synonyms (pick either 'calculate' OR 'work out').",
      "Identical layout across every section — predictable is the goal.",
      "Where the pupil's interest (e.g. trains, a sport, computing) is known, use that as the real-world context.",
      "Reflection is a tick-box checklist.",
    ],
    worksheetRulesContent: [
      "Anchor every section's contexts to one coherent real-world domain (one worksheet's word problems are all train timetables, another all space exploration, another all chess positions). Depth-over-breadth on a real-world domain leverages the special-interest strength.",
      "Use academic register for question stems (demonstrate, justify, evaluate) BUT pair every command word with a short literal restatement on first use ('Justify means: explain why, using evidence'). Academic vocabulary stays at the year-group level; the gloss removes the inference barrier.",
      "Pair every text question with a structured visual cue — diagram, table, flowchart — on the same line. Never present a new concept as text alone on a first encounter; the visual is co-equal to the text route to meaning.",
    ],
    presentationRules: [
      "Every activity slide opens with a 'What you need to do:' box listing exact steps.",
      "Direct, literal language on every slide. No idioms, no figurative phrasing.",
      "One word per concept — never swap synonyms across the deck.",
      "Identical layout on every slide (same title position, same bullet area, same font size).",
      "Interest-based contexts permitted — where relevant, tie real-world links to areas of pupil interest.",
      "Pair every text instruction with a visual cue (diagram, arrow, icon).",
    ],
  },
  {
    id: "mld",
    name: "Moderate Learning Difficulties (MLD)",
    bullets: [
      { what: "Question 1 in Section A has a fully completed model answer",
        why: "Provides a direct template for generalisation." },
      { what: "Every Section A question has a hint, sentence starter, or partial answer",
        why: "Scaffolded release of responsibility (I do, we do, you do)." },
      { what: "'Help Box' at top of Section B with key facts and vocabulary",
        why: "Reduces memory burden by keeping a visible reference." },
      { what: "KS2 reading level language throughout",
        why: "Ensures the barrier is the subject content, not the reading." },
      { what: "Concrete-pictorial-abstract progression in Section A",
        why: "EEF-backed approach (Bruner, 1966) for students with learning difficulties." },
    ],
    worksheetRules: [
      "Question 1 in Section A shows a fully completed model answer inline (the first question IS a worked example).",
      "Every Section A question includes a hint, sentence starter, OR a partially completed answer.",
      "Place a 'Help Box' at the top of Section B containing the key facts, formulas and vocabulary needed for the questions.",
      "Use KS2 reading level throughout (short sentences, everyday vocabulary, technical terms explicitly defined).",
      "Section A progresses Concrete → Pictorial → Abstract: first Q uses objects/images, then a diagram, then the symbolic form.",
      "No multi-step problems in Section A. Section B uses 2-step problems broken into (a) / (b) sub-parts.",
      "Challenge labelled as optional. Reflection uses tick-boxes with sentence starters.",
    ],
    worksheetRulesContent: [
      "Use KS2-band high-frequency vocabulary across all question stems regardless of the pupil's actual year group. Define every subject-specific term in the Help Box with a plain-English synonym alongside.",
      "Q1 of every section is the model: a fully completed identical question. Q2 is the same structure with one missing value. Q3 is the same structure with two missing values. Section A escalates demand by REMOVING scaffolding, never by changing the question schema.",
      "All word problems use everyday concrete contexts the pupil meets in daily life (shopping, cooking, school timetables, family). Never workplace contexts, never abstract finance, never unfamiliar institutional contexts (council tax, insurance, pension).",
      "Never a multi-step problem in Section A. Section B uses two-step problems explicitly broken into (a) and (b) sub-parts so the pupil never has to plan a multi-step path on a blank page.",
    ],
    presentationRules: [
      "Start the practice block with a fully-worked example slide — the first practice item IS a model answer.",
      "Every activity slide shows a hint, sentence starter, or partial answer for the pupil to complete.",
      "Include a 'Help Box' slide before the independent practice block with key facts and vocabulary.",
      "KS2 reading level on every slide (short sentences, everyday words, all technical terms defined).",
      "Concrete → Pictorial → Abstract progression across the deck: object photo → diagram → symbolic.",
      "Extension / challenge slides labelled optional.",
    ],
  },
  {
    id: "slcn",
    name: "Speech, Language & Communication Needs (SLCN)",
    bullets: [
      { what: "Word Bank with plain-English definitions at the start of each section",
        why: "Reduces cognitive load of recalling terms." },
      { what: "Sentence frames for every answer (e.g. 'The answer is ___ because ___')",
        why: "Scaffolds expressive language production." },
      { what: "Maximum sentence length of 12 words; subject-verb-object structure only",
        why: "Complex structures are harder to decode for students with language processing difficulties." },
      { what: "Matching, labelling, and multiple-choice formats used in Section B",
        why: "Reduce language production demand while still assessing subject knowledge." },
      { what: "Visual cues (arrows, diagrams) alongside every text question",
        why: "Visual processing is often stronger than verbal in SLCN." },
    ],
    worksheetRules: [
      "Place a Word Bank at the start of every section — max 8 terms with plain-English definitions.",
      "Every answer slot includes a sentence frame (e.g. 'The answer is ___ because ___').",
      "Every sentence is max 12 words and uses subject-verb-object structure only.",
      "Section B must use matching, labelling, or multiple-choice format for at least 3 questions.",
      "Every text question has a visual cue beside it (diagram, arrow, icon).",
      "Bold the key action words in every instruction.",
      "Reflection uses sentence starters: 'I can ___.', 'I need to practise ___.'",
    ],
    worksheetRulesContent: [
      "Introduce every new concept with a labelled image FIRST and the text caption SECOND. The visual is the primary route to meaning for SLCN; the text is the second route.",
      "Restrict every question stem to one main verb and one clause. No subordinate clauses, no relative pronouns ('who', 'which', 'that' embedded), no embedded 'if … then'. Pull conditionals into a separate sentence on its own line.",
      "Pre-teach two key terms per section in the Word Bank: one with a plain-English synonym, one paired with a picture cue. Use the picture cue inline beside the term's first appearance in any question.",
      "Favour matching, labelling, and multiple-choice formats for assessment of recall — preserves the curriculum demand while removing the language-production barrier.",
    ],
    presentationRules: [
      "First content slide is a Word Bank (max 8 terms, plain-English definitions).",
      "Every check-for-understanding slide uses a sentence frame for the answer.",
      "Every bullet is max 12 words and uses S-V-O structure only.",
      "Assessment slides favour matching / labelling / MCQ over free response.",
      "Every text slide is paired with a visual cue (diagram, arrow, icon) on the slide.",
      "Exit-ticket uses sentence starters ('I can …', 'I need to practise …').",
    ],
  },
  {
    id: "anxiety",
    name: "Anxiety / Mental Health (SEMH)",
    bullets: [
      { what: "Section A renamed 'Warm-Up — no pressure!'",
        why: "Reduces perceived threat so the prefrontal cortex stays online." },
      { what: "Challenge clearly labelled 'OPTIONAL BONUS — only if you want to!'",
        why: "Removes the fear of failure from mandatory challenges." },
      { what: "Positive statement at the start of each section ('You already know this — let's practise!')",
        why: "Positive priming activates approach motivation." },
      { what: "'How are you feeling?' emoji check-in at start and end",
        why: "Zones of Regulation check-ins are recommended in the SEND Code of Practice." },
      { what: "'Must', 'should', 'need to' replaced with 'try to', 'have a go at'",
        why: "Invitational language achieves the same goal without the threat response." },
    ],
    worksheetRules: [
      "Rename Section A to 'Warm-Up — no pressure!' and Section B to 'Main Practice — you've got this!'.",
      "Label the Challenge as 'OPTIONAL BONUS — only if you want to!'.",
      "Open each section with a positive statement (e.g. 'You already know this — let's practise!').",
      "Include an emoji check-in at the START of the worksheet AND at the reflection: 'How are you feeling right now? 😀 🙂 😐 😟 😣'.",
      "Replace 'must', 'should', 'need to' with 'try to', 'have a go at'.",
      "Place a 'Tip' box in each section. Insert 'Take a break here if you need to' midway through Section B.",
      "No timed-pressure language anywhere. Reflection uses 'I tried …', 'I found …' starters.",
    ],
    worksheetRulesContent: [
      "Open Section A with a low-stakes confidence-builder question on a previously-taught skill the pupil has already succeeded with. The full year-group curriculum demand applies from Section B onward; the warm-up does not lower the rigour, it lowers the threat.",
      "Frame every question as exploration rather than test. 'Have a go at finding x' or 'See what you notice when…' replaces 'Calculate x' and 'Find the answer'. The academic content and command-word tariff are unchanged.",
      "Embed the worked example with the words 'many pupils find this tricky at first — here's how' before the method. Normalises early difficulty so the pupil reads struggle as expected rather than as personal failure.",
      "Avoid scenarios that prime threat in the question content (no exam-room scenarios, no 'in 30 seconds', no 'before time runs out'). Pick neutral domains — nature, design, everyday objects.",
    ],
    presentationRules: [
      "First slide after the title is a 'How are you feeling?' emoji check-in (😀 🙂 😐 😟 😣).",
      "The last slide before the exit-ticket is a second 'How are you feeling now?' check-in.",
      "Rename any 'test'/'quiz' slide to 'Warm-Up — no pressure!'.",
      "Challenge slide labelled 'OPTIONAL BONUS — only if you want to!'.",
      "Every slide opens with a positive priming sentence.",
      "Replace 'must'/'should'/'need to' with 'try to' / 'have a go at' throughout.",
    ],
  },
  {
    id: "dyspraxia",
    name: "Dyspraxia / DCD",
    bullets: [
      { what: "Multiple-choice, matching, and circle-the-answer formats in Section A",
        why: "Reduces handwriting demands; allows knowledge demonstration without motor barrier." },
      { what: "Large answer boxes and generous line spacing throughout",
        why: "DCD students need more space to write legibly." },
      { what: "Structured answer frames (tables, fill-in-the-blank) rather than open writing",
        why: "Removes the planning burden of organising responses on a blank page." },
      { what: "Challenge question uses diagram, circle, or tick format — no extended writing",
        why: "Sustained writing is tiring for DCD students." },
    ],
    worksheetRules: [
      "Section A uses multiple-choice, matching, OR circle-the-answer format for at least 3 questions.",
      "Every answer box is large (at least 3 lines of equivalent space). Generous line spacing throughout.",
      "Section B uses tables, fill-in-the-blank, or other structured answer frames — never open prose.",
      "The Challenge uses a tick / circle / label-the-diagram format — NEVER extended writing.",
      "Worked example steps are brief bullet points, not paragraphs.",
      "Minimise handwriting demands across the whole worksheet.",
    ],
    worksheetRulesContent: [
      "Pre-draw any diagrams, axes, tables or grids the pupil would otherwise have to construct. The pupil annotates rather than draws. The cognitive content is preserved; the fine-motor demand is removed.",
      "Frame extended-response demand as a sequence of short labelled fields ('Cause: ___', 'Effect: ___', 'Evidence: ___') rather than open prose. Assesses the same reasoning chain without the planning-on-blank-paper barrier.",
      "Keep the number of distinct response actions per question to one. The pupil either ticks, or labels, or writes one short answer — never combine two motor demands inside a single question stem.",
    ],
    presentationRules: [
      "Every practice slide uses MCQ, matching, or circle-the-answer format.",
      "Avoid 'write a paragraph' instructions; use structured answer frames on-slide.",
      "Challenge slide uses a tick/circle/label format — never extended writing.",
      "Worked examples use short bullet steps, not paragraphs.",
    ],
  },
  {
    id: "vi",
    name: "Visual Impairment",
    bullets: [
      { what: "Minimum 18pt equivalent font size throughout",
        why: "Larger text removes reading strain." },
      { what: "High-contrast formatting — dark text on light background, bold headings",
        why: "RNIB's primary accessibility recommendation." },
      { what: "All diagram content described in text as well",
        why: "Ensures no information is inaccessible." },
      { what: "No questions that rely solely on visual interpretation",
        why: "Diagram-only questions create an insurmountable barrier." },
      { what: "Generous spacing between questions and sections",
        why: "Reduces visual crowding so the student can navigate independently." },
    ],
    worksheetRules: [
      "Use an equivalent 18pt font size throughout. Bold every heading.",
      "High-contrast formatting: dark text on light background. No pale greys, no low-contrast colours.",
      "Every diagram has a full text description immediately alongside it (never diagram-only).",
      "No question relies solely on visual interpretation — every question is answerable from the text.",
      "Generous spacing between questions and between sections. Large answer spaces.",
      "Worked example steps are all written in full text (no reliance on diagrams).",
      "Questions are numbered prominently.",
    ],
    worksheetRulesContent: [
      "Every question is fully answerable from text alone. Where a diagram is pedagogically essential to the topic, replicate its full information content in a structured prose description (or table) on the same line as the diagram — never a diagram-only question.",
      "Avoid colour-dependent reasoning. Never write 'the red bar is taller than the blue bar' or 'shade the green region'. Use shape, size, label or pattern to encode any visual distinction; the pupil reaches the answer without colour discrimination.",
      "Use cardinal directions or labelled coordinates rather than spatial deixis. Write 'the point at (3, 4)' not 'the point near the top-right'; 'in row 2, column 3' not 'in the middle box'. Spatial language refers to labels, not position-on-page.",
    ],
    presentationRules: [
      "Minimum 24pt body font on every slide; titles 40pt+.",
      "High-contrast colour scheme only (dark text on light background or vice versa).",
      "Every diagram slide has a text description of the diagram in the speakerNotes AND a short text summary on the slide itself.",
      "No slide requires visual interpretation alone — all information duplicated in text.",
      "Generous padding around every text block.",
    ],
  },
  {
    id: "hi",
    name: "Hearing Impairment",
    bullets: [
      { what: "Topic summary block at the top of each section replaces verbal teacher explanation",
        why: "Students with HI cannot rely on hearing the teacher introduce the topic. A written summary compensates for this gap and ensures they have the same starting knowledge as hearing peers." },
      { what: "All instructions written in full — no reliance on verbal explanation",
        why: "Worksheet must be fully self-contained so the student is not disadvantaged by missing verbal context." },
      { what: "Word Bank with definitions for ALL key terms used in the worksheet",
        why: "Compensates for gaps in incidental (listening-based) vocabulary learning — HI students miss vocabulary picked up through hearing." },
      { what: "Every question contains all necessary information within itself",
        why: "Prevents frustration when clarification can't be easily requested verbally." },
      { what: "Visual diagrams with full text descriptions alongside every question",
        why: "Visual channel is the primary learning route for many HI students." },
      { what: "No audio-dependent content or references to listening tasks",
        why: "Audio-only content creates an insurmountable barrier." },
    ],
    worksheetRules: [
      // Phase 4 — Non-cosmetic: topic summary block compensates for missed verbal instruction
      "At the TOP of Section 1 (before Q1), insert a 'Topic Summary' box containing a 3-5 sentence written explanation of the key concept being tested. This replaces what a hearing student would hear from the teacher. Example: 'In this section, you will be tested on [topic]. Key points to remember: [3-5 bullet points of core content from the specification]. This information is here because you may not have been able to hear all of the teacher's explanation.'",
      "At the TOP of Section 2 (before the first understanding question), insert a 'Key Concepts' box summarising the deeper understanding points needed for this section.",
      "At the TOP of Section 3 (before the first exam-style question), insert an 'Exam Technique Reminder' box explaining what each command word means (e.g. 'Calculate = show all working and give a numerical answer with units').",
      "All instructions written in full on the page. Never 'as explained earlier', 'as your teacher said', or 'as discussed in class'.",
      "Include a comprehensive Word Bank with plain-English definitions for EVERY key term used in the worksheet — not just difficult ones.",
      "Every question contains ALL information it needs — no cross-references to other pages, no 'see above'.",
      "Each text question has a matching visual diagram or support beside it.",
      "No reference to audio, listening, 'what the teacher said', or 'as we discussed'. All assessment is text-and-visual.",
      "Worked example written out in full — no reliance on verbal narration. Every step explained in writing.",
      "Self-reflection section includes a note: 'You do not need to share your answer aloud. Write your response in the space below.'",
    ],
    worksheetRulesContent: [
      "Replace any audio-mediated subject content with text. Where a topic depends on listening (music notation, language phonology, spoken conversation analysis), assess the equivalent reading-based skill with a transcript ('Read this transcript and identify…'). The curriculum coverage is preserved; the listening barrier is removed.",
      "Define every subject term that a hearing pupil would normally pick up incidentally from the teacher's spoken explanation (idioms, colloquial subject terms, oral conventions). Make every gloss visible on the page — never implied by 'as you've heard before'.",
      "Avoid questions that depend on rhyme, intonation, or prosody unless the topic IS phonology, in which case provide a phonemic notation key (IPA or simplified) and assess via written transcript matching rather than aural recall.",
    ],
    presentationRules: [
      "Every slide is fully self-contained in text — no reliance on the teacher reading it aloud.",
      "Every subject term used on the slide is also defined on the slide (or on the key-terms slide).",
      "Every activity slide has a matching visual diagram or support on the same slide.",
      "No listening tasks, no audio cues in speaker instructions.",
    ],
  },
  {
    id: "eal",
    name: "EAL (English as an Additional Language)",
    bullets: [
      { what: "Key Vocabulary box at the start of every section with plain-English definitions",
        why: "Removes the academic vocabulary barrier without teacher intervention." },
      { what: "Sentence frames for all written responses",
        why: "EAL students often have knowledge they can't express without a frame." },
      { what: "Culturally neutral contexts — no UK-specific idioms or unfamiliar cultural references",
        why: "Cultural references exclude students who don't share the background." },
      { what: "Short, clear sentences with simple grammatical structures",
        why: "Complex grammar adds unnecessary comprehension load." },
      { what: "Visual supports (diagrams, arrows) alongside all text questions",
        why: "Visual channel is accessible regardless of language proficiency." },
    ],
    worksheetRules: [
      "Place a Key Vocabulary box at the start of every section (plain-English definitions, max 8 terms).",
      "Every written response has a sentence frame (e.g. 'The answer is …'; 'This shows that …').",
      "Use culturally neutral contexts ONLY. No UK-specific idioms (e.g. 'piece of cake', 'bob's your uncle'), no sports trivia, no UK-only food brands.",
      "Short sentences. Simple grammar. Subject-verb-object where possible.",
      "Every text question has a visual support (diagram, arrow, icon) beside it.",
      "Bold key instruction words. Minimise writing demands.",
    ],
    worksheetRulesContent: [
      "Use cognate-rich vocabulary where the topic permits (e.g. photosynthesis / fotosíntesis / photosynthèse, geometry / geometría / géométrie) and gloss in plain English in the Key Vocabulary box. Where no cognate exists, pre-teach the term with a picture cue and a single-word synonym.",
      "Use everyday-context word problems — culturally neutral (shopping, cooking, time, distance, family). Avoid uniquely-British contexts (cricket, A-Level UCAS, council tax, Christmas trifle) unless the topic IS UK civics or UK culture.",
      "Restrict question grammar to active voice, simple present or simple past, single clause. No phrasal verbs ('work out', 'come up with', 'figure out'), no idioms ('a piece of cake'), no UK-colloquial command words. Always write 'calculate' not 'work out'; 'find' not 'come up with'.",
      "Where the topic forces an awarding-body command word that is itself an idiom in everyday English (e.g. 'account for'), gloss it inline on first use ('account for = explain why').",
    ],
    presentationRules: [
      "Place a 'Key Vocabulary' slide early in the deck with plain-English definitions.",
      "Every check-for-understanding slide includes a sentence frame for the answer.",
      "Culturally neutral contexts only — no UK idioms, no UK-specific cultural references.",
      "Short sentences on every slide. Simple grammar.",
      "Every text slide is paired with a visual support (diagram, arrow, icon) on the slide itself.",
    ],
  },
  {
    id: "pda-odd",
    name: "PDA / ODD",
    bullets: [
      { what: "Section A renamed 'Explore — choose where to start'",
        why: "Removes the sense of obligation that triggers anxiety." },
      { what: "Challenge renamed 'Secret Mission — if you choose to accept it'",
        why: "Optional missions give a sense of control." },
      { what: "'You must' replaced with 'You might like to...' throughout",
        why: "Invitational language achieves the same goal without triggering avoidance." },
      { what: "Natural break points built into every section",
        why: "Pausing reduces anxiety escalation." },
      { what: "'Take a break here if you need to' prompt midway",
        why: "Explicit permission to pause is more effective than implicit expectation." },
    ],
    worksheetRules: [
      "Rename Section A to 'Explore — choose where to start'. Section B to 'Investigate'. Challenge to 'Secret Mission — if you choose to accept it'.",
      "Replace 'You must' / 'You need to' / 'Answer the following' with 'You might like to try …' / 'Have a go at …'.",
      "Offer 2 options within each question where possible ('Option A: calculate with fractions / Option B: calculate with decimals').",
      "Build a natural break point after every 3 questions: a horizontal rule + 'Take a break here if you need to.'.",
      "Use 'we' language throughout ('Let's look at …', 'We can see that …').",
      "No timed pressure. No mandatory language anywhere.",
    ],
    worksheetRulesContent: [
      "Replace every 'must' / 'need to' / 'should' in question stems with 'might like to' / 'have a go at' / 'see if you can'. Curriculum demand is unchanged; the demand-language that triggers avoidance is removed.",
      "Offer a choice of equivalent contexts inside each question ('Option A: a recipe for biscuits / Option B: a workout plan — pick whichever interests you'). The pupil decides the surface; the underlying mathematics, science or analysis is the same on both options.",
      "Frame the success criterion as the pupil's, not the marker's. Ask 'What did you find?' rather than 'What is the answer?'. The mark scheme is unchanged; the request language removes the perceived demand.",
    ],
    presentationRules: [
      "Rename any 'Do this' slide to 'Explore — choose where to start'.",
      "Rename the challenge / extension slide to 'Secret Mission — if you choose to accept it'.",
      "Replace 'must'/'need to' with 'might like to' / 'have a go at' on every slide.",
      "Every practice slide offers 2 options the pupil can pick between.",
      "Include a 'Take a break here if you need to' slide mid-deck.",
      "Use 'we' language throughout the deck.",
    ],
  },
  {
    id: "tourettes",
    name: "Tourette's Syndrome",
    bullets: [
      { what: "Multiple response formats: tick, circle, fill-in, short answer",
        why: "Tics can disrupt sustained writing; varied formats reduce impact." },
      { what: "Natural break points built into every section",
        why: "Allow release of suppressed tics without disrupting the task." },
      { what: "Reduced writing demands — avoid long written responses",
        why: "Extended writing is particularly affected by motor tics." },
      { what: "Calm, supportive, non-judgmental tone throughout",
        why: "Stress worsens tic frequency." },
      { what: "No timed pressure language ('quickly', 'in 5 minutes')",
        why: "Time pressure increases anxiety which increases tics." },
    ],
    worksheetRules: [
      "Use varied response formats: tick, circle, fill-in-the-blank, short answer. No long writing in any section.",
      "Insert a natural break after every 3 questions: horizontal rule + 'Take a breath here if you need to.'.",
      "Section A: maximum 4 questions with varied formats. Section B: short-answer only. Challenge: circle or tick format.",
      "Calm, supportive, non-judgmental tone. No 'quickly', 'in 5 minutes', 'hurry'.",
      "No loud or urgent language.",
    ],
    worksheetRulesContent: [
      "Cap any single response at ≤ 4 lines of writing. Where the curriculum requires extended reasoning, scaffold it as a sequence of short labelled fields rather than a continuous paragraph — sustained writing aggravates motor-tic load.",
      "Avoid topics that require sustained quiet focus on a single static stimulus for several minutes (no 'look at this image and write everything you see'). Use turn-taking response formats (match, tick, label) instead — the pupil engages and disengages naturally between items.",
      "Use neutral everyday contexts for word problems. Avoid stress-priming contexts (pressure of time, public performance, social judgment, exam-room scenarios) — stress is a known trigger for tic frequency.",
    ],
    presentationRules: [
      "Practice slides use varied formats: tick / circle / fill-in / short answer. No long writing.",
      "Include 'Take a breath' slides every 3–4 practice slides.",
      "Calm, supportive language throughout. No timing language on any slide.",
    ],
  },
  {
    id: "older-learners",
    name: "Older Learners (KS3/KS4/KS5)",
    bullets: [
      { what: "Graphic organiser or table provided for extended responses",
        why: "Older learners with SEND struggle to organise complex information." },
      { what: "Cornell-style note section at the end of each section",
        why: "Structured note-taking improves retention and revision." },
      { what: "Age-appropriate academic language and contexts throughout",
        why: "Maintains dignity and engagement for KS3–KS5 students." },
      { what: "Study tip box at the start of each section",
        why: "Explicit metacognitive strategies build independent learning." },
      { what: "Clear section breaks with estimated time for each section",
        why: "Time management is a common difficulty; visible time guides help self-regulation." },
    ],
    worksheetRules: [
      "Extended-response questions include a graphic organiser or table (3–4 columns) to scaffold the answer structure.",
      "End every section with a Cornell-style note box: left column 'Key terms', right column 'Summary in my own words'.",
      "Age-appropriate academic language throughout. Use real-world KS3–KS5 contexts (workplace, finance, media, technology, current affairs).",
      "Place a 'Study Tips' box at the START of every section with 1–2 exam technique reminders.",
      "Each section header shows an estimated time: 'Section A (≈ 10 min) — Skills Practice'.",
      "Reflection asks 'What went well?' and 'What do I need to revise further?' — no traffic lights.",
    ],
    worksheetRulesContent: [
      "Use real-world adult contexts for every word problem: workplace decisions, personal finance (budgeting, interest rates, mortgages), public-life numeracy (tax, energy bills, elections), media literacy. Never primary-school contexts (sweets, toys, fairground rides, teddy bears).",
      "Reference the named GCSE / IGCSE / A-Level awarding-body in the worked example ('the AQA mark scheme awards 1 mark for stating the formula and 2 marks for substitution'). The pupil sees the question as exam-relevant rather than as remedial work — this is dignity-preserving and motivation-preserving.",
      "Frame every misconception with the phrasing 'a common mistake at this level is…' rather than the primary-school 'be careful not to…'. Preserves dignity and signals the pupil is learning at the expected band.",
      "Where the awarding body has a named assessment objective (AO1 / AO2 / AO3), tag at least one question per section to the relevant AO so the pupil sees how each item earns marks at the expected level.",
    ],
    presentationRules: [
      "Extended-response slides include an on-slide graphic organiser (table or frame) for the answer structure.",
      "Insert a Cornell-notes slide at the end of each section of the deck.",
      "Age-appropriate academic language, real-world KS3–KS5 contexts, no childish imagery.",
      "Place a 'Study Tips' slide before the first content slide in each section.",
      "Show an estimated time on every section's opening slide (e.g. '≈ 10 min').",
    ],
  },
  {
    id: "working-memory",
    name: "Working Memory Difficulties",
    bullets: [
      { what: "Memory Aid box before every question with key facts written out",
        why: "Students with working memory difficulties cannot hold multiple pieces of information simultaneously." },
      { what: "Step-by-step method broken into numbered sub-steps",
        why: "Externalising the process reduces the load on working memory." },
      { what: "Word bank and key vocabulary always visible on the page",
        why: "Removes the need to recall vocabulary from memory." },
      { what: "Worked example immediately before every practice section",
        why: "Provides a reference model so students do not need to hold the method in memory." },
      { what: "One instruction per line — no multi-part questions",
        why: "Multi-part instructions overload working memory; single-step instructions are more accessible." },
    ],
    worksheetRules: [
      "Every question section begins with a 'Memory Aid' box listing the key facts, formulas, or vocabulary needed for that section.",
      "Break every multi-step question into numbered sub-steps: 'Step 1: ___ Step 2: ___ Step 3: ___'.",
      "Include a visible word bank or key facts box at the top of every section.",
      "Place a fully worked example immediately before every practice section.",
      "One instruction per line only — never combine two instructions in one sentence.",
      "Reflection uses a tick-box checklist — no open writing.",
    ],
    worksheetRulesContent: [
      "Carry forward — every question keeps visible the values from the previous question so the pupil never has to retain unspoken information across items. Repeat the relevant values in the new question stem rather than referring to 'as in question 2'.",
      "Limit each question to ONE new fact, ONE recall, and ONE new operation. Never combine 'recall this formula AND substitute these values AND interpret the units' inside one stem — split into three sub-questions a / b / c on separate lines.",
      "Write out every formula, definition, or fact the pupil needs in the question stem itself (or in the Memory Aid box on the same page). Never assume the pupil will retrieve it from a previous topic, a previous lesson, or earlier in the same worksheet.",
    ],
    presentationRules: [
      "Every practice slide opens with a 'Memory Aid' box listing the key facts needed.",
      "Break every multi-step task into numbered sub-steps on the slide.",
      "Include a visible key facts / word bank panel on every practice slide.",
      "Place a worked-example slide immediately before every practice slide.",
      "One instruction per bullet point — never combine two instructions.",
    ],
  },
  {
    id: "semh",
    name: "Social, Emotional and Mental Health (SEMH)",
    bullets: [
      { what: "Emotional check-in at the start and end of the worksheet",
        why: "SEMH needs affect emotional regulation; check-ins normalise self-monitoring." },
      { what: "Positive, encouraging language throughout — no pressure or urgency",
        why: "Anxiety and low self-esteem are common in SEMH; supportive language reduces barriers." },
      { what: "Optional bonus challenge — never mandatory",
        why: "Mandatory challenge tasks increase anxiety; optional framing maintains engagement." },
      { what: "Natural break points built into every section",
        why: "SEMH needs can affect concentration and emotional regulation; breaks allow self-regulation." },
      { what: "Encouragement box before every question section",
        why: "Explicit encouragement builds confidence and reduces avoidance." },
    ],
    worksheetRules: [
      "Open with an emotional check-in: '[ ] Calm   [ ] OK   [ ] Need a break — let your teacher know'.",
      "Rename Section A 'Warm-Up — no pressure!'. Rename challenge as 'OPTIONAL BONUS — only if you want to!'.",
      "Add a positive statement at the start of each section (e.g. 'You can do this — take it one step at a time.').",
      "Replace 'must', 'should', 'need to' with 'try to', 'have a go at', 'you might like to'.",
      "Insert a natural break point after every 3 questions: 'Take a breath here — come back when you are ready.'.",
      "Reflection uses a gentle emotional check-in: '[ ] Calm   [ ] OK   [ ] Need a break'.",
    ],
    worksheetRulesContent: [
      "Open Section A with a low-stakes confidence-builder question on an already-taught skill the pupil has succeeded with. The full year-group curriculum demand applies from Q2 onward; the warm-up does not lower the rigour, it lowers the threat.",
      "Use neutral, non-triggering subject contexts only. Avoid scenarios involving conflict, separation, bereavement, exclusion, behaviour-management, or judgment of others' behaviour. Replace with neutral domains (nature, design, sport without competition, everyday objects).",
      "Frame errors as expected. Open every misconception line with 'many pupils think… — let's look at why that doesn't work' rather than 'be careful not to…'. Removes the failure-as-identity framing that worsens engagement for SEMH pupils.",
      "Avoid primed-failure framings in question stems ('most pupils get this wrong', 'this is a tricky one'). Pick neutral or invitational framings — the curriculum demand is the same; the threat priming is removed.",
    ],
    presentationRules: [
      "Open the deck with an emotional check-in slide.",
      "Rename activity slides to 'Warm-Up', 'Have a Go', 'Explore'.",
      "Add a positive statement at the start of every section of slides.",
      "Replace all 'must'/'need to' language with 'try to'/'have a go at'.",
      "Insert a 'Take a breath' slide every 3–4 practice slides.",
    ],
  },
];

// ─── Public API ──────────────────────────────────────────────────────────────

function normaliseSendKey(input: string | undefined | null): string {
  const raw = (input || "").toLowerCase().trim();
  if (!raw) return "";
  // Support a compound format like "asc:asc-demand-avoidant" emitted by the
  // UI when an autism sub-profile is picked. Prefer the part after the colon
  // so the specific profile resolves, but keep the base id appended so the
  // fallback matchers still work if the profile is not recognised.
  const parts = raw.split(":").map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[1]} ${parts[0]}`;
  }
  return raw;
}

/**
 * Resolves a free-text / partial SEND need label to the canonical spec id.
 * Returns null when no SEND adaptation applies.
 */
export function resolveSendSpec(sendNeed: string | undefined | null): SendAdaptationSpec | null {
  const sn = normaliseSendKey(sendNeed);
  if (!sn || sn === "none" || sn === "none-selected" || sn === "general") return null;

  // Order matters — exact sub-profile ids beat the generic "autism"/"asc" match.
  const matchers: Array<[RegExp, string]> = [
    [/\b(adhd)\b/, "adhd"],
    [/\b(dyslexia)\b/, "dyslexia"],
    [/\b(dyscalculia)\b/, "dyscalculia"],
    // Autism sub-profiles — match BEFORE the generic asc/autism token so e.g.
    // "asc:asc-demand-avoidant" or "asc-demand-avoidant" resolves to the
    // specific profile rather than falling through to the generic asc block.
    [/\b(asc-social|social-communication)\b/, "asc-social"],
    [/\b(asc-demand-avoidant|demand-avoidant|asc-da)\b/, "asc-demand-avoidant"],
    [/\b(asc-sensory|sensory-dominant|asc-sd)\b/, "asc-sensory"],
    [/\b(asc-rigid|rigid-thinking|asc-routine)\b/, "asc-rigid"],
    [/\b(asperger)\b/, "asperger"],
    [/\b(asc|autism|autistic|asd)\b/, "asc"],
    [/\b(mld|moderate learning)\b/, "mld"],
    [/\b(slcn|speech|language|communication)\b/, "slcn"],
    [/\b(anxiety|semh|mental)\b/, "anxiety"],
    [/\b(dyspraxia|dcd|coordination)\b/, "dyspraxia"],
    [/\b(vi|visual impair|visually)\b/, "vi"],
    [/\b(hi|hearing impair|deaf)\b/, "hi"],
    [/\b(eal|esl|english as|additional language)\b/, "eal"],
    [/\b(pda|odd|demand avoid)\b/, "pda-odd"],
    [/\b(tourette)/, "tourettes"],
    [/\b(older|adult|ks4|ks5)\b/, "older-learners"],
    [/\b(working.memory|working_memory|memory.difficulties)\b/, "working-memory"],
    [/\b(semh|social.emotional|emotional.mental)\b/, "semh"],
  ];

  for (const [re, id] of matchers) {
    if (re.test(sn)) return SEND_ADAPTATION_SPECS.find(s => s.id === id) || null;
  }
  return null;
}

/**
 * Builds the SEND note block that the worksheet generator injects into its
 * system prompt. Returns empty string when no SEND adaptation applies.
 */
export function getSendNoteForWorksheet(sendNeed: string | undefined | null): string {
  const spec = resolveSendSpec(sendNeed);
  if (!spec) return "";

  const presentationList = spec.worksheetRules
    .map((rule, i) => `(${i + 1}) ${rule}`)
    .join("\n");

  // Phase 4 — content rules render as a second labelled block. Defensive
  // optional access lets older specs that haven't been migrated still load
  // (the Phase 4 PR migrates all 21, but this guards future extensions).
  const contentRules = spec.worksheetRulesContent || [];
  const contentList = contentRules
    .map((rule, i) => `(${i + 1}) ${rule}`)
    .join("\n");

  const bulletsList = spec.bullets
    .map(b => `- ${b.what}`)
    .join("\n");

  const contentBlock = contentList
    ? `\n\nCONTENT RULES — these change the SUBSTANCE of the questions (concept progression, context choice, vocabulary, cognitive demand, misconception scaffolding). Apply ALL of them on top of the presentation rules above:\n\n${contentList}`
    : "";

  return `THIS WORKSHEET IS ADAPTED FOR A STUDENT WITH ${spec.name.toUpperCase()}.

PRESENTATION RULES — these change HOW the worksheet looks and is laid out. Apply ALL of them throughout every section (these are non-negotiable):

${presentationList}${contentBlock}

The 'What will change in your worksheet' summary shown to teachers lists exactly these adaptations:
${bulletsList}

CRITICAL: SEND adaptations change HOW questions are presented AND HOW concepts are approached. The year-group curriculum content, mark allocations, awarding-body command-word vocabulary and overall academic rigour stay at the correct level for the year group — never lower the curriculum demand. Use the presentation rules to remove access barriers; use the content rules to adapt the route through the concept; keep the destination unchanged.`;
}

/**
 * Builds the SEND note block that the presentation generator injects into
 * its system prompt. Returns empty string when no SEND adaptation applies.
 */
export function getSendNoteForPresentation(sendNeed: string | undefined | null): string {
  const spec = resolveSendSpec(sendNeed);
  if (!spec) return "";

  const rulesList = spec.presentationRules
    .map((rule, i) => `(${i + 1}) ${rule}`)
    .join("\n");

  const bulletsList = spec.bullets
    .map(b => `- ${b.what}`)
    .join("\n");

  return `THIS PRESENTATION IS ADAPTED FOR PUPILS WITH ${spec.name.toUpperCase()}.
Apply ALL of the following SEND rules across every slide in the deck (non-negotiable):

${rulesList}

The published 'SEND adaptations' summary for this presentation lists exactly these changes:
${bulletsList}

CRITICAL: SEND adaptations change HOW content is presented — never the academic rigour of the lesson. Slide plan, pedagogy and curriculum accuracy stay at the correct level for the year group.`;
}

/**
 * Returns the spec table. Exported for UI components that want to display
 * "what will change" to the teacher at generation time.
 */
export function getAllSendSpecs(): SendAdaptationSpec[] {
  return SEND_ADAPTATION_SPECS;
}

// ─── Multi-need support ──────────────────────────────────────────────────────
// Real classrooms are mixed-ability — a single pupil can be ADHD + Dyslexic +
// EAL, and a teacher will routinely want to apply two or three specs at once.
// These helpers resolve an array of free-text / id inputs into a deduplicated
// list of SendAdaptationSpec, and compose the merged presentation note.

/**
 * Resolves any number of SEND need inputs (ids, labels, or free text) into
 * the deduplicated list of adaptation specs that apply. Accepts a string
 * (comma-separated tolerated) or a string[] for convenience.
 */
export function resolveSendSpecs(input: string | string[] | undefined | null): SendAdaptationSpec[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : String(input).split(/[,\n]/);
  const specs: SendAdaptationSpec[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const spec = resolveSendSpec(item);
    if (spec && !seen.has(spec.id)) {
      specs.push(spec);
      seen.add(spec.id);
    }
  }
  return specs;
}

/**
 * Merged presentation note for multiple SEND needs. If two specs conflict
 * (e.g. ADHD's "bold action verbs" vs Dyslexia's "never ALL CAPS") we output
 * BOTH rules — the LLM resolves conflicts by picking the strictest access
 * requirement, which is the correct pedagogical default.
 */
export function composeSendNoteForPresentation(input: string | string[] | undefined | null): string {
  const specs = resolveSendSpecs(input);
  if (!specs.length) return "";
  if (specs.length === 1) return getSendNoteForPresentation(specs[0].id);

  const header = `THIS PRESENTATION IS ADAPTED FOR PUPILS WITH MULTIPLE SEND NEEDS: ${specs.map(s => s.name).join(" + ").toUpperCase()}.
Apply EVERY rule from EVERY need below. When rules conflict, pick the strictest access requirement (the one that removes the most barriers for the most pupils).`;

  const blocks = specs.map(spec => {
    const rulesList = spec.presentationRules.map((r, i) => `(${i + 1}) ${r}`).join("\n");
    return `── ${spec.name} ──
${rulesList}`;
  }).join("\n\n");

  const bullets = specs.flatMap(s => s.bullets.map(b => `- [${s.name}] ${b.what}`)).join("\n");

  return `${header}

${blocks}

The published 'SEND adaptations' summary for this presentation lists every change:
${bullets}

CRITICAL: SEND adaptations change HOW content is presented — never the academic rigour of the lesson. Slide plan, pedagogy and curriculum accuracy stay at the correct level for the year group.`;
}

/**
 * Structured data for the UI banner — each applied spec with its bullets
 * and a why for each bullet. Callers render this as a collapsible panel.
 */
export interface AppliedSendAdaptation {
  id: string;
  name: string;
  changes: SendAdaptationBullet[];
}

export function getAppliedAdaptations(input: string | string[] | undefined | null): AppliedSendAdaptation[] {
  return resolveSendSpecs(input).map(s => ({ id: s.id, name: s.name, changes: s.bullets }));
}

/**
 * Reading-age ceiling implied by the selected SEND needs. The generator uses
 * this to clamp the teacher's reading-age slider so the prompt and the
 * adaptation don't disagree (e.g. Dyslexia + "age 16" is contradictory).
 */
export function getSendReadingAgeCeiling(input: string | string[] | undefined | null): number | null {
  const specs = resolveSendSpecs(input);
  if (!specs.length) return null;
  // Per-spec ceilings reflect the access requirement, not the academic level.
  // The academic level is preserved separately via differentiationLevel.
  const ceilings: Record<string, number> = {
    "mld": 10,        // "KS2 reading level throughout" — caps at ~10
    "slcn": 10,       // Max 12 words per sentence, S-V-O only
    "dyslexia": 11,   // 12 words max, generous spacing
    "eal": 11,        // Short sentences, simple grammar
    "hi": 11,         // Self-contained text, simple structures
  };
  const values = specs.map(s => ceilings[s.id]).filter((n): n is number => typeof n === "number");
  if (!values.length) return null;
  return Math.min(...values);
}

// ─── Presentation SEND theme overrides ──────────────────────────────────────
// Minimal, non-opinionated overrides each selected SEND need can apply ON TOP
// of the teacher's chosen base theme. Returned as a merge-able object so the
// presentation renderer can simply spread it over the base theme.
export interface SendThemeOverride {
  /** Override slide background (hex with #). */
  bg?: string;
  /** Override body-text colour. */
  text?: string;
  /** Force a font family (e.g. "Verdana" for Dyslexia; "Arial" for VI). */
  fontFamily?: string;
  /** Force min body font size in pt for PPTX export. */
  minBodyPt?: number;
  /** Force min title font size in pt for PPTX export. */
  minTitlePt?: number;
  /** Force line height multiplier. */
  lineHeight?: number;
  /** Enforce high-contrast dark-on-light for VI. */
  highContrast?: boolean;
  /** Ban red alarm colours (Anxiety/SEMH). */
  banAlarmRed?: boolean;
  /** Soften palette to pastel tones (Anxiety/SEMH/PDA). */
  softPalette?: boolean;
  /** Rename challenge/activity slides to invitational labels. */
  invitationalLabels?: boolean;
  /** Insert brain-break slides mid-deck. */
  insertBrainBreak?: boolean;
  /** Insert emoji check-in slides at start and end. */
  insertCheckins?: boolean;
  /** Show visible [ ] checkboxes on activity slides. */
  visibleCheckboxes?: boolean;
}

/**
 * Compose the theme override from the selected SEND needs. If no needs
 * apply, returns an empty object and the renderer uses the base theme
 * unchanged. Multiple needs merge conservatively (the stricter wins).
 */
export function getSendThemeOverride(input: string | string[] | undefined | null): SendThemeOverride {
  const specs = resolveSendSpecs(input);
  const out: SendThemeOverride = {};
  for (const spec of specs) {
    switch (spec.id) {
      case "dyslexia":
        out.bg = "#FFF8E7";           // cream — BDA recommended
        out.text = "#1A1410";
        out.fontFamily = "Verdana";    // sans-serif, wide-spaced
        out.lineHeight = 1.5;
        break;
      case "vi":
        out.highContrast = true;
        out.bg = "#FFFFFF";
        out.text = "#000000";
        out.fontFamily = "Arial";
        out.minBodyPt = 24;
        out.minTitlePt = 40;
        out.lineHeight = 1.4;
        break;
      case "anxiety":
        out.softPalette = true;
        out.banAlarmRed = true;
        out.insertCheckins = true;
        out.invitationalLabels = true;
        break;
      case "pda-odd":
        out.softPalette = true;
        out.invitationalLabels = true;
        break;
      case "adhd":
        out.visibleCheckboxes = true;
        out.insertBrainBreak = true;
        break;
      case "eal":
      case "slcn":
      case "hi":
        // These need predictable, uncluttered layouts; min body 20pt for HI
        // but no palette override.
        out.minBodyPt = Math.max(out.minBodyPt || 0, 20);
        break;
      case "tourettes":
        out.banAlarmRed = true;
        out.softPalette = true;
        break;
      case "mld":
        out.lineHeight = Math.max(out.lineHeight || 0, 1.4);
        out.minBodyPt = Math.max(out.minBodyPt || 0, 18);
        break;
    }
  }
  return out;
}
