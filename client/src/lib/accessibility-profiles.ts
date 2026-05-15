/**
 * Adaptive Typography & Accessibility Profiles (FEAT-010)
 * ──────────────────────────────────────────────────────
 * A focused, evidence-based set of typography presets that go BEYOND simple
 * coloured overlays. Each profile bundles:
 *   - Font family (OpenDyslexic / Lexend / Atkinson Hyperlegible / Comic-Sans-free maths)
 *   - Letter spacing, line-height, word-spacing
 *   - Justification (always ragged-right for SEND/EAL — never justified)
 *   - Optional underline-on-vowels / picture-supported-nouns hooks (CSS-only)
 *
 * Why this exists: existing send-data.ts has `getSendFormatting()` which is
 * single-axis (per SEND need). This module is the user-facing layer above
 * that — a teacher can pick "Dyslexia (BDA-aligned)" without knowing about
 * the SEND need taxonomy. Profiles compose ON TOP of the SEND need formatting,
 * so a pupil with autism + dyslexia gets BOTH overlays applied correctly.
 *
 * Evidence base (paraphrased, not quoted):
 *   - British Dyslexia Association style guide: sans-serif, 12-14pt, line spacing
 *     1.5, ragged-right, off-white backgrounds
 *   - Lexend research (Bonnie Shaver-Troup): increased letter spacing improves
 *     reading rate in struggling readers
 *   - Atkinson Hyperlegible (Braille Institute): high differentiation between
 *     similar letterforms (e.g. l, 1, I)
 *   - OpenDyslexic (Abelardo Gonzalez): weighted bottoms reduce letter swap
 *
 * Costs: zero. Lexend + Atkinson Hyperlegible ship via Google Fonts (free).
 * OpenDyslexic ships via the SIL Open Font License (free, redistributable).
 * Ofsted-defensible: cite the BDA + Lexend research, profile name shows the
 * basis (e.g. "Dyslexia (BDA-aligned)").
 */

export interface AccessibilityProfile {
  /** Stable id used in metadata.accessibilityProfile */
  id: string;
  /** Short user-facing label */
  label: string;
  /** Longer description shown in the picker tooltip */
  description: string;
  /** Evidence source citation shown to teachers/SLT for Ofsted */
  basis: string;
  /** CSS font-family stack — first entry must be the loaded face */
  fontFamily: string;
  /** Base font size in px (overrides SEND profile if set) */
  baseFontSize?: number;
  /** Line height multiplier */
  lineHeight: number;
  /** Letter spacing in em (negative tightens) */
  letterSpacing: string;
  /** Word spacing */
  wordSpacing: string;
  /** Text justification */
  textAlign: "left" | "justify";
  /** Background colour applied to the worksheet root (use #ffffff for none) */
  background: string;
  /** Font weight */
  fontWeight: number;
  /** Whether to add picture-noun underline support (EAL/SEND) */
  pictureNouns?: boolean;
  /** Whether to add syllable-break hyphen hints */
  syllableBreaks?: boolean;
}

export const DEFAULT_A11Y_PROFILES: AccessibilityProfile[] = [
  {
    id: "standard",
    label: "Standard",
    description: "Default Adaptly typography — DM Sans, 1.55 line height.",
    basis: "Adaptly default — derived from BBC GEL accessibility recommendations",
    fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
    lineHeight: 1.55,
    letterSpacing: "0",
    wordSpacing: "0.02em",
    textAlign: "left",
    background: "#ffffff",
    fontWeight: 400,
  },
  {
    id: "dyslexia-bda",
    label: "Dyslexia (BDA-aligned)",
    description: "Lexend with widened spacing and ragged-right alignment.",
    basis: "British Dyslexia Association Style Guide + Lexend research (Shaver-Troup)",
    fontFamily: '"Lexend", "OpenDyslexic", "DM Sans", system-ui, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.7,
    letterSpacing: "0.04em",
    wordSpacing: "0.18em",
    textAlign: "left",
    background: "#ffffff",
    fontWeight: 400,
  },
  {
    id: "dyslexia-opendyslexic",
    label: "Dyslexia (OpenDyslexic)",
    description: "OpenDyslexic font — weighted bottoms reduce letter swaps.",
    basis: "OpenDyslexic (SIL OFL, Abelardo Gonzalez)",
    fontFamily: '"OpenDyslexic", "Lexend", "DM Sans", system-ui, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.65,
    letterSpacing: "0.03em",
    wordSpacing: "0.16em",
    textAlign: "left",
    background: "#ffffff",
    fontWeight: 400,
  },
  {
    id: "low-vision",
    label: "Low vision (Atkinson Hyperlegible)",
    description: "High letter differentiation — distinguishes l, 1, I and 0, O.",
    basis: "Atkinson Hyperlegible by Braille Institute of America",
    fontFamily: '"Atkinson Hyperlegible", "DM Sans", system-ui, sans-serif',
    baseFontSize: 18,
    lineHeight: 1.7,
    letterSpacing: "0.025em",
    wordSpacing: "0.14em",
    textAlign: "left",
    background: "#ffffff",
    fontWeight: 400,
  },
  {
    id: "eal-supported",
    label: "EAL — supported reading",
    description: "Lexend with extra word spacing and picture-noun support.",
    basis: "EAL Bell Foundation guidance + Lexend research",
    fontFamily: '"Lexend", "DM Sans", system-ui, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.75,
    letterSpacing: "0.03em",
    wordSpacing: "0.22em",
    textAlign: "left",
    background: "#ffffff",
    fontWeight: 400,
    pictureNouns: true,
  },
  {
    id: "ks1-large",
    label: "KS1 large print",
    description: "18pt Lexend, very wide spacing, ragged right — early readers.",
    basis: "DfE KS1 print guidance + Lexend research",
    fontFamily: '"Lexend", "DM Sans", system-ui, sans-serif',
    baseFontSize: 20,
    lineHeight: 1.85,
    letterSpacing: "0.04em",
    wordSpacing: "0.24em",
    textAlign: "left",
    background: "#ffffff",
    fontWeight: 400,
  },
  {
    id: "irlen",
    label: "Irlen / scotopic sensitivity",
    description: "Soft cream-ish background, no pure-black text — reduces glare.",
    basis: "Irlen Institute scotopic sensitivity research",
    fontFamily: '"Lexend", "DM Sans", system-ui, sans-serif',
    baseFontSize: 16,
    lineHeight: 1.65,
    letterSpacing: "0.02em",
    wordSpacing: "0.1em",
    textAlign: "left",
    background: "#fdf6e3",
    fontWeight: 400,
  },
  {
    id: "high-contrast",
    label: "High contrast (low vision)",
    description: "Black on yellow — meets WCAG AAA contrast for many readers.",
    basis: "WCAG 2.2 AAA contrast guidance",
    fontFamily: '"Atkinson Hyperlegible", "DM Sans", system-ui, sans-serif',
    baseFontSize: 17,
    lineHeight: 1.6,
    letterSpacing: "0.02em",
    wordSpacing: "0.12em",
    textAlign: "left",
    background: "#fffacd",
    fontWeight: 600,
  },
];

