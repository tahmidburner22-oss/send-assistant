/**
 * GCSE Geography — diagram catalogue (Year 10–11).
 *
 * Anchored to AQA, Pearson Edexcel A/B and OCR A/B GCSE Geography
 * specifications. Heavy-priority families flagged in the brief: glacial
 * landforms, coastal landforms set, river long profile + cross profile,
 * plate boundaries (4 types), tropical-storm cross-section, climate
 * graphs for case-study locations, choropleth / proportional-symbol map
 * templates.
 *
 * Target: ~140 entries.
 */
import { emitTitled } from "../../_helpers.mjs";

const COMMON = { subject: "Geography", year_band: "GCSE" };
const STYLE_GEO =
  "Naturalistic palette, contour-style cross-sections, label leaders to the right, exam-paper feel";
const TAGS = ["GCSE", "geography"];

export function build(ctx) {
  // ── Tectonics ────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Tectonic hazards",
    year_group: "Year 10",
    description: "Tectonic-process diagram for GCSE.",
    style_notes: STYLE_GEO + ", continental and oceanic crust shaded differently",
    tags: [...TAGS, "tectonics", "earthquakes", "volcanoes"],
  }, [
    "Earth's structure — labelled cross-section (crust, mantle, outer/inner core)",
    "Tectonic plates world map — major plates and movement arrows",
    "Constructive plate boundary — diverging with sea-floor spreading",
    "Destructive plate boundary — oceanic / continental subduction",
    "Collision plate boundary — Himalayas formation",
    "Conservative plate boundary — San Andreas fault",
    "Volcano cross-section — composite (stratovolcano)",
    "Volcano cross-section — shield",
    "Volcano features — caldera, vent, lava flow, ash cloud",
    "Earthquake — focus and epicentre labelled",
    "Tsunami formation — sea-bed displacement to wave run-up",
    "Hot spot volcano — Hawaii example",
    "Primary vs secondary effects of tectonic hazards table",
    "Immediate vs long-term responses table",
    "Case study — Nepal earthquake 2015 fact card",
    "Case study — L'Aquila earthquake 2009 fact card",
    "Case study — Tōhoku earthquake / tsunami 2011 fact card",
    "Hazard management — prediction / protection / planning",
  ]);

  // ── Weather hazards and climate change ──────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Weather hazards and climate change",
    year_group: "Year 10",
    description: "Weather-hazard diagram for GCSE.",
    style_notes: STYLE_GEO,
    tags: [...TAGS, "weather", "climate-change"],
  }, [
    "Tropical storm cross-section — eye, eyewall, rainbands, outflow",
    "Tropical storm formation — five-step diagram",
    "Tropical storm tracks — global distribution map",
    "Saffir-Simpson hurricane scale card",
    "Frontal rainfall — warm and cold front diagram",
    "Convectional rainfall — rising heated air",
    "Relief rainfall — air rising over mountains",
    "Synoptic chart — high vs low pressure",
    "UK weather hazards — flood / storm / heatwave / cold snap card",
    "Case study — Typhoon Haiyan 2013 fact card",
    "Case study — UK Beast from the East 2018 fact card",
    "Greenhouse effect — sunlight in / IR trapped",
    "Climate change — global temperature anomaly graph",
    "Climate change — ice-core CO₂ proxy graph",
    "Effects of climate change — rising sea levels diagram",
    "Effects of climate change — shifting biomes map",
    "Climate change — mitigation vs adaptation card",
  ]);

  // ── Ecosystems and biomes ───────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Ecosystems",
    year_group: "Year 10",
    description: "Ecosystem / biome diagram for GCSE.",
    style_notes: STYLE_GEO,
    tags: [...TAGS, "ecosystems", "biomes"],
  }, [
    "World biomes map — Tropical rainforest, hot desert, etc.",
    "Tropical rainforest — labelled layers",
    "Tropical rainforest — climate graph (Manaus / Amazon)",
    "Tropical rainforest — nutrient cycle Gersmehl",
    "Hot desert — climate graph (Sahara)",
    "Hot desert — adaptations of plants and animals",
    "Cold environment (polar / tundra) — labelled features",
    "Cold environment — climate graph",
    "UK ecosystem — small-scale freshwater pond example",
    "Food web — UK pond ecosystem",
    "Energy pyramid — biomass example",
  ]);

  // ── Rivers ──────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Rivers (UK landscapes)",
    year_group: "Year 11",
    description: "Fluvial-process diagram for GCSE.",
    style_notes: STYLE_GEO,
    tags: [...TAGS, "rivers", "fluvial"],
  }, [
    "Drainage basin — fully labelled (watershed, source, tributary, mouth)",
    "Long profile — source to mouth gradient with annotations",
    "Cross-profile — V-shaped valley (upper)",
    "Cross-profile — wide flat (lower)",
    "Erosion processes summary — abrasion / attrition / hydraulic action / solution",
    "Transportation processes summary — traction / saltation / suspension / solution",
    "Waterfall and gorge formation — four-stage diagram",
    "Meander cross-section — slip-off slope vs river cliff",
    "Oxbow lake formation — three-stage",
    "Floodplain and levees — labelled cross-section",
    "Estuary and delta — comparison",
    "Hydrograph — labelled (peak, lag time, falling limb)",
    "Hydrograph — flashy vs subdued shape comparison",
    "Hard engineering — dams, channelisation, levees, flood walls",
    "Soft engineering — floodplain zoning, washlands, river restoration",
    "Case study — UK river flood event fact card",
    "OS map skill — recognising features of fluvial landscape",
  ]);

  // ── Coasts ───────────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Coasts (UK landscapes)",
    year_group: "Year 11",
    description: "Coastal-process diagram for GCSE.",
    style_notes: STYLE_GEO,
    tags: [...TAGS, "coasts", "coastal"],
  }, [
    "Wave types — constructive vs destructive comparison",
    "Discordant vs concordant coastline — bird's-eye view",
    "Cliff and wave-cut platform — labelled",
    "Headland and bay formation",
    "Cave / arch / stack / stump sequence",
    "Longshore drift — zigzag movement",
    "Beach and berm cross-section",
    "Spit formation — labelled with hooked end",
    "Bar and tombolo comparison",
    "Sand-dune cross-section — embryo to mature",
    "Salt marsh succession — pioneer to climax",
    "Hard engineering — sea wall, groyne, rock armour, gabion",
    "Soft engineering — beach nourishment, managed retreat, dune regeneration",
    "Case study — UK coast (e.g. Holderness) fact card",
    "Case study — coastal management scheme fact card",
    "OS map skill — recognising features of coastal landscape",
  ]);

  // ── Glaciation ──────────────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Glaciated upland (UK landscapes alt)",
    year_group: "Year 11",
    description: "Glacial-landform diagram for GCSE Geography.",
    style_notes: STYLE_GEO,
    tags: [...TAGS, "glaciation"],
  }, [
    "Glacial budget diagram — accumulation vs ablation",
    "Glacial erosion — plucking and abrasion",
    "Corrie (cirque) formation — three-stage diagram",
    "Arête formation — labelled ridge",
    "Pyramidal peak formation",
    "Glacial trough — U-shaped valley with truncated spurs",
    "Hanging valley with waterfall",
    "Ribbon lake formation",
    "Drumlin — egg-shape cross-section",
    "Erratic vs lateral / medial / terminal moraine",
    "Glacier features — bergschrund, crevasses, snout",
    "Case study — UK glaciated upland fact card",
    "Glacial vs fluvial valley comparison Venn",
  ]);

  // ── Urban issues and challenges ─────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Urban issues",
    year_group: "Year 10",
    description: "Urban-geography diagram for GCSE.",
    style_notes: STYLE_GEO + ", choropleth and proportional-symbol mapping",
    tags: [...TAGS, "urban", "urbanisation"],
  }, [
    "Burgess concentric model — five zones",
    "Hoyt sector model — wedge layout",
    "World population growth curve",
    "Urbanisation graph — % urban over time",
    "Megacity distribution map",
    "Push and pull migration factors table",
    "Case study — NEE city profile (Lagos / Mumbai / Rio) fact card",
    "Case study — UK city profile (London / Birmingham / Bristol) fact card",
    "Slum / favela / shanty cross-section",
    "Urban regeneration — before/after schematic",
    "Sustainable urban living — eco-suburb features",
    "Urban transport solutions — BRT / tram / cycle network",
    "Choropleth map template — population density by region",
    "Proportional-symbol map template — city populations",
    "Isoline map template — temperature / pollution",
    "Dot map template — point distribution",
  ]);

  // ── Changing economic world ────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Economic world / development",
    year_group: "Year 10",
    description: "Development-geography diagram for GCSE.",
    style_notes: STYLE_GEO,
    tags: [...TAGS, "development", "economic-world"],
  }, [
    "Brandt line — Global North / Global South",
    "HDI world map — choropleth",
    "GDP per capita vs HDI scatter",
    "Demographic transition model — five stages",
    "Population pyramid — youthful vs ageing",
    "Rostow's stages of growth",
    "Frank's dependency theory diagram",
    "Aid types — bilateral vs multilateral vs NGO",
    "Trade — primary / secondary / tertiary / quaternary jobs pyramid",
    "Globalisation — TNC supply chain map",
    "Fairtrade certification — supply-chain diagram",
    "Case study — NEE development (Nigeria / India) fact card",
    "Case study — UK economic change (post-industrial city) fact card",
  ]);

  // ── Resource management ────────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Resource management",
    year_group: "Year 11",
    description: "Resources / sustainability diagram for GCSE.",
    style_notes: STYLE_GEO,
    tags: [...TAGS, "resources"],
  }, [
    "Water security — water surplus vs deficit world map",
    "Water transfer scheme — UK / China South-North diagram",
    "Dam and reservoir — labelled cross-section",
    "Desalination plant — schematic",
    "Greywater recycling — household diagram",
    "Food security — food miles map",
    "Food security — agribusiness vs sustainable farming comparison",
    "Energy security — UK energy mix pie chart over time",
    "Fracking — shale gas extraction diagram",
    "Renewable energy mix — UK case study",
    "Carbon footprint — ladder of activities",
  ]);

  // ── Fieldwork and skills ───────────────────────────────────────────────
  emitTitled(ctx, {
    ...COMMON,
    topic: "Fieldwork and skills",
    year_group: "Year 11",
    description: "Fieldwork or geographical-skills diagram.",
    style_notes: "Toolkit-style icons, methodology flowchart",
    tags: [...TAGS, "fieldwork", "skills"],
  }, [
    "Fieldwork enquiry — six-step process",
    "Sampling methods — random / systematic / stratified",
    "Pedestrian count tally template",
    "Bipolar survey template",
    "Environmental quality survey",
    "Beach profile measurement diagram",
    "River cross-section measurement diagram",
    "Velocity measurement — float method / flowmeter",
    "Likert-scale questionnaire template",
    "Statistical test — Spearman's rank quick card",
    "Drawing a line graph — exam rules",
    "Drawing a divided bar chart — exam rules",
    "Drawing a scattergraph with line of best fit",
  ]);
}
