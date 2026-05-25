# Presentation Maker Overhaul — Session Handoff

## How to resume

1. `git checkout feat/presentation-maker-overhaul && git pull`
2. Open the **LEDGER** below.
3. Pick the FIRST `[ ]` item, do it, mark `[x]`, commit, push.
4. If you finish a phase, update the **Status** table at the top.

## Status

| Phase | Status     | Last commit                          |
|-------|------------|--------------------------------------|
| 0     | scaffolding | _initial_                            |
| 1     | not started | —                                    |
| 2     | not started | —                                    |
| 3     | not started | —                                    |
| 4     | not started | —                                    |
| 5     | not started | —                                    |
| 6     | not started | —                                    |

## Files most-likely to touch

- `client/src/pages/tools/PresentationMaker.tsx` (4,695 lines — the big one)
- `client/src/lib/subject-profiles.ts` — subject palettes + spec anchors
- `client/src/lib/presentation-templates.ts` — template descriptors
- `client/src/lib/sendPromptFragments.ts` — SEND theme overrides
- `client/src/lib/presentation-maker-enhancements.ts` — pure-fn helpers
- `client/src/components/PresentationMakerEnhancementsPanel.tsx` — extras tabs
- `client/src/components/CompanionQRDialog.tsx` — for AfL polling (item 41)
- `client/src/components/SendToMenu.tsx` — for send-this-slide (item 42)
- `client/src/lib/curriculumBank.ts` — spec catalogue (item 17)
- `client/src/lib/misconceptionBank.ts` / `misconception-bank.ts` (item 18)
- `client/src/lib/pdf-generator-v2.ts` — PDF email (item 44)
- `shared/aiSchemas.ts` — server-side validation parity (item 27)
- `server/email/index.ts` and `server/routes/ai.ts` — email path
- `server/routes/presentationLibrary.ts` — schema validation

## Ledger (all 56 items + the top-5 priority highlights)

Tag legend: `[VIS]` visual, `[CONT]` content/AI, `[CLASS]` classroom,
`[ACC]` accessibility, `[EXP]` export, `[INF]` infrastructure.

### Phase 1 — Visual foundation
- [ ] 01 [VIS] Add 2–4 dark themes to `THEMES` (Studio Dark, Slate Mono, Editorial)
- [ ] 02 [VIS] Wire `subject-profiles.ts` palettes into `composeTheme` — auto-themed by subject
- [ ] 03 [VIS] Subject-aware fonts (Inter STEM, Source Serif humanities, display CPD)
- [ ] 04 [VIS] Add layouts: `split-stat`, `comparison-table`, `timeline-horizontal`, `card-grid`, `before-after`, `quote-portrait`, `diagram-callouts`
- [ ] 05 [VIS] 3 title-slide variants (split-image, asymmetric, module-divider)
- [ ] 06 [VIS] Section-divider slide type
- [ ] 07 [VIS] Premium card system (raised / ghost / outline / gradient-border)
- [ ] 08 [VIS] Type-aware mini thumbnails in `SlidePreview`
- [ ] 14 [VIS] Distinguish duplicate accent colours in `SLIDE_TYPE_COLOURS`
- [ ] 15 [VIS] Primary slides honour chosen theme (currently hard-coded gradients)
- [ ] 16 [VIS] Subject-mascot system

### Phase 2 — Subject & slide-type breadth
- [ ] 20 [CONT] Add SUBJECT_PROFILES: sociology, psychology, business, RS, drama, music, media studies, spanish, german, generic MFL
- [ ] 28 [CONT] New slide type: `cold-call`
- [ ] 29 [CONT] New slide type: `live-model` (I do/We do/You do)
- [ ] 30 [CONT] New slide type: `do-now`
- [ ] 31 [CONT] New slide type: `choose-your-task`
- [ ] 32 [CONT] New slide type: `stuck-help` (escalating hints)
- [ ] 33 [CONT] New slide type: `homework`

### Phase 3 — Classroom interactivity
- [ ] 37 [CLASS] Live countdown timer in fullscreen mode
- [ ] 38 [CLASS] Click-to-reveal answers (pause-and-solve, mini-quiz, check-understanding, model-answer, worked-example)
- [ ] 39 [CLASS] Build-in animations (bullets fade in on Down)
- [ ] 40 [CLASS] Real presenter view (current + next + notes + clock + B/W blackout)
- [ ] 41 [CLASS] AfL polling QR via existing CompanionQRDialog
- [ ] 42 [CLASS] "Send this slide to..." menu via existing SendToMenu
- [ ] 49 [ACC] Independent display preferences (zoom, font, contrast — separate from SEND)
- [ ] 50 [ACC] Read-aloud (Web Speech API)
- [ ] 51 [ACC] Keyboard-only navigation audit
- [ ] 46 [INF] Autosave drafts to IndexedDB

### Phase 4 — Export & integrity
- [ ] 09 [EXP] Pexels/Unsplash server-side image proxy with cache + licence
- [ ] 10 [EXP] PPTX export embeds real images via `addImage`
- [ ] 11 [VIS] Programmatic diagrams (circuit/cell/water-cycle/Venn/timeline/flowchart)
- [ ] 12 [VIS] Inline icons in bullets
- [ ] 13 [VIS] Equation/code styling (inline mono chip; KaTeX optional)
- [ ] 44 [EXP] Real PDF email attachment via pdf-generator-v2
- [ ] 45 [EXP] Rich print handouts (use FullSlideView, not hand-rolled HTML)
- [ ] 52 [EXP] Image licence record persisted in slide JSON

### Phase 5 — Content rigour
- [ ] 17 [CONT] Spec-point catalogue from curriculumBank
- [ ] 18 [CONT] Use misconceptionBank, not LLM hallucinations
- [ ] 19 [CONT] Per-board × per-subject command-word lists
- [ ] 21 [CONT] 18-slide plan respects template bias
- [ ] 22 [CONT] Coverage check via coverageAggregator/coverageMapBuilder
- [ ] 23 [CONT] Fact-check pass on factual slides
- [ ] 24 [CONT] Mandatory `differentiation` validator on activity slides
- [ ] 25 [CONT] "Generate speaker notes" batch button
- [ ] 26 [CONT] Reading-age verifier (Flesch-Kincaid)
- [ ] 27 [INF] Move client schema to `shared/aiSchemas.ts`; validate on save/email/library
- [ ] 35 [CONT] I-do/We-do/You-do worked-example progression
- [ ] 36 [CONT] Vocab-reference → Flashcards push button

### Phase 6 — Quality, telemetry, identity
- [ ] 34 [CONT] Pedagogy badges (Rosenshine #N / Bloom band) — teacher-only
- [ ] 47 [CLASS] Exit-ticket → marksheet pipe (capture pupil responses)
- [ ] 48 [CLASS] Cohort-aware regeneration ("Year 9 Set 4")
- [ ] 53 [INF] Slide-level diff & rollback (version history)
- [ ] 54 [INF] School identity (logo, brand colours, motto)
- [ ] 55 [CONT] Variant generator (3 versions of one slide)
- [ ] 56 [INF] Per-slide telemetry surfaced as "your patterns" panel
- [ ] 43 [CLASS] Pupil-facing companion view (deck-level)
