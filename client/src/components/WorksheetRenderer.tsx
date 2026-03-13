/**
 * WorksheetRenderer — Professional, print-ready worksheet display component.
 * Matches PDF output pixel-for-pixel using CSS @media print.
 * Applies SEND-specific formatting (font, line-height, spacing) per COBS Handbook.
 * Supports KaTeX math rendering for proper fractions, symbols, and expressions.
 */
import { forwardRef } from "react";
import { getSendFormatting } from "@/lib/send-data";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Render a string that may contain LaTeX math expressions (\(...\) or \[...\]).
 * Falls back to plain text if KaTeX fails.
 * Also strips any remaining raw ** asterisks.
 */
export function renderMath(text: string): string {
  if (!text) return "";

  const decodeHtmlEntities = (value: string) => value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

  const normalizeMalformedKatexMarkup = (value: string) => value
    // Mobile / OCR-like corruption such as "< spanclass = ”katex” >"
    .replace(/<\s*spanclass\s*=\s*["“”']([^"“”']+)["“”']\s*>/gi, '<span class="$1">')
    .replace(/<\s*\/\s*span\s*class\s*>/gi, '</span>')
    // Missing whitespace before class attribute
    .replace(/<\s*spanclass=/gi, '<span class=')
    // Smart quotes around attribute values
    .replace(/class\s*=\s*[“”]([^“”]+)[“”]/gi, 'class="$1"');

  let result = normalizeMalformedKatexMarkup(decodeHtmlEntities(text));

  // If the content already contains valid pre-rendered KaTeX HTML, extract the LaTeX
  // annotation text and replace each KaTeX block with its raw LaTeX so it can be
  // cleanly re-rendered. This handles the case where the AI returns pre-rendered HTML
  // (e.g. from a previous renderMath call stored in history) instead of raw LaTeX.
  if (result.includes('class="katex"') || result.includes("class='katex'")) {
    // Use nesting-aware extraction to handle deeply nested KaTeX HTML
    // This replaces each <span class="katex">...</span> block with its LaTeX annotation
    const extractKatexBlocks = (input: string): string => {
      let out = input;
      const patterns = ['class="katex"', "class='katex'"];
      for (const pat of patterns) {
        let safety = 0;
        while (out.includes(pat) && safety < 200) {
          safety++;
          const marker = '<span ' + pat;
          const startIdx = out.indexOf(marker);
          if (startIdx === -1) break;
          // Walk forward counting <span and </span> to find matching close
          let depth = 0;
          let i = startIdx;
          let endIdx = -1;
          while (i < out.length) {
            if (out.startsWith('<span', i)) {
              depth++;
              const gt = out.indexOf('>', i);
              i = gt !== -1 ? gt + 1 : i + 5;
            } else if (out.startsWith('</span>', i)) {
              depth--;
              if (depth === 0) {
                endIdx = i + 7;
                break;
              }
              i += 7;
            } else {
              i++;
            }
          }
          if (endIdx === -1) break;
          const katexBlock = out.substring(startIdx, endIdx);
          // Extract annotation text (raw LaTeX) from the MathML inside this block.
          // Use the LAST annotation tag (greedy search) because KaTeX may nest multiple
          // annotation tags when rendering compound expressions like \dfrac{a}{b} = \dfrac{c}{d}.
          // The outermost (last) annotation contains the full LaTeX expression.
          const annotRegex = /<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/gi;
          let annotMatch: RegExpExecArray | null = null;
          let lastAnnotMatch: RegExpExecArray | null = null;
          while ((annotMatch = annotRegex.exec(katexBlock)) !== null) {
            lastAnnotMatch = annotMatch;
          }
          const replacement = lastAnnotMatch ? `\\(${lastAnnotMatch[1].trim()}\\)` : '';
          out = out.substring(0, startIdx) + replacement + out.substring(endIdx);
        }
      }
      return out;
    };
    result = extractKatexBlocks(result);
    // If there are still katex spans (malformed HTML), strip all HTML tags as fallback
    if (result.includes('class="katex"') || result.includes("class='katex'")) {
      result = result.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // ── Step 0a-pre: Fix \text{} and \mathrm{} corruption from JSON backslash stripping ─
  // When AI outputs \text{m/s}, JSON parsing converts \t → tab, leaving (tab)ext{m/s}.
  // When AI outputs \mathrm{kg}, JSON converts \m → m (not a valid escape), so it stays.
  // We need to handle ALL these cases before any other processing.

  // 1. Literal \text{...} and \mathrm{...} etc. (if backslash survived)
  result = result.replace(/\\text\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mathrm\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mathsf\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mathtt\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mathcal\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mbox\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\hbox\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\rm\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\bf\{([^{}]*)\}/g, '<strong>$1</strong>');
  result = result.replace(/\\it\{([^{}]*)\}/g, '<em>$1</em>');

  // 2. After JSON parsing \text → \t (tab) + ext: handle tab+ext{...} and tab+extXXX
  result = result.replace(/\t(ext\{[^{}]*\})/g, (_, m) => m.replace(/^ext\{([^{}]*)\}$/, '$1'));
  result = result.replace(/\t(ext[A-Za-z0-9/²³⁻⁺°·\-]+)/g, (_, m) => m.replace(/^ext/, ''));
  // bare ext{...} without preceding tab
  result = result.replace(/\bext\{([^{}]*)\}/g, '$1');
  // bare extXXX (no braces) — e.g. extm/s, extN, extkg
  result = result.replace(/\bext([A-Za-z][A-Za-z0-9/²³⁻⁺°·\-]*)/g, '$1');

  // 3. Similar corruption for \mathrm → athrm, \mathsf → athsf, \mbox → box
  result = result.replace(/\bathrm\{([^{}]*)\}/g, '$1');
  result = result.replace(/\bathsf\{([^{}]*)\}/g, '$1');
  result = result.replace(/\bathtt\{([^{}]*)\}/g, '$1');
  result = result.replace(/\box\{([^{}]*)\}/g, '$1');

  // ── Step 0a-sci: Science-specific symbol and unit normalisation ──────────────
  // Chemical formulas: convert digit subscripts in common molecules
  // Only match known chemical element symbols (1-2 letter) followed by digits within a formula context
  // e.g. H2O → H₂O, CO2 → CO₂, H2SO4 → H₂SO₄, C6H12O6 → C₆H₁₂O₆
  // IMPORTANT: Only match when the element symbol is preceded by start-of-formula context
  // (another element symbol or start of word) to avoid matching "Year 10", "Section B2", etc.
  const CHEM_ELEMENTS = new Set(['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar',
    'K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr',
    'Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe',
    'Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu',
    'Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn',
    'Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr']);
  // Match chemical formula patterns: element symbol + digits (+ more elements + digits)
  // Only convert when the pattern looks like a formula (starts with a known element)
  result = result.replace(/\b([A-Z][a-z]?)((?:[0-9]+[A-Z][a-z]?)*[0-9]*)(?=[A-Z][a-z]?[0-9]|[0-9]|\b)/g, (full, firstElem, rest) => {
    if (!CHEM_ELEMENTS.has(firstElem)) return full; // Not a chemical element
    // Convert all digit runs to subscripts
    const converted = (firstElem + rest).replace(/([A-Z][a-z]?)([0-9]+)/g, (_, el, num) => {
      const subscript = num.split('').map((d: string) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(d)]).join('');
      return `${el}${subscript}`;
    });
    return converted;
  });
  // Also handle standalone element+number at end of word: CO2, H2O, etc.
  result = result.replace(/\b([A-Z][a-z]?)([0-9]+)\b/g, (full, elem, num) => {
    if (!CHEM_ELEMENTS.has(elem)) return full;
    const subscript = num.split('').map((d: string) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(d)]).join('');
    return `${elem}${subscript}`;
  });

  // Scientific notation: 6.02 x 10^23 or 6.02 × 10^23 → proper rendering
  result = result.replace(/(\d+\.?\d*)\s*[×x]\s*10\^\{?(-?\d+)\}?/g, (_, coeff, exp) => {
    try { return katex.renderToString(`${coeff} \\times 10^{${exp}}`, { displayMode: false, throwOnError: false }); }
    catch { return `${coeff} × 10${exp.split('').map((d: string) => '-0123456789'.includes(d) ? ('⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(d)] || d) : d).join('')}`; }
  });

  // ── Step 0a: Convert plain-English math phrases to LaTeX ──────────────────────
  // This handles question bank text like "x squared", "root(12)", "to the power of 3"

  // "x squared" → x² (then caught by Step 2)
  result = result.replace(/\b([A-Za-z0-9]+)\s+squared\b/g, (_, base) => `${base}\u00b2`);
  result = result.replace(/\b([A-Za-z0-9]+)\s+cubed\b/g, (_, base) => `${base}\u00b3`);

  // "a to the power of n" → a^n
  // Avoid converting bare phrases like "to the power of 2" on their own because
  // that leaves the base text in place and injects a standalone superscript, which
  // causes duplicated output such as "10 2 ... 10^2" on rendered worksheets.
  result = result.replace(/\b([A-Za-z0-9)]+)\s+to the power of\s+(-?[A-Za-z0-9]+)/gi, (_, base, exp) => {
    try { return katex.renderToString(`${base}^{${exp}}`, { displayMode: false, throwOnError: false }); }
    catch { return `${base}<sup>${exp}</sup>`; }
  });

  // "root(12)" or "root 12" → \sqrt{12}
  result = result.replace(/\broot\(([^)]+)\)/gi, (_, n) => {
    try { return katex.renderToString(`\\sqrt{${n}}`, { displayMode: false, throwOnError: false }); }
    catch { return `√${n}`; }
  });
  result = result.replace(/\broot\s+(\d+)\b/gi, (_, n) => {
    try { return katex.renderToString(`\\sqrt{${n}}`, { displayMode: false, throwOnError: false }); }
    catch { return `√${n}`; }
  });

  // "n root(x)" → nth root of x
  result = result.replace(/(\d+)\s+root\(([^)]+)\)/gi, (_, n, x) => {
    try { return katex.renderToString(`\\sqrt[${n}]{${x}}`, { displayMode: false, throwOnError: false }); }
    catch { return `${n}√${x}`; }
  });

  // "degrees" → ° symbol
  result = result.replace(/(\d+(?:\.\d+)?)\s*degrees\b/gi, '$1°');

  // Science-specific notation
  // Chemical formulas: CO2 → CO₂, H2O → H₂O, etc. (only for common patterns)
  // "proportional to" → ∝
  result = result.replace(/\bproportional to\b/gi, '∝');
  // "therefore" → ∴
  result = result.replace(/\btherefore\b/gi, '∴');
  // "because" (in maths context) → ∵ — skip, too ambiguous
  // "perpendicular" → ⊥
  result = result.replace(/\bperpendicular\b/gi, '⊥');
  // "parallel" → ∥
  result = result.replace(/\bparallel to\b/gi, '∥');
  // "approximately" → ≈
  result = result.replace(/\bapproximately equal to\b/gi, '≈');
  result = result.replace(/\bapprox\.?\b/gi, '≈');

  // "pi" as a standalone word → π
  result = result.replace(/\bpi\b/g, 'π');

  // "infinity" → ∞
  result = result.replace(/\binfinity\b/gi, '∞');

  // "less than or equal to" / "greater than or equal to"
  result = result.replace(/\bless than or equal to\b/gi, '≤');
  result = result.replace(/\bgreater than or equal to\b/gi, '≥');
  result = result.replace(/\bnot equal to\b/gi, '≠');

  // "x times y" → x × y (only when between numbers/variables)
  result = result.replace(/\b(\d+(?:\.\d+)?)\s+times\s+(\d+(?:\.\d+)?)\b/g, '$1 × $2');

  // "n divided by m" → n ÷ m
  result = result.replace(/\b(\d+(?:\.\d+)?)\s+divided by\s+(\d+(?:\.\d+)?)\b/g, '$1 ÷ $2');

  // ── Step 0b: Normalize spaced HTML tags that AI sometimes generates ──────────
  // e.g. "x < sup > 2 < /sup >" → "x<sup>2</sup>"
  result = result.replace(/<\s*sup\s*>/gi, "<sup>");
  result = result.replace(/<\s*\/\s*sup\s*>/gi, "</sup>");
  result = result.replace(/<\s*sub\s*>/gi, "<sub>");
  result = result.replace(/<\s*\/\s*sub\s*>/gi, "</sub>");

  // ── Step 0c-pre: Render delimited LaTeX FIRST before bare command processing ──
  // IMPORTANT: Process \(...\), \[...\], and $...$ BEFORE bare \dfrac, \frac,
  // \sqrt etc. Otherwise \dfrac inside \(\dfrac{a}{b}\) gets converted to KaTeX
  // HTML first, leaving orphaned \( and \) delimiters that never match.
  result = result.replace(/\\\[(\s*[\s\S]+?\s*)\\\]/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false }); }
    catch { return expr; }
  });
  result = result.replace(/\\\((\s*[\s\S]+?\s*)\\\)/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false }); }
    catch { return expr; }
  });
  result = result.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false }); }
    catch { return expr; }
  });

  // ── Step 0c: Handle bare LaTeX commands (no delimiters) ─────────────────────
  // The AI often generates \frac{1}{2}, \times, \pi, \sqrt{x} without $...$ wrappers.
  // We process these AFTER delimiter handling to avoid double-processing.
  // IMPORTANT: These handlers must only run on PLAIN TEXT segments, not on KaTeX HTML
  // that was already produced by Step 0c-pre. We use a nesting-aware tokeniser to
  // split the string into KaTeX HTML blocks and plain text, then only process plain text.
  {
    // Helper: apply a function only to plain-text segments (not KaTeX HTML)
    const applyToPlainText = (s: string, fn: (plain: string) => string): string => {
      if (!s.includes('<span class="katex"') && !s.includes("<span class='katex'")) {
        return fn(s); // No KaTeX HTML — apply directly
      }
      const segs: { text: string; isHtml: boolean }[] = [];
      let p = 0;
      while (p < s.length) {
        if (s[p] === '<') {
          const isK = s.startsWith('<span class="katex"', p) || s.startsWith("<span class='katex'", p);
          if (isK) {
            let depth = 0, i = p, end = -1;
            while (i < s.length) {
              if (s.startsWith('<span', i)) { depth++; const gt = s.indexOf('>', i); i = gt !== -1 ? gt + 1 : i + 5; }
              else if (s.startsWith('</span>', i)) { depth--; if (depth === 0) { end = i + 7; break; } i += 7; }
              else { i++; }
            }
            if (end !== -1) { segs.push({ text: s.substring(p, end), isHtml: true }); p = end; continue; }
          }
          const gt = s.indexOf('>', p); const tagEnd = gt !== -1 ? gt + 1 : p + 1;
          segs.push({ text: s.substring(p, tagEnd), isHtml: true }); p = tagEnd;
        } else {
          const next = s.indexOf('<', p); const end = next !== -1 ? next : s.length;
          segs.push({ text: s.substring(p, end), isHtml: false }); p = end;
        }
      }
      return segs.map(({ text, isHtml }) => isHtml ? text : fn(text)).join('');
    };

    // Fix truncated LaTeX commands caused by JSON backslash stripping:
    // e.g. \rac{1}{2} → \frac{1}{2}, \imes → \times, \ext{...} → text, \qrt → \sqrt
    // Uses a brace-depth-aware extractor to handle nested braces (e.g. \rac{-b ± \sqrt{b²-4ac}}{2a})
    result = applyToPlainText(result, s => {
      // Extract balanced brace group starting at position i (after the opening '{')
      const extractBraceGroup = (str: string, start: number): { content: string; end: number } | null => {
        if (str[start] !== '{') return null;
        let depth = 0, i = start;
        while (i < str.length) {
          if (str[i] === '{') depth++;
          else if (str[i] === '}') { depth--; if (depth === 0) return { content: str.substring(start + 1, i), end: i + 1 }; }
          i++;
        }
        return null;
      };
      let out = '';
      let i = 0;
      while (i < s.length) {
        // Look for bare 'rac{' (not preceded by backslash, since \frac is handled separately)
        const racIdx = s.indexOf('rac{', i);
        if (racIdx === -1) { out += s.substring(i); break; }
        // Ensure it's a bare 'rac' (not '\frac' or 'dfrac')
        const prevChar = racIdx > 0 ? s[racIdx - 1] : '';
        if (prevChar === '\\' || prevChar === 'f' || prevChar === 'd') { out += s.substring(i, racIdx + 4); i = racIdx + 4; continue; }
        // Extract numerator brace group
        const numGroup = extractBraceGroup(s, racIdx + 3);
        if (!numGroup) { out += s.substring(i, racIdx + 4); i = racIdx + 4; continue; }
        // Extract denominator brace group
        const denGroup = extractBraceGroup(s, numGroup.end);
        if (!denGroup) { out += s.substring(i, numGroup.end); i = numGroup.end; continue; }
        // Render as KaTeX fraction
        out += s.substring(i, racIdx);
        try { out += katex.renderToString(`\\dfrac{${numGroup.content}}{${denGroup.content}}`, { displayMode: false, throwOnError: false }); }
        catch { out += `${numGroup.content}/${denGroup.content}`; }
        i = denGroup.end;
      }
      return out;
    });
    result = applyToPlainText(result, s => s.replace(/\bimes\b/g, '×'));
    // Note: \text{}, \mathrm{} and related commands are handled at Step 0a-pre (top of function)
    // before any KaTeX HTML is produced, so we don't need to repeat them here.
    result = applyToPlainText(result, s => s.replace(/\bqrt\{([^{}]*)\}/g, (_, expr) => {
      try { return katex.renderToString(`\\sqrt{${expr}}`, { displayMode: false, throwOnError: false }); }
      catch { return `√${expr}`; }
    }));

    // \frac{num}{den} → KaTeX fraction
    result = applyToPlainText(result, s => s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, num, den) => {
      try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
      catch { return `${num}/${den}`; }
    }));
    // \dfrac{num}{den} → KaTeX fraction
    result = applyToPlainText(result, s => s.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, (_, num, den) => {
      try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
      catch { return `${num}/${den}`; }
    }));
    // \sqrt{expr} → KaTeX square root
    result = applyToPlainText(result, s => s.replace(/\\sqrt\{([^{}]*)\}/g, (_, expr) => {
      try { return katex.renderToString(`\\sqrt{${expr}}`, { displayMode: false, throwOnError: false }); }
      catch { return `√${expr}`; }
    }));
    // \sqrt[n]{expr} → KaTeX nth root
    result = applyToPlainText(result, s => s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]*)\}/g, (_, n, expr) => {
      try { return katex.renderToString(`\\sqrt[${n}]{${expr}}`, { displayMode: false, throwOnError: false }); }
      catch { return `${n}√${expr}`; }
    }));
    // \sqrt followed by a single character or number (no braces)
    result = applyToPlainText(result, s => s.replace(/\\sqrt\s+([A-Za-z0-9]+)/g, (_, n) => {
      try { return katex.renderToString(`\\sqrt{${n}}`, { displayMode: false, throwOnError: false }); }
      catch { return `√${n}`; }
    }));
  }
  // Bare LaTeX symbol commands → Unicode/HTML
  result = result.replace(/\\times\b/g, '×');
  result = result.replace(/\\cdot\b/g, '·');
  result = result.replace(/\\div\b/g, '÷');
  result = result.replace(/\\pm\b/g, '±');
  result = result.replace(/\\mp\b/g, '∓');
  result = result.replace(/\\pi\b/g, 'π');
  result = result.replace(/\\Pi\b/g, 'Π');
  result = result.replace(/\\theta\b/g, 'θ');
  result = result.replace(/\\alpha\b/g, 'α');
  result = result.replace(/\\beta\b/g, 'β');
  result = result.replace(/\\gamma\b/g, 'γ');
  result = result.replace(/\\delta\b/g, 'δ');
  result = result.replace(/\\Delta\b/g, 'Δ');
  result = result.replace(/\\sigma\b/g, 'σ');
  result = result.replace(/\\Sigma\b/g, 'Σ');
  result = result.replace(/\\lambda\b/g, 'λ');
  result = result.replace(/\\Lambda\b/g, 'Λ');
  result = result.replace(/\\mu\b/g, 'μ');
  result = result.replace(/\\nu\b/g, 'ν');
  result = result.replace(/\\omega\b/g, 'ω');
  result = result.replace(/\\Omega\b/g, 'Ω');
  result = result.replace(/\\epsilon\b/g, 'ε');
  result = result.replace(/\\varepsilon\b/g, 'ε');
  result = result.replace(/\\rho\b/g, 'ρ');
  result = result.replace(/\\tau\b/g, 'τ');
  result = result.replace(/\\phi\b/g, 'φ');
  result = result.replace(/\\Phi\b/g, 'Φ');
  result = result.replace(/\\psi\b/g, 'ψ');
  result = result.replace(/\\Psi\b/g, 'Ψ');
  result = result.replace(/\\eta\b/g, 'η');
  result = result.replace(/\\kappa\b/g, 'κ');
  result = result.replace(/\\chi\b/g, 'χ');
  result = result.replace(/\\zeta\b/g, 'ζ');
  result = result.replace(/\\infty\b/g, '∞');
  result = result.replace(/\\propto\b/g, '∝');
  result = result.replace(/\\therefore\b/g, '∴');
  result = result.replace(/\\because\b/g, '∵');
  result = result.replace(/\\perp\b/g, '⊥');
  result = result.replace(/\\parallel\b/g, '∥');
  result = result.replace(/\\sum\b/g, '∑');
  result = result.replace(/\\prod\b/g, '∏');
  result = result.replace(/\\partial\b/g, '∂');
  result = result.replace(/\\nabla\b/g, '∇');
  result = result.replace(/\\forall\b/g, '∀');
  result = result.replace(/\\exists\b/g, '∃');
  result = result.replace(/\\leq\b/g, '≤');
  result = result.replace(/\\geq\b/g, '≥');
  result = result.replace(/\\neq\b/g, '≠');
  result = result.replace(/\\approx\b/g, '≈');
  result = result.replace(/\\equiv\b/g, '≡');
  result = result.replace(/\\in\b/g, '∈');
  result = result.replace(/\\notin\b/g, '∉');
  result = result.replace(/\\subset\b/g, '⊂');
  result = result.replace(/\\cup\b/g, '∪');
  result = result.replace(/\\cap\b/g, '∩');
  result = result.replace(/\\angle\b/g, '∠');
  result = result.replace(/\\circ\b/g, '°');
  result = result.replace(/\\degree\b/g, '°');
  result = result.replace(/\\%/g, '%');
  result = result.replace(/\\ldots\b/g, '…');
  result = result.replace(/\\cdots\b/g, '⋯');
  result = result.replace(/\\rightarrow\b/g, '→');
  result = result.replace(/\\leftarrow\b/g, '←');
  result = result.replace(/\\Rightarrow\b/g, '⇒');
  result = result.replace(/\\Leftrightarrow\b/g, '⟺');
  result = result.replace(/\\text\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mathrm\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mathsf\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mathtt\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mathcal\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mbox\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\mathbf\{([^{}]*)\}/g, '<strong>$1</strong>');
  result = result.replace(/\\mathit\{([^{}]*)\}/g, '<em>$1</em>');
  // \left( and \right) → plain parens
  result = result.replace(/\\left\(/g, '(');
  result = result.replace(/\\right\)/g, ')');
  result = result.replace(/\\left\[/g, '[');
  result = result.replace(/\\right\]/g, ']');
  result = result.replace(/\\left\{/g, '{');
  result = result.replace(/\\right\}/g, '}');
  // \{ and \} → plain braces
  result = result.replace(/\\\{/g, '{');
  result = result.replace(/\\\}/g, '}');
  // Any remaining unknown \command → strip the backslash
  result = result.replace(/\\([a-zA-Z]+)/g, (full, cmd) => {
    // Only strip if it's not already been handled and looks like a LaTeX command
    // Keep it if it might be meaningful
    const knownCommands = ['frac','dfrac','sqrt','times','cdot','div','pm','mp','pi','Pi',
      'theta','alpha','beta','gamma','delta','Delta','sigma','Sigma','lambda','Lambda','mu','nu',
      'omega','Omega','epsilon','varepsilon','rho','tau','phi','Phi','psi','Psi','eta','kappa','chi','zeta',
      'infty','propto','therefore','because','perp','parallel','sum','prod','partial','nabla','forall','exists',
      'leq','geq','neq','approx','equiv','in','notin','subset','cup','cap',
      'angle','circ','degree','ldots','cdots','rightarrow','leftarrow','Rightarrow',
      'Leftrightarrow','text','mathrm','mathbf','mathit','left','right','quad','qquad'];
    if (knownCommands.includes(cmd)) return full; // already handled above, shouldn't reach here
    return cmd; // strip the backslash from unknown commands
  });

  // ── Step 1: Convert <sup>n</sup> and <sub>n</sub> HTML tags to LaTeX ────────
  // Do this BEFORE fraction handling so KaTeX can process them correctly
  result = result.replace(/<sup>([^<]+)<\/sup>/g, (_, exp) => {
    try { return katex.renderToString(`^{${exp}}`, { displayMode: false, throwOnError: false }); }
    catch { return `<sup>${exp}</sup>`; }
  });
  result = result.replace(/<sub>([^<]+)<\/sub>/g, (_, sub) => {
    try { return katex.renderToString(`_{${sub}}`, { displayMode: false, throwOnError: false }); }
    catch { return `<sub>${sub}</sub>`; }
  });

  // ── Step 2: Convert Unicode superscripts to LaTeX ───────────────────────────
  // Do this BEFORE fraction handling so fractions like (x²-4x)/(x²-16) work
  result = result.replace(/([A-Za-z0-9])\u00b2/g, (_, base) => {
    try { return katex.renderToString(`${base}^{2}`, { displayMode: false, throwOnError: false }); }
    catch { return `${base}<sup>2</sup>`; }
  });
  result = result.replace(/([A-Za-z0-9])\u00b3/g, (_, base) => {
    try { return katex.renderToString(`${base}^{3}`, { displayMode: false, throwOnError: false }); }
    catch { return `${base}<sup>3</sup>`; }
  });
  // Standalone ² or ³ (not preceded by alphanumeric)
  result = result.replace(/\u00b2/g, "<sup>2</sup>");
  result = result.replace(/\u00b3/g, "<sup>3</sup>");

  // ── Step 3: LaTeX delimiter rendering is now handled at Step 0c-pre (before bare commands)
  // to prevent \dfrac inside \(\dfrac{a}{b}\) from being processed prematurely.

  // ── Step 4: Convert plain-text ^ powers to proper superscripts ───────────────────
  // Only match plain text (not inside KaTeX HTML spans)
  result = result.replace(/([A-Za-z0-9α-ω\)]+)\^(-?[A-Za-z0-9]+)/g, (_, base, exp) => {
    try {
      return katex.renderToString(`${base}^{${exp}}`, { displayMode: false, throwOnError: false });
    } catch {
      return `${base}<sup>${exp}</sup>`;
    }
  });
  // Handle parenthesised base: (x+1)^2
  result = result.replace(/\(([^)]+)\)\^(-?[A-Za-z0-9]+)/g, (_, base, exp) => {
    try {
      return katex.renderToString(`(${base})^{${exp}}`, { displayMode: false, throwOnError: false });
    } catch {
      return `(${base})<sup>${exp}</sup>`;
    }
  });
  // Convert \u221a to proper square root symbol
  result = result.replace(/\u221a([A-Za-z0-9]+)/g, (_, n) => {
    try { return katex.renderToString(`\\sqrt{${n}}`, { displayMode: false, throwOnError: false }); }
    catch { return `\u221a${n}`; }
  });
  // Convert common math symbols
  result = result.replace(/\u00d7/g, "\u00d7"); // multiplication sign - keep as-is
  result = result.replace(/\u00f7/g, "\u00f7"); // division sign - keep as-is
  result = result.replace(/\u2260/g, "\u2260"); // not equal
  result = result.replace(/\u2264/g, "\u2264"); // less than or equal
  result = result.replace(/\u2265/g, "\u2265"); // greater than or equal
  result = result.replace(/\u03c0/g, "\u03c0"); // pi symbol
  result = result.replace(/\u221e/g, "\u221e"); // infinity
  // ── Step 5: Convert plain-text fractions to proper KaTeX stacked fractions ──
  // IMPORTANT: At this point, superscripts have already been converted to KaTeX HTML.
  // The fraction regexes only match plain text (no HTML tags inside parens).
  // This avoids trying to pass KaTeX HTML into KaTeX as LaTeX.

  // Helper: check if a string contains HTML (KaTeX output) — skip fraction rendering if so
  const hasHTML = (s: string) => /<[a-z]/i.test(s);

  // 1. Parenthesised numerator and/or denominator: (expr)/(expr)
  result = result.replace(/\(([^()]+(?:\([^()]*\)[^()]*)*)\)\/\(([^()]+(?:\([^()]*\)[^()]*)*)\)/g, (full, num, den) => {
    if (hasHTML(num) || hasHTML(den)) return full; // already has KaTeX HTML — don't re-process
    try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
    catch { return full; }
  });
  // 2. Plain numerator / parenthesised denominator: 1/(n+1)
  result = result.replace(/([A-Za-z0-9]+)\/\(([^()]+(?:\([^()]*\)[^()]*)*)\)/g, (full, num, den) => {
    if (hasHTML(num) || hasHTML(den)) return full;
    try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
    catch { return full; }
  });
  // 3. Parenthesised numerator / plain denominator: (x+1)/x
  result = result.replace(/\(([^()]+)\)\/([A-Za-z0-9]+)/g, (full, num, den) => {
    if (hasHTML(num) || hasHTML(den)) return full;
    try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
    catch { return full; }
  });
  // 4. Simple numeric or single-variable fractions: 3/4  x/y  2/n
  //    Use a nesting-aware tokeniser to split the string into KaTeX HTML blocks
  //    and plain-text segments. The non-greedy regex approach fails for deeply
  //    nested KaTeX HTML (20-30 levels) because it stops at the first </span>.
  {
    // Nesting-aware split: walk through the string and identify complete KaTeX blocks
    // by counting <span and </span> depth. Everything else is plain text.
    const segments: { text: string; isHtml: boolean }[] = [];
    let pos = 0;
    while (pos < result.length) {
      // Check if we're at the start of a KaTeX span or any HTML tag
      if (result[pos] === '<') {
        const isKatex = result.startsWith('<span class="katex"', pos) || result.startsWith("<span class='katex'", pos);
        if (isKatex) {
          // Nesting-aware: count <span and </span> to find the matching close
          let depth = 0;
          let i = pos;
          let endIdx = -1;
          while (i < result.length) {
            if (result.startsWith('<span', i)) {
              depth++;
              const gt = result.indexOf('>', i);
              i = gt !== -1 ? gt + 1 : i + 5;
            } else if (result.startsWith('</span>', i)) {
              depth--;
              if (depth === 0) { endIdx = i + 7; break; }
              i += 7;
            } else { i++; }
          }
          if (endIdx !== -1) {
            segments.push({ text: result.substring(pos, endIdx), isHtml: true });
            pos = endIdx;
            continue;
          }
        }
        // Non-KaTeX HTML tag: find the closing >
        const gt = result.indexOf('>', pos);
        const tagEnd = gt !== -1 ? gt + 1 : pos + 1;
        segments.push({ text: result.substring(pos, tagEnd), isHtml: true });
        pos = tagEnd;
      } else {
        // Plain text: collect until next <
        const next = result.indexOf('<', pos);
        const end = next !== -1 ? next : result.length;
        segments.push({ text: result.substring(pos, end), isHtml: false });
        pos = end;
      }
    }
    result = segments.map(({ text, isHtml }) => {
      if (isHtml) return text; // Leave all HTML / KaTeX segments untouched
      // Apply fraction conversion to plain text only.
      return text.replace(/([A-Za-z0-9]+)\/([A-Za-z0-9]+)/g, (full, num, den) => {
        // Skip year ranges (e.g. 2023/24)
        if (/^\d{4}$/.test(num) || /^\d{4}$/.test(den)) return full;
        // Skip if either part is a long number that looks like a year
        if (/^\d{4,}$/.test(num) || /^\d{4,}$/.test(den)) return full;
        try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
        catch { return full; }
      });
    }).join('');
  }
  // Bold markdown **text** → <strong>text</strong>
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Remove any remaining lone asterisks
  result = result.replace(/\*\*/g, "");
  result = result.replace(/(?<!<[^>]*)\*(?![^<]*>)/g, "");
  return result;
}

