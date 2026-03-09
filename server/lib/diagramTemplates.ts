/**
 * diagramTemplates.ts
 * Hand-coded, pixel-perfect SVG templates for common UK school educational diagrams.
 * Each template is a function returning { svg, caption }.
 * Templates are matched by subject + topic keywords before falling back to AI generation.
 */

export interface DiagramTemplate {
  svg: string;
  caption: string;
}

// ── Helper: standard SVG wrapper ─────────────────────────────────────────────
function svg(content: string): string {
  return `<svg viewBox="0 0 700 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">
  <rect width="700" height="500" fill="white"/>
  ${content}
</svg>`;
}

function label(x: number, y: number, text: string, size = 13, bold = false, color = "#111827"): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size}" fill="${color}" font-weight="${bold ? "bold" : "normal"}">${text}</text>`;
}

function leaderLine(x1: number, y1: number, x2: number, y2: number): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6b7280" stroke-width="1" stroke-dasharray="4,2"/>`;
}

// ── BIOLOGY: Plant Cell ───────────────────────────────────────────────────────
function plantCell(): DiagramTemplate {
  const s = svg(`
  <!-- Title -->
  <text x="350" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Plant Cell</text>

  <!-- Cell wall (outer thick border) -->
  <rect x="180" y="55" width="280" height="340" fill="#d1fae5" stroke="#059669" stroke-width="4" rx="8"/>
  <!-- Cell membrane (inner thin border) -->
  <rect x="192" y="67" width="256" height="316" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5" rx="4"/>

  <!-- Large central vacuole -->
  <ellipse cx="320" cy="235" rx="90" ry="110" fill="#bfdbfe" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="320" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#1d4ed8">Central</text>
  <text x="320" y="245" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#1d4ed8">Vacuole</text>

  <!-- Nucleus -->
  <ellipse cx="265" cy="155" rx="38" ry="28" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
  <!-- Nucleolus -->
  <ellipse cx="265" cy="155" rx="12" ry="10" fill="#fde68a" stroke="#ca8a04" stroke-width="1"/>
  <text x="265" y="159" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#92400e">nucleolus</text>

  <!-- Chloroplasts (3) -->
  <ellipse cx="225" cy="290" rx="22" ry="12" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
  <ellipse cx="260" cy="320" rx="22" ry="12" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>
  <ellipse cx="380" cy="160" rx="22" ry="12" fill="#86efac" stroke="#16a34a" stroke-width="1.5"/>

  <!-- Mitochondria (2) -->
  <ellipse cx="390" cy="310" rx="18" ry="10" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>
  <ellipse cx="215" cy="185" rx="18" ry="10" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>

  <!-- ── Leader lines + labels (right side) ── -->
  <!-- Cell Wall -->
  ${leaderLine(460, 80, 510, 65)}
  <text x="515" y="69" font-family="Arial, sans-serif" font-size="12" fill="#111827" font-weight="bold">Cell Wall</text>

  <!-- Cell Membrane -->
  ${leaderLine(448, 100, 510, 95)}
  <text x="515" y="99" font-family="Arial, sans-serif" font-size="12" fill="#111827">Cell Membrane</text>

  <!-- Nucleus -->
  ${leaderLine(303, 148, 510, 130)}
  <text x="515" y="134" font-family="Arial, sans-serif" font-size="12" fill="#111827">Nucleus</text>

  <!-- Chloroplast -->
  ${leaderLine(402, 160, 510, 165)}
  <text x="515" y="169" font-family="Arial, sans-serif" font-size="12" fill="#111827">Chloroplast</text>

  <!-- Vacuole -->
  ${leaderLine(410, 235, 510, 200)}
  <text x="515" y="204" font-family="Arial, sans-serif" font-size="12" fill="#111827">Vacuole</text>

  <!-- Mitochondria -->
  ${leaderLine(408, 310, 510, 235)}
  <text x="515" y="239" font-family="Arial, sans-serif" font-size="12" fill="#111827">Mitochondria</text>

  <!-- ── Leader lines + labels (left side) ── -->
  <!-- Cytoplasm -->
  ${leaderLine(192, 370, 140, 385)}
  <text x="60" y="389" font-family="Arial, sans-serif" font-size="12" fill="#111827">Cytoplasm</text>

  <!-- Chloroplast (left) -->
  ${leaderLine(203, 290, 140, 310)}
  <text x="55" y="314" font-family="Arial, sans-serif" font-size="12" fill="#111827">Chloroplast</text>
`);
  return { svg: s, caption: "Plant cell cross-section showing cell wall, cell membrane, nucleus, vacuole, chloroplasts, and mitochondria." };
}

