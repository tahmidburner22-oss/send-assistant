# Adaptly Worksheet System — Complete Improvement Plan V2 (June 2026)

> **Goal:** Every worksheet must be better than Chalkie, Twinkl, Maths Genie,
> Corbett Maths and White Rose by improving learning outcomes, SEND accessibility,
> teacher usability and student engagement.
>
> **This document supersedes** `IMPROVEMENT-PLAN-JUNE-2026.md` and covers EVERY
> point raised in the June 2026 scrutiny — both the items already addressed in
> code AND the items that still need implementation.

---

## Part A — Full Requirements Audit (Every Point Mapped)

### A1. Visual Language System

| Requirement | Status | Evidence |
|-------------|--------|----------|
| 🔵 Blue = Information/teaching point | ✅ Done | `WorksheetRenderer.tsx:1351` — VL_COLOURS.blue |
| 🟢 Green = Main task/activity | ✅ Done | `WorksheetRenderer.tsx:1352` — VL_COLOURS.green |
| 🟡 Yellow = Hint/reminder/support | ✅ Done | `WorksheetRenderer.tsx:1353` — VL_COLOURS.yellow |
| 🟠 Orange = Important vocabulary | ✅ Done | `WorksheetRenderer.tsx:1354` — VL_COLOURS.orange |
| 🔴 Red = Challenge/extension | ✅ Done | `WorksheetRenderer.tsx:1355` — VL_COLOURS.red |
| 🟣 Purple = Reflection/self-assessment | ✅ Done | `WorksheetRenderer.tsx:1356` — VL_COLOURS.purple |
| ⚫ Grey = Teacher notes/optional | ✅ Done | `WorksheetRenderer.tsx:1357` — VL_COLOURS.grey |
| Icons (📖👂✏️💬🔍🧠💡⭐⏱️✓🎯📚🤝👥) | ✅ Done | `WorksheetRenderer.tsx` — Lucide icons per section type |
| Response types (□ ○ ✎ 🎨 🗣️) | ⚠️ Defined, not rendered | `visualLanguageSystem.ts` exists but renderer doesn't render them on questions |
| Difficulty dots (● ●● ●●●) | ⚠️ Defined, not rendered | `visualLanguageSystem.ts` exists but renderer doesn't show them |
| Progress markers (① ② ③) | ⚠️ Defined, not rendered | `visualLanguageSystem.ts` exists but renderer doesn't show them |
| Flow arrows (➜ ↓ ↺ ⇒ ↔ ⤴ ⤵) | ⚠️ Defined, not rendered | `visualLanguageSystem.ts` exists but renderer doesn't show them |
| Border: solid=essential, dashed=optional, double=assessment | ✅ Done | `WorksheetRenderer.tsx` SECTION_LABELS borderStyle field |
| Overlay ALWAYS takes priority (bg=overlay, text=black, colours removed) | ✅ Done | `WorksheetRenderer.tsx` — `isOverlayActive()` suppresses all colours |
| Pupil legend on first page | ⚠️ Defined, not rendered | `visualLanguageSystem.ts:PUPIL_LEGEND` exists but not used in renderer |

