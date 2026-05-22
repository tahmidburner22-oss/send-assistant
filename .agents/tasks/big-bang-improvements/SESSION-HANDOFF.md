# Big-Bang Improvements — Session Handoff

This file is the **resume point** for any fresh chat picking up the
big-bang improvements work. Read this first, then `PHASE-PLAN.md`,
then `LEDGER.md` for the per-item detail.

> **Always update this file at the end of every working session** so
> the next chat can pick up cleanly. Edit the "What is done" section
> to flip a PR to shipped, set the "What is next" pointer, and append
> any context the next chat will need (file paths, function names,
> design decisions, open questions). Keep it ~200 lines or under.

Last updated: 2026-05-22 (PR-6 in flight on branch
`big-bang/pr-6-audit-trail-panel`; PR-1 (#85) and PR-4 (#88) merged;
PR-2 (#86), PR-3 (#87) and PR-5 (#89) open).

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
  golden-output runner** (PR #89). Audit item **#44**. Closes
  [`.agents/tasks/phase-a-class-aware/features/FEAT-PR5.json`](../phase-a-class-aware/features/FEAT-PR5.json).
  50 fixtures (10 maths / 10 English / 10 science / 10 humanities / 10
  SEND), 7 rule predicates over post-validator output + structured
  metadata, mock + live generator (live dynamic-imports
  `aiGenerateWorksheet` and shims `localStorage`), cost guard via
  `EVAL_BUDGET_USD`, nightly cron + workflow_dispatch in
  `.github/workflows/worksheet-eval.yml`. Does NOT block PRs — gate
  lands in PR-22.

- **PR-6 — Audit-trail panel: "Why this looks like this" teacher
  view** (branch `big-bang/pr-6-audit-trail-panel`, PR pending push).
  Audit item **#79**. Single consolidated read-only panel that
  surfaces the audit metadata the chain already stamps —
  `metadata.qaScore` (PR-4), `metadata.coverageMap` (FEAT-PC10),
  `metadata.aoHistogram` (Pillar A validator),
  `metadata.sendFidelityReport` (PR-1 / FEAT-PB6),
  `metadata.misconceptionLinks` (FEAT-PB7),
  `metadata.postValidatorWarnings` (rolled up by bucket prefix).

  What changed:
  - `client/src/components/AuditTrailPanel.tsx` (new) — self-contained
    component using a native `<details>` for collapse so it works
    without React state and is keyboard-accessible without extra
    ARIA. Default-collapsed, print-hidden via the existing
    `ws-no-print-on-student` class. Skips its own subsections
    gracefully when the metadata field they consume is absent — older
    worksheets keep rendering with blank tabs rather than erroring.
  - `client/src/components/WorksheetRenderer.tsx` — single-line wire-in
    below the FEAT-PC10 coverage card so all teacher-only audit
    surfaces sit together. Plus a pre-existing-bug fix: the QA-score
    badges at lines 4725 + 4810 read `qaScore.overallScore`, a field
    that was never stamped (canonical is `qaScore.total`); both
    badges were rendering `undefined%`. Now read `total ??
    overallScore ?? "—"` so the badge works for the first time on
    AI-generated worksheets.

  Out of scope (deferred):
  - Removing the per-feature teacher cards (FEAT-PB6 SEND fidelity
    card, FEAT-PC10 coverage card, FEAT-PB3 re-teach badge). These
    keep their place for at-a-glance reading; the audit-trail panel
    is additive — a one-stop deeper-dive a teacher can hand to a HoD
    or TA.
  - The Class-Pack visual diff (#31, folded into PR-6 in PHASE-PLAN)
    — only the panel scaffold ships in this PR; the diff visual is a
    follow-up note.
  - Per-tenant feature flags (PR-22).

  Files touched: 2 source files (1 new) + 3 tracker docs. Net source
  diff: ~ +570 lines.

## What is in flight

- **PR-2 (#86), PR-3 (#87), PR-5 (#89), PR-6** push + open / merge
  bookkeeping.

## What is next

**PR-7 — Server-prompt unification: port curriculumAuthorityPrompt to
server/routes/ai.ts.**

Audit item: #39.

Files to touch:
- `server/routes/ai.ts` — port the curriculum-authority prompt
  sections + Phase 5 manifesto from
  `client/src/lib/curriculumAuthorityPrompt.ts` so server-side AI
  calls use the same system prompt as the client-side path. Today
  server has its own legacy prompt; client and server have drifted.
- `server/lib/curriculumAuthorityPromptServer.ts` (new) — thin
  server-side shim that re-exports the named-section helpers from the
  shared client lib. Avoids forking the prompt; client stays the
  source of truth.
- `server/tests/aiServerPrompt.test.ts` (new) — pure assertion that
  the server-emitted system prompt contains every named section the
  client manifesto declares.

Out of scope for PR-7:
- Per-tenant prompt feature flags (PR-22 SLA work).
- A/B traffic split (PR-20).

Sizing budget: ≤ ~700 net lines, ≤ ~6 files. Sandbox is
INTEGRATIONS_ONLY; never run `npm install`. Read narrow ranges of
`server/routes/ai.ts` (1,000+ lines).
Branch name: `big-bang/pr-7-server-prompt-unification`.

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
