/**
 * Modern Foreign Languages — primary diagram catalogue.
 * Target: ~80 entries (French + Spanish — both KS2 staples).
 */
import { emitTitled, range } from "./_helpers.mjs";

export function build(ctx) {
  // ── French (Y3–Y6) — 40 ───────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "French",
    topic: "Greetings",
    year_group: "Year 3",
    description: "Vocabulary card showing a friendly French greeting with English translation underneath.",
    style_notes: "Tricolour stripe header, child characters waving",
    tags: ["MFL", "French", "greetings", "KS2"],
  }, [
    "French — Bonjour (Hello)",
    "French — Salut (Hi)",
    "French — Au revoir (Goodbye)",
    "French — Merci (Thank you)",
    "French — S'il vous plaît (Please)",
  ]);

  // Numbers 1..20 in French
  const FR_NUMS = ["un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf","vingt"];
  range(20, (i) => ctx.add({
    title: `French number — ${FR_NUMS[i]} (${i + 1})`,
    subject: "French",
    topic: "Numbers",
    year_group: "Year 3",
    description: `Card showing the digit ${i + 1} large at top, the French word "${FR_NUMS[i]}" below, and a counting motif (${i + 1} stars).`,
    style_notes: "Tricolour border, numerals in friendly serif",
    tags: ["MFL", "French", "numbers", "KS2"],
  }));

  emitTitled(ctx, {
    subject: "French",
    topic: "Days, months, colours",
    year_group: "Year 3",
    description: "Theme chart for a French vocabulary set, with English translation alongside.",
    style_notes: "Coloured strips per item",
    tags: ["MFL", "French", "vocabulary"],
  }, [
    "French chart — days of the week",
    "French chart — months of the year",
    "French chart — colours (les couleurs)",
    "French chart — animals (les animaux)",
    "French chart — food (la nourriture)",
    "French chart — family (la famille)",
    "French chart — body parts (le corps)",
    "French chart — weather (le temps)",
    "French chart — clothing (les vêtements)",
    "French chart — classroom objects",
    "French chart — feelings (les sentiments)",
    "French chart — sports (les sports)",
    "French chart — countries / nationalities (basics)",
    "French chart — common verbs in present tense",
    "French chart — au café menu",
  ]);

  // ── Spanish (Y3–Y6) — 40 ──────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Spanish",
    topic: "Greetings",
    year_group: "Year 3",
    description: "Spanish greeting card with English translation underneath.",
    style_notes: "Red/yellow header, child characters waving",
    tags: ["MFL", "Spanish", "greetings", "KS2"],
  }, [
    "Spanish — Hola (Hello)",
    "Spanish — Buenos días (Good morning)",
    "Spanish — Adiós (Goodbye)",
    "Spanish — Gracias (Thank you)",
    "Spanish — Por favor (Please)",
  ]);

  const ES_NUMS = ["uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte"];
  range(20, (i) => ctx.add({
    title: `Spanish number — ${ES_NUMS[i]} (${i + 1})`,
    subject: "Spanish",
    topic: "Numbers",
    year_group: "Year 3",
    description: `Card showing the digit ${i + 1} large at top, the Spanish word "${ES_NUMS[i]}" below, and a counting motif (${i + 1} stars).`,
    style_notes: "Red/yellow border, numerals in friendly serif",
    tags: ["MFL", "Spanish", "numbers", "KS2"],
  }));

  emitTitled(ctx, {
    subject: "Spanish",
    topic: "Days, months, colours",
    year_group: "Year 3",
    description: "Theme chart for a Spanish vocabulary set, with English translation alongside.",
    style_notes: "Coloured strips per item",
    tags: ["MFL", "Spanish", "vocabulary"],
  }, [
    "Spanish chart — días de la semana",
    "Spanish chart — meses del año",
    "Spanish chart — colores",
    "Spanish chart — animales",
    "Spanish chart — comida (food)",
    "Spanish chart — familia",
    "Spanish chart — partes del cuerpo (body)",
    "Spanish chart — el tiempo (weather)",
    "Spanish chart — la ropa (clothing)",
    "Spanish chart — el aula (classroom objects)",
    "Spanish chart — sentimientos (feelings)",
    "Spanish chart — deportes",
    "Spanish chart — países / nacionalidades",
    "Spanish chart — verbos comunes en presente",
    "Spanish chart — en el restaurante (menu)",
  ]);
}
