# Big-Bang 7-Sprint Plan — Session Handoff

> **Always update this file at the end of every checkpoint** so the
> next chat can pick up cleanly. Edit "What is done" / "What is in
> flight" / "What is next" in the same commit as the work it describes.
> Push to remote in the same step.

Last updated: 2026-05-25 — **PR-1 in flight, Sprint 1 + 3.A + 3.B +
3.E shipped.** Branch `big-bang-7/pr-1-measure-and-prompt-arch`.
Sprint 3.B added `client/src/lib/validatorFeedbackRetry.ts` —
generic retry helper. Public surface: `runWithValidatorFeedbackRetry`
(generic over generator/validator/append) +
`runWorksheetWithRetry` (worksheet convenience wrapper). When ≥3
post-validator warnings fire, re-prompts ONCE with the warnings
inlined as a constraint block via `buildConstraintBlock`. Picks the
better-scoring result by `qaScore.total` (ties go to the retry).
Stamps `metadata.retryCount` (0 | 1) + `metadata.retryReasons`
on the returned worksheet. 22-test lock at
`client/src/lib/__tests__/validatorFeedbackRetry.test.ts`. Next
chunk: Sprint 3.C — per-subject prompt-family unit test.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Big-bang 7-sprint plan, 4 PRs.
Resume:  .agents/tasks/big-bang-7-sprints/SESSION-HANDOFF.md
Plan:    .agents/tasks/big-bang-7-sprints/PHASE-PLAN.md
Constraints:
  - Sandbox is INTEGRATIONS_ONLY. No npm install. Tests + tsc
    run in CI on PR push.
  - Do NOT read ai.ts (5,448 lines), worksheetPostValidator.ts
    (2,233 lines), Worksheets.tsx, or WorksheetRenderer.tsx in
    full. Line ranges are pinned in this file (below).
  - Schema additions: optional fields only.
  - Bank edits: append-only.
  - All new validators pure + idempotent.
  - Push to remote after every meaningful chunk.
