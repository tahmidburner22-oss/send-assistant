/**
 * build-english.mjs — Writing to Persuade worksheets.
 *   - One-page: PORTRAIT "writer's toolkit" organiser (technique table +
 *     annotated model + checklist + scaffolded tasks). No diagrams, no grid.
 *   - Booklet: PORTRAIT (learn -> reminders -> model -> guided write that
 *     increases in difficulty -> self-reflection -> teacher assessment).
 * Distinct text/technique-led structure. Identical SEND adaptations.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ACCENT, FONT_CSS, esc, nl, baseCss, renderPdf } from "../_send-base.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function pipsLine(level) {
  const n = Math.max(1, Math.min(5, Number(level) || 1));
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<span class="pip ${i <= n ? "on" : ""}"></span>`;
  return out;
}

const techRows = (techniques) => (techniques || [])
  .map((t) => `<tr><td class="lt"><span class="badge">${esc(t.letter)}</span> ${esc(t.term)}</td><td>${esc(t.meaning)}</td><td class="ex">e.g. ${esc(t.example)}</td></tr>`)
  .join("");

const chips = (arr) => (arr || []).map((a) => `<span class="chip">${esc(a)}</span>`).join("");

/* ---------- One-page PORTRAIT toolkit ---------- */
function buildOnePage(ws) {
  const h = ws.header || {};
  const techRows2 = (ws.techniques || []).map((t) => `<tr><td class="lt"><span class="badge">${esc(t.letter)}</span> ${esc(t.term)}</td><td>${esc(t.meaning)}<br><span class="ex">e.g. ${esc(t.example)}</span></td></tr>`).join("");
  const mistakes = (ws.commonMistakes || []).map((m) => `<li>${esc(m)}</li>`).join("");
  const check = (ws.checklist || []).map((c) => `<li>${esc(c)}</li>`).join("");
  const tasks = (ws.tasks || []).map((t) => `
    <div class="task box">
      <div class="t-head"><span class="t-no">${esc(t.number)}. ${esc(t.level)}</span></div>
      <div>${nl(t.prompt)}</div>
      ${Array.from({ length: t.lines || 2 }, () => `<div class="wl"></div>`).join("")}
    </div>`).join("");

  const css = `${baseCss()}
    .page { width: 210mm; min-height: 296mm; padding: 5mm 8mm; display:flex; flex-direction:column; }
    .banner { border: 3px solid ${ACCENT}; border-radius: 10px; padding: 3px 11px; display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px; }
    .banner .subj { font-size: 12px; font-weight:700; color:${ACCENT}; }
    .banner .ttl { font-size: 24px; font-weight:700; letter-spacing:0.04em; }
    .banner .tag { border:2px solid ${ACCENT}; border-radius:8px; padding:2px 8px; font-size:11px; font-weight:700; color:${ACCENT}; }
    .obj-line { font-size:14px; margin-bottom:6px; }
    .obj-line b { color:${ACCENT}; }
    .main { display:flex; gap:7px; }
    .main > .col { display:flex; flex-direction:column; gap:6px; }
    .col-l { flex: 1.05; } .col-r { flex: 1; }
    .box { padding: 6px 9px; }
    h2 { font-size:14px; margin-bottom:3px; }
    table { border-collapse:collapse; width:100%; }
    td { border:1px solid ${ACCENT}; padding:2px 5px; vertical-align:top; font-size:12.5px; line-height:1.25; }
    td.lt { font-weight:700; width:42%; }
    .ex { font-style:italic; color:#444; }
    .badge { display:inline-block; background:${ACCENT}; color:#fff; border-radius:4px; width:16px; height:16px; text-align:center; font-size:11px; line-height:16px; }
    .model p { font-size:13px; margin:0 0 5px; }
    .chips { display:flex; flex-wrap:wrap; gap:4px; }
    .chip { border:1.5px solid ${ACCENT}; border-radius:11px; padding:1px 8px; font-size:11px; color:${ACCENT}; }
    .mistakes li, .check li { margin:2px 0; font-size:12.5px; }
    .tasks-wrap { margin-top:auto; padding-top:6px; }
    .t-grid { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:7px; }
    .t-no { font-weight:700; color:${ACCENT}; font-size:13px; }
    .task > div { font-size:12.5px; }
    .wl { border-bottom:2px solid #000; height:11px; margin-top:7px; }
    .qhead { font-weight:700; color:${ACCENT}; margin: 0 0 5px; font-size:14px; }`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <style>${FONT_CSS}</style><style>${css}</style></head>
  <body><div class="page ws-a11y-dyslexia-opendyslexic">
    <div class="banner"><span class="subj">${esc(h.subjectLine)}</span><span class="ttl">${esc(h.title)}</span><span class="tag">${esc(h.tag)}</span></div>
    <div class="obj-line"><b>What you are learning:</b> ${esc(ws.objective)}</div>
    <div class="main">
      <div class="col col-l">
        <div class="box"><h2>Techniques toolkit — AFOREST (key words)</h2><table>${techRows2}</table></div>
      </div>
      <div class="col col-r">
        <div class="box model"><h2>${esc(ws.model?.title||"Model")}</h2><p>${esc(ws.model?.text||"")}</p><div class="chips">${chips(ws.model?.annotations)}</div></div>
        <div class="box mistakes"><h2>Common mistakes</h2><ul>${mistakes}</ul></div>
        <div class="box check"><h2>Writing checklist</h2><ul>${check}</ul></div>
      </div>
    </div>
    <div class="tasks-wrap">
      <div class="qhead">Your turn — tasks get harder as you go</div>
      <div class="t-grid">${tasks}</div>
    </div>
  </div></body></html>`;
}

/* ---------- Booklet PORTRAIT ---------- */
function page(inner) { return `<section class="page port">${inner}</section>`; }

function buildBooklet(ws) {
  const c = ws.cover || {};
  const obj = (ws.objectives || []).map((o) => `<li>${esc(o)}</li>`).join("");
  const vocab = (ws.keyVocabulary || []).map((v) => `<tr><td class="t">${esc(v.term)}</td><td>${esc(v.meaning)}</td></tr>`).join("");
  const mistakes = (ws.commonMistakes || []).map((m) => `<li>${esc(m)}</li>`).join("");
  const rem = ws.reminders || {};
  const remBox = (r) => r ? `<div class="box reminder"><h2>📌 ${esc(r.title)}</h2><ul>${(r.lines||[]).map((l)=>`<li>${esc(l)}</li>`).join("")}</ul></div>` : "";
  const annos = (ws.model?.annotations || []).map((a) => `<li>${esc(a)}</li>`).join("");
  const taskBox = (t) => `<div class="box q"><div class="q-head"><span class="q-no">Task ${esc(t.number)} <span class="marks">[${esc(t.marks)}]</span></span><span class="skill">${esc(t.skill||"")} ${pipsLine(t.difficulty)}</span></div><div>${nl(t.prompt)}</div>${Array.from({length:t.lines||2},()=>`<div class="wl"></div>`).join("")}</div>`;
  const tasks = ws.tasks || [];
  const sr = ws.selfReflection || {};
  const ta = ws.teacherAssessment || {};

  const css = `${baseCss()}
    .page.port { width: 210mm; min-height: 296mm; padding: 12mm 14mm; display:flex; flex-direction:column; }
    .cover-band { border:3px solid ${ACCENT}; border-radius:12px; padding:16px; text-align:center; margin-bottom:12px; }
    .cover-band .subj { font-size:14px; font-weight:700; color:${ACCENT}; }
    .cover-band .ttl { font-size:32px; font-weight:700; margin:8px 0 2px; }
    .cover-band .sub { font-size:16px; }
    .name { font-size:14px; margin-top:14px; }
    .box { margin-bottom: 12px; }
    h2 { font-size:18px; }
    table { border-collapse:collapse; width:100%; }
    td { border:1px solid ${ACCENT}; padding:6px 9px; vertical-align:top; font-size:15px; }
    td.t { font-weight:700; width:34%; }
    td.lt { font-weight:700; width:30%; white-space:nowrap; }
    td.ex { font-style:italic; }
    .badge { display:inline-block; background:${ACCENT}; color:#fff; border-radius:5px; width:20px; height:20px; text-align:center; font-size:13px; line-height:20px; }
    .reminder { background:#f3eefc; }
    .model p { font-size:16px; }
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
    page(`<div class="cover-band"><div class="subj">${esc(c.subjectLine)}</div><div class="ttl">${esc(c.title)}</div><div class="sub">${esc(c.subtitle)}</div><div class="name">${esc(c.nameLine)}</div></div>
      <div class="box"><h2>🎯 What you are learning</h2><ul>${obj}</ul></div>
      <div class="box" style="border-style:dashed;"><h2>Common mistakes (read first)</h2><ul>${mistakes}</ul></div>`),
    page(`<div class="box"><h2>Key vocabulary</h2><table>${vocab}</table></div>`),
    page(`<div class="box"><h2>Persuasive techniques — AFOREST</h2><table>${techRows(ws.techniques)}</table></div>`),
    page(`${remBox(rem.content)}${remBox(rem.method)}`),
    page(`<div class="box model"><h2>${esc(ws.model?.title||"Model")}</h2><p>${esc(ws.model?.text||"")}</p></div>
      <div class="box"><h2>How the model works</h2><ul>${annos}</ul></div>`),
    page(`<h2 style="color:${ACCENT};">Your turn — tasks get harder as you go</h2>${remBox(rem.method)}${tasks.slice(0,3).map(taskBox).join("")}`),
    page(`${tasks.slice(3).map(taskBox).join("")}`),
    page(`<h2 style="color:${ACCENT};">${esc(sr.title||"Self-reflection")}</h2>
      <div class="box"><p style="font-weight:700;">${esc(sr.confidencePrompt||"")}</p><div>${(sr.confidenceOptions||[]).map((o)=>`<span class="opt"><span class="tickbox"></span>${esc(o)}</span>`).join("")}</div></div>
      ${(sr.prompts||[]).map((p)=>`<div class="box"><p>${esc(p)}</p><div class="write-line"></div><div class="write-line"></div></div>`).join("")}`),
    page(`<div class="box" style="border:2px solid #2e7d32;"><h2 style="color:#2e7d32;">${esc(ta.title||"Teacher assessment")}</h2>
        <p style="font-weight:700;">Success criteria (tick if met) — total: ${esc(ta.marksTotal||"")} marks</p>
        <ul class="crit" style="list-style:none; padding-left:0;">${(ta.successCriteria||[]).map((s)=>`<li><span class="tickbox"></span>${esc(s)}</li>`).join("")}</ul>
        <div class="rag">${(ta.rag||[]).map((r)=>`<span>${esc(r)}</span>`).join("")}</div>
        ${(ta.feedback||[]).map((f)=>`<p style="margin-top:10px;">${esc(f)}</p><div class="fb-line"></div>`).join("")}
      </div>`),
  ].join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <style>${FONT_CSS}</style><style>${css}</style></head><body>${pages}</body></html>`;
}

/* ---------- main ---------- */
const onepage = JSON.parse(readFileSync(join(__dirname, "worksheet-english-onepage.json"), "utf8"));
const booklet = JSON.parse(readFileSync(join(__dirname, "worksheet-english-booklet.json"), "utf8"));

await renderPdf({
  html: buildOnePage(onepage),
  htmlPath: join(__dirname, "Persuasive-Writing-Dyslexia-OnePage.html"),
  pdfPath: join(__dirname, "Persuasive-Writing-Dyslexia-OnePage.pdf"),
  landscape: false,
});
console.log("WROTE english one-page");

await renderPdf({
  html: buildBooklet(booklet),
  htmlPath: join(__dirname, "Persuasive-Writing-Dyslexia-Booklet.html"),
  pdfPath: join(__dirname, "Persuasive-Writing-Dyslexia-Booklet.pdf"),
  landscape: false,
});
console.log("WROTE english booklet");
