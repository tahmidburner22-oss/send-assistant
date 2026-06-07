/**
 * render.mjs — Canonical SEND worksheet renderer.
 *
 * Reproduces, 1:1, the two base-canonical layouts shipped in
 * output/dyslexia-demo:
 *   - LANDSCAPE two-page spread   (build-landscape-base.mjs)
 *   - PORTRAIT booklet            (build-base.mjs)
 *
 * The HTML structure and CSS are kept byte-faithful to those originals so the
 * geometry/spacing/typography is identical. ONLY the content is swapped, fed
 * from a per-topic JSON. The single topic-specific piece in the original
 * landscape (the hard-coded intersection graph) is replaced by a small,
 * data-driven "visual aid" registry so every topic can supply its own diagram.
 *
 * Exports:
 *   renderLandscapeHTML(ws)  -> full HTML string for the 2-page landscape sheet
 *   renderBookletHTML(ws)    -> full HTML string for the portrait booklet
 */

/* ----------------------------------------------------------------------------
 * Shared palette / typography — identical to the base-canonical editions.
 * (Plain white page, neutral ink/grey borders, standard sans-serif stack.)
 * ------------------------------------------------------------------------- */
const PAGE_BG = "#ffffff";
const INK = "#111111";
const BORDER = "#333333";
const HEAD = "#111111";
const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

/* ----------------------------------------------------------------------------
 * Text helpers.
 *  - esc()      : HTML-escape (same as the base scripts).
 *  - mathify()  : light, post-escape maths typography so authors can write
 *                 robust exponents/indices/subscripts and common operators.
 *                 Content is otherwise authored with proper Unicode symbols
 *                 (× ÷ − ² ³ √ ≤ ≥ ≠ ± π ½ …). mathify only ADDS markup, it
 *                 never reflows the original layout.
 *  - rich()     : esc + mathify (single line).
 *  - richNl()   : esc + mathify + newline→<br> (multi-line booklet content).
 * ------------------------------------------------------------------------- */
export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function mathify(escaped) {
  let s = escaped;
  // Superscripts:  ^{...}  or  ^token   (token = digits / letters / + - signs)
  s = s.replace(/\^\{([^}]+)\}/g, (_, g) => `<sup>${g}</sup>`);
  s = s.replace(/\^(-?[0-9a-zA-Z]+)/g, (_, g) => `<sup>${g}</sup>`);
  // Subscripts:  _{...}  or  _token
  s = s.replace(/_\{([^}]+)\}/g, (_, g) => `<sub>${g}</sub>`);
  s = s.replace(/_(-?[0-9a-zA-Z]+)/g, (_, g) => `<sub>${g}</sub>`);
  return s;
}

export const rich = (s) => mathify(esc(s));
export const richNl = (s) => mathify(esc(s)).replace(/\n/g, "<br>");

/* ----------------------------------------------------------------------------
 * Difficulty pips (1..5) — identical markup to both base editions.
 * ------------------------------------------------------------------------- */
