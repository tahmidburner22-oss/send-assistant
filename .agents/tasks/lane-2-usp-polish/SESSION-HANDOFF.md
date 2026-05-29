# Lane 2 — USP Polish — Session Handoff

This file is the **resume point** for any fresh chat picking up Lane 2
work. Read this first, then `PHASE-PLAN.md`, then `LEDGER.md`.

Last updated: 2026-05-29 — six of eight items shipped on
`feat/lane-2-usp-polish`. Two items (2.1, 2.3) deferred — see
"What is NOT in this PR" below.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo. Worksheet-generator pre-pilot programme.
         Lane 1 (eight surgical pre-pilot fixes) shipped as PR #144.
         Lane 2 (USP polish) — six items shipped on
         feat/lane-2-usp-polish; two queued.
Resume:  .agents/tasks/lane-2-usp-polish/SESSION-HANDOFF.md
Plan:    .agents/tasks/lane-2-usp-polish/PHASE-PLAN.md
Ledger:  .agents/tasks/lane-2-usp-polish/LEDGER.md
Branch:  feat/lane-2-usp-polish (off feat/lane-1-pre-pilot-fixes —
         rebase onto main once PR #144 lands)
Audit:   docs/worksheet-generator-audit.md
         docs/primary-worksheet-improvement-plan.md
         (intended output)
Constraint: SEND IS THE USP. Every change must be deterministic
            (fail-closed in the post-validator), not "asked nicely
            in the prompt and hope".
```

## Lane 2 items — current status

| # | Item | Status |
|---|---|---|
| 2.2 | Fail-closed SEND-marker checklist for ALL needs (ADHD, Dyslexia, MLD, Dyscalculia, EAL, VI, Dyspraxia on top of Lane 1 HI/Anxiety) | ✅ shipped |
| 2.5 | Single marks→lines mapping shared by worksheet and revision-mat | ✅ shipped |
| 2.6 | Curriculum-authority preamble bound to primary AND revision-mat paths | ✅ shipped |
| 2.7 | Six audit-doc-named revision-tip categories (vocabulary / worked-example / common-mistake / past-papers / retrieval / learning-objective) | ✅ shipped |
| 2.4 | Primary 5/4/5 layout (was 3/3/3) | ✅ shipped |
| 2.8 | aria-labels on every pupil-facing element + toolbar zoom buttons | ✅ shipped |
| 2.3 | Stacked-needs test fixtures (HI+EAL, ADHD+Dyslexia, Anxiety+MLD, Dyscalculia+EAL, etc.) | ☐ queued |
| 2.1 | Collapse three SEND systems into one source of truth | ☐ queued |

## Detailed change spec for the two queued items

### 2.3 — Stacked-needs test fixtures

**Why it's deferred:** The eval harness lives at
`server/tests/worksheet-eval/` and runs against either real LLM
calls (`mode: live`) or deterministic mocks (`mode: mock`). Authoring
real stacked-need fixtures requires:
- Generating sample worksheet JSON for each of the 10 stacked
  combinations (HI + EAL Urdu / Polish, ADHD + Dyslexia, Anxiety +
  MLD, Dyscalculia + EAL Bengali, ASC + Anxiety, VI + Dyslexia,
  Dyspraxia + ADHD, SLCN + EAL Punjabi, Working memory + ADHD).
- Adding fixture rule files that assert each pair's markers ship
  and don't erase each other.
- Testing those rule files against either deterministic mock JSON
  or live LLM output.

**What to do next session:**
1. Add fixtures under
   `server/tests/worksheet-eval/fixtures/stacked/` mirroring the
   existing structure of `fixtures/maths/`, `fixtures/english/` etc.
2. For each fixture, hand-author or capture from a real generation
   the expected combined marker set (HI Topic Summary AND EAL
   sentence frames AND Urdu glossary, etc.).
3. Add a stacked-need rule file in `rules.ts` that checks each
   fixture for both needs' markers.
4. Wire into `worksheet-eval.yml` so they run on every PR.
5. Make the eval gate PR-blocking once the baseline settles (this is
   Lane 3.10).

### 2.1 — Collapse three SEND systems

**Why it's deferred:** This is the biggest refactor in the
programme. Three live code paths emit SEND-related content today
(`sendPromptFragments.ts` for the prompt, `worksheetConstraints.ts`
`SEND_OVERLAYS` for cosmetic settings, and `server/lib/overlayEngine.ts`
for post-gen overlay support boxes). They share no test that
asserts they agree. Collapsing them touches every SEND need and
every consumer of those modules. Best done as its own PR with a
careful migration path.

**What to do next session:**
1. Pick `sendPromptFragments.ts:SEND_ADAPTATION_SPECS` as the single
   source of truth (it has the richest content rules — five fields
   per need: bullets, worksheetRules, worksheetRulesContent,
   presentationRules, autismProfile? extensions).
2. Define a unified `SendNeedSpec` interface:
   ```ts
   interface SendNeedSpec {
     id: string;
     name: string;
     promptRules: string[];
     promptContentRules: string[];
     cosmetics: { fontSize?: string; lineHeight?: number; ... };
     postGenMarkers: {
       sectionTitleRewrites?: Array<{ from: RegExp; to: string }>;
       insertedSections?: Array<{ type: string; title: string; build: ... }>;
       perQuestionPrefix?: string;
     };
     overlayBoxes?: Array<{ heading: string; lines: string[] }>;
   }
   ```
3. Auto-generate `worksheetConstraints.ts:SEND_OVERLAYS` from the
   unified spec (or remove it entirely — Lane 1.6/1.7 + 2.2 already
   make the `enforceSendOverlayMarkers` validator the source of
   truth for marker enforcement).
4. Auto-generate the per-need branches in
   `server/lib/overlayEngine.ts:applySendSupport` from the same
   spec.
5. Add a build test that fails if any of the three legacy locations
   drift from the unified spec.
6. Migrate carefully: ship as a NO-OP refactor first (same external
   behaviour, single source internally), then tighten in a
   follow-up.

## Test plan (run before each push)

1. `npm run check` — TypeScript clean (acceptable: only the four
   pre-existing tsconfig env errors and the four pre-existing
   App.tsx / AIToolPage.tsx / WorksheetRenderer.tsx unrelated TS
   errors).
2. `npx vitest run --reporter=basic` — passing test count must not
   drop below 739 / 32. Lane 2 baseline is **739 passed / 32 failed
   / 1 skipped (772 total)**. Pre-existing failures only.

## Rollback plan

Each Lane 2 item is its own commit:

- `89e152d` — Lane 2.2 (SEND markers ALL needs)
- `bd0eab2` — Lane 2.5 (single linesForMarks)
- `fa725e8` — Lane 2.6 (auth preamble everywhere)
- `ac2a117` — Lane 2.7 (six revision-tip categories)
- `9ccdf13` — Lane 2.4 (primary 5/4/5)
- `dff055d` — Lane 2.8 (aria-labels)

Reverting any single commit restores the prior behaviour without
affecting the others.

## What is NOT in this PR (Lane 3 backlog)

See `../lane-1-pre-pilot-fixes/SESSION-HANDOFF.md` Lane 3 section.
The big rocks:

- Six-bucket per-year primary reading age (W1)
- Per-year vocabulary blocklist with re-prompt loop (W1)
- ~180 primary topic keys (W4)
- Pull diagram catalogue (5,975 briefs) into live DB (W6)
- Inline diagram per question for KS1/KS2 (W3)
- Y11/KS3/A-Level/OCR exemplars + scaffolds (Phase F2)
- Page-break audit for question splits (W7)
- Mascots / Andika / section badges (W2)
- 1-page mode for KS1 (W7)
- PR-blocking eval gate (depends on 2.3 settling)