// ── BIOLOGY: Animal Cell ──────────────────────────────────────────────────────
function animalCell(): DiagramTemplate {
  const s = svg(`
  <!-- Title -->
  <text x="350" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Animal Cell</text>

  <!-- Cell membrane (irregular oval) -->
  <ellipse cx="310" cy="255" rx="175" ry="155" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>

  <!-- Nucleus -->
  <ellipse cx="295" cy="235" rx="55" ry="45" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/>
  <!-- Nucleolus -->
  <ellipse cx="295" cy="235" rx="18" ry="15" fill="#93c5fd" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="295" y="239" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#1e40af">nucleolus</text>

  <!-- Mitochondria (3) -->
  <ellipse cx="390" cy="190" rx="24" ry="13" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>
  <ellipse cx="200" cy="300" rx="24" ry="13" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>
  <ellipse cx="380" cy="320" rx="24" ry="13" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>

  <!-- Ribosomes (dots) -->
  <circle cx="240" cy="180" r="4" fill="#a78bfa"/>
  <circle cx="355" cy="280" r="4" fill="#a78bfa"/>
  <circle cx="220" cy="250" r="4" fill="#a78bfa"/>

  <!-- ── Labels right ── -->
  <!-- Cell Membrane -->
  ${leaderLine(480, 200, 530, 185)}
  <text x="535" y="189" font-family="Arial, sans-serif" font-size="12" fill="#111827" font-weight="bold">Cell Membrane</text>

  <!-- Nucleus -->
  ${leaderLine(348, 215, 530, 220)}
  <text x="535" y="224" font-family="Arial, sans-serif" font-size="12" fill="#111827">Nucleus</text>

  <!-- Mitochondria -->
  ${leaderLine(414, 190, 530, 255)}
  <text x="535" y="259" font-family="Arial, sans-serif" font-size="12" fill="#111827">Mitochondria</text>

  <!-- Ribosomes -->
  ${leaderLine(359, 280, 530, 290)}
  <text x="535" y="294" font-family="Arial, sans-serif" font-size="12" fill="#111827">Ribosomes</text>

  <!-- ── Labels left ── -->
  <!-- Cytoplasm -->
  ${leaderLine(140, 360, 90, 375)}
  <text x="10" y="379" font-family="Arial, sans-serif" font-size="12" fill="#111827">Cytoplasm</text>

  <!-- Mitochondria left -->
  ${leaderLine(176, 300, 90, 320)}
  <text x="5" y="324" font-family="Arial, sans-serif" font-size="12" fill="#111827">Mitochondria</text>
`);
  return { svg: s, caption: "Animal cell showing cell membrane, nucleus with nucleolus, cytoplasm, mitochondria, and ribosomes." };
}

// ── BIOLOGY: Photosynthesis ───────────────────────────────────────────────────
function photosynthesis(): DiagramTemplate {
  const s = svg(`
  <!-- Title -->
  <text x="350" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Photosynthesis</text>

  <!-- Leaf outline -->
  <path d="M350,60 Q500,120 480,260 Q460,340 350,400 Q240,340 220,260 Q200,120 350,60 Z" fill="#d1fae5" stroke="#059669" stroke-width="2.5"/>
  <!-- Midrib -->
  <line x1="350" y1="65" x2="350" y2="395" stroke="#059669" stroke-width="2"/>
  <!-- Veins -->
  <line x1="350" y1="150" x2="290" y2="200" stroke="#059669" stroke-width="1"/>
  <line x1="350" y1="150" x2="410" y2="200" stroke="#059669" stroke-width="1"/>
  <line x1="350" y1="230" x2="275" y2="280" stroke="#059669" stroke-width="1"/>
  <line x1="350" y1="230" x2="425" y2="280" stroke="#059669" stroke-width="1"/>

  <!-- Sun (top left) -->
  <circle cx="90" cy="80" r="35" fill="#fef08a" stroke="#eab308" stroke-width="2"/>
  <text x="90" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#92400e" font-weight="bold">Light</text>
  <!-- Sun rays -->
  <line x1="90" y1="38" x2="90" y2="28" stroke="#eab308" stroke-width="2"/>
  <line x1="115" y1="55" x2="122" y2="48" stroke="#eab308" stroke-width="2"/>
  <line x1="128" y1="80" x2="138" y2="80" stroke="#eab308" stroke-width="2"/>
  <line x1="65" y1="55" x2="58" y2="48" stroke="#eab308" stroke-width="2"/>
  <line x1="52" y1="80" x2="42" y2="80" stroke="#eab308" stroke-width="2"/>

  <!-- Arrow: light to leaf -->
  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
  </defs>
  <line x1="130" y1="100" x2="215" y2="145" stroke="#eab308" stroke-width="2" marker-end="url(#arr)"/>

  <!-- CO2 arrow in (left) -->
  <line x1="80" y1="230" x2="215" y2="230" stroke="#6b7280" stroke-width="2" marker-end="url(#arr)"/>
  <text x="55" y="220" font-family="Arial, sans-serif" font-size="13" fill="#374151" font-weight="bold">CO₂</text>
  <text x="55" y="235" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">(Carbon</text>
  <text x="55" y="248" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">dioxide)</text>

  <!-- H2O arrow in (bottom left) -->
  <line x1="100" y1="360" x2="220" y2="330" stroke="#3b82f6" stroke-width="2" marker-end="url(#arr)"/>
  <text x="55" y="355" font-family="Arial, sans-serif" font-size="13" fill="#1d4ed8" font-weight="bold">H₂O</text>
  <text x="55" y="370" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">(Water via</text>
  <text x="55" y="383" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">roots)</text>

  <!-- Glucose arrow out (right) -->
  <line x1="485" y1="270" x2="580" y2="270" stroke="#16a34a" stroke-width="2" marker-end="url(#arr)"/>
  <text x="590" y="265" font-family="Arial, sans-serif" font-size="13" fill="#15803d" font-weight="bold">Glucose</text>
  <text x="590" y="280" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">(C₆H₁₂O₆)</text>

  <!-- O2 arrow out (right) -->
  <line x1="485" y1="180" x2="580" y2="160" stroke="#06b6d4" stroke-width="2" marker-end="url(#arr)"/>
  <text x="590" y="155" font-family="Arial, sans-serif" font-size="13" fill="#0e7490" font-weight="bold">O₂</text>
  <text x="590" y="170" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">(Oxygen</text>
  <text x="590" y="183" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">released)</text>

  <!-- Equation at bottom -->
  <rect x="100" y="430" width="500" height="55" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5" rx="8"/>
  <text x="350" y="452" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Equation:</text>
  <text x="350" y="472" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#15803d">6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂</text>
`);
  return { svg: s, caption: "Photosynthesis in a leaf: light energy, CO₂, and water are converted into glucose and oxygen." };
}

