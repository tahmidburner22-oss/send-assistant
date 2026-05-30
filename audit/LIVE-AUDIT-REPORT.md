# Live Audit Report — Worksheet Generator (Full)

**Date:** 30 May 2026  
**Auditor:** Automated (Playwright 1.60.0 + Chromium 148 headless)  
**Site:** https://adaptly.co.uk  
**Method:** Logged in as `admin@adaptly.co.uk`, generated worksheets via the UI, extracted rendered text for analysis.

---

## Worksheets Generated

| # | Topic | SEND | Tier | Reading Age | Status |
|---|-------|------|------|-------------|--------|
| 1 | Bioenergetics | Hearing Impairment | Higher | Auto | ✅ Generated (8866 chars) |
| 2 | Forces and Motion | ADHD | Higher | Auto | ✅ Generated (7823 chars) |
| 3 | *(Failed — site 502)* | Anxiety | Foundation | — | ❌ Site down |
| 4 | Atomic Structure & Periodic Table | MLD | Foundation | KS2 | ✅ Generated (6575 chars) |
| 5 | Energy Transfers & Resources | Dyscalculia | Higher | Auto | ✅ Generated (8138 chars) |
| 6 | Electricity & Magnetism | Anxiety/Mental Health | Mixed | KS2 | ✅ Generated (7678 chars) |

> **Note:** Worksheet 3 (English/Anxiety) could not be generated due to site downtime (Railway 502). Worksheet 6 was intended as EAL but the SEND dropdown selected "Anxiety" due to option ordering; however it still provides useful data for testing Anxiety-specific criteria.

---

## Overall Results by Phase

| Phase | Criteria | WS1 (HI) | WS2 (ADHD) | WS4 (MLD) | WS5 (Dyscalc) | WS6 (Anxiety) | Overall |
|-------|----------|-----------|------------|-----------|---------------|---------------|---------|
| **1 — Structure** | 8 | 3/8 | 3/8 | 3/8 | 3/8 | 3/8 | **15/40 (38%)** |
| **2 — Self-Reflection** | 4 | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | **20/20 (100%)** |
| **3 — Examiner Tips** | 5 | 3/5 | 3/5 | 3/5 | 3/5 | 3/5 | **15/25 (60%)** |
| **4 — SEND** | varies | 3/5 | 3/4 | 2/4 | 1/3 | 1/3 | **10/19 (53%)** |
| **5 — Curriculum** | 4 | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | **20/20 (100%)** |
| **TOTAL** | — | 17/26 | 17/25 | 16/25 | 15/24 | 15/24 | **80/124 (65%)** |

---

## Phase 1 — Curriculum Structure (CONSISTENT FAILURES ACROSS ALL)

These failures are **systemic** — they appear identically in every worksheet.

### Consistent Failures (all worksheets)

| Criterion | Expected | Actual (all 5 worksheets) | Severity |
|-----------|----------|---------------------------|----------|
| **Marks format** | `(N marks)` — GCSE paper convention | `[N marks]` throughout | **P1-HIGH** |
| **Section 3 question count** | Exactly 5 | 6 questions in every worksheet | **P2-MED** |
| **Section 2 question count** | 6–8 | 4–5 questions consistently | **P2-MED** |
| **Section 1 structure** | 6–8 individually numbered questions | 3 composite blocks (T/F + MCQ + Gap Fill) with internal items | **P2-MED** |
| **Section 3 Working Out space** | Explicit "Working out:" box per question | Single "Show your working:" at the end of section | **P3-LOW** |

### Consistent Passes (all worksheets)

| Criterion | Evidence |
|-----------|----------|
| S3 uses GCSE command verbs | Identify, Explain, Describe, Compare, Evaluate, Calculate all present |
| S3 questions numbered sequentially | 1–6 within each section (though should be 1–5) |
| Clear section separation | SECTION 1 / SECTION 2 / SECTION 3 headers present |
| Marks allocation present | Every S2/S3 question has `[N marks]` allocated |

### Per-Worksheet Details

**WS1 (HI/Bioenergetics):** S1=3 blocks, S2=5 Qs, S3=6 Qs. Marks: `[2 marks]`, `[4 marks]`.  
**WS2 (ADHD/Forces):** S1=3 blocks, S2=4 Qs, S3=6 Qs. Marks: `[2 marks]`, `[4 marks]`.  
**WS4 (MLD/Atomic):** S1=3 blocks, S2=4 Qs, S3=6 Qs. Marks: `[2 marks]`, `[4 marks]`.  
**WS5 (Dyscalc/Energy):** S1=3 blocks, S2=4 Qs (+1 garbled), S3=6 Qs (+1 garbled). Marks: `[2 marks]`, `[4 marks]`.  
**WS6 (Anxiety/Electricity):** S1=3 blocks, S2=5 Qs, S3=6 Qs. Marks: `[2 marks]`, `[4 marks]`.

