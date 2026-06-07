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

  /**
   * Compact metal lattice — for the info-panel "structure" diagram (gold-standard
   * info-grid layout). Shows a 3×3 grid of 3D silver cations (+) sitting in a
   * faint blue "sea" of delocalised electrons (−), with two inline labels.
   * Sized small so it fits a third-width info panel.
   */
  'metal-lattice-compact': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 150" width="240" height="150">
  <defs>
    <radialGradient id="ionC" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#c8ccd4"/>
      <stop offset="100%" stop-color="#6b7280"/>
    </radialGradient>
    <radialGradient id="elecC" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#bfdbfe"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </radialGradient>
  </defs>
  <!-- Electron sea background -->
  <rect x="6" y="6" width="150" height="138" rx="8" fill="#eaf2fc" stroke="#bcd4f0" stroke-width="1.2" stroke-dasharray="4,2"/>
  <!-- Electrons scattered in the sea -->
  <g font-family="Arial" font-size="6" fill="#fff" text-anchor="middle">
  <circle cx="30" cy="22" r="5" fill="url(#elecC)"/><text x="30" y="24.5">−</text>
  <circle cx="82" cy="20" r="5" fill="url(#elecC)"/><text x="82" y="22.5">−</text>
  <circle cx="132" cy="24" r="5" fill="url(#elecC)"/><text x="132" y="26.5">−</text>
  <circle cx="24" cy="74" r="5" fill="url(#elecC)"/><text x="24" y="76.5">−</text>
  <circle cx="82" cy="72" r="5" fill="url(#elecC)"/><text x="82" y="74.5">−</text>
  <circle cx="138" cy="74" r="5" fill="url(#elecC)"/><text x="138" y="76.5">−</text>
  <circle cx="30" cy="126" r="5" fill="url(#elecC)"/><text x="30" y="128.5">−</text>
  <circle cx="82" cy="128" r="5" fill="url(#elecC)"/><text x="82" y="130.5">−</text>
  <circle cx="132" cy="126" r="5" fill="url(#elecC)"/><text x="132" y="128.5">−</text>
  </g>
  <!-- Cations: 3×3 3D silver spheres -->
  <g font-family="Arial" font-size="11" fill="#1f2937" font-weight="bold" text-anchor="middle">
  <circle cx="42"  cy="44" r="13" fill="url(#ionC)" stroke="#52525b"/><text x="42"  y="49">+</text>
  <circle cx="82"  cy="44" r="13" fill="url(#ionC)" stroke="#52525b"/><text x="82"  y="49">+</text>
  <circle cx="122" cy="44" r="13" fill="url(#ionC)" stroke="#52525b"/><text x="122" y="49">+</text>
  <circle cx="42"  cy="86" r="13" fill="url(#ionC)" stroke="#52525b"/><text x="42"  y="91">+</text>
  <circle cx="82"  cy="86" r="13" fill="url(#ionC)" stroke="#52525b"/><text x="82"  y="91">+</text>
  <circle cx="122" cy="86" r="13" fill="url(#ionC)" stroke="#52525b"/><text x="122" y="91">+</text>
  <circle cx="42"  cy="118" r="0" fill="none"/>
  </g>
  <!-- Inline labels with leader lines -->
  <line x1="135" y1="44" x2="166" y2="40" stroke="#333" stroke-width="1"/>
  <text x="168" y="38" font-family="Arial" font-size="8" font-weight="bold" fill="#1a237e">positive</text>
  <text x="168" y="48" font-family="Arial" font-size="8" font-weight="bold" fill="#1a237e">metal ions</text>
  <line x1="138" y1="74" x2="166" y2="92" stroke="#333" stroke-width="1"/>
  <text x="168" y="90" font-family="Arial" font-size="8" font-weight="bold" fill="#1a237e">delocalised</text>
  <text x="168" y="100" font-family="Arial" font-size="8" font-weight="bold" fill="#1a237e">electrons</text>
