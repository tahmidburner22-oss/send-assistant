/**
 * Render-strategy taxonomy.
 *
 * Every catalogue row is routed by `chooseStrategy(row)` to one of:
 *   - 'svg'           → deterministic SVG renderer (100% spec-accurate)
 *   - 'ai-structural' → AI-generated labelled/technical diagram (cell, circuit, ray)
 *   - 'ai-pictorial'  → AI-generated illustrative scene/object
 *
 * Decision priority:
 *   1. Title prefix matches a known SVG renderer key → 'svg'
 *   2. Subject + title heuristics → 'ai-structural'
 *   3. Default → 'ai-pictorial'
 *
 * This file is the single decision point. To add a new SVG renderer,
 * register its title-prefix in SVG_TITLE_PREFIXES and implement the
 * renderer module under renderers/.
 */

// --------------------------------------------------------------------
// SVG renderer registry. Keys are matched against the lower-cased title
// using a "starts-with after the leading section" rule. Values are
// renderer module names (without extension) under renderers/.
// --------------------------------------------------------------------
export const SVG_TITLE_PREFIXES = [
  // Counting & place value
  { match: /^ten frame —/i, renderer: "ten-frame" },
  { match: /^double ten frame —/i, renderer: "double-ten-frame" },
  { match: /^number line 0–10 —/i, renderer: "number-line", params: { min: 0, max: 10 } },
  { match: /^number line 0–20 —/i, renderer: "number-line", params: { min: 0, max: 20 } },
  { match: /^number line 0–100 —/i, renderer: "number-line", params: { min: 0, max: 100 } },
  { match: /^number line −?\d+\.\.−?\d+/i, renderer: "number-line-range" },
  { match: /^place value chart —/i, renderer: "place-value-chart" },
  { match: /^hundred square/i, renderer: "hundred-square" },
  { match: /^number bond cherry/i, renderer: "number-bond-cherry" },

  // Fractions
  { match: /^fraction bar —/i, renderer: "fraction-bar" },
  { match: /^fraction strip —/i, renderer: "fraction-bar" },
  { match: /^fraction wall/i, renderer: "fraction-wall" },

  // Multiplication / arrays / bar models
  { match: /^array —/i, renderer: "array" },
  { match: /^bar model —/i, renderer: "bar-model" },

  // Dice / dominoes
  { match: /^dice face —/i, renderer: "dice-face" },
  { match: /^domino —/i, renderer: "domino" },

  // Clock / time
  { match: /^clock —/i, renderer: "clock" },

  // Base 10
  { match: /^dienes blocks/i, renderer: "dienes" },
  { match: /^base 10 blocks/i, renderer: "dienes" },
];

// --------------------------------------------------------------------
// AI-structural keywords. If the title or topic matches, route to AI
// but with the "structural / labelled" prompt style.
// --------------------------------------------------------------------
const STRUCTURAL_PATTERNS = [
  /labelled/i,
  /labeled/i,
  /diagram —/i,
  /circuit/i,
  /ray diagram/i,
  /free-body/i,
  /flowchart/i,
  /factor tree/i,
  /venn diagram/i,
  /food (chain|web)/i,
  /cross[- ]section/i,
  /apparatus/i,
  /required practical/i,
  /cell( |$)/i,
  /skeleton/i,
  /digestive/i,
  /circulatory/i,
  /respiratory/i,
  /electrolysis/i,
];

// --------------------------------------------------------------------
// AI-pictorial keywords. Default for everything else; this list is for
// readability and so we can tweak prompt style for clearly-illustrative
// briefs.
// --------------------------------------------------------------------
const PICTORIAL_PATTERNS = [
  /^mascot/i,
  /^story (character|setting) card/i,
  /^character map/i,
  /^artwork study/i,
  /^festival/i,
  /^uk garden animal/i,
  /^plant card/i,
  /^animal card/i,
  /^tree card/i,
  /^instrument/i,
];

/**
 * Decide the render strategy for a catalogue row.
 *
 * @param {object} row - catalogue row with at least { title, subject, topic, description }
 * @returns {{ strategy: 'svg'|'ai-structural'|'ai-pictorial', renderer?: string, params?: object }}
 */
export function chooseStrategy(row) {
  const title = String(row.title || "");

  // 1. SVG renderer registry
  for (const entry of SVG_TITLE_PREFIXES) {
    if (entry.match.test(title)) {
      return {
        strategy: "svg",
        renderer: entry.renderer,
        params: entry.params || {},
      };
    }
  }

  // 2. AI-structural
  for (const pat of STRUCTURAL_PATTERNS) {
    if (pat.test(title) || pat.test(row.topic || "")) {
      return { strategy: "ai-structural" };
    }
  }

  // 3. AI-pictorial (default)
  for (const pat of PICTORIAL_PATTERNS) {
    if (pat.test(title)) {
      return { strategy: "ai-pictorial" };
    }
  }

  return { strategy: "ai-pictorial" };
}

/**
 * Summarise the strategy distribution across a list of rows.
 */
export function summariseStrategies(rows) {
  const summary = { svg: 0, "ai-structural": 0, "ai-pictorial": 0 };
  const svgByRenderer = {};
  for (const row of rows) {
    const s = chooseStrategy(row);
    summary[s.strategy] += 1;
    if (s.strategy === "svg") {
      svgByRenderer[s.renderer] = (svgByRenderer[s.renderer] || 0) + 1;
    }
  }
  return { summary, svgByRenderer };
}
