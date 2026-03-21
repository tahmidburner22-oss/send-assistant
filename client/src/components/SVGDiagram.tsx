/**
 * SVGDiagram — client-side educational diagram renderer.
 * Zero API cost: the AI outputs structured JSON describing the diagram,
 * this component renders it as clean, labelled SVG.
 *
 * Supports: labeled diagrams, flow charts, cycle diagrams, number lines,
 * bar charts, coordinate axes, and simple geometric shapes.
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
}

const DEFAULT_ACCENT = "#4f46e5";

/**
 * Draw a connection line from a label position to the centre of the shape.
 * We use a short tick line rather than a long arrow to avoid overlaps.
 */
function LabelWithLine({
  text, x, y, cx, cy, fontSize, fontFamily, accentColor, anchor = "start"
}: {
  text: string; x: number; y: number; cx: number; cy: number;
  fontSize: number; fontFamily: string; accentColor: string; anchor?: string;
}) {
  // Line from label position to a point 30% of the way toward the centre
  const lx = x + (cx - x) * 0.30;
  const ly = y + (cy - y) * 0.30;
  // Determine text offset based on which side of centre
  const textX = x + (x < cx ? -6 : 6);

  return (
    <g>
      <line x1={textX} y1={y} x2={lx} y2={ly}
        stroke={accentColor} strokeWidth="1" strokeDasharray="3,2" opacity="0.7" />
      <circle cx={lx} cy={ly} r="2" fill={accentColor} opacity="0.8" />
      <text
        x={textX}
        y={y}
        textAnchor={x < cx ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill="#1f2937"
        fontWeight="500"
      >
        {text}
      </text>
    </g>
  );
}

export default function SVGDiagram({
  spec,
  width = 420,
  height = 240,
  fontFamily = "Arial, sans-serif",
  fontSize = 11,
  accentColor = DEFAULT_ACCENT,
}: SVGDiagramProps) {

  const pad = 16;
  const inner_w = width - pad * 2;
  const inner_h = height - pad * 2;

  // ── LABELED DIAGRAM ──────────────────────────────────────────────────────────
  if (spec.type === "labeled") {
    const cx = width / 2;
    const cy = (height - 30) / 2 + 20; // centre, leaving room for title
    const rx = inner_w * 0.28;
    const ry = inner_h * 0.34;
    const labels = spec.labels || [];

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fafafa" }}>
        {/* Title */}
        {spec.title && (
          <text x={width / 2} y={14} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Central shape */}
        {spec.shape === "rectangle" ? (
          <rect x={cx - rx} y={cy - ry} width={rx * 2} height={ry * 2}
            rx="6" fill="#eff6ff" stroke={accentColor} strokeWidth="2" />
        ) : spec.shape === "triangle" ? (
          <polygon
            points={`${cx},${cy - ry} ${cx - rx},${cy + ry} ${cx + rx},${cy + ry}`}
            fill="#eff6ff" stroke={accentColor} strokeWidth="2" />
        ) : (
          // Default: ellipse/circle
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
            fill="#eff6ff" stroke={accentColor} strokeWidth="2" />
        )}
        {/* Labels with tick lines */}
        {labels.map((label, i) => {
          const lx = pad + (label.x / 100) * (width - pad * 2);
          const ly = 22 + (label.y / 100) * (height - 38);
          return (
            <LabelWithLine key={i} text={label.text} x={lx} y={ly}
              cx={cx} cy={cy} fontSize={fontSize} fontFamily={fontFamily}
              accentColor={accentColor} anchor={label.anchor} />
          );
        })}
        {/* "Label the diagram" instruction */}
        <text x={cx} y={height - 6} textAnchor="middle" fontSize={fontSize - 1}
          fontFamily={fontFamily} fill="#9ca3af" fontStyle="italic">
          Refer to this diagram to answer the questions above
        </text>
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
        style={{ width: "100%", maxWidth: width, display: "block", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fafafa" }}>
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
        style={{ width: "100%", maxWidth: width, display: "block", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fafafa" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Circle path */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="6,3" opacity="0.4" />
        {steps.map((step, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const bx = cx + r * Math.cos(angle) - boxW / 2;
          const by = cy + r * Math.sin(angle) - boxH / 2;
          // Arrow to next
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
        style={{ width: "100%", maxWidth: width, display: "block", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fafafa" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Main line */}
        <line x1={lineX1} y1={lineY} x2={lineX2} y2={lineY} stroke="#374151" strokeWidth="2" />
        {/* Arrow ends */}
        <polygon points={`${lineX2 + 8},${lineY} ${lineX2},${lineY - 4} ${lineX2},${lineY + 4}`} fill="#374151" />
        {/* Tick marks and numbers */}
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
        style={{ width: "100%", maxWidth: width, display: "block", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fafafa" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Axes */}
        <line x1={chartPad.left} y1={chartPad.top} x2={chartPad.left} y2={chartPad.top + chartH}
          stroke="#374151" strokeWidth="1.5" />
        <line x1={chartPad.left} y1={chartPad.top + chartH} x2={chartPad.left + chartW} y2={chartPad.top + chartH}
          stroke="#374151" strokeWidth="1.5" />
        {/* Y axis labels */}
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
        {/* Bars */}
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
        {/* Axis labels */}
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
        style={{ width: "100%", maxWidth: width, display: "block", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fafafa" }}>
        {spec.title && (
          <text x={width / 2} y={14} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Grid lines */}
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
        {/* Axes */}
        <line x1={cx - aw - 8} y1={cy} x2={cx + aw + 8} y2={cy} stroke="#374151" strokeWidth="2" />
        <line x1={cx} y1={cy + ah + 8} x2={cx} y2={cy - ah - 8} stroke="#374151" strokeWidth="2" />
        {/* Arrows */}
        <polygon points={`${cx + aw + 8},${cy} ${cx + aw},${cy - 4} ${cx + aw},${cy + 4}`} fill="#374151" />
        <polygon points={`${cx},${cy - ah - 8} ${cx - 4},${cy - ah} ${cx + 4},${cy - ah}`} fill="#374151" />
        {/* Axis labels */}
        <text x={cx + aw + 16} y={cy + 4} fontSize={fontSize} fontFamily={fontFamily} fill="#374151" fontStyle="italic">{spec.xLabel || "x"}</text>
        <text x={cx + 6} y={cy - ah - 12} fontSize={fontSize} fontFamily={fontFamily} fill="#374151" fontStyle="italic">{spec.yLabel || "y"}</text>
      </svg>
    );
  }

  return null;
}
