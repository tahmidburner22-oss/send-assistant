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
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 184" width="300" height="184">
  <defs>
    <radialGradient id="cellNuc" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#e1bee7"/>
      <stop offset="100%" stop-color="#8e24aa"/>
    </radialGradient>
  </defs>
  <!-- Cell membrane + cytoplasm (everything below sits INSIDE this ellipse) -->
  <ellipse cx="100" cy="92" rx="82" ry="74" fill="#fde8f0" stroke="#c2185b" stroke-width="2.5"/>
  <text x="86" y="150" font-family="Arial" font-size="8" fill="#999" font-style="italic">cytoplasm</text>
  <!-- Nucleus (3D) -->
  <circle cx="92" cy="82" r="28" fill="url(#cellNuc)" stroke="#6a1b9a" stroke-width="1.5"/>
  <circle cx="92" cy="82" r="8" fill="#4a148c" opacity="0.7"/>
  <!-- Mitochondrion -->
  <ellipse cx="68" cy="132" rx="17" ry="8.5" fill="#ff7043" stroke="#bf360c" stroke-width="1.5" transform="rotate(-18 68 132)"/>
  <path d="M 56 132 q 6 -5 12 0 q 6 5 12 0" fill="none" stroke="#bf360c" stroke-width="1" transform="rotate(-18 68 132)"/>
  <!-- Ribosomes (small dots, well inside) -->
  <circle cx="128" cy="64" r="3.5" fill="#1565c0"/>
  <circle cx="138" cy="104" r="3.5" fill="#1565c0"/>
  <circle cx="120" cy="120" r="3.5" fill="#1565c0"/>
  <!-- Leader lines + labels (all kept inside the 300-wide viewBox) -->
  <line x1="116" y1="70" x2="190" y2="40" stroke="#333" stroke-width="1"/>
  <text x="193" y="43" font-family="Arial" font-size="9" font-weight="bold" fill="#1a237e">nucleus</text>
  <line x1="180" y1="98" x2="190" y2="74" stroke="#333" stroke-width="1"/>
  <text x="193" y="77" font-family="Arial" font-size="9" font-weight="bold" fill="#1a237e">cell membrane</text>
  <line x1="138" y1="104" x2="190" y2="110" stroke="#333" stroke-width="1"/>
  <text x="193" y="113" font-family="Arial" font-size="9" font-weight="bold" fill="#1a237e">ribosomes</text>
  <line x1="80" y1="134" x2="190" y2="144" stroke="#333" stroke-width="1"/>
  <text x="193" y="147" font-family="Arial" font-size="9" font-weight="bold" fill="#1a237e">mitochondria</text>
</svg>`,

  /**
   * Blank/numbered animal cell for "label the cell" questions — same shapes,
   * numbered callouts (1-4) instead of names so pupils fill in the answers.
   */
  'animal-cell-blank': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 184" width="280" height="184">
  <ellipse cx="110" cy="92" rx="88" ry="74" fill="#fde8f0" stroke="#c2185b" stroke-width="2.5"/>
  <circle cx="100" cy="82" r="28" fill="#e1bee7" stroke="#6a1b9a" stroke-width="1.5"/>
  <circle cx="100" cy="82" r="8" fill="#8e24aa" opacity="0.6"/>
  <ellipse cx="74" cy="134" rx="17" ry="8.5" fill="#ff7043" stroke="#bf360c" stroke-width="1.5" transform="rotate(-18 74 134)"/>
  <circle cx="146" cy="104" r="3.5" fill="#1565c0"/>
  <circle cx="134" cy="118" r="3.5" fill="#1565c0"/>
  <!-- Numbered callouts -->
  <line x1="124" y1="70" x2="196" y2="42" stroke="#333" stroke-width="1"/>
  <circle cx="204" cy="42" r="9" fill="#1a237e"/><text x="204" y="45" font-family="Arial" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">1</text>
  <text x="218" y="45" font-family="Arial" font-size="8" fill="#333">_________</text>
  <line x1="186" y1="100" x2="196" y2="78" stroke="#333" stroke-width="1"/>
  <circle cx="204" cy="78" r="9" fill="#1a237e"/><text x="204" y="81" font-family="Arial" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">2</text>
  <text x="218" y="81" font-family="Arial" font-size="8" fill="#333">_________</text>
  <line x1="146" y1="104" x2="196" y2="114" stroke="#333" stroke-width="1"/>
  <circle cx="204" cy="114" r="9" fill="#1a237e"/><text x="204" y="117" font-family="Arial" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">3</text>
  <text x="218" y="117" font-family="Arial" font-size="8" fill="#333">_________</text>
  <line x1="86" y1="136" x2="196" y2="150" stroke="#333" stroke-width="1"/>
  <circle cx="204" cy="150" r="9" fill="#1a237e"/><text x="204" y="153" font-family="Arial" font-size="10" font-weight="bold" fill="#fff" text-anchor="middle">4</text>
  <text x="218" y="153" font-family="Arial" font-size="8" fill="#333">_________</text>
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

  /**
   * Blank/numbered series circuit for "label the circuit" questions —
   * components drawn but labelled with numbered callouts (1-4).
   */
  'simple-circuit-blank': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 175" width="260" height="175">
  <rect x="40" y="40" width="170" height="95" fill="none" stroke="#222" stroke-width="2"/>
  <!-- Cell (top) -->
  <line x1="112" y1="40" x2="112" y2="26" stroke="#222" stroke-width="2"/>
  <line x1="138" y1="40" x2="138" y2="26" stroke="#222" stroke-width="2"/>
  <line x1="118" y1="18" x2="118" y2="34" stroke="#222" stroke-width="3"/>
  <line x1="130" y1="22" x2="130" y2="30" stroke="#222" stroke-width="6"/>
  <circle cx="125" cy="52" r="8" fill="#1a237e"/><text x="125" y="55" font-family="Arial" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle">1</text>
  <!-- Lamp (right) -->
  <circle cx="210" cy="88" r="13" fill="#fff59d" stroke="#222" stroke-width="2"/>
  <line x1="201" y1="79" x2="219" y2="97" stroke="#222" stroke-width="1.5"/>
  <line x1="219" y1="79" x2="201" y2="97" stroke="#222" stroke-width="1.5"/>
  <circle cx="232" cy="88" r="8" fill="#1a237e"/><text x="232" y="91" font-family="Arial" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle">2</text>
  <!-- Switch (bottom) -->
  <circle cx="105" cy="135" r="3" fill="#222"/><circle cx="145" cy="135" r="3" fill="#222"/>
  <line x1="105" y1="135" x2="140" y2="122" stroke="#222" stroke-width="2"/>
  <circle cx="125" cy="155" r="8" fill="#1a237e"/><text x="125" y="158" font-family="Arial" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle">3</text>
  <!-- Ammeter (left) -->
  <circle cx="40" cy="88" r="13" fill="#fff" stroke="#222" stroke-width="2"/>
  <text x="40" y="92" font-family="Arial" font-size="11" font-weight="bold" fill="#222" text-anchor="middle">A</text>
  <circle cx="18" cy="88" r="8" fill="#1a237e"/><text x="18" y="91" font-family="Arial" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle">4</text>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // ATOMIC STRUCTURE & PERIODIC TABLE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Element vs compound vs mixture — three particle boxes. */
  'element-compound-mixture': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 120" width="330" height="120">
  <g font-family="Arial" text-anchor="middle">
  <!-- Element -->
  <rect x="6" y="20" width="96" height="74" rx="6" fill="#eef2ff" stroke="#1a237e" stroke-width="1.5"/>
  <text x="54" y="14" font-size="9" font-weight="bold" fill="#1a237e">ELEMENT</text>
  <circle cx="34" cy="44" r="9" fill="#3b82f6"/><circle cx="62" cy="44" r="9" fill="#3b82f6"/>
  <circle cx="48" cy="68" r="9" fill="#3b82f6"/><circle cx="76" cy="68" r="9" fill="#3b82f6"/>
  <text x="54" y="106" font-size="7" fill="#555">one type of atom</text>
  <!-- Compound -->
  <rect x="117" y="20" width="96" height="74" rx="6" fill="#eef2ff" stroke="#1a237e" stroke-width="1.5"/>
  <text x="165" y="14" font-size="9" font-weight="bold" fill="#1a237e">COMPOUND</text>
  <line x1="142" y1="46" x2="160" y2="46" stroke="#333" stroke-width="2"/>
  <circle cx="142" cy="46" r="9" fill="#3b82f6"/><circle cx="166" cy="46" r="7" fill="#ef4444"/>
  <line x1="178" y1="70" x2="196" y2="70" stroke="#333" stroke-width="2"/>
  <circle cx="178" cy="70" r="9" fill="#3b82f6"/><circle cx="202" cy="70" r="7" fill="#ef4444"/>
  <text x="165" y="106" font-size="7" fill="#555">atoms chemically bonded</text>
  <!-- Mixture -->
  <rect x="228" y="20" width="96" height="74" rx="6" fill="#eef2ff" stroke="#1a237e" stroke-width="1.5"/>
  <text x="276" y="14" font-size="9" font-weight="bold" fill="#1a237e">MIXTURE</text>
  <circle cx="250" cy="42" r="9" fill="#3b82f6"/><circle cx="300" cy="46" r="7" fill="#ef4444"/>
  <line x1="266" y1="68" x2="284" y2="68" stroke="#333" stroke-width="2"/>
  <circle cx="266" cy="68" r="9" fill="#3b82f6"/><circle cx="290" cy="68" r="7" fill="#ef4444"/>
  <circle cx="248" cy="74" r="7" fill="#ef4444"/>
  <text x="276" y="106" font-size="7" fill="#555">not chemically bonded</text>
  </g>
</svg>`,

  /** Filtration apparatus — funnel + filter paper, residue, filtrate in beaker. */
  'filtration': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200" width="220" height="200">
  <!-- Funnel -->
  <path d="M 60 20 L 140 20 L 108 76 L 92 76 Z" fill="#eef6ff" stroke="#333" stroke-width="2"/>
  <line x1="92" y1="76" x2="92" y2="104" stroke="#333" stroke-width="2"/>
  <line x1="108" y1="76" x2="108" y2="104" stroke="#333" stroke-width="2"/>
  <!-- Filter paper -->
  <path d="M 70 24 L 130 24 L 100 60 Z" fill="#fff" stroke="#999" stroke-width="1"/>
  <!-- Residue on paper -->
  <path d="M 84 30 L 116 30 L 100 48 Z" fill="#c8a165" stroke="#8a6d3b" stroke-width="1"/>
  <!-- Mixture being poured -->
  <ellipse cx="100" cy="22" rx="26" ry="4" fill="#9ecbf0" opacity="0.6"/>
  <!-- Beaker -->
  <path d="M 60 110 L 60 180 Q 60 188 68 188 L 132 188 Q 140 188 140 180 L 140 110" fill="none" stroke="#333" stroke-width="2.5"/>
  <rect x="62" y="150" width="76" height="36" rx="2" fill="#d4eaf7" opacity="0.7"/>
  <!-- Drips -->
  <circle cx="100" cy="120" r="2.5" fill="#9ecbf0"/>
  <circle cx="100" cy="134" r="2.5" fill="#9ecbf0"/>
  <!-- Labels -->
  <line x1="116" y1="38" x2="170" y2="34" stroke="#333" stroke-width="1"/>
  <text x="172" y="32" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">residue</text>
  <text x="172" y="42" font-family="Arial" font-size="7" fill="#555">(insoluble solid)</text>
  <line x1="128" y1="50" x2="170" y2="62" stroke="#333" stroke-width="1"/>
  <text x="172" y="60" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">filter paper</text>
  <line x1="138" y1="165" x2="170" y2="150" stroke="#333" stroke-width="1"/>
  <text x="172" y="148" font-family="Arial" font-size="8.5" font-weight="bold" fill="#1a237e">filtrate</text>
  <text x="172" y="158" font-family="Arial" font-size="7" fill="#555">(liquid that passes)</text>
