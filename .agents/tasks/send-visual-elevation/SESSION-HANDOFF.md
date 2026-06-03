# SEND Visual Elevation — Session Handoff

This file is the **resume point** for any fresh chat picking up this
work. Read this first, then `PHASE-PLAN.md`, then `LEDGER.md`, then
`docs/SEND-Website-Elevation-Plan.md` for the full strategy.

Last updated: 2026-06-03 — PR #162 (`feat/visual-relevance-arasaac-symbols`)
is **MERGED into main** (merge commit `f507ab7`). It shipped the first
four work units (V1-V4). This docs/handoff bundle ships on a separate
branch `docs/send-visual-elevation-handoff` as a new PR (PR #162 was
already merged, so it could not be reused).

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
Next:    V5 — wire symbol-resolver into worksheet + presentation word banks.
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

## What is next (pick the top un-shipped item)

1. **V5 — Wire `symbol-resolver` into the worksheet + presentation word
   banks.** Highest leverage: puts symbol support into the flagship
   generators, not just the Communication Board. Likely surfaces:
   - Presentation `word-bank` slide type + SEND `wordBank` field
     (PresentationMaker.tsx — grep `// ` / `wordBank`; render symbols
     above each term). Use `resolveSymbolsForWords`.
   - Worksheet `vocab-reference` / word-bank sections
     (WorksheetRenderer.tsx). Add a teacher toggle "symbol support".
   - Keep it additive + opt-in; print-safe; embed via
     `fetchSymbolAsDataUrl` for PDF/PPTX.
2. **V6 — Server-side CLIP re-ranking** for even sharper stock
   relevance (free on Cloudflare Workers AI). Adds an embedding score
   on top of V1's lexical score. Run server-side (SEND devices are
   low-spec).
3. **V7 — Cloudflare FLUX generative endpoint** for unique story
   illustrations only. New `/api/image-proxy/generate` (or a new
   `generation-proxy`), teacher-initiated, safety-gated, cached.
4. **V8 — (optional)** demote `gemini*` in `PROVIDER_ORDER` + the
   `heavy[]` list if the key stays dead long-term.

Then the bigger roadmap (T1-T6 in PHASE-PLAN) — each its own combined PR.

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