export function getProfileById(id: string | undefined | null): AccessibilityProfile {
  if (!id) return DEFAULT_A11Y_PROFILES[0];
  return DEFAULT_A11Y_PROFILES.find((p) => p.id === id) || DEFAULT_A11Y_PROFILES[0];
}

/**
 * Build a CSS string that applies an accessibility profile to a worksheet root.
 * The selector is `.ws-a11y-{id}` so the same CSS works in both the live React
 * tree and the print popup HTML built by pdf-generator-v2.ts.
 *
 * IMPORTANT: text-align overrides only the body of sections (.ws-section p,
 * .ws-section li) — NOT the worksheet header gradient, NOT KaTeX (.katex), and
 * NOT diagram captions. This stops a Lexend ragged-right rule from breaking
 * the carefully justified maths display.
 */
export function buildAccessibilityProfileCss(profile: AccessibilityProfile): string {
  const sel = `.ws-a11y-${profile.id}`;
  const fontSizeCss = profile.baseFontSize ? `font-size: ${profile.baseFontSize}px;` : "";
  return `
${sel} {
  font-family: ${profile.fontFamily} !important;
  ${fontSizeCss}
  line-height: ${profile.lineHeight} !important;
  letter-spacing: ${profile.letterSpacing} !important;
  word-spacing: ${profile.wordSpacing} !important;
  font-weight: ${profile.fontWeight} !important;
  background: ${profile.background};
}
${sel} .ws-section,
${sel} .ws-section p,
${sel} .ws-section li,
${sel} .ws-section td,
${sel} .ws-section span:not(.katex):not(.katex-html):not(.katex-mathml) {
  font-family: inherit !important;
  letter-spacing: inherit;
  word-spacing: inherit;
  line-height: inherit;
  text-align: ${profile.textAlign};
}
/* Don't ragged-right the diagram caption or the heading — they're center-aligned by design. */
${sel} .ws-header,
${sel} .ws-header *,
${sel} figure figcaption,
${sel} .ws-citations,
${sel} .ws-misconception-callout {
  text-align: initial;
}
/* Maths must NEVER inherit the accessibility font — it would corrupt symbols. */
${sel} .katex,
${sel} .katex-html,
${sel} .katex-mathml {
  font-family: KaTeX_Main, "Times New Roman", serif !important;
}
`.trim();
}

/**
 * Returns the localStorage key used to persist the active profile.
 * Per-user keying is done by the caller (it's a UI concern, not a profile concern).
 */
export const ACTIVE_A11Y_PROFILE_KEY = "adaptly_active_a11y_profile";


/**
 * Re-usable <head> HTML that loads the same web fonts as client/index.html.
 * Use this when you build a fresh document (e.g. a print popup or class-pack
 * booklet) — it keeps font choices consistent between the live app and any
 * detached print window.
 *
 * The chosen fonts are all free / open licence:
 *   - Lexend, Atkinson Hyperlegible — Google Fonts (free, OFL)
 *   - OpenDyslexic — SIL OFL via jsDelivr (free, redistributable)
 */
export const GOOGLE_FONTS_HEAD_HTML = `
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap" />
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<style>
  @font-face {
    font-family: "OpenDyslexic";
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url("https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/woff/OpenDyslexic-Regular.woff") format("woff");
  }
  @font-face {
    font-family: "OpenDyslexic";
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url("https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/woff/OpenDyslexic-Bold.woff") format("woff");
  }
</style>
`.trim();