</svg>`,

  /** Timeline of atomic models: Dalton, Thomson, Rutherford, Bohr. */
  'atom-model-timeline': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" width="360" height="130">
  <g font-family="Arial" text-anchor="middle">
  <!-- Dalton -->
  <circle cx="45" cy="45" r="24" fill="#9e9e9e" stroke="#555" stroke-width="1.5"/>
  <text x="45" y="86" font-size="9" font-weight="bold" fill="#1a237e">Dalton</text>
  <text x="45" y="98" font-size="7" fill="#555">solid sphere</text>
  <!-- Thomson -->
  <circle cx="135" cy="45" r="24" fill="#ffcdd2" stroke="#c62828" stroke-width="1.5"/>
  <circle cx="125" cy="38" r="3.5" fill="#1565c0"/><circle cx="146" cy="40" r="3.5" fill="#1565c0"/>
  <circle cx="130" cy="55" r="3.5" fill="#1565c0"/><circle cx="145" cy="56" r="3.5" fill="#1565c0"/>
  <text x="135" y="86" font-size="9" font-weight="bold" fill="#1a237e">Thomson</text>
  <text x="135" y="98" font-size="7" fill="#555">plum pudding</text>
  <!-- Rutherford -->
  <circle cx="225" cy="45" r="24" fill="none" stroke="#90a4d4" stroke-width="1.2"/>
  <circle cx="225" cy="45" r="6" fill="#d32f2f"/>
  <circle cx="225" cy="21" r="3" fill="#1565c0"/><circle cx="249" cy="45" r="3" fill="#1565c0"/>
  <text x="225" y="86" font-size="9" font-weight="bold" fill="#1a237e">Rutherford</text>
  <text x="225" y="98" font-size="7" fill="#555">nuclear model</text>
  <!-- Bohr -->
  <circle cx="315" cy="45" r="24" fill="none" stroke="#90a4d4" stroke-width="1.2"/>
  <circle cx="315" cy="45" r="13" fill="none" stroke="#90a4d4" stroke-width="1.2"/>
  <circle cx="315" cy="45" r="5" fill="#d32f2f"/>
  <circle cx="315" cy="32" r="3" fill="#1565c0"/><circle cx="315" cy="21" r="3" fill="#1565c0"/>
  <text x="315" y="86" font-size="9" font-weight="bold" fill="#1a237e">Bohr</text>
  <text x="315" y="98" font-size="7" fill="#555">electron shells</text>
  <!-- Arrow -->
  <line x1="20" y1="115" x2="340" y2="115" stroke="#333" stroke-width="1.5" marker-end="url(#tlArr)"/>
  <defs><marker id="tlArr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <text x="180" y="126" font-size="7" fill="#555">time / new evidence</text>
  </g>
</svg>`,

  /** Simplified periodic table block diagram — groups, periods, metals/non-metals. */
  'periodic-table-blocks': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150" width="320" height="150">
  <g font-family="Arial" font-size="7" text-anchor="middle">
  <!-- metal region -->
  <rect x="10" y="24" width="40" height="100" fill="#fde2c8" stroke="#b06a1a" stroke-width="1"/>
  <text x="30" y="20" font-size="8" font-weight="bold" fill="#1a237e">1  2</text>
  <!-- transition metals -->
  <rect x="52" y="44" width="120" height="60" fill="#ffe0b2" stroke="#b06a1a" stroke-width="1"/>
  <text x="112" y="78" font-size="7.5" fill="#8a4b00">transition metals</text>
  <!-- non-metals -->
  <rect x="174" y="24" width="110" height="100" fill="#dcedf9" stroke="#1565c0" stroke-width="1"/>
  <text x="229" y="20" font-size="8" font-weight="bold" fill="#1a237e">3  4  5  6  7  0</text>
  <!-- Group 0 -->
  <rect x="270" y="24" width="14" height="100" fill="#e1d5f5" stroke="#6a3fb0" stroke-width="1"/>
  <!-- staircase divide -->
  <polyline points="174,24 174,60 200,60 200,90 230,90 230,124" fill="none" stroke="#c62828" stroke-width="1.5" stroke-dasharray="3,2"/>
  <text x="30" y="138" font-size="8" font-weight="bold" fill="#b06a1a">METALS</text>
  <text x="232" y="138" font-size="8" font-weight="bold" fill="#1565c0">NON-METALS</text>
  <text x="277" y="138" font-size="7" fill="#6a3fb0">Gp 0</text>
  </g>
