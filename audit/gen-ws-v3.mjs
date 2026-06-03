/**
 * Generate worksheets - v3: fill form fields directly, handle disabled button.
 * User confirmed: year tags on topics are guides only, any topic can be picked for any year.
 * 
 * Usage: node audit/gen-ws-v3.mjs <number 2-7>
 */

import { chromium } from '/projects/sandbox/send-assistant/.playwright-audit/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const WORKSHEETS = {
  2: { subject: 'Biology', year: 'Year 10', topic: 'Cell', send: 'ADHD' },
  3: { subject: 'Chemistry', year: 'Year 11', topic: 'Atomic', send: 'Anxiety' },
  4: { subject: 'Physics', year: 'Year 9', topic: 'Forces', send: 'Hearing Impairment' },
  5: { subject: 'English', year: 'Year 10', topic: 'Macbeth', send: 'MLD' },
  6: { subject: 'Mathematics', year: 'Year 11', topic: 'Histogram', send: 'Dyscalculia' },
  7: { subject: 'Physics', year: 'Year 10', topic: 'Energy', send: 'EAL' },
};

const num = parseInt(process.argv[2], 10);
if (!num || !WORKSHEETS[num]) {
  console.error('Usage: node audit/gen-ws-v3.mjs <2-7>');
  process.exit(1);
}

const config = WORKSHEETS[num];
console.log(`\n=== Worksheet ${num}: ${config.subject} / ${config.year} / ${config.topic} / ${config.send} ===\n`);

const outputDir = path.resolve('audit/captures');
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
});

const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
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