/**
 * Strip KaTeX-rendered HTML back to readable plain text.
 * Used for collapsed preview cards where CSS line-clamp would truncate mid-HTML-tag
 * and cause raw attribute text (class="katex", etc.) to appear as visible characters.
 * Converts KaTeX spans → their MathML annotation text, then strips all remaining HTML.
 */
export function stripKatexToPlainText(html: string): string {
  if (!html) return "";

  // Helper: convert a raw LaTeX string to readable plain text
  const latexToPlain = (tex: string) => tex
    .replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pi/g, 'π')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}^_]/g, '')
    .trim();

  // Nesting-aware KaTeX block removal.
  // KaTeX produces deeply nested <span> trees (20-30 levels for a fraction).
  // A simple non-greedy regex fails because it stops at the first </span>.
  // Instead we find each outermost <span class="katex"> and count nesting
  // to locate the matching closing </span>, then replace the entire block
  // with the plain-text annotation extracted from the MathML inside it.
  let result = html;
  const katexPatterns = ['class="katex"', "class='katex'"];
  for (const pat of katexPatterns) {
    let safety = 0;
    while (result.includes(pat) && safety < 200) {
      safety++;
      const marker = '<span ' + pat;
      const startIdx = result.indexOf(marker);
      if (startIdx === -1) break;

      // Walk forward counting <span and </span> to find matching close
      let depth = 0;
      let i = startIdx;
      let endIdx = -1;
      while (i < result.length) {
        if (result.startsWith('<span', i)) {
          depth++;
          // skip past the tag name so we don't re-match
          const gt = result.indexOf('>', i);
          i = gt !== -1 ? gt + 1 : i + 5;
        } else if (result.startsWith('</span>', i)) {
          depth--;
          if (depth === 0) {
            endIdx = i + 7; // '</span>'.length
            break;
          }
          i += 7;
        } else {
          i++;
        }
      }
      if (endIdx === -1) break; // malformed HTML — bail

      const katexBlock = result.substring(startIdx, endIdx);
      // Extract annotation text (raw LaTeX) from the MathML inside this block.
      // Use the LAST annotation tag (greedy search) because KaTeX may nest multiple
      // annotation tags when rendering compound expressions like \dfrac{a}{b} = \dfrac{c}{d}.
      // The outermost (last) annotation contains the full LaTeX expression.
      const annotRegex = /<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/gi;
      let annotMatch: RegExpExecArray | null = null;
      let lastAnnotMatch: RegExpExecArray | null = null;
      while ((annotMatch = annotRegex.exec(katexBlock)) !== null) {
        lastAnnotMatch = annotMatch;
      }
      const plainText = lastAnnotMatch ? latexToPlain(lastAnnotMatch[1]) : '';
      result = result.substring(0, startIdx) + plainText + result.substring(endIdx);
    }
  }

  // Strip all remaining HTML tags
  result = result.replace(/<[^>]+>/g, '');
  // Decode HTML entities
  result = result
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Collapse whitespace
  return result.replace(/\s+/g, ' ').trim();
}

