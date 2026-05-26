/**
 * GCSE English Literature — diagram catalogue (Year 10–11).
 *
 * Anchored to AQA, Pearson Edexcel, OCR, WJEC Eduqas English Literature
 * specifications. All set-text material is COPYRIGHT-SAFE: simplified
 * silhouette character maps with relationship arrows, never excerpted
 * text from the works themselves.
 *
 * Target: ~140 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "English Literature", year_band: "GCSE" };
const STYLE_FRAME = "Boxed planner with dotted writing lines, headings in coloured pills";
const STYLE_MAP = "Silhouette portraits in grey, coloured arrows for ally / rival / family / mentor, no copyrighted text";
const TAGS = ["GCSE", "english-literature"];

export function build(ctx) {
  // ── Set-text character relationship maps (copyright-safe) ────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Macbeth (Shakespeare)",
    year_group: "Year 10",
    description: "Simplified character-relationship map for Macbeth — silhouettes only, arrows label relationships, no copyrighted text.",
    style_notes: STYLE_MAP,
    tags: [...TAGS, "set-text", "shakespeare", "macbeth", "character-map"],
  }, [
    "Character map — Macbeth (key relationships)",
    "Character map — Macbeth and Lady Macbeth tension",
    "Character map — the Witches and prophecies",
    "Plot mountain — Macbeth five-act structure",
    "Themes web — ambition / power / kingship / fate / appearance",
    "Character arc graph — Macbeth's morality across acts",
    "Character arc graph — Lady Macbeth's morality across acts",
    "Context timeline — Jacobean England (Gunpowder Plot, divine right)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Romeo and Juliet (Shakespeare)",
    year_group: "Year 10",
    description: "Simplified character-relationship map for Romeo and Juliet — silhouettes only.",
    style_notes: STYLE_MAP,
    tags: [...TAGS, "set-text", "shakespeare", "romeo-juliet", "character-map"],
  }, [
    "Character map — Capulet vs Montague households",
    "Character map — Romeo, Juliet and the friars",
    "Plot mountain — Romeo and Juliet five-act structure",
    "Themes web — love / fate / honour / youth",
    "Context timeline — Elizabethan attitudes to love and marriage",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "An Inspector Calls (Priestley)",
    year_group: "Year 10",
    description: "Simplified character-relationship map for An Inspector Calls.",
    style_notes: STYLE_MAP,
    tags: [...TAGS, "set-text", "an-inspector-calls", "character-map"],
  }, [
    "Character map — Birling family and the Inspector",
    "Character map — older vs younger generation contrast",
    "Themes web — class / responsibility / gender / age",
    "Plot diagram — three-act structure",
    "Context timeline — Edwardian England 1912 vs post-war 1945",
    "Stage diagram — single dining-room set",
    "Character arc — Sheila Birling's journey",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "A Christmas Carol (Dickens)",
    year_group: "Year 10",
    description: "Simplified character-relationship map for A Christmas Carol.",
    style_notes: STYLE_MAP,
    tags: [...TAGS, "set-text", "christmas-carol", "character-map"],
  }, [
    "Character map — Scrooge and the three spirits",
    "Character map — Cratchit family",
    "Plot diagram — five-stave structure",
    "Themes web — redemption / poverty / family / time",
    "Character arc — Scrooge's transformation",
    "Context timeline — Victorian poverty and the Poor Laws",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Lord of the Flies (Golding)",
    year_group: "Year 11",
    description: "Simplified character-relationship map for Lord of the Flies.",
    style_notes: STYLE_MAP,
    tags: [...TAGS, "set-text", "lord-of-the-flies", "character-map"],
  }, [
    "Character map — Ralph, Jack, Piggy, Simon, Roger",
    "Character map — civilisation vs savagery factions",
    "Plot diagram — descent into savagery",
    "Themes web — civilisation / savagery / power / fear",
    "Symbol web — conch / fire / glasses / beast",
    "Context timeline — post-WW2 Cold War anxieties",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Of Mice and Men (Steinbeck)",
    year_group: "Year 11",
    description: "Simplified character-relationship map for Of Mice and Men.",
    style_notes: STYLE_MAP,
    tags: [...TAGS, "set-text", "of-mice-and-men", "character-map"],
  }, [
    "Character map — Lennie and George",
    "Character map — ranch hands hierarchy",
    "Plot diagram — six-chapter structure",
    "Themes web — friendship / dreams / loneliness / discrimination",
    "Context timeline — 1930s Great Depression and migrant workers",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Jekyll and Hyde (Stevenson)",
    year_group: "Year 11",
    description: "Simplified character-relationship map for Jekyll and Hyde.",
    style_notes: STYLE_MAP,
    tags: [...TAGS, "set-text", "jekyll-hyde", "character-map"],
  }, [
    "Character map — Jekyll, Hyde, Utterson, Lanyon, Enfield",
    "Plot diagram — ten-chapter structure",
    "Themes web — duality / science vs religion / repression / Victorian gentleman",
    "Symbol web — door / fog / mirror / cane",
    "Context timeline — Victorian London and gothic genre",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Frankenstein (Shelley)",
    year_group: "Year 11",
    description: "Simplified character-relationship map for Frankenstein.",
    style_notes: STYLE_MAP,
    tags: [...TAGS, "set-text", "frankenstein", "character-map"],
  }, [
    "Character map — Victor, Creature, Walton, Elizabeth, Clerval",
    "Plot diagram — frame narrative structure",
    "Themes web — creation / responsibility / nature / isolation",
    "Context timeline — Romantic era and Galvanism",
  ]);

  // ── Poetry anthology — simplified analysis frames ────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Poetry analysis frames",
    year_group: "Year 11",
    description: "Poetry-analysis scaffold for GCSE — copyright-safe, no verbatim poem text.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS, "poetry", "analysis"],
  }, [
    "SMILE poetry frame — Structure / Meaning / Imagery / Language / Effect",
    "Poetry comparison Venn — two anthology poems",
    "Poetry comparison T-chart — similarities and differences",
    "Voice / persona / poet triangle",
    "Volta detector — sonnet structure card",
    "Form card — sonnet (14 lines, iambic pentameter, volta)",
    "Form card — ballad (quatrains, ABAB, narrative)",
    "Form card — dramatic monologue (single speaker, audience)",
    "Form card — free verse (no fixed metre or rhyme)",
    "Form card — elegy (mourning the dead)",
    "Form card — ode (formal address to subject)",
    "Form card — villanelle (19 lines, refrains)",
    "Rhythm and metre — iambic / trochaic / dactylic / anapaestic",
    "Rhyme scheme labelling — ABAB CDCD",
    "Caesura and enjambment card",
    "AQA Power and Conflict — themes wheel",
    "AQA Love and Relationships — themes wheel",
    "Edexcel Conflict / Time and Place — themes wheel",
    "Eduqas Anthology — themes wheel",
    "Unseen poetry — annotation method",
    "Unseen poetry — comparison method",
  ]);

  // ── Modern texts and 19th century novels (general analysis) ──────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Other set texts (general analysis frames)",
    year_group: "Year 11",
    description: "Generic analysis frame applicable to other GCSE Lit set texts (Animal Farm, Pride and Prejudice, Great Expectations, Tempest, etc.).",
    style_notes: STYLE_MAP,
    tags: [...TAGS, "set-text", "character-map"],
  }, [
    "Character map — Animal Farm (pigs vs other animals)",
    "Character map — Pride and Prejudice (Bennet family and suitors)",
    "Character map — Great Expectations (Pip, Estella, Magwitch, Miss Havisham)",
    "Character map — The Tempest (Prospero, Miranda, Ariel, Caliban)",
    "Character map — The Crucible (Salem households)",
    "Character map — Blood Brothers (Johnstones and Lyons)",
    "Character map — Journey's End (officers in the dugout)",
    "Character map — DNA (teen group dynamic)",
    "Character map — The Sign of Four (Holmes, Watson, the Sholtos, Small)",
    "Character map — Anita and Me (Meena's village)",
    "Character map — Refugee Boy (Alem and his foster family)",
    "Character map — Never Let Me Go (Kathy, Tommy, Ruth)",
    "Character map — The History Boys (the boys, Hector, Irwin)",
  ]);

  // ── Essay-writing and exam frames ────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Essay structure",
    year_group: "Year 11",
    description: "Essay-structure planner for GCSE Lit.",
    style_notes: STYLE_FRAME,
    tags: [...TAGS, "essay", "planning"],
  }, [
    "PETAL paragraph — Point / Evidence / Technique / Analysis / Link",
    "PEEL paragraph — Point / Evidence / Explain / Link",
    "What / How / Why analysis ladder",
    "Big idea / context / writer's intent triangle",
    "Comparative essay structure — point-by-point vs block",
    "Introduction template — thesis statement",
    "Conclusion template — synthesis and so what?",
    "Evidence sandwich — embedded quotation method",
    "Zoom-in analysis — single word focus",
    "Zoom-out analysis — whole-text patterns",
    "Context integration — when to weave in AO3",
    "Literary techniques bank — for Lit essays (cheat-sheet card)",
    "AO breakdown card — AO1 / AO2 / AO3 explained",
  ]);

  // ── Themes / motifs / symbols universal cards ────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Themes and symbols",
    year_group: "Year 11",
    description: "Thematic / symbolic concept card for GCSE Lit.",
    style_notes: "Concept in pill at centre, examples branching out",
    tags: [...TAGS, "themes", "symbols"],
  }, [
    "Theme card — power and authority",
    "Theme card — love and relationships",
    "Theme card — gender and identity",
    "Theme card — class and society",
    "Theme card — guilt and responsibility",
    "Theme card — time and memory",
    "Theme card — nature and the supernatural",
    "Theme card — conflict and war",
    "Theme card — family and inheritance",
    "Theme card — coming of age",
    "Symbol card — light vs dark",
    "Symbol card — fire and water",
    "Symbol card — animals as symbols",
    "Symbol card — clothing as identity",
    "Symbol card — weather as mood",
    "Symbol card — doors / thresholds / gates",
  ]);
}
