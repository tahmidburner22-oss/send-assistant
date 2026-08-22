export type ScienceLayoutKind = "timeline" | "formula" | "interpretation" | "primary-observation" | "cells" | "photosynthesis" | "genetics" | "forces" | "energy" | "waves" | "ionic" | "covalent" | "rates";

export interface ScienceLandscapeOptions {
  subject: string;
  yearGroup: string;
  topic: string;
  subtopic?: string;
  sendNeedId?: string;
  readingAge?: number;
  examBoard?: string;
}

export interface ScienceLandscapeDocument {
  title: string;
  layout: ScienceLayoutKind;
  html: string;
  adaptations: string[];
}

const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
const norm = (value = "") => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const isPrimary = (yearGroup: string) => /^Year\s+[1-6]$/i.test(yearGroup);

function supportNotes(options: ScienceLandscapeOptions): string[] {
  const notes: string[] = [];
  const need = norm(options.sendNeedId);
  if (need && need !== "none selected" && need !== "none") {
    const known: Record<string, string> = {
      dyslexia: "Dyslexia",
      adhd: "ADHD",
      autism: "ASC",
      "autism spectrum condition asc": "ASC",
      slcn: "SLCN",
      "speech language communication needs slcn": "SLCN",
      "working memory difficulties": "Working memory",
      dyscalculia: "Dyscalculia",
      "visual impairment": "Visual support",
      "hearing impairment": "Hearing support",
    };
    notes.push(known[need] || options.sendNeedId!.replace(/\s*\([^)]*\)/g, ""));
  }
  if ((options.readingAge || 0) > 0) notes.push(`Age ${options.readingAge}`);
  return notes;
}

function supportMode(options: ScienceLandscapeOptions): "visual" | "standard" {
  return /(visual impairment|low vision|\bvi\b)/.test(norm(options.sendNeedId)) ? "visual" : "standard";
}

function scienceCss(): string {
  return `
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; color: #17223b; font-family: Arial, Helvetica, sans-serif; }
  .science-root { width: 285mm; }
  .science-page { position: relative; width: 285mm; height: 200mm; overflow: hidden; background: #ffffff; padding: 8mm; }
  .science-page .surface { background: #ffffff; }
  .head { height: 24mm; border-bottom: 1.25mm solid #123a78; position: relative; padding-bottom: 3mm; }
  .tag { display:inline-block; border: .6mm solid #123a78; border-radius: 2mm; padding: 1.3mm 3mm; color:#123a78; font-size: 8pt; font-weight: 700; letter-spacing: .15mm; }
  .head-title { text-align:center; font-size: 20pt; line-height:1.04; font-weight: 800; letter-spacing:.2mm; color:#102f64; margin: 2mm 34mm 0; }
  .head-sub { text-align:center; font-size: 9pt; color:#263a70; margin-top: 1mm; font-weight: 600; }
  .name { position:absolute; top:0; right:0; width:43mm; border: .45mm solid #17223b; border-radius:2mm; padding:1.6mm 2mm; font-size:7pt; line-height: 2.7mm; background:#fff; }
  .support { position:absolute; top:14mm; right:0; font-size:6.2pt; font-weight:700; color:#1f5fa6; white-space:nowrap; }
  .purpose { margin-top:4mm; height:10mm; border:.55mm solid #1f5fa6; border-radius: 2.5mm; display:flex; align-items:center; padding:0 4mm; font-size:10pt; font-weight:600; background:#ffffff; }
  .purpose b { color:#123a78; margin-right:2mm; }
  .grid { display:grid; gap:3mm; margin-top:3mm; }
  .card { border:.5mm solid #1f5fa6; border-radius:2mm; background:#ffffff; overflow:hidden; }
  .card h3 { margin:0; padding:1.8mm 2.6mm; color:#123a78; font-size:9pt; font-weight:800; border-bottom:.35mm solid currentColor; text-align:center; }
  .card p { margin:2mm 2.8mm; font-size:8.5pt; line-height:1.25; }
  .small { font-size:7.4pt !important; }
  .hint { font-weight:700; color:#123a78; }
  .answer { display:inline-block; min-width:28mm; border-bottom:.4mm solid #17223b; height:4mm; vertical-align:bottom; }
  .wordbank { position:absolute; left:8mm; right:8mm; bottom:7mm; min-height:10mm; border:.55mm solid #123a78; border-radius:2mm; display:flex; align-items:center; background:#ffffff; overflow:hidden; }
  .wordbank strong { align-self:stretch; display:flex; align-items:center; padding:0 3.5mm; background:#123a78; color:#ffffff; font-size:8pt; letter-spacing:.15mm; }
  .wordbank span { padding:0 3mm; font-size:8pt; }
  .timeline { display:grid; grid-template-columns:repeat(5, 1fr); gap:2mm; margin-top:5mm; }
  .step { position:relative; min-height:122mm; border:.5mm solid #1f5fa6; border-radius:2mm; background:#ffffff; padding:4mm 2mm 2mm; }
  .step-number { position:absolute; top:-4mm; left:50%; transform:translateX(-50%); width:10mm; height:10mm; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12pt; font-weight:800; background:#1f5fa6; }
  .step:nth-child(2) .step-number { background:#4f903b; } .step:nth-child(3) .step-number { background:#d68000; } .step:nth-child(4) .step-number { background:#7153a1; } .step:nth-child(5) .step-number { background:#287f91; }
  .year { text-align:center; color:#123a78; font-size:9pt; font-weight:800; margin:2mm 0; }
  .model { height:34mm; display:flex; align-items:center; justify-content:center; }
  .name-slot { height:9mm; border:.45mm solid #777; border-radius:1.5mm; padding:2mm; text-align:center; font-size:8pt; font-weight:700; }
  .idea { margin-top:3mm; border:.4mm solid #b2c4da; border-radius:1.5mm; min-height:44mm; padding:2mm; font-size:7.5pt; line-height:1.25; }
  .idea b { display:block; text-align:center; color:#123a78; margin-bottom:1mm; }
  .formula-grid { display:grid; grid-template-columns:1.15fr 1fr .9fr; gap:3mm; margin-top:4mm; }
  .formula-card { height:66mm; }
  .formula-box { margin:5mm 3mm; padding:4mm 2mm; text-align:center; border:.55mm solid #1f5fa6; border-radius:2mm; font-size:13pt; font-weight:700; }
  .formula-note { text-align:center; margin:0 3mm; border:.45mm solid #be9500; border-radius:2mm; padding:2mm; color:#6e5200; font-size:9pt; font-weight:800; }
  .questions { display:grid; grid-template-columns:1fr 1fr; gap:3mm; margin-top:3mm; }
  .q { min-height:35mm; padding:3mm; border:.5mm solid #1f5fa6; border-radius:2mm; background:#ffffff; font-size:9pt; line-height:1.28; }
  .qnum { display:inline-flex; align-items:center; justify-content:center; width:7mm; height:7mm; margin-right:2mm; border-radius:1.3mm; background:#0f58a7; color:#fff; font-weight:800; }
  .work { height:10mm; margin-top:3mm; border-bottom:.4mm solid #76859a; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:3mm; margin-top:4mm; }
  .panel { min-height:112mm; padding:3mm; border:.55mm solid #123a78; border-radius:2mm; background:#ffffff; }
  .panel h2 { display:inline-block; margin:0 0 2.5mm; padding:1.5mm 3mm; border-radius:1.5mm; background:#123a78; color:#fff; font-size:10pt; }
  .two-col .panel svg { display:block; width:68mm; height:45mm; margin:2mm auto; }
  .label-bank { display:flex; gap:2mm; margin:2mm 0 4mm; padding:2mm; border:.35mm dashed #8794aa; }
  .label-bank span { flex:1; padding:2mm; text-align:center; border:.35mm solid #65748a; border-radius:1.5mm; font-size:8pt; font-weight:700; }
  .response { margin-top:3mm; min-height:18mm; border-bottom:.4mm solid #76859a; background: repeating-linear-gradient(to bottom, transparent 0, transparent 7mm, #c8d0da 7.1mm, transparent 7.5mm) !important; }
  .bottom-strip { position:absolute; left:8mm; right:8mm; bottom:7mm; height:13mm; display:grid; grid-template-columns:1fr 1fr; gap:3mm; }
  .strip { border:.45mm solid #123a78; border-radius:2mm; padding:2mm 3mm; background:#ffffff; font-size:8.2pt; }
  .strip b { color:#123a78; }
  .primary { display:grid; grid-template-columns:repeat(3, 1fr); gap:4mm; margin-top:5mm; }
  .primary-card { min-height:116mm; padding:3mm; border:.65mm solid #1f5fa6; border-radius:3mm; background:#ffffff; overflow:hidden; }
  .primary-card.look { border-color:#187f8c; } .primary-card.sort { border-color:#b36c16; } .primary-card.explain { border-color:#6c4fa2; }
  .primary-card h3 { margin:0; padding:0 0 2mm; border-bottom:.45mm solid currentColor; font-size:12pt; font-weight:800; text-align:center; }
  .primary-card.look h3 { color:#187f8c; } .primary-card.sort h3 { color:#a55c0b; } .primary-card.explain h3 { color:#60418f; }
  .primary-card p { margin:2.5mm 0; font-size:10.5pt; line-height:1.35; }
  .primary-icon { width:18mm; height:18mm; margin:2mm auto; border:.55mm solid currentColor; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#ffffff; font-size:15pt; font-weight:800; }
  .primary-model { height:40mm; display:flex; align-items:center; justify-content:center; margin:2mm 0; }
  .primary-model svg { width:100%; height:38mm; }
  .choice { display:block; margin:2.5mm 0; padding:1.5mm 2mm; border:.4mm solid #8d9aae; border-radius:2mm; background:#ffffff; font-size:10pt; line-height:1.2; }
  .choice::before { content:'□'; margin-right:2mm; font-size:14pt; vertical-align:-1pt; }
  .word-chip { display:inline-block; margin:1mm .8mm 1mm 0; padding:1.2mm 2mm; border:.4mm solid #77879b; border-radius:5mm; background:#ffffff; font-size:9pt; font-weight:700; }
  .short-line { height:10mm; margin-top:2.5mm; border-bottom:.5mm solid #64748b; }
  .prompt-label { margin-top:3mm; font-size:9.5pt; font-weight:800; }
  .big-box { height:48mm; border:.6mm dashed #2d72ad; border-radius:3mm; margin-top:4mm; display:flex; align-items:center; justify-content:center; color:#54718d; background:#ffffff; font-size:11pt; }
  .tick { display:block; margin:3mm 0; font-size:10pt; } .tick::before { content:'□'; margin-right:2mm; font-size:14pt; vertical-align:-1pt; }
  svg { max-width:100%; height:auto; }
  .concept-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:3mm; margin-top:3mm; }
  .concept-card { height:57mm; border:.5mm solid #1f5fa6; border-radius:2mm; overflow:hidden; background:#ffffff; }
  .concept-card h3 { margin:0; padding:1.6mm 2.3mm; color:#123a78; font-size:8.4pt; font-weight:800; border-bottom:.35mm solid #1f5fa6; text-align:center; }
  .concept-card .diagram { height:22mm; display:flex; align-items:center; justify-content:center; padding:1mm 2mm 0; }
  .concept-card .diagram svg { width:100%; height:21mm; }
  .concept-card p { margin:1.2mm 2.3mm; font-size:7.4pt; line-height:1.2; }
  .compact-questions { margin-top:3mm; }
  .compact-questions .q { min-height:26mm; padding:2.2mm; font-size:8.2pt; line-height:1.18; }
  .compact-questions .work { height:6mm; margin-top:1.5mm; }
  .punnett { width:100%; border-collapse:collapse; font-size:8pt; text-align:center; }
  .punnett td, .punnett th { border:.35mm solid #65748a; padding:1.1mm; }
  .punnett th { color:#123a78; background:#edf4fb; }
  /* Low-vision / VI mode: a visible support label is not sufficient. Keep
     all core information in a familiar sans-serif, high-contrast enlarged
     scale while preserving the one-page protected Science geometry. */
  .science-root[data-support-mode="visual"] { font-family:Arial, Helvetica, sans-serif; }
  .science-root[data-support-mode="visual"] .purpose { font-size:11pt; line-height:1.32; border-width:.7mm; }
  .science-root[data-support-mode="visual"] .card, .science-root[data-support-mode="visual"] .panel, .science-root[data-support-mode="visual"] .q, .science-root[data-support-mode="visual"] .strip { border-width:.7mm; }
  .science-root[data-support-mode="visual"] .card h3, .science-root[data-support-mode="visual"] .concept-card h3 { font-size:10.4pt; }
  .science-root[data-support-mode="visual"] .card p, .science-root[data-support-mode="visual"] .q { font-size:9.7pt; line-height:1.34; }
  .science-root[data-support-mode="visual"] .concept-card p, .science-root[data-support-mode="visual"] .compact-questions .q { font-size:9.1pt; line-height:1.28; }
  .science-root[data-support-mode="visual"] .strip { font-size:9.2pt; line-height:1.3; }
  .science-root[data-support-mode="visual"] .small { font-size:8.8pt !important; }
  .science-root[data-support-mode="visual"] .label-bank span { font-size:9pt; }
  @media print { .science-page { break-after: page; } }
  `;
}

