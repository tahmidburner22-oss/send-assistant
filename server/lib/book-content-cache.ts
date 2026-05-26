/**
 * book-content-cache.ts — In-memory cache of parsed book content,
 * page-by-page, keyed by a deterministic hash of the uploaded file.
 *
 * Why: the Book Questions tool grounds AI-generated questions in the
 * exact pages a pupil has read. Re-uploading the same book for every
 * chapter would be a poor teacher experience, so we cache parsed pages
 * for 24 hours per server process.
 *
 * Capacity: ~50 books or ~50MB total, whichever comes first. The cache
 * uses an LRU eviction policy. No persistence — entries are lost on
 * restart, which is acceptable because re-uploading is cheap.
 *
 * Cache key shape: schoolId + sha256(file). This means two teachers in
 * the same school who upload the same book share the entry, which is
 * desirable. Cross-school content stays isolated.
 */
import { createHash } from "crypto";

export interface CachedBook {
  bookId: string;
  /** Parsed text per page. pages[0] = page 1 etc. */
  pages: string[];
  /** Original filename, for display. */
  filename: string;
  /** Optional teacher-supplied title — falls back to filename. */
  title?: string;
  /** Bytes used by the parsed text (rough). */
  byteSize: number;
  /** Wall-clock createdAt — for TTL eviction. */
  createdAt: number;
  /** Updated on every read; drives LRU. */
  lastUsedAt: number;
}

const MAX_ENTRIES = 50;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // ~50MB of parsed text
const TTL_MS = 24 * 60 * 60 * 1000;        // 24 hours

const store = new Map<string, CachedBook>();

/**
 * Compute the deterministic cache id for a given book file. The id is
 * stable across uploads of the same bytes, so re-uploading is a no-op
 * cache hit. Scoped to school so distinct schools don't share entries.
 */
export function computeBookId(buffer: Buffer, schoolId: string | null | undefined): string {
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 32);
  const scope = schoolId || "anon";
  return `${scope}:${hash}`;
}

function evictExpired(now: number) {
  for (const [id, entry] of store) {
    if (now - entry.createdAt > TTL_MS) store.delete(id);
  }
}

function totalBytes(): number {
  let sum = 0;
  for (const entry of store.values()) sum += entry.byteSize;
  return sum;
}

function evictLruUntilUnder(limit: number) {
  // Sort by lastUsedAt ascending — oldest first.
  const sorted = [...store.entries()].sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt);
  for (const [id] of sorted) {
    if (store.size <= MAX_ENTRIES && totalBytes() <= limit) break;
    store.delete(id);
  }
}

export function setBook(entry: Omit<CachedBook, "createdAt" | "lastUsedAt">): CachedBook {
  const now = Date.now();
  evictExpired(now);
  const full: CachedBook = { ...entry, createdAt: now, lastUsedAt: now };
  store.set(entry.bookId, full);
  if (store.size > MAX_ENTRIES || totalBytes() > MAX_TOTAL_BYTES) {
    evictLruUntilUnder(MAX_TOTAL_BYTES);
  }
  return full;
}

export function getBook(bookId: string): CachedBook | undefined {
  const now = Date.now();
  evictExpired(now);
  const entry = store.get(bookId);
  if (!entry) return undefined;
  entry.lastUsedAt = now;
  return entry;
}

/**
 * Slice the cached book to a given 1-indexed page range, returning the
 * combined text plus the actual page numbers used (clamped to range).
 */
export function getPageRangeText(
  bookId: string,
  pagesFrom?: number | null,
  pagesTo?: number | null,
): { text: string; firstPage: number; lastPage: number; totalPages: number } | undefined {
  const entry = getBook(bookId);
  if (!entry) return undefined;
  const total = entry.pages.length;
  if (total === 0) return { text: "", firstPage: 0, lastPage: 0, totalPages: 0 };
  const from = Math.max(1, Math.min(total, pagesFrom || 1));
  const to = Math.max(from, Math.min(total, pagesTo || total));
  const slice = entry.pages.slice(from - 1, to);
  return {
    text: slice.map((p, i) => `\n[Page ${from + i}]\n${p}`).join("\n"),
    firstPage: from,
    lastPage: to,
    totalPages: total,
  };
}

export function clearAll(): void {
  store.clear();
}
