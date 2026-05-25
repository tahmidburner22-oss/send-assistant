/**
 * PresentationDiagram - Renders programmatic SVG diagrams from structured data.
 * Used by FullSlideView when a slide has a `diagram` field populated by the AI.
 */
import React from "react";

interface DiagramData {
  kind: "flowchart" | "venn" | "timeline" | "circuit" | "cell" | "water-cycle" | "food-chain" | "equation-graph" | "labelled-box" | "cycle";
  title?: string;
  nodes: Array<{ id: string; label: string; group?: string; x?: number; y?: number }>;
  edges?: Array<{ from: string; to: string; label?: string; style?: "arrow" | "line" | "dashed" }>;
  sets?: Array<{ label: string; items: string[] }>;
  equation?: string;
}

interface DiagramTheme {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  bg: string;
  light: string;
}

// ── Utility helpers ──────────────────────────────────────────────────────────

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Renderers ────────────────────────────────────────────────────────────────

function renderFlowchart(diagram: DiagramData, theme: DiagramTheme) {
  const nodes = diagram.nodes || [];
  const edges = diagram.edges || [];
  const nodeW = 110;
  const nodeH = 32;
  const gapY = 54;
  const cols = Math.min(3, Math.ceil(Math.sqrt(nodes.length)));
  const positions: Record<string, { x: number; y: number }> = {};

  nodes.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = node.x ?? 40 + col * (nodeW + 30);
    const y = node.y ?? 30 + row * gapY;
    positions[node.id] = { x, y };
  });

  return (
    <g>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={theme.secondary} />
        </marker>
      </defs>
      {edges.map((edge, i) => {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (!from || !to) return null;
        const x1 = from.x + nodeW / 2;
        const y1 = from.y + nodeH;
        const x2 = to.x + nodeW / 2;
        const y2 = to.y;
        const dashArray = edge.style === "dashed" ? "4,3" : undefined;
        return (
          <g key={`e-${i}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={theme.secondary} strokeWidth="1.5"
              strokeDasharray={dashArray}
              markerEnd={edge.style !== "line" ? "url(#arrowhead)" : undefined} />
            {edge.label && (
              <text x={(x1 + x2) / 2 + 4} y={(y1 + y2) / 2} fontSize="8" fill={theme.text} textAnchor="start">{edge.label}</text>
            )}
          </g>
        );
      })}
      {nodes.map((node, i) => {
        const pos = positions[node.id];
        return (
          <g key={`n-${i}`}>
            <rect x={pos.x} y={pos.y} width={nodeW} height={nodeH} rx="6" ry="6" fill={theme.primary} />
            <text x={pos.x + nodeW / 2} y={pos.y + nodeH / 2 + 4} fontSize="9" fill="white" textAnchor="middle" fontWeight="bold">
              {node.label.length > 16 ? node.label.slice(0, 15) + "..." : node.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function renderVenn(diagram: DiagramData, theme: DiagramTheme) {
  const sets = diagram.sets || [];
  if (sets.length < 2) return renderLabelledBox(diagram, theme);

  const colors = [theme.primary, theme.accent, theme.secondary];
  const cx1 = 130, cx2 = 270, cx3 = 200;
  const cy = 155;
  const rx = 90, ry = 80;

  return (
    <g>
      {/* Circles */}
      <ellipse cx={cx1} cy={cy} rx={rx} ry={ry} fill={colors[0]} fillOpacity="0.2" stroke={colors[0]} strokeWidth="1.5" />
      <ellipse cx={cx2} cy={cy} rx={rx} ry={ry} fill={colors[1]} fillOpacity="0.2" stroke={colors[1]} strokeWidth="1.5" />
      {sets.length >= 3 && (
        <ellipse cx={cx3} cy={cy + 50} rx={rx * 0.8} ry={ry * 0.7} fill={colors[2]} fillOpacity="0.2" stroke={colors[2]} strokeWidth="1.5" />
      )}
      {/* Labels */}
      <text x={cx1 - 30} y={55} fontSize="10" fill={colors[0]} fontWeight="bold">{sets[0].label}</text>
      <text x={cx2 - 30} y={55} fontSize="10" fill={colors[1]} fontWeight="bold">{sets[1].label}</text>
      {sets.length >= 3 && (
        <text x={cx3 - 30} y={260} fontSize="10" fill={colors[2]} fontWeight="bold">{sets[2].label}</text>
      )}
      {/* Items - left only */}
      {sets[0].items.filter(item => !sets[1].items.includes(item)).slice(0, 4).map((item, i) => (
        <text key={`l-${i}`} x={cx1 - 50} y={110 + i * 18} fontSize="8" fill={theme.text}>{item}</text>
      ))}
      {/* Items - right only */}
      {sets[1].items.filter(item => !sets[0].items.includes(item)).slice(0, 4).map((item, i) => (
        <text key={`r-${i}`} x={cx2 + 10} y={110 + i * 18} fontSize="8" fill={theme.text}>{item}</text>
      ))}
      {/* Shared items */}
      {sets[0].items.filter(item => sets[1].items.includes(item)).slice(0, 3).map((item, i) => (
        <text key={`s-${i}`} x={185} y={140 + i * 18} fontSize="8" fill={theme.text} fontWeight="bold">{item}</text>
      ))}
    </g>
  );
}

function renderTimeline(diagram: DiagramData, theme: DiagramTheme) {
  const nodes = diagram.nodes || [];
  const lineY = 140;
  const startX = 30;
  const endX = 370;
  const spacing = nodes.length > 1 ? (endX - startX) / (nodes.length - 1) : 0;

  return (
    <g>
      <line x1={startX} y1={lineY} x2={endX} y2={lineY} stroke={theme.secondary} strokeWidth="2.5" />
      {nodes.map((node, i) => {
        const x = nodes.length === 1 ? 200 : startX + i * spacing;
        return (
          <g key={`t-${i}`}>
            <circle cx={x} cy={lineY} r="6" fill={theme.accent} />
            <text x={x} y={lineY - 16} fontSize="8" fill={theme.secondary} textAnchor="middle" fontWeight="bold">
              {node.group || ""}
            </text>
            {wrapText(node.label, 14).map((line, li) => (
              <text key={li} x={x} y={lineY + 22 + li * 12} fontSize="7.5" fill={theme.text} textAnchor="middle">{line}</text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

function renderCircuit(diagram: DiagramData, theme: DiagramTheme) {
  const nodes = diagram.nodes || [];
  // Rectangular loop layout
  const cx = 200, cy = 140;
  const hw = 140, hh = 90;
  const perimeter = 2 * (hw + hh) * 2;
  const positions: Record<string, { x: number; y: number }> = {};

  nodes.forEach((node, i) => {
    const dist = (i / nodes.length) * perimeter;
    let x = cx, y = cy;
    if (dist < hw * 2) {
      x = cx - hw + dist; y = cy - hh;
    } else if (dist < hw * 2 + hh * 2) {
      x = cx + hw; y = cy - hh + (dist - hw * 2);
    } else if (dist < hw * 4 + hh * 2) {
      x = cx + hw - (dist - hw * 2 - hh * 2); y = cy + hh;
    } else {
      x = cx - hw; y = cy + hh - (dist - hw * 4 - hh * 2);
    }
    positions[node.id] = { x, y };
  });

  // Simple circuit symbols
  const symbolFor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("battery") || l.includes("cell")) return "B";
    if (l.includes("resistor")) return "R";
    if (l.includes("lamp") || l.includes("bulb") || l.includes("light")) return "L";
    if (l.includes("switch")) return "S";
    if (l.includes("ammeter")) return "A";
    if (l.includes("voltmeter")) return "V";
    return "C";
  };

  return (
    <g>
      {/* Wires connecting in sequence */}
      {nodes.map((node, i) => {
        const next = nodes[(i + 1) % nodes.length];
        const from = positions[node.id];
        const to = positions[next.id];
        if (!from || !to) return null;
        return <line key={`w-${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={theme.text} strokeWidth="1.5" />;
      })}
      {/* Component symbols */}
      {nodes.map((node, i) => {
        const pos = positions[node.id];
        if (!pos) return null;
        const sym = symbolFor(node.label);
        return (
          <g key={`c-${i}`}>
            <circle cx={pos.x} cy={pos.y} r="14" fill="white" stroke={theme.primary} strokeWidth="1.5" />
            <text x={pos.x} y={pos.y + 4} fontSize="10" fill={theme.primary} textAnchor="middle" fontWeight="bold">{sym}</text>
            <text x={pos.x} y={pos.y + 26} fontSize="7" fill={theme.text} textAnchor="middle">{node.label}</text>
          </g>
        );
      })}
    </g>
  );
}

function renderCell(diagram: DiagramData, theme: DiagramTheme) {
  const nodes = diagram.nodes || [];
  const cx = 200, cy = 140;
  const rx = 130, ry = 100;

  return (
    <g>
      {/* Cell outline */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={theme.light} stroke={theme.primary} strokeWidth="2" />
      {/* Nucleus */}
      <ellipse cx={cx} cy={cy} rx={35} ry={28} fill={theme.accent + "40"} stroke={theme.accent} strokeWidth="1.5" />
      <text x={cx} y={cy + 4} fontSize="8" fill={theme.text} textAnchor="middle" fontWeight="bold">Nucleus</text>
      {/* Parts positioned around */}
      {nodes.filter(n => n.label.toLowerCase() !== "nucleus").slice(0, 7).map((node, i) => {
        const angle = (i / Math.min(nodes.length, 7)) * Math.PI * 2 - Math.PI / 2;
        const labelR = rx * 0.6;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;
        const outerX = cx + Math.cos(angle) * (rx + 20);
        const outerY = cy + Math.sin(angle) * (ry + 16);
        return (
          <g key={`p-${i}`}>
            <circle cx={lx} cy={ly} r="3" fill={theme.secondary} />
            <line x1={lx} y1={ly} x2={outerX} y2={outerY} stroke={theme.secondary} strokeWidth="0.8" strokeDasharray="2,2" />
            <text x={outerX} y={outerY + 4} fontSize="7.5" fill={theme.text} textAnchor={outerX > cx ? "start" : "end"}>{node.label}</text>
          </g>
        );
      })}
    </g>
  );
}

function renderCycle(diagram: DiagramData, theme: DiagramTheme) {
  const nodes = diagram.nodes || [];
  const cx = 200, cy = 145;
  const r = 90;

  return (
    <g>
      <defs>
        <marker id="cycle-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={theme.accent} />
        </marker>
      </defs>
      {nodes.map((node, i) => {
        const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const nextAngle = ((i + 1) / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const nx = cx + Math.cos(nextAngle) * r;
        const ny = cy + Math.sin(nextAngle) * r;
        // Arrow between nodes (curved)
        const midAngle = (angle + nextAngle) / 2 + (nextAngle < angle ? Math.PI : 0);
        const controlR = r * 0.65;
        const ctrlX = cx + Math.cos(midAngle) * controlR;
        const ctrlY = cy + Math.sin(midAngle) * controlR;
        return (
          <g key={`cy-${i}`}>
            <path d={`M ${x} ${y} Q ${ctrlX} ${ctrlY} ${nx} ${ny}`}
              fill="none" stroke={theme.accent} strokeWidth="1.5"
              markerEnd="url(#cycle-arrow)" />
            <rect x={x - 40} y={y - 12} width="80" height="24" rx="5" fill={theme.primary} />
            <text x={x} y={y + 4} fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">
              {node.label.length > 14 ? node.label.slice(0, 13) + "..." : node.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function renderWaterCycle(diagram: DiagramData, theme: DiagramTheme) {
  return renderCycle(diagram, theme);
}

function renderFoodChain(diagram: DiagramData, theme: DiagramTheme) {
  const nodes = diagram.nodes || [];
  const edges = diagram.edges || [];
  const nodeW = 90;
  const nodeH = 30;
  const startX = 20;
  const spacing = nodes.length > 1 ? (360 - startX) / nodes.length : 0;
  const y = 130;

  return (
    <g>
      <defs>
        <marker id="fc-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={theme.accent} />
        </marker>
      </defs>
      {nodes.map((node, i) => {
        const x = startX + i * spacing;
        return (
          <g key={`fc-${i}`}>
            {i > 0 && (
              <line x1={x - spacing + nodeW} y1={y + nodeH / 2} x2={x} y2={y + nodeH / 2}
                stroke={theme.accent} strokeWidth="1.5" markerEnd="url(#fc-arrow)" />
            )}
            <rect x={x} y={y} width={nodeW} height={nodeH} rx="6" fill={theme.primary} />
            <text x={x + nodeW / 2} y={y + nodeH / 2 + 4} fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">
              {node.label.length > 12 ? node.label.slice(0, 11) + "..." : node.label}
            </text>
          </g>
        );
      })}
      {/* Edge labels */}
      {edges.slice(0, nodes.length - 1).map((edge, i) => {
        if (!edge.label) return null;
        const x = startX + i * spacing + nodeW + (spacing - nodeW) / 2;
        return (
          <text key={`el-${i}`} x={x} y={y - 8} fontSize="7" fill={theme.text} textAnchor="middle">{edge.label}</text>
        );
      })}
    </g>
  );
}

function renderEquationGraph(diagram: DiagramData, theme: DiagramTheme) {
  const nodes = diagram.nodes || [];
  const eq = diagram.equation || "";
  const originX = 60, originY = 220;
  const axisW = 280, axisH = 180;

  return (
    <g>
      {/* Y axis */}
      <line x1={originX} y1={originY} x2={originX} y2={originY - axisH} stroke={theme.text} strokeWidth="1.5" />
      {/* X axis */}
      <line x1={originX} y1={originY} x2={originX + axisW} y2={originY} stroke={theme.text} strokeWidth="1.5" />
      {/* Axis arrows */}
      <polygon points={`${originX},${originY - axisH} ${originX - 4},${originY - axisH + 8} ${originX + 4},${originY - axisH + 8}`} fill={theme.text} />
      <polygon points={`${originX + axisW},${originY} ${originX + axisW - 8},${originY - 4} ${originX + axisW - 8},${originY + 4}`} fill={theme.text} />
      {/* Axis labels from nodes */}
      {nodes.slice(0, 2).map((node, i) => (
        <text key={`ax-${i}`}
          x={i === 0 ? originX + axisW / 2 : originX - 10}
          y={i === 0 ? originY + 18 : originY - axisH / 2}
          fontSize="9" fill={theme.secondary} textAnchor="middle"
          transform={i === 1 ? `rotate(-90, ${originX - 10}, ${originY - axisH / 2})` : undefined}
        >{node.label}</text>
      ))}
      {/* Simple curve */}
      <path d={`M ${originX + 10} ${originY - 10} Q ${originX + axisW * 0.4} ${originY - axisH * 0.8} ${originX + axisW - 20} ${originY - axisH + 20}`}
        fill="none" stroke={theme.accent} strokeWidth="2" />
      {/* Equation display */}
      {eq && (
        <text x={originX + axisW / 2} y={50} fontSize="11" fill={theme.primary} textAnchor="middle" fontWeight="bold" fontFamily="monospace">{eq}</text>
      )}
    </g>
  );
}

function renderLabelledBox(diagram: DiagramData, theme: DiagramTheme) {
  const nodes = diagram.nodes || [];
  const cx = 200, cy = 140;
  const boxW = 120, boxH = 80;

  return (
    <g>
      {/* Central box */}
      <rect x={cx - boxW / 2} y={cy - boxH / 2} width={boxW} height={boxH} rx="8" fill={theme.light} stroke={theme.primary} strokeWidth="2" />
      <text x={cx} y={cy + 4} fontSize="9" fill={theme.text} textAnchor="middle" fontWeight="bold">{diagram.title || diagram.kind}</text>
      {/* Labels positioned around */}
      {nodes.slice(0, 8).map((node, i) => {
        const angle = (i / Math.min(nodes.length, 8)) * Math.PI * 2 - Math.PI / 2;
        const labelR = 110;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;
        const edgeX = cx + Math.cos(angle) * (boxW / 2 + 5);
        const edgeY = cy + Math.sin(angle) * (boxH / 2 + 5);
        return (
          <g key={`lb-${i}`}>
            <line x1={edgeX} y1={edgeY} x2={lx} y2={ly} stroke={theme.secondary} strokeWidth="0.8" />
            <circle cx={lx} cy={ly} r="3" fill={theme.accent} />
            <text x={lx + (lx > cx ? 6 : -6)} y={ly + 4} fontSize="8" fill={theme.text}
              textAnchor={lx > cx ? "start" : "end"}>{node.label}</text>
          </g>
        );
      })}
    </g>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PresentationDiagram({ diagram, theme }: { diagram: DiagramData; theme: DiagramTheme }) {
  const renderDiagram = () => {
    switch (diagram.kind) {
      case "flowchart": return renderFlowchart(diagram, theme);
      case "venn": return renderVenn(diagram, theme);
      case "timeline": return renderTimeline(diagram, theme);
      case "circuit": return renderCircuit(diagram, theme);
      case "cell": return renderCell(diagram, theme);
      case "water-cycle": return renderWaterCycle(diagram, theme);
      case "food-chain": return renderFoodChain(diagram, theme);
      case "equation-graph": return renderEquationGraph(diagram, theme);
      case "labelled-box": return renderLabelledBox(diagram, theme);
      case "cycle": return renderCycle(diagram, theme);
      default: return renderLabelledBox(diagram, theme);
    }
  };

  return (
    <svg viewBox="0 0 400 280" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: "100%", maxHeight: "100%" }}>
      {diagram.title && (
        <text x="200" y="16" fontSize="10" fill={theme.primary} textAnchor="middle" fontWeight="bold">{diagram.title}</text>
      )}
      {renderDiagram()}
    </svg>
  );
}
