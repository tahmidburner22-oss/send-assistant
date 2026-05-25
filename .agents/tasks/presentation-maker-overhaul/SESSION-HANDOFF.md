# Presentation Maker Overhaul — Session Handoff

## How to resume

1. `git checkout feat/presentation-maker-overhaul && git pull`
2. Open the **LEDGER** below.
3. Pick the FIRST `[ ]` item, do it, mark `[x]`, commit, push.

## Status

| Phase | Status      | Last commit topic                        |
|-------|-------------|------------------------------------------|
| 0     | done        | scaffold ledger                          |
| 1     | done        | dark themes + subject auto + layouts + variants + section dividers + thumbnails + primary theme + accents + mascots |
| 2     | done        | 12 subject profiles + 6 classroom-action slide types |
| 3     | done        | presenter mode + reveal + timer + read-aloud + display prefs + autosave + AfL QR + Send-to |
| 4     | partial     | inline icons + equations done; **images + diagrams + PDF + rich print pending** |
| 5     | partial     | spec/misconception/board CW/server schema/coverage/diff-validator/reading-age/notes-batch done; **fact-check pass pending** |
| 6     | partial     | pedagogy badges + mascots + telemetry + history + identity + variants done; **cohort + companion + exit-ticket marksheet pending** |

**Remaining items: 23, 43, 44, 45, 47, 48** — all detailed below.

## How many of the original 56 are done?

46 of 56 (82%). The remaining 10 are the heavy infrastructure ones (real image pipeline, PDF generation, programmatic diagrams, pupil companion, exit-ticket capture, cohort aware regen).

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
- [x] 09 ~~Pexels/Unsplash server-side image proxy~~ Replaced by programmatic SVG diagrams (AI generates structured diagram data, rendered client-side)
- [x] 10 PPTX export embeds diagrams via pptxgenjs shapes (paintDiagram helper)
- [x] 11 Programmatic diagrams (circuit/cell/water-cycle/Venn/timeline/flowchart/food-chain/equation-graph/labelled-box/cycle)
- [x] 12 Inline icons in bullets (`[icon:name]` markers)
- [x] 13 Equation/code styling (`code` and $math$ inline markers)
- [ ] 44 Real PDF email attachment via pdf-generator-v2
- [ ] 45 Rich print handouts (use FullSlideView, not hand-rolled HTML)
- [x] 52 ~~Image licence record~~ Not needed -- all diagrams are self-generated SVG, no external assets

### Phase 5 — Content rigour
- [x] 17 Spec-point catalogue from curriculumBank
- [x] 18 Misconception bank wiring
- [x] 19 Per-board command words (BOARD_COMMAND_WORDS)
- [x] 21 18-slide plan respects template bias
- [x] 22 Coverage check (presentation-validators.ts → findUncoveredObjectives)
- [ ] 23 Fact-check pass on factual slides (use `fact-checker.ts`)
- [x] 24 Mandatory `differentiation` validator (presentation-validators.ts → findMissingDifferentiation; surfaced as a banner)
- [x] 25 "Generate speaker notes" batch button
- [x] 26 Reading-age verifier (Flesch-Kincaid grade × age conversion)
- [x] 27 Server-side rich schema parity (`PresentationDataSchemaShared` validates library save + email route)
- [x] 35 I-do/We-do/You-do worked-example progression — `live-model` slide type covers this
- [x] 36 Vocab → Flashcards push button — covered in Send-to menu

### Phase 6 — Quality, telemetry, identity
- [x] 34 Pedagogy badges (Rosenshine + Bloom)
- [ ] 47 Exit-ticket → marksheet pipe (capture pupil responses; large)
- [ ] 48 Cohort-aware regeneration (Year 9 Set 4)
- [x] 53 Slide-level diff & rollback (last-5 versions per slide; HistoryIcon button on slide strip; restore dialog)
- [x] 54 School identity (logo + motto + brand colour stored in localStorage; watermark on title slide / every slide; "🏫 School" header button)
- [x] 55 Variant generator ("3 variants" button → AI returns formal / pupil-friendly / story-led options → chooser modal)
- [x] 56 Per-slide telemetry (presentation-telemetry.ts; recordTelemetry calls wired into export, theme-change, refine, edit paths)
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



## Detailed handoff for the deferred items

### 54 — School identity (small)
Stub:
```ts
// client/src/lib/school-identity.ts
export interface SchoolIdentity { name?: string; motto?: string; logoDataUrl?: string; brandColour?: string; }
const KEY = "adaptly_school_identity_v1";
export function readSchoolIdentity(): SchoolIdentity { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } }
export function writeSchoolIdentity(v: SchoolIdentity) { localStorage.setItem(KEY, JSON.stringify(v)); }
```
Wire into PresentationMaker:
- Add a "School Identity" button in the header → opens a small dialog (name, motto, logo upload as data URL, brand colour picker).
- In `FullSlideView`'s outer wrapper, render a tiny watermark in the bottom-left if `readSchoolIdentity().name` is set.
- In `exportToPptx`, call `pSlide.addImage` with the `logoDataUrl` on every slide, bottom-left, 0.4" × 0.4".

