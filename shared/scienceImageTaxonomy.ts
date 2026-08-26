export type ScienceStage = "KS1" | "KS2" | "KS3" | "GCSE";
export type ScienceDiscipline = "primary-science" | "biology" | "chemistry" | "physics" | "working-scientifically" | "combined-science";
export type ScienceVisualProfile = "primary-playful" | "ks3-technical" | "gcse-exam";

export interface ScienceImageTopic {
  id: string;
  stage: ScienceStage;
  yearGroups: string[];
  discipline: ScienceDiscipline;
  topic: string;
  subtopic: string;
  aliases: string[];
  learningFocus: string;
  visualProfile: ScienceVisualProfile;
  specificationRefs: string[];
  requiredPractical?: boolean;
  diagramA: string;
  diagramB: string;
  revisionMap?: string;
  tags: string[];
}

type TopicSeed = Omit<ScienceImageTopic, "id" | "subtopic" | "aliases" | "learningFocus" | "diagramA" | "diagramB" | "revisionMap" | "tags"> & {
  subtopics: Array<{ name: string; aliases?: string[]; focus: string; practical?: boolean }>;
};

const slug = (value: string) => value
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

const makeTopic = (seed: TopicSeed): ScienceImageTopic[] => seed.subtopics.map((entry) => {
  const id = `${seed.stage.toLowerCase()}-${slug(seed.discipline)}-${slug(seed.topic)}-${slug(entry.name)}`;
  const isPrimary = seed.visualProfile === "primary-playful";
  const subtopic = entry.name;
  return {
    id,
    stage: seed.stage,
    yearGroups: seed.yearGroups,
    discipline: seed.discipline,
    topic: seed.topic,
    subtopic,
    aliases: [...new Set([seed.topic, subtopic, ...(entry.aliases || [])])],
    learningFocus: entry.focus,
    visualProfile: seed.visualProfile,
    specificationRefs: seed.specificationRefs,
    requiredPractical: entry.practical,
    diagramA: isPrimary
      ? `Friendly, low-text observation-and-labelling visual for ${subtopic}; one clear real-world focal object, colour-coded callouts and generous white space.`
      : `Accurate reference diagram for ${subtopic}; show the key structure, process, variable or relationship with conventional scientific notation and only essential labels.`,
    diagramB: isPrimary
      ? `Playful but scientifically faithful comparison, sorting, sequence or investigation visual for ${subtopic}; designed for pupils to talk, classify, predict or complete.`
      : `A distinct exam-useful representation of ${subtopic}: an annotated process, apparatus arrangement, data display, comparison, application context or partial-label task; do not repeat Diagram A.`,
    revisionMap: seed.stage === "GCSE" ? `One-page GCSE revision map for ${subtopic}: linked keywords, equations, processes, variables, common misconceptions and required practical links where applicable.` : undefined,
    tags: [seed.stage, ...seed.yearGroups, seed.discipline, seed.topic, subtopic, ...(entry.practical ? ["required-practical"] : [])],
  };
});

