/**
 * SVGDiagram — client-side educational diagram renderer.
 * Zero API cost: the AI outputs structured JSON describing the diagram,
 * this component renders it as clean SVG.
 *
 * Clean diagram style: pure visuals — NO text labels on the diagram for student view.
 * Numbered callout dots are used for labelling questions.
 * Teacher view (showCallouts=true) reveals labels.
 *
 * Supports: circuit, labeled, flow, cycle, number-line, bar, axes, venn, timeline, pyramid, fraction-bar
 *
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 */
import React from "react";
import type { DiagramSpec } from "@/lib/ai";

interface SVGDiagramProps {
  spec: DiagramSpec;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  accentColor?: string;
  /** When true, show labels on diagram (teacher view). Student view hides labels. */
  showCallouts?: boolean;
}

const NAVY = "#1B2A4A";
const WIRE_COLOR = "#1e293b";
const WIRE_W = 2;

// ── Word-wrap helper (shared across renderers) ─────────────────────────────
function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [""];
  if (text.length <= maxChars) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && (current + " " + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

// ── Circuit symbol renderers (coordinate-based, no text) ─────────────────────

/** Battery: two parallel lines (long+short) */
function Battery({ x, y, size = 28 }: { x: number; y: number; size?: number }) {
  const h = size * 0.7;
  return (
    <g>
      <line x1={x} y1={y - h / 2} x2={x} y2={y + h / 2} stroke={WIRE_COLOR} strokeWidth={WIRE_W + 1} />
      <line x1={x + 8} y1={y - h * 0.35} x2={x + 8} y2={y + h * 0.35} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <text x={x - 6} y={y + 4} fontSize={9} fontFamily="Arial" fill={WIRE_COLOR} fontWeight="700">+</text>
      <text x={x + 14} y={y + 4} fontSize={9} fontFamily="Arial" fill={WIRE_COLOR} fontWeight="700">−</text>
    </g>
  );
}

/** Resistor: rectangular box on wire */
function Resistor({ x, y, w = 32, h = 14 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h}
      fill="white" stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
  );
}

/** Bulb: circle with X inside */
function Bulb({ x, y, r = 12 }: { x: number; y: number; r?: number }) {
  const d = r * 0.65;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="white" stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x - d} y1={y - d} x2={x + d} y2={y + d} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x + d} y1={y - d} x2={x - d} y2={y + d} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
    </g>
  );
}

/** Ammeter: circle with A */
function Ammeter({ x, y, r = 12 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="white" stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={WIRE_COLOR} fontWeight="700">A</text>
    </g>
  );
}

/** Voltmeter: circle with V */
function Voltmeter({ x, y, r = 12 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="white" stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={WIRE_COLOR} fontWeight="700">V</text>
    </g>
  );
}

/** Switch: open gap with pivot */
function Switch({ x, y, open = true }: { x: number; y: number; open?: boolean }) {
  const w = 28;
  const pivotX = x - w / 2 + 4;
  const pivotY = y;
  const endX = x + w / 2 - 4;
  const endY = open ? y - 10 : y;
  return (
    <g>
      <line x1={x - w / 2} y1={y} x2={pivotX} y2={pivotY} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <circle cx={pivotX} cy={pivotY} r={2.5} fill={WIRE_COLOR} />
      <line x1={pivotX} y1={pivotY} x2={endX} y2={endY} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <circle cx={x + w / 2 - 4} cy={y} r={2.5} fill={WIRE_COLOR} />
    </g>
  );
}

/** Callout dot — numbered circle for labelling */
function CalloutDot({ x, y, n, accent }: { x: number; y: number; n: number; accent: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill={accent} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="white" fontWeight="700">{n}</text>
    </g>
  );
}

// ── Pre-built circuit layouts ─────────────────────────────────────────────────

function SeriesCircuit({ w, h, callouts }: { w: number; h: number; callouts?: Array<{ x: number; y: number; n: number; accent: string }> }) {
  const pad = 40;
  const x1 = pad, y1 = pad;
  const x2 = w - pad, y2 = h - pad;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const battX = x1, battY = midY;
  const switchX = midX, switchY = y1;
  const bulbX = x2, bulbY = midY;
  const resistorX = midX, resistorY = y2;

  return (
    <g>
      <polyline
        points={`${x1},${y1} ${x2},${y1} ${x2},${y2} ${x1},${y2} ${x1},${y1}`}
        fill="none" stroke={WIRE_COLOR} strokeWidth={WIRE_W}
        strokeLinejoin="round"
      />
      <line x1={x1} y1={y1} x2={x1} y2={battY - 18} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Battery x={x1} y={battY} size={32} />
      <line x1={x1} y1={battY + 18} x2={x1} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y1} x2={switchX - 18} y2={y1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Switch x={switchX} y={y1} open={true} />
      <line x1={switchX + 18} y1={y1} x2={x2} y2={y1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x2} y1={y1} x2={x2} y2={bulbY - 14} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Bulb x={x2} y={bulbY} r={13} />
      <line x1={x2} y1={bulbY + 14} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y2} x2={resistorX - 18} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Resistor x={resistorX} y={y2} w={36} h={16} />
      <line x1={resistorX + 18} y1={y2} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      {callouts?.map((c, i) => (
        <CalloutDot key={i} x={c.x} y={c.y} n={c.n} accent={c.accent} />
      ))}
    </g>
  );
}

