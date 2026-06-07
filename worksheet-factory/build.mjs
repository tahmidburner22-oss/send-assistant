/**
 * build.mjs — render a topic JSON to the two canonical PDFs.
 *
 * Usage:
 *   node build.mjs topics/<topic>.json [outputDir]
 *
 * A topic file contains:
 *   {
 *     "meta":     { ...descriptive only... },
 *     "landscape": { intro, questions, questionsSubheader },
 *     "booklet":   { intro, methodReminder, answerLabels, questions,
 *                    selfReflection, answers }
 *   }
 *
 * Produces:
 *   <Title>-Landscape-Base.pdf   (2-page spread)
 *   <Title>-Base.pdf             (portrait booklet)
 * plus the rendered .html alongside each for inspection.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { renderLandscapeHTML, renderBookletHTML } from "./render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const inputArg = process.argv[2];
if (!inputArg) {
  console.error("Usage: node build.mjs topics/<topic>.json [outputDir]");
  process.exit(1);
}
const inputPath = join(__dirname, inputArg.replace(/^\.\//, ""));
const topic = JSON.parse(readFileSync(inputPath, "utf8"));

const outDir = process.argv[3] ? join(__dirname, process.argv[3]) : join(__dirname, "dist");
mkdirSync(outDir, { recursive: true });

const slug =
  topic.meta?.slug ||
  basename(inputArg).replace(/\.json$/i, "") ||
  "worksheet";
const niceName = (topic.meta?.title || slug).replace(/\s+/g, "-");

const landscapeHTML = renderLandscapeHTML(topic.landscape || {});
const bookletHTML = renderBookletHTML(topic.booklet || {});

const landscapeHtmlPath = join(outDir, `${niceName}-Landscape-Base.html`);
const bookletHtmlPath = join(outDir, `${niceName}-Base.html`);
writeFileSync(landscapeHtmlPath, landscapeHTML, "utf8");
writeFileSync(bookletHtmlPath, bookletHTML, "utf8");

const landscapePdf = join(outDir, `${niceName}-Landscape-Base.pdf`);
const bookletPdf = join(outDir, `${niceName}-Base.pdf`);

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

async function toPdf(html, outPath, landscape) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch {}
  await page.pdf({
    path: outPath,
    format: "A4",
    landscape,
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  await page.close();
  console.log("WROTE", outPath);
}

await toPdf(landscapeHTML, landscapePdf, true);
await toPdf(bookletHTML, bookletPdf, false);

await browser.close();
console.log("\nDone:", niceName);