</svg>`,

  /**
   * Compact malleability diagram — side-by-side BEFORE / AFTER for a question cell.
   * Top layer shifts right after force; sized short and wide to fit a 2-col grid cell.
   */
  'metal-malleability-compact': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120">
  <defs>
    <radialGradient id="ionMC" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#c8ccd4"/>
      <stop offset="100%" stop-color="#6b7280"/>
    </radialGradient>
    <marker id="forceArr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#111"/></marker>
  </defs>
  <!-- BEFORE -->
  <text x="68" y="12" text-anchor="middle" font-family="Arial" font-size="9" font-weight="bold" fill="#111">BEFORE</text>
  <rect x="6" y="18" width="124" height="92" rx="6" fill="#eaf2fc" stroke="#bcd4f0" stroke-width="1" stroke-dasharray="4,2"/>
  <g font-family="Arial" font-size="9" fill="#1f2937" font-weight="bold" text-anchor="middle">
  <circle cx="30" cy="40" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="30" y="44">+</text>
  <circle cx="58" cy="40" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="58" y="44">+</text>
  <circle cx="86" cy="40" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="86" y="44">+</text>
  <circle cx="114" cy="40" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="114" y="44">+</text>
  <circle cx="30" cy="70" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="30" y="74">+</text>
  <circle cx="58" cy="70" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="58" y="74">+</text>
  <circle cx="86" cy="70" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="86" y="74">+</text>
  <circle cx="114" cy="70" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="114" y="74">+</text>
  <circle cx="30" cy="100" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="30" y="104">+</text>
  <circle cx="58" cy="100" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="58" y="104">+</text>
  <circle cx="86" cy="100" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="86" y="104">+</text>
  <circle cx="114" cy="100" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="114" y="104">+</text>
  </g>
  <!-- FORCE arrow -->
  <line x1="142" y1="64" x2="176" y2="64" stroke="#111" stroke-width="2" marker-end="url(#forceArr)"/>
  <text x="159" y="56" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="#111">FORCE</text>
  <!-- AFTER (top rows shifted right) -->
  <text x="252" y="12" text-anchor="middle" font-family="Arial" font-size="9" font-weight="bold" fill="#111">AFTER</text>
  <rect x="190" y="18" width="124" height="92" rx="6" fill="#eaf2fc" stroke="#bcd4f0" stroke-width="1" stroke-dasharray="4,2"/>
  <g font-family="Arial" font-size="9" fill="#1f2937" font-weight="bold" text-anchor="middle">
  <circle cx="228" cy="40" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="228" y="44">+</text>
  <circle cx="256" cy="40" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="256" y="44">+</text>
  <circle cx="284" cy="40" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="284" y="44">+</text>
  <circle cx="214" cy="70" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="214" y="74">+</text>
  <circle cx="242" cy="70" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="242" y="74">+</text>
  <circle cx="270" cy="70" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="270" y="74">+</text>
  <circle cx="298" cy="70" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="298" y="74">+</text>
  <circle cx="214" cy="100" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="214" y="104">+</text>
  <circle cx="242" cy="100" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="242" y="104">+</text>
  <circle cx="270" cy="100" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="270" y="104">+</text>
  <circle cx="298" cy="100" r="11" fill="url(#ionMC)" stroke="#52525b"/><text x="298" y="104">+</text>
  </g>
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ATOMIC STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Bohr-model atom — nucleus (protons + neutrons) with two electron shells.
   * Labelled for "atomic structure" info panel. Compact (info-panel sized).
   */
  'atom-shells': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 180" width="250" height="180">
  <defs>
    <radialGradient id="nuc3d" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#ffd6d6"/>
      <stop offset="100%" stop-color="#d32f2f"/>
    </radialGradient>
  </defs>
  <!-- Shells -->
  <circle cx="100" cy="90" r="40" fill="none" stroke="#90a4d4" stroke-width="1.3"/>
  <circle cx="100" cy="90" r="72" fill="none" stroke="#90a4d4" stroke-width="1.3"/>
  <!-- Nucleus -->
  <circle cx="100" cy="90" r="20" fill="url(#nuc3d)" stroke="#9a1c1c" stroke-width="1"/>
  <text x="100" y="88" font-family="Arial" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">2p+</text>
  <text x="100" y="98" font-family="Arial" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">2n</text>
  <!-- Inner shell electrons (2) -->
  <circle cx="100" cy="50" r="6" fill="#1d4ed8"/><text x="100" y="53" font-family="Arial" font-size="8" fill="#fff" text-anchor="middle">−</text>
  <circle cx="100" cy="130" r="6" fill="#1d4ed8"/><text x="100" y="133" font-family="Arial" font-size="8" fill="#fff" text-anchor="middle">−</text>
  <!-- Outer shell electrons (4) -->
  <circle cx="100" cy="18" r="6" fill="#1d4ed8"/><text x="100" y="21" font-family="Arial" font-size="8" fill="#fff" text-anchor="middle">−</text>
  <circle cx="172" cy="90" r="6" fill="#1d4ed8"/><text x="172" y="93" font-family="Arial" font-size="8" fill="#fff" text-anchor="middle">−</text>
  <circle cx="100" cy="162" r="6" fill="#1d4ed8"/><text x="100" y="165" font-family="Arial" font-size="8" fill="#fff" text-anchor="middle">−</text>
  <circle cx="28" cy="90" r="6" fill="#1d4ed8"/><text x="28" y="93" font-family="Arial" font-size="8" fill="#fff" text-anchor="middle">−</text>
  <!-- Labels -->
  <line x1="118" y1="78" x2="200" y2="50" stroke="#333" stroke-width="1"/>
  <text x="202" y="48" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">nucleus</text>
  <text x="202" y="58" font-family="Arial" font-size="7" fill="#555">(protons + neutrons)</text>
  <line x1="172" y1="90" x2="200" y2="110" stroke="#333" stroke-width="1"/>
  <text x="202" y="108" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">electrons</text>
  <text x="202" y="118" font-family="Arial" font-size="7" fill="#555">in shells</text>
</svg>`,

  /**
   * Exothermic reaction profile — energy vs progress, products lower than reactants,
   * activation-energy hump, and an arrow showing energy released. Compact.
   */
  'reaction-profile-exo': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 170" width="260" height="170">
  <!-- Axes -->
  <line x1="34" y1="14" x2="34" y2="150" stroke="#333" stroke-width="1.5"/>
  <line x1="34" y1="150" x2="248" y2="150" stroke="#333" stroke-width="1.5"/>
  <text x="10" y="86" font-family="Arial" font-size="8" fill="#333" transform="rotate(-90 10 86)" text-anchor="middle">Energy</text>
  <text x="140" y="165" font-family="Arial" font-size="8" fill="#333" text-anchor="middle">Progress of reaction</text>
  <!-- Reaction curve: reactants high-ish, hump, products low -->
  <path d="M 44 70 L 90 70 C 120 70 120 30 150 30 C 180 30 180 120 210 120 L 240 120" fill="none" stroke="#1a237e" stroke-width="2.2"/>
  <!-- Reactant / product levels -->
  <line x1="44" y1="70" x2="90" y2="70" stroke="#1a237e" stroke-width="2.2"/>
  <line x1="210" y1="120" x2="240" y2="120" stroke="#1a237e" stroke-width="2.2"/>
  <text x="60" y="64" font-family="Arial" font-size="7.5" fill="#333">reactants</text>
  <text x="214" y="134" font-family="Arial" font-size="7.5" fill="#333">products</text>
  <!-- Activation energy arrow -->
  <line x1="150" y1="70" x2="150" y2="32" stroke="#c62828" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="156" y="50" font-family="Arial" font-size="7" fill="#c62828">Eₐ</text>
  <!-- Energy released arrow -->
  <line x1="100" y1="70" x2="100" y2="120" stroke="#2e7d32" stroke-width="1.2" marker-end="url(#exoArr)"/>
  <defs><marker id="exoArr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#2e7d32"/></marker></defs>
  <text x="104" y="98" font-family="Arial" font-size="7" fill="#2e7d32" font-weight="bold">ΔH</text>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // BIOLOGY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Animal cell — membrane, cytoplasm, nucleus, mitochondria, ribosomes.
   * Labelled for cell-biology info / label-diagram question.
   */
  'animal-cell': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 180" width="260" height="180">
  <!-- Cell membrane + cytoplasm -->
  <ellipse cx="110" cy="90" rx="92" ry="72" fill="#fde8f0" stroke="#c2185b" stroke-width="2.5"/>
  <!-- Nucleus -->
  <circle cx="105" cy="86" r="30" fill="#9c27b0" opacity="0.35" stroke="#6a1b9a" stroke-width="2"/>
  <circle cx="105" cy="86" r="9" fill="#6a1b9a" opacity="0.7"/>
  <!-- Mitochondria -->
  <ellipse cx="55" cy="135" rx="20" ry="10" fill="#ff7043" stroke="#bf360c" stroke-width="1.5" transform="rotate(-20 55 135)"/>
  <path d="M 42 137 q 6 -6 12 0 q 6 6 12 0" fill="none" stroke="#bf360c" stroke-width="1"/>
  <!-- Ribosomes -->
  <circle cx="150" cy="50" r="3.5" fill="#1565c0"/>
  <circle cx="162" cy="60" r="3.5" fill="#1565c0"/>
  <circle cx="150" cy="125" r="3.5" fill="#1565c0"/>
  <!-- Labels -->
  <line x1="135" y1="68" x2="206" y2="40" stroke="#333" stroke-width="1"/>
  <text x="208" y="42" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">nucleus</text>
  <line x1="200" y1="90" x2="220" y2="90" stroke="#333" stroke-width="1"/>
  <text x="200" y="84" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e" text-anchor="end">cell membrane</text>
  <line x1="75" y1="128" x2="210" y2="120" stroke="#333" stroke-width="1"/>
  <text x="212" y="122" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">mitochondria</text>
  <line x1="162" y1="60" x2="206" y2="72" stroke="#333" stroke-width="1"/>
  <text x="208" y="74" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">ribosomes</text>
  <text x="60" y="70" font-family="Arial" font-size="8" fill="#777" font-style="italic">cytoplasm</text>
