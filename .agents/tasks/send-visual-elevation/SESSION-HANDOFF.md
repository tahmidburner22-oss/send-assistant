# SEND Visual Elevation — Session Handoff

This file is the **resume point** for any fresh chat picking up this
work. Read this first, then `PHASE-PLAN.md`, then `LEDGER.md`, then
`docs/SEND-Website-Elevation-Plan.md` for the full strategy.

Last updated: 2026-06-03 — PR #162/#163/#164 MERGED (V1-V5 + docs) and
PR #165 (PR-A: V5b + V6 + V7 + V8) MERGED. The remaining open PR is:
- **PR-B** `feat/six-send-tools` (this branch) — the six SEND tools T1-T6
  (Connected Resource Generator, Reading & Story Studio, Interactive Activity
  Generator, Visual Learning Studio, Resource Adaptation Hub, SEND Teaching
  Agent), each registered in all six conventional places. FREE + Gemini-
  independent; reuses `proceduralActivities/` (T3) and `PresentationDiagram`
  (T4); T2 uses PR-A's now-merged `/api/generation-proxy`. Branched off `main`
  independently of PR-A; merged up to the post-PR-A `main`.
Read this first, then `PHASE-PLAN.md`, then `LEDGER.md`, then
`docs/SEND-Website-Elevation-Plan.md`.

## Quick-resume header (paste into a fresh chat)

```
Context: send-assistant repo (Adaptly). Task "SEND Visual Elevation":
         free, high-quality, RELEVANT visuals + the SEND symbol layer.
Plan:    docs/SEND-Website-Elevation-Plan.md
Resume:  .agents/tasks/send-visual-elevation/SESSION-HANDOFF.md
Phase:   .agents/tasks/send-visual-elevation/PHASE-PLAN.md
Ledger:  .agents/tasks/send-visual-elevation/LEDGER.md
Shipped: PR #162 (MERGED) — V1 image relevance, V2 ARASAAC proxy+resolver,
         V3 Communication Board, V4 Gemini auth cooldown.
         PR #163 (MERGED) — in-repo plan + handoff docs.
         PR (this branch) — V5 presentation word-bank symbols (screen+PPTX).
Next:    V5b — wire symbol support into WORKSHEET word banks / vocabulary.
Constraints: FREE + child-safe; Gemini-independent (Groq priority-1);
         npm install needs --legacy-peer-deps; ~146 pre-existing tsc
         errors (verify ZERO net-new); don't read big files in full.
         Lowest-PR-count: one combined branch per group.
Goal: implement the next un-shipped work unit, update LEDGER +
      SESSION-HANDOFF, extend/open the combined PR.
```

## What is done (shipped in PR #162 — merged)

### V1 — Relevance-ranked stock photos
- `server/routes/image-proxy.ts` — now captures provider descriptive
  metadata (Pexels `alt`; Unsplash `description` + `alt_description` +
  tags), fetches a **12-15 candidate pool** (even when caller asks for
  1), and **re-ranks by relevance** to (query ×2 + concept ×1) with a
  small landscape bonus via `scoreImageRelevance` / `rankByRelevance`.
  Returns the best match, not the most popular. Falls back to provider
  order when nothing scores (no regression). New optional `concept`
  query param; results carry an optional `relevance` score and
  `relevanceRanked: true`.
- `client/src/lib/presentation-image-resolver.ts` — `resolveImage`
  accepts a `concept`; `resolveDeckImages` passes the **slide title**
  as the concept so "cycle" + "The Water Cycle" disambiguates.

### V2 — ARASAAC symbol layer (the free, legal SEND differentiator)
- `server/routes/symbol-proxy.ts` (NEW) — proxy over ARASAAC pictograms
  (free, CC BY-NC-SA, NO API key). `/search?q=&lang=&limit=` and
  `/fetch?url=&format=base64`. 24h cache, `requireAuth`, host-
  whitelisted to `static.arasaac.org`, attribution attached. Mirrors
  `image-proxy.ts`. Registered in `server/index.ts` at
  `/api/symbol-proxy`.
