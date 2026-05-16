/**
 * evidence-tagger.ts — FEAT-6 (EHCP/IEP Evidence Tagger + Export Evidence Pack)
 *
 * For SEND-aware schools, every worksheet a teacher gives a pupil should be
 * traceable to the pupil's EHCP outcomes / IEP targets — that's what Annual
 * Reviews and tribunals want to see. This module turns each worksheet into a
 * lightweight "evidence record" by:
 *
 *   1. Matching the worksheet's content against the pupil's EHCP outcomes
 *      and IEP targets (keyword overlap, lower-cased, simple bag-of-words).
 *   2. Adding an `evidenceTags` block to `worksheet.metadata` so the History
 *      page and Pupil Profile can show "addresses outcome A2" pills.
 *   3. Producing a `buildEvidencePackHtml(child, worksheets)` printable that
 *      lists every tagged worksheet under each outcome — drop-in for Annual
 *      Reviews.
 *
 * Cost: £0 — heuristic only, no LLM call. Runs entirely client-side.
 */

import type { Child, Worksheet } from "@/contexts/AppContext";

// ── Types ────────────────────────────────────────────────────────────────────

export interface EvidenceTag {
  /** "ehcp" | "iep" — which list the source statement is from. */
  source: "ehcp" | "iep";
  /** The full outcome / target text. */
  text: string;
  /** Confidence score 0..1 (keyword overlap fraction). */
  score: number;
  /** Specific matched keywords, for showing why this matched. */
  matchedKeywords: string[];
}

export interface EvidenceMetadata {
  pupilContextChildId?: string;
  /** Snapshot of pupil display name at time of generation (initials only — GDPR). */
  pupilDisplayName?: string;
  /** Tags ranked by score, highest first. Empty array = no match. */
  tags: EvidenceTag[];
  /** ISO timestamp when tagging ran. */
  taggedAt: string;
}

// ── Keyword extraction ───────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "for", "on",
  "with", "at", "by", "from", "as", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "should", "could", "can", "may", "might", "must", "shall",
  "i", "you", "he", "she", "it", "we", "they", "this", "that", "these",
  "those", "their", "his", "her", "its", "our", "your", "my", "me",
  "if", "then", "than", "so", "such", "no", "not", "only", "own",
  "same", "very", "s", "t", "just", "don", "now", "also", "any",
  "all", "some", "more", "most", "other", "each", "every", "few",
  "into", "out", "over", "under", "up", "down", "off", "again", "once",
  "pupil", "pupils", "child", "children", "student", "students",
  "year", "term", "week", "lesson", "lessons", "target", "outcome",
  "use", "using", "used", "able", "given", "context", "develop",
  "begin", "beginning", "show", "shows", "shown", "demonstrate",
  "support", "supports", "supported", "with", "when", "while",
  "make", "makes", "made", "say", "said", "good", "better",
  "complete", "completes", "completed",
]);

/** Tokenise a string into lowercased non-stopword tokens of length ≥ 3. */
function tokens(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/<[^>]+>/g, " ") // strip HTML/SVG tags
    .replace(/[^a-z0-9\s-]/g, " ");
  return cleaned
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !STOPWORDS.has(t));
}

function uniqueTokens(text: string): Set<string> {
  return new Set(tokens(text));
}

// ── Worksheet content extraction ─────────────────────────────────────────────

/** Concatenate the pieces of a worksheet that describe its substance. */
function worksheetCorpus(ws: Worksheet | { title?: string; subtitle?: string; content?: string; teacherContent?: string; sections?: Array<{ title?: string; content?: string }>; metadata?: any }): string {
  const parts: string[] = [];
  if (ws.title) parts.push(ws.title);
  if ((ws as any).subtitle) parts.push((ws as any).subtitle);
  if ((ws as any).content) parts.push((ws as any).content);
  if ((ws as any).teacherContent) parts.push((ws as any).teacherContent);
  const md = (ws as any).metadata || {};
  if (md.subject) parts.push(String(md.subject));
  if (md.topic) parts.push(String(md.topic));
  if (Array.isArray(md.adaptations)) parts.push(md.adaptations.join(" "));
  if (Array.isArray((ws as any).sections)) {
    for (const s of (ws as any).sections) {
      if (s?.title) parts.push(String(s.title));
      if (s?.content) parts.push(String(s.content));
    }
  }
  return parts.join("\n");
}

