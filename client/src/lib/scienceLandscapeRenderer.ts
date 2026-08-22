export type ScienceLayoutKind = "timeline" | "formula" | "interpretation" | "primary-observation";

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

function scienceCss(): string {
  return `
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; color: #17223b; font-family: Arial, Helvetica, sans-serif; }
  .science-root { width: 285mm; }
  .science-page { position: relative; width: 285mm; height: 200mm; overflow: hidden; background: #ffffff; padding: 8mm; }
  .science-page, .science-page * { background-color: transparent; }
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
  .primary { display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:4mm; margin-top:5mm; }
  .primary .card { min-height:116mm; padding:3mm; } .primary h3 { font-size:12pt; } .primary p { font-size:10.5pt; line-height:1.35; }
  .big-box { height:62mm; border:.6mm dashed #2d72ad; border-radius:3mm; margin-top:5mm; display:flex; align-items:center; justify-content:center; color:#54718d; font-size:11pt; }
  .tick { display:block; margin:3mm 0; font-size:10pt; } .tick::before { content:'□'; margin-right:2mm; font-size:14pt; vertical-align:-1pt; }
  svg { max-width:100%; height:auto; }
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
  return `<div class="science-root" data-send="${supportNotes(options).length ? "1" : "0"}"><section class="science-page">${header(options, "ATOMIC STRUCTURE — HOW MODELS CHANGED")}<div class="purpose surface"><b>Task:</b> Complete the timeline. Use the word bank to add the missing scientist names and key ideas.</div><div class="timeline">${models.map((model, index) => `<div class="step surface"><div class="step-number">${index + 1}</div><div class="year">${model[0]}</div><div class="model">${atomSvg(index + 1)}</div><div class="name-slot">${index === 1 || index === 3 ? "________________" : model[1]}</div><div class="idea"><b>KEY IDEA</b>${index === 1 ? "Atoms are positive throughout with __________ and __________." : index === 3 ? "Electrons move around the nucleus in fixed __________." : model[2]}</div></div>`).join("")}</div><div class="wordbank surface"><strong>WORD BANK</strong><span>J. J. Thomson</span><span>electrons</span><span>positive charge</span><span>energy levels</span><span>neutrons</span></div></section></div>`;
}

function formula(options: ScienceLandscapeOptions): string {
  return `<div class="science-root" data-send="${supportNotes(options).length ? "1" : "0"}"><section class="science-page">${header(options, "QUANTITATIVE CHEMISTRY — CONCENTRATION OF SOLUTIONS")}<div class="formula-grid"><div class="card formula-card surface"><h3>SOLUTION, SOLVENT AND SOLUTE</h3><div style="display:flex;align-items:center;gap:2mm;padding:2mm">${concentrationSvg()}<p class="small">A <b>solute</b> dissolves in a <b>solvent</b>. Together they make a <b>solution</b>.</p></div></div><div class="card formula-card surface"><h3>CONCENTRATION FORMULA</h3><div class="formula-box">concentration =<br><span style="font-size:11pt">mass of solute (g)</span><br><span style="font-size:9pt">───────────────</span><br><span style="font-size:11pt">volume of solution (dm³)</span></div><div class="formula-note">1000 cm³ = 1 dm³</div></div><div class="card formula-card surface"><h3>WORKED EXAMPLE</h3><p>A solution contains <b>12 g</b> of sodium chloride in <b>0.75 dm³</b> of water.</p><p class="hint">Calculate the concentration.</p><p style="text-align:center;font-size:11pt"><b>12 ÷ 0.75 = 16 g/dm³</b></p></div></div><div class="questions">${[
    ["Convert 250 cm³ to dm³.", "Answer: _________ dm³"],
    ["5.0 g of copper sulfate is dissolved in 0.50 dm³ of water. Calculate the concentration.", "Answer: _________ g/dm³"],
    ["A solution has a concentration of 24 g/dm³ and a volume of 0.40 dm³. Calculate the mass of solute.", "Answer: _________ g"],
    ["Solution A contains 8.0 g in 0.40 dm³. Solution B contains 12.0 g in 0.75 dm³. Which is more concentrated? Show your working.", "Answer: A / B"]
  ].map((question, index) => `<div class="q surface"><span class="qnum">${index + 1}</span>${question[0]}<div class="work"></div><b>${question[1]}</b></div>`).join("")}</div></section></div>`;
}

function interpretation(options: ScienceLandscapeOptions): string {
  return `<div class="science-root" data-send="${supportNotes(options).length ? "1" : "0"}"><section class="science-page">${header(options, "METALLIC BONDING — STRUCTURE AND PROPERTIES", "Interpretation and practice")}<div class="purpose surface"><b>Key idea:</b> Metallic bonding is the strong electrostatic attraction between positive metal ions and delocalised electrons.</div><div class="two-col"><div class="panel surface"><h2>1. LABEL THE STRUCTURE</h2><p>Use the terms in the box to label the particle model.</p><div class="label-bank surface"><span>delocalised electrons</span><span>positive metal ions</span><span>layers can slide</span></div>${latticeSvg()}<div class="response">Label 1: __________________<br><br>Label 2: __________________<br><br>Label 3: __________________</div></div><div class="panel surface"><h2>2. MALLEABILITY</h2><p>The diagram shows layers of positive metal ions. A force can make the layers move.</p>${latticeSvg()}<p class="hint">Explain why the layers of ions can slide over each other without the bonding breaking.</p><div class="response"></div></div></div><div class="bottom-strip"><div class="strip surface"><b>TIP:</b> Positive metal ions are held together by a “sea” of delocalised electrons.</div><div class="strip surface"><b>THINK:</b> Which property of a metal does this structure explain: conductivity, malleability, or both?</div></div></section></div>`;
}

function primaryObservation(options: ScienceLandscapeOptions): string {
  const topic = options.topic || "Plants";
  return `<div class="science-root" data-send="${supportNotes(options).length ? "1" : "0"}"><section class="science-page">${header(options, topic.toUpperCase() + " — LOOK, SORT AND EXPLAIN")}<div class="purpose surface"><b>Today:</b> Look closely. Say what you notice. Record one science idea.</div><div class="primary"><div class="card surface"><h3>1. LOOK</h3><p>Look at the object, photo or real item your teacher gives you.</p><div class="big-box">Draw what you see here.</div></div><div class="card surface"><h3>2. SORT</h3><p>Tick the words that match.</p><span class="tick">hard</span><span class="tick">soft</span><span class="tick">living</span><span class="tick">not living</span><span class="tick">rough</span><span class="tick">smooth</span></div><div class="card surface"><h3>3. SAY AND WRITE</h3><p>Finish the sentence.</p><p>I notice that it is</p><div class="big-box" style="height:25mm">________________</div><p>My science word is</p><div class="big-box" style="height:25mm">________________</div></div></div></section></div>`;
}

export function canRenderScienceLandscape(options: ScienceLandscapeOptions): boolean {
  const subject = norm(options.subject);
  if (!/(science|biology|chemistry|physics)/.test(subject)) return false;
  if (isPrimary(options.yearGroup)) return true;
  const text = norm(`${options.topic} ${options.subtopic || ""}`);
  return /(atomic|model|concentration|solution|metallic|bonding)/.test(text);
}

export function renderScienceLandscape(options: ScienceLandscapeOptions): ScienceLandscapeDocument {
  const text = norm(`${options.topic} ${options.subtopic || ""}`);
  const primary = isPrimary(options.yearGroup);
  const layout: ScienceLayoutKind = primary ? "primary-observation" : /(atomic|model)/.test(text) ? "timeline" : /(concentration|solution)/.test(text) ? "formula" : "interpretation";
  const title = primary ? `${options.topic || "Science"} — Look, Sort and Explain` : layout === "timeline" ? "Atomic Structure — How Models Changed" : layout === "formula" ? "Concentration of Solutions" : "Metallic Bonding — Structure and Properties";
  const html = `<!doctype html><html><head><meta charset="UTF-8"><title>${esc(title)}</title><style>${scienceCss()}</style></head><body>${layout === "timeline" ? timeline(options) : layout === "formula" ? formula(options) : layout === "interpretation" ? interpretation(options) : primaryObservation(options)}</body></html>`;
  return { title, layout, html, adaptations: supportNotes(options) };
}
