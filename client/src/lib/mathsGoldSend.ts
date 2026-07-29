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
 * Scales are bounded: fontScale <= 1.12, lineScale <= 1.18 to guarantee the
 * fixed 2-page geometry never overflows.
 */
const GOLD_SEND_THEMES: Record<string, GoldTheme> = {
  dyslexia: {
    fontFamily: VERDANA,
    titleFamily: VERDANA,
    fontScale: 1.04,
    lineScale: 1.14,
    letterSpacing: "0.03em",
    wordSpacing: "0.12em",
    pageBg: "#FAF3E0", // cream — reduces visual stress / glare
    textColor: "#1a1a1a",
    label: "Dyslexia-friendly",
  },
  dyspraxia: {
    fontFamily: VERDANA,
    titleFamily: VERDANA,
    fontScale: 1.04,
    lineScale: 1.12,
    letterSpacing: "0.02em",
    label: "Dyspraxia-friendly",
  },
  mld: {
    fontFamily: VERDANA,
    titleFamily: VERDANA,
    fontScale: 1.06,
    lineScale: 1.16,
    letterSpacing: "0.02em",
    wordSpacing: "0.08em",
    label: "MLD-friendly",
  },
  dyscalculia: {
    fontFamily: VERDANA,
    titleFamily: VERDANA,
    fontScale: 1.06,
    lineScale: 1.12,
    label: "Dyscalculia-friendly",
  },
  slcn: {
    fontFamily: VERDANA,
    titleFamily: VERDANA,
    fontScale: 1.04,
    lineScale: 1.12,
    wordSpacing: "0.08em",
    label: "SLCN-friendly",
  },
  eal: {
    fontFamily: VERDANA,
    titleFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.1,
    wordSpacing: "0.06em",
    label: "EAL support",
  },
  adhd: {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    pageBg: "#FBFBF6", // soft off-white — lowers glare/distraction
    label: "ADHD-friendly",
  },
  asc: {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    pageBg: "#FBFBF6", // calm, low-contrast surface
    label: "Autism-friendly",
  },
  asperger: {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    pageBg: "#FBFBF6",
    label: "Autism-friendly",
  },
  anxiety: {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    pageBg: "#FBFCFE", // calm pale-blue tint
    label: "Low-anxiety",
  },
  semh: {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    pageBg: "#FBFCFE",
    label: "SEMH-friendly",
  },
  "pda-odd": {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    pageBg: "#FBFCFE",
    label: "Low-demand",
  },
  vi: {
    // Visual impairment: maximum safe enlargement + high contrast.
    // NOTE: true large-print (>=18pt reflowed) needs a dedicated export;
    // within the fixed 2-page layout this is the largest overflow-safe boost.
    fontFamily: SANS,
    titleFamily: SANS,
    fontScale: 1.12,
    lineScale: 1.16,
    letterSpacing: "0.02em",
    textColor: "#000000",
    pageBg: "#ffffff",
    label: "Large print (high contrast)",
  },
  hi: {
    // Hearing impairment: layout already self-contained; minor clarity boost.
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    label: "HI-friendly",
  },
  tourettes: {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    label: "Calm layout",
  },
  "older-learners": {
    fontFamily: VERDANA,
    fontScale: 1.0,
    lineScale: 1.06,
    label: "Age-appropriate",
  },
  // Working memory: generous spacing so students can hold their place
  // without losing context; slightly larger text reduces re-reading load.
  "working-memory": {
    fontFamily: VERDANA,
    fontScale: 1.04,
    lineScale: 1.14,
    letterSpacing: "0.02em",
    pageBg: "#FAFAF5",
    label: "Working memory support",
  },
  // ASC sub-profiles — all inherit the base ASC calm layout
  "asc-social": {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    pageBg: "#FBFBF6",
    label: "Autism-friendly (Social)",
  },
  "asc-demand-avoidant": {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    pageBg: "#FBFCFE",
    label: "Autism-friendly (PDA)",
  },
  "asc-sensory": {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.06,
    pageBg: "#F8F8F4", // muted, minimal contrast
    label: "Autism-friendly (Sensory)",
  },
  "asc-rigid": {
    fontFamily: VERDANA,
    fontScale: 1.02,
    lineScale: 1.08,
    pageBg: "#FBFBF6",
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