---

## Phase 2 — Topic-Specific Self-Reflection (100% PASS)

**All 5 worksheets pass all criteria.** This phase is fully implemented.

| Criterion | WS1 | WS2 | WS4 | WS5 | WS6 |
|-----------|-----|-----|-----|-----|-----|
| Self-reflection present | ✅ | ✅ | ✅ | ✅ | ✅ |
| Names topic explicitly | ✅ "bioenergetics" | ✅ "Forces and Motion" | ✅ "atomic structure" | ✅ "energy transfers" | ✅ "Electricity and Magnetism" |
| 5 distinct RAG items | ✅ Describe/Explain/Calculate/Compare/Evaluate | ✅ same | ✅ same | ✅ same | ✅ same |
| Exit ticket names topic | ✅ | ✅ | ✅ | ✅ | ✅ |

### Observation
The RAG template is consistent across all worksheets: "I can {verb} confidently when the question is about {topic}." The 5 verbs (Describe/Explain/Calculate/Compare/Evaluate) are always the same — this is good for consistency but could be slightly more varied per-topic in future.

---

## Phase 3 — Examiner/Revision Tips (60% PASS)

### Consistent Passes

| Criterion | Evidence |
|-----------|----------|
| Tips section present | "Top tips before you start" with 5 numbered tips in all worksheets |
| Common mistake reference | Tip 3 always: "Pupils most often lose marks on {topic} by writing the right idea in everyday language" |
| Names subject/topic | Topic name appears in all 5 tips |

### Consistent Failures

| Criterion | Expected | Actual | Severity |
|-----------|----------|--------|----------|
| **Tip 1 lists specific vocabulary** | Should name actual terms (e.g. "photosynthesis, mitochondria, ATP") | Generic: "Re-read the Key Vocabulary box for {topic}" — cross-references box without listing terms | **P3-LOW** |
| **Tip 6 references learning objective** | Should quote the actual LO | Only 5 tips present; no tip references the LO directly. The LO IS at the top of the worksheet but is not cited in the tips section | **P3-LOW** |

### Observation
The tips section has a fixed 5-category format (Vocabulary / Worked Example / Common Mistake / Past Papers / Retrieval) which matches the audit doc's revised 6-category panel minus the "learning objective" category. The 6th tip (LO reference) is missing.

---

## Phase 4 — SEND-Specific Content

### WS1: Hearing Impairment (HI) — 3/5

| Criterion | Pass | Evidence |
|-----------|------|----------|
| No-verbal cue | ✅ | "This information is here because you may not have heard all of the teacher's spoken explanation" |
| Word Bank present | ✅ | Full word bank in Gap Fill section (10 terms) |
| Key Vocabulary definitions | ✅ | 5 terms fully defined at the top |
| Topic summary block (labelled) | ❌ | Content exists but no explicit "TOPIC SUMMARY" heading — it's presented as learning objective + vocab + mistakes |
| Inline `(= definition)` annotations | ❌ | Definitions are at the top in a dedicated box, NOT inline within question text |

### WS2: ADHD — 3/4

| Criterion | Pass | Evidence |
|-----------|------|----------|
| Brain-break prompt midway | ✅ | "🧠 BRAIN BREAK — stand up and stretch for 30 seconds before continuing!" after S2 |
| Tick-box before each question | ✅ | `[ ]` markers visible before every question in all sections |
| Questions grouped in small visible blocks | ✅ | Section structure provides natural grouping |
| Brain-breaks scale with worksheet length | ❌ | Only ONE brain-break at fixed position (after S2 Q4). Audit doc says "every ~25%, minimum 3 Qs apart" — should have ~2 breaks for a worksheet of this length |

### WS4: MLD (Moderate Learning Difficulties) — 2/4

| Criterion | Pass | Evidence |
|-----------|------|----------|
| Topic context block at top | ✅ | "Remember: in this worksheet we are working on Atomic Structure and the Periodic Table." + "What we are learning today:" + "Tips while you work:" |
| Working memory aids on calc questions | ❌ | No formula reference boxes or number line prompts on calculation questions |
| Word bank / sentence starters | ✅ | Word bank present in Gap Fill; not sentence starters on free-response |
| Formula reference on calculation Qs | ❌ | Q3 ("calculate mass number") has no formula hint box |

### WS5: Dyscalculia — 1/3

| Criterion | Pass | Evidence |
|-----------|------|----------|
| 5-step recipe on calculation Qs ONLY | ❌ | No 5-step dyscalculia recipe injected into any question. There IS a "Roughly, what answer do you expect?" prompt on calc Qs and "Numbers in this question: ... Underline each one" cues, but not the expected 5-step scaffold |
| Lighter "vocabulary first" cue on non-calc | ❌ | No differentiation between calc and non-calc questions for dyscalculia |
| Number-tracking cues | ✅ | "Numbers in this question: 4, 1, 2, 3. Underline each one as you read so you do not lose them." — present on most questions |

