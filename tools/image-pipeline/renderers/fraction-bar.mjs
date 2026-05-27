/**
 * Fraction bar / strip renderer.
 *
 * Brief examples we cover:
 *   "Fraction bar — 1/2 shaded"
 *   "Fraction bar — 3/4 shaded"
 *   "Fraction strip — 5/8 blue"
 *
 * Spec: a horizontal rectangle subdivided into N equal parts; the first
 * K parts are filled with the primary fill (or named colour); the rest
 * are white. All cell borders are equal-weight black outlines.
 */
import { PALETTE, outlineWidth } from "./_palette.mjs";

const W = 1200;
const H = 480;

const NAMED_COLOURS = {
  red: PALETTE.primary,
  blue: PALETTE.secondary,
  green: PALETTE.tertiary,
  yellow: PALETTE.accent,
};

function parseFraction(title) {
  // Form A: "K/N" anywhere in the title (e.g. "3/4 shaded", "5/8 blue")
  const m = String(title).match(/(\d+)\s*\/\s*(\d+)/);
  if (m) {
    const k = parseInt(m[1], 10);
    const n = parseInt(m[2], 10);
    if (n <= 0 || k < 0 || k > n) {
      throw new Error(`fraction-bar: fraction ${k}/${n} invalid`);
    }
    return { k, n };
  }
  // Form B: "split into N" → empty bar of N divisions
  const s = String(title).match(/split\s+into\s+(\d+)/i);
  if (s) {
    const n = parseInt(s[1], 10);
    if (n <= 0) throw new Error(`fraction-bar: split into ${n} invalid`);
    return { k: 0, n };
  }
  throw new Error(`fraction-bar: cannot parse fraction from "${title}"`);
}

function parseColour(title) {
  for (const [name, hex] of Object.entries(NAMED_COLOURS)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(title)) return hex;
  }
  return PALETTE.primary;
}

export function render(row) {
  const { k, n } = parseFraction(row.title);
  const fill = parseColour(row.title);

  const padX = Math.round(W * 0.08);
  const padY = Math.round(H * 0.18);
  const barX = padX;
  const barY = padY;
  const barW = W - padX * 2;
  const barH = H - padY * 2;
  const cellW = barW / n;
  const stroke = outlineWidth(W, H);

  const cells = [];
  for (let i = 0; i < n; i += 1) {
    const cx = barX + i * cellW;
    const cellFill = i < k ? fill : PALETTE.background;
    cells.push(
      `<rect x="${cx}" y="${barY}" width="${cellW}" height="${barH}" fill="${cellFill}" stroke="${PALETTE.outline}" stroke-width="${stroke}"/>`,
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PALETTE.background}"/>
  ${cells.join("\n  ")}
</svg>`;
}

export const meta = {
  family: "fraction-bar",
  outputSize: { width: W, height: H },
  expects: "Title containing fraction K/N (and optional colour name).",
};
