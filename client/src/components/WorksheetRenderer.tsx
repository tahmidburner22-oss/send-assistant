/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary — unauthorised copying, modification, or distribution is strictly prohibited.
 *
 * WorksheetRenderer — Professional, print-ready worksheet display component.
 * Matches PDF output pixel-for-pixel using CSS @media print.
 * Applies SEND-specific formatting (font, line-height, spacing) per COBS Handbook.
 * Supports KaTeX math rendering for proper fractions, symbols, and expressions.
 */
import React, { forwardRef, useState, useCallback } from "react";
import { getSendFormatting } from "@/lib/send-data";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Render a string that may contain LaTeX math expressions (\(...\) or \[...\]).
 * Falls back to plain text if KaTeX fails.
 * Also strips any remaining raw ** asterisks.
 */
export function renderMath(text: string | any): string {
  // Robust type guard: normalize any non-string input to a string
  if (text === null || text === undefined) return "";
  if (typeof text !== 'string') {
    if (Array.isArray(text)) {
      text = (text as any[]).map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          const q = item.q || item.question || item.text || item.content || '';
          const a = item.a || item.answer || '';
          if (q && a) return `${q}\n   Answer: ${a}`;
          if (q) return q;
          return JSON.stringify(item);
        }
        return String(item);
      }).join('\n\n');
    } else if (typeof text === 'object') {
      const c = text as any;
      const q = c.q || c.question || c.text || c.content || '';
      const a = c.a || c.answer || '';
      if (q && a) text = `${q}\n   Answer: ${a}`;
      else if (q) text = q;
      else { try { text = JSON.stringify(c); } catch { text = String(c); } }
    } else {
      text = String(text);
    }
  }
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

  // ── Step 0-pre-0: Fix tab/form-feed characters that are corrupted LaTeX commands ─
  // When JSON.parse converts \f → form feed (\x0c) or \t → tab (\x09) before a
  // LaTeX command suffix, we restore the backslash. E.g. \x09imes → \times.
  // This is a safety net in case parseWithFixes didn't catch all cases.
  // Replace tab (\x09) + letter sequence that forms a LaTeX command
  result = result.replace(/\x09([a-zA-Z]+)/g, (match, suffix) => {
    // Check if \t + suffix is a known LaTeX command
    const candidate = 't' + suffix;
    const knownCommands = ['times', 'text', 'theta', 'tau', 'tilde', 'top', 'triangle',
      'tag', 'to', 'tfrac', 'textbf', 'textit', 'texttt', 'textrm', 'textsf'];
    if (knownCommands.some(cmd => candidate.startsWith(cmd))) {
      return '\\' + candidate;
    }
    return match; // Keep as-is if not a known LaTeX command
  });
  // Replace form feed (\x0c) + letter sequence that forms a LaTeX command
  result = result.replace(/\x0c([a-zA-Z]+)/g, (match, suffix) => {
    const candidate = 'f' + suffix;
    const knownCommands = ['frac', 'frown', 'flat', 'forall', 'fbox', 'footnotesize'];
    if (knownCommands.some(cmd => candidate.startsWith(cmd))) {
      return '\\' + candidate;
    }
    return match;
  });

  // ── Step 0-pre-1: Strip Unicode combining characters that corrupt LaTeX blanks ─
  // The AI sometimes generates answer blanks like \dfrac{_̲̲̲__}{___} where U+0332
  // (combining low line / combining underline) is inserted by the model. Strip them
  // before HTML processing so the style= regex can match cleanly.
  result = result.replace(/\u0332/g, '');

  // ── Step 0-pre: Strip raw HTML injected by AI (except safe inline tags) ─────
  // The AI sometimes generates content with HTML tags like <span style="color:#cc0000">
  // directly in section content strings. These must be stripped before any other
  // processing to prevent raw attribute text from appearing in rendered output.
  //
  // Pattern 1: Orphaned HTML attribute fragments — e.g. style="color:#cc0000">text
  // This happens when JSON parsing strips the opening < from <span style=...>
  // leaving just: style="color:#cc0000">text
  result = result.replace(/["']?\s*\bstyle\s*=\s*["'][^"']*["']\s*>/g, '');
  // Also collapse duplicate \dfrac{}{} runs that appear after HTML fragment stripping.
  // e.g. \dfrac{__}{___}\dfrac{__}{___}\dfrac{___}{___} → \dfrac{___}{___}
  result = result.replace(/(\\dfrac\{[^}]*\}\{[^}]*\}){2,}/g, (match: string) => {
    const parts = match.match(/\\dfrac\{[^}]*\}\{[^}]*\}/g);
    return parts ? parts[parts.length - 1] : match;
  });
  // Strip orphaned class= attribute fragments, but NOT class="katex*" (used by KaTeX)
  // KaTeX uses class names like: katex, katex-html, katex-display, katex-mathml, etc.
  result = result.replace(/\bclass\s*=\s*["'](?!katex)[^"']*["']\s*>/g, '');
  // Pattern 2: Complete HTML tags that are NOT KaTeX spans and NOT safe inline tags
  // Safe inline tags we keep: <sup>, <sub>, <strong>, <em>, <b>, <i>, <br>, <br/>
  // We strip: <span>, <div>, <p>, <a>, <font>, and any other block/inline HTML
  // IMPORTANT: We must NOT strip <span class="katex"> — those are added by KaTeX
  // and are handled separately. At this point in the function, KaTeX hasn't run yet
  // so any <span> here is from the AI, not KaTeX.
  result = result.replace(/<\/?(?:span|div|p|a|font|section|article|header|footer|nav|ul|ol|li|table|tr|td|th|thead|tbody|tfoot|blockquote|pre|code|mark|small|del|ins|u|s|abbr|cite|dfn|kbd|samp|var|time|details|summary|form|input|select|textarea|button|label|fieldset|legend|canvas|script|style|link|meta)[^>]*>/gi, '');

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

  // 2. After JSON parsing \text → \t (tab) + ext: handle tab+ext{...} ONLY (with braces)
  // IMPORTANT: Only match \text{...} patterns (with braces), NOT plain English words like 'external'
  result = result.replace(/\t(ext\{[^{}]*\})/g, (_, m) => m.replace(/^ext\{([^{}]*)\}$/, '$1'));
  // bare ext{...} without preceding tab (LaTeX \text{} that survived with braces)
  result = result.replace(/\bext\{([^{}]*)\}/g, '$1');
  // DO NOT strip 'ext' from plain words like 'external', 'extend', 'extra', etc.

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
    const converted = (firstElem + rest).replace(/([A-Z][a-z]?)([0-9]+)/g, (_: string, el: string, num: string) => {
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
  // "proportional to" → ∝ — REMOVED: too aggressive, turns 'y is proportional to x' into 'y is ∝ x'
  // which reads poorly in plain English sentences. The AI should use \propto in LaTeX instead.
  // result = result.replace(/\bproportional to\b/gi, '∝');
  // "therefore" → ∴ — only replace when used as a logical/mathematical connector
  // Keep it as-is in plain English sentences (e.g. "Therefore, you should...")
  // We only replace when followed by a mathematical expression or at start of a proof step
  // REMOVED: too aggressive, replaces 'therefore' in plain English teacher notes
  // result = result.replace(/\btherefore\b/gi, '∴');
  // "because" (in maths context) → ∵ — skip, too ambiguous
  // "perpendicular" → ⊥ — REMOVED: too aggressive, turns 'perpendicular bisector' into '⊥ bisector'
  // result = result.replace(/\bperpendicular\b/gi, '⊥');
  // "parallel to" → ∥ (keep — specific enough phrase)
  result = result.replace(/\bparallel to\b/gi, '∥');
  // "approximately equal to" → ≈ (keep — specific enough phrase)
  result = result.replace(/\bapproximately equal to\b/gi, '≈');
  // "approx" → ≈ — REMOVED: too aggressive, replaces 'Approx 10 students' in plain English
  // result = result.replace(/\bapprox\.?\b/gi, '≈');

  // "pi" as a standalone word → π (only lowercase to avoid replacing 'Pi' at sentence start)
  result = result.replace(/\bpi\b/g, 'π');

  // "infinity" → ∞ — REMOVED: too aggressive, replaces 'infinity' in plain English
  // result = result.replace(/\binfinity\b/gi, '∞');

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
  result = result.replace(/\\\((\s*.+?\s*)\\\)/g, (_, expr) => {
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
    result = applyToPlainText(result, s => s.replace(/\qrt\{([^{}]*)\}/g, (_, expr) => {
      try { return katex.renderToString(`\sqrt{${expr}}`, { displayMode: false, throwOnError: false }); }
      catch { return `√${expr}`; }
    }));

    // Brace-depth-aware helper for \frac, \dfrac, \sqrt with nested braces
    const extractBalancedBrace = (str: string, start: number): { content: string; end: number } | null => {
      if (str[start] !== '{') return null;
      let depth = 0, i = start;
      while (i < str.length) {
        if (str[i] === '{') depth++;
        else if (str[i] === '}') { depth--; if (depth === 0) return { content: str.substring(start + 1, i), end: i + 1 }; }
        i++;
      }
      return null;
    };
    const renderLatexWithNestedBraces = (s: string, cmd: string, render: (args: string[]) => string, argCount: number): string => {
      let out = '';
      let i = 0;
      while (i < s.length) {
        const idx = s.indexOf(cmd + '{', i);
        if (idx === -1) { out += s.substring(i); break; }
        const args: string[] = [];
        let pos = idx + cmd.length;
        let valid = true;
        for (let a = 0; a < argCount; a++) {
          const grp = extractBalancedBrace(s, pos);
          if (!grp) { valid = false; break; }
          args.push(grp.content);
          pos = grp.end;
        }
        if (!valid) { out += s.substring(i, idx + cmd.length + 1); i = idx + cmd.length + 1; continue; }
        out += s.substring(i, idx);
        out += render(args);
        i = pos;
      }
      return out;
    };

    // \frac{num}{den} → KaTeX fraction (handles nested braces)
    result = applyToPlainText(result, s => renderLatexWithNestedBraces(s, '\\frac', ([num, den]) => {
      try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
      catch { return `${num}/${den}`; }
    }, 2));
    // \dfrac{num}{den} → KaTeX fraction (handles nested braces)
    result = applyToPlainText(result, s => renderLatexWithNestedBraces(s, '\\dfrac', ([num, den]) => {
      try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
      catch { return `${num}/${den}`; }
    }, 2));
    // \sqrt{expr} → KaTeX square root (handles nested braces like \sqrt{5^{2} + 12^{2}})
    result = applyToPlainText(result, s => renderLatexWithNestedBraces(s, '\\sqrt', ([expr]) => {
      try { return katex.renderToString(`\\sqrt{${expr}}`, { displayMode: false, throwOnError: false }); }
      catch { return `√${expr}`; }
    }, 1));
    // \sqrt[n]{expr} → KaTeX nth root (brace-depth-aware)
    result = applyToPlainText(result, s => {
      let out = '';
      let i = 0;
      while (i < s.length) {
        const idx = s.indexOf('\\sqrt[', i);
        if (idx === -1) { out += s.substring(i); break; }
        const closeBracket = s.indexOf(']', idx + 6);
        if (closeBracket === -1) { out += s.substring(i, idx + 6); i = idx + 6; continue; }
        const n = s.substring(idx + 6, closeBracket);
        const grp = extractBalancedBrace(s, closeBracket + 1);
        if (!grp) { out += s.substring(i, closeBracket + 1); i = closeBracket + 1; continue; }
        out += s.substring(i, idx);
        try { out += katex.renderToString(`\\sqrt[${n}]{${grp.content}}`, { displayMode: false, throwOnError: false }); }
        catch { out += `${n}√${grp.content}`; }
        i = grp.end;
      }
      return out;
    });
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

  // ── Step 1.5: Deduplicate AI double-rendering of superscripts ─────────────
  // The AI often outputs both Unicode superscript AND raw text fallback:
  // e.g. "a²a2" (Unicode ² followed by plain "a2"), "b²b2", "c²c2"
  // Also handles cubed: "a³a3", "b³b3"
  // Strip the redundant plain-text fallback, keeping only the Unicode superscript.
  result = result.replace(/([A-Za-z])\u00b2\1(2)\b/g, '$1\u00b2');
  result = result.replace(/([A-Za-z])\u00b3\1(3)\b/g, '$1\u00b3');
  // Also handle numeric bases: "5²52" → "5²", "8²82" → "8²"
  result = result.replace(/(\d)\u00b2\1(2)\b/g, '$1\u00b2');
  result = result.replace(/(\d)\u00b3\1(3)\b/g, '$1\u00b3');
  // Generic pattern: any char + superscript n + same char + n digit
  // e.g. "x²x2" → "x²", handles cases where base is repeated
  result = result.replace(/([A-Za-z0-9])([\u00b2\u00b3\u00b9\u2074\u2075\u2076\u2077\u2078\u2079])\1(\d)/g, (match, base, sup, digit) => {
    const supMap: Record<string, string> = { '\u00b9': '1', '\u00b2': '2', '\u00b3': '3', '\u2074': '4', '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9' };
    if (supMap[sup] === digit) return base + sup; // Strip the duplicate
    return match; // Not a duplicate — keep as-is
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

  // 0. Spaced fractions: "5 / 7", "13 / 7", "x / 2" — AI often generates fractions with spaces around the slash.
  //    Must run BEFORE the no-space patterns to avoid double-processing.
  //    Pattern A: (expr) / (expr) with spaces around slash
  result = result.replace(/\(([^()]+)\)\s+\/\s+\(([^()]+)\)/g, (full, num, den) => {
    if (hasHTML(num) || hasHTML(den)) return full;
    try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
    catch { return full; }
  });
  //    Pattern B: token / token with spaces (e.g. "5 / 7", "x / 2", "-21 / 7")
  result = result.replace(/(-?[A-Za-z0-9]+)\s+\/\s+([A-Za-z0-9]+)/g, (full, num, den) => {
    if (hasHTML(num) || hasHTML(den)) return full;
    // Skip year ranges (e.g. 2023 / 24)
    if (/^\d{4}$/.test(num) || /^\d{4}$/.test(den)) return full;
    if (/^\d{4,}$/.test(num) || /^\d{4,}$/.test(den)) return full;
    // Skip if both are multi-letter words (e.g. "Teacher / Student", "and / or")
    const isNum2 = (s: string) => /^-?\d+$/.test(s);
    const isVar1 = (s: string) => /^[A-Za-z]$/.test(s);
    const isVar2 = (s: string) => /^[A-Za-z]{1,2}$/.test(s);
    if (!isNum2(num) && !isNum2(den) && !isVar1(num) && !isVar1(den) && !isVar2(num) && !isVar2(den)) return full;
    try { return katex.renderToString(`\\dfrac{${num}}{${den}}`, { displayMode: false, throwOnError: false }); }
    catch { return full; }
  });

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
        // Only render as a fraction when the pair is unambiguously mathematical.
        // This avoids converting prose such as Great/OK or minutes/hour and keeps
        // answer-style inline text like 19/7 readable unless it is a deliberate
        // symbolic fraction pattern.
        const isNumeric = (s: string) => /^\d+$/.test(s);
        const isSingleVar = (s: string) => /^[A-Za-z]$/.test(s);
        const isSimpleAlgebra = (s: string) => /^[0-9]*[A-Za-z]$/.test(s); // x, y, 2x, 3n
        const bothNumeric = isNumeric(num) && isNumeric(den);
        const bothSimpleAlgebra = isSimpleAlgebra(num) && isSimpleAlgebra(den);
        const oneSideSingleVarAndOtherNumeric = (isSingleVar(num) && isNumeric(den)) || (isNumeric(num) && isSingleVar(den));
        const looksMathy = bothNumeric || bothSimpleAlgebra || oneSideSingleVarAndOtherNumeric;
        if (!looksMathy) {
          return full;
        }
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
  // Answer box controls (edit mode)
  answerBoxSizes?: Record<number, number>; // section index → number of lines (0 = removed)
  onAnswerBoxSizeChange?: (sectionIndex: number, lines: number) => void;
  onAnswerBoxRemove?: (sectionIndex: number) => void;
}

// Section type → colour config (TES-style: white backgrounds, single purple/blue border accent)
const SECTION_STYLES: Record<string, { border: string; bg: string; badge: string; badgeBg: string; icon: string; label: string }> = {
  "objective":     { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Learning Objectives" },
  "success":       { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Success Criteria" },
  "vocabulary":    { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Key Vocabulary" },
  "starter":       { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Starter Activity" },
  "example":       { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Worked Example" },
  "guided":        { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Foundation" },
  "independent":   { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Core Practice" },
  "challenge":     { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Stretch & Challenge" },
  "word-bank":     { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Word Bank" },
  "sentence-starters": { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Sentence Starters" },
  "self-assessment": { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Self Assessment" },
  "self-reflection": { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "How Did I Do?" },
  "diagram":       { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Diagram" },
  "answers":       { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Answers" },
  "questions":     { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Exam Questions" },
  "mark-scheme":   { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Mark Scheme" },
  "teacher-notes": { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Teacher Notes" },
  "send-support":  { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "SEND Support" },
  "reminder-box":  { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Reminder Box" },
  "word-problems": { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Word Problems" },
  "misconceptions":{ border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "Common Misconceptions" },
  "reading":        { border: "#475569", bg: "#f8fafc", badge: "#475569", badgeBg: "#f1f5f9", icon: "", label: "Reading Passage" },
  "passage":        { border: "#475569", bg: "#f8fafc", badge: "#475569", badgeBg: "#f1f5f9", icon: "", label: "Reading Passage" },
  "source-text":    { border: "#475569", bg: "#f8fafc", badge: "#475569", badgeBg: "#f1f5f9", icon: "", label: "Source Text" },
  "comprehension":  { border: "#475569", bg: "#f8fafc", badge: "#475569", badgeBg: "#f1f5f9", icon: "", label: "Comprehension" },
  "default":       { border: "#5b21b6", bg: "#ffffff", badge: "#5b21b6", badgeBg: "#ede9fe", icon: "", label: "" },
};

function getSectionStyle(type: string) {
  return SECTION_STYLES[type] || SECTION_STYLES["default"];
}

function stripLatexFromPlainText(text: string): string {
  if (!text) return text;
  let out = text
    .replace(/\\\(([^)]*)\\\)/g, '$1')
    .replace(/\\\[([^\]]*)\\\]/g, '$1');
  out = out.replace(/\\d?frac\{([^}]*)\}\{([^}]*)\}/g, '$1 / $2');
  out = out.replace(/\\text\{([^}]*)\}/g, '$1');
  out = out.replace(/\\(times|div|cdot|pm|leq|geq|neq|approx|sqrt|pi)\b/g, (_, cmd) => {
    const s: Record<string,string> = { times:'×', div:'÷', cdot:'·', pm:'±', leq:'≤', geq:'≥', neq:'≠', approx:'≈', sqrt:'√', pi:'π' };
    return s[cmd] || cmd;
  });
  out = out.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1');
  out = out.replace(/\\[a-zA-Z]+/g, '');
  out = out.replace(/[{}]/g, '');
  return out.trim();
}

function formatContent(content: string | any, fmt: ReturnType<typeof getSendFormatting>): React.ReactNode {
  // Robust type guard: normalize any non-string input
  if (content === null || content === undefined) return null;
  if (typeof content !== 'string') {
    if (Array.isArray(content)) {
      content = (content as any[]).map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          const q = item.q || item.question || item.text || item.content || '';
          const a = item.a || item.answer || '';
          const marks = item.marks ? ` [${item.marks} mark${item.marks > 1 ? 's' : ''}]` : '';
          if (q && a) return `${q}${marks}\n   Answer: ${a}`;
          if (q) return `${q}${marks}`;
          return JSON.stringify(item);
        }
        return String(item);
      }).join('\n\n');
    } else if (typeof content === 'object') {
      const c = content as any;
      const q = c.q || c.question || c.text || c.content || '';
      const a = c.a || c.answer || '';
      if (q && a) content = `${q}\n   Answer: ${a}`;
      else if (q) content = q;
      else { try { content = JSON.stringify(c); } catch { content = String(c); } }
    } else {
      content = String(content);
    }
  }
  if (!content) return null;
  const { fontSize: textSize, lineHeight, letterSpacing, wordSpacing, paragraphSpacing, fontFamily } = fmt;
  // Pre-process: split concatenated numbered items onto separate lines.
  // The AI often outputs questions as a single line: "1. Q1 . 2. Q2 . 3. Q3"
  // or with commas: "1. Q1, 2. Q2, 3. Q3"
  // We split on any separator (comma, period+space, semicolon) before a number+period/paren pattern.
  let preprocessed = content
    // Split on ". N." pattern (period-space before numbered item)
    .replace(/\.\s+(\d+[a-z]?[.)\s]\s*)/g, '.\n$1')
    // Split on ", N." pattern (comma before numbered item)
    .replace(/(,\s*)(\d+[a-z]?[.)\s]\s*)/g, '\n$2')
    // Split on "; N." pattern (semicolon before numbered item)
    .replace(/(;\s*)(\d+[a-z]?[.)\s]\s*)/g, '\n$2');
  const lines = preprocessed.split("\n");
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
    let trimmed = line.trim();
    // Clean up lines that start with a lone period/dot (artifact of numbering removal)
    trimmed = trimmed.replace(/^\. /, '');

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

    // Numbered list — strip the number prefix and render content only (numbering removed per user request)
    const numberedMatch = trimmed.match(/^(\d+[a-z]?[.)\s]\s*)(.+)$/);
    if (numberedMatch) {
      elements.push(
        <p key={idx} style={{ margin: `0 0 ${paragraphSpacing} 0`, fontSize: `${textSize}px`, lineHeight, color: "#1f2937", fontFamily, letterSpacing, wordSpacing }}>
          <span dangerouslySetInnerHTML={{ __html: renderMath(numberedMatch[2]) }} />
        </p>
      );
      return;
    }

    // Hint lines are not shown on worksheets — skip them
    if (trimmed.startsWith("Hint:")) {
      return;
    }

    // Step line
    if (trimmed.match(/^Step \d+:/)) {
      elements.push(
        <div key={idx} style={{ fontWeight: 700, color: "#5b21b6", marginTop: "8px", marginBottom: "2px", fontSize: `${textSize}px`, fontFamily }}>
          <span dangerouslySetInnerHTML={{ __html: renderMath(trimmed) }} />
        </div>
      );
      return;
    }

    // Mark allocation — render question with mark badge AND a mark-weighted answer box
    const markMatch = trimmed.match(/^(.+?)(\[(\d+) marks?\])(.*)$/i);
    if (markMatch) {
      const markCount = parseInt(markMatch[3], 10);
      // Determine answer box height based on mark count
      // 1 mark → 1 line, 2-3 marks → 3 lines, 4+ marks → 6 lines
      const answerLines = markCount <= 1 ? 1 : markCount <= 3 ? 3 : 6;
      elements.push(
        <div key={idx} style={{ marginBottom: paragraphSpacing }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: `${textSize}px`, lineHeight, letterSpacing, wordSpacing, fontFamily, marginBottom: "6px" }}>
            <span dangerouslySetInnerHTML={{ __html: renderMath(markMatch[1]) }} />
            <span style={{ background: "#374151", color: "white", fontSize: `${textSize - 3}px`, padding: "1px 6px", borderRadius: "4px", whiteSpace: "nowrap", marginLeft: "8px", fontWeight: 700, flexShrink: 0 }}>{markMatch[2]}</span>
          </div>
          {/* Mark-weighted answer box */}
          <div style={{ border: "1px solid #d1d5db", borderRadius: "4px", padding: "4px 8px", background: "#fafafa" }}>
            {Array.from({ length: answerLines }).map((_, li) => (
              <div key={li} style={{ borderBottom: li < answerLines - 1 ? "1px solid #e5e7eb" : "none", height: "28px" }} />
            ))}
          </div>
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

function VocabSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
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
        <div key={i} style={{ background: overlayColor, border: "1px solid #5b21b6", borderRadius: "4px", padding: "8px 10px", display: "flex", flexDirection: "column", gap: "4px" }}>
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
              {["R", "A", "G"].map((label, ci) => (
                <div key={ci} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: ci === 0 ? "#dc2626" : ci === 1 ? "#d97706" : "#16a34a" }}>
                  {label}
                </div>
              ))}
            </div>
            <span style={{ fontSize: `${textSize}px`, color: "#374151", fontFamily, lineHeight }} dangerouslySetInnerHTML={{ __html: "I can " + stripLatexFromPlainText(clean) }} />
          </div>
        );
      })}
      <div style={{ marginTop: "8px", fontSize: `${textSize - 2}px`, color: "#6b7280", fontStyle: "italic", fontFamily }}>
        R = Not yet &nbsp;|&nbsp; A = Getting there &nbsp;|&nbsp; G = I've got it!
      </div>
    </div>
  );
}

/**
 * Self-Reflection section — shown at the end of every worksheet.
 * "I can" statements with traffic-light circles + an open reflection question.
 */
function SelfReflectionSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
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
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #ddd6fe" }}>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              {["R", "A", "G"].map((label, ci) => (
                <div key={ci} style={{ width: "26px", height: "26px", borderRadius: "50%", border: "2px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: ci === 0 ? "#dc2626" : ci === 1 ? "#d97706" : "#16a34a" }}>
                  {label}
                </div>
              ))}
            </div>
            <span style={{ fontSize: `${textSize}px`, color: "#374151", fontFamily, lineHeight }} dangerouslySetInnerHTML={{ __html: "I can " + stripLatexFromPlainText(clean) }} />
          </div>
        );
      })}
      <div style={{ marginTop: "6px", fontSize: `${textSize - 2}px`, color: "#5b21b6", fontStyle: "italic", fontFamily }}>
        R = Not yet &nbsp;|&nbsp; A = Getting there &nbsp;|&nbsp; G = I've got it!
      </div>
      {/* Open reflection question */}
      {openQ && (
        <div style={{ marginTop: "14px", background: overlayColor, border: "1.5px solid #5b21b6", borderRadius: "4px", padding: "10px 12px" }}>
          <div style={{ fontSize: `${textSize - 1}px`, fontWeight: 600, color: "#5b21b6", fontFamily, marginBottom: "6px" }} dangerouslySetInnerHTML={{ __html: renderMath(openQ) }} />
          <div style={{ borderBottom: "1px solid #d1d5db", height: "28px", marginBottom: "6px" }} />
          <div style={{ borderBottom: "1px solid #d1d5db", height: "28px" }} />
        </div>
      )}
    </div>
  );
}

function WordBankSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
  const { fontSize: textSize, fontFamily } = fmt;
  const words = content.split(/[\n,|]/).map(w => w.trim()).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {words.map((word, i) => (
        <span key={i} style={{ background: overlayColor, color: "#5b21b6", padding: "4px 10px", borderRadius: "4px", fontSize: `${textSize - 1}px`, fontWeight: 600, border: "1.5px solid #5b21b6", fontFamily }}>
          <span dangerouslySetInnerHTML={{ __html: renderMath(word) }} />
        </span>
      ))}
    </div>
  );
}

function SentenceStartersSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const starters = content.split("\n").filter(l => l.trim()).map(l => l.replace(/^[•\-\*\d.)\s]+/, "").trim());
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px" }}>
      {starters.map((s, i) => (
        <div key={i} style={{ background: overlayColor, border: "1px solid #5b21b6", borderRadius: "4px", padding: "6px 10px", fontSize: `${textSize - 1}px`, color: "#5b21b6", fontStyle: "italic", fontFamily, lineHeight }}>
          "{s}..."
        </div>
      ))}
    </div>
  );
}

function ReminderBoxSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const lines = content.split("\n").filter(l => l.trim());
  const steps = lines.filter(l => /^Step\s*\d+/i.test(l.trim()));
  const otherLines = lines.filter(l => !/^Step\s*\d+/i.test(l.trim()));
  return (
    <div style={{ background: overlayColor, border: "1.5px solid #5b21b6", borderRadius: "4px", padding: "10px 12px" }}>
      <div style={{ fontSize: `${textSize - 1}px`, fontWeight: 700, color: "#5b21b6", marginBottom: "10px", fontFamily, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Keep this in mind while you work:
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
                  background: "#ede9fe",
                  color: "#5b21b6",
                  borderRadius: "4px",
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

function WordProblemsSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  // Pre-process: split concatenated numbered problems onto separate lines
  // e.g. "1. Problem one . 2. Problem two" → separate lines
  const preprocessed = content
    .replace(/\.\s+(\d+[a-z]?[.)\s]\s*)/g, '.\n$1')
    .replace(/(,\s*)(\d+[a-z]?[.)\s]\s*)/g, '\n$2')
    .replace(/(;\s*)(\d+[a-z]?[.)\s]\s*)/g, '\n$2');
  // Split into individual problems by numbered lines or double newlines
  const lines = preprocessed.split("\n");
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
          background: overlayColor,
          border: "1.5px solid #5b21b6",
          borderRadius: "4px",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: `${textSize - 2}px`, fontWeight: 700, color: "#5b21b6", marginBottom: "6px", fontFamily, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Problem {i + 1}
          </div>
          {problem.map((line, li) => (
            <div key={li} style={{ fontSize: `${textSize}px`, color: "#1f2937", fontFamily, lineHeight, marginBottom: "4px" }}
              dangerouslySetInnerHTML={{ __html: renderMath(line.replace(/^\d+[.)\s]+/, "")) }} />
          ))}
          <div style={{ marginTop: "10px", borderTop: "1px dashed #ddd6fe", paddingTop: "8px" }}>
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

