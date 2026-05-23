/**
 * PR-9 — Generation cache: deterministic hash key builder.
 * Pure helper — no I/O, no Node crypto, works in browser + Node.
 */

export const CACHE_RELEVANT_FIELDS = [
  "subject",
  "topic",
  "yearGroup",
  "examBoard",
  "sendNeed",
  "generatorVersion",
  "tier",
] as const;

/**
 * Pick only the cache-relevant fields, sort keys, lowercase+trim values,
 * and JSON-stringify the result for hashing.
 */
export function buildCacheInput(
  fields: Record<string, string | null | undefined>,
): string {
  const picked: Record<string, string> = {};
  for (const key of CACHE_RELEVANT_FIELDS) {
    const raw = fields[key];
    picked[key] = raw != null ? raw.trim().toLowerCase() : "";
  }
  // Keys are already from the const array (sorted alphabetically by design),
  // but we sort explicitly for determinism.
  const sorted = Object.keys(picked).sort();
  const obj: Record<string, string> = {};
  for (const k of sorted) {
    obj[k] = picked[k];
  }
  return JSON.stringify(obj);
}

/**
 * djb2 32-bit hash, returns an 8-char lowercase hex string.
 * No crypto API, no Node built-ins.
 */
export function hashCacheInput(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // hash * 33 + charCode, kept to 32 bits via unsigned right shift
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Compute a deterministic cache key from the request fields.
 */
export function computeCacheKey(
  fields: Record<string, string | null | undefined>,
): string {
  return hashCacheInput(buildCacheInput(fields));
}