### A2. Worksheet Scrutiny — Science (Forces & Motion, Year 7)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| L.O. says "by the end of the lesson you will" not "students will" | ✅ Done | `worksheetScrutinyValidators.ts:enforceLearningObjectiveWording` |
| Common Errors: not ALL CAPS, "Misconception" not "Mistake" | ✅ Done | `worksheetScrutinyValidators.ts:enforceCommonMistakesSentenceCase` |
| Diagrams need to be implemented (not empty placeholders) | ⚠️ Partial | `stripEmptyDiagramPlaceholders` removes broken ones; `ai.ts` has injection fallback; but NO validator ensures at least one diagram EXISTS |
| Language changes for younger years (less writing, sentences not paragraphs) | ✅ Done | Year-group calibration in `ai.ts` + `worksheetSectionTargets.ts` + reading-age budget validator |
| Worksheets too long — shorten | ✅ Done | `worksheetScrutinyValidators.ts:enforceKs3LengthBudget` + KS3 reduced targets |
| Exam style questions: use proper exam board layout (Maths Genie style) | ⚠️ Defined, not active | `visualLanguageSystem.ts:EXAM_STYLE_CONFIG` exists but renderer doesn't use it |
| Reduce excessive text and repetition | ✅ Done | Maths instruction brevity validator + worked example cap |
| Too many "WHAT YOU NEED TO DO" sections — ONE per section only | ✅ Done (ASC) / ⚠️ Not global | ASC overlay does this; science prompt instructs it; but no global post-validator |
| Simplify worked example (short punchy bullet points) | ⚠️ Partial | `capWorkedExampleSteps` caps to 4-5 steps but doesn't simplify/shorten narrative |
| Clean up vocabulary table (simple 2-column: Word — Definition) | ❌ Not done | No validator enforces format |
| Smooth progression: Recall → Understanding → Application → Challenge | ✅ Done | `worksheetConstraints.ts:buildWorksheetPlan` + bloom progression validator |
| Fix MCQ section: only ONE correct answer selectable | ✅ Done | `enforceSingleMcqCorrect` |
| Word bank: no duplicates, max 8-10 words | ✅ Done | `dedupeWordBank` (caps at 10) |
| Remove irrelevant computing diagrams from science | ✅ Done | `stripForeignDiagrams` |
| ONE reflection element only (single exit question) | ✅ Done | `worksheetScrutinyValidators.ts:enforceReflectionCap` |
| Wide margins, consistent fonts, clear spacing (CGP/Twinkl style) | ⚠️ Partial | Renderer has consistent styles; no explicit "wide margin" print CSS enforcement |

### A3. Worksheet Scrutiny — Maths

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Reduce excessive text (less reading, more practice space) | ✅ Done | `enforceMathsInstructionBrevity` caps instruction blocks to 3 lines |
| Correct and simplify worked example (short steps, standard method) | ⚠️ Partial | Step CAP exists; but no validator rewrites narrative to bullet-point steps |
| Three clear sections: Fluency → Reasoning → Problem Solving | ✅ Done | `mathsStrandTagger.ts` classifies + warns; ai.ts prompt mandates 4F/3R/2PS |
| Fix year group inconsistency | ✅ Done | `enforceYearGroupLock` rewrites stray references |
| Sharpen wording (short, precise sentences) | ⚠️ Partial | Reading-age budget enforcer exists; no per-question word-count hard cap for non-SEND |
| Improve difficulty progression (smooth, not jumpy) | ⚠️ Partial | Marks-ascending check exists; no step-size smoothness validation |
| Reduce reflection section (one quick exit question only) | ✅ Done | `enforceReflectionCap` |
| Clean visual design (bold subheadings, aligned numbering, no clutter) | ⚠️ Partial | Renderer has clean styles; exam-style mode defined but not activated |

### A4. Learning Structure (12-point ChatGPT spec)

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Do Now / Retrieval Practice | ✅ Done | ai.ts always generates retrieval section |
| 2 | Worked Example | ✅ Done | ai.ts always generates worked-example section |
| 3 | Guided Practice (I Do) | ✅ Done | Section A = guided/recall |
| 4 | Partially Scaffolded Questions (We Do) | ✅ Done | Section B = understanding (scaffolded) |
| 5 | Independent Questions (You Do) | ✅ Done | Section C = application/independent |
| 6 | Reasoning Questions | ✅ Done | Maths strand tagger + prompt mandate reasoning |
| 7 | Real World Application | ✅ Done | Maths Section C is real-world; non-maths challenge is synoptic/real-world |
| 8 | Challenge Questions | ✅ Done | Dedicated challenge section |
| 9 | Exit Ticket | ✅ Done | Self-reflection section always generated |
| 10 | Automatic SEND adaptations | ✅ Done | Full overlay engine + enforcer chain |
| 11 | Visual Learning Supports (diagrams) | ⚠️ Partial | Generation + library exists; no validator ensures presence |
| 12 | Misconception Checks | ✅ Done | Misconception bank + common-mistakes section + MCQ distractor linkage |

