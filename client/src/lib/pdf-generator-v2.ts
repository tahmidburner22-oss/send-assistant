/**
 * PDF Generator v2 — pixel-perfect HTML-to-PDF using html2canvas + jsPDF.
 * The PDF looks identical to the on-screen WorksheetRenderer output.
 */
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function downloadHtmlAsPdf(
  element: HTMLElement,
  filename: string,
  options: { overlayColor?: string } = {}
): Promise<void> {
  // Temporarily expand element to full width for capture
  const originalStyle = element.style.cssText;
  element.style.width = "794px"; // A4 at 96dpi
  element.style.maxWidth = "794px";
  element.style.padding = "40px";
  element.style.boxSizing = "border-box";
  element.style.backgroundColor = options.overlayColor || "white";

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x for crisp text
      useCORS: true,
      allowTaint: true,
      backgroundColor: options.overlayColor || "#ffffff",
      logging: false,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;

    // Additional pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
  } finally {
    element.style.cssText = originalStyle;
  }
}

/**
 * Print the worksheet using the browser's native print engine.
 * This produces the highest quality output and matches the screen exactly.
 */
export function printWorksheetElement(
  element: HTMLElement,
  options: {
    overlayColor?: string;
    viewMode?: "teacher" | "student";
    textSize?: number;
    title?: string;
  } = {}
): void {
  const { overlayColor = "white", viewMode = "student", textSize = 14 } = options;

  // Clone the element for printing
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = "";

  // Create print window
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    // Fallback: inject print styles into current page
    injectPrintStyles(element, overlayColor, viewMode, textSize);
    window.print();
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title || "Worksheet"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: ${textSize}px;
      background: ${overlayColor};
      color: #1f2937;
      padding: 20mm;
    }
    @page {
      size: A4 portrait;
      margin: 15mm 20mm;
    }
    @media print {
      body { padding: 0; background: ${overlayColor} !important; }
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Worksheet styles */
    .ws-header { border-bottom: 3px solid #7c3aed; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .ws-section { margin-bottom: 16px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
    .ws-teacher-section { page-break-before: always; break-before: page; }
    ${viewMode === "student" ? ".ws-teacher-section { display: none !important; }" : ""}
    .ws-footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #7c3aed !important; color: white !important; padding: 8px 12px; text-align: left; }
    td { padding: 7px 12px; border: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
  </style>
</head>
<body>
  ${element.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); window.close(); }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

function injectPrintStyles(
  element: HTMLElement,
  overlayColor: string,
  viewMode: string,
  textSize: number
): void {
  const existingStyle = document.getElementById("ws-print-style");
  if (existingStyle) existingStyle.remove();

  const style = document.createElement("style");
  style.id = "ws-print-style";
  style.textContent = `
    @media print {
      body > *:not(#ws-print-container) { display: none !important; }
      #ws-print-container {
        display: block !important;
        position: fixed !important;
        top: 0; left: 0; right: 0;
        background: ${overlayColor} !important;
        padding: 20mm;
        font-size: ${textSize}px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      ${viewMode === "student" ? ".ws-teacher-section { display: none !important; }" : ""}
      .ws-section { page-break-inside: avoid; break-inside: avoid; }
      .ws-teacher-section { page-break-before: always; break-before: page; }
    }
  `;
  document.head.appendChild(style);

  // Wrap element
  const container = document.createElement("div");
  container.id = "ws-print-container";
  const clone = element.cloneNode(true) as HTMLElement;
  container.appendChild(clone);
  document.body.appendChild(container);

  setTimeout(() => {
    container.remove();
    style.remove();
  }, 2000);
}
