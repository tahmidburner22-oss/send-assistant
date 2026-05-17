/**
 * routes/lti.ts — FEAT-PC3 · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * LTI 1.3 routes:
 *   GET  /lti/.well-known/jwks.json  — public JWKS for tool consumers
 *   GET  /lti/login                  — OIDC login initiation
 *   POST /lti/login                  — OIDC login initiation (some platforms POST)
 *   POST /lti/launch                 — resource-link / deep-link launch
 *   POST /lti/grades                 — score passback (internal API)
 *   GET  /lti/deeplink               — deep link picker page
 *
 * All routes are unauthenticated from Adaptly's perspective — auth is
 * handled by the LTI JWT validation in launch.ts.
 */

import { Router, type Request, type Response } from "express";
import { getJwks } from "../integrations/lti/keyset.js";
import { handleOidcLogin, handleLaunch } from "../integrations/lti/launch.js";
import { postScore, type AgsConfig, type AgsScorePayload } from "../integrations/lti/grades.js";

const router = Router();

// ─── JWKS endpoint ─────────────────────────────────────────────────────────

router.get("/.well-known/jwks.json", async (_req: Request, res: Response) => {
  const jwks = await getJwks();
  if (!jwks) {
    res.status(503).json({ error: "LTI not configured (missing key pair)" });
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json(jwks);
});

// ─── OIDC Login initiation ─────────────────────────────────────────────────

router.get("/login", (req: Request, res: Response) => {
  handleOidcLogin(req, res);
});

router.post("/login", (req: Request, res: Response) => {
  handleOidcLogin(req, res);
});

// ─── Launch (resource-link or deep-link) ───────────────────────────────────

router.post("/launch", async (req: Request, res: Response) => {
  await handleLaunch(req, res);
});

// ─── Deep link picker ──────────────────────────────────────────────────────

router.get("/deeplink", (_req: Request, res: Response) => {
  // In a full implementation this would render a React page for picking
  // worksheets/units. For now return a placeholder.
  res.send(`<!DOCTYPE html>
<html><head><title>Adaptly — Select Content</title></head>
<body>
  <h1>Select content to link</h1>
  <p>This page will display available worksheets and units for deep linking.</p>
  <p><em>LTI deep linking picker — coming in a future update.</em></p>
</body></html>`);
});

// ─── Score passback (internal API — called by the app after quiz completion) ─

router.post("/grades", async (req: Request, res: Response) => {
  try {
    const { config, score } = req.body as {
      config: AgsConfig;
      score: AgsScorePayload;
    };

    if (!config || !score) {
      res.status(400).json({ error: "Missing config or score payload" });
      return;
    }

    await postScore(config, score);
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[LTI grades]", message);
    res.status(502).json({ error: message });
  }
});

export default router;
