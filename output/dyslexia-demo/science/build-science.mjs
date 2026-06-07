/**
 * build-science.mjs — Photosynthesis (AQA GCSE Biology 4.4.1 aligned).
 *   - One-page: LANDSCAPE poster. Boxes FLEX to fill the whole page (no
 *     blank space, nothing cut off). One question carries a diagram; a hint
 *     box and an application question are included.
 *   - Booklet: PORTRAIT. Spec-aligned questions that increase in difficulty,
 *     diagrams attached to the relevant questions, hint boxes, sentence-
 *     starter framing, and a 6-mark exam-style problem-solving question.
 * Identical SEND adaptations via _send-base.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ACCENT, FONT_CSS, esc, nl, baseCss, renderPdf } from "../_send-base.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ---------- SVG diagrams (original, hand-drawn) ---------- */
const ARROW = `<defs><marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#1f5fa6"/></marker><marker id="ahk" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#000"/></marker></defs>`;

function diagram(id) {
  if (id === "plant-io") {
    let rays = "";
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; rays += `<line x1="${42 + 20 * Math.cos(a)}" y1="${42 + 20 * Math.sin(a)}" x2="${42 + 28 * Math.cos(a)}" y2="${42 + 28 * Math.sin(a)}" stroke="#000" stroke-width="2"/>`; }
    return `<svg viewBox="0 0 370 250" class="dgm" xmlns="http://www.w3.org/2000/svg">${ARROW}
      <circle cx="42" cy="42" r="18" fill="#f6c945" stroke="#000" stroke-width="2"/>${rays}
      <line x1="60" y1="56" x2="150" y2="104" stroke="#000" stroke-width="2.5" marker-end="url(#ahk)"/>
      <text x="64" y="40" font-size="13">Light energy</text>
      <line x1="20" y1="208" x2="350" y2="208" stroke="#000" stroke-width="2"/>
      <path d="M150 208 L158 238 L212 238 L220 208 Z" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="181" y="120" width="8" height="88" fill="#7a5a33" stroke="#000" stroke-width="1.5"/>
      <ellipse cx="158" cy="118" rx="26" ry="12" fill="#6bbf59" stroke="#000" stroke-width="2" transform="rotate(-22 158 118)"/>
      <ellipse cx="212" cy="108" rx="26" ry="12" fill="#6bbf59" stroke="#000" stroke-width="2" transform="rotate(20 212 108)"/>
      <line x1="345" y1="112" x2="240" y2="112" stroke="#1f5fa6" stroke-width="2.5" marker-end="url(#ah)"/>
      <text x="246" y="103" font-size="13">Carbon dioxide (CO₂) in</text>
      <line x1="150" y1="116" x2="70" y2="98" stroke="#1f5fa6" stroke-width="2.5" marker-end="url(#ah)"/>
      <text x="20" y="128" font-size="13">Oxygen (O₂) out</text>
      <line x1="185" y1="205" x2="185" y2="138" stroke="#1f5fa6" stroke-width="2.5" marker-end="url(#ah)"/>
      <text x="192" y="180" font-size="13">Water (H₂O)</text>
      <text x="214" y="150" font-size="13">Glucose made</text>
    </svg>`;
  }
  if (id === "leaf-chloroplast") {
    let chl = "";
    const spots = [[250,70],[280,92],[262,112],[296,124],[244,104],[300,86]];
    for (const [cx, cy] of spots) chl += `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="6" fill="#3f9b3f" stroke="#0c5a0c" stroke-width="1.5" transform="rotate(25 ${cx} ${cy})"/>`;
    return `<svg viewBox="0 0 370 205" class="dgm" xmlns="http://www.w3.org/2000/svg">${ARROW}
      <path d="M40 150 C40 70 120 40 150 40 C150 120 90 160 40 150 Z" fill="#6bbf59" stroke="#000" stroke-width="2"/>
      <path d="M44 148 C90 120 130 70 148 44" fill="none" stroke="#0c5a0c" stroke-width="1.6"/>
      <line x1="158" y1="96" x2="206" y2="96" stroke="#000" stroke-width="2.5" marker-end="url(#ahk)"/>
      <text x="86" y="170" font-size="13">leaf</text>
      <circle cx="272" cy="98" r="56" fill="#eaf6e6" stroke="#000" stroke-width="2"/>
      <rect x="238" y="64" width="70" height="68" rx="10" fill="none" stroke="#000" stroke-width="1.5"/>
      ${chl}
      <line x1="338" y1="60" x2="298" y2="84" stroke="#000" stroke-width="2" marker-end="url(#ahk)"/>
      <text x="332" y="52" font-size="15" font-weight="bold">A</text>
      <text x="206" y="190" font-size="13">A = green structures inside the leaf cell</text>
    </svg>`;
  }
  if (id === "limiting-factors") {
    return `<svg viewBox="0 0 330 210" class="dgm" xmlns="http://www.w3.org/2000/svg">${ARROW}
      <line x1="48" y1="20" x2="48" y2="170" stroke="#000" stroke-width="2"/>
      <line x1="48" y1="170" x2="300" y2="170" stroke="#000" stroke-width="2"/>
      <path d="M48 170 C95 170 120 70 175 58 C230 50 290 50 296 50" fill="none" stroke="#1f5fa6" stroke-width="3"/>
      <text x="150" y="46" font-size="12">rate levels off here</text>
      <text x="6" y="120" font-size="12" transform="rotate(-90 14 120)">Rate of photosynthesis</text>
      <text x="120" y="192" font-size="12">Light intensity</text>
    </svg>`;
  }
  if (id === "required-practical") {
    let bubbles = "";
    for (const [cx, cy, r] of [[214,118,4],[222,100,3],[208,86,3.5],[226,74,3],[214,60,3.5]]) bubbles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1f5fa6" stroke-width="1.6"/>`;
    return `<svg viewBox="0 0 360 210" class="dgm" xmlns="http://www.w3.org/2000/svg">${ARROW}
      <circle cx="46" cy="96" r="20" fill="#f6c945" stroke="#000" stroke-width="2"/>
      <rect x="36" y="116" width="20" height="10" fill="#888" stroke="#000" stroke-width="1.5"/>
      <text x="24" y="150" font-size="13">lamp</text>
      <line x1="68" y1="96" x2="176" y2="96" stroke="#000" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#ahk)"/>
      <text x="80" y="88" font-size="12">distance (cm)</text>
      <path d="M180 60 L180 188 L300 188 L300 60" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="182" y="78" width="116" height="108" fill="#dfeefc" stroke="none"/>
      <line x1="180" y1="78" x2="300" y2="78" stroke="#1f5fa6" stroke-width="1.5"/>
      <path d="M236 186 C228 160 248 150 240 124 C234 104 250 96 244 80" fill="none" stroke="#0c5a0c" stroke-width="3"/>
      <ellipse cx="232" cy="150" rx="8" ry="4" fill="#3f9b3f" transform="rotate(-30 232 150)"/>
      <ellipse cx="250" cy="130" rx="8" ry="4" fill="#3f9b3f" transform="rotate(30 250 130)"/>
      <text x="252" y="178" font-size="12">pondweed</text>
      ${bubbles}
      <text x="200" y="52" font-size="12">oxygen bubbles</text>
    </svg>`;
  }
  return "";
}