// Sources: DfE National Curriculum for England science programmes of study;
// AQA GCSE Combined Science: Trilogy (8464) biology, chemistry and physics content.
const seeds: TopicSeed[] = [
  // KS1 — designed for concrete observation, talk, sorting and simple labels.
  { stage: "KS1", yearGroups: ["Year 1"], discipline: "primary-science", topic: "Plants", visualProfile: "primary-playful", specificationRefs: ["DfE KS1 Y1 Plants"], subtopics: [
    { name: "Common wild and garden plants", focus: "Identify familiar flowering plants in local habitats." },
    { name: "Deciduous and evergreen trees", focus: "Compare trees by leaves and seasonal change." },
    { name: "Basic flowering plant structure", focus: "Name root, stem, leaf, flower and petal." },
  ]},
  { stage: "KS1", yearGroups: ["Year 1"], discipline: "primary-science", topic: "Animals including humans", visualProfile: "primary-playful", specificationRefs: ["DfE KS1 Y1 Animals including humans"], subtopics: [
    { name: "Animal groups", focus: "Identify fish, amphibians, reptiles, birds and mammals." },
    { name: "Carnivores herbivores and omnivores", focus: "Classify animals by what they eat." },
    { name: "Animal body structures", focus: "Compare observable features of common animals." },
    { name: "Human body parts and senses", focus: "Name body parts and link each sense organ to a sense." },
  ]},
  { stage: "KS1", yearGroups: ["Year 1"], discipline: "primary-science", topic: "Everyday materials", visualProfile: "primary-playful", specificationRefs: ["DfE KS1 Y1 Everyday materials"], subtopics: [
    { name: "Objects and materials", focus: "Distinguish an object from the material from which it is made." },
    { name: "Material properties", focus: "Compare simple properties such as hard, soft, shiny and waterproof." },
    { name: "Grouping everyday materials", focus: "Sort wood, plastic, glass, metal, water and rock by properties." },
  ]},
  { stage: "KS1", yearGroups: ["Year 1"], discipline: "primary-science", topic: "Seasonal changes", visualProfile: "primary-playful", specificationRefs: ["DfE KS1 Y1 Seasonal changes"], subtopics: [
    { name: "Four seasons", focus: "Observe recurring seasonal changes." },
    { name: "Seasonal weather and day length", focus: "Relate weather and changing daylight to seasons." },
  ]},
  { stage: "KS1", yearGroups: ["Year 2"], discipline: "primary-science", topic: "Living things and habitats", visualProfile: "primary-playful", specificationRefs: ["DfE KS1 Y2 Living things and habitats"], subtopics: [
    { name: "Living dead and never alive", focus: "Identify and compare things that are living, dead and never alive." },
    { name: "Habitats and microhabitats", focus: "Match organisms to habitats and microhabitats." },
    { name: "Simple food chains", focus: "Show how plants and animals depend on each other for food." },
  ]},
  { stage: "KS1", yearGroups: ["Year 2"], discipline: "primary-science", topic: "Plants", visualProfile: "primary-playful", specificationRefs: ["DfE KS1 Y2 Plants"], subtopics: [
    { name: "Seeds and bulbs growth", focus: "Observe and describe how seeds and bulbs grow into mature plants." },
    { name: "Plant needs", focus: "Investigate water, light and suitable temperature for growth." },
  ]},
  { stage: "KS1", yearGroups: ["Year 2"], discipline: "primary-science", topic: "Animals including humans", visualProfile: "primary-playful", specificationRefs: ["DfE KS1 Y2 Animals including humans"], subtopics: [
    { name: "Offspring and adults", focus: "Notice that animals have offspring that grow into adults." },
    { name: "Basic needs for survival", focus: "Recognise needs for water, food and air." },
    { name: "Healthy living", focus: "Understand food, exercise, hygiene and health." },
  ]},
  { stage: "KS1", yearGroups: ["Year 2"], discipline: "primary-science", topic: "Uses of everyday materials", visualProfile: "primary-playful", specificationRefs: ["DfE KS1 Y2 Uses of everyday materials"], subtopics: [
    { name: "Suitable materials", focus: "Compare suitability of materials for a particular use." },
    { name: "Changing shape", focus: "Find out how solid objects can be changed by squashing, bending, twisting and stretching." },
  ]},

  // KS2 — still accessible and engaging, but use correct causal vocabulary and records.
  { stage: "KS2", yearGroups: ["Year 3"], discipline: "primary-science", topic: "Plants", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y3 Plants"], subtopics: [
    { name: "Plant functions", focus: "Explore functions of roots, stem, leaves and flowers." },
    { name: "Plant requirements", focus: "Investigate water, light, air, nutrients and room to grow." },
    { name: "Water transport", focus: "Investigate how water moves through plants." },
    { name: "Pollination and seed dispersal", focus: "Describe pollination, seed formation and dispersal." },
  ]},
  { stage: "KS2", yearGroups: ["Year 3"], discipline: "primary-science", topic: "Animals including humans", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y3 Animals including humans"], subtopics: [
    { name: "Nutrition and skeletons", focus: "Identify nutrition needs and the skeleton's support and protection roles." },
    { name: "Muscles and movement", focus: "Understand muscles as part of movement." },
  ]},
  { stage: "KS2", yearGroups: ["Year 3"], discipline: "primary-science", topic: "Rocks", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y3 Rocks"], subtopics: [
    { name: "Rock types", focus: "Compare and group rocks by appearance and physical properties." },
    { name: "Fossils", focus: "Describe simply how fossils are formed." },
    { name: "Soils", focus: "Recognise soils are made from rocks and organic matter." },
  ]},
  { stage: "KS2", yearGroups: ["Year 3"], discipline: "primary-science", topic: "Light", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y3 Light"], subtopics: [
    { name: "Light and seeing", focus: "Recognise that light is needed to see and dark is absence of light." },
    { name: "Reflection and shadows", focus: "Explain reflection and investigate how shadows form and change." },
  ]},
  { stage: "KS2", yearGroups: ["Year 3"], discipline: "primary-science", topic: "Forces and magnets", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y3 Forces and magnets"], subtopics: [
    { name: "Contact and non-contact forces", focus: "Compare pushes, pulls and magnetic forces." },
    { name: "Friction and surfaces", focus: "Observe that friction acts between surfaces." },
    { name: "Magnets", focus: "Observe attraction, repulsion and magnetic materials." },
  ]},
  { stage: "KS2", yearGroups: ["Year 4"], discipline: "primary-science", topic: "Living things and habitats", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y4 Living things and habitats"], subtopics: [
    { name: "Classification keys", focus: "Use simple keys to classify local living things." },
    { name: "Environmental change", focus: "Recognise that environments can change and pose dangers." },
  ]},
  { stage: "KS2", yearGroups: ["Year 4"], discipline: "primary-science", topic: "Animals including humans", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y4 Animals including humans"], subtopics: [
    { name: "Digestive system", focus: "Describe the simple functions of the basic parts of the digestive system." },
    { name: "Teeth and eating", focus: "Identify tooth types and their functions." },
    { name: "Food chains", focus: "Construct food chains using producers, predators and prey." },
  ]},
  { stage: "KS2", yearGroups: ["Year 4"], discipline: "primary-science", topic: "States of matter", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y4 States of matter"], subtopics: [
    { name: "Solids liquids and gases", focus: "Compare and group materials by state." },
    { name: "Changes of state", focus: "Observe melting, freezing, evaporation and condensation." },
    { name: "Water cycle", focus: "Identify evaporation and condensation in the water cycle." },
  ]},
  { stage: "KS2", yearGroups: ["Year 4"], discipline: "primary-science", topic: "Sound", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y4 Sound"], subtopics: [
    { name: "Vibrations and sound", focus: "Identify that sounds are made by vibrations." },
    { name: "Sound travel and hearing", focus: "Recognise sound travels through a medium to the ear." },
    { name: "Pitch volume and distance", focus: "Find patterns between pitch, volume and distance." },
  ]},
  { stage: "KS2", yearGroups: ["Year 4"], discipline: "primary-science", topic: "Electricity", visualProfile: "primary-playful", specificationRefs: ["DfE LKS2 Y4 Electricity"], subtopics: [
    { name: "Simple circuits", focus: "Construct a simple series electrical circuit." },
    { name: "Conductors and insulators", focus: "Identify common conductors and insulators." },
    { name: "Switches", focus: "Recognise that a switch opens and closes a circuit." },
  ]},
  { stage: "KS2", yearGroups: ["Year 5"], discipline: "primary-science", topic: "Living things and habitats", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y5 Living things and habitats"], subtopics: [
    { name: "Life cycles", focus: "Describe life cycles of mammals, amphibians, insects and birds." },
    { name: "Plant reproduction", focus: "Describe sexual and asexual reproduction in plants." },
  ]},
  { stage: "KS2", yearGroups: ["Year 5"], discipline: "primary-science", topic: "Animals including humans", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y5 Animals including humans"], subtopics: [
    { name: "Human development", focus: "Describe changes as humans develop to old age." },
  ]},
  { stage: "KS2", yearGroups: ["Year 5"], discipline: "primary-science", topic: "Properties and changes of materials", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y5 Properties and changes of materials"], subtopics: [
    { name: "Material properties", focus: "Compare materials by hardness, solubility, transparency, conductivity and magnetism." },
    { name: "Separating mixtures", focus: "Use filtering, sieving and evaporating to recover substances." },
    { name: "Reversible and irreversible changes", focus: "Distinguish reversible changes from irreversible changes that form new materials." },
  ]},
  { stage: "KS2", yearGroups: ["Year 5"], discipline: "primary-science", topic: "Earth and space", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y5 Earth and space"], subtopics: [
    { name: "Solar system", focus: "Describe movement of Earth and other planets relative to the Sun." },
    { name: "Moon and spherical bodies", focus: "Describe the Moon's movement and spherical bodies." },
    { name: "Day night and shadows", focus: "Explain day and night through Earth's rotation." },
  ]},
  { stage: "KS2", yearGroups: ["Year 5"], discipline: "primary-science", topic: "Forces", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y5 Forces"], subtopics: [
    { name: "Gravity and resistance", focus: "Explain gravity and effects of air, water and frictional resistance." },
    { name: "Mechanisms", focus: "Recognise levers, pulleys and gears allow a smaller force to have a greater effect." },
  ]},
  { stage: "KS2", yearGroups: ["Year 6"], discipline: "primary-science", topic: "Living things and habitats", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y6 Living things and habitats"], subtopics: [
    { name: "Classification", focus: "Describe how living things are classified into broad groups." },
    { name: "Microorganisms", focus: "Give reasons for classifying microorganisms, plants and animals." },
  ]},
  { stage: "KS2", yearGroups: ["Year 6"], discipline: "primary-science", topic: "Animals including humans", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y6 Animals including humans"], subtopics: [
    { name: "Circulatory system", focus: "Identify main parts of the human circulatory system and their functions." },
    { name: "Healthy lifestyle and transport", focus: "Recognise diet, exercise, drugs and lifestyle affect body function and transport of water and nutrients." },
  ]},
  { stage: "KS2", yearGroups: ["Year 6"], discipline: "primary-science", topic: "Evolution and inheritance", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y6 Evolution and inheritance"], subtopics: [
    { name: "Inheritance", focus: "Recognise offspring vary and normally inherit characteristics from parents." },
    { name: "Adaptation and evolution", focus: "Identify adaptation and how it may lead to evolution." },
    { name: "Fossils and evolution", focus: "Recognise fossils provide information about life on Earth millions of years ago." },
  ]},
  { stage: "KS2", yearGroups: ["Year 6"], discipline: "primary-science", topic: "Light", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y6 Light"], subtopics: [
    { name: "Light travels in straight lines", focus: "Use the idea that light travels in straight lines to explain shadows and seeing." },
    { name: "Reflections and periscopes", focus: "Explain how mirrors form reflections and periscopes work." },
  ]},
  { stage: "KS2", yearGroups: ["Year 6"], discipline: "primary-science", topic: "Electricity", visualProfile: "primary-playful", specificationRefs: ["DfE UKS2 Y6 Electricity"], subtopics: [
    { name: "Circuit symbols", focus: "Use recognised symbols when representing a simple circuit in a diagram." },
    { name: "Voltage and brightness", focus: "Associate brightness or loudness with voltage and number of cells." },
    { name: "Variation in circuits", focus: "Compare and give reasons for variations in how components function." },
  ]},

  // KS3 — technical models and diagrams follow DfE subject-disciplinary content.
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "biology", topic: "Cells and organisation", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Biology: structure and function"], subtopics: [
    { name: "Plant and animal cells", focus: "Compare cell wall, membrane, cytoplasm, nucleus, vacuole, mitochondria and chloroplasts." },
    { name: "Microscopy", focus: "Observe, interpret and record cell structure using a light microscope." },
    { name: "Diffusion", focus: "Explain movement of materials in and between cells by diffusion." },
    { name: "Cells tissues organs systems", focus: "Model hierarchy from cells to organisms." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "biology", topic: "Skeletal and muscular systems", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Biology: skeletal and muscular"], subtopics: [
    { name: "Human skeleton", focus: "Explain support, protection, movement and blood-cell production." },
    { name: "Antagonistic muscles", focus: "Explain paired muscle action at a joint." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "biology", topic: "Nutrition and digestion", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Biology: nutrition and digestion"], subtopics: [
    { name: "Balanced diet", focus: "Link nutrient groups to their functions and deficiency or excess." },
    { name: "Digestive system", focus: "Identify organs, tissues, adaptations and enzyme action." },
    { name: "Photosynthesis in plants", focus: "Show carbohydrate production, mineral uptake and water uptake." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "biology", topic: "Gas exchange", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Biology: gas exchange"], subtopics: [
    { name: "Human gas exchange system", focus: "Show airways, lungs, alveoli and adaptations." },
    { name: "Breathing mechanics", focus: "Use a pressure model for ventilation." },
    { name: "Plant stomata", focus: "Explain plant gas exchange via stomata." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "biology", topic: "Reproduction and health", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Biology: reproduction and health"], subtopics: [
    { name: "Human reproductive systems", focus: "Identify structures, gametes, fertilisation, gestation and birth appropriately." },
    { name: "Flower structure and pollination", focus: "Show insect and wind pollination, fertilisation and seed formation." },
    { name: "Drugs and health", focus: "Explain effects of recreational drugs on behaviour and life processes." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "biology", topic: "Bioenergetics", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Biology: material cycles and energy"], subtopics: [
    { name: "Photosynthesis equation", focus: "Model reactants and products of photosynthesis." },
    { name: "Leaf adaptations", focus: "Relate leaf structure to photosynthesis." },
    { name: "Aerobic and anaerobic respiration", focus: "Compare reactants, products and consequences." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "biology", topic: "Ecosystems", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Biology: interactions and interdependencies"], subtopics: [
    { name: "Food webs and interdependence", focus: "Model energy and material relationships in food webs." },
    { name: "Pollination and food security", focus: "Explain the importance of insect pollination." },
    { name: "Toxins and bioaccumulation", focus: "Show accumulation of toxic materials through food chains." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "biology", topic: "Genetics and evolution", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Biology: genetics and evolution"], subtopics: [
    { name: "Chromosomes genes and DNA", focus: "Use a simple model to show inheritance information." },
    { name: "Variation", focus: "Compare continuous and discontinuous variation." },
    { name: "Natural selection", focus: "Model competition, variation and selection without implying individual choice." },
    { name: "Biodiversity and extinction", focus: "Explain biodiversity maintenance and gene banks." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "chemistry", topic: "Particle model and states", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Chemistry: particulate nature of matter"], subtopics: [
    { name: "Particle arrangements", focus: "Compare particle arrangement, motion and spacing in solid, liquid and gas." },
    { name: "Changes of state and gas pressure", focus: "Use particle model to explain state changes and pressure." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "chemistry", topic: "Atoms elements compounds", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Chemistry: atoms elements compounds"], subtopics: [
    { name: "Dalton atomic model", focus: "Use simple atomic model to distinguish atoms, elements and compounds." },
    { name: "Chemical symbols and formulae", focus: "Represent elements and compounds correctly." },
    { name: "Conservation of mass", focus: "Relate atom rearrangement to conserved mass." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "chemistry", topic: "Mixtures and separation", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Chemistry: pure and impure substances"], subtopics: [
    { name: "Pure substances and mixtures", focus: "Distinguish pure substances, mixtures, dissolving and diffusion." },
    { name: "Filtration evaporation distillation chromatography", focus: "Select and label appropriate separation techniques." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "chemistry", topic: "Chemical reactions", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Chemistry: chemical reactions"], subtopics: [
    { name: "Chemical equations", focus: "Represent atom rearrangement with word and symbol equations." },
    { name: "Combustion decomposition oxidation displacement", focus: "Compare common reaction types." },
    { name: "Acids alkalis and neutralisation", focus: "Use pH and indicators; show salts, hydrogen and water correctly." },
    { name: "Catalysts", focus: "Explain catalysts alter reaction rate without being used up." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "chemistry", topic: "Energetics and periodic table", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Chemistry: energetics and periodic table"], subtopics: [
    { name: "Exothermic and endothermic reactions", focus: "Show energy transfer direction and temperature change qualitatively." },
    { name: "Periodic table groups and periods", focus: "Use periods, groups, metals and non-metals to predict patterns." },
    { name: "Reactivity series and extraction", focus: "Relate reactivity and carbon reduction to metal extraction." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "chemistry", topic: "Earth and materials", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Chemistry: Earth and atmosphere"], subtopics: [
    { name: "Earth structure and rock cycle", focus: "Show Earth's layers and formation of igneous, sedimentary and metamorphic rocks." },
    { name: "Atmosphere and climate", focus: "Show atmospheric composition and human carbon dioxide impact." },
    { name: "Ceramics polymers and composites", focus: "Relate material structure or use to qualitative properties." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "physics", topic: "Energy", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Physics: energy"], subtopics: [
    { name: "Energy stores and transfers", focus: "Use distinct stores and pathways; do not treat energy as a substance." },
    { name: "Heating and insulation", focus: "Explain transfer by conduction and radiation towards thermal equilibrium." },
    { name: "Energy resources and domestic energy", focus: "Compare fuel use, appliance power and energy costs." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "physics", topic: "Motion and forces", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Physics: motion and forces"], subtopics: [
    { name: "Speed distance time graphs", focus: "Use correctly labelled distance-time graphs and speed relationship." },
    { name: "Force arrows and resultant force", focus: "Use force vectors, balanced and unbalanced examples." },
    { name: "Moments springs and work", focus: "Show turning effect, force-extension and work done accurately." },
    { name: "Pressure in fluids", focus: "Explain pressure, depth, upthrust and floating." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "physics", topic: "Waves and light", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Physics: waves"], subtopics: [
    { name: "Wave properties", focus: "Represent transverse and longitudinal waves with amplitude, wavelength and frequency." },
    { name: "Sound", focus: "Show vibrations, medium, reflection and auditory range." },
    { name: "Light rays and lenses", focus: "Use conventional ray arrows for reflection, refraction, lenses, eye and cameras." },
    { name: "Colour and electromagnetic radiation", focus: "Explain absorption, reflection and colour without mixing wave and ray models." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "physics", topic: "Electricity and magnetism", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Physics: electricity and electromagnetism"], subtopics: [
    { name: "Series and parallel circuits", focus: "Use standard circuit symbols and correct current or potential difference relationships." },
    { name: "Static electricity and electric fields", focus: "Show electron transfer and field interaction correctly." },
    { name: "Magnetic fields and electromagnets", focus: "Show poles, field lines, compasses, motors and electromagnets." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "physics", topic: "Matter and space", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Physics: matter and space"], subtopics: [
    { name: "Physical and chemical changes", focus: "Distinguish reversible physical changes from chemical changes using particles." },
    { name: "Internal energy", focus: "Relate temperature change to particle motion and spacing." },
    { name: "Space physics", focus: "Show gravity, solar system, seasons, day length and light years accurately." },
  ]},
  { stage: "KS3", yearGroups: ["Year 7", "Year 8", "Year 9"], discipline: "working-scientifically", topic: "Working scientifically", visualProfile: "ks3-technical", specificationRefs: ["DfE KS3 Working scientifically"], subtopics: [
    { name: "Variables and fair tests", focus: "Identify independent, dependent and control variables in valid investigations." },
    { name: "Accuracy precision repeatability reproducibility", focus: "Distinguish the four concepts in measurement and method evaluation." },
    { name: "Tables graphs and conclusions", focus: "Present data with correct variables, units, scales and evidence-based conclusions." },
    { name: "Risk assessment and apparatus", focus: "Choose appropriate apparatus and safe controls for laboratory or fieldwork." },
  ]},

  // GCSE Combined Science — AQA 8464-aligned; usable as board-neutral common-core assets with exact tags.
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "biology", topic: "Cell biology", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 4.1"], subtopics: [
    { name: "Eukaryotic and prokaryotic cells", focus: "Compare animal, plant and bacterial cells with correct organelles." },
    { name: "Microscopy and magnification", focus: "Show microscope use and magnification or scale-bar calculation conventions." },
    { name: "Mitosis and cell cycle", focus: "Model chromosome replication, mitosis and growth or repair." },
    { name: "Stem cells", focus: "Compare embryonic, adult and plant meristem stem-cell applications." },
    { name: "Transport in cells", focus: "Compare diffusion, osmosis and active transport across membranes." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "biology", topic: "Organisation", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 4.2"], subtopics: [
    { name: "Digestive system and enzymes", focus: "Label organs and relate enzyme, substrate and active site to digestion." },
    { name: "Required practical enzymes", focus: "Show a valid pH-temperature-enzyme rate apparatus plan and graph conventions.", practical: true },
    { name: "Heart blood and blood vessels", focus: "Show double circulation, heart chambers and vessel adaptations accurately." },
    { name: "Required practical osmosis", focus: "Show a valid potato-cylinder osmosis method, variables and percentage-change graph.", practical: true },
    { name: "Plant tissues and transpiration", focus: "Relate xylem, phloem, stomata and transpiration to plant transport." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "biology", topic: "Infection and response", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 4.3"], subtopics: [
    { name: "Communicable disease and pathogens", focus: "Show pathogen types, transmission routes and barriers." },
    { name: "Immune response vaccination and antibiotics", focus: "Distinguish immune response, vaccination and antibiotic action." },
    { name: "Required practical antibiotics and antiseptics", focus: "Show aseptic agar-plate practical, zones of inhibition and safety.", practical: true },
    { name: "Monoclonal antibodies", focus: "Explain production and a diagnostic or therapeutic application." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "biology", topic: "Bioenergetics", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 4.4"], subtopics: [
    { name: "Photosynthesis", focus: "Use balanced word or symbol equation and correct limiting factors." },
    { name: "Required practical photosynthesis", focus: "Show pondweed light-intensity practical with control variables and data representation.", practical: true },
    { name: "Respiration", focus: "Compare aerobic and anaerobic respiration with correct products and energy transfer." },
    { name: "Metabolism", focus: "Connect metabolism to synthesis, breakdown and energy release pathways." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "biology", topic: "Homeostasis and response", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 4.5"], subtopics: [
    { name: "Nervous system and reflexes", focus: "Show neurones, synapses, reflex arc and receptors accurately." },
    { name: "Endocrine system and hormones", focus: "Show hormone glands, blood transport and target organs." },
    { name: "Menstrual cycle and reproduction", focus: "Model cycle hormones, contraception, fertility treatment and pregnancy responsibly." },
    { name: "Control of blood glucose", focus: "Show insulin and glucagon negative feedback pathways." },
    { name: "Thermoregulation and water balance", focus: "Show skin or kidney responses as negative-feedback control systems." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "biology", topic: "Inheritance variation and evolution", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 4.6"], subtopics: [
    { name: "DNA genes chromosomes and protein synthesis", focus: "Show chromosome-gene-DNA relationship and protein synthesis at appropriate GCSE depth." },
    { name: "Meiosis and inheritance", focus: "Model meiosis, gametes, fertilisation, alleles and genetic diagrams." },
    { name: "Variation evolution and natural selection", focus: "Show selection across generations without teleological language." },
    { name: "Selective breeding genetic engineering cloning", focus: "Compare applications and limitations accurately." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "biology", topic: "Ecology", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 4.7"], subtopics: [
    { name: "Ecosystems and sampling", focus: "Use quadrats, transects, distribution, abundance and biotic or abiotic factors." },
    { name: "Required practical ecology sampling", focus: "Show a valid field-sampling design with quadrat or transect data.", practical: true },
    { name: "Food chains trophic levels and biomass", focus: "Show trophic levels, biomass transfer and food-security links accurately." },
    { name: "Cycles biodiversity and climate change", focus: "Show carbon or water cycle and human impacts on biodiversity." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Atomic structure and periodic table", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.1"], subtopics: [
    { name: "Atoms isotopes and ions", focus: "Use proton, neutron and electron numbers correctly with isotope notation." },
    { name: "Electron configuration and periodic table", focus: "Relate shells, groups and periods to periodic-table position." },
    { name: "Development of periodic table", focus: "Compare early models and Mendeleev's arrangement." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Bonding structure and properties", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.2"], subtopics: [
    { name: "Ionic bonding", focus: "Show electron transfer, ion charges and giant ionic lattice correctly." },
    { name: "Covalent bonding", focus: "Show shared electron pairs and simple molecular versus giant covalent structures." },
    { name: "Metallic bonding", focus: "Show positive ions and delocalised electrons without molecular language." },
    { name: "Nanoparticles and carbon structures", focus: "Compare diamond, graphite, graphene, fullerenes and nanoparticle applications." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Quantitative chemistry", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.3"], subtopics: [
    { name: "Conservation of mass and equations", focus: "Balance equations and model mass conservation correctly." },
    { name: "Relative formula mass and moles", focus: "Use formula mass, amount of substance and molar calculations with units." },
    { name: "Concentration and gas volumes", focus: "Show concentration or gas-volume calculation relationships." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Chemical changes", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.4"], subtopics: [
    { name: "Reactivity series and extraction", focus: "Link displacement, oxidation, reduction and extraction methods." },
    { name: "Acids bases and salts", focus: "Show acid-base reactions and pH conventions accurately." },
    { name: "Required practical neutralisation", focus: "Show titration apparatus, endpoint, variables and safe technique.", practical: true },
    { name: "Electrolysis", focus: "Show electrode products, ion movement and half-equation conventions." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Energy changes", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.5"], subtopics: [
    { name: "Exothermic and endothermic profiles", focus: "Use correct energy-level profile, activation energy and sign conventions." },
    { name: "Required practical temperature changes", focus: "Show valid calorimetry apparatus and temperature-time graph.", practical: true },
    { name: "Chemical cells and fuel cells", focus: "Show electron flow and energy transfer in simple cells or fuel cells." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Rate and extent of chemical change", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.6"], subtopics: [
    { name: "Collision theory and rate factors", focus: "Show collision frequency, activation energy and factors affecting rate." },
    { name: "Required practical rate of reaction", focus: "Show a valid gas-syringe or mass-loss rate practical and graph.", practical: true },
    { name: "Reversible reactions and equilibrium", focus: "Show dynamic equilibrium and qualitative effects of changing conditions." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Organic chemistry", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.7"], subtopics: [
    { name: "Crude oil and fractional distillation", focus: "Show fractionating column temperature gradient and fraction trends." },
    { name: "Alkanes alkenes and cracking", focus: "Use correct displayed or structural formulae and test for alkenes." },
    { name: "Alcohols carboxylic acids and polymers", focus: "Show functional groups and addition or condensation polymerisation concepts." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Chemical analysis", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.8"], subtopics: [
    { name: "Chromatography", focus: "Show paper chromatography setup and calculate or interpret Rf values correctly." },
    { name: "Required practical chromatography", focus: "Show solvent line, baseline, separation and safe analysis.", practical: true },
    { name: "Gas tests and instrumental analysis", focus: "Show correct positive test observations and spectra conventions." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Chemistry of the atmosphere", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.9"], subtopics: [
    { name: "Evolution of atmosphere", focus: "Show changes in atmospheric composition through Earth's history." },
    { name: "Greenhouse effect and pollutants", focus: "Distinguish greenhouse gases, climate effects and atmospheric pollutants." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "chemistry", topic: "Using resources", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 5.10"], subtopics: [
    { name: "Potable water and wastewater", focus: "Show treatment stages and methods appropriate to source water." },
    { name: "Life cycle assessment recycling and corrosion", focus: "Compare resource impacts and corrosion prevention." },
    { name: "Haber process and NPK fertilisers", focus: "Show process conditions, equilibrium and fertiliser production accurately." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "physics", topic: "Energy", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 6.1"], subtopics: [
    { name: "Energy stores pathways and conservation", focus: "Use approved energy-store and transfer-pathway language." },
    { name: "Required practical specific heat capacity", focus: "Show electrical-heating apparatus, measurements, control variables and energy calculation.", practical: true },
    { name: "Power efficiency and energy resources", focus: "Show equations, Sankey diagrams and resource comparisons correctly." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "physics", topic: "Electricity", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 6.2"], subtopics: [
    { name: "Circuit quantities and symbols", focus: "Use conventional circuit symbols, current and potential-difference meter placement." },
    { name: "Required practical I-V characteristics", focus: "Show valid I-V investigation apparatus and graph shapes.", practical: true },
    { name: "Series parallel and resistance", focus: "Show current, potential difference, resistance and power relationships." },
    { name: "Mains electricity and safety", focus: "Show live neutral earth, fuse and safety features accurately." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "physics", topic: "Particle model of matter", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 6.3"], subtopics: [
    { name: "Density and internal energy", focus: "Show density relationship and particle-model explanation of heating." },
    { name: "Changes of state", focus: "Use correct heating or cooling curve and latent heat concepts." },
    { name: "Gas pressure and volume", focus: "Show particle collisions and pressure-volume relationships." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "physics", topic: "Atomic structure", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 6.4"], subtopics: [
    { name: "Nuclear model and isotopes", focus: "Use alpha beta gamma and nuclear notation correctly." },
    { name: "Radioactive decay and half life", focus: "Show random decay, count-rate and half-life graphs accurately." },
    { name: "Nuclear radiation uses and hazards", focus: "Compare penetration, ionisation, sources, uses and risk controls." },
    { name: "Fission fusion and nuclear equations", focus: "Balance mass and atomic numbers in nuclear equations." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "physics", topic: "Forces", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 6.5"], subtopics: [
    { name: "Scalars vectors and resultant forces", focus: "Use vector conventions and free-body diagrams accurately." },
    { name: "Motion graphs and acceleration", focus: "Use correctly labelled distance-time and velocity-time graphs." },
    { name: "Required practical force and extension", focus: "Show spring-extension apparatus, zeroing, variables and graph.", practical: true },
    { name: "Stopping distance momentum and safety", focus: "Relate thinking, braking, reaction time, momentum and road safety." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "physics", topic: "Waves", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 6.6"], subtopics: [
    { name: "Wave properties and wave speed", focus: "Use amplitude, wavelength, frequency, period and wave-speed equation correctly." },
    { name: "Required practical waves", focus: "Show ripple-tank or string practical with measurement of wavelength, frequency and speed.", practical: true },
    { name: "Reflection refraction and lenses", focus: "Use correct normal, angles and ray-arrow conventions." },
    { name: "Electromagnetic spectrum", focus: "Order spectrum correctly with appropriate uses, hazards and protection." },
    { name: "Sound and ultrasound", focus: "Show longitudinal compression-rarefaction model and applications." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "physics", topic: "Magnetism and electromagnetism", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 6.7"], subtopics: [
    { name: "Permanent and induced magnetism", focus: "Show magnetic fields, poles and material behaviour accurately." },
    { name: "Motor effect and electromagnets", focus: "Show force direction, coils and field interactions." },
    { name: "Generators transformers and national grid", focus: "Show induced potential difference, transformer turns ratio and transmission losses." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "physics", topic: "Space physics", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 6.8"], subtopics: [
    { name: "Solar system and orbital motion", focus: "Show orbit, gravitational field and satellite motion without implying force in direction of travel." },
    { name: "Life cycle of a star", focus: "Show stellar evolution pathways by initial mass." },
    { name: "Red shift and expanding universe", focus: "Show red shift evidence and Big Bang model at GCSE level." },
  ]},
  { stage: "GCSE", yearGroups: ["Year 10", "Year 11"], discipline: "working-scientifically", topic: "Required practicals and data", visualProfile: "gcse-exam", specificationRefs: ["AQA 8464 Working scientifically and practical assessment"], subtopics: [
    { name: "Variables uncertainty and evaluation", focus: "Distinguish accuracy, precision, resolution, random error, systematic error and valid improvements." },
    { name: "Graphs tables and gradients", focus: "Use correct variables, units, scales, line of best fit, gradient and intercept conventions." },
    { name: "Laboratory safety and apparatus", focus: "Show standard laboratory apparatus, hazards, controls and safe set-up conventions." },
  ]},
];

export const SCIENCE_IMAGE_TAXONOMY: ScienceImageTopic[] = seeds.flatMap(makeTopic);

export function findScienceImageTopics(input: { stage?: string; discipline?: string; topic?: string; subtopic?: string }) {
  const normalise = (value?: string) => (value || "").toLowerCase().trim();
  const terms = [normalise(input.stage), normalise(input.discipline), normalise(input.topic), normalise(input.subtopic)].filter(Boolean);
  return SCIENCE_IMAGE_TAXONOMY.filter((entry) => {
    const haystack = [entry.stage, entry.discipline, entry.topic, entry.subtopic, ...entry.aliases, ...entry.tags].join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export const SCIENCE_IMAGE_TAXONOMY_SUMMARY = {
  entries: SCIENCE_IMAGE_TAXONOMY.length,
  byStage: Object.fromEntries(["KS1", "KS2", "KS3", "GCSE"].map((stage) => [stage, SCIENCE_IMAGE_TAXONOMY.filter((entry) => entry.stage === stage).length])),
  requiredPracticals: SCIENCE_IMAGE_TAXONOMY.filter((entry) => entry.requiredPractical).length,
};
