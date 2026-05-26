/**
 * English — primary diagram catalogue (Y1–Y6).
 * Target: ~250 entries.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // ── Phase 2–5 phonics phoneme cards (KS1, ~44 phonemes) ───────────────────
  const PHONEMES = [
    // Phase 2
    ["s", "snake hissing"], ["a", "apple"], ["t", "tap"], ["p", "pencil"], ["i", "insect"],
    ["n", "net"], ["m", "mouse"], ["d", "dog"], ["g", "girl"], ["o", "octopus"],
    ["c", "cat"], ["k", "kite"], ["ck", "duck"], ["e", "egg"], ["u", "umbrella"],
    ["r", "rabbit"], ["h", "hat"], ["b", "bee"], ["f", "fish"], ["l", "lion"],
    // Phase 3 digraphs/trigraphs
    ["ch", "chair"], ["sh", "shop"], ["th (voiced)", "the"], ["th (unvoiced)", "thumb"], ["ng", "ring"],
    ["ai", "snail"], ["ee", "tree"], ["igh", "light"], ["oa", "boat"], ["oo (long)", "moon"],
    ["oo (short)", "book"], ["ar", "star"], ["or", "fork"], ["ur", "burger"], ["ow", "cow"],
    ["oi", "coin"], ["ear", "ear"], ["air", "chair"], ["ure", "treasure"], ["er", "hammer"],
    // Phase 5 alternatives
    ["ay", "tray"], ["ou", "house"], ["ie", "pie"], ["ea", "leaf"], ["oy", "boy"],
    ["ir", "girl"], ["ue", "blue"], ["aw", "claw"], ["wh", "whale"], ["ph", "phone"],
    ["ew", "stew"], ["oe", "toe"], ["au", "sauce"], ["ey", "key"], ["a-e", "cake"],
    ["i-e", "bike"], ["o-e", "bone"], ["u-e", "tune"], ["e-e", "Pete"], ["ce", "ice"],
    ["ge", "cage"],
  ];
  for (const [grapheme, mnemonic] of PHONEMES) {
    ctx.add({
      title: `Phoneme card — ${grapheme} (${mnemonic})`,
      subject: "English",
      topic: "Phonics",
      year_group: "Year 1",
      description: `Card showing the grapheme "${grapheme}" large at top, a friendly illustration of "${mnemonic}" below, and the example word printed underneath.`,
      style_notes: "Letter in pale outline with stroke arrows, illustration in cartoon style, example word in handwriting font",
      tags: ["phonics", "phoneme", "grapheme", "KS1", "Letters-and-Sounds"],
    });
  }

  // Letter formation cards a..z — 26
  const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
  for (const l of LETTERS) {
    ctx.add({
      title: `Letter formation — lowercase ${l}`,
      subject: "English",
      topic: "Handwriting",
      year_group: "Year 1",
      description: `Lowercase letter ${l} shown large with numbered red arrows for the stroke order; dotted starting position; baseline and x-height guides.`,
      style_notes: "Pale letter outline with bold red sequence arrows, dashed handwriting guidelines",
      tags: ["handwriting", "letter-formation", "lowercase", "KS1"],
    });
  }
  // Uppercase A..Z — 26
  for (const l of LETTERS) {
    const U = l.toUpperCase();
    ctx.add({
      title: `Letter formation — uppercase ${U}`,
      subject: "English",
      topic: "Handwriting",
      year_group: "Year 1",
      description: `Uppercase letter ${U} with stroke order arrows for handwriting practice.`,
      style_notes: "Pale outline with red sequence arrows, baseline + cap-height guides",
      tags: ["handwriting", "letter-formation", "uppercase", "KS1"],
    });
  }

  // Tricky words / common exception words (KS1) — 20
  const TRICKY = [
    "the","to","I","no","go","he","she","we","you","they","are","my",
    "her","said","have","like","so","were","there","one",
  ];
  for (const w of TRICKY) {
    ctx.add({
      title: `Tricky word card — ${w}`,
      subject: "English",
      topic: "Tricky words",
      year_group: "Year 1",
      description: `Word "${w}" displayed large in handwriting font with the tricky part highlighted in red, plus an icon hinting at meaning where applicable.`,
      style_notes: "Friendly font, tricky letters in red, optional supporting icon",
      tags: ["tricky-words", "common-exception-words", "phonics", "KS1"],
    });
  }

  // Story characters — KS1 narrative scenes — 16
  const CHARACTERS = [
    "child reading a book", "teacher pointing at a board", "dog with a ball", "cat curled up",
    "dragon with friendly smile", "knight in armour", "princess with a crown", "pirate captain",
    "alien with three eyes", "giant with a beanstalk", "wizard with wand",
    "fairy with wings", "smiley monster", "robot waving", "astronaut floating",
    "firefighter with hose",
  ];
  for (const c of CHARACTERS) {
    ctx.add({
      title: `Story character card — ${c}`,
      subject: "English",
      topic: "Story writing",
      year_group: "Year 2",
      description: `Single character illustration with a name plate placeholder and a thought bubble.`,
      style_notes: "Soft outlines, pastel fills, child-friendly proportions",
      tags: ["story", "character", "writing", "KS1"],
    });
  }

  // Story settings — 16
  const SETTINGS = [
    "magical forest", "sandy beach", "school playground", "cosy living room", "busy market",
    "old castle on a hill", "spooky cave", "underwater coral reef", "snowy mountain", "jungle clearing",
    "tropical island", "winding river", "city skyline",
    "farm yard", "spaceship interior", "treetop tree-house",
  ];
  for (const s of SETTINGS) {
    ctx.add({
      title: `Story setting card — ${s}`,
      subject: "English",
      topic: "Story writing",
      year_group: "Year 2",
      description: `Illustrated landscape/scene card to spark setting descriptions; sense-prompt boxes (see / hear / smell / touch / taste) printed below.`,
      style_notes: "Wide aspect, atmospheric palette appropriate to setting",
      tags: ["story", "setting", "description", "writing", "five-senses"],
    });
  }

  // Story actions / verbs — 14
  const ACTIONS = [
    "running", "climbing", "hiding", "sharing", "helping", "finding", "building",
    "flying", "sleeping", "jumping", "swimming", "drawing",
    "dancing", "singing",
  ];
  for (const a of ACTIONS) {
    ctx.add({
      title: `Action verb card — ${a}`,
      subject: "English",
      topic: "Word classes",
      year_group: "Year 2",
      description: `Cartoon child performing the action "${a}", word printed underneath.`,
      style_notes: "Single child motif, clear motion lines",
      tags: ["verb", "action", "word-class", "KS1"],
    });
  }

  // Punctuation icon cards — 18
  emitTitled(ctx, {
    subject: "English",
    topic: "Punctuation",
    year_group: "Year 3",
    description: "Large punctuation mark on a coloured card with a friendly mascot and a one-line job description.",
    style_notes: "Mascot with sign showing the mark, one-line caption beneath",
    tags: ["punctuation", "spag", "KS2"],
  }, [
    "Punctuation — full stop", "Punctuation — comma", "Punctuation — question mark",
    "Punctuation — exclamation mark", "Punctuation — apostrophe (omission)", "Punctuation — apostrophe (possession)",
    "Punctuation — speech marks", "Punctuation — colon", "Punctuation — semicolon",
    "Punctuation — hyphen", "Punctuation — dash", "Punctuation — brackets (parentheses)",
    "Punctuation — ellipsis", "Punctuation — bullet point", "Punctuation — capital letter",
    "Punctuation — fronted-adverbial comma", "Punctuation — single quotation marks", "Punctuation — slash",
  ]);

  // Word-class colour wheel + per-class anchor diagrams — 14
  ctx.add({
    title: "Word class colour wheel",
    subject: "English",
    topic: "Word classes",
    year_group: "Year 3",
    description: "Pie-style wheel showing 9 word classes (noun, verb, adjective, adverb, pronoun, preposition, conjunction, determiner, interjection) each in a distinctive colour.",
    style_notes: "Equal segments, colour-coded labels",
    tags: ["word-class", "grammar", "spag"],
  });
  emitTitled(ctx, {
    subject: "English",
    topic: "Word classes",
    year_group: "Year 3",
    description: "Anchor card defining a word class with three example words and a sentence using one in colour.",
    style_notes: "Header strip in the word-class colour, examples in bullet list, sentence with target word highlighted",
    tags: ["word-class", "grammar", "anchor-card"],
  }, [
    "Anchor card — Nouns", "Anchor card — Proper nouns", "Anchor card — Pronouns",
    "Anchor card — Verbs", "Anchor card — Adjectives", "Anchor card — Adverbs",
    "Anchor card — Prepositions", "Anchor card — Conjunctions", "Anchor card — Determiners",
    "Anchor card — Interjections", "Anchor card — Modal verbs", "Anchor card — Auxiliary verbs",
    "Anchor card — Articles (a / an / the)",
  ]);

  // Sentence-types diagrams — 8
  emitTitled(ctx, {
    subject: "English",
    topic: "Sentence types",
    year_group: "Year 4",
    description: "Sentence broken into coloured boxes by clause/phrase, with role labels.",
    style_notes: "Subject in blue, verb in red, object in green, fronted adverbial in purple",
    tags: ["sentence", "clause", "spag"],
  }, [
    "Sentence type — simple",
    "Sentence type — compound (with FANBOYS)",
    "Sentence type — complex (subordinate clause first)",
    "Sentence type — complex (main clause first)",
    "Sentence type — exclamatory (How / What)",
    "Sentence type — imperative (command)",
    "Sentence type — interrogative (question)",
    "Sentence type — embedded clause example",
  ]);

  // Subject–verb–object diagrams — 5
  emitTitled(ctx, {
    subject: "English",
    topic: "Sentence structure",
    year_group: "Year 4",
    description: "Sentence in three coloured cells: Subject / Verb / Object, with arrows.",
    style_notes: "Three cells in a row, role label above each",
    tags: ["sentence-structure", "SVO", "grammar"],
  }, [
    "SVO — The cat (S) chased (V) the mouse (O)",
    "SVO — Sam (S) painted (V) a beautiful picture (O)",
    "SVO — My team (S) won (V) the trophy (O)",
    "SVO — The chef (S) prepared (V) lunch (O)",
    "SVO — The audience (S) clapped (V) loudly (adverbial)",
  ]);

  // Tense timelines — 6
  emitTitled(ctx, {
    subject: "English",
    topic: "Verb tenses",
    year_group: "Year 4",
    description: "Horizontal timeline showing past / present / future with example sentences placed above each section.",
    style_notes: "Arrow timeline, three coloured sections, sample sentences in speech bubbles",
    tags: ["tense", "verb", "grammar"],
  }, [
    "Tense timeline — simple past / present / future",
    "Tense timeline — past progressive (was -ing)",
    "Tense timeline — present perfect (have/has + past participle)",
    "Tense timeline — future continuous (will be -ing)",
    "Tense timeline — past perfect (had + past participle)",
    "Tense timeline — irregular past tense list (ran/went/saw)",
  ]);

  // Suffix / prefix wheels — 6
  emitTitled(ctx, {
    subject: "English",
    topic: "Spelling patterns",
    year_group: "Year 3",
    description: "Wheel with a root word in the centre and prefixes/suffixes around the rim, forming complete derived words.",
    style_notes: "Central yellow circle for root, blue spokes for affixes, words on rim",
    tags: ["spelling", "prefix", "suffix", "morphology"],
  }, [
    "Affix wheel — root 'play' (+s, +ed, +ing, re-, +ful)",
    "Affix wheel — root 'happy' (un-, +ness, +ly, +er)",
    "Affix wheel — root 'help' (+er, +ful, +less, un-, +ing)",
    "Prefix poster — un-, dis-, mis-, in-, re-, pre-",
    "Suffix poster — -ment, -ness, -tion, -ly, -er, -est",
    "Affix wheel — root 'kind' (un-, +ness, +ly, +er)",
  ]);

  // Story planning frames — 8
  emitTitled(ctx, {
    subject: "English",
    topic: "Story planning",
    year_group: "Year 4",
    description: "Visual story-planning frame for narrative writing.",
    style_notes: "Large boxes with prompts, illustrated icons in each box",
    tags: ["story", "planning", "writing-frame"],
  }, [
    "Story mountain — 5 stages",
    "Beginning–Middle–End frame",
    "Setting + 3 events + ending frame",
    "Problem–Resolution flowchart",
    "Five Ws planner (Who/What/Where/When/Why)",
    "Character / setting / problem / solution grid",
    "Comic strip — 6 panel template",
    "Comic strip — 9 panel template",
  ]);

  // Vocabulary fans / word mats — 6
  emitTitled(ctx, {
    subject: "English",
    topic: "Vocabulary",
    year_group: "Year 4",
    description: "Word fan / mat showing synonyms grouped by intensity for use in descriptive writing.",
    style_notes: "Fan layout with words on the slats, colour-graded by intensity",
    tags: ["vocabulary", "synonyms", "writing-aid"],
  }, [
    "Word fan — said synonyms (whispered, shouted, mumbled, exclaimed)",
    "Word fan — happy synonyms (cheerful, delighted, ecstatic)",
    "Word fan — sad synonyms",
    "Word fan — angry synonyms",
    "Word fan — walked synonyms",
    "Word mat — describing weather",
  ]);

  // Show-don't-tell visuals — 6
  emitTitled(ctx, {
    subject: "English",
    topic: "Descriptive writing",
    year_group: "Year 5",
    description: "Two-column card showing a 'tell' sentence on the left and a 'show' rewrite on the right with body-language icons.",
    style_notes: "Left column pale grey 'before', right column coloured 'after', arrow between",
    tags: ["show-dont-tell", "description", "writing"],
  }, [
    "Show-don't-tell — He was scared",
    "Show-don't-tell — She was angry",
    "Show-don't-tell — They were tired",
    "Show-don't-tell — He was excited",
    "Show-don't-tell — She was nervous",
    "Show-don't-tell — He was bored",
  ]);

  // Poetic device cards — 12
  emitTitled(ctx, {
    subject: "English",
    topic: "Poetry",
    year_group: "Year 5",
    description: "Card defining a poetic device with a kid-friendly example and a small icon.",
    style_notes: "Coloured header strip, definition in friendly font, example in italics",
    tags: ["poetry", "literary-devices"],
  }, [
    "Device card — Simile (like / as)",
    "Device card — Metaphor",
    "Device card — Personification",
    "Device card — Alliteration",
    "Device card — Onomatopoeia",
    "Device card — Rhyme",
    "Device card — Rhythm",
    "Device card — Repetition",
    "Device card — Hyperbole",
    "Device card — Assonance",
    "Device card — Imagery",
    "Device card — Symbolism",
  ]);

  // Poetry form templates — 10
  emitTitled(ctx, {
    subject: "English",
    topic: "Poetry",
    year_group: "Year 5",
    description: "Blank template for a poetry form with line counts and syllable counts marked.",
    style_notes: "Each line shown as a writing rule, syllable boxes underneath",
    tags: ["poetry", "form", "template"],
  }, [
    "Poetry template — Acrostic", "Poetry template — Haiku (5-7-5)",
    "Poetry template — Cinquain", "Poetry template — Limerick (AABBA)",
    "Poetry template — Kenning", "Poetry template — Calligram (shape)",
    "Poetry template — Free verse with stanza guide", "Poetry template — Ballad (4-line stanzas)",
    "Poetry template — List poem", "Poetry template — Riddle",
  ]);

  // Reading comprehension visuals — 10
  emitTitled(ctx, {
    subject: "English",
    topic: "Reading comprehension",
    year_group: "Year 4",
    description: "Visual scaffold for a comprehension skill (retrieval, inference, prediction etc.).",
    style_notes: "Stepped boxes / arrows, friendly colour palette",
    tags: ["reading", "comprehension", "skills"],
  }, [
    "VIPERS poster — 6 question types",
    "Inference iceberg — surface vs hidden",
    "Prediction frame — clue + guess",
    "Retrieval bookmark",
    "Summarising — 5W finger frame",
    "Author's intent diagram",
    "Cause and effect chart",
    "Compare and contrast Venn (book vs film)",
    "Reading log icon set",
    "Reciprocal reading roles wheel",
  ]);

  // Persuasive / non-fiction visuals — 12
  emitTitled(ctx, {
    subject: "English",
    topic: "Non-fiction writing",
    year_group: "Year 5",
    description: "Anchor or planning visual for a non-fiction text type.",
    style_notes: "Coloured header per text type, structure laid out in stacked boxes",
    tags: ["non-fiction", "text-types"],
  }, [
    "Text type — Recount structure",
    "Text type — Instructions (numbered + ingredients)",
    "Text type — Explanation (cause–effect chain)",
    "Text type — Persuasive (point, evidence, explain)",
    "Text type — Discussion (for / against)",
    "Text type — Newspaper report (5W headline)",
    "Text type — Letter (address, opening, body, sign-off)",
    "Text type — Diary entry frame",
    "Text type — Biography timeline",
    "Text type — Information report (intro / sections / conclusion)",
    "Text type — Book review template",
    "Text type — Advert layout (logo / slogan / image / detail)",
  ]);

  // Spelling rule posters — 7
  emitTitled(ctx, {
    subject: "English",
    topic: "Spelling patterns",
    year_group: "Year 4",
    description: "Spelling rule shown as a step-by-step 'when this, do that' diagram with examples.",
    style_notes: "Headline rule in bold, examples in bullet list, exception box in red",
    tags: ["spelling", "rule"],
  }, [
    "Spelling — i before e except after c",
    "Spelling — drop the e before -ing",
    "Spelling — double the consonant before -ed/-ing",
    "Spelling — change y to i (happy → happiest)",
    "Spelling — plurals -s vs -es / -y → -ies",
    "Spelling — homophones (their/there/they're)",
    "Spelling — silent letters (kn, wr, mb)",
  ]);

  // Drama / role-play scene cards — 6
  emitTitled(ctx, {
    subject: "English",
    topic: "Speaking and listening",
    year_group: "Year 4",
    description: "Role-play scene card with two characters, a setting and a starter line of dialogue.",
    style_notes: "Two character icons, speech bubble, setting badge",
    tags: ["drama", "role-play", "speaking"],
  }, [
    "Drama card — at the lost-property office",
    "Drama card — explorers in a cave",
    "Drama card — restaurant complaint",
    "Drama card — TV news interview",
    "Drama card — astronauts on Mars",
    "Drama card — historical witness statement",
  ]);

  // Letter join / cursive examples — 5
  emitTitled(ctx, {
    subject: "English",
    topic: "Handwriting",
    year_group: "Year 3",
    description: "Pair of joined letters with arrows showing the joining stroke.",
    style_notes: "Cursive font, arrows show diagonal join",
    tags: ["handwriting", "joining", "cursive"],
  }, [
    "Cursive joins — diagonal join 'ch'",
    "Cursive joins — horizontal join 'wo'",
    "Cursive joins — diagonal-to-ascender 'th'",
    "Cursive joins — horizontal-to-ascender 'ol'",
    "Cursive joins — break-letter (b, p, q, g, j) example",
  ]);

  // Reading-for-pleasure / book-corner mascots — 6
  emitTitled(ctx, {
    subject: "English",
    topic: "Reading for pleasure",
    year_group: "Year 1",
    description: "Friendly book mascot pose for use as a recurring reading-corner illustration.",
    style_notes: "Bea-the-bookworm character, varied costume per pose",
    tags: ["reading", "mascot", "branding"],
  }, [
    "Mascot — Bea reading on a beanbag",
    "Mascot — Bea pointing at a chapter title",
    "Mascot — Bea recommending a book",
    "Mascot — Bea sharing a book with a friend",
    "Mascot — Bea reading under a torch (bedtime)",
    "Mascot — Bea celebrating finishing a book",
  ]);
}