// ── BIOLOGY: Heart ────────────────────────────────────────────────────────────
function heart(): DiagramTemplate {
  const s = svg(`
  <!-- Title -->
  <text x="350" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">The Human Heart</text>

  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
    <marker id="arrB" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#2563eb"/>
    </marker>
    <marker id="arrR" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#dc2626"/>
    </marker>
  </defs>

  <!-- Heart outline -->
  <path d="M350,420 Q200,330 185,240 Q170,150 240,130 Q290,115 320,150 Q335,165 350,185 Q365,165 380,150 Q410,115 460,130 Q530,150 515,240 Q500,330 350,420 Z"
        fill="#fee2e2" stroke="#dc2626" stroke-width="3"/>

  <!-- Septum (dividing line) -->
  <line x1="350" y1="160" x2="350" y2="400" stroke="#9f1239" stroke-width="2.5" stroke-dasharray="6,3"/>

  <!-- Right Atrium (top right from viewer = left side of heart) -->
  <ellipse cx="295" cy="185" rx="45" ry="35" fill="#bfdbfe" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="295" y="181" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#1e40af">Right</text>
  <text x="295" y="194" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#1e40af">Atrium</text>

  <!-- Left Atrium -->
  <ellipse cx="405" cy="185" rx="45" ry="35" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>
  <text x="405" y="181" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#991b1b">Left</text>
  <text x="405" y="194" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#991b1b">Atrium</text>

  <!-- Right Ventricle -->
  <path d="M240,230 Q245,360 350,395 Q310,360 305,230 Z" fill="#bfdbfe" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="275" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#1e40af">Right</text>
  <text x="275" y="323" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#1e40af">Ventricle</text>

  <!-- Left Ventricle -->
  <path d="M395,230 Q390,360 350,395 Q385,360 460,230 Z" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>
  <text x="425" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#991b1b">Left</text>
  <text x="425" y="323" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#991b1b">Ventricle</text>

  <!-- Aorta (top right) -->
  <path d="M390,145 Q400,80 440,65" fill="none" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
  <!-- Pulmonary artery (top left) -->
  <path d="M310,145 Q300,80 260,65" fill="none" stroke="#3b82f6" stroke-width="8" stroke-linecap="round"/>
  <!-- Vena Cava (right side) -->
  <line x1="220" y1="180" x2="175" y2="180" stroke="#3b82f6" stroke-width="8" stroke-linecap="round"/>
  <!-- Pulmonary vein (left side) -->
  <line x1="480" y1="180" x2="525" y2="180" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>

  <!-- Labels -->
  <text x="450" y="58" font-family="Arial, sans-serif" font-size="11" fill="#991b1b" font-weight="bold">Aorta</text>
  <text x="220" y="58" font-family="Arial, sans-serif" font-size="11" fill="#1e40af" font-weight="bold">Pulmonary</text>
  <text x="220" y="71" font-family="Arial, sans-serif" font-size="11" fill="#1e40af" font-weight="bold">Artery</text>
  <text x="100" y="175" font-family="Arial, sans-serif" font-size="11" fill="#1e40af" font-weight="bold">Vena</text>
  <text x="100" y="188" font-family="Arial, sans-serif" font-size="11" fill="#1e40af" font-weight="bold">Cava</text>
  <text x="535" y="175" font-family="Arial, sans-serif" font-size="11" fill="#991b1b" font-weight="bold">Pulmonary</text>
  <text x="535" y="188" font-family="Arial, sans-serif" font-size="11" fill="#991b1b" font-weight="bold">Vein</text>

  <!-- Key -->
  <rect x="30" y="420" width="200" height="65" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1" rx="6"/>
  <text x="130" y="438" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#374151" font-weight="bold">Key</text>
  <rect x="45" y="445" width="18" height="10" fill="#bfdbfe" stroke="#3b82f6" stroke-width="1"/>
  <text x="70" y="455" font-family="Arial, sans-serif" font-size="11" fill="#374151">Deoxygenated blood</text>
  <rect x="45" y="462" width="18" height="10" fill="#fecaca" stroke="#dc2626" stroke-width="1"/>
  <text x="70" y="472" font-family="Arial, sans-serif" font-size="11" fill="#374151">Oxygenated blood</text>
`);
  return { svg: s, caption: "Cross-section of the human heart showing four chambers, major blood vessels, and blood flow direction." };
}

