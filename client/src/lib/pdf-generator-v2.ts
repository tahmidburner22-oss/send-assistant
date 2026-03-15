/**
 * PDF Generator v2 — pixel-perfect HTML-to-PDF using html2canvas + jsPDF.
 * Print system opens a clean window with only the worksheet content.
 * Applies SEND-specific formatting (font, line-height, spacing) per COBS Handbook.
 */
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getSendFormatting } from "@/lib/send-data";

export async function downloadHtmlAsPdf(
  element: HTMLElement,
  filename: string,
  options: { overlayColor?: string } = {}
): Promise<void> {
  // Find the inner worksheet-print-root if it exists
  const printRoot = element.querySelector(".worksheet-print-root") as HTMLElement || element;

  // A4 dimensions at 96dpi: 794px wide
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123; // 297mm at 96dpi
  const PDF_WIDTH_MM = 210;
  const PDF_HEIGHT_MM = 297;
  const MARGIN_MM = 8;
  const CONTENT_WIDTH_MM = PDF_WIDTH_MM - MARGIN_MM * 2;

  // Temporarily set width to A4 for capture — do NOT change padding/margin
  const originalWidth = printRoot.style.width;
  const originalMaxWidth = printRoot.style.maxWidth;
  printRoot.style.width = `${A4_WIDTH_PX}px`;
  printRoot.style.maxWidth = `${A4_WIDTH_PX}px`;

  try {
    // Wait a tick so layout reflows
    await new Promise(r => setTimeout(r, 100));

    const canvas = await html2canvas(printRoot, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: options.overlayColor || "#ffffff",
      logging: false,
      windowWidth: A4_WIDTH_PX,
      scrollY: -window.scrollY,
      onclone: (clonedDoc) => {
        // Copy all stylesheets from the main document into the cloned document
        // This ensures KaTeX CSS, Tailwind, and all custom styles are applied
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            if (sheet.href) {
              // External stylesheet — add as <link>
              const link = clonedDoc.createElement("link");
              link.rel = "stylesheet";
              link.href = sheet.href;
              clonedDoc.head.appendChild(link);
            } else if (sheet.cssRules) {
              // Inline stylesheet — copy rules as <style>
              const style = clonedDoc.createElement("style");
              style.textContent = Array.from(sheet.cssRules).map(r => r.cssText).join("\n");
              clonedDoc.head.appendChild(style);
            }
          } catch (e) {
            // Cross-origin stylesheets may throw — skip them
          }
        });
        // Ensure cloned element has correct width and no extra padding
        const clonedRoot = clonedDoc.querySelector(".worksheet-print-root") as HTMLElement;
        if (clonedRoot) {
          clonedRoot.style.width = `${A4_WIDTH_PX}px`;
          clonedRoot.style.maxWidth = `${A4_WIDTH_PX}px`;
          clonedRoot.style.padding = "0";
          clonedRoot.style.margin = "0";
          clonedRoot.style.boxSizing = "border-box";
        }
        // Remove the Card wrapper padding that adds extra whitespace
        const cardContent = clonedDoc.querySelector(".worksheet-content") as HTMLElement;
        if (cardContent) {
          cardContent.style.padding = "0";
          cardContent.style.margin = "0";
          cardContent.style.boxShadow = "none";
          cardContent.style.border = "none";
          cardContent.style.borderRadius = "0";
        }
      },
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Scale canvas to fit within content area (with margins)
    const canvasWidthMM = CONTENT_WIDTH_MM;
    const canvasHeightMM = (canvas.height / canvas.width) * canvasWidthMM;

    // Split into pages
    const pageContentHeightPx = (PDF_HEIGHT_MM - MARGIN_MM * 2) / PDF_WIDTH_MM * canvas.width;
    const totalPages = Math.ceil(canvas.height / pageContentHeightPx);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      // Crop the canvas to this page's slice
      const srcY = Math.round(page * pageContentHeightPx);
      const srcH = Math.min(pageContentHeightPx, canvas.height - srcY);

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.round(srcH);
      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
      }

      const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
      const pageHeightMM = (srcH / canvas.width) * canvasWidthMM;
      pdf.addImage(pageImgData, "PNG", MARGIN_MM, MARGIN_MM, canvasWidthMM, pageHeightMM, undefined, "FAST");
    }

    pdf.save(filename);
  } finally {
    printRoot.style.width = originalWidth;
    printRoot.style.maxWidth = originalMaxWidth;
  }
}

/**
 * Print the worksheet using a clean popup window.
 * Only the worksheet content is printed — no sidebar, no toolbar, no UI chrome.
 */
