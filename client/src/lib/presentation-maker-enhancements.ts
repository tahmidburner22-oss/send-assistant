/**
 * presentation-maker-enhancements.ts
 *
 * Five pure-function improvements for the Presentation Maker tool:
 *
 *  1. Speaker notes view — produce a printable A4 "presenter cue card" for
 *     every slide combining speakerNotes + a one-line cue + timing chip.
 *  2. Slide-level regenerate prompt — build a tightly-scoped prompt that
 *     re-renders ONE slide while preserving deck context (theme, prior
 *     slides as cue, target slide spec). Returned as a plain
 *     `{system,user}` payload so the existing callAI plumbing renders it.
 *  3. Image library reuse — given a slide's `image_prompt`, suggest 4–6
 *     stock-image queries across Pexels and Unsplash with direct URLs the
 *     teacher can drop into a slide. No API keys needed; we just produce
 *     pre-formatted search URLs (compliant with each site's terms).
 *  4. Pupil-pace toggle — apply a "pace profile" (slow / standard / brisk)
 *     to a deck by adjusting timingMinutes on each slide and computing the
 *     new total runtime. Pure transformation; deck JSON in, deck JSON out.
 *  5. Google Slides export — convert a deck to a tab-separated outline
 *     (`Title <TAB> Notes`) plus a launch URL that opens Slides in import
 *     mode, so the teacher can paste in seconds.
 *
 * Decoupled from the React tree — this file contains only data transforms
 * and string builders. Safe to unit-test in isolation.
 */

// ─── Shared types (a *minimal* subset of PresentationMaker's SlideContent) ──
//
// The Presentation Maker page defines a much richer SlideContent type (z.infer
// of a 60+ field schema). Re-importing it would bring the entire react file
// into this lib's dependency graph, so we instead declare the minimum we
// touch. Any extra fields on the actual slides pass through unchanged because
// every consumer here uses Partial / generic Record types.

export interface SlideLite {
  type: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  question?: string;
  speakerNotes?: string;
  timingMinutes?: number;
  image_prompt?: string;
  /** Pass-through bucket so deck mutations preserve unrecognised fields. */
  [key: string]: unknown;
}

export interface DeckLite {
  title: string;
  subject?: string;
  yearGroup?: string;
  topic?: string;
  theme?: string;
  slides: SlideLite[];
  totalSlides?: number;
}

// ─── Shared helpers ────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ─── 1. Speaker notes view ─────────────────────────────────────────────────

export interface PresenterCard {
  index: number;          // 1-based slide number
  total: number;
  title: string;
  type: string;
  cueLine: string;        // single sentence the presenter says when this slide lands
  notes: string;          // expanded speakerNotes (or auto-derived)
  timingMinutes: number | null;
}

/**
 * Build presenter cue cards for every slide. If speakerNotes are missing,
 * derive a useful cue from bullets / body / question so the printout still
 * has something to read off for every slide.
 */
export function buildPresenterCards(deck: DeckLite): PresenterCard[] {
  const total = deck.slides.length;
  return deck.slides.map((s, i) => {
    const cueLine = deriveCue(s);
    const notes = (s.speakerNotes && s.speakerNotes.trim().length > 0)
      ? s.speakerNotes.trim()
      : deriveNotesFallback(s);
    return {
      index: i + 1,
      total,
      title: s.title || `Slide ${i + 1}`,
      type: s.type || "content",
      cueLine,
      notes,
      timingMinutes: typeof s.timingMinutes === "number" ? s.timingMinutes : null,
    };
  });
}

function deriveCue(s: SlideLite): string {
  if (s.question) return s.question;
  if (s.subtitle) return s.subtitle;
  if (s.bullets && s.bullets.length > 0) return s.bullets[0];
  if (s.body) return s.body.split(/[.!?]/)[0].trim();
  return s.title || "Continue from previous slide";
}

function deriveNotesFallback(s: SlideLite): string {
  const parts: string[] = [];
  if (s.body) parts.push(s.body);
  if (s.bullets && s.bullets.length > 0) parts.push("Talking points: " + s.bullets.join("; "));
  if (s.question) parts.push(`Pose: "${s.question}"`);
  return parts.join("\n\n") || "Read the slide aloud, then ask one pupil to summarise back.";
}

