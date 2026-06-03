/**
 * Generate worksheets v4 - fixed: select Tier (Mixed) and click correct Generate button.
 * 
 * Usage: node audit/gen-ws-v4.mjs <number 2-7>
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
  console.error('Usage: node audit/gen-ws-v4.mjs <2-7>');
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
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    await page.goto('https://adaptly.co.uk/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill('admin@adaptly.co.uk');
    await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(6000);
    console.log('    URL:', page.url());
    break;
  } catch(e) {
    console.log(`    Login attempt ${attempt+1} failed: ${e.message.slice(0, 80)}`);
    if (attempt === 2) throw e;
    await page.waitForTimeout(3000);
  }
}

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

// ─── Fill Form ───────────────────────────────────────────────────────────────
console.log('[4] Filling form...');

// SUBJECT
await page.locator('button:has-text("Select subject")').first().click();
await page.waitForTimeout(600);
await page.locator(`[role="option"]:has-text("${config.subject}")`).first().click();
await page.waitForTimeout(600);
console.log(`    Subject: ${config.subject}`);

// YEAR
await page.locator('button:has-text("Select year")').first().click();
await page.waitForTimeout(600);
await page.locator(`[role="option"]:has-text("${config.year}")`).first().click();
await page.waitForTimeout(800);
console.log(`    Year: ${config.year}`);

// TOPIC
const topicBtn = page.locator('button:has-text("Select a curriculum topic")').first();
if (await topicBtn.isVisible({ timeout: 3000 })) {
  await topicBtn.click();
  await page.waitForTimeout(800);
  const options = await page.locator('[role="option"]').allTextContents();
  const keyword = config.topic.toLowerCase();
  const match = options.find(o => o.toLowerCase().includes(keyword)) || options[0];
  await page.locator(`[role="option"]:has-text("${match.slice(0, 35)}")`).first().click();
  await page.waitForTimeout(600);
  console.log(`    Topic: ${match}`);
}

// SEND NEED
const sendBtn = page.locator('button:has-text("Select SEND need")').first();
if (await sendBtn.isVisible({ timeout: 3000 })) {
  await sendBtn.click();
  await page.waitForTimeout(600);
  const sendOptions = await page.locator('[role="option"]').allTextContents();
  const sendMatch = sendOptions.find(o => o.toLowerCase().includes(config.send.toLowerCase().split(' ')[0])) || sendOptions[0];
  await page.locator(`[role="option"]:has-text("${sendMatch.slice(0, 25)}")`).first().click();
  await page.waitForTimeout(600);
  console.log(`    SEND: ${sendMatch}`);
}

// TIER / DIFFICULTY - Click "Mixed" (the middle option)
console.log('    [Tier]');
try {
  const mixedBtn = page.locator('button:has-text("Mixed")').first();
  if (await mixedBtn.isVisible({ timeout: 2000 })) {
    await mixedBtn.click();
    await page.waitForTimeout(400);
    console.log('      -> Mixed');
  } else {
    // Try Foundation or Standard
    const foundBtn = page.locator('button:has-text("Foundation")').first();
    if (await foundBtn.isVisible({ timeout: 1000 })) {
      await foundBtn.click();
      console.log('      -> Foundation');
    }
  }
} catch(e) { console.log('      Tier selection skipped'); }

await page.waitForTimeout(1000);

// ─── Check form state and Generate button ────────────────────────────────────
console.log('[5] Checking Generate button state...');

// Capture form state for debugging
const formState = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const generateBtns = btns.filter(b => b.textContent.includes('Generate'));
  return generateBtns.map(b => ({
    text: b.textContent.trim().slice(0, 40),
    disabled: b.disabled || b.hasAttribute('disabled'),
    rect: b.getBoundingClientRect()
  }));
});
console.log('    Generate buttons:', JSON.stringify(formState, null, 2));

// The main "Generate" button for worksheets should be the one labeled just "Generate" 
// or "Generate Worksheet" - NOT "GenerateGen" (header) and NOT "Generate Diagnostic"
// From the output: [1] "Generate" at y=391 is the one we want

// Try clicking the "Generate Worksheet" button (index 2 from before at y=2692)
const wsGenBtn = page.locator('button:has-text("Generate Worksheet")').first();
if (await wsGenBtn.isVisible({ timeout: 2000 })) {
  const isDisabled = await wsGenBtn.isDisabled();
  console.log(`    "Generate Worksheet" button disabled: ${isDisabled}`);
  if (!isDisabled) {
    await wsGenBtn.click();
    console.log('    ✓ Clicked "Generate Worksheet"');
  } else {
    // Force click
    await wsGenBtn.click({ force: true });
    console.log('    ✓ Force-clicked "Generate Worksheet"');
  }
} else {
  // Try the main "Generate" button with force
  const mainGen = page.locator('button:has-text("Generate")').nth(1);
  await mainGen.click({ force: true });
  console.log('    ✓ Force-clicked Generate[1]');
}

// ─── Wait for Generation ─────────────────────────────────────────────────────
console.log('[6] Waiting for AI generation...');
const startTime = Date.now();

let outputDetected = false;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(5000);
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  
  const text = await page.textContent('body');
  
  // Detect worksheet output
  const hasMarks = (text.match(/\(\d+ marks?\)/g) || []).length;
  const hasQuestions = (text.match(/^\d+\./gm) || []).length;
  const hasNAME = text.includes('NAME') && text.includes('DATE');
  const hasSections = text.includes('[1]') || text.includes('[2]') || text.includes('Section A') || text.includes('Section 1');
  
  if (hasMarks >= 2 || (hasQuestions >= 3 && (hasNAME || hasSections))) {
    console.log(`    ✓ Worksheet generated! (${elapsed}s) marks=${hasMarks} questions=${hasQuestions}`);
    outputDetected = true;
    break;
  }
  
  // Check for error messages
  if (text.includes('Error') && text.includes('generat')) {
    console.log(`    ✗ Error detected at ${elapsed}s`);
    break;
  }
  
  if (elapsed % 20 === 0 && elapsed > 0) {
    console.log(`    ... waiting (${elapsed}s)`);
  }
}

await page.waitForTimeout(5000); // Let rendering finish

// ─── Capture ─────────────────────────────────────────────────────────────────
console.log('[7] Capturing output...');
await page.screenshot({ path: path.join(outputDir, `ws${num}-final.png`), fullPage: true });

const allText = await page.evaluate(() => document.body.innerText);
fs.writeFileSync(path.join(outputDir, `ws${num}-full.txt`), allText);

// Extract worksheet content (look for the preview pane)
const wsContent = await page.evaluate(() => {
  // Find the worksheet preview/output area
  const allDivs = [...document.querySelectorAll('div, section, article')];
  
  // Look for a container with worksheet markers
  for (const div of allDivs) {
    const t = div.innerText || '';
    if (t.length > 800 && t.length < 40000) {
      const markers = ['marks)', 'marks]', 'NAME', 'DATE', 'adaptly', 'Question', '[1]', '[2]'];
      const hits = markers.filter(m => t.includes(m)).length;
      if (hits >= 3) {
        return t;
      }
    }
  }
  
  // If no clear worksheet container, check if the page just shows the form (no generation happened)
  return null;
});

if (wsContent) {
  fs.writeFileSync(path.join(outputDir, `ws${num}-worksheet.txt`), wsContent);
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  WORKSHEET ${num} — ${config.subject} / ${config.year} / ${config.topic} / ${config.send}`);
  console.log('═'.repeat(70));
  console.log(wsContent);
  console.log('═'.repeat(70));
} else {
  console.log('\n    ✗ No worksheet output detected. The form may not have submitted.');
  console.log('    Page text (first 2000 chars):');
  console.log(allText.slice(0, 2000));
}

console.log(`\n=== Worksheet ${num} capture complete ===`);
await browser.close();
