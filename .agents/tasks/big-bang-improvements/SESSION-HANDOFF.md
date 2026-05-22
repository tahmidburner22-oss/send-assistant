# Big-Bang Improvements — Session Handoff

This file is the **resume point** for any fresh chat picking up the
big-bang improvements work. Read this first, then `PHASE-PLAN.md`,
then `LEDGER.md` for the per-item detail.

> **Always update this file at the end of every working session** so
> the next chat can pick up cleanly. Edit the "What is done" section
> to flip a PR to shipped, set the "What is next" pointer, and append
> any context the next chat will need (file paths, function names,
> design decisions, open questions). Keep it ~200 lines or under.

Last updated: 2026-05-22 (PR-1 in flight on branch
`big-bang/pr-1-send-fidelity-probes`; PR-0 merged into PR #84).

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

- **PR-0 — Tracker scaffolding** (PR #84, branch
  `big-bang/pr-0-tracker-scaffolding`).
  Created the umbrella `.agents/tasks/big-bang-improvements/` directory
  with `PHASE-PLAN.md`, `LEDGER.md`, and this `SESSION-HANDOFF.md`.
  Mirrors the existing Phase 1–5 / A–D convention.

- **PR-1 — SEND fidelity probes for the 10 previously-unprobed profiles**
  (branch `big-bang/pr-1-send-fidelity-probes`, PR pending push).

  Audit item: **#28**.

  What changed:
  - `client/src/lib/sendFidelityAudit.ts`: extended `PROBES` table with
    deterministic probe arrays for the 10 profiles previously in
    `NOT_PROBED_PROFILES`: `asc-social`, `asc-demand-avoidant`,
    `asc-sensory`, `asc-rigid`, `asperger`, `mld`, `dyspraxia`,
    `tourettes`, `older-learners`, `semh`. Each probe is high-precision
    (returns `not-checked` rather than `missing` for narrative rules
    that can't be fingerprinted reliably). `NOT_PROBED_PROFILES` is
    retained as an empty `Set<string>` for future profiles whose rules
    are genuinely all narrative.
  - Tightened the existing `asc-sensory` emoji probe regex to exclude
    the U+2600–27BF dingbats range (which contains the legitimate ✓
    MCQ tick marker — was a false-positive risk).
  - Tightened the SEMH demand-language probe to anchor "you must /
    need to / should" at start-of-sentence so it does not false-trigger
    on the legitimate "What you need to do:" header.
  - Same anchoring fix on the `asc-demand-avoidant` rule-1 probe.
  - `server/tests/worksheetScrutiny.test.ts`: appended a
    `Phase 4 follow-up — SEND fidelity probes` block with happy-path
    + at-least-one-violation tests per profile, an
    audit-covers-all-21-profiles parametric test, an idempotency
    guarantee, and a postValidatorWarnings accumulation test.

  Files touched: 2.
  Net diff: ~ +600 lines (mostly the test fixtures + 10 probe arrays).

## What is in flight

- **PR-1** push + open (next step: push branch, open PR, flip status to
  `shipped — PR #NN` in LEDGER.md and PHASE-PLAN.md when CI is green).

## What is next

**PR-2 — New pure post-validators: command-word fidelity, SI-unit
normaliser, reading-age budget.**

Audit items: #1, #2, #11, #14, #18.

Files to touch:
- `client/src/lib/curriculumAuthorityPrompt.ts` — extend with two
  exports: `SI_UNIT_SUBSTITUTIONS` (frozen list mirroring
  `UK_ENGLISH_SUBSTITUTIONS` shape) and `COMMAND_WORDS_BY_BOARD` (per
  awarding-body command-word lists, sourced from `pastPapers.ts`).
- `client/src/lib/worksheetPostValidator.ts` — three new pure /
  idempotent validators wired into the chain:
  - `enforceCommandWordFidelity` (audit #2): walks question sections;
    the leading verb of every stem must be on the named board's
    published command-word list. Warns when not.
  - `enforceSiUnitNormalisation` (audit #14): silent rewrite of
    `mph → km/h with conversion footnote`, `lbs → kg`, `°F → °C`,
    `inch / foot → cm / m`. Idempotent. Warning per rewrite.
  - `enforceReadingAgeBudget` (audit #1): computes Flesch-Kincaid per
    question stem and warns when actual reading age > declared
    `expectedReadingAge` + 1.5 years.
- `server/tests/worksheetScrutiny.test.ts` — extend with happy-path,
  unhappy-path, and idempotency tests for each.

Out of scope for PR-2:
- Fixing the `resolveSendSpec` matcher-order bug that masks `semh`
  behind `anxiety` — separate PR (target: PR-21 ai.ts carve-up,
  see "Notes" below).
- The `applySendFidelityAudit` warning-doubling on second invocation
  (running it twice currently appends the same warnings twice). Not
  a real-world bug because the chain runs the audit once, but the
  function isn't strictly idempotent on the warnings array. Note for
  PR-22 idempotency-test sweep.

Sizing budget: ≤ ~700 net lines, ≤ ~6 files.
Branch name: `big-bang/pr-2-pure-validators`.

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
