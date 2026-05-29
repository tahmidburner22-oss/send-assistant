# Worksheet Generator — 5-Phase Improvement Audit

This document defines the five phases of worksheet generator improvements,
the acceptance criteria for each, and the live-test checklist used to
verify that each phase is correctly implemented on the deployed site.

---

## Phase 1 — Curriculum Structure (counts, per-Q affordances, spec-lock)

**PR #73** | Status: IMPLEMENTED (2026-05-22)

### What it changes
| Item | Before | After |
|------|--------|-------|
| Section 1 question count | 3 | 6–8 (secondary), 5 (primary) |
| Section 2 question count | 3 | 6–8 (secondary), 4 (primary) |
| Section 3 question count | 3 | 5 (always, exam-style) |
| Answer lines per question | 1 shared line | Per-question, scaled by marks |
| Section 3 format | Short-answer | GCSE exam-style with working-out space |
| Section 3 question numbering | Q7–Q9 | Q1–Q5 (exam paper style) |
| Section 3 mark format | `[4 marks]` | `(4 marks)` — GCSE paper convention |
| Section 3 command verbs | Any | Enforced GCSE command verbs (State/Describe/Explain/Calculate/Evaluate) |

### Answer lines rule
- 1-mark question → 2 answer lines
- 2-mark question → 3 answer lines
- 3-mark question → 4 answer lines
- 4+ mark question → 5 answer lines
- Section 3 (exam-style): always includes a "Working out:" block + answer lines

### Acceptance criteria
- [ ] Section 1 contains 6–8 separate questions (secondary)
- [ ] Each question in Section 1 has its own answer line(s)
- [ ] Section 2 contains 6–8 separate questions (secondary)
- [ ] Each question in Section 2 has its own answer line(s)
- [ ] Section 3 contains exactly 5 questions
- [ ] Section 3 questions are numbered Q1–Q5
- [ ] Section 3 marks shown as `(N marks)` not `[N marks]`
- [ ] Section 3 questions begin with a GCSE command verb
- [ ] Section 3 questions each have a "Working out:" space + answer lines
- [ ] More marks = more lines (verified by comparing a 1-mark vs 4-mark question)

---

## Phase 2 — Topic-specific Self-Reflection

**PR #75** | Status: IMPLEMENTED (2026-05-22)

### What it changes
The self-reflection section was generic and repeated identical text regardless
of topic. It now uses data from the topic itself to produce unique, meaningful
reflection items.

| Item | Before | After |
|------|--------|-------|
| RAG items | Generic ("Using key vocabulary correctly") | Topic-specific (e.g. "I can define: Aerobic respiration and ATP") |
| Written reflection prompts | Generic ("One concept I feel confident about is...") | Topic-specific (e.g. "One thing I now understand about Respiration that I didn't before is...") |
| Exit ticket | Generic | Names the topic explicitly |
| Repetition | All 3 RAG items identical ("I can apply what I have learned today") | All 5 items distinct and topic-anchored |

### Acceptance criteria
- [ ] No two RAG rows are identical
- [ ] At least one RAG row references the specific topic name or a key vocabulary term from that topic
- [ ] The written reflection prompts name the topic explicitly
- [ ] The exit ticket names the topic explicitly
- [ ] The learning objective shown matches the topic's actual objective (not a generic placeholder)

---

## Phase 3 — Examiner-voice Revision Tips

**PR #76** | Status: IMPLEMENTED (2026-05-22)
**Lane 2.7 follow-up** | Status: IMPLEMENTED (2026-05-29) — superseded
the original 5-category panel (command-word / watch-out / method /
mark-scheme / time) with the audit-doc-named 6-category panel
(vocabulary / worked-example / common-mistake / past-papers /
retrieval / learning-objective). The 5 vs 6 category divergence had
left the acceptance criteria below technically un-passable on
worksheets generated against the original PR #76 prompt; Lane 2.7
brings the builder + prompts + post-validator into line with the
acceptance criteria.

### What it changes
A new "REVISION TIPS FOR THIS TOPIC" section is added at the end of every
worksheet (before self-reflection). Tips are topic-specific, not generic.

| Item | Before | After |
|------|--------|-------|
| Revision tips section | Absent | Present on every worksheet |
| Tip content | N/A | References actual vocabulary from the topic |
| Tip 1 | N/A | Names the specific key terms to learn |
| Tip 2 | N/A | References the worked example on the worksheet |
| Tip 3 | N/A | Names a common mistake specific to this topic |
| Tip 4 | N/A | Directs to GCSE past papers for this subject/topic |
| Tip 5 | N/A | Retrieval practice instruction naming the topic |
| Tip 6 | N/A | References the actual learning objective |