Goal: complete the next un-shipped item in "What is next" below.
```

## File pin-points (so the next chat doesn't re-explore)

| File                                                                   | Line range / API                                                       | Why                                                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `client/src/lib/ai.ts` §GENERATE marker                                | L1002–L4170 (3,167 lines, the worksheet generator)                      | Sprint 3 wraps it; do NOT read in full.                                              |
| `client/src/lib/ai.ts` `aiGenerateWorksheet` signature                 | L1003 (`export async function aiGenerateWorksheet(params: { … })`)      | Sprint 3 two-pass orchestrator delegates to it under flag.                           |
| `client/src/lib/ai.ts` `aiGenerateWorksheetFromClassBrief`             | L4192 (returns same shape, ~50-line wrapper)                            | Sprint 5 `aiGenerateWorksheetFromSource` slots in next to it.                        |
| `client/src/lib/ai.ts` `callAI` + `callAIMessages`                     | L591 + L649                                                             | Sprint 5 vision-mode wiring extends these.                                           |
| `client/src/lib/worksheetPostValidator.ts` `runWorksheetPostValidators` | grep `runWorksheetPostValidators` — uses registry from PR-8             | Sprint 3 retry loop fires from this tail. Do NOT read file in full.                  |
| `client/src/lib/worksheetPostValidator.ts` validator chain registry    | imported from `worksheetPostValidatorRegistry.ts` (PR-8 of big-bang)    | Sprint 4 examiner-voice pass registers via the same `adapt()` pattern.               |
| `client/src/lib/promptAbFramework.ts`                                  | 111 lines, exports `pickVariant`, `resolveExperiment`, `validateExperiment` | Sprint 3 wires into eval harness; module is bench-ready, not yet on hot path.    |
| `client/src/lib/selfConsistencySampler.ts`                             | 130 lines, exports `shouldSelfSample`, `recommendedSampleCount`, `reconcileSelfConsistency` | Sprint 3 wires onto Section 3 hot path; bench-ready.                  |
| `client/src/lib/perSubjectPromptFamilies.ts`                           | 125 lines, exports `PROMPT_FAMILIES`, `lookupPromptFamily`, `renderPromptFamily` | Sprint 3 audit asserts maths-only loads for maths topic; bench-ready.        |
| `client/src/lib/specPointTaxonomy.ts`                                  | 215 lines, dataset registration via `taxonomyKey()` (L116) + `getSpecPoints` (L134) | Sprint 2 adds new datasets behind this surface — no signature changes.   |
| `client/src/lib/class-pack.ts`                                         | `runClassPack` at L139, `buildClassPackHtml` at L401, `openClassPackWindow` at L480 | Sprint 6 extends `runClassPack` to accept tier-set (core/supported/extension). |
| `client/src/lib/ehcp-enhancements.ts`                                  | EHCP-draft helpers (NOT worksheet-gen — separate concern)               | Sprint 6 builds a NEW `aiWorksheetEhcpBridge.ts` that adapts EHCP outcomes → generator instructions. Don't repurpose this module wholesale. |
| `client/src/lib/pupil-context.ts`                                      | `buildPupilContext(child)` at L33                                       | Sprint 6 bridge consumes this output as the "first-class input" pathway.             |
| `client/src/lib/sendPromptFragments.ts`                                | 1,217 lines — resolver-order bug noted in big-bang PR-1 notes           | Sprint 6 adds SM + DLD entries; do NOT touch the SEMH resolver-order bug here.       |
| `client/src/lib/sendFidelityAudit.ts`                                  | 958 lines, `applySendFidelityAudit` is the entry point                  | Sprint 6 SM + DLD profiles add to PROBES table.                                      |
| `client/src/lib/pastPaperFingerprint.ts`                               | 166 lines                                                               | Sprint 4 extends with `enforceCadenceDrift` (mirror of existing too-close detector). |
| `client/src/lib/wcagAuditor.ts`                                        | 332 lines                                                               | Sprint 6 extends with alt-text quality check (currently compliance-only).            |
| `server/tests/worksheet-eval/runner.ts`                                | 230 lines, `main()` orchestrates the run                                | Sprint 1 extends to invoke model-judge + write per-axis breakdown.                   |
| `server/tests/worksheet-eval/types.ts`                                 | 100 lines, `EvalReport` interface — additive extension                  | Sprint 1 adds `humanScores`, `modelJudgeScores` fields.                              |
| `server/tests/worksheet-eval/rules.ts`                                 | `RULE_REGISTRY` is open-set                                             | Sprint 1 adds `model-judge-axis-floor` rule (per-axis threshold).                    |
| `server/tests/worksheet-eval/generators.ts`                            | 200 lines, mock + live generators                                       | Sprint 1 model-judge uses a SECOND generator (judge model) — see Sprint 1 note below. |
| `server/tests/worksheet-eval/fixtures/`                                | 50 fixtures (10 maths/english/science/humanities/send)                  | Sprint 1 adds 30-fixture comparison-corpus alongside (different selection).          |
| `.github/workflows/worksheet-eval.yml`                                 | nightly cron + workflow_dispatch                                        | Sprint 1 extends to run model-judge when `EVAL_JUDGE_*` keys are set.                |

## What is done

- **Phase scaffolding** (commit `8828ad2`). Created the phase folder
  with `RESUME.md`, `PHASE-PLAN.md`, this handoff file. Branch
  `big-bang-7/pr-1-measure-and-prompt-arch` cut from `main` and
  pushed.

- **PR-1 / Sprint 1.A — Teacher-rater rubric.** Wrote
  `docs/teacher-rater-rubric.md`: 6 axes × 5 anchors each
  (curriculum fidelity, stem authenticity, accessibility, marks &
  answers tightness, SEND alignment, UX & printability). Includes
  CSV format for batch human ratings (`humanScores.csv` with
  fixtureId / raterId / per-axis cells / notes), and the calibration
  contract (model-judge vs human, target ≤0.5 mean abs deviation per
  axis, drift ≥1.0 triggers judge-prompt recalibration). Hand-offable
  to any practising UK classroom teacher; ~7-minute rate-time budget.

- **PR-1 / Sprint 1.B — Comparison corpus.** Three new files:
  - `server/tests/worksheet-eval/comparison-corpus.json` — 30 fixed
    fixtures with `cmp-` prefixed ids. Distribution: 4 KS1/KS2
    (Y2 maths, Y4 English, Y5 science, Y6 RE) + 8 KS3 (Y7+Y9 maths,
    Y7+Y8 English, Y8+Y9 science, Y8 geography, Y9 history) + 12
    GCSE (AQA maths Y10F + Y10H + Y11H, Edexcel maths Y10H, OCR
    maths Y10H, AQA bio Y10, AQA chem Y11, AQA phys Y10, AQA Eng
    Lit Y10 Macbeth, AQA Eng Lang Y11 P2 Q5, AQA geography Y11
    tectonics, AQA history Y10 Cold War) + 3 A-Level (AQA maths
    Y12, AQA biology Y13, AQA Eng Lit Y12) + 3 SEND (dyslexia Y8
    maths, ADHD Y10 English, ASC sensory Y8 science). Per-bucket
    counts: maths 9 · english 6 · science 7 · humanities 5 · send 3.
  - `server/tests/worksheet-eval/comparisonCorpus.ts` — loader
    (`loadComparisonCorpus`, `bucketCounts`, `tagFixtures`,
    `COMPARISON_CORPUS_VERSION = "1.0.0"`,
    `COMPARISON_CORPUS_EXPECTED_SIZE = 30`). Loader validates id
    prefix, uniqueness, bucket whitelist, required params, exact
    size, and throws on any deviation so a hand-edit can't silently
    shift the benchmark.
  - `server/tests/comparisonCorpus.test.ts` — 9 vitest cases
    locking corpus size, prefix + uniqueness, rule-name validity
    (against `ALL_RULE_NAMES`), bucket distribution, key-stage
    coverage (KS1/KS2 + KS3 + GCSE + A-Level + SEND), SEND
    `send-fidelity-floor` rule presence, exam-board + spec-rule
    presence on GCSE/A-Level fixtures, readingAgeRange monotonic +
    plausible (5–20, span ≤5 years), and version semver shape.
    Helper test asserts `bucketCounts` sums to corpus length and
    `tagFixtures` is non-mutating.

- **PR-1 / Sprint 1.C — Eval-report schema additive extension +
  axis-floor rule + per-axis summariser.** Four files touched:
  - `server/tests/worksheet-eval/types.ts` — additive only. Added
    `AxisScores` (6 axes, null = n/a), `HumanScoreEntry`,
    `AxisScoresAggregate` / `AxisAggregate`, frozen `AXIS_KEYS`
    array (single source of truth for axis iteration order),
    derived `AxisKey` type. `EvalFixture` gained
    `modelJudgeAxisFloor?: Partial<Record<AxisKey, number>>`.
    `EvalReportRow` gained `corpus`, `modelJudgeScores`,
    `modelJudgeRationale`, `humanScores`. `EvalReport` gained
    `modelJudgeProvider/Model/Aggregate`, `humanScoresPath/
    Aggregate`, `comparisonCorpus { version, size }`. Older
    runners reading newer reports keep working.
  - `server/tests/worksheet-eval/rules.ts` — added
    `model-judge-axis-floor` rule (default floor 3, per-fixture
    override, floor=0 disables, null axes treated as n/a).
    No-op when judge didn't run.
  - `server/tests/worksheet-eval/summariser.ts` — `aggregateAxisScores`
    (pure, null-safe, 2dp rounding), `medianHumanScores`
    (outlier-resistant median across raters), `renderAxisBlock`.
    Markdown summary now emits "Per-axis (model-judge)" and
    "Per-axis (human, median)" tables when present.
  - `server/tests/evalRubricExtensions.test.ts` (new) — 17 vitest
    cases.

- **PR-1 / Sprint 1.D — Model-judge rater (cross-provider).** Two
  files:
  - `server/tests/worksheet-eval/modelJudgeRater.ts` (new) — single
    source of truth for the model-judge surface.
    - `Rater` interface: `{ name, provider, model, estimatedCostUsd,
      rate(worksheet, fixture) → Promise<{ scores, rationale }> }`.
    - `stubRater`: deterministic, $0, runs offline. Algorithm:
      `bandFromQaScore(meta.qaScore.total)` mapping 0–100 → 1–5
      bands (≥90→5, ≥75→4, ≥60→3, ≥40→2, else 1) → walk
      `meta.postValidatorWarnings` and apply `classifyWarning`
      per-axis deductions (-1 per matching warning, capped at -3 per
      axis to prevent a noisy worksheet from sinking every axis to
      0) → clamp [1,5]. `sendAlignment = null` when
      `fixture.params.sendNeed` is absent (matches rubric n/a rule).
    - `classifyWarning(warning)`: pure helper that returns the axes
      a single warning string deducts from. Substring-matched
      against curated patterns drawn from the existing
      post-validator warning surface (specRef / command-word /
      reading-age / mark-scheme / send-fidelity / page-fit /
      foreign-diagram). Single source of truth for the stub's
      per-axis penalties; the live rater's prompt makes the same
      per-axis split so the two raters stay calibrated.
    - `liveRater`: calls `callAIMessages` (dynamic-imported from
      `client/src/lib/ai`) with `RUBRIC_SYSTEM_PROMPT` (mirrors the
      6-axis rubric verbatim) and a compact user message built by
      `buildJudgeUserMessage`. JSON-object response format requested.
      Parses via `parseJudgeResponse` (handles raw JSON / fenced /
      wrapped-in-commentary / rejects out-of-range axes).
      **Falls back to stub on any failure** so the runner never
      aborts on judge issues.
    - `pickRater()`: env-driven factory. EVAL_JUDGE_MODE=stub
      (default) / live / off.
    - `offRater`: returns all-null scores + explicit "disabled"
      rationale; runner detects this and skips the rubric block.
    - `assessProviderIsolation(judge, generator)`: returns
      `{ isolated, warning }`. Stub/mock on either side = isolated.
      Same provider both sides → warning (or thrown error under
      EVAL_JUDGE_STRICT_ISOLATION=1).
    - `shimLocalStorageForJudge` + `mergeJudgeKeys`:
      non-destructive merge with any existing generator-side
      localStorage seed.
    - `RATIONALE_TRUNCATE_AT = 500`: rationale strings truncated
      with ellipsis to keep report file size sensible.
  - `server/tests/modelJudgeRater.test.ts` (new) — 41 vitest cases
    across 9 describe blocks (bandFromQaScore 6, classifyWarning 7,
    computeStubScores 9, stubRater 3, parseJudgeResponse 7,
    buildJudgeUserMessage 4, truncateRationale 2,
    assessProviderIsolation 6, pickRater + offRater 5).

- **PR-1 / Sprint 1.E — Runner integration + human-scores loader.**
  Four files touched (two new):
  - `server/tests/worksheet-eval/humanScoresLoader.ts` (new) — pure
    CSV parser (handles double-quoted cells, escaped `""` quotes,
    Windows CRLF, blank lines, trailing newline) +
    `loadHumanScoresCsv(path)` filesystem reader. Empty axis cells
    become `null` (rubric n/a rule); out-of-range cells throw with
    full row+axis context. Header validated against the rubric's
    canonical column order.
  - `server/tests/worksheet-eval/runner.ts` — extensive surgical
    edit (EVAL_HARNESS_VERSION 1.0.0 → 1.1.0). New `TaggedFixture`
    type preserves corpus origin through the pipeline.
    `loadAllFixtures` reads either or both corpora per
    `EVAL_CORPUS=fixtures|comparison|both`. `checkBudget` sums
    generator + rater. `runFixture(f, gen, rater)` invokes the
    rater after post-validators run, stamps onto both
    `metadata.modelJudgeScores` and `row.modelJudgeScores`, with
    rater errors caught + logged + tolerated. `main()` runs
    `assessProviderIsolation` at startup, optionally loads
    `EVAL_HUMAN_SCORES_CSV`, computes `modelJudgeAggregate` +
    `humanScoresAggregate` + `comparisonCorpus` metadata.
  - `server/tests/worksheet-eval/comparison-corpus.json` — every
    entry's `rules` array opts into `model-judge-axis-floor`. All
    30 fixtures touched. Default floor 3 (no per-fixture override
    yet).
  - `server/tests/humanScoresLoader.test.ts` (new) — 17 vitest
    cases across 2 describe blocks (parseCsvLine 4, parseHumanScoresCsv
    13).

- **PR-1 / Sprint 1.F — Baseline + nightly CI workflow extension.**
  Three files touched (one new):
  - `server/tests/worksheet-eval/eval-report.baseline.json` (new) —
    placeholder baseline with empty `ruleStats` and zero rows. The
    `_comment` field at the top documents the contract: the first
    `main`-push CI run replaces this in-place via the
    `refresh-baseline` job below; subsequent runs measure against
    whatever the most recent main produced. Stamps
    `comparisonCorpus { version: "1.0.0", size: 30 }` so the
    report-shape lock holds even in the empty case.
  - `server/tests/worksheet-eval/runner.ts` — extended the
    diff-against handling to support `--update-baseline` (or
    `EVAL_UPDATE_BASELINE=1`). When set, the runner overwrites the
    diff-target file with the current report after the run.
    Refuses to write when any fixture errored (would freeze a bad
    state into the baseline). Default behaviour (no flag) is
    unchanged: read baseline, detect regressions, log/fail per
    bail-on-fail.
  - `.github/workflows/worksheet-eval.yml` — full rewrite preserving
    the existing nightly + workflow_dispatch entry points, plus:
    - `EVAL_CORPUS=both` default for nightly so the comparison
      corpus runs every night.
    - New `judge_mode` workflow_dispatch input (stub | live | off).
    - `--diff-against=server/tests/worksheet-eval/eval-report.baseline.json`
      on every run so PR-day regressions are visible.
    - Live-judge env wiring: EVAL_JUDGE_*_KEY pair (separate from
      EVAL_*_KEY) so a single run can use different providers for
      generator and judge — single-run cross-provider isolation
      is a config-only choice.
    - New sibling `refresh-baseline` job that fires on `push` to
      `main` (with path filter so doc-only PRs don't trigger),
      runs the harness with `--update-baseline` flag, and commits
      the refreshed baseline back via the bot account. Uses
      `permissions: contents: write` and the standard
      github-actions[bot] commit signature.

- **PR-1 / Sprint 3.A — Two-pass generator orchestrator (+ 3.E
  self-consistency hook).** Two new files:
  - `client/src/lib/aiGenerateWorksheetTwoPass.ts` (new) — public
    entry `aiGenerateWorksheetTwoPass(params)` always returns
    `AIWorksheetResult`. Two routing paths:
    - **Flag OFF (default)**: pass-through delegate to legacy
      `aiGenerateWorksheet`. Strips two-pass-only params before
      delegating. Existing callers see no change.
    - **Flag ON** (`WORKSHEET_TWO_PASS_ENABLED=1` env or
      `globalThis.WORKSHEET_TWO_PASS_ENABLED=true` or per-call
      `params.twoPassOverride=true`): runs Pass 1 + Pass 2.
    - Pass 1 (`aiGenerateWorksheetSkeleton`): ~700-token
      `callAIMessages` request with `buildSkeletonPrompt`. Embeds
      per-subject family header from `lookupPromptFamily(subject)`.
      Asserts EXACTLY 7 question sections + LO + word-bank +
      worked-example + mark-scheme + self-reflection + revision-tips.
      Forbids invented spec codes.
    - Pass 2 (`aiFillWorksheetSection`): per-section ~600-token
      call with `buildSectionFillPrompt`. `sectionContractFor(type)`
      embeds the section-type contract (LO = single sentence,
      q-mcq = 4 options + ✓ + diagnoses, q-extended = M/A/E mark
      points, etc.). All sections fire in parallel via `Promise.all`;
      a failed section emits empty content + warns + doesn't abort
      the others.
    - Self-consistency hook (3.E) — behind
      `PROMPT_SELF_CONSISTENCY_ENABLED=1`.
      `pickSelfConsistencySection` picks the highest-mark
      q-extended section (>=5 marks per `shouldSelfSample`).
      `fillSectionWithSelfConsistency` runs
      `recommendedSampleCount(marks)` parallel fills then
      `reconcileSelfConsistency` picks consensus marking-point list
      + longest-content sample. Confidence (avg pairwise Jaccard)
      stamped on metadata.
    - Stamps `metadata.generatorVersion = "two-pass-1.0.0"`,
      `selfConsistencyApplied` / `Confidence` / `SampleCount` when
      applicable, `adaptations[]` from `sendNeed`.
  - `client/src/lib/__tests__/aiGenerateWorksheetTwoPass.test.ts`
    (new) — 27 vitest cases across 8 describe blocks:
    isTwoPassEnabled (6), isSelfConsistencyEnabled (3), routing
    (3 — legacy delegate + field stripping + two-pass path), 
    buildSkeletonPrompt (3), aiGenerateWorksheetSkeleton (2),
    buildSectionFillPrompt (2), aiFillWorksheetSection (2),
    pickSelfConsistencySection (2), fillSectionWithSelfConsistency
    (2 — single-shot, N-shot reconciliation), end-to-end metadata
    stamping (2 — on / off).

- **PR-1 / Sprint 3.B — Validator-feedback retry loop.** Two new
  files:
  - `client/src/lib/validatorFeedbackRetry.ts` (new) — generic +
    worksheet-specific retry surface.
    - `runWithValidatorFeedbackRetry(generate, validate, append,
      params, opts)` — generic over generator function shape.
      Pure / idempotent. Threshold default 3. Single-round-trip
      (no retry pyramid). Picks higher-qaScore winner; ties go to
      retry. Catches retry-side errors and falls back to original.
    - `runWorksheetWithRetry(generate, params, opts)` — worksheet
      convenience wrapper. Reads `metadata.postValidatorWarnings`
      + `metadata.qaScore.total` via `extractWorksheetEval`,
      appends constraints to `additionalInstructions` via
      `appendInstructionsConstraints`. Stamps
      `metadata.retryCount` (0 | 1) + `metadata.retryReasons` on
      the returned worksheet for telemetry. Drop-in around either
      `aiGenerateWorksheet` or `aiGenerateWorksheetTwoPass`.
    - `stripValidatorPrefix(warning)` strips bracketed validator
      labels (`[Phase 1 / enforceSpecAnchorPresence]` etc.) so the
      retry prompt doesn't waste tokens on internal labels.
    - `buildConstraintBlock(warnings, maxWarnings=8)` produces
      the inlined retry block. Cap prevents prompt bloat on
      noisy outputs. Header asks the LLM to treat each as a hard
      constraint without discussing why.
  - `client/src/lib/__tests__/validatorFeedbackRetry.test.ts`
    (new) — 22 vitest cases across 6 describe blocks:
    `stripValidatorPrefix` (7 — bracketed prefix variants, no
    prefix, whitespace, em-dash separator, idempotent),
    `buildConstraintBlock` (6 — empty input, all-stripped, single
    warning, multi-numbering, dedup, maxWarnings cap, prefix
    strip), `runWithValidatorFeedbackRetry` (8 — no retry below
    threshold, retry at threshold, constraint append, higher-qaScore
    wins, lower-qaScore loses, tie goes to retry, retry-error
    fallback to original, threshold=0/Infinity disable),
    `extractWorksheetEval` (3 — happy, missing fields, missing
    metadata), `appendInstructionsConstraints` (3 — empty initial,
    populated initial, non-mutating), `runWorksheetWithRetry`
    (3 — no-retry stamp, retry stamp, identity preservation).

- **PR-1 / Sprint 3.C — Per-subject prompt-family unit test.** One
  new test file:
  - `client/src/lib/__tests__/perSubjectPromptFamilies.test.ts`
    (new) — 14 vitest cases across 5 describe blocks. Locks the
    routing surface so a refactor can't silently swap prompts
    between subject segments.
    - `PROMPT_FAMILIES registry` (5 — exactly 7 keys, every header
      non-empty, every family has ≥1 directive, key matches slot,
      registry frozen).
    - `lookupPromptFamily — primary subject routing`: maths
      variants (6 it.each), science variants (6), english-lit
      variants (4), english-lang variants (3), humanities variants
      (5), creative variants (5), unknown → general (3). Plus the
      "load-bearing" test that `lookupPromptFamily("GCSE Maths
      Higher")` is NEVER the english-lit family — explicit
      defensive lock against the worst-case silent-swap regression.
      Plus english-lit never routes to english-lang.
    - `forbidden-pattern lock` (3): maths imperial units, science
      maths-only working-out box (Phase 1 lock), english-lit plot
      summary (Phase 5 lit-spec lock).
    - `renderPromptFamily` (5): header verbatim, every directive
      bullet, forbidden-patterns block present when populated /
      omitted when empty, non-empty output for every family.
  - `server/tests/worksheet-eval/humanScoresLoader.ts` (new) — pure
    CSV parser (handles double-quoted cells, escaped `""` quotes,
    Windows CRLF, blank lines, trailing newline) +
    `loadHumanScoresCsv(path)` filesystem reader. Empty axis cells
    become `null` (rubric n/a rule), out-of-range cells throw with
    full row+axis context. Header validated against the rubric's
    canonical column order. Returns
    `{ byFixture: Map<id, HumanScoreEntry[]>, totalRows, uniqueRaters }`.
  - `server/tests/worksheet-eval/runner.ts` — extensive surgical
    edit. EVAL_HARNESS_VERSION bumped 1.0.0 → 1.1.0.
    - New `TaggedFixture = EvalFixture & { corpus }` so per-row
      origin is preserved through the pipeline.
    - `loadFileFixtures` (renamed from `loadFixtures`) +
      `loadAllFixtures` reading either or both corpora per
      `EVAL_CORPUS=fixtures|comparison|both` env. Default
      "fixtures" preserves existing local-dev speed; CI sets "both".
    - `checkBudget` now sums `(generator.estimatedCostUsd +
      rater.estimatedCostUsd) × fixtures.length` against
      `EVAL_BUDGET_USD`. Mock+stub stays at $0.
    - `runFixture(fixture, generator, rater)` — invokes the rater
      after `runWorksheetPostValidators`, stamps scores onto both
      `metadata.modelJudgeScores` (so the
      `model-judge-axis-floor` rule sees them via
      `evaluateRules`) and `row.modelJudgeScores` (for the report).
      Rater errors are caught + logged + tolerated — a judge
      failure doesn't fail the row.
    - `main()` — calls `assessProviderIsolation(rater.provider,
      generator.name)` once at startup; logs warning when not
      isolated (or throws under EVAL_JUDGE_STRICT_ISOLATION=1).
      Loads optional `EVAL_HUMAN_SCORES_CSV` once before the loop
      and indexes by fixtureId. After the loop, computes
      `modelJudgeAggregate` via `aggregateAxisScores(rows.map(r =>
      r.modelJudgeScores))` and `humanScoresAggregate` via
      `aggregateAxisScores(rows.map(r =>
      medianHumanScores(r.humanScores)))`. Stamps
      `report.modelJudgeProvider` / `modelJudgeModel` /
      `comparisonCorpus { version, size }` (last only when
      comparison corpus actually ran).
  - `server/tests/worksheet-eval/comparison-corpus.json` — every
    entry's `rules` array now opts into `model-judge-axis-floor`
    so the new wiring is exercised end-to-end. All 30 fixtures
    touched. Uses default floor 3 (no per-fixture override yet) —
    once the stub baseline settles in CI we can tighten per-axis
    floors per fixture without touching this PR.
  - `server/tests/humanScoresLoader.test.ts` (new) — 17 vitest
    cases across 2 describe blocks: `parseCsvLine` (4 cases) and
    `parseHumanScoresCsv` (13 cases — empty file, header-only,
    single full row, empty axis = null, multi-rater grouping,
    multi-fixture grouping, quoted notes with comma, CRLF
    tolerance, blank-line skip, header typo throws, short row
    throws, missing fixtureId throws, out-of-range axis throws,
    non-numeric axis throws, zero-axis throws).

## What is in flight

_Nothing in flight; ready to start Sprint 3.D._

## What is next

**PR-1 / Sprint 3.D — Wire `promptAbFramework` into the eval
harness.** Branch `big-bang-7/pr-1-measure-and-prompt-arch`.

Edit `server/tests/worksheet-eval/runner.ts` + `generators.ts` so
the harness can run paired prompt-variant comparisons. Plan:

1. Reads `EVAL_AB_EXPERIMENT` env (id of an experiment defined in
   `promptAbFramework.PROMPT_FAMILIES` registry, or a sibling
   `evalAbExperiments.ts` with experiment IDs like
   `legacy-vs-twoPass`, `family-default-vs-tightened`).
2. Buckets each fixture deterministically by `pickVariant(experiment,
   fixture.id)`.
3. The chosen variant's `payload` is consumed by the live generator
   to switch prompt path (e.g. `payload.useTwoPass: boolean`).
4. Stamps `row.experimentVariant` on the report row.
5. Summariser splits ruleStats per variant and renders a paired
   "A vs B" markdown table.

After Sprint 3.D, all Sprint 3 deliverables are shipped → open PR-1.

## Per-PR tracking (live state for the current PR)

### PR-1 — `big-bang-7/pr-1-measure-and-prompt-arch`

Status: **in flight, 11/13 deliverables shipped (Sprint 1 complete + Sprint 3.A/3.B/3.C/3.E shipped).**

Sprint 1 deliverables: 8/8 complete.

Sprint 3 deliverables (from PHASE-PLAN.md):

- [x] `client/src/lib/aiGenerateWorksheetTwoPass.ts` (orchestrator)
- [x] `client/src/lib/validatorFeedbackRetry.ts` (retry loop)
- [x] `client/src/lib/__tests__/perSubjectPromptFamilies.test.ts`
- [ ] `promptAbFramework` wired into eval harness (`runner.ts` + `generators.ts`)
- [x] `selfConsistencySampler` wired onto Section 3 hot path (folded into orchestrator)

### PR-2 — `big-bang-7/pr-2-taxonomy-expansion`

Status: not started. See PHASE-PLAN.md PR-2 deliverables.

### PR-3 — `big-bang-7/pr-3-cadence-and-send-moat`

Status: not started. See PHASE-PLAN.md PR-3 deliverables.

### PR-4 — `big-bang-7/pr-4-source-and-scorecard`

Status: not started. See PHASE-PLAN.md PR-4 deliverables.

## Definition of done (each PR)

- [ ] CI passes (`npm test` + `tsc --noEmit` + `npm run eval:worksheets` if affected).
- [ ] Every checkbox in the PR's deliverables table in `PHASE-PLAN.md` is checked.
- [ ] This `SESSION-HANDOFF.md` updated — PR row flipped to "shipped (PR #NNN)" and "What is next" advanced.
- [ ] PR description references this folder by path so a reviewer sees the wider context.
- [ ] Branch is pushed; PR is open against `main`.

## Checkpoint protocol (mirrors phase-e)

After every chunk:

1. `git status` to confirm only intended files changed.
2. `git add <files>` (specific paths, never `git add .`).
3. `git commit -m "<scope>: <what changed>"` conventional-commit style.
4. `github_push_to_remote` to the current PR's branch.
5. Update this file's "What is done" + "What is next" sections in the same commit (or a follow-up if the chunk's diff is already large).