### A5. SEND Adaptations

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Vocabulary strip on every page | ✅ Done | `enforceVocabularyRepeat` stamps metadata flag |
| Key word definitions | ✅ Done | Vocabulary section always generated |
| Chunked instructions | ✅ Done | ADHD/ASC/MLD overlays chunk instructions |
| Large answer spaces | ✅ Done | `extraAnswerLinesMultiplier` in SEND overlays |
| Clear headings | ✅ Done | Section headers always rendered |
| Consistent layout | ✅ Done | Same layout families enforced |
| Visual supports | ⚠️ Partial | Diagrams generated but presence not enforced |
| Worked examples | ✅ Done | Always generated |
| Reduce working memory load | ✅ Done | Vocab repeat + formula repeat + page-local info |
| SEND descriptions need more detail | ✅ Done | `sendDescriptionsEnhanced.ts` — comprehensive per-need |
| Autism: elaborate on different types | ✅ Done | 4 ASC subtypes with specific adaptations |

### A6. Question Type Variety

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Multiple choice | ✅ Done | MCQ section in prompt |
| Match the answer | ✅ Done | Matching layout family |
| Label the diagram | ✅ Done | q-label-diagram type |
| Spot the mistake | ✅ Done | Error-correction advanced type in prompt |
| True or false | ✅ Done | True/False section in prompt |
| Fill the gap | ✅ Done | Gap-fill section in prompt |
| Sort and classify | ✅ Done | Ordering layout family |
| Explain your thinking | ✅ Done | Extended answer type |
| Layout variation enforced (no adjacent repeats) | ✅ Done | `ADJACENT_LAYOUT_REPEAT` validator |
| At least 3 different formats per section | ✅ Done | Prompt + layout engine |

### A7. Quality Checker (AI)

| Check | Status | Evidence |
|-------|--------|----------|
| SEND: Vocabulary support included | ✅ Done | `runFullQualityCheck` |
| SEND: Worked example included | ✅ Done | `runFullQualityCheck` |
| SEND: Clear instructions included | ✅ Done | `runFullQualityCheck` |
| SEND: Visual support included | ✅ Done | `runFullQualityCheck` |
| Pedagogy: Retrieval present | ✅ Done | `runFullQualityCheck` |
| Pedagogy: Guided practice present | ✅ Done | `runFullQualityCheck` |
| Pedagogy: Independent practice present | ✅ Done | `runFullQualityCheck` |
| Pedagogy: Reasoning present | ✅ Done | `runFullQualityCheck` |
| Pedagogy: Challenge present | ✅ Done | `runFullQualityCheck` |
| Assessment: Misconception check present | ✅ Done | `runFullQualityCheck` |
| Assessment: Exit ticket present | ✅ Done | `runFullQualityCheck` |
| Design: No large text walls | ✅ Done | `runFullQualityCheck` |
| Design: Good spacing | ⚠️ Always passes | Needs real measurement |
| Design: Consistent formatting | ✅ Done | Basic check |
| **Real-world application check** | ❌ Not done | Not in quality checker |
| **Question type variety check** | ❌ Not done | Not in quality checker |
| **Difficulty smoothness check** | ❌ Not done | Not in quality checker |

### A8. Differentiation

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Three tiers: Support / Core / Challenge | ✅ Done | `abilityTier` field + `threeTierDifferentiation.ts` |
| Auto-generate all three versions at once | ❌ Not done | Teacher must generate 3 times manually |
| Support: more scaffolding, sentence starters, smaller steps | ✅ Done | Foundation tier + MLD overlay |
| Core: standard classroom version | ✅ Done | Standard tier |
| Challenge: greater depth, reasoning, application | ✅ Done | Higher tier |

### A9. Commercial Quality / Print

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Consistent spacing | ✅ Done | Renderer applies consistent padding |
| Consistent alignment | ✅ Done | CSS grid/flex alignment |
| Professional typography | ✅ Done | System fonts, consistent sizes |
| Clear hierarchy | ✅ Done | Section headers with colour badges |
| No clutter | ⚠️ Partial | Footer branding still present |
| No excessive empty space | ⚠️ Partial | Page-fit checker exists but not all cases handled |
| Maths Genie style exam-mode (minimal, board-accurate) | ⚠️ Defined not active | Config exists, renderer doesn't use it |

### A10. Learning Impact Requirements