export function presenterCardsHtml(deck: DeckLite, cards: PresenterCard[]): string {
  const cardsHtml = cards.map((c) => `<div style="page-break-inside:avoid;border:1.5px solid #e5e7eb;border-radius:3mm;padding:5mm;margin-bottom:5mm;background:#fff;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #f1f5f9;padding-bottom:2mm;margin-bottom:3mm;">
      <h2 style="font-size:13pt;color:#1d4ed8;margin:0;">Slide ${c.index}/${c.total} — ${escapeHtml(c.title)}</h2>
      <span style="font-size:10pt;color:#64748b;">${escapeHtml(c.type)}${c.timingMinutes ? ` · ⏱ ${c.timingMinutes} min` : ""}</span>
    </div>
    <p style="font-size:11pt;font-weight:700;color:#0f766e;margin:0 0 3mm;">"${escapeHtml(c.cueLine)}"</p>
    <p style="font-size:10pt;color:#1f2937;margin:0;line-height:1.55;white-space:pre-wrap;">${escapeHtml(c.notes)}</p>
  </div>`).join("");
  return `<div style="font-family:Arial,sans-serif;padding:8mm;max-width:210mm;">
    <h1 style="font-size:14pt;color:#1e3a8a;margin:0 0 4mm;">${escapeHtml(deck.title)} — presenter cue cards</h1>
    <p style="font-size:9.5pt;color:#64748b;margin:0 0 5mm;">${cards.length} slide(s) · print A4 portrait, single-sided.</p>
    ${cardsHtml}
  </div>`;
}

// ─── 2. Slide-level regenerate prompt ──────────────────────────────────────

export interface SlideRegenPromptInput {
  deck: DeckLite;
  slideIndex: number;             // 0-based
  instruction: string;            // e.g. "Make this more visual and add a worked example"
  preserveType?: boolean;         // default: true
}

export interface SlideRegenPrompt {
  system: string;
  user: string;
  maxTokens: number;
}

/**
 * Build a tightly-scoped prompt that asks the AI to regenerate ONE slide
 * while preserving the rest of the deck. The output is JSON for a single
 * slide so the page can splice it back in without re-rendering everything.
 */
export function buildSlideRegenPrompt(input: SlideRegenPromptInput): SlideRegenPrompt {
  const { deck, slideIndex, instruction, preserveType = true } = input;
  const slide = deck.slides[slideIndex];
  if (!slide) throw new Error(`No slide at index ${slideIndex}`);
  const before = deck.slides.slice(Math.max(0, slideIndex - 2), slideIndex)
    .map((s, i) => `${slideIndex - (deck.slides.slice(Math.max(0, slideIndex - 2), slideIndex).length - i)}. [${s.type}] ${s.title}`)
    .join("\n");
  const after = deck.slides.slice(slideIndex + 1, slideIndex + 3)
    .map((s, i) => `${slideIndex + 2 + i}. [${s.type}] ${s.title}`)
    .join("\n");

  const system = `You are an outstanding UK teacher. You regenerate ONE lesson slide given the surrounding deck context. You return STRICT JSON for that single slide — no markdown fences, no prose. Preserve the slide's purpose so it still fits the deck flow.`;
  const user = `Deck context:
- Title: ${deck.title}
- Subject: ${deck.subject || ""}
- Year group: ${deck.yearGroup || ""}
- Topic: ${deck.topic || ""}

Slides immediately before this one:
${before || "(this is the first slide)"}

Slides immediately after:
${after || "(this is the last slide)"}

Current slide (index ${slideIndex}, type "${slide.type}"):
${JSON.stringify(slide, null, 2)}

Teacher instruction:
${instruction}

Return JSON for ONE slide with fields {type, title, ...}. ${preserveType ? `IMPORTANT: keep the type field equal to "${slide.type}".` : "You may change the slide type if it serves the instruction."}`;

  return { system, user, maxTokens: 1500 };
}

// ─── 3. Image library reuse ────────────────────────────────────────────────

export interface ImageSuggestion {
  source: "pexels" | "unsplash" | "openverse" | "wikimedia";
  query: string;
  url: string;             // landing page that runs the search (no API key needed)
  reason: string;          // why this query / this source
}

