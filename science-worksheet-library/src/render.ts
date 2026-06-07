/**
 * Science Worksheet Library — JSON → A4-Landscape HTML Renderer v2.0
 *
 * Produces a self-contained HTML string (inline styles, inline SVGs)
 * that fits one A4 landscape page (297mm × 210mm).
 *
 * Supports two layout modes:
 * - 'info-grid': 3-col info panels + 2×2 question grid (e.g. Concentration of Solutions)
 * - 'panel-pair': full-width definition bar + 2 large question panels (e.g. Metallic Bonding)
 *
 * Handles both standard and ADHD variants.
 */

import type { Worksheet, InfoPanel, Question, AdhdConfig } from './types.js';
import diagrams from './diagrams.js';

// ─── Palette ──────────────────────────────────────────────────────────────────

const STANDARD_PALETTE: Record<string, string> = {
  '--bg': '#ffffff',
  '--text': '#1a1a2e',
  '--accent': '#1a237e',
  '--accent-light': '#e8eaf6',
  '--border': '#1a237e',
  '--header-bg': '#1a237e',
  '--header-text': '#ffffff',
  '--panel-bg': '#ffffff',
  '--panel-border': '#1a237e',
  '--badge-bg': '#1a237e',
  '--badge-text': '#ffffff',
  '--vocab-bg': '#f3f4f6',
  '--misconception-bg': '#fff8e1',
  '--misconception-border': '#ffc107',
  '--formula-bg': '#e8eaf6',
  '--conversion-bg': '#fff9c4',
  '--worked-bg': '#ffffff',
  '--footer-bg': '#f8f9fa',
  '--answer-line': '#666666',
  '--word-bank-bg': '#ffffff',
  '--word-bank-border': '#1a237e',
};

const ADHD_PALETTE: Record<string, string> = {
  '--bg': '#fefefe',
  '--text': '#2d2d3a',
  '--accent': '#4a6fa5',
  '--accent-light': '#e8f0f8',
  '--border': '#4a6fa5',
  '--header-bg': '#4a6fa5',
  '--header-text': '#ffffff',
  '--panel-bg': '#ffffff',
  '--panel-border': '#4a6fa5',
  '--badge-bg': '#4a6fa5',
  '--badge-text': '#ffffff',
  '--vocab-bg': '#f0f7ee',
  '--misconception-bg': '#fdf6e3',
  '--misconception-border': '#f0c36d',
  '--formula-bg': '#eef4f1',
  '--conversion-bg': '#fdf6e3',
  '--worked-bg': '#fafbfc',
  '--footer-bg': '#f5f5f0',
  '--answer-line': '#888888',
  '--word-bank-bg': '#f8faf8',
  '--word-bank-border': '#4a6fa5',
};

// ─── CSS ──────────────────────────────────────────────────────────────────────