</svg>`,

  /**
   * Labelled heart — four chambers, simplified, for circulatory system.
   */
  'heart-labelled': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 190" width="260" height="190">
  <!-- Heart outline -->
  <path d="M 110 175 C 40 120 35 60 70 45 C 95 34 110 55 110 65 C 110 55 125 34 150 45 C 185 60 180 120 110 175 Z" fill="#ffcdd2" stroke="#b71c1c" stroke-width="2.5"/>
  <!-- Septum -->
  <line x1="110" y1="62" x2="110" y2="160" stroke="#b71c1c" stroke-width="1.5"/>
  <!-- Chamber divisions -->
  <line x1="70" y1="100" x2="110" y2="100" stroke="#b71c1c" stroke-width="1.2"/>
  <line x1="110" y1="100" x2="152" y2="100" stroke="#b71c1c" stroke-width="1.2"/>
  <!-- Blood colour hints: right side blue, left side red -->
  <path d="M 70 65 L 110 65 L 110 98 L 74 98 C 64 88 62 76 70 65 Z" fill="#90caf9" opacity="0.6"/>
  <path d="M 110 65 L 150 65 C 158 76 156 88 146 98 L 110 98 Z" fill="#ef9a9a" opacity="0.7"/>
  <!-- Chamber labels -->
  <text x="88" y="84" font-family="Arial" font-size="6.5" fill="#0d47a1" text-anchor="middle">right</text>
  <text x="88" y="91" font-family="Arial" font-size="6.5" fill="#0d47a1" text-anchor="middle">atrium</text>
  <text x="132" y="84" font-family="Arial" font-size="6.5" fill="#b71c1c" text-anchor="middle">left</text>
  <text x="132" y="91" font-family="Arial" font-size="6.5" fill="#b71c1c" text-anchor="middle">atrium</text>
  <text x="90" y="130" font-family="Arial" font-size="6.5" fill="#0d47a1" text-anchor="middle">right</text>
  <text x="90" y="137" font-family="Arial" font-size="6.5" fill="#0d47a1" text-anchor="middle">ventricle</text>
  <text x="130" y="130" font-family="Arial" font-size="6.5" fill="#b71c1c" text-anchor="middle">left</text>
  <text x="130" y="137" font-family="Arial" font-size="6.5" fill="#b71c1c" text-anchor="middle">ventricle</text>
  <!-- Outer labels -->
  <line x1="150" y1="70" x2="205" y2="55" stroke="#333" stroke-width="1"/>
  <text x="207" y="57" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">aorta</text>
  <line x1="120" y1="150" x2="205" y2="150" stroke="#333" stroke-width="1"/>
  <text x="207" y="152" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">thick muscle</text>
  <text x="207" y="162" font-family="Arial" font-size="7" fill="#555">(left ventricle)</text>
</svg>`,

  /**
   * Enzyme lock-and-key — enzyme with active site + matching substrate.
   */
  'enzyme-lock-key': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 150" width="260" height="150">
  <!-- Enzyme blob with notch (active site) -->
  <path d="M 30 40 h 70 v 18 h 16 v -18 h 24 a 12 12 0 0 1 12 12 v 56 a 12 12 0 0 1 -12 12 h -110 a 12 12 0 0 1 -12 -12 v -56 a 12 12 0 0 1 12 -12 Z" fill="#a5d6a7" stroke="#2e7d32" stroke-width="2"/>
  <text x="75" y="100" font-family="Arial" font-size="9" font-weight="bold" fill="#1b5e20" text-anchor="middle">enzyme</text>
  <!-- Substrate fitting the notch -->
  <path d="M 100 8 h 16 v 24 h -16 Z" fill="#ffb74d" stroke="#e65100" stroke-width="2"/>
  <text x="108" y="6" font-family="Arial" font-size="7.5" fill="#e65100" text-anchor="middle">substrate</text>
  <!-- Active site label -->
  <line x1="108" y1="58" x2="200" y2="48" stroke="#333" stroke-width="1"/>
  <text x="202" y="50" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">active site</text>
  <text x="202" y="60" font-family="Arial" font-size="7" fill="#555">(specific shape)</text>
  <line x1="170" y1="95" x2="200" y2="100" stroke="#333" stroke-width="1"/>
  <text x="202" y="102" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">enzyme</text>
