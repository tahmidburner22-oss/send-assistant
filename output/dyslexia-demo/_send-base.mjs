/**
 * _send-base.mjs — the single source of truth for the SEND (dyslexia)
 * adaptations shared by every worksheet (Science + English, one-page +
 * booklet). Importing this guarantees all documents get the EXACT SAME
 * adaptations regardless of subject/layout.
 *
 * Canonical dyslexia profile (BDA-aligned, mirrors the repo's
 * dyslexia-opendyslexic profile + cream COBS overlay):
 *   - OpenDyslexic typeface (embedded as data-URI; Comic Sans MS fallback)
 *   - Full-bleed cream #FFF8E7 overlay, black text
 *   - 16px base, line-height 1.6, letter-spacing 0.03em, word-spacing 0.14em
 *   - Ragged-right (left-aligned), never justified
 *   - Outlined section boxes: coloured border (#5b3fa8), NO fill
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CREAM = "#FFF8E7";
export const ACCENT = "#5b3fa8";
export const FONT = "'OpenDyslexic', 'Comic Sans MS', sans-serif";

// Embedded OpenDyslexic (SIL OFL) so rendering never touches the network.
export const FONT_CSS = readFileSync(join(__dirname, "libs/fonts/opendyslexic-embed.css"), "utf8");

export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const nl = (s) => esc(s).replace(/\n/g, "<br>");

/** Canonical adaptation CSS — identical for every worksheet. */
export function baseCss() {
  return `
  @page { margin: 0; }
  html, body { margin: 0; padding: 0; background: ${CREAM}; }
  .page {
    box-sizing: border-box;
    background: ${CREAM};
    color: #000000;
    font-family: ${FONT};
    font-size: 16px;
    line-height: 1.6;
    letter-spacing: 0.03em;
    word-spacing: 0.14em;
  }
  .page *, .page *::before, .page *::after {
    font-family: ${FONT};
    letter-spacing: 0.03em;
    word-spacing: 0.14em;
  }
  .page p, .page li, .page div, .page td, .page text { text-align: left; }
  .page + .page { break-before: page; }
  .box { border: 2px solid ${ACCENT}; border-radius: 10px; background: transparent; padding: 9px 13px; }
  h1, h2, h3 { margin: 0 0 6px; }
  h2 { color: ${ACCENT}; font-size: 16px; font-weight: 700; }
  ul, ol { margin: 0; padding-left: 20px; }
  li { margin: 4px 0; }
  `;
}

/** Shared metadata describing the adaptations (printed into each JSON). */
export const ADAPTATIONS = [
  "Full-bleed cream #FFF8E7 overlay, black text",
  "OpenDyslexic typeface embedded locally (SIL OFL)",
  "16px base, line-height 1.6, letter-spacing 0.03em, word-spacing 0.14em",
  "Ragged-right (left-aligned) text, never justified",
  "Outlined section boxes (coloured border, no fill)",
  "Key vocabulary box + plain-language common mistakes with examples",
];

/** Render a worksheet HTML string to a PDF (robust: file:// + font wait). */
export async function renderPdf({ html, htmlPath, pdfPath, landscape = false }) {
  const { chromium } = await import("playwright");
  const { writeFileSync } = await import("node:fs");
  writeFileSync(htmlPath, html, "utf8");
  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] });
  const page = await browser.newPage();
  await page.goto("file://" + htmlPath, { waitUntil: "load", timeout: 60000 });
  try { await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; }); } catch {}
  await page.waitForTimeout(500);
  await page.pdf({ path: pdfPath, format: "A4", landscape, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  await browser.close();
}
