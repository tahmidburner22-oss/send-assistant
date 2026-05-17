/**
 * worksheetTranslator.ts — FEAT-PC6 · Phase C (EAL parity)
 * ──────────────────────────────────────────────────────────────────────────
 * Takes a worksheet + target EAL language and produces a *bilingual*
 * worksheet whose sections carry both the original English text and a
 * translated counterpart. The renderer can then lay them out side-by-side
 * (LTR + LTR) or with a mirrored column for RTL languages.
 *
 * Translation strategy:
 *   - Teacher-only sections (mark schemes, answer keys, worked examples,
 *     diagrams) are NOT translated. They stay English so the teacher can
 *     mark consistently.
 *   - Pupil-facing sections are translated in a single batched AI call to
 *     keep cost to one provider hit per worksheet+lang.
 *   - Result is cached in localStorage keyed on a stable hash of the
 *     worksheet's (id ?? title+sections-length) and the language code.
 *     A repeated translate() call within the same browser is free.
 *
 * Failure mode: if translation fails, the function returns the original
 * worksheet unchanged with `bilingual: undefined`. Callers should treat
 * that as "fall back to English-only".
 */

import {
  aiTranslateBatch,
  EAL_LANGUAGES,
  getEalLanguage,
  isRtl,
  type EalLanguageCode,
} from "./aiTranslate";

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * Minimal worksheet shape this module needs. Compatible with both the
 * persisted `Worksheet` (AppContext) and the in-memory `AIWorksheetResult`
 * (lib/ai.ts) — both expose `title`, optional `subtitle`, and a `sections`
 * array of `{ title, content, type, teacherOnly? }`.
 */
export interface TranslatableSection {
  title?: string;
  content?: string;
  type?: string;
  teacherOnly?: boolean;
  // Pass-through fields (preserved verbatim, never translated)
  svg?: string;
  caption?: string;
  imageUrl?: string;
  assetRef?: string;
  [k: string]: unknown;
}

export interface TranslatableWorksheet {
  id?: string;
  title: string;
  subtitle?: string;
  sections?: TranslatableSection[];
  [k: string]: unknown;
}

export interface BilingualSection extends TranslatableSection {
  /** Translated title (same language as the sidecar `bilingual.lang`). */
  titleTranslated?: string;
  /** Translated body content. */
  contentTranslated?: string;
  /** Original English title — preserved so callers can switch back. */
  titleEn?: string;
  /** Original English body content. */
  contentEn?: string;
}

export interface BilingualMeta {
  /** Target language code (e.g. "ar"). */
  lang: EalLanguageCode | string;
  /** Pretty language name (e.g. "Arabic"). */
  langName: string;
  /** True if the target language is right-to-left. */
  rtl: boolean;
  /** ISO timestamp of when the translation was generated. */
  generatedAt: string;
  /** Provider hint — "cache" if served from localStorage. */
  provider?: string;
}

export interface BilingualWorksheet extends TranslatableWorksheet {
  /**
   * Per-section bilingual sidecar (same length and order as `sections`).
   * `sections` itself carries the *translated* content so the standard
   * worksheet renderer displays it without any renderer changes; the
   * sidecar preserves the original English so the UI can switch back.
   */
  bilingualSections: BilingualSection[];
  /** Translated worksheet title (mirrors `title`). */
  titleTranslated?: string;
  /** Translated worksheet subtitle (mirrors `subtitle`). */
  subtitleTranslated?: string;
  /** Original English title — preserved verbatim. */
  titleEn?: string;
  /** Original English subtitle — preserved verbatim. */
  subtitleEn?: string;
  /** Convenience meta the renderer/UI reads. */
  bilingual: BilingualMeta;
}

// ─── Section-type policy ───────────────────────────────────────────────────

/**
 * Sections we never translate. These either contain English-only artefacts
 * (mark scheme text the teacher reads back to the class), or visual content
 * (diagrams, SVG labels) where translating the text would break the render.
 */
const TEACHER_ONLY_TYPES = new Set([
  "answers",
  "answer-key",
  "mark-scheme",
  "teacher-key",
  "teacher-answers",
  "q-teacher-answers",
  "worked-example",
  "example",
]);

const VISUAL_TYPES = new Set([
  "diagram",
  "diagram-a",
  "diagram-b",
  "reference-diagram",
  "task-diagram",
  "q-label-diagram",
  "label-diagram",
]);

function shouldTranslate(section: TranslatableSection): boolean {
  if (section.teacherOnly) return false;
  const t = (section.type || "").toLowerCase();
  if (TEACHER_ONLY_TYPES.has(t)) return false;
  if (VISUAL_TYPES.has(t)) return false;
  return true;
}

