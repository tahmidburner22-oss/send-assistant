# Comprehensive Improvement Plan — June 2026

## Methodology

This plan compares **three layers**:
1. **User requirements** — the full visual language spec, scrutiny feedback, Maths Genie benchmark, and "Top 1% Worksheet Standard" criteria
2. **Codebase implementation** — what's coded in `visualLanguageSystem.ts`, `worksheetScrutinyValidators.ts`, `worksheetPostValidator.ts`, `WorksheetRenderer.tsx`
3. **Live output** — what actually ships when a teacher generates a worksheet on adaptly.co.uk (verified via Playwright audit of 6 worksheets)

---

## Executive Summary

| Category | Coded? | Shipping? | Gap Type |
|----------|--------|-----------|----------|
| 7 Semantic Colours | ✅ Fully defined | ⚠️ Partially — renderer uses own colour map | **Alignment** |
| 14 Activity Icons | ✅ Fully defined | ⚠️ Imported but mixed with Lucide icons | **Consistency** |
| Response Type Icons (□○✎🎨🗣️) | ✅ Fully defined + rendered | ✅ Visible in live output | **Done** |
| Difficulty Dots (●/●●/●●●) | ✅ Fully defined + rendered | ✅ Visible in live output | **Done** |
| Progress Markers (①②③) | ✅ Defined | ❌ Never rendered — plain numbers used | **Activation** |
| Flow Arrows (➜↓↺⇒↔⤴⤵) | ✅ Defined + imported | ❌ Never rendered between sections | **Activation** |
| Border Styles (solid/dashed/double) | ✅ Defined + imported | ❌ Only solid used in practice | **Activation** |
| Overlay Priority (SEND colour overrides all) | ✅ Fully implemented | ✅ Working in renderer | **Done** |
| Pupil Legend | ✅ Defined + renderer ready | ❌ Never shown — `showLegend` flag never set | **Activation** |
| Exam-Style Mode (Maths Genie) | ✅ Fully coded in renderer | ❌ Never activated — `examStyle` never true | **Activation** |
| L.O. Wording ("you will" not "students will") | ✅ Validator exists | ✅ Working on science/English | **Done** |
| Common Misconceptions (not Mistakes, not CAPS) | ✅ Validator exists | ✅ Working — "Misconception" + sentence case | **Done** |
| Reflection Cap (single exit question) | ✅ Validator exists | ✅ Working — single exit ticket | **Done** |
| Maths Instruction Brevity | ✅ Validator exists | ⚠️ Maths structure broken (bigger issue) | **Blocked** |
| KS3 Length Budget | ✅ Validator exists (warn-only) | ⚠️ Warns but doesn't enforce | **Upgrade** |
| Vocabulary on Every Page | ✅ Metadata flag stamped | ⚠️ Print CSS exists but not verified live | **Verify** |
| Pedagogy Structure (Do Now→Challenge) | ✅ Validator warns if missing | ⚠️ Warn-only, no auto-fix | **Upgrade** |
| Quality Checker (100-point) | ✅ Full implementation | ⚠️ Runs but doesn't gate output | **Upgrade** |
| Diagrams (no page mostly text) | ✅ Validator warns | ❌ Diagrams never pulled from library | **Critical** |
| Question Count (7-7-5-1) | ✅ Targets defined + prompt hardened | ❌ LLM ignoring — gets 4 in S2 | **Critical** |
| Per-Question Marks | ✅ Prompt asks for it | ❌ Shows section totals instead | **Critical** |
| Maths Worksheet Structure | ✅ 14-section spec defined | ❌ Maths+SEND = only 3 sections | **Critical** |
| Three-Tier Differentiation (LA/MA/HA) | ✅ Full implementation | ✅ Working via toolbar button | **Done** |
| SEND Descriptions (detailed + autism subtypes) | ✅ Full sendDescriptionsEnhanced.ts | ✅ Visible in form sidebar | **Done** |
| Misconception Bank | ✅ Full library with per-topic lookup | ✅ Used in generation | **Done** |

---

## Gap Analysis: What Needs Improvement

### TIER 1 — CRITICAL (Broken / Not Shipping Despite Being Coded)

