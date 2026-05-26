/**
 * GCSE English Language — diagram catalogue (Year 10–11).
 *
 * Target: ~80 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "English Language", year_band: "GCSE" };
const STYLE_FRAME = "Boxed planner with dotted writing lines, headings in coloured pills";
const TAGS = ["GCSE", "english-language"];

export function build(ctx) {
  emitTitled(ctx, {
    ...COMMON,
    topic: "Reading — fiction (Paper 1)",
    year_group: "Year 10",
    description: "Paper-1 reading scaffold diagram for GCSE Eng Lang.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS, "paper-1", "reading"],
  }, [
    "Paper 1 Q1 — list four things, retrieval card",
    "Paper 1 Q2 — language analysis frame",
    "Paper 1 Q3 — structure analysis frame",
    "Paper 1 Q4 — evaluation frame (to what extent...)",
    "Inference iceberg — surface vs deeper meaning",
    "Aristotle's appeals — ethos / pathos / logos triangle",
    "Metaphor unpacking card — vehicle / tenor / ground",
    "Tone thermometer — mood across an extract",
    "Setting / atmosphere five-senses planner",
    "Annotation key — circle vocab / underline imagery / box structure",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Writing — fiction (Paper 1 Q5)",
    year_group: "Year 10",
    description: "Paper-1 Q5 narrative / descriptive planner.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS, "paper-1", "writing", "narrative"],
  }, [
    "Dystopian opening planner — sensory hook + setting + ominous detail",
    "Cyclical structure planner — opening reflected in ending",
    "In-medias-res opening planner",
    "Five-act story mountain (for Q5)",
    "Show-don't-tell flip card",
    "Powerful verbs bank — varying SAID",
    "Ambitious adjectives bank",
    "Sentence-length variety strip — short for impact / long for description",
    "Paragraph structure — TipToP card",
    "Dialogue rules card — punctuation",
    "Foreshadowing planner — early clue, late payoff",
    "Symbolism planner — recurring motif",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Reading — non-fiction (Paper 2)",
    year_group: "Year 11",
    description: "Paper-2 reading scaffold diagram.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS, "paper-2", "reading", "non-fiction"],
  }, [
    "Paper 2 Q1 — true/false retrieval card",
    "Paper 2 Q2 — summary frame (compare two sources)",
    "Paper 2 Q3 — language analysis frame",
    "Paper 2 Q4 — comparison of viewpoints frame",
    "19th- vs 21st-century non-fiction comparison Venn",
    "Form / audience / purpose triangle",
    "Bias detector — loaded language card",
    "Source utility — provenance / content / context grid",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Writing — non-fiction (Paper 2 Q5)",
    year_group: "Year 11",
    description: "Paper-2 Q5 transactional writing planner.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS, "paper-2", "writing", "non-fiction"],
  }, [
    "Letter — formal layout (sender, date, recipient, body, sign-off)",
    "Letter — informal layout",
    "Article — newspaper layout (headline, byline, columns)",
    "Article — magazine layout (pull-quote, sub-heading)",
    "Speech — addressee / hook / signposting / call-to-action",
    "Leaflet layout — fold-panel grid",
    "Report — title / introduction / findings / recommendation",
    "Review — film / book / restaurant rating frame",
    "AFOREST persuasive techniques poster",
    "DAFOREST persuasive techniques poster",
    "Counter-argument bridge — concede then refute",
    "Discursive essay structure — for / against / balanced view",
    "Triplet of three planner",
    "Rhetorical question planner",
    "Anaphora planner — repeating sentence starters",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Spoken language and SPaG",
    year_group: "Year 10",
    description: "Spoken-language / SPaG scaffold for GCSE Eng Lang.",
    style_notes: "Coloured pill per term, definition and example beneath",
    tags: [...TAGS, "SPaG", "spoken-language"],
  }, [
    "Word-class wheel — 9-class card",
    "Sentence types — simple / compound / complex / compound-complex",
    "Active vs passive voice flip card",
    "Direct vs reported speech card",
    "Punctuation precision — colon vs semicolon vs dash",
    "Apostrophe — possession vs contraction",
    "Tense card — past / present / future + perfect aspect",
    "Modal verbs card — possibility, obligation, permission",
    "Standard English vs dialect card",
    "Spoken-language endorsement — speech structure planner",
    "Spoken-language endorsement — Q&A planning grid",
    "Levels of formality — register sliding scale",
  ]);
}