// ─── SEND Hub + dismiss modal ────────────────────────────────────────────────
console.log('[2] SEND Hub...');
await page.goto('https://adaptly.co.uk/send-hub', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
try {
  const acceptBtn = page.locator('button:has-text("I Accept")');
  if (await acceptBtn.isVisible({ timeout: 5000 })) {
    await acceptBtn.click();
    await page.waitForTimeout(2000);
    console.log('    Modal dismissed.');
  }
} catch(e) {}

// ─── Worksheets page ─────────────────────────────────────────────────────────
console.log('[3] /worksheets...');
await page.goto('https://adaptly.co.uk/worksheets', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);
try {
  const btn2 = page.locator('button:has-text("I Accept")');
  if (await btn2.first().isVisible({ timeout: 3000 })) {
    await btn2.first().click();
    await page.waitForTimeout(1500);
  }
} catch(e) {}

// ─── Fill Form Fields ────────────────────────────────────────────────────────
console.log('[4] Filling form...');

// SUBJECT
console.log('    [Subject]');
await page.locator('button:has-text("Select subject")').first().click();
await page.waitForTimeout(600);
await page.locator(`[role="option"]:has-text("${config.subject}")`).first().click();
await page.waitForTimeout(600);
console.log(`      -> ${config.subject}`);

// YEAR GROUP
console.log('    [Year]');
await page.locator('button:has-text("Select year")').first().click();
await page.waitForTimeout(600);
await page.locator(`[role="option"]:has-text("${config.year}")`).first().click();
await page.waitForTimeout(600);
console.log(`      -> ${config.year}`);

// TOPIC - pick first one whose name contains our keyword
console.log('    [Topic]');
await page.waitForTimeout(500);
const topicBtn = page.locator('button:has-text("Select a curriculum topic")').first();
if (await topicBtn.isVisible({ timeout: 3000 })) {
  await topicBtn.click();
  await page.waitForTimeout(800);
  
  const options = await page.locator('[role="option"]').allTextContents();
  console.log(`      Options available: ${options.length}`);
  
  // Find topic matching our keyword
  const keyword = config.topic.toLowerCase();
  const match = options.find(o => o.toLowerCase().includes(keyword));
  
  if (match) {
    await page.locator(`[role="option"]:has-text("${match.slice(0, 35)}")`).first().click();
    console.log(`      -> ${match}`);
  } else {
    // Just pick the first one
    await page.locator('[role="option"]').first().click();
    console.log(`      -> ${options[0]} (no keyword match for "${keyword}")`);
  }
  await page.waitForTimeout(600);
} else {
  console.log('      Topic button not found!');
}

// SEND NEED
console.log('    [SEND]');
const sendBtn = page.locator('button:has-text("Select SEND need")').first();
if (await sendBtn.isVisible({ timeout: 3000 })) {
  await sendBtn.click();
  await page.waitForTimeout(600);
  
  const sendOptions = await page.locator('[role="option"]').allTextContents();
  const sendMatch = sendOptions.find(o => o.toLowerCase().includes(config.send.toLowerCase().split(' ')[0]));
  
  if (sendMatch) {
    await page.locator(`[role="option"]:has-text("${sendMatch.slice(0, 30)}")`).first().click();
    console.log(`      -> ${sendMatch}`);
  } else {
    console.log(`      Options: ${sendOptions.slice(0, 10).join(' | ')}`);
    await page.locator('[role="option"]').first().click();
    console.log(`      -> ${sendOptions[0]} (fallback)`);
  }
  await page.waitForTimeout(600);
} else {
  console.log('      SEND button not found');
}

// DIFFICULTY - Standard should already be selected, but click it to be sure
try {
  const stdBtn = page.locator('button:has-text("Standard")').first();
  if (await stdBtn.isVisible({ timeout: 1000 })) {
    await stdBtn.click();
    await page.waitForTimeout(300);
  }
} catch(e) {}

// Take screenshot of filled form
await page.screenshot({ path: path.join(outputDir, `ws${num}-filled.png`), fullPage: true });

// ─── Check Generate Button State ─────────────────────────────────────────────
console.log('[5] Checking Generate button...');
await page.waitForTimeout(2000);

// Check all buttons with "Generate" text
const genBtns = await page.locator('button:has-text("Generate")').all();
console.log(`    Found ${genBtns.length} Generate buttons`);
for (let i = 0; i < genBtns.length; i++) {
  const btn = genBtns[i];
  const disabled = await btn.getAttribute('disabled');
  const text = (await btn.textContent()).trim().slice(0, 30);
  const box = await btn.boundingBox();
  console.log(`      [${i}] "${text}" disabled=${disabled} y=${box?.y?.toFixed(0)}`);
}

// Click the Generate button (the one in the form, not the nav)
// Usually it's the one with just "Generate" text and higher y-position
let clickedGenerate = false;
for (let i = genBtns.length - 1; i >= 0; i--) {
  const btn = genBtns[i];
  const disabled = await btn.getAttribute('disabled');
  const box = await btn.boundingBox();
  
  if (!disabled && box && box.y > 100) {
    await btn.click();
    clickedGenerate = true;
    console.log(`    Clicked Generate button [${i}]`);
    break;
  }
}

if (!clickedGenerate) {
  console.log('    All Generate buttons disabled! Trying force click...');
  // Get the last Generate button (form one)
  const lastGen = genBtns[genBtns.length - 1];
  await lastGen.click({ force: true });
  console.log('    Force-clicked last Generate button');
}

// ─── Wait for Generation ─────────────────────────────────────────────────────
console.log('[6] Waiting for AI generation...');

let outputDetected = false;
const startTime = Date.now();

for (let i = 0; i < 36; i++) { // max 180s
  await page.waitForTimeout(5000);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  
  // Check page text for worksheet content signals
  const text = await page.textContent('body');
  
  // Strong signals that worksheet has been generated
  const strongSignals = [
    text.includes('adaptly.co.uk') && text.includes('NAME'),
    text.includes('marks)') && text.includes('Question'),
    text.includes('[1]') && text.includes('[2]'),
    text.includes('Answer all questions'),
    text.includes('Show all working'),
  ].filter(Boolean).length;
  
  if (strongSignals >= 2) {
    console.log(`    ✓ Output detected after ${elapsed}s (${strongSignals} signals)`);
    outputDetected = true;
    break;
  }
  
  // Check for loading state
  if (text.includes('Generating') || text.includes('generating')) {
    if (i % 4 === 3) console.log(`    ... still generating (${elapsed}s)`);
  } else if (i > 8) {
    // Check if maybe it generated but output is in a different format
    const hasLongContent = text.length > 8000;
    if (hasLongContent) {
      console.log(`    Page has ${text.length} chars at ${elapsed}s - checking for output...`);
      // Check for any question-like patterns
      if (text.match(/\d+\.\s+[A-Z]/)) {
        console.log('    Found numbered question pattern');
        outputDetected = true;
        break;
      }
    }
    if (i > 14) {
      console.log(`    Timeout - no clear output after ${elapsed}s`);
      break;
    }
  }
}

// Let it render fully
await page.waitForTimeout(5000);

// ─── Capture Everything ──────────────────────────────────────────────────────
console.log('[7] Capturing...');

// Screenshot
await page.screenshot({ path: path.join(outputDir, `ws${num}-result.png`), fullPage: true });

// Get all text
const allText = await page.evaluate(() => document.body.innerText);
fs.writeFileSync(path.join(outputDir, `ws${num}-all.txt`), allText);

// Try to find the actual worksheet content
const wsContent = await page.evaluate(() => {
  // The worksheet content is likely in a large div with specific markers
  const allDivs = [...document.querySelectorAll('div')];
  
  // Find divs that contain worksheet-like text
  const candidates = allDivs
    .filter(d => {
      const t = d.innerText || '';
      return t.length > 500 && t.length < 50000 &&
        (t.includes('marks)') || t.includes('marks]') || t.includes('Question') || t.includes('[1]'));
    })
    .sort((a, b) => (b.innerText?.length || 0) - (a.innerText?.length || 0));
  
  if (candidates.length > 0) {
    return candidates[0].innerText;
  }
  return null;
});

if (wsContent) {
  fs.writeFileSync(path.join(outputDir, `ws${num}-content.txt`), wsContent);
  console.log(`\n    Worksheet content: ${wsContent.length} chars`);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`WORKSHEET ${num} OUTPUT`);
  console.log('='.repeat(60));
  console.log(wsContent.slice(0, 5000));
  if (wsContent.length > 5000) console.log(`\n... [${wsContent.length - 5000} more chars]`);
} else {
  console.log('\n    No worksheet-specific content found. Full page text:');
  console.log(allText.slice(0, 5000));
}

console.log(`\n=== Worksheet ${num} DONE ===`);
await browser.close();
