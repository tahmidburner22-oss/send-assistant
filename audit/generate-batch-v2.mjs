/**
 * Batch worksheet generation v2 — 5 worksheets with VARIED combinations
 * of SEND needs, subjects, reading ages, topics, sections, tiers.
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const BASE_URL = "https://adaptly.co.uk";
const LOGIN_EMAIL = "admin@adaptly.co.uk";
const LOGIN_PASSWORD = "Admin1234!";

const WORKSHEETS = [
  {
    id: "2-adhd-maths",
    subject: "Maths",
    year: "Year 10",
    topic: "Quadratic equations and factorising",
    send: "ADHD",
    tier: "Higher",
    readingAge: null,
    notes: "Tests: ADHD brain-break, tick-boxes, maths subject, Higher tier"
  },
  {
    id: "3-anxiety-english",
    subject: "English",
    year: "Year 9",
    topic: "Persuasive writing techniques",
    send: "Anxiety",
    tier: "Foundation",
    readingAge: "KS3",
    notes: "Tests: Anxiety invitational language, English, KS3 reading age, Foundation, Y9"
  },
  {
    id: "4-mld-chemistry",
    subject: "Science",
    year: "Year 10",
    topic: "Atomic Structure and the Periodic Table",
    send: "MLD",
    tier: "Foundation",
    readingAge: "KS2",
    notes: "Tests: MLD context blocks, formula refs, Chemistry curriculum topic, low reading age"
  },
  {
    id: "5-dyscalculia-energy",
    subject: "Science",
    year: "Year 10",
    topic: "Energy",
    send: "Dyscalculia",
    tier: "Higher",
    readingAge: null,
    notes: "Tests: Dyscalculia 5-step recipe on calc Qs only, Energy topic"
  },
  {
    id: "6-eal-electricity",
    subject: "Science",
    year: "Year 10",
    topic: "Electricity",
    send: "EAL",
    tier: "Mixed",
    readingAge: "KS2",
    notes: "Tests: EAL inline glossary, bilingual support, low reading age, Mixed tier"
  },
];

async function dismissOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(btn => {
      const t = btn.textContent || '';
      if (t.includes('Accept All') || t.includes('I Accept') || t.includes('Get Started')) btn.click();
    });
  });
  await page.waitForTimeout(1500);
}

async function selectDropdown(page, triggerText, optionText) {
  await page.evaluate((txt) => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent?.includes(txt) && btn.offsetParent !== null) { btn.click(); return; }
    }
  }, triggerText);
  await page.waitForTimeout(1200);

  const found = await page.evaluate((opt) => {
    const items = document.querySelectorAll('[role="option"], [data-radix-collection-item]');
    for (const item of items) {
      if (item.textContent?.toLowerCase().includes(opt.toLowerCase())) {
        item.click();
        return item.textContent?.trim();
      }
    }
    return null;
  }, optionText);

  if (!found) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(600);
  return found;
}

async function ensureLoggedIn(page) {
  // Check current state
  const url = page.url();
  if (url.includes('/home') || url.includes('/worksheets') || url.includes('/dashboard')) {
    return true;
  }
  
  // Go to login
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  await dismissOverlays(page);
  await page.waitForTimeout(2000);
  
  const emailField = await page.$('input[type="email"]');
  if (!emailField) {
    // Check if already redirected
    if (page.url().includes('/home')) return true;
    return false;
  }
  
  await emailField.fill(LOGIN_EMAIL);
  const pw = await page.$('input[type="password"]');
  if (pw) await pw.fill(LOGIN_PASSWORD);
  const btn = await page.$('button[type="submit"]');
  if (btn) await btn.click();
  await page.waitForTimeout(5000);
  
  return page.url().includes('/home') || page.url().includes('/worksheets');
}

async function generateOne(page, ws) {
  // Navigate fresh to generator
  await page.goto(`${BASE_URL}/worksheets`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);
  await dismissOverlays(page);
  await page.waitForTimeout(2000);
  await dismissOverlays(page);
  await page.waitForTimeout(1000);

  // Verify we're on the generator (not redirected to login)
  if (page.url().includes('/login')) {
    console.log("    Session expired, re-logging in...");
    await ensureLoggedIn(page);
    await page.goto(`${BASE_URL}/worksheets`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);
  }

  // Subject
  const subResult = await selectDropdown(page, "Select subject", ws.subject);
  console.log(`    Subject: ${subResult || 'FAILED'}`);

  // Year
  const yearResult = await selectDropdown(page, "Select year", ws.year);
  console.log(`    Year: ${yearResult || 'FAILED'}`);

  // Topic: try curriculum list first, fallback to custom
  let topicResult = await selectDropdown(page, "Select a curriculum topic", ws.topic);
  if (!topicResult) {
    // Try custom topic entry
    await selectDropdown(page, "curriculum topic", "Enter custom");
    await page.waitForTimeout(800);
    // Find and fill the custom topic input that appears
    await page.evaluate((topic) => {
      const inputs = document.querySelectorAll('input[type="text"]');
      for (const inp of inputs) {
        if (inp.placeholder?.toLowerCase().includes('topic') || 
            inp.closest('[class*="topic"]') ||
            inp.getAttribute('aria-label')?.toLowerCase().includes('topic')) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inp, topic);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      // Fallback: fill the last visible text input
      const visibleInputs = Array.from(inputs).filter(i => i.offsetParent !== null && !i.value);
      if (visibleInputs.length > 0) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(visibleInputs[0], topic);
        visibleInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        visibleInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, ws.topic);
    topicResult = `custom: ${ws.topic}`;
  }
  console.log(`    Topic: ${topicResult}`);

  // SEND
  const sendResult = await selectDropdown(page, "Select SEND", ws.send);
  console.log(`    SEND: ${sendResult || 'FAILED'}`);

  // Tier
  await page.evaluate((t) => {
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent?.trim() === t && btn.offsetParent !== null) btn.click();
    });
  }, ws.tier);
  console.log(`    Tier: ${ws.tier}`);

  // Reading Age
  if (ws.readingAge) {
    await page.evaluate((lvl) => {
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent?.trim() === lvl && btn.offsetParent !== null) btn.click();
      });
    }, ws.readingAge);
    console.log(`    Reading Age: ${ws.readingAge}`);
  }

  await page.waitForTimeout(500);

  // Click Generate Worksheet
  const genClicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent?.trim() === 'Generate Worksheet' && btn.offsetParent !== null) {
        btn.click(); return true;
      }
    }
    return false;
  });
  console.log(`    Generate: ${genClicked}`);

  // Wait for generation
  let ready = false;
  for (let i = 0; i < 36; i++) {
    await page.waitForTimeout(5000);
    const state = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        len: text.length,
        hasQs: /\d+[\.\)]\s+\w/.test(text) && text.length > 5000,
        url: window.location.href
      };
    });
    if (state.hasQs) { ready = true; break; }
    if (state.url.includes('/worksheet/')) { ready = true; break; }
    if (i % 4 === 3) console.log(`    Waiting... (${(i+1)*5}s, ${state.len} chars)`);
  }
  if (ready) await page.waitForTimeout(8000);
  return ready;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  // Login
  console.log("=== LOGGING IN ===");
  const loggedIn = await ensureLoggedIn(page);
  console.log(`  Login: ${loggedIn ? '✅' : '❌'} (${page.url()})\n`);
  
  if (!loggedIn) {
    console.error("FATAL: Could not log in");
    await browser.close();
    process.exit(1);
  }

  const summaries = [];

  for (const ws of WORKSHEETS) {
    console.log(`\n=== [${ws.id}] ===`);
    console.log(`  ${ws.notes}`);
    
    try {
      const ready = await generateOne(page, ws);
      const fullText = await page.evaluate(() => document.body.innerText);
      const outPath = `/projects/sandbox/send-assistant/audit/worksheet-${ws.id}-output.txt`;
      writeFileSync(outPath, fullText);
      
      await page.screenshot({
        path: `/projects/sandbox/send-assistant/audit/screenshots/ws-${ws.id}.png`,
        fullPage: true
      });
      
      const status = ready ? '✅' : '⚠️';
      console.log(`  ${status} ${fullText.length} chars saved`);
      summaries.push({ id: ws.id, ready, chars: fullText.length, settings: ws });
    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}`);
      summaries.push({ id: ws.id, ready: false, chars: 0, error: err.message, settings: ws });
    }
  }

  writeFileSync("/projects/sandbox/send-assistant/audit/batch-summary.json", JSON.stringify(summaries, null, 2));
  console.log("\n\n=== BATCH COMPLETE ===");
  console.log(summaries.map(s => `  ${s.ready ? '✅' : '⚠️'} ${s.id}: ${s.chars} chars`).join('\n'));
  
  await browser.close();
}

main().catch(e => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
