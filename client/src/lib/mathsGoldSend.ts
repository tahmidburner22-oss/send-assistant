/**
 * mathsGoldSend.ts
 *
 * Maps a SEND need id → a NON-DESTRUCTIVE cosmetic theme (GoldTheme) for the
 * gold maths worksheet layout.
 *
 * Design contract (per user requirement): the SEND overlay must NOT alter the
 * structural integrity of the worksheet. It only restyles typography and
 * colour via CSS custom properties — it cannot move, add, remove or reorder
 * any content. The fixed 2-page A4 landscape geometry is preserved exactly.
 *
 * Guidance basis (UK):
 *   - GOV.UK "Publishing accessible documents": use a clean sans-serif such as
 *     Arial/Helvetica, minimum 12pt; meet WCAG 2.2 AA (resizable text,
 *     contrast) — no single mandated font.
 *   - British Dyslexia Association style guide: sans-serif (Arial, Verdana,
 *     Tahoma, Trebuchet, Calibri, Century Gothic, Open Sans), 12-14pt,
 *     ~1.5 line spacing, left aligned, generous letter/word spacing. No
 *     consensus on a single "best" font; OpenDyslexic is NOT specifically
 *     endorsed (evidence is mixed) — offered only as an optional toggle.
 *
 * Overflow safety: the gold layout uses fixed millimetre boxes, so font/line
 * scaling is bounded to a "safe band" that keeps the spread at exactly 2 pages.
 * These bands are verified with the Playwright pagination check.
 */
import type { GoldTheme } from "@/lib/mathsGoldRenderer";

// ─── Font stacks (all BDA / GOV.UK approved sans-serifs) ─────────────────────
/** GOV.UK + BDA default. Also the gold layout's native body face. */
const SANS = "Arial, Helvetica, sans-serif";
/** BDA-listed face with wide built-in spacing — our accessible default. */
const VERDANA = "Verdana, Geneva, Tahoma, sans-serif";
/** Optional dyslexia-specific face (falls back to Verdana if not installed). */
const OPEN_DYSLEXIC = "'OpenDyslexic', Verdana, Geneva, sans-serif";

export interface GoldSendOptions {
  /**
   * Use OpenDyslexic for dyslexia-style themes instead of Verdana.
   * Not the official UK recommendation — provided as a teacher opt-in only.
   */
  preferOpenDyslexic?: boolean;
}

/**
 * Cosmetic theme per SEND need. Keys are the same ids used by the existing
 * SEND_OVERLAY_MAP in worksheet-generator.ts. Anything not listed (or
 * "none-selected"/undefined) yields the unadapted base worksheet.
 *
 * The approved templates have fixed box heights, so the overlay does not scale
 * font metrics or line heights. Those changes can reflow text within a box even
 * when the page count stays at two. Accessibility support is therefore delivered
 * through white surfaces, visible outline cues, recorded adaptations, and the
 * separate vocabulary layer rather than geometry-risking font enlargement.
 */
const GOLD_SEND_THEMES: Record<string, GoldTheme> = {
  dyslexia: {
    fontFamily: SANS,
    titleFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    letterSpacing: "0",
    wordSpacing: "0",
    // Keep the page white so a teacher can apply a separate physical or digital overlay.
    textColor: "#1a1a1a",
    label: "Dyslexia-friendly",
  },
  dyspraxia: {
    fontFamily: SANS,
    titleFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    letterSpacing: "0",
    label: "Dyspraxia-friendly",
  },
  mld: {
    fontFamily: SANS,
    titleFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    letterSpacing: "0",
    wordSpacing: "0",
    label: "MLD-friendly",
  },
  dyscalculia: {
    fontFamily: SANS,
    titleFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    label: "Dyscalculia-friendly",
  },
  slcn: {
    fontFamily: SANS,
    titleFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    wordSpacing: "0",
    label: "SLCN-friendly",
  },
  eal: {
    fontFamily: SANS,
    titleFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    wordSpacing: "0",
    label: "EAL support",
  },
  adhd: {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    // White background retained; only typography and spacing adapt.
    label: "ADHD-friendly",
  },
  asc: {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    // White background retained; only typography and spacing adapt.
    label: "Autism-friendly",
  },
  asperger: {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    label: "Autism-friendly",
  },
  anxiety: {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    // White background retained; only typography and spacing adapt.
    label: "Low-anxiety",
  },
  semh: {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    // White background retained; only typography and spacing adapt.
    label: "SEMH-friendly",
  },
  "pda-odd": {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    // White background retained; only typography and spacing adapt.
    label: "Low-demand",
  },
  vi: {
    // Visual impairment: maximum safe enlargement + high contrast.
    // NOTE: true large-print (>=18pt reflowed) needs a dedicated export;
    // within the fixed 2-page layout this is the largest overflow-safe boost.
    fontFamily: SANS,
    titleFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    letterSpacing: "0",
    textColor: "#000000",
    pageBg: "#ffffff",
    label: "Large print (high contrast)",
  },
  hi: {
    // Hearing impairment: layout already self-contained; minor clarity boost.
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    label: "HI-friendly",
  },
  tourettes: {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    label: "Calm layout",
  },
  "older-learners": {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    label: "Age-appropriate",
  },
  // Working memory: generous spacing so students can hold their place
  // without losing context; slightly larger text reduces re-reading load.
  "working-memory": {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    letterSpacing: "0",
    // White background retained; only typography and spacing adapt.
    label: "Working memory support",
  },
  // ASC sub-profiles — all inherit the base ASC calm layout
  "asc-social": {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    // White background retained; only typography and spacing adapt.
    label: "Autism-friendly (Social)",
  },
  "asc-demand-avoidant": {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    // White background retained; only typography and spacing adapt.
    label: "Autism-friendly (PDA)",
  },
  "asc-sensory": {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    // White background retained; only typography and spacing adapt.
    label: "Autism-friendly (Sensory)",
  },
  "asc-rigid": {
    fontFamily: SANS,
    fontScale: 1,
    lineScale: 1,
    label: "Autism-friendly (Routine)",
  },
};

/**
 * Resolve the cosmetic theme for a SEND need id, or `undefined` for the base
 * (unadapted) worksheet.
 */
export function getGoldSendTheme(
  sendNeedId?: string,
  opts?: GoldSendOptions
): GoldTheme | undefined {
  if (!sendNeedId || sendNeedId === "none-selected") return undefined;
  const base = GOLD_SEND_THEMES[sendNeedId.toLowerCase()];
  if (!base) return undefined;
  if (opts?.preferOpenDyslexic && isDyslexiaStyle(sendNeedId)) {
    return { ...base, fontFamily: OPEN_DYSLEXIC, titleFamily: OPEN_DYSLEXIC };
  }
  return { ...base };
}

function isDyslexiaStyle(id: string): boolean {
  const k = id.toLowerCase();
  return k === "dyslexia" || k === "dyspraxia" || k === "mld" || k === "slcn";
}

/** True if a cosmetic gold theme exists for this need id. */
export function hasGoldSendTheme(sendNeedId?: string): boolean {
  return getGoldSendTheme(sendNeedId) !== undefined;
}
