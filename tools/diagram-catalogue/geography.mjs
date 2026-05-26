/**
 * Geography — primary diagram catalogue (Y1–Y6).
 * Target: ~150 entries.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // OS map symbols (KS2) — 25
  const OS_SYMBOLS = [
    "church with tower", "church with spire", "school", "post office", "public house",
    "lighthouse", "campsite", "picnic site", "youth hostel", "viewpoint",
    "parking", "information centre", "railway station", "bus station", "windmill",
    "footpath", "cycle path", "bridleway", "motorway", "A-road",
    "river", "canal", "lake", "wood (deciduous)", "wood (coniferous)",
  ];
  for (const s of OS_SYMBOLS) {
    ctx.add({
      title: `OS map symbol — ${s}`,
      subject: "Geography",
      topic: "Maps and symbols",
      year_group: "Year 4",
      description: `Ordnance-Survey-style icon for "${s}" with name tag.`,
      style_notes: "OS purple/blue/green palette, simplified silhouette",
      tags: ["map", "OS-symbol", "KS2"],
    });
  }

  // Compass roses & direction — 6
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Compass and direction",
    year_group: "Year 3",
    description: "Compass rose with cardinal and intercardinal points labelled.",
    style_notes: "Star compass, gold outline, points colour-coded",
    tags: ["compass", "direction"],
  }, [
    "Compass rose — 4 point",
    "Compass rose — 8 point",
    "Compass rose — 16 point",
    "Compass directions on a grid",
    "Bearings dial 0–360°",
    "Treasure map with compass legend",
  ]);

  // UK and constituent countries — 14
  emitTitled(ctx, {
    subject: "Geography",
    topic: "UK geography",
    year_group: "Year 3",
    description: "Outline map of the UK or a constituent country with key features.",
    style_notes: "Pastel fills per country, capital starred",
    tags: ["UK", "country", "map"],
  }, [
    "UK map — countries colour-coded",
    "UK map — capitals starred",
    "England map — counties (simplified)",
    "Scotland map with Highlands/Lowlands",
    "Wales map with regions",
    "Northern Ireland map",
    "UK seas — North Sea / English Channel / Irish Sea / Atlantic",
    "Highest mountains — Ben Nevis / Snowdon / Scafell Pike / Slieve Donard",
    "Longest rivers — Severn / Thames / Trent / Wye",
    "British Isles vs UK vs Great Britain (Venn)",
    "London labelled (Thames, landmarks)",
    "Edinburgh labelled",
    "Cardiff labelled",
    "Belfast labelled",
  ]);

  // Continents and oceans — 12
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Continents and oceans",
    year_group: "Year 2",
    description: "World map or globe showing continents and oceans, named.",
    style_notes: "Each continent a different pastel fill, oceans labelled in blue italics",
    tags: ["continent", "ocean", "world-map", "KS1"],
  }, [
    "World map — 7 continents named",
    "World map — 5 oceans named",
    "Globe view — Atlantic side",
    "Globe view — Pacific side",
    "Equator and tropics labelled",
    "North/South Pole labelled",
    "Africa — outline with Sahara/Nile",
    "Asia — outline with Himalayas",
    "Europe — outline with Alps",
    "North America — outline with Rockies",
    "South America — outline with Amazon/Andes",
    "Australia/Oceania — outline with Great Barrier Reef",
  ]);

  // Rivers and water — 12
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Rivers",
    year_group: "Year 4",
    description: "River-related diagram showing landform features.",
    style_notes: "Cross-section + plan view where useful",
    tags: ["rivers", "water-features"],
  }, [
    "River features — source / tributary / meander / confluence / mouth",
    "River cross-section — V-shaped valley",
    "Waterfall formation — 4 stages",
    "Meander formation",
    "Oxbow lake formation",
    "River drainage basin",
    "Famous rivers — Nile labelled",
    "Famous rivers — Amazon labelled",
    "Famous rivers — Thames labelled",
    "Water cycle — evaporation/condensation/precipitation/collection",
    "Flooding — causes and effects",
    "Reservoir / dam diagram",
  ]);

  // Coast — 6
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Coasts",
    year_group: "Year 5",
    description: "Coastal landform diagram.",
    style_notes: "Cross-section, label call-outs",
    tags: ["coast", "erosion"],
  }, [
    "Coastal landforms — cliff / wave-cut platform",
    "Coastal landforms — arch / stack / stump",
    "Coastal erosion processes — hydraulic action / abrasion",
    "Beach formation — deposition",
    "Spit and tombolo",
    "Sea defences — groynes / sea wall / rip-rap",
  ]);

  // Mountains and tectonics — 10
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Mountains",
    year_group: "Year 5",
    description: "Mountain or tectonic feature diagram.",
    style_notes: "Cross-section view, colour gradient for altitude",
    tags: ["mountains", "tectonics"],
  }, [
    "Mountain features — peak / ridge / valley / scree",
    "Volcano cross-section — magma chamber / vent / crater",
    "Types of volcano — shield / composite / cinder cone",
    "Earthquake — focus and epicentre",
    "Plate boundaries — convergent / divergent / transform",
    "Ring of Fire map",
    "Famous mountains — Mount Everest",
    "Famous mountains — Mount Kilimanjaro",
    "Mountain weather changes with altitude",
    "Mountain climate zones (vertical bands)",
  ]);

  // Climate zones & biomes — 10
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Climate zones",
    year_group: "Year 5",
    description: "Climate zone or biome card showing typical features and example places.",
    style_notes: "Banded world-map background, biome inset photo style",
    tags: ["climate", "biome"],
  }, [
    "Climate zones map — tropical/arid/temperate/polar",
    "Biome — tropical rainforest",
    "Biome — savannah",
    "Biome — desert",
    "Biome — mediterranean",
    "Biome — temperate forest",
    "Biome — tundra",
    "Biome — taiga (boreal forest)",
    "Climate graph — example UK city",
    "Climate graph — example tropical city",
  ]);

  // Settlements and land use — 8
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Settlements",
    year_group: "Year 4",
    description: "Settlement / land-use card for KS2.",
    style_notes: "Aerial view, pastel fills, key in legend",
    tags: ["settlements", "land-use"],
  }, [
    "Settlement types — hamlet / village / town / city",
    "Land use — residential / commercial / industrial / green",
    "Aerial view of a typical UK village",
    "Aerial view of a typical UK city",
    "Map of a fictional town with labelled zones",
    "Hierarchy pyramid — settlements",
    "Site & situation factors poster",
    "Migration push/pull factor diagram",
  ]);

  // Weather instruments & data — 8
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Weather (primary)",
    year_group: "Year 4",
    description: "Weather instrument or weather chart card.",
    style_notes: "Each instrument labelled, scale visible",
    tags: ["weather", "instruments"],
  }, [
    "Weather instrument — thermometer",
    "Weather instrument — rain gauge",
    "Weather instrument — anemometer",
    "Weather instrument — wind vane",
    "Weather instrument — barometer",
    "Weather forecast symbols sheet",
    "Synoptic chart with isobars (simplified)",
    "Beaufort wind scale 0–12",
  ]);

  // Map skills — grid refs, scale, key — 8
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Map skills",
    year_group: "Year 5",
    description: "Map-skill anchor diagram.",
    style_notes: "Sample map fragment + skill explanation",
    tags: ["map-skills", "grid-references"],
  }, [
    "4-figure grid reference — explained",
    "6-figure grid reference — explained",
    "Map scale 1:25 000 vs 1:50 000",
    "Map key / legend example",
    "Contour lines explained",
    "Spot heights and triangulation pillars",
    "Plan view vs side view",
    "Title / north arrow / scale / key — map essentials",
  ]);

  // Globes & projections — 5
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Globe and world",
    year_group: "Year 5",
    description: "Globe / projection diagram.",
    style_notes: "Latitude/longitude lines drawn through",
    tags: ["globe", "projection"],
  }, [
    "Lines of latitude and longitude",
    "Hemispheres — Northern/Southern/Eastern/Western",
    "Time zones — strip world map",
    "Mercator projection vs Robinson",
    "Equator/Tropics/Arctic & Antarctic Circles labelled",
  ]);

  // Local fieldwork (Y6) — 6
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Fieldwork",
    year_group: "Year 6",
    description: "Fieldwork data-collection sheet visual.",
    style_notes: "Clipboard motif, table with example data",
    tags: ["fieldwork", "data"],
  }, [
    "Traffic count tally sheet",
    "Pedestrian survey clipboard",
    "Environmental quality survey",
    "Land use transect map",
    "Sketch field map example",
    "Photo annotation example",
  ]);

  // Sustainability / environment (Y6) — 8
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Sustainability",
    year_group: "Year 6",
    description: "Sustainability / environment-themed diagram.",
    style_notes: "Green palette, hand-drawn feel, clear icons",
    tags: ["sustainability", "environment"],
  }, [
    "Carbon cycle — primary level",
    "Greenhouse effect — sun rays diagram",
    "Recycling triangle and bins",
    "Renewable vs non-renewable energy chart",
    "Plastic in the ocean — issue/solution",
    "Deforestation cause + effect chain",
    "Reduce / reuse / recycle / refuse / rot",
    "Litter pick survey sheet",
  ]);
}
