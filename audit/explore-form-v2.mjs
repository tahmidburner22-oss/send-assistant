/**
 * Explore the worksheet generation form on adaptly.co.uk
 * Path: Login -> SEND Hub -> SEND Worksheets
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
console.log('Step 1: Logging in...');
await page.goto('https://adaptly.co.uk/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

await page.fill('input[type="email"], input[name="email"]', 'admin@adaptly.co.uk');
await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
await page.click('button[type="submit"]');
await page.waitForTimeout(8000);
console.log('  Logged in. URL:', page.url());

// Navigate to SEND Hub first
console.log('Step 2: Looking for SEND Hub...');
// Check current page for navigation links
const navLinks = await page.locator('a, button, [role="link"]').allTextContents();
const sendHubLink = navLinks.filter(t => t.toLowerCase().includes('send'));
console.log('  SEND-related nav items:', sendHubLink.slice(0, 10).join(' | '));

// Try clicking SEND Hub in sidebar/nav
try {
  const sendHub = page.locator('a:has-text("SEND Hub"), a:has-text("SEND"), [href*="send"]').first();
  if (await sendHub.isVisible({ timeout: 3000 })) {
    await sendHub.click();
    await page.waitForTimeout(3000);
    console.log('  Clicked SEND Hub. URL:', page.url());
  } else {
    // Try direct navigation
    console.log('  SEND Hub link not visible, trying direct nav...');
    await page.goto('https://adaptly.co.uk/send-hub', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('  URL after /send-hub:', page.url());
  }
} catch(e) {
  console.log('  Error finding SEND Hub:', e.message);
}

// Screenshot the SEND Hub page
fs.mkdirSync('audit/captures', { recursive: true });
await page.screenshot({ path: 'audit/captures/send-hub.png', fullPage: true });

// Now look for SEND Worksheets
console.log('Step 3: Looking for SEND Worksheets...');
const pageText = await page.textContent('body');
const worksheetLinks = await page.locator('a:has-text("Worksheet"), a:has-text("worksheet"), button:has-text("Worksheet")').allTextContents();
console.log('  Worksheet-related links:', worksheetLinks.join(' | '));

// Try clicking SEND Worksheets
try {
  const wsLink = page.locator('a:has-text("SEND Worksheet"), a:has-text("Worksheets"), a[href*="worksheet"]').first();
  if (await wsLink.isVisible({ timeout: 3000 })) {
    await wsLink.click();
    await page.waitForTimeout(5000);
    console.log('  Clicked SEND Worksheets. URL:', page.url());
  } else {
    // Maybe try /worksheets directly since previous run showed it working
    await page.goto('https://adaptly.co.uk/worksheets', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    console.log('  Direct nav to /worksheets. URL:', page.url());
  }
} catch(e) {
  console.log('  Error:', e.message);
}

// Dismiss any modal
try {
  const modalBtns = page.locator('button:has-text("Accept"), button:has-text("Got it"), button:has-text("Close"), button:has-text("Dismiss")');
  if (await modalBtns.first().isVisible({ timeout: 2000 })) {
    await modalBtns.first().click();
    await page.waitForTimeout(1000);
    console.log('  Dismissed modal.');
  }
} catch(e) {}

// Now analyze the form
console.log('\n--- Worksheet Form Analysis ---');
console.log('URL:', page.url());

// Get all labels
const labels = await page.locator('label').allTextContents();
console.log('\nLabels:', labels.filter(l => l.trim()).join(' | '));

// Get all buttons
const buttons = await page.locator('button').allTextContents();
console.log('\nButtons:', buttons.filter(b => b.trim()).slice(0, 25).join(' | '));

// Find comboboxes/selects  
const comboboxes = await page.locator('[role="combobox"]').all();
console.log(`\nComboboxes: ${comboboxes.length}`);
for (let i = 0; i < comboboxes.length; i++) {
  const cb = comboboxes[i];
  const text = await cb.textContent();
  const ariaLabel = await cb.getAttribute('aria-label') || '';
  console.log(`  [${i}] text: "${text?.slice(0,50)}" aria-label: "${ariaLabel}"`);
}

// Try to interact with Subject combobox
console.log('\n--- Attempting to open Subject dropdown ---');
try {
  // The previous run showed button text "Select subject"
  const subjectBtn = page.locator('button:has-text("Select subject")');
  if (await subjectBtn.isVisible({ timeout: 3000 })) {
    await subjectBtn.click();
    await page.waitForTimeout(1000);
    
    // Now look for the dropdown options
    const options = await page.locator('[role="option"], [role="menuitem"], li[data-value], [class*="option"]').allTextContents();
    console.log('  Subject options:', options.slice(0, 15).join(' | '));
    
    // Also check for a generic listbox
    const listItems = await page.locator('[role="listbox"] *, [data-radix-select-viewport] *, [class*="dropdown"] li, [class*="menu"] li').allTextContents();
    console.log('  Listbox items:', listItems.filter(t => t.trim()).slice(0, 15).join(' | '));
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else {
    console.log('  "Select subject" button not found');
  }
} catch(e) {
  console.log('  Error:', e.message);
}

// Screenshot the form
await page.screenshot({ path: 'audit/captures/worksheet-form.png', fullPage: true });
console.log('\nScreenshots saved.');

await browser.close();
