# Daily-essential Adaptly — Improvements traceability map

This document is the audit trail for the user's list of 20 improvements
(12 high-leverage + 8 smaller quality bets). Every improvement is mapped
to its **phase**, **PR spec file**, **status**, and the **PR number** if
it has shipped. Keep this in lock-step with `.agents/tasks/phase-*/`
spec folders — if a spec is added, edited, or deleted, edit this file
in the same commit.

> **Why this exists:** the user's directive was *"every single improvement
> done properly… all phases and every change."* Maintaining a single
> mapping file makes that promise auditable.

## Summary

| Status         | Count |
| -------------- | ----- |
| Shipped        | 25    |
| Re-applied (PR-2 recovery) | 1 |
| Deferred (external integration prerequisites) | 8 |
| Specced (ready for fresh-chat execution) | 1 |
| Total improvements | 21 |

The "Shipped" + "Deferred" + "Specced" counts exceed the improvement
count because several improvements (#7 LMS/MIS/LTI; #10 accessibility;
#12 habit hooks) are intentionally split across multiple PR-sized
specs. **As of 2026-05-25**, the only remaining specced-but-unshipped
work is improvement #19's bursar-facing UI surface (the PD13 server
scaffolding shipped via PR #94; the cost-chip / admin-spend-panel /
docs follow-up is the next up).

> **Note (May 2026):** PR #47 (Phase A · PR-2 — Auto-from-class
> segmented control) was originally merged into the side branch
> `feat/pr1-class-auto-brief` instead of `main`. PR #46 then fast-
> forwarded that branch (without #47's commit, which was authored
> 12 seconds later) into `main`, so PR-2's `AutoFromClassPanel.tsx`,
> segmented control, and `worksheetGenerationMode` preference never
> reached `main`. The recovery PR re-applies commit `ecb88a83` byte-
> identically on top of current `main`. Improvement #2 below now
> points at the recovery PR.

---

## A. The three behavioural shifts

The user's framing — what every PR is in service of:

| Today                                | Daily-essential                                       |
| ------------------------------------ | ----------------------------------------------------- |
| Teacher tells the tool what to make  | Tool tells the teacher "tomorrow's lesson, ready"     |
| Each worksheet is a one-off artefact | Each worksheet is a node in a pupil's progression     |
| The worksheet ends at the printer    | One bundle: IWB starter + marking scan + parent share + re-teach |

Every spec ties back to one of these three shifts.

---

## B. The 12 high-leverage improvements

