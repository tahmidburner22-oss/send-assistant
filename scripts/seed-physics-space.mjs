#!/usr/bin/env node
/**
 * Seed script — Space Physics (Physics, Year 11)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Space Physics";
const YEAR_GROUP = "Year 11";
const SOURCE = "Adaptly Curated";

const DIAGRAM_SOLAR_SYSTEM = "/images/physics_solar_system_nb.png";
const DIAGRAM_STAR_LIFECYCLE = "/images/physics_star_lifecycle_nb.png";

const KEY_VOCAB = [
  { term: "Solar system", definition: "The Sun and all the objects that orbit around it, including eight planets." },
  { term: "Galaxy", definition: "A massive collection of billions of stars, gas, and dust held together by gravity." },
  { term: "Nebula", definition: "A cloud of gas and dust in space where stars are born." },
  { term: "Protostar", definition: "A contracting mass of gas that represents an early stage in the formation of a star." },
  { term: "Main sequence star", definition: "A stable star that is fusing hydrogen into helium in its core (like our Sun)." },
  { term: "Supernova", definition: "The massive explosion of a large star at the end of its life." },
  { term: "Black hole", definition: "An object with gravity so strong that not even light can escape from it." },
  { term: "Orbit", definition: "The curved path of a celestial object or spacecraft around a star, planet, or moon." },
  { term: "Red-shift", definition: "The increase in wavelength of light from distant galaxies, showing they are moving away." },
  { term: "Big Bang theory", definition: "The theory that the universe began from a very small, hot, and dense region and has been expanding ever since." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Describe the structure of our solar system and the universe.\n" +
  "2. Explain the life cycle of stars of different sizes.\n" +
  "3. Understand how gravity provides the force that creates orbits.\n" +
  "4. Explain how red-shift provides evidence for the Big Bang theory.";

const KEY_VOCAB_CONTENT =
  "**Solar system** — The Sun and all the objects that orbit around it, including eight planets.\n" +
  "**Galaxy** — A massive collection of billions of stars, gas, and dust held together by gravity.\n" +
  "**Nebula** — A cloud of gas and dust in space where stars are born.\n" +
  "**Protostar** — A contracting mass of gas that represents an early stage in the formation of a star.\n" +
  "**Main sequence star** — A stable star that is fusing hydrogen into helium in its core (like our Sun).\n" +
  "**Supernova** — The massive explosion of a large star at the end of its life.\n" +
  "**Black hole** — An object with gravity so strong that not even light can escape from it.\n" +
  "**Orbit** — The curved path of a celestial object or spacecraft around a star, planet, or moon.\n" +
  "**Red-shift** — The increase in wavelength of light from distant galaxies, showing they are moving away.\n" +
  "**Big Bang theory** — The theory that the universe began from a very small, hot, and dense region and has been expanding ever since.";

const COMMON_MISTAKES =
  "1. Confusing the solar system, galaxy, and universe. The solar system is inside the Milky Way galaxy, which is inside the universe.\n" +
  "2. Thinking our Sun will become a black hole. Our Sun is too small; it will become a white dwarf.\n" +
  "3. Misunderstanding orbits. The speed of an object in a circular orbit is constant, but its velocity is constantly changing because its direction changes.\n" +
  "4. Thinking red-shift means galaxies are actually red. It just means their light is shifted *towards* the red end of the spectrum (longer wavelength).";

const WORKED_EXAMPLE =
  "Worked example: Star Life Cycles\n\n" +
  "Question: Describe what will happen to our Sun after it leaves the main sequence stage.\n\n" +
  "Step 1: Identify the size of the star. Our Sun is a small/medium-sized star.\n" +
  "Step 2: State the next stage. It will expand to become a Red Giant.\n" +
  "Step 3: State the final stages. It will then shed its outer layers to leave behind a hot, dense core called a White Dwarf.\n" +
  "Step 4: State the very end. Eventually, it will cool down to become a Black Dwarf.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Space Physics?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can name the planets in order from the Sun.|Not yet|Almost|Got it!\n" +
  "I can describe the life cycle of a star like our Sun.|Not yet|Almost|Got it!\n" +
  "I can explain how gravity causes orbits.|Not yet|Almost|Got it!\n" +
  "I can explain what red-shift is.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What is the difference between a galaxy and the universe?\n" +
  "Why do massive stars end their lives differently to small stars?\n" +
  "EXIT_TICKET: Name the two possible final stages for a very massive star after a supernova.";

const MARK_SCHEME =
  "**Q1 - Solar System Diagram**\n" +
  "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It is a medium-sized star)  2. True  3. False (It is constantly changing direction)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Gravity)  2. C (White dwarf)  3. A (Moving away from us)\n\n" +
  "**Q4 - Orbits**\n" +
  "Gravity provides the centripetal force that keeps planets in orbit around the Sun. If the planet moves closer to the Sun, the gravitational force is stronger, so it must travel faster to stay in orbit.\n\n" +
  "**Q5 - Star Life Cycle**\n" +
  "a) Nebula -> Protostar -> Main Sequence -> Red Giant -> White Dwarf -> Black Dwarf\n" +
  "b) Nebula -> Protostar -> Main Sequence -> Red Supergiant -> Supernova -> Neutron Star OR Black Hole\n\n" +
  "**Q6 - Main Sequence**\n" +
  "In a main sequence star, the outward force of thermal expansion (from nuclear fusion) is perfectly balanced by the inward force of gravity. This keeps the star stable.\n\n" +
  "**Q7 - Red-shift and the Big Bang**\n" +
  "Light from distant galaxies is red-shifted (wavelength increases). The further away a galaxy is, the greater the red-shift. This shows that all galaxies are moving away from each other, meaning the universe is expanding. If it is expanding, it must have started from a single point (the Big Bang).\n\n" +
  "**Q8 - Challenge**\n" +
  "a) The speed is constant, but velocity is a vector (speed in a given direction). Because the satellite is moving in a circle, its direction is constantly changing, so its velocity is constantly changing.\n" +
  "b) If velocity is changing, the object must be accelerating. This acceleration is caused by the resultant force of gravity acting towards the centre of the Earth.";

const TEACHER_NOTES =
  "- Use the mnemonic 'My Very Educated Mother Just Served Us Noodles' for the planets.\n" +
  "- Emphasize the balance of forces in a main sequence star (gravity vs radiation pressure).\n" +
  "- For red-shift, the balloon analogy (drawing dots on a balloon and blowing it up) helps explain how space itself is expanding.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-space", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-space", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-space", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-space", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-solar-system",
    title: "Q1 - The Solar System",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_SOLAR_SYSTEM,
    caption: "Diagram of our Solar System.",
    content: "List the eight planets in order, starting from the one closest to the Sun.",
  };
}

function referenceLifecycleSection() {
  return {
    id: "reference-star-lifecycle",
    title: "Reference - Star Life Cycle",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_STAR_LIFECYCLE,
    caption: "The life cycle of stars of different masses.",
    content: "Use this reference to help answer questions about the life cycle of stars.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-space", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. Our Sun is the largest type of star in the universe.\n2. The Milky Way is the name of our galaxy.\n3. A planet in a circular orbit has a constant velocity.\n4. Red-shift provides evidence that the universe is expanding."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What force keeps planets in orbit around the Sun?\nA. Magnetism\nB. Gravity\nC. Friction\nD. Electrostatic\n\n" +
    "2. What will our Sun eventually become at the end of its life?\nA. Black hole\nB. Supernova\nC. White dwarf\nD. Neutron star\n\n" +
    "3. What does red-shift tell us about distant galaxies?\nA. They are moving away from us\nB. They are moving towards us\nC. They are getting hotter\nD. They are getting colder"
);

const Q4_MIXED = section(
  "q4-orbits",
  "q-extended",
  "Q4 - Orbits and Gravity",
  "Explain the role of gravity in keeping planets in orbit. What happens to the speed of a planet if its orbit is closer to the Sun?"
);

const Q5_MIXED = section(
  "q5-lifecycle",
  "q-short-answer",
  "Q5 - Star Life Cycles",
  "Using the reference diagram, write down the life cycle stages for:\n\na) A star about the same size as our Sun.\n\nb) A star much more massive than our Sun."
);

const Q5_FOUNDATION = section(
  "q5-lifecycle",
  "q-short-answer",
  "Q5 - Star Life Cycles",
  "Using the reference diagram, write down the life cycle stages for:\n\na) A star about the same size as our Sun. (Starts with Nebula -> Protostar -> ...)\n\nb) A star much more massive than our Sun. (Starts with Nebula -> Protostar -> ...)"
);

const Q6_MIXED = section(
  "q6-main-sequence",
  "q-extended",
  "Q6 - Main Sequence Stars",
  "Explain why a main sequence star is stable. Mention the two main forces acting on the star."
);

const Q7_MIXED = section(
  "q7-red-shift",
  "q-extended",
  "Q7 - Red-shift and the Big Bang",
  "Explain how red-shift provides evidence for the Big Bang theory."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A satellite is in a circular orbit around the Earth at a constant speed.\n\na) Explain why the velocity of the satellite is constantly changing, even though its speed is constant.\n\nb) Explain why this means the satellite must be accelerating, and state what causes this acceleration."
);

const SS_Q4 = section("ss-q4", "sentence-starters", "Q4 - Sentence Starters", "Sentence starters: Gravity provides the force that...\nIf a planet is closer to the Sun, the gravitational force is...\nTherefore, the planet must travel...");
const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: A main sequence star is stable because...\nThe inward force of gravity is balanced by...\nThis outward force is caused by...");
const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: Red-shift is when light from distant galaxies...\nThis shows that the galaxies are...\nThis provides evidence that the universe is...");

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED,
  referenceLifecycleSection(),
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
  referenceLifecycleSection(),
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
  referenceLifecycleSection(),
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
  SS_Q4,
  Q4_MIXED,
  referenceLifecycleSection(),
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
    title: "Space Physics - Mixed (Year 11 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Space Physics - Foundation (Year 11 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Space Physics - Higher (Year 11 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Space Physics - Scaffolded (Year 11 Physics)",
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
    topicTags: ["space", "astronomy", "physics", "nano_banana", "worksheet_space_y11"],
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
      "q1-solar-system",
      DIAGRAM_SOLAR_SYSTEM,
      "Diagram of our Solar System."
    );

    await ensureAsset(
      token,
      entryId,
      "reference-star-lifecycle",
      DIAGRAM_STAR_LIFECYCLE,
      "The life cycle of stars of different masses."
    );
  }

  console.log("\nSpace Physics curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
