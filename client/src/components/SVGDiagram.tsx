/**
 * SVGDiagram — client-side educational diagram renderer.
 * Zero API cost: the AI outputs structured JSON describing the diagram,
 * this component renders it as clean SVG.
 *
 * Chalkie-style: diagrams are pure visuals — NO text labels on the diagram.
 * Numbered callout dots are used for labelling questions.
 *
 * Supports: circuit, labeled, flow, cycle, number-line, bar, axes
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
  /** When true, show callout numbers on diagram (for label-diagram questions) */
  showCallouts?: boolean;
}

const NAVY = "#1B2A4A";
const WIRE_COLOR = "#1e293b";
const WIRE_W = 2;

// ── Circuit symbol renderers (coordinate-based, no text) ─────────────────────

/** Battery: two parallel lines (long+short) */
function Battery({ x, y, size = 28 }: { x: number; y: number; size?: number }) {
  const h = size * 0.7;
  return (
    <g>
      {/* Long line (positive) */}
      <line x1={x} y1={y - h / 2} x2={x} y2={y + h / 2} stroke={WIRE_COLOR} strokeWidth={WIRE_W + 1} />
      {/* Short line (negative) */}
      <line x1={x + 8} y1={y - h * 0.35} x2={x + 8} y2={y + h * 0.35} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      {/* + and - symbols */}
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
      {/* Left wire stub */}
      <line x1={x - w / 2} y1={y} x2={pivotX} y2={pivotY} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      {/* Pivot dot */}
      <circle cx={pivotX} cy={pivotY} r={2.5} fill={WIRE_COLOR} />
      {/* Lever */}
      <line x1={pivotX} y1={pivotY} x2={endX} y2={endY} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      {/* Right wire stub */}
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      {/* Right contact dot */}
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

/**
 * Simple series circuit: battery → switch → bulb → resistor → back
 * Returns SVG elements only (no outer <svg>)
 */
function SeriesCircuit({ w, h, callouts }: { w: number; h: number; callouts?: Array<{ x: number; y: number; n: number; accent: string }> }) {
  const pad = 40;
  const x1 = pad, y1 = pad;
  const x2 = w - pad, y2 = h - pad;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Wire corners
  const corners = [
    [x1, y1], [x2, y1], [x2, y2], [x1, y2],
  ];

  // Component positions (on the wire path)
  const battX = x1, battY = midY;           // left side, middle
  const switchX = midX, switchY = y1;       // top, middle
  const bulbX = x2, bulbY = midY;           // right side, middle
  const resistorX = midX, resistorY = y2;   // bottom, middle

  return (
    <g>
      {/* Outer wire rectangle */}
      <polyline
        points={`${x1},${y1} ${x2},${y1} ${x2},${y2} ${x1},${y2} ${x1},${y1}`}
        fill="none" stroke={WIRE_COLOR} strokeWidth={WIRE_W}
        strokeLinejoin="round"
      />
      {/* Components — drawn over wire */}
      {/* Battery on left side (vertical) */}
      <line x1={x1} y1={y1} x2={x1} y2={battY - 18} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Battery x={x1} y={battY} size={32} />
      <line x1={x1} y1={battY + 18} x2={x1} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />

      {/* Switch on top */}
      <line x1={x1} y1={y1} x2={switchX - 18} y2={y1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Switch x={switchX} y={y1} open={true} />
      <line x1={switchX + 18} y1={y1} x2={x2} y2={y1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />

      {/* Bulb on right side (vertical) */}
      <line x1={x2} y1={y1} x2={x2} y2={bulbY - 14} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Bulb x={x2} y={bulbY} r={13} />
      <line x1={x2} y1={bulbY + 14} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />

      {/* Resistor on bottom */}
      <line x1={x1} y1={y2} x2={resistorX - 18} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Resistor x={resistorX} y={y2} w={36} h={16} />
      <line x1={resistorX + 18} y1={y2} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />

      {/* Callout dots */}
      {callouts?.map((c, i) => (
        <CalloutDot key={i} x={c.x} y={c.y} n={c.n} accent={c.accent} />
      ))}
    </g>
  );
}

/**
 * Parallel circuit: battery on left, two parallel branches (bulb + resistor)
 */
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
      {/* Main outer wire */}
      <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x2} y1={y1} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y2} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y1} x2={x1} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />

      {/* Battery on left */}
      <line x1={x1} y1={y1} x2={x1} y2={midY - 18} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Battery x={x1} y={midY} size={32} />
      <line x1={x1} y1={midY + 18} x2={x1} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />

      {/* Junction lines */}
      <line x1={junctionX} y1={y1} x2={junctionX} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={junctionX} y1={branchY2} x2={junctionX} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={junctionX2} y1={y1} x2={junctionX2} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={junctionX2} y1={branchY2} x2={junctionX2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />

      {/* Branch 1 (top): bulb */}
      <line x1={junctionX} y1={branchY1} x2={midX - 14} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Bulb x={midX} y={branchY1} r={12} />
      <line x1={midX + 14} y1={branchY1} x2={junctionX2} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />

      {/* Branch 2 (bottom): resistor */}
      <line x1={junctionX} y1={branchY2} x2={midX - 18} y2={branchY2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Resistor x={midX} y={branchY2} w={36} h={16} />
      <line x1={midX + 18} y1={branchY2} x2={junctionX2} y2={branchY2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />

      {/* Junction dots */}
      <circle cx={junctionX} cy={y1} r={3} fill={WIRE_COLOR} />
      <circle cx={junctionX} cy={y2} r={3} fill={WIRE_COLOR} />
      <circle cx={junctionX2} cy={y1} r={3} fill={WIRE_COLOR} />
      <circle cx={junctionX2} cy={y2} r={3} fill={WIRE_COLOR} />

      {/* Callout dots */}
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
    // Build callout positions from label x/y percentages
    const callouts = showCallouts ? labels.map((l, i) => ({
      x: pad + (l.x / 100) * (width - pad * 2),
      y: pad + (l.y / 100) * (height - pad * 2),
      n: i + 1,
      accent: accentColor,
    })) : [];

    // Choose circuit layout based on spec.layout hint
    const layout = (spec as any).layout || "series";

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {layout === "parallel"
          ? <ParallelCircuit w={width} h={height} callouts={callouts} />
          : <SeriesCircuit w={width} h={height} callouts={callouts} />
        }
      </svg>
    );
  }

  // ── LABELED / SPIDER DIAGRAM — renders as a mind-map with numbered nodes ──────
  if (spec.type === "labeled") {
    const labels = spec.labels || [];
    const n = labels.length;
    const cx = width / 2;
    const cy = height / 2 + 4;
    // Central hub radius
    const hubR = Math.min(inner_w, inner_h) * 0.18;
    // Spoke radius — distance from centre to node centres
    const spokeR = Math.min(inner_w, inner_h) * 0.38;
    // Node box dimensions
    const nodeW = 72;
    const nodeH = 26;

    // Distribute nodes evenly around the circle, starting from top
    const angleStep = n > 0 ? (2 * Math.PI) / n : 0;
    const nodePositions = labels.map((_, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      return {
        x: cx + spokeR * Math.cos(angle),
        y: cy + spokeR * Math.sin(angle),
        angle,
      };
    });

    // Central topic text — use spec.title or first label text as the hub label
    const hubText = spec.title || "Topic";
    // Wrap hub text to 2 lines if long
    const hubWords = hubText.split(" ");
    const hubLine1 = hubWords.slice(0, Math.ceil(hubWords.length / 2)).join(" ");
    const hubLine2 = hubWords.slice(Math.ceil(hubWords.length / 2)).join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {/* Spokes from hub to nodes */}
        {nodePositions.map((pos, i) => {
          // Spoke starts at hub edge, ends at node edge
          const dx = pos.x - cx;
          const dy = pos.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / dist;
          const uy = dy / dist;
          const x1 = cx + ux * hubR;
          const y1 = cy + uy * hubR;
          const x2 = pos.x - ux * (nodeW / 2 + 2);
          const y2 = pos.y - uy * (nodeH / 2 + 2);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={accentColor} strokeWidth="1.5" opacity="0.55" />
          );
        })}
        {/* Central hub */}
        <ellipse cx={cx} cy={cy} rx={hubR} ry={hubR * 0.72}
          fill={accentColor} opacity="0.92" />
        <text x={cx} y={cy - (hubLine2 ? 5 : 0)} textAnchor="middle" dominantBaseline="middle"
          fontSize={fontSize - 1} fontFamily={fontFamily} fill="white" fontWeight="700">
          {hubLine1}
        </text>
        {hubLine2 && (
          <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle"
            fontSize={fontSize - 1} fontFamily={fontFamily} fill="white" fontWeight="700">
            {hubLine2}
          </text>
        )}
        {/* Node boxes with numbered callout */}
        {nodePositions.map((pos, i) => {
          const label = labels[i];
          const labelText = label?.text || "";
          // Truncate long labels
          const displayText = labelText.length > 14 ? labelText.slice(0, 13) + "…" : labelText;
          return (
            <g key={i}>
              {/* Node rectangle */}
              <rect x={pos.x - nodeW / 2} y={pos.y - nodeH / 2}
                width={nodeW} height={nodeH} rx="5"
                fill={showCallouts ? "#f8fafc" : "#f8fafc"}
                stroke={accentColor} strokeWidth="1.5" />
              {/* Number badge */}
              <circle cx={pos.x - nodeW / 2 + 10} cy={pos.y} r="8"
                fill={accentColor} />
              <text x={pos.x - nodeW / 2 + 10} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={fontSize - 2} fontFamily={fontFamily} fill="white" fontWeight="700">
                {i + 1}
              </text>
              {/* Label text — hidden in student view (showCallouts=false means student) */}
              <text x={pos.x + 4} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={fontSize - 1} fontFamily={fontFamily}
                fill={showCallouts ? "#1e293b" : "transparent"}>
                {displayText}
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
    const boxW = Math.min(140, (inner_w - (n - 1) * 20) / n);
    const boxH = 36;
    const totalW = n * boxW + (n - 1) * 28;
    const startX = (width - totalW) / 2;
    const midY = height / 2;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {steps.map((step, i) => {
          const bx = startX + i * (boxW + 28);
          const by = midY - boxH / 2;
          const textLines = step.length > 20 ? [step.slice(0, 20), step.slice(20)] : [step];
          return (
            <g key={i}>
              <rect x={bx} y={by} width={boxW} height={boxH} rx="5"
                fill={accentColor} opacity={0.85 - i * 0.07} />
              {textLines.map((line, li) => (
                <text key={li} x={bx + boxW / 2} y={by + boxH / 2 + (li - (textLines.length - 1) / 2) * (fontSize + 2)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={fontSize - 1} fontFamily={fontFamily} fill="white" fontWeight="600">
                  {line}
                </text>
              ))}
              {i < n - 1 && (
                <>
                  <line x1={bx + boxW} y1={midY} x2={bx + boxW + 20} y2={midY}
                    stroke={accentColor} strokeWidth="2" />
                  <polygon
                    points={`${bx + boxW + 28},${midY} ${bx + boxW + 20},${midY - 5} ${bx + boxW + 20},${midY + 5}`}
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
    const boxW = 90; const boxH = 30;

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
          return (
            <g key={i}>
              <rect x={bx} y={by} width={boxW} height={boxH} rx="5"
                fill={accentColor} opacity={0.8} />
              <text x={bx + boxW / 2} y={by + boxH / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={fontSize - 1} fontFamily={fontFamily} fill="white" fontWeight="600">
                {step.length > 18 ? step.slice(0, 18) + "…" : step}
              </text>
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
          return (
            <g key={i}>
              <rect x={bx} y={by} width={barW} height={barH} rx="3"
                fill={accentColor} opacity={0.75 + (i % 2) * 0.15} />
              <text x={bx + barW / 2} y={by - 4} textAnchor="middle"
                fontSize={fontSize - 1} fontFamily={fontFamily} fill={accentColor} fontWeight="600">{bar.value}</text>
              <text x={bx + barW / 2} y={chartPad.top + chartH + 14} textAnchor="middle"
                fontSize={fontSize - 2} fontFamily={fontFamily} fill="#374151">
                {bar.label.length > 10 ? bar.label.slice(0, 10) + "…" : bar.label}
              </text>
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

  return null;
}
