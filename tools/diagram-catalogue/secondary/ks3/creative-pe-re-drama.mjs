/**
 * KS3 Art / DT / Music / PE / RE / Drama — diagram catalogue (Y7–9).
 *
 * Smaller subjects bundled to share a file. Each subject is a self-contained
 * emitTitled block — pulling apart later is straightforward.
 *
 * Target: ~220 entries combined.
 */
import { emitTitled } from "../../_helpers.mjs";

const TAGS_KS3 = ["KS3"];

export function build(ctx) {
  // ── Art ───────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Art",
    year_band: "KS3",
    topic: "Formal elements",
    year_group: "Year 7",
    description: "Formal-element reference card for KS3 Art.",
    style_notes: "Visual example of each element on a clean white background, term in pill",
    tags: [...TAGS_KS3, "art", "formal-elements"],
  }, [
    "Line — types card (continuous, broken, hatched, cross-hatched)",
    "Tone — value scale dark to light",
    "Texture — visual vs tactile examples",
    "Shape — geometric vs organic",
    "Form — 2D shape becomes 3D form (sphere from circle)",
    "Colour — primary / secondary / tertiary wheel",
    "Pattern — repeat / radial / symmetrical",
    "Composition — rule of thirds overlay",
  ]);

  emitTitled(ctx, {
    subject: "Art",
    year_band: "KS3",
    topic: "Art history (copyright-safe homages)",
    year_group: "Year 8",
    description: "Simplified, stylised homage card for KS3 Art history — never a reproduction of the original work.",
    style_notes: "Reduced palette and silhouette only; named with movement and date, attribution clearly marked as 'in the style of'",
    tags: [...TAGS_KS3, "art-history", "copyright-safe"],
  }, [
    "Movement card — Impressionism (in the style of) — landscape with broken brushstrokes",
    "Movement card — Cubism — fragmented portrait silhouette",
    "Movement card — Surrealism — melting-clock motif",
    "Movement card — Pop Art — comic-dot portrait silhouette",
    "Movement card — Abstract Expressionism — gestural drips suggestion",
    "Movement card — Bauhaus — primary-colour geometric grid",
    "Movement card — Art Nouveau — flowing vine border",
    "Movement card — Op Art — black-and-white moiré pattern",
  ]);

  emitTitled(ctx, {
    subject: "Art",
    year_band: "KS3",
    topic: "Drawing skills",
    year_group: "Year 7",
    description: "Drawing-technique scaffold for KS3 Art.",
    style_notes: "Hand-drawn line in pencil 2B, instructional captions",
    tags: [...TAGS_KS3, "drawing", "skills"],
  }, [
    "One-point perspective — vanishing point on horizon",
    "Two-point perspective — corner of a building",
    "Three-point perspective — looking up at a tower",
    "Drawing the human face — proportions guideline",
    "Drawing the human figure — rule-of-eight heads",
    "Drawing hands — cylinder-and-block construction",
    "Still-life arrangement — overlapping objects rule",
    "Mark-making sample sheet — eight techniques",
    "Tonal sphere — five-tone shading worked example",
  ]);

  // ── Design and Technology ────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Design and Technology",
    year_band: "KS3",
    topic: "Design process",
    year_group: "Year 8",
    description: "Iterative-design process diagram for KS3 DT.",
    style_notes: "Cyclical flowchart with arrows, milestones in coloured pills",
    tags: [...TAGS_KS3, "DT", "design-process"],
  }, [
    "Iterative design cycle — explore / create / evaluate",
    "Design specification template — ACCESSFM",
    "Mood board template",
    "Mind-map template — central problem with branches",
    "User research card — survey, interview, observe",
    "Prototype to product progression",
    "Sustainability — 6 Rs poster (rethink/refuse/reduce/reuse/repair/recycle)",
    "Iterative testing diary template",
  ]);

  emitTitled(ctx, {
    subject: "Design and Technology",
    year_band: "KS3",
    topic: "Materials and tools",
    year_group: "Year 8",
    description: "Materials / tools card for KS3 DT.",
    style_notes: "Photo-style icon for each material, properties chart",
    tags: [...TAGS_KS3, "DT", "materials"],
  }, [
    "Hardwood vs softwood card",
    "Metals — ferrous vs non-ferrous comparison",
    "Polymers — thermoplastics vs thermosets",
    "Smart materials — examples card (shape-memory alloy, photochromic)",
    "Modern materials — examples card (Kevlar, carbon fibre)",
    "Joining methods — woodworking joints (butt, lap, mortise & tenon)",
    "Fasteners — screw / nail / rivet / bolt",
    "Workshop safety poster — PPE chart",
    "Marking-out tools — try square, marking gauge, scriber",
    "Tenon saw vs coping saw vs hacksaw",
    "Drill bits — twist / forstner / countersink",
  ]);

  // ── Music ────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Music",
    year_band: "KS3",
    topic: "Music notation",
    year_group: "Year 7",
    description: "Music-notation card for KS3.",
    style_notes: "Treble / bass clef in black, notes filled, leger lines for ledgered notes",
    tags: [...TAGS_KS3, "music", "notation"],
  }, [
    "Treble clef — note names on lines and spaces",
    "Bass clef — note names on lines and spaces",
    "Note values — semibreve, minim, crotchet, quaver, semiquaver",
    "Rest values — equivalent rest for each note",
    "Time signature — 4/4 vs 3/4 vs 6/8",
    "Key signature — C, G, D, F majors",
    "Major and minor scales — C major and A minor compared",
    "Dynamics chart — pp / p / mp / mf / f / ff",
    "Tempo markings — Largo, Andante, Allegro, Presto",
    "Articulation — legato, staccato, accent, slur",
  ]);

  emitTitled(ctx, {
    subject: "Music",
    year_band: "KS3",
    topic: "Instruments and ensembles",
    year_group: "Year 8",
    description: "Instrument family card for KS3 Music.",
    style_notes: "Silhouette of each instrument, family-colour palette",
    tags: [...TAGS_KS3, "music", "instruments"],
  }, [
    "Strings family — violin, viola, cello, double bass",
    "Woodwind family — flute, oboe, clarinet, bassoon",
    "Brass family — trumpet, French horn, trombone, tuba",
    "Percussion family — pitched vs unpitched",
    "Symphony orchestra layout — bird's-eye view",
    "Pop band line-up — drums, bass, guitar, vocals, keys",
    "Jazz combo line-up — rhythm vs front line",
    "Indian classical ensemble — sitar, tabla, tanpura",
    "Gamelan ensemble — gong, metallophone, drum",
    "Choir layout — SATB labels",
  ]);

  // ── PE ───────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "PE",
    year_band: "KS3",
    topic: "Anatomy and physiology (introduction)",
    year_group: "Year 9",
    description: "PE anatomy diagram for KS3 — used as an entry-point to GCSE PE content.",
    style_notes: "Outline figure with muscle groups in red overlay, bones in white skeleton overlay",
    tags: [...TAGS_KS3, "PE", "anatomy"],
  }, [
    "Major bones of the body — labelled (cranium, vertebrae, ribs, humerus, femur, etc.)",
    "Major muscles — biceps, triceps, deltoids, quadriceps, hamstrings, gastrocnemius",
    "Synovial joint cross-section — labelled",
    "Cardiovascular system — heart and major vessels",
    "Respiratory system — lungs and airways",
    "Components of fitness wheel — speed, strength, stamina, suppleness, etc.",
    "Warm-up phases — pulse-raiser, mobiliser, stretch",
    "Cool-down phases — pulse-lower, static stretch",
    "Heart rate zones — aerobic / anaerobic / max",
    "FITT principle card — Frequency, Intensity, Time, Type",
  ]);

  emitTitled(ctx, {
    subject: "PE",
    year_band: "KS3",
    topic: "Tactics and skills",
    year_group: "Year 8",
    description: "PE pitch / court diagram for KS3.",
    style_notes: "Aerial view of pitch with player positions, arrows for movement",
    tags: [...TAGS_KS3, "PE", "tactics"],
  }, [
    "Football pitch — position diagram (4-4-2)",
    "Football pitch — 4-3-3 formation",
    "Netball court — seven positions and zones",
    "Basketball court — labelled key markings",
    "Rugby pitch — line-out and scrum positions",
    "Hockey pitch — labelled dimensions",
    "Tennis court — singles vs doubles lines",
    "Athletics track — 400 m oval with lanes",
    "High jump — Fosbury flop technique sequence",
    "Long jump — approach / take-off / flight / landing",
  ]);

  // ── RE ───────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "RE",
    year_band: "KS3",
    topic: "World religions overview",
    year_group: "Year 7",
    description: "World-religion fact-card for KS3 RE — symbols and key beliefs.",
    style_notes: "Religion symbol large at top, founder / sacred text / key beliefs in cards beneath",
    tags: [...TAGS_KS3, "RE", "world-religions"],
  }, [
    "Christianity — cross symbol and core beliefs card",
    "Islam — crescent and star, key beliefs (5 pillars) card",
    "Hinduism — Aum symbol, dharma / karma / moksha card",
    "Sikhism — Khanda symbol, 5 Ks card",
    "Judaism — Star of David, Torah and mitzvot card",
    "Buddhism — wheel of dharma, Four Noble Truths card",
    "Humanism — happy human symbol, ethical principles card",
  ]);

  emitTitled(ctx, {
    subject: "RE",
    year_band: "KS3",
    topic: "Places of worship",
    year_group: "Year 8",
    description: "Place-of-worship layout diagram for KS3 RE.",
    style_notes: "Floorplan with key features labelled in coloured pills",
    tags: [...TAGS_KS3, "RE", "places-of-worship"],
  }, [
    "Church — labelled (altar, pulpit, font, nave, lectern)",
    "Mosque — labelled (mihrab, minbar, qibla wall, minaret)",
    "Mandir (Hindu temple) — labelled (murtis, garbhagriha, mandapa)",
    "Gurdwara — labelled (Guru Granth Sahib, langar hall)",
    "Synagogue — labelled (bimah, ark, ner tamid)",
    "Buddhist vihara / temple — labelled (stupa, shrine, prayer hall)",
    "Kaaba — Mecca diagram (no figurative depiction of the Prophet ﷺ)",
  ]);

  emitTitled(ctx, {
    subject: "RE",
    year_band: "KS3",
    topic: "Festivals and rituals",
    year_group: "Year 9",
    description: "Festival / ritual diagram for KS3 RE.",
    style_notes: "Calendar layout, symbol for each festival",
    tags: [...TAGS_KS3, "RE", "festivals"],
  }, [
    "Christmas, Easter, Pentecost — Christian calendar card",
    "Ramadan, Eid al-Fitr, Eid al-Adha — Islamic calendar card",
    "Diwali, Holi, Navratri — Hindu calendar card",
    "Vaisakhi, Bandi Chhor Divas — Sikh calendar card",
    "Passover, Yom Kippur, Hanukkah — Jewish calendar card",
    "Vesak, Wesak — Buddhist calendar card",
    "Christian baptism — symbolic actions diagram",
    "Bar Mitzvah / Bat Mitzvah — coming-of-age rite card",
    "Hindu samskara — life-cycle rituals timeline",
    "Hajj — five-day Mecca pilgrimage steps (no figurative depiction of the Prophet ﷺ)",
  ]);

  // ── Drama ────────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    subject: "Drama",
    year_band: "KS3",
    topic: "Drama techniques",
    year_group: "Year 8",
    description: "Drama-technique card for KS3.",
    style_notes: "Stage silhouettes, action arrows, term highlighted in pill",
    tags: [...TAGS_KS3, "drama", "techniques"],
  }, [
    "Still image (freeze frame) — definition card",
    "Thought-tracking — speaker addresses audience",
    "Hot-seating — character in chair, audience asking",
    "Cross-cutting — split-stage two scenes",
    "Soundscape — sound layers cue card",
    "Choral movement — synchronised group action",
    "Status play — high vs low status comparison",
    "Mime — silent storytelling sequence",
    "Direct address — actor breaks the fourth wall",
    "Narration — narrator role card",
  ]);

  emitTitled(ctx, {
    subject: "Drama",
    year_band: "KS3",
    topic: "Stage and theatre",
    year_group: "Year 7",
    description: "Theatre / stage diagram for KS3 Drama.",
    style_notes: "Bird's-eye stage with audience / wings labelled",
    tags: [...TAGS_KS3, "drama", "theatre"],
  }, [
    "Stage types — proscenium, thrust, in-the-round, traverse, end-on",
    "Stage areas — upstage / downstage / left / right",
    "Lighting basics — spotlight, flood, gel colours",
    "Costume design template",
    "Set design ground-plan template",
    "Greek theatre layout — orchestra, skene, theatron",
    "Globe theatre layout — three-tier wooden O",
  ]);
}
