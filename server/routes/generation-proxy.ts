/**
 * generation-proxy.ts
 *
 * Server-side, free, safety-gated text-to-image generation — Tier 4 of the
 * SEND Elevation Plan's visual engine (Part 11.4/11.5). This is the LAST-RESORT
 * visual: it only exists for UNIQUE scenes that vector diagrams, the curated
 * bank, ARASAAC symbols and stock search cannot cover — chiefly bespoke
 * STORY ILLUSTRATIONS.
 *
 * Hard rules baked into this route (Part 11.6 limitations):
 *   - FREE only — uses Cloudflare Workers AI FLUX on the free tier (keys are
 *     server-side, never in the client bundle). No paid API.
 *   - TEACHER-INITIATED, NEVER PUPIL-DIRECT — guarded by requireAuth (an
 *     authenticated staff session); the prompt is supplied by the teacher tool,
 *     so there is no unsupervised pupil-facing generation surface.
 *   - SAFETY-GATED — every prompt passes the safeguarding/inappropriate-content
 *     filter (contentFilter) and is wrapped with a fixed child-safe style
 *     suffix before it ever reaches the model. Free generators have weaker
 *     moderation than vetted stock/ARASAAC, so this gate is mandatory.
 *   - CACHED — identical prompts are served from a 24h in-memory cache to stay
 *     within the free-tier neuron budget and keep illustrations consistent.
 *
 * Mirrors the symbol-proxy.ts / image-proxy.ts conventions: Router +
 * requireAuth, in-memory cache with prune, returns a base64 data: URL the
 * client can embed straight into an <img>, PDF or e-book page.
 *
 * Endpoints:
 *   - GET  /api/generation-proxy/status
 *       { enabled } so the client can show/hide the feature gracefully.
 *   - POST /api/generation-proxy/illustrate
 *       body { prompt, style?, context? } -> { dataUrl, cached, attribution }.
 *
 * Required env (feature is OFF and returns enabled:false without them):
 *   - CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { filterPrompt } from "../lib/contentFilter.js";
import { hasCloudflareAI, generateImageFlux } from "../lib/cloudflare-ai.js";

const router = Router();

// ── Cache ─────────────────────────────────────────────────────────────────
interface GenCacheEntry {
  dataUrl: string;
  cachedAt: number;
}
const GEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_GEN_ENTRIES = 200;
const genCache = new Map<string, GenCacheEntry>();

function pruneGenCache() {
  if (genCache.size <= MAX_GEN_ENTRIES) return;
  const entries = [...genCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt);
  for (const [k] of entries.slice(0, genCache.size - MAX_GEN_ENTRIES)) {
    genCache.delete(k);
  }
}

// ── Child-safe style framing ─────────────────────────────────────────────────
// Appended to every prompt so free-tier output stays SEND-appropriate: calm,
// uncluttered, no text, no identifiable real people. A fixed style also nudges
// visual consistency across a story's pages (Part 11.6 §2 mitigation).
const SAFE_STYLE_SUFFIX =
  "Children's storybook illustration, simple flat shapes, soft calm colours, " +
  "gentle and friendly, low visual clutter, no text or words, no logos, " +
  "no realistic depictions of real or identifiable people. Age-appropriate for " +
  "primary-school SEND learners.";

const STYLE_PRESETS: Record<string, string> = {
  storybook: "Warm watercolour storybook style.",
  cartoon: "Bright simple cartoon style with bold outlines.",
  calm: "Muted pastel palette, minimal detail, soothing.",
  line: "Clean black-and-white line drawing suitable for colouring.",
};

const ATTRIBUTION =
  "Illustration generated with Cloudflare Workers AI (FLUX). Teacher-reviewed before use.";

function buildPrompt(rawPrompt: string, style?: string): string {
  const preset = style && STYLE_PRESETS[style] ? `${STYLE_PRESETS[style]} ` : "";
  return `${preset}${rawPrompt.trim()}. ${SAFE_STYLE_SUFFIX}`.slice(0, 1500);
}

function cacheKey(prompt: string, style: string): string {
  return `${style}:${prompt.trim().toLowerCase()}`;
}

// ── GET /api/generation-proxy/status ─────────────────────────────────────────
router.get("/status", requireAuth, (_req: Request, res: Response) => {
  res.json({
    enabled: hasCloudflareAI(),
    provider: "cloudflare-workers-ai-flux",
    purpose: "story-illustrations",
    note: "Teacher-initiated, safety-gated, cached. Never pupil-direct.",
  });
});

// ── POST /api/generation-proxy/illustrate ────────────────────────────────────
router.post("/illustrate", requireAuth, async (req: Request, res: Response) => {
  const rawPrompt = String(req.body?.prompt || "").trim().slice(0, 600);
  const style = String(req.body?.style || "storybook").trim().toLowerCase().slice(0, 32);

  if (!rawPrompt) return res.status(400).json({ error: "missing_prompt" });

  if (!hasCloudflareAI()) {
    // Feature not configured — tell the client so it can hide the control and
    // fall back to the lower (free, always-available) visual tiers.
    return res.status(503).json({ error: "generation_disabled", enabled: false });
  }

  // SAFETY GATE — refuse anything the safeguarding/inappropriate filter flags.
  const verdict = filterPrompt(rawPrompt);
  if (verdict.flagged) {
    console.warn(`[generation-proxy] blocked prompt (${verdict.category}/${verdict.severity})`);
    return res.status(422).json({
      error: "prompt_rejected",
      category: verdict.category,
      reason: "This description can't be used to generate an illustration.",
    });
  }

  const finalPrompt = buildPrompt(rawPrompt, style);
  const key = cacheKey(rawPrompt, style);

  const cached = genCache.get(key);
  if (cached && Date.now() - cached.cachedAt < GEN_TTL_MS) {
    res.setHeader("X-Cache", "HIT");
    return res.json({ dataUrl: cached.dataUrl, cached: true, attribution: ATTRIBUTION });
  }

  try {
    const img = await generateImageFlux(finalPrompt, { steps: 6 });
    if (!img) {
      return res.status(502).json({ error: "generation_failed" });
    }
    const dataUrl = `data:${img.contentType};base64,${img.base64}`;
    genCache.set(key, { dataUrl, cachedAt: Date.now() });
    pruneGenCache();
    res.setHeader("X-Cache", "MISS");
    return res.json({ dataUrl, cached: false, attribution: ATTRIBUTION });
  } catch (err: any) {
    console.error("[generation-proxy] illustrate error:", err?.message);
    return res.status(502).json({ error: "generation_failed" });
  }
});

export default router;
