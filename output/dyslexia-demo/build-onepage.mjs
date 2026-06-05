/**
 * build-onepage.mjs — render worksheet-onepage.json to a single-page,
 * SEND-adapted PDF optimised for teacher ease (no writing space; pupils
 * work in separate workbooks).
 *
 *   - One A4 page, full-bleed cream overlay, black text.
 *   - Outlined boxes (coloured border, no fill).
 *   - Top: small header + compact method box.
 *   - Common mistakes + worked example side-by-side to save vertical space.
 *   - 6 questions in a 2-column grid, difficulty pips, no answer lines.
 *   - No teacher answers, no reflection page.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ws = JSON.parse(readFileSync(join(__dirname, "worksheet-onepage.json"), "utf8"));

const CREAM = ws.metadata?.colorOverlayHex || "#FFF8E7";
const ACCENT = "#5b3fa8";
const FONT = "'OpenDyslexic', 'Comic Sans MS', sans-serif";

// Embed OpenDyslexic locally (base64 data-URI) so rendering never touches the
// network — robust + self-contained PDF. (OpenDyslexic is SIL OFL licensed.)
const FONT_CSS = readFileSync(join(__dirname, "libs/fonts/opendyslexic-embed.css"), "utf8");
const FONTS_HEAD = `<style>${FONT_CSS}</style>`;

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

const qCards = (ws.questions || [])
  .map(
    (q) => `
    <div class="q-card box">
      <div class="q-head">
        <span class="q-num">Q${esc(q.number)}</span>
        <span class="q-right">${q.marks ? `<span class="marks">[${esc(q.marks)}]</span>` : ""}${pips(q.difficulty)}</span>
      </div>
      <div class="q-text">${esc(q.content)}</div>
    </div>`
  )
  .join("");

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
${FONTS_HEAD}
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: ${CREAM}; }

  .sheet {
    box-sizing: border-box;
    width: 210mm;
    min-height: 296mm;
    background: ${CREAM};
    color: #000000;
    padding: 7mm 9mm;
    font-family: ${FONT};
    font-size: 14px;
    line-height: 1.5;
    letter-spacing: 0.03em;
    word-spacing: 0.12em;
  }
  .sheet *, .sheet *::before, .sheet *::after {
    font-family: ${FONT};
    letter-spacing: 0.03em;
    word-spacing: 0.12em;
  }
  .sheet p, .sheet li, .sheet div { text-align: left; }

  .box { border: 2px solid ${ACCENT}; border-radius: 9px; background: transparent; padding: 6px 9px; }
  h2 { font-size: 14px; font-weight: 700; margin: 0 0 4px; color: ${ACCENT}; }

  .header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid ${ACCENT}; padding-bottom: 4px; margin-bottom: 8px; }
  .h-title { font-size: 19px; font-weight: 700; }
  .h-sub { font-size: 13px; }
  .note { font-size: 13px; margin-bottom: 8px; font-style: normal; }

  .method { margin-bottom: 8px; }
  .m-steps { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 3px; }
  .m-step { white-space: nowrap; }

  .two-col { display: flex; gap: 8px; margin-bottom: 8px; }
  .two-col > .box { flex: 1; }
  ul { margin: 0; padding-left: 18px; }
  li { margin: 3px 0; }
  .worked .ex div { margin: 2px 0; }

  .q-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .q-card { display: flex; flex-direction: column; }
  .q-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
  .q-num { font-size: 16px; font-weight: 700; color: ${ACCENT}; }
  .q-right { display: flex; align-items: center; gap: 8px; }
  .marks { font-weight: 700; }
  .difficulty { display: inline-flex; gap: 3px; align-items: center; }
  .pip { width: 9px; height: 9px; border-radius: 50%; border: 2px solid ${ACCENT}; display: inline-block; }
  .pip.on { background: ${ACCENT}; }
  .q-text { font-size: 15px; }
</style>
</head>
<body>
  <div class="sheet">
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

    <div class="q-grid">${qCards}</div>
  </div>
</body></html>`;

writeFileSync(join(__dirname, "worksheet-onepage.html"), html, "utf8");

const outPdf = join(__dirname, "Quadratic-Simultaneous-Equations-Dyslexia-OnePage.pdf");
const fileUrl = "file://" + join(__dirname, "worksheet-onepage.html");
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] });
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: "load", timeout: 60000 });
try { await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; }); } catch {}
await page.waitForTimeout(500);
await page.pdf({ path: outPdf, format: "A4", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
await browser.close();
console.log("WROTE", outPdf);