function buildCSS(ws: Worksheet): string {
  const basePalette = ws.variant === 'adhd' ? ADHD_PALETTE : STANDARD_PALETTE;
  const palette = { ...basePalette, ...(ws.adhd?.palette || {}) };

  const paletteVars = Object.entries(palette)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

  return `
@page { size: A4 landscape; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
${paletteVars}
}
html, body {
  width: 297mm; height: 210mm; overflow: hidden;
  font-family: 'Segoe UI', 'Arial', sans-serif;
  font-size: 9.5px; line-height: 1.3; color: var(--text); background: var(--bg);
}
.page {
  width: 297mm; height: 210mm;
  padding: 5mm 7mm 4mm 7mm;
  display: flex; flex-direction: column; overflow: hidden;
}

/* ─── Header ─── */
.header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 2px; flex-shrink: 0;
}
.header-left {
  display: flex; align-items: center; gap: 5px;
}
/* Filled badge (e.g. CHEMISTRY) */
.badge-filled {
  background: var(--header-bg); color: var(--header-text);
  padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.5px;
}
/* Outlined badge (e.g. YEAR 10) */
.badge-outline {
  background: #ffffff; color: var(--accent);
  padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.5px;
  border: 1.5px solid var(--accent);
}
/* Diagram label badge on the right */
.badge-diagram {
  background: var(--header-bg); color: var(--header-text);
  padding: 3px 12px; border-radius: 4px; font-size: 12px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.5px;
}
/* NAME / DATE box */
.name-date-box {
  border: 1.5px solid var(--accent); border-radius: 5px;
  padding: 4px 10px; min-width: 180px;
}
.name-date-row { display: flex; align-items: baseline; gap: 4px; font-size: 9px; font-weight: 700; color: var(--accent); }
.name-date-row + .name-date-row { margin-top: 3px; }
.name-date-line { flex: 1; border-bottom: 1px solid #999; height: 11px; }

.header-title {
  font-size: 22px; font-weight: 900; text-align: center; margin: 0;
  flex-shrink: 0; letter-spacing: -0.5px; line-height: 1.05;
}
.header-title.black { color: #111; }
.header-title.blue { color: var(--accent); }
.title-rule { border: none; border-top: 2px solid var(--accent); margin: 2px 0 0 0; }
.title-rule.double { border-top: 2.5px solid var(--accent); box-shadow: 0 3px 0 -1px var(--accent); margin-bottom: 4px; }
.header-subtitle {
  font-size: 11px; text-align: center; color: var(--accent);
  margin: 1px 0 4px 0; flex-shrink: 0; font-style: italic; font-weight: 600;
}

/* ─── Progress Tracker (ADHD) ─── */
.progress-tracker {
  display: flex; align-items: center; gap: 4px;
  margin-bottom: 4px; padding: 2px 8px;
  background: var(--accent-light); border-radius: 3px;
  font-size: 8px; flex-shrink: 0;
}
.progress-dot {
  width: 7px; height: 7px; border-radius: 50%;
  border: 1.5px solid var(--accent); background: transparent;
}

/* ─── Info Panels ─── */
.info-row {
  display: grid; gap: 5px; margin-bottom: 5px; flex-shrink: 0;
}
.info-row.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
.info-row.cols-2 { grid-template-columns: 1fr 1fr; }
.info-row.cols-1 { grid-template-columns: 1fr; }

.info-panel {
  border: 1.5px solid var(--panel-border); border-radius: 4px;
  padding: 5px 7px; overflow: hidden;
  background: var(--panel-bg);
}
.info-panel.full-width { grid-column: 1 / -1; }
.info-panel-title {
  font-size: 9.5px; font-weight: 800; text-transform: uppercase;
  color: var(--accent); margin-bottom: 4px; letter-spacing: 0.5px;
  text-align: center; border-bottom: 1.5px solid var(--accent);
  padding-bottom: 3px;
}
.info-panel-content { font-size: 9px; }
.info-panel-content strong { color: var(--accent); }

/* Formula panel */
.info-panel.formula-panel { background: var(--formula-bg); }
.formula-box {
  background: #ffffff; border: 1.5px solid var(--accent);
  border-radius: 5px; padding: 8px 10px; margin: 4px 0; text-align: center;
  font-size: 11px;
}
.formula-line { margin: 2px 0; font-family: 'Times New Roman', serif; }
.formula-fraction { display: inline-block; text-align: center; vertical-align: middle; margin: 0 2px; }
.formula-num { border-bottom: 1.5px solid var(--text); padding: 0 6px 2px 6px; display: block; }
.formula-den { padding: 2px 6px 0 6px; display: block; }

/* Worked example */
.worked-panel { background: var(--worked-bg); }
.worked-step { font-size: 9.5px; margin: 3px 0; }
.worked-step.highlight { color: var(--accent); font-weight: 700; font-size: 10.5px; }

/* Vocab panel */
.vocab-item { margin-bottom: 2px; font-size: 8.5px; }
.vocab-item strong { color: var(--accent); }

/* Misconceptions panel */
.misconception-panel { background: var(--misconception-bg); border-color: var(--misconception-border); }
.misconception-item { font-size: 8.5px; margin-bottom: 2px; }
.misconception-item .wrong { color: #c62828; text-decoration: line-through; opacity: 0.8; }
.misconception-item .right { color: #2e7d32; font-weight: 600; }

/* Conversion reminder — yellow box */
.conversion-box {
  background: var(--conversion-bg); border: 1.5px solid var(--accent);
  border-radius: 5px; padding: 6px 10px; margin-top: 6px; text-align: center;
  font-size: 13px; font-weight: 800; color: #111;
}
.conversion-label {
  font-size: 9px; font-weight: 800; text-transform: uppercase; color: var(--accent);
  letter-spacing: 0.5px; margin-bottom: 2px;
}

/* Diagram inside panel */
.panel-diagram { text-align: center; margin: 3px 0; }
.panel-diagram svg { max-height: 120px; width: auto; }
.panel-diagram-caption { font-size: 7.5px; color: #555; margin-top: 1px; }

/* ─── Questions ─── */
.questions-grid {
  display: grid; gap: 5px; flex: 1; min-height: 0;
}
.questions-grid.cols-2 { grid-template-columns: 1fr 1fr; }
.questions-grid.cols-1 { grid-template-columns: 1fr; }
.questions-grid.rows-2 { grid-template-rows: 1fr 1fr; }
.questions-grid.rows-1 { grid-template-rows: 1fr; }

.question-panel {
  border: 1.5px solid var(--panel-border); border-radius: 4px;
  padding: 6px 8px; overflow: hidden; display: flex; flex-direction: column;
}
.question-header {
  display: flex; align-items: center; gap: 6px; margin-bottom: 5px;
}
.question-badge {
  background: var(--badge-bg); color: var(--badge-text);
  width: 22px; height: 22px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; flex-shrink: 0;
}
/* Navy filled banner beside the badge */
.question-title {
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  color: var(--badge-text); background: var(--badge-bg);
  padding: 3px 10px; border-radius: 4px; letter-spacing: 0.5px;
}
.question-text { font-size: 9.5px; margin-bottom: 3px; }
.question-text .command { color: var(--accent); font-weight: 600; }
.question-secondary { font-size: 8.5px; color: #555; margin-bottom: 3px; font-style: italic; }

/* Word bank — dashed container with solid inner boxes */
.word-bank {
  display: flex; gap: 10px; flex-wrap: wrap; margin: 5px 0;
  padding: 7px 10px; border: 1.5px dashed var(--word-bank-border);
  border-radius: 5px; background: transparent; justify-content: center;
}
.word-bank-item {
  font-size: 10px; font-weight: 600; padding: 5px 10px; text-align: center;
  border: 1.5px solid var(--word-bank-border); border-radius: 4px;
  background: var(--word-bank-bg); color: var(--accent);
}

/* Answer lines */
.answer-lines { margin-top: auto; }
.answer-line { border-bottom: 1px solid var(--answer-line); height: 16px; margin-bottom: 2px; }
.answer-with-unit {
  display: flex; align-items: flex-end; gap: 6px; margin-top: auto;
}
.answer-with-unit .answer-label { font-size: 9px; font-weight: 600; }
.answer-with-unit .answer-blank {
  flex: 1; border-bottom: 1px solid var(--answer-line); height: 16px;
}
.answer-with-unit .answer-unit { font-size: 9px; font-weight: 500; }

/* Working box */
.working-box {
  border: 1.5px solid var(--panel-border); border-radius: 3px;
  min-height: 40px; flex: 1; margin-top: 4px;
}

/* Table */
.question-table {
  width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 9px;
}
.question-table th, .question-table td {
  border: 1px solid var(--panel-border); padding: 3px 6px; text-align: center;
}
.question-table th { background: var(--accent-light); font-weight: 600; }

/* Circle options */
.circle-options {
  display: flex; gap: 20px; justify-content: center; margin: 4px 0;
  font-size: 12px; font-weight: 700;
}

/* Diagram in question */
.question-diagram { text-align: center; margin: 3px 0; flex: 1; }
.question-diagram svg { max-height: 100%; width: auto; }
.question-diagram-caption { font-size: 7.5px; color: #555; }

/* ─── ADHD Steps ─── */
.steps { margin: 3px 0; padding-left: 2px; }
.step { font-size: 8.5px; margin-bottom: 2px; display: flex; align-items: flex-start; gap: 4px; }
.step-checkbox {
  width: 9px; height: 9px; border: 1.5px solid var(--accent);
  border-radius: 2px; flex-shrink: 0; margin-top: 1px;
}

/* ─── Footer ─── */
.footer {
  margin-top: auto; padding: 3px 8px;
  background: var(--footer-bg); border-radius: 3px;
  font-size: 8.5px; color: #444;
  display: flex; justify-content: space-between; flex-shrink: 0;
  border: 1px solid #e0e0e0;
}
.footer .tip { font-style: italic; }
.footer .think { font-weight: 600; color: var(--accent); }
`;
}

