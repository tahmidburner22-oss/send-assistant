# Worksheet Quality — SEND + Visual Language + Pedagogy — Session Handoff

Workstream to make every Adaptly worksheet measurably stronger on the two
team-stated priorities — **content strength** and **SEND overlay
effectiveness** — by closing verified gaps in the existing (already-merged)
worksheet-quality infrastructure on `main` (#165). This is NOT a rebuild: the
visual-language system, scrutiny validators, enhanced SEND descriptions, the
QA scorecard and the 3-tier generator already exist; this workstream fixes the
gaps between them and the June-2026 scrutiny spec.

Last updated: 2026-06-03. Branch: `feat/worksheet-send-description-qa-legend`.

## Shipped in this branch

| ID | Title | Status | Files |
| --- | --- | --- | --- |
| 1a | **QA-score / SEND-fidelity ordering fix** | ✅ | `client/src/lib/ai.ts` — re-run the pure/idempotent `applyQaScore` as the genuine LAST step (after `applySendFidelityAudit` stamps `metadata.sendFidelityReport`). Previously the in-registry score ran first, so every SEND-tagged worksheet silently lost a flat **6/15** on `sendAdaptationQuality` against a report that did not yet exist. |
| 1b | **SEND Description Requirement enforcer** | ✅ | NEW `client/src/lib/sendDescriptionEnforcer.ts` (`enforceSendDescription`, `buildSendAdaptationSummary`, `hasMeaningfulSend`). Guarantees a "How this worksheet is adapted" block that NAMES the specific adaptation — incl. the autism sub-profile (PDA / sensory / social-communication / predictability / high-masking / Asperger / monotropism) — and describes it in 2–3 sentences. Sourced from `sendDescriptionsEnhanced.ts`. Wired into `ai.ts` after the fidelity audit. Pure/idempotent. |
| 2a | **Pupil legend on every worksheet** | ✅ | `client/src/components/WorksheetRenderer.tsx` — `showLegend` now defaults ON (`!== false`); removed the secondary-maths exclusion so maths gets the legend too (kept the exam-style + revision-mat exceptions). Added the `send-adaptation` section type to `SECTION_COLOUR_MAP` (blue) + `SECTION_LABELS`, and render the SEND note at the top of `MathsCompactLayout` (which otherwise renders questions only). |
| 3 | **Pedagogy completeness (prompt)** | ✅ | `client/src/lib/ai.ts` — additive `PEDAGOGY COMPLETENESS` directive in `structuredSystemSections`: a short **Do Now** retrieval starter (NOT counted in the numbered 1..N questions), a concise **real-world application** question in Section 3, and at least one **reasoning** question. Layout line now always shows "Do Now (Retrieval) →". No change to section counts / numbering / the renderer. |

Tests: NEW `client/src/lib/__tests__/sendDescriptionEnforcer.test.ts` (15) +
`client/src/lib/__tests__/qaScoreSendOrdering.test.ts` (5) — all green.

## Verification (this repo does NOT pass tsc cleanly — ~146 pre-existing errors)

- `npx tsc --noEmit | grep -cE 'error TS'` → **146 → 146** (zero net-new;
  confirmed by stashing the changes and re-counting).
- `npx vitest run client/src/lib/__tests__` → baseline **15 failed / 406
  passed**; with this branch **15 failed / 426 passed** (the 20 new tests pass;
  the 15 reds are pre-existing `enforceMarksBracketStyle` / IMP-09 cases in
  untouched code).
- `npx esbuild server/index.ts --platform=node --packages=external --bundle
  --format=esm` → clean (~1017kb).

## Deliberately descoped (with reasoning)

- **Wiring `getActivityIcon` / `getFlowArrow` / `getBorderStyleForSection`**
  into the renderer. The renderer already wires section icons (Lucide),
  difficulty dots and response-type symbols, and now the legend on every
  sheet. Adding these would DUPLICATE existing icons and add the very clutter
  the scrutiny explicitly warns against ("avoid repeated icons / cluttered
  boxes"). The local `isOverlayActive` (VL-FIX-01) is a deliberate
  case-insensitive bugfix, not a careless duplicate — left as-is.

## What is next (candidate follow-ups)

- Phase 3 is prompt-level — validate it against a LIVE generation (needs a
  provider key) to confirm the Do Now / real-world / reasoning questions land
  and the numbering contract holds.
- Maths/Science scrutiny depth: reduce-text passes, worked-example brevity,
  vocab-table cleanup, MCQ single-correct, computing-diagram removal — most
  have existing validators (`worksheetScrutinyValidators*.ts`); audit which
  are wired into the live `ai.ts` path vs. dark.
- Three-tier differentiation (`autoThreeTierGenerator.ts`) surfacing in the UI.
