# Cost transparency (PD13)

> **Why this exists.** Schools running on FSM-funded budgets need a
> defensible per-pupil cost model for AI tools. PD13 gives every
> teacher a chip in the worksheet footer showing the cost + duration
> of the generation, and gives the bursar a monthly spend + cache
> savings panel in `/admin`. The data is the lever for the
> procurement conversation.

## The two surfaces

### 1. Per-worksheet cost chip

A small button-style chip in `WorksheetRenderer`'s footer (teacher
view only):

- **Fresh call:** `£0.0006 · 2.4s · Groq · llama3-70b`
- **Cache hit:** `Cached · £0 · 0.5s · Groq · llama3-70b`

Click the chip → `CostBreakdownModal` opens with:

- Provider + model
- Prompt tokens, completion tokens, total tokens
- Estimated cost in GBP and USD
- Wall-clock duration
- Cache key (so a bursar can correlate to the cache audit)
- A footnote explaining the methodology

The chip is hidden on print (existing `.no-print` class) and hidden
in pupil view, so it never reaches a printed worksheet.

### 2. Admin spend panel

`AdminPanel` → Analytics tab → "Generation cost — last 30 days"
shows for the school:

- Total calls
- Cached (free) calls
- Spend in USD
- Saved by cache in USD (imputed from each provider's average
  non-cached call cost)
- Per-provider breakdown table

## How cost data is captured

```text
                        /api/ai/generate                     ┌──────────────────┐
  user request ─────►   server/routes/ai.ts          ────►   │ generation_cost_ │
                        ├─ start: t0 = Date.now()            │  log (sqlite)    │
                        ├─ call LLM via callWithFallback     └──────────────────┘
                        ├─ approxTokenCount(prompt) ─────►              ▲
                        ├─ approxTokenCount(content) ────►              │
                        ├─ getAdminModel(provider) ──────►              │
                        ├─ estimateCost(...) ────────────►              │
                        ├─ stampCostMetadata(json,                      │
                        │     { costEstimate, cacheKey,                 │
                        │       cacheHit: false })                      │
                        ├─ setCached(stamped)         ──────────────────┤
                        └─ logGenerationCost(...)     ──────────────────┘
                                                                        ▲
  next identical request                                                │
  ─────► hits cache                                                     │
        ├─ getCached returns { content, provider }                      │
        ├─ restampCacheHit(content) → cacheHit=true, USD=0              │
        └─ logGenerationCost({ cached: true, USD: 0 })  ────────────────┘
```

The chip simply reads `metadata.costEstimate` + `metadata.cacheHit` +
`metadata.cacheKey` from the worksheet — no separate API call, no
extra round-trip. The admin panel reads the persisted log via
`GET /api/admin/cost-rollup?windowDays=30`.

## Methodology and why it's defensible

- **Token counts** are estimated from `prompt.length / 4` and
  `response.length / 4`. This is the public OpenAI rule of thumb. A
  follow-up wave can swap in provider-reported usage figures where
  available; the schema is forward-compatible.
- **Per-provider rates** are sourced from publicly published pricing
  pages, captured in
  [`client/src/lib/aiCostEstimate.ts`](../client/src/lib/aiCostEstimate.ts)'s
  `PROVIDER_PRICE_TABLE` (mid-2026 rates).
- **USD → GBP** uses a fixed mid-market rate (`USD_TO_GBP = 0.79` in
  [`client/src/lib/aiCostFormat.ts`](../client/src/lib/aiCostFormat.ts)).
  Updating this is a one-line change. Live FX is intentionally out of
  scope — it makes the chip flicker and breaks deterministic tests.
- **Cache savings** are imputed: for every cached call, we add the
  average per-call cost of the same provider's non-cached calls in
  the same window. This is conservative — it assumes the cached call
  would otherwise have cost the average. A bursar who challenges the
  number can rerun the calculation against the raw log.

## Settings

Per-user toggle: `Settings → Features → Show generation cost`
(`UserPreferences.costTransparency`). Default ON. Hiding the chip
does **not** stop cost capture — the data is still stamped on every
worksheet and logged. Toggling back on makes historical costs
visible without a re-generate.

## Data retention

The `generation_cost_log` table is append-only. There is no
auto-purge today. PII is not stored — only `school_id`, `user_id`,
provider, model, token counts, USD, duration, cache key and the
boolean `cached`. Rolling deletion (e.g. >180 days) is a follow-up
when audit-trail requirements are agreed with each tenant.

## Known limitations

- Token counts are character-based approximations. Real provider
  usage may be lower (efficient tokeniser) or higher (cyrillic /
  CJK content). Order of magnitude is right.
- USD → GBP is a fixed rate, not live FX. Fine for budget
  conversations; not for accounting reconciliation.
- The cache is in-memory (`server/lib/generationCache.ts`). Restarts
  flush it, so the per-day cache-hit rate decreases temporarily
  after a deploy. The `generation_cache` table in `schema.sql` is
  ready for a persistent tier when needed.
- `metadata.costEstimate` is added by the server. If the LLM returns
  invalid JSON (rare), the chip won't render — graceful degradation
  rather than breaking a generation that already cost money.

## Related infrastructure (already shipped)

- **PR-9** (FEAT-PR9, audit items #41/#42/#43/#76): the server-side
  scaffolding — `aiCostEstimate.ts`, `aiCacheKey.ts`,
  `generationCache.ts`, schema additions.
- **PR-27** (`telemetryAggregators.ts`,
  `pages/admin/telemetry.tsx`): pure aggregators + a presentational
  admin telemetry page (separate to the AdminPanel section delivered
  here).