export interface WorksheetSection {
  title: string;
  type: string;
  content: string;
  teacherOnly?: boolean;
  svg?: string;
  caption?: string;
  imageUrl?: string;
  attribution?: string;
}

export interface WorksheetData {
  title: string;
  subtitle?: string;
  sections: WorksheetSection[];
  metadata: {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    sendNeed?: string;
    sendNeedId?: string;
    difficulty?: string;
    examBoard?: string;
    totalMarks?: number;
    estimatedTime?: string;
    adaptations?: string[];
  };
  isAI?: boolean;
  provider?: string;
}

interface WorksheetRendererProps {
  worksheet: WorksheetData;
  viewMode: "teacher" | "student";
  textSize: number;
  overlayColor: string;
  editedSections?: Record<number, string>;
  onSectionClick?: (index: number) => void;
  editMode?: boolean;
  schoolName?: string;
  teacherName?: string;
}

// Section type → colour config
const SECTION_STYLES: Record<string, { border: string; bg: string; badge: string; badgeBg: string; icon: string; label: string }> = {
  "objective":     { border: "#0d9488", bg: "#f0fdfa", badge: "#0d9488", badgeBg: "#ccfbf1", icon: "🎯", label: "Learning Objectives" },
  "success":       { border: "#0d9488", bg: "#f0fdfa", badge: "#0d9488", badgeBg: "#ccfbf1", icon: "✅", label: "Success Criteria" },
  "vocabulary":    { border: "#7c3aed", bg: "#faf5ff", badge: "#7c3aed", badgeBg: "#ede9fe", icon: "📚", label: "Key Vocabulary" },
  "starter":       { border: "#ea580c", bg: "#fff7ed", badge: "#ea580c", badgeBg: "#fed7aa", icon: "🔥", label: "Starter Activity" },
  "example":       { border: "#4f46e5", bg: "#eef2ff", badge: "#4f46e5", badgeBg: "#e0e7ff", icon: "💡", label: "Worked Example" },
  "guided":        { border: "#2563eb", bg: "#eff6ff", badge: "#2563eb", badgeBg: "#dbeafe", icon: "🌟", label: "Foundation" },
  "independent":   { border: "#059669", bg: "#f0fdf4", badge: "#059669", badgeBg: "#d1fae5", icon: "📝", label: "Core Practice" },
  "challenge":     { border: "#9333ea", bg: "#fdf4ff", badge: "#9333ea", badgeBg: "#f3e8ff", icon: "🚀", label: "Stretch & Challenge" },
  "word-bank":     { border: "#0891b2", bg: "#ecfeff", badge: "#0891b2", badgeBg: "#cffafe", icon: "🔤", label: "Word Bank" },
  "sentence-starters": { border: "#0891b2", bg: "#ecfeff", badge: "#0891b2", badgeBg: "#cffafe", icon: "✏️", label: "Sentence Starters" },
  "self-assessment": { border: "#d97706", bg: "#fffbeb", badge: "#d97706", badgeBg: "#fef3c7", icon: "🔍", label: "Self Assessment" },
  "self-reflection": { border: "#f59e0b", bg: "#fffbeb", badge: "#f59e0b", badgeBg: "#fef3c7", icon: "💭", label: "How Did I Do?" },
  "diagram":       { border: "#6366f1", bg: "#eef2ff", badge: "#6366f1", badgeBg: "#e0e7ff", icon: "📊", label: "Diagram" },
  "answers":       { border: "#16a34a", bg: "#f0fdf4", badge: "#16a34a", badgeBg: "#dcfce7", icon: "✓", label: "Answers" },
  "questions":     { border: "#2563eb", bg: "#eff6ff", badge: "#2563eb", badgeBg: "#dbeafe", icon: "📝", label: "Exam Questions" },
  "mark-scheme":   { border: "#ca8a04", bg: "#fefce8", badge: "#ca8a04", badgeBg: "#fef9c3", icon: "📋", label: "Mark Scheme" },
  "teacher-notes": { border: "#dc2626", bg: "#fef2f2", badge: "#dc2626", badgeBg: "#fee2e2", icon: "👩‍🏫", label: "Teacher Notes" },
  "send-support":  { border: "#7c3aed", bg: "#faf5ff", badge: "#7c3aed", badgeBg: "#ede9fe", icon: "♿", label: "SEND Support" },
  "reminder-box":  { border: "#d97706", bg: "#fffbeb", badge: "#d97706", badgeBg: "#fef3c7", icon: "⚠️", label: "Reminder Box" },
  "word-problems": { border: "#0891b2", bg: "#ecfeff", badge: "#0891b2", badgeBg: "#cffafe", icon: "🌍", label: "Word Problems" },
  "misconceptions":{ border: "#dc2626", bg: "#fef2f2", badge: "#dc2626", badgeBg: "#fee2e2", icon: "❌", label: "Common Misconceptions" },
  "default":       { border: "#6b7280", bg: "#f9fafb", badge: "#6b7280", badgeBg: "#f3f4f6", icon: "📄", label: "" },
};