// ─── HTML Builders ────────────────────────────────────────────────────────────

function renderHeader(ws: Worksheet): string {
  const h = ws.header;

  // Right side: NAME/DATE box OR diagram label badge
  let rightContent = '';
  if (h.nameDateBox) {
    rightContent = `
    <div class="name-date-box">
      <div class="name-date-row"><span>NAME:</span><span class="name-date-line"></span></div>
      <div class="name-date-row"><span>DATE:</span><span class="name-date-line"></span></div>
    </div>`;
  } else if (h.diagramLabel) {
    rightContent = `<span class="badge-diagram">${h.diagramLabel}</span>`;
  }

  const titleColor = h.titleColor || 'blue';
  const rule = h.titleUnderline
    ? `<hr class="title-rule double"/>`
    : '';
  const subtitle = h.subtitle ? `<div class="header-subtitle">${h.subtitle}</div>` : '';

  return `
<div class="header">
  <div class="header-left">
    <span class="badge-filled">${h.subject}</span>
    <span class="badge-outline">${h.yearGroup}</span>
  </div>
  <div>${rightContent}</div>
</div>
<div class="header-title ${titleColor}">${h.title}</div>
${rule}
${subtitle}`;
}

function renderProgressTracker(ws: Worksheet): string {
  if (ws.variant !== 'adhd' || !ws.adhd?.progressTracker) return '';
  const total = ws.questions.length;
  const dots = Array.from({ length: total }, (_, i) =>
    `<div class="progress-dot" data-q="${i + 1}"></div>`
  ).join('');
  return `<div class="progress-tracker"><span>Progress:</span> ${dots}</div>`;
}

