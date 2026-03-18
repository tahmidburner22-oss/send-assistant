/**
 * Adaptly Topic Image Bank
 *
 * Multiple copyright-free images per topic per subject.
 * - General subjects: Unsplash (https://unsplash.com/license — free for commercial/non-commercial, no attribution required)
 * - Biology: Bioicons (https://bioicons.com — MIT License, free for any use)
 *
 * 4 images per topic minimum. Users can scroll between them using prev/next.
 * Selection persisted in localStorage per subject+topic key.
 *
 * Image format: Unsplash CDN with crop params for consistent 3:2 ratio.
 */

export type ImageType = "photo" | "bioicon";

export interface TopicImage {
  type: ImageType;
  url: string;       // Full URL — Unsplash photo or Bioicons SVG
  bg?: string;       // Background colour for bioicon overlays
  label: string;     // Short description shown in picker
  credit: string;    // "Unsplash" | "Bioicons (MIT)"
}

// ── Unsplash helper ───────────────────────────────────────────────────────────
const u = (id: string, label: string): TopicImage => ({
  type: "photo",
  url: `https://images.unsplash.com/${id}?w=600&h=280&fit=crop&q=80&auto=format`,
  label,
  credit: "Unsplash",
});

// ── Bioicon helper (MIT licensed SVG on coloured bg) ──────────────────────────
const bio = (svgPath: string, label: string, bg = "#dbeafe"): TopicImage => ({
  type: "bioicon",
  url: `https://bioicons.com/icons/${svgPath}.svg`,
  bg,
  label,
  credit: "Bioicons (MIT)",
});

// ── Fallback images used when no specific topic match ─────────────────────────
const SUBJECT_FALLBACKS: Record<string, TopicImage[]> = {
  mathematics: [
    u("photo-1509228468518-180dd4864904", "Maths equation on blackboard"),
    u("photo-1635070041078-e363dbe005cb", "Scientific calculator"),
    u("photo-1518932945647-7a1c969f8be2", "Graph paper and ruler"),
    u("photo-1551288049-bebda4e38f71", "Data and statistics chart"),
  ],
  english: [
    u("photo-1481627834876-b7833e8f5570", "Open books in library"),
    u("photo-1455390582262-044cdead277a", "Pen and writing paper"),
    u("photo-1507842217343-583bb7270b66", "Library shelves"),
    u("photo-1519682337058-a94d519337bc", "Writing close-up"),
  ],
  science: [
    u("photo-1532187863486-abf9dbad1b69", "Science laboratory"),
    u("photo-1559757148-5c350d0d3c56", "Microscope slide"),
    u("photo-1603126857599-f6e157fa2fe6", "Chemistry flasks"),
    u("photo-1628595351029-c2bf17511435", "DNA double helix model"),
  ],
  biology: [
    u("photo-1559757148-5c350d0d3c56", "Microscope cells"),
    u("photo-1530026405186-ed1f139313f8", "Human anatomy model"),
    u("photo-1518611012118-696072aa579a", "Nature and plants"),
    u("photo-1628595351029-c2bf17511435", "DNA strand"),
  ],
  chemistry: [
    u("photo-1603126857599-f6e157fa2fe6", "Chemistry laboratory"),
    u("photo-1532187863486-abf9dbad1b69", "Lab equipment"),
    u("photo-1556910103-1c02745aae4d", "Chemical reaction"),
    u("photo-1635241161466-541f065683ba", "Periodic table"),
  ],
  physics: [
    u("photo-1446776811953-b23d57bd21aa", "Space and stars"),
    u("photo-1635070041409-e64e3a14ef75", "Physics lab equipment"),
    u("photo-1635070041078-e363dbe005cb", "Electronics circuit"),
    u("photo-1502481851512-e9e2529bfbf9", "Light refraction prism"),
  ],
  history: [
    u("photo-1555993539-1732b0258235", "Ancient ruins"),
    u("photo-1524661135-423995f22d0b", "Old map"),
    u("photo-1589828994425-c25e5619ce24", "Medieval castle"),
    u("photo-1526374965328-7f61d4dc18c5", "Museum artefacts"),
  ],
  geography: [
    u("photo-1524661135-423995f22d0b", "World map"),
    u("photo-1464822759023-fed622ff2c3b", "Mountain landscape"),
    u("photo-1501854140801-50d01698950b", "River valley"),
    u("photo-1446776858070-70c3d5ed6758", "Satellite earth view"),
  ],
  computing: [
    u("photo-1461749280684-dccba630e2f6", "Code on monitor"),
    u("photo-1518770660439-4636190af475", "Circuit board"),
    u("photo-1558494949-ef010cbdcc31", "Network cables"),
    u("photo-1517694712202-14dd9538aa97", "Laptop coding"),
  ],
  art: [
    u("photo-1513364776144-60967b0f800f", "Artist painting"),
    u("photo-1460661419201-fd4cecdf8a8b", "Colourful paints"),
    u("photo-1605721911519-3dfeb3be25e7", "Art gallery"),
    u("photo-1547826039-bfc35e0f1ea8", "Watercolour brushes"),
  ],
  music: [
    u("photo-1511671782779-c97d3d27a1d4", "Piano keys"),
    u("photo-1514320291840-2e0a9bf2a9ae", "Guitar close-up"),
    u("photo-1507838153414-b4b713384a76", "Sheet music"),
    u("photo-1478737270239-2f02b77fc618", "Headphones and music"),
  ],
  pe: [
    u("photo-1461896836934-ffe607ba8211", "Athletic track"),
    u("photo-1530549387789-4c1017266635", "Team sports"),
    u("photo-1571902943202-507ec2618e8f", "Gym equipment"),
    u("photo-1476480862126-209bfaa8edc8", "Running outside"),
  ],
  pshe: [
    u("photo-1529156069898-49953e39b3ac", "Young people working together"),
    u("photo-1544717305-2782549b5136", "Community wellbeing"),
    u("photo-1582213782179-e0d53f98f2ca", "Mental health support"),
    u("photo-1560439513-74b037a25d84", "Healthy lifestyle"),
  ],
  re: [
    u("photo-1548690312-e3b507d8c110", "Place of worship"),
    u("photo-1513128034602-7814ccaddd4e", "Holy books"),
    u("photo-1524492412937-b28074a5d7da", "World religions symbols"),
    u("photo-1553527922-571aef0a3afe", "Candles and prayer"),
  ],
  mfl: [
    u("photo-1546410531-bb4caa6b424d", "Language books"),
    u("photo-1414235077428-338989a2e8c0", "European travel"),
    u("photo-1508739773434-c26b3d09e071", "Dictionary and vocabulary"),
    u("photo-1503023345310-bd7c1de61c7d", "World flags"),
  ],
  dt: [
    u("photo-1581091226825-a6a2a5aee158", "Design workshop"),
    u("photo-1504328345606-18bbc8c9d7d1", "Engineering tools"),
    u("photo-1565793298595-6a879b1d9492", "3D printing"),
    u("photo-1558618666-fcd25c85cd64", "Workshop machinery"),
  ],
  business: [
    u("photo-1454165804606-c3d57bc86b40", "Business meeting"),
    u("photo-1507003211169-0a1dd7228f2d", "Entrepreneur at desk"),
    u("photo-1559526324-4b87b5e36e44", "Business charts"),
    u("photo-1553729459-efe14ef6055d", "Marketing and branding"),
  ],
  drama: [
    u("photo-1503095396549-807759245b35", "Theatre stage"),
    u("photo-1460723237483-7a6dc9d0b212", "Dramatic performance"),
    u("photo-1536440136628-849c177e76a1", "Drama masks"),
    u("photo-1516450360452-9312f5e86fc7", "Spotlight on stage"),
  ],
};