</svg>`,

  /** Group 1 reactivity trend — Li, Na, K with increasing reactivity arrow. */
  'group1-reactivity': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 160" width="210" height="160">
  <g font-family="Arial" text-anchor="middle">
  <rect x="40" y="14" width="90" height="28" rx="4" fill="#eef2ff" stroke="#1a237e" stroke-width="1.3"/>
  <text x="85" y="32" font-size="11" font-weight="bold" fill="#1a237e">Lithium (Li)</text>
  <rect x="40" y="60" width="90" height="28" rx="4" fill="#e3e9ff" stroke="#1a237e" stroke-width="1.3"/>
  <text x="85" y="78" font-size="11" font-weight="bold" fill="#1a237e">Sodium (Na)</text>
  <rect x="40" y="106" width="90" height="28" rx="4" fill="#d6deff" stroke="#1a237e" stroke-width="1.3"/>
  <text x="85" y="124" font-size="11" font-weight="bold" fill="#1a237e">Potassium (K)</text>
  <!-- arrow -->
  <line x1="160" y1="20" x2="160" y2="130" stroke="#c62828" stroke-width="2.5" marker-end="url(#g1Arr)"/>
  <defs><marker id="g1Arr" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 9 3.5, 0 7" fill="#c62828"/></marker></defs>
  <text x="186" y="80" font-size="8" font-weight="bold" fill="#c62828" transform="rotate(90 186 80)">reactivity increases</text>
  </g>
</svg>`,

  /** Group 7 trend — colour/state down the group. */
  'group7-trend': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 175" width="250" height="175">
  <g font-family="Arial" text-anchor="middle">
  <rect x="20" y="12" width="120" height="30" rx="4" fill="#fdf6c8" stroke="#c9b400" stroke-width="1.3"/>
  <text x="80" y="26" font-size="10" font-weight="bold" fill="#1a237e">Fluorine (F₂)</text>
  <text x="80" y="37" font-size="7.5" fill="#555">pale yellow gas</text>
  <rect x="20" y="50" width="120" height="30" rx="4" fill="#d7f5cf" stroke="#3a9a2a" stroke-width="1.3"/>
  <text x="80" y="64" font-size="10" font-weight="bold" fill="#1a237e">Chlorine (Cl₂)</text>
  <text x="80" y="75" font-size="7.5" fill="#555">green gas</text>
  <rect x="20" y="88" width="120" height="30" rx="4" fill="#f3c9a0" stroke="#b06a1a" stroke-width="1.3"/>
  <text x="80" y="102" font-size="10" font-weight="bold" fill="#1a237e">Bromine (Br₂)</text>
  <text x="80" y="113" font-size="7.5" fill="#555">orange liquid</text>
  <rect x="20" y="126" width="120" height="30" rx="4" fill="#cdbfe0" stroke="#5a3f8a" stroke-width="1.3"/>
  <text x="80" y="140" font-size="10" font-weight="bold" fill="#1a237e">Iodine (I₂)</text>
  <text x="80" y="151" font-size="7.5" fill="#555">grey solid</text>
  <!-- arrows -->
  <line x1="166" y1="20" x2="166" y2="150" stroke="#c62828" stroke-width="2.2" marker-start="url(#g7Up)"/>
  <defs><marker id="g7Up" markerWidth="9" markerHeight="7" refX="1" refY="3.5" orient="auto"><polygon points="9 0, 0 3.5, 9 7" fill="#c62828"/></marker></defs>
  <text x="180" y="85" font-size="7.5" font-weight="bold" fill="#c62828" transform="rotate(90 180 85)">reactivity increases ↑</text>
  <line x1="226" y1="20" x2="226" y2="150" stroke="#1565c0" stroke-width="2.2" marker-end="url(#g7Dn)"/>
  <defs><marker id="g7Dn" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 9 3.5, 0 7" fill="#1565c0"/></marker></defs>
  <text x="240" y="85" font-size="7.5" font-weight="bold" fill="#1565c0" transform="rotate(90 240 85)">melting point increases ↓</text>
  </g>
