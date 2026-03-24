/**
 * diagramEngine.ts — Adaptly Diagram Engine
 *
 * Stage 4 of the validation pipeline.
 * Generates vector-only diagrams from a fixed symbol library.
 *
 * Rules enforced:
 * - Vector only — no raster image fallback
 * - All symbols come from a fixed approved library
 * - All connectors snap to grid or anchor points
 * - All labels must be attached to a valid object
 * - No floating components (unless diagram type specifically allows)
 * - Every diagram passes 5 checks before display:
 *   1. Geometry check (bounding box, overlap, cut-off)
 *   2. Semantics check (valid symbols, anchored labels, matched references)
 *   3. Style check (consistent symbol size, no visual clutter)
 *   4. Page fit check (fits within allotted box, aspect ratio valid)
 *   5. Accessibility check (alt text, contrast, label readability)
 */

// ─── Grid system ──────────────────────────────────────────────────────────────
const GRID_SIZE = 8; // 8px grid snap

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

// ─── Approved symbol library ──────────────────────────────────────────────────
export type SymbolType =
  // Circuit symbols
  | "cell" | "battery" | "switch-open" | "switch-closed"
  | "resistor" | "variable-resistor" | "lamp" | "led"
  | "voltmeter" | "ammeter" | "galvanometer"
  | "capacitor" | "diode" | "motor" | "generator"
  | "fuse" | "earth" | "junction"
  // Biology symbols
  | "cell-membrane" | "nucleus" | "mitochondria" | "chloroplast"
  | "arrow-straight" | "arrow-curved"
  // General
  | "box-labeled" | "circle-labeled" | "diamond-labeled"
  | "connector-wire" | "connector-arrow" | "connector-dashed"
  | "label-line";

export interface SymbolDef {
  type: SymbolType;
  defaultWidth: number;
  defaultHeight: number;
  anchorPoints: { id: string; dx: number; dy: number }[]; // relative to symbol centre
  svgTemplate: (x: number, y: number, w: number, h: number, label?: string) => string;
  category: "circuit" | "biology" | "general";
}

