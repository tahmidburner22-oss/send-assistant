import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderHumanitiesLandscape, type HumanitiesLandscapeOptions } from "../client/src/lib/humanitiesLandscapeRenderer";

const outDir = resolve(process.env.ADAPTLY_OUT || "/home/ubuntu/send_assistant_login_repair/humanities_landscape_validation");
mkdirSync(outDir, { recursive: true });

const examples: Array<[string, HumanitiesLandscapeOptions]> = [
  ["english_language_paper1_dyslexia_age10", { subject: "English", yearGroup: "Year 10", topic: "Language Paper 1", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["history_conflict_dyslexia_age10", { subject: "History", yearGroup: "Year 10", topic: "Conflict and Tension", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["geography_urban_dyslexia_age10", { subject: "Geography", yearGroup: "Year 10", topic: "Urban Issues and Challenges", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
  ["business_marketing_finance_dyslexia_age10", { subject: "Business Studies", yearGroup: "Year 10", topic: "Marketing and Finance", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" }],
];

const report: unknown[] = [];
for (const [filename, options] of examples) {
  const document = renderHumanitiesLandscape(options);
  writeFileSync(resolve(outDir, `${filename}.html`), document.html, "utf8");
  report.push({ filename, title: document.title, layout: document.layout, adaptations: document.adaptations, pageCount: (document.html.match(/class="humanities-page"/g) || []).length });
}
writeFileSync(resolve(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