</svg>`,

  /** Noble gas full outer shells — He and Ne. */
  'noble-gas-shells': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 150" width="260" height="150">
  <defs>
    <radialGradient id="nucNG" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#ffd6d6"/><stop offset="100%" stop-color="#d32f2f"/>
    </radialGradient>
  </defs>
  <g font-family="Arial" text-anchor="middle">
  <!-- Helium -->
  <circle cx="70" cy="60" r="34" fill="none" stroke="#90a4d4" stroke-width="1.3"/>
  <circle cx="70" cy="60" r="13" fill="url(#nucNG)" stroke="#9a1c1c"/>
  <circle cx="70" cy="26" r="5" fill="#1565c0"/><circle cx="70" cy="94" r="5" fill="#1565c0"/>
  <text x="70" y="120" font-size="10" font-weight="bold" fill="#1a237e">Helium (2)</text>
  <!-- Neon -->
  <circle cx="185" cy="60" r="48" fill="none" stroke="#90a4d4" stroke-width="1.3"/>
  <circle cx="185" cy="60" r="22" fill="none" stroke="#90a4d4" stroke-width="1.3"/>
  <circle cx="185" cy="60" r="11" fill="url(#nucNG)" stroke="#9a1c1c"/>
  <circle cx="185" cy="38" r="4" fill="#1565c0"/><circle cx="185" cy="82" r="4" fill="#1565c0"/>
  <circle cx="185" cy="12" r="4" fill="#1565c0"/><circle cx="185" cy="108" r="4" fill="#1565c0"/>
  <circle cx="137" cy="60" r="4" fill="#1565c0"/><circle cx="233" cy="60" r="4" fill="#1565c0"/>
  <circle cx="151" cy="26" r="4" fill="#1565c0"/><circle cx="219" cy="26" r="4" fill="#1565c0"/>
  <circle cx="151" cy="94" r="4" fill="#1565c0"/><circle cx="219" cy="94" r="4" fill="#1565c0"/>
  <text x="185" y="134" font-size="10" font-weight="bold" fill="#1a237e">Neon (2,8)</text>
  </g>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // BONDING, STRUCTURE & PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Ionic bonding — electron transfer from Na to Cl forming Na+ and Cl-. */
  'ionic-bond-transfer': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 150" width="330" height="150">
  <g font-family="Arial" text-anchor="middle">
  <!-- Sodium atom -->
  <circle cx="60" cy="70" r="42" fill="none" stroke="#90a4d4" stroke-width="1.2"/>
  <circle cx="60" cy="70" r="22" fill="none" stroke="#90a4d4" stroke-width="1.2"/>
  <circle cx="60" cy="70" r="11" fill="#fde2c8" stroke="#b06a1a"/>
  <text x="60" y="74" font-size="9" font-weight="bold" fill="#b06a1a">Na</text>
  <circle cx="60" cy="28" r="4.5" fill="#c62828"/>
  <circle cx="60" cy="48" r="3.5" fill="#1565c0"/><circle cx="60" cy="92" r="3.5" fill="#1565c0"/>
  <circle cx="38" cy="70" r="3.5" fill="#1565c0"/><circle cx="82" cy="70" r="3.5" fill="#1565c0"/>
  <text x="60" y="132" font-size="9" font-weight="bold" fill="#1a237e">Na → Na⁺</text>
  <!-- transfer arrow -->
  <path d="M 92 24 q 70 -14 130 36" fill="none" stroke="#c62828" stroke-width="2" marker-end="url(#ibArr)"/>
  <defs><marker id="ibArr" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 9 3.5, 0 7" fill="#c62828"/></marker></defs>
  <text x="165" y="20" font-size="8" fill="#c62828">transfer 1 e⁻</text>
  <!-- Chlorine atom -->
  <circle cx="262" cy="70" r="42" fill="none" stroke="#90a4d4" stroke-width="1.2"/>
  <circle cx="262" cy="70" r="22" fill="none" stroke="#90a4d4" stroke-width="1.2"/>
  <circle cx="262" cy="70" r="11" fill="#d7f5cf" stroke="#3a9a2a"/>
  <text x="262" y="74" font-size="9" font-weight="bold" fill="#3a9a2a">Cl</text>
  <circle cx="262" cy="28" r="3.5" fill="#1565c0"/><circle cx="262" cy="48" r="3.5" fill="#1565c0"/>
  <circle cx="262" cy="92" r="3.5" fill="#1565c0"/>
  <circle cx="240" cy="70" r="3.5" fill="#1565c0"/>
  <circle cx="232" cy="50" r="3.5" fill="#1565c0"/><circle cx="292" cy="50" r="3.5" fill="#1565c0"/>
  <circle cx="292" cy="90" r="3.5" fill="#1565c0"/>
  <text x="262" y="132" font-size="9" font-weight="bold" fill="#1a237e">Cl → Cl⁻</text>
  </g>
</svg>`,

  /** Covalent bonding — shared pair of electrons in H2 / Cl2 style. */
  'covalent-bond-shared': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150" width="300" height="150">
  <g font-family="Arial" text-anchor="middle">
  <text x="150" y="14" font-size="9" font-weight="bold" fill="#1a237e">A SHARED PAIR OF ELECTRONS</text>
  <!-- two overlapping shells -->
  <circle cx="115" cy="80" r="44" fill="none" stroke="#90a4d4" stroke-width="1.3"/>
  <circle cx="185" cy="80" r="44" fill="none" stroke="#90a4d4" stroke-width="1.3"/>
  <circle cx="115" cy="80" r="11" fill="#dbe7ff" stroke="#1a237e"/><text x="115" y="84" font-size="9" font-weight="bold" fill="#1a237e">H</text>
  <circle cx="185" cy="80" r="11" fill="#dbe7ff" stroke="#1a237e"/><text x="185" y="84" font-size="9" font-weight="bold" fill="#1a237e">H</text>
  <!-- shared electrons in the overlap -->
  <circle cx="150" cy="70" r="5" fill="#c62828"/>
  <circle cx="150" cy="90" r="5" fill="#c62828"/>
  <!-- outer electrons -->
  <circle cx="115" cy="36" r="4" fill="#1565c0"/>
  <circle cx="185" cy="36" r="4" fill="#1565c0"/>
  <text x="150" y="140" font-size="8" fill="#555">Each H shares one electron → both have a full shell (2)</text>
  </g>
</svg>`,

  /** States of matter — solid, liquid, gas particle arrangement. */
  'states-of-matter': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 130" width="330" height="130">
  <g font-family="Arial" text-anchor="middle">
  <!-- Solid -->
  <rect x="8" y="20" width="96" height="76" rx="6" fill="#eef6ff" stroke="#1a237e" stroke-width="1.5"/>
  <text x="56" y="14" font-size="9" font-weight="bold" fill="#1a237e">SOLID</text>
  <g fill="#3b82f6">
  <circle cx="28" cy="40" r="7"/><circle cx="50" cy="40" r="7"/><circle cx="72" cy="40" r="7"/><circle cx="94" cy="40" r="0"/>
  <circle cx="28" cy="60" r="7"/><circle cx="50" cy="60" r="7"/><circle cx="72" cy="60" r="7"/>
  <circle cx="28" cy="80" r="7"/><circle cx="50" cy="80" r="7"/><circle cx="72" cy="80" r="7"/>
  </g>
  <text x="56" y="112" font-size="7" fill="#555">fixed, regular, touching</text>
  <!-- Liquid -->
  <rect x="117" y="20" width="96" height="76" rx="6" fill="#eef6ff" stroke="#1a237e" stroke-width="1.5"/>
  <text x="165" y="14" font-size="9" font-weight="bold" fill="#1a237e">LIQUID</text>
  <g fill="#3b82f6">
  <circle cx="136" cy="44" r="7"/><circle cx="158" cy="40" r="7"/><circle cx="182" cy="46" r="7"/>
  <circle cx="146" cy="62" r="7"/><circle cx="172" cy="60" r="7"/><circle cx="196" cy="58" r="7"/>
  <circle cx="138" cy="82" r="7"/><circle cx="162" cy="82" r="7"/><circle cx="188" cy="80" r="7"/>
  </g>
  <text x="165" y="112" font-size="7" fill="#555">close, random, can flow</text>
  <!-- Gas -->
  <rect x="226" y="20" width="96" height="76" rx="6" fill="#eef6ff" stroke="#1a237e" stroke-width="1.5"/>
  <text x="274" y="14" font-size="9" font-weight="bold" fill="#1a237e">GAS</text>
  <g fill="#3b82f6">
  <circle cx="242" cy="36" r="7"/><circle cx="300" cy="42" r="7"/>
  <circle cx="270" cy="58" r="7"/><circle cx="246" cy="78" r="7"/>
  <circle cx="304" cy="82" r="7"/>
  </g>
  <text x="274" y="112" font-size="7" fill="#555">far apart, fast, random</text>
  </g>
</svg>`,

  /** Carbon allotropes — diamond, graphite, graphene structures. */
  'carbon-allotropes': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 135" width="330" height="135">
  <g font-family="Arial" text-anchor="middle" stroke="#333">
  <!-- Diamond (tetrahedral) -->
  <text x="55" y="14" font-size="9" font-weight="bold" fill="#1a237e" stroke="none">DIAMOND</text>
  <g stroke="#1a237e" stroke-width="1.3">
  <line x1="55" y1="60" x2="55" y2="34"/><line x1="55" y1="60" x2="30" y2="78"/>
  <line x1="55" y1="60" x2="80" y2="78"/><line x1="55" y1="60" x2="55" y2="90"/>
  </g>
  <g fill="#444" stroke="none">
  <circle cx="55" cy="60" r="6"/><circle cx="55" cy="34" r="6"/><circle cx="30" cy="78" r="6"/><circle cx="80" cy="78" r="6"/><circle cx="55" cy="90" r="6"/>
  </g>
  <text x="55" y="112" font-size="7" fill="#555" stroke="none">4 bonds each — hard</text>
  <!-- Graphite (layers) -->
  <text x="165" y="14" font-size="9" font-weight="bold" fill="#1a237e" stroke="none">GRAPHITE</text>
  <g stroke="#1a237e" stroke-width="1.1" fill="none">
  <polygon points="135,34 150,28 165,34 165,48 150,54 135,48"/>
  <polygon points="165,34 180,28 195,34 195,48 180,54 165,48"/>
  <polygon points="135,66 150,60 165,66 165,80 150,86 135,80"/>
  <polygon points="165,66 180,60 195,66 195,80 180,86 165,80"/>
  </g>
  <text x="165" y="112" font-size="7" fill="#555" stroke="none">3 bonds — layers slide</text>
  <!-- Graphene/fullerene -->
  <text x="276" y="14" font-size="9" font-weight="bold" fill="#1a237e" stroke="none">GRAPHENE</text>
  <g stroke="#1a237e" stroke-width="1.1" fill="none">
  <polygon points="250,40 264,33 278,40 278,56 264,63 250,56"/>
  <polygon points="278,40 292,33 306,40 306,56 292,63 278,56"/>
  <polygon points="264,63 278,56 292,63 292,79 278,86 264,79"/>
  </g>
  <text x="276" y="112" font-size="7" fill="#555" stroke="none">single layer — strong</text>
  </g>
