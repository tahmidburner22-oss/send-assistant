/**
 * screenshot.mjs — Capture screenshots of the generated HTML files
 * for visual QA comparison against reference images.
 *
 * Usage: node screenshot.mjs
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist");

const browser = await chromium.launch({
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

// A4 landscape dimensions at 96 DPI: 1123 x 794 pixels
// But we use a wider viewport to capture the full content
const A4_LANDSCAPE_WIDTH = 1123;
const A4_LANDSCAPE_HEIGHT = 794;

async function screenshotHTML(htmlPath, outputPath, width, height) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  const html = readFileSync(htmlPath, "utf8");
  await page.setContent(html, { waitUntil: "networkidle" });
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
  } catch {}
  await page.screenshot({ path: outputPath, fullPage: true });
  await page.close();
  console.log("Screenshot:", outputPath);
}

// Standard Base landscape
await screenshotHTML(
  join(distDir, "Expanding-Double-Brackets-Landscape-Base.html"),
  join(distDir, "screenshot-base-landscape.png"),
  A4_LANDSCAPE_WIDTH,
  A4_LANDSCAPE_HEIGHT
);

// VI-Adapted landscape
await screenshotHTML(
  join(distDir, "Expanding-Double-Brackets-Landscape-VI-Adapted.html"),
  join(distDir, "screenshot-vi-landscape.png"),
  A4_LANDSCAPE_WIDTH,
  A4_LANDSCAPE_HEIGHT
);

await browser.close();
console.log("\nDone! Screenshots saved to dist/");
