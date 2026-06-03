/**
 * Generate a single worksheet on adaptly.co.uk and capture output.
 * Path: Login -> SEND Hub -> dismiss modal -> SEND Worksheets -> fill form -> generate
 * 
 * Usage: node audit/gen-worksheet.mjs <number 2-7>
 */

import { chromium } from '/projects/sandbox/send-assistant/.playwright-audit/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const WORKSHEETS = {
  2: { subject: 'Biology', year: 'Year 10', topic: 'Cell Biology', send: 'ADHD', board: 'AQA' },
  3: { subject: 'Chemistry', year: 'Year 11', topic: 'Atomic Structure', send: 'Anxiety', board: 'AQA' },
  4: { subject: 'Physics', year: 'Year 9', topic: 'Forces and Motion', send: 'Hearing Impairment', board: 'AQA' },
  5: { subject: 'English', year: 'Year 10', topic: 'Macbeth', send: 'MLD', board: 'AQA' },
  6: { subject: 'Mathematics', year: 'Year 11', topic: 'Histograms and Cumulative Frequency', send: 'Dyscalculia', board: 'AQA' },
  7: { subject: 'Physics', year: 'Year 10', topic: 'Energy', send: 'EAL', board: 'AQA' },
};

const num = parseInt(process.argv[2], 10);
if (!num || !WORKSHEETS[num]) {
  console.error('Usage: node audit/gen-worksheet.mjs <2-7>');
  process.exit(1);
}

const config = WORKSHEETS[num];
console.log(`\n=== Worksheet ${num}: ${config.subject} / ${config.year} / ${config.topic} / ${config.send} / ${config.board} ===\n`);

const outputDir = path.resolve('audit/captures');
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
});

const context = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
const page = await context.newPage();

