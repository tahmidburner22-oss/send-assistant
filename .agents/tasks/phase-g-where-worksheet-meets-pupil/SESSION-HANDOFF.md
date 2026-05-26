# Phase G — Session Handoff

This file is the **resume point** for any fresh chat picking up the
Phase G work. Read this first, then `PHASE-PLAN.md`, then
`LEDGER.md` for the per-item status, then the relevant
`features/FEAT-G*.json` for the spec of the work unit you're about
to ship.

> **Always update this file at the end of every working session** so
> the next chat can pick up cleanly. Edit the "What is done" section
> to flip a work unit to shipped, set the "What is next" pointer,
> and append any context the next chat will need (file paths,
> function names, design decisions, open questions). Keep it under
> ~250 lines.

Last updated: 2026-05-26 — Phase G planning PR opened with G18 / G19
/ G20 prework shipped (semh resolver, fidelity audit warning dedupe,
.bak file cleanup). 12 implementation work units (G1–G6, G9, G12–
G15, G17) remain.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Phase G = competitor-derived improvements
         (Twinkl + MathsGenie + Dr Frost + Save My Exams + Corbettmaths
         + TpT + Liveworksheets + Kahoot research). Branch:
         feat/phase-g-where-worksheet-meets-pupil OR per-work-unit branch
         feat/phase-g-<id>-<slug> if the team picks the split-PR
         fallback in PHASE-PLAN.md.