function atomSvg(kind: number): string {
  if (kind === 1) return `<svg viewBox="0 0 120 90" aria-label="solid sphere model"><defs><radialGradient id="s" cx="35%" cy="30%"><stop stop-color="#fafafa"/><stop offset="1" stop-color="#8a959f"/></radialGradient></defs><circle cx="60" cy="45" r="33" fill="url(#s)" stroke="#46515e" stroke-width="2"/></svg>`;
  if (kind === 2) return `<svg viewBox="0 0 120 90" aria-label="plum pudding model"><circle cx="60" cy="45" r="34" fill="#f4b4c4" stroke="#95506a" stroke-width="2"/><g fill="#3772b9" stroke="#193f73"><circle cx="42" cy="31" r="5"/><circle cx="72" cy="27" r="5"/><circle cx="79" cy="55" r="5"/><circle cx="48" cy="58" r="5"/></g><g fill="#e5aa00" font-size="16" font-weight="bold"><text x="54" y="40">+</text><text x="66" y="65">+</text><text x="37" y="53">+</text></g></svg>`;
  if (kind === 3) return `<svg viewBox="0 0 120 90" aria-label="gold foil scattering result"><rect x="53" y="13" width="5" height="62" fill="#c59016"/><g stroke="#bb7d00" stroke-width="1.6"><path d="M10 25H53"/><path d="M10 40H53"/><path d="M10 55H53"/><path d="M58 25H110"/><path d="M58 40H110"/><path d="M58 55H90"/><path d="M58 55l35 18"/></g><g fill="#e6b300"><circle cx="20" cy="25" r="3"/><circle cx="35" cy="40" r="3"/><circle cx="20" cy="55" r="3"/></g></svg>`;
  if (kind === 4) return `<svg viewBox="0 0 120 90" aria-label="nuclear atom with electron shells"><circle cx="60" cy="45" r="9" fill="#d28c27" stroke="#855017"/><circle cx="60" cy="45" r="24" fill="none" stroke="#34445d"/><circle cx="60" cy="45" r="37" fill="none" stroke="#34445d"/><g fill="#2776bf" stroke="#123b63"><circle cx="60" cy="21" r="3"/><circle cx="60" cy="69" r="3"/><circle cx="23" cy="45" r="3"/><circle cx="97" cy="45" r="3"/></g><text x="57" y="50" font-size="14" font-weight="bold">+</text></svg>`;
  return `<svg viewBox="0 0 120 90" aria-label="atom with neutrons"><circle cx="60" cy="45" r="15" fill="#efe2e2" stroke="#6d5353"/><g fill="#d47a8b" stroke="#813b4e"><circle cx="53" cy="39" r="5"/><circle cx="67" cy="39" r="5"/><circle cx="53" cy="52" r="5"/></g><g fill="#f4f1ed" stroke="#777"><circle cx="67" cy="52" r="5"/><circle cx="60" cy="31" r="5"/></g><circle cx="60" cy="45" r="31" fill="none" stroke="#43516a"/><circle cx="88" cy="38" r="3" fill="#2776bf"/></svg>`;
}

