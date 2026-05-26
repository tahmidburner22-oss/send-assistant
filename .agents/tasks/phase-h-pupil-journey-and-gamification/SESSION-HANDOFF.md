# Phase H — Session Handoff

This file is the **resume point** for any fresh chat picking up the
Phase H work. Read this first, then `PHASE-PLAN.md`, then
`LEDGER.md`, then the relevant `features/FEAT-H*.json` for the spec
of the work unit.

> **Always update this file at the end of every working session.**
> Edit "What is done" / "What is next" so the next chat picks up
> cleanly. Keep under ~250 lines.

Last updated: 2026-05-26 — Phase H planning files created. No work
unit started. Phase G must ship first for H1 / H4 / H9 / H10 / H11 /
H12. H2 / H3 / H5 / H6 / H7 / H8 can ship in parallel with Phase G.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Phase H = Tier 2/3 follow-ups + telemetry
         hydration + dark-flag activation. Branch:
         feat/phase-h-pupil-journey-and-gamification (combined) OR
         per-work-unit / per-PR-letter branch.
Resume:  .agents/tasks/phase-h-pupil-journey-and-gamification/SESSION-HANDOFF.md
Plan:    .agents/tasks/phase-h-pupil-journey-and-gamification/PHASE-PLAN.md
Ledger:  .agents/tasks/phase-h-pupil-journey-and-gamification/LEDGER.md
Feats:   .agents/tasks/phase-h-pupil-journey-and-gamification/features/FEAT-H*.json
Constraint: same big-file constraints as Phase G — grep `// §` first,
            do not read ai.ts / Worksheets.tsx / WorksheetRenderer.tsx
            in full. Sandbox is INTEGRATIONS_ONLY. CI runs the suite on
            PR push. scripts/check-no-bigfile-reads.mjs enforces.
            Phase G dependency: H1 / H4 / H9 / H10 / H11 / H12 require
            G1's companion-answer-log to exist.
Goal: complete the next un-shipped row, update LEDGER + this file,
      extend (or open) the combined PR.
```

## What is done

(Empty — no Phase H work has shipped yet.)

## What is in flight

(Empty — no work unit started.)

## What is next

Pick the next un-shipped work unit. Recommended order:

**Block A — G-independent (can ship in parallel with Phase G):**
1. **H6 — Telemetry admin dashboard hydration** (S, no deps).
   Lowest-risk; just wires existing aggregators to existing UI.
2. **H7 — Production corpus loaders** (M, no deps). Closes three
   PR-19..27 follow-up rows; unlocks G6's bundled predicted-paper
   corpus for live updates.
3. **H8 — Activate dark env flags** (S, no deps but needs eval-
   harness baseline). Per-flag, per-tenant rollout.
4. **H5 — Voice-input for the worksheet brief** (S, no deps).
   Frontend-only Web Speech API wrapper.
5. **H3 — Real-world context library** (S, no deps). Pure data +
   one prompt-block extension.
6. **H2 — Curriculum-architect-style year planner** (L, no deps).
   Largest UI build in Phase H; drag-drop year-view over the
   existing topic-bank.

**Block B — depends on Phase G:**
7. **H1 — Pupil progress dashboard** (M, depends G1). Server-side
   persistence + per-pupil-per-class roll-up.
8. **H10 — Wrong-answer aggregate → re-teach pack** (M, depends G1).
   Reuses reteachPlanner; new aggregator over the answer-log.
9. **H11 — Try-harder / try-easier tier-shift** (S, depends G1 +
   G2). Two buttons in the companion app; reuses G2's surface with
   a tier-shifted bias.
10. **H12 — Spaced-repetition for 5-a-day** (S, depends G1 + G5).
    Leitner-box scheduler.
11. **H9 — Multi-step worked-example walkthrough** (M, depends G1).
    Companion-app extension.
12. **H4 — Cross-pupil leaderboards / streaks / badges** (M,
    depends G1 + H1). Reads H1's pupil_attempt rows.

## Definition-of-done

Same as Phase G. See
`.agents/tasks/phase-g-where-worksheet-meets-pupil/PHASE-PLAN.md`
"Definition-of-done".

## Files-of-interest map (for the next chat)

| Concern                                  | Anchor file                                                 |
| ---------------------------------------- | ----------------------------------------------------------- |
| Companion-app answer log (H1, H4, H9, H10, H11, H12) | client/src/lib/companion-answer-log.ts (created by G1) |
| Per-attempt persistence (H1)             | client/src/lib/attemptLog.ts + new `pupil_attempt` table    |
| Telemetry aggregators (H6)               | client/src/lib/telemetryAggregators.ts                      |
| Telemetry admin page (H6)                | client/src/pages/admin/telemetry.tsx                        |
| Subject vocab audit (H7 corpus)          | client/src/lib/spVocabularyLibraryAudit.ts                  |
| Citation factual layer (H7 + H8)         | client/src/lib/citationGroundedFactual.ts                   |
| Past-paper frequency anchor (H7 corpus)  | client/src/lib/pastPaperFrequencyAnchor.ts                  |
| Prompt A-B framework (H8)                | client/src/lib/promptAbFramework.ts                         |
| Per-subject prompt families (H8)         | client/src/lib/perSubjectPromptFamilies.ts                  |
| Self-consistency sampler (H8)            | client/src/lib/selfConsistencySampler.ts                    |
| Generation cache (H8 wrt PR-9)           | server/lib/generationCache.ts                               |
| Eval harness (H8 baseline)               | server/tests/worksheet-eval/runner.ts                       |
| Class Pack (H10)                         | client/src/lib/class-pack.ts                                |
| Re-teach planner (H10)                   | client/src/lib/reteachPlanner.ts                            |
| Topic-bank (H2)                          | client/src/lib/topic-bank.ts                                |
| Unit Pack (H2)                           | client/src/lib/unitPack.ts                                  |
| Curriculum-authority preamble (H3)       | client/src/lib/curriculumAuthorityPrompt.ts                 |
| Natural-language parser (H5)             | client/src/lib/ai.ts §NL-PARSE                              |
| Phase F curriculum bank tier filter (H11)| client/src/lib/curriculumBank.ts:filterByTier               |

## Notes (per-session scratchpad)

### Why this Phase exists separately from Phase G

Phase G is interactivity + ergonomics — features teachers want from
the FIRST minute of using the worksheet generator. Phase H is the
journey — features that compound over weeks of use (progress
tracking, year planning, gamification, spaced repetition). Splitting
them keeps PR review burden manageable and lets Phase G ship while
the team validates Phase H's UX assumptions (particularly around
gamification — research shows leaderboards can demotivate lower
performers, so the safeguarding model needs careful design).

### Items that are NOT in Phase H

- **PR-28 deferred integrations** — LMS push, MIS roster import,
  email-to-generate, share-sheet, browser extension, weekly emails,
  Mon-emails. Genuinely deferred until external credentials land.
- **Custom archetype editor** — teachers defining their own
  archetypes from scratch. Out of scope; v1 ships 5 frozen
  archetypes via Phase G G3. If demand emerges, this is a Phase I
  candidate.
- **Pupil identity / login** — companion app stays share-token-
  keyed. Proper pupil auth needs a safeguarding + DPIA review and
  is its own phase.
- **Handwriting recognition** — out of scope of any phase.
  Pupils type into the companion or scan their work via the
  existing scan-and-mark pipeline.

## How to update this file

Same protocol as every other phase folder. See
`.agents/tasks/phase-g-where-worksheet-meets-pupil/SESSION-HANDOFF.md`
"How to update this file".