</svg>`,

  /** Giant ionic lattice — alternating + and - ions in a grid. */
  'ionic-lattice': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 150" width="250" height="150">
  <g font-family="Arial" text-anchor="middle" font-weight="bold">
  <!-- 4x3 alternating lattice -->
  <g stroke="#999" stroke-width="0.8">
  <line x1="40" y1="35" x2="190" y2="35"/><line x1="40" y1="75" x2="190" y2="75"/><line x1="40" y1="115" x2="190" y2="115"/>
  <line x1="40" y1="35" x2="40" y2="115"/><line x1="90" y1="35" x2="90" y2="115"/><line x1="140" y1="35" x2="140" y2="115"/><line x1="190" y1="35" x2="190" y2="115"/>
  </g>
  <g font-size="10">
  <circle cx="40" cy="35" r="13" fill="#c62828"/><text x="40" y="39" fill="#fff">+</text>
  <circle cx="90" cy="35" r="13" fill="#1565c0"/><text x="90" y="39" fill="#fff">−</text>
  <circle cx="140" cy="35" r="13" fill="#c62828"/><text x="140" y="39" fill="#fff">+</text>
  <circle cx="190" cy="35" r="13" fill="#1565c0"/><text x="190" y="39" fill="#fff">−</text>
  <circle cx="40" cy="75" r="13" fill="#1565c0"/><text x="40" y="79" fill="#fff">−</text>
  <circle cx="90" cy="75" r="13" fill="#c62828"/><text x="90" y="79" fill="#fff">+</text>
  <circle cx="140" cy="75" r="13" fill="#1565c0"/><text x="140" y="79" fill="#fff">−</text>
  <circle cx="190" cy="75" r="13" fill="#c62828"/><text x="190" y="79" fill="#fff">+</text>
  <circle cx="40" cy="115" r="13" fill="#c62828"/><text x="40" y="119" fill="#fff">+</text>
  <circle cx="90" cy="115" r="13" fill="#1565c0"/><text x="90" y="119" fill="#fff">−</text>
  <circle cx="140" cy="115" r="13" fill="#c62828"/><text x="140" y="119" fill="#fff">+</text>
  <circle cx="190" cy="115" r="13" fill="#1565c0"/><text x="190" y="119" fill="#fff">−</text>
  </g>
  <text x="115" y="140" font-size="7.5" fill="#555" stroke="none" font-weight="normal">Strong electrostatic attraction in all directions</text>
  </g>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // CHEMICAL CHANGES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Reactivity series ladder — most to least reactive metals. */
  'reactivity-series': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 165" width="250" height="165">
  <g font-family="Arial">
  <rect x="40" y="10" width="120" height="148" rx="6" fill="#eef2ff" stroke="#1a237e" stroke-width="1.3"/>
  <g font-size="9" font-weight="bold" fill="#1a237e" text-anchor="middle">
  <text x="100" y="24">Potassium</text>
  <text x="100" y="40">Sodium</text>
  <text x="100" y="56">Calcium</text>
  <text x="100" y="72">Magnesium</text>
  <text x="100" y="88">Zinc</text>
  <text x="100" y="104">Iron</text>
  <text x="100" y="120">Copper</text>
  <text x="100" y="136">Gold</text>
  </g>
  <text x="100" y="152" font-size="7" fill="#c62828" text-anchor="middle">(carbon &amp; hydrogen for comparison)</text>
  <!-- arrow -->
  <line x1="22" y1="16" x2="22" y2="138" stroke="#c62828" stroke-width="2.2" marker-end="url(#rsArr)"/>
  <defs><marker id="rsArr" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0, 9 3.5, 0 7" fill="#c62828"/></marker></defs>
  <text x="12" y="78" font-size="7.5" font-weight="bold" fill="#c62828" transform="rotate(90 12 78)" text-anchor="middle">reactivity decreases</text>
  </g>
</svg>`,

  /** Electrolysis cell — DC supply, two electrodes in molten/aqueous electrolyte. */
  'electrolysis-cell': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 175" width="250" height="175">
  <g font-family="Arial">
  <!-- power supply -->
  <rect x="95" y="8" width="60" height="22" rx="3" fill="#fff" stroke="#222" stroke-width="1.5"/>
  <text x="125" y="23" font-size="9" font-weight="bold" fill="#222" text-anchor="middle">+   −</text>
  <!-- wires -->
  <line x1="105" y1="30" x2="105" y2="60" stroke="#222" stroke-width="1.5"/>
  <line x1="145" y1="30" x2="145" y2="60" stroke="#222" stroke-width="1.5"/>
  <!-- beaker / cell -->
  <path d="M 50 70 L 50 158 Q 50 166 58 166 L 192 166 Q 200 166 200 158 L 200 70" fill="none" stroke="#333" stroke-width="2.5"/>
  <rect x="52" y="86" width="146" height="78" rx="2" fill="#dbeafe" opacity="0.7"/>
  <!-- electrodes -->
  <rect x="99" y="60" width="12" height="92" fill="#555" stroke="#222" stroke-width="1"/>
  <rect x="139" y="60" width="12" height="92" fill="#555" stroke="#222" stroke-width="1"/>
  <text x="105" y="56" font-size="8" font-weight="bold" fill="#c62828" text-anchor="middle">anode (+)</text>
  <text x="145" y="56" font-size="8" font-weight="bold" fill="#1565c0" text-anchor="middle">cathode (−)</text>
  <!-- ions -->
  <text x="75" y="120" font-size="9" fill="#c62828">+</text><text x="90" y="135" font-size="9" fill="#1565c0">−</text>
  <text x="165" y="118" font-size="9" fill="#1565c0">−</text><text x="178" y="138" font-size="9" fill="#c62828">+</text>
  <text x="125" y="120" font-size="7.5" fill="#555" text-anchor="middle">electrolyte</text>
  </g>
