/**
 * render-core.mjs — shared HTML builder for worksheet PDFs/PNGs.
 * MathsGenie-style exam booklet, matching the structure described in each
 * worksheet's metadata.layout.
 *
 * BOOKLET (portrait): p1 intro; one question per page (never grouped) with
 *   number left + marks right, a "How to start" frame box on Q1 & Q2, a large
 *   ruled working area, an "Answer = ___" line bottom-right, and a method
 *   reminder strip at the very bottom; then self-reflection; then teacher key.
 * LANDSCAPE: p1 intro (+ visual aid); p2 all questions in a 2-column grid.
 */

export function isLandscapeWs(ws) {
  return ws.metadata?.layout?.orientation === 'landscape';
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


const CSS = `
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { font-family: Arial, Helvetica, sans-serif; color: #111; background:#fff; }
.page { width:210mm; height:297mm; padding:11mm 12mm; page-break-after:always;
  overflow:hidden; display:flex; flex-direction:column; background:#fff; }
.page.landscape { width:297mm; height:210mm; }
.page:last-child { page-break-after:auto; }

.bk-title { font-size:19pt; font-weight:800; }
.bk-sub { font-size:10.5pt; color:#555; margin:1mm 0 3mm; }
.bk-name { font-size:9.5pt; border:0.75pt solid #222; padding:2.5mm 3mm; margin-bottom:4mm; }
.box-title { font-size:9.5pt; font-weight:800; text-transform:uppercase; letter-spacing:.4px; margin-bottom:1.5mm; }
.objective { font-size:10pt; line-height:1.45; background:#eef4ff; border-left:3pt solid #1d4ed8; padding:3mm; margin-bottom:4mm; }
.mistakes { margin-bottom:4mm; } .mistakes ul { list-style:none; }
.mistakes li { font-size:9.5pt; line-height:1.4; padding-left:5mm; position:relative; margin-bottom:1.2mm; }
.mistakes li::before { content:"\\2717"; position:absolute; left:0; color:#c0392b; font-weight:700; }
.method { margin-bottom:4mm; } .method ol { list-style:none; counter-reset:m; }
.method li { font-size:9.5pt; line-height:1.4; padding-left:7mm; position:relative; margin-bottom:1.2mm; counter-increment:m; }
.method li::before { content:counter(m); position:absolute; left:0; top:0; width:4.5mm; height:4.5mm;
  background:#1d4ed8; color:#fff; border-radius:50%; font-size:8pt; font-weight:700; text-align:center; line-height:4.5mm; }
.worked { background:#fffaf0; border:.75pt solid #e0b15a; border-left:3pt solid #d97706; padding:3mm; }
.worked .box-title { color:#92600a; } .worked p { font-size:9.5pt; line-height:1.5; }
`;


const CSS2 = `
.q-top { display:flex; align-items:flex-start; gap:4mm; border-bottom:1.5pt solid #111; padding-bottom:2.5mm; }
.q-num { font-size:15pt; font-weight:800; min-width:8mm; }
.q-text { flex:1; font-size:11.5pt; line-height:1.55; white-space:pre-wrap; }
.q-marks { font-size:10pt; color:#333; white-space:nowrap; }
.frame { margin-top:3mm; background:#f0f7ff; border:.75pt dashed #6aa3e8; border-radius:1.5mm; padding:3mm; }
.frame .box-title { color:#1e40af; font-size:8.5pt; } .frame ul { list-style:none; }
.frame li { font-size:9pt; line-height:1.45; color:#1e3a8a; padding-left:4mm; position:relative; margin-bottom:.6mm; }
.frame li::before { content:"\\2192"; position:absolute; left:0; }
.work { flex:1 1 auto; margin-top:3mm; min-height:0;
  background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 8.4mm,#e9ebee 8.4mm,#e9ebee 8.5mm); }
.answer-line { text-align:right; font-size:10.5pt; margin:2mm 0; }
.answer-line .rule { display:inline-block; width:55mm; border-bottom:1pt solid #111; margin-left:2mm; }
.method-strip { border:.75pt solid #cbd2da; background:#f4f6f8; border-radius:1.5mm; padding:2mm 3mm; font-size:8pt; color:#2a2a2a; }
.method-strip b { text-transform:uppercase; letter-spacing:.3px; margin-right:2mm; }
.method-strip .sep { color:#9aa3ad; margin:0 1.5mm; }
.rf-title,.an-title { font-size:15pt; font-weight:800; border-bottom:1.5pt solid #111; padding-bottom:2mm; margin-bottom:4mm; }
.rf-prompt { font-size:10.5pt; font-weight:600; margin-bottom:3mm; }
.rf-opts { display:flex; gap:4mm; margin-bottom:7mm; }
.rf-opt { border:.75pt solid #555; border-radius:1mm; padding:1.5mm 3.5mm; font-size:10pt; }
.rf-q { font-size:10.5pt; margin-bottom:3mm; }
.rf-rule { display:block; border-bottom:.5pt solid #bbb; height:7mm; }
.an-row { font-size:9.5pt; line-height:1.4; padding:1.6mm 0; border-bottom:.5pt solid #e6e8eb; }
.ls-grid { column-count:2; column-gap:8mm; column-rule:.5pt solid #e0e0e0; flex:1; }
.ls-q { break-inside:avoid; margin-bottom:4mm; padding-bottom:3mm; border-bottom:.5pt solid #e0e0e0; }
.ls-q-h { font-weight:800; font-size:10.5pt; margin-bottom:1mm; }
.ls-q-h .m { font-weight:400; color:#555; font-size:9pt; }
.ls-q-c { font-size:9.5pt; line-height:1.45; white-space:pre-wrap; }
.ls-note { font-size:9.5pt; font-style:italic; color:#555; margin-bottom:3mm; }
.visual-aid { margin-top:4mm; background:#f0fdf4; border:.75pt solid #86c79a; border-left:3pt solid #16a34a; padding:3mm; font-size:9pt; line-height:1.45; }
.visual-aid .box-title { color:#15803d; }
`;


function introBlocks(intro, landscape) {
  let h = `<div class="bk-title">${esc(intro.header)}</div>`;
  h += `<div class="bk-sub">${esc(intro.subheader)}</div>`;
  if (!landscape && intro.nameLine) h += `<div class="bk-name">${esc(intro.nameLine)}</div>`;
  if (landscape && intro.note) h += `<div class="ls-note">${esc(intro.note)}</div>`;
  if (intro.objective) h += `<div class="objective">${esc(intro.objective)}</div>`;
  if (intro.commonMistakes?.length) {
    h += `<div class="mistakes"><div class="box-title">Common Mistakes</div><ul>`;
    for (const m of intro.commonMistakes) h += `<li>${esc(m)}</li>`;
    h += `</ul></div>`;
  }
  if (intro.methodSteps?.length) {
    h += `<div class="method"><div class="box-title">Method</div><ol>`;
    for (const s of intro.methodSteps)
      h += `<li>${esc(s.replace(/^Step\s*\d+:\s*/i, '').replace(/^\d+\s+/, ''))}</li>`;
    h += `</ol></div>`;
  }
  if (intro.workedExample?.length) {
    h += `<div class="worked"><div class="box-title">Worked Example</div>`;
    for (const l of intro.workedExample) h += `<p>${esc(l)}</p>`;
    h += `</div>`;
  }
  if (landscape && intro.visualAid)
    h += `<div class="visual-aid"><div class="box-title">Visual Aid</div>${esc(intro.visualAid)}</div>`;
  return h;
}

function questionPage(ws, q, index) {
  const reminder = ws.methodReminder || [];
  const showFrame = index < 2 && Array.isArray(q.frame) && q.frame.length > 0;
  let h = `<div class="page">`;
  h += `<div class="q-top"><div class="q-num">${q.number}</div>`;
  h += `<div class="q-text">${esc(q.content)}</div>`;
  h += `<div class="q-marks">(${q.marks} mark${q.marks > 1 ? 's' : ''})</div></div>`;
  if (showFrame) {
    h += `<div class="frame"><div class="box-title">How to start</div><ul>`;
    for (const f of q.frame) h += `<li>${esc(f)}</li>`;
    h += `</ul></div>`;
  }
  h += `<div class="work"></div>`;
  h += `<div class="answer-line">Answer <span class="rule"></span></div>`;
  if (reminder.length) {
    h += `<div class="method-strip"><b>Method</b>`;
    h += reminder.map((s) => `${esc(s)}`).join(`<span class="sep">|</span>`);
    h += `</div>`;
  }
  return h + `</div>`;
}


function reflectionPage(ws) {
  const sr = ws.selfReflection;
  if (!sr) return '';
  let h = `<div class="page"><div class="rf-title">${esc(sr.title || 'Self-Reflection')}</div>`;
  h += `<div class="rf-prompt">${esc(sr.confidencePrompt)}</div><div class="rf-opts">`;
  for (const o of sr.confidenceOptions || []) h += `<span class="rf-opt">\u2610 ${esc(o)}</span>`;
  h += `</div>`;
  for (const p of sr.prompts || [])
    h += `<div class="rf-q">${esc(p)}<span class="rf-rule"></span><span class="rf-rule"></span></div>`;
  return h + `</div>`;
}

function answersPage(ws) {
  const a = ws.answers;
  if (!a) return '';
  let h = `<div class="page"><div class="an-title">${esc(a.title || 'Teacher Key')}</div>`;
  for (const r of a.rows || []) h += `<div class="an-row">${esc(r)}</div>`;
  return h + `</div>`;
}

function landscapeQuestions(ws) {
  let h = `<div class="page landscape">${introBlocks(ws.intro, true)}</div>`;
  h += `<div class="page landscape"><div class="ls-grid">`;
  for (const q of ws.questions) {
    h += `<div class="ls-q"><div class="ls-q-h">${q.number}. <span class="m">(${q.marks} mark${q.marks > 1 ? 's' : ''})</span></div>`;
    h += `<div class="ls-q-c">${esc(q.content)}</div></div>`;
  }
  return h + `</div></div>`;
}

export function buildHtml(ws) {
  let body = '';
  if (isLandscapeWs(ws)) {
    body = landscapeQuestions(ws);
  } else {
    body += `<div class="page">${introBlocks(ws.intro, false)}</div>`;
    ws.questions.forEach((q, i) => { body += questionPage(ws, q, i); });
    body += reflectionPage(ws);
    body += answersPage(ws);
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}${CSS2}</style></head><body>${body}</body></html>`;
}