function getSectionStyle(type: string) {
  return SECTION_STYLES[type] || SECTION_STYLES["default"];
}

function formatContent(content: string, fmt: ReturnType<typeof getSendFormatting>): React.ReactNode {
  const { fontSize: textSize, lineHeight, letterSpacing, wordSpacing, paragraphSpacing, fontFamily } = fmt;
  if (!content) return null;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let listItems: string[] = [];

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return;
    const rows = tableRows.map(r => r.split("|").map(c => c.trim()).filter(Boolean));
    const header = rows[0];
    const body = rows.slice(1);
    elements.push(
      <div key={key} className="ws-table-wrap" style={{ overflowX: "auto", margin: "8px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: `${textSize - 1}px`, fontFamily, letterSpacing, wordSpacing }}>
          <thead>
            <tr>
              {header.map((h, hi) => (
                <th key={hi} style={{ padding: "8px 12px", background: "#7c3aed", color: "white", textAlign: "left", fontWeight: 600, border: "1px solid #ddd" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f9fafb" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "7px 12px", border: "1px solid #e5e7eb", fontSize: `${textSize - 1}px` }}>
                    <span dangerouslySetInnerHTML={{ __html: renderMath(cell) }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key} style={{ margin: "6px 0 6px 20px", padding: 0 }}>
        {listItems.map((item, ii) => (
          <li key={ii} style={{ marginBottom: paragraphSpacing, fontSize: `${textSize}px`, lineHeight, letterSpacing, wordSpacing, fontFamily }}>
            <span dangerouslySetInnerHTML={{ __html: renderMath(item) }} />
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Table row
    if (trimmed.includes("|") && !trimmed.startsWith("Hint:") && !trimmed.startsWith("Step")) {
      if (listItems.length) flushList(`list-${idx}`);
      inTable = true;
      if (!trimmed.match(/^[\|\s\-]+$/)) { // skip separator rows
        tableRows.push(trimmed);
      }
      return;
    }
    if (inTable) flushTable(`table-${idx}`);

    // Empty line
    if (!trimmed) {
      if (listItems.length) flushList(`list-${idx}`);
      elements.push(<div key={`sp-${idx}`} style={{ height: "6px" }} />);
      return;
    }

    // Bullet list
    if (trimmed.startsWith("• ") || trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const text = trimmed.replace(/^[•\*\-]\s+/, "");
      listItems.push(text);
      return;
    }
    if (listItems.length) flushList(`list-${idx}`);

    // Numbered list
    const numberedMatch = trimmed.match(/^(\d+[a-z]?[.)]\s+)(.+)$/);
    if (numberedMatch) {
      elements.push(
        <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: paragraphSpacing, fontSize: `${textSize}px`, lineHeight, letterSpacing, wordSpacing, fontFamily }}>
          <span style={{ fontWeight: 600, minWidth: "24px", color: "#374151" }}>{numberedMatch[1]}</span>
          <span dangerouslySetInnerHTML={{ __html: renderMath(numberedMatch[2]) }} />
        </div>
      );
      return;
    }

    // Hint lines are not shown on worksheets — skip them
    if (trimmed.startsWith("Hint:") || trimmed.startsWith("💡")) {
      return;
    }

    // Step line
    if (trimmed.match(/^Step \d+:/)) {
      elements.push(
        <div key={idx} style={{ fontWeight: 700, color: "#059669", marginTop: "8px", marginBottom: "2px", fontSize: `${textSize}px`, fontFamily }}>
          <span dangerouslySetInnerHTML={{ __html: renderMath(trimmed) }} />
        </div>
      );
      return;
    }

    // Mark allocation
    const markMatch = trimmed.match(/^(.+?)(\[\d+ marks?\])(.*)$/i);
    if (markMatch) {
      elements.push(
        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: paragraphSpacing, fontSize: `${textSize}px`, lineHeight, letterSpacing, wordSpacing, fontFamily }}>
          <span dangerouslySetInnerHTML={{ __html: renderMath(markMatch[1]) }} />
          <span style={{ background: "#374151", color: "white", fontSize: `${textSize - 3}px`, padding: "1px 6px", borderRadius: "4px", whiteSpace: "nowrap", marginLeft: "8px", fontWeight: 700 }}>{markMatch[2]}</span>
        </div>
      );
      return;
    }

    // Answer line (underscores)
    if (trimmed.match(/^_{5,}$/)) {
      elements.push(
        <div key={idx} style={{ borderBottom: "1px solid #9ca3af", margin: "8px 0", height: "24px" }} />
      );
      return;
    }

    // Bold heading (standalone **text** or ## heading)
    if (trimmed.match(/^\*\*.+\*\*$/) || trimmed.match(/^#{1,3}\s+/)) {
      const headingText = trimmed.replace(/^#{1,3}\s+/, "").replace(/\*\*/g, "");
      elements.push(
        <div key={idx} style={{ fontWeight: 700, fontSize: `${textSize + 1}px`, marginTop: "8px", marginBottom: "4px", color: "#111827", fontFamily, letterSpacing }}>
          <span dangerouslySetInnerHTML={{ __html: renderMath(headingText) }} />
        </div>
      );
      return;
    }

    // Regular paragraph — use renderMath for proper symbols and strip asterisks
    elements.push(
      <p key={idx} style={{ margin: `0 0 ${paragraphSpacing} 0`, fontSize: `${textSize}px`, lineHeight, color: "#1f2937", fontFamily, letterSpacing, wordSpacing }}>
        <span dangerouslySetInnerHTML={{ __html: renderMath(trimmed) }} />
      </p>
    );
  });

  if (inTable) flushTable("table-end");
  if (listItems.length) flushList("list-end");

  return <>{elements}</>;
}

function VocabSection({ content, fmt }: { content: string; fmt: ReturnType<typeof getSendFormatting> }) {
  const { fontSize: textSize, fontFamily, lineHeight, letterSpacing } = fmt;
  const lines = content.split("\n").filter(l => l.trim() && !l.trim().toUpperCase().startsWith("TERM"));
  const entries = lines.map(l => {
    const parts = l.split("|");
    if (parts.length >= 2) return { term: parts[0].trim(), def: parts.slice(1).join("|").trim() };
    const colonIdx = l.indexOf(":");
    if (colonIdx > 0) return { term: l.slice(0, colonIdx).trim(), def: l.slice(colonIdx + 1).trim() };
    return null;
  }).filter(Boolean) as { term: string; def: string }[];

  if (entries.length === 0) {
    return <div style={{ fontSize: `${textSize}px`, lineHeight, fontFamily, letterSpacing }}>{content}</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px" }}>
      {entries.map((e, i) => (
        <div key={i} style={{ background: "white", border: "1px solid #e9d5ff", borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontWeight: 700, color: "#7c3aed", fontSize: `${textSize}px`, fontFamily, letterSpacing }} dangerouslySetInnerHTML={{ __html: renderMath(e.term) }} />
          <div style={{ color: "#374151", fontSize: `${textSize - 1}px`, lineHeight, fontFamily, letterSpacing }} dangerouslySetInnerHTML={{ __html: renderMath(e.def) }} />
        </div>
      ))}
    </div>
  );
}

function SelfAssessmentSection({ content, fmt }: { content: string; fmt: ReturnType<typeof getSendFormatting> }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const lines = content.split("\n").filter(l => l.trim());
  return (
    <div>
      {lines.map((line, i) => {
        const clean = line.replace(/^[•\-\*]\s*/, "").replace(/^I can\s*/i, "").trim();
        if (!clean) return null;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: i < lines.length - 1 ? "1px solid #e5e7eb" : "none" }}>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              {["🔴", "🟡", "🟢"].map((emoji, ci) => (
                <div key={ci} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                  {emoji}
                </div>
              ))}
            </div>
            <span style={{ fontSize: `${textSize}px`, color: "#374151", fontFamily, lineHeight }} dangerouslySetInnerHTML={{ __html: "I can " + renderMath(clean) }} />
          </div>
        );
      })}
      <div style={{ marginTop: "8px", fontSize: `${textSize - 2}px`, color: "#6b7280", fontStyle: "italic", fontFamily }}>
        🔴 Not yet &nbsp;|&nbsp; 🟡 Getting there &nbsp;|&nbsp; 🟢 I've got it!
      </div>
    </div>
  );
}

/**
 * Self-Reflection section — shown at the end of every worksheet.
 * "I can" statements with traffic-light circles + an open reflection question.
 */
function SelfReflectionSection({ content, fmt }: { content: string; fmt: ReturnType<typeof getSendFormatting> }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const lines = content.split("\n").filter(l => l.trim());
  // Separate "I can" statements from the open question (starts with "Q:")
  const iCanLines = lines.filter(l => !l.trim().startsWith("Q:"));
  const openQuestion = lines.find(l => l.trim().startsWith("Q:"));
  const openQ = openQuestion ? openQuestion.replace(/^Q:\s*/i, "").trim() : null;
  return (
    <div>
      {/* Traffic-light self-assessment rows */}
      {iCanLines.map((line, i) => {
        const clean = line.replace(/^[•\-\*]\s*/, "").replace(/^I can\s*/i, "").trim();
        if (!clean) return null;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #fde68a" }}>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              {["🔴", "🟡", "🟢"].map((emoji, ci) => (
                <div key={ci} style={{ width: "26px", height: "26px", borderRadius: "50%", border: "2px solid #fcd34d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                  {emoji}
                </div>
              ))}
            </div>
            <span style={{ fontSize: `${textSize}px`, color: "#374151", fontFamily, lineHeight }} dangerouslySetInnerHTML={{ __html: "I can " + renderMath(clean) }} />
          </div>
        );
      })}
      <div style={{ marginTop: "6px", fontSize: `${textSize - 2}px`, color: "#92400e", fontStyle: "italic", fontFamily }}>
        🔴 Not yet &nbsp;|&nbsp; 🟡 Getting there &nbsp;|&nbsp; 🟢 I've got it!
      </div>
      {/* Open reflection question */}
      {openQ && (
        <div style={{ marginTop: "14px", background: "white", border: "1px solid #fcd34d", borderRadius: "8px", padding: "10px 12px" }}>
          <div style={{ fontSize: `${textSize - 1}px`, fontWeight: 600, color: "#92400e", fontFamily, marginBottom: "6px" }} dangerouslySetInnerHTML={{ __html: "💭 " + renderMath(openQ) }} />
          <div style={{ borderBottom: "1px solid #d1d5db", height: "28px", marginBottom: "6px" }} />
          <div style={{ borderBottom: "1px solid #d1d5db", height: "28px" }} />
        </div>
      )}
    </div>
  );
}

function WordBankSection({ content, fmt }: { content: string; fmt: ReturnType<typeof getSendFormatting> }) {
  const { fontSize: textSize, fontFamily } = fmt;
  const words = content.split(/[\n,|]/).map(w => w.trim()).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {words.map((word, i) => (
        <span key={i} style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "20px", fontSize: `${textSize - 1}px`, fontWeight: 500, border: "1px solid #bfdbfe", fontFamily }}>
          {word}
        </span>
      ))}
    </div>
  );
}

