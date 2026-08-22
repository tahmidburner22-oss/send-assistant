import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderScienceLandscape, type ScienceLandscapeOptions } from "../client/src/lib/scienceLandscapeRenderer";

const outDir = resolve(process.env.ADAPTLy_OUT || "/home/ubuntu/send_assistant_login_repair/science_landscape_validation");
mkdirSync(outDir, { recursive: true });

const examples: Array<[string, ScienceLandscapeOptions]> = [
  ["atomic_structure_dyslexia_age10", { subject: "Chemistry", yearGroup: "Year 10", topic: "Atomic Structure and Models", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["concentration_dyslexia_age10", { subject: "Chemistry", yearGroup: "Year 10", topic: "Concentration of Solutions", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["metallic_bonding_dyslexia_age10", { subject: "Chemistry", yearGroup: "Year 10", topic: "Metallic Bonding", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["plants_year2_working_memory_age6", { subject: "Science", yearGroup: "Year 2", topic: "Plants", sendNeedId: "Working Memory Difficulties", readingAge: 6 }],
  ["cells_microscopy_dyslexia_age10", { subject: "Biology", yearGroup: "Year 10", topic: "Cells and Microscopy", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["photosynthesis_dyslexia_age10", { subject: "Biology", yearGroup: "Year 10", topic: "Photosynthesis", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["genetics_dyslexia_age10", { subject: "Biology", yearGroup: "Year 10", topic: "Genetics and Inheritance", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["ionic_bonding_dyslexia_age10", { subject: "Chemistry", yearGroup: "Year 10", topic: "Ionic Bonding", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["covalent_bonding_dyslexia_age10", { subject: "Chemistry", yearGroup: "Year 10", topic: "Covalent Bonding", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["rates_reaction_dyslexia_age10", { subject: "Chemistry", yearGroup: "Year 10", topic: "Rates of Reaction", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["forces_dyslexia_age10", { subject: "Physics", yearGroup: "Year 10", topic: "Forces", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["energy_stores_dyslexia_age10", { subject: "Physics", yearGroup: "Year 10", topic: "Energy Stores", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["waves_dyslexia_age10", { subject: "Physics", yearGroup: "Year 10", topic: "Waves", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
];

const report: unknown[] = [];
for (const [filename, options] of examples) {
  const document = renderScienceLandscape(options);
  writeFileSync(resolve(outDir, `${filename}.html`), document.html, "utf8");
  report.push({ filename, title: document.title, layout: document.layout, adaptations: document.adaptations, pageCount: (document.html.match(/class="science-page"/g) || []).length });
}
writeFileSync(resolve(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
