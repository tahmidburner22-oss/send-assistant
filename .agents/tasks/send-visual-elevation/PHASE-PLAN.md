# SEND Visual Elevation — Phase Plan

> Competitor-derived, SEND-first visual + tooling upgrades. Source: a
> structured study of easyclass.ai (Connected OS), buildmystory.com
> (published-author reading), toolsedu.com (interactive games),
> mylens.ai (AI visual thinking), gamma.app (AI-native presentations),
> TeachShare AI (resource adaptation/sharing) and Canvas IgniteAI
> (embedded teaching agent). Full analysis + the honest free-vs-quality
> limitations are in `docs/SEND-Website-Elevation-Plan.md` (Parts 1-11).

## Goal

Deliver visuals that are **high-quality, genuinely relevant (not random
/ half-matching) and free**, plus the **SEND symbol layer** that no
competitor has — without depending on the (unreliable) Gemini key.

## The agreed visual strategy (the "4-tier engine")

Resolve every visual in this priority order — higher tiers are MORE
relevant AND cheaper:

1. **Vector / SVG** (free, always relevant, print-perfect) — the
   `PresentationDiagram.tsx` engine. This is the "MyLens approach":
   LLM emits structured data, code renders the diagram. Should cover
   most educational visuals. **Primary visual.**
2. **Curated bank + ARASAAC symbols** (free, vetted, child-safe).
3. **Smart stock search** (free) — multi-candidate + relevance
   re-ranking (shipped in PR #162). Only when a real-world photo is
   needed.
4. **Generative** (free-ish, last resort) — Cloudflare FLUX, for unique
   **story illustrations** only; teacher-reviewed + safety-gated +
   cached.

## Key constraints (non-negotiable)

- **Free.** No paid APIs. ARASAAC (symbols), Pexels/Unsplash (stock),
  SVG (vector) and Cloudflare Workers AI free tier (generation) only.
- **Gemini-independent.** Groq is text priority-1. PR #162 added a
  10-min auth cooldown so a dead Gemini key stops being retried at the
  front of heavy requests. If the key is dead long-term, also remove
  `gemini*` from `PROVIDER_ORDER` and the `heavy[]` list in
  `reorderForHeavyRequest` (server/routes/ai.ts).
- **Child-safe.** Prefer pre-vetted sources (stock, ARASAAC). Any
  generative output must be teacher-initiated/reviewed, never
  pupil-direct, and moderation-gated.
- **SEND-first.** Symbol support, differentiation, sensory-aware
  defaults, print-first.

## Work units

| ID  | Title                                                        | Tier | Effort | Status        | Depends on |
| --- | ------------------------------------------------------------ | ---- | ------ | ------------- | ---------- |
| V1  | Relevance-ranked stock photos (multi-candidate + re-rank)    | 1    | M      | ✅ PR #162    | image-proxy |
| V2  | ARASAAC symbol-proxy (server) + symbol-resolver (client)     | 1    | M      | ✅ PR #162    | —          |
| V3  | Communication Board tool (uses V2 end-to-end)                | 1    | M      | ✅ PR #162    | V2         |
| V4  | Dead-key (Gemini) auth cooldown resilience                   | 2    | XS     | ✅ PR #162    | —          |
| V5  | Symbol support in PRESENTATION word banks (screen + PPTX)    | 1    | M      | ✅ this PR    | V2         |
| V5b | Symbol support in WORKSHEET word banks / vocabulary          | 1    | M      | ✅ PR-A       | V2         |
| V6  | Server-side CLIP re-ranking for stock photos (sharper relevance) | 2 | M  | ✅ PR-A       | V1, Cloudflare |
| V7  | Cloudflare FLUX generative endpoint (story illustrations)    | 2    | M      | ✅ PR-A       | safety gate |
| V8  | Demote `gemini*` in PROVIDER_ORDER + heavy[] (if key stays dead) | 3 | XS  | ✅ PR-A       | V4         |

Effort key: XS ≈ <50 LoC; S ≈ 100-300; M ≈ 300-800.

## The bigger roadmap (the 6 SEND tools — planning only, NOT built)

These are fully specced in `docs/SEND-Website-Elevation-Plan.md`
(Tools 1-6). Each is a candidate combined PR:

| ID  | Tool                              | Inspired by      | Notes |
| --- | --------------------------------- | ---------------- | ----- |
| T1  | Connected Resource Generator      | EasyClass        | Flagship: 1 topic → differentiated worksheet + slides + reading + quiz + comms board |
| T2  | Reading & Story Studio + e-book   | BuildMyStory     | Voice/symbol/choice creation; published-author output |
| T3  | Interactive Activity Generator    | ToolsEdu         | Word search / crossword / matching / sequencing / bingo — switch + eye-gaze accessible. NB: PR #102/Phase G already shipped procedural wordsearch/crossword/matching/cloze libs — REUSE them. |
| T4  | Visual Learning Studio            | MyLens           | Accessible mind maps, social-story flowcharts, progressive disclosure — extends `PresentationDiagram.tsx` |
| T5  | Resource Sharing & Adaptation Hub | TeachShare       | "Adapt for SEND", YouTube→activity |
| T6  | SEND AI Teaching Agent            | Canvas IgniteAI  | EHCP-linked rubrics, provision maps, annual-review prep |

## Definition-of-done (per work unit)

- [ ] Free + child-safe (no paid API; vetted/teacher-reviewed visuals).
- [ ] New helpers are pure / idempotent; new server routes mirror the
      `image-proxy.ts` / `symbol-proxy.ts` pattern (auth-gated, cached,
      host-whitelisted `/fetch`).
- [ ] Schema additions are additive (older docs still validate).
- [ ] ZERO net-new tsc errors vs baseline (see SESSION-HANDOFF).
- [ ] Server bundles cleanly via esbuild.
- [ ] LEDGER.md + SESSION-HANDOFF.md updated.
- [ ] New tools registered in `tool-registry.ts`, `App.tsx`,
      the relevant hub page, `CommandPalette.tsx`, `prefetch.ts`.

## Conventions inherited from the codebase

- **Tool registration touches 5-6 places:** `App.tsx` (lazy import +
  route), `lib/tool-registry.ts` (source of truth), the hub page
  (e.g. `pages/hubs/SENDHub.tsx`), `components/CommandPalette.tsx`,
  `lib/prefetch.ts`, and `components/AppLayout.tsx` (header title list).
- **Server route pattern:** `Router()` + `requireAuth`, in-memory 24h
  cache with prune, host-whitelisted `/fetch` that can return raw bytes
  or a base64 `data:` URL for PDF/PPTX embedding. Register in
  `server/index.ts` (import + `app.use("/api/...", aiLimiter, router)`).
- **AI calls:** `callAI(system, user, maxTokens, { responseFormat })`
  from `@/lib/ai`; parse JSON with `parseWithFixes`. Server
  `/api/ai/generate` is primary; client localStorage keys are fallback.
- **Licensing:** ARASAAC = CC BY-NC-SA (non-commercial, attribution
  required). Attribution is rendered on output and returned per result.
