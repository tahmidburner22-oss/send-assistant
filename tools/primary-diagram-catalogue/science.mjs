/**
 * Science — primary diagram catalogue (Y1–Y6).
 * Target: ~330 entries.
 */
import { emitTitled } from "./_helpers.mjs";

export function build(ctx) {
  // ── Plants — flowers, trees, plant parts ──────────────────────────────────
  const FLOWERS = [
    "rose", "daisy", "sunflower", "daffodil", "tulip", "dandelion", "buttercup",
    "bluebell", "poppy", "lavender", "lily", "pansy", "geranium", "hyacinth",
    "snapdragon",
  ];
  for (const f of FLOWERS) {
    ctx.add({
      title: `Plant card — ${f}`,
      subject: "Biology",
      topic: "Plants",
      year_group: "Year 1",
      description: `Single ${f} drawn with stem, leaves and clearly visible flower head; common name printed underneath.`,
      style_notes: "Botanical-style line drawing with soft fill, white background",
      tags: ["plants", "flower", "KS1", f],
    });
  }
  const TREES = [
    "oak", "ash", "elm", "beech", "sycamore", "willow", "silver birch",
    "Scots pine", "spruce", "fir", "holly", "horse chestnut", "hazel", "rowan", "yew",
  ];
  for (const t of TREES) {
    ctx.add({
      title: `Tree card — ${t}`,
      subject: "Biology",
      topic: "Plants",
      year_group: "Year 2",
      description: `Whole tree silhouette plus a leaf detail and (where relevant) seed/fruit, all labelled.`,
      style_notes: "Soft-shaded silhouette with leaf inset and label call-outs",
      tags: ["plants", "tree", "leaf-id", "KS1", t.replace(" ", "-")],
    });
  }
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Plants",
    year_group: "Year 3",
    description: "Cross-section of a flowering plant with petal, stamen, stigma, anther, filament, sepal, ovary, ovule, stem, leaf, root labelled.",
    style_notes: "Cutaway view, label lines colour-matched to part categories",
    tags: ["plant-anatomy", "flowering-plant"],
  }, [
    "Plant parts — full diagram (petal/stem/leaf/root)",
    "Flower parts — labelled cross-section",
    "Pollination diagram — bee on flower",
    "Seed dispersal — wind, animal, water, explosion (4 panels)",
    "Plant life cycle — seed → seedling → plant → flower → seed",
    "Photosynthesis word equation poster",
    "What plants need — Sun / water / air / soil chart",
    "Stem cross-section showing xylem and phloem (Y6)",
  ]);

  // ── Animals — UK garden, pets, farm, exotic ──────────────────────────────
  const UK_ANIMALS = [
    "robin", "blackbird", "house sparrow", "blue tit", "hedgehog", "red fox",
    "badger", "grey squirrel", "wood mouse", "rabbit", "woodlouse", "ladybird",
    "peacock butterfly", "honey bee", "garden snail",
  ];
  for (const a of UK_ANIMALS) {
    ctx.add({
      title: `UK garden animal — ${a}`,
      subject: "Biology",
      topic: "Animals",
      year_group: "Year 1",
      description: `${a.charAt(0).toUpperCase() + a.slice(1)} drawn in profile with name underneath.`,
      style_notes: "Naturalistic colour palette, soft outline",
      tags: ["animal", "uk-wildlife", "KS1", a.replace(" ", "-")],
    });
  }
  const PETS = ["dog","cat","hamster","rabbit","guinea pig","goldfish","budgerigar","tortoise","gerbil","parrot"];
  for (const p of PETS) {
    ctx.add({
      title: `Pet card — ${p}`,
      subject: "Biology",
      topic: "Animals",
      year_group: "Year 1",
      description: `${p.charAt(0).toUpperCase() + p.slice(1)} drawn with food/equipment hint (e.g. dog with bowl).`,
      style_notes: "Friendly rounded forms, sticker style",
      tags: ["pet", "animal", "KS1", p.replace(" ", "-")],
    });
  }
  const FARM = ["cow","sheep","goat","pig","horse","chicken","duck","goose","donkey","llama"];
  for (const a of FARM) {
    ctx.add({
      title: `Farm animal — ${a}`,
      subject: "Biology",
      topic: "Animals",
      year_group: "Year 1",
      description: `${a.charAt(0).toUpperCase() + a.slice(1)} drawn in profile, farm-yard background hint.`,
      style_notes: "Classic farmyard palette",
      tags: ["farm-animal", "KS1", a],
    });
  }
  const EXOTIC = ["lion","tiger","elephant","giraffe","zebra","monkey","panda","kangaroo","koala","penguin","polar bear","whale","dolphin","shark","octopus"];
  for (const a of EXOTIC) {
    ctx.add({
      title: `Animal card — ${a}`,
      subject: "Biology",
      topic: "Animals",
      year_group: "Year 2",
      description: `${a.charAt(0).toUpperCase() + a.slice(1)} drawn in characteristic pose with habitat hint behind.`,
      style_notes: "Vivid palette suiting habitat",
      tags: ["animal", "world-wildlife", "KS1", a.replace(" ", "-")],
    });
  }

  // Animal classification — vertebrates / invertebrates — 10
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Classification",
    year_group: "Year 4",
    description: "Five-branch classification tree with example animal photos at the leaves.",
    style_notes: "Tree branches in green, group headers in coloured boxes",
    tags: ["classification", "vertebrate", "invertebrate"],
  }, [
    "Vertebrate groups poster — mammals/birds/fish/reptiles/amphibians",
    "Mammal characteristics card",
    "Bird characteristics card",
    "Fish characteristics card",
    "Reptile characteristics card",
    "Amphibian characteristics card",
    "Invertebrate groups poster — insects/arachnids/molluscs/crustaceans/worms",
    "Insect anatomy — head/thorax/abdomen labelled",
    "Spider anatomy — 8 legs, body parts labelled",
    "Linnaean classification ladder (Kingdom..Species)",
  ]);

  // Habitats — 10
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Habitats",
    year_group: "Year 2",
    description: "Wide habitat scene populated with the typical plants and animals; species labels around the edge.",
    style_notes: "Atmospheric palette, animals drawn at scale to scene",
    tags: ["habitat", "ecology", "KS1"],
  }, [
    "Habitat — pond", "Habitat — woodland", "Habitat — ocean", "Habitat — desert",
    "Habitat — rainforest", "Habitat — Arctic / polar", "Habitat — mountain",
    "Habitat — garden / hedgerow", "Habitat — river", "Habitat — grassland savannah",
  ]);

  // Food chains — 12
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Food chains",
    year_group: "Year 4",
    description: "Linear food chain with arrows reading 'is eaten by' between four illustrated organisms.",
    style_notes: "Green arrows, role labels (producer / primary / secondary / tertiary)",
    tags: ["food-chain", "ecology", "energy-flow"],
  }, [
    "Food chain — grass → rabbit → fox",
    "Food chain — phytoplankton → krill → fish → seal",
    "Food chain — leaf → caterpillar → blue tit → sparrowhawk",
    "Food chain — seed → mouse → owl",
    "Food chain — algae → snail → frog → heron",
    "Food chain — plankton → small fish → big fish → shark",
    "Food chain — tree → giraffe → lion",
    "Food chain — grass → zebra → cheetah",
    "Food chain — flower nectar → bee → bird",
    "Food chain — leaves → koala (consumer focus)",
    "Food chain — leaves → caterpillar → bird → cat (urban)",
    "Food web — pond ecosystem (multi-arrow)",
  ]);

  // ── Human body — KS1 simple, KS2 detailed ────────────────────────────────
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Human body",
    year_group: "Year 1",
    description: "Cartoon child silhouette with body-part labels (head, shoulders, knees, toes, etc.).",
    style_notes: "Cheerful child illustration, label lines colour-coded",
    tags: ["body-parts", "KS1"],
  }, [
    "Body parts — full child labelled",
    "Body parts — face (eyes/ears/nose/mouth/chin/forehead)",
    "Body parts — hand (palm/fingers/thumb/wrist/knuckle)",
    "Body parts — foot (sole/toes/heel/ankle)",
  ]);
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Human skeleton",
    year_group: "Year 3",
    description: "Front-view child skeleton with all major bones labelled.",
    style_notes: "White bones on dark navy background, labels in white on coloured pills",
    tags: ["skeleton", "bones", "Y3"],
  }, [
    "Skeleton — full body labelled",
    "Skull — labelled (cranium, jaw)",
    "Ribcage — labelled (sternum, ribs)",
    "Spine — vertebrae regions",
    "Arm bones (humerus / radius / ulna)",
    "Leg bones (femur / tibia / fibula)",
    "Hand bones (carpals / metacarpals / phalanges)",
    "Pelvis — labelled",
    "Joints — hinge / ball-and-socket / pivot / gliding (4 panels)",
    "Skeleton vs muscle — overlay diagram",
  ]);
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Muscles",
    year_group: "Year 3",
    description: "Muscle groups labelled on a child silhouette, with antagonistic-pair callouts (biceps/triceps).",
    style_notes: "Pink-red muscle fills, callout boxes with arrows",
    tags: ["muscles", "Y3", "movement"],
  }, [
    "Muscles — full body labelled",
    "Biceps and triceps — antagonistic pair",
    "Quadriceps and hamstrings",
    "Calf muscles (gastrocnemius)",
    "Abdominal muscles",
    "Pectoral muscles",
  ]);
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Digestive system",
    year_group: "Year 4",
    description: "Digestive tract overlaid on a child silhouette with each organ labelled.",
    style_notes: "Each organ a different colour, labels with leader lines",
    tags: ["digestion", "organs", "Y4"],
  }, [
    "Digestive system — full",
    "Mouth and teeth function",
    "Oesophagus and peristalsis",
    "Stomach with churning arrows",
    "Small intestine — villi inset",
    "Large intestine and rectum",
    "Liver, pancreas, gall bladder",
    "Digestion flowchart — mouth → out",
  ]);
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Teeth",
    year_group: "Year 4",
    description: "Diagram of a child mouth showing tooth types and a tooth cross-section.",
    style_notes: "Pink gums, white teeth, side-view cross-section in inset",
    tags: ["teeth", "dental"],
  }, [
    "Teeth types — incisors / canines / molars / premolars",
    "Tooth cross-section — enamel / dentine / pulp / root / nerve",
    "Tooth decay diagram — healthy vs decayed",
    "Care for teeth — brush / floss / dentist (3 panels)",
  ]);
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Circulatory system",
    year_group: "Year 6",
    description: "Heart and major blood vessels with arrows showing oxygenated (red) and deoxygenated (blue) blood flow.",
    style_notes: "Anatomical heart with chamber labels, vessel arrows colour-coded",
    tags: ["circulation", "heart", "Y6"],
  }, [
    "Heart — labelled chambers and valves",
    "Blood circulation overview (lungs/body)",
    "Blood vessels — artery/vein/capillary cross-section",
    "Pulse points on the body",
    "Healthy vs unhealthy heart lifestyle",
  ]);
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Respiratory system",
    year_group: "Year 6",
    description: "Lungs and airways labelled on a child silhouette.",
    style_notes: "Pink lung fill, blue/red blood vessel inset",
    tags: ["respiration", "lungs"],
  }, [
    "Respiratory system — full labelled",
    "Diaphragm — inhale vs exhale",
    "Alveoli — gas exchange close-up",
    "Effects of smoking on lungs (paired)",
  ]);
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Senses",
    year_group: "Year 1",
    description: "Five-senses poster with a body-part icon for each sense.",
    style_notes: "Each sense its own colour and icon",
    tags: ["senses", "KS1"],
  }, [
    "Five senses poster", "Eye anatomy simple", "Ear anatomy simple",
    "Tongue taste zones", "Skin layers simple", "Nose and smell",
  ]);

  // Materials & properties — 18
  const MATERIALS = ["wood","metal","plastic","glass","paper","fabric","rubber","stone","ceramic","leather","cardboard","wool","cotton","silk","aluminium-foil","clay","sponge","foam"];
  for (const m of MATERIALS) {
    ctx.add({
      title: `Material card — ${m}`,
      subject: "Chemistry",
      topic: "Materials",
      year_group: "Year 2",
      description: `Everyday object made of ${m} with a property tag (e.g. flexible / hard / waterproof).`,
      style_notes: "Photo-style card, property tag in coloured pill",
      tags: ["materials", "properties", "KS1", m.replace("-", " ")],
    });
  }
  emitTitled(ctx, {
    subject: "Chemistry",
    topic: "Materials",
    year_group: "Year 2",
    description: "Sorting grid for materials by property.",
    style_notes: "2- or 4-column grid with property headers",
    tags: ["materials", "sorting", "investigation"],
  }, [
    "Material sort — hard vs soft", "Material sort — bendy vs rigid",
    "Material sort — waterproof vs absorbent", "Material sort — opaque/translucent/transparent",
    "Material sort — magnetic vs non-magnetic", "Material sort — natural vs man-made",
  ]);

  // States of matter — 12
  emitTitled(ctx, {
    subject: "Chemistry",
    topic: "States of matter",
    year_group: "Year 4",
    description: "Particle-model diagram for solid / liquid / gas with everyday-object example beside it.",
    style_notes: "Coloured particles, container outline, motion arrows in liquid/gas",
    tags: ["states-of-matter", "particles", "Y4"],
  }, [
    "Solid — particles tightly packed (with brick example)",
    "Liquid — particles flowing (with juice example)",
    "Gas — particles spread out (with balloon example)",
    "Three states — side-by-side comparison",
    "Melting — solid → liquid arrows",
    "Freezing — liquid → solid arrows",
    "Evaporation — liquid → gas arrows",
    "Condensation — gas → liquid arrows",
    "Water cycle states overlay",
    "Heating curve — particle view",
    "Cooling curve — particle view",
    "Reversible vs irreversible change card",
  ]);

  // Forces & magnets — 16
  emitTitled(ctx, {
    subject: "Physics",
    topic: "Forces (primary)",
    year_group: "Year 3",
    description: "Force diagram showing arrows for direction and a friendly object having the force applied.",
    style_notes: "Red push arrows, blue pull arrows, object in cartoon style",
    tags: ["forces", "primary", "Y3"],
  }, [
    "Push force — child pushing trolley",
    "Pull force — child pulling sled",
    "Friction — shoe on different surfaces",
    "Air resistance — parachute vs no parachute",
    "Water resistance — submarine shape comparison",
    "Gravity — apple falling",
    "Floating vs sinking — objects in water",
  ]);
  emitTitled(ctx, {
    subject: "Physics",
    topic: "Magnets",
    year_group: "Year 3",
    description: "Magnet diagram showing poles, field lines, and attraction/repulsion arrows.",
    style_notes: "Red north pole, blue south pole, dashed field lines",
    tags: ["magnets", "Y3"],
  }, [
    "Bar magnet — poles labelled",
    "Horseshoe magnet",
    "Ring magnet",
    "Disc / button magnet",
    "Two magnets attracting (N–S)",
    "Two magnets repelling (N–N)",
    "Magnetic field lines around a bar magnet",
    "Compass alignment in a magnetic field",
    "Magnetic vs non-magnetic sorting tray",
  ]);

  // Light — 8
  emitTitled(ctx, {
    subject: "Physics",
    topic: "Light (primary)",
    year_group: "Year 3",
    description: "Light source / shadow / reflection scenario suitable for KS2.",
    style_notes: "Yellow rays from sources, shadows shown on ground/walls",
    tags: ["light", "shadows", "Y3", "Y6"],
  }, [
    "Light sources poster — Sun, lamp, fire, torch, candle",
    "How shadows form — object blocking light",
    "Shadow length over the day",
    "Reflective surfaces — mirror, water, polished metal",
    "Reflection in a flat mirror — incoming/outgoing rays",
    "How we see — light bouncing off object into eye",
    "Refraction — pencil in glass of water (KS2)",
    "Periscope — two-mirror diagram (Y6)",
  ]);

  // Sound — 8
  emitTitled(ctx, {
    subject: "Physics",
    topic: "Sound (primary)",
    year_group: "Year 4",
    description: "Sound source with vibration pattern and ear-receiving illustration.",
    style_notes: "Blue waves radiating from source, child ear in section",
    tags: ["sound", "vibration", "Y4"],
  }, [
    "Sound sources poster — instrument, voice, animal, alarm",
    "Sound is a vibration — drum + arrows",
    "How we hear — outer/middle/inner ear path",
    "Pitch — high vs low waves",
    "Volume — quiet vs loud waves",
    "Sound through different media (solid/liquid/gas)",
    "Echo — sound reflecting off cliff",
    "Hearing protection — concert / fireworks",
  ]);

  // Earth & Space — 12
  emitTitled(ctx, {
    subject: "Physics",
    topic: "Earth and space (primary)",
    year_group: "Year 5",
    description: "Sun / Earth / Moon diagrams for KS2 astronomy.",
    style_notes: "Realistic colours, orbits as dashed ellipses",
    tags: ["earth-space", "astronomy", "Y5"],
  }, [
    "Sun-Earth-Moon system — labelled",
    "Why we have day and night — Earth rotation",
    "Why we have seasons — axial tilt",
    "Phases of the Moon — 8 phases circular layout",
    "Solar eclipse diagram",
    "Lunar eclipse diagram",
    "Solar system — 8 planets in order with relative size",
    "Mercury through Neptune name cards (compact)",
    "Geocentric vs heliocentric model — comparison",
    "Earth's structure — crust/mantle/outer/inner core",
    "Moon's surface features",
    "Space exploration timeline (1957 → today)",
  ]);

  // Electricity — 18
  emitTitled(ctx, {
    subject: "Physics",
    topic: "Electricity (primary)",
    year_group: "Year 4",
    description: "Simple circuit diagram suitable for primary, with components shown as friendly icons and as standard symbols on a side panel.",
    style_notes: "Coloured wires, real-component sketch on left, symbol on right",
    tags: ["electricity", "circuits", "Y4", "Y6"],
  }, [
    "Cell (battery) symbol card",
    "Bulb symbol card",
    "Switch (open) symbol card",
    "Switch (closed) symbol card",
    "Wire — straight",
    "Wire — bend",
    "Buzzer symbol card",
    "Motor symbol card",
    "Simple circuit — battery + bulb + switch",
    "Series circuit — two bulbs",
    "Parallel circuit — two bulbs",
    "Open vs closed circuit comparison",
    "What makes a bulb brighter? (more cells)",
    "Conductors vs insulators sorting tray",
    "Mains electricity safety poster",
    "Battery safety poster",
    "Static electricity — balloon + hair",
    "Electrical appliances at home — labelled",
  ]);

  // Evolution & inheritance (Y6) — 8
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Evolution",
    year_group: "Year 6",
    description: "Evolution / adaptation diagram suitable for KS2.",
    style_notes: "Time arrows, before/after panels",
    tags: ["evolution", "adaptation", "Y6"],
  }, [
    "Adaptation — polar bear features",
    "Adaptation — camel features",
    "Adaptation — cactus features",
    "Adaptation — fish gills/streamlined body",
    "Variation in a species — finch beaks (Galápagos simplified)",
    "Inherited vs environmental features",
    "Fossil record timeline (simplified)",
    "Family tree of an animal across generations",
  ]);

  // Microorganisms (Y6) — 5
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Classification",
    year_group: "Year 6",
    description: "Microorganism types card for KS2.",
    style_notes: "Cute friendly germ characters with name tags",
    tags: ["microbes", "bacteria", "fungi", "virus"],
  }, [
    "Bacteria card — rod / coccus / spiral",
    "Virus card — simple capsid + spikes",
    "Fungi card — mould vs mushroom",
    "Yeast — bread rising diagram",
    "Hand washing — germ removal sequence",
  ]);

  // Weather & seasons — 18
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Weather (primary)",
    year_group: "Year 1",
    description: "Weather symbol card with name underneath.",
    style_notes: "Bold weather icon, label in friendly font",
    tags: ["weather", "KS1"],
  }, [
    "Weather — sunny", "Weather — partly cloudy", "Weather — overcast", "Weather — light rain",
    "Weather — heavy rain", "Weather — thunderstorm", "Weather — snow", "Weather — sleet",
    "Weather — windy", "Weather — foggy", "Weather — frosty", "Weather — rainbow",
  ]);
  emitTitled(ctx, {
    subject: "Geography",
    topic: "Seasons",
    year_group: "Year 1",
    description: "Seasonal scene card showing the same tree across the four UK seasons.",
    style_notes: "Same composition, different palette/leaves per season",
    tags: ["seasons", "KS1"],
  }, [
    "Season — spring (blossom)",
    "Season — summer (full leaves)",
    "Season — autumn (orange leaves falling)",
    "Season — winter (bare branches, snow)",
    "Seasons wheel — four-quadrant",
    "Seasonal clothing chart",
  ]);

  // Investigation / scientific method — 8
  emitTitled(ctx, {
    subject: "Science",
    topic: "Working scientifically",
    year_group: "Year 4",
    description: "Visual aid for the scientific method / fair test.",
    style_notes: "Stepped cards, magnifying-glass mascot",
    tags: ["scientific-method", "fair-test", "investigation"],
  }, [
    "Scientific method — 5 step cycle",
    "Fair test — change one / measure one / keep same",
    "Variables card — independent / dependent / control",
    "Predict – test – record – conclude planner",
    "Equipment poster — beaker / measuring cylinder / thermometer / stopwatch",
    "Lab safety poster (primary)",
    "Bar chart / line graph chooser flowchart",
    "Conclusion sentence stems poster",
  ]);

  // Healthy living / diet (Y2/Y3) — 6
  emitTitled(ctx, {
    subject: "Biology",
    topic: "Healthy living",
    year_group: "Year 2",
    description: "Visuals supporting nutrition, exercise and hygiene topics in primary science / PSHE.",
    style_notes: "Bright, encouraging palette, mascot waving",
    tags: ["healthy-living", "KS1", "KS2"],
  }, [
    "Eatwell plate — proportional segments",
    "Healthy plate vs treat plate",
    "Hydration ladder — what to drink",
    "Exercise heart rate — before/after",
    "Sleep needs by age — body chart",
    "Hygiene routine — wash hands / brush teeth / shower",

  ]);
}
