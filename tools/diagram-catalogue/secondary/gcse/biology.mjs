/**
 * GCSE Biology — diagram catalogue (Year 10–11).
 *
 * Anchored to AQA, Pearson Edexcel, OCR Gateway/21st-Century, WJEC and
 * Cambridge International GCSE Biology specifications. Heavy-priority
 * GCSE families flagged in the brief: cell organelles (animal / plant /
 * bacterial), required practicals (microscopy, food tests, osmosis
 * potato), enzyme lock-and-key, heart cross-section, nephron, neurone,
 * synapse, DNA structure, mitosis stages, meiosis stages, eutrophication,
 * food-web pyramids, phylogenetic trees.
 *
 * Target: ~180 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Biology", year_band: "GCSE" };
const STYLE_BIO =
  "Clean line-art with soft fill, label leaders to the right in 12pt sans-serif, exam-paper white background";
const TAGS = ["GCSE", "biology"];

export function build(ctx) {
  // ── Cell biology and microscopy ──────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Cell biology",
    year_group: "Year 10",
    description: "Cell-structure diagram for GCSE Biology.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "cells", "organelles"],
  }, [
    "Animal cell — fully labelled (nucleus, cytoplasm, cell membrane, mitochondria, ribosomes)",
    "Plant cell — fully labelled (animal-cell features plus cell wall, large permanent vacuole, chloroplasts)",
    "Plant vs animal cell side-by-side comparison with property table",
    "Bacterial cell — labelled (chromosomal DNA, plasmid, flagellum, cell wall, slime capsule)",
    "Yeast cell — labelled (eukaryotic single-cell)",
    "Eukaryotic vs prokaryotic comparison table",
    "Specialised cell — sperm cell labelled (acrosome, mitochondria, tail)",
    "Specialised cell — egg (ovum) labelled (cytoplasm, nucleus, jelly coat)",
    "Specialised cell — red blood cell (biconcave, no nucleus)",
    "Specialised cell — white blood cell (lobed nucleus, phagocyte)",
    "Specialised cell — nerve cell (axon, dendrites, myelin sheath, axon terminals)",
    "Specialised cell — muscle cell (long fibres, mitochondria-rich)",
    "Specialised cell — root hair cell (large surface area)",
    "Specialised cell — palisade leaf cell (chloroplast-rich)",
    "Specialised cell — xylem vessel (lignified, hollow)",
    "Specialised cell — phloem sieve tube and companion cell",
    "Specialised cell — ciliated epithelial cell",
    "Stem cell — embryonic vs adult comparison",
    "Stem cell — meristem in plant root tip",
    "Magnification triangle — image / actual size / magnification",
    "Light microscope — labelled parts (eyepiece, objective lenses, stage, focus knobs, mirror)",
    "Electron microscope vs light microscope — comparison table",
    "Required practical — microscopy with onion epidermal cells",
    "Required practical — microscopy with cheek epithelial cells",
    "Drawing biological diagrams — exam rules card (sharp pencil, no shading, label lines)",
  ]);

  // ── Cell division and DNA ────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Cell division and DNA",
    year_group: "Year 10",
    description: "Mitosis / meiosis / DNA diagram.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "mitosis", "meiosis", "DNA"],
  }, [
    "Cell cycle — labelled phases (G1, S, G2, mitosis, cytokinesis)",
    "Mitosis — prophase stage diagram",
    "Mitosis — metaphase stage diagram",
    "Mitosis — anaphase stage diagram",
    "Mitosis — telophase and cytokinesis",
    "Mitosis — full sequence overview",
    "Meiosis — interphase and pairing of homologous chromosomes",
    "Meiosis I — prophase I with crossing over",
    "Meiosis I — metaphase I, independent assortment",
    "Meiosis I — anaphase I and telophase I",
    "Meiosis II — full second division",
    "Meiosis — full sequence overview",
    "Mitosis vs meiosis — comparison table",
    "DNA structure — double helix labelled (sugar-phosphate backbone, base pairs, hydrogen bonds)",
    "DNA bases — A, T, C, G complementary pairing",
    "Chromosome — labelled (chromatid, centromere, telomere)",
    "Genome and gene — relationship card",
    "Protein synthesis — transcription overview (DNA → mRNA)",
    "Protein synthesis — translation overview (mRNA → protein at ribosome)",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Inheritance and genetics",
    year_group: "Year 11",
    description: "Inheritance / Punnett-square / pedigree diagram for GCSE.",
    style_notes: "Punnett squares 2×2, alleles in capital/lower-case",
    tags: [...TAGS, "genetics", "inheritance"],
  }, [
    "Punnett square — Bb × Bb (3:1 phenotype)",
    "Punnett square — BB × bb (all heterozygous)",
    "Punnett square — Bb × bb (1:1 ratio)",
    "Sex determination — XY chromosomes Punnett square",
    "Pedigree chart — autosomal recessive (e.g. cystic fibrosis)",
    "Pedigree chart — autosomal dominant (e.g. polydactyly)",
    "Pedigree chart — sex-linked (e.g. colour blindness)",
    "Codominance — blood groups inheritance card",
    "Genetic engineering — restriction enzyme and ligase cut/paste",
    "Cloning a plant — cuttings vs tissue culture",
    "Cloning an animal — Dolly the sheep simplified",
    "Selective breeding — wild crops to modern crops",
  ]);

  // ── Cell transport and biological molecules ─────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Cell transport",
    year_group: "Year 10",
    description: "Diffusion / osmosis / active-transport diagram.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "transport", "osmosis"],
  }, [
    "Diffusion — particles down a concentration gradient",
    "Osmosis — water across a partially permeable membrane",
    "Active transport — pump against the gradient with ATP",
    "Surface-area-to-volume ratio — cube comparison card",
    "Required practical — osmosis with potato cylinders (procedure)",
    "Required practical — osmosis results graph (mass change vs concentration)",
    "Required practical — finding isotonic concentration from intercept",
    "Plasmolysis — plant cell in concentrated solution",
    "Turgid vs flaccid plant cell card",
    "Animal cell in pure water — bursting (lysis)",
    "Animal cell in concentrated solution — crenation",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Enzymes and biological molecules",
    year_group: "Year 10",
    description: "Enzyme / molecule diagram for GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "enzymes", "biological-molecules"],
  }, [
    "Enzyme — lock and key model",
    "Enzyme — induced-fit model (higher tier flag)",
    "Enzyme activity vs temperature — peak then sharp drop graph",
    "Enzyme activity vs pH — bell-curve graph",
    "Enzyme activity vs substrate concentration — plateau",
    "Denaturation — active site distorted",
    "Required practical — effect of pH on amylase activity (procedure)",
    "Required practical — food test (Benedict's for reducing sugars)",
    "Required practical — food test (iodine for starch)",
    "Required practical — food test (Biuret for proteins)",
    "Required practical — food test (Sudan III / ethanol for lipids)",
    "Calorimetry — burning a peanut to estimate energy in food",
    "Carbohydrate structure — glucose ring",
    "Protein structure — amino-acid chain",
    "Lipid structure — glycerol and three fatty acids",
  ]);

  // ── Organisation — tissues and organs ────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Digestion and digestive system",
    year_group: "Year 10",
    description: "Digestive-system diagram for GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "digestion", "digestive-system"],
  }, [
    "Digestive system — fully labelled with enzyme regions",
    "Stomach — labelled (cardia, fundus, body, pylorus, gastric pits)",
    "Small intestine cross-section — villi labelled",
    "Villus — labelled (microvilli, capillary network, lacteal)",
    "Pancreas, liver, gall bladder — accessory organs",
    "Bile — emulsification of lipids cartoon",
    "Enzyme summary table — amylase, protease, lipase substrates / products / sites",
    "Adaptations of the small intestine — list with diagram",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Heart and circulatory system",
    year_group: "Year 10",
    description: "Heart / blood-vessel diagram for GCSE.",
    style_notes: STYLE_BIO + ", oxygenated blood in red, deoxygenated in blue",
    tags: [...TAGS, "circulation", "heart"],
  }, [
    "Heart — fully labelled cross-section (atria, ventricles, valves, vessels)",
    "Heart — exam-paper unlabelled outline (for pupil to label)",
    "Cardiac cycle — three phases (atrial systole / ventricular systole / diastole)",
    "Double circulation — pulmonary and systemic loops",
    "Coronary arteries — supply to the heart muscle",
    "Pacemaker — natural sinoatrial node and artificial pacemaker",
    "Artery cross-section — thick muscular wall, narrow lumen",
    "Vein cross-section — thinner wall, valves",
    "Capillary — single-cell-thick wall for exchange",
    "Three blood vessels comparison table",
    "Blood components — red cells, white cells, platelets, plasma",
    "Required practical — measuring pulse and effect of exercise",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Respiratory system and gas exchange",
    year_group: "Year 10",
    description: "Respiratory diagram for GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "respiration", "gas-exchange"],
  }, [
    "Respiratory system — fully labelled (trachea, bronchi, bronchioles, alveoli, diaphragm)",
    "Alveolus — labelled with capillary, diffusion arrows",
    "Inhalation vs exhalation — diaphragm and ribcage diagram",
    "Adaptations of the alveoli — list with diagram",
    "Aerobic respiration word equation — labelled",
    "Aerobic respiration symbol equation — C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O",
    "Anaerobic respiration in muscle cells — lactic acid",
    "Anaerobic respiration in yeast — fermentation (ethanol + CO₂)",
    "Oxygen debt diagram — exercise then recovery",
    "Required practical — investigating respiration in germinating seeds",
  ]);

  // ── Plant biology ───────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Photosynthesis and plant transport",
    year_group: "Year 10",
    description: "Plant-biology diagram for GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "photosynthesis", "plant-biology"],
  }, [
    "Photosynthesis word equation — labelled with conditions",
    "Photosynthesis symbol equation — 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
    "Leaf cross-section — fully labelled (cuticle, palisade, spongy, vascular bundle, stomata)",
    "Chloroplast — labelled (thylakoid, stroma, double membrane)",
    "Limiting factors of photosynthesis — light intensity graph",
    "Limiting factors of photosynthesis — CO₂ concentration graph",
    "Limiting factors of photosynthesis — temperature graph",
    "Inverse-square law — light intensity vs distance",
    "Required practical — effect of light intensity on photosynthesis (pondweed)",
    "Stomata open vs closed — guard-cell diagram",
    "Xylem and phloem cross-section — labelled",
    "Transpiration — pathway through the plant",
    "Required practical — investigating transpiration with a potometer",
    "Translocation — sugars in the phloem",
  ]);

  // ── Homeostasis, hormones and the nervous system ─────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Nervous system",
    year_group: "Year 11",
    description: "Neurone / synapse / reflex-arc diagram.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "nervous-system", "synapse"],
  }, [
    "Motor neurone — labelled (cell body, axon, dendrites, myelin sheath, nodes of Ranvier, axon terminal)",
    "Sensory neurone — labelled (receptor end, cell body off the axon)",
    "Relay neurone — short, simple structure",
    "Synapse — labelled (vesicles, neurotransmitter, receptor)",
    "Reflex arc — labelled (stimulus, receptor, sensory, relay, motor, effector)",
    "Reflex action — knee-jerk example",
    "Reflex action — withdrawing hand from a hot object",
    "Central vs peripheral nervous system card",
    "Brain — major regions (cerebrum, cerebellum, medulla, hypothalamus)",
    "Eye — labelled (cornea, iris, pupil, lens, retina, optic nerve, fovea, blind spot)",
    "Iris reflex — bright vs dim light pupil size",
    "Accommodation — near vs far object lens shape",
    "Long-sightedness vs short-sightedness — corrected with lenses",
    "Reaction-time experiment — ruler-drop method",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Hormones and homeostasis",
    year_group: "Year 11",
    description: "Hormone / homeostasis diagram for GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "hormones", "homeostasis"],
  }, [
    "Endocrine system — major glands labelled",
    "Negative feedback — generic loop diagram",
    "Blood glucose regulation — insulin and glucagon loop",
    "Type 1 vs Type 2 diabetes — comparison",
    "Thermoregulation — sweating and shivering response",
    "Vasoconstriction vs vasodilation — capillary diagram",
    "Menstrual cycle — labelled hormone graph (LH, FSH, oestrogen, progesterone)",
    "Contraception methods — comparison chart",
    "IVF process — step diagram",
    "Adrenaline — fight-or-flight response",
    "Thyroxine — negative feedback loop",
    "Plant hormones — phototropism (auxin) experiment",
    "Plant hormones — gravitropism shoot vs root",
  ]);

  // ── Kidney and water balance ────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Excretion and the kidney",
    year_group: "Year 11",
    description: "Kidney / nephron diagram for GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "kidney", "nephron", "excretion"],
  }, [
    "Urinary system — labelled (kidneys, ureters, bladder, urethra)",
    "Kidney — labelled cross-section (cortex, medulla, pelvis, ureter)",
    "Nephron — fully labelled (glomerulus, Bowman's capsule, PCT, loop of Henle, DCT, collecting duct)",
    "Ultrafiltration — at the glomerulus",
    "Selective reabsorption — in the proximal convoluted tubule",
    "ADH and water reabsorption — collecting duct response",
    "Kidney failure treatments — dialysis vs transplant comparison",
    "Dialysis machine — labelled apparatus",
  ]);

  // ── Health and disease ──────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Communicable disease",
    year_group: "Year 11",
    description: "Pathogen / immune-response diagram for GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "disease", "immune-system"],
  }, [
    "Pathogen types — bacteria / virus / fungus / protist comparison",
    "Pathogen example — measles virus (named diseases card)",
    "Pathogen example — HIV (named diseases card)",
    "Pathogen example — Salmonella (food poisoning)",
    "Pathogen example — Tuberculosis (Mycobacterium)",
    "Pathogen example — Rose black spot (fungus)",
    "Pathogen example — Malaria (Plasmodium / mosquito vector)",
    "Pathogen example — Tobacco mosaic virus",
    "Body's defences — skin, mucus, cilia, stomach acid",
    "White blood cell roles — phagocytosis / antibodies / antitoxins",
    "Vaccination — antigen exposure to memory cells",
    "Antibiotic vs antiviral — why antibiotics don't kill viruses",
    "Antibiotic resistance — bacteria selection diagram",
    "Drug development — preclinical / clinical trials phases",
    "Monoclonal antibody production — process diagram",
    "Monoclonal antibody applications — pregnancy test, cancer therapy",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Non-communicable disease and lifestyle",
    year_group: "Year 11",
    description: "Lifestyle / non-communicable disease diagram.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "lifestyle-disease"],
  }, [
    "Risk-factor card — smoking and lung disease",
    "Risk-factor card — obesity and Type 2 diabetes",
    "Risk-factor card — alcohol and liver disease",
    "Risk-factor card — radiation and cancer",
    "Cardiovascular disease — atheroma in artery cross-section",
    "Coronary heart disease — stent and bypass diagram",
    "Tumour — benign vs malignant comparison",
    "Cancer cell — uncontrolled cell division",
    "BMI calculation card — kg/m² formula",
  ]);

  // ── Ecology, evolution, classification ──────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Ecology",
    year_group: "Year 11",
    description: "Ecology diagram for GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "ecology", "ecosystems"],
  }, [
    "Food chain — producer to tertiary consumer",
    "Food web — woodland ecosystem with multiple arrows",
    "Food web — pond ecosystem with multiple arrows",
    "Pyramid of numbers — typical step shape",
    "Pyramid of biomass — typical narrowing shape",
    "Pyramid of energy — strict 10% transfer",
    "Predator-prey graph — phase-shifted curves",
    "Carbon cycle — fully labelled",
    "Water cycle — fully labelled",
    "Nitrogen cycle — fully labelled with bacteria stages",
    "Decomposition — bacteria and fungi roles",
    "Eutrophication — fertiliser runoff to algal bloom",
    "Eutrophication — oxygen depletion and fish kill stages",
    "Biodiversity — sampling with a quadrat",
    "Sampling — line transect along an environmental gradient",
    "Sampling — kick / sweep nets in a stream",
    "Required practical — distribution of species using quadrats",
    "Climate change — greenhouse gases and global warming diagram",
    "Climate change — effects on ecosystems",
    "Deforestation — causes and consequences card",
    "Conservation — captive breeding programme card",
    "Indicator species — clean / polluted water examples",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Evolution and classification",
    year_group: "Year 11",
    description: "Evolution / classification diagram for GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "evolution", "classification"],
  }, [
    "Theory of natural selection — four-step diagram",
    "Variation — continuous vs discontinuous histogram vs bar chart",
    "Adaptation — Darwin's finches with beak variations",
    "Peppered moth — directional selection diagram",
    "Antibiotic resistance — bacterial population over time",
    "Speciation — geographic isolation diagram",
    "Fossil record — types of fossil formation",
    "Phylogenetic tree — primates simplified",
    "Phylogenetic tree — vertebrates simplified",
    "Phylogenetic tree — six kingdoms",
    "Linnaean classification ladder — kingdom to species",
    "Three-domain system — Archaea / Bacteria / Eukarya",
    "Extinction — causes summary card",
  ]);

  // ── Photosynthesis and respiration deepened (combined) ──────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Bioenergetics deep-dive",
    year_group: "Year 11",
    description: "Bioenergetics diagram for higher-tier GCSE.",
    style_notes: STYLE_BIO,
    tags: [...TAGS, "bioenergetics", "higher"],
  }, [
    "Mitochondrion — labelled (matrix, cristae, double membrane)",
    "Site of aerobic respiration — mitochondrion vs cytoplasm",
    "ATP role card — universal energy currency",
    "Metabolism overview — anabolic and catabolic reactions",
    "Lactate buildup vs oxygen debt graph",
  ]);
}
