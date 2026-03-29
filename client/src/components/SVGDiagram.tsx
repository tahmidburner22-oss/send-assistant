/**
 * SVGDiagram — Template-based educational diagram renderer.
 * All diagrams come from a predefined template library — no free-form AI drawing.
 * Chalkie.ai style: clean pre-drawn shapes + callout lines + blank label boxes.
 * No numbers anywhere on diagrams. Student view = blank label boxes.
 * Teacher view (showCallouts=true) = filled label text.
 *
 * PRIMARY: number-line, bar-model, place-value, part-whole, fraction-circle,
 *          fraction-bar, shapes-2d3d, coordinate-grid, pictogram, tally,
 *          plant, food-chain, human-body-basic, life-cycle, particles,
 *          circuit-simple, forces-simple, map-simple, water-cycle, compass,
 *          weather, river-flow, story-map, sentence-structure, word-family, timeline
 *
 * SECONDARY: circuit, force, energy-transfer, wave, ray, motion-graph,
 *            field, density, cell, organ-system, enzyme, dna, food-web,
 *            gas-exchange, circulatory, microscopy, particle-model, atom,
 *            bonding, reaction-profile, electrolysis, separation,
 *            graph (linear/quadratic), geometry, transformation, venn,
 *            tree-diagram, histogram, box-plot, climate-graph, tectonic,
 *            river-profile, population-pyramid, map-skills, timeline,
 *            cause-effect, event-flow
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
  showCallouts?: boolean;
}

const NAVY = "#1B2A4A";
const WIRE_COLOR = "#1e293b";
const WIRE_W = 2;

// ── Word-wrap helper ──────────────────────────────────────────────────────────
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

// ── Circuit symbols ───────────────────────────────────────────────────────────
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
function Resistor({ x, y, w = 32, h = 14 }: { x: number; y: number; w?: number; h?: number }) {
  return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="white" stroke={WIRE_COLOR} strokeWidth={WIRE_W} />;
}
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
function Ammeter({ x, y, r = 12 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="white" stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={WIRE_COLOR} fontWeight="700">A</text>
    </g>
  );
}
function Voltmeter({ x, y, r = 12 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="white" stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={WIRE_COLOR} fontWeight="700">V</text>
    </g>
  );
}
function SwitchSymbol({ x, y }: { x: number; y: number }) {
  const w = 28;
  const pivotX = x - w / 2 + 4;
  return (
    <g>
      <line x1={x - w / 2} y1={y} x2={pivotX} y2={y} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <circle cx={pivotX} cy={y} r={2.5} fill={WIRE_COLOR} />
      <line x1={pivotX} y1={y} x2={x + w / 2 - 4} y2={y - 10} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <circle cx={x + w / 2 - 4} cy={y} r={2.5} fill={WIRE_COLOR} />
    </g>
  );
}

// ── Circuit layouts ───────────────────────────────────────────────────────────
function SeriesCircuit({ w, h }: { w: number; h: number }) {
  const pad = 40, x1 = pad, y1 = pad, x2 = w - pad, y2 = h - pad;
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
  return (
    <g>
      <polyline points={`${x1},${y1} ${x2},${y1} ${x2},${y2} ${x1},${y2} ${x1},${y1}`}
        fill="none" stroke={WIRE_COLOR} strokeWidth={WIRE_W} strokeLinejoin="round" />
      <line x1={x1} y1={y1} x2={x1} y2={midY - 18} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Battery x={x1} y={midY} size={32} />
      <line x1={x1} y1={midY + 18} x2={x1} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y1} x2={midX - 18} y2={y1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <SwitchSymbol x={midX} y={y1} />
      <line x1={midX + 18} y1={y1} x2={x2} y2={y1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x2} y1={y1} x2={x2} y2={midY - 14} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Bulb x={x2} y={midY} r={13} />
      <line x1={x2} y1={midY + 14} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y2} x2={midX - 18} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Resistor x={midX} y={y2} w={36} h={16} />
      <line x1={midX + 18} y1={y2} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
    </g>
  );
}
function ParallelCircuit({ w, h }: { w: number; h: number }) {
  const pad = 40, x1 = pad, y1 = pad, x2 = w - pad, y2 = h - pad;
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
  const branchY1 = y1 + (y2 - y1) * 0.3, branchY2 = y1 + (y2 - y1) * 0.7;
  const jX = x1 + (x2 - x1) * 0.3, jX2 = x1 + (x2 - x1) * 0.75;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x2} y1={y1} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y2} x2={x2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y1} x2={x1} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={x1} y1={y1} x2={x1} y2={midY - 18} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Battery x={x1} y={midY} size={32} />
      <line x1={x1} y1={midY + 18} x2={x1} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={jX} y1={y1} x2={jX} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={jX} y1={branchY2} x2={jX} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={jX2} y1={y1} x2={jX2} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={jX2} y1={branchY2} x2={jX2} y2={y2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={jX} y1={branchY1} x2={midX - 14} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Bulb x={midX} y={branchY1} r={12} />
      <line x1={midX + 14} y1={branchY1} x2={jX2} y2={branchY1} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <line x1={jX} y1={branchY2} x2={midX - 18} y2={branchY2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <Resistor x={midX} y={branchY2} w={36} h={16} />
      <line x1={midX + 18} y1={branchY2} x2={jX2} y2={branchY2} stroke={WIRE_COLOR} strokeWidth={WIRE_W} />
      <circle cx={jX} cy={y1} r={3} fill={WIRE_COLOR} />
      <circle cx={jX} cy={y2} r={3} fill={WIRE_COLOR} />
      <circle cx={jX2} cy={y1} r={3} fill={WIRE_COLOR} />
      <circle cx={jX2} cy={y2} r={3} fill={WIRE_COLOR} />
    </g>
  );
}

// ── Template-based labeled diagram shapes ────────────────────────────────────
interface LabeledTemplate {
  shape: React.ReactElement;
  anchors: Array<{ x: number; y: number }>;
}

function detectDiagramTemplate(title: string, w: number, h: number, accent: string): LabeledTemplate {
  const t = (title || "").toLowerCase();
  const cx = w / 2, cy = h / 2;

  // ── Animal Cell ────────────────────────────────────────────────────────────
  if (/animal.cell|cell.*animal/.test(t)) {
    return {
      shape: (
        <g>
          <ellipse cx={cx} cy={cy} rx={w * 0.30} ry={h * 0.35} fill="#fef9c3" stroke={accent} strokeWidth="2.5" />
          <ellipse cx={cx - w * 0.05} cy={cy - h * 0.05} rx={w * 0.09} ry={h * 0.10} fill="#bfdbfe" stroke={accent} strokeWidth="1.8" />
          <circle cx={cx - w * 0.05} cy={cy - h * 0.05} r={w * 0.03} fill={accent} opacity={0.5} />
          <ellipse cx={cx + w * 0.14} cy={cy + h * 0.08} rx={w * 0.06} ry={h * 0.04} fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx - w * 0.12} cy={cy + h * 0.12} rx={w * 0.05} ry={h * 0.06} fill="#e0f2fe" stroke={accent} strokeWidth="1.5" />
          <circle cx={cx + w * 0.08} cy={cy - h * 0.15} r={3} fill={accent} opacity={0.6} />
          <circle cx={cx + w * 0.12} cy={cy - h * 0.10} r={3} fill={accent} opacity={0.6} />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.35 },
        { x: cx - w * 0.05, y: cy - h * 0.15 },
        { x: cx - w * 0.05, y: cy - h * 0.05 },
        { x: cx + w * 0.20, y: cy + h * 0.08 },
        { x: cx - w * 0.12, y: cy + h * 0.18 },
        { x: cx + w * 0.10, y: cy - h * 0.12 },
      ],
    };
  }

  // ── Plant Cell ─────────────────────────────────────────────────────────────
  if (/plant.cell|cell.*plant/.test(t)) {
    return {
      shape: (
        <g>
          <rect x={cx - w * 0.30} y={cy - h * 0.35} width={w * 0.60} height={h * 0.70} rx="6" fill="none" stroke={accent} strokeWidth="3.5" />
          <rect x={cx - w * 0.27} y={cy - h * 0.32} width={w * 0.54} height={h * 0.64} rx="4" fill="#f0fdf4" stroke={accent} strokeWidth="1.5" />
          <rect x={cx - w * 0.12} y={cy - h * 0.15} width={w * 0.24} height={h * 0.30} rx="4" fill="#e0f2fe" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx - w * 0.15} cy={cy - h * 0.18} rx={w * 0.08} ry={h * 0.09} fill="#bfdbfe" stroke={accent} strokeWidth="1.8" />
          <ellipse cx={cx + w * 0.16} cy={cy - h * 0.20} rx={w * 0.05} ry={h * 0.04} fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx + w * 0.18} cy={cy + h * 0.05} rx={w * 0.05} ry={h * 0.04} fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx - w * 0.20} cy={cy + h * 0.15} rx={w * 0.05} ry={h * 0.03} fill="#fde68a" stroke={accent} strokeWidth="1.2" />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.30, y: cy },
        { x: cx - w * 0.27, y: cy + h * 0.10 },
        { x: cx, y: cy },
        { x: cx - w * 0.15, y: cy - h * 0.27 },
        { x: cx + w * 0.21, y: cy - h * 0.20 },
        { x: cx - w * 0.25, y: cy + h * 0.15 },
      ],
    };
  }

  // ── Heart ──────────────────────────────────────────────────────────────────
  if (/heart|circulatory/.test(t)) {
    return {
      shape: (
        <g>
          <path d={`M ${cx} ${cy + h * 0.25}
            C ${cx - w * 0.35} ${cy + h * 0.05} ${cx - w * 0.42} ${cy - h * 0.20} ${cx - w * 0.22} ${cy - h * 0.28}
            C ${cx - w * 0.08} ${cy - h * 0.34} ${cx} ${cy - h * 0.18} ${cx} ${cy - h * 0.10}
            C ${cx} ${cy - h * 0.18} ${cx + w * 0.08} ${cy - h * 0.34} ${cx + w * 0.22} ${cy - h * 0.28}
            C ${cx + w * 0.42} ${cy - h * 0.20} ${cx + w * 0.35} ${cy + h * 0.05} ${cx} ${cy + h * 0.25} Z`}
            fill="#fecaca" stroke={accent} strokeWidth="2.5" />
          <ellipse cx={cx - w * 0.14} cy={cy - h * 0.10} rx={w * 0.10} ry={h * 0.12} fill="#fca5a5" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx + w * 0.14} cy={cy - h * 0.10} rx={w * 0.10} ry={h * 0.12} fill="#f87171" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx - w * 0.10} cy={cy + h * 0.08} rx={w * 0.09} ry={h * 0.13} fill="#fca5a5" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx + w * 0.10} cy={cy + h * 0.08} rx={w * 0.09} ry={h * 0.13} fill="#ef4444" stroke={accent} strokeWidth="1.5" />
          <path d={`M ${cx + w * 0.05} ${cy - h * 0.22} Q ${cx + w * 0.18} ${cy - h * 0.38} ${cx + w * 0.22} ${cy - h * 0.30}`}
            fill="none" stroke={accent} strokeWidth="3" />
          <line x1={cx} y1={cy - h * 0.22} x2={cx} y2={cy + h * 0.20} stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.14, y: cy - h * 0.22 },
        { x: cx + w * 0.14, y: cy - h * 0.22 },
        { x: cx - w * 0.19, y: cy + h * 0.08 },
        { x: cx + w * 0.19, y: cy + h * 0.08 },
        { x: cx + w * 0.24, y: cy - h * 0.30 },
        { x: cx, y: cy + h * 0.22 },
      ],
    };
  }

  // ── Leaf / Photosynthesis ──────────────────────────────────────────────────
  if (/leaf|photosynth/.test(t)) {
    return {
      shape: (
        <g>
          <path d={`M ${cx} ${cy + h * 0.30}
            C ${cx - w * 0.28} ${cy + h * 0.10} ${cx - w * 0.34} ${cy - h * 0.15} ${cx} ${cy - h * 0.32}
            C ${cx + w * 0.34} ${cy - h * 0.15} ${cx + w * 0.28} ${cy + h * 0.10} ${cx} ${cy + h * 0.30} Z`}
            fill="#bbf7d0" stroke={accent} strokeWidth="2.5" />
          <line x1={cx} y1={cy - h * 0.32} x2={cx} y2={cy + h * 0.30} stroke={accent} strokeWidth="2" />
          <line x1={cx} y1={cy - h * 0.10} x2={cx - w * 0.20} y2={cy - h * 0.20} stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <line x1={cx} y1={cy + h * 0.02} x2={cx + w * 0.22} y2={cy - h * 0.08} stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <line x1={cx} y1={cy + h * 0.12} x2={cx - w * 0.22} y2={cy + h * 0.05} stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <line x1={cx} y1={cy + h * 0.20} x2={cx + w * 0.18} y2={cy + h * 0.14} stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <line x1={cx} y1={cy + h * 0.30} x2={cx} y2={cy + h * 0.40} stroke={accent} strokeWidth="2.5" />
          <ellipse cx={cx - w * 0.08} cy={cy + h * 0.05} rx={4} ry={2} fill={accent} opacity={0.4} />
          <ellipse cx={cx + w * 0.10} cy={cy + h * 0.15} rx={4} ry={2} fill={accent} opacity={0.4} />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.32 },
        { x: cx - w * 0.30, y: cy },
        { x: cx, y: cy },
        { x: cx - w * 0.20, y: cy - h * 0.20 },
        { x: cx - w * 0.08, y: cy + h * 0.05 },
        { x: cx, y: cy + h * 0.35 },
      ],
    };
  }

  // ── Atom / Atomic structure ────────────────────────────────────────────────
  if (/atom|electron|proton|neutron|nuclear|isotope|shell|bohr/.test(t)) {
    return {
      shape: (
        <g>
          <circle cx={cx} cy={cy} r={w * 0.08} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">N</text>
          <ellipse cx={cx} cy={cy} rx={w * 0.20} ry={h * 0.16} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
          <ellipse cx={cx} cy={cy} rx={w * 0.32} ry={h * 0.28} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" transform={`rotate(30, ${cx}, ${cy})`} />
          <ellipse cx={cx} cy={cy} rx={w * 0.40} ry={h * 0.36} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4" transform={`rotate(60, ${cx}, ${cy})`} />
          <circle cx={cx + w * 0.20} cy={cy} r={5} fill={accent} />
          <circle cx={cx - w * 0.20} cy={cy} r={5} fill={accent} />
          <circle cx={cx} cy={cy - h * 0.28} r={5} fill={accent} />
          <circle cx={cx} cy={cy + h * 0.28} r={5} fill={accent} />
          <circle cx={cx + w * 0.35} cy={cy - h * 0.18} r={5} fill={accent} opacity={0.8} />
          <circle cx={cx - w * 0.35} cy={cy + h * 0.18} r={5} fill={accent} opacity={0.8} />
        </g>
      ),
      anchors: [
        { x: cx, y: cy },
        { x: cx + w * 0.20, y: cy },
        { x: cx, y: cy - h * 0.28 },
        { x: cx + w * 0.35, y: cy - h * 0.18 },
        { x: cx, y: cy - h * 0.16 },
        { x: cx, y: cy - h * 0.36 },
      ],
    };
  }

  // ── Eye ────────────────────────────────────────────────────────────────────
  if (/\beye\b/.test(t)) {
    return {
      shape: (
        <g>
          <ellipse cx={cx} cy={cy} rx={w * 0.30} ry={h * 0.22} fill="white" stroke={accent} strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r={h * 0.14} fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          <circle cx={cx} cy={cy} r={h * 0.07} fill="#1e293b" />
          <path d={`M ${cx - w * 0.10} ${cy - h * 0.22} Q ${cx} ${cy - h * 0.30} ${cx + w * 0.10} ${cy - h * 0.22}`}
            fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5" />
          <line x1={cx + w * 0.30} y1={cy} x2={cx + w * 0.38} y2={cy} stroke={accent} strokeWidth="3" />
          <ellipse cx={cx - w * 0.06} cy={cy} rx={w * 0.04} ry={h * 0.12} fill="#fef9c3" stroke={accent} strokeWidth="1.5" />
          {/* Retina arc */}
          <path d={`M ${cx + w * 0.28} ${cy - h * 0.18} Q ${cx + w * 0.35} ${cy} ${cx + w * 0.28} ${cy + h * 0.18}`}
            fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.22 },
        { x: cx, y: cy - h * 0.14 },
        { x: cx, y: cy },
        { x: cx - w * 0.06, y: cy - h * 0.12 },
        { x: cx + w * 0.30, y: cy - h * 0.08 },
        { x: cx + w * 0.34, y: cy },
      ],
    };
  }

  // ── Ear ────────────────────────────────────────────────────────────────────
  if (/\bear\b/.test(t)) {
    return {
      shape: (
        <g>
          {/* Outer ear (pinna) */}
          <path d={`M ${cx - w * 0.28} ${cy - h * 0.30} Q ${cx - w * 0.38} ${cy} ${cx - w * 0.28} ${cy + h * 0.30} Q ${cx - w * 0.10} ${cy + h * 0.35} ${cx - w * 0.05} ${cy + h * 0.20} Q ${cx - w * 0.15} ${cy + h * 0.10} ${cx - w * 0.15} ${cy} Q ${cx - w * 0.15} ${cy - h * 0.10} ${cx - w * 0.05} ${cy - h * 0.20} Q ${cx - w * 0.10} ${cy - h * 0.35} ${cx - w * 0.28} ${cy - h * 0.30} Z`}
            fill="#fde68a" stroke={accent} strokeWidth="2" />
          {/* Ear canal */}
          <rect x={cx - w * 0.05} y={cy - h * 0.06} width={w * 0.12} height={h * 0.12} rx="3" fill="#fef3c7" stroke={accent} strokeWidth="1.5" />
          {/* Eardrum */}
          <ellipse cx={cx + w * 0.08} cy={cy} rx={w * 0.03} ry={h * 0.12} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          {/* Ossicles (3 tiny bones) */}
          <circle cx={cx + w * 0.14} cy={cy - h * 0.04} r={4} fill={accent} />
          <circle cx={cx + w * 0.18} cy={cy} r={4} fill={accent} />
          <circle cx={cx + w * 0.14} cy={cy + h * 0.04} r={4} fill={accent} />
          {/* Cochlea */}
          <path d={`M ${cx + w * 0.22} ${cy} Q ${cx + w * 0.30} ${cy - h * 0.12} ${cx + w * 0.28} ${cy - h * 0.20} Q ${cx + w * 0.20} ${cy - h * 0.28} ${cx + w * 0.12} ${cy - h * 0.20}`}
            fill="none" stroke={accent} strokeWidth="2.5" />
          {/* Auditory nerve */}
          <line x1={cx + w * 0.30} y1={cy + h * 0.05} x2={cx + w * 0.40} y2={cy + h * 0.10} stroke={accent} strokeWidth="2" />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.35, y: cy },
        { x: cx, y: cy - h * 0.06 },
        { x: cx + w * 0.08, y: cy },
        { x: cx + w * 0.16, y: cy },
        { x: cx + w * 0.22, y: cy - h * 0.14 },
        { x: cx + w * 0.38, y: cy + h * 0.10 },
      ],
    };
  }

  // ── Kidney ─────────────────────────────────────────────────────────────────
  if (/kidney|nephron|excret/.test(t)) {
    return {
      shape: (
        <g>
          {/* Kidney shape */}
          <path d={`M ${cx} ${cy - h * 0.35} C ${cx + w * 0.25} ${cy - h * 0.35} ${cx + w * 0.28} ${cy - h * 0.10} ${cx + w * 0.28} ${cy} C ${cx + w * 0.28} ${cy + h * 0.10} ${cx + w * 0.25} ${cy + h * 0.35} ${cx} ${cy + h * 0.35} C ${cx - w * 0.10} ${cy + h * 0.35} ${cx - w * 0.18} ${cy + h * 0.20} ${cx - w * 0.18} ${cy + h * 0.08} C ${cx - w * 0.18} ${cy - h * 0.08} ${cx - w * 0.10} ${cy - h * 0.35} ${cx} ${cy - h * 0.35} Z`}
            fill="#fecaca" stroke={accent} strokeWidth="2.5" />
          {/* Cortex region */}
          <path d={`M ${cx} ${cy - h * 0.28} C ${cx + w * 0.18} ${cy - h * 0.28} ${cx + w * 0.20} ${cy - h * 0.08} ${cx + w * 0.20} ${cy} C ${cx + w * 0.20} ${cy + h * 0.08} ${cx + w * 0.18} ${cy + h * 0.28} ${cx} ${cy + h * 0.28} C ${cx - w * 0.06} ${cy + h * 0.28} ${cx - w * 0.10} ${cy + h * 0.15} ${cx - w * 0.10} ${cy + h * 0.05} C ${cx - w * 0.10} ${cy - h * 0.05} ${cx - w * 0.06} ${cy - h * 0.28} ${cx} ${cy - h * 0.28} Z`}
            fill="#fca5a5" stroke={accent} strokeWidth="1" opacity="0.5" />
          {/* Renal pelvis */}
          <ellipse cx={cx + w * 0.04} cy={cy} rx={w * 0.06} ry={h * 0.12} fill="#fef9c3" stroke={accent} strokeWidth="1.5" />
          {/* Ureter */}
          <line x1={cx + w * 0.04} y1={cy + h * 0.12} x2={cx + w * 0.04} y2={cy + h * 0.40} stroke={accent} strokeWidth="2.5" />
          {/* Renal artery */}
          <line x1={cx - w * 0.18} y1={cy - h * 0.05} x2={cx - w * 0.32} y2={cy - h * 0.05} stroke="#ef4444" strokeWidth="2.5" />
          {/* Renal vein */}
          <line x1={cx - w * 0.18} y1={cy + h * 0.05} x2={cx - w * 0.32} y2={cy + h * 0.05} stroke="#3b82f6" strokeWidth="2.5" />
        </g>
      ),
      anchors: [
        { x: cx + w * 0.28, y: cy - h * 0.20 },
        { x: cx + w * 0.14, y: cy - h * 0.28 },
        { x: cx + w * 0.04, y: cy },
        { x: cx + w * 0.04, y: cy + h * 0.30 },
        { x: cx - w * 0.32, y: cy - h * 0.05 },
        { x: cx - w * 0.32, y: cy + h * 0.05 },
      ],
    };
  }

  // ── Flower / Pollination ───────────────────────────────────────────────────
  if (/flower|pollination|reproduct.*plant/.test(t)) {
    return {
      shape: (
        <g>
          <line x1={cx} y1={cy + h * 0.40} x2={cx} y2={cy + h * 0.10} stroke={accent} strokeWidth="3" />
          <path d={`M ${cx} ${cy + h * 0.25} Q ${cx - w * 0.15} ${cy + h * 0.15} ${cx - w * 0.12} ${cy + h * 0.05}`}
            fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx} cy={cy + h * 0.10} rx={w * 0.07} ry={h * 0.04} fill="#fde68a" stroke={accent} strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const px = cx + Math.cos(rad) * w * 0.16;
            const py = cy - h * 0.12 + Math.sin(rad) * h * 0.16;
            return <ellipse key={i} cx={px} cy={py} rx={w * 0.07} ry={h * 0.06}
              fill="#fecaca" stroke={accent} strokeWidth="1.5"
              transform={`rotate(${angle}, ${px}, ${py})`} />;
          })}
          <circle cx={cx} cy={cy - h * 0.12} r={w * 0.06} fill="#fde68a" stroke={accent} strokeWidth="2" />
          <line x1={cx} y1={cy - h * 0.12} x2={cx + w * 0.08} y2={cy - h * 0.22} stroke={accent} strokeWidth="1.5" />
          <circle cx={cx + w * 0.08} cy={cy - h * 0.22} r={4} fill={accent} />
          <line x1={cx} y1={cy - h * 0.12} x2={cx} y2={cy - h * 0.26} stroke={accent} strokeWidth="2" />
          <ellipse cx={cx} cy={cy - h * 0.28} rx={5} ry={4} fill={accent} />
          <path d={`M ${cx - w * 0.07} ${cy + h * 0.10} Q ${cx - w * 0.14} ${cy - h * 0.02} ${cx} ${cy - h * 0.02}`}
            fill="#bbf7d0" stroke={accent} strokeWidth="1.2" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.28 },
        { x: cx + w * 0.08, y: cy - h * 0.22 },
        { x: cx + w * 0.23, y: cy - h * 0.12 },
        { x: cx, y: cy + h * 0.10 },
        { x: cx - w * 0.15, y: cy + h * 0.20 },
        { x: cx, y: cy + h * 0.40 },
      ],
    };
  }

  // ── Digestive System ───────────────────────────────────────────────────────
  if (/digest/.test(t)) {
    return {
      shape: (
        <g>
          {/* Oesophagus */}
          <rect x={cx - w * 0.04} y={cy - h * 0.42} width={w * 0.08} height={h * 0.18} rx="4" fill="#fde68a" stroke={accent} strokeWidth="1.5" />
          {/* Stomach */}
          <path d={`M ${cx - w * 0.04} ${cy - h * 0.24} Q ${cx - w * 0.22} ${cy - h * 0.20} ${cx - w * 0.24} ${cy - h * 0.05} Q ${cx - w * 0.22} ${cy + h * 0.08} ${cx - w * 0.05} ${cy + h * 0.10} Q ${cx + w * 0.05} ${cy + h * 0.08} ${cx + w * 0.04} ${cy - h * 0.24} Z`}
            fill="#fca5a5" stroke={accent} strokeWidth="2" />
          {/* Small intestine (coiled) */}
          <path d={`M ${cx - w * 0.05} ${cy + h * 0.10} Q ${cx + w * 0.15} ${cy + h * 0.12} ${cx + w * 0.14} ${cy + h * 0.22} Q ${cx + w * 0.12} ${cy + h * 0.32} ${cx} ${cy + h * 0.30} Q ${cx - w * 0.12} ${cy + h * 0.28} ${cx - w * 0.12} ${cy + h * 0.18} Q ${cx - w * 0.10} ${cy + h * 0.12} ${cx} ${cy + h * 0.14}`}
            fill="none" stroke="#f59e0b" strokeWidth="4" opacity="0.7" />
          {/* Large intestine */}
          <path d={`M ${cx + w * 0.14} ${cy + h * 0.22} Q ${cx + w * 0.22} ${cy + h * 0.10} ${cx + w * 0.20} ${cy - h * 0.05} Q ${cx + w * 0.18} ${cy - h * 0.15} ${cx + w * 0.04} ${cy - h * 0.24}`}
            fill="none" stroke="#22c55e" strokeWidth="5" opacity="0.7" />
          {/* Liver */}
          <ellipse cx={cx + w * 0.16} cy={cy - h * 0.15} rx={w * 0.08} ry={h * 0.07} fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          {/* Rectum */}
          <rect x={cx - w * 0.04} y={cy + h * 0.30} width={w * 0.08} height={h * 0.12} rx="4" fill="#fde68a" stroke={accent} strokeWidth="1.5" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.42 },
        { x: cx - w * 0.24, y: cy - h * 0.08 },
        { x: cx + w * 0.16, y: cy - h * 0.15 },
        { x: cx + w * 0.05, y: cy + h * 0.20 },
        { x: cx - w * 0.12, y: cy + h * 0.22 },
        { x: cx, y: cy + h * 0.36 },
      ],
    };
  }

  // ── Lungs / Respiratory ────────────────────────────────────────────────────
  if (/lung|respirat|alveol|trachea|bronch|breath/.test(t)) {
    return {
      shape: (
        <g>
          {/* Trachea */}
          <rect x={cx - w * 0.04} y={cy - h * 0.42} width={w * 0.08} height={h * 0.20} rx="4" fill="#e0f2fe" stroke={accent} strokeWidth="2" />
          {/* Trachea rings */}
          {[-0.38, -0.30, -0.22].map((yf, i) => (
            <line key={i} x1={cx - w * 0.04} y1={cy + yf * h} x2={cx + w * 0.04} y2={cy + yf * h} stroke={accent} strokeWidth="1.5" />
          ))}
          {/* Left bronchus */}
          <path d={`M ${cx - w * 0.04} ${cy - h * 0.22} Q ${cx - w * 0.14} ${cy - h * 0.22} ${cx - w * 0.16} ${cy - h * 0.15}`}
            fill="none" stroke={accent} strokeWidth="3" />
          {/* Right bronchus */}
          <path d={`M ${cx + w * 0.04} ${cy - h * 0.22} Q ${cx + w * 0.14} ${cy - h * 0.22} ${cx + w * 0.16} ${cy - h * 0.15}`}
            fill="none" stroke={accent} strokeWidth="3" />
          {/* Left lung */}
          <path d={`M ${cx - w * 0.16} ${cy - h * 0.15} Q ${cx - w * 0.32} ${cy - h * 0.20} ${cx - w * 0.34} ${cy} Q ${cx - w * 0.32} ${cy + h * 0.22} ${cx - w * 0.10} ${cy + h * 0.28} Q ${cx - w * 0.04} ${cy + h * 0.20} ${cx - w * 0.04} ${cy - h * 0.22} Z`}
            fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          {/* Right lung */}
          <path d={`M ${cx + w * 0.16} ${cy - h * 0.15} Q ${cx + w * 0.32} ${cy - h * 0.20} ${cx + w * 0.34} ${cy} Q ${cx + w * 0.32} ${cy + h * 0.22} ${cx + w * 0.10} ${cy + h * 0.28} Q ${cx + w * 0.04} ${cy + h * 0.20} ${cx + w * 0.04} ${cy - h * 0.22} Z`}
            fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          {/* Diaphragm */}
          <path d={`M ${cx - w * 0.34} ${cy + h * 0.28} Q ${cx} ${cy + h * 0.38} ${cx + w * 0.34} ${cy + h * 0.28}`}
            fill="none" stroke={accent} strokeWidth="3" />
          {/* Alveoli cluster (right lung) */}
          {[[0.22, -0.05], [0.26, 0.05], [0.20, 0.10]].map(([xf, yf], i) => (
            <circle key={i} cx={cx + w * xf} cy={cy + h * yf} r={6} fill="#e0f2fe" stroke={accent} strokeWidth="1" />
          ))}
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.42 },
        { x: cx - w * 0.04, y: cy - h * 0.22 },
        { x: cx - w * 0.34, y: cy },
        { x: cx + w * 0.34, y: cy },
        { x: cx + w * 0.24, y: cy + h * 0.05 },
        { x: cx, y: cy + h * 0.38 },
      ],
    };
  }

  // ── Nervous System / Neuron ────────────────────────────────────────────────
  if (/nervous|neuron|nerve|reflex|brain|spinal/.test(t)) {
    return {
      shape: (
        <g>
          {/* Cell body */}
          <circle cx={cx} cy={cy} r={w * 0.10} fill="#fde68a" stroke={accent} strokeWidth="2" />
          {/* Nucleus */}
          <circle cx={cx} cy={cy} r={w * 0.04} fill={accent} opacity={0.4} />
          {/* Dendrites (left side) */}
          {[[-0.22, -0.15], [-0.25, 0], [-0.22, 0.15]].map(([xf, yf], i) => (
            <path key={i} d={`M ${cx - w * 0.10} ${cy + h * yf * 0.5} Q ${cx - w * 0.18} ${cy + h * yf * 0.8} ${cx + w * xf} ${cy + h * yf}`}
              fill="none" stroke={accent} strokeWidth="2" />
          ))}
          {/* Axon */}
          <line x1={cx + w * 0.10} y1={cy} x2={cx + w * 0.38} y2={cy} stroke={accent} strokeWidth="3" />
          {/* Myelin sheaths */}
          {[0.16, 0.22, 0.28, 0.34].map((xf, i) => (
            <rect key={i} x={cx + w * xf} y={cy - h * 0.06} width={w * 0.04} height={h * 0.12} rx="3"
              fill="#bbf7d0" stroke={accent} strokeWidth="1" />
          ))}
          {/* Axon terminals */}
          {[[-0.04, 0.10], [0, 0.12], [0.04, 0.10]].map(([xf, yf], i) => (
            <line key={i} x1={cx + w * 0.38} y1={cy} x2={cx + w * (0.38 + xf)} y2={cy + h * yf}
              stroke={accent} strokeWidth="1.5" />
          ))}
          {[[-0.04, 0.10], [0, 0.12], [0.04, 0.10]].map(([xf, yf], i) => (
            <circle key={i} cx={cx + w * (0.38 + xf)} cy={cy + h * yf} r={3} fill={accent} />
          ))}
        </g>
      ),
      anchors: [
        { x: cx - w * 0.22, y: cy - h * 0.15 },
        { x: cx - w * 0.25, y: cy },
        { x: cx, y: cy },
        { x: cx + w * 0.20, y: cy - h * 0.06 },
        { x: cx + w * 0.38, y: cy },
        { x: cx + w * 0.38, y: cy + h * 0.12 },
      ],
    };
  }

  // ── DNA ────────────────────────────────────────────────────────────────────
  if (/dna|gene|chromosome|heredit|inherit|allele|genotype|phenotype|mutation/.test(t)) {
    return {
      shape: (
        <g>
          <path d={`M ${cx - w * 0.10} ${cy - h * 0.40}
            Q ${cx + w * 0.18} ${cy - h * 0.25} ${cx - w * 0.10} ${cy - h * 0.10}
            Q ${cx + w * 0.18} ${cy + h * 0.05} ${cx - w * 0.10} ${cy + h * 0.20}
            Q ${cx + w * 0.18} ${cy + h * 0.35} ${cx - w * 0.10} ${cy + h * 0.40}`}
            fill="none" stroke={accent} strokeWidth="3" />
          <path d={`M ${cx + w * 0.10} ${cy - h * 0.40}
            Q ${cx - w * 0.18} ${cy - h * 0.25} ${cx + w * 0.10} ${cy - h * 0.10}
            Q ${cx - w * 0.18} ${cy + h * 0.05} ${cx + w * 0.10} ${cy + h * 0.20}
            Q ${cx - w * 0.18} ${cy + h * 0.35} ${cx + w * 0.10} ${cy + h * 0.40}`}
            fill="none" stroke="#ef4444" strokeWidth="3" />
          {[-0.30, -0.15, 0.0, 0.15, 0.30].map((yFrac, i) => {
            const y1 = cy + yFrac * h;
            const x1 = cx - w * 0.08 + (i % 2 === 0 ? 0 : w * 0.04);
            const x2 = cx + w * 0.08 - (i % 2 === 0 ? 0 : w * 0.04);
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={cx} y2={y1} stroke="#22c55e" strokeWidth="2.5" />
                <line x1={cx} y1={y1} x2={x2} y2={y1} stroke="#f59e0b" strokeWidth="2.5" />
                <circle cx={cx} cy={y1} r={3} fill="#6b7280" />
              </g>
            );
          })}
        </g>
      ),
      anchors: [
        { x: cx - w * 0.10, y: cy - h * 0.40 },
        { x: cx + w * 0.10, y: cy - h * 0.40 },
        { x: cx - w * 0.04, y: cy - h * 0.30 },
        { x: cx, y: cy - h * 0.15 },
        { x: cx - w * 0.18, y: cy },
        { x: cx, y: cy + h * 0.40 },
      ],
    };
  }

  // ── Enzyme ─────────────────────────────────────────────────────────────────
  if (/enzyme|active.site|substrate/.test(t)) {
    return {
      shape: (
        <g>
          {/* Enzyme (large irregular shape) */}
          <path d={`M ${cx - w * 0.28} ${cy - h * 0.20} Q ${cx - w * 0.30} ${cy - h * 0.30} ${cx - w * 0.10} ${cy - h * 0.32} Q ${cx + w * 0.10} ${cy - h * 0.30} ${cx + w * 0.28} ${cy - h * 0.20} Q ${cx + w * 0.30} ${cy - h * 0.05} ${cx + w * 0.28} ${cy + h * 0.15} Q ${cx + w * 0.10} ${cy + h * 0.28} ${cx - w * 0.10} ${cy + h * 0.28} Q ${cx - w * 0.30} ${cy + h * 0.15} ${cx - w * 0.28} ${cy - h * 0.20} Z`}
            fill="#bfdbfe" stroke={accent} strokeWidth="2.5" />
          {/* Active site (notch) */}
          <path d={`M ${cx - w * 0.12} ${cy - h * 0.32} Q ${cx} ${cy - h * 0.18} ${cx + w * 0.12} ${cy - h * 0.32}`}
            fill="#fef9c3" stroke={accent} strokeWidth="2" />
          {/* Substrate (fits into active site) */}
          <path d={`M ${cx - w * 0.10} ${cy - h * 0.42} Q ${cx} ${cy - h * 0.28} ${cx + w * 0.10} ${cy - h * 0.42} Q ${cx + w * 0.12} ${cy - h * 0.50} ${cx - w * 0.12} ${cy - h * 0.50} Z`}
            fill="#fca5a5" stroke={accent} strokeWidth="2" />
          {/* Label: active site */}
          <text x={cx} y={cy - h * 0.08} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Active site</text>
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.32 },
        { x: cx, y: cy - h * 0.46 },
        { x: cx - w * 0.28, y: cy },
        { x: cx + w * 0.28, y: cy },
        { x: cx, y: cy + h * 0.28 },
        { x: cx, y: cy },
      ],
    };
  }

  // ── Volcano / Tectonic ─────────────────────────────────────────────────────
  if (/volcano|tectonic|plate|earthquake|magma|lava/.test(t)) {
    return {
      shape: (
        <g>
          <rect x={0} y={cy + h * 0.20} width={w} height={h * 0.30} fill="#d1fae5" stroke={accent} strokeWidth="1" opacity="0.5" />
          <rect x={0} y={cy + h * 0.30} width={w} height={h * 0.20} fill="#fde68a" stroke={accent} strokeWidth="1" opacity="0.5" />
          <polygon points={`${cx},${cy - h * 0.35} ${cx - w * 0.28},${cy + h * 0.20} ${cx + w * 0.28},${cy + h * 0.20}`}
            fill="#d1d5db" stroke={accent} strokeWidth="2.5" />
          <ellipse cx={cx} cy={cy - h * 0.35} rx={w * 0.06} ry={h * 0.03} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          <path d={`M ${cx - w * 0.04} ${cy - h * 0.35} Q ${cx - w * 0.18} ${cy - h * 0.10} ${cx - w * 0.22} ${cy + h * 0.10}`}
            fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
          <path d={`M ${cx + w * 0.04} ${cy - h * 0.35} Q ${cx + w * 0.16} ${cy - h * 0.05} ${cx + w * 0.20} ${cy + h * 0.15}`}
            fill="none" stroke="#ef4444" strokeWidth="2.5" opacity="0.7" />
          <ellipse cx={cx} cy={cy + h * 0.32} rx={w * 0.18} ry={h * 0.08} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          <line x1={cx} y1={cy - h * 0.35} x2={cx} y2={cy + h * 0.32} stroke={accent} strokeWidth="2" strokeDasharray="5,3" opacity="0.6" />
          <line x1={0} y1={cy + h * 0.22} x2={cx - w * 0.10} y2={cy + h * 0.22} stroke={accent} strokeWidth="2.5" />
          <line x1={cx + w * 0.10} y1={cy + h * 0.22} x2={w} y2={cy + h * 0.22} stroke={accent} strokeWidth="2.5" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.35 },
        { x: cx - w * 0.22, y: cy + h * 0.10 },
        { x: cx, y: cy + h * 0.32 },
        { x: cx, y: cy + h * 0.22 },
        { x: cx - w * 0.28, y: cy + h * 0.20 },
        { x: cx, y: cy + h * 0.38 },
      ],
    };
  }

  // ── River / Coastal ────────────────────────────────────────────────────────
  if (/river|meander|oxbow|waterfall|delta|estuary|coast|erosion|deposition|longshore/.test(t)) {
    return {
      shape: (
        <g>
          <path d={`M ${w * 0.05} ${cy - h * 0.30}
            Q ${cx - w * 0.15} ${cy - h * 0.20} ${cx} ${cy - h * 0.05}
            Q ${cx + w * 0.20} ${cy + h * 0.08} ${cx - w * 0.10} ${cy + h * 0.20}
            Q ${cx - w * 0.30} ${cy + h * 0.32} ${w * 0.90} ${cy + h * 0.38}`}
            fill="none" stroke="#60a5fa" strokeWidth="14" opacity="0.5" />
          <path d={`M ${w * 0.05} ${cy - h * 0.30}
            Q ${cx - w * 0.15} ${cy - h * 0.20} ${cx} ${cy - h * 0.05}
            Q ${cx + w * 0.20} ${cy + h * 0.08} ${cx - w * 0.10} ${cy + h * 0.20}
            Q ${cx - w * 0.30} ${cy + h * 0.32} ${w * 0.90} ${cy + h * 0.38}`}
            fill="none" stroke="#3b82f6" strokeWidth="3" />
          <circle cx={cx + w * 0.20} cy={cy + h * 0.08} r={6} fill={accent} opacity={0.7} />
          <ellipse cx={cx - w * 0.05} cy={cy + h * 0.28} rx={w * 0.08} ry={h * 0.06} fill="#bfdbfe" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" />
          <line x1={cx - w * 0.12} y1={cy + h * 0.20} x2={cx - w * 0.12} y2={cy + h * 0.30} stroke="#60a5fa" strokeWidth="4" opacity="0.8" />
          <circle cx={w * 0.05} cy={cy - h * 0.30} r={6} fill={accent} />
          <circle cx={w * 0.90} cy={cy + h * 0.38} r={8} fill="#60a5fa" stroke={accent} strokeWidth="1.5" />
        </g>
      ),
      anchors: [
        { x: w * 0.05, y: cy - h * 0.30 },
        { x: cx, y: cy - h * 0.05 },
        { x: cx + w * 0.20, y: cy + h * 0.08 },
        { x: cx - w * 0.12, y: cy + h * 0.25 },
        { x: cx - w * 0.05, y: cy + h * 0.28 },
        { x: w * 0.90, y: cy + h * 0.38 },
      ],
    };
  }

  // ── Force diagram ──────────────────────────────────────────────────────────
  if (/force|newton|gravity|friction|weight|normal|tension|thrust|drag|air resist/.test(t)) {
    return {
      shape: (
        <g>
          <rect x={cx - w * 0.12} y={cy - h * 0.12} width={w * 0.24} height={h * 0.24} rx="4"
            fill="#e0f2fe" stroke={accent} strokeWidth="2.5" />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">Object</text>
          <line x1={cx} y1={cy + h * 0.12} x2={cx} y2={cy + h * 0.35} stroke="#ef4444" strokeWidth="3" />
          <polygon points={`${cx},${cy + h * 0.38} ${cx - 6},${cy + h * 0.32} ${cx + 6},${cy + h * 0.32}`} fill="#ef4444" />
          <line x1={cx} y1={cy - h * 0.12} x2={cx} y2={cy - h * 0.35} stroke="#22c55e" strokeWidth="3" />
          <polygon points={`${cx},${cy - h * 0.38} ${cx - 6},${cy - h * 0.32} ${cx + 6},${cy - h * 0.32}`} fill="#22c55e" />
          <line x1={cx - w * 0.12} y1={cy} x2={cx - w * 0.35} y2={cy} stroke="#f59e0b" strokeWidth="3" />
          <polygon points={`${cx - w * 0.38},${cy} ${cx - w * 0.32},${cy - 6} ${cx - w * 0.32},${cy + 6}`} fill="#f59e0b" />
          <line x1={cx + w * 0.12} y1={cy} x2={cx + w * 0.35} y2={cy} stroke="#3b82f6" strokeWidth="3" />
          <polygon points={`${cx + w * 0.38},${cy} ${cx + w * 0.32},${cy - 6} ${cx + w * 0.32},${cy + 6}`} fill="#3b82f6" />
          <line x1={cx - w * 0.25} y1={cy + h * 0.12} x2={cx + w * 0.25} y2={cy + h * 0.12} stroke={accent} strokeWidth="2" />
          {[-3, -1, 1, 3].map(i => (
            <line key={i} x1={cx + i * w * 0.06} y1={cy + h * 0.12} x2={cx + i * w * 0.06 - w * 0.03} y2={cy + h * 0.18}
              stroke={accent} strokeWidth="1.5" opacity="0.5" />
          ))}
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.38 },
        { x: cx, y: cy + h * 0.38 },
        { x: cx - w * 0.38, y: cy },
        { x: cx + w * 0.38, y: cy },
        { x: cx, y: cy },
        { x: cx - w * 0.12, y: cy + h * 0.12 },
      ],
    };
  }

  // ── Wave diagram ───────────────────────────────────────────────────────────
  if (/wave|transverse|longitudinal|amplitude|wavelength|frequency|sound|light|electromagnetic/.test(t)) {
    return {
      shape: (
        <g>
          <line x1={w * 0.05} y1={cy} x2={w * 0.95} y2={cy} stroke={accent} strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
          <path d={`M ${w * 0.05} ${cy}
            Q ${w * 0.17} ${cy - h * 0.30} ${w * 0.30} ${cy}
            Q ${w * 0.43} ${cy + h * 0.30} ${w * 0.55} ${cy}
            Q ${w * 0.68} ${cy - h * 0.30} ${w * 0.80} ${cy}
            Q ${w * 0.88} ${cy + h * 0.15} ${w * 0.95} ${cy}`}
            fill="none" stroke={accent} strokeWidth="3" />
          <line x1={w * 0.17} y1={cy} x2={w * 0.17} y2={cy - h * 0.30} stroke="#ef4444" strokeWidth="2" strokeDasharray="3,2" />
          <polygon points={`${w * 0.17},${cy - h * 0.30} ${w * 0.17 - 5},${cy - h * 0.24} ${w * 0.17 + 5},${cy - h * 0.24}`} fill="#ef4444" />
          <line x1={w * 0.05} y1={cy + h * 0.38} x2={w * 0.55} y2={cy + h * 0.38} stroke="#3b82f6" strokeWidth="2" />
          <polygon points={`${w * 0.05},${cy + h * 0.38} ${w * 0.11},${cy + h * 0.35} ${w * 0.11},${cy + h * 0.41}`} fill="#3b82f6" />
          <polygon points={`${w * 0.55},${cy + h * 0.38} ${w * 0.49},${cy + h * 0.35} ${w * 0.49},${cy + h * 0.41}`} fill="#3b82f6" />
          <circle cx={w * 0.30} cy={cy - h * 0.30} r={5} fill={accent} opacity={0.7} />
          <circle cx={w * 0.55} cy={cy + h * 0.30} r={5} fill={accent} opacity={0.7} />
        </g>
      ),
      anchors: [
        { x: w * 0.30, y: cy - h * 0.30 },
        { x: w * 0.55, y: cy + h * 0.30 },
        { x: w * 0.17, y: cy - h * 0.15 },
        { x: w * 0.30, y: cy + h * 0.38 },
        { x: w * 0.05, y: cy },
        { x: w * 0.80, y: cy - h * 0.30 },
      ],
    };
  }

  // ── Particle model / States of matter ─────────────────────────────────────
  if (/particle|solid|liquid|gas|state.*matter|matter.*state/.test(t)) {
    const boxW = w * 0.26, boxH = h * 0.55;
    const solidX = w * 0.05, liquidX = w * 0.37, gasX = w * 0.68;
    const boxY = cy - boxH / 2;
    const particleR = 8;
    const solidPositions: [number, number][] = [[0.5, 0.2], [0.5, 0.5], [0.5, 0.8], [0.25, 0.35], [0.75, 0.35], [0.25, 0.65], [0.75, 0.65]];
    const liquidPositions: [number, number][] = [[0.3, 0.6], [0.6, 0.55], [0.45, 0.75], [0.2, 0.80], [0.7, 0.78], [0.5, 0.40], [0.25, 0.45]];
    const gasPositions: [number, number][] = [[0.2, 0.2], [0.7, 0.3], [0.4, 0.55], [0.8, 0.7], [0.15, 0.75], [0.6, 0.15], [0.85, 0.45]];
    return {
      shape: (
        <g>
          <rect x={solidX} y={boxY} width={boxW} height={boxH} rx="4" fill="#e0f2fe" stroke={accent} strokeWidth="2" />
          <text x={solidX + boxW / 2} y={boxY + boxH + 14} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Solid</text>
          {solidPositions.map(([fx, fy], i) => (
            <circle key={i} cx={solidX + fx * boxW} cy={boxY + fy * boxH} r={particleR} fill={accent} opacity={0.8} />
          ))}
          <rect x={liquidX} y={boxY} width={boxW} height={boxH} rx="4" fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          <text x={liquidX + boxW / 2} y={boxY + boxH + 14} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Liquid</text>
          {liquidPositions.map(([fx, fy], i) => (
            <circle key={i} cx={liquidX + fx * boxW} cy={boxY + fy * boxH} r={particleR} fill={accent} opacity={0.7} />
          ))}
          <rect x={gasX} y={boxY} width={boxW} height={boxH} rx="4" fill="#f0fdf4" stroke={accent} strokeWidth="2" />
          <text x={gasX + boxW / 2} y={boxY + boxH + 14} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Gas</text>
          {gasPositions.map(([fx, fy], i) => (
            <circle key={i} cx={gasX + fx * boxW} cy={boxY + fy * boxH} r={particleR} fill={accent} opacity={0.5} />
          ))}
        </g>
      ),
      anchors: [
        { x: solidX + boxW / 2, y: boxY - 8 },
        { x: liquidX + boxW / 2, y: boxY - 8 },
        { x: gasX + boxW / 2, y: boxY - 8 },
        { x: solidX + boxW * 0.5, y: boxY + boxH * 0.5 },
        { x: liquidX + boxW * 0.5, y: boxY + boxH * 0.7 },
        { x: gasX + boxW * 0.5, y: boxY + boxH * 0.3 },
      ],
    };
  }

  // ── Water Cycle ────────────────────────────────────────────────────────────
  if (/water.cycle|hydrological|precipitation|evaporation|transpiration|condensation|runoff/.test(t)) {
    return {
      shape: (
        <g>
          <defs>
            <marker id="arrowW" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill={accent} />
            </marker>
          </defs>
          <ellipse cx={cx} cy={cy - h * 0.30} rx={w * 0.22} ry={h * 0.12} fill="#e0f2fe" stroke={accent} strokeWidth="2" />
          <ellipse cx={cx - w * 0.10} cy={cy - h * 0.33} rx={w * 0.12} ry={h * 0.09} fill="#bfdbfe" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx + w * 0.10} cy={cy - h * 0.33} rx={w * 0.12} ry={h * 0.09} fill="#bfdbfe" stroke={accent} strokeWidth="1.5" />
          <circle cx={w * 0.82} cy={cy - h * 0.35} r={w * 0.07} fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          <polygon points={`${w * 0.70},${cy + h * 0.20} ${w * 0.85},${cy - h * 0.10} ${w * 0.95},${cy + h * 0.20}`}
            fill="#d1d5db" stroke={accent} strokeWidth="2" />
          <rect x={0} y={cy + h * 0.20} width={w} height={h * 0.20} fill="#bbf7d0" stroke={accent} strokeWidth="1" opacity="0.6" />
          <ellipse cx={w * 0.20} cy={cy + h * 0.28} rx={w * 0.18} ry={h * 0.08} fill="#60a5fa" stroke={accent} strokeWidth="2" opacity="0.8" />
          <path d={`M ${w * 0.20} ${cy + h * 0.20} Q ${w * 0.15} ${cy - h * 0.05} ${cx - w * 0.12} ${cy - h * 0.25}`}
            fill="none" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrowW)" />
          {[0, 1, 2].map(i => (
            <line key={i} x1={cx - w * 0.08 + i * w * 0.06} y1={cy - h * 0.18} x2={cx - w * 0.10 + i * w * 0.06} y2={cy - h * 0.05}
              stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowW)" />
          ))}
          <path d={`M ${w * 0.70} ${cy + h * 0.20} Q ${w * 0.50} ${cy + h * 0.28} ${w * 0.38} ${cy + h * 0.28}`}
            fill="none" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arrowW)" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.33 },
        { x: w * 0.82, y: cy - h * 0.35 },
        { x: w * 0.20, y: cy + h * 0.28 },
        { x: w * 0.15, y: cy - h * 0.05 },
        { x: cx - w * 0.08, y: cy - h * 0.10 },
        { x: w * 0.55, y: cy + h * 0.28 },
      ],
    };
  }

  // ── Human body (basic) ─────────────────────────────────────────────────────
  if (/skeleton|bone|muscle|body|organ|human body/.test(t)) {
    return {
      shape: (
        <g>
          <circle cx={cx} cy={cy - h * 0.35} r={w * 0.09} fill="#fef3c7" stroke={accent} strokeWidth="2" />
          <line x1={cx} y1={cy - h * 0.26} x2={cx} y2={cy - h * 0.20} stroke={accent} strokeWidth="4" />
          <rect x={cx - w * 0.12} y={cy - h * 0.20} width={w * 0.24} height={h * 0.36} rx="6"
            fill="#fef9c3" stroke={accent} strokeWidth="2" />
          <line x1={cx - w * 0.12} y1={cy - h * 0.18} x2={cx - w * 0.28} y2={cy + h * 0.05} stroke={accent} strokeWidth="3.5" />
          <line x1={cx + w * 0.12} y1={cy - h * 0.18} x2={cx + w * 0.28} y2={cy + h * 0.05} stroke={accent} strokeWidth="3.5" />
          <line x1={cx - w * 0.07} y1={cy + h * 0.16} x2={cx - w * 0.10} y2={cy + h * 0.42} stroke={accent} strokeWidth="4" />
          <line x1={cx + w * 0.07} y1={cy + h * 0.16} x2={cx + w * 0.10} y2={cy + h * 0.42} stroke={accent} strokeWidth="4" />
          <ellipse cx={cx - w * 0.06} cy={cy - h * 0.10} rx={w * 0.04} ry={h * 0.07} fill="#bfdbfe" stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <ellipse cx={cx + w * 0.06} cy={cy - h * 0.10} rx={w * 0.04} ry={h * 0.07} fill="#bfdbfe" stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <circle cx={cx - w * 0.03} cy={cy - h * 0.04} r={w * 0.03} fill="#fca5a5" stroke={accent} strokeWidth="1.2" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.35 },
        { x: cx - w * 0.06, y: cy - h * 0.10 },
        { x: cx - w * 0.03, y: cy - h * 0.04 },
        { x: cx, y: cy + h * 0.05 },
        { x: cx - w * 0.28, y: cy + h * 0.05 },
        { x: cx - w * 0.10, y: cy + h * 0.42 },
      ],
    };
  }

  // ── Food chain / Food web ──────────────────────────────────────────────────
  if (/food.chain|food.web|trophic|predator|prey|producer|consumer/.test(t)) {
    const items = ["Producer", "Primary\nConsumer", "Secondary\nConsumer", "Tertiary\nConsumer"];
    const boxW = w * 0.18, boxH = h * 0.18;
    const spacing = (w - 40) / (items.length - 1);
    return {
      shape: (
        <g>
          {items.map((item, i) => {
            const bx = 20 + i * spacing - boxW / 2;
            const by = cy - boxH / 2;
            const colors = ["#bbf7d0", "#fde68a", "#fca5a5", "#e9d5ff"];
            const lines = item.split("\n");
            return (
              <g key={i}>
                <rect x={bx} y={by} width={boxW} height={boxH} rx="6"
                  fill={colors[i]} stroke={accent} strokeWidth="1.5" />
                {lines.map((line, li) => (
                  <text key={li} x={bx + boxW / 2} y={by + boxH / 2 - (lines.length - 1) * 7 + li * 14}
                    textAnchor="middle" dominantBaseline="middle" fontSize={8} fontFamily="Arial" fill="#1e293b" fontWeight="600">{line}</text>
                ))}
                {i < items.length - 1 && (
                  <>
                    <line x1={bx + boxW + 2} y1={cy} x2={bx + spacing - boxW / 2 - 8} y2={cy}
                      stroke={accent} strokeWidth="2" />
                    <polygon points={`${bx + spacing - boxW / 2 - 2},${cy} ${bx + spacing - boxW / 2 - 10},${cy - 5} ${bx + spacing - boxW / 2 - 10},${cy + 5}`}
                      fill={accent} />
                  </>
                )}
              </g>
            );
          })}
          <text x={cx} y={cy + h * 0.28} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} opacity="0.7">Energy flows →</text>
        </g>
      ),
      anchors: [
        { x: 20 + 0 * spacing, y: cy - boxH / 2 - 8 },
        { x: 20 + 1 * spacing, y: cy - boxH / 2 - 8 },
        { x: 20 + 2 * spacing, y: cy - boxH / 2 - 8 },
        { x: 20 + 3 * spacing, y: cy - boxH / 2 - 8 },
        { x: cx, y: cy + boxH / 2 + 8 },
        { x: cx, y: cy },
      ],
    };
  }

  // ── Carbon Cycle ───────────────────────────────────────────────────────────
  if (/carbon.cycle|carbon dioxide|greenhouse/.test(t)) {
    return {
      shape: (
        <g>
          <defs>
            <marker id="arrowC" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill={accent} />
            </marker>
          </defs>
          {/* Atmosphere */}
          <rect x={w * 0.10} y={h * 0.05} width={w * 0.80} height={h * 0.18} rx="8" fill="#bfdbfe" stroke={accent} strokeWidth="1.5" opacity="0.7" />
          <text x={cx} y={h * 0.16} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Atmosphere (CO₂)</text>
          {/* Plants */}
          <ellipse cx={w * 0.20} cy={h * 0.60} rx={w * 0.12} ry={h * 0.12} fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          <text x={w * 0.20} y={h * 0.61} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Plants</text>
          {/* Animals */}
          <ellipse cx={w * 0.50} cy={h * 0.60} rx={w * 0.10} ry={h * 0.10} fill="#fde68a" stroke={accent} strokeWidth="1.5" />
          <text x={w * 0.50} y={h * 0.61} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Animals</text>
          {/* Soil/Decomposers */}
          <ellipse cx={w * 0.80} cy={h * 0.75} rx={w * 0.12} ry={h * 0.10} fill="#d1fae5" stroke={accent} strokeWidth="1.5" />
          <text x={w * 0.80} y={h * 0.76} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Soil</text>
          {/* Fossil fuels */}
          <rect x={w * 0.30} y={h * 0.80} width={w * 0.20} height={h * 0.12} rx="4" fill="#374151" opacity="0.6" />
          <text x={w * 0.40} y={h * 0.88} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="white" fontWeight="600">Fossil Fuels</text>
          {/* Arrows */}
          <path d={`M ${w * 0.20} ${h * 0.48} L ${w * 0.20} ${h * 0.24}`} stroke="#22c55e" strokeWidth="2" markerEnd="url(#arrowC)" />
          <path d={`M ${w * 0.30} ${h * 0.16} L ${w * 0.50} ${h * 0.50}`} stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowC)" />
          <path d={`M ${w * 0.60} ${h * 0.55} L ${w * 0.72} ${h * 0.24}`} stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowC)" />
          <path d={`M ${w * 0.40} ${h * 0.80} L ${w * 0.25} ${h * 0.24}`} stroke="#6b7280" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#arrowC)" />
        </g>
      ),
      anchors: [
        { x: cx, y: h * 0.14 },
        { x: w * 0.20, y: h * 0.60 },
        { x: w * 0.50, y: h * 0.60 },
        { x: w * 0.80, y: h * 0.75 },
        { x: w * 0.40, y: h * 0.86 },
        { x: w * 0.20, y: h * 0.36 },
      ],
    };
  }

  // ── Electric circuit (simple, primary) ────────────────────────────────────
  if (/circuit|electric|battery|bulb/.test(t)) {
    return {
      shape: (
        <g>
          <polyline points={`${w * 0.15},${h * 0.20} ${w * 0.85},${h * 0.20} ${w * 0.85},${h * 0.80} ${w * 0.15},${h * 0.80} ${w * 0.15},${h * 0.20}`}
            fill="none" stroke={WIRE_COLOR} strokeWidth="2.5" strokeLinejoin="round" />
          <Battery x={w * 0.15} y={cy} size={30} />
          <Bulb x={cx} y={h * 0.20} r={14} />
          <SwitchSymbol x={w * 0.85} y={cy} />
          <Resistor x={cx} y={h * 0.80} w={36} h={16} />
        </g>
      ),
      anchors: [
        { x: w * 0.15, y: cy - 20 },
        { x: cx, y: h * 0.20 - 16 },
        { x: w * 0.85, y: cy - 14 },
        { x: cx, y: h * 0.80 - 10 },
        { x: w * 0.15, y: h * 0.20 },
        { x: w * 0.85, y: h * 0.80 },
      ],
    };
  }

  // ── Ray diagram / Optics ───────────────────────────────────────────────────
  if (/ray|optic|lens|mirror|refract|reflect|convex|concave/.test(t)) {
    return {
      shape: (
        <g>
          {/* Principal axis */}
          <line x1={w * 0.05} y1={cy} x2={w * 0.95} y2={cy} stroke="#6b7280" strokeWidth="1.5" strokeDasharray="6,4" />
          {/* Convex lens */}
          <path d={`M ${cx} ${cy - h * 0.35} Q ${cx + w * 0.08} ${cy} ${cx} ${cy + h * 0.35}`}
            fill="none" stroke={accent} strokeWidth="2.5" />
          <path d={`M ${cx} ${cy - h * 0.35} Q ${cx - w * 0.08} ${cy} ${cx} ${cy + h * 0.35}`}
            fill="#e0f2fe" stroke={accent} strokeWidth="2.5" />
          {/* Focal points */}
          <circle cx={cx - w * 0.22} cy={cy} r={4} fill={accent} />
          <circle cx={cx + w * 0.22} cy={cy} r={4} fill={accent} />
          {/* Incident rays */}
          <line x1={w * 0.05} y1={cy - h * 0.20} x2={cx} y2={cy - h * 0.20} stroke="#ef4444" strokeWidth="2" />
          <line x1={cx} y1={cy - h * 0.20} x2={cx + w * 0.22} y2={cy} stroke="#ef4444" strokeWidth="2" />
          <polygon points={`${cx + w * 0.22},${cy} ${cx + w * 0.18},${cy - 5} ${cx + w * 0.18},${cy + 5}`} fill="#ef4444" />
          {/* Parallel ray through focal */}
          <line x1={w * 0.05} y1={cy} x2={cx} y2={cy} stroke="#3b82f6" strokeWidth="2" />
          <line x1={cx} y1={cy} x2={w * 0.95} y2={cy + h * 0.20} stroke="#3b82f6" strokeWidth="2" />
          {/* Object */}
          <line x1={cx - w * 0.35} y1={cy} x2={cx - w * 0.35} y2={cy - h * 0.22} stroke="#22c55e" strokeWidth="3" />
          <polygon points={`${cx - w * 0.35},${cy - h * 0.22} ${cx - w * 0.35 - 6},${cy - h * 0.16} ${cx - w * 0.35 + 6},${cy - h * 0.16}`} fill="#22c55e" />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.35, y: cy - h * 0.11 },
        { x: cx, y: cy - h * 0.35 },
        { x: cx - w * 0.22, y: cy + 8 },
        { x: cx + w * 0.22, y: cy + 8 },
        { x: w * 0.05, y: cy - h * 0.20 },
        { x: cx + w * 0.22, y: cy },
      ],
    };
  }

  // ── Energy transfer ────────────────────────────────────────────────────────
  if (/energy.transfer|energy.store|kinetic|potential|thermal|elastic|chemical|nuclear.*energy/.test(t)) {
    const stores = ["Chemical", "Kinetic", "Thermal", "Potential"];
    const colors = ["#fde68a", "#bfdbfe", "#fca5a5", "#bbf7d0"];
    const positions = [[cx - w * 0.28, cy - h * 0.20], [cx + w * 0.28, cy - h * 0.20], [cx + w * 0.28, cy + h * 0.20], [cx - w * 0.28, cy + h * 0.20]];
    return {
      shape: (
        <g>
          {/* Central object */}
          <circle cx={cx} cy={cy} r={w * 0.10} fill="#e0f2fe" stroke={accent} strokeWidth="2" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="700">Object</text>
          {stores.map((store, i) => {
            const [sx, sy] = positions[i];
            return (
              <g key={i}>
                <ellipse cx={sx} cy={sy} rx={w * 0.10} ry={h * 0.10} fill={colors[i]} stroke={accent} strokeWidth="1.5" />
                <text x={sx} y={sy + 4} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#1e293b" fontWeight="600">{store}</text>
                <line x1={cx + (sx - cx) * 0.10} y1={cy + (sy - cy) * 0.10}
                  x2={sx - (sx - cx) * 0.10} y2={sy - (sy - cy) * 0.10}
                  stroke={accent} strokeWidth="2" strokeDasharray="4,3" />
              </g>
            );
          })}
        </g>
      ),
      anchors: [
        { x: positions[0][0], y: positions[0][1] - h * 0.10 },
        { x: positions[1][0], y: positions[1][1] - h * 0.10 },
        { x: positions[2][0], y: positions[2][1] + h * 0.10 },
        { x: positions[3][0], y: positions[3][1] + h * 0.10 },
        { x: cx, y: cy },
        { x: cx, y: cy - h * 0.10 },
      ],
    };
  }

  // ── Magnetic field ─────────────────────────────────────────────────────────
  if (/magnetic|magnet|field line|electromagnet/.test(t)) {
    return {
      shape: (
        <g>
          {/* Bar magnet */}
          <rect x={cx - w * 0.18} y={cy - h * 0.08} width={w * 0.36} height={h * 0.16} rx="4" fill="#e0f2fe" stroke={accent} strokeWidth="2" />
          <rect x={cx - w * 0.18} y={cy - h * 0.08} width={w * 0.18} height={h * 0.16} rx="4 0 0 4" fill="#ef4444" opacity="0.7" />
          <text x={cx - w * 0.09} y={cy + 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="white" fontWeight="700">N</text>
          <text x={cx + w * 0.09} y={cy + 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">S</text>
          {/* Field lines */}
          {[-0.20, -0.10, 0, 0.10, 0.20].map((yOff, i) => {
            const yPos = cy + yOff * h;
            const spread = Math.abs(yOff) * 2.5 + 0.5;
            return (
              <path key={i} d={`M ${cx - w * 0.18} ${yPos} Q ${cx - w * spread} ${yPos - h * 0.25} ${cx - w * 0.18} ${yPos - h * 0.40}`}
                fill="none" stroke={accent} strokeWidth="1.2" opacity="0.5" strokeDasharray="3,2" />
            );
          })}
          {[-0.20, -0.10, 0, 0.10, 0.20].map((yOff, i) => {
            const yPos = cy + yOff * h;
            const spread = Math.abs(yOff) * 2.5 + 0.5;
            return (
              <path key={i} d={`M ${cx + w * 0.18} ${yPos} Q ${cx + w * spread} ${yPos - h * 0.25} ${cx + w * 0.18} ${yPos - h * 0.40}`}
                fill="none" stroke={accent} strokeWidth="1.2" opacity="0.5" strokeDasharray="3,2" />
            );
          })}
        </g>
      ),
      anchors: [
        { x: cx - w * 0.09, y: cy - h * 0.08 },
        { x: cx + w * 0.09, y: cy - h * 0.08 },
        { x: cx - w * 0.40, y: cy - h * 0.20 },
        { x: cx + w * 0.40, y: cy - h * 0.20 },
        { x: cx, y: cy - h * 0.40 },
        { x: cx, y: cy + h * 0.20 },
      ],
    };
  }

  // ── Bonding / Chemistry ────────────────────────────────────────────────────
  if (/bond|ionic|covalent|metallic|electron.*transfer|electron.*share/.test(t)) {
    return {
      shape: (
        <g>
          {/* Atom A */}
          <circle cx={cx - w * 0.18} cy={cy} r={w * 0.12} fill="#fde68a" stroke={accent} strokeWidth="2" />
          <circle cx={cx - w * 0.18} cy={cy} r={w * 0.06} fill={accent} opacity={0.3} />
          <text x={cx - w * 0.18} y={cy + 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">A</text>
          {/* Atom B */}
          <circle cx={cx + w * 0.18} cy={cy} r={w * 0.12} fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          <circle cx={cx + w * 0.18} cy={cy} r={w * 0.06} fill={accent} opacity={0.3} />
          <text x={cx + w * 0.18} y={cy + 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">B</text>
          {/* Shared electrons */}
          <circle cx={cx - w * 0.04} cy={cy - h * 0.06} r={5} fill={accent} />
          <circle cx={cx + w * 0.04} cy={cy + h * 0.06} r={5} fill="#ef4444" />
          {/* Bond line */}
          <line x1={cx - w * 0.06} y1={cy} x2={cx + w * 0.06} y2={cy} stroke={accent} strokeWidth="2.5" />
          {/* Outer electron shells */}
          <circle cx={cx - w * 0.18} cy={cy - h * 0.14} r={4} fill={accent} opacity={0.6} />
          <circle cx={cx - w * 0.18} cy={cy + h * 0.14} r={4} fill={accent} opacity={0.6} />
          <circle cx={cx + w * 0.18} cy={cy - h * 0.14} r={4} fill="#ef4444" opacity={0.6} />
          <circle cx={cx + w * 0.18} cy={cy + h * 0.14} r={4} fill="#ef4444" opacity={0.6} />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.18, y: cy - h * 0.12 },
        { x: cx + w * 0.18, y: cy - h * 0.12 },
        { x: cx, y: cy },
        { x: cx - w * 0.04, y: cy - h * 0.06 },
        { x: cx + w * 0.04, y: cy + h * 0.06 },
        { x: cx, y: cy + h * 0.20 },
      ],
    };
  }

  // ── Reaction profile / Energy diagram ─────────────────────────────────────
  if (/reaction.profile|activation.energy|exothermic|endothermic|enthalpy/.test(t)) {
    const chartL = w * 0.10, chartR = w * 0.90, chartT = h * 0.10, chartB = h * 0.85;
    const reactY = chartB - h * 0.25;
    const prodY = chartB - h * 0.15;
    const peakY = chartT + h * 0.05;
    const peakX = cx;
    return {
      shape: (
        <g>
          {/* Axes */}
          <line x1={chartL} y1={chartT} x2={chartL} y2={chartB} stroke="#374151" strokeWidth="2" />
          <line x1={chartL} y1={chartB} x2={chartR} y2={chartB} stroke="#374151" strokeWidth="2" />
          <text x={chartL - 4} y={cy} textAnchor="end" fontSize={8} fontFamily="Arial" fill="#6b7280" transform={`rotate(-90, ${chartL - 4}, ${cy})`}>Energy</text>
          <text x={cx} y={chartB + 16} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#6b7280">Progress of Reaction</text>
          {/* Reaction curve */}
          <path d={`M ${chartL + 20} ${reactY} Q ${chartL + 60} ${reactY} ${peakX - 40} ${peakY} Q ${peakX} ${peakY - 10} ${peakX + 40} ${peakY} Q ${chartR - 60} ${prodY} ${chartR - 20} ${prodY}`}
            fill="none" stroke={accent} strokeWidth="3" />
          {/* Reactants level */}
          <line x1={chartL + 10} y1={reactY} x2={chartL + 80} y2={reactY} stroke="#22c55e" strokeWidth="2" strokeDasharray="4,3" />
          {/* Products level */}
          <line x1={chartR - 80} y1={prodY} x2={chartR - 10} y2={prodY} stroke="#ef4444" strokeWidth="2" strokeDasharray="4,3" />
          {/* Activation energy arrow */}
          <line x1={peakX + 20} y1={reactY} x2={peakX + 20} y2={peakY} stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2" />
          <polygon points={`${peakX + 20},${peakY} ${peakX + 15},${peakY + 8} ${peakX + 25},${peakY + 8}`} fill="#f59e0b" />
        </g>
      ),
      anchors: [
        { x: chartL + 40, y: reactY - 8 },
        { x: peakX, y: peakY - 8 },
        { x: chartR - 40, y: prodY - 8 },
        { x: peakX + 20, y: (reactY + peakY) / 2 },
        { x: chartL, y: cy },
        { x: cx, y: chartB },
      ],
    };
  }

  // ── Electrolysis ───────────────────────────────────────────────────────────
  if (/electrolysis|electrode|anode|cathode|electrolyte/.test(t)) {
    return {
      shape: (
        <g>
          {/* Beaker */}
          <path d={`M ${cx - w * 0.30} ${h * 0.15} L ${cx - w * 0.32} ${h * 0.80} Q ${cx - w * 0.32} ${h * 0.85} ${cx - w * 0.28} ${h * 0.85} L ${cx + w * 0.28} ${h * 0.85} Q ${cx + w * 0.32} ${h * 0.85} ${cx + w * 0.32} ${h * 0.80} L ${cx + w * 0.30} ${h * 0.15}`}
            fill="none" stroke={accent} strokeWidth="2.5" />
          {/* Electrolyte solution */}
          <rect x={cx - w * 0.30} y={h * 0.50} width={w * 0.60} height={h * 0.35} fill="#bfdbfe" opacity="0.4" />
          {/* Cathode (left) */}
          <rect x={cx - w * 0.20} y={h * 0.12} width={w * 0.05} height={h * 0.55} rx="2" fill="#374151" />
          <text x={cx - w * 0.175} y={h * 0.10} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">−</text>
          {/* Anode (right) */}
          <rect x={cx + w * 0.15} y={h * 0.12} width={w * 0.05} height={h * 0.55} rx="2" fill="#374151" />
          <text x={cx + w * 0.175} y={h * 0.10} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">+</text>
          {/* Bubbles at cathode */}
          {[[0, -0.10], [-0.03, -0.18], [0.03, -0.22]].map(([xo, yo], i) => (
            <circle key={i} cx={cx - w * 0.175 + xo * w} cy={h * 0.50 + yo * h} r={4} fill="white" stroke={accent} strokeWidth="1" />
          ))}
          {/* Bubbles at anode */}
          {[[0, -0.08], [-0.03, -0.16], [0.03, -0.20]].map(([xo, yo], i) => (
            <circle key={i} cx={cx + w * 0.175 + xo * w} cy={h * 0.50 + yo * h} r={4} fill="white" stroke={accent} strokeWidth="1" />
          ))}
          {/* Battery connection */}
          <line x1={cx - w * 0.175} y1={h * 0.12} x2={cx - w * 0.175} y2={h * 0.06} stroke={accent} strokeWidth="1.5" />
          <line x1={cx + w * 0.175} y1={h * 0.12} x2={cx + w * 0.175} y2={h * 0.06} stroke={accent} strokeWidth="1.5" />
          <line x1={cx - w * 0.175} y1={h * 0.06} x2={cx + w * 0.175} y2={h * 0.06} stroke={accent} strokeWidth="1.5" />
          <Battery x={cx} y={h * 0.06} size={20} />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.175, y: h * 0.30 },
        { x: cx + w * 0.175, y: h * 0.30 },
        { x: cx, y: h * 0.65 },
        { x: cx - w * 0.175, y: h * 0.40 },
        { x: cx + w * 0.175, y: h * 0.40 },
        { x: cx, y: h * 0.06 },
      ],
    };
  }

  // ── Separation techniques ──────────────────────────────────────────────────
  if (/chromatograph|distillat|filtrat|evaporat|separation/.test(t)) {
    return {
      shape: (
        <g>
          {/* Beaker */}
          <path d={`M ${cx - w * 0.22} ${h * 0.20} L ${cx - w * 0.24} ${h * 0.80} Q ${cx - w * 0.24} ${h * 0.85} ${cx - w * 0.20} ${h * 0.85} L ${cx + w * 0.20} ${h * 0.85} Q ${cx + w * 0.24} ${h * 0.85} ${cx + w * 0.24} ${h * 0.80} L ${cx + w * 0.22} ${h * 0.20}`}
            fill="none" stroke={accent} strokeWidth="2.5" />
          {/* Liquid */}
          <rect x={cx - w * 0.22} y={h * 0.55} width={w * 0.44} height={h * 0.30} fill="#bfdbfe" opacity="0.5" />
          {/* Filter funnel */}
          <path d={`M ${cx - w * 0.18} ${h * 0.20} L ${cx} ${h * 0.50} L ${cx + w * 0.18} ${h * 0.20} Z`}
            fill="#fde68a" stroke={accent} strokeWidth="1.5" opacity="0.7" />
          {/* Filter paper */}
          <path d={`M ${cx - w * 0.16} ${h * 0.22} Q ${cx} ${h * 0.28} ${cx + w * 0.16} ${h * 0.22}`}
            fill="none" stroke={accent} strokeWidth="1.5" />
          {/* Filtrate drip */}
          <line x1={cx} y1={h * 0.50} x2={cx} y2={h * 0.58} stroke={accent} strokeWidth="1.5" />
          <circle cx={cx} cy={h * 0.60} r={3} fill="#3b82f6" />
          {/* Residue */}
          <ellipse cx={cx} cy={h * 0.46} rx={w * 0.06} ry={h * 0.04} fill="#d1d5db" stroke={accent} strokeWidth="1" />
        </g>
      ),
      anchors: [
        { x: cx, y: h * 0.20 },
        { x: cx - w * 0.18, y: h * 0.22 },
        { x: cx, y: h * 0.46 },
        { x: cx, y: h * 0.50 },
        { x: cx, y: h * 0.60 },
        { x: cx, y: h * 0.70 },
      ],
    };
  }

  // ── Microscopy ─────────────────────────────────────────────────────────────
  if (/microscop|magnif|slide|specimen/.test(t)) {
    return {
      shape: (
        <g>
          {/* Eyepiece */}
          <rect x={cx - w * 0.04} y={h * 0.05} width={w * 0.08} height={h * 0.10} rx="3" fill="#e0f2fe" stroke={accent} strokeWidth="2" />
          {/* Body tube */}
          <rect x={cx - w * 0.03} y={h * 0.15} width={w * 0.06} height={h * 0.20} rx="2" fill="#d1d5db" stroke={accent} strokeWidth="1.5" />
          {/* Objective lens */}
          <ellipse cx={cx} cy={h * 0.38} rx={w * 0.04} ry={h * 0.03} fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          {/* Stage */}
          <rect x={cx - w * 0.20} y={h * 0.45} width={w * 0.40} height={h * 0.06} rx="2" fill="#d1d5db" stroke={accent} strokeWidth="1.5" />
          {/* Slide on stage */}
          <rect x={cx - w * 0.12} y={h * 0.43} width={w * 0.24} height={h * 0.04} rx="1" fill="#fef9c3" stroke={accent} strokeWidth="1" />
          {/* Arm */}
          <path d={`M ${cx} ${h * 0.15} Q ${cx + w * 0.12} ${h * 0.15} ${cx + w * 0.12} ${h * 0.45}`}
            fill="none" stroke={accent} strokeWidth="3" />
          {/* Base */}
          <ellipse cx={cx + w * 0.06} cy={h * 0.85} rx={w * 0.18} ry={h * 0.05} fill="#d1d5db" stroke={accent} strokeWidth="2" />
          <line x1={cx + w * 0.12} y1={h * 0.45} x2={cx + w * 0.12} y2={h * 0.85} stroke={accent} strokeWidth="3" />
          {/* Coarse focus knob */}
          <circle cx={cx + w * 0.18} cy={h * 0.55} r={w * 0.04} fill="#f1f5f9" stroke={accent} strokeWidth="1.5" />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.04, y: h * 0.10 },
        { x: cx, y: h * 0.25 },
        { x: cx, y: h * 0.38 },
        { x: cx, y: h * 0.45 },
        { x: cx + w * 0.18, y: h * 0.55 },
        { x: cx + w * 0.06, y: h * 0.85 },
      ],
    };
  }

  // ── Gas exchange ───────────────────────────────────────────────────────────
  if (/gas.exchange|alveol|diffusion.*lung|oxygen.*carbon/.test(t)) {
    return {
      shape: (
        <g>
          {/* Alveolus (air sac) */}
          <circle cx={cx} cy={cy - h * 0.10} r={w * 0.18} fill="#e0f2fe" stroke={accent} strokeWidth="2.5" />
          <text x={cx} y={cy - h * 0.10} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Alveolus</text>
          {/* Capillary blood vessel */}
          <path d={`M ${cx - w * 0.30} ${cy + h * 0.15} Q ${cx - w * 0.20} ${cy + h * 0.05} ${cx} ${cy + h * 0.08} Q ${cx + w * 0.20} ${cy + h * 0.05} ${cx + w * 0.30} ${cy + h * 0.15}`}
            fill="none" stroke="#ef4444" strokeWidth="6" opacity="0.6" />
          {/* O2 arrows (into blood) */}
          <line x1={cx - w * 0.08} y1={cy - h * 0.05} x2={cx - w * 0.08} y2={cy + h * 0.10} stroke="#22c55e" strokeWidth="2.5" />
          <polygon points={`${cx - w * 0.08},${cy + h * 0.10} ${cx - w * 0.08 - 5},${cy + h * 0.05} ${cx - w * 0.08 + 5},${cy + h * 0.05}`} fill="#22c55e" />
          <text x={cx - w * 0.14} y={cy + h * 0.03} fontSize={8} fontFamily="Arial" fill="#22c55e" fontWeight="700">O₂</text>
          {/* CO2 arrows (out of blood) */}
          <line x1={cx + w * 0.08} y1={cy + h * 0.10} x2={cx + w * 0.08} y2={cy - h * 0.05} stroke="#ef4444" strokeWidth="2.5" />
          <polygon points={`${cx + w * 0.08},${cy - h * 0.05} ${cx + w * 0.08 - 5},${cy} ${cx + w * 0.08 + 5},${cy}`} fill="#ef4444" />
          <text x={cx + w * 0.14} y={cy + h * 0.03} fontSize={8} fontFamily="Arial" fill="#ef4444" fontWeight="700">CO₂</text>
          {/* Thin wall label */}
          <line x1={cx + w * 0.18} y1={cy - h * 0.10} x2={cx + w * 0.28} y2={cy - h * 0.18} stroke={accent} strokeWidth="1" strokeDasharray="3,2" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.28 },
        { x: cx + w * 0.28, y: cy - h * 0.18 },
        { x: cx - w * 0.08, y: cy + h * 0.02 },
        { x: cx + w * 0.08, y: cy + h * 0.02 },
        { x: cx - w * 0.30, y: cy + h * 0.15 },
        { x: cx + w * 0.30, y: cy + h * 0.15 },
      ],
    };
  }

  // ── Density diagram ────────────────────────────────────────────────────────
  if (/density|mass.*volume|volume.*mass/.test(t)) {
    return {
      shape: (
        <g>
          {/* Formula triangle */}
          <polygon points={`${cx},${cy - h * 0.35} ${cx - w * 0.28},${cy + h * 0.20} ${cx + w * 0.28},${cy + h * 0.20}`}
            fill="#f1f5f9" stroke={accent} strokeWidth="2.5" />
          {/* Dividing line */}
          <line x1={cx - w * 0.28} y1={cy + h * 0.20} x2={cx + w * 0.28} y2={cy + h * 0.20} stroke={accent} strokeWidth="2" />
          <line x1={cx} y1={cy - h * 0.05} x2={cx} y2={cy + h * 0.20} stroke={accent} strokeWidth="2" />
          {/* Labels */}
          <text x={cx} y={cy - h * 0.08} textAnchor="middle" fontSize={16} fontFamily="Arial" fill={accent} fontWeight="700">D</text>
          <text x={cx - w * 0.12} y={cy + h * 0.16} textAnchor="middle" fontSize={16} fontFamily="Arial" fill={accent} fontWeight="700">M</text>
          <text x={cx + w * 0.12} y={cy + h * 0.16} textAnchor="middle" fontSize
={16} fontFamily="Arial" fill={accent} fontWeight="700">V</text>
          {/* Formula below */}
          <text x={cx} y={cy + h * 0.35} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent}>D = M ÷ V</text>
          <text x={cx} y={cy + h * 0.45} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#6b7280">kg/m³ or g/cm³</text>
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.35 },
        { x: cx - w * 0.12, y: cy + h * 0.16 },
        { x: cx + w * 0.12, y: cy + h * 0.16 },
        { x: cx, y: cy + h * 0.35 },
        { x: cx - w * 0.28, y: cy + h * 0.20 },
        { x: cx + w * 0.28, y: cy + h * 0.20 },
      ],
    };
  }

  // ── Pythagoras ─────────────────────────────────────────────────────────────
  if (/pythagoras|right.triangle|hypotenuse/.test(t)) {
    const ax = w * 0.15, ay = h * 0.80;
    const bx = w * 0.75, by = h * 0.80;
    const cx2 = w * 0.15, cy2 = h * 0.20;
    return {
      shape: (
        <g>
          <polygon points={`${ax},${ay} ${bx},${by} ${cx2},${cy2}`}
            fill="#e0f2fe" stroke={accent} strokeWidth="2.5" />
          <rect x={ax} y={ay - 14} width={14} height={14} fill="none" stroke={accent} strokeWidth="1.5" />
          <text x={(ax + bx) / 2} y={ay + 18} textAnchor="middle" fontSize={12} fontFamily="Arial" fill={accent} fontWeight="700">a</text>
          <text x={cx2 - 14} y={(ay + cy2) / 2} textAnchor="middle" fontSize={12} fontFamily="Arial" fill={accent} fontWeight="700">b</text>
          <text x={(bx + cx2) / 2 + 16} y={(by + cy2) / 2} textAnchor="middle" fontSize={12} fontFamily="Arial" fill="#ef4444" fontWeight="700">c</text>
          <text x={cx} y={h * 0.92} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="700">a² + b² = c²</text>
        </g>
      ),
      anchors: [
        { x: ax, y: ay },
        { x: bx, y: by },
        { x: cx2, y: cy2 },
        { x: (ax + bx) / 2, y: ay + 18 },
        { x: cx2 - 14, y: (ay + cy2) / 2 },
        { x: (bx + cx2) / 2 + 16, y: (by + cy2) / 2 },
      ],
    };
  }

  // ── Circle parts ───────────────────────────────────────────────────────────
  if (/circle.*part|circle.*theorem|circumference|radius|diameter|chord|arc|sector|tangent/.test(t)) {
    return {
      shape: (
        <g>
          <circle cx={cx} cy={cy} r={w * 0.28} fill="#e0f2fe" stroke={accent} strokeWidth="2.5" />
          <line x1={cx} y1={cy} x2={cx + w * 0.28} y2={cy} stroke={accent} strokeWidth="2" />
          <line x1={cx - w * 0.28} y1={cy} x2={cx + w * 0.28} y2={cy} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,3" />
          <path d={`M ${cx - w * 0.20} ${cy - h * 0.20} A ${w * 0.28} ${h * 0.28} 0 0 1 ${cx + w * 0.20} ${cy - h * 0.20}`}
            fill="none" stroke="#22c55e" strokeWidth="2.5" />
          <line x1={cx} y1={cy} x2={cx - w * 0.20} y2={cy - h * 0.20} stroke={accent} strokeWidth="2" />
          <line x1={cx - w * 0.20} y1={cy - h * 0.20} x2={cx + w * 0.20} y2={cy - h * 0.20} stroke="#f59e0b" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={4} fill={accent} />
          <line x1={cx + w * 0.18} y1={cy - h * 0.22} x2={cx + w * 0.28} y2={cy - h * 0.30} stroke={accent} strokeWidth="1.5" />
        </g>
      ),
      anchors: [
        { x: cx + w * 0.14, y: cy - 8 },
        { x: cx, y: cy - h * 0.28 },
        { x: cx - w * 0.28, y: cy - 8 },
        { x: cx - w * 0.10, y: cy - h * 0.14 },
        { x: cx, y: cy - h * 0.20 },
        { x: cx + w * 0.28, y: cy - h * 0.30 },
      ],
    };
  }

  // ── Angles / Geometry ──────────────────────────────────────────────────────
  if (/angle|parallel|transversal|alternate|corresponding|co.interior|bearing|polygon|triangle|quadrilateral/.test(t)) {
    return {
      shape: (
        <g>
          {/* Parallel lines */}
          <line x1={w * 0.10} y1={cy - h * 0.20} x2={w * 0.90} y2={cy - h * 0.20} stroke={accent} strokeWidth="2" />
          <line x1={w * 0.10} y1={cy + h * 0.20} x2={w * 0.90} y2={cy + h * 0.20} stroke={accent} strokeWidth="2" />
          {/* Arrow marks for parallel */}
          <polygon points={`${cx - w * 0.05},${cy - h * 0.20} ${cx - w * 0.08},${cy - h * 0.24} ${cx - w * 0.08},${cy - h * 0.16}`} fill={accent} />
          <polygon points={`${cx - w * 0.05},${cy + h * 0.20} ${cx - w * 0.08},${cy + h * 0.24} ${cx - w * 0.08},${cy + h * 0.16}`} fill={accent} />
          {/* Transversal */}
          <line x1={cx - w * 0.15} y1={h * 0.05} x2={cx + w * 0.15} y2={h * 0.95} stroke="#ef4444" strokeWidth="2.5" />
          {/* Angle arcs */}
          <path d={`M ${cx - w * 0.05} ${cy - h * 0.20} A ${w * 0.08} ${h * 0.08} 0 0 1 ${cx - w * 0.10} ${cy - h * 0.12}`}
            fill="none" stroke="#22c55e" strokeWidth="2" />
          <path d={`M ${cx - w * 0.02} ${cy + h * 0.20} A ${w * 0.08} ${h * 0.08} 0 0 0 ${cx - w * 0.08} ${cy + h * 0.12}`}
            fill="none" stroke="#3b82f6" strokeWidth="2" />
          {/* Angle labels */}
          <text x={cx - w * 0.14} y={cy - h * 0.10} fontSize={10} fontFamily="Arial" fill="#22c55e" fontWeight="700">a</text>
          <text x={cx - w * 0.12} y={cy + h * 0.14} fontSize={10} fontFamily="Arial" fill="#3b82f6" fontWeight="700">b</text>
        </g>
      ),
      anchors: [
        { x: w * 0.10, y: cy - h * 0.20 },
        { x: w * 0.90, y: cy - h * 0.20 },
        { x: w * 0.10, y: cy + h * 0.20 },
        { x: cx - w * 0.14, y: cy - h * 0.10 },
        { x: cx - w * 0.12, y: cy + h * 0.14 },
        { x: cx, y: cy },
      ],
    };
  }

  // ── Transformation / Geometry ──────────────────────────────────────────────
  if (/transform|reflect|rotat|translat|enlarg|vector/.test(t)) {
    return {
      shape: (
        <g>
          {/* Grid */}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v${i}`} x1={w * 0.10 + i * w * 0.10} y1={h * 0.10} x2={w * 0.10 + i * w * 0.10} y2={h * 0.90}
              stroke="#e5e7eb" strokeWidth="1" />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`h${i}`} x1={w * 0.10} y1={h * 0.10 + i * h * 0.10} x2={w * 0.90} y2={h * 0.10 + i * h * 0.10}
              stroke="#e5e7eb" strokeWidth="1" />
          ))}
          {/* Axes */}
          <line x1={cx} y1={h * 0.10} x2={cx} y2={h * 0.90} stroke="#374151" strokeWidth="2" />
          <line x1={w * 0.10} y1={cy} x2={w * 0.90} y2={cy} stroke="#374151" strokeWidth="2" />
          {/* Original shape */}
          <polygon points={`${cx - w * 0.20},${cy - h * 0.30} ${cx - w * 0.05},${cy - h * 0.30} ${cx - w * 0.05},${cy - h * 0.10}`}
            fill="#bfdbfe" stroke={accent} strokeWidth="2" opacity="0.8" />
          {/* Transformed shape */}
          <polygon points={`${cx + w * 0.05},${cy + h * 0.10} ${cx + w * 0.20},${cy + h * 0.10} ${cx + w * 0.20},${cy + h * 0.30}`}
            fill="#fca5a5" stroke={accent} strokeWidth="2" opacity="0.8" />
          {/* Mirror line */}
          <line x1={w * 0.10} y1={h * 0.10} x2={w * 0.90} y2={h * 0.90} stroke="#22c55e" strokeWidth="2" strokeDasharray="6,4" />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.12, y: cy - h * 0.30 },
        { x: cx + w * 0.12, y: cy + h * 0.10 },
        { x: cx, y: cy },
        { x: w * 0.50, y: h * 0.50 },
        { x: cx - w * 0.05, y: cy - h * 0.10 },
        { x: cx + w * 0.20, y: cy + h * 0.30 },
      ],
    };
  }

  // ── Population pyramid ─────────────────────────────────────────────────────
  if (/population.pyramid|age.structure|demographic/.test(t)) {
    const ages = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70+"];
    const maleVals = [0.22, 0.20, 0.18, 0.16, 0.14, 0.12, 0.09, 0.06];
    const femaleVals = [0.21, 0.19, 0.18, 0.16, 0.15, 0.13, 0.10, 0.07];
    const barH = h * 0.08, startY = h * 0.10, maxBarW = w * 0.35;
    return {
      shape: (
        <g>
          <line x1={cx} y1={h * 0.08} x2={cx} y2={h * 0.92} stroke={accent} strokeWidth="2" />
          {ages.map((age, i) => {
            const barY = startY + i * barH;
            return (
              <g key={i}>
                <rect x={cx - maleVals[i] * maxBarW} y={barY + 1} width={maleVals[i] * maxBarW} height={barH - 2}
                  fill="#3b82f6" opacity="0.7" />
                <rect x={cx} y={barY + 1} width={femaleVals[i] * maxBarW} height={barH - 2}
                  fill="#f472b6" opacity="0.7" />
                <text x={cx} y={barY + barH / 2 + 4} textAnchor="middle" fontSize={7} fontFamily="Arial" fill={accent}>{age}</text>
              </g>
            );
          })}
          <text x={cx - maxBarW / 2} y={h * 0.95} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#3b82f6" fontWeight="700">Male</text>
          <text x={cx + maxBarW / 2} y={h * 0.95} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#f472b6" fontWeight="700">Female</text>
        </g>
      ),
      anchors: [
        { x: cx - maxBarW * 0.5, y: startY },
        { x: cx + maxBarW * 0.5, y: startY },
        { x: cx, y: h * 0.08 },
        { x: cx - maxBarW * 0.8, y: h * 0.50 },
        { x: cx + maxBarW * 0.8, y: h * 0.50 },
        { x: cx, y: h * 0.90 },
      ],
    };
  }

  // ── Climate graph ──────────────────────────────────────────────────────────
  if (/climate.graph|climate.chart|rainfall.*temperature|temperature.*rainfall/.test(t)) {
    const months = ["J","F","M","A","M","J","J","A","S","O","N","D"];
    const temps = [4, 5, 8, 11, 15, 18, 20, 19, 16, 12, 7, 5];
    const rain = [60, 45, 50, 45, 55, 50, 45, 55, 60, 70, 65, 65];
    const chartL = w * 0.12, chartR = w * 0.88, chartT = h * 0.10, chartB = h * 0.85;
    const chartW = chartR - chartL, chartH = chartB - chartT;
    const barW = chartW / 12 * 0.7;
    const maxRain = 100, maxTemp = 25;
    return (
      <g>
        {/* Bars for rainfall */}
        {months.map((m, i) => {
          const bx = chartL + (i + 0.5) * chartW / 12 - barW / 2;
          const bh = (rain[i] / maxRain) * chartH;
          return <rect key={i} x={bx} y={chartB - bh} width={barW} height={bh} fill="#60a5fa" opacity="0.6" />;
        })}
        {/* Temperature line */}
        <polyline
          points={months.map((_, i) => `${chartL + (i + 0.5) * chartW / 12},${chartB - (temps[i] / maxTemp) * chartH}`).join(" ")}
          fill="none" stroke="#ef4444" strokeWidth="2.5" />
        {/* Axes */}
        <line x1={chartL} y1={chartT} x2={chartL} y2={chartB} stroke="#374151" strokeWidth="2" />
        <line x1={chartL} y1={chartB} x2={chartR} y2={chartB} stroke="#374151" strokeWidth="2" />
        <line x1={chartR} y1={chartT} x2={chartR} y2={chartB} stroke="#374151" strokeWidth="1.5" />
        {/* Month labels */}
        {months.map((m, i) => (
          <text key={i} x={chartL + (i + 0.5) * chartW / 12} y={chartB + 12} textAnchor="middle" fontSize={7} fontFamily="Arial" fill="#374151">{m}</text>
        ))}
        <text x={chartL - 6} y={cy} textAnchor="end" fontSize={7} fontFamily="Arial" fill="#60a5fa" transform={`rotate(-90, ${chartL - 6}, ${cy})`}>Rainfall (mm)</text>
        <text x={chartR + 6} y={cy} textAnchor="start" fontSize={7} fontFamily="Arial" fill="#ef4444" transform={`rotate(90, ${chartR + 6}, ${cy})`}>Temp (°C)</text>
      </g>
    );
  }

  // ── Tectonic plates ────────────────────────────────────────────────────────
  if (/tectonic|plate.boundary|subduct|convergent|divergent|transform.fault/.test(t)) {
    return {
      shape: (
        <g>
          {/* Two plates */}
          <rect x={w * 0.05} y={cy - h * 0.15} width={w * 0.40} height={h * 0.40} rx="4"
            fill="#d1fae5" stroke={accent} strokeWidth="2.5" />
          <rect x={w * 0.55} y={cy - h * 0.15} width={w * 0.40} height={h * 0.40} rx="4"
            fill="#e0f2fe" stroke={accent} strokeWidth="2.5" />
          {/* Plate boundary */}
          <line x1={cx} y1={h * 0.05} x2={cx} y2={h * 0.95} stroke="#ef4444" strokeWidth="3" strokeDasharray="8,4" />
          {/* Movement arrows */}
          <line x1={cx - w * 0.08} y1={cy} x2={cx - w * 0.22} y2={cy} stroke="#374151" strokeWidth="2.5" />
          <polygon points={`${cx - w * 0.22},${cy} ${cx - w * 0.18},${cy - 6} ${cx - w * 0.18},${cy + 6}`} fill="#374151" />
          <line x1={cx + w * 0.08} y1={cy} x2={cx + w * 0.22} y2={cy} stroke="#374151" strokeWidth="2.5" />
          <polygon points={`${cx + w * 0.22},${cy} ${cx + w * 0.18},${cy - 6} ${cx + w * 0.18},${cy + 6}`} fill="#374151" />
          {/* Mantle below */}
          <rect x={w * 0.05} y={cy + h * 0.25} width={w * 0.90} height={h * 0.20} rx="4"
            fill="#fde68a" stroke={accent} strokeWidth="1.5" opacity="0.6" />
          <text x={cx} y={cy + h * 0.37} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="600">Mantle</text>
          {/* Subduction arrow */}
          <path d={`M ${cx + w * 0.05} ${cy + h * 0.25} Q ${cx + w * 0.10} ${cy + h * 0.35} ${cx + w * 0.20} ${cy + h * 0.35}`}
            fill="none" stroke="#ef4444" strokeWidth="2" />
        </g>
      ),
      anchors: [
        { x: w * 0.25, y: cy - h * 0.15 },
        { x: w * 0.75, y: cy - h * 0.15 },
        { x: cx, y: h * 0.05 },
        { x: cx - w * 0.22, y: cy },
        { x: cx + w * 0.22, y: cy },
        { x: cx, y: cy + h * 0.37 },
      ],
    };
  }

  // ── River profile ──────────────────────────────────────────────────────────
  if (/river.profile|long.profile|cross.section.*river|v.shaped|u.shaped/.test(t)) {
    const chartL = w * 0.10, chartR = w * 0.90, chartT = h * 0.10, chartB = h * 0.85;
    const chartW = chartR - chartL;
    const profilePoints = [
      [0, 0.90], [0.10, 0.75], [0.20, 0.60], [0.35, 0.45], [0.50, 0.35], [0.65, 0.28], [0.80, 0.22], [1.0, 0.18]
    ];
    return {
      shape: (
        <g>
          <line x1={chartL} y1={chartT} x2={chartL} y2={chartB} stroke="#374151" strokeWidth="2" />
          <line x1={chartL} y1={chartB} x2={chartR} y2={chartB} stroke="#374151" strokeWidth="2" />
          <polyline
            points={profilePoints.map(([fx, fy]) => `${chartL + fx * chartW},${chartT + fy * (chartB - chartT)}`).join(" ")}
            fill="none" stroke={accent} strokeWidth="3" />
          <polygon
            points={[...profilePoints, [1.0, 1.0], [0, 1.0]].map(([fx, fy]) => `${chartL + fx * chartW},${chartT + fy * (chartB - chartT)}`).join(" ")}
            fill="#bfdbfe" opacity="0.3" />
          {/* Stage labels */}
          <text x={chartL + chartW * 0.10} y={chartT + 0.75 * (chartB - chartT) - 12} fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Upper</text>
          <text x={chartL + chartW * 0.50} y={chartT + 0.35 * (chartB - chartT) - 12} fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Middle</text>
          <text x={chartL + chartW * 0.85} y={chartT + 0.22 * (chartB - chartT) - 12} fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Lower</text>
          <text x={chartL - 4} y={cy} textAnchor="end" fontSize={8} fontFamily="Arial" fill="#6b7280" transform={`rotate(-90, ${chartL - 4}, ${cy})`}>Height</text>
          <text x={cx} y={chartB + 16} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#6b7280">Distance from source</text>
        </g>
      ),
      anchors: [
        { x: chartL + chartW * 0.10, y: chartT + 0.75 * (chartB - chartT) },
        { x: chartL + chartW * 0.50, y: chartT + 0.35 * (chartB - chartT) },
        { x: chartL + chartW * 0.85, y: chartT + 0.22 * (chartB - chartT) },
        { x: chartL, y: cy },
        { x: cx, y: chartB },
        { x: chartR, y: chartT + 0.18 * (chartB - chartT) },
      ],
    };
  }

  // ── History timeline ───────────────────────────────────────────────────────
  if (/timeline|century|period|era|dynasty|war|revolution|empire/.test(t)) {
    const events = [
      { label: "Event 1", x: 0.15 },
      { label: "Event 2", x: 0.35 },
      { label: "Event 3", x: 0.55 },
      { label: "Event 4", x: 0.75 },
      { label: "Event 5", x: 0.90 },
    ];
    return {
      shape: (
        <g>
          <line x1={w * 0.05} y1={cy} x2={w * 0.95} y2={cy} stroke={accent} strokeWidth="3" />
          <polygon points={`${w * 0.95},${cy} ${w * 0.91},${cy - 6} ${w * 0.91},${cy + 6}`} fill={accent} />
          {events.map((ev, i) => {
            const ex = w * ev.x;
            const above = i % 2 === 0;
            return (
              <g key={i}>
                <circle cx={ex} cy={cy} r={6} fill={accent} />
                <line x1={ex} y1={cy + (above ? -6 : 6)} x2={ex} y2={cy + (above ? -h * 0.28 : h * 0.28)} stroke={accent} strokeWidth="1.5" />
                <rect x={ex - w * 0.08} y={cy + (above ? -h * 0.38 : h * 0.28)} width={w * 0.16} height={h * 0.10} rx="3"
                  fill="#e0f2fe" stroke={accent} strokeWidth="1" />
                <text x={ex} y={cy + (above ? -h * 0.31 : h * 0.35)} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">{ev.label}</text>
              </g>
            );
          })}
        </g>
      ),
      anchors: events.map(ev => ({ x: w * ev.x, y: cy - h * 0.38 })),
    };
  }

  // ── Cause and effect chain ─────────────────────────────────────────────────
  if (/cause.*effect|cause.effect|chain.*event|event.*chain/.test(t)) {
    const boxes = ["Cause", "Effect 1", "Effect 2", "Effect 3"];
    const boxW = w * 0.18, boxH = h * 0.18;
    const spacing = (w - 40) / (boxes.length - 1);
    return {
      shape: (
        <g>
          {boxes.map((box, i) => {
            const bx = 20 + i * spacing - boxW / 2;
            const by = cy - boxH / 2;
            const colors = ["#fde68a", "#bfdbfe", "#fca5a5", "#bbf7d0"];
            return (
              <g key={i}>
                <rect x={bx} y={by} width={boxW} height={boxH} rx="6" fill={colors[i]} stroke={accent} strokeWidth="1.5" />
                <text x={bx + boxW / 2} y={by + boxH / 2 + 4} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#1e293b" fontWeight="600">{box}</text>
                {i < boxes.length - 1 && (
                  <>
                    <line x1={bx + boxW + 2} y1={cy} x2={bx + spacing - boxW / 2 - 8} y2={cy} stroke={accent} strokeWidth="2" />
                    <polygon points={`${bx + spacing - boxW / 2 - 2},${cy} ${bx + spacing - boxW / 2 - 10},${cy - 5} ${bx + spacing - boxW / 2 - 10},${cy + 5}`} fill={accent} />
                  </>
                )}
              </g>
            );
          })}
        </g>
      ),
      anchors: boxes.map((_, i) => ({ x: 20 + i * spacing, y: cy - boxH / 2 - 8 })),
    };
  }

  // ── Venn diagram ───────────────────────────────────────────────────────────
  if (/venn/.test(t)) {
    return {
      shape: (
        <g>
          <circle cx={cx - w * 0.14} cy={cy} r={w * 0.22} fill="#bfdbfe" stroke={accent} strokeWidth="2" opacity="0.7" />
          <circle cx={cx + w * 0.14} cy={cy} r={w * 0.22} fill="#fca5a5" stroke={accent} strokeWidth="2" opacity="0.7" />
          <text x={cx - w * 0.22} y={cy + 4} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Set A</text>
          <text x={cx + w * 0.22} y={cy + 4} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Set B</text>
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Both</text>
        </g>
      ),
      anchors: [
        { x: cx - w * 0.30, y: cy - h * 0.15 },
        { x: cx + w * 0.30, y: cy - h * 0.15 },
        { x: cx, y: cy - h * 0.15 },
        { x: cx - w * 0.22, y: cy + h * 0.20 },
        { x: cx + w * 0.22, y: cy + h * 0.20 },
        { x: cx, y: cy + h * 0.20 },
      ],
    };
  }

  // ── Tree diagram / Probability ─────────────────────────────────────────────
  if (/tree.diagram|probability.tree|sample.space|outcome/.test(t)) {
    return {
      shape: (
        <g>
          {/* Root */}
          <circle cx={w * 0.15} cy={cy} r={8} fill={accent} />
          {/* First level branches */}
          {[cy - h * 0.25, cy + h * 0.25].map((y1, i) => (
            <g key={i}>
              <line x1={w * 0.15 + 8} y1={cy} x2={w * 0.45} y2={y1} stroke={accent} strokeWidth="2" />
              <circle cx={w * 0.45} cy={y1} r={7} fill={i === 0 ? "#bfdbfe" : "#fca5a5"} stroke={accent} strokeWidth="1.5" />
              <text x={(w * 0.15 + w * 0.45) / 2} y={(cy + y1) / 2 - 5} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent}>P</text>
              {/* Second level */}
              {[y1 - h * 0.12, y1 + h * 0.12].map((y2, j) => (
                <g key={j}>
                  <line x1={w * 0.45 + 7} y1={y1} x2={w * 0.75} y2={y2} stroke={accent} strokeWidth="1.5" />
                  <circle cx={w * 0.75} cy={y2} r={6} fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
                  <text x={w * 0.82} y={y2 + 4} fontSize={8} fontFamily="Arial" fill={accent}>Outcome</text>
                </g>
              ))}
            </g>
          ))}
        </g>
      ),
      anchors: [
        { x: w * 0.15, y: cy },
        { x: w * 0.45, y: cy - h * 0.25 },
        { x: w * 0.45, y: cy + h * 0.25 },
        { x: w * 0.75, y: cy - h * 0.37 },
        { x: w * 0.75, y: cy - h * 0.13 },
        { x: w * 0.75, y: cy + h * 0.13 },
      ],
    };
  }

  // ── Histogram ──────────────────────────────────────────────────────────────
  if (/histogram|frequency.density|class.width/.test(t)) {
    const chartL = w * 0.12, chartR = w * 0.90, chartT = h * 0.10, chartB = h * 0.85;
    const chartW = chartR - chartL, chartH = chartB - chartT;
    const bars = [0.4, 0.7, 1.0, 0.8, 0.5, 0.3];
    const barW = chartW / bars.length;
    return (
      <g>
        {bars.map((h2, i) => (
          <rect key={i} x={chartL + i * barW} y={chartB - h2 * chartH} width={barW - 1} height={h2 * chartH}
            fill={accent} opacity={0.7} />
        ))}
        <line x1={chartL} y1={chartT} x2={chartL} y2={chartB} stroke="#374151" strokeWidth="2" />
        <line x1={chartL} y1={chartB} x2={chartR} y2={chartB} stroke="#374151" strokeWidth="2" />
        <text x={chartL - 4} y={cy} textAnchor="end" fontSize={8} fontFamily="Arial" fill="#6b7280"
          transform={`rotate(-90, ${chartL - 4}, ${cy})`}>Freq. Density</text>
        <text x={cx} y={chartB + 16} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#6b7280">Class</text>
      </g>
    );
  }

  // ── Box plot ───────────────────────────────────────────────────────────────
  if (/box.plot|box.*whisker|quartile|median.*range|interquartile/.test(t)) {
    const chartL = w * 0.10, chartR = w * 0.90, chartB = h * 0.75;
    const chartW = chartR - chartL;
    const q0 = chartL + chartW * 0.10;
    const q1 = chartL + chartW * 0.30;
    const q2 = chartL + chartW * 0.50;
    const q3 = chartL + chartW * 0.70;
    const q4 = chartL + chartW * 0.92;
    const boxY = chartB - h * 0.20, boxH = h * 0.20;
    return (
      <g>
        <line x1={chartL} y1={chartB} x2={chartR} y2={chartB} stroke="#374151" strokeWidth="2" />
        <line x1={q0} y1={chartB - boxH * 0.5 - 8} x2={q0} y2={chartB + 8} stroke={accent} strokeWidth="2" />
        <line x1={q0} y1={chartB} x2={q1} y2={chartB} stroke={accent} strokeWidth="2" />
        <rect x={q1} y={boxY - 8} width={q3 - q1} height={boxH} fill="#bfdbfe" stroke={accent} strokeWidth="2" />
        <line x1={q2} y1={boxY - 8} x2={q2} y2={boxY - 8 + boxH} stroke={accent} strokeWidth="3" />
        <line x1={q3} y1={chartB} x2={q4} y2={chartB} stroke={accent} strokeWidth="2" />
        <line x1={q4} y1={chartB - boxH * 0.5 - 8} x2={q4} y2={chartB + 8} stroke={accent} strokeWidth="2" />
        {/* Labels */}
        {[["Min", q0], ["Q1", q1], ["Median", q2], ["Q3", q3], ["Max", q4]].map(([label, x], i) => (
          <text key={i} x={x as number} y={chartB + 20} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent}>{label as string}</text>
        ))}
      </g>
    );
  }

  // ── Scatter graph ──────────────────────────────────────────────────────────
  if (/scatter|correlation|line.*best.fit|best.fit/.test(t)) {
    const chartL = w * 0.12, chartR = w * 0.90, chartT = h * 0.10, chartB = h * 0.85;
    const chartW = chartR - chartL, chartH = chartB - chartT;
    const pts = [[0.1,0.15],[0.2,0.25],[0.25,0.30],[0.35,0.40],[0.45,0.50],[0.55,0.55],[0.60,0.65],[0.70,0.72],[0.80,0.78],[0.90,0.85]];
    return (
      <g>
        <line x1={chartL} y1={chartT} x2={chartL} y2={chartB} stroke="#374151" strokeWidth="2" />
        <line x1={chartL} y1={chartB} x2={chartR} y2={chartB} stroke="#374151" strokeWidth="2" />
        {pts.map(([fx, fy], i) => (
          <circle key={i} cx={chartL + fx * chartW} cy={chartB - fy * chartH} r={4} fill={accent} opacity={0.8} />
        ))}
        <line x1={chartL + 0.05 * chartW} y1={chartB - 0.08 * chartH}
          x2={chartL + 0.95 * chartW} y2={chartB - 0.90 * chartH}
          stroke="#ef4444" strokeWidth="2" strokeDasharray="6,3" />
        <text x={chartL - 4} y={cy} textAnchor="end" fontSize={8} fontFamily="Arial" fill="#6b7280"
          transform={`rotate(-90, ${chartL - 4}, ${cy})`}>Variable Y</text>
        <text x={cx} y={chartB + 16} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#6b7280">Variable X</text>
      </g>
    );
  }

  // ── Number line (primary) ──────────────────────────────────────────────────
  if (/number.line|number line/.test(t)) {
    const lineY = cy, lineL = w * 0.08, lineR = w * 0.92;
    const ticks = 10;
    const step = (lineR - lineL) / ticks;
    return {
      shape: (
        <g>
          <line x1={lineL} y1={lineY} x2={lineR} y2={lineY} stroke={accent} strokeWidth="3" />
          <polygon points={`${lineR},${lineY} ${lineR - 8},${lineY - 5} ${lineR - 8},${lineY + 5}`} fill={accent} />
          {Array.from({ length: ticks + 1 }).map((_, i) => {
            const x = lineL + i * step;
            const isMajor = i % 2 === 0;
            return (
              <g key={i}>
                <line x1={x} y1={lineY - (isMajor ? 12 : 7)} x2={x} y2={lineY + (isMajor ? 12 : 7)}
                  stroke={accent} strokeWidth={isMajor ? 2 : 1.5} />
                {isMajor && (
                  <text x={x} y={lineY + 24} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="600">{i}</text>
                )}
              </g>
            );
          })}
          {/* Example marked points */}
          <circle cx={lineL + 3 * step} cy={lineY} r={7} fill="#ef4444" opacity={0.8} />
          <circle cx={lineL + 7 * step} cy={lineY} r={7} fill="#22c55e" opacity={0.8} />
        </g>
      ),
      anchors: [
        { x: lineL, y: lineY - 20 },
        { x: lineL + 2 * step, y: lineY - 20 },
        { x: lineL + 5 * step, y: lineY - 20 },
        { x: lineL + 7 * step, y: lineY - 20 },
        { x: lineL + 10 * step, y: lineY - 20 },
        { x: cx, y: lineY + 35 },
      ],
    };
  }

  // ── Bar model (primary maths) ──────────────────────────────────────────────
  if (/bar.model|bar model|part.*whole|whole.*part/.test(t)) {
    const barH = h * 0.18, barW = w * 0.80, barX = w * 0.10;
    const wholeY = h * 0.20, part1Y = h * 0.55, part2Y = h * 0.55;
    return {
      shape: (
        <g>
          {/* Whole bar */}
          <rect x={barX} y={wholeY} width={barW} height={barH} rx="4" fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          <text x={barX + barW / 2} y={wholeY + barH / 2 + 5} textAnchor="middle" fontSize={14} fontFamily="Arial" fill={accent} fontWeight="700">Whole</text>
          {/* Part bars */}
          <rect x={barX} y={part1Y} width={barW * 0.55} height={barH} rx="4" fill="#fde68a" stroke={accent} strokeWidth="2" />
          <text x={barX + barW * 0.275} y={part1Y + barH / 2 + 5} textAnchor="middle" fontSize={13} fontFamily="Arial" fill={accent} fontWeight="700">Part 1</text>
          <rect x={barX + barW * 0.57} y={part2Y} width={barW * 0.43} height={barH} rx="4" fill="#fca5a5" stroke={accent} strokeWidth="2" />
          <text x={barX + barW * 0.785} y={part2Y + barH / 2 + 5} textAnchor="middle" fontSize={13} fontFamily="Arial" fill={accent} fontWeight="700">Part 2</text>
          {/* Bracket */}
          <line x1={barX} y1={wholeY + barH + 8} x2={barX} y2={part1Y - 8} stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" />
          <line x1={barX + barW} y1={wholeY + barH + 8} x2={barX + barW} y2={part1Y - 8} stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" />
        </g>
      ),
      anchors: [
        { x: barX + barW / 2, y: wholeY - 8 },
        { x: barX + barW * 0.275, y: part1Y - 8 },
        { x: barX + barW * 0.785, y: part2Y - 8 },
        { x: barX, y: wholeY + barH / 2 },
        { x: barX + barW, y: wholeY + barH / 2 },
        { x: cx, y: h * 0.88 },
      ],
    };
  }

  // ── Place value chart ──────────────────────────────────────────────────────
  if (/place.value|place value|hundreds|tens.*ones|thousands/.test(t)) {
    const cols = ["Thousands", "Hundreds", "Tens", "Ones"];
    const colW = w * 0.20, colH = h * 0.60, startX = w * 0.08, startY = h * 0.15;
    return {
      shape: (
        <g>
          {cols.map((col, i) => {
            const cx2 = startX + i * colW + colW / 2;
            return (
              <g key={i}>
                <rect x={startX + i * colW} y={startY} width={colW} height={colH} fill={i % 2 === 0 ? "#e0f2fe" : "#f0fdf4"}
                  stroke={accent} strokeWidth="1.5" />
                <text x={cx2} y={startY + 18} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="700">{col}</text>
                <line x1={startX + i * colW} y1={startY + 28} x2={startX + (i + 1) * colW} y2={startY + 28} stroke={accent} strokeWidth="1" />
              </g>
            );
          })}
        </g>
      ),
      anchors: cols.map((_, i) => ({ x: startX + i * colW + colW / 2, y: startY + colH / 2 })),
    };
  }

  // ── Part-whole model (primary) ─────────────────────────────────────────────
  if (/part.whole|part whole/.test(t)) {
    return {
      shape: (
        <g>
          {/* Whole circle */}
          <circle cx={cx} cy={cy - h * 0.20} r={w * 0.12} fill="#bfdbfe" stroke={accent} strokeWidth="2.5" />
          <text x={cx} y={cy - h * 0.18} textAnchor="middle" fontSize={12} fontFamily="Arial" fill={accent} fontWeight="700">Whole</text>
          {/* Lines to parts */}
          <line x1={cx - w * 0.06} y1={cy - h * 0.08} x2={cx - w * 0.18} y2={cy + h * 0.10} stroke={accent} strokeWidth="2" />
          <line x1={cx + w * 0.06} y1={cy - h * 0.08} x2={cx + w * 0.18} y2={cy + h * 0.10} stroke={accent} strokeWidth="2" />
          {/* Part circles */}
          <circle cx={cx - w * 0.20} cy={cy + h * 0.20} r={w * 0.10} fill="#fde68a" stroke={accent} strokeWidth="2" />
          <text x={cx - w * 0.20} y={cy + h * 0.22} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="700">Part</text>
          <circle cx={cx + w * 0.20} cy={cy + h * 0.20} r={w * 0.10} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          <text x={cx + w * 0.20} y={cy + h * 0.22} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="700">Part</text>
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.32 },
        { x: cx - w * 0.20, y: cy + h * 0.10 },
        { x: cx + w * 0.20, y: cy + h * 0.10 },
        { x: cx, y: cy - h * 0.20 },
        { x: cx - w * 0.30, y: cy + h * 0.20 },
        { x: cx + w * 0.30, y: cy + h * 0.20 },
      ],
    };
  }

  // ── Fraction circle ────────────────────────────────────────────────────────
  if (/fraction.circle|fraction circle|pie.*fraction/.test(t)) {
    const r = w * 0.28;
    return {
      shape: (
        <g>
          {/* Quarters */}
          <path d={`M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`} fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          <path d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z`} fill="#fde68a" stroke={accent} strokeWidth="2" />
          <path d={`M ${cx} ${cy} L ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          <path d={`M ${cx} ${cy} L ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`} fill="#bbf7d0" stroke={accent} strokeWidth="2" />
          {/* Fraction labels */}
          <text x={cx + r * 0.5} y={cy - r * 0.5} textAnchor="middle" fontSize={14} fontFamily="Arial" fill={accent} fontWeight="700">¼</text>
          <text x={cx - r * 0.5} y={cy - r * 0.5} textAnchor="middle" fontSize={14} fontFamily="Arial" fill={accent} fontWeight="700">¼</text>
          <text x={cx - r * 0.5} y={cy + r * 0.5 + 5} textAnchor="middle" fontSize={14} fontFamily="Arial" fill={accent} fontWeight="700">¼</text>
          <text x={cx + r * 0.5} y={cy + r * 0.5 + 5} textAnchor="middle" fontSize={14} fontFamily="Arial" fill={accent} fontWeight="700">¼</text>
        </g>
      ),
      anchors: [
        { x: cx + r * 0.5, y: cy - r * 0.5 },
        { x: cx - r * 0.5, y: cy - r * 0.5 },
        { x: cx - r * 0.5, y: cy + r * 0.5 },
        { x: cx + r * 0.5, y: cy + r * 0.5 },
        { x: cx, y: cy - r - 8 },
        { x: cx + r + 8, y: cy },
      ],
    };
  }

  // ── Fraction bar ───────────────────────────────────────────────────────────
  if (/fraction.bar|fraction bar|numerator|denominator/.test(t)) {
    const barW = w * 0.80, barH = h * 0.20, barX = w * 0.10, barY = cy - barH / 2;
    const n = 3, d = 5;
    const segW = barW / d;
    return {
      shape: (
        <g>
          {Array.from({ length: d }).map((_, i) => (
            <rect key={i} x={barX + i * segW} y={barY} width={segW} height={barH}
              fill={i < n ? accent : "white"} stroke={accent} strokeWidth="1.5" opacity={i < n ? 0.7 : 1} />
          ))}
          <text x={barX + barW / 2} y={barY - 10} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="700">{n}/{d} shaded</text>
          <text x={barX + (n * segW) / 2} y={barY + barH + 18} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent}>Numerator = {n}</text>
          <text x={barX + barW / 2} y={barY + barH + 34} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">Denominator = {d}</text>
        </g>
      ),
      anchors: [
        { x: barX, y: barY - 8 },
        { x: barX + n * segW, y: barY - 8 },
        { x: barX + barW, y: barY - 8 },
        { x: barX + segW / 2, y: barY + barH / 2 },
        { x: barX + (n + 0.5) * segW, y: barY + barH / 2 },
        { x: cx, y: barY + barH + 34 },
      ],
    };
  }

  // ── 2D/3D shapes ───────────────────────────────────────────────────────────
  if (/2d.*shape|3d.*shape|shape.*2d|shape.*3d|polygon|prism|pyramid.*shape|cube|cuboid|cylinder|sphere/.test(t)) {
    return {
      shape: (
        <g>
          {/* Square */}
          <rect x={w * 0.05} y={h * 0.15} width={w * 0.20} height={h * 0.20} fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          <text x={w * 0.15} y={h * 0.42} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Square</text>
          {/* Triangle */}
          <polygon points={`${w * 0.40},${h * 0.15} ${w * 0.30},${h * 0.35} ${w * 0.50},${h * 0.35}`}
            fill="#fde68a" stroke={accent} strokeWidth="2" />
          <text x={w * 0.40} y={h * 0.42} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Triangle</text>
          {/* Circle */}
          <circle cx={w * 0.70} cy={h * 0.25} r={w * 0.10} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          <text x={w * 0.70} y={h * 0.42} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Circle</text>
          {/* Cube (3D) */}
          <rect x={w * 0.05} y={h * 0.55} width={w * 0.18} height={h * 0.18} fill="#bbf7d0" stroke={accent} strokeWidth="2" />
          <polygon points={`${w * 0.05},${h * 0.55} ${w * 0.12},${h * 0.48} ${w * 0.30},${h * 0.48} ${w * 0.23},${h * 0.55}`}
            fill="#d1fae5" stroke={accent} strokeWidth="1.5" />
          <polygon points={`${w * 0.23},${h * 0.55} ${w * 0.30},${h * 0.48} ${w * 0.30},${h * 0.66} ${w * 0.23},${h * 0.73}`}
            fill="#a7f3d0" stroke={accent} strokeWidth="1.5" />
          <text x={w * 0.17} y={h * 0.80} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Cube</text>
          {/* Cylinder */}
          <ellipse cx={w * 0.55} cy={h * 0.56} rx={w * 0.10} ry={h * 0.04} fill="#e0f2fe" stroke={accent} strokeWidth="1.5" />
          <rect x={w * 0.45} y={h * 0.56} width={w * 0.20} height={h * 0.16} fill="#bfdbfe" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={w * 0.55} cy={h * 0.72} rx={w * 0.10} ry={h * 0.04} fill="#bfdbfe" stroke={accent} strokeWidth="1.5" />
          <text x={w * 0.55} y={h * 0.80} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Cylinder</text>
          {/* Sphere */}
          <circle cx={w * 0.82} cy={h * 0.64} r={w * 0.10} fill="#fde68a" stroke={accent} strokeWidth="2" />
          <ellipse cx={w * 0.82} cy={h * 0.64} rx={w * 0.10} ry={h * 0.03} fill="none" stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
          <text x={w * 0.82} y={h * 0.80} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Sphere</text>
        </g>
      ),
      anchors: [
        { x: w * 0.15, y: h * 0.15 },
        { x: w * 0.40, y: h * 0.15 },
        { x: w * 0.70, y: h * 0.15 },
        { x: w * 0.17, y: h * 0.55 },
        { x: w * 0.55, y: h * 0.56 },
        { x: w * 0.82, y: h * 0.54 },
      ],
    };
  }

  // ── Coordinate grid ────────────────────────────────────────────────────────
  if (/coordinate|grid|x.axis|y.axis|plot.*point|cartesian/.test(t)) {
    const gridL = w * 0.12, gridR = w * 0.88, gridT = h * 0.08, gridB = h * 0.88;
    const gridW = gridR - gridL, gridH = gridB - gridT;
    const steps = 8;
    const stepX = gridW / steps, stepY = gridH / steps;
    return {
      shape: (
        <g>
          {/* Grid lines */}
          {Array.from({ length: steps + 1 }).map((_, i) => (
            <g key={i}>
              <line x1={gridL + i * stepX} y1={gridT} x2={gridL + i * stepX} y2={gridB} stroke="#e5e7eb" strokeWidth="1" />
              <line x1={gridL} y1={gridT + i * stepY} x2={gridR} y2={gridT + i * stepY} stroke="#e5e7eb" strokeWidth="1" />
            </g>
          ))}
          {/* Axes */}
          <line x1={cx} y1={gridT} x2={cx} y2={gridB} stroke="#374151" strokeWidth="2.5" />
          <line x1={gridL} y1={cy} x2={gridR} y2={cy} stroke="#374151" strokeWidth="2.5" />
          {/* Axis arrows */}
          <polygon points={`${cx},${gridT} ${cx - 5},${gridT + 10} ${cx + 5},${gridT + 10}`} fill="#374151" />
          <polygon points={`${gridR},${cy} ${gridR - 10},${cy - 5} ${gridR - 10},${cy + 5}`} fill="#374151" />
          {/* Axis labels */}
          <text x={gridR + 8} y={cy + 4} fontSize={12} fontFamily="Arial" fill={accent} fontWeight="700">x</text>
          <text x={cx + 6} y={gridT - 4} fontSize={12} fontFamily="Arial" fill={accent} fontWeight="700">y</text>
          {/* Tick marks and numbers */}
          {[-4, -3, -2, -1, 1, 2, 3, 4].map(n => (
            <g key={n}>
              <line x1={cx + n * stepX} y1={cy - 4} x2={cx + n * stepX} y2={cy + 4} stroke="#374151" strokeWidth="1.5" />
              <text x={cx + n * stepX} y={cy + 14} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#6b7280">{n}</text>
              <line x1={cx - 4} y1={cy - n * stepY} x2={cx + 4} y2={cy - n * stepY} stroke="#374151" strokeWidth="1.5" />
              <text x={cx - 10} y={cy - n * stepY + 4} textAnchor="end" fontSize={8} fontFamily="Arial" fill="#6b7280">{n}</text>
            </g>
          ))}
          {/* Example point */}
          <circle cx={cx + 2 * stepX} cy={cy - 3 * stepY} r={5} fill="#ef4444" />
          <text x={cx + 2 * stepX + 8} y={cy - 3 * stepY - 6} fontSize={9} fontFamily="Arial" fill="#ef4444" fontWeight="600">(2, 3)</text>
        </g>
      ),
      anchors: [
        { x: cx, y: gridT },
        { x: gridR, y: cy },
        { x: cx, y: cy },
        { x: cx + 2 * stepX, y: cy - 3 * stepY },
        { x: cx - 2 * stepX, y: cy + 2 * stepY },
        { x: gridL, y: cy },
      ],
    };
  }

  // ── Pictogram / Tally ──────────────────────────────────────────────────────
  if (/pictogram|tally|tally.chart|pictograph/.test(t)) {
    const rows = [
      { label: "Cats", count: 4 },
      { label: "Dogs", count: 6 },
      { label: "Birds", count: 3 },
      { label: "Fish", count: 5 },
    ];
    const rowH = h * 0.18, startY = h * 0.12, iconSize = 16, iconGap = 22;
    const labelW = w * 0.20;
    return {
      shape: (
        <g>
          <text x={labelW / 2} y={startY - 8} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Animal</text>
          <text x={labelW + iconGap * 3} y={startY - 8} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Count</text>
          {rows.map((row, i) => {
            const ry = startY + i * rowH;
            return (
              <g key={i}>
                <text x={labelW - 8} y={ry + rowH / 2 + 4} textAnchor="end" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="600">{row.label}</text>
                {Array.from({ length: row.count }).map((_, j) => (
                  <circle key={j} cx={labelW + j * iconGap + iconSize / 2} cy={ry + rowH / 2}
                    r={iconSize / 2 - 2} fill={accent} opacity={0.7} />
                ))}
                <line x1={0} y1={ry + rowH} x2={w} y2={ry + rowH} stroke="#e5e7eb" strokeWidth="1" />
              </g>
            );
          })}
          <text x={cx} y={h * 0.90} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#6b7280">Each symbol = 1</text>
        </g>
      ),
      anchors: rows.map((_, i) => ({ x: labelW / 2, y: startY + i * rowH + rowH / 2 })),
    };
  }

  // ── Simple map / Compass ───────────────────────────────────────────────────
  if (/compass|north.*south|direction|bearing|map.*skill/.test(t)) {
    return {
      shape: (
        <g>
          {/* Compass rose */}
          <circle cx={cx} cy={cy} r={w * 0.28} fill="#f8fafc" stroke={accent} strokeWidth="2" />
          <circle cx={cx} cy={cy} r={w * 0.04} fill={accent} />
          {/* N/S/E/W arrows */}
          {[["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]].map(([dir, dx, dy], i) => {
            const ax = cx + (dx as number) * w * 0.22;
            const ay = cy + (dy as number) * h * 0.22;
            const tipX = cx + (dx as number) * w * 0.26;
            const tipY = cy + (dy as number) * h * 0.26;
            return (
              <g key={i}>
                <line x1={cx} y1={cy} x2={ax} y2={ay} stroke={dir === "N" ? "#ef4444" : accent} strokeWidth="3" />
                <polygon
                  points={`${tipX},${tipY} ${cx + (dx as number) * w * 0.18 + (dy as number) * w * 0.04},${cy + (dy as number) * h * 0.18 - (dx as number) * h * 0.04} ${cx + (dx as number) * w * 0.18 - (dy as number) * w * 0.04},${cy + (dy as number) * h * 0.18 + (dx as number) * h * 0.04}`}
                  fill={dir === "N" ? "#ef4444" : accent} />
                <text x={cx + (dx as number) * w * 0.32} y={cy + (dy as number) * h * 0.32 + 4}
                  textAnchor="middle" fontSize={14} fontFamily="Arial" fill={dir === "N" ? "#ef4444" : accent} fontWeight="700">{dir as string}</text>
              </g>
            );
          })}
          {/* Intercardinal */}
          {[["NE", 1, -1], ["NW", -1, -1], ["SE", 1, 1], ["SW", -1, 1]].map(([dir, dx, dy], i) => {
            const ax = cx + (dx as number) * w * 0.16;
            const ay = cy + (dy as number) * h * 0.16;
            return (
              <g key={i}>
                <line x1={cx} y1={cy} x2={ax} y2={ay} stroke={accent} strokeWidth="1.5" opacity="0.5" />
                <text x={cx + (dx as number) * w * 0.22} y={cy + (dy as number) * h * 0.22 + 4}
                  textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} opacity="0.7">{dir as string}</text>
              </g>
            );
          })}
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.28 },
        { x: cx + w * 0.28, y: cy },
        { x: cx, y: cy + h * 0.28 },
        { x: cx - w * 0.28, y: cy },
        { x: cx, y: cy },
        { x: cx + w * 0.22, y: cy - h * 0.22 },
      ],
    };
  }

  // ── Weather chart ──────────────────────────────────────────────────────────
  if (/weather|temperature.*chart|rainfall.*chart|climate.*primary/.test(t)) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const temps = [12, 15, 11, 14, 18, 20, 17];
    const chartL = w * 0.12, chartR = w * 0.90, chartT = h * 0.12, chartB = h * 0.80;
    const chartW = chartR - chartL, chartH = chartB - chartT;
    const maxT = 25, stepX = chartW / (days.length - 1);
    return {
      shape: (
        <g>
          <line x1={chartL} y1={chartT} x2={chartL} y2={chartB} stroke="#374151" strokeWidth="2" />
          <line x1={chartL} y1={chartB} x2={chartR} y2={chartB} stroke="#374151" strokeWidth="2" />
          <polyline
            points={days.map((_, i) => `${chartL + i * stepX},${chartB - (temps[i] / maxT) * chartH}`).join(" ")}
            fill="none" stroke="#ef4444" strokeWidth="2.5" />
          {days.map((day, i) => {
            const px = chartL + i * stepX;
            const py = chartB - (temps[i] / maxT) * chartH;
            return (
              <g key={i}>
                <circle cx={px} cy={py} r={4} fill="#ef4444" />
                <text x={px} y={chartB + 14} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#374151">{day}</text>
              </g>
            );
          })}
          <text x={chartL - 4} y={cy} textAnchor="end" fontSize={8} fontFamily="Arial" fill="#6b7280"
            transform={`rotate(-90, ${chartL - 4}, ${cy})`}>Temp (°C)</text>
        </g>
      ),
      anchors: [
        { x: chartL, y: chartT },
        { x: chartR, y: chartT },
        { x: cx, y: chartB + 20 },
        { x: chartL + stepX * 4, y: chartB - (temps[4] / maxT) * (chartB - chartT) - 10 },
        { x: chartL, y: cy },
        { x: cx, y: chartB },
      ],
    };
  }

  // ── Story map / Narrative structure ───────────────────────────────────────
  if (/story.map|narrative.structure|story.*structure|plot.*diagram|freytag|exposition|climax|resolution/.test(t)) {
    const stages = ["Exposition", "Rising\nAction", "Climax", "Falling\nAction", "Resolution"];
    const chartL = w * 0.06, chartR = w * 0.94, chartT = h * 0.15, chartB = h * 0.80;
    const chartW = chartR - chartL;
    const heights = [0.85, 0.50, 0.10, 0.50, 0.85];
    const points = stages.map((_, i) => ({
      x: chartL + (i / (stages.length - 1)) * chartW,
      y: chartT + heights[i] * (chartB - chartT),
    }));
    return {
      shape: (
        <g>
          <polyline points={points.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={accent} strokeWidth="3" />
          {points.map((p, i) => {
            const lines = stages[i].split("\n");
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={7} fill={accent} />
                {lines.map((line, li) => (
                  <text key={li} x={p.x} y={p.y + 18 + li * 12} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">{line}</text>
                ))}
              </g>
            );
          })}
          <line x1={chartL} y1={chartB} x2={chartR} y2={chartB} stroke="#e5e7eb" strokeWidth="1.5" />
        </g>
      ),
      anchors: points.map(p => ({ x: p.x, y: p.y - 12 })),
    };
  }

  // ── Sentence structure ─────────────────────────────────────────────────────
  if (/sentence.structure|sentence.*diagram|subject.*predicate|clause|phrase/.test(t)) {
    return {
      shape: (
        <g>
          {/* Sentence box */}
          <rect x={w * 0.05} y={cy - h * 0.30} width={w * 0.90} height={h * 0.20} rx="6"
            fill="#f1f5f9" stroke={accent} strokeWidth="2" />
          <text x={cx} y={cy - h * 0.18} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="600">The cat sat on the mat.</text>
          {/* Dividing line */}
          <line x1={cx} y1={cy - h * 0.10} x2={cx} y2={cy + h * 0.05} stroke={accent} strokeWidth="2" />
          {/* Subject */}
          <rect x={w * 0.05} y={cy + h * 0.05} width={w * 0.40} height={h * 0.18} rx="6"
            fill="#bfdbfe" stroke={accent} strokeWidth="1.5" />
          <text x={w * 0.25} y={cy + h * 0.16} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">Subject</text>
          <text x={w * 0.25} y={cy + h * 0.20} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#6b7280">The cat</text>
          {/* Predicate */}
          <rect x={w * 0.55} y={cy + h * 0.05} width={w * 0.40} height={h * 0.18} rx="6"
            fill="#fde68a" stroke={accent} strokeWidth="1.5" />
          <text x={w * 0.75} y={cy + h * 0.16} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">Predicate</text>
          <text x={w * 0.75} y={cy + h * 0.20} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#6b7280">sat on the mat</text>
          {/* Parts of speech */}
          <text x={w * 0.25} y={cy + h * 0.38} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent}>Noun phrase</text>
          <text x={w * 0.75} y={cy + h * 0.38} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent}>Verb phrase</text>
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.30 },
        { x: w * 0.25, y: cy + h * 0.05 },
        { x: w * 0.75, y: cy + h * 0.05 },
        { x: w * 0.25, y: cy + h * 0.23 },
        { x: w * 0.75, y: cy + h * 0.23 },
        { x: cx, y: cy + h * 0.38 },
      ],
    };
  }

  // ── Word family tree ───────────────────────────────────────────────────────
  if (/word.family|word family|root.word|prefix|suffix|morpheme/.test(t)) {
    return {
      shape: (
        <g>
          {/* Root */}
          <rect x={cx - w * 0.12} y={h * 0.10} width={w * 0.24} height={h * 0.14} rx="6"
            fill={accent} />
          <text x={cx} y={h * 0.19} textAnchor="middle" fontSize={11} fontFamily="Arial" fill="white" fontWeight="700">Root Word</text>
          {/* Branches */}
          {[
            { label: "Prefix + root", x: w * 0.18, y: h * 0.42 },
            { label: "Root + suffix", x: w * 0.50, y: h * 0.42 },
            { label: "Prefix + root\n+ suffix", x: w * 0.82, y: h * 0.42 },
          ].map((item, i) => {
            const lines = item.label.split("\n");
            return (
              <g key={i}>
                <line x1={cx} y1={h * 0.24} x2={item.x} y2={item.y - h * 0.08} stroke={accent} strokeWidth="2" />
                <rect x={item.x - w * 0.14} y={item.y - h * 0.08} width={w * 0.28} height={h * 0.16} rx="6"
                  fill="#e0f2fe" stroke={accent} strokeWidth="1.5" />
                {lines.map((line, li) => (
                  <text key={li} x={item.x} y={item.y - h * 0.08 + h * 0.06 + li * 12}
                    textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">{line}</text>
                ))}
                {/* Example words */}
                {["un-happy", "happi-ness", "un-happi-ness"].map((ex, j) => {
                  if (j !== i) return null;
                  return (
                    <text key={j} x={item.x} y={item.y + h * 0.12} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#6b7280">{ex}</text>
                  );
                })}
              </g>
            );
          })}
        </g>
      ),
      anchors: [
        { x: cx, y: h * 0.10 },
        { x: w * 0.18, y: h * 0.42 },
        { x: w * 0.50, y: h * 0.42 },
        { x: w * 0.82, y: h * 0.42 },
        { x: cx, y: h * 0.24 },
        { x: cx, y: h * 0.80 },
      ],
    };
  }

  // ── Life cycle ─────────────────────────────────────────────────────────────
  if (/life.cycle|lifecycle|metamorphosis|frog|butterfly|plant.*cycle/.test(t)) {
    const stages = ["Egg", "Larva /\nCaterpillar", "Pupa /\nChrysalis", "Adult"];
    const r = Math.min(w, h) * 0.28;
    const positions = stages.map((_, i) => {
      const angle = (i / stages.length) * 2 * Math.PI - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
    const colors = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fca5a5"];
    return {
      shape: (
        <g>
          {/* Circular arrows */}
          {positions.map((pos, i) => {
            const next = positions[(i + 1) % positions.length];
            const midAngle = ((i + 0.5) / stages.length) * 2 * Math.PI - Math.PI / 2;
            const arrowX = cx + (r + 10) * Math.cos(midAngle);
            const arrowY = cy + (r + 10) * Math.sin(midAngle);
            return (
              <path key={i}
                d={`M ${pos.x} ${pos.y} Q ${arrowX} ${arrowY} ${next.x} ${next.y}`}
                fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#arrowLC)" opacity="0.6" />
            );
          })}
          <defs>
            <marker id="arrowLC" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill={accent} />
            </marker>
          </defs>
          {/* Stage circles */}
          {positions.map((pos, i) => {
            const lines = stages[i].split("\n");
            return (
              <g key={i}>
                <circle cx={pos.x} cy={pos.y} r={w * 0.09} fill={colors[i]} stroke={accent} strokeWidth="2" />
                {lines.map((line, li) => (
                  <text key={li} x={pos.x} y={pos.y - (lines.length - 1) * 6 + li * 12 + 4}
                    textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">{line}</text>
                ))}
              </g>
            );
          })}
        </g>
      ),
      anchors: positions.map(p => ({ x: p.x, y: p.y - w * 0.09 - 8 })),
    };
  }

  // ── Simple circuit (primary) ───────────────────────────────────────────────
  if (/simple.circuit|circuit.*primary|battery.*bulb|bulb.*battery/.test(t)) {
    return {
      shape: (
        <g>
          <polyline points={`${w * 0.15},${h * 0.20} ${w * 0.85},${h * 0.20} ${w * 0.85},${h * 0.80} ${w * 0.15},${h * 0.80} ${w * 0.15},${h * 0.20}`}
            fill="none" stroke={WIRE_COLOR} strokeWidth="3" strokeLinejoin="round" />
          {/* Battery */}
          <rect x={w * 0.10} y={cy - h * 0.10} width={w * 0.10} height={h * 0.20} rx="4" fill="#fde68a" stroke={accent} strokeWidth="2" />
          <text x={w * 0.15} y={cy + 5} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">+−</text>
          {/* Bulb */}
          <circle cx={cx} cy={h * 0.20} r={16} fill="#fef9c3" stroke={accent} strokeWidth="2.5" />
          <line x1={cx - 10} y1={h * 0.20 - 10} x2={cx + 10} y2={h * 0.20 + 10} stroke={accent} strokeWidth="2" />
          <line x1={cx + 10} y1={h * 0.20 - 10} x2={cx - 10} y2={h * 0.20 + 10} stroke={accent} strokeWidth="2" />
          {/* Switch */}
          <circle cx={w * 0.85} cy={cy} r={6} fill="white" stroke={accent} strokeWidth="2" />
          <line x1={w * 0.85} y1={cy - 6} x2={w * 0.85 + 10} y2={cy - 14} stroke={accent} strokeWidth="2" />
          {/* Labels */}
          <text x={w * 0.15} y={cy + h * 0.18} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Battery</text>
          <text x={cx} y={h * 0.20 + 28} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Bulb</text>
          <text x={w * 0.85} y={cy + 22} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="600">Switch</text>
        </g>
      ),
      anchors: [
        { x: w * 0.15, y: cy - h * 0.10 },
        { x: cx, y: h * 0.04 },
        { x: w * 0.85, y: cy - 20 },
        { x: cx, y: h * 0.80 },
        { x: w * 0.15, y: h * 0.80 },
        { x: w * 0.85, y: h * 0.80 },
      ],
    };
  }

  // ── Forces (primary push/pull) ─────────────────────────────────────────────
  if (/push|pull|force.*primary|primary.*force/.test(t)) {
    return {
      shape: (
        <g>
          {/* Object */}
          <rect x={cx - w * 0.12} y={cy - h * 0.14} width={w * 0.24} height={h * 0.28} rx="8"
            fill="#fde68a" stroke={accent} strokeWidth="2.5" />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="700">Object</text>
          {/* Push arrow */}
          <line x1={cx - w * 0.38} y1={cy} x2={cx - w * 0.14} y2={cy} stroke="#ef4444" strokeWidth="4" />
          <polygon points={`${cx - w * 0.12},${cy} ${cx - w * 0.18},${cy - 7} ${cx - w * 0.18},${cy + 7}`} fill="#ef4444" />
          <text x={cx - w * 0.30} y={cy - 14} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#ef4444" fontWeight="700">PUSH</text>
          {/* Pull arrow */}
          <line x1={cx + w * 0.14} y1={cy} x2={cx + w * 0.38} y2={cy} stroke="#3b82f6" strokeWidth="4" />
          <polygon points={`${cx + w * 0.40},${cy} ${cx + w * 0.34},${cy - 7} ${cx + w * 0.34},${cy + 7}`} fill="#3b82f6" />
          <text x={cx + w * 0.30} y={cy - 14} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#3b82f6" fontWeight="700">PULL</text>
          {/* Gravity */}
          <line x1={cx} y1={cy + h * 0.14} x2={cx} y2={cy + h * 0.35} stroke="#22c55e" strokeWidth="3" />
          <polygon points={`${cx},${cy + h * 0.37} ${cx - 6},${cy + h * 0.31} ${cx + 6},${cy + h * 0.31}`} fill="#22c55e" />
          <text x={cx} y={cy + h * 0.45} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#22c55e" fontWeight="700">Gravity</text>
        </g>
      ),
      anchors: [
        { x: cx - w * 0.38, y: cy },
        { x: cx + w * 0.38, y: cy },
        { x: cx, y: cy + h * 0.37 },
        { x: cx, y: cy - h * 0.14 },
        { x: cx - w * 0.30, y: cy - 14 },
        { x: cx + w * 0.30, y: cy - 14 },
      ],
    };
  }

  // ── Default: generic labeled shape ────────────────────────────────────────
  return {
    shape: (
      <g>
        <ellipse cx={cx} cy={cy} rx={w * 0.28} ry={h * 0.32} fill="#e0f2fe" stroke={accent} strokeWidth="2.5" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="600"
          style={{ fontStyle: "italic" }}>Diagram</text>
      </g>
    ),
    anchors: [
      { x: cx, y: cy - h * 0.32 },
      { x: cx + w * 0.28, y: cy },
      { x: cx, y: cy + h * 0.32 },
      { x: cx - w * 0.28, y: cy },
      { x: cx + w * 0.20, y: cy - h * 0.22 },
      { x: cx - w * 0.20, y: cy + h * 0.22 },
    ],
  };
}

// ── Callout box renderer ──────────────────────────────────────────────────────
function renderCallouts(
  labels: Array<{ text: string; x: number; y: number; anchor?: string }>,
  anchors: Array<{ x: number; y: number }>,
  showCallouts: boolean,
  w: number,
  h: number,
  accent: string
) {
  return labels.map((lbl, i) => {
    const anchor = anchors[i] || anchors[anchors.length - 1] || { x: w / 2, y: h / 2 };
    const boxW = 80, boxH = 22;
    const bx = Math.max(2, Math.min(w - boxW - 2, lbl.x - boxW / 2));
    const by = Math.max(2, Math.min(h - boxH - 2, lbl.y - boxH / 2));
    const textLines = wrapText(lbl.text || "", 14);
    const actualBoxH = Math.max(boxH, textLines.length * 14 + 8);
    return (
      <g key={i}>
        <line x1={anchor.x} y1={anchor.y} x2={bx + boxW / 2} y2={by + actualBoxH / 2}
          stroke={accent} strokeWidth="1.2" strokeDasharray="4,3" opacity="0.7" />
        <rect x={bx} y={by} width={boxW} height={actualBoxH} rx="4"
          fill="white" stroke={accent} strokeWidth="1.5" />
        {showCallouts
          ? textLines.map((line, li) => (
            <text key={li} x={bx + boxW / 2} y={by + 10 + li * 13}
              textAnchor="middle" dominantBaseline="hanging"
              fontSize={9} fontFamily="Arial" fill={accent} fontWeight="600">{line}</text>
          ))
          : <line x1={bx + 6} y1={by + actualBoxH / 2} x2={bx + boxW - 6} y2={by + actualBoxH / 2}
            stroke="#d1d5db" strokeWidth="1.5" />
        }
      </g>
    );
  });
}

// ── Main SVGDiagram component ─────────────────────────────────────────────────
export default function SVGDiagram({
  spec,
  width = 560,
  height = 300,
  fontFamily = "Arial, sans-serif",
  fontSize = 13,
  accentColor,
  showCallouts = false,
}: SVGDiagramProps) {
  const w = width, h = height, cx = w / 2, cy = h / 2;
  const accent = accentColor || NAVY;

  if (!spec || !spec.type) return null;

  // ── Circuit diagrams ───────────────────────────────────────────────────────
  if (spec.type === "circuit") {
    const layout = spec.layout || "series";
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        {layout === "parallel" ? <ParallelCircuit w={w} h={h} /> : <SeriesCircuit w={w} h={h} />}
        {spec.title && (
          <text x={cx} y={h - 8} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Flow diagram ───────────────────────────────────────────────────────────
  if (spec.type === "flow" && spec.steps?.length) {
    const steps = spec.steps;
    const boxW = Math.min(100, (w - 40) / steps.length - 20);
    const boxH = 44;
    const spacing = (w - 40) / steps.length;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        {steps.map((step, i) => {
          const bx = 20 + i * spacing;
          const by = cy - boxH / 2;
          const lines = wrapText(step, 12);
          return (
            <g key={i}>
              <rect x={bx} y={by} width={boxW} height={boxH} rx="6"
                fill="#e0f2fe" stroke={accent} strokeWidth="1.5" />
              {lines.map((line, li) => (
                <text key={li} x={bx + boxW / 2} y={by + 14 + li * 13}
                  textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="600">{line}</text>
              ))}
              {i < steps.length - 1 && (
                <>
                  <line x1={bx + boxW + 2} y1={cy} x2={bx + spacing - 8} y2={cy}
                    stroke={accent} strokeWidth="2" />
                  <polygon points={`${bx + spacing - 2},${cy} ${bx + spacing - 10},${cy - 5} ${bx + spacing - 10},${cy + 5}`}
                    fill={accent} />
                </>
              )}
            </g>
          );
        })}
        {spec.title && (
          <text x={cx} y={h - 8} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Cycle diagram ──────────────────────────────────────────────────────────
  if (spec.type === "cycle" && spec.steps?.length) {
    const steps = spec.steps;
    const r = Math.min(w, h) * 0.30;
    const positions = steps.map((_, i) => {
      const angle = (i / steps.length) * 2 * Math.PI - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
    const colors = ["#bfdbfe", "#fde68a", "#fca5a5", "#bbf7d0", "#e9d5ff", "#fed7aa"];
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        <defs>
          <marker id="cycleArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill={accent} />
          </marker>
        </defs>
        {positions.map((pos, i) => {
          const next = positions[(i + 1) % positions.length];
          const midAngle = ((i + 0.5) / steps.length) * 2 * Math.PI - Math.PI / 2;
          const ctrlR = r * 0.65;
          const ctrlX = cx + ctrlR * Math.cos(midAngle);
          const ctrlY = cy + ctrlR * Math.sin(midAngle);
          const lines = wrapText(steps[i], 12);
          const boxW = 80, boxH = Math.max(28, lines.length * 14 + 8);
          return (
            <g key={i}>
              <path d={`M ${pos.x} ${pos.y} Q ${ctrlX} ${ctrlY} ${next.x} ${next.y}`}
                fill="none" stroke={accent} strokeWidth="2" markerEnd="url(#cycleArrow)" />
              <rect x={pos.x - boxW / 2} y={pos.y - boxH / 2} width={boxW} height={boxH}
                rx="6" fill={colors[i % colors.length]} stroke={accent} strokeWidth="1.5" />
              {lines.map((line, li) => (
                <text key={li} x={pos.x} y={pos.y - (lines.length - 1) * 7 + li * 14}
                  textAnchor="middle" dominantBaseline="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="600">{line}</text>
              ))}
            </g>
          );
        })}
        {spec.title && (
          <text x={cx} y={cy} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#9ca3af">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Number line ────────────────────────────────────────────────────────────
  if (spec.type === "number-line") {
    const start = spec.start ?? 0;
    const end = spec.end ?? 10;
    const marked = spec.marked || [];
    const lineY = cy;
    const lineL = w * 0.08, lineR = w * 0.92;
    const range = end - start;
    const toX = (n: number) => lineL + ((n - start) / range) * (lineR - lineL);
    const ticks = Math.min(range, 20);
    const step = range / ticks;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        <line x1={lineL} y1={lineY} x2={lineR} y2={lineY} stroke={accent} strokeWidth="3" />
        <polygon points={`${lineR},${lineY} ${lineR - 8},${lineY - 5} ${lineR - 8},${lineY + 5}`} fill={accent} />
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const val = start + i * step;
          const x = toX(val);
          const isMajor = Number.isInteger(val);
          return (
            <g key={i}>
              <line x1={x} y1={lineY - (isMajor ? 12 : 7)} x2={x} y2={lineY + (isMajor ? 12 : 7)}
                stroke={accent} strokeWidth={isMajor ? 2 : 1.5} />
              {isMajor && (
                <text x={x} y={lineY + 26} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="600">{Math.round(val)}</text>
              )}
            </g>
          );
        })}
        {marked.map((n, i) => (
          <circle key={i} cx={toX(n)} cy={lineY} r={7} fill={accent} opacity={0.85} />
        ))}
        {spec.title && (
          <text x={cx} y={h - 8} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Bar chart ──────────────────────────────────────────────────────────────
  if (spec.type === "bar" && spec.bars?.length) {
    const bars = spec.bars;
    const maxVal = Math.max(...bars.map(b => b.value), 1);
    const chartL = w * 0.12, chartR = w * 0.92, chartT = h * 0.08, chartB = h * 0.78;
    const chartW = chartR - chartL, chartH = chartB - chartT;
    const barW = (chartW / bars.length) * 0.65;
    const gap = (chartW / bars.length) * 0.35;
    const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
    const yTicks = 5;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = chartB - (i / yTicks) * chartH;
          const val = Math.round((i / yTicks) * maxVal);
          return (
            <g key={i}>
              <line x1={chartL} y1={y} x2={chartR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={chartL - 4} y={y + 4} textAnchor="end" fontSize={9} fontFamily="Arial" fill="#6b7280">{val}</text>
            </g>
          );
        })}
        {/* Bars */}
        {bars.map((bar, i) => {
          const bx = chartL + i * (barW + gap) + gap / 2;
          const bh = (bar.value / maxVal) * chartH;
          const by = chartB - bh;
          const lines = wrapText(bar.label, 8);
          return (
            <g key={i}>
              <rect x={bx} y={by} width={barW} height={bh} fill={colors[i % colors.length]} rx="2" opacity="0.85" />
              <text x={bx + barW / 2} y={by - 4} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="600">{bar.value}</text>
              {lines.map((line, li) => (
                <text key={li} x={bx + barW / 2} y={chartB + 14 + li * 11} textAnchor="middle" fontSize={8} fontFamily="Arial" fill="#374151">{line}</text>
              ))}
            </g>
          );
        })}
        {/* Axes */}
        <line x1={chartL} y1={chartT} x2={chartL} y2={chartB} stroke="#374151" strokeWidth="2" />
        <line x1={chartL} y1={chartB} x2={chartR} y2={chartB} stroke="#374151" strokeWidth="2" />
        {spec.yLabel && (
          <text x={chartL - 28} y={cy} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#6b7280"
            transform={`rotate(-90, ${chartL - 28}, ${cy})`}>{spec.yLabel}</text>
        )}
        {spec.xLabel && (
          <text x={cx} y={h - 4} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#6b7280">{spec.xLabel}</text>
        )}
        {spec.title && (
          <text x={cx} y={chartT - 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Axes / Graph (linear, quadratic, scatter) ──────────────────────────────
  if (spec.type === "axes" || spec.type === "graph") {
    const xMin = spec.xMin ?? -5, xMax = spec.xMax ?? 5;
    const yMin = spec.yMin ?? -5, yMax = spec.yMax ?? 5;
    const chartL = w * 0.12, chartR = w * 0.88, chartT = h * 0.08, chartB = h * 0.88;
    const chartW = chartR - chartL, chartH = chartB - chartT;
    const toSvgX = (x: number) => chartL + ((x - xMin) / (xMax - xMin)) * chartW;
    const toSvgY = (y: number) => chartB - ((y - yMin) / (yMax - yMin)) * chartH;
    const axisX = toSvgX(0);
    const axisY = toSvgY(0);
    const xRange = xMax - xMin, yRange = yMax - yMin;
    const xStep = xRange <= 10 ? 1 : xRange <= 20 ? 2 : 5;
    const yStep = yRange <= 10 ? 1 : yRange <= 20 ? 2 : 5;
    const curveColors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

    // Evaluate a simple math expression for curve plotting
    const evalFn = (fn: string, x: number): number | null => {
      try {
        const expr = fn
          .replace(/\^/g, "**")
          .replace(/(\d)(x)/g, "$1*x")
          .replace(/x\^(\d)/g, "x**$1");
        // eslint-disable-next-line no-new-func
        const result = new Function("x", `"use strict"; return (${expr})`)(x);
        if (!isFinite(result) || isNaN(result)) return null;
        return result;
      } catch {
        return null;
      }
    };

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        {/* Grid */}
        {Array.from({ length: Math.floor(xRange / xStep) + 1 }).map((_, i) => {
          const x = xMin + i * xStep;
          const sx = toSvgX(x);
          return <line key={`vg${i}`} x1={sx} y1={chartT} x2={sx} y2={chartB} stroke="#e5e7eb" strokeWidth="1" />;
        })}
        {Array.from({ length: Math.floor(yRange / yStep) + 1 }).map((_, i) => {
          const y = yMin + i * yStep;
          const sy = toSvgY(y);
          return <line key={`hg${i}`} x1={chartL} y1={sy} x2={chartR} y2={sy} stroke="#e5e7eb" strokeWidth="1" />;
        })}
        {/* Axes */}
        <line x1={axisX} y1={chartT} x2={axisX} y2={chartB} stroke="#374151" strokeWidth="2" />
        <line x1={chartL} y1={axisY} x2={chartR} y2={axisY} stroke="#374151" strokeWidth="2" />
        {/* Axis arrows */}
        <polygon points={`${axisX},${chartT} ${axisX - 5},${chartT + 10} ${axisX + 5},${chartT + 10}`} fill="#374151" />
        <polygon points={`${chartR},${axisY} ${chartR - 10},${axisY - 5} ${chartR - 10},${axisY + 5}`} fill="#374151" />
        {/* Tick marks */}
        {Array.from({ length: Math.floor(xRange / xStep) + 1 }).map((_, i) => {
          const x = xMin + i * xStep;
          if (x === 0) return null;
          const sx = toSvgX(x);
          return (
            <g key={`xt${i}`}>
              <line x1={sx} y1={axisY - 4} x2={sx} y2={axisY + 4} stroke="#374151" strokeWidth="1.5" />
              <text x={sx} y={axisY + 14} textAnchor="middle" fontSize={9} fontFamily="Arial" fill="#6b7280">{x}</text>
            </g>
          );
        })}
        {Array.from({ length: Math.floor(yRange / yStep) + 1 }).map((_, i) => {
          const y = yMin + i * yStep;
          if (y === 0) return null;
          const sy = toSvgY(y);
          return (
            <g key={`yt${i}`}>
              <line x1={axisX - 4} y1={sy} x2={axisX + 4} y2={sy} stroke="#374151" strokeWidth="1.5" />
              <text x={axisX - 8} y={sy + 4} textAnchor="end" fontSize={9} fontFamily="Arial" fill="#6b7280">{y}</text>
            </g>
          );
        })}
        {/* Axis labels */}
        {spec.xLabel && (
          <text x={chartR + 4} y={axisY + 4} fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">{spec.xLabel || "x"}</text>
        )}
        {spec.yLabel && (
          <text x={axisX + 4} y={chartT - 4} fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">{spec.yLabel || "y"}</text>
        )}
        {/* Curves */}
        {spec.curves?.map((curve, ci) => {
          const pts: string[] = [];
          const steps = 200;
          for (let i = 0; i <= steps; i++) {
            const x = xMin + (i / steps) * xRange;
            const y = evalFn(curve.fn, x);
            if (y !== null && y >= yMin - 1 && y <= yMax + 1) {
              pts.push(`${toSvgX(x)},${toSvgY(y)}`);
            } else if (pts.length > 0) {
              // Gap in curve (asymptote/discontinuity)
            }
          }
          return (
            <g key={ci}>
              <polyline points={pts.join(" ")} fill="none"
                stroke={curve.color || curveColors[ci % curveColors.length]}
                strokeWidth="2.5"
                strokeDasharray={curve.dashed ? "6,4" : undefined} />
              {curve.label && pts.length > 0 && (
                <text x={chartR - 4} y={toSvgY(evalFn(curve.fn, xMax * 0.8) ?? yMax) - 6}
                  textAnchor="end" fontSize={9} fontFamily="Arial"
                  fill={curve.color || curveColors[ci % curveColors.length]} fontWeight="700">{curve.label}</text>
              )}
            </g>
          );
        })}
        {/* Bars on axes (for bar-on-axes) */}
        {spec.bars?.map((bar, i) => {
          const bx = toSvgX(i + 0.1);
          const bh = Math.abs(toSvgY(0) - toSvgY(bar.value));
          const by = bar.value >= 0 ? toSvgY(bar.value) : toSvgY(0);
          return (
            <rect key={i} x={bx} y={by} width={toSvgX(i + 0.8) - bx} height={bh}
              fill={accent} opacity="0.7" />
          );
        })}
        {/* Plotted points */}
        {spec.points?.map((pt, i) => (
          <g key={i}>
            <circle cx={toSvgX(pt.x)} cy={toSvgY(pt.y)} r={5}
              fill={pt.color || accent} stroke="white" strokeWidth="1.5" />
            {pt.label && (
              <text x={toSvgX(pt.x) + 7} y={toSvgY(pt.y) - 5} fontSize={9} fontFamily="Arial" fill={accent} fontWeight="600">{pt.label}</text>
            )}
          </g>
        ))}
        {spec.title && (
          <text x={cx} y={chartT - 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Venn diagram ───────────────────────────────────────────────────────────
  if (spec.type === "venn") {
    const setA = spec.setA || "Set A";
    const setB = spec.setB || "Set B";
    const onlyA = spec.onlyA || [];
    const onlyB = spec.onlyB || [];
    const overlap = spec.overlap || [];
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        <circle cx={cx - w * 0.14} cy={cy} r={w * 0.24} fill="#bfdbfe" stroke={accent} strokeWidth="2" opacity="0.6" />
        <circle cx={cx + w * 0.14} cy={cy} r={w * 0.24} fill="#fca5a5" stroke={accent} strokeWidth="2" opacity="0.6" />
        <text x={cx - w * 0.26} y={cy - h * 0.26} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="700">{setA}</text>
        <text x={cx + w * 0.26} y={cy - h * 0.26} textAnchor="middle" fontSize={11} fontFamily="Arial" fill={accent} fontWeight="700">{setB}</text>
        {onlyA.slice(0, 4).map((item, i) => (
          <text key={i} x={cx - w * 0.26} y={cy - h * 0.10 + i * 16} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent}>{item}</text>
        ))}
        {onlyB.slice(0, 4).map((item, i) => (
          <text key={i} x={cx + w * 0.26} y={cy - h * 0.10 + i * 16} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent}>{item}</text>
        ))}
        {overlap.slice(0, 4).map((item, i) => (
          <text key={i} x={cx} y={cy - h * 0.10 + i * 16} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent}>{item}</text>
        ))}
        {spec.title && (
          <text x={cx} y={h - 8} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Timeline ───────────────────────────────────────────────────────────────
  if (spec.type === "timeline" && spec.events?.length) {
    const events = spec.events;
    const lineY = cy;
    const lineL = w * 0.06, lineR = w * 0.94;
    const spacing = (lineR - lineL) / (events.length - 1 || 1);
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        <line x1={lineL} y1={lineY} x2={lineR} y2={lineY} stroke={accent} strokeWidth="3" />
        <polygon points={`${lineR},${lineY} ${lineR - 8},${lineY - 5} ${lineR - 8},${lineY + 5}`} fill={accent} />
        {events.map((ev, i) => {
          const ex = lineL + i * spacing;
          const above = i % 2 === 0;
          const lines = wrapText(ev.label, 12);
          return (
            <g key={i}>
              <circle cx={ex} cy={lineY} r={6} fill={accent} />
              <line x1={ex} y1={lineY + (above ? -6 : 6)} x2={ex} y2={lineY + (above ? -h * 0.28 : h * 0.28)} stroke={accent} strokeWidth="1.5" />
              <text x={ex} y={lineY + (above ? -h * 0.32 : h * 0.34)} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent} fontWeight="700">{ev.date}</text>
              {lines.map((line, li) => (
                <text key={li} x={ex} y={lineY + (above ? -h * 0.22 : h * 0.24) + li * 12} textAnchor="middle" fontSize={8} fontFamily="Arial" fill={accent}>{line}</text>
              ))}
            </g>
          );
        })}
        {spec.title && (
          <text x={cx} y={h - 8} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Pyramid ────────────────────────────────────────────────────────────────
  if (spec.type === "pyramid" && spec.levels?.length) {
    const levels = spec.levels;
    const n = levels.length;
    const totalH = h * 0.80;
    const levelH = totalH / n;
    const colors = ["#bfdbfe", "#fde68a", "#fca5a5", "#bbf7d0", "#e9d5ff", "#fed7aa"];
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        {levels.map((level, i) => {
          const ri = n - 1 - i;
          const topW = w * 0.10 + ri * (w * 0.80 / (n - 1 || 1));
          const botW = w * 0.10 + (ri + 1) * (w * 0.80 / (n - 1 || 1));
          const y = h * 0.10 + i * levelH;
          const topX = cx - topW / 2;
          const botX = cx - botW / 2;
          return (
            <g key={i}>
              <polygon points={`${topX},${y} ${topX + topW},${y} ${botX + botW},${y + levelH} ${botX},${y + levelH}`}
                fill={colors[i % colors.length]} stroke={accent} strokeWidth="1.5" />
              <text x={cx} y={y + levelH / 2 + 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="600">{level}</text>
            </g>
          );
        })}
        {spec.title && (
          <text x={cx} y={h - 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Fraction bar ───────────────────────────────────────────────────────────
  if (spec.type === "fraction-bar") {
    const n = spec.numerator ?? 1;
    const d = spec.denominator ?? 4;
    const barW = w * 0.80, barH = h * 0.22;
    const barX = w * 0.10, barY = cy - barH / 2;
    const segW = barW / d;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        {Array.from({ length: d }).map((_, i) => (
          <rect key={i} x={barX + i * segW} y={barY} width={segW} height={barH}
            fill={i < n ? accent : "white"} stroke={accent} strokeWidth="1.5"
            opacity={i < n ? 0.75 : 1} />
        ))}
        <text x={barX + barW / 2} y={barY - 10} textAnchor="middle" fontSize={12} fontFamily="Arial" fill={accent} fontWeight="700">
          {n}/{d} = {spec.fractionLabel || `${n} out of ${d}`}
        </text>
        <text x={barX + (n * segW) / 2} y={barY + barH + 18} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent}>
          Numerator = {n}
        </text
>
        <text x={barX + barW / 2} y={barY + barH + 34} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">
          Denominator = {d}
        </text>
        {spec.title && (
          <text x={cx} y={h - 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Labeled diagram (topic-based) ──────────────────────────────────────────
  if (spec.type === "labeled" || spec.type === "diagram") {
    const topic = (spec.topic || spec.title || "").toLowerCase();
    const labels = spec.labels || [];
    const template = detectDiagramTemplate(topic, w, h, accent);
    if (!template) return null;
    const { shape, anchors } = template;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
        {shape}
        {renderCallouts(labels, anchors, showCallouts, w, h, accent)}
        {spec.title && (
          <text x={cx} y={h - 4} textAnchor="middle" fontSize={10} fontFamily="Arial" fill="#6b7280">{spec.title}</text>
        )}
      </svg>
    );
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ fontFamily }}>
      <rect x={w * 0.05} y={h * 0.05} width={w * 0.90} height={h * 0.90} rx="8"
        fill="#f8fafc" stroke={accent} strokeWidth="2" strokeDasharray="6,4" />
      <text x={cx} y={cy} textAnchor="middle" fontSize={12} fontFamily="Arial" fill={accent} fontStyle="italic">Diagram</text>
    </svg>
  );
}
