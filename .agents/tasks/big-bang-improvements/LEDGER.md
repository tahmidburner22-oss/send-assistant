# Big-Bang Improvements — Item Ledger

One row per audit item. The Status column is the canonical truth —
when an item ships, flip its status here in the same commit that ships
the code. The PR column points to the work unit that delivers the item
(see [`PHASE-PLAN.md`](./PHASE-PLAN.md) for what each PR contains).

Last bulk-updated: 2026-05-23 (PR-19..27 combined).

## A. Worksheet content quality (1–38)

| #  | Item                                                                                  | PR     | Status      |
| -- | ------------------------------------------------------------------------------------- | ------ | ----------- |
| 1  | Per-question reading-age enforcement                                                  | PR-2   | shipped — PR #86 |
| 2  | Awarding-body command-word fidelity audit                                             | PR-2   | shipped — PR #86 |
| 3  | Past-paper verbatim / fingerprint detection                                           | PR-15  | shipped — PR #102 (combined PR-10..18) |
| 4  | Distractor pedagogy audit on MCQs                                                     | PR-3   | shipped — PR #87 pending |
| 5  | Synonym / equivalent-answer expansion in mark schemes                                 | PR-13  | shipped — PR #102 (combined PR-10..18) |
| 6  | Method-marks itemisation (M1 / M2 / A1) per multi-mark calc                           | PR-13  | shipped — PR #102 (combined PR-10..18) |
| 7  | Numerical answer plausibility / order-of-magnitude rail                               | PR-13  | shipped — PR #102 (combined PR-10..18) |
| 8  | Question-difficulty Bloom-monotonicity check                                          | PR-14  | shipped — PR #102 (combined PR-10..18) |
| 9  | Sciences "Working:" stub on calc questions                                            | PR-14  | shipped — PR #102 (combined PR-10..18) |
| 10 | Vocabulary tier audit (Tier 3 words declared in Word Bank)                            | PR-3   | shipped — PR #87 pending |
| 11 | Cross-curricular UK context whitelist                                                 | PR-2   | shipped — PR #86 |
| 12 | Cultural-context bias audit (PD9)                                                     | PR-12  | shipped — PR #102 (combined PR-10..18) |
| 13 | Mathematical notation hygiene (× vs x, − vs -, ° vs o)                                | PR-3   | shipped — PR #87 pending |
| 14 | SI unit normalisation (mph → km/h, lbs → kg, °F → °C, in/ft → cm/m)                   | PR-2   | shipped — PR #86 |
| 15 | Diagram-question coupling check                                                       | PR-3   | shipped — PR #87 pending |
| 16 | Common Mistakes for non-maths                                                         | PR-13  | shipped — PR pending (combined PR-19..27) |
| 17 | Misconception bank backing (formal registry)                                          | PR-13  | shipped — PR pending (combined PR-19..27) |
| 18 | Self-Reflection: command-word echo guarantee                                          | PR-2   | shipped — PR #86 |
| 19 | Revision-Tips: time-budget reconcile with estimatedTime                               | PR-13  | shipped — PR pending (combined PR-19..27) |
| 20 | Knowledge organiser auto-extract per topic (PD10)                                     | PR-10  | shipped — PR #102 (combined PR-10..18) |
| 21 | Anchor-poster + Now/Next/Then card outputs (PD11)                                     | PR-10  | shipped — PR #102 (combined PR-10..18) |
| 22 | Diagram coverage gap teacher-facing badge (UI side)                                   | PR-6   | shipped — PR pending (combined PR-19..27) |
| 23 | Alt-text quality probe (not just presence)                                            | PR-18  | shipped — PR #102 (combined PR-10..18) |
| 24 | Tactile-graphics export for VI pupils                                                 | PR-18  | shipped — PR #102 (combined PR-10..18) |
| 25 | Continuous accessibility audit (Lighthouse + axe-core in CI)                          | PR-18  | shipped — PR #102 (combined PR-10..18) |
| 26 | Plain-English / Crystal Mark check on every section                                   | PR-18  | shipped — PR #102 (combined PR-10..18) |
| 27 | Dyslexia-friendly typography pre-flight                                               | PR-18  | shipped — PR #102 (combined PR-10..18) |
| 28 | Phase 4 follow-up: SEND fidelity probes for the 12 missing profiles                   | PR-1   | shipped — PR #85 |
| 29 | Per-pupil profile linkage (Pupil Passport → worksheet)                                | PR-16  | shipped — PR #102 (combined PR-10..18) |
| 30 | Reading-age memory per pupil                                                          | PR-16  | shipped — PR #102 (combined PR-10..18) |
| 31 | Class Pack visual diff                                                                | PR-6   | shipped — PR pending (combined PR-19..27) |
| 32 | Trauma-informed register profile                                                      | PR-16  | shipped — PR #102 (combined PR-10..18) |
| 33 | Bilingual MFL revision shell                                                          | PR-25  | shipped — PR pending (combined PR-19..27) |
| 34 | Per-pupil progression check (longitudinal Bloom ramp)                                 | PR-19  | shipped — PR pending (combined PR-19..27) |
| 35 | Spec-point completeness over a Scheme of Work                                         | PR-19  | shipped — PR pending (combined PR-19..27) |
| 36 | Cross-paper synoptic generation for KS5                                               | PR-25  | shipped — PR pending (combined PR-19..27) |
| 37 | Required Practical (RP) coverage tracker over a SoW                                   | PR-19  | shipped — PR pending (combined PR-19..27) |
| 38 | Past-paper question-frequency anchor                                                  | PR-19  | shipped — PR pending (combined PR-19..27) |

