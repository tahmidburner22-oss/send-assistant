/**
 * seed-atomic-structure.mjs
 *
 * Seeds / upserts the Atomic Structure worksheet into the live library database.
 * Calls the /api/library/entries POST endpoint using the super-admin credentials.
 *
 * Usage:
 *   APP_URL=https://your-railway-app.up.railway.app \
 *   ADMIN_EMAIL=admin@adaptly.co.uk \
 *   ADMIN_PASSWORD=Admin1234! \
 *   node scripts/seed-atomic-structure.mjs
 *
 * Or against localhost:
 *   APP_URL=http://localhost:3001 node scripts/seed-atomic-structure.mjs
 */

const APP_URL = process.env.APP_URL || "http://localhost:3001";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@adaptly.co.uk";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin1234!";

// ─── Image URLs (hosted on Adaptly CDN) ──────────────────────────────────────
const UNLABELLED_DIAGRAM_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663535019640/JyokeLYFDgAEWJMt.png";
const LABELLED_DIAGRAM_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663535019640/ZvFCcGVykMqGyaIc.png";

// ─── Worksheet data ───────────────────────────────────────────────────────────

const KEY_VOCAB = [
  { term: "Atom", definition: "The smallest particle of an element that retains the chemical properties of that element." },
  { term: "Proton", definition: "A positively charged subatomic particle found in the nucleus. Relative charge: +1, relative mass: 1." },
  { term: "Neutron", definition: "A neutral subatomic particle found in the nucleus. Relative charge: 0, relative mass: 1." },
  { term: "Electron", definition: "A negatively charged subatomic particle found in shells around the nucleus. Relative charge: −1, relative mass: negligible." },
  { term: "Nucleus", definition: "The dense, positively charged centre of an atom, containing protons and neutrons." },
  { term: "Atomic number", definition: "The number of protons in the nucleus of an atom. Also called the proton number." },
  { term: "Mass number", definition: "The total number of protons and neutrons in the nucleus of an atom." },
  { term: "Electron shell", definition: "An energy level around the nucleus where electrons are found. Shell 1 holds up to 2; shells 2 and 3 hold up to 8 each." },
  { term: "Isotope", definition: "Atoms of the same element with the same number of protons but different numbers of neutrons." },
  { term: "Electronic configuration", definition: "The arrangement of electrons in the shells of an atom, e.g. 2,8,1 for sodium." },
];