- `client/src/lib/symbol-resolver.ts` (NEW) — `searchSymbols`,
  `resolveSymbol`, `resolveSymbolsForWords` (bounded concurrency),
  `fetchSymbolAsDataUrl`. Per-session memoised; degrades to [] on
  failure so callers fall back to text.

### V3 — Communication Board tool
- `client/src/pages/tools/CommunicationBoard.tsx` (NEW) at
  `/tools/communication-board`. Builds a printable AAC symbol board
  from a typed word list (offline) OR AI-suggested topic vocabulary
  (`callAI` → JSON `{words:[]}` → resolve symbols). Tap-to-hear (Web
  Speech API), adjustable grid (2-5 cols), 8 languages, print layout
  (`print:hidden` controls), ARASAAC attribution footer. Words with no
  pictogram render as a clean first-letter text card.
- Registered in: `App.tsx` (lazy import + route), `lib/tool-registry.ts`
  (send hub entry), `pages/hubs/SENDHub.tsx` (card, "New" badge),
  `components/CommandPalette.tsx` (search entry), `lib/prefetch.ts`,
  `components/AppLayout.tsx` (header-title path list).

### V4 — Dead-key (Gemini) resilience
- `server/routes/ai.ts` — added `AUTH_COOLDOWN_MS` (10 min);
  `setCooldown` now takes an optional duration; a 401/403/invalid-key
  now parks the provider for 10 min (re-probed after) instead of being
  retried at the FRONT of every heavy request (`reorderForHeavyRequest`
  prioritises Gemini for long prompts). Groq stays priority-1.

### V5 — Presentation word-bank symbol support (this branch)
- `client/src/components/SymbolSupportedWords.tsx` (NEW) — `TermSymbol`
  (one pictogram for a card; renders null until resolved / if none),
  `SymbolSupportedWords` (chip row), `extractVocabTerms` (parses a
  worksheet vocabulary string → terms, for V5b). ADDITIVE + graceful.
- `client/src/pages/tools/PresentationMaker.tsx`:
  - `symbolSupport` deck-level `useState` (default false) + a Switch in
    the options panel under the SEND Needs picker.
  - `FullSlideView` gained a `symbolSupport` prop; renders `<TermSymbol>`
    in the `word-bank`, `key-terms` and `vocab-reference` cases. Threaded
    to ALL 5 call sites incl. `PresenterMode` (fullscreen) + comparison.
  - `exportToPptx` gained a `symbolSupport` param; pre-resolves ARASAAC
    pictograms to base64 (mirrors the image dataURL pattern) into
    `symbolDataByTerm`, then `addImage`s them on the same 3 painters.
    Text x/width shift right ONLY when a symbol exists → byte-identical
    PPTX when off.
- Worksheet half deliberately NOT done here → V5b.

## What is next (PR-B — the six SEND tools)

V5b/V6/V7/V8 shipped in PR-A. The remaining roadmap is **PR-B: the six SEND
tools (T1-T6)**, fully specced in `docs/SEND-Website-Elevation-Plan.md`
(Part 3, Tools 1-6) and summarised in `PHASE-PLAN.md`:

1. **T1 Connected Resource Generator** (EasyClass) — flagship: one topic →
   differentiated worksheet + slides + reading + quiz + comms board.
2. **T2 Reading & Story Studio + published e-book** (BuildMyStory) — uses the
   V7 illustration endpoint (`client/src/lib/illustration-generator.ts`).
3. **T3 Interactive Activity Generator** (ToolsEdu) — REUSE
   `client/src/lib/proceduralActivities/` (wordsearch/crossword/matching/cloze).
4. **T4 Visual Learning Studio** (MyLens) — extend
   `client/src/components/PresentationDiagram.tsx` (free SVG engine).
5. **T5 Resource Sharing & Adaptation Hub** (TeachShare) — "Adapt for SEND",
   YouTube→activity.
6. **T6 SEND AI Teaching Agent** (Canvas IgniteAI) — EHCP-linked rubrics,
   provision maps, review prep.

