/**
 * SEND palette constants. Mirrors SEND-STYLE-GUIDE.md.
 * Imported by every SVG renderer; do not redefine colours locally.
 */
export const PALETTE = {
  outline: "#1A1A1A",
  text: "#1A1A1A",
  primary: "#E63946",
  secondary: "#1D7BD9",
  tertiary: "#2A9D8F",
  accent: "#F4C430",
  neutral: "#E9ECEF",
  background: "#FFFFFF",
};

export const TYPOGRAPHY = {
  family:
    'system-ui, "Atkinson Hyperlegible", "Open Sans", Arial, sans-serif',
  weight: 600,
  letterSpacing: "0.02em",
};

/**
 * Compute outline stroke width that obeys the "≥0.4% of shorter edge" rule.
 */
export function outlineWidth(width, height) {
  return Math.max(2, Math.round(0.005 * Math.min(width, height)));
}
