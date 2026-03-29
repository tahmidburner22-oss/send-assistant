/**
 * SVGDiagram — Template-based educational diagram renderer.
 * All diagrams come from a predefined template library — no free-form AI drawing.
 * Chalkie.ai style: clean pre-drawn shapes + callout lines + blank label boxes.
 * No numbers anywhere on diagrams. Student view = blank label boxes.
 * Teacher view (showCallouts=true) = filled label text.
 *
 * Diagram types:
 *   labeled   → subject-specific pre-drawn shape (cell, atom, heart, leaf, etc.)
 *   circuit   → series or parallel circuit
 *   flow      → horizontal process flow
 *   cycle     → circular cycle
 *   number-line, bar, axes, venn, timeline, pyramid, fraction-bar
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
// Each returns an SVG <g> element containing the pre-drawn shape.
// Callout anchor points are returned as {x, y} in SVG coordinates.

interface LabeledTemplate {
  shape: React.ReactElement;
  anchors: Array<{ x: number; y: number }>;
}

function detectDiagramTemplate(title: string, w: number, h: number, accent: string): LabeledTemplate {
  const t = (title || "").toLowerCase();
  const cx = w / 2, cy = h / 2;

  // ── Animal/Plant Cell ──────────────────────────────────────────────────────
  if (/animal.cell|cell.*animal/.test(t)) {
    return {
      shape: (
        <g>
          {/* Cell membrane - irregular oval */}
          <ellipse cx={cx} cy={cy} rx={w * 0.30} ry={h * 0.35} fill="#fef9c3" stroke={accent} strokeWidth="2.5" />
          {/* Nucleus */}
          <ellipse cx={cx - w * 0.05} cy={cy - h * 0.05} rx={w * 0.09} ry={h * 0.10} fill="#bfdbfe" stroke={accent} strokeWidth="1.8" />
          {/* Nucleolus */}
          <circle cx={cx - w * 0.05} cy={cy - h * 0.05} r={w * 0.03} fill={accent} opacity={0.5} />
          {/* Mitochondria */}
          <ellipse cx={cx + w * 0.14} cy={cy + h * 0.08} rx={w * 0.06} ry={h * 0.04} fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          {/* Vacuole */}
          <ellipse cx={cx - w * 0.12} cy={cy + h * 0.12} rx={w * 0.05} ry={h * 0.06} fill="#e0f2fe" stroke={accent} strokeWidth="1.5" />
          {/* Ribosome dots */}
          <circle cx={cx + w * 0.08} cy={cy - h * 0.15} r={3} fill={accent} opacity={0.6} />
          <circle cx={cx + w * 0.12} cy={cy - h * 0.10} r={3} fill={accent} opacity={0.6} />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.35 },           // Cell membrane (top)
        { x: cx - w * 0.05, y: cy - h * 0.15 }, // Nucleus
        { x: cx - w * 0.05, y: cy - h * 0.05 }, // Nucleolus
        { x: cx + w * 0.20, y: cy + h * 0.08 }, // Mitochondria
        { x: cx - w * 0.12, y: cy + h * 0.18 }, // Vacuole
        { x: cx + w * 0.10, y: cy - h * 0.12 }, // Ribosome
      ],
    };
  }

  // ── Plant Cell ─────────────────────────────────────────────────────────────
  if (/plant.cell|cell.*plant/.test(t)) {
    return {
      shape: (
        <g>
          {/* Cell wall - outer rectangle */}
          <rect x={cx - w * 0.30} y={cy - h * 0.35} width={w * 0.60} height={h * 0.70} rx="6" fill="none" stroke={accent} strokeWidth="3.5" />
          {/* Cell membrane - inner rectangle */}
          <rect x={cx - w * 0.27} y={cy - h * 0.32} width={w * 0.54} height={h * 0.64} rx="4" fill="#f0fdf4" stroke={accent} strokeWidth="1.5" />
          {/* Large central vacuole */}
          <rect x={cx - w * 0.12} y={cy - h * 0.15} width={w * 0.24} height={h * 0.30} rx="4" fill="#e0f2fe" stroke={accent} strokeWidth="1.5" />
          {/* Nucleus */}
          <ellipse cx={cx - w * 0.15} cy={cy - h * 0.18} rx={w * 0.08} ry={h * 0.09} fill="#bfdbfe" stroke={accent} strokeWidth="1.8" />
          {/* Chloroplasts */}
          <ellipse cx={cx + w * 0.16} cy={cy - h * 0.20} rx={w * 0.05} ry={h * 0.04} fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx + w * 0.18} cy={cy + h * 0.05} rx={w * 0.05} ry={h * 0.04} fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          {/* Mitochondria */}
          <ellipse cx={cx - w * 0.20} cy={cy + h * 0.15} rx={w * 0.05} ry={h * 0.03} fill="#fde68a" stroke={accent} strokeWidth="1.2" />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.30, y: cy },            // Cell wall
        { x: cx - w * 0.27, y: cy + h * 0.10 }, // Cell membrane
        { x: cx, y: cy },                        // Central vacuole
        { x: cx - w * 0.15, y: cy - h * 0.27 }, // Nucleus
        { x: cx + w * 0.21, y: cy - h * 0.20 }, // Chloroplast
        { x: cx - w * 0.25, y: cy + h * 0.15 }, // Mitochondria
      ],
    };
  }

  // ── Heart ──────────────────────────────────────────────────────────────────
  if (/heart/.test(t)) {
    return {
      shape: (
        <g>
          {/* Heart outline */}
          <path d={`M ${cx} ${cy + h * 0.25}
            C ${cx - w * 0.35} ${cy + h * 0.05} ${cx - w * 0.42} ${cy - h * 0.20} ${cx - w * 0.22} ${cy - h * 0.28}
            C ${cx - w * 0.08} ${cy - h * 0.34} ${cx} ${cy - h * 0.18} ${cx} ${cy - h * 0.10}
            C ${cx} ${cy - h * 0.18} ${cx + w * 0.08} ${cy - h * 0.34} ${cx + w * 0.22} ${cy - h * 0.28}
            C ${cx + w * 0.42} ${cy - h * 0.20} ${cx + w * 0.35} ${cy + h * 0.05} ${cx} ${cy + h * 0.25} Z`}
            fill="#fecaca" stroke={accent} strokeWidth="2.5" />
          {/* Right atrium */}
          <ellipse cx={cx - w * 0.14} cy={cy - h * 0.10} rx={w * 0.10} ry={h * 0.12} fill="#fca5a5" stroke={accent} strokeWidth="1.5" />
          {/* Left atrium */}
          <ellipse cx={cx + w * 0.14} cy={cy - h * 0.10} rx={w * 0.10} ry={h * 0.12} fill="#f87171" stroke={accent} strokeWidth="1.5" />
          {/* Right ventricle */}
          <ellipse cx={cx - w * 0.10} cy={cy + h * 0.08} rx={w * 0.09} ry={h * 0.13} fill="#fca5a5" stroke={accent} strokeWidth="1.5" />
          {/* Left ventricle */}
          <ellipse cx={cx + w * 0.10} cy={cy + h * 0.08} rx={w * 0.09} ry={h * 0.13} fill="#ef4444" stroke={accent} strokeWidth="1.5" />
          {/* Aorta */}
          <path d={`M ${cx + w * 0.05} ${cy - h * 0.22} Q ${cx + w * 0.18} ${cy - h * 0.38} ${cx + w * 0.22} ${cy - h * 0.30}`}
            fill="none" stroke={accent} strokeWidth="3" />
          {/* Septum */}
          <line x1={cx} y1={cy - h * 0.22} x2={cx} y2={cy + h * 0.20} stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" />
        </g>
      ),
      anchors: [
        { x: cx - w * 0.14, y: cy - h * 0.22 }, // Right atrium
        { x: cx + w * 0.14, y: cy - h * 0.22 }, // Left atrium
        { x: cx - w * 0.19, y: cy + h * 0.08 }, // Right ventricle
        { x: cx + w * 0.19, y: cy + h * 0.08 }, // Left ventricle
        { x: cx + w * 0.24, y: cy - h * 0.30 }, // Aorta
        { x: cx, y: cy + h * 0.22 },             // Apex
      ],
    };
  }

  // ── Leaf ───────────────────────────────────────────────────────────────────
  if (/leaf|photosynth/.test(t)) {
    return {
      shape: (
        <g>
          {/* Leaf blade */}
          <path d={`M ${cx} ${cy + h * 0.30}
            C ${cx - w * 0.28} ${cy + h * 0.10} ${cx - w * 0.34} ${cy - h * 0.15} ${cx} ${cy - h * 0.32}
            C ${cx + w * 0.34} ${cy - h * 0.15} ${cx + w * 0.28} ${cy + h * 0.10} ${cx} ${cy + h * 0.30} Z`}
            fill="#bbf7d0" stroke={accent} strokeWidth="2.5" />
          {/* Midrib */}
          <line x1={cx} y1={cy - h * 0.32} x2={cx} y2={cy + h * 0.30} stroke={accent} strokeWidth="2" />
          {/* Veins */}
          <line x1={cx} y1={cy - h * 0.10} x2={cx - w * 0.20} y2={cy - h * 0.20} stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <line x1={cx} y1={cy + h * 0.02} x2={cx + w * 0.22} y2={cy - h * 0.08} stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <line x1={cx} y1={cy + h * 0.12} x2={cx - w * 0.22} y2={cy + h * 0.05} stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <line x1={cx} y1={cy + h * 0.20} x2={cx + w * 0.18} y2={cy + h * 0.14} stroke={accent} strokeWidth="1.2" opacity="0.7" />
          {/* Petiole */}
          <line x1={cx} y1={cy + h * 0.30} x2={cx} y2={cy + h * 0.40} stroke={accent} strokeWidth="2.5" />
          {/* Stomata dots */}
          <ellipse cx={cx - w * 0.08} cy={cy + h * 0.05} rx={4} ry={2} fill={accent} opacity={0.4} />
          <ellipse cx={cx + w * 0.10} cy={cy + h * 0.15} rx={4} ry={2} fill={accent} opacity={0.4} />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.32 },            // Leaf tip
        { x: cx - w * 0.30, y: cy },             // Leaf margin
        { x: cx, y: cy },                        // Midrib
        { x: cx - w * 0.20, y: cy - h * 0.20 }, // Vein
        { x: cx - w * 0.08, y: cy + h * 0.05 }, // Stomata
        { x: cx, y: cy + h * 0.35 },             // Petiole
      ],
    };
  }

  // ── Atom / Atomic structure ────────────────────────────────────────────────
  if (/atom|electron|proton|neutron|nuclear|isotope|shell/.test(t)) {
    return {
      shape: (
        <g>
          {/* Nucleus */}
          <circle cx={cx} cy={cy} r={w * 0.08} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">N</text>
          {/* Electron shells */}
          <ellipse cx={cx} cy={cy} rx={w * 0.20} ry={h * 0.16} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
          <ellipse cx={cx} cy={cy} rx={w * 0.32} ry={h * 0.28} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" transform={`rotate(30, ${cx}, ${cy})`} />
          <ellipse cx={cx} cy={cy} rx={w * 0.40} ry={h * 0.36} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4" transform={`rotate(60, ${cx}, ${cy})`} />
          {/* Electrons on shells */}
          <circle cx={cx + w * 0.20} cy={cy} r={5} fill={accent} />
          <circle cx={cx - w * 0.20} cy={cy} r={5} fill={accent} />
          <circle cx={cx} cy={cy - h * 0.28} r={5} fill={accent} />
          <circle cx={cx} cy={cy + h * 0.28} r={5} fill={accent} />
          <circle cx={cx + w * 0.35} cy={cy - h * 0.18} r={5} fill={accent} opacity={0.8} />
          <circle cx={cx - w * 0.35} cy={cy + h * 0.18} r={5} fill={accent} opacity={0.8} />
        </g>
      ),
      anchors: [
        { x: cx, y: cy },                        // Nucleus
        { x: cx + w * 0.20, y: cy },             // Electron (1st shell)
        { x: cx, y: cy - h * 0.28 },             // Electron (2nd shell)
        { x: cx + w * 0.35, y: cy - h * 0.18 }, // Electron (3rd shell)
        { x: cx, y: cy - h * 0.16 },             // 1st shell orbit
        { x: cx, y: cy - h * 0.36 },             // 3rd shell orbit
      ],
    };
  }

  // ── Eye ────────────────────────────────────────────────────────────────────
  if (/eye/.test(t)) {
    return (
      {
        shape: (
          <g>
            {/* Sclera */}
            <ellipse cx={cx} cy={cy} rx={w * 0.30} ry={h * 0.22} fill="white" stroke={accent} strokeWidth="2.5" />
            {/* Iris */}
            <circle cx={cx} cy={cy} r={h * 0.14} fill="#bfdbfe" stroke={accent} strokeWidth="2" />
            {/* Pupil */}
            <circle cx={cx} cy={cy} r={h * 0.07} fill="#1e293b" />
            {/* Cornea arc */}
            <path d={`M ${cx - w * 0.10} ${cy - h * 0.22} Q ${cx} ${cy - h * 0.30} ${cx + w * 0.10} ${cy - h * 0.22}`}
              fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5" />
            {/* Optic nerve */}
            <line x1={cx + w * 0.30} y1={cy} x2={cx + w * 0.38} y2={cy} stroke={accent} strokeWidth="3" />
            {/* Lens */}
            <ellipse cx={cx - w * 0.06} cy={cy} rx={w * 0.04} ry={h * 0.12} fill="#fef9c3" stroke={accent} strokeWidth="1.5" />
          </g>
        ),
        anchors: [
          { x: cx, y: cy - h * 0.22 },           // Cornea
          { x: cx, y: cy - h * 0.14 },           // Iris
          { x: cx, y: cy },                      // Pupil
          { x: cx - w * 0.06, y: cy - h * 0.12 }, // Lens
          { x: cx + w * 0.30, y: cy - h * 0.08 }, // Sclera
          { x: cx + w * 0.34, y: cy },           // Optic nerve
        ],
      }
    );
  }

  // ── Flower ─────────────────────────────────────────────────────────────────
  if (/flower|pollination|reproduct.*plant/.test(t)) {
    return {
      shape: (
        <g>
          {/* Stem */}
          <line x1={cx} y1={cy + h * 0.40} x2={cx} y2={cy + h * 0.10} stroke={accent} strokeWidth="3" />
          {/* Leaf on stem */}
          <path d={`M ${cx} ${cy + h * 0.25} Q ${cx - w * 0.15} ${cy + h * 0.15} ${cx - w * 0.12} ${cy + h * 0.05}`}
            fill="#bbf7d0" stroke={accent} strokeWidth="1.5" />
          {/* Receptacle */}
          <ellipse cx={cx} cy={cy + h * 0.10} rx={w * 0.07} ry={h * 0.04} fill="#fde68a" stroke={accent} strokeWidth="1.5" />
          {/* Petals */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const px = cx + Math.cos(rad) * w * 0.16;
            const py = cy - h * 0.12 + Math.sin(rad) * h * 0.16;
            return <ellipse key={i} cx={px} cy={py} rx={w * 0.07} ry={h * 0.06}
              fill="#fecaca" stroke={accent} strokeWidth="1.5"
              transform={`rotate(${angle}, ${px}, ${py})`} />;
          })}
          {/* Receptacle centre */}
          <circle cx={cx} cy={cy - h * 0.12} r={w * 0.06} fill="#fde68a" stroke={accent} strokeWidth="2" />
          {/* Stamen/anther */}
          <line x1={cx} y1={cy - h * 0.12} x2={cx + w * 0.08} y2={cy - h * 0.22} stroke={accent} strokeWidth="1.5" />
          <circle cx={cx + w * 0.08} cy={cy - h * 0.22} r={4} fill={accent} />
          {/* Pistil */}
          <line x1={cx} y1={cy - h * 0.12} x2={cx} y2={cy - h * 0.26} stroke={accent} strokeWidth="2" />
          <ellipse cx={cx} cy={cy - h * 0.28} rx={5} ry={4} fill={accent} />
          {/* Sepal */}
          <path d={`M ${cx - w * 0.07} ${cy + h * 0.10} Q ${cx - w * 0.14} ${cy - h * 0.02} ${cx} ${cy - h * 0.02}`}
            fill="#bbf7d0" stroke={accent} strokeWidth="1.2" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.28 },            // Stigma/pistil
        { x: cx + w * 0.08, y: cy - h * 0.22 }, // Anther/stamen
        { x: cx + w * 0.23, y: cy - h * 0.12 }, // Petal
        { x: cx, y: cy + h * 0.10 },            // Sepal/receptacle
        { x: cx - w * 0.15, y: cy + h * 0.20 }, // Leaf
        { x: cx, y: cy + h * 0.40 },            // Stem
      ],
    };
  }

  // ── Human body / skeleton / muscle ────────────────────────────────────────
  if (/skeleton|bone|muscle|body|organ|digestive|respirat|excret/.test(t)) {
    return {
      shape: (
        <g>
          {/* Head */}
          <circle cx={cx} cy={cy - h * 0.35} r={w * 0.09} fill="#fef3c7" stroke={accent} strokeWidth="2" />
          {/* Neck */}
          <line x1={cx} y1={cy - h * 0.26} x2={cx} y2={cy - h * 0.20} stroke={accent} strokeWidth="4" />
          {/* Torso */}
          <rect x={cx - w * 0.12} y={cy - h * 0.20} width={w * 0.24} height={h * 0.36} rx="6"
            fill="#fef9c3" stroke={accent} strokeWidth="2" />
          {/* Arms */}
          <line x1={cx - w * 0.12} y1={cy - h * 0.18} x2={cx - w * 0.28} y2={cy + h * 0.05} stroke={accent} strokeWidth="3.5" />
          <line x1={cx + w * 0.12} y1={cy - h * 0.18} x2={cx + w * 0.28} y2={cy + h * 0.05} stroke={accent} strokeWidth="3.5" />
          {/* Legs */}
          <line x1={cx - w * 0.07} y1={cy + h * 0.16} x2={cx - w * 0.10} y2={cy + h * 0.42} stroke={accent} strokeWidth="4" />
          <line x1={cx + w * 0.07} y1={cy + h * 0.16} x2={cx + w * 0.10} y2={cy + h * 0.42} stroke={accent} strokeWidth="4" />
          {/* Lung indicators */}
          <ellipse cx={cx - w * 0.06} cy={cy - h * 0.10} rx={w * 0.04} ry={h * 0.07} fill="#bfdbfe" stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <ellipse cx={cx + w * 0.06} cy={cy - h * 0.10} rx={w * 0.04} ry={h * 0.07} fill="#bfdbfe" stroke={accent} strokeWidth="1.2" opacity="0.7" />
          {/* Heart indicator */}
          <circle cx={cx - w * 0.03} cy={cy - h * 0.04} r={w * 0.03} fill="#fca5a5" stroke={accent} strokeWidth="1.2" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.35 },            // Head
        { x: cx - w * 0.06, y: cy - h * 0.10 }, // Lungs
        { x: cx - w * 0.03, y: cy - h * 0.04 }, // Heart
        { x: cx, y: cy + h * 0.05 },            // Abdomen
        { x: cx - w * 0.28, y: cy + h * 0.05 }, // Arm
        { x: cx - w * 0.10, y: cy + h * 0.42 }, // Leg
      ],
    };
  }

  // ── Volcano / Tectonic ─────────────────────────────────────────────────────
  if (/volcano|tectonic|plate|earthquake|magma|lava/.test(t)) {
    return {
      shape: (
        <g>
          {/* Ground layer */}
          <rect x={0} y={cy + h * 0.20} width={w} height={h * 0.30} fill="#d1fae5" stroke={accent} strokeWidth="1" opacity="0.5" />
          {/* Mantle layer */}
          <rect x={0} y={cy + h * 0.30} width={w} height={h * 0.20} fill="#fde68a" stroke={accent} strokeWidth="1" opacity="0.5" />
          {/* Volcano cone */}
          <polygon points={`${cx},${cy - h * 0.35} ${cx - w * 0.28},${cy + h * 0.20} ${cx + w * 0.28},${cy + h * 0.20}`}
            fill="#d1d5db" stroke={accent} strokeWidth="2.5" />
          {/* Crater */}
          <ellipse cx={cx} cy={cy - h * 0.35} rx={w * 0.06} ry={h * 0.03} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          {/* Lava flow left */}
          <path d={`M ${cx - w * 0.04} ${cy - h * 0.35} Q ${cx - w * 0.18} ${cy - h * 0.10} ${cx - w * 0.22} ${cy + h * 0.10}`}
            fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
          {/* Lava flow right */}
          <path d={`M ${cx + w * 0.04} ${cy - h * 0.35} Q ${cx + w * 0.16} ${cy - h * 0.05} ${cx + w * 0.20} ${cy + h * 0.15}`}
            fill="none" stroke="#ef4444" strokeWidth="2.5" opacity="0.7" />
          {/* Magma chamber */}
          <ellipse cx={cx} cy={cy + h * 0.32} rx={w * 0.18} ry={h * 0.08} fill="#fca5a5" stroke={accent} strokeWidth="2" />
          {/* Vent */}
          <line x1={cx} y1={cy - h * 0.35} x2={cx} y2={cy + h * 0.32} stroke={accent} strokeWidth="2" strokeDasharray="5,3" opacity="0.6" />
          {/* Tectonic plates */}
          <line x1={0} y1={cy + h * 0.22} x2={cx - w * 0.10} y2={cy + h * 0.22} stroke={accent} strokeWidth="2.5" />
          <line x1={cx + w * 0.10} y1={cy + h * 0.22} x2={w} y2={cy + h * 0.22} stroke={accent} strokeWidth="2.5" />
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.35 },            // Crater
        { x: cx - w * 0.22, y: cy + h * 0.10 }, // Lava flow
        { x: cx, y: cy + h * 0.32 },            // Magma chamber
        { x: cx, y: cy + h * 0.22 },            // Vent
        { x: cx - w * 0.28, y: cy + h * 0.20 }, // Tectonic plate
        { x: cx, y: cy + h * 0.38 },            // Mantle
      ],
    };
  }

  // ── River / Coastal ────────────────────────────────────────────────────────
  if (/river|meander|oxbow|waterfall|delta|estuary|coast|erosion|deposition|longshore/.test(t)) {
    return {
      shape: (
        <g>
          {/* River course - meandering */}
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
          {/* Meander label point */}
          <circle cx={cx + w * 0.20} cy={cy + h * 0.08} r={6} fill={accent} opacity={0.7} />
          {/* Oxbow lake */}
          <ellipse cx={cx - w * 0.05} cy={cy + h * 0.28} rx={w * 0.08} ry={h * 0.06} fill="#bfdbfe" stroke={accent} strokeWidth="1.5" strokeDasharray="4,3" />
          {/* Waterfall indicator */}
          <line x1={cx - w * 0.12} y1={cy + h * 0.20} x2={cx - w * 0.12} y2={cy + h * 0.30} stroke="#60a5fa" strokeWidth="4" opacity="0.8" />
          {/* Bank labels */}
          <line x1={cx + w * 0.05} y1={cy - h * 0.05} x2={cx + w * 0.25} y2={cy - h * 0.15} stroke={accent} strokeWidth="1" opacity="0.5" />
          {/* Source */}
          <circle cx={w * 0.05} cy={cy - h * 0.30} r={6} fill={accent} />
          {/* Mouth */}
          <circle cx={w * 0.90} cy={cy + h * 0.38} r={8} fill="#60a5fa" stroke={accent} strokeWidth="1.5" />
        </g>
      ),
      anchors: [
        { x: w * 0.05, y: cy - h * 0.30 },      // Source
        { x: cx, y: cy - h * 0.05 },             // Upper course
        { x: cx + w * 0.20, y: cy + h * 0.08 }, // Meander
        { x: cx - w * 0.12, y: cy + h * 0.25 }, // Waterfall
        { x: cx - w * 0.05, y: cy + h * 0.28 }, // Oxbow lake
        { x: w * 0.90, y: cy + h * 0.38 },      // Mouth/delta
      ],
    };
  }

  // ── Force diagram ──────────────────────────────────────────────────────────
  if (/force|newton|gravity|friction|weight|normal|tension|thrust|drag|air resist/.test(t)) {
    return {
      shape: (
        <g>
          {/* Object (box) */}
          <rect x={cx - w * 0.12} y={cy - h * 0.12} width={w * 0.24} height={h * 0.24} rx="4"
            fill="#e0f2fe" stroke={accent} strokeWidth="2.5" />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={10} fontFamily="Arial" fill={accent} fontWeight="700">Object</text>
          {/* Weight arrow (down) */}
          <line x1={cx} y1={cy + h * 0.12} x2={cx} y2={cy + h * 0.35} stroke="#ef4444" strokeWidth="3" />
          <polygon points={`${cx},${cy + h * 0.38} ${cx - 6},${cy + h * 0.32} ${cx + 6},${cy + h * 0.32}`} fill="#ef4444" />
          {/* Normal force (up) */}
          <line x1={cx} y1={cy - h * 0.12} x2={cx} y2={cy - h * 0.35} stroke="#22c55e" strokeWidth="3" />
          <polygon points={`${cx},${cy - h * 0.38} ${cx - 6},${cy - h * 0.32} ${cx + 6},${cy - h * 0.32}`} fill="#22c55e" />
          {/* Friction (left) */}
          <line x1={cx - w * 0.12} y1={cy} x2={cx - w * 0.35} y2={cy} stroke="#f59e0b" strokeWidth="3" />
          <polygon points={`${cx - w * 0.38},${cy} ${cx - w * 0.32},${cy - 6} ${cx - w * 0.32},${cy + 6}`} fill="#f59e0b" />
          {/* Applied force (right) */}
          <line x1={cx + w * 0.12} y1={cy} x2={cx + w * 0.35} y2={cy} stroke="#3b82f6" strokeWidth="3" />
          <polygon points={`${cx + w * 0.38},${cy} ${cx + w * 0.32},${cy - 6} ${cx + w * 0.32},${cy + 6}`} fill="#3b82f6" />
          {/* Ground line */}
          <line x1={cx - w * 0.25} y1={cy + h * 0.12} x2={cx + w * 0.25} y2={cy + h * 0.12} stroke={accent} strokeWidth="2" />
          {/* Hatching on ground */}
          {[-3, -1, 1, 3].map(i => (
            <line key={i} x1={cx + i * w * 0.06} y1={cy + h * 0.12} x2={cx + i * w * 0.06 - w * 0.03} y2={cy + h * 0.18}
              stroke={accent} strokeWidth="1.5" opacity="0.5" />
          ))}
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.38 },            // Normal force
        { x: cx, y: cy + h * 0.38 },            // Weight
        { x: cx - w * 0.38, y: cy },            // Friction
        { x: cx + w * 0.38, y: cy },            // Applied force
        { x: cx, y: cy },                       // Object
        { x: cx - w * 0.12, y: cy + h * 0.12 }, // Ground
      ],
    };
  }

  // ── Wave diagram ───────────────────────────────────────────────────────────
  if (/wave|transverse|longitudinal|amplitude|wavelength|frequency|sound|light|electromagnetic/.test(t)) {
    return {
      shape: (
        <g>
          {/* Equilibrium line */}
          <line x1={w * 0.05} y1={cy} x2={w * 0.95} y2={cy} stroke={accent} strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
          {/* Wave */}
          <path d={`M ${w * 0.05} ${cy}
            Q ${w * 0.17} ${cy - h * 0.30} ${w * 0.30} ${cy}
            Q ${w * 0.43} ${cy + h * 0.30} ${w * 0.55} ${cy}
            Q ${w * 0.68} ${cy - h * 0.30} ${w * 0.80} ${cy}
            Q ${w * 0.88} ${cy + h * 0.15} ${w * 0.95} ${cy}`}
            fill="none" stroke={accent} strokeWidth="3" />
          {/* Amplitude arrow */}
          <line x1={w * 0.17} y1={cy} x2={w * 0.17} y2={cy - h * 0.30} stroke="#ef4444" strokeWidth="2" strokeDasharray="3,2" />
          <polygon points={`${w * 0.17},${cy - h * 0.30} ${w * 0.17 - 5},${cy - h * 0.24} ${w * 0.17 + 5},${cy - h * 0.24}`} fill="#ef4444" />
          {/* Wavelength arrow */}
          <line x1={w * 0.05} y1={cy + h * 0.38} x2={w * 0.55} y2={cy + h * 0.38} stroke="#3b82f6" strokeWidth="2" />
          <polygon points={`${w * 0.05},${cy + h * 0.38} ${w * 0.11},${cy + h * 0.35} ${w * 0.11},${cy + h * 0.41}`} fill="#3b82f6" />
          <polygon points={`${w * 0.55},${cy + h * 0.38} ${w * 0.49},${cy + h * 0.35} ${w * 0.49},${cy + h * 0.41}`} fill="#3b82f6" />
          {/* Crest label point */}
          <circle cx={w * 0.30} cy={cy - h * 0.30} r={5} fill={accent} opacity={0.7} />
          {/* Trough label point */}
          <circle cx={w * 0.55} cy={cy + h * 0.30} r={5} fill={accent} opacity={0.7} />
        </g>
      ),
      anchors: [
        { x: w * 0.30, y: cy - h * 0.30 },      // Crest
        { x: w * 0.55, y: cy + h * 0.30 },      // Trough
        { x: w * 0.17, y: cy - h * 0.15 },      // Amplitude
        { x: w * 0.30, y: cy + h * 0.38 },      // Wavelength
        { x: w * 0.05, y: cy },                 // Equilibrium line
        { x: w * 0.80, y: cy - h * 0.30 },      // Direction of travel
      ],
    };
  }

  // ── Particle model / States of matter ─────────────────────────────────────
  if (/particle|solid|liquid|gas|state.*matter|matter.*state/.test(t)) {
    const boxW = w * 0.26, boxH = h * 0.55;
    const solidX = w * 0.05, liquidX = w * 0.37, gasX = w * 0.68;
    const boxY = cy - boxH / 2;
    const particleR = 8;
    const solidPositions = [[0.5, 0.2], [0.5, 0.5], [0.5, 0.8], [0.25, 0.35], [0.75, 0.35], [0.25, 0.65], [0.75, 0.65]];
    const liquidPositions = [[0.3, 0.6], [0.6, 0.55], [0.45, 0.75], [0.2, 0.80], [0.7, 0.78], [0.5, 0.40], [0.25, 0.45]];
    const gasPositions = [[0.2, 0.2], [0.7, 0.3], [0.4, 0.55], [0.8, 0.7], [0.15, 0.75], [0.6, 0.15], [0.85, 0.45]];
    return {
      shape: (
        <g>
          {/* Solid box */}
          <rect x={solidX} y={boxY} width={boxW} height={boxH} rx="4" fill="#e0f2fe" stroke={accent} strokeWidth="2" />
          <text x={solidX + boxW / 2} y={boxY + boxH + 14} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Solid</text>
          {solidPositions.map(([fx, fy], i) => (
            <circle key={i} cx={solidX + fx * boxW} cy={boxY + fy * boxH} r={particleR}
              fill={accent} opacity={0.8} />
          ))}
          {/* Liquid box */}
          <rect x={liquidX} y={boxY} width={boxW} height={boxH} rx="4" fill="#bfdbfe" stroke={accent} strokeWidth="2" />
          <text x={liquidX + boxW / 2} y={boxY + boxH + 14} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Liquid</text>
          {liquidPositions.map(([fx, fy], i) => (
            <circle key={i} cx={liquidX + fx * boxW} cy={boxY + fy * boxH} r={particleR}
              fill={accent} opacity={0.7} />
          ))}
          {/* Gas box */}
          <rect x={gasX} y={boxY} width={boxW} height={boxH} rx="4" fill="#f0fdf4" stroke={accent} strokeWidth="2" />
          <text x={gasX + boxW / 2} y={boxY + boxH + 14} textAnchor="middle" fontSize={9} fontFamily="Arial" fill={accent} fontWeight="700">Gas</text>
          {gasPositions.map(([fx, fy], i) => (
            <circle key={i} cx={gasX + fx * boxW} cy={boxY + fy * boxH} r={particleR}
              fill={accent} opacity={0.5} />
          ))}
        </g>
      ),
      anchors: [
        { x: solidX + boxW / 2, y: boxY - 8 },        // Solid label
        { x: liquidX + boxW / 2, y: boxY - 8 },       // Liquid label
        { x: gasX + boxW / 2, y: boxY - 8 },          // Gas label
        { x: solidX + boxW * 0.5, y: boxY + boxH * 0.5 }, // Particle arrangement (solid)
        { x: liquidX + boxW * 0.5, y: boxY + boxH * 0.7 }, // Particle arrangement (liquid)
        { x: gasX + boxW * 0.5, y: boxY + boxH * 0.3 },   // Particle arrangement (gas)
      ],
    };
  }

  // ── DNA / Genetics ─────────────────────────────────────────────────────────
  if (/dna|gene|chromosome|heredit|inherit|allele|genotype|phenotype|mutation/.test(t)) {
    return {
      shape: (
        <g>
          {/* Double helix backbone strands */}
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
          {/* Base pairs (rungs) */}
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
        { x: cx - w * 0.10, y: cy - h * 0.40 }, // Sugar-phosphate backbone (1)
        { x: cx + w * 0.10, y: cy - h * 0.40 }, // Sugar-phosphate backbone (2)
        { x: cx - w * 0.04, y: cy - h * 0.30 }, // Base pair
        { x: cx, y: cy - h * 0.15 },            // Hydrogen bond
        { x: cx - w * 0.18, y: cy },            // Deoxyribose sugar
        { x: cx, y: cy + h * 0.40 },            // Double helix
      ],
    };
  }

  // ── Geography: Water cycle ─────────────────────────────────────────────────
  if (/water.cycle|hydrological|precipitation|evaporation|transpiration|condensation|runoff/.test(t)) {
    return {
      shape: (
        <g>
          {/* Sky/cloud area */}
          <ellipse cx={cx} cy={cy - h * 0.30} rx={w * 0.22} ry={h * 0.12} fill="#e0f2fe" stroke={accent} strokeWidth="2" />
          <ellipse cx={cx - w * 0.10} cy={cy - h * 0.33} rx={w * 0.12} ry={h * 0.09} fill="#bfdbfe" stroke={accent} strokeWidth="1.5" />
          <ellipse cx={cx + w * 0.10} cy={cy - h * 0.33} rx={w * 0.12} ry={h * 0.09} fill="#bfdbfe" stroke={accent} strokeWidth="1.5" />
          {/* Sun */}
          <circle cx={w * 0.82} cy={cy - h * 0.35} r={w * 0.07} fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          {/* Mountain */}
          <polygon points={`${w * 0.70},${cy + h * 0.20} ${w * 0.85},${cy - h * 0.10} ${w * 0.95},${cy + h * 0.20}`}
            fill="#d1d5db" stroke={accent} strokeWidth="2" />
          {/* Ground */}
          <rect x={0} y={cy + h * 0.20} width={w} height={h * 0.20} fill="#bbf7d0" stroke={accent} strokeWidth="1" opacity="0.6" />
          {/* Sea/lake */}
          <ellipse cx={w * 0.20} cy={cy + h * 0.28} rx={w * 0.18} ry={h * 0.08} fill="#60a5fa" stroke={accent} strokeWidth="2" opacity="0.8" />
          {/* Evaporation arrows */}
          <path d={`M ${w * 0.20} ${cy + h * 0.20} Q ${w * 0.15} ${cy - h * 0.05} ${cx - w * 0.12} ${cy - h * 0.25}`}
            fill="none" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrowW)" />
          {/* Precipitation arrows */}
          {[0, 1, 2].map(i => (
            <line key={i} x1={cx - w * 0.08 + i * w * 0.06} y1={cy - h * 0.18} x2={cx - w * 0.10 + i * w * 0.06} y2={cy - h * 0.05}
              stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowW)" />
          ))}
          {/* Runoff arrow */}
          <path d={`M ${w * 0.70} ${cy + h * 0.20} Q ${w * 0.50} ${cy + h * 0.28} ${w * 0.38} ${cy + h * 0.28}`}
            fill="none" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arrowW)" />
          <defs>
            <marker id="arrowW" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill={accent} />
            </marker>
          </defs>
        </g>
      ),
      anchors: [
        { x: cx, y: cy - h * 0.33 },            // Cloud / condensation
        { x: w * 0.82, y: cy - h * 0.35 },      // Sun / solar energy
        { x: w * 0.20, y: cy + h * 0.28 },      // Sea / lake
        { x: w * 0.15, y: cy - h * 0.05 },      // Evaporation
        { x: cx - w * 0.08, y: cy - h * 0.10 }, // Precipitation
        { x: w * 0.55, y: cy + h * 0.28 },      // Surface runoff
      ],
    };
  }

  // ── Default: clean geometric shape with label positions ───────────────────
  return {
    shape: (
      <g>
        {/* Clean rounded rectangle — generic but professional */}
        <rect x={cx - w * 0.30} y={cy - h * 0.32} width={w * 0.60} height={h * 0.64} rx="12"
          fill="#f1f5f9" stroke={accent} strokeWidth="2.5" />
        {/* Inner detail lines */}
        <line x1={cx - w * 0.20} y1={cy - h * 0.10} x2={cx + w * 0.20} y2={cy - h * 0.10}
          stroke={accent} strokeWidth="1.5" opacity="0.4" />
        <line x1={cx - w * 0.20} y1={cy + h * 0.05} x2={cx + w * 0.20} y2={cy + h * 0.05}
          stroke={accent} strokeWidth="1.5" opacity="0.4" />
        <circle cx={cx} cy={cy - h * 0.20} r={w * 0.06} fill={accent} opacity={0.15} stroke={accent} strokeWidth="1.5" />
      </g>
    ),
    anchors: [
      { x: cx, y: cy - h * 0.32 },
      { x: cx + w * 0.30, y: cy - h * 0.10 },
      { x: cx + w * 0.30, y: cy + h * 0.15 },
      { x: cx, y: cy + h * 0.32 },
      { x: cx - w * 0.30, y: cy + h * 0.15 },
      { x: cx - w * 0.30, y: cy - h * 0.10 },
    ],
  };
}

