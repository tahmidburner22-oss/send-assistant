/**
 * Religious Education — primary diagram catalogue.
 * Target: ~60 entries.
 *
 * NOTE: Out of respect for Islamic figurative imagery conventions, no card
 * depicting the Prophet Muhammad is included; instead, key sites (Kaaba) and
 * the written Shahada are used. All other figurative content is gentle,
 * silhouette-or-symbol style appropriate for KS1/KS2 RE syllabuses.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // Symbols of six major religions — 12
  emitTitled(ctx, {
    subject: "Religious education",
    topic: "Religious symbols",
    year_group: "Year 3",
    description: "Symbol of a world religion on a coloured card with name and one-line meaning.",
    style_notes: "Single symbol on plain coloured background, name plate",
    tags: ["RE", "symbols", "world-religions"],
  }, [
    "Symbol — cross (Christianity)",
    "Symbol — fish/Ichthus (Christianity)",
    "Symbol — Star of David (Judaism)",
    "Symbol — menorah (Judaism)",
    "Symbol — crescent and star (Islam)",
    "Symbol — Kaaba (Islam — sacred site)",
    "Symbol — Aum (Hinduism)",
    "Symbol — diya lamp (Hinduism)",
    "Symbol — Khanda (Sikhism)",
    "Symbol — Ek Onkar (Sikhism)",
    "Symbol — Dharma wheel (Buddhism)",
    "Symbol — lotus flower (Buddhism)",
  ]);

  // Places of worship (exterior + interior) — 12
  emitTitled(ctx, {
    subject: "Religious education",
    topic: "Places of worship",
    year_group: "Year 4",
    description: "Place of worship card with exterior and a labelled interior feature.",
    style_notes: "Architectural illustration, soft palette, key feature highlighted",
    tags: ["RE", "places-of-worship"],
  }, [
    "Church — exterior", "Church — interior with altar / lectern / font",
    "Mosque — exterior with minaret", "Mosque — interior with qibla wall and mihrab",
    "Synagogue — exterior", "Synagogue — interior with bimah and ark",
    "Mandir — exterior", "Mandir — interior shrine",
    "Gurdwara — exterior with Nishan Sahib", "Gurdwara — interior with Guru Granth Sahib on takht",
    "Buddhist temple — exterior", "Buddhist temple — interior with Buddha statue",
  ]);

  // Sacred texts — 6
  emitTitled(ctx, {
    subject: "Religious education",
    topic: "Sacred texts",
    year_group: "Year 4",
    description: "Sacred text card with the book or scroll respectfully depicted.",
    style_notes: "Book closed or scroll partially open, traditional binding",
    tags: ["RE", "sacred-texts"],
  }, [
    "Sacred text — Bible (Old and New Testaments)",
    "Sacred text — Qur'an (closed book on rihal stand)",
    "Sacred text — Torah scroll",
    "Sacred text — Guru Granth Sahib (covered)",
    "Sacred text — Vedas (palm-leaf bundle)",
    "Sacred text — Tipitaka (basket motif)",
  ]);

  // Festivals — 15
  emitTitled(ctx, {
    subject: "Religious education",
    topic: "Religious festivals",
    year_group: "Year 3",
    description: "Festival card with characteristic symbol(s) and one-line celebration note.",
    style_notes: "Festive palette, central symbol, decoration around the edge",
    tags: ["RE", "festivals"],
  }, [
    "Festival — Christmas (nativity star)",
    "Festival — Easter (cross and lily)",
    "Festival — Pentecost (flames)",
    "Festival — Lent (purple cloth and ashes)",
    "Festival — Eid al-Fitr (crescent and dates)",
    "Festival — Eid al-Adha (lamb and crescent)",
    "Festival — Ramadan (crescent and dates with sunset)",
    "Festival — Hanukkah (menorah)",
    "Festival — Pesach / Passover (Seder plate)",
    "Festival — Yom Kippur (shofar)",
    "Festival — Diwali (diya lamps)",
    "Festival — Holi (powder colours)",
    "Festival — Vaisakhi (Khanda)",
    "Festival — Wesak (lotus and Buddha)",
    "Festival — Harvest festival (basket of produce)",
  ]);

  // Religious leaders / founders — 6
  emitTitled(ctx, {
    subject: "Religious education",
    topic: "Religious leaders",
    year_group: "Year 5",
    description: "Card identifying a key religious figure (silhouette/symbol-only where convention requires it).",
    style_notes: "Respectful, traditional iconography style",
    tags: ["RE", "religious-leaders"],
  }, [
    "Jesus — silhouette with halo (Christianity)",
    "Moses — silhouette with tablets (Judaism)",
    "Prophet Muhammad — name calligraphy ﷺ (Islam, no figurative depiction)",
    "Guru Nanak — silhouette with traditional turban (Sikhism)",
    "Buddha — seated meditation silhouette",
    "Mahatma Gandhi (cross-curricular RE/History)",
  ]);

  // Stories from religions — 8
  emitTitled(ctx, {
    subject: "Religious education",
    topic: "Religious stories",
    year_group: "Year 3",
    description: "Story-from-faith illustration card (gentle, child-appropriate).",
    style_notes: "Storybook palette, neutral characters where possible",
    tags: ["RE", "religious-stories"],
  }, [
    "Story — Noah's Ark (Christianity/Judaism/Islam)",
    "Story — The Good Samaritan (parable)",
    "Story — David and Goliath (silhouette)",
    "Story — Moses and the burning bush",
    "Story — The Nativity scene",
    "Story — Rama and Sita (Diwali)",
    "Story — The Buddha and the lotus",
    "Story — The Five Ks of Sikhism",
  ]);

  // Religious practices / values — 6
  emitTitled(ctx, {
    subject: "Religious education",
    topic: "Practices and values",
    year_group: "Year 5",
    description: "Practice or value card linking a religion to a daily/weekly action.",
    style_notes: "Action illustration with name and faith context",
    tags: ["RE", "practice", "values"],
  }, [
    "Practice — prayer mat (Islam)",
    "Practice — seder meal (Judaism)",
    "Practice — communion (Christianity)",
    "Practice — langar (Sikhism)",
    "Practice — meditation (Buddhism)",
    "Practice — puja (Hinduism)",
  ]);
}