// ── BIOLOGY: Mitosis ──────────────────────────────────────────────────────────
function mitosis(): DiagramTemplate {
  const s = svg(`
  <text x="350" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Stages of Mitosis</text>

  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
  </defs>

  <!-- Stage 1: Interphase -->
  <ellipse cx="100" cy="200" rx="65" ry="80" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
  <ellipse cx="100" cy="195" rx="28" ry="22" fill="#fde68a" stroke="#ca8a04" stroke-width="1.5"/>
  <text x="100" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Interphase</text>
  <text x="100" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">DNA replicates</text>

  <!-- Arrow 1→2 -->
  <line x1="170" y1="200" x2="205" y2="200" stroke="#374151" stroke-width="2" marker-end="url(#arr)"/>

  <!-- Stage 2: Prophase -->
  <ellipse cx="270" cy="200" rx="65" ry="80" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"/>
  <!-- Chromosomes (X shapes) -->
  <line x1="255" y1="175" x2="285" y2="205" stroke="#7c3aed" stroke-width="4" stroke-linecap="round"/>
  <line x1="285" y1="175" x2="255" y2="205" stroke="#7c3aed" stroke-width="4" stroke-linecap="round"/>
  <line x1="255" y1="210" x2="285" y2="240" stroke="#7c3aed" stroke-width="4" stroke-linecap="round"/>
  <line x1="285" y1="210" x2="255" y2="240" stroke="#7c3aed" stroke-width="4" stroke-linecap="round"/>
  <text x="270" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Prophase</text>
  <text x="270" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">Chromosomes form</text>

  <!-- Arrow 2→3 -->
  <line x1="340" y1="200" x2="375" y2="200" stroke="#374151" stroke-width="2" marker-end="url(#arr)"/>

  <!-- Stage 3: Metaphase -->
  <ellipse cx="440" cy="200" rx="65" ry="80" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
  <!-- Spindle fibres -->
  <line x1="440" y1="130" x2="420" y2="200" stroke="#9ca3af" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="440" y1="130" x2="460" y2="200" stroke="#9ca3af" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="440" y1="270" x2="420" y2="200" stroke="#9ca3af" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="440" y1="270" x2="460" y2="200" stroke="#9ca3af" stroke-width="1" stroke-dasharray="3,2"/>
  <!-- Chromosomes at equator -->
  <line x1="425" y1="188" x2="455" y2="218" stroke="#059669" stroke-width="4" stroke-linecap="round"/>
  <line x1="455" y1="188" x2="425" y2="218" stroke="#059669" stroke-width="4" stroke-linecap="round"/>
  <text x="440" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Metaphase</text>
  <text x="440" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">Chromosomes align</text>

  <!-- Arrow 3→4 -->
  <line x1="510" y1="200" x2="545" y2="200" stroke="#374151" stroke-width="2" marker-end="url(#arr)"/>

  <!-- Stage 4: Anaphase + Telophase (combined) -->
  <!-- Two daughter cells forming -->
  <ellipse cx="615" cy="165" rx="55" ry="55" fill="#fce7f3" stroke="#db2777" stroke-width="2"/>
  <ellipse cx="615" cy="335" rx="55" ry="55" fill="#fce7f3" stroke="#db2777" stroke-width="2"/>
  <!-- Nuclei in daughters -->
  <ellipse cx="615" cy="160" rx="18" ry="15" fill="#fbcfe8" stroke="#db2777" stroke-width="1.5"/>
  <ellipse cx="615" cy="330" rx="18" ry="15" fill="#fbcfe8" stroke="#db2777" stroke-width="1.5"/>
  <!-- Division line -->
  <line x1="560" y1="250" x2="670" y2="250" stroke="#db2777" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="615" y="460" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Anaphase /</text>
  <text x="615" y="475" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Telophase</text>
  <text x="615" y="490" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6b7280">2 identical cells</text>
`);
  return { svg: s, caption: "The four stages of mitosis: Interphase, Prophase, Metaphase, and Anaphase/Telophase, producing two genetically identical daughter cells." };
}

// ── PHYSICS: Transverse Wave ──────────────────────────────────────────────────
function transverseWave(): DiagramTemplate {
  const s = svg(`
  <text x="350" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Transverse Wave</text>

  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
    <marker id="arrB" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#2563eb"/>
    </marker>
  </defs>

  <!-- Centre line (equilibrium) -->
  <line x1="50" y1="250" x2="650" y2="250" stroke="#d1d5db" stroke-width="1.5" stroke-dasharray="8,4"/>
  <text x="660" y="254" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">equilibrium</text>

  <!-- Wave path (two full cycles) -->
  <path d="M50,250 Q125,100 200,250 Q275,400 350,250 Q425,100 500,250 Q575,400 650,250"
        fill="none" stroke="#3b82f6" stroke-width="3"/>

  <!-- Crest label (first peak) -->
  <line x1="200" y1="105" x2="200" y2="90" stroke="#374151" stroke-width="1.5" marker-end="url(#arr)"/>
  <text x="200" y="82" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Crest</text>

  <!-- Trough label (first trough) -->
  <line x1="350" y1="395" x2="350" y2="415" stroke="#374151" stroke-width="1.5" marker-end="url(#arr)"/>
  <text x="350" y="435" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Trough</text>

  <!-- Amplitude arrow (vertical, left side) -->
  <line x1="125" y1="250" x2="125" y2="175" stroke="#dc2626" stroke-width="2" marker-end="url(#arr)"/>
  <line x1="125" y1="250" x2="125" y2="325" stroke="#dc2626" stroke-width="2" marker-end="url(#arr)"/>
  <text x="80" y="255" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#dc2626" font-weight="bold">Amplitude</text>
  <text x="80" y="268" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#dc2626">(A)</text>

  <!-- Wavelength arrow (horizontal, between two crests) -->
  <line x1="200" y1="460" x2="500" y2="460" stroke="#7c3aed" stroke-width="2" marker-end="url(#arr)"/>
  <line x1="500" y1="460" x2="200" y2="460" stroke="#7c3aed" stroke-width="2" marker-end="url(#arr)"/>
  <!-- Vertical reference lines -->
  <line x1="200" y1="250" x2="200" y2="465" stroke="#7c3aed" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="500" y1="250" x2="500" y2="465" stroke="#7c3aed" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="350" y="478" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#7c3aed" font-weight="bold">Wavelength (λ)</text>

  <!-- Direction of travel arrow -->
  <line x1="550" y1="60" x2="640" y2="60" stroke="#374151" stroke-width="2" marker-end="url(#arr)"/>
  <text x="590" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#374151">Direction of travel</text>

  <!-- Wave equation box -->
  <rect x="30" y="430" width="160" height="50" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5" rx="6"/>
  <text x="110" y="452" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#1e40af" font-weight="bold">v = f × λ</text>
  <text x="110" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#3b82f6">speed = frequency × wavelength</text>
`);
  return { svg: s, caption: "Transverse wave diagram showing crest, trough, amplitude, and wavelength, with the wave equation v = fλ." };
}

