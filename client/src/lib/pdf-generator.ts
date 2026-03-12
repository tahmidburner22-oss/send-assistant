// PDF Generator using jsPDF - handles colour overlays, text sizes, edits, teacher/student views
import { jsPDF } from "jspdf";
import type { GeneratedWorksheet } from "./worksheet-generator";
import { colorOverlays } from "./send-data";

interface PdfOptions {
  overlayId?: string;
  fontSize?: number;
  viewMode?: "teacher" | "student";
  editedContent?: string;
}

// Colour constants
const BRAND_GREEN = [16, 185, 129] as const;
const PURPLE = [124, 58, 237] as const;
const DARK_TEXT = [26, 26, 26] as const;
const GREY_TEXT = [100, 100, 100] as const;
const LIGHT_GREY = [200, 200, 200] as const;
const VOCAB_BG = [240, 253, 244] as const;
const VOCAB_TEXT = [22, 101, 52] as const;

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}

// Replace Unicode characters that jsPDF default Helvetica cannot render
function sanitizeForPdf(text: string): string {
  return text
    .replace(/\u2192|\u279C|\u2794/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2014/g, " -- ")
    .replace(/\u2013/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00D7/g, "x")
    .replace(/\u00F7/g, "/")
    .replace(/\u2212/g, "-")
    .replace(/\u2022/g, "*")
    .replace(/\u00A0/g, " ")
    .replace(/\u2713/g, "v")
    .replace(/\u2717/g, "x")
    .replace(/\u2610/g, "[ ]")
    .replace(/\u2611/g, "[x]");
}

function stripHtmlTags(html: string): string {
  const cleaned = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  return sanitizeForPdf(cleaned);
}

function cleanMarkdown(text: string): string {
  const cleaned = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^- \[ \] /gm, "[ ] ")
    .replace(/^- \[x\] /gm, "[x] ")
    .replace(/^- /gm, "* ")
    .replace(/^---$/gm, "");
  return sanitizeForPdf(cleaned);
}

function parseBoldSegments(text: string): Array<{ text: string; bold: boolean }> {
  const segments: Array<{ text: string; bold: boolean }> = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  if (segments.length === 0) {
    segments.push({ text, bold: false });
  }

  return segments;
}

class PdfBuilder {
  private doc: jsPDF;
  private y: number;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private fontSize: number;
  private overlayColor: [number, number, number];
  private pageCount: number;

  constructor(options: PdfOptions = {}) {
    this.doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 20;
    this.contentWidth = this.pageWidth - 2 * this.margin;
    this.fontSize = options.fontSize || 12;
    this.y = this.margin;
    this.pageCount = 1;

    const overlay = colorOverlays.find(o => o.id === (options.overlayId || "none"));
    this.overlayColor = overlay ? hexToRgb(overlay.color) : [255, 255, 255];
    this.applyBackground();
  }

  private applyBackground() {
    this.doc.setFillColor(...this.overlayColor);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");
  }

  private checkPageBreak(neededHeight: number) {
    if (this.y + neededHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.pageCount++;
      this.applyBackground();
      this.y = this.margin;
    }
  }

