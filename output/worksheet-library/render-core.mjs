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

// Detect sub-parts like "a)", "(a)", "b)" in order so each gets its own answer line.
function extractParts(content) {
  const found = [...String(content).matchAll(/(?:^|\s|\()([a-h])\)/g)].map((m) => m[1]);
  const seq = 'abcdefgh'.split('');
  const seen = [];
  for (const c of found) if (!seen.includes(c)) seen.push(c);
  const parts = [];
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] === seq[i]) parts.push(seen[i]);
    else break;
  }
  return parts;
}

// One ruled answer line per sub-part (a)/(b)/..., or a single "Answer" line.
function answerBlock(content) {
  const parts = extractParts(content);
  let h = `<div class="answer-block"><div class="ab-title">Answer${parts.length ? 's' : ''}</div>`;
  if (parts.length) {
    for (const p of parts)
      h += `<div class="ans-row"><span class="lbl">(${p})</span><span class="eq">=</span><span class="rule"></span></div>`;
  } else {
    h += `<div class="ans-row"><span class="lbl">Answer</span><span class="eq">=</span><span class="rule"></span></div>`;
  }
  return h + `</div>`;
}

// A simple worked visual example per topic, drawn as scalable SVG.
function topicVisual(ws) {
  const topic = ws.metadata?.topic || '';
  const sub = (ws.metadata?.subtopic || '').toLowerCase();
  const F = 'font-family="DejaVu Sans, Arial, sans-serif"';
  let svg = '', cap = '';
  if (/surd/i.test(topic)) {
    cap = 'Simplifying a surd: split off the largest square factor.';
    svg = `<svg viewBox="0 0 520 150" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="45" ${F} font-size="26">&#8730;72</text>
      <line x1="95" y1="38" x2="150" y2="38" stroke="#16a34a" stroke-width="2"/>
      <text x="160" y="45" ${F} font-size="26">= &#8730;(36 &#215; 2)</text>
      <text x="160" y="95" ${F} font-size="26">= &#8730;36 &#215; &#8730;2</text>
      <text x="160" y="140" ${F} font-size="26" font-weight="700">= 6&#8730;2</text>
      <circle cx="300" cy="86" r="3" fill="#16a34a"/><circle cx="360" cy="86" r="3" fill="#16a34a"/>
    </svg>`;
  } else if (/indices|standard form/i.test(topic)) {
    if (/standard form/i.test(sub)) {
      cap = 'Standard form: A &#215; 10&#8319; with 1 &#8804; A &lt; 10.';
      svg = `<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="55" ${F} font-size="24">5 600 000</text>
        <text x="200" y="55" ${F} font-size="24">=  5.6 &#215; 10</text>
        <text x="372" y="40" ${F} font-size="16" font-weight="700">6</text>
        <path d="M30 70 q70 40 150 0" fill="none" stroke="#16a34a" stroke-width="2"/>
        <text x="70" y="120" ${F} font-size="13" fill="#15803d">move the point 6 places left</text>
      </svg>`;
    } else {
      cap = 'Laws of indices: multiply &#8594; add the powers.';
      svg = `<svg viewBox="0 0 520 120" xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="55" ${F} font-size="24">x&#179; &#215; x&#8309;</text>
        <text x="150" y="55" ${F} font-size="24">= x&#179;&#8314;&#8309;</text>
        <text x="320" y="55" ${F} font-size="24" font-weight="700">= x&#8312;</text>
        <text x="40" y="100" ${F} font-size="13" fill="#15803d">same base &#8594; add indices</text>
      </svg>`;
    }
  } else if (/linear equation/i.test(topic)) {
    cap = 'An equation balances: do the same to both sides to keep it level.';
    svg = `<svg viewBox="0 0 520 150" xmlns="http://www.w3.org/2000/svg">
      <text x="20" y="50" ${F} font-size="24">2x + 3 = 11</text>
      <text x="20" y="90" ${F} font-size="20" fill="#15803d">&#8722;3 both sides &#8594; 2x = 8</text>
      <text x="20" y="125" ${F} font-size="20" fill="#15803d">&#247;2 both sides &#8594; x = 4</text>
      <line x1="300" y1="120" x2="500" y2="120" stroke="#111" stroke-width="3"/>
      <polygon points="400,120 380,150 420,150" fill="#111"/>
      <rect x="312" y="92" width="56" height="26" fill="#bbf7d0" stroke="#15803d"/>
      <rect x="432" y="92" width="56" height="26" fill="#bbf7d0" stroke="#15803d"/>
      <text x="322" y="111" ${F} font-size="14">2x+3</text>
      <text x="450" y="111" ${F} font-size="14">11</text>
    </svg>`;
  } else if (/inequalit/i.test(topic)) {
    cap = 'x &lt; 5 on a number line: open circle at 5, shade everything to the left.';
    svg = `<svg viewBox="0 0 520 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="60" x2="500" y2="60" stroke="#111" stroke-width="2"/>
      <polygon points="500,60 488,54 488,66" fill="#111"/>
      <polygon points="20,60 32,54 32,66" fill="#111"/>
      <line x1="20" y1="60" x2="380" y2="60" stroke="#16a34a" stroke-width="5"/>
      <circle cx="380" cy="60" r="8" fill="#fff" stroke="#16a34a" stroke-width="3"/>
      <g ${F} font-size="14" fill="#333">
        <text x="56" y="86">2</text><text x="136" y="86">3</text>
        <text x="216" y="86">4</text><text x="372" y="86">5</text><text x="452" y="86">6</text>
      </g>
      <line x1="60" y1="55" x2="60" y2="65" stroke="#111"/><line x1="140" y1="55" x2="140" y2="65" stroke="#111"/>
      <line x1="220" y1="55" x2="220" y2="65" stroke="#111"/><line x1="300" y1="55" x2="300" y2="65" stroke="#111"/>
      <line x1="380" y1="55" x2="380" y2="65" stroke="#111"/><line x1="460" y1="55" x2="460" y2="65" stroke="#111"/>
    </svg>`;
  } else if (/sequence/i.test(topic)) {
    cap = 'Arithmetic sequence: a constant difference is added each step.';
    svg = `<svg viewBox="0 0 520 120" xmlns="http://www.w3.org/2000/svg">
      <g ${F} font-size="24" font-weight="700">
        <text x="20" y="70">3</text><text x="150" y="70">7</text>
        <text x="280" y="70">11</text><text x="410" y="70">15</text>
      </g>
      <path d="M32 50 q55 -28 110 0" fill="none" stroke="#16a34a" stroke-width="2"/>
      <path d="M162 50 q55 -28 110 0" fill="none" stroke="#16a34a" stroke-width="2"/>
      <path d="M298 50 q55 -28 110 0" fill="none" stroke="#16a34a" stroke-width="2"/>
      <g ${F} font-size="14" fill="#15803d">
        <text x="78" y="30">+4</text><text x="208" y="30">+4</text><text x="344" y="30">+4</text>
      </g>
      <text x="20" y="105" ${F} font-size="13" fill="#15803d">nth term = 4n &#8722; 1</text>
    </svg>`;
  } else if (/fraction|percent|decimal/i.test(topic)) {
    cap = 'One half shown three equivalent ways.';
    svg = `<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="20" width="240" height="40" fill="#bbf7d0" stroke="#15803d"/>
      <rect x="130" y="20" width="120" height="40" fill="#16a34a"/>
      <text x="270" y="48" ${F} font-size="22">&#189;  =  0.5  =  50%</text>
      <text x="10" y="95" ${F} font-size="13" fill="#15803d">shaded part = 1 of 2 equal parts = half</text>
    </svg>`;
  }
  if (!svg) return '';
  return `<div class="visual"><div class="box-title">Visual Example</div>${svg}<div class="vcap">${cap}</div></div>`;
}