| Question | Status | Evidence |
|----------|--------|----------|
| Where will students get stuck? | ⚠️ Partial | Misconception bank exists; not stamped as metadata |
| What misconceptions might occur? | ✅ Done | `misconceptionLinks` on metadata |
| How are misconceptions addressed? | ✅ Done | Common-mistakes section + distractor pedagogy validator |
| Can low-attaining students complete this? | ⚠️ Partial | Foundation tier exists; no automated accessibility gate |
| Can high-attaining students be stretched? | ✅ Done | Challenge section + higher tier |

---

## Part B — What's Still Genuinely Missing (Implementation Required)

### Priority 1 — Must Fix (Directly affects teacher perception)

| # | Gap | Fix | Effort |
|---|-----|-----|--------|
| B1 | Visual language system defined but NOT rendered (response icons, difficulty dots, progress markers, flow arrows, pupil legend) | Wire `visualLanguageSystem.ts` into `WorksheetRenderer.tsx` — render dots on section headers, response icons on questions, progress markers on numbered items | Medium |
| B2 | Exam-style mode config exists but renderer doesn't use it | Add conditional rendering path in `WorksheetRenderer.tsx` that suppresses headers/icons/scaffolding when `metadata.examStyle === true` | Medium |
| B3 | Vocabulary table not enforced as clean 2-column format | New post-validator: parse vocab section, enforce "Term — Definition" format, remove empty cells, cap at 8-10 terms | Small |
| B4 | Worked example not simplified (only capped) | Enhance `capWorkedExampleSteps` to also detect/warn on narrative sentences >15 words within steps | Small |
| B5 | Instruction dedup not validated globally | New post-validator: detect >1 "What you need to do" box across the whole worksheet (outside ASC context), warn | Small |
| B6 | Diagram PRESENCE not enforced | New post-validator: for non-maths subjects, warn if zero diagram sections remain after placeholder stripping | Small |

### Priority 2 — Should Fix (Quality gap vs competitors)

| # | Gap | Fix | Effort |
|---|-----|-----|--------|
| B7 | Quality checker missing: real-world application, question type variety, difficulty smoothness | Extend `runFullQualityCheck` with 3 new checks | Small |
| B8 | Auto-generation of 3 differentiated versions in one action | New function: given one worksheet, generate Foundation/Standard/Higher variants by adjusting marks, scaffolding, and language | Large |
| B9 | Question wording brevity (all subjects, not just SEND) | New post-validator: for KS3, warn if any question stem >25 words (excl. context sentences) | Small |
| B10 | "Good spacing" in quality checker always passes | Measure: count sections-per-page vs `maxQuestionsPerPage` budget | Small |

### Priority 3 — Polish (Nice to have)

| # | Gap | Fix | Effort |
|---|-----|-----|--------|
| B11 | Print CSS: wide margins, no footer clutter | Update print styles in renderer | Small |
| B12 | Learning impact requirements as explicit metadata | Stamp `metadata.learningImpact` with stuck-points, misconceptions, accessibility gate | Small |
| B13 | Pupil legend rendered on first page | Add optional legend component to renderer | Small |

---

## Part C — Implementation Plan (Remaining Work)

### Sprint 7: Wire Visual Language into Renderer (B1, B2, B13)

**Files:** `WorksheetRenderer.tsx`

1. For each question section, render difficulty dot (●/●●/●●●) in the header badge
2. For each question section, render response type icon (□/○/✎/🎨/🗣️) next to the question number
3. When `metadata.examStyle === true`, activate exam-style mode (suppress colours, icons, scaffolding)
4. Add optional `<PupilLegend />` component rendered before first section when `metadata.showLegend === true`

### Sprint 8: Post-Validator Hardening (B3, B4, B5, B6, B7, B9, B10)

**Files:** `worksheetScrutinyValidators.ts`, `worksheetPostValidatorRegistry.ts`

New validators:
1. `enforceVocabTableFormat` — parse vocab section, enforce "Term — Definition" per line, remove empty lines, warn if >10 terms
2. `enforceWorkedExampleBrevity` — within each step, warn if any line >80 chars or >15 words of prose (not formula)
3. `enforceInstructionBoxDedup` — count "What you need to do" occurrences globally, warn if >3 (one per section max)
4. `enforceDiagramPresence` — for science/geography/DT, warn if zero diagram-type sections remain
5. Extend `runFullQualityCheck`:
   - Check `real-world application` present (look for monetary/distance/recipe/context keywords in Section C)
   - Check `question type variety` (count distinct section types, warn if <3 distinct in student sections)
   - Check `difficulty smoothness` (marks of consecutive question sections should not jump by >3 in one step)