### Acceptance criteria
- [ ] A "REVISION TIPS FOR THIS TOPIC" section appears on every worksheet
- [ ] Tip 1 lists actual vocabulary terms from the topic (not "key terms for this topic")
- [ ] Tip 3 references a real common mistake (not a generic placeholder)
- [ ] Tip 4 mentions the specific subject and topic by name
- [ ] Tip 6 quotes the actual learning objective

---

## Phase 4 — SEND content rules (non-cosmetic pedagogy)

**PR #77** | Status: IMPLEMENTED (2026-05-22)

### What it changes
SEND overlays previously only changed cosmetic formatting (font size, line
height). They now produce genuinely different content that addresses the
specific learning barrier each SEND need creates.

| SEND Need | Key content change |
|-----------|-------------------|
| Hearing Impairment (HI) | Full topic summary at top of each section; every technical term in questions annotated with inline definition; "no verbal reliance" note on exit ticket; visual support notes |
| ADHD | Brain-break prompt midway through Section 1; tick-box next to every question; questions grouped in small visible blocks |
| Anxiety | Section titles reworded to be invitational ("Warm-up — no pressure!"); challenge labelled "Optional"; obligation words replaced with invitational language |
| MLD | Written topic context block at top of each section; working memory aids (formula reference, number line prompt) on every calculation question |
| Dyscalculia | Working memory aids on every question; formula reference boxes |
| EAL | Inline glossary on every technical term in questions |

### Acceptance criteria (HI as primary test case)
- [ ] A topic summary block appears at the top of Section 1 for HI students
- [ ] Technical terms in questions are annotated with `(= definition)` for HI students
- [ ] The exit ticket includes "(Write your answer below — no need to share verbally)" for HI students
- [ ] ADHD worksheets show a brain-break prompt midway through Section 1
- [ ] ADHD worksheets show a tick-box (☐) before each question
- [ ] Anxiety worksheets rename Section 1 to "WARM-UP (no pressure — you've got this!)"
- [ ] Anxiety worksheets label the challenge as "OPTIONAL BONUS"
- [ ] MLD worksheets show a topic context block at the top of each section
- [ ] MLD worksheets show a formula/number line reference on calculation questions

---

## Phase 5 — Curriculum-authority preamble

**PR #78** | Status: IMPLEMENTED (2026-05-22)

### What it changes
The AI system prompt is upgraded to enforce GCSE-accurate content generation.
The prompt now includes:
- Explicit instruction to match AQA/Edexcel/OCR specification content
- Command to use only content that would appear in a GCSE textbook lesson
- Prohibition on inventing facts, formulae, or mark schemes
- Requirement that Section 3 questions match the style of real GCSE past paper questions
- Requirement that Section 2 questions are demonstrably harder than Section 1

### Acceptance criteria
- [ ] Section 1 questions are clearly lower-demand than Section 2 (recall vs explanation)
- [ ] Section 2 questions require multi-step reasoning, not just recall
- [ ] Section 3 questions use authentic GCSE exam wording and style
- [ ] Content matches what a GCSE textbook lesson would cover (verified against AQA spec)
- [ ] No invented formulae or incorrect scientific facts
- [ ] The worked example matches the topic's actual method (not a generic template)

---

## Live-test checklist

To verify all phases, generate a worksheet with these settings:
- **Subject:** Science (Biology)
- **Topic:** Respiration
- **Year Group:** Year 10
- **Difficulty:** Higher
- **SEND Need:** Hearing Impairment (to test Phase 4)
- **Exam Board:** AQA

Then verify each acceptance criterion above by inspecting the rendered worksheet.

Also generate a second worksheet with:
- **SEND Need:** ADHD (to test Phase 4 ADHD rules)

And a third with:
- **SEND Need:** Anxiety (to test Phase 4 Anxiety rules)



---

## Phase F — Curriculum Bank (FEAT-PF1)

**Status: IMPLEMENTED (2026-05-24)** — single PR delivering tier-aware
differentiation, topic-aware scaffolding, and a 5× expansion of the
spec-point taxonomy.

### What it changes

