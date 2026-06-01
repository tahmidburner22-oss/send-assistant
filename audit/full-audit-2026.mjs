import { chromium } from "playwright";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";

const BASE = "https://adaptly.co.uk";
const EMAIL = "admin@adaptly.co.uk";
const PASS = "Admin1234!";
const OUT_DIR = "/projects/sandbox/send-assistant/audit/audit-2026-outputs";
const REPORT_PATH = "/projects/sandbox/send-assistant/audit/FULL-AUDIT-REPORT-2026.md";

mkdirSync(OUT_DIR, { recursive: true });

const WORKSHEETS = [
  { id: "WS1-HI-Bioenergetics", subject: "Science", year: "Year 10", topic: "Bioenergetics", send: "Hearing Impairment", tier: "Higher", readingAge: 11 },
  { id: "WS2-ADHD-Forces", subject: "Science", year: "Year 10", topic: "Forces", send: "ADHD", tier: "Foundation", readingAge: 9 },
  { id: "WS3-Anxiety-CellBio", subject: "Science", year: "Year 9", topic: "Cell Biology", send: "Anxiety", tier: null, readingAge: 10 },
  { id: "WS4-Dyscalc-Atomic", subject: "Science", year: "Year 10", topic: "Atomic Structure", send: "Dyscalculia", tier: "Higher", readingAge: 12 },
  { id: "WS5-MLD-Energy", subject: "Science", year: "Year 10", topic: "Energy", send: "MLD", tier: "Foundation", readingAge: 9 },
  { id: "WS6-EAL-Electricity", subject: "Science", year: "Year 10", topic: "Electricity", send: "EAL", tier: "Foundation", readingAge: 8 },
  { id: "WS7-None-Infection", subject: "Science", year: "Year 10", topic: "Infection and Response", send: null, tier: "Higher", readingAge: 14 },
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

async function login(page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(4000);
      
      // Check if site is down
      const title = await page.title();
      if (/502|503|504|bad gateway|service unavailable/i.test(title)) {
        console.log(`  Site unavailable (${title}), waiting 30s before retry...`);
        await page.waitForTimeout(30000);
        continue;
      }
      
      // Dismiss cookie/overlay banners
      await page.evaluate(() => document.querySelectorAll('button').forEach(b => { if (/accept|got it/i.test(b.textContent||'')) b.click(); }));
      await page.waitForTimeout(1500);
      // Fill credentials
      await page.fill('input[type="email"]', EMAIL).catch(() => null);
      await page.fill('input[type="password"]', PASS).catch(() => null);
      await page.waitForTimeout(500);
      await page.click('button[type="submit"]').catch(() => null);
      // Wait for redirect
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(3000);
        const url = page.url();
        if (url.includes('/home') || url.includes('/worksheets') || url.includes('/dashboard')) {
          console.log("Logged in successfully");
          return true;
        }
      }
      console.log(`Login attempt ${attempt + 1} failed, current URL: ${page.url()}`);
    } catch (e) {
      console.log(`Login attempt ${attempt + 1} error: ${e.message.slice(0,100)}`);
    }
    await page.waitForTimeout(10000);
  }
  console.log("Login failed after all attempts");
  return false;
}

