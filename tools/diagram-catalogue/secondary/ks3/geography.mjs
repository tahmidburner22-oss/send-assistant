/**
 * KS3 Geography — diagram catalogue (Year 7–9).
 *
 * Anchored to the DfE KS3 Geography Programme of Study.
 * Target: ~70 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Geography", year_band: "KS3" };
const STYLE_GEO =
  "Naturalistic palette, contour-style cross-sections, label leaders to the right";
const TAGS_KS3 = ["KS3", "geography", "national-curriculum"];

export function build(ctx) {
  emitTitled(ctx, {
    ...COMMON,
    topic: "Map skills",
    year_group: "Year 7",
    description: "OS / cartography skills diagram for KS3.",
    style_notes: STYLE_GEO,
    tags: [...TAGS_KS3, "map-skills", "OS"],
  }, [
    "Four-figure grid reference — worked example on OS extract",
    "Six-figure grid reference — worked example",
    "Scale conversion — 1:25 000 vs 1:50 000",
    "Compass bearings 0–360° — three-figure example",
    "Contour lines — gentle vs steep slope",
    "Contour patterns — hill, valley, ridge, spur",
    "Cross-section drawing from contours",
    "Latitude and longitude grid",
    "Time zones around the world",
    "Atlas index page — how to find a place",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Tectonic processes",
    year_group: "Year 8",
    description: "Plate-tectonics diagram for KS3.",
    style_notes: STYLE_GEO + ", continental and oceanic crust shaded differently",
    tags: [...TAGS_KS3, "tectonics", "earthquakes", "volcanoes"],
  }, [
    "Earth's structure — labelled cross-section",
    "Tectonic plates world map — major plates named",
    "Constructive plate boundary — diverging with sea-floor spreading",
    "Destructive plate boundary — oceanic / continental subduction",
    "Collision plate boundary — Himalayas formation",
    "Conservative plate boundary — San Andreas fault",
    "Volcano cross-section — composite (stratovolcano)",
    "Volcano cross-section — shield",
    "Volcano features — caldera, vent, lava flow, ash cloud",
    "Earthquake — focus and epicentre labelled",
    "Tsunami formation — sea-bed displacement to wave run-up",
    "Tectonic hazards — primary vs secondary effects table",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Rivers",
    year_group: "Year 8",
    description: "River-process diagram for KS3.",
    style_notes: STYLE_GEO,
    tags: [...TAGS_KS3, "rivers", "fluvial"],
  }, [
    "Drainage basin — labelled (watershed, source, tributaries, mouth)",
    "Long profile — source to mouth gradient",
    "Cross-profile — V-shaped valley (upper course)",
    "Cross-profile — wide flat (lower course)",
    "Erosion processes — abrasion, attrition, hydraulic action, solution",
    "Transportation processes — traction, saltation, suspension, solution",
    "Waterfall formation — four-stage diagram",
    "Meander formation — slip-off slope and river cliff",
    "Oxbow lake formation — three-stage diagram",
    "Floodplain and levees — labelled cross-section",
    "Estuary and delta — comparison",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Coasts",
    year_group: "Year 9",
    description: "Coastal-process diagram for KS3.",
    style_notes: STYLE_GEO,
    tags: [...TAGS_KS3, "coasts", "erosion-deposition"],
  }, [
    "Wave types — constructive vs destructive",
    "Coastal erosion — headland and bay formation",
    "Coastal landforms — cave / arch / stack / stump sequence",
    "Coastal landforms — wave-cut platform",
    "Longshore drift — zigzag movement of sediment",
    "Coastal deposition — spit and bar",
    "Coastal deposition — tombolo",
    "Sea defences — hard vs soft engineering chart",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Weather and climate",
    year_group: "Year 9",
    description: "Weather / climate diagram for KS3.",
    style_notes: STYLE_GEO,
    tags: [...TAGS_KS3, "weather", "climate"],
  }, [
    "Water cycle — labelled processes",
    "Synoptic chart — high pressure vs low pressure",
    "Frontal rainfall — warm and cold front diagram",
    "Convectional rainfall — heating and rising air",
    "Relief rainfall — air rising over mountains",
    "Climate graph — UK example (London)",
    "Climate graph — equatorial example (Singapore)",
    "Global atmospheric circulation — Hadley / Ferrel / polar cells",
    "Tricellular model — labelled with pressure belts",
    "Ocean currents — gyres world map",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Population and development",
    year_group: "Year 9",
    description: "Population / development diagram for KS3.",
    style_notes: "Coloured choropleth map keys, stylised silhouettes",
    tags: [...TAGS_KS3, "population", "development"],
  }, [
    "Population pyramid — youthful (Nigeria-style)",
    "Population pyramid — ageing (Japan-style)",
    "Demographic transition model — five stages",
    "Push and pull migration factors — table",
    "World population growth curve — 1750–2100",
    "Choropleth map template — HDI by country",
    "Brandt line — Global North / Global South",
    "GDP vs HDI scatter — country examples",
  ]);

  emitTitled(ctx, {
    ...COMMON,
    topic: "Ecosystems and biomes",
    year_group: "Year 8",
    description: "Biome / ecosystem cross-section for KS3.",
    style_notes: STYLE_GEO,
    tags: [...TAGS_KS3, "biomes", "ecosystems"],
  }, [
    "World biomes map — coloured by type",
    "Tropical rainforest — labelled layers (emergent, canopy, understorey, floor)",
    "Hot desert — vegetation and adaptations",
    "Tundra biome — labelled features",
    "Temperate deciduous woodland — seasonal panels",
    "Coral reef cross-section — labelled zones",
    "Nutrient cycle — Gersmehl diagram for rainforest",
  ]);
}