Resume:  .agents/tasks/phase-g-where-worksheet-meets-pupil/SESSION-HANDOFF.md
Plan:    .agents/tasks/phase-g-where-worksheet-meets-pupil/PHASE-PLAN.md
Ledger:  .agents/tasks/phase-g-where-worksheet-meets-pupil/LEDGER.md
Feats:   .agents/tasks/phase-g-where-worksheet-meets-pupil/features/FEAT-G*.json
Constraint: do not read ai.ts, Worksheets.tsx, WorksheetRenderer.tsx
            in full — grep `// §` first; read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install. Type-
            check + tests run in CI on PR push.
            scripts/check-no-bigfile-reads.mjs enforces the file-read
            ban from .agents/tasks/** + docs/**.
Goal: complete the next un-shipped row in "What is next" below, update
      LEDGER.md and this file, extend (or open) the combined PR.
```

## What is done

### G18 — `semh` resolver order fix (Tier 4 bug, prework)

**Source:** SESSION-HANDOFF "Pre-existing notes" section in
`.agents/tasks/big-bang-improvements/SESSION-HANDOFF.md` flagged this
as a one-line resolver-order change deferred from PR-1 to keep its
scope narrow.

**Fix:** removed `semh` from the anxiety regex at
`client/src/lib/sendPromptFragments.ts:940`. The dedicated SEMH
matcher at line ~949 (now 950 after my insertion) now wins for the
bare token "semh". The "mental" token stays with anxiety because
mental-health language is anxiety territory.

**Tests added** in `server/tests/worksheetScrutiny.test.ts`:
- "Phase G prework — resolveSendSpec routes bare 'semh' to the SEMH
  spec" (3 cases)
- "Phase G prework — semh fidelity audit works for the bare token"
  (1 case)

**Backwards compatibility:** `social-emotional`, `emotional-mental`
and other compound forms still resolve to the SEMH spec. The
existing tests at line 3198 of the test file (which use
`social-emotional` as a workaround) continue to pass. The existing
test at line 252 (which expects SEMH content rules) now finds them
via the correct route — both anxiety and SEMH specs happen to
contain the matching phrases so the assertion held under the bug
too, but is now semantically correct.

### G19 — `applySendFidelityAudit` warning idempotency (Tier 4 bug, prework)

**Source:** SESSION-HANDOFF "Pre-existing notes" section flagged
this as a soft idempotency violation: calling the function twice
produced a `metadata.postValidatorWarnings` array with each warning
listed twice. The `metadata.sendFidelityReport` itself was already
idempotent (deep-equal across calls); only the warnings array
duplicated.

**Fix:** in `client/src/lib/sendFidelityAudit.ts`, replaced the
unconditional `[...existingWarnings, ...finalReport.warnings]` merge
with a `Set`-based dedupe loop that preserves order and drops string-
equal duplicates. The fix is purely additive — first-call behaviour
is unchanged.

**Tests added** in `server/tests/worksheetScrutiny.test.ts`:
- "Phase G prework — applySendFidelityAudit dedupes warnings on the
  second call" (2 cases — covers no-pre-existing-warnings and the
  pre-existing-warning-preserved case).

### G20 — Delete `WorksheetRenderer.tsx.bak` (Tier 4 cleanup, prework)

**Source:** Repo audit found the 287KB `.bak` file at
`client/src/components/WorksheetRenderer.tsx.bak`. No reference in
the codebase, no entry in `.gitignore` covered it (`.gitignore` lists
`node_modules/`, `data/`, `.env`, etc.).

**Fix:** deleted the file. CI will fail if anything imports from a
`.bak` path (none did at audit time).

## What is in flight

(None yet — Phase G implementation has not started. The 12
implementation work units remain in "What is next".)

## What is next

Pick the next un-shipped work unit. Recommended order respects the
dependency graph in `PHASE-PLAN.md`:

1. **G3 — Lesson-archetype templates** (M, no deps). Highest user-
   visible win; unblocks template-driven generation that G4 / G5
   slot into.
2. **G4 — Procedural activity types** (M, no deps). Unlocks
   wordsearch / crossword / matching / cloze section types so G3
   templates can include them. Pure deterministic generators, no
   LLM dependency.
3. **G14 — Parent letter / homework cover note** (S, depends on
   `ai.ts`). Independent surface; ships easily once the
   archetype + activity-type schema lands.
4. **G6 — Predicted-paper builder** (S, depends on
   `pastPaperFrequencyAnchor.ts`). UI surface over already-shipped
   PR-19 logic.
5. **G5 — 5-a-day daily-drill builder** (S, depends on
   `unitPack.ts`). Mirrors G6's pattern — bank-driven, no LLM.
6. **G2 — Another one like this** (S, depends on
   `curriculumBank.ts`). Ships with a lightweight `ai.ts`
   extension; preview surface in WorksheetRenderer.tsx.
7. **G9 — Three-tier ability differentiation** (S, depends on
   `aiDifferentiateExistingWorksheet`). Three concurrent calls; UI
   tabbed preview.
8. **G12 — Teacher-only answer-key separate page** (XS, depends on
   `pdf-generator-v2.ts` + `printPresets.ts`).
9. **G15 — Drag-handle section reorder** (S, depends on
   `Worksheets.tsx`).
10. **G17 — Worksheet favourites speed-dial** (S, depends on
    `worksheetLibrary.ts` + AppContext).
11. **G13 — Per-question timer** (S, **depends on G1**).
12. **G1 — Pupil-facing auto-marking** (M, no deps but is the
    highest-impact). Recommend last because G13 builds on it and
    Phase H's pupil progress dashboard (H1) depends on G1's data
    flow.

If the team picks the split-PR fallback, the dependency-respecting
PR boundaries are documented in `PHASE-PLAN.md` Branch + PR strategy.

## Definition-of-done (per work unit)

- [ ] Schema additions (if any) are **additive** — older
      worksheets continue to validate against `shared/aiSchemas.ts`.
- [ ] Validators / builders / helpers are **pure / idempotent /
      conservative**.
- [ ] Targeted vitest cases for every public function. For
      validator-shape work, regression case in
      `server/tests/worksheetScrutiny.test.ts`.
- [ ] CI passes (`npm run check` + `npm test`).
- [ ] LEDGER.md updated with the work unit's status flipped to
      `shipped — commit <SHA>`.
- [ ] SESSION-HANDOFF.md updated — "What is done" gains a bullet,
      "What is next" advances.
- [ ] PR commit message references this handoff file by path.

## Files-of-interest map (for the next chat)

| Concern                                  | Anchor file                                                     |
| ---------------------------------------- | --------------------------------------------------------------- |
| Worksheet schema (Zod)                   | `shared/aiSchemas.ts:42–110` (WorksheetSectionSchema)           |
| Main generator entry                     | `client/src/lib/ai.ts:817` (§GENERATE)                          |
| Server `/generate` route                 | `server/routes/ai.ts:652–870`                                   |
| Server `/differentiate-worksheet`        | `server/routes/ai.ts:2568–2742`                                 |
| Server `/scaffold-worksheet`             | `server/routes/ai.ts:2745–3192`                                 |
| Worksheets page (form + handlers)        | `client/src/pages/Worksheets.tsx:1209` (§HANDLE-GENERATE)       |
| Worksheet renderer                       | `client/src/components/WorksheetRenderer.tsx` (grep `// §`)     |
| Companion app (G1 / G13)                 | `client/src/pages/companion/[token].tsx`                        |
| Curriculum bank                          | `client/src/lib/curriculumBank.ts:1–489`                        |
| Past-paper frequency anchor (G6)         | `client/src/lib/pastPaperFrequencyAnchor.ts`                    |
| Class Pack (referenced by H10)           | `client/src/lib/class-pack.ts:35–80`                            |
| Unit Pack (G5 base)                      | `client/src/lib/unitPack.ts:28–80`                              |
| Send-to handoff (G14, G17)               | `client/src/components/SendToMenu.tsx:23–55`                    |
| Print presets (G12)                      | `client/src/lib/printPresets.ts`                                |
| Validator chain (the registry)           | `client/src/lib/worksheetPostValidatorRegistry.ts:178–298`      |
| Hint ladder (G1)                         | `client/src/lib/hint-ladder.ts`                                 |
| Maths verifier (G1 numeric branch)       | `client/src/lib/mathsVerifier.ts`                               |
| Mark-scheme synonyms (G1 short-text)     | `client/src/lib/markSchemeUpgrades.ts`                          |
| MisconceptionLinks reader (G1 wrong-answer feedback) | `client/src/lib/misconception-bank.ts` + `metadata.misconceptionLinks` (FEAT-PB7) |

## Notes (transient, per-session scratchpad)

### Why this Phase exists

The send-assistant generator already wins on **rigour** — the 30-
validator post-chain (`worksheetPostValidatorRegistry.ts`),
curriculum-bank-backed differentiation (Phase F), SEND fidelity audit
across 21 profiles, fact-checker, maths CAS verifier and bias /
sensitivity audit collectively close the failure modes that competitor
reviews flag (TpT 70%+ low-quality content, AI-worksheet generic-
output complaints, off-curriculum mismatches, mark-scheme errors).

What competitors that send-assistant doesn't yet match is
**interactivity** (Dr Frost / Liveworksheets pupil-typeable
auto-marking; Save My Exams unlimited-practice regen) and **template-
led ergonomics** (Twinkl PlanIt lesson archetypes; Corbettmaths 5-a-
day; MathsGenie predicted papers; TpT filing-cabinet favourites).
Phase G closes that gap.

### Estimated total diff if all shipped as one combined PR

~3,500 LoC of net source code across ~30 files, mirroring the
PR #102 (PR-10..18 combined) and PR-19..27 combined precedents. CI
runtime ~+5 min for the new test cases.

### Items that are NOT in Phase G

The competitor research surfaced 7 features that are higher-effort
and / or depend on Phase G work landing first. They are tracked in
`.agents/tasks/phase-h-pupil-journey-and-gamification/`:
- H1 / G7 — pupil progress dashboard with skill mastery heatmap
- H2 / G8 — curriculum-architect-style year planner
- H3 / G10 — real-world context library
- H4 / G11 — cross-pupil leaderboards / streaks / badges
- H5 / G16 — voice-input for the worksheet brief
- H6 — telemetry admin dashboard hydration
- H7 — production corpus loaders
- H8 — activate dark env flags
- H9 — multi-step worked-example interactive walkthrough
- H10 — wrong-answer aggregate → re-teach pack
- H11 — per-question try-harder / try-easier tier-shift
- H12 — spaced-repetition for 5-a-day (Leitner / SM-2)

PR-28 (LMS push, MIS roster, share-sheet, browser extension, weekly
emails) remains genuinely deferred until external credentials land.

## How to update this file

1. When you START a work unit, move it from "What is next" → "What
   is in flight" and add a one-paragraph plan summary.
2. When you SHIP a work unit, move it from "What is in flight" →
   "What is done" with the commit SHA, advance "What is next" to
   the next un-shipped row in PHASE-PLAN.md.
3. Capture any non-obvious context in "Notes" — design decisions,
   files you read, gotchas, open questions for the next chat.
