# Full-Suite Repair Register

**Baseline:** `pnpm vitest run --reporter=dot` on 22 August 2026
**Result:** 34 passing files, 12 failing files; 892 passing tests, 47 failing tests, 1 skipped test.

| Cluster | Observed problem | Initial classification | Repair direction |
|---|---|---|---|
| FSR-01 | `auth.cookie`, `auth`, and `billing` suites abort because `DATABASE_URL` is absent. | Test-environment configuration defect. | Provide an explicit test database adapter/configuration path; preserve production fail-fast behavior. |
| FSR-02 | UK-English substitution duplicated complete strings and was non-idempotent. | Genuine pupil-facing content defect. | Repaired callback capture handling; focused suite now passes. |
| FSR-03 | Self-reflection tests expect a retired confidence-grid surface while current implementation intentionally emits a single, topic-anchored exit ticket. | Stale test contract, subject to replacement with checks for the documented compact reflection policy and SEND registers. | Align tests with the current print-safe contract; add retained-content and SEND-language assertions. |
| FSR-04 | Command-word test detects `reflect` rather than the required multi-word `reflect on`; unit-conversion recogniser misses a declared case. | Genuine curriculum-validation defects. | Repair phrase matching and topic detection; re-run all command-word / SI unit integration tests. |
| FSR-05 | Several registry / severity / order assertions are stale after validators were added or reordered. | Test contracts stale against expanded quality chain. | Generate expected order/severity from registry or update the locked contract with every current validator and appropriate severity. |
| FSR-06 | Maths-only working-out detector renders for Science calculation stems. | Genuine layout defect. | Restrict dot-grid affordance to Maths subjects; verify Science keeps ordinary response space. |
| FSR-07 | SEND enforcer is not idempotent for ADHD. | Genuine SEND adaptation defect. | Identify repeated insertion path; add idempotency guard and regression test. |
| FSR-08 | Unit-pack ZIP tests fail under Node because PDF binary type is unsupported; unsupported format fails to reject. | Genuine export reliability / test-environment defect. | Normalise binary payloads before ZIP insertion and reject unknown formats at API boundary. |
| FSR-09 | Worksheet-library lookup and tier-switch test expectations diverge from current SQL and result data. | Requires code-versus-contract inspection. | Preserve exact subtopic and tier identity; add behavioural regression around request parameters. |
| FSR-10 | Coverage aggregator has rounding and unknown-taxonomy fallback defects. | Genuine reporting-quality defects. | Use residual rounding and explicit taxonomy-not-found handling. |
| FSR-11 | Version diff, prompt structure, QA score and subject-profile/SEND resolver assertions diverge. | Mixed code/test regressions. | Triage individually; retain only curriculum- and product-correct behaviour. |

> Every genuine defect must be repaired in source, covered by a focused regression, and re-tested. Test-contract updates are permitted only when the test contradicts the current documented, pupil-safe product contract; they must never conceal a functional regression.

## Closure evidence — 22 August 2026

All clusters in the baseline register have been addressed through source repairs, corrected test contracts only where the old assertion contradicted the documented product contract, and repeated regression execution. The late visual review additionally identified a genuine lower-boundary risk in the dedicated Geography and Business print layouts; that was repaired rather than accepted.

| Final gate | Command / evidence | Result |
|---|---|---|
| Type safety | `pnpm check` | Passed with zero TypeScript errors. |
| Full automated regression | `pnpm vitest run --reporter=dot` | **46 test files passed; 954 tests passed; 1 skipped.** |
| Worksheet scrutiny | `node scripts/verify-worksheet-scrutiny.mjs` | Passed, including the runtime ASC section-grouping checks. |
| Production bundle | `pnpm build` | Passed. Rollup reports only the pre-existing large-chunk advisory, not a build error. |
| Deterministic dedicated-layout matrix | Targeted alongside full suite | Passed for all supported Science/Humanities profile and reading-age combinations. |
| Print evidence | Ten regenerated PDFs; `pdfinfo` verification | Every sample is A4 landscape; protected Maths/Humanities samples have two pages, and dedicated Science samples have one page. |

### Final repair additions after the first green suite

| Item | Defect found during final review | Resolution and retest |
|---|---|---|
| FSR-20 | Geography and Business lower response regions approached the footer boundary in the true PDF view. | Reserved a 7 mm footer safety offset, compacted only the affected non-protected response areas, regenerated PDFs, visually rechecked both layouts, and passed the exhaustive layout matrix plus full suite. |
| FSR-21 | Dedicated Humanities profiles displayed a support label without a compact, explicit pupil-facing strategy. | Added deterministic support modes with low-vision contrast treatment and an ASC one-task-at-a-time work route; focused test, exhaustive matrix and full suite now enforce it. |
| FSR-22 | pg-mem emitted misleading DDL-warning noise on valid production schema during isolated integration tests. | Enabled only pg-mem’s `noAstCoverageCheck` test-harness option and retained the identical production schema for tests; the final full suite runs without the prior DDL-warning output. Production still requires `DATABASE_URL` and remains fail-fast. |

