# Live Worksheet Generator Audit - June 2026

## Status: IN PROGRESS
**Session started:** 2026-06-03
**Worksheets generated:** 1 of 7
**Method:** Playwright + Chromium headless against live site (adaptly.co.uk)

---

## How to Resume This Audit

1. Clone the repository and ensure Playwright + Chromium are installed
2. Login credentials: admin@adaptly.co.uk / Admin1234!
3. Navigate: Login -> SEND Hub -> SEND Worksheets (/worksheets)
4. Dismiss the "AI Best Practices" modal (click "I Accept")
5. Use the generation script pattern from `audit/full-audit-2026.mjs` or the inline scripts below
6. Generate remaining worksheets (2-7) per the config below
7. Compare output against codebase expectations documented in this file

---

## Worksheet Generation Configs (7 total, all KS3/KS4)

| # | Subject | Year | Topic | SEND Need | Difficulty | Board |
|---|---------|------|-------|-----------|------------|-------|
| 1 | Mathematics | Year 10 | Quadratic Equations | Dyslexia | Standard | AQA |
| 2 | Biology | Year 10 | Cell Biology | ADHD | Standard | AQA |
| 3 | Chemistry | Year 11 | Atomic Structure | Anxiety | Standard | AQA |
| 4 | Physics | Year 9 | Forces and Motion | Hearing Impairment | Standard | AQA |
| 5 | English | Year 10 | Macbeth | MLD | Standard | AQA |
| 6 | Mathematics | Year 11 | Histograms and Cumulative Frequency | Dyscalculia | Standard | AQA |
| 7 | Physics | Year 10 | Energy | EAL | Standard | AQA |

---

## Worksheet 1: Maths / Year 10 / Quadratic Equations / Dyslexia / AQA

### Raw Output Captured

```
Adaptly · mathematics · Year 10
Quadratic Equations — Year 10 Mathematics Worksheet
Year 10 | Mathematics | mixed
NAME | DATE 03/06/2026 | CLASS
adaptly.co.uk

Quadratic Equations · Year 10

[1] Answer all questions. Show all working.
1. Factorise x²+6x+8.
2. Solve x²−7x+12=0 by factorisation.
3. Use the quadratic formula to solve x²+3x−10=0.
4. Calculate the discriminant for the equation 2x²−5x+3=0.
(8 marks)

[2] Answer all questions. Show all working.
1. Solve x²−100=0.
2. Solve 3x²−12x=0.
3. Use the quadratic formula to solve x²−4x−7=0, giving your answers to 3 significant figures.
4. Show that the equation x²+5x+1=0 has two real roots.
5. A rectangular garden has a length that is 3 metres longer than its width. The area of the garden is 40 m².
   (a) Let the width be w metres. Write an expression for the length.
   (b) Form a quadratic equation for the area of the garden.
   (c) Calculate the width of the garden.
6. Solve the equation x/2 + 3/x = 4.
(20 marks)

[3] ★ Challenge yourself! Show all working.
1. A farmer wants to fence a rectangular field with an area of 150 m². The length of the field is 5 metres more than twice its width. Calculate the dimensions of the field.
2. Solve the equation x²−6x+7=0 using the quadratic formula. Leave your answer in surd form.
(8 marks)

Footer: Year 10 · Mathematics · Quadratic Equations · Adapted for Dyslexia · 03/06/2026
Rate this lesson:
```

### Structural Analysis vs Codebase Expectations

| Expected (from codebase) | Actual | Status |
|---|---|---|
| 14-section canonical structure (header, LO, retrieval, vocabulary, common-mistakes, worked-example, diagram-a, recall, understanding, diagram-b, application, challenge, reflection, teacher-key) | Only 3 visible sections (numbered 1, 2, 3 + Challenge) | ❌ FAIL |
| Section 1 (Recall): 6-8 questions | Section [1]: 4 questions | ❌ FAIL |
| Section 2 (Understanding): 6-8 questions | Section [2]: 6 questions (with sub-parts) | ⚠️ PARTIAL |
| Section 3 (Application): exactly 5 exam-style questions | Section [3] (Challenge): 2 questions | ❌ FAIL |
| Marks format: `(N marks)` for Section 3, `[N marks]` for others | Shows total marks per section `(8 marks)`, `(20 marks)`, `(8 marks)` | ❌ FAIL - no per-question marks |
| Per-question answer lines scaled by marks | Not visible in text output (would need visual check) | ⚠️ UNKNOWN |
| Working-out boxes for maths calculation questions | Not visible in text output | ⚠️ UNKNOWN |
| Learning Objective section | ABSENT | ❌ FAIL |
| Vocabulary section | ABSENT | ❌ FAIL |
| Common Misconceptions section | ABSENT | ❌ FAIL |
| Worked Example section | ABSENT | ❌ FAIL |
| Self-Reflection section (RAG rating) | ABSENT | ❌ FAIL |
| Revision Tips section | ABSENT | ❌ FAIL |
| Difficulty dots (●/●●/●●●) from visual language system | ABSENT | ❌ FAIL |
| Response-type icons (□/○/✎) | ABSENT | ❌ FAIL |