#### 1.1 Maths Worksheets Lose All Structure with SEND
- **Requirement:** Every worksheet follows the full 14-section structure regardless of SEND overlay
- **Coded:** ✅ 14-section spec in `worksheet-generator.ts`, full generation logic in `ai.ts`
- **Live:** ❌ Maths + Dyscalculia/Dyslexia = only 3 raw numbered sections
- **Root Cause:** The Dyscalculia scaffold (`reinforceDyscalculiaMathsScaffolding`) appears to replace sections rather than augment them. The maths code path in `ai.ts` may also take a shorter generation route.
- **Fix:** Debug the maths generation path. Ensure the SEND overlay adds scaffolds TO existing sections, never replaces the structure. Add a post-validator guard: if `sections.length < 8`, emit a hard warning.
- **Effort:** 2 days | **Impact:** Fixes 100% of maths worksheets

#### 1.2 Diagrams Never Pulled from Library
- **Requirement:** "No page should be mostly text. Visuals should support understanding."
- **Coded:** ✅ 5,975-entry diagram catalogue, SVG generation pipeline, `enforceDiagramPresence` validator
- **Live:** ❌ Zero worksheets have diagram sections populated
- **Root Cause:** No lookup mechanism connects `(subject, topic, yearGroup)` → catalogue entry → worksheet section. The validator only WARNS, doesn't inject.
- **Fix:** Create `diagramLibraryLookup.ts` that queries the catalogue. Wire into the generation pipeline post-AI-call. Populate `diagramRef`/`image_url` on diagram-a/diagram-b sections. Renderer already handles `<img>` when `image_url` is present.
- **Effort:** 2 days | **Impact:** Every worksheet gets relevant visuals

#### 1.3 Question Counts Ignored by LLM
- **Requirement:** Section 2 must have 7 questions (target from `worksheetSectionTargets.ts`)
- **Coded:** ✅ `SECTION_QUESTION_TARGETS = { recall: 7, understanding: 7, application: 5, challenge: 1 }`, prompt hardened in PR #153
- **Live:** ❌ Section 2 consistently generates 4 questions across all subjects
- **Root Cause:** The LLM (Groq · Llama 4 Scout) is ignoring the prompt instruction. Prompt hardening alone is insufficient.
- **Fix:** Convert `enforceSectionQuestionCounts` from warn-only to a **regeneration trigger**. When S2 has <6 questions, either (a) retry with a stronger prompt, (b) use the deterministic topic bank to supplement questions, or (c) split the AI into per-section calls. Short-term: make the validator inject placeholder questions from the topic bank.
- **Effort:** 1.5 days | **Impact:** Correct question density across all subjects

#### 1.4 Per-Question Marks Not Rendering
- **Requirement:** "Individual mark allocations per question in brackets" (Maths Genie style)
- **Coded:** ✅ `enforceMarksBracketStyle` converts `[N marks]` → `(N marks)`, prompt asks for per-Q marks
- **Live:** ❌ Shows `(8 marks total)` per section, not `(2 marks)` per question
- **Root Cause:** The AI generates section-total marks instead of per-question marks. The post-validator only reformats brackets, doesn't split totals into per-Q allocations.
- **Fix:** Add a new validator `enforcePerQuestionMarks` that: (a) detects `(N marks total)` patterns, (b) divides evenly using the command-word→marks mapping (State=1, Describe=2, Explain=3, Calculate=3, Evaluate=4-6), (c) stamps each question with its individual mark. Also strengthen prompt with explicit example.
- **Effort:** 1 day | **Impact:** Professional exam-paper appearance

#### 1.5 Exam-Style Mode Never Activates
- **Requirement:** "Maths worksheets should look like Maths Genie — no scaffolding, per-Q marks, monochrome, progressive difficulty"
- **Coded:** ✅ Full `EXAM_STYLE_CONFIG` in visualLanguageSystem.ts, renderer suppresses sections when `examStyle=true`, `shouldUseExamStyleLayout` function ready
- **Live:** ❌ `metadata.examStyle` is NEVER set to `true` by the generator
- **Root Cause:** No code path in `ai.ts` or the post-validator sets `metadata.examStyle = true`. It's entirely opt-in via metadata but nothing opts in.
- **Fix:** In `ai.ts`, set `metadata.examStyle = true` when: (a) subject is Mathematics AND (b) tier is "Higher" or "Mixed" AND (c) no SEND need that requires scaffolding (Dyscalculia needs scaffolding, so keep examStyle=false for that). Also add a UI toggle in the generation form: "Exam booklet style" checkbox.
- **Effort:** 0.5 day | **Impact:** Maths Genie style immediately available

---

### TIER 2 — HIGH (Coded but Not Fully Wired / Partially Working)