// ── PHYSICS: Atom (Bohr Model) ────────────────────────────────────────────────
function bohrAtom(): DiagramTemplate {
  const s = svg(`
  <text x="350" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Bohr Model of the Atom (Carbon)</text>

  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
  </defs>

  <!-- Electron shells -->
  <circle cx="350" cy="255" r="180" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-dasharray="6,4"/>
  <circle cx="350" cy="255" r="110" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-dasharray="6,4"/>

  <!-- Nucleus -->
  <circle cx="350" cy="255" r="45" fill="#fee2e2" stroke="#dc2626" stroke-width="2.5"/>
  <text x="350" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#991b1b" font-weight="bold">Nucleus</text>
  <text x="350" y="265" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#991b1b">6p⁺  6n</text>

  <!-- Shell 1 electrons (2) -->
  <circle cx="350" cy="145" r="9" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
  <text x="350" y="149" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="white">e⁻</text>
  <circle cx="350" cy="365" r="9" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
  <text x="350" y="369" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="white">e⁻</text>

  <!-- Shell 2 electrons (4 for carbon) -->
  <circle cx="170" cy="255" r="9" fill="#7c3aed" stroke="#5b21b6" stroke-width="1.5"/>
  <text x="170" y="259" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="white">e⁻</text>
  <circle cx="530" cy="255" r="9" fill="#7c3aed" stroke="#5b21b6" stroke-width="1.5"/>
  <text x="530" y="259" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="white">e⁻</text>
  <circle cx="222" cy="127" r="9" fill="#7c3aed" stroke="#5b21b6" stroke-width="1.5"/>
  <text x="222" y="131" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="white">e⁻</text>
  <circle cx="478" cy="383" r="9" fill="#7c3aed" stroke="#5b21b6" stroke-width="1.5"/>
  <text x="478" y="387" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="white">e⁻</text>

  <!-- Labels -->
  ${leaderLine(350, 136, 270, 90)}
  <text x="200" y="88" font-family="Arial, sans-serif" font-size="12" fill="#1d4ed8" font-weight="bold">1st shell (2e⁻)</text>

  ${leaderLine(170, 246, 100, 200)}
  <text x="30" y="198" font-family="Arial, sans-serif" font-size="12" fill="#5b21b6" font-weight="bold">2nd shell (4e⁻)</text>

  ${leaderLine(395, 255, 510, 430)}
  <text x="480" y="445" font-family="Arial, sans-serif" font-size="12" fill="#991b1b">Nucleus</text>
  <text x="480" y="460" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">(protons + neutrons)</text>

  <!-- Atomic number box -->
  <rect x="560" y="40" width="120" height="60" fill="#fef3c7" stroke="#fbbf24" stroke-width="1.5" rx="6"/>
  <text x="620" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#92400e" font-weight="bold">Carbon (C)</text>
  <text x="620" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#92400e">Atomic no: 6</text>
  <text x="620" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#92400e">Mass no: 12</text>
`);
  return { svg: s, caption: "Bohr model of a carbon atom showing the nucleus (6 protons, 6 neutrons), first shell (2 electrons), and second shell (4 electrons)." };
}

// ── MATHS: Pythagoras ─────────────────────────────────────────────────────────
function pythagoras(): DiagramTemplate {
  const s = svg(`
  <text x="350" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Pythagoras' Theorem</text>

  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
  </defs>

  <!-- Main right-angled triangle -->
  <polygon points="180,400 180,120 500,400" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>

  <!-- Right angle symbol -->
  <polyline points="180,370 210,370 210,400" fill="none" stroke="#2563eb" stroke-width="2.5"/>

  <!-- Side labels -->
  <!-- Side a (vertical) -->
  <text x="145" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#dc2626" font-weight="bold">a</text>
  <text x="145" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#dc2626">(opposite)</text>

  <!-- Side b (horizontal) -->
  <text x="340" y="440" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#059669" font-weight="bold">b</text>
  <text x="340" y="458" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#059669">(adjacent)</text>

  <!-- Side c (hypotenuse) -->
  <text x="370" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#7c3aed" font-weight="bold">c</text>
  <text x="370" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#7c3aed">(hypotenuse)</text>

  <!-- Squares on each side (visual proof) -->
  <!-- Square on side a (left of vertical) -->
  <rect x="60" y="120" width="120" height="280" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5" opacity="0.6"/>
  <text x="120" y="265" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#dc2626" font-weight="bold">a²</text>

  <!-- Square on side b (below horizontal) -->
  <rect x="180" y="400" width="320" height="80" fill="#d1fae5" stroke="#059669" stroke-width="1.5" opacity="0.6"/>
  <text x="340" y="448" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#059669" font-weight="bold">b²</text>

  <!-- Formula box -->
  <rect x="520" y="120" width="155" height="80" fill="#ede9fe" stroke="#7c3aed" stroke-width="2" rx="10"/>
  <text x="597" y="148" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#5b21b6" font-weight="bold">a² + b² = c²</text>
  <text x="597" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#7c3aed">or</text>
  <text x="597" y="188" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#5b21b6" font-weight="bold">c = √(a² + b²)</text>

  <!-- Example -->
  <rect x="520" y="230" width="155" height="100" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5" rx="8"/>
  <text x="597" y="252" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#92400e" font-weight="bold">Example:</text>
  <text x="597" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#374151">a = 3, b = 4</text>
  <text x="597" y="287" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#374151">c² = 9 + 16 = 25</text>
  <text x="597" y="304" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#059669" font-weight="bold">c = 5</text>
`);
  return { svg: s, caption: "Pythagoras' theorem: in a right-angled triangle, a² + b² = c², where c is the hypotenuse." };
}

