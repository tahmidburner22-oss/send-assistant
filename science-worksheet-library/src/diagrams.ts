/**
 * Science Worksheet Library — Named Inline-SVG Diagram Library v2.0
 *
 * Each entry is a self-contained SVG string.
 * Diagrams are print-safe (no external references, no filters that break in PDF).
 * Keys match the `id` field in worksheet JSON DiagramRef objects.
 */

const diagrams: Record<string, string> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // METALLIC BONDING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Metal lattice with label lines — for Q1 "Label the Structure"
   * Shows 3×3 grid of cations (+) with small electrons (−) between them,
   * and 3 label lines pointing to empty answer boxes on the right.
   */
  'metal-lattice-label': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 280" width="420" height="280">
  <defs>
    <radialGradient id="ion3d" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#c8ccd4"/>
      <stop offset="100%" stop-color="#6b7280"/>
    </radialGradient>
    <radialGradient id="elec3d" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#bfdbfe"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </radialGradient>
  </defs>
  <!-- Electron sea background -->
  <rect x="10" y="10" width="250" height="260" rx="10" fill="#eaf2fc" stroke="#bcd4f0" stroke-width="1.5" stroke-dasharray="5,3"/>

  <!-- Electrons (small − circles scattered) -->
  <g font-family="Arial" font-size="8" fill="#fff" text-anchor="middle">
  <circle cx="40" cy="30" r="6.5" fill="url(#elec3d)"/><text x="40" y="33">−</text>
  <circle cx="90" cy="25" r="6.5" fill="url(#elec3d)"/><text x="90" y="28">−</text>
  <circle cx="150" cy="30" r="6.5" fill="url(#elec3d)"/><text x="150" y="33">−</text>
  <circle cx="200" cy="28" r="6.5" fill="url(#elec3d)"/><text x="200" y="31">−</text>
  <circle cx="240" cy="35" r="6.5" fill="url(#elec3d)"/><text x="240" y="38">−</text>
  <circle cx="30" cy="90" r="6.5" fill="url(#elec3d)"/><text x="30" y="93">−</text>
  <circle cx="130" cy="85" r="6.5" fill="url(#elec3d)"/><text x="130" y="88">−</text>
  <circle cx="230" cy="88" r="6.5" fill="url(#elec3d)"/><text x="230" y="91">−</text>
  <circle cx="35" cy="155" r="6.5" fill="url(#elec3d)"/><text x="35" y="158">−</text>
  <circle cx="130" cy="150" r="6.5" fill="url(#elec3d)"/><text x="130" y="153">−</text>
  <circle cx="235" cy="155" r="6.5" fill="url(#elec3d)"/><text x="235" y="158">−</text>
  <circle cx="40" cy="220" r="6.5" fill="url(#elec3d)"/><text x="40" y="223">−</text>
  <circle cx="100" cy="225" r="6.5" fill="url(#elec3d)"/><text x="100" y="228">−</text>
  <circle cx="175" cy="218" r="6.5" fill="url(#elec3d)"/><text x="175" y="221">−</text>
  <circle cx="240" cy="222" r="6.5" fill="url(#elec3d)"/><text x="240" y="225">−</text>
  <circle cx="55" cy="255" r="6.5" fill="url(#elec3d)"/><text x="55" y="258">−</text>
  <circle cx="135" cy="258" r="6.5" fill="url(#elec3d)"/><text x="135" y="261">−</text>
  <circle cx="210" cy="255" r="6.5" fill="url(#elec3d)"/><text x="210" y="258">−</text>
  </g>

  <!-- Cations: 3 rows x 3, 3D silver spheres -->
  <g font-family="Arial" font-size="15" fill="#1f2937" font-weight="bold" text-anchor="middle">
  <circle cx="60"  cy="60"  r="19" fill="url(#ion3d)" stroke="#52525b" stroke-width="1"/><text x="60"  y="66">+</text>
  <circle cx="120" cy="60"  r="19" fill="url(#ion3d)" stroke="#52525b" stroke-width="1"/><text x="120" y="66">+</text>
  <circle cx="180" cy="60"  r="19" fill="url(#ion3d)" stroke="#52525b" stroke-width="1"/><text x="180" y="66">+</text>
  <circle cx="60"  cy="125" r="19" fill="url(#ion3d)" stroke="#52525b" stroke-width="1"/><text x="60"  y="131">+</text>
  <circle cx="120" cy="125" r="19" fill="url(#ion3d)" stroke="#52525b" stroke-width="1"/><text x="120" y="131">+</text>
  <circle cx="180" cy="125" r="19" fill="url(#ion3d)" stroke="#52525b" stroke-width="1"/><text x="180" y="131">+</text>
  <circle cx="60"  cy="190" r="19" fill="url(#ion3d)" stroke="#52525b" stroke-width="1"/><text x="60"  y="196">+</text>
  <circle cx="120" cy="190" r="19" fill="url(#ion3d)" stroke="#52525b" stroke-width="1"/><text x="120" y="196">+</text>
  <circle cx="180" cy="190" r="19" fill="url(#ion3d)" stroke="#52525b" stroke-width="1"/><text x="180" y="196">+</text>
  </g>

  <!-- Label leader lines + cream answer boxes -->
  <line x1="240" y1="35" x2="280" y2="50" stroke="#333" stroke-width="1.2"/>
  <rect x="282" y="38" width="128" height="26" rx="4" fill="#fff7d6" stroke="#e0a800" stroke-width="1.5"/>
  <line x1="198" y1="125" x2="280" y2="140" stroke="#333" stroke-width="1.2"/>
  <rect x="282" y="128" width="128" height="26" rx="4" fill="#fff7d6" stroke="#e0a800" stroke-width="1.5"/>
  <line x1="200" y1="230" x2="280" y2="230" stroke="#333" stroke-width="1.2"/>
  <rect x="282" y="218" width="128" height="26" rx="4" fill="#fff7d6" stroke="#e0a800" stroke-width="1.5"/>
