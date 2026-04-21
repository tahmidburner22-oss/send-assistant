#!/usr/bin/env node
/**
 * Seed script — Light (Physics, Year 8)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Light";
const YEAR_GROUP = "Year 8";
const SOURCE = "Adaptly Curated";

const DIAGRAM_REFLECTION = "/images/physics_light_reflection_nb.png";
const DIAGRAM_REFRACTION = "/images/physics_ray_diagram_refraction_nb.png";

const KEY_VOCAB = [
  { term: "Luminous", definition: "An object that produces its own light (e.g., the Sun, a light bulb)." },
  { term: "Non-luminous", definition: "An object that does not produce its own light but can reflect it (e.g., the Moon)." },
  { term: "Transparent", definition: "A material that allows light to pass through clearly (e.g., glass)." },
  { term: "Opaque", definition: "A material that does not allow light to pass through." },
  { term: "Reflection", definition: "When light bounces off a surface." },
  { term: "Refraction", definition: "The bending of light as it passes from one transparent material into another." },
  { term: "Normal", definition: "An imaginary line drawn at 90 degrees to a surface where a light ray hits it." },
  { term: "Incident ray", definition: "The ray of light travelling towards a surface." },
  { term: "Reflected ray", definition: "The ray of light bouncing away from a surface." },
  { term: "Spectrum", definition: "The band of colours produced when white light is split by a prism." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Explain how we see luminous and non-luminous objects.\n" +
  "2. State the Law of Reflection and draw reflection ray diagrams.\n" +
  "3. Explain why refraction happens and draw refraction ray diagrams.\n" +
  "4. Describe how white light can be split into a spectrum of colours.";

const KEY_VOCAB_CONTENT =
  "**Luminous** — An object that produces its own light (e.g., the Sun, a light bulb).\n" +
  "**Non-luminous** — An object that does not produce its own light but can reflect it (e.g., the Moon).\n" +
  "**Transparent** — A material that allows light to pass through clearly (e.g., glass).\n" +
  "**Opaque** — A material that does not allow light to pass through.\n" +
  "**Reflection** — When light bounces off a surface.\n" +
  "**Refraction** — The bending of light as it passes from one transparent material into another.\n" +
  "**Normal** — An imaginary line drawn at 90 degrees to a surface where a light ray hits it.\n" +
  "**Incident ray** — The ray of light travelling towards a surface.\n" +
  "**Reflected ray** — The ray of light bouncing away from a surface.\n" +
  "**Spectrum** — The band of colours produced when white light is split by a prism.";

const COMMON_MISTAKES =
  "1. Drawing arrows pointing from the eye to the object. Light travels *from* the object *into* the eye.\n" +
  "2. Measuring angles from the mirror surface. Angles of incidence and reflection must be measured from the *normal* line.\n" +
  "3. Thinking the Moon is luminous. The Moon does not make its own light; it reflects light from the Sun.\n" +
  "4. Forgetting to draw arrows on ray diagrams. A line without an arrow is just a line, not a light ray.";

const WORKED_EXAMPLE =
  "Worked example: The Law of Reflection\n\n" +
  "Question: A light ray hits a flat mirror. The angle between the incident ray and the normal is 35°. What is the angle of reflection?\n\n" +
  "Step 1: Identify the angle of incidence. The angle between the incident ray and the normal is the angle of incidence (i = 35°).\n" +
  "Step 2: State the Law of Reflection. The angle of incidence equals the angle of reflection (i = r).\n" +
  "Step 3: Apply the law. If i = 35°, then r must also be 35°.\n" +
  "Answer: The angle of reflection is 35°.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Light?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can explain how we see non-luminous objects.|Not yet|Almost|Got it!\n" +
  "I can use the Law of Reflection.|Not yet|Almost|Got it!\n" +
  "I can explain why light refracts.|Not yet|Almost|Got it!\n" +
  "I know the colours of the visible spectrum.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What is the 'normal' line in a ray diagram?\n" +
  "Why does a pencil look bent when placed in a glass of water?\n" +
  "EXIT_TICKET: If a light ray hits a mirror at an angle of incidence of 50°, what is the angle of reflection?";

const MARK_SCHEME =
  "**Q1 - Reflection Diagram**\n" +
  "The angle of incidence (i) is equal to the angle of reflection (r). The normal is drawn at 90 degrees to the mirror surface.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It reflects light from the Sun)  2. True  3. False (It must be measured from the normal)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Luminous)  2. C (Refraction)  3. A (i = r)\n\n" +
  "**Q4 - Seeing Objects**\n" +
  "Light from a luminous source (like the Sun or a lamp) hits the book. The book reflects the light. The reflected light travels in a straight line into our eyes.\n\n" +
  "**Q5 - Law of Reflection**\n" +
  "a) Angle of reflection = 25°.\n" +
  "b) The angle between the mirror and the normal is 90°. 90° - 40° = 50°. So the angle of incidence is 50°. Therefore, the angle of reflection is 50°.\n\n" +
  "**Q6 - Refraction**\n" +
  "Refraction happens because light changes speed when it moves from one medium to another (e.g., from air into glass). Because glass is denser than air, the light slows down and bends towards the normal.\n\n" +
  "**Q7 - The Spectrum**\n" +
  "Red, Orange, Yellow, Green, Blue, Indigo, Violet. (Richard Of York Gave Battle In Vain).\n\n" +
  "**Q8 - Challenge**\n" +
  "a) A prism splits white light into a spectrum because different colours of light refract (bend) by different amounts. Violet light slows down the most and bends the most. Red light slows down the least and bends the least.\n" +
  "b) This splitting of light into its separate colours is called dispersion.";

const TEACHER_NOTES =
  "- Use a ray box and mirror to demonstrate the Law of Reflection practically.\n" +
  "- When teaching refraction, the 'shopping trolley driving from tarmac into mud' analogy helps explain why the ray bends towards the normal.\n" +
  "- Ensure students always use a ruler and pencil for ray diagrams, and always include arrows.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-light", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-light", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-light", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-light", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-reflection-diagram",
    title: "Q1 - Reflection",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_REFLECTION,
    caption: "Diagram showing the reflection of light.",
    content: "Look at the diagram and state the Law of Reflection.",
  };
}

function referenceRefractionSection() {
  return {
    id: "reference-refraction",
    title: "Reference - Refraction",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_REFRACTION,
    caption: "Ray diagram showing light refracting as it enters a denser medium.",
    content: "Use this reference to help answer questions about refraction.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-light", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. The Moon is a luminous object.\n2. Light travels in straight lines.\n3. The angle of incidence is measured from the mirror surface.\n4. Refraction is the bending of light."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What do we call an object that makes its own light?\nA. Transparent\nB. Luminous\nC. Opaque\nD. Reflective\n\n" +
    "2. What happens when light travels from air into glass?\nA. It speeds up\nB. It reflects\nC. It refracts (bends)\nD. It stops\n\n" +
    "3. What is the Law of Reflection?\nA. Angle of incidence = Angle of reflection\nB. Angle of incidence > Angle of reflection\nC. Angle of incidence < Angle of reflection\nD. Angle of incidence + Angle of reflection = 90°"
);

const Q4_MIXED = section(
  "q4-seeing",
  "q-extended",
  "Q4 - Seeing Objects",
  "Explain how a person is able to see a non-luminous object, such as a book on a desk. Mention the light source, the object, and the eye."
);

const Q5_MIXED = section(
  "q5-reflection-calc",
  "q-short-answer",
  "Q5 - Reflection Calculations",
  "a) A light ray hits a mirror with an angle of incidence of 25°. What is the angle of reflection?\n\nb) A light ray hits a mirror. The angle between the light ray and the *mirror surface* is 40°. Calculate the angle of incidence, and then state the angle of reflection."
);

const Q5_FOUNDATION = section(
  "q5-reflection-calc",
  "q-short-answer",
  "Q5 - Reflection Calculations",
  "a) A light ray hits a mirror with an angle of incidence of 25°. What is the angle of reflection? (Hint: use the Law of Reflection).\n\nb) A light ray hits a mirror with an angle of incidence of 60°. What is the angle of reflection?"
);

const Q6_MIXED = section(
  "q6-refraction",
  "q-extended",
  "Q6 - Refraction",
  "Explain why a light ray changes direction (refracts) when it travels from air into a glass block."
);

const Q7_MIXED = section(
  "q7-spectrum",
  "q-short-answer",
  "Q7 - The Spectrum",
  "List the seven colours of the visible spectrum in order."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "When white light passes through a triangular glass prism, it splits into a rainbow of colours.\n\na) Explain why the white light splits into different colours. Mention the speed and bending of different colours.\n\nb) What is the scientific name for this splitting of light?"
);

const SS_Q4 = section("ss-q4", "sentence-starters", "Q4 - Sentence Starters", "Sentence starters: Light from a luminous source travels to...\nThe book then...\nThe reflected light travels into...");
const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: When light enters the glass block, it changes...\nBecause glass is denser than air, the light...\nThis causes the light ray to bend towards the...");

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED,
  Q5_MIXED,
  referenceRefractionSection(),
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
  Q5_FOUNDATION,
  referenceRefractionSection(),
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
  referenceRefractionSection(),
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
  SS_Q4,
  Q5_FOUNDATION,
  referenceRefractionSection(),
  Q6_MIXED,
  SS_Q6,
  Q7_MIXED,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Light - Mixed (Year 8 Physics)",
    subtitle: "Curated KS3 Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Light - Foundation (Year 8 Physics)",
    subtitle: "Curated KS3 Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Light - Higher (Year 8 Physics)",
    subtitle: "Curated KS3 Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Light - Scaffolded (Year 8 Physics)",
    subtitle: "Curated KS3 Physics worksheet - Scaffolded SEND version",
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
    topicTags: ["light", "reflection", "refraction", "physics", "nano_banana", "worksheet_light_y8"],
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
      "q1-reflection-diagram",
      DIAGRAM_REFLECTION,
      "Diagram showing the reflection of light."
    );

    await ensureAsset(
      token,
      entryId,
      "reference-refraction",
      DIAGRAM_REFRACTION,
      "Ray diagram showing light refracting as it enters a denser medium."
    );
  }

  console.log("\nLight (Year 8) curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
