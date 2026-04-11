#!/usr/bin/env node
/**
 * Seed script — Atomic Structure (Chemistry, Year 11)
 *
 * Purpose:
 *  - Create curated Atomic Structure library entries that load instantly.
 *  - Keep the Nano Banana atom diagrams stable through worksheet_library_assets.
 *  - Ensure the mixed worksheet is the canonical reference used for Year 11,
 *    while Foundation, Higher, and Scaffolded are available for one-click tier switches.
 *
 * Run:
 *   APP_URL=https://adaptly.co.uk node scripts/seed-atomic-structure.mjs
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

const SUBJECT = "Chemistry";
const TOPIC = "Atomic Structure";
const YEAR_GROUP = "Year 11";
const SOURCE = "Adaptly Curated";

// Nano Banana assets only
const UNLABELLED_DIAGRAM_URL = "/images/atom_nb_unlabelled_final.png";
const LABELLED_DIAGRAM_URL = "/images/atom_nb_labelled_final.png";

const KEY_VOCAB = [
  { term: "Atom", definition: "The smallest particle of an element that retains its chemical properties." },
  { term: "Proton", definition: "A positively charged particle found in the nucleus." },
  { term: "Neutron", definition: "A neutral particle found in the nucleus." },
  { term: "Electron", definition: "A negatively charged particle found in shells around the nucleus." },
  { term: "Nucleus", definition: "The dense central part of the atom containing protons and neutrons." },
  { term: "Atomic number", definition: "The number of protons in an atom." },
  { term: "Mass number", definition: "The total number of protons and neutrons in an atom." },
  { term: "Isotope", definition: "Atoms of the same element with the same number of protons but different numbers of neutrons." },
  { term: "Electron shell", definition: "An energy level around the nucleus where electrons are found." },
  { term: "Electronic configuration", definition: "The arrangement of electrons in shells, for example 2,8,1." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Describe the structure of an atom and identify the three subatomic particles.\n" +
  "2. Use atomic number and mass number to work out the numbers of protons, neutrons and electrons.\n" +
  "3. Draw and interpret shell diagrams for simple atoms.\n" +
  "4. Explain what isotopes are.";

const KEY_VOCAB_CONTENT =
  "**Atom** — The smallest particle of an element that retains its chemical properties.\n" +
  "**Proton** — A positively charged particle found in the nucleus.\n" +
  "**Neutron** — A neutral particle found in the nucleus.\n" +
  "**Electron** — A negatively charged particle found in shells around the nucleus.\n" +
  "**Nucleus** — The dense central part of the atom containing protons and neutrons.\n" +
  "**Atomic number** — The number of protons in an atom.\n" +
  "**Mass number** — The total number of protons and neutrons in an atom.\n" +
  "**Isotope** — Atoms of the same element with the same number of protons but different numbers of neutrons.\n" +
  "**Electron shell** — An energy level around the nucleus where electrons are found.\n" +
  "**Electronic configuration** — The arrangement of electrons in shells, for example 2,8,1.";

const COMMON_MISTAKES =
  "1. Atomic number tells you the number of protons, not the total number of particles.\n" +
  "2. Mass number is protons plus neutrons; electrons do not contribute meaningfully to mass number.\n" +
  "3. In a neutral atom, the number of electrons equals the number of protons.\n" +
  "4. Isotopes are the same element because they have the same number of protons.";

const WORKED_EXAMPLE =
  "Worked example: Sodium (Na)\n\n" +
  "Atomic number = 11, so sodium has 11 protons.\n" +
  "A neutral sodium atom also has 11 electrons.\n" +
  "Mass number = 23, so neutrons = 23 - 11 = 12.\n" +
  "Electronic configuration = 2,8,1.";

const SELF_REFLECTION =
  "Self-check:\n" +
  "- I can name the three subatomic particles and give their charges.\n" +
  "- I can calculate protons, neutrons and electrons.\n" +
  "- I can write simple electronic configurations.\n" +
  "- I can explain what an isotope is.\n\n" +
  "Exit ticket: Write the electronic configuration for argon (atomic number 18).";

const MARK_SCHEME =
  "**Q1 - Label the atom diagram**\n" +
  "Nucleus; proton; neutron; electron; electron shell.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False  2. True  3. False  4. True  5. False\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B  2. C  3. A\n\n" +
  "**Q4 - Particle properties**\n" +
  "Proton: +1 and 1\nNeutron: 0 and 1\nElectron: -1 and negligible\n\n" +
  "**Q5 - Chlorine-35**\n" +
  "17 protons, 18 neutrons, 17 electrons.\n\n" +
  "**Q6 - Electronic configurations**\n" +
  "Lithium 2,1; Oxygen 2,6; Magnesium 2,8,2.\n\n" +
  "**Q7 - Complete the table**\n" +
  "Carbon: 6, 6, 6. Sodium: 11, 12, 11. Calcium: 20, 20, 20.\n\n" +
  "**Q8 - Carbon-12 diagram**\n" +
  "6 protons and 6 neutrons.\n\n" +
  "**Q9 - Isotopes of carbon**\n" +
  "8 neutrons; different numbers of neutrons; same number of protons.\n\n" +
  "**Q10 - Neutral atoms**\n" +
  "Atoms are neutral because the positive and negative charges balance.\n\n" +
  "**Q11 - Similar properties**\n" +
  "Sodium and potassium both have one electron in the outer shell, so they behave similarly.\n\n" +
  "**Q12 - Challenge**\n" +
  "Atomic number 17; mass number 35; configuration 2,8,7; Group 7 because it has seven outer-shell electrons.";

const HIGHER_MARK_SCHEME =
  "**Q1 - Label the atom diagram**\n" +
  "Nucleus; proton; neutron; electron; electron shell.\n\n" +
  "**Q2 - True or False**\n" +
  "1. False  2. True  3. False  4. True  5. False\n\n" +
  "**Q3 - Multiple choice**\n" +
  "1. B  2. B  3. A\n\n" +
  "**Q4 - Particle properties**\n" +
  "Proton: +1 and 1\nNeutron: 0 and 1\nElectron: -1 and 1/1840\n\n" +
  "**Q5 - Chlorine-35 & 37**\n" +
  "a) 17p, 18n, 17e. b) Isotopes have same protons but different neutrons.\n\n" +
  "**Q6 - Electronic configurations**\n" +
  "Lithium 2,1; Oxygen 2,6; Magnesium 2,8,2; Fluorine 2,7.\n\n" +
  "**Q7 - Complete the table**\n" +
  "Carbon: 6, 6, 6. Sodium: 11, 12, 11. Calcium: 20, 20, 20.\n\n" +
  "**Q8 - Evidence for Nucleus**\n" +
  "Alpha particles deflected/bounced back by concentrated positive charge.\n\n" +
  "**Q9 - Relative Atomic Mass**\n" +
  "RAM = 6.925.\n\n" +
  "**Q10 - Nuclear Charge**\n" +
  "Positive charge from protons in nucleus.\n\n" +
  "**Q11 - Group Properties**\n" +
  "Both have 1 electron in outer shell.\n\n" +
  "**Q12 - Challenge (Period 2)**\n" +
  "Fluorine is in Period 2 because it has 2 occupied shells.";

const TEACHER_NOTES =
  "- Use the unlabelled Nano Banana diagram for the first labelling task.\n" +
  "- Use the labelled Nano Banana diagram later as a checking scaffold.\n" +
  "- Keep terminology consistent: atomic number, mass number, proton, neutron, electron, isotope.\n" +
  "- Remind students that shell models are simplified teaching models.";

function section(id, type, title, content, extra = {}) {
  return { id, type, title, content, teacherOnly: false, ...extra };
}

function openingSections() {
  return [
    section("lo-atomic-structure", "objective", "Learning Objective", LEARNING_OBJECTIVE),
    section("vocab-atomic-structure", "vocabulary", "Key Vocabulary", KEY_VOCAB_CONTENT),
    section("mistakes-atomic-structure", "common-mistakes", "Common Mistakes to Avoid", COMMON_MISTAKES),
    section("worked-example-atomic-structure", "example", "Worked Example", WORKED_EXAMPLE),
  ];
}

function q1DiagramSection() {
  return {
    id: "q1-label-diagram",
    title: "Q1 - Label the Diagram",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: UNLABELLED_DIAGRAM_URL,
    caption: "Unlabelled Bohr model of a carbon atom for the labelling task.",
    content:
      "Use the word bank to label the five parts of the atom.\n\n" +
      "Word bank: nucleus, proton, neutron, electron, electron shell.",
  };
}

function labelledReferenceSection() {
  return {
    id: "reference-labelled-carbon",
    title: "Reference Diagram - Carbon Atom",
    type: "diagram",
    teacherOnly: false,
    imageUrl: LABELLED_DIAGRAM_URL,
    caption: "Labelled Bohr model of a carbon atom used as a reference scaffold.",
    content: "Use this labelled reference diagram to check particle placement and shell structure.",
  };
}

function selfReflectionSection() {
  return section("self-reflection-atomic-structure", "self-reflection", "Self Reflection", SELF_REFLECTION);
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
  "1. Electrons are found inside the nucleus.\n2. The atomic number tells you the number of protons.\n3. The mass number includes the mass of electrons.\n4. In a neutral atom, protons equal electrons.\n5. Isotopes of the same element have different numbers of protons."
);

const Q3_MIXED_FOUNDATION = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. Which subatomic particle has a relative charge of +1?\nA. Neutron\nB. Proton\nC. Electron\nD. Nucleus\n\n" +
    "2. What does the mass number tell you?\nA. Number of protons only\nB. Number of neutrons only\nC. Total number of protons and neutrons\nD. Number of electrons\n\n" +
    "3. What is the electronic configuration of sodium?\nA. 2,8,1\nB. 2,9\nC. 3,8\nD. 2,8,3"
);

const Q3_HIGHER = section(
  "q3-mcq",
  "q-mcq",
  "Q3 - Multiple Choice",
  "1. An atom has 8 protons, 8 neutrons and 8 electrons. What is its mass number?\nA. 8\nB. 16\nC. 24\nD. 0\n\n" +
    "2. Which statement describes an isotope correctly?\nA. Same mass number but different atomic number\nB. Same atomic number but different mass number\nC. Same electrons but different charge\nD. Different element with the same neutrons\n\n" +
    "3. Fluorine has atomic number 9 and mass number 19. What is its electronic configuration?\nA. 2,7\nB. 2,8,1\nC. 3,6\nD. 9"
);

const Q4_MIXED_HIGHER = section(
  "q4-particle-properties",
  "q-data-table",
  "Q4 - Subatomic Particle Properties",
  "Complete the table below.\n\n| Particle | Relative charge | Relative mass |\n|---|---|---|\n| Proton | [answer] | [answer] |\n| Neutron | [answer] | [answer] |\n| Electron | [answer] | [answer] |"
);

const Q4_FOUNDATION = section(
  "q4-particle-properties",
  "q-data-table",
  "Q4 - Subatomic Particle Properties",
  "Complete the table below. The proton row has been started for you.\n\n| Particle | Relative charge | Relative mass |\n|---|---|---|\n| Proton | +1 | [answer] |\n| Neutron | [answer] | [answer] |\n| Electron | [answer] | [answer] |"
);

const Q5_MIXED = section(
  "q5-chlorine-35",
  "q-short-answer",
  "Q5 - Chlorine-35",
  "An atom of chlorine is written as 35/17 Cl.\n\na) How many protons does it have?\n\nb) How many neutrons does it have?\n\nc) How many electrons does it have?"
);

const Q5_FOUNDATION = section(
  "q5-chlorine-35",
  "q-short-answer",
  "Q5 - Chlorine-35",
  "An atom of chlorine is written as 35/17 Cl.\nAtomic number = 17. Mass number = 35.\n\na) How many protons does it have?\n\nb) How many neutrons does it have? Hint: mass number - atomic number.\n\nc) How many electrons does it have? Hint: in a neutral atom, electrons = protons."
);

const Q5_HIGHER = section(
  "q5-chlorine-35",
  "q-short-answer",
  "Q5 - Chlorine-35",
  "An atom of chlorine is written as 35/17 Cl.\n\na) State the number of protons, neutrons and electrons.\n\nb) Chlorine-37 is an isotope of chlorine. Explain what this means."
);

const Q6_MIXED = section(
  "q6-electronic-configurations",
  "q-short-answer",
  "Q6 - Electronic Configurations",
  "Write the electronic configuration for: lithium (Z = 3), oxygen (Z = 8) and magnesium (Z = 12)."
);

const Q6_FOUNDATION = section(
  "q6-electronic-configurations",
  "q-short-answer",
  "Q6 - Electronic Configurations",
  "Write the electronic configuration for: lithium (Z = 3), oxygen (Z = 8) and magnesium (Z = 12).\nRemember: the first shell holds 2 electrons; the second and third shells hold up to 8."
);

const Q6_HIGHER = section(
  "q6-electronic-configurations",
  "q-short-answer",
  "Q6 - Electronic Configurations",
  "Write the electronic configuration for lithium, oxygen and magnesium, and state the group for each element."
);

const Q7_MIXED_HIGHER = section(
  "q7-complete-table",
  "q-data-table",
  "Q7 - Complete the Table",
  "Complete the table below.\n\n| Element | Atomic number | Mass number | Protons | Neutrons | Electrons |\n|---|---|---|---|---|---|\n| Carbon | 6 | 12 | [answer] | [answer] | [answer] |\n| Sodium | 11 | 23 | [answer] | [answer] | [answer] |\n| Calcium | 20 | 40 | [answer] | [answer] | [answer] |"
);

const Q7_FOUNDATION = section(
  "q7-complete-table",
  "q-data-table",
  "Q7 - Complete the Table",
  "Complete the table below. Use: neutrons = mass number - atomic number.\n\n| Element | Atomic number | Mass number | Protons | Neutrons | Electrons |\n|---|---|---|---|---|---|\n| Carbon | 6 | 12 | [answer] | [answer] | [answer] |\n| Sodium | 11 | 23 | [answer] | [answer] | [answer] |\n| Calcium | 20 | 40 | [answer] | [answer] | [answer] |"
);

const Q8_BASE_FOUNDATION = section(
  "q8-carbon-12",
  "q-short-answer",
  "Q8 - Carbon Diagram Questions",
  "Use the labelled reference diagram.\n\na) How many protons are in the nucleus?\n\nb) How many neutrons are in the nucleus?"
);

const Q8_HIGHER = section(
  "q8-carbon-12",
  "q-short-answer",
  "Q8 - Carbon Diagram Questions",
  "Use the labelled reference diagram.\n\na) State the number of protons and neutrons in carbon-12.\n\nb) Write the electronic configuration of carbon and identify its period."
);

const Q9_MIXED_FOUNDATION = section(
  "q9-isotopes",
  "q-short-answer",
  "Q9 - Isotopes of Carbon",
  "Carbon-14 has atomic number 6 and mass number 14.\n\na) How many neutrons does carbon-14 have?\n\nb) How is carbon-14 different from carbon-12?\n\nc) How is carbon-14 the same as carbon-12?"
);

const Q9_SCAFFOLDED = section(
  "q9-isotopes",
  "q-short-answer",
  "Q9 - Isotopes of Carbon",
  "Carbon-14 has atomic number 6 and mass number 14.\n\na) How many neutrons does carbon-14 have? Hint: 14 - 6.\n\nb) How is carbon-14 different from carbon-12?\n\nc) How is carbon-14 the same as carbon-12?"
);

const Q9_HIGHER = section(
  "q9-isotopes",
  "q-short-answer",
  "Q9 - Isotopes of Carbon",
  "Carbon-14 is a radioactive isotope of carbon.\n\na) How many neutrons does it have?\n\nb) Explain why carbon-14 and carbon-12 are isotopes of the same element.\n\nc) Explain why they have the same chemical properties."
);

const Q10_MIXED = section(
  "q10-neutral-atoms",
  "q-short-answer",
  "Q10 - Electrical Neutrality",
  "Explain why atoms are electrically neutral."
);

const Q10_FOUNDATION = section(
  "q10-neutral-atoms",
  "q-short-answer",
  "Q10 - Electrical Neutrality",
  "Explain why atoms are electrically neutral. Hint: think about the charges of protons and electrons."
);

const Q10_HIGHER = section(
  "q10-neutral-atoms",
  "q-short-answer",
  "Q10 - Electrical Neutrality",
  "Explain, in terms of subatomic particles, why atoms are electrically neutral."
);

const Q11_MIXED = section(
  "q11-group-properties",
  "q-extended",
  "Q11 - Similar Properties",
  "Sodium and potassium are both in Group 1. Explain why they have similar chemical properties."
);

const Q11_FOUNDATION = section(
  "q11-group-properties",
  "q-extended",
  "Q11 - Similar Properties",
  "Sodium and potassium are both in Group 1. Explain why they have similar chemical properties. Hint: consider the outer-shell electrons."
);

const Q11_HIGHER = section(
  "q11-group-properties",
  "q-extended",
  "Q11 - Group Properties",
  "Sodium and potassium are both in Group 1. Using electronic configurations, explain why they have similar chemical properties."
);

const Q12_MIXED_FOUNDATION = section(
  "q12-challenge",
  "q-challenge",
  "Q12 - Challenge Question",
  "An element X has 17 protons and 18 neutrons.\n\na) What is its atomic number?\n\nb) What is its mass number?\n\nc) Write its electronic configuration.\n\nd) Which group is it in? Explain your answer."
);

const Q12_HIGHER = section(
  "q12-challenge",
  "q-challenge",
  "Q12 - Challenge Question",
  "An element X has 17 protons and 18 neutrons.\n\na) Determine its atomic number and mass number.\n\nb) Write its electronic configuration and identify its group and period.\n\nc) The atom forms a 1- ion. Explain how this happens and how many electrons the ion has."
);

const SS_Q2 = section("ss-q2", "sentence-starters", "Q2 - Sentence Starters", "Sentence starters: I know this statement is true or false because...\nThe atomic number tells us...\nIn a neutral atom...");
const SS_Q5 = section("ss-q5", "sentence-starters", "Q5 - Sentence Starters", "Sentence starters: The number of protons is...\nTo find neutrons, I...\nThe number of electrons is...");
const SS_Q6 = section("ss-q6", "sentence-starters", "Q6 - Sentence Starters", "Sentence starters: First I fill the first shell with...\nThen I place the remaining electrons...\nThe configuration is written as...");
const SS_Q9 = section("ss-q9", "sentence-starters", "Q9 - Sentence Starters", "Sentence starters: Carbon-14 is different because...\nIt is still carbon because...\nIsotopes are...");
const SS_Q10 = section("ss-q10", "sentence-starters", "Q10 - Sentence Starters", "Sentence starters: Atoms are neutral because...\nThe positive charges are balanced by...");
const SS_Q11 = section("ss-q11", "sentence-starters", "Q11 - Sentence Starters", "Sentence starters: Sodium has...\nPotassium has...\nElements in the same group...");
const SS_Q12 = section("ss-q12", "sentence-starters", "Q12 - Sentence Starters", "Sentence starters: The atomic number is...\nThe mass number is...\nThe electronic configuration is...\nThe element is in Group...");

const FORMULA_REFERENCE = section(
  "formula-reference",
  "reminder-box",
  "Formula Reference Card",
  "Key reminders:\n- Protons = atomic number\n- Electrons = protons in a neutral atom\n- Neutrons = mass number - atomic number\n- First shell holds 2 electrons\n- Second and third shells hold up to 8 electrons"
);

const BASE_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_MIXED_HIGHER,
  Q5_MIXED,
  Q6_MIXED,
  Q7_MIXED_HIGHER,
  labelledReferenceSection(),
  Q8_BASE_FOUNDATION,
  Q9_MIXED_FOUNDATION,
  Q10_MIXED,
  Q11_MIXED,
  Q12_MIXED_FOUNDATION,
  selfReflectionSection(),
];

const FOUNDATION_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_MIXED_FOUNDATION,
  Q4_FOUNDATION,
  Q5_FOUNDATION,
  Q6_FOUNDATION,
  Q7_FOUNDATION,
  labelledReferenceSection(),
  Q8_BASE_FOUNDATION,
  Q9_MIXED_FOUNDATION,
  Q10_FOUNDATION,
  Q11_FOUNDATION,
  Q12_MIXED_FOUNDATION,
  selfReflectionSection(),
];

const HIGHER_SECTIONS = [
  ...openingSections(),
  q1DiagramSection(),
  Q2_SHARED,
  Q3_HIGHER,
  Q4_MIXED_HIGHER,
  Q5_HIGHER,
  Q6_HIGHER,
  Q7_MIXED_HIGHER,
  labelledReferenceSection(),
  Q8_HIGHER,
  Q9_HIGHER,
  Q10_HIGHER,
  Q11_HIGHER,
  Q12_HIGHER,
  selfReflectionSection(),
];

const SCAFFOLDED_SECTIONS = [
  ...openingSections(),
  FORMULA_REFERENCE,
  q1DiagramSection(),
  Q2_SHARED,
  SS_Q2,
  Q3_MIXED_FOUNDATION,
  Q4_FOUNDATION,
  Q5_FOUNDATION,
  SS_Q5,
  Q6_FOUNDATION,
  SS_Q6,
  Q7_FOUNDATION,
  labelledReferenceSection(),
  Q8_BASE_FOUNDATION,
  Q9_SCAFFOLDED,
  SS_Q9,
  Q10_FOUNDATION,
  SS_Q10,
  Q11_FOUNDATION,
  SS_Q11,
  Q12_MIXED_FOUNDATION,
  SS_Q12,
  selfReflectionSection(),
];

const TIER_DEFINITIONS = [
  {
    tier: "mixed",
    title: "Atomic Structure - Mixed (Year 11 Chemistry)",
    subtitle: "Curated GCSE Chemistry worksheet - Mixed",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Atomic Structure - Foundation (Year 11 Chemistry)",
    subtitle: "Curated GCSE Chemistry worksheet - Foundation",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Atomic Structure - Higher (Year 11 Chemistry)",
    subtitle: "Curated GCSE Chemistry worksheet - Higher",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(HIGHER_MARK_SCHEME),
  },
  {
    tier: "scaffolded",
    title: "Atomic Structure - Scaffolded (Year 11 Chemistry)",
    subtitle: "Curated GCSE Chemistry worksheet - Scaffolded SEND version",
    sections: SCAFFOLDED_SECTIONS,
    teacher_sections: teacherSections(
      "",
      "\n\nScaffolded version notes: sentence starters are intentionally included after key written questions. Use the dyslexia-friendly display formatting in the renderer when that SEND profile is selected."
    ),
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
    topicTags: ["atomic_structure", "chemistry", "nano_banana"],
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
      "q1-label-diagram",
      UNLABELLED_DIAGRAM_URL,
      "Unlabelled Nano Banana carbon atom diagram used for the Q1 labelling task."
    );

    await ensureAsset(
      token,
      entryId,
      "reference-labelled-carbon",
      LABELLED_DIAGRAM_URL,
      "Labelled Nano Banana carbon atom diagram used as the reference scaffold."
    );
  }

  console.log("\nAtomic Structure curated worksheets seeded successfully.");
  console.log(`Subject: ${SUBJECT}`);
  console.log(`Topic: ${TOPIC}`);
  console.log(`Year group: ${YEAR_GROUP}`);
  console.log(`Assets: ${UNLABELLED_DIAGRAM_URL}, ${LABELLED_DIAGRAM_URL}`);
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
