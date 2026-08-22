/**
 * mathsGoldPdf.ts
 *
 * Print / PDF export for fixed-layout worksheet documents.
 *
 * The dedicated Maths and Science renderers emit self-contained, print-ready
 * A4-landscape HTML documents. Maths uses two fixed `.page` elements; Science
 * uses one fixed `.science-page` element. Both use the same 285mm × 200mm
 * printable area inside the A4 landscape page margins, so preview, print, and
 * export retain identical geometry.
 *
 * Because that document is already laid out, we do NOT run it through the
 * portrait section-flow pipeline in pdf-generator-v2 (serialise → measure →
 * repaginate). Instead we:
 *   • print: open the document verbatim in a popup and call print();
 *   • PDF:   rasterise each `.page` div and drop it onto an A4-landscape
 *            jsPDF page at the exact 6mm/5mm margin offset.
 */

// A4 landscape geometry (mm) — must match the @page rule in mathsGoldRenderer.
const A4_L_W_MM = 297;
const A4_L_H_MM = 210;
const MARGIN_X_MM = 6; // left/right
const MARGIN_Y_MM = 5; // top/bottom
const PAGE_W_MM = A4_L_W_MM - MARGIN_X_MM * 2; // 285
const PAGE_H_MM = A4_L_H_MM - MARGIN_Y_MM * 2; // 200

// On-screen pixel width of one 285mm page at 96dpi (used to size the render
// iframe). Higher html2canvas `scale` gives the actual export resolution.
const PAGE_W_PX = Math.round((PAGE_W_MM * 96) / 25.4); // ≈ 1077

/** Wait for an iframe's document to be ready (fonts + a paint or two). */
async function waitForIframe(iframe: HTMLIFrameElement): Promise<Document> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("gold iframe load timeout")), 15000);
    iframe.onload = () => { clearTimeout(timer); resolve(); };
  });
  const doc = iframe.contentDocument;
  if (!doc) throw new Error("gold iframe has no document");
  try {
    if (doc.fonts?.ready) {
      await Promise.race([doc.fonts.ready, new Promise<void>((r) => setTimeout(r, 2500))]);
    }
  } catch { /* fonts.ready unsupported — ignore */ }
  await new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 250)));
  return doc;
}

/**
 * Download a fixed-layout worksheet as an A4-landscape PDF.
 *
 * @param html      a complete document from renderGoldWorksheetHtml()
 * @param filename  output filename (".pdf" appended if missing)
 */
export async function downloadGoldWorksheetPdf(
  html: string,
  filename: string
): Promise<void> {
  const iframe = document.createElement("iframe");
  // Render at the true page width so html2canvas captures crisp geometry.
  iframe.style.cssText = `position:fixed;top:0;left:-99999px;width:${PAGE_W_PX}px;height:${PAGE_W_PX * 2}px;border:none;visibility:hidden;`;
  document.body.appendChild(iframe);

  try {
    iframe.srcdoc = html;
    const doc = await waitForIframe(iframe);

    const pages = Array.from(doc.querySelectorAll<HTMLElement>(".page, .science-page"));
    if (pages.length === 0) throw new Error("fixed-layout document has no exportable page elements");

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: PAGE_W_PX,
        width: pages[i].offsetWidth,
        height: pages[i].offsetHeight,
      });
      if (i > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.95),
        "JPEG",
        MARGIN_X_MM,
        MARGIN_Y_MM,
        PAGE_W_MM,
        PAGE_H_MM
      );
    }

    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Open the gold worksheet in a popup and trigger the browser's native print
 * dialog. The document's own `@page { size: A4 landscape }` rule guarantees
 * the print/PDF output matches the on-screen spread exactly.
 */
export function printGoldWorksheet(html: string): void {
  const printScript = `
<script>
  function triggerPrint() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(function () { window.print(); }, 350); });
    } else {
      setTimeout(function () { window.print(); }, 1000);
    }
  }
  if (document.readyState === 'complete') triggerPrint();
  else window.addEventListener('load', triggerPrint);
<\/script>`;

  const doc = html.includes("</body>")
    ? html.replace("</body>", `${printScript}</body>`)
    : html + printScript;

  const popup = window.open("", "_blank", "width=1100,height=800,scrollbars=yes,resizable=yes");
  if (!popup) {
    alert("Please allow pop-ups for this site to use print/PDF features.");
    return;
  }
  popup.document.open();
  popup.document.write(doc);
  popup.document.close();
}