function concentrationSvg(): string { return `<svg viewBox="0 0 170 120" aria-label="beaker showing solution, solvent and solute"><path d="M30 16h110l-10 89q-2 8-12 8H52q-10 0-12-8z" fill="#ffffff" stroke="#263b64" stroke-width="2"/><path d="M39 64h92l-5 40q-1 5-8 5H52q-7 0-8-5z" fill="#d9ecff" stroke="#4e83b8"/><g fill="#587ba3"><circle cx="60" cy="79" r="2"/><circle cx="77" cy="91" r="2"/><circle cx="99" cy="75" r="2"/><circle cx="111" cy="96" r="2"/></g><path d="M43 32h82" stroke="#263b64" stroke-width="1"/><text x="92" y="49" font-size="9" fill="#213657">solution</text><text x="92" y="76" font-size="9" fill="#213657">solvent</text><text x="92" y="98" font-size="9" fill="#213657">solute</text></svg>`; }

function latticeSvg(): string { const ions = Array.from({ length: 12 }, (_, i) => { const x = 28 + (i % 4) * 28; const y = 30 + Math.floor(i / 4) * 25; return `<circle cx="${x}" cy="${y}" r="10" fill="#d9d9d9" stroke="#555"/><text x="${x - 3}" y="${y + 4}" font-size="12" font-weight="bold">+</text>`; }).join(""); const electrons = Array.from({ length: 14 }, (_, i) => { const x = 19 + (i % 7) * 19; const y = 19 + Math.floor(i / 7) * 56; return `<circle cx="${x}" cy="${y}" r="3" fill="#4d93cf" stroke="#1d5b92"/>`; }).join(""); return `<svg viewBox="0 0 150 105" aria-label="metallic bonding particle model">${ions}${electrons}</svg>`; }

function header(options: ScienceLandscapeOptions, title: string, subtitle?: string): string {
  const support = supportNotes(options);
  return `<div class="head"><span class="tag">${esc(options.subject.toUpperCase())} | ${esc(options.yearGroup.toUpperCase())}</span><div class="head-title">${esc(title)}</div>${subtitle ? `<div class="head-sub">${esc(subtitle)}</div>` : ""}<div class="name">NAME: ____________________<br>DATE: ____________________</div>${support.length ? `<div class="support">Support: ${esc(support.join(" · "))}</div>` : ""}</div>`;
}

function timeline(options: ScienceLandscapeOptions): string {
  const models = [
    ["1803", "John Dalton", "Matter is made from tiny solid spheres called atoms."],
    ["1904", "J. J. Thomson", "Atoms contain negative electrons in a positive sphere."],
    ["1911", "Ernest Rutherford", "Most of an atom is empty space with a small positive nucleus."],
    ["1913", "Niels Bohr", "Electrons move around the nucleus in fixed energy levels."],
    ["1932", "James Chadwick", "The nucleus contains neutral particles called neutrons as well as protons."],
  ];
  return `<div class="science-root" data-send="${supportNotes(options).length ? "1" : "0"}" data-support-mode="${supportMode(options)}"><section class="science-page">${header(options, "ATOMIC STRUCTURE — HOW MODELS CHANGED")}<div class="purpose surface"><b>Task:</b> Complete the timeline. Use the word bank to add the missing scientist names and key ideas.</div><div class="timeline">${models.map((model, index) => `<div class="step surface"><div class="step-number">${index + 1}</div><div class="year">${model[0]}</div><div class="model">${atomSvg(index + 1)}</div><div class="name-slot">${index === 1 || index === 3 ? "________________" : model[1]}</div><div class="idea"><b>KEY IDEA</b>${index === 1 ? "Atoms are positive throughout with __________ and __________." : index === 3 ? "Electrons move around the nucleus in fixed __________." : model[2]}</div></div>`).join("")}</div><div class="wordbank surface"><strong>WORD BANK</strong><span>J. J. Thomson</span><span>electrons</span><span>positive charge</span><span>energy levels</span><span>neutrons</span></div></section></div>`;
}

function formula(options: ScienceLandscapeOptions): string {
  return `<div class="science-root" data-send="${supportNotes(options).length ? "1" : "0"}" data-support-mode="${supportMode(options)}"><section class="science-page">${header(options, "QUANTITATIVE CHEMISTRY — CONCENTRATION OF SOLUTIONS")}<div class="formula-grid"><div class="card formula-card surface"><h3>SOLUTION, SOLVENT AND SOLUTE</h3><div style="display:flex;align-items:center;gap:2mm;padding:2mm">${concentrationSvg()}<p class="small">A <b>solute</b> dissolves in a <b>solvent</b>. Together they make a <b>solution</b>.</p></div></div><div class="card formula-card surface"><h3>CONCENTRATION FORMULA</h3><div class="formula-box">concentration =<br><span style="font-size:11pt">mass of solute (g)</span><br><span style="font-size:9pt">───────────────</span><br><span style="font-size:11pt">volume of solution (dm³)</span></div><div class="formula-note">1000 cm³ = 1 dm³</div></div><div class="card formula-card surface"><h3>WORKED EXAMPLE</h3><p>A solution contains <b>12 g</b> of sodium chloride in <b>0.75 dm³</b> of water.</p><p class="hint">Calculate the concentration.</p><p style="text-align:center;font-size:11pt"><b>12 ÷ 0.75 = 16 g/dm³</b></p></div></div><div class="questions">${[
    ["Convert 250 cm³ to dm³.", "Answer: _________ dm³"],
    ["5.0 g of copper sulfate is dissolved in 0.50 dm³ of water. Calculate the concentration.", "Answer: _________ g/dm³"],
    ["A solution has a concentration of 24 g/dm³ and a volume of 0.40 dm³. Calculate the mass of solute.", "Answer: _________ g"],
    ["Solution A contains 8.0 g in 0.40 dm³. Solution B contains 12.0 g in 0.75 dm³. Which is more concentrated? Show your working.", "Answer: A / B"]
  ].map((question, index) => `<div class="q surface"><span class="qnum">${index + 1}</span>${question[0]}<div class="work"></div><b>${question[1]}</b></div>`).join("")}</div></section></div>`;
}

function interpretation(options: ScienceLandscapeOptions): string {
  return `<div class="science-root" data-send="${supportNotes(options).length ? "1" : "0"}" data-support-mode="${supportMode(options)}"><section class="science-page">${header(options, "METALLIC BONDING — STRUCTURE AND PROPERTIES", "Interpretation and practice")}<div class="purpose surface"><b>Key idea:</b> Metallic bonding is the strong electrostatic attraction between positive metal ions and delocalised electrons.</div><div class="two-col"><div class="panel surface"><h2>1. LABEL THE STRUCTURE</h2><p>Use the terms in the box to label the particle model.</p><div class="label-bank surface"><span>delocalised electrons</span><span>positive metal ions</span><span>layers can slide</span></div>${latticeSvg()}<div class="response">Label 1: __________________<br><br>Label 2: __________________<br><br>Label 3: __________________</div></div><div class="panel surface"><h2>2. MALLEABILITY</h2><p>The diagram shows layers of positive metal ions. A force can make the layers move.</p>${latticeSvg()}<p class="hint">Explain why the layers of ions can slide over each other without the bonding breaking.</p><div class="response"></div></div></div><div class="bottom-strip"><div class="strip surface"><b>TIP:</b> Positive metal ions are held together by a “sea” of delocalised electrons.</div><div class="strip surface"><b>THINK:</b> Which property of a metal does this structure explain: conductivity, malleability, or both?</div></div></section></div>`;
}

