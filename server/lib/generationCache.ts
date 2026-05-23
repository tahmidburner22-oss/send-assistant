/**
 * PR-9 — Generation cache: in-memory LRU wrapper.
 * Disabled by default behind GENERATION_CACHE_ENABLED=1 env flag.
 */

import { computeCacheKey } from "../../client/src/lib/aiCacheKey.js";

// Re-export for convenience
export { computeCacheKey };

export const CACHE_ENABLED: boolean =
  process.env.GENERATION_CACHE_ENABLED === "1";

const MAX_ENTRIES = 200;
const DEFAULT_TTL_MS = 3_600_000; // 1 hour

interface CacheEntry {
  ws: unknown;
  insertedAt: number;
  hits: number;
  ttlMs: number;
}

const store = new Map<string, CacheEntry>();

/**
 * Retrieve a cached worksheet by key.
 * Returns null when the cache is disabled, on miss, or when the entry has expired.
 */
export function getCached(key: string): unknown | null {
  if (!CACHE_ENABLED) return null;
  const entry = store.get(key);
  if (!entry) return null;
  // Check TTL
  if (Date.now() - entry.insertedAt > entry.ttlMs) {
    store.delete(key);
    return null;
  }
  entry.hits += 1;
  return entry.ws;
}

/**
 * Store a worksheet in the cache. No-op when CACHE_ENABLED is false.
 * Evicts the oldest entry when the cache exceeds MAX_ENTRIES.
 */
export function setCached(
  key: string,
  ws: unknown,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  if (!CACHE_ENABLED) return;
  // Evict oldest if at capacity
  if (store.size >= MAX_ENTRIES && !store.has(key)) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) {
      store.delete(oldestKey);
    }
  }
  store.set(key, { ws, insertedAt: Date.now(), hits: 0, ttlMs });
}

/**
 * Deep-clone a worksheet and strip PII fields:
 * - metadata.pupilName -> '[redacted]'
 * - metadata.iepTargets -> deleted
 * - metadata.reteach.pupilsTargeted -> deleted
 */
export function redactPii(ws: unknown): unknown {
  const clone = JSON.parse(JSON.stringify(ws));
  if (clone && typeof clone === "object") {
    const meta = (clone as Record<string, unknown>).metadata;
    if (meta && typeof meta === "object") {
      const m = meta as Record<string, unknown>;
      if ("pupilName" in m) {
        m.pupilName = "[redacted]";
      }
      if ("iepTargets" in m) {
        delete m.iepTargets;
      }
      if (m.reteach && typeof m.reteach === "object") {
        const r = m.reteach as Record<string, unknown>;
        if ("pupilsTargeted" in r) {
          delete r.pupilsTargeted;
        }
      }
    }
  }
  return clone;
}

/**
 * Return current cache statistics.
 */
export function cacheStats(): { size: number; enabled: boolean } {
  return { size: store.size, enabled: CACHE_ENABLED };
}
