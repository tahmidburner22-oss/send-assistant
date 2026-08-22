export type HumanitiesLayoutKind = "english-reading-writing" | "history-source-judgement" | "geography-data-evaluation";

export interface HumanitiesLandscapeOptions {
  subject: string;
  yearGroup: string;
  topic: string;
  subtopic?: string;
  sendNeedId?: string;
  readingAge?: number;
  examBoard?: string;
}

export interface HumanitiesLandscapeDocument {
  title: string;
  layout: HumanitiesLayoutKind;
  html: string;
  adaptations: string[];
}

const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
const norm = (value = "") => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const isSecondary = (yearGroup: string) => /^Year\s+(?:7|8|9|10|11)$/i.test(yearGroup || "");

function supportNotes(options: HumanitiesLandscapeOptions): string[] {
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
      "visual impairment": "Visual support",
      "hearing impairment": "Hearing support",
    };
    notes.push(known[need] || options.sendNeedId!.replace(/\s*\([^)]*\)/g, ""));
  }
  if ((options.readingAge || 0) > 0) notes.push(`Age ${options.readingAge}`);
  return notes;
}

function learnerText(options: HumanitiesLandscapeOptions, standard: string, simpler: string): string {
  return (options.readingAge || 0) > 0 && (options.readingAge || 0) <= 10 ? simpler : standard;
}

