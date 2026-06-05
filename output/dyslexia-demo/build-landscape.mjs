/**
 * build-landscape.mjs — landscape, 2-page, SEND-adapted PDF.
 *   Page 1: intro (header + method + common mistakes + worked example).
 *   Page 2: all 8 questions in a 2-column grid with extra spacing.
 *   No writing space (workbooks); no teacher answers.
 *   Full-bleed cream overlay, black text, outlined boxes (no fill),
 *   OpenDyslexic embedded locally (SIL OFL) so the PDF is self-contained.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ws = JSON.parse(readFileSync(join(__dirname, "worksheet-landscape.json"), "utf8"));

const CREAM = ws.metadata?.colorOverlayHex || "#FFF8E7";
const ACCENT = "#5b3fa8";
const FONT = "'OpenDyslexic', 'Comic Sans MS', sans-serif";
const FONT_CSS = readFileSync(join(__dirname, "libs/fonts/opendyslexic-embed.css"), "utf8");

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
<style>${FONT_CSS}</style>
<style>
  @page { size: A4 landscape; margin: 0; }
  html, body { margin: 0; padding: 0; background: ${CREAM}; }

  .page {
    box-sizing: border-box;
    width: 297mm;
    min-height: 209mm;                /* landscape A4 height */
    background: ${CREAM};
    color: #000000;
    padding: 11mm 13mm;
    display: flex;
    flex-direction: column;
    font-family: ${FONT};
    font-size: 16px;
    line-height: 1.6;
    letter-spacing: 0.03em;
    word-spacing: 0.14em;
  }
  .page *, .page *::before, .page *::after {
    font-family: ${FONT};
    letter-spacing: 0.03em;
    word-spacing: 0.14em;
  }
  .page + .page { break-before: page; }
  .page p, .page li, .page div { text-align: left; }

  .box { border: 2px solid ${ACCENT}; border-radius: 10px; background: transparent; padding: 9px 13px; }
  h2 { font-size: 16px; font-weight: 700; margin: 0 0 5px; color: ${ACCENT}; }

  .header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid ${ACCENT}; padding-bottom: 6px; margin-bottom: 10px; }
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
  .q-num { font-size: 17px; font-weight: 700; color: ${ACCENT}; }
  .q-right { display: flex; align-items: center; gap: 10px; }
  .marks { font-weight: 700; }
  .difficulty { display: inline-flex; gap: 4px; align-items: center; }
  .pip { width: 11px; height: 11px; border-radius: 50%; border: 2px solid ${ACCENT}; display: inline-block; }
  .pip.on { background: ${ACCENT}; }
  .q-text { font-size: 18px; }
</style>
</head>
<body>
  ${introPage}
  ${questionsPage}
</body></html>`;

writeFileSync(join(__dirname, "worksheet-landscape.html"), html, "utf8");

const outPdf = join(__dirname, "Quadratic-Simultaneous-Equations-Dyslexia-Landscape.pdf");
const fileUrl = "file://" + join(__dirname, "worksheet-landscape.html");
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: "load", timeout: 60000 });
try { await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; }); } catch {}
await page.waitForTimeout(500);
await page.pdf({ path: outPdf, format: "A4", landscape: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
await browser.close();
console.log("WROTE", outPdf);
