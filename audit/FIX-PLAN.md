# Fix Plan — Worksheet Generator Audit Failures

**Created:** 30 May 2026  
**Source:** `audit/LIVE-AUDIT-REPORT.md`  
**Scope:** 16 failures + 2 critical bugs identified across 5 generated worksheets

---

## Priority Definitions

| Priority | Meaning | SLA |
|----------|---------|-----|
| **P1-CRITICAL** | Student-facing data leak or content corruption | Fix before pilot |
| **P2-HIGH** | Spec violation that affects assessment validity | Fix within 1 sprint |
| **P3-MEDIUM** | Feature gap — overlay not matching audit doc spec | Fix within 2 sprints |
| **P4-LOW** | Polish / enhancement — functionally acceptable | Backlog |

---

## Sprint 1 — Critical Bugs & Systemic Structural Issues

### FIX-1: TEACHER_DIAGNOSES leaking into student view
**Priority:** P1-CRITICAL  
**Failure IDs:** F16  
**Affected files:** `client/src/lib/ai.ts` or `worksheetPostValidator.ts` (wherever MCQ output is formatted)

**Problem:** Internal diagnostic metadata (`TEACHER_DIAGNOSES: A=m-frac-02, C=m-frac-01`) is visible in the rendered student text of MCQ questions.

**Fix:**
1. In the post-validator or rendering pipeline, strip any line matching `/^TEACHER_DIAGNOSES:.*/` from student-visible output.
2. Move `TEACHER_DIAGNOSES` to a separate metadata field on the question object (e.g. `question.teacherDiagnoses`) that is only rendered in the Teacher view.
3. Add a regression test that asserts no rendered worksheet text contains `TEACHER_DIAGNOSES`.

**Test:** Generate any worksheet → switch to Student view → grep for "TEACHER_DIAGNOSES" → must return 0 matches.

---

### FIX-2: Dyscalculia "number tracking" cue corrupts question numbering
**Priority:** P1-CRITICAL  
**Failure IDs:** F15  
**Affected files:** `client/src/lib/overlayEngine.ts` (dyscalculia overlay builder)

**Problem:** The cue "Numbers in this question: X, Y, Z. Underline each one as you read so you do not lose them." is being appended as a new paragraph that the renderer treats as a separate numbered question. This creates:
- Duplicate question numbers (e.g. two `4.` entries)
- Inflated mark allocations (garbled `[2 marks]` on the cue text)
- Corrupted S2/S3 question counts

**Fix:**
1. Ensure the number-tracking cue is inserted as an **inline annotation** within the existing question's content (e.g. as a `<span class="dyscalculia-cue">` or as a `send-support` section with `isOverlay: true`), NOT as a new sibling paragraph/section.
2. Alternatively, place it in a styled callout box below the question text but before the answer lines, marked as non-numbered content.
3. Add `assertBaseSectionsPreserved` coverage for dyscalculia overlays specifically.

**Test:** Generate Dyscalculia worksheet → count S2 questions → must be exactly the same as non-SEND version. No question should have duplicate numbering.

---

### FIX-3: Marks format `[N marks]` → `(N marks)`
**Priority:** P2-HIGH  
**Failure IDs:** F1  
**Affected files:** `client/src/lib/ai.ts` (system prompt for Section 2/3 generation)

**Problem:** All worksheets use `[4 marks]` format. The audit doc and GCSE paper convention require `(4 marks)`.

**Fix:**
1. In the AI system prompt for Section 2 and Section 3, change the instruction from "show marks as [N marks]" to "show marks as (N marks) — this is the GCSE paper convention".
2. In the post-validator (`worksheetPostValidator.ts`), add a rule that replaces any `[N marks]` with `(N marks)` as a safety net.
3. Update `WorksheetRenderer.tsx` if it applies bracket formatting during render.

**Test:** Generate any worksheet → all mark indicators in S2/S3 must use round brackets `(N marks)`.

---

### FIX-4: Section 3 generates 6 questions (should be exactly 5)
**Priority:** P2-HIGH  
**Failure IDs:** F2  
**Affected files:** `client/src/lib/worksheetSectionTargets.ts`, `client/src/lib/ai.ts`

**Problem:** Section 3 consistently generates 6 exam-style questions. The spec says exactly 5.

**Fix:**
1. In `worksheetSectionTargets.ts`, verify the S3 target is set to `{ min: 5, max: 5 }` for secondary.
2. In the AI prompt for Section 3, make the constraint explicit: "Generate EXACTLY 5 exam-style questions for Section 3. Do not generate more or fewer."
3. In the post-validator, add a hard check: if S3 question count ≠ 5, either trim the last question or raise a `p1` warning.