  addTitle(text: string) {
    this.checkPageBreak(15);
    const safeText = sanitizeForPdf(text);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(this.fontSize + 8);
    this.doc.setTextColor(...DARK_TEXT);
    const lines = this.doc.splitTextToSize(safeText, this.contentWidth);
    this.doc.text(lines, this.margin, this.y);
    this.y += lines.length * (this.fontSize + 8) * 0.45 + 2;

    this.doc.setDrawColor(...BRAND_GREEN);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.y, this.margin + this.contentWidth, this.y);
    this.y += 4;
  }

  addSubtitle(text: string) {
    this.checkPageBreak(10);
    const safeText = sanitizeForPdf(text);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(this.fontSize - 1);
    this.doc.setTextColor(...GREY_TEXT);
    const lines = this.doc.splitTextToSize(safeText, this.contentWidth);
    this.doc.text(lines, this.margin, this.y);
    this.y += lines.length * (this.fontSize - 1) * 0.4 + 5;
  }

  addSectionHeader(text: string) {
    this.checkPageBreak(12);
    this.y += 3;
    const safeText = sanitizeForPdf(text);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(this.fontSize + 2);
    this.doc.setTextColor(...PURPLE);
    const lines = this.doc.splitTextToSize(safeText, this.contentWidth);
    this.doc.text(lines, this.margin, this.y);
    this.y += lines.length * (this.fontSize + 2) * 0.45 + 1;

    this.doc.setDrawColor(...LIGHT_GREY);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin, this.y, this.margin + this.contentWidth, this.y);
    this.y += 3;
  }

  addParagraph(text: string) {
    const cleanText = sanitizeForPdf(stripHtmlTags(text));
    const lineHeight = this.fontSize * 0.45;
    const paragraphs = cleanText.split("\n");

    for (const para of paragraphs) {
      if (!para.trim()) {
        this.y += lineHeight * 0.5;
        continue;
      }

      // Detect bullets: starts with "* " but NOT "**" (bold markdown)
      const trimmedPara = para.trim();
      const isBullet = (trimmedPara.startsWith("* ") && !trimmedPara.startsWith("**")) || trimmedPara.startsWith("- ");
      const bulletIndent = isBullet ? 5 : 0;
      const bulletText = isBullet ? trimmedPara.replace(/^[*\-]\s*/, "") : para;

      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(this.fontSize);
      this.doc.setTextColor(...DARK_TEXT);

      const lines = this.doc.splitTextToSize(bulletText, this.contentWidth - bulletIndent);
      this.checkPageBreak(lines.length * lineHeight + 2);

      if (isBullet) {
        this.doc.setTextColor(...BRAND_GREEN);
        this.doc.text("*", this.margin, this.y);
        this.doc.setTextColor(...DARK_TEXT);
      }

      this.doc.text(lines, this.margin + bulletIndent, this.y);
      this.y += lines.length * lineHeight + 1;
    }
    this.y += 2;
  }

  addRichText(text: string) {
    const cleanText = sanitizeForPdf(stripHtmlTags(text));
    const paragraphs = cleanText.split("\n");
    const lineHeight = this.fontSize * 0.45;

    for (const para of paragraphs) {
      if (!para.trim()) {
        this.y += lineHeight * 0.5;
        continue;
      }

      // Detect bullets: starts with "* " but NOT "**" (bold markdown)
      const trimmedPara = para.trim();
      const isBullet = (trimmedPara.startsWith("* ") && !trimmedPara.startsWith("**")) || trimmedPara.startsWith("- ");
      const bulletIndent = isBullet ? 5 : 0;
      const bulletText = isBullet ? trimmedPara.replace(/^[*\-]\s*/, "") : para;

      const segments = parseBoldSegments(bulletText);
      const plainText = segments.map(s => s.text).join("");

      this.doc.setFontSize(this.fontSize);
      const lines = this.doc.splitTextToSize(plainText, this.contentWidth - bulletIndent);
      this.checkPageBreak(lines.length * lineHeight + 2);

      if (isBullet) {
        this.doc.setTextColor(...BRAND_GREEN);
        this.doc.text("*", this.margin, this.y);
      }

      this.doc.setTextColor(...DARK_TEXT);
      for (const line of lines) {
        const lineBoldCheck = segments.some(s => s.bold && line.includes(s.text));
        if (lineBoldCheck) {
          this.doc.setFont("helvetica", "bold");
        } else {
          this.doc.setFont("helvetica", "normal");
        }
        this.doc.text(line, this.margin + bulletIndent, this.y);
        this.y += lineHeight;
      }
      this.y += 1;
    }
    this.y += 2;
  }

  addVocabulary(words: string[]) {
    this.checkPageBreak(15);
    const pillWidth = 35;
    const pillHeight = 7;
    const pillGap = 3;
    const pillsPerRow = Math.floor(this.contentWidth / (pillWidth + pillGap));
    let x = this.margin;
    let rowCount = 0;

    for (let i = 0; i < words.length; i++) {
      if (rowCount >= pillsPerRow) {
        x = this.margin;
        this.y += pillHeight + pillGap;
        rowCount = 0;
        this.checkPageBreak(pillHeight + pillGap);
      }

      this.doc.setFillColor(...VOCAB_BG);
      this.doc.roundedRect(x, this.y - 4, pillWidth, pillHeight, 3, 3, "F");

      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(this.fontSize - 3);
      this.doc.setTextColor(...VOCAB_TEXT);
      const safeWord = sanitizeForPdf(words[i]);
      const truncated = safeWord.length > 15 ? safeWord.substring(0, 14) + "..." : safeWord;
      this.doc.text(truncated, x + pillWidth / 2, this.y, { align: "center" });

      x += pillWidth + pillGap;
      rowCount++;
    }
    this.y += pillHeight + 4;
  }

  addAnswerLine(width?: number) {
    this.checkPageBreak(8);
    const lineWidth = width || this.contentWidth * 0.6;
    this.doc.setDrawColor(...LIGHT_GREY);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.y, this.margin + lineWidth, this.y);
    this.y += 6;
  }

  addSpacer(height: number = 5) {
    this.y += height;
  }

  addFooter() {
    const footerY = this.pageHeight - 10;
    for (let i = 1; i <= this.pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(...GREY_TEXT);
      this.doc.text(`Adaptly -- Page ${i} of ${this.pageCount}`, this.pageWidth / 2, footerY, { align: "center" });
      this.doc.text(new Date().toLocaleDateString("en-GB"), this.pageWidth - this.margin, footerY, { align: "right" });
    }
  }

  save(filename: string) {
    this.addFooter();
    this.doc.save(filename);
  }

  getBlob(): Blob {
    this.addFooter();
    return this.doc.output("blob");
  }
}