### SEND Overlay Analysis (Dyslexia)

| Expected Dyslexia Adaptation | Actual | Status |
|---|---|---|
| Method-steps box inserted before Section A | ABSENT | ❌ FAIL |
| Dyslexia-friendly formatting (font, spacing, etc.) | Footer says "Adapted for Dyslexia" but no visible adaptation in content | ⚠️ PARTIAL |
| Word bank on extended questions | ABSENT | ❌ FAIL |

### Visual/Layout Analysis (from screenshot)

- The worksheet renders in a clean, minimal layout
- LaTeX math rendering is working correctly (quadratic expressions display properly)
- Section headers use coloured backgrounds (blue/teal gradient)
- Header contains: subject, year group, topic, name/date/class fields
- Footer branding is present
- "Rate this lesson" appears at the bottom (emoji rating)
- NO visible scaffolding sections (vocabulary, worked example, etc.)
- NO visible SEND-specific content modifications beyond the label

### Key Issues Identified in Worksheet 1

1. **Missing canonical sections**: The 14-section structure defined in `worksheet-generator.ts` is NOT being produced. Only basic question sections appear.
2. **Question counts wrong**: Section 1 has 4 questions (should be 6-8), Section 3/Challenge has only 2 (should be 5 exactly).
3. **No per-question marks**: Marks are shown as section totals rather than per-question `(N marks)` format.
4. **SEND overlay not applied to content**: The Dyslexia SEND need is acknowledged in the footer but does NOT produce the expected content adaptations (method-steps box, word bank, etc.)
5. **No pedagogical structure**: Missing LO, vocabulary, common misconceptions, worked example, self-reflection, revision tips sections.
6. **Maths Genie comparison**: This output is FAR from the Maths Genie style. Maths Genie worksheets have: numbered questions with individual mark allocations, generous working space, clean question-per-line layout, no decorative headers, no scaffolding - just pure exam-style questions. The current output is closer to this minimal style BUT lacks individual mark allocations and proper question density.

---

## Remaining Worksheets to Generate (2-7)

These need to be generated in a follow-up session using the configs in the table above.

---

## Reference: Maths Genie Style (from yesgenie.com)

The user wants maths worksheets to look more like Maths Genie / Yes Genie booklets. Key characteristics:
- Pure exam-style questions, no scaffolding
- Individual mark allocations per question in brackets
- Clean, monochrome layout
- Bold question numbers
- Generous working space between questions
- No decorative elements (no coloured headers, no icons)
- Questions progress from easier to harder
- Mix of command words (Calculate, Show that, Solve, Find, etc.)
- Real GCSE exam paper density and style

---

## Preliminary Improvement Plan (to be expanded after full audit)

### Priority 1: Critical Structural Issues
1. The AI is NOT generating the full 14-section canonical structure
2. Section question counts are not meeting targets
3. Per-question mark allocations are missing
4. SEND overlays are not modifying content

### Priority 2: Maths Genie Style Implementation
1. Implement exam-style mode for maths (already partially coded in `visualLanguageSystem.ts`)
2. Suppress decorative headers in exam mode
3. Per-question marks in `(N marks)` format
4. Wider working space
5. Progressive difficulty within sections
6. Mix of GCSE command words

### Priority 3: SEND Adaptation Enforcement
1. Verify post-validators are running
2. Ensure SEND-specific content is injected
3. Test each SEND profile produces distinct output

---

## Files to Reference for Implementation

- `client/src/lib/worksheet-generator.ts` - Canonical 14-section structure definition
- `client/src/lib/ai.ts` - AI prompt assembly and generation logic
- `client/src/lib/worksheetPostValidator.ts` - Post-generation validation/fix pipeline
- `client/src/lib/worksheetSectionTargets.ts` - Question count targets
- `client/src/lib/visualLanguageSystem.ts` - Visual language (dots, icons, exam-style mode)
- `client/src/components/WorksheetRenderer.tsx` - Rendering logic
- `client/src/lib/worksheetScrutinyValidators.ts` - Scrutiny validators
- `docs/IMPROVEMENT-PLAN-JUNE-2026.md` - Previous improvement plan (if exists)
- `audit/IMPROVEMENTS.md` - Previous audit findings
