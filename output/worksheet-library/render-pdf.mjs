/**
 * Worksheet PDF Renderer
 * Uses Playwright + Chromium to render worksheet JSON → PDF
 * Usage: node render-pdf.mjs <worksheet.json> [output.pdf]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node render-pdf.mjs <worksheet.json> [output.pdf]');
  process.exit(1);
}

const outputFile = process.argv[3] || inputFile.replace('.json', '.pdf');
const ws = JSON.parse(readFileSync(inputFile, 'utf8'));

const isLandscape = ws.metadata?.layout?.orientation === 'landscape';
const isBooklet = !isLandscape;

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderIntro(intro) {
  let html = `<div class="intro-page">`;
  html += `<h1>${escapeHtml(intro.header)}</h1>`;
  html += `<p class="subheader">${escapeHtml(intro.subheader)}</p>`;
  if (intro.nameLine) html += `<p class="name-line">${escapeHtml(intro.nameLine)}</p>`;
  if (intro.objective) html += `<div class="objective"><strong>What you need to be able to do:</strong><br>${escapeHtml(intro.objective)}</div>`;
  
  if (intro.commonMistakes?.length) {
    html += `<div class="mistakes"><strong>Common Mistakes to Avoid:</strong><ul>`;
    for (const m of intro.commonMistakes) html += `<li>${escapeHtml(m)}</li>`;
    html += `</ul></div>`;
  }
  
  if (intro.methodSteps?.length) {
    html += `<div class="method"><strong>Method Steps:</strong><ol>`;
    for (const s of intro.methodSteps) html += `<li>${escapeHtml(s)}</li>`;
    html += `</ol></div>`;
  }
  
  if (intro.workedExample?.length) {
    html += `<div class="worked-example"><strong>Worked Example:</strong>`;
    for (const line of intro.workedExample) html += `<p>${escapeHtml(line)}</p>`;
    html += `</div>`;
  }
  
  if (intro.visualAid) html += `<div class="visual-aid"><em>Visual Aid:</em> ${escapeHtml(intro.visualAid)}</div>`;
  html += `</div>`;
  return html;
}

function renderQuestions(questions, isBooklet) {
  let html = '';
  for (const q of questions) {
    if (isBooklet) html += `<div class="question-page page-break">`;
    else html += `<div class="question-item">`;
    
    html += `<div class="question-header">Question ${q.number} <span class="marks">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</span></div>`;
    html += `<div class="question-content">${escapeHtml(q.content).replace(/\n/g, '<br>')}</div>`;
    
    if (isBooklet) {
      html += `<div class="answer-space"></div>`;
    }
    html += `</div>`;
  }
  return html;
}

function renderSelfReflection(sr) {
  if (!sr) return '';
  let html = `<div class="page-break reflection"><h2>${escapeHtml(sr.title)}</h2>`;
  html += `<p><strong>${escapeHtml(sr.confidencePrompt)}</strong></p>`;
  html += `<div class="confidence-options">`;
  for (const opt of sr.confidenceOptions || []) html += `<span class="option">☐ ${escapeHtml(opt)}</span>`;
  html += `</div>`;
  for (const p of sr.prompts || []) html += `<p class="reflection-prompt">${escapeHtml(p)}<br><span class="answer-line">_______________________________________________</span></p>`;
  html += `</div>`;
  return html;
}

function renderAnswers(answers) {
  if (!answers) return '';
  let html = `<div class="page-break answers"><h2>${escapeHtml(answers.title)}</h2>`;
  for (const row of answers.rows || []) html += `<p class="answer-row">${escapeHtml(row)}</p>`;
  html += `</div>`;
  return html;
}

const css = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; padding: 20mm; color: #1e293b; }
  h1 { font-size: 18pt; margin-bottom: 4px; }
  h2 { font-size: 14pt; margin-bottom: 8px; }
  .subheader { font-size: 11pt; color: #475569; margin-bottom: 12px; }
  .name-line { font-size: 10pt; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
  .objective { background: #f8fafc; border-left: 3px solid #2563eb; padding: 8px 12px; margin-bottom: 12px; font-size: 10pt; }
  .mistakes { margin-bottom: 12px; font-size: 10pt; }
  .mistakes ul { margin-left: 16px; }
  .mistakes li { margin-bottom: 4px; }
  .method { margin-bottom: 12px; font-size: 10pt; }
  .method ol { margin-left: 16px; }
  .method li { margin-bottom: 2px; }
  .worked-example { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 8px 12px; margin-bottom: 12px; font-size: 10pt; }
  .worked-example p { margin-bottom: 2px; }
  .visual-aid { background: #f0fdf4; border-left: 3px solid #22c55e; padding: 8px 12px; margin-bottom: 12px; font-size: 9pt; font-style: italic; }
  .page-break { page-break-before: always; }
  .question-page { min-height: 200mm; }
  .question-header { font-weight: bold; font-size: 12pt; margin-bottom: 8px; }
  .marks { font-weight: normal; color: #6b7280; font-size: 10pt; }
  .question-content { white-space: pre-wrap; font-size: 11pt; margin-bottom: 16px; }
  .answer-space { border-top: 1px dashed #cbd5e1; margin-top: 40mm; padding-top: 8px; color: #94a3b8; font-size: 9pt; }
  .answer-space::after { content: "Answer lines"; }
  .question-item { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
  .reflection { padding-top: 20px; }
  .confidence-options { display: flex; gap: 20px; margin: 8px 0 16px; }
  .option { font-size: 11pt; }
  .reflection-prompt { margin-bottom: 12px; }
  .answer-line { color: #94a3b8; }
  .answers { padding-top: 20px; }
  .answer-row { font-size: 10pt; margin-bottom: 6px; padding-left: 8px; border-left: 2px solid #2563eb; }
`;

let fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>`;
fullHtml += renderIntro(ws.intro);

if (isBooklet) {
  fullHtml += renderQuestions(ws.questions, true);
  fullHtml += renderSelfReflection(ws.selfReflection);
  fullHtml += renderAnswers(ws.answers);
} else {
  fullHtml += `<div class="page-break questions-grid">`;
  fullHtml += renderQuestions(ws.questions, false);
  fullHtml += `</div>`;
}

fullHtml += `</body></html>`;

// Render with Playwright
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(fullHtml, { waitUntil: 'networkidle' });
await page.pdf({
  path: outputFile,
  format: 'A4',
  landscape: isLandscape,
  margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
  printBackground: true,
});
await browser.close();
console.log(`✓ PDF saved: ${outputFile}`);