/**
 * Given a slide's image_prompt (or any free-text description), produce
 * 4–6 stock-image search suggestions distributed across permissively-
 * licensed sources. We do not fetch images directly — the URLs run the
 * search on the source site, so credit & licence checks happen there.
 */
export function suggestImages(prompt: string, max = 6): ImageSuggestion[] {
  const cleaned = (prompt || "").trim();
  if (!cleaned) return [];
  // Build query variants — refine, narrow, broaden, classroom-specific
  const base = cleaned.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const tokens = base.split(/\s+/);
  const refined = tokens.slice(0, 3).join(" ");
  const broader = tokens[0] || base;
  const narrower = tokens.slice(0, 5).join(" ");

  const variants: { query: string; reason: string }[] = [
    { query: cleaned,                    reason: "Exact prompt — primary match" },
    { query: refined,                    reason: "Top 3 keywords — broader hits" },
    { query: `${broader} diagram`,       reason: "Diagram angle — labels-friendly" },
    { query: `${narrower} classroom`,    reason: "Classroom context" },
    { query: `${broader} children`,      reason: "Pupil-friendly framing" },
    { query: `${broader} infographic`,   reason: "Data-visual angle" },
  ];

  const sources: Array<{ source: ImageSuggestion["source"]; build: (q: string) => string }> = [
    { source: "pexels",    build: (q) => `https://www.pexels.com/search/${encodeURIComponent(q)}/` },
    { source: "unsplash",  build: (q) => `https://unsplash.com/s/photos/${encodeURIComponent(q)}` },
    { source: "openverse", build: (q) => `https://openverse.org/search/?q=${encodeURIComponent(q)}` },
    { source: "wikimedia", build: (q) => `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(q)}&go=Go` },
  ];

  const out: ImageSuggestion[] = [];
  let v = 0, s = 0;
  while (out.length < max && v < variants.length) {
    const variant = variants[v];
    const source = sources[s % sources.length];
    out.push({
      source: source.source,
      query: variant.query,
      url: source.build(variant.query),
      reason: variant.reason,
    });
    v += 1;
    s += 1;
  }
  return out;
}

export const IMAGE_SOURCE_LABEL: Record<ImageSuggestion["source"], string> = {
  pexels: "Pexels",
  unsplash: "Unsplash",
  openverse: "Openverse",
  wikimedia: "Wikimedia",
};

export const IMAGE_SOURCE_LICENSE: Record<ImageSuggestion["source"], string> = {
  pexels: "Free to use; attribution appreciated",
  unsplash: "Unsplash licence — free, no attribution required (but kind to credit)",
  openverse: "CC-licensed; check per-image licence",
  wikimedia: "Mostly CC / public domain — check per-file licence",
};

// ─── 4. Pupil-pace toggle ──────────────────────────────────────────────────

export type PaceProfile = "slow" | "standard" | "brisk";

export interface PaceResult {
  profile: PaceProfile;
  multiplier: number;
  totalMinutes: number;
  beforeTotal: number;
  perSlide: { index: number; before: number | null; after: number }[];
}

const PACE_DEFAULTS: Record<string, number> = {
  // Type → default minutes when timingMinutes is missing
  title: 1,
  "learning-objectives": 2,
  hook: 5,
  "retrieval-warm-up": 5,
  content: 5,
  "key-terms": 4,
  "vocab-reference": 4,
  "worked-example": 7,
  "model-answer": 6,
  "diagram-label": 4,
  activity: 8,
  discussion: 6,
  "think-pair-share": 5,
  "mini-quiz": 5,
  "check-understanding": 4,
  "exam-practice": 10,
  "exam-technique": 5,
  summary: 3,
  plenary: 5,
  "exit-ticket": 4,
  extension: 5,
  "brain-break": 2,
  checkin: 2,
  "take-a-break": 3,
};

/**
 * Apply a pace profile to a deck. Returns a *new* deck with adjusted
 * `timingMinutes` and a side-channel summary of before/after totals so the
 * UI can show the runtime change.
 */