const CSS = `
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { font-family: "DejaVu Sans", "Noto Sans", Arial, sans-serif; color: #111; background:#fff; }
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
.answer-block { margin:3mm 0 2mm; }
.answer-block .ab-title { font-size:8.5pt; font-weight:800; text-transform:uppercase; letter-spacing:.4px; color:#444; margin-bottom:1.5mm; }
.ans-row { display:flex; align-items:flex-end; font-size:11pt; margin-bottom:2.6mm; }
.ans-row .lbl { min-width:12mm; font-weight:700; }
.ans-row .eq { margin:0 2mm; }
.ans-row .rule { flex:1; border-bottom:1pt solid #111; height:5mm; }
.visual { margin-bottom:3mm; background:#f0fdf4; border:.75pt solid #86c79a; border-left:3pt solid #16a34a; padding:2mm 3mm; }
.visual .box-title { color:#15803d; font-size:8pt; }
.visual svg { display:block; width:70%; height:auto; max-height:28mm; margin:0 auto; }
.visual .vcap { font-size:7.5pt; font-style:italic; color:#3f6b4e; margin-top:1mm; text-align:center; }
.onepage .bk-title { font-size:16pt; margin-bottom:1mm; }
.onepage .bk-sub { font-size:9.5pt; margin:0 0 2mm; }
.onepage .objective { font-size:9pt; padding:2mm; margin-bottom:2mm; }
.onepage .mistakes { margin-bottom:2mm; } .onepage .mistakes li { font-size:8.5pt; margin-bottom:.8mm; }
.onepage .method { margin-bottom:2mm; } .onepage .method li { font-size:8.5pt; margin-bottom:.8mm; }
.onepage .worked { padding:2mm; margin-bottom:2mm; } .onepage .worked p { font-size:8.5pt; line-height:1.4; }
.onepage .ls-grid { column-count:2; column-gap:6mm; column-rule:.5pt solid #e0e0e0; }
.onepage .ls-q { break-inside:avoid; margin-bottom:3mm; padding-bottom:2mm; border-bottom:.5pt solid #e0e0e0; }
.onepage .ls-q-h { font-weight:800; font-size:9.5pt; margin-bottom:.5mm; }
.onepage .ls-q-h .m { font-weight:400; color:#555; font-size:8.5pt; }
.onepage .ls-q-c { font-size:8.5pt; line-height:1.35; white-space:pre-wrap; }
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


function introBlocks(ws, landscape) {
  const intro = ws.intro;
  let h = `<div class="bk-title">${esc(intro.header)}</div>`;
  h += `<div class="bk-sub">${esc(intro.subheader)}</div>`;
  if (!landscape && intro.nameLine) h += `<div class="bk-name">${esc(intro.nameLine)}</div>`;
  if (landscape && intro.note) h += `<div class="ls-note">${esc(intro.note)}</div>`;
  if (intro.objective) h += `<div class="objective">${esc(intro.objective)}</div>`;
  h += topicVisual(ws);
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
  h += answerBlock(q.content);
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

// --- Landscape 2-page layout (matching reference format) ---
function landscapeIntroPage(ws) {
  const intro = ws.intro || {};
  const methodItems = (intro.methodSteps || []).map((s) => `<span class="ls-m-step">${esc(s.replace(/^Step\s*\d+:\s*/i, '').replace(/^\d+\s+/, ''))}</span>`).join('');
  const mistakes = (intro.commonMistakes || []).map((m) => `<li>${esc(m)}</li>`).join('');
  const worked = (intro.workedExample || []).map((l) => `<div>${esc(l)}</div>`).join('');
  const visual = topicVisual(ws);
  const visualAidText = intro.visualAid ? `<p class="ls-cap">${esc(intro.visualAid)}</p>` : '';

  return `<section class="ls-page ls-intro">
    <div class="ls-header">
      <span class="ls-h-title">${esc(intro.header)}</span>
      <span class="ls-h-sub">${esc(intro.subheader)}</span>
    </div>
    <div class="ls-note">${esc(intro.note || '')}</div>
    <div class="ls-method ls-box">
      <h2>Method</h2>
      <div class="ls-m-steps">${methodItems}</div>
    </div>
    <div class="ls-lower">
      <div class="ls-box ls-mistakes">
        <h2>Common mistakes</h2>
        <ul>${mistakes}</ul>
      </div>
      <div class="ls-box ls-worked">
        <h2>Worked example</h2>
        <div class="ls-ex">${worked}</div>
      </div>
      <div class="ls-box ls-visual">
        <h2>Visual aid</h2>
        ${visual}
        ${visualAidText}
      </div>
    </div>
  </section>`;
}

function landscapeQuestionsPage(ws) {
  const qCards = (ws.questions || []).map((q) => {
    let pipsHtml = '';
    const n = Math.max(1, Math.min(5, Number(q.difficulty) || 1));
    for (let i = 1; i <= 5; i++) pipsHtml += `<span class="ls-pip ${i <= n ? 'on' : ''}"></span>`;
    return `<div class="ls-q-card ls-box">
      <div class="ls-q-head">
        <span class="ls-q-num">Q${esc(q.number)} of ${ws.questions.length}</span>
        <span class="ls-q-right">${q.marks ? `<span class="ls-marks">[${esc(q.marks)}]</span>` : ''}<span class="ls-difficulty">${pipsHtml}</span></span>
      </div>
      <div class="ls-q-text">${esc(q.content)}</div>
    </div>`;
  }).join('');

  return `<section class="ls-page ls-questions">
    <div class="ls-header">
      <span class="ls-h-title">Questions</span>
      <span class="ls-h-sub">${esc(ws.landscape?.questionsSubheader || ws.intro?.note || 'Show working in your workbook')}</span>
    </div>
    <div class="ls-q-grid">${qCards}</div>
  </section>`;
}

const CSS_LANDSCAPE = `
  @page { size: A4 landscape; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .ls-page {
    box-sizing: border-box;
    width: 297mm;
    height: 209.7mm;
    background: #fff;
    color: #111;
    padding: 12mm 14mm;
    display: flex;
    flex-direction: column;
    font-family: "DejaVu Sans", Arial, sans-serif;
    font-size: 17px;
    line-height: 1.5;
    overflow: hidden;
  }
  .ls-page + .ls-page { break-before: page; }
  .ls-box {
    border: 1.4px solid #333;
    border-radius: 8px;
    background: transparent;
    padding: 12px 16px;
  }
  .ls-page h2 { font-size: 18px; font-weight: 700; margin: 0 0 8px; color: #111; }
  .ls-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2.4px solid #333; padding-bottom: 8px; margin-bottom: 12px; flex: 0 0 auto; }
  .ls-h-title { font-size: 26px; font-weight: 700; }
  .ls-h-sub { font-size: 15px; }
  .ls-note { font-size: 15px; margin-bottom: 14px; flex: 0 0 auto; }

  /* intro page */
  .ls-method { margin-bottom: 14px; flex: 0 0 auto; }
  .ls-m-steps { display: flex; flex-wrap: wrap; gap: 10px 30px; margin-top: 6px; font-size: 17px; }
  .ls-m-step { white-space: nowrap; }
  .ls-lower { display: flex; gap: 14px; flex: 1 1 auto; align-items: stretch; min-height: 0; }
  .ls-lower > .ls-box { display: flex; flex-direction: column; min-height: 0; }
  .ls-mistakes { flex: 1.15; }
  .ls-worked   { flex: 1.25; }
  .ls-visual   { flex: 1.05; }
  .ls-mistakes ul { margin: 0; padding-left: 22px; }
  .ls-mistakes li { margin: 9px 0; }
  .ls-worked .ls-ex { display: flex; flex-direction: column; justify-content: space-between; flex: 1; }
  .ls-worked .ls-ex div { margin: 4px 0; font-size: 16px; }
  .ls-visual .visual { margin: 0; border: none; background: none; padding: 0; }
  .ls-visual .visual svg { width: 100%; max-height: 100%; }
  .ls-visual .visual .vcap { display: none; }
  .ls-cap { font-size: 14px; margin: 8px 0 0; color: #333; }

  /* questions page: 2x4 grid filling the page */
  .ls-questions .ls-q-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(4, 1fr);
    gap: 18px 26px;
    flex: 1 1 auto;
    min-height: 0;
  }
  .ls-q-card { display: flex; flex-direction: column; justify-content: center; }
  .ls-q-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .ls-q-num { font-size: 19px; font-weight: 700; color: #111; }
  .ls-q-right { display: flex; align-items: center; gap: 12px; }
  .ls-marks { font-weight: 700; font-size: 17px; }
  .ls-difficulty { display: inline-flex; gap: 5px; align-items: center; }
  .ls-pip { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #333; display: inline-block; }
  .ls-pip.on { background: #333; }
  .ls-q-text { font-size: 21px; white-space: pre-wrap; }
`;

export function buildHtml(ws) {
  let body = '';
  if (isLandscapeWs(ws)) {
    // Two landscape A4 pages: intro + questions grid (matching reference format)
    body = landscapeIntroPage(ws) + landscapeQuestionsPage(ws);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS_LANDSCAPE}</style></head><body>${body}</body></html>`;
  } else {
    body += `<div class="page">${introBlocks(ws, false)}</div>`;
    ws.questions.forEach((q, i) => { body += questionPage(ws, q, i); });
    body += reflectionPage(ws);
    body += answersPage(ws);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}${CSS2}</style></head><body>${body}</body></html>`;
  }
}
