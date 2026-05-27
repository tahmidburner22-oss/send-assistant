/**
 * Dice face renderer.
 *
 * Brief: "Dice face — 4" → standard 6-sided die showing pips for that face.
 */
import { PALETTE, outlineWidth } from "./_palette.mjs";

const W = 1024;
const H = 1024;

// Canonical pip positions on a 3×3 grid for faces 1..6 (Western dice).
const PIPS = {
  1: ["mm"],
  2: ["tl", "br"],
  3: ["tl", "mm", "br"],
  4: ["tl", "tr", "bl", "br"],
  5: ["tl", "tr", "mm", "bl", "br"],
  6: ["tl", "tr", "ml", "mr", "bl", "br"],
};

function parseFace(title) {
  const m = String(title).match(/—\s*(\d)/);
  if (!m) throw new Error(`dice-face: cannot parse face from "${title}"`);
  const n = parseInt(m[1], 10);
  if (n < 1 || n > 6) throw new Error(`dice-face: face ${n} out of 1..6`);
  return n;
}

export function render(row) {
  const face = parseFace(row.title);
  const stroke = outlineWidth(W, H);

  // The cube face (rounded square) centred in the canvas.
  const sq = Math.round(W * 0.7);
  const x0 = (W - sq) / 2;
  const y0 = (H - sq) / 2;
  const r = Math.round(sq * 0.08);

  // 3×3 grid for pips
  const positions = {
    tl: [x0 + sq * 0.25, y0 + sq * 0.25],
    tr: [x0 + sq * 0.75, y0 + sq * 0.25],
    ml: [x0 + sq * 0.25, y0 + sq * 0.5],
    mm: [x0 + sq * 0.5, y0 + sq * 0.5],
    mr: [x0 + sq * 0.75, y0 + sq * 0.5],
    bl: [x0 + sq * 0.25, y0 + sq * 0.75],
    br: [x0 + sq * 0.75, y0 + sq * 0.75],
  };
  const pipR = Math.round(sq * 0.08);

  const pips = PIPS[face]
    .map(([], i) => null)
    .map((_, i) => {
      const key = PIPS[face][i];
      const [px, py] = positions[key];
      return `<circle cx="${px}" cy="${py}" r="${pipR}" fill="${PALETTE.outline}"/>`;
    })
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PALETTE.background}"/>
  <rect x="${x0}" y="${y0}" width="${sq}" height="${sq}" rx="${r}" ry="${r}" fill="${PALETTE.background}" stroke="${PALETTE.outline}" stroke-width="${stroke}"/>
  ${pips}
</svg>`;
}

export const meta = {
  family: "dice-face",
  outputSize: { width: W, height: H },
  expects: "Title of form 'Dice face — N' with 1 ≤ N ≤ 6",
};