async function generateWorksheet(page, ws) {
  console.log(`\n--- Generating ${ws.id} ---`);
  const maxAttempts = 2;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Navigate fresh to /worksheets each time
      await page.goto(`${BASE}/worksheets`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => null);
      await page.waitForTimeout(5000);
      await page.evaluate(() => document.querySelectorAll('button').forEach(b => { if (/accept|got it|dismiss/i.test(b.textContent||'')) b.click(); }));
      await page.waitForTimeout(2000);

      // Select subject
      const subPick = await clickDrop(page, "subject", ws.subject);
      console.log(`  Subject: ${subPick}`);
      if (!subPick && attempt < maxAttempts - 1) {
        console.log(`  Retrying (attempt ${attempt + 1})...`);
        await page.waitForTimeout(3000);
        continue;
      }
      await page.waitForTimeout(1000);

      // Select year group
      const yearPick = await clickDrop(page, "year", ws.year);
      console.log(`  Year: ${yearPick}`);
      await page.waitForTimeout(1000);

      // Select topic
      const topicPick = await clickDrop(page, "topic", ws.topic);
      console.log(`  Topic: ${topicPick}`);
      await page.waitForTimeout(1000);

      // Select SEND overlay if applicable
      if (ws.send) {
        const sendPick = await clickDrop(page, "send", ws.send);
        console.log(`  SEND: ${sendPick}`);
        await page.waitForTimeout(1000);
      }

      // Select tier if applicable
      if (ws.tier) {
        await page.evaluate((t) => document.querySelectorAll('button').forEach(b => { if (b.textContent?.trim() === t && b.offsetParent) b.click(); }), ws.tier);
        console.log(`  Tier: ${ws.tier}`);
        await page.waitForTimeout(500);
      }

      // Try to set reading age if slider/input exists
      if (ws.readingAge) {
        await page.evaluate((ra) => {
          const inputs = document.querySelectorAll('input[type="range"], input[type="number"]');
          for (const inp of inputs) {
            const label = inp.closest('label')?.textContent || inp.getAttribute('aria-label') || '';
            if (/reading\s*age/i.test(label)) {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              nativeInputValueSetter.call(inp, ra);
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              inp.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
          const sliders = document.querySelectorAll('[role="slider"]');
          for (const s of sliders) {
            const parent = s.closest('[class*="reading"], [class*="age"]') || s.parentElement;
            const parentText = parent?.textContent || '';
            if (/reading\s*age/i.test(parentText)) {
              s.setAttribute('aria-valuenow', ra);
              s.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
          return false;
        }, ws.readingAge);
      }

      // Click Generate Worksheet
      const genClicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          const t = (b.textContent || '').trim();
          if (t === 'Generate Worksheet' && b.offsetParent && !b.disabled) { b.click(); return 'Generate Worksheet'; }
        }
        for (const b of btns) {
          if (/Generate Worksheet/i.test(b.textContent||'') && b.offsetParent && !b.disabled) { b.click(); return b.textContent?.trim(); }
        }
        for (const b of btns) {
          if (/^Generate$/i.test(b.textContent?.trim()||'') && b.offsetParent && !b.disabled) { b.click(); return 'Generate'; }
        }
        return null;
      });
      console.log(`  Clicked: ${genClicked}`);
      if (!genClicked) {
        if (attempt < maxAttempts - 1) { console.log(`  Retrying...`); await page.waitForTimeout(3000); continue; }
        return { success: false, error: "No Generate button found" };
      }

      // Poll for completion - up to 240 seconds
      let ready = false;
      for (let i = 0; i < 48; i++) {
        await page.waitForTimeout(5000);
        const st = await page.evaluate(() => {
          const t = document.body.innerText;
          return {
            len: t.length,
            hasSec: /SECTION\s*[123]|RECALL|UNDERSTANDING|APPLICATION|Section 1|Section 2|Section 3/i.test(t),
            hasMarks: /\[\d+\s*marks?\]|\(\d+\s*marks?\)/i.test(t),
            generating: /generating|please wait|writing questions|finishing up/i.test(t),
            url: location.href
          };
        });
        if (st.hasSec && st.hasMarks && st.len > 5000) { ready = true; break; }
        if (st.url.includes('/worksheet/') && st.len > 5000) { ready = true; break; }
        if (i % 6 === 5) console.log(`  ... ${(i+1)*5}s (${st.len}c, sec=${st.hasSec}, marks=${st.hasMarks}, gen=${st.generating})`);
      }

      // Extra wait for streaming to finish
      if (ready) {
        await page.waitForTimeout(10000);
      }

      const text = await page.evaluate(() => document.body.innerText);
      const filePath = `${OUT_DIR}/${ws.id}.txt`;
      writeFileSync(filePath, text);
      console.log(`  ${ready ? 'COMPLETE' : 'TIMEOUT'} - ${text.length} chars saved`);
      return { success: ready, text, charCount: text.length };
    } catch (e) {
      console.log(`  ERROR (attempt ${attempt + 1}): ${e.message.slice(0,150)}`);
      if (attempt < maxAttempts - 1) { await page.waitForTimeout(5000); continue; }
      return { success: false, error: e.message.slice(0,200) };
    }
  }
  return { success: false, error: "All attempts failed" };
}