</svg>`,

  /**
   * Photosynthesis leaf — inputs (CO2, water, light) and outputs (glucose, O2).
   */
  'photosynthesis-leaf': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 150" width="270" height="150">
  <!-- Sun -->
  <circle cx="36" cy="32" r="15" fill="#ffd54f" stroke="#fbc02d" stroke-width="1.5"/>
  <g stroke="#fbc02d" stroke-width="1.5"><line x1="36" y1="8" x2="36" y2="14"/><line x1="14" y1="32" x2="20" y2="32"/><line x1="20" y1="16" x2="24" y2="20"/></g>
  <text x="36" y="58" font-family="Arial" font-size="7.5" fill="#f57f17" text-anchor="middle">light</text>
  <!-- Leaf -->
  <path d="M 130 75 C 95 35 165 25 175 30 C 200 50 175 110 130 105 C 110 100 110 88 130 75 Z" fill="#66bb6a" stroke="#2e7d32" stroke-width="2"/>
  <path d="M 130 100 C 145 80 160 60 172 40" fill="none" stroke="#2e7d32" stroke-width="1.2"/>
  <!-- Inputs arrows -->
  <line x1="52" y1="36" x2="118" y2="62" stroke="#f9a825" stroke-width="1.6" marker-end="url(#psArr)"/>
  <text x="50" y="92" font-family="Arial" font-size="8" fill="#0d47a1">CO₂ →</text>
  <line x1="84" y1="88" x2="120" y2="80" stroke="#1565c0" stroke-width="1.6" marker-end="url(#psArr)"/>
  <text x="40" y="118" font-family="Arial" font-size="8" fill="#1565c0">water (roots) →</text>
  <line x1="118" y1="112" x2="135" y2="100" stroke="#1565c0" stroke-width="1.6" marker-end="url(#psArr)"/>
  <!-- Outputs arrows -->
  <line x1="176" y1="55" x2="215" y2="40" stroke="#2e7d32" stroke-width="1.6" marker-end="url(#psArr)"/>
  <text x="218" y="42" font-family="Arial" font-size="8" fill="#2e7d32">glucose</text>
  <line x1="178" y1="80" x2="215" y2="92" stroke="#2e7d32" stroke-width="1.6" marker-end="url(#psArr)"/>
  <text x="218" y="94" font-family="Arial" font-size="8" fill="#2e7d32">oxygen</text>
  <defs><marker id="psArr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#555"/></marker></defs>
</svg>`,

  /**
   * Diffusion / osmosis — partially permeable membrane with water moving from
   * high to low water concentration.
   */
  'diffusion-osmosis': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 150" width="260" height="150">
  <!-- Container -->
  <rect x="20" y="20" width="220" height="110" rx="4" fill="none" stroke="#333" stroke-width="2"/>
  <!-- Partially permeable membrane in the middle -->
  <line x1="130" y1="20" x2="130" y2="130" stroke="#1a237e" stroke-width="2" stroke-dasharray="4,3"/>
  <text x="130" y="14" font-family="Arial" font-size="7" fill="#1a237e" text-anchor="middle">partially permeable membrane</text>
  <!-- Left: dilute (more water) -->
  <rect x="22" y="22" width="106" height="106" fill="#bbdefb" opacity="0.5"/>
  <text x="74" y="120" font-family="Arial" font-size="7.5" fill="#0d47a1" text-anchor="middle">dilute (more water)</text>
  <!-- Right: concentrated (less water, more solute) -->
  <rect x="132" y="22" width="106" height="106" fill="#5c6bc0" opacity="0.45"/>
  <text x="186" y="120" font-family="Arial" font-size="7.5" fill="#1a237e" text-anchor="middle">concentrated (less water)</text>
  <!-- Solute particles on the right -->
  <circle cx="160" cy="55" r="4" fill="#1a237e"/><circle cx="195" cy="70" r="4" fill="#1a237e"/>
  <circle cx="175" cy="90" r="4" fill="#1a237e"/><circle cx="210" cy="50" r="4" fill="#1a237e"/>
  <circle cx="200" cy="100" r="4" fill="#1a237e"/>
  <!-- Water particles small on left -->
  <circle cx="50" cy="50" r="2.5" fill="#1976d2"/><circle cx="80" cy="65" r="2.5" fill="#1976d2"/>
  <circle cx="60" cy="90" r="2.5" fill="#1976d2"/><circle cx="95" cy="100" r="2.5" fill="#1976d2"/>
  <!-- Net water movement arrow across membrane -->
  <line x1="95" y1="60" x2="165" y2="60" stroke="#2e7d32" stroke-width="2" marker-end="url(#osmArr)"/>
  <text x="130" y="52" font-family="Arial" font-size="7.5" fill="#2e7d32" text-anchor="middle" font-weight="bold">net water movement</text>
  <defs><marker id="osmArr" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 9 3.5, 0 7" fill="#2e7d32"/></marker></defs>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // PHYSICS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Simple circuit — cell, switch, lamp, ammeter in series. Print-safe.
   */
  'simple-circuit': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 170" width="250" height="170">
  <!-- Wires (rectangle loop) -->
  <rect x="35" y="35" width="180" height="100" fill="none" stroke="#222" stroke-width="2"/>
  <!-- Cell (top middle) -->
  <line x1="112" y1="35" x2="112" y2="20" stroke="#222" stroke-width="2"/>
  <line x1="112" y1="20" x2="138" y2="20" stroke="#222" stroke-width="2"/>
  <line x1="138" y1="20" x2="138" y2="35" stroke="#222" stroke-width="2"/>
  <line x1="118" y1="12" x2="118" y2="28" stroke="#222" stroke-width="3"/>
  <line x1="130" y1="16" x2="130" y2="24" stroke="#222" stroke-width="6"/>
  <text x="124" y="44" font-family="Arial" font-size="7.5" fill="#1a237e" text-anchor="middle" font-weight="bold">cell</text>
  <!-- Lamp (right side) -->
  <circle cx="215" cy="85" r="13" fill="#fff59d" stroke="#222" stroke-width="2"/>
  <line x1="206" y1="76" x2="224" y2="94" stroke="#222" stroke-width="1.5"/>
  <line x1="224" y1="76" x2="206" y2="94" stroke="#222" stroke-width="1.5"/>
  <text x="215" y="115" font-family="Arial" font-size="7.5" fill="#1a237e" text-anchor="middle" font-weight="bold">lamp</text>
  <!-- Switch (bottom) -->
  <circle cx="105" cy="135" r="3" fill="#222"/>
  <circle cx="145" cy="135" r="3" fill="#222"/>
  <line x1="105" y1="135" x2="140" y2="122" stroke="#222" stroke-width="2"/>
  <text x="125" y="152" font-family="Arial" font-size="7.5" fill="#1a237e" text-anchor="middle" font-weight="bold">switch</text>
  <!-- Ammeter (left side) -->
  <circle cx="35" cy="85" r="13" fill="#fff" stroke="#222" stroke-width="2"/>
  <text x="35" y="89" font-family="Arial" font-size="11" fill="#222" text-anchor="middle" font-weight="bold">A</text>
  <text x="35" y="115" font-family="Arial" font-size="7.5" fill="#1a237e" text-anchor="middle" font-weight="bold">ammeter</text>