// ============================================================
// WORKSHEET PDF
// ============================================================
export function downloadWorksheetPdf(
  worksheet: GeneratedWorksheet,
  options: PdfOptions = {}
) {
  const { viewMode = "teacher", overlayId, fontSize, editedContent } = options;
  const pdf = new PdfBuilder({ overlayId, fontSize });

  pdf.addTitle(worksheet.title);
  pdf.addSubtitle(worksheet.subtitle);
  pdf.addSpacer(3);

  for (const section of worksheet.sections) {
    // In student view, hide all teacher-only content
    if (viewMode === "student" && (
      section.teacherOnly ||
      section.type === "answers" ||
      section.type === "mark-scheme" ||
      section.type === "teacher-notes" ||
      section.type === "adaptations"
    )) {
      continue;
    }
    if (section.type === "review") continue;

    pdf.addSectionHeader(section.title);

    if (section.type === "vocabulary") {
      const words = section.content.split(" | ").map(w => w.trim()).filter(Boolean);
      pdf.addVocabulary(words);
    } else {
      const content = editedContent && section.type === "independent" ? editedContent : section.content;
      pdf.addRichText(content);
    }

    pdf.addSpacer(2);
  }

  const filename = `${worksheet.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${viewMode}.pdf`;
  pdf.save(filename);
}

// ============================================================
// STORY PDF
// ============================================================
export function downloadStoryPdf(
  title: string,
  content: string,
  questions: string[],
  options: { overlayId?: string; fontSize?: number } = {}
) {
  const { overlayId, fontSize } = options;
  const pdf = new PdfBuilder({ overlayId, fontSize });

  const cleanContent = content
    .replace(/^# .+$/gm, "")
    .trim();

  pdf.addTitle(title);
  pdf.addSpacer(3);

  const chapters = cleanContent.split(/^## (.+)$/gm);

  for (let i = 0; i < chapters.length; i++) {
    const chunk = chapters[i].trim();
    if (!chunk) continue;

    if (i % 2 === 1) {
      pdf.addSectionHeader(chunk);
    } else {
      const paragraphs = chunk.split("\n\n").filter(p => p.trim());
      for (const para of paragraphs) {
        pdf.addParagraph(cleanMarkdown(para));
      }
    }
  }

  if (questions.length > 0) {
    pdf.addSpacer(5);
    pdf.addSectionHeader("Comprehension Questions");
    questions.forEach((q, i) => {
      pdf.addParagraph(`${i + 1}. ${q}`);
      pdf.addAnswerLine();
      pdf.addAnswerLine();
      pdf.addSpacer(2);
    });
  }

  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}.pdf`;
  pdf.save(filename);
}

// ============================================================
// DIFFERENTIATED TASK PDF
// ============================================================
export function downloadDifferentiatedPdf(
  markdownContent: string,
  options: { overlayId?: string; fontSize?: number } = {}
) {
  const { overlayId, fontSize } = options;
  const pdf = new PdfBuilder({ overlayId, fontSize });

  const lines = markdownContent.split("\n");
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { inList = false; }
      pdf.addSpacer(2);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      pdf.addTitle(trimmed.replace(/^# /, ""));
    } else if (trimmed.startsWith("## ")) {
      pdf.addSectionHeader(trimmed.replace(/^## /, ""));
    } else if (trimmed.startsWith("### ")) {
      pdf.addSpacer(2);
      pdf.addSectionHeader(trimmed.replace(/^### /, ""));
    } else if (trimmed === "---") {
      pdf.addSpacer(3);
    } else if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ")) {
      const checked = trimmed.startsWith("- [x] ");
      const text = trimmed.replace(/^- \[.\] /, "");
      pdf.addParagraph(`${checked ? "[x]" : "[ ]"} ${text}`);
    } else if (trimmed.startsWith("- ")) {
      inList = true;
      pdf.addParagraph(`* ${trimmed.replace(/^- /, "")}`);
    } else {
      pdf.addRichText(trimmed);
    }
  }

  pdf.save("Differentiated_Task.pdf");
}

// ============================================================
// GENERIC CONTENT PDF
// ============================================================
export function downloadGenericPdf(
  title: string,
  content: string,
  options: { overlayId?: string; fontSize?: number; subtitle?: string } = {}
) {
  const { overlayId, fontSize, subtitle } = options;
  const pdf = new PdfBuilder({ overlayId, fontSize });

  pdf.addTitle(title);
  if (subtitle) {
    pdf.addSubtitle(subtitle);
  }
  pdf.addSpacer(3);

  const cleaned = cleanMarkdown(content);
  pdf.addParagraph(cleaned);

  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}.pdf`;
  pdf.save(filename);
}
