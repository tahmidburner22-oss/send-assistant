# Big-Bang Improvements — Session Handoff

This file is the **resume point** for any fresh chat picking up the
big-bang improvements work. Read this first, then `PHASE-PLAN.md`,
then `LEDGER.md` for the per-item detail.

> **Always update this file at the end of every working session** so
> the next chat can pick up cleanly. Edit the "What is done" section
> to flip a PR to shipped, set the "What is next" pointer, and append
> any context the next chat will need (file paths, function names,
> design decisions, open questions). Keep it ~200 lines or under.

Last updated: 2026-05-22 (initial seed — no PRs shipped yet).

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo, branch big-bang-improvements
         (or sibling branches per PR — see "What is next" below).
Resume: .agents/tasks/big-bang-improvements/SESSION-HANDOFF.md
Plan:   .agents/tasks/big-bang-improvements/PHASE-PLAN.md
Ledger: .agents/tasks/big-bang-improvements/LEDGER.md
Constraint: do not read ai.ts (5,200+ lines), Worksheets.tsx
            (6,500+ lines) or WorksheetRenderer.tsx (7,000+ lines) in
            full from a fresh chat. grep for the named exports first;
            read narrow ranges only. Sandbox is INTEGRATIONS_ONLY —
            do not run npm install. Type-check + tests run in CI on
            PR push.
Goal: complete the next un-shipped PR in
      .agents/tasks/big-bang-improvements/SESSION-HANDOFF.md "What is
      next" section, update LEDGER.md and this file, open the PR.
```

## What is done

Nothing yet. This is the initial seed of the umbrella phase. The
master plan (`PHASE-PLAN.md`) and per-item ledger (`LEDGER.md`) are in
place; no implementation work has started.

## What is in flight

Nothing. Pick up "What is next" below.

## What is next

**PR-1 — Phase 4 follow-up: SEND fidelity probes for the 12 missing profiles.**

- Audit item: #28 (highest-leverage SEND change — we *say* every
  worksheet is SEND-adapted but cannot prove fidelity for 12 of the
  22 profiles).
- Files to touch:
  - `client/src/lib/sendFidelityAudit.ts` — extend the `PROBES` table.
    Today it covers `adhd`, `dyslexia`, `dyscalculia`, and a generic
    `asc` entry. Add deterministic probes (1 per `worksheetRules[]`
    entry) for each of: `asperger`, `asc-social`,
    `asc-demand-avoidant`, `asc-sensory`, `asc-rigid`, `mld`,
    `dyspraxia`, `tourettes`, `older-learners`, `semh`, `pda`,
    `working-memory`, `slcn`, `hi`, `vi`, `eal`, `anxiety`. Each probe
    returns one of `applied | missing | not-checked`. Where a rule is
    genuinely too narrative to fingerprint reliably, return
    `not-checked` (not `missing`) to avoid false alarms.
  - `client/src/lib/sendPromptFragments.ts` — DO NOT edit; the audit
    reads `worksheetRules[]` from there. If a rule's text drifts the
    probe will quietly fail; that's by design.
  - `server/tests/worksheetScrutiny.test.ts` — add a describe block
    `Phase 4 follow-up — SEND fidelity probes` that:
    - For each newly-probed profile, pass a happy-path worksheet and
      assert all probes return `applied`.
    - For each profile, pass a failing worksheet (rule violated) and
      assert at least one probe returns `missing`.
    - Cover the SEMH check-in midway-point probe specifically (it
      relies on counting `🌿 CHECK-IN` markers and the worksheet's
      question count).
- Sizing budget: ≤ ~700 net lines, ≤ ~6 files.
- Branch name: `big-bang/pr-1-send-fidelity-probes`.
- Tests to keep green: existing `Phase 4 — SEND content rules` and
  `Phase 4 follow-up — SEND fidelity probes (existing 4 profiles)`
  describe blocks. Do not change those probe regexes.
- After shipping: flip #28 to `shipped — PR #NN` in LEDGER.md, flip
  PR-1 to `shipped — PR #NN` in PHASE-PLAN.md, update this file's
  "What is next" pointer to PR-2.

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
   files you read, gotchas, open questions for the next chat. Don't
   let the file sprawl; archive stale notes to a per-PR notes file
   (`.agents/tasks/big-bang-improvements/notes/PR-NN.md`) when "Notes"
   exceeds ~30 lines.

## Notes (transient, per-session scratchpad)

(empty — populate as you work)