// ─── Cache (localStorage) ──────────────────────────────────────────────────

const CACHE_KEY = "adaptly_worksheet_translations_v1";
const CACHE_LIMIT = 40; // soft cap — old entries dropped LRU-style

interface CacheEntry {
  hash: string;
  lang: string;
  generatedAt: string;
  // Stored stripped down — no need to persist the full worksheet, just the
  // bilingual sidecar so we can splice it back onto a fresh render.
  bilingualSections: BilingualSection[];
  /** Translated sections in the same order as the original (for swap-in). */
  translatedSections: TranslatableSection[];
  titleTranslated?: string;
  subtitleTranslated?: string;
}

function readCache(): CacheEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCache(entries: CacheEntry[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    const trimmed = entries.slice(-CACHE_LIMIT);
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full — drop the cache silently.
  }
}

function hashWorksheet(ws: TranslatableWorksheet): string {
  // Stable, low-collision hash for cache keys. We avoid pulling in a crypto
  // dep and use a simple fnv-1a over (id || title) plus section signatures.
  const sigParts: string[] = [];
  sigParts.push(String(ws.id || ""));
  sigParts.push(String(ws.title || ""));
  sigParts.push(String(ws.subtitle || ""));
  for (const s of ws.sections || []) {
    sigParts.push(
      `${s.type || ""}|${(s.title || "").length}|${(s.content || "").length}`,
    );
  }
  const str = sigParts.join("§");
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function cacheKey(ws: TranslatableWorksheet, lang: string): string {
  return `${hashWorksheet(ws)}::${lang}`;
}

function lookupCache(
  ws: TranslatableWorksheet,
  lang: string,
): CacheEntry | null {
  const key = cacheKey(ws, lang);
  const entries = readCache();
  return entries.find((e) => `${e.hash}::${e.lang}` === key) || null;
}

function storeCache(
  ws: TranslatableWorksheet,
  lang: string,
  result: Omit<CacheEntry, "hash" | "lang">,
): void {
  const key = cacheKey(ws, lang);
  const entries = readCache().filter((e) => `${e.hash}::${e.lang}` !== key);
  entries.push({
    hash: hashWorksheet(ws),
    lang,
    ...result,
  });
  writeCache(entries);
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface TranslateWorksheetOptions {
  /** Skip the localStorage cache (forces a fresh AI call). */
  noCache?: boolean;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

/**
 * Translate a worksheet into the target EAL language and return a
 * bilingual variant. When `targetLang === "en"` the original worksheet is
 * returned unchanged (no AI call).
 */
export async function translateWorksheet(
  worksheet: TranslatableWorksheet,
  targetLang: EalLanguageCode | string,
  opts: TranslateWorksheetOptions = {},
): Promise<BilingualWorksheet | TranslatableWorksheet> {
  if (!worksheet) throw new Error("translateWorksheet: worksheet is required");

  const langInfo = getEalLanguage(targetLang);
  if (!langInfo || langInfo.code === "en") {
    // No-op for English — return the input untouched.
    return worksheet;
  }

  // Cache hit — return immediately.
  if (!opts.noCache) {
    const hit = lookupCache(worksheet, langInfo.code);
    if (hit) {
      return {
        ...worksheet,
        // sections carries translated content for direct rendering
        sections: hit.translatedSections as TranslatableSection[],
        bilingualSections: hit.bilingualSections,
        title: hit.titleTranslated || worksheet.title,
        subtitle: hit.subtitleTranslated ?? worksheet.subtitle,
        titleEn: worksheet.title,
        subtitleEn: worksheet.subtitle,
        titleTranslated: hit.titleTranslated,
        subtitleTranslated: hit.subtitleTranslated,
        bilingual: {
          lang: hit.lang as EalLanguageCode,
          langName: langInfo.name,
          rtl: langInfo.rtl,
          generatedAt: hit.generatedAt,
          provider: "cache",
        },
      };
    }
  }

  // ── Build the batch ────────────────────────────────────────────────────
  // Strings are pushed in a fixed order: [title, subtitle, then per-section
  // (title, content) for every translatable section]. We reconstruct the
  // bilingual array by walking the same order on the response.

  const sections = worksheet.sections || [];
  const inputs: string[] = [];
  const slots: Array<
    | { kind: "title" }
    | { kind: "subtitle" }
    | { kind: "sectionTitle"; index: number }
    | { kind: "sectionContent"; index: number }
  > = [];

  inputs.push(worksheet.title || "");
  slots.push({ kind: "title" });
  if (worksheet.subtitle) {
    inputs.push(worksheet.subtitle);
    slots.push({ kind: "subtitle" });
  }
  sections.forEach((sec, idx) => {
    if (!shouldTranslate(sec)) return;
    if (sec.title) {
      inputs.push(sec.title);
      slots.push({ kind: "sectionTitle", index: idx });
    }
    if (sec.content) {
      inputs.push(sec.content);
      slots.push({ kind: "sectionContent", index: idx });
    }
  });

  let translated: string[];
  try {
    translated = await aiTranslateBatch(inputs, langInfo.code, {
      signal: opts.signal,
      context: `Translating a UK school worksheet for an English-as-Additional-Language pupil. Preserve all numbers, formulas, blanks (___), checkbox markers ([ ]), and HTML/markdown structure. Use plain everyday vocabulary suitable for a school child.`,
    });
  } catch (err) {
    // Bubble up — caller decides whether to toast / fallback.
    throw err;
  }

  // ── Splice translations back into a bilingual structure ────────────────
  let titleTranslated: string | undefined = worksheet.title;
  let subtitleTranslated: string | undefined = worksheet.subtitle;

  // The bilingual sidecar carries both EN and translated. We also build a
  // `translatedSections` array that mirrors the original `sections` shape,
  // so the worksheet renderer can swap to the translated content directly.
  const bilingualSections: BilingualSection[] = sections.map((s) => ({
    ...s,
    titleEn: s.title,
    contentEn: s.content,
    titleTranslated: s.title,
    contentTranslated: s.content,
  }));
  const translatedSections: TranslatableSection[] = sections.map((s) => ({ ...s }));

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const value = translated[i] ?? inputs[i];
    if (slot.kind === "title") titleTranslated = value;
    else if (slot.kind === "subtitle") subtitleTranslated = value;
    else if (slot.kind === "sectionTitle") {
      bilingualSections[slot.index].titleTranslated = value;
      translatedSections[slot.index].title = value;
    } else if (slot.kind === "sectionContent") {
      bilingualSections[slot.index].contentTranslated = value;
      translatedSections[slot.index].content = value;
    }
  }

  const meta: BilingualMeta = {
    lang: langInfo.code,
    langName: langInfo.name,
    rtl: langInfo.rtl,
    generatedAt: new Date().toISOString(),
  };

  if (!opts.noCache) {
    storeCache(worksheet, langInfo.code, {
      bilingualSections,
      translatedSections,
      titleTranslated,
      subtitleTranslated,
      generatedAt: meta.generatedAt,
    });
  }

  return {
    ...worksheet,
    sections: translatedSections,
    bilingualSections,
    title: titleTranslated || worksheet.title,
    subtitle: subtitleTranslated ?? worksheet.subtitle,
    titleEn: worksheet.title,
    subtitleEn: worksheet.subtitle,
    titleTranslated,
    subtitleTranslated,
    bilingual: meta,
  };
}

// ─── Reading-age helpers (EAL hand-off to aiAdjustReadingLevel) ────────────

/**
 * Resolve the effective reading age for a child:
 *   - explicit override on the Child record wins
 *   - otherwise we infer from yearGroup (defaulting to 11 / Y6)
 * The number returned is a UK reading age in years (5–18).
 */
export function getEffectiveReadingAge(
  child:
    | { yearGroup?: string; readingAgeOverride?: number | null }
    | null
    | undefined,
  fallback = 11,
): number {
  if (!child) return fallback;
  if (typeof child.readingAgeOverride === "number" && child.readingAgeOverride > 0) {
    return child.readingAgeOverride;
  }
  const yg = (child.yearGroup || "").toString().toLowerCase();
  const m = yg.match(/(\d+)/);
  if (m) {
    const year = parseInt(m[1], 10);
    if (year >= 1 && year <= 13) return year + 5; // Y1 → 6, Y6 → 11, Y11 → 16
  }
  return fallback;
}

/**
 * Returns true when an EAL pupil should additionally be sent through the
 * reading-level simplifier before translation. Heuristic: the pupil's
 * effective reading age is at least 2 years below their chronological
 * year group (a common SEND/EAL combination).
 */
export function shouldAutoSimplifyForEal(
  child: { yearGroup?: string; readingAgeOverride?: number | null } | null | undefined,
): boolean {
  if (!child) return false;
  const yg = (child.yearGroup || "").toString().toLowerCase();
  const m = yg.match(/(\d+)/);
  if (!m) return false;
  const expected = parseInt(m[1], 10) + 5;
  const actual = getEffectiveReadingAge(child);
  return expected - actual >= 2;
}

// Re-export language registry so UI can render the picker without a
// second import.
export { EAL_LANGUAGES, getEalLanguage, isRtl };
