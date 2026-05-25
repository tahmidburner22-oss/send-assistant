# Presentation Maker Overhaul — Session Handoff

## How to resume

1. `git checkout feat/presentation-maker-overhaul && git pull`
2. Open the **LEDGER** below.
3. Pick the FIRST `[ ]` item, do it, mark `[x]`, commit, push.

## Status

| Phase | Status      | Last commit topic                        |
|-------|-------------|------------------------------------------|
| 0     | done        | scaffold ledger                          |
| 1     | done        | type-aware thumbnails + primary theme    |
| 2     | done        | 12 new subject profiles                  |
| 3     | done        | AfL polling QR + Send-to                 |
| 4     | partial     | inline icons/equations done; images + diagrams + PDF + rich print pending |
| 5     | partial     | spec/misconception/board CW/server schema done; coverage check + fact-check + diff validator + reading-age verifier pending |
| 6     | partial     | pedagogy badges + mascots done; identity + telemetry + diff + variant + cohort + companion + exit-ticket → marksheet pending |

## Files most-likely to touch (next)

- `client/src/pages/tools/PresentationMaker.tsx` (main file — now ~5,500 lines)
- `server/routes/ai.ts` — for image proxy + PDF route
- `server/routes/presentationLibrary.ts` — for school-identity persistence
- `client/src/lib/presentation-maker-enhancements.ts` — for variant generator + telemetry
- `shared/aiSchemas.ts` — for any new server-side validation
- `client/src/components/CompanionQRDialog.tsx` — pattern reference for pupil companion view (item 43)

## Where the AI prompt blocks live now

- **System prompt** assembled in `buildSlidePrompt` (~ L1145+).
- **Per-board command words** — `BOARD_COMMAND_WORDS` constant just above `buildSlidePrompt`.
- **Spec points** — pulled from `lookupByTopic` (curriculumBank.ts).
- **Misconceptions** — pulled from `formatMisconceptionsForPrompt` (misconception-bank.ts).
- **Subject profile** — `buildSubjectPromptFragments` (subject-profiles.ts).
- **SEND** — `composeSendNoteForPresentation` (sendPromptFragments.ts).
- **Subject-mascot** — `getSubjectMascot(subject)` helper near top of PresentationMaker.tsx.
- **Pedagogy badges** — `SLIDE_TYPE_PEDAGOGY` constant near `SLIDE_ICONS`.
- **Inline rich text** — `richText(text)` helper near `SLIDE_ICONS`. Apply to body/question/title text in renderers when extending.

## Things to know about the architecture

- **Reveal levels**: `revealLevel` is passed to `FullSlideView` from the parent.
  Editor mode = `Infinity`; presenter mode = a 0..N counter incremented by →/Space.
  When adding new reveal-able content, gate it on `revealLevel >= n`.
- **Theme cascade**: `subject-auto` → `subject-profiles.palette` → SEND override → CSS variable `--pres-font` → display-prefs override.
- **Slide types**: 32 + 7 (Phase 1 section-divider + Phase 2 actions) = **42 slide types**.
- **Layouts**: 10 + 7 (Phase 1) = **17 layouts**.
- **Subject profiles**: 12 → **24 subjects**.
- **Themes**: 10 + 4 (Phase 1) + 1 (subject-auto) = **15 themes**.
- **Server boundary validation**: `PresentationDataSchemaShared` in `shared/aiSchemas.ts` is enforced by both the library save and email routes.

## Ledger

### Phase 1 — Visual foundation
- [x] 01 4 dark themes (Studio Dark, Slate Mono, Editorial, Forest Dark)
- [x] 02 Subject palettes auto-themed (`subject-auto` theme key)
- [x] 03 Subject-aware fonts (Inter / Source Serif / Georgia / Verdana)
- [x] 04 7 new layouts (split-stat, comparison-table, timeline, card-grid, before-after, quote-portrait, diagram-callouts)
- [x] 05 3 title-slide variants (centered/split-image/asymmetric/module-divider)
- [x] 06 section-divider slide type
- [x] 07 Premium card system (used implicitly across new layouts)
- [x] 08 Type-aware thumbnails in SlidePreview
- [x] 14 Distinguish duplicate accent colours
- [x] 15 Primary slides honour chosen theme
- [x] 16 Subject-mascot system

