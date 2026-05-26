/**
 * Art & Design and Design & Technology — primary diagram catalogue.
 * Target: ~110 entries.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // Colour theory — 6
  emitTitled(ctx, {
    subject: "Art and design",
    topic: "Colour theory",
    year_group: "Year 3",
    description: "Colour wheel or palette card.",
    style_notes: "Smooth gradient between hues, named labels around the rim",
    tags: ["colour-wheel", "art"],
  }, [
    "Colour wheel — primary/secondary/tertiary",
    "Warm vs cool colours card",
    "Complementary pairs (red/green, blue/orange, yellow/purple)",
    "Tints, shades and tones strip",
    "Monochromatic palette example",
    "Analogous palette example",
  ]);

  // Famous artworks (simplified, child-friendly silhouette homages) — 18
  emitTitled(ctx, {
    subject: "Art and design",
    topic: "Famous artists",
    year_group: "Year 4",
    description: "Stylised, child-friendly homage of a famous artwork suitable for primary art lessons. Not a copy — a clean, simplified version for tracing / discussion.",
    style_notes: "Flat shapes, bold outlines, copyright-safe simplified composition",
    tags: ["art-history", "famous-artists"],
  }, [
    "Artwork study — Sunflowers (Van Gogh) simplified",
    "Artwork study — The Great Wave (Hokusai) simplified",
    "Artwork study — Mondrian grid colour blocks",
    "Artwork study — Lowry-style figures and chimneys",
    "Artwork study — Klimt-style golden patterns",
    "Artwork study — Klee-style geometric fish",
    "Artwork study — Picasso-style cubist face",
    "Artwork study — Matisse-style cut-out shapes",
    "Artwork study — Pollock-style splatter pattern",
    "Artwork study — Warhol-style four-colour pop print",
    "Artwork study — Hepworth-style sculptural shapes",
    "Artwork study — Riley-style optical pattern",
    "Artwork study — Goldsworthy-style natural arrangement",
    "Artwork study — Kahlo-style self-portrait frame",
    "Artwork study — Banksy-style stencil silhouette",
    "Artwork study — Hokusai's Mt Fuji silhouette",
    "Artwork study — Monet-style water lily pond",
    "Artwork study — Seurat-style pointillism dots",
  ]);

  // Drawing techniques — 12
  emitTitled(ctx, {
    subject: "Art and design",
    topic: "Drawing techniques",
    year_group: "Year 3",
    description: "Card showing a drawing technique with a same-shape demo.",
    style_notes: "Same simple object (apple/cube/face) shown 'before' and with technique applied",
    tags: ["drawing", "skills"],
  }, [
    "Technique — hatching",
    "Technique — cross-hatching",
    "Technique — stippling",
    "Technique — blending with pencil",
    "Technique — light/shadow on a sphere",
    "Technique — proportions of the face",
    "Technique — perspective (1-point)",
    "Technique — perspective (2-point)",
    "Technique — contour line drawing",
    "Technique — gesture sketch",
    "Technique — silhouette",
    "Technique — symmetry drawing",
  ]);

  // Sculpture / 3D — 6
  emitTitled(ctx, {
    subject: "Art and design",
    topic: "Sculpture",
    year_group: "Year 5",
    description: "3D form / sculpture-skill card.",
    style_notes: "Soft-shaded 3D forms with manipulation arrows",
    tags: ["sculpture", "3D-art"],
  }, [
    "Form — sphere / cube / cylinder / cone / pyramid set",
    "Clay technique — pinch pot",
    "Clay technique — coil pot",
    "Clay technique — slab box",
    "Sculpture — wire armature",
    "Sculpture — papier-mâché stages",
  ]);

  // Textiles & patterns — 8
  emitTitled(ctx, {
    subject: "Design and technology",
    topic: "Textiles",
    year_group: "Year 5",
    description: "Textiles technique / pattern card for KS2 DT.",
    style_notes: "Photo-style swatch, technique labelled",
    tags: ["textiles", "DT"],
  }, [
    "Stitch — running stitch",
    "Stitch — back stitch",
    "Stitch — cross stitch",
    "Stitch — blanket stitch",
    "Pattern — stripes",
    "Pattern — tartan",
    "Pattern — paisley",
    "Pattern — geometric repeat",
  ]);

  // Cooking / food (DT) — 14
  emitTitled(ctx, {
    subject: "Design and technology",
    topic: "Cooking and nutrition",
    year_group: "Year 4",
    description: "Cooking-themed instructional card.",
    style_notes: "Bright kitchen palette, friendly chef mascot",
    tags: ["cooking", "nutrition", "DT"],
  }, [
    "Eatwell guide — proportional plate",
    "Food groups — five groups card",
    "Knife safety — bridge and claw grip",
    "Hygiene rules — wash hands / tie hair",
    "Cooking utensil — whisk",
    "Cooking utensil — sieve",
    "Cooking utensil — rolling pin",
    "Cooking utensil — measuring jug",
    "Recipe layout — ingredients / method / equipment",
    "Cooking method — bake",
    "Cooking method — fry",
    "Cooking method — boil",
    "Cooking method — steam",
    "Seasonal food chart — UK",
  ]);

  // Mechanisms (DT) — 10
  emitTitled(ctx, {
    subject: "Design and technology",
    topic: "Mechanisms",
    year_group: "Year 5",
    description: "Mechanism diagram (lever, pulley, gear, cam, etc.) labelled.",
    style_notes: "Clean side-view, motion arrows, labelled parts",
    tags: ["mechanisms", "DT"],
  }, [
    "Mechanism — lever (1st / 2nd / 3rd class) trio",
    "Mechanism — pulley (single)",
    "Mechanism — pulley (double)",
    "Mechanism — gear pair (different sizes)",
    "Mechanism — cam and follower",
    "Mechanism — linkage (push-pull)",
    "Mechanism — wheel and axle",
    "Mechanism — pneumatic syringe pair",
    "Mechanism — slider mechanism",
    "Mechanism — moving picture book — pop-up",
  ]);

  // Electrical circuits in DT — 6
  emitTitled(ctx, {
    subject: "Design and technology",
    topic: "Electrical systems",
    year_group: "Year 6",
    description: "DT electrical project diagram (e.g. torch, fan, alarm).",
    style_notes: "Schematic + product mock-up alongside",
    tags: ["DT", "electrical-systems"],
  }, [
    "DT project — torch circuit + casing",
    "DT project — door alarm circuit",
    "DT project — fan circuit + blade design",
    "DT project — quiz buzzer game circuit",
    "DT project — mood light with LED",
    "DT project — light-up greetings card",
  ]);

  // Tools — 12
  emitTitled(ctx, {
    subject: "Design and technology",
    topic: "Tools",
    year_group: "Year 4",
    description: "Tool card with name and safety reminder.",
    style_notes: "Tool drawn cleanly, hazard pictogram if relevant",
    tags: ["tools", "DT"],
  }, [
    "Tool — scissors", "Tool — ruler", "Tool — hole punch",
    "Tool — junior hacksaw", "Tool — bench hook", "Tool — file",
    "Tool — bradawl", "Tool — sandpaper", "Tool — glue gun",
    "Tool — masking tape", "Tool — clamp", "Tool — vice",
  ]);

  // Joining methods — 6
  emitTitled(ctx, {
    subject: "Design and technology",
    topic: "Joining methods",
    year_group: "Year 4",
    description: "Joining-technique card showing two parts joined.",
    style_notes: "Side view of the join, materials labelled",
    tags: ["joining", "DT"],
  }, [
    "Join — PVA glue",
    "Join — masking tape",
    "Join — split pin",
    "Join — running stitch (textiles)",
    "Join — slot and tab (card)",
    "Join — paper fastener",
  ]);

  // Architecture / structures — 6
  emitTitled(ctx, {
    subject: "Design and technology",
    topic: "Structures",
    year_group: "Year 3",
    description: "Card explaining structural concepts (frame, shell, stability).",
    style_notes: "Simple skeletons of structures, force arrows",
    tags: ["structures", "DT"],
  }, [
    "Structure — frame (truss bridge)",
    "Structure — shell (eggshell / dome)",
    "Structure — stable vs unstable",
    "Structure — triangulation strength",
    "Structure — base and centre of gravity",
    "Structure — beam and column",
  ]);

  // Branding / packaging design (Y6) — 6
  emitTitled(ctx, {
    subject: "Design and technology",
    topic: "Packaging and branding",
    year_group: "Year 6",
    description: "Packaging / branding design template.",
    style_notes: "Net of a box laid flat, design areas marked",
    tags: ["packaging", "design"],
  }, [
    "Cereal box net (template)",
    "Toothpaste tube net",
    "Drinks carton net",
    "Logo design grid",
    "Slogan poster template",
    "Persuasive label sticker template",
  ]);
}