function SentenceStartersSection({ content, fmt }: { content: string; fmt: ReturnType<typeof getSendFormatting> }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const starters = content.split("\n").filter(l => l.trim()).map(l => l.replace(/^[•\-\*\d.)\s]+/, "").trim());
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px" }}>
      {starters.map((s, i) => (
        <div key={i} style={{ background: "#ecfeff", border: "1px dashed #06b6d4", borderRadius: "6px", padding: "6px 10px", fontSize: `${textSize - 1}px`, color: "#0e7490", fontStyle: "italic", fontFamily, lineHeight }}>
          "{s}..."
        </div>
      ))}
    </div>
  );
}

function ReminderBoxSection({ content, fmt }: { content: string; fmt: ReturnType<typeof getSendFormatting> }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const lines = content.split("\n").filter(l => l.trim());
  const steps = lines.filter(l => /^Step\s*\d+/i.test(l.trim()));
  const otherLines = lines.filter(l => !/^Step\s*\d+/i.test(l.trim()));
  return (
    <div style={{ background: "#fffbeb", border: "2px solid #f59e0b", borderRadius: "10px", padding: "14px 16px" }}>
      <div style={{ fontSize: `${textSize - 1}px`, fontWeight: 700, color: "#92400e", marginBottom: "10px", fontFamily, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        ⚠️ Keep this in mind while you work:
      </div>
      {steps.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {steps.map((step, i) => {
            const match = step.match(/^(Step\s*\d+[:.]?)\s*(.*)$/i);
            const stepLabel = match ? match[1] : `Step ${i + 1}:`;
            const stepText = match ? match[2] : step;
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  background: "#f59e0b",
                  color: "white",
                  borderRadius: "6px",
                  padding: "3px 10px",
                  fontSize: `${textSize - 2}px`,
                  fontWeight: 700,
                  fontFamily,
                  flexShrink: 0,
                  minWidth: "60px",
                  textAlign: "center",
                }}>
                  {stepLabel}
                </div>
                <div style={{ fontSize: `${textSize}px`, color: "#1c1917", fontFamily, lineHeight, fontWeight: 600 }}
                  dangerouslySetInnerHTML={{ __html: renderMath(stepText) }} />
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: `${textSize}px`, color: "#1c1917", fontFamily, lineHeight }}>
          {otherLines.map((line, i) => (
            <div key={i} style={{ marginBottom: "4px" }} dangerouslySetInnerHTML={{ __html: renderMath(line) }} />
          ))}
        </div>
      )}
    </div>
  );
}

