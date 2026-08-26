import { canonicalTopicKey } from "../server/lib/topicNormalizer.js";
import { SCIENCE_IMAGE_TAXONOMY, type ScienceImageTopic } from "./scienceImageTaxonomy.js";

export const SCIENCE_IMAGE_GENERATOR_MODEL = "gpt-image-2" as const;
export const SCIENCE_IMAGE_PROMPT_VERSION = "science-library-v1.0" as const;
export type ScienceImageSlot = "diagram_a" | "diagram_b" | "revision_map";

export interface ScienceImageManifestEntry {
  assetId: string;
  taxonomyId: string;
  title: string;
  stage: ScienceImageTopic["stage"];
  yearGroups: string[];
  discipline: ScienceImageTopic["discipline"];
  topic: string;
  subtopic: string;
  canonicalTopicKey: string;
  canonicalSubtopicKey: string;
  aliases: string[];
  learningFocus: string;
  visualProfile: ScienceImageTopic["visualProfile"];
  specificationRefs: string[];
  requiredPractical: boolean;
  diagramType: ScienceImageSlot;
  generatorModel: typeof SCIENCE_IMAGE_GENERATOR_MODEL;
  promptVersion: typeof SCIENCE_IMAGE_PROMPT_VERSION;
  prompt: string;
  altText: string;
  reviewChecklist: string[];
}

const baseConstraints = [
  "Produce one single standalone landscape 3:2 educational diagram for insertion into a worksheet.",
  "Use a clean off-white background, crisp high-contrast lines, restrained colour coding, no logos, no watermarks, no decorative border and no photography.",
  "Use only a few short labels that are explicitly necessary for the concept. Do not invent terminology, values, equations, measurements, organisms, chemical species, apparatus, hazards or explanatory claims.",
  "Do not include a title, paragraph, key, quiz, answer, worksheet instructions or branding. Leave comfortable white space around the main representation.",
  "The diagram must be scientifically coherent in every causal relation, arrow direction, quantity, structure and visual convention; do not substitute a pretty but scientifically inaccurate image.",
].join(" ");

const profileDirection: Record<ScienceImageTopic["visualProfile"], string> = {
  "primary-playful": [
    "Audience: primary pupils.",
    "Make the visual welcoming, concrete and fun to explore, but do not give objects human faces if this could obscure their scientific properties.",
    "Use one familiar focal object or scene, chunky but clean shapes, very short child-friendly labels and colour plus shape/pattern differentiation.",
    "Keep the number of visual elements low enough for talk, sorting, prediction or labelling activity.",
  ].join(" "),
  "ks3-technical": [
    "Audience: KS3 pupils developing disciplinary scientific models.",
    "Use accurate textbook-style schematic conventions, restrained colour and concise terminology. Include normal scientific arrows, symbols, units and representations where relevant.",
    "Make boundaries, directions, particles, apparatus, variables and scale relationships unambiguous; do not add GCSE-only content unless it is essential to the stated learning focus.",
  ].join(" "),
  "gcse-exam": [
    "Audience: GCSE science pupils.",
    "Use an examination-quality technical schematic. Conform to standard GCSE science notation: conventional circuit symbols, correct chemical formulae and charges, correct ray-arrow or field-line direction, clear variable labels and SI units where relevant.",
    "Any graph must use meaningful axis labels and units, a suitable scale, no fabricated measurements and a correctly shaped qualitative relationship where exact data are not supplied.",
    "Any apparatus must be physically buildable, safe, and show the intended independent, dependent and control variables without overstating precision.",
  ].join(" "),
};

function slotDirection(item: ScienceImageTopic, slot: ScienceImageSlot): string {
  if (slot === "diagram_a") return `Diagram A job: ${item.diagramA}`;
  if (slot === "diagram_b") return `Diagram B job: ${item.diagramB}`;
  return `Revision-map job: ${item.revisionMap || `Create a concise retrieval structure for ${item.subtopic}.`}`;
}

function contentRiskGuards(item: ScienceImageTopic): string[] {
  const text = `${item.topic} ${item.subtopic}`.toLowerCase();
  const guards: string[] = [];
  if (/(circuit|electricity|electrolysis)/.test(text)) guards.push("Use recognised UK circuit symbols and unambiguous wire connections; never use household icons in place of schematic symbols.");
  if (/(atom|ionic|covalent|metallic|formula|chemical|reaction|acid|alkali|electrolysis|chromatography)/.test(text)) guards.push("Do not invent element symbols, ion charges, chemical formulae, reaction products, balanced equations, molecular structures or test results.");
  if (/(light|ray|lens|mirror|wave|sound|electromagnetic)/.test(text)) guards.push("Use conventional ray or wave arrows, and never mix longitudinal and transverse representations.");
  if (/(force|motion|speed|pressure|energy|magnet|orbit)/.test(text)) guards.push("Use arrows only for the physical quantity represented and make direction and label meanings explicit.");
  if (/(graph|rate|practical|variables|investigation|osmosis|microscopy|sampling)/.test(text) || item.requiredPractical) guards.push("Do not omit control variables, safety-critical apparatus features or the units/variables required to interpret a scientific investigation.");
  if (/(human|reproduction|pregnancy|menstrual)/.test(text)) guards.push("Use medically accurate, neutral, age-appropriate anatomical representation; no sexualised imagery and no unnecessary detail.");
  return guards;
}

