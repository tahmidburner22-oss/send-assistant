/**
 * PDF Generator v2 — pixel-perfect HTML-to-PDF using html2canvas + jsPDF.
 * Print system opens a clean window with only the worksheet content.
 */
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function downloadHtmlAsPdf(
  element: HTMLElement,
  filename: string,
  options: { overlayColor?: string } = {}
): Promise<void> {
  // Find the inner worksheet-print-root if it exists
  const printRoot = element.querySelector(".worksheet-print-root") as HTMLElement || element;

  const originalStyle = printRoot.style.cssText;
  printRoot.style.width = "794px";
  printRoot.style.maxWidth = "794px";
  printRoot.style.padding = "32px";
  printRoot.style.boxSizing = "border-box";
  printRoot.style.backgroundColor = options.overlayColor || "white";

  try {
    const canvas = await html2canvas(printRoot, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: options.overlayColor || "#ffffff",
      logging: false,
      windowWidth: 794,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
  } finally {
    printRoot.style.cssText = originalStyle;
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
  } = {}
): void {
  const { overlayColor = "white", viewMode = "student", layout = "together", textSize = 14, title = "Worksheet" } = options;

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
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      font-size: ${textSize}px;
      background: ${overlayColor};
      color: #1f2937;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page {
      size: A4 portrait;
      margin: 15mm 18mm;
    }
    @media print {
      html, body { background: ${overlayColor} !important; }
      .no-print { display: none !important; }
      .ws-section { page-break-inside: avoid; break-inside: avoid; }
      ${hideTeacher}
      ${perPageCss}
    }
    @media screen {
      body { padding: 20mm; max-width: 794px; margin: 0 auto; }
      .ws-section { page-break-inside: avoid; break-inside: avoid; }
      ${hideTeacher}
    }

    /* ── Worksheet root ── */
    .worksheet-print-root {
      background: ${overlayColor};
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    }

    /* ── Header ── */
    .ws-header {
      border-bottom: 3px solid #7c3aed;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    /* ── Sections ── */
    .ws-section {
      margin-bottom: 14px;
      border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.12);
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ws-section-header {
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: ${textSize - 1}px;
    }
    .ws-section-body {
      padding: 12px 14px;
      font-size: ${textSize}px;
      line-height: 1.7;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: ${textSize - 1}px;
    }
    th {
      background: #7c3aed !important;
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
      font-size: ${textSize - 2}px;
      font-weight: 600;
      color: #5b21b6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Checklist ── */
    .ws-checklist { list-style: none; padding: 0; margin: 6px 0; }
    .ws-checklist li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 6px;
      font-size: ${textSize}px;
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
      background: #f0fdf4 !important;
      border-left: 3px solid #22c55e;
      padding: 6px 10px;
      margin: 4px 0;
      border-radius: 0 4px 4px 0;
      font-size: ${textSize}px;
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

    /* ── Footer ── */
    .ws-footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 2px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9ca3af;
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
    p { margin-bottom: 6px; }
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
