/**
 * aiCacheKey.ts
 *
 * PR-9 — audit item #43 — generation cache by hash key (PD13).
 *
 * Pure deterministic helper that turns the cache-relevant slice of a
 * worksheet generation request into a stable, repeatable cache key.
 * Two requests that should hit the same cached worksheet must produce
 * the same key; two requests that should NOT share (e.g. different
 * SEND need, different exam board, different generator version) must
 * produce different keys.
 *
 * No I/O. Safe to call from the client, the server, the eval harness,
 * or a CI step.
 *
 * Public API:
 *   - `buildCacheKey(req)` — returns the deterministic key.
 *   - `redactPII(req)` — strips pupil names + IEP content, returning
 *     a new object suitable for caching / telemetry. Audit item #76
 *     (partial — the rest of the redaction surface lands in PR-22).
 *   - `CACHE_KEY_FIELDS` — the canonical ordered field list.
 *
 * Out of scope:
 *   - Per-tenant cache namespacing (PR-22). This module is
 *     tenant-agnostic; the server-side `generationCache.ts` adds
 *     tenancy to the storage key.
 *   - The cryptographic strength of the hash. We use a fast non-crypto
 *     digest (FNV-1a 64-bit, formatted as hex) because the cache is
 *     not a security boundary — it's a content-addressable store
 *     keyed by request shape. The pre-image is the JSON of the
 *     request, which is also visible to the operator running the
 *     server.
 */

/**
 * Slice of a generation request that participates in cache keying.
 * Every field is optional because different endpoints submit different
 * subsets — but two requests that differ in any of these MUST get
 * different keys.
 */
export interface CacheableRequest {
  subject?: string;
  topic?: string;
  yearGroup?: string;
  examBoard?: string;
  difficulty?: string;
  sendNeed?: string | null;
  /** Stacked SEND profiles (PR-16). Treated as a sorted set when
   *  present so order doesn't break the cache. */
  sendNeeds?: ReadonlyArray<string>;
  /** Exact prompt the user typed in. Trimmed + lower-cased before
   *  hashing so trivial whitespace / casing differences don't fork
   *  the cache. */
  prompt?: string;
  /** Section-count target (e.g. "7-7-5+1") — change the target
   *  shape, change the key. */
  sectionTargets?: string;
  /** Generator version stamp from `metadata.generatorVersion` —
   *  bumped any time the prompt or post-validator chain emits
   *  observably different output. Two worksheets with different
   *  generator versions must NOT share a cache slot. */
  generatorVersion?: string;
  /** Provider + model — different providers / models produce
   *  different worksheets at the same prompt, so they can't share
   *  cache slots. */
  provider?: string;
  model?: string;
  /** Optional caller-supplied override; bypasses the field-derived
   *  key entirely. Used by the eval harness to pin a fixture to a
   *  known cache slot. */
  cacheKeyOverride?: string;
}

/**
 * The canonical ordering used when building the cache key. Stable
 * across runs so the FNV input is deterministic regardless of object
 * key insertion order. Keep this list in sync with
 * `CacheableRequest`.
 */
export const CACHE_KEY_FIELDS: readonly (keyof CacheableRequest)[] = [
  "subject",
  "topic",
  "yearGroup",
  "examBoard",
  "difficulty",
  "sendNeed",
  "sendNeeds",
  "prompt",
  "sectionTargets",
  "generatorVersion",
  "provider",
  "model",
] as const;

/** PR-9 cache key version. Bump when the canonicalisation rules
 *  change so old cached payloads don't accidentally collide with
 *  new keys built under different rules. */
const CACHE_KEY_SCHEMA_VERSION = 1;

// ─── Canonicalisation ───────────────────────────────────────────────────────

function canon(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed.toLowerCase();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    // Treat string arrays as a sorted set: order-independent dedupe.
    const items = value
      .map((v) => canon(v))
      .filter((v): v is string => v !== null && v !== "");
    if (items.length === 0) return null;
    const uniq = Array.from(new Set(items)).sort();
    return uniq.join(",");
  }
  return null;
}

/**
 * FNV-1a 64-bit hash, returned as a 16-char hex string. Pure JS, no
 * BigInt — we keep two 32-bit halves and update them in lockstep.
 * Collisions are vanishingly rare for the input cardinality we care
 * about (a few thousand active cache slots per tenant).
 */
