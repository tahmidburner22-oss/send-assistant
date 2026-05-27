/**
 * Number-line SVG renderer.
 *
 * Spec: a horizontal line from min..max with equal tick spacing, numeric
 * labels at every integer (small lines may also pass through), and an
 * optional filled triangular arrow marker pointing down at the integer
 * named in the title (e.g. "arrow on 7").
 *
 * Brief example:
 *   "Number line 0–10 — arrow on 7"
 *   "Number line 0–20 — arrow on 13"
 */
import { PALETTE, TYPOGRAPHY, outlineWidth } from "./_palette.mjs";

const W = 1200;
const H = 480;

function parseArrow(title) {
  const m = String(title).match(/arrow on\s*(-?\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

export function render(row, params = {}) {
  const min = params.min ?? 0;
  const max = params.max ?? 10;
  if (max <= min) throw new Error(`number-line: max ${max} ≤ min ${min}`);
  const arrowAt = parseArrow(row.title);
  if (arrowAt !== null && (arrowAt < min || arrowAt > max)) {
    throw new Error(`number-line: arrow ${arrowAt} outside [${min}, ${max}]`);
  }

  const padX = Math.round(W * 0.08);
  const padY = Math.round(H * 0.32);
  const lineY = Math.round(H * 0.55);
  const lineX0 = padX;
  const lineX1 = W - padX;
  const span = max - min;
  const stepX = (lineX1 - lineX0) / span;
  const stroke = outlineWidth(W, H);

  // Determine label step. For dense lines (>20 ticks), label every 5/10.
  let labelStep = 1;
  if (span > 20 && span <= 50) labelStep = 5;
  else if (span > 50) labelStep = 10;

  const tickH = Math.round(H * 0.06);
  const minorTickH = Math.round(tickH * 0.5);
  const fontSize = Math.round(H * 0.1);

  const ticks = [];
  for (let v = min; v <= max; v += 1) {
    const x = Math.round(lineX0 + (v - min) * stepX);
    const isLabelled = (v - min) % labelStep === 0;
    const th = isLabelled ? tickH : minorTickH;
    ticks.push(
      `<line x1="${x}" y1="${lineY - th}" x2="${x}" y2="${lineY + th}" stroke="${PALETTE.outline}" stroke-width="${stroke}" stroke-linecap="round"/>`,
    );
    if (isLabelled) {
      ticks.push(
        `<text x="${x}" y="${lineY + th + fontSize + 6}" text-anchor="middle" font-family='${TYPOGRAPHY.family}' font-size="${fontSize}" font-weight="${TYPOGRAPHY.weight}" fill="${PALETTE.text}">${v}</text>`,
      );
    }
  }

  // Arrow marker (filled triangle pointing down at arrowAt)
  let arrowSvg = "";
  if (arrowAt !== null) {
    const ax = Math.round(lineX0 + (arrowAt - min) * stepX);
    const ay = lineY - tickH - 8;
    const aw = Math.round(H * 0.1);
    const ah = Math.round(H * 0.16);
    arrowSvg = `<polygon points="${ax},${ay} ${ax - aw / 2},${ay - ah} ${ax + aw / 2},${ay - ah}" fill="${PALETTE.primary}" stroke="${PALETTE.outline}" stroke-width="${stroke}" stroke-linejoin="round"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PALETTE.background}"/>
  <line x1="${lineX0}" y1="${lineY}" x2="${lineX1}" y2="${lineY}" stroke="${PALETTE.outline}" stroke-width="${stroke}" stroke-linecap="round"/>
  ${ticks.join("\n  ")}
  ${arrowSvg}
</svg>`;
}

export const meta = {
  family: "number-line",
  outputSize: { width: W, height: H },
  expects:
    "Title of form 'Number line A–B — arrow on N' with min ≤ N ≤ max; if no arrow the marker is omitted.",
};
