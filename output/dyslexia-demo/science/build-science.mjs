/**
 * build-science.mjs — Photosynthesis worksheets.
 *   - One-page: LANDSCAPE poster / fact-sheet (header banner, info boxes,
 *     two labelled diagrams, numbered questions with answer lines).
 *   - Booklet: PORTRAIT multi-page (explain -> diagrams -> vocab ->
 *     limiting factors -> practise -> teacher key).
 * Distinct, diagram-led layout. Identical SEND adaptations via _send-base.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CREAM, ACCENT, FONT_CSS, esc, nl, baseCss, renderPdf } from "../_send-base.mjs";

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
    return `<svg viewBox="0 0 370 200" class="dgm" xmlns="http://www.w3.org/2000/svg">${ARROW}
      <path d="M40 150 C40 70 120 40 150 40 C150 120 90 160 40 150 Z" fill="#6bbf59" stroke="#000" stroke-width="2"/>
      <path d="M44 148 C90 120 130 70 148 44" fill="none" stroke="#0c5a0c" stroke-width="1.6"/>
      <line x1="158" y1="96" x2="206" y2="96" stroke="#000" stroke-width="2.5" marker-end="url(#ahk)"/>
      <circle cx="272" cy="98" r="56" fill="#eaf6e6" stroke="#000" stroke-width="2"/>
      <rect x="238" y="64" width="70" height="68" rx="10" fill="none" stroke="#000" stroke-width="1.5"/>
      ${chl}
      <text x="206" y="178" font-size="13">Chloroplasts (green) hold chlorophyll</text>
    </svg>`;
  }
  if (id === "limiting-factors") {
    return `<svg viewBox="0 0 330 210" class="dgm" xmlns="http://www.w3.org/2000/svg">${ARROW}
      <line x1="48" y1="20" x2="48" y2="170" stroke="#000" stroke-width="2"/>
      <line x1="48" y1="170" x2="300" y2="170" stroke="#000" stroke-width="2"/>
      <path d="M48 170 C95 170 120 70 175 58 C230 50 290 50 296 50" fill="none" stroke="#1f5fa6" stroke-width="3"/>
      <text x="60" y="60" font-size="12">levels off</text>
      <text x="6" y="100" font-size="12" transform="rotate(-90 14 100)">Rate of photosynthesis</text>
      <text x="120" y="192" font-size="12">Light intensity</text>
    </svg>`;
  }
  return "";
}

/* ---------- difficulty pips (for booklet questions) ---------- */
function pipsLine(level) {
  const n = Math.max(1, Math.min(5, Number(level) || 1));
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<span class="pip ${i <= n ? "on" : ""}"></span>`;
  return out;
}

/* ---------- One-page LANDSCAPE poster ---------- */
function buildOnePage(ws) {
  const h = ws.header || {};
  const vocab = (ws.keyVocabulary || []).map((v) => `<li><b>${esc(v.term)}</b> — ${esc(v.meaning)}</li>`).join("");
  const facts = (ws.keyFacts || []).map((f) => `<li>${esc(f)}</li>`).join("");
  const mistakes = (ws.commonMistakes || []).map((m) => `<li>${esc(m)}</li>`).join("");
  const qs = (ws.questions || []).map((q) => `
    <div class="q box">
      <div class="q-no">${esc(q.number)}. ${esc(q.prompt)}</div>
      <div class="ans">Answer: <span class="ans-line"></span></div>
    </div>`).join("");

  const css = `${baseCss()}
    .page { width: 297mm; min-height: 209mm; padding: 5mm 8mm; display:flex; flex-direction:column; }
    .banner { border: 3px solid ${ACCENT}; border-radius: 10px; padding: 3px 12px; display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px; }
    .banner .subj { font-size: 13px; font-weight:700; color:${ACCENT}; }
    .banner .ttl { font-size: 26px; font-weight:700; letter-spacing:0.05em; }
    .banner .tag { border:2px solid ${ACCENT}; border-radius:8px; padding:2px 8px; font-size:12px; font-weight:700; color:${ACCENT}; }
    .info { display:grid; grid-template-columns: 1.1fr 0.95fr 1fr; gap: 6px; margin-bottom: 6px; }
    .col { display:flex; flex-direction:column; gap:6px; }
    .box { padding: 6px 10px; }
    .info .dgm { height: 34mm; width:auto; display:block; margin: 3px auto 0; }
    .eq { font-size: 14px; } .eq .sym { margin-top:4px; }
    .info p { font-size:15px; }
    .vocab li, .info li { margin:2px 0; font-size:15px; }
    .mistakes ul { columns: 2; column-gap: 18px; }
    .mistakes li { margin:2px 0; font-size:14px; }
    .qwrap { margin-top:auto; }
    .qhead { font-weight:700; color:${ACCENT}; margin: 4px 0 5px; }
    .q-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .q { padding:6px 9px; }
    .q-no { font-size:14px; }
    .ans { margin-top:6px; font-size:13px; display:flex; align-items:flex-end; gap:6px; }
    .ans-line { flex:1; border-bottom: 2px solid #000; height: 13px; }
    h2 { margin-bottom:3px; font-size:15px; }
    .cap { font-size:11px; text-align:center; color:#444; margin-top:2px; }`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <style>${FONT_CSS}</style><style>${css}</style></head>
  <body><div class="page ws-a11y-dyslexia-opendyslexic">
    <div class="banner"><span class="subj">${esc(h.subjectLine)}</span><span class="ttl">${esc(h.title)}</span><span class="tag">${esc(h.tag)}</span></div>
    <div class="info">
      <div class="col">
        <div class="box"><h2>What is photosynthesis?</h2><p>${esc(ws.definition)}</p>${diagram("plant-io")}<div class="cap">${esc((ws.diagrams||[])[0]?.caption||"")}</div></div>
      </div>
      <div class="col">
        <div class="box eq"><h2>Word &amp; symbol equation</h2><div>${esc(ws.wordEquation)}</div><div class="sym">${esc(ws.symbolEquation)}</div></div>
        <div class="box mistakes"><h2>Common mistakes</h2><ul>${mistakes}</ul></div>
      </div>
      <div class="col">
        <div class="box vocab"><h2>Key vocabulary</h2><ul>${vocab}</ul></div>
        <div class="box"><h2>In the leaf</h2>${diagram("leaf-chloroplast")}<div class="cap">${esc((ws.diagrams||[])[1]?.caption||"")}</div></div>
      </div>
    </div>
    <div class="qwrap">
      <div class="qhead">Questions — write your answer on the line</div>
      <div class="q-grid">${qs}</div>
    </div>
  </div></body></html>`;
  return html;
}

/* ---------- Booklet PORTRAIT ---------- */
function page(inner, cls = "") { return `<section class="page port ${cls}">${inner}</section>`; }

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
  const remBox = (r, cls) => r ? `<div class="box reminder ${cls||""}"><h2>📌 ${esc(r.title)}</h2><ul>${(r.lines||[]).map((l)=>`<li>${esc(l)}</li>`).join("")}</ul></div>` : "";
  const qbox = (q) => `<div class="box q"><div class="q-head"><span class="q-no">Q${esc(q.number)} <span class="marks">[${esc(q.marks)}]</span></span><span class="skill">${esc(q.skill||"")} ${pipsLine(q.difficulty)}</span></div><div>${esc(q.prompt)}</div>${Array.from({length:q.lines||2},()=>`<div class="wl"></div>`).join("")}</div>`;
  const qs = ws.questions || [];
  const sr = ws.selfReflection || {};
  const ta = ws.teacherAssessment || {};

  const css = `${baseCss()}
    .page.port { width: 210mm; min-height: 296mm; padding: 12mm 14mm; display:flex; flex-direction:column; }
    .cover-band { border:3px solid ${ACCENT}; border-radius:12px; padding:16px; text-align:center; margin-bottom:12px; }
    .cover-band .subj { font-size:14px; font-weight:700; color:${ACCENT}; }
    .cover-band .ttl { font-size:34px; font-weight:700; margin:8px 0 2px; }
    .cover-band .sub { font-size:16px; }
    .name { font-size:14px; margin-top:14px; }
    .box { margin-bottom: 12px; }
    h2 { font-size:18px; }
    table { border-collapse:collapse; width:100%; }
    td { border:1px solid ${ACCENT}; padding:6px 9px; vertical-align:top; font-size:15px; }
    td.t { font-weight:700; width:34%; }
    .dgm { width:100%; height:auto; max-height:90mm; display:block; margin:0 auto; }
    .cap { font-size:13px; color:#444; text-align:center; margin-top:4px; }
    .eq { font-size:16px; } .eq .sym { margin-top:6px; }
    .reminder { background:#f3eefc; }
    .q-head { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px; }
    .q-no { font-weight:700; color:${ACCENT}; font-size:17px; }
    .marks { color:#000; }
    .skill { font-size:13px; color:${ACCENT}; display:inline-flex; align-items:center; gap:6px; }
    .pip { width:9px; height:9px; border-radius:50%; border:2px solid ${ACCENT}; display:inline-block; }
    .pip.on { background:${ACCENT}; }
    .wl { border-bottom:2px solid #000; height:26px; margin-top:12px; }
    .q { margin-bottom:12px; }
    .crit li { margin:6px 0; }
    .tickbox { display:inline-block; width:15px; height:15px; border:2px solid #000; border-radius:3px; margin-right:8px; vertical-align:middle; }
    .rag { display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
    .rag span { border:2px solid ${ACCENT}; border-radius:8px; padding:3px 10px; font-size:14px; }
    .fb-line { border-bottom:2px solid #000; height:24px; margin-top:10px; }
    .opt { display:inline-flex; align-items:center; gap:8px; margin-right:16px; }
    .write-line { border-bottom:2px solid #000; height:28px; margin-top:12px; }`;

  const pages = [
    // 1: intro — cover + objectives + common mistakes (overview)
    page(`<div class="cover-band"><div class="subj">${esc(c.subjectLine)}</div><div class="ttl">${esc(c.title)}</div><div class="sub">${esc(c.subtitle)}</div><div class="name">${esc(c.nameLine)}</div></div>
      <div class="box"><h2>🎯 What you are learning</h2><ul>${obj}</ul></div>
      <div class="box" style="border-style:dashed;"><h2>Common mistakes (read first)</h2><ul>${mistakes}</ul></div>`),
    // 2: key vocabulary
    page(`<div class="box"><h2>Key vocabulary</h2><table>${vocab}</table></div>`),
    // 3: how it works + equation + diagram 1 + content reminder
    page(`<div class="box"><h2>How photosynthesis works</h2>${explain}</div>
      <div class="box eq"><h2>Word &amp; symbol equation</h2><div>${esc(ws.wordEquation)}</div><div class="sym">${esc(ws.symbolEquation)}</div></div>
      <div class="box"><h2>Diagram 1</h2>${diagram("plant-io")}<div class="cap">${cap(0)}</div></div>
      ${remBox(rem.content)}`),
    // 4: diagram 2 + glucose uses
    page(`<div class="box"><h2>Diagram 2</h2>${diagram("leaf-chloroplast")}<div class="cap">${cap(1)}</div></div>
      <div class="box"><h2>What the glucose is used for</h2><ul>${uses}</ul></div>`),
    // 5: limiting factors + diagram 3 + method reminder
    page(`<div class="box"><h2>What changes the rate? (limiting factors)</h2><ul>${lim}</ul></div>
      <div class="box"><h2>Diagram 3</h2>${diagram("limiting-factors")}<div class="cap">${cap(2)}</div></div>
      ${remBox(rem.method)}`),
    // 6: questions (easier) — with method reminder strip
    page(`<h2 style="color:${ACCENT};">Questions — they get harder as you go</h2>${remBox(rem.method)}${qs.slice(0,4).map(qbox).join("")}`),
    // 7: questions (harder)
    page(`${qs.slice(4).map(qbox).join("")}`),
    // 8: self-reflection
    page(`<h2 style="color:${ACCENT};">${esc(sr.title||"Self-reflection")}</h2>
      <div class="box"><p style="font-weight:700;">${esc(sr.confidencePrompt||"")}</p><div>${(sr.confidenceOptions||[]).map((o)=>`<span class="opt"><span class="tickbox"></span>${esc(o)}</span>`).join("")}</div></div>
      ${(sr.prompts||[]).map((p)=>`<div class="box"><p>${esc(p)}</p><div class="write-line"></div><div class="write-line"></div></div>`).join("")}`),
    // 9: teacher assessment
    page(`<div class="box" style="border:2px solid #2e7d32;"><h2 style="color:#2e7d32;">${esc(ta.title||"Teacher assessment")}</h2>
        <p style="font-weight:700;">Success criteria (tick if met) — total: ${esc(ta.marksTotal||"")} marks</p>
        <ul class="crit" style="list-style:none; padding-left:0;">${(ta.successCriteria||[]).map((s)=>`<li><span class="tickbox"></span>${esc(s)}</li>`).join("")}</ul>
        <div class="rag">${(ta.rag||[]).map((r)=>`<span>${esc(r)}</span>`).join("")}</div>
        ${(ta.feedback||[]).map((f)=>`<p style="margin-top:10px;">${esc(f)}</p><div class="fb-line"></div>`).join("")}
      </div>`),
    // 10: answer key
    page(`<div class="box" style="border:2px solid #2e7d32;"><h2 style="color:#2e7d32;">${esc(ws.answers?.title||"Answers")}</h2><ol>${ansrows}</ol></div>`),
  ].join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <style>${FONT_CSS}</style><style>${css}</style></head><body>${pages}</body></html>`;
}

/* ---------- main ---------- */
const onepage = JSON.parse(readFileSync(join(__dirname, "worksheet-science-onepage.json"), "utf8"));
const booklet = JSON.parse(readFileSync(join(__dirname, "worksheet-science-booklet.json"), "utf8"));

await renderPdf({
  html: buildOnePage(onepage),
  htmlPath: join(__dirname, "Photosynthesis-Dyslexia-OnePage.html"),
  pdfPath: join(__dirname, "Photosynthesis-Dyslexia-OnePage.pdf"),
  landscape: true,
});
console.log("WROTE one-page");

await renderPdf({
  html: buildBooklet(booklet),
  htmlPath: join(__dirname, "Photosynthesis-Dyslexia-Booklet.html"),
  pdfPath: join(__dirname, "Photosynthesis-Dyslexia-Booklet.pdf"),
  landscape: false,
});
console.log("WROTE booklet");