// ── Per-topic overrides: most specific topics get purpose-matched images ───────
export const TOPIC_IMAGES: Record<string, Record<string, TopicImage[]>> = {

  // ── MATHEMATICS ──────────────────────────────────────────────────────────────
  mathematics: {
    "Place Value and Rounding": [
      u("photo-1509228468518-180dd4864904", "Numbers on chalkboard"),
      u("photo-1604594849809-dfedbc827105", "Digit blocks and numbers"),
      u("photo-1635070041078-e363dbe005cb", "Calculator display"),
      u("photo-1506784365847-bbad939e9335", "Math notebook"),
    ],
    "Addition and Subtraction": [
      u("photo-1509228468518-180dd4864904", "Arithmetic on chalkboard"),
      u("photo-1635070041078-e363dbe005cb", "Calculator"),
      u("photo-1518932945647-7a1c969f8be2", "Number line on paper"),
      u("photo-1604594849809-dfedbc827105", "Counting blocks"),
    ],
    "Multiplication and Division": [
      u("photo-1509228468518-180dd4864904", "Times tables on board"),
      u("photo-1635070041078-e363dbe005cb", "Calculator with sum"),
      u("photo-1518932945647-7a1c969f8be2", "Grid multiplication"),
      u("photo-1506784365847-bbad939e9335", "Maths exercise book"),
    ],
    "Fractions": [
      u("photo-1509228468518-180dd4864904", "Fraction diagrams"),
      u("photo-1602526212974-3bc56c3c4dce", "Pizza fraction slices"),
      u("photo-1518932945647-7a1c969f8be2", "Number line fractions"),
      u("photo-1551288049-bebda4e38f71", "Pie chart fractions"),
    ],
    "Decimals and Percentages": [
      u("photo-1551288049-bebda4e38f71", "Percentage chart"),
      u("photo-1543286386-713bdd548da4", "Data graph"),
      u("photo-1509228468518-180dd4864904", "Decimal notation board"),
      u("photo-1635070041078-e363dbe005cb", "Calculator percentage"),
    ],
    "Ratio and Proportion": [
      u("photo-1551288049-bebda4e38f71", "Bar chart ratio"),
      u("photo-1543286386-713bdd548da4", "Scale and balance"),
      u("photo-1509228468518-180dd4864904", "Ratio written on board"),
      u("photo-1518932945647-7a1c969f8be2", "Graph proportion"),
    ],
    "Algebra — Expressions and Equations": [
      u("photo-1509228468518-180dd4864904", "Algebra on blackboard"),
      u("photo-1518932945647-7a1c969f8be2", "Equation solving"),
      u("photo-1635070041078-e363dbe005cb", "Scientific calculator algebra"),
      u("photo-1506784365847-bbad939e9335", "Algebra notebook"),
    ],
    "Geometry — Angles and Shapes": [
      u("photo-1561089489-f13d5e730d72", "Geometric shapes"),
      u("photo-1509228468518-180dd4864904", "Angles diagram on board"),
      u("photo-1518932945647-7a1c969f8be2", "Protractor and ruler"),
      u("photo-1509728698627-ee41e0f1a5af", "Architectural geometry"),
    ],
    "Area and Perimeter": [
      u("photo-1561089489-f13d5e730d72", "Shape measurement"),
      u("photo-1518932945647-7a1c969f8be2", "Ruler measuring area"),
      u("photo-1509228468518-180dd4864904", "Area formulae on board"),
      u("photo-1509728698627-ee41e0f1a5af", "Architectural floor plan"),
    ],
    "Statistics — Mean, Median, Mode": [
      u("photo-1551288049-bebda4e38f71", "Statistics chart"),
      u("photo-1543286386-713bdd548da4", "Data bar graph"),
      u("photo-1504868584819-f8e8b4b6d7e3", "Analysing data"),
      u("photo-1460925895917-afdab827c52f", "Data visualisation"),
    ],
    "Probability": [
      u("photo-1611532736597-de2d4265fba3", "Dice probability"),
      u("photo-1551288049-bebda4e38f71", "Probability chart"),
      u("photo-1504868584819-f8e8b4b6d7e3", "Data analysis"),
      u("photo-1543286386-713bdd548da4", "Probability graph"),
    ],
    "Pythagoras' Theorem": [
      u("photo-1561089489-f13d5e730d72", "Right-angle triangle"),
      u("photo-1509228468518-180dd4864904", "Pythagoras on blackboard"),
      u("photo-1509728698627-ee41e0f1a5af", "Triangle architecture"),
      u("photo-1518932945647-7a1c969f8be2", "Triangle grid paper"),
    ],
    "Linear Graphs": [
      u("photo-1543286386-713bdd548da4", "Line graph on screen"),
      u("photo-1551288049-bebda4e38f71", "Graph axes"),
      u("photo-1460925895917-afdab827c52f", "Data graph linear"),
      u("photo-1509228468518-180dd4864904", "Coordinates on board"),
    ],
    "Quadratic Equations": [
      u("photo-1509228468518-180dd4864904", "Quadratic on board"),
      u("photo-1543286386-713bdd548da4", "Parabola curve graph"),
      u("photo-1518932945647-7a1c969f8be2", "Equation grid paper"),
      u("photo-1635070041078-e363dbe005cb", "Scientific calculator"),
    ],
    "Trigonometry": [
      u("photo-1561089489-f13d5e730d72", "Trigonometry triangle"),
      u("photo-1509228468518-180dd4864904", "Trig ratios on board"),
      u("photo-1509728698627-ee41e0f1a5af", "Bridge angles engineering"),
      u("photo-1518932945647-7a1c969f8be2", "Unit circle diagram"),
    ],
  },

  // ── ENGLISH ──────────────────────────────────────────────────────────────────
  english: {
    "Nouns, Verbs and Adjectives": [
      u("photo-1455390582262-044cdead277a", "Writing exercise"),
      u("photo-1481627834876-b7833e8f5570", "Open grammar book"),
      u("photo-1519682337058-a94d519337bc", "Grammar notes"),
      u("photo-1507842217343-583bb7270b66", "Library reference books"),
    ],
    "Sentence Structure and Punctuation": [
      u("photo-1455390582262-044cdead277a", "Handwriting and punctuation"),
      u("photo-1481627834876-b7833e8f5570", "English grammar textbook"),
      u("photo-1516414447565-b14be0adf13e", "Typewriter close-up"),
      u("photo-1519682337058-a94d519337bc", "Writing notebook"),
    ],
    "Descriptive Writing": [
      u("photo-1455390582262-044cdead277a", "Creative writing journal"),
      u("photo-1516414447565-b14be0adf13e", "Vintage typewriter"),
      u("photo-1507842217343-583bb7270b66", "Writing inspiration books"),
      u("photo-1481627834876-b7833e8f5570", "Story writing books"),
    ],
    "Narrative Writing — Story Structure": [
      u("photo-1481627834876-b7833e8f5570", "Storybooks open"),
      u("photo-1455390582262-044cdead277a", "Story planning notes"),
      u("photo-1507842217343-583bb7270b66", "Library narrative books"),
      u("photo-1516414447565-b14be0adf13e", "Typewriter storytelling"),
    ],
    "Persuasive Writing": [
      u("photo-1455390582262-044cdead277a", "Argument essay writing"),
      u("photo-1607013407627-6ee814329547", "Debate and discussion"),
      u("photo-1527689368864-3a821dbccc34", "Newspaper opinion piece"),
      u("photo-1481627834876-b7833e8f5570", "Books on persuasion"),
    ],
    "Reading Comprehension — Inference": [
      u("photo-1481627834876-b7833e8f5570", "Reading books"),
      u("photo-1507842217343-583bb7270b66", "Library reading"),
      u("photo-1512820790803-83ca734da794", "Student reading"),
      u("photo-1455390582262-044cdead277a", "Comprehension notes"),
    ],
    "Poetry — Rhyme and Rhythm": [
      u("photo-1455390582262-044cdead277a", "Poetry notebook"),
      u("photo-1516414447565-b14be0adf13e", "Typewriter poetry"),
      u("photo-1481627834876-b7833e8f5570", "Poetry anthology"),
      u("photo-1507842217343-583bb7270b66", "Verse writing books"),
    ],
    "Shakespeare — Key Themes": [
      u("photo-1580582932707-520aed937b7b", "Globe Theatre"),
      u("photo-1519682337058-a94d519337bc", "Shakespeare play text"),
      u("photo-1503095396549-807759245b35", "Theatre stage"),
      u("photo-1526374965328-7f61d4dc18c5", "Elizabethan artefacts"),
    ],
    "Non-Fiction — Report Writing": [
      u("photo-1455390582262-044cdead277a", "Report writing"),
      u("photo-1527689368864-3a821dbccc34", "Newspaper layout"),
      u("photo-1481627834876-b7833e8f5570", "Non-fiction reference"),
      u("photo-1504868584819-f8e8b4b6d7e3", "Research documents"),
    ],
    "Spoken Language — Debate and Discussion": [
      u("photo-1607013407627-6ee814329547", "Classroom discussion"),
      u("photo-1529156069898-49953e39b3ac", "Students debating"),
      u("photo-1517048676732-d65bc937f952", "Group presentation"),
      u("photo-1503095396549-807759245b35", "Public speaking stage"),
    ],
    "Vocabulary in Context": [
      u("photo-1481627834876-b7833e8f5570", "Dictionary open"),
      u("photo-1455390582262-044cdead277a", "Word notes vocabulary"),
      u("photo-1508243771714-e2de67c56b55", "Vocabulary flashcards"),
      u("photo-1507842217343-583bb7270b66", "Thesaurus and dictionary"),
    ],
    "Figurative Language": [
      u("photo-1455390582262-044cdead277a", "Creative writing figurative"),
      u("photo-1481627834876-b7833e8f5570", "Literature anthology"),
      u("photo-1516414447565-b14be0adf13e", "Poetry typewriter"),
      u("photo-1519682337058-a94d519337bc", "English notes"),
    ],
  },

  // ── SCIENCE (general) ────────────────────────────────────────────────────────
  science: {
    "Cells — Structure and Function": [
      u("photo-1559757148-5c350d0d3c56", "Cell microscope slide"),
      u("photo-1530026405186-ed1f139313f8", "Biology cell model"),
      u("photo-1628595351029-c2bf17511435", "DNA and cells"),
      u("photo-1532187863486-abf9dbad1b69", "Biology laboratory"),
    ],
    "Photosynthesis": [
      u("photo-1518611012118-696072aa579a", "Green leaves in sunlight"),
      u("photo-1448375240586-882707db888b", "Forest canopy light"),
      u("photo-1496412705862-e0088f16f791", "Leaf close-up"),
      u("photo-1542601906897-4264e926a3dc", "Plant cells green"),
    ],
    "The Digestive System": [
      u("photo-1530026405186-ed1f139313f8", "Human anatomy model"),
      u("photo-1532187863486-abf9dbad1b69", "Biology science lab"),
      u("photo-1559757148-5c350d0d3c56", "Microscope biology"),
      u("photo-1576086213369-97a306d36557", "Healthy nutrition food"),
    ],
    "Forces and Motion": [
      u("photo-1635070041409-e64e3a14ef75", "Physics experiment"),
      u("photo-1467533003447-e295ff1b0435", "Forces and movement"),
      u("photo-1561481654-0640d475fcda", "Sports motion forces"),
      u("photo-1446776811953-b23d57bd21aa", "Roller coaster physics"),
    ],
    "Electricity and Circuits": [
      u("photo-1518770660439-4636190af475", "Circuit board"),
      u("photo-1601972602237-96b0c685639f", "Electrical circuit"),
      u("photo-1558618666-fcd25c85cd64", "Electronics workshop"),
      u("photo-1635070041078-e363dbe005cb", "Electronic components"),
    ],
    "The Periodic Table": [
      u("photo-1635241161466-541f065683ba", "Periodic table"),
      u("photo-1603126857599-f6e157fa2fe6", "Chemistry elements"),
      u("photo-1532187863486-abf9dbad1b69", "Chemistry laboratory"),
      u("photo-1556910103-1c02745aae4d", "Chemical elements"),
    ],
    "Chemical Reactions": [
      u("photo-1603126857599-f6e157fa2fe6", "Chemical reaction flask"),
      u("photo-1556910103-1c02745aae4d", "Chemistry experiment"),
      u("photo-1532187863486-abf9dbad1b69", "Lab chemical reaction"),
      u("photo-1635241161466-541f065683ba", "Elements reacting"),
    ],
    "Waves — Light and Sound": [
      u("photo-1502481851512-e9e2529bfbf9", "Light prism refraction"),
      u("photo-1589398512534-a2b6a9c85b5f", "Sound wave visualization"),
      u("photo-1541701494587-cb58502866ab", "Light spectrum waves"),
      u("photo-1614732414444-096e5f1122d5", "Physics wave experiments"),
    ],
    "Genetics and Inheritance": [
      u("photo-1628595351029-c2bf17511435", "DNA double helix"),
      u("photo-1559757148-5c350d0d3c56", "Genetics microscope"),
      u("photo-1532187863486-abf9dbad1b69", "Biology genetics lab"),
      u("photo-1530026405186-ed1f139313f8", "Chromosomes model"),
    ],
    "Ecosystems and Food Chains": [
      u("photo-1441974231531-c6227db76b6e", "Forest ecosystem"),
      u("photo-1418065460487-3e41a6c84dc5", "Wildlife food chain"),
      u("photo-1518611012118-696072aa579a", "Plants ecosystem"),
      u("photo-1501854140801-50d01698950b", "River habitat"),
    ],
    "The Solar System": [
      u("photo-1614732414444-096e5f1122d5", "Solar system planets"),
      u("photo-1446776811953-b23d57bd21aa", "Galaxy night sky"),
      u("photo-1504192010706-dd7f569ee2be", "Earth from space"),
      u("photo-1451187580459-43490279c0fa", "Planet astronomy"),
    ],
    "Acids and Alkalis": [
      u("photo-1603126857599-f6e157fa2fe6", "Acid test flask"),
      u("photo-1532187863486-abf9dbad1b69", "pH chemistry lab"),
      u("photo-1556910103-1c02745aae4d", "Chemical indicators"),
      u("photo-1635241161466-541f065683ba", "Litmus test"),
    ],
  },

  // ── BIOLOGY (bioicons + Unsplash) ─────────────────────────────────────────────
  biology: {
    "Cell Biology": [
      bio("Bacteria/E-coli", "E. coli bacteria", "#dbeafe"),
      bio("Cell-Biology/Eukaryotic-cell", "Eukaryotic cell diagram", "#dcfce7"),
      u("photo-1559757148-5c350d0d3c56", "Microscope cell slide"),
      u("photo-1532187863486-abf9dbad1b69", "Cell biology lab"),
    ],
    "Genetics": [
      bio("Genetics/DNA-Helix", "DNA double helix", "#f3e8ff"),
      bio("Genetics/Chromosome", "Chromosome pair", "#fef3c7"),
      u("photo-1628595351029-c2bf17511435", "DNA strand"),
      u("photo-1559757148-5c350d0d3c56", "Genetics microscope"),
    ],
    "Photosynthesis": [
      bio("Plant-Biology/Leaf", "Leaf structure", "#dcfce7"),
      bio("Plant-Biology/Chloroplast", "Chloroplast organelle", "#d1fae5"),
      u("photo-1518611012118-696072aa579a", "Green plant leaves"),
      u("photo-1448375240586-882707db888b", "Forest photosynthesis"),
    ],
    "Ecology": [
      bio("Ecology/Food-web", "Food web diagram", "#fef9c3"),
      u("photo-1441974231531-c6227db76b6e", "Forest ecosystem"),
      u("photo-1418065460487-3e41a6c84dc5", "Wildlife habitat"),
      u("photo-1501854140801-50d01698950b", "River ecosystem"),
    ],
    "Human Biology": [
      bio("Human-Biology/Heart", "Human heart", "#fee2e2"),
      bio("Human-Biology/Brain", "Brain anatomy", "#ede9fe"),
      u("photo-1530026405186-ed1f139313f8", "Human anatomy"),
      u("photo-1576086213369-97a306d36557", "Healthy human body"),
    ],
    "Microbiology": [
      bio("Microbiology/Virus", "Virus structure", "#fce7f3"),
      bio("Bacteria/Streptococcus", "Bacteria colony", "#dbeafe"),
      u("photo-1559757148-5c350d0d3c56", "Microscope bacteria"),
      u("photo-1532187863486-abf9dbad1b69", "Microbiology lab"),
    ],
    "Evolution": [
      u("photo-1524492412937-b28074a5d7da", "Natural selection"),
      u("photo-1418065460487-3e41a6c84dc5", "Species diversity"),
      u("photo-1559757148-5c350d0d3c56", "Fossil record microscope"),
      u("photo-1441974231531-c6227db76b6e", "Biodiversity"),
    ],
    "Nervous System": [
      bio("Human-Biology/Neuron", "Neuron diagram", "#ede9fe"),
      bio("Neuroscience/Synapse", "Synapse connection", "#f3e8ff"),
      u("photo-1530026405186-ed1f139313f8", "Nervous system model"),
      u("photo-1532187863486-abf9dbad1b69", "Biology brain lab"),
    ],
  },

  // ── CHEMISTRY ────────────────────────────────────────────────────────────────
  chemistry: {
    "Atomic Structure": [
      u("photo-1635241161466-541f065683ba", "Periodic table elements"),
      u("photo-1603126857599-f6e157fa2fe6", "Chemistry atoms lab"),
      u("photo-1532187863486-abf9dbad1b69", "Atomic model display"),
      u("photo-1556910103-1c02745aae4d", "Elements chemistry"),
    ],
    "Bonding": [
      u("photo-1603126857599-f6e157fa2fe6", "Molecular bonding models"),
      u("photo-1532187863486-abf9dbad1b69", "Chemistry bond lab"),
      u("photo-1556910103-1c02745aae4d", "Chemical structures"),
      u("photo-1635241161466-541f065683ba", "Bonding table"),
    ],
    "Organic Chemistry": [
      u("photo-1603126857599-f6e157fa2fe6", "Organic chemistry flask"),
      u("photo-1556910103-1c02745aae4d", "Organic molecule model"),
      u("photo-1532187863486-abf9dbad1b69", "Organic synthesis lab"),
      u("photo-1635241161466-541f065683ba", "Carbon compounds"),
    ],
    "Rates of Reaction": [
      u("photo-1556910103-1c02745aae4d", "Reaction rate experiment"),
      u("photo-1603126857599-f6e157fa2fe6", "Reaction flask bubbling"),
      u("photo-1532187863486-abf9dbad1b69", "Rate experiment lab"),
      u("photo-1635241161466-541f065683ba", "Chemical kinetics"),
    ],
    "Acids, Bases and Salts": [
      u("photo-1603126857599-f6e157fa2fe6", "Acid base neutralisation"),
      u("photo-1532187863486-abf9dbad1b69", "pH testing lab"),
      u("photo-1556910103-1c02745aae4d", "Litmus indicator"),
      u("photo-1635241161466-541f065683ba", "Salt formation"),
    ],
    "Electrolysis": [
      u("photo-1601972602237-96b0c685639f", "Electrolysis circuit"),
      u("photo-1518770660439-4636190af475", "Electrical chemistry"),
      u("photo-1603126857599-f6e157fa2fe6", "Electrolysis beaker"),
      u("photo-1532187863486-abf9dbad1b69", "Electrochemistry lab"),
    ],
  },

  // ── PHYSICS ──────────────────────────────────────────────────────────────────
  physics: {
    "Forces": [
      u("photo-1635070041409-e64e3a14ef75", "Newton's laws experiment"),
      u("photo-1467533003447-e295ff1b0435", "Force measurement"),
      u("photo-1446776811953-b23d57bd21aa", "Gravity physics"),
      u("photo-1561481654-0640d475fcda", "Forces in sport"),
    ],
    "Energy": [
      u("photo-1473341304170-971dccb5ac1e", "Solar energy panels"),
      u("photo-1466611653911-95081537e5b7", "Wind turbine energy"),
      u("photo-1531297484001-80022131f5a1", "Energy conservation"),
      u("photo-1461749280684-dccba630e2f6", "Energy technology"),
    ],
    "Waves": [
      u("photo-1502481851512-e9e2529bfbf9", "Light wave refraction"),
      u("photo-1589398512534-a2b6a9c85b5f", "Sound wave patterns"),
      u("photo-1541701494587-cb58502866ab", "Light spectrum"),
      u("photo-1614732414444-096e5f1122d5", "Wave physics"),
    ],
    "Electricity": [
      u("photo-1518770660439-4636190af475", "Circuit board electricity"),
      u("photo-1601972602237-96b0c685639f", "Electrical wiring"),
      u("photo-1558618666-fcd25c85cd64", "Electronics lab"),
      u("photo-1535378917042-10a22c95931a", "Power station electricity"),
    ],
    "Magnetism": [
      u("photo-1635070041409-e64e3a14ef75", "Magnetic field experiment"),
      u("photo-1518770660439-4636190af475", "Electromagnet circuit"),
      u("photo-1568702846914-96b305d2aaeb", "Compass magnetic"),
      u("photo-1601972602237-96b0c685639f", "Electric motor magnetism"),
    ],
    "Radioactivity": [
      u("photo-1614732414444-096e5f1122d5", "Nuclear physics"),
      u("photo-1635070041409-e64e3a14ef75", "Physics radiation lab"),
      u("photo-1532187863486-abf9dbad1b69", "Nuclear science"),
      u("photo-1446776811953-b23d57bd21aa", "Radiation astronomy"),
    ],
    "Space Physics": [
      u("photo-1614732414444-096e5f1122d5", "Solar system"),
      u("photo-1446776811953-b23d57bd21aa", "Galaxy and stars"),
      u("photo-1504192010706-dd7f569ee2be", "Earth orbit"),
      u("photo-1451187580459-43490279c0fa", "Planet telescope"),
    ],
  },

  // ── HISTORY ──────────────────────────────────────────────────────────────────
  history: {
    "The Romans in Britain": [
      u("photo-1555993539-1732b0258235", "Roman ruins"),
      u("photo-1524661135-423995f22d0b", "Ancient Roman map"),
      u("photo-1589828994425-c25e5619ce24", "Roman amphitheatre"),
      u("photo-1526374965328-7f61d4dc18c5", "Roman artefacts museum"),
    ],
    "The Anglo-Saxons": [
      u("photo-1526374965328-7f61d4dc18c5", "Anglo-Saxon artefacts"),
      u("photo-1589828994425-c25e5619ce24", "Medieval England"),
      u("photo-1524661135-423995f22d0b", "Historical manuscript"),
      u("photo-1555993539-1732b0258235", "Saxon ruins"),
    ],
    "The Norman Conquest": [
      u("photo-1589828994425-c25e5619ce24", "Norman castle"),
      u("photo-1526374965328-7f61d4dc18c5", "Battle of Hastings artefacts"),
      u("photo-1555993539-1732b0258235", "Norman fortress"),
      u("photo-1524661135-423995f22d0b", "Bayeux tapestry style"),
    ],
    "The Black Death": [
      u("photo-1526374965328-7f61d4dc18c5", "Medieval history artefacts"),
      u("photo-1589828994425-c25e5619ce24", "Medieval town"),
      u("photo-1524661135-423995f22d0b", "Historical manuscript"),
      u("photo-1555993539-1732b0258235", "Medieval church"),
    ],
    "The English Reformation": [
      u("photo-1548690312-e3b507d8c110", "Historic church"),
      u("photo-1526374965328-7f61d4dc18c5", "Reformation artefacts"),
      u("photo-1589828994425-c25e5619ce24", "Tudor architecture"),
      u("photo-1524661135-423995f22d0b", "Religious manuscripts"),
    ],
    "The British Empire": [
      u("photo-1524661135-423995f22d0b", "Empire era map"),
      u("photo-1526374965328-7f61d4dc18c5", "Colonial era objects"),
      u("photo-1555993539-1732b0258235", "Empire architecture"),
      u("photo-1589828994425-c25e5619ce24", "Historical harbour"),
    ],
    "World War One": [
      u("photo-1508361001413-7a9dca21d08a", "WWI war memorial"),
      u("photo-1526374965328-7f61d4dc18c5", "World War One artefacts"),
      u("photo-1524661135-423995f22d0b", "Trench warfare map"),
      u("photo-1555993539-1732b0258235", "War memorial site"),
    ],
    "World War Two": [
      u("photo-1508361001413-7a9dca21d08a", "WWII memorial"),
      u("photo-1526374965328-7f61d4dc18c5", "World War Two museum"),
      u("photo-1524661135-423995f22d0b", "1940s Europe map"),
      u("photo-1555993539-1732b0258235", "War history monument"),
    ],
    "The Cold War": [
      u("photo-1524661135-423995f22d0b", "Cold War era map"),
      u("photo-1526374965328-7f61d4dc18c5", "Cold War exhibits"),
      u("photo-1446776811953-b23d57bd21aa", "Space race sputnik era"),
      u("photo-1555993539-1732b0258235", "Berlin Wall memorial"),
    ],
    "The Civil Rights Movement": [
      u("photo-1529156069898-49953e39b3ac", "Civil rights march"),
      u("photo-1607013407627-6ee814329547", "Rights protest gathering"),
      u("photo-1526374965328-7f61d4dc18c5", "Civil rights museum"),
      u("photo-1524661135-423995f22d0b", "Historical timeline"),
    ],
    "The Holocaust": [
      u("photo-1526374965328-7f61d4dc18c5", "Holocaust memorial museum"),
      u("photo-1508361001413-7a9dca21d08a", "Memorial site"),
      u("photo-1555993539-1732b0258235", "Historical memorial"),
      u("photo-1524661135-423995f22d0b", "World War map Europe"),
    ],
  },

  // ── GEOGRAPHY ────────────────────────────────────────────────────────────────
  geography: {
    "Map Skills and Ordnance Survey": [
      u("photo-1524661135-423995f22d0b", "Topographic map"),
      u("photo-1476973422084-e0fa66ff9456", "Map and compass navigation"),
      u("photo-1451187580459-43490279c0fa", "Satellite map view"),
      u("photo-1476973422084-e0fa66ff9456", "OS map reading"),
    ],
    "Physical Landscapes — Rivers": [
      u("photo-1501854140801-50d01698950b", "River valley"),
      u("photo-1546587348-d12660c30c50", "Waterfall river"),
      u("photo-1440342359743-84fcb8c21f21", "Meandering river"),
      u("photo-1432405972618-c60b0225b8f9", "River delta"),
    ],
    "Physical Landscapes — Coasts": [
      u("photo-1505118380757-91f5f5632de0", "Coastal cliffs erosion"),
      u("photo-1507525428034-b723cf961d3e", "Sandy beach coast"),
      u("photo-1519046904884-53103b34b206", "Coastal waves"),
      u("photo-1425065589852-992399773baa", "Coastline erosion"),
    ],
    "Tectonic Hazards — Earthquakes and Volcanoes": [
      u("photo-1517590649191-e4a23fd7d5aa", "Volcanic eruption"),
      u("photo-1558618047-3c9e6e4c7a9b", "Earthquake damage"),
      u("photo-1519010470956-6d877008eaa4", "Lava flow volcano"),
      u("photo-1524661135-423995f22d0b", "Tectonic plates map"),
    ],
    "Climate and Weather": [
      u("photo-1504608524841-42785f1e5a73", "Weather storm clouds"),
      u("photo-1504270997636-07ddfbd48945", "Climate data chart"),
      u("photo-1530432897838-37eeaa47a3c0", "Sunshine weather"),
      u("photo-1510915228340-29c85a43dcfe", "Frost weather"),
    ],
    "Climate Change": [
      u("photo-1470770841072-f978cf4d019e", "Melting glacier"),
      u("photo-1466611653911-95081537e5b7", "Wind turbines climate"),
      u("photo-1504608524841-42785f1e5a73", "Extreme weather"),
      u("photo-1446776858070-70c3d5ed6758", "Earth from space warming"),
    ],
    "Urban Issues — Cities": [
      u("photo-1477959858617-67f85cf4f1df", "City skyline urban"),
      u("photo-1486325212027-8081e485255e", "Urban development"),
      u("photo-1444723121867-7a241cacace9", "City streets"),
      u("photo-1449824913935-59a10b8d2000", "Urban housing"),
    ],
    "Development and Inequality": [
      u("photo-1529156069898-49953e39b3ac", "Community development"),
      u("photo-1488521787991-ed7bbaae773c", "Rural development"),
      u("photo-1524492412937-b28074a5d7da", "Global inequality"),
      u("photo-1532375810709-75b1da00537c", "Economic development"),
    ],
    "Glaciation": [
      u("photo-1470770841072-f978cf4d019e", "Glacier landscape"),
      u("photo-1503614472-8c93d56e92ce", "Ice field glacier"),
      u("photo-1507003211169-0a1dd7228f2d", "Arctic glacier"),
      u("photo-1494783367193-149034c05e8f", "Glacial valley"),
    ],
    "Ecosystems — Rainforests and Deserts": [
      u("photo-1448375240586-882707db888b", "Tropical rainforest"),
      u("photo-1509316785289-025f5b846b35", "Desert landscape"),
      u("photo-1441974231531-c6227db76b6e", "Dense jungle ecosystem"),
      u("photo-1508739773434-c26b3d09e071", "Savanna ecosystem"),
    ],
  },

  // ── COMPUTING ────────────────────────────────────────────────────────────────
  computing: {
    "Algorithms and Flowcharts": [
      u("photo-1461749280684-dccba630e2f6", "Flowchart coding"),
      u("photo-1517694712202-14dd9538aa97", "Algorithm programming"),
      u("photo-1552664730-d307ca884978", "Whiteboard algorithm"),
      u("photo-1518770660439-4636190af475", "Logic circuit"),
    ],
    "Binary and Number Systems": [
      u("photo-1518932945647-7a1c969f8be2", "Binary code screen"),
      u("photo-1461749280684-dccba630e2f6", "Binary numbers code"),
      u("photo-1518770660439-4636190af475", "Circuit binary"),
      u("photo-1517694712202-14dd9538aa97", "Computer number system"),
    ],
    "Programming — Variables and Loops": [
      u("photo-1461749280684-dccba630e2f6", "Programming code screen"),
      u("photo-1517694712202-14dd9538aa97", "Coding laptop"),
      u("photo-1552664730-d307ca884978", "Code on whiteboard"),
      u("photo-1607799279861-4dd421887fb3", "Python programming"),
    ],
    "Databases": [
      u("photo-1558494949-ef010cbdcc31", "Database server"),
      u("photo-1504868584819-f8e8b4b6d7e3", "Data management"),
      u("photo-1460925895917-afdab827c52f", "Database design"),
      u("photo-1461749280684-dccba630e2f6", "SQL database code"),
    ],
    "Networks and the Internet": [
      u("photo-1558494949-ef010cbdcc31", "Network cables router"),
      u("photo-1581091226825-a6a2a5aee158", "Internet connection"),
      u("photo-1487058792275-0ad4aaf24ca7", "Network infrastructure"),
      u("photo-1451187580459-43490279c0fa", "Global internet satellite"),
    ],
    "Cybersecurity": [
      u("photo-1614064641938-3bbee52942c7", "Cybersecurity lock"),
      u("photo-1558618666-fcd25c85cd64", "Security technology"),
      u("photo-1504868584819-f8e8b4b6d7e3", "Data security"),
      u("photo-1487058792275-0ad4aaf24ca7", "Network security"),
    ],
    "Artificial Intelligence": [
      u("photo-1535378917042-10a22c95931a", "AI technology"),
      u("photo-1677442136019-21780ecad995", "Machine learning AI"),
      u("photo-1535378917042-10a22c95931a", "Robot AI"),
      u("photo-1461749280684-dccba630e2f6", "AI programming"),
    ],
    "Web Development — HTML and CSS": [
      u("photo-1461749280684-dccba630e2f6", "HTML coding screen"),
      u("photo-1517694712202-14dd9538aa97", "Web development laptop"),
      u("photo-1607799279861-4dd421887fb3", "CSS web design"),
      u("photo-1582213782179-e0d53f98f2ca", "Web page design"),
    ],
  },

  // ── PSHE ─────────────────────────────────────────────────────────────────────
  pshe: {
    "Mental Health and Wellbeing": [
      u("photo-1582213782179-e0d53f98f2ca", "Mental health wellbeing"),
      u("photo-1544717305-2782549b5136", "Mindfulness meditation"),
      u("photo-1529156069898-49953e39b3ac", "Young people talking"),
      u("photo-1560439513-74b037a25d84", "Healthy lifestyle wellbeing"),
    ],
    "Healthy Relationships": [
      u("photo-1529156069898-49953e39b3ac", "Positive relationships"),
      u("photo-1517048676732-d65bc937f952", "Teamwork support"),
      u("photo-1544717305-2782549b5136", "Friendship wellbeing"),
      u("photo-1607013407627-6ee814329547", "Respectful communication"),
    ],
    "Online Safety and Cyberbullying": [
      u("photo-1614064641938-3bbee52942c7", "Online safety"),
      u("photo-1517694712202-14dd9538aa97", "Smartphone online"),
      u("photo-1461749280684-dccba630e2f6", "Internet safety"),
      u("photo-1504868584819-f8e8b4b6d7e3", "Digital citizenship"),
    ],
    "Equality and Diversity": [
      u("photo-1529156069898-49953e39b3ac", "Diverse community"),
      u("photo-1607013407627-6ee814329547", "Inclusion diversity"),
      u("photo-1517048676732-d65bc937f952", "Equality team"),
      u("photo-1503023345310-bd7c1de61c7d", "World diversity"),
    ],
    "Careers and Aspirations": [
      u("photo-1507003211169-0a1dd7228f2d", "Career aspirations"),
      u("photo-1454165804606-c3d57bc86b40", "Professional career"),
      u("photo-1517048676732-d65bc937f952", "Work environment"),
      u("photo-1508739773434-c26b3d09e071", "Future goals"),
    ],
    "Healthy Eating and Nutrition": [
      u("photo-1576086213369-97a306d36557", "Healthy food nutrition"),
      u("photo-1490645935967-10de6ba17061", "Balanced diet"),
      u("photo-1498837167922-ddd27525d352", "Fresh vegetables"),
      u("photo-1512621776951-a57141f2eefd", "Nutritious meal"),
    ],
    "Drugs and Alcohol Awareness": [
      u("photo-1560439513-74b037a25d84", "Health awareness"),
      u("photo-1582213782179-e0d53f98f2ca", "Health education"),
      u("photo-1544717305-2782549b5136", "Wellbeing choices"),
      u("photo-1529156069898-49953e39b3ac", "Youth health education"),
    ],
    "Democracy and Citizenship": [
      u("photo-1529156069898-49953e39b3ac", "Democratic participation"),
      u("photo-1503023345310-bd7c1de61c7d", "Global citizenship"),
      u("photo-1607013407627-6ee814329547", "Community democracy"),
      u("photo-1524661135-423995f22d0b", "World citizenship map"),
    ],
  },

  // ── PE ────────────────────────────────────────────────────────────────────────
  pe: {
    "Athletics and Running": [
      u("photo-1476480862126-209bfaa8edc8", "Running athletics"),
      u("photo-1461896836934-ffe607ba8211", "Athletic track sprinting"),
      u("photo-1530549387789-4c1017266635", "Marathon running"),
      u("photo-1571902943202-507ec2618e8f", "Training exercise"),
    ],
    "Team Sports": [
      u("photo-1530549387789-4c1017266635", "Team sports match"),
      u("photo-1459865264687-595d652de67e", "Football team sport"),
      u("photo-1461896836934-ffe607ba8211", "Sports competition"),
      u("photo-1571902943202-507ec2618e8f", "Team training"),
    ],
    "Gymnastics": [
      u("photo-1571902943202-507ec2618e8f", "Gymnastics training"),
      u("photo-1461896836934-ffe607ba8211", "Gymnastics competition"),
      u("photo-1476480862126-209bfaa8edc8", "Flexible gymnastics"),
      u("photo-1530549387789-4c1017266635", "Balance gymnastics"),
    ],
    "Swimming": [
      u("photo-1530549387789-4c1017266635", "Swimming pool sport"),
      u("photo-1559822130-50d3b8037f7e", "Swimmer racing"),
      u("photo-1519315901367-f34ff9154487", "Swimming technique"),
      u("photo-1486325212027-8081e485255e", "Pool swimming"),
    ],
    "Health and Fitness": [
      u("photo-1571902943202-507ec2618e8f", "Gym fitness"),
      u("photo-1476480862126-209bfaa8edc8", "Running fitness"),
      u("photo-1544367567-0f2fcb009e0b", "Yoga fitness"),
      u("photo-1530549387789-4c1017266635", "Sports health"),
    ],
  },

  // ── ART ──────────────────────────────────────────────────────────────────────
  art: {
    "Drawing and Sketching": [
      u("photo-1513364776144-60967b0f800f", "Artist sketching"),
      u("photo-1460661419201-fd4cecdf8a8b", "Pencil drawing"),
      u("photo-1579783902614-a3fb3927b6a5", "Sketch pad pencils"),
      u("photo-1541178735493-479c1a27ed24", "Portrait drawing"),
    ],
    "Painting": [
      u("photo-1513364776144-60967b0f800f", "Painting on canvas"),
      u("photo-1460661419201-fd4cecdf8a8b", "Colourful paints"),
      u("photo-1547826039-bfc35e0f1ea8", "Watercolour painting"),
      u("photo-1605721911519-3dfeb3be25e7", "Art gallery painting"),
    ],
    "Typography and Graphic Design": [
      u("photo-1611532736597-de2d4265fba3", "Typography design"),
      u("photo-1524661135-423995f22d0b", "Graphic design layout"),
      u("photo-1561070791-2526d30994b5", "Design typography"),
      u("photo-1581291518857-4e27b48ff24e", "Branding design"),
    ],
    "Sculpture and 3D": [
      u("photo-1605721911519-3dfeb3be25e7", "Sculpture gallery"),
      u("photo-1513364776144-60967b0f800f", "3D art sculpting"),
      u("photo-1526374965328-7f61d4dc18c5", "Art museum sculpture"),
      u("photo-1555993539-1732b0258235", "Classical sculpture"),
    ],
    "Art History": [
      u("photo-1605721911519-3dfeb3be25e7", "Art history gallery"),
      u("photo-1526374965328-7f61d4dc18c5", "Museum art history"),
      u("photo-1555993539-1732b0258235", "Classical art"),
      u("photo-1460661419201-fd4cecdf8a8b", "Historic artwork"),
    ],
  },

  // ── MUSIC ────────────────────────────────────────────────────────────────────
  music: {
    "Music Theory — Notes and Rhythm": [
      u("photo-1507838153414-b4b713384a76", "Sheet music notes"),
      u("photo-1511671782779-c97d3d27a1d4", "Piano keys music"),
      u("photo-1520523839897-bd0b52f945a0", "Musical score"),
      u("photo-1470225620780-dba8ba36b745", "Music rhythm notation"),
    ],
    "Instruments": [
      u("photo-1514320291840-2e0a9bf2a9ae", "Guitar instrument"),
      u("photo-1511671782779-c97d3d27a1d4", "Piano keys"),
      u("photo-1493225457124-a3eb161ffa5f", "Drum kit"),
      u("photo-1465847899084-d164df4dedc6", "Violin strings"),
    ],
    "Composition and Songwriting": [
      u("photo-1507838153414-b4b713384a76", "Music composition"),
      u("photo-1516414447565-b14be0adf13e", "Songwriting"),
      u("photo-1511671782779-c97d3d27a1d4", "Piano composing"),
      u("photo-1520523839897-bd0b52f945a0", "Music score writing"),
    ],
    "Music History — Classical to Modern": [
      u("photo-1507838153414-b4b713384a76", "Classical music score"),
      u("photo-1605721911519-3dfeb3be25e7", "Concert hall music"),
      u("photo-1465847899084-d164df4dedc6", "Orchestra classical"),
      u("photo-1470225620780-dba8ba36b745", "Music history"),
    ],
  },

  // ── RE ────────────────────────────────────────────────────────────────────────
  re: {
    "Christianity": [
      u("photo-1548690312-e3b507d8c110", "Christian church"),
      u("photo-1513128034602-7814ccaddd4e", "Bible holy book"),
      u("photo-1553527922-571aef0a3afe", "Cross and candles"),
      u("photo-1609600990353-ae9c6e7b8a8c", "Church architecture"),
    ],
    "Islam": [
      u("photo-1564769610726-59cde7f61c6b", "Mosque architecture"),
      u("photo-1513128034602-7814ccaddd4e", "Holy book Quran"),
      u("photo-1548690312-e3b507d8c110", "Place of prayer"),
      u("photo-1553527922-571aef0a3afe", "Islamic prayer"),
    ],
    "Judaism": [
      u("photo-1548690312-e3b507d8c110", "Synagogue"),
      u("photo-1513128034602-7814ccaddd4e", "Torah scroll"),
      u("photo-1553527922-571aef0a3afe", "Menorah candles"),
      u("photo-1524492412937-b28074a5d7da", "Jewish symbols"),
    ],
    "Hinduism": [
      u("photo-1524492412937-b28074a5d7da", "Hindu temple"),
      u("photo-1513128034602-7814ccaddd4e", "Hindu scripture"),
      u("photo-1553527922-571aef0a3afe", "Diwali candles"),
      u("photo-1548690312-e3b507d8c110", "Temple worship"),
    ],
    "Buddhism": [
      u("photo-1528360983277-13d401cdc186", "Buddhist temple"),
      u("photo-1544717305-2782549b5136", "Meditation Buddhism"),
      u("photo-1553527922-571aef0a3afe", "Buddha statue"),
      u("photo-1513128034602-7814ccaddd4e", "Buddhist texts"),
    ],
    "Ethics and Moral Philosophy": [
      u("photo-1529156069898-49953e39b3ac", "Ethics discussion"),
      u("photo-1607013407627-6ee814329547", "Moral debate"),
      u("photo-1455390582262-044cdead277a", "Philosophy writing"),
      u("photo-1507842217343-583bb7270b66", "Ethics philosophy books"),
    ],
  },

  // ── MFL ──────────────────────────────────────────────────────────────────────
  mfl: {
    "Greetings and Introductions": [
      u("photo-1503023345310-bd7c1de61c7d", "International languages"),
      u("photo-1414235077428-338989a2e8c0", "European travel greeting"),
      u("photo-1508739773434-c26b3d09e071", "Language learning"),
      u("photo-1546410531-bb4caa6b424d", "Language books French"),
    ],
    "Family and Home": [
      u("photo-1529156069898-49953e39b3ac", "Family home"),
      u("photo-1449824913935-59a10b8d2000", "House home building"),
      u("photo-1414235077428-338989a2e8c0", "European family culture"),
      u("photo-1546410531-bb4caa6b424d", "Language study home"),
    ],
    "School and Education": [
      u("photo-1546410531-bb4caa6b424d", "School language learning"),
      u("photo-1481627834876-b7833e8f5570", "School books languages"),
      u("photo-1503023345310-bd7c1de61c7d", "Language education"),
      u("photo-1455390582262-044cdead277a", "Language writing"),
    ],
    "Travel and Tourism": [
      u("photo-1414235077428-338989a2e8c0", "European travel"),
      u("photo-1524661135-423995f22d0b", "Travel map"),
      u("photo-1503023345310-bd7c1de61c7d", "World travel flags"),
      u("photo-1476973422084-e0fa66ff9456", "Tourism navigation"),
    ],
    "Food and Drink": [
      u("photo-1414235077428-338989a2e8c0", "European cuisine"),
      u("photo-1576086213369-97a306d36557", "International food"),
      u("photo-1498837167922-ddd27525d352", "French cuisine"),
      u("photo-1512621776951-a57141f2eefd", "Spanish food"),
    ],
    "Environment and Global Issues": [
      u("photo-1470770841072-f978cf4d019e", "Global environment"),
      u("photo-1446776858070-70c3d5ed6758", "Earth global"),
      u("photo-1524661135-423995f22d0b", "World issues map"),
      u("photo-1466611653911-95081537e5b7", "Sustainability energy"),
    ],
  },

  // ── DT ────────────────────────────────────────────────────────────────────────
  dt: {
    "Design Process": [
      u("photo-1581091226825-a6a2a5aee158", "Design process sketch"),
      u("photo-1504328345606-18bbc8c9d7d1", "Engineering design"),
      u("photo-1558618047-3c9e6e4c7a9b", "Product design"),
      u("photo-1565793298595-6a879b1d9492", "Design prototyping"),
    ],
    "Materials and Manufacturing": [
      u("photo-1504328345606-18bbc8c9d7d1", "Workshop materials"),
      u("photo-1558618666-fcd25c85cd64", "Manufacturing tools"),
      u("photo-1565793298595-6a879b1d9492", "3D printing materials"),
      u("photo-1581091226825-a6a2a5aee158", "Material properties"),
    ],
    "Electronics and Control Systems": [
      u("photo-1518770660439-4636190af475", "Electronics circuit"),
      u("photo-1558618666-fcd25c85cd64", "Control systems wiring"),
      u("photo-1601972602237-96b0c685639f", "Electronic components"),
      u("photo-1565793298595-6a879b1d9492", "Robotics control"),
    ],
    "Food Technology": [
      u("photo-1576086213369-97a306d36557", "Food technology cooking"),
      u("photo-1498837167922-ddd27525d352", "Nutrition food science"),
      u("photo-1490645935967-10de6ba17061", "Food preparation"),
      u("photo-1512621776951-a57141f2eefd", "Food product design"),
    ],
    "Textiles": [
      u("photo-1558618047-3c9e6e4c7a9b", "Textile design fabric"),
      u("photo-1547826039-bfc35e0f1ea8", "Fabric craft"),
      u("photo-1513364776144-60967b0f800f", "Fashion textile design"),
      u("photo-1581291518857-4e27b48ff24e", "Textile pattern"),
    ],
  },

  // ── BUSINESS ─────────────────────────────────────────────────────────────────
  business: {
    "Business Ownership and Structures": [
      u("photo-1454165804606-c3d57bc86b40", "Business meeting"),
      u("photo-1507003211169-0a1dd7228f2d", "Business owner"),
      u("photo-1559526324-4b87b5e36e44", "Company structure"),
      u("photo-1553729459-efe14ef6055d", "Business branding"),
    ],
    "Marketing and the Marketing Mix": [
      u("photo-1553729459-efe14ef6055d", "Marketing campaign"),
      u("photo-1557804506-669a67965ba0", "Marketing team"),
      u("photo-1559526324-4b87b5e36e44", "Marketing data"),
      u("photo-1581291518857-4e27b48ff24e", "Brand marketing"),
    ],
    "Finance and Budgeting": [
      u("photo-1559526324-4b87b5e36e44", "Finance charts"),
      u("photo-1454165804606-c3d57bc86b40", "Financial meeting"),
      u("photo-1551288049-bebda4e38f71", "Budget spreadsheet"),
      u("photo-1507003211169-0a1dd7228f2d", "Business finance"),
    ],
    "Human Resources": [
      u("photo-1517048676732-d65bc937f952", "HR team people"),
      u("photo-1454165804606-c3d57bc86b40", "Recruitment HR"),
      u("photo-1507003211169-0a1dd7228f2d", "Workforce management"),
      u("photo-1529156069898-49953e39b3ac", "Team people HR"),
    ],
    "Entrepreneurship": [
      u("photo-1507003211169-0a1dd7228f2d", "Entrepreneur startup"),
      u("photo-1454165804606-c3d57bc86b40", "Business startup"),
      u("photo-1559526324-4b87b5e36e44", "Startup growth"),
      u("photo-1553729459-efe14ef6055d", "Entrepreneurship brand"),
    ],
    "Supply and Demand": [
      u("photo-1551288049-bebda4e38f71", "Supply demand chart"),
      u("photo-1543286386-713bdd548da4", "Economics graph"),
      u("photo-1460925895917-afdab827c52f", "Market data"),
      u("photo-1559526324-4b87b5e36e44", "Business economics"),
    ],
  },

  // ── DRAMA ────────────────────────────────────────────────────────────────────
  drama: {
    "Physical Theatre": [
      u("photo-1503095396549-807759245b35", "Physical theatre stage"),
      u("photo-1460723237483-7a6dc9d0b212", "Physical performance"),
      u("photo-1516450360452-9312f5e86fc7", "Spotlight performance"),
      u("photo-1536440136628-849c177e76a1", "Theatre drama"),
    ],
    "Devising Theatre": [
      u("photo-1503095396549-807759245b35", "Theatre rehearsal"),
      u("photo-1460723237483-7a6dc9d0b212", "Drama devising"),
      u("photo-1517048676732-d65bc937f952", "Group theatre devising"),
      u("photo-1536440136628-849c177e76a1", "Stage devising"),
    ],
    "Shakespeare in Performance": [
      u("photo-1580582932707-520aed937b7b", "Shakespeare Globe Theatre"),
      u("photo-1503095396549-807759245b35", "Shakespeare performance"),
      u("photo-1516450360452-9312f5e86fc7", "Classical theatre"),
      u("photo-1460723237483-7a6dc9d0b212", "Dramatic performance"),
    ],
    "Script and Playscript Writing": [
      u("photo-1455390582262-044cdead277a", "Script writing"),
      u("photo-1481627834876-b7833e8f5570", "Play script books"),
      u("photo-1516414447565-b14be0adf13e", "Typing script"),
      u("photo-1503095396549-807759245b35", "Drama script"),
    ],
  },
};