## B. Generator architecture (39–78)

| #  | Item                                                                                  | PR     | Status      |
| -- | ------------------------------------------------------------------------------------- | ------ | ----------- |
| 39 | Server-side prompt unification (port manifesto into server/routes/ai.ts)              | PR-7   | shipped — PR #91 pending |
| 40 | Prompt versioning + diff store                                                        | PR-11  | shipped — PR #102 (combined PR-10..18) |
| 41 | Structured-output retry with diagnostic-only re-prompt                                | PR-9   | shipped — PR #94 |
| 42 | Token budget transparency (PD13)                                                      | PR-9   | shipped — PR #94 |
| 43 | Generation cache by hash key (PD13)                                                   | PR-9   | shipped — PR #94 |
| 44 | Eval harness FEAT-PR5 (200 canonical UK NC + GCSE prompts)                            | PR-5   | shipped — PR #89 |
| 45 | A/B prompt experiment framework                                                       | PR-20  | shipped — PR pending (combined PR-19..27) |
| 46 | Per-subject prompt families refactor                                                  | PR-20  | shipped — PR pending (combined PR-19..27) |
| 47 | Self-consistency sampling on extended-answer questions                                | PR-20  | shipped — PR pending (combined PR-19..27) |
| 48 | Citation-grounded factual layer (history dates, science values, English Lit quotes)   | PR-20  | shipped — PR pending (combined PR-19..27) |
| 49 | Promote postValidatorWarnings to tiered SLA P0 / P1 / P2                              | PR-22  | shipped — PR pending (combined PR-19..27) |
| 50 | Quality scorecard implementation (WorksheetQAScore actually computed)                 | PR-4   | shipped — PR #88 |
| 51 | Generator-version baseline + regression detector                                      | PR-22  | shipped — PR pending (combined PR-19..27) |
| 52 | Idempotency proof in tests (every validator runs twice, deep-equal output)            | PR-21  | shipped — PR pending (combined PR-19..27) |
| 53 | Schema deprecation policy                                                             | PR-22  | shipped — PR pending (combined PR-19..27) |
| 54 | Diagram lookup miss → admin-gated AI-generated SVG fallback                           | PR-23  | shipped — PR pending (combined PR-19..27) |
| 55 | Diagram requestability ranking                                                        | PR-23  | shipped — PR pending (combined PR-19..27) |
| 56 | Diagram complexity / page-fit budget                                                  | PR-23  | shipped — PR pending (combined PR-19..27) |
| 57 | Vector-only diagrams for printing                                                     | PR-23  | shipped — PR pending (combined PR-19..27) |
| 58 | DOCX / PDF feature parity audit                                                       | PR-24  | shipped — PR pending (combined PR-19..27) |
| 59 | Print-bleed and stapling-edge guarantee                                               | PR-24  | shipped — PR pending (combined PR-19..27) |
| 60 | A3 / A5 / leaflet booklet presets                                                     | PR-24  | shipped — PR pending (combined PR-19..27) |
| 61 | One-tap LMS push (PC1 — Google Classroom + Teams + Satchel One)                       | PR-28  | deferred    |
| 62 | MIS roster import (PC2 — Wonde + GroupCall)                                           | PR-28  | deferred    |
| 63 | Email-to-generate (PD1)                                                               | PR-28  | deferred    |
| 64 | iOS / Android share-sheet (PD2) + 2-tap mobile generate from staffroom (PD3)          | PR-28  | deferred    |
| 65 | Browser extension (PD6)                                                               | PR-28  | deferred    |
| 66 | Worksheet-level versioning + diff history (PD7)                                       | PR-11  | shipped — PR #102 (combined PR-10..18) |
| 67 | Department library + HOD moderation (PD12)                                            | PR-17  | shipped — PR #102 (combined PR-10..18) |
| 68 | Streak / weekly summary email (PD5)                                                   | PR-28  | deferred    |
| 69 | Monday-morning email (PD4)                                                            | PR-28  | deferred    |
| 70 | Telemetry: which validator fires most often                                           | PR-27  | shipped — PR pending (combined PR-19..27) |
| 71 | Per-topic regeneration heat-map                                                       | PR-27  | shipped — PR pending (combined PR-19..27) |
| 72 | Ban whole-file reads of ai.ts / Worksheets.tsx / WorksheetRenderer.tsx in CI tooling  | PR-21  | shipped — PR pending (combined PR-19..27) |
| 73 | ai.ts second carve-up by prompt section                                               | PR-21  | shipped — PR pending (combined PR-19..27) |
| 74 | Data-driven post-validator chain                                                      | PR-8   | shipped — PR #92 |
| 75 | Property-based tests on builders                                                      | PR-21  | shipped — PR pending (combined PR-19..27) |
| 76 | Logging redaction for pupil names + IEP content                                       | PR-9   | shipped — PR #94 (partial) |
| 77 | Snapshot tests by (subject × year × send-need × ability tier) matrix                  | PR-21  | shipped — PR pending (combined PR-19..27) |
| 78 | Crash-free render rate metric                                                         | PR-22  | shipped — PR pending (combined PR-19..27) |