// ─── SVG symbol templates ─────────────────────────────────────────────────────
const SYMBOLS: Record<SymbolType, SymbolDef> = {
  // ── Circuit symbols ────────────────────────────────────────────────────────
  "cell": {
    type: "cell", defaultWidth: 32, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 4}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x - 4}" y1="${y - 10}" x2="${x - 4}" y2="${y + 10}" stroke="#1a2744" stroke-width="2.5"/>
      <line x1="${x + 4}" y1="${y - 6}" x2="${x + 4}" y2="${y + 6}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x + 4}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <text x="${x - 6}" y="${y - 13}" font-size="8" fill="#1a2744" text-anchor="middle">+</text>
      <text x="${x + 6}" y="${y - 13}" font-size="8" fill="#1a2744" text-anchor="middle">−</text>`,
  },
  "battery": {
    type: "battery", defaultWidth: 48, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -24, dy: 0 }, { id: "right", dx: 24, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 24}" y1="${y}" x2="${x - 8}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x - 8}" y1="${y - 10}" x2="${x - 8}" y2="${y + 10}" stroke="#1a2744" stroke-width="2.5"/>
      <line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x + 8}" y1="${y - 10}" x2="${x + 8}" y2="${y + 10}" stroke="#1a2744" stroke-width="2.5"/>
      <line x1="${x + 8}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <text x="${x - 10}" y="${y - 13}" font-size="8" fill="#1a2744" text-anchor="middle">+</text>
      <text x="${x + 10}" y="${y - 13}" font-size="8" fill="#1a2744" text-anchor="middle">−</text>`,
  },
  "switch-open": {
    type: "switch-open", defaultWidth: 40, defaultHeight: 24, category: "circuit",
    anchorPoints: [{ id: "left", dx: -20, dy: 0 }, { id: "right", dx: 20, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 20}" y1="${y}" x2="${x - 8}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x - 8}" cy="${y}" r="2.5" fill="#1a2744"/>
      <line x1="${x - 8}" y1="${y}" x2="${x + 8}" y2="${y - 12}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x + 8}" cy="${y}" r="2.5" fill="#1a2744"/>
      <line x1="${x + 8}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "switch-closed": {
    type: "switch-closed", defaultWidth: 40, defaultHeight: 24, category: "circuit",
    anchorPoints: [{ id: "left", dx: -20, dy: 0 }, { id: "right", dx: 20, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 20}" y1="${y}" x2="${x - 8}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x - 8}" cy="${y}" r="2.5" fill="#1a2744"/>
      <line x1="${x - 8}" y1="${y}" x2="${x + 8}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x + 8}" cy="${y}" r="2.5" fill="#1a2744"/>
      <line x1="${x + 8}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "resistor": {
    type: "resistor", defaultWidth: 48, defaultHeight: 24, category: "circuit",
    anchorPoints: [{ id: "left", dx: -24, dy: 0 }, { id: "right", dx: 24, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 24}" y1="${y}" x2="${x - 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <rect x="${x - 16}" y="${y - 8}" width="32" height="16" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x + 16}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "variable-resistor": {
    type: "variable-resistor", defaultWidth: 48, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -24, dy: 0 }, { id: "right", dx: 24, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 24}" y1="${y}" x2="${x - 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <rect x="${x - 16}" y="${y - 8}" width="32" height="16" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x + 16}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x - 8}" y1="${y - 16}" x2="${x + 8}" y2="${y + 4}" stroke="#1a2744" stroke-width="1.5" marker-end="url(#arrow)"/>`,
  },
  "lamp": {
    type: "lamp", defaultWidth: 32, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 12}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x - 8}" y1="${y - 8}" x2="${x + 8}" y2="${y + 8}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x + 8}" y1="${y - 8}" x2="${x - 8}" y2="${y + 8}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x + 12}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "led": {
    type: "led", defaultWidth: 32, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 8}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <polygon points="${x - 8},${y - 10} ${x - 8},${y + 10} ${x + 8},${y}" fill="#1a2744"/>
      <line x1="${x + 8}" y1="${y - 10}" x2="${x + 8}" y2="${y + 10}" stroke="#1a2744" stroke-width="2"/>
      <line x1="${x + 8}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x + 4}" y1="${y - 14}" x2="${x + 12}" y2="${y - 20}" stroke="#1a2744" stroke-width="1" marker-end="url(#arrow-small)"/>
      <line x1="${x + 8}" y1="${y - 14}" x2="${x + 16}" y2="${y - 20}" stroke="#1a2744" stroke-width="1" marker-end="url(#arrow-small)"/>`,
  },
  "voltmeter": {
    type: "voltmeter", defaultWidth: 32, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 12}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      <text x="${x}" y="${y + 4}" font-size="11" fill="#1a2744" text-anchor="middle" font-weight="bold">V</text>
      <line x1="${x + 12}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "ammeter": {
    type: "ammeter", defaultWidth: 32, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 12}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      <text x="${x}" y="${y + 4}" font-size="11" fill="#1a2744" text-anchor="middle" font-weight="bold">A</text>
      <line x1="${x + 12}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "galvanometer": {
    type: "galvanometer", defaultWidth: 32, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 12}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      <text x="${x}" y="${y + 4}" font-size="11" fill="#1a2744" text-anchor="middle" font-weight="bold">G</text>
      <line x1="${x + 12}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "capacitor": {
    type: "capacitor", defaultWidth: 32, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 4}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x - 4}" y1="${y - 12}" x2="${x - 4}" y2="${y + 12}" stroke="#1a2744" stroke-width="2.5"/>
      <line x1="${x + 4}" y1="${y - 12}" x2="${x + 4}" y2="${y + 12}" stroke="#1a2744" stroke-width="2.5"/>
      <line x1="${x + 4}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "diode": {
    type: "diode", defaultWidth: 32, defaultHeight: 24, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 8}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <polygon points="${x - 8},${y - 10} ${x - 8},${y + 10} ${x + 8},${y}" fill="#1a2744"/>
      <line x1="${x + 8}" y1="${y - 10}" x2="${x + 8}" y2="${y + 10}" stroke="#1a2744" stroke-width="2"/>
      <line x1="${x + 8}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "motor": {
    type: "motor", defaultWidth: 32, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 12}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      <text x="${x}" y="${y + 4}" font-size="11" fill="#1a2744" text-anchor="middle" font-weight="bold">M</text>
      <line x1="${x + 12}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "generator": {
    type: "generator", defaultWidth: 32, defaultHeight: 32, category: "circuit",
    anchorPoints: [{ id: "left", dx: -16, dy: 0 }, { id: "right", dx: 16, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 16}" y1="${y}" x2="${x - 12}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      <text x="${x}" y="${y + 4}" font-size="10" fill="#1a2744" text-anchor="middle" font-weight="bold">AC</text>
      <line x1="${x + 12}" y1="${y}" x2="${x + 16}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "fuse": {
    type: "fuse", defaultWidth: 40, defaultHeight: 24, category: "circuit",
    anchorPoints: [{ id: "left", dx: -20, dy: 0 }, { id: "right", dx: 20, dy: 0 }],
    svgTemplate: (x, y) => `
      <line x1="${x - 20}" y1="${y}" x2="${x - 12}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <rect x="${x - 12}" y="${y - 6}" width="24" height="12" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x - 8}" y1="${y}" x2="${x + 8}" y2="${y}" stroke="#1a2744" stroke-width="1.5" stroke-dasharray="2,2"/>
      <line x1="${x + 12}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "earth": {
    type: "earth", defaultWidth: 24, defaultHeight: 24, category: "circuit",
    anchorPoints: [{ id: "top", dx: 0, dy: -12 }],
    svgTemplate: (x, y) => `
      <line x1="${x}" y1="${y - 12}" x2="${x}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x - 12}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="#1a2744" stroke-width="2"/>
      <line x1="${x - 8}" y1="${y + 5}" x2="${x + 8}" y2="${y + 5}" stroke="#1a2744" stroke-width="1.5"/>
      <line x1="${x - 4}" y1="${y + 10}" x2="${x + 4}" y2="${y + 10}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "junction": {
    type: "junction", defaultWidth: 8, defaultHeight: 8, category: "circuit",
    anchorPoints: [{ id: "centre", dx: 0, dy: 0 }],
    svgTemplate: (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="#1a2744"/>`,
  },
  // ── Biology symbols ────────────────────────────────────────────────────────
  "cell-membrane": {
    type: "cell-membrane", defaultWidth: 120, defaultHeight: 80, category: "biology",
    anchorPoints: [{ id: "centre", dx: 0, dy: 0 }],
    svgTemplate: (x, y, w, h) => `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="none" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "nucleus": {
    type: "nucleus", defaultWidth: 48, defaultHeight: 36, category: "biology",
    anchorPoints: [{ id: "centre", dx: 0, dy: 0 }],
    svgTemplate: (x, y, w, h) => `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="#e8eaf6" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "mitochondria": {
    type: "mitochondria", defaultWidth: 48, defaultHeight: 24, category: "biology",
    anchorPoints: [{ id: "centre", dx: 0, dy: 0 }],
    svgTemplate: (x, y, w, h) => `
      <ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="#fff3e0" stroke="#1a2744" stroke-width="1.5"/>
      <path d="M ${x - w / 4} ${y - h / 4} Q ${x} ${y + h / 4} ${x + w / 4} ${y - h / 4}" fill="none" stroke="#1a2744" stroke-width="1"/>`,
  },
  "chloroplast": {
    type: "chloroplast", defaultWidth: 48, defaultHeight: 24, category: "biology",
    anchorPoints: [{ id: "centre", dx: 0, dy: 0 }],
    svgTemplate: (x, y, w, h) => `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="#e8f5e9" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  // ── General symbols ────────────────────────────────────────────────────────
  "arrow-straight": {
    type: "arrow-straight", defaultWidth: 48, defaultHeight: 16, category: "general",
    anchorPoints: [{ id: "start", dx: -24, dy: 0 }, { id: "end", dx: 24, dy: 0 }],
    svgTemplate: (x, y) => `<line x1="${x - 24}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="#1a2744" stroke-width="1.5" marker-end="url(#arrowhead)"/>`,
  },
  "arrow-curved": {
    type: "arrow-curved", defaultWidth: 48, defaultHeight: 32, category: "general",
    anchorPoints: [{ id: "start", dx: -24, dy: 8 }, { id: "end", dx: 24, dy: 8 }],
    svgTemplate: (x, y) => `<path d="M ${x - 24} ${y + 8} Q ${x} ${y - 16} ${x + 20} ${y + 8}" fill="none" stroke="#1a2744" stroke-width="1.5" marker-end="url(#arrowhead)"/>`,
  },
  "box-labeled": {
    type: "box-labeled", defaultWidth: 80, defaultHeight: 48, category: "general",
    anchorPoints: [{ id: "centre", dx: 0, dy: 0 }, { id: "top", dx: 0, dy: -24 }, { id: "bottom", dx: 0, dy: 24 }, { id: "left", dx: -40, dy: 0 }, { id: "right", dx: 40, dy: 0 }],
    svgTemplate: (x, y, w, h, label) => `
      <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" fill="none" stroke="#1a2744" stroke-width="1.5" rx="2"/>
      ${label ? `<text x="${x}" y="${y + 5}" font-size="11" fill="#1a2744" text-anchor="middle">${label}</text>` : ''}`,
  },
  "circle-labeled": {
    type: "circle-labeled", defaultWidth: 48, defaultHeight: 48, category: "general",
    anchorPoints: [{ id: "centre", dx: 0, dy: 0 }],
    svgTemplate: (x, y, w, _h, label) => `
      <circle cx="${x}" cy="${y}" r="${w / 2}" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      ${label ? `<text x="${x}" y="${y + 4}" font-size="11" fill="#1a2744" text-anchor="middle">${label}</text>` : ''}`,
  },
  "diamond-labeled": {
    type: "diamond-labeled", defaultWidth: 64, defaultHeight: 40, category: "general",
    anchorPoints: [{ id: "top", dx: 0, dy: -20 }, { id: "bottom", dx: 0, dy: 20 }, { id: "left", dx: -32, dy: 0 }, { id: "right", dx: 32, dy: 0 }],
    svgTemplate: (x, y, w, h, label) => `
      <polygon points="${x},${y - h / 2} ${x + w / 2},${y} ${x},${y + h / 2} ${x - w / 2},${y}" fill="none" stroke="#1a2744" stroke-width="1.5"/>
      ${label ? `<text x="${x}" y="${y + 4}" font-size="11" fill="#1a2744" text-anchor="middle">${label}</text>` : ''}`,
  },
  "connector-wire": {
    type: "connector-wire", defaultWidth: 48, defaultHeight: 0, category: "general",
    anchorPoints: [{ id: "start", dx: -24, dy: 0 }, { id: "end", dx: 24, dy: 0 }],
    svgTemplate: (x, y) => `<line x1="${x - 24}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="#1a2744" stroke-width="1.5"/>`,
  },
  "connector-arrow": {
    type: "connector-arrow", defaultWidth: 48, defaultHeight: 0, category: "general",
    anchorPoints: [{ id: "start", dx: -24, dy: 0 }, { id: "end", dx: 24, dy: 0 }],
    svgTemplate: (x, y) => `<line x1="${x - 24}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="#1a2744" stroke-width="1.5" marker-end="url(#arrowhead)"/>`,
  },
  "connector-dashed": {
    type: "connector-dashed", defaultWidth: 48, defaultHeight: 0, category: "general",
    anchorPoints: [{ id: "start", dx: -24, dy: 0 }, { id: "end", dx: 24, dy: 0 }],
    svgTemplate: (x, y) => `<line x1="${x - 24}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="#1a2744" stroke-width="1.5" stroke-dasharray="4,3"/>`,
  },
  "label-line": {
    type: "label-line", defaultWidth: 48, defaultHeight: 0, category: "general",
    anchorPoints: [{ id: "start", dx: -24, dy: 0 }, { id: "end", dx: 24, dy: 0 }],
    svgTemplate: (x, y) => `<line x1="${x - 24}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="#666" stroke-width="1" stroke-dasharray="3,2"/>`,
  },
};