#### 2.1 Semantic Colours Not Aligned with User Spec
- **Requirement:** Blue=Information, Green=Task, Yellow=Hint, Orange=Vocabulary, Red=Challenge, Purple=Reflection, Grey=Teacher notes
- **Coded:** ✅ `SEMANTIC_COLOURS` object matches user spec exactly
- **Live:** ⚠️ Renderer uses `VL_COLOURS` / `SECTION_COLOUR_MAP` which is a different colour mapping (navy, indigo, teal, etc.)
- **Fix:** Align `SECTION_COLOUR_MAP` in WorksheetRenderer.tsx to use `SEMANTIC_COLOURS` from visualLanguageSystem.ts directly. Map: `vocabulary` → orange, `example`/`worked-example` → blue, `guided`/`recall`/`independent` → green, `challenge` → red, `self-reflection` → purple, `teacher-notes` → grey, `send-support`/`reminder-box` → yellow.
- **Effort:** 0.5 day | **Impact:** Consistent visual language across all worksheets

#### 2.2 Flow Arrows Never Rendered Between Sections
- **Requirement:** "➜ = Next step, ↓ = Continue below, ↺ = Review/revisit, ⤴ = Extension, ⤵ = Support"
- **Coded:** ✅ `FLOW_SYMBOLS` defined, `getFlowArrow(fromType, toType)` function exists, imported into renderer
- **Live:** ❌ No flow arrows visible between sections
- **Fix:** In the section-group-divider rendering block of WorksheetRenderer.tsx, insert the appropriate flow arrow between consecutive sections. Show the arrow symbol in a small pill between section blocks. Suppress in exam-style mode.
- **Effort:** 0.5 day | **Impact:** Pupils can follow worksheet flow independently

#### 2.3 Border Styles Not Applied
- **Requirement:** "Solid=essential, Dashed=optional, Double=assessment, Rounded=support, Shaded=examples"
- **Coded:** ✅ `BORDER_STYLES` defined, `getBorderStyleForSection(type)` function exists
- **Live:** ❌ All sections render with the same solid border style
- **Fix:** In the section container rendering, apply `border-style: ${getBorderStyleForSection(section.type)}`. Add CSS for `border-style: dashed` on optional sections, `border-style: double` on assessment sections, `border-radius: 8px` on support sections, and a light background shading on example sections.
- **Effort:** 0.5 day | **Impact:** Teachers instantly see which sections are optional vs essential

#### 2.4 Progress Markers (①②③) Not Used
- **Requirement:** "① ② ③ = Sequence of tasks"
- **Coded:** ✅ `PROGRESS_MARKERS` array defined, `getProgressMarker(index)` function exists
- **Live:** ❌ Questions use plain "1. 2. 3." numbering
- **Fix:** In the per-question rendering block, replace plain number with `getProgressMarker(index)` for non-exam-style worksheets. Keep plain numbers for exam-style mode (since real exam papers use plain numbers).
- **Effort:** 0.5 day | **Impact:** More visually engaging for SEND pupils

#### 2.5 Pupil Legend Never Shown
- **Requirement:** "A pupil could learn that: 🎯 Objective, 📚 Vocabulary, 🔵 Information, 🟢 Main Task..."
- **Coded:** ✅ `PUPIL_LEGEND` constant defined, renderer shows when `showLegend=true`
- **Live:** ❌ `metadata.showLegend` is never set to `true`
- **Fix:** Set `metadata.showLegend = true` by default for the FIRST worksheet a pupil receives (or for primary/KS3 worksheets where pupils are learning the system). Add a checkbox in the generation form: "Include pupil legend (first time using this format)".
- **Effort:** 0.5 day | **Impact:** Pupils learn the visual system faster

#### 2.6 HI Inline Definitions Bug
- **Requirement:** "Hearing Impairment: inline (= definition) on first use of each vocabulary term"
- **Coded:** ✅ Logic in `worksheetPostValidator.ts` injects `(= definition)` annotations
- **Live:** ⚠️ BUGGY — concatenates multiple vocab entries and truncates: `force (= A push or pull on an object, measured in Newtons (N). Mass — The a…)`
- **Fix:** Fix the term-lookup regex in the HI inline definition injector. It's grabbing the full vocabulary section content instead of just the matched term's definition. Cap each injected definition to max 50 characters.
- **Effort:** 0.5 day | **Impact:** HI pupils get clean, short definitions

