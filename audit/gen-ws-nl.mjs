/**
 * Generate worksheets using the Natural Language input field.
 * This is more reliable than filling individual dropdowns.
 * 
 * Usage: node audit/gen-ws-nl.mjs <number 2-7>
 */

import { chromium } from '/projects/sandbox/send-assistant/.playwright-audit/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const WORKSHEETS = {
  2: { subject: 'Biology', year: 'Year 10', topic: 'Cell Biology', send: 'ADHD', board: 'AQA', 
       nl: 'Year 10 Biology Cell Biology AQA ADHD Standard' },
  3: { subject: 'Chemistry', year: 'Year 11', topic: 'Atomic Structure', send: 'Anxiety', board: 'AQA',
       nl: 'Year 11 Chemistry Atomic Structure AQA Anxiety Standard' },
  4: { subject: 'Physics', year: 'Year 9', topic: 'Forces and Motion', send: 'Hearing Impairment', board: 'AQA',
       nl: 'Year 9 Physics Forces and Motion AQA Hearing Impairment Standard' },
  5: { subject: 'English', year: 'Year 10', topic: 'Macbeth', send: 'MLD', board: 'AQA',
       nl: 'Year 10 English Macbeth AQA MLD Standard' },
  6: { subject: 'Mathematics', year: 'Year 11', topic: 'Histograms and Cumulative Frequency', send: 'Dyscalculia', board: 'AQA',
       nl: 'Year 11 Maths Histograms and Cumulative Frequency AQA Dyscalculia Standard' },
  7: { subject: 'Physics', year: 'Year 10', topic: 'Energy', send: 'EAL', board: 'AQA',
       nl: 'Year 10 Physics Energy AQA EAL Standard' },
};

