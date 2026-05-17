/**
 * svgLayoutChecker.ts — PR-M4 (Layer 2)
 *
 * Deterministic, dependency-free post-pass that audits AI-generated SVG
 * diagrams for the two most embarrassing failure modes a teacher can see:
 *
 *   1. Text labels that crash through lines or other shapes.
 *   2. Elements that fall outside the 700×500 viewBox.
 *
 * It works without DOMParser so it runs identically in the browser, in
 * Node test runs, and in any future server-side validation pass.
 *
 * Approach
 * ────────
 * Parse the raw SVG string with conservative regex extractors. We do NOT
 * try to be a full SVG renderer — we extract the bounding boxes of just
 * the elements that matter for the overlap check:
 *
 *   - <text> elements      → bbox approximated from x, y, font-size,
 *                            estimated text width and text-anchor.
 *   - <line> elements      → bbox from x1/y1/x2/y2.
 *   - <rect> elements      → bbox from x, y, width, height.
 *   - <circle> elements    → bbox from cx, cy, r.
 *   - <ellipse> elements   → bbox from cx, cy, rx, ry.
 *
 * A pair-wise check then asks:
 *   - Is every element fully inside the viewBox?
 *   - Does any <text> overlap any other <text>?
 *   - Does any <text> overlap any non-text shape stroke (leader-line
 *     exception applies — see isLeaderLine).
 *
 * The audit is ADVISORY by design. It returns a structured report; the
 * caller decides whether to render, retry, or fall back. PR-M4 wires it
 * non-blockingly through diagramEngine.auditAiSvg(); a future PR can
 * upgrade to active regenerate-on-fail once we have field data.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Axis-aligned bounding box. All coordinates in SVG user-space (px). */
export interface Bbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SvgElementKind =
  | "text"
  | "line"
  | "rect"
  | "circle"
  | "ellipse";

export interface ExtractedElement {
  kind: SvgElementKind;
  bbox: Bbox;
  /** For <text>, the inner text content (stripped of <tspan> markup). */
  text?: string;
  /** For <text>, the resolved text-anchor ("start" / "middle" / "end"). */
  textAnchor?: "start" | "middle" | "end";
  /** For <text>, the resolved font-size in px (defaults to 13). */
  fontSize?: number;
  /** Source character index for the opening tag — useful for diagnostics. */
  sourceIndex: number;
}

export interface SvgLayoutIssue {
  kind:
    | "out-of-bounds"
    | "text-overlaps-text"
    | "text-overlaps-shape"
    | "missing-text-anchor"
    | "small-font";
  message: string;
  /** Indexes into the report's `elements` array; usually one or two. */
  elementIndexes: number[];
}

export interface SvgLayoutReport {
  /** True when no issues were found. */
  pass: boolean;
  /** All extracted elements, in document order. */
  elements: ExtractedElement[];
  /** Issues, ordered by severity (out-of-bounds first). */
  issues: SvgLayoutIssue[];
  /** Human-readable summary suitable for a teacher banner. */
  summary: string;
  /** ViewBox width × height we ran the audit against. */
  viewBox: { width: number; height: number };
}

export interface SvgLayoutCheckOptions {
  /** Default 700. */
  viewBoxWidth?: number;
  /** Default 500. */
  viewBoxHeight?: number;
  /** Required clear margin between two text elements / a text and a shape.
   *  Default 8 px (matches the prompt rule we ship to the LLM). */
  minClearMarginPx?: number;
  /** Minimum font size for non-rotated text. Default 12. */
  minFontSizePx?: number;
}

// ─── Attribute extraction helpers ────────────────────────────────────────────

/**
 * Read a numeric attribute from a single tag string. Returns NaN if the
 * attribute is missing or unparseable. Handles both single- and
 * double-quoted attribute values.
 */