type PrimaryScienceLesson = {
  title: string;
  objective: string;
  look: string;
  sort: string;
  explain: string;
};

function primaryPlantSvg(): string {
  return `<svg viewBox="0 0 160 100" aria-label="simple labelled plant with roots, stem, leaves and flower"><path d="M78 86V34" stroke="#3e7a43" stroke-width="5"/><path d="M78 52L48 39M78 63l30-15" stroke="#3e7a43" stroke-width="4"/><ellipse cx="45" cy="36" rx="17" ry="9" fill="#ffffff" stroke="#3e7a43" stroke-width="3"/><ellipse cx="111" cy="45" rx="17" ry="9" fill="#ffffff" stroke="#3e7a43" stroke-width="3"/><circle cx="78" cy="27" r="13" fill="#ffffff" stroke="#bc6950" stroke-width="4"/><path d="M78 86c-10 4-18 8-27 13M78 86c10 4 18 8 27 13M78 86v14" stroke="#9a6b3c" stroke-width="3"/><text x="4" y="38" font-size="10">leaf</text><text x="117" y="23" font-size="10">flower</text><text x="87" y="70" font-size="10">stem</text><text x="87" y="96" font-size="10">roots</text></svg>`;
}

function primaryMatterSvg(): string {
  return `<svg viewBox="0 0 160 100" aria-label="three particle models labelled solid liquid and gas"><g fill="#ffffff" stroke="#3971a2" stroke-width="2"><rect x="5" y="18" width="42" height="50" rx="4"/><rect x="59" y="18" width="42" height="50" rx="4"/><rect x="113" y="18" width="42" height="50" rx="4"/></g><g fill="#3971a2"><circle cx="16" cy="29" r="4"/><circle cx="28" cy="29" r="4"/><circle cx="40" cy="29" r="4"/><circle cx="16" cy="42" r="4"/><circle cx="28" cy="42" r="4"/><circle cx="40" cy="42" r="4"/><circle cx="16" cy="55" r="4"/><circle cx="28" cy="55" r="4"/><circle cx="40" cy="55" r="4"/><circle cx="68" cy="34" r="4"/><circle cx="88" cy="29" r="4"/><circle cx="78" cy="48" r="4"/><circle cx="94" cy="56" r="4"/><circle cx="120" cy="27" r="4"/><circle cx="146" cy="43" r="4"/><circle cx="128" cy="59" r="4"/></g><text x="7" y="86" font-size="10">solid</text><text x="58" y="86" font-size="10">liquid</text><text x="115" y="86" font-size="10">gas</text></svg>`;
}

function primaryCircuitSvg(): string {
  return `<svg viewBox="0 0 160 100" aria-label="complete circuit with battery switch and bulb"><path d="M29 50h25m24 0h26m23 0h25M29 50V78h103V50" fill="none" stroke="#465c78" stroke-width="3"/><line x1="54" y1="36" x2="54" y2="64" stroke="#465c78" stroke-width="3"/><line x1="61" y1="30" x2="61" y2="70" stroke="#465c78" stroke-width="5"/><path d="M78 50h14l11-10" fill="none" stroke="#465c78" stroke-width="3"/><circle cx="130" cy="50" r="15" fill="#ffffff" stroke="#b26e18" stroke-width="3"/><path d="M122 42l16 16m0-16l-16 16" stroke="#b26e18" stroke-width="2"/><text x="33" y="22" font-size="10">battery</text><text x="76" y="22" font-size="10">switch</text><text x="120" y="22" font-size="10">bulb</text></svg>`;
}

function primaryLesson(options: ScienceLandscapeOptions): PrimaryScienceLesson {
  const topic = norm(options.topic);
  if (/(plant|flower|tree)/.test(topic)) return {
    title: "PLANTS — LOOK, SORT AND EXPLAIN",
    objective: "I can name the main parts of a plant.",
    look: `<p>Look at the plant.</p><div class="primary-model">${primaryPlantSvg()}</div><p>Point to each part.</p>`,
    sort: `<p>Match the labels to the plant.</p><span class="word-chip">root</span><span class="word-chip">stem</span><span class="word-chip">leaf</span><span class="word-chip">flower</span><p class="prompt-label">Tick what plants need.</p><span class="choice">water</span><span class="choice">light</span><span class="choice">soil</span>`,
    explain: `<p>Say it. Then write it.</p><p class="prompt-label">The roots take in</p><div class="short-line"></div><p class="prompt-label">A leaf helps a plant</p><div class="short-line"></div>`,
  };
  if (/(state|matter|solid|liquid|gas)/.test(topic)) return {
    title: "STATES OF MATTER — LOOK, SORT AND EXPLAIN",
    objective: "I can sort solids, liquids and gases.",
    look: `<p>Look at the particle pictures.</p><div class="primary-model">${primaryMatterSvg()}</div><p>A solid keeps its shape.</p>`,
    sort: `<p>Read each science fact.</p><span class="choice">A liquid can flow.</span><span class="choice">A gas fills its container.</span><span class="choice">A solid keeps its shape.</span>`,
    explain: `<p>Say it. Then write it.</p><p class="prompt-label">Ice is a</p><div class="short-line"></div><p class="prompt-label">Water vapour is a</p><div class="short-line"></div>`,
  };
  if (/(electric|circuit|battery)/.test(topic)) return {
    title: "ELECTRICITY — COMPLETE CIRCUITS",
    objective: "I can name the parts of a simple circuit.",
    look: `<p>Look at the complete circuit.</p><div class="primary-model">${primaryCircuitSvg()}</div><p>A complete circuit is a closed loop.</p>`,
    sort: `<p>Say the name of each part.</p><span class="word-chip">battery</span><span class="word-chip">switch</span><span class="word-chip">bulb</span><p class="prompt-label">Tick what makes the bulb light.</p><span class="choice">a closed loop</span><span class="choice">a gap in the wire</span>`,
    explain: `<p>Say it. Then write it.</p><p class="prompt-label">The battery gives</p><div class="short-line"></div><p class="prompt-label">The switch can</p><div class="short-line"></div>`,
  };
  const safeTopic = esc(options.topic || "Science");
  return {
    title: `${safeTopic.toUpperCase()} — LOOK, SORT AND EXPLAIN`,
    objective: `I can share one clear science idea about ${safeTopic}.`,
    look: `<p>Look at the model or real object.</p><div class="big-box">Draw one useful detail.</div><p>Say what you notice.</p>`,
    sort: `<p>Sort the ideas with your teacher.</p><span class="choice">I can see it.</span><span class="choice">I can test it.</span><span class="choice">I can explain it.</span>`,
    explain: `<p>Say it. Then write it.</p><p class="prompt-label">My science idea is</p><div class="short-line"></div><p class="prompt-label">I know this because</p><div class="short-line"></div>`,
  };
}

function primaryObservation(options: ScienceLandscapeOptions): string {
  const lesson = primaryLesson(options);
  return `<div class="science-root" data-send="${supportNotes(options).length ? "1" : "0"}" data-support-mode="${supportMode(options)}"><section class="science-page">${header(options, lesson.title)}<div class="purpose surface"><b>Today:</b> ${lesson.objective}</div><div class="primary"><div class="primary-card look surface"><div class="primary-icon">1</div><h3>LOOK</h3>${lesson.look}</div><div class="primary-card sort surface"><div class="primary-icon">2</div><h3>SORT</h3>${lesson.sort}</div><div class="primary-card explain surface"><div class="primary-icon">3</div><h3>SAY AND WRITE</h3>${lesson.explain}</div></div></section></div>`;
}

