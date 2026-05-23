/**
 * printPresets.ts — PR-24 / audit item #60.
 *
 * A3 / A5 / leaflet-booklet print presets. Pure / deterministic.
 *
 * The default exporter prints to A4 portrait. UK schools regularly
 * need:
 *   - A3 portrait for poster / anchor-poster output (PR-10).
 *   - A5 landscape booklet (folded A4) for revision pamphlets.
 *   - Leaflet booklet (3-fold A4 landscape) for parent-facing
 *     summaries.
 *
 * Each preset declares the page size, margins (in mm), orientation
 * and post-print folding instructions so the renderer + DOCX/PDF
 * exporters can apply the same geometry.
 */

export type PrintPresetId = "a4-portrait" | "a4-landscape" | "a3-portrait" | "a5-landscape" | "leaflet-trifold";

export interface PrintPreset {
  id: PrintPresetId;
  /** Pupil-facing label. */
  label: string;
  /** CSS @page size, e.g. "A4", "A3 landscape". */
  pageSize: string;
  /** Page-margins in millimetres. Order: top, right, bottom, left. */
  marginsMm: [number, number, number, number];
  /** Print bleed in millimetres. 0 = no bleed. */
  bleedMm: number;
  /** Stapling-edge clearance in millimetres (extra margin on the
   *  binding side). 0 = no stapling. */
  staplingEdgeMm: number;
  /** Number of physical pages per A4 sheet (post-folding). */
  pagesPerSheet: 1 | 2 | 3 | 4;
  /** True when the layout assumes booklet imposition. */
  isBooklet: boolean;
  /** Optional teacher-facing folding instructions. */
  foldingInstructions?: string;
}

export const PRINT_PRESETS: Readonly<Record<PrintPresetId, PrintPreset>> = Object.freeze({
  "a4-portrait": {
    id: "a4-portrait",
    label: "A4 portrait (default)",
    pageSize: "A4",
    marginsMm: [15, 15, 15, 15],
    bleedMm: 0,
    staplingEdgeMm: 0,
    pagesPerSheet: 1,
    isBooklet: false,
  },
  "a4-landscape": {
    id: "a4-landscape",
    label: "A4 landscape",
    pageSize: "A4 landscape",
    marginsMm: [12, 15, 12, 15],
    bleedMm: 0,
    staplingEdgeMm: 0,
    pagesPerSheet: 1,
    isBooklet: false,
  },
  "a3-portrait": {
    id: "a3-portrait",
    label: "A3 poster (anchor)",
    pageSize: "A3",
    marginsMm: [20, 20, 20, 20],
    bleedMm: 3,
    staplingEdgeMm: 0,
    pagesPerSheet: 1,
    isBooklet: false,
  },
  "a5-landscape": {
    id: "a5-landscape",
    label: "A5 booklet (fold once)",
    pageSize: "A4 landscape",
    marginsMm: [10, 10, 10, 18],
    bleedMm: 2,
    staplingEdgeMm: 8,
    pagesPerSheet: 2,
    isBooklet: true,
    foldingInstructions: "Print double-sided (long edge), fold once down the centre to make an A5 booklet. Staple along the fold.",
  },
  "leaflet-trifold": {
    id: "leaflet-trifold",
    label: "Leaflet — trifold",
    pageSize: "A4 landscape",
    marginsMm: [8, 8, 8, 8],
    bleedMm: 2,
    staplingEdgeMm: 0,
    pagesPerSheet: 3,
    isBooklet: true,
    foldingInstructions: "Print double-sided (short edge), fold into thirds. The first panel becomes the front cover.",
  },
});

/** All presets in stable order — used by the exporter UI. */
export function listPrintPresets(): readonly PrintPreset[] {
  return Object.values(PRINT_PRESETS);
}

/** Lookup with a sensible fallback. Always returns a usable preset. */
export function lookupPrintPreset(id: string | undefined): PrintPreset {
  const key = String(id || "a4-portrait") as PrintPresetId;
  return PRINT_PRESETS[key] || PRINT_PRESETS["a4-portrait"];
}

/** Render a CSS @page rule from a preset. Used by the print stylesheet
 *  in the renderer. Pure — no DOM access. */
export function buildPageCss(preset: PrintPreset): string {
  const [t, r, b, l] = preset.marginsMm;
  const stapleMm = preset.staplingEdgeMm > 0 ? `; padding-left: ${preset.staplingEdgeMm}mm` : "";
  return `@page { size: ${preset.pageSize}; margin: ${t}mm ${r}mm ${b}mm ${l}mm; ${
    preset.bleedMm > 0 ? `bleed: ${preset.bleedMm}mm; ` : ""
  }}${stapleMm ? `\n@media print { body { padding-left: ${preset.staplingEdgeMm}mm; } }` : ""}`;
}
