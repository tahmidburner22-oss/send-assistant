/**
 * aiTranslate.ts — FEAT-PC6 · Phase C (EAL parity)
 * ──────────────────────────────────────────────────────────────────────────
 * Thin client wrapper around the server-side AI translation endpoint.
 * Translates plain text into one of the supported UK EAL languages and
 * returns the translated string. Used by:
 *   - worksheetTranslator.ts (bilingual worksheet build)
 *   - ParentNewsletter (existing parent-letter translation flow)
 *
 * The function is intentionally small and side-effect free so it can be
 * called from any tool that needs translation. The /api/ai/translate
 * endpoint multiplexes the AI provider chain server-side, so callers do
 * not need to deal with provider keys.
 *
 * No paid translation APIs — uses the existing free-tier AI provider chain.
 */

// ─── Supported UK EAL languages (top 9 per DfE 2024 census) ────────────────

export type EalLanguageCode =
  | "en"  // English (passthrough — no API call)
  | "pl"  // Polish
  | "ur"  // Urdu (RTL)
  | "ro"  // Romanian
  | "ar"  // Arabic (RTL)
  | "bn"  // Bengali
  | "gu"  // Gujarati
  | "pa"  // Punjabi (Gurmukhi)
  | "zh"  // Mandarin Chinese (Simplified)
  | "es"; // Spanish

export interface EalLanguage {
  code: EalLanguageCode;
  /** English name shown in language picker. */
  name: string;
  /** Native name shown in language picker (right-aligned). */
  nativeName: string;
  /** True if the language script is right-to-left. Drives `dir='rtl'`. */
  rtl: boolean;
}

export const EAL_LANGUAGES: readonly EalLanguage[] = [
  { code: "en", name: "English",  nativeName: "English",       rtl: false },
  { code: "pl", name: "Polish",   nativeName: "Polski",        rtl: false },
  { code: "ur", name: "Urdu",     nativeName: "اردو",          rtl: true  },
  { code: "ro", name: "Romanian", nativeName: "Română",        rtl: false },
  { code: "ar", name: "Arabic",   nativeName: "العربية",       rtl: true  },
  { code: "bn", name: "Bengali",  nativeName: "বাংলা",         rtl: false },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી",       rtl: false },
  { code: "pa", name: "Punjabi",  nativeName: "ਪੰਜਾਬੀ",        rtl: false },
  { code: "zh", name: "Mandarin", nativeName: "中文 (简体)",    rtl: false },
  { code: "es", name: "Spanish",  nativeName: "Español",       rtl: false },
] as const;

export function getEalLanguage(code: string | null | undefined): EalLanguage | null {
  if (!code) return null;
  return EAL_LANGUAGES.find((l) => l.code === code) || null;
}

export function isRtl(code: string | null | undefined): boolean {
  return getEalLanguage(code)?.rtl === true;
}

// ─── aiTranslate — single-string translation ───────────────────────────────

export interface AiTranslateOptions {
  /** Source language. Defaults to "en". Used by the AI as a hint. */
  sourceLang?: EalLanguageCode | string;
  /** Optional context blurb that helps the AI pick correct register. */
  context?: string;
  /** Override timeout (ms). Default 30000. */
  timeoutMs?: number;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

export interface AiTranslateResult {
  /** Translated text, possibly equal to input if target === source. */
  text: string;
  /** Echoed target language code. */
  lang: EalLanguageCode | string;
  /** Provider that produced the translation (for logging). */
  provider?: string;
}

/**
 * Translate a single string into the target language.
 *
 * Returns the original text untouched if `targetLang === "en"` (or empty),
 * since the source language for worksheets is always English.
 *
 * On network/AI failure the function rejects with the underlying error so
 * callers can fall back to English-only rendering. It does NOT silently
 * swallow errors.
 */
export async function aiTranslate(
  input: string,
  targetLang: EalLanguageCode | string,
  opts: AiTranslateOptions = {},
): Promise<AiTranslateResult> {
  const trimmed = (input || "").trim();
  // Fast paths
  if (!trimmed) return { text: "", lang: targetLang };
  if (!targetLang || targetLang === "en") return { text: input, lang: "en" };

  const lang = getEalLanguage(targetLang);
  const langName = lang ? lang.name : String(targetLang);

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const timer =
    controller && typeof window !== "undefined"
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;

  // Forward the caller's abort signal to our internal controller.
  if (opts.signal && controller) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch("/api/ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller?.signal,
      body: JSON.stringify({
        text: input,
        targetLang,
        targetLangName: langName,
        sourceLang: opts.sourceLang || "en",
        context: opts.context,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Translation failed (${res.status}): ${body.slice(0, 200) || res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      text?: string;
      translation?: string;
      lang?: string;
      provider?: string;
    };

    const out = data.text || data.translation || "";
    if (!out.trim()) {
      throw new Error("Translation returned empty result.");
    }

    return { text: out, lang: data.lang || targetLang, provider: data.provider };
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

/**
 * Translate many short strings in a single request. Strings are joined with
 * a sentinel separator before sending and split back on the response, which
 * keeps the AI request count to one per worksheet rather than one per
 * section. Falls back to the single-string path on any parse failure.
 */
export async function aiTranslateBatch(
  inputs: string[],
  targetLang: EalLanguageCode | string,
  opts: AiTranslateOptions = {},
): Promise<string[]> {
  if (!inputs || inputs.length === 0) return [];
  if (!targetLang || targetLang === "en") return [...inputs];

  // Sentinel that is extremely unlikely to occur in worksheet content.
  const SEP = "\n<<<§ADAPTLY_TRANSLATE_BREAK§>>>\n";
  const joined = inputs.map((s) => (s ?? "").toString()).join(SEP);

  const single = await aiTranslate(joined, targetLang, {
    ...opts,
    context:
      (opts.context ? opts.context + " " : "") +
      "Each block separated by '<<<§ADAPTLY_TRANSLATE_BREAK§>>>' must be translated independently and the separator preserved verbatim in the output.",
  });

  const parts = single.text.split(/<<<§ADAPTLY_TRANSLATE_BREAK§>>>/);
  if (parts.length !== inputs.length) {
    // The AI dropped or merged separators. Fall back to per-string calls so
    // we still return a correctly-shaped array.
    const out: string[] = [];
    for (const s of inputs) {
      try {
        const r = await aiTranslate(s, targetLang, opts);
        out.push(r.text);
      } catch {
        out.push(s); // last-ditch passthrough so the column is non-empty
      }
    }
    return out;
  }
  return parts.map((p) => p.replace(/^\n+|\n+$/g, ""));
}
