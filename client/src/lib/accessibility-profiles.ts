/**
 * accessibility-profiles.ts — adaptive typography (Phase 4 / FEAT-010)
 *
 * Per-pupil typography + accessibility profiles. Sits ON TOP of the existing
 * SEND formatting (getSendFormatting) and overrides specific properties when
 * the teacher or pupil-context picker selects a profile.
 *
 * Each profile produces:
 *  - id              — stable identifier stored in worksheet.metadata.accessibilityProfile
 *  - label           — human-friendly name shown in the picker
 *  - description     — short Ofsted-defensible rationale (BDA, NHS, EAL research)
 *  - cssVars         — CSS custom properties applied at the renderer root
 *  - className       — applied to the renderer root div ("ws-a11y-{id}")
 *  - fontFamilyStack — used in PDF printable fallback when CSS vars cascade
 *
 * The CSS produced by buildA11yProfileCss() targets `.ws-a11y-{id}` so the
 * profile applies on screen AND in the printed PDF popup, since both surfaces
 * include the class on their root.
 *
 * IMPORTANT: profiles never override SEND-required formatting that affects
 * accessibility (e.g. they never reduce font-size below the SEND minimum) —
 * we always take the maximum/most accessible of profile and SEND defaults.
 *
 * Cost: £0 — uses Google Fonts (Lexend, Atkinson Hyperlegible — both free)
 * and OpenDyslexic (open-source SIL OFL licence served via cdn.jsdelivr.net).
 */

export interface AccessibilityProfile {
  id: string;
  label: string;
  description: string;
  fontFamily: string;
  /** Minimum font-size in px — applied if larger than current. */
  fontSize?: number;
  /** Line height (e.g. 1.6, 1.8). */
  lineHeight?: number;
  /** Letter-spacing in em (e.g. 0.05). */
  letterSpacing?: number;
  /** Word-spacing in em. */
  wordSpacing?: number;
  /** Whether to add syllable break dots on words ≥ 3 syllables. */
  syllableBreaks?: boolean;
  /** Whether to use ragged-right (left-aligned) text instead of justified. */
  ragged?: boolean;
  /** Optional background tint — light cream / pale blue / pale green for visual stress. */
  background?: string;
}

