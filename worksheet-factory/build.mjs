/**
 * build.mjs — render a topic JSON to the two canonical PDFs.
 *
 * Usage:
 *   node build.mjs topics/<topic>.json [outputDir] [vi]
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
 *
 * With 'vi' argument:
 *   <Title>-Landscape-VI-Adapted.pdf   (large-print, high-contrast)
 *   <Title>-VI-Adapted.pdf             (large-print, high-contrast)
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { renderLandscapeHTML, renderBookletHTML } from "./render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const inputArg = process.argv[2];
if (!inputArg) {
  console.error("Usage: node build.mjs topics/<topic>.json [outputDir] [vi]");
  process.exit(1);
}
const inputPath = join(__dirname, inputArg.replace(/^\.\//, ""));
const topic = JSON.parse(readFileSync(inputPath, "utf8"));

const outDir = process.argv[3] ? join(__dirname, process.argv[3]) : join(__dirname, "dist");
mkdirSync(outDir, { recursive: true });

const viMode = process.argv[4] === "vi";
const suffix = viMode ? "VI-Adapted" : "Base";

const slug =
  topic.meta?.slug ||
  basename(inputArg).replace(/\.json$/i, "") ||
  "worksheet";
const niceName = (topic.meta?.title || slug).replace(/\s+/g, "-");

const landscapeHTML = renderLandscapeHTML(topic.landscape || {});
const bookletHTML = renderBookletHTML(topic.booklet || {});

/**
 * VI-adapted CSS overlay — injected after the existing </style> tag.
 * Increases font sizes, line-height, padding, and enforces high contrast.
 * Uses bold Arial as the universal accessible font stack.
 */
const VI_CSS = `
<style>
  /* VI Adaptation: large print, high contrast, generous spacing */
  html, body, .page, .page *, .page *::before, .page *::after {
    font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
    font-weight: 700 !important;
    color: #000000 !important;
  }
  .page {
    font-size: 22px !important;
    line-height: 1.7 !important;
  }
  .box {
    padding: 20px 20px !important;
    border-color: #000000 !important;
    border-width: 2px !important;
  }
  h2 {
    font-size: 24px !important;
  }
  .h-title {
    font-size: 32px !important;
  }
  .h-sub {
    font-size: 19px !important;
  }
  .note {
    font-size: 19px !important;
  }
  .m-steps {
    font-size: 20px !important;
  }
  .q-text {
    font-size: 26px !important;
  }
  .q-num {
    font-size: 24px !important;
  }
  .marks {
    font-size: 20px !important;
  }
  .pip {
    width: 16px !important;
    height: 16px !important;
    border-color: #000000 !important;
  }
  .pip.on {
    background: #000000 !important;
  }
  li {
    margin: 12px 0 !important;
  }
  .worked .ex div, .worked .example div {
    font-size: 20px !important;
    margin: 6px 0 !important;
  }
  .small-header .sh-title {
    font-size: 26px !important;
  }
  .sh-sub, .sh-name {
    font-size: 18px !important;
  }
  .rem-steps {
    font-size: 18px !important;
  }
  .ans-label {
    font-size: 22px !important;
  }
  .frame-steps li {
    font-size: 20px !important;
  }
  .confidence {
    font-size: 20px !important;
  }
  .key-list li {
    font-size: 18px !important;
  }
  /* SVG text elements */
  .g-ax, .g-pt, .g-lbl, .t-lbl, .t-eq, .t-cell {
    font-size: 18px !important;
    fill: #000000 !important;
    font-weight: 700 !important;
  }
  /* Make aria description visible for VI users */
  .vi-description {
    display: block !important;
    font-size: 18px !important;
    margin-top: 8px;
    padding: 10px;
    border: 1px dashed #000000;
    background: #f9f9f9;
  }
</style>`;

/**
 * Apply VI adaptations to rendered HTML.
 * 1. Inject the VI CSS override stylesheet.
 * 2. Extract aria-label from SVGs and add visible text descriptions.
 */
function applyViAdaptation(html) {
  // Inject CSS after the closing </style> tag
  let adapted = html.replace("</style>", "</style>" + VI_CSS);

  // Find SVG elements with aria-label and add visible description after them
  adapted = adapted.replace(
    /(<svg[^>]*aria-label="([^"]*)"[^>]*>[\s\S]*?<\/svg>)/g,
    (match, svg, ariaLabel) => {
      return svg + `\n<p class="vi-description">${ariaLabel}</p>`;
    }
  );

  return adapted;
}

let finalLandscapeHTML = landscapeHTML;
let finalBookletHTML = bookletHTML;

if (viMode) {
  finalLandscapeHTML = applyViAdaptation(landscapeHTML);
  finalBookletHTML = applyViAdaptation(bookletHTML);
}

const landscapeHtmlPath = join(outDir, `${niceName}-Landscape-${suffix}.html`);
const bookletHtmlPath = join(outDir, `${niceName}-${suffix}.html`);
writeFileSync(landscapeHtmlPath, finalLandscapeHTML, "utf8");
writeFileSync(bookletHtmlPath, finalBookletHTML, "utf8");

const landscapePdf = join(outDir, `${niceName}-Landscape-${suffix}.pdf`);
const bookletPdf = join(outDir, `${niceName}-${suffix}.pdf`);

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

await toPdf(finalLandscapeHTML, landscapePdf, true);
await toPdf(finalBookletHTML, bookletPdf, false);

await browser.close();
console.log("\nDone:", niceName, `(${suffix})`);