// ── MATHS: Circle Parts ───────────────────────────────────────────────────────
function circleParts(): DiagramTemplate {
  const s = svg(`
  <text x="350" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Parts of a Circle</text>

  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
  </defs>

  <!-- Main circle -->
  <circle cx="310" cy="255" r="170" fill="#eff6ff" stroke="#2563eb" stroke-width="3"/>

  <!-- Centre point -->
  <circle cx="310" cy="255" r="5" fill="#dc2626"/>

  <!-- Radius -->
  <line x1="310" y1="255" x2="310" y2="85" stroke="#dc2626" stroke-width="2.5"/>
  <!-- Diameter -->
  <line x1="140" y1="255" x2="480" y2="255" stroke="#7c3aed" stroke-width="2.5"/>
  <!-- Chord -->
  <line x1="175" y1="145" x2="445" y2="145" stroke="#059669" stroke-width="2.5"/>
  <!-- Tangent -->
  <line x1="480" y1="100" x2="480" y2="410" stroke="#ea580c" stroke-width="2.5"/>
  <!-- Arc (top right quarter) -->
  <path d="M310,85 A170,170 0 0,1 480,255" fill="none" stroke="#0891b2" stroke-width="4"/>

  <!-- Sector (shaded) -->
  <path d="M310,255 L480,255 A170,170 0 0,0 310,85 Z" fill="#dbeafe" stroke="#2563eb" stroke-width="1" opacity="0.5"/>

  <!-- Labels -->
  <text x="350" y="175" font-family="Arial, sans-serif" font-size="13" fill="#dc2626" font-weight="bold">Radius (r)</text>
  <text x="350" y="248" font-family="Arial, sans-serif" font-size="13" fill="#7c3aed" font-weight="bold">Diameter (d = 2r)</text>
  <text x="310" y="135" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#059669" font-weight="bold">Chord</text>
  <text x="510" y="255" font-family="Arial, sans-serif" font-size="13" fill="#ea580c" font-weight="bold">Tangent</text>
  <text x="435" y="160" font-family="Arial, sans-serif" font-size="13" fill="#0891b2" font-weight="bold">Arc</text>
  <text x="415" y="215" font-family="Arial, sans-serif" font-size="13" fill="#2563eb" font-weight="bold">Sector</text>
  <text x="310" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#dc2626">Centre</text>

  <!-- Circumference label (curved) -->
  <text x="130" y="360" font-family="Arial, sans-serif" font-size="13" fill="#374151" font-weight="bold">Circumference</text>
  <text x="130" y="376" font-family="Arial, sans-serif" font-size="12" fill="#374151">C = 2πr = πd</text>

  <!-- Area formula -->
  <rect x="30" y="420" width="160" height="55" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5" rx="6"/>
  <text x="110" y="442" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#92400e" font-weight="bold">Area = πr²</text>
  <text x="110" y="462" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#92400e">π ≈ 3.14159</text>
`);
  return { svg: s, caption: "Parts of a circle: radius, diameter, chord, arc, sector, tangent, and circumference with key formulae." };
}

