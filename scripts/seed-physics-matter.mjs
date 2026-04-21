#!/usr/bin/env node
/**
 * Seed script — Particle Model and Pressure (Physics, Year 10)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Particle Model and States of Matter";
const YEAR_GROUP = "Year 10";
const SOURCE = "Adaptly Curated";

const DIAGRAM_STATES = "/images/physics_states_matter_nb.png";
const DIAGRAM_PRESSURE = "/images/physics_pressure_fluids_nb.png";

const KEY_VOCAB = [
  { term: "Density", definition: "The mass per unit volume of a substance, measured in kg/m³." },
  { term: "Solid", definition: "A state of matter where particles are closely packed in a regular arrangement and vibrate in fixed positions." },
  { term: "Liquid", definition: "A state of matter where particles are close together but can move past each other." },
  { term: "Gas", definition: "A state of matter where particles are far apart and move randomly at high speeds." },
  { term: "Internal energy", definition: "The total kinetic and potential energy of all the particles in a system." },
  { term: "Specific latent heat", definition: "The energy required to change the state of 1 kg of a substance with no change in temperature." },
  { term: "Pressure", definition: "The force exerted per unit area, measured in Pascals (Pa)." },
  { term: "Fluid", definition: "A liquid or a gas (substances that can flow)." },
  { term: "Upthrust", definition: "The upward force exerted by a fluid on a submerged object." },
  { term: "Atmospheric pressure", definition: "The pressure exerted by the weight of the atmosphere above us." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Describe the arrangement and movement of particles in solids, liquids, and gases.\n" +
  "2. Explain changes of state in terms of energy and particles.\n" +
  "3. Calculate density using the equation ρ = m / V.\n" +
  "4. Calculate pressure using P = F / A and explain how pressure changes in fluids.";

const KEY_VOCAB_CONTENT =
  "**Density** — The mass per unit volume of a substance, measured in kg/m³.\n" +
  "**Solid** — A state of matter where particles are closely packed in a regular arrangement and vibrate in fixed positions.\n" +
  "**Liquid** — A state of matter where particles are close together but can move past each other.\n" +
  "**Gas** — A state of matter where particles are far apart and move randomly at high speeds.\n" +
  "**Internal energy** — The total kinetic and potential energy of all the particles in a system.\n" +
  "**Specific latent heat** — The energy required to change the state of 1 kg of a substance with no change in temperature.\n" +
  "**Pressure** — The force exerted per unit area, measured in Pascals (Pa).\n" +
  "**Fluid** — A liquid or a gas (substances that can flow).\n" +
  "**Upthrust** — The upward force exerted by a fluid on a submerged object.\n" +
  "**Atmospheric pressure** — The pressure exerted by the weight of the atmosphere above us.";

const COMMON_MISTAKES =
  "1. Thinking particles expand when heated. The *substance* expands because the particles move further apart, but the particles themselves stay the same size.\n" +
  "2. Confusing boiling and evaporation. Boiling happens throughout the liquid at a specific temperature; evaporation happens only at the surface at any temperature.\n" +
  "3. Forgetting that temperature stays constant during a change of state. The energy is used to break bonds, not increase kinetic energy.\n" +
  "4. Mixing up mass and density. A heavy object can have low density if it is very large (like a hot air balloon).";

const WORKED_EXAMPLE =
  "Worked example: Calculating Pressure\n\n" +
  "Question: A box with a weight of 200 N rests on a table. The area of the box in contact with the table is 0.5 m². Calculate the pressure exerted on the table.\n\n" +
  "Step 1: Identify the given values. Force (F) = 200 N. Area (A) = 0.5 m².\n" +
  "Step 2: State the formula. Pressure (P) = F / A.\n" +
  "Step 3: Substitute values. P = 200 / 0.5.\n" +
  "Step 4: Calculate. P = 400.\n" +
  "Step 5: Add units. Pressure = 400 Pa (or N/m²).";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Matter and Pressure?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can describe the particle arrangement in solids, liquids, and gases.|Not yet|Almost|Got it!\n" +
  "I can explain what happens during a change of state.|Not yet|Almost|Got it!\n" +
  "I can calculate density using ρ = m / V.|Not yet|Almost|Got it!\n" +
  "I can calculate pressure using P = F / A.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "Why does a gas exert pressure on the walls of its container?\n" +
  "Why does pressure increase as you go deeper underwater?\n" +
  "EXIT_TICKET: A block has a mass of 10 kg and a volume of 2 m³. Calculate its density.";

const MARK_SCHEME =
  "**Q1 - States of Matter Diagram**\n" +
  "A = Melting, B = Evaporation/Boiling, C = Condensation, D = Freezing, E = Sublimation.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (They vibrate in fixed positions)  2. True  3. False (Temperature stays constant)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (kg/m³)  2. C (Pascals)  3. A (Gas)\n\n" +
  "**Q4 - Density Calculations**\n" +
  "a) ρ = 50 / 2 = 25 kg/m³\n" +
  "b) m = 1000 * 0.5 = 500 kg\n" +
  "c) V = 200 / 8000 = 0.025 m³\n\n" +
  "**Q5 - Pressure Calculations**\n" +
  "a) P = 500 / 2 = 250 Pa\n" +
  "b) F = 100,000 * 0.1 = 10,000 N\n" +
  "c) A = 600 / 300 = 2 m²\n\n" +
  "**Q6 - Gas Pressure**\n" +
  "Gas particles move randomly at high speeds. They collide with the walls of the container. Each collision exerts a small force. The total force over the area of the walls creates pressure.\n\n" +
  "**Q7 - Fluid Pressure**\n" +
  "As you go deeper, there is a greater weight of water above you pushing down. This increases the force per unit area, so the pressure increases.\n\n" +
  "**Q8 - Challenge**\n" +
  "a) Volume = 0.2 * 0.2 * 0.2 = 0.008 m³\n" +
  "b) Density = 64 / 0.008 = 8000 kg/m³\n" +
  "c) Weight (Force) = 64 * 9.8 = 627.2 N. Area = 0.2 * 0.2 = 0.04 m². Pressure = 627.2 / 0.04 = 15,680 Pa.";

const TEACHER_NOTES =
  "- Ensure students understand that 'fluid' means both liquids AND gases.\n" +
  "- Remind students to check units carefully, especially converting cm³ to m³ if needed (though these questions avoid that to focus on the core concept).\n" +
  "- Emphasize that pressure in a liquid acts in all directions, not just downwards.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-matter", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-matter", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-matter", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-matter", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-states-matter",
    title: "Q1 - States of Matter",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_STATES,
    caption: "Diagram showing the three states of matter and changes of state.",
    content: "Identify the changes of state shown by the arrows in the diagram.",
  };
}

function referencePressureSection() {
  return {
    id: "reference-pressure",
    title: "Reference - Pressure in Fluids",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_PRESSURE,
    caption: "Diagrams showing pressure formulas and pressure in fluids.",
    content: "Use this reference to help answer questions about pressure.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-matter", "self-reflection", "Self Reflection", SELF_REFLECTION);
}

function teacherSections(markScheme = MARK_SCHEME, extraNotes = "") {
  return [
    { id: "teacher-answer-key", title: "Teacher Answer Key", type: "mark-scheme", teacherOnly: true, content: markScheme },
    { id: "teacher-notes", title: "Teacher Notes", type: "teacher-notes", teacherOnly: true, content: TEACHER_NOTES + extraNotes },
  ];
}

const Q2_SHARED = section(
  "q2-true-false",
  "q-true-false",
  "Q2 - True or False",
  "1. Particles in a solid do not move at all.\n2. Evaporation can happen at any temperature, but boiling only happens at the boiling point.\n3. The temperature of a substance increases while it is melting.\n4. Pressure increases as you go deeper underwater."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What is the standard unit for density?\nA. kg/m²\nB. kg/m³\nC. g/cm\nD. N/m³\n\n" +
    "2. What is the unit for pressure?\nA. Joules\nB. Watts\nC. Pascals\nD. Newtons\n\n" +
    "3. In which state of matter do particles have the most kinetic energy?\nA. Gas\nB. Liquid\nC. Solid\nD. They all have the same"
);

const Q4_MIXED = section(
  "q4-density",
  "q-short-answer",
  "Q4 - Density Calculations",
  "Use the equation Density = Mass ÷ Volume (ρ = m/V) to calculate the missing values:\n\na) Mass = 50 kg, Volume = 2 m³. Calculate Density.\n\nb) Density = 1000 kg/m³, Volume = 0.5 m³. Calculate Mass.\n\nc) Mass = 200 kg, Density = 8000 kg/m³. Calculate Volume."
);

const Q4_FOUNDATION = section(
  "q4-density",
  "q-short-answer",
  "Q4 - Density Calculations",
  "Use the equation Density = Mass ÷ Volume to calculate the missing values:\n\na) Mass = 50 kg, Volume = 2 m³. Calculate Density (50 ÷ 2).\n\nb) Density = 1000 kg/m³, Volume = 0.5 m³. Calculate Mass (1000 × 0.5).\n\nc) Mass = 200 kg, Density = 8000 kg/m³. Calculate Volume (200 ÷ 8000)."
);

const Q5_MIXED = section(
  "q5-pressure",
  "q-short-answer",
  "Q5 - Pressure Calculations",
  "Use the equation Pressure = Force ÷ Area (P = F/A) to calculate the missing values:\n\na) Force = 500 N, Area = 2 m². Calculate Pressure.\n\nb) Pressure = 100,000 Pa, Area = 0.1 m². Calculate Force.\n\nc) Force = 600 N, Pressure = 300 Pa. Calculate Area."
);

const Q5_FOUNDATION = section(
  "q5-pressure",
  "q-short-answer",
  "Q5 - Pressure Calculations",
  "Use the equation Pressure = Force ÷ Area to calculate the missing values:\n\na) Force = 500 N, Area = 2 m². Calculate Pressure (500 ÷ 2).\n\nb) Pressure = 100,000 Pa, Area = 0.1 m². Calculate Force (100,000 × 0.1).\n\nc) Force = 600 N, Pressure = 300 Pa. Calculate Area (600 ÷ 300)."
);

const Q6_MIXED = section(
  "q6-gas-pressure",
  "q-extended",
  "Q6 - Gas Pressure",
  "Explain, using the particle model, how a gas exerts pressure on the walls of its container."
);

const Q7_MIXED = section(
  "q7-fluid-pressure",
  "q-extended",
  "Q7 - Pressure in Fluids",
  "Explain why the pressure at the bottom of a swimming pool is greater than the pressure just below the surface."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A solid metal cube has sides of length 0.2 m and a mass of 64 kg. (Assume g = 9.8 N/kg).\n\na) Calculate the volume of the cube.\n\nb) Calculate the density of the metal.\n\nc) Calculate the pressure the cube exerts on the ground when resting on one of its faces."
);

const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: Gas particles move...\nWhen they hit the walls of the container, they...\nThis creates a force over an area, which is...");
const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: As you go deeper underwater, there is more...\nThis means there is a greater weight pushing...\nTherefore, the force per unit area...");

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED,
  referencePressureSection(),
  Q5_MIXED,
  Q6_MIXED,
  Q7_MIXED,
  Q8_CHALLENGE,
  selfReflectionSection(),
];

const FOUNDATION_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_FOUNDATION,
  referencePressureSection(),
  Q5_FOUNDATION,
  Q6_MIXED,
  Q7_MIXED,
  selfReflectionSection(),
];

const HIGHER_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q4_MIXED,
  referencePressureSection(),
  Q5_MIXED,
  Q6_MIXED,
  Q7_MIXED,
  Q8_CHALLENGE,
  selfReflectionSection(),
];

const SCAFFOLDED_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_FOUNDATION,
  referencePressureSection(),
  Q5_FOUNDATION,
  Q6_MIXED,
  SS_Q6,
  Q7_MIXED,
  SS_Q7,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Particle Model and Pressure - Mixed (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Particle Model and Pressure - Foundation (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Particle Model and Pressure - Higher (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Particle Model and Pressure - Scaffolded (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Scaffolded SEND version",
    sections: SCAFFOLDED_SECTIONS,
    teacher_sections: teacherSections(),
  },
];

async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${options.method || "GET"} ${url} failed (${res.status}): ${err}`);
  }
  return res.json();
}

function assetPayload(entryId, sectionKey, publicUrl, altText) {
  return {
    libraryEntryId: entryId,
    sectionKey,
    assetType: "diagram",
    publicUrl,
    altText,
    topicTags: ["matter", "pressure", "physics", "nano_banana", "worksheet_matter_y10"],
    contentHash: `${sectionKey}:${publicUrl}`,
  };
}

async function login() {
  const data = await requestJson(`${APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  return data.token || data.accessToken;
}

async function upsertEntry(token, tierDef) {
  const payload = {
    subject: SUBJECT,
    topic: TOPIC,
    yearGroup: YEAR_GROUP,
    title: tierDef.title,
    subtitle: tierDef.subtitle,
    learning_objective: LEARNING_OBJECTIVE,
    tier: tierDef.tier,
    source: SOURCE,
    curated: true,
    key_vocab: KEY_VOCAB,
    sections: tierDef.sections,
    teacher_sections: tierDef.teacher_sections,
  };

  const result = await requestJson(`${APP_URL}/api/library/entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return result.id;
}

async function fetchAssets(token, entryId) {
  const result = await requestJson(`${APP_URL}/api/library/assets/${entryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.assets || [];
}

async function ensureAsset(token, entryId, sectionKey, publicUrl, altText) {
  const existingAssets = await fetchAssets(token, entryId).catch(() => []);
  const alreadyThere = existingAssets.find(a => a.sectionKey === sectionKey || a.publicUrl === publicUrl);
  if (alreadyThere) {
    console.log(`  asset already present for ${sectionKey}`);
    return { assetId: alreadyThere.id, publicUrl };
  }

  try {
    const result = await requestJson(`${APP_URL}/api/library/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(assetPayload(entryId, sectionKey, publicUrl, altText)),
    });

    console.log(`  registered asset ${sectionKey} -> ${publicUrl}`);
    return { assetId: result.id, publicUrl };
  } catch (error) {
    console.warn(`  asset registration failed for ${sectionKey}; falling back to direct image URL rendering.`);
    return { assetId: null, publicUrl };
  }
}

async function main() {
  console.log(`Logging in to ${APP_URL} as ${ADMIN_EMAIL}...`);
  const token = await login();
  console.log("Logged in successfully.");

  for (const tierDef of TIER_DEFINITIONS) {
    console.log(`\nUpserting ${tierDef.tier} worksheet...`);
    const entryId = await upsertEntry(token, tierDef);
    console.log(`  entry id: ${entryId}`);

    await ensureAsset(
      token,
      entryId,
      "q1-states-matter",
      DIAGRAM_STATES,
      "Diagram showing the three states of matter and changes of state."
    );

    await ensureAsset(
      token,
      entryId,
      "reference-pressure",
      DIAGRAM_PRESSURE,
      "Diagrams showing pressure formulas and pressure in fluids."
    );
  }

  console.log("\nMatter and Pressure curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
