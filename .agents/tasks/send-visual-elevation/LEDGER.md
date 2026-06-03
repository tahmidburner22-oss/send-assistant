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

## PR (this branch) — `docs/send-visual-elevation-handoff`

| Item | Status | Files |
| --- | --- | --- |
| In-repo strategy doc | ✅ | `docs/SEND-Website-Elevation-Plan.md` |
| Handoff/continuation docs | ✅ | `.agents/tasks/send-visual-elevation/{RESUME,PHASE-PLAN,SESSION-HANDOFF,LEDGER}.md` |

## Not yet started

| ID | Title | Notes |
| --- | --- | --- |
| V5 | Symbol support in worksheet + presentation word banks | NEXT |
| V6 | Server-side CLIP re-ranking for stock photos | planned |
| V7 | Cloudflare FLUX generative endpoint (story illustrations) | planned |
| V8 | Demote `gemini*` in PROVIDER_ORDER + heavy[] | optional |
| T1-T6 | The six SEND tools (see PHASE-PLAN + plan) | planning only |