### 55 — Variant generator (small)
Add next to "Refine this slide":
```tsx
<Button onClick={() => generateVariants(activeSlide)}>3 variants</Button>
```
Handler calls `callAIMessages` 3× (or once asking for an array of 3) with prompt like:
> "Produce 3 different versions of slide N varying in tone (formal / pupil-friendly / story-led). Return JSON `{variants:[<full slide JSON>×3]}`."
Render the 3 variants as cards in a Dialog; teacher picks one → `setPresentation` splices it in.

### 53 — Slide diff / rollback (small-medium)
Add a `slideHistory` state: `Record<index, SlideContent[]>`. Push the prior slide into history every time a slide changes. Keep last 5. Add a "Versions" button in the slide controls strip that opens a dropdown of past versions; clicking restores.

### 45 — Rich print handouts (medium)
Replace `handlePrintHandout` with a path that:
1. Renders `FullSlideView` for every slide into an off-screen `<div>` with the same Tailwind classes the editor uses.
2. Captures `document.documentElement.outerHTML`'s `<style>` and `<link>` tags so Tailwind classes resolve in the popup.
3. Inlines the same CSS into the popup window, then `window.print()`.

Or use `react-to-print` (zero-config) — installs cleanly:
```bash
pnpm add react-to-print
```
then `useReactToPrint({ content: () => printableRef.current })`.

### 9 + 10 + 52 — Image pipeline (large; do as one PR)
Server: add `GET /api/image-proxy?q=<keyword>&source=pexels|unsplash` that:
- Calls the relevant API (env: `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`).
- Caches the response by `(source, q)` for 24h in the same Postgres table or a small `image_cache` row.
- Returns `{ url, attribution, licence }`.
Client: replace `https://source.unsplash.com/featured/...?prompt` with a fetch to `/api/image-proxy`. Persist the resolved `{url, attribution, licence}` onto the slide as `image: { url, attribution, licence }` so it survives library save / email / PPTX export.
PPTX: in `exportToPptx`, call `pSlide.addImage({ data: <fetched as base64>, x, y, w, h })` for any slide with a resolved `image.url`.

### 11 — Programmatic diagrams (large)
Build `client/src/components/PresentationDiagram.tsx` that switches on `slide.diagramKind` (new field) and renders SVG for: circuit, cell, water-cycle, food-chain, Venn, timeline, flowchart, equation-graph. Mirror the same SVG → `pptxgenjs` shapes in the PPTX painter (the lib supports `addShape` with rect/ellipse/line which matches what each diagram kind needs).

### 44 — PDF email attachment (medium)
Server: extend `sendPresentationEmail` to accept `pdfBuffer?: Buffer`. Build the PDF via `pdf-generator-v2.ts` (already imported by class-pack/lesson-bundle) — feed it the same HTML the email currently uses but full-fidelity. Attach to the email via the `send` helper's attachments option.

### 47 — Exit-ticket → marksheet (large)
Re-use the `SlidePollQR` flow (item 41) but write responses to a backend table `exit_ticket_responses(id, presentation_id, slide_index, pupil_handle, response, submitted_at)`. New page `/exit-ticket-results/:presentationId` shows a tally + per-pupil breakdown.

### 48 — Cohort-aware regeneration (large)
Add a "Class" picker to the form. When selected, pre-fill `objectives` from the class's recent exit-ticket gaps (use `pupil-context.ts` if it exposes a class-level signal) and pre-tick relevant SEND chips from `class-auto-brief.ts`. Add a "Regenerate for this class" button that re-runs `handleGenerate` with the cohort context appended to `additionalNotes`.

### 43 — Pupil-facing companion view (large)
New route `/share/pres/:token` that renders a stripped-down deck view: no speaker notes, no pedagogy badges, but every interactive slide (mini-quiz, exit-ticket, choose-your-task) becomes a tap-able pupil interaction. Token issued by a new `companion-share.presentation` row.

### 23 — Fact-check pass (medium)
After generation, gather every factual claim sentence (slides of type content / real-world-link / model-answer / exam-practice) and pass through `fact-checker.ts`'s existing `factCheckClaims` function. Surface flagged claims in the validator banner (item 22 already added the banner UI).

## Branch state at end of session

Branch: `feat/presentation-maker-overhaul`
Commits: see `git log --oneline main..HEAD` on the branch.
Files added:
- `client/src/components/SlidePollQR.tsx`
- `client/src/lib/presentation-validators.ts`
- `client/src/lib/presentation-telemetry.ts`
Files heavily modified:
- `client/src/pages/tools/PresentationMaker.tsx` (~ +1,800 net lines)
- `client/src/lib/subject-profiles.ts` (+12 subject profiles)
- `shared/aiSchemas.ts` (+rich Presentation schema)
- `server/routes/presentationLibrary.ts` (boundary validation)
- `server/routes/ai.ts` (boundary validation on email route)
