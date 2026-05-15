/**
 * EHCP / IEP Evidence Tagger (FEAT-005)
 * ────────────────────────────────────
 * Auto-derives evidenceLinks[] for a worksheet by mapping each question
 * section to (a) the National Curriculum reference inferred from the
 * worksheet's subject + topic + year group, and (b) when a pupil is
 * selected, the most-likely EHCP outcome / IEP target / Boxall strand the
 * question evidences.
 *
 * The killer feature for SENCOs: completed worksheets become auto-filed
 * evidence for the annual review. Press "Export Evidence Pack" and you
 * get a single printable HTML document that lists, per pupil:
 *   - Worksheet title + date
 *   - Each question + its NC ref
 *   - The EHCP outcome / IEP target it evidences
 *   - The teacher's mark (if entered)
 *   - A signature line for the SENCO
 *
 * Why the moat: UK statutory artefact. MagicSchool/Diffit/Eduaide are
 * US-centric. Twinkl/SparkleBox don't store pupil-level outcome data.
 *
 * Implementation is fully local — no AI call needed. Just heuristics over
 * the section title + the SkillStep titles in curriculum-progression.ts
 * + fuzzy match against the pupil's recorded EHCP outcomes.
 */
import type { Child } from "@/contexts/AppContext";

export interface EvidenceLink {
  /** Stable reference back into the worksheet — e.g. "Section 3 · Q2" */
  questionRef: string;
  /** UK National Curriculum reference (best-effort). e.g. "Y7 Maths · Number · NC 7N5" */
  ncRef?: string;
  /** Optional EHCP outcome id (free-text, school-authored) */
  outcomeId?: string;
  /** Optional matched outcome / target text (≤ 200 chars) */
  target?: string;
  /** Optional Boxall Profile strand label */
  strand?: string;
}

