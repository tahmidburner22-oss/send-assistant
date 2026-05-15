/**
 * class-pack.ts
 *
 * Builds a single printable booklet where each pupil gets one personalised
 * page based on the *same* learning intention. Same worksheet, six different
 * scaffolds — print once, hand out.
 *
 * Workflow:
 *   1. Caller passes the base worksheet + a list of selected pupils.
 *   2. For each pupil, we transform the sections via existing free-tier
 *      AI helpers (aiDifferentiateExistingWorksheet for tier, then
 *      aiAdjustReadingLevel if a reading age is set) and apply the pupil's
 *      accessibility profile (font/spacing) at print time.
 *   3. We compose a self-contained popup HTML string with one pupil per page,
 *      page-break-after between pages, and open it for the browser to print.
 *
 * Cost: only the existing free-tier providers are used. Each pupil = 1 AI
 * call max. A class of 30 = ~30 calls; well within Groq/Gemini free quotas.
 */

import {
  aiDifferentiateExistingWorksheet,
  aiAdjustReadingLevel,
} from "@/lib/ai";
import type { Child } from "@/contexts/AppContext";
import {
  getKatexCssInline,
  buildPopupHtml,
} from "@/lib/pdf-generator-v2";
import {
  buildAccessibilityProfileCss,
  getProfileById,
  GOOGLE_FONTS_HEAD_HTML,
} from "@/lib/accessibility-profiles";
import { renderMath } from "@/components/WorksheetRenderer";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ClassPackSection {
  title: string;
  content: string;
  type?: string;
  teacherOnly?: boolean;
  svg?: string;
  caption?: string;
}

export interface ClassPackInput {
  /** Base worksheet to personalise. */
  baseWorksheet: {
    title: string;
    subtitle?: string;
    sections: ClassPackSection[];
    metadata?: Record<string, any>;
  };
  /** Pupils to generate per-page personalisations for. */
  pupils: Child[];
  /** Subject, topic, year group context (used by the AI helpers). */
  subject?: string;
  topic?: string;
  /** Default tier when a pupil has no SEND tier preference. */
  defaultTier?: "foundation" | "higher";
  /** Per-pupil overrides (tier + accessibility profile + reading age). */
  overrides?: Record<string, {
    tier?: "foundation" | "higher";
    accessibilityProfile?: string;
    readingAge?: number;
  }>;
  /** Progress callback (pupilIndex 0-based, total). */
  onProgress?: (pupilIndex: number, total: number, status: string) => void;
}

export interface ClassPackPupilPage {
  pupilId: string;
  pupilName: string;
  yearGroup: string;
  sendNeeds: string[];
  accessibilityProfileId: string;
  tier?: "foundation" | "higher";
  readingAge?: number;
  sections: ClassPackSection[];
  /** Note from the differentiation step (for the teacher cover sheet). */
  changesNote?: string;
}

