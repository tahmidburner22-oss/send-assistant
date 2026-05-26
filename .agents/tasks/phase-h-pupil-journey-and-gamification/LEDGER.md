# Phase H — Item Ledger

One row per work unit. Status flips happen in the same commit that
ships the code. Status legend at the bottom.

Last bulk-updated: 2026-05-26 (planning files created; no work unit
started).

## Phase H — pupil journey & gamification + infra cleanup

| ID  | Title                                                | Tier | Effort | Depends on Phase G? | Source                                 | Status      |
| --- | ---------------------------------------------------- | ---- | ------ | ------------------- | -------------------------------------- | ----------- |
| H1  | Pupil progress dashboard with skill mastery heatmap  | 2    | M      | yes (G1)            | Dr Frost progress tracking             | not started |
| H2  | Curriculum-architect-style year planner              | 2    | L      | no                  | Twinkl Curriculum Architect            | not started |
| H3  | Real-world context library                           | 2    | S      | no                  | Engagement research (real-world driver)| not started |
| H4  | Cross-pupil leaderboards / streaks / badges          | 2    | M      | yes (G1, H1)        | Kahoot 2025 survey (60% rank gamification #1) | not started |
| H5  | Voice-input for the worksheet brief                  | 3    | S      | no                  | Universal teacher polish               | not started |
| H6  | Telemetry admin dashboard hydration                  | 3    | S      | no                  | PR-27 deferred (telemetry already shipped, hydration not) | not started |
| H7  | Production corpus loaders                            | 3    | M      | no                  | PR-19..27 deferred (audits ship; corpus injection deferred) | not started |
| H8  | Activate dark env flags                              | 3    | S      | no                  | PR-20 dark surfaces (4 flags) + PR-9 generation cache | not started |
| H9  | Multi-step worked-example interactive walkthrough    | 2    | M      | yes (G1)            | Engagement research (interactive practice) | not started |
| H10 | Wrong-answer aggregate → re-teach pack               | 2    | M      | yes (G1)            | Internal — reteachPlanner already exists, aggregate input is the gap | not started |
| H11 | Per-question try-harder / try-easier tier-shift      | 2    | S      | yes (G1, G2)        | Engagement research (choice-and-voice) | not started |
| H12 | Spaced-repetition for 5-a-day (Leitner / SM-2)       | 2    | S      | yes (G1, G5)        | Habit-building research (Corbettmaths drill) | not started |

## Cross-link to deferred / external-credential work

| ID    | Title                                                | Tracked in                                        |
| ----- | ---------------------------------------------------- | ------------------------------------------------- |
| PR-28 | LMS push / MIS roster / email-to-generate / share-sheet / browser extension / weekly emails / Mon-emails | `.agents/tasks/big-bang-improvements/SESSION-HANDOFF.md` |

## Status legend

Same as Phase G. See
`.agents/tasks/phase-g-where-worksheet-meets-pupil/LEDGER.md`
"Status legend".

## How a fresh chat updates this ledger

Same protocol as every other phase. See Phase G's
LEDGER.md "How a fresh chat updates this ledger".
