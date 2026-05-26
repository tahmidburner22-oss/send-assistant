/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/routes/featureFlagsAdmin.ts — W3 (FEAT-H8 admin wiring).
 *
 * Two endpoints, both behind requireAuth + requireAdmin:
 *
 *   GET  /api/admin/feature-flags          → AllowListFile (current state)
 *   PUT  /api/admin/feature-flags          → replaces entries, returns new state
 *
 * The PUT body is `{ entries: FlagAllowEntry[] }`. Each entry is
 * validated by `validateAllowEntry`; if any fail, the whole write is
 * rejected with 400 and a `details` array.
 *
 * No DB table — flags are low-frequency, low-volume, easier to inspect /
 * back up as a single JSON file. If the volume grows past a few hundred
 * rows, swap the storage helper for a Postgres table without changing
 * the route surface.
 */

import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  DARK_FLAG_NAMES,
  readAllowListFromDisk,
  writeAllowListToDisk,
  validateAllowEntry,
} from "../lib/featureFlagAllowList.js";

const router = Router();

// GET /api/admin/feature-flags
router.get("/", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  try {
    const file = readAllowListFromDisk();
    res.json({
      version: file.version,
      entries: file.entries,
      updatedAt: file.updatedAt ?? null,
      knownFlags: DARK_FLAG_NAMES,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT /api/admin/feature-flags
router.put("/", requireAuth, requireAdmin, (req: Request, res: Response) => {
  const body = req.body as { entries?: unknown } | undefined;
  if (!body || !Array.isArray(body.entries)) {
    return res.status(400).json({ error: "Request body must be { entries: FlagAllowEntry[] }" });
  }
  const errors: { index: number; message: string }[] = [];
  for (let i = 0; i < body.entries.length; i++) {
    try {
      validateAllowEntry(body.entries[i]);
    } catch (err) {
      errors.push({ index: i, message: (err as Error).message });
    }
  }
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  try {
    const written = writeAllowListToDisk(body.entries as never);
    res.json({
      version: written.version,
      entries: written.entries,
      updatedAt: written.updatedAt ?? null,
      knownFlags: DARK_FLAG_NAMES,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