// ── Public API ────────────────────────────────────────────────────────────────

/** Get all images for a subject+topic. Falls back to subject defaults. */
export function getTopicImages(subject: string, topic: string): TopicImage[] {
  const subjectImages = TOPIC_IMAGES[subject];
  if (subjectImages) {
    // Try exact match first
    if (subjectImages[topic]) return subjectImages[topic];
    // Try partial match (topic contains)
    const partialKey = Object.keys(subjectImages).find(k =>
      topic.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(topic.toLowerCase())
    );
    if (partialKey) return subjectImages[partialKey];
  }
  // Fall back to subject defaults
  return SUBJECT_FALLBACKS[subject] || SUBJECT_FALLBACKS["science"];
}

/** Get count of images for a topic */
export function getTopicImageCount(subject: string, topic: string): number {
  return getTopicImages(subject, topic).length;
}

// ── localStorage persistence ──────────────────────────────────────────────────
const STORAGE_KEY_PREFIX = "adaptly_topic_img_";

function storageKey(subject: string, topic: string): string {
  return `${STORAGE_KEY_PREFIX}${subject}__${topic.slice(0, 40).replace(/\s/g, "_")}`;
}

export function getTopicVariant(subject: string, topic: string): number {
  try {
    const v = localStorage.getItem(storageKey(subject, topic));
    return v ? parseInt(v, 10) : 0;
  } catch { return 0; }
}