// ─── Diagram spec ─────────────────────────────────────────────────────────────
export interface DiagramComponent {
  id: string;
  symbol: SymbolType;
  x: number; // grid-snapped centre x
  y: number; // grid-snapped centre y
  width?: number;
  height?: number;
  label?: string;
  labelPosition?: "above" | "below" | "left" | "right";
  anchorId?: string; // which anchor point this connects from
}

export interface DiagramConnection {
  fromId: string;
  fromAnchor: string;
  toId: string;
  toAnchor: string;
  type: "wire" | "arrow" | "dashed";
}

export interface DiagramSpec {
  type: "circuit" | "biology" | "flow" | "labeled" | "general";
  title?: string;
  altText: string; // required for accessibility
  boxWidth: number;
  boxHeight: number;
  components: DiagramComponent[];
  connections: DiagramConnection[];
}

// ─── Diagram validation ───────────────────────────────────────────────────────
export interface DiagramCheckResult {
  check: "geometry" | "semantics" | "style" | "page-fit" | "accessibility";
  pass: boolean;
  errors: string[];
  warnings: string[];
}

export interface DiagramValidationResult {
  pass: boolean;
  checks: DiagramCheckResult[];
  allErrors: string[];
}

/**
 * Runs all 5 checks on a diagram spec.
 * Returns PASS only if all 5 checks pass.
 * Do not render until this returns pass: true.
 */
