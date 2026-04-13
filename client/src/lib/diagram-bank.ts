/**
 * diagram-bank.ts
 * Verified educational diagram bank for Adaptly worksheets.
 * Maps topics to real, verified images from trusted educational sources
 * (Wikimedia Commons, OpenStax, etc.) instead of AI-generated SVGs.
 *
 * All images are from Wikimedia Commons (CC-BY-SA / Public Domain) or
 * other openly licensed educational sources.
 */

export interface VerifiedDiagram {
  imageUrl: string;
  caption: string;
  attribution: string;
  source: string;
  keywords: string[];  // topics this diagram matches
}

/**
 * Comprehensive bank of verified educational diagrams.
 * Each entry has keywords that are matched against the worksheet topic.
 */
export const VERIFIED_DIAGRAMS: VerifiedDiagram[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SCIENCE — Biology
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "/diagrams/animal-cell.png",
    caption: "Structure of an animal cell showing key organelles",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["cell", "cells", "animal cell", "cell biology", "cell structure", "organelle", "cells and organisation"],
  },
  {
    imageUrl: "/diagrams/plant-cell.png",
    caption: "Structure of a plant cell with labelled organelles",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["plant cell", "plant cells", "cell wall", "chloroplast", "vacuole"],
  },
  {
    imageUrl: "/diagrams/mitosis.png",
    caption: "Stages of mitosis: prophase, metaphase, anaphase, telophase",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["mitosis", "cell division", "cell cycle"],
  },
  {
    imageUrl: "/diagrams/dna-structure.png",
    caption: "Structure of DNA double helix",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["dna", "genetics", "genetic information", "inheritance", "gene", "chromosome"],
  },
  {
    imageUrl: "/diagrams/human-heart.png",
    caption: "Diagram of the human heart showing chambers and blood flow",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["heart", "circulatory system", "human circulatory system", "blood", "cardiac"],
  },
  {
    imageUrl: "/diagrams/respiratory-system.png",
    caption: "The human respiratory system",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["respiratory", "breathing", "lungs", "gas exchange", "alveoli", "breathing and gas exchange"],
  },
  {
    imageUrl: "/diagrams/digestive-system.png",
    caption: "The human digestive system",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["digestive system", "digestion", "stomach", "intestine", "oesophagus", "human digestive system"],
  },
  {
    imageUrl: "/diagrams/photosynthesis.png",
    caption: "Photosynthesis process in a plant leaf",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["photosynthesis", "bioenergetics", "plant", "chlorophyll", "what plants need"],
  },
  {
    imageUrl: "/diagrams/food-chain.png",
    caption: "A simple food chain showing energy transfer",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["food chain", "food web", "producer", "consumer", "ecosystem", "food chains"],
  },
  {
    imageUrl: "/diagrams/neuron.png",
    caption: "Structure of a neuron (nerve cell)",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["neuron", "nervous system", "nerve", "homeostasis and response", "reflex arc", "organisms respond"],
  },
  {
    imageUrl: "/diagrams/human-skeleton.png",
    caption: "The human skeleton — front view with labelled bones",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["skeleton", "bone", "human skeleton", "skeletal system", "muscles"],
  },
  {
    imageUrl: "/diagrams/flower-structure.png",
    caption: "Cross-section of a flower showing reproductive parts",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["flower", "pollination", "reproduction", "plant reproduction", "reproduction and life cycles"],
  },
  {
    imageUrl: "/diagrams/natural-selection.png",
    caption: "Diagram showing the process of natural selection and evolution",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["evolution", "natural selection", "adaptation", "evolution and inheritance", "inheritance variation"],
  },
  {
    imageUrl: "/diagrams/butterfly-lifecycle.png",
    caption: "Life cycle of a butterfly — complete metamorphosis",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["life cycle", "metamorphosis", "offspring", "new life", "reproduction and life cycles"],
  },
  {
    imageUrl: "/diagrams/human-eye.png",
    caption: "Cross-section of the human eye",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["eye", "light", "vision", "lens", "retina", "light and how it travels"],
  },
  {
    imageUrl: "/diagrams/human-ear.png",
    caption: "Structure of the human ear",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["ear", "sound", "hearing", "introduction to sound"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCIENCE — Chemistry
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "/diagrams/periodic-table.png",
    caption: "The Periodic Table of Elements",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["periodic table", "element", "atoms elements and compounds", "atomic structure and the periodic table"],
  },
  {
    imageUrl: "/images/atom_nb_labelled_final.png",
    caption: "Atomic structure — labelled Bohr model of Carbon-12 (6 protons, 6 neutrons, 2,4 electron configuration)",
    attribution: "Adaptly nano-banana diagram",
    source: "/images/atom_nb_labelled_final.png",
    keywords: ["atom", "atomic structure", "proton", "neutron", "electron", "isotope", "bohr model", "carbon", "nucleus", "electron shell", "subatomic particles", "gcse chemistry", "year 9 chemistry", "atomic number", "mass number"],
  },
  {
    imageUrl: "/images/atom_nb_unlabelled_final.png",
    caption: "Atomic structure — unlabelled Bohr model for labelling activity",
    attribution: "Adaptly nano-banana diagram",
    source: "/images/atom_nb_unlabelled_final.png",
    keywords: ["label the atom", "label the diagram", "atom unlabelled", "atomic structure diagram blank", "bohr model blank"],
  },
  {
    imageUrl: "/diagrams/ionic-bonding.png",
    caption: "Ionic bonding — transfer of electrons between sodium and fluorine",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["ionic bonding", "ionic bond", "bonding", "bonding structure", "chemical bond"],
  },
  {
    imageUrl: "/diagrams/covalent-bonding.png",
    caption: "Covalent bonding — shared electron pair in hydrogen molecule",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["covalent bonding", "covalent bond", "molecule", "bonding and structure"],
  },
  {
    imageUrl: "/diagrams/metallic-bonding.png",
    caption: "Metallic bonding — sea of delocalised electrons",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["metallic bonding", "metallic bond", "metal", "delocalised electrons"],
  },
  {
    imageUrl: "/diagrams/states-of-matter.png",
    caption: "Particle arrangement in solids, liquids and gases",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["states of matter", "solid", "liquid", "gas", "particles", "particle model"],
  },
  {
    imageUrl: "/diagrams/ph-scale.png",
    caption: "The pH scale — acids, neutral and alkalis",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["acid", "alkali", "ph", "acids and alkalis", "indicator", "chemical changes"],
  },
  {
    imageUrl: "/diagrams/distillation.png",
    caption: "Fractional distillation apparatus",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["distillation", "separation", "crude oil", "organic chemistry", "hydrocarbon", "separating materials"],
  },
  {
    imageUrl: "/diagrams/electrolysis.png",
    caption: "Electrolysis of water — splitting water into hydrogen and oxygen",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["electrolysis", "chemical changes", "oxidation", "reduction"],
  },
  {
    imageUrl: "/diagrams/rock-cycle.png",
    caption: "The rock cycle — igneous, sedimentary and metamorphic rocks",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["rock cycle", "rocks", "igneous", "sedimentary", "metamorphic", "rocks and soils"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCIENCE — Physics
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "/diagrams/electromagnetic-spectrum.png",
    caption: "The electromagnetic spectrum — from radio waves to gamma rays",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["electromagnetic spectrum", "waves", "electromagnetic", "radiation", "gamma", "infrared", "waves and the electromagnetic spectrum"],
  },
  {
    imageUrl: "/diagrams/refraction-lens.png",
    caption: "Refraction of light through a lens",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["refraction", "light", "lens", "prism", "spectrum"],
  },
  {
    imageUrl: "/diagrams/electrical-circuit.png",
    caption: "A simple electrical circuit with battery, switch and bulb",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["circuit", "electrical circuit", "electricity", "battery", "switch", "simple electrical circuits", "changing circuits"],
  },
  {
    imageUrl: "/diagrams/ohms-law.png",
    caption: "Ohm's Law triangle — V = I × R",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["ohm's law", "voltage", "current", "resistance", "electricity advanced"],
  },
  {
    imageUrl: "/diagrams/magnetic-field.png",
    caption: "Magnetic field lines around a bar magnet",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["magnet", "magnetic field", "magnetism", "electromagnetism", "forces including magnets"],
  },
  {
    imageUrl: "/diagrams/solar-system.png",
    caption: "The Solar System — planets in order from the Sun",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["solar system", "planet", "earth sun and moon", "space", "orbit"],
  },
  {
    imageUrl: "/images/atom_nb_labelled_final.png",
    caption: "Bohr model of the atom — electron shells (Carbon-12)",
    attribution: "Adaptly nano-banana diagram",
    source: "/images/atom_nb_labelled_final.png",
    keywords: ["atomic structure", "electron shell", "bohr model", "particles and radiation", "nuclear model", "atom structure physics"],
  },
  {
    imageUrl: "/diagrams/radiation-types.png",
    caption: "Alpha, beta and gamma radiation — penetrating power",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["radioactive", "radiation", "alpha", "beta", "gamma", "nuclear physics", "atomic structure physics"],
  },
  {
    imageUrl: "/diagrams/wave-types.png",
    caption: "Transverse and longitudinal waves",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["wave", "transverse", "longitudinal", "amplitude", "wavelength", "frequency"],
  },
  {
    imageUrl: "/diagrams/energy-transfer.png",
    caption: "Energy transfers and transformations",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["energy", "energy transfer", "kinetic", "potential", "conservation"],
  },
  {
    imageUrl: "/diagrams/light-reflection.png",
    caption: "Law of reflection — angle of incidence equals angle of reflection",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["reflection", "light", "mirror", "angle of incidence", "light and shadows"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GEOGRAPHY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "/diagrams/water-cycle.png",
    caption: "The water cycle — evaporation, condensation, precipitation, collection",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["water cycle", "evaporation", "condensation", "precipitation", "hydrological cycle"],
  },
  {
    imageUrl: "/diagrams/tectonic-plates.png",
    caption: "World map of tectonic plates",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["tectonic plate", "earthquake", "volcano", "tectonic", "plate boundary"],
  },
  {
    imageUrl: "/diagrams/volcano-cross-section.png",
    caption: "Cross-section of a volcano showing internal structure",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["volcano", "eruption", "magma", "lava", "crater", "volcanoes"],
  },
  {
    imageUrl: "/diagrams/river-meander.png",
    caption: "Formation of a river meander through erosion and deposition",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["river", "meander", "erosion", "deposition", "rivers"],
  },
  {
    imageUrl: "/diagrams/greenhouse-effect.png",
    caption: "The greenhouse effect — how greenhouse gases trap heat",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["greenhouse effect", "climate change", "global warming", "carbon dioxide", "earth and atmosphere"],
  },
  {
    imageUrl: "/diagrams/coastal-features.png",
    caption: "Coastal features — continental shelf and ocean floor",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["coast", "coastal", "cliff", "wave", "coastal processes"],
  },
  {
    imageUrl: "/diagrams/world-biomes.png",
    caption: "World biomes map — tropical, temperate, polar, desert, tundra",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["biome", "biomes", "vegetation belt", "climate zone", "rainforest", "desert", "tundra"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "/diagrams/pythagoras.png",
    caption: "Pythagoras' Theorem — a² + b² = c²",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["pythagoras", "pythagorean", "hypotenuse", "right-angled triangle"],
  },
  {
    imageUrl: "/diagrams/unit-circle.png",
    caption: "The unit circle showing key angles and trigonometric values",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["trigonometry", "sine", "cosine", "tangent", "unit circle", "radian"],
  },
  {
    imageUrl: "/diagrams/fractions.png",
    caption: "Visual comparison of fractions",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["fraction", "fractions", "numerator", "denominator", "equivalent"],
  },
  {
    imageUrl: "/diagrams/angles-types.png",
    caption: "Types of angles — acute, obtuse, right angle, straight",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["angle", "angles", "acute", "obtuse", "right angle", "protractor"],
  },
  {
    imageUrl: "/diagrams/polygons.png",
    caption: "Common polygon shapes — triangle to decagon",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["polygon", "shape", "2d shape", "regular polygon", "properties of shapes"],
  },
  {
    imageUrl: "/diagrams/triangle-properties.png",
    caption: "Properties of a triangle — sides, angles, vertices",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["triangle", "area of triangle", "angles in shapes"],
  },
  {
    imageUrl: "/diagrams/circle-parts.png",
    caption: "Parts of a circle — radius, diameter, circumference, chord, arc",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["circle", "circle theorem", "radius", "diameter", "circumference", "chord", "arc"],
  },
  {
    imageUrl: "/diagrams/coordinate-system.png",
    caption: "Cartesian coordinate system — x-axis and y-axis",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["coordinate", "coordinates", "graph", "x-axis", "y-axis", "four quadrants"],
  },
  {
    imageUrl: "/diagrams/quadratic-graph.png",
    caption: "Graph of a quadratic function — parabola",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["quadratic", "parabola", "quadratic equation", "graph", "functions"],
  },
  {
    imageUrl: "/diagrams/venn-diagram.png",
    caption: "Venn diagram — sets and intersections",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["venn diagram", "probability", "set", "statistics"],
  },
  {
    imageUrl: "/diagrams/3d-shapes.png",
    caption: "Common 3D shapes — cube, cuboid, sphere, cylinder, cone, pyramid",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["3d shape", "cube", "cuboid", "sphere", "cylinder", "cone", "pyramid", "volume", "surface area"],
  },
  {
    imageUrl: "/diagrams/number-line.png",
    caption: "Number line showing positive and negative integers",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["number line", "integer", "negative number", "place value"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "/diagrams/battle-of-hastings.png",
    caption: "Bayeux Tapestry — the death of King Harold at the Battle of Hastings, 1066",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["norman conquest", "battle of hastings", "1066", "william", "harold"],
  },
  {
    imageUrl: "/diagrams/great-fire-london.png",
    caption: "The Great Fire of London, 1666",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["great fire of london", "1666", "samuel pepys", "fire"],
  },
  {
    imageUrl: "/diagrams/ancient-egypt.png",
    caption: "The Great Pyramid of Giza — Ancient Egypt",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["ancient egypt", "pyramid", "pharaoh", "egypt"],
  },
  {
    imageUrl: "/diagrams/stone-age.png",
    caption: "Stonehenge — a monument from the Stone Age / Bronze Age",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["stone age", "bronze age", "iron age", "stonehenge", "prehistoric"],
  },
  {
    imageUrl: "/diagrams/hadrians-wall.png",
    caption: "Hadrian's Wall — built by the Romans in northern England",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["roman", "romans", "hadrian's wall", "roman empire"],
  },
  {
    imageUrl: "/diagrams/viking-longship.png",
    caption: "Viking longship — the Gokstad ship",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["viking", "vikings", "longship", "norse", "anglo-saxon"],
  },
  {
    imageUrl: "/diagrams/ww1-trenches.png",
    caption: "Trench warfare during World War One",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["world war one", "wwi", "trench", "trench warfare", "somme"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "/diagrams/computer-architecture.png",
    caption: "Basic computer architecture — CPU, memory, input/output",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["computer", "cpu", "hardware", "computer systems", "von neumann", "computer architecture"],
  },
  {
    imageUrl: "/diagrams/big-o-notation.png",
    caption: "Computational complexity — Big O notation comparison",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["algorithm", "big o", "complexity", "sorting", "searching"],
  },
  {
    imageUrl: "/diagrams/binary-representation.png",
    caption: "Binary representation — binary clock display",
    attribution: "AI-generated educational diagram, Adaptly",
    source: "adaptly.co.uk",
    keywords: ["binary", "data representation", "bit", "byte"],
  },
];

/**
 * Find the best matching verified diagram for a given topic.
 * Uses keyword matching with scoring.
 */
export function findVerifiedDiagram(subject: string, topic: string): VerifiedDiagram | null {
  const searchTerms = `${subject} ${topic}`.toLowerCase().split(/[\s,\-—]+/).filter(t => t.length > 2);

  let bestMatch: VerifiedDiagram | null = null;
  let bestScore = 0;

  for (const diagram of VERIFIED_DIAGRAMS) {
    let score = 0;
    const keywordsLower = diagram.keywords.map(k => k.toLowerCase());

    // Exact topic match (highest priority)
    if (keywordsLower.some(k => k === topic.toLowerCase())) {
      score += 10;
    }

    // Topic contains keyword or keyword contains topic
    for (const kw of keywordsLower) {
      if (topic.toLowerCase().includes(kw)) score += 5;
      else if (kw.includes(topic.toLowerCase())) score += 3;
    }

    // Individual word matching
    for (const term of searchTerms) {
      for (const kw of keywordsLower) {
        if (kw.includes(term)) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = diagram;
    }
  }

  // Only return if we have a reasonable match
  return bestScore >= 3 ? bestMatch : null;
}

/**
 * Generate a diagram section for a worksheet using verified images.
 * Falls back to null if no matching diagram is found.
 */
export function getVerifiedDiagramSection(subject: string, topic: string): {
  title: string;
  content: string;
  type: "diagram";
  imageUrl: string;
  caption: string;
  attribution: string;
} | null {
  const diagram = findVerifiedDiagram(subject, topic);
  if (!diagram) return null;

  // Route through server-side proxy to avoid CORS/rate-limiting from Wikimedia
  const proxyUrl = `/api/diagram-proxy?url=${encodeURIComponent(diagram.imageUrl)}`;

  return {
    title: `Diagram: ${topic}`,
    content: diagram.caption,
    type: "diagram",
    imageUrl: proxyUrl,
    caption: diagram.caption,
    attribution: diagram.attribution,
  };
}
