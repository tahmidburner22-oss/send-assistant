#!/usr/bin/env node
/**
 * Seed script — Motion Graphs (Physics, Year 9)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Motion Graphs";
const YEAR_GROUP = "Year 9";
const SOURCE = "Adaptly Curated";

const DIAGRAM_MOTION_GRAPHS = "/images/physics_motion_graphs_nb.png";

const KEY_VOCAB = [
  { term: "Distance", definition: "How far an object has travelled, measured in metres (m)." },
  { term: "Displacement", definition: "The straight-line distance from the start point to the end point, including direction." },
  { term: "Speed", definition: "How fast an object is moving, measured in metres per second (m/s)." },
  { term: "Velocity", definition: "Speed in a given direction (a vector quantity)." },
  { term: "Acceleration", definition: "The rate at which velocity changes, measured in m/s²." },
  { term: "Deceleration", definition: "Negative acceleration (slowing down)." },
  { term: "Gradient", definition: "The steepness of a line on a graph (rise ÷ run)." },
  { term: "Distance-time graph", definition: "A graph showing how far an object has travelled over time." },
  { term: "Velocity-time graph", definition: "A graph showing how an object's velocity changes over time." },
  { term: "Stationary", definition: "Not moving (at rest)." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Interpret the shape of lines on distance-time and velocity-time graphs.\n" +
  "2. Calculate speed from the gradient of a distance-time graph.\n" +
  "3. Calculate acceleration from the gradient of a velocity-time graph.\n" +
  "4. Calculate distance travelled from the area under a velocity-time graph.";

const KEY_VOCAB_CONTENT =
  "**Distance** — How far an object has travelled, measured in metres (m).\n" +
  "**Displacement** — The straight-line distance from the start point to the end point, including direction.\n" +
  "**Speed** — How fast an object is moving, measured in metres per second (m/s).\n" +
  "**Velocity** — Speed in a given direction (a vector quantity).\n" +
  "**Acceleration** — The rate at which velocity changes, measured in m/s².\n" +
  "**Deceleration** — Negative acceleration (slowing down).\n" +
  "**Gradient** — The steepness of a line on a graph (rise ÷ run).\n" +
  "**Distance-time graph** — A graph showing how far an object has travelled over time.\n" +
  "**Velocity-time graph** — A graph showing how an object's velocity changes over time.\n" +
  "**Stationary** — Not moving (at rest).";

const COMMON_MISTAKES =
  "1. Confusing the two types of graphs. A horizontal line means 'stationary' on a distance-time graph, but it means 'constant speed' on a velocity-time graph.\n" +
  "2. Calculating gradient incorrectly. Always use (change in y) ÷ (change in x).\n" +
  "3. Forgetting units. Acceleration is m/s², not m/s.\n" +
  "4. Reading the wrong axis. Always check if the y-axis says 'Distance' or 'Velocity' before answering.";

const WORKED_EXAMPLE =
  "Worked example: Calculating from a Velocity-Time Graph\n\n" +
  "Question: A car accelerates from 0 m/s to 20 m/s in 5 seconds. Calculate its acceleration and the distance travelled.\n\n" +
  "Step 1: Calculate acceleration (gradient). a = change in velocity ÷ time.\n" +
  "Step 2: Substitute values. a = (20 - 0) ÷ 5 = 20 ÷ 5 = 4 m/s².\n" +
  "Step 3: Calculate distance (area under graph). The shape is a triangle.\n" +
  "Step 4: Area of triangle = 0.5 × base × height.\n" +
  "Step 5: Substitute values. Distance = 0.5 × 5 × 20 = 50 m.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Motion Graphs?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can tell the difference between distance-time and velocity-time graphs.|Not yet|Almost|Got it!\n" +
  "I can calculate speed from a distance-time graph.|Not yet|Almost|Got it!\n" +
  "I can calculate acceleration from a velocity-time graph.|Not yet|Almost|Got it!\n" +
  "I can calculate distance from the area under a velocity-time graph.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What does a horizontal line mean on a distance-time graph?\n" +
  "What does a horizontal line mean on a velocity-time graph?\n" +
  "EXIT_TICKET: On a velocity-time graph, what does the gradient represent?";

const MARK_SCHEME =
  "**Q1 - Motion Graphs Diagram**\n" +
  "Distance-time graph: A horizontal line means stationary. A diagonal line means constant speed.\nVelocity-time graph: A horizontal line means constant velocity. A diagonal line means acceleration.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It means constant velocity)  2. True  3. False (It represents acceleration)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Stationary)  2. A (Acceleration)  3. C (Distance travelled)\n\n" +
  "**Q4 - Distance-Time Calculations**\n" +
  "a) Speed = Distance / Time = 100 / 20 = 5 m/s.\n" +
  "b) Speed = Distance / Time = 50 / 10 = 5 m/s.\n\n" +
  "**Q5 - Velocity-Time Calculations**\n" +
  "a) Acceleration = Change in velocity / Time = (30 - 0) / 10 = 3 m/s².\n" +
  "b) Distance = Area of triangle = 0.5 * base * height = 0.5 * 10 * 30 = 150 m.\n\n" +
  "**Q6 - Comparing Graphs**\n" +
  "On a distance-time graph, a straight diagonal line means the object is moving at a constant speed (distance is increasing at a steady rate). On a velocity-time graph, a straight diagonal line means the object is accelerating (velocity is increasing at a steady rate).\n\n" +
  "**Q7 - Deceleration**\n" +
  "Deceleration is negative acceleration (slowing down). On a velocity-time graph, it is shown as a line sloping downwards towards the x-axis.\n\n" +
  "**Q8 - Challenge**\n" +
  "a) Acceleration = (25 - 0) / 10 = 2.5 m/s².\n" +
  "b) Distance while accelerating (triangle) = 0.5 * 10 * 25 = 125 m.\n" +
  "c) Distance at constant speed (rectangle) = 20 * 25 = 500 m.\n" +
  "d) Total distance = 125 + 500 = 625 m.";

const TEACHER_NOTES =
  "- Constantly remind students to check the y-axis label before answering any question.\n" +
  "- When calculating the area under a graph, encourage students to split complex shapes into simple rectangles and triangles.\n" +
  "- Emphasize that 'gradient' is just a mathematical term for 'steepness'.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-motion-graphs", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-motion-graphs", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-motion-graphs", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-motion-graphs", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-motion-graphs",
    title: "Q1 - Motion Graphs",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_MOTION_GRAPHS,
    caption: "Comparison of distance-time and velocity-time graphs.",
    content: "Look at the two graphs. What does a horizontal line mean on each graph?",
  };
}

function selfReflectionSection() {
  return section("self-reflection-motion-graphs", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. A horizontal line on a velocity-time graph means the object is stationary.\n2. The gradient of a distance-time graph represents speed.\n3. The gradient of a velocity-time graph represents distance.\n4. The area under a velocity-time graph represents distance travelled."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What does a horizontal line on a distance-time graph mean?\nA. Constant speed\nB. Stationary (not moving)\nC. Accelerating\nD. Decelerating\n\n" +
    "2. What does a straight diagonal line going up on a velocity-time graph mean?\nA. Constant acceleration\nB. Constant speed\nC. Stationary\nD. Deceleration\n\n" +
    "3. How do you find the distance travelled from a velocity-time graph?\nA. Read the y-axis\nB. Calculate the gradient\nC. Calculate the area under the line\nD. Read the x-axis"
);

const Q4_MIXED = section(
  "q4-dt-calc",
  "q-short-answer",
  "Q4 - Distance-Time Calculations",
  "a) A car travels 100 m in 20 s. Calculate its speed.\n\nb) On a distance-time graph, a line goes from (0s, 0m) to (10s, 50m). Calculate the gradient (speed)."
);

const Q4_FOUNDATION = section(
  "q4-dt-calc",
  "q-short-answer",
  "Q4 - Distance-Time Calculations",
  "a) A car travels 100 m in 20 s. Calculate its speed (Speed = Distance ÷ Time).\n\nb) On a distance-time graph, a line goes from 0m to 50m in 10s. Calculate the speed (50 ÷ 10)."
);

const Q5_MIXED = section(
  "q5-vt-calc",
  "q-short-answer",
  "Q5 - Velocity-Time Calculations",
  "A car accelerates from 0 m/s to 30 m/s in 10 seconds.\n\na) Calculate its acceleration (Change in velocity ÷ Time).\n\nb) Calculate the distance travelled during this time (Area of a triangle = 0.5 × base × height)."
);

const Q6_MIXED = section(
  "q6-compare",
  "q-extended",
  "Q6 - Comparing Graphs",
  "Explain the difference between a straight diagonal line on a distance-time graph and a straight diagonal line on a velocity-time graph."
);

const Q7_MIXED = section(
  "q7-deceleration",
  "q-short-answer",
  "Q7 - Deceleration",
  "What is deceleration, and how is it shown on a velocity-time graph?"
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A train accelerates from 0 m/s to 25 m/s in 10 seconds. It then travels at a constant velocity of 25 m/s for 20 seconds.\n\na) Calculate the acceleration during the first 10 seconds.\n\nb) Calculate the distance travelled while accelerating.\n\nc) Calculate the distance travelled at constant velocity.\n\nd) Calculate the total distance travelled."
);

const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: On a distance-time graph, a diagonal line means...\nThis is because the distance is...\nOn a velocity-time graph, a diagonal line means...\nThis is because the velocity is...");

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
  Q6_MIXED,
  SS_Q6,
  Q7_MIXED,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Motion Graphs - Mixed (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Motion Graphs - Foundation (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Motion Graphs - Higher (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Motion Graphs - Scaffolded (Year 9 Physics)",
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
    topicTags: ["motion graphs", "physics", "nano_banana", "worksheet_motion_graphs_y9"],
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
      "q1-motion-graphs",
      DIAGRAM_MOTION_GRAPHS,
      "Comparison of distance-time and velocity-time graphs."
    );
  }

  console.log("\nMotion Graphs (Year 9) curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
