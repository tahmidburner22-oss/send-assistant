/**
 * class-pack.ts — Phase 4 / FEAT-004 (Class-pack one-click differentiation)
 *
 * Take ONE base worksheet, iterate over a list of pupils, and produce a single
 * printable booklet (one mini-worksheet per pupil) that the teacher can put on
 * 30 desks in 30 seconds. Each pupil's copy is differentiated by their primary
 * SEND need (via the existing `aiScaffoldExistingWorksheet` endpoint) AND/OR
 * tier-shifted (via `aiDifferentiateExistingWorksheet`) when a target tier is
 * specified.
 *
 * Constraints:
 *   - £0 cost: re-uses the existing free-tier `/api/ai/scaffold-worksheet` and
 *     `/api/ai/differentiate-worksheet` endpoints.
 *   - Sequential, with progress callbacks: a class of 30 pupils means ~30 AI
 *     calls. Concurrency is left at 1 to play nice with rate limits and to
 *     keep the progress bar honest. Failed pupils fall back to the base sheet
 *     so the booklet still prints.
 *   - Renders pure HTML — no React DOM mount required — so the booklet
 *     remains stable even if the user navigates away while it's building.
 *   - Each pupil's section ends with `page-break-after: always`, so a 30-pupil
 *     pack prints to 30 separate sheets.
 *
 * Output is opened in a fresh popup window via `buildPopupHtml`, mirroring
 * the existing `printWorksheetElement` flow so KaTeX, fonts, and screen/print
 * styles all stay consistent.
 */
import {
  aiScaffoldExistingWorksheet,
  aiDifferentiateExistingWorksheet,
} from "@/lib/ai";
import {
  buildPopupHtml,
  getKatexCssInline,
} from "@/lib/pdf-generator-v2";
import type { Child } from "@/contexts/AppContext";

export interface ClassPackSection {
  title: string;
  content: string;
  type?: string;
  teacherOnly?: boolean;
}

export interface ClassPackBaseWorksheet {
  title: string;
  subtitle?: string;
  sections: ClassPackSection[];
  metadata?: {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    examBoard?: string;
    difficulty?: string;
  };
}

export interface ClassPackPupilOptions {
  /** "auto" — pick from pupil's sendNeed/year. "foundation"/"higher" — force tier. "none" — base only. */
  tierMode: "auto" | "foundation" | "higher" | "none";
  /** When true and pupil has a SEND need, run aiScaffoldExistingWorksheet. */
  applySendScaffold: boolean;
  /** When true, prepend an A6 cover page listing every pupil's name + needs. */
  includeCoverPage: boolean;
  /** When true, include a teacher-only crib sheet at the end of the booklet. */
  includeTeacherSummary: boolean;
}

export interface ClassPackProgress {
  /** Pupil index currently being processed (1-based for display). */
  current: number;
  total: number;
  pupilName: string;
  status: "starting" | "scaffolding" | "differentiating" | "ready" | "fallback" | "error";
  message?: string;
}

export interface ClassPackPupilResult {
  child: Child;
  sections: ClassPackSection[];
  /** A short rationale we surface in the cover page + teacher summary. */
  adaptationNote: string;
  /** True if generation fell back to the base sheet (eg. AI failure). */
  fellBack: boolean;
}

export interface ClassPackResult {
  base: ClassPackBaseWorksheet;
  pupils: ClassPackPupilResult[];
  generatedAt: string;
}

const DEFAULT_OPTIONS: ClassPackPupilOptions = {
  tierMode: "auto",
  applySendScaffold: true,
  includeCoverPage: true,
  includeTeacherSummary: true,
};

/**
 * Pick the best tier for a pupil. The rule is intentionally conservative:
 *   - If the pupil's primary need is one we know hides cognitive load
 *     (dyslexia, dyspraxia, EAL, slow processing, anxiety) → foundation.
 *   - If the pupil's year group is in the GCSE band AND the base difficulty
 *     is already foundation → higher (push up).
 *   - Otherwise → no tier shift.
 */
