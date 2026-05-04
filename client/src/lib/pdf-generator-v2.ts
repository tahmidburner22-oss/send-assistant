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
export function getKatexCssInline(): string {
  return KATEX_CSS_INLINE;
}

// ── Build the complete self-contained HTML document ──────────────────────────

export function buildPopupHtml(
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
    landscape?: boolean;
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
    landscape = false,
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
      size: A4 ${landscape ? "landscape" : "portrait"};
      margin: ${landscape ? "6mm" : "12mm 12mm 12mm 12mm"};
    }

    /* ── Screen preview ── */
    @media screen {
      body {
        max-width: ${landscape ? "297mm" : "210mm"};
        margin: 0 auto;
        padding: 12mm;
        background: #f3f4f6;
      }
      .worksheet-print-root {
        background: ${overlayColor};
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        padding: 12mm;
        min-height: ${landscape ? "190mm" : "270mm"};
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

    /* ── Header: ensure gradient background prints ── */
    .ws-header {
      border-radius: 8px !important;
      margin-bottom: 12px !important;
      overflow: hidden !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: 0 2px 12px rgba(79,70,229,0.15) !important;
    }

    /* Force gradient title bar background to print */
    .ws-header > div:first-child,
    .ws-header > div:first-child * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* ── Sections: allow their own border colours to print (no override!) ── */
    .ws-section {
      margin-bottom: 10px !important;
      border-radius: 8px !important;
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

    /* ── PRIMARY SCHOOL: preserve all colourful section styles in print/PDF ── */
    /* Force colour printing at the root level — must come before specific rules */
    :root {
      color-scheme: light;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Gradient header bars — must print in full colour */
    [style*="linear-gradient"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Coloured section borders (18px radius primary cards) */
    [style*="border-radius: 18px"],
    [style*="borderRadius: 18px"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      border-radius: 18px !important;
      overflow: hidden !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    /* Numbered circle bubbles in primary headers */
    [style*="border-radius: 50%"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Exercise-book writing lines */
    [style*="border-bottom: 1px solid"],
    [style*="borderBottom"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Primary encouragement banner */
    [style*="linear-gradient(90deg"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Primary palette background colours — force print */
    [style*="background: #fff0f6"], [style*="background:#fff0f6"],
    [style*="background: #eff6ff"], [style*="background:#eff6ff"],
    [style*="background: #f0fdf4"], [style*="background:#f0fdf4"],
    [style*="background: #fff7ed"], [style*="background:#fff7ed"],
    [style*="background: #faf5ff"], [style*="background:#faf5ff"],
    [style*="background: #ecfeff"], [style*="background:#ecfeff"],
    [style*="background: #fefce8"], [style*="background:#fefce8"],
    [style*="background: #f0fdfa"], [style*="background:#f0fdfa"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Primary palette border colours */
    [style*="border: 3px solid"],
    [style*="border:3px solid"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* ── Ensure ALL coloured backgrounds and borders print ── */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
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

export function serialiseElement(element: HTMLElement, viewMode: "teacher" | "student"): string {
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
    landscape?: boolean;
  } = {}
): void {
  const viewMode = options.viewMode || "student";
  const contentHtml = serialiseElement(element, viewMode);
  const katexCss = getKatexCssInline();
  const html = buildPopupHtml(contentHtml, katexCss, { ...options, isPdf: false });
  openPrintPopup(html);
}

/**
 * Download the worksheet as a PDF — auto-download, no print dialog.
 *
 * Approach: render the serialised worksheet HTML (with all inline styles intact)
 * into a hidden same-origin iframe at exactly A4 width (794px @ 96dpi).
 * html2canvas then captures that iframe's document — which has a fresh layout,
 * correct background colours, borders, and KaTeX math — and jsPDF stitches
 * the canvas slices into a multi-page A4 PDF that downloads automatically.
 *
 * Why iframe instead of appending a clone to the page body?
 *   - The iframe gets its own layout context, so scroll position / overflow on
 *     the main page cannot clip or distort the capture.
 *   - We write a complete HTML document (including KaTeX CSS and all inline styles
 *     from the serialised DOM) so every purple card, border, and background
 *     colour is present — identical to what the user sees on screen.
 */
export async function downloadHtmlAsPdf(
  element: HTMLElement,
  filename: string,
  options: {
    overlayColor?: string;
    viewMode?: "teacher" | "student";
    textSize?: number;
    title?: string;
    sendNeedId?: string;
    landscape?: boolean;
  } = {}
): Promise<void> {
  const viewMode = options.viewMode || "student";
  const overlayColor = options.overlayColor || "#ffffff";
  const landscape = options.landscape ?? false;

  // A4 portrait: 210×297mm; A4 landscape: 297×210mm
  const A4_W_MM = landscape ? 297 : 210;
  const A4_H_MM = landscape ? 210 : 297;
  const MARGIN_MM = 3;
  const printableW_MM = A4_W_MM - MARGIN_MM * 2;
  const printableH_MM = A4_H_MM - MARGIN_MM * 2;
  // Landscape renders at A4-landscape width (1123px @ 96dpi ≈ 297mm)
  const RENDER_PX = landscape ? 1123 : 794;
  const JPEG_QUALITY = 0.88;

  // Serialise the live DOM into a complete self-contained HTML document.
  // This ensures KaTeX CSS, all inline styles, and backgrounds are present
  // in the iframe — identical to what the user sees on screen.
  const contentHtml = serialiseElement(element, viewMode);
  const katexCss = getKatexCssInline();

  // Build a minimal HTML doc (no print script — we just need layout, not printing)
  const fmt = getSendFormatting(options.sendNeedId, options.textSize ?? 14);
  const iframeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>${katexCss}</style>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: ${overlayColor};
      font-family: ${fmt.fontFamily};
      font-size: ${fmt.fontSize}px;
      line-height: ${fmt.lineHeight};
      width: ${RENDER_PX}px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .worksheet-print-root {
      background: ${overlayColor};
      width: ${RENDER_PX}px;
      max-width: ${RENDER_PX}px;
    }
    .ws-teacher-section { display: none !important; }
    :root { color-scheme: light; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    /* ── PRIMARY SCHOOL: preserve all colourful section styles in PDF ── */
    /* Gradient header bars */
    [style*="linear-gradient"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Coloured section cards (18px radius) */
    [style*="border-radius: 18px"],
    [style*="borderRadius: 18px"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      border-radius: 18px !important;
      overflow: hidden !important;
    }
    /* Numbered circle bubbles */
    [style*="border-radius: 50%"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Primary palette background colours — force render in PDF */
    [style*="background: #fff0f6"],[style*="background:#fff0f6"],
    [style*="background: #eff6ff"],[style*="background:#eff6ff"],
    [style*="background: #f0fdf4"],[style*="background:#f0fdf4"],
    [style*="background: #fff7ed"],[style*="background:#fff7ed"],
    [style*="background: #faf5ff"],[style*="background:#faf5ff"],
    [style*="background: #ecfeff"],[style*="background:#ecfeff"],
    [style*="background: #fefce8"],[style*="background:#fefce8"],
    [style*="background: #f0fdfa"],[style*="background:#f0fdfa"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Primary palette border colours */
    [style*="border: 3px solid"],[style*="border:3px solid"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .katex .katex-mathml {
      position: absolute !important; clip: rect(1px,1px,1px,1px) !important;
      padding: 0 !important; border: 0 !important;
      height: 1px !important; width: 1px !important; overflow: hidden !important;
    }
    /* ── Fraction bar fixes ─────────────────────────────────────────────────
       KaTeX renders fractions using .frac-line which is a thin <span> with
       border-top. html2canvas can misplace it if the surrounding text hasn't
       fully measured. These rules lock it in place. */
    .katex .frac-line {
      display: block !important;
      border-bottom-width: 0 !important;
      border-top-style: solid !important;
      border-top-width: 0.04em !important;
      width: 100% !important;
      position: relative !important;
    }
    .katex .mfrac .frac-line {
      min-height: 0.04em !important;
    }
    .katex .vlist-t { border-collapse: separate !important; }
    .katex .vlist-t2 { margin-right: -2px !important; }
    /* Ensure fraction numerator/denominator align correctly */
    .katex .mfrac > span > span { text-align: center !important; }
    .katex { font-size: 1em !important; line-height: 1.2 !important; }
    .katex .katex-html { white-space: nowrap !important; }
    /* Tailwind utilities for story/tool HTML exports */
    .bg-gradient-to-br{background-image:linear-gradient(to bottom right,var(--tw-gradient-from,#6366f1),var(--tw-gradient-to,#8b5cf6))}
    .from-amber-600{--tw-gradient-from:#d97706}.from-violet-700{--tw-gradient-from:#6d28d9}.from-slate-800{--tw-gradient-from:#1e293b}
    .from-cyan-700{--tw-gradient-from:#0e7490}.from-yellow-500{--tw-gradient-from:#eab308}.from-gray-900{--tw-gradient-from:#111827}
    .from-green-600{--tw-gradient-from:#16a34a}.via-orange-500{--tw-gradient-via:#f97316}.via-purple-600{--tw-gradient-via:#9333ea}
    .via-blue-600{--tw-gradient-via:#2563eb}.via-amber-700{--tw-gradient-via:#b45309}.via-orange-400{--tw-gradient-via:#fb923c}
    .via-purple-900{--tw-gradient-via:#581c87}.via-emerald-500{--tw-gradient-via:#10b981}.via-gray-700{--tw-gradient-via:#374151}
    .to-red-600{--tw-gradient-to:#dc2626}.to-indigo-700{--tw-gradient-to:#4338ca}.to-zinc-800{--tw-gradient-to:#27272a}
    .to-yellow-800{--tw-gradient-to:#92400e}.to-pink-500{--tw-gradient-to:#ec4899}.to-slate-900{--tw-gradient-to:#0f172a}
    .to-teal-600{--tw-gradient-to:#0d9488}
    .rounded-2xl{border-radius:1rem}.rounded-xl{border-radius:.75rem}.rounded-lg{border-radius:.5rem}.rounded-full{border-radius:9999px}
    .overflow-hidden{overflow:hidden}.relative{position:relative}.absolute{position:absolute}.inset-0{top:0;right:0;bottom:0;left:0}
    .flex{display:flex}.flex-col{flex-direction:column}.items-center{align-items:center}.justify-center{justify-content:center}
    .text-center{text-align:center}.text-white{color:white}.font-black{font-weight:900}.font-bold{font-weight:700}
    .text-2xl{font-size:1.5rem}.text-3xl{font-size:1.875rem}.gap-3{gap:.75rem}.gap-2{gap:.5rem}
    .px-8{padding-left:2rem;padding-right:2rem}.py-10{padding-top:2.5rem;padding-bottom:2.5rem}
    .mb-1{margin-bottom:.25rem}.mt-1{margin-top:.25rem}.shadow-2xl{box-shadow:0 25px 50px -12px rgba(0,0,0,.25)}
    .select-none{user-select:none}.leading-tight{line-height:1.25}.max-w-lg{max-width:32rem}
    .opacity-20{opacity:.2}.rotate-12{transform:rotate(12deg)}.bottom-0{bottom:0}.left-0{left:0}.right-0{right:0}
    .text-xs{font-size:.75rem}.text-lg{font-size:1.125rem}.capitalize{text-transform:capitalize}
  </style>
</head>
<body>${contentHtml}</body>
</html>`;

  // Create a hidden iframe off-screen (NOT opacity:0 — html2canvas respects opacity)
  const iframe = document.createElement("iframe");
  iframe.style.cssText = [
    "position:fixed",
    "top:0",
    "left:-9999px",
    `width:${RENDER_PX}px`,
    "height:1px",
    "border:none",
    "visibility:hidden",
  ].join(";");
  document.body.appendChild(iframe);

  try {
    // Write the document into the iframe and wait for it to fully load
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("iframe load timeout")), 15000);
      iframe.onload = () => { clearTimeout(timer); resolve(); };
      iframe.srcdoc = iframeHtml;
    });

    // Give fonts and images extra time to render
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 400)))
    );

    const iframeDoc = iframe.contentDocument!;
    const iframeBody = iframeDoc.body;

    // ── Wait for KaTeX fonts to fully load inside the iframe ─────────────
    // KaTeX fraction bars rely on CSS-positioned elements that only render
    // correctly once the KaTeX fonts are loaded. Without this wait,
    // html2canvas captures before fonts load and fraction lines appear
    // in the wrong position.
    try {
      if (iframeDoc.fonts && iframeDoc.fonts.ready) {
        await Promise.race([
          iframeDoc.fonts.ready,
          new Promise<void>((r) => setTimeout(r, 3000)), // 3s max wait
        ]);
      }
    } catch (_) {}

    // Extra frame after font load to let the browser re-paint fraction elements
    await new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 200)));

    // Expand iframe to full content height so nothing is clipped
    const fullH = iframeBody.scrollHeight;
    iframe.style.height = `${fullH}px`;
    iframe.style.visibility = "visible";

    // Another frame to let the browser re-layout at the new height
    await new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 100)));

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    // Measure section blocks inside the iframe
    const rootEl = iframeDoc.querySelector(".worksheet-print-root") as HTMLElement || iframeBody;
    const rootRect = rootEl.getBoundingClientRect();
    const blocks: Array<{ top: number; bottom: number }> = Array.from(
      rootEl.querySelectorAll<HTMLElement>(".ws-header, .ws-section")
    ).map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top - rootRect.top, bottom: r.bottom - rootRect.top };
    });

    // Capture the iframe body at 1.5× scale
    const canvas = await html2canvas(iframeBody, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: overlayColor,
      logging: false,
      windowWidth: RENDER_PX,
      width: RENDER_PX,
      scrollX: 0,
      scrollY: 0,
    });

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const DPR = canvasW / RENDER_PX;

    const scaledBlocks = blocks.map((b) => ({
      top: b.top * DPR,
      bottom: b.bottom * DPR,
    }));

    const mmPerPx = printableW_MM / canvasW;
    const pageH_Px = printableH_MM / mmPerPx;

    // Section-aware page break — never slice through a block
    const findBreak = (curY: number): number => {
      const ideal = curY + pageH_Px;
      if (ideal >= canvasH) return canvasH;
      let breakAt = ideal;
      let changed = true;
      while (changed) {
        changed = false;
        for (const blk of scaledBlocks) {
          if (blk.top >= canvasH) continue;
          if (breakAt > blk.top && breakAt < blk.bottom) {
            const blockH = blk.bottom - blk.top;
            if (blockH >= pageH_Px * 0.98) continue;
            const candidate = blk.top - 4 * DPR;
            if (candidate > curY) { breakAt = candidate; changed = true; }
          }
        }
      }
      if (breakAt <= curY) breakAt = curY + pageH_Px;
      return Math.min(breakAt, canvasH);
    };

    const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4", compress: true });
    let curY = 0;
    let pageNum = 0;

    while (curY < canvasH) {
      if (pageNum > 0) pdf.addPage();
      const endY = findBreak(curY);
      const sliceH_Px = Math.ceil(endY - curY);

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvasW;
      pageCanvas.height = sliceH_Px;
      const ctx = pageCanvas.getContext("2d")!;
      ctx.fillStyle = overlayColor && overlayColor !== "transparent" ? overlayColor : "#ffffff";
      ctx.fillRect(0, 0, canvasW, sliceH_Px);
      ctx.drawImage(canvas, 0, -curY);

      pdf.addImage(
        pageCanvas.toDataURL("image/jpeg", JPEG_QUALITY),
        "JPEG",
        MARGIN_MM,
        MARGIN_MM,
        printableW_MM,
        sliceH_Px * mmPerPx
      );

      curY = endY;
      pageNum++;
    }

    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
