/**
 * build.mjs — render worksheet.json to a dyslexia-adapted PDF.
 *
 * Layout:
 *   - Full-bleed cream overlay covering the whole page, black text.
 *   - Every section sits in an outlined box: coloured border, NO fill
 *     (the cream overlay shows through).
 *   - Page 1: small header + what you need to be able to do + common
 *     mistakes + method steps + worked example (all on one page).
 *   - One question per page, difficulty increasing Q1 -> Q8.
 *   - Two answer lines (x and y) in the bottom-right of each question page.
 *   - A mini method-reminder strip repeats at the bottom of every question
 *     page (working-memory support).
 *   - A "how to start" worked frame appears on Q1-Q2 and fades out after.
 *   - Self-reflection page, then teacher key (incl. adaptations made).
 *
 * Dyslexia adaptations port the repo's dyslexia-opendyslexic profile
 * (client/src/lib/accessibility-profiles.ts) + cream overlay (send-data.ts).
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ws = JSON.parse(readFileSync(join(__dirname, "worksheet.json"), "utf8"));

const CREAM = ws.metadata?.colorOverlayHex || "#FFF8E7";
const ACCENT = "#5b3fa8";                 // coloured border for the outlined boxes
const FONT = "'OpenDyslexic', 'Comic Sans MS', sans-serif";

const FONTS_HEAD = `
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/font/css/opendyslexic.css" rel="stylesheet">
`.trim();

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nl = (s) => esc(s).replace(/\n/g, "<br>");

function difficultyPips(level) {
  const n = Math.max(1, Math.min(5, Number(level) || 1));
  let pips = "";
  for (let i = 1; i <= 5; i++) pips += `<span class="pip ${i <= n ? "on" : ""}"></span>`;
  return `<span class="difficulty" title="Difficulty ${n} of 5">${pips}</span>`;
}

// Compact, full-width method reminder for the bottom of each question page.
const reminderItems = (ws.methodReminder || []).map((s) => `<span class="rem-step">${esc(s)}</span>`).join("");
const reminderStrip = `
  <div class="reminder box">
    <span class="rem-title">Remember the method:</span>
    <div class="rem-steps">${reminderItems}</div>
  </div>`;

const intro = ws.intro || {};
const introPage = `
<section class="page intro">
  <div class="small-header box">
    <div class="sh-title">${esc(intro.header)}</div>
    <div class="sh-sub">${esc(intro.subheader)}</div>
    <div class="sh-name">${esc(intro.nameLine)}</div>
  </div>

  <div class="block box">
    <h2>What you need to be able to do</h2>
    <p>${nl(intro.objective)}</p>
  </div>

  <div class="block box">
    <h2>Common mistakes to avoid</h2>
    <ul>${(intro.commonMistakes || []).map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
  </div>

  <div class="block box">
    <h2>Method steps</h2>
    <ol class="steps">${(intro.methodSteps || []).map((m) => `<li>${esc(m)}</li>`).join("")}</ol>
  </div>

  <div class="block box worked">
    <h2>Worked example</h2>
    <div class="example">${(intro.workedExample || []).map((l) => `<div>${esc(l)}</div>`).join("")}</div>
  </div>
</section>`;

const questionPages = (ws.questions || [])
  .map((q) => {
    const frame =
      Array.isArray(q.frame) && q.frame.length
        ? `<div class="frame box">
             <div class="frame-title">How to start</div>
             <ol class="frame-steps">${q.frame.map((f) => `<li>${esc(f)}</li>`).join("")}</ol>
           </div>`
        : "";
    return `
<section class="page question">
  <div class="q-top">
    <div class="q-meta">
      <span class="q-num">Question ${esc(q.number)} of ${ws.questions.length}</span>
      <span class="q-right">${q.marks ? `<span class="marks">[${esc(q.marks)} mark${q.marks === 1 ? "" : "s"}]</span>` : ""}${difficultyPips(q.difficulty)}</span>
    </div>
    <div class="q-text box">${nl(q.content)}</div>
    ${frame}
  </div>
  <div class="q-answer">
    <div class="ans-row"><span class="ans-label">x =</span><span class="ans-line"></span></div>
    <div class="ans-row"><span class="ans-label">y =</span><span class="ans-line"></span></div>
  </div>
  ${reminderStrip}
</section>`;
  })
  .join("\n");

const sr = ws.selfReflection || {};
const reflectionPage = `
<section class="page reflect">
  <div class="small-header box"><div class="sh-title">${esc(sr.title)}</div></div>
  <div class="block box">
    <p class="confidence-q">${esc(sr.confidencePrompt)}</p>
    <div class="confidence">${(sr.confidenceOptions || []).map((o) => `<span class="opt"><span class="tick"></span>${esc(o)}</span>`).join("")}</div>
  </div>
  ${(sr.prompts || [])
    .map(
      (p) => `<div class="block box reflect-prompt">
    <p>${esc(p)}</p>
    <div class="write-line"></div>
    <div class="write-line"></div>
  </div>`
    )
    .join("")}
</section>`;

const ans = ws.answers || {};
const adaptations = ws.metadata?.adaptationsApplied || [];
const answerPage = `
<section class="page key">
  <div class="small-header box"><div class="sh-title">${esc(ans.title)}</div></div>
  <div class="block box">
    <h2>Answers</h2>
    <ol class="key-list">${(ans.rows || []).map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
  </div>
  <div class="block box">
    <h2>SEND adaptations made on this worksheet</h2>
    <ul class="adapt-list">${adaptations.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
  </div>
</section>`;

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
${FONTS_HEAD}
<style>
  @page { size: A4; margin: 0; }              /* full-bleed: cream reaches the edges */
  html, body { margin: 0; padding: 0; background: ${CREAM}; }

  .page {
    box-sizing: border-box;
    width: 210mm;
    min-height: 296mm;                        /* fill the A4 page */
    background: ${CREAM};                     /* cream overlay on the whole page */
    color: #000000;                           /* black text */
    padding: 8mm 10mm;
    display: flex;
    flex-direction: column;
    font-family: ${FONT};
    font-size: 16px;
    line-height: 1.7;
    letter-spacing: 0.04em;
    word-spacing: 0.16em;
  }
  .page *, .page *::before, .page *::after {
    font-family: ${FONT};
    letter-spacing: 0.04em;
    word-spacing: 0.16em;
  }
  .page + .page { break-before: page; }
  .page p, .page li, .page div { text-align: left; }

  /* outlined box: coloured border, NO fill (cream shows through) */
  .box {
    border: 2px solid ${ACCENT};
    border-radius: 10px;
    background: transparent;
    padding: 8px 12px;
  }
  .intro .box { margin-bottom: 9px; }

  .small-header .sh-title { font-size: 20px; font-weight: 700; }
  .sh-sub { font-size: 14px; }
  .sh-name { font-size: 14px; margin-top: 6px; }

  h2 { font-size: 17px; font-weight: 700; margin: 0 0 5px; color: ${ACCENT}; }
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
  .pip { width: 11px; height: 11px; border-radius: 50%; border: 2px solid ${ACCENT}; display: inline-block; }
  .pip.on { background: ${ACCENT}; }
  .q-text { font-size: 18px; }

  .frame { margin-top: 14px; border-style: dashed; }
  .frame-title { font-weight: 700; color: ${ACCENT}; margin-bottom: 4px; }
  .frame-steps li { margin: 5px 0; }

  .q-answer { margin-top: auto; align-self: flex-end; width: 78mm; }  /* bottom-right */
  .ans-row { display: flex; align-items: flex-end; gap: 10px; margin-top: 16px; }
  .ans-label { font-weight: 700; white-space: nowrap; font-size: 18px; }
  .ans-line { flex: 1; border-bottom: 2px solid #000; height: 26px; }

  /* method reminder strip (bottom of each question page) */
  .reminder { margin-top: 16px; }
  .rem-title { font-weight: 700; color: ${ACCENT}; }
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
  .key-list li, .adapt-list li { margin: 6px 0; }
</style>
</head>
<body>
  ${introPage}
  ${questionPages}
  ${reflectionPage}
  ${answerPage}
</body></html>`;

writeFileSync(join(__dirname, "worksheet.adapted.html"), html, "utf8");

const outPdf = join(__dirname, "Quadratic-Simultaneous-Equations-Dyslexia-Adapted.pdf");
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });
await page.pdf({ path: outPdf, format: "A4", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
await browser.close();
console.log("WROTE", outPdf);
