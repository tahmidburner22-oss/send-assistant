/**
 * Pipeline state.
 *
 * Stored at tools/image-pipeline/state.json. Tracks per-row status:
 *   { id: 'pdl-0001', status, attempts, lastError, lastQa, generatedAt,
 *     provider, strategy, renderer }
 *
 * Statuses:
 *   pending       — not yet processed
 *   done          — image produced and passed QA
 *   svg-rendered  — image produced via deterministic SVG renderer
 *   ai-failed     — QA failed too many times; will be retried in a later batch
 *   provider-out  — provider chain exhausted; will be retried in a later batch
 *   skipped       — manually marked as "do not generate"
 */
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_PATH = path.resolve(
  process.cwd(),
  "tools/image-pipeline/state.json",
);

export async function loadState(file = DEFAULT_PATH) {
  try {
    const t = await fs.readFile(file, "utf8");
    return JSON.parse(t);
  } catch (err) {
    if (err.code === "ENOENT") {
      return { version: 1, updatedAt: new Date().toISOString(), rows: {} };
    }
    throw err;
  }
}

export async function saveState(state, file = DEFAULT_PATH) {
  state.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(state, null, 2) + "\n");
}

export function get(state, id) {
  return state.rows[id];
}

export function set(state, id, patch) {
  const prev = state.rows[id] || {};
  state.rows[id] = { ...prev, ...patch, updatedAt: new Date().toISOString() };
}

/**
 * Pick the next batch of pending row ids from the given catalogue.
 * Skips rows currently marked done / svg-rendered / skipped.
 *
 * Sort priority: pending → ai-failed (retry) → provider-out (retry).
 */
export function pickBatch(state, catalogue, batchSize) {
  const pending = [];
  const aiFailed = [];
  const providerOut = [];
  for (const row of catalogue) {
    const s = state.rows[row.id]?.status || "pending";
    if (s === "done" || s === "svg-rendered" || s === "skipped") continue;
    if (s === "ai-failed") aiFailed.push(row);
    else if (s === "provider-out") providerOut.push(row);
    else pending.push(row);
  }
  return [...pending, ...aiFailed, ...providerOut].slice(0, batchSize);
}

/**
 * Computed summary for the dashboard.
 */
export function summarise(state, catalogue) {
  const counts = {
    total: catalogue.length,
    done: 0,
    "svg-rendered": 0,
    pending: 0,
    "ai-failed": 0,
    "provider-out": 0,
    skipped: 0,
  };
  for (const row of catalogue) {
    const s = state.rows[row.id]?.status || "pending";
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}