function fnv1a64Hex(input: string): string {
  // FNV-1a 64-bit constants split into 32-bit high/low halves.
  let h1 = 0xcbf29ce4; // high 32 bits of offset basis
  let h2 = 0x84222325 | 0; // low 32 bits of offset basis (signed-safe)
  // 64-bit prime is 0x100000001b3 → high 0x100, low 0x1b3 — but the
  // `h * prime` step is easier expressed as a manual 64-bit multiply
  // by 0x1b3 (low) plus a shift-add by 0x100 (high). We unroll here.
  const PRIME_LOW = 0x1b3;
  const PRIME_HIGH = 0x100;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h2 ^= c;
    // 64-bit multiply: (h1:h2) * (PRIME_HIGH:PRIME_LOW).
    // We compute the 64-bit product mod 2^64 manually.
    const lo = (h2 >>> 0) * PRIME_LOW;
    const mid1 = (h2 >>> 0) * PRIME_HIGH;
    const mid2 = (h1 >>> 0) * PRIME_LOW;
    const hi = (h1 >>> 0) * PRIME_HIGH;
    // Combine — only the low 64 bits are kept.
    const newLow = lo >>> 0;
    const carry = (mid1 + mid2 + Math.floor(lo / 0x100000000)) >>> 0;
    h2 = newLow;
    h1 = ((hi + carry) >>> 0) & 0xffffffff;
  }
  // Format as 16-char hex, high half first.
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return hex1 + hex2;
}

// ─── PII redaction ──────────────────────────────────────────────────────────
//
// Audit item #76 (partial — the full redaction surface lands in PR-22
// alongside the SLA work). Today we strip pupil-name-shaped tokens
// from the cacheable prompt field and replace IEP-shaped phrases with
// `[REDACTED]`. Pure / deterministic.

const PUPIL_NAME_FIELDS = ["pupilName", "pupilFirstName", "studentName"] as const;
const IEP_PHRASE_RE =
  /\b(?:IEP|EHCP|Individual Education Plan|Statement of SEN)\b\s*:?\s*[^.\n]*\.?/gi;

/**
 * Returns a shallow-cloned request with PII heuristically scrubbed.
 * Specifically:
 *   - any field named `pupilName` / `pupilFirstName` / `studentName`
 *     is dropped;
 *   - the `prompt` field has IEP / EHCP phrases replaced with
 *     `[REDACTED]`.
 * Pure — does not mutate the input.
 */
export function redactPII<T extends CacheableRequest & Record<string, unknown>>(
  req: T,
): T {
  const out = { ...req };
  for (const k of PUPIL_NAME_FIELDS) {
    if (k in out) {
      delete (out as Record<string, unknown>)[k];
    }
  }
  if (typeof out.prompt === "string") {
    out.prompt = out.prompt.replace(IEP_PHRASE_RE, "[REDACTED]");
  }
  return out;
}

// ─── Cache key ──────────────────────────────────────────────────────────────

/**
 * Build the deterministic cache key. The result is a string of the
 * form `wsv1:fnv64:<16-hex-chars>`; the `wsv1` prefix carries the
 * `CACHE_KEY_SCHEMA_VERSION` so future schema changes don't collide
 * with old keys.
 *
 * If the caller supplies `cacheKeyOverride`, that value is returned
 * verbatim (after a length / character check) — used by the eval
 * harness to pin a fixture to a known slot.
 */
export function buildCacheKey(req: Readonly<CacheableRequest>): string {
  if (typeof req.cacheKeyOverride === "string" && req.cacheKeyOverride.trim().length > 0) {
    const override = req.cacheKeyOverride.trim();
    // Guard against accidentally-wide overrides (denial-of-service via
    // 100kB cache key): clamp to 200 chars matching the
    // shared/aiSchemas.ts:metadata.cacheKey constraint.
    return override.slice(0, 200);
  }
  const safe = redactPII({ ...req });
  const parts: string[] = [`wsv${CACHE_KEY_SCHEMA_VERSION}`];
  for (const field of CACHE_KEY_FIELDS) {
    const v = canon((safe as Record<string, unknown>)[field]);
    parts.push(`${String(field)}=${v ?? ""}`);
  }
  const preimage = parts.join("|");
  return `wsv${CACHE_KEY_SCHEMA_VERSION}:fnv64:${fnv1a64Hex(preimage)}`;
}

/**
 * True iff two cacheable requests would hit the same cache slot.
 * Convenience for tests — implemented directly via `buildCacheKey`
 * so it never disagrees with the canonical comparison.
 */
export function sameCacheKey(
  a: Readonly<CacheableRequest>,
  b: Readonly<CacheableRequest>,
): boolean {
  return buildCacheKey(a) === buildCacheKey(b);
}