**Test:** Generate 3 worksheets with different topics → Section 3 must have exactly 5 questions in all.

---

### FIX-5: Section 2 generates 4–5 questions (should be 6–8)
**Priority:** P2-HIGH  
**Failure IDs:** F3  
**Affected files:** `client/src/lib/worksheetSectionTargets.ts`, `client/src/lib/ai.ts`

**Problem:** Section 2 consistently under-generates (4–5 questions vs target of 6–8).

**Fix:**
1. In `worksheetSectionTargets.ts`, verify the S2 target is `{ min: 6, max: 8 }` for secondary.
2. In the AI prompt, make it explicit: "Section 2 must contain 6–8 questions. Each question should be on a separate numbered line."
3. Investigate whether the mark budget is constraining — if total marks target is too low, the AI may stop generating early.

**Test:** Generate 3 worksheets → Section 2 must contain 6–8 individually numbered questions.

---

## Sprint 2 — SEND Overlay Gaps

### FIX-6: Section 1 structure (3 blocks vs 6–8 individual Qs)
**Priority:** P3-MEDIUM  
**Failure IDs:** F4  
**Affected files:** `client/src/lib/ai.ts` (Section 1 prompt)

**Problem:** Section 1 is generated as 3 composite blocks (True/False block, MCQ block, Gap Fill block) rather than 6–8 individually numbered questions.

**Fix:**  
Review the Section 1 spec — the audit doc says "6–8 separate questions" but the generated output uses a mixed-type format (T/F + MCQ + Gap Fill) which may be intentional for pedagogical reasons. 

**Decision needed:** Is the current format (3 varied-type blocks with internal items totalling 9+) acceptable? If yes, update the audit doc. If no, restructure S1 to be individually numbered questions of mixed types.

---

### FIX-7: HI — Inline `(= definition)` annotations in question text
**Priority:** P3-MEDIUM  
**Failure IDs:** F8  
**Affected files:** `client/src/lib/overlayEngine.ts` (HI overlay)

**Problem:** Technical terms within questions are NOT annotated with inline definitions. Definitions exist in a dedicated Key Vocabulary box at the top.

**Fix:**
1. In the HI overlay builder, after identifying technical terms in question text, inject inline `(= plain definition)` annotations.
2. Use the vocabulary list already defined at the top as the source for definitions.
3. Only annotate on first occurrence per section to avoid clutter.

**Test:** Generate HI worksheet → at least 3 questions should contain `(= ...)` annotations for technical terms.

---

### FIX-8: ADHD — Brain-breaks should scale with worksheet length
**Priority:** P3-MEDIUM  
**Failure IDs:** F10  
**Affected files:** `client/src/lib/overlayEngine.ts` (ADHD overlay)

**Problem:** Only 1 brain-break is inserted at a fixed position (after S2). The audit doc says "every ~25%, minimum 3 Qs apart".

**Fix:**
1. Count total questions across all sections.
2. Insert brain-breaks at approximately 25%, 50%, 75% of the way through (minimum 3 questions apart).
3. For a typical worksheet with ~15 questions, this means 2–3 brain-breaks.

**Test:** Generate ADHD worksheet with 15+ questions → must have ≥2 brain-break prompts, spaced at least 3 questions apart.

---

### FIX-9: Dyscalculia — 5-step recipe on calculation questions only
**Priority:** P3-MEDIUM  
**Failure IDs:** F12  
**Affected files:** `client/src/lib/overlayEngine.ts` (dyscalculia overlay)

**Problem:** The dyscalculia overlay adds "underline numbers" cues but does NOT inject the 5-step numeric recipe on calculation questions. Non-calculation questions should get a lighter "vocabulary first" cue instead.

**Fix:**
1. Use the existing `isCalculationSection()` helper to identify calculation questions.
2. For calculation questions: inject the 5-step recipe (Definition → Identify knowns → Formula → Substitute → Calculate).
3. For non-calculation questions: inject a lighter "vocabulary first" cue.
4. Also fix FIX-2 (cue injection method) to prevent question numbering corruption.

**Test:** Generate Dyscalculia worksheet on a topic with both calc and non-calc questions → calc Qs have 5-step recipe, non-calc Qs have vocabulary cue.

---

### FIX-10: MLD — Formula reference on calculation questions
**Priority:** P3-MEDIUM  
**Failure IDs:** F11  
**Affected files:** `client/src/lib/overlayEngine.ts` (MLD overlay)

**Problem:** MLD worksheets have a topic context block (good!) but no formula reference boxes or working memory aids on calculation questions.