// ── Callout line + label box renderer ────────────────────────────────────────
function renderCallouts(
  labels: Array<{ text: string; x?: number; y?: number }>,
  anchors: Array<{ x: number; y: number }>,
  w: number,
  h: number,
  accent: string,
  showCallouts: boolean,
  fontFamily: string,
  fontSize: number,
) {
  const labelBoxW = 110;
  const labelBoxH = 28;
  const n = labels.length;

  return labels.map((label, i) => {
    const anchor = anchors[i] || anchors[anchors.length - 1] || { x: w / 2, y: h / 2 };
    const goLeft = anchor.x > w / 2;
    const labelX = goLeft ? 4 : w - labelBoxW - 4;
    const labelY = Math.max(8, Math.min(h - labelBoxH - 8,
      anchor.y - labelBoxH / 2 + (i - n / 2) * (labelBoxH + 6)));
    const elbowX = goLeft ? labelX + labelBoxW : labelX;
    const labelText = label.text || "";
    const wrappedLines = wrapText(labelText, Math.floor((labelBoxW - 10) / (fontSize * 0.58)));
    const actualBoxH = Math.max(labelBoxH, wrappedLines.length * (fontSize + 4) + 8);

    return (
      <g key={i}>
        {/* Callout line from anchor to label box */}
        <line
          x1={anchor.x} y1={anchor.y}
          x2={elbowX} y2={labelY + actualBoxH / 2}
          stroke={accent} strokeWidth="1.2" opacity="0.55"
          strokeDasharray="4,3"
        />
        {/* Label box */}
        <rect x={labelX} y={labelY} width={labelBoxW} height={actualBoxH} rx="4"
          fill="white" stroke={accent} strokeWidth="1.5" />
        {/* Label content: text (teacher) or blank dashed line (student) */}
        {showCallouts ? (
          wrappedLines.map((line, li) => (
            <text key={li}
              x={labelX + labelBoxW / 2}
              y={labelY + actualBoxH / 2 - ((wrappedLines.length - 1) * (fontSize + 4)) / 2 + li * (fontSize + 4)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={fontSize} fontFamily={fontFamily} fill="#1e293b" fontWeight="500">
              {line}
            </text>
          ))
        ) : (
          <line
            x1={labelX + 8} y1={labelY + actualBoxH / 2 + 2}
            x2={labelX + labelBoxW - 8} y2={labelY + actualBoxH / 2 + 2}
            stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
        )}
      </g>
    );
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SVGDiagram({
  spec,
  width = 500,
  height = 280,
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
    const layout = (spec as any).layout || "series";
    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={14} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {layout === "parallel"
          ? <ParallelCircuit w={width} h={height} />
          : <SeriesCircuit w={width} h={height} />}
        {/* Component labels — shown in teacher view only */}
        {showCallouts && (spec.labels || []).map((l: any, i: number) => {
          const lx = pad + (l.x / 100) * (width - pad * 2);
          const ly = pad + (l.y / 100) * (height - pad * 2);
          return (
            <text key={i} x={lx} y={ly - 8} textAnchor="middle"
              fontSize={fontSize - 1} fontFamily={fontFamily} fill={accentColor} fontWeight="600">
              {l.text}
            </text>
          );
        })}
      </svg>
    );
  }

  // ── LABELED DIAGRAM ─────────────────────────────────────────────────────────
  if (spec.type === "labeled") {
    const labels = spec.labels || [];
    if (labels.length === 0) return null;

    const diagramTitle = spec.title || "";
    const template = detectDiagramTemplate(diagramTitle, width, height, accentColor);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={14} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {/* Pre-drawn subject-specific shape */}
        {template.shape}
        {/* Callout lines and label boxes */}
        {renderCallouts(labels, template.anchors, width, height, accentColor, showCallouts, fontFamily, fontSize)}
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
    const arrowGap = 20;
    const boxW = Math.max(100, Math.min(160, (flowW - 40 - (n - 1) * (arrowGap + 8)) / n));
    const boxH = 52;
    const totalW = n * boxW + (n - 1) * (arrowGap + 8);
    const startX = (flowW - totalW) / 2;
    const midY = flowH / 2 + (spec.title ? 8 : 0);
    const maxStepLen = Math.max(...steps.map((s: string) => s.length));
    const flowFontSize = maxStepLen > 25 ? Math.max(7, fontSize - 3) : maxStepLen > 18 ? Math.max(8, fontSize - 2) : fontSize - 1;
    const maxCharsPerLine = Math.floor(boxW / (flowFontSize * 0.52));

    return (
      <svg viewBox={`0 0 ${flowW} ${flowH}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: flowW, display: "block", background: "white" }}>
        {spec.title && (
          <text x={flowW / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        {steps.map((step: string, i: number) => {
          const bx = startX + i * (boxW + arrowGap + 8);
          const by = midY - boxH / 2;
          const textLines = wrapText(step, maxCharsPerLine);
          const lineH = flowFontSize + 3;
          const textStartY = by + boxH / 2 - ((textLines.length - 1) * lineH) / 2;
          return (
            <g key={i}>
              <rect x={bx} y={by} width={boxW} height={boxH} rx="6"
                fill={accentColor} opacity={0.85 - i * 0.03} />
              {textLines.map((line: string, li: number) => (
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
    const maxStepLen = Math.max(...steps.map((s: string) => s.length), 6);
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
        {steps.map((step: string, i: number) => {
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
              {textLines.map((line: string, li: number) => (
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
              <line x1={x} y1={lineY - 8} x2={x} y2={lineY + 8}
                stroke={isMarked ? accentColor : "#374151"} strokeWidth={isMarked ? 2.5 : 1.5} />
              <text x={x} y={lineY + 22} textAnchor="middle" fontSize={fontSize}
                fontFamily={fontFamily} fill={isMarked ? accentColor : "#374151"}
                fontWeight={isMarked ? "700" : "400"}>{n}</text>
              {isMarked && <circle cx={x} cy={lineY} r="6" fill={accentColor} opacity="0.2" />}
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
    const maxVal = Math.max(...bars.map((b: any) => b.value), 1);
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
        {bars.map((bar: any, i: number) => {
          const barH = (bar.value / maxVal) * chartH;
          const bx = chartPad.left + gap + i * (barW + gap);
          const by = chartPad.top + chartH - barH;
          const barLabel = bar.label || "";
          const barLabelSize = barLabel.length > 12 ? Math.max(7, fontSize - 3) : fontSize - 2;
          const barLabelLines = wrapText(barLabel, Math.floor(barW / (barLabelSize * 0.5)));
          return (
            <g key={i}>
              <rect x={bx} y={by} width={barW} height={barH} rx="3"
                fill={accentColor} opacity={0.75 + (i % 2) * 0.15} />
              <text x={bx + barW / 2} y={by - 4} textAnchor="middle"
                fontSize={fontSize - 1} fontFamily={fontFamily} fill={accentColor} fontWeight="600">{bar.value}</text>
              {barLabelLines.map((line: string, li: number) => (
                <text key={li} x={bx + barW / 2} y={chartPad.top + chartH + 14 + li * (barLabelSize + 2)}
                  textAnchor="middle" fontSize={barLabelSize} fontFamily={fontFamily} fill="#374151">{line}</text>
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
        <circle cx={cx - offset} cy={cy} r={circleR} fill={accentColor} opacity="0.12" stroke={accentColor} strokeWidth="2" />
        <circle cx={cx + offset} cy={cy} r={circleR} fill="#dc2626" opacity="0.10" stroke="#dc2626" strokeWidth="2" />
        <text x={cx - offset - circleR * 0.4} y={cy - circleR - 6} textAnchor="middle"
          fontSize={fontSize} fontFamily={fontFamily} fill={accentColor} fontWeight="700">{setA}</text>
        <text x={cx + offset + circleR * 0.4} y={cy - circleR - 6} textAnchor="middle"
          fontSize={fontSize} fontFamily={fontFamily} fill="#dc2626" fontWeight="700">{setB}</text>
        {showCallouts && onlyA.map((item: string, i: number) => (
          <text key={`a${i}`} x={cx - offset - circleR * 0.35} y={cy - circleR * 0.3 + i * (itemFontSize + 4)}
            textAnchor="middle" fontSize={itemFontSize} fontFamily={fontFamily} fill="#1e293b">{item}</text>
        ))}
        {showCallouts && overlap.map((item: string, i: number) => (
          <text key={`o${i}`} x={cx} y={cy - (overlap.length - 1) * (itemFontSize + 4) / 2 + i * (itemFontSize + 4)}
            textAnchor="middle" fontSize={itemFontSize} fontFamily={fontFamily} fill="#1e293b" fontWeight="600">{item}</text>
        ))}
        {showCallouts && onlyB.map((item: string, i: number) => (
          <text key={`b${i}`} x={cx + offset + circleR * 0.35} y={cy - circleR * 0.3 + i * (itemFontSize + 4)}
            textAnchor="middle" fontSize={itemFontSize} fontFamily={fontFamily} fill="#1e293b">{item}</text>
        ))}
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
    const lineX1 = 30, lineX2 = timelineW - 30;
    const eventSpacing = (lineX2 - lineX1) / (n - 1 || 1);
    const eventFontSize = Math.max(7, fontSize - 2);

    return (
      <svg viewBox={`0 0 ${timelineW} ${timelineH}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: timelineW, display: "block", background: "white" }}>
        {spec.title && (
          <text x={timelineW / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        <line x1={lineX1} y1={lineY} x2={lineX2} y2={lineY} stroke={accentColor} strokeWidth="2.5" />
        <polygon points={`${lineX2 + 8},${lineY} ${lineX2},${lineY - 5} ${lineX2},${lineY + 5}`} fill={accentColor} />
        {events.map((event: any, i: number) => {
          const ex = lineX1 + i * eventSpacing;
          const above = i % 2 === 0;
          const dateY = above ? lineY - 28 : lineY + 36;
          const labelY = above ? lineY - 44 : lineY + 52;
          const tickEnd = above ? lineY - 18 : lineY + 18;
          const dateLines = wrapText(event.date || "", 12);
          const labelLines = wrapText(event.label || "", 14);
          return (
            <g key={i}>
              <line x1={ex} y1={lineY} x2={ex} y2={tickEnd} stroke={accentColor} strokeWidth="1.5" />
              <circle cx={ex} cy={lineY} r="4" fill={accentColor} />
              {dateLines.map((dl: string, di: number) => (
                <text key={`d${di}`} x={ex} y={dateY + di * (eventFontSize + 2)} textAnchor="middle"
                  fontSize={eventFontSize} fontFamily={fontFamily} fill={accentColor} fontWeight="700">{dl}</text>
              ))}
              {showCallouts && labelLines.map((ll: string, li: number) => (
                <text key={`l${li}`} x={ex} y={labelY + li * (eventFontSize + 2)} textAnchor="middle"
                  fontSize={eventFontSize} fontFamily={fontFamily} fill="#374151">{ll}</text>
              ))}
              {!showCallouts && (
                <line x1={ex - 20} y1={labelY} x2={ex + 20} y2={labelY}
                  stroke="#d1d5db" strokeWidth="1" strokeDasharray="3,2" />
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
    const pyrW = width, pyrH = Math.max(height, n * 36 + 40);
    const topX = pyrW / 2, topY = 30;
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
        {levels.map((level: string, i: number) => {
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
              <polygon
                points={`${topX - topW / 2},${y} ${topX + topW / 2},${y} ${topX + botW / 2},${y + levelH} ${topX - botW / 2},${y + levelH}`}
                fill={accentColor} opacity={opacity} stroke="white" strokeWidth="2" />
              {showCallouts && textLines.map((line: string, li: number) => (
                <text key={li} x={topX} y={textMidY - ((textLines.length - 1) * lineH) / 2 + li * lineH}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={pyrFontSize} fontFamily={fontFamily} fill="white" fontWeight="600">{line}</text>
              ))}
              {!showCallouts && (
                <line x1={topX - botW * 0.3} y1={textMidY} x2={topX + botW * 0.3} y2={textMidY}
                  stroke="white" strokeWidth="1" strokeDasharray="3,2" opacity="0.7" />
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
    const barX = pad + 10, barY = height / 2 - 16;
    const barW = width - pad * 2 - 20, barH = 32;
    const segW = barW / denom;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: width, display: "block", background: "white" }}>
        {spec.title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={fontSize + 1}
            fontFamily={fontFamily} fill={accentColor} fontWeight="700">{spec.title}</text>
        )}
        <text x={width / 2} y={barY - 8} textAnchor="middle"
          fontSize={fontSize + 2} fontFamily={fontFamily} fill={accentColor} fontWeight="700">{label}</text>
        {Array.from({ length: denom }, (_, i) => {
          const sx = barX + i * segW;
          const filled = i < numer;
          return (
            <g key={i}>
              <rect x={sx} y={barY} width={segW} height={barH} rx="2"
                fill={filled ? accentColor : "#f1f5f9"}
                stroke={accentColor} strokeWidth="1.5" opacity={filled ? 0.8 : 1} />
              <text x={sx + segW / 2} y={barY + barH + 16} textAnchor="middle"
                fontSize={fontSize - 2} fontFamily={fontFamily} fill="#6b7280">{`1/${denom}`}</text>
            </g>
          );
        })}
        <rect x={barX} y={barY} width={barW} height={barH} rx="2"
          fill="none" stroke={accentColor} strokeWidth="2" />
      </svg>
    );
  }

  return null;
}
