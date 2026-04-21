#!/usr/bin/env node
/**
 * Seed script — Units and Measurements (Physics, Year 9)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Units and Measurements";
const YEAR_GROUP = "Year 9";
const SOURCE = "Adaptly Curated";

const DIAGRAM_UNITS = "/images/physics_units_si_nb.png";

const KEY_VOCAB = [
  { term: "SI Unit", definition: "The standard international unit of measurement for a physical quantity." },
  { term: "Prefix", definition: "A letter added before a unit to change its size (e.g., 'kilo' means 1000)." },
  { term: "Standard form", definition: "A way of writing very large or very small numbers using powers of 10." },
  { term: "Kilo (k)", definition: "A prefix meaning one thousand (10^3 or 1,000)." },
  { term: "Milli (m)", definition: "A prefix meaning one thousandth (10^-3 or 0.001)." },
  { term: "Mega (M)", definition: "A prefix meaning one million (10^6 or 1,000,000)." },
  { term: "Micro (μ)", definition: "A prefix meaning one millionth (10^-6 or 0.000001)." },
  { term: "Nano (n)", definition: "A prefix meaning one billionth (10^-9 or 0.000000001)." },
  { term: "Significant figures", definition: "The number of important digits in a value, indicating its precision." },
  { term: "Conversion", definition: "Changing a measurement from one unit to another (e.g., cm to m)." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Identify the correct SI units for common physical quantities.\n" +
  "2. Use standard prefixes (kilo, milli, mega, micro, nano) to convert between units.\n" +
  "3. Write numbers in standard form.\n" +
  "4. Apply unit conversions to physics calculations.";

const KEY_VOCAB_CONTENT =
  "**SI Unit** — The standard international unit of measurement for a physical quantity.\n" +
  "**Prefix** — A letter added before a unit to change its size (e.g., 'kilo' means 1000).\n" +
  "**Standard form** — A way of writing very large or very small numbers using powers of 10.\n" +
  "**Kilo (k)** — A prefix meaning one thousand (10^3 or 1,000).\n" +
  "**Milli (m)** — A prefix meaning one thousandth (10^-3 or 0.001).\n" +
  "**Mega (M)** — A prefix meaning one million (10^6 or 1,000,000).\n" +
  "**Micro (μ)** — A prefix meaning one millionth (10^-6 or 0.000001).\n" +
  "**Nano (n)** — A prefix meaning one billionth (10^-9 or 0.000000001).\n" +
  "**Significant figures** — The number of important digits in a value, indicating its precision.\n" +
  "**Conversion** — Changing a measurement from one unit to another (e.g., cm to m).";

const COMMON_MISTAKES =
  "1. Forgetting to convert units before calculating. Most physics equations require standard SI units (e.g., metres, not centimetres).\n" +
  "2. Confusing milli (m) and micro (μ). Milli is 10^-3 (divide by 1000). Micro is 10^-6 (divide by 1,000,000).\n" +
  "3. Writing standard form incorrectly. The first number must always be between 1 and 9.99 (e.g., 3.5 × 10^4, not 35 × 10^3).\n" +
  "4. Mixing up capital and lowercase letters. 'M' means Mega (million), but 'm' means milli (thousandth).";

const WORKED_EXAMPLE =
  "Worked example: Converting Units and Standard Form\n\n" +
  "Question: A radio station broadcasts at a frequency of 95.8 MHz (Megahertz). Convert this to Hertz and write it in standard form.\n\n" +
  "Step 1: Identify the prefix. 'Mega' (M) means one million (1,000,000 or 10^6).\n" +
  "Step 2: Multiply the value by the prefix factor. 95.8 × 1,000,000 = 95,800,000 Hz.\n" +
  "Step 3: Convert to standard form. Move the decimal point so the number is between 1 and 10.\n" +
  "Step 4: 95,800,000 becomes 9.58.\n" +
  "Step 5: Count how many places the decimal moved (7 places). So, it is 9.58 × 10^7 Hz.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Units and Measurements?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I know the SI units for mass, length, and time.|Not yet|Almost|Got it!\n" +
  "I can convert between milli, kilo, and base units.|Not yet|Almost|Got it!\n" +
  "I can write large and small numbers in standard form.|Not yet|Almost|Got it!\n" +
  "I remember to convert units before doing calculations.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "Why is it important to use standard SI units in science?\n" +
  "What is the difference between 'm' and 'M' as prefixes?\n" +
  "EXIT_TICKET: Convert 450 mA (milliamps) into Amps (A).";

const MARK_SCHEME =
  "**Q1 - SI Units Table**\n" +
  "Length = metre (m). Mass = kilogram (kg). Time = second (s). Temperature = kelvin (K). Current = ampere (A). Force = newton (N). Energy = joule (J). Power = watt (W).\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It is the kilogram)  2. True  3. False (It means one millionth)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (1000)  2. C (3.5 × 10^4)  3. A (Divide by 1000)\n\n" +
  "**Q4 - Unit Conversions**\n" +
  "a) 5 km = 5000 m\n" +
  "b) 250 mA = 0.25 A\n" +
  "c) 3.5 kg = 3500 g\n" +
  "d) 45 cm = 0.45 m\n\n" +
  "**Q5 - Standard Form**\n" +
  "a) 4.5 × 10^4\n" +
  "b) 3.0 × 10^8\n" +
  "c) 2.5 × 10^-3\n" +
  "d) 1.2 × 10^-5\n\n" +
  "**Q6 - Applying Conversions to Equations**\n" +
  "a) Mass must be in kg. 500 g = 0.5 kg. F = ma = 0.5 * 4 = 2 N.\n" +
  "b) Distance must be in m. 2 km = 2000 m. Time must be in s. 5 mins = 300 s. Speed = 2000 / 300 = 6.67 m/s.\n\n" +
  "**Q7 - Prefixes**\n" +
  "a) Giga (G) = 10^9 (1,000,000,000)\n" +
  "b) Mega (M) = 10^6 (1,000,000)\n" +
  "c) Micro (μ) = 10^-6 (0.000001)\n" +
  "d) Nano (n) = 10^-9 (0.000000001)\n\n" +
  "**Q8 - Challenge**\n" +
  "a) Wavelength = 600 nm = 600 × 10^-9 m = 6.0 × 10^-7 m.\n" +
  "b) v = f * λ -> 3.0 × 10^8 = f * (6.0 × 10^-7) -> f = (3.0 × 10^8) / (6.0 × 10^-7) = 5.0 × 10^14 Hz.\n" +
  "c) 5.0 × 10^14 Hz = 500 × 10^12 Hz = 500 THz (Terahertz).";

const TEACHER_NOTES =
  "- Students often forget that the SI unit for mass is the kilogram (kg), not the gram (g). This is the only base unit with a prefix.\n" +
  "- When teaching standard form, emphasize that a negative power means a small decimal number, not a negative number.\n" +
  "- Encourage students to write down the conversion step explicitly before substituting into an equation.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-units", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-units", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-units", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-units", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-units-table",
    title: "Q1 - SI Units and Prefixes",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_UNITS,
    caption: "Table of SI base units and common prefixes.",
    content: "Look at the reference table. Cover the right-hand column and try to name the SI unit for each physical quantity.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-units", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. The SI unit for mass is the gram (g).\n2. The prefix 'kilo' means multiply by 1000.\n3. The prefix 'micro' means one thousandth.\n4. In standard form, the first number must be between 1 and 9.99."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. How many metres are in a kilometre?\nA. 100\nB. 1000\nC. 10,000\nD. 1,000,000\n\n" +
    "2. How is 35,000 written in standard form?\nA. 35 × 10^3\nB. 3.5 × 10^3\nC. 3.5 × 10^4\nD. 0.35 × 10^5\n\n" +
    "3. How do you convert milliamperes (mA) to amperes (A)?\nA. Divide by 1000\nB. Multiply by 1000\nC. Divide by 100\nD. Multiply by 100"
);

const Q4_MIXED = section(
  "q4-conversions",
  "q-short-answer",
  "Q4 - Unit Conversions",
  "Convert the following measurements into standard SI units:\n\na) 5 km to m\n\nb) 250 mA to A\n\nc) 3.5 kg to g\n\nd) 45 cm to m"
);

const Q4_FOUNDATION = section(
  "q4-conversions",
  "q-short-answer",
  "Q4 - Unit Conversions",
  "Convert the following measurements into standard SI units:\n\na) 5 km to m (Hint: multiply by 1000)\n\nb) 250 mA to A (Hint: divide by 1000)\n\nc) 3.5 kg to g (Hint: multiply by 1000)\n\nd) 45 cm to m (Hint: divide by 100)"
);

const Q5_MIXED = section(
  "q5-standard-form",
  "q-short-answer",
  "Q5 - Standard Form",
  "Write the following numbers in standard form:\n\na) 45,000\n\nb) 300,000,000\n\nc) 0.0025\n\nd) 0.000012"
);

const Q6_MIXED = section(
  "q6-applying",
  "q-extended",
  "Q6 - Applying Conversions to Equations",
  "In physics, you must convert units before using an equation. Calculate the following, showing your unit conversions first:\n\na) A force accelerates a 500 g mass at 4 m/s². Calculate the force (F = ma).\n\nb) A car travels 2 km in 5 minutes. Calculate its speed in m/s (Speed = Distance ÷ Time)."
);

const Q7_MIXED = section(
  "q7-prefixes",
  "q-short-answer",
  "Q7 - Prefixes",
  "State the meaning (as a number or power of 10) for the following prefixes:\n\na) Giga (G)\n\nb) Mega (M)\n\nc) Micro (μ)\n\nd) Nano (n)"
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A laser emits light with a wavelength of 600 nm (nanometres). The speed of light is 3.0 × 10^8 m/s.\n\na) Convert 600 nm into metres, writing your answer in standard form.\n\nb) Use the wave equation (v = f × λ) to calculate the frequency of the light.\n\nc) Write your final answer in standard form."
);

const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: a) First, convert 500 g to kg by dividing by 1000. Mass = ... kg. Then F = ...\nb) First, convert 2 km to m. Distance = ... m. Then convert 5 minutes to seconds. Time = ... s. Then Speed = ...");

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
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Units and Measurements - Mixed (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Units and Measurements - Foundation (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Units and Measurements - Higher (Year 9 Physics)",
    subtitle: "Curated KS3/GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Units and Measurements - Scaffolded (Year 9 Physics)",
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
    topicTags: ["units", "measurements", "physics", "nano_banana", "worksheet_units_measurements_y9"],
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
      "q1-units-table",
      DIAGRAM_UNITS,
      "Table of SI base units and common prefixes."
    );
  }

  console.log("\nUnits and Measurements (Year 9) curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
