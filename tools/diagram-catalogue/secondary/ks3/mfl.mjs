/**
 * KS3 Modern Foreign Languages — diagram catalogue (Year 7–9).
 *
 * Covers French, Spanish and German vocabulary scaffolds and grammar
 * tables typical of KS3 schemes of work.
 *
 * Target: ~80 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "MFL", year_band: "KS3" };
const STYLE_MFL =
  "Vocabulary card with target-language word large, English gloss in pale grey beneath, supporting illustration to one side";
const TAGS_KS3 = ["KS3", "MFL"];

export function build(ctx) {
  // ── French ────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "French — vocabulary",
    year_group: "Year 7",
    description: "French KS3 vocabulary card.",
    style_notes: STYLE_MFL,
    tags: [...TAGS_KS3, "french", "vocabulary"],
  }, [
    "French numbers 1–20 chart",
    "French numbers 21–100 chart",
    "Days of the week (les jours de la semaine)",
    "Months (les mois)",
    "Family members (la famille)",
    "House and rooms (la maison)",
    "School subjects (les matières)",
    "Hobbies and free time (les loisirs)",
    "Food and drink (la nourriture / les boissons)",
    "Clothes (les vêtements)",
    "Weather (le temps qu'il fait)",
    "Colours (les couleurs)",
    "Body parts (les parties du corps)",
    "Town and directions (en ville)",
    "Telling the time (l'heure)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "French — grammar",
    year_group: "Year 8",
    description: "French grammar table for KS3.",
    style_notes: "Conjugation table with pronouns down the side, endings highlighted",
    tags: [...TAGS_KS3, "french", "grammar"],
  }, [
    "Definite article (le, la, les) — gender and number table",
    "Indefinite article (un, une, des) — table",
    "Adjective agreement — masc / fem / plural endings",
    "Avoir conjugation — present tense table",
    "Être conjugation — present tense table",
    "Aller conjugation — present tense table",
    "Faire conjugation — present tense table",
    "ER verbs — regular present-tense endings",
    "IR verbs — regular present-tense endings",
    "RE verbs — regular present-tense endings",
    "Near future (aller + infinitive) — chart",
    "Perfect tense (passé composé) with avoir",
    "Perfect tense (passé composé) with être",
    "Negation (ne … pas) — sandwich card",
  ]);

  // ── Spanish ───────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Spanish — vocabulary",
    year_group: "Year 7",
    description: "Spanish KS3 vocabulary card.",
    style_notes: STYLE_MFL,
    tags: [...TAGS_KS3, "spanish", "vocabulary"],
  }, [
    "Spanish numbers 1–20",
    "Spanish numbers 21–100",
    "Days of the week (los días)",
    "Months (los meses)",
    "Family (la familia)",
    "House (la casa)",
    "School (el colegio)",
    "Hobbies (los pasatiempos)",
    "Food and drink (la comida / las bebidas)",
    "Weather (el tiempo)",
    "Colours (los colores)",
    "Body parts (el cuerpo)",
    "Town (la ciudad)",
    "Telling the time (la hora)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Spanish — grammar",
    year_group: "Year 8",
    description: "Spanish grammar reference for KS3.",
    style_notes: "Conjugation table, regular endings highlighted",
    tags: [...TAGS_KS3, "spanish", "grammar"],
  }, [
    "Definite article (el, la, los, las) — table",
    "Indefinite article (un, una, unos, unas) — table",
    "Adjective agreement — m / f / pl endings",
    "Ser vs estar — when to use each",
    "Tener — present tense table",
    "Ir — present tense table",
    "Hacer — present tense table",
    "AR verbs — present-tense endings",
    "ER verbs — present-tense endings",
    "IR verbs — present-tense endings",
    "Near future (ir + a + infinitive)",
    "Preterite tense — regular endings",
    "Negation (no + verb) card",
  ]);

  // ── German ────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "German — vocabulary",
    year_group: "Year 7",
    description: "German KS3 vocabulary card.",
    style_notes: STYLE_MFL,
    tags: [...TAGS_KS3, "german", "vocabulary"],
  }, [
    "German numbers 1–20",
    "German numbers 21–100",
    "Days of the week (die Wochentage)",
    "Months (die Monate)",
    "Family (die Familie)",
    "House (das Haus)",
    "School (die Schule)",
    "Hobbies (die Hobbys)",
    "Food and drink (das Essen / die Getränke)",
    "Weather (das Wetter)",
    "Colours (die Farben)",
    "Telling the time (die Uhrzeit)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "German — grammar",
    year_group: "Year 8",
    description: "German grammar reference for KS3.",
    style_notes: "Case table colour-coded by case",
    tags: [...TAGS_KS3, "german", "grammar"],
  }, [
    "Articles — der / die / das nominative table",
    "Articles — accusative case table",
    "Articles — dative case table",
    "Indefinite articles — ein / eine / ein table",
    "Haben — present tense table",
    "Sein — present tense table",
    "Modal verbs — können / müssen / wollen tables",
    "Word order — verb second (V2) rule",
    "Word order — subordinate clauses (verb to end)",
    "Negation (nicht / kein) card",
    "Adjective endings — strong vs weak summary",
  ]);
}