#### 2.7 Anxiety Challenge Title Not Applying
- **Requirement:** "Challenge labelled 'OPTIONAL BONUS — only if you want to!'"
- **Coded:** ✅ `sendSectionLabels.ts` remaps challenge title for anxiety
- **Live:** ⚠️ Section 1-3 titles work ("WARM-UP", "BUILDING YOUR UNDERSTANDING", "STRETCH YOURSELF") but Challenge still says "STRETCH & CHALLENGE"
- **Fix:** Check the validator chain ordering. The challenge title rename may be running but then the grouped-section renderer overrides it with its own label table. Ensure `sendSectionLabels` runs AFTER all other section-title manipulations, or wire directly into the group-divider rendering.
- **Effort:** 0.5 day | **Impact:** Anxious pupils never see threatening "Challenge" wording

---

### TIER 3 — MEDIUM (Partially Implemented / Needs Enhancement)

#### 3.1 Quality Checker Should Gate Output
- **Requirement:** "Before a worksheet is released, automatically check... If these questions cannot be answered, the worksheet is not ready."
- **Coded:** ✅ `runFullQualityCheck` produces a 100-point score and status
- **Live:** ⚠️ Score is stamped on metadata but doesn't prevent output
- **Fix:** When `qualityCheckStatus === "do-not-publish"` (score <50), show a warning banner to the teacher: "This worksheet scored X/100 and is missing: [list]. Consider regenerating." When score <70, show an amber warning. Don't block completely (teacher override allowed) but make the quality visible.
- **Effort:** 0.5 day | **Impact:** Teachers never accidentally use a bad worksheet

#### 3.2 Validators Should Auto-Fix, Not Just Warn
- **Requirement:** Sections that are missing should be injected, not just warned about
- **Current:** `enforcePedagogyStructurePresence` only warns; `enforceSectionQuestionCounts` only warns; `enforceDiagramPresence` only warns
- **Fix:** For critical missing sections (Worked Example, Misconceptions, Vocabulary), add a deterministic fallback that injects a placeholder section from the topic bank when the AI omits it entirely. For question counts, inject supplementary questions from `expandedMathTopics` / `scienceTopics` / `englishTopics` in `worksheet-generator.ts`.
- **Effort:** 2 days | **Impact:** Every worksheet hits minimum quality bar

#### 3.3 Worked Example Too Long (Science Scrutiny)
- **Requirement:** "Reduce steps to short, punchy bullet points"
- **Coded:** ✅ `enforceWorkedExampleBrevity` warns when steps exceed 20 words
- **Live:** ⚠️ Worked examples are 4-6 steps (good) but some steps are verbose
- **Fix:** Strengthen the validator to actually TRIM step text to max 15 words, removing narrative filler. Keep the key calculation/formula + result. Add a "Key point:" summary at the end (already present in live output ✅).
- **Effort:** 0.5 day | **Impact:** Cleaner, scannable worked examples

#### 3.4 Instruction Box Deduplication
- **Requirement:** "Keep ONE guidance box at the top of each section only. Remove all duplicated steps."
- **Coded:** ✅ `enforceInstructionBoxDedup` warns when >3 instruction boxes globally
- **Live:** ⚠️ MLD worksheets have a HELP BOX on every section (correct for MLD) but non-MLD should have max 1
- **Fix:** When SEND need is NOT MLD: enforce max 1 instruction box per section. When SEND is MLD: allow HELP BOX on every section (this is correct MLD adaptation). The validator should check the SEND context.
- **Effort:** 0.5 day | **Impact:** Reduces text clutter for non-MLD worksheets

#### 3.5 Question Type Variety
- **Requirement:** "Students remain engaged longer when task types vary. Include: MCQ, match, label diagram, spot the mistake, true/false, fill gap, sort/classify, explain"
- **Coded:** ✅ Section 1 already generates T/F + MCQ + Gap Fill (3 types). `enforcePedagogyStructurePresence` checks for variety.
- **Live:** ⚠️ Section 1 has good variety (T/F, MCQ, Gap Fill). Sections 2-3 are all written-response only.
- **Fix:** Add a prompt instruction for Sections 2-3: "Include at least 2 different question formats (e.g. one 'spot the mistake', one 'explain why', one calculation, one comparison)." Add a validator that warns when all questions in a section are the same format.
- **Effort:** 0.5 day | **Impact:** Better engagement in later sections

#### 3.6 Difficulty Progression Within Sections
- **Requirement:** "Order tasks so difficulty rises smoothly. Add medium-level questions between basics and challenges."
- **Coded:** ✅ `applyMathsProgressionAudit` checks mark progression + command-word difficulty
- **Live:** ⚠️ Working for maths; not verified for sciences/English
- **Fix:** Extend `applyMathsProgressionAudit` to all subjects (rename to `applyQuestionProgressionAudit`). Check that marks increase monotonically within each section (1-2-2-3 is fine; 4-2-3-1 is not).
- **Effort:** 0.5 day | **Impact:** Smoother learning curve

