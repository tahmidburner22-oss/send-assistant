#!/usr/bin/env node
/**
 * Seed script — Circuit Diagrams and Symbols (Physics, Year 10)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Circuit Diagrams and Symbols";
const YEAR_GROUP = "Year 10";
const SOURCE = "Adaptly Curated";

const DIAGRAM_SYMBOLS = "/images/physics_circuit_symbols_nb.png";

const KEY_VOCAB = [
  { term: "Circuit diagram", definition: "A simplified drawing of an electrical circuit using standard symbols." },
  { term: "Component", definition: "Any part of an electrical circuit (e.g., a bulb, a switch, a resistor)." },
  { term: "Cell", definition: "A single electrical energy source that pushes current around a circuit." },
  { term: "Battery", definition: "Two or more cells connected together in series." },
  { term: "Switch", definition: "A component used to open or close a circuit, controlling the flow of current." },
  { term: "Resistor", definition: "A component that opposes the flow of current, reducing it." },
  { term: "Variable resistor", definition: "A resistor whose resistance can be changed to control the current." },
  { term: "Diode", definition: "A component that only allows current to flow in one direction." },
  { term: "LED", definition: "Light Emitting Diode; a diode that gives off light when current flows through it." },
  { term: "Thermistor", definition: "A resistor whose resistance decreases as temperature increases." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Identify and draw standard electrical circuit symbols.\n" +
  "2. Draw accurate circuit diagrams from written descriptions.\n" +
  "3. Interpret circuit diagrams to explain how a circuit will behave.\n" +
  "4. Understand the function of specific components like diodes and thermistors.";

const KEY_VOCAB_CONTENT =
  "**Circuit diagram** — A simplified drawing of an electrical circuit using standard symbols.\n" +
  "**Component** — Any part of an electrical circuit (e.g., a bulb, a switch, a resistor).\n" +
  "**Cell** — A single electrical energy source that pushes current around a circuit.\n" +
  "**Battery** — Two or more cells connected together in series.\n" +
  "**Switch** — A component used to open or close a circuit, controlling the flow of current.\n" +
  "**Resistor** — A component that opposes the flow of current, reducing it.\n" +
  "**Variable resistor** — A resistor whose resistance can be changed to control the current.\n" +
  "**Diode** — A component that only allows current to flow in one direction.\n" +
  "**LED** — Light Emitting Diode; a diode that gives off light when current flows through it.\n" +
  "**Thermistor** — A resistor whose resistance decreases as temperature increases.";

const COMMON_MISTAKES =
  "1. Confusing a cell and a battery. A cell is one unit (one long line, one short line). A battery is two or more cells joined together.\n" +
  "2. Drawing messy wires. Wires in circuit diagrams must always be drawn as straight lines with sharp 90-degree corners using a ruler.\n" +
  "3. Leaving gaps in the circuit. If there is a gap (other than an open switch), the current cannot flow.\n" +
  "4. Connecting voltmeters in series. Voltmeters must always be connected in *parallel* across a component.";

const WORKED_EXAMPLE =
  "Worked example: Drawing a Circuit Diagram\n\n" +
  "Question: Draw a circuit diagram for a circuit containing a battery, a closed switch, and two bulbs in series. Add an ammeter to measure the current and a voltmeter to measure the voltage across the first bulb.\n\n" +
  "Step 1: Draw the battery (two cells) at the top.\n" +
  "Step 2: Draw straight wires down to a closed switch.\n" +
  "Step 3: Draw the two bulbs (circles with crosses) in a single loop (series).\n" +
  "Step 4: Add the ammeter (circle with A) anywhere in the main loop.\n" +
  "Step 5: Add the voltmeter (circle with V) in a separate parallel branch *only* across the first bulb.\n" +
  "Step 6: Check all wires are straight and there are no gaps.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Circuit Diagrams?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can identify standard circuit symbols.|Not yet|Almost|Got it!\n" +
  "I can draw a circuit diagram from a description.|Not yet|Almost|Got it!\n" +
  "I know the difference between a cell and a battery.|Not yet|Almost|Got it!\n" +
  "I know how to connect ammeters and voltmeters.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What is the rule for drawing wires in a circuit diagram?\n" +
  "What does a diode do in a circuit?\n" +
  "EXIT_TICKET: Draw the symbol for a variable resistor.";

const MARK_SCHEME =
  "**Q1 - Labelling Circuit Symbols**\n" +
  "Top row: Battery, Switch, Lamp/Bulb, Resistor.\nMiddle row: Variable Resistor, Ammeter, Voltmeter, LED.\nBottom row: Diode, Capacitor, Fuse, Thermistor.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (A battery is two or more cells)  2. True  3. False (It must be in parallel)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Diode)  2. C (Thermistor)  3. A (Rectangle with an arrow through it)\n\n" +
  "**Q4 - Drawing a Circuit (Series)**\n" +
  "Diagram must show: One single rectangular loop of wire. A cell (one long, one short line). An open switch. A lamp (circle with X). An ammeter (circle with A) in the main loop. All lines straight, no gaps.\n\n" +
  "**Q5 - Drawing a Circuit (Parallel)**\n" +
  "Diagram must show: A battery (at least two cells). Main wire splitting into two branches. One resistor (rectangle) on the top branch. One LED (triangle with line and arrows pointing away) on the bottom branch. A voltmeter (circle with V) connected in parallel across the battery.\n\n" +
  "**Q6 - Analysing a Circuit Diagram**\n" +
  "a) The circuit contains a battery, a closed switch, a variable resistor, and a motor (or bulb depending on diagram provided).\n" +
  "b) If the switch is opened, the current will stop flowing and the components will turn off.\n" +
  "c) If the resistance of the variable resistor is increased, the current in the circuit will decrease.\n\n" +
  "**Q7 - Component Functions**\n" +
  "a) A fuse melts and breaks the circuit if the current gets too high, protecting the components.\n" +
  "b) An LED emits light when current flows through it, but only allows current to flow in one direction.\n\n" +
  "**Q8 - Challenge**\n" +
  "Diagram must show: A battery. A thermistor and a fixed resistor in series. A voltmeter connected in parallel across the thermistor. Explanation: As temperature increases, the resistance of the thermistor decreases. This means it takes a smaller share of the total voltage, so the reading on the voltmeter will decrease.";

const TEACHER_NOTES =
  "- Ensure students use rulers for all circuit diagrams. Freehand diagrams are often penalized in exams.\n" +
  "- Remind students that the long line on a cell symbol is the positive terminal and the short thick line is the negative terminal.\n" +
  "- For the drawing questions, provide blank space or a grid for students to draw in.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-circuit-symbols", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-circuit-symbols", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-circuit-symbols", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-circuit-symbols", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-circuit-symbols",
    title: "Q1 - Labelling Circuit Symbols",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_SYMBOLS,
    caption: "Standard IEC circuit symbols.",
    content: "Look at the diagram. Cover the names with your hand and try to name all 12 symbols from memory. Then, write down the names of the symbols in the middle row.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-circuit-symbols", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. A cell and a battery are exactly the same thing.\n2. Wires in a circuit diagram must be drawn as straight lines.\n3. A voltmeter should be connected in series with a component.\n4. A diode only allows current to flow in one direction."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. Which component only allows current to flow in one direction?\nA. Resistor\nB. Diode\nC. Capacitor\nD. Fuse\n\n" +
    "2. Which component's resistance changes depending on the temperature?\nA. Variable resistor\nB. LDR (Light Dependent Resistor)\nC. Thermistor\nD. LED\n\n" +
    "3. What is the symbol for a variable resistor?\nA. A rectangle with an arrow through it\nB. A circle with a V in it\nC. A rectangle with a line through it\nD. A triangle with a line"
);

const Q4_MIXED = section(
  "q4-drawing-series",
  "q-extended",
  "Q4 - Drawing a Series Circuit",
  "Draw a circuit diagram for a circuit containing:\n- A single cell\n- An open switch\n- A lamp\n- An ammeter\nAll components must be connected in series. Use a ruler."
);

const Q5_MIXED = section(
  "q5-drawing-parallel",
  "q-extended",
  "Q5 - Drawing a Parallel Circuit",
  "Draw a circuit diagram for a circuit containing:\n- A battery\n- Two parallel branches\n- A fixed resistor on the top branch\n- An LED on the bottom branch\n- A voltmeter measuring the voltage across the battery."
);

const Q6_MIXED = section(
  "q6-analysing",
  "q-extended",
  "Q6 - Analysing a Circuit",
  "Imagine a circuit with a battery, a closed switch, and a variable resistor connected in series with a lamp.\n\na) List the components in this circuit.\n\nb) What will happen to the lamp if the switch is opened?\n\nc) What will happen to the brightness of the lamp if the resistance of the variable resistor is increased?"
);

const Q7_MIXED = section(
  "q7-functions",
  "q-short-answer",
  "Q7 - Component Functions",
  "Explain the function of the following components in a circuit:\n\na) A fuse\n\nb) An LED"
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "Draw a circuit diagram containing a battery, a thermistor, and a fixed resistor in series. Add a voltmeter to measure the potential difference across the thermistor.\n\nExplain what will happen to the reading on the voltmeter if the temperature of the thermistor increases."
);

const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: The components are...\nIf the switch is opened, the circuit is broken so...\nIf resistance increases, the current will...\nThis means the lamp will get...");
const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: A fuse is designed to...\nIf the current gets too high, it...\nAn LED is a diode that...");

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
  Q4_MIXED,
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
  Q4_MIXED,
  Q5_MIXED,
  Q6_MIXED,
  SS_Q6,
  Q7_MIXED,
  SS_Q7,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Circuit Diagrams and Symbols - Mixed (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Circuit Diagrams and Symbols - Foundation (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Circuit Diagrams and Symbols - Higher (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Circuit Diagrams and Symbols - Scaffolded (Year 10 Physics)",
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
    topicTags: ["circuit symbols", "electricity", "physics", "nano_banana", "worksheet_circuit_symbols_y10"],
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
      "q1-circuit-symbols",
      DIAGRAM_SYMBOLS,
      "Standard IEC circuit symbols."
    );
  }

  console.log("\nCircuit Diagrams and Symbols curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
