/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary — unauthorised copying, modification, or distribution is strictly prohibited.
 *
 * PDF Generator v2 — browser-native print-to-PDF approach.
 *
 * NEW APPROACH (v3 rewrite):
 * Both print and PDF use the browser's native print renderer via a popup window.
 * The worksheet HTML (with all React inline styles already applied) is serialised
 * from the live DOM and written into the popup. KaTeX CSS is fetched and embedded
 * inline so it is guaranteed to be present before print() fires.
 *
 * This avoids:
 *   - html2canvas cross-origin font/CSS issues (missing headers, missing section boxes)
 *   - KaTeX <link> tag race condition (broken math symbols in print)
 *   - jsPDF text extraction issues (wrong symbols, missing formatting)
 */
import { getSendFormatting } from "@/lib/send-data";
import { KATEX_CSS_INLINE } from "@/lib/katex-css-inline";

// ── KaTeX CSS ────────────────────────────────────────────
// Use the bundled KaTeX CSS (from katex-css-inline.ts) which has absolute CDN
// font URLs pre-baked in. This avoids any network fetch or race condition.
function getKatexCssInline(): string {
  return KATEX_CSS_INLINE;
}

// ── Build the complete self-contained HTML document ──────────────────────────

function buildPopupHtml(
  contentHtml: string,
  katexCss: string,
  options: {
    overlayColor?: string;
    viewMode?: "teacher" | "student";
    layout?: "together" | "per-page";
    textSize?: number;
    title?: string;
    sendNeedId?: string;
    isPdf?: boolean;
  }
): string {
  const {
    overlayColor = "#ffffff",
    viewMode = "student",
    layout = "together",
    textSize = 14,
    title = "Worksheet",
    sendNeedId,
    isPdf = false,
  } = options;

  const fmt = getSendFormatting(sendNeedId, textSize);

  const hideTeacher =
    viewMode === "student"
      ? `.ws-teacher-section { display: none !important; }`
      : `.ws-teacher-section { page-break-before: always; break-before: page; }`;

  const perPageCss =
    layout === "per-page"
      ? `.ws-section + .ws-section { page-break-before: always; break-before: page; }`
      : "";

  // For PDF: auto-trigger print dialog; for print: same but with screen preview
  const printScript = `
    <script>
      // Wait for fonts and images before printing
      function triggerPrint() {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function() {
            setTimeout(function() { window.print(); }, 400);
          });
        } else {
          setTimeout(function() { window.print(); }, 1200);
        }
      }
      if (document.readyState === 'complete') {
        triggerPrint();
      } else {
        window.addEventListener('load', triggerPrint);
      }
    </script>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* ── KaTeX (inlined to avoid race condition with <link> tag) ── */
    ${katexCss}
  </style>
  <style>
    /* ── Reset ── */
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
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

    /* ── Page setup ── */
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 12mm 12mm;
    }

    /* ── Screen preview ── */
    @media screen {
      body {
        max-width: 210mm;
        margin: 0 auto;
        padding: 12mm;
        background: #f3f4f6;
      }
      .worksheet-print-root {
        background: ${overlayColor};
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        padding: 12mm;
        min-height: 270mm;
      }
    }

    /* ── Print ── */
    @media print {
      html, body {
        background: ${overlayColor} !important;
        padding: 0;
        margin: 0;
      }
      .worksheet-print-root {
        padding: 0;
        box-shadow: none;
      }
      .no-print { display: none !important; }
      ${hideTeacher}
      ${perPageCss}
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

    /* ── Header: ensure purple background prints ── */
    .ws-header {
      border: 1.5px solid #5b21b6 !important;
      border-radius: 4px !important;
      margin-bottom: 10px !important;
      overflow: hidden !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Force the purple title bar background to print */
    .ws-header > div:first-child,
    .ws-header > div:first-child * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* ── Sections: ensure borders and backgrounds print ── */
    .ws-section {
      margin-bottom: 10px !important;
      border-radius: 4px !important;
      border: 1.5px solid #5b21b6 !important;
      overflow: visible !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Section header row: ensure background prints */
    .ws-section > div:first-child {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* ── Ensure all coloured backgrounds print ── */
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
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

    /* ── KaTeX: CRITICAL — hide MathML span to prevent text doubling ── */
    /* KaTeX renders two parallel representations:
       1. .katex-mathml  → MathML for screen readers (must be visually hidden)
       2. .katex-html    → visual HTML rendering (aria-hidden="true" but visually shown)
       Without this rule, the MathML text (e.g. "12" for 1/2) renders as visible
       plain text alongside the visual fraction, causing "1/2 12" doubling. */
    .katex .katex-mathml {
      position: absolute !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
      padding: 0 !important;
      border: 0 !important;
      height: 1px !important;
      width: 1px !important;
      overflow: hidden !important;
    }
    /* Ensure the visual HTML part is always visible */
    .katex .katex-html {
      display: inline !important;
    }
    /* ── KaTeX math display fixes ── */
    .katex {
      font-size: 1em !important;
    }
    .katex-display {
      margin: 0.5em 0;
      overflow-x: auto;
      overflow-y: hidden;
    }
    .katex .base {
      white-space: nowrap;
    }

    /* ── Misc ── */
    h1, h2, h3 { line-height: 1.3; }
    p { margin-bottom: ${fmt.paragraphSpacing}; line-height: ${fmt.lineHeight}; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    ul, ol { padding-left: 20px; margin: 6px 0; }
    li { margin-bottom: 4px; }

    /* ── Hide screen-only UI elements ── */
    @media print {
      button, [role="button"], .no-print { display: none !important; }
    }

    ${viewMode === "student" ? ".ws-teacher-section { display: none !important; }" : ""}
  </style>
</head>
<body>
  ${contentHtml}
  ${printScript}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Serialise the live DOM element with all inline styles preserved ───────────

function serialiseElement(element: HTMLElement, viewMode: "teacher" | "student"): string {
  // Clone the element so we can modify it without affecting the live DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // For student view: remove teacher-only sections from the clone
  if (viewMode === "student") {
    clone.querySelectorAll(".ws-teacher-section").forEach((el) => {
      el.parentNode?.removeChild(el);
    });
  }

  // The React-rendered HTML already has all styles as inline `style` attributes.
  // We just need to return the outerHTML of the worksheet-print-root.
  const printRoot = clone.classList.contains("worksheet-print-root")
    ? clone
    : (clone.querySelector(".worksheet-print-root") as HTMLElement) || clone;

  return printRoot.outerHTML;
}

// ── Open popup and write the document ────────────────────────────────────────

function openPrintPopup(html: string): Window | null {
  const popup = window.open("", "_blank", "width=900,height=750,scrollbars=yes,resizable=yes");
  if (!popup) {
    alert("Please allow pop-ups for this site to use print/PDF features.");
    return null;
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  return popup;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Open a print dialog for the worksheet.
 * Uses the browser's native print renderer — no html2canvas, no jsPDF.
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
  const viewMode = options.viewMode || "student";
  const contentHtml = serialiseElement(element, viewMode);
  const katexCss = getKatexCssInline();
  const html = buildPopupHtml(contentHtml, katexCss, { ...options, isPdf: false });
  openPrintPopup(html);
}

/**
 * Download the worksheet as a PDF.
 * Opens a popup window with the worksheet and triggers the browser's print-to-PDF dialog.
 * This uses the same rendering path as print, ensuring identical output.
 *
 * The filename parameter is used as the suggested filename in the print dialog title.
 */
export function downloadHtmlAsPdf(
  element: HTMLElement,
  filename: string,
  options: {
    overlayColor?: string;
    viewMode?: "teacher" | "student";
    textSize?: number;
    title?: string;
    sendNeedId?: string;
  } = {}
): void {
  const viewMode = options.viewMode || "student";
  const contentHtml = serialiseElement(element, viewMode);
  const katexCss = getKatexCssInline();

  // Set the title to the filename (without extension) so the browser uses it as the PDF filename
  const pdfTitle = filename.replace(/\.pdf$/i, "").replace(/_/g, " ");

  const html = buildPopupHtml(contentHtml, katexCss, {
    ...options,
    title: pdfTitle,
    isPdf: true,
  });

  openPrintPopup(html);
}
