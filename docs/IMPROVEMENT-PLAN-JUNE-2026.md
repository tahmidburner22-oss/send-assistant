# Adaptly Worksheet System — Comprehensive Improvement Plan (June 2026)

> **Goal:** Every worksheet must be better than Chalkie, Twinkl, Maths Genie,
> Corbett Maths and White Rose by improving learning outcomes, SEND accessibility,
> teacher usability and student engagement.

---

## Executive Summary

This plan addresses **all** feedback from the June 2026 worksheet scrutiny review,
consolidating findings from Science (Forces & Motion — Year 7), Maths, and the
broader product comparison against Maths Genie, CGP, Twinkl, and White Rose.

### What's Already Implemented (Strong Foundation)

| Feature | Status | File(s) |
|---------|--------|---------|
| 7 semantic colours (Blue/Green/Yellow/Orange/Red/Purple/Grey) | ✅ Shipped | `WorksheetRenderer.tsx` |
| 18 section-type icons via Lucide React | ✅ Shipped | `WorksheetRenderer.tsx` |
| Overlay priority (SEND overlay suppresses all colours) | ✅ Shipped | `WorksheetRenderer.tsx` |
| SEND overlay engine (dyslexia, ADHD, ASC, MLD, EAL, dyscalculia, etc.) | ✅ Shipped | `server/lib/overlayEngine.ts` |
| Post-validator chain (10+ validators) | ✅ Shipped | `worksheetPostValidator.ts` |
| Three-tier differentiation (layout families) | ✅ Shipped | `worksheetConstraints.ts` |
| Year-group calibration (sentence length, marks, time) | ✅ Shipped | `worksheetSectionTargets.ts` |
| Misconception bank with per-topic lookup | ✅ Shipped | `misconception-bank.ts` |
| SVG diagram generation + library | ✅ Shipped | `SVGDiagram.tsx` |
| QA score builder (100-point scale) | ✅ Shipped | `qaScoreBuilder.ts` |
| Exam paper builder | ✅ Shipped | `createExamPaperBuilder.ts` |

### What's Missing or Broken (The Gaps)

| # | Issue | Impact | Fix Type |
|---|-------|--------|----------|
| 1 | L.O. says "Students will" instead of "By the end of the lesson you will" | Pupil-facing tone wrong | Post-validator |
| 2 | Common Errors in ALL CAPS + says "Mistake" not "Misconception" | Looks unprofessional | Post-validator + label rename |
| 3 | Diagrams not reliably generated (placeholders leak through) | Empty diagram boxes shown | Enforcement + fallback hardening |
| 4 | Worksheets too long for Year 7 (too much text) | KS3 pupils overwhelmed | Prompt calibration + section targets |
| 5 | Exam questions don't match real board layout (Maths Genie style) | Looks amateur | Template + renderer fix |
| 6 | Do Now → I/We/You structure is opt-in, not default | Pedagogy incomplete | Make it mandatory |
| 7 | Vocabulary only on page 1 (not every page) | SEND: working memory load | Repeating vocab footer |
| 8 | Response type icons missing (□ ○ ✎ 🎨 🗣️) | Visual language incomplete | New renderer feature |
| 9 | Progress markers (① ② ③) not rendered | Flow unclear | New renderer feature |
| 10 | Difficulty dots (● ●● ●●●) not shown | Differentiation invisible | New renderer feature |
| 11 | Flow arrows (➜ ↓ ↺ ⇒) not mapped | Navigation unclear | New config |
| 12 | Quality checker doesn't validate pedagogy | Bad worksheets can ship | Extend validator |
| 13 | SEND descriptions lack detail (autism subtypes) | Teachers can't trust adaptations | Overlay engine enhancement |
| 14 | Maths worksheets too text-heavy vs Maths Genie | Teachers prefer competitors | Prompt + constraint changes |
| 15 | Reflection section too long (confidence grid + written + exit ticket) | Page waste | Cap to single exit question |
| 16 | Repeated "WHAT YOU NEED TO DO" boxes (Science) | Duplication, clutter | ASC overlay already fixed; enforce globally |
| 17 | Word bank includes duplicates / irrelevant words | Confusing for pupils | Already fixed by dedupeWordBank — verify |
| 18 | Multiple MCQ answers pre-selected | Broken questions | Already fixed by enforceSingleMcqCorrect — verify |

---

## The Maths Genie Standard

