# Big-Bang Improvements — Item Ledger

One row per audit item. The Status column is the canonical truth —
when an item ships, flip its status here in the same commit that ships
the code. The PR column points to the work unit that delivers the item
(see [`PHASE-PLAN.md`](./PHASE-PLAN.md) for what each PR contains).

Last bulk-updated: 2026-05-22 (initial seed).

## A. Worksheet content quality (1–38)

| #  | Item                                                                                  | PR     | Status      |
| -- | ------------------------------------------------------------------------------------- | ------ | ----------- |
| 1  | Per-question reading-age enforcement                                                  | PR-2   | shipped — PR #86 |
| 2  | Awarding-body command-word fidelity audit                                             | PR-2   | shipped — PR #86 |
| 3  | Past-paper verbatim / fingerprint detection                                           | PR-15  | not started |
| 4  | Distractor pedagogy audit on MCQs                                                     | PR-3   | shipped — PR #87 pending |
| 5  | Synonym / equivalent-answer expansion in mark schemes                                 | PR-13  | not started |
| 6  | Method-marks itemisation (M1 / M2 / A1) per multi-mark calc                           | PR-13  | not started |
| 7  | Numerical answer plausibility / order-of-magnitude rail                               | PR-13  | not started |
| 8  | Question-difficulty Bloom-monotonicity check                                          | PR-14  | not started |
| 9  | Sciences "Working:" stub on calc questions                                            | PR-14  | not started |
| 10 | Vocabulary tier audit (Tier 3 words declared in Word Bank)                            | PR-3   | shipped — PR #87 pending |
| 11 | Cross-curricular UK context whitelist                                                 | PR-2   | shipped — PR #86 |
| 12 | Cultural-context bias audit (PD9)                                                     | PR-12  | not started |
| 13 | Mathematical notation hygiene (× vs x, − vs -, ° vs o)                                | PR-3   | shipped — PR #87 pending |
| 14 | SI unit normalisation (mph → km/h, lbs → kg, °F → °C, in/ft → cm/m)                   | PR-2   | shipped — PR #86 |
| 15 | Diagram-question coupling check                                                       | PR-3   | shipped — PR #87 pending |
| 16 | Common Mistakes for non-maths                                                         | PR-13  | not started |
| 17 | Misconception bank backing (formal registry)                                          | PR-13  | not started |
| 18 | Self-Reflection: command-word echo guarantee                                          | PR-2   | shipped — PR #86 |
| 19 | Revision-Tips: time-budget reconcile with estimatedTime                               | PR-13  | not started |
| 20 | Knowledge organiser auto-extract per topic (PD10)                                     | PR-10  | not started |
| 21 | Anchor-poster + Now/Next/Then card outputs (PD11)                                     | PR-10  | not started |
| 22 | Diagram coverage gap teacher-facing badge (UI side)                                   | PR-6   | not started |
| 23 | Alt-text quality probe (not just presence)                                            | PR-18  | not started |
| 24 | Tactile-graphics export for VI pupils                                                 | PR-18  | not started |
| 25 | Continuous accessibility audit (Lighthouse + axe-core in CI)                          | PR-18  | not started |
| 26 | Plain-English / Crystal Mark check on every section                                   | PR-18  | not started |
| 27 | Dyslexia-friendly typography pre-flight                                               | PR-18  | not started |
| 28 | Phase 4 follow-up: SEND fidelity probes for the 12 missing profiles                   | PR-1   | shipped — PR #85 |
| 29 | Per-pupil profile linkage (Pupil Passport → worksheet)                                | PR-16  | shipped — PR-16 |
| 30 | Reading-age memory per pupil                                                          | PR-16  | shipped — PR-16 |
| 31 | Class Pack visual diff                                                                | PR-6   | not started |
| 32 | Trauma-informed register profile                                                      | PR-16  | shipped — PR-16 |
| 33 | Bilingual MFL revision shell                                                          | PR-25  | not started |
| 34 | Per-pupil progression check (longitudinal Bloom ramp)                                 | PR-19  | not started |
| 35 | Spec-point completeness over a Scheme of Work                                         | PR-19  | not started |
| 36 | Cross-paper synoptic generation for KS5                                               | PR-25  | not started |
| 37 | Required Practical (RP) coverage tracker over a SoW                                   | PR-19  | not started |
| 38 | Past-paper question-frequency anchor                                                  | PR-19  | not started |

## B. Generator architecture (39–78)

