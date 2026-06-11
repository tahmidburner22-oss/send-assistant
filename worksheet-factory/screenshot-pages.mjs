/**
 * screenshot-pages.mjs — Capture per-page screenshots of the generated HTML files
 * at full A4 landscape resolution for QA review.
 *
 * Usage: node screenshot-pages.mjs
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist");

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

// A4 landscape at 150 DPI for good resolution: 1754 x 1240
// Standard A4 landscape at 96 DPI: 1123 x 794
const PAGE_WIDTH = 1123;
const PAGE_HEIGHT = 794;

async function screenshotPages(htmlPath, outputPrefix) {
  const page = await browser.newPage();
  // Set viewport wide enough but tall enough to contain full document
  await page.setViewportSize({ width: PAGE_WIDTH, height: PAGE_HEIGHT * 3 });
  const html = readFileSync(htmlPath, "utf8");
  await page.setContent(html, { waitUntil: "networkidle" });
  
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch {}

  // Get total page height to determine number of pages
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  const numPages = Math.ceil(bodyHeight / PAGE_HEIGHT);
  
  console.log(`${outputPrefix}: ${numPages} page(s) detected (body height: ${bodyHeight}px)`);

  for (let i = 0; i < numPages; i++) {
    const clipHeight = Math.min(PAGE_HEIGHT, bodyHeight - i * PAGE_HEIGHT);
    const outputPath = join(distDir, `${outputPrefix}-page${i + 1}.png`);
    await page.screenshot({
      path: outputPath,
      fullPage: false,
      clip: {
        x: 0,
        y: i * PAGE_HEIGHT,
        width: PAGE_WIDTH,
        height: clipHeight,
      },
    });
    console.log(`  Page ${i + 1}: ${outputPath} (${PAGE_WIDTH}x${clipHeight})`);
  }

  await page.close();
}

// Base landscape - per page
await screenshotPages(
  join(distDir, "Expanding-Double-Brackets-Landscape-Base.html"),
  "screenshot-base-landscape"
);

// VI landscape - per page
await screenshotPages(
  join(distDir, "Expanding-Double-Brackets-Landscape-VI-Adapted.html"),
  "screenshot-vi-landscape"
);

await browser.close();
console.log("\nDone! Per-page screenshots saved to dist/");
