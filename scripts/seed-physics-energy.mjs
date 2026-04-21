#!/usr/bin/env node
/**
 * Seed script — Energy (Physics, Year 10)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Energy";
const YEAR_GROUP = "Year 10";
const SOURCE = "Adaptly Curated";

const DIAGRAM_ENERGY_STORES = "/images/physics_energy_stores_nb.png";
const DIAGRAM_SANKEY = "/images/physics_sankey_diagram_nb.png";
const DIAGRAM_SHC = "/images/physics_specific_heat_capacity_nb.png";

const KEY_VOCAB = [
  { term: "Energy store", definition: "A way in which energy is kept in a system (e.g., kinetic, thermal)." },
  { term: "Energy transfer", definition: "The process of moving energy from one store to another." },
  { term: "Conservation of Energy", definition: "Energy cannot be created or destroyed, only transferred." },
  { term: "Kinetic energy", definition: "The energy an object has due to its motion." },
  { term: "Gravitational potential energy", definition: "Energy stored in an object due to its height above the ground." },
  { term: "Specific heat capacity", definition: "The energy required to raise the temperature of 1 kg of a substance by 1°C." },
  { term: "Power", definition: "The rate at which energy is transferred or work is done (measured in Watts)." },
  { term: "Efficiency", definition: "The proportion of input energy that is transferred to useful output energy." },
  { term: "Work done", definition: "Energy transferred when a force moves an object over a distance." },
  { term: "Dissipation", definition: "When energy spreads out into the surroundings, usually as wasted thermal energy." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Identify different energy stores and how energy is transferred between them.\n" +
  "2. Apply the principle of conservation of energy to various scenarios.\n" +
  "3. Calculate efficiency using Sankey diagrams.\n" +
  "4. Use the specific heat capacity equation to calculate energy changes.";

const KEY_VOCAB_CONTENT =
  "**Energy store** — A way in which energy is kept in a system (e.g., kinetic, thermal).\n" +
  "**Energy transfer** — The process of moving energy from one store to another.\n" +
  "**Conservation of Energy** — Energy cannot be created or destroyed, only transferred.\n" +
  "**Kinetic energy** — The energy an object has due to its motion.\n" +
  "**Gravitational potential energy** — Energy stored in an object due to its height above the ground.\n" +
  "**Specific heat capacity** — The energy required to raise the temperature of 1 kg of a substance by 1°C.\n" +
  "**Power** — The rate at which energy is transferred or work is done (measured in Watts).\n" +
  "**Efficiency** — The proportion of input energy that is transferred to useful output energy.\n" +
  "**Work done** — Energy transferred when a force moves an object over a distance.\n" +
  "**Dissipation** — When energy spreads out into the surroundings, usually as wasted thermal energy.";

const COMMON_MISTAKES =
  "1. Thinking energy is 'used up' or 'lost'. Energy is never destroyed, only transferred to less useful stores (dissipated).\n" +
  "2. Confusing energy and power. Energy is measured in Joules (J); power is the *rate* of energy transfer, measured in Watts (W).\n" +
  "3. Forgetting to convert units. Mass must be in kg, and time must be in seconds for standard equations.\n" +
  "4. Misinterpreting Sankey diagrams. The width of the arrow represents the amount of energy, not the length.";

const WORKED_EXAMPLE =
  "Worked example: Calculating Efficiency\n\n" +
  "Question: An electric motor is supplied with 500 J of electrical energy. It transfers 400 J as useful kinetic energy and 100 J is wasted as thermal energy. Calculate its efficiency.\n\n" +
  "Step 1: Identify useful output and total input. Useful output = 400 J. Total input = 500 J.\n" +
  "Step 2: State the formula. Efficiency = (Useful Output / Total Input) × 100.\n" +
  "Step 3: Substitute values. Efficiency = (400 / 500) × 100.\n" +
  "Step 4: Calculate. Efficiency = 0.8 × 100 = 80%.\n" +
  "Step 5: Check your answer. Efficiency can never be greater than 100%.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Energy?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can name the energy stores and transfers.|Not yet|Almost|Got it!\n" +
  "I can explain the conservation of energy.|Not yet|Almost|Got it!\n" +
  "I can calculate efficiency from a Sankey diagram.|Not yet|Almost|Got it!\n" +
  "I can use the specific heat capacity equation.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What does it mean when energy is 'dissipated'?\n" +
  "Explain why no machine can be 100% efficient.\n" +
  "EXIT_TICKET: A light bulb uses 100J of energy and produces 20J of light. What is its efficiency?";

const MARK_SCHEME =
  "**Q1 - Energy Stores Diagram**\n" +
  "Kinetic, Gravitational Potential, Elastic Potential, Thermal, Chemical, Nuclear, Magnetic, Electrostatic.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It cannot be destroyed)  2. True  3. False (It is measured in Joules)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. C (Thermal)  2. B (Watts)  3. A (Kinetic)\n\n" +
  "**Q4 - Energy Transfers**\n" +
  "a) Chemical store (battery) -> Electrical transfer -> Light/Thermal store (bulb)\n" +
  "b) Gravitational potential store -> Mechanical transfer -> Kinetic store\n" +
  "c) Kinetic store -> Mechanical transfer -> Thermal store (brakes)\n\n" +
  "**Q5 - Efficiency Calculations**\n" +
  "a) Efficiency = (150 / 200) * 100 = 75%\n" +
  "b) Efficiency = (30 / 100) * 100 = 30%\n" +
  "c) Useful = 0.6 * 500 = 300 J\n\n" +
  "**Q6 - Conservation of Energy**\n" +
  "Energy cannot be created or destroyed. The total energy before the drop equals the total energy just before hitting the ground. GPE is converted entirely into KE (ignoring air resistance).\n\n" +
  "**Q7 - Specific Heat Capacity**\n" +
  "E = m * c * ΔT\nE = 2 * 4200 * 50\nE = 420,000 J (or 420 kJ)\n\n" +
  "**Q8 - Power and Work Done**\n" +
  "Power = Work Done / Time\nWork Done = Force * Distance = 500 * 10 = 5000 J\nPower = 5000 / 20 = 250 W\n\n" +
  "**Q9 - Challenge**\n" +
  "a) GPE = mgh = 50 * 9.8 * 10 = 4900 J\n" +
  "b) KE = 4900 J (Conservation of energy)\n" +
  "c) KE = 0.5 * m * v² -> 4900 = 0.5 * 50 * v² -> 4900 = 25 * v² -> v² = 196 -> v = 14 m/s";

const TEACHER_NOTES =
  "- Ensure students use the correct terminology: 'energy stores' and 'energy transfers' rather than 'types of energy'.\n" +
  "- Emphasize that thermal energy is the most common wasted energy store.\n" +
  "- For the challenge question, remind students that GPE lost = KE gained.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-energy", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-energy", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-energy", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-energy", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-energy-stores",
    title: "Q1 - Energy Stores",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_ENERGY_STORES,
    caption: "Diagram showing the 8 energy stores and 4 transfer pathways.",
    content: "List the 8 energy stores shown in the diagram.",
  };
}

function referenceSankeySection() {
  return {
    id: "reference-sankey",
    title: "Reference - Sankey Diagram",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_SANKEY,
    caption: "Sankey diagram showing energy transfer and efficiency calculation.",
    content: "Use this reference to help answer questions about efficiency.",
  };
}

function referenceSHCSection() {
  return {
    id: "reference-shc",
    title: "Reference - Specific Heat Capacity",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_SHC,
    caption: "Specific Heat Capacity formula triangle and worked example.",
    content: "Use this reference to help answer questions about specific heat capacity.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-energy", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. Energy can be destroyed if a machine is very inefficient.\n2. Thermal energy is often dissipated into the surroundings.\n3. Power is measured in Joules.\n4. A Sankey diagram shows the proportion of useful and wasted energy."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. Which energy store is associated with a hot cup of tea?\nA. Chemical\nB. Kinetic\nC. Thermal\nD. Nuclear\n\n" +
    "2. What is the unit of Power?\nA. Joules\nB. Watts\nC. Newtons\nD. Volts\n\n" +
    "3. Which energy store increases when an object speeds up?\nA. Kinetic\nB. Gravitational Potential\nC. Elastic Potential\nD. Chemical"
);

const Q4_MIXED = section(
  "q4-transfers",
  "q-short-answer",
  "Q4 - Energy Transfers",
  "Describe the main energy transfers taking place in the following scenarios:\n\na) A battery-powered torch is turned on.\n\nb) An apple falls from a tree.\n\nc) A car applies its brakes and stops."
);

const Q4_FOUNDATION = section(
  "q4-transfers",
  "q-short-answer",
  "Q4 - Energy Transfers",
  "Describe the main energy transfers taking place in the following scenarios. Use the words: Chemical, Electrical, Light, Thermal, Gravitational Potential, Kinetic.\n\na) A battery-powered torch is turned on.\n\nb) An apple falls from a tree.\n\nc) A car applies its brakes and stops."
);

const Q5_MIXED = section(
  "q5-efficiency",
  "q-short-answer",
  "Q5 - Efficiency Calculations",
  "Calculate the missing values:\n\na) Total input = 200 J, Useful output = 150 J. Calculate Efficiency.\n\nb) Total input = 100 J, Wasted output = 70 J. Calculate Efficiency.\n\nc) Efficiency = 60% (0.6), Total input = 500 J. Calculate Useful output."
);

const Q5_FOUNDATION = section(
  "q5-efficiency",
  "q-short-answer",
  "Q5 - Efficiency Calculations",
  "Calculate the missing values using Efficiency = (Useful ÷ Total) × 100:\n\na) Total input = 200 J, Useful output = 150 J. Calculate Efficiency.\n\nb) Total input = 100 J, Wasted output = 70 J. Calculate Efficiency. (Hint: Useful = 100 - 70).\n\nc) Efficiency = 60% (0.6), Total input = 500 J. Calculate Useful output."
);

const Q6_MIXED = section(
  "q6-conservation",
  "q-extended",
  "Q6 - Conservation of Energy",
  "A student drops a ball from a height. Explain how the principle of conservation of energy applies to the ball as it falls to the ground."
);

const Q7_MIXED = section(
  "q7-shc",
  "q-short-answer",
  "Q7 - Specific Heat Capacity",
  "Use the formula E = mcΔT to calculate the energy required to heat 2 kg of water from 20°C to 70°C. The specific heat capacity of water is 4200 J/kg°C."
);

const Q8_HIGHER = section(
  "q8-power",
  "q-extended",
  "Q8 - Power and Work Done",
  "A motor lifts a 500 N weight through a height of 10 m in 20 seconds. Calculate the power of the motor. Show all your working."
);

const Q9_CHALLENGE = section(
  "q9-challenge",
  "q-challenge",
  "Q9 - Challenge Question",
  "A roller coaster car of mass 50 kg is at the top of a 10 m high track. It drops down to ground level. (Assume g = 9.8 N/kg and ignore friction/air resistance).\n\na) Calculate its gravitational potential energy at the top.\n\nb) State its kinetic energy at the bottom.\n\nc) Calculate its velocity at the bottom using KE = 0.5 × m × v²."
);

const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: At the top, the ball has...\nAs it falls, this energy is transferred to...\nThe total amount of energy...");
const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: The mass (m) is...\nThe temperature change (ΔT) is...\nThe energy (E) is calculated by...");

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED,
  referenceSankeySection(),
  Q5_MIXED,
  Q6_MIXED,
  referenceSHCSection(),
  Q7_MIXED,
  Q9_CHALLENGE,
  selfReflectionSection(),
];

const FOUNDATION_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_FOUNDATION,
  referenceSankeySection(),
  Q5_FOUNDATION,
  Q6_MIXED,
  referenceSHCSection(),
  Q7_MIXED,
  selfReflectionSection(),
];

const HIGHER_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q4_MIXED,
  referenceSankeySection(),
  Q5_MIXED,
  Q6_MIXED,
  referenceSHCSection(),
  Q7_MIXED,
  Q8_HIGHER,
  Q9_CHALLENGE,
  selfReflectionSection(),
];

const SCAFFOLDED_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_FOUNDATION,
  referenceSankeySection(),
  Q5_FOUNDATION,
  Q6_MIXED,
  SS_Q6,
  referenceSHCSection(),
  Q7_MIXED,
  SS_Q7,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Energy - Mixed (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Energy - Foundation (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Energy - Higher (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Energy - Scaffolded (Year 10 Physics)",
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
    topicTags: ["energy", "physics", "nano_banana", "worksheet_energy_y10"],
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
      "q1-energy-stores",
      DIAGRAM_ENERGY_STORES,
      "Diagram showing the 8 energy stores and 4 transfer pathways."
    );

    await ensureAsset(
      token,
      entryId,
      "reference-sankey",
      DIAGRAM_SANKEY,
      "Sankey diagram showing energy transfer and efficiency calculation."
    );
    
    await ensureAsset(
      token,
      entryId,
      "reference-shc",
      DIAGRAM_SHC,
      "Specific Heat Capacity formula triangle and worked example."
    );
  }

  console.log("\nEnergy curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