---

### TIER 4 — LOW (Polish / Enhancement)

#### 4.1 Vocabulary Footer Strip on Every Printed Page
- **Coded:** ✅ `vocabularyRepeatEnabled` metadata flag + renderer has `<VocabularyFooterStrip>` component
- **Status:** Needs verification that the `@media print` fixed-position CSS actually works across browsers
- **Fix:** Add a print-preview test. Ensure the strip renders at the bottom of each physical page (not just at the bottom of the HTML document).
- **Effort:** 0.5 day

#### 4.2 Autism Subtypes Elaboration
- **Requirement:** "For autism there are many different types so it needs to elaborate on how it's adapting to each need"
- **Coded:** ✅ `sendDescriptionsEnhanced.ts` has: High Masking, PDA, High Support Needs, Monotropism — each with specific adaptations
- **Live:** ✅ Visible in the SEND sidebar panel
- **Status:** Done — but could be improved by allowing teacher to SELECT which autism subtype when generating

#### 4.3 Year Group Consistency
- **Requirement:** "The sheet says Year 11 and Year 9 in different places. Choose one."
- **Coded:** ✅ `enforceYearGroupLock` validator checks for year-group drift
- **Live:** ✅ All tested worksheets show consistent year group
- **Status:** Done

#### 4.4 Print CSS Margins and Spacing
- **Requirement:** "Wide margins, consistent fonts, bold section headings, aligned numbering. CGP/Twinkl quality."
- **Coded:** ✅ `@media print` rules with 2.5cm margins, `page-break-inside: avoid`, challenge starts new page
- **Live:** ⚠️ Needs verification in actual print output
- **Fix:** Run a print-to-PDF test and verify margins, page breaks, and alignment.
- **Effort:** 0.5 day

---

## Unified Improvement Plan (Priority Order)

### Phase A — Critical Fixes (4 days)

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| A1 | Fix maths+SEND structure destruction | `ai.ts`, `worksheetPostValidator.ts` | 2d |
| A2 | Activate exam-style mode for maths (set `metadata.examStyle = true`) | `ai.ts` | 0.5d |
| A3 | Fix per-question marks (split section totals into per-Q) | `worksheetPostValidator.ts` | 1d |
| A4 | Fix HI inline definition concatenation bug | `worksheetPostValidator.ts` | 0.5d |

### Phase B — Diagram + Question Density (3 days)

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| B1 | Wire diagram library lookup into generation | NEW `diagramLibraryLookup.ts`, `ai.ts`, `WorksheetRenderer.tsx` | 2d |
| B2 | Fix Section 2 question count (inject from topic bank) | `worksheetPostValidator.ts`, `worksheet-generator.ts` | 1d |

### Phase C — Visual Language Completion (2.5 days)

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| C1 | Align renderer colours with `SEMANTIC_COLOURS` spec | `WorksheetRenderer.tsx` | 0.5d |
| C2 | Render flow arrows between sections | `WorksheetRenderer.tsx` | 0.5d |
| C3 | Apply border styles (dashed=optional, double=assessment) | `WorksheetRenderer.tsx` | 0.5d |
| C4 | Enable Pupil Legend (set `showLegend=true` for KS3/primary) | `ai.ts` | 0.5d |
| C5 | Fix Anxiety challenge title not applying | `worksheetPostValidator.ts`, `sendSectionLabels.ts` | 0.5d |

### Phase D — Quality Gating + Auto-Fix (2 days)

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| D1 | Quality checker shows visible banner when score <70 | `Worksheets.tsx` | 0.5d |
| D2 | Convert warn-only validators to inject missing sections | `worksheetPostValidator.ts` | 1d |
| D3 | Add question-type variety enforcement for S2-S3 | `worksheetPostValidator.ts`, `ai.ts` | 0.5d |

### Phase E — Polish (1.5 days)

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| E1 | Verify vocabulary footer in print output | `WorksheetRenderer.tsx` | 0.5d |
| E2 | Verify print margins and page breaks | `WorksheetRenderer.tsx` | 0.5d |
| E3 | Extend difficulty progression audit to all subjects | `mathsProgressionAudit.ts` → rename | 0.5d |

---

