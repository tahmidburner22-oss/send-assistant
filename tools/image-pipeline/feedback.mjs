/**
 * Teacher feedback queue.
 *
 * Lives at tools/image-pipeline/feedback.json. Each entry is a request
 * to regenerate one image with explicit flaws to fix:
 *
 *   {
 *     "id":         "pdl-0042",
 *     "flaws":      ["too-much-text", "background-not-white"],
 *     "note":       "the cat looked photoreal — needs flat illustration",
 *     "submittedBy": "github-username",
 *     "submittedAt": "2026-05-27T03:30:00Z",
 *     "issueNumber": 142,
 *     "applied":    false
 *   }
 *
 * The diagram-feedback workflow appends entries when a teacher submits
 * a GitHub Issue with the `diagram-feedback` label. The runner reads
 * un-applied entries on startup, marks the affected rows as `pending`
 * with the user's flaws attached, then sets `applied: true` so they
 * won't be re-applied on a later run (the next regeneration is
 * single-shot per feedback submission).
 *
 * Entries with `applied: true` are kept for audit (they tell us "this
 * row was regenerated because teacher X said Y on date Z").
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidFlaw } from "./flaws.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = path.resolve(__dirname, "feedback.json");

export async function loadFeedback(file = DEFAULT_PATH) {
  try {
    const t = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(t);
    if (!Array.isArray(parsed.entries)) {
      return { version: 1, entries: [] };
    }
    return parsed;
  } catch (err) {
    if (err.code === "ENOENT") return { version: 1, entries: [] };
    throw err;
  }
}

export async function saveFeedback(queue, file = DEFAULT_PATH) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(queue, null, 2) + "\n");
}

/**
 * Append a normalised set of feedback entries (from one GitHub Issue).
 * Filters out unknown flaw codes and trims notes to 400 chars.
 */
export function appendEntries(queue, entries) {
  for (const e of entries) {
    if (!e.id) continue;
    const flaws = (e.flaws || []).filter(isValidFlaw);
    queue.entries.push({
      id: e.id,
      flaws,
      note: String(e.note || "").trim().slice(0, 400),
      submittedBy: e.submittedBy || "unknown",
      submittedAt: e.submittedAt || new Date().toISOString(),
      issueNumber: e.issueNumber || null,
      applied: false,
    });
  }
  return queue;
}

/**
 * Index entries by row id, keeping ONLY the most recent un-applied
 * entry per id (a teacher who submits feedback twice on the same image
 * gets the latest set used).
 */
export function indexUnappliedById(queue) {
  const byId = new Map();
  for (const e of queue.entries) {
    if (e.applied) continue;
    const prev = byId.get(e.id);
    if (!prev || (e.submittedAt || "") > (prev.submittedAt || "")) {
      byId.set(e.id, e);
    }
  }
  return byId;
}

/**
 * Mark a list of feedback entries as applied. Mutates the queue.
 */
export function markApplied(queue, entries) {
  const ids = new Set(entries.map((e) => `${e.id}:${e.submittedAt}`));
  for (const entry of queue.entries) {
    if (ids.has(`${entry.id}:${entry.submittedAt}`)) {
      entry.applied = true;
      entry.appliedAt = new Date().toISOString();
    }
  }
}