type ConceptCard = { heading: string; diagram: string; body: string };
type ConceptDefinition = {
  layout: ScienceLayoutKind;
  title: string;
  lead: string;
  simpleLead: string;
  cards: [ConceptCard, ConceptCard, ConceptCard];
  questions: [string, string, string, string];
  simpleQuestions: [string, string, string, string];
  leftFooter: string;
  rightFooter: string;
};

function learnerText(options: ScienceLandscapeOptions, standard: string, simpler: string): string {
  return (options.readingAge || 0) > 0 && (options.readingAge || 0) <= 10 ? simpler : standard;
}

function cellSvg(plant: boolean): string {
  if (plant) return `<svg viewBox="0 0 150 92" aria-label="plant cell with cell wall, vacuole, chloroplasts and nucleus"><rect x="17" y="8" width="116" height="76" rx="8" fill="#edf8ea" stroke="#356f3c" stroke-width="3"/><rect x="24" y="15" width="102" height="62" rx="7" fill="#f7fff4" stroke="#79a26d" stroke-width="2"/><rect x="51" y="23" width="46" height="46" rx="8" fill="#dcecf5" stroke="#6287a6"/><circle cx="39" cy="33" r="8" fill="#b98aaf" stroke="#734763"/><ellipse cx="109" cy="29" rx="7" ry="4" fill="#71a843"/><ellipse cx="110" cy="55" rx="7" ry="4" fill="#71a843"/><ellipse cx="37" cy="60" rx="7" ry="4" fill="#71a843"/><text x="20" y="91" font-size="8" fill="#264d2c">cell wall</text><text x="61" y="50" font-size="8" fill="#385f7a">vacuole</text></svg>`;
  return `<svg viewBox="0 0 150 92" aria-label="animal cell with membrane, cytoplasm, nucleus and mitochondria"><ellipse cx="75" cy="47" rx="58" ry="35" fill="#f4f7fb" stroke="#52739a" stroke-width="3"/><circle cx="65" cy="43" r="13" fill="#b98aaf" stroke="#734763" stroke-width="2"/><path d="M101 30c10 2 10 13 0 16c-10-3-10-14 0-16z" fill="#e1a63c" stroke="#946313"/><path d="M97 57c10 2 10 13 0 16c-10-3-10-14 0-16z" fill="#e1a63c" stroke="#946313"/><circle cx="42" cy="60" r="3" fill="#5c88b6"/><circle cx="49" cy="26" r="3" fill="#5c88b6"/><text x="20" y="90" font-size="8" fill="#365675">cell membrane</text></svg>`;
}

function leafSvg(): string { return `<svg viewBox="0 0 150 92" aria-label="leaf showing carbon dioxide entering and oxygen leaving during photosynthesis"><path d="M76 82C22 66 24 20 77 10c42 9 50 46-1 72z" fill="#7abf62" stroke="#2d713a" stroke-width="3"/><path d="M73 76L80 21M78 50L49 35M77 55l27-19" stroke="#ffffff" stroke-width="2"/><path d="M7 32h35" stroke="#355d9d" stroke-width="3"/><path d="M42 32l-9-5v10z" fill="#355d9d"/><path d="M111 57h32" stroke="#c25d5d" stroke-width="3"/><path d="M143 57l-9-5v10z" fill="#c25d5d"/><text x="2" y="25" font-size="9" fill="#294b7c">CO₂ in</text><text x="106" y="50" font-size="9" fill="#914040">O₂ out</text></svg>`; }

function forcesSvg(): string { return `<svg viewBox="0 0 150 92" aria-label="free body diagram showing balanced driving and resistive forces"><rect x="53" y="43" width="44" height="22" rx="4" fill="#dce8f5" stroke="#345b8a" stroke-width="2"/><circle cx="63" cy="69" r="6" fill="#4a596d"/><circle cx="88" cy="69" r="6" fill="#4a596d"/><path d="M52 51H14" stroke="#bc5949" stroke-width="3"/><path d="M14 51l9-5v10z" fill="#bc5949"/><path d="M98 51h38" stroke="#3d8b57" stroke-width="3"/><path d="M136 51l-9-5v10z" fill="#3d8b57"/><path d="M75 43V15" stroke="#7153a1" stroke-width="3"/><path d="M75 15l-5 9h10z" fill="#7153a1"/><path d="M75 75v12" stroke="#b98620" stroke-width="3"/><path d="M75 87l-5-9h10z" fill="#b98620"/><text x="1" y="45" font-size="8">resistance</text><text x="106" y="45" font-size="8">drive</text><text x="81" y="20" font-size="8">normal</text><text x="81" y="88" font-size="8">weight</text></svg>`; }

function energySvg(): string { return `<svg viewBox="0 0 150 92" aria-label="energy store transfer diagram"><rect x="7" y="27" width="39" height="35" rx="5" fill="#e2effa" stroke="#3973a4" stroke-width="2"/><rect x="104" y="27" width="39" height="35" rx="5" fill="#f9eadf" stroke="#bc7b38" stroke-width="2"/><path d="M49 45h51" stroke="#6852a2" stroke-width="4"/><path d="M100 45l-10-6v12z" fill="#6852a2"/><text x="12" y="44" font-size="8">kinetic</text><text x="12" y="54" font-size="8">store</text><text x="110" y="44" font-size="8">thermal</text><text x="110" y="54" font-size="8">store</text><text x="56" y="37" font-size="8">work done</text><text x="60" y="59" font-size="8">by friction</text></svg>`; }

function wavesSvg(): string { return `<svg viewBox="0 0 150 92" aria-label="transverse wave labelled with amplitude and wavelength"><path d="M8 49 C18 14 33 14 43 49 S68 84 78 49 S103 14 113 49 S138 84 146 49" fill="none" stroke="#2d6da8" stroke-width="3"/><path d="M8 49H146" stroke="#8797a8" stroke-dasharray="3 3"/><path d="M43 13V49" stroke="#a45b59" stroke-width="2"/><path d="M43 13l-4 7h8z" fill="#a45b59"/><path d="M43 49l-4-7h8z" fill="#a45b59"/><path d="M43 78H113" stroke="#53743d" stroke-width="2"/><path d="M43 78l7-4v8zM113 78l-7-4v8z" fill="#53743d"/><text x="46" y="31" font-size="8">amplitude</text><text x="65" y="89" font-size="8">wavelength</text></svg>`; }

function ionicSvg(): string { return `<svg viewBox="0 0 150 92" aria-label="ionic bonding diagram showing electron transfer from sodium to chlorine"><circle cx="33" cy="47" r="20" fill="#f5e4d5" stroke="#bd7d3c" stroke-width="2"/><circle cx="118" cy="47" r="20" fill="#e2edf9" stroke="#476f9d" stroke-width="2"/><text x="22" y="51" font-size="15" font-weight="bold">Na⁺</text><text x="108" y="51" font-size="15" font-weight="bold">Cl⁻</text><path d="M58 47h35" stroke="#7552a2" stroke-width="3"/><path d="M93 47l-9-5v10z" fill="#7552a2"/><text x="58" y="39" font-size="8">electron</text><circle cx="93" cy="57" r="3" fill="#284f86"/><text x="14" y="84" font-size="8">opposite charges attract</text></svg>`; }

function covalentSvg(): string { return `<svg viewBox="0 0 150 92" aria-label="water molecule showing shared electron pairs in covalent bonds"><text x="26" y="50" font-size="18" font-weight="bold">H</text><text x="69" y="50" font-size="20" font-weight="bold">O</text><text x="112" y="50" font-size="18" font-weight="bold">H</text><path d="M44 45h23M88 45h23" stroke="#35679d" stroke-width="3"/><circle cx="55" cy="40" r="2.3" fill="#35679d"/><circle cx="59" cy="50" r="2.3" fill="#b65a63"/><circle cx="96" cy="40" r="2.3" fill="#35679d"/><circle cx="100" cy="50" r="2.3" fill="#b65a63"/><circle cx="74" cy="25" r="2.3" fill="#b65a63"/><circle cx="80" cy="25" r="2.3" fill="#b65a63"/><circle cx="74" cy="67" r="2.3" fill="#b65a63"/><circle cx="80" cy="67" r="2.3" fill="#b65a63"/><text x="47" y="82" font-size="8">shared pairs form bonds</text></svg>`; }

