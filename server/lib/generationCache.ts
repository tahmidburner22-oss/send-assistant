/**
 * generationCache.ts
 *
 * PR-9 — audit item #43 — server-side generation cache by hash key
 * (PD13). Pluggable cache wrapper so callers can opt into
 * content-addressable reuse of expensive worksheet generations.
 *
 * The cache is OFF by default. A request only hits the cache when:
 *   - the env flag `GENERATION_CACHE_ENABLED=1` is set, AND
 *   - the caller explicitly invokes `withGenerationCache(...)` /
 *     `getCached(...)` / `setCached(...)`.
 *
 * Two backends are bundled:
 *   - `InMemoryCacheBackend` (default) — single-process LRU with TTL.
 *     Safe in the INTEGRATIONS_ONLY sandbox, used by the test suite,
 *     used in production when the operator hasn't enabled DB caching.
 *   - `BackendAdapter` — interface every backend must satisfy. The
 *     SQL-backed implementation that reads/writes the
 *     `generation_cache` table introduced in `server/db/schema.sql`
 *     ships as a tiny adapter that conforms to this interface and
 *     can be swapped in via `setBackend(...)`.
 *
 * Cache keys come from
 * `client/src/lib/aiCacheKey.ts:buildCacheKey` so client and server
 * agree on the canonical shape. PII is redacted upstream by
 * `redactPII` (same module) before the key is built — this module
 * re-runs the redaction on the payload at write-time as defence in
 * depth.
 *
 * Out of scope:
 *   - Per-tenant cache namespacing (PR-22 SLA).
 *   - The actual SQL adapter — landing in PR-22 alongside the schema
 *     deprecation policy. The migration this PR adds is idempotent
 *     so the table is ready when the adapter ships.
 *   - Telemetry / hit-rate dashboards (PR-27).
 */

import {
  buildCacheKey,
  redactPII,
  type CacheableRequest,
} from "../../client/src/lib/aiCacheKey";

// ─── Public types ───────────────────────────────────────────────────────────

/**
 * One entry in the cache. `payload` is whatever the caller wants to
 * cache — typically a parsed worksheet object. We store a generic
 * `unknown` so the cache stays domain-agnostic; the caller asserts
 * the shape on its own side after retrieval.
 */
export interface CacheEntry {
  key: string;
  payload: unknown;
  insertedAt: number;
  /** Number of times `getCached` returned this payload. */
  hits: number;
  /** Absolute expiry, as ms-since-epoch. `Number.POSITIVE_INFINITY`
   *  for entries with no TTL. */
  expiresAt: number;
}

/**
 * Pluggable backend interface. The default in-memory implementation
 * lives below. PR-22 will add a SQL-backed adapter that conforms to
 * the same contract.
 */
export interface BackendAdapter {
  get(key: string): CacheEntry | null;
  set(entry: CacheEntry): void;
  /** Drop all entries — used by tests and by ops when invalidating
   *  after a generator-version bump. */
  clear(): void;
  /** Approximate number of entries currently held. */
  size(): number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  writes: number;
  size: number;
  enabled: boolean;
}

// ─── In-memory backend ─────────────────────────────────────────────────────

const DEFAULT_LRU_CAP = 256;

/**
 * Tiny LRU cache with TTL. Entries are kept in a Map (insertion-ordered
 * iteration), and on hit we delete-then-set to bump the entry to the
 * end. Eviction drops the oldest entry until size <= cap.
 */
export class InMemoryCacheBackend implements BackendAdapter {
  private store: Map<string, CacheEntry>;
  private cap: number;

  constructor(capacity: number = DEFAULT_LRU_CAP) {
    this.store = new Map();
    this.cap = Math.max(1, Math.floor(capacity));
  }