</svg>`,

  /**
   * Transverse wave — labelled wavelength, amplitude, rest line. Compact.
   */
  'wave-labelled': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 150" width="260" height="150">
  <!-- Rest line -->
  <line x1="14" y1="80" x2="246" y2="80" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="248" y="83" font-family="Arial" font-size="7" fill="#777">rest</text>
  <!-- Wave (two full wavelengths) -->
  <path d="M 20 80 C 40 20, 70 20, 90 80 C 110 140, 140 140, 160 80 C 180 20, 210 20, 230 80" fill="none" stroke="#1a237e" stroke-width="2.5"/>
  <!-- Wavelength marker (crest to crest) -->
  <line x1="55" y1="34" x2="125" y2="34" stroke="#c62828" stroke-width="1.2" marker-start="url(#wArr)" marker-end="url(#wArr)"/>
  <text x="90" y="28" font-family="Arial" font-size="8" fill="#c62828" text-anchor="middle" font-weight="bold">wavelength (λ)</text>
  <!-- Amplitude marker -->
  <line x1="125" y1="80" x2="125" y2="128" stroke="#2e7d32" stroke-width="1.2" marker-end="url(#wArr2)"/>
  <text x="170" y="112" font-family="Arial" font-size="8" fill="#2e7d32" text-anchor="middle" font-weight="bold">amplitude</text>
  <defs>
    <marker id="wArr" markerWidth="8" markerHeight="7" refX="4" refY="3.5" orient="auto"><polygon points="0 3.5, 8 0, 8 7" fill="#c62828"/></marker>
    <marker id="wArr2" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#2e7d32"/></marker>
  </defs>
</svg>`,

  /**
   * Free-body force diagram — a car/box with weight, reaction, thrust and drag
   * arrows. Used for forces & motion. Compact, info-panel sized.
   */
  'forces-arrows': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 160" width="250" height="160">
  <!-- Ground -->
  <line x1="10" y1="118" x2="240" y2="118" stroke="#555" stroke-width="1.5"/>
  <!-- Object -->
  <rect x="95" y="78" width="60" height="40" rx="4" fill="#bbdefb" stroke="#1565c0" stroke-width="2"/>
  <text x="125" y="102" font-family="Arial" font-size="9" fill="#0d47a1" text-anchor="middle" font-weight="bold">object</text>
  <defs><marker id="fArr" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 9 3.5, 0 7" fill="#111"/></marker></defs>
  <!-- Thrust (right) -->
  <line x1="155" y1="98" x2="225" y2="98" stroke="#2e7d32" stroke-width="2.5" marker-end="url(#fArr)"/>
  <text x="200" y="92" font-family="Arial" font-size="8" fill="#2e7d32" font-weight="bold" text-anchor="middle">thrust</text>
  <!-- Drag (left) -->
  <line x1="95" y1="98" x2="40" y2="98" stroke="#c62828" stroke-width="2" marker-end="url(#fArr)"/>
  <text x="60" y="92" font-family="Arial" font-size="8" fill="#c62828" font-weight="bold" text-anchor="middle">drag</text>
  <!-- Weight (down) -->
  <line x1="125" y1="118" x2="125" y2="150" stroke="#111" stroke-width="2.5" marker-end="url(#fArr)"/>
  <text x="125" y="148" font-family="Arial" font-size="8" fill="#111" font-weight="bold" text-anchor="start" dx="6">weight (W = m g)</text>
  <!-- Reaction (up) -->
  <line x1="110" y1="78" x2="110" y2="46" stroke="#1565c0" stroke-width="2.5" marker-end="url(#fArr)"/>
  <text x="110" y="42" font-family="Arial" font-size="8" fill="#1565c0" font-weight="bold" text-anchor="middle">reaction</text>