function ratesSvg(): string { return `<svg viewBox="0 0 150 92" aria-label="product against time graph for rate of reaction"><path d="M24 10V75H142" fill="none" stroke="#40566f" stroke-width="2"/><path d="M25 73 C38 39 55 24 81 19 C104 15 126 15 140 15" fill="none" stroke="#3d8b57" stroke-width="3"/><path d="M33 61L65 29" stroke="#b35e50" stroke-width="2" stroke-dasharray="3 2"/><text x="3" y="14" font-size="8">product</text><text x="108" y="88" font-size="8">time</text><text x="46" y="48" font-size="8">steep = fast</text><text x="102" y="29" font-size="8">finished</text></svg>`; }

function conceptPage(options: ScienceLandscapeOptions, definition: ConceptDefinition): string {
  const lead = learnerText(options, definition.lead, definition.simpleLead);
  const questions = (options.readingAge || 0) > 0 && (options.readingAge || 0) <= 10 ? definition.simpleQuestions : definition.questions;
  return `<div class="science-root" data-send="${supportNotes(options).length ? "1" : "0"}" data-support-mode="${supportMode(options)}"><section class="science-page">${header(options, definition.title)}<div class="purpose surface"><b>Task:</b> ${esc(lead)}</div><div class="concept-grid">${definition.cards.map((card) => `<div class="concept-card surface"><h3>${esc(card.heading)}</h3><div class="diagram">${card.diagram}</div><p>${card.body}</p></div>`).join("")}</div><div class="questions compact-questions">${questions.map((question, index) => `<div class="q surface"><span class="qnum">${index + 1}</span>${esc(question)}<div class="work"></div></div>`).join("")}</div><div class="bottom-strip"><div class="strip surface"><b>REMEMBER:</b> ${definition.leftFooter}</div><div class="strip surface"><b>CHECK:</b> ${definition.rightFooter}</div></div></section></div>`;
}

