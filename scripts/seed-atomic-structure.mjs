/**
 * Seed script — Atomic Structure (Chemistry, Year 9)
 * Seeds all 4 tiers into the worksheet library:
 *   base       → Mixed Ability
 *   foundation → Foundation Tier
 *   higher     → Higher Tier
 *   scaffolded → Scaffolded (SEND)
 *
 * All tiers use local nano-banana diagram images served from /images/.
 * Every tier includes a teacher answer key (mark-scheme + teacher-notes).
 * The scaffolded tier uses Foundation question wording + sentence-starter boxes.
 *
 * Run: APP_URL=https://adaptly.co.uk node scripts/seed-atomic-structure.mjs
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

// Local nano-banana images (served from /images/ by the Vite static server)
const UNLABELLED_DIAGRAM_URL = "/images/atom_nb_unlabelled_final.png";
const LABELLED_DIAGRAM_URL   = "/images/atom_nb_labelled_final.png";

// ─── Shared content ───────────────────────────────────────────────────────────
const KEY_VOCAB = [
  { term: "Atom",                     definition: "The smallest particle of an element that retains its chemical properties." },
  { term: "Proton",                   definition: "Positively charged particle in the nucleus. Relative charge: +1. Relative mass: 1." },
  { term: "Neutron",                  definition: "Neutral particle in the nucleus. Relative charge: 0. Relative mass: 1." },
  { term: "Electron",                 definition: "Negatively charged particle in shells around the nucleus. Relative charge: -1. Relative mass: negligible." },
  { term: "Nucleus",                  definition: "The dense, positively charged centre of an atom containing protons and neutrons." },
  { term: "Atomic number (Z)",        definition: "The number of protons in the nucleus of an atom. Also called the proton number." },
  { term: "Mass number (A)",          definition: "The total number of protons and neutrons in the nucleus of an atom." },
  { term: "Electron shell",           definition: "An energy level around the nucleus where electrons are found. Shell 1 holds up to 2; shells 2 and 3 hold up to 8 each." },
  { term: "Isotope",                  definition: "Atoms of the same element with the same number of protons but different numbers of neutrons." },
  { term: "Electronic configuration", definition: "The arrangement of electrons in the shells of an atom, e.g. 2,8,1 for sodium." },
];

const LEARNING_OBJECTIVE =
  "By the end of this lesson you will be able to:\n\n" +
  "1. Describe the structure of an atom and name the three subatomic particles.\n" +
  "2. Use atomic number and mass number to calculate the number of protons, neutrons and electrons in an atom.\n" +
  "3. Draw and interpret Bohr model (shell) diagrams for the first 20 elements.\n" +
  "4. Explain what isotopes are and give an example.";

const KEY_VOCAB_CONTENT =
  "**Atom** — The smallest particle of an element that retains its chemical properties.\n" +
  "**Proton** — Positively charged particle in the nucleus. Relative charge: +1. Relative mass: 1.\n" +
  "**Neutron** — Neutral particle in the nucleus. Relative charge: 0. Relative mass: 1.\n" +
  "**Electron** — Negatively charged particle in shells around the nucleus. Relative charge: -1. Relative mass: negligible.\n" +
  "**Nucleus** — The dense, positively charged centre of an atom.\n" +
  "**Atomic number (Z)** — The number of protons in the nucleus.\n" +
  "**Mass number (A)** — The total number of protons + neutrons in the nucleus.\n" +
  "**Electron shell** — An energy level around the nucleus where electrons are found.\n" +
  "**Isotope** — Atoms of the same element with the same proton number but different mass numbers.\n" +
  "**Electronic configuration** — The arrangement of electrons in shells (e.g. 2,8,1).";

const COMMON_MISTAKES =
  "Mistake 1: Confusing atomic number and mass number.\n" +
  "-> Atomic number = protons only. Mass number = protons + neutrons.\n\n" +
  "Mistake 2: Thinking electrons have significant mass.\n" +
  "-> Electrons have negligible mass - they do NOT contribute to the mass number.\n\n" +
  "Mistake 3: Forgetting that in a neutral atom, protons = electrons.\n" +
  "-> A neutral atom has no overall charge, so the number of electrons always equals the number of protons.";

const WORKED_EXAMPLE =
  "Element: Sodium (Na)\n\n" +
  "From the periodic table: Atomic number (Z) = 11, Mass number (A) = 23\n\n" +
  "Step 1 - Protons:\nNumber of protons = Atomic number = 11\n\n" +
  "Step 2 - Electrons:\nIn a neutral atom, electrons = protons = 11\n\n" +
  "Step 3 - Neutrons:\nNumber of neutrons = Mass number - Atomic number = 23 - 11 = 12\n\n" +
  "Step 4 - Electronic configuration:\nShell 1 = 2, Shell 2 = 8, Shell 3 = 1 -> Written as 2, 8, 1\n\n" +
  "Answer: 11 protons, 12 neutrons, 11 electrons. Configuration: 2, 8, 1";

const SELF_REFLECTION =
  "TOPICS:\n" +
  "I can name the three subatomic particles and state their charges.\n" +
  "I can use atomic number and mass number to find protons, neutrons and electrons.\n" +
  "I can write the electronic configuration for elements 1-20.\n" +
  "I can explain what an isotope is and give an example.\n\n" +
  "PROMPTS:\n" +
  "The part I found most challenging was...\n" +
  "One thing I want to remember is...\n\n" +
  "EXIT TICKET:\n" +
  "Write the electronic configuration for Argon (Z = 18).";

const MARK_SCHEME =
  "**Q1 - Label the atom diagram (5 marks)**\n" +
  "1. Nucleus  2. Proton  3. Neutron  4. Electron  5. Electron shell (orbit)\n" +
  "(1 mark each; accept 'orbit' for 'electron shell')\n\n" +
  "**Q2 - True or False (5 marks)**\n" +
  "1. FALSE - electrons are in shells around the nucleus, not inside it.\n" +
  "2. TRUE - the atomic number equals the number of protons.\n" +
  "3. FALSE - mass number = protons + neutrons (electrons have negligible mass).\n" +
  "4. TRUE - in a neutral atom, electrons = protons.\n" +
  "5. FALSE - isotopes have the same protons but different neutrons.\n\n" +
  "**Q3 - Multiple Choice (3 marks)**\n" +
  "1. B - Proton  2. C - protons + neutrons  3. A - 2,8,1\n\n" +
  "**Q4 - Subatomic particle table (6 marks)**\n" +
  "Proton: +1 | 1   Neutron: 0 | 1   Electron: -1 | negligible\n" +
  "(1 mark per cell, 2 marks per row)\n\n" +
  "**Q5 - Chlorine-35 (3 marks)**\n" +
  "a) 17 protons  b) 18 neutrons (35 - 17)  c) 17 electrons\n\n" +
  "**Q6 - Electronic configurations (3 marks)**\n" +
  "a) Lithium (Z=3): 2,1  b) Oxygen (Z=8): 2,6  c) Magnesium (Z=12): 2,8,2\n\n" +
  "**Q7 - Complete the table (6 marks)**\n" +
  "Carbon: 6p 6n 6e  |  Sodium: 11p 12n 11e  |  Calcium: 20p 20n 20e\n" +
  "(1 mark each for protons, neutrons and electrons per element)\n\n" +
  "**Q8 - Carbon-12 diagram (2 marks)**\n" +
  "a) 6 protons  b) 6 neutrons\n\n" +
  "**Q9 - Isotopes of carbon (3 marks)**\n" +
  "a) 8 neutrons (14 - 6)  b) C-14 has 2 more neutrons than C-12.  c) Both have 6 protons and 6 electrons; same chemical properties.\n\n" +
  "**Q10 - Electrical neutrality (2 marks)**\n" +
  "Atoms are electrically neutral because the number of protons (positive) equals the number of electrons (negative), so the charges cancel. (1 mark for protons = electrons; 1 mark for charges cancel.)\n\n" +
  "**Q11 - Similar properties of Na and K (3 marks)**\n" +
  "Both Na and K are in Group 1 so they both have 1 electron in their outer shell. (1 mark.) " +
  "The number of outer shell electrons determines chemical properties. (1 mark.) " +
  "Because they both have 1 outer electron, they react in the same way - e.g. both react vigorously with water. (1 mark.)\n\n" +
  "**Q12 - Challenge: Unknown element X (6 marks)**\n" +
  "a) Atomic number = 17  b) Mass number = 35  c) Electronic configuration: 2, 8, 7\n" +
  "d) Group 7 (Halogens). Element X has 7 electrons in its outer shell. Elements in the same group have the same number of outer electrons, so X is in Group 7.\n" +
  "(1 mark for Group 7; 1 mark for 7 outer electrons; 1 mark for linking outer electrons to group number.)\n\n" +
  "**Exit Ticket:** Argon (Z = 18) -> 2, 8, 8\n\n**Total marks: 47**";

const TEACHER_NOTES =
  "**Preparation:**\n" +
  "- Provide periodic tables for all sections.\n" +
  "- Print the unlabelled diagram section without the answer key visible.\n" +
  "- For SEND students: provide the labelled reference diagram as a scaffold from the start.\n\n" +
  "**Common misconceptions to address:**\n" +
  "- Students often confuse atomic number and mass number - emphasise that atomic number is always the smaller number on the periodic table.\n" +
  "- Students forget that electrons have negligible mass - reinforce that mass number = protons + neutrons only.\n" +
  "- Students sometimes think isotopes are different elements - clarify that isotopes are the same element (same proton number) but with different neutron numbers.\n\n" +
  "**Differentiation:**\n" +
  "- Foundation: Provide a partially completed Q4 table and the labelled diagram from the start.\n" +
  "- Higher: Ask students to research and explain why C-14 is used in radiocarbon dating (extension).\n" +
  "- Scaffolded: Sentence starters and word banks are built into each question section.\n\n" +
  "**Diagram note:**\n" +
  "The Bohr model diagrams show Carbon-12 (6 protons, 6 neutrons, electronic configuration 2,4). " +
  "The unlabelled version is used for the labelling activity. " +
  "The labelled version serves as a reference scaffold.";

// ─── Section builders ─────────────────────────────────────────────────────────
function openingSections() {
  return [
    { title: "Learning Objective", type: "objective", teacherOnly: false, content: LEARNING_OBJECTIVE },
    { title: "Key Vocabulary", type: "vocabulary", teacherOnly: false, content: KEY_VOCAB_CONTENT },
    { title: "Common Mistakes to Avoid", type: "common-mistakes", teacherOnly: false, content: COMMON_MISTAKES },
    { title: "Worked Example - Calculating Subatomic Particles", type: "example", teacherOnly: false, content: WORKED_EXAMPLE },
  ];
}

function diagramSection() {
  return {
    title: "Reference Diagram - Labelled Carbon-12 Atom",
    type: "diagram", teacherOnly: false,
    imageUrl: LABELLED_DIAGRAM_URL,
    caption: "Labelled Bohr model of Carbon-12 (C-12): 6 protons (+) and 6 neutrons (neutral) in the nucleus; 2 electrons on the first shell and 4 electrons on the second shell.",
    content: "Use this labelled diagram to help you answer the questions below.",
  };
}

function selfReflection() {
  return { title: "Self Reflection", type: "self-reflection", teacherOnly: false, content: SELF_REFLECTION };
}

function teacherSections(extraMarkScheme, extraTeacherNotes) {
  return [
    { title: "Teacher Answer Key", type: "mark-scheme", teacherOnly: true, content: MARK_SCHEME + (extraMarkScheme || "") },
    { title: "Teacher Notes", type: "teacher-notes", teacherOnly: true, content: TEACHER_NOTES + (extraTeacherNotes || "") },
  ];
}

// ─── Q1-Q12 shared question blocks ───────────────────────────────────────────
const Q1_BASE = {
  title: "Q1 - Label the Diagram",
  type: "q-label-diagram", teacherOnly: false,
  imageUrl: UNLABELLED_DIAGRAM_URL,
  caption: "Bohr model of a Carbon-12 atom (C-12). The diagram shows the nucleus and two electron shells.",
  content: "Use the word bank below to label the five parts of the atom shown in the diagram. Write the correct label number next to each part.\n\nLABELS: Nucleus | Proton | Neutron | Electron | Electron shell (orbit)\nANSWERS: Nucleus | Proton | Neutron | Electron | Electron shell (orbit)",
};

const Q2_SHARED = {
  title: "Q2 - True or False",
  type: "q-true-false", teacherOnly: false,
  content: "1. Electrons are found inside the nucleus of an atom. FALSE\n2. The atomic number tells you the number of protons in an atom. TRUE\n3. The mass number of an atom includes the mass of the electrons. FALSE\n4. In a neutral atom, the number of protons equals the number of electrons. TRUE\n5. Isotopes of the same element have different numbers of protons. FALSE",
};

const Q3_MIXED_FOUNDATION = {
  title: "Q3 - Multiple Choice",
  type: "q-mcq", teacherOnly: false,
  content: "1. Which subatomic particle has a relative charge of +1?\nA. Neutron\nB. Proton\nC. Electron\nD. Nucleus\n\n2. What does the mass number of an atom represent?\nA. The number of protons only\nB. The number of neutrons only\nC. The total number of protons and neutrons\nD. The number of electrons\n\n3. What is the electronic configuration of sodium (Na, Z = 11)?\nA. 2,8,1\nB. 2,9\nC. 3,8\nD. 2,8,3",
};

const Q3_HIGHER = {
  title: "Q3 - Multiple Choice",
  type: "q-mcq", teacherOnly: false,
  content: "1. An atom has 8 protons, 8 neutrons and 8 electrons. What is its mass number?\nA. 8\nB. 16\nC. 24\nD. 0\n\n2. Which statement correctly describes an isotope?\nA. Atoms with the same mass number but different atomic numbers\nB. Atoms with the same atomic number but different mass numbers\nC. Atoms with the same number of electrons but different charges\nD. Atoms of different elements with the same number of neutrons\n\n3. Fluorine has atomic number 9 and mass number 19. What is its electronic configuration?\nA. 2,7\nB. 2,8,1\nC. 3,6\nD. 9",
};

const Q4_SHARED = {
  title: "Q4 - Subatomic Particle Properties",
  type: "q-data-table", teacherOnly: false,
  content: "Complete the table below to show the relative charge and relative mass of each subatomic particle. [6 marks]\n\n| Particle | Relative charge | Relative mass |\n|---|---|---|\n| Proton | [answer] | [answer] |\n| Neutron | [answer] | [answer] |\n| Electron | [answer] | [answer] |",
};

const Q4_FOUNDATION_SCAFFOLDED = {
  title: "Q4 - Subatomic Particle Properties",
  type: "q-data-table", teacherOnly: false,
  content: "Complete the table below. The first row has been started for you. [6 marks]\n\n| Particle | Relative charge | Relative mass |\n|---|---|---|\n| Proton | +1 | [answer] |\n| Neutron | [answer] | [answer] |\n| Electron | [answer] | [answer] |",
};

const Q5_MIXED = {
  title: "Q5 - Chlorine-35",
  type: "q-short-answer", teacherOnly: false,
  content: "An atom of chlorine has the symbol 35/17 Cl. [3 marks]\n\na) How many protons does it have? ___________\n\nb) How many neutrons does it have? ___________\n\nc) How many electrons does it have? ___________",
};

const Q5_FOUNDATION_SCAFFOLDED = {
  title: "Q5 - Chlorine-35",
  type: "q-short-answer", teacherOnly: false,
  content: "An atom of chlorine has the symbol 35/17 Cl.\n\nAtomic number = 17. Mass number = 35. [3 marks]\n\na) How many protons does it have? ___________\n\nb) How many neutrons does it have? (Hint: Mass number - Atomic number) ___________\n\nc) How many electrons does it have? (Hint: In a neutral atom, electrons = protons) ___________",
};

const Q5_HIGHER = {
  title: "Q5 - Chlorine-35",
  type: "q-short-answer", teacherOnly: false,
  content: "An atom of chlorine has the symbol 35/17 Cl. [5 marks]\n\na) State the number of protons, neutrons and electrons in this atom.\n\n___________________________________________\n\nb) Chlorine-37 is an isotope of chlorine. Explain what this means and state how it differs from chlorine-35. [2 marks]\n\n___________________________________________\n\n___________________________________________",
};

const Q6_MIXED = {
  title: "Q6 - Electronic Configurations",
  type: "q-short-answer", teacherOnly: false,
  content: "Write the electronic configuration for the following atoms. [3 marks]\n\na) Lithium (Z = 3): ___________\n\nb) Oxygen (Z = 8): ___________\n\nc) Magnesium (Z = 12): ___________",
};

const Q6_FOUNDATION_SCAFFOLDED = {
  title: "Q6 - Electronic Configurations",
  type: "q-short-answer", teacherOnly: false,
  content: "Write the electronic configuration for the following atoms.\nRemember: Shell 1 holds up to 2 electrons. Shells 2 and 3 hold up to 8 electrons each. [3 marks]\n\na) Lithium (Z = 3): ___________\n\nb) Oxygen (Z = 8): ___________\n\nc) Magnesium (Z = 12): ___________",
};

const Q6_HIGHER = {
  title: "Q6 - Electronic Configurations",
  type: "q-short-answer", teacherOnly: false,
  content: "Write the electronic configuration for the following atoms and state which group of the periodic table each belongs to. [6 marks]\n\na) Lithium (Z = 3): Configuration: ___________ Group: ___________\n\nb) Oxygen (Z = 8): Configuration: ___________ Group: ___________\n\nc) Magnesium (Z = 12): Configuration: ___________ Group: ___________",
};

const Q7_SHARED = {
  title: "Q7 - Complete the Table",
  type: "q-data-table", teacherOnly: false,
  content: "Complete the table below. [6 marks]\n\n| Element | Symbol | Atomic number | Mass number | Protons | Neutrons | Electrons |\n|---|---|---|---|---|---|---|\n| Carbon | C | 6 | 12 | [answer] | [answer] | [answer] |\n| Sodium | Na | 11 | 23 | [answer] | [answer] | [answer] |\n| Calcium | Ca | 20 | 40 | [answer] | [answer] | [answer] |",
};

const Q7_FOUNDATION_SCAFFOLDED = {
  title: "Q7 - Complete the Table",
  type: "q-data-table", teacherOnly: false,
  content: "Complete the table below. Use the formula: Neutrons = Mass number - Atomic number. [6 marks]\n\n| Element | Symbol | Atomic number | Mass number | Protons | Neutrons | Electrons |\n|---|---|---|---|---|---|---|\n| Carbon | C | 6 | 12 | [answer] | [answer] | [answer] |\n| Sodium | Na | 11 | 23 | [answer] | [answer] | [answer] |\n| Calcium | Ca | 20 | 40 | [answer] | [answer] | [answer] |",
};

const Q8_MIXED_FOUNDATION_SCAFFOLDED = {
  title: "Q8 - Carbon-12 Diagram Questions",
  type: "q-short-answer", teacherOnly: false,
  content: "Use the labelled diagram above to answer these questions. [2 marks]\n\na) How many protons are in the nucleus of C-12? ___________\n\nb) How many neutrons are in the nucleus of C-12? ___________",
};

const Q8_HIGHER = {
  title: "Q8 - Carbon-12 Analysis",
  type: "q-short-answer", teacherOnly: false,
  content: "Use the labelled diagram above. [3 marks]\n\na) State the number of protons and neutrons in the nucleus of C-12.\n\n___________________________________________\n\nb) Write the electronic configuration of C-12 and state which period of the periodic table carbon is in.\n\n___________________________________________",
};

const Q9_MIXED_FOUNDATION = {
  title: "Q9 - Isotopes of Carbon",
  type: "q-short-answer", teacherOnly: false,
  content: "Carbon-14 (C-14) is an isotope of carbon. It has atomic number 6 and mass number 14. [3 marks]\n\na) How many neutrons does C-14 have? ___________\n\nb) How is C-14 different from C-12? ___________\n\nc) How is C-14 the same as C-12? ___________",
};

const Q9_SCAFFOLDED = {
  title: "Q9 - Isotopes of Carbon",
  type: "q-short-answer", teacherOnly: false,
  content: "Carbon-14 (C-14) is an isotope of carbon. It has atomic number 6 and mass number 14. [3 marks]\n\na) How many neutrons does C-14 have? (Hint: 14 - 6) ___________\n\nb) How is C-14 different from C-12? ___________\n\nc) How is C-14 the same as C-12? ___________",
};

const Q9_HIGHER = {
  title: "Q9 - Isotopes of Carbon",
  type: "q-short-answer", teacherOnly: false,
  content: "Carbon-14 (C-14) is a radioactive isotope of carbon used in radiocarbon dating. Atomic number = 6, mass number = 14. [3 marks]\n\na) How many neutrons does C-14 have? ___________\n\nb) Explain why C-14 and C-12 are classified as isotopes of the same element.\n\n___________________________________________\n\nc) Suggest why C-14 and C-12 have identical chemical properties.\n\n___________________________________________",
};

const Q10_MIXED = {
  title: "Q10 - Electrical Neutrality",
  type: "q-short-answer", teacherOnly: false,
  content: "Explain why atoms are electrically neutral. [2 marks]\n\n___________________________________________\n\n___________________________________________",
};

const Q10_FOUNDATION_SCAFFOLDED = {
  title: "Q10 - Electrical Neutrality",
  type: "q-short-answer", teacherOnly: false,
  content: "Explain why atoms are electrically neutral. [2 marks]\n\nHint: Think about the charges of protons and electrons.\n\n___________________________________________\n\n___________________________________________",
};

const Q10_HIGHER = {
  title: "Q10 - Electrical Neutrality",
  type: "q-short-answer", teacherOnly: false,
  content: "Explain, in terms of subatomic particles, why atoms are electrically neutral. [2 marks]\n\n___________________________________________\n\n___________________________________________",
};

const Q11_MIXED = {
  title: "Q11 - Similar Properties",
  type: "q-extended", teacherOnly: false,
  content: "Sodium (Na, Z = 11) and potassium (K, Z = 19) are both in Group 1 of the periodic table. Explain why they have similar chemical properties. [3 marks]\n\n___________________________________________\n\n___________________________________________\n\n___________________________________________",
};

const Q11_FOUNDATION_SCAFFOLDED = {
  title: "Q11 - Similar Properties",
  type: "q-extended", teacherOnly: false,
  content: "Sodium (Na, Z = 11) and potassium (K, Z = 19) are both in Group 1 of the periodic table. Explain why they have similar chemical properties. [3 marks]\n\nHint: Write the electronic configurations of both elements first.\n\n___________________________________________\n\n___________________________________________\n\n___________________________________________",
};

const Q11_HIGHER = {
  title: "Q11 - Group Properties",
  type: "q-extended", teacherOnly: false,
  content: "Sodium (Na, Z = 11) and potassium (K, Z = 19) are both in Group 1 of the periodic table. Using your knowledge of electronic configuration, explain why they have similar chemical properties. Include the electronic configurations of both elements in your answer. [3 marks]\n\n___________________________________________\n\n___________________________________________\n\n___________________________________________",
};

const Q12_MIXED_FOUNDATION = {
  title: "Q12 - Challenge Question",
  type: "q-challenge", teacherOnly: false,
  content: "An unknown element X has 17 protons and 18 neutrons. [6 marks]\n\na) What is the atomic number of element X? ___________\n\nb) What is the mass number of element X? ___________\n\nc) Write the electronic configuration of element X. ___________\n\nd) Which group of the periodic table does element X belong to? Explain your reasoning using your electronic configuration.\n\n___________________________________________\n\n___________________________________________\n\n___________________________________________",
};

const Q12_HIGHER = {
  title: "Q12 - Challenge Question",
  type: "q-challenge", teacherOnly: false,
  content: "An unknown element X has 17 protons and 18 neutrons. [6 marks]\n\na) Determine the atomic number and mass number of element X.\n\n___________________________________________\n\nb) Write the electronic configuration of element X and identify which group and period it belongs to.\n\n___________________________________________\n\nc) Element X forms an ion with a charge of -1. Explain how this ion is formed and state how many electrons it contains.\n\n___________________________________________\n\nd) Predict the chemical properties of element X, justifying your answer using its electronic configuration.\n\n___________________________________________\n\n___________________________________________",
};

// Sentence starters (scaffolded only)
const SS_Q2  = { title: "Q2 - Sentence Starters", type: "sentence-starters", teacherOnly: false, content: "I think statement 1 is... because...\nThe atomic number tells us...\nIn a neutral atom, the number of protons..." };
const SS_Q5  = { title: "Q5 - Sentence Starters", type: "sentence-starters", teacherOnly: false, content: "The number of protons is the same as...\nTo find the neutrons, I calculate...\nIn a neutral atom, the electrons equal..." };
const SS_Q6  = { title: "Q6 - Sentence Starters", type: "sentence-starters", teacherOnly: false, content: "Lithium has 3 electrons, so I fill Shell 1 with... then Shell 2 with...\nThe electronic configuration is written as numbers separated by..." };
const SS_Q9  = { title: "Q9 - Sentence Starters", type: "sentence-starters", teacherOnly: false, content: "C-14 is different from C-12 because it has a different number of...\nC-14 is the same as C-12 because both have the same number of...\nIsotopes are atoms of the same element with..." };
const SS_Q10 = { title: "Q10 - Sentence Starters", type: "sentence-starters", teacherOnly: false, content: "Atoms are electrically neutral because...\nThe positive charges from protons are balanced by...\nIn a neutral atom, the number of protons equals..." };
const SS_Q11 = { title: "Q11 - Sentence Starters", type: "sentence-starters", teacherOnly: false, content: "The electronic configuration of sodium is...\nThe electronic configuration of potassium is...\nBoth elements have the same number of electrons in their outer shell, which means...\nElements in the same group have similar properties because..." };
const SS_Q12 = { title: "Q12 - Sentence Starters", type: "sentence-starters", teacherOnly: false, content: "The atomic number is the same as the number of...\nThe mass number = protons + neutrons = ...\nThe electronic configuration is...\nElement X belongs to Group... because its outer shell has... electrons." };

const FORMULA_REFERENCE = {
  title: "Formula Reference Card",
  type: "reminder-box", teacherOnly: false,
  content:
    "**Key Formulae and Rules to Remember:**\n\n" +
    "- Number of protons = Atomic number (Z)\n" +
    "- Number of electrons = Number of protons (in a neutral atom)\n" +
    "- Number of neutrons = Mass number (A) - Atomic number (Z)\n\n" +
    "**Electron Shell Rules:**\n" +
    "- Shell 1 (innermost): holds up to **2** electrons\n" +
    "- Shell 2: holds up to **8** electrons\n" +
    "- Shell 3: holds up to **8** electrons\n\n" +
    "**Example - Sodium (Na):**\n" +
    "Atomic number = 11 -> 11 protons, 11 electrons\n" +
    "Mass number = 23 -> 23 - 11 = 12 neutrons\n" +
    "Electronic configuration: 2, 8, 1",
};

// ─── Tier section arrays ──────────────────────────────────────────────────────
const BASE_SECTIONS = [
  ...openingSections(),
  Q1_BASE, Q2_SHARED, Q3_MIXED_FOUNDATION,
  Q4_SHARED, Q5_MIXED, Q6_MIXED, Q7_SHARED,
  diagramSection(),
  Q8_MIXED_FOUNDATION_SCAFFOLDED, Q9_MIXED_FOUNDATION, Q10_MIXED, Q11_MIXED,
  Q12_MIXED_FOUNDATION,
  selfReflection(),
];

const FOUNDATION_SECTIONS = [
  ...openingSections(),
  Q1_BASE, Q2_SHARED, Q3_MIXED_FOUNDATION,
  Q4_FOUNDATION_SCAFFOLDED, Q5_FOUNDATION_SCAFFOLDED, Q6_FOUNDATION_SCAFFOLDED, Q7_FOUNDATION_SCAFFOLDED,
  diagramSection(),
  Q8_MIXED_FOUNDATION_SCAFFOLDED, Q9_MIXED_FOUNDATION, Q10_FOUNDATION_SCAFFOLDED, Q11_FOUNDATION_SCAFFOLDED,
  Q12_MIXED_FOUNDATION,
  selfReflection(),
];

const HIGHER_SECTIONS = [
  ...openingSections(),
  Q1_BASE, Q2_SHARED, Q3_HIGHER,
  Q4_SHARED, Q5_HIGHER, Q6_HIGHER, Q7_SHARED,
  diagramSection(),
  Q8_HIGHER, Q9_HIGHER, Q10_HIGHER, Q11_HIGHER,
  Q12_HIGHER,
  selfReflection(),
];

const SCAFFOLDED_SECTIONS = [
  ...openingSections(),
  FORMULA_REFERENCE,
  Q1_BASE, Q2_SHARED, SS_Q2, Q3_MIXED_FOUNDATION,
  Q4_FOUNDATION_SCAFFOLDED, Q5_FOUNDATION_SCAFFOLDED, SS_Q5,
  Q6_FOUNDATION_SCAFFOLDED, SS_Q6, Q7_FOUNDATION_SCAFFOLDED,
  diagramSection(),
  Q8_MIXED_FOUNDATION_SCAFFOLDED, Q9_SCAFFOLDED, SS_Q9,
  Q10_FOUNDATION_SCAFFOLDED, SS_Q10, Q11_FOUNDATION_SCAFFOLDED, SS_Q11,
  Q12_MIXED_FOUNDATION, SS_Q12,
  selfReflection(),
];

const HIGHER_EXTRA_MARK_SCHEME =
  "\n\n**Q5b (Higher only) - Chlorine-37 isotope explanation (2 marks)**\n" +
  "Chlorine-37 has the same atomic number (17 protons) but a different mass number (37 vs 35). It has 20 neutrons compared to 18 in chlorine-35. (1 mark for same protons; 1 mark for different neutrons.)\n\n" +
  "**Q6 (Higher only) - Group identification (3 marks)**\n" +
  "Lithium 2,1 -> Group 1  |  Oxygen 2,6 -> Group 6  |  Magnesium 2,8,2 -> Group 2\n\n" +
  "**Q8b (Higher only) - Period identification (1 mark)**\n" +
  "C-12 electronic configuration: 2,4. Carbon is in Period 2.\n\n" +
  "**Q9b-c (Higher only)**\n" +
  "b) Both C-14 and C-12 have the same atomic number (6 protons), so they are the same element. Isotopes have the same proton number but different neutron numbers.\n" +
  "c) Chemical properties depend on the number and arrangement of electrons. C-14 and C-12 both have 6 electrons (2,4), so identical chemical properties.\n\n" +
  "**Q12c-d (Higher only)**\n" +
  "c) Element X gains 1 electron to achieve a full outer shell (2,8,8). The ion has 18 electrons and a charge of -1.\n" +
  "d) Element X is in Group 7 (Halogens). It has 7 outer electrons, readily gains 1 electron, is a reactive non-metal, forms diatomic molecules (Cl2) and reacts with metals to form salts.";

const SCAFFOLDED_EXTRA_TEACHER_NOTES =
  "\n\n**Scaffolded version notes:**\n" +
  "- Sentence starter boxes appear after each question section to support written responses.\n" +
  "- A Formula Reference Card is included before Section 1 - encourage students to refer to it.\n" +
  "- The Q4 table has the first proton row partially completed as a model.\n" +
  "- All hints are embedded in the question text.\n" +
  "- For students with dyslexia: use the OpenDyslexic font option in the worksheet generator.\n" +
  "- For students with ADHD: consider printing one section at a time to reduce visual load.";

// ─── Tier definitions ─────────────────────────────────────────────────────────
const TIERS = [
  {
    tier: "base",
    title: "Atomic Structure and the Periodic Table - Mixed Ability (Year 9 Chemistry)",
    subtitle: "GCSE Chemistry - AQA/Edexcel - Mixed Ability",
    sections: BASE_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "foundation",
    title: "Atomic Structure and the Periodic Table - Foundation Tier (Year 9 Chemistry)",
    subtitle: "GCSE Chemistry - AQA/Edexcel - Foundation Tier",
    sections: FOUNDATION_SECTIONS,
    teacher_sections: teacherSections(),
  },
  {
    tier: "higher",
    title: "Atomic Structure and the Periodic Table - Higher Tier (Year 9 Chemistry)",
    subtitle: "GCSE Chemistry - AQA/Edexcel - Higher Tier",
    sections: HIGHER_SECTIONS,
    teacher_sections: teacherSections(HIGHER_EXTRA_MARK_SCHEME),
  },
  {
    tier: "scaffolded",
    title: "Atomic Structure and the Periodic Table - Scaffolded (Year 9 Chemistry)",
    subtitle: "GCSE Chemistry - AQA/Edexcel - Scaffolded (SEND)",
    sections: SCAFFOLDED_SECTIONS,
    teacher_sections: teacherSections(null, SCAFFOLDED_EXTRA_TEACHER_NOTES),
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n Logging in to ${APP_URL} as ${ADMIN_EMAIL}...`);

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
  console.log("Logged in successfully.");

  for (const tierDef of TIERS) {
    console.log(`\nUpserting tier: ${tierDef.tier} - ${tierDef.title}`);
    const payload = {
      subject: "Chemistry",
      topic: "Atomic Structure",
      yearGroup: "Year 9",
      title: tierDef.title,
      subtitle: tierDef.subtitle,
      learning_objective:
        "Describe the structure of an atom, identify subatomic particles and their properties, use atomic number and mass number to calculate the number of protons, neutrons and electrons, and explain electron configuration using shell diagrams.",
      tier: tierDef.tier,
      source: "Adaptly",
      curated: true,
      key_vocab: KEY_VOCAB,
      sections: tierDef.sections,
      teacher_sections: tierDef.teacher_sections,
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
      throw new Error(`Upsert failed for tier ${tierDef.tier} (${upsertRes.status}): ${err}`);
    }
    const result = await upsertRes.json();
    console.log(`  Tier "${tierDef.tier}" upserted - ID: ${result.id}`);
  }

  console.log("\nAll 4 tiers seeded successfully!");
  console.log(`\nDiagrams used:\n  Unlabelled: ${UNLABELLED_DIAGRAM_URL}\n  Labelled:   ${LABELLED_DIAGRAM_URL}`);
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
