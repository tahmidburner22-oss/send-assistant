# Worksheet Generator - Comprehensive Improvements List

**Date:** 30 May 2026
**Source:** Live audit of 9 worksheets across 6 SEND profiles + 1 baseline
**Auditor:** Automated (Playwright 1.60.0 + Chromium 148 headless)
**Site:** https://adaptly.co.uk

---

## Executive Summary

### Audit Scope

| Session | Worksheets | SEND Profiles Tested | Method |
|---------|-----------|---------------------|--------|
| Session 1 (original) | 5 generated (WS1-WS6, one failed) | HI, ADHD, MLD, Dyscalculia, Anxiety | Playwright headless |
| Session 2 (retest) | 4 generated (R1-R4, 2 failed) | HI, ADHD, Anxiety, MLD | Playwright headless |
| **Total** | **9 worksheets analysed** | **6 profiles + baseline** | |

### Pass/Fail Summary

| Category | Pass | Fail | Pass Rate |
|----------|------|------|-----------|
| Phase 1 - Structure | 15 | 25 | **38%** |
| Phase 2 - Self-Reflection | 20 | 0 | **100%** |
| Phase 3 - Examiner Tips | 15 | 10 | **60%** |
| Phase 4 - SEND Overlays | 10 | 9 | **53%** |
| Phase 5 - Curriculum Authority | 20 | 0 | **100%** |
| **TOTAL** | **80** | **44** | **65%** |

### Critical Bugs: 2 (student-facing data leak + content corruption)
### Structural Issues: 5 (systemic across all worksheets)
### SEND Overlay Gaps: 7 (per-profile missing features)
### Tips/Content Issues: 10 (quality and consistency)

---

## Per-Worksheet Audit Results

### Session 1 (Original 5 Worksheets)

| # | Topic | SEND | S1 | S2 | S3 | Tips | SEND-specific | Bugs |
|---|-------|------|----|----|-----|------|---------------|------|
| WS1 | Bioenergetics | HI | 3 blocks | 5 Qs | 6 Qs | 5 tips (generic T1) | 3/5 pass | TEACHER_DIAGNOSES leak |
| WS2 | Forces | ADHD | 3 blocks | 4 Qs | 6 Qs | 5 tips (generic T1) | 3/4 pass | None |
| WS4 | Atomic Structure | MLD | 3 blocks | 4 Qs | 6 Qs | 5 tips (generic T1) | 2/4 pass | TEACHER_DIAGNOSES leak |
| WS5 | Energy | Dyscalculia | 3 blocks | 4 Qs | 6 Qs | 5 tips (generic T1) | 1/3 pass | Cue corruption + DIAGNOSES |
| WS6 | Electricity | Anxiety* | 3 blocks | 5 Qs | 6 Qs | 5 tips (generic T1) | 1/3 pass | TEACHER_DIAGNOSES leak |

*WS6 was intended as EAL but dropdown selected Anxiety due to option ordering.

### Session 2 (Fresh Retest - 4 Worksheets)

| # | Topic | SEND | S1 | S2 | S3 | Tips | SEND-specific | Bugs |
|---|-------|------|----|----|-----|------|---------------|------|
| R1 | Bioenergetics | HI | 3 blocks | 5 Qs | 6 Qs | 5 tips (terms listed!) | Topic Summary present | None new |
| R2 | Forces | ADHD | 3 blocks | 4 Qs | 6 Qs | 5 tips | 1 brain-break only | None new |
| R3 | Cell Biology | Anxiety | 3 blocks | 4 Qs | 6 Qs | 5 tips (generic T1) | Titles NOT invitational | None new |
| R4 | Atomic Structure | MLD | 3 blocks | 4 Qs | 6 Qs | 5 tips (generic T1) | Context block works | TEACHER_DIAGNOSES leak |

---

## P1 - CRITICAL (Fix Before Pilot)

These are student-facing bugs that corrupt output or leak internal data.

---

### IMP-01: TEACHER_DIAGNOSES Leaking into Student View

| Field | Detail |
|-------|--------|
| **ID** | IMP-01 |
| **Priority** | P1-CRITICAL |
| **Category** | Data Leak |
| **Observed in** | WS1 (HI), WS4 (MLD), WS5 (Dyscalculia), WS6 (Anxiety), R4 (MLD) |
| **Reproducibility** | 5/9 worksheets (56%) |

**What is wrong:**
Internal diagnostic metadata lines like `TEACHER_DIAGNOSES: A=s-mass-01` and `TEACHER_DIAGNOSES: A=s-unit-01, B=s-unit-01, D=s-unit-01` appear in the student-facing rendered text of MCQ sections. This exposes answer keys and internal misconception codes to students.

**Evidence:**
- WS1-HI MCQ: `TEACHER_DIAGNOSES: A=m-frac-02, C=m-frac-01`
- WS5-Dyscalculia MCQ: `TEACHER_DIAGNOSES: B=s-energy-01`
- WS6-Anxiety MCQ: `TEACHER_DIAGNOSES: A=s-unit-01, B=s-unit-01, D=s-unit-01`
- R4-MLD MCQ: `TEACHER_DIAGNOSES: A=s-mass-01`

**Files to change:**
1. `client/src/lib/worksheetPostValidator.ts` (L680-730) - stripping code exists but fails
2. `client/src/components/WorksheetRenderer.tsx` - add final safety-net strip

**Proposed fix:**
1. Debug why the existing stripping code at L680-730 in `worksheetPostValidator.ts` does not propagate. The code parses and strips from the `content` string but the text still reaches the rendered page. Likely cause: validator output is not fed back to the renderer, or the renderer re-reads from a pre-validated source.
2. Add a global regex replace in the post-validator: `content.replace(/^TEACHER_DIAGNOSES:.*$/gm, "")`
3. Add a final safety net in `WorksheetRenderer.tsx` that strips any line matching `/TEACHER_DIAGNOSES/` before rendering.
4. Move TEACHER_DIAGNOSES data to a separate `question.teacherMeta` field that is only shown in Teacher view toggle.

**Test criterion:**
- Generate any worksheet with MCQ section
- Switch to Student view
- Search rendered text for "TEACHER_DIAGNOSES"
- Must return 0 matches
- Automated: `expect(studentViewText).not.toContain("TEACHER_DIAGNOSES")`

---

### IMP-02: Dyscalculia Number-Tracking Cue Corrupts Question Numbering

| Field | Detail |
|-------|--------|
| **ID** | IMP-02 |
| **Priority** | P1-CRITICAL |
| **Category** | Content Corruption |
| **Observed in** | WS5 (Dyscalculia/Energy) |
| **Reproducibility** | 100% for Dyscalculia worksheets |

