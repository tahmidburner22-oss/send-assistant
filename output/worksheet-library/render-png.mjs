/**
 * Renders worksheet pages to PNG for visual QA.
 * Usage: node render-png.mjs <worksheet.json> <outPrefix> [maxPages]
 * Imports the HTML builder from render-pdf.mjs would be ideal, but to keep it
 * standalone for QA we re-read the JSON and screenshot each .page element.
 */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { buildHtml, isLandscapeWs } from './render-core.mjs';

const inputFile = process.argv[2];
const outPrefix = process.argv[3] || 'preview';
const maxPages = parseInt(process.argv[4] || '4', 10);

const ws = JSON.parse(readFileSync(inputFile, 'utf8'));
const html = buildHtml(ws);
const landscape = isLandscapeWs(ws);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({
  viewport: {
    width: landscape ? 1123 : 794,   // A4 @ 96dpi
    height: landscape ? 794 : 1123,
  },
  deviceScaleFactor: 1.5,
});
await page.setContent(html, { waitUntil: 'networkidle' });

const pages = await page.$$('.page');
const n = Math.min(pages.length, maxPages);
for (let i = 0; i < n; i++) {
  await pages[i].screenshot({ path: `${outPrefix}-p${i + 1}.png` });
  console.log(`✓ ${outPrefix}-p${i + 1}.png`);
}
await browser.close();
