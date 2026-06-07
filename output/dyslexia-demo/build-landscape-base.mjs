/**
 * build-landscape-base.mjs — BASE (canonical) landscape, 2-page PDF.
 *
 * Non-SEND, library-canonical edition of the landscape worksheet.
 *   Page 1: intro — header + note + method, then a stretched row of
 *           [common mistakes] [worked example] [visual aid graph].
 *   Page 2: all 8 questions in a 2×4 grid that fills the page.
 *   No writing space (workbooks); no teacher answers.
 *
 * Base styling (no SEND adaptations): plain white page, standard sans-serif
 * font, normal spacing, neutral ink/grey borders. The generator layers the
 * SEND overlay, difficulty and reading age back on top WITHOUT changing the
 * structure.
 *
 * Layout goals for this edition:
 *   - The worked example follows the method steps (Step 1..5).
 *   - A visual aid (line crossing a curve at two points) is included to show
 *     why a line-and-curve pair usually has two solutions.
 *   - Boxes and spacing stretch to fill the page so there is no dead white
 *     space on either sheet.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ws = JSON.parse(readFileSync(join(__dirname, "worksheet-landscape.base.json"), "utf8"));

const PAGE_BG = "#ffffff";
const INK = "#111111";
const BORDER = "#333333";
const HEAD = "#111111";
const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function pips(level) {
  const n = Math.max(1, Math.min(5, Number(level) || 1));
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<span class="pip ${i <= n ? "on" : ""}"></span>`;
  return `<span class="difficulty" title="Difficulty ${n} of 5">${out}</span>`;
}

/**
 * Visual aid: a schematic graph of the worked example showing the line
 * y = x + 3 crossing the curve y = x² − 2x + 3 at the two solution points
 * (0, 3) and (3, 6). Monochrome to stay consistent with the base styling.
 */
function intersectionGraph() {
  const X0 = -2, X1 = 5, Y0 = 0, Y1 = 12;      // graph window
  const L = 46, R = 348, T = 16, B = 226;       // svg drawing area
  const sx = (x) => L + ((x - X0) / (X1 - X0)) * (R - L);
  const sy = (y) => B - ((y - Y0) / (Y1 - Y0)) * (B - T);
  const f = (x) => x * x - 2 * x + 3;            // parabola
  const g = (x) => x + 3;                        // line

  let para = "";
  for (let x = X0; x <= 4.001; x += 0.25) para += `${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)} `;
  const line = `${sx(-2).toFixed(1)},${sy(g(-2)).toFixed(1)} ${sx(4.5).toFixed(1)},${sy(g(4.5)).toFixed(1)}`;

  const p1 = { x: sx(0), y: sy(3) };
  const p2 = { x: sx(3), y: sy(6) };
  const axisY = sy(0);
  const axisX = sx(0);

  return `
  <svg viewBox="0 0 360 250" class="graph-svg" preserveAspectRatio="xMidYMid meet" role="img"
       aria-label="Line y = x + 3 crossing the curve y = x squared minus 2x + 3 at (0, 3) and (3, 6)">
    <!-- axes -->
    <line x1="34" y1="${axisY}" x2="352" y2="${axisY}" stroke="${BORDER}" stroke-width="1"/>
    <line x1="${axisX.toFixed(1)}" y1="10" x2="${axisX.toFixed(1)}" y2="236" stroke="${BORDER}" stroke-width="1"/>
    <text x="350" y="${(axisY + 14).toFixed(1)}" class="g-ax">x</text>
    <text x="${(axisX + 6).toFixed(1)}" y="16" class="g-ax">y</text>
    <!-- curve and line -->
    <polyline points="${para.trim()}" fill="none" stroke="${INK}" stroke-width="2.4"/>
    <polyline points="${line}" fill="none" stroke="#555" stroke-width="2.2" stroke-dasharray="6 4"/>
    <!-- solution points -->
    <circle cx="${p1.x.toFixed(1)}" cy="${p1.y.toFixed(1)}" r="4.5" fill="${INK}"/>
    <circle cx="${p2.x.toFixed(1)}" cy="${p2.y.toFixed(1)}" r="4.5" fill="${INK}"/>
    <text x="${(p1.x - 4).toFixed(1)}" y="${(p1.y + 18).toFixed(1)}" class="g-pt" text-anchor="end">(0, 3)</text>
    <text x="${(p2.x + 8).toFixed(1)}" y="${(p2.y - 6).toFixed(1)}" class="g-pt">(3, 6)</text>
    <!-- curve / line labels -->
    <text x="300" y="44" class="g-lbl" text-anchor="end">y = x² − 2x + 3</text>
    <text x="316" y="120" class="g-lbl">y = x + 3</text>
  </svg>`;
}

const intro = ws.intro || {};
const methodItems = (intro.methodSteps || []).map((s) => `<span class="m-step">${esc(s)}</span>`).join("");
const mistakes = (intro.commonMistakes || []).map((m) => `<li>${esc(m)}</li>`).join("");
const worked = (intro.workedExample || []).map((l) => `<div>${esc(l)}</div>`).join("");

const introPage = `
<section class="page intro">
  <div class="header">
    <span class="h-title">${esc(intro.header)}</span>
    <span class="h-sub">${esc(intro.subheader)}</span>
  </div>
  <div class="note">${esc(intro.note)}</div>

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
      <h2>Visual aid — two solutions</h2>
      ${intersectionGraph()}
      <p class="cap">The straight line meets the curve at the two answer points.</p>
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
      <div class="q-text">${esc(q.content)}</div>
    </div>`
  )
  .join("");

const questionsPage = `
<section class="page questions">
  <div class="header">
    <span class="h-title">Questions</span>
    <span class="h-sub">Solve each pair — show working in your workbook</span>
  </div>
  <div class="q-grid">${qCards}</div>
</section>`;

const html = `<!doctype html>
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

writeFileSync(join(__dirname, "worksheet-landscape.base.html"), html, "utf8");

const outPdf = join(__dirname, "Quadratic-Simultaneous-Equations-Landscape-Base.pdf");
const fileUrl = "file://" + join(__dirname, "worksheet-landscape.base.html");
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: "load", timeout: 60000 });
try { await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; }); } catch {}
await page.waitForTimeout(300);
await page.pdf({ path: outPdf, format: "A4", landscape: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
await browser.close();
console.log("WROTE", outPdf);