export function printWorksheetElement(
  element: HTMLElement,
  options: {
    overlayColor?: string;
    viewMode?: "teacher" | "student";
    layout?: "together" | "per-page";
    textSize?: number;
    title?: string;
    sendNeedId?: string;
  } = {}
): void {
  const { overlayColor = "white", viewMode = "student", layout = "together", textSize = 14, title = "Worksheet", sendNeedId } = options;

  // Resolve SEND-specific formatting
  const fmt = getSendFormatting(sendNeedId, textSize);

  // Extract just the worksheet-print-root inner HTML
  const printRoot = element.querySelector(".worksheet-print-root") as HTMLElement;
  const contentHtml = printRoot ? printRoot.outerHTML : element.innerHTML;

  const printWindow = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
  if (!printWindow) {
    alert("Please allow pop-ups for this site to enable printing.");
    return;
  }

  const hideTeacher = viewMode === "student"
    ? `.ws-teacher-section { display: none !important; }`
    : `.ws-teacher-section { page-break-before: always; break-before: page; }`;
  const perPageCss = layout === "per-page"
    ? `.ws-section + .ws-section { page-break-before: always; break-before: page; }`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: ${fmt.fontFamily};
      font-size: ${fmt.fontSize}px;
      line-height: ${fmt.lineHeight};
      letter-spacing: ${fmt.letterSpacing};
      word-spacing: ${fmt.wordSpacing};
      font-weight: ${fmt.fontWeight};
      background: ${overlayColor};
      color: #1f2937;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page {
      size: A4 portrait;
      margin: 5mm 5mm 6mm 5mm;
    }
    @media print {
      html, body { background: ${overlayColor} !important; }
      .no-print { display: none !important; }
      .ws-section { page-break-inside: avoid; break-inside: avoid; }
      ${hideTeacher}
      ${perPageCss}
    }
    @media screen {
      body { padding: 8mm; max-width: 210mm; margin: 0 auto; overflow: visible; }
      .ws-section { page-break-inside: avoid; break-inside: avoid; }
      ${hideTeacher}
    }

    /* ── Worksheet root ── */
    .worksheet-print-root {
      background: ${overlayColor};
      font-family: ${fmt.fontFamily};
      font-size: ${fmt.fontSize}px;
      line-height: ${fmt.lineHeight};
      letter-spacing: ${fmt.letterSpacing};
      word-spacing: ${fmt.wordSpacing};
      width: 100%;
      max-width: 100%;
      overflow: visible;
    }

    /* ── Header ── TES-style: rectangular purple border */
    .ws-header {
      border: 1.5px solid #5b21b6;
      border-radius: 4px;
      margin-bottom: 10px;
      overflow: hidden;
    }

    /* ── Sections ── TES-style: white background, single purple border */
    .ws-section {
      margin-bottom: 10px;
      border-radius: 4px;
      border: 1.5px solid #5b21b6;
      background: #ffffff;
      overflow: visible;
      page-break-inside: avoid;
      break-inside: avoid;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-section-header {
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: ${fmt.fontSize - 1}px;
      font-family: ${fmt.fontFamily};
      background: rgba(91,33,182,0.07) !important;
      border-bottom: 1px solid #5b21b6;
      color: #5b21b6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-section-body {
      padding: 10px 12px;
      font-size: ${fmt.fontSize}px;
      line-height: ${fmt.lineHeight};
      letter-spacing: ${fmt.letterSpacing};
      word-spacing: ${fmt.wordSpacing};
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
      font-family: ${fmt.fontFamily};
      background: #ffffff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: ${fmt.fontSize - 1}px;
      font-family: ${fmt.fontFamily};
      letter-spacing: ${fmt.letterSpacing};
    }
    th {
      background: #5b21b6 !important;
      color: white !important;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    td {
      padding: 7px 12px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #f9fafb !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Answer lines ── */
    .ws-answer-line {
      border-bottom: 1px solid #9ca3af;
      min-height: 28px;
      margin: 6px 0;
      display: block;
    }

    /* ── Word bank ── */
    .ws-word-bank {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0;
    }
    .ws-word-chip {
      background: #ede9fe !important;
      border: 1px solid #c4b5fd;
      border-radius: 4px;
      padding: 3px 10px;
      font-size: ${fmt.fontSize - 2}px;
      font-weight: 600;
      color: #5b21b6;
      font-family: ${fmt.fontFamily};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Checklist ── */
    .ws-checklist { list-style: none; padding: 0; margin: 6px 0; }
    .ws-checklist li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: ${fmt.paragraphSpacing};
      font-size: ${fmt.fontSize}px;
      font-family: ${fmt.fontFamily};
      line-height: ${fmt.lineHeight};
      letter-spacing: ${fmt.letterSpacing};
    }
    .ws-check-box {
      width: 16px;
      height: 16px;
      border: 2px solid #7c3aed;
      border-radius: 3px;
      flex-shrink: 0;
      margin-top: 2px;
      display: inline-block;
    }

    /* ── Sentence starters ── */
    .ws-starter {
      background: #ffffff !important;
      border-left: 3px solid #5b21b6;
      padding: 6px 10px;
      margin: 4px 0;
      border-radius: 0 4px 4px 0;
      font-size: ${fmt.fontSize}px;
      font-family: ${fmt.fontFamily};
      line-height: ${fmt.lineHeight};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Bloom's badge ── */
    .ws-blooms-badge {
      display: inline-block;
      background: #ddd6fe !important;
      color: #5b21b6;
      border-radius: 4px;
      padding: 1px 7px;
      font-size: 10px;
      font-weight: 700;
      margin-left: 6px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Footer ── TES-style: white background with purple border */
    .ws-footer {
      margin-top: 10px;
      padding: 5px 10px;
      border: 1.5px solid #5b21b6;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #5b21b6;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Symbol cards (Widgit-style) ── */
    .ws-symbol-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 10px;
      margin: 10px 0;
    }
    .ws-symbol-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      background: #fafafa !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-symbol-icon { font-size: 28px; display: block; margin-bottom: 4px; }
    .ws-symbol-label { font-size: 11px; font-weight: 600; color: #374151; }

    /* ── Misc ── */
    h1, h2, h3 { line-height: 1.3; }
    p { margin-bottom: ${fmt.paragraphSpacing}; line-height: ${fmt.lineHeight}; letter-spacing: ${fmt.letterSpacing}; word-spacing: ${fmt.wordSpacing}; font-family: ${fmt.fontFamily}; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    ul, ol { padding-left: 20px; margin: 6px 0; }
    li { margin-bottom: 4px; }
    .ws-divider { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
  </style>
</head>
<body>
  ${contentHtml}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 600);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