**What is wrong:**
The number-tracking cue ("Numbers in this question: X, Y, Z. Underline each one as you read so you do not lose them.") is appended to question content using a newline separator. The renderer then interprets the newline-separated text as a new numbered item, creating:
- Duplicate question numbers (two items labelled "4.")
- Spurious mark allocations (`[2 marks]` on the cue text itself)
- Inflated question counts in S2 and S3

**Evidence:**


Also in Gap Fill:


**Files to change:**
1. `client/src/lib/worksheetPostValidator.ts` (L1718-1755) - `enforceDyscalculiaMarkers` function
2. `client/src/lib/sendEnforcer.ts` - cue injection logic

**Root cause:**
`enforceDyscalculiaMarkers` at L1718-1755 appends the cue as `content + "\n\nNumbers in this question: ..."`. The double-newline causes the renderer to treat subsequent text as a new numbered paragraph.

**Proposed fix:**
1. Change the injection method: instead of appending to the content string with newlines, wrap the cue in a dedicated annotation structure (e.g., `{ type: "send-cue", text: "Numbers in this question..." }`) that the renderer displays inline or as a styled callout box beneath the question.
2. If structural change is too large: at minimum, append with a single space or use an inline format like `[Cue: Numbers in this question: X, Y, Z - underline each one]` that the renderer does not treat as a new paragraph.
3. Add assertion: after cue injection, verify question count has not changed.

**Test criterion:**
- Generate Dyscalculia worksheet
- Count numbered questions in S2 and S3
- Must match target counts (S2=6-8, S3=5) exactly
- No question should have duplicate numbering
- No line starting with a number should contain only cue text
- Automated: `expect(s3Questions.length).toBe(5)`

---

### IMP-03: Prompt Instructions Leaking into Student View

| Field | Detail |
|-------|--------|
| **ID** | IMP-03 |
| **Priority** | P1-CRITICAL |
| **Category** | Data Leak |
| **Observed in** | R4 (MLD), WS5 (Dyscalculia) |
| **Reproducibility** | Seen in Gap Fill sections |

**What is wrong:**
Internal prompt instructions like `RULE: EXACTLY 7 sentences, EXACTLY 7 blanks...` are visible in the student-facing text after the Gap Fill word bank. These are AI system prompt constraints that should never be rendered.

**Evidence:**
- R4-MLD output: "RULE: EXACTLY 7 sentences, EXACTLY 7 blanks..." visible after word bank
- WS5-Dyscalculia: Same instruction text visible

**Files to change:**
1. `client/src/lib/worksheetPostValidator.ts` - add stripping rule
2. `client/src/components/WorksheetRenderer.tsx` - final safety net

**Proposed fix:**
1. Add a post-validator rule that strips any line matching `/^RULE:.*/gm` from student-visible content.
2. More broadly, add a "prompt leak detector" that strips any line matching common prompt instruction patterns: `RULE:`, `INSTRUCTION:`, `NOTE TO AI:`, `SYSTEM:`, etc.
3. Add to WorksheetRenderer as a final safety net.

**Test criterion:**
- Generate any worksheet
- Search rendered student text for "RULE:"
- Must return 0 matches
- Automated: `expect(studentViewText).not.toMatch(/^RULE:/m)`

---

## P2 - HIGH (Fix Within Sprint 1)

Spec violations that affect assessment validity. Systemic across all worksheets.

---

### IMP-04: Section 3 Generates 6 Questions (Should Be Exactly 5)

| Field | Detail |
|-------|--------|
| **ID** | IMP-04 |
| **Priority** | P2-HIGH |
| **Category** | Structure |
| **Observed in** | ALL 9 worksheets |
| **Reproducibility** | 100% systemic |

**What is wrong:**
Section 3 (Application & Analysis) consistently generates 6 exam-style questions. The specification and `worksheetSectionTargets.ts` both define `application: { min: 5, target: 5, max: 5 }`. The validator function `enforceSectionQuestionCounts` only WARNS when the count exceeds max; it does not trim excess questions.

**Evidence:**
- R1-HI: 6 questions in S3
- R3-Anxiety: 6 questions in S3
- R4-MLD: 6 questions in S3
- WS1-WS6: ALL had 6 S3 questions
- 9/9 worksheets affected

**Files to change:**
1. `client/src/lib/worksheetSectionTargets.ts` - verify targets (already correct)
2. `client/src/lib/ai.ts` - strengthen prompt constraint
3. `client/src/lib/worksheetPostValidator.ts` - add hard enforcement (trim excess)

**Proposed fix:**
1. In `ai.ts` Section 3 prompt: change from "Generate 5 exam-style questions" to "Generate EXACTLY 5 exam-style questions. You MUST NOT generate more than 5. Stop after question 5."
2. In `worksheetPostValidator.ts` `enforceSectionQuestionCounts`: change from warning to active trimming - if S3 has >5 questions, remove the last N questions until count equals 5.
3. Add a hard assertion that throws if trimming would reduce below min.

**Test criterion:**
- Generate 3 worksheets with different topics and SEND profiles
- Section 3 must have EXACTLY 5 questions in ALL
- Automated: `expect(section3.questions.length).toBe(5)`

---

### IMP-05: Section 2 Under-Generates (4 Questions Instead of 6-8)

| Field | Detail |
|-------|--------|
| **ID** | IMP-05 |
| **Priority** | P2-HIGH |
| **Category** | Structure |
| **Observed in** | ALL 9 worksheets |
| **Reproducibility** | 100% systemic |

**What is wrong:**
Section 2 (Understanding) consistently generates only 4-5 questions. The target in `worksheetSectionTargets.ts` is `understanding: { min: 6, target: 7, max: 8 }`. The AI prompt requests 7 but the AI routinely generates only 4. No enforcement mechanism exists to retry or supplement.

**Evidence:**
- R1-HI: 5 questions in S2
- R2-ADHD: 4 questions in S2
- R3-Anxiety: 4 questions in S2
- R4-MLD: 4 questions in S2
- WS2-ADHD: 4 questions
- WS4-MLD: 4 questions

**Files to change:**
1. `client/src/lib/ai.ts` - strengthen S2 prompt
2. `client/src/lib/worksheetSectionTargets.ts` - verify targets
3. `client/src/lib/worksheetPostValidator.ts` - add retry/supplement logic

**Proposed fix:**
1. In `ai.ts` S2 prompt: "Generate EXACTLY 7 questions for Section 2. Each question MUST be on a separate numbered line. You MUST generate at least 6 questions. Do not stop before question 6."
2. Add explicit examples showing 7 questions in the few-shot prompt.
3. In post-validator: if S2 count < 6, either trigger a supplementary AI call for additional questions OR raise a p1 validation error that forces regeneration.
4. Investigate whether total mark budget is constraining - if marks are capped too low, the AI stops generating early.

**Test criterion:**
- Generate 3 worksheets with different topics
- Section 2 must contain 6-8 individually numbered questions
- Automated: `expect(section2.questions.length).toBeGreaterThanOrEqual(6)`

