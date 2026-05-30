# Test Plan — Worksheet Generator Audit Re-verification

**Purpose:** Re-run the live audit after fixes from `FIX-PLAN.md` are deployed.  
**Tool:** Playwright + Chromium headless (script: `audit/live-audit.mjs`)  
**Site:** https://adaptly.co.uk  
**Credentials:** `admin@adaptly.co.uk` / `Admin1234!`

---

## How to Resume in the Next Chat

```
1. Clone repo:  tahmidburner22-oss/send-assistant
2. Read this file: audit/TEST-PLAN.md
3. Read the fix plan: audit/FIX-PLAN.md
4. Read session handoff: audit/SESSION-HANDOFF.md (if present)
5. Install deps: npm install --prefix send-assistant/audit
6. Install Chromium: npx playwright install chromium
7. Run tests below per section
```

---

## Test Matrix

Generate the following worksheets and verify each criterion:

| Test ID | Subject | Topic | Year | SEND | Tier | Reading Age | Verifies |
|---------|---------|-------|------|------|------|-------------|----------|
| T1 | Science | Bioenergetics | Y10 | Hearing Impairment | Higher | Auto | Phase 1 + 4-HI |
| T2 | Science | Forces | Y10 | ADHD | Higher | Auto | Phase 1 + 4-ADHD |
| T3 | Science | Infection and Response | Y10 | Anxiety | Foundation | Auto | Phase 1 + 4-Anxiety |
| T4 | Science | Atomic Structure | Y10 | MLD | Foundation | KS2 | Phase 1 + 4-MLD |
| T5 | Science | Energy | Y10 | Dyscalculia | Higher | Auto | Phase 1 + 4-Dyscalculia + BUG-1 |
| T6 | Science | Electricity | Y10 | EAL | Mixed | KS2 | Phase 1 + 4-EAL |
| T7 | Science | Bonding, Structure | Y10 | None | Higher | Auto | Phase 1 baseline (no SEND) |
| T8 | Science | Cell Biology | Y10 | None | Foundation | Auto | Phase F tier comparison |

---

## Per-Fix Verification Procedures

### FIX-1: TEACHER_DIAGNOSES stripped from student view

```
PROCEDURE:
1. Generate any Science worksheet with an MCQ section
2. Switch to "Student" view (button in toolbar)
3. Search full page text for "TEACHER_DIAGNOSES"
4. PASS if: 0 matches
5. FAIL if: any match found

AUTOMATED CHECK:
  const text = await page.evaluate(() => document.body.innerText);
  assert(!text.includes('TEACHER_DIAGNOSES'));
```

---

### FIX-2: Dyscalculia cue does not corrupt questions

```
PROCEDURE:
1. Generate T5 (Dyscalculia/Energy)
2. Extract Section 2 text
3. Count numbered questions (pattern: /^\d+\.\s/)
4. Verify no duplicate question numbers
5. Verify "Underline each one" text does NOT have its own [N marks] allocation
6. PASS if: S2 has exactly 6-8 uniquely numbered Qs, no duplicates
7. FAIL if: duplicate numbers or cue text gets marks allocation

AUTOMATED CHECK:
  const s2 = extractSection(text, 'SECTION 2');
  const qNums = s2.match(/^(\d+)\./gm).map(Number);
  assert(new Set(qNums).size === qNums.length); // no duplicates
  assert(!s2.includes('Underline each one\n['));  // cue not getting marks
```

---

### FIX-3: Marks format (N marks) not [N marks]

```
PROCEDURE:
1. Generate any worksheet (T1-T8)
2. Search for mark patterns in Section 2 and Section 3
3. PASS if: all marks shown as (N marks)
4. FAIL if: any [N marks] found

AUTOMATED CHECK:
  assert(/\(\d+ marks?\)/i.test(text));      // round brackets present
  assert(!/\[\d+ marks?\]/i.test(text));     // square brackets absent
```

---

### FIX-4: Section 3 has exactly 5 questions