</svg>`,

  /** pH scale 0-14 colour bar. */
  'ph-scale': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 110" width="320" height="110">
  <g font-family="Arial" text-anchor="middle">
  <text x="160" y="14" font-size="9" font-weight="bold" fill="#1a237e">THE pH SCALE</text>
  <!-- colour blocks 0-14 -->
  <g stroke="#fff" stroke-width="0.5">
  <rect x="10" y="22" width="20" height="34" fill="#d32f2f"/>
  <rect x="30" y="22" width="20" height="34" fill="#e64a19"/>
  <rect x="50" y="22" width="20" height="34" fill="#f57c00"/>
  <rect x="70" y="22" width="20" height="34" fill="#fbc02d"/>
  <rect x="90" y="22" width="20" height="34" fill="#cddc39"/>
  <rect x="110" y="22" width="20" height="34" fill="#aed581"/>
  <rect x="130" y="22" width="20" height="34" fill="#66bb6a"/>
  <rect x="150" y="22" width="20" height="34" fill="#43a047"/>
  <rect x="170" y="22" width="20" height="34" fill="#26a69a"/>
  <rect x="190" y="22" width="20" height="34" fill="#29b6f6"/>
  <rect x="210" y="22" width="20" height="34" fill="#1e88e5"/>
  <rect x="230" y="22" width="20" height="34" fill="#3949ab"/>
  <rect x="250" y="22" width="20" height="34" fill="#5e35b1"/>
  <rect x="270" y="22" width="20" height="34" fill="#6a1b9a"/>
  <rect x="290" y="22" width="20" height="34" fill="#4a148c"/>
  </g>
  <g font-size="7" fill="#222">
  <text x="20" y="66">0</text><text x="80" y="66">3</text><text x="160" y="66">7</text><text x="240" y="66">11</text><text x="300" y="66">14</text>
  </g>
  <text x="55" y="86" font-size="9" font-weight="bold" fill="#d32f2f">ACID</text>
  <text x="160" y="86" font-size="9" font-weight="bold" fill="#2e7d32">NEUTRAL</text>
  <text x="270" y="86" font-size="9" font-weight="bold" fill="#4a148c">ALKALI</text>
  <text x="160" y="102" font-size="7" fill="#555">Lower pH = more H⁺ ions · Higher pH = more OH⁻ ions</text>
  </g>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // ENERGY CHANGES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Endothermic reaction profile — products higher than reactants. */
  'reaction-profile-endo': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 170" width="260" height="170">
  <line x1="34" y1="14" x2="34" y2="150" stroke="#333" stroke-width="1.5"/>
  <line x1="34" y1="150" x2="248" y2="150" stroke="#333" stroke-width="1.5"/>
  <text x="10" y="86" font-family="Arial" font-size="8" fill="#333" transform="rotate(-90 10 86)" text-anchor="middle">Energy</text>
  <text x="140" y="165" font-family="Arial" font-size="8" fill="#333" text-anchor="middle">Progress of reaction</text>
  <!-- reactants low, hump, products higher -->
  <path d="M 44 110 L 90 110 C 120 110 120 40 150 40 C 180 40 180 74 210 74 L 240 74" fill="none" stroke="#1a237e" stroke-width="2.2"/>
  <line x1="44" y1="110" x2="90" y2="110" stroke="#1a237e" stroke-width="2.2"/>
  <line x1="210" y1="74" x2="240" y2="74" stroke="#1a237e" stroke-width="2.2"/>
  <text x="58" y="104" font-family="Arial" font-size="7.5" fill="#333">reactants</text>
  <text x="212" y="68" font-family="Arial" font-size="7.5" fill="#333">products</text>
  <!-- activation energy -->
  <line x1="150" y1="110" x2="150" y2="42" stroke="#c62828" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="156" y="78" font-family="Arial" font-size="7" fill="#c62828">Eₐ</text>
  <!-- energy absorbed -->
  <line x1="100" y1="110" x2="100" y2="74" stroke="#1565c0" stroke-width="1.2" marker-end="url(#endoArr)"/>
  <defs><marker id="endoArr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#1565c0"/></marker></defs>
  <text x="104" y="96" font-family="Arial" font-size="7" fill="#1565c0" font-weight="bold">+ΔH</text>
</svg>`,

  /** Simple chemical cell — two different metal electrodes in electrolyte + voltmeter. */
  'simple-cell': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 170" width="250" height="170">
  <g font-family="Arial">
  <!-- voltmeter -->
  <circle cx="125" cy="24" r="16" fill="#fff" stroke="#222" stroke-width="1.5"/>
  <text x="125" y="29" font-size="12" font-weight="bold" fill="#222" text-anchor="middle">V</text>
  <line x1="109" y1="24" x2="60" y2="24" stroke="#222" stroke-width="1.5"/>
  <line x1="60" y1="24" x2="60" y2="60" stroke="#222" stroke-width="1.5"/>
  <line x1="141" y1="24" x2="190" y2="24" stroke="#222" stroke-width="1.5"/>
  <line x1="190" y1="24" x2="190" y2="60" stroke="#222" stroke-width="1.5"/>
  <!-- beaker -->
  <path d="M 40 70 L 40 152 Q 40 160 48 160 L 202 160 Q 210 160 210 152 L 210 70" fill="none" stroke="#333" stroke-width="2.5"/>
  <rect x="42" y="84" width="166" height="74" rx="2" fill="#dbeafe" opacity="0.7"/>
  <!-- electrodes -->
  <rect x="54" y="56" width="12" height="92" fill="#9e9e9e" stroke="#222" stroke-width="1"/>
  <rect x="184" y="56" width="12" height="92" fill="#d8a657" stroke="#222" stroke-width="1"/>
  <text x="60" y="52" font-size="8" font-weight="bold" fill="#1a237e" text-anchor="middle">zinc</text>
  <text x="190" y="52" font-size="8" font-weight="bold" fill="#b06a1a" text-anchor="middle">copper</text>
  <text x="125" y="120" font-size="8" fill="#555" text-anchor="middle">electrolyte</text>
  <text x="125" y="135" font-size="7" fill="#555" text-anchor="middle">(salt solution)</text>
  </g>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // ORGANIC CHEMISTRY
  // ═══════════════════════════════════════════════════════════════════════════

  /** Fractional distillation column — fractions of crude oil by boiling point. */
  'fractional-distillation': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 175" width="260" height="175">
  <g font-family="Arial">
  <!-- column -->
  <polygon points="60,160 60,30 130,12 130,160" fill="#eef2ff" stroke="#1a237e" stroke-width="1.5"/>
  <!-- fraction outlets -->
  <g font-size="7.5" fill="#1a237e">
  <line x1="130" y1="28" x2="160" y2="28" stroke="#333" stroke-width="1"/><text x="163" y="31">Gases</text>
  <line x1="130" y1="52" x2="160" y2="52" stroke="#333" stroke-width="1"/><text x="163" y="55">Petrol</text>
  <line x1="130" y1="76" x2="160" y2="76" stroke="#333" stroke-width="1"/><text x="163" y="79">Kerosene</text>
  <line x1="130" y1="100" x2="160" y2="100" stroke="#333" stroke-width="1"/><text x="163" y="103">Diesel</text>
  <line x1="130" y1="124" x2="160" y2="124" stroke="#333" stroke-width="1"/><text x="163" y="127">Oil</text>
  <line x1="130" y1="150" x2="160" y2="150" stroke="#333" stroke-width="1"/><text x="163" y="153">Bitumen</text>
  </g>
  <!-- temperature arrow -->
  <text x="20" y="30" font-size="7.5" fill="#c62828">cool</text>
  <text x="20" y="158" font-size="7.5" fill="#c62828">hot</text>
  <line x1="40" y1="40" x2="40" y2="150" stroke="#c62828" stroke-width="1.5" marker-end="url(#fdArr)"/>
  <defs><marker id="fdArr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#c62828"/></marker></defs>
  <text x="95" y="172" font-size="7" fill="#555" text-anchor="middle">crude oil in (heated)</text>
  </g>