function pips(level) {
  const n = Math.max(1, Math.min(5, Number(level) || 1));
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<span class="pip ${i <= n ? "on" : ""}"></span>`;
  return `<span class="difficulty" title="Difficulty ${n} of 5">${out}</span>`;
}

/* ============================================================================
 * VISUAL-AID REGISTRY
 * Every diagram draws inside a 360×250 viewBox so it drops into the landscape
 * "visual" box exactly where the original graph sat. Selected by ws.intro
 * .visual.type. Falls back to a neutral placeholder when absent/unknown.
 * ========================================================================== */
const SVG_OPEN = `<svg viewBox="0 0 360 250" class="graph-svg" preserveAspectRatio="xMidYMid meet" role="img"`;

/** Original intersection graph (line crossing a quadratic), now parameterised. */
function visualIntersection(p = {}) {
  const a = p.a ?? 1, b = p.b ?? -2, c = p.c ?? 3; // parabola y = ax² + bx + c
  const m = p.m ?? 1, k = p.k ?? 3;                // line y = mx + k
  const pts = p.points ?? [[0, 3], [3, 6]];        // labelled solution points
  const X0 = p.X0 ?? -2, X1 = p.X1 ?? 5, Y0 = p.Y0 ?? 0, Y1 = p.Y1 ?? 12;
  const L = 46, R = 348, T = 16, B = 226;
  const sx = (x) => L + ((x - X0) / (X1 - X0)) * (R - L);
  const sy = (y) => B - ((y - Y0) / (Y1 - Y0)) * (B - T);
  const f = (x) => a * x * x + b * x + c;
  const g = (x) => m * x + k;
  let para = "";
  for (let x = X0; x <= X1 + 0.001; x += 0.25) para += `${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)} `;
  const line = `${sx(X0).toFixed(1)},${sy(g(X0)).toFixed(1)} ${sx(X1).toFixed(1)},${sy(g(X1)).toFixed(1)}`;
  const axisY = sy(0), axisX = sx(0);
  const dots = pts
    .map(([x, y]) => `<circle cx="${sx(x).toFixed(1)}" cy="${sy(y).toFixed(1)}" r="4.5" fill="${INK}"/>
      <text x="${(sx(x) + 8).toFixed(1)}" y="${(sy(y) - 6).toFixed(1)}" class="g-pt">(${x}, ${y})</text>`)
    .join("");
  return `
  ${SVG_OPEN} aria-label="${esc(p.aria || "Line crossing a curve at two points")}">
    <line x1="34" y1="${axisY}" x2="352" y2="${axisY}" stroke="${BORDER}" stroke-width="1"/>
    <line x1="${axisX.toFixed(1)}" y1="10" x2="${axisX.toFixed(1)}" y2="236" stroke="${BORDER}" stroke-width="1"/>
    <text x="350" y="${(axisY + 14).toFixed(1)}" class="g-ax">x</text>
    <text x="${(axisX + 6).toFixed(1)}" y="16" class="g-ax">y</text>
    <polyline points="${para.trim()}" fill="none" stroke="${INK}" stroke-width="2.4"/>
    <polyline points="${line}" fill="none" stroke="#555" stroke-width="2.2" stroke-dasharray="6 4"/>
    ${dots}
  </svg>`;
}

/**
 * Algebra tiles — collecting like terms. Each row is a set of x-tiles (long
 * rectangles) and unit-tiles (small squares); a rule then shows the totals
 * combined. Ideal for "Introduction to Algebra".
 * params: { rows: [{x, units, label}], result: {x, units, label} }
 */
function visualTiles(p = {}) {
  const rows = p.rows ?? [{ x: 2, units: 3, label: "2x + 3" }, { x: 1, units: 1, label: "x + 1" }];
  const result = p.result ?? { x: 3, units: 4, label: "3x + 4" };
  const XW = 24, XH = 18, UW = 15, UH = 15, gap = 6;

  function tileRow(y, xn, units) {
    let out = "";
    let cx = 40;
    for (let i = 0; i < xn; i++) {
      out += `<rect x="${cx}" y="${y}" width="${XW}" height="${XH}" rx="3" fill="#dfe6ef" stroke="${BORDER}" stroke-width="1.4"/>
        <text x="${cx + XW / 2}" y="${y + XH / 2 + 4}" class="t-lbl" text-anchor="middle">x</text>`;
      cx += XW + gap;
    }
    if (xn && units) cx += 8;
    for (let i = 0; i < units; i++) {
      out += `<rect x="${cx}" y="${y + 1}" width="${UW}" height="${UH}" rx="2" fill="#ffffff" stroke="${BORDER}" stroke-width="1.4"/>
        <text x="${cx + UW / 2}" y="${y + UH / 2 + 4}" class="t-lbl" text-anchor="middle">1</text>`;
      cx += UW + gap;
    }
    return out;
  }

  let y = 26;
  let body = "";
  for (const r of rows) {
    body += tileRow(y, r.x, r.units);
    body += `<text x="300" y="${y + 14}" class="t-eq" text-anchor="start">${esc(r.label)}</text>`;
    y += 38;
  }
  const lineY = y + 2;
  body += `<line x1="34" y1="${lineY}" x2="330" y2="${lineY}" stroke="${BORDER}" stroke-width="1.6"/>`;
  y = lineY + 18;
  body += tileRow(y, result.x, result.units);
  body += `<text x="300" y="${y + 14}" class="t-eq" text-anchor="start">= ${esc(result.label)}</text>`;

  return `
  ${SVG_OPEN} aria-label="${esc(p.aria || "Algebra tiles showing like terms being collected")}">
    ${body}
  </svg>`;
}

/**
 * Area / grid model — for multiplying out or partitioning. Draws an n×m grid
 * of cells with optional labels around the edges. Good for expanding brackets
 * or area-of-rectangle work. params: { cols:[..], rows:[..], cells:[[..]] }
 */
function visualGrid(p = {}) {
  const cols = p.cols ?? ["x", "+3"];
  const rows = p.rows ?? ["x", "+2"];
  const cells = p.cells ?? [["x²", "3x"], ["2x", "6"]];
  const x0 = 70, y0 = 50, cw = 110, ch = 70;
  let out = "";
  for (let c = 0; c < cols.length; c++)
    out += `<text x="${x0 + c * cw + cw / 2}" y="${y0 - 12}" class="t-eq" text-anchor="middle">${esc(cols[c])}</text>`;
  for (let r = 0; r < rows.length; r++)
    out += `<text x="${x0 - 14}" y="${y0 + r * ch + ch / 2 + 5}" class="t-eq" text-anchor="end">${esc(rows[r])}</text>`;
  for (let r = 0; r < rows.length; r++)
    for (let c = 0; c < cols.length; c++) {
      out += `<rect x="${x0 + c * cw}" y="${y0 + r * ch}" width="${cw}" height="${ch}" fill="${(r + c) % 2 ? "#f4f6fa" : "#ffffff"}" stroke="${BORDER}" stroke-width="1.4"/>`;
      const v = (cells[r] && cells[r][c]) || "";
      out += `<text x="${x0 + c * cw + cw / 2}" y="${y0 + r * ch + ch / 2 + 6}" class="t-cell" text-anchor="middle">${mathify(esc(v))}</text>`;
    }
  return `${SVG_OPEN} aria-label="${esc(p.aria || "Area grid model")}">${out}</svg>`;
}

