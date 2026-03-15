/**
 * PDF Generator v2 — pixel-perfect HTML-to-PDF using html2canvas + jsPDF.
 * Print system opens a clean window with only the worksheet content.
 * Applies SEND-specific formatting (font, line-height, spacing) per COBS Handbook.
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

export async function downloadHtmlAsPdf(
  element: HTMLElement,
  filename: string,
  options: { overlayColor?: string } = {}
): Promise<void> {
  const printRoot = (element.querySelector(".worksheet-print-root") as HTMLElement) || element;
  const PDF_WIDTH_MM = 210;
  const PDF_HEIGHT_MM = 297;

  const rect = printRoot.getBoundingClientRect();
  const sourceWidth = Math.max(1, Math.round(rect.width));
  const sourceHeight = Math.max(1, Math.round(printRoot.scrollHeight || rect.height));

  const sandbox = document.createElement("div");
  sandbox.setAttribute("data-pdf-export-sandbox", "true");
  sandbox.style.position = "fixed";
  sandbox.style.left = "-20000px";
  sandbox.style.top = "0";
  sandbox.style.width = `${sourceWidth}px`;
  sandbox.style.maxWidth = `${sourceWidth}px`;
  sandbox.style.background = options.overlayColor || getComputedStyle(printRoot).backgroundColor || "#ffffff";
  sandbox.style.pointerEvents = "none";
  sandbox.style.zIndex = "-1";

  const clone = printRoot.cloneNode(true) as HTMLElement;
  clone.style.width = `${sourceWidth}px`;
  clone.style.maxWidth = `${sourceWidth}px`;
  clone.style.minWidth = `${sourceWidth}px`;
  clone.style.margin = "0";
  clone.style.boxSizing = "border-box";
  clone.style.transform = "none";
  clone.style.background = options.overlayColor || getComputedStyle(printRoot).backgroundColor || "#ffffff";

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    await waitForFonts(document);
    await waitForImages(sandbox);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => setTimeout(resolve, 120));

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: options.overlayColor || "#ffffff",
      logging: false,
      windowWidth: sourceWidth,
      width: sourceWidth,
      height: sourceHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: async (clonedDoc) => {
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            if (sheet.href) {
              const link = clonedDoc.createElement("link");
              link.rel = "stylesheet";
              link.href = sheet.href;
              clonedDoc.head.appendChild(link);
            } else if (sheet.cssRules) {
              const style = clonedDoc.createElement("style");
              style.textContent = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
              clonedDoc.head.appendChild(style);
            }
          } catch {
            // Ignore inaccessible stylesheets.
          }
        });

        clonedDoc.body.style.margin = "0";
        clonedDoc.body.style.padding = "0";
        clonedDoc.body.style.background = options.overlayColor || getComputedStyle(printRoot).backgroundColor || "#ffffff";
        clonedDoc.body.style.width = `${sourceWidth}px`;
        clonedDoc.body.style.maxWidth = `${sourceWidth}px`;

        const clonedRoot = (clonedDoc.querySelector("[data-pdf-export-sandbox] .worksheet-print-root") as HTMLElement)
          || (clonedDoc.querySelector(".worksheet-print-root") as HTMLElement);
        if (clonedRoot) {
          clonedRoot.style.width = `${sourceWidth}px`;
          clonedRoot.style.maxWidth = `${sourceWidth}px`;
          clonedRoot.style.minWidth = `${sourceWidth}px`;
          clonedRoot.style.margin = "0";
          clonedRoot.style.boxSizing = "border-box";
          clonedRoot.style.transform = "none";
          clonedRoot.style.overflow = "visible";
          clonedRoot.style.background = options.overlayColor || getComputedStyle(printRoot).backgroundColor || "#ffffff";
        }

        const cardContent = clonedDoc.querySelector(".worksheet-content") as HTMLElement;
        if (cardContent) {
          cardContent.style.padding = "0";
          cardContent.style.margin = "0";
          cardContent.style.boxShadow = "none";
          cardContent.style.border = "none";
          cardContent.style.borderRadius = "0";
          cardContent.style.overflow = "visible";
          cardContent.style.maxWidth = `${sourceWidth}px`;
        }

        await waitForFonts(clonedDoc);
        await waitForImages(clonedDoc);
      },
    });

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
    sandbox.remove();
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
