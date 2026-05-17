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
| Shipped        | 4     |
| Specced (ready for fresh-chat execution) | 24 |
| Total improvements | 20 |

The "Specced" count is higher than the improvement count because larger
improvements (#7 LMS/MIS/LTI; #10 accessibility; #12 habit hooks) are
intentionally split across multiple PR-sized specs.

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
| 2 | Pupil-aware auto-generation                | A · PR-1 + PR-2 | [`phase-a-class-aware/features/FEAT-PR1.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR1.json) + [`FEAT-PR2.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR2.json) | **Shipped — PR #46 + #47** |
| 3 | Curriculum coverage map ("Ofsted view")    | C · PC4 | [`phase-c-fit-your-school/features/FEAT-PC4.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC4.json) | Specced     |
| 4 | Misconception-driven re-teach loop         | B · PB3 | [`phase-b-close-the-loop/features/FEAT-PB3.json`](../.agents/tasks/phase-b-close-the-loop/features/FEAT-PB3.json) | Specced     |
| 5 | Spec-point provenance + AO tag             | B · PB1 | [`phase-b-close-the-loop/features/FEAT-PB1.json`](../.agents/tasks/phase-b-close-the-loop/features/FEAT-PB1.json) | Specced     |
| 6 | Bulk scheme-of-work generation             | C · PC5 | [`phase-c-fit-your-school/features/FEAT-PC5.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC5.json) | Specced     |
| 7a | LMS push: Google Classroom + Teams + Satchel | C · PC1 | [`phase-c-fit-your-school/features/FEAT-PC1.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC1.json) | Specced     |
| 7b | MIS roster: Wonde + GroupCall             | C · PC2 | [`phase-c-fit-your-school/features/FEAT-PC2.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC2.json) | Specced     |
| 7c | LTI 1.3 + QTI 3.0 + Common Cartridge      | C · PC3 | [`phase-c-fit-your-school/features/FEAT-PC3.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC3.json) | Specced     |
| 8 | Differentiation that prints on one stack — Class Pack as default | A · PR-3 | [`phase-a-class-aware/features/FEAT-PR3.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR3.json) | Specced     |
| 9 | EAL parity (bilingual side-by-side + reading-age memory) | C · PC6 | [`phase-c-fit-your-school/features/FEAT-PC6.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC6.json) | Specced     |
| 10 | Accessibility certification (WCAG 2.2 AA + Braille + Large print + Plain English) | C · PC7 | [`phase-c-fit-your-school/features/FEAT-PC7.json`](../.agents/tasks/phase-c-fit-your-school/features/FEAT-PC7.json) | Specced     |
| 11 | "The marking ends here" — bulk ScanMark + per-pupil feedback + MIS export | B · PB4 | [`phase-b-close-the-loop/features/FEAT-PB4.json`](../.agents/tasks/phase-b-close-the-loop/features/FEAT-PB4.json) | Specced     |
| 12a | Email-to-generate (worksheets@…)         | D · PD1 | [`phase-d-quality-and-habit/features/FEAT-PD1.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD1.json) | Specced     |
| 12b | iOS / Android share-sheet                | D · PD2 | [`phase-d-quality-and-habit/features/FEAT-PD2.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD2.json) | Specced     |
| 12c | 2-tap mobile generate from staffroom     | D · PD3 | [`phase-d-quality-and-habit/features/FEAT-PD3.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD3.json) | Specced     |
| 12d | Monday-morning email                     | D · PD4 | [`phase-d-quality-and-habit/features/FEAT-PD4.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD4.json) | Specced     |
| 12e | Streak / weekly summary                  | D · PD5 | [`phase-d-quality-and-habit/features/FEAT-PD5.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD5.json) | Specced     |
| 12f | Browser extension                        | D · PD6 | [`phase-d-quality-and-habit/features/FEAT-PD6.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD6.json) | Specced     |

---

## C. The 8 smaller-but-cumulative quality bets

| # | Quality bet                                | Phase | Spec file                                                                          | Status      |
| - | ------------------------------------------ | ----- | ---------------------------------------------------------------------------------- | ----------- |
| 13 | Versioning + diff                          | D · PD7 | [`phase-d-quality-and-habit/features/FEAT-PD7.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD7.json) | Specced     |
| 14 | Symbolic maths verification (CAS round-trip) | B · PB2 | [`phase-b-close-the-loop/features/FEAT-PB2.json`](../.agents/tasks/phase-b-close-the-loop/features/FEAT-PB2.json) | Specced     |
| 15 | Bias & sensitivity audit on examples       | D · PD9 | [`phase-d-quality-and-habit/features/FEAT-PD9.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD9.json) | Specced     |
| 16 | Knowledge organiser per topic              | D · PD10 | [`phase-d-quality-and-habit/features/FEAT-PD10.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD10.json) | Specced     |
| 17 | Anchor-poster & Now/Next/Then card outputs | D · PD11 | [`phase-d-quality-and-habit/features/FEAT-PD11.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD11.json) | Specced     |
| 18 | Department library with HOD moderation     | D · PD12 | [`phase-d-quality-and-habit/features/FEAT-PD12.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD12.json) | Specced     |
| 19 | Generation cost transparency + caching     | D · PD13 | [`phase-d-quality-and-habit/features/FEAT-PD13.json`](../.agents/tasks/phase-d-quality-and-habit/features/FEAT-PD13.json) | Specced     |
| 20 | Eval harness (200 canonical UK NC + GCSE prompts) | A · PR-5 | [`phase-a-class-aware/features/FEAT-PR5.json`](../.agents/tasks/phase-a-class-aware/features/FEAT-PR5.json) | Specced     |

---

## D. Phase index

| Phase | Theme                                             | PRs (shipped / total) | Folder                                                                                              |
| ----- | ------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| A     | "We know your class"                              | 4 / 6                 | [`.agents/tasks/phase-a-class-aware/`](../.agents/tasks/phase-a-class-aware/)                       |
| B     | "We close the loop"                               | 0 / 4                 | [`.agents/tasks/phase-b-close-the-loop/`](../.agents/tasks/phase-b-close-the-loop/)                 |
| C     | "We fit your school"                              | 0 / 7                 | [`.agents/tasks/phase-c-fit-your-school/`](../.agents/tasks/phase-c-fit-your-school/)               |
| D     | Quality bets + habit hooks                        | 0 / 12                | [`.agents/tasks/phase-d-quality-and-habit/`](../.agents/tasks/phase-d-quality-and-habit/)           |

---

## E. Sequencing recommendation

The user's original ordering is preserved. Each phase has its own
`PHASE-PLAN.md` with a concrete recommended order — most importantly:

- **Phase A** finishes with PR-3 (Class Pack default) and PR-5 (eval
  harness) — the two specs already on disk.
- **Phase B** starts with PB1 (provenance) — every later PR consumes
  spec-point + AO metadata.
- **Phase C** starts with PC4 (coverage map) and PC5 (bulk SoW) — those
  are product wins that don't require integrations.
- **Phase D** starts with PD13 (cost transparency) — earns trust before
  any other ship.

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