// ─── Login ───────────────────────────────────────────────────────────────────
console.log('[1] Logging in...');
await page.goto('https://adaptly.co.uk/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await page.fill('input[type="email"], input[name="email"]', 'admin@adaptly.co.uk');
await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
await page.click('button[type="submit"]');
await page.waitForTimeout(6000);
console.log('    URL:', page.url());

// ─── Navigate to SEND Hub & dismiss modal ────────────────────────────────────
console.log('[2] SEND Hub + dismiss modal...');
await page.goto('https://adaptly.co.uk/send-hub', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
try {
  const acceptBtn = page.locator('button:has-text("I Accept")');
  if (await acceptBtn.isVisible({ timeout: 5000 })) {
    await acceptBtn.click();
    await page.waitForTimeout(2000);
    console.log('    Modal dismissed.');
  }
} catch(e) { console.log('    No modal.'); }

// ─── Navigate to Worksheets ──────────────────────────────────────────────────
console.log('[3] Navigating to /worksheets...');
await page.goto('https://adaptly.co.uk/worksheets', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);

// Dismiss worksheet page modal if any
try {
  const btn2 = page.locator('button:has-text("I Accept")');
  if (await btn2.first().isVisible({ timeout: 3000 })) {
    await btn2.first().click();
    await page.waitForTimeout(1000);
  }
} catch(e) {}

// ─── Fill the form ───────────────────────────────────────────────────────────
console.log('[4] Filling form...');

// Subject - button dropdown
const subjectTrigger = page.locator('button:has-text("Select subject")').first();
await subjectTrigger.click();
await page.waitForTimeout(800);
await page.locator(`[role="option"]:has-text("${config.subject}")`).first().click();
await page.waitForTimeout(800);
console.log(`    Subject: ${config.subject}`);

// Year Group - button dropdown
const yearTrigger = page.locator('button:has-text("Select year")').first();
await yearTrigger.click();
await page.waitForTimeout(800);
await page.locator(`[role="option"]:has-text("${config.year}")`).first().click();
await page.waitForTimeout(800);
console.log(`    Year: ${config.year}`);

// Topic - button dropdown "Select a curriculum topic"
const topicTrigger = page.locator('button:has-text("Select a curriculum topic"), button:has-text("curriculum topic")').first();
if (await topicTrigger.isVisible({ timeout: 3000 })) {
  await topicTrigger.click();
  await page.waitForTimeout(1000);
  
  let topicSelected = false;
  
  // Get all available options
  const allOptions = await page.locator('[role="option"]').allTextContents();
  console.log(`    Available topics (${allOptions.length} total, first 15): ${allOptions.slice(0, 15).join(' | ')}`);
  
  // Try exact match first
  const exactOption = page.locator(`[role="option"]:has-text("${config.topic}")`).first();
  if (await exactOption.isVisible({ timeout: 1000 }).catch(() => false)) {
    await exactOption.click();
    topicSelected = true;
    console.log(`    Topic: ${config.topic} (exact match)`);
  }
  
  if (!topicSelected) {
    // Try matching by key words from config.topic against the year group
    const yearNum = config.year.replace('Year ', '');
    const keywords = config.topic.toLowerCase().split(' ');
    
    // Prefer options that match the year group AND a keyword
    let bestMatch = allOptions.find(o => {
      const lower = o.toLowerCase();
      return lower.includes(`year ${yearNum}`) && keywords.some(k => k.length > 3 && lower.includes(k));
    });
    
    // If no year-matched keyword hit, try just keyword match
    if (!bestMatch) {
      bestMatch = allOptions.find(o => {
        const lower = o.toLowerCase();
        return keywords.some(k => k.length > 3 && lower.includes(k));
      });
    }
    
    // If still no match, pick a year-appropriate option
    if (!bestMatch) {
      bestMatch = allOptions.find(o => o.includes(`Year ${yearNum}`)) || allOptions[0];
    }
    
    if (bestMatch) {
      // Click the matched option  
      const matchOption = page.locator(`[role="option"]:has-text("${bestMatch.slice(0, 40)}")`).first();
      if (await matchOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await matchOption.click();
        topicSelected = true;
        console.log(`    Topic: ${bestMatch} (best match)`);
      }
    }
    
    if (!topicSelected) {
      await page.locator('[role="option"]').first().click();
      console.log(`    Topic: ${allOptions[0]} (fallback)`);
    }
  }
} else {
  console.log('    WARN: Topic dropdown not found');
}

await page.waitForTimeout(500);

// SEND Need - button dropdown
const sendTrigger = page.locator('button:has-text("Select SEND need")').first();
if (await sendTrigger.isVisible({ timeout: 3000 })) {
  await sendTrigger.click();
  await page.waitForTimeout(800);
  
  const sendOption = page.locator(`[role="option"]:has-text("${config.send}")`).first();
  if (await sendOption.isVisible({ timeout: 2000 })) {
    await sendOption.click();
    console.log(`    SEND: ${config.send}`);
  } else {
    // List options
    const sendOptions = await page.locator('[role="option"]').allTextContents();
    console.log(`    SEND options: ${sendOptions.slice(0, 10).join(' | ')}`);
    // Try partial match
    const match = sendOptions.find(o => o.toLowerCase().includes(config.send.toLowerCase().split(' ')[0]));
    if (match) {
      await page.locator(`[role="option"]:has-text("${match}")`).first().click();
      console.log(`    SEND: ${match} (partial match)`);
    } else {
      await page.keyboard.press('Escape');
      console.log('    WARN: Could not select SEND need');
    }
  }
} else {
  console.log('    WARN: SEND dropdown not found');
}

await page.waitForTimeout(500);

// Difficulty - click "Standard" button
try {
  const standardBtn = page.locator('button:has-text("Standard")').first();
  if (await standardBtn.isVisible({ timeout: 2000 })) {
    await standardBtn.click();
    console.log('    Difficulty: Standard');
  }
} catch(e) {}

// Screenshot the filled form
await page.screenshot({ path: path.join(outputDir, `ws${num}-filled-form.png`), fullPage: true });

// ─── Generate ────────────────────────────────────────────────────────────────
console.log('[5] Generating worksheet...');

// Wait a moment for form validation to complete
await page.waitForTimeout(2000);

// Check if Generate button is enabled
const genBtnSelector = 'button:has-text("Generate"):not([disabled])';
let genBtn = page.locator(genBtnSelector).last();

// If button is still disabled, check what's missing
const isDisabled = await page.locator('button:has-text("Generate")[disabled]').last().isVisible({ timeout: 1000 }).catch(() => false);
if (isDisabled) {
  console.log('    Generate button is disabled. Checking form state...');
  // Screenshot to debug
  await page.screenshot({ path: path.join(outputDir, `ws${num}-disabled-form.png`), fullPage: true });
  
  // The "Standard" difficulty may need to be clicked
  const stdBtn = page.locator('button:has-text("Standard")').first();
  if (await stdBtn.isVisible({ timeout: 1000 })) {
    await stdBtn.click();
    await page.waitForTimeout(1000);
  }
  
  // Wait for it to enable
  try {
    await page.locator(genBtnSelector).last().waitFor({ state: 'visible', timeout: 5000 });
    genBtn = page.locator(genBtnSelector).last();
  } catch(e) {
    console.log('    Button still disabled, attempting force click...');
    genBtn = page.locator('button:has-text("Generate")').last();
    await genBtn.click({ force: true });
    await page.waitForTimeout(5000);
    // If that didn't work, the form might need NL input instead
    const nlInput = page.locator('input[placeholder*="Year 11"]').first();
    if (await nlInput.isVisible({ timeout: 1000 })) {
      const nlQuery = `${config.year} ${config.subject} ${config.topic} for ${config.send}`;
      await nlInput.fill(nlQuery);
      console.log(`    Used NL input: "${nlQuery}"`);
      await page.waitForTimeout(1000);
      // Now try Generate again
      const genBtn2 = page.locator('button:has-text("Generate")').last();
      await genBtn2.click({ force: true });
    }
  }
} else {
  await genBtn.click();
}

console.log('    Clicked Generate. Waiting for output...');

// Wait for generation (AI takes 20-90s typically)
let outputReady = false;
for (let i = 0; i < 30; i++) { // max 150s wait
  await page.waitForTimeout(5000);
  const bodyText = await page.textContent('body');
  
  // Check for completion signals
  if (bodyText.includes('marks)') || bodyText.includes('marks]') || 
      bodyText.includes('Answer all') || bodyText.includes('Show all working') ||
      bodyText.includes('Section A') || bodyText.includes('Section B') ||
      bodyText.includes('[1]') || bodyText.includes('[2]')) {
    console.log(`    Output detected after ${(i+1)*5}s`);
    outputReady = true;
    break;
  }
  
  if (i % 4 === 3) {
    console.log(`    Still waiting... ${(i+1)*5}s`);
  }
}

// Extra settling time
await page.waitForTimeout(5000);

if (!outputReady) {
  console.log('    WARNING: Timed out waiting for generation');
}

// ─── Capture Output ──────────────────────────────────────────────────────────
console.log('[6] Capturing output...');

// Full page screenshot
await page.screenshot({ path: path.join(outputDir, `ws${num}-output-full.png`), fullPage: true });

// Scroll down to capture more
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(outputDir, `ws${num}-output-bottom.png`), fullPage: true });