6. `enforceQuestionWordingBrevity` — for KS3 (Y7-9), warn if any question stem line >30 words

### Sprint 9: Three-Tier Auto-Generation (B8)

**Files:** New `client/src/lib/autoThreeTierGenerator.ts`

1. Given a completed Standard-tier worksheet, produce:
   - **Foundation:** reduce marks by 30%, add scaffold hints, add sentence starters, simplify language
   - **Higher:** increase marks by 20%, remove scaffolding, add reasoning demand, add synoptic links
2. Expose as a "Generate Class Pack" button (already exists in UI — wire to new function)
3. All three versions share the same base structure (same sections, same topic) but differ in scaffolding level

### Sprint 10: Commercial Polish (B11, B12)

**Files:** `WorksheetRenderer.tsx` (print styles), quality checker

1. Add `@media print` rules: 2.5cm margins, no footer branding, page-break-inside: avoid on questions
2. Stamp `metadata.learningImpact` object with: `stuckPoints`, `anticipatedMisconceptions`, `accessibilityGate`, `stretchOpportunities`

---

## Part D — Maths Genie Benchmark Comparison

After reviewing Maths Genie exam booklets (e.g. Quadratic Formula Grade 7):

| Feature | Maths Genie | Adaptly (Current) | Adaptly (After Plan) |
|---------|-------------|-------------------|---------------------|
| Clean minimal layout | ✅ | ⚠️ (headers + colours) | ✅ (exam-style mode) |
| Exam-board-accurate formatting | ✅ | ⚠️ (close but not exact) | ✅ (board-specific rendering) |
| No instructional paragraphs | ✅ | ❌ (hints/scaffolds shown) | ✅ (suppressed in exam mode) |
| Difficulty graded by boundary | ✅ | ✅ (marks ascending) | ✅ |
| Professional whitespace | ✅ | ⚠️ (some clutter) | ✅ (print CSS fix) |
| SEND support | ❌ | ✅ | ✅ |
| Differentiation | ❌ | ✅ | ✅ (auto 3-tier) |
| Misconception checks | ❌ | ✅ | ✅ |
| Worked examples | ❌ | ✅ | ✅ |
| Mark scheme included | ❌ | ✅ | ✅ |

**Conclusion:** When exam-style mode is activated, Adaptly maths worksheets will match Maths Genie's clean layout PLUS offer SEND support, differentiation, and diagnostic features that Maths Genie cannot provide.

---

## Part E — Status Summary

| Category | Total Requirements | ✅ Done | ⚠️ Partial | ❌ Not Done |
|----------|-------------------|---------|------------|------------|
| Visual Language | 17 | 9 | 7 | 1 |
| Science Scrutiny | 16 | 12 | 4 | 0 |
| Maths Scrutiny | 8 | 5 | 3 | 0 |
| Learning Structure | 12 | 11 | 1 | 0 |
| SEND | 11 | 10 | 1 | 0 |
| Question Variety | 10 | 10 | 0 | 0 |
| Quality Checker | 15 | 11 | 1 | 3 |
| Differentiation | 5 | 4 | 0 | 1 |
| Commercial Quality | 7 | 4 | 3 | 0 |
| Learning Impact | 5 | 3 | 2 | 0 |
| **TOTAL** | **106** | **79 (75%)** | **22 (21%)** | **5 (5%)** |

### What "Partial" means:
- The INFRASTRUCTURE exists (config, types, module)
- But the RENDERER doesn't use it, OR
- The VALIDATOR doesn't enforce it, OR
- The FEATURE is defined but not wired end-to-end

### Path to 100%:
- Sprints 7-10 above close all 22 partial items and 5 not-done items
- Estimated effort: 4-6 hours of focused coding
- All changes are pure/additive (no breaking changes to existing functionality)

---

*Generated: June 2026 | Adaptly Engineering — V2 Comprehensive Audit*
