/**
 * SymbolSupportedWords — reusable ARASAAC symbol rendering for word banks /
 * vocabulary, used across the Presentation Maker (now) and the Worksheet
 * renderer (V5b). Backed by the free, CC-BY-NC-SA ARASAAC pictogram library
 * via the `symbol-resolver` client helper (server `/api/symbol-proxy`).
 *
 * Everything here is ADDITIVE and degrades gracefully:
 *   - `TermSymbol` renders nothing until a pictogram resolves, and nothing at
 *     all if a word has no symbol — so turning symbol support on can never
 *     break or blank out existing term/definition text.
 *   - All network work is memoised inside `symbol-resolver`, so re-renders are
 *     cheap and a 8-term board makes at most 8 (cached) lookups.
 */
import { useEffect, useState } from "react";
import {
  resolveSymbol,
  resolveSymbolsForWords,
  fetchSymbolAsDataUrl,
  type SymbolResult,
} from "@/lib/symbol-resolver";

// ─────────────────────────────────────────────────────────────────────────────
// TermSymbol — a single pictogram for one word. Renders an <img> once resolved,
// or null (nothing) when the word has no symbol / is still loading. Designed to
// sit beside or above a term label inside an existing card without disturbing
// the surrounding layout.
// ─────────────────────────────────────────────────────────────────────────────
export function TermSymbol({
  term,
  lang = "en",
  size = 40,
  className,
}: {
  term: string;
  lang?: string;
  size?: number;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const key = term.trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;
    if (!key) {
      setUrl(null);
      return;
    }
    resolveSymbol(key, { lang })
      .then((sym) => {
        if (!cancelled) setUrl(sym?.thumbUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [key, lang]);

  if (!url) return null;

  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      loading="lazy"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        // Ensure the pictogram prints (browsers strip background graphics by
        // default but honour print-color-adjust on real <img> elements).
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      } as React.CSSProperties}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SymbolSupportedWords — a wrap-around row of "symbol above word" chips. Handy
// for a vocabulary strip / communication-style band. Resolves all terms in one
// bounded-parallel batch. Terms with no pictogram render as a text-only chip so
// the row is never broken.
// ─────────────────────────────────────────────────────────────────────────────
export function SymbolSupportedWords({
  terms,
  lang = "en",
  size = 56,
  className,
  asDataUrl = false,
}: {
  terms: string[];
  lang?: string;
  size?: number;
  className?: string;
  /**
   * V5b — when true, each pictogram is rendered as an inlined data: URL
   * (fetched via the symbol-proxy /fetch endpoint) instead of a remote ARASAAC
   * CDN URL. This is required for the worksheet PDF export path, which uses
   * html2canvas: a remote (cross-origin) <img> can taint the canvas, whereas a
   * data: URL always renders. On-screen + native-print work either way, so the
   * presentation surface leaves this off (default) and keeps using remote URLs.
   * Symbols only appear once their data URL has resolved, so the captured PDF
   * never contains a half-loaded remote image.
   */
  asDataUrl?: boolean;
}) {
  const clean = Array.from(
    new Set(terms.map((t) => t.trim()).filter(Boolean)),
  );
  const termsKey = clean.map((t) => t.toLowerCase()).join("|");
  const [symbols, setSymbols] = useState<Record<string, SymbolResult>>({});
  const [dataUrls, setDataUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    if (clean.length === 0) {
      setSymbols({});
      return;
    }
    resolveSymbolsForWords(clean, { lang })
      .then((map) => {
        if (!cancelled) setSymbols(map);
      })
      .catch(() => {
        if (!cancelled) setSymbols({});
      });
    return () => {
      cancelled = true;
    };
    // termsKey captures the meaningful identity of `clean` (avoids array-ref churn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termsKey, lang]);

  // When asDataUrl is on, inline each resolved pictogram as a data: URL so the
  // worksheet's html2canvas PDF export can capture it. Runs after symbols
  // resolve; degrades gracefully (a term whose data URL fails just falls back
  // to its text-only chip).
  useEffect(() => {
    if (!asDataUrl) return;
    let cancelled = false;
    const entries = Object.entries(symbols);
    if (entries.length === 0) {
      setDataUrls({});
      return;
    }
    (async () => {
      const out: Record<string, string> = {};
      await Promise.all(
        entries.map(async ([term, sym]) => {
          const durl = await fetchSymbolAsDataUrl(sym.url);
          if (durl) out[term] = durl;
        }),
      );
      if (!cancelled) setDataUrls(out);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asDataUrl, symbols]);

  if (clean.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap gap-3 ${className || ""}`}
      aria-label="Symbol-supported words"
    >
      {clean.map((term) => {
        const sym = symbols[term];
        // In data-URL mode, only treat a symbol as available once its inlined
        // data URL is ready — so the PDF capture never sees a remote <img>.
        const imgSrc = sym
          ? asDataUrl
            ? dataUrls[term] ?? null
            : sym.thumbUrl
          : null;
        return (
          <div
            key={term}
            className="flex flex-col items-center text-center"
            style={{ width: size + 16 }}
          >
            <div
              className="flex items-center justify-center rounded-lg border bg-white"
              style={{ width: size, height: size }}
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={term}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                  style={{
                    printColorAdjust: "exact",
                    WebkitPrintColorAdjust: "exact",
                  } as React.CSSProperties}
                />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">
                  {term.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="mt-1 text-xs font-semibold capitalize leading-tight">
              {term}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// extractVocabTerms — pull the term strings out of a worksheet "vocabulary"
// section's plain-text content. Vocabulary content arrives as either a
// markdown table (| Term | Definition |) or a bullet list ("- term: meaning").
// Used by the worksheet renderer in V5b; lives here so the parsing rule has a
// single home shared with the presentation surface.
// ─────────────────────────────────────────────────────────────────────────────
const VOCAB_HEADER_WORDS = new Set([
  "term", "terms", "word", "words", "key word", "key term", "vocabulary",
  "definition", "definitions", "meaning", "meanings", "example", "examples",
]);

export function extractVocabTerms(content: string, max = 16): string[] {
  if (!content || typeof content !== "string") return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const t = raw.replace(/[*_`>#-]/g, "").trim();
    if (!t) return;
    if (VOCAB_HEADER_WORDS.has(t.toLowerCase())) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };

  for (const line of content.split("\n")) {
    const l = line.trim();
    if (!l) continue;
    // Markdown table row → first non-empty cell is the term.
    if (l.includes("|")) {
      if (/^[\s|:\-]+$/.test(l)) continue; // separator row ---|---
      const cells = l.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length > 0) push(cells[0]);
      continue;
    }
    // Bullet / numbered list: "- term: definition" or "* term — meaning".
    const bullet = l.replace(/^[-*•\d.)\s]+/, "");
    const m = bullet.match(/^(.+?)\s*[:\u2013\u2014-]\s+/);
    if (m) {
      push(m[1]);
    } else if (bullet && bullet.split(/\s+/).length <= 4) {
      // Short standalone line — treat the whole thing as a term.
      push(bullet);
    }
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}
