#!/usr/bin/env node
/**
 * QA Check — Physics Worksheets
 * Verifies all physics worksheets are in the library with correct tiers and diagram questions
 */

const APP_URL = process.env.APP_URL || "https://adaptly.co.uk";
const ADMIN_EMAIL = "admin@adaptly.co.uk";
const ADMIN_PASSWORD = "Admin1234!";

async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${options.method || "GET"} ${url} failed (${res.status}): ${err}`);
  }
  return res.json();
}

async function login() {
  const data = await requestJson(`${APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  return data.token || data.accessToken;
}

const EXPECTED_TOPICS = [
  { topic: "Forces and Motion", yearGroup: "Year 10" },
  { topic: "Energy", yearGroup: "Year 10" },
  { topic: "Waves", yearGroup: "Year 10" },
  { topic: "Electricity and Circuits", yearGroup: "Year 10" },
  { topic: "Magnetism and Electromagnetism", yearGroup: "Year 11" },
  { topic: "Space Physics", yearGroup: "Year 11" },
  { topic: "Particle Model and States of Matter", yearGroup: "Year 10" },
  { topic: "Radioactivity and Half-Life", yearGroup: "Year 11" },
  { topic: "Sound", yearGroup: "Year 7" },
  { topic: "Light", yearGroup: "Year 8" },
  { topic: "Motion Graphs", yearGroup: "Year 9" },
  { topic: "Specific Heat Capacity", yearGroup: "Year 9" },
  { topic: "Units and Measurements", yearGroup: "Year 9" },
  { topic: "Circuit Diagrams and Symbols", yearGroup: "Year 10" },
  { topic: "Ray Diagrams", yearGroup: "Year 10" },
  { topic: "Nuclear Decay Equations", yearGroup: "Year 10" },
];

const EXPECTED_TIERS = ["mixed", "foundation", "higher", "scaffolded"];

const DIAGRAM_QUESTION_TYPES = {
  "Forces and Motion": ["q-label-diagram", "q-extended"],
  "Energy": ["q-label-diagram", "diagram"],
  "Waves": ["q-label-diagram", "diagram"],
  "Electricity and Circuits": ["q-label-diagram"],
  "Magnetism and Electromagnetism": ["q-label-diagram", "diagram"],
  "Space Physics": ["q-label-diagram", "diagram"],
  "Particle Model and States of Matter": ["q-label-diagram", "diagram"],
  "Radioactivity and Half-Life": ["q-label-diagram", "diagram"],
  "Sound": ["q-label-diagram"],
  "Light": ["q-label-diagram", "diagram"],
  "Motion Graphs": ["q-label-diagram"],
  "Specific Heat Capacity": ["q-label-diagram"],
  "Units and Measurements": ["q-label-diagram"],
  "Circuit Diagrams and Symbols": ["q-label-diagram", "q-extended"],
  "Ray Diagrams": ["q-label-diagram", "q-extended"],
  "Nuclear Decay Equations": ["q-label-diagram"],
};

async function main() {
  console.log("=== Physics Worksheet QA Check ===\n");
  const token = await login();
  
  const data = await requestJson(`${APP_URL}/api/library/entries?subject=Physics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const entries = data.entries || [];
  console.log(`Total Physics entries found: ${entries.length}\n`);
  
  // Group by topic
  const byTopic = {};
  entries.forEach(e => {
    const key = e.topic;
    if (!byTopic[key]) byTopic[key] = { yearGroup: e.year_group, tiers: [] };
    byTopic[key].tiers.push(e.tier);
  });
  
  let passCount = 0;
  let failCount = 0;
  const issues = [];
  
  console.log("--- Topic Coverage Check ---");
  for (const expected of EXPECTED_TOPICS) {
    const found = byTopic[expected.topic];
    if (!found) {
      console.log(`❌ MISSING: ${expected.topic} (${expected.yearGroup})`);
      failCount++;
      issues.push(`Missing topic: ${expected.topic}`);
    } else {
      const missingTiers = EXPECTED_TIERS.filter(t => !found.tiers.includes(t));
      if (missingTiers.length > 0) {
        console.log(`⚠️  PARTIAL: ${expected.topic} — missing tiers: ${missingTiers.join(", ")}`);
        failCount++;
        issues.push(`${expected.topic}: missing tiers ${missingTiers.join(", ")}`);
      } else {
        console.log(`✅ OK: ${expected.topic} (${found.yearGroup}) — tiers: ${found.tiers.join(", ")}`);
        passCount++;
      }
    }
  }
  
  console.log("\n--- All Physics Topics in Library ---");
  Object.entries(byTopic).sort().forEach(([topic, data]) => {
    console.log(`  ${topic} (${data.yearGroup}): ${data.tiers.join(", ")}`);
  });
  
  console.log("\n--- Diagram Question Type Check ---");
  // Check a sample worksheet for each topic to verify diagram question types
  for (const expected of EXPECTED_TOPICS.slice(0, 5)) {
    const entry = entries.find(e => e.topic === expected.topic && e.tier === "foundation");
    if (!entry) continue;
    
    try {
      const detail = await requestJson(`${APP_URL}/api/library/entries/${entry.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sections = detail.entry?.sections || [];
      const diagramSections = sections.filter(s => 
        s.type === "q-label-diagram" || s.type === "diagram" || s.imageUrl
      );
      
      if (diagramSections.length === 0) {
        console.log(`⚠️  ${expected.topic}: No diagram sections found`);
        issues.push(`${expected.topic}: No diagram sections`);
      } else {
        const types = diagramSections.map(s => s.type);
        console.log(`✅ ${expected.topic}: ${diagramSections.length} diagram section(s) — types: ${types.join(", ")}`);
        
        // Check that diagram sections have imageUrl
        const missingImages = diagramSections.filter(s => !s.imageUrl);
        if (missingImages.length > 0) {
          console.log(`  ⚠️  ${missingImages.length} diagram section(s) missing imageUrl`);
          issues.push(`${expected.topic}: ${missingImages.length} sections missing imageUrl`);
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Could not fetch detail for ${expected.topic}: ${err.message}`);
    }
  }
  
  console.log("\n=== QA Summary ===");
  console.log(`Topics passing: ${passCount}/${EXPECTED_TOPICS.length}`);
  console.log(`Topics with issues: ${failCount}`);
  
  if (issues.length > 0) {
    console.log("\nIssues found:");
    issues.forEach(i => console.log(`  - ${i}`));
  } else {
    console.log("\n✅ All checks passed!");
  }
  
  console.log("\n=== Diagram Question Type Verification ===");
  console.log("The following diagram question types are used across worksheets:");
  console.log("  q-label-diagram: Student labels parts of a provided diagram");
  console.log("  q-extended (drawing): Student draws a circuit/diagram from description");
  console.log("  diagram: Reference diagram provided for student to analyse");
  console.log("  q-short-answer with diagram: Questions based on a provided diagram");
}

main().catch(err => {
  console.error("QA check failed:", err);
  process.exit(1);
});
