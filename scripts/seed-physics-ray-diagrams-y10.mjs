#!/usr/bin/env node
/**
 * Seed script — Ray Diagrams (Physics, Year 10)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Ray Diagrams";
const YEAR_GROUP = "Year 10";
const SOURCE = "Adaptly Curated";

const DIAGRAM_LENS = "/images/physics_ray_diagram_lens_nb.png";
const DIAGRAM_REFLECTION = "/images/physics_light_reflection_nb.png";

const KEY_VOCAB = [
  { term: "Convex lens", definition: "A lens that is thicker in the middle than at the edges, causing parallel rays to converge." },
  { term: "Concave lens", definition: "A lens that is thinner in the middle than at the edges, causing parallel rays to diverge." },
  { term: "Principal axis", definition: "An imaginary straight line passing through the center of the lens." },
  { term: "Focal point (F)", definition: "The point where parallel rays of light converge after passing through a convex lens." },
  { term: "Focal length", definition: "The distance from the center of the lens to the focal point." },
  { term: "Real image", definition: "An image formed where light rays actually meet. It can be projected onto a screen." },
  { term: "Virtual image", definition: "An image formed where light rays appear to come from. It cannot be projected onto a screen." },
  { term: "Inverted", definition: "Upside down compared to the original object." },
  { term: "Magnified", definition: "Larger than the original object." },
  { term: "Diminished", definition: "Smaller than the original object." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Draw and complete ray diagrams for convex and concave lenses.\n" +
  "2. Describe the properties of images formed by lenses (real/virtual, inverted/upright, magnified/diminished).\n" +
  "3. Explain how the position of the object affects the image formed by a convex lens.\n" +
  "4. Calculate magnification using the magnification equation.";

const KEY_VOCAB_CONTENT =
  "**Convex lens** — A lens that is thicker in the middle than at the edges, causing parallel rays to converge.\n" +
  "**Concave lens** — A lens that is thinner in the middle than at the edges, causing parallel rays to diverge.\n" +
  "**Principal axis** — An imaginary straight line passing through the center of the lens.\n" +
  "**Focal point (F)** — The point where parallel rays of light converge after passing through a convex lens.\n" +
  "**Focal length** — The distance from the center of the lens to the focal point.\n" +
  "**Real image** — An image formed where light rays actually meet. It can be projected onto a screen.\n" +
  "**Virtual image** — An image formed where light rays appear to come from. It cannot be projected onto a screen.\n" +
  "**Inverted** — Upside down compared to the original object.\n" +
  "**Magnified** — Larger than the original object.\n" +
  "**Diminished** — Smaller than the original object.";

const COMMON_MISTAKES =
  "1. Forgetting to draw arrows on light rays. Without arrows, they are just lines, not rays.\n" +
  "2. Drawing rays bending at the wrong place. Rays should bend exactly at the vertical axis running through the center of the lens.\n" +
  "3. Confusing real and virtual images. If the solid lines cross, it's a real image. If you have to trace dashed lines backwards to make them cross, it's a virtual image.\n" +
  "4. Mixing up convex and concave shapes. Convex bulges outwards; concave caves inwards.";

const WORKED_EXAMPLE =
  "Worked example: Calculating Magnification\n\n" +
  "Question: An object is 5 cm tall. A convex lens forms an image of the object that is 15 cm tall. Calculate the magnification.\n\n" +
  "Step 1: State the formula. Magnification = Image height ÷ Object height.\n" +
  "Step 2: Identify the values. Image height = 15 cm. Object height = 5 cm.\n" +
  "Step 3: Substitute the values. Magnification = 15 ÷ 5.\n" +
  "Step 4: Calculate the result. Magnification = 3.\n" +
  "Step 5: Note the units. Magnification is a ratio, so it has no units. The answer is just 3 (or ×3).";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Ray Diagrams?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can draw the three standard rays for a convex lens.|Not yet|Almost|Got it!\n" +
  "I can describe an image as real/virtual, inverted/upright, and magnified/diminished.|Not yet|Almost|Got it!\n" +
  "I can calculate magnification.|Not yet|Almost|Got it!\n" +
  "I know the difference between a convex and concave lens.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What is the difference between a real and a virtual image?\n" +
  "What happens to rays of light when they pass through the exact center of a lens?\n" +
  "EXIT_TICKET: An object is 2 cm tall and its image is 8 cm tall. What is the magnification?";

const MARK_SCHEME =
  "**Q1 - Ray Diagram Analysis**\n" +
  "a) Convex (converging) lens.\n" +
  "b) The image is Real, Inverted, and Diminished (smaller than the object).\n" +
  "c) Ray 1 goes parallel to the axis then through F. Ray 2 goes straight through the center. Ray 3 goes through F then parallel to the axis.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It causes them to diverge/spread out)  2. True  3. False (It has no units)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Real)  2. A (It passes straight through without bending)  3. C (Image height ÷ Object height)\n\n" +
  "**Q4 - Magnification Calculations**\n" +
  "a) Magnification = 12 / 4 = 3.\n" +
  "b) Image height = Magnification * Object height = 0.5 * 10 = 5 cm.\n" +
  "c) Object height = Image height / Magnification = 20 / 4 = 5 cm.\n\n" +
  "**Q5 - Drawing Ray Diagrams**\n" +
  "Diagram must show: A convex lens symbol. An object arrow between F and 2F. Ray 1 parallel to axis, refracting through F on the other side. Ray 2 straight through the center. The rays should meet beyond 2F on the other side. The image arrow should be drawn from the axis down to where the rays meet. The image is Real, Inverted, and Magnified.\n\n" +
  "**Q6 - Real vs Virtual Images**\n" +
  "A real image is formed where light rays actually converge and meet. It can be projected onto a screen. A virtual image is formed where light rays appear to diverge from. It cannot be projected onto a screen (e.g., looking in a mirror or through a magnifying glass).\n\n" +
  "**Q7 - The Magnifying Glass**\n" +
  "To use a convex lens as a magnifying glass, the object must be placed closer to the lens than the focal point (between the lens and F). This produces a virtual, upright, and magnified image.\n\n" +
  "**Q8 - Challenge**\n" +
  "a) Magnification = 15 / 3 = 5.\n" +
  "b) The image is virtual, upright, and magnified.\n" +
  "c) The object must be placed between the lens and the focal point (distance < 10 cm).";

const TEACHER_NOTES =
  "- Ensure students always use a sharp pencil and a ruler for ray diagrams.\n" +
  "- Emphasize that the three standard rays are just a tool to find the image; in reality, millions of rays pass through the lens to form the image.\n" +
  "- For the drawing question, provide a pre-drawn principal axis, lens, and focal points to save time and improve accuracy.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-ray-diagrams", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-ray-diagrams", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-ray-diagrams", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-ray-diagrams", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-ray-diagram-analysis",
    title: "Q1 - Ray Diagram Analysis",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_LENS,
    caption: "Ray diagram for an object placed beyond 2F.",
    content: "Look at the ray diagram provided.\n\na) What type of lens is shown?\n\nb) Describe the image formed using three words (choose from: real/virtual, upright/inverted, magnified/diminished).\n\nc) Describe the path of the top ray (Ray 1) before and after it hits the lens.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-ray-diagrams", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. A concave lens causes parallel light rays to converge (come together).\n2. A real image can be projected onto a screen.\n3. Magnification is measured in centimetres (cm).\n4. A ray passing through the exact center of a lens does not change direction."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What type of image is formed when light rays actually meet?\nA. Virtual\nB. Real\nC. Imaginary\nD. Reflected\n\n" +
    "2. What happens to a light ray that passes through the exact center of a lens?\nA. It passes straight through without bending\nB. It bends towards the focal point\nC. It reflects back\nD. It bends parallel to the axis\n\n" +
    "3. What is the formula for magnification?\nA. Object height ÷ Image height\nB. Image height × Object height\nC. Image height ÷ Object height\nD. Object height + Image height"
);

const Q4_MIXED = section(
  "q4-magnification",
  "q-short-answer",
  "Q4 - Magnification Calculations",
  "Use the equation Magnification = Image height ÷ Object height to calculate the missing values:\n\na) Object height = 4 cm, Image height = 12 cm. Calculate Magnification.\n\nb) Object height = 10 cm, Magnification = 0.5. Calculate Image height.\n\nc) Image height = 20 cm, Magnification = 4. Calculate Object height."
);

const Q4_FOUNDATION = section(
  "q4-magnification",
  "q-short-answer",
  "Q4 - Magnification Calculations",
  "Use the equation Magnification = Image height ÷ Object height to calculate the missing values:\n\na) Object height = 4 cm, Image height = 12 cm. Calculate Magnification (12 ÷ 4).\n\nb) Object height = 10 cm, Magnification = 0.5. Calculate Image height (10 × 0.5).\n\nc) Image height = 20 cm, Magnification = 4. Calculate Object height (20 ÷ 4)."
);

const Q5_MIXED = section(
  "q5-drawing",
  "q-extended",
  "Q5 - Drawing a Ray Diagram",
  "Draw a ray diagram for an object placed between F and 2F of a convex lens. You must draw at least two rays to find the image. Then, describe the image formed (real/virtual, upright/inverted, magnified/diminished)."
);

const Q6_MIXED = section(
  "q6-real-virtual",
  "q-extended",
  "Q6 - Real vs Virtual Images",
  "Explain the difference between a real image and a virtual image."
);

const Q7_MIXED = section(
  "q7-magnifying-glass",
  "q-short-answer",
  "Q7 - The Magnifying Glass",
  "Where must an object be placed relative to a convex lens for the lens to act as a magnifying glass?"
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A student uses a convex lens with a focal length of 10 cm as a magnifying glass. They look at an insect that is 3 mm long. The image they see is 15 mm long.\n\na) Calculate the magnification.\n\nb) Describe the three properties of the image formed by a magnifying glass.\n\nc) Estimate the distance between the insect and the lens (must it be greater than, equal to, or less than 10 cm?). Explain your answer."
);

const SS_Q5 = section("ss-q5", "sentence-starters", "Q5 - Sentence Starters", "Sentence starters: Ray 1 goes parallel to the axis, then bends through...\nRay 2 goes straight through the...\nThe rays meet on the other side, so the image is...\nBecause it is larger than the object, it is...");
const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: A real image is formed when light rays...\nA real image can be projected onto a...\nA virtual image is formed when light rays...\nA virtual image cannot be...");

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
    title: "Ray Diagrams - Mixed (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Ray Diagrams - Foundation (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Ray Diagrams - Higher (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Ray Diagrams - Scaffolded (Year 10 Physics)",
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
    topicTags: ["ray diagrams", "lenses", "physics", "nano_banana", "worksheet_ray_diagrams_y10"],
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
      "q1-ray-diagram-analysis",
      DIAGRAM_LENS,
      "Ray diagram for an object placed beyond 2F."
    );
  }

  console.log("\nRay Diagrams (Year 10) curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