// ── GEOGRAPHY: Volcano ────────────────────────────────────────────────────────
function volcano(): DiagramTemplate {
  const s = svg(`
  <text x="350" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Volcano Cross-Section</text>

  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
  </defs>

  <!-- Ground/crust layer -->
  <rect x="30" y="370" width="640" height="30" fill="#d6b896" stroke="#92400e" stroke-width="1"/>
  <text x="350" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#92400e">Earth's Crust</text>

  <!-- Tectonic plates -->
  <rect x="30" y="400" width="295" height="80" fill="#c4a882" stroke="#78350f" stroke-width="1.5"/>
  <text x="175" y="445" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#78350f" font-weight="bold">Tectonic Plate</text>
  <rect x="375" y="400" width="295" height="80" fill="#c4a882" stroke="#78350f" stroke-width="1.5"/>
  <text x="525" y="445" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#78350f" font-weight="bold">Tectonic Plate</text>

  <!-- Magma chamber -->
  <ellipse cx="350" cy="415" rx="120" ry="50" fill="#fca5a5" stroke="#dc2626" stroke-width="2"/>
  <text x="350" y="412" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#991b1b" font-weight="bold">Magma</text>
  <text x="350" y="428" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#991b1b" font-weight="bold">Chamber</text>

  <!-- Main vent -->
  <polygon points="310,370 390,370 370,130 330,130" fill="#ef4444" stroke="#dc2626" stroke-width="1.5"/>

  <!-- Volcano cone -->
  <polygon points="150,370 550,370 390,90 310,90" fill="#d97706" stroke="#92400e" stroke-width="2"/>

  <!-- Crater at top -->
  <ellipse cx="350" cy="90" rx="40" ry="15" fill="#1f2937" stroke="#374151" stroke-width="2"/>

  <!-- Lava flow (left) -->
  <path d="M310,130 Q230,200 180,280 Q150,320 130,370" fill="none" stroke="#f97316" stroke-width="8" stroke-linecap="round"/>

  <!-- Ash cloud -->
  <ellipse cx="350" cy="55" rx="60" ry="30" fill="#9ca3af" stroke="#6b7280" stroke-width="1.5" opacity="0.8"/>
  <ellipse cx="310" cy="45" rx="35" ry="20" fill="#9ca3af" stroke="#6b7280" stroke-width="1" opacity="0.7"/>
  <ellipse cx="390" cy="45" rx="35" ry="20" fill="#9ca3af" stroke="#6b7280" stroke-width="1" opacity="0.7"/>

  <!-- Secondary vent -->
  <polygon points="430,300 460,300 450,200 440,200" fill="#ef4444" stroke="#dc2626" stroke-width="1"/>

  <!-- Labels -->
  ${leaderLine(350, 75, 430, 40)}
  <text x="435" y="38" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Ash Cloud</text>

  ${leaderLine(350, 88, 500, 75)}
  <text x="505" y="79" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Crater</text>

  ${leaderLine(350, 250, 500, 200)}
  <text x="505" y="204" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Main Vent</text>

  ${leaderLine(445, 250, 500, 250)}
  <text x="505" y="254" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Secondary Vent</text>

  ${leaderLine(155, 320, 80, 300)}
  <text x="10" y="304" font-family="Arial, sans-serif" font-size="12" fill="#ea580c" font-weight="bold">Lava Flow</text>

  ${leaderLine(240, 340, 80, 350)}
  <text x="10" y="354" font-family="Arial, sans-serif" font-size="12" fill="#374151" font-weight="bold">Cone</text>
`);
  return { svg: s, caption: "Volcano cross-section showing magma chamber, main vent, secondary vent, crater, lava flow, ash cloud, and tectonic plates." };
}

// ── GEOGRAPHY: River Processes ────────────────────────────────────────────────
function riverProcesses(): DiagramTemplate {
  const s = svg(`
  <text x="350" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">River Processes: Meander</text>

  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
    <marker id="arrW" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#2563eb"/>
    </marker>
  </defs>

  <!-- Valley floor -->
  <rect x="30" y="300" width="640" height="170" fill="#d6b896" stroke="#92400e" stroke-width="1"/>
  <!-- Floodplain -->
  <rect x="30" y="260" width="640" height="40" fill="#86efac" stroke="#059669" stroke-width="1"/>
  <text x="650" y="285" text-anchor="end" font-family="Arial, sans-serif" font-size="11" fill="#15803d">Floodplain</text>

  <!-- River meander (S-curve) -->
  <path d="M30,280 Q150,200 250,280 Q350,360 450,280 Q550,200 670,280"
        fill="none" stroke="#3b82f6" stroke-width="22" stroke-linecap="round"/>
  <!-- River highlight -->
  <path d="M30,280 Q150,200 250,280 Q350,360 450,280 Q550,200 670,280"
        fill="none" stroke="#60a5fa" stroke-width="14" stroke-linecap="round"/>

  <!-- Erosion zone (outer bends - red arrows) -->
  <circle cx="155" cy="215" r="18" fill="#fecaca" stroke="#dc2626" stroke-width="2" opacity="0.9"/>
  <text x="155" y="212" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#991b1b" font-weight="bold">Erosion</text>
  <text x="155" y="224" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#991b1b">(outer)</text>

  <circle cx="545" cy="215" r="18" fill="#fecaca" stroke="#dc2626" stroke-width="2" opacity="0.9"/>
  <text x="545" y="212" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#991b1b" font-weight="bold">Erosion</text>
  <text x="545" y="224" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#991b1b">(outer)</text>

  <!-- Deposition zone (inner bends - green) -->
  <circle cx="250" cy="310" r="18" fill="#d1fae5" stroke="#059669" stroke-width="2" opacity="0.9"/>
  <text x="250" y="307" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#15803d" font-weight="bold">Deposit</text>
  <text x="250" y="319" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#15803d">(inner)</text>

  <circle cx="450" cy="310" r="18" fill="#d1fae5" stroke="#059669" stroke-width="2" opacity="0.9"/>
  <text x="450" y="307" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#15803d" font-weight="bold">Deposit</text>
  <text x="450" y="319" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#15803d">(inner)</text>

  <!-- Water flow direction arrows -->
  <line x1="80" y1="265" x2="120" y2="248" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arrW)"/>
  <line x1="310" y1="345" x2="350" y2="358" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arrW)"/>
  <line x1="580" y1="248" x2="620" y2="265" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arrW)"/>

  <!-- Labels -->
  ${leaderLine(155, 197, 100, 130)}
  <text x="30" y="128" font-family="Arial, sans-serif" font-size="12" fill="#dc2626" font-weight="bold">Undercut Bank</text>
  <text x="30" y="143" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">(erosion)</text>

  ${leaderLine(250, 328, 180, 400)}
  <text x="80" y="398" font-family="Arial, sans-serif" font-size="12" fill="#059669" font-weight="bold">Slip-off Slope</text>
  <text x="80" y="413" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">(deposition)</text>

  ${leaderLine(350, 355, 420, 430)}
  <text x="425" y="428" font-family="Arial, sans-serif" font-size="12" fill="#2563eb" font-weight="bold">River Channel</text>

  <text x="350" y="55" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#374151" font-weight="bold">Meander</text>
  ${leaderLine(350, 60, 350, 200)}
`);
  return { svg: s, caption: "River meander showing erosion on the outer bend (undercut bank) and deposition on the inner bend (slip-off slope)." };
}

