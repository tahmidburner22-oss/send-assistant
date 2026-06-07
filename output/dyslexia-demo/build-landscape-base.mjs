/**
 * build-landscape-base.mjs — BASE (canonical) landscape, 2-page PDF.
 *
 * Non-SEND, library-canonical edition of the landscape worksheet. Faithful
 * mirror of build-landscape.mjs — identical STRUCTURE and LAYOUT:
 *   Page 1: intro (header + note + method + common mistakes + worked example).
 *   Page 2: all 8 questions in a 2-column grid with extra spacing.
 *   No writing space (workbooks); no teacher answers.
 *
 * Only the SEND adaptations are removed:
 *   - Cream #FFF8E7 full-bleed overlay   -> plain white page
 *   - Locally embedded OpenDyslexic font -> standard sans-serif stack
 *   - Extra letter/word spacing          -> normal typographic defaults
 *   - Purple #5b3fa8 borders + accent    -> neutral ink/grey
 *
 * The generator layers the SEND overlay, difficulty and reading age back on
 * top of this base WITHOUT changing the structure.
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

  <div class="two-col">
    <div class="box mistakes">
      <h2>Common mistakes</h2>
      <ul>${mistakes}</ul>
    </div>
    <div class="box worked">
      <h2>Worked example</h2>
      <div class="ex">${worked}</div>
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
    min-height: 209mm;                /* landscape A4 height */
    background: ${PAGE_BG};
    color: ${INK};
    padding: 11mm 13mm;
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

  .box { border: 1px solid ${BORDER}; border-radius: 6px; background: transparent; padding: 9px 13px; }
  h2 { font-size: 16px; font-weight: 700; margin: 0 0 5px; color: ${HEAD}; }

  .header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid ${BORDER}; padding-bottom: 6px; margin-bottom: 10px; }
  .h-title { font-size: 22px; font-weight: 700; }
  .h-sub { font-size: 14px; }
  .note { font-size: 14px; margin-bottom: 12px; }

  /* intro page */
  .method { margin-bottom: 12px; }
  .m-steps { display: flex; flex-wrap: wrap; gap: 6px 22px; margin-top: 4px; }
  .m-step { white-space: nowrap; }
  .two-col { display: flex; gap: 12px; }
  .two-col > .box { flex: 1; }
  ul { margin: 0; padding-left: 20px; }
  li { margin: 5px 0; }
  .worked .ex div { margin: 3px 0; }

  /* questions page: 2-column grid, extra spacing */
  .questions .q-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 22px; align-content: start; flex: 1; }
  .q-card { display: flex; flex-direction: column; justify-content: center; }
  .q-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .q-num { font-size: 17px; font-weight: 700; color: ${HEAD}; }
  .q-right { display: flex; align-items: center; gap: 10px; }
  .marks { font-weight: 700; }
  .difficulty { display: inline-flex; gap: 4px; align-items: center; }
  .pip { width: 11px; height: 11px; border-radius: 50%; border: 2px solid ${BORDER}; display: inline-block; }
  .pip.on { background: ${BORDER}; }
  .q-text { font-size: 18px; }
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