// ── Tagging core ─────────────────────────────────────────────────────────────

/** Score a single statement against the worksheet corpus. */
function scoreStatement(statement: string, worksheetTokens: Set<string>): { score: number; matched: string[] } {
  const stTokens = Array.from(uniqueTokens(statement));
  if (stTokens.length === 0) return { score: 0, matched: [] };
  const matched: string[] = [];
  for (const t of stTokens) {
    if (worksheetTokens.has(t)) matched.push(t);
  }
  // Score = matched keywords / total significant keywords in the statement.
  // Floor to 2 dp for clean display.
  const score = Math.round((matched.length / stTokens.length) * 100) / 100;
  return { score, matched };
}

/**
 * Tag a worksheet against a pupil's EHCP outcomes and IEP targets.
 * Returns the full evidence-metadata block (always non-null — empty tags
 * array if nothing matched).
 *
 * `minScore` (default 0.2) avoids spurious 1-keyword matches.
 */
export function tagWorksheetForPupil(
  worksheet: Worksheet | { title?: string; subtitle?: string; content?: string; teacherContent?: string; sections?: any[]; metadata?: any },
  pupil: Child,
  options: { minScore?: number; maxTags?: number } = {},
): EvidenceMetadata {
  const minScore = options.minScore ?? 0.2;
  const maxTags = options.maxTags ?? 5;
  const wsTokens = uniqueTokens(worksheetCorpus(worksheet));

  const ehcp = (pupil.ehcpOutcomes || []).filter(s => typeof s === "string" && s.trim().length > 0);
  const iep = (pupil.iepTargets || []).filter(s => typeof s === "string" && s.trim().length > 0);

  const candidates: EvidenceTag[] = [];
  for (const text of ehcp) {
    const { score, matched } = scoreStatement(text, wsTokens);
    if (score >= minScore) candidates.push({ source: "ehcp", text, score, matchedKeywords: matched });
  }
  for (const text of iep) {
    const { score, matched } = scoreStatement(text, wsTokens);
    if (score >= minScore) candidates.push({ source: "iep", text, score, matchedKeywords: matched });
  }

  candidates.sort((a, b) => b.score - a.score);

  return {
    pupilContextChildId: pupil.id,
    pupilDisplayName: pupil.name,
    tags: candidates.slice(0, maxTags),
    taggedAt: new Date().toISOString(),
  };
}

// ── Export Evidence Pack (printable HTML) ────────────────────────────────────

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Build a printable HTML page of every worksheet associated with this pupil
 * via `metadata.evidenceTags.pupilContextChildId === pupil.id`. Output groups
 * worksheets under each EHCP / IEP statement, with an "untagged" bucket for
 * worksheets that didn't match any current outcome.
 */