---

### IMP-06: Marks Format Uses [N marks] Instead of (N marks)

| Field | Detail |
|-------|--------|
| **ID** | IMP-06 |
| **Priority** | P2-HIGH |
| **Category** | Structure / GCSE Compliance |
| **Observed in** | ALL 9 worksheets |
| **Reproducibility** | 100% systemic |

**What is wrong:**
All worksheets use square bracket format `[2 marks]`, `[4 marks]` throughout. The GCSE paper convention uses round brackets `(2 marks)`. The AI prompt at `ai.ts` L1456 instructs S3 to use `(N marks)` but the AI consistently ignores this. No post-validator safety net exists to globally replace brackets.

**Evidence:**
- Every single question in S2 and S3 across all 9 worksheets uses `[N marks]`
- Zero instances of `(N marks)` found

**Files to change:**
1. `client/src/lib/ai.ts` (L1456) - reinforce prompt instruction
2. `client/src/lib/worksheetPostValidator.ts` - add global replacement rule

**Proposed fix:**
1. In `ai.ts` for both S2 and S3 prompts: "IMPORTANT: Mark allocations MUST use round brackets: (2 marks), (4 marks). Do NOT use square brackets."
2. In `worksheetPostValidator.ts` add a deterministic fix: `content.replace(/\[(\d+)\s*marks?\]/gi, '($1 marks)')` - this guarantees correct format regardless of AI output.
3. This is the simplest and most reliable fix of all improvements.

**Test criterion:**
- Generate any worksheet
- All mark indicators must use `(N marks)` format
- Zero instances of `[N marks]` in rendered text
- Automated: `expect(text).not.toMatch(/\[\d+\s*marks?\]/)`

---

### IMP-07: Section 1 Uses 3 Composite Blocks Instead of 6-8 Individual Questions

| Field | Detail |
|-------|--------|
| **ID** | IMP-07 |
| **Priority** | P2-HIGH |
| **Category** | Structure |
| **Observed in** | ALL 9 worksheets |
| **Reproducibility** | 100% systemic |

**What is wrong:**
Section 1 (Recall) is generated as 3 composite blocks: True/False block + MCQ block + Gap Fill block. Each block contains internal items but they are grouped, not individually numbered 1-8. The spec says "6-8 individually numbered questions".

**Evidence:**
- All worksheets show: Q1=True/False (4 statements), Q2=MCQ (4 options), Q3=Gap Fill (7 blanks)
- Internal items exist but are not individually numbered as separate questions
- Total internal items often exceed 8 but are presented as 3 questions

**Files to change:**
1. `client/src/lib/ai.ts` - S1 generation prompt

**Proposed fix:**
Option A (recommended): Accept current format as pedagogically valid but redefine spec. The 3-block format (T/F + MCQ + Gap Fill) provides variety and covers recall effectively. Update the audit criteria to say "3 varied-type recall blocks with 6-8 total internal items" rather than "6-8 individually numbered questions".

Option B (strict compliance): Restructure S1 prompt to generate 6-8 separate recall questions of mixed types (some T/F, some MCQ, some short-answer) each individually numbered.

**Decision required:** Product decision on whether current format is acceptable.

**Test criterion (if Option B):**
- Generate worksheet and count individually numbered S1 questions
- Must be 6-8 separate items
- Automated: `expect(section1.questions.length).toBeGreaterThanOrEqual(6)`

---

### IMP-08: No Per-Question "Working Out:" Box in Section 3

| Field | Detail |
|-------|--------|
| **ID** | IMP-08 |
| **Priority** | P2-HIGH |
| **Category** | Structure |
| **Observed in** | ALL 9 worksheets |
| **Reproducibility** | 100% systemic |

**What is wrong:**
All worksheets have a single "Show your working:" prompt at the end of Section 3. The spec requires an explicit working-out space per S3 question, so students have a designated area for each calculation/extended response.

**Evidence:**
- All 9 worksheets: one "Show your working:" at section end
- No individual "Working out:" boxes per question

**Files to change:**
1. `client/src/lib/ai.ts` - S3 prompt to include per-question working space
2. Possibly `client/src/components/WorksheetRenderer.tsx` - render working boxes

**Proposed fix:**
1. In `ai.ts` S3 prompt: after each question, include "Working out:" followed by blank space/lines.
2. In the renderer: style "Working out:" as a boxed area with adequate white space for handwriting.
3. Alternative: Add a post-processing step that inserts "Working out:" between each S3 question and its mark allocation.

**Test criterion:**
- Generate any worksheet
- Each S3 question must have its own "Working out:" space before the mark allocation
- Automated: count "Working out:" occurrences in S3 = number of S3 questions

---

### IMP-09: Mark Allocations Do Not Match Question Demand

| Field | Detail |
|-------|--------|
| **ID** | IMP-09 |
| **Priority** | P2-HIGH |
| **Category** | Content Quality / Assessment |
| **Observed in** | R1, R3, R4, WS1-WS6 |
| **Reproducibility** | Frequent |

**What is wrong:**
All S3 questions receive identical mark allocations (typically `[4 marks]`) regardless of command word complexity. A "State" question (1-mark demand) gets the same marks as an "Evaluate" question (6-mark demand). This misrepresents GCSE marking conventions.

**Evidence:**
- S3 Q1 "State the chemical formula for glucose" = [4 marks] (should be 1-2)
- S3 Q2 "Identify the waste products of aerobic respiration" = [4 marks] (should be 1-2)
- All S3 questions uniformly get [4 marks]

**Files to change:**
1. `client/src/lib/ai.ts` - mark allocation logic in S3 prompt

**Proposed fix:**
1. Add command-word-to-marks mapping in the prompt:
   - State/Name/Give = 1 mark
   - Identify/Define = 1-2 marks
   - Describe/Explain = 2-4 marks
   - Compare/Analyse = 4-6 marks
   - Evaluate/Discuss = 6 marks
2. In the S3 prompt: "Allocate marks based on command word demand. State=1, Describe=3, Explain=4, Compare=5, Evaluate=6. The total S3 marks should be 20-25."
3. In post-validator: flag if all S3 questions have identical marks.

**Test criterion:**
- Generate worksheet with varied command words in S3
- Mark allocations must vary (not all identical)
- State/Name questions must be 1-2 marks
- Evaluate/Discuss must be 5-6 marks
- Automated: `expect(new Set(s3Marks).size).toBeGreaterThan(1)`

---

## P3 - MEDIUM (Fix Within Sprint 2)

SEND overlay gaps where features are specified but not working correctly.

---

### IMP-10: Anxiety Section Titles NOT Invitational in Live Output

| Field | Detail |
|-------|--------|
| **ID** | IMP-10 |
| **Priority** | P3-MEDIUM |
| **Category** | SEND Overlay (Anxiety) |
| **Observed in** | R3-Anxiety, WS6-Anxiety |
| **Reproducibility** | 100% for Anxiety worksheets |