function styles(): string {
  return `
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; background:#ffffff; color:#17223b; font-family:Arial, Helvetica, sans-serif; }
    .humanities-root { width:285mm; }
    .humanities-page { position:relative; width:285mm; height:200mm; overflow:hidden; background:#ffffff; padding:8mm; page-break-after:always; }
    .humanities-page:last-child { page-break-after:auto; }
    .surface { background:#ffffff; }
    .head { height:24mm; border-bottom:.9mm solid #184b83; position:relative; padding-bottom:2mm; }
    .tag { display:inline-block; border:.5mm solid #184b83; border-radius:2mm; padding:1.25mm 3mm; color:#184b83; font-size:7.8pt; font-weight:800; letter-spacing:.12mm; background:#ffffff; }
    .head-title { margin:2mm 37mm 0; text-align:center; font-size:18pt; line-height:1.05; color:#123562; font-weight:800; letter-spacing:.12mm; }
    .head-sub { margin-top:1mm; text-align:center; color:#345479; font-size:8.4pt; font-weight:700; }
    .name { position:absolute; top:0; right:0; width:43mm; border:.4mm solid #24354d; border-radius:1.7mm; padding:1.4mm 2mm; font-size:6.8pt; line-height:2.7mm; background:#ffffff; }
    .support { position:absolute; right:0; top:14mm; color:#1f5fa6; font-size:6.2pt; font-weight:800; white-space:nowrap; }
    .purpose { margin-top:3mm; min-height:10mm; border:.45mm solid #2a6fa9; border-radius:2mm; padding:2.2mm 3mm; color:#213951; font-size:8.7pt; line-height:1.25; background:#ffffff; }
    .purpose b { color:#123562; }
    .grid { display:grid; gap:3mm; margin-top:3mm; }
    .two { grid-template-columns:1.15fr .85fr; }
    .three { grid-template-columns:repeat(3, 1fr); }
    .card { border:.45mm solid #2a6fa9; border-radius:2mm; overflow:hidden; background:#ffffff; }
    .card h2, .card h3 { margin:0; padding:1.8mm 2.8mm; color:#123562; font-size:9pt; font-weight:800; border-bottom:.35mm solid #89b0d1; }
    .card p { margin:2mm 2.8mm; font-size:8.25pt; line-height:1.29; }
    .source { min-height:70mm; padding:3mm 4mm; font-family:Georgia, "Times New Roman", serif; font-size:9.4pt; line-height:1.38; border:.45mm solid #2a6fa9; border-radius:2mm; background:#ffffff; }
    .source-title { margin-bottom:2mm; color:#123562; font-family:Arial, Helvetica, sans-serif; font-size:8.3pt; font-weight:800; letter-spacing:.08mm; }
    .source p { margin:0 0 3mm; }
    .mini { min-height:36mm; }
    .mini p { font-size:7.9pt; line-height:1.22; }
    .cue { color:#123562; font-weight:800; }
    .linebox { min-height:24mm; margin:2mm 2.8mm; border-bottom:.35mm solid #9aa9b7; background:repeating-linear-gradient(to bottom, transparent 0, transparent 6.7mm, #c8d2dc 6.8mm, transparent 7.1mm); }
    .linebox.tall { min-height:24mm; }
    .linebox.large { min-height:46mm; }
    .label { display:inline-block; min-width:7mm; margin-right:1.5mm; border:.35mm solid #2a6fa9; border-radius:1.2mm; padding:.45mm 1.4mm; color:#123562; font-size:7.3pt; font-weight:800; text-align:center; background:#ffffff; }
    .point { margin:2mm 2.8mm; font-size:8.15pt; line-height:1.25; }
    .word-row { display:flex; flex-wrap:wrap; gap:1.5mm; margin:2.5mm; }
    .word { border:.35mm solid #6f96ba; border-radius:1.4mm; padding:1.1mm 1.9mm; color:#274f77; font-size:7.5pt; font-weight:700; background:#ffffff; }
    .plan-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:3mm; margin-top:3mm; }
    .plan { min-height:39mm; border:.45mm solid #2a6fa9; border-radius:2mm; background:#ffffff; }
    .plan h3 { font-size:8.4pt; }
    .check { display:block; margin:2mm 2.8mm; font-size:7.9pt; line-height:1.25; }
    .check::before { content:"□"; margin-right:1.5mm; color:#123562; font-size:10pt; vertical-align:-.7pt; }
    .footer { position:absolute; left:8mm; right:8mm; bottom:5mm; display:grid; grid-template-columns:1fr 1fr; gap:3mm; }
    .footer > div { min-height:11mm; border:.4mm solid #2a6fa9; border-radius:2mm; padding:2mm 3mm; background:#ffffff; font-size:7.8pt; line-height:1.22; }
    .footer b { color:#123562; }
    .timeline { display:grid; grid-template-columns:repeat(4, 1fr); gap:2mm; margin:3mm 0; }
    .time { min-height:26mm; border:.4mm solid #7ba1c5; border-radius:2mm; padding:2mm; background:#ffffff; }
    .time b { display:block; color:#123562; font-size:7.8pt; }
    .time span { display:block; margin-top:1mm; font-size:7.3pt; line-height:1.22; }
    .source-meta { display:grid; grid-template-columns:repeat(3, 1fr); gap:2mm; margin-top:3mm; }
    .history-review .linebox.tall { min-height:9mm; margin-top:1mm; margin-bottom:1mm; }
    .history-review .card p { font-size:7.45pt; line-height:1.15; }
    .history-source-check .source-meta { margin-top:1.5mm; }
    .history-source-check .meta { min-height:15mm; }
    .history-source-check .linebox { min-height:11mm; margin-top:1mm; margin-bottom:1mm; }
    .history-source-check p { margin-top:1.5mm; margin-bottom:1.5mm; }
    .meta { min-height:20mm; border:.4mm solid #7ba1c5; border-radius:2mm; padding:2mm; background:#ffffff; }
    .meta b { display:block; color:#123562; font-size:7.3pt; }
    .meta span { display:block; margin-top:1mm; font-size:7.1pt; line-height:1.2; }
    .data-layout { display:grid; grid-template-columns:.85fr 1.15fr; gap:3mm; margin-top:3mm; }
    .data-table { width:100%; border-collapse:collapse; font-size:8pt; }
    .data-table th, .data-table td { border:.35mm solid #6f96ba; padding:1.4mm; text-align:center; background:#ffffff; }
    .data-table th { color:#123562; font-weight:800; }
    .bar { display:flex; align-items:center; gap:2mm; margin:2.3mm 2.8mm; font-size:7.8pt; }
    .bar i { display:block; height:5mm; border:.35mm solid #2a6fa9; background:#ffffff; }
    .stakeholder { margin:2mm 2.8mm; padding:1.8mm; border:.35mm solid #7ba1c5; border-radius:1.5mm; font-size:7.7pt; line-height:1.2; background:#ffffff; }
    @media print { .humanities-page { break-after:page; } .humanities-page:last-child { break-after:auto; } }
  `;
}