// Student-facing sections (teacherOnly: false)
const SECTIONS = [
  {
    title: "Learning Objective",
    type: "learning-objective",
    teacherOnly: false,
    content:
      "By the end of this lesson you will be able to:\n\n" +
      "1. Describe the structure of an atom and name the three subatomic particles.\n" +
      "2. Use atomic number and mass number to calculate the number of protons, neutrons and electrons in an atom.\n" +
      "3. Draw and interpret Bohr model (shell) diagrams for the first 20 elements.\n" +
      "4. Explain what isotopes are and give an example.",
  },
  {
    title: "Key Vocabulary",
    type: "key-terms",
    teacherOnly: false,
    content:
      "**Atom** — The smallest particle of an element that retains its chemical properties.\n\n" +
      "**Proton** — Positively charged particle in the nucleus. Relative charge: +1. Relative mass: 1.\n\n" +
      "**Neutron** — Neutral particle in the nucleus. Relative charge: 0. Relative mass: 1.\n\n" +
      "**Electron** — Negatively charged particle in shells around the nucleus. Relative charge: −1. Relative mass: negligible.\n\n" +
      "**Nucleus** — The dense, positively charged centre of an atom.\n\n" +
      "**Atomic number (Z)** — The number of protons in the nucleus.\n\n" +
      "**Mass number (A)** — The total number of protons + neutrons in the nucleus.\n\n" +
      "**Electron shell** — An energy level around the nucleus where electrons are found.\n\n" +
      "**Isotope** — Atoms of the same element with the same proton number but different mass numbers.\n\n" +
      "**Electronic configuration** — The arrangement of electrons in shells (e.g. 2,8,1).",
  },
  {
    title: "Common Mistakes to Avoid",
    type: "reminder-box",
    teacherOnly: false,
    content:
      "**Mistake 1:** Confusing atomic number and mass number.\n" +
      "→ Atomic number = protons only. Mass number = protons + neutrons.\n\n" +
      "**Mistake 2:** Thinking electrons have significant mass.\n" +
      "→ Electrons have negligible mass — they do NOT contribute to the mass number.\n\n" +
      "**Mistake 3:** Forgetting that in a neutral atom, protons = electrons.\n" +
      "→ A neutral atom has no overall charge, so the number of electrons always equals the number of protons.",
  },
  {
    title: "Worked Example — Calculating Subatomic Particles",
    type: "worked-example",
    teacherOnly: false,
    content:
      "**Element: Sodium (Na)**\n\n" +
      "From the periodic table: Atomic number (Z) = 11, Mass number (A) = 23\n\n" +
      "**Step 1 — Protons:**\nNumber of protons = Atomic number = **11**\n\n" +
      "**Step 2 — Electrons:**\nIn a neutral atom, electrons = protons = **11**\n\n" +
      "**Step 3 — Neutrons:**\nNumber of neutrons = Mass number − Atomic number = 23 − 11 = **12**\n\n" +
      "**Step 4 — Electronic configuration:**\nShell 1 = 2, Shell 2 = 8, Shell 3 = 1 → Written as **2, 8, 1**\n\n" +
      "**Answer: 11 protons, 12 neutrons, 11 electrons. Configuration: 2, 8, 1**",
  },
  {
    title: "Section 1 — Label the Atom Diagram",
    type: "q-label-diagram",
    teacherOnly: false,
    imageUrl: UNLABELLED_DIAGRAM_URL,
    caption: "Bohr model of a Carbon-12 atom (C-12). The diagram shows the nucleus and two electron shells.",
    content:
      "Use the word bank below to label the five parts of the atom shown in the diagram. Write the correct label number next to each part.\n\n" +
      "LABELS: Nucleus | Proton | Neutron | Electron | Electron shell (orbit)\n" +
      "ANSWERS: Nucleus | Proton | Neutron | Electron | Electron shell (orbit)",
  },
  {
    title: "Section 2 — Knowledge and Understanding",
    type: "q-short-answer",
    teacherOnly: false,
    content:
      "Answer the following questions. Show your working where asked.\n\n" +
      "**Q1.** State the relative charge and relative mass of each subatomic particle. [3 marks]\n\n" +
      "| Particle | Relative charge | Relative mass |\n|---|---|---|\n| Proton | | |\n| Neutron | | |\n| Electron | | |\n\n" +
      "**Q2.** An atom of chlorine has the symbol ³⁵₁₇Cl. [3 marks]\n\n" +
      "a) How many protons does it have? ___________\n\nb) How many neutrons does it have? ___________\n\nc) How many electrons does it have? ___________\n\n" +
      "**Q3.** Write the electronic configuration for the following atoms. [3 marks]\n\n" +
      "a) Lithium (Z = 3): ___________\n\nb) Oxygen (Z = 8): ___________\n\nc) Magnesium (Z = 12): ___________\n\n" +
      "**Q4.** Complete the table below. [6 marks]\n\n" +
      "| Element | Symbol | Atomic number | Mass number | Protons | Neutrons | Electrons |\n|---|---|---|---|---|---|---|\n" +
      "| Carbon | C | 6 | 12 | | | |\n| Sodium | Na | 11 | 23 | | | |\n| Calcium | Ca | 20 | 40 | | | |",
  },
  {
    title: "Section 3 — Reference Diagram (Labelled)",
    type: "diagram",
    teacherOnly: false,
    imageUrl: LABELLED_DIAGRAM_URL,
    caption:
      "Labelled Bohr model of Carbon-12 (C-12): 6 protons (+) and 6 neutrons (neutral) in the nucleus; 2 electrons on the first shell and 4 electrons on the second shell.",
    content: "Use this labelled diagram to help you answer the questions in Section 3.",
  },
  {
    title: "Section 3 — Application Questions",
    type: "q-short-answer",
    teacherOnly: false,
    content:
      "Use the labelled diagram above and your knowledge to answer these questions.\n\n" +
      "**Q5.** Carbon-12 has atomic number 6 and mass number 12. [2 marks]\n\n" +
      "a) How many protons are in the nucleus of C-12? ___________\n\nb) How many neutrons are in the nucleus of C-12? ___________\n\n" +
      "**Q6.** Carbon-14 (C-14) is an isotope of carbon. It has atomic number 6 and mass number 14. [3 marks]\n\n" +
      "a) How many neutrons does C-14 have? ___________\n\n" +
      "b) How is C-14 different from C-12? ___________\n\n" +
      "c) How is C-14 the same as C-12? ___________\n\n" +
      "**Q7.** Draw the electron shell diagram for Sodium (Na, Z = 11). [2 marks]\n\n" +
      "*(Draw your diagram in the space below — show the nucleus and the correct number of electrons in each shell.)*\n\n[Space for diagram]",
  },
  {
    title: "Section 4 — Analysis and Evaluation",
    type: "q-extended",
    teacherOnly: false,
    content:
      "**Q8.** Explain why atoms are electrically neutral. Use the terms 'proton' and 'electron' in your answer. [2 marks]\n\n" +
      "___________________________________________\n\n___________________________________________\n\n" +
      "**Q9.** Potassium (K) and sodium (Na) are both in Group 1 of the periodic table. Explain why they have similar chemical properties. [3 marks]\n\n" +
      "___________________________________________\n\n___________________________________________\n\n___________________________________________\n\n" +
      "**Q10 — Challenge (6 marks).** An unknown element X has 17 protons and 18 neutrons.\n\n" +
      "a) What is the atomic number of element X? ___________\n\n" +
      "b) What is the mass number of element X? ___________\n\n" +
      "c) Write the electronic configuration of element X. ___________\n\n" +
      "d) In which group of the periodic table would you find element X? Explain your reasoning. [3 marks]\n\n" +
      "___________________________________________\n\n___________________________________________\n\n___________________________________________",
  },
  {
    title: "Self Reflection",
    type: "self-reflection",
    teacherOnly: false,
    content:
      "Rate your confidence for each learning objective (circle one):\n\n" +
      "| Learning objective | 😟 Not sure | 🙂 Getting there | 😄 Confident |\n|---|---|---|---|\n" +
      "| I can name the three subatomic particles and their charges | | | |\n" +
      "| I can use atomic number and mass number to find protons, neutrons, electrons | | | |\n" +
      "| I can draw a Bohr model shell diagram | | | |\n" +
      "| I can explain what an isotope is | | | |\n\n" +
      "**What went well today?**\n\n___________________________________________\n\n" +
      "**What do I need to practise more?**\n\n___________________________________________\n\n" +
      "**Exit Ticket:** Write the electronic configuration of Argon (Z = 18): ___________",
  },
];