// Get full text content
const fullText = await page.evaluate(() => document.body.innerText);
fs.writeFileSync(path.join(outputDir, `ws${num}-text.txt`), fullText);

// Get just the worksheet preview/output area text
const worksheetText = await page.evaluate(() => {
  // Try common selectors for the output area
  const candidates = [
    document.querySelector('[class*="preview"]'),
    document.querySelector('[class*="worksheet-output"]'),
    document.querySelector('[class*="generated"]'),
    document.querySelector('[class*="WorksheetPreview"]'),
    document.querySelector('[class*="result"]'),
    document.querySelector('article'),
  ].filter(Boolean);
  
  if (candidates.length > 0) {
    return candidates[0].innerText;
  }
  
  // Fallback: find the largest text block that looks like worksheet content
  const main = document.querySelector('main') || document.body;
  return main.innerText;
});

fs.writeFileSync(path.join(outputDir, `ws${num}-worksheet-text.txt`), worksheetText || fullText);

// Extract section structure
const sections = await page.evaluate(() => {
  const results = [];
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5');
  headings.forEach(h => {
    if (h.textContent.trim() && h.offsetParent !== null) {
      results.push({
        tag: h.tagName,
        text: h.textContent.trim().slice(0, 200)
      });
    }
  });
  return results;
});

fs.writeFileSync(path.join(outputDir, `ws${num}-sections.json`), JSON.stringify(sections, null, 2));

console.log(`\n--- Output Summary ---`);
console.log(`Full text length: ${fullText.length} chars`);
console.log(`Sections/headings found: ${sections.length}`);
sections.slice(0, 25).forEach(s => console.log(`  <${s.tag}> ${s.text}`));
console.log(`\n--- First 2000 chars of worksheet text ---`);
console.log((worksheetText || fullText).slice(0, 2000));

console.log(`\n=== Worksheet ${num} complete ===`);
await browser.close();
