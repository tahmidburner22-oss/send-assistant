/**
 * symbol-resolver.ts
 *
 * Client helper for AAC/SEND symbol support, backed by the server
 * /api/symbol-proxy route (ARASAAC pictograms — free, CC BY-NC-SA).
 *
 * This is the platform's SEND visual differentiator: symbol support cannot be
 * met by stock photos or AI image generation, so it draws from a consistent,
 * openly-licensed pictogram library. Use it to add a symbol above/below any
 * word (Colourful Semantics, communication boards, symbol-supported text).
 *
 * Pure TS — no React. Safe to import anywhere. Per-session memoisation
 * de-duplicates lookups; the server keeps its own 24h cache.
 */

export interface SymbolResult {
  id: number;
  keyword: string;
  url: string;
  thumbUrl: string;
  source: "arasaac";
  attribution: string;
  licence: string;
  sourceUrl: string;
}

interface SymbolSearchResponse {
  results: SymbolResult[];
  cached?: boolean;
  error?: string;
}

const memo = new Map<string, SymbolResult[]>();
const inFlight = new Map<string, Promise<SymbolResult[]>>();

function cacheKey(q: string, lang: string, limit: number): string {
  return `${lang}:${limit}:${q.trim().toLowerCase()}`;
}

/**
 * Search ARASAAC for pictograms matching a word/phrase.
 * Returns [] on any failure (no symbols, network error, proxy down) so callers
 * can degrade gracefully to text-only.
 */
export async function searchSymbols(
  query: string,
  opts: { lang?: string; limit?: number } = {},
): Promise<SymbolResult[]> {
  const q = query.trim();
  if (!q) return [];
  const lang = (opts.lang || "en").toLowerCase();
  const limit = Math.min(Math.max(opts.limit ?? 12, 1), 24);
  const key = cacheKey(q, lang, limit);

  if (memo.has(key)) return memo.get(key)!;
  const existing = inFlight.get(key);
  if (existing) return existing;

  const p = (async () => {
    try {
      const params = new URLSearchParams({ q, lang, limit: String(limit) });
      const res = await fetch(`/api/symbol-proxy/search?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        memo.set(key, []);
        return [];
      }
      const json = (await res.json()) as SymbolSearchResponse;
      const results = Array.isArray(json.results) ? json.results : [];
      memo.set(key, results);
      return results;
    } catch {
      memo.set(key, []);
      return [];
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, p);
  return p;
}

/**
 * Convenience: resolve the single best pictogram for a word (the first hit),
 * or null if none exist. Handy for "symbol above each word" rendering.
 */
export async function resolveSymbol(
  word: string,
  opts: { lang?: string } = {},
): Promise<SymbolResult | null> {
  const results = await searchSymbols(word, { lang: opts.lang, limit: 1 });
  return results.length > 0 ? results[0] : null;
}

/**
 * Resolve a symbol for each word/phrase in a list, in parallel (bounded).
 * Returns a map keyed by the original term. Terms with no pictogram are
 * simply absent from the map so the caller can fall back to text.
 */
export async function resolveSymbolsForWords(
  words: string[],
  opts: { lang?: string; concurrency?: number } = {},
): Promise<Record<string, SymbolResult>> {
  const out: Record<string, SymbolResult> = {};
  const unique = Array.from(new Set(words.map((w) => w.trim()).filter(Boolean)));
  if (unique.length === 0) return out;

  const concurrency = Math.min(Math.max(opts.concurrency ?? 5, 1), 10);
  let cursor = 0;
  async function worker() {
    while (cursor < unique.length) {
      const term = unique[cursor++];
      const hit = await resolveSymbol(term, { lang: opts.lang });
      if (hit) out[term] = hit;
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, unique.length) }, () => worker()),
  );
  return out;
}

/**
 * Fetch a pictogram as a data: URL via the server proxy, for PDF/PPTX
 * embedding (browsers block direct cross-origin canvas reads otherwise).
 * Returns null on failure so exporters can skip the symbol gracefully.
 */
export async function fetchSymbolAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/symbol-proxy/fetch?url=${encodeURIComponent(url)}&format=base64`,
      { credentials: "include" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { dataUrl?: string };
    return typeof json.dataUrl === "string" ? json.dataUrl : null;
  } catch {
    return null;
  }
}
