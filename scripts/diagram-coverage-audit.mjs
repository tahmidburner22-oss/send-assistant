#!/usr/bin/env node
/**
 * diagram-coverage-audit.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Audits the diagram_library table and produces a markdown report of every
 * subject/topic combination that is missing Diagram A and/or Diagram B.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/diagram-coverage-audit.mjs
 *
 * Output:
 *   Writes docs/diagram-coverage.md (overwriting any existing file).
 *
 * Run this periodically to track how close the library is to full coverage
 * of the curriculum topic bank.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// Mirrors client/src/lib/topic-bank.ts but expanded with extra sub-topics that
// commonly appear in UK KS2–KS4 worksheets and must have matching diagrams.
const CURRICULUM = {
  mathematics: [
    "Place Value and Rounding", "Addition and Subtraction", "Multiplication and Division",
    "Fractions", "Decimals and Percentages", "Ratio and Proportion",
    "Algebra — Expressions and Equations", "Geometry — Angles and Shapes",
    "Area and Perimeter", "Statistics — Mean, Median, Mode", "Probability",
    "Pythagoras' Theorem", "Linear Graphs", "Quadratic Equations", "Trigonometry",
    "Simultaneous Equations", "Inequalities", "Vectors", "Transformations",
    "Circle Theorems", "Bearings", "Sequences", "Standard Form",
  ],
  english: [
    "Nouns, Verbs and Adjectives", "Sentence Structure and Punctuation",
    "Descriptive Writing", "Narrative Writing — Story Structure",
    "Persuasive Writing", "Reading Comprehension — Inference",
    "Poetry — Rhyme and Rhythm", "Shakespeare — Key Themes",
    "Non-Fiction — Report Writing", "Figurative Language",
  ],
  biology: [
    "Cells — Structure and Function", "Photosynthesis", "Respiration",
    "The Digestive System", "The Circulatory System", "Genetics and Inheritance",
    "Evolution and Natural Selection", "Ecosystems and Food Chains",
    "The Nervous System", "Plant Biology", "Homeostasis", "DNA Structure",
    "Mitosis and Meiosis", "Enzymes", "The Heart", "The Eye", "The Ear",
    "The Skeleton", "The Respiratory System",
  ],
  chemistry: [
    "Atoms and the Periodic Table", "Chemical Bonding", "Ionic Bonding",
    "Covalent Bonding", "Metallic Bonding", "Chemical Reactions and Equations",
    "Acids and Alkalis", "Rates of Reaction", "Organic Chemistry",
    "Electrolysis", "States of Matter", "Chromatography", "Distillation",
    "The pH Scale", "Crude Oil", "The Haber Process", "Reactivity Series",
  ],
  physics: [
    "Forces and Motion", "Energy Transfers", "Electricity and Circuits",
    "Waves — Light and Sound", "Magnetism and Electromagnetism",
    "Nuclear Physics", "Space Physics", "Pressure", "Moments and Levers",
    "The Electromagnetic Spectrum", "Ohm's Law", "Motion Graphs",
    "Radioactive Decay", "Specific Heat Capacity", "The Solar System",
  ],
  history: [
    "The Romans in Britain", "The Anglo-Saxons", "The Norman Conquest 1066",
    "The Black Death", "The Tudor Period", "The English Civil War",
    "The Industrial Revolution", "World War One", "World War Two",
    "The Cold War", "The Civil Rights Movement", "Ancient Egypt",
    "The Vikings", "The Stone Age", "The British Empire",
  ],
  geography: [
    "Map Skills and Grid References", "Weather and Climate",
    "Rivers and Erosion", "Tectonic Plates and Earthquakes", "Volcanoes",
    "Ecosystems and Biomes", "Urbanisation", "Development and Inequality",
    "Climate Change", "Coastal Processes", "The Water Cycle",
    "The Carbon Cycle", "The Rock Cycle", "Glaciation", "Population",
  ],
  computing: [
    "Binary and Data Representation", "Algorithms and Flowcharts",
    "Programming — Variables and Loops", "Boolean Logic",
    "Networks and the Internet", "Cybersecurity", "Databases",
    "Computational Thinking", "Logic Gates", "CPU Architecture",
  ],
};

function canonicalTopicKey(topic) {
  return String(topic || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function subjectFamily(s) {
  const v = String(s || "").toLowerCase().trim();
  if (["biology", "chemistry", "physics", "science", "combined science", "triple science"].includes(v)) return "science";
  if (["math", "maths", "mathematics"].includes(v)) return "maths";
  if (["english", "english language", "english literature", "literacy"].includes(v)) return "english";
  if (["computing", "computer science", "ict"].includes(v)) return "computing";
  return v;
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is required.");
    console.error("Example: DATABASE_URL=postgres://user:pass@host:5432/db node scripts/diagram-coverage-audit.mjs");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const { rows } = await pool.query(
    `SELECT LOWER(COALESCE(subject, '')) AS subject,
            LOWER(COALESCE(topic, '')) AS topic,
            LOWER(COALESCE(title, '')) AS title,
            COALESCE(diagram_type, 'diagram_a') AS diagram_type
       FROM diagram_library`
  );
  await pool.end();

  const haveA = new Set();
  const haveB = new Set();
  for (const r of rows) {
    const key = canonicalTopicKey(r.topic || r.title);
    const fam = subjectFamily(r.subject);
    if (r.diagram_type === "diagram_a" || r.diagram_type === "diagram_a_backup") haveA.add(`${fam}::${key}`);
    else if (r.diagram_type === "diagram_b" || r.diagram_type === "diagram_b_backup") haveB.add(`${fam}::${key}`);
  }

  let totalTopics = 0;
  let missingACount = 0;
  let missingBCount = 0;
  const bySubject = {};
  for (const [subject, topics] of Object.entries(CURRICULUM)) {
    bySubject[subject] = [];
    for (const topic of topics) {
      totalTopics++;
      const key = `${subjectFamily(subject)}::${canonicalTopicKey(topic)}`;
      const missingA = !haveA.has(key);
      const missingB = !haveB.has(key);
      if (missingA) missingACount++;
      if (missingB) missingBCount++;
      if (missingA || missingB) {
        bySubject[subject].push({ topic, missingA, missingB });
      }
    }
  }

  const lines = [];
  lines.push("# Diagram Library Coverage Audit");
  lines.push("");
  lines.push(`_Generated automatically by \`scripts/diagram-coverage-audit.mjs\`._`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Total curriculum topics audited | **${totalTopics}** |`);
  lines.push(`| Total library entries | **${rows.length}** |`);
  lines.push(`| Topics missing Diagram A | **${missingACount}** |`);
  lines.push(`| Topics missing Diagram B | **${missingBCount}** |`);
  lines.push("");
  lines.push("## Missing sub-topics by subject");
  lines.push("");
  lines.push("> Upload curated images for these combinations via **Admin Panel → Diagram Library → Add New**.");
  lines.push("");

  for (const [subject, missing] of Object.entries(bySubject)) {
    if (missing.length === 0) continue;
    lines.push(`### ${subject[0].toUpperCase() + subject.slice(1)}`);
    lines.push("");
    lines.push(`| Topic | Missing Diagram A | Missing Diagram B |`);
    lines.push(`| --- | :---: | :---: |`);
    for (const m of missing) {
      lines.push(`| ${m.topic} | ${m.missingA ? "✗" : ""} | ${m.missingB ? "✗" : ""} |`);
    }
    lines.push("");
  }

  const outPath = path.join(REPO_ROOT, "docs/diagram-coverage.md");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${outPath}`);
  console.log(`Missing Diagram A: ${missingACount}/${totalTopics}`);
  console.log(`Missing Diagram B: ${missingBCount}/${totalTopics}`);
}

main().catch(err => { console.error(err); process.exit(1); });
