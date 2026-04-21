#!/usr/bin/env node
/**
 * Seed script — Electricity and Circuits (Physics, Year 10)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Electricity and Circuits";
const YEAR_GROUP = "Year 10";
const SOURCE = "Adaptly Curated";

const DIAGRAM_SERIES_PARALLEL = "/images/electrical-circuit.png"; // Reusing existing diagram

const KEY_VOCAB = [
  { term: "Current (I)", definition: "The rate of flow of electrical charge, measured in Amperes (A)." },
  { term: "Voltage (V)", definition: "The potential difference or 'push' that makes charge flow, measured in Volts (V)." },
  { term: "Resistance (R)", definition: "The opposition to the flow of current, measured in Ohms (Ω)." },
  { term: "Ohm's Law", definition: "Voltage equals current multiplied by resistance (V = I × R)." },
  { term: "Series circuit", definition: "A circuit with only one path for the current to flow." },
  { term: "Parallel circuit", definition: "A circuit with multiple branches or paths for the current to flow." },
  { term: "Conductor", definition: "A material that allows electrical current to flow easily." },
  { term: "Insulator", definition: "A material that does not allow electrical current to flow." },
  { term: "Ammeter", definition: "A device used to measure current, always connected in series." },
  { term: "Voltmeter", definition: "A device used to measure voltage, always connected in parallel." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Identify the differences between series and parallel circuits.\n" +
  "2. Explain how current and voltage behave in different types of circuits.\n" +
  "3. Use Ohm's Law (V = I × R) to calculate voltage, current, or resistance.\n" +
  "4. Draw and interpret standard circuit diagrams.";

const KEY_VOCAB_CONTENT =
  "**Current (I)** — The rate of flow of electrical charge, measured in Amperes (A).\n" +
  "**Voltage (V)** — The potential difference or 'push' that makes charge flow, measured in Volts (V).\n" +
  "**Resistance (R)** — The opposition to the flow of current, measured in Ohms (Ω).\n" +
  "**Ohm's Law** — Voltage equals current multiplied by resistance (V = I × R).\n" +
  "**Series circuit** — A circuit with only one path for the current to flow.\n" +
  "**Parallel circuit** — A circuit with multiple branches or paths for the current to flow.\n" +
  "**Conductor** — A material that allows electrical current to flow easily.\n" +
  "**Insulator** — A material that does not allow electrical current to flow.\n" +
  "**Ammeter** — A device used to measure current, always connected in series.\n" +
  "**Voltmeter** — A device used to measure voltage, always connected in parallel.";

const COMMON_MISTAKES =
  "1. Confusing voltage and current. Voltage is the 'push'; current is the 'flow'. They are NOT the same thing.\n" +
  "2. Using V = IR incorrectly. Always check units — Volts, Amps, Ohms. Rearrange before substituting.\n" +
  "3. Thinking current is 'used up' in a circuit. Current is the same throughout a series circuit — it is NOT consumed.\n" +
  "4. Forgetting parallel circuits share voltage equally. In parallel, each branch receives the full supply voltage.";

const WORKED_EXAMPLE =
  "Worked example: Applying Ohm's Law\n\n" +
  "Question: A resistor has a resistance of 15 Ω. The current through it is 2 A. Calculate the voltage across it.\n\n" +
  "Step 1: Select the correct formula. V = I × R.\n" +
  "Step 2: Substitute values. V = 2 A × 15 Ω.\n" +
  "Step 3: Calculate. V = 30.\n" +
  "Step 4: Add units. Always include the unit — in this case Volts (V). V = 30 V.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Electricity and Circuits?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can explain the difference between series and parallel circuits.|Not yet|Almost|Got it!\n" +
  "I can use Ohm's Law (V = I × R).|Not yet|Almost|Got it!\n" +
  "I know how to connect ammeters and voltmeters.|Not yet|Almost|Got it!\n" +
  "I can draw circuit diagrams using standard symbols.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What happens to the current in a series circuit?\n" +
  "Why are houses wired in parallel rather than series?\n" +
  "EXIT_TICKET: A circuit has a 12V battery and a 4Ω resistor. Calculate the current.";

const MARK_SCHEME =
  "**Q1 - Circuit Symbols**\n" +
  "Battery, Switch, Lamp/Bulb, Resistor, Ammeter, Voltmeter.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (Current is measured in Amperes)  2. True  3. False (Parallel reduces total resistance)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (6 V)  2. A (Series)  3. C (Parallel)\n\n" +
  "**Q4 - Ohm's Law Calculations**\n" +
  "a) V = 3 * 10 = 30 V\n" +
  "b) I = 12 / 4 = 3 A\n" +
  "c) R = 24 / 2 = 12 Ω\n\n" +
  "**Q5 - Series vs Parallel**\n" +
  "Series: Current is the same everywhere. Voltage is shared between components. If one bulb breaks, the circuit is broken and all bulbs go out.\n" +
  "Parallel: Current splits down different branches. Voltage is the same across each branch. If one bulb breaks, the others stay on.\n\n" +
  "**Q6 - Adding Components**\n" +
  "Adding a bulb in series increases the total resistance. This decreases the current, so all bulbs become dimmer.\n\n" +
  "**Q7 - Measuring Instruments**\n" +
  "Ammeter measures current and is connected in series. Voltmeter measures voltage and is connected in parallel across the component.\n\n" +
  "**Q8 - Challenge**\n" +
  "a) Parallel circuit. Each room gets the full 9V and can be controlled independently.\n" +
  "b) I = V/R = 9/6 = 1.5 A per bulb.\n" +
  "c) Total current = 3 * 1.5 = 4.5 A.\n" +
  "d) The other bulbs remain on and their brightness does not change.";

const TEACHER_NOTES =
  "- Ensure students understand that current is NOT 'used up' by components.\n" +
  "- Emphasize the difference between connecting an ammeter (series) and a voltmeter (parallel).\n" +
  "- Use the water pipe analogy if students struggle with voltage (pressure) vs current (flow rate).";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-electricity", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-electricity", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-electricity", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-electricity", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-circuit-diagram",
    title: "Q1 - Circuit Diagram",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_SERIES_PARALLEL,
    caption: "Diagram showing series and parallel circuits.",
    content: "Identify the components shown in the circuit diagrams.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-electricity", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. Electrical current is measured in volts.\n2. In a series circuit, the current is the same at every point.\n3. Adding more resistors in parallel increases the total resistance.\n4. A switch in the open position breaks the circuit, stopping current flow."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. A lamp has resistance 12 Ω and a current of 0.5 A flows through it. What is the potential difference across the lamp?\nA. 0.042 V\nB. 6 V\nC. 12.5 V\nD. 24 V\n\n" +
    "2. How should an ammeter be connected in a circuit?\nA. In series\nB. In parallel\nC. Across the battery\nD. It doesn't matter\n\n" +
    "3. How should a voltmeter be connected in a circuit?\nA. In series\nB. Next to the switch\nC. In parallel across the component\nD. It doesn't matter"
);

const Q4_MIXED = section(
  "q4-ohms-law",
  "q-short-answer",
  "Q4 - Ohm's Law Calculations",
  "Use the equation V = I × R to calculate the missing values:\n\na) Current = 3 A, Resistance = 10 Ω. Calculate Voltage.\n\nb) Voltage = 12 V, Resistance = 4 Ω. Calculate Current.\n\nc) Voltage = 24 V, Current = 2 A. Calculate Resistance."
);

const Q4_FOUNDATION = section(
  "q4-ohms-law",
  "q-short-answer",
  "Q4 - Ohm's Law Calculations",
  "Use the equation V = I × R to calculate the missing values:\n\na) Current = 3 A, Resistance = 10 Ω. Calculate Voltage (V = 3 × 10).\n\nb) Voltage = 12 V, Resistance = 4 Ω. Calculate Current (I = V ÷ R).\n\nc) Voltage = 24 V, Current = 2 A. Calculate Resistance (R = V ÷ I)."
);

const Q5_MIXED = section(
  "q5-series-parallel",
  "q-extended",
  "Q5 - Series vs Parallel",
  "Compare the behaviour of current and voltage in a series circuit and a parallel circuit. Clearly identify the key differences."
);

const Q6_MIXED = section(
  "q6-adding-components",
  "q-extended",
  "Q6 - Adding Components",
  "Explain what happens to the brightness of all the bulbs in a series circuit when an additional identical bulb is added. Use the terms resistance, current and voltage in your answer."
);

const Q7_MIXED = section(
  "q7-measuring",
  "q-short-answer",
  "Q7 - Measuring Instruments",
  "Explain the difference between an ammeter and a voltmeter, including how each must be connected in a circuit."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A student is designing a circuit for a model house with three rooms. Each room needs an independent light that can be switched on and off without affecting the other rooms. The battery supplies 9 V and each bulb has a resistance of 6 Ω.\n\na) Describe the circuit type you would use and justify your choice.\n\nb) Calculate the current through each bulb when all three are on.\n\nc) Calculate the total current drawn from the battery.\n\nd) What happens to the remaining bulbs if one bulb blows?"
);

const SS_Q5 = section("ss-q5", "sentence-starters", "Q5 - Sentence Starters", "Sentence starters: In a series circuit, the current is...\nIn a parallel circuit, the current...\nThe voltage in a series circuit is...\nThe voltage in a parallel circuit is...");
const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: Adding a bulb increases the total...\nThis causes the current to...\nTherefore, the brightness of the bulbs will...");

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
  Q5_MIXED,
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
  Q5_MIXED,
  SS_Q5,
  Q6_MIXED,
  SS_Q6,
  Q7_MIXED,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Electricity and Circuits - Mixed (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Electricity and Circuits - Foundation (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Electricity and Circuits - Higher (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Electricity and Circuits - Scaffolded (Year 10 Physics)",
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
    topicTags: ["electricity", "circuits", "physics", "worksheet_electricity_y10"],
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
      "q1-circuit-diagram",
      DIAGRAM_SERIES_PARALLEL,
      "Diagram showing series and parallel circuits."
    );
  }

  console.log("\nElectricity and Circuits curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
