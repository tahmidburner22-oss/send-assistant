# Phase H — Session Handoff

This file is the **resume point** for any fresh chat picking up
Phase H. Read this first, then `PHASE-PLAN.md`, then `LEDGER.md`.

Last updated: 2026-05-26 — Combined PR `feat/phase-g-h-implementation`
shipped functional code for all 12 Phase H work units in the same
branch as Phase G. See Phase G SESSION-HANDOFF for the parallel
work-unit list.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Phase H = Tier 2/3 follow-ups + telemetry
         hydration + dark-flag activation. SHIPPED on the combined PR
         `feat/phase-g-h-implementation` alongside Phase G (the
         "lowest-PR-count" path).
Resume:  .agents/tasks/phase-h-pupil-journey-and-gamification/SESSION-HANDOFF.md
Plan:    .agents/tasks/phase-h-pupil-journey-and-gamification/PHASE-PLAN.md
Ledger:  .agents/tasks/phase-h-pupil-journey-and-gamification/LEDGER.md
Constraint: same as Phase G. Sandbox is INTEGRATIONS_ONLY. CI runs the
            check + vitest suite on PR push.
Goal: review combined-PR work unit by work unit; pick a follow-up
      wiring task from "What is next" below.
```

## What is done

### H1 — Pupil progress dashboard (Tier 2, M; depends G1)

- `client/src/lib/pupilProgressAggregator.ts` — pure aggregator over
  `PupilAttemptRow[]`; emits `{ perPupil, perClass, perSpecRef }`
  with green/amber/red/grey banding (≥80 / 50-79 / <50 / <3 attempts).
- `client/src/pages/PupilProgressDashboard.tsx` — heatmap + roll-up
  surface; wires to a caller-supplied row list or fetcher.

### H2 — Year planner (Tier 2, L)

- `client/src/lib/yearPlannerSchema.ts` — Zod schema +
  `buildAcademicWeeks` (38-week Sep-Aug ISO calendar with UK
  holiday-week heuristic) + `setWeekTopic` pure helper.
- `client/src/pages/YearPlanner.tsx` — minimal v1 list-based
  calendar (drag-drop UX is a v2 follow-up; the persisted shape
  + editing surface ship in v1 so HoDs can build a SoW).

### H3 — Real-world context library (Tier 2, S)

- `client/src/lib/realWorldContextLibrary.ts` — lookup + filter
  helpers; honours `avoidWith[]` per-context for SEND profiles.
- `client/src/data/contexts/realWorldContexts.json` — ≥20 evergreen
  / seasonal contexts across 8 categories. Ready for expansion to
  the 200-entry target tracked in PHASE-PLAN.md.
- `client/src/lib/promptSections/realWorldContextDirective.ts` —
  prompt block (re-export of `buildContextDirective`).
- Schema addition: `metadata.realWorldContextId`.

### H4 — Cross-pupil leaderboards / streaks / badges (Tier 2, M; depends G1)

- `client/src/lib/gamificationEngine.ts` — pure rules engine.
  Streaks: consecutive days with ≥1 correct attempt. Badges:
  `first-correct`, `10-correct`, `50-correct`, `century`,
  `5-day-streak`, `30-day-streak`. Leaderboard: percentile-ranked,
  bottom-N hidden, opt-out honoured.
- `client/src/components/PupilStreakBadge.tsx` — flame + day count.
- `client/src/components/ClassLeaderboard.tsx` — initials-only,
  off-by-default, hidden-pupil count surfaced.
- Schema addition: `metadata.badgesEarned`.

### H5 — Voice-input for the worksheet brief (Tier 3, S)

- `client/src/hooks/useVoiceToTextHook.tsx` — Web Speech API wrapper
  (`SpeechRecognition` / `webkitSpeechRecognition`); SSR-safe.
  Permission-denied surfaced explicitly; degrades gracefully on
  unsupported browsers.
- `client/src/components/VoiceBriefButton.tsx` — toggle button;
  hidden when API unsupported.

### H6 — Telemetry admin dashboard hydration (Tier 3, S)

- `server/routes/telemetry.ts` — extended with
  `GET /api/admin/telemetry?metric=…&windowDays=N`. Returns the
  shape the existing aggregators emit (`validatorFirings`,
  `regenerationHeatmap`, `tokenCostRollup`).
- `client/src/lib/telemetryClient.ts` — `useTelemetry` hook +
  typed wrappers (`useValidatorFirings`, `useRegenerationHeatmap`,
  `useTokenCostRollup`).

### H7 — Production corpus loaders (Tier 3, M)

- `server/lib/subjectVocabularyCorpus.ts` — lazy filesystem loader
  for `server/data/corpora/subject-vocab/*.json`.
- `server/lib/citationCorpus.ts` — lazy loader for
  `server/data/corpora/citations/*.json`.
- `server/lib/pastPaperFrequencyCorpus.ts` — lazy loader for
  `server/data/corpora/past-paper-frequency/*.json`.
- All three: empty-fallback when files absent + cache invalidation
  hook (`clearXxxCache`) for tests.

### H8 — Activate dark env flags (Tier 3, S)

- `server/lib/featureFlags.ts` — pure `buildFlagResolver`. Per-school
  override > env fallback. Honours per-subject and per-question-type
  scope. Backwards-compatible with env-only deployments
  (no DB row → env wins).

### H9 — Multi-step worked-example walkthrough (Tier 2, M; depends G1)

- `client/src/lib/workedExampleStepper.ts` — pure state machine
  (`locked` → `revealed` → `attempted` → `fed-back` → `complete`).
  `isUnlocked` prevents skipping ahead.
- `client/src/components/WorkedExampleWalkthrough.tsx` — companion-app
  surface; integrates with the G1 verifier.
- Schema addition: `section.workedExampleSteps`.

### H10 — Wrong-answer aggregate → re-teach pack (Tier 2, M; depends G1)

- `client/src/lib/wrongAnswerAggregator.ts` — pure aggregator. Groups
  by `(specRef, misconceptionId)`; configurable threshold (default
  0.3); emits an `AggregatedReteachBrief` shape compatible with the
  existing `reteachPlanner` flow (gaps array, ordered by wrong-rate
  descending, deterministic tie-break).

### H11 — Per-question try-harder / try-easier (Tier 2, S; depends G1, G2)

- `client/src/lib/tierShift.ts` — wraps `anotherOneLikeThis` (G2)
  with a tier bias.
- `client/src/components/TierShiftButtons.tsx` — two buttons in the
  companion; tier-guarded so 'easier' hides when already at
  Foundation and 'harder' hides at Higher.

### H12 — Spaced-repetition for 5-a-day (Tier 2, S; depends G1, G5)

- `client/src/lib/leitnerScheduler.ts` — pure Leitner-box scheduler.
  Correct → next box (cap 5); incorrect → box 1; partial holds.
  `biasedSkillOrder` weights the next pack 60/30/10 (box 1 / box 2
  / box 3+) by default.
- Schema addition: `metadata.spacedRepetitionState`.

## What is in flight

(None — all 12 work units have shipped functional code.)

## What is next

Same shape as Phase G's "What is next": the deterministic cores
ship in this PR; the remaining work is to wire each into the
existing pages. Recommended order:

1. ~~**Wire H6's hook into `client/src/pages/admin/telemetry.tsx`**
   (replaces the presentational stub).~~ Wired in PR #126 (W1).
2. ~~**Wire H3's prompt directive** into
   `ai.ts:structuredSystemSections`; add the picker to
   `Worksheets.tsx`'s form.~~ Wired in PR #127 (W12) — directive
   injected in `ai.ts` and a context picker added to the Worksheets
   form alongside the lesson-archetype picker.
3. ~~**Build the H7 seed corpora** (`server/data/corpora/**/*.json`).~~
   Wired in PR #126 (W2) — three subjects per corpus dir.
4. ~~**Add the H8 admin panel UI** to toggle per-school flags.~~
   Wired in PR #126 (W3) — `/admin/feature-flags`.
5. **Wire H1's dashboard route** in `App.tsx` + the server-side
   `pupil_attempt` table migration.
6. **Wire H10's aggregator** into the H1 dashboard with a
   "Generate re-teach pack" button.
7. **Wire H4's streak badge** into the companion-app header
   alongside G1.
8. **Wire H9's walkthrough** into the companion-app
   worked-example sections.
9. **Wire H11's `<TierShiftButtons>`** into the companion-app
   answer-entry result card.
10. **Hook H12's `biasedSkillOrder`** into G5's `fiveADayBuilder`
    via the optional `schedulerOutput` input.
11. **Build H2's drag-drop UX** on top of the v1 list-based
    calendar.

## Definition-of-done (per work unit)

Same as Phase G. See
`.agents/tasks/phase-g-where-worksheet-meets-pupil/PHASE-PLAN.md`.

## Files-of-interest map (for the next chat)

| Concern                                  | Anchor file                                                 |
| ---------------------------------------- | ----------------------------------------------------------- |
| Companion-app answer log (H1, H4, H9, H10, H11, H12) | `client/src/lib/companion-answer-log.ts` (created in G1) |
| Telemetry aggregators (H6)               | `client/src/lib/telemetryAggregators.ts`                    |
| Telemetry route (H6)                     | `server/routes/telemetry.ts`                                |
| Subject vocab corpus loader (H7)         | `server/lib/subjectVocabularyCorpus.ts`                     |
| Citation corpus loader (H7)              | `server/lib/citationCorpus.ts`                              |
| Past-paper frequency corpus loader (H7)  | `server/lib/pastPaperFrequencyCorpus.ts`                    |
| Feature flag resolver (H8)               | `server/lib/featureFlags.ts`                                |
| Year planner schema (H2)                 | `client/src/lib/yearPlannerSchema.ts`                       |
| Pupil progress aggregator (H1)           | `client/src/lib/pupilProgressAggregator.ts`                 |
| Wrong-answer aggregator (H10)            | `client/src/lib/wrongAnswerAggregator.ts`                   |
| Tier shift (H11)                         | `client/src/lib/tierShift.ts`                               |
| Leitner scheduler (H12)                  | `client/src/lib/leitnerScheduler.ts`                        |
| Worked-example stepper (H9)              | `client/src/lib/workedExampleStepper.ts`                    |
| Gamification engine (H4)                 | `client/src/lib/gamificationEngine.ts`                      |
| Real-world contexts data (H3)            | `client/src/data/contexts/realWorldContexts.json`           |
| Voice-to-text hook (H5)                  | `client/src/hooks/useVoiceToTextHook.tsx`                   |
