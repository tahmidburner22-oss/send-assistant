/**
 * PDF Generator v2 — pixel-perfect HTML-to-PDF using iframe + html2canvas + jsPDF.
 * Print system opens a clean window with only the worksheet content.
 * Applies SEND-specific formatting (font, line-height, spacing) per COBS Handbook.
 *
 * PDF approach: renders the worksheet in a hidden same-origin iframe using the same
 * HTML template as the print window (with KaTeX CSS properly loaded), then captures
 * it with html2canvas. This avoids CSP font-src issues with data: URI fonts.
 */
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getSendFormatting } from "@/lib/send-data";

async function waitForImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (img) => {
      try {
        if (img.complete && img.naturalWidth > 0) return;
        if (typeof img.decode === "function") {
          await img.decode();
          return;
        }
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, 3000);
        });
      } catch {
        // Ignore individual image failures so export can still complete.
      }
    })
  );
}

async function waitForFonts(docLike: Document): Promise<void> {
  try {
    const fontSet = (docLike as any).fonts;
    if (fontSet?.ready) await fontSet.ready;
  } catch {
    // Ignore font readiness issues and continue exporting.
  }
}

/**
 * Build the worksheet HTML string (same template as print window).
 * This ensures KaTeX CSS is properly loaded and fonts render correctly.
 */