export interface ClassPackResult {
  /** Title of the source worksheet. */
  baseTitle: string;
  /** One entry per pupil. */
  pages: ClassPackPupilPage[];
  /** Generated popup HTML for the browser print dialog. */
  popupHtml: string;
  /** Errors per pupil (best-effort — pages still generated with original sections on failure). */
  errors: Array<{ pupilId: string; error: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-pupil page builder
// ─────────────────────────────────────────────────────────────────────────────

function inferTier(child: Child, override: "foundation" | "higher" | undefined, fallback: "foundation" | "higher"): "foundation" | "higher" {
  if (override) return override;
  // Heuristic: if the pupil has any SEND need, default to foundation.
  if ((child.sendNeeds && child.sendNeeds.length > 0) || child.sendNeed) {
    return "foundation";
  }
  return fallback;
}

function inferReadingAgeOverride(child: Child, override: number | undefined): number | undefined {
  if (typeof override === "number" && override >= 5 && override <= 18) return override;
  // Pull a target age from year group if the pupil has any SEND scaffolding need.
  // This is intentionally conservative; teachers can always override.
  if ((child.sendNeeds && child.sendNeeds.length > 0) || child.sendNeed) {
    const yg = String(child.yearGroup || "").replace(/\D/g, "");
    const yearNum = parseInt(yg, 10);
    if (!isNaN(yearNum) && yearNum >= 1 && yearNum <= 13) {
      // Aim ~2 years below chronological for SEND scaffolding (defensible default).
      return Math.max(5, yearNum + 5 - 2);
    }
  }
  return undefined;
}

function inferAccessibilityProfile(child: Child, override: string | undefined): string {
  if (override) return override;
  const needs = (child.sendNeeds || []).map(n => String(n).toLowerCase());
  if (child.sendNeed) needs.push(String(child.sendNeed).toLowerCase());
  if (needs.some(n => n.includes("dyslex"))) return "dyslexia";
  if (needs.some(n => n.includes("vi") || n.includes("vision"))) return "low-vision";
  if (needs.some(n => n.includes("eal") || n.includes("english as"))) return "eal";
  if (needs.some(n => n.includes("autism") || n.includes("asd") || n.includes("adhd"))) return "calm-focus";
  return "standard";
}

/**
 * Personalise the base worksheet sections for a single pupil, returning a
 * full ClassPackPupilPage. Errors are caught and surfaced via the result.
 */
async function buildPupilPage(
  base: ClassPackInput["baseWorksheet"],
  pupil: Child,
  ctx: { subject?: string; topic?: string },
  override: { tier?: "foundation" | "higher"; accessibilityProfile?: string; readingAge?: number } | undefined,
  defaultTier: "foundation" | "higher",
): Promise<{ page: ClassPackPupilPage; error?: string }> {
  const tier = inferTier(pupil, override?.tier, defaultTier);
  const readingAge = inferReadingAgeOverride(pupil, override?.readingAge);
  const profileId = inferAccessibilityProfile(pupil, override?.accessibilityProfile);

  let sections: ClassPackSection[] = base.sections.map(s => ({ ...s }));
  let changesNote: string | undefined;
  let firstError: string | undefined;

  // Step 1 — re-tier (only if the pupil's tier differs from "core" / default).
  // We always re-tier when foundation, since most class packs need scaffolding.
  if (tier === "foundation") {
    try {
      const diff = await aiDifferentiateExistingWorksheet({
        sections: sections.filter(s => !s.teacherOnly).map(s => ({
          title: s.title,
          content: s.content,
          type: s.type,
          teacherOnly: s.teacherOnly,
        })),
        tier: "foundation",
        subject: ctx.subject,
        topic: ctx.topic,
        yearGroup: pupil.yearGroup,
        title: base.title,
      });
      if (diff?.sections?.length) {
        // Merge: keep teacher-only sections as-is, replace pupil-facing.
        const replaced = base.sections.map(s => {
          if (s.teacherOnly) return s;
          const match = diff.sections.find(d => d.title === s.title);
          if (!match) return s;
          return { ...s, content: match.content };
        });
        sections = replaced;
      }
      changesNote = diff?.changesNote;
    } catch (e) {
      firstError = `differentiate: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  // Step 2 — reading-level retarget (if a reading age is inferred/set).
  if (typeof readingAge === "number") {
    try {
      const radj = await aiAdjustReadingLevel({
        sections: sections.filter(s => !s.teacherOnly).map(s => ({
          title: s.title,
          content: s.content,
          type: s.type,
          teacherOnly: s.teacherOnly,
        })),
        targetAge: readingAge,
        subject: ctx.subject,
        yearGroup: pupil.yearGroup,
        sendNeed: pupil.sendNeed,
      });
      if (radj?.sections?.length) {
        const replaced = sections.map(s => {
          if (s.teacherOnly) return s;
          const match = radj.sections.find((d: any) => d.title === s.title);
          if (!match) return s;
          return { ...s, content: match.content };
        });
        sections = replaced;
      }
    } catch (e) {
      if (!firstError) firstError = `reading-age: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return {
    page: {
      pupilId: pupil.id,
      pupilName: pupil.name,
      yearGroup: pupil.yearGroup,
      sendNeeds: pupil.sendNeeds && pupil.sendNeeds.length > 0
        ? pupil.sendNeeds
        : (pupil.sendNeed ? [pupil.sendNeed] : []),
      accessibilityProfileId: profileId,
      tier,
      readingAge,
      sections,
      changesNote,
    },
    error: firstError,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Section → HTML rendering (intentionally simple, print-safe)
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(text: string): string {
  // Mirrors the very lightweight markdown handling we use elsewhere for
  // print HTML so class-pack pages match the look of standard worksheets.
  const withMath = renderMath(text || "");
  return withMath
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3} (.+)$/gm, "<h4 style='font-weight:700;margin-top:.6em;margin-bottom:.2em'>$1</h4>")
    .replace(/^[•\-] (.+)$/gm, "<li>$1</li>")
    .replace(/^\* (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p><li>/g, "<ul><li>")
    .replace(/<\/li><\/p>/g, "</li></ul>");
}

function renderSectionHtml(section: ClassPackSection): string {
  const titleHtml = `<h3 style="font-weight:700;margin:.8em 0 .3em">${escapeHtml(section.title || "")}</h3>`;
  const body = section.content || "";
  return `<section class="ws-section" data-type="${escapeHtml(section.type || "")}">${titleHtml}<div class="ws-content">${inlineMarkdown(body)}</div></section>`;
}

function renderPupilPageHtml(page: ClassPackPupilPage, baseTitle: string): string {
  const sendList = page.sendNeeds.length > 0 ? page.sendNeeds.join(", ") : "—";
  const tierBadge = page.tier ? `<span class="cp-badge">${escapeHtml(page.tier)}</span>` : "";
  const readingBadge = typeof page.readingAge === "number" ? `<span class="cp-badge">Reading age ${page.readingAge}</span>` : "";
  const profileBadge = page.accessibilityProfileId !== "standard" ? `<span class="cp-badge">${escapeHtml(page.accessibilityProfileId)}</span>` : "";

  // Filter out teacher-only sections from the pupil's printed page.
  const pupilSections = page.sections.filter(s => !s.teacherOnly);

  return `
    <article class="cp-pupil-page ws-a11y-${escapeHtml(page.accessibilityProfileId)}" data-profile="${escapeHtml(page.accessibilityProfileId)}">
      <header class="cp-header">
        <div>
          <p class="cp-eyebrow">Class pack — ${escapeHtml(baseTitle)}</p>
          <h2>${escapeHtml(page.pupilName)} <span class="cp-year">Year ${escapeHtml(page.yearGroup)}</span></h2>
          <p class="cp-meta"><strong>SEND:</strong> ${escapeHtml(sendList)}</p>
        </div>
        <div class="cp-badges">${tierBadge}${readingBadge}${profileBadge}</div>
      </header>
      <div class="cp-body">
        ${pupilSections.map(renderSectionHtml).join("\n")}
      </div>
      <footer class="cp-footer">Adaptly · ${escapeHtml(page.pupilName)} · ${escapeHtml(page.yearGroup)}</footer>
    </article>
  `;
}

function renderTeacherCoverSheet(baseTitle: string, pages: ClassPackPupilPage[]): string {
  const rows = pages.map(p => `
    <tr>
      <td>${escapeHtml(p.pupilName)}</td>
      <td>${escapeHtml(p.yearGroup)}</td>
      <td>${escapeHtml(p.sendNeeds.join(", ") || "—")}</td>
      <td>${escapeHtml(p.tier || "core")}</td>
      <td>${typeof p.readingAge === "number" ? p.readingAge : "—"}</td>
      <td>${escapeHtml(p.accessibilityProfileId)}</td>
    </tr>
  `).join("");
  return `
    <article class="cp-cover-page">
      <header class="cp-header">
        <div>
          <p class="cp-eyebrow">Teacher cover sheet</p>
          <h2>${escapeHtml(baseTitle)} — class pack</h2>
          <p class="cp-meta">${pages.length} pupil${pages.length === 1 ? "" : "s"} · one personalised page each.</p>
        </div>
      </header>
      <table class="cp-cover-table">
        <thead><tr>
          <th>Pupil</th><th>Year</th><th>SEND</th><th>Tier</th><th>Reading age</th><th>Profile</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="cp-meta-note">Cut along the page breaks and hand each pupil their own page.</p>
    </article>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite styles for the class-pack popup HTML
// ─────────────────────────────────────────────────────────────────────────────

const CLASS_PACK_CSS = `
  .cp-pupil-page, .cp-cover-page {
    page-break-after: always;
    break-after: page;
    padding: 18mm 14mm;
  }
  .cp-pupil-page:last-child, .cp-cover-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .cp-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 1rem; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;
    margin-bottom: 12px;
  }
  .cp-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin: 0; font-weight: 600; }
  .cp-pupil-page h2, .cp-cover-page h2 { font-size: 22px; margin: 4px 0 6px; line-height: 1.2; }
  .cp-year { font-weight: 500; font-size: 14px; color: #6b7280; }
  .cp-meta { font-size: 12px; margin: 0; color: #4b5563; }
  .cp-meta-note { font-size: 11px; color: #6b7280; margin-top: 12px; }
  .cp-badges { display: flex; flex-wrap: wrap; gap: 6px; }
  .cp-badge {
    font-size: 10px; padding: 2px 8px; border-radius: 999px;
    background: #eef2ff; color: #4338ca; font-weight: 600;
    text-transform: capitalize;
  }
  .cp-body .ws-section { margin-bottom: 14px; page-break-inside: avoid; }
  .cp-body p { margin: 6px 0; line-height: 1.55; }
  .cp-body ul, .cp-body ol { margin: 6px 0 6px 22px; padding: 0; }
  .cp-body li { margin: 2px 0; line-height: 1.5; }
  .cp-footer { margin-top: 16px; font-size: 10px; color: #9ca3af; text-align: right; }
  .cp-cover-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  .cp-cover-table th, .cp-cover-table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  .cp-cover-table th { background: #f9fafb; font-weight: 600; color: #374151; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Public entry — runs the full pack and returns the popup HTML
// ─────────────────────────────────────────────────────────────────────────────

export async function buildClassPack(input: ClassPackInput): Promise<ClassPackResult> {
  const { baseWorksheet, pupils, subject, topic, defaultTier = "foundation", overrides, onProgress } = input;

  if (!baseWorksheet || !Array.isArray(baseWorksheet.sections) || baseWorksheet.sections.length === 0) {
    throw new Error("Base worksheet has no sections.");
  }
  if (!Array.isArray(pupils) || pupils.length === 0) {
    throw new Error("No pupils selected.");
  }

  const pages: ClassPackPupilPage[] = [];
  const errors: Array<{ pupilId: string; error: string }> = [];

  // Sequential rather than parallel — the free-tier providers have low RPM
  // limits, and serialising lets us surface progress to the teacher.
  for (let i = 0; i < pupils.length; i++) {
    const pupil = pupils[i];
    onProgress?.(i, pupils.length, `Personalising for ${pupil.name}…`);
    try {
      const result = await buildPupilPage(
        baseWorksheet,
        pupil,
        { subject, topic },
        overrides?.[pupil.id],
        defaultTier,
      );
      pages.push(result.page);
      if (result.error) errors.push({ pupilId: pupil.id, error: result.error });
    } catch (e) {
      // Catastrophic failure — emit a fallback page using base sections.
      pages.push({
        pupilId: pupil.id,
        pupilName: pupil.name,
        yearGroup: pupil.yearGroup,
        sendNeeds: pupil.sendNeeds && pupil.sendNeeds.length > 0 ? pupil.sendNeeds : (pupil.sendNeed ? [pupil.sendNeed] : []),
        accessibilityProfileId: inferAccessibilityProfile(pupil, overrides?.[pupil.id]?.accessibilityProfile),
        tier: inferTier(pupil, overrides?.[pupil.id]?.tier, defaultTier),
        readingAge: inferReadingAgeOverride(pupil, overrides?.[pupil.id]?.readingAge),
        sections: baseWorksheet.sections.map(s => ({ ...s })),
      });
      errors.push({ pupilId: pupil.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  onProgress?.(pupils.length, pupils.length, "Assembling printable booklet…");

  // Compose the HTML. We build the per-pupil profile CSS once (union of all
  // unique profiles used across the class).
  const profilesUsed = Array.from(new Set(pages.map(p => p.accessibilityProfileId).filter(Boolean)));
  const profileCssChunks: string[] = profilesUsed
    .map(id => {
      const p = getProfileById(id);
      return p ? buildAccessibilityProfileCss(p) : "";
    })
    .filter(Boolean);

  const allCss = `${CLASS_PACK_CSS}\n${profileCssChunks.join("\n")}`;
  const cover = renderTeacherCoverSheet(baseWorksheet.title, pages);
  const body = pages.map(p => renderPupilPageHtml(p, baseWorksheet.title)).join("\n");
  const contentHtml = `${cover}${body}`;

  const popupHtml = buildPopupHtml(contentHtml, getKatexCssInline(), {
    title: `${baseWorksheet.title} — class pack`,
    layout: "per-page",
    viewMode: "student",
    accessibilityProfileCss: allCss,
    extraHeadHtml: GOOGLE_FONTS_HEAD_HTML,
    isPdf: false,
  });

  return {
    baseTitle: baseWorksheet.title,
    pages,
    popupHtml,
    errors,
  };
}

/**
 * Convenience helper: open the class pack in a new window for the teacher to
 * preview / print. The window auto-triggers print when fonts have loaded
 * (handled inside buildPopupHtml's printScript).
 */
export function openClassPackInPopup(html: string, title?: string): Window | null {
  const w = window.open("", "_blank");
  if (!w) return null;
  w.document.open();
  w.document.write(html);
  w.document.close();
  if (title) w.document.title = title;
  return w;
}