## C. Cross-cutting / strategic (79–85)

| #  | Item                                                                                  | PR     | Status      |
| -- | ------------------------------------------------------------------------------------- | ------ | ----------- |
| 79 | "Why this worksheet looks like this" teacher-facing audit panel                       | PR-6   | shipped — PR #90 pending |
| 80 | "Edit my worksheet" surface that learns                                               | PR-25  | shipped — PR pending (combined PR-19..27) |
| 81 | Pupil-facing companion app (consumes companionShare / hint ladders)                   | PR-26  | shipped — PR pending (combined PR-19..27) |
| 82 | Stack multiple SEND profiles per worksheet (sendNeed → sendNeeds[])                   | PR-16  | shipped — PR #102 (combined PR-10..18) |
| 83 | Subject-vocabulary library audit                                                      | PR-19  | shipped — PR pending (combined PR-19..27) |
| 84 | Spec-point taxonomy completeness audit                                                | PR-19  | shipped — PR pending (combined PR-19..27) |
| 85 | Document the public LLM-output contract                                               | PR-22  | shipped — PR pending (combined PR-19..27) |

## Status legend

- `not started` — work has not begun.
- `in-flight` — a PR is open or a branch is in active development.
- `shipped — PR #NN` — merged into main, with the PR number.
- `shipped — PR pending (combined PR-NN..MM)` — code shipped on a
  branch awaiting review, batched with sibling PRs.
- `deferred` — explicitly out of scope until external prerequisites
  (credentials, third-party APIs, separate distribution) land.
- `dropped` — withdrawn after re-evaluation; row stays for traceability
  with a one-line note in the rightmost column.
