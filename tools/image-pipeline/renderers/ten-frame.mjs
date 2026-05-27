/**
 * Ten-frame SVG renderer.
 *
 * Spec: a 2×5 grid of equal cells with N solid red counters filled
 * left-to-right, top row first. Renders pdl-0001..pdl-0011 exactly to
 * the catalogue brief.
 *
 * Brief example:
 *   "A 2×5 ten frame with 7 red counters filled (left to right, top
 *    row first) and 3 empty cells."
 */
import { PALETTE, outlineWidth } from "./_palette.mjs";

const W = 1024;
const H = 1024;
const COLS = 5;
const ROWS = 2;

/**
 * Extract the count from the title, e.g. "Ten frame — 7 counters" → 7.
 */
function parseCount(title) {
  const m = String(title).match(/—\s*(\d+)\s*counters?/i);
  if (!m) throw new Error(`ten-frame: cannot parse count from "${title}"`);
  const n = parseInt(m[1], 10);
  if (n < 0 || n > 10) {
    throw new Error(`ten-frame: count ${n} out of range 0..10`);
  }
  return n;
}

export function render(row /* { title, ... } */) {
  const count = parseCount(row.title);

  // Layout: centred grid with 8% padding minimum.
  const pad = Math.round(W * 0.1);
  const gridW = W - pad * 2;
  const cellW = Math.floor(gridW / COLS);
  const cellH = cellW; // square cells
  const gridH = cellH * ROWS;
  const x0 = Math.round((W - cellW * COLS) / 2);
  const y0 = Math.round((H - gridH) / 2);
  const stroke = outlineWidth(W, H);
  const counterR = Math.round(cellW * 0.32);

  const cells = [];
  const counters = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const idx = r * COLS + c;
      const cx = x0 + c * cellW;
      const cy = y0 + r * cellH;
      cells.push(
        `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="${PALETTE.background}" stroke="${PALETTE.outline}" stroke-width="${stroke}"/>`,
      );
      if (idx < count) {
        counters.push(
          `<circle cx="${cx + cellW / 2}" cy="${cy + cellH / 2}" r="${counterR}" fill="${PALETTE.primary}" stroke="${PALETTE.outline}" stroke-width="${stroke}"/>`,
        );
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PALETTE.background}"/>
  ${cells.join("\n  ")}
  ${counters.join("\n  ")}
</svg>`;
}

export const meta = {
  family: "ten-frame",
  outputSize: { width: W, height: H },
  expects: "Title of form 'Ten frame — N counters' with 0 ≤ N ≤ 10",
};
