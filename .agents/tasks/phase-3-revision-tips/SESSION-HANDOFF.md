# Phase 3 — Session Handoff

This file is the **resume point** for any fresh chat picking up Phase 3.
Read it first, then `PHASE-PLAN.md`, then proceed.

Last updated: see `git log -1 --format=%cI -- .agents/tasks/phase-3-revision-tips/SESSION-HANDOFF.md`

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo, branch phase-3-revision-tips.
Resume: .agents/tasks/phase-3-revision-tips/SESSION-HANDOFF.md
Plan:   .agents/tasks/phase-3-revision-tips/PHASE-PLAN.md
Constraint: do not read ai.ts or WorksheetRenderer.tsx in full;
            grep for the named exports first and read narrow ranges only.
            Sandbox is INTEGRATIONS_ONLY — do not run npm install.
Goal: complete Phase 3 (revision-tips section type — builder + prompt +
      post-validator + renderer + tests) and open the PR.
```

## What is done

- `client/src/lib/revisionTipsBuilder.ts` — new single source of truth
  for the Revision-Tips surface. 502 lines. Public API:
  `buildRevisionTips`, `renderRevisionTipsAsMarkerBlock`,
  `isGenericRevisionTips`, plus types `RevisionTip`,
  `RevisionTipsInputs`, `RevisionTipsOutput`. Pure / deterministic.
  Mirrors the `selfReflectionBuilder.ts` pattern verbatim — imports
  `extractTopicNounPhrase`, `pickCommandWords`, `classifySubject`,
  `classifySendRegister` from there rather than duplicating logic.
  Returns exactly five tips in the canonical category order
  (command-word, misconception, method, mark-scheme, time). Each
  tip is examiner-voice, UK English, ≤ 200 chars. Marker-block format
  is `SUBTITLE: <text>\nTIPS:\n1. LABEL: <text>\n2. …`.
- `client/src/lib/selfReflectionBuilder.ts` — `classifySubject`,
  `classifySendRegister`, the `SubjectFamily` and `SendRegister`
  types are now exported. No behavioural change. Lets the
  Revision-Tips builder reuse the same five SEND register branches and
  same subject family taxonomy as the Self-Reflection builder.
- `client/src/lib/worksheet-generator.ts` — `revision-tips` added to
  the `WorksheetSection` union with a Phase 3 comment.
- `client/src/lib/ai.ts`:
  * Imports `buildRevisionTips` + `renderRevisionTipsAsMarkerBlock`
    next to the Phase 2 `selfReflectionBuilder` import.
  * Adds `'revision-tips'` to the default `secs` list in the
    structured-path entry.
  * Adds `wantRevisionTips = secs.includes('revision-tips')` flag
    immediately after `wantSelfReflection`.
  * Adds a REVISION TIPS rule to `structuredSystemSections` next to
    SELF REFLECTION — examiner voice, UK English, fixed five-tip
    order, must reference the worksheet's command word / a real
    misconception / mark structure / a time budget anchored to total
    marks. Hard ban on generic stems and placeholders.
  * Adds a structured-path emit immediately before the self-reflection
    emit. The emit pushes a `{"title":"Examiner Tips","type":
    "revision-tips","teacherOnly":false,"content":<builder output>}`
    line so the AI sees the canonical structure as a worked example.
- `client/src/lib/worksheetPostValidator.ts`:
  * Imports `buildRevisionTips`, `renderRevisionTipsAsMarkerBlock`,
    `isGenericRevisionTips` from `./revisionTipsBuilder`.
  * Adds three pure helpers — `collectCommandWordsUsed` (8 max,
    leading-verb scrape against a curated awarding-body list),
    `collectMisconceptions` (4 max, scraped from common-mistakes
    section, bullet- and prefix-stripped, capped 200 chars), and
    `collectMarksUsed` (`section.marks` then `[N marks]` regex). These
    let the validator anchor the rewrite to the worksheet's actual
    questions without further plumbing through the chain.
  * Adds `enforceRevisionTipsPresence(ws, opts)` — pure / idempotent.
    Detects generic content via `isGenericRevisionTips` (fewer than 5
    tip-shaped lines, no command-word reference, no topic anchor,
    generic stems like "revise carefully", literal placeholders like
    `[Tip 1]` / `___`). When detected, replaces the section content
    with the deterministic builder output. When the section is
    missing, no-ops (Phase 3 is opt-in via the section toggle, same
    lock as Self-Reflection).
  * Wires the new validator into `runWorksheetPostValidators`
    immediately after `enforceSelfReflectionTopicAnchor`.
- `client/src/components/WorksheetRenderer.tsx`:
  * Imports `buildRevisionTips` + `RevisionTip` from
    `@/lib/revisionTipsBuilder` next to the Phase 2 `buildSelfReflection`
    import.
  * Adds palette entry `revision-tips` (house-style accent, no icon,
    label "Examiner Tips") and the primary-school title fallback row.
  * Adds `revision-tips` to the `isAlwaysStudentVisible` allow-list
    and to the page-break-before set (panel starts on its own page).
  * Excludes `revision-tips` from the question-section filter at
    line ~4759.
  * Adds `RevisionTipsSection` component between
    `SelfReflectionSection` and `WordBankSection`. Numbered tip cards,
    accent-bordered panel, no icons. Parses `SUBTITLE:` / `TIPS:` /
    numbered + labelled lines; falls back to `buildRevisionTips` when
    the parsed output has fewer than 5 tips and topic + subject are
    available.
  * Dispatches the new component immediately before `self-reflection`
    in the section switch.
- `client/src/pages/Worksheets.tsx`:
  * Adds `'revision-tips'` to `ALL_SECTIONS` (between `section-c` and
    `self-reflection`).
  * Adds the section-toggle row labelled "Examiner Tips".
  * Adds `'revision-tips': 0.5` to the `pageWeights` estimator.
  * Adds `revision-tips` to `REMOVABLE_SECTION_PRIORITY` immediately
    after `self-assessment` so it's a low-priority drop under page
    pressure.
- `server/tests/worksheetScrutiny.test.ts` — new Phase 3 test suites:
  * `buildRevisionTips` — five tips in fixed canonical order;
    topic-anchors on all four representative subjects (maths Y9
    "Adding fractions", English Lit Y10 "Macbeth Act 1 Scene 5",
    Biology Y11 "Bioenergetics", History KS3 "Norman Conquest");
    echoes the first command word actually used; falls back to
    per-subject defaults; surfaces a supplied misconception verbatim
    (sentence-cased, bullet-stripped, capped); time tip anchored to
    total marks and stretch tariff; mark-scheme tip anchored to top
    tariff and awarding body; SEND-register shortening for sentence-
    starter; older-learner subtitle; purity invariant.
  * `renderRevisionTipsAsMarkerBlock` — marker block format, round
    trip through `isGenericRevisionTips` returns false.
  * `isGenericRevisionTips` — empty / placeholder stems / fewer than
    5 tip-shaped lines / no topic anchor / no UK command word —
    flagged generic. Builder output and teacher-edited variants —
    not flagged.
  * `enforceRevisionTipsPresence` — no-op when no revision-tips
    section; warn-and-skip when no topic; rewrite happy path; never-
    overwrite invariant; idempotency; scrapes worksheet command words
    (Q1 "Show that …" wins over Q2 "Calculate …"); scrapes the
    Common Mistakes misconception verbatim; scrapes the largest mark
    tariff; ignores teacher-only sections.
- `.agents/tasks/phase-2-self-reflection/SESSION-HANDOFF.md` updated:
  Phase 2 marked SHIPPED with the merge commit. "What is left"
  reduced to a pointer at this Phase 3 directory.
- `.agents/tasks/phase-3-revision-tips/PHASE-PLAN.md` (new — phase
  scope, definition of done, sizing rules, conventions inherited).
- `.agents/tasks/phase-3-revision-tips/SESSION-HANDOFF.md` (this file).

## What is left (in this branch)

- **Task G — CI run.** `npm test` + `tsc --noEmit` will run on PR push.
  Sandbox cannot run them locally (`INTEGRATIONS_ONLY`). If CI raises
  any failures, fix them on this branch.

- **Task H — PR open.** PR opened — see PR link in chat.

## Diff size note

The phase plan caps PRs at ~700 net lines / ~12 files. Phase 3 came
in at ~1,375 lines of source + tests across ~10 files (excluding the
two new task docs). The work splits cleanly along the validator /
renderer boundary if a future reviewer wants to chunk it, but every
piece is required for the feature to ship end-to-end (the validator
needs the builder, the renderer needs the section type, the prompt
needs the validator to enforce the structure). Decision: ship as one
PR with the size noted in the PR body. Phase 4+ should aim back at
the 700-line target.

## Conventions to honour (inherited from Phases 1 and 2)

- **Single source of truth.** The Revision-Tips surface lives in
  `revisionTipsBuilder.ts`. No hand-rolled tip strings anywhere else
  in the codebase. The prompt scaffold, the validator fallback, the
  renderer's pad-fallback, and any future tests all import from one
  place.
- **Schema / prompt / validator alignment.** Phase 3 introduced no new
  per-section schema field. If a future phase needs one (e.g. a
  per-tip `tipCategory` annotation), mirror it across `aiSchemas.ts`
  (Zod), `worksheet-generator.ts` (interface), and the per-question
  contract block in `ai.ts`.
- **Renderer stays subject-aware** through `formatContent`'s `subject`
  option. Phase 3 also threads `topic` + `subject` to
  `RevisionTipsSection` — follow the Phase 2 pattern.
- **Sciences do NOT get the maths-only working-out box.** Phase 1 lock.
- **Never invent spec codes.** Phase 1 lock.

## Files modified in this branch

```
.agents/tasks/phase-2-self-reflection/SESSION-HANDOFF.md  (bookkeeping: marked SHIPPED)
.agents/tasks/phase-3-revision-tips/PHASE-PLAN.md         (new)
.agents/tasks/phase-3-revision-tips/SESSION-HANDOFF.md    (this file)
client/src/lib/revisionTipsBuilder.ts                     (new — 502 lines)
client/src/lib/selfReflectionBuilder.ts                   (export classifySubject/classifySendRegister + types)
client/src/lib/worksheet-generator.ts                     (union + interface comment)
client/src/lib/ai.ts                                      (import + flag + rule + emit + plumb)
client/src/lib/worksheetPostValidator.ts                  (+ 3 helpers + enforceRevisionTipsPresence + plumb)
client/src/components/WorksheetRenderer.tsx               (palette + dispatch + RevisionTipsSection)
client/src/pages/Worksheets.tsx                           (ALL_SECTIONS + toggle + pageWeights + REMOVABLE_SECTION_PRIORITY)
server/tests/worksheetScrutiny.test.ts                    (Phase 3 test suites)
```
