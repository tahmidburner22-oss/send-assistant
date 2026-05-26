/**
 * GCSE Art / DT / Music / Drama — diagram catalogue.
 *
 * Bundled creative subjects. Anchored to AQA, Pearson Edexcel, OCR and
 * Eduqas specifications.
 *
 * Target: ~140 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

export function build(ctx) {
  // ── Art ─────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Art and Design",
    year_band: "GCSE",
    topic: "Sketchbook practice",
    year_group: "Year 10",
    description: "Sketchbook / portfolio diagram for GCSE Art.",
    style_notes: "Hand-drawn lines, captions in coloured pencil",
    tags: ["GCSE", "art", "sketchbook"],
  }, [
    "Mind-map starter page — central theme with branches",
    "Mood board template — collage panels",
    "Artist research page template — biography, image analysis, response",
    "Design development sequence — initial idea to refined",
    "Annotation template — what / why / how reflective questions",
    "Final piece planning grid — composition variants",
    "Showing development — same composition in three media",
    "Linking artists card — comparing two artists",
    "Recording and observation page — drawing tonal still life",
    "Self-evaluation grid — strengths / next steps",
  ]);

  emitTitled(ctx, {
    subject: "Art and Design",
    year_band: "GCSE",
    topic: "Art history and movements (copyright-safe homages)",
    year_group: "Year 11",
    description: "Simplified, stylised homage card for GCSE Art history — never a reproduction of the original.",
    style_notes: "Reduced palette and silhouette only; named with movement and date, attribution clearly marked as 'in the style of'",
    tags: ["GCSE", "art", "art-history", "copyright-safe"],
  }, [
    "Movement card — Renaissance (in the style of) chiaroscuro shading study",
    "Movement card — Baroque (in the style of) dramatic lighting",
    "Movement card — Romanticism (in the style of) sublime landscape",
    "Movement card — Impressionism (in the style of) — landscape with broken brushstrokes",
    "Movement card — Post-Impressionism (in the style of) heavy impasto",
    "Movement card — Cubism (in the style of) fragmented portrait silhouette",
    "Movement card — Surrealism (in the style of) melting-clock motif",
    "Movement card — Fauvism (in the style of) bold flat colour",
    "Movement card — Expressionism (in the style of) gestural mark-making",
    "Movement card — Pop Art (in the style of) comic-dot portrait silhouette",
    "Movement card — Op Art (in the style of) black-and-white moiré",
    "Movement card — Abstract Expressionism (in the style of) gestural drips",
    "Movement card — Bauhaus (in the style of) primary-colour grid",
    "Movement card — Land Art (in the style of) outdoor installation sketch",
    "Movement card — Street Art (in the style of) stencil silhouette",
  ]);

  emitTitled(ctx, {
    subject: "Art and Design",
    year_band: "GCSE",
    topic: "Materials and techniques",
    year_group: "Year 10",
    description: "Material / technique sample for GCSE Art.",
    style_notes: "Sample tile per technique, name and tool labelled",
    tags: ["GCSE", "art", "techniques"],
  }, [
    "Pencil — H to 9B tonal scale strip",
    "Charcoal — willow vs compressed comparison",
    "Ink wash — diluted black ink gradient",
    "Watercolour — wet-on-wet vs wet-on-dry",
    "Acrylic — impasto / dry brush / glaze comparison",
    "Oil paint — fat-over-lean rule card",
    "Printing — relief, intaglio, screen, monoprint comparison",
    "Lino-cut workflow — drawing to inking to printing",
    "Photography composition rules — rule of thirds, leading lines",
    "Sculpture — additive vs subtractive comparison",
    "Mixed media — collage layering technique",
    "Textiles — dyeing / printing / appliqué samples",
  ]);

  // ── DT ──────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Design and Technology",
    year_band: "GCSE",
    topic: "Iterative design",
    year_group: "Year 10",
    description: "Iterative design diagram for GCSE DT.",
    style_notes: "Cyclical flowchart with stages",
    tags: ["GCSE", "DT", "design-process"],
  }, [
    "Iterative design cycle — explore / create / evaluate",
    "Design specification — ACCESSFM template",
    "User-centred design — empathy / define / ideate / prototype / test",
    "Mood board template",
    "Mind-map template",
    "Sketching style — orthographic / isometric / perspective comparison",
    "Exploded view drawing template",
    "CAD vs CAM workflow",
    "3D printing — FDM layer-by-layer diagram",
    "Laser cutting — vector vs raster card",
    "CNC milling — toolpath diagram",
  ]);

  emitTitled(ctx, {
    subject: "Design and Technology",
    year_band: "GCSE",
    topic: "Materials and manufacture",
    year_group: "Year 11",
    description: "Materials / manufacture diagram for GCSE DT.",
    style_notes: "Material sample tiles with property chart",
    tags: ["GCSE", "DT", "materials"],
  }, [
    "Hardwood vs softwood vs manufactured boards comparison",
    "Ferrous vs non-ferrous metals — properties chart",
    "Polymers — thermoplastics vs thermosets comparison",
    "Smart materials — examples card",
    "Composites — examples and uses",
    "Modern materials — examples card (graphene, carbon fibre, Kevlar)",
    "Joining methods — woodworking joints (butt, lap, mortise & tenon, dovetail)",
    "Joining methods — metalwork (riveting, welding, soldering, brazing)",
    "Joining methods — polymers (plastic welding, adhesives)",
    "Surface finishes — wood (varnish, oil, stain), metal (galvanising, anodising)",
    "Manufacturing scales — one-off, batch, mass, continuous",
    "Quality control vs quality assurance",
    "Sustainability — 6 Rs poster",
    "Life-cycle assessment — four-stage diagram",
    "PPE chart — workshop safety",
  ]);

  emitTitled(ctx, {
    subject: "Design and Technology",
    year_band: "GCSE",
    topic: "Mechanical and electronic systems",
    year_group: "Year 11",
    description: "Mechanical or electronic-system diagram for GCSE DT.",
    style_notes: "Schematic with components labelled",
    tags: ["GCSE", "DT", "systems"],
  }, [
    "Mechanical motion — linear / rotary / reciprocating / oscillating",
    "Mechanism — lever (1st / 2nd / 3rd class)",
    "Mechanism — pulley (single / compound)",
    "Mechanism — gear ratio diagram",
    "Mechanism — cam and follower",
    "Mechanism — crank and slider",
    "Block diagram — input / process / output",
    "Sensor types — light, sound, pressure, temperature, motion",
    "Output devices — buzzer, LED, motor, solenoid",
    "Programmable system — microcontroller card",
  ]);

  // ── Music (GCSE) ────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Music",
    year_band: "GCSE",
    topic: "Elements of music",
    year_group: "Year 10",
    description: "Elements-of-music card for GCSE.",
    style_notes: "Notation snippet for each element",
    tags: ["GCSE", "music", "elements"],
  }, [
    "Pitch — staves, ledger lines, key signatures",
    "Rhythm — note values and rests",
    "Tempo — Italian terms hierarchy",
    "Dynamics — pp to ff scale",
    "Articulation — staccato / legato / accent / slur",
    "Texture — monophonic / homophonic / polyphonic / heterophonic",
    "Harmony — primary triads (I, IV, V) card",
    "Cadences — perfect / plagal / imperfect / interrupted",
    "Form — binary / ternary / rondo / sonata",
    "Modulation — common keys card",
    "Scales and modes — major, minor, pentatonic, whole tone, modes",
    "Chord symbols — Roman numerals vs jazz",
  ]);

  emitTitled(ctx, {
    subject: "Music",
    year_band: "GCSE",
    topic: "Instruments and ensembles",
    year_group: "Year 11",
    description: "Instrument / ensemble diagram for GCSE Music.",
    style_notes: "Silhouette of each instrument, family-colour palette",
    tags: ["GCSE", "music", "ensembles"],
  }, [
    "Symphony orchestra layout — bird's-eye view",
    "Chamber ensemble — string quartet / wind quintet",
    "Big band — saxophones / brass / rhythm section",
    "Pop band line-up",
    "World music — Indian classical, Gamelan, Latin American ensemble",
    "Choir layout — SATB",
    "Music technology — MIDI signal flow",
    "Music technology — DAW screen layout",
  ]);

  emitTitled(ctx, {
    subject: "Music",
    year_band: "GCSE",
    topic: "Set works analysis frames",
    year_group: "Year 11",
    description: "Set-work analysis scaffold for GCSE Music — generic frames, no copyrighted notation.",
    style_notes: "Boxed frame with stave snippets, exam-paper style",
    tags: ["GCSE", "music", "set-works", "analysis"],
  }, [
    "Listening analysis frame — instrumentation / texture / harmony / rhythm / structure",
    "Compare-and-contrast Venn for two set works",
    "Western classical — Baroque vs Classical vs Romantic timeline",
    "Popular music — rock 'n' roll → R&B → hip hop → grime timeline",
    "World music — comparing two world-music traditions",
    "Film music — leitmotif diagram",
    "Music for stage and screen — function-of-music card",
    "Composition checklist — melody / harmony / rhythm / texture",
  ]);

  // ── Drama (GCSE) ────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Drama",
    year_band: "GCSE",
    topic: "Drama techniques",
    year_group: "Year 10",
    description: "Drama-technique card for GCSE.",
    style_notes: "Stage silhouette, term in pill",
    tags: ["GCSE", "drama", "techniques"],
  }, [
    "Vocal skills — pitch / pace / pause / projection / accent / tone",
    "Physical skills — posture, gesture, movement, facial expression, gait",
    "Proxemics — actor distance and meaning",
    "Still image and freeze frame card",
    "Thought-tracking and monologue card",
    "Hot-seating and role-on-the-wall",
    "Cross-cutting and split-stage",
    "Soundscape and choral movement",
    "Status play card",
    "Mime and physical theatre card",
    "Naturalism vs non-naturalism comparison",
    "Verfremdungseffekt — Brechtian alienation card",
  ]);

  emitTitled(ctx, {
    subject: "Drama",
    year_band: "GCSE",
    topic: "Practitioners and theatre styles",
    year_group: "Year 11",
    description: "Drama practitioner diagram for GCSE.",
    style_notes: "Concept map per practitioner, key techniques in branches",
    tags: ["GCSE", "drama", "practitioners"],
  }, [
    "Stanislavski — naturalistic system card (objectives, magic if, given circumstances, emotion memory)",
    "Brecht — epic theatre card (V-effekt, gestus, placards, direct address)",
    "Artaud — Theatre of Cruelty card",
    "Boal — Theatre of the Oppressed card",
    "Berkoff — total theatre card",
    "Frantic Assembly — physical theatre card (chair duets, hymn hands)",
    "DV8 — physical theatre comparison",
    "Greek theatre — chorus and tragic structure",
    "Commedia dell'arte — stock characters",
    "Naturalism — Ibsen / Chekhov key features",
  ]);

  emitTitled(ctx, {
    subject: "Drama",
    year_band: "GCSE",
    topic: "Theatre roles and design",
    year_group: "Year 11",
    description: "Theatre design / production-role diagram for GCSE.",
    style_notes: "Floorplan or design sheet template",
    tags: ["GCSE", "drama", "design"],
  }, [
    "Stage configurations — proscenium, thrust, in-the-round, traverse, end-on, promenade",
    "Stage directions — upstage / downstage / left / right",
    "Lighting design template — colour, angle, intensity",
    "Sound design template — diegetic vs non-diegetic cues",
    "Costume design template",
    "Set design ground-plan template",
    "Production roles — director / designer / performer / technician",
    "Audience-actor relationship comparison",
    "Greek theatre layout — orchestra, skene, theatron",
    "Globe theatre layout — three-tier wooden O",
  ]);
}