function header(options: HumanitiesLandscapeOptions, title: string, subtitle: string): string {
  const support = supportNotes(options);
  return `<div class="head"><span class="tag">${esc(options.subject.toUpperCase())} | ${esc(options.yearGroup.toUpperCase())}</span><div class="head-title">${esc(title)}</div><div class="head-sub">${esc(subtitle)}</div><div class="name">NAME: ____________________<br>DATE: ____________________</div>${support.length ? `<div class="support">Support: ${esc(support.join(" · "))}</div>` : ""}</div>`;
}

function english(options: HumanitiesLandscapeOptions): string {
  const simple = (options.readingAge || 0) > 0 && (options.readingAge || 0) <= 10;
  const task = learnerText(options, "Read the original extract. Select precise evidence, then explain the writer’s method and effect.", "Read the short extract. Find a useful quote. Say what it shows and why it matters.");
  const analysisPrompt = learnerText(options, "How does the writer use language to make the place feel uncertain?", "How does the writer make the place feel worrying?");
  const writingPrompt = learnerText(options, "Write the opening of a narrative in which a familiar place suddenly feels different. Shape the reader’s response through deliberate language and structure.", "Write the start of a story where a familiar place suddenly feels different. Use details to make the reader feel something.");
  return `<div class="humanities-root" data-send="${supportNotes(options).length ? "1" : "0"}">
    <section class="humanities-page">${header(options, "ENGLISH LANGUAGE — READING AND ANALYSIS", "Original practice extract · evidence, method and effect")}
      <div class="purpose surface"><b>Task:</b> ${esc(task)}</div>
      <div class="grid two"><article class="source surface"><div class="source-title">ORIGINAL FICTION EXTRACT: THE LAST LIGHT</div><p>By the time Nadiya reached the end of the lane, the streetlamps had begun to flicker. Their light did not disappear all at once. Instead, each pool of yellow shrank, leaving long strips of pavement in shadow.</p><p>She slowed near the empty bus stop. A timetable rattled behind its glass panel, though there was no wind. Across the road, the familiar corner shop stood with its shutters down. It looked less like a shop and more like a closed eye.</p><p>Then one lamp steadied. Its pale circle reached the pavement at her feet, but nowhere else. Nadiya listened. The lane seemed to be holding its breath.</p></article><div class="grid"><section class="card mini surface"><h3>VOCABULARY AND METHOD</h3><div class="word-row"><span class="word">flicker</span><span class="word">shadow</span><span class="word">rattled</span><span class="word">simile</span><span class="word">personification</span></div><p><span class="cue">Choose:</span> Which word creates the strongest sense of unease? Explain your choice.</p><div class="linebox"></div></section><section class="card mini surface"><h3>PLAN A CLOSE ANALYSIS</h3><p class="point"><span class="label">1</span> Evidence: “____________________________”</p><p class="point"><span class="label">2</span> Method: _____________________________</p><p class="point"><span class="label">3</span> Effect on the reader: __________________</p><div class="linebox"></div></section></div></div>
      <div class="grid two"><section class="card surface"><h3>QUESTION 1 — SELECT AND INFER</h3><p>${esc(simple ? "Find one detail that shows the lane is not normal. Explain your idea." : "Select one detail that suggests the lane is becoming unfamiliar. What does it imply?")}</p><div class="linebox"></div></section><section class="card surface"><h3>QUESTION 2 — LANGUAGE ANALYSIS</h3><p>${esc(analysisPrompt)}</p><div class="linebox"></div></section></div>
      <div class="footer"><div class="surface"><b>READING ROUTINE:</b> Choose evidence, name a method, then explain the meaning and effect.</div><div class="surface"><b>CHECK:</b> A short quotation is enough when your explanation is precise.</div></div>
    </section>
    <section class="humanities-page">${header(options, "ENGLISH LANGUAGE — PURPOSEFUL WRITING", "Plan, craft and check an original response")}
      <div class="purpose surface"><b>Writing task:</b> ${esc(writingPrompt)}</div>
      <div class="plan-grid"><section class="plan surface"><h3>OPENING IMAGE</h3><p>What can the reader see, hear or feel first?</p><div class="linebox"></div></section><section class="plan surface"><h3>SHIFT OR TURN</h3><p>What changes? How will you slow the moment?</p><div class="linebox"></div></section><section class="plan surface"><h3>WORD CHOICE</h3><p>Collect three precise verbs or adjectives.</p><div class="linebox"></div></section></div>
      <div class="grid two"><section class="card surface"><h3>SUCCESS CHECK</h3><span class="check">I have a clear viewpoint or atmosphere.</span><span class="check">I use varied sentence lengths for control.</span><span class="check">I use precise vocabulary rather than repeated words.</span><span class="check">I check capitals, punctuation and paragraphing.</span></section><section class="card surface"><h3>FIRST SENTENCE TRY</h3><p>Draft one controlled opening sentence before you begin the full response.</p><div class="linebox tall"></div></section></div>
      <section class="card surface" style="margin-top:3mm"><h3>YOUR WRITING</h3><div class="linebox large"></div></section>
      <div class="footer"><div class="surface"><b>STRUCTURE:</b> Begin with a clear focus, develop detail, then create a deliberate turn.</div><div class="surface"><b>TECHNICAL ACCURACY:</b> Leave one minute to reread and improve your punctuation.</div></div>
    </section></div>`;
}