**What is wrong:**
Anxiety worksheets display standard section titles ("SECTION 1 - RECALL - QUESTIONS 1-9", "SECTION 2 - UNDERSTANDING", "SECTION 3 - APPLICATION & ANALYSIS") instead of the anxiety-adapted invitational versions. The code EXISTS in `enforceAnxietySectionTitles` with passing unit tests, but it does NOT work in live output.

The Challenge section shows "Challenge yourself!" instead of "OPTIONAL BONUS - only if you want to!"

**Root cause hypothesis:** The validator runs AFTER render, or the section type detection regex does not match the actual generated section format (e.g., looking for `type: "challenge"` but actual sections use different type labels).

**Evidence:**
- R3-Anxiety: "SECTION 1 - RECALL - QUESTIONS 1-9" (should be "WARM-UP (no pressure - you've got this!)")
- R3-Anxiety: "Challenge yourself!" (should be "OPTIONAL BONUS - only if you want to!")

**Files to change:**
1. `client/src/lib/worksheetPostValidator.ts` - `enforceAnxietySectionTitles` function
2. `client/src/lib/sendEnforcer.ts` - verify execution order
3. Pipeline/rendering order investigation needed

**Proposed fix:**
1. Debug the execution order: add logging to confirm `enforceAnxietySectionTitles` runs AND its output is used by the renderer.
2. Fix section type detection: the code likely looks for sections with specific type labels or title patterns that do not match what the AI actually generates. Update the regex/matching to handle actual format.
3. Verify the validator output feeds into the renderer (ARCH-1 issue).
4. Expected titles:
   - S1: "WARM-UP (no pressure - you have got this!)"
   - S2: "BUILDING YOUR UNDERSTANDING"
   - S3: "STRETCH YOURSELF (take your time)"
   - Challenge: "OPTIONAL BONUS - only if you want to!"

**Test criterion:**
- Generate Anxiety worksheet
- Section titles must use invitational language
- Challenge section must be labelled "OPTIONAL"
- Automated: `expect(s1Title).toContain("WARM-UP")`

---

### IMP-11: HI - No Inline (= definition) Annotations in Question Text

| Field | Detail |
|-------|--------|
| **ID** | IMP-11 |
| **Priority** | P3-MEDIUM |
| **Category** | SEND Overlay (Hearing Impairment) |
| **Observed in** | R1-HI, WS1-HI |
| **Reproducibility** | 100% for HI worksheets |

**What is wrong:**
Technical terms within questions are NOT annotated with inline definitions. Definitions exist only in the Key Vocabulary box at the top. Students with hearing impairment may have missed verbal explanations and need inline support at point of use.

The Topic Summary block works correctly (definitions at top), but no code injects inline `(= definition)` annotations where terms first appear in question text.

**Evidence:**
- R1-HI: Questions use "aerobic respiration" without inline annotation
- Expected: "aerobic respiration (= chemical breakdown of glucose using oxygen)"
- Definitions present in Key Vocabulary box but not inline

**Files to change:**
1. `client/src/lib/worksheetPostValidator.ts` or overlay engine - add inline annotation injection
2. `client/src/lib/sendPromptFragments.ts` - HI prompt additions

**Proposed fix:**
1. After generating HI worksheet, scan question text for terms matching the Key Vocabulary list.
2. On FIRST occurrence of each term per section, inject `(= plain definition)` inline.
3. Only annotate on first use per section to avoid visual clutter.
4. Use the vocabulary definitions already defined at the top as the source.
5. Example: "In aerobic respiration (= using oxygen to release energy from glucose), the products are..."

**Test criterion:**
- Generate HI worksheet
- At least 3 questions should contain `(= ...)` annotations for technical terms
- Each term annotated only on first occurrence per section
- Automated: `expect(text.match(/\(= [^)]+\)/g).length).toBeGreaterThanOrEqual(3)`

---

### IMP-12: ADHD - Only 1 Brain-Break (Should Scale with Worksheet Length)

| Field | Detail |
|-------|--------|
| **ID** | IMP-12 |
| **Priority** | P3-MEDIUM |
| **Category** | SEND Overlay (ADHD) |
| **Observed in** | R2-ADHD, WS2-ADHD |
| **Reproducibility** | 100% for ADHD worksheets |

**What is wrong:**
Only 1 brain-break is inserted at a fixed position (after Section 2). A 15+ question worksheet should have 2-3 brain-breaks spaced every ~5 questions. The code in `worksheet-generator.ts` L2628 places ONE at the midpoint; `sendEnforcer.ts` inserts one mid-Section B. No scaling logic exists.

**Evidence:**
- WS2-ADHD: exactly 1 brain-break after S2 Q4
- R2-ADHD: exactly 1 brain-break after S2
- Audit spec: "every ~25%, minimum 3 Qs apart"

**Files to change:**
1. `client/src/lib/sendEnforcer.ts` - brain-break placement logic
2. `client/src/lib/worksheet-generator.ts` (L2628) - midpoint logic

**Proposed fix:**
1. Count total questions across all sections.
2. Calculate break positions at ~25%, ~50%, ~75% through the worksheet.
3. Ensure minimum 3 questions between any two breaks.
4. For typical 15-question worksheet: insert breaks after Q4, Q8, Q12 (approximately).
5. Each break: "BRAIN BREAK - Stand up and stretch for 30 seconds before continuing!"
6. Scale: <10 Qs = 1 break, 10-15 Qs = 2 breaks, 16+ Qs = 3 breaks.

**Test criterion:**
- Generate ADHD worksheet with 15+ questions
- Must have >= 2 brain-break prompts
- Breaks must be spaced at least 3 questions apart
- Automated: `expect(brainBreaks.length).toBeGreaterThanOrEqual(2)`

---

### IMP-13: Dyscalculia - No 5-Step Recipe on Calculation Questions

| Field | Detail |
|-------|--------|
| **ID** | IMP-13 |
| **Priority** | P3-MEDIUM |
| **Category** | SEND Overlay (Dyscalculia) |
| **Observed in** | WS5-Dyscalculia |
| **Reproducibility** | 100% for Dyscalculia science worksheets |

**What is wrong:**
The dyscalculia overlay adds "Roughly, what answer do you expect?" prompts and "Numbers in this question" cues on calculation questions, but does NOT inject the 5-step calculation scaffold. A comment in code L1710 says "The full 5-step calculation recipe is handled by `reinforceDyscalculiaMathsScaffolding` (maths only)" - meaning science worksheets are excluded.

**Evidence:**
- WS5: "Roughly, what answer do you expect?" present on calc Qs
- WS5: "Numbers in this question: X, Y, Z" cues present
- NO 5-step scaffold (Step 1: Write formula, Step 2: Identify values, Step 3: Substitute, Step 4: Calculate, Step 5: Check units)