function secondaryConcept(text: string): ConceptDefinition | null {
  if (/(cell|microscopy|microscope)/.test(text)) return {
    layout: "cells", title: "CELLS AND MICROSCOPY — COMPARE AND EXPLAIN", lead: "Compare the cell diagrams and link each structure to its function.", simpleLead: "Look at the cells. Match each part to its job.",
    cards: [
      { heading: "ANIMAL CELL", diagram: cellSvg(false), body: "Animal cells have a membrane, cytoplasm, nucleus, mitochondria and ribosomes." },
      { heading: "PLANT CELL", diagram: cellSvg(true), body: "Plant cells also have a cellulose cell wall, chloroplasts and a permanent vacuole." },
      { heading: "MICROSCOPE SKILL", diagram: `<svg viewBox="0 0 150 92" aria-label="microscope and magnification scale"><path d="M56 16l21 22-9 9-21-22zM67 42l15 15M72 22l12-10M67 57q23 0 24 19H43q1-19 24-19z" fill="none" stroke="#355f91" stroke-width="4"/><path d="M20 82h110" stroke="#3d5d78" stroke-width="3"/><text x="92" y="36" font-size="8">image size</text><text x="92" y="47" font-size="8">÷ real size</text></svg>`, body: "Magnification = image size ÷ real size. Use the same units before you calculate." }
    ],
    questions: ["Name two structures found in both plant and animal cells.", "Explain why chloroplasts are only found in plant cells.", "A 40 mm image represents a 0.02 mm cell. Calculate magnification.", "State one improvement an electron microscope gives over a light microscope."],
    simpleQuestions: ["Name two parts in both cells.", "Why does a plant cell need chloroplasts?", "A 40 mm picture shows a 0.02 mm cell. Find magnification.", "Give one way an electron microscope is better."],
    leftFooter: "A plant cell wall is made from cellulose.", rightFooter: "Use matching units in every magnification calculation."
  };
  if (/(photosynthesis|photo synthesis)/.test(text)) return {
    layout: "photosynthesis", title: "PHOTOSYNTHESIS — PROCESS AND VARIABLES", lead: "Use the model to explain how a leaf makes glucose.", simpleLead: "Use the picture to say how a leaf makes glucose.",
    cards: [
      { heading: "IN A LEAF", diagram: leafSvg(), body: "Carbon dioxide enters through stomata. Water reaches the leaf in xylem. Oxygen can leave." },
      { heading: "WORD EQUATION", diagram: `<svg viewBox="0 0 150 92" aria-label="photosynthesis word equation"><text x="8" y="35" font-size="10" font-weight="bold">carbon dioxide</text><text x="47" y="52" font-size="10">+ water</text><path d="M20 66h107" stroke="#3d8b57" stroke-width="3"/><path d="M127 66l-10-5v10z" fill="#3d8b57"/><text x="41" y="83" font-size="8">light and chlorophyll</text></svg>`, body: "carbon dioxide + water → glucose + oxygen. Light energy is absorbed by chlorophyll." },
      { heading: "RATE FACTORS", diagram: `<svg viewBox="0 0 150 92" aria-label="three factors affecting photosynthesis"><circle cx="28" cy="38" r="14" fill="#f6cf54" stroke="#bd8e16"/><path d="M75 23v31M61 39h28" stroke="#3e83b2" stroke-width="3"/><path d="M111 59c8-19 22-25 31-31" stroke="#4b984c" stroke-width="4"/><text x="9" y="76" font-size="8">light</text><text x="54" y="76" font-size="8">CO₂</text><text x="103" y="76" font-size="8">temperature</text></svg>`, body: "Light intensity, carbon dioxide concentration and temperature can change the rate." }
    ],
    questions: ["Write the word equation for photosynthesis.", "Explain why a plant needs chlorophyll.", "Name two variables that can limit the rate of photosynthesis.", "A plant is in darkness. State what happens to the photosynthesis rate."],
    simpleQuestions: ["Write the photosynthesis word equation.", "Why does a plant need chlorophyll?", "Name two things that change the rate.", "What happens in the dark?"],
    leftFooter: "Glucose may be used in respiration or stored as starch.", rightFooter: "Do not confuse photosynthesis with respiration."
  };
  if (/(genetic|inheritance|allele|punnett|\bgene\b|\bdna\b)/.test(text)) return {
    layout: "genetics", title: "GENETICS — ALLELES AND INHERITANCE", lead: "Interpret the genetic cross and use the key scientific terms.", simpleLead: "Use the square and the key words to answer.",
    cards: [
      { heading: "CORE WORDS", diagram: `<svg viewBox="0 0 150 92" aria-label="DNA chromosome gene relationship"><path d="M31 13c26 18 26 47 0 66M53 13c-26 18-26 47 0 66" fill="none" stroke="#7a58a2" stroke-width="4"/><path d="M31 24h22M31 43h22M31 62h22" stroke="#2f79b8" stroke-width="3"/><path d="M91 19v54M113 19v54" stroke="#b45b64" stroke-width="7"/><text x="12" y="90" font-size="8">DNA</text><text x="88" y="90" font-size="8">chromosome</text></svg>`, body: "DNA forms chromosomes. A gene is a short section of DNA. Alleles are forms of a gene." },
      { heading: "PUNNETT SQUARE", diagram: `<table class="punnett" aria-label="Punnett square for Bb crossed with Bb"><tr><th></th><th>B</th><th>b</th></tr><tr><th>B</th><td>BB</td><td>Bb</td></tr><tr><th>b</th><td>Bb</td><td>bb</td></tr></table>`, body: "For a Bb × Bb cross, B is dominant and b is recessive." },
      { heading: "READ THE RESULT", diagram: `<svg viewBox="0 0 150 92" aria-label="genetic cross outcome ratio"><rect x="16" y="24" width="88" height="17" fill="#6f9b56"/><rect x="16" y="42" width="29" height="17" fill="#d78690"/><text x="110" y="36" font-size="10">3 dominant</text><text x="110" y="55" font-size="10">1 recessive</text></svg>`, body: "The predicted phenotype ratio is 3 dominant : 1 recessive for this single-gene cross." }
    ],
    questions: ["Define the term allele.", "State the genotype of a heterozygous individual in the model.", "What is the probability of the recessive phenotype in the cross?", "Explain why a dominant allele can be expressed in Bb."],
    simpleQuestions: ["What is an allele?", "Which genotype is heterozygous?", "What chance is there of the recessive trait?", "Why can B show in Bb?"],
    leftFooter: "Genotype is the allele combination; phenotype is the shown characteristic.", rightFooter: "A Punnett square predicts probability, not certainty."
  };
  if (/(ionic)/.test(text)) return {
    layout: "ionic", title: "IONIC BONDING — ELECTRON TRANSFER", lead: "Use the diagram to explain how sodium chloride forms.", simpleLead: "Use the diagram to say how sodium chloride forms.",
    cards: [
      { heading: "ELECTRON TRANSFER", diagram: ionicSvg(), body: "A metal loses outer electrons. A non-metal gains them. This creates oppositely charged ions." },
      { heading: "IONIC LATTICE", diagram: `<svg viewBox="0 0 150 92" aria-label="giant ionic lattice with alternating positive and negative ions">${Array.from({ length: 12 }, (_, i) => { const x = 31 + (i % 4) * 28; const y = 25 + Math.floor(i / 4) * 23; const plus = (i + Math.floor(i / 4)) % 2 === 0; return `<circle cx="${x}" cy="${y}" r="9" fill="${plus ? "#f5ddd4" : "#dfeaf7"}" stroke="#55718e"/><text x="${x - 3}" y="${y + 4}" font-size="12">${plus ? "+" : "−"}</text>`; }).join("")}</svg>`, body: "A giant lattice has strong electrostatic attractions in every direction." },
      { heading: "PROPERTY LINK", diagram: `<svg viewBox="0 0 150 92" aria-label="ionic compound conducting when molten"><path d="M38 16v54q0 9 10 9h54q10 0 10-9V16" fill="#e7f3ff" stroke="#4b80b0" stroke-width="3"/><path d="M38 52h74" stroke="#4b80b0" stroke-width="2"/><circle cx="60" cy="61" r="4" fill="#cc6b5c"/><circle cx="83" cy="66" r="4" fill="#456eaa"/><text x="45" y="88" font-size="8">ions move when molten</text></svg>`, body: "Molten or dissolved ionic compounds conduct because ions can move and carry charge." }
    ],
    questions: ["State what happens to an electron when sodium reacts with chlorine.", "Explain why sodium becomes a positive ion.", "Name the force holding ions together in a giant ionic lattice.", "Explain why solid sodium chloride does not conduct electricity."],
    simpleQuestions: ["Where does sodium’s electron go?", "Why is sodium positive?", "What holds the ions together?", "Why does solid sodium chloride not conduct?"],
    leftFooter: "Ionic bonding is attraction between oppositely charged ions.", rightFooter: "Charges must balance in an ionic formula."
  };
  if (/(covalent)/.test(text)) return {
    layout: "covalent", title: "COVALENT BONDING — SHARED ELECTRONS", lead: "Use the model to explain how atoms form covalent bonds.", simpleLead: "Use the model to say how atoms form covalent bonds.",
    cards: [
      { heading: "SHARED PAIRS", diagram: covalentSvg(), body: "Covalent bonds form when atoms share pairs of electrons. The bonds between atoms are strong." },
      { heading: "SMALL MOLECULES", diagram: `<svg viewBox="0 0 150 92" aria-label="small covalent molecule showing weak forces between molecules"><circle cx="45" cy="46" r="18" fill="#e6f0fb" stroke="#4b75a1"/><circle cx="97" cy="46" r="18" fill="#e6f0fb" stroke="#4b75a1"/><path d="M63 46h16" stroke="#a66a6a" stroke-width="2" stroke-dasharray="3 3"/><text x="25" y="82" font-size="8">weak forces between molecules</text></svg>`, body: "Small molecules have weak forces between molecules, so many have low melting and boiling points." },
      { heading: "GIANT STRUCTURES", diagram: `<svg viewBox="0 0 150 92" aria-label="giant covalent network"><path d="M32 20l27 16-27 16-27-16zM86 20l27 16-27 16-27-16zM59 52l27 16-27 16-27-16z" fill="none" stroke="#527f52" stroke-width="2"/><text x="26" y="87" font-size="8">many strong covalent bonds</text></svg>`, body: "Giant covalent structures have many strong covalent bonds, giving very high melting points." }
    ],
    questions: ["State what is shared in a covalent bond.", "Name the molecule shown in the first model.", "Explain why small molecular substances often have low boiling points.", "State one difference between a small molecule and a giant covalent structure."],
    simpleQuestions: ["What is shared in a covalent bond?", "Name the first molecule.", "Why do small molecules boil easily?", "Give one difference between the two structures."],
    leftFooter: "Do not break covalent bonds when a small molecule boils.", rightFooter: "Use a line to show one shared electron pair."
  };
  if (/(rate|reaction rate|collision)/.test(text)) return {
    layout: "rates", title: "RATES OF REACTION — DATA AND COLLISIONS", lead: "Interpret the graph and explain why conditions change reaction rate.", simpleLead: "Read the graph. Say why a reaction can be faster.",
    cards: [
      { heading: "RATE GRAPH", diagram: ratesSvg(), body: "The gradient shows rate. A steep gradient means a faster reaction. A flat line means the reaction has finished." },
      { heading: "MEAN RATE", diagram: `<svg viewBox="0 0 150 92" aria-label="mean rate formula"><text x="24" y="38" font-size="13" font-weight="bold">rate = amount</text><path d="M32 45h79" stroke="#385f8d" stroke-width="2"/><text x="48" y="63" font-size="13" font-weight="bold">time</text><text x="29" y="82" font-size="8">g/s or cm³/s</text></svg>`, body: "Mean rate = quantity of reactant used or product formed ÷ time taken." },
      { heading: "COLLISION THEORY", diagram: `<svg viewBox="0 0 150 92" aria-label="particle collision model"><circle cx="40" cy="39" r="11" fill="#de8c70"/><circle cx="78" cy="39" r="11" fill="#6e9fce"/><path d="M53 39h12" stroke="#7552a2" stroke-width="3"/><path d="M65 39l-8-5v10z" fill="#7552a2"/><circle cx="55" cy="70" r="11" fill="#de8c70"/><circle cx="91" cy="70" r="11" fill="#6e9fce"/><text x="15" y="88" font-size="8">successful collisions need enough energy</text></svg>`, body: "Reactions happen when particles collide with enough energy. More frequent successful collisions increase rate." }
    ],
    questions: ["A reaction makes 36 cm³ of gas in 12 s. Calculate the mean rate.", "State what a flat section of a product-time graph means.", "Explain how increasing temperature changes collision rate.", "Name one factor, other than temperature, that increases rate."],
    simpleQuestions: ["36 cm³ forms in 12 s. Find the mean rate.", "What does a flat graph line mean?", "How does heating make reactions faster?", "Name one other way to make a reaction faster."],
    leftFooter: "A catalyst provides a route with lower activation energy.", rightFooter: "Always include units in a calculated rate."
  };
  if (/(force|motion|newton)/.test(text)) return {
    layout: "forces", title: "FORCES — RESULTANT AND MOTION", lead: "Read the force diagram and use the equations to explain the motion.", simpleLead: "Read the force picture. Use the equations to answer.",
    cards: [
      { heading: "FREE-BODY MODEL", diagram: forcesSvg(), body: "Forces are vectors: they have size and direction. Balanced forces have a zero resultant." },
      { heading: "RESULTANT FORCE", diagram: `<svg viewBox="0 0 150 92" aria-label="resultant force arrows"><path d="M13 40h43" stroke="#c35d4d" stroke-width="5"/><path d="M56 40l-11-7v14z" fill="#c35d4d"/><path d="M137 58H76" stroke="#3e8a58" stroke-width="5"/><path d="M76 58l11-7v14z" fill="#3e8a58"/><text x="19" y="31" font-size="9">400 N</text><text x="104" y="79" font-size="9">650 N</text><text x="43" y="89" font-size="8">resultant = 250 N left</text></svg>`, body: "For forces in one straight line, subtract opposing forces to find the resultant." },
      { heading: "EQUATIONS", diagram: `<svg viewBox="0 0 150 92" aria-label="force equations"><text x="28" y="36" font-size="16" font-weight="bold">F = m × a</text><text x="24" y="65" font-size="16" font-weight="bold">W = m × g</text><text x="26" y="84" font-size="8">use kg, m/s² and N</text></svg>`, body: "A resultant force changes velocity. Weight is the force caused by gravity." }
    ],
    questions: ["Two forces are 700 N right and 450 N left. Calculate the resultant.", "State what happens to velocity when resultant force is zero.", "Calculate the weight of a 3 kg object where g = 9.8 N/kg.", "A 4 kg trolley accelerates at 2 m/s². Calculate the resultant force."],
    simpleQuestions: ["700 N right and 450 N left. Find the resultant.", "What happens when resultant force is zero?", "Find the weight of 3 kg when g = 9.8 N/kg.", "A 4 kg trolley accelerates at 2 m/s². Find force."],
    leftFooter: "Mass is measured in kg; weight is measured in N.", rightFooter: "A zero resultant can mean stationary or constant velocity."
  };
  if (/(energy|kinetic|conservation)/.test(text)) return {
    layout: "energy", title: "ENERGY STORES — TRANSFER AND DISSIPATION", lead: "Track energy stores and explain how energy is transferred or dissipated.", simpleLead: "Track where energy starts and where it goes.",
    cards: [
      { heading: "STORE CHANGE", diagram: energySvg(), body: "Energy is stored in kinetic, thermal, chemical, gravitational and other stores. It is transferred between stores." },
      { heading: "USEFUL OR DISSIPATED", diagram: `<svg viewBox="0 0 150 92" aria-label="useful and dissipated energy bars"><rect x="21" y="22" width="37" height="48" fill="#5d9a57"/><rect x="83" y="45" width="37" height="25" fill="#d18753"/><text x="17" y="84" font-size="8">useful output</text><text x="75" y="84" font-size="8">dissipated</text></svg>`, body: "Energy cannot be created or destroyed. Dissipated energy is often spread to the surroundings thermally." },
      { heading: "KINETIC ENERGY", diagram: `<svg viewBox="0 0 150 92" aria-label="kinetic energy equation"><text x="20" y="45" font-size="17" font-weight="bold">Eₖ = ½ m v²</text><text x="28" y="69" font-size="8">energy in J, mass in kg, speed in m/s</text></svg>`, body: "Use the correct units. Doubling speed has a larger effect than doubling mass because speed is squared." }
    ],
    questions: ["A moving bicycle stops. Name the initial and final main energy stores.", "State one pathway that transfers energy when brakes act.", "Calculate kinetic energy for a 2 kg object moving at 3 m/s.", "Explain one way to reduce unwanted energy transfer in a machine."],
    simpleQuestions: ["A bike stops. Name its first and last main stores.", "How do brakes transfer energy?", "Find kinetic energy for 2 kg moving at 3 m/s.", "How can a machine waste less energy?"],
    leftFooter: "Energy is conserved in a closed system.", rightFooter: "Dissipated does not mean destroyed."
  };
  if (/(wave|wavelength|frequency|amplitude)/.test(text)) return {
    layout: "waves", title: "WAVES — DESCRIBE AND CALCULATE", lead: "Label the wave model and apply the wave equation.", simpleLead: "Label the wave and use the equation.",
    cards: [
      { heading: "TRANSVERSE WAVE", diagram: wavesSvg(), body: "Amplitude is maximum displacement. Wavelength is the distance between matching points on adjacent waves." },
      { heading: "LONGITUDINAL WAVE", diagram: `<svg viewBox="0 0 150 92" aria-label="longitudinal wave with compressions and rarefactions">${Array.from({ length: 13 }, (_, i) => `<line x1="${17 + i * 9}" y1="24" x2="${17 + i * 9}" y2="68" stroke="#527fac" stroke-width="${i % 5 < 3 ? 3 : 1}"/>`).join("")}<text x="15" y="84" font-size="8">compression</text><text x="87" y="84" font-size="8">rarefaction</text></svg>`, body: "Longitudinal waves have compressions and rarefactions. Sound in air is longitudinal." },
      { heading: "WAVE EQUATION", diagram: `<svg viewBox="0 0 150 92" aria-label="wave speed formula"><text x="28" y="44" font-size="18" font-weight="bold">v = f × λ</text><text x="22" y="70" font-size="8">m/s = Hz × m</text></svg>`, body: "Frequency is waves per second. Wave speed is the speed energy moves through a medium." }
    ],
    questions: ["State the difference between a transverse and a longitudinal wave.", "Identify the amplitude and wavelength on the first diagram.", "Calculate wave speed for f = 5 Hz and λ = 2 m.", "State what travels in a sound wave: particles, energy, or both."],
    simpleQuestions: ["How are transverse and longitudinal waves different?", "Show amplitude and wavelength on the first diagram.", "Find wave speed when f = 5 Hz and λ = 2 m.", "What travels in a sound wave?"],
    leftFooter: "Waves transfer energy, not matter from source to receiver.", rightFooter: "Use metres for wavelength in the equation."
  };
  return null;
}

export function canRenderScienceLandscape(options: ScienceLandscapeOptions): boolean {
  const subject = norm(options.subject);
  if (!/(science|biology|chemistry|physics)/.test(subject)) return false;
  if (isPrimary(options.yearGroup)) return true;
  const text = norm(`${options.topic} ${options.subtopic || ""}`);
  return /(atomic|model|concentration|solution|metallic)/.test(text) || secondaryConcept(text) !== null;
}

export function renderScienceLandscape(options: ScienceLandscapeOptions): ScienceLandscapeDocument {
  const text = norm(`${options.topic} ${options.subtopic || ""}`);
  const primary = isPrimary(options.yearGroup);
  const concept = secondaryConcept(text);
  const layout: ScienceLayoutKind = primary ? "primary-observation" : /(atomic|model)/.test(text) ? "timeline" : /(concentration|solution)/.test(text) ? "formula" : /(metallic)/.test(text) ? "interpretation" : concept?.layout || "primary-observation";
  const title = primary ? `${options.topic || "Science"} — Look, Sort and Explain` : layout === "timeline" ? "Atomic Structure — How Models Changed" : layout === "formula" ? "Concentration of Solutions" : layout === "interpretation" ? "Metallic Bonding — Structure and Properties" : concept?.title || "Science";
  const body = layout === "timeline" ? timeline(options) : layout === "formula" ? formula(options) : layout === "interpretation" ? interpretation(options) : layout === "primary-observation" ? primaryObservation(options) : conceptPage(options, concept!);
  const html = `<!doctype html><html><head><meta charset="UTF-8"><title>${esc(title)}</title><style>${scienceCss()}</style></head><body>${body}</body></html>`;
  return { title, layout, html, adaptations: supportNotes(options) };
}
