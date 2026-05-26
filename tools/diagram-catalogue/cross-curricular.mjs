/**
 * Cross-curricular / branding — primary diagram catalogue.
 * Target: ~80 entries.
 *
 * These rows are tagged subject = "branding" so the diagram-library family
 * gate in routes/diagramLibrary.ts can serve them on any primary worksheet
 * without falsely binding them to a single subject.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // Mascots — 3 mascots × 6 poses = 18
  const MASCOTS = [
    {
      name: "Ada the Explorer",
      desc: "child explorer with binoculars and adventurer's hat, brown skin, black curly hair",
      tag: "ada-explorer",
    },
    {
      name: "Rio the Robot",
      desc: "round-headed friendly robot with antennae and glowing chest panel",
      tag: "rio-robot",
    },
    {
      name: "Bea the Bookworm",
      desc: "smiling worm/bookworm character holding a book, fair skin, glasses",
      tag: "bea-bookworm",
    },
  ];
  const POSES = [
    "thinking with a hand on chin",
    "cheering with both arms up",
    "asking a question with a raised hand",
    "helping a friend (alongside another small character)",
    "celebrating with confetti",
    "waving a friendly greeting",
  ];
  for (const m of MASCOTS) {
    for (const pose of POSES) {
      ctx.add({
        title: `Mascot — ${m.name} (${pose})`,
        subject: "branding",
        topic: "Mascots",
        year_group: "Year 1-6",
        description: `${m.name}: ${m.desc}, drawn ${pose}. Used as a recurring section illustration.`,
        style_notes: "Consistent palette across mascots, soft outlines, sticker-style",
        tags: ["mascot", "branding", m.tag],
      });
    }
  }

  // Section badges — KS1 + KS2 names — 12
  emitTitled(ctx, {
    subject: "branding",
    topic: "Section badges",
    year_group: "Year 1-6",
    description: "Coloured pill-shaped badge with section name and small icon.",
    style_notes: "Rounded rectangle, drop shadow, icon in white circle",
    tags: ["badge", "section-header", "branding"],
  }, [
    "Badge — Can You Remember? (KS1)",
    "Badge — Have a Go! (KS1)",
    "Badge — Let's Try Together (KS1)",
    "Badge — Your Challenge (KS1)",
    "Badge — How Did I Do? (KS1)",
    "Badge — Warm Up (KS2)",
    "Badge — Let's Practise (KS2)",
    "Badge — Dig Deeper (KS2)",
    "Badge — Challenge Corner (KS2)",
    "Badge — My Learning Check (KS2)",
    "Badge — Super Challenge (gold star)",
    "Badge — Reflection (lightbulb)",
  ]);

  // Work-mode icons — 6
  emitTitled(ctx, {
    subject: "branding",
    topic: "Work-mode icons",
    year_group: "Year 1-6",
    description: "Small icon indicating how a question should be tackled.",
    style_notes: "Single-shape icon, label below in pill",
    tags: ["icon", "work-mode", "branding"],
  }, [
    "Work-mode — Independent (one child)",
    "Work-mode — Pair (two children)",
    "Work-mode — Group (three+ children)",
    "Work-mode — Whole class (raised hands)",
    "Work-mode — Talk partner",
    "Work-mode — Discuss with adult",
  ]);

  // Award stamps — 8
  emitTitled(ctx, {
    subject: "branding",
    topic: "Award stamps",
    year_group: "Year 1-6",
    description: "Sticker-style award stamp.",
    style_notes: "Circular badge with serrated edge, ribbon banner",
    tags: ["sticker", "award", "branding"],
  }, [
    "Award stamp — Great work!",
    "Award stamp — Star of the day",
    "Award stamp — Try again, you've got this",
    "Award stamp — Fantastic effort",
    "Award stamp — Brilliant thinking",
    "Award stamp — Maths whizz",
    "Award stamp — Reading rocket",
    "Award stamp — Kindness champion",
  ]);

  // Page borders / decorative frames — 12
  emitTitled(ctx, {
    subject: "branding",
    topic: "Page borders",
    year_group: "Year 1-6",
    description: "Decorative page-border template that runs around the worksheet edge without distracting from content.",
    style_notes: "Repeating motif, pale fills, max 12mm border thickness",
    tags: ["border", "decoration", "branding"],
  }, [
    "Border — jungle leaves",
    "Border — ocean coral",
    "Border — outer space",
    "Border — classroom (pencils and stars)",
    "Border — autumn leaves",
    "Border — winter snowflakes",
    "Border — spring blossom",
    "Border — summer beach",
    "Border — superhero (geometric pop)",
    "Border — fairy tale (toadstools and stars)",
    "Border — sports (balls and trophies)",
    "Border — music (notes and instruments)",
  ]);

  // Speech / thought / question bubbles — 6
  emitTitled(ctx, {
    subject: "branding",
    topic: "Speech bubbles",
    year_group: "Year 1-6",
    description: "Bubble template for placing prompts or hints near a mascot.",
    style_notes: "Crisp outline, slight drop shadow, room for 1–2 lines of text",
    tags: ["bubble", "branding"],
  }, [
    "Bubble — speech (rounded)",
    "Bubble — thought (cloud with dots)",
    "Bubble — question (with ?)",
    "Bubble — exclamation (with !)",
    "Bubble — top tip (with star)",
    "Bubble — challenge (with lightning)",
  ]);

  // Section divider banners — 8
  emitTitled(ctx, {
    subject: "branding",
    topic: "Section banners",
    year_group: "Year 1-6",
    description: "Wide banner spanning the page width, used to start a new section.",
    style_notes: "Ribbon style with rounded ends, room for title text",
    tags: ["banner", "section-divider", "branding"],
  }, [
    "Banner — Section 1 (warm primary palette)",
    "Banner — Section 2 (cool primary palette)",
    "Banner — Section 3 (orange/red)",
    "Banner — Challenge (gold)",
    "Banner — Reflection (purple)",
    "Banner — Self-check (teal)",
    "Banner — Diagram A (navy)",
    "Banner — Diagram B (forest green)",
  ]);

  // Reflection / check-in slider visuals — 4
  emitTitled(ctx, {
    subject: "branding",
    topic: "Reflection sliders",
    year_group: "Year 1-6",
    description: "Self-check visual that lets a child mark how they feel about the lesson.",
    style_notes: "Three or five-point smiley scale, tick boxes underneath",
    tags: ["reflection", "self-assessment"],
  }, [
    "Reflection — 3-point (Easy / OK / Tricky)",
    "Reflection — 5-point smiley scale",
    "Reflection — traffic light (red/amber/green)",
    "Reflection — confidence ladder 1–10",
  ]);

  // Inclusive imagery prompts — 6
  emitTitled(ctx, {
    subject: "branding",
    topic: "Inclusive characters",
    year_group: "Year 1-6",
    description: "Generic child character with diverse representation for use in scenes.",
    style_notes: "Bold silhouettes, varied skin tones, optional accessibility devices (wheelchair, hearing aid, glasses)",
    tags: ["character", "inclusion", "branding"],
  }, [
    "Character — wheelchair user",
    "Character — child with hearing aid",
    "Character — child with glasses",
    "Character — child with hijab",
    "Character — child with prosthetic limb",
    "Character — child with guide dog",
  ]);
}
