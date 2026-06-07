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
  <!-- Electron sea background -->
  <rect x="10" y="10" width="250" height="260" rx="8" fill="#eff6ff" stroke="#93c5fd" stroke-width="1" stroke-dasharray="4,2"/>

  <!-- Electrons (small − circles scattered) -->
  <circle cx="40" cy="30" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="40" y="33" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="90" cy="25" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="90" y="28" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="150" cy="30" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="150" y="33" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="200" cy="28" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="200" y="31" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="240" cy="35" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="240" y="38" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>

  <circle cx="30" cy="90" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="30" y="93" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="130" cy="85" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="130" y="88" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="230" cy="88" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="230" y="91" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>

  <circle cx="35" cy="155" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="35" y="158" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="130" cy="150" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="130" y="153" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="235" cy="155" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="235" y="158" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>

  <circle cx="40" cy="220" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="40" y="223" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="100" cy="225" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="100" y="228" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="175" cy="218" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="175" y="221" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="240" cy="222" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="240" y="225" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>

  <circle cx="55" cy="255" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="55" y="258" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="135" cy="258" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="135" y="261" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>
  <circle cx="210" cy="255" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/><text x="210" y="258" text-anchor="middle" font-family="Arial" font-size="8" fill="#fff">−</text>

  <!-- Row 1 cations -->
  <circle cx="60" cy="60" r="18" fill="#d4d4d8" stroke="#71717a" stroke-width="1.5"/><text x="60" y="65" text-anchor="middle" font-family="Arial" font-size="14" fill="#333" font-weight="bold">+</text>
  <circle cx="120" cy="60" r="18" fill="#d4d4d8" stroke="#71717a" stroke-width="1.5"/><text x="120" y="65" text-anchor="middle" font-family="Arial" font-size="14" fill="#333" font-weight="bold">+</text>
  <circle cx="180" cy="60" r="18" fill="#d4d4d8" stroke="#71717a" stroke-width="1.5"/><text x="180" y="65" text-anchor="middle" font-family="Arial" font-size="14" fill="#333" font-weight="bold">+</text>

  <!-- Row 2 cations -->
  <circle cx="60" cy="125" r="18" fill="#d4d4d8" stroke="#71717a" stroke-width="1.5"/><text x="60" y="130" text-anchor="middle" font-family="Arial" font-size="14" fill="#333" font-weight="bold">+</text>
  <circle cx="120" cy="125" r="18" fill="#d4d4d8" stroke="#71717a" stroke-width="1.5"/><text x="120" y="130" text-anchor="middle" font-family="Arial" font-size="14" fill="#333" font-weight="bold">+</text>
  <circle cx="180" cy="125" r="18" fill="#d4d4d8" stroke="#71717a" stroke-width="1.5"/><text x="180" y="130" text-anchor="middle" font-family="Arial" font-size="14" fill="#333" font-weight="bold">+</text>

  <!-- Row 3 cations -->
  <circle cx="60" cy="190" r="18" fill="#d4d4d8" stroke="#71717a" stroke-width="1.5"/><text x="60" y="195" text-anchor="middle" font-family="Arial" font-size="14" fill="#333" font-weight="bold">+</text>
  <circle cx="120" cy="190" r="18" fill="#d4d4d8" stroke="#71717a" stroke-width="1.5"/><text x="120" y="195" text-anchor="middle" font-family="Arial" font-size="14" fill="#333" font-weight="bold">+</text>
  <circle cx="180" cy="190" r="18" fill="#d4d4d8" stroke="#71717a" stroke-width="1.5"/><text x="180" y="195" text-anchor="middle" font-family="Arial" font-size="14" fill="#333" font-weight="bold">+</text>

  <!-- Label line 1: from electron area to box (top) -->
  <line x1="240" y1="35" x2="280" y2="50" stroke="#333" stroke-width="1.2"/>
  <rect x="282" y="38" width="125" height="24" rx="3" fill="#fef9c3" stroke="#333" stroke-width="1"/>

  <!-- Label line 2: from cation to box (middle) -->
  <line x1="198" y1="125" x2="280" y2="140" stroke="#333" stroke-width="1.2"/>
  <rect x="282" y="128" width="125" height="24" rx="3" fill="#fef9c3" stroke="#333" stroke-width="1"/>

  <!-- Label line 3: from between rows to box (bottom) -->
  <line x1="200" y1="230" x2="280" y2="230" stroke="#333" stroke-width="1.2"/>
  <rect x="282" y="218" width="125" height="24" rx="3" fill="#fef9c3" stroke="#333" stroke-width="1"/>
