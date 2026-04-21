#!/usr/bin/env node
/**
 * Seed script — Nuclear Decay Equations (Physics, Year 10)
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Physics";
const TOPIC = "Nuclear Decay Equations";
const YEAR_GROUP = "Year 10";
const SOURCE = "Adaptly Curated";

const DIAGRAM_EQUATIONS = "/images/physics_nuclear_equations_nb.png";

const KEY_VOCAB = [
  { term: "Nuclear equation", definition: "An equation showing the changes in a nucleus during radioactive decay." },
  { term: "Mass number", definition: "The total number of protons and neutrons in a nucleus (the top number)." },
  { term: "Atomic number", definition: "The number of protons in a nucleus (the bottom number)." },
  { term: "Alpha particle (α)", definition: "A helium nucleus (2 protons, 2 neutrons). Mass number 4, atomic number 2." },
  { term: "Beta particle (β)", definition: "A high-speed electron. Mass number 0, atomic number -1." },
  { term: "Gamma ray (γ)", definition: "An electromagnetic wave. Mass number 0, atomic number 0." },
  { term: "Parent nucleus", definition: "The original unstable nucleus before it decays." },
  { term: "Daughter nucleus", definition: "The new nucleus formed after radioactive decay." },
  { term: "Conservation of mass", definition: "The total mass number must be the same on both sides of the equation." },
  { term: "Conservation of charge", definition: "The total atomic number must be the same on both sides of the equation." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Identify the symbols and numbers used for alpha, beta, and gamma radiation.\n" +
  "2. Explain the rules for balancing nuclear equations.\n" +
  "3. Complete and balance nuclear equations for alpha and beta decay.\n" +
  "4. Determine the identity of an unknown daughter nucleus using the periodic table.";

const KEY_VOCAB_CONTENT =
  "**Nuclear equation** — An equation showing the changes in a nucleus during radioactive decay.\n" +
  "**Mass number** — The total number of protons and neutrons in a nucleus (the top number).\n" +
  "**Atomic number** — The number of protons in a nucleus (the bottom number).\n" +
  "**Alpha particle (α)** — A helium nucleus (2 protons, 2 neutrons). Mass number 4, atomic number 2.\n" +
  "**Beta particle (β)** — A high-speed electron. Mass number 0, atomic number -1.\n" +
  "**Gamma ray (γ)** — An electromagnetic wave. Mass number 0, atomic number 0.\n" +
  "**Parent nucleus** — The original unstable nucleus before it decays.\n" +
  "**Daughter nucleus** — The new nucleus formed after radioactive decay.\n" +
  "**Conservation of mass** — The total mass number must be the same on both sides of the equation.\n" +
  "**Conservation of charge** — The total atomic number must be the same on both sides of the equation.";

const COMMON_MISTAKES =
  "1. Adding instead of subtracting in alpha decay. The daughter nucleus must have a *smaller* mass and atomic number.\n" +
  "2. Subtracting 1 instead of adding 1 in beta decay. The atomic number of the beta particle is -1, so the daughter nucleus atomic number must *increase* by 1 to balance.\n" +
  "3. Changing the numbers in gamma decay. Gamma rays have no mass and no charge, so the numbers do not change.\n" +
  "4. Forgetting that the atomic number determines the element. If the atomic number changes, the chemical symbol must change.";

const WORKED_EXAMPLE =
  "Worked example: Balancing an Alpha Decay Equation\n\n" +
  "Question: Uranium-238 (atomic number 92) decays by emitting an alpha particle. Write the balanced nuclear equation.\n\n" +
  "Step 1: Write the parent nucleus. 238/92 U.\n" +
  "Step 2: Write the alpha particle on the right side. 4/2 He.\n" +
  "Step 3: Calculate the new mass number (top). 238 - 4 = 234.\n" +
  "Step 4: Calculate the new atomic number (bottom). 92 - 2 = 90.\n" +
  "Step 5: Identify the new element (atomic number 90 is Thorium, Th).\n" +
  "Answer: 238/92 U → 234/90 Th + 4/2 He.";

const SELF_REFLECTION =
  "SUBTITLE: How well do you understand Nuclear Equations?\n" +
  "CONFIDENCE_TABLE:\n" +
  "I know the symbols and numbers for alpha, beta, and gamma.|Not yet|Almost|Got it!\n" +
  "I can balance the top numbers (mass) in an equation.|Not yet|Almost|Got it!\n" +
  "I can balance the bottom numbers (atomic) in an equation.|Not yet|Almost|Got it!\n" +
  "I remember that beta decay increases the atomic number by 1.|Not yet|Almost|Got it!\n" +
  "WRITTEN_PROMPTS:\n" +
  "What happens to the mass number during beta decay?\n" +
  "Why does the element change during alpha and beta decay?\n" +
  "EXIT_TICKET: Carbon-14 (14/6 C) emits a beta particle. What are the mass and atomic numbers of the new nucleus?";

const MARK_SCHEME =
  "**Q1 - Analysing Nuclear Equations**\n" +
  "a) The mass number decreases by 4 and the atomic number decreases by 2.\n" +
  "b) The mass number stays the same and the atomic number increases by 1.\n" +
  "c) Neither the mass number nor the atomic number changes.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False (It is 4/2 He)  2. True  3. False (It increases by 1)  4. True\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B (0/-1 e)  2. A (They must be equal)  3. C (It stays the same)\n\n" +
  "**Q4 - Completing Alpha Equations**\n" +
  "a) 210/84 Po → 206/82 Pb + 4/2 He\n" +
  "b) 222/86 Rn → 218/84 Po + 4/2 He\n" +
  "c) 241/95 Am → 237/93 Np + 4/2 He\n\n" +
  "**Q5 - Completing Beta Equations**\n" +
  "a) 14/6 C → 14/7 N + 0/-1 e\n" +
  "b) 90/38 Sr → 90/39 Y + 0/-1 e\n" +
  "c) 131/53 I → 131/54 Xe + 0/-1 e\n\n" +
  "**Q6 - Identifying the Decay Type**\n" +
  "a) Alpha decay (mass decreased by 4, atomic decreased by 2).\n" +
  "b) Beta decay (mass stayed same, atomic increased by 1).\n" +
  "c) Gamma decay (no change to mass or atomic numbers).\n\n" +
  "**Q7 - The Beta Particle**\n" +
  "In beta decay, a neutron inside the nucleus turns into a proton and an electron. The proton stays in the nucleus (which is why the atomic number increases by 1), and the high-speed electron is emitted as a beta particle.\n\n" +
  "**Q8 - Challenge**\n" +
  "a) After one alpha decay: 232/90 Th → 228/88 Ra + 4/2 He.\n" +
  "b) After the first beta decay: 228/88 Ra → 228/89 Ac + 0/-1 e.\n" +
  "c) After the second beta decay: 228/89 Ac → 228/90 Th + 0/-1 e.\n" +
  "d) The final nucleus is Thorium-228 (228/90 Th). It is an isotope of the original Thorium-232 because it has the same atomic number (90) but a different mass number.";

const TEACHER_NOTES =
  "- Ensure students understand that the arrow in a nuclear equation means 'decays into' or 'becomes'.\n" +
  "- The most common error is subtracting 1 instead of adding 1 for the atomic number in beta decay. Remind them that X = Y + (-1), so Y must be X + 1.\n" +
  "- For the challenge question, students will need to realize that emitting two beta particles cancels out the atomic number change of one alpha particle, returning the nucleus to the original element (an isotope).";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-nuclear-equations", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-nuclear-equations", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-nuclear-equations", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-nuclear-equations", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-equations-diagram",
    title: "Q1 - Analysing Nuclear Equations",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: DIAGRAM_EQUATIONS,
    caption: "Examples of alpha, beta, and gamma decay equations.",
    content: "Look at the diagram showing the three types of decay equations.\n\na) What happens to the mass number and atomic number during alpha decay?\n\nb) What happens to the mass number and atomic number during beta decay?\n\nc) What happens to the mass number and atomic number during gamma emission?",
  };
}

function selfReflectionSection() {
  return section("self-reflection-nuclear-equations", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. The symbol for an alpha particle is 0/-1 e.\n2. The total mass number on the left side of the arrow must equal the total mass number on the right side.\n3. During beta decay, the atomic number of the nucleus decreases by 1.\n4. Gamma rays have no mass and no charge."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. What is the correct symbol and numbers for a beta particle?\nA. 4/2 He\nB. 0/-1 e\nC. 1/0 n\nD. 0/0 γ\n\n" +
    "2. What is the rule for balancing nuclear equations?\nA. Top numbers must balance, bottom numbers must balance\nB. Top numbers must be bigger than bottom numbers\nC. The right side must have smaller numbers than the left side\nD. You only need to balance the mass numbers\n\n" +
    "3. What happens to the mass number during beta decay?\nA. It increases by 1\nB. It decreases by 1\nC. It stays the same\nD. It decreases by 4"
);

const Q4_MIXED = section(
  "q4-alpha",
  "q-short-answer",
  "Q4 - Completing Alpha Equations",
  "Complete the following alpha decay equations by finding the missing mass and atomic numbers:\n\na) 210/84 Po → ___/___ Pb + 4/2 He\n\nb) 222/86 Rn → ___/___ Po + 4/2 He\n\nc) 241/95 Am → ___/___ Np + 4/2 He"
);

const Q4_FOUNDATION = section(
  "q4-alpha",
  "q-short-answer",
  "Q4 - Completing Alpha Equations",
  "Complete the following alpha decay equations. (Hint: subtract 4 from the top number, subtract 2 from the bottom number):\n\na) 210/84 Po → ___/___ Pb + 4/2 He\n\nb) 222/86 Rn → ___/___ Po + 4/2 He\n\nc) 241/95 Am → ___/___ Np + 4/2 He"
);

const Q5_MIXED = section(
  "q5-beta",
  "q-short-answer",
  "Q5 - Completing Beta Equations",
  "Complete the following beta decay equations by finding the missing mass and atomic numbers:\n\na) 14/6 C → ___/___ N + 0/-1 e\n\nb) 90/38 Sr → ___/___ Y + 0/-1 e\n\nc) 131/53 I → ___/___ Xe + 0/-1 e"
);

const Q5_FOUNDATION = section(
  "q5-beta",
  "q-short-answer",
  "Q5 - Completing Beta Equations",
  "Complete the following beta decay equations. (Hint: the top number stays the same, ADD 1 to the bottom number):\n\na) 14/6 C → ___/___ N + 0/-1 e\n\nb) 90/38 Sr → ___/___ Y + 0/-1 e\n\nc) 131/53 I → ___/___ Xe + 0/-1 e"
);

const Q6_MIXED = section(
  "q6-identify",
  "q-short-answer",
  "Q6 - Identifying the Decay Type",
  "Look at the changes in the numbers and state whether each equation shows alpha, beta, or gamma decay:\n\na) 226/88 Ra → 222/86 Rn + radiation\n\nb) 40/19 K → 40/20 Ca + radiation\n\nc) 99m/43 Tc → 99/43 Tc + radiation"
);

const Q7_MIXED = section(
  "q7-beta-explain",
  "q-extended",
  "Q7 - The Beta Particle",
  "A beta particle is an electron, but there are no electrons inside the nucleus. Explain where the beta particle comes from during beta decay, and why the atomic number increases by 1."
);

const Q8_CHALLENGE = section(
  "q8-challenge",
  "q-challenge",
  "Q8 - Challenge Question",
  "A nucleus of Thorium-232 (232/90 Th) undergoes a decay series. It first emits an alpha particle, then emits a beta particle, and then emits another beta particle.\n\na) Write the equation for the first alpha decay.\n\nb) Write the equation for the first beta decay.\n\nc) Write the equation for the second beta decay.\n\nd) What is the final nucleus produced? How is it related to the original Thorium-232 nucleus?"
);

const SS_Q7 = section("ss-q7", "sentence-starters", "Q7 - Sentence Starters", "Sentence starters: During beta decay, a neutron inside the nucleus turns into...\nThe proton stays in the nucleus, which is why the atomic number...\nThe electron is emitted at high speed as a...");

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
  Q5_FOUNDATION,
  Q6_MIXED,
  Q7_MIXED,
  SS_Q7,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Nuclear Decay Equations - Mixed (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Nuclear Decay Equations - Foundation (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Nuclear Decay Equations - Higher (Year 10 Physics)",
    subtitle: "Curated GCSE Physics worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "scaffolded",
    title: "Nuclear Decay Equations - Scaffolded (Year 10 Physics)",
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
    topicTags: ["nuclear equations", "decay", "radioactivity", "physics", "nano_banana", "worksheet_nuclear_decay_y10"],
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
      "q1-equations-diagram",
      DIAGRAM_EQUATIONS,
      "Examples of alpha, beta, and gamma decay equations."
    );
  }

  console.log("\nNuclear Decay Equations (Year 10) curated worksheets seeded successfully.");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