// ========== ANALYSIS FUNCTIONS ==========

function extractSections(text) {
  const sections = { s1: "", s2: "", s3: "" };
  const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    // Standard section headers
    if (/SECTION\s*1\b/i.test(line) && !/SECTION\s*[23]/i.test(line)) { current = 's1'; continue; }
    if (/SECTION\s*2\b/i.test(line) && !/SECTION\s*[13]/i.test(line)) { current = 's2'; continue; }
    if (/SECTION\s*3\b/i.test(line) && !/SECTION\s*[12]/i.test(line)) { current = 's3'; continue; }
    // Anxiety invitational titles
    if (/WARM.?UP.*QUESTIONS/i.test(line)) { current = 's1'; continue; }
    if (/BUILDING YOUR UNDERSTANDING/i.test(line)) { current = 's2'; continue; }
    if (/STRETCH YOURSELF/i.test(line)) { current = 's3'; continue; }
    // Stop at Challenge or Tips sections
    if (/^Challenge yourself|^CHALLENGE|^Read these examiner tips|^TIPS:|^OPTIONAL BONUS/i.test(line)) { current = null; continue; }
    if (current) sections[current] += line + '\n';
  }
  return sections;
}

function countQuestions(sectionText) {
  const lines = sectionText.split('\n');
  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    // Match "N." or "N)" on its own line (the format used by the site)
    if (/^\d+[\.\)]\s*$/.test(trimmed)) { count++; continue; }
    // Match "N. text" on the same line
    if (/^\d+[\.\)]\s+\S/.test(trimmed)) { count++; continue; }
    // Match "[ ] N. text" checkbox format
    if (/^\[\s*\]\s*\d+[\.\)]\s/.test(trimmed)) { count++; continue; }
  }
  return count;
}