function history(options: HumanitiesLandscapeOptions): string {
  const topic = options.topic || "the historical event";
  const task = learnerText(options, "Use the original practice source with your contextual knowledge. Make a supported historical claim.", "Read the source. Use what you know. Make a clear history point.");
  return `<div class="humanities-root" data-send="${supportNotes(options).length ? "1" : "0"}">
    <section class="humanities-page">${header(options, "HISTORY — SOURCE, CONTEXT AND ENQUIRY", "Original practice source · knowledge and interpretation")}
      <div class="purpose surface"><b>Focus:</b> ${esc(task)}</div>
      <div class="timeline"><div class="time surface"><b>BEFORE</b><span>What conditions or causes led towards ${esc(topic)}?</span></div><div class="time surface"><b>DURING</b><span>Which people, decisions or events mattered most?</span></div><div class="time surface"><b>AFTER</b><span>What changed, and what stayed the same?</span></div><div class="time surface"><b>CONCEPT</b><span>Choose: cause, consequence, change, continuity or significance.</span></div></div>
      <div class="grid two"><article class="source surface"><div class="source-title">ORIGINAL PRACTICE SOURCE: A LOCAL VIEWPOINT</div><p>“People speak as if the changes were sudden. They were not. For years, families had noticed the pressure building: longer hours, rising costs and fewer choices. When the decision finally came, some welcomed it as necessary. Others feared that the price would be paid by ordinary people.”</p><p><b>Adaptly practice source.</b> Written as a fictional local report for an enquiry about ${esc(topic)}.</p></article><section class="card surface history-source-check"><h3>SOURCE CHECK</h3><div class="source-meta"><div class="meta"><b>CONTENT</b><span>What claim does the source make?</span></div><div class="meta"><b>PROVENANCE</b><span>Who might the report be trying to influence?</span></div><div class="meta"><b>CONTEXT</b><span>Which own knowledge could test the claim?</span></div></div><p><span class="cue">Inference:</span> The writer suggests that ______________________________.</p><div class="linebox"></div><p><span class="cue">Contextual knowledge:</span> ____________________________________.</p><div class="linebox"></div></section></div>
      <div class="grid two history-review"><section class="card surface"><h3>USEFUL OR LIMITED?</h3><p>How useful is this source for an enquiry into ${esc(topic)}? Refer to content, provenance and own knowledge.</p><div class="linebox tall"></div></section><section class="card surface"><h3>INTERPRETATION CHECK</h3><p>Which interpretation is stronger: “change was unavoidable” or “change was mainly caused by decisions”? Give one reason and one piece of evidence.</p><div class="linebox tall"></div></section></div>
      <div class="footer"><div class="surface"><b>AO3 ROUTINE:</b> Use the source, then test it with provenance and contextual knowledge.</div><div class="surface"><b>REMEMBER:</b> A source can be useful even when it is limited or biased.</div></div>
    </section>
    <section class="humanities-page">${header(options, "HISTORY — EXPLAIN AND MAKE A JUDGEMENT", "Cause, consequence and sustained reasoning")}
      <div class="purpose surface"><b>Extended response:</b> “${esc(topic)} brought significant change.” How far do you agree? Use precise knowledge to support a balanced judgement.</div>
      <div class="plan-grid"><section class="plan surface"><h3>YOUR JUDGEMENT</h3><p>State a direct answer. Which factor or change matters most?</p><div class="linebox"></div></section><section class="plan surface"><h3>PARAGRAPH 1</h3><p>Point, precise evidence, explain why it matters.</p><div class="linebox"></div></section><section class="plan surface"><h3>PARAGRAPH 2</h3><p>Alternative factor or limit. Compare its importance.</p><div class="linebox"></div></section></div>
      <div class="grid two"><section class="card surface"><h3>HISTORIAN’S LANGUAGE</h3><div class="word-row"><span class="word">because</span><span class="word">therefore</span><span class="word">however</span><span class="word">consequently</span><span class="word">more significant</span></div><p>Use one connective to show cause, one to show a limit, and one to reach a conclusion.</p></section><section class="card surface"><h3>QUALITY CHECK</h3><span class="check">I use precise historical knowledge.</span><span class="check">I explain cause, consequence, change or continuity.</span><span class="check">I compare factors before reaching a final judgement.</span></section></div>
      <section class="card surface" style="margin-top:3mm"><h3>YOUR STRUCTURED RESPONSE</h3><div class="linebox large"></div></section>
      <div class="footer"><div class="surface"><b>AO1 AND AO2:</b> Knowledge earns value when it is used to explain and analyse.</div><div class="surface"><b>FINAL SENTENCE:</b> Return to the question and make your judgement unmistakable.</div></div>
    </section></div>`;
}