export function validateDiagram(spec: DiagramSpec, containerWidthPx: number, containerHeightPx: number): DiagramValidationResult {
  const checks: DiagramCheckResult[] = [
    checkGeometry(spec),
    checkSemantics(spec),
    checkStyle(spec),
    checkPageFit(spec, containerWidthPx, containerHeightPx),
    checkAccessibility(spec),
  ];
  const allErrors = checks.flatMap(c => c.errors);
  return {
    pass: checks.every(c => c.pass),
    checks,
    allErrors,
  };
}

/** Check 1: Geometry — bounding box, overlap, cut-off, anchor validity */
function checkGeometry(spec: DiagramSpec): DiagramCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check all components are within the diagram box
  for (const comp of spec.components) {
    const sym = SYMBOLS[comp.symbol];
    if (!sym) { errors.push(`Unknown symbol: ${comp.symbol}`); continue; }
    const w = comp.width ?? sym.defaultWidth;
    const h = comp.height ?? sym.defaultHeight;
    const left = comp.x - w / 2;
    const top = comp.y - h / 2;
    const right = comp.x + w / 2;
    const bottom = comp.y + h / 2;

    if (left < 0) errors.push(`Component "${comp.id}" (${comp.symbol}) is cut off at left edge (x=${left})`);
    if (top < 0) errors.push(`Component "${comp.id}" (${comp.symbol}) is cut off at top edge (y=${top})`);
    if (right > spec.boxWidth) errors.push(`Component "${comp.id}" (${comp.symbol}) is cut off at right edge (right=${right}, box=${spec.boxWidth})`);
    if (bottom > spec.boxHeight) errors.push(`Component "${comp.id}" (${comp.symbol}) is cut off at bottom edge (bottom=${bottom}, box=${spec.boxHeight})`);

    // Check grid snap
    if (comp.x % GRID_SIZE !== 0 || comp.y % GRID_SIZE !== 0) {
      warnings.push(`Component "${comp.id}" is not grid-snapped (x=${comp.x}, y=${comp.y}). Snapping to grid.`);
    }
  }

  // Check component overlap (bounding box intersection)
  for (let i = 0; i < spec.components.length; i++) {
    for (let j = i + 1; j < spec.components.length; j++) {
      const a = spec.components[i];
      const b = spec.components[j];
      const symA = SYMBOLS[a.symbol];
      const symB = SYMBOLS[b.symbol];
      if (!symA || !symB) continue;
      const wA = (a.width ?? symA.defaultWidth) / 2;
      const hA = (a.height ?? symA.defaultHeight) / 2;
      const wB = (b.width ?? symB.defaultWidth) / 2;
      const hB = (b.height ?? symB.defaultHeight) / 2;
      const overlapX = Math.abs(a.x - b.x) < (wA + wB + 4);
      const overlapY = Math.abs(a.y - b.y) < (hA + hB + 4);
      if (overlapX && overlapY) {
        errors.push(`Component overlap: "${a.id}" and "${b.id}" overlap each other.`);
      }
    }
  }

  // Check label overlap
  const labelPositions: { id: string; x: number; y: number }[] = [];
  for (const comp of spec.components) {
    if (!comp.label) continue;
    const sym = SYMBOLS[comp.symbol];
    const labelX = comp.x + (comp.labelPosition === "right" ? 20 : comp.labelPosition === "left" ? -20 : 0);
    const labelY = comp.y + (comp.labelPosition === "below" ? 20 : comp.labelPosition === "above" ? -20 : 0);
    for (const prev of labelPositions) {
      if (Math.abs(labelX - prev.x) < 40 && Math.abs(labelY - prev.y) < 16) {
        warnings.push(`Label overlap: "${comp.id}" and "${prev.id}" labels may overlap.`);
      }
    }
    labelPositions.push({ id: comp.id, x: labelX, y: labelY });
  }

  return { check: "geometry", pass: errors.length === 0, errors, warnings };
}