After reviewing [Maths Genie exam booklets](https://www.mathsgenie.co.uk/resources/7-quadratic-formula.pdf),
the key design principles that make their resources preferred by teachers:

1. **Ultra-minimal layout** — question number, stem, marks in brackets, working lines. Nothing else.
2. **Exam-board-accurate** — matches Edexcel/AQA/OCR actual paper formatting exactly.
3. **No unnecessary text** — zero instructional paragraphs between questions.
4. **Clear difficulty grading** — ordered by grade boundary, not mixed.
5. **Professional whitespace** — generous margins, no clutter, no decorative elements.
6. **Consistent typography** — one font, one size, clear hierarchy.

### What Adaptly Must Do Differently (Our Advantage Over Maths Genie)

Maths Genie is excellent but offers ZERO differentiation, ZERO SEND support, ZERO
scaffolding. Adaptly's advantage is:

- Same clean exam-style layout AS DEFAULT for exam practice mode
- PLUS automatic SEND adaptations layered on top
- PLUS three-tier differentiation (same worksheet, three access levels)
- PLUS worked examples and vocabulary support for those who need it
- PLUS misconception checks and diagnostic power

---

## Implementation Plan (6 Sprints, 1 PR)

### Sprint 1: Critical Fixes
- [x] L.O. wording enforcement ("By the end of the lesson you will...")
- [x] Common Mistakes: ALL CAPS → sentence case; "Mistake" → "Misconception"
- [x] Overlay enforcement hardened (overlay ALWAYS takes priority)
- [x] Diagram placeholder removal hardened

### Sprint 2: Language & Length
- [x] KS3 worksheets shorter (reduce section targets for Year 7-9)
- [x] Exam-style mode: Maths Genie layout (minimal, clean, board-accurate)
- [x] Max 2-line instructions on maths worksheets
- [x] Single reflection element only (one exit question)

### Sprint 3: Pedagogy
- [x] Do Now → I Do → We Do → You Do structure as DEFAULT
- [x] Vocabulary repeats on every page (print CSS footer)
- [x] Misconception checks enforced (every worksheet)
- [x] Fluency → Reasoning → Problem Solving for maths

### Sprint 4: Visual Language Completions
- [x] Response type icons (□ ○ ✎ 🎨 🗣️)
- [x] Progress markers (① ② ③)
- [x] Difficulty dots (● ●● ●●●)
- [x] Flow arrows (➜ ↓ ↺ ⇒ ↔ ⤴ ⤵)
- [x] Border styles (solid=essential, dashed=optional, double=assessment)

### Sprint 5: Quality Checker (AI Pedagogy Validator)
- [x] SEND check: vocab support, worked example, clear instructions, visual support
- [x] Pedagogy check: retrieval, guided practice, independent, reasoning, challenge
- [x] Assessment check: misconception check, exit ticket
- [x] Design check: no text walls, good spacing, consistent formatting
- [x] Learning impact requirements validation

### Sprint 6: Commercial Polish & SEND Enhancement
- [x] SEND descriptions enhanced (autism subtypes elaborated)
- [x] Typography consistency enforcement
- [x] Print optimisation (A4 page-fit)
- [x] Vocabulary strip design improvement

---

## Top 1% Worksheet Standard Checklist

Every worksheet generated by Adaptly MUST include:

- [ ] Retrieval Practice (Do Now)
- [ ] Worked Example (I Do)
- [ ] Guided Practice (We Do)
- [ ] Independent Practice (You Do)
- [ ] Reasoning Questions
- [ ] Real-World Application
- [ ] Challenge Questions
- [ ] Reflection / Exit Ticket (ONE only)
- [ ] Vocabulary Support (every page)
- [ ] SEND Adaptations (automatic)
- [ ] Misconception Checks
- [ ] Visual Learning Supports (diagrams)
- [ ] Difficulty Indicators
- [ ] Response Type Icons

---

## Benchmarking Against Competitors

| Feature | Chalkie | Twinkl | Maths Genie | Corbett | White Rose | **Adaptly** |
|---------|---------|--------|-------------|---------|------------|-------------|
| SEND automatic | ❌ | Partial | ❌ | ❌ | ❌ | **✅ Full** |
| Three-tier differentiation | ❌ | ❌ | ❌ | ❌ | Partial | **✅ Auto** |
| Misconception checks | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Auto** |
| Exam-board accuracy | ❌ | ❌ | ✅ | ✅ | Partial | **✅** |
| Scaffolded progression | ❌ | Partial | ❌ | ❌ | ✅ | **✅ Auto** |
| Visual language system | ❌ | Partial | ❌ | ❌ | ❌ | **✅ Full** |
| Per-pupil adaptation | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Working example + mark scheme | ❌ | ❌ | ❌ | ✅ | ✅ | **✅ Auto** |
| Print-ready A4 | Partial | ✅ | ✅ | ✅ | ✅ | **✅** |
| Clean minimal design | ❌ | Partial | ✅ | ✅ | ✅ | **✅** |

---

*Generated: June 2026 | Adaptly Engineering*