function WordProblemsSection({ content, fmt }: { content: string; fmt: ReturnType<typeof getSendFormatting> }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  // Split into individual problems by numbered lines or double newlines
  const lines = content.split("\n");
  const problems: string[][] = [];
  let current: string[] = [];
  lines.forEach(line => {
    const isNewProblem = /^\d+[.)\s]/.test(line.trim()) && line.trim().length > 3;
    if (isNewProblem && current.length > 0) {
      problems.push(current);
      current = [line];
    } else if (line.trim()) {
      current.push(line);
    }
  });
  if (current.length > 0) problems.push(current);

  if (problems.length === 0) {
    return <div>{formatContent(content, fmt)}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {problems.map((problem, i) => (
        <div key={i} style={{
          background: "white",
          border: "1px solid #a5f3fc",
          borderLeft: "4px solid #0891b2",
          borderRadius: "8px",
          padding: "12px 14px",
        }}>
          <div style={{ fontSize: `${textSize - 2}px`, fontWeight: 700, color: "#0e7490", marginBottom: "6px", fontFamily, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Problem {i + 1}
          </div>
          {problem.map((line, li) => (
            <div key={li} style={{ fontSize: `${textSize}px`, color: "#1f2937", fontFamily, lineHeight, marginBottom: "4px" }}
              dangerouslySetInnerHTML={{ __html: renderMath(line.replace(/^\d+[.)\s]+/, "")) }} />
          ))}
          <div style={{ marginTop: "10px", borderTop: "1px dashed #a5f3fc", paddingTop: "8px" }}>
            <div style={{ fontSize: `${textSize - 2}px`, color: "#9ca3af", marginBottom: "4px", fontFamily }}>Working space &amp; answer:</div>
            {[1, 2].map(n => (
              <div key={n} style={{ borderBottom: "1px solid #d1d5db", height: "26px", marginBottom: "6px" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const WorksheetRenderer = forwardRef<HTMLDivElement, WorksheetRendererProps>(({
  worksheet,
  viewMode,
  textSize,
  overlayColor,
  editedSections = {},
  onSectionClick,
  editMode = false,
  schoolName,
  teacherName,
}, ref) => {
  const isTeacherView = viewMode === "teacher";

  // Resolve SEND need ID from metadata (may be stored as sendNeedId or inferred from sendNeed label)
  const sendNeedId = worksheet.metadata.sendNeedId || worksheet.metadata.sendNeed;
  const fmt = getSendFormatting(sendNeedId, textSize);

  return (
    <div
      ref={ref}
      className="worksheet-print-root"
      style={{
        backgroundColor: overlayColor || "white",
        fontFamily: fmt.fontFamily,
        fontSize: `${fmt.fontSize}px`,
        lineHeight: fmt.lineHeight,
        letterSpacing: fmt.letterSpacing,
        wordSpacing: fmt.wordSpacing,
        fontWeight: fmt.fontWeight,
      }}
    >
      {/* ── Professional Header ── */}
      <div className="ws-header" style={{
        marginBottom: "20px",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        {/* Top colour bar */}
        <div style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: "16px" }}>A</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "white", fontFamily: fmt.fontFamily }}>{schoolName || "Adaptly"}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", fontFamily: fmt.fontFamily }}>SEND-Informed Learning Resource</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {worksheet.metadata.yearGroup && (
              <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, fontFamily: fmt.fontFamily }}>
                {worksheet.metadata.yearGroup}
              </span>
            )}
            {worksheet.metadata.subject && (
              <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, fontFamily: fmt.fontFamily }}>
                {worksheet.metadata.subject ? worksheet.metadata.subject.charAt(0).toUpperCase() + worksheet.metadata.subject.slice(1) : ""}
              </span>
            )}
            {worksheet.metadata.examBoard && worksheet.metadata.examBoard !== "General" && worksheet.metadata.examBoard !== "none" && worksheet.metadata.examBoard !== "No Exam Board" && (
              <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, fontFamily: fmt.fontFamily }}>
                {worksheet.metadata.examBoard}
              </span>
            )}
          </div>
        </div>
        {/* Main header body */}
        <div style={{
          background: overlayColor || "white",
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: `${fmt.fontSize + 10}px`, fontWeight: 800, color: "#111827", margin: "0 0 4px 0", lineHeight: 1.2, fontFamily: fmt.fontFamily, letterSpacing: fmt.letterSpacing }}>
              {worksheet.title}
            </h1>
            {worksheet.subtitle && (
              <p style={{ fontSize: `${fmt.fontSize - 1}px`, color: "#6b7280", margin: "0 0 10px 0", fontFamily: fmt.fontFamily }}>{worksheet.subtitle}</p>
            )}
            {/* Metadata badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {worksheet.metadata.sendNeed && (
                <span style={{ background: "#fce7f3", color: "#9d174d", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, fontFamily: fmt.fontFamily }}>
                  ♿ {worksheet.metadata.sendNeed}
                </span>
              )}
              {worksheet.metadata.difficulty && worksheet.metadata.difficulty !== "mixed" && (
                <span style={{ background: worksheet.metadata.difficulty === "foundation" ? "#dbeafe" : "#f3e8ff", color: worksheet.metadata.difficulty === "foundation" ? "#1d4ed8" : "#7c3aed", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, fontFamily: fmt.fontFamily }}>
                  {worksheet.metadata.difficulty === "foundation" ? "📊 Foundation" : "🚀 Higher"}
                </span>
              )}
              {worksheet.metadata.estimatedTime && (
                <span style={{ background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, fontFamily: fmt.fontFamily }}>
                  ⏱ {worksheet.metadata.estimatedTime}
                </span>
              )}
              {worksheet.metadata.totalMarks ? (
                <span style={{ background: "#fff7ed", color: "#9a3412", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, fontFamily: fmt.fontFamily }}>
                  ★ {worksheet.metadata.totalMarks} marks
                </span>
              ) : null}
            </div>
          </div>
          {/* Name/Date/Class fields */}
          <div style={{ flexShrink: 0, minWidth: "190px", background: "#f9fafb", borderRadius: "8px", padding: "10px 12px", border: "1px solid #e5e7eb" }}>
            {[
              { label: "Name", value: "" },
              { label: "Date", value: new Date().toLocaleDateString("en-GB") },
              { label: "Class", value: "" },
              ...(teacherName ? [{ label: "Teacher", value: teacherName }] : []),
            ].map((field, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", minWidth: "50px", fontFamily: fmt.fontFamily }}>{field.label}:</span>
                <div style={{ flex: 1, borderBottom: "1.5px solid #9ca3af", minWidth: "100px", height: "18px", display: "flex", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "11px", color: "#374151", paddingBottom: "1px", fontFamily: fmt.fontFamily }}>{field.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      {worksheet.sections.map((section, i) => {
        // Hide teacher sections in student view
        // self-reflection, objective, and vocabulary are ALWAYS shown to students
        const isAlwaysStudentVisible = section.type === "self-reflection" || section.type === "objective" || section.type === "vocabulary";
        if (!isTeacherView && !isAlwaysStudentVisible && (section.teacherOnly || section.type === "answers" || section.type === "mark-scheme" || section.type === "teacher-notes")) {
          return null;
        }

        const content = editedSections[i] !== undefined ? editedSections[i] : section.content;
        const style = getSectionStyle(section.type);
        // Teacher-only sections: mark-scheme, teacher-notes, answers, and any explicitly flagged teacherOnly
        const isTeacherSection = section.teacherOnly || section.type === "teacher-notes" || section.type === "mark-scheme" || section.type === "answers";

        return (
          <div
            key={i}
            className={`ws-section ws-section-${section.type}${isTeacherSection ? " ws-teacher-section" : ""}`}
            onClick={() => editMode && onSectionClick?.(i)}
            style={{
              marginBottom: "16px",
              borderRadius: "8px",
              border: `1px solid ${style.border}30`,
              borderLeft: `4px solid ${style.border}`,
              background: style.bg,
              overflow: "hidden",
              cursor: editMode ? "pointer" : "default",
              outline: editMode && editedSections[i] !== undefined ? `2px solid ${style.border}` : "none",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            {/* Section header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 14px",
              borderBottom: `1px solid ${style.border}20`,
              background: `${style.border}10`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>{style.icon}</span>
                <span style={{ fontWeight: 700, fontSize: `${fmt.fontSize + 1}px`, color: style.border, fontFamily: fmt.fontFamily }}>
                  {section.title}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {isTeacherSection && (
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 700 }}>
                    👩‍🏫 TEACHER ONLY
                  </span>
                )}
                {section.type === "guided" && (
                  <span style={{ background: style.badgeBg, color: style.badge, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    ⭐ Foundation
                  </span>
                )}
                {section.type === "independent" && (
                  <span style={{ background: style.badgeBg, color: style.badge, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    📝 Core
                  </span>
                )}
                {section.type === "challenge" && (
                  <span style={{ background: style.badgeBg, color: style.badge, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    🚀 Extension
                  </span>
                )}
                {section.type === "reminder-box" && (
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    📌 3 Key Steps
                  </span>
                )}
                {section.type === "word-problems" && (
                  <span style={{ background: "#cffafe", color: "#0e7490", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    🌍 Real Life
                  </span>
                )}
              </div>
            </div>

            {/* Section content */}
            <div style={{ padding: "12px 14px" }}>
              {section.type === "diagram" && (section.imageUrl || section.svg) ? (
                <div style={{ textAlign: "center" }}>
                  {section.imageUrl ? (
                    <img
                      src={section.imageUrl}
                      alt={section.caption || "Diagram"}
                      style={{ maxWidth: "560px", width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        // If there's an SVG fallback, show it; otherwise show error text
                        if (section.svg) {
                          const svgWrapper = document.createElement("div");
                          svgWrapper.style.cssText = "display:inline-block;width:100%;max-width:560px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:white;";
                          svgWrapper.innerHTML = section.svg;
                          target.parentNode?.insertBefore(svgWrapper, target.nextSibling);
                        } else {
                          const fallback = document.createElement("p");
                          fallback.textContent = "[Diagram image could not be loaded]";
                          fallback.style.cssText = "color:#9ca3af;font-style:italic;font-size:13px;";
                          target.parentNode?.insertBefore(fallback, target.nextSibling);
                        }
                      }}
                    />
                  ) : section.svg ? (
                    <div
                      style={{ display: "inline-block", width: "100%", maxWidth: "560px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "white" }}
                      dangerouslySetInnerHTML={{ __html: section.svg }}
                    />
                  ) : null}
                  {section.caption && (
                    <p style={{ fontSize: `${fmt.fontSize - 2}px`, color: "#6b7280", marginTop: "6px", fontStyle: "italic", fontFamily: fmt.fontFamily }}>
                      Figure: {section.caption}
                    </p>
                  )}
                  {section.attribution && (
                    <p style={{ fontSize: `${fmt.fontSize - 3}px`, color: "#9ca3af", marginTop: "2px", fontFamily: fmt.fontFamily }}>
                      Source: {section.attribution}
                    </p>
                  )}
                </div>
              ) : section.type === "vocabulary" ? (
                <VocabSection content={content} fmt={fmt} />
              ) : section.type === "self-assessment" ? (
                <SelfAssessmentSection content={content} fmt={fmt} />
              ) : section.type === "self-reflection" ? (
                <SelfReflectionSection content={content} fmt={fmt} />
              ) : section.type === "word-bank" ? (
                <WordBankSection content={content} fmt={fmt} />
              ) : section.type === "sentence-starters" ? (
                <SentenceStartersSection content={content} fmt={fmt} />
              ) : section.type === "reminder-box" ? (
                <ReminderBoxSection content={content} fmt={fmt} />
              ) : section.type === "word-problems" ? (
                <WordProblemsSection content={content} fmt={fmt} />
              ) : section.type === "questions" ? (
                // Questions sections always go through formatContent to properly render math
                <div>{formatContent(content, fmt)}</div>
              ) : content && (content.includes('class="katex"') || content.includes('&lt;span class=&quot;katex&quot;')) ? (
                <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: fmt.lineHeight }} dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                <div>{formatContent(content, fmt)}</div>
              )}

              {/* Answer lines for practice sections */}
              {!isTeacherSection && (section.type === "independent" || section.type === "guided") && (
                <div style={{ marginTop: "12px", borderTop: "1px dashed #e5e7eb", paddingTop: "10px" }}>
                  <div style={{ fontSize: `${fmt.fontSize - 2}px`, color: "#9ca3af", marginBottom: "6px", fontFamily: fmt.fontFamily }}>Working space:</div>
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} style={{ borderBottom: "1px solid #d1d5db", height: "28px", marginBottom: "6px" }} />
                  ))}
                </div>
              )}
              {/* Answer lines for challenge section */}
              {!isTeacherSection && section.type === "challenge" && (
                <div style={{ marginTop: "12px", borderTop: "1px dashed #e5e7eb", paddingTop: "10px" }}>
                  <div style={{ fontSize: `${fmt.fontSize - 2}px`, color: "#9ca3af", marginBottom: "6px", fontFamily: fmt.fontFamily }}>Show your working:</div>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} style={{ borderBottom: "1px solid #d1d5db", height: "28px", marginBottom: "6px" }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Footer ── */}
      <div className="ws-footer" style={{
        marginTop: "24px",
        padding: "10px 16px",
        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "10px",
        color: "rgba(255,255,255,0.85)",
        fontFamily: fmt.fontFamily,
      }}>
        <span style={{ fontWeight: 600 }}>Generated by Adaptly</span>
        <span>{worksheet.metadata.topic ? `${worksheet.metadata.topic} | ` : ""}{worksheet.metadata.subject ? worksheet.metadata.subject.charAt(0).toUpperCase() + worksheet.metadata.subject.slice(1) : ""} | {worksheet.metadata.yearGroup}</span>
        <span>{new Date().toLocaleDateString("en-GB")} | adaptly.co.uk</span>
      </div>
    </div>
  );
});

WorksheetRenderer.displayName = "WorksheetRenderer";
export default WorksheetRenderer;
