/**
 * After selecting subject and year, explore the topic input
 */
import { chromium } from '/projects/sandbox/send-assistant/.playwright-audit/node_modules/playwright/index.mjs';
import fs from 'fs';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
});
const context = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
const page = await context.newPage();

// Login
await page.goto('https://adaptly.co.uk/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await page.fill('input[type="email"], input[name="email"]', 'admin@adaptly.co.uk');
await page.fill('input[type="password"], input[name="password"]', 'Admin1234!');
await page.click('button[type="submit"]');
await page.waitForTimeout(6000);

// SEND Hub + dismiss modal
await page.goto('https://adaptly.co.uk/send-hub', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
try {
  const btn = page.locator('button:has-text("I Accept")');
  if (await btn.isVisible({ timeout: 5000 })) { await btn.click(); await page.waitForTimeout(2000); }
} catch(e) {}

// Navigate to worksheets
await page.goto('https://adaptly.co.uk/worksheets', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);

// Dismiss worksheet modal
try {
  const btn2 = page.locator('button:has-text("I Accept")');
  if (await btn2.first().isVisible({ timeout: 3000 })) { await btn2.first().click(); await page.waitForTimeout(1000); }
} catch(e) {}

// Select subject: Biology
const subTrigger = page.locator('button:has-text("Select subject")').first();
await subTrigger.click();
await page.waitForTimeout(800);
await page.locator('[role="option"]:has-text("Biology")').first().click();
await page.waitForTimeout(500);

// Select year: Year 10
const yearTrigger = page.locator('button:has-text("Select year")').first();
await yearTrigger.click();
await page.waitForTimeout(800);
await page.locator('[role="option"]:has-text("Year 10")').first().click();
await page.waitForTimeout(1000);

// Now explore all text inputs
console.log('\n--- After selecting Biology + Year 10 ---');
const textInputs = await page.locator('input[type="text"], input:not([type])').all();
console.log(`Text inputs found: ${textInputs.length}`);
for (let i = 0; i < textInputs.length; i++) {
  const inp = textInputs[i];
  const placeholder = await inp.getAttribute('placeholder') || '';
  const value = await inp.inputValue();
  const isVisible = await inp.isVisible();
  console.log(`  [${i}] visible=${isVisible} placeholder="${placeholder}" value="${value}"`);
}

// Check for the topic combobox/search input specifically
const topicArea = page.locator('label:has-text("Topic")');
console.log('\nTopic label visible:', await topicArea.isVisible({ timeout: 1000 }).catch(() => false));

// Check what's near the Topic label
const topicParent = topicArea.locator('..');
const nearbyInputs = await topicParent.locator('input, button, [role="combobox"]').all();
console.log(`Elements near Topic label: ${nearbyInputs.length}`);
for (let i = 0; i < nearbyInputs.length; i++) {
  const el = nearbyInputs[i];
  const tag = await el.evaluate(e => e.tagName);
  const text = await el.textContent().catch(() => '');
  const placeholder = await el.getAttribute('placeholder').catch(() => '');
  console.log(`  [${i}] <${tag}> text="${text?.slice(0,50)}" placeholder="${placeholder}"`);
}

// Try broader search - the first input on the page is the NL input, second should be topic
const allInputsVisible = await page.locator('input[type="text"]:visible, input:not([type]):visible').all();
console.log(`\nAll visible text inputs: ${allInputsVisible.length}`);
for (let i = 0; i < allInputsVisible.length; i++) {
  const inp = allInputsVisible[i];
  const placeholder = await inp.getAttribute('placeholder') || '';
  const name = await inp.getAttribute('name') || '';
  console.log(`  [${i}] placeholder="${placeholder}" name="${name}"`);
}

fs.mkdirSync('audit/captures', { recursive: true });
await page.screenshot({ path: 'audit/captures/topic-input-state.png', fullPage: true });

await browser.close();
