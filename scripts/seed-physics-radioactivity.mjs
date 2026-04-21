#!/usr/bin/env node
/**
 * Seed script — Radioactivity and Half-Life (Physics, Year 11)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Radioactivity and Half-Life";
const YEAR_GROUP = "Year 11";
const SOURCE = "Adaptly Curated";

const DIAGRAM_NUCLEAR_DECAY = "/images/physics_nuclear_decay_nb.png";
const DIAGRAM_HALF_LIFE = "/images/physics_half_life_nb.png";

const KEY_VOCAB = [
  { term: "Radioactive decay", definition: "The random process where an unstable nucleus gives out radiation to become more stable." },
  { term: "Activity", definition: "The rate at which a source of unstable nuclei decays, measured in becquerels (Bq)." },
  { term: "Count-rate", definition: "The number of decays recorded each second by a detector (e.g., Geiger-Muller tube)." },
  { term: "Alpha particle (α)", definition: "A particle consisting of two neutrons and two protons (a helium nucleus)." },
  { term: "Beta particle (β)", definition: "A high-speed electron ejected from the nucleus as a neutron turns into a proton." },
  { term: "Gamma ray (γ)", definition: "Electromagnetic radiation from the nucleus." },
  { term: "Half-life", definition: "The time it takes for the number of nuclei of the isotope in a sample to halve." },
  { term: "Irradiation", definition: "The process of exposing an object to nuclear radiation. The irradiated object does not become radioactive." },
  { term: "Contamination", definition: "The unwanted presence of materials containing radioactive atoms on other materials." },
  { term: "Ionisation", definition: "The process where radiation knocks electrons out of atoms, turning them into ions." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Describe the properties of alpha, beta, and gamma radiation.\n" +
  "2. Write and balance nuclear decay equations.\n" +
  "3. Explain the concept of half-life and calculate it from a graph or data.\n" +
  "4. Understand the difference between irradiation and contamination.";

const KEY_VOCAB_CONTENT =
  "**Radioactive decay** — The random process where an unstable nucleus gives out radiation to become more stable.\n" +
  "**Activity** — The rate at which a source of unstable nuclei decays, measured in becquerels (Bq).\n" +
  "**Count-rate** — The number of decays recorded each second by a detector (e.g., Geiger-Muller tube).\n" +
  "**Alpha particle (α)** — A particle consisting of two neutrons and two protons (a helium nucleus).\n" +
  "**Beta particle (β)** — A high-speed electron ejected from the nucleus as a neutron turns into a proton.\n" +
  "**Gamma ray (γ)** — Electromagnetic radiation from the nucleus.\n" +
  "**Half-life** — The time it takes for the number of nuclei of the isotope in a sample to halve.\n" +
  "**Irradiation** — The process of exposing an object to nuclear radiation. The irradiated object does not become radioactive.\n" +
  "**Contamination** — The unwanted presence of materials containing radioactive atoms on other materials.\n" +
  "**Ionisation** — The process where radiation knocks electrons out of atoms, turning them into ions.";

const COMMON_MISTAKES =
  "1. Thinking radioactive decay can be predicted. It is a completely *random* process.\n" +
  "2. Confusing irradiation and contamination. Irradiation is just exposure; contamination means the radioactive source is actually *on* or *in* the object.\n" +
  "3. Forgetting that alpha particles are the most ionising but least penetrating.\n" +
  "4. Misreading half-life graphs. Always read the time taken for the activity to drop to exactly *half* its current value, not to zero.";

const WORKED_EXAMPLE =
  "Worked example: Calculating Half-Life\n\n" +
  "Question: A radioactive sample has an initial activity of 800 Bq. Its half-life is 5 days. Calculate its activity after 15 days.\n\n" +
  "Step 1: Find the number of half-lives. 15 days / 5 days = 3 half-lives.\n" +
  "Step 2: Halve the initial activity 3 times.\n" +
  "Step 3: After 1 half-life (5 days): 800 / 2 = 400 Bq.\n" +
  "Step 4: After 2 half-lives (10 days): 400 / 2 = 200 Bq.\n" +
  "Step 5: After 3 half-lives (15 days): 200 / 2 = 100 Bq.\n" +
  "Answer: The activity after 15 days is 100 Bq.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Radioactivity?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I can describe alpha, beta, and gamma radiation.|Not yet|Almost|Got it!\n" +
  "I can balance nuclear decay equations.|Not yet|Almost|Got it!\n" +
  "I can calculate half-life from a graph or data.|Not yet|Almost|Got it!\n" +
  "I can explain the difference between irradiation and contamination.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "Which type of radiation is the most penetrating?\n" +
  "Why is alpha radiation dangerous if swallowed?\n" +
  "EXIT_TICKET: A sample has an activity of 400 Bq. Its half-life is 2 hours. What is its activity after 4 hours?";

const MARK_SCHEME =
  "**Q1 - Types of Radiation**\n" +
  "Alpha: Stopped by paper, highly ionising. Beta: Stopped by aluminium, moderately ionising. Gamma: Reduced by lead, weakly ionising.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It is random)  2. True  3. False (Alpha is most ionising)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (Becquerels)  2. A (Helium nucleus)  3. C (Gamma)\n\n" +
  "**Q4 - Nuclear Equations**\n" +
  "a) Mass number decreases by 4, atomic number decreases by 2.\n" +
  "b) Mass number stays the same, atomic number increases by 1.\n" +
  "c) No change to mass or atomic number.\n\n" +
  "**Q5 - Half-Life Calculations**\n" +
  "a) 2 half-lives. 1000 -> 500 -> 250 Bq.\n" +
  "b) 100 -> 50 -> 25 -> 12.5. This is 3 half-lives. 3 * 10 = 30 years.\n" +
  "c) 800 -> 400 -> 200 -> 100. This is 3 half-lives. 12 hours / 3 = 4 hours.\n\n" +
  "**Q6 - Irradiation vs Contamination**\n" +
  "Irradiation is exposure to radiation from an outside source; the object does not become radioactive. Contamination is when radioactive atoms get onto or into the object, making it a source of radiation itself.\n\n" +
  "**Q7 - Dangers of Radiation**\n" +
  "Outside the body, gamma and beta are most dangerous because they can penetrate the skin and damage internal organs. Inside the body, alpha is most dangerous because it is highly ionising and does all its damage in a very localized area, unable to penetrate out of the body.\n\n" +
  "**Q8 - Challenge**\n" +
  "a) 24 days / 8 days = 3 half-lives.\n" +
  "b) 1/2 * 1/2 * 1/2 = 1/8. So 1/8 of the original sample remains.\n" +
  "c) 7/8 of the sample has decayed.";

const TEACHER_NOTES =
  "- Ensure students understand that 'activity' and 'count-rate' are related but not exactly the same (count-rate is what the detector actually measures).\n" +
  "- When balancing nuclear equations, remind students that the top numbers (mass) and bottom numbers (atomic) must balance on both sides of the arrow.\n" +
  "- Emphasize that half-life is a constant for a specific isotope, regardless of how much sample is present.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-radioactivity", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-radioactivity", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-radioactivity", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-radioactivity", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-nuclear-decay",
    title: "Q1 - Types of Radiation",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_NUCLEAR_DECAY,
    caption: "Diagram showing alpha, beta, and gamma radiation.",
    content: "Describe the penetrating power and ionising ability of alpha, beta, and gamma radiation.",
  };
}

function referenceHalfLifeSection() {
  return {
    id: "reference-half-life",
    title: "Reference - Half-Life",
    type: "diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_HALF_LIFE,
    caption: "Graph and table showing radioactive decay over time.",
    content: "Use this reference to help answer questions about half-life.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-radioactivity", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. We can predict exactly when a single radioactive nucleus will decay.\n2. An alpha particle is the same as a helium nucleus.\n3. Gamma radiation is the most ionising type of radiation.\n4. An irradiated object does not become radioactive."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What is the unit of radioactive activity?\nA. Joules\nB. Becquerels\nC. Sieverts\nD. Hertz\n\n" +
    "2. What is an alpha particle made of?\nA. 2 protons and 2 neutrons\nB. 1 high-speed electron\nC. An electromagnetic wave\nD. 4 protons\n\n" +
    "3. Which type of radiation is the most penetrating?\nA. Alpha\nB. Beta\nC. Gamma\nD. They are all the same"
);

const Q4_MIXED = section(
  "q4-equations",
  "q-short-answer",
  "Q4 - Nuclear Equations",
  "Describe what happens to the mass number and atomic number of a nucleus when it emits:\n\na) An alpha particle.\n\nb) A beta particle.\n\nc) A gamma ray."
);

const Q4_FOUNDATION = section(
  "q4-equations",
  "q-short-answer",
  "Q4 - Nuclear Equations",
  "Describe what happens to the mass number and atomic number of a nucleus when it emits:\n\na) An alpha particle. (Hint: it loses 2 protons and 2 neutrons).\n\nb) A beta particle. (Hint: a neutron turns into a proton).\n\nc) A gamma ray. (Hint: it is just energy)."
);

const Q5_MIXED = section(
  "q5-half-life",
  "q-short-answer",
  "Q5 - Half-Life Calculations",
  "Calculate the missing values:\n\na) Initial activity = 1000 Bq. Half-life = 2 days. What is the activity after 4 days?\n\nb) Initial activity = 100 Bq. Current activity = 12.5 Bq. Half-life = 10 years. How much time has passed?\n\nc) Initial activity = 800 Bq. Activity after 12 hours = 100 Bq. What is the half-life?"
);

const Q5_FOUNDATION = section(
  "q5-half-life",
  "q-short-answer",
  "Q5 - Half-Life Calculations",
  "Calculate the missing values by halving the activity:\n\na) Initial activity = 1000 Bq. Half-life = 2 days. What is the activity after 4 days? (Hint: this is 2 half-lives. Halve 1000 twice).\n\nb) Initial activity = 100 Bq. Current activity = 12.5 Bq. Half-life = 10 years. How much time has passed? (Hint: count how many times you halve 100 to get to 12.5).\n\nc) Initial activity = 800 Bq. Activity after 12 hours = 100 Bq. What is the half-life? (Hint: count how many half-lives fit into 12 hours)."
);

const Q6_MIXED = section(
  "q6-irradiation",
  "q-extended",
  "Q6 - Irradiation vs Contamination",
  "Explain the difference between irradiation and contamination."
);

const Q7_MIXED = section(
  "q7-dangers",
  "q-extended",
  "Q7 - Dangers of Radiation",
  "Explain why alpha radiation is the most dangerous type of radiation inside the body, but the least dangerous outside the body."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "Iodine-131 has a half-life of 8 days.\n\na) How many half-lives will occur in 24 days?\n\nb) What fraction of the original Iodine-131 will remain after 24 days?\n\nc) What fraction will have decayed?"
);

const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: Irradiation is when an object is...\nContamination is when radioactive atoms...\nAn irradiated object does not become...");
const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: Inside the body, alpha is dangerous because it is highly...\nIt cannot penetrate out of the body, so it damages...\nOutside the body, alpha is least dangerous because it is stopped by...");

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED,
  referenceHalfLifeSection(),
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
  referenceHalfLifeSection(),
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
  referenceHalfLifeSection(),
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
  referenceHalfLifeSection(),
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
    title: "Radioactivity and Half-Life - Mixed (Year 11 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Radioactivity and Half-Life - Foundation (Year 11 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Radioactivity and Half-Life - Higher (Year 11 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Radioactivity and Half-Life - Scaffolded (Year 11 Physics)",
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
    topicTags: ["radioactivity", "half-life", "physics", "nano_banana", "worksheet_radioactivity_y11"],
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
      "q1-nuclear-decay",
      DIAGRAM_NUCLEAR_DECAY,
      "Diagram showing alpha, beta, and gamma radiation."
    );

    await ensureAsset(
      token,
      entryId,
      "reference-half-life",
      DIAGRAM_HALF_LIFE,
      "Graph and table showing radioactive decay over time."
    );
  }

  console.log("\nRadioactivity curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