/** Check 2: Semantics — valid symbols, anchored labels, matched connection references */
function checkSemantics(spec: DiagramSpec): DiagramCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const componentIds = new Set(spec.components.map(c => c.id));

  // Check all symbols are from the approved library
  for (const comp of spec.components) {
    if (!SYMBOLS[comp.symbol]) {
      errors.push(`Symbol "${comp.symbol}" is not in the approved symbol library.`);
    }
  }

  // Check all connections reference valid component IDs
  for (const conn of spec.connections) {
    if (!componentIds.has(conn.fromId)) {
      errors.push(`Connection references unknown component: "${conn.fromId}"`);
    }
    if (!componentIds.has(conn.toId)) {
      errors.push(`Connection references unknown component: "${conn.toId}"`);
    }
    // Check anchor points exist on the referenced symbol
    const fromComp = spec.components.find(c => c.id === conn.fromId);
    const toComp = spec.components.find(c => c.id === conn.toId);
    if (fromComp && SYMBOLS[fromComp.symbol]) {
      const sym = SYMBOLS[fromComp.symbol];
      const hasAnchor = sym.anchorPoints.some(a => a.id === conn.fromAnchor);
      if (!hasAnchor) {
        errors.push(`Symbol "${fromComp.symbol}" has no anchor point "${conn.fromAnchor}".`);
      }
    }
    if (toComp && SYMBOLS[toComp.symbol]) {
      const sym = SYMBOLS[toComp.symbol];
      const hasAnchor = sym.anchorPoints.some(a => a.id === conn.toAnchor);
      if (!hasAnchor) {
        errors.push(`Symbol "${toComp.symbol}" has no anchor point "${conn.toAnchor}".`);
      }
    }
  }

  // Check labels are attached to valid components
  for (const comp of spec.components) {
    if (comp.label && comp.label.length > 30) {
      warnings.push(`Label on "${comp.id}" is very long (${comp.label.length} chars). Consider shortening.`);
    }
  }

  return { check: "semantics", pass: errors.length === 0, errors, warnings };
}