**Files to change:**
1. `client/src/lib/worksheetPostValidator.ts` (L1710 area) - extend to science
2. `client/src/lib/sendPromptFragments.ts` - dyscalculia prompt for science calc Qs

**Proposed fix:**
1. Extend `reinforceDyscalculiaMathsScaffolding` to also apply to Science worksheets when calculation questions are detected.
2. For science calc questions, use adapted 5-step recipe:
   - Step 1: Write the formula you need
   - Step 2: Identify the values from the question
   - Step 3: Substitute values into the formula
   - Step 4: Calculate (show each line of working)
   - Step 5: Write the answer with correct units
3. For non-calculation questions: inject lighter "vocabulary first" cue instead.
4. MUST fix IMP-02 first (cue injection method) to prevent corruption.

**Test criterion:**
- Generate Dyscalculia science worksheet with calculation questions
- Calc questions must show 5-step scaffold
- Non-calc questions must NOT have the scaffold
- Automated: `expect(calcQuestion.text).toContain("Step 1")`

**Dependency:** IMP-02 must be fixed first (injection method).

---

### IMP-14: MLD - No Formula Reference on Calculation Questions

| Field | Detail |
|-------|--------|
| **ID** | IMP-14 |
| **Priority** | P3-MEDIUM |
| **Category** | SEND Overlay (MLD) |
| **Observed in** | R4-MLD, WS4-MLD |
| **Reproducibility** | 100% for MLD worksheets with calc questions |

**What is wrong:**
MLD worksheets correctly show the topic context block ("Remember: in this worksheet we are working on...") but provide no formula reference boxes or working memory aids on individual calculation questions. The server prompt says "Add a Help Box with key facts/formulas" but nothing enforces it deterministically.

**Evidence:**
- R4-MLD: Q3 "Calculate the number of neutrons..." has NO formula hint
- Expected: a boxed hint like "Formula: Neutrons = Mass number - Atomic number"

**Files to change:**
1. `client/src/lib/sendPromptFragments.ts` - MLD prompt additions
2. `client/src/lib/worksheetPostValidator.ts` - post-generation injection

**Proposed fix:**
1. In MLD overlay: detect calculation questions (those starting with "Calculate", containing "work out", or requiring numeric answers).
2. For each calc question, inject a formula hint box: "HELP BOX: [relevant formula]"
3. Source formulas from the topic's curriculum data or from the worked example at the top.
4. Alternative: prompt the AI to include formula hints on calc questions for MLD, then validate they are present.

**Test criterion:**
- Generate MLD worksheet on a topic with calculations
- Each calculation question must have an associated formula/help box
- Automated: `expect(calcQuestion.text).toMatch(/HELP BOX|Formula:/)`

---

### IMP-15: EAL - Never Successfully Tested (Dropdown Selection Issue)

| Field | Detail |
|-------|--------|
| **ID** | IMP-15 |
| **Priority** | P3-MEDIUM |
| **Category** | SEND Overlay (EAL) / UI Bug |
| **Observed in** | Two failed generation attempts |
| **Reproducibility** | Blocked by UI issue |

**What is wrong:**
Two attempts to generate an EAL worksheet failed: first time "Anxiety" was selected instead of EAL (dropdown option ordering mismatch), second time the site went down. EAL criteria have NEVER been verified in live output:
- Inline glossary annotations
- Bilingual vocabulary support
- Sentence frames/starters
- Command-word decoder box

**Files to change:**
1. UI: SEND dropdown option ordering/selection logic
2. `client/src/lib/sendPromptFragments.ts` - EAL prompt (verify exists)
3. `client/src/lib/sendEnforcer.ts` - EAL enforcement (verify exists)

**Proposed fix:**
1. Fix the SEND dropdown so EAL can be reliably selected in automated tests.
2. Generate EAL worksheet and verify all criteria:
   - Inline glossary: key terms annotated at point of use
   - Bilingual vocabulary: key terms shown in English + home language
   - Sentence frames: structured sentence starters for free-response questions
   - Command-word decoder: table explaining what "Describe", "Explain", etc. mean
3. If EAL features are not implemented, add them.

**Test criterion:**
- Successfully generate EAL worksheet (dropdown must select correctly)
- Must contain inline glossary annotations
- Must contain sentence frames on extended questions
- Must contain command-word decoder table
- Automated: full EAL criteria checklist

---

### IMP-16: HI - Topic Summary Block Not Labelled "TOPIC SUMMARY"

| Field | Detail |
|-------|--------|
| **ID** | IMP-16 |
| **Priority** | P3-MEDIUM |
| **Category** | SEND Overlay (HI) |
| **Observed in** | R1-HI, WS1-HI |
| **Reproducibility** | 100% for HI worksheets |

**What is wrong:**
HI worksheets show: "Topic: Bioenergetics" + "Learning objective: ..." + "Key terms used in this worksheet: Respiration" + "This information is here because..." - this is functionally a topic summary but lacks the explicit "TOPIC SUMMARY" heading required by the audit spec.

**Evidence:**
- R1-HI: content present but no "TOPIC SUMMARY" heading
- Content works well functionally

**Files to change:**
1. `client/src/lib/worksheetPostValidator.ts` or overlay engine - add heading

**Proposed fix:**
1. In the HI overlay builder, prepend "TOPIC SUMMARY" as an explicit heading above the existing block.
2. Simple string prepend: add "## TOPIC SUMMARY\n\n" before the topic/LO/vocabulary block.

**Test criterion:**
- Generate HI worksheet
- Must contain explicit "TOPIC SUMMARY" heading
- Automated: `expect(text).toContain("TOPIC SUMMARY")`

---

### IMP-17: Post-Validator Fixes Do Not Reach Rendered DOM (Architecture Issue)

| Field | Detail |
|-------|--------|
| **ID** | IMP-17 |
| **Priority** | P3-MEDIUM |
| **Category** | Architecture / Pipeline |
| **Observed in** | IMP-01, IMP-10 (multiple fixes exist but do not work) |
| **Reproducibility** | Systemic |

**What is wrong:**
Multiple post-validator functions exist and have passing unit tests, but their fixes do not appear in the live rendered output. This suggests either:
- The validator output is not propagated to the renderer
- The renderer re-reads from a pre-validated source
- The validator runs on a copy of the data, not the actual rendered data

Affected features:
- TEACHER_DIAGNOSES stripping (code exists, still leaks)
- Anxiety section title rewriting (code exists with passing tests, still shows standard titles)

**Files to change:**
1. Pipeline code connecting validator output to renderer input
2. `client/src/components/WorksheetRenderer.tsx` - verify data source

**Proposed fix:**
1. Trace the data flow: AI output -> post-validator -> ??? -> renderer
2. Identify where the validated output diverges from renderer input
3. Ensure the renderer consumes the POST-validated data, not pre-validated
4. Add integration test: generate worksheet -> validate -> render -> assert fixes are visible
5. As a temporary workaround: add safety-net stripping directly in the renderer component.