function renderInfoPanel(panel: InfoPanel): string {
  const fullWidthClass = panel.fullWidth ? ' full-width' : '';
  let panelClass = '';
  if (panel.type === 'misconceptions') panelClass = ' misconception-panel';
  else if (panel.type === 'formula') panelClass = ' formula-panel';
  else if (panel.type === 'worked-example') panelClass = ' worked-panel';

  let inner = '';

  // Title
  if (panel.title) {
    inner += `<div class="info-panel-title">${panel.title}</div>`;
  }

  // Content based on type
  switch (panel.type) {
    case 'diagram':
      if (panel.diagram) {
        const svg = diagrams[panel.diagram.id] || `<!-- diagram "${panel.diagram.id}" not found -->`;
        const style = panel.diagram.width ? ` style="width:${panel.diagram.width}"` : '';
        inner += `<div class="panel-diagram"${style}>${svg}</div>`;
        if (panel.diagram.caption) {
          inner += `<div class="panel-diagram-caption">${panel.diagram.caption}</div>`;
        }
      }
      if (panel.content) {
        inner += `<div class="info-panel-content">${panel.content}</div>`;
      }
      if (panel.secondaryContent) {
        inner += `<div class="info-panel-content" style="margin-top:3px;font-size:8.5px;">${panel.secondaryContent}</div>`;
      }
      break;

    case 'formula':
      if (panel.formulaLines) {
        inner += `<div class="formula-box">`;
        for (const line of panel.formulaLines) {
          inner += `<div class="formula-line">${line}</div>`;
        }
        inner += `</div>`;
      }
      if (panel.content) {
        inner += `<div class="conversion-box"><div class="conversion-label">Conversion Reminder</div>${panel.content}</div>`;
      }
      break;

    case 'worked-example':
      if (panel.workedSteps) {
        for (const step of panel.workedSteps) {
          const isHighlight = step.startsWith('!');
          const text = isHighlight ? step.slice(1) : step;
          inner += `<div class="worked-step${isHighlight ? ' highlight' : ''}">${text}</div>`;
        }
      }
      break;

    case 'definition':
      if (panel.content) {
        inner += `<div class="info-panel-content">${panel.content}</div>`;
      }
      break;

    case 'vocab':
      if (panel.vocab) {
        for (const v of panel.vocab) {
          inner += `<div class="vocab-item"><strong>${v.term}:</strong> ${v.definition}</div>`;
        }
      }
      break;

    case 'misconceptions':
      if (panel.misconceptions) {
        for (const m of panel.misconceptions) {
          inner += `<div class="misconception-item"><span class="wrong">✗ ${m.wrong}</span> → <span class="right">✓ ${m.right}</span></div>`;
        }
      }
      break;

    case 'conversion':
      if (panel.content) {
        inner += `<div class="conversion-box">${panel.content}</div>`;
      }
      break;
  }

  return `<div class="info-panel${fullWidthClass}${panelClass}">${inner}</div>`;
}

function renderInfoRow(ws: Worksheet): string {
  if (!ws.infoPanels || ws.infoPanels.length === 0) return '';

  const cols = ws.layout.infoCols || 3;
  const colClass = `cols-${cols}`;

  const panels = ws.infoPanels.map(p => renderInfoPanel(p)).join('\n');
  return `<div class="info-row ${colClass}">${panels}</div>`;
}

