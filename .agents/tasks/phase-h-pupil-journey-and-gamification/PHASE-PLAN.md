# Phase H — Pupil Journey & Gamification

> Twelve follow-on improvements that round out the worksheet → pupil
> loop after Phase G ships the interactivity + ergonomics layer.
> Phase H closes the engagement, cohort-aware adaptation, and
> infrastructure-completion gaps.

## Goal

Convert the worksheet from a one-shot artefact into a **journey**:
pupils make progress visible to themselves and teachers; teachers
plan a year of worksheets, not a lesson; the platform learns from
pupil submissions to tailor the next worksheet automatically.

## Scope

12 work units. 6 G-independent (H2, H3, H5, H6, H7, H8) can ship
without Phase G. 6 G-dependent (H1, H4, H9, H10, H11, H12) need
G1's pupil auto-mark data flow.

| ID  | Title                                                | Tier | Effort | Depends                |
| --- | ---------------------------------------------------- | ---- | ------ | ---------------------- |
| H1  | Pupil progress dashboard with skill mastery heatmap  | 2    | M      | G1 (companion-answer-log) |
| H2  | Curriculum-architect-style year planner              | 2    | L      | —                      |
| H3  | Real-world context library                           | 2    | S      | —                      |
| H4  | Cross-pupil leaderboards / streaks / badges          | 2    | M      | G1 + H1                |
| H5  | Voice-input for the worksheet brief                  | 3    | S      | —                      |
| H6  | Telemetry admin dashboard hydration                  | 3    | S      | telemetryAggregators (PR-27 already shipped) |
| H7  | Production corpus loaders                            | 3    | M      | spVocabularyLibraryAudit + citationGroundedFactual |
| H8  | Activate dark env flags                              | 3    | S      | promptAbFramework + perSubjectPromptFamilies + selfConsistencySampler + citationGroundedFactual |
| H9  | Multi-step worked-example interactive walkthrough    | 2    | M      | G1                     |
| H10 | Wrong-answer aggregate → re-teach pack               | 2    | M      | G1                     |
| H11 | Per-question try-harder / try-easier tier-shift      | 2    | S      | G1 + G2                |
| H12 | Spaced-repetition for 5-a-day (Leitner / SM-2)       | 2    | S      | G1 + G5                |

Effort key: S ≈ 100–300 LoC; M ≈ 300–800 LoC; L ≈ 800–2000 LoC.

## Per-work-unit summaries

### H1 — Pupil progress dashboard (depends on G1)

Reads the per-pupil-per-worksheet companion-answer-log G1 emits.
Emits a per-pupil heatmap of (specRef × correct/partial/incorrect)
plus a per-class roll-up. Server-side persistence layer: new
`pupil_attempt` table mirroring the existing `attempt_log.ts`
local-storage shape. Reuses `coverageAggregator.ts`.

### H2 — Curriculum-architect-style year planner

Drag-and-drop UI over the existing UnitPack + topic-bank libraries.
Teacher drags a topic into "Week 5" of the year view; the planner
emits a calendar-anchored Unit Pack. Source praise: Twinkl
Curriculum Architect.

### H3 — Real-world context library

Curated pickable themes (sport, current-events, music, film,
local-region) that bias the AI prompt's worked-example contexts.
Builds on the curriculum-authority preamble's existing UK-context
whitelist; adds a teacher-pickable filter on the Worksheets form.
Pure data layer + one prompt-block extension.

### H4 — Cross-pupil leaderboards / streaks / badges (depends on G1 + H1)

Reads H1's pupil_attempt rows and emits per-class:
- Streak: consecutive days with ≥1 correct answer
- Badge: first-attempt-100%-on-spec-ref, longest-streak, most-improved
- Leaderboard: opt-in per-class (off by default per safeguarding
  research); displays initials only.

### H5 — Voice-input for the worksheet brief

Web Speech API integration on the natural-language input panel
(parseNaturalLanguageInput already exists in ai.ts at §NL-PARSE).
A "Speak your brief" button records → transcribes → drops into the
existing parser. No new server route.

### H6 — Telemetry admin dashboard hydration

Phase 19..27 shipped `telemetryAggregators.ts` and a presentational
admin page at `client/src/pages/admin/telemetry.tsx` but never the
hydration container. H6 wires the existing aggregators to a server
endpoint and the page to a fetch hook.

### H7 — Production corpus loaders

Three corpus stubs from PR-19..27 ship with caller-injected data.
H7 builds the production loaders:
- `server/lib/subjectVocabularyCorpus.ts` — production loader for
  `spVocabularyLibraryAudit`
- `server/lib/citationCorpus.ts` — production loader for
  `citationGroundedFactual`
- `server/lib/pastPaperFrequencyCorpus.ts` — production loader for
  G6's predicted-paper builder

### H8 — Activate dark env flags

PR-20 shipped four prompt-engineering surfaces dark behind env
flags. H8 turns each on for a per-tenant subset (school_id allow-
list), runs an A/B baseline through the eval harness, and either
rolls forward or rolls back per-flag.

Flags: `PROMPT_AB_ENABLED`, `PROMPT_FAMILIES_ENABLED`,
`PROMPT_SELF_CONSISTENCY_ENABLED`, `PROMPT_CITATION_LAYER_ENABLED`,
`GENERATION_CACHE_ENABLED` (PR-9 cache; turn on once PII redaction
is verified in production logs).

### H9 — Multi-step worked-example interactive walkthrough (depends on G1)

Companion-app surface that turns the static worked-example sections
the LLM emits today into a step-through experience: pupil reveals
step 1, attempts step 2 themselves, gets G1's verifier feedback,
then reveals the model step. Builds on G1's verifier infrastructure.

### H10 — Wrong-answer aggregate → re-teach pack (depends on G1)

Class-pack-style follow-up generator. Reads G1's companion-answer-
log across a class, identifies the (specRef, misconceptionId) pairs
with ≥30% wrong-answer rate, and generates a re-teach worksheet
focused on those exact gaps. Reuses reteachPlanner.ts (FEAT-PB3).

### H11 — Try-harder / try-easier tier-shift (depends on G1 + G2)

Per-question buttons in the companion app. Try-harder calls
anotherOneLikeThis (G2) with a tier-shifted bias toward Higher
exemplars; try-easier biases toward Foundation. Reuses Phase F's
tier filter on `curriculumBank.lookupBySpecRef`.

### H12 — Spaced-repetition for 5-a-day (depends on G1 + G5)

Leitner-box scheduler over G5's 5-a-day skill list. Reads G1's
correct/incorrect log; advances correct skills to the next box,
demotes incorrect skills to box 1. Each day's 5-a-day pack is
weighted by box (60% box 1 / 30% box 2 / 10% box 3+).

## Definition-of-done (per work unit)

Same as Phase G. See `phase-g-where-worksheet-meets-pupil/PHASE-PLAN.md`.

## Branch + PR strategy

**Recommended:** single combined branch
`feat/phase-h-pupil-journey-and-gamification`. Diff size estimate:
~3,800 LoC across ~32 files.

**Fallback if review burden too high:** split into 4 PRs along the
dependency lines:
- PR-H-A: H6 + H7 + H8 (infra cleanup; G-independent)
- PR-H-B: H2 + H3 + H5 (UI + content; G-independent)
- PR-H-C: H1 + H4 + H10 (pupil progress + gamification; G-dep)
- PR-H-D: H9 + H11 + H12 (companion-app extensions; G-dep)

Each `FEAT-H*.json` carries its own scope, files, and acceptance
criteria so any of the four PRs is independently reviewable.
