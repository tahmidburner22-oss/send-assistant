/**
 * unitPackPdfShim.ts — FEAT-PC5 (pack-1)
 *
 * Tiny PDF synthesiser used by `bundleUnit('zip')`. Lives separately so
 * unitPack.ts can lazy-import it (keeps tests fast — they mock this whole
 * module instead of the much larger pdf-generator surface).
 */
import { jsPDF } from "jspdf";
import type { AIWorksheetResult, AIWorksheetSection } from "./ai";
import type { UnitPlan, UnitPlanLesson } from "./unitPack";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - 2 * MARGIN;

/** Build a single lesson PDF. `view = "teacher"` keeps every section. */
export async function buildLessonPdfBlob(
  plan: UnitPlan,
  lesson: UnitPlanLesson,
  worksheet: AIWorksheetResult,
  view: "student" | "teacher",
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(safe(worksheet.title || lesson.title), MARGIN, y);
  y += 7;

  if (worksheet.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(safe(worksheet.subtitle), MARGIN, y);
    y += 6;
  }
  doc.setFontSize(9);
  doc.setTextColor(120);
  const meta = `${plan.subject} · ${plan.yearGroup} · ${plan.topic}` +
    (lesson.specRefs.length ? ` · ${lesson.specRefs.join(", ")}` : "");
  doc.text(safe(meta), MARGIN, y);
  y += 5;
  doc.setTextColor(0);

  for (const section of worksheet.sections || []) {
    if (view === "student" && shouldHideForStudent(section)) continue;
    y = renderSection(doc, section, y);
    y += 3;
  }

  return doc.output("blob");
}

function shouldHideForStudent(s: AIWorksheetSection): boolean {
  if (s.teacherOnly) return true;
  const t = (s.type || "").toLowerCase();
  return t === "answers" || t === "mark-scheme" || t === "teacher-notes" || t === "teacher-note";
}

function renderSection(doc: jsPDF, section: AIWorksheetSection, yIn: number): number {
  let y = yIn;
  if (y > PAGE_H - 30) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(safe(section.title || "Section"), MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(safe(plain(section.content || "")), CONTENT_W);
  for (const line of lines) {
    if (y > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(line, MARGIN, y);
    y += 5;
  }
  return y;
}

/** Strip markdown emphasis + LaTeX delimiters that the default jsPDF font cannot render. */
function plain(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\\(([\s\S]+?)\\\)/g, "$1")
    .replace(/\\\[([\s\S]+?)\\\]/g, "$1")
    .replace(/\$([^$\n]+?)\$/g, "$1");
}

/** Replace symbols that the default jsPDF font (Helvetica) cannot encode. */
function safe(s: string): string {
  return String(s ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "--")
    .replace(/\u2013/g, "-")
    .replace(/\u00D7/g, "x")
    .replace(/\u00F7/g, "/")
    .replace(/\u2212/g, "-")
    .replace(/\u2022/g, "*")
    .replace(/\u00A0/g, " ");
}