// ── HISTORY: Timeline ─────────────────────────────────────────────────────────
function historyTimeline(topic: string): DiagramTemplate {
  // Generic WW1 timeline — can be adapted
  const isWW1 = topic.toLowerCase().includes("ww1") || topic.toLowerCase().includes("world war 1") || topic.toLowerCase().includes("first world war");
  const isWW2 = topic.toLowerCase().includes("ww2") || topic.toLowerCase().includes("world war 2") || topic.toLowerCase().includes("second world war");

  let events: { year: string; event: string }[] = [
    { year: "1900", event: "Event 1" },
    { year: "1910", event: "Event 2" },
    { year: "1920", event: "Event 3" },
    { year: "1930", event: "Event 4" },
    { year: "1940", event: "Event 5" },
  ];

  if (isWW1) {
    events = [
      { year: "1914", event: "Assassination of Archduke Franz Ferdinand" },
      { year: "1914", event: "Britain declares war on Germany (Aug)" },
      { year: "1916", event: "Battle of the Somme" },
      { year: "1917", event: "USA enters the war" },
      { year: "1918", event: "Armistice — war ends (11 Nov)" },
    ];
  } else if (isWW2) {
    events = [
      { year: "1939", event: "Germany invades Poland; Britain declares war" },
      { year: "1940", event: "Battle of Britain; Dunkirk evacuation" },
      { year: "1941", event: "USA enters war after Pearl Harbor" },
      { year: "1944", event: "D-Day landings in Normandy" },
      { year: "1945", event: "VE Day (May) and VJ Day (Aug)" },
    ];
  }

  const positions = [80, 205, 330, 455, 580];
  const s = svg(`
  <text x="350" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Historical Timeline</text>

  <defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
    </marker>
  </defs>

  <!-- Timeline axis -->
  <line x1="50" y1="260" x2="660" y2="260" stroke="#374151" stroke-width="3" marker-end="url(#arr)"/>

  ${events.map((e, i) => {
    const x = positions[i];
    const above = i % 2 === 0;
    const boxY = above ? 80 : 310;
    const lineY1 = above ? 145 : 265;
    const lineY2 = above ? 255 : 305;
    const textY1 = boxY + 20;
    const textY2 = boxY + 35;
    const textY3 = boxY + 50;
    const words = e.event.split(" ");
    const line1 = words.slice(0, 4).join(" ");
    const line2 = words.slice(4, 8).join(" ");
    const line3 = words.slice(8).join(" ");
    return `
    <!-- Event ${i + 1} -->
    <circle cx="${x}" cy="260" r="8" fill="#6366f1" stroke="#4f46e5" stroke-width="2"/>
    <line x1="${x}" y1="${lineY1}" x2="${x}" y2="${lineY2}" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4,3"/>
    <rect x="${x - 60}" y="${boxY}" width="120" height="60" fill="#eef2ff" stroke="#6366f1" stroke-width="1.5" rx="6"/>
    <text x="${x}" y="${textY1}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#4f46e5" font-weight="bold">${e.year}</text>
    <text x="${x}" y="${textY2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#374151">${line1}</text>
    ${line2 ? `<text x="${x}" y="${textY3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#374151">${line2}</text>` : ""}
    `;
  }).join("")}
`);
  return { svg: s, caption: `Historical timeline showing five key events${isWW1 ? " of World War One" : isWW2 ? " of World War Two" : ""}.` };
}

// ── TEMPLATE MATCHER ──────────────────────────────────────────────────────────
export function getTemplate(subject: string, topic: string): DiagramTemplate | null {
  const s = subject.toLowerCase().trim();
  const t = topic.toLowerCase().trim();

  // Biology / Science
  if (t.includes("plant cell") || (t.includes("plant") && t.includes("cell"))) return plantCell();
  if (t.includes("animal cell") || (t.includes("animal") && t.includes("cell"))) return animalCell();
  if (t.includes("cell") && !t.includes("fuel")) return t.includes("plant") ? plantCell() : animalCell();
  if (t.includes("photosynthesis")) return photosynthesis();
  if (t.includes("heart") || t.includes("circulatory")) return heart();
  if (t.includes("mitosis") || t.includes("cell division")) return mitosis();
  if (t.includes("wave") || t.includes("transverse") || t.includes("sound wave") || t.includes("light wave")) return transverseWave();
  if (t.includes("atom") || t.includes("bohr") || t.includes("electron shell") || t.includes("atomic structure")) return bohrAtom();

  // Maths
  if (t.includes("pythagoras") || (t.includes("right") && t.includes("triangle"))) return pythagoras();
  if (t.includes("circle") && (s.includes("math") || s.includes("maths"))) return circleParts();

  // Geography
  if (t.includes("volcano") || t.includes("tectonic") || t.includes("plate boundary")) return volcano();
  if (t.includes("river") || t.includes("meander") || t.includes("erosion") || t.includes("deposition")) return riverProcesses();

  // History
  if (s.includes("history") && (t.includes("timeline") || t.includes("ww1") || t.includes("ww2") || t.includes("world war"))) return historyTimeline(topic);

  return null; // No template — fall back to AI generation
}