function renderQuestion(q: Question, isAdhd: boolean): string {
  let inner = '';

  // Header with badge + title
  inner += `<div class="question-header">`;
  inner += `<div class="question-badge">${q.number}</div>`;
  inner += `<div class="question-title">${q.sectionTitle}</div>`;
  inner += `</div>`;

  // Main text
  if (q.text) {
    inner += `<div class="question-text">${q.text}</div>`;
  }

  // Secondary text
  if (q.secondaryText) {
    inner += `<div class="question-secondary">${q.secondaryText}</div>`;
  }

  // Word bank
  if (q.wordBank && q.wordBank.length > 0) {
    const items = q.wordBank.map(w => `<span class="word-bank-item">${w}</span>`).join('');
    inner += `<div class="word-bank">${items}</div>`;
  }

  // Table (for compare questions)
  if (q.table) {
    inner += `<table class="question-table">`;
    inner += `<tr>${q.table.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    for (const row of q.table.rows) {
      inner += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }
    inner += `</table>`;
    // Circle options
    if (q.circleOptions) {
      inner += `<div class="question-text">Which solution is <span class="command">more concentrated</span>? Circle your answer.</div>`;
      inner += `<div class="circle-options">${q.circleOptions.map(o => `<span>${o}</span>`).join('')}</div>`;
      inner += `<div class="question-text">Show your working.</div>`;
    }
  }

  // Diagram embedded in question
  if (q.diagram) {
    const svg = diagrams[q.diagram.id] || `<!-- diagram "${q.diagram.id}" not found -->`;
    const style = q.diagram.width ? ` style="width:${q.diagram.width}"` : '';
    inner += `<div class="question-diagram"${style}>${svg}</div>`;
    if (q.diagram.caption) {
      inner += `<div class="question-diagram-caption">${q.diagram.caption}</div>`;
    }
  }

  // ADHD steps
  if (isAdhd && q.steps && q.steps.length > 0) {
    inner += `<div class="steps">`;
    for (const step of q.steps) {
      const cb = q.checkboxes ? '<div class="step-checkbox"></div>' : '';
      inner += `<div class="step">${cb}<span>${step}</span></div>`;
    }
    inner += `</div>`;
  }

  // Working box
  if (q.workingBox) {
    inner += `<div class="working-box"></div>`;
  }

  // Answer lines
  if (q.answerLines && q.answerLines > 0 && !q.answerUnit) {
    inner += `<div class="answer-lines">`;
    for (let i = 0; i < q.answerLines; i++) {
      inner += `<div class="answer-line"></div>`;
    }
    inner += `</div>`;
  }

  // Answer with unit
  if (q.answerUnit) {
    inner += `<div class="answer-with-unit">`;
    inner += `<span class="answer-label">Answer:</span>`;
    inner += `<span class="answer-blank"></span>`;
    inner += `<span class="answer-unit">${q.answerUnit}</span>`;
    inner += `</div>`;
  }

  return `<div class="question-panel">${inner}</div>`;
}

function renderQuestions(ws: Worksheet): string {
  const cols = ws.layout.questionCols || 2;
  const rows = ws.layout.questionRows || (ws.layout.mode === 'info-grid' ? 2 : 1);

  const colClass = `cols-${cols}`;
  const rowClass = `rows-${rows}`;

  const isAdhd = ws.variant === 'adhd';
  const items = ws.questions.map(q => renderQuestion(q, isAdhd)).join('\n');

  return `<div class="questions-grid ${colClass} ${rowClass}">${items}</div>`;
}

function renderFooter(ws: Worksheet): string {
  if (!ws.footer) return '';
  const tip = ws.footer.tip ? `<span class="tip">💡 <strong>TIP:</strong> ${ws.footer.tip}</span>` : '';
  const think = ws.footer.thinkPrompt ? `<span class="think">✓ <strong>Think:</strong> ${ws.footer.thinkPrompt}</span>` : '';
  return `<div class="footer">${tip}${think}</div>`;
}

// ─── Main Render Function ─────────────────────────────────────────────────────

export function renderWorksheet(ws: Worksheet): string {
  const css = buildCSS(ws);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${ws.header.subject} — ${ws.header.title} (${ws.variant})</title>
<style>${css}</style>
</head>
<body>
<div class="page">
  ${renderHeader(ws)}
  ${renderProgressTracker(ws)}
  ${renderInfoRow(ws)}
  ${renderQuestions(ws)}
  ${renderFooter(ws)}
</div>
</body>
</html>`;
}
