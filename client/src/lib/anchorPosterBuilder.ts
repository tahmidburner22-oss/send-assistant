/**
 * anchorPosterBuilder.ts — PR-10 / PD11
 *
 * Build an anchor poster from worksheet content.
 * Pure deterministic extraction, no LLM call, no I/O.
 */

export interface AnchorPoster {
  titleBlock: string;
  conceptMap: string[];
  vocabRing: string[];
  visualSlots: string[];
}

export interface WorksheetInput {
  title?: string;
  sections?: Array<{ type?: string; title?: string; content?: string }>;
  metadata?: Record<string, unknown>;
}

/**
 * Build an anchor poster from worksheet content.
 * No LLM call - entirely deterministic.
 */
export function buildAnchorPoster(ws: WorksheetInput): AnchorPoster {
  const sections = ws.sections || [];
  const meta = ws.metadata || {};

  const topic = ws.title || (typeof meta.topic === "string" ? meta.topic : "Untitled");
  const yearGroup = typeof meta.yearGroup === "string" ? ` (${meta.yearGroup})` : "";
  const titleBlock = `Topic: ${topic}${yearGroup}`;

  const conceptMap = extractConceptMap(sections);
  const vocabRing = extractVocabRing(sections);
  const visualSlots = extractVisualSlots(sections);

  return { titleBlock, conceptMap, vocabRing, visualSlots };
}

/**
 * Render an anchor poster as printable A3-landscape HTML.
 */
export function anchorPosterHtml(poster: AnchorPoster): string {
  const conceptBoxes = poster.conceptMap
    .map((c) => `<div style="border:1.5px solid #1d4ed8;border-radius:4px;padding:6px 10px;background:#eff6ff;font-size:10pt;">${escapeHtml(c)}</div>`)
    .join("");

  const vocabItems = poster.vocabRing
    .map((v) => `<span style="display:inline-block;margin:3px 6px;padding:3px 10px;border:1px solid #15803d;border-radius:12px;font-size:9.5pt;background:#f0fdf4;">${escapeHtml(v)}</span>`)
    .join("");

  const visualItems = poster.visualSlots
    .map((s) => `<div style="border:2px dashed #9ca3af;border-radius:4px;padding:10px;min-height:60px;font-size:9pt;color:#6b7280;text-align:center;">${escapeHtml(s)}<br/><em>(add visual)</em></div>`)
    .join("");

  return `<div style="font-family:Arial,sans-serif;padding:10mm;max-width:420mm;min-height:290mm;">
  <h1 style="font-size:20pt;color:#1e40af;margin:0 0 4mm;border-bottom:3px solid #1e40af;padding-bottom:3mm;">${escapeHtml(poster.titleBlock)}</h1>
  <p style="font-size:9pt;color:#64748b;margin:0 0 6mm;">Anchor poster - print A3 landscape, laminate for display.</p>
  <div style="display:grid;grid-template-columns:2fr 1fr;gap:6mm;">
    <div>
      <h2 style="font-size:12pt;color:#1e40af;margin:0 0 3mm;">Key Concepts</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm;">${conceptBoxes}</div>
      <h2 style="font-size:12pt;color:#15803d;margin:6mm 0 3mm;">Vocabulary</h2>
      <div>${vocabItems}</div>
    </div>
    <div>
      <h2 style="font-size:12pt;color:#6b7280;margin:0 0 3mm;">Visual Slots</h2>
      <div style="display:grid;gap:4mm;">${visualItems}</div>
    </div>
  </div>
</div>`;
}

// ── Internal helpers ────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function extractConceptMap(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): string[] {
  const out: string[] = [];
  for (const s of sections) {
    if (!s.type || !/(learning-objective|objectives)/i.test(s.type)) continue;
    const lines = (s.content || "")
      .split(/[\n;]+/)
      .map((l) => l.replace(/^[\-\u2022*\d.)\s]+/, "").trim())
      .filter((l) => l.length > 5);
    for (const line of lines) {
      out.push(line.slice(0, 80));
      if (out.length >= 6) return out;
    }
  }
  return out;
}

function extractVocabRing(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): string[] {
  const out: string[] = [];
  for (const s of sections) {
    if (!s.type || !/(word-bank|vocabulary)/i.test(s.type)) continue;
    const lines = (s.content || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const cleaned = line.replace(/^[\-\u2022*\d.)\s]+/, "");
      const m = cleaned.match(/^([A-Za-z][\w\s\-']*?)\s*[\-\u2013\u2014:|]/);
      if (m && m[1]) {
        out.push(m[1].trim());
      } else if (cleaned.length > 2 && cleaned.length < 40) {
        out.push(cleaned);
      }
      if (out.length >= 8) return out;
    }
  }
  return out;
}

function extractVisualSlots(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): string[] {
  const out: string[] = [];
  for (const s of sections) {
    if (s.type === "diagram" && s.title) {
      out.push(s.title);
      if (out.length >= 4) return out;
    }
  }
  return out;
}
