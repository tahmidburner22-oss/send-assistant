# SEND Visual Elevation — Ledger

Chronological log of what shipped. Newest first. Each row maps a work
unit to the files it touched and the PR it landed in.

## PR-A — `feat/visual-polish-symbols-generation` — OPEN

"Visual polish + symbols + generation" = V5b + V6 + V7 + V8. All opt-in /
default-off (or inert without optional Cloudflare creds), so existing
output is byte-identical until switched on.

| ID | Title | Status | Files |
| --- | --- | --- | --- |
| V5b | Opt-in ARASAAC symbol support in WORKSHEET vocabulary/word-banks | ✅ this PR | `client/src/contexts/UserPreferencesContext.tsx` (+`symbolSupport`), `client/src/pages/Worksheets.tsx` (Switch by Book Mode + 4 renderer call sites), `client/src/components/WorksheetRenderer.tsx` (`symbolSupport` prop; `VocabSection` + `PrimarySection` pictogram strips), `client/src/components/SymbolSupportedWords.tsx` (+`asDataUrl` mode for PDF), `server/routes/symbol-proxy.ts` (CDN size fix: url=500/thumb=300 — 150px now 404s) |
| V6 | Server-side CLIP re-ranking on `/api/image-proxy/search` | ✅ this PR | `server/lib/cloudflare-ai.ts` (new — shared free Workers AI wrapper), `server/routes/image-proxy.ts` (lexical → CLIP blend on top-8; opt-in via CF creds; degrades to lexical) |
| V7 | Free, safety-gated FLUX endpoint for story illustrations | ✅ this PR | `server/routes/generation-proxy.ts` (new — `/status` + `/illustrate`, requireAuth, contentFilter gate, child-safe style, 24h cache), `server/index.ts` (register), `client/src/lib/illustration-generator.ts` (new client helper) |
| V8 | Gemini-independent provider chain (dead key) | ✅ this PR | `server/routes/ai.ts` (remove `gemini*` from `PROVIDER_ORDER` + `heavy[]`; heavy[] now `sambanova_1/_2`) |

Verification: tsc net-new errors = 0 (baseline 146 → 146); server esbuild
bundle clean (1017kb). V6/V7 are inert unless `CLOUDFLARE_ACCOUNT_ID` +
`CLOUDFLARE_API_TOKEN` are set — no regression to the current free path.

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
| T1-T6 | The six SEND tools (see PHASE-PLAN + plan) | PR-B (in progress / next) |
