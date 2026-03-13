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
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Animal_cell_structure_en.svg/800px-Animal_cell_structure_en.svg.png",
    caption: "Structure of an animal cell showing key organelles",
    attribution: "Wikimedia Commons, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Animal_cell_structure_en.svg",
    keywords: ["cell", "cells", "animal cell", "cell biology", "cell structure", "organelle", "cells and organisation"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Plant_cell_structure_svg_labels.svg/800px-Plant_cell_structure_svg_labels.svg.png",
    caption: "Structure of a plant cell with labelled organelles",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Plant_cell_structure_svg_labels.svg",
    keywords: ["plant cell", "plant cells", "cell wall", "chloroplast", "vacuole"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Mitosis_Stages.svg/800px-Mitosis_Stages.svg.png",
    caption: "Stages of mitosis: prophase, metaphase, anaphase, telophase",
    attribution: "Wikimedia Commons, Public Domain",
    source: "https://commons.wikimedia.org/wiki/File:Mitosis_Stages.svg",
    keywords: ["mitosis", "cell division", "cell cycle"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/800px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
    caption: "Structure of DNA double helix",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
    keywords: ["dna", "genetics", "genetic information", "inheritance", "gene", "chromosome"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Diagram_of_the_human_heart_%28cropped%29.svg/800px-Diagram_of_the_human_heart_%28cropped%29.svg.png",
    caption: "Diagram of the human heart showing chambers and blood flow",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Diagram_of_the_human_heart_(cropped).svg",
    keywords: ["heart", "circulatory system", "human circulatory system", "blood", "cardiac"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Respiratory_system_complete_en.svg/600px-Respiratory_system_complete_en.svg.png",
    caption: "The human respiratory system",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Respiratory_system_complete_en.svg",
    keywords: ["respiratory", "breathing", "lungs", "gas exchange", "alveoli", "breathing and gas exchange"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Digestive_system_diagram_en.svg/600px-Digestive_system_diagram_en.svg.png",
    caption: "The human digestive system",
    attribution: "Wikimedia Commons, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Digestive_system_diagram_en.svg",
    keywords: ["digestive system", "digestion", "stomach", "intestine", "oesophagus", "human digestive system"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Photosynthesis_en.svg/800px-Photosynthesis_en.svg.png",
    caption: "Photosynthesis process in a plant leaf",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Photosynthesis_en.svg",
    keywords: ["photosynthesis", "bioenergetics", "plant", "chlorophyll", "what plants need"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Simple_food_chain.svg/800px-Simple_food_chain.svg.png",
    caption: "A simple food chain showing energy transfer",
    attribution: "Wikimedia Commons, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Simple_food_chain.svg",
    keywords: ["food chain", "food web", "producer", "consumer", "ecosystem", "food chains"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Neuron_-_annotated.svg/800px-Neuron_-_annotated.svg.png",
    caption: "Structure of a neuron (nerve cell)",
    attribution: "Wikimedia Commons, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Neuron_-_annotated.svg",
    keywords: ["neuron", "nervous system", "nerve", "homeostasis and response", "reflex arc", "organisms respond"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Human_skeleton_front_en.svg/400px-Human_skeleton_front_en.svg.png",
    caption: "The human skeleton — front view with labelled bones",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Human_skeleton_front_en.svg",
    keywords: ["skeleton", "bone", "human skeleton", "skeletal system", "muscles"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Flower_diagram.svg/600px-Flower_diagram.svg.png",
    caption: "Cross-section of a flower showing reproductive parts",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Flower_diagram.svg",
    keywords: ["flower", "pollination", "reproduction", "plant reproduction", "reproduction and life cycles"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Evolution_pl.svg/800px-Evolution_pl.svg.png",
    caption: "Diagram showing the process of natural selection and evolution",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Evolution_pl.svg",
    keywords: ["evolution", "natural selection", "adaptation", "evolution and inheritance", "inheritance variation"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Butterfly_life_cycle.svg/800px-Butterfly_life_cycle.svg.png",
    caption: "Life cycle of a butterfly — complete metamorphosis",
    attribution: "Wikimedia Commons, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Butterfly_life_cycle.svg",
    keywords: ["life cycle", "metamorphosis", "offspring", "new life", "reproduction and life cycles"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Human_eye_diagram-sagittal_view-en.svg/800px-Human_eye_diagram-sagittal_view-en.svg.png",
    caption: "Cross-section of the human eye",
    attribution: "Wikimedia Commons, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Human_eye_diagram-sagittal_view-en.svg",
    keywords: ["eye", "light", "vision", "lens", "retina", "light and how it travels"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Ear-anatomy-text-small-en.svg/600px-Ear-anatomy-text-small-en.svg.png",
    caption: "Structure of the human ear",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Ear-anatomy-text-small-en.svg",
    keywords: ["ear", "sound", "hearing", "introduction to sound"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCIENCE — Chemistry
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Periodic_table_large.svg/1280px-Periodic_table_large.svg.png",
    caption: "The Periodic Table of Elements",
    attribution: "Wikimedia Commons, Public Domain",
    source: "https://commons.wikimedia.org/wiki/File:Periodic_table_large.svg",
    keywords: ["periodic table", "element", "atoms elements and compounds", "atomic structure and the periodic table"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Hydrogen_Deuterium_Tritium_Nuclei_Schematic-en.svg/800px-Hydrogen_Deuterium_Tritium_Nuclei_Schematic-en.svg.png",
    caption: "Atomic structure — protons, neutrons and electrons",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Hydrogen_Deuterium_Tritium_Nuclei_Schematic-en.svg",
    keywords: ["atom", "atomic structure", "proton", "neutron", "electron", "isotope"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/NaF.gif/800px-NaF.gif",
    caption: "Ionic bonding — transfer of electrons between sodium and fluorine",
    attribution: "Wikimedia Commons, Public Domain",
    source: "https://commons.wikimedia.org/wiki/File:NaF.gif",
    keywords: ["ionic bonding", "ionic bond", "bonding", "bonding structure", "chemical bond"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Covalent_bond_hydrogen.svg/800px-Covalent_bond_hydrogen.svg.png",
    caption: "Covalent bonding — shared electron pair in hydrogen molecule",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Covalent_bond_hydrogen.svg",
    keywords: ["covalent bonding", "covalent bond", "molecule", "bonding and structure"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Metallic_bonding.svg/800px-Metallic_bonding.svg.png",
    caption: "Metallic bonding — sea of delocalised electrons",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Metallic_bonding.svg",
    keywords: ["metallic bonding", "metallic bond", "metal", "delocalised electrons"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Solid_liquid_gas.svg/800px-Solid_liquid_gas.svg.png",
    caption: "Particle arrangement in solids, liquids and gases",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Solid_liquid_gas.svg",
    keywords: ["states of matter", "solid", "liquid", "gas", "particles", "particle model"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/PH_Scale.svg/800px-PH_Scale.svg.png",
    caption: "The pH scale — acids, neutral and alkalis",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:PH_Scale.svg",
    keywords: ["acid", "alkali", "ph", "acids and alkalis", "indicator", "chemical changes"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Fractional_distillation_lab_apparatus.svg/400px-Fractional_distillation_lab_apparatus.svg.png",
    caption: "Fractional distillation apparatus",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Fractional_distillation_lab_apparatus.svg",
    keywords: ["distillation", "separation", "crude oil", "organic chemistry", "hydrocarbon", "separating materials"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Electrolysis_of_Water.svg/800px-Electrolysis_of_Water.svg.png",
    caption: "Electrolysis of water — splitting water into hydrogen and oxygen",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Electrolysis_of_Water.svg",
    keywords: ["electrolysis", "chemical changes", "oxidation", "reduction"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Rock_cycle.svg/800px-Rock_cycle.svg.png",
    caption: "The rock cycle — igneous, sedimentary and metamorphic rocks",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Rock_cycle.svg",
    keywords: ["rock cycle", "rocks", "igneous", "sedimentary", "metamorphic", "rocks and soils"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCIENCE — Physics
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Electromagnetic_spectrum_-eng.svg/1280px-Electromagnetic_spectrum_-eng.svg.png",
    caption: "The electromagnetic spectrum — from radio waves to gamma rays",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Electromagnetic_spectrum_-eng.svg",
    keywords: ["electromagnetic spectrum", "waves", "electromagnetic", "radiation", "gamma", "infrared", "waves and the electromagnetic spectrum"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Refraction_-_Pair_of_Glasses.svg/800px-Refraction_-_Pair_of_Glasses.svg.png",
    caption: "Refraction of light through a lens",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Refraction_-_Pair_of_Glasses.svg",
    keywords: ["refraction", "light", "lens", "prism", "spectrum"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Simple_circuit.svg/800px-Simple_circuit.svg.png",
    caption: "A simple electrical circuit with battery, switch and bulb",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Simple_circuit.svg",
    keywords: ["circuit", "electrical circuit", "electricity", "battery", "switch", "simple electrical circuits", "changing circuits"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Ohm%27s_law_triangle.svg/600px-Ohm%27s_law_triangle.svg.png",
    caption: "Ohm's Law triangle — V = I × R",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Ohm%27s_law_triangle.svg",
    keywords: ["ohm's law", "voltage", "current", "resistance", "electricity advanced"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Magnet0873.png/800px-Magnet0873.png",
    caption: "Magnetic field lines around a bar magnet",
    attribution: "Wikimedia Commons, Public Domain",
    source: "https://commons.wikimedia.org/wiki/File:Magnet0873.png",
    keywords: ["magnet", "magnetic field", "magnetism", "electromagnetism", "forces including magnets"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Solar_sys8.jpg/1280px-Solar_sys8.jpg",
    caption: "The Solar System — planets in order from the Sun",
    attribution: "Wikimedia Commons, Public Domain (NASA)",
    source: "https://commons.wikimedia.org/wiki/File:Solar_sys8.jpg",
    keywords: ["solar system", "planet", "earth sun and moon", "space", "orbit"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Bohr_atom_model_English.svg/600px-Bohr_atom_model_English.svg.png",
    caption: "Bohr model of the atom — electron shells",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Bohr_atom_model_English.svg",
    keywords: ["atomic structure", "electron shell", "bohr model", "particles and radiation"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Alfa_beta_gamma_radiation.svg/800px-Alfa_beta_gamma_radiation.svg.png",
    caption: "Alpha, beta and gamma radiation — penetrating power",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Alfa_beta_gamma_radiation.svg",
    keywords: ["radioactive", "radiation", "alpha", "beta", "gamma", "nuclear physics", "atomic structure physics"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Transverse_and_longitudinal_wave.svg/800px-Transverse_and_longitudinal_wave.svg.png",
    caption: "Transverse and longitudinal waves",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Transverse_and_longitudinal_wave.svg",
    keywords: ["wave", "transverse", "longitudinal", "amplitude", "wavelength", "frequency"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Energy_Transformation.svg/800px-Energy_Transformation.svg.png",
    caption: "Energy transfers and transformations",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Energy_Transformation.svg",
    keywords: ["energy", "energy transfer", "kinetic", "potential", "conservation"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Reflection_angles.svg/800px-Reflection_angles.svg.png",
    caption: "Law of reflection — angle of incidence equals angle of reflection",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Reflection_angles.svg",
    keywords: ["reflection", "light", "mirror", "angle of incidence", "light and shadows"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GEOGRAPHY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Water_cycle.svg/1024px-Water_cycle.svg.png",
    caption: "The water cycle — evaporation, condensation, precipitation, collection",
    attribution: "Wikimedia Commons, Public Domain (USGS)",
    source: "https://commons.wikimedia.org/wiki/File:Water_cycle.svg",
    keywords: ["water cycle", "evaporation", "condensation", "precipitation", "hydrological cycle"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Plates_tect2_en.svg/1280px-Plates_tect2_en.svg.png",
    caption: "World map of tectonic plates",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Plates_tect2_en.svg",
    keywords: ["tectonic plate", "earthquake", "volcano", "tectonic", "plate boundary"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Volcano_scheme.svg/800px-Volcano_scheme.svg.png",
    caption: "Cross-section of a volcano showing internal structure",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Volcano_scheme.svg",
    keywords: ["volcano", "eruption", "magma", "lava", "crater", "volcanoes"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Meander_formation.svg/800px-Meander_formation.svg.png",
    caption: "Formation of a river meander through erosion and deposition",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Meander_formation.svg",
    keywords: ["river", "meander", "erosion", "deposition", "rivers"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Greenhouse_Effect.svg/800px-Greenhouse_Effect.svg.png",
    caption: "The greenhouse effect — how greenhouse gases trap heat",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Greenhouse_Effect.svg",
    keywords: ["greenhouse effect", "climate change", "global warming", "carbon dioxide", "earth and atmosphere"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Continental_shelf.svg/800px-Continental_shelf.svg.png",
    caption: "Coastal features — continental shelf and ocean floor",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Continental_shelf.svg",
    keywords: ["coast", "coastal", "cliff", "wave", "coastal processes"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Biomes_of_the_world.svg/1280px-Biomes_of_the_world.svg.png",
    caption: "World biomes map — tropical, temperate, polar, desert, tundra",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Biomes_of_the_world.svg",
    keywords: ["biome", "biomes", "vegetation belt", "climate zone", "rainforest", "desert", "tundra"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATHEMATICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Pythagorean.svg/800px-Pythagorean.svg.png",
    caption: "Pythagoras' Theorem — a² + b² = c²",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Pythagorean.svg",
    keywords: ["pythagoras", "pythagorean", "hypotenuse", "right-angled triangle"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Unit_circle_angles_color.svg/800px-Unit_circle_angles_color.svg.png",
    caption: "The unit circle showing key angles and trigonometric values",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Unit_circle_angles_color.svg",
    keywords: ["trigonometry", "sine", "cosine", "tangent", "unit circle", "radian"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Fraction_Comparison.svg/800px-Fraction_Comparison.svg.png",
    caption: "Visual comparison of fractions",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Fraction_Comparison.svg",
    keywords: ["fraction", "fractions", "numerator", "denominator", "equivalent"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Angle_acute%2C_obtuse%2C_straight.svg/800px-Angle_acute%2C_obtuse%2C_straight.svg.png",
    caption: "Types of angles — acute, obtuse, right angle, straight",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Angle_acute,_obtuse,_straight.svg",
    keywords: ["angle", "angles", "acute", "obtuse", "right angle", "protractor"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Polygon_types.svg/800px-Polygon_types.svg.png",
    caption: "Common polygon shapes — triangle to decagon",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Polygon_types.svg",
    keywords: ["polygon", "shape", "2d shape", "regular polygon", "properties of shapes"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Regular_polygon_3_annotated.svg/600px-Regular_polygon_3_annotated.svg.png",
    caption: "Properties of a triangle — sides, angles, vertices",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Regular_polygon_3_annotated.svg",
    keywords: ["triangle", "area of triangle", "angles in shapes"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Circle-withsegments.svg/600px-Circle-withsegments.svg.png",
    caption: "Parts of a circle — radius, diameter, circumference, chord, arc",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Circle-withsegments.svg",
    keywords: ["circle", "circle theorem", "radius", "diameter", "circumference", "chord", "arc"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Coord_system_CA_0.svg/800px-Coord_system_CA_0.svg.png",
    caption: "Cartesian coordinate system — x-axis and y-axis",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Coord_system_CA_0.svg",
    keywords: ["coordinate", "coordinates", "graph", "x-axis", "y-axis", "four quadrants"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Polynomialdeg2.svg/800px-Polynomialdeg2.svg.png",
    caption: "Graph of a quadratic function — parabola",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Polynomialdeg2.svg",
    keywords: ["quadratic", "parabola", "quadratic equation", "graph", "functions"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_Venn_diagram.svg/800px-Colored_Venn_diagram.svg.png",
    caption: "Venn diagram — sets and intersections",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Colored_Venn_diagram.svg",
    keywords: ["venn diagram", "probability", "set", "statistics"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/3D_shapes.svg/800px-3D_shapes.svg.png",
    caption: "Common 3D shapes — cube, cuboid, sphere, cylinder, cone, pyramid",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:3D_shapes.svg",
    keywords: ["3d shape", "cube", "cuboid", "sphere", "cylinder", "cone", "pyramid", "volume", "surface area"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Number-line.svg/1280px-Number-line.svg.png",
    caption: "Number line showing positive and negative integers",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Number-line.svg",
    keywords: ["number line", "integer", "negative number", "place value"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Bayeux_Tapestry_scene57_Harold_death.jpg/1280px-Bayeux_Tapestry_scene57_Harold_death.jpg",
    caption: "Bayeux Tapestry — the death of King Harold at the Battle of Hastings, 1066",
    attribution: "Wikimedia Commons, Public Domain",
    source: "https://commons.wikimedia.org/wiki/File:Bayeux_Tapestry_scene57_Harold_death.jpg",
    keywords: ["norman conquest", "battle of hastings", "1066", "william", "harold"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Great_Fire_London.jpg/1024px-Great_Fire_London.jpg",
    caption: "The Great Fire of London, 1666",
    attribution: "Wikimedia Commons, Public Domain",
    source: "https://commons.wikimedia.org/wiki/File:Great_Fire_London.jpg",
    keywords: ["great fire of london", "1666", "samuel pepys", "fire"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Gizeh_Cheops_BW_1.jpg/1280px-Gizeh_Cheops_BW_1.jpg",
    caption: "The Great Pyramid of Giza — Ancient Egypt",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Gizeh_Cheops_BW_1.jpg",
    keywords: ["ancient egypt", "pyramid", "pharaoh", "egypt"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Stonehenge_in_Wiltshire.jpg/1280px-Stonehenge_in_Wiltshire.jpg",
    caption: "Stonehenge — a monument from the Stone Age / Bronze Age",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Stonehenge_in_Wiltshire.jpg",
    keywords: ["stone age", "bronze age", "iron age", "stonehenge", "prehistoric"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Hadrian%27s_Wall_view_near_Greenhead.jpg/1280px-Hadrian%27s_Wall_view_near_Greenhead.jpg",
    caption: "Hadrian's Wall — built by the Romans in northern England",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Hadrian%27s_Wall_view_near_Greenhead.jpg",
    keywords: ["roman", "romans", "hadrian's wall", "roman empire"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Gokstad_viking_ship_-_IMG_8516.jpg/1280px-Gokstad_viking_ship_-_IMG_8516.jpg",
    caption: "Viking longship — the Gokstad ship",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Gokstad_viking_ship_-_IMG_8516.jpg",
    keywords: ["viking", "vikings", "longship", "norse", "anglo-saxon"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Trench_warfare.jpg/1280px-Trench_warfare.jpg",
    caption: "Trench warfare during World War One",
    attribution: "Wikimedia Commons, Public Domain",
    source: "https://commons.wikimedia.org/wiki/File:Trench_warfare.jpg",
    keywords: ["world war one", "wwi", "trench", "trench warfare", "somme"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/ABasicComputer.gif/800px-ABasicComputer.gif",
    caption: "Basic computer architecture — CPU, memory, input/output",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:ABasicComputer.gif",
    keywords: ["computer", "cpu", "hardware", "computer systems", "von neumann", "computer architecture"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Comparison_computational_complexity.svg/800px-Comparison_computational_complexity.svg.png",
    caption: "Computational complexity — Big O notation comparison",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Comparison_computational_complexity.svg",
    keywords: ["algorithm", "big o", "complexity", "sorting", "searching"],
  },
  {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Binary_clock_samui_moon.jpg/800px-Binary_clock_samui_moon.jpg",
    caption: "Binary representation — binary clock display",
    attribution: "Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Binary_clock_samui_moon.jpg",
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