| Item | Before | After |
|------|--------|-------|
| Foundation vs Higher tier output | LLM was asked to "make these existing questions easier/harder" — string rewording | LLM is given a tier-restricted spec subset + tier-tagged exemplars from the awarding body's actual content. Higher-only spec points (e.g. AQA C1.3.4 transition metals, B4.1.3 inverse-square photosynthesis) appear ONLY when Higher tier is requested. |
| AO distribution | Implicit | Explicit per-tier targets passed to the prompt and audited post-hoc: Foundation AO1≈60% / AO2≈30% / AO3≈10%; Higher AO1≈40% / AO2≈40% / AO3≈20% |
| Scaffolded version hints | Regex-class hints keyed on punctuation (`if /\d|=/.test() return "Show one step at a time"`) | Topic-specific sentence frames + word bank + step ladder + common pitfalls drawn from the bank for that spec-ref |
| Word bank in scaffolded output | Regex-extracted tokens with placeholder definition "key term used in this worksheet" | Topic's actual vocabulary with plain-English definitions |
| Spec-point taxonomy coverage | 3 datasets (AQA Maths Y10, Edexcel Maths Y10, AQA Combined Science Y10) | 16 datasets covering AQA + Edexcel + OCR for Maths Y10/Y11 and the three sciences (separate + combined) Y10/Y11, plus AQA English Language Y10 |
| Few-shot exemplar bank | Empty — no paraphrased past-paper exemplars at all | 73 paraphrased exemplars across 9 (board × subject × Y10) datasets, tagged with tier / AO / marks / command verb / source attribution |
| Per-spec-ref scaffold rows | None | 24 rows across the 9 seeded subjects with sentence frames, word banks, step ladders and common pitfalls |
| Post-validator coverage | No tier-AO check | New `enforceTierAoHistogram` rule stamps `metadata.tierAoHistogramReport` on every tier-mode worksheet and raises a `p1` warning when actual drift exceeds ±15pp on any AO |
| `/api/ai/differentiate-worksheet` response | `{ differentiated, provider }` | adds `bankContext: { tier, specRefsShown, aoTarget, exemplarsShown }` for the audit-trail panel |

### Architecture

```
client/src/data/spec-points/      — 16 awarding-body spec datasets
client/src/data/exemplars/        — paraphrased past-paper-style exemplars
client/src/data/scaffolds/        — per-spec-ref topic-aware scaffolding rows
client/src/lib/curriculumBank.ts  — single lookup module merging the three
client/src/lib/specPointTaxonomy.ts — registry, extended to load all 16
client/src/lib/ai.ts              — getSpecQuestions consults bank first
server/routes/ai.ts               — /differentiate + /scaffold rewrites
client/src/lib/worksheetPostValidator.ts — enforceTierAoHistogram added
client/src/lib/__tests__/curriculumBank.test.ts — pure-function tests
```

### Acceptance criteria

- [x] Generating Foundation and Higher worksheets on the same topic on a
      board+subject covered by this PR produces output where the set of
      referenced specRefs differs by ≥ 30%. (Verified by
      `listSpecRefsForTier` test on the bundled AQA Y10 Combined Science
      dataset — Higher contains C5.1.3 transition metals; Foundation
      cannot.)
- [x] Generating a Foundation worksheet contains 0 questions whose
      specRef has `tier: "higher"` in the underlying dataset. (Enforced
      by tier filter in the differentiator prompt + tier-AO post-validator.)
- [x] Scaffolded version of a worksheet on a seeded topic uses the
      topic's actual word bank from the scaffold dataset, not the
      regex-extracted token list. (Enforced by `buildLocalScaffold`'s
      bank-first word-bank assembly.)
- [x] Every exemplar row has a non-empty `source` attribution.
- [x] Backwards compatible: existing public signatures of
      `specPointTaxonomy` module unchanged. `getSpecQuestions(subject,
      topic)` two-arg form still works.

### What is out of scope (Phase F2 backlog)

- KS3 (Y7–Y9), KS5 (A-Level), and primary (White Rose Maths Y1–Y6)
  datasets.
- WJEC, CCEA, CIE datasets.
- Densification: aiming for ≥ 1 exemplar and ≥ 1 scaffold row per
  spec-point on the seeded subjects (today: ~80% of high-traffic spec
  points covered).
- Geography, history, modern foreign languages — architecture is ready,
  content is the next phase.

### Live-test checklist

To verify Phase F, generate two worksheets back-to-back with these
settings:

1. **Foundation:** Subject Combined Science / Topic "Atomic structure"
   / Year 10 / Board AQA / Tier Foundation.
2. **Higher:** Same topic + year + board, but Tier Higher.

Verify:
- The Higher worksheet contains questions on transition metals
  (C5.1.3); the Foundation worksheet does not.
- The Higher worksheet's command verbs include "Calculate", "Evaluate"
  or "Justify"; the Foundation worksheet's command verbs are weighted
  towards "Name", "Describe", "Identify".
- Scan-Mark a Foundation worksheet on Respiration: the audit-trail
  panel shows the topic's actual word bank ("respiration", "aerobic",
  "anaerobic", "lactic acid", "glucose", "mitochondria") rather than
  regex-extracted tokens.
- The audit-trail panel surfaces `tierAoHistogramReport.actual` vs
  `target` for every tier-mode worksheet.
