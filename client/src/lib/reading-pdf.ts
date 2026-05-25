/**
 * reading-pdf.ts — PDF helpers for the Year of Reading 2026 panel.
 *
 * Two outputs:
 *   1. Year of Reading celebration certificate — printable A4 portrait,
 *      lists earned milestones and pages read.
 *   2. Home-school reading record — weekly grid with rows for each
 *      reading session, parent comment column, signature line.
 *
 * Uses jsPDF directly (rather than the shared PdfBuilder) because the
 * layouts are heavily decorative / table-based and don't fit the
 * paragraph-flow model PdfBuilder is designed for.
 */
import { jsPDF } from "jspdf";
import type { MilestoneInfo, ReadingEntry } from "./reading-challenge";

interface CertificateOptions {
  pupilName: string;
  yearGroup?: string;
  schoolName?: string;
  milestones: MilestoneInfo[];
  totalPages: number;
  booksFinished: number;
  uniqueGenres: number;
  /** Teacher's display name for the signature line. */
  teacherName?: string;
}

export function downloadReadingCertificate(opts: CertificateOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;

  // Background — soft cream wash
  doc.setFillColor(255, 251, 235);
  doc.rect(0, 0, W, H, "F");

  // Outer gold double-border
  doc.setDrawColor(180, 142, 50);
  doc.setLineWidth(2);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, W - 24, H - 24);

  // Corner ornaments — simple diamond marks
  for (const [x, y] of [[18, 18], [W - 18, 18], [18, H - 18], [W - 18, H - 18]] as const) {
    doc.setFillColor(180, 142, 50);
    doc.circle(x, y, 1.6, "F");
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 28, 28);
  doc.setFontSize(14);
  doc.text("YEAR OF READING 2026", W / 2, 32, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(180, 142, 50);
  doc.text("Certificate of Achievement", W / 2, 48, { align: "center" });

  // Decorative rule
  doc.setDrawColor(180, 142, 50);
  doc.setLineWidth(0.4);
  doc.line(W / 2 - 60, 54, W / 2 + 60, 54);

  // Pupil
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(13);
  doc.text("This is to celebrate the reading achievements of", W / 2, 66, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 28, 28);
  doc.setFontSize(26);
  doc.text(opts.pupilName, W / 2, 80, { align: "center" });

  if (opts.yearGroup || opts.schoolName) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(110, 110, 110);
    doc.text(
      [opts.yearGroup, opts.schoolName].filter(Boolean).join(" — "),
      W / 2,
      88,
      { align: "center" },
    );
  }

  // Stats row
  const statsY = 102;
  const stats: Array<[string, string]> = [
    [String(opts.booksFinished), "books finished"],
    [String(opts.totalPages), "pages read"],
    [String(opts.uniqueGenres), "genres explored"],
    [String(opts.milestones.length), "milestones unlocked"],
  ];
  const colW = (W - 60) / stats.length;
  stats.forEach(([value, label], i) => {
    const cx = 30 + colW * i + colW / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(180, 142, 50);
    doc.text(value, cx, statsY, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(label, cx, statsY + 6, { align: "center" });
  });

  // Milestones list
  if (opts.milestones.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(28, 28, 28);
    doc.text("Milestones earned", W / 2, 130, { align: "center" });

    const items = opts.milestones.slice(0, 6).map(m => `${m.emoji}  ${m.label}`);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const cols = items.length <= 3 ? items.length : 3;
    const rowH = 6;
    items.forEach((line, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (W / (cols + 1)) * (col + 1);
      const y = 138 + row * rowH;
      doc.text(line, x, y, { align: "center" });
    });
  }

  // Signature lines
  const signY = H - 30;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(40, signY, 100, signY);
  doc.line(W - 100, signY, W - 40, signY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(opts.teacherName || "Class Teacher", 70, signY + 5, { align: "center" });
  doc.text("Date", W - 70, signY + 5, { align: "center" });

  doc.save(`Reading_Certificate_${opts.pupilName.replace(/\s+/g, "_")}.pdf`);
}

interface ReadingRecordOptions {
  pupilName: string;
  yearGroup?: string;
  schoolName?: string;
  /** Existing entries to pre-fill the grid. */
  entries?: ReadingEntry[];
  /** Number of blank rows to leave for the week ahead. Default 7. */
  blankRows?: number;
  weekLabel?: string;
}

/**
 * A printable home-school reading record. Pre-fills any existing entries
 * and leaves blank rows for the parent / pupil to complete. Designed to
 * fit on a single A4 portrait page.
 */
export function downloadHomeSchoolReadingRecord(opts: ReadingRecordOptions): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const margin = 15;

  // Header bar
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, W, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("Home-School Reading Record", margin, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(opts.weekLabel || `Week of ${new Date().toLocaleDateString("en-GB")}`, W - margin, 12, { align: "right" });

  // Pupil block
  let y = 28;
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Pupil: ${opts.pupilName}`, margin, y);
  if (opts.yearGroup) doc.text(opts.yearGroup, W - margin, y, { align: "right" });
  y += 6;
  if (opts.schoolName) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(opts.schoolName, margin, y);
    y += 5;
  }

  // Instructions
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  const instr = "Please record each reading session below. Adults at home are warmly invited to add a brief comment about how the reading went.";
  doc.text(doc.splitTextToSize(instr, W - 2 * margin) as string[], margin, y);
  y += 9;

  // Table headers
  const cols = [
    { label: "Date", width: 22 },
    { label: "Book", width: 50 },
    { label: "Pages", width: 18 },
    { label: "Pupil notes", width: 45 },
    { label: "Adult comment", width: 40 },
    { label: "Signed", width: 0 }, // remaining
  ];
  const usableW = W - 2 * margin;
  const fixedW = cols.slice(0, -1).reduce((s, c) => s + c.width, 0);
  cols[cols.length - 1].width = usableW - fixedW;

  doc.setFillColor(240, 253, 244);
  doc.rect(margin, y, usableW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  let cx = margin + 1;
  for (const col of cols) {
    doc.text(col.label, cx + 1, y + 5);
    cx += col.width;
  }
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 8, margin + usableW, y + 8);
  y += 10;

  // Rows
  const totalRows = (opts.entries?.length || 0) + (opts.blankRows ?? 7);
  const rowH = 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  for (let i = 0; i < totalRows; i++) {
    const entry = opts.entries?.[i];
    cx = margin;
    // Row separator
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y + rowH, margin + usableW, y + rowH);
    // Vertical separators
    let lineX = margin;
    for (const col of cols) {
      doc.line(lineX, y, lineX, y + rowH);
      lineX += col.width;
    }
    doc.line(margin + usableW, y, margin + usableW, y + rowH);

    if (entry) {
      const cells = [
        entry.date.slice(5), // MM-DD
        entry.bookTitle.slice(0, 28),
        String(entry.pagesRead || ""),
        (entry.notes || "").slice(0, 26),
        "",
        "",
      ];
      cx = margin;
      cells.forEach((cell, idx) => {
        doc.text(cell, cx + 2, y + 6);
        cx += cols[idx].width;
      });
    }
    y += rowH;
    if (y > H - 30) break;
  }

  // Footer signature
  y = H - 22;
  doc.setDrawColor(120, 120, 120);
  doc.line(margin, y, margin + 60, y);
  doc.line(W - margin - 60, y, W - margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text("Adult at home (signature)", margin + 30, y + 4, { align: "center" });
  doc.text("Class teacher (signature)", W - margin - 30, y + 4, { align: "center" });

  doc.save(`Reading_Record_${opts.pupilName.replace(/\s+/g, "_")}.pdf`);
}