```
PROCEDURE:
1. Generate T7 (no SEND, baseline)
2. Count questions in Section 3 (numbered 1-5 or Q1-Q5)
3. PASS if: exactly 5
4. FAIL if: fewer or more than 5

AUTOMATED CHECK:
  const s3 = extractSection(text, 'SECTION 3');
  const count = countQuestions(s3);
  assert(count === 5, `Expected 5, got ${count}`);
```

---

### FIX-5: Section 2 has 6–8 questions

```
PROCEDURE:
1. Generate T7 (no SEND, baseline)
2. Count questions in Section 2
3. PASS if: 6–8
4. FAIL if: fewer than 6 or more than 8

AUTOMATED CHECK:
  const s2 = extractSection(text, 'SECTION 2');
  const count = countQuestions(s2);
  assert(count >= 6 && count <= 8, `Expected 6-8, got ${count}`);
```

---

### FIX-7: HI inline definitions

```
PROCEDURE:
1. Generate T1 (HI/Bioenergetics)
2. Search question text (not vocab box) for pattern: (= ...)
3. PASS if: ≥3 inline definitions found in questions
4. FAIL if: 0 inline definitions in question text

AUTOMATED CHECK:
  const sections = text.slice(text.indexOf('SECTION 1'));
  const inlineDefs = sections.match(/\(=\s*[^)]+\)/g);
  assert(inlineDefs && inlineDefs.length >= 3);
```

---

### FIX-8: ADHD brain-breaks scale

```
PROCEDURE:
1. Generate T2 (ADHD/Forces)
2. Count total brain-break prompts (🧠 BRAIN BREAK)
3. Count total questions across all sections
4. Verify breaks are ≥3 questions apart
5. PASS if: ≥2 brain-breaks for a 15+ question worksheet
6. FAIL if: only 1 brain-break

AUTOMATED CHECK:
  const breaks = (text.match(/BRAIN BREAK/g) || []).length;
  assert(breaks >= 2, `Expected ≥2 breaks, got ${breaks}`);
```

---

### FIX-9: Dyscalculia 5-step recipe on calc Qs only

```
PROCEDURE:
1. Generate T5 (Dyscalculia/Energy)
2. Find calculation questions (contain "Calculate" or "Show your working")
3. Verify they have a 5-step scaffold (Step 1: ... Step 5: ...)
4. Find non-calculation questions (State, Describe, Explain)
5. Verify they do NOT have the 5-step recipe
6. PASS if: recipe appears on calc Qs, lighter cue on non-calc Qs
7. FAIL if: recipe missing on calc Qs OR recipe on non-calc Qs

AUTOMATED CHECK:
  const calcQs = findQuestionsByVerb(text, ['Calculate', 'Show your working']);
  calcQs.forEach(q => assert(/Step 1.*Step 5/s.test(q)));
  const nonCalcQs = findQuestionsByVerb(text, ['State', 'Describe', 'Identify']);
  nonCalcQs.forEach(q => assert(!/Step 1.*Step 5/s.test(q)));
```

---

### FIX-10: MLD formula reference

```
PROCEDURE:
1. Generate T4 (MLD/Atomic Structure) — note: this topic has few calcs
2. Also generate MLD/Energy (custom) for better calc coverage
3. Find calculation questions
4. Verify they have a formula reference hint
5. PASS if: formula hint present on calc Qs
6. FAIL if: no formula reference

AUTOMATED CHECK:
  const calcQs = findQuestionsByVerb(text, ['Calculate']);
  calcQs.forEach(q => assert(/formula|equation|remember/i.test(q)));
```

---

### FIX-11: Anxiety invitational titles

```
PROCEDURE:
1. Generate T3 (Anxiety/Infection)
2. Check Section 1 heading
3. Check Challenge section heading
4. PASS if: S1 title contains invitational language; Challenge labelled "OPTIONAL"
5. FAIL if: standard "SECTION 1 — RECALL" or "Challenge yourself!"

AUTOMATED CHECK:
  assert(/warm.up|no pressure|you've got this/i.test(text));
  assert(/optional|bonus/i.test(text));
  assert(!/Challenge yourself!/i.test(text));
```

---

### FIX-13: Tip 1 lists specific vocabulary

