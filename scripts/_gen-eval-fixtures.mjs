#!/usr/bin/env node
// One-shot helper used during PR-5 to mint 50 small JSON fixtures
// under server/tests/worksheet-eval/fixtures/. Re-run after editing
// the case lists. Not invoked by CI.
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "server", "tests", "worksheet-eval", "fixtures");

const STD_RULES = [
  "mcq-single-correct",
  "word-bank-deduped",
  "no-foreign-diagrams",
  "spec-ref-present",
  "qa-score-floor",
];
const SEND_RULES = [...STD_RULES, "send-fidelity-floor"];
const READING_RULES = [...STD_RULES, "reading-age-in-range"];

const BAND = {
  "Year 3": [6, 10],
  "Year 6": [9, 13],
  "Year 7": [10, 14],
  "Year 8": [10, 14],
  "Year 9": [12, 16],
  "Year 10": [13, 17],
  "Year 11": [14, 18],
};

function fixture(id, { title, bucket, params, rules, readingAgeRange }) {
  return {
    id,
    title,
    bucket,
    params,
    rules: rules ?? STD_RULES,
    ...(readingAgeRange ? { readingAgeRange } : {}),
    estimatedTokens: 4000,
  };
}

const fixtures = [];

const mathsCases = [
  ["y3", "Year 3", "Fractions of amounts", "AQA"],
  ["y6", "Year 6", "Long multiplication", "AQA"],
  ["y7", "Year 7", "Adding and subtracting fractions", "AQA"],
  ["y7-percentages", "Year 7", "Percentages of amounts", "Edexcel"],
  ["y9", "Year 9", "Solving linear equations", "AQA"],
  ["y9-graphs", "Year 9", "Straight line graphs", "Edexcel"],
  ["y10", "Year 10", "Quadratic equations", "AQA"],
  ["y10-trig", "Year 10", "Right-angled trigonometry", "OCR"],
  ["y11", "Year 11", "Simultaneous equations", "AQA"],
  ["y11-pythag", "Year 11", "Pythagoras' theorem", "Edexcel"],
];
for (const [tag, year, topic, board] of mathsCases) {
  fixtures.push(
    fixture(`maths-${tag}`, {
      title: `${year} Maths — ${topic}`,
      bucket: "maths",
      params: {
        subject: "Mathematics",
        topic,
        yearGroup: year,
        examBoard: board,
        difficulty: "medium",
        includeAnswers: true,
      },
      rules: READING_RULES,
      readingAgeRange: BAND[year] ?? [10, 14],
    }),
  );
}

const englishCases = [
  ["y6-spag", "Year 6", "Subject-verb agreement", "AQA"],
  ["y7-poetry", "Year 7", "Identifying poetic devices", "AQA"],
  ["y7-narrative", "Year 7", "Narrative writing structure", "AQA"],
  ["y9-romeo", "Year 9", "Romeo and Juliet — Act 1", "AQA"],
  ["y9-essay", "Year 9", "Persuasive essay structure", "Edexcel"],
  ["y10-macbeth", "Year 10", "Macbeth — Act 1 Scene 5", "AQA"],
  ["y10-non-fiction", "Year 10", "Comparing non-fiction texts", "AQA"],
  ["y11-dickens", "Year 11", "A Christmas Carol — Stave 1", "AQA"],
  ["y11-language", "Year 11", "GCSE English Language Paper 1 Q2", "AQA"],
  ["y11-poetry-anthology", "Year 11", "Power and conflict — Ozymandias", "AQA"],
];
for (const [tag, year, topic, board] of englishCases) {
  fixtures.push(
    fixture(`english-${tag}`, {
      title: `${year} English — ${topic}`,
      bucket: "english",
      params: {
        subject: "English",
        topic,
        yearGroup: year,
        examBoard: board,
        difficulty: "medium",
        includeAnswers: true,
      },
      rules: READING_RULES,
      readingAgeRange: BAND[year] ?? [11, 15],
    }),
  );
}