### Phase 2 — Subject & slide-type breadth
- [x] 20 12 new subject profiles
- [x] 28 cold-call
- [x] 29 live-model (I do · We do · You do)
- [x] 30 do-now
- [x] 31 choose-your-task
- [x] 32 stuck-help (hint ladder)
- [x] 33 homework

### Phase 3 — Classroom interactivity
- [x] 37 Live countdown timer in fullscreen
- [x] 38 Click-to-reveal (worked-example, MCQ, pause-and-solve, model-answer, mini-quiz)
- [x] 39 Build-in animations (reveal-on-arrow approximates this)
- [x] 40 Real presenter view (current + next + notes + clock + B/W blackout)
- [x] 41 AfL polling QR (`SlidePollQR` new component)
- [x] 42 Send-to-other-tools menu
- [x] 49 Display preferences (zoom / font / contrast)
- [x] 50 Read-aloud (Web Speech API)
- [x] 51 Keyboard nav audit (PowerPoint conventions: → reveal, ↓ next, R reveal, B/W blackout, T pause, N notes, Esc)
- [x] 46 Autosave drafts to localStorage with recover prompt

### Phase 4 — Export & integrity
- [ ] 09 Pexels/Unsplash server-side image proxy with cache + licence record
- [ ] 10 PPTX export embeds real images via `addImage`
- [ ] 11 Programmatic diagrams (circuit/cell/water-cycle/Venn/timeline/flowchart)
- [x] 12 Inline icons in bullets (`[icon:name]` markers)
- [x] 13 Equation/code styling (`code` and $math$ inline markers)
- [ ] 44 Real PDF email attachment via pdf-generator-v2
- [ ] 45 Rich print handouts (use FullSlideView, not hand-rolled HTML)
- [ ] 52 Image licence record persisted in slide JSON

### Phase 5 — Content rigour
- [x] 17 Spec-point catalogue from curriculumBank
- [x] 18 Misconception bank wiring
- [x] 19 Per-board command words (BOARD_COMMAND_WORDS)
- [x] 21 18-slide plan respects template bias
- [ ] 22 Coverage check via coverageAggregator/coverageMapBuilder
- [ ] 23 Fact-check pass on factual slides (use `fact-checker.ts`)
- [ ] 24 Mandatory `differentiation` validator on activity slides (post-generation pass that retries any activity slide without `differentiation`)
- [x] 25 "Generate speaker notes" batch button
- [ ] 26 Reading-age verifier (Flesch-Kincaid) — flag slides above the cap
- [x] 27 Server-side rich schema parity (`PresentationDataSchemaShared` validates library save + email route)
- [x] 35 I-do/We-do/You-do worked-example progression — `live-model` slide type covers this
- [x] 36 Vocab → Flashcards push button — covered in Send-to menu

### Phase 6 — Quality, telemetry, identity
- [x] 34 Pedagogy badges (Rosenshine + Bloom)
- [ ] 47 Exit-ticket → marksheet pipe (capture pupil responses; large)
- [ ] 48 Cohort-aware regeneration (Year 9 Set 4)
- [ ] 53 Slide-level diff & rollback (version history)
- [ ] 54 School identity (logo, brand colours, motto)
- [ ] 55 Variant generator (3 versions of one slide)
- [ ] 56 Per-slide telemetry "your patterns" panel
- [ ] 43 Pupil-facing companion view (deck-level)

## Suggested order for the next session

The remaining work breaks into these size buckets:

**Small (1 commit each, < 100 lines):**
24, 26, 56, 54, 55, 22

**Medium (1 commit each, 100–300 lines):**
45 (rich print), 53 (slide diff/rollback), 47 (exit-ticket marksheet), 23 (fact-check pass)

**Large (multi-file, server changes):**
9 + 10 + 52 (image pipeline — do as one), 44 (PDF email), 11 (programmatic diagrams), 43 (pupil companion view), 48 (cohort-aware regen)

I'd recommend the next session knock out all the **Small** ones (one commit each) before starting **Medium**.