function readNumberAttr(tag: string, attr: string): number {
  const re = new RegExp(`\\b${attr}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = re.exec(tag);
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : NaN;
}

function readStringAttr(tag: string, attr: string): string | undefined {
  const re = new RegExp(`\\b${attr}\\s*=\\s*["']([^"']*)["']`, "i");
  const m = re.exec(tag);
  return m ? m[1] : undefined;
}

function hasAttr(tag: string, attr: string): boolean {
  const re = new RegExp(`\\b${attr}\\s*=`, "i");
  return re.test(tag);
}

/**
 * Estimate the rendered width of a text run. We can't measure a font we
 * don't have, so use a conservative average advance of ~0.55 em per
 * character. This deliberately over-estimates a touch — better a false
 * positive on overlap than a missed crash.
 */
function estimateTextWidth(text: string, fontSizePx: number): number {
  const normalised = text.replace(/\s+/g, " ").trim();
  return Math.max(8, normalised.length * fontSizePx * 0.55);
}

/**
 * Resolve text-anchor from an attribute, defaulting to "start" per SVG.
 * The audit will flag explicitly missing anchors as a separate issue.
 */
function resolveTextAnchor(tag: string): "start" | "middle" | "end" {
  const v = (readStringAttr(tag, "text-anchor") || "").toLowerCase();
  if (v === "middle" || v === "end") return v;
  return "start";
}

/**
 * Strip XML/HTML tags from a <text> body. We keep the visible text only —
 * <tspan> children, entity references, etc. We replace common entities
 * with single placeholder characters so width estimation stays sensible.
 */
function decodeTextBody(body: string): string {
  return body
    .replace(/<[^>]*>/g, " ")
    .replace(/&#?\w+;/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Element extractors ──────────────────────────────────────────────────────

function extractTextElements(svg: string): ExtractedElement[] {
  const out: ExtractedElement[] = [];
  // Match <text ...>body</text>. Body may contain tspans / entities.
  const re = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const tag = `<text ${m[1]}>`;
    const x = readNumberAttr(tag, "x");
    const y = readNumberAttr(tag, "y");
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const fontSize = (() => {
      const f = readNumberAttr(tag, "font-size");
      return Number.isFinite(f) ? f : 13;
    })();
    const text = decodeTextBody(m[2]);
    const width = estimateTextWidth(text, fontSize);
    // Approximate a text bbox: text height = fontSize, baseline at y so
    // top of glyph is y - 0.8*fontSize.
    const height = fontSize * 1.2;
    const top = y - fontSize * 0.85;
    const anchor = resolveTextAnchor(tag);
    const left =
      anchor === "middle"
        ? x - width / 2
        : anchor === "end"
        ? x - width
        : x;
    out.push({
      kind: "text",
      bbox: { x: left, y: top, width, height },
      text,
      textAnchor: anchor,
      fontSize,
      sourceIndex: m.index,
    });
  }
  return out;
}

function extractLineElements(svg: string): ExtractedElement[] {
  const out: ExtractedElement[] = [];
  const re = /<line\b([^/>]*)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const tag = m[0];
    const x1 = readNumberAttr(tag, "x1");
    const y1 = readNumberAttr(tag, "y1");
    const x2 = readNumberAttr(tag, "x2");
    const y2 = readNumberAttr(tag, "y2");
    if (![x1, y1, x2, y2].every(Number.isFinite)) continue;
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    out.push({
      kind: "line",
      bbox: {
        x: left,
        y: top,
        // Lines have zero width on one axis; pad by 1 px so bbox checks
        // are well-defined without inflating overlap aggressively.
        width: Math.max(1, Math.abs(x2 - x1)),
        height: Math.max(1, Math.abs(y2 - y1)),
      },
      sourceIndex: m.index,
    });
  }
  return out;
}

function extractRectElements(svg: string): ExtractedElement[] {
  const out: ExtractedElement[] = [];
  const re = /<rect\b([^/>]*)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const tag = m[0];
    const x = readNumberAttr(tag, "x");
    const y = readNumberAttr(tag, "y");
    const width = readNumberAttr(tag, "width");
    const height = readNumberAttr(tag, "height");
    if (![x, y, width, height].every(Number.isFinite)) continue;
    out.push({
      kind: "rect",
      bbox: { x, y, width, height },
      sourceIndex: m.index,
    });
  }
  return out;
}

function extractCircleElements(svg: string): ExtractedElement[] {
  const out: ExtractedElement[] = [];
  const re = /<circle\b([^/>]*)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const tag = m[0];
    const cx = readNumberAttr(tag, "cx");
    const cy = readNumberAttr(tag, "cy");
    const r = readNumberAttr(tag, "r");
    if (![cx, cy, r].every(Number.isFinite)) continue;
    out.push({
      kind: "circle",
      bbox: { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r },
      sourceIndex: m.index,
    });
  }
  return out;
}

function extractEllipseElements(svg: string): ExtractedElement[] {
  const out: ExtractedElement[] = [];
  const re = /<ellipse\b([^/>]*)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const tag = m[0];
    const cx = readNumberAttr(tag, "cx");
    const cy = readNumberAttr(tag, "cy");
    const rx = readNumberAttr(tag, "rx");
    const ry = readNumberAttr(tag, "ry");
    if (![cx, cy, rx, ry].every(Number.isFinite)) continue;
    out.push({
      kind: "ellipse",
      bbox: { x: cx - rx, y: cy - ry, width: 2 * rx, height: 2 * ry },
      sourceIndex: m.index,
    });
  }
  return out;
}

// ─── Bbox utilities ──────────────────────────────────────────────────────────

function bboxesOverlap(a: Bbox, b: Bbox, tolerance = 0): boolean {
  // Two bboxes overlap iff they overlap on BOTH axes.
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;
  // tolerance shrinks each box symmetrically before the test; a positive
  // tolerance therefore counts as "must keep at least N px of clear gap".
  return (
    a.x < bRight - tolerance &&
    aRight > b.x + tolerance &&
    a.y < bBottom - tolerance &&
    aBottom > b.y + tolerance
  );
}

function bboxOutsideViewBox(
  b: Bbox,
  viewWidth: number,
  viewHeight: number,
): boolean {
  return (
    b.x < 0 ||
    b.y < 0 ||
    b.x + b.width > viewWidth ||
    b.y + b.height > viewHeight
  );
}

/**
 * Heuristic: a "leader line" is a thin line that touches a text bbox. We
 * tolerate this because labels in Zone B/C/D/E intentionally connect to
 * Zone-A elements via a leader. The check here is approximate — we only
 * treat lines as leader candidates if they're strictly outside the text
 * bbox by less than 4 px on the touch side. That covers labelled
 * diagrams while still catching real text-on-line crashes.
 */
function isLikelyLeaderLine(text: ExtractedElement, line: ExtractedElement): boolean {
  if (text.kind !== "text" || line.kind !== "line") return false;
  const tb = text.bbox;
  const lb = line.bbox;
  // The line is thin (zero on one axis) AND its closest edge to the text
  // bbox touches within 4px without piercing more than 2px into it.
  const isThinHorizontal = lb.height <= 1;
  const isThinVertical = lb.width <= 1;
  if (!isThinHorizontal && !isThinVertical) return false;
  // Touching = bboxes overlap with tolerance 0 but not with tolerance 2.
  const touches = bboxesOverlap(tb, lb, 0);
  const piercesDeeply = bboxesOverlap(tb, lb, 2);
  return touches && !piercesDeeply;
}

// ─── Main check ──────────────────────────────────────────────────────────────

const DEFAULTS: Required<SvgLayoutCheckOptions> = {
  viewBoxWidth: 700,
  viewBoxHeight: 500,
  minClearMarginPx: 8,
  minFontSizePx: 12,
};

export function checkSvgLayout(
  svg: string,
  options: SvgLayoutCheckOptions = {},
): SvgLayoutReport {
  const opts = { ...DEFAULTS, ...options };
  const elements: ExtractedElement[] = [
    ...extractTextElements(svg),
    ...extractLineElements(svg),
    ...extractRectElements(svg),
    ...extractCircleElements(svg),
    ...extractEllipseElements(svg),
  ].sort((a, b) => a.sourceIndex - b.sourceIndex);

  const issues: SvgLayoutIssue[] = [];

  // 1) Out-of-bounds. The white background <rect width=700 height=500/> is
  //    expected, so we exclude rects that exactly fill the viewBox.
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const isFullCanvasRect =
      el.kind === "rect" &&
      el.bbox.x === 0 &&
      el.bbox.y === 0 &&
      Math.abs(el.bbox.width - opts.viewBoxWidth) < 1 &&
      Math.abs(el.bbox.height - opts.viewBoxHeight) < 1;
    if (isFullCanvasRect) continue;
    if (bboxOutsideViewBox(el.bbox, opts.viewBoxWidth, opts.viewBoxHeight)) {
      issues.push({
        kind: "out-of-bounds",
        message: `${el.kind}${el.text ? ` "${el.text.slice(0, 30)}"` : ""} extends outside the ${opts.viewBoxWidth}×${opts.viewBoxHeight} canvas (bbox x=${el.bbox.x.toFixed(0)}, y=${el.bbox.y.toFixed(0)}, w=${el.bbox.width.toFixed(0)}, h=${el.bbox.height.toFixed(0)}).`,
        elementIndexes: [i],
      });
    }
  }

  // 2) Text-on-text overlaps (with the required clear margin).
  const textIdxs = elements
    .map((el, i) => (el.kind === "text" ? i : -1))
    .filter(i => i >= 0);
  for (let a = 0; a < textIdxs.length; a++) {
    for (let b = a + 1; b < textIdxs.length; b++) {
      const ia = textIdxs[a];
      const ib = textIdxs[b];
      if (
        bboxesOverlap(
          elements[ia].bbox,
          elements[ib].bbox,
          -opts.minClearMarginPx,
        )
      ) {
        issues.push({
          kind: "text-overlaps-text",
          message: `Text labels too close (margin < ${opts.minClearMarginPx}px): "${elements[ia].text}" and "${elements[ib].text}".`,
          elementIndexes: [ia, ib],
        });
      }
    }
  }

  // 3) Text overlapping a non-text shape (excluding leader-line touches).
  for (const ti of textIdxs) {
    for (let i = 0; i < elements.length; i++) {
      if (i === ti) continue;
      const other = elements[i];
      if (other.kind === "text") continue;
      // Leader lines are allowed to touch their target text bbox.
      if (isLikelyLeaderLine(elements[ti], other)) continue;
      if (
        bboxesOverlap(elements[ti].bbox, other.bbox, -opts.minClearMarginPx)
      ) {
        issues.push({
          kind: "text-overlaps-shape",
          message: `Text "${elements[ti].text}" overlaps a ${other.kind} (margin < ${opts.minClearMarginPx}px).`,
          elementIndexes: [ti, i],
        });
      }
    }
  }

  // 4) Per-text rule violations: missing text-anchor / font too small.
  //    These come from the strengthened prompt — useful even when no
  //    overlap occurs, because they're the leading indicators of one.
  // We re-scan the raw SVG to detect text-anchor presence (the parsed
  // element resolves to "start" for both "missing" and "explicit start",
  // which we don't want to conflate).
  const rawTextRe = /<text\b([^>]*)>/gi;
  let rawMatch: RegExpExecArray | null;
  let textCounter = 0;
  while ((rawMatch = rawTextRe.exec(svg)) !== null) {
    const tag = `<text ${rawMatch[1]}>`;
    const elementIdx = textIdxs[textCounter];
    textCounter++;
    if (elementIdx === undefined) break;
    if (!hasAttr(tag, "text-anchor")) {
      issues.push({
        kind: "missing-text-anchor",
        message: `Text "${elements[elementIdx].text}" has no text-anchor attribute — required by the diagram prompt.`,
        elementIndexes: [elementIdx],
      });
    }
    const fs = elements[elementIdx].fontSize ?? 13;
    if (fs < opts.minFontSizePx) {
      issues.push({
        kind: "small-font",
        message: `Text "${elements[elementIdx].text}" has font-size ${fs}, below the ${opts.minFontSizePx}px minimum.`,
        elementIndexes: [elementIdx],
      });
    }
  }

  // Sort: out-of-bounds first, then overlaps, then prompt-rule violations.
  const severity: Record<SvgLayoutIssue["kind"], number> = {
    "out-of-bounds": 0,
    "text-overlaps-text": 1,
    "text-overlaps-shape": 1,
    "missing-text-anchor": 2,
    "small-font": 2,
  };
  issues.sort((x, y) => severity[x.kind] - severity[y.kind]);

  const summary =
    issues.length === 0
      ? `SVG layout check passed for ${elements.length} elements.`
      : `SVG layout check found ${issues.length} issue(s) across ${elements.length} elements: ${issues
          .slice(0, 3)
          .map(i => i.kind)
          .join(", ")}${issues.length > 3 ? ", ..." : ""}.`;

  return {
    pass: issues.length === 0,
    elements,
    issues,
    summary,
    viewBox: { width: opts.viewBoxWidth, height: opts.viewBoxHeight },
  };
}

// Test-only export — used by future unit tests.
export const __test__ = {
  bboxesOverlap,
  bboxOutsideViewBox,
  estimateTextWidth,
  isLikelyLeaderLine,
  extractTextElements,
  extractLineElements,
  extractRectElements,
  extractCircleElements,
  extractEllipseElements,
};
