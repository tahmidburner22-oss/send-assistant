/**
 * Explore the worksheet generation form on adaptly.co.uk
 * to discover correct selectors for filling in fields.
 */

import { chromium } from '/projects/sandbox/send-assistant/.playwright-audit/node_modules/playwright/index.mjs';
import fs from 'fs';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});

const page = await context.newPage();

// Login
console.log('Logging in...');
await page.goto('https://adaptly.co.uk/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

await page.fill('input[type="email"], input[name="email"]', 'admin@adaptly.co.uk');
await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
await page.click('button[type="submit"]');
await page.waitForTimeout(8000);
console.log('Logged in. URL:', page.url());

// Navigate to worksheets
console.log('Going to /worksheets...');
await page.goto('https://adaptly.co.uk/worksheets', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);

// Dismiss modal
try {
  const modalBtns = page.locator('button:has-text("Accept"), button:has-text("Got it"), button:has-text("Close"), button:has-text("Dismiss")');
  const count = await modalBtns.count();
  if (count > 0) {
    await modalBtns.first().click();
    await page.waitForTimeout(1000);
    console.log('Dismissed modal.');
  }
} catch(e) { console.log('No modal.'); }

// Capture the page
console.log('\n--- Page Analysis ---');
console.log('URL:', page.url());
console.log('Title:', await page.title());

// Get all interactive elements
const selects = await page.locator('select').all();
console.log(`\n<select> elements: ${selects.length}`);
for (let i = 0; i < selects.length; i++) {
  const s = selects[i];
  const name = await s.getAttribute('name') || await s.getAttribute('id') || `[index ${i}]`;
  const options = await s.locator('option').allTextContents();
  console.log(`  select[${name}]: ${options.slice(0, 8).join(', ')}${options.length > 8 ? '...' : ''}`);
}

// Check for custom dropdowns (React Select, Radix, etc.)
const comboboxes = await page.locator('[role="combobox"]').all();
console.log(`\n[role="combobox"] elements: ${comboboxes.length}`);

const listboxes = await page.locator('[role="listbox"]').all();
console.log(`[role="listbox"] elements: ${listboxes.length}`);

// Get all buttons
const buttons = await page.locator('button').allTextContents();
console.log(`\nButtons: ${buttons.filter(b => b.trim()).slice(0, 20).join(' | ')}`);

// Get all input fields
const inputs = await page.locator('input').all();
console.log(`\nInput fields: ${inputs.length}`);
for (let i = 0; i < Math.min(inputs.length, 15); i++) {
  const inp = inputs[i];
  const type = await inp.getAttribute('type') || 'text';
  const name = await inp.getAttribute('name') || await inp.getAttribute('placeholder') || await inp.getAttribute('id') || `[index ${i}]`;
  console.log(`  input[${type}] name/placeholder: "${name}"`);
}

// Get all labels
const labels = await page.locator('label').allTextContents();
console.log(`\nLabels: ${labels.filter(l => l.trim()).slice(0, 20).join(' | ')}`);

// Get main content text (first 3000 chars)
const mainText = await page.locator('main, #root, body').first().textContent();
console.log(`\nMain content (first 2000 chars):\n${mainText?.slice(0, 2000)}`);

// Screenshot
fs.mkdirSync('audit/captures', { recursive: true });
await page.screenshot({ path: 'audit/captures/form-explore.png', fullPage: true });
console.log('\nScreenshot saved to audit/captures/form-explore.png');

await browser.close();