</svg>`,

  /**
   * Energy Sankey — input energy splitting into useful and wasted energy.
   * Used for energy transfers & efficiency. Compact.
   */
  'energy-sankey': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 150" width="260" height="150">
  <!-- Input band -->
  <rect x="10" y="45" width="60" height="60" fill="#90caf9" stroke="#1565c0" stroke-width="1"/>
  <text x="40" y="38" font-family="Arial" font-size="8" fill="#0d47a1" text-anchor="middle" font-weight="bold">input</text>
  <text x="40" y="120" font-family="Arial" font-size="7.5" fill="#0d47a1" text-anchor="middle">100 J</text>
  <!-- Useful branch (upper, wider) -->
  <path d="M 70 45 L 200 35 L 200 70 L 70 78 Z" fill="#a5d6a7" stroke="#2e7d32" stroke-width="1"/>
  <text x="210" y="50" font-family="Arial" font-size="8" fill="#1b5e20" font-weight="bold">useful</text>
  <text x="210" y="60" font-family="Arial" font-size="7.5" fill="#1b5e20">60 J</text>
  <!-- Wasted branch (lower, narrower) -->
  <path d="M 70 78 L 200 92 L 200 118 L 70 105 Z" fill="#ef9a9a" stroke="#c62828" stroke-width="1"/>
  <text x="210" y="104" font-family="Arial" font-size="8" fill="#b71c1c" font-weight="bold">wasted</text>
  <text x="210" y="114" font-family="Arial" font-size="7.5" fill="#b71c1c">40 J (heat)</text>
  <!-- Efficiency note -->
  <text x="130" y="142" font-family="Arial" font-size="8" fill="#1a237e" text-anchor="middle" font-weight="bold">efficiency = useful ÷ total</text>
</svg>`,

};

export default diagrams;
