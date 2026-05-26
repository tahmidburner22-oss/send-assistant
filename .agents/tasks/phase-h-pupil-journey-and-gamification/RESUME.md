# Phase H — Resume pointer

**Quick-resume header — paste into a fresh chat:**

```
Context: send-assistant repo. Phase H = Tier 2/3 follow-ups to Phase G
         + telemetry hydration + dark-flag activation + spaced-repetition
         scheduler. Most rows depend on Phase G having shipped first
         (especially G1's pupil auto-mark data flow).
Resume:  .agents/tasks/phase-h-pupil-journey-and-gamification/SESSION-HANDOFF.md
Plan:    .agents/tasks/phase-h-pupil-journey-and-gamification/PHASE-PLAN.md
Ledger:  .agents/tasks/phase-h-pupil-journey-and-gamification/LEDGER.md
Feats:   .agents/tasks/phase-h-pupil-journey-and-gamification/features/FEAT-H*.json
Constraint: Phase G must ship first for H1 / H4 / H9 / H10 / H11 / H12
            (they read pupil auto-mark data from G1's companion-answer-log).
            H2 / H3 / H5 / H6 / H7 / H8 are independent and can ship
            in parallel with Phase G if the team prefers.
            Same big-file constraints as Phase G — see G's RESUME.md.
Goal: complete the next un-shipped row in "What is next", update LEDGER
      and SESSION-HANDOFF, extend the combined PR.
```

## What Phase H is

Twelve follow-on improvements that round out the worksheet → pupil
loop. Tier 2 (high-impact, bigger build) plus the cleanup items from
the PR-19..27 deferred list (telemetry admin hydration, corpus
loaders, dark-flag activation) plus three Phase-G-dependent unlocks
(multi-step walkthroughs, wrong-answer aggregate re-teach, spaced
repetition).

## How to ship Phase H

Recommended single combined branch
`feat/phase-h-pupil-journey-and-gamification`, mirroring Phase G's
pattern. Cap at ~3,500 net LoC across ~30 files to stay in the
team's PR-size tolerance.

If Phase G hasn't merged yet, ship the **G-independent** subset
first (H2, H3, H5, H6, H7, H8) on its own branch and stack the
G-dependent rows on top of Phase G's branch.

## Items in Phase H

| ID  | Title                                                | Depends on Phase G? |
| --- | ---------------------------------------------------- | ------------------- |
| H1  | Pupil progress dashboard with skill mastery heatmap  | yes (G1)            |
| H2  | Curriculum-architect-style year planner              | no                  |
| H3  | Real-world context library                           | no                  |
| H4  | Cross-pupil leaderboards / streaks / badges          | yes (G1)            |
| H5  | Voice-input for the worksheet brief                  | no                  |
| H6  | Telemetry admin dashboard hydration                  | no                  |
| H7  | Production corpus loaders                            | no                  |
| H8  | Activate dark env flags                              | no                  |
| H9  | Multi-step worked-example interactive walkthrough    | yes (G1)            |
| H10 | Wrong-answer aggregate → re-teach pack               | yes (G1)            |
| H11 | Per-question try-harder / try-easier tier-shift      | yes (G1, G2)        |
| H12 | Spaced-repetition for 5-a-day (Leitner / SM-2)       | yes (G1, G5)        |
