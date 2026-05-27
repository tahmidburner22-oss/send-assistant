/**
 * Multiplication array renderer.
 *
 * Brief: "Array — 3 by 4" or "Array — 5×7"
 */
import { PALETTE, outlineWidth } from "./_palette.mjs";

const W = 1024;
const H = 1024;

function parseArray(title) {
  const m =
    String(title).match(/—\s*(\d+)\s*(?:by|×|x)\s*(\d+)/i) ||
    String(title).match(/(\d+)\s*(?:by|×|x)\s*(\d+)/i);
  if (!m) throw new Error(`array: cannot parse dimensions from "${title}"`);
  const r = parseInt(m[1], 10);
  const c = parseInt(m[2], 10);
  if (r < 1 || c < 1 || r > 20 || c > 20) {
    throw new Error(`array: ${r}×${c} out of supported range 1..20`);
  }
  return { rows: r, cols: c };
}

export function render(row) {
  const { rows, cols } = parseArray(row.title);
  const padX = Math.round(W * 0.12);
  const padY = Math.round(H * 0.12);
  const cellSize = Math.floor(
    Math.min((W - padX * 2) / cols, (H - padY * 2) / rows),
  );
  const gridW = cellSize * cols;
  const gridH = cellSize * rows;
  const x0 = Math.round((W - gridW) / 2);
  const y0 = Math.round((H - gridH) / 2);
  const stroke = outlineWidth(W, H);
  const dotR = Math.round(cellSize * 0.32);

  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cx = x0 + c * cellSize + cellSize / 2;
      const cy = y0 + r * cellSize + cellSize / 2;
      cells.push(
        `<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="${PALETTE.primary}" stroke="${PALETTE.outline}" stroke-width="${stroke}"/>`,
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PALETTE.background}"/>
  ${cells.join("\n  ")}
</svg>`;
}

export const meta = {
  family: "array",
  outputSize: { width: W, height: H },
  expects: "Title of form 'Array — R by C' or 'Array — R×C'",
};
