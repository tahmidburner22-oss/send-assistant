/**
 * KS3 English — diagram catalogue (Year 7–9).
 *
 * Anchored to the DfE KS3 English Programme of Study. Diagrams are
 * planning scaffolds, structure visualisers and analysis frames — never
 * verbatim text from copyrighted set works.
 *
 * Target: ~80 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "English", year_band: "KS3" };
const STYLE_FRAME = "Boxed planner with dotted writing lines, headings in coloured pills";
const TAGS_KS3 = ["KS3", "english"];

export function build(ctx) {
  // ── Reading — fiction analysis frames ─────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Reading fiction",
    year_group: "Year 7",
    description: "Analysis-frame diagram for KS3 fiction reading.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS_KS3, "reading", "analysis"],
  }, [
    "PEE paragraph frame — Point / Evidence / Explain",
    "PETAL paragraph frame — Point / Evidence / Technique / Analysis / Link",
    "What / How / Why analysis frame",
    "Inference iceberg — surface vs deeper meaning",
    "Reading triangle — text / writer / reader",
    "Three-level questions — literal / inferential / evaluative",
    "Annotation key — circle vocab, underline imagery, box structure",
    "Quotation sandwich — lead-in, quote, comment",
    "Zoom in / zoom out analysis ladder",
    "Connotations web — single word at the centre",
    "Mood thermometer — tone shifts across an extract",
    "Setting / atmosphere five-senses planner",
  ]);

  // ── Literary techniques and form ──────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Literary techniques",
    year_group: "Year 8",
    description: "Single literary-technique flashcard with definition and unlabelled example slot.",
    style_notes: "Term in bold pill, definition in 12pt, example slot in dashed box",
    tags: [...TAGS_KS3, "literary-techniques", "vocabulary"],
  }, [
    "Technique card — simile",
    "Technique card — metaphor",
    "Technique card — personification",
    "Technique card — alliteration",
    "Technique card — sibilance",
    "Technique card — onomatopoeia",
    "Technique card — pathetic fallacy",
    "Technique card — symbolism",
    "Technique card — foreshadowing",
    "Technique card — juxtaposition",
    "Technique card — oxymoron",
    "Technique card — hyperbole",
    "Technique card — irony (verbal, dramatic, situational)",
    "Technique card — semantic field",
    "Technique card — caesura",
    "Technique card — enjambment",
    "Technique card — repetition (anaphora / epistrophe)",
    "Technique card — rule of three",
  ]);

  // ── Writing — narrative, descriptive, transactional ──────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Writing — narrative",
    year_group: "Year 8",
    description: "Narrative-structure planning diagram for KS3.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS_KS3, "writing", "narrative"],
  }, [
    "Freytag's pyramid — exposition / rising action / climax / falling action / resolution",
    "Story mountain — five-stage planner",
    "Five-act structure — Shakespearean stages",
    "Show-don't-tell five-senses scaffolder",
    "Dialogue rules card — new speaker, new line",
    "Character profile sheet — appearance / actions / motivation",
    "Conflict types card — person vs person / self / nature / society",
    "In-medias-res opening planner",
    "Cyclical structure — opening reflected in ending",
    "Setting description grid — see / hear / smell / touch / taste / feel",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Writing — descriptive",
    year_group: "Year 7",
    description: "Descriptive-writing scaffold visual.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS_KS3, "writing", "descriptive"],
  }, [
    "Zoom-in technique — wide shot to close-up planner",
    "Show-don't-tell flip card",
    "Five-senses planner (sight/sound/smell/touch/taste)",
    "Personification weather web",
    "Colour-mood association palette",
    "Verbs ladder — walked / strolled / ambled / sauntered",
    "Adjective bank — rich vocabulary chart",
    "Powerful verbs bank chart",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Writing — transactional",
    year_group: "Year 9",
    description: "Non-fiction writing-form layout diagram.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS_KS3, "writing", "non-fiction"],
  }, [
    "Letter layout — formal letter (sender, date, recipient, body, sign-off)",
    "Letter layout — informal letter",
    "Newspaper article layout — headline, byline, image, columns",
    "Magazine article layout — pull-quotes, sub-headings",
    "Speech layout — addressee, hook, signposting",
    "Article structure — funnel (broad → specific → broad)",
    "AFOREST persuasive techniques poster",
    "DAFOREST persuasive techniques poster",
    "Triplet of three planner",
    "Rhetorical question planner",
    "Counter-argument bridge — concede then refute",
    "Discursive essay structure — for / against / balanced view",
  ]);

  // ── Grammar and SPaG ──────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Grammar and punctuation",
    year_group: "Year 7",
    description: "KS3 grammar reference card.",
    style_notes: "Single colour pill per word class, example sentence beneath",
    tags: [...TAGS_KS3, "grammar", "SPaG"],
  }, [
    "Word classes wheel — noun / verb / adjective / adverb / pronoun / preposition / conjunction / determiner",
    "Sentence types — simple / compound / complex / compound-complex",
    "Subordinate-clause sandwich diagram",
    "Active vs passive voice — flip card",
    "Direct vs indirect (reported) speech card",
    "Comma splice — wrong vs right",
    "Semicolon use — joining two main clauses",
    "Colon use — list, explanation, quotation",
    "Apostrophe — possession (singular / plural)",
    "Apostrophe — contraction",
    "Brackets, dashes and commas — parenthesis trio card",
    "Tense timeline — past / present / future",
  ]);

  // ── Set-text relationship maps (copyright-safe, simplified) ──────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Set texts (KS3 staples)",
    year_group: "Year 9",
    description: "Simplified character-relationship map — silhouettes only, arrows label relationships, no copyrighted text.",
    style_notes: "Silhouette portraits in grey, coloured arrows for ally / rival / family / mentor",
    tags: [...TAGS_KS3, "set-text", "character-map", "copyright-safe"],
  }, [
    "Character map — Romeo and Juliet (KS3 introduction, families opposed)",
    "Character map — A Midsummer Night's Dream (lovers / mechanicals / fairies)",
    "Character map — The Tempest (Prospero, Miranda, Ariel, Caliban, court)",
    "Character map — Oliver Twist (Oliver, Fagin's gang, the Brownlows)",
    "Character map — Great Expectations (Pip, Estella, Miss Havisham, Magwitch)",
    "Character map — Treasure Island (Jim, Long John Silver, the crew)",
    "Character map — Animal Farm (Napoleon, Snowball, Boxer, the humans)",
    "Character map — Lord of the Flies (Ralph, Jack, Piggy, Simon, Roger) — KS3 entry-level only",
  ]);

  // ── Poetry and Shakespeare frames ────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Poetry analysis",
    year_group: "Year 8",
    description: "Poetry-analysis frame for KS3.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS_KS3, "poetry", "analysis"],
  }, [
    "SMILE poetry frame — Structure / Meaning / Imagery / Language / Effect",
    "FLIRT poetry frame — Form / Language / Imagery / Rhythm / Tone",
    "Sonnet structure — 14 lines, volta, rhyme scheme template",
    "Iambic pentameter scansion strip",
    "Stanza diagram — couplet / tercet / quatrain / sestet / octet",
    "Rhyme-scheme labelling — ABAB CDCD EFEF GG",
    "Speaker / poet / persona triangle",
    "Comparing poems Venn — similarities and differences",
  ]);
}