function geography(options: HumanitiesLandscapeOptions): string {
  const topic = options.topic || "the geographical issue";
  const task = learnerText(options, "Interpret the original practice data, identify a pattern, then make a justified geographical decision.", "Read the data. Spot a pattern. Use it to make a clear decision.");
  return `<div class="humanities-root" data-send="${supportNotes(options).length ? "1" : "0"}">
    <section class="humanities-page">${header(options, "GEOGRAPHY — DATA, PLACE AND PATTERN", "Original practice data · analysis across scales")}
      <div class="purpose surface"><b>Focus:</b> ${esc(task)}</div>
      <div class="data-layout"><section class="card surface"><h3>ORIGINAL PRACTICE DATA</h3><p>Index values from a classroom enquiry connected to ${esc(topic)}. Higher scores show a greater measured impact.</p><table class="data-table"><tr><th>Site</th><th>Impact index</th><th>Change since 2021</th></tr><tr><td>A</td><td>72</td><td>+18</td></tr><tr><td>B</td><td>49</td><td>+6</td></tr><tr><td>C</td><td>28</td><td>−4</td></tr></table><div class="bar"><span>Site A</span><i style="width:55mm"></i></div><div class="bar"><span>Site B</span><i style="width:37mm"></i></div><div class="bar"><span>Site C</span><i style="width:21mm"></i></div><p><span class="cue">Pattern:</span> Describe the highest, lowest and any change over time.</p><div class="linebox"></div></section><section class="card surface"><h3>PLACE AND PROCESS</h3><p><span class="label">1</span> Location and scale: Where is the issue happening, and at what scale?</p><div class="linebox"></div><p><span class="label">2</span> Process: Which physical or human process could explain the pattern?</p><div class="linebox"></div><p><span class="label">3</span> Link: How might people and environment affect each other?</p><div class="linebox"></div></section></div>
      <div class="grid three"><section class="card mini surface"><h3>DESCRIBE</h3><p>Use data accurately. Quote a figure or compare two sites.</p><div class="linebox"></div></section><section class="card mini surface"><h3>ANALYSE</h3><p>Explain a possible reason for the pattern using geography.</p><div class="linebox"></div></section><section class="card mini surface"><h3>QUESTION THE DATA</h3><p>What further information would make the conclusion more reliable?</p><div class="linebox"></div></section></div>
      <div class="footer"><div class="surface"><b>DATA ROUTINE:</b> Describe a pattern, explain it, then question its reliability.</div><div class="surface"><b>SKILLS:</b> Use units, comparisons and location language accurately.</div></div>
    </section>
    <section class="humanities-page">${header(options, "GEOGRAPHY — STAKEHOLDERS AND EVALUATION", "Evidence-led decision making")}
      <div class="purpose surface"><b>Evaluation task:</b> Which response to the issue linked to ${esc(topic)} is most sustainable? Make a justified decision that considers people and the environment.</div>
      <div class="grid three"><section class="card surface"><h3>OPTION A — PROTECT</h3><div class="stakeholder">Limit activity in the most affected area. Benefit: lower environmental pressure. Cost: less short-term access or income.</div><p>Evidence that supports or challenges this option:</p><div class="linebox"></div></section><section class="card surface"><h3>OPTION B — ADAPT</h3><div class="stakeholder">Change how people use the place. Benefit: activity can continue. Cost: requires investment and monitoring.</div><p>Evidence that supports or challenges this option:</p><div class="linebox"></div></section><section class="card surface"><h3>OPTION C — RESTORE</h3><div class="stakeholder">Repair damage and manage future use. Benefit: longer-term resilience. Cost: results may take time.</div><p>Evidence that supports or challenges this option:</p><div class="linebox"></div></section></div>
      <div class="grid two"><section class="card surface"><h3>STAKEHOLDER VIEWPOINTS</h3><p><span class="cue">Residents:</span> ______________________________________________</p><p><span class="cue">Businesses:</span> ______________________________________________</p><p><span class="cue">Environmental groups:</span> _________________________________</p><p><span class="cue">Decision makers:</span> _______________________________________</p></section><section class="card surface"><h3>DECISION PLAN</h3><p>My chosen option: __________________________________________</p><p>Best evidence: ______________________________________________</p><p>Trade-off or limitation: _______________________________________</p><p>Why this is most sustainable: __________________________________</p></section></div>
      <section class="card surface" style="margin-top:3mm"><h3>YOUR JUSTIFIED EVALUATION</h3><div class="linebox large"></div></section>
      <div class="footer"><div class="surface"><b>AO3:</b> Use evidence to analyse alternatives and make a reasoned judgement.</div><div class="surface"><b>FINAL CHECK:</b> Explain impact on both people and the physical environment.</div></div>
    </section></div>`;
}

export function canRenderHumanitiesLandscape(options: HumanitiesLandscapeOptions): boolean {
  const subject = norm(options.subject);
  return isSecondary(options.yearGroup) && /^(english|english language|history|geography)$/.test(subject);
}

export function renderHumanitiesLandscape(options: HumanitiesLandscapeOptions): HumanitiesLandscapeDocument {
  const subject = norm(options.subject);
  const layout: HumanitiesLayoutKind = /history/.test(subject) ? "history-source-judgement" : /geography/.test(subject) ? "geography-data-evaluation" : "english-reading-writing";
  const title = layout === "history-source-judgement" ? `${options.topic || "History"} — Source, Context and Judgement` : layout === "geography-data-evaluation" ? `${options.topic || "Geography"} — Data and Evaluation` : `${options.topic || "English Language"} — Reading and Writing`;
  const body = layout === "history-source-judgement" ? history(options) : layout === "geography-data-evaluation" ? geography(options) : english(options);
  const html = `<!doctype html><html><head><meta charset="UTF-8"><title>${esc(title)}</title><style>${styles()}</style></head><body>${body}</body></html>`;
  return { title, layout, html, adaptations: supportNotes(options) };
}