</svg>`,

  /**
   * Metal lattice malleability — for Q2 "Malleability"
   * Shows BEFORE FORCE (regular rows) and AFTER FORCE (top layer shifted),
   * with a force arrow between them and a label box on the right.
   */
  'metal-lattice-malleability': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 280" width="420" height="280">
  <!-- BEFORE FORCE section -->
  <text x="210" y="16" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#333">BEFORE FORCE</text>

  <!-- Electron sea background (before) -->
  <rect x="30" y="22" width="240" height="95" rx="6" fill="#eff6ff" stroke="#93c5fd" stroke-width="0.8" stroke-dasharray="3,2"/>

  <!-- Before: Row 1 -->
  <circle cx="60" cy="45" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="60" y="49" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="100" cy="45" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="100" y="49" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="140" cy="45" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="140" y="49" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="180" cy="45" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="180" y="49" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="220" cy="45" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="220" y="49" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="250" cy="45" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="250" y="49" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>

  <!-- Before: Row 2 -->
  <circle cx="75" cy="75" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="75" y="79" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="115" cy="75" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="115" y="79" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="155" cy="75" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="155" y="79" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="195" cy="75" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="195" y="79" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="235" cy="75" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="235" y="79" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>

  <!-- Before: Row 3 -->
  <circle cx="60" cy="105" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="60" y="109" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="100" cy="105" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="100" y="109" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="140" cy="105" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="140" y="109" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="180" cy="105" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="180" y="109" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="220" cy="105" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="220" y="109" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>

  <!-- Before: electrons scattered -->
  <circle cx="45" cy="32" r="4" fill="#9ca3af"/><text x="45" y="35" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="110" cy="30" r="4" fill="#9ca3af"/><text x="110" y="33" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="165" cy="32" r="4" fill="#9ca3af"/><text x="165" y="35" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="205" cy="28" r="4" fill="#9ca3af"/><text x="205" y="31" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="48" cy="62" r="4" fill="#9ca3af"/><text x="48" y="65" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="243" cy="60" r="4" fill="#9ca3af"/><text x="243" y="63" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="50" cy="92" r="4" fill="#9ca3af"/><text x="50" y="95" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="245" cy="92" r="4" fill="#9ca3af"/><text x="245" y="95" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>

  <!-- Before: label box -->
  <line x1="270" y1="70" x2="300" y2="70" stroke="#333" stroke-width="1"/>
  <rect x="302" y="58" width="105" height="24" rx="3" fill="#fef9c3" stroke="#333" stroke-width="1"/>

  <!-- FORCE APPLIED arrow -->
  <text x="150" y="135" text-anchor="middle" font-family="Arial" font-size="9" font-weight="bold" fill="#333">↓ FORCE APPLIED</text>

  <!-- AFTER FORCE section -->
  <text x="210" y="155" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#333">AFTER FORCE</text>

  <!-- Electron sea background (after) -->
  <rect x="30" y="160" width="240" height="95" rx="6" fill="#eff6ff" stroke="#93c5fd" stroke-width="0.8" stroke-dasharray="3,2"/>

  <!-- After: Row 1 (SHIFTED RIGHT by ~20px) -->
  <circle cx="95" cy="180" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="95" y="184" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="135" cy="180" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="135" y="184" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="175" cy="180" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="175" y="184" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="215" cy="180" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="215" y="184" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>

  <!-- After: Row 2 -->
  <circle cx="60" cy="210" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="60" y="214" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="100" cy="210" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="100" y="214" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="140" cy="210" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="140" y="214" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="180" cy="210" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="180" y="214" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="220" cy="210" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="220" y="214" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="250" cy="210" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="250" y="214" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>

  <!-- After: Row 3 -->
  <circle cx="60" cy="240" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="60" y="244" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="100" cy="240" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="100" y="244" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="140" cy="240" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="140" y="244" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="180" cy="240" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="180" y="244" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>
  <circle cx="220" cy="240" r="13" fill="#60a5fa" stroke="#2563eb" stroke-width="1.5"/><text x="220" y="244" text-anchor="middle" font-family="Arial" font-size="10" fill="white" font-weight="bold">+</text>

  <!-- After: electrons scattered -->
  <circle cx="80" cy="168" r="4" fill="#9ca3af"/><text x="80" y="171" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="155" cy="168" r="4" fill="#9ca3af"/><text x="155" y="171" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="230" cy="170" r="4" fill="#9ca3af"/><text x="230" y="173" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="45" cy="198" r="4" fill="#9ca3af"/><text x="45" y="201" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="250" cy="195" r="4" fill="#9ca3af"/><text x="250" y="198" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="48" cy="228" r="4" fill="#9ca3af"/><text x="48" y="231" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>
  <circle cx="248" cy="228" r="4" fill="#9ca3af"/><text x="248" y="231" text-anchor="middle" font-family="Arial" font-size="6" fill="#fff">−</text>

  <!-- After: dashed arrow showing shift direction -->
  <line x1="280" y1="180" x2="310" y2="180" stroke="#333" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="310,176 320,180 310,184" fill="#333"/>
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