/* ---------- difficulty pips ---------- */
function pipsLine(level) {
  const n = Math.max(1, Math.min(5, Number(level) || 1));
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<span class="pip ${i <= n ? "on" : ""}"></span>`;
  return out;
}

/* ---------- One-page LANDSCAPE poster (boxes fill the page) ---------- */
function buildOnePage(ws) {
  const h = ws.header || {};
  const vocab = (ws.keyVocabulary || []).slice(0, 5).map((v) => `<li><b>${esc(v.term)}</b> — ${esc(v.meaning)}</li>`).join("");
  const mistakes = (ws.commonMistakes || []).slice(0, 3).map((m) => `<li>${esc(m)}</li>`).join("");
  const short = (ws.questions || []).filter((q) => !q.diagram && !q.application);
  const diagQ = (ws.questions || []).find((q) => q.diagram);
  const appQ = (ws.questions || []).find((q) => q.application);
  const shortCells = short.map((q) => `<div class="q box"><div class="q-no">${esc(q.number)}. ${esc(q.prompt)}</div>${Array.from({length:q.lines||1},()=>`<div class="ans-line"></div>`).join("")}</div>`).join("");

  const css = `${baseCss()}
    .page { width: 297mm; height: 209mm; padding: 4mm 8mm; display:flex; flex-direction:column; }
    .banner { flex:0 0 auto; border: 3px solid ${ACCENT}; border-radius: 10px; padding: 3px 14px; display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px; }
    .banner .subj { font-size: 13px; font-weight:700; color:${ACCENT}; }
    .banner .ttl { font-size: 25px; font-weight:700; letter-spacing:0.05em; }
    .banner .tag { border:2px solid ${ACCENT}; border-radius:8px; padding:2px 9px; font-size:12px; font-weight:700; color:${ACCENT}; }
    .info { flex: 1 1 0; display:grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 7px; margin-bottom: 7px; }
    .col { display:flex; flex-direction:column; gap:7px; }
    .col > .box { flex:1; }
    .box { padding: 7px 11px; display:flex; flex-direction:column; }
    .info .dgm { height: 24mm; width:auto; display:block; margin: auto auto 0; }
    .eq { font-size: 14px; } .eq .sym { margin-top:4px; }
    .info p { font-size:14px; }
    .vocab li, .info li { margin:2px 0; font-size:13px; }
    .mistakes li { margin:2px 0; font-size:13px; }
    .hint { background:#fff7e0; border-color:#d8a800; }
    .hint .htext { font-size:14px; }
    .qband { flex: 1 1 0; display:grid; grid-template-columns: 1.05fr 1.15fr 1fr; gap: 7px; }
    .q-diag .dgm { height: 24mm; width:auto; display:block; margin:3px auto; }
    .q-grid { display:grid; grid-template-columns: 1fr 1fr; gap:7px; }
    .q-app { background:#eef7ee; border-color:#2e7d32; }
    .frame { font-style:italic; color:#1b5e20; font-size:13px; margin-top:4px; }
    .q-no { font-size:13px; font-weight:600; }
    .ans-line { border-bottom: 2px solid #000; height: 12px; margin-top: 6px; }
    h2 { margin-bottom:3px; font-size:14px; }
    .cap { font-size:11px; text-align:center; color:#444; margin-top:2px; }
    .qhead { font-weight:700; color:${ACCENT}; display:block; margin-bottom:3px; font-size:14px; }`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <style>${FONT_CSS}</style><style>${css}</style></head>
  <body><div class="page ws-a11y-dyslexia-opendyslexic">
    <div class="banner"><span class="subj">${esc(h.subjectLine)}</span><span class="ttl">${esc(h.title)}</span><span class="tag">${esc(h.tag)}</span></div>
    <div class="info">
      <div class="box"><h2>What is photosynthesis?</h2><p>${esc(ws.definition)}</p>${diagram("plant-io")}<div class="cap">${esc((ws.diagrams||[])[0]?.caption||"")}</div></div>
      <div class="box eq"><h2>Word &amp; symbol equation</h2><div>${esc(ws.wordEquation)}</div><div class="sym">${esc(ws.symbolEquation)}</div><div class="vocab" style="margin-top:7px;"><h2>Key vocabulary</h2><ul>${vocab}</ul></div></div>
      <div class="col">
        <div class="box mistakes"><h2>Common mistakes</h2><ul>${mistakes}</ul></div>
        <div class="box hint"><h2>💡 Exam tip</h2><div class="htext">${esc(ws.hint||"")}</div></div>
      </div>
    </div>
    <div class="qband">
      <div class="box q-diag"><span class="qhead">Diagram question — Q${esc(diagQ?.number||"")}</span><div>${esc(diagQ?.prompt||"")}</div>${diagram(diagQ?.diagram)}${Array.from({length:diagQ?.lines||2},()=>`<div class="ans-line"></div>`).join("")}</div>
      <div class="box"><span class="qhead">Quick questions</span><div class="q-grid">${shortCells}</div></div>
      <div class="box q-app"><span class="qhead">Apply it — Q${esc(appQ?.number||"")}</span><div>${esc(appQ?.prompt||"")}</div>${appQ?.frame?`<div class="frame">Sentence starter: ${esc(appQ.frame)}</div>`:""}${Array.from({length:appQ?.lines||2},()=>`<div class="ans-line"></div>`).join("")}</div>
    </div>
  </div></body></html>`;
}

/* ---------- Booklet PORTRAIT ---------- */
function page(inner) { return `<section class="page port">${inner}</section>`; }

function buildBooklet(ws) {
  const c = ws.cover || {};
  const obj = (ws.objectives || []).map((o) => `<li>${esc(o)}</li>`).join("");
  const vocab = (ws.keyVocabulary || []).map((v) => `<tr><td class="t">${esc(v.term)}</td><td>${esc(v.meaning)}</td></tr>`).join("");
  const explain = (ws.explain || []).map((p) => `<p>${esc(p)}</p>`).join("");
  const uses = (ws.glucoseUses || []).map((u) => `<li>${esc(u)}</li>`).join("");
  const lim = (ws.limitingFactors || []).map((l) => `<li>${esc(l)}</li>`).join("");
  const mistakes = (ws.commonMistakes || []).map((m) => `<li>${esc(m)}</li>`).join("");
  const ansrows = (ws.answers?.rows || []).map((r) => `<li>${esc(r)}</li>`).join("");
  const cap = (i) => esc((ws.diagrams || [])[i]?.caption || "");
  const rem = ws.reminders || {};
  const remBox = (r) => r ? `<div class="box reminder"><h2>📌 ${esc(r.title)}</h2><ul>${(r.lines||[]).map((l)=>`<li>${esc(l)}</li>`).join("")}</ul></div>` : "";
  const qbox = (q) => !q ? "" : `<div class="box q">
      <div class="q-head"><span class="q-no">Q${esc(q.number)} <span class="marks">[${esc(q.marks)} mark${q.marks===1?"":"s"}]</span></span><span class="skill">${esc(q.skill||"")} ${pipsLine(q.difficulty)}</span></div>
      <div class="q-prompt">${nl(q.prompt)}</div>
      ${q.diagram?`<div class="q-dgm">${diagram(q.diagram)}</div>`:""}
      ${q.frame?`<div class="frame"><b>Sentence starters:</b><br>${nl(q.frame)}</div>`:""}
      ${q.hint?`<div class="hintb">💡 <b>Hint:</b> ${esc(q.hint)}</div>`:""}
      ${Array.from({length:q.lines||2},()=>`<div class="wl"></div>`).join("")}
    </div>`;
  const qs = ws.questions || [];
  const byNum = (n) => qs.find((q) => q.number === n);
  const sr = ws.selfReflection || {};
  const ta = ws.teacherAssessment || {};

  const css = `${baseCss()}
    .page.port { width: 210mm; min-height: 296mm; padding: 12mm 14mm; display:flex; flex-direction:column; }
    .cover-band { border:3px solid ${ACCENT}; border-radius:12px; padding:18px; text-align:center; margin-bottom:14px; }
    .cover-band .subj { font-size:14px; font-weight:700; color:${ACCENT}; }
    .cover-band .ttl { font-size:34px; font-weight:700; margin:8px 0 2px; }
    .cover-band .sub { font-size:16px; }
    .name { font-size:14px; margin-top:14px; }
    .box { margin-bottom: 14px; padding: 12px 15px; }
    h2 { font-size:18px; }
    table { border-collapse:collapse; width:100%; }
    td { border:1px solid ${ACCENT}; padding:7px 10px; vertical-align:top; font-size:15px; }
    td.t { font-weight:700; width:34%; }
    .dgm { width:100%; height:auto; max-height:92mm; display:block; margin:0 auto; }
    .q-dgm .dgm { max-height:52mm; }
    .cap { font-size:13px; color:#444; text-align:center; margin-top:4px; }
    .eq { font-size:16px; } .eq .sym { margin-top:6px; }
    .reminder { background:#f3eefc; }
    .q-head { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
    .q-no { font-weight:700; color:${ACCENT}; font-size:17px; }
    .marks { color:#000; }
    .skill { font-size:13px; color:${ACCENT}; display:inline-flex; align-items:center; gap:6px; }
    .pip { width:9px; height:9px; border-radius:50%; border:2px solid ${ACCENT}; display:inline-block; }
    .pip.on { background:${ACCENT}; }
    .q-prompt { font-size:16px; }
    .q-dgm { margin:8px 0; }
    .frame { background:#eef7ee; border:1.5px dashed #2e7d32; border-radius:8px; padding:7px 11px; margin-top:9px; font-size:15px; color:#1b5e20; }
    .hintb { background:#fff7e0; border:1.5px solid #d8a800; border-radius:8px; padding:6px 11px; margin-top:9px; font-size:15px; }
    .wl { border-bottom:2px solid #000; height:26px; margin-top:13px; }
    .q { margin-bottom:14px; }
    .crit li { margin:7px 0; }
    .tickbox { display:inline-block; width:15px; height:15px; border:2px solid #000; border-radius:3px; margin-right:8px; vertical-align:middle; }
    .rag { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
    .rag span { border:2px solid ${ACCENT}; border-radius:8px; padding:3px 10px; font-size:14px; }
    .fb-line { border-bottom:2px solid #000; height:24px; margin-top:10px; }
    .opt { display:inline-flex; align-items:center; gap:8px; margin-right:16px; }
    .write-line { border-bottom:2px solid #000; height:28px; margin-top:12px; }`;

  const pages = [
    page(`<div class="cover-band"><div class="subj">${esc(c.subjectLine)}</div><div class="ttl">${esc(c.title)}</div><div class="sub">${esc(c.subtitle)}</div><div class="name">${esc(c.nameLine)}</div></div>
      <div class="box"><h2>🎯 What you are learning</h2><ul>${obj}</ul></div>
      <div class="box" style="border-style:dashed;"><h2>Common mistakes (read first)</h2><ul>${mistakes}</ul></div>`),
    page(`<div class="box"><h2>Key vocabulary</h2><table>${vocab}</table></div>`),
    page(`<div class="box"><h2>How photosynthesis works</h2>${explain}</div>
      <div class="box eq"><h2>Word &amp; symbol equation</h2><div>${esc(ws.wordEquation)}</div><div class="sym">${esc(ws.symbolEquation)}</div></div>
      <div class="box"><h2>Diagram 1 — inputs &amp; outputs</h2>${diagram("plant-io")}<div class="cap">${cap(0)}</div></div>
      ${remBox(rem.content)}`),
    page(`<div class="box"><h2>Diagram 2 — inside the leaf cell</h2>${diagram("leaf-chloroplast")}<div class="cap">${cap(1)}</div></div>
      <div class="box"><h2>What the glucose is used for</h2><ul>${uses}</ul></div>`),
    page(`<div class="box"><h2>What changes the rate? (limiting factors)</h2><ul>${lim}</ul></div>
      <div class="box"><h2>Diagram 3 — rate vs light intensity</h2>${diagram("limiting-factors")}<div class="cap">${cap(2)}</div></div>
      ${remBox(rem.method)}`),
    page(`<h2 style="color:${ACCENT};">Questions — they get harder as you go</h2>${remBox(rem.method)}${[1,2,3,4].map((n)=>qbox(byNum(n))).join("")}`),
    page(`${[5,6].map((n)=>qbox(byNum(n))).join("")}`),
    page(`${qbox(byNum(7))}`),
    page(`${qbox(byNum(8))}`),
    page(`${qbox(byNum(9))}`),
    page(`<h2 style="color:${ACCENT};">${esc(sr.title||"Self-reflection")}</h2>
      <div class="box"><p style="font-weight:700;">${esc(sr.confidencePrompt||"")}</p><div>${(sr.confidenceOptions||[]).map((o)=>`<span class="opt"><span class="tickbox"></span>${esc(o)}</span>`).join("")}</div></div>
      ${(sr.prompts||[]).map((p)=>`<div class="box"><p>${esc(p)}</p><div class="write-line"></div><div class="write-line"></div></div>`).join("")}`),
    page(`<div class="box" style="border:2px solid #2e7d32;"><h2 style="color:#2e7d32;">${esc(ta.title||"Teacher assessment")}</h2>
        <p style="font-weight:700;">Success criteria (tick if met) — total: ${esc(ta.marksTotal||"")} marks</p>
        <ul class="crit" style="list-style:none; padding-left:0;">${(ta.successCriteria||[]).map((s)=>`<li><span class="tickbox"></span>${esc(s)}</li>`).join("")}</ul>
        <div class="rag">${(ta.rag||[]).map((r)=>`<span>${esc(r)}</span>`).join("")}</div>
        ${(ta.feedback||[]).map((f)=>`<p style="margin-top:10px;">${esc(f)}</p><div class="fb-line"></div>`).join("")}
      </div>`),
    page(`<div class="box" style="border:2px solid #2e7d32;"><h2 style="color:#2e7d32;">${esc(ws.answers?.title||"Answers")}</h2><ol>${ansrows}</ol></div>`),
  ].join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <style>${FONT_CSS}</style><style>${css}</style></head><body>${pages}</body></html>`;
}

/* ---------- main ---------- */
const onepage = JSON.parse(readFileSync(join(__dirname, "worksheet-science-onepage.json"), "utf8"));
const booklet = JSON.parse(readFileSync(join(__dirname, "worksheet-science-booklet.json"), "utf8"));

await renderPdf({ html: buildOnePage(onepage), htmlPath: join(__dirname, "Photosynthesis-Dyslexia-OnePage.html"), pdfPath: join(__dirname, "Photosynthesis-Dyslexia-OnePage.pdf"), landscape: true });
console.log("WROTE one-page");
await renderPdf({ html: buildBooklet(booklet), htmlPath: join(__dirname, "Photosynthesis-Dyslexia-Booklet.html"), pdfPath: join(__dirname, "Photosynthesis-Dyslexia-Booklet.pdf"), landscape: false });
console.log("WROTE booklet");
