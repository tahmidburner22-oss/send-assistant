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

// ────────────────────────────────────────────────────────────────────
// Phase priority — controls the ORDER catalogue rows are processed in.
//
// Set by the user request: GCSE first, then KS3, then KS1 (incl. the
// "KS1+KS2" hybrid band), then KS2 (split into Lower KS2 = Year 3–4
// then Upper KS2 = Year 5–6), then A-Level. Anything with an unknown
// or empty `year_band` sinks to the bottom of the queue.
//
// Within a phase the order is: fresh `pending` first, then `ai-failed`
// retries, then `provider-out` retries, then by id (stable CSV order).
//
// Teacher-feedback rows (managed by the runner via feedback.mjs)
// override this order — they always run first regardless of phase.
// ────────────────────────────────────────────────────────────────────
export const PHASE_PRIORITY = {
  GCSE: 1,
  KS3: 2,
  KS1: 3,
  "KS1+KS2": 4, // hybrid band, leans toward KS1
  LKS2: 5,
  UKS2: 6,
  "A-Level": 7,
};

const STATUS_PRIORITY = {
  pending: 0,
  "ai-failed": 1,
  "provider-out": 2,
};

function phasePriority(row) {
  const band = String(row?.year_band || "").trim();
  // Unknown bands sink to the bottom but still get processed.
  return PHASE_PRIORITY[band] ?? 999;
}

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
 * Pick the next batch of catalogue rows to process.
 *
 * Skips rows whose status is `done`, `svg-rendered`, or `skipped`.
 *
 * Sort key (lex): (phasePriority, statusPriority, id).
 *   - phasePriority comes from PHASE_PRIORITY above.
 *   - statusPriority is pending(0) → ai-failed(1) → provider-out(2).
 *   - id is stable to make reruns reproducible.
 */
export function pickBatch(state, catalogue, batchSize) {
  const candidates = [];
  for (const row of catalogue) {
    const status = state.rows[row.id]?.status || "pending";
    if (status === "done" || status === "svg-rendered" || status === "skipped") {
      continue;
    }
    candidates.push({ row, status });
  }
  candidates.sort((a, b) => {
    const pa = phasePriority(a.row);
    const pb = phasePriority(b.row);
    if (pa !== pb) return pa - pb;
    const sa = STATUS_PRIORITY[a.status] ?? 99;
    const sb = STATUS_PRIORITY[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return String(a.row.id).localeCompare(String(b.row.id));
  });
  return candidates.slice(0, batchSize).map((c) => c.row);
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

/**
 * Per-phase progress for the dashboard.
 * Returns an array in PHASE_PRIORITY order with done / total per phase.
 */
export function summariseByPhase(state, catalogue) {
  const phases = Object.keys(PHASE_PRIORITY).sort(
    (a, b) => PHASE_PRIORITY[a] - PHASE_PRIORITY[b],
  );
  const out = phases.map((phase) => ({
    phase,
    total: 0,
    done: 0,
    pending: 0,
    failed: 0,
  }));
  const idx = new Map(out.map((o) => [o.phase, o]));
  for (const row of catalogue) {
    const phase = String(row.year_band || "").trim();
    const bucket = idx.get(phase);
    if (!bucket) continue;
    bucket.total += 1;
    const s = state.rows[row.id]?.status || "pending";
    if (s === "done" || s === "svg-rendered") bucket.done += 1;
    else if (s === "ai-failed" || s === "provider-out") bucket.failed += 1;
    else if (s === "pending") bucket.pending += 1;
  }
  return out;
}