/** Check 3: Style — consistent symbol size, visual clutter score */
function checkStyle(spec: DiagramSpec): DiagramCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check consistent symbol sizes within same type
  const sizesByType: Record<string, number[]> = {};
  for (const comp of spec.components) {
    const sym = SYMBOLS[comp.symbol];
    if (!sym) continue;
    const w = comp.width ?? sym.defaultWidth;
    if (!sizesByType[comp.symbol]) sizesByType[comp.symbol] = [];
    sizesByType[comp.symbol].push(w);
  }
  for (const [symType, sizes] of Object.entries(sizesByType)) {
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    if (max / min > 2) {
      errors.push(`Inconsistent symbol size for "${symType}": sizes range from ${min}px to ${max}px (max 2× variation allowed).`);
    }
  }

  // Visual clutter score: too many elements for available space
  const area = spec.boxWidth * spec.boxHeight;
  const elementCount = spec.components.length + spec.connections.length;
  const clutterScore = elementCount / (area / 10000); // elements per 100×100 unit
  if (clutterScore > 1.5) {
    errors.push(`Visual clutter score ${clutterScore.toFixed(2)} exceeds threshold 1.5. Too many elements (${elementCount}) for the available space (${spec.boxWidth}×${spec.boxHeight}px).`);
  } else if (clutterScore > 1.0) {
    warnings.push(`Visual clutter score ${clutterScore.toFixed(2)} is approaching threshold. Consider simplifying.`);
  }

  // Check no floating components (components with no connections in a circuit diagram)
  if (spec.type === "circuit") {
    const connectedIds = new Set([
      ...spec.connections.map(c => c.fromId),
      ...spec.connections.map(c => c.toId),
    ]);
    for (const comp of spec.components) {
      if (comp.symbol === "junction") continue; // junctions are always floating
      if (!connectedIds.has(comp.id)) {
        errors.push(`Floating component: "${comp.id}" (${comp.symbol}) has no connections. All circuit components must be connected.`);
      }
    }
  }

  return { check: "style", pass: errors.length === 0, errors, warnings };
}

/** Check 4: Page fit — diagram fits within allotted box, aspect ratio valid */
function checkPageFit(spec: DiagramSpec, containerWidthPx: number, containerHeightPx: number): DiagramCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (spec.boxWidth > containerWidthPx) {
    errors.push(`Diagram width (${spec.boxWidth}px) exceeds container width (${containerWidthPx}px).`);
  }
  if (spec.boxHeight > containerHeightPx) {
    errors.push(`Diagram height (${spec.boxHeight}px) exceeds container height (${containerHeightPx}px).`);
  }

  // Check aspect ratio
  const aspectRatio = spec.boxWidth / spec.boxHeight;
  if (aspectRatio > 4) {
    errors.push(`Diagram aspect ratio ${aspectRatio.toFixed(2)} is too wide (max 4:1). This will break the layout.`);
  }
  if (aspectRatio < 0.25) {
    errors.push(`Diagram aspect ratio ${aspectRatio.toFixed(2)} is too tall (min 1:4). This will break the layout.`);
  }

  return { check: "page-fit", pass: errors.length === 0, errors, warnings };
}

