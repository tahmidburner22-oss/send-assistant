import fs from "node:fs";
import path from "node:path";
import { loadGoldWorksheet } from "../client/src/data/maths-gold/manifest";
import { applyGoldMathsAdaptations } from "../client/src/lib/mathsGoldAdaptations";
import { renderGoldWorksheetHtml } from "../client/src/lib/mathsGoldRenderer";
import { getGoldSendTheme } from "../client/src/lib/mathsGoldSend";
import { renderScienceLandscape } from "../client/src/lib/scienceLandscapeRenderer";
import { renderHumanitiesLandscape } from "../client/src/lib/humanitiesLandscapeRenderer";

const outDir = path.resolve("audit/visual-samples");
fs.mkdirSync(outDir, { recursive: true });

function write(name: string, html: string) {
  fs.writeFileSync(path.join(outDir, `${name}.html`), html, "utf8");
}

async function main() {
  const gold = await loadGoldWorksheet("021-substitution-into-expressions");
  if (!gold) throw new Error("Expected the approved Gold worksheet to be available.");
  for (const [name, sendNeedId, readingAge] of [
    ["maths-gold-dyslexia-age6", "dyslexia", 6],
    ["maths-gold-vi-age10", "vi", 10],
    ["maths-gold-asc-sensory-age17", "asc-sensory", 17],
  ] as const) {
    const theme = getGoldSendTheme(sendNeedId);
    const adapted = applyGoldMathsAdaptations(gold, { sendNeedId, readingAge, sendTheme: theme });
    write(name, renderGoldWorksheetHtml(adapted.worksheet, theme, adapted.notes));
  }

  const scienceSamples = [
    ["science-plants-dyslexia-age6", { subject: "Science", yearGroup: "Year 1", topic: "Plants", sendNeedId: "dyslexia", readingAge: 6 }],
    ["science-cells-working-memory-age10", { subject: "Biology", yearGroup: "Year 10", topic: "Cells and Microscopy", sendNeedId: "working-memory", readingAge: 10 }],
    ["science-waves-vi-age17", { subject: "Physics", yearGroup: "Year 10", topic: "Waves", sendNeedId: "vi", readingAge: 17 }],
  ] as const;
  scienceSamples.forEach(([name, options]) => write(name, renderScienceLandscape(options).html));

  const humanitiesSamples = [
    ["english-dyslexia-age6", { subject: "English Language", yearGroup: "Year 7", topic: "Creative Reading", sendNeedId: "dyslexia", readingAge: 6 }],
    ["history-working-memory-age10", { subject: "History", yearGroup: "Year 11", topic: "Elizabethan England", sendNeedId: "working-memory", readingAge: 10 }],
    ["geography-asc-age14", { subject: "Geography", yearGroup: "Year 9", topic: "Climate Change", sendNeedId: "asc", readingAge: 14 }],
    ["business-vi-age17", { subject: "Business", yearGroup: "Year 10", topic: "Marketing", sendNeedId: "vi", readingAge: 17 }],
  ] as const;
  humanitiesSamples.forEach(([name, options]) => write(name, renderHumanitiesLandscape(options).html));

  console.log(`Wrote ${fs.readdirSync(outDir).filter((file) => file.endsWith(".html")).length} visual HTML samples to ${outDir}`);
}

void main();