**Fix:**
1. For MLD overlays, on any question identified as calculation-type, inject a formula reference hint box (e.g. "Formula you need: KE = ½mv²").
2. Add a number-line prompt for numeric questions where appropriate.

**Test:** Generate MLD worksheet on Energy → calculation questions must show formula reference box.

---

### FIX-11: Anxiety — Invitational section titles and optional challenge
**Priority:** P3-MEDIUM  
**Failure IDs:** F13, F14  
**Affected files:** `client/src/lib/overlayEngine.ts` (Anxiety/SEMH overlay)

**Problem:** Section titles use standard "SECTION 1 — RECALL" format instead of invitational "WARM-UP (no pressure — you've got this!)". Challenge section says "Challenge yourself!" not "OPTIONAL BONUS".

**Fix:**
1. In the Anxiety overlay, rename section headers:
   - S1 → "WARM-UP (no pressure — you've got this!)"
   - S2 → "BUILDING YOUR UNDERSTANDING"  
   - S3 → "STRETCH YOURSELF (take your time)"
   - Challenge → "OPTIONAL BONUS — only if you want to!"
2. Replace obligation language ("you must", "complete all") with invitational ("you could", "have a go at").

**Test:** Generate Anxiety worksheet → verify section titles are invitational; Challenge section labelled "OPTIONAL".

---

## Sprint 3 — Polish & Enhancement

### FIX-12: Section 3 per-question "Working out:" box
**Priority:** P4-LOW  
**Failure IDs:** F5  
**Affected files:** `client/src/lib/ai.ts` (S3 prompt), renderer

**Fix:** Add "Working out:" space before answer lines on each S3 question (not just a single block at the end).

---

### FIX-13: Examiner Tip 1 — list specific vocabulary terms
**Priority:** P4-LOW  
**Failure IDs:** F6  
**Affected files:** `client/src/lib/ai.ts` (tips generation prompt)

**Fix:** Change Tip 1 from "Re-read the Key Vocabulary box for {topic}" to "Make sure you can define these terms: {term1}, {term2}, {term3}..." using the actual vocabulary list.

---

### FIX-14: Add Tip 6 — learning objective reference
**Priority:** P4-LOW  
**Failure IDs:** F7  
**Affected files:** `client/src/lib/ai.ts` (tips generation prompt)

**Fix:** Add a 6th tip: "LEARNING OBJECTIVE: Check you can confidently {LO text}. If not, re-read the worked example."

---

### FIX-15: HI — Labelled "TOPIC SUMMARY" heading
**Priority:** P4-LOW  
**Failure IDs:** F9  
**Affected files:** `client/src/lib/overlayEngine.ts` (HI overlay)

**Fix:** Add an explicit "TOPIC SUMMARY" heading above the existing LO + vocabulary + context block for HI students.

---

## Dependency Graph

```
FIX-2 (dyscalculia corruption) ──→ FIX-9 (dyscalculia 5-step recipe)
                                     ↑ must fix injection method first

FIX-4 (S3 count) ─────────────────→ FIX-12 (per-Q working out box)
FIX-5 (S2 count) ──┐                  ↑ count must be correct first
                    └→ FIX-6 (S1 structure decision)

All Sprint 1 fixes are independent of each other.
All Sprint 2 SEND fixes are independent of each other (except FIX-2 → FIX-9).
Sprint 3 can proceed in parallel once Sprint 1 is merged.
```

---

## Estimated Effort

| Sprint | Fixes | Effort | Risk |
|--------|-------|--------|------|
| Sprint 1 | FIX-1 to FIX-5 | 2–3 days | Low — prompt/validator changes, no architecture risk |
| Sprint 2 | FIX-6 to FIX-11 | 3–5 days | Medium — overlay engine changes, need careful testing per SEND type |
| Sprint 3 | FIX-12 to FIX-15 | 1–2 days | Low — prompt wording changes |

**Total estimated:** 6–10 days of development work.

---

## Files to Modify

| File | Fixes |
|------|-------|
| `client/src/lib/ai.ts` | FIX-3, FIX-4, FIX-5, FIX-6, FIX-12, FIX-13, FIX-14 |
| `client/src/lib/worksheetPostValidator.ts` | FIX-1, FIX-3, FIX-4 |
| `client/src/lib/overlayEngine.ts` | FIX-2, FIX-7, FIX-8, FIX-9, FIX-10, FIX-11, FIX-15 |
| `client/src/lib/worksheetSectionTargets.ts` | FIX-4, FIX-5 |
| `client/src/components/WorksheetRenderer.tsx` | FIX-1 (strip TEACHER_DIAGNOSES from render) |