| # | Improvement                                | Phase | Spec file                                                                          | Status      |
| - | ------------------------------------------ | ----- | ---------------------------------------------------------------------------------- | ----------- |
| 1 | "Tomorrow's lesson is already done" — proactive home screen | A · PR-4 | [`phase-a-class-aware/features/FEAT-PR4.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR4.json) | **Shipped — PR #48** |
| 2 | Pupil-aware auto-generation                | A · PR-1 + PR-2 | [`phase-a-class-aware/features/FEAT-PR1.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR1.json) + [`FEAT-PR2.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR2.json) | **Shipped — PR #46 + #47 (re-applied PR #50)** |
| 3 | Curriculum coverage map ("Ofsted view")    | C · PC4 | [`phase-c-fit-your-school/features/FEAT-PC4.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC4.json) | **Shipped — PR #56 + #57** |
| 4 | Misconception-driven re-teach loop         | B · PB3 | [`phase-b-close-the-loop/features/FEAT-PB3.json`](../.agents/tasks/phase-b-close-the-loop/features/FEAT-PB3.json) | **Shipped** |
| 5 | Spec-point provenance + AO tag             | B · PB1 | [`phase-b-close-the-loop/features/FEAT-PB1.json`](../.agents/tasks/phase-b-close-the-loop/features/FEAT-PB1.json) | **Shipped** |
| 6 | Bulk scheme-of-work generation             | C · PC5 | [`phase-c-fit-your-school/features/FEAT-PC5.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC5.json) | **Shipped — PR #58 (zip) + PR #59 (CC)** |
| 7a | LMS push: Google Classroom + Teams + Satchel | C · PC1 | [`phase-c-fit-your-school/features/FEAT-PC1.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC1.json) | **Deferred** (external creds + 3rd-party APIs) |
| 7b | MIS roster: Wonde + GroupCall             | C · PC2 | [`phase-c-fit-your-school/features/FEAT-PC2.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC2.json) | **Deferred** (external creds + 3rd-party APIs) |
| 7c | LTI 1.3 + QTI 3.0 + Common Cartridge      | C · PC3 | [`phase-c-fit-your-school/features/FEAT-PC3.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC3.json) | **Shipped — PR #59** |
| 8 | Differentiation that prints on one stack — Class Pack as default | A · PR-3 | [`phase-a-class-aware/features/FEAT-PR3.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR3.json) | **Shipped** |
| 9 | EAL parity (bilingual side-by-side + reading-age memory) | C · PC6 | [`phase-c-fit-your-school/features/FEAT-PC6.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC6.json) | **Shipped — PR #60** |
| 10 | Accessibility certification (WCAG 2.2 AA + Braille + Large print + Plain English) | C · PC7 | [`phase-c-fit-your-school/features/FEAT-PC7.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC7.json) | **Shipped — PR #60** |
| 11 | "The marking ends here" — bulk ScanMark + per-pupil feedback + MIS export | B · PB4 | [`phase-b-close-the-loop/features/FEAT-PB4.json`](../.agents/tasks/phase-b-close-the-loop/features/FEAT-PB4.json) | **Shipped — PR #55** |
| 12a | Email-to-generate (worksheets@…)         | D · PD1 | [`phase-d-quality-and-habit/features/FEAT-PD1.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD1.json) | **Deferred** (transactional email infra) |
| 12b | iOS / Android share-sheet                | D · PD2 | [`phase-d-quality-and-habit/features/FEAT-PD2.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD2.json) | **Deferred** (separate mobile distribution) |
| 12c | 2-tap mobile generate from staffroom     | D · PD3 | [`phase-d-quality-and-habit/features/FEAT-PD3.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD3.json) | **Deferred** (separate mobile distribution) |
| 12d | Monday-morning email                     | D · PD4 | [`phase-d-quality-and-habit/features/FEAT-PD4.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD4.json) | **Deferred** (transactional email infra) |
| 12e | Streak / weekly summary                  | D · PD5 | [`phase-d-quality-and-habit/features/FEAT-PD5.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD5.json) | **Deferred** (transactional email infra) |
| 12f | Browser extension                        | D · PD6 | [`phase-d-quality-and-habit/features/FEAT-PD6.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD6.json) | **Deferred** (separate browser-extension distribution) |

---

## C. The 8 smaller-but-cumulative quality bets

| # | Quality bet                                | Phase | Spec file                                                                          | Status      |
| - | ------------------------------------------ | ----- | ---------------------------------------------------------------------------------- | ----------- |
| 13 | Versioning + diff                          | D · PD7 | [`phase-d-quality-and-habit/features/FEAT-PD7.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD7.json) | **Shipped — PR #102** (combined PR-10..18, audit item #66) |
| 14 | Symbolic maths verification (CAS round-trip) | B · PB2 | [`phase-b-close-the-loop/features/FEAT-PB2.json`](../.agents/tasks/phase-b-close-the-loop/features/FEAT-PB2.json) | **Shipped** |
| 15 | Bias & sensitivity audit on examples       | D · PD9 | [`phase-d-quality-and-habit/features/FEAT-PD9.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD9.json) | **Shipped — PR #102** (combined PR-10..18, audit item #12) |
| 16 | Knowledge organiser per topic              | D · PD10 | [`phase-d-quality-and-habit/features/FEAT-PD10.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD10.json) | **Shipped — PR #102** (combined PR-10..18, audit item #20) |
| 17 | Anchor-poster & Now/Next/Then card outputs | D · PD11 | [`phase-d-quality-and-habit/features/FEAT-PD11.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD11.json) | **Shipped — PR #102** (combined PR-10..18, audit item #21) |
| 18 | Department library with HOD moderation     | D · PD12 | [`phase-d-quality-and-habit/features/FEAT-PD12.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD12.json) | **Shipped — PR #102** (combined PR-10..18, audit item #67) |
| 19 | Generation cost transparency + caching     | D · PD13 | [`phase-d-quality-and-habit/features/FEAT-PD13.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD13.json) | **Shipped (server) — PR #94** (audit items #41/#42/#43/#76); UI surface in flight |
| 20 | Eval harness (200 canonical UK NC + GCSE prompts) | A · PR-5 | [`phase-a-class-aware/features/FEAT-PR5.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR5.json) | **Shipped — PR #89** (audit item #44) |
| 21 | Curriculum bank — tier-aware differentiator + topic-aware scaffolder + spec-point expansion (3 → 16 datasets) + paraphrased exemplar bank | F · PF1 | [`phase-f-curriculum-bank/features/FEAT-PF1.json`](../.agents/tasks/phase-f-curriculum-bank/features/FEAT-PF1.json) | **Shipped — PR #110** (Phase F) |

