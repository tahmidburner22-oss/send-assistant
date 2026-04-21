#!/usr/bin/env node
/**
 * Seed script — Forces and Motion (Physics, Year 10)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Forces and Motion";
const YEAR_GROUP = "Year 10";
const SOURCE = "Adaptly Curated";

const DIAGRAM_FREE_BODY = "/images/physics_forces_free_body_nb.png";
const DIAGRAM_NEWTONS_LAWS = "/images/physics_newtons_laws_nb.png";
const DIAGRAM_RESULTANT = "/images/physics_resultant_forces_nb.png";

const KEY_VOCAB = [
  { term: "Force", definition: "A push or pull acting on an object, measured in Newtons (N)." },
  { term: "Resultant force", definition: "The single overall force acting on an object." },
  { term: "Friction", definition: "A force that opposes motion between two surfaces in contact." },
  { term: "Weight", definition: "The force of gravity acting on an object's mass." },
  { term: "Mass", definition: "The amount of matter in an object, measured in kilograms (kg)." },
  { term: "Acceleration", definition: "The rate of change of velocity." },
  { term: "Equilibrium", definition: "When all forces on an object are balanced (resultant force is zero)." },
  { term: "Newton's First Law", definition: "An object remains at rest or moves at constant velocity unless acted on by a resultant force." },
  { term: "Newton's Second Law", definition: "Force equals mass times acceleration (F = ma)." },
  { term: "Newton's Third Law", definition: "For every action, there is an equal and opposite reaction." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Identify and draw forces acting on objects using free body diagrams.\n" +
  "2. Calculate resultant forces and explain their effect on motion.\n" +
  "3. Apply Newton's Three Laws of Motion to real-world scenarios.\n" +
  "4. Use the equation F = ma to calculate force, mass, or acceleration.";

const KEY_VOCAB_CONTENT =
  "**Force** — A push or pull acting on an object, measured in Newtons (N).\n" +
  "**Resultant force** — The single overall force acting on an object.\n" +
  "**Friction** — A force that opposes motion between two surfaces in contact.\n" +
  "**Weight** — The force of gravity acting on an object's mass.\n" +
  "**Mass** — The amount of matter in an object, measured in kilograms (kg).\n" +
  "**Acceleration** — The rate of change of velocity.\n" +
  "**Equilibrium** — When all forces on an object are balanced (resultant force is zero).\n" +
  "**Newton's First Law** — An object remains at rest or moves at constant velocity unless acted on by a resultant force.\n" +
  "**Newton's Second Law** — Force equals mass times acceleration (F = ma).\n" +
  "**Newton's Third Law** — For every action, there is an equal and opposite reaction.";

const COMMON_MISTAKES =
  "1. Confusing mass and weight. Mass is the amount of matter (kg); weight is a force (N).\n" +
  "2. Thinking an object needs a force to keep moving. If forces are balanced, it will keep moving at a constant speed.\n" +
  "3. Forgetting to state the direction of a resultant force.\n" +
  "4. Mixing up action-reaction pairs. They act on *different* objects, not the same object.";

const WORKED_EXAMPLE =
  "Worked example: Calculating Acceleration\n\n" +
  "Question: A car of mass 1200 kg has a driving force of 5000 N and experiences a friction force of 1400 N. Calculate its acceleration.\n\n" +
  "Step 1: Find the resultant force. Resultant force = 5000 N - 1400 N = 3600 N.\n" +
  "Step 2: State the formula. F = ma.\n" +
  "Step 3: Rearrange for acceleration. a = F / m.\n" +
  "Step 4: Substitute values. a = 3600 / 1200.\n" +
  "Step 5: Calculate and add units. a = 3 m/s².";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Forces and Motion?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can draw and label free body diagrams.|Not yet|Almost|Got it!\n" +
  "I can calculate resultant forces.|Not yet|Almost|Got it!\n" +
  "I can state and apply Newton's Three Laws.|Not yet|Almost|Got it!\n" +
  "I can use the equation F = ma.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What is the difference between mass and weight?\n" +
  "Explain what happens to an object if the resultant force is zero.\n" +
  "EXIT_TICKET: A 50 kg object accelerates at 2 m/s². Calculate the resultant force acting on it.";

const MARK_SCHEME =
  "**Q1 - Free Body Diagram**\n" +
  "Weight (down), Normal Force (up), Applied Force (right), Friction (left).\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (Weight is a force, mass is not)  2. True  3. False (It can move at constant speed)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Newtons)  2. C (Zero)  3. A (F=ma)\n\n" +
  "**Q4 - Resultant Forces**\n" +
  "a) 10N right  b) 0N (balanced)  c) 5N left\n\n" +
  "**Q5 - Newton's Second Law Calculations**\n" +
  "a) F = 10 * 5 = 50 N\n" +
  "b) a = 200 / 50 = 4 m/s²\n" +
  "c) m = 100 / 2 = 50 kg\n\n" +
  "**Q6 - Newton's First Law**\n" +
  "The forces are balanced (resultant force is zero), so the car continues at a constant velocity.\n\n" +
  "**Q7 - Newton's Third Law**\n" +
  "The swimmer pushes backward on the water (action), and the water pushes forward on the swimmer with an equal and opposite force (reaction).\n\n" +
  "**Q8 - Terminal Velocity**\n" +
  "As speed increases, air resistance increases until it equals weight. Resultant force becomes zero, so acceleration stops and terminal velocity is reached.\n\n" +
  "**Q9 - Challenge**\n" +
  "a) Weight = 80 * 9.8 = 784 N\n" +
  "b) Resultant force = 1000 - 784 = 216 N upwards\n" +
  "c) a = F/m = 216 / 80 = 2.7 m/s² upwards";

const TEACHER_NOTES =
  "- Ensure students understand the difference between mass and weight early on.\n" +
  "- Emphasize that a resultant force of zero does not mean the object is stationary; it means acceleration is zero.\n" +
  "- When using F=ma, remind students that F is the *resultant* force, not just any applied force.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-forces", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-forces", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-forces", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-forces", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-free-body",
    title: "Q1 - Free Body Diagram",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_FREE_BODY,
    caption: "Free body diagram of a box being pushed.",
    content: "Identify the four forces acting on the box shown in the diagram.",
  };
}

function referenceDiagramSection() {
  return {
    id: "reference-newtons-laws",
    title: "Reference - Newton's Laws",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_NEWTONS_LAWS,
    caption: "Summary of Newton's Three Laws of Motion.",
    content: "Use this reference to help answer questions about Newton's Laws.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-forces", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. Mass and weight are the same thing.\n2. Friction always opposes motion.\n3. An object must have a resultant force acting on it to keep moving.\n4. If forces are balanced, the resultant force is zero."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What is the unit of force?\nA. Kilograms\nB. Newtons\nC. Joules\nD. Watts\n\n" +
    "2. What is the resultant force if a 10N force pulls left and a 10N force pulls right?\nA. 20N\nB. 10N\nC. 0N\nD. 100N\n\n" +
    "3. Which equation represents Newton's Second Law?\nA. F = ma\nB. W = mg\nC. v = d/t\nD. E = mc²"
);

const Q4_MIXED = section(
  "q4-resultant",
  "q-short-answer",
  "Q4 - Resultant Forces",
  "Calculate the resultant force and state its direction for each scenario:\n\na) 15N right and 5N left.\n\nb) 20N up and 20N down.\n\nc) 10N left and 5N right."
);

const Q4_FOUNDATION = section(
  "q4-resultant",
  "q-short-answer",
  "Q4 - Resultant Forces",
  "Calculate the resultant force and state its direction for each scenario. Hint: subtract the smaller force from the larger force.\n\na) 15N right and 5N left.\n\nb) 20N up and 20N down.\n\nc) 10N left and 5N right."
);

const Q5_MIXED = section(
  "q5-fma",
  "q-short-answer",
  "Q5 - Newton's Second Law (F = ma)",
  "Use the equation F = ma to calculate the missing values:\n\na) Mass = 10 kg, Acceleration = 5 m/s². Calculate Force.\n\nb) Force = 200 N, Mass = 50 kg. Calculate Acceleration.\n\nc) Force = 100 N, Acceleration = 2 m/s². Calculate Mass."
);

const Q5_FOUNDATION = section(
  "q5-fma",
  "q-short-answer",
  "Q5 - Newton's Second Law (F = ma)",
  "Use the equation F = ma to calculate the missing values:\n\na) Mass = 10 kg, Acceleration = 5 m/s². Calculate Force (F = 10 × 5).\n\nb) Force = 200 N, Mass = 50 kg. Calculate Acceleration (a = F ÷ m).\n\nc) Force = 100 N, Acceleration = 2 m/s². Calculate Mass (m = F ÷ a)."
);

const Q6_MIXED = section(
  "q6-first-law",
  "q-extended",
  "Q6 - Newton's First Law",
  "A car is travelling along a motorway at a constant speed of 70 mph. The driving force from the engine is 2000 N, and the total resistive forces (friction and air resistance) are 2000 N. Explain why the car continues to move at a constant speed."
);

const Q7_MIXED = section(
  "q7-third-law",
  "q-extended",
  "Q7 - Newton's Third Law",
  "Use Newton's Third Law to explain how a swimmer moves forward through the water."
);

const Q8_HIGHER = section(
  "q8-terminal-velocity",
  "q-extended",
  "Q8 - Terminal Velocity",
  "A skydiver jumps from a plane. Explain, in terms of forces and acceleration, how the skydiver reaches terminal velocity."
);

const Q9_CHALLENGE = section(
  "q9-challenge",
  "q-challenge",
  "Q9 - Challenge Question",
  "A rocket of mass 80 kg is launched vertically upwards. The engine provides an upward thrust of 1000 N. (Assume g = 9.8 N/kg).\n\na) Calculate the weight of the rocket.\n\nb) Calculate the resultant force acting on the rocket.\n\nc) Calculate the initial acceleration of the rocket."
);

const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: The driving force and resistive forces are...\nThis means the resultant force is...\nAccording to Newton's First Law...");
const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: The swimmer pushes...\nThe water pushes back with...\nThis is an example of...");

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED,
  Q5_MIXED,
  referenceDiagramSection(),
  Q6_MIXED,
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
  Q5_FOUNDATION,
  referenceDiagramSection(),
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
  referenceDiagramSection(),
  Q6_MIXED,
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
  Q5_FOUNDATION,
  referenceDiagramSection(),
  Q6_MIXED,
  SS_Q6,
  Q7_MIXED,
  SS_Q7,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Forces and Motion - Mixed (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Forces and Motion - Foundation (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Forces and Motion - Higher (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Forces and Motion - Scaffolded (Year 10 Physics)",
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
    topicTags: ["forces", "physics", "nano_banana", "worksheet_forces_motion_y10"],
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
      "q1-free-body",
      DIAGRAM_FREE_BODY,
      "Free body diagram showing forces on a box."
    );

    await ensureAsset(
      token,
      entryId,
      "reference-newtons-laws",
      DIAGRAM_NEWTONS_LAWS,
      "Diagram summarizing Newton's Three Laws of Motion."
    );
  }

  console.log("\nForces and Motion curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