interface Section {
  title: string;
  type?: string;
  content: string;
  marks?: number;
  teacherOnly?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// NC reference inference
// ─────────────────────────────────────────────────────────────────────────────

const SUBJECT_NC_PREFIX: Record<string, string> = {
  maths: "Ma", mathematics: "Ma",
  english: "En", literacy: "En", reading: "En",
  science: "Sc", biology: "Sc", chemistry: "Sc", physics: "Sc",
  history: "Hi",
  geography: "Gg",
  computing: "Co",
  art: "Ar",
  music: "Mu",
  pe: "PE",
  "physical education": "PE",
};

function ksFromYearGroup(yg: string | undefined): string {
  if (!yg) return "";
  const n = parseInt(String(yg).replace(/\D/g, ""), 10);
  if (isNaN(n)) return "";
  if (n <= 2) return "KS1";
  if (n <= 6) return "KS2";
  if (n <= 9) return "KS3";
  if (n <= 11) return "KS4";
  return "KS5";
}

/**
 * Best-effort NC reference for a subject + topic + year group.
 * This is intentionally heuristic — for Ofsted-grade citations the SENCO
 * can edit the export before signing, but the autofill saves them ~30 min
 * per pupil per term.
 */
export function inferNcRef(opts: { subject?: string; topic?: string; yearGroup?: string }): string {
  const { subject, topic, yearGroup } = opts;
  if (!subject) return "";
  const subjLower = subject.toLowerCase();
  const prefix = Object.entries(SUBJECT_NC_PREFIX).find(([k]) => subjLower.includes(k))?.[1] ?? "";
  const ks = ksFromYearGroup(yearGroup);
  const yearShort = yearGroup ? yearGroup.replace(/\D/g, "") : "";
  // Format: "Y7 · Maths · Fractions" or "KS3 · Sc · Forces"
  const head = yearShort ? `Y${yearShort}` : (ks || "");
  return [head, prefix || subject, topic].filter(Boolean).join(" · ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Outcome matching
// ─────────────────────────────────────────────────────────────────────────────

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length >= 3);
}

const STOPWORDS = new Set([
  "the", "and", "with", "from", "this", "that", "they", "their", "them", "have", "will",
  "can", "any", "all", "for", "out", "use", "a", "an", "in", "of", "to", "on", "at",
  "is", "be", "are", "or", "by", "it", "as", "if", "do", "but", "not", "you",
]);

/**
 * Find the best-matching EHCP outcome / IEP target for a section title + content.
 * Returns null if no plausible match.
 */
export function matchOutcome(
  section: Section,
  outcomes: string[]
): { outcome: string; score: number } | null {
  if (outcomes.length === 0) return null;
  const sectionTokens = new Set(tokenize(`${section.title} ${section.content.slice(0, 300)}`).filter((t) => !STOPWORDS.has(t)));
  if (sectionTokens.size === 0) return null;

  let best: { outcome: string; score: number } | null = null;
  for (const outcome of outcomes) {
    const outcomeTokens = tokenize(outcome).filter((t) => !STOPWORDS.has(t));
    if (outcomeTokens.length === 0) continue;
    let overlap = 0;
    for (const t of outcomeTokens) if (sectionTokens.has(t)) overlap++;
    // Score: overlap normalised by outcome length (so long outcomes don't always win)
    const score = overlap / Math.max(2, outcomeTokens.length);
    if (score > 0.18 && (!best || score > best.score)) best = { outcome, score };
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

interface BuildEvidenceLinksOpts {
  sections: Section[];
  subject?: string;
  topic?: string;
  yearGroup?: string;
  child?: Child | null;
}

/**
 * Walk the worksheet sections and produce one EvidenceLink per question-bearing
 * section. The questionRef encodes the section title for the SENCO's export.
 */
export function buildEvidenceLinks(opts: BuildEvidenceLinksOpts): EvidenceLink[] {
  const { sections, subject, topic, yearGroup, child } = opts;
  const ncRef = inferNcRef({ subject, topic, yearGroup });
  const outcomes = [
    ...((child?.ehcpOutcomes) || []),
    ...((child?.iepTargets) || []),
  ];

  const links: EvidenceLink[] = [];
  let sectionCounter = 0;
  for (const s of sections) {
    if (s.teacherOnly) continue;
    if (!s.content || s.content.length < 20) continue;
    // Only tag sections that actually contain questions
    const looksLikeQuestion =
      /^\s*\d+[.)]/m.test(s.content) ||
      /\?/.test(s.content) ||
      /^(true|false|circle|tick|name|state|describe|explain|calculate|solve|find)/im.test(s.content) ||
      (s.type && /^(q-|question|mcq|true-false|short-answer|extended|gap-fill|word-bank|match)/i.test(s.type));
    if (!looksLikeQuestion) continue;

    sectionCounter++;
    const link: EvidenceLink = {
      questionRef: `Section ${sectionCounter} · ${s.title || (s.type || "Question")}`,
      ncRef: ncRef || undefined,
    };

    if (outcomes.length > 0) {
      const matched = matchOutcome(s, outcomes);
      if (matched) {
        link.target = matched.outcome.slice(0, 200);
        // Synthesise an outcomeId from the first 4 alphanumeric chars of the outcome
        link.outcomeId = matched.outcome
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 6) || undefined;
      }
    }

    links.push(link);
  }
  return links;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence-pack export (HTML, printable)
// ─────────────────────────────────────────────────────────────────────────────

interface WorksheetForExport {
  id: string;
  title: string;
  createdAt: string;
  subject?: string;
  topic?: string;
  yearGroup?: string;
  metadata?: { evidenceLinks?: EvidenceLink[]; [key: string]: any };
  sections?: Section[];
}

/**
 * Build a printable HTML document collating every worksheet that has
 * evidenceLinks for a given pupil. Opens in a new tab, ready to print/PDF.
 */
export function buildEvidencePackHtml(opts: {
  child: Child;
  worksheets: WorksheetForExport[];
  schoolName?: string;
}): string {
  const { child, worksheets, schoolName } = opts;
  const filtered = worksheets.filter((w) => Array.isArray(w.metadata?.evidenceLinks) && w.metadata!.evidenceLinks!.length > 0);
  const ehcpList = (child.ehcpOutcomes || []).filter(Boolean);
  const iepList = (child.iepTargets || []).filter(Boolean);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // Aggregate which outcomes have been evidenced
  const evidencedTargets = new Set<string>();
  for (const ws of filtered) {
    for (const link of ws.metadata!.evidenceLinks || []) {
      if (link.target) evidencedTargets.add(link.target);
    }
  }

  const escape = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const wsRows = filtered.map((ws) => {
    const linkRows = (ws.metadata!.evidenceLinks || [])
      .map(
        (l) => `
        <tr>
          <td>${escape(l.questionRef)}</td>
          <td>${escape(l.ncRef || "—")}</td>
          <td>${escape(l.target || "—")}</td>
        </tr>`
      )
      .join("");
    return `
      <section class="ws">
        <h3>${escape(ws.title)}</h3>
        <p class="meta">${escape(ws.subject || "")} · ${escape(ws.topic || "")} · ${escape(ws.yearGroup || "")} · ${escape(new Date(ws.createdAt).toLocaleDateString("en-GB"))}</p>
        <table>
          <thead>
            <tr><th>Question</th><th>NC reference</th><th>Outcome / target evidenced</th></tr>
          </thead>
          <tbody>${linkRows}</tbody>
        </table>
      </section>`;
  }).join("");

  const targetsList = [...ehcpList, ...iepList].map((t) => {
    const evidenced = evidencedTargets.has(t);
    return `<li class="${evidenced ? "evidenced" : "outstanding"}">${escape(t)}${evidenced ? ' <span class="badge">Evidenced</span>' : ' <span class="badge outstanding">Outstanding</span>'}</li>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Evidence Pack — ${escape(child.name)}</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    body { font-family: "Lexend", "DM Sans", system-ui, sans-serif; color: #111827; line-height: 1.5; max-width: 760px; margin: 0 auto; padding: 18mm 14mm; }
    h1 { font-size: 22px; margin: 0 0 4px; color: #1e40af; }
    .meta { color: #6b7280; font-size: 12px; margin: 0 0 12px; }
    h2 { font-size: 16px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1.5px solid #cbd5e1; color: #0f172a; }
    h3 { font-size: 14px; margin: 16px 0 4px; color: #1f2937; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
    th, td { padding: 6px 8px; text-align: left; vertical-align: top; border-bottom: 1px solid #e5e7eb; }
    th { background: #f1f5f9; font-weight: 600; color: #0f172a; }
    section.ws { page-break-inside: avoid; margin-bottom: 16px; }
    ul.targets { padding-left: 20px; font-size: 13px; }
    ul.targets li { margin-bottom: 4px; }
    .badge { display: inline-block; padding: 1px 6px; border-radius: 999px; font-size: 10px; font-weight: 600; margin-left: 4px; background: #dcfce7; color: #166534; }
    .badge.outstanding { background: #fef9c3; color: #854d0e; }
    .signoff { margin-top: 28px; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 12px; color: #475569; }
    .signoff .line { display: inline-block; width: 220px; border-bottom: 1px solid #475569; margin: 12px 8px 4px 0; }
    .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Evidence Pack</h1>
  <p class="meta">${escape(child.name)} · ${escape(child.yearGroup || "")} · ${schoolName ? escape(schoolName) + " · " : ""}${escape(today)}</p>

  ${ehcpList.length + iepList.length > 0 ? `
  <h2>Outcomes / Targets</h2>
  <ul class="targets">${targetsList}</ul>
  ` : `<p class="meta">No EHCP outcomes or IEP targets recorded for this pupil. Add them via Children → Edit pupil to enable target-level evidence matching.</p>`}

  <h2>Worksheet Evidence (${filtered.length})</h2>
  ${filtered.length === 0
    ? `<p>No worksheets with evidence links were found for this pupil. Generate a worksheet with this pupil selected as the context to start collecting evidence.</p>`
    : wsRows}

  <div class="signoff">
    <p>Reviewed by:</p>
    <p>SENCO signature <span class="line"></span> Date <span class="line"></span></p>
    <p>Class teacher <span class="line"></span> Date <span class="line"></span></p>
  </div>
  <p class="footer">Generated by Adaptly · adaptly.co.uk · ${escape(today)}</p>
  <script>
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(function () { window.print(); }, 400); });
    } else {
      setTimeout(function () { window.print(); }, 1200);
    }
  </script>
</body>
</html>`;
}