export function setTopicVariant(subject: string, topic: string, index: number): void {
  try {
    localStorage.setItem(storageKey(subject, topic), String(index));
  } catch {}
}

export function nextTopicVariant(subject: string, topic: string): number {
  const images = getTopicImages(subject, topic);
  const current = getTopicVariant(subject, topic);
  const next = (current + 1) % images.length;
  setTopicVariant(subject, topic, next);
  return next;
}

export function prevTopicVariant(subject: string, topic: string): number {
  const images = getTopicImages(subject, topic);
  const current = getTopicVariant(subject, topic);
  const prev = (current - 1 + images.length) % images.length;
  setTopicVariant(subject, topic, prev);
  return prev;
}

// Legacy SVG compat exports (used by old code)
export const SUBJECT_VISUALS: Record<string, { bg: string; tint: string; fg: string; motif: string; emoji: string }> = {
  mathematics: { bg: "#1e40af", tint: "#3b82f6", fg: "#ffffff", motif: "M10 50 Q30 10 50 50 Q70 90 90 50", emoji: "📐" },
  english:     { bg: "#7c3aed", tint: "#a78bfa", fg: "#ffffff", motif: "M10 30 Q50 10 90 30 M10 60 Q50 80 90 60", emoji: "📚" },
  science:     { bg: "#065f46", tint: "#34d399", fg: "#ffffff", motif: "M50 10 L90 80 L10 80 Z", emoji: "🔬" },
  biology:     { bg: "#14532d", tint: "#86efac", fg: "#ffffff", motif: "M30 50 Q50 10 70 50 Q50 90 30 50", emoji: "🧬" },
  chemistry:   { bg: "#7c2d12", tint: "#fb923c", fg: "#ffffff", motif: "M20 20 L80 20 L80 80 L20 80 Z", emoji: "⚗️" },
  physics:     { bg: "#1e3a5f", tint: "#60a5fa", fg: "#ffffff", motif: "M10 50 L90 50 M50 10 L50 90", emoji: "⚡" },
  history:     { bg: "#78350f", tint: "#fbbf24", fg: "#ffffff", motif: "M10 80 Q50 10 90 80", emoji: "🏛️" },
  geography:   { bg: "#064e3b", tint: "#6ee7b7", fg: "#ffffff", motif: "M20 50 Q50 20 80 50 Q50 80 20 50", emoji: "🌍" },
  computing:   { bg: "#1e1b4b", tint: "#818cf8", fg: "#ffffff", motif: "M10 30 L50 10 L90 30 L90 70 L50 90 L10 70 Z", emoji: "💻" },
  art:         { bg: "#831843", tint: "#f472b6", fg: "#ffffff", motif: "M30 20 Q70 10 80 50 Q70 90 30 80 Q10 50 30 20", emoji: "🎨" },
  music:       { bg: "#4c1d95", tint: "#c4b5fd", fg: "#ffffff", motif: "M10 20 L10 80 M30 30 L30 80 M50 10 L50 80", emoji: "🎵" },
  pe:          { bg: "#14532d", tint: "#4ade80", fg: "#ffffff", motif: "M50 10 L90 70 L10 70 Z", emoji: "⚽" },
  pshe:        { bg: "#7f1d1d", tint: "#fca5a5", fg: "#ffffff", motif: "M50 20 Q70 10 70 30 Q70 50 50 50 Q30 50 30 30 Q30 10 50 20", emoji: "💛" },
  re:          { bg: "#312e81", tint: "#a5b4fc", fg: "#ffffff", motif: "M50 10 L50 90 M10 50 L90 50", emoji: "✨" },
  mfl:         { bg: "#134e4a", tint: "#5eead4", fg: "#ffffff", motif: "M10 40 Q50 10 90 40 Q50 70 10 40", emoji: "🌐" },
  dt:          { bg: "#1c1917", tint: "#a8a29e", fg: "#ffffff", motif: "M10 10 L90 10 L90 90 L10 90 Z M30 30 L70 30 L70 70 L30 70 Z", emoji: "🔧" },
  business:    { bg: "#1e3a5f", tint: "#93c5fd", fg: "#ffffff", motif: "M10 80 L10 40 L30 40 L30 60 L50 20 L50 60 L70 30 L70 80", emoji: "📊" },
  drama:       { bg: "#581c87", tint: "#d8b4fe", fg: "#ffffff", motif: "M20 30 Q50 10 80 30 L80 70 Q50 90 20 70 Z", emoji: "🎭" },
};

export const TOPIC_ACCENT: Record<string, string> = {};
export const VARIANT_LABELS = ["Photo 1", "Photo 2", "Photo 3", "Photo 4"];