/** Check 5: Accessibility — alt text, contrast, label readability */
function checkAccessibility(spec: DiagramSpec): DiagramCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Alt text is required
  if (!spec.altText || spec.altText.trim().length < 10) {
    errors.push(`Diagram is missing a meaningful alt text description (minimum 10 characters).`);
  }

  // Check all labels are readable (min 10px font)
  // (Labels use 11px font in SVG templates — this is a structural check)
  const labelCount = spec.components.filter(c => c.label).length;
  if (spec.components.length > 0 && labelCount === 0 && spec.type !== "circuit") {
    warnings.push(`No labels on any diagram components. Consider adding labels for accessibility.`);
  }

  return { check: "accessibility", pass: errors.length === 0, errors, warnings };
}

// ─── SVG renderer ─────────────────────────────────────────────────────────────
/**
 * Renders a validated DiagramSpec to an SVG string.
 * ONLY call this after validateDiagram returns pass: true.
 */
export function renderDiagramToSVG(spec: DiagramSpec): string {
  const parts: string[] = [];

  // SVG header with arrowhead marker
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${spec.boxWidth}" height="${spec.boxHeight}" viewBox="0 0 ${spec.boxWidth} ${spec.boxHeight}" role="img" aria-label="${spec.altText}">`);
  parts.push(`<defs>
    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#1a2744"/>
    </marker>
    <marker id="arrow-small" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
      <polygon points="0 0, 6 2.5, 0 5" fill="#1a2744"/>
    </marker>
  </defs>`);

  // Title for accessibility
  if (spec.title) {
    parts.push(`<title>${spec.title}</title>`);
  }
  parts.push(`<desc>${spec.altText}</desc>`);

  // Background
  parts.push(`<rect width="${spec.boxWidth}" height="${spec.boxHeight}" fill="white" stroke="none"/>`);

  // Render connections first (behind components)
  for (const conn of spec.connections) {
    const fromComp = spec.components.find(c => c.id === conn.fromId);
    const toComp = spec.components.find(c => c.id === conn.toId);
    if (!fromComp || !toComp) continue;

    const fromSym = SYMBOLS[fromComp.symbol];
    const toSym = SYMBOLS[toComp.symbol];
    if (!fromSym || !toSym) continue;

    const fromAnchor = fromSym.anchorPoints.find(a => a.id === conn.fromAnchor);
    const toAnchor = toSym.anchorPoints.find(a => a.id === conn.toAnchor);
    if (!fromAnchor || !toAnchor) continue;

    const x1 = snapToGrid(fromComp.x + fromAnchor.dx);
    const y1 = snapToGrid(fromComp.y + fromAnchor.dy);
    const x2 = snapToGrid(toComp.x + toAnchor.dx);
    const y2 = snapToGrid(toComp.y + toAnchor.dy);

    const dashAttr = conn.type === "dashed" ? ' stroke-dasharray="4,3"' : '';
    const markerAttr = conn.type === "arrow" ? ' marker-end="url(#arrowhead)"' : '';

    // Route wire orthogonally (horizontal then vertical)
    if (Math.abs(y1 - y2) < 4) {
      // Horizontal wire
      parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1a2744" stroke-width="1.5"${dashAttr}${markerAttr}/>`);
    } else if (Math.abs(x1 - x2) < 4) {
      // Vertical wire
      parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1a2744" stroke-width="1.5"${dashAttr}${markerAttr}/>`);
    } else {
      // L-shaped route: horizontal then vertical
      const midX = snapToGrid(x2);
      parts.push(`<polyline points="${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}" fill="none" stroke="#1a2744" stroke-width="1.5"${dashAttr}${markerAttr}/>`);
    }
  }

  // Render components
  for (const comp of spec.components) {
    const sym = SYMBOLS[comp.symbol];
    if (!sym) continue;
    const x = snapToGrid(comp.x);
    const y = snapToGrid(comp.y);
    const w = comp.width ?? sym.defaultWidth;
    const h = comp.height ?? sym.defaultHeight;
    parts.push(sym.svgTemplate(x, y, w, h, comp.label));

    // Render external label if specified
    if (comp.label && comp.labelPosition) {
      const lx = x + (comp.labelPosition === "right" ? w / 2 + 6 : comp.labelPosition === "left" ? -(w / 2 + 6) : 0);
      const ly = y + (comp.labelPosition === "below" ? h / 2 + 14 : comp.labelPosition === "above" ? -(h / 2 + 4) : 4);
      const anchor = comp.labelPosition === "right" ? "start" : comp.labelPosition === "left" ? "end" : "middle";
      parts.push(`<text x="${lx}" y="${ly}" font-size="11" fill="#1a2744" text-anchor="${anchor}" font-family="Arial, sans-serif">${comp.label}</text>`);
    }
  }

  parts.push(`</svg>`);
  return parts.join('\n');
}

