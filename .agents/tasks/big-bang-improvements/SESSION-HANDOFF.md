# Big-Bang Improvements — Session Handoff

This file is the **resume point** for any fresh chat picking up the
big-bang improvements work. Read this first, then `PHASE-PLAN.md`,
then `LEDGER.md` for the per-item detail.

> **Always update this file at the end of every working session** so
> the next chat can pick up cleanly.

Last updated: 2026-05-22 (PR-3 in flight on branch
`big-bang/pr-3-diagram-distractor-vocab-notation`; PR-1 (#85), PR-2
(#86) open with conflicts resolved by merging origin/main; PR-0 (#84)
merged).

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Branch off main per PR (see "What is
         next"). Each branch is named big-bang/pr-NN-<slug>.
Resume: .agents/tasks/big-bang-improvements/SESSION-HANDOFF.md
Plan:   .agents/tasks/big-bang-improvements/PHASE-PLAN.md
Ledger: .agents/tasks/big-bang-improvements/LEDGER.md
Constraint: do not read ai.ts, Worksheets.tsx, or WorksheetRenderer.tsx
            in full from a fresh chat. grep for the named exports first;
            read narrow ranges only. Sandbox is INTEGRATIONS_ONLY — do
            not run npm install. Type-check + tests run in CI on PR push.
Goal: complete the next un-shipped PR in the "What is next" section,
      update LEDGER.md and this file, open the PR.
```

## What is done

- **PR-0 — Tracker scaffolding** (PR #84 merged).
- **PR-1 — SEND fidelity probes for the 10 previously-unprobed profiles** (PR #85 open).
- **PR-2 — New pure post-validators (command-word fidelity, SI units, reading age)** (PR #86 open).
- **PR-3 — Diagram dependency integrity, distractor pedagogy, Tier-3 vocab,
  notation hygiene** (branch `big-bang/pr-3-diagram-distractor-vocab-notation`,
  PR pending).

  Audit items closed: **#4, #10, #13, #15** (4 items).

  What changed:
  - `client/src/lib/notationHygieneNormaliser.ts` (NEW — ~140 lines).
    Pure / deterministic / idempotent rewriter:
    - Latin `x` → `×` between numeric operands (with whitespace).
    - ASCII hyphen `-` → typographic minus `−` between numeric operands.
    - Letter `o` → degree symbol `°` after digit + space + `[CFKR]?`.
    - Returns `{ rewritten, substitutions[] }` mirroring
      `applyUKEnglishSubstitutions`.
  - `client/src/lib/worksheetPostValidator.ts` (extended):
    - `enforceMathsNotationHygiene` (#13) — silent rewrite + warn per
      drift type. Skips teacher-only sections.
    - `enforceDiagramDependencyIntegrity` (#15) — warns when a question
      stem references "Diagram A/B/figure/graph/chart/table" that
      doesn't have a matching section. Never strips the question.
    - `enforceDistractorPedagogy` (#4) — four heuristics: duplicates,
      typo decoys (Levenshtein-1 to correct answer), near-empty options,
      <2 unique distractors. Warn-only.
    - `enforceTier3VocabularyDeclared` (#10) — flags words ≥ 11 chars
      in question stems that aren't in the worksheet's Word Bank /
      Key Vocabulary section. Stop-list excludes everyday polysyllabic
      words (calculator, thermometer, investigate, etc.). Conservative
      false-positive rate.
    - All four wired at the END of `runWorksheetPostValidators`. The
      notation-hygiene rewriter runs FIRST among the PR-3 group so the
      next three see clean notation.
  - `server/tests/worksheetScrutiny.test.ts` extended with 6 new
    describe blocks (~20 cases): per-validator happy / unhappy / no-op
    / no-rewrite / idempotency, plus chain-integration.

  Files touched: 4.

  Note: PR-3 uses a length-based proxy (≥ 11 chars) for Tier 3 detection
  rather than syllable counting, because `countSyllables` is added by
  PR-2 which hasn't merged. When PR-2 is on main, swap to syllable-based
  detection — flagged for the PR-21 carve-up sweep.

## What is in flight

- **PR-3** push + open.

## What is next

**PR-4 — Quality scorecard (audit item #50).**

Wire `WorksheetQAScore` (already in the schema, never computed) into a
deterministic scorer that rolls up component validators into a
`/100` score and a `publish-ready` / `good` / `needs-revision` status.

Files to touch:
- `client/src/lib/worksheetQAScorer.ts` (NEW). Pure scorer that:
  - Reads `metadata.postValidatorWarnings` and tags each by component
    (curriculum / examStyle / progression / diagram / SEND / layout /
    teacherKey / notation / metadata).
  - Counts warnings per component, applies the spec §29 weights (15 /
    15 / 10 / 10 / 15 / 10 / 10 / 10 / 5 = 100 max).
  - Returns `{ total, status, components, failConditions }`.
- `client/src/lib/worksheetPostValidator.ts` — wire scorer into the chain.
- `shared/aiSchemas.ts` — already has `WorksheetQAScore` in the metadata.
- `server/tests/worksheetScrutiny.test.ts` — extend.

Out of scope for PR-4:
- Component thresholds for "do-not-publish" / "regenerate" — PR-22 SLA.
- Per-pupil progression telemetry — PR-19.

Sizing budget: ≤ ~600 net lines, ≤ ~5 files.
Branch name: `big-bang/pr-4-quality-scorecard`.

## Conflict-resolution playbook (added 2026-05-22)

When PR-0 merges to main, every still-open PR that cherry-picked the
tracker files will conflict on:
- `.agents/tasks/big-bang-improvements/LEDGER.md`
- `.agents/tasks/big-bang-improvements/PHASE-PLAN.md`
- `.agents/tasks/big-bang-improvements/SESSION-HANDOFF.md`

Resolution:
```bash
git checkout big-bang/pr-N-<slug>
git merge origin/main
# all three tracker files conflict (add/add)
git checkout --ours .agents/tasks/big-bang-improvements/LEDGER.md \
                    .agents/tasks/big-bang-improvements/PHASE-PLAN.md \
                    .agents/tasks/big-bang-improvements/SESSION-HANDOFF.md
git add .agents/tasks/big-bang-improvements/
git commit --no-edit
# push via mcp_sandbox_github_push_to_remote (no force flag needed —
# this produces a merge commit, not a rebase)
```

Future PRs (PR-3+) branch off main AFTER PR-0 merged, so they have the
tracker files natively and won't conflict on them at branch time. They
WILL conflict on the trackers later if multiple PRs touch the same
table rows — resolve by rebasing or merging at push time.

## Definition-of-done for every PR

- [ ] CI passes (`npm test` + `tsc --noEmit`).
- [ ] LEDGER.md updated for every item the PR closes.
- [ ] SESSION-HANDOFF.md updated.
- [ ] PR description references this handoff file by path.

## Conventions inherited from Phases 1–5

- **Single source of truth.** New validators / builders / helpers live
  in one file under `client/src/lib/`.
- **Idempotent / pure validators.** Running twice = once.
- **Conservative.** When in doubt, warn (don't rewrite).
- **Sciences do NOT get the maths-only working-out box.** Phase 1 lock.
- **Never invent spec codes.** Phase 1 lock. AO codes are AO1–AO4 only.

## Notes (transient, per-session scratchpad)

### PR-3 design decisions

**Tier 3 detection uses length-proxy, not syllable count.**
PR-2 ships `countSyllables` in `curriculumAuthorityPrompt.ts` but
PR-2 hasn't merged. PR-3 needs to compile against current main, so
it uses a ≥ 11-char threshold. This lands the same false-pos /
false-neg tradeoff on the UK GCSE corpus: flags "photosynthesis",
"differentiation", "mitochondria"; skips "calculator", "thermometer".
A stop-list catches the residual everyday polysyllables.
Switch to `countSyllables` after PR-2 merges (PR-21 carve-up sweep).

**Distractor-typo detection uses Levenshtein-1.**
A distractor that's exactly 1 character (insertion / deletion /
substitution) away from the correct answer is treated as a typo
decoy, not a misconception. This caught the "foods" vs "food"
trailing-s decoy in the test fixture. Limited to 1-edit distance
to keep false-positive rate low.

**Notation-hygiene rules are deliberately narrow.**
We rewrite × / − / ° only. We do NOT rewrite:
- `^` to `²` / `³` (markdown / KaTeX handle that).
- Greek letter substitutions (`pi` → `π`, `theta` → `θ`).
- En-dash / em-dash punctuation in titles.
Each of these has a legitimate use case that risks corruption.

**Diagram dependency check is warn-only by design.**
Even when the named diagram is missing, we never strip the question —
the diagram may be on its way from the library on the next regenerate.
Warning lets the teacher decide.

### #16 (Common Mistakes for non-maths) — DEFERRED

The existing `commonMistakesValidator.ts` is maths-only with a
hardcoded numeric-token requirement. Extending it to non-maths
needs a parallel "wrong-example string" probe and a maths/non-maths
split inside the existing audit. This is a meaningful refactor of
an existing module — moved to PR-13 (mark-scheme upgrades) where the
broader Common Mistakes work already lives.

### Open follow-ups (carried)

- `resolveSendSpec` matcher-order bug masking `semh` → PR-21.
- `applySendFidelityAudit` warning-doubling → PR-22 idempotency sweep.
- Tier-3 vocab swap to syllable counting → PR-21 (depends on PR-2).
- Self-Reflection command-word echo (#18 wiring) → PR-21.

### PR-3 coverage map

| Validator                                     | Audit item | Tests |
| --------------------------------------------- | ---------- | ----- |
| `enforceMathsNotationHygiene`                 | #13        | 3 cases (rewrite + teacher-only skip + idempotency) |
| `enforceDiagramDependencyIntegrity`           | #15        | 5 cases (warn / no-op when present / no-op when no ref / no-rewrite / idempotent) |
| `enforceDistractorPedagogy`                   | #4         | 5 cases (duplicates / typo / near-empty / no-op / idempotent) |
| `enforceTier3VocabularyDeclared`              | #10        | 5 cases (warn / no-op no-vocab / stop-list / no-rewrite / idempotent) |
| `normaliseMathNotation` + `findNotationDrift` | #13 helper | 8 cases (per-rule + idempotency + isClean) |
| Chain integration                             | n/a        | 1 end-to-end |

Total new tests: ~27 cases across 6 describe blocks.