Each new tool registers in SIX places: `App.tsx`, `lib/tool-registry.ts`, the
hub page, `components/CommandPalette.tsx`, `lib/prefetch.ts`, `AppLayout.tsx`.

### Shipped in PR-A (`feat/visual-polish-symbols-generation`)
- **V5b** — opt-in ARASAAC symbols in worksheet vocabulary/word-banks
  (`UserPreferences.symbolSupport` + Switch by Book Mode; `symbolSupport` prop
  on `WorksheetRenderer`; pictogram strips in `VocabSection` + `PrimarySection`;
  `SymbolSupportedWords` `asDataUrl` mode so symbols embed in the html2canvas
  PDF path). Also fixed the ARASAAC CDN size (150px now 404s → use 500/300).
- **V6** — server-side CLIP re-ranking on `/api/image-proxy/search`
  (`server/lib/cloudflare-ai.ts` + image-proxy blend). Opt-in via Cloudflare
  creds; degrades to the existing lexical re-rank.
- **V7** — free, safety-gated FLUX endpoint (`server/routes/generation-proxy.ts`)
  for unique story illustrations only; teacher-initiated, cached, never
  pupil-direct. Client helper: `client/src/lib/illustration-generator.ts`.
- **V8** — removed dead `gemini*` from `PROVIDER_ORDER` + `reorderForHeavyRequest`
  heavy[] (Groq priority-1). `callGemini` retained for easy restore.

## How to verify (this repo does NOT pass tsc cleanly)

The repo has **~146 pre-existing tsc errors** unrelated to this task,
so `npm run check` exit code is not a usable gate. Verify you added
**zero net-new** errors:

```
npm install --legacy-peer-deps        # REQUIRED flag (vite peer conflict)
# baseline: stash your edits, count
git stash push <your changed tracked files>
npm run check 2>&1 | grep -cE 'error TS'      # note the number
git stash pop
npm run check 2>&1 | grep -cE 'error TS'      # must equal baseline
# server must bundle (this is what actually runs in prod):
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=/tmp/srv.js
```
PR #162 baseline was 146 → 146 (zero net-new). New untracked files show
their own errors directly in the grep — confirm they're absent.

## Files-of-interest map

| Concern | File |
| --- | --- |
| Stock image search + relevance ranking | `server/routes/image-proxy.ts` |
| Deck image resolution (passes slide title as concept) | `client/src/lib/presentation-image-resolver.ts` |
| ARASAAC symbol proxy (server) | `server/routes/symbol-proxy.ts` |
| ARASAAC symbol client helper | `client/src/lib/symbol-resolver.ts` |
| Communication Board tool | `client/src/pages/tools/CommunicationBoard.tsx` |
| AI provider fallback chain + cooldowns | `server/routes/ai.ts` (grep `PROVIDER_ORDER`, `reorderForHeavyRequest`, `setCooldown`) |
| Vector/SVG diagram engine (the "MyLens" tier) | `client/src/components/PresentationDiagram.tsx` |
| Curated topic image bank | `client/src/lib/topic-image-bank.ts` |
| Tool registry (source of truth) | `client/src/lib/tool-registry.ts` |
| Route table | `client/src/App.tsx` |
| Full strategy + competitor breakdown + limitations | `docs/SEND-Website-Elevation-Plan.md` |

## Notes (transient scratchpad)

- ARASAAC is **non-commercial** (CC BY-NC-SA). Fine for schools; needs a
  licensing decision before any paid/commercial tier. Attribution is
  rendered on boards and returned per API result.
- For relevance ranking to do anything, `PEXELS_API_KEY` and/or
  `UNSPLASH_ACCESS_KEY` must be set in the server env. With neither, the
  proxy returns `degraded: true` and the client falls back gracefully.
- Phase G (PR #102) already shipped pure procedural generators
  (wordsearch / crossword / matching / cloze) under
  `client/src/lib/proceduralActivities/` — **reuse these for T3** rather
  than rebuilding.
- `gamma.app`-style "paste anything → deck" and web-native share-link
  are documented in the plan (Part 9) but not yet built; good candidates
  to fold into a future PresentationMaker PR.
