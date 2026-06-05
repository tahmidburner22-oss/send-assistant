/**
 * build.mjs — render worksheet.json to a dyslexia-adapted PDF.
 *
 * Adaptations are a faithful port of the send-assistant repo:
 *   - client/src/lib/accessibility-profiles.ts  (dyslexia-opendyslexic profile + buildA11yProfileCss + A11Y_FONTS_HEAD_HTML)
 *   - client/src/lib/worksheetConstraints.ts     (SEND_OVERLAYS.dyslexia: 1.5x answer lines, max 5 q/page, reduced density)
 *   - client/src/lib/send-data.ts                (colorOverlays: cream #FFF8E7)
 *   - client/src/lib/worksheetPostValidator.ts   (enforceDyslexiaMarkers: method-box before first question)
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ws = JSON.parse(readFileSync(join(__dirname, "worksheet.json"), "utf8"));

// ── Repo profile: dyslexia-opendyslexic (accessibility-profiles.ts) ──────────
const PROFILE = {
  id: "dyslexia-opendyslexic",
  fontFamily: "'OpenDyslexic', 'Comic Sans MS', sans-serif",
  fontSize: 16,
  lineHeight: 1.7,
  letterSpacing: 0.04,
  wordSpacing: 0.16,
  ragged: true,
};
// SEND_OVERLAYS.dyslexia (worksheetConstraints.ts)
const OVERLAY = { extraAnswerLinesMultiplier: 1.5, maxQuestionsPerPage: 5 };
// colorOverlays.cream (send-data.ts)
const CREAM = "#FFF8E7";

// ── Faithful port of buildA11yProfileCss() for this profile ──────────────────
function buildA11yProfileCss(p) {
  const sel = `.ws-a11y-${p.id}`;
  return `
${sel} {
  font-family: ${p.fontFamily} !important;
  font-size: ${p.fontSize}px !important;
  line-height: ${p.lineHeight} !important;
  letter-spacing: ${p.letterSpacing}em !important;
  word-spacing: ${p.wordSpacing}em !important;
}
${sel} *, ${sel} *::before, ${sel} *::after {
  font-family: ${p.fontFamily} !important;
  letter-spacing: ${p.letterSpacing}em !important;
  word-spacing: ${p.wordSpacing}em !important;
}
${sel} p, ${sel} li, ${sel} td { text-align: left !important; text-justify: none !important; }
${sel} .ws-section, ${sel} .ws-section p, ${sel} .ws-section li { font-size: ${p.fontSize}px !important; }
`.trim();
}

// A11Y_FONTS_HEAD_HTML (accessibility-profiles.ts) — OpenDyslexic via jsDelivr
const FONTS_HEAD = `
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/font/css/opendyslexic.css" rel="stylesheet">
`.trim();

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nl = (s) => esc(s).replace(/\n/g, "<br>");

// Ruled answer lines: base lines x 1.5 overlay multiplier (rounded up).
function answerLines(section) {
  const base = Number(section.answerLines) || (Number(section.marks) ? Number(section.marks) + 1 : 4);
  const n = Math.ceil(base * OVERLAY.extraAnswerLinesMultiplier);
  return `<div class="answer-space" aria-label="answer space">${
    Array.from({ length: n }, () => `<div class="rule-line"></div>`).join("")
  }</div>`;
}

function renderSection(s) {
  const t = String(s.type || "");
  if (t === "cover") {
    return `<section class="ws-section cover">
      <h1>${esc(s.title)}</h1>
      <div class="cover-meta">${nl(s.content)}</div>
    </section>`;
  }
  if (t === "method-box") {
    const [head, ...rest] = String(s.content).split("\n");
    const items = rest.filter((l) => l.trim().startsWith("- ")).map((l) => `<li>${esc(l.replace(/^-\s*/, ""))}</li>`).join("");
    return `<section class="ws-section method-box">
      <h2>📋 ${esc(s.title)}</h2>
      <p class="method-head">${esc(head)}</p>
      <ol class="method-list">${items}</ol>
    </section>`;
  }
  if (t === "learning-objective") {
    return `<section class="ws-section objective"><h2>🎯 ${esc(s.title)}</h2><p>${nl(s.content)}</p></section>`;
  }
  if (t === "worked-example") {
    return `<section class="ws-section worked"><h2>✏️ ${esc(s.title)}</h2><pre class="example">${esc(s.content)}</pre></section>`;
  }
  if (t === "answers") {
    return `<section class="ws-section answers"><h2>✅ ${esc(s.title)}</h2><pre class="example">${esc(s.content)}</pre></section>`;
  }
  // questions
  const mark = s.marks ? `<span class="marks">[${esc(s.marks)} mark${s.marks === 1 ? "" : "s"}]</span>` : "";
  return `<section class="ws-section question">
    <div class="q-head"><h3>${esc(s.title)}</h3>${mark}</div>
    <div class="q-body">${nl(s.content)}</div>
    ${answerLines(s)}
  </section>`;
}

// Insert a page break after every N questions (maxQuestionsPerPage).
const sections = ws.sections || [];
let qCount = 0;
const body = sections
  .map((s) => {
    const isQ = String(s.type || "").startsWith("q-");
    let html = renderSection(s);
    if (isQ) {
      qCount++;
      if (qCount % OVERLAY.maxQuestionsPerPage === 0) html += `<div class="page-break"></div>`;
    }
    return html;
  })
  .join("\n");

const adaptations = (ws.metadata?.adaptationsApplied || []).map((a) => `<li>${esc(a)}</li>`).join("");

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
${FONTS_HEAD}
<style>
  @page { size: A4; margin: 16mm 16mm 18mm 16mm; }
  html, body { margin: 0; padding: 0; background: ${CREAM}; }
  body { color: #1a1a1a; }
  .sheet { background: ${CREAM}; padding: 4mm; }
  /* base profile CSS (scoped) */
  ${buildA11yProfileCss(PROFILE)}
  /* reduced density + layout */
  .ws-section { background: #fffdf6; border: 1px solid #e7dcc0; border-radius: 10px; padding: 16px 18px; margin: 0 0 20px 0; break-inside: avoid; }
  h1 { font-size: 26px !important; margin: 0 0 10px; color: #5b3fa8; }
  h2 { font-size: 19px !important; margin: 0 0 10px; color: #5b3fa8; }
  h3 { font-size: 17px !important; margin: 0; color: #333; }
  .cover { text-align: left; border: 2px solid #5b3fa8; background: #fffdf6; }
  .cover-meta { margin-top: 8px; }
  .badge { display:inline-block; background:#5b3fa8; color:#fff; border-radius:6px; padding:3px 9px; font-size:13px !important; margin-right:6px; }
  .objective { border-left: 6px solid #5b3fa8; }
  .method-box { background: #f3eefc; border: 2px dashed #7c5cd6; }
  .method-head { margin: 0 0 8px; font-weight: 700; }
  .method-list { margin: 0; padding-left: 22px; }
  .method-list li { margin: 7px 0; }
  .worked .example, .answers .example { white-space: pre-wrap; background:#fffaf0; border:1px solid #e7dcc0; border-radius:8px; padding:12px 14px; margin:0; }
  .q-head { display:flex; justify-content:space-between; align-items:baseline; gap:12px; }
  .marks { color:#7c5cd6; font-weight:700; white-space:nowrap; }
  .q-body { margin: 10px 0 14px; }
  .answer-space { margin-top: 6px; }
  .rule-line { height: 0; border-bottom: 1.5px solid #cbb98e; margin: 16px 0; }  /* 1.5x spaced answer lines */
  .answers { border: 2px solid #2e7d32; background:#f3faf3; }
  .page-break { break-after: page; }
  .header-note { font-size: 12px !important; color:#6b6150; margin: 0 0 14px; }
</style>
</head>
<body>
  <div class="sheet ws-a11y-${PROFILE.id}">
    <p class="header-note">SEND profile: Dyslexia (OpenDyslexic) · Colour overlay: Cream #FFF8E7 · ${esc(ws.metadata?.examBoard)} ${esc(ws.metadata?.tier)} · Grade ${esc(ws.metadata?.gradeBand)}</p>
    ${body}
    <section class="ws-section" style="border-style:dashed;">
      <h2>♿ Dyslexia adaptations applied to this booklet</h2>
      <ul>${adaptations}</ul>
      <p style="font-size:12px !important; color:#6b6150;">${esc(ws.metadata?.provenance)}</p>
    </section>
  </div>
</body></html>`;

writeFileSync(join(__dirname, "worksheet.adapted.html"), html, "utf8");

const outPdf = join(__dirname, "Quadratic-Simultaneous-Equations-Dyslexia-Adapted.pdf");
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
// ensure web fonts are fully loaded before printing
await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });
await page.pdf({
  path: outPdf,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", bottom: "18mm", left: "16mm", right: "16mm" },
});
await browser.close();
console.log("WROTE", outPdf);