| #  | Item                                                                                  | PR     | Status      |
| -- | ------------------------------------------------------------------------------------- | ------ | ----------- |
| 39 | Server-side prompt unification (port manifesto into server/routes/ai.ts)              | PR-7   | not started |
| 40 | Prompt versioning + diff store                                                        | PR-11  | not started |
| 41 | Structured-output retry with diagnostic-only re-prompt                                | PR-9   | not started |
| 42 | Token budget transparency (PD13)                                                      | PR-9   | not started |
| 43 | Generation cache by hash key (PD13)                                                   | PR-9   | not started |
| 44 | Eval harness FEAT-PR5 (200 canonical UK NC + GCSE prompts)                            | PR-5   | shipped — PR #89 |
| 45 | A/B prompt experiment framework                                                       | PR-20  | not started |
| 46 | Per-subject prompt families refactor                                                  | PR-20  | not started |
| 47 | Self-consistency sampling on extended-answer questions                                | PR-20  | not started |
| 48 | Citation-grounded factual layer (history dates, science values, English Lit quotes)   | PR-20  | not started |
| 49 | Promote postValidatorWarnings to tiered SLA P0 / P1 / P2                              | PR-22  | not started |
| 50 | Quality scorecard implementation (WorksheetQAScore actually computed)                 | PR-4   | shipped — PR #88 |
| 51 | Generator-version baseline + regression detector                                      | PR-22  | not started |
| 52 | Idempotency proof in tests (every validator runs twice, deep-equal output)            | PR-21  | not started |
| 53 | Schema deprecation policy                                                             | PR-22  | not started |
| 54 | Diagram lookup miss → admin-gated AI-generated SVG fallback                           | PR-23  | not started |
| 55 | Diagram requestability ranking                                                        | PR-23  | not started |
| 56 | Diagram complexity / page-fit budget                                                  | PR-23  | not started |
| 57 | Vector-only diagrams for printing                                                     | PR-23  | not started |
| 58 | DOCX / PDF feature parity audit                                                       | PR-24  | not started |
| 59 | Print-bleed and stapling-edge guarantee                                               | PR-24  | not started |
| 60 | A3 / A5 / leaflet booklet presets                                                     | PR-24  | not started |
| 61 | One-tap LMS push (PC1 — Google Classroom + Teams + Satchel One)                       | PR-28  | deferred    |
| 62 | MIS roster import (PC2 — Wonde + GroupCall)                                           | PR-28  | deferred    |
| 63 | Email-to-generate (PD1)                                                               | PR-28  | deferred    |
| 64 | iOS / Android share-sheet (PD2) + 2-tap mobile generate from staffroom (PD3)          | PR-28  | deferred    |
| 65 | Browser extension (PD6)                                                               | PR-28  | deferred    |
| 66 | Worksheet-level versioning + diff history (PD7)                                       | PR-11  | not started |
| 67 | Department library + HOD moderation (PD12)                                            | PR-17  | not started |
| 68 | Streak / weekly summary email (PD5)                                                   | PR-28  | deferred    |
| 69 | Monday-morning email (PD4)                                                            | PR-28  | deferred    |
| 70 | Telemetry: which validator fires most often                                           | PR-27  | not started |
| 71 | Per-topic regeneration heat-map                                                       | PR-27  | not started |
| 72 | Ban whole-file reads of ai.ts / Worksheets.tsx / WorksheetRenderer.tsx in CI tooling  | PR-21  | not started |
| 73 | ai.ts second carve-up by prompt section                                               | PR-21  | not started |
| 74 | Data-driven post-validator chain                                                      | PR-8   | shipped — PR pending |
| 75 | Property-based tests on builders                                                      | PR-21  | not started |
| 76 | Logging redaction for pupil names + IEP content                                       | PR-9   | not started |
| 77 | Snapshot tests by (subject × year × send-need × ability tier) matrix                  | PR-21  | not started |
| 78 | Crash-free render rate metric                                                         | PR-22  | not started |

## C. Cross-cutting / strategic (79–85)

| #  | Item                                                                                  | PR     | Status      |
| -- | ------------------------------------------------------------------------------------- | ------ | ----------- |
| 79 | "Why this worksheet looks like this" teacher-facing audit panel                       | PR-6   | shipped — PR #90 pending |
| 80 | "Edit my worksheet" surface that learns                                               | PR-25  | not started |
| 81 | Pupil-facing companion app (consumes companionShare / hint ladders)                   | PR-26  | not started |
| 82 | Stack multiple SEND profiles per worksheet (sendNeed → sendNeeds[])                   | PR-16  | shipped — PR-16 |
| 83 | Subject-vocabulary library audit                                                      | PR-19  | not started |
| 84 | Spec-point taxonomy completeness audit                                                | PR-19  | not started |
| 85 | Document the public LLM-output contract                                               | PR-22  | not started |

## Status legend

- `not started` — work has not begun.
- `in-flight` — a PR is open or a branch is in active development.
- `shipped — PR #NN` — merged into main, with the PR number.
- `deferred` — explicitly out of scope until external prerequisites
  (credentials, third-party APIs, separate distribution) land.
- `dropped` — withdrawn after re-evaluation; row stays for traceability
  with a one-line note in the rightmost column.
