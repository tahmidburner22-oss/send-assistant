/**
 * Playwright audit script — generates worksheets 2-7 on adaptly.co.uk
 * and captures full text output + screenshots.
 *
 * Usage: node audit/generate-worksheets.mjs <worksheet_number>
 * Example: node audit/generate-worksheets.mjs 2
 */

import { chromium } from '/projects/sandbox/send-assistant/.playwright-audit/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const WORKSHEETS = [
  null, // index 0 unused
  { subject: 'Mathematics', year: 'Year 10', topic: 'Quadratic Equations', send: 'Dyslexia', board: 'AQA' },
  { subject: 'Biology', year: 'Year 10', topic: 'Cell Biology', send: 'ADHD', board: 'AQA' },
  { subject: 'Chemistry', year: 'Year 11', topic: 'Atomic Structure', send: 'Anxiety', board: 'AQA' },
  { subject: 'Physics', year: 'Year 9', topic: 'Forces and Motion', send: 'Hearing Impairment', board: 'AQA' },
  { subject: 'English', year: 'Year 10', topic: 'Macbeth', send: 'MLD', board: 'AQA' },
  { subject: 'Mathematics', year: 'Year 11', topic: 'Histograms and Cumulative Frequency', send: 'Dyscalculia', board: 'AQA' },
  { subject: 'Physics', year: 'Year 10', topic: 'Energy', send: 'EAL', board: 'AQA' },
];

const num = parseInt(process.argv[2], 10);
if (!num || num < 2 || num > 7) {
  console.error('Usage: node audit/generate-worksheets.mjs <2-7>');
  process.exit(1);
}

const config = WORKSHEETS[num];
console.log(`\n=== Generating Worksheet ${num}: ${config.subject} / ${config.year} / ${config.topic} / ${config.send} / ${config.board} ===\n`);

const outputDir = path.resolve('audit/captures');
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
});

const page = await context.newPage();

// ─── Step 1: Login ───────────────────────────────────────────────────────────
console.log('Logging in...');
await page.goto('https://adaptly.co.uk/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Fill login form
await page.fill('input[type="email"], input[name="email"]', 'admin@adaptly.co.uk');
await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);

console.log('Login complete. Current URL:', page.url());

// ─── Step 2: Navigate to worksheets page ─────────────────────────────────────
console.log('Navigating to worksheets...');
await page.goto('https://adaptly.co.uk/worksheets', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

// Dismiss any modal (AI Best Practices)
try {
  const acceptBtn = page.locator('button:has-text("I Accept"), button:has-text("Accept"), button:has-text("Got it"), button:has-text("Close")');
  if (await acceptBtn.first().isVisible({ timeout: 3000 })) {
    await acceptBtn.first().click();
    await page.waitForTimeout(1000);
    console.log('Dismissed modal.');
  }
} catch (e) {
  console.log('No modal to dismiss.');
}

// ─── Step 3: Fill in the worksheet form ──────────────────────────────────────
console.log('Filling worksheet form...');

// Helper: select from dropdown/combobox
async function selectOption(labelText, optionText) {
  // Try multiple selector strategies
  const selectors = [
    `select:near(:text("${labelText}"))`,
    `[aria-label*="${labelText}" i]`,
    `label:has-text("${labelText}") + select`,
    `label:has-text("${labelText}") ~ select`,
  ];
  
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1000 })) {
        await el.selectOption({ label: optionText });
        console.log(`  Selected "${optionText}" for "${labelText}" via select`);
        return true;
      }
    } catch (e) {}
  }
  
  // Try clicking a button/div that opens a dropdown
  try {
    const trigger = page.locator(`button:near(:text("${labelText}")), [role="combobox"]:near(:text("${labelText}"))`).first();
    if (await trigger.isVisible({ timeout: 1000 })) {
      await trigger.click();
      await page.waitForTimeout(500);
      const option = page.locator(`[role="option"]:has-text("${optionText}"), li:has-text("${optionText}")`).first();
      if (await option.isVisible({ timeout: 2000 })) {
        await option.click();
        console.log(`  Selected "${optionText}" for "${labelText}" via dropdown`);
        return true;
      }
    }
  } catch (e) {}
  
  console.log(`  WARNING: Could not select "${optionText}" for "${labelText}"`);
  return false;
}

// Try to fill the form fields
// First, let's see what's on the page
const pageContent = await page.textContent('body');
console.log('Page title:', await page.title());

// Take a screenshot of the form state
await page.screenshot({ path: path.join(outputDir, `ws${num}-form.png`), fullPage: true });

// Look for subject selector
const subjectMap = {
  'Mathematics': 'math',
  'Biology': 'biology', 
  'Chemistry': 'chemistry',
  'Physics': 'physics',
  'English': 'english',
};

// Try various form interaction approaches
// Approach 1: Look for select elements
const allSelects = await page.locator('select').all();
console.log(`Found ${allSelects.length} <select> elements`);

// Approach 2: Look for specific form fields by their labels/placeholders
const formFields = await page.locator('input, select, [role="combobox"], [role="listbox"]').all();
console.log(`Found ${formFields.length} form fields total`);

// Let's get the form state by reading all visible text
const visibleLabels = await page.locator('label, [class*="label"], h3, h4').allTextContents();
console.log('Visible labels:', visibleLabels.slice(0, 20).join(' | '));

// Try to interact with subject field
try {
  // Many React apps use custom selects - try clicking on the subject area
  const subjectField = page.locator('text=Subject').first();
  if (await subjectField.isVisible({ timeout: 2000 })) {
    // Look for the nearest interactive element
    const parent = subjectField.locator('..').locator('select, [role="combobox"], button, input');
    if (await parent.first().isVisible({ timeout: 1000 })) {
      await parent.first().click();
      await page.waitForTimeout(500);
    }
  }
} catch (e) {}

// Take screenshot showing current form state
await page.screenshot({ path: path.join(outputDir, `ws${num}-form-state.png`), fullPage: true });

// Dump the page HTML for analysis (just the form area)
const formHtml = await page.locator('main, [class*="form"], [class*="worksheet"]').first().innerHTML().catch(() => '');
fs.writeFileSync(path.join(outputDir, `ws${num}-form-html.txt`), formHtml.slice(0, 50000));

console.log('\nForm HTML captured. Examining structure to determine correct interaction method...');
console.log('Output saved to:', outputDir);

await browser.close();
