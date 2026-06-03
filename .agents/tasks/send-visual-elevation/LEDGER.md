# SEND Visual Elevation — Ledger

Chronological log of what shipped. Newest first. Each row maps a work
unit to the files it touched and the PR it landed in.

## PR #162 — `feat/visual-relevance-arasaac-symbols` — MERGED (merge commit f507ab7)

| ID | Title | Status | Files |
| --- | --- | --- | --- |
| V1 | Relevance-ranked stock photos | ✅ merged | `server/routes/image-proxy.ts`, `client/src/lib/presentation-image-resolver.ts` |
| V2 | ARASAAC symbol-proxy + resolver | ✅ merged | `server/routes/symbol-proxy.ts` (new), `client/src/lib/symbol-resolver.ts` (new), `server/index.ts` |
| V3 | Communication Board tool | ✅ merged | `client/src/pages/tools/CommunicationBoard.tsx` (new), `client/src/App.tsx`, `client/src/lib/tool-registry.ts`, `client/src/pages/hubs/SENDHub.tsx`, `client/src/components/CommandPalette.tsx`, `client/src/lib/prefetch.ts`, `client/src/components/AppLayout.tsx` |
| V4 | Dead-key (Gemini) auth cooldown | ✅ merged | `server/routes/ai.ts` |

Verification at merge: tsc net-new errors = 0 (baseline 146 → 146);
server esbuild bundle clean.

## PR #163 — `docs/send-visual-elevation-handoff` — MERGED (merge commit 1e99f11)

| Item | Status | Files |
| --- | --- | --- |
| In-repo strategy doc | ✅ merged | `docs/SEND-Website-Elevation-Plan.md` |
| Handoff/continuation docs | ✅ merged | `.agents/tasks/send-visual-elevation/{RESUME,PHASE-PLAN,SESSION-HANDOFF,LEDGER}.md` |

## PR (this branch) — `feat/v5-word-bank-symbol-support`

V5 = the PRESENTATION half of "symbol support in word banks" (screen +
PPTX). Worksheet half split to V5b (renderer has 4 tangled vocab paths;
own focused PR). Opt-in deck toggle, OFF by default → existing decks
render byte-identically until switched on.

| ID | Title | Status | Files |
| --- | --- | --- | --- |
| V5-component | Reusable `SymbolSupportedWords` (TermSymbol + SymbolSupportedWords + extractVocabTerms util) | ✅ this PR | `client/src/components/SymbolSupportedWords.tsx` (new) |
| V5-pres-screen | FullSlideView symbols on `word-bank`, `key-terms`, `vocab-reference` + PresenterMode + comparison views; deck toggle in options panel | ✅ this PR | `client/src/pages/tools/PresentationMaker.tsx` |
| V5-pres-pptx | PPTX export embeds ARASAAC pictograms (pre-resolved base64) on the same 3 slide types; text shifts right ONLY when a symbol exists | ✅ this PR | `client/src/pages/tools/PresentationMaker.tsx` |

Verification: tsc net-new errors = 0 (baseline 146 → 146); new component
+ PresentationMaker edits clean.

## Not yet started

| ID | Title | Notes |
| --- | --- | --- |
| V5b | Symbol support in WORKSHEET word banks / vocabulary | NEXT. Renderer (`WorksheetRenderer.tsx`, 9.5k lines) has 4 vocab render paths: PrimarySection, secondary section body (~L4715 `formatContent`), MathsCompactLayout, exam-style. Use `extractVocabTerms` + `<SymbolSupportedWords>` (already built). Add `symbolSupport` prop to renderer; pass from `Worksheets.tsx` via the shared `UserPreferences.symbolSupport` pref (ADD this field) + a toggle next to the Book Mode switch (Worksheets.tsx ~L4856). Symbols already print-safe via remote `<img>`; confirm the custom PDF path (`pdf-generator-v2.ts`) embeds them or switch to data URLs. |
| V6 | Server-side CLIP re-ranking for stock photos | planned |
| V7 | Cloudflare FLUX generative endpoint (story illustrations) | planned |
| V8 | Demote `gemini*` in PROVIDER_ORDER + heavy[] | optional |
| T1-T6 | The six SEND tools (see PHASE-PLAN + plan) | planning only |