const scienceCases = [
  ["y7-biology-cells", "Year 7", "Plant and animal cells", "Biology", "AQA"],
  ["y7-chemistry-states", "Year 7", "States of matter", "Chemistry", "AQA"],
  ["y8-physics-light", "Year 8", "Reflection and refraction", "Physics", "AQA"],
  ["y9-biology-respiration", "Year 9", "Aerobic respiration", "Biology", "AQA"],
  ["y10-chemistry-bonding", "Year 10", "Ionic bonding", "Chemistry", "AQA"],
  ["y10-physics-electricity", "Year 10", "Series and parallel circuits", "Physics", "AQA"],
  ["y10-biology-cells", "Year 10", "Mitosis and cell division", "Biology", "Edexcel"],
  ["y11-chemistry-rates", "Year 11", "Rates of reaction", "Chemistry", "AQA"],
  ["y11-physics-radioactivity", "Year 11", "Half-life of radioactive isotopes", "Physics", "AQA"],
  ["y11-biology-genetics", "Year 11", "Mendelian genetics", "Biology", "AQA"],
];
for (const [tag, year, topic, sub, board] of scienceCases) {
  const band = BAND[year] ?? BAND["Year 7"];
  fixtures.push(
    fixture(`science-${tag}`, {
      title: `${year} ${sub} — ${topic}`,
      bucket: "science",
      params: {
        subject: sub,
        topic,
        yearGroup: year,
        examBoard: board,
        difficulty: "medium",
        includeAnswers: true,
      },
      rules: READING_RULES,
      readingAgeRange: band,
    }),
  );
}

const humanitiesCases = [
  ["y7-history-romans", "Year 7", "Roman invasion of Britain", "History", "AQA"],
  ["y7-geography-rivers", "Year 7", "River features and processes", "Geography", "AQA"],
  ["y8-history-tudors", "Year 8", "Henry VIII's break from Rome", "History", "AQA"],
  ["y9-geography-tectonics", "Year 9", "Plate tectonics", "Geography", "AQA"],
  ["y10-history-elizabeth", "Year 10", "Elizabethan religious settlement", "History", "AQA"],
  ["y10-geography-urban", "Year 10", "Urbanisation in NEEs", "Geography", "AQA"],
  ["y11-history-cold-war", "Year 11", "Origins of the Cold War", "History", "Edexcel"],
  ["y11-geography-coasts", "Year 11", "Coastal landforms", "Geography", "AQA"],
  ["y9-re-judaism", "Year 9", "Beliefs in Judaism", "Religious Education", "AQA"],
  ["y10-re-ethics", "Year 10", "Religion and life - abortion", "Religious Education", "AQA"],
];
for (const [tag, year, topic, sub, board] of humanitiesCases) {
  const band = BAND[year] ?? BAND["Year 7"];
  fixtures.push(
    fixture(`humanities-${tag}`, {
      title: `${year} ${sub} — ${topic}`,
      bucket: "humanities",
      params: {
        subject: sub,
        topic,
        yearGroup: year,
        examBoard: board,
        difficulty: "medium",
        includeAnswers: true,
      },
      rules: READING_RULES,
      readingAgeRange: band,
    }),
  );
}

const sendCases = [
  ["dyslexia-y7-maths", "Year 7", "Mathematics", "Adding fractions", "AQA", "dyslexia"],
  ["dyslexia-y9-english", "Year 9", "English", "Romeo and Juliet — Act 1", "AQA", "dyslexia"],
  ["dyscalculia-y6-maths", "Year 6", "Mathematics", "Place value", "AQA", "dyscalculia"],
  ["dyscalculia-y8-maths", "Year 8", "Mathematics", "Equivalent fractions", "AQA", "dyscalculia"],
  ["autism-y7-science", "Year 7", "Biology", "Plant and animal cells", "AQA", "autism"],
  ["autism-y10-history", "Year 10", "History", "Elizabethan religious settlement", "AQA", "autism"],
  ["adhd-y7-english", "Year 7", "English", "Identifying poetic devices", "AQA", "adhd"],
  ["adhd-y10-maths", "Year 10", "Mathematics", "Quadratic equations", "AQA", "adhd"],
  ["eal-y7-science", "Year 7", "Chemistry", "States of matter", "AQA", "eal"],
  ["eal-y9-geography", "Year 9", "Geography", "Plate tectonics", "AQA", "eal"],
];
for (const [tag, year, sub, topic, board, send] of sendCases) {
  const band = BAND[year] ?? BAND["Year 7"];
  fixtures.push(
    fixture(`send-${tag}`, {
      title: `${year} ${sub} (${send}) — ${topic}`,
      bucket: "send",
      params: {
        subject: sub,
        topic,
        yearGroup: year,
        examBoard: board,
        sendNeed: send,
        difficulty: "medium",
        includeAnswers: true,
      },
      rules: SEND_RULES,
      readingAgeRange: band,
    }),
  );
}

if (fixtures.length !== 50) {
  console.error(`expected 50 fixtures, got ${fixtures.length}`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
for (const f of fixtures) {
  await writeFile(join(OUT_DIR, `${f.id}.json`), JSON.stringify(f, null, 2) + "\n");
}
console.log(`wrote ${fixtures.length} fixtures to ${OUT_DIR}`);
