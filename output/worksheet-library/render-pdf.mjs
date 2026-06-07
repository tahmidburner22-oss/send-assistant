/**
 * Worksheet PDF Renderer — MathsGenie-style exam booklet.
 * Usage: node render-pdf.mjs <worksheet.json> [output.pdf]
 */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { buildHtml, isLandscapeWs } from './render-core.mjs';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node render-pdf.mjs <worksheet.json> [output.pdf]');
  process.exit(1);
}
const outputFile = process.argv[3] || inputFile.replace('.json', '.pdf');
const ws = JSON.parse(readFileSync(inputFile, 'utf8'));
const landscape = isLandscapeWs(ws);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent(buildHtml(ws), { waitUntil: 'networkidle' });
await page.pdf({
  path: outputFile,
  format: 'A4',
  landscape: landscape,
  margin: { top: '0', bottom: '0', left: '0', right: '0' },
  printBackground: true,
});
await browser.close();
console.log(`✓ ${outputFile}`);
