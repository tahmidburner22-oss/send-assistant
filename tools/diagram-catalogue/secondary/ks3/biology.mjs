/**
 * KS3 Biology — diagram catalogue (Year 7–9).
 *
 * Anchored to the DfE KS3 Science Programme of Study. Diagrams introduce
 * the cell / system / ecosystem vocabulary that pupils will meet again
 * (and have to draw with more rigour) at GCSE.
 *
 * Target: ~80 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Biology", year_band: "KS3" };
const STYLE_BIO =
  "Clean line-art with soft fill colours, label lines emanate to the right with 12pt sans-serif tags";
const TAGS_KS3 = ["KS3", "biology", "national-curriculum"];

export function build(ctx) {
  // ── Cells and microscopy ──────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Cells",
    year_group: "Year 7",
    description: "Cell-structure diagram for KS3 introduction to cells.",
    style_notes: STYLE_BIO,
    tags: [...TAGS_KS3, "cells", "cell-biology"],
  }, [
    "Animal cell — KS3 labelled (nucleus, cytoplasm, cell membrane, mitochondria, ribosomes)",
    "Plant cell — KS3 labelled (animal-cell parts plus cell wall, chloroplast, vacuole)",
    "Plant vs animal cell side-by-side comparison",
    "Specialised cell — red blood cell (biconcave, no nucleus)",
    "Specialised cell — sperm cell (tail, mitochondria, acrosome)",
    "Specialised cell — egg cell (jelly coat, cytoplasm rich in nutrients)",
    "Specialised cell — root hair cell",
    "Specialised cell — palisade leaf cell (chloroplast-rich)",
    "Specialised cell — nerve cell (long axon, dendrites)",
    "Specialised cell — ciliated epithelial cell",
    "Specialised cell — muscle cell (long fibres, mitochondria)",
    "Light microscope — labelled (eyepiece, objectives, stage, focus)",
    "How to use a microscope — five-step diagram",
    "Magnification triangle — image / actual / magnification formula",
    "Levels of organisation — cell → tissue → organ → organ system → organism",
    "Diffusion in cells — particle model with arrows across membrane",
  ]);

  // ── Body systems ──────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Body systems",
    year_group: "Year 7",
    description: "Human body-system overview for KS3.",
    style_notes: STYLE_BIO,
    tags: [...TAGS_KS3, "body-systems", "anatomy"],
  }, [
    "Skeletal system — labelled major bones (KS3 simplified)",
    "Joint types — hinge, ball-and-socket, pivot",
    "Muscle and joint — antagonistic pair (biceps and triceps)",
    "Digestive system — KS3 labelled with enzyme regions",
    "Respiratory system — KS3 labelled (trachea, bronchi, alveoli)",
    "Gas exchange in alveoli — diffusion arrows",
    "Circulatory system — KS3 double-circulation diagram",
    "Heart — KS3 labelled (atria, ventricles, valves)",
    "Blood components — red cells, white cells, platelets, plasma",
    "Reproductive system — male labelled (KS3, age-appropriate)",
    "Reproductive system — female labelled (KS3, age-appropriate)",
    "Menstrual cycle — 28-day labelled timeline",
    "Pregnancy — fetus in uterus with placenta and umbilical cord",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Health and lifestyle",
    year_group: "Year 8",
    description: "Health / lifestyle diagram aligned to KS3 PSHE-link content.",
    style_notes: STYLE_BIO,
    tags: [...TAGS_KS3, "health", "PSHE-link"],
  }, [
    "Eatwell Guide — UK food group proportions",
    "Energy needs by age and activity bar chart",
    "Drug categories — depressant / stimulant / hallucinogen / painkiller card",
    "Effect of smoking on lungs — healthy vs smoker comparison",
    "Effect of alcohol on the liver — healthy vs cirrhotic comparison",
    "Drug definition spectrum — caffeine to heroin",
  ]);

  // ── Plants and photosynthesis ────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Plants",
    year_group: "Year 7",
    description: "Plant-structure diagram for KS3.",
    style_notes: STYLE_BIO,
    tags: [...TAGS_KS3, "plants", "photosynthesis"],
  }, [
    "Leaf cross-section — KS3 labelled (waxy cuticle, palisade, spongy, stomata)",
    "Stomata open vs closed — guard cells",
    "Photosynthesis word equation — labelled inputs and outputs",
    "Photosynthesis symbol equation — 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
    "Limiting factors of photosynthesis — temperature / light / CO₂ graphs",
    "Plant transport — xylem vs phloem cross-section",
    "Pollination — insect vs wind-pollinated flower comparison",
    "Seed dispersal — wind / animal / water / explosion (4 panels)",
    "Plant life cycle — flowering plant",
    "Roots — primary, secondary, root hair zoom",
  ]);

  // ── Ecosystems and variation ─────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Ecosystems",
    year_group: "Year 8",
    description: "Ecosystem-level diagram for KS3.",
    style_notes: STYLE_BIO,
    tags: [...TAGS_KS3, "ecology", "ecosystems"],
  }, [
    "Food web — woodland ecosystem with multiple arrows",
    "Food web — grassland ecosystem",
    "Food web — pond ecosystem",
    "Pyramid of numbers — producer to tertiary consumer",
    "Pyramid of biomass",
    "Pyramid of energy — 10% transfer rule",
    "Predator-prey cycle graph — peaks offset",
    "Bioaccumulation — DDT through food chain",
    "Habitat sampling — quadrat use diagram",
    "Habitat sampling — line transect",
    "Habitat sampling — pooter / pitfall trap / sweep net",
    "Capture-mark-recapture — Lincoln Index method",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Variation, inheritance, evolution",
    year_group: "Year 9",
    description: "Variation / inheritance / evolution diagram for KS3.",
    style_notes: STYLE_BIO,
    tags: [...TAGS_KS3, "variation", "evolution", "inheritance"],
  }, [
    "Continuous vs discontinuous variation — height bar chart vs blood-group pie chart",
    "Inherited vs environmental factors — Venn diagram with examples",
    "DNA double helix — KS3 introduction with base-pair colours",
    "Chromosome diagram — pairs and gene location",
    "Selective breeding — wild mustard to broccoli/cabbage/cauliflower diagram",
    "Natural selection — Darwin's finches simplified",
    "Peppered moth — pre-industrial vs industrial selection",
    "Adaptation card — polar bear (KS3 features explained)",
    "Adaptation card — camel",
    "Adaptation card — cactus",
    "Adaptation card — kangaroo rat",
  ]);

  // ── Skills and required-practical foundations ───────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Working scientifically",
    year_group: "Year 7",
    description: "Practical-skill or scientific-method diagram for KS3.",
    style_notes: "Lab-style line-art with measuring equipment in grey, sample in coloured fill",
    tags: [...TAGS_KS3, "working-scientifically", "practical-skills"],
  }, [
    "Bunsen burner — labelled with safety flame and roaring flame",
    "Heating water bath apparatus diagram",
    "Boiling tube and test tube comparison",
    "Measuring cylinder — meniscus reading",
    "Variables card — independent / dependent / control",
    "Risk assessment template — hazard / risk / control",
    "Drawing graphs — choosing axes flowchart",
    "Drawing a line of best fit",
  ]);
}