</svg>`,

  /** Alkane vs alkene displayed formulae — ethane (single) vs ethene (double). */
  'alkane-alkene': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 140" width="300" height="140">
  <g font-family="Arial" font-size="13" fill="#1a237e" font-weight="bold" text-anchor="middle">
  <text x="75" y="16" font-size="10">ETHANE (alkane)</text>
  <!-- ethane C-C single -->
  <line x1="55" y1="64" x2="95" y2="64" stroke="#333" stroke-width="2"/>
  <text x="55" y="69">C</text><text x="95" y="69">C</text>
  <line x1="55" y1="56" x2="55" y2="38" stroke="#333" stroke-width="2"/><text x="55" y="34">H</text>
  <line x1="55" y1="72" x2="55" y2="90" stroke="#333" stroke-width="2"/><text x="55" y="102">H</text>
  <line x1="47" y1="64" x2="30" y2="64" stroke="#333" stroke-width="2"/><text x="24" y="69">H</text>
  <line x1="95" y1="56" x2="95" y2="38" stroke="#333" stroke-width="2"/><text x="95" y="34">H</text>
  <line x1="95" y1="72" x2="95" y2="90" stroke="#333" stroke-width="2"/><text x="95" y="102">H</text>
  <line x1="103" y1="64" x2="120" y2="64" stroke="#333" stroke-width="2"/><text x="126" y="69">H</text>
  <text x="75" y="124" font-size="9" fill="#555">C₂H₆ · saturated</text>
  <!-- ethene C=C double -->
  <text x="225" y="16" font-size="10">ETHENE (alkene)</text>
  <line x1="205" y1="61" x2="245" y2="61" stroke="#333" stroke-width="2"/>
  <line x1="205" y1="67" x2="245" y2="67" stroke="#333" stroke-width="2"/>
  <text x="205" y="69">C</text><text x="245" y="69">C</text>
  <line x1="205" y1="56" x2="205" y2="38" stroke="#333" stroke-width="2"/><text x="205" y="34">H</text>
  <line x1="205" y1="72" x2="205" y2="90" stroke="#333" stroke-width="2"/><text x="205" y="102">H</text>
  <line x1="245" y1="56" x2="245" y2="38" stroke="#333" stroke-width="2"/><text x="245" y="34">H</text>
  <line x1="245" y1="72" x2="245" y2="90" stroke="#333" stroke-width="2"/><text x="245" y="102">H</text>
  <text x="225" y="124" font-size="9" fill="#c62828">C₂H₄ · unsaturated (C=C)</text>
  </g>
</svg>`,

  /** Addition polymerisation — many ethene monomers join to poly(ethene). */
  'addition-polymerisation': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120">
  <g font-family="Arial" text-anchor="middle">
  <text x="160" y="14" font-size="9" font-weight="bold" fill="#1a237e">ADDITION POLYMERISATION</text>
  <!-- monomers -->
  <g font-size="11" fill="#1a237e" font-weight="bold">
  <text x="40" y="50">C=C</text><text x="80" y="50">C=C</text><text x="120" y="50">C=C</text>
  </g>
  <text x="80" y="68" font-size="8" fill="#555">many ethene monomers (C=C)</text>
  <!-- arrow -->
  <line x1="150" y1="46" x2="195" y2="46" stroke="#333" stroke-width="2" marker-end="url(#apArr)"/>
  <defs><marker id="apArr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <!-- polymer chain -->
  <g font-size="11" fill="#1a237e" font-weight="bold">
  <text x="255" y="50">‑C‑C‑C‑C‑</text>
  </g>
  <text x="255" y="68" font-size="8" fill="#555">poly(ethene) — single bonds</text>
  <text x="160" y="98" font-size="8.5" fill="#c62828">The C=C double bond opens to form single bonds</text>
  <text x="160" y="112" font-size="8" fill="#555">n(CH₂=CH₂) → ‑(CH₂‑CH₂)‑ₙ</text>
  </g>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // CHEMICAL ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Paper chromatography — spots separated, with Rf measurement lines. */
  'chromatography': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 175" width="240" height="175">
  <g font-family="Arial">
  <!-- beaker -->
  <path d="M 30 40 L 30 165 Q 30 170 36 170 L 150 170 Q 156 170 156 165 L 156 40" fill="none" stroke="#333" stroke-width="2"/>
  <!-- solvent -->
  <rect x="32" y="150" width="122" height="18" fill="#dbeafe" opacity="0.7"/>
  <!-- paper -->
  <rect x="78" y="20" width="40" height="138" fill="#fffdf5" stroke="#bbb" stroke-width="1"/>
  <!-- baseline (pencil) -->
  <line x1="78" y1="150" x2="118" y2="150" stroke="#555" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="60" y="153" font-size="7" fill="#555" text-anchor="end">start</text>
  <!-- solvent front -->
  <line x1="78" y1="46" x2="118" y2="46" stroke="#1565c0" stroke-width="1" stroke-dasharray="3,2"/>
  <text x="124" y="48" font-size="7" fill="#1565c0">solvent front</text>
  <!-- spots -->
  <circle cx="92" cy="92" r="5" fill="#c62828"/>
  <circle cx="104" cy="70" r="5" fill="#2e7d32"/>
  <circle cx="98" cy="150" r="3" fill="#444"/>
  <!-- Rf measurement -->
  <line x1="138" y1="150" x2="138" y2="92" stroke="#c62828" stroke-width="0.8"/>
  <text x="142" y="124" font-size="7" fill="#c62828">dist. spot</text>
  <line x1="158" y1="150" x2="158" y2="46" stroke="#1565c0" stroke-width="0.8"/>
  <text x="162" y="100" font-size="7" fill="#1565c0" transform="rotate(90 162 100)" text-anchor="middle">dist. solvent</text>
  <text x="93" y="14" font-size="8.5" font-weight="bold" fill="#1a237e">Rf = spot ÷ solvent</text>
  </g>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // CHEMISTRY OF THE ATMOSPHERE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Today's atmosphere composition pie chart. */
  'atmosphere-composition': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 160" width="250" height="160">
  <g font-family="Arial">
  <!-- pie: N2 78% (281deg), O2 21% (76deg), other 1% -->
  <circle cx="80" cy="80" r="60" fill="#1565c0"/>
  <!-- O2 wedge (21% ~76deg) starting at top -->
  <path d="M 80 80 L 80 20 A 60 60 0 0 1 138 65 Z" fill="#43a047"/>
  <!-- other small wedge -->
  <path d="M 80 80 L 138 65 A 60 60 0 0 1 139 70 Z" fill="#fbc02d"/>
  <!-- legend -->
  <rect x="160" y="40" width="12" height="12" fill="#1565c0"/><text x="176" y="50" font-size="9" fill="#222">Nitrogen 78%</text>
  <rect x="160" y="62" width="12" height="12" fill="#43a047"/><text x="176" y="72" font-size="9" fill="#222">Oxygen 21%</text>
  <rect x="160" y="84" width="12" height="12" fill="#fbc02d"/><text x="176" y="94" font-size="9" fill="#222">Other ~1%</text>
  <text x="176" y="108" font-size="7.5" fill="#555">(argon, CO₂,</text>
  <text x="176" y="118" font-size="7.5" fill="#555">water vapour)</text>
  <text x="80" y="152" font-size="8" fill="#555" text-anchor="middle">Today's atmosphere</text>
  </g>
