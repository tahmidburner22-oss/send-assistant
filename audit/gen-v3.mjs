import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";

const BASE = "https://adaptly.co.uk";
const EMAIL = "admin@adaptly.co.uk";
const PASS = "Admin1234!";

const TESTS = [
  { id: "R1-hi-bioenergetics", subject: "Science", year: "Year 10", topic: "Bioenergetics", send: "Hearing Impairment", tier: "Higher" },
  { id: "R2-adhd-forces", subject: "Science", year: "Year 10", topic: "Forces", send: "ADHD", tier: "Higher" },
  { id: "R3-anxiety-cell", subject: "Science", year: "Year 10", topic: "Cell Biology", send: "Anxiety", tier: "Foundation" },
  { id: "R4-mld-atomic", subject: "Science", year: "Year 10", topic: "Atomic Structure", send: "MLD", tier: "Foundation" },
  { id: "R5-dyscalc-energy", subject: "Science", year: "Year 10", topic: "Energy", send: "Dyscalculia", tier: "Higher" },
  { id: "R6-eal-electricity", subject: "Science", year: "Year 10", topic: "Electricity", send: "EAL", tier: "Foundation" },
];

async function clickDrop(page, hint, value) {
  await page.evaluate((h) => {
    const els = document.querySelectorAll('button, [role="combobox"]');
    for (const el of els) {
      const t = (el.textContent || el.getAttribute('aria-label') || '').toLowerCase();
      if (t.includes(h) && el.offsetParent) { el.click(); return; }
    }
  }, hint.toLowerCase());
  await page.waitForTimeout(1200);
  const picked = await page.evaluate((v) => {
    const items = Array.from(document.querySelectorAll('[role="option"], [data-radix-collection-item], [cmdk-item]'));
    const target = v.toLowerCase().trim();
    const text = (el) => (el.textContent || "").toLowerCase().trim();
    // IMP-15 — match precisely so "EAL" can never resolve to a different option
    // (e.g. the old fuzzy `includes` could click the first partial match).
    // Priority: exact equality → starts-with → word-boundary includes.
    let match =
      items.find((it) => text(it) === target) ||
      items.find((it) => text(it).startsWith(target)) ||
      items.find((it) => new RegExp(`(^|[^a-z])${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(text(it))) ||
      items.find((it) => text(it).includes(target));
    if (match) {
      match.scrollIntoView({ block: "center" });
      match.click();
      return match.textContent?.trim().slice(0, 50);
    }
    return null;
  }, value);
  if (!picked) await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  return picked;
}

async function run() {
  mkdirSync("/projects/sandbox/send-assistant/audit/retest-outputs", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.setDefaultTimeout(60000);

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => document.querySelectorAll('button').forEach(b => { if (/accept|got it/i.test(b.textContent||'')) b.click(); }));
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', EMAIL).catch(() => null);
  await page.fill('input[type="password"]', PASS).catch(() => null);
  await page.click('button[type="submit"]').catch(() => null);
  await page.waitForTimeout(6000);
  if (!page.url().includes('/home')) { console.log("Login failed:", page.url()); await browser.close(); process.exit(1); }
  console.log("✅ Logged in\n");

  for (const ws of TESTS) {
    console.log(`--- ${ws.id} ---`);
    try {
      await page.goto(`${BASE}/worksheets`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(4000);
      await page.evaluate(() => document.querySelectorAll('button').forEach(b => { if (/accept|got it|dismiss/i.test(b.textContent||'')) b.click(); }));
      await page.waitForTimeout(1500);

      await clickDrop(page, "subject", ws.subject);
      await clickDrop(page, "year", ws.year);
      await clickDrop(page, "topic", ws.topic);
      await clickDrop(page, "send", ws.send);
      // Tier
      await page.evaluate((t) => document.querySelectorAll('button').forEach(b => { if (b.textContent?.trim() === t && b.offsetParent) b.click(); }), ws.tier);
      await page.waitForTimeout(500);

      // Click "Generate Worksheet" specifically (NOT the hero "Generate")
      const genClicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        // Look for the specific "Generate Worksheet" button
        for (const b of btns) {
          const t = (b.textContent || '').trim();
          if (t === 'Generate Worksheet' && b.offsetParent && !b.disabled) { b.click(); return 'Generate Worksheet'; }
        }
        // Fallback: button containing "Generate Worksheet"
        for (const b of btns) {
          if (/Generate Worksheet/i.test(b.textContent||'') && b.offsetParent && !b.disabled) { b.click(); return b.textContent?.trim(); }
        }
        return null;
      });
      console.log(`  Clicked: ${genClicked}`);
      if (!genClicked) { console.log("  ⚠️ No Generate Worksheet button found"); continue; }

      // Wait for generation — look for worksheet content markers
      let ready = false;
      for (let i = 0; i < 40; i++) {
        await page.waitForTimeout(5000);
        const st = await page.evaluate(() => {
          const t = document.body.innerText;
          return {
            len: t.length,
            hasSec: /SECTION\s*[123]|RECALL|UNDERSTANDING|APPLICATION|Section 1|Section 2|Section 3/i.test(t),
            hasMarks: /\[\d+\s*marks?\]|\(\d+\s*marks?\)/i.test(t),
            hasLO: /by the end of this lesson/i.test(t),
            generating: /generating|please wait|writing questions|finishing up/i.test(t),
            url: location.href
          };
        });
        if (st.hasSec && st.hasMarks && st.len > 5000) { ready = true; await page.waitForTimeout(8000); break; }
        if (st.url.includes('/worksheet/') && st.len > 5000) { ready = true; await page.waitForTimeout(8000); break; }
        if (st.hasLO && st.hasSec && st.len > 5000) { ready = true; await page.waitForTimeout(8000); break; }
        if (i % 4 === 3) console.log(`  ... ${(i+1)*5}s (${st.len}c, sec=${st.hasSec}, marks=${st.hasMarks}, gen=${st.generating})`);
      }

      const text = await page.evaluate(() => document.body.innerText);
      writeFileSync(`/projects/sandbox/send-assistant/audit/retest-outputs/${ws.id}.txt`, text);
      console.log(`  ${ready ? '✅' : '⚠️'} ${text.length} chars`);
    } catch (e) {
      console.log(`  ❌ ${e.message.slice(0,100)}`);
    }
  }
  await browser.close();
  console.log("\n=== COMPLETE ===");
}

run().catch(e => { console.error(e); process.exit(1); });