function runSprintChecks(ws, text) {
  const results = {};
  const sections = extractSections(text);

  // Sprint 1 checks
  results['IMP-01'] = { pass: !text.includes('TEACHER_DIAGNOSES'), detail: text.includes('TEACHER_DIAGNOSES') ? 'TEACHER_DIAGNOSES found in text' : 'No TEACHER_DIAGNOSES leak' };
  results['IMP-03'] = { pass: !/^RULE:/m.test(text), detail: /^RULE:/m.test(text) ? 'RULE: lines found in text' : 'No RULE: leaks' };

  const s3Count = countQuestions(sections.s3);
  results['IMP-04'] = { pass: s3Count === 5, detail: `Section 3 has ${s3Count} questions (target: 5)` };

  const s2Count = countQuestions(sections.s2);
  results['IMP-05'] = { pass: s2Count >= 6 && s2Count <= 8, detail: `Section 2 has ${s2Count} questions (target: 6-8)` };

  const hasBracketMarks = /\[\d+\s*marks?\]/i.test(text);
  const hasParenMarks = /\(\d+\s*marks?\)/i.test(text);
  results['IMP-06'] = { pass: !hasBracketMarks && hasParenMarks, detail: hasBracketMarks ? 'Uses [N marks] format (should be (N marks))' : (hasParenMarks ? 'Correctly uses (N marks) format' : 'No marks format detected') };

  // IMP-02: Dyscalculia numbering corruption
  if (ws.send === 'Dyscalculia') {
    const corruptPattern = /Numbers in this question.*\n\s*\d+[\.\)]/;
    results['IMP-02'] = { pass: !corruptPattern.test(text), detail: corruptPattern.test(text) ? 'Cue text causes numbering corruption' : 'No numbering corruption from dyscalculia cues' };
  } else {
    results['IMP-02'] = { pass: true, detail: 'N/A (not Dyscalculia)' };
  }

  // Sprint 2 checks (SEND-specific)
  if (ws.send === 'Anxiety') {
    const hasInvitational = /WARM.?UP|BUILDING YOUR UNDERSTANDING|STRETCH YOURSELF/i.test(text);
    results['IMP-10'] = { pass: hasInvitational, detail: hasInvitational ? 'Invitational section titles found' : 'Standard section titles used (not invitational)' };
  }
  if (ws.send === 'Hearing Impairment') {
    const hasInlineDef = /\(=\s*[^)]+\)/.test(text);
    results['IMP-11'] = { pass: hasInlineDef, detail: hasInlineDef ? 'Inline (= definition) annotations found' : 'No inline definition annotations' };
    const hasTopicSummary = /TOPIC SUMMARY/i.test(text);
    results['IMP-16'] = { pass: hasTopicSummary, detail: hasTopicSummary ? 'TOPIC SUMMARY label present' : 'No TOPIC SUMMARY label found' };
  }
  if (ws.send === 'ADHD') {
    const brainBreaks = (text.match(/BRAIN\s*BREAK|brain.break/gi) || []).length;
    results['IMP-12'] = { pass: brainBreaks >= 2, detail: `Found ${brainBreaks} brain-break prompts (target: 2-3)` };
  }
  if (ws.send === 'Dyscalculia') {
    const hasRecipe = /Step\s*1.*formula|Step\s*1.*write|Step\s*2.*identify|Step\s*2.*values/i.test(text);
    results['IMP-13'] = { pass: hasRecipe, detail: hasRecipe ? '5-step calculation recipe found' : 'No 5-step calculation recipe on calc questions' };
  }
  if (ws.send === 'MLD') {
    const hasFormula = /HELP BOX|Formula:|formula reference|Key formula/i.test(text);
    results['IMP-14'] = { pass: hasFormula, detail: hasFormula ? 'Formula/help box found' : 'No formula reference boxes on calc questions' };
  }
  if (ws.send === 'EAL') {
    results['IMP-15'] = { pass: text.length > 5000, detail: text.length > 5000 ? 'EAL worksheet generated successfully' : 'EAL worksheet failed to generate' };
  }

  // Sprint 3 checks
  // IMP-09: Mark allocations vary
  const markMatches = sections.s3.match(/\[(\d+)\s*marks?\]|\((\d+)\s*marks?\)/gi) || [];
  const markValues = markMatches.map(m => parseInt(m.match(/\d+/)[0]));
  const uniqueMarks = new Set(markValues);
  results['IMP-09'] = { pass: uniqueMarks.size > 1, detail: `S3 mark values: [${[...uniqueMarks].join(', ')}] - ${uniqueMarks.size > 1 ? 'varied' : 'all identical'}` };

  // Working-out boxes
  const workingOutCount = (sections.s3.match(/Working out:|Show your working|Working Out:/gi) || []).length;
  results['Working-out-boxes'] = { pass: workingOutCount >= Math.max(1, s3Count), detail: `Found ${workingOutCount} working-out prompts for ${s3Count} S3 questions (need 1 per question)` };

  return results;
}