/** Neutral fallback so the layout never collapses if no visual is supplied. */
function visualPlaceholder(p = {}) {
  return `${SVG_OPEN} aria-label="${esc(p.aria || "Diagram")}">
    <rect x="20" y="20" width="320" height="210" fill="none" stroke="${BORDER}" stroke-width="1.4" stroke-dasharray="6 5"/>
    <text x="180" y="130" class="t-eq" text-anchor="middle">${esc(p.text || "See worked example")}</text>
  </svg>`;
}

const VISUALS = {
  intersection: visualIntersection,
  tiles: visualTiles,
  grid: visualGrid,
  none: visualPlaceholder,
};

function renderVisual(visual) {
  if (!visual) return visualPlaceholder({});
  const fn = VISUALS[visual.type] || visualPlaceholder;
  return fn(visual.params || {});
}

/* ============================================================================
 * LANDSCAPE — two-page spread (1:1 with build-landscape-base.mjs)
 * ========================================================================== */
export function renderLandscapeHTML(ws) {
  const intro = ws.intro || {};
  const methodItems = (intro.methodSteps || []).map((s) => `<span class="m-step">${rich(s)}</span>`).join("");
  const mistakes = (intro.commonMistakes || []).map((m) => `<li>${rich(m)}</li>`).join("");
  const worked = (intro.workedExample || []).map((l) => `<div>${rich(l)}</div>`).join("");
  const visualTitle = intro.visual?.title || "Visual aid";
  const visualCaption = intro.visual?.caption || "";

  const introPage = `
<section class="page intro">
  <div class="header">
    <span class="h-title">${rich(intro.header)}</span>
    <span class="h-sub">${rich(intro.subheader)}</span>
  </div>
  <div class="note">${rich(intro.note)}</div>

  <div class="method box">
    <h2>Method</h2>
    <div class="m-steps">${methodItems}</div>
  </div>

  <div class="lower">
    <div class="box mistakes">
      <h2>Common mistakes</h2>
      <ul>${mistakes}</ul>
    </div>
    <div class="box worked">
      <h2>Worked example</h2>
      <div class="ex">${worked}</div>
    </div>
    <div class="box visual">
      <h2>${rich(visualTitle)}</h2>
      ${renderVisual(intro.visual)}
      ${visualCaption ? `<p class="cap">${rich(visualCaption)}</p>` : ""}
    </div>
  </div>
</section>`;

  const qCards = (ws.questions || [])
    .map(
      (q) => `
    <div class="q-card box">
      <div class="q-head">
        <span class="q-num">Q${esc(q.number)} of ${ws.questions.length}</span>
        <span class="q-right">${q.marks ? `<span class="marks">[${esc(q.marks)}]</span>` : ""}${pips(q.difficulty)}</span>
      </div>
      <div class="q-text">${rich(q.content)}</div>
    </div>`
    )
    .join("");

  const questionsPage = `
<section class="page questions">
  <div class="header">
    <span class="h-title">Questions</span>
    <span class="h-sub">${rich(ws.questionsSubheader || "Show your working in your workbook")}</span>
  </div>
  <div class="q-grid">${qCards}</div>
</section>`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<style>
  @page { size: A4 landscape; margin: 0; }
  html, body { margin: 0; padding: 0; background: ${PAGE_BG}; }

  .page {
    box-sizing: border-box;
    width: 297mm;
    height: 209.7mm;                  /* exactly one landscape A4 page */
    background: ${PAGE_BG};
    color: ${INK};
    padding: 12mm 14mm;
    display: flex;
    flex-direction: column;
    font-family: ${FONT};
    font-size: 17px;
    line-height: 1.5;
    overflow: hidden;
  }
  .page *, .page *::before, .page *::after { font-family: ${FONT}; }
  .page + .page { break-before: page; }
  .page p, .page li, .page div { text-align: left; }

  .box {
    border: 1.4px solid ${BORDER};
    border-radius: 8px;
    background: transparent;
    padding: 12px 16px;
  }
  h2 { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: ${HEAD}; }

  .header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2.4px solid ${BORDER}; padding-bottom: 8px; margin-bottom: 12px; flex: 0 0 auto; }
  .h-title { font-size: 26px; font-weight: 700; }
  .h-sub { font-size: 15px; }
  .note { font-size: 15px; margin-bottom: 14px; flex: 0 0 auto; }

  /* ---------- intro page ---------- */
  .method { margin-bottom: 14px; flex: 0 0 auto; }
  .m-steps { display: flex; flex-wrap: wrap; gap: 10px 30px; margin-top: 6px; font-size: 17px; }
  .m-step { white-space: nowrap; }

  /* stretched row that fills the rest of the page */
  .lower { display: flex; gap: 14px; flex: 1 1 auto; align-items: stretch; min-height: 0; }
  .lower > .box { display: flex; flex-direction: column; min-height: 0; }
  .mistakes { flex: 1.15; }
  .worked   { flex: 1.25; }
  .visual   { flex: 1.05; }

  ul { margin: 0; padding-left: 22px; }
  li { margin: 9px 0; }
  .worked .ex { display: flex; flex-direction: column; justify-content: space-between; flex: 1; }
  .worked .ex div { margin: 4px 0; font-size: 16px; }

  .visual .graph-svg { width: 100%; flex: 1 1 auto; min-height: 0; }
  .visual .cap { font-size: 14px; margin: 8px 0 0; color: #333; }
  .g-ax  { font-size: 13px; fill: ${INK}; font-family: ${FONT}; }
  .g-pt  { font-size: 13px; font-weight: 700; fill: ${INK}; font-family: ${FONT}; }
  .g-lbl { font-size: 13px; fill: #444; font-family: ${FONT}; }
  .t-lbl { font-size: 12px; font-weight: 700; fill: ${INK}; font-family: ${FONT}; }
  .t-eq  { font-size: 15px; font-weight: 700; fill: ${INK}; font-family: ${FONT}; }
  .t-cell{ font-size: 15px; fill: ${INK}; font-family: ${FONT}; }

  /* ---------- questions page: 2×4 grid filling the page ---------- */
  .questions .q-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(4, 1fr);
    gap: 18px 26px;
    flex: 1 1 auto;
    min-height: 0;
  }
  .q-card { display: flex; flex-direction: column; justify-content: center; }
  .q-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .q-num { font-size: 19px; font-weight: 700; color: ${HEAD}; }
  .q-right { display: flex; align-items: center; gap: 12px; }
  .marks { font-weight: 700; font-size: 17px; }
  .difficulty { display: inline-flex; gap: 5px; align-items: center; }
  .pip { width: 12px; height: 12px; border-radius: 50%; border: 2px solid ${BORDER}; display: inline-block; }
  .pip.on { background: ${BORDER}; }
  .q-text { font-size: 21px; }
</style>
</head>
<body>
  ${introPage}
  ${questionsPage}
</body></html>`;
}

/* ============================================================================
 * BOOKLET — portrait, one question per page (1:1 with build-base.mjs)
 * ========================================================================== */
export function renderBookletHTML(ws) {
  const reminderItems = (ws.methodReminder || []).map((s) => `<span class="rem-step">${rich(s)}</span>`).join("");
  const reminderStrip = `
  <div class="reminder box">
    <span class="rem-title">Remember the method:</span>
    <div class="rem-steps">${reminderItems}</div>
  </div>`;

  const intro = ws.intro || {};
  const introPage = `
<section class="page intro">
  <div class="small-header box">
    <div class="sh-title">${rich(intro.header)}</div>
    <div class="sh-sub">${rich(intro.subheader)}</div>
    <div class="sh-name">${rich(intro.nameLine)}</div>
  </div>

  <div class="block box">
    <h2>What you need to be able to do</h2>
    <p>${richNl(intro.objective)}</p>
  </div>

  <div class="block box">
    <h2>Common mistakes to avoid</h2>
    <ul>${(intro.commonMistakes || []).map((m) => `<li>${rich(m)}</li>`).join("")}</ul>
  </div>

  <div class="block box">
    <h2>Method steps</h2>
    <ol class="steps">${(intro.methodSteps || []).map((m) => `<li>${rich(m)}</li>`).join("")}</ol>
  </div>

  <div class="block box worked">
    <h2>Worked example</h2>
    <div class="example">${(intro.workedExample || []).map((l) => `<div>${rich(l)}</div>`).join("")}</div>
  </div>
</section>`;

  // Answer-line labels are configurable (default x/y to mirror the original).
  const ansLabels = ws.answerLabels && ws.answerLabels.length ? ws.answerLabels : ["x =", "y ="];

  const questionPages = (ws.questions || [])
    .map((q) => {
      const frame =
        Array.isArray(q.frame) && q.frame.length
          ? `<div class="frame box">
               <div class="frame-title">How to start</div>
               <ol class="frame-steps">${q.frame.map((f) => `<li>${rich(f)}</li>`).join("")}</ol>
             </div>`
          : "";
      const ansRows = ansLabels
        .map((lbl) => `<div class="ans-row"><span class="ans-label">${rich(lbl)}</span><span class="ans-line"></span></div>`)
        .join("");
      return `
<section class="page question">
  <div class="q-top">
    <div class="q-meta">
      <span class="q-num">Question ${esc(q.number)} of ${ws.questions.length}</span>
      <span class="q-right">${q.marks ? `<span class="marks">[${esc(q.marks)} mark${q.marks === 1 ? "" : "s"}]</span>` : ""}${pips(q.difficulty)}</span>
    </div>
    <div class="q-text box">${richNl(q.content)}</div>
    ${frame}
  </div>
  <div class="q-answer">
    ${ansRows}
  </div>
  ${reminderStrip}
</section>`;
    })
    .join("\n");

  const sr = ws.selfReflection || {};
  const reflectionPage = `
<section class="page reflect">
  <div class="small-header box"><div class="sh-title">${rich(sr.title)}</div></div>
  <div class="block box">
    <p class="confidence-q">${rich(sr.confidencePrompt)}</p>
    <div class="confidence">${(sr.confidenceOptions || []).map((o) => `<span class="opt"><span class="tick"></span>${rich(o)}</span>`).join("")}</div>
  </div>
  ${(sr.prompts || [])
    .map(
      (p) => `<div class="block box reflect-prompt">
    <p>${rich(p)}</p>
    <div class="write-line"></div>
    <div class="write-line"></div>
  </div>`
    )
    .join("")}
</section>`;

  const ans = ws.answers || {};
  const answerPage = `
<section class="page key">
  <div class="small-header box"><div class="sh-title">${rich(ans.title)}</div></div>
  <div class="block box">
    <h2>Answers</h2>
    <ol class="key-list">${(ans.rows || []).map((r) => `<li>${rich(r)}</li>`).join("")}</ol>
  </div>
</section>`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: ${PAGE_BG}; }

  .page {
    box-sizing: border-box;
    width: 210mm;
    min-height: 296mm;                        /* fill the A4 page */
    background: ${PAGE_BG};
    color: ${INK};
    padding: 8mm 10mm;
    display: flex;
    flex-direction: column;
    font-family: ${FONT};
    font-size: 16px;
    line-height: 1.45;
  }
  .page *, .page *::before, .page *::after {
    font-family: ${FONT};
  }
  .page + .page { break-before: page; }
  .page p, .page li, .page div { text-align: left; }

  /* outlined box: neutral border (region structure preserved, no colour coding) */
  .box {
    border: 1px solid ${BORDER};
    border-radius: 6px;
    background: transparent;
    padding: 8px 12px;
  }
  .intro .box { margin-bottom: 9px; }

  .small-header .sh-title { font-size: 20px; font-weight: 700; }
  .sh-sub { font-size: 14px; }
  .sh-name { font-size: 14px; margin-top: 6px; }

  h2 { font-size: 17px; font-weight: 700; margin: 0 0 5px; color: ${HEAD}; }
  ul, ol { margin: 0; padding-left: 22px; }
  li { margin: 4px 0; }
  .worked .example { margin-top: 2px; }
  .worked .example div { margin: 2px 0; }

  /* question page */
  .question .q-top { flex: 0 0 auto; }
  .q-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .q-num { font-size: 19px; font-weight: 700; }
  .q-right { display: flex; align-items: center; gap: 12px; }
  .marks { font-weight: 700; }
  .difficulty { display: inline-flex; gap: 4px; align-items: center; }
  .pip { width: 11px; height: 11px; border-radius: 50%; border: 2px solid ${BORDER}; display: inline-block; }
  .pip.on { background: ${BORDER}; }
  .q-text { font-size: 18px; }

  .frame { margin-top: 14px; border-style: dashed; }
  .frame-title { font-weight: 700; color: ${HEAD}; margin-bottom: 4px; }
  .frame-steps li { margin: 5px 0; }

  .q-answer { margin-top: auto; align-self: flex-end; width: 78mm; }  /* bottom-right */
  .ans-row { display: flex; align-items: flex-end; gap: 10px; margin-top: 16px; }
  .ans-label { font-weight: 700; white-space: nowrap; font-size: 18px; }
  .ans-line { flex: 1; border-bottom: 2px solid #000; height: 26px; }

  /* method reminder strip (bottom of each question page) */
  .reminder { margin-top: 16px; }
  .rem-title { font-weight: 700; color: ${HEAD}; }
  .rem-steps { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 4px; font-size: 14px; }
  .rem-step { white-space: nowrap; }

  /* reflection */
  .confidence-q { font-weight: 700; }
  .confidence { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 6px; }
  .opt { display: inline-flex; align-items: center; gap: 8px; }
  .tick { width: 16px; height: 16px; border: 2px solid #000; display: inline-block; border-radius: 3px; }
  .reflect-prompt { margin-top: 12px; }
  .write-line { border-bottom: 2px solid #000; height: 30px; margin-top: 14px; }

  /* teacher key */
  .key-list li { margin: 6px 0; }
</style>
</head>
<body>
  ${introPage}
  ${questionPages}
  ${reflectionPage}
  ${answerPage}
</body></html>`;
}