// Teacher-only sections
const TEACHER_SECTIONS = [
  {
    title: "Teacher Answer Key",
    type: "mark-scheme",
    teacherOnly: true,
    content:
      "**Section 1 — Label the Atom (5 marks)**\n" +
      "1. Nucleus  2. Proton  3. Neutron  4. Electron  5. Electron shell (orbit)\n\n" +
      "**Q1 — Subatomic particle table (3 marks)**\n" +
      "| Particle | Relative charge | Relative mass |\n|---|---|---|\n" +
      "| Proton | +1 | 1 |\n| Neutron | 0 | 1 |\n| Electron | −1 | negligible (1/1836) |\n\n" +
      "**Q2 — Chlorine-35 (3 marks)**\n" +
      "a) Protons = 17  b) Neutrons = 35 − 17 = 18  c) Electrons = 17\n\n" +
      "**Q3 — Electronic configurations (3 marks)**\n" +
      "a) Lithium: 2, 1  b) Oxygen: 2, 6  c) Magnesium: 2, 8, 2\n\n" +
      "**Q4 — Table (6 marks)**\n" +
      "| Element | Z | A | Protons | Neutrons | Electrons |\n|---|---|---|---|---|---|\n" +
      "| Carbon | 6 | 12 | 6 | 6 | 6 |\n| Sodium | 11 | 23 | 11 | 12 | 11 |\n| Calcium | 20 | 40 | 20 | 20 | 20 |\n\n" +
      "**Q5 — Carbon-12 (2 marks)**\na) 6 protons  b) 6 neutrons\n\n" +
      "**Q6 — Isotopes (3 marks)**\n" +
      "a) 14 − 6 = 8 neutrons\n" +
      "b) C-14 has 2 more neutrons than C-12 / different mass number (14 vs 12)\n" +
      "c) Both have 6 protons / same atomic number / same element / same electronic configuration\n\n" +
      "**Q7 — Sodium shell diagram (2 marks)**\n" +
      "Nucleus labelled; 2 electrons on shell 1; 8 electrons on shell 2; 1 electron on shell 3.\n" +
      "Award 1 mark for correct number of shells, 1 mark for correct electron counts.\n\n" +
      "**Q8 — Electrical neutrality (2 marks)**\n" +
      "Atoms are electrically neutral because the number of protons (positive charge) equals the number of electrons (negative charge), so the charges cancel out. (1 mark for protons = electrons; 1 mark for charges cancel.)\n\n" +
      "**Q9 — Similar properties (3 marks)**\n" +
      "Both Na and K are in Group 1 so they both have 1 electron in their outer shell. (1 mark.) " +
      "The number of outer shell electrons determines an element's chemical properties. (1 mark.) " +
      "Because they both have 1 outer electron, they react in the same way — e.g. both react vigorously with water. (1 mark.)\n\n" +
      "**Q10 — Unknown element X (6 marks)**\n" +
      "a) Atomic number = 17  b) Mass number = 17 + 18 = 35  c) Electronic configuration: 2, 8, 7\n" +
      "d) Group 7 (Halogens). Element X has 7 electrons in its outer shell (from 2,8,7). Elements in the same group have the same number of outer electrons, so X is in Group 7. (1 mark for Group 7; 1 mark for 7 outer electrons; 1 mark for linking outer electrons to group number.)\n\n" +
      "**Exit Ticket:** Argon (Z = 18) → 2, 8, 8\n\n**Total marks: 35**",
  },
  {
    title: "Teacher Notes",
    type: "teacher-notes",
    teacherOnly: true,
    content:
      "**Preparation:**\n" +
      "- Provide periodic tables for all sections.\n" +
      "- Print the unlabelled diagram section (Section 1) without the answer key visible.\n" +
      "- For SEND students: provide the labelled reference diagram (Section 3) as a scaffold from the start, and reduce Q4 table to Carbon and Sodium only.\n\n" +
      "**Common misconceptions to address:**\n" +
      "- Students often confuse atomic number and mass number — emphasise that atomic number is always the smaller number on the periodic table.\n" +
      "- Students forget that electrons have negligible mass — reinforce that mass number = protons + neutrons only.\n" +
      "- Students sometimes think isotopes are different elements — clarify that isotopes are the same element (same proton number) but with different neutron numbers.\n\n" +
      "**Differentiation:**\n" +
      "- Foundation: Provide a partially completed Q4 table and the labelled diagram from the start.\n" +
      "- Higher: Ask students to research and explain why C-14 is used in radiocarbon dating (extension).\n\n" +
      "**Diagram note:**\n" +
      "The Bohr model diagrams show Carbon-12 (6 protons, 6 neutrons, electronic configuration 2,4). " +
      "The unlabelled version is used for Section 1 labelling activity. " +
      "The labelled version in Section 3 serves as a reference scaffold.",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔐 Logging in to ${APP_URL} as ${ADMIN_EMAIL}...`);

  // 1. Authenticate
  const loginRes = await fetch(`${APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    throw new Error(`Login failed (${loginRes.status}): ${err}`);
  }

  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken;
  if (!token) throw new Error("No token in login response: " + JSON.stringify(loginData));
  console.log("✅ Logged in successfully.");

  // 2. Upsert the library entry
  console.log("\n📚 Upserting Atomic Structure library entry...");

  const payload = {
    subject: "Chemistry",
    topic: "Atomic Structure",
    yearGroup: "Year 9",
    title: "Atomic Structure and the Periodic Table (Year 9)",
    subtitle: "GCSE Chemistry — AQA/Edexcel — Mixed Ability",
    learning_objective:
      "Describe the structure of an atom, identify subatomic particles and their properties, use atomic number and mass number to calculate the number of protons, neutrons and electrons, and explain electron configuration using shell diagrams.",
    tier: "base",
    source: "Adaptly",
    curated: true,
    key_vocab: KEY_VOCAB,
    sections: SECTIONS,
    teacher_sections: TEACHER_SECTIONS,
  };

  const upsertRes = await fetch(`${APP_URL}/api/library/entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!upsertRes.ok) {
    const err = await upsertRes.text();
    throw new Error(`Upsert failed (${upsertRes.status}): ${err}`);
  }

  const result = await upsertRes.json();
  console.log("✅ Library entry upserted successfully:", result);
  console.log(`\n🎉 Done! Entry ID: ${result.id} | Version: ${result.version}`);
  console.log(
    `\n📷 Diagrams used:\n  Unlabelled: ${UNLABELLED_DIAGRAM_URL}\n  Labelled:   ${LABELLED_DIAGRAM_URL}`
  );
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
