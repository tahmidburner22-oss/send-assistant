# Implementation Plan — Worksheet Generator Fixes

**Date:** 30 May 2026
**Source:** `audit/IMPROVEMENTS.md` (28 improvements across P1-P5)
**Goal:** Implement all fixes in minimum PRs, respecting dependency chains

---

## Strategy

Group improvements by:
1. **Shared file surface** — changes touching the same file ship together
2. **Dependency order** — blockers land before dependents
3. **Risk isolation** — P1 critical fixes in their own PR for fast merge

This yields **4 PRs** total:

---

## PR 1: Critical Safety Nets (P1 Bugs)

**Branch:** `fix/critical-safety-nets`
**Risk:** Low (additive-only, no behavior change to correct outputs)
**Merge priority:** Immediate — blocks pilot

### Improvements Covered

| ID | Title | Fix Type |
|----|-------|----------|
| IMP-01 | TEACHER_DIAGNOSES leak | Regex strip in post-validator + renderer safety net |
| IMP-02 | Dyscalculia cue corruption | Refactor cue injection to avoid paragraph splitting |
| IMP-03 | Prompt RULE: lines leaking | Regex strip in post-validator |
| IMP-06 | Marks format [N marks] -> (N marks) | Regex replace in post-validator |

### Files Changed

| File | Changes |
|------|---------|
| `client/src/lib/worksheetPostValidator.ts` | Add `enforceContentSanitisation` validator: strips TEACHER_DIAGNOSES lines, strips RULE: lines, replaces `[N marks]` with `(N marks)`. Fix `enforceDyscalculiaMarkers` to inject cue as inline annotation rather than newline-separated paragraph. |
| `client/src/components/WorksheetRenderer.tsx` | Add final safety-net regex before render: strip any line matching `/^TEACHER_DIAGNOSES:.*/gm` and `/^RULE:.*/gm` from student-visible content |

### Implementation Details

**IMP-01 + IMP-03 (content sanitisation):**
```typescript
// Add to worksheetPostValidator.ts as a new registered validator
export function enforceContentSanitisation(
  ws: PostValidatorWorksheet,
): PostValidatorResult {
  const warnings: string[] = [];
  let sanitised = 0;
  const next = (ws.sections || []).map(s => {
    if (s.teacherOnly) return s;
    if (typeof s.content !== "string") return s;
    let content = s.content;
    // Strip TEACHER_DIAGNOSES lines
    const before = content;
    content = content.replace(/^TEACHER_DIAGNOSES:.*$/gm, "").trim();
    // Strip RULE: instruction lines
    content = content.replace(/^RULE:.*$/gm, "").trim();
    // Normalise marks format: [N marks] -> (N marks)
    content = content.replace(/\[(\d+)\s*marks?\]/gi, "($1 marks)");
    if (content !== before) sanitised++;
    return content !== s.content ? { ...s, content } : s;
  });
  if (sanitised > 0) {
    warnings.push(`[Content Sanitisation] Cleaned ${sanitised} section(s): stripped prompt leaks, normalised marks format.`);
  }
  return { worksheet: { ...ws, sections: next }, warnings };
}
```

**IMP-02 (dyscalculia cue fix):**
Change `enforceDyscalculiaMarkers` from:
```typescript
const cue = `\n\nNumbers in this question: ${uniqueNumbers.join(", ")}. Underline each one...`;
return { ...s, content: content + cue };
```
To:
```typescript
// Append cue inline (no double-newline) with a visual separator
const cue = ` — [Numbers in this question: ${uniqueNumbers.join(", ")}. Underline each one as you read.]`;
return { ...s, content: content.trimEnd() + cue };
```
Or better: add a `sendAnnotations` array field on the section object.

### Test Criteria
- [ ] No `TEACHER_DIAGNOSES` in student text (all SEND profiles)
- [ ] No `RULE:` in student text
- [ ] All marks show `(N marks)` not `[N marks]`
- [ ] Dyscalculia worksheet: S2 question count matches non-SEND version (no duplicate numbers)

---

## PR 2: Structural Enforcement (P2 Systemic)

**Branch:** `fix/structural-enforcement`
**Risk:** Medium (changes AI prompt + adds post-validator enforcement)
**Merge priority:** Within 3 days of PR 1

### Improvements Covered