**Test criterion:**
- Generate Anxiety worksheet with known validation targets
- Rendered DOM must reflect post-validator changes
- TEACHER_DIAGNOSES must not appear in rendered output
- Section titles must be invitational (if Anxiety)
- Integration test (not just unit test)

---

## P4 - LOW (Fix Within Sprint 3)

Polish items and consistency improvements.

---

### IMP-18: Tips Section - Tip 1 Generic (Does Not List Specific Terms)

| Field | Detail |
|-------|--------|
| **ID** | IMP-18 |
| **Priority** | P4-LOW |
| **Category** | Tips Quality |
| **Observed in** | R3-Anxiety, R4-MLD, WS2-WS6 |
| **Reproducibility** | Inconsistent (HI fixed, others not) |

**What is wrong:**
Tip 1 should list specific vocabulary terms from the worksheet. HI worksheets now correctly show "Learn these key terms first: Respiration, Aerobic, Anaerobic, Metabolism, ATP" but MLD and Anxiety worksheets still show generic text: "Re-read the Key Vocabulary box for {topic}..."

**Evidence:**
- R1-HI: "Learn these key terms first: Respiration, Aerobic, Anaerobic, Metabolism, ATP" - FIXED
- R4-MLD: "Re-read the Key Vocabulary box for atomic structure..." - NOT FIXED
- R3-Anxiety: "Re-read the Key Vocabulary box for cell biology..." - NOT FIXED

**Files to change:**
1. `client/src/lib/ai.ts` - tips generation prompt

**Proposed fix:**
1. In the tips prompt, change from generic cross-reference to explicit listing.
2. Extract the 5 vocabulary terms from the Key Vocabulary section and inject them into Tip 1.
3. Template: "Learn these key terms first: {term1}, {term2}, {term3}, {term4}, {term5}. Make sure you can define each one before starting."
4. Apply consistently across ALL SEND profiles, not just HI.

**Test criterion:**
- Generate worksheet for any SEND profile
- Tip 1 must list at least 3 specific vocabulary terms by name
- Must NOT say "Re-read the Key Vocabulary box"
- Automated: `expect(tip1).toMatch(/Learn these key terms|key terms first:/)`

---

### IMP-19: No Tip 6 Referencing Learning Objective

| Field | Detail |
|-------|--------|
| **ID** | IMP-19 |
| **Priority** | P4-LOW |
| **Category** | Tips Completeness |
| **Observed in** | ALL 9 worksheets |
| **Reproducibility** | 100% systemic |

**What is wrong:**
All worksheets have only 5 tips. The spec requires 6 tips with the final one citing the learning objective explicitly.

**Evidence:**
- R4-MLD: 5 tips only
- R3-Anxiety: 5 tips only
- R1-HI: 5 tips only (Tip 2 references worked example well)
- 9/9 worksheets: 5 tips

**Files to change:**
1. `client/src/lib/ai.ts` - tips generation prompt

**Proposed fix:**
1. Add a 6th tip to the generation prompt: "Tip 6: LEARNING OBJECTIVE - By the end of this worksheet, you should be able to {LO text}. If you are unsure, re-read the Worked Example at the top."
2. Use the actual learning objective text from the worksheet header.

**Test criterion:**
- Generate any worksheet
- Must have exactly 6 tips
- Tip 6 must reference the learning objective
- Automated: `expect(tips.length).toBe(6)` and `expect(tip6).toContain("learning objective")`

---

### IMP-20: Tips Heading Inconsistent Across SEND Profiles

| Field | Detail |
|-------|--------|
| **ID** | IMP-20 |
| **Priority** | P4-LOW |
| **Category** | Tips Consistency |
| **Observed in** | R1, R3, R4 |
| **Reproducibility** | Varies by SEND |

**What is wrong:**
The tips section heading varies by SEND profile without clear intent:
- HI: "Read these examiner tips before you start."
- Anxiety: "Quick tips to keep you on track."
- MLD: "Top tips before you start."

This may be intentional SEND differentiation or may be uncontrolled AI variation.

**Files to change:**
1. `client/src/lib/ai.ts` - tips heading in prompt

**Proposed fix:**
Option A: Standardize to "EXAMINER TIPS - Read these before you start" for all profiles.
Option B: Intentionally differentiate (Anxiety gets softer "Quick tips to keep you on track", others get standard "Examiner Tips"). Document this as a design decision.

**Decision required:** Product decision on whether to standardize or differentiate.

**Test criterion:**
- If standardized: all worksheets must use same heading
- If differentiated: each SEND profile must use its designated heading consistently

---

### IMP-21: Self-Reflection RAG Verbs Are Always Identical

| Field | Detail |
|-------|--------|
| **ID** | IMP-21 |
| **Priority** | P4-LOW |
| **Category** | Content Variety |
| **Observed in** | ALL 9 worksheets |
| **Reproducibility** | 100% systemic |

**What is wrong:**
Every worksheet uses the same 5 RAG verbs: Describe, Explain, Calculate, Compare, Evaluate. These should vary slightly by topic or SEND profile. A non-maths/non-calculation topic should not always have "Calculate".

**Evidence:**
- All 9 worksheets: identical verbs (Describe, Explain, Calculate, Compare, Evaluate)
- Cell Biology worksheet includes "Calculate" when no calculation is expected

**Files to change:**
1. `client/src/lib/ai.ts` - self-reflection generation

**Proposed fix:**
1. Create a verb pool per subject/topic type:
   - Science (with calcs): Describe, Explain, Calculate, Compare, Evaluate
   - Science (no calcs): Describe, Explain, Identify, Compare, Evaluate
   - Biology-heavy: Describe, Explain, Compare, Analyse, Evaluate
2. Select 5 verbs appropriate to the topic from the pool.
3. Alternative: let the AI choose 5 verbs from a larger pool of 8-10 options.

**Test criterion:**
- Generate 3 worksheets for different topics
- At least one worksheet should have a different verb set
- Non-calculation topics should not include "Calculate"

---

### IMP-22: Common Mistakes Section Sometimes Topic-Mismatched

| Field | Detail |
|-------|--------|
| **ID** | IMP-22 |
| **Priority** | P4-LOW |
| **Category** | Content Quality |
| **Observed in** | WS2-ADHD (Forces) |
| **Reproducibility** | Occasional |

**What is wrong:**
In WS2 (ADHD/Forces), MISTAKE 3 mentions "successive percentage changes" which is a MATHS concept, not Physics/Forces. Content in the mistakes section should be strictly within the topic being taught.

**Evidence:**
- WS2-ADHD/Forces: MISTAKE 3 about "successive percentage changes"
- Should reference a Forces-specific misconception

