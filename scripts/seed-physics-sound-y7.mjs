#!/usr/bin/env node
/**
 * Seed script — Sound (Physics, Year 7)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Sound";
const YEAR_GROUP = "Year 7";
const SOURCE = "Adaptly Curated";

const DIAGRAM_SOUND = "/images/physics_sound_waves_nb.png";

const KEY_VOCAB = [
  { term: "Vibration", definition: "A rapid back-and-forth movement that creates sound." },
  { term: "Sound wave", definition: "A longitudinal wave that transfers sound energy through a medium." },
  { term: "Medium", definition: "The material (solid, liquid, or gas) that a sound wave travels through." },
  { term: "Vacuum", definition: "A space with no particles. Sound cannot travel through a vacuum." },
  { term: "Pitch", definition: "How high or low a sound is, determined by its frequency." },
  { term: "Frequency", definition: "The number of vibrations per second, measured in Hertz (Hz)." },
  { term: "Volume", definition: "How loud or quiet a sound is, determined by its amplitude." },
  { term: "Amplitude", definition: "The maximum distance a particle moves from its resting position." },
  { term: "Echo", definition: "A sound wave that reflects off a hard surface and bounces back." },
  { term: "Ear", definition: "The organ that detects sound waves and sends signals to the brain." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Explain how sound is produced by vibrations.\n" +
  "2. Describe how sound travels through different materials.\n" +
  "3. Explain the difference between pitch and volume.\n" +
  "4. Understand why sound cannot travel through a vacuum.";

const KEY_VOCAB_CONTENT =
  "**Vibration** — A rapid back-and-forth movement that creates sound.\n" +
  "**Sound wave** — A longitudinal wave that transfers sound energy through a medium.\n" +
  "**Medium** — The material (solid, liquid, or gas) that a sound wave travels through.\n" +
  "**Vacuum** — A space with no particles. Sound cannot travel through a vacuum.\n" +
  "**Pitch** — How high or low a sound is, determined by its frequency.\n" +
  "**Frequency** — The number of vibrations per second, measured in Hertz (Hz).\n" +
  "**Volume** — How loud or quiet a sound is, determined by its amplitude.\n" +
  "**Amplitude** — The maximum distance a particle moves from its resting position.\n" +
  "**Echo** — A sound wave that reflects off a hard surface and bounces back.\n" +
  "**Ear** — The organ that detects sound waves and sends signals to the brain.";

const COMMON_MISTAKES =
  "1. Thinking sound can travel in space. Space is a vacuum (no particles), so sound cannot travel there.\n" +
  "2. Confusing pitch and volume. Pitch is how high/low (frequency); volume is how loud/quiet (amplitude).\n" +
  "3. Believing sound travels fastest in air. Sound actually travels fastest in solids because the particles are closer together.\n" +
  "4. Thinking the particles travel from the source to your ear. The *energy* travels, but the particles just vibrate back and forth in place.";

const WORKED_EXAMPLE =
  "Worked example: Pitch and Volume\n\n" +
  "Question: A guitar string is plucked gently, then plucked harder. How does the sound change?\n\n" +
  "Step 1: Identify what changes. Plucking harder means the string vibrates with a larger movement.\n" +
  "Step 2: Link movement to wave property. Larger movement means a larger amplitude.\n" +
  "Step 3: Link wave property to sound. Larger amplitude means a louder volume.\n" +
  "Step 4: Check the pitch. The string is the same length and tightness, so the frequency (pitch) stays the same.\n" +
  "Answer: The sound becomes louder, but the pitch stays the same.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Sound?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I know that sound is caused by vibrations.|Not yet|Almost|Got it!\n" +
  "I can explain why sound needs a medium to travel.|Not yet|Almost|Got it!\n" +
  "I know the difference between pitch and volume.|Not yet|Almost|Got it!\n" +
  "I can explain why sound travels fastest in solids.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What is an echo?\n" +
  "Why can't you hear explosions in space?\n" +
  "EXIT_TICKET: If a sound wave has a high frequency, what kind of pitch does it have?";

const MARK_SCHEME =
  "**Q1 - Sound Waves Diagram**\n" +
  "A = Compression (high pressure), B = Rarefaction (low pressure), C = Loud sound (large amplitude), D = High pitch (high frequency).\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It travels fastest in solids)  2. True  3. False (It affects volume)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Vibrations)  2. C (Vacuum)  3. A (Hertz)\n\n" +
  "**Q4 - Pitch and Volume**\n" +
  "a) Pitch is how high or low a sound is. Volume is how loud or quiet a sound is.\n" +
  "b) Frequency affects pitch. Amplitude affects volume.\n\n" +
  "**Q5 - Sound in Different Materials**\n" +
  "Sound travels fastest in solids because the particles are very close together, so vibrations can pass from one particle to the next very quickly. In gases, particles are far apart, so it takes longer for vibrations to pass between them.\n\n" +
  "**Q6 - Space and Sound**\n" +
  "Space is a vacuum, meaning there are no particles. Sound waves need particles to vibrate and pass the energy along. Without particles, sound cannot travel.\n\n" +
  "**Q7 - Echoes**\n" +
  "An echo is caused when sound waves hit a hard, flat surface and reflect (bounce back) to the listener.\n\n" +
  "**Q8 - Challenge**\n" +
  "a) Distance = Speed × Time = 340 × 3 = 1020 m.\n" +
  "b) Light travels much faster than sound (300,000,000 m/s compared to 340 m/s). The light reaches you almost instantly, but the sound takes a few seconds to travel the distance.";

const TEACHER_NOTES =
  "- Use a slinky spring to demonstrate longitudinal waves (compressions and rarefactions).\n" +
  "- The 'bell jar' experiment is excellent for proving sound cannot travel in a vacuum.\n" +
  "- Remind students that humans can only hear frequencies between 20 Hz and 20,000 Hz.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-sound", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-sound", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-sound", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-sound", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-sound-diagram",
    title: "Q1 - Sound Waves",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_SOUND,
    caption: "Diagram showing sound waves, pitch, and volume.",
    content: "Look at the diagram and identify the features of sound waves.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-sound", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. Sound travels fastest through the air.\n2. Sound is caused by vibrations.\n3. Changing the amplitude of a wave changes its pitch.\n4. Sound cannot travel through a vacuum."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What causes sound?\nA. Light\nB. Vibrations\nC. Heat\nD. Electricity\n\n" +
    "2. What do we call a space with no particles?\nA. A solid\nB. A gas\nC. A vacuum\nD. A liquid\n\n" +
    "3. What is frequency measured in?\nA. Hertz (Hz)\nB. Meters (m)\nC. Decibels (dB)\nD. Seconds (s)"
);

const Q4_MIXED = section(
  "q4-pitch-volume",
  "q-short-answer",
  "Q4 - Pitch and Volume",
  "a) Explain the difference between pitch and volume.\n\nb) Which feature of a wave affects pitch, and which feature affects volume?"
);

const Q4_FOUNDATION = section(
  "q4-pitch-volume",
  "q-short-answer",
  "Q4 - Pitch and Volume",
  "a) Explain the difference between pitch and volume. (Hint: think about high/low vs loud/quiet).\n\nb) Fill in the blanks: ________ affects pitch, and ________ affects volume. (Use the words: Amplitude, Frequency)."
);

const Q5_MIXED = section(
  "q5-materials",
  "q-extended",
  "Q5 - Sound in Different Materials",
  "Explain why sound travels faster in a solid (like wood) than in a gas (like air). Use the particle model in your answer."
);

const Q6_MIXED = section(
  "q6-space",
  "q-extended",
  "Q6 - Sound in Space",
  "In science fiction movies, you often hear loud explosions in space. Explain why this is scientifically incorrect."
);

const Q7_MIXED = section(
  "q7-echoes",
  "q-short-answer",
  "Q7 - Echoes",
  "Explain what causes an echo."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "During a thunderstorm, you see a flash of lightning and hear the thunder 3 seconds later. The speed of sound in air is 340 m/s.\n\na) Calculate how far away the lightning strike was. (Distance = Speed × Time).\n\nb) Explain why you see the lightning before you hear the thunder."
);

const SS_Q5 = section("ss-q5", "sentence-starters", "Q5 - Sentence Starters", "Sentence starters: In a solid, the particles are...\nThis means vibrations can pass...\nIn a gas, the particles are...");
const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: Space is a vacuum, which means...\nSound waves need particles to...\nTherefore, in space...");

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
    title: "Sound - Mixed (Year 7 Physics)",
    subtitle: "Curated KS3 Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Sound - Foundation (Year 7 Physics)",
    subtitle: "Curated KS3 Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Sound - Higher (Year 7 Physics)",
    subtitle: "Curated KS3 Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Sound - Scaffolded (Year 7 Physics)",
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
    topicTags: ["sound", "waves", "physics", "nano_banana", "worksheet_sound_y7"],
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
      "q1-sound-diagram",
      DIAGRAM_SOUND,
      "Diagram showing sound waves, pitch, and volume."
    );
  }

  console.log("\nSound (Year 7) curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