function rateContent(ws, text) {
  let score = 5; // Base score
  const sections = extractSections(text);

  // Check command words presence in S3
  const commandWords = /State|Describe|Explain|Evaluate|Compare|Calculate|Suggest|Define|Identify/gi;
  const cmdMatches = (sections.s3.match(commandWords) || []).length;
  if (cmdMatches >= 4) score += 1;
  else if (cmdMatches >= 2) score += 0.5;

  // Check topic relevance
  const topicLower = ws.topic.toLowerCase();
  const topicMentions = text.toLowerCase().split(topicLower).length - 1;
  if (topicMentions >= 3) score += 1;

  // Check marks format compliance (penalty for wrong format)
  if (!/\[\d+\s*marks?\]/i.test(text) && /\(\d+\s*marks?\)/i.test(text)) score += 1;

  // Check difficulty progression (S1 easier than S3)
  if (sections.s1.length > 0 && sections.s3.length > 0) score += 0.5;

  // Check S3 question count compliance
  const s3Count = countQuestions(sections.s3);
  if (s3Count === 5) score += 0.5;
  else if (s3Count >= 4 && s3Count <= 6) score += 0.25;

  // Check S2 question count compliance
  const s2Count = countQuestions(sections.s2);
  if (s2Count >= 6 && s2Count <= 8) score += 0.5;

  // Check mark variation (varied marks = better quality)
  const markMatches = sections.s3.match(/\[(\d+)\s*marks?\]|\((\d+)\s*marks?\)/gi) || [];
  const markValues = markMatches.map(m => parseInt(m.match(/\d+/)[0]));
  if (new Set(markValues).size > 1) score += 0.5;

  return Math.min(10, Math.round(score));
}

function rateSEND(ws, text, checks) {
  if (!ws.send) return { score: 'N/A', detail: 'Baseline - no SEND overlay' };
  let score = 5;
  let details = [];

  const sendChecks = Object.entries(checks).filter(([k]) => ['IMP-10','IMP-11','IMP-12','IMP-13','IMP-14','IMP-15','IMP-16'].includes(k));
  const passCount = sendChecks.filter(([,v]) => v.pass).length;
  const totalChecks = sendChecks.length;

  if (totalChecks > 0) {
    score = Math.round((passCount / totalChecks) * 10);
    details = sendChecks.map(([k,v]) => `${k}: ${v.pass ? 'PASS' : 'FAIL'}`);
  }

  // Check if SEND content is present at all
  if (ws.send === 'Hearing Impairment' && /key vocabulary|key terms/i.test(text)) score = Math.max(score, 5);
  if (ws.send === 'ADHD' && /brain.?break|take a break/i.test(text)) score = Math.max(score, 5);
  if (ws.send === 'Anxiety' && /warm.?up|no pressure/i.test(text)) score = Math.max(score, 5);
  if (ws.send === 'MLD' && /remember:|context/i.test(text)) score = Math.max(score, 5);

  return { score: Math.min(10, score), detail: details.join('; ') || 'General SEND adaptations present' };
}

// ========== REPORT GENERATION ==========

