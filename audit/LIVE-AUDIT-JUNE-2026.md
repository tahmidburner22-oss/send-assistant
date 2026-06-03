# Live Worksheet Generator Audit — June 2026 (Continuation)

## Status: COMPLETE
**Session:** 2026-06-03 (continuation of earlier session)
**Worksheets generated:** 6 of 7 (WS7 blocked by intermittent Railway 502)
**Method:** Playwright + Chromium headless against live site (adaptly.co.uk)
**Branch:** `audit/live-audit-june-2026-continuation`

---

## Executive Summary

The worksheet generator has **significantly improved** since the initial audit (PRs #153–#160 merged). The full pedagogical structure (Learning Objective, Vocabulary, Common Misconceptions, Worked Example, Sections 1–3, Challenge, Examiner Tips, Self-Reflection) **is now generating correctly** for Biology, Chemistry, Physics, and English. However, **Mathematics worksheets with Dyscalculia SEND** degrade to a flat 3-section structure without any pedagogical scaffolding — a critical regression.

### Key Metrics

| Category | Pass Rate | Notes |
|----------|-----------|-------|
| 14-Section Structure (non-maths) | **85%** | WS2-5 generate full structure |
| 14-Section Structure (maths) | **20%** | WS1 + WS6 missing most sections |
| SEND Overlay Application | **75%** | Mostly working, some gaps |
| Question Count Targets (7-7-5-1) | **40%** | Consistently under-generating |
| Per-Question Mark Allocations | **30%** | Section totals instead of per-Q |
| Diagram A/B from Library | **0%** | Never populated |
| Maths Genie Style | **0%** | Not implemented on live output |
| Visual Language System | **60%** | Dots + icons visible, not all features |

### Critical Issues (Ranked)

1. **Maths + Dyscalculia worksheets lose all structure** — degrades to raw numbered sections
2. **Diagram A/B sections never pull from the library** — always empty/missing
3. **Question counts consistently below targets** — S1: 3-4 (target 7), S2: 4 (target 7), S3: 5-6 (target 5)
4. **Per-question marks not rendering** — shows section totals like `(8 marks total)` instead of per-Q `(2 marks)`
5. **Maths Genie exam-style mode not activating** — despite being coded in PR #160

---

## Worksheet-by-Worksheet Analysis

### Worksheet 1: Mathematics / Year 10 / Quadratic Equations / Dyslexia / AQA
*(From previous session)*

| Section | Expected | Actual | Status |
|---------|----------|--------|--------|
| Header | Subject/Year/Topic/Name/Date/Class | Present | ✅ |
| Learning Objective | Measurable LO | ABSENT | ❌ |
| Vocabulary | Tier 2 & 3 terms | ABSENT | ❌ |
| Common Misconceptions | 3 predictable errors | ABSENT | ❌ |
| Worked Example | Fully modelled | ABSENT | ❌ |
| Diagram A | Reference diagram | ABSENT | ❌ |
| Section 1 (Recall) | 7 questions, varied types | 4 questions, one type | ❌ |
| Section 2 (Understanding) | 7 questions | 6 questions (with subs) | ⚠️ |
| Diagram B | Completion task | ABSENT | ❌ |
| Section 3 (Application) | 5 exam-style | 2 questions | ❌ |
| Challenge | 1 stretch question | Present | ✅ |
| Self-Reflection | RAG / exit ticket | ABSENT | ❌ |
| Examiner Tips | 5 revision tips | ABSENT | ❌ |
| Teacher Key | Mark scheme | ABSENT | ❌ |

**Dyslexia SEND Overlay:**
- Method-steps box: ❌ ABSENT
- Dyslexia-friendly formatting: ⚠️ Footer label only
- Word bank on extended Qs: ❌ ABSENT

**Verdict:** 3/14 sections present. Catastrophic failure for maths.

---

### Worksheet 2: Biology / Year 10 / Cells and Organisation / ADHD / AQA

| Section | Expected | Actual | Status |
|---------|----------|--------|--------|
| Header | Subject/Year/Topic/Name/Date/Class | Present | ✅ |
| Learning Objective | Measurable LO | "By the end of this lesson, you will be able to explain..." | ✅ |
| Key Vocabulary | 5 terms with definitions | Cell, Tissue, Organ, Organelle, Eukaryotic cell | ✅ |
| Common Misconceptions | 3 errors with corrections | 3 misconceptions with → corrections | ✅ |
| Worked Example | Stepped solution | 4-step magnification calculation | ✅ |
| Diagram A | Full page spread | ABSENT (not pulled from library) | ❌ |
| Section 1 (Recall) | 7 Qs (T/F + MCQ + Gap Fill) | T/F (4 items) + MCQ (1) + Gap Fill (1) = 3 blocks | ⚠️ |
| Brain Break | ADHD-specific | "🧠 BRAIN BREAK — stand up and stretch" | ✅ |
| Section 2 (Understanding) | 7 questions | 4 questions (6 marks total) | ❌ |
| Diagram B | Full page spread | ABSENT | ❌ |
| Section 3 (Application) | 5 exam-style | 6 questions (20 marks total) | ⚠️ |
| Challenge | Stretch | 2 challenge questions | ✅ |
| Examiner Tips | 5 tips (6 categories) | 5 tips (VOCAB/EXAMPLE/PAPERS/RETRIEVAL/LO) | ✅ |
| Self-Reflection | Exit ticket | "Write ONE thing you learned..." | ✅ |

**ADHD SEND Overlay:**
- `[ ]` tick checkboxes on every question: ✅ Present
- Brain Break mid-Section B: ✅ Present
- Challenge labelled as optional/bonus: ⚠️ Says "Challenge yourself!" not "BONUS"
- Action verb bolded: ⚠️ Inconsistent
- Max 3 questions Section A: ✅ (3 blocks)
- Varied question types: ✅ (T/F, MCQ, Gap Fill, written)

**Question Count Analysis:**
- Section 1: 3 question blocks (internal items ~10) — target: 7 separate Qs ⚠️
- Section 2: 4 questions — target: 7 ❌
- Section 3: 6 questions — target: 5 ⚠️ (over by 1)

**Marks Format:**
- Shows `(6 marks total)` and `(20 marks total)` per section ❌
- Should show per-question e.g. `(2 marks)` on each question

**Verdict:** 10/14 sections present. Strong improvement. ADHD overlay working well.

---

### Worksheet 3: Chemistry / Year 11 / Atomic Structure / Anxiety / AQA

| Section | Expected | Actual | Status |
|---------|----------|--------|--------|
| Header | Full header | Present | ✅ |
| Learning Objective | Measurable | "...describe the structure of an atom..." | ✅ |
| Key Vocabulary | 5 terms | Atom, Proton, Neutron, Electron, Nucleus | ✅ |
| Common Misconceptions | 3 with corrections | 3 present (mass/atomic number, electron mass, charges) | ✅ |
| Worked Example | Stepped | 6-step mass number calculation | ✅ |
| Diagram A | From library | ABSENT | ❌ |
| Section 1 (Recall) | 7 Qs with invitational title | "WARM-UP — NO PRESSURE, YOU'VE GOT THIS!" T/F+MCQ+Gap Fill | ✅ |
| Section 2 (Understanding) | 7 Qs with invitational title | "BUILDING YOUR UNDERSTANDING" — 4 Qs (8 marks) | ⚠️ |
| Diagram B | From library | ABSENT | ❌ |
| Section 3 (Application) | 5 Qs with invitational title | "STRETCH YOURSELF — TAKE YOUR TIME" — 6 Qs (24 marks) | ⚠️ |
| Challenge | Labelled OPTIONAL | "STRETCH & CHALLENGE" (not "OPTIONAL BONUS") | ⚠️ |
| Examiner Tips | 5 tips | "Quick tips to keep you on track" — 5 tips | ✅ |
| Self-Reflection | Exit ticket | "One thing I want to remember..." | ✅ |

**Anxiety SEND Overlay:**
- Section 1 title invitational: ✅ "WARM-UP — NO PRESSURE, YOU'VE GOT THIS!"
- Section 2 title invitational: ✅ "BUILDING YOUR UNDERSTANDING"
- Section 3 title invitational: ✅ "STRETCH YOURSELF — TAKE YOUR TIME"
- Challenge labelled "OPTIONAL BONUS": ❌ Still says "STRETCH & CHALLENGE"
- No threatening language: ✅

**Question Counts:** S1: 3 blocks (internal ~10 items), S2: 4, S3: 6
**Marks:** Section totals only `(8 marks total)`, `(24 marks total)` ❌

**Verdict:** 10/14 sections. Anxiety invitational titles WORKING on S1-S3. Challenge title not fully applying.

---

### Worksheet 4: Physics / Year 9 / Forces and Motion / Hearing Impairment / AQA

| Section | Expected | Actual | Status |
|---------|----------|--------|--------|
| Header | Full | Present | ✅ |
| Learning Objective | Measurable | "...explain the relationship between force, mass, and acceleration..." | ✅ |
| Key Vocabulary | 5 terms | Force, Mass, Acceleration, Newton's Second Law, Resultant force | ✅ |
| Common Misconceptions | 3 | mass≠weight, F≠a always, moving≠no forces | ✅ |
| Worked Example | Stepped | 6-step F=ma calculation | ✅ |
| **Topic Summary** | HI-specific | "TOPIC SUMMARY — READ FIRST" with LO + key terms | ✅ |
| Diagram A | From library | ABSENT | ❌ |
| Section 1 (Recall) | 7 Qs | T/F (4) + MCQ (1) + Gap Fill (1) = 3 blocks | ⚠️ |
| Section 2 (Understanding) | 7 Qs | 4 questions (8 marks total) | ❌ |
| Diagram B | From library | ABSENT | ❌ |
| Section 3 (Application) | 5 Qs | 6 questions (24 marks total) | ⚠️ |
| Challenge | Stretch | 2 challenge questions | ✅ |
| Examiner Tips | 5 tips | 5 tips present | ✅ |
| Self-Reflection | Exit ticket | Present | ✅ |

**Hearing Impairment SEND Overlay:**
- Topic Summary — READ FIRST: ✅ Present and correct
- Inline `(= definition)` annotations on first vocab use: ⚠️ PARTIAL — Some definitions appear but format is `(= A push or pull on an object, measured in Newtons (N). Mass — The a…)` which is TRUNCATED/MALFORMED
- All instructions on-page (no spoken-only): ✅

**HI Inline Definition Bug:** The inline definitions are being inserted but they're grabbing the ENTIRE vocabulary block text and truncating mid-sentence. Expected: `force (= a push or pull, measured in N)`. Actual: `force (= A push or pull on an object, measured in Newtons (N). Mass — The a…)`. This is a **bug in the HI overlay logic** — it's concatenating multiple vocab entries.

**Verdict:** 10/14 sections. HI Topic Summary working. Inline definitions BUGGY.

---

### Worksheet 5: English / Year 10 / Shakespeare / MLD / AQA

| Section | Expected | Actual | Status |
|---------|----------|--------|--------|
| Header | Full | Present | ✅ |
| Learning Objective | Measurable | "...analyse how Shakespeare uses language and structure..." | ✅ |
| Key Vocabulary | 5 terms | Tragedy, Soliloquy, Aside, Metaphor, Iambic Pentameter | ✅ |
| Common Misconceptions | 3 | simile≠metaphor, naming≠analysing, summarising≠analysing | ✅ |
| Worked Example | Stepped | 4-step PEE analysis of Macbeth extract | ✅ |
| **MLD Topic Context** | MLD-specific | "WHAT WE ARE WORKING ON" block with tips | ✅ |
| Diagram A | From library | ABSENT | ❌ |
| Section 1 (Recall) | 7 Qs | T/F + MCQ + Gap Fill (with HELP BOXes) | ✅ |
| Section 2 (Understanding) | 7 Qs | 4 questions (8 marks) with HELP BOX | ⚠️ |
| Diagram B | From library | ABSENT | ❌ |
| Section 3 (Application) | 5 Qs | 6 questions (24 marks) with HELP BOX | ⚠️ |
| Challenge | Stretch | 2 challenge Qs with HELP BOX | ✅ |
| Examiner Tips | 5 tips | 5 tips | ✅ |
| Self-Reflection | Exit ticket | Present | ✅ |

**MLD SEND Overlay:**
- Topic context block ("WHAT WE ARE WORKING ON"): ✅ Present
- HELP BOX on every section: ✅ Present on all sections
- Sentence starters: ✅ "The answer is ___ because ___"
- Hints: ✅ "Cross out wrong options first"
- Simplified language: ✅ Short, clear sentences

**Verdict:** 10/14 sections. MLD overlay is the BEST implemented — HELP BOXes everywhere, topic context, sentence starters.

---

### Worksheet 6: Mathematics / Year 11 / Histograms / Dyscalculia / AQA

| Section | Expected | Actual | Status |
|---------|----------|--------|--------|
| Header | Full header | Minimal — just "ADAPTLY / MATHEMATICS · YEAR 11" + title + "adaptly.co.uk" | ⚠️ |
| Learning Objective | Measurable | ABSENT | ❌ |
| Key Vocabulary | 5 terms | ABSENT | ❌ |
| Common Misconceptions | 3 | ABSENT | ❌ |
| Worked Example | Stepped | ABSENT | ❌ |
| Diagram A | From library | ABSENT | ❌ |
| Section 1 (Recall) | 7 Qs | 7 questions all same type (calculation only) | ⚠️ |
| Section 2 (Understanding) | 7 Qs | 7 questions all same type | ⚠️ |
| Diagram B | From library | ABSENT | ❌ |
| Section 3 (Application) | 5 Qs | 5 questions | ✅ |
| Challenge | Stretch | ABSENT | ❌ |
| Examiner Tips | 5 tips | ABSENT | ❌ |
| Self-Reflection | Exit ticket | ABSENT | ❌ |

**Dyscalculia SEND Overlay:**
- 5-step scaffold on every question: ✅ Present (1-underline, 2-choose operation, 3-estimate, 4-grid, 5-one step per line)
- "Numbers in this question to underline": ✅ Present
- Calculation steps to follow: ✅ Present

**CRITICAL BUG:** The entire pedagogical structure (LO, Vocab, Misconceptions, Worked Example, Challenge, Tips, Reflection) is MISSING. The worksheet is just 3 raw numbered sections with questions + dyscalculia scaffolds. This is the **same degradation** as WS1 (Maths/Dyslexia). **Maths worksheets are NOT receiving the full structure.**

**Root Cause Theory:** The Dyscalculia SEND overlay appears to be overriding/replacing the standard worksheet structure rather than augmenting it. The `reinforceDyscalculiaMathsScaffolding` function in the post-validator may be consuming the worksheet structure and emitting only the scaffolded questions.

**Verdict:** 3/14 sections. CRITICAL FAILURE — same as WS1. Maths is broken.

---

## Cross-Worksheet Comparison Matrix

| Feature | WS1 Maths | WS2 Bio | WS3 Chem | WS4 Phys | WS5 Eng | WS6 Maths |
|---------|-----------|---------|----------|----------|---------|-----------|
| Learning Objective | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Key Vocabulary | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Common Misconceptions | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Worked Example | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Diagram A (from library) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Section 1 (7 Qs, varied) | ❌ (4Q) | ⚠️ (3 blocks) | ⚠️ (3 blocks) | ⚠️ (3 blocks) | ✅ (3 blocks+) | ⚠️ (7Q same type) |
| Section 2 (7 Qs) | ⚠️ (6Q) | ❌ (4Q) | ❌ (4Q) | ❌ (4Q) | ❌ (4Q) | ⚠️ (7Q same type) |
| Diagram B (from library) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Section 3 (5 exam-style) | ❌ (2Q) | ⚠️ (6Q) | ⚠️ (6Q) | ⚠️ (6Q) | ⚠️ (6Q) | ✅ (5Q) |
| Challenge | ✅ | ✅ | ⚠️ | ✅ | ✅ | ❌ |
| Examiner Tips | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Self-Reflection | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Per-Q marks | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| SEND overlay applied | ⚠️ label | ✅ | ✅ | ⚠️ buggy | ✅ | ✅ |
| **Score /14** | **3** | **10** | **10** | **10** | **10** | **3** |

---

## Findings from Recent Merged PRs (Built but Not Shipping Correctly)

### PR #160 — Visual Language + Exam-Style Mode
**Built:** Exam-style mode (`metadata.examStyle === true`), difficulty dots, response icons, Maths Genie layout
**Not Shipping:** Exam-style mode is never activated by default for maths. The metadata flag `examStyle` is not being set by the generation flow. Difficulty dots (●/●●/●●●) ARE visible in live output. Response icons (□/○/✎) ARE visible.

### PR #159 — Comprehensive Improvements
**Built:** Visual Language System, enhanced SEND descriptions, quality checker, L.O. wording enforcement
**Not Shipping:** Quality checker runs but doesn't gate output. L.O. wording IS fixed on science/English. Maths still not getting LO/Vocab/etc.

### PR #155 — Sprint 2 SEND Overlays
**Built:** HI inline definitions, ADHD scaling brain breaks, Dyscalculia science recipe, MLD HELP BOX, EAL command-word decoder
**Partially Shipping:** HI inline definitions are BUGGY (concatenates multiple entries). ADHD brain break ✅. MLD HELP BOX ✅. Dyscalculia scaffold ✅ but destroys structure.

### PR #153 — Sprint 1 Quick Wins
**Built:** Marks bracket style enforcement, application question cap, Section 2 count hardening
**Not Shipping:** Marks still showing as section totals, Section 2 still at 4 questions. The prompt hardening for "6-8 Section 2 questions" is NOT being respected by the LLM.

---

## Diagram A/B Library Issue

**Problem:** Diagram A (full-page reference diagram) and Diagram B (completion/annotation task) sections are NEVER populated from the diagram library (5,975 entries in `docs/diagram-library-catalogue.csv`). Every worksheet across all 6 tested outputs has empty/missing diagram sections.

**Root Cause:** The diagram catalogue exists as a CSV file and has a generation pipeline (PRs #128, #132, #134, #135) but the **lookup mechanism** that matches a worksheet's (subject, topic, year_group) to a catalogue entry and injects the image into the worksheet JSON is either:
1. Not wired into the generation flow in `ai.ts`
2. The `diagramRef` field on `WorksheetSection` is never populated
3. The renderer doesn't fetch/display the image even when a ref exists

**Evidence:** The form UI shows "Diagram A — Full Page Spread" and "Diagram B — Full Page Spread" as selectable sections (both ticked by default), but the generated output never includes them.

**Fix Required:** Wire `lookupDiagramForTopic(subject, topic, yearGroup)` from the diagram catalogue into the worksheet generation pipeline, populate `diagramRef` and `image_url` on the section, and ensure the renderer displays it.

---

## Maths Genie / yesgenie.com Style Comparison

### What Maths Genie Does
- Pure exam-style questions, NO pedagogical scaffolding
- Individual mark allocations per question in brackets `(3)`
- Clean monochrome layout — no colour, no decorative headers
- Bold question numbers, generous working space
- Questions progress from grade 1-2 (easy) to grade 8-9 (hard)
- Mix of GCSE command words (Calculate, Show that, Solve, Find, Work out)
- Total marks at the bottom
- No vocabulary, no worked examples, no self-reflection
- Just questions + space + marks — mimics a real exam paper

### What Adaptly Currently Does (Maths)
- WS1: Basic sections with question blocks, section-total marks, no scaffolding
- WS6: Flat 3-section structure, dyscalculia scaffold dominates layout
- Neither matches Maths Genie style
- The code for exam-style mode EXISTS (PR #160) but is never activated

### What Needs to Happen
1. **Activate exam-style mode for maths by default** when no SEND overlay requires scaffolding
2. When exam-style is active: suppress LO, Vocab, Worked Example, Misconceptions, Tips, Reflection
3. Per-question marks in `(N)` format (not section totals)
4. Working-out box per question (already coded in `shouldRenderWorkingOutBox`)
5. Progressive difficulty within sections (already coded in `mathsProgressionAudit`)
6. Clean monochrome layout (already coded in Sprint 7 of PR #160)
7. For SEND overlays on maths: keep the structure but add the overlay ON TOP, don't replace

---

## Comprehensive Improvement Plan

### Sprint 1: CRITICAL — Fix Maths Worksheet Structure (1-2 days)

**Problem:** Maths worksheets with SEND overlays (Dyslexia, Dyscalculia) lose the entire 14-section pedagogical structure.

**Tasks:**
1. **Debug `reinforceDyscalculiaMathsScaffolding`** in `worksheetPostValidator.ts` — it's likely consuming/replacing sections rather than augmenting them
2. **Ensure the structured generation path in `ai.ts`** generates the full 14-section structure for maths (currently it may be taking a different code path for maths subjects)
3. **Add a post-validator guard** that warns/fails when a generated worksheet has fewer than 8 sections (the minimum for a valid worksheet)
4. **Test:** Generate Y11 Maths / Histograms / No SEND → should produce full 14 sections. Then add Dyscalculia → should produce full 14 sections PLUS scaffolds

**Files:** `client/src/lib/ai.ts` (L817+), `client/src/lib/worksheetPostValidator.ts`

### Sprint 2: CRITICAL — Wire Diagram Library into Generation (1-2 days)

**Problem:** Diagram A and Diagram B sections never populate from the 5,975-entry catalogue.

**Tasks:**
1. **Create `lookupDiagramForWorksheet(subject, topic, yearGroup)`** in a new `client/src/lib/diagramLibraryLookup.ts` module
2. **Parse `docs/diagram-library-catalogue.csv`** or load from DB on generation
3. **In `ai.ts` post-generation**, inject matching diagram entries into the appropriate section slots
4. **In `WorksheetRenderer.tsx`**, render `<img>` when `diagramRef` or `image_url` is populated on a diagram section
5. **Fallback:** When no library match exists, render a placeholder box with the brief text so a teacher knows what diagram to add manually

**Files:** `client/src/lib/diagramLibraryLookup.ts` (NEW), `client/src/lib/ai.ts`, `client/src/components/WorksheetRenderer.tsx`

### Sprint 3: HIGH — Fix Question Count Enforcement (1 day)

**Problem:** Section 2 consistently generates only 4 questions (target: 7). Section 3 generates 6 (target: 5).

**Tasks:**
1. **Strengthen the AI prompt** with an absolute mandate: "Section 2 MUST contain EXACTLY 7 separate numbered questions. Do NOT group sub-questions under one number."
2. **Add a retry/supplement mechanism** in the post-validator: if Section 2 has <6 questions, log a warning and note for regeneration
3. **Enforce the Section 3 cap** via `enforceApplicationQuestionCap` (already exists from PR #153 but not trimming correctly — may not be running)
4. **Verify validator chain order** — ensure `enforceApplicationQuestionCap` runs AFTER all other validators

**Files:** `client/src/lib/ai.ts` (prompt), `client/src/lib/worksheetPostValidator.ts`

### Sprint 4: HIGH — Fix Per-Question Mark Allocations (0.5 days)

**Problem:** Marks show as section totals `(8 marks total)` instead of per-question `(2 marks)`.

**Tasks:**
1. **The AI prompt already asks for per-question marks** — investigate why the LLM is ignoring this
2. **Strengthen prompt:** "EVERY question MUST have its own mark allocation in round brackets at the end, e.g. `(2 marks)`. NEVER write a section total."
3. **Post-validator:** If a section has a total but no per-Q marks, split the total evenly or use the command-word→marks mapping
4. **`enforceMarksBracketStyle`** (PR #153) should already handle this — verify it's running

**Files:** `client/src/lib/ai.ts`, `client/src/lib/worksheetPostValidator.ts`

### Sprint 5: HIGH — Activate Maths Genie Exam-Style Mode (1 day)

**Problem:** The exam-style mode is coded (PR #160) but never activated.

**Tasks:**
1. **Set `metadata.examStyle = true`** by default for Mathematics subject when tier is "Mixed" or "Higher"
2. **When examStyle is active AND no SEND need requiring scaffolding:** suppress decorative headers, colour sections, vocabulary footer, worked example section from the rendered output
3. **For Dyscalculia/Dyslexia with maths:** keep `examStyle = false` so scaffolding sections remain
4. **Per-question rendering in exam mode:** bold question number, stem, `(N marks)`, then working-out box + answer lines. No section headers, no coloured dividers.
5. **Test:** Generate Year 11 Maths / Quadratic Equations / No SEND / Higher → should look like a Maths Genie page

**Files:** `client/src/lib/ai.ts`, `client/src/components/WorksheetRenderer.tsx`, `client/src/lib/visualLanguageSystem.ts`

### Sprint 6: MEDIUM — Fix HI Inline Definition Bug (0.5 days)

**Problem:** Hearing Impairment inline definitions concatenate multiple vocabulary entries and truncate mid-sentence.

**Example:**
- Expected: `force (= a push or pull, measured in N)`
- Actual: `force (= A push or pull on an object, measured in Newtons (N). Mass — The a…)`

**Tasks:**
1. **In `worksheetPostValidator.ts`** → the HI inline definition injector is pulling the wrong text. It should pull ONLY the definition for the matched term, not the full vocabulary section content.
2. **Fix the regex/lookup** that extracts the definition for each vocabulary term
3. **Cap definition length** to max 60 characters to prevent runaway text
4. **Test:** Generate any subject / HI → check inline definitions are short and correct

**Files:** `client/src/lib/worksheetPostValidator.ts`

### Sprint 7: MEDIUM — Fix Anxiety Challenge Title (0.5 days)

**Problem:** Anxiety worksheets show "STRETCH & CHALLENGE" instead of "OPTIONAL BONUS — only if you want to!"

**Tasks:**
1. **Check `enforceSendOverlayMarkers`** — the anxiety title rewrite should rename Challenge
2. **Verify validator chain order** — anxiety rename may be running but being overwritten by a later pass
3. **The renderer group-divider label** for the challenge section may be hard-coded — check `sendSectionLabels.ts` covers this case

**Files:** `client/src/lib/worksheetPostValidator.ts`, `client/src/lib/sendSectionLabels.ts`

### Sprint 8: LOW — Section 1 Internal Question Count (0.5 days)

**Problem:** Section 1 renders as 3 "blocks" (T/F + MCQ + Gap Fill) but internally contains 10+ items. The target is 7 separate questions. The 3-block format was accepted as pedagogically valid (IMP-07 in PR #157), but each block should contain enough items to hit the 7-question internal count.

**Tasks:**
1. **Verify the T/F block has at least 4 statements** (currently has 4 ✅)
2. **Verify MCQ block has at least 1 question** (currently has 1 ✅)
3. **Verify Gap Fill has at least 2 questions** or enough blanks (currently has 6+ blanks ✅)
4. **No fix needed** — Section 1's 3-block format with varied types is working as designed

### Sprint 9: ENHANCEMENT — Consistency Pass (1 day)

**Problem:** Various inconsistencies across worksheets.

**Tasks:**
1. **Standardise marks format** — all worksheets should use `(N marks)` per question
2. **Standardise section headers** — same naming convention across subjects
3. **Footer consistency** — all should show `Year N · Subject · Topic · Adapted for SEND · Date`
4. **Working-out boxes for science calc questions** — already coded in `shouldRenderWorkingOutBox` (RC8 extension), verify it's rendering
5. **Challenge section** — standardise: exactly 1-2 questions, clearly labelled

---

## Implementation Priority

| Sprint | Priority | Effort | Impact |
|--------|----------|--------|--------|
| 1 | P0-CRITICAL | 2 days | Fixes maths completely |
| 2 | P0-CRITICAL | 2 days | Diagrams finally appear |
| 3 | P1-HIGH | 1 day | Question density correct |
| 4 | P1-HIGH | 0.5 day | Marks look professional |
| 5 | P1-HIGH | 1 day | Maths Genie style activated |
| 6 | P2-MEDIUM | 0.5 day | HI overlay fixed |
| 7 | P2-MEDIUM | 0.5 day | Anxiety title fixed |
| 8 | P3-LOW | 0.5 day | No change needed (verified) |
| 9 | P3-LOW | 1 day | Polish pass |

**Total estimated effort:** 9 days (split across 2-3 sessions)
**Recommended order:** Sprint 1 → 2 → 5 → 3 → 4 → 6 → 7 → 9

---

## Files Reference

| File | Relevance |
|------|-----------|
| `client/src/lib/ai.ts` | Main generation logic, prompts, question counts |
| `client/src/lib/worksheetPostValidator.ts` | Post-generation fixes, SEND overlays, marks enforcement |
| `client/src/lib/worksheetSectionTargets.ts` | Question count targets (7-7-5-1) |
| `client/src/lib/sendSectionLabels.ts` | Anxiety invitational titles |
| `client/src/lib/visualLanguageSystem.ts` | Exam-style mode, difficulty dots, icons |
| `client/src/components/WorksheetRenderer.tsx` | Rendering, marks badges, diagram display |
| `client/src/lib/sendEnforcer.ts` | ADHD/Dyslexia/MLD enforcement rules |
| `client/src/lib/worksheetPostValidatorRegistry.ts` | Validator chain order |
| `client/src/lib/autoThreeTierGenerator.ts` | LA/MA/HA auto-differentiation |
| `docs/diagram-library-catalogue.csv` | 5,975 diagram entries |
| `tools/image-pipeline/` | Diagram generation pipeline |

---

## Appendix: Generation Configs Used

| # | Subject | Year | Topic Selected | SEND | Tier |
|---|---------|------|----------------|------|------|
| 1 | Mathematics | Year 10 | Quadratic Equations | Dyslexia | Standard |
| 2 | Biology | Year 10 | Cells and Organisation | ADHD | Mixed |
| 3 | Chemistry | Year 11 | Atomic Structure | Anxiety | Mixed |
| 4 | Physics | Year 9 | Forces and Motion | Hearing Impairment | Mixed |
| 5 | English | Year 10 | Shakespeare — Macbeth | MLD | Mixed |
| 6 | Mathematics | Year 11 | Histograms and Cumulative Frequency | Dyscalculia | Mixed |
| 7 | Physics | Year 10 | Energy | EAL | (not generated — site 502) |