function ParallelCircuit({ w, h, callouts }: { w: number; h: number; callouts?: Array<{ x: number; y: number; n: number; accent: string }> }) {
  const pad = 40;
  const x1 = pad, y1 = pad;
  const x2 = w - pad, y2 = h - pad;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const branchY1 = y1 + (y2 - y1) * 0.3;
  const branchY2 = y1 + (y2 - y1) * 0.7;
  const junctionX = x1 + (x2 - x1) * 0.3;
  const junctionX2 = x1 + (x2 - x1) * 0.75;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x2} y1={y1} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y2} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y1} x2={x1} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y1} x2={x1} y2={midY - 18} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Battery x={x1} y={midY} size={32} />
      <line x1={x1} y1={midY + 18} x2={x1} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={junctionX} y1={y1} x2={junctionX} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={junctionX} y1={branchY2} x2={junctionX} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={junctionX2} y1={y1} x2={junctionX2} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={junctionX2} y1={branchY2} x2={junctionX2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={junctionX} y1={branchY1} x2={midX - 14} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Bulb x={midX} y={branchY1} r={12} />
      <line x1={midX + 14} y1={branchY1} x2={junctionX2} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={junctionX} y1={branchY2} x2={midX - 18} y2={branchY2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Resistor x={midX} y={branchY2} w={36} h={16} />
      <line x1={midX + 18} y1={branchY2} x2={junctionX2} y2={branchY2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <circle cx={junctionX} cy={y1} r={3} fill={WIRE_COLOR} />
      <circle cx={junctionX} cy={y2} r={3} fill={WIRE_COLOR} />
      <circle cx={junctionX2} cy={y1} r={3} fill={WIRE_COLOR} />
      <circle cx={junctionX2} cy={y2} r={3} fill={WIRE_COLOR} />
      {callouts?.map((c, i) => (
        <CalloutDot key={i} x={c.x} y={c.y} n={c.n} accent={c.accent} />
      ))}
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SVGDiagram({
  spec,
  width = 420,
  height = 240,
  fontFamily = "Arial, sans-serif",
  fontSize = 11,
  accentColor = NAVY,
  showCallouts = false,
}: SVGDiagramProps) {
  const pad = 16;
  const inner_w = width - pad * 2;
  const inner_h = height - pad * 2;

  // ── CIRCUIT DIAGRAM ──────────────────────────────────────────────────────────
  if (spec.type === "circuit") {
    const labels = spec.labels || [];
    const callouts = labels.map((l, i) => ({
      x: pad + (l.x / 100) * (width - pad * 2),
      y: pad + (l.y / 100) * (height - pad * 2),
      n: i + 1,
      accent: accentColor,
    }));

    const layout = (spec as any).layout || "series";

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={14} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {layout === "parallel" ? (
          <ParallelCircuit w={width} h={height} callouts={callouts} />
        ) : (
          <SeriesCircuit w={width} h={height} callouts={callouts} />
        )}
      </svg>
    );
  }

  // ── LABELED DIAGRAM ─────────────────────────────────────────────────────────
  // Topology-aware labeled diagram renderer
  // Detects label spread to choose the best shape:
  //   • Radial web  (5+ labels spread around centre) → spoke-and-hub for concept maps, atomic models
  //   • Vertical chain (3 or fewer labels, or narrow spread) → stacked nodes for processes
  //   • Horizontal ellipse (wide spread) → anatomical cross-section shape
  //   • Organic blob (default) → rounded asymmetric blob for cells, organs, geographic features
  if (spec.type === "labeled") {
    const labels = spec.labels || [];
    const n = labels.length;
    if (n === 0) return null;

    const maxLabelLen = Math.max(...labels.map(l => (l.text || "").length), 6);
    const labelFontSize = maxLabelLen > 22 ? Math.max(7, fontSize - 3) : maxLabelLen > 15 ? Math.max(8, fontSize - 2) : fontSize - 1;
    const labelBoxW = Math.max(80, Math.min(120, maxLabelLen * 5.2 + 20));
    const labelBoxH = 24;
    const dotR = 8;
    const margin = labelBoxW + 18;
    const topMargin = spec.title ? 26 : 12;
    const diagX1 = margin;
    const diagY1 = topMargin + 8;
    const diagX2 = width - margin;
    const diagY2 = height - 16;
    const diagW = diagX2 - diagX1;
    const diagH = diagY2 - diagY1;
    const cx = diagX1 + diagW / 2;
    const cy = diagY1 + diagH / 2;

    // Determine topology from label spread
    const xs = labels.map(l => l.x ?? 50);
    const ys = labels.map(l => l.y ?? 50);
    const xSpread = Math.max(...xs) - Math.min(...xs);
    const ySpread = Math.max(...ys) - Math.min(...ys);
    const isRadial = n >= 5 && xSpread > 50 && ySpread > 50;
    const isChain = n <= 3 || (ySpread > xSpread * 1.5);
    const isEllipse = !isRadial && !isChain && xSpread > ySpread * 1.5;
    // Default: organic blob

    // Build the background shape path
    let shapePath: string;
    if (isRadial) {
      // Radial web: large circle as hub
      const r = Math.min(diagW, diagH) * 0.38;
      shapePath = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
    } else if (isChain) {
      // Vertical chain: tall rounded rectangle
      const rw = diagW * 0.28;
      const rh = diagH * 0.82;
      const rx = cx - rw / 2;
      const ry = cy - rh / 2;
      shapePath = `M ${rx + 12} ${ry} H ${rx + rw - 12} Q ${rx + rw} ${ry} ${rx + rw} ${ry + 12} V ${ry + rh - 12} Q ${rx + rw} ${ry + rh} ${rx + rw - 12} ${ry + rh} H ${rx + 12} Q ${rx} ${ry + rh} ${rx} ${ry + rh - 12} V ${ry + 12} Q ${rx} ${ry} ${rx + 12} ${ry} Z`;
    } else if (isEllipse) {
      // Horizontal ellipse: anatomical cross-section
      const rx2 = diagW * 0.42;
      const ry2 = diagH * 0.34;
      shapePath = `M ${cx - rx2} ${cy} A ${rx2} ${ry2} 0 1 1 ${cx + rx2} ${cy} A ${rx2} ${ry2} 0 1 1 ${cx - rx2} ${cy} Z`;
    } else {
      // Organic blob: rounded asymmetric shape
      const bx = cx, by = cy;
      const bw = diagW * 0.44, bh = diagH * 0.56;
      shapePath = [
        `M ${bx} ${by - bh}`,
        `C ${bx + bw * 1.1} ${by - bh} ${bx + bw * 1.2} ${by - bh * 0.2} ${bx + bw} ${by}`,
        `C ${bx + bw * 1.1} ${by + bh * 0.8} ${bx + bw * 0.3} ${by + bh} ${bx} ${by + bh}`,
        `C ${bx - bw * 0.9} ${by + bh} ${bx - bw * 1.2} ${by + bh * 0.5} ${bx - bw} ${by}`,
        `C ${bx - bw * 1.1} ${by - bh * 0.6} ${bx - bw * 0.3} ${by - bh} ${bx} ${by - bh} Z`,
      ].join(' ');
    }

    // Map each label's x/y (0-100) into the diagram area
    const dots = labels.map((l, i) => {
      const dotX = diagX1 + (l.x / 100) * diagW;
      const dotY = diagY1 + (l.y / 100) * diagH;
      const goLeft = dotX < cx;
      const rawLabelY = dotY;
      const clampedLabelY = Math.max(topMargin + labelBoxH / 2 + 4, Math.min(height - labelBoxH / 2 - 4, rawLabelY));
      return { dotX, dotY, goLeft, labelY: clampedLabelY, label: l, index: i };
    });

    const spreadLabels = (items: typeof dots, minGap: number) => {
      const sorted = [...items].sort((a, b) => a.labelY - b.labelY);
      for (let pass = 0; pass < 6; pass++) {
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1];
          const curr = sorted[i];
          if (curr.labelY - prev.labelY < minGap) {
            const mid = (prev.labelY + curr.labelY) / 2;
            prev.labelY = mid - minGap / 2;
            curr.labelY = mid + minGap / 2;
          }
        }
      }
      for (const item of sorted) {
        item.labelY = Math.max(topMargin + labelBoxH / 2 + 4, Math.min(height - labelBoxH / 2 - 4, item.labelY));
      }
      return sorted;
    }

    const leftDots = dots.filter(d => d.goLeft);
    const rightDots = dots.filter(d => !d.goLeft);
    spreadLabels(leftDots, labelBoxH + 6);
    spreadLabels(rightDots, labelBoxH + 6);
    const allDots = [...leftDots, ...rightDots];

    // For radial web: draw spokes from hub centre to each dot
    const hubR = isRadial ? Math.min(diagW, diagH) * 0.12 : 0;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Topology-aware background shape */}
        <path d={shapePath} fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="1.5" />
        {/* Inner detail hint (second smaller shape for depth) */}
        {!isChain && (
          <path d={shapePath}
            fill="none" stroke={accentColor} strokeWidth="0.6" opacity="0.18"
            transform={`scale(0.6) translate(${width * 0.33} ${height * 0.33})`} />
        )}
        {/* Radial spokes */}
        {isRadial && allDots.map(d => (
          <line key={`spoke-${d.index}`}
            x1={cx} y1={cy} x2={d.dotX} y2={d.dotY}
            stroke={accentColor} strokeWidth="1" opacity="0.25" />
        ))}
        {/* Hub circle for radial */}
        {isRadial && (
          <circle cx={cx} cy={cy} r={hubR}
            fill={accentColor} opacity="0.15" stroke={accentColor} strokeWidth="1.2" />
        )}
        {/* Chain connector lines */}
        {isChain && allDots.map((d, i) => i < allDots.length - 1 ? (
          <line key={`chain-${i}`}
            x1={d.dotX} y1={d.dotY} x2={allDots[i + 1].dotX} y2={allDots[i + 1].dotY}
            stroke={accentColor} strokeWidth="1.5" opacity="0.3" />
        ) : null)}
        {/* Callout dots and labels */}
        {allDots.map((d, i) => {
          const labelText = d.label?.text || "";
          const wrappedLines = wrapText(labelText, Math.floor((labelBoxW - 28) / (labelFontSize * 0.58)));
          const actualBoxH = Math.max(labelBoxH, wrappedLines.length * (labelFontSize + 3) + 8);
          const labelX = d.goLeft ? 0 : width - labelBoxW;
          const elbowX = d.goLeft ? diagX1 - 2 : diagX2 + 2;
          return (
            <g key={d.index}>
              <line x1={d.dotX} y1={d.dotY} x2={elbowX} y2={d.labelY}
                stroke={accentColor} strokeWidth="1.2" opacity="0.6" />
              <rect x={labelX} y={d.labelY - actualBoxH / 2}
                width={labelBoxW} height={actualBoxH} rx="4"
                fill="white" stroke={accentColor} strokeWidth="1.5" />
              <circle cx={labelX + 11} cy={d.labelY} r={dotR - 1} fill={accentColor} />
              <text x={labelX + 11} y={d.labelY} textAnchor="middle" dominantBaseline="middle"
                fontSize={labelFontSize - 1} fontFamily={fontFamily} fill="white" fontWeight="700">
                {d.index + 1}
              </text>
              {showCallouts ? (
                wrappedLines.map((line, li) => (
                  <text key={li}
                    x={labelX + 22}
                    y={d.labelY - ((wrappedLines.length - 1) * (labelFontSize + 3)) / 2 + li * (labelFontSize + 3)}
                    dominantBaseline="middle"
                    fontSize={labelFontSize} fontFamily={fontFamily} fill="#1e293b" fontWeight="500">
                    {line}
                  </text>
                ))
              ) : (
                <line
                  x1={labelX + 22} y1={d.labelY + 3}
                  x2={labelX + labelBoxW - 6} y2={d.labelY + 3}
                  stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
              )}
              <circle cx={d.dotX} cy={d.dotY} r={dotR} fill={accentColor} />
              <text x={d.dotX} y={d.dotY} textAnchor="middle" dominantBaseline="middle"
                fontSize={labelFontSize - 1} fontFamily={fontFamily} fill="white" fontWeight="700">
                {d.index + 1}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ── FLOW DIAGRAM ─────────────────────────────────────────────────────────────
  if (spec.type === "flow") {
    const steps = spec.steps || [];
    const n = steps.length;
    if (n === 0) return null;

    const flowW = Math.max(width, n * 130 + (n - 1) * 24 + 40);
    const flowH = Math.max(height, 120);
    const flowPad = 20;
    const arrowGap = 20;
    const boxW = Math.max(100, Math.min(160, (flowW - flowPad * 2 - (n - 1) * (arrowGap + 8)) / n));
    const boxH = 52;
    const totalW = n * boxW + (n - 1) * (arrowGap + 8);
    const startX = (flowW - totalW) / 2;
    const midY = flowH / 2 + (spec.title ? 8 : 0);

    const maxStepLen = Math.max(...steps.map(s => s.length));
    const flowFontSize = maxStepLen > 25 ? Math.max(7, fontSize - 3) : maxStepLen > 18 ? Math.max(8, fontSize - 2) : fontSize - 1;
    const maxCharsPerLine = Math.floor(boxW / (flowFontSize * 0.52));

    return (
      <svg viewBox={`0 0 ${flowW} ${flowH}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: flowW, display: "block", background: "white" }}>
        {spec.title && (
          <text x={flowW / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {steps.map((step, i) => {
          const bx = startX + i * (boxW + arrowGap + 8);
          const by = midY - boxH / 2;
          const textLines = wrapText(step, maxCharsPerLine);
          const lineH = flowFontSize + 3;
          const textStartY = by + boxH / 2 - ((textLines.length - 1) * lineH) / 2;
          return (
            <g key={i}>
              <rect x={bx} y={by} width={boxW} height={boxH} rx="6"
                fill={accentColor} opacity={0.85 - i * 0.03} />
              {/* Step number badge */}
              <circle cx={bx + 12} cy={by + 12} r="8" fill="white" opacity="0.3" />
              <text x={bx + 12} y={by + 12} textAnchor="middle" dominantBaseline="middle"
                fontSize={flowFontSize - 1} fontFamily={fontFamily} fill="white" fontWeight="700" opacity="0.7">
                {i + 1}
              </text>
              {textLines.map((line, li) => (
                <text key={li} x={bx + boxW / 2} y={textStartY + li * lineH}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={flowFontSize} fontFamily={fontFamily} fill="white" fontWeight="600">
                  {line}
                </text>
              ))}
              {i < n - 1 && (
                <>
                  <line x1={bx + boxW + 2} y1={midY} x2={bx + boxW + arrowGap} y2={midY}
                    stroke={accentColor} strokeWidth="2" />
                  <polygon
                    points={`${bx + boxW + arrowGap + 8},${midY} ${bx + boxW + arrowGap},${midY - 5} ${bx + boxW + arrowGap},${midY + 5}`}
                    fill={accentColor} />
                </>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ── CYCLE DIAGRAM ─────────────────────────────────────────────────────────────
  if (spec.type === "cycle") {
    const steps = spec.steps || [];
    const n = steps.length;
    if (n === 0) return null;
    const cx = width / 2;
    const cy = height / 2 + 8;
    const r = Math.min(inner_w, inner_h) * 0.36;
    // Dynamic box sizing based on longest step
    const maxStepLen = Math.max(...steps.map(s => s.length), 6);
    const cycleFontSize = maxStepLen > 22 ? Math.max(7, fontSize - 3) : maxStepLen > 15 ? Math.max(8, fontSize - 2) : fontSize - 1;
    const boxW = Math.max(80, Math.min(120, maxStepLen * 5 + 20));
    const boxH = 32;
    const maxCharsPerLine = Math.floor(boxW / (cycleFontSize * 0.52));

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="6,3" opacity="0.4" />
        {steps.map((step, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const bx = cx + r * Math.cos(angle) - boxW / 2;
          const by = cy + r * Math.sin(angle) - boxH / 2;
          const nextAngle = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
          const midAngle = (angle + nextAngle) / 2;
          const ax1 = cx + (r - 12) * Math.cos(angle + 0.3);
          const ay1 = cy + (r - 12) * Math.sin(angle + 0.3);
          const ax2 = cx + (r - 12) * Math.cos(nextAngle - 0.3);
          const ay2 = cy + (r - 12) * Math.sin(nextAngle - 0.3);
          const textLines = wrapText(step, maxCharsPerLine);
          const lineH = cycleFontSize + 2;
          const textStartY = by + boxH / 2 - ((textLines.length - 1) * lineH) / 2;
          return (
            <g key={i}>
              <rect x={bx} y={by} width={boxW} height={boxH} rx="5"
                fill={accentColor} opacity={0.8} />
              {textLines.map((line, li) => (
                <text key={li} x={bx + boxW / 2} y={textStartY + li * lineH}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={cycleFontSize} fontFamily={fontFamily} fill="white" fontWeight="600">
                  {line}
                </text>
              ))}
              <path d={`M ${ax1} ${ay1} Q ${cx + r * 0.9 * Math.cos(midAngle)} ${cy + r * 0.9 * Math.sin(midAngle)} ${ax2} ${ay2}`}
                fill="none" stroke={accentColor} strokeWidth="1.5"
                markerEnd={`url(#arrow-${i})`} opacity="0.7" />
              <defs>
                <marker id={`arrow-${i}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M 0 0 L 6 3 L 0 6 Z" fill={accentColor} opacity="0.8" />
                </marker>
              </defs>
            </g>
          );
        })}
      </svg>
    );
  }

  // ── NUMBER LINE ───────────────────────────────────────────────────────────────
  if (spec.type === "number-line") {
    const start = spec.start ?? 0;
    const end = spec.end ?? 10;
    const marked = spec.marked || [];
    const lineY = height / 2;
    const lineX1 = pad + 10;
    const lineX2 = width - pad - 10;
    const range = end - start;
    const toX = (n: number) => lineX1 + ((n - start) / range) * (lineX2 - lineX1);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        <line x1={lineX1} y1={lineY} x2={lineX2} y2={lineY} stroke="#374151" strokeWidth="2" />
        <polygon points={`${lineX2 + 8},${lineY} ${lineX2},${lineY - 4} ${lineX2},${lineY + 4}`} fill="#374151" />
        {Array.from({ length: range + 1 }, (_, i) => start + i).map((n) => {
          const x = toX(n);
          const isMarked = marked.includes(n);
          return (
            <g key={n}>
              <line x1={x} y1={lineY - 8} x2={x} y2={lineY + 8} stroke={isMarked ? accentColor : "#374151"} strokeWidth={isMarked ? 2.5 : 1.5} />
              <text x={x} y={lineY + 22} textAnchor="middle" fontSize={fontSize}
                fontFamily={fontFamily} fill={isMarked ? accentColor : "#374151"}
                fontWeight={isMarked ? "700" : "400"}>{n}</text>
              {isMarked && (
                <circle cx={x} cy={lineY} r="6" fill={accentColor} opacity="0.2" />
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ── BAR CHART ────────────────────────────────────────────────────────────────
  if (spec.type === "bar") {
    const bars = spec.bars || [];
    if (bars.length === 0) return null;
    const maxVal = Math.max(...bars.map(b => b.value), 1);
    const chartPad = { top: 28, right: 16, bottom: 40, left: 40 };
    const chartW = width - chartPad.left - chartPad.right;
    const chartH = height - chartPad.top - chartPad.bottom;
    const barW = Math.min(50, (chartW / bars.length) * 0.65);
    const gap = (chartW - bars.length * barW) / (bars.length + 1);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        <line x1={chartPad.left} y1={chartPad.top} x2={chartPad.left} y2={chartPad.top + chartH}
          stroke="#374151" strokeWidth="1.5" />
        <line x1={chartPad.left} y1={chartPad.top + chartH} x2={chartPad.left + chartW} y2={chartPad.top + chartH}
          stroke="#374151" strokeWidth="1.5" />
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const val = Math.round(maxVal * frac);
          const y = chartPad.top + chartH - frac * chartH;
          return (
            <g key={frac}>
              <line x1={chartPad.left - 4} y1={y} x2={chartPad.left} y2={y} stroke="#6b7280" strokeWidth="1" />
              <text x={chartPad.left - 6} y={y} textAnchor="end" dominantBaseline="middle"
                fontSize={fontSize - 2} fontFamily={fontFamily} fill="#6b7280">{val}</text>
            </g>
          );
        })}
        {bars.map((bar, i) => {
          const barH = (bar.value / maxVal) * chartH;
          const bx = chartPad.left + gap + i * (barW + gap);
          const by = chartPad.top + chartH - barH;
          // Dynamic label sizing
          const barLabel = bar.label || "";
          const barLabelSize = barLabel.length > 12 ? Math.max(7, fontSize - 3) : fontSize - 2;
          const barLabelLines = wrapText(barLabel, Math.floor(barW / (barLabelSize * 0.5)));
          return (
            <g key={i}>
              <rect x={bx} y={by} width={barW} height={barH} rx="3"
                fill={accentColor} opacity={0.75 + (i % 2) * 0.15} />
              <text x={bx + barW / 2} y={by - 4} textAnchor="middle"
                fontSize={fontSize - 1} fontFamily={fontFamily} fill={accentColor} fontWeight="600">{bar.value}</text>
              {barLabelLines.map((line, li) => (
                <text key={li} x={bx + barW / 2} y={chartPad.top + chartH + 14 + li * (barLabelSize + 2)} textAnchor="middle"
                  fontSize={barLabelSize} fontFamily={fontFamily} fill="#374151">
                  {line}
                </text>
              ))}
            </g>
          );
        })}
        {spec.yLabel && (
          <text x={12} y={chartPad.top + chartH / 2} textAnchor="middle"
            fontSize={fontSize - 1} fontFamily={fontFamily} fill="#6b7280"
            transform={`rotate(-90, 12, ${chartPad.top + chartH / 2})`}>{spec.yLabel}</text>
        )}
        {spec.xLabel && (
          <text x={chartPad.left + chartW / 2} y={height - 4} textAnchor="middle"
            fontSize={fontSize - 1} fontFamily={fontFamily} fill="#6b7280">{spec.xLabel}</text>
        )}
      </svg>
    );
  }

  // ── AXES (coordinate grid) ───────────────────────────────────────────────────
  if (spec.type === "axes") {
    const cx = width / 2;
    const cy = height / 2;
    const aw = inner_w / 2;
    const ah = inner_h / 2;
    const gridCount = 5;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={14} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {Array.from({ length: gridCount * 2 + 1 }, (_, i) => i - gridCount).map(n => {
          const gx = cx + n * (aw / gridCount);
          const gy = cy + n * (ah / gridCount);
          return (
            <g key={n}>
              <line x1={gx} y1={cy - ah} x2={gx} y2={cy + ah} stroke="#e5e7eb" strokeWidth="1" />
              <line x1={cx - aw} y1={gy} x2={cx + aw} y2={gy} stroke="#e5e7eb" strokeWidth="1" />
              {n !== 0 && (
                <>
                  <text x={gx} y={cy + 14} textAnchor="middle" fontSize={fontSize - 2}
                    fontFamily={fontFamily} fill="#9ca3af">{n}</text>
                  <text x={cx - 10} y={gy + 4} textAnchor="end" fontSize={fontSize - 2}
                    fontFamily={fontFamily} fill="#9ca3af">{-n}</text>
                </>
              )}
            </g>
          );
        })}
        <line x1={cx - aw - 8} y1={cy} x2={cx + aw + 8} y2={cy} stroke="#374151" strokeWidth="2" />
        <line x1={cx} y1={cy + ah + 8} x2={cx} y2={cy - ah - 8} stroke="#374151" strokeWidth="2" />
        <polygon points={`${cx + aw + 8},${cy} ${cx + aw},${cy - 4} ${cx + aw},${cy + 4}`} fill="#374151" />
        <polygon points={`${cx},${cy - ah - 8} ${cx - 4},${cy - ah} ${cx + 4},${cy - ah}`} fill="#374151" />
        <text x={cx + aw + 16} y={cy + 4} fontSize={fontSize} fontFamily={fontFamily} fill="#374151" fontStyle="italic">{spec.xLabel || "x"}</text>
        <text x={cx + 6} y={cy - ah - 12} fontSize={fontSize} fontFamily={fontFamily} fill="#374151" fontStyle="italic">{spec.yLabel || "y"}</text>
      </svg>
    );
  }

  // ── VENN DIAGRAM ─────────────────────────────────────────────────────────────
  if (spec.type === "venn") {
    const setA = spec.setA || "Set A";
    const setB = spec.setB || "Set B";
    const onlyA = spec.onlyA || [];
    const onlyB = spec.onlyB || [];
    const overlap = spec.overlap || [];
    const cx = width / 2;
    const cy = height / 2 + 8;
    const circleR = Math.min(inner_w * 0.32, inner_h * 0.38);
    const offset = circleR * 0.55;
    const itemFontSize = Math.max(7, fontSize - 2);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Circle A */}
        <circle cx={cx - offset} cy={cy} r={circleR} fill={accentColor} opacity="0.12"
          stroke={accentColor} strokeWidth="2" />
        {/* Circle B */}
        <circle cx={cx + offset} cy={cy} r={circleR} fill="#dc2626" opacity="0.10"
          stroke="#dc2626" strokeWidth="2" />
        {/* Set labels */}
        <text x={cx - offset - circleR * 0.4} y={cy - circleR - 6} textAnchor="middle"
          fontSize={fontSize} fontFamily={fontFamily} fill={accentColor} fontWeight="700">{setA}</text>
        <text x={cx + offset + circleR * 0.4} y={cy - circleR - 6} textAnchor="middle"
          fontSize={fontSize} fontFamily={fontFamily} fill="#dc2626" fontWeight="700">{setB}</text>
        {/* Only A items */}
        {showCallouts && onlyA.map((item, i) => (
          <text key={`a${i}`} x={cx - offset - circleR * 0.35} y={cy - circleR * 0.3 + i * (itemFontSize + 4)}
            textAnchor="middle" fontSize={itemFontSize} fontFamily={fontFamily} fill="#1e293b">{item}</text>
        ))}
        {/* Overlap items */}
        {showCallouts && overlap.map((item, i) => (
          <text key={`o${i}`} x={cx} y={cy - (overlap.length - 1) * (itemFontSize + 4) / 2 + i * (itemFontSize + 4)}
            textAnchor="middle" fontSize={itemFontSize} fontFamily={fontFamily} fill="#1e293b" fontWeight="600">{item}</text>
        ))}
        {/* Only B items */}
        {showCallouts && onlyB.map((item, i) => (
          <text key={`b${i}`} x={cx + offset + circleR * 0.35} y={cy - circleR * 0.3 + i * (itemFontSize + 4)}
            textAnchor="middle" fontSize={itemFontSize} fontFamily={fontFamily} fill="#1e293b">{item}</text>
        ))}
        {/* Blank lines for student view */}
        {!showCallouts && (
          <>
            {[0, 1, 2].map(i => (
              <line key={`la${i}`} x1={cx - offset - circleR * 0.55} y1={cy - 15 + i * 18}
                x2={cx - offset - circleR * 0.15} y2={cy - 15 + i * 18}
                stroke="#d1d5db" strokeWidth="1" strokeDasharray="3,2" />
            ))}
            {[0, 1].map(i => (
              <line key={`lo${i}`} x1={cx - 20} y1={cy - 8 + i * 18}
                x2={cx + 20} y2={cy - 8 + i * 18}
                stroke="#d1d5db" strokeWidth="1" strokeDasharray="3,2" />
            ))}
            {[0, 1, 2].map(i => (
              <line key={`lb${i}`} x1={cx + offset + circleR * 0.15} y1={cy - 15 + i * 18}
                x2={cx + offset + circleR * 0.55} y2={cy - 15 + i * 18}
                stroke="#d1d5db" strokeWidth="1" strokeDasharray="3,2" />
            ))}
          </>
        )}
      </svg>
    );
  }

  // ── TIMELINE DIAGRAM ─────────────────────────────────────────────────────────
  if (spec.type === "timeline") {
    const events = spec.events || [];
    const n = events.length;
    if (n === 0) return null;
    const timelineH = Math.max(height, 140);
    const timelineW = Math.max(width, n * 100 + 60);
    const lineY = timelineH * 0.5;
    const lineX1 = 30;
    const lineX2 = timelineW - 30;
    const eventSpacing = (lineX2 - lineX1) / (n - 1 || 1);
    const eventFontSize = Math.max(7, fontSize - 2);

    return (
      <svg viewBox={`0 0 ${timelineW} ${timelineH}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: timelineW, display: "block", background: "white" }}>
        {spec.title && (
          <text x={timelineW / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Main timeline line */}
        <line x1={lineX1} y1={lineY} x2={lineX2} y2={lineY} stroke={accentColor} strokeWidth="2.5" />
        <polygon points={`${lineX2 + 8},${lineY} ${lineX2},${lineY - 5} ${lineX2},${lineY + 5}`} fill={accentColor} />
        {/* Events */}
        {events.map((event, i) => {
          const ex = lineX1 + i * eventSpacing;
          const above = i % 2 === 0;
          const dateY = above ? lineY - 28 : lineY + 36;
          const labelY = above ? lineY - 44 : lineY + 52;
          const tickEnd = above ? lineY - 18 : lineY + 18;
          const dateLines = wrapText(event.date || "", 12);
          const labelLines = wrapText(event.label || "", 14);
          return (
            <g key={i}>
              {/* Tick mark */}
              <line x1={ex} y1={lineY} x2={ex} y2={tickEnd} stroke={accentColor} strokeWidth="1.5" />
              <circle cx={ex} cy={lineY} r="4" fill={accentColor} />
              {/* Date */}
              {dateLines.map((dl, di) => (
                <text key={`d${di}`} x={ex} y={dateY + di * (eventFontSize + 2)} textAnchor="middle"
                  fontSize={eventFontSize} fontFamily={fontFamily} fill={accentColor} fontWeight="700">{dl}</text>
              ))}
              {/* Label — hidden for students */}
              {showCallouts && labelLines.map((ll, li) => (
                <text key={`l${li}`} x={ex} y={labelY + li * (eventFontSize + 2)} textAnchor="middle"
                  fontSize={eventFontSize} fontFamily={fontFamily} fill="#374151">{ll}</text>
              ))}
              {!showCallouts && (
                <text x={ex} y={labelY} textAnchor="middle"
                  fontSize={eventFontSize + 1} fontFamily={fontFamily} fill={accentColor} fontWeight="700">{i + 1}</text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ── PYRAMID DIAGRAM ──────────────────────────────────────────────────────────
  if (spec.type === "pyramid") {
    const levels = spec.levels || [];
    const n = levels.length;
    if (n === 0) return null;
    const pyrW = width;
    const pyrH = Math.max(height, n * 36 + 40);
    const topX = pyrW / 2;
    const topY = 30;
    const baseW = pyrW * 0.85;
    const totalH = pyrH - 50;
    const levelH = totalH / n;
    const pyrFontSize = Math.max(8, fontSize - 1);

    return (
      <svg viewBox={`0 0 ${pyrW} ${pyrH}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: pyrW, display: "block", background: "white" }}>
        {spec.title && (
          <text x={pyrW / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {levels.map((level, i) => {
          const y = topY + i * levelH;
          const widthFrac = (i + 0.5) / n;
          const nextWidthFrac = (i + 1.5) / n;
          const topW = baseW * widthFrac;
          const botW = baseW * Math.min(nextWidthFrac, 1);
          const opacity = 0.9 - i * (0.4 / n);
          const textLines = wrapText(level, Math.floor(botW / (pyrFontSize * 0.55)));
          const lineH = pyrFontSize + 2;
          const textMidY = y + levelH / 2;
          return (
            <g key={i}>
              {/* Trapezoid shape */}
              <polygon
                points={`${topX - topW / 2},${y} ${topX + topW / 2},${y} ${topX + botW / 2},${y + levelH} ${topX - botW / 2},${y + levelH}`}
                fill={accentColor} opacity={opacity}
                stroke="white" strokeWidth="2" />
              {/* Level number */}
              <text x={topX - botW / 2 - 16} y={textMidY + 4} textAnchor="middle"
                fontSize={pyrFontSize - 1} fontFamily={fontFamily} fill={accentColor} fontWeight="700">{i + 1}</text>
              {/* Label — hidden for students */}
              {showCallouts && textLines.map((line, li) => (
                <text key={li} x={topX} y={textMidY - ((textLines.length - 1) * lineH) / 2 + li * lineH}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={pyrFontSize} fontFamily={fontFamily} fill="white" fontWeight="600">{line}</text>
              ))}
              {!showCallouts && (
                <text x={topX} y={textMidY} textAnchor="middle" dominantBaseline="middle"
                  fontSize={pyrFontSize + 2} fontFamily={fontFamily} fill="white" fontWeight="700">?</text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ── FRACTION BAR DIAGRAM ─────────────────────────────────────────────────────
  if (spec.type === "fraction-bar") {
    const denom = spec.denominator || 4;
    const numer = spec.numerator ?? 1;
    const label = spec.fractionLabel || `${numer}/${denom}`;
    const barX = pad + 10;
    const barY = height / 2 - 16;
    const barW = width - pad * 2 - 20;
    const barH = 32;
    const segW = barW / denom;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Fraction label */}
        <text x={width / 2} y={barY - 8} textAnchor="middle"
          fontSize={fontSize + 2} fontFamily={fontFamily} fill={accentColor} fontWeight="700">{label}</text>
        {/* Bar segments */}
        {Array.from({ length: denom }, (_, i) => {
          const sx = barX + i * segW;
          const filled = i < numer;
          return (
            <g key={i}>
              <rect x={sx} y={barY} width={segW} height={barH} rx="2"
                fill={filled ? accentColor : "#f1f5f9"}
                stroke={accentColor} strokeWidth="1.5" opacity={filled ? 0.8 : 1} />
              <text x={sx + segW / 2} y={barY + barH + 16} textAnchor="middle"
                fontSize={fontSize - 2} fontFamily={fontFamily} fill="#6b7280">
                {`1/${denom}`}
              </text>
            </g>
          );
        })}
        {/* Whole bar outline */}
        <rect x={barX} y={barY} width={barW} height={barH} rx="2"
          fill="none" stroke={accentColor} strokeWidth="2" />
      </svg>
    );
  }

  return null;
}
