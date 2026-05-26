# Phase G — Item Ledger

One row per work unit. The Status column is the canonical truth —
when an item ships, flip its status here in the same commit that
ships the code. Shadow rows for items deferred to Phase H are
included so the cross-link is one-click.

Last bulk-updated: 2026-05-26 (combined PR `feat/phase-g-h-implementation`
shipped functional code for all 12 implementation work units).

## Phase G — competitor-derived improvements (worksheet generator)

| ID  | Title                                                    | Tier | Effort | Source praise                                         | Status                       |
| --- | -------------------------------------------------------- | ---- | ------ | ----------------------------------------------------- | ---------------------------- |
| G1  | Pupil-facing auto-marking in the companion app           | 1    | M      | Dr Frost auto-marking; Liveworksheets auto grading    | shipped — combined PR        |
| G2  | "Another one like this" same-spec-ref regen              | 1    | S      | Dr Frost question generators; Save My Exams unlimited | shipped — combined PR        |
| G3  | Lesson-archetype templates (5 archetypes)                | 1    | M      | Twinkl PlanIt lesson plans                            | wired — PR #127 (W5)         |
| G4  | Procedural activity types (4 generators)                 | 1    | M      | Twinkl resource breadth                               | wired — PR #127 (W6 ai.ts; renderer in PR-C) |
| G5  | 5-a-day daily-drill builder                              | 1    | S      | Corbettmaths 5-a-day                                  | shipped — combined PR        |
| G6  | Predicted-paper builder (UI surface)                     | 1    | S      | MathsGenie predicted papers                           | shipped — combined PR        |
| G9  | One-click three-tier ability differentiation (LA / MA / HA) | 2 | S      | Twinkl PlanIt three-way differentiation               | wired — PR #127 (W8)         |
| G12 | Teacher-only answer-key separate page                    | 3    | XS     | (universal teacher request)                           | wired — PR #127 (W9)         |
| G13 | Per-question timer (mock-exam mode)                      | 3    | S      | (mock-exam practice request)                          | shipped — combined PR        |
| G14 | Parent letter / homework cover note                      | 3    | S      | Twinkl parent letters                                 | shipped — combined PR (W11 deferred) |
| G15 | Drag-handle section reorder                              | 3    | S      | (universal teacher polish request)                    | shipped — combined PR        |
| G17 | Worksheet favourites speed-dial                          | 3    | S      | TpT filing-cabinet pattern                            | wired — PR #127 (W4)         |
| G18 | Bug — `semh` resolver order fix                          | 4    | XS     | (internal — flagged in PR-1 SESSION-HANDOFF notes)    | shipped — PR #124            |
| G19 | Bug — fidelity audit warning idempotency                 | 4    | XS     | (internal — flagged in PR-1 SESSION-HANDOFF notes)    | shipped — PR #124            |
| G20 | Cleanup — delete `WorksheetRenderer.tsx.bak`             | 4    | XS     | (internal — flagged in repo audit)                    | shipped — PR #124            |

## What the combined PR ships per work unit

Each row below summarises the files added / extended. The combined
PR ships the **deterministic core** (pure libraries, schemas, and
tests) plus minimal-but-functional UI scaffold components. Wiring
the new components into the multi-thousand-line `Worksheets.tsx` /
`WorksheetRenderer.tsx` happens in a follow-up so reviewers can audit
each work unit in isolation.

| ID  | Files                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | `client/src/lib/answerVerifier.ts` · `client/src/lib/companion-answer-log.ts` · `client/src/components/AnswerEntryPanel.tsx` · schema additions (`answerSpec`, `companionAttempts`)                                                                                                         |
| G2  | `client/src/lib/anotherOneLikeThis.ts` · `client/src/components/AnotherOneButton.tsx` · schema additions (`questionProvenance`, `excludedExemplarIds`)                                                                                                                                      |
| G3  | `client/src/lib/lessonArchetypes.ts` · `client/src/lib/promptSections/archetypeDirectives.ts` · `client/src/components/ArchetypePickerDialog.tsx` · schema additions (`lessonArchetype`, `sectionTargetsOverride`)                                                                          |
| G4  | `client/src/lib/proceduralActivities/{seededRandom,wordsearch,crossword,matching,cloze}.ts` · `client/src/lib/promptSections/proceduralActivityDirectives.ts` · schema addition (`section.procedural`)                                                                                       |
| G5  | `client/src/lib/fiveADayBuilder.ts`                                                                                                                                                                                                                                                          |
| G6  | `client/src/lib/predictedPaperBuilder.ts`                                                                                                                                                                                                                                                    |
| G9  | `client/src/lib/threeTierDifferentiation.ts` · `client/src/components/ThreeTierButton.tsx` · schema addition (`differentiationGroup`)                                                                                                                                                       |
| G12 | `client/src/lib/answerKeySheet.ts`                                                                                                                                                                                                                                                           |
| G13 | `client/src/lib/questionTimer.ts` · `client/src/components/QuestionTimer.tsx` · schema additions (`mockExamMode`, `timeAllocations`)                                                                                                                                                        |
| G14 | `client/src/lib/parentLetter.ts` · schema additions (`parentLetterAttached`, `parentTone`)                                                                                                                                                                                                  |
| G15 | `client/src/lib/worksheet-renumber.ts`                                                                                                                                                                                                                                                       |
| G17 | `client/src/lib/worksheetFavourites.ts` · `client/src/components/StarToggle.tsx` · `server/routes/worksheetLibrary.ts` (extended with `/favourites` endpoints)                                                                                                                              |

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
- `shipped — combined PR` — landed on the same combined Phase G+H
  implementation PR (`feat/phase-g-h-implementation`); flips to
  `shipped — PR #NN` when that PR merges.
- `shipped — PR #NN` — merged into main; PR number recorded.
- `shipped — commit <SHA>` — landed on the combined Phase G branch
  but the PR is still open at the time of writing.
- `deferred` — out of scope for Phase G; tracked elsewhere.
- `dropped` — withdrawn after re-evaluation; row stays for
  traceability with a one-line note in the rightmost column.

## How a fresh chat updates this ledger

1. After committing a work unit, edit this file to flip the Status
   column for every row the work unit closes — same commit as the
   code change, never as a follow-up.
2. Use `shipped — combined PR` while the combined PR is open. When
   the combined PR merges, flip every `shipped — combined PR` to
   `shipped — PR #NN`.
3. Update `SESSION-HANDOFF.md`'s "What is done" / "What is next"
   sections in the same edit. Inconsistency between LEDGER.md and
   SESSION-HANDOFF.md is the #1 way fresh chats lose the plot.
