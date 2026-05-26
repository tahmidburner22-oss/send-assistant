/**
 * GCSE MFL, PE, RE, Statistics — diagram catalogue.
 *
 * Bundled smaller GCSEs: French / Spanish / German vocab and grammar
 * cards, PE anatomy and tactics, RE world religions and ethics, GCSE
 * Statistics charts.
 *
 * Target: ~190 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const STYLE_VOCAB =
  "Vocabulary card with target-language word large, English gloss in pale grey beneath, supporting illustration to one side";
const STYLE_TABLE = "Conjugation table with pronouns down the side, endings highlighted";
const STYLE_GRAPH =
  "Black axes with arrowheads, light grey gridlines, axis titles 12pt sans-serif, exam-paper feel";

export function build(ctx) {
  // ── French (GCSE) ───────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "MFL",
    year_band: "GCSE",
    topic: "French — vocabulary (GCSE)",
    year_group: "Year 11",
    description: "French GCSE vocabulary card.",
    style_notes: STYLE_VOCAB,
    tags: ["GCSE", "MFL", "french", "vocabulary"],
  }, [
    "Identity and family — vocabulary chart",
    "Healthy living and lifestyle — vocab chart",
    "School life — vocab chart",
    "Free time and leisure — vocab chart",
    "Holidays and travel — vocab chart",
    "Where I live — town and region vocab",
    "Festivals and celebrations — vocab chart",
    "Future plans and careers — vocab chart",
    "Global issues — environment vocab",
    "Global issues — poverty and homelessness vocab",
    "Technology in everyday life — vocab",
    "Social media — vocab chart",
  ]);

  emitTitled(ctx, {
    subject: "MFL",
    year_band: "GCSE",
    topic: "French — grammar (GCSE)",
    year_group: "Year 10",
    description: "French grammar reference for GCSE.",
    style_notes: STYLE_TABLE,
    tags: ["GCSE", "MFL", "french", "grammar"],
  }, [
    "Present tense — regular ER / IR / RE verb endings",
    "Perfect tense (passé composé) — avoir vs être agreement",
    "Imperfect tense — endings table",
    "Future tense — simple future endings",
    "Conditional tense — endings table",
    "Pluperfect tense — formation table",
    "Subjunctive — common triggers card",
    "Reflexive verbs — present-tense table",
    "Direct object pronouns — me / te / le / la / nous / vous / les",
    "Indirect object pronouns — me / te / lui / nous / vous / leur",
    "Y and en pronouns card",
    "Negation — ne … pas / jamais / rien / personne / plus",
    "Comparative and superlative card",
    "Relative pronouns — qui / que / dont / où",
    "Question forms — est-ce que / inversion",
  ]);

  // ── Spanish (GCSE) ──────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "MFL",
    year_band: "GCSE",
    topic: "Spanish — vocabulary (GCSE)",
    year_group: "Year 11",
    description: "Spanish GCSE vocabulary card.",
    style_notes: STYLE_VOCAB,
    tags: ["GCSE", "MFL", "spanish", "vocabulary"],
  }, [
    "Identidad y familia — vocab chart",
    "Vida sana y estilo de vida — vocab chart",
    "El instituto — vocab chart",
    "Tiempo libre — vocab chart",
    "Vacaciones y viajes — vocab chart",
    "Mi pueblo / ciudad — vocab chart",
    "Fiestas — vocab chart",
    "El futuro y el trabajo — vocab chart",
    "El medio ambiente — vocab chart",
    "Pobreza y desigualdad — vocab chart",
    "Tecnología — vocab chart",
    "Redes sociales — vocab chart",
  ]);

  emitTitled(ctx, {
    subject: "MFL",
    year_band: "GCSE",
    topic: "Spanish — grammar (GCSE)",
    year_group: "Year 10",
    description: "Spanish grammar reference for GCSE.",
    style_notes: STYLE_TABLE,
    tags: ["GCSE", "MFL", "spanish", "grammar"],
  }, [
    "Present tense — regular AR / ER / IR endings",
    "Preterite tense — endings table",
    "Imperfect tense — endings table",
    "Future tense — endings table",
    "Conditional tense — endings table",
    "Subjunctive — common triggers card",
    "Reflexive verbs — table",
    "Direct object pronouns",
    "Indirect object pronouns",
    "Ser vs estar — usage card",
    "Comparative and superlative",
    "Relative pronouns — que / quien / cuyo",
    "Question forms — interrogatives",
    "Por vs para card",
  ]);

  // ── German (GCSE) ──────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "MFL",
    year_band: "GCSE",
    topic: "German — vocabulary (GCSE)",
    year_group: "Year 11",
    description: "German GCSE vocabulary card.",
    style_notes: STYLE_VOCAB,
    tags: ["GCSE", "MFL", "german", "vocabulary"],
  }, [
    "Identität und Familie — vocab chart",
    "Gesundheit — vocab chart",
    "Schule — vocab chart",
    "Freizeit — vocab chart",
    "Urlaub und Reisen — vocab chart",
    "Meine Stadt — vocab chart",
    "Feste — vocab chart",
    "Zukunftspläne — vocab chart",
    "Umwelt — vocab chart",
    "Technologie — vocab chart",
    "Soziale Medien — vocab chart",
  ]);

  emitTitled(ctx, {
    subject: "MFL",
    year_band: "GCSE",
    topic: "German — grammar (GCSE)",
    year_group: "Year 10",
    description: "German grammar reference for GCSE.",
    style_notes: STYLE_TABLE,
    tags: ["GCSE", "MFL", "german", "grammar"],
  }, [
    "Cases — nominative / accusative / dative / genitive table",
    "Articles — der / die / das in all four cases",
    "Indefinite articles — ein / eine in all four cases",
    "Modal verbs — können / müssen / sollen / wollen / dürfen / mögen",
    "Word order — verb second (V2) rule",
    "Word order — subordinate clauses (verb to end)",
    "Time-Manner-Place adverb order",
    "Perfect tense — haben vs sein auxiliaries",
    "Imperfect tense (Präteritum) — endings",
    "Future tense — werden + infinitive",
    "Subjunctive II — würde + infinitive",
    "Adjective endings — strong / weak / mixed",
    "Negation — nicht vs kein",
    "Reflexive verbs — accusative vs dative",
  ]);

  // ── PE ──────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "PE",
    year_band: "GCSE",
    topic: "Anatomy and physiology",
    year_group: "Year 10",
    description: "PE anatomy / physiology diagram for GCSE.",
    style_notes: "Anatomical drawing, muscles in red overlay, bones in white skeleton",
    tags: ["GCSE", "PE", "anatomy"],
  }, [
    "Skeletal system — major bones labelled",
    "Joint types — hinge / ball-and-socket / pivot / gliding / saddle",
    "Synovial joint — labelled cross-section",
    "Major muscle groups — front and back labelled",
    "Antagonistic muscle pairs — biceps/triceps, quads/hamstrings, gastrocnemius/tibialis",
    "Cardiovascular system — heart and major vessels",
    "Cardiac cycle — three phases",
    "Respiratory system — labelled",
    "Mechanics of breathing — diaphragm and ribcage",
    "Energy systems — aerobic vs anaerobic comparison",
    "Lactic acid build-up vs oxygen debt graph",
    "Fast vs slow twitch muscle fibres",
    "Components of fitness wheel",
    "Methods of training — continuous, fartlek, interval, plyometric, weight, circuit",
    "FITT principle and progressive overload card",
    "Types of feedback — intrinsic vs extrinsic, positive vs negative",
  ]);

  emitTitled(ctx, {
    subject: "PE",
    year_band: "GCSE",
    topic: "Sports psychology and society",
    year_group: "Year 11",
    description: "Sports psychology / sociology diagram for GCSE PE.",
    style_notes: "Concept map style with central pill",
    tags: ["GCSE", "PE", "psychology"],
  }, [
    "Goal setting — SMART card",
    "Arousal — inverted-U hypothesis graph",
    "Aggression — direct vs indirect",
    "Skill classification — open / closed, gross / fine",
    "Stages of learning — cognitive, associative, autonomous",
    "Mental preparation techniques — imagery, mental rehearsal, selective attention, positive self-talk",
    "Commercialisation in sport — golden triangle (sport, sponsor, media)",
    "Health and fitness diagram — comparison",
    "Performance-enhancing drugs categories",
    "Spectator behaviour — positive vs negative",
  ]);

  // ── RE ──────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Religious Studies",
    year_band: "GCSE",
    topic: "Christian beliefs and teachings",
    year_group: "Year 10",
    description: "Christianity diagram for GCSE RE.",
    style_notes: "Cross symbol header, key teachings in pills with reference",
    tags: ["GCSE", "RE", "christianity"],
  }, [
    "Trinity — Father / Son / Holy Spirit diagram",
    "Christian beliefs — incarnation / crucifixion / resurrection / ascension",
    "Christian eschatology — judgement / heaven / hell / purgatory",
    "Sacraments — seven Catholic sacraments card",
    "Worship — liturgical vs non-liturgical comparison",
    "Lord's Prayer card (with attribution)",
    "Pilgrimage — Lourdes / Iona / Jerusalem comparison",
    "Festivals — Christmas / Easter / Pentecost calendar",
  ]);

  emitTitled(ctx, {
    subject: "Religious Studies",
    year_band: "GCSE",
    topic: "Islamic beliefs and teachings",
    year_group: "Year 10",
    description: "Islam diagram for GCSE RE — copyright-safe.",
    style_notes: "Crescent and star header; no figurative depiction of the Prophet ﷺ — Kaaba and calligraphy only",
    tags: ["GCSE", "RE", "islam"],
  }, [
    "Six articles of faith (Sunni) / five roots of religion (Shi'a)",
    "Five Pillars of Islam — Shahadah / Salah / Zakat / Sawm / Hajj",
    "Hajj — five-day Mecca pilgrimage steps (no figurative depiction of the Prophet ﷺ)",
    "Eid al-Fitr vs Eid al-Adha comparison",
    "Mosque layout — labelled (mihrab, minbar, qibla wall, minaret) — Kaaba reference",
    "Wudu — ritual ablution sequence",
    "Sources of authority — Qur'an and Hadith card",
  ]);

  emitTitled(ctx, {
    subject: "Religious Studies",
    year_band: "GCSE",
    topic: "Other world religions",
    year_group: "Year 11",
    description: "World-religion diagram for GCSE RE.",
    style_notes: "Symbol header for each religion, key teachings in pills",
    tags: ["GCSE", "RE", "world-religions"],
  }, [
    "Hindu beliefs — Brahman / atman / dharma / karma / moksha",
    "Hindu trimurti — Brahma / Vishnu / Shiva",
    "Sikhism — five Ks card",
    "Sikh worship — gurdwara layout",
    "Judaism — Tenakh and Torah card",
    "Synagogue layout — labelled",
    "Buddhist Four Noble Truths and Eightfold Path",
    "Buddhist meditation — samatha vs vipassana",
    "Common features of pilgrimage — comparison table",
  ]);

  emitTitled(ctx, {
    subject: "Religious Studies",
    year_band: "GCSE",
    topic: "Themes — relationships, life and death, peace, justice",
    year_group: "Year 11",
    description: "RE thematic study diagram for GCSE.",
    style_notes: "Concept map with religious vs philosophical responses",
    tags: ["GCSE", "RE", "themes"],
  }, [
    "Existence of God — five arguments overview (cosmological, teleological, moral, ontological, religious experience)",
    "The problem of evil — logical vs evidential framing",
    "Theodicies — Augustinian vs Irenaean",
    "Marriage — religious teachings comparison",
    "Cohabitation, divorce, remarriage card",
    "Gender roles in religion comparison",
    "Sanctity of life vs quality of life",
    "Abortion — religious vs secular views card",
    "Euthanasia — types and views card",
    "Capital punishment — religious vs secular views",
    "Just War theory — six conditions",
    "Pacifism — types card",
    "Religious responses to poverty and wealth",
  ]);

  // ── Statistics (GCSE) ──────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Mathematics",
    year_band: "GCSE",
    topic: "GCSE Statistics — additional",
    year_group: "Year 11",
    description: "GCSE Statistics-specific diagram (not on standalone Maths).",
    style_notes: STYLE_GRAPH,
    tags: ["GCSE", "statistics", "mathematics"],
  }, [
    "Time series — moving average smoothing",
    "Time series — seasonal variation diagram",
    "Index number formula card",
    "Geometric mean formula card",
    "Standard deviation formula card",
    "Skewness — positive / negative / symmetric distributions",
    "Spearman's rank — worked example",
    "Quality assurance — control chart with action limits",
    "Population pyramid template",
    "Choropleth map — interpretation guide",
    "Comparative pie chart — area scaled by total",
    "Sampling — random / stratified / systematic / cluster",
    "Capture-recapture method card",
    "Hypothesis testing — null vs alternative card",
  ]);

  emitTitled(ctx, {
    subject: "Citizenship Studies",
    year_band: "GCSE",
    topic: "Spec-link extras",
    year_group: "Year 11",
    description: "Filler card linking GCSE Citizenship to other subjects.",
    style_notes: "Concept pill with cross-curricular tag",
    tags: ["GCSE", "citizenship", "cross-curricular"],
  }, [
    "Magna Carta to Human Rights Act timeline",
    "How to write to your MP — letter template",
  ]);
}
