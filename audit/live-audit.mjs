/**
 * Live Audit — Worksheet Generator (Phases 1–5 + F)
 * Uses Playwright + Chromium to log in to adaptly.co.uk, generate worksheets,
 * and verify acceptance criteria from docs/worksheet-generator-audit.md.
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const BASE_URL = "https://adaptly.co.uk";
const LOGIN_EMAIL = "admin@adaptly.co.uk";
const LOGIN_PASSWORD = "Admin1234!";

function log(phase, criterion, pass, detail = "") {
  const icon = pass ? "\u2705" : "\u274C";
  const line = `${icon} [Phase ${phase}] ${criterion}`;
  console.log(detail ? `${line} — ${detail}` : line);
  return { phase, criterion, pass, detail };
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  // Dismiss overlays
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(btn => {
      const t = btn.textContent || '';
      if (t.includes('Accept All') || t.includes('I Accept') || t.includes('Get Started')) btn.click();
    });
  });
  await page.waitForTimeout(3000);
  
  const emailField = await page.$('input[type="email"]');
  if (emailField) {
    await emailField.fill(LOGIN_EMAIL);
    const pw = await page.$('input[type="password"]');
    if (pw) await pw.fill(LOGIN_PASSWORD);
    const btn = await page.$('button[type="submit"]');
    if (btn) await btn.click();
    await page.waitForTimeout(5000);
  }
}

async function navigateToGenerator(page) {
  await page.goto(`${BASE_URL}/worksheets`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4000);
  // Dismiss all overlays
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(btn => {
      const t = btn.textContent || '';
      if (t.includes('Accept All') || t.includes('I Accept') || t.includes('Get Started')) btn.click();
    });
  });
  await page.waitForTimeout(2000);
}

async function selectDropdown(page, triggerText, optionText) {
  // Click trigger
  await page.evaluate((txt) => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent?.includes(txt) && btn.offsetParent !== null) { btn.click(); return; }
    }
  }, triggerText);
  await page.waitForTimeout(1000);
  
  // Click option
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
  await page.waitForTimeout(500);
  return found;
}

async function generateWorksheet(page, { subject, year, topic, send, tier }) {
  // Subject
  await selectDropdown(page, "Select subject", subject);
  await page.waitForTimeout(500);
  
  // Year
  await selectDropdown(page, "Select year", year);
  await page.waitForTimeout(500);
  
  // Topic
  const topicResult = await selectDropdown(page, "Select a curriculum topic", topic);
  if (!topicResult) {
    // Try custom topic entry
    console.log(`    Topic "${topic}" not in list, trying custom entry...`);
    await selectDropdown(page, "Select a curriculum topic", "Enter custom topic");
    await page.waitForTimeout(500);
    // Fill the custom topic input
    const customInput = await page.$('input[placeholder*="topic" i], input[data-slot="input"]');
    if (customInput) {
      await customInput.fill(topic);
      await page.waitForTimeout(500);
    }
  }
  
  // SEND need
  if (send) {
    await selectDropdown(page, "Select SEND", send);
  }
  
  // Tier
  if (tier) {
    await page.evaluate((t) => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent?.trim() === t && btn.offsetParent !== null) { btn.click(); return; }
      }
    }, tier);
    await page.waitForTimeout(300);
  }
  
  // Expand Advanced Options and set exam board
  await page.evaluate(() => {
    const details = document.querySelectorAll('details, summary');
    for (const el of details) {
      if (el.textContent?.includes('Advanced') || el.textContent?.includes('exam board')) {
        if (el.tagName === 'DETAILS') el.open = true;
        else el.click();
        return;
      }
    }
  });
  await page.waitForTimeout(800);
  
  // Set exam board (it's likely an input in the advanced section, not a radix select)
  await page.evaluate(() => {
    // Look for exam board select/input in the advanced section
    const inputs = document.querySelectorAll('input, select');
    for (const inp of inputs) {
      const label = inp.closest('div')?.querySelector('label');
      if (label?.textContent?.toLowerCase().includes('exam board')) {
        if (inp.tagName === 'SELECT') {
          inp.value = 'AQA';
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (inp.tagName === 'INPUT') {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(inp, 'AQA');
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }
    }
  });
  await page.waitForTimeout(500);
  
  // Click Generate Worksheet
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent?.trim() === 'Generate Worksheet' && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  
  // Wait for generation (AI content streaming)
  console.log("    Waiting for AI generation...");
  let ready = false;
  for (let i = 0; i < 40; i++) { // 200s max
    await page.waitForTimeout(5000);
    const bodyLen = await page.evaluate(() => document.body.innerText.length);
    const hasContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return /\d+[\.\)]\s+\w/.test(text) && text.length > 5000;
    });
    if (hasContent) {
      ready = true;
      console.log(`    Generated! (~${(i + 1) * 5}s)`);
      break;
    }
    // Check for navigation to a results page
    const url = page.url();
    if (url.includes('/worksheet/') || url.includes('/result')) {
      ready = true;
      console.log(`    Navigated to result page (~${(i + 1) * 5}s)`);
      break;
    }
    if (i % 6 === 5) console.log(`    Still waiting... (${(i + 1) * 5}s, ${bodyLen} chars)`);
  }
  
  // Extra buffer for streaming to complete
  if (ready) await page.waitForTimeout(8000);
  
  return ready;
}

// ========================================================================
// MAIN
// ========================================================================
async function main() {
  const results = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // --- Login ---
  console.log("\n=== LOGGING IN ===");
  await login(page);
  console.log(`  URL: ${page.url()}`);

  // --- Navigate ---
  console.log("\n=== NAVIGATING TO GENERATOR ===");
  await navigateToGenerator(page);
  console.log(`  URL: ${page.url()}`);

  // --- Generate Worksheet 1: Bioenergetics / HI / Higher ---
  console.log("\n=== GENERATING: Science / Y10 / Bioenergetics / HI / Higher ===\n");
  const ready = await generateWorksheet(page, {
    subject: "Science",
    year: "Year 10",
    topic: "Bioenergetics",  // This covers Respiration in the AQA spec
    send: "Hearing",
    tier: "Higher"
  });
  
  await page.screenshot({ path: "/projects/sandbox/send-assistant/audit/screenshots/04-generated.png", fullPage: true });
  
  // --- Extract content ---
  console.log("\n=== EXTRACTING CONTENT ===\n");
  const fullText = await page.evaluate(() => document.body.innerText);
  writeFileSync("/projects/sandbox/send-assistant/audit/worksheet-1-hi-output.txt", fullText);
  writeFileSync("/projects/sandbox/send-assistant/audit/worksheet-1-hi-output.html", await page.content());
  console.log(`  Total text: ${fullText.length} chars`);
  
  // Find worksheet content start (after nav/sidebar)
  let wText = fullText;
  const contentStart = fullText.search(/Learning Objective|LEARNING OBJECTIVE/i);
  if (contentStart > 0 && contentStart < fullText.length / 2) {
    wText = fullText.slice(contentStart);
  }
  
  // If the worksheet didn't generate, the text will be short and just show the form
  if (wText.length < 3000 || !/\d+[\.\)]\s/.test(wText)) {
    console.log("\n  *** WORKSHEET DID NOT GENERATE SUCCESSFULLY ***");
    console.log("  The form may not have submitted. Dumping page state...\n");
    console.log(fullText.slice(0, 2000));
    
    // Try one more approach: scroll down to see if content is below fold
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    const scrolledText = await page.evaluate(() => document.body.innerText);
    if (scrolledText.length > fullText.length + 500) {
      wText = scrolledText;
      writeFileSync("/projects/sandbox/send-assistant/audit/worksheet-1-hi-output-scrolled.txt", scrolledText);
    }
  }
  
  console.log(`\n  Worksheet content: ${wText.length} chars`);
  console.log(`  Preview:\n${wText.slice(0, 800)}\n`);
  
  // ================================================================
  // RUN ACCEPTANCE CRITERIA CHECKS
  // ================================================================
  
  // --- Phase 1: Curriculum Structure ---
  console.log("\n--- PHASE 1: Curriculum Structure ---\n");
  
  const s1Match = wText.match(/Section\s*1[^\n]*\n([\s\S]*?)(?=Section\s*2)/i);
  const s2Match = wText.match(/Section\s*2[^\n]*\n([\s\S]*?)(?=Section\s*3|Challenge)/i);
  const s3Match = wText.match(/Section\s*3[^\n]*\n([\s\S]*?)(?=Challenge|Examiner|Revision|Self|Tips|$)/i);
  
  const countQs = (text) => {
    if (!text) return 0;
    const m = text.match(/(?:^|\n)\s*(?:\d+[\.\)]\s|Q\d)/gm);
    return m ? m.length : 0;
  };
  
  const s1Text = s1Match?.[1] || "";
  const s2Text = s2Match?.[1] || "";
  const s3Text = s3Match?.[1] || "";
  const s1Count = countQs(s1Text);
  const s2Count = countQs(s2Text);
  const s3Count = countQs(s3Text);
  
  results.push(log("1", "Section 1 has 6-8 Qs", s1Count >= 6 && s1Count <= 8, `${s1Count} found`));
  results.push(log("1", "Section 2 has 6-8 Qs", s2Count >= 6 && s2Count <= 8, `${s2Count} found`));
  results.push(log("1", "Section 3 has 5 Qs", s3Count === 5, `${s3Count} found`));
  results.push(log("1", "S3 numbered Q1-Q5", /Q1|1[\.\)]/m.test(s3Text) && /Q5|5[\.\)]/m.test(s3Text)));
  
  const roundMarks = /\(\d+\s*marks?\)/i.test(s3Text);
  const squareMarks = /\[\d+\s*marks?\]/i.test(s3Text);
  results.push(log("1", "Marks: (N marks) format", roundMarks && !squareMarks, squareMarks ? "[N marks] found" : roundMarks ? "OK" : "No marks"));
  
  const gcseVerbRe = /\b(State|Describe|Explain|Calculate|Evaluate|Justify|Compare|Assess|Analyse|Suggest|Discuss)\b/;
  results.push(log("1", "S3 GCSE command verbs", gcseVerbRe.test(s3Text)));
  results.push(log("1", "S3 Working out space", /working\s*out/i.test(s3Text)));
  
  // --- Phase 2: Self-Reflection ---
  console.log("\n--- PHASE 2: Self-Reflection ---\n");
  const reflMatch = wText.match(/Self\s*Reflect[ion]*[^\n]*\n([\s\S]*?)$/i);
  const reflText = reflMatch?.[1] || "";
  results.push(log("2", "Self-reflection present", /self.reflect/i.test(wText)));
  results.push(log("2", "Names topic", /bioenergetics|respiration|photosynthesis/i.test(reflText)));
  const ragItems = reflText.match(/I can[^\n]*/gi) || [];
  results.push(log("2", "RAG items distinct (3+)", new Set(ragItems.map(r=>r.toLowerCase().trim())).size >= 3, `${ragItems.length} found`));
  results.push(log("2", "Exit ticket names topic", /bioenergetics|respiration|photosynthesis/i.test(reflText.slice(-400))));
  
  // --- Phase 3: Revision/Examiner Tips ---
  console.log("\n--- PHASE 3: Revision/Examiner Tips ---\n");
  const tipMatch = wText.match(/(?:REVISION\s*TIPS|Examiner\s*Tips)[^\n]*\n([\s\S]*?)(?=Self|Reflect|$)/i);
  const tipText = tipMatch?.[1] || "";
  results.push(log("3", "Tips section present", /revision\s*tips|examiner\s*tips/i.test(wText)));
  results.push(log("3", "Lists vocabulary", /aerobic|anaerobic|glucose|mitochondria|lactic|ATP|photosynthesis/i.test(tipText)));
  results.push(log("3", "Common mistake", /mistake|misconception|confus|error/i.test(tipText)));
  results.push(log("3", "Names topic", /bioenergetics|respiration|biology/i.test(tipText)));
  results.push(log("3", "Learning objective ref", /objective|aim|learning/i.test(tipText)));
  
  // --- Phase 4: SEND (HI) ---
  console.log("\n--- PHASE 4: SEND (Hearing Impairment) ---\n");
  results.push(log("4", "Topic summary/overview", /summary|overview|context/i.test(wText.slice(0, 3000))));
  results.push(log("4", "Definitions inline", /\(=\s*[^)]+\)|definition|glossary|means/i.test(wText)));
  results.push(log("4", "No-verbal cue", /no.*verbal|write.*below|no need to share|written/i.test(wText)));
  results.push(log("4", "Word Bank", /word\s*bank|key\s*vocabulary|vocabulary/i.test(wText)));
  results.push(log("4", "Self-contained instructions", /self.contained|all\s*instructions\s*written|fully\s*written/i.test(wText)));
  
  // --- Phase 5: Curriculum Authority ---
  console.log("\n--- PHASE 5: Curriculum Authority ---\n");
  results.push(log("5", "S1 lower-demand", /\b(name|identify|state|list|define|true|false|match|circle)\b/i.test(s1Text)));
  results.push(log("5", "S2 multi-step", /\b(explain|describe|compare|suggest|discuss|analyse|calculate)\b/i.test(s2Text)));
  results.push(log("5", "S3 GCSE style", gcseVerbRe.test(s3Text)));
  results.push(log("5", "Real science content", /aerobic|anaerobic|glucose|oxygen|mitochondria|photosynthesis|respiration/i.test(wText)));
  
  // ================================================================
  // SUMMARY
  // ================================================================
  console.log("\n========================================");
  console.log("       AUDIT RESULTS SUMMARY");
  console.log("========================================\n");
  
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`  TOTAL:  ${total} criteria`);
  console.log(`  PASSED: ${passed}`);
  console.log(`  FAILED: ${total - passed}`);
  console.log(`  RATE:   ${((passed/total)*100).toFixed(1)}%\n`);
  
  if (results.some(r => !r.pass)) {
    console.log("  FAILURES:");
    results.filter(r => !r.pass).forEach(r => {
      console.log(`    \u274C [${r.phase}] ${r.criterion}${r.detail ? ` (${r.detail})` : ''}`);
    });
  }
  if (results.some(r => r.pass)) {
    console.log("\n  PASSES:");
    results.filter(r => r.pass).forEach(r => {
      console.log(`    \u2705 [${r.phase}] ${r.criterion}${r.detail ? ` (${r.detail})` : ''}`);
    });
  }
  
  writeFileSync("/projects/sandbox/send-assistant/audit/audit-results.json", JSON.stringify(results, null, 2));
  console.log("\n  Files saved:");
  console.log("    audit/audit-results.json");
  console.log("    audit/worksheet-1-hi-output.txt");
  console.log("    audit/worksheet-1-hi-output.html\n");
  
  await browser.close();
}

main().catch(e => {
  console.error("FATAL:", e.message);
  console.error(e.stack?.slice(0, 300));
  process.exit(1);
});