function buildWorksheetHtml(
  contentHtml: string,
  options: {
    overlayColor?: string;
    viewMode?: "teacher" | "student";
    textSize?: number;
    title?: string;
    sendNeedId?: string;
  }
): string {
  const { overlayColor = "#ffffff", viewMode = "student", textSize = 14, title = "Worksheet", sendNeedId } = options;
  const fmt = getSendFormatting(sendNeedId, textSize);

  const hideTeacher = viewMode === "student"
    ? `.ws-teacher-section { display: none !important; }`
    : ``;

  // Get the KaTeX CSS URL from the current page's stylesheets
  const katexCssUrl = (() => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        if (sheet.href && sheet.href.includes("katex")) return sheet.href;
      } catch { /* cross-origin */ }
    }
    return "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
  })();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="${katexCssUrl}">
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
      padding: 12px;
    }

    /* ── Header ── */
    .ws-header {
      border: 1.5px solid #5b21b6;
      border-radius: 4px;
      margin-bottom: 10px;
      overflow: hidden;
    }

    /* ── Sections ── */
    .ws-section {
      margin-bottom: 10px;
      border-radius: 4px;
      border: 1.5px solid #5b21b6;
      background: ${overlayColor};
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
      background: ${overlayColor} !important;
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
      background: ${overlayColor} !important;
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

    /* ── Footer ── */
    .ws-footer {
      margin-top: 10px;
      padding: 5px 10px;
      border: 1.5px solid #5b21b6;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #5b21b6;
      background: ${overlayColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Symbol cards ── */
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
      background: ${overlayColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-symbol-icon { font-size: 28px; display: block; margin-bottom: 4px; }
    .ws-symbol-label { font-size: 11px; font-weight: 600; color: #374151; }

    /* ── Vocab cards ── */
    .ws-vocab-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
      margin: 8px 0;
    }
    .ws-vocab-card {
      border: 1px solid #c4b5fd;
      border-radius: 6px;
      padding: 8px 10px;
      background: ${overlayColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-vocab-term {
      font-weight: 700;
      color: #5b21b6;
      font-size: ${fmt.fontSize - 1}px;
      margin-bottom: 2px;
    }
    .ws-vocab-def {
      font-size: ${fmt.fontSize - 2}px;
      color: #374151;
    }

    /* ── Word problem cards ── */
    .ws-problem-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: ${overlayColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-problem-label {
      font-weight: 700;
      color: #5b21b6;
      font-size: ${fmt.fontSize - 1}px;
      margin-bottom: 4px;
    }

    /* ── Reminder box ── */
    .ws-reminder-box {
      border: 2px solid #7c3aed;
      border-radius: 6px;
      padding: 10px 12px;
      background: ${overlayColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-reminder-label {
      font-weight: 700;
      color: #7c3aed;
      font-size: ${fmt.fontSize - 1}px;
      margin-bottom: 4px;
    }

    /* ── RAG circles ── */
    .ws-rag-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid currentColor;
      display: inline-block;
      flex-shrink: 0;
    }

    /* ── Misc ── */
    h1, h2, h3 { line-height: 1.3; }
    p { margin-bottom: ${fmt.paragraphSpacing}; line-height: ${fmt.lineHeight}; letter-spacing: ${fmt.letterSpacing}; word-spacing: ${fmt.wordSpacing}; font-family: ${fmt.fontFamily}; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    ul, ol { padding-left: 20px; margin: 6px 0; }
    li { margin-bottom: 4px; }
    .ws-divider { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }

    ${hideTeacher}
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;
}

export async function downloadHtmlAsPdf(
  element: HTMLElement,
  filename: string,
  options: {
    overlayColor?: string;
    viewMode?: "teacher" | "student";
    textSize?: number;
    title?: string;
    sendNeedId?: string;
  } = {}
): Promise<void> {
  const PDF_WIDTH_MM = 210;
  const PDF_HEIGHT_MM = 297;

  // Use the live DOM directly — KaTeX is already rendered correctly in the browser.
  // The CSP now allows data: fonts so html2canvas can capture KaTeX math properly.
  const printRoot = (element.querySelector(".worksheet-print-root") as HTMLElement) || element;

  // Hide teacher sections for student view
  const teacherSections = printRoot.querySelectorAll(".ws-teacher-section");
  const hiddenSections: HTMLElement[] = [];
  if (options.viewMode === "student") {
    teacherSections.forEach((s) => {
      const el = s as HTMLElement;
      if (el.style.display !== "none") {
        el.style.display = "none";
        hiddenSections.push(el);
      }
    });
  }

  // Temporarily make the element visible at full width for capture
  const originalPosition = printRoot.style.position;
  const originalLeft = printRoot.style.left;
  const originalWidth = printRoot.style.width;
  const originalMaxWidth = printRoot.style.maxWidth;

  try {
    // Wait for any pending images
    await waitForImages(printRoot);
    await waitForFonts(document);

    // Extra wait for KaTeX fonts
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Capture with html2canvas using the live DOM
    const canvas = await html2canvas(printRoot, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: options.overlayColor || "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      onclone: (clonedDoc, clonedElement) => {
        // Inline all CSS rules from the current page into the cloned document
        const styleEl = clonedDoc.createElement("style");
        const cssRules: string[] = [];
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            Array.from(sheet.cssRules || []).forEach((rule) => {
              cssRules.push(rule.cssText);
            });
          } catch {
            // Cross-origin stylesheets — skip
          }
        });
        styleEl.textContent = cssRules.join("\n");
        clonedDoc.head.appendChild(styleEl);

        // Apply overlay color to all section backgrounds
        const bg = options.overlayColor || "#ffffff";
        clonedElement.style.background = bg;
        clonedDoc.querySelectorAll(".ws-section, .ws-section-body, .ws-footer").forEach((el) => {
          (el as HTMLElement).style.background = bg;
        });

        // Hide teacher sections for student view
        if (options.viewMode === "student") {
          clonedDoc.querySelectorAll(".ws-teacher-section").forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });
        }
      },
    });

    // Build the PDF page by page
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const pageHeightPx = Math.round((canvas.width * PDF_HEIGHT_MM) / PDF_WIDTH_MM);
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      const srcY = page * pageHeightPx;
      const srcH = Math.min(pageHeightPx, canvas.height - srcY);

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = srcH;
      const ctx = pageCanvas.getContext("2d");
      if (!ctx) continue;

      ctx.fillStyle = options.overlayColor || "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
      const pageHeightMm = (srcH / canvas.width) * PDF_WIDTH_MM;
      pdf.addImage(pageImgData, "PNG", 0, 0, PDF_WIDTH_MM, pageHeightMm, undefined, "FAST");
    }

    pdf.save(filename);
  } finally {
    // Restore hidden teacher sections
    hiddenSections.forEach((el) => { el.style.display = ""; });
    // Restore original styles
    printRoot.style.position = originalPosition;
    printRoot.style.left = originalLeft;
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

  // Get the KaTeX CSS URL from the current page's stylesheets
  const katexCssUrl = (() => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        if (sheet.href && sheet.href.includes("katex")) return sheet.href;
      } catch { /* cross-origin */ }
    }
    // Fallback: use CDN
    return "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
  })();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="${katexCssUrl}">
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
      margin: 0;
    }
    @media print {
      html, body { background: ${overlayColor} !important; }
      .no-print { display: none !important; }
      .ws-section { page-break-inside: avoid; break-inside: avoid; }
      ${hideTeacher}
      ${perPageCss}
    }
    @media screen {
      body { max-width: 210mm; margin: 0 auto; overflow: visible; }
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

    /* ── Sections ── TES-style: overlay-aware background, single purple border */
    .ws-section {
      margin-bottom: 10px;
      border-radius: 4px;
      border: 1.5px solid #5b21b6;
      background: ${overlayColor};
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
      background: ${overlayColor} !important;
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
      background: ${overlayColor} !important;
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

    /* ── Footer ── TES-style: overlay-aware background with purple border */
    .ws-footer {
      margin-top: 10px;
      padding: 5px 10px;
      border: 1.5px solid #5b21b6;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #5b21b6;
      background: ${overlayColor} !important;
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
      background: ${overlayColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-symbol-icon { font-size: 28px; display: block; margin-bottom: 4px; }
    .ws-symbol-label { font-size: 11px; font-weight: 600; color: #374151; }

    /* ── Vocab cards ── */
    .ws-vocab-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 8px;
      margin: 8px 0;
    }
    .ws-vocab-card {
      border: 1px solid #c4b5fd;
      border-radius: 6px;
      padding: 8px 10px;
      background: ${overlayColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-vocab-term {
      font-weight: 700;
      color: #5b21b6;
      font-size: ${fmt.fontSize - 1}px;
      margin-bottom: 2px;
    }
    .ws-vocab-def {
      font-size: ${fmt.fontSize - 2}px;
      color: #374151;
    }

    /* ── Word problem cards ── */
    .ws-problem-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: ${overlayColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-problem-label {
      font-weight: 700;
      color: #5b21b6;
      font-size: ${fmt.fontSize - 1}px;
      margin-bottom: 4px;
    }

    /* ── Reminder box ── */
    .ws-reminder-box {
      border: 2px solid #7c3aed;
      border-radius: 6px;
      padding: 10px 12px;
      background: ${overlayColor} !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ws-reminder-label {
      font-weight: 700;
      color: #7c3aed;
      font-size: ${fmt.fontSize - 1}px;
      margin-bottom: 4px;
    }

    /* ── RAG circles ── */
    .ws-rag-circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid currentColor;
      display: inline-block;
      flex-shrink: 0;
    }

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
    // Wait for KaTeX CSS to load before printing
    window.addEventListener('load', function() {
      // Give KaTeX fonts extra time to load
      setTimeout(function() {
        window.print();
      }, 1200);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