function expectedReviewChecklist(item: ScienceImageTopic, slot: ScienceImageSlot): string[] {
  const common = [
    "The title, topic, subtopic and stage match the taxonomy record exactly.",
    "The image contains no fabricated scientific claims, labels, values or symbols.",
    "The visual profile is appropriate to the stated age group and no learning depends on colour alone.",
    "The asset is a genuine complement to the other slot, rather than a near duplicate.",
    `Provenance records ${SCIENCE_IMAGE_GENERATOR_MODEL} and ${SCIENCE_IMAGE_PROMPT_VERSION}.`,
  ];
  if (item.visualProfile !== "primary-playful") common.push("Scientific notation, units, arrows, formulae, graph conventions and apparatus geometry have been checked against the referenced content.");
  if (item.requiredPractical) common.push("The required-practical apparatus, independent/dependent/control variables, measurement method and safety assumptions are valid.");
  if (slot === "revision_map") common.push("The revision map is concise, hierarchy-led and does not add claims beyond the stated specification reference.");
  return common;
}

export function buildScienceImagePrompt(item: ScienceImageTopic, slot: ScienceImageSlot): string {
  const specification = item.specificationRefs.length ? `Curriculum reference: ${item.specificationRefs.join("; ")}.` : "";
  const practical = item.requiredPractical ? "This is a required-practical context: make the apparatus, method variables and safety details physically plausible and scientifically valid." : "";
  return [
    `Create a scientifically accurate science educational diagram for ${item.stage}, ${item.discipline}.`,
    `Topic: ${item.topic}. Subtopic: ${item.subtopic}. Learning focus: ${item.learningFocus}.`,
    specification,
    slotDirection(item, slot),
    profileDirection[item.visualProfile],
    practical,
    baseConstraints,
    ...contentRiskGuards(item),
  ].filter(Boolean).join("\n\n");
}

export function buildScienceImageManifest(options: { stage?: ScienceImageTopic["stage"]; includeRevisionMaps?: boolean } = {}): ScienceImageManifestEntry[] {
  return SCIENCE_IMAGE_TAXONOMY
    .filter((item) => !options.stage || item.stage === options.stage)
    .flatMap((item) => {
      const slots: ScienceImageSlot[] = ["diagram_a", "diagram_b"];
      if (options.includeRevisionMaps !== false && item.revisionMap) slots.push("revision_map");
      return slots.map((diagramType) => ({
        assetId: `${item.id}--${diagramType}`,
        taxonomyId: item.id,
        title: `${item.stage} ${item.discipline} — ${item.subtopic} — ${diagramType === "diagram_a" ? "Diagram A" : diagramType === "diagram_b" ? "Diagram B" : "Revision Map"}`,
        stage: item.stage,
        yearGroups: item.yearGroups,
        discipline: item.discipline,
        topic: item.topic,
        subtopic: item.subtopic,
        canonicalTopicKey: canonicalTopicKey(item.topic),
        canonicalSubtopicKey: canonicalTopicKey(item.subtopic),
        aliases: item.aliases,
        learningFocus: item.learningFocus,
        visualProfile: item.visualProfile,
        specificationRefs: item.specificationRefs,
        requiredPractical: Boolean(item.requiredPractical),
        diagramType,
        generatorModel: SCIENCE_IMAGE_GENERATOR_MODEL,
        promptVersion: SCIENCE_IMAGE_PROMPT_VERSION,
        prompt: buildScienceImagePrompt(item, diagramType),
        altText: `${item.stage} ${item.discipline} diagram: ${item.subtopic}. ${item.learningFocus}`,
        reviewChecklist: expectedReviewChecklist(item, diagramType),
      }));
    });
}

export function validateScienceImageManifest(manifest: ScienceImageManifestEntry[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const entry of manifest) {
    if (seen.has(entry.assetId)) problems.push(`Duplicate asset ID: ${entry.assetId}`);
    seen.add(entry.assetId);
    if (entry.generatorModel !== SCIENCE_IMAGE_GENERATOR_MODEL) problems.push(`${entry.assetId}: non-GPT Image 2 generator is prohibited.`);
    if (!entry.topic || !entry.subtopic || !entry.canonicalTopicKey || !entry.canonicalSubtopicKey) problems.push(`${entry.assetId}: incomplete topic identity.`);
    if (!entry.prompt.includes(entry.subtopic) || !entry.prompt.includes(entry.learningFocus)) problems.push(`${entry.assetId}: prompt omits the taxonomy learning focus.`);
    if (entry.diagramType === "revision_map" && entry.stage !== "GCSE") problems.push(`${entry.assetId}: revision maps are GCSE-only in this initial library.`);
    if (entry.requiredPractical && !entry.prompt.toLowerCase().includes("required-practical")) problems.push(`${entry.assetId}: practical prompt guard missing.`);
  }
  return problems;
}