**Files to change:**
1. `client/src/lib/ai.ts` - common mistakes prompt

**Proposed fix:**
1. In the mistakes prompt: "All 3 common mistakes MUST be directly about {topic}. Do not reference concepts from other subjects or topics."
2. In post-validator: check that mistake text contains at least one keyword from the topic vocabulary list.
3. Add few-shot examples showing topic-specific mistakes.

**Test criterion:**
- Generate worksheet for any topic
- All 3 mistakes must be relevant to the named topic
- No cross-topic references
- Manual review needed (hard to automate fully)

---

### IMP-23: Word Bank in Gap Fill Contains "RULE:" Instruction

| Field | Detail |
|-------|--------|
| **ID** | IMP-23 |
| **Priority** | P4-LOW |
| **Category** | Content Leak (related to IMP-03) |
| **Observed in** | R4-MLD, WS5-Dyscalculia |
| **Reproducibility** | Occasional |

**What is wrong:**
The Gap Fill word bank sometimes includes the prompt instruction "RULE: EXACTLY 7 sentences, EXACTLY 7 blanks..." as visible text. This is covered by IMP-03 but specifically affects the Gap Fill section.

**Files to change:**
Same as IMP-03.

**Proposed fix:**
Same as IMP-03 - strip `RULE:` prefixed lines from all rendered content.

**Test criterion:**
Same as IMP-03.

---

## P5 - ENHANCEMENT (Backlog)

Future improvements and architectural changes.

---

### IMP-24: Dyscalculia Cue Injection Architecture Fundamentally Broken

| Field | Detail |
|-------|--------|
| **ID** | IMP-24 |
| **Priority** | P5-ENHANCEMENT |
| **Category** | Architecture |
| **Related to** | IMP-02, IMP-13 |

**What is wrong:**
Appending SEND support text to a content string that subsequently gets parsed for numbered questions will ALWAYS risk corruption. The current approach of `content + "\n\nNumbers in this question: ..."` is fragile by design.

**Proposed fix:**
Structural refactor: add a separate `annotations` or `sendSupport` array per question/section:
```typescript
interface Question {
  number: number;
  text: string;
  marks: number;
  sendSupport?: SendAnnotation[];  // rendered separately, never parsed as content
}
```

This prevents any SEND cue from being interpreted as question content.

**Test criterion:**
- After refactor, no SEND annotation can ever be parsed as a numbered question
- All existing tests continue to pass

---

### IMP-25: No Enforcement Mechanism for S2 Question Count

| Field | Detail |
|-------|--------|
| **ID** | IMP-25 |
| **Priority** | P5-ENHANCEMENT |
| **Category** | Architecture |
| **Related to** | IMP-05 |

**What is wrong:**
The validator warns but does not add questions. The AI consistently under-generates despite the prompt. Need either stronger prompt constraints OR a post-generation retry if count < min.

**Proposed fix:**
1. Add retry logic: if S2 question count < 6 after generation, make a supplementary AI call: "Generate 3 more Section 2 questions for {topic} at understanding level."
2. Alternative: implement a "question bank" approach where more questions are generated than needed, then trimmed to target.

**Test criterion:**
- S2 always has 6-8 questions after generation + enforcement
- No retry loop exceeds 2 attempts

---

### IMP-26: Section Type Detection May Not Match Generated Format

| Field | Detail |
|-------|--------|
| **ID** | IMP-26 |
| **Priority** | P5-ENHANCEMENT |
| **Category** | Architecture |
| **Related to** | IMP-10, IMP-17 |

**What is wrong:**
Anxiety code looks for sections with type "challenge" or title starting "Section 1", but actual generated sections may use different type labels or title formats. This mismatch causes validators to silently skip sections they should be modifying.

**Proposed fix:**
1. Add comprehensive logging when section detection fails to match.
2. Normalize section detection to use multiple strategies: by type label, by title regex, by position (first/second/third section).
3. Add integration tests that feed real AI output through the validator and check results.

**Test criterion:**
- Validator correctly identifies all sections regardless of title format
- No silent skip-over of unrecognized sections

---

### IMP-27: Anxiety Reflection Uses Softer Language (Partial - Document as Complete)

| Field | Detail |
|-------|--------|
| **ID** | IMP-27 |
| **Priority** | P5-ENHANCEMENT |
| **Category** | SEND Quality |
| **Status** | PARTIALLY WORKING |

**What is working:**
- R3-Anxiety: "How are you feeling?" (vs baseline "How did you get on?")
- R3-Anxiety: "One thing about cell biology I felt confident about today was..."
- This IS differentiated from baseline - GOOD

**What is not working:**
- Section titles are NOT anxiety-adapted (covered by IMP-10)
- Challenge section not marked OPTIONAL (covered by IMP-10)

**Proposed fix:**
Document reflection language as complete. Focus on IMP-10 for remaining Anxiety gaps.

---

### IMP-28: Word Bank Distractor Count Validation

| Field | Detail |
|-------|--------|
| **ID** | IMP-28 |
| **Priority** | P5-ENHANCEMENT |
| **Category** | Content Quality |

**What is wrong:**
Gap Fill word bank consistently has 10 words for 7 blanks (3 distractors). This is acceptable but should be validated to ensure: words >= blanks, distractors <= 4, no unused correct answers in the bank.

**Proposed fix:**
Add post-validator check: count blanks in Gap Fill, count words in bank, assert bank = blanks + 2-3 distractors.

---

## Quick Wins (< 1 Hour Each)

These fixes are deterministic, require no AI prompt tuning, and can be shipped immediately.

| # | Improvement | Fix | Time | Impact |
|---|-------------|-----|------|--------|
| 1 | **IMP-06: Marks format** | Single regex in post-validator: `content.replace(/\[(\d+)\s*marks?\]/gi, '($1 marks)')` | 15 min | P2-HIGH (all worksheets) |
| 2 | **IMP-03: RULE: lines leaking** | Single regex in post-validator: `content.replace(/^RULE:.*$/gm, '')` | 15 min | P1-CRITICAL |
| 3 | **IMP-01: TEACHER_DIAGNOSES** | Single regex in renderer: `text.replace(/^TEACHER_DIAGNOSES:.*$/gm, '')` | 15 min | P1-CRITICAL |
| 4 | **IMP-16: TOPIC SUMMARY heading** | Prepend heading string to HI topic block | 20 min | P3-MEDIUM |
| 5 | **IMP-19: Add Tip 6** | Add one line to tips prompt template | 20 min | P4-LOW |
| 6 | **IMP-04: S3 question count** | Add trimming logic in post-validator (remove last Q if count > 5) | 30 min | P2-HIGH |
| 7 | **IMP-20: Tips heading** | Standardize heading in prompt template | 15 min | P4-LOW |

**Total quick wins: ~2.5 hours for 7 fixes covering 3 priority levels.**

---

## Dependency Graph

