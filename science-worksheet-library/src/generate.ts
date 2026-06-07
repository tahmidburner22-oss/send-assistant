/**
 * Science Worksheet Library — Playwright Headless PDF/PNG Generator
 *
 * Usage:
 *   tsx src/generate.ts <worksheet.json>        — generate one worksheet
 *   tsx src/generate.ts --all                   — generate all worksheets
 *
 * Outputs PDF + PNG to output/ folder.
 * Enforces single-page A4-landscape fit — fails if content overflows.
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, basename, relative, join } from 'node:path';
import { renderWorksheet } from './render.js';
import type { Worksheet } from './types.js';

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'output');
const WORKSHEETS_DIR = resolve(ROOT, 'worksheets');

// A4 landscape dimensions in pixels at 96 DPI
const A4_LANDSCAPE_WIDTH = 1123;  // 297mm
const A4_LANDSCAPE_HEIGHT = 794;  // 210mm

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function findAllWorksheets(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findAllWorksheets(full));
    } else if (entry.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

// ─── Generator ────────────────────────────────────────────────────────────────

interface GenerateResult {
  file: string;
  pdfPath: string;
  pngPath: string;
  overflow: boolean;
  pageHeight: number;
}

async function generateWorksheet(jsonPath: string): Promise<GenerateResult> {
  const raw = readFileSync(jsonPath, 'utf-8');
  const ws: Worksheet = JSON.parse(raw);

  // Render HTML
  const html = renderWorksheet(ws);

  // Determine output filenames
  const rel = relative(WORKSHEETS_DIR, jsonPath);
  const name = basename(rel, '.json');
  const subDir = resolve(OUTPUT_DIR, rel, '..');
  ensureDir(subDir);

  const htmlPath = resolve(subDir, `${name}.html`);
  const pdfPath = resolve(subDir, `${name}.pdf`);
  const pngPath = resolve(subDir, `${name}.png`);

  // Write HTML for debugging
  writeFileSync(htmlPath, html, 'utf-8');

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport to A4 landscape
  await page.setViewportSize({
    width: A4_LANDSCAPE_WIDTH,
    height: A4_LANDSCAPE_HEIGHT,
  });

  await page.setContent(html, { waitUntil: 'networkidle' });

  // ─── Overflow Check ───────────────────────────────────────────────────────
  const pageHeight = await page.evaluate(() => {
    const pageEl = document.querySelector('.page') as HTMLElement;
    if (!pageEl) return 0;
    return pageEl.scrollHeight;
  });

  const maxHeight = A4_LANDSCAPE_HEIGHT;
  const overflow = pageHeight > maxHeight + 5; // 5px tolerance

  // ─── Generate PDF ─────────────────────────────────────────────────────────
  await page.pdf({
    path: pdfPath,
    width: '297mm',
    height: '210mm',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  // ─── Generate PNG ─────────────────────────────────────────────────────────
  await page.screenshot({
    path: pngPath,
    fullPage: false,
    clip: { x: 0, y: 0, width: A4_LANDSCAPE_WIDTH, height: A4_LANDSCAPE_HEIGHT },
  });

  await browser.close();

  return { file: rel, pdfPath, pngPath, overflow, pageHeight };
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  ensureDir(OUTPUT_DIR);

  let files: string[] = [];

  if (args.includes('--all')) {
    files = findAllWorksheets(WORKSHEETS_DIR);
  } else if (args.length > 0) {
    files = args.filter(a => !a.startsWith('--')).map(f => resolve(f));
  } else {
    console.error('Usage: tsx src/generate.ts <worksheet.json> | --all');
    process.exit(1);
  }

  if (files.length === 0) {
    console.error('No worksheet JSON files found.');
    process.exit(1);
  }

  console.log(`\n📄 Generating ${files.length} worksheet(s)...\n`);

  let hasOverflow = false;

  for (const file of files) {
    try {
      const result = await generateWorksheet(file);
      const status = result.overflow ? '❌ OVERFLOW' : '✅ OK';
      const heightInfo = `(${result.pageHeight}px / ${maxHeightDisplay()}px max)`;
      console.log(`  ${status} ${result.file} ${heightInfo}`);
      console.log(`       PDF: ${relative(ROOT, result.pdfPath)}`);
      console.log(`       PNG: ${relative(ROOT, result.pngPath)}`);

      if (result.overflow) {
        hasOverflow = true;
        console.log(`       ⚠️  Content overflows by ${result.pageHeight - A4_LANDSCAPE_HEIGHT}px — reduce content!`);
      }
      console.log('');
    } catch (err) {
      console.error(`  ❌ FAILED ${relative(WORKSHEETS_DIR, file)}: ${(err as Error).message}`);
      hasOverflow = true;
    }
  }

  if (hasOverflow) {
    console.error('\n⚠️  Some worksheets overflow a single page. Fix before shipping.\n');
    process.exit(1);
  }

  console.log('✨ All worksheets generated successfully — single-page fit confirmed.\n');
}

function maxHeightDisplay(): number {
  return A4_LANDSCAPE_HEIGHT;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