### WS6: Anxiety/Mental Health — 1/3

| Criterion | Pass | Evidence |
|-----------|------|----------|
| Section titles invitational | ❌ | Standard titles: "SECTION 1 — RECALL", "SECTION 2 — UNDERSTANDING" — NOT "WARM-UP (no pressure)" |
| Challenge labelled OPTIONAL | ❌ | "Challenge yourself!" — not "OPTIONAL BONUS" |
| Invitational/encouragement language | ✅ | Reflection section uses softer language: "How are you feeling?", "One thing I felt confident about today was…" |

---

## Phase 5 — Curriculum Authority (100% PASS)

**All 5 worksheets pass all criteria.** The AI consistently produces real, factually correct content.

| Criterion | Evidence across all worksheets |
|-----------|-------------------------------|
| S1 = recall/lower-demand | True/False, MCQ, Gap Fill — recall-only tasks |
| S2 = multi-step reasoning | State, Identify, Describe, Explain, Calculate — reasoning required |
| S3 = authentic GCSE style | Compare and contrast, Evaluate, extended-prose with bullet scaffolding |
| Real curriculum content | Forces/Newton's Laws, bioenergetics/respiration/ATP, atomic structure/protons/electrons, Ohm's Law/V=IR — all factually correct |

---

## Critical Bugs Found

### BUG-1: Dyscalculia "number tracking" cue corrupts questions

In WS5 (Dyscalculia/Energy), the cue "Numbers in this question: X, Y, Z. Underline each one as you read so you do not lose them." is **injected inside question content**, creating garbled output:

```
4. Explain why energy efficiency is important when considering energy resources. Numbers in this question: 1, 2, 3, 50, 30,
[2 marks]
4. Underline each one as you read so you do not lose them.
[2 marks]
```

The cue text is being treated as a separate numbered question (getting its own `4.` number and `[2 marks]` allocation), corrupting the question numbering and inflating the question count.

### BUG-2: TEACHER_DIAGNOSES leaking into student view

In WS1 (HI/Bioenergetics) MCQ:
```
TEACHER_DIAGNOSES: A=m-frac-02, C=m-frac-01
```

And in WS5/WS6 MCQ:
```
TEACHER_DIAGNOSES: B=s-energy-01
TEACHER_DIAGNOSES: A=s-unit-01, B=s-unit-01, D=s-unit-01
```

This internal diagnostic metadata is visible in the student-facing text view.

---

## Summary of All Failures

| ID | Phase | Criterion | Severity | Systemic? |
|----|-------|-----------|----------|-----------|
| F1 | 1 | Marks use `[N marks]` not `(N marks)` | P1-HIGH | ✅ All worksheets |
| F2 | 1 | Section 3 has 6 Qs (should be 5) | P2-MED | ✅ All worksheets |
| F3 | 1 | Section 2 has 4–5 Qs (should be 6–8) | P2-MED | ✅ All worksheets |
| F4 | 1 | Section 1 = 3 blocks not 6–8 Qs | P2-MED | ✅ All worksheets |
| F5 | 1 | No per-Q "Working out:" box in S3 | P3-LOW | ✅ All worksheets |
| F6 | 3 | Tip 1 generic (doesn't list terms) | P3-LOW | ✅ All worksheets |
| F7 | 3 | No Tip 6 (learning objective ref) | P3-LOW | ✅ All worksheets |
| F8 | 4-HI | No inline `(= definition)` | P2-MED | HI only |
| F9 | 4-HI | No labelled "Topic Summary" block | P3-LOW | HI only |
| F10 | 4-ADHD | Only 1 brain-break (should scale) | P2-MED | ADHD only |
| F11 | 4-MLD | No formula reference on calc Qs | P2-MED | MLD only |
| F12 | 4-Dyscalc | No 5-step recipe on calc Qs | P2-MED | Dyscalculia only |
| F13 | 4-Anxiety | Section titles not invitational | P2-MED | Anxiety only |
| F14 | 4-Anxiety | Challenge not labelled OPTIONAL | P3-LOW | Anxiety only |
| F15 | BUG | Dyscalculia cue corrupts question numbering | P1-HIGH | Dyscalculia only |
| F16 | BUG | TEACHER_DIAGNOSES visible in student text | P1-HIGH | Multiple |

---

## Test Configuration

```
URL:          https://adaptly.co.uk/worksheets
Login:        admin@adaptly.co.uk / Admin1234!
Tool:         Playwright 1.60.0 + Chromium 148 (headless, Amazon Linux 2023)
Network:      OPEN_INTERNET
Timestamp:    2026-05-30T13:40–14:30 UTC
Output files: audit/worksheet-{1-6}-*.txt
```
