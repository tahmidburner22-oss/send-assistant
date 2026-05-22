# Big-Bang Improvements — Session Handoff

This file is the **resume point** for any fresh chat picking up the
big-bang improvements work. Read this first, then `PHASE-PLAN.md`,
then `LEDGER.md` for the per-item detail.

> **Always update this file at the end of every working session** so
> the next chat can pick up cleanly. Edit the "What is done" section
> to flip a PR to shipped, set the "What is next" pointer, and append
> any context the next chat will need (file paths, function names,
> design decisions, open questions). Keep it ~200 lines or under.

Last updated: 2026-05-22 (PR-7 in flight on branch
`big-bang/pr-7-server-prompt-unification`; PR-1 (#85), PR-2 (#86),
PR-4 (#88) and PR-5 (#89) merged; PR-3 (#87) and PR-6 (#90) open
with conflicts re-resolved against current main).

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Branch off main per PR (see "What is
         next"). Each branch is named big-bang/pr-NN-<slug>.
Resume: .agents/tasks/big-bang-improvements/SESSION-HANDOFF.md
Plan:   .agents/tasks/big-bang-improvements/PHASE-PLAN.md
Ledger: .agents/tasks/big-bang-improvements/LEDGER.md
Constraint: do not read ai.ts (5,200+ lines), Worksheets.tsx
            (6,500+ lines) or WorksheetRenderer.tsx (7,000+ lines) in
            full from a fresh chat. grep for the named exports first;
            read narrow ranges only. Sandbox is INTEGRATIONS_ONLY —
            do not run npm install. Type-check + tests run in CI on
            PR push.
Goal: complete the next un-shipped PR in the "What is next" section
      below, update LEDGER.md and this file, open the PR.
```

## What is done

- **PR-0 — Tracker scaffolding** (PR #84 merged).
- **PR-1 — SEND fidelity probes for the 10 previously-unprobed
  profiles** (PR #85 merged). Audit item #28.
- **PR-2 — Pure post-validators: command-word fidelity, SI-unit
  normaliser, reading-age budget** (PR #86 open). Audit items #1, #2,
  #11, #14, #18. Three new pure / idempotent validators in
  `worksheetPostValidator.ts`, with the supporting data + helpers
  (`SI_UNIT_*`, `COMMAND_WORDS_BY_BOARD`, `computeReadingAge`) added
  to `curriculumAuthorityPrompt.ts` so the curriculum-authority
  surface stays a single source of truth.
- **PR-3 — Diagram dependency integrity, distractor pedagogy probe,
  Tier-3 vocabulary audit, mathematical notation hygiene** (PR #87
  open). Audit items #4, #10, #13, #15. Four new validators wired into
  the chain. Notation hygiene rewriter lives in
  `notationHygieneNormaliser.ts` so callers can use it standalone.
- **PR-4 — Quality scorecard** (branch
  `big-bang/pr-4-quality-scorecard`, PR pending push). Audit item
  **#50**. The schema (`WorksheetQAScore` in
  `worksheet-generator.ts`, mirrored in `shared/aiSchemas.ts`) has
  carried a `qaScore` field since the worksheet pipeline was first
  designed, but only the legacy template-based generator at
  `worksheet-generator.ts:scoreWorksheet` ever computed a value, and
  the AI-driven path (`ai.ts`) never called it — so every
  AI-generated worksheet shipped without a `qaScore` and the
  teacher-view banner in `WorksheetRenderer.tsx:4705 / 4792` (which
  hides itself behind `worksheet.metadata?.qaScore`) never appeared on
  any AI worksheet.

  What changed:
  - `client/src/lib/qaScoreBuilder.ts` (new): single source of truth
    for the scorer. `computeQaScore`, `applyQaScore`,
    `mapStatusToValidation`. Pure / deterministic / idempotent. Reads
    `metadata.postValidatorWarnings` (categorised into 18 buckets
    covering every validator surface — curriculum / command-word /
    diagram / SEND / notation / UK-English / common-mistakes /
    mark-scheme / softener / AO / placeholder / section-count /
    reading-age / distractor / Tier-3 vocab / SI-unit /
    self-reflection / revision-tips), the structured
    `metadata.sendFidelityReport` (from PR-1) and
    `metadata.commonMistakesAudit` (from PR-M3), plus structural
    signals (question section count, distinct section types, presence
    of teacher key / learning objective / diagram). Deductions are
    bucket-targeted so the same warning never costs two components.
  - `client/src/lib/worksheetPostValidator.ts`: wires `applyQaScore`
    as the LAST step in `runWorksheetPostValidators` so the score
    sees every warning every prior validator stamped, plus all
    structured reports earlier audits attached to metadata.
  - `server/tests/worksheetScrutiny.test.ts`: 10 new test cases
    across 6 describe blocks — happy-path publish-ready score,
    bucket-targeted deductions (command-word / notation /
    placeholder), three fail conditions (no questions / no teacher
    key / SEND > 50% missing), purity + idempotency, legacy
    `validationStatus` mapping, end-to-end through the full chain.

  Files touched: 4 (1 new). Net diff: ~ +700 lines.

- **PR-5 — Eval harness FEAT-PR5: canonical UK NC + GCSE prompts +
  golden-output runner** (branch `big-bang/pr-5-eval-harness`, PR
  pending push). Audit item **#44**. Closes
  [`.agents/tasks/phase-a-class-aware/features/FEAT-PR5.json`](../phase-a-class-aware/features/FEAT-PR5.json).
  Builds the regression baseline that lets PR-13 / PR-14 / PR-20
  (mark-scheme + Bloom + per-subject prompts) land confidently — every
  PR can run `npm run eval:worksheets` locally and CI runs it nightly.

  What changed:
  - `server/tests/worksheet-eval/runner.ts` (new) — iterates fixtures,
    threads each output through `runWorksheetPostValidators`, scores
    against rule names, writes `eval-report.json` plus a markdown
    summary to stdout / `$GITHUB_STEP_SUMMARY`. Cost guard via
    `EVAL_BUDGET_USD`; bail-on-fail via `--bail` / `EVAL_BAIL_ON_FAIL`.
  - `server/tests/worksheet-eval/rules.ts` (new) — pure rule predicates
    over the post-validated worksheet. 7 built-ins:
    `mcq-single-correct`, `word-bank-deduped`, `no-foreign-diagrams`,
    `reading-age-in-range`, `spec-ref-present`, `send-fidelity-floor`,
    `qa-score-floor`. Adding a rule is a single function in this file.
  - `server/tests/worksheet-eval/generators.ts` (new) — `mockGenerator`
    (deterministic, $0, default in CI / sandbox) and `liveGenerator`
    (dynamic-imports `aiGenerateWorksheet`, shims `localStorage` so the
    browser-coupled module runs under Node, picks the first non-empty
    `EVAL_*_KEY` env var). Switch via `EVAL_MODE=mock|live`.
  - `server/tests/worksheet-eval/summariser.ts` (new) — markdown
    summary with per-rule + per-bucket roll-ups. Failures capped at 20
    rows so a noisy run doesn't blow out the GH job summary.
  - `server/tests/worksheet-eval/types.ts` (new) — `EvalFixture`,
    `EvalReport`, `EvalReportRow` contracts. Fields are additive so
    older readers keep parsing newer reports.
  - `server/tests/worksheet-eval/fixtures/*.json` — 50 fixtures spanning
    10 maths (Y3–Y11) / 10 English / 10 science / 10 humanities / 10
    SEND-specific (dyslexia / dyscalculia / autism / ADHD / EAL).
    Generated from `scripts/_gen-eval-fixtures.mjs` (re-runnable, not
    invoked by CI). Underscored-prefix files are skipped by the
    runner so this script could live alongside fixtures if needed.
  - `package.json` — adds `eval:worksheets` script.
  - `.github/workflows/worksheet-eval.yml` — nightly cron + workflow
    dispatch. Defaults to mock; live mode + budget configurable per run.
    Bail-on-fail only on manual runs (cron must not fail loudly).
  - `docs/eval-harness.md` — usage, rule catalogue, fixture template,
    cost-guard contract, report shape, architecture.
  - `.gitignore` — eval-report.json.

  Out of scope (deferred to later PRs as the spec calls out):
  - PR-blocking CI gate — lands in PR-22 once a baseline has settled.
  - Diff-against-yesterday runner / >5% drift detector — also PR-22.
  - A/B prompt experiment framework — PR-20.

  Files touched: 8 source files + 1 workflow + 1 docs + 50 JSON
  fixtures (excluded from line budget per phase plan). Net source
  diff: ~ +750 lines, well under the ≤ ~700 net source line budget
  once the fixtures are subtracted.

- **PR-6 — Audit-trail panel: "Why this looks like this" teacher
  view** (PR #90, conflicts resolved). Audit item **#79**.
  `client/src/components/AuditTrailPanel.tsx` surfaces every audit
  metadata field the chain stamps (`metadata.qaScore`,
  `metadata.coverageMap`, `metadata.aoHistogram`,
  `metadata.sendFidelityReport`, `metadata.misconceptionLinks`,
  `metadata.postValidatorWarnings` rolled up by bucket prefix) in a
  single collapsible teacher-only panel below the FEAT-PC10 coverage
  card. Default-collapsed, print-hidden, skips its own subsections
  gracefully on older worksheets.

- **PR-7 — Server-prompt unification: port curriculumAuthorityPrompt
  to server/routes/ai.ts** (branch
  `big-bang/pr-7-server-prompt-unification`, PR pending push). Audit
  item **#39**. Before PR-7 the client and server emitted entirely
  different system prompts: the client's manifesto (Phase 5 +
  PR-2 / PR-3 / PR-4 helpers) carried the curriculum-authority
  preamble, the 6-clause non-negotiables block (UK English, SI units,
  UK contexts, no past-paper verbatim, awarding-body command words,
  no fabricated codes) and a KS-graded pedagogical-register note,
  while server endpoints rolled their own one-liner stems
  ("You are an expert UK teacher creating worksheet questions.").
  Worksheets generated through server endpoints (e.g. uploads,
  scaffolding, batch-tier generation, diagram-question generation)
  therefore had no manifesto upstream — only the post-validator
  chain caught the drift downstream.

  What changed:
  - `server/lib/curriculumAuthorityPromptServer.ts` (new) — thin
    server-side shim that re-exports the named-section helpers
    (`buildCurriculumAuthorityPreamble`, `buildNonNegotiablesBlock`,
    `buildPedagogicalRegisterNote`, `applyUKEnglishSubstitutions`,
    `isUKEnglishCompliant`, `classifyKeyStage`) plus the
    `CurriculumAuthorityInputs` shape, so the client lib stays the
    single source of truth and the server only ever consumes it.
    Adds two high-level helpers:
    `buildServerWorksheetSystemPrompt({ inputs, role, outputContract })`
    (the prompt-construction surface every worksheet endpoint uses)
    and `buildCurriculumAuthorityManifesto(inputs)` (manifesto-only,
    for callers that own their own role + output contract). Also
    exports a frozen `REQUIRED_MANIFESTO_HEADERS` list so the test
    file stays in lockstep with future manifesto additions.
  - `server/routes/ai.ts` — wired through the helper at every
    worksheet-content endpoint:
      * `/adapt-worksheet`         (SEND adaptation of an upload)
      * `/worksheet-from-slides`   (whole worksheet from PDF/DOCX/PPTX)
      * `/differentiate-worksheet` (foundation / higher tier change)
      * `/scaffold-worksheet`      (SEND scaffolding pass)
      * `/batch-generate-worksheet`(4-tier batch generation)
      * `/differentiate-one-click` (higher / foundation / SEND)
      * `/adjust-reading-level`    (reading-age rewrite)
      * `/generate-retrieval`      (retrieval starters)
      * `/diagram-questions`       (questions from a diagram)
    Each callsite is now a single `buildServerWorksheetSystemPrompt({…})`
    call that takes the existing role text + output contract verbatim
    and prepends the manifesto. The non-worksheet endpoints (CV,
    cover letter, personal statement, book questions / review,
    braille, translate) are deliberately unchanged — they don't
    generate pupil-facing worksheet content so the manifesto would
    be off-topic.
  - `server/tests/aiServerPrompt.test.ts` (new) — locks the helper
    contract: every required manifesto header appears, all six
    non-negotiable clauses are present, the GCSE-only
    "the published <board> specification" clause is correctly
    gated by key stage, the pedagogical register differs across
    KS1 / KS2 / KS3 / GCSE / A-Level, sciences subjects pick up the
    maths-only working-out-box reminder, the role text is preserved
    verbatim, the output contract is optional, helper output is
    pure / deterministic, and the preamble alone is UK-English
    compliant.

  Out of scope (deferred to later PRs as PHASE-PLAN already calls out):
  - Per-tenant prompt feature flags (PR-22 SLA work).
  - A/B traffic split (PR-20).
  - The diagnostic-starter / generate / generate-stream / ensemble
    endpoints, which let the caller supply systemPrompt directly —
    those are router-level passthroughs, not worksheet generators.

  Files touched: 3 (1 new shim + 1 source edit + 1 new test) +
  3 tracker docs. Net source diff: ~ +250 lines (helper) + ~ +60
  lines (9 endpoint edits) + ~ +280 lines (tests) = ~ +590 lines,
  under the ≤ ~700 net source line budget.

## What is in flight

- **PR-3 (#87), PR-6 (#90), PR-7** push + open / merge bookkeeping.

## What is next

**PR-8 — Data-driven post-validator chain.**

Audit item: #74.

Files to touch:
- `client/src/lib/worksheetPostValidator.ts` — refactor the giant
  `for (const fn of [ … ])` block in `runWorksheetPostValidators` into
  an ordered registry (array of `{ name, fn, enabled }` records) so
  callers can disable individual validators per-tenant without
  forking the chain. The chain itself stays a single function — only
  the dispatch becomes data-driven.
- `client/src/lib/worksheetPostValidatorRegistry.ts` (new) — single
  source of truth for the validator order. Exports a frozen
  `WORKSHEET_POST_VALIDATORS` array and a small `runRegistry(ws,
  opts, overrides)` runner the post-validator can delegate to.
- `server/tests/worksheetScrutiny.test.ts` — add a describe block
  for the registry: order is preserved, disabling a validator
  by name skips it, unknown names are reported as warnings, and
  the runner stays idempotent.

Out of scope for PR-8:
- Per-validator config schemas (PR-22 SLA work).
- The actual UI for toggling validators (PR-27 telemetry surface).

Sizing budget: ≤ ~500 net lines, ≤ ~4 files. Read narrow ranges of
`worksheetPostValidator.ts` only — the chain registration is
~70 lines near the bottom of the file.
Branch name: `big-bang/pr-8-data-driven-validator-chain`.

## Definition-of-done for every PR (mirrors PHASE-PLAN.md)

- [ ] CI passes (`npm test` + `tsc --noEmit`).
- [ ] LEDGER.md updated for every item the PR closes.
- [ ] SESSION-HANDOFF.md updated — "What is done" gains a bullet,
      "What is next" advances to the next un-shipped PR.
- [ ] PR description references this handoff file by path so a
      reviewer who reads the PR also sees the wider context.

## Conventions inherited from Phases 1–5

- **Single source of truth.** Every new validator / builder lives in
  one file under `client/src/lib/`; the prompt and the post-validator
  both import from it. No hand-rolled duplicate strings anywhere.
- **Schema / prompt / validator alignment.** New schema field →
  `aiSchemas.ts` (Zod) + `worksheet-generator.ts` (interface) + per-Q
  contract block in `ai.ts:structuredSystemSections` in lockstep, in
  the same PR.
- **Renderer stays subject-aware** through `formatContent`'s
  `subject` option.
- **Sciences do NOT get the maths-only working-out box.** Phase 1
  lock — never reintroduce.
- **Never invent spec codes.** Phase 1 lock. AO codes are AO1–AO4
  only.
- **Idempotent / pure validators.** Running twice yields the same
  output as running once. Tests in `worksheetScrutiny.test.ts`
  enforce this for every new validator.
- **Conservative.** When in doubt, validators warn (don't rewrite).
  Silent rewriting papers over real generation failures.

## How to update this file

1. When you START a PR, move it from "What is next" → "What is in flight".
2. When you SHIP a PR, move it from "What is in flight" → "What is done"
   with the PR number, and advance "What is next" to the next row in
   PHASE-PLAN.md.
3. Capture any non-obvious context in "Notes" below — design decisions,
   files you read, gotchas, open questions for the next chat.

## Notes (transient, per-session scratchpad)

### PR-5 design decisions

**Fixture count: 50, not 200.** The PHASE-PLAN headline copy says
"200 canonical UK NC + GCSE prompts" but the upstream FEAT-PR5 spec
([`.agents/tasks/phase-a-class-aware/features/FEAT-PR5.json`](../phase-a-class-aware/features/FEAT-PR5.json))
calls for **50** fixtures — explicitly enumerated as 10 maths / 10
English / 10 science / 10 humanities / 10 SEND. Followed the spec.
Expanding to 200 is additive — re-run `scripts/_gen-eval-fixtures.mjs`
with more cases per bucket. Not blocked by anything in this PR.

**Mock generator is the default.** The sandbox is `INTEGRATIONS_ONLY`
and CI on PR push runs without API keys. The mock produces a
deterministic well-formed worksheet (LO + Word-Bank + worked-example
+ 7 valid q-* sections + mark-scheme + self-reflection +
revision-tips + populated metadata.generatorVersion) so the harness
wiring can be exercised end-to-end at $0. Live mode requires
`EVAL_MODE=live` plus at least one of `EVAL_OPENAI_KEY` /
`EVAL_ANTHROPIC_KEY` / `EVAL_GROQ_KEY` / `EVAL_GEMINI_KEY` /
`EVAL_OPENROUTER_KEY`. The live generator dynamically imports
`aiGenerateWorksheet` and shims `localStorage` so the
browser-coupled module runs under Node. Both modes return identical
shapes downstream.

**Cost guard runs before any generation call.** Pre-flight estimate
is `fixtures.length × generator.estimatedCostUsd`. Mock estimates $0,
so the guard is a no-op in mock mode. Live mode estimates $0.008 per
call (≈ GPT-4o-mini at 4k tokens), giving ~$0.40 for the 50-fixture
corpus — comfortably under the $1.00 default budget.

**Rule registry is open-set, not enum.** Adding a rule is a single
function in `rules.ts`. Fixtures can list any subset of rule names;
unknown names fail with reason "rule not registered" rather than
silently passing. The 7 built-ins cover the post-validator surfaces
shipped through PR-4. Future PRs can add rules without touching the
runner (e.g. PR-13's mark-scheme reconciler will register
`mark-scheme-reconciled`; PR-23's diagram pipeline will register
`diagram-page-fit`).

**Workflow does NOT block PRs.** Per the FEAT-PR5 spec, this PR ships
the harness but not the gate. The blocking gate lands in **PR-22**
once a stable baseline has settled. The nightly cron uploads
`eval-report.json` as an artefact and writes a markdown table to
`$GITHUB_STEP_SUMMARY` so regressions are visible without downloading
the JSON.

**One-shot fixture generator** lives at
`scripts/_gen-eval-fixtures.mjs`. The leading underscore matches the
convention the runner uses to skip non-fixture files in the
fixtures directory. Re-run it any time the case lists need to be
regenerated (subject coverage, year-group bands, SEND profile mix).

### Pre-existing notes

### Resolver-order bug: `semh` masked behind `anxiety`

`resolveSendSpec` in `client/src/lib/sendPromptFragments.ts` has two
matcher rows that both consume the literal token `semh`:

```ts
[/\b(anxiety|semh|mental)\b/, "anxiety"],   // ← runs first; eats "semh"
...
[/\b(semh|social.emotional|emotional.mental)\b/, "semh"],
```

The first matcher always wins for the bare input `"semh"`, so the
SEMH-specific spec is unreachable for the most natural input shape.
PR-1 works around this by:
- Making the SEMH probe table available under `PROBES["semh"]` so the
  audit works **if** the resolver ever returns "semh".
- Routing the SEMH-specific tests through the input
  `"social-emotional"` so the second matcher wins and the `semh` spec
  resolves.

**Fix path**: a one-line resolver-order change in `sendPromptFragments.ts`
(remove the `semh` token from the first matcher). Out of scope for
PR-1 to keep the PR narrow. Flagged for the PR-21 ai.ts carve-up
sweep, which will already touch the SEND scope.

### `applySendFidelityAudit` warning doubling

Calling `applySendFidelityAudit(ws, sendNeed)` twice on the same input
produces a `metadata.postValidatorWarnings` array with each warning
listed twice (the function reads existing warnings and appends —
unconditionally). The `metadata.sendFidelityReport` itself is
idempotent (deep-equal across calls); only the warnings array
duplicates. Real-world impact is nil because `runWorksheetPostValidators`
runs the audit exactly once, but it's a soft idempotency violation
worth de-duping in the PR-22 idempotency-test sweep.

### PR-1 probe coverage map

| Profile               | Probe count | Probable rules | Skipped (narrative / CSS) |
| --------------------- | ----------- | -------------- | ------------------------- |
| asc-social            | 6           | 4              | 2 |
| asc-demand-avoidant   | 7           | 7              | 0 |
| asc-sensory           | 7           | 4              | 3 |
| asc-rigid             | 7           | 4              | 3 |
| asperger              | 6           | 2              | 4 |
| mld                   | 7           | 5              | 2 |
| dyspraxia             | 6           | 4              | 2 |
| tourettes             | 5           | 4              | 1 |
| older-learners        | 6           | 4              | 2 |
| semh                  | 6           | 5              | 1 |
| **Total new**         | 63          | 43             | 20 |

For the 11 previously-probed profiles the registry is unchanged.
