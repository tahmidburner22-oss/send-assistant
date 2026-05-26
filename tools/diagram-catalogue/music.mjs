/**
 * Music — primary diagram catalogue (Y1–Y6).
 * Target: ~50 entries.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // Note values — 8
  emitTitled(ctx, {
    subject: "Music",
    topic: "Note values",
    year_group: "Year 3",
    description: "Music note with name, beat value and a clap pattern guide.",
    style_notes: "Black note glyph on stave fragment, clap-count under",
    tags: ["music", "notation"],
  }, [
    "Note value — semibreve (4 beats)",
    "Note value — minim (2 beats)",
    "Note value — crotchet (1 beat)",
    "Note value — quaver (½ beat)",
    "Note value — semiquaver (¼ beat)",
    "Note value — dotted minim (3 beats)",
    "Note value — dotted crotchet",
    "Note value — tied crotchets",
  ]);

  // Rests — 5
  emitTitled(ctx, {
    subject: "Music",
    topic: "Rests",
    year_group: "Year 3",
    description: "Rest glyph with name and beat value.",
    style_notes: "Black glyph on a single stave, beat label",
    tags: ["music", "rests"],
  }, [
    "Rest — semibreve",
    "Rest — minim",
    "Rest — crotchet",
    "Rest — quaver",
    "Rest — semiquaver",
  ]);

  // Stave / clefs — 4
  emitTitled(ctx, {
    subject: "Music",
    topic: "Stave and clefs",
    year_group: "Year 4",
    description: "Stave, clef and key-signature poster.",
    style_notes: "Five-line stave with notes labelled",
    tags: ["stave", "clef"],
  }, [
    "Stave — five lines / four spaces (FACE / EGBDF)",
    "Treble clef — labelled",
    "Bass clef — labelled (optional UKS2)",
    "Key signature poster — C / G / F majors",
  ]);

  // Time signatures & dynamics — 6
  emitTitled(ctx, {
    subject: "Music",
    topic: "Time signatures and dynamics",
    year_group: "Year 4",
    description: "Card explaining a time signature or a dynamic marking.",
    style_notes: "Numerator/denominator highlighted, dynamic letters in italic",
    tags: ["time-signature", "dynamics"],
  }, [
    "Time signature — 4/4",
    "Time signature — 3/4 (waltz)",
    "Time signature — 2/4 (march)",
    "Time signature — 6/8 (lilting)",
    "Dynamics — pp / p / mp / mf / f / ff",
    "Tempo terms — adagio / andante / allegro / presto",
  ]);

  // Instruments — 20
  const INSTRUMENTS = [
    "piano", "acoustic guitar", "violin", "cello", "double bass", "drum kit",
    "trumpet", "trombone", "flute", "clarinet", "saxophone", "recorder",
    "ukulele", "glockenspiel", "xylophone", "triangle", "tambourine", "maracas",
    "harp", "harmonica",
  ];
  for (const i of INSTRUMENTS) {
    ctx.add({
      title: `Instrument — ${i}`,
      subject: "Music",
      topic: "Instruments of the orchestra",
      year_group: "Year 3",
      description: `${i.charAt(0).toUpperCase() + i.slice(1)} drawn cleanly with name and family (string/wind/brass/percussion) tag.`,
      style_notes: "Three-quarter view, single-light render, family tag in colour",
      tags: ["instrument", "orchestra-family", i.replace(" ", "-")],
    });
  }

  // Composers — 8
  emitTitled(ctx, {
    subject: "Music",
    topic: "Composers",
    year_group: "Year 5",
    description: "Composer card with silhouette portrait, dates and famous-piece.",
    style_notes: "Silhouette portrait, parchment-style background",
    tags: ["composer"],
  }, [
    "Composer card — Bach",
    "Composer card — Mozart",
    "Composer card — Beethoven",
    "Composer card — Holst (Planets)",
    "Composer card — Stravinsky (Firebird)",
    "Composer card — Errollyn Wallen",
    "Composer card — Florence Price",
    "Composer card — Hans Zimmer (film)",
  ]);

  // Singing/voice diagrams — 4
  emitTitled(ctx, {
    subject: "Music",
    topic: "Voice and singing",
    year_group: "Year 3",
    description: "Vocal-skill / posture / breathing diagram.",
    style_notes: "Child silhouette with arrows for breath direction",
    tags: ["singing", "voice"],
  }, [
    "Singing posture — standing tall",
    "Breathing for singing — diaphragm",
    "Pitch ladder (low → high)",
    "Round / canon — entry diagram",
  ]);
}