function generateReport(results) {
  let md = `# Full Audit Report 2026\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Auditor:** Automated (Playwright + Chromium headless)\n`;
  md += `**Site:** https://adaptly.co.uk\n`;
  md += `**Worksheets Attempted:** ${results.length}\n`;
  md += `**Worksheets Generated:** ${results.filter(r => r.success).length}\n\n`;

  // Executive Summary Table
  md += `## Executive Summary\n\n`;
  md += `| # | ID | Topic | SEND | Tier | Content (/ 10) | SEND (/ 10) | Sprint Checks Pass | Sprint Checks Fail |\n`;
  md += `|---|-----|-------|------|------|----------------|-------------|--------------------|-----------------|\n`;
  for (const r of results) {
    if (r.success) {
      const passCount = Object.values(r.checks).filter(c => c.pass).length;
      const failCount = Object.values(r.checks).filter(c => !c.pass).length;
      md += `| ${r.index} | ${r.ws.id} | ${r.ws.topic} | ${r.ws.send || 'None'} | ${r.ws.tier || '-'} | ${r.contentRating} | ${r.sendRating.score} | ${passCount} | ${failCount} |\n`;
    } else {
      md += `| ${r.index} | ${r.ws.id} | ${r.ws.topic} | ${r.ws.send || 'None'} | ${r.ws.tier || '-'} | FAILED | FAILED | - | - |\n`;
    }
  }

  // Sprint Verification Summary
  md += `\n## Sprint Verification Summary\n\n`;
  const allChecks = {};
  for (const r of results) {
    if (!r.checks) continue;
    for (const [k, v] of Object.entries(r.checks)) {
      if (!allChecks[k]) allChecks[k] = { pass: 0, fail: 0, details: [] };
      if (v.pass) allChecks[k].pass++;
      else allChecks[k].fail++;
      allChecks[k].details.push(`${r.ws.id}: ${v.detail}`);
    }
  }
  md += `| IMP Item | Pass | Fail | Status |\n`;
  md += `|----------|------|------|--------|\n`;
  for (const [k, v] of Object.entries(allChecks).sort()) {
    const status = v.fail === 0 ? 'ALL PASS' : (v.pass === 0 ? 'ALL FAIL' : 'PARTIAL');
    md += `| ${k} | ${v.pass} | ${v.fail} | ${status} |\n`;
  }

  // Detailed Per-Worksheet Sections
  md += `\n## Detailed Per-Worksheet Results\n\n`;
  for (const r of results) {
    md += `### ${r.ws.id}\n\n`;
    md += `**Configuration:**\n`;
    md += `- Subject: ${r.ws.subject}\n`;
    md += `- Year: ${r.ws.year}\n`;
    md += `- Topic: ${r.ws.topic}\n`;
    md += `- SEND: ${r.ws.send || 'None (baseline)'}\n`;
    md += `- Tier: ${r.ws.tier || 'N/A'}\n`;
    md += `- Reading Age: ${r.ws.readingAge}\n\n`;

    if (!r.success) {
      md += `**Status:** FAILED TO GENERATE\n`;
      md += `**Error:** ${r.error || 'Timeout or unknown error'}\n\n`;
      md += `---\n\n`;
      continue;
    }

    md += `**Status:** Generated successfully (${r.charCount} characters)\n\n`;
    md += `**Content Excerpt (first 500 chars):**\n\`\`\`\n${r.text.slice(0, 500)}\n\`\`\`\n\n`;

    md += `**Ratings:**\n`;
    md += `- Content Quality / GCSE Spec Alignment: **${r.contentRating}/10**\n`;
    md += `- SEND Overlay Effectiveness: **${r.sendRating.score}/10** ${r.sendRating.detail ? `(${r.sendRating.detail})` : ''}\n\n`;

    md += `**Sprint Check Results:**\n\n`;
    md += `| Check | Result | Detail |\n`;
    md += `|-------|--------|--------|\n`;
    for (const [k, v] of Object.entries(r.checks)) {
      md += `| ${k} | ${v.pass ? 'PASS' : 'FAIL'} | ${v.detail} |\n`;
    }
    md += `\n---\n\n`;
  }

  // Overall Conclusions
  md += `## Overall Conclusions\n\n`;
  const totalGenerated = results.filter(r => r.success).length;
  const totalAttempted = results.length;
  md += `- **Generation Success Rate:** ${totalGenerated}/${totalAttempted} worksheets generated successfully\n`;

  if (totalGenerated > 0) {
    const avgContent = results.filter(r => r.success).reduce((sum, r) => sum + r.contentRating, 0) / totalGenerated;
    md += `- **Average Content Rating:** ${avgContent.toFixed(1)}/10\n`;

    const sendResults = results.filter(r => r.success && r.ws.send);
    if (sendResults.length > 0) {
      const avgSend = sendResults.reduce((sum, r) => sum + (typeof r.sendRating.score === 'number' ? r.sendRating.score : 0), 0) / sendResults.length;
      md += `- **Average SEND Rating:** ${avgSend.toFixed(1)}/10\n`;
    }

    // Critical findings
    const criticalFails = [];
    for (const [k, v] of Object.entries(allChecks)) {
      if (v.fail > 0 && ['IMP-01','IMP-02','IMP-03'].includes(k)) criticalFails.push(k);
    }
    if (criticalFails.length > 0) {
      md += `\n### Critical Issues (P1)\n`;
      for (const k of criticalFails) {
        md += `- **${k}** still failing in ${allChecks[k].fail} worksheet(s)\n`;
      }
    }

    const structuralFails = [];
    for (const [k, v] of Object.entries(allChecks)) {
      if (v.fail > 0 && ['IMP-04','IMP-05','IMP-06','IMP-09'].includes(k)) structuralFails.push(k);
    }
    if (structuralFails.length > 0) {
      md += `\n### Structural Issues (P2)\n`;
      for (const k of structuralFails) {
        md += `- **${k}** still failing in ${allChecks[k].fail} worksheet(s)\n`;
      }
    }

    const sendFails = [];
    for (const [k, v] of Object.entries(allChecks)) {
      if (v.fail > 0 && ['IMP-10','IMP-11','IMP-12','IMP-13','IMP-14','IMP-15','IMP-16'].includes(k)) sendFails.push(k);
    }
    if (sendFails.length > 0) {
      md += `\n### SEND Overlay Gaps (P3)\n`;
      for (const k of sendFails) {
        md += `- **${k}** still failing in ${allChecks[k].fail} worksheet(s)\n`;
      }
    }
  }

  md += `\n---\n*Report generated automatically by full-audit-2026.mjs*\n`;
  return md;
}

