#!/usr/bin/env node
/**
 * Seed script — Magnetism and Electromagnetism (Physics, Year 11)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Magnetism and Electromagnetism";
const YEAR_GROUP = "Year 11";
const SOURCE = "Adaptly Curated";

const DIAGRAM_MAGNETIC_FIELD = "/images/physics_magnetic_field_nb.png";
const DIAGRAM_MOTOR_EFFECT = "/images/physics_motor_effect_nb.png";
const DIAGRAM_TRANSFORMER = "/images/physics_transformer_nb.png";

const KEY_VOCAB = [
  { term: "Magnetic field", definition: "The region around a magnet where a force acts on another magnet or magnetic material." },
  { term: "Poles", definition: "The places on a magnet where the magnetic forces are strongest (North and South)." },
  { term: "Electromagnet", definition: "A solenoid with an iron core whose magnetic field can be turned on and off with an electric current." },
  { term: "Solenoid", definition: "A coil of wire that produces a magnetic field when carrying an electric current." },
  { term: "Motor effect", definition: "When a current-carrying wire in a magnetic field experiences a force." },
  { term: "Fleming's Left-Hand Rule", definition: "A rule used to find the direction of the force in the motor effect." },
  { term: "Magnetic flux density", definition: "A measure of the strength of a magnetic field, measured in Tesla (T)." },
  { term: "Electromagnetic induction", definition: "The production of a potential difference (voltage) across a conductor moving through a magnetic field." },
  { term: "Transformer", definition: "A device that changes the potential difference of an alternating current (AC) supply." },
  { term: "Step-up transformer", definition: "A transformer that increases voltage and decreases current." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Describe the magnetic field around a bar magnet and a solenoid.\n" +
  "2. Explain the motor effect and use Fleming's Left-Hand Rule.\n" +
  "3. Calculate the force on a conductor using F = B × I × l.\n" +
  "4. Explain how a transformer works and use the transformer equation.";

const KEY_VOCAB_CONTENT =
  "**Magnetic field** — The region around a magnet where a force acts on another magnet or magnetic material.\n" +
  "**Poles** — The places on a magnet where the magnetic forces are strongest (North and South).\n" +
  "**Electromagnet** — A solenoid with an iron core whose magnetic field can be turned on and off with an electric current.\n" +
  "**Solenoid** — A coil of wire that produces a magnetic field when carrying an electric current.\n" +
  "**Motor effect** — When a current-carrying wire in a magnetic field experiences a force.\n" +
  "**Fleming's Left-Hand Rule** — A rule used to find the direction of the force in the motor effect.\n" +
  "**Magnetic flux density** — A measure of the strength of a magnetic field, measured in Tesla (T).\n" +
  "**Electromagnetic induction** — The production of a potential difference (voltage) across a conductor moving through a magnetic field.\n" +
  "**Transformer** — A device that changes the potential difference of an alternating current (AC) supply.\n" +
  "**Step-up transformer** — A transformer that increases voltage and decreases current.";

const COMMON_MISTAKES =
  "1. Drawing magnetic field lines from South to North. They ALWAYS go from North to South.\n" +
  "2. Confusing the motor effect with electromagnetic induction. Motor effect = current + magnetic field -> movement. Induction = movement + magnetic field -> current.\n" +
  "3. Using the wrong hand for Fleming's rule. It must be the LEFT hand for motors.\n" +
  "4. Thinking transformers work with DC. Transformers ONLY work with alternating current (AC).";

const WORKED_EXAMPLE =
  "Worked example: The Transformer Equation\n\n" +
  "Question: A transformer has 100 turns on its primary coil and 500 turns on its secondary coil. The input voltage is 12V. Calculate the output voltage.\n\n" +
  "Step 1: State the formula. Vp / Vs = Np / Ns.\n" +
  "Step 2: Substitute values. 12 / Vs = 100 / 500.\n" +
  "Step 3: Simplify the ratio. 100 / 500 = 1 / 5.\n" +
  "Step 4: Rearrange and solve. 12 / Vs = 1 / 5, so Vs = 12 × 5 = 60.\n" +
  "Step 5: Add units. Output voltage = 60 V. (This is a step-up transformer).";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Magnetism?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can draw the magnetic field around a bar magnet.|Not yet|Almost|Got it!\n" +
  "I can use Fleming's Left-Hand Rule.|Not yet|Almost|Got it!\n" +
  "I can calculate force using F = B × I × l.|Not yet|Almost|Got it!\n" +
  "I can use the transformer equation.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "How do you make an electromagnet stronger?\n" +
  "Why do transformers only work with AC?\n" +
  "EXIT_TICKET: A wire of length 2m carries a current of 3A in a magnetic field of 0.5T. Calculate the force on the wire.";

const MARK_SCHEME =
  "**Q1 - Magnetic Field Diagram**\n" +
  "Lines go from North to South. Lines are closest together at the poles. Lines never cross.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (North to South)  2. True  3. False (Left hand)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Tesla)  2. A (AC only)  3. C (Increases voltage)\n\n" +
  "**Q4 - Electromagnets**\n" +
  "Increase the current, increase the number of turns on the coil, or add an iron core.\n\n" +
  "**Q5 - Motor Effect Calculations (F = BIl)**\n" +
  "a) F = 0.5 * 2 * 0.1 = 0.1 N\n" +
  "b) B = F / (I * l) = 0.6 / (3 * 0.2) = 1 T\n" +
  "c) I = F / (B * l) = 1.5 / (0.2 * 0.5) = 15 A\n\n" +
  "**Q6 - Fleming's Left-Hand Rule**\n" +
  "Thumb = Force (Motion). First finger = Magnetic Field (N to S). Second finger = Current (+ to -).\n\n" +
  "**Q7 - Transformers**\n" +
  "An alternating current in the primary coil creates a changing magnetic field in the iron core. This changing magnetic field induces an alternating potential difference in the secondary coil.\n\n" +
  "**Q8 - Challenge**\n" +
  "a) Vp/Vs = Np/Ns -> 230/Vs = 1000/50 -> 230/Vs = 20 -> Vs = 230/20 = 11.5 V\n" +
  "b) Step-down transformer (voltage decreases).\n" +
  "c) Assuming 100% efficiency: Vp * Ip = Vs * Is -> 230 * 0.5 = 11.5 * Is -> 115 = 11.5 * Is -> Is = 10 A.";

const TEACHER_NOTES =
  "- Ensure students actually use their left hand when practicing Fleming's rule.\n" +
  "- Remind students that length in F=BIl must be in meters (m), not cm.\n" +
  "- For transformers, emphasize the word 'changing' or 'alternating' magnetic field; a steady field will not induce a voltage.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-magnetism", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-magnetism", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-magnetism", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-magnetism", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-magnetic-field",
    title: "Q1 - Magnetic Field",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_MAGNETIC_FIELD,
    caption: "Magnetic field lines around a bar magnet.",
    content: "Describe three key features of the magnetic field lines shown in the diagram.",
  };
}

function referenceMotorSection() {
  return {
    id: "reference-motor-effect",
    title: "Reference - Motor Effect",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_MOTOR_EFFECT,
    caption: "The motor effect and Fleming's Left-Hand Rule.",
    content: "Use this reference to help answer questions about the motor effect.",
  };
}

function referenceTransformerSection() {
  return {
    id: "reference-transformer",
    title: "Reference - Transformer",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_TRANSFORMER,
    caption: "Diagram of a transformer and the transformer equation.",
    content: "Use this reference to help answer questions about transformers.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-magnetism", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. Magnetic field lines point from South to North.\n2. An electromagnet can be turned on and off.\n3. Fleming's Right-Hand Rule is used for the motor effect.\n4. Transformers only work with alternating current (AC)."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What is the unit of magnetic flux density?\nA. Joules\nB. Tesla\nC. Newtons\nD. Volts\n\n" +
    "2. What type of current is required for a transformer to work?\nA. Alternating Current (AC)\nB. Direct Current (DC)\nC. Both AC and DC\nD. Neither\n\n" +
    "3. What does a step-up transformer do?\nA. Decreases voltage\nB. Increases resistance\nC. Increases voltage\nD. Decreases power"
);

const Q4_MIXED = section(
  "q4-electromagnets",
  "q-short-answer",
  "Q4 - Electromagnets",
  "State three ways to increase the strength of an electromagnet."
);

const Q4_FOUNDATION = section(
  "q4-electromagnets",
  "q-short-answer",
  "Q4 - Electromagnets",
  "State three ways to increase the strength of an electromagnet. (Hint: think about the current, the coils, and the core)."
);

const Q5_MIXED = section(
  "q5-motor-effect",
  "q-short-answer",
  "Q5 - Motor Effect Calculations",
  "Use the equation F = B × I × l to calculate the missing values:\n\na) B = 0.5 T, I = 2 A, l = 0.1 m. Calculate Force.\n\nb) F = 0.6 N, I = 3 A, l = 0.2 m. Calculate Magnetic flux density (B).\n\nc) F = 1.5 N, B = 0.2 T, l = 0.5 m. Calculate Current (I)."
);

const Q5_FOUNDATION = section(
  "q5-motor-effect",
  "q-short-answer",
  "Q5 - Motor Effect Calculations",
  "Use the equation F = B × I × l to calculate the missing values:\n\na) B = 0.5 T, I = 2 A, l = 0.1 m. Calculate Force (F = 0.5 × 2 × 0.1).\n\nb) F = 0.6 N, I = 3 A, l = 0.2 m. Calculate Magnetic flux density (B = F ÷ (I × l)).\n\nc) F = 1.5 N, B = 0.2 T, l = 0.5 m. Calculate Current (I = F ÷ (B × l))."
);

const Q6_MIXED = section(
  "q6-flemings",
  "q-extended",
  "Q6 - Fleming's Left-Hand Rule",
  "Explain what each of the three fingers represents in Fleming's Left-Hand Rule."
);

const Q7_MIXED = section(
  "q7-transformers",
  "q-extended",
  "Q7 - How Transformers Work",
  "Explain how an alternating current in the primary coil of a transformer induces a potential difference in the secondary coil."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A transformer is used to connect a laptop charger to the mains supply. The primary coil has 1000 turns and is connected to a 230V AC supply. The secondary coil has 50 turns.\n\na) Calculate the output voltage of the secondary coil.\n\nb) State whether this is a step-up or step-down transformer.\n\nc) If the current in the primary coil is 0.5A, calculate the current in the secondary coil (assume 100% efficiency: Vp × Ip = Vs × Is)."
);

const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: The thumb represents...\nThe first finger represents...\nThe second finger represents...");
const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: An alternating current in the primary coil creates a...\nThis magnetic field travels through the...\nThis changing magnetic field induces a...");

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED,
  referenceMotorSection(),
  Q5_MIXED,
  Q6_MIXED,
  referenceTransformerSection(),
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
  referenceMotorSection(),
  Q5_FOUNDATION,
  Q6_MIXED,
  referenceTransformerSection(),
  Q7_MIXED,
  selfReflectionSection(),
];

const HIGHER_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q4_MIXED,
  referenceMotorSection(),
  Q5_MIXED,
  Q6_MIXED,
  referenceTransformerSection(),
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
  referenceMotorSection(),
  Q5_FOUNDATION,
  Q6_MIXED,
  SS_Q6,
  referenceTransformerSection(),
  Q7_MIXED,
  SS_Q7,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Magnetism and Electromagnetism - Mixed (Year 11 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Magnetism and Electromagnetism - Foundation (Year 11 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Magnetism and Electromagnetism - Higher (Year 11 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Magnetism and Electromagnetism - Scaffolded (Year 11 Physics)",
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
    topicTags: ["magnetism", "electromagnetism", "physics", "nano_banana", "worksheet_magnetism_y11"],
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
      "q1-magnetic-field",
      DIAGRAM_MAGNETIC_FIELD,
      "Magnetic field lines around a bar magnet."
    );

    await ensureAsset(
      token,
      entryId,
      "reference-motor-effect",
      DIAGRAM_MOTOR_EFFECT,
      "The motor effect and Fleming's Left-Hand Rule."
    );
    
    await ensureAsset(
      token,
      entryId,
      "reference-transformer",
      DIAGRAM_TRANSFORMER,
      "Diagram of a transformer and the transformer equation."
    );
  }

  console.log("\nMagnetism curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