const num = parseInt(process.argv[2], 10);
if (!num || !WORKSHEETS[num]) {
  console.error('Usage: node audit/gen-ws-nl.mjs <2-7>');
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
console.log('    Logged in. URL:', page.url());

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

// ─── Navigate to Worksheets ──────────────────────────────────────────────────
console.log('[3] Going to /worksheets...');
await page.goto('https://adaptly.co.uk/worksheets', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);

// Dismiss any modal
try {
  const btn2 = page.locator('button:has-text("I Accept")');
  if (await btn2.first().isVisible({ timeout: 3000 })) {
    await btn2.first().click();
    await page.waitForTimeout(1000);
  }
} catch(e) {}

// ─── Use Natural Language Input ──────────────────────────────────────────────
console.log('[4] Using NL input...');
const nlInput = page.locator('input[placeholder*="Year 11 Fractions"]').first();
if (await nlInput.isVisible({ timeout: 3000 })) {
  await nlInput.fill(config.nl);
  console.log(`    Typed: "${config.nl}"`);
  await page.waitForTimeout(2000);
  
  // Press Enter or click Generate
  await nlInput.press('Enter');
  await page.waitForTimeout(3000);
  
  // Check if form was auto-populated
  const bodyText = await page.textContent('body');
  console.log(`    Form contains subject "${config.subject}": ${bodyText.includes(config.subject)}`);
  console.log(`    Form contains year "${config.year}": ${bodyText.includes(config.year)}`);
} else {
  console.log('    NL input not found!');
}

// ─── Check if Generate button is enabled and click it ────────────────────────
console.log('[5] Looking for Generate button...');
await page.waitForTimeout(2000);

// Take snapshot to see form state
await page.screenshot({ path: path.join(outputDir, `ws${num}-pre-generate.png`), fullPage: true });

// Find Generate button - try enabled first, then force-click
let generated = false;
const enabledGen = page.locator('button:has-text("Generate"):not([disabled])');
const allGenBtns = await enabledGen.all();
console.log(`    Enabled Generate buttons: ${allGenBtns.length}`);

if (allGenBtns.length > 0) {
  // Click the last one (the main form one, not the nav header)
  await enabledGen.last().click();
  generated = true;
  console.log('    Clicked Generate (enabled)');
} else {
  // Button is disabled - try force click or use the GenerateGen button in header
  console.log('    Generate button disabled. Trying header GenerateGen...');
  const headerGen = page.locator('button:has-text("GenerateGen"), button:has-text("Gen")').first();
  if (await headerGen.isVisible({ timeout: 2000 })) {
    // This might open a different generate mode
    // Instead, let's try to make the form valid by selecting required fields
    console.log('    Falling back to manual form fill...');
    
    // Try to select the subject/year/topic properly via dropdowns
    // Subject
    try {
      const subBtn = page.locator(`button:has-text("Select subject"), button:has-text("${config.subject}")`).first();
      if (await subBtn.isVisible({ timeout: 1000 })) {
        if ((await subBtn.textContent()).includes('Select')) {
          await subBtn.click();
          await page.waitForTimeout(500);
          await page.locator(`[role="option"]:has-text("${config.subject}")`).first().click();
          await page.waitForTimeout(500);
        }
      }
    } catch(e) {}
    
    // Year
    try {
      const yearBtn = page.locator(`button:has-text("Select year"), button:has-text("${config.year}")`).first();
      if (await yearBtn.isVisible({ timeout: 1000 })) {
        if ((await yearBtn.textContent()).includes('Select')) {
          await yearBtn.click();
          await page.waitForTimeout(500);
          await page.locator(`[role="option"]:has-text("${config.year}")`).first().click();
          await page.waitForTimeout(500);
        }
      }
    } catch(e) {}
    
    // Topic - pick the first available one for this year
    await page.waitForTimeout(1000);
    try {
      const topicBtn = page.locator('button:has-text("Select a curriculum topic"), button:has-text("curriculum topic")').first();
      if (await topicBtn.isVisible({ timeout: 2000 })) {
        await topicBtn.click();
        await page.waitForTimeout(800);
        // Get options that match the year
        const yearNum = config.year.replace('Year ', '');
        const options = await page.locator('[role="option"]').allTextContents();
        const yearOptions = options.filter(o => o.includes(`Year ${yearNum}`) || !o.includes('Year'));
        const topicMatch = yearOptions.find(o => {
          const lower = o.toLowerCase();
          const keywords = config.topic.toLowerCase().split(' ');
          return keywords.some(k => k.length > 3 && lower.includes(k));
        }) || yearOptions[0] || options[0];
        
        console.log(`    Selecting topic: ${topicMatch}`);
        await page.locator(`[role="option"]:has-text("${topicMatch.slice(0, 30)}")`).first().click();
        await page.waitForTimeout(500);
      }
    } catch(e) { console.log('    Topic selection error:', e.message.slice(0, 100)); }
    
    // SEND
    try {
      const sendBtn = page.locator('button:has-text("Select SEND need")').first();
      if (await sendBtn.isVisible({ timeout: 1000 })) {
        await sendBtn.click();
        await page.waitForTimeout(500);
        await page.locator(`[role="option"]:has-text("${config.send}")`).first().click();
        await page.waitForTimeout(500);
      }
    } catch(e) {}
    
    await page.waitForTimeout(2000);
    
    // Try Generate again
    const genBtn2 = page.locator('button:has-text("Generate"):not([disabled])');
    if (await genBtn2.last().isVisible({ timeout: 3000 })) {
      await genBtn2.last().click();
      generated = true;
      console.log('    Clicked Generate after manual fill');
    } else {
      // Force click
      console.log('    Force-clicking disabled Generate...');
      await page.locator('button:has-text("Generate")').last().click({ force: true });
      generated = true;
    }
  }
}

if (!generated) {
  console.log('    ERROR: Could not trigger generation');
  await browser.close();
  process.exit(1);
}

// ─── Wait for generation ─────────────────────────────────────────────────────
console.log('[6] Waiting for AI generation...');

let outputReady = false;
for (let i = 0; i < 40; i++) { // max 200s
  await page.waitForTimeout(5000);
  
  const bodyText = await page.textContent('body');
  
  // Check for generation complete signals
  const signals = ['marks)', 'marks]', 'Answer all', 'Show all working', 
                   'Worksheet', 'Question 1', 'Question 2', '(1 mark', '(2 mark',
                   '1.', '2.', '3.', 'Factorise', 'Calculate', 'Explain', 'Describe',
                   'Section A', 'Section B', 'Section C', '[1]', '[2]', '[3]',
                   'NAME', 'DATE', 'CLASS'];
  
  const signalHits = signals.filter(s => bodyText.includes(s));
  
  // Also check for the worksheet preview container appearing
  const hasPreview = await page.locator('[class*="preview"], [class*="Preview"], [class*="worksheet-content"], [class*="generated"]').first().isVisible({ timeout: 500 }).catch(() => false);
  
  if (hasPreview || signalHits.length >= 5) {
    console.log(`    Generation complete after ${(i+1)*5}s (signals: ${signalHits.slice(0,5).join(', ')})`);
    outputReady = true;
    break;
  }
  
  // Check if still generating
  const isLoading = bodyText.includes('Generating') || bodyText.includes('generating') || bodyText.includes('Creating');
  if (isLoading) {
    if (i % 3 === 2) console.log(`    Still generating... ${(i+1)*5}s`);
  } else if (i > 6 && signalHits.length < 2) {
    console.log(`    No loading indicator and no output after ${(i+1)*5}s. Checking...`);
    if (i > 10) break; // Give up after 55s with no signals
  }
}

// Extra time for rendering
await page.waitForTimeout(5000);

// ─── Capture Output ──────────────────────────────────────────────────────────
console.log('[7] Capturing output...');

// Full page screenshot (top)
await page.screenshot({ path: path.join(outputDir, `ws${num}-output-top.png`), fullPage: false });

// Scroll to see more
await page.evaluate(() => window.scrollBy(0, 800));
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(outputDir, `ws${num}-output-mid.png`), fullPage: false });