export function buildEvidencePackHtml(pupil: Child, worksheets: Worksheet[]): string {
  const matched = worksheets.filter(ws => {
    const ev = (ws.metadata as any)?.evidenceTags as EvidenceMetadata | undefined;
    return ev && ev.pupilContextChildId === pupil.id;
  });

  // Group by statement. Use a Map keyed by "source::text".
  type Group = { source: "ehcp" | "iep" | "untagged"; text: string; entries: Array<{ ws: Worksheet; score: number; matchedKeywords: string[] }> };
  const groups: Map<string, Group> = new Map();

  // Seed with all current EHCP / IEP statements so we always show them, even if empty.
  for (const text of pupil.ehcpOutcomes || []) {
    const k = `ehcp::${text}`;
    if (!groups.has(k)) groups.set(k, { source: "ehcp", text, entries: [] });
  }
  for (const text of pupil.iepTargets || []) {
    const k = `iep::${text}`;
    if (!groups.has(k)) groups.set(k, { source: "iep", text, entries: [] });
  }

  const untagged: Worksheet[] = [];
  for (const ws of matched) {
    const ev = (ws.metadata as any)?.evidenceTags as EvidenceMetadata;
    if (!ev || !Array.isArray(ev.tags) || ev.tags.length === 0) {
      untagged.push(ws);
      continue;
    }
    let attached = false;
    for (const tag of ev.tags) {
      const k = `${tag.source}::${tag.text}`;
      const g = groups.get(k);
      if (g) {
        g.entries.push({ ws, score: tag.score, matchedKeywords: tag.matchedKeywords });
        attached = true;
      }
    }
    // If the tagged statements no longer match the pupil's current outcomes
    // (e.g. an outcome was edited), show under untagged so it isn't lost.
    if (!attached) untagged.push(ws);
  }

  const groupsArr = Array.from(groups.values());
  const totalTagged = groupsArr.reduce((acc, g) => acc + g.entries.length, 0);

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const renderEntry = (e: { ws: Worksheet; score: number; matchedKeywords: string[] }) => {
    const ws = e.ws;
    const created = ws.createdAt ? new Date(ws.createdAt).toLocaleDateString("en-GB") : "";
    const meta = (ws.metadata || {}) as any;
    const subject = meta.subject || ws.subject || "";
    const topic = meta.topic || ws.topic || "";
    const yearGroup = meta.yearGroup || ws.yearGroup || "";
    const adaptations = Array.isArray(meta.adaptations) ? meta.adaptations.join(", ") : "";
    return `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${escapeHtml(ws.title || "Untitled worksheet")}</span>
          <span class="entry-date">${escapeHtml(created)}</span>
        </div>
        <div class="entry-meta">
          ${subject ? `<span class="pill">${escapeHtml(subject)}</span>` : ""}
          ${topic ? `<span class="pill">${escapeHtml(topic)}</span>` : ""}
          ${yearGroup ? `<span class="pill">${escapeHtml(yearGroup)}</span>` : ""}
          ${adaptations ? `<span class="pill pill-adapt">Adaptations: ${escapeHtml(adaptations)}</span>` : ""}
        </div>
        <div class="entry-evidence">
          <strong>Match strength:</strong> ${(e.score * 100).toFixed(0)}%
          ${e.matchedKeywords.length > 0 ? ` &middot; <em>matched on:</em> ${escapeHtml(e.matchedKeywords.join(", "))}` : ""}
        </div>
      </div>
    `;
  };

  const renderGroup = (g: Group) => {
    const label = g.source === "ehcp" ? "EHCP outcome" : g.source === "iep" ? "IEP target" : "Other evidence";
    const count = g.entries.length;
    return `
      <section class="group group-${g.source}">
        <h2>
          <span class="group-source">${escapeHtml(label)}</span>
          <span class="group-count">${count} worksheet${count === 1 ? "" : "s"}</span>
        </h2>
        <p class="group-text">${escapeHtml(g.text)}</p>
        ${count === 0
          ? `<p class="group-empty">No worksheets yet evidence this ${escapeHtml(label.toLowerCase())}.</p>`
          : g.entries.map(renderEntry).join("")
        }
      </section>
    `;
  };

  const untaggedSection = untagged.length === 0 ? "" : `
    <section class="group group-untagged">
      <h2>
        <span class="group-source">Other tagged worksheets</span>
        <span class="group-count">${untagged.length} worksheet${untagged.length === 1 ? "" : "s"}</span>
      </h2>
      <p class="group-text"><em>These were tagged for this pupil but the original outcome / target text has since been edited or removed.</em></p>
      ${untagged.map(ws => renderEntry({ ws, score: 0, matchedKeywords: [] })).join("")}
    </section>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Evidence Pack — ${escapeHtml(pupil.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; max-width: 880px; margin: 0 auto; padding: 32px 28px 60px; line-height: 1.5; }
  header.pack-head { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  header.pack-head h1 { font-size: 26px; margin: 0 0 6px; color: #0f172a; }
  header.pack-head .sub { color: #475569; font-size: 14px; }
  header.pack-head .summary { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; }
  header.pack-head .summary .stat { background: #f1f5f9; border-radius: 6px; padding: 6px 12px; font-size: 13px; }
  header.pack-head .summary .stat strong { color: #0f172a; }
  .group { margin-bottom: 28px; padding: 16px 18px; border-radius: 10px; background: #fff; border: 1px solid #e2e8f0; page-break-inside: avoid; }
  .group-ehcp { border-left: 6px solid #2563eb; }
  .group-iep { border-left: 6px solid #16a34a; }
  .group-untagged { border-left: 6px solid #9ca3af; }
  .group h2 { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 15px; margin: 0 0 6px; color: #0f172a; }
  .group .group-source { text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; font-size: 12px; color: #475569; }
  .group .group-count { font-size: 12px; color: #64748b; font-weight: 500; }
  .group-text { margin: 0 0 12px; color: #1e293b; font-size: 14px; font-style: italic; }
  .group-empty { color: #94a3b8; font-size: 13px; margin: 8px 0 0; }
  .entry { padding: 10px 0; border-top: 1px dashed #e2e8f0; }
  .entry:first-of-type { border-top: none; }
  .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .entry-title { font-weight: 600; font-size: 14px; color: #0f172a; }
  .entry-date { font-size: 12px; color: #64748b; white-space: nowrap; }
  .entry-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
  .pill { background: #e0e7ff; color: #1e3a8a; font-size: 11px; padding: 2px 8px; border-radius: 999px; font-weight: 500; }
  .pill-adapt { background: #fef3c7; color: #78350f; }
  .entry-evidence { font-size: 12px; color: #475569; margin-top: 4px; }
  footer.pack-foot { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  @media print {
    body { padding: 20px 16px; }
    .group { box-shadow: none !important; }
    @page { margin: 16mm 14mm; }
  }
</style>
</head>
<body>
  <header class="pack-head">
    <h1>SEND Evidence Pack</h1>
    <div class="sub"><strong>Pupil:</strong> ${escapeHtml(pupil.name)} &middot; <strong>Year group:</strong> ${escapeHtml(pupil.yearGroup || "—")} &middot; <strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
    <div class="summary">
      <span class="stat"><strong>${(pupil.ehcpOutcomes || []).length}</strong> EHCP outcomes</span>
      <span class="stat"><strong>${(pupil.iepTargets || []).length}</strong> IEP targets</span>
      <span class="stat"><strong>${matched.length}</strong> tagged worksheets</span>
      <span class="stat"><strong>${totalTagged}</strong> outcome links</span>
    </div>
  </header>

  ${groupsArr.length === 0
    ? `<p style="color:#475569; font-size:14px;"><em>No EHCP outcomes or IEP targets recorded for this pupil yet. Add them on the Pupil Profile to begin tagging worksheet evidence automatically.</em></p>`
    : groupsArr.map(renderGroup).join("")
  }
  ${untaggedSection}

  <footer class="pack-foot">
    Generated by SEND Assistant. Worksheets are auto-tagged based on keyword overlap between worksheet content and the pupil's EHCP outcomes / IEP targets at time of generation. Always confirm tags before sharing externally.
  </footer>
</body>
</html>`;
}

/**
 * Open the printable evidence pack in a new window so the teacher can save
 * as PDF or print directly. Mirrors the pattern used by buildPopupHtml.
 */
export function openEvidencePackWindow(pupil: Child, worksheets: Worksheet[]): void {
  const html = buildEvidencePackHtml(pupil, worksheets);
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) {
    // Pop-up blocked — fall back to data: URL so the teacher still gets the file.
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.location.href = url;
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