```
IMP-17 (Architecture: validator->renderer pipeline)
  |
  +---> IMP-01 (TEACHER_DIAGNOSES) -- can workaround with renderer safety net
  +---> IMP-10 (Anxiety titles) -- blocked until pipeline fixed
  |
IMP-02 (Dyscalculia cue corruption)
  |
  +---> IMP-13 (Dyscalculia 5-step recipe) -- must fix injection first
  +---> IMP-24 (Architecture refactor) -- long-term fix
  |
IMP-04 (S3 count = 5)
  |
  +---> IMP-08 (Per-Q working out box) -- count must be correct first
  +---> IMP-09 (Mark allocations) -- easier to verify with correct count
  |
IMP-05 (S2 count >= 6)
  |
  +---> IMP-25 (Retry mechanism) -- enhancement of the fix
  |
IMP-15 (EAL dropdown fix)
  |
  +---> All EAL criteria verification -- blocked until EAL can be selected

INDEPENDENT (can be done in any order):
  - IMP-03 (RULE: stripping)
  - IMP-06 (marks format)
  - IMP-11 (HI inline definitions)
  - IMP-12 (ADHD brain-break scaling)
  - IMP-14 (MLD formula reference)
  - IMP-16 (TOPIC SUMMARY heading)
  - IMP-18 (Tip 1 specific terms)
  - IMP-19 (Tip 6 learning objective)
  - IMP-21 (RAG verb variety)
  - IMP-22 (Common mistakes topic-match)
```

---

## Recommended Fix Order

### Sprint 1: Critical + Quick Wins (Days 1-3)

| Order | ID | Description | Effort |
|-------|----|-------------|--------|
| 1 | IMP-06 | Marks format regex | 15 min |
| 2 | IMP-03 | Strip RULE: lines | 15 min |
| 3 | IMP-01 | Strip TEACHER_DIAGNOSES (renderer safety net) | 15 min |
| 4 | IMP-02 | Fix dyscalculia cue injection method | 2-3 hrs |
| 5 | IMP-04 | Enforce S3 = 5 questions (trim excess) | 30 min |
| 6 | IMP-05 | Strengthen S2 prompt for 6-8 questions | 1-2 hrs |
| 7 | IMP-17 | Debug validator-to-renderer pipeline | 2-4 hrs |

### Sprint 2: SEND Overlays (Days 4-8)

| Order | ID | Description | Effort |
|-------|----|-------------|--------|
| 8 | IMP-10 | Anxiety invitational titles (after IMP-17) | 1-2 hrs |
| 9 | IMP-11 | HI inline definitions | 2-3 hrs |
| 10 | IMP-12 | ADHD brain-break scaling | 1-2 hrs |
| 11 | IMP-13 | Dyscalculia 5-step recipe (after IMP-02) | 2-3 hrs |
| 12 | IMP-14 | MLD formula reference boxes | 1-2 hrs |
| 13 | IMP-15 | EAL dropdown fix + verification | 2-3 hrs |
| 14 | IMP-16 | HI TOPIC SUMMARY heading | 20 min |

### Sprint 3: Polish (Days 9-10)

| Order | ID | Description | Effort |
|-------|----|-------------|--------|
| 15 | IMP-07 | S1 structure decision + implementation | 1-2 hrs |
| 16 | IMP-08 | Per-question working out boxes | 1-2 hrs |
| 17 | IMP-09 | Mark allocation variety | 1-2 hrs |
| 18 | IMP-18 | Tip 1 specific vocabulary | 30 min |
| 19 | IMP-19 | Tip 6 learning objective | 20 min |
| 20 | IMP-20 | Tips heading standardization | 15 min |
| 21 | IMP-21 | RAG verb variety | 1 hr |
| 22 | IMP-22 | Common mistakes topic-match | 30 min |

### Backlog: Architecture

| Order | ID | Description | Effort |
|-------|----|-------------|--------|
| 23 | IMP-24 | Structural refactor (sendSupport array) | 4-6 hrs |
| 24 | IMP-25 | S2 retry/supplement mechanism | 2-3 hrs |
| 25 | IMP-26 | Section type detection normalization | 2-3 hrs |

---

## Files Impact Map

| File | Improvements |
|------|-------------|
| `client/src/lib/worksheetPostValidator.ts` | IMP-01, IMP-02, IMP-03, IMP-04, IMP-06, IMP-13, IMP-16, IMP-17 |
| `client/src/lib/ai.ts` | IMP-05, IMP-06, IMP-07, IMP-08, IMP-09, IMP-18, IMP-19, IMP-20, IMP-21, IMP-22 |
| `client/src/lib/worksheetSectionTargets.ts` | IMP-04, IMP-05 |
| `client/src/lib/sendEnforcer.ts` | IMP-10, IMP-12, IMP-17 |
| `client/src/lib/sendPromptFragments.ts` | IMP-11, IMP-13, IMP-14, IMP-15 |
| `client/src/lib/worksheet-generator.ts` | IMP-08, IMP-12 |
| `client/src/components/WorksheetRenderer.tsx` | IMP-01, IMP-03, IMP-17 |
| `client/src/lib/send-data.ts` | IMP-15 (EAL reference data) |
| UI components (SEND dropdown) | IMP-15 |

---

## Verification Methodology

All improvements should be verified using the same audit methodology:

```
Tool:       Playwright 1.60.0 + Chromium (headless)
URL:        https://adaptly.co.uk/worksheets
Method:     Generate worksheet via UI, extract rendered text, run assertions
Profiles:   HI, ADHD, Anxiety, MLD, Dyscalculia, EAL, None (baseline)
Minimum:    3 worksheets per fix (different topics)
```

### Regression Test Suite

After each sprint, re-run the full 9-worksheet audit to verify:
1. No regressions in passing criteria (Phase 2, Phase 5 = 100%)
2. Fixed items now pass
3. No new bugs introduced

---

## Audit Data Reference

### Session 1 Output Files
- `audit/worksheet-1-hi-output.txt`
- `audit/worksheet-2-adhd-output.txt`
- `audit/worksheet-4-mld-chemistry-output.txt`
- `audit/worksheet-5-dyscalculia-energy-output.txt`
- `audit/worksheet-6-eal-electricity-output.txt`

### Session 2 Output Files
- `audit/retest-outputs/R1-hi-bioenergetics.txt`
- `audit/retest-outputs/R2-adhd-forces.txt`
- `audit/retest-outputs/R3-anxiety-cell.txt`
- `audit/retest-outputs/R4-mld-atomic.txt`

### Analysis Documents
- `audit/LIVE-AUDIT-REPORT.md` - Full session 1 report
- `audit/FIX-PLAN.md` - Original fix plan (superseded by this document)
- `audit/retest-outputs/results.json` - Session 2 generation metadata

---

*End of document. Total: 28 improvements across 5 priority levels.*