```
PROCEDURE:
1. Generate any worksheet
2. Find Tip 1 in the TIPS section
3. PASS if: Tip 1 names at least 3 specific terms from the topic
4. FAIL if: Tip 1 says "Re-read the Key Vocabulary box" without naming terms

AUTOMATED CHECK:
  const tip1 = text.match(/1\s*\nVOCABULARY\n([^\n]+)/)?.[1] || '';
  // Should contain actual terms, not just "Re-read the Key Vocabulary box"
  assert(!/Re-read the Key Vocabulary box/i.test(tip1) || /define.*:.*,.*,/i.test(tip1));
```

---

### FIX-14: Tip 6 references learning objective

```
PROCEDURE:
1. Generate any worksheet
2. Count tips in the TIPS section
3. PASS if: 6 tips present AND tip 6 references learning objective
4. FAIL if: only 5 tips OR no LO reference

AUTOMATED CHECK:
  const tipCount = (text.match(/^\d+\n[A-Z]/gm) || []).length;
  assert(tipCount >= 6);
  assert(/learning objective|objective/i.test(tipsSection));
```

---

## Phase F — Tier Comparison Test

```
PROCEDURE:
1. Generate T7 (Higher/Bonding) and T8 (Foundation/Cell Biology)
   — ideally same topic, different tiers
2. Compare:
   a. Higher worksheet contains higher-tier spec points (transition metals, etc.)
   b. Foundation worksheet does NOT contain higher-only content
   c. Command verbs differ: Higher = Calculate/Evaluate/Justify; Foundation = Name/Describe/Identify
3. PASS if: clear tier differentiation in content and command verbs
4. FAIL if: identical content regardless of tier
```

---

## Regression Tests (must still pass after fixes)

These criteria passed in the original audit and must NOT regress:

| Phase | Criterion | Check |
|-------|-----------|-------|
| 2 | Self-reflection present + names topic | Must still pass |
| 2 | 5 distinct RAG items | Must still pass |
| 2 | Exit ticket names topic | Must still pass |
| 3 | Tips section present (5+ tips) | Must still pass |
| 3 | Common mistake reference | Must still pass |
| 3 | Tips name topic | Must still pass |
| 4-ADHD | Tick-boxes present | Must still pass |
| 4-ADHD | Brain-break present (at least 1) | Must still pass |
| 4-MLD | Topic context block | Must still pass |
| 4-HI | No-verbal cue | Must still pass |
| 4-HI | Word Bank | Must still pass |
| 5 | Demand progression S1 < S2 < S3 | Must still pass |
| 5 | Real curriculum content | Must still pass |
| 5 | GCSE command verbs in S3 | Must still pass |

---

## Automation Script Location

The Playwright audit script is at:
```
send-assistant/audit/live-audit.mjs
send-assistant/audit/generate-batch-v2.mjs
```

To run:
```bash
npm install --prefix send-assistant/audit
npx playwright install chromium
node send-assistant/audit/generate-batch-v2.mjs
```

---

## EAL Test (Deferred — needs separate run)

The EAL SEND need was not successfully tested due to:
1. SEND dropdown ordering caused "Anxiety" to be selected instead
2. Site went down (502) before retry

**When site is back up, add:**

| Test ID | Subject | Topic | SEND | Tier | Verifies |
|---------|---------|-------|------|------|----------|
| T9 | Science | Bonding | EAL | Mixed | EAL inline glossary, bilingual support |

**EAL criteria to verify:**
- [ ] Language-support box under every non-vocab question
- [ ] Word bank reference + command-word decoder
- [ ] Bilingual vocabulary glossary (if Romanian/Spanish translations available)
- [ ] Inline glossary on every technical term in questions

---

## Session Handoff Notes

When resuming in a new chat session:

1. **Check site status:** `curl -s -o /dev/null -w "%{http_code}" https://adaptly.co.uk/login` — must return 200.
2. **Check which fixes have been deployed** by looking at recent PRs on the repo.
3. **Run the test matrix** for any fix that has been merged.
4. **Update `LIVE-AUDIT-REPORT.md`** with new results.
5. **If a fix fails re-test:** file it back in `FIX-PLAN.md` with details of what went wrong.
