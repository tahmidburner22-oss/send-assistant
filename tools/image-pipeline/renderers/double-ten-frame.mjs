/**
 * Double ten-frame SVG renderer (for numbers 10..20).
 *
 * Spec: two 2×5 frames stacked vertically with whitespace between,
 * counters fill left-to-right, top row first, frame 1 before frame 2.
 */
import { PALETTE, outlineWidth } from "./_palette.mjs";

const W = 1024;
const H = 1024;
const COLS = 5;
const ROWS_PER_FRAME = 2;

function parseCount(title) {
  const m = String(title).match(/—\s*(\d+)\s*counters?/i);
  if (!m) throw new Error(`double-ten-frame: cannot parse count from "${title}"`);
  const n = parseInt(m[1], 10);
  if (n < 0 || n > 20) {
    throw new Error(`double-ten-frame: count ${n} out of range 0..20`);
  }
  return n;
}

export function render(row) {
  const count = parseCount(row.title);

  const pad = Math.round(W * 0.1);
  const gap = Math.round(H * 0.06); // gap between the two frames
  const gridW = W - pad * 2;
  const cellW = Math.floor(gridW / COLS);
  const cellH = cellW;
  const frameH = cellH * ROWS_PER_FRAME;
  const totalH = frameH * 2 + gap;
  const x0 = Math.round((W - cellW * COLS) / 2);
  const y0 = Math.round((H - totalH) / 2);
  const stroke = outlineWidth(W, H);
  const counterR = Math.round(cellW * 0.32);

  const draw = [];
  for (let f = 0; f < 2; f += 1) {
    const yFrame = y0 + f * (frameH + gap);
    for (let r = 0; r < ROWS_PER_FRAME; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const idx = f * 10 + r * COLS + c;
        const cx = x0 + c * cellW;
        const cy = yFrame + r * cellH;
        draw.push(
          `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" fill="${PALETTE.background}" stroke="${PALETTE.outline}" stroke-width="${stroke}"/>`,
        );
        if (idx < count) {
          draw.push(
            `<circle cx="${cx + cellW / 2}" cy="${cy + cellH / 2}" r="${counterR}" fill="${PALETTE.primary}" stroke="${PALETTE.outline}" stroke-width="${stroke}"/>`,
          );
        }
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PALETTE.background}"/>
  ${draw.join("\n  ")}
</svg>`;
}

export const meta = {
  family: "double-ten-frame",
  outputSize: { width: W, height: H },
  expects: "Title of form 'Double ten frame — N counters' with 0 ≤ N ≤ 20",
};