> **Current status:** the worksheet quality gate is technically clear. No authenticated production worksheet generation, assignment, distribution or payment flow has been claimed as validated because no authorised production session was used.


## SEND programme regression gates — 22 August 2026 (current source)

| Gate | Command / evidence | Result |
|---|---|---|
| Type safety | `pnpm check` | Passed with zero TypeScript errors after learner-support, scaffold, diagram-accessibility, cross-tool and scheduler changes. |
| Focused contracts | Learner profile, diagram accessibility, assignment view/payload and scheduler suites | **6 files, 18 tests passed.** Includes durable profile persistence/audit validation, access-plan invariance, diagram description non-task boundary, assignment pupil-view persistence and scheduler identity/diagnosis exclusion. |
| Full automated regression | `pnpm vitest run --reporter=dot` | **52 test files passed; 973 tests passed; 1 skipped.** |
| Protected worksheet scrutiny | `node scripts/verify-worksheet-scrutiny.mjs` | Passed, including ASC support routing/runtime grouping and protected subject rules. |
| Production bundle | `pnpm build` | Passed. The only output of note is the known Rollup chunk-size advisory; no build failure occurred. |
| Current print evidence | Rebuilt ten samples; Chromium PDF/PNG export; `pdfinfo`; high-risk visual inspection | All mandatory A4 landscape contracts passed: Maths Gold/English/History/Geography/Business = two pages; dedicated Science = one page. Current high-risk enlarged-print Maths and KS1 dyslexia Science views show no observed overlap, clipping or geometry drift. |


## Completed diagram and governed-workflow regression gates — 22 August 2026

| Gate | Command / evidence | Result |
|---|---|---|
| Hard diagram contracts | SVG collision/semantic and structured-engine validation suites | **3 files, 10 tests passed.** Crossing/overlaid connectors, crowded labels, clipped labels and incomplete required maths relationships are hard failures; approved series/parallel circuit patterns remain renderable. |
| Family-safe draft review | Parent communication review-gate suite | **2 tests passed.** High-severity privacy/safeguarding findings block personalised local-draft export; non-high-risk drafts still require staff review acknowledgement. |
| Cross-tool focused regression | Diagram, learner-support, parent-review, assignment-payload and scheduler tests | **9 files, 27 tests passed.** |
| Full automated regression | `pnpm vitest run --reporter=dot` | **55 test files passed; 982 tests passed; 1 skipped.** |
| Type safety | `pnpm check` | Passed with zero TypeScript errors. |
| Production bundle | `pnpm build` | Passed; only the known Rollup large-chunk advisory was emitted. |
| Protected worksheet scrutiny | `node scripts/verify-worksheet-scrutiny.mjs` | Passed. |
| Current print evidence | Rebuilt ten samples; Chromium PDF/PNG export; `pdfinfo`; visual review of low-vision Maths and dyslexia-adapted Science | Mandatory A4 landscape page contracts passed for all current samples; no observed overlap, clipping, label collision, prompt/answer leakage or protected geometry drift. |

## 2026-08-22 — Teacher workspace redesign, learner overlay continuity and presentation visual system (local)
| Field | Record |
|---|---|
| Scope | Added a reusable teacher-workspace shell, responsive page headers, calm studio surfaces and task-led dashboard hierarchy. Applied the shared language to Home, navigation, pupil management, History, analytics, Settings and reusable AI tool pages while retaining existing routes, decisions, forms and role boundaries. |
| Learner display boundary | Pupil-safe assignment metadata now carries only display-safe overlay provenance. Learner and teacher review views use one resolver: dyslexia defaults to cream for legacy and auto-mode work; an explicit manual choice is honoured; protected fixed-format worksheets stay white. No task content, marks, diagrams, teacher-only sections or print geometry is modified. |
| Slide visual boundary | The Presentation Maker uses subject-responsive CSS motifs behind clear instructional surfaces; high-contrast mode suppresses decorative treatment. Presentation content remains real text and the classroom/presenter accessibility controls remain intact. |
| Focused validation | **Passed:** 6 files / 13 tests, including direct render checks for shared workspace components, pupil overlay modes, History rich structure, pupil assignment persistence and presentation subject visual themes. |
| Full regression | **Passed:** `pnpm vitest run --reporter=dot` reports **59 test files passed, 992 tests passed, 1 skipped**. |
| Static/build/scrutiny gates | **Passed:** `pnpm check`, `pnpm build`, and `node scripts/verify-worksheet-scrutiny.mjs`. The production build retains only the known Rollup chunk-size advisory. `git diff --check` also passed. |
| Visual evidence boundary | The subject-slide visual example was inspected and previously delivered. The data-backed local dashboard route could not render in this sandbox because the development server requires an unavailable `DATABASE_URL`; source-level rendering tests and responsive layout code were used instead. No live-dashboard visual-success claim is made from that constrained route. |
| Release boundary | These are local observed results only. No production publish, deployment, commit, authenticated generation, assignment, distribution, scheduler run, payment or family communication was performed. |
