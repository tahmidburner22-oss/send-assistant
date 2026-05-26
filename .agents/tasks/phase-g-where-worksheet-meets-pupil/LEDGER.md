# Phase G — Item Ledger

One row per work unit. The Status column is the canonical truth —
when an item ships, flip its status here in the same commit that
ships the code. Shadow rows for items deferred to Phase H are
included so the cross-link is one-click.

Last bulk-updated: 2026-05-26 (G18 / G19 / G20 prework shipped on
this planning PR; 12 implementation work units remain).

## Phase G — competitor-derived improvements (worksheet generator)

| ID  | Title                                                    | Tier | Effort | Source praise                                         | Status                       |
| --- | -------------------------------------------------------- | ---- | ------ | ----------------------------------------------------- | ---------------------------- |
| G1  | Pupil-facing auto-marking in the companion app           | 1    | M      | Dr Frost auto-marking; Liveworksheets auto grading    | not started                  |
| G2  | "Another one like this" same-spec-ref regen              | 1    | S      | Dr Frost question generators; Save My Exams unlimited | not started                  |
| G3  | Lesson-archetype templates (5 archetypes)                | 1    | M      | Twinkl PlanIt lesson plans                            | not started                  |
| G4  | Procedural activity types (4 generators)                 | 1    | M      | Twinkl resource breadth                               | not started                  |
| G5  | 5-a-day daily-drill builder                              | 1    | S      | Corbettmaths 5-a-day                                  | not started                  |
| G6  | Predicted-paper builder (UI surface)                     | 1    | S      | MathsGenie predicted papers                           | not started                  |
| G9  | One-click three-tier ability differentiation (LA / MA / HA) | 2 | S      | Twinkl PlanIt three-way differentiation               | not started                  |
| G12 | Teacher-only answer-key separate page                    | 3    | XS     | (universal teacher request)                           | not started                  |
| G13 | Per-question timer (mock-exam mode)                      | 3    | S      | (mock-exam practice request)                          | not started                  |
| G14 | Parent letter / homework cover note                      | 3    | S      | Twinkl parent letters                                 | not started                  |
| G15 | Drag-handle section reorder                              | 3    | S      | (universal teacher polish request)                    | not started                  |
| G17 | Worksheet favourites speed-dial                          | 3    | S      | TpT filing-cabinet pattern                            | not started                  |
| G18 | Bug — `semh` resolver order fix                          | 4    | XS     | (internal — flagged in PR-1 SESSION-HANDOFF notes)    | shipped — this PR            |
| G19 | Bug — fidelity audit warning idempotency                 | 4    | XS     | (internal — flagged in PR-1 SESSION-HANDOFF notes)    | shipped — this PR            |
| G20 | Cleanup — delete `WorksheetRenderer.tsx.bak`             | 4    | XS     | (internal — flagged in repo audit)                    | shipped — this PR            |

## Phase H — deferred follow-ups (cross-link)

| ID  | Title                                                    | Tracked in                                        |
| --- | -------------------------------------------------------- | ------------------------------------------------- |
| H1  | Pupil progress dashboard with skill mastery heatmap      | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H2  | Curriculum-architect-style year planner                  | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H3  | Real-world context library                               | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H4  | Cross-pupil leaderboards / streaks / badges              | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H5  | Voice-input for the worksheet brief                      | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H6  | Telemetry admin dashboard hydration                      | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H7  | Production corpus loaders                                | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H8  | Activate dark env flags                                  | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H9  | Multi-step interactive worked-example walkthrough        | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H10 | Wrong-answer aggregate → re-teach pack                   | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H11 | Try-harder / try-easier tier-shift buttons               | `phase-h-pupil-journey-and-gamification/LEDGER.md` |
| H12 | Spaced-repetition for 5-a-day (Leitner / SM-2)           | `phase-h-pupil-journey-and-gamification/LEDGER.md` |

## Status legend

- `not started` — work has not begun.
- `in-flight` — a branch is in active development; PR may or may not
  be open.
- `shipped — this PR` — landing on the same combined PR as this
  ledger row.
- `shipped — PR #NN` — merged into main; PR number recorded.
- `shipped — commit <SHA>` — landed on the combined Phase G branch
  but the PR is still open at the time of writing; will be flipped
  to `shipped — PR #NN` when the combined PR merges.
- `deferred` — out of scope for Phase G; tracked elsewhere.
- `dropped` — withdrawn after re-evaluation; row stays for
  traceability with a one-line note in the rightmost column.

## How a fresh chat updates this ledger

1. After committing a work unit, edit this file to flip the Status
   column for every row the work unit closes — same commit as the
   code change, never as a follow-up.
2. Use `shipped — commit <SHA>` while the combined PR is open. When
   the combined PR merges, the closing commit (or a final cleanup
   commit) flips every `shipped — commit <SHA>` to `shipped — PR
   #NN`.
3. Update `SESSION-HANDOFF.md`'s "What is done" / "What is next"
   sections in the same edit. Inconsistency between LEDGER.md and
   SESSION-HANDOFF.md is the #1 way fresh chats lose the plot.
