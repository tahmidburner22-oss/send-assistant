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
      sectionA: "Section A — Quick Start (3 questions)",
      sectionB: "Section B — Main Practice (5 questions)",
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
      { what: "'What you need to do' box added before every section",
        why: "Removes ambiguity and reduces anxiety caused by unstated expectations." },
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
      "Every section begins with a 'What you need to do:' box listing exact steps.",
      "Place a fully worked example immediately before Section A, using identical wording and structure to Section A's questions.",
      "Use one word per concept. Never mix synonyms (pick either 'calculate' OR 'work out' — stick to it everywhere).",
      "Use literal, unambiguous language. No idioms, no figurative language (write 'calculate the value of x', not 'find x').",
      "Contexts must be neutral and factual. No social scenarios, no emotions.",
      "Reflection is a tick-box checklist: '[ ] I completed Section A   [ ] I completed Section B   [ ] I tried the Challenge'.",
      "Use identical layout across every section — predictable is the goal.",
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
      { what: "All instructions written in full — no reliance on verbal explanation",
        why: "Worksheet must be fully self-contained." },
      { what: "Word Bank with definitions for all key terms",
        why: "Compensates for gaps in incidental (listening-based) vocabulary learning." },
      { what: "Every question contains all necessary information within itself",
        why: "Prevents frustration when clarification can't be easily requested." },
      { what: "Visual diagrams and supports alongside every text question",
        why: "Visual channel is often the primary learning route." },
      { what: "No audio-dependent content or references to listening tasks",
        why: "Audio-only content creates an insurmountable barrier." },
    ],
    worksheetRules: [
      "All instructions written in full on the page. Never 'as explained earlier' or 'as your teacher said'.",
      "Include a Word Bank with plain-English definitions for every key term used.",
      "Every question contains ALL information it needs — no cross-references to other pages.",
      "Each text question has a matching visual diagram or support beside it.",
      "No reference to audio, listening, or 'what the teacher said'. All assessment is text-and-visual.",
      "Worked example written out in full — no reliance on verbal narration.",
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
  return (input || "").toLowerCase().trim();
}

/**
 * Resolves a free-text / partial SEND need label to the canonical spec id.
 * Returns null when no SEND adaptation applies.
 */
export function resolveSendSpec(sendNeed: string | undefined | null): SendAdaptationSpec | null {
  const sn = normaliseSendKey(sendNeed);
  if (!sn || sn === "none" || sn === "none-selected" || sn === "general") return null;

  // Order matters — "asc" must beat the generic "autism" match for asperger etc.
  const matchers: Array<[RegExp, string]> = [
    [/\b(adhd)\b/, "adhd"],
    [/\b(dyslexia)\b/, "dyslexia"],
    [/\b(dyscalculia)\b/, "dyscalculia"],
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

  const rulesList = spec.worksheetRules
    .map((rule, i) => `(${i + 1}) ${rule}`)
    .join("\n");

  const bulletsList = spec.bullets
    .map(b => `- ${b.what}`)
    .join("\n");

  return `THIS WORKSHEET IS ADAPTED FOR A STUDENT WITH ${spec.name.toUpperCase()}.
Apply ALL of the following SEND rules throughout every section (these are non-negotiable):

${rulesList}

The 'What will change in your worksheet' summary shown to teachers lists exactly these adaptations:
${bulletsList}

CRITICAL: SEND adaptations change HOW questions are presented — never the academic rigour. Curriculum content, mark allocations, and question difficulty stay at the correct level for the year group.`;
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