</svg>`,

  /** Greenhouse effect — Sun, Earth, re-radiated IR trapped by gases. */
  'greenhouse-effect': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 160" width="260" height="160">
  <g font-family="Arial">
  <!-- Sun -->
  <circle cx="28" cy="28" r="16" fill="#fdd835" stroke="#f9a825" stroke-width="1.5"/>
  <text x="28" y="54" font-size="7.5" fill="#555" text-anchor="middle">Sun</text>
  <!-- Earth -->
  <path d="M 20 140 Q 130 120 240 140 L 240 158 L 20 158 Z" fill="#8d6e63"/>
  <path d="M 20 140 Q 130 120 240 140" fill="none" stroke="#33691e" stroke-width="3"/>
  <text x="130" y="154" font-size="8" fill="#fff" text-anchor="middle">Earth's surface</text>
  <!-- greenhouse gas layer -->
  <line x1="20" y1="70" x2="240" y2="70" stroke="#c62828" stroke-width="1.2" stroke-dasharray="5,3"/>
  <text x="130" y="64" font-size="8" fill="#c62828" text-anchor="middle">greenhouse gas layer (CO₂, CH₄)</text>
  <!-- incoming ray -->
  <line x1="44" y1="40" x2="120" y2="128" stroke="#f9a825" stroke-width="1.8" marker-end="url(#ghIn)"/>
  <defs><marker id="ghIn" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f9a825"/></marker></defs>
  <!-- re-radiated up -->
  <line x1="150" y1="128" x2="170" y2="74" stroke="#c62828" stroke-width="1.5" marker-end="url(#ghUp)"/>
  <defs><marker id="ghUp" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#c62828"/></marker></defs>
  <!-- reflected back down -->
  <line x1="170" y1="74" x2="190" y2="126" stroke="#c62828" stroke-width="1.5" stroke-dasharray="3,2" marker-end="url(#ghUp)"/>
  <text x="205" y="100" font-size="7" fill="#c62828">IR trapped</text>
  </g>
</svg>`,

  // ═══════════════════════════════════════════════════════════════════════════
  // USING RESOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Water treatment stages — sedimentation, filtration, sterilisation. */
  'water-treatment': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 130" width="320" height="130">
  <g font-family="Arial" text-anchor="middle">
  <!-- stage 1 -->
  <rect x="10" y="30" width="80" height="60" rx="5" fill="#eef6ff" stroke="#1a237e" stroke-width="1.3"/>
  <text x="50" y="20" font-size="8" font-weight="bold" fill="#1a237e">1 SCREEN</text>
  <text x="50" y="58" font-size="7.5" fill="#555">remove large</text>
  <text x="50" y="68" font-size="7.5" fill="#555">objects/grit</text>
  <!-- arrow -->
  <line x1="92" y1="60" x2="106" y2="60" stroke="#333" stroke-width="1.5" marker-end="url(#wtA)"/>
  <defs><marker id="wtA" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <!-- stage 2 -->
  <rect x="108" y="30" width="80" height="60" rx="5" fill="#eef6ff" stroke="#1a237e" stroke-width="1.3"/>
  <text x="148" y="20" font-size="8" font-weight="bold" fill="#1a237e">2 SEDIMENT/FILTER</text>
  <text x="148" y="58" font-size="7.5" fill="#555">settle &amp; filter</text>
  <text x="148" y="68" font-size="7.5" fill="#555">solids out</text>
  <line x1="190" y1="60" x2="204" y2="60" stroke="#333" stroke-width="1.5" marker-end="url(#wtA)"/>
  <!-- stage 3 -->
  <rect x="206" y="30" width="80" height="60" rx="5" fill="#eef6ff" stroke="#1a237e" stroke-width="1.3"/>
  <text x="246" y="20" font-size="8" font-weight="bold" fill="#1a237e">3 STERILISE</text>
  <text x="246" y="58" font-size="7.5" fill="#555">chlorine / ozone</text>
  <text x="246" y="68" font-size="7.5" fill="#555">/ UV kills microbes</text>
  <text x="160" y="110" font-size="8" fill="#2e7d32" font-weight="bold">→ potable (safe to drink) water</text>
  </g>
</svg>`,

  /** Haber process flow — N2 + H2 over iron catalyst, recycle. */
  'haber-process': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 140" width="300" height="140">
  <g font-family="Arial" text-anchor="middle">
  <text x="150" y="14" font-size="9" font-weight="bold" fill="#1a237e">THE HABER PROCESS</text>
  <text x="150" y="30" font-size="10" font-weight="bold" fill="#1a237e">N₂ + 3H₂ ⇌ 2NH₃</text>
  <!-- reactor box -->
  <rect x="100" y="48" width="100" height="44" rx="6" fill="#fde2c8" stroke="#b06a1a" stroke-width="1.3"/>
  <text x="150" y="68" font-size="8.5" font-weight="bold" fill="#8a4b00">iron catalyst</text>
  <text x="150" y="82" font-size="7.5" fill="#555">~450°C, 200 atm</text>
  <!-- inputs -->
  <text x="40" y="60" font-size="8" fill="#1565c0">N₂ (air)</text>
  <text x="40" y="84" font-size="8" fill="#1565c0">H₂ (gas)</text>
  <line x1="70" y1="58" x2="98" y2="62" stroke="#333" stroke-width="1.2" marker-end="url(#hbA)"/>
  <line x1="70" y1="82" x2="98" y2="78" stroke="#333" stroke-width="1.2" marker-end="url(#hbA)"/>
  <defs><marker id="hbA" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <!-- output -->
  <line x1="200" y1="70" x2="240" y2="70" stroke="#333" stroke-width="1.2" marker-end="url(#hbA)"/>
  <text x="268" y="73" font-size="8" font-weight="bold" fill="#2e7d32">NH₃</text>
  <text x="150" y="112" font-size="7.5" fill="#555">Unreacted N₂ and H₂ are recycled</text>
  <text x="150" y="126" font-size="7.5" fill="#555">Ammonia cooled and condensed off</text>
  </g>
</svg>`,

};

export default diagrams;