const WorksheetRenderer = forwardRef<HTMLDivElement, WorksheetRendererProps>(function WorksheetRendererInner(
  {
  worksheet,
  viewMode,
  textSize,
  overlayColor,
  editedSections = {},
  onSectionClick,
  editMode = false,
  schoolName,
  teacherName,
  answerBoxSizes = {},
  onAnswerBoxSizeChange,
  onAnswerBoxRemove,
  }: WorksheetRendererProps, ref: React.Ref<HTMLDivElement>) {
  const isTeacherView = viewMode === "teacher";

  // Resolve SEND need ID from metadata (may be stored as sendNeedId or inferred from sendNeed label)
  const sendNeedId = worksheet.metadata.sendNeedId || worksheet.metadata.sendNeed;
  const fmt = getSendFormatting(sendNeedId, textSize);

  // Default answer box line counts per section type
  const DEFAULT_ANSWER_LINES: Record<string, number> = {
    guided: 4,
    independent: 4,
    challenge: 6,
  };

  // Helper: get effective line count for a section's answer box
  const getAnswerLines = (sectionIndex: number, sectionType: string): number => {
    if (sectionIndex in answerBoxSizes) return answerBoxSizes[sectionIndex];
    return DEFAULT_ANSWER_LINES[sectionType] ?? 4;
  };


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
        marginBottom: "10px",
        borderRadius: "4px",
        overflow: "hidden",
        border: "1.5px solid #5b21b6",
      }}>
        {/* Title bar — TES-style: solid purple bar, title same height as Name/Date row */}
        <div style={{
          background: "#5b21b6",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}>
          {/* Left: Adaptly logo/brand mark */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "6px",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: "14px", color: "white", fontFamily: fmt.fontFamily,
            }}>A</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", fontFamily: fmt.fontFamily, lineHeight: "1.2" }}>
              <div style={{ fontWeight: 700 }}>{schoolName || "Adaptly"}</div>
              <div>SEND-Informed Learning Resource</div>
            </div>
          </div>
          {/* Centre: Title */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: `${fmt.fontSize + 1}px`, color: "white", fontFamily: fmt.fontFamily, letterSpacing: fmt.letterSpacing, lineHeight: "1.3" }}>
              {worksheet.title}
            </div>
            {worksheet.subtitle && (
              <div style={{ fontSize: `${fmt.fontSize - 3}px`, color: "rgba(255,255,255,0.8)", marginTop: "1px", fontFamily: fmt.fontFamily }}>{worksheet.subtitle}</div>
            )}
          </div>
          {/* Right: Name/Date/Class fields inline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", flexShrink: 0 }}>
            {[
              { label: "Name", value: "" },
              { label: "Date", value: new Date().toLocaleDateString("en-GB") },
              { label: "Class", value: "" },
              ...(teacherName ? [{ label: "Teacher", value: teacherName }] : []),
            ].map((field, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.85)", fontFamily: fmt.fontFamily, minWidth: "32px" }}>{field.label}:</span>
                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.6)", minWidth: "70px", height: "14px", display: "flex", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.9)", paddingBottom: "1px", fontFamily: fmt.fontFamily }}>{field.value}</span>
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

        // Normalize content: ensure it's always a string to prevent .replace() crashes
        let rawContent = editedSections[i] !== undefined ? editedSections[i] : section.content;
        if (rawContent !== null && rawContent !== undefined && typeof rawContent !== 'string') {
          if (Array.isArray(rawContent)) {
            rawContent = rawContent.map((item: any) => {
              if (typeof item === 'string') return item;
              if (typeof item === 'object' && item !== null) {
                const q = item.q || item.question || item.text || item.content || '';
                const a = item.a || item.answer || '';
                const marks = item.marks ? ` [${item.marks} mark${item.marks > 1 ? 's' : ''}]` : '';
                // Only embed answers when in teacher view — student view shows blank answer lines
                if (q && a && isTeacherView) return `${q}${marks}\n   Answer: ${a}`;
                if (q) return `${q}${marks}`;
                return JSON.stringify(item);
              }
              return String(item);
            }).join('\n\n');
          } else if (typeof rawContent === 'object') {
            const c = rawContent as any;
            const q = c.q || c.question || c.text || c.content || '';
            const a = c.a || c.answer || '';
            // Only embed answers when in teacher view
            if (q && a && isTeacherView) rawContent = `${q}\n   Answer: ${a}`;
            else if (q) rawContent = q;
            else { try { rawContent = JSON.stringify(c); } catch { rawContent = String(c); } }
          } else {
            rawContent = String(rawContent);
          }
        }
        // In student view, strip any "Answer: ..." lines that the AI embedded in the content string.
        // These appear as plain text lines starting with "Answer:" in student-facing sections.
        let content = rawContent as string;
        if (!isTeacherView && typeof content === 'string') {
          content = content
            .split('\n')
            .filter(line => !/^\s*Answer\s*:/i.test(line.trim()))
            .join('\n');
        }
        const style = getSectionStyle(section.type);
        // Teacher-only sections: mark-scheme, teacher-notes, answers, and any explicitly flagged teacherOnly
        const isTeacherSection = section.teacherOnly || section.type === "teacher-notes" || section.type === "mark-scheme" || section.type === "answers";

        return (
          <div
            key={i}
            className={`ws-section ws-section-${section.type}${isTeacherSection ? " ws-teacher-section" : ""}`}
            onClick={() => editMode && onSectionClick?.(i)}
            style={{
              marginBottom: "10px",
              borderRadius: "4px",
              border: `1.5px solid ${style.border}`,
              background: overlayColor || "#ffffff",
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
              padding: "6px 10px",
              borderBottom: `1px solid ${style.border}`,
              background: `${style.border}12`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {style.icon && <span style={{ fontSize: "16px" }}>{style.icon}</span>}
                <span style={{ fontWeight: 700, fontSize: `${fmt.fontSize + 1}px`, color: style.border, fontFamily: fmt.fontFamily }}>
                  {(typeof section.title === 'string' ? section.title : String(section.title || '')).replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim()}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {isTeacherSection && (
                  <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 700 }}>
                    TEACHER ONLY
                  </span>
                )}
                {section.type === "guided" && (
                  <span style={{ background: style.badgeBg, color: style.badge, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    Foundation
                  </span>
                )}
                {section.type === "independent" && (
                  <span style={{ background: style.badgeBg, color: style.badge, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    Core
                  </span>
                )}
                {section.type === "challenge" && (
                  <span style={{ background: style.badgeBg, color: style.badge, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    Extension
                  </span>
                )}
                {section.type === "reminder-box" && (
                  <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    3 Key Steps
                  </span>
                )}
                {section.type === "word-problems" && (
                  <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: 600 }}>
                    Real Life
                  </span>
                )}
              </div>
            </div>

            {/* Section content */}
            <div style={{ padding: "8px 10px" }}>
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
                <VocabSection content={content} fmt={fmt} overlayColor={overlayColor} />
              ) : section.type === "self-assessment" ? (
                <SelfAssessmentSection content={content} fmt={fmt} />
              ) : section.type === "self-reflection" ? (
                <SelfReflectionSection content={content} fmt={fmt} overlayColor={overlayColor} />
              ) : (section.type === "word-bank" || section.type === "wordbank") ? (
                <WordBankSection content={content} fmt={fmt} overlayColor={overlayColor} />
              ) : section.type === "sentence-starters" ? (
                <SentenceStartersSection content={content} fmt={fmt} overlayColor={overlayColor} />
              ) : section.type === "reminder-box" ? (
                <ReminderBoxSection content={content} fmt={fmt} overlayColor={overlayColor} />
              ) : section.type === "word-problems" ? (
                <WordProblemsSection content={content} fmt={fmt} overlayColor={overlayColor} />
              ) : section.type === "questions" ? (
                // Questions sections always go through formatContent to properly render math
                <div>{formatContent(content, fmt)}</div>
              ) : (section.type === "reading" || section.type === "passage" || section.type === "source-text" || section.type === "comprehension" || /reading.?passage|source.?text|comprehension.?text/i.test(section.title || "")) ? (
                // Bordered reading passage — slate border with padding per handover spec
                <div style={{
                  border: "2px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "16px",
                  background: "#f8fafc",
                  lineHeight: "1.8",
                  fontSize: `${fmt.fontSize}px`,
                  fontFamily: fmt.fontFamily,
                  letterSpacing: fmt.letterSpacing,
                  wordSpacing: fmt.wordSpacing,
                  color: "#1e293b",
                }}>
                  {formatContent(content, fmt)}
                </div>
              ) : (
                <div>{formatContent(content, fmt)}</div>
              )}

              {/* Answer boxes for practice sections — size-controlled, removable in edit mode */}
              {!isTeacherSection && (section.type === "independent" || section.type === "guided" || section.type === "challenge") && !/(sentence starter:|steps to follow:|quick start:|what you need to do:|help box|key facts|word bank)/i.test(String(content || "")) && (() => {
                const lineCount = getAnswerLines(i, section.type);
                // lineCount === 0 means the user removed the answer box
                if (lineCount === 0) {
                  // In edit mode, show a placeholder so the user can restore it
                  if (editMode) {
                    return (
                      <div style={{ marginTop: "10px", borderTop: "1px dashed #e5e7eb", paddingTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: `${fmt.fontSize - 2}px`, color: "#9ca3af", fontFamily: fmt.fontFamily, fontStyle: "italic" }}>Answer box removed</span>
                        <button
                          className="no-print"
                          onClick={(e) => { e.stopPropagation(); onAnswerBoxSizeChange?.(i, DEFAULT_ANSWER_LINES[section.type] ?? 4); }}
                          style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", border: "1px solid #5b21b6", background: "#ede9fe", color: "#5b21b6", cursor: "pointer", fontWeight: 600 }}
                        >+ Restore</button>
                      </div>
                    );
                  }
                  return null;
                }
                const label = section.type === "challenge" ? "Show your working:" : "Working space:";
                return (
                  <div style={{ marginTop: "12px", borderTop: "1px dashed #e5e7eb", paddingTop: "10px" }}>
                    {/* Edit mode controls */}
                    {editMode && (
                      <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#5b21b6", fontFamily: fmt.fontFamily }}>Answer box:</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onAnswerBoxSizeChange?.(i, Math.max(1, lineCount - 1)); }}
                          style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}
                          title="Fewer lines"
                        >−</button>
                        <span style={{ fontSize: "12px", color: "#374151", minWidth: "60px", textAlign: "center", fontFamily: fmt.fontFamily }}>{lineCount} line{lineCount !== 1 ? "s" : ""}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onAnswerBoxSizeChange?.(i, Math.min(20, lineCount + 1)); }}
                          style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}
                          title="More lines"
                        >+</button>
                        <div style={{ width: "1px", height: "16px", background: "#e5e7eb", margin: "0 2px" }} />
                        <button
                          onClick={(e) => { e.stopPropagation(); onAnswerBoxRemove?.(i); }}
                          style={{ padding: "2px 8px", borderRadius: "4px", border: "1px solid #fca5a5", background: "#fef2f2", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: "#dc2626" }}
                          title="Remove answer box"
                        >✕ Remove</button>
                      </div>
                    )}
                    <div style={{ fontSize: `${fmt.fontSize - 2}px`, color: "#9ca3af", marginBottom: "6px", fontFamily: fmt.fontFamily }}>{label}</div>
                    {Array.from({ length: lineCount }).map((_, n) => (
                      <div key={n} style={{ borderBottom: "1px solid #d1d5db", height: "28px", marginBottom: "6px" }} />
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}

      {/* ── Footer ── */}
      <div className="ws-footer" style={{
        marginTop: "10px",
        padding: "5px 10px",
        background: overlayColor || "#ffffff",
        borderRadius: "4px",
        border: "1.5px solid #5b21b6",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "4px",
        fontSize: "10px",
        color: "#5b21b6",
        fontFamily: fmt.fontFamily,
      }}>
        <span style={{ fontWeight: 600 }}>Generated by Adaptly</span>
        {/* Metadata info line — year group, subject, topic, difficulty, SEND, time */}
        <span style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          {worksheet.metadata.yearGroup && <span>{worksheet.metadata.yearGroup}</span>}
          {worksheet.metadata.subject && <span>| {worksheet.metadata.subject.charAt(0).toUpperCase() + worksheet.metadata.subject.slice(1)}</span>}
          {worksheet.metadata.topic && <span>| {worksheet.metadata.topic}</span>}
          {worksheet.metadata.difficulty && worksheet.metadata.difficulty !== "mixed" && (
            <span>| {worksheet.metadata.difficulty === "foundation" ? "Foundation" : "Higher"}</span>
          )}
          {worksheet.metadata.sendNeed && <span>| SEND: {worksheet.metadata.sendNeed}</span>}
          {worksheet.metadata.estimatedTime && <span>| {worksheet.metadata.estimatedTime}</span>}
        </span>
        <span>{new Date().toLocaleDateString("en-GB")} | adaptly.co.uk</span>
      </div>
    </div>
  );
});

WorksheetRenderer.displayName = "WorksheetRenderer";
export default WorksheetRenderer;
