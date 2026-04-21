#!/usr/bin/env node
/**
 * Seed script — Specific Heat Capacity (Physics, Year 9)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Specific Heat Capacity";
const YEAR_GROUP = "Year 9";
const SOURCE = "Adaptly Curated";

const DIAGRAM_SHC = "/images/physics_specific_heat_capacity_y9_nb.png";

const KEY_VOCAB = [
  { term: "Specific heat capacity", definition: "The amount of energy required to raise the temperature of 1 kg of a substance by 1°C." },
  { term: "Thermal energy", definition: "Energy stored in an object due to its temperature (also called heat energy)." },
  { term: "Temperature", definition: "A measure of the average kinetic energy of the particles in a substance, measured in °C." },
  { term: "Mass", definition: "The amount of matter in an object, measured in kilograms (kg)." },
  { term: "Joulemeter", definition: "A device used to measure the amount of electrical energy transferred to a heater." },
  { term: "Insulation", definition: "Material used to reduce the rate of thermal energy transfer to the surroundings." },
  { term: "Thermometer", definition: "An instrument used to measure temperature." },
  { term: "Electric heater", definition: "A device that transfers electrical energy into thermal energy." },
  { term: "Dissipation", definition: "When thermal energy spreads out into the surroundings and is wasted." },
  { term: "System", definition: "An object or group of objects being studied." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Define specific heat capacity and state its units.\n" +
  "2. Use the equation E = m × c × ΔT to calculate energy, mass, specific heat capacity, or temperature change.\n" +
  "3. Describe an experiment to determine the specific heat capacity of a material.\n" +
  "4. Explain why insulation is important in thermal experiments.";

const KEY_VOCAB_CONTENT =
  "**Specific heat capacity** — The amount of energy required to raise the temperature of 1 kg of a substance by 1°C.\n" +
  "**Thermal energy** — Energy stored in an object due to its temperature (also called heat energy).\n" +
  "**Temperature** — A measure of the average kinetic energy of the particles in a substance, measured in °C.\n" +
  "**Mass** — The amount of matter in an object, measured in kilograms (kg).\n" +
  "**Joulemeter** — A device used to measure the amount of electrical energy transferred to a heater.\n" +
  "**Insulation** — Material used to reduce the rate of thermal energy transfer to the surroundings.\n" +
  "**Thermometer** — An instrument used to measure temperature.\n" +
  "**Electric heater** — A device that transfers electrical energy into thermal energy.\n" +
  "**Dissipation** — When thermal energy spreads out into the surroundings and is wasted.\n" +
  "**System** — An object or group of objects being studied.";

const COMMON_MISTAKES =
  "1. Confusing heat and temperature. Heat is the total thermal energy (Joules); temperature is the average kinetic energy of particles (°C).\n" +
  "2. Forgetting to calculate the *change* in temperature (ΔT). Always subtract the starting temperature from the final temperature.\n" +
  "3. Using the wrong units for mass. Mass must always be in kilograms (kg), not grams (g).\n" +
  "4. Assuming all energy from the heater goes into the block. In reality, some energy is always dissipated to the surroundings.";

const WORKED_EXAMPLE =
  "Worked example: Calculating Energy Transferred\n\n" +
  "Question: A 2 kg block of copper is heated from 20°C to 50°C. The specific heat capacity of copper is 390 J/kg°C. Calculate the thermal energy transferred to the copper.\n\n" +
  "Step 1: Calculate the temperature change (ΔT). ΔT = 50°C - 20°C = 30°C.\n" +
  "Step 2: State the formula. E = m × c × ΔT.\n" +
  "Step 3: Substitute the values. E = 2 × 390 × 30.\n" +
  "Step 4: Calculate the result. E = 23,400.\n" +
  "Step 5: Add the correct units. Energy = 23,400 J.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Specific Heat Capacity?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can define specific heat capacity.|Not yet|Almost|Got it!\n" +
  "I can use the equation E = m × c × ΔT.|Not yet|Almost|Got it!\n" +
  "I can describe the specific heat capacity experiment.|Not yet|Almost|Got it!\n" +
  "I can explain why insulation is needed.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What does a high specific heat capacity mean?\n" +
  "Why do we put oil in the thermometer hole of the metal block?\n" +
  "EXIT_TICKET: Calculate the energy needed to heat 1 kg of water (c = 4200 J/kg°C) by 5°C.";

const MARK_SCHEME =
  "**Q1 - Experiment Diagram**\n" +
  "A = Thermometer, B = Electric heater, C = Metal block, D = Insulation/Insulating mat, E = Joulemeter.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It is measured in J/kg°C)  2. True  3. False (It must be in kg)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Energy required to raise 1kg by 1°C)  2. C (Joulemeter)  3. A (To reduce energy lost to the surroundings)\n\n" +
  "**Q4 - Temperature Change (ΔT)**\n" +
  "a) 40 - 15 = 25°C\n" +
  "b) 100 - 20 = 80°C\n" +
  "c) 35 - 10 = 25°C\n\n" +
  "**Q5 - Energy Calculations (E = mcΔT)**\n" +
  "a) E = 3 * 4200 * 20 = 252,000 J\n" +
  "b) E = 0.5 * 900 * 50 = 22,500 J\n" +
  "c) E = 5 * 450 * 10 = 17,500 J\n\n" +
  "**Q6 - Rearranging the Equation**\n" +
  "a) c = E / (m * ΔT) = 18000 / (2 * 10) = 18000 / 20 = 900 J/kg°C\n" +
  "b) ΔT = E / (m * c) = 42000 / (1 * 4200) = 10°C\n\n" +
  "**Q7 - The Experiment**\n" +
  "1. Measure the mass of the block using a balance. 2. Wrap the block in insulation to reduce heat loss. 3. Record the starting temperature using the thermometer. 4. Turn on the heater and joulemeter. 5. After 10 minutes, record the final temperature and the energy reading on the joulemeter. 6. Calculate ΔT and use c = E / (m * ΔT).\n\n" +
  "**Q8 - Challenge**\n" +
  "a) Energy supplied = Power * time = 50 W * 300 s = 15,000 J.\n" +
  "b) c = E / (m * ΔT) = 15000 / (1 * 15) = 1000 J/kg°C.\n" +
  "c) The calculated value is higher than the true value because some of the 15,000 J of energy was dissipated to the surroundings and did not go into heating the block. Therefore, it appeared to take more energy to raise the temperature than it actually did.";

const TEACHER_NOTES =
  "- Ensure students always write down the formula before substituting numbers.\n" +
  "- Emphasize that water has a very high specific heat capacity (4200 J/kg°C), which is why it is used in central heating systems.\n" +
  "- For the challenge question, the concept of energy dissipation causing an artificially high calculated specific heat capacity is a common exam discriminator.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-shc", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-shc", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-shc", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-shc", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-shc-experiment",
    title: "Q1 - Labelling the Experiment",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_SHC,
    caption: "Apparatus for measuring specific heat capacity.",
    content: "Look at the diagram of the experiment. Label the five key pieces of equipment shown.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-shc", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. Specific heat capacity is measured in Joules.\n2. A substance with a high specific heat capacity takes a lot of energy to heat up.\n3. Mass can be measured in grams when using the specific heat capacity equation.\n4. Insulation helps to prevent thermal energy from dissipating into the surroundings."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What is the definition of specific heat capacity?\nA. The energy needed to melt 1 kg of a substance\nB. The energy needed to raise the temperature of 1 kg of a substance by 1°C\nC. The temperature at which a substance boils\nD. The total thermal energy in an object\n\n" +
    "2. Which piece of equipment measures the electrical energy supplied to the heater?\nA. Voltmeter\nB. Ammeter\nC. Joulemeter\nD. Thermometer\n\n" +
    "3. Why is the metal block wrapped in insulation during the experiment?\nA. To reduce energy lost to the surroundings\nB. To make the block look nice\nC. To stop the block from melting\nD. To increase the mass of the block"
);

const Q4_MIXED = section(
  "q4-delta-t",
  "q-short-answer",
  "Q4 - Calculating Temperature Change (ΔT)",
  "Calculate the temperature change (ΔT) for each scenario:\n\na) A block is heated from 15°C to 40°C.\n\nb) Water is heated from 20°C to 100°C.\n\nc) A liquid cools down from 35°C to 10°C."
);

const Q4_FOUNDATION = section(
  "q4-delta-t",
  "q-short-answer",
  "Q4 - Calculating Temperature Change (ΔT)",
  "Calculate the temperature change (ΔT) for each scenario. (Hint: Final temperature - Starting temperature):\n\na) A block is heated from 15°C to 40°C.\n\nb) Water is heated from 20°C to 100°C.\n\nc) A liquid cools down from 35°C to 10°C."
);

const Q5_MIXED = section(
  "q5-energy-calc",
  "q-short-answer",
  "Q5 - Energy Calculations",
  "Use the equation E = m × c × ΔT to calculate the energy transferred:\n\na) Mass = 3 kg, c = 4200 J/kg°C, ΔT = 20°C.\n\nb) Mass = 0.5 kg, c = 900 J/kg°C, ΔT = 50°C.\n\nc) Mass = 5 kg, c = 450 J/kg°C, heated from 10°C to 20°C."
);

const Q5_FOUNDATION = section(
  "q5-energy-calc",
  "q-short-answer",
  "Q5 - Energy Calculations",
  "Use the equation E = m × c × ΔT to calculate the energy transferred:\n\na) Mass = 3 kg, c = 4200 J/kg°C, ΔT = 20°C. (E = 3 × 4200 × 20)\n\nb) Mass = 0.5 kg, c = 900 J/kg°C, ΔT = 50°C. (E = 0.5 × 900 × 50)\n\nc) Mass = 5 kg, c = 450 J/kg°C, ΔT = 10°C. (E = 5 × 450 × 10)"
);

const Q6_MIXED = section(
  "q6-rearranging",
  "q-short-answer",
  "Q6 - Rearranging the Equation",
  "Use the formula triangle in the reference diagram to rearrange the equation and solve:\n\na) 18,000 J of energy is supplied to a 2 kg block, raising its temperature by 10°C. Calculate its specific heat capacity (c).\n\nb) 42,000 J of energy is supplied to 1 kg of water (c = 4200 J/kg°C). Calculate the temperature change (ΔT)."
);

const Q7_MIXED = section(
  "q7-experiment",
  "q-extended",
  "Q7 - The Experiment",
  "Describe a method to determine the specific heat capacity of an aluminium block. You should include the equipment you would use and the measurements you would take."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A student uses a 50 W heater to heat a 1 kg block of metal for 5 minutes (300 seconds). The temperature of the block increases by 15°C.\n\na) Calculate the total energy supplied by the heater. (Energy = Power × time).\n\nb) Use this energy value to calculate the specific heat capacity of the metal.\n\nc) The true specific heat capacity of the metal is 900 J/kg°C. Explain why the student's calculated value is higher than the true value."
);

const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: First, I would measure the mass of the block using a...\nThen, I would wrap the block in...\nI would measure the starting temperature using a...\nI would turn on the heater and measure the energy supplied using a...\nFinally, I would measure the...");

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED,
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
  Q5_FOUNDATION,
  Q6_MIXED,
  Q7_MIXED,
  SS_Q7,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Specific Heat Capacity - Mixed (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Specific Heat Capacity - Foundation (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Specific Heat Capacity - Higher (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Specific Heat Capacity - Scaffolded (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Scaffolded SEND version",
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
    topicTags: ["specific heat capacity", "energy", "physics", "nano_banana", "worksheet_specific_heat_capacity_y9"],
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
      "q1-shc-experiment",
      DIAGRAM_SHC,
      "Apparatus for measuring specific heat capacity."
    );
  }

  console.log("\nSpecific Heat Capacity (Year 9) curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