| ID | Title | Fix Type |
|----|-------|----------|
| IMP-04 | S3 = exactly 5 questions | Post-validator trim + prompt reinforcement |
| IMP-05 | S2 = 6-8 questions | Prompt strengthening |
| IMP-08 | Per-question working-out box in S3 | Prompt addition |
| IMP-09 | Mark allocations match command word demand | Prompt constraint |
| IMP-17 | Validator output doesn't reach DOM | Pipeline investigation + fix |
| IMP-25 | S2 question count enforcement | Post-validator retry logic |

### Files Changed

| File | Changes |
|------|---------|
| `client/src/lib/ai.ts` | Strengthen S2 prompt (MUST generate 7 questions, explicit examples). Add per-Q working-out space to S3 template. Add command-word-to-marks mapping. |
| `client/src/lib/worksheetPostValidator.ts` | Change `enforceSectionQuestionCounts` from warn-only to active enforcement: trim S3 to 5 if >5; warn (but don't block) if S2 <6. |
| `client/src/lib/worksheetSectionTargets.ts` | Verify targets are correct (they are — no changes needed). |
| Pipeline entry point (wherever validators are called) | Ensure validated worksheet object is what the renderer receives. Trace data flow from post-validator output -> renderer input. |

### Implementation Details

**IMP-04 (S3 trim):**
In `enforceSectionQuestionCounts`, after counting:
```typescript
if (counts.application > SECTION_QUESTION_TARGETS.application.max) {
  const excess = counts.application - SECTION_QUESTION_TARGETS.application.max;
  // Remove last N application-type sections
  let removed = 0;
  for (let i = sections.length - 1; i >= 0 && removed < excess; i--) {
    if (inferSectionGroup(sections[i]) === "application") {
      sections.splice(i, 1);
      removed++;
    }
  }
  warnings.push(`Trimmed ${removed} excess S3 question(s) to hit target of ${SECTION_QUESTION_TARGETS.application.max}.`);
}
```

**IMP-05 (S2 prompt):**
Add to S2 section in ai.ts:
```
CRITICAL CONSTRAINT: Section 2 MUST contain EXACTLY 7 individually numbered questions.
Each question on its own line. Do NOT stop before question 6. Generate all 7.
Question types: State (×1), Identify (×1), Calculate (×1), Describe (×2), Explain (×2).
```

**IMP-09 (mark allocation):**
Add to S3 prompt:
```
Mark allocations MUST vary by command word complexity:
- State/Name/Give = 1-2 marks
- Identify/Define = 2 marks  
- Describe = 3 marks
- Explain/Calculate = 4 marks
- Compare/Analyse = 5 marks
- Evaluate/Discuss/Justify = 6 marks
Total S3 marks target: 20-24. Do NOT give every question the same marks.
```

**IMP-17 (pipeline fix):**
Investigate the rendering pipeline to ensure validated `sections` array flows through to the component tree. Add a smoke-test: if `metadata.postValidatorWarnings` exists on the rendered worksheet, the validator ran — but did its mutations persist?

### Test Criteria
- [ ] S3 has exactly 5 questions (across 5 test worksheets)
- [ ] S2 has 6-8 questions (across 5 test worksheets)
- [ ] S3 mark allocations vary (not all identical)
- [ ] Each S3 question has "Working out:" space
- [ ] Anxiety section titles appear correctly in rendered output (IMP-17 validates pipeline)

---

## PR 3: SEND Overlay Completeness (P3 Features)

**Branch:** `fix/send-overlay-completeness`
**Risk:** Medium (overlay engine changes, per-profile testing needed)
**Merge priority:** Within 1 week of PR 2
**Depends on:** PR 1 (IMP-02 must land first for dyscalculia work)

### Improvements Covered

| ID | Title | Fix Type |
|----|-------|----------|
| IMP-10 | Anxiety invitational section titles | Fix section type matching in enforcer |
| IMP-11 | HI inline (= definition) annotations | Add inline annotation pass |
| IMP-12 | ADHD brain-break scaling | Add scaling algorithm |
| IMP-13 | Dyscalculia 5-step recipe on calc Qs | Add recipe injection for non-maths |
| IMP-14 | MLD formula reference on calc Qs | Add formula hint injection |
| IMP-15 | EAL dropdown selection fix | Fix UI dropdown ordering |
| IMP-16 | HI Topic Summary heading | Add explicit heading text |
| IMP-24 | Dyscalculia cue architecture (structural) | Move to sendAnnotations array |
| IMP-26 | Section type detection normalisation | Normalise type matching |

### Files Changed

| File | Changes |
|------|---------|
| `client/src/lib/worksheetPostValidator.ts` | Fix `enforceAnxietySectionTitles` type detection. Add HI inline definition injection. Add "TOPIC SUMMARY" heading to HI block. Add dyscalculia 5-step recipe for science calc Qs. Add MLD formula hint for calc Qs. |
| `client/src/lib/sendEnforcer.ts` | Scale brain-break count based on total questions (2-3 breaks for 15+ Qs). |
| `client/src/lib/worksheet-generator.ts` | Update brain-break placement to support multiple breaks. |
| `client/src/lib/sendPromptFragments.ts` | Add science-specific dyscalculia 5-step prompt. Add MLD formula reference prompt. |
| UI component for SEND dropdown | Fix EAL option ordering/selection. |

### Implementation Details

**IMP-10 (Anxiety titles):**
Debug `enforceAnxietySectionTitles` — the code checks for section type/title matching patterns that don't match actual AI output. Fix: normalise incoming titles to lowercase before pattern matching, and match on broader patterns (e.g., any title containing "recall" or "section 1" or "1").

**IMP-11 (HI inline defs):**
```typescript
function injectHiInlineDefinitions(sections, vocabTerms) {
  const used = new Set();
  return sections.map(s => {
    if (s.teacherOnly || typeof s.content !== "string") return s;
    let content = s.content;
    for (const { word, definition } of vocabTerms) {
      if (used.has(word)) continue;
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
      if (regex.test(content)) {
        content = content.replace(regex, `${word} (= ${definition})`);
        used.add(word); // Only annotate first occurrence across all sections
      }
    }
    return content !== s.content ? { ...s, content } : s;
  });
}
```

**IMP-12 (ADHD scaling):**
```typescript
function calculateBrainBreakPositions(totalQuestions: number): number[] {
  if (totalQuestions < 10) return [Math.floor(totalQuestions / 2)];
  if (totalQuestions < 16) return [
    Math.floor(totalQuestions / 3),
    Math.floor(2 * totalQuestions / 3),
  ];
  return [
    Math.floor(totalQuestions / 4),
    Math.floor(totalQuestions / 2),
    Math.floor(3 * totalQuestions / 4),
  ];
}
```

**IMP-13 (Dyscalculia 5-step):**
Detect calculation questions using command words ("Calculate", "Show your working", "Work out") or formula presence. Inject:
```
Step 1: Write down the formula you need.
Step 2: Identify the values you know from the question.
Step 3: Substitute them into the formula.
Step 4: Calculate the answer.
Step 5: Write your answer with the correct units.
```
Non-calc questions get lighter "vocabulary first" cue instead.

**IMP-14 (MLD formula):**
For MLD calc Qs, inject a formula hint box: "Formula you need: [formula from topic bank or worked example section]". Source formula from the worked example section content.

### Test Criteria
- [ ] Anxiety worksheet: S1 title contains "WARM-UP", Challenge contains "OPTIONAL"
- [ ] HI worksheet: >= 3 inline `(= ...)` annotations in question text
- [ ] ADHD worksheet (15+ Qs): >= 2 brain-break prompts, >= 3 Qs apart
- [ ] Dyscalculia science worksheet: calc Qs have 5-step scaffold, non-calc Qs do not
- [ ] MLD worksheet: calc Qs have formula reference hint
- [ ] EAL worksheet: can be successfully generated (dropdown works)
- [ ] HI worksheet: explicit "TOPIC SUMMARY" heading visible

---

## PR 4: Content Quality & Polish (P4-P5)

**Branch:** `fix/content-quality-polish`
**Risk:** Low (prompt-only changes, no structural changes)
**Merge priority:** After PR 3, no rush

### Improvements Covered

| ID | Title | Fix Type |
|----|-------|----------|
| IMP-07 | S1 structure (3 blocks vs 6-8 Qs) | Decision + possible prompt change |
| IMP-18 | Tip 1 lists specific vocabulary terms | Prompt template change |
| IMP-19 | Add Tip 6 referencing learning objective | Prompt template change |
| IMP-20 | Tips heading standardisation | Prompt template change |
| IMP-21 | Self-reflection RAG verbs variety | Prompt/builder change |
| IMP-22 | Common mistakes topic-matched | Prompt constraint |
| IMP-27 | Anxiety reflection (document as complete) | No code change |
| IMP-28 | Word bank distractor validation | Post-validator check |

### Files Changed

| File | Changes |
|------|---------|
| `client/src/lib/ai.ts` | Update tips template: Tip 1 to interpolate vocab terms; add Tip 6 with LO reference; standardise tips heading. Update S1 prompt if Option B chosen. Add common-mistakes topic constraint. |
| `client/src/lib/selfReflectionBuilder.ts` | Vary RAG verbs by topic/subject (e.g., don't always include "Calculate" for non-maths). |
| `client/src/lib/worksheetPostValidator.ts` | Add Gap Fill word-bank validation (count check). |
| `client/src/lib/revisionTipsBuilder.ts` | Update Tip 1 builder to pull actual vocab terms from worksheet. Add Tip 6 template. |

### Implementation Details

**IMP-18 (Tip 1 specific terms):**
In tips builder, replace generic "Re-read the Key Vocabulary box" with:
```
"Learn these key terms first: {term1}, {term2}, {term3}, {term4}, {term5}. If you cannot define each one in your own words, go back to the Key Vocabulary box."
```
Pull actual terms from the worksheet's vocabulary section content.

**IMP-19 (Tip 6):**
Add to tips template:
```
6. LEARNING OBJECTIVE: By the end of this worksheet you should be able to {LO text}. If you're unsure on any part, revisit the worked example first.
```

**IMP-21 (RAG verbs):**
Instead of fixed [Describe, Explain, Calculate, Compare, Evaluate], map verbs to topic:
- Science: Describe, Explain, Calculate, Compare, Evaluate
- English: Identify, Explain, Analyse, Compare, Evaluate
- History: Describe, Explain, Compare, Evaluate, Justify
- Non-calc topics: Replace "Calculate" with "Apply"

**IMP-22 (Common mistakes):**
Add to prompt: "All 3 common mistakes MUST be about {topic} specifically. Do NOT include mistakes from other subjects or topics."

### Test Criteria
- [ ] Tip 1 names >= 3 specific terms from the topic
- [ ] 6 tips present in tips section (not 5)
- [ ] Tip 6 references the learning objective text
- [ ] Tips heading consistent across worksheets
- [ ] RAG verbs vary by subject
- [ ] All 3 common mistakes reference the specific topic

---

## Summary

| PR | Branch | Improvements | Risk | Effort | Blocks |
|----|--------|-------------|------|--------|--------|
| **PR 1** | `fix/critical-safety-nets` | IMP-01, 02, 03, 06 | Low | 4-5 hrs | Nothing |
| **PR 2** | `fix/structural-enforcement` | IMP-04, 05, 08, 09, 17, 25 | Medium | 6-8 hrs | PR 1 (soft) |
| **PR 3** | `fix/send-overlay-completeness` | IMP-10, 11, 12, 13, 14, 15, 16, 24, 26 | Medium | 8-12 hrs | PR 1 (hard for IMP-13) |
| **PR 4** | `fix/content-quality-polish` | IMP-07, 18, 19, 20, 21, 22, 27, 28 | Low | 4-6 hrs | Nothing |

**Total: 4 PRs, ~22-31 hours of development work**

### Merge Order

```
PR 1 (critical) ──merge──> PR 2 (structural) ──merge──> PR 3 (SEND overlays)
                                                              |
                                                              v
                                                         PR 4 (polish)
                                                     (can merge independently)
```

PR 4 has no hard dependencies and can be developed in parallel with PRs 2-3.

---

## Verification After All PRs Merged

Re-run the full 9-worksheet audit (6 SEND profiles + baseline):

```bash
node audit/generate-batch-v2.mjs
```

Expected outcomes:
- Phase 1 Structure: 38% → **90%+**
- Phase 3 Tips: 60% → **95%+**
- Phase 4 SEND: 53% → **85%+**
- Overall: 65% → **90%+**
- Zero P1 critical bugs