function pickAutoTier(
  child: Child,
  base: ClassPackBaseWorksheet,
): "foundation" | "higher" | null {
  const need = (child.sendNeed || "").toLowerCase();
  const FOUNDATION_NEEDS = new Set([
    "dyslexia",
    "dyspraxia",
    "eal",
    "slow-processing",
    "processing-speed",
    "asd-low-cognitive",
    "complex-needs",
    "moderate-learning-difficulties",
    "mld",
    "speech-language",
  ]);
  if (FOUNDATION_NEEDS.has(need)) return "foundation";

  const baseTier = (base.metadata?.difficulty || "").toLowerCase();
  const yr = (child.yearGroup || "").toLowerCase();
  const isGCSE = /(year ?9|year ?10|year ?11|y9|y10|y11)/.test(yr);
  if (isGCSE && baseTier === "foundation" && !need) return "higher";

  return null;
}

/**
 * Run a class-pack generation. Calls `onProgress` after every pupil so the UI
 * can update a progress bar. Never throws — failed pupils get the base sheet
 * with `fellBack: true`.
 */
export async function runClassPack(input: {
  base: ClassPackBaseWorksheet;
  pupils: Child[];
  options?: Partial<ClassPackPupilOptions>;
  onProgress?: (p: ClassPackProgress) => void;
  /** AbortSignal lets the dialog cancel mid-pack. */
  signal?: AbortSignal;
}): Promise<ClassPackResult> {
  const options = { ...DEFAULT_OPTIONS, ...(input.options || {}) };
  const total = input.pupils.length;
  const pupils: ClassPackPupilResult[] = [];

  for (let i = 0; i < total; i++) {
    if (input.signal?.aborted) break;
    const child = input.pupils[i];
    const reportingName = child.name || child.code || `Pupil ${i + 1}`;
    input.onProgress?.({
      current: i + 1,
      total,
      pupilName: reportingName,
      status: "starting",
    });

    let working: ClassPackSection[] = input.base.sections.map((s) => ({ ...s }));
    let note: string[] = [];
    let fellBack = false;

    // ── Step 1 — tier shift (foundation / higher / none) ────────────────────
    let targetTier: "foundation" | "higher" | null = null;
    if (options.tierMode === "foundation" || options.tierMode === "higher") {
      targetTier = options.tierMode;
    } else if (options.tierMode === "auto") {
      targetTier = pickAutoTier(child, input.base);
    }

    if (targetTier) {
      input.onProgress?.({
        current: i + 1,
        total,
        pupilName: reportingName,
        status: "differentiating",
        message: `Shifting to ${targetTier}…`,
      });
      try {
        const res = await aiDifferentiateExistingWorksheet({
          sections: working,
          tier: targetTier,
          subject: input.base.metadata?.subject,
          topic: input.base.metadata?.topic,
          yearGroup: child.yearGroup || input.base.metadata?.yearGroup,
          title: input.base.title,
        });
        if (Array.isArray(res.sections) && res.sections.length > 0) {
          working = res.sections.map((s) => ({ ...s }));
          note.push(
            `Tier: ${targetTier}${res.changesNote ? ` — ${shorten(res.changesNote, 90)}` : ""}`,
          );
        }
      } catch (e) {
        fellBack = true;
        note.push(`Tier shift failed (${shorten(String(e), 60)})`);
      }
    }

    // ── Step 2 — SEND scaffold (additive, on top of the tier shift) ─────────
    const need = (child.sendNeed || "").trim();
    if (options.applySendScaffold && need && need !== "none-selected") {
      input.onProgress?.({
        current: i + 1,
        total,
        pupilName: reportingName,
        status: "scaffolding",
        message: `Adding ${need} scaffolds…`,
      });
      try {
        const res = await aiScaffoldExistingWorksheet({
          sections: working,
          sendNeed: need,
          subject: input.base.metadata?.subject,
          topic: input.base.metadata?.topic,
          yearGroup: child.yearGroup || input.base.metadata?.yearGroup,
          title: input.base.title,
        });
        if (Array.isArray(res.sections) && res.sections.length > 0) {
          working = res.sections.map((s) => ({ ...s }));
          const applied = (res.scaffoldingApplied || []).slice(0, 3).join(", ");
          note.push(`SEND: ${need}${applied ? ` (${applied})` : ""}`);
        }
      } catch (e) {
        fellBack = true;
        note.push(`Scaffold failed (${shorten(String(e), 60)})`);
      }
    }

    if (note.length === 0) note.push("Base sheet (no adaptations applied).");

    pupils.push({
      child,
      sections: working,
      adaptationNote: note.join(" · "),
      fellBack,
    });

    input.onProgress?.({
      current: i + 1,
      total,
      pupilName: reportingName,
      status: fellBack ? "fallback" : "ready",
    });
  }

  return {
    base: input.base,
    pupils,
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML rendering
// ─────────────────────────────────────────────────────────────────────────────

/** Escape user content so we never inject markup. */
function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Inline-format a small subset of markdown so AI scaffolds keep their bold/italic. */
function lightInline(s: string): string {
  let out = esc(s);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

/** Render one section into a clean HTML block. */
function renderSection(s: ClassPackSection, viewMode: "teacher" | "student"): string {
  if (viewMode === "student" && s.teacherOnly) return "";
  if (
    viewMode === "student" &&
    (s.type === "answers" || s.type === "mark-scheme" || s.type === "teacher-notes" || s.type === "teacher-note")
  ) {
    return "";
  }

  const safeTitle = esc(s.title || "Section");
  const lines = String(s.content || "").split(/\r?\n/);
  const body = lines
    .map((ln) => {
      const trimmed = ln.trim();
      if (!trimmed) return "";
      if (/^>\s/.test(trimmed)) {
        return `<div class="cp-callout">${lightInline(trimmed.replace(/^>\s/, ""))}</div>`;
      }
      // Numbered question
      const num = trimmed.match(/^(Q?\d+[.)]|\([a-z]\))\s+(.+)$/i);
      if (num) {
        return `<p class="cp-q"><span class="cp-q-num">${esc(num[1])}</span> ${lightInline(num[2])}</p>`;
      }
      return `<p>${lightInline(trimmed)}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<section class="cp-section${s.teacherOnly ? " cp-teacher" : ""}">
    <h3 class="cp-section-title">${safeTitle}</h3>
    <div class="cp-section-body">${body}</div>
  </section>`;
}

/** Render one pupil's worksheet page. */
function renderPupilPage(
  pupil: ClassPackPupilResult,
  base: ClassPackBaseWorksheet,
  index: number,
  viewMode: "teacher" | "student",
): string {
  const subject = esc(base.metadata?.subject || "");
  const topic = esc(base.metadata?.topic || "");
  const year = esc(pupil.child.yearGroup || base.metadata?.yearGroup || "");
  const need = esc(pupil.child.sendNeed || "");
  const sectionsHtml = (pupil.sections || []).map((s) => renderSection(s, viewMode)).join("\n");

  return `<article class="cp-page" data-pupil-index="${index}">
    <header class="cp-header">
      <div>
        <div class="cp-pupil-row">
          <span class="cp-badge">Pupil ${index + 1}</span>
          ${pupil.fellBack ? `<span class="cp-badge cp-badge-warn">FALLBACK</span>` : ""}
        </div>
        <h2 class="cp-title">${esc(base.title)}</h2>
        <div class="cp-meta">
          <span><strong>Pupil:</strong> ${esc(pupil.child.name || pupil.child.code || "—")}</span>
          ${year ? `<span><strong>Year:</strong> ${year}</span>` : ""}
          ${subject ? `<span><strong>Subject:</strong> ${subject}</span>` : ""}
          ${topic ? `<span><strong>Topic:</strong> ${topic}</span>` : ""}
          ${need ? `<span><strong>Adapted for:</strong> ${need}</span>` : ""}
        </div>
        ${
          viewMode === "teacher"
            ? `<div class="cp-note ${pupil.fellBack ? "cp-note-warn" : ""}">${esc(pupil.adaptationNote)}</div>`
            : ""
        }
      </div>
    </header>
    <div class="cp-body">${sectionsHtml}</div>
    <footer class="cp-footer">
      <span>Generated by Adaptly · adaptly.co.uk</span>
      <span>${new Date().toLocaleDateString("en-GB")}</span>
    </footer>
  </article>`;
}

/** Render the booklet cover page. */
function renderCoverPage(result: ClassPackResult): string {
  const rows = result.pupils
    .map(
      (p, i) => `<tr>
        <td class="cp-cover-num">${i + 1}</td>
        <td>${esc(p.child.name || p.child.code || "—")}</td>
        <td>${esc(p.child.yearGroup || "")}</td>
        <td>${esc(p.child.sendNeed || "")}</td>
        <td class="cp-cover-note ${p.fellBack ? "cp-note-warn" : ""}">${esc(p.adaptationNote)}</td>
      </tr>`,
    )
    .join("\n");

  const subject = esc(result.base.metadata?.subject || "");
  const topic = esc(result.base.metadata?.topic || "");
  const year = esc(result.base.metadata?.yearGroup || "");
  return `<article class="cp-page cp-cover">
    <header class="cp-cover-header">
      <span class="cp-badge cp-badge-emerald">CLASS PACK</span>
      <h1 class="cp-cover-title">${esc(result.base.title)}</h1>
      <div class="cp-cover-meta">
        ${year ? `<span>${year}</span>` : ""}
        ${subject ? `<span>· ${subject}</span>` : ""}
        ${topic ? `<span>· ${topic}</span>` : ""}
        <span>· ${result.pupils.length} pupil${result.pupils.length === 1 ? "" : "s"}</span>
      </div>
    </header>
    <table class="cp-cover-table">
      <thead><tr><th>#</th><th>Pupil</th><th>Year</th><th>SEND need</th><th>Adaptation</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="cp-cover-tip">
      Cut along the page breaks — one differentiated copy per pupil.
      Teacher-only adaptation notes appear on each page when in Teacher view; student copies hide them.
    </p>
  </article>`;
}

/**
 * Build a complete printable booklet HTML document. Returns the string so the
 * caller can either open it in a popup or download it.
 */
export function buildClassPackHtml(result: ClassPackResult, opts: {
  viewMode?: "teacher" | "student";
  includeCoverPage?: boolean;
  includeTeacherSummary?: boolean;
} = {}): string {
  const viewMode: "teacher" | "student" = opts.viewMode || "student";
  const includeCover = opts.includeCoverPage !== false;

  const cover = includeCover ? renderCoverPage(result) : "";
  const pupilPages = result.pupils
    .map((p, i) => renderPupilPage(p, result.base, i, viewMode))
    .join('\n<div class="cp-page-break"></div>\n');

  const summary = (opts.includeTeacherSummary && viewMode === "teacher")
    ? renderTeacherSummary(result)
    : "";

  const stylesheet = `
    @page { size: A4 portrait; margin: 14mm 12mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; margin: 0; }
    .cp-page { padding: 0; max-width: 760px; margin: 0 auto 24px; page-break-after: always; }
    .cp-page:last-child { page-break-after: auto; }
    .cp-page-break { page-break-after: always; height: 0; }
    .cp-header { border-bottom: 2px solid #1a2744; padding-bottom: 8px; margin-bottom: 12px; }
    .cp-title { font-size: 18px; margin: 4px 0 4px; color: #1a2744; }
    .cp-meta { font-size: 11px; color: #4b5563; display: flex; flex-wrap: wrap; gap: 12px; }
    .cp-meta strong { color: #111827; font-weight: 600; }
    .cp-pupil-row { display: flex; gap: 6px; align-items: center; margin-bottom: 2px; }
    .cp-badge { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.06em; background: #1a2744; color: #fff; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; }
    .cp-badge-emerald { background: #10b981; }
    .cp-badge-warn { background: #f59e0b; }
    .cp-note { margin-top: 6px; font-size: 11px; color: #065f46; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 4px; }
    .cp-note-warn { color: #92400e; background: #fffbeb; border-color: #fcd34d; }
    .cp-section { margin-bottom: 14px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
    .cp-section-title { font-size: 13px; background: #1a2744; color: #fff; padding: 6px 10px; margin: 0; font-weight: 700; }
    .cp-section-body { padding: 8px 10px; font-size: 12px; line-height: 1.55; }
    .cp-section-body p { margin: 0 0 6px; }
    .cp-q { padding-left: 24px; position: relative; }
    .cp-q-num { position: absolute; left: 0; top: 0; font-weight: 700; }
    .cp-callout { border-left: 3px solid #f59e0b; background: #fffbeb; padding: 4px 8px; margin: 4px 0; font-size: 11.5px; }
    .cp-teacher { border-color: #f59e0b; background: #fffbeb; }
    .cp-footer { margin-top: 12px; padding-top: 6px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 9px; color: #9ca3af; }
    /* Cover */
    .cp-cover-header { text-align: center; margin-bottom: 18px; }
    .cp-cover-title { font-size: 24px; color: #064e3b; margin: 6px 0; }
    .cp-cover-meta { font-size: 12px; color: #4b5563; display: inline-flex; gap: 4px; flex-wrap: wrap; }
    .cp-cover-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .cp-cover-table th, .cp-cover-table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    .cp-cover-table thead th { background: #f3f4f6; font-weight: 700; }
    .cp-cover-num { font-weight: 700; color: #6b7280; width: 24px; }
    .cp-cover-note { font-size: 10.5px; color: #065f46; }
    .cp-cover-tip { font-size: 11px; color: #6b7280; margin-top: 14px; font-style: italic; }
    @media screen { body { background: #f3f4f6; padding: 16px; } .cp-page { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 24px; border-radius: 6px; } }
  `;

  const contentHtml = `<div class="worksheet-print-root"><style>${stylesheet}</style>${cover}${pupilPages}${summary}</div>`;
  const katexCss = getKatexCssInline();
  return buildPopupHtml(contentHtml, katexCss, {
    viewMode,
    layout: "together",
    title: `Class pack — ${result.base.title}`,
  });
}

function renderTeacherSummary(result: ClassPackResult): string {
  const items = result.pupils
    .map(
      (p) =>
        `<li><strong>${esc(p.child.name || p.child.code || "—")}</strong> — ${esc(p.adaptationNote)}</li>`,
    )
    .join("\n");
  return `<article class="cp-page ws-teacher-section">
    <h2 class="cp-title">Teacher crib sheet</h2>
    <p style="font-size:11px;color:#6b7280;">One-line summary of every adaptation in this pack. Print on the back of the cover sheet.</p>
    <ol style="font-size:12px;line-height:1.6;padding-left:20px;">${items}</ol>
  </article>`;
}

/** Open a class-pack booklet in a new window. */
export function openClassPackWindow(result: ClassPackResult, opts: {
  viewMode?: "teacher" | "student";
  includeCoverPage?: boolean;
  includeTeacherSummary?: boolean;
} = {}): Window | null {
  const html = buildClassPackHtml(result, opts);
  const win = window.open("", "_blank", "width=900,height=750,scrollbars=yes,resizable=yes");
  if (!win) return null;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return win;
}

function shorten(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
