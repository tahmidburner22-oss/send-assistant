# Lane 2 — USP Polish — Phase Plan

## Goal

Lift every SEND need from "asked nicely in the prompt" to
"deterministically guaranteed by a fail-closed post-validator", and
collapse the three parallel SEND systems into one source of truth so
they cannot drift apart again.

## Success criteria

1. Every audit-doc-named SEND marker (HI Topic Summary, ADHD tick
   boxes, ADHD brain break, Anxiety OPTIONAL BONUS, Dyslexia method
   box, MLD topic context, Dyscalculia number steps, EAL Key
   Vocabulary box + sentence frames, VI text-equivalent for
   diagrams, Dyspraxia non-writing answer formats) ships on every
   worksheet for that need, regardless of whether the AI obeyed the
   prompt.
2. The post-validator chain is the single deterministic backstop.
   Tests assert each marker is present after `runRegistry`.
3. The revision-tips builder emits the six categories the audit
   doc names (or the audit doc is updated to match the code — pick
   one).
4. The worksheet renderer and the revision-mat renderer share a
   single `linesForMarks` function — no two-source drift.
5. The curriculum-authority preamble appears on every worksheet's
   system prompt, not just the secondary path.
6. Primary worksheets are 5/4/5, not 3/3/3.
7. Lighthouse a11y score ≥ 95 on the worksheet preview page.
8. Stacked-need fixtures (HI+EAL, ADHD+Dyslexia, etc.) pass the
   eval harness with both needs' markers present.
9. The three legacy SEND locations
   (`worksheetConstraints.SEND_OVERLAYS`, `overlayEngine.build*`,
   `sendPromptFragments.SEND_ADAPTATION_SPECS`) are unified —
   either via auto-generation from one source or by removing the
   cosmetic-only legacy table.

## Order of work (smallest blast radius first, biggest last)

1. **2.2** — extend `enforceSendOverlayMarkers` to cover ADHD,
   Dyslexia, MLD, Dyscalculia, EAL, VI, Dyspraxia. Builds on Lane
   1.6/1.7 pattern. Idempotent. Pure.
2. **2.7** — six revision-tip categories. Builder rewrite + prompt
   sentence + audit doc sync. Targeted.
3. **2.5** — single `linesForMarks` mapping. Three lines of code.
4. **2.6** — auth preamble bound to primary + revision-mat paths.
   Wiring change in `ai.ts`.
5. **2.4** — primary 5/4/5. Targets table + planner update + prompt
   adjustments.
6. **2.8** — aria-labels. Breadth UI work.
7. **2.3** — stacked-needs fixtures.
8. **2.1** — collapse three SEND systems. Biggest refactor, lands
   last.

## Out of scope (Lane 3 backlog)

See `SESSION-HANDOFF.md` "What is NOT in this PR" section. Lane 3
is queued in `../lane-1-pre-pilot-fixes/SESSION-HANDOFF.md` Lane 3
section.

## Risk register

- **2.2 SEND markers** — every new check must be idempotent and
  must not mutate fields the overlay engine's
  `assertBaseSectionsPreserved` checks (`type`, `content`, `marks`,
  `imageUrl`, `assetRef`). Mutating `title` is allowed (Lane 1.7
  already does this for Anxiety) since the post-validator runs
  before the overlay engine.
- **2.4 primary 5/4/5** — touching the primary section targets
  affects every primary worksheet. Snapshot tests need updating in
  the same commit, otherwise the regression count balloons.
- **2.7 revision tips** — changing the category set means existing
  worksheets in the library that have `revision-tips` sections in
  the OLD format will look weird if regenerated. Mitigation: the
  builder's `isGenericRevisionTips` already detects pre-Phase-3
  shapes; extend it to also flag the OLD 5-category format so the
  validator rebuilds.
- **2.1 SEND collapse** — touching three live code paths at once.
  Mitigation: ship 2.1 as the last commit on the branch so a
  partial revert preserves 2.2-2.8.