## Notes (transient scratchpad)

### Sprint 1 design — model-judge as second generator

The eval harness already has a `Generator` abstraction in
`generators.ts` with `mockGenerator` and `liveGenerator`. The
model-judge is naturally a **second generator slot** — same
abstraction, different responsibility (it consumes a worksheet and
emits axis scores instead of producing a worksheet from params).

To avoid the mental confusion of "two generators that aren't both
generators," the implementation uses a separate `Rater` interface in
`modelJudgeRater.ts`:

```ts
export interface Rater {
  name: string;
  estimatedCostUsd: number;
  rate(worksheet: PostValidatorWorksheet, fixture: EvalFixture): Promise<AxisScores>;
}
```

`runner.ts` picks both — `pickGenerator()` for fixture → worksheet,
`pickRater()` for worksheet → axis scores. Cost guard sums both.

Provider isolation: the rater MUST use a different provider than the
generator (per the user's spec — "Claude judging GPT output"). This is
enforced by checking `EVAL_JUDGE_PROVIDER !== EVAL_GENERATOR_PROVIDER`
at runtime; mismatch yields a runner warning but doesn't abort
(useful for local debugging).

### Sprint 3 design — two-pass generator as orchestrator, not rewrite

The current `aiGenerateWorksheet` is 3,167 lines. Inverting it
in-place would be a multi-thousand-line diff with a high regression
surface. Instead, Sprint 3 adds a **new orchestrator**
`aiGenerateWorksheetTwoPass.ts` that:

1. Calls a small skeleton-generation prompt (~1.5k tokens) returning
   `{ sections: [{ id, type, marks, specRef }] }`.
2. Calls existing prompts in parallel for each section (one fill call
   per section, scoped to ~500 tokens).
3. Reuses the entire post-validator chain unchanged.
4. Stamps `metadata.generatorVersion = "two-pass-1.0.0"` so eval and
   telemetry can see the path.

Wiring: `aiGenerateWorksheet` becomes a router. When
`WORKSHEET_TWO_PASS_ENABLED=1` (or the per-tenant flag from PR-22 of
big-bang-improvements is on), it delegates to the two-pass
orchestrator. Otherwise it runs the legacy path. The eval harness
runs both paths to prove no regression before flipping the default.

### Sprint 6 design — EHCP bridge is a NEW module

`ehcp-enhancements.ts` is for EHCP-document drafting (provision text,
golden-thread, tribunal scoring) — not worksheet generation. Sprint
6's "promote to first-class input" therefore means a new bridge
module `aiWorksheetEhcpBridge.ts` that adapts EHCP outcomes (text
strings) → generator-side instructions (additionalInstructions,
sendNeed, readingAge). The bridge is the integration point;
`ehcp-enhancements.ts` itself stays untouched.

### Context-limit recovery

If this chat hits a context limit mid-flight:

1. The next chat reads `RESUME.md` first, then this file.
2. The "What is in flight" section lists the exact file + line where
   work paused, plus what the next sub-step is.
3. The current PR's checklist in "Per-PR tracking" shows which boxes
   are ticked.
4. The chat resumes from the next un-ticked box; no re-exploration.

The file pin-points table above is the contract that makes
re-exploration unnecessary. Add a row whenever you discover a new
location worth pinning.