export function applyPace(deck: DeckLite, profile: PaceProfile): { deck: DeckLite; result: PaceResult } {
  const multiplier = profile === "slow" ? 1.4 : profile === "brisk" ? 0.75 : 1.0;
  const perSlide: PaceResult["perSlide"] = [];
  let beforeTotal = 0;
  let totalMinutes = 0;
  const newSlides: SlideLite[] = deck.slides.map((s, i) => {
    const before = typeof s.timingMinutes === "number" ? s.timingMinutes : null;
    const baseline = before ?? (PACE_DEFAULTS[s.type] ?? 4);
    const after = clamp(Math.round(baseline * multiplier), 1, 30);
    perSlide.push({ index: i + 1, before, after });
    if (before !== null) beforeTotal += before;
    else beforeTotal += baseline;
    totalMinutes += after;
    return { ...s, timingMinutes: after };
  });
  const newDeck: DeckLite = { ...deck, slides: newSlides };
  return { deck: newDeck, result: { profile, multiplier, totalMinutes, beforeTotal, perSlide } };
}

export const PACE_LABEL: Record<PaceProfile, string> = {
  slow: "Slow (additional needs / mixed prior knowledge) — ×1.4",
  standard: "Standard — ×1.0",
  brisk: "Brisk (revision / high-prior knowledge) — ×0.75",
};

// ─── 5. Google Slides export ───────────────────────────────────────────────

export interface SlidesExportPayload {
  /**
   * Tab-separated outline ready to paste into a blank Google Slides deck.
   * Each line: `Title<TAB>Body<TAB>Notes`. Slides interprets newlines
   * within cells; we replace literal newlines with `\\n` and unescape on
   * the consumer side via the import URL.
   */
  outline: string;
  /** A clipboard-friendly indented outline (alternative for manual paste). */
  pasteText: string;
  /** Direct launch URL for Google Slides in "create" mode. */
  launchUrl: string;
  /** Total slide count (for the UI). */
  slideCount: number;
}

/**
 * Build a Google Slides import payload. Google Slides does not yet expose a
 * universal "create deck from JSON" URL, so we provide both:
 *   - a blank-deck launch URL, and
 *   - a tab-separated outline the teacher can paste into the Outline view.
 * Combined, this is "10 seconds to a deck in Slides" — close to a true export.
 */
export function buildSlidesExport(deck: DeckLite): SlidesExportPayload {
  const lines: string[] = [];
  const pasteLines: string[] = [];
  for (const s of deck.slides) {
    const title = (s.title || "").replace(/[\t\n\r]+/g, " ").trim();
    const bodyParts: string[] = [];
    if (s.subtitle) bodyParts.push(s.subtitle);
    if (s.body) bodyParts.push(s.body);
    if (s.bullets && s.bullets.length > 0) bodyParts.push(s.bullets.map((b) => `• ${b}`).join("\\n"));
    if (s.question) bodyParts.push(`Q: ${s.question}`);
    const body = bodyParts.join("\\n").replace(/[\t]+/g, " ").trim();
    const notes = (s.speakerNotes || "").replace(/[\t\n\r]+/g, " ").trim();
    lines.push(`${title}\t${body}\t${notes}`);

    pasteLines.push(`# ${title}`);
    if (s.subtitle) pasteLines.push(`  _${s.subtitle}_`);
    if (s.body) pasteLines.push(`  ${s.body}`);
    if (s.bullets && s.bullets.length > 0) {
      for (const b of s.bullets) pasteLines.push(`  - ${b}`);
    }
    if (s.question) pasteLines.push(`  Q: ${s.question}`);
    if (s.speakerNotes) pasteLines.push(`  Notes: ${s.speakerNotes}`);
    pasteLines.push("");
  }
  const outline = lines.join("\n");
  const pasteText = pasteLines.join("\n");
  const launchUrl = "https://slides.new/";
  return {
    outline,
    pasteText,
    launchUrl,
    slideCount: deck.slides.length,
  };
}

/**
 * Two-step instructions string, plain text — ready to render in the panel
 * so the teacher knows exactly what to do.
 */
export function slidesImportInstructions(): string {
  return [
    "1. Click 'Open Google Slides' below to start a new deck (slides.new).",
    "2. In the new deck, choose View → Outline, then paste the copied outline.",
    "3. Each '#' becomes a slide title; bullets become slide bullets.",
    "4. Switch the deck theme from the side panel — your text stays put.",
  ].join("\n");
}
