/**
 * Number line with arbitrary integer range (e.g. -10..10, -20..20 step 2).
 *
 * Brief example:
 *   "Number line −10..10 — every integer marked"
 *   "Number line −20..20 — step 2"
 */
import * as base from "./number-line.mjs";

function parseRange(title) {
  // matches "−10..10", "-10..10", "−20..20"
  const m = String(title).match(/(-|−)?(\d+)\s*\.\.\s*(-|−)?(\d+)/);
  if (!m) throw new Error(`number-line-range: cannot parse range from "${title}"`);
  const min = parseInt(m[2], 10) * (m[1] ? -1 : 1);
  const max = parseInt(m[4], 10) * (m[3] ? -1 : 1);
  return { min, max };
}

export function render(row) {
  const { min, max } = parseRange(row.title);
  // Reuse the base renderer with the parsed range. Step is honoured by
  // base via labelStep auto-selection when >20 span.
  return base.render(row, { min, max });
}

export const meta = {
  family: "number-line-range",
  outputSize: base.meta.outputSize,
  expects: "Title of form 'Number line MIN..MAX — ...'",
};
