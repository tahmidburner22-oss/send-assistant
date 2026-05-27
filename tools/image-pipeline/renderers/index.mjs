/**
 * SVG renderer index.
 *
 * Maps the renderer key (from taxonomy.SVG_TITLE_PREFIXES) to a module
 * that exports `render(row, params)` returning an SVG string.
 *
 * If a key in the taxonomy is not yet implemented here, `getRenderer`
 * returns null and the runner downgrades the row to AI-structural with
 * a note in the QA log. This keeps the pipeline running while we ship
 * SVG renderers incrementally.
 */
import * as tenFrame from "./ten-frame.mjs";
import * as doubleTenFrame from "./double-ten-frame.mjs";
import * as numberLine from "./number-line.mjs";
import * as numberLineRange from "./number-line-range.mjs";
import * as fractionBar from "./fraction-bar.mjs";
import * as diceFace from "./dice-face.mjs";
import * as array from "./array.mjs";

const REGISTRY = {
  "ten-frame": tenFrame,
  "double-ten-frame": doubleTenFrame,
  "number-line": numberLine,
  "number-line-range": numberLineRange,
  "fraction-bar": fractionBar,
  "dice-face": diceFace,
  array,
  // Not yet implemented — taxonomy may route here; runner downgrades to AI:
  //   place-value-chart, hundred-square, number-bond-cherry, fraction-wall,
  //   bar-model, domino, clock, dienes
};

export function getRenderer(name) {
  return REGISTRY[name] || null;
}

export function listRenderers() {
  return Object.keys(REGISTRY);
}