---

## D. Phase index

| Phase | Theme                                             | PRs (shipped / total) | Folder                                                                                              |
| ----- | ------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| A     | "We know your class"                              | 6 / 6 (PR-5 shipped via PR #89) | [`.agents/tasks/phase-a-class-aware/`](../.agents/tasks/phase-a-class-aware/)             |
| B     | "We close the loop"                               | 4 / 4                 | [`.agents/tasks/phase-b-close-the-loop/`](../.agents/tasks/phase-b-close-the-loop/)                 |
| C     | "We fit your school"                              | 5 shipped / 2 deferred (PC1, PC2) | [`.agents/tasks/phase-c-fit-your-school/`](../.agents/tasks/phase-c-fit-your-school/)   |
| D     | Quality bets + habit hooks                        | 6 shipped / 6 deferred / 1 server-only (PD13 UI follow-up) | [`.agents/tasks/phase-d-quality-and-habit/`](../.agents/tasks/phase-d-quality-and-habit/)           |
| E     | Exam paper builder + bank subtopic coverage       | 1 / 1 (Phase E content reached `main` via Phase F PR #110; original branch obsolete) | [`.agents/tasks/phase-e-exam-paper-builder/`](../.agents/tasks/phase-e-exam-paper-builder/) |
| F     | Curriculum bank — tier-aware diff + topic scaffolder | 1 / 1              | [`.agents/tasks/phase-f-curriculum-bank/`](../.agents/tasks/phase-f-curriculum-bank/)               |

---

## E. Sequencing recommendation

The user's original ordering is preserved. Each phase has its own
`PHASE-PLAN.md` with a concrete recommended order. Most phases are now
shipped (see Section D). The only remaining specced work is:

- **Improvement #19 — PD13 UI surface.** The server-side scaffolding
  (`aiCostEstimate.ts`, `aiCacheKey.ts`, `generationCache.ts`,
  `WorksheetOutputSchema.metadata` cost fields, `/generate` cache hook)
  shipped via PR #94. The bursar-facing UI — cost chip in
  `WorksheetRenderer`, breakdown modal, settings toggle, and admin
  panel monthly aggregate — is the natural next ship.

Deferred items (Section B/C) are blocked on external prerequisites:

- **PC1 (LMS push):** Google Classroom + Teams + Satchel One creds and
  per-tenant OAuth flows.
- **PC2 (MIS roster):** Wonde + GroupCall API keys and signed school
  agreements.
- **PD1, PD4, PD5 (email surfaces):** transactional email sender SLA
  uplift and per-tenant from-address config.
- **PD2, PD3 (mobile):** separate mobile distribution pipeline.
- **PD6 (browser extension):** separate extension distribution
  pipeline (Chrome Web Store, Firefox AMO, Edge Add-ons).

---

## F. How to keep this file honest

- When a spec changes status (specced → in-flight → shipped), edit the
  Status column in the same PR that changes the spec.
- When a new improvement is introduced (e.g. a new MAT-tier feature
  request), append a row and create a sized spec under the matching
  phase folder.
- When a spec is consolidated or split, update the `#` reference so the
  user's original numbering still resolves to a real file.

If a row in this table ever points to a spec that doesn't exist, treat
it as a P0 documentation bug.