// Full page
await page.screenshot({ path: path.join(outputDir, `ws${num}-output-full.png`), fullPage: true });

// Get the full page text
const fullText = await page.evaluate(() => document.body.innerText);
fs.writeFileSync(path.join(outputDir, `ws${num}-fulltext.txt`), fullText);

// Try to isolate the worksheet output specifically
const worksheetOutput = await page.evaluate(() => {
  // Look for the worksheet preview/output section
  const previewEl = document.querySelector('[class*="preview"]') || 
                    document.querySelector('[class*="Preview"]') ||
                    document.querySelector('[class*="output"]') ||
                    document.querySelector('[class*="generated"]') ||
                    document.querySelector('[class*="worksheet-display"]') ||
                    document.querySelector('[class*="WorksheetContent"]');
  
  if (previewEl) return previewEl.innerText;
  
  // Try to find by content pattern - worksheet starts with subject/year/topic header
  const allElements = document.querySelectorAll('div, section, article');
  for (const el of allElements) {
    const text = el.innerText || '';
    if (text.length > 1000 && (text.includes('marks)') || text.includes('[1]') || text.includes('Question')) &&
        (text.includes('NAME') || text.includes('Date') || text.includes('adaptly'))) {
      return text;
    }
  }
  
  return null;
});

if (worksheetOutput) {
  fs.writeFileSync(path.join(outputDir, `ws${num}-worksheet.txt`), worksheetOutput);
  console.log(`    Worksheet output: ${worksheetOutput.length} chars`);
  console.log(`\n--- WORKSHEET ${num} OUTPUT (first 3000 chars) ---`);
  console.log(worksheetOutput.slice(0, 3000));
} else {
  console.log('    Could not isolate worksheet output. Using full text.');
  console.log(`\n--- FULL PAGE TEXT (first 3000 chars) ---`);
  console.log(fullText.slice(0, 3000));
}

// Section headings
const headings = await page.evaluate(() => {
  return [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter(h => h.offsetParent !== null)
    .map(h => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 150) }));
});
fs.writeFileSync(path.join(outputDir, `ws${num}-headings.json`), JSON.stringify(headings, null, 2));
console.log(`\nHeadings: ${headings.length}`);
headings.forEach(h => console.log(`  <${h.tag}> ${h.text}`));

console.log(`\n=== Worksheet ${num} DONE ===`);
await browser.close();