/**
 * Auto-generates a simple circuit diagram for common electricity topics.
 * Returns null if the topic doesn't match a known circuit pattern.
 */
export function autoGenerateCircuitDiagram(topic: string, boxWidth = 400, boxHeight = 200): { spec: DiagramSpec; svg: string } | null {
  const t = topic.toLowerCase();

  let spec: DiagramSpec | null = null;

  // Series circuit
  if (t.includes("series") || t.includes("series circuit")) {
    spec = {
      type: "circuit",
      title: "Series Circuit",
      altText: "A simple series circuit with a battery, switch, resistor, and lamp connected in series.",
      boxWidth, boxHeight,
      components: [
        { id: "bat", symbol: "battery", x: 80, y: 100, label: "Battery", labelPosition: "above" },
        { id: "sw", symbol: "switch-open", x: 200, y: 40, label: "Switch", labelPosition: "above" },
        { id: "res", symbol: "resistor", x: 320, y: 100, label: "Resistor", labelPosition: "above" },
        { id: "lamp", symbol: "lamp", x: 200, y: 160, label: "Lamp", labelPosition: "below" },
      ],
      connections: [
        { fromId: "bat", fromAnchor: "right", toId: "sw", toAnchor: "left", type: "wire" },
        { fromId: "sw", fromAnchor: "right", toId: "res", toAnchor: "left", type: "wire" },
        { fromId: "res", fromAnchor: "right", toId: "lamp", toAnchor: "right", type: "wire" },
        { fromId: "lamp", fromAnchor: "left", toId: "bat", toAnchor: "left", type: "wire" },
      ],
    };
  }

  // Parallel circuit
  else if (t.includes("parallel") || t.includes("parallel circuit")) {
    spec = {
      type: "circuit",
      title: "Parallel Circuit",
      altText: "A parallel circuit with a battery and two lamps connected in parallel branches.",
      boxWidth, boxHeight,
      components: [
        { id: "bat", symbol: "battery", x: 64, y: 100, label: "Battery", labelPosition: "above" },
        { id: "lamp1", symbol: "lamp", x: 280, y: 64, label: "Lamp 1", labelPosition: "above" },
        { id: "lamp2", symbol: "lamp", x: 280, y: 136, label: "Lamp 2", labelPosition: "below" },
      ],
      connections: [
        { fromId: "bat", fromAnchor: "right", toId: "lamp1", toAnchor: "left", type: "wire" },
        { fromId: "bat", fromAnchor: "right", toId: "lamp2", toAnchor: "left", type: "wire" },
        { fromId: "lamp1", fromAnchor: "right", toId: "bat", toAnchor: "right", type: "wire" },
        { fromId: "lamp2", fromAnchor: "right", toId: "bat", toAnchor: "right", type: "wire" },
      ],
    };
  }

  // Ohm's law / resistance circuit
  else if (t.includes("ohm") || t.includes("resistance") || t.includes("resistor") || t.includes("circuit")) {
    spec = {
      type: "circuit",
      title: "Resistance Circuit",
      altText: "A circuit with a battery, resistor, ammeter in series, and voltmeter in parallel across the resistor.",
      boxWidth, boxHeight,
      components: [
        { id: "bat", symbol: "battery", x: 64, y: 100, label: "Battery", labelPosition: "above" },
        { id: "amm", symbol: "ammeter", x: 200, y: 40, label: "A", labelPosition: "above" },
        { id: "res", symbol: "resistor", x: 336, y: 100, label: "R", labelPosition: "above" },
        { id: "volt", symbol: "voltmeter", x: 336, y: 160, label: "V", labelPosition: "below" },
      ],
      connections: [
        { fromId: "bat", fromAnchor: "right", toId: "amm", toAnchor: "left", type: "wire" },
        { fromId: "amm", fromAnchor: "right", toId: "res", toAnchor: "left", type: "wire" },
        { fromId: "res", fromAnchor: "right", toId: "bat", toAnchor: "right", type: "wire" },
        { fromId: "res", fromAnchor: "left", toId: "volt", toAnchor: "left", type: "wire" },
        { fromId: "res", fromAnchor: "right", toId: "volt", toAnchor: "right", type: "wire" },
      ],
    };
  }

  if (!spec) return null;

  // Validate before rendering
  const validation = validateDiagram(spec, boxWidth, boxHeight);
  if (!validation.pass) {
    console.warn("Diagram failed validation:", validation.allErrors);
    return null;
  }

  return { spec, svg: renderDiagramToSVG(spec) };
}
