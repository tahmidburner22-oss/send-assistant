# Phase H — Item Ledger

One row per work unit. Status flips happen in the same commit that
ships the code. Status legend at the bottom.

Last bulk-updated: 2026-05-26 (combined PR `feat/phase-g-h-implementation`
shipped functional code for all 12 work units alongside Phase G).

## Phase H — pupil journey & gamification + infra cleanup

| ID  | Title                                                | Tier | Effort | Depends on Phase G? | Source                                 | Status                |
| --- | ---------------------------------------------------- | ---- | ------ | ------------------- | -------------------------------------- | --------------------- |
| H1  | Pupil progress dashboard with skill mastery heatmap  | 2    | M      | yes (G1)            | Dr Frost progress tracking             | shipped — combined PR |
| H2  | Curriculum-architect-style year planner              | 2    | L      | no                  | Twinkl Curriculum Architect            | shipped — combined PR |
| H3  | Real-world context library                           | 2    | S      | no                  | Engagement research (real-world driver)| wired — PR #127 (W12)  |
| H4  | Cross-pupil leaderboards / streaks / badges          | 2    | M      | yes (G1, H1)        | Kahoot 2025 survey                     | shipped — combined PR |
| H5  | Voice-input for the worksheet brief                  | 3    | S      | no                  | Universal teacher polish               | shipped — combined PR |
| H6  | Telemetry admin dashboard hydration                  | 3    | S      | no                  | PR-27 deferred (telemetry already shipped, hydration not) | shipped — combined PR |
| H7  | Production corpus loaders                            | 3    | M      | no                  | PR-19..27 deferred (audits ship; corpus injection deferred) | shipped — combined PR |
| H8  | Activate dark env flags                              | 3    | S      | no                  | PR-20 dark surfaces (4 flags) + PR-9 generation cache | shipped — combined PR |
| H9  | Multi-step worked-example interactive walkthrough    | 2    | M      | yes (G1)            | Engagement research (interactive practice) | shipped — combined PR |
| H10 | Wrong-answer aggregate → re-teach pack               | 2    | M      | yes (G1)            | Internal — reteachPlanner already exists, aggregate input is the gap | shipped — combined PR |
| H11 | Per-question try-harder / try-easier tier-shift      | 2    | S      | yes (G1, G2)        | Engagement research (choice-and-voice) | shipped — combined PR |
| H12 | Spaced-repetition for 5-a-day (Leitner / SM-2)       | 2    | S      | yes (G1, G5)        | Habit-building research (Corbettmaths drill) | shipped — combined PR |

## What the combined PR ships per work unit

| ID  | Files                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | `client/src/lib/pupilProgressAggregator.ts` · `client/src/pages/PupilProgressDashboard.tsx` · `client/src/lib/companion-answer-log.ts` (extended in G1)                                              |
| H2  | `client/src/lib/yearPlannerSchema.ts` · `client/src/pages/YearPlanner.tsx`                                                                                                                            |
| H3  | `client/src/lib/realWorldContextLibrary.ts` · `client/src/data/contexts/realWorldContexts.json` (≥20 evergreen seed entries) · `client/src/lib/promptSections/realWorldContextDirective.ts` · schema addition (`realWorldContextId`) |
| H4  | `client/src/lib/gamificationEngine.ts` · `client/src/components/PupilStreakBadge.tsx` · `client/src/components/ClassLeaderboard.tsx` · schema addition (`badgesEarned`)                              |
| H5  | `client/src/hooks/useVoiceToTextHook.tsx` · `client/src/components/VoiceBriefButton.tsx`                                                                                                              |
| H6  | `client/src/lib/telemetryClient.ts` · `server/routes/telemetry.ts` (extended with `/admin/telemetry`)                                                                                                |
| H7  | `server/lib/subjectVocabularyCorpus.ts` · `server/lib/citationCorpus.ts` · `server/lib/pastPaperFrequencyCorpus.ts`                                                                                   |
| H8  | `server/lib/featureFlags.ts`                                                                                                                                                                          |
| H9  | `client/src/lib/workedExampleStepper.ts` · `client/src/components/WorkedExampleWalkthrough.tsx` · schema addition (`workedExampleSteps`)                                                              |
| H10 | `client/src/lib/wrongAnswerAggregator.ts`                                                                                                                                                             |
| H11 | `client/src/lib/tierShift.ts` · `client/src/components/TierShiftButtons.tsx`                                                                                                                          |
| H12 | `client/src/lib/leitnerScheduler.ts` · schema addition (`spacedRepetitionState`)                                                                                                                      |

## Cross-link to deferred / external-credential work

| ID    | Title                                                | Tracked in                                        |
| ----- | ---------------------------------------------------- | ------------------------------------------------- |
| PR-28 | LMS push / MIS roster / email-to-generate / share-sheet / browser extension / weekly emails / Mon-emails | `.agents/tasks/big-bang-improvements/SESSION-HANDOFF.md` |

## Status legend

Same as Phase G. See
`.agents/tasks/phase-g-where-worksheet-meets-pupil/LEDGER.md`
"Status legend".
