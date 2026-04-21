#!/usr/bin/env node
/**
 * Seed script — Waves (Physics, Year 10)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Waves";
const YEAR_GROUP = "Year 10";
const SOURCE = "Adaptly Curated";

const DIAGRAM_WAVE = "/images/physics_wave_diagram_nb.png";
const DIAGRAM_EM_SPECTRUM = "/images/physics_em_spectrum_nb.png";
const DIAGRAM_REFRACTION = "/images/physics_ray_diagram_refraction_nb.png";

const KEY_VOCAB = [
  { term: "Transverse wave", definition: "A wave where the oscillations are perpendicular to the direction of energy transfer." },
  { term: "Longitudinal wave", definition: "A wave where the oscillations are parallel to the direction of energy transfer." },
  { term: "Amplitude", definition: "The maximum displacement of a point on a wave from its undisturbed position." },
  { term: "Wavelength", definition: "The distance from a point on one wave to the equivalent point on the adjacent wave." },
  { term: "Frequency", definition: "The number of waves passing a fixed point per second, measured in Hertz (Hz)." },
  { term: "Time period", definition: "The time taken for one complete wave to pass a fixed point." },
  { term: "Wave speed", definition: "The speed at which energy is transferred through a medium." },
  { term: "Reflection", definition: "When a wave bounces off a boundary between two different media." },
  { term: "Refraction", definition: "The change in direction of a wave as it crosses a boundary between two media at an angle." },
  { term: "Electromagnetic spectrum", definition: "The continuous range of electromagnetic waves, ordered by frequency or wavelength." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Describe the differences between transverse and longitudinal waves.\n" +
  "2. Label the key features of a wave (amplitude, wavelength, crest, trough).\n" +
  "3. Use the wave equation (v = f × λ) to calculate wave speed, frequency, or wavelength.\n" +
  "4. Explain reflection and refraction using ray diagrams.";

const KEY_VOCAB_CONTENT =
  "**Transverse wave** — A wave where the oscillations are perpendicular to the direction of energy transfer.\n" +
  "**Longitudinal wave** — A wave where the oscillations are parallel to the direction of energy transfer.\n" +
  "**Amplitude** — The maximum displacement of a point on a wave from its undisturbed position.\n" +
  "**Wavelength** — The distance from a point on one wave to the equivalent point on the adjacent wave.\n" +
  "**Frequency** — The number of waves passing a fixed point per second, measured in Hertz (Hz).\n" +
  "**Time period** — The time taken for one complete wave to pass a fixed point.\n" +
  "**Wave speed** — The speed at which energy is transferred through a medium.\n" +
  "**Reflection** — When a wave bounces off a boundary between two different media.\n" +
  "**Refraction** — The change in direction of a wave as it crosses a boundary between two media at an angle.\n" +
  "**Electromagnetic spectrum** — The continuous range of electromagnetic waves, ordered by frequency or wavelength.";

const COMMON_MISTAKES =
  "1. Confusing amplitude and wavelength. Amplitude is the *height* from the middle; wavelength is the *length* of one full wave.\n" +
  "2. Thinking waves transfer matter. Waves transfer *energy* and *information*, not matter.\n" +
  "3. Forgetting to convert units in the wave equation. Wavelength must be in meters (m), not cm or mm.\n" +
  "4. Drawing the normal line incorrectly. The normal is always drawn at 90° (perpendicular) to the boundary surface.";

const WORKED_EXAMPLE =
  "Worked example: Using the Wave Equation\n\n" +
  "Question: A water wave has a frequency of 2 Hz and a wavelength of 1.5 m. Calculate its wave speed.\n\n" +
  "Step 1: Identify the given values. Frequency (f) = 2 Hz. Wavelength (λ) = 1.5 m.\n" +
  "Step 2: State the formula. Wave speed (v) = f × λ.\n" +
  "Step 3: Substitute values. v = 2 × 1.5.\n" +
  "Step 4: Calculate. v = 3.\n" +
  "Step 5: Add units. Wave speed = 3 m/s.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Waves?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can label the parts of a transverse wave.|Not yet|Almost|Got it!\n" +
  "I can explain the difference between transverse and longitudinal waves.|Not yet|Almost|Got it!\n" +
  "I can use the wave equation (v = f × λ).|Not yet|Almost|Got it!\n" +
  "I can explain why refraction happens.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What is the difference between frequency and time period?\n" +
  "Explain what happens to light when it enters a denser medium.\n" +
  "EXIT_TICKET: A sound wave has a speed of 330 m/s and a frequency of 110 Hz. Calculate its wavelength.";

const MARK_SCHEME =
  "**Q1 - Wave Diagram**\n" +
  "A = Crest/Peak, B = Wavelength, C = Amplitude, D = Trough, E = Equilibrium/Rest position.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (They transfer energy, not matter)  2. True  3. False (Sound is longitudinal)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Hertz)  2. C (Perpendicular)  3. A (v = f × λ)\n\n" +
  "**Q4 - Wave Equation Calculations**\n" +
  "a) v = 50 * 2 = 100 m/s\n" +
  "b) f = 300 / 1.5 = 200 Hz\n" +
  "c) λ = 1500 / 500 = 3 m\n\n" +
  "**Q5 - Transverse vs Longitudinal**\n" +
  "Transverse: oscillations are perpendicular to energy transfer (e.g., light, water waves). Longitudinal: oscillations are parallel to energy transfer (e.g., sound, P-waves).\n\n" +
  "**Q6 - Refraction**\n" +
  "When light enters a denser medium (like glass), it slows down. This change in speed causes the wave to change direction (bend towards the normal).\n\n" +
  "**Q7 - Electromagnetic Spectrum**\n" +
  "Radio waves, Microwaves, Infrared, Visible light, Ultraviolet, X-rays, Gamma rays. (Must be in order of increasing frequency / decreasing wavelength).\n\n" +
  "**Q8 - Challenge**\n" +
  "a) v = f * λ -> 300,000,000 = f * 0.03 -> f = 300,000,000 / 0.03 = 10,000,000,000 Hz (or 10 GHz)\n" +
  "b) T = 1 / f = 1 / 10,000,000,000 = 1 × 10^-10 s\n" +
  "c) Microwaves are used for satellite communications and cooking food.";

const TEACHER_NOTES =
  "- Ensure students know the Greek letter lambda (λ) for wavelength.\n" +
  "- Emphasize that all electromagnetic waves travel at the same speed in a vacuum (3 × 10^8 m/s).\n" +
  "- When teaching refraction, the 'car driving from tarmac into mud' analogy is very helpful for explaining why the wave bends.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-waves", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-waves", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-waves", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-waves", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-wave-diagram",
    title: "Q1 - Wave Diagram",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_WAVE,
    caption: "Diagram of a transverse wave.",
    content: "Identify the labeled parts of the wave shown in the diagram.",
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

function referenceEMSection() {
  return {
    id: "reference-em-spectrum",
    title: "Reference - Electromagnetic Spectrum",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_EM_SPECTRUM,
    caption: "The Electromagnetic Spectrum.",
    content: "Use this reference to help answer questions about electromagnetic waves.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-waves", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. Waves transfer matter from one place to another.\n2. Amplitude is measured from the equilibrium position to the crest.\n3. Sound waves are an example of transverse waves.\n4. The normal line is drawn at 90 degrees to the boundary."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What is the unit of frequency?\nA. Meters\nB. Hertz\nC. Seconds\nD. Joules\n\n" +
    "2. In a transverse wave, how do the oscillations move compared to the energy transfer?\nA. Parallel\nB. In the opposite direction\nC. Perpendicular\nD. In circles\n\n" +
    "3. Which equation is correct for wave speed?\nA. v = f × λ\nB. v = f ÷ λ\nC. v = λ ÷ f\nD. v = f + λ"
);

const Q4_MIXED = section(
  "q4-wave-equation",
  "q-short-answer",
  "Q4 - Wave Equation Calculations",
  "Use the equation v = f × λ to calculate the missing values:\n\na) Frequency = 50 Hz, Wavelength = 2 m. Calculate Wave speed.\n\nb) Wave speed = 300 m/s, Wavelength = 1.5 m. Calculate Frequency.\n\nc) Wave speed = 1500 m/s, Frequency = 500 Hz. Calculate Wavelength."
);

const Q4_FOUNDATION = section(
  "q4-wave-equation",
  "q-short-answer",
  "Q4 - Wave Equation Calculations",
  "Use the equation v = f × λ to calculate the missing values:\n\na) Frequency = 50 Hz, Wavelength = 2 m. Calculate Wave speed (v = 50 × 2).\n\nb) Wave speed = 300 m/s, Wavelength = 1.5 m. Calculate Frequency (f = v ÷ λ).\n\nc) Wave speed = 1500 m/s, Frequency = 500 Hz. Calculate Wavelength (λ = v ÷ f)."
);

const Q5_MIXED = section(
  "q5-types",
  "q-extended",
  "Q5 - Types of Waves",
  "Explain the difference between a transverse wave and a longitudinal wave. Give one example of each."
);

const Q6_MIXED = section(
  "q6-refraction",
  "q-extended",
  "Q6 - Refraction",
  "Explain why a light ray changes direction when it travels from air into a glass block."
);

const Q7_MIXED = section(
  "q7-em-spectrum",
  "q-short-answer",
  "Q7 - Electromagnetic Spectrum",
  "List the seven types of electromagnetic waves in order, starting from the lowest frequency (longest wavelength) to the highest frequency."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A microwave has a wavelength of 3 cm (0.03 m). All electromagnetic waves travel at a speed of 300,000,000 m/s in a vacuum.\n\na) Calculate the frequency of this microwave.\n\nb) Calculate the time period of this wave (T = 1/f).\n\nc) State two uses of microwaves."
);

const SS_Q5 = section("ss-q5", "sentence-starters", "Q5 - Sentence Starters", "Sentence starters: In a transverse wave, the oscillations are...\nAn example is...\nIn a longitudinal wave, the oscillations are...\nAn example is...");
const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: When light enters the glass block, it...\nThis causes the wave to...\nIt bends towards the...");

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED,
  Q5_MIXED,
  referenceRefractionSection(),
  Q6_MIXED,
  referenceEMSection(),
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
  referenceRefractionSection(),
  Q6_MIXED,
  referenceEMSection(),
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
  referenceEMSection(),
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
  referenceRefractionSection(),
  Q6_MIXED,
  SS_Q6,
  referenceEMSection(),
  Q7_MIXED,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Waves - Mixed (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Waves - Foundation (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Waves - Higher (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Waves - Scaffolded (Year 10 Physics)",
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
    topicTags: ["waves", "physics", "nano_banana", "worksheet_waves_y10"],
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
      "q1-wave-diagram",
      DIAGRAM_WAVE,
      "Diagram of a transverse wave."
    );

    await ensureAsset(
      token,
      entryId,
      "reference-refraction",
      DIAGRAM_REFRACTION,
      "Ray diagram showing light refracting as it enters a denser medium."
    );
    
    await ensureAsset(
      token,
      entryId,
      "reference-em-spectrum",
      DIAGRAM_EM_SPECTRUM,
      "The Electromagnetic Spectrum."
    );
  }

  console.log("\nWaves curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