## Total Effort: ~13 days (across 3-4 sessions)

**Recommended execution order:** A1 → A2 → A3 → B1 → B2 → C1 → A4 → C5 → D1 → D2 → C2 → C3 → C4 → D3 → E1 → E2 → E3

---

## What's Already Done Well (No Changes Needed)

These items from the user's requirements are **fully implemented and shipping correctly**:

1. ✅ Response type icons (□○✎🎨🗣️) — visible on every question
2. ✅ Difficulty dots (●/●●/●●●) — visible on question badges
3. ✅ Overlay priority — SEND colour suppresses all others
4. ✅ L.O. wording — "By the end of the lesson you will..."
5. ✅ Common Misconceptions — sentence case, renamed from "Mistake"
6. ✅ Reflection cap — single exit question only
7. ✅ Three-tier differentiation (LA/MA/HA) — working via toolbar
8. ✅ SEND descriptions — detailed elaboration for every need
9. ✅ Autism subtypes — High Masking, PDA, High Support Needs, Monotropism
10. ✅ Misconception bank — per-topic lookup integrated
11. ✅ Year-group lock — no drift between header and content
12. ✅ ADHD overlay — tick boxes, brain break, varied types, max 3 S1
13. ✅ MLD overlay — HELP BOX on every section, topic context, sentence starters
14. ✅ Anxiety overlay — invitational section titles (S1-S3 working)
15. ✅ Dyscalculia overlay — 5-step calculation scaffold
16. ✅ HI overlay — Topic Summary block (inline definitions buggy)
17. ✅ Learning Impact metadata — stuck points, misconceptions, accessibility gate
18. ✅ 100-point quality checker — runs on every worksheet

---

## Maths Genie Benchmark Comparison

| Feature | Maths Genie | Adaptly (Current) | Adaptly (After Fixes) |
|---------|-------------|--------------------|-----------------------|
| Clean monochrome layout | ✅ | ❌ (coloured headers) | ✅ (exam-style mode) |
| Per-Q marks in brackets | ✅ `(3)` | ❌ (section totals) | ✅ (Phase A3) |
| Bold question numbers | ✅ | ⚠️ | ✅ (exam-style mode) |
| Generous working lines | ✅ | ⚠️ (exists via linesForMarks) | ✅ (verified after A2) |
| Progressive difficulty | ✅ | ⚠️ (maths only) | ✅ (Phase E3) |
| No scaffolding | ✅ | ❌ (always shown) | ✅ (exam-style suppresses) |
| GCSE command words | ✅ | ✅ (Calculate, Show, Find) | ✅ |
| Total marks at bottom | ✅ | ❌ | ✅ (add to exam-style renderer) |
| No vocabulary section | ✅ | ❌ (vocab always shown) | ✅ (exam-style suppresses vocab) |

**After Phase A (4 days), Adaptly maths worksheets will match Maths Genie style** when exam-style mode is active, while STILL offering the full pedagogical structure (LO, Vocab, Worked Example, Scaffolding) for worksheets with SEND needs that require it.

---

## The "Top 1% Worksheet Standard" Checklist

Every worksheet generated by Adaptly should include:

| Element | Coded? | Shipping? | After Fixes? |
|---------|--------|-----------|--------------|
| Retrieval Practice / Do Now | ✅ | ✅ (Section 1) | ✅ |
| Worked Example | ✅ | ✅ (non-maths) | ✅ (Phase A1 fixes maths) |
| Guided Practice | ✅ | ✅ (Section 1 varied types) | ✅ |
| Independent Practice | ✅ | ✅ (Section 2) | ✅ |
| Reasoning Questions | ✅ | ✅ (Explain/Why in S2-S3) | ✅ |
| Real World Application | ✅ | ⚠️ (inconsistent) | ✅ (add validator check) |
| Challenge Questions | ✅ | ✅ | ✅ |
| Reflection / Exit Ticket | ✅ | ✅ | ✅ |
| Vocabulary Support | ✅ | ✅ (non-maths) | ✅ (Phase A1 fixes maths) |
| SEND Adaptations | ✅ | ✅ | ✅ |
| Misconception Checks | ✅ | ✅ | ✅ |
| Visual Learning Supports | ✅ (5,975 diagrams) | ❌ | ✅ (Phase B1) |
| Per-Question Marks | ✅ | ❌ | ✅ (Phase A3) |
| Diagrams / No Text Walls | ✅ | ❌ | ✅ (Phase B1) |

**After all phases: 14/14 elements shipping. Top 1% standard met.**