  get(key: string): CacheEntry | null {
    const e = this.store.get(key);
    if (!e) return null;
    if (e.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    // Bump to most-recent.
    this.store.delete(key);
    this.store.set(key, e);
    return e;
  }

  set(entry: CacheEntry): void {
    if (this.store.has(entry.key)) {
      this.store.delete(entry.key);
    }
    this.store.set(entry.key, entry);
    while (this.store.size > this.cap) {
      const oldestKey = this.store.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.store.delete(oldestKey);
    }
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

// ─── Module-level singleton state ──────────────────────────────────────────

let backend: BackendAdapter = new InMemoryCacheBackend();
const stats: CacheStats = {
  hits: 0,
  misses: 0,
  writes: 0,
  size: 0,
  enabled: false,
};

/**
 * True iff the env flag is set. Recomputed on every call so tests can
 * mutate `process.env` without restarting the module.
 */
function envEnabled(): boolean {
  // INTEGRATIONS_ONLY sandbox sets no env vars; production sets
  // GENERATION_CACHE_ENABLED=1 in the deploy config.
  return (process.env.GENERATION_CACHE_ENABLED || "").trim() === "1";
}

/**
 * Tests / ops can replace the backend at runtime — e.g. swap in the
 * SQL-backed adapter when it ships in PR-22, or replace with a stub
 * for unit tests.
 */
export function setBackend(b: BackendAdapter): void {
  backend = b;
  stats.size = backend.size();
}

/** Reset all cache state. Tests use this; production never calls it. */
export function resetCacheForTests(capacity?: number): void {
  backend = new InMemoryCacheBackend(capacity);
  stats.hits = 0;
  stats.misses = 0;
  stats.writes = 0;
  stats.size = 0;
  stats.enabled = envEnabled();
}

/** Snapshot of current counters. */
export function getCacheStats(): Readonly<CacheStats> {
  return { ...stats, size: backend.size(), enabled: envEnabled() };
}

// ─── Public API ─────────────────────────────────────────────────────────────

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Look up a cached payload by request shape. Returns `null` when:
 *   - the cache is disabled by env flag,
 *   - no entry matches the request,
 *   - the matching entry has expired.
 *
 * On a hit, the entry's `hits` counter is incremented.
 */
export function getCached<T = unknown>(
  req: Readonly<CacheableRequest>,
): { payload: T; key: string; hits: number } | null {
  if (!envEnabled()) {
    stats.enabled = false;
    return null;
  }
  stats.enabled = true;
  const key = buildCacheKey(req);
  const entry = backend.get(key);
  if (!entry) {
    stats.misses += 1;
    return null;
  }
  entry.hits += 1;
  backend.set(entry); // refresh LRU position + bump hit counter
  stats.hits += 1;
  return { payload: entry.payload as T, key, hits: entry.hits };
}

/**
 * Insert / overwrite a cache entry. No-op when the cache is disabled.
 * Returns the deterministic key the entry was written under (so the
 * caller can stamp it on `worksheet.metadata.cacheKey` even when
 * `cacheHit` is false).
 *
 * Defence-in-depth: re-runs PII redaction on the request before
 * computing the key. Even if the caller forgot to redact, the key is
 * built from a redacted view.
 */
export function setCached(
  req: Readonly<CacheableRequest>,
  payload: unknown,
  opts: { ttlMs?: number } = {},
): { key: string; written: boolean } {
  if (!envEnabled()) {
    stats.enabled = false;
    return { key: buildCacheKey(redactPII({ ...req })), written: false };
  }
  stats.enabled = true;
  const key = buildCacheKey(redactPII({ ...req }));
  const ttl = typeof opts.ttlMs === "number" && opts.ttlMs > 0 ? opts.ttlMs : DEFAULT_TTL_MS;
  const entry: CacheEntry = {
    key,
    payload,
    insertedAt: Date.now(),
    hits: 0,
    expiresAt: ttl === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Date.now() + ttl,
  };
  backend.set(entry);
  stats.writes += 1;
  return { key, written: true };
}

/**
 * Convenience wrapper for the common pattern of "look up the cache;
 * if missing, run the generator; cache the result". The generator is
 * only invoked on a miss. Returns `{ payload, fromCache, cacheKey }`
 * so the caller can stamp `metadata.cacheHit` and `metadata.cacheKey`
 * onto the returned worksheet.
 */
export async function withGenerationCache<T>(
  req: Readonly<CacheableRequest>,
  generator: () => Promise<T>,
  opts: { ttlMs?: number } = {},
): Promise<{ payload: T; fromCache: boolean; cacheKey: string }> {
  const hit = getCached<T>(req);
  if (hit) {
    return { payload: hit.payload, fromCache: true, cacheKey: hit.key };
  }
  const payload = await generator();
  const { key } = setCached(req, payload, opts);
  return { payload, fromCache: false, cacheKey: key };
}