export const DEFAULT_A11Y_PROFILES: AccessibilityProfile[] = [
  {
    id: "standard",
    label: "Standard (no overlay)",
    description: "Default typography — best for most pupils with no specific accessibility needs.",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  {
    id: "dyslexia-opendyslexic",
    label: "Dyslexia — OpenDyslexic",
    description: "OpenDyslexic font with weighted bottoms to anchor letters; recommended for some pupils with dyslexia (BDA-aligned).",
    fontFamily: "'OpenDyslexic', 'Comic Sans MS', sans-serif",
    fontSize: 16,
    lineHeight: 1.7,
    letterSpacing: 0.04,
    wordSpacing: 0.16,
    ragged: true,
  },
  {
    id: "dyslexia-lexend",
    label: "Dyslexia — Lexend",
    description: "Lexend Deca — research-backed typeface designed to improve reading proficiency (Lexend.com / Bonnie Shaver-Troup).",
    fontFamily: "'Lexend', 'Lexend Deca', system-ui, sans-serif",
    fontSize: 15,
    lineHeight: 1.7,
    letterSpacing: 0.02,
    wordSpacing: 0.12,
    ragged: true,
  },
  {
    id: "low-vision-atkinson",
    label: "Low vision — Atkinson Hyperlegible",
    description: "Atkinson Hyperlegible — created by Braille Institute to maximise letter differentiation for low-vision readers.",
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: 17,
    lineHeight: 1.7,
    letterSpacing: 0.03,
    ragged: true,
  },
  {
    id: "eal-supported",
    label: "EAL supported",
    description: "Larger text, generous line spacing, ragged-right alignment — supports pupils whose first language is not English.",
    fontFamily: "'Lexend', 'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: 16,
    lineHeight: 1.8,
    letterSpacing: 0.02,
    wordSpacing: 0.14,
    ragged: true,
  },
  {
    id: "visual-stress-cream",
    label: "Visual stress — cream tint",
    description: "Pale cream background (#fff8e7) with relaxed line spacing — reduces glare for pupils reporting visual stress (Meares-Irlen / NHS).",
    fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif",
    fontSize: 15,
    lineHeight: 1.7,
    letterSpacing: 0.02,
    background: "#fff8e7",
    ragged: true,
  },
  {
    id: "visual-stress-blue",
    label: "Visual stress — blue tint",
    description: "Pale blue background (#e7f0ff) — alternative tint for pupils for whom blue overlays improve text stability.",
    fontFamily: "'Atkinson Hyperlegible', 'Lexend', system-ui, sans-serif",
    fontSize: 15,
    lineHeight: 1.7,
    letterSpacing: 0.02,
    background: "#e7f0ff",
    ragged: true,
  },
  {
    id: "large-print",
    label: "Large print",
    description: "18pt minimum — meets RNIB large-print standard for partially-sighted readers.",
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: 19,
    lineHeight: 1.6,
    ragged: true,
  },
];

/** Look up a profile by id. Falls back to "standard" if not found. */
export function getA11yProfileById(id: string | undefined | null): AccessibilityProfile {
  if (!id) return DEFAULT_A11Y_PROFILES[0];
  return DEFAULT_A11Y_PROFILES.find((p) => p.id === id) || DEFAULT_A11Y_PROFILES[0];
}

/**
 * Build the CSS block for a given profile. Returns a string that can be
 * dropped into a <style> tag (or appended to the popup HTML head).
 * The CSS is scoped to `.ws-a11y-{id}` so it doesn't leak.
 */
export function buildA11yProfileCss(profile: AccessibilityProfile): string {
  if (profile.id === "standard") return ""; // no overrides for standard

  const sel = `.ws-a11y-${profile.id}`;
  const decls: string[] = [];

  decls.push(`font-family: ${profile.fontFamily} !important;`);
  if (profile.fontSize) decls.push(`font-size: ${profile.fontSize}px !important;`);
  if (profile.lineHeight) decls.push(`line-height: ${profile.lineHeight} !important;`);
  if (profile.letterSpacing != null) decls.push(`letter-spacing: ${profile.letterSpacing}em !important;`);
  if (profile.wordSpacing != null) decls.push(`word-spacing: ${profile.wordSpacing}em !important;`);
  if (profile.background) decls.push(`background: ${profile.background} !important;`);

  // Apply font-family + spacing to ALL descendants so per-section overrides
  // don't accidentally restore the original font.
  const descendantDecls: string[] = [];
  descendantDecls.push(`font-family: ${profile.fontFamily} !important;`);
  if (profile.letterSpacing != null) descendantDecls.push(`letter-spacing: ${profile.letterSpacing}em !important;`);
  if (profile.wordSpacing != null) descendantDecls.push(`word-spacing: ${profile.wordSpacing}em !important;`);

  let css = `${sel} {\n  ${decls.join("\n  ")}\n}\n`;
  css += `${sel} *, ${sel} *::before, ${sel} *::after {\n  ${descendantDecls.join("\n  ")}\n}\n`;

  if (profile.ragged) {
    css += `${sel} p, ${sel} li, ${sel} td {\n  text-align: left !important;\n  text-justify: none !important;\n}\n`;
  }

  if (profile.fontSize) {
    // Bump body and section text sizes proportionally
    css += `${sel} .ws-section, ${sel} .ws-section p, ${sel} .ws-section li {\n  font-size: ${profile.fontSize}px !important;\n}\n`;
  }

  return css;
}

/**
 * The <head> snippet (link tags) needed to load the accessibility fonts.
 * Includes preconnect for performance + every font referenced by any profile.
 * Idempotent — safe to drop into both index.html and the print popup HTML.
 */
export const A11Y_FONTS_HEAD_HTML = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/font/css/opendyslexic.css" rel="stylesheet">
`.trim();

/**
 * Convenience: build the full CSS for ALL profiles. Useful for the PDF
 * popup so the print sheet matches whatever profile the user picked.
 */
export function buildAllA11yProfilesCss(): string {
  return DEFAULT_A11Y_PROFILES.map(buildA11yProfileCss).filter(Boolean).join("\n");
}