</svg>`,

  /**
   * Metal lattice malleability — for Q2 "Malleability"
   * Shows BEFORE FORCE (regular rows) and AFTER FORCE (top layer shifted),
   * with a force arrow between them and a label box on the right.
   */
  'metal-lattice-malleability': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 290" width="420" height="290">
  <defs>
    <radialGradient id="ionM" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#c8ccd4"/>
      <stop offset="100%" stop-color="#6b7280"/>
    </radialGradient>
    <radialGradient id="elecM" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#bfdbfe"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </radialGradient>
    <marker id="slipArrow" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 9 3.5, 0 7" fill="#111"/></marker>
  </defs>

  <!-- BEFORE FORCE -->
  <text x="150" y="14" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#111">BEFORE FORCE</text>
  <rect x="20" y="22" width="260" height="96" rx="8" fill="#eaf2fc" stroke="#bcd4f0" stroke-width="1" stroke-dasharray="4,2"/>
  <g font-family="Arial" font-size="11" fill="#1f2937" font-weight="bold" text-anchor="middle">
  <circle cx="55"  cy="46" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="55"  y="51">+</text>
  <circle cx="95"  cy="46" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="95"  y="51">+</text>
  <circle cx="135" cy="46" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="135" y="51">+</text>
  <circle cx="175" cy="46" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="175" y="51">+</text>
  <circle cx="215" cy="46" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="215" y="51">+</text>
  <circle cx="255" cy="46" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="255" y="51">+</text>
  <circle cx="55"  cy="80" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="55"  y="85">+</text>
  <circle cx="95"  cy="80" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="95"  y="85">+</text>
  <circle cx="135" cy="80" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="135" y="85">+</text>
  <circle cx="175" cy="80" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="175" y="85">+</text>
  <circle cx="215" cy="80" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="215" y="85">+</text>
  <circle cx="255" cy="80" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="255" y="85">+</text>
  </g>
  <g font-family="Arial" font-size="6" fill="#fff" text-anchor="middle">
  <circle cx="75" cy="32" r="4" fill="url(#elecM)"/><text x="75" y="34.5">−</text>
  <circle cx="155" cy="30" r="4" fill="url(#elecM)"/><text x="155" y="32.5">−</text>
  <circle cx="235" cy="32" r="4" fill="url(#elecM)"/><text x="235" y="34.5">−</text>
  <circle cx="75" cy="98" r="4" fill="url(#elecM)"/><text x="75" y="100.5">−</text>
  <circle cx="155" cy="100" r="4" fill="url(#elecM)"/><text x="155" y="102.5">−</text>
  <circle cx="235" cy="98" r="4" fill="url(#elecM)"/><text x="235" y="100.5">−</text>
  </g>
  <!-- Bracket + label box -->
  <path d="M 288 28 q 6 0 6 6 v 22 q 0 6 6 6 q -6 0 -6 6 v 22 q 0 6 -6 6" fill="none" stroke="#333" stroke-width="1.2"/>
  <rect x="306" y="56" width="104" height="28" rx="4" fill="#fff7d6" stroke="#e0a800" stroke-width="1.5"/>

  <!-- FORCE APPLIED -->
  <text x="150" y="140" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#111">↓ FORCE APPLIED</text>

  <!-- AFTER FORCE -->
  <text x="150" y="162" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#111">AFTER FORCE</text>
  <rect x="20" y="170" width="260" height="96" rx="8" fill="#eaf2fc" stroke="#bcd4f0" stroke-width="1" stroke-dasharray="4,2"/>
  <g font-family="Arial" font-size="11" fill="#1f2937" font-weight="bold" text-anchor="middle">
  <!-- top row shifted right by 30 -->
  <circle cx="85"  cy="194" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="85"  y="199">+</text>
  <circle cx="125" cy="194" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="125" y="199">+</text>
  <circle cx="165" cy="194" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="165" y="199">+</text>
  <circle cx="205" cy="194" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="205" y="199">+</text>
  <circle cx="245" cy="194" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="245" y="199">+</text>
  <!-- bottom row unchanged -->
  <circle cx="55"  cy="232" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="55"  y="237">+</text>
  <circle cx="95"  cy="232" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="95"  y="237">+</text>
  <circle cx="135" cy="232" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="135" y="237">+</text>
  <circle cx="175" cy="232" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="175" y="237">+</text>
  <circle cx="215" cy="232" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="215" y="237">+</text>
  <circle cx="255" cy="232" r="14" fill="url(#ionM)" stroke="#52525b"/><text x="255" y="237">+</text>
  </g>
  <g font-family="Arial" font-size="6" fill="#fff" text-anchor="middle">
  <circle cx="105" cy="180" r="4" fill="url(#elecM)"/><text x="105" y="182.5">−</text>
  <circle cx="185" cy="178" r="4" fill="url(#elecM)"/><text x="185" y="180.5">−</text>
  <circle cx="75" cy="250" r="4" fill="url(#elecM)"/><text x="75" y="252.5">−</text>
  <circle cx="235" cy="250" r="4" fill="url(#elecM)"/><text x="235" y="252.5">−</text>
  </g>
  <!-- slip arrow -->
  <line x1="290" y1="194" x2="330" y2="194" stroke="#111" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#slipArrow)"/>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // CONCENTRATION OF SOLUTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Labelled beaker showing solution = solute + solvent
   * For the "Solution: A solute dissolved in a solvent" info panel
   */
  'beaker-solution-labelled': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200" width="220" height="200">
  <!-- Beaker outline -->
  <rect x="40" y="30" width="110" height="145" rx="4" fill="none" stroke="#333" stroke-width="2.5"/>
  <!-- Beaker lip -->
  <line x1="35" y1="30" x2="45" y2="30" stroke="#333" stroke-width="2.5"/>
  <line x1="145" y1="30" x2="155" y2="30" stroke="#333" stroke-width="2.5"/>
  <!-- Water fill (solvent) -->
  <rect x="42" y="60" width="106" height="113" rx="2" fill="#d4eaf7" opacity="0.6"/>
  <!-- Solute particles at bottom -->
  <circle cx="65" cy="150" r="4" fill="#1d4ed8"/>
  <circle cx="80" cy="155" r="4" fill="#1d4ed8"/>
  <circle cx="95" cy="148" r="4" fill="#1d4ed8"/>
  <circle cx="110" cy="153" r="4" fill="#1d4ed8"/>
  <circle cx="125" cy="150" r="4" fill="#1d4ed8"/>
  <!-- Dissolved particles -->
  <circle cx="70" cy="100" r="3" fill="#1d4ed8" opacity="0.6"/>
  <circle cx="100" cy="85" r="3" fill="#1d4ed8" opacity="0.6"/>
  <circle cx="120" cy="110" r="3" fill="#1d4ed8" opacity="0.6"/>
  <circle cx="85" cy="125" r="3" fill="#1d4ed8" opacity="0.6"/>
  <circle cx="130" cy="90" r="3" fill="#1d4ed8" opacity="0.6"/>
  <!-- Label lines -->
  <line x1="148" y1="50" x2="165" y2="45" stroke="#333" stroke-width="1"/>
  <text x="167" y="42" font-family="Arial" font-size="8" fill="#333">solution</text>
  <text x="167" y="52" font-family="Arial" font-size="7" fill="#555">(solute + solvent)</text>
  <line x1="148" y1="90" x2="165" y2="85" stroke="#333" stroke-width="1"/>
  <text x="167" y="82" font-family="Arial" font-size="8" fill="#333">solvent</text>
  <text x="167" y="92" font-family="Arial" font-size="7" fill="#555">(e.g. water)</text>
  <line x1="128" y1="150" x2="165" y2="145" stroke="#333" stroke-width="1"/>
  <text x="167" y="142" font-family="Arial" font-size="8" fill="#333">solute</text>
  <text x="167" y="152" font-family="Arial" font-size="7" fill="#555">(e.g. sodium chloride)</text>
  <!-- Definitions below -->
  <text x="20" y="185" font-family="Arial" font-size="8" fill="#333">The <tspan fill="#1a237e" font-weight="bold">solute</tspan> is the substance being dissolved.</text>
  <text x="20" y="196" font-family="Arial" font-size="8" fill="#333">The <tspan fill="#1a237e" font-weight="bold">solvent</tspan> is the liquid that does the dissolving.</text>
</svg>`,

};

export default diagrams;