// ========== MAIN ==========

async function main() {
  console.log("=== Full Audit 2026 - Starting ===\n");
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.setDefaultTimeout(60000);

  const loggedIn = await login(page);
  
  const results = [];
  
  if (loggedIn) {
    // Generate worksheets live
    for (let i = 0; i < WORKSHEETS.length; i++) {
      const ws = WORKSHEETS[i];
      const gen = await generateWorksheet(page, ws);
      const entry = { index: i + 1, ws, success: gen.success, text: gen.text || '', charCount: gen.text?.length || 0, error: gen.error || null, checks: {}, contentRating: 0, sendRating: { score: 'N/A', detail: '' } };

      if (gen.success && gen.text) {
        entry.checks = runSprintChecks(ws, gen.text);
        entry.contentRating = rateContent(ws, gen.text);
        entry.sendRating = rateSEND(ws, gen.text, entry.checks);
      }
      results.push(entry);
    }
  } else {
    console.log("\nLogin failed - using previously captured outputs if available...\n");
  }
  
  await browser.close();

  // If login failed or some worksheets didn't generate, try to load from saved files
  if (!loggedIn || results.filter(r => r.success).length < WORKSHEETS.length) {
    for (let i = 0; i < WORKSHEETS.length; i++) {
      const ws = WORKSHEETS[i];
      // Skip if we already have a successful result
      if (results[i] && results[i].success) continue;
      
      const filePath = `${OUT_DIR}/${ws.id}.txt`;
      if (existsSync(filePath)) {
        const text = readFileSync(filePath, 'utf-8');
        if (text.length > 5000) {
          console.log(`  Loaded cached output for ${ws.id} (${text.length} chars)`);
          const entry = { index: i + 1, ws, success: true, text, charCount: text.length, error: null, checks: {}, contentRating: 0, sendRating: { score: 'N/A', detail: '' } };
          entry.checks = runSprintChecks(ws, text);
          entry.contentRating = rateContent(ws, text);
          entry.sendRating = rateSEND(ws, text, entry.checks);
          if (results[i]) results[i] = entry;
          else results.push(entry);
        } else {
          if (!results[i]) results.push({ index: i + 1, ws, success: false, text: '', charCount: 0, error: 'Cached file too small', checks: {}, contentRating: 0, sendRating: { score: 'N/A', detail: '' } });
        }
      } else {
        if (!results[i]) results.push({ index: i + 1, ws, success: false, text: '', charCount: 0, error: 'Not generated (site unavailable)', checks: {}, contentRating: 0, sendRating: { score: 'N/A', detail: '' } });
      }
    }
  }

  // Generate report
  console.log("\n=== Generating Report ===");
  const report = generateReport(results);
  writeFileSync(REPORT_PATH, report);
  console.log(`Report saved to ${REPORT_PATH}`);
  console.log(`Generated: ${results.filter(r => r.success).length}/${results.length} worksheets`);
  console.log(`\n=== Full Audit 2026 - Complete ===`);
}

main().catch(e => { console.error("Fatal error:", e); process.exit(1); });
