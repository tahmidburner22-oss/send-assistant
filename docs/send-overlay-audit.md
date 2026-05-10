# SEND Overlay Audit

This document captures what the `overlayEngine.ts` module does, the design
rules it follows, and the improvements landed in PR 2. It is aimed at
anyone reviewing whether the SEND overlays are preserving the academic
quality of the underlying worksheet.

## Contract

The overlay engine must:

1. **Never remove or reorder base sections.** The original worksheet's
   section order and IDs are considered part of the academic contract.
2. **Never mutate diagram/image references.** Images, `imageUrl`,
   `assetRef`, `svg`, `caption` fields are frozen.
3. **Affect formatting and presentation only.** Scaffolding goes in
   separate `send-support` sections (`isOverlay: true`) inserted AFTER
   each question — never inside the question text itself.

Three independent dimensions are captured:

- **Challenge level** = ability tier (Foundation / Standard / Higher / Scaffolded)
- **Access method** = SEND overlay (Dyslexia / ADHD / ASC / MLD / EAL / ...)
- **Language complexity** = reading age / EAL overlay

## Structural integrity — runtime check

`applyOverlays()` now performs a post-condition check
(`assertBaseSectionsPreserved`) that verifies every non-overlay base section
has the **same** `id`, `type`, `content`, `marks`, `imageUrl`, `assetRef`,
and `title` after overlays have been applied. In development this **throws**
loudly if violated. In production it logs to the console but does not take
down the worksheet pipeline.

The pre-existing structural-hash check
(`structurePreserved === structuralHash === baseStructuralHash`) remains in
place as a quick signal for the UI.

## Overlays by SEND need

| SEND need | What the overlay does | Notes |
| --- | --- | --- |
| **Dyslexia** | One-off support panel after the learning objective (sentence starters, line-cover technique, command-word cue, bold-term cue) + a compact per-question cue "Cover the page, answer one line at a time." | **PR 2 improvement:** previously the full 4-line panel repeated under every question. Dyslexic readers find clutter hardest, so the full panel is now a one-off. |
| **ADHD / Focus** | Per-question 4-tick checklist + brain breaks scaled to worksheet length (every ~25%, minimum 3 Qs apart). | **PR 2 improvement:** previously hard-coded "every 3 questions". A 5-question worksheet was getting too many breaks, a 15-question one too few. |
| **ASC / Asperger / Autism** | Literal "what you need to do" box on every question, mirroring the worked example. | Unchanged — the literal framing is the whole point for ASC. |
| **EAL** | Language-support box (word bank reference + command-word decoder) under every non-vocab question. | Bilingual vocabulary glossary is additive. Currently covers Romanian and Spanish; expand `TERM_TRANSLATIONS` in `overlayEngine.ts` for more languages. |
| **MLD** | Hint + sentence starter + Key Vocabulary cue (3 lines). | **PR 2 improvement:** deduplicated the "word bank" line that overlapped with the Key Vocabulary cue. |
| **SLCN** | Three sentence frames + Key Vocabulary link. | Unchanged. |
| **SEMH / Anxiety / Mental Health** | Per-question encouragement + a mid-sheet "Check In" prompt at the halfway point. | **PR 2 improvement:** previously the check-in fired at Q3 regardless of total Qs. |
| **VI** | All-text confirmation + large-print/screen-reader cue. | Unchanged. |
| **HI** | Written-instructions confirmation + Key Vocabulary cue. | Unchanged. |
| **PDA / ODD** | Invitational language, choice of where to start, optional break. | Unchanged — aligns with PDA-informed practice. |
| **Dyspraxia / DCD** | Write-alternatives (circle/tick/underline) + frame + large answer boxes. | Unchanged. |
| **Dyscalculia** | 5-step numeric recipe on calculation questions ONLY. Definition / recall questions get a lighter "vocabulary first" cue. | **PR 2 improvement:** previously the 5-step recipe was applied to every question regardless of type — it was irrelevant to definition questions and cluttered the page. The new `isCalculationSection()` helper checks the section type AND content for command words (calculate, solve, find, compute, evaluate, etc.). |
| **Tourettes / Tic support** | Scaled "take a breath" breaks, same cadence rule as ADHD. | **PR 2 improvement:** same scaling fix as ADHD. |
| **Working memory** | Key Vocabulary cue + write-key-facts cue + one-step-at-a-time cue, merged into 3 lines. | **PR 2 improvement:** deduplicated the double "check Key Vocabulary" lines. |
| **Older learners / Adult** | Study tip + note-taking tip + exam-technique tip. | Unchanged. |

## Quality verification

When reviewing a worksheet with an overlay applied, check:

1. The base sections (non-`isOverlay`) are **identical** to the pre-overlay
   version. The new runtime assertion will catch regressions here.
2. Every question still has its full content, marks, and diagram.
3. The inserted `send-support` sections appear **after** each question, not
   inside it.
4. Brain breaks / check-ins scale sensibly with worksheet length.
5. Dyscalculia recipe only appears on calculation questions.

## Expanding the engine

To add a new SEND need:

1. Add the label to `SEND_LABELS` at the top of `overlayEngine.ts`.
2. Implement a `buildXyzSupport(sections)` function following the existing
   pattern (iterate, push section, skip non-question sections,
   `buildSupportSection()` for each cue).
3. Wire it into `applySendSupport()`.
4. Add documentation to the table above.
