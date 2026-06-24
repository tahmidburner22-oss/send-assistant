// Verifies the gold-vs-fallback decision logic that Worksheets.tsx uses:
//   if (!examStyle && isMathsSubject(subject) && subtopic) {
//     const entry = findGoldEntry(topic, subtopic); if (entry) -> GOLD
//   }
import { MATHS_GOLD_MANIFEST, findGoldEntry } from "../client/src/data/maths-gold/manifest.ts";
import { isMathsSubject } from "../client/src/lib/mathsVerifier.ts";
import { SUBTOPICS_MAP } from "../client/src/lib/subtopics-data.ts";

let pass = 0, fail = 0;
const bad: string[] = [];

// 1) Every manifest entry must resolve via findGoldEntry(topic, subtopic).
for (const e of MATHS_GOLD_MANIFEST) {
  const hit = findGoldEntry(e.topic, e.subtopic);
  if (hit && hit.slug === e.slug) pass++;
  else { fail++; bad.push(`MISS gold: ${e.topic} / ${e.subtopic} -> ${hit?.slug ?? "null"}`); }
}

// 2) isMathsSubject must accept the subject names a teacher picks for maths.
for (const s of ["Maths", "Mathematics", "maths"]) {
  if (isMathsSubject(s)) pass++; else { fail++; bad.push(`isMathsSubject('${s}') should be true`); }
}
// ...and reject non-maths.
for (const s of ["English", "Science", "History"]) {
  if (!isMathsSubject(s)) pass++; else { fail++; bad.push(`isMathsSubject('${s}') should be false`); }
}

// 3) A maths subtopic WITHOUT a JSON must fall back (findGoldEntry -> null).
// Find maths subtopics in SUBTOPICS_MAP that are NOT in the manifest.
const goldKeys = new Set(MATHS_GOLD_MANIFEST.map(e => `${e.topic}|||${e.subtopic}`));
let fallbackChecked = 0;
for (const [topic, subs] of Object.entries(SUBTOPICS_MAP as Record<string, string[]>)) {
  for (const sub of subs) {
    if (!goldKeys.has(`${topic}|||${sub}`)) {
      const hit = findGoldEntry(topic, sub);
      if (hit === null) { /* correct: falls back */ }
      else {
        // Acceptable ONLY if the subtopic slug is globally unique and points elsewhere intentionally;
        // but for a non-gold key it should be null. Flag it.
        fail++; bad.push(`UNEXPECTED gold for non-manifest subtopic: ${topic} / ${sub} -> ${hit.slug}`);
      }
      fallbackChecked++;
      if (fallbackChecked >= 40) break;
    }
  }
  if (fallbackChecked >= 40) break;
}
pass += fallbackChecked > 0 ? 1 : 0;

console.log(`Gold entries resolved: ${MATHS_GOLD_MANIFEST.length}`);
console.log(`Fallback subtopics checked (sample): ${fallbackChecked}`);
console.log(`PASS=${pass} FAIL=${fail}`);
if (bad.length) { console.log("\nFailures:"); bad.slice(0, 20).forEach(b => console.log("  - " + b)); }
process.exit(fail === 0 ? 0 : 1);
