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
import { extractDiagramSpec, stripDiagramMarker } from "@/lib/ai";
import SVGDiagram from "@/components/SVGDiagram";
import katex from "katex";
import "katex/dist/katex.min.css";

const LEGACY_SECTION_TYPE_ALIASES: Record<string, string> = {
  // Legacy question type aliases
  "true-false": "q-true-false",
  "mcq": "q-mcq",
  "multiple-choice": "q-mcq",
  "gap-fill": "q-gap-fill",
  "cloze": "q-gap-fill",
  "short-answer": "q-short-answer",
  "extended-answer": "q-extended",
  "table-fill": "q-data-table",
  "data-table": "q-data-table",
  "label-diagram": "q-label-diagram",
  // New question type aliases (from AI-generated worksheets)
  "q-worked-example": "example",
  "q-free-response": "q-extended",
  "q-free-write": "q-extended",
  "q-open-ended": "q-extended",
  // Section type aliases
  "learning-objective": "objective",
  "learning-objectives": "objective",
  "key-terms": "vocabulary",
  "key-vocabulary": "vocabulary",
  "section-heading": "section-header",
  "section-divider": "section-header",
  "section-break": "section-header",
  // Teacher section aliases
  "q-teacher-answers": "mark-scheme",
  "teacher-answers": "mark-scheme",
  "answer-key": "mark-scheme",
};

function normalizeWorksheetSectionType(type: unknown): string {
  const rawType = typeof type === "string" ? type.trim() : String(type || "").trim();
  return LEGACY_SECTION_TYPE_ALIASES[rawType] || rawType;
}

function normalizeWorksheetTitleForDisplay(title: unknown, difficulty?: unknown): string {
  const rawTitle = typeof title === "string" ? title.trim() : String(title || "").trim();
  if (!rawTitle) return "";
  const diff = typeof difficulty === "string" ? difficulty.trim().toLowerCase() : String(difficulty || "").trim().toLowerCase();

  if (diff === "mixed") {
    return rawTitle.replace(/\s*[—–-]\s*(?:scaffolded|foundation|send(?:\s+scaffolded)?|access)\s+tier\b/gi, " — Mixed Ability");
  }

  if (diff === "foundation") {
    return rawTitle.replace(/\s*[—–-]\s*scaffolded\s+tier\b/gi, " — Foundation Tier");
  }

  return rawTitle;
}

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

  // Convert literal \n escape sequences (from JSON serialisation) to real newlines
  // This fixes the "random backslash at end of sentences" rendering bug
  text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

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
  // ── Step 4a: Convert iteration/sequence fractions BEFORE subscript conversion ──────
  // e.g. x_(n+1) = (x_n + 5)/2 — handle the full expression as a KaTeX block
  // This must run before Step 4b so subscripts inside fractions are handled correctly.
  //
  // Pattern: identifier_(expr) = (expr_with_subscripts)/number
  // e.g. x_(n+1) = (x_n + 5)/2  →  x_{n+1} = \dfrac{x_n + 5}{2}
  result = result.replace(
    /([A-Za-z])_\(([^()]+)\)\s*=\s*\(([^()]+)\)\s*\/\s*([A-Za-z0-9]+)/g,
    (full, lhsVar, lhsSub, num, den) => {
      if (/<[a-z]/i.test(full)) return full;
      // Convert subscripts inside numerator: x_n → x_{n}
      const numLatex = num.replace(/([A-Za-z])_([0-9]|[a-z](?![a-z]))/g, '$1_{$2}');
      const lhsLatex = `${lhsVar}_{${lhsSub}}`;
      const fracLatex = `\\dfrac{${numLatex}}{${den}}`;
      try { return katex.renderToString(`${lhsLatex} = ${fracLatex}`, { displayMode: false, throwOnError: false }); }
      catch { return full; }
    }
  );
  // Also handle: x_(n+1) = (expr)/number without the leading variable=
  result = result.replace(
    /([A-Za-z])_\(([^()]+)\)\s*=\s*\(([^()]+)\)\s*\/\s*([A-Za-z0-9]+)/g,
    (full, lhsVar, lhsSub, num, den) => {
      if (/<[a-z]/i.test(full)) return full;
      const numLatex = num.replace(/([A-Za-z])_([0-9]|[a-z](?![a-z]))/g, '$1_{$2}');
      try { return katex.renderToString(`${lhsVar}_{${lhsSub}} = \\dfrac{${numLatex}}{${den}}`, { displayMode: false, throwOnError: false }); }
      catch { return full; }
    }
  );

  // ── Step 4b: Convert subscript notation x_(n+1) and x_n to KaTeX ─────────────
  // Handles iteration/sequence notation like x_(n+1), u_(n+1), a_n, x_1, etc.
  // Must run BEFORE fraction conversion so (x_n + 5)/2 is handled correctly.
  //
  // Pattern A: variable_(expr) — subscript with parenthesised expression: x_(n+1) → x_{n+1}
  result = result.replace(/([A-Za-z])_\(([^()]+)\)/g, (full, v, sub) => {
    if (/<[a-z]/i.test(full)) return full;
    try { return katex.renderToString(`${v}_{${sub}}`, { displayMode: false, throwOnError: false }); }
    catch { return full; }
  });
  // Pattern B: variable_n or variable_1 — simple subscript: x_n, x_1, a_n, u_n
  // Only match single-letter or digit subscripts to avoid false positives
  result = result.replace(/([A-Za-z])_([0-9]|[a-z](?![a-z]))/g, (full, v, sub) => {
    if (/<[a-z]/i.test(full)) return full;
    try { return katex.renderToString(`${v}_{${sub}}`, { displayMode: false, throwOnError: false }); }
    catch { return full; }
  });

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
  //    Pattern B: token / token with spaces — ONLY when at least one side is a plain integer
  //    This prevents prose like "and / or", "yes / no", "Teacher / Student" from becoming fractions
  result = result.replace(/(-?[A-Za-z0-9]+)\s+\/\s+([A-Za-z0-9]+)/g, (full, num, den) => {
    if (hasHTML(num) || hasHTML(den)) return full;
    // Skip year ranges (e.g. 2023 / 24)
    if (/^\d{4}$/.test(num) || /^\d{4}$/.test(den)) return full;
    if (/^\d{4,}$/.test(num) || /^\d{4,}$/.test(den)) return full;
    // Require at least one side to be purely numeric — otherwise it's prose
    const isNumeric = (s: string) => /^-?\d+$/.test(s);
    const isSingleVar = (s: string) => /^[A-Za-z]$/.test(s);
    if (!isNumeric(num) && !isNumeric(den)) return full;
    // Also allow single-letter variable / number: x / 2, n / 3
    if (!isNumeric(num) && !isSingleVar(num)) return full;
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
      // Step A: Handle parenthesized numerators like (x² + 5x)/x, (3x + 9)/3
      let t0 = text.replace(/\(([^)]{1,80})\)\/([A-Za-z0-9²³⁴-⁹]+)/g, (full: string, num: string, den: string) => {
        if (!/[A-Za-z]/.test(num) && !/[A-Za-z]/.test(den)) return full;
        const toLaTeX = (s: string) => s
          .replace(/²/g, '^{2}').replace(/³/g, '^{3}').replace(/⁴/g, '^{4}')
          .replace(/⁵/g, '^{5}').replace(/⁶/g, '^{6}').replace(/⁷/g, '^{7}')
          .replace(/⁸/g, '^{8}').replace(/⁹/g, '^{9}');
        try { return katex.renderToString(`\dfrac{${toLaTeX(num)}}{${toLaTeX(den)}}`, { displayMode: false, throwOnError: false }); }
        catch { return full; }
      });
      return t0.replace(/([A-Za-z0-9²³⁴-⁹]+)\/([A-Za-z0-9²³⁴-⁹]+)/g, (full, num, den) => {
        // Skip year ranges (e.g. 2023/24)
        if (/^\d{4}$/.test(num) || /^\d{4}$/.test(den)) return full;
        // Skip if either part is a long number that looks like a year
        if (/^\d{4,}$/.test(num) || /^\d{4,}$/.test(den)) return full;
        // Skip common prose patterns that use slashes — NOT maths
        const proseBlocklist = new Set([
          "and","or","the","a","an","to","of","in","is","it","its","he","she","they","we","his","her","our",
          "their","with","for","on","at","by","as","be","was","are","has","had","have","but","not","no","yes",
          "eg","ie","etc","vs","re","mr","mrs","ms","dr","st","rd","nd","th","am","pm","uk","us","eu",
          "w","o","s","n","e","g","i","j","k","m","p","q","r","u","v","w","z",
        ]);
        const numL = num.toLowerCase();
        const denL = den.toLowerCase();
        if (proseBlocklist.has(numL) || proseBlocklist.has(denL)) return full;
        // Only render as a fraction when the pair is unambiguously mathematical.
        const isNumeric = (s: string) => /^\d+$/.test(s);
        const isSingleVar = (s: string) => /^[A-Za-z]$/.test(s);
        const isSimpleAlgebra = (s: string) => /^[0-9]*[A-Za-z]$/.test(s); // x, y, 2x, 3n
        // Algebraic term: 12x, 14a, 9y², 16p²q, 4pq, 3y, 2x, etc.
        const isAlgebraicTerm = (s: string) => /^[0-9]*[A-Za-z][A-Za-z0-9²³⁴⁵⁶⁷⁸⁹²³⁴-⁹]*$/.test(s);
        const bothNumeric = isNumeric(num) && isNumeric(den);
        const bothSimpleAlgebra = isSimpleAlgebra(num) && isSimpleAlgebra(den);
        const oneSideSingleVarAndOtherNumeric = (isSingleVar(num) && isNumeric(den)) || (isNumeric(num) && isSingleVar(den));
        // Algebraic fraction: at least one side is an algebraic term and the other is numeric or algebraic
        const isAlgebraicFraction = (isAlgebraicTerm(num) || isNumeric(num)) && (isAlgebraicTerm(den) || isNumeric(den));
        const looksMathy = bothNumeric || bothSimpleAlgebra || oneSideSingleVarAndOtherNumeric || isAlgebraicFraction;
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
  assetRef?: string;   // stable asset ID — resolved to URL via libraryAssets
  attribution?: string;
  isOverlay?: boolean;
  marks?: number;
  [key: string]: unknown;
}

export interface LibraryAsset {
  id: string;
  sectionKey: string;
  assetType: string;
  publicUrl: string;
  width?: number;
  height?: number;
  altText?: string;
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
  fromLibrary?: boolean;
  libraryId?: string;
  canonicalTopicKey?: string;
  structuralHash?: string;
  libraryAssets?: LibraryAsset[];  // stable asset registry for assetRef resolution
  availableTiers?: string[];
  overlayState?: {
    retrievalTopic?: string | null;
    additionalInstructions?: string | null;
    sendNeed?: string | null;
    readingAge?: string | null;
  };
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
  schoolLogoUrl?: string;
  teacherName?: string;
  hiddenSections?: Set<number>;
  answerBoxSizes?: Record<number, number>;
  onAnswerBoxSizeChange?: (sectionIndex: number, lines: number) => void;
  onAnswerBoxRemove?: (sectionIndex: number) => void;
  isRevisionMat?: boolean;
}

// Section type → visual config (clean white, dark navy accent, no gradients, no emojis)
// Matches the reference PDF exactly: flat dark navy header bar, white text, no colour fills on body.
const SECTION_STYLES: Record<string, { border: string; bg: string; badge: string; badgeBg: string; icon: string; label: string; headerBg: string; headerText: string }> = {
  "objective":     { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Learning Objective",      headerBg: "#1a2744", headerText: "#ffffff" },
  "success":       { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Success Criteria",        headerBg: "#1a2744", headerText: "#ffffff" },
  "vocabulary":    { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Key Vocabulary",          headerBg: "#1a2744", headerText: "#ffffff" },
  "starter":       { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Prior Knowledge Check",   headerBg: "#1a2744", headerText: "#ffffff" },
  "example":       { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Worked Example",          headerBg: "#1a2744", headerText: "#ffffff" },
  "reminder-box":  { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Key Steps",               headerBg: "#1a2744", headerText: "#ffffff" },
  "guided":        { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Foundation",              headerBg: "#1a2744", headerText: "#ffffff" },
  "independent":   { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Core Practice",           headerBg: "#1a2744", headerText: "#ffffff" },
  "challenge":     { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Stretch & Challenge",     headerBg: "#1a2744", headerText: "#ffffff" },
  "word-problems": { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Real-Life Problems",      headerBg: "#1a2744", headerText: "#ffffff" },
  "common-mistakes":{ border:"#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg:"#1a2744",  icon:"",  label: "Common Mistakes to Avoid",headerBg: "#1a2744", headerText: "#ffffff" },
  "word-bank":     { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Word Bank",               headerBg: "#1a2744", headerText: "#ffffff" },
  "wordbank":      { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Word Bank",               headerBg: "#1a2744", headerText: "#ffffff" },
  "sentence-starters": { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Sentence Starters",  headerBg: "#1a2744", headerText: "#ffffff" },
  "self-assessment": { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Self Assessment",       headerBg: "#1a2744", headerText: "#ffffff" },
  "self-reflection": { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "How Did I Do?",         headerBg: "#1a2744", headerText: "#ffffff" },
  "diagram":       { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Diagram",                 headerBg: "#1a2744", headerText: "#ffffff" },
  "answers":       { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Answers",                 headerBg: "#1a2744", headerText: "#ffffff" },
  "questions":     { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Exam Questions",          headerBg: "#1a2744", headerText: "#ffffff" },
  "mark-scheme":   { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Mark Scheme",             headerBg: "#1a2744", headerText: "#ffffff" },
  "teacher-notes": { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Teacher Notes",           headerBg: "#1a2744", headerText: "#ffffff" },
  "send-support":  { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "SEND Support",            headerBg: "#1a2744", headerText: "#ffffff" },
  "reading":       { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Reading Passage",         headerBg: "#1a2744", headerText: "#ffffff" },
  "passage":       { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Reading Passage",         headerBg: "#1a2744", headerText: "#ffffff" },
  "source-text":   { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Source Text",             headerBg: "#1a2744", headerText: "#ffffff" },
  "comprehension": { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Comprehension",           headerBg: "#1a2744", headerText: "#ffffff" },
  "misconceptions":{ border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Common Mistakes to Avoid",headerBg: "#1a2744", headerText: "#ffffff" },
  "revision-mat-box":{ border:"#1a2744",bg:"#ffffff",  badge:"#1a2744",  badgeBg:"#1a2744",  icon:"",  label: "",                        headerBg: "#1a2744", headerText: "#ffffff" },
  "default":       { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "",                        headerBg: "#1a2744", headerText: "#ffffff" },
  "section-header": { border: "#2a7f8f", bg: "#ffffff", badge: "#2a7f8f", badgeBg: "#2a7f8f", icon: "", label: "",                        headerBg: "#2a7f8f", headerText: "#ffffff" },
  "q-challenge":    { border: "#1a2744", bg: "#ffffff", badge: "#1a2744", badgeBg: "#1a2744", icon: "", label: "Challenge",               headerBg: "#1a2744", headerText: "#ffffff" },
};
function getSectionStyle(type: string, _yearNum?: number) {
  // All section types are now locked to the indigo/blue/violet palette —
  // teal, sky, and slate have been removed from SECTION_STYLES entirely.
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

  // Convert literal \n escape sequences (from JSON serialisation) to real newlines
  // This fixes the "random backslash at end of sentences" rendering bug
  content = content.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

  const { fontSize: textSize, lineHeight, letterSpacing, wordSpacing, paragraphSpacing, fontFamily } = fmt;
  // Strip [[DIAGRAM:{...}]] markers — handled by the outer section renderer.
  // If they reach formatContent they must be stripped silently so raw JSON never renders.
  content = content.replace(/\[\[DIAGRAM:\{[\s\S]*?\}\]\]/g, "").trim();
  // Strip AI instruction lines that should never appear in rendered content
  // Robust: handles leading pipes, asterisks, whitespace, and partial matches
  content = content.split("\n").filter((line: string) => {
    const t = line.trim();
    // Direct prefix matches (case-insensitive), with optional leading ** or |
    if (/^\|?\s*\*{0,2}\s*IMPORTANT\s*[:—\-|]/i.test(t)) return false;
    if (/^\|?\s*\*{0,2}\s*LABELS\s*[:—\-|]/i.test(t)) return false;
    if (/^\|?\s*\*{0,2}\s*ANSWERS\s*[:—\-|]/i.test(t)) return false;
    if (/^\|?\s*\*{0,2}\s*NOTE\s*[:—\-|]/i.test(t)) return false;
    if (/^\|?\s*\*{0,2}\s*CRITICAL\s*[:—\-|]/i.test(t)) return false;
    if (/^\|?\s*\*{0,2}\s*DIAGRAM\s*(TYPE|RULES|INSTRUCTION)\s*[:—\-|]/i.test(t)) return false;
    if (/^\|?\s*\*{0,2}\s*TOPIC[\s-]*SPECIFIC/i.test(t)) return false;
    if (/^\|?\s*\*{0,2}\s*SVG DIAGRAM/i.test(t)) return false;
    if (/^\|?\s*\*{0,2}\s*ADVANCED QUESTION/i.test(t)) return false;
    // Strip lines that are just "LABELS" or "ANSWERS" headers
    if (/^\|?\s*labels\s*\|?\s*$/i.test(t)) return false;
    if (/^\|?\s*answers\s*\|?\s*$/i.test(t)) return false;
    // Strip separator rows between LABELS/ANSWERS tables (e.g. |---|---|)
    if (/^\|[\s\-:]+\|/.test(t) && t.split('|').length >= 3) {
      const cells = t.split('|').filter((c: string) => c.trim());
      if (cells.every((c: string) => /^[\s\-:]+$/.test(c))) return false;
    }
    return true;
  }).join("\n");
  // ── Systemic content pre-processor ─────────────────────────────────────────────
  // Handles all known AI output patterns that cause broken rendering:
  //   1. Concatenated numbered items on a single line ("1. Q1 . 2. Q2 . 3. Q3")
  //   2. Orphaned number-only lines ("1.\n+ 2 =") — join number with next line
  //   3. Leading period artifacts
  //   4. Blank lines between number and content ("1.\n\n+ 2 =")
  content = content.replace(/^[.\s]+(?=[A-Z])/, '');
  let preprocessed = content
    .replace(/\?\s+\.\s+/g, '?\n')
    .replace(/\.\s+(\d+[a-z]?[.)\s]\s*)/g, '.\n$1')
    .replace(/(,\s*)(\d+[a-z]?[.)\s]\s*)/g, '\n$2')
    .replace(/(;\s*)(\d+[a-z]?[.)\s]\s*)/g, '\n$2');

  // Pass 2: join orphaned number-only lines with the next non-empty line.
  // Covers patterns like: "1.\n+ 2 ="  or  "2.\n\nWhat is..." or "3)\nFill in"
  {
    const rawLines = preprocessed.split('\n');
    const joined: string[] = [];
    for (let li = 0; li < rawLines.length; li++) {
      const cur = rawLines[li].trim();
      // An orphaned number line: just a number+punctuation with nothing after it
      if (/^\d+[a-z]?[.):]\s*$/.test(cur)) {
        // Find the next non-empty line to join with
        let next = '';
        let skip = 0;
        for (let ni = li + 1; ni < rawLines.length; ni++) {
          if (rawLines[ni].trim()) { next = rawLines[ni].trim(); skip = ni - li; break; }
        }
        if (next) {
          joined.push(cur + ' ' + next);
          li += skip; // skip the consumed lines
        } else {
          joined.push(cur);
        }
      } else {
        joined.push(rawLines[li]);
      }
    }
    preprocessed = joined.join('\n');
  }

  const lines = preprocessed.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let listItems: string[] = [];

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return;
    // filter(Boolean) strips the empty strings left by leading/trailing pipes
    const rows = tableRows.map(r => r.split("|").map(c => c.trim()).filter(Boolean));
    if (rows.length === 0) return;

    // ── Systemic header detection ──────────────────────────────────────────────
    // A genuine column header cell must satisfy ALL of:
    //   1. Contains only letters, spaces, hyphens, slashes, parens, ampersands
    //      (no digits, math operators, colons, equals signs, underscores)
    //   2. Is short: ≤ 25 characters and ≤ 4 words
    //   3. Starts with a capital letter OR is a known column-label word
    // This prevents data cells like "finding the total", "the same as: =",
    // "2+2", "photosynthesis", blank cells, or long definitions from being
    // misidentified as headers — regardless of subject, year group, or table type.
    const isGenuineHeaderCell = (c: string): boolean => {
      const t = c.trim();
      if (!t) return false;
      // Must be letters-only (no digits, operators, colons, equals, underscores)
      if (!/^[A-Za-z][A-Za-z\s\-/()&]*$/.test(t)) return false;
      // Must be short
      if (t.length > 25) return false;
      if (t.split(/\s+/).length > 4) return false;
      // Must start with capital OR be a known label word
      return /^[A-Z]/.test(t) ||
        /^(word|term|key|column|definition|answer|question|name|type|example|value|symbol|formula|unit|equation|meaning|category|description|property|feature|stage|step|event|date|cause|effect|factor|element|compound|reactant|product|force|mass|speed|time|distance|energy|power|charge|voltage|current|resistance|temperature|pressure|volume|concentration|ph|gene|allele|organ|tissue|cell|species|habitat|adaptation|biome|era|period|dynasty|country|region|city|person|role|impact|consequence|advantage|disadvantage|strength|weakness|opportunity|threat)$/i.test(t);
    };
    const isHeaderRow = (row: string[]): boolean =>
      row.length > 0 && row.every(cell => isGenuineHeaderCell(cell));

    const firstRowIsHeader = isHeaderRow(rows[0]);
    const header = firstRowIsHeader ? rows[0] : [];
    const body = (firstRowIsHeader ? rows.slice(1) : rows).filter(r => r.length > 0);
    if (rows.length === 0) return;
    const inlineColCount = Math.max(header.length, ...body.map(r => r.length));
    const inlineColW = `${Math.floor(100 / Math.max(inlineColCount, 1))}%`;
    const isInlineBlank = (c: string) => !c || /^\.{2,}$/.test(c.trim()) || /^_+$/.test(c.trim()) || c.trim() === "" || c.trim() === "[blank]";
    elements.push(
      <div key={key} className="ws-table-wrap" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", maxWidth: "100%", margin: "8px 0" }}>
        <table style={{ width: "100%", minWidth: `${inlineColCount * 80}px`, borderCollapse: "collapse", tableLayout: "fixed", fontSize: `${textSize - 1}px`, fontFamily, letterSpacing, wordSpacing }}>
          <colgroup>{Array.from({ length: inlineColCount }).map((_, i) => <col key={i} style={{ width: inlineColW }} />)}</colgroup>
          {header.length > 0 && (
            <thead>
              <tr>
                {header.map((h, hi) => (
                  <th key={hi} style={{ padding: "8px 12px", background: "#1a2744", color: "white", textAlign: "left", fontWeight: 700, border: "1px solid #d1d5db", wordBreak: "break-word", overflowWrap: "break-word" }}>{h}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f8f9fa" }}>
                {Array.from({ length: inlineColCount }).map((_, ci) => {
                  const cell = (row[ci] ?? "").trim();
                  const blank = isInlineBlank(cell);
                  return (
                    <td key={ci} style={{ padding: blank ? "6px 12px 2px 12px" : "7px 12px", border: "1px solid #e5e7eb", borderBottom: blank ? "2px solid #94a3b8" : "1px solid #e5e7eb", fontSize: `${textSize - 1}px`, minHeight: "32px", height: "32px", wordBreak: "break-word", overflowWrap: "break-word", verticalAlign: "middle" }}>
                      {blank
                        ? <span style={{ display: "block", minWidth: "40px", minHeight: "20px" }}>&nbsp;</span>
                        : <span dangerouslySetInnerHTML={{ __html: renderMath(cell) }} />
                      }
                    </td>
                  );
                })}
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
    // Clean up lines that start with a lone period/dot (artifact of AI separator pattern)
    // Handles both ". " and "." at the start of a line
    trimmed = trimmed.replace(/^\.\.?\s*/, '');

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

    // BRAIN BREAK — ADHD/chunked: render as a distinct card
    if (/brain break/i.test(trimmed) || /stand up.*stretch/i.test(trimmed)) {
      if (listItems.length) flushList(`list-${idx}`);
      elements.push(
        <div key={idx} style={{
          background: "linear-gradient(135deg,#ede9fe,#dbeafe)",
          border: "2px solid #6366f1",
          borderRadius: "10px",
          padding: "10px 14px",
          margin: "12px 0",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: `${textSize}px`,
          fontFamily,
          fontWeight: 700,
          color: "#3730a3",
        }}>
          <span style={{ fontSize: "20px" }}>🧘</span>
          <span>{trimmed.replace(/^\[?\s*\]?\s*/,"")}</span>
        </div>
      );
      return;
    }

    // STOP — CHECK / STOP — CHECK YOUR WORK (ADHD milestone)
    if (/^STOP\s*[—–-]/i.test(trimmed) || /^check your work/i.test(trimmed)) {
      if (listItems.length) flushList(`list-${idx}`);
      elements.push(
        <div key={idx} style={{
          background: "#eff6ff",
          border: "2px solid #3b82f6",
          borderRadius: "8px",
          padding: "8px 14px",
          margin: "10px 0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: `${textSize - 1}px`,
          fontFamily,
          fontWeight: 700,
          color: "#1e3a8a",
        }}>
          <span style={{ fontSize: "16px" }}>⏸️</span>
          <span>{trimmed}</span>
        </div>
      );
      return;
    }

    // TIP / NOTE box
    if (/^(TIP|Note|NOTE|HINT|Top Tip|Quick Tip):/i.test(trimmed)) {
      if (listItems.length) flushList(`list-${idx}`);
      const [label, ...rest] = trimmed.split(":");
      elements.push(
        <div key={idx} style={{
          background: "#eff6ff",
          border: "1.5px solid #93c5fd",
          borderLeft: "4px solid #3b82f6",
          borderRadius: "6px",
          padding: "8px 12px",
          margin: "8px 0",
          fontSize: `${textSize - 1}px`,
          fontFamily,
          color: "#1e40af",
        }}>
          <span style={{ fontWeight: 700 }}>{label}: </span>
          <span dangerouslySetInnerHTML={{ __html: renderMath(rest.join(":").trim()) }} />
        </div>
      );
      return;
    }

    // OPTIONAL / BONUS section marker
    if (/^(OPTIONAL|BONUS|OPTIONAL BONUS)/i.test(trimmed) && trimmed.length < 40) {
      if (listItems.length) flushList(`list-${idx}`);
      elements.push(
        <div key={idx} style={{
          border: "1.5px dashed #9ca3af",
          borderRadius: "6px",
          padding: "4px 10px",
          margin: "8px 0",
          fontSize: `${textSize - 2}px`,
          fontFamily,
          color: "#6b7280",
          fontStyle: "italic",
          textAlign: "center",
        }}>
          ✦ {trimmed} ✦
        </div>
      );
      return;
    }

    // Numbered list with [ ] checkbox — ADHD/Dyspraxia
    const checkboxMatch = trimmed.match(/^(\[[\s_xX✓]?\]|\☐|\☑)\s+(.+)$/);
    if (checkboxMatch || (fmt.showCheckboxes && trimmed.match(/^(\d+[.)\s]\s*)(.+)$/))) {
      if (listItems.length) flushList(`list-${idx}`);
      const questionText = checkboxMatch
        ? checkboxMatch[2]
        : trimmed.replace(/^(\d+[.)\s]\s*)/, "");
      elements.push(
        <div key={idx} style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: paragraphSpacing,
          fontSize: `${textSize}px`,
          fontFamily,
          lineHeight,
          letterSpacing,
          wordSpacing,
        }}>
          {/* Checkbox SVG */}
          <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: "2px" }} xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="18" height="18" rx="3" fill="white" stroke="#6b7280" strokeWidth="1.5" />
          </svg>
          <span dangerouslySetInnerHTML={{ __html: renderMath(questionText) }} />
        </div>
      );
      return;
    }

    // Numbered list (standard, no checkbox)
    // Systemic fix: always show the question number AND use a larger bottom margin
    // so questions never run together regardless of subject, year group, or content type.
    const numberedMatch = trimmed.match(/^(\d+[a-z]?[.):]\s*)(.+)$/);
    if (numberedMatch && !fmt.showCheckboxes) {
      const qNum = numberedMatch[1].trim();
      const qText = numberedMatch[2];
      // Use a minimum of 10px bottom margin regardless of theme paragraphSpacing
      const qMargin = `0 0 max(${paragraphSpacing}, 10px) 0`;
      elements.push(
        <div key={idx} style={{ display: "flex", gap: "6px", alignItems: "flex-start", margin: qMargin }}>
          <span style={{ fontWeight: 700, fontSize: `${textSize}px`, color: "#374151", fontFamily, flexShrink: 0, minWidth: "20px" }}>{qNum}</span>
          <span style={{ fontSize: `${textSize}px`, lineHeight, color: "#1f2937", fontFamily, letterSpacing, wordSpacing }} dangerouslySetInnerHTML={{ __html: renderMath(qText) }} />
        </div>
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
        <div key={idx} style={{ fontWeight: 700, color: "#4f46e5", marginTop: "8px", marginBottom: "2px", fontSize: `${textSize}px`, fontFamily }}>
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
    // Systemic: enforce minimum 8px bottom margin so content never runs together
    elements.push(
      <p key={idx} style={{ margin: `0 0 max(${paragraphSpacing}, 8px) 0`, fontSize: `${textSize}px`, lineHeight, color: "#1f2937", fontFamily, letterSpacing, wordSpacing }}>
        <span dangerouslySetInnerHTML={{ __html: renderMath(trimmed) }} />
      </p>
    );
  });

  if (inTable) flushTable("table-end");
  if (listItems.length) flushList("list-end");

  return <>{elements}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT SUB-RENDERERS
// Each handles one LayoutFamily. Invoked when section content starts with
// LAYOUT:<type> — placed by the worksheet generator.
// All are SEND-aware via the fmt object and overlayColor tint.
// ─────────────────────────────────────────────────────────────────────────────

/** Strips the LAYOUT:<type>\n prefix from content before passing to sub-renderer */
function stripLayoutTag(content: string): string {
  return content.replace(/^LAYOUT:\w+\n?/, "").trim();
}

/** Reads the LAYOUT:<type> tag from the first line of content, or null if absent */
function readLayoutTag(content: string): string | null {
  const m = content.match(/^LAYOUT:(\w+)/);
  return m ? m[1] : null;
}

// ── 1. TRUE / FALSE ──────────────────────────────────────────────────────────
function TrueFalseSection({
  content, fmt, overlayColor = "white", isTeacher = false,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
  overlayColor?: string;
  isTeacher?: boolean;
}) {
  const raw = stripLayoutTag(content);
  const allLines = raw.split("\n").map(l => l.trim()).filter(Boolean);

  // Build statement list — handles THREE formats:
  // Format A (numbered, same line): "1. Statement TRUE" or "1. Statement → TRUE"
  // Format B (numbered, next line): "1. Statement" followed by "TRUE" or "FALSE" on next line
  // Format C (bullet point): "- Statement" or "* Statement"
  const statements: { text: string; answer: string | undefined }[] = [];
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    // Handle bullet-point format: lines starting with - or *
    if (/^[-*]\s+/.test(line)) {
      const stmtText = line.replace(/^[-*]\s+/, "").trim();
      if (stmtText.length > 4) {
        statements.push({ text: stmtText, answer: undefined });
      }
      continue;
    }
    // Handle plain lines with TRUE/FALSE at end (library/PDF format): "Statement. TRUE /" or "Statement. TRUE / FALSE"
    const plainInlineMatch = line.match(/^(.{5,}?)[.→\s]+(TRUE|FALSE)(?:\s*\/\s*(?:FALSE|TRUE))?[.\s]*$/i);
    if (plainInlineMatch && !/^\d+[.)\s]/.test(line)) {
      statements.push({ text: plainInlineMatch[1].trim(), answer: plainInlineMatch[2].toUpperCase() });
      continue;
    }
    // Handle plain lines without TRUE/FALSE (library/PDF format): just the statement text
    if (!/^\d+[.)\s]/.test(line)) {
      // Only add if it looks like a statement (not a header or short label)
      if (line.length > 10 && !/^(TRUE|FALSE|QUESTION|STATEMENT|SECTION|RECALL|UNDERSTANDING|APPLICATION)/i.test(line)) {
        statements.push({ text: line.trim(), answer: undefined });
      }
      continue;
    }
    // Check if TRUE/FALSE is on this line
    // Handle formats: 'Statement TRUE', 'Statement → TRUE', 'Statement. TRUE /', 'Statement. TRUE / FALSE'
    const inlineMatch = line.match(/[.→\s]+(TRUE|FALSE)(?:\s*\/\s*(?:FALSE|TRUE))?[.\s]*$/i);
    if (inlineMatch) {
      const stmtText = line.replace(/^\d+[.)\s]+/, "").replace(/[.→\s]+(TRUE|FALSE)(?:\s*\/\s*(?:FALSE|TRUE))?[.\s]*$/i, "").trim();
      statements.push({ text: stmtText, answer: inlineMatch[1].toUpperCase() });
    } else {
      // Check if next line is TRUE or FALSE
      const nextLine = allLines[i + 1]?.trim();
      const isNextTF = nextLine && /^(TRUE|FALSE)$/i.test(nextLine);
      const stmtText = line.replace(/^\d+[.)\s]+/, "").trim();
      if (stmtText.length > 4) {
        statements.push({ text: stmtText, answer: isNextTF ? nextLine.toUpperCase() : undefined });
        if (isNextTF) i++; // skip the TRUE/FALSE line
      }
    }
  }
  // Fallback: if nothing parsed, show all numbered or bullet lines without TRUE/FALSE
  const displayLines = statements.length > 0 ? statements :
    allLines.filter(l => /^\d+[.)\s].{8,}/.test(l) || /^[-*]\s+.{8,}/.test(l)).map(l => ({ text: l.replace(/^(\d+[.)\s]+|[-*]\s+)/, "").trim(), answer: undefined }));
  const accentColor = fmt.accentColor || "#2A6F6F";
  const RED = "#8B0000";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: fmt.lineHeight > 1.7 ? "14px" : "10px" }}>
      {displayLines.map((item, i) => {
        const stmtText = typeof item === "string" ? item.replace(/^\d+[.)\s]+/, "").trim() : item.text;
        const answer = typeof item === "string" ? undefined : item.answer;
        return (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "8px 10px",
            borderRadius: "6px",
            background: i % 2 === 0 ? overlayColor : `${overlayColor}cc`,
            border: `1px solid ${accentColor}22`,
          }}>
            <span style={{
              flex: 1,
              fontSize: `${fmt.fontSize}px`,
              fontFamily: fmt.fontFamily,
              lineHeight: String(fmt.lineHeight),
              letterSpacing: fmt.letterSpacing,
              color: "#1e293b",
            }} dangerouslySetInnerHTML={{ __html: renderMath(stmtText) }} />
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <div style={{
                padding: "5px 18px",
                borderRadius: "999px",
                border: `1.5px solid ${accentColor}`,
                background: isTeacher && answer === "TRUE" ? accentColor : "white",
                color: isTeacher && answer === "TRUE" ? "white" : accentColor,
                fontSize: `${Math.max(fmt.fontSize - 2, 10)}px`,
                fontFamily: fmt.fontFamily,
                fontWeight: 700,
                cursor: "default",
                minWidth: "60px",
                textAlign: "center" as const,
                userSelect: "none" as const,
              }}>TRUE</div>
              <div style={{
                padding: "5px 18px",
                borderRadius: "999px",
                border: `1.5px solid ${RED}`,
                background: isTeacher && answer === "FALSE" ? RED : "white",
                color: isTeacher && answer === "FALSE" ? "white" : RED,
                fontSize: `${Math.max(fmt.fontSize - 2, 10)}px`,
                fontFamily: fmt.fontFamily,
                fontWeight: 700,
                cursor: "default",
                minWidth: "60px",
                textAlign: "center" as const,
                userSelect: "none" as const,
              }}>FALSE</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 2. MCQ 2-COLUMN ──────────────────────────────────────────────────────────
function MCQSection({
  content, fmt, overlayColor = "white", isTeacher = false,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
  overlayColor?: string;
  isTeacher?: boolean;
}) {
  const raw = stripLayoutTag(content);
  const accentColor = fmt.accentColor || "#1B2A4A";
  const GREEN = "#166534";
  const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

  // ── Parse multiple numbered questions from a single content block ──────────
  // Supports formats:
  //   "1. Question text\nA. opt\nB. opt\n2. Next question\nA. opt..."
  //   "1) Question text\nA  opt\nB  opt..."
  //   Single question with no number prefix
  const allLines = raw.split("\n").filter(Boolean);

  // Check if content has multiple numbered questions (e.g. "1.", "2.", "3.")
  const numberedQPattern = /^(\d+)[.)\s]\s*\S/;
  const questionStartIndices = allLines
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => numberedQPattern.test(l))
    .map(({ i }) => i);

  // Build question blocks
  interface MCQBlock { questionLines: string[]; optionLines: string[]; qNum: number; }
  let blocks: MCQBlock[] = [];

  if (questionStartIndices.length >= 2) {
    // Multiple numbered questions — split into blocks
    for (let bi = 0; bi < questionStartIndices.length; bi++) {
      const start = questionStartIndices[bi];
      const end = bi + 1 < questionStartIndices.length ? questionStartIndices[bi + 1] : allLines.length;
      const blockLines = allLines.slice(start, end);
      const hasBullet = blockLines.filter(l => /^[-*]\s+\S/.test(l)).length >= 2;
      const isRealOpt = (l: string) => {
        if (!/^[A-D][.\s)]{1,2}\s*\S/.test(l)) return false;
        const after = l.slice(1).replace(/^[.\s)]+/, "").trim();
        return after.length < 80 && !after.endsWith("?");
      };
      const optIdx = hasBullet
        ? blockLines.findIndex(l => /^[-*]\s+\S/.test(l))
        : blockLines.findIndex(l => isRealOpt(l));
      blocks.push({
        qNum: bi + 1,
        questionLines: optIdx > 0 ? blockLines.slice(0, optIdx) : blockLines,
        optionLines: optIdx >= 0 ? blockLines.slice(optIdx) : [],
      });
    }
  } else {
    // Single question (no numbered prefix)
    const hasBullet = allLines.filter(l => /^[-*]\s+\S/.test(l)).length >= 2;
    // Find the first true option line: starts with A/B/C/D followed by space/period/paren
    // AND is a short answer (not a long sentence that happens to start with A/B/C/D)
    // True options are typically < 60 chars and don't end with "?"
    const isRealOptionLine = (l: string) => {
      if (!/^[A-D][.\s)]{1,2}\s*\S/.test(l)) return false;
      const afterLabel = l.slice(1).replace(/^[.\s)]+/, "").trim();
      // A real option is short (< 80 chars) and doesn't end with a question mark
      return afterLabel.length > 0 && afterLabel.length < 80 && !afterLabel.endsWith("?");
    };
    const optIdx = hasBullet
      ? allLines.findIndex(l => /^[-*]\s+\S/.test(l))
      : allLines.findIndex(l => isRealOptionLine(l));
    blocks = [{
      qNum: 1,
      questionLines: optIdx > 0 ? allLines.slice(0, optIdx) : (optIdx === -1 ? allLines : []),
      optionLines: optIdx >= 0 ? allLines.slice(optIdx) : [],
    }];
  }

  function parseOptions(optionLines: string[], hasBullet: boolean) {
    if (hasBullet) {
      return optionLines
        .filter(l => /^[-*]\s+\S/.test(l))
        .map((l, idx) => ({
          label: OPTION_LABELS[idx] || String(idx + 1),
          text: l.replace(/^[-*]\s+/, "").replace(/\s*✓\s*$/, "").trim(),
          correct: isTeacher && l.includes("✓"),
        }));
    }
    return optionLines
      .filter(l => /^[A-D][.\s)]{1,2}\s*\S/.test(l))
      .map(l => ({
        label: l[0],
        text: l.slice(1).replace(/^[.\s)]+/, "").replace(/\s*✓\s*$/, "").trim(),
        correct: isTeacher && l.includes("✓"),
      }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: blocks.length > 1 ? "20px" : "0" }}>
      {blocks.map((block, blockIdx) => {
        const hasBullet = block.optionLines.filter(l => /^[-*]\s+\S/.test(l)).length >= 2;
        const options = parseOptions(block.optionLines, hasBullet);
        const gridCols = options.length > 2 ? 2 : 1;
        return (
          <div key={blockIdx}>
            {block.questionLines.length > 0 && (
              <div style={{
                fontSize: `${fmt.fontSize}px`,
                fontFamily: fmt.fontFamily,
                lineHeight: String(fmt.lineHeight),
                color: "#1e293b",
                marginBottom: "10px",
              }} dangerouslySetInnerHTML={{ __html: renderMath(block.questionLines.join(" ")) }} />
            )}
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gap: "8px",
            }}>
              {options.map(({ label, text, correct }) => (
                <div key={label} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `1.5px solid ${correct ? GREEN : `${accentColor}33`}`,
                  background: correct ? "#f0fdf4" : overlayColor,
                }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: `2px solid ${correct ? GREEN : accentColor}`,
                    background: correct ? GREEN : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: `${Math.max(fmt.fontSize - 3, 9)}px`,
                    fontWeight: 700,
                    color: correct ? "white" : accentColor,
                    fontFamily: fmt.fontFamily,
                  }}>{label}</div>
                  <span
                    style={{
                      fontSize: `${fmt.fontSize}px`,
                      fontFamily: fmt.fontFamily,
                      color: correct ? GREEN : "#1e293b",
                      fontWeight: correct ? 600 : 400,
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMath(text) }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 3. GAP FILL INLINE ───────────────────────────────────────────────────────
function GapFillInlineSection({
  content, fmt, overlayColor = "white",
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
  overlayColor?: string;
}) {
  const raw = stripLayoutTag(content);
  const accentColor = fmt.accentColor || "#2A6F6F";

  // Split off word bank — supports "WORD BANK:", "Word Bank:", inline after last blank
  const lines = raw.split("\n");
  const wbIdx = lines.findIndex(l => /^WORD BANK:/i.test(l.trim()) || /^word bank:/i.test(l.trim()));
  const paraLines = wbIdx >= 0 ? lines.slice(0, wbIdx) : lines;
  const wbLine    = wbIdx >= 0 ? lines[wbIdx] : null;
  const wbWords   = wbLine
    ? wbLine.replace(/^WORD BANK:\s*/i, "").split(/[|,]/).map((w: string) => w.trim()).filter(Boolean)
    : [];

  // Join paragraph — preserve intentional line breaks
  const paraText = paraLines.join(" ").trim();

  // Render the paragraph — replace ___ sequences with styled blanks
  const parts = paraText.split(/_{3,}/g);

  return (
    <div>
      <p style={{
        fontSize: `${fmt.fontSize}px`,
        fontFamily: fmt.fontFamily,
        lineHeight: String(fmt.lineHeight + 0.2),
        color: "#1e293b",
        marginBottom: "12px",
      }}>
        {parts.map((part, i) => (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: renderMath(part) }} />
            {i < parts.length - 1 && (
              <span style={{
                display: "inline-block",
                borderBottom: `2px solid ${accentColor}`,
                minWidth: "80px",
                height: "1.2em",
                margin: "0 3px",
                verticalAlign: "bottom",
              }} />
            )}
          </span>
        ))}
      </p>
      {wbWords.length > 0 && (
        <div style={{
          border: `1.5px dashed ${accentColor}`,
          borderRadius: "6px",
          padding: "8px 12px",
          background: `${overlayColor}`,
          marginTop: "8px",
        }}>
          <span style={{
            fontSize: `${Math.max(fmt.fontSize - 2, 9)}px`,
            fontWeight: 700,
            color: "#6b7280",
            fontFamily: fmt.fontFamily,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            marginRight: "10px",
          }}>Word Bank:</span>
          {wbWords.map((w, i) => (
            <span key={i} style={{
              fontSize: `${fmt.fontSize}px`,
              fontFamily: fmt.fontFamily,
              fontWeight: 700,
              color: "#1e293b",
              marginRight: "16px",
            }}>{w}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 4. LABEL DIAGRAM ────────────────────────────────────────────────────────
function LabelDiagramSection({
  content, fmt, isTeacher = false, imageUrl, caption, attribution,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
  isTeacher?: boolean;
  imageUrl?: string;
  caption?: string;
  attribution?: string;
}) {
  const raw = stripLayoutTag(content);
  const accentColor = fmt.accentColor || "#1B2A4A";
  // Extract diagram spec from [[DIAGRAM:{...}]] marker
  const diagramSpec = extractDiagramSpec(raw);
  const textWithoutDiagram = stripDiagramMarker(raw);
  // Parse LABELS: and ANSWERS: lines from the text
  const lines = textWithoutDiagram.split("\n").filter(Boolean);
  const labelsLine  = lines.find((l: string) => /^LABELS:/i.test(l));
  const answersLine = lines.find((l: string) => /^ANSWERS:/i.test(l));
  const rawLabels = labelsLine
    ? labelsLine.replace(/^LABELS:/i, "").split("|").map((s: string) => s.trim())
    : (diagramSpec?.labels?.map((l: any) => l.text) || []);
  const answers = answersLine
    ? answersLine.replace(/^ANSWERS:/i, "").split("|").map((s: string) => s.trim())
    : [];
  // Instruction text (lines before LABELS: and ANSWERS:)
  const instructionLines = lines.filter((l: string) => !/^LABELS:/i.test(l) && !/^ANSWERS:/i.test(l));
  const instructionText = instructionLines.join(" ").trim();
  // Determine number of columns for word bank grid — 4 per row matches reference PDF
  const COLS = 4;
  return (
    <div>
      {/* Instruction text */}
      {instructionText && (
        <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b", marginBottom: "12px" }}
          dangerouslySetInnerHTML={{ __html: renderMath(instructionText) }} />
      )}
      {/* Diagram image — centred, with italic caption below */}
      {imageUrl && (
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <img
            src={imageUrl}
            alt={caption || "Diagram"}
            style={{ maxWidth: "420px", width: "100%", borderRadius: "6px", border: "1px solid #e5e7eb", display: "inline-block" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          {caption && (
            <p style={{ fontSize: `${fmt.fontSize - 2}px`, color: "#6b7280", marginTop: "4px", fontStyle: "italic", fontFamily: fmt.fontFamily, textAlign: "center" }}>
              {caption}
            </p>
          )}
          {attribution && !/wikimedia|wikipedia|commons\.wiki/i.test(attribution) && (
            <p style={{ fontSize: `${fmt.fontSize - 3}px`, color: "#9ca3af", marginTop: "2px", fontFamily: fmt.fontFamily, textAlign: "center" }}>
              Source: {attribution}
            </p>
          )}
        </div>
      )}
      {/* SVG diagram fallback if no imageUrl */}
      {!imageUrl && diagramSpec && (
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <SVGDiagram
            spec={diagramSpec}
            width={420}
            height={220}
            fontFamily={fmt.fontFamily}
            fontSize={fmt.fontSize - 1}
            accentColor={accentColor}
            showCallouts={isTeacher}
          />
          {caption && (
            <p style={{ fontSize: `${fmt.fontSize - 2}px`, color: "#6b7280", marginTop: "4px", fontStyle: "italic", fontFamily: fmt.fontFamily, textAlign: "center" }}>
              {caption}
            </p>
          )}
        </div>
      )}
      {/* Word bank header + grid table */}
      {rawLabels.length > 0 && (
        <>
          <div style={{ fontSize: `${fmt.fontSize - 1}px`, fontWeight: 700, color: "#1e293b", fontFamily: fmt.fontFamily, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "6px" }}>
            WORD BANK
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, marginBottom: "0" }}>
            <tbody>
              {Array.from({ length: Math.ceil(rawLabels.length / COLS) }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {Array.from({ length: COLS }).map((_, colIdx) => {
                    const lbl = rawLabels[rowIdx * COLS + colIdx];
                    const ansIdx = rowIdx * COLS + colIdx;
                    return (
                      <td key={colIdx} style={{ border: "1px solid #d1d5db", padding: "8px 12px", textAlign: "center" as const, fontWeight: isTeacher ? 400 : 700, color: isTeacher && answers[ansIdx] ? "#166534" : "#1e293b", width: `${100 / COLS}%` }}>
                        {isTeacher ? (answers[ansIdx] || lbl || "") : (lbl || " ")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
// ── 5. DIAGRAM + SUB-QUESTIONS ────────────────────────────────────────────────
function DiagramSubQSection({
  content, fmt, overlayColor = "white", imageUrl, caption, attribution, isTeacher = false,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
  overlayColor?: string;
  imageUrl?: string;
  caption?: string;
  attribution?: string;
  isTeacher?: boolean;
}) {
  const raw = stripLayoutTag(content);
  const accentColor = fmt.accentColor || "#1B2A4A";
  const answerLineH = fmt.answerLineHeight || 26;

  // Extract diagram spec from [[DIAGRAM:{...}]] marker
  const diagramSpec = extractDiagramSpec(raw);
  const textWithoutDiagram = stripDiagramMarker(raw);
  const lines = textWithoutDiagram.split("\n").filter(Boolean);
  // Sub-questions: lines starting with (a), (b), (c) ...
  const subQLines = lines.filter(l => /^\([a-e]\)/.test(l.trim()));

  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      {/* Diagram panel — real image, SVG spec, or plain box */}
      <div style={{ flex: "0 0 48%" }}>
        {imageUrl ? (
          <div style={{ border: `1px solid #e5e7eb`, borderRadius: "6px", overflow: "hidden", background: "white" }}>
            <img
              src={imageUrl}
              alt={caption || "Diagram"}
              style={{ width: "100%", maxWidth: "280px", display: "block", objectFit: "contain" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            {attribution && !/wikimedia|wikipedia|commons\.wiki/i.test(attribution) && (
              <div style={{ fontSize: "9px", color: "#9ca3af", padding: "2px 6px", fontFamily: fmt.fontFamily }}>{attribution}</div>
            )}
          </div>
        ) : diagramSpec && diagramSpec.type !== "labeled" ? (
          <SVGDiagram
            spec={diagramSpec}
            width={280}
            height={220}
            fontFamily={fmt.fontFamily}
            fontSize={fmt.fontSize - 1}
            accentColor={accentColor}
            showCallouts={isTeacher}
          />
        ) : (
          <svg width="100%" height="180" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots-subq" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#cbd5e1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots-subq)" rx="4" />
          </svg>
        )}
      </div>
      {/* Sub-questions panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: "14px" }}>
        {subQLines.map((q, i) => (
          <div key={i}>
            <div style={{
              fontSize: `${fmt.fontSize}px`,
              fontFamily: fmt.fontFamily,
              lineHeight: String(fmt.lineHeight),
              color: "#1e293b",
              marginBottom: "4px",
              dangerouslySetInnerHTML: { __html: renderMath(q) },
            }} />
            {/* Answer lines */}
            {[0, 1, 2].map(li => (
              <div key={li} style={{
                borderBottom: "1px solid #d1d5db",
                height: `${answerLineH}px`,
                marginTop: "2px",
              }} />
            ))}
          </div>
        ))}
        {subQLines.length === 0 && (
          <div style={{
            color: "#9ca3af", fontStyle: "italic",
            fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily,
          }}>
            {formatContent(raw, fmt)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 6. TABLE COMPLETE ────────────────────────────────────────────────────────
function TableCompleteSection({
  content, fmt, isTeacher = false,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
  isTeacher?: boolean;
}) {
  const raw = stripLayoutTag(content);
  // Filter: keep lines with pipes, remove pure separator rows (e.g. |---|---|)
  const lines = raw.split("\n").filter(l => l.includes("|") && !/^[\s|:-]+$/.test(l));
  if (lines.length === 0) {
    return <div>{formatContent(raw, fmt)}</div>;
  }

  const accentColor = fmt.accentColor || "#1B2A4A";
  // Strip leading/trailing pipes before splitting — handles both | col | col | and col | col
  const parseRow = (l: string) =>
    l.replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());

  // First non-separator line is always the header
  const header = parseRow(lines[0]);
  const rows   = lines.slice(1).map(parseRow);
  const colCount = Math.max(header.length, ...rows.map(r => r.length));
  const colW = `${Math.floor(100 / colCount)}%`;

  const isBlank = (cell: string) =>
    !cell || /^\.{2,}$/.test(cell.trim()) || /^_+$/.test(cell.trim()) || cell.trim() === "" || cell.trim() === "[blank]" || cell.trim() === "[answer]";

  return (
    <div style={{ overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as any, maxWidth: "100%" }}>
      <p style={{ fontSize: `${Math.max(fmt.fontSize - 1, 10)}px`, fontFamily: fmt.fontFamily, color: "#6b7280", fontStyle: "italic", marginBottom: "6px" }}>
        Complete the table.
      </p>
      <table style={{ width: "100%", minWidth: `${colCount * 90}px`, borderCollapse: "collapse" as const, tableLayout: "fixed" as const }}>
        <colgroup>
          {header.map((_, i) => <col key={i} style={{ width: colW }} />)}
        </colgroup>
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i} style={{
                background: accentColor,
                color: "white",
                padding: "8px 10px",
                fontSize: `${Math.max(fmt.fontSize - 1, 10)}px`,
                fontFamily: fmt.fontFamily,
                fontWeight: 700,
                textAlign: "center" as const,
                border: `1px solid ${accentColor}`,
                wordBreak: "break-word" as const,
                overflowWrap: "break-word" as const,
              }}>
                <span dangerouslySetInnerHTML={{ __html: renderMath(h || "\u2014") }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f8fafc" }}>
              {Array.from({ length: colCount }).map((_, ci) => {
                const cell = (row[ci] ?? "").trim();
                const blank = isBlank(cell) && !isTeacher;
                // Teacher view: show answer in green if it was a blank
                const teacherShowAnswer = isTeacher && isBlank(cell) && cell !== "";
                return (
                  <td key={ci} style={{
                    padding: "6px 8px",
                    border: "1px solid #e5e7eb",
                    fontSize: `${fmt.fontSize}px`,
                    fontFamily: fmt.fontFamily,
                    textAlign: "center" as const,
                    color: teacherShowAnswer ? "#166534" : "#1e293b",
                    background: blank ? "#fafafa" : undefined,
                    minHeight: "36px",
                    height: "36px",
                    wordBreak: "break-word" as const,
                    overflowWrap: "break-word" as const,
                    verticalAlign: "middle" as const,
                  }}>
                    {blank
                      ? <span style={{ display: "block", minWidth: "50px", minHeight: "22px" }}>&nbsp;</span>
                      : <span dangerouslySetInnerHTML={{ __html: renderMath(cell) }} />
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 7. DRAW BOX ──────────────────────────────────────────────────────────────
function DrawBoxSection({
  content, fmt,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
}) {
  const raw = stripLayoutTag(content);
  const accentColor = fmt.accentColor || "#1B2A4A";
  const lineH = fmt.lineHeight;

  // Parse bullet requirements
  const lines    = raw.split("\n");
  const reqStart = lines.findIndex(l => /must include:/i.test(l));
  const instrLines = reqStart > 0 ? lines.slice(0, reqStart) : lines.filter(l => !l.startsWith("•"));
  const reqLines   = reqStart > 0 ? lines.slice(reqStart + 1).filter(l => l.trim().startsWith("•")) : lines.filter(l => l.trim().startsWith("•"));

  return (
    <div>
      {instrLines.length > 0 && (
        <p style={{
          fontSize: `${fmt.fontSize}px`,
          fontFamily: fmt.fontFamily,
          lineHeight: String(lineH),
          color: "#1e293b",
          marginBottom: "8px",
        }}>
          {instrLines.join(" ")}
        </p>
      )}
      {reqLines.length > 0 && (
        <div style={{
          border: `1px solid ${accentColor}33`,
          borderRadius: "4px",
          padding: "6px 12px",
          marginBottom: "8px",
          background: "#f8fafc",
        }}>
          <span style={{ fontSize: `${Math.max(fmt.fontSize - 2, 10)}px`, fontWeight: 700, color: accentColor, fontFamily: fmt.fontFamily }}>
            Your drawing must include:
          </span>
          {reqLines.map((r, i) => (
            <div key={i} style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, color: "#374151" }}>
              {r}
            </div>
          ))}
        </div>
      )}
      {/* Dot-grid drawing area */}
      <div style={{
        position: "relative" as const,
        width: "100%",
        minHeight: "180px",
        border: `1.5px solid ${accentColor}44`,
        borderRadius: "6px",
        background: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
        backgroundSize: "12px 12px",
        backgroundPosition: "6px 6px",
      }}>
        <span style={{
          position: "absolute" as const,
          bottom: "6px",
          right: "10px",
          fontSize: "10px",
          color: "#d1d5db",
          fontFamily: fmt.fontFamily,
          fontStyle: "italic",
        }}>Drawing space</span>
      </div>
    </div>
  );
}

// ── 8. ORDERING ──────────────────────────────────────────────────────────────
function OrderingSection({
  content, fmt,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
}) {
  const raw = stripLayoutTag(content);
  const lines = raw.split("\n").filter(l => l.trim().startsWith("☐") || l.trim().match(/^\d+\.\s+/));
  const accentColor = fmt.accentColor || "#1B2A4A";

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
      {lines.map((line, i) => {
        const text = line.replace(/^☐\s*/, "").replace(/^\d+\.\s*/, "").trim();
        return (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <div style={{
              width: "32px",
              height: "28px",
              border: `1.5px solid ${accentColor}`,
              borderRadius: "4px",
              flexShrink: 0,
              background: "white",
            }} />
            <span style={{
              fontSize: `${fmt.fontSize}px`,
              fontFamily: fmt.fontFamily,
              lineHeight: String(fmt.lineHeight),
              color: "#1e293b",
            }}>{text}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── 9. MATCHING ──────────────────────────────────────────────────────────────
function MatchingSection({
  content, fmt,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
}) {
  const raw = stripLayoutTag(content);
  const accentColor = fmt.accentColor || "#1B2A4A";
  const lines = raw.split("\n").filter(l => l.match(/^\d+\.\s.+←→.+/) || l.match(/^\d+\.\s/));

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
      {lines.map((line, i) => {
        const parts = line.replace(/^\d+\.\s*/, "").split("←→");
        const left  = parts[0]?.trim() || line;
        const right = parts[1]?.trim();
        return (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "1fr 40px 1fr",
            alignItems: "center",
            gap: "8px",
          }}>
            <div style={{
              padding: "6px 10px",
              border: `1.5px solid ${accentColor}44`,
              borderRadius: "6px",
              fontSize: `${fmt.fontSize}px`,
              fontFamily: fmt.fontFamily,
              color: "#1e293b",
              background: "#f8fafc",
            }}>{left}</div>
            <div style={{
              width: "100%",
              borderBottom: `1.5px dashed #9ca3af`,
              height: "1px",
              alignSelf: "center",
            }} />
            <div style={{
              padding: "6px 10px",
              border: `1.5px solid ${accentColor}44`,
              borderRadius: "6px",
              fontSize: `${fmt.fontSize}px`,
              fontFamily: fmt.fontFamily,
              color: "#1e293b",
              background: "#f8fafc",
            }}>{right || "___________"}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── 10. ANNOTATION TASK ────────────────────────────────────────────────────
function AnnotationTaskSection({
  content, fmt, isTeacher = false,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
  isTeacher?: boolean;
}) {
  const raw = stripLayoutTag(content);
  const accentColor = fmt.accentColor || "#1B2A4A";
  const answerLineH = fmt.answerLineHeight || 26;

  // Parse SOURCE: and ANNOTATION N: lines
  const sourceMatch = raw.match(/SOURCE:\s*([\s\S]*?)(?=ANNOTATION\s*1:|$)/i);
  const sourceText = sourceMatch ? sourceMatch[1].trim() : raw;

  const annotations: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const m = raw.match(new RegExp(`ANNOTATION\\s*${i}:\\s*([^\\n]+)`, 'i'));
    if (m) annotations.push(m[1].trim());
  }

  // Replace [①][②][③][④] with styled red circle spans
  const circleChars = ['\u2460', '\u2461', '\u2462', '\u2463'];
  const bracketedCircles = ['[\u2460]', '[\u2461]', '[\u2462]', '[\u2463]'];
  let renderedSource = sourceText;
  bracketedCircles.forEach((bc, i) => {
    renderedSource = renderedSource.replace(
      new RegExp(bc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#ef4444;color:white;font-size:10px;font-weight:700;margin:0 2px;vertical-align:middle">${i + 1}</span>`
    );
  });
  circleChars.forEach((cc, i) => {
    renderedSource = renderedSource.replace(
      new RegExp(cc, 'g'),
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#ef4444;color:white;font-size:10px;font-weight:700;margin:0 2px;vertical-align:middle">${i + 1}</span>`
    );
  });

  const annotationCount = Math.max(annotations.length, 4);

  return (
    <div>
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        {/* Left: source text box */}
        <div style={{ flex: "0 0 55%" }}>
          <div style={{
            borderLeft: "4px solid #0d9488",
            background: "#FEFCE8",
            borderRadius: "0 6px 6px 0",
            padding: "14px 16px",
            fontSize: `${fmt.fontSize + 1}px`,
            fontFamily: fmt.fontFamily,
            lineHeight: String(fmt.lineHeight),
            fontStyle: "italic",
            color: "#1e293b",
          }}>
            <div dangerouslySetInnerHTML={{ __html: renderedSource }} />
          </div>
        </div>
        {/* Right: annotation response lines */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: "14px" }}>
          {Array.from({ length: annotationCount }).map((_, i) => (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: "#ef4444", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</div>
                {isTeacher && annotations[i] ? (
                  <span style={{ fontSize: `${Math.max(fmt.fontSize - 1, 10)}px`, fontFamily: fmt.fontFamily, color: "#166534", fontStyle: "italic" }}>
                    {annotations[i]}
                  </span>
                ) : (
                  <span style={{ fontSize: `${Math.max(fmt.fontSize - 1, 10)}px`, fontFamily: fmt.fontFamily, color: "#6b7280" }}>
                    Annotate point {i + 1}
                  </span>
                )}
              </div>
              {[0, 1].map(li => (
                <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: `${answerLineH}px`, marginTop: "2px" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Bottom effect prompt */}
      <div style={{ marginTop: "12px" }}>
        <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, color: "#1e293b", marginBottom: "4px" }}>
          What effect does this have on the reader / result?
        </div>
        {[0, 1].map(li => (
          <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: `${answerLineH}px`, marginTop: "2px" }} />
        ))}
      </div>
    </div>
  );
}

// ── 11. BUILD-IT GRID ────────────────────────────────────────────────────
function BuildItGridSection({
  content, fmt, isTeacher = false,
}: {
  content: string;
  fmt: ReturnType<typeof getSendFormatting>;
  isTeacher?: boolean;
}) {
  const raw = stripLayoutTag(content);
  const answerLineH = fmt.answerLineHeight || 26;

  // Parse CONCEPT:, DEFINE IT:, EXAMPLE IT:, DRAW IT:, QUESTION IT:, LINK IT:
  const extract = (key: string) => {
    const m = raw.match(new RegExp(`${key}:\\s*([^\\n]+)`, 'i'));
    return m ? m[1].trim() : '';
  };
  const concept    = extract('CONCEPT');
  const defineIt   = extract('DEFINE IT');
  const exampleIt  = extract('EXAMPLE IT');
  const drawIt     = extract('DRAW IT');
  const questionIt = extract('QUESTION IT');
  const linkIt     = extract('LINK IT');

  const cells = [
    { label: 'Define it',    bg: '#1B2A4A', text: defineIt,   hint: 'Write the definition...' },
    { label: 'Example it',   bg: '#0d9488', text: exampleIt,  hint: 'Give a real-world example...' },
    { label: 'Draw / Sketch it', bg: '#d97706', text: drawIt, hint: '', isDraw: true },
    { label: 'Question it',  bg: '#7c3aed', text: questionIt, hint: 'Write a question you still have...' },
  ];

  return (
    <div>
      {/* Concept header */}
      {concept && (
        <div style={{
          background: "#f1f5f9",
          border: "1.5px solid #cbd5e1",
          borderRadius: "6px",
          padding: "8px 14px",
          marginBottom: "10px",
          fontSize: `${fmt.fontSize + 1}px`,
          fontFamily: fmt.fontFamily,
          fontWeight: 700,
          color: "#1B2A4A",
        }}>
          Concept: {concept}
        </div>
      )}
      {/* 2×2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {cells.map((cell, i) => (
          <div key={i} style={{ border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
            {/* Coloured header band */}
            <div style={{
              background: cell.bg,
              color: "white",
              padding: "6px 10px",
              fontSize: `${Math.max(fmt.fontSize - 1, 10)}px`,
              fontFamily: fmt.fontFamily,
              fontWeight: 700,
            }}>
              {cell.label}
            </div>
            {/* Content area */}
            <div style={{ padding: "8px 10px", background: "white", minHeight: "80px" }}>
              {cell.isDraw ? (
                <svg width="100%" height="70" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`dots-grid-${i}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="0.8" fill="#cbd5e1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#dots-grid-${i})`} rx="4" />
                  {isTeacher && cell.text && (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: "10px", fill: "#166534", fontStyle: "italic" }}>
                      {cell.text}
                    </text>
                  )}
                </svg>
              ) : isTeacher && cell.text ? (
                <div style={{ fontSize: `${Math.max(fmt.fontSize - 1, 10)}px`, fontFamily: fmt.fontFamily, color: "#166534", fontStyle: "italic" }}>
                  {cell.text}
                </div>
              ) : (
                <div>
                  {[0, 1, 2].map(li => (
                    <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: `${answerLineH}px`, marginTop: "2px" }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Link it — full width */}
      <div style={{ marginTop: "8px", border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ background: "#0f172a", color: "white", padding: "6px 10px", fontSize: `${Math.max(fmt.fontSize - 1, 10)}px`, fontFamily: fmt.fontFamily, fontWeight: 700 }}>
          Link it — connect this to another concept
        </div>
        <div style={{ padding: "8px 10px", background: "white" }}>
          {isTeacher && linkIt ? (
            <div style={{ fontSize: `${Math.max(fmt.fontSize - 1, 10)}px`, fontFamily: fmt.fontFamily, color: "#166534", fontStyle: "italic" }}>{linkIt}</div>
          ) : (
            <div style={{ borderBottom: "1px solid #d1d5db", height: `${answerLineH}px` }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Error Detection & Correction ─────────────────────────────────────────────
function ErrorCorrectionSection({
  content, fmt, isTeacher = false,
}: { content: string; fmt: ReturnType<typeof getSendFormatting>; isTeacher?: boolean }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  // Parse sections: WORKED_ANSWER / MISTAKE / TASKS
  let workedAnswer: string[] = [];
  let mistakeHint = "";
  let tasks: string[] = [];
  let mode: "worked" | "mistake" | "tasks" | "none" = "none";
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^(worked answer|student answer|student.?s answer|incorrect answer|given answer)/i.test(line)) { mode = "worked"; continue; }
    if (/^(mistake|error|what.?s wrong|hint)/i.test(line)) { mode = "mistake"; continue; }
    if (/^(task|your task|questions|find|identify|correct|explain)/i.test(line)) { mode = "tasks"; continue; }
    if (mode === "worked") workedAnswer.push(line);
    else if (mode === "mistake") mistakeHint = line;
    else if (mode === "tasks") tasks.push(line.replace(/^[\d.)-]+\s*/, ""));
    else workedAnswer.push(line); // fallback: treat as worked answer
  }
  if (tasks.length === 0) tasks = ["Identify the mistake", "Explain why it is wrong", "Write the correct answer"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontFamily, fontSize: `${textSize}px`, lineHeight }}>
      {/* Left: Worked answer box */}
      <div style={{ border: "2px solid #dc2626", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ background: "#dc2626", color: "white", padding: "5px 10px", fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, fontFamily }}>
          ⚠ Student Answer — contains an error
        </div>
        <div style={{ padding: "10px 12px", background: "#fff5f5" }}>
          {workedAnswer.map((line, i) => (
            <div key={i} style={{ fontSize: `${textSize}px`, fontFamily, marginBottom: "4px", color: "#1a1a1a" }}>{line}</div>
          ))}
          {isTeacher && mistakeHint && (
            <div style={{ marginTop: "8px", padding: "4px 8px", background: "#fee2e2", borderRadius: "4px", fontSize: `${Math.max(textSize - 1, 10)}px`, color: "#991b1b", fontStyle: "italic" }}>
              Teacher: {mistakeHint}
            </div>
          )}
        </div>
      </div>
      {/* Right: Task boxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {tasks.map((task, i) => (
          <div key={i} style={{ border: "1.5px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ background: "#1e293b", color: "white", padding: "4px 8px", fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, fontFamily }}>
              {i + 1}. {task}
            </div>
            <div style={{ padding: "6px 8px", minHeight: "32px", background: "white" }}>
              {isTeacher ? null : <div style={{ borderBottom: "1px solid #d1d5db", height: "28px" }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ranking / Ordering ────────────────────────────────────────────────────────
function RankingSection({
  content, fmt, isTeacher = false,
}: { content: string; fmt: ReturnType<typeof getSendFormatting>; isTeacher?: boolean }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  // Parse: instruction line, items (bullet/numbered), explanation prompt
  let instruction = "";
  let items: string[] = [];
  let explanationPrompt = "";
  let correctOrder: string[] = [];
  for (const line of lines) {
    if (/^(order|rank|arrange|put|sort|place)/i.test(line) && !instruction) { instruction = line; continue; }
    if (/^(explain|justify|reason|why)/i.test(line)) { explanationPrompt = line; continue; }
    if (/^(correct order|answer|teacher)/i.test(line)) continue;
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+[.)\s]+(.+)$/);
    if (bulletMatch) items.push(bulletMatch[1]);
    else if (line && !instruction) instruction = line;
  }
  if (items.length === 0) items = lines.filter(l => l.length < 60);
  if (!explanationPrompt) explanationPrompt = "Explain your reasoning:";

  // Shuffle items for student view
  const displayItems = [...items];

  return (
    <div style={{ fontFamily, fontSize: `${textSize}px`, lineHeight }}>
      {instruction && (
        <div style={{ marginBottom: "10px", fontWeight: 600, color: "#1a2744", fontSize: `${textSize}px`, fontFamily }}>{instruction}</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
        {/* Left: items to rank */}
        <div>
          <div style={{ fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily }}>Items</div>
          {displayItems.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", padding: "6px 10px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "6px" }}>
              <span style={{ fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, color: "#94a3b8", fontFamily }}>{String.fromCharCode(65 + i)}</span>
              <span style={{ fontSize: `${textSize}px`, fontFamily, color: "#1a1a1a" }}>{item}</span>
            </div>
          ))}
        </div>
        {/* Right: ranking boxes */}
        <div>
          <div style={{ fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily }}>Your Ranking (1 = highest)</div>
          {displayItems.map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#1e293b", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${Math.max(textSize - 2, 9)}px`, fontWeight: 700, fontFamily, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, borderBottom: "1.5px solid #9ca3af", height: "24px" }} />
            </div>
          ))}
        </div>
      </div>
      {/* Explanation box */}
      <div style={{ border: "1.5px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
        <div style={{ background: "#1e293b", color: "white", padding: "4px 10px", fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, fontFamily }}>{explanationPrompt}</div>
        <div style={{ padding: "8px 10px", background: "white" }}>
          {[0, 1, 2].map(i => <div key={i} style={{ borderBottom: "1px solid #e5e7eb", height: "22px", marginBottom: "4px" }} />)}
        </div>
      </div>
    </div>
  );
}

// ── What Changed? ─────────────────────────────────────────────────────────────
function WhatChangedSection({
  content, fmt, isTeacher = false,
}: { content: string; fmt: ReturnType<typeof getSendFormatting>; isTeacher?: boolean }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  let scenarioA: string[] = [];
  let scenarioB: string[] = [];
  let questions: string[] = [];
  let mode: "a" | "b" | "q" | "none" = "none";
  for (const line of lines) {
    if (/^(scenario a|situation a|before|circuit a|state a|condition a)/i.test(line)) { mode = "a"; continue; }
    if (/^(scenario b|situation b|after|circuit b|state b|condition b)/i.test(line)) { mode = "b"; continue; }
    if (/^(question|task|your task|what|explain|describe|why)/i.test(line)) { mode = "q"; }
    if (mode === "a") scenarioA.push(line);
    else if (mode === "b") scenarioB.push(line);
    else if (mode === "q") questions.push(line.replace(/^[\d.)-]+\s*/, ""));
    else scenarioA.push(line); // fallback
  }
  if (questions.length === 0) questions = ["What changed between A and B?", "Why did this happen?", "What effect does this have?"];

  return (
    <div style={{ fontFamily, fontSize: `${textSize}px`, lineHeight }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        {/* Scenario A */}
        <div style={{ border: "2px solid #2563eb", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ background: "#2563eb", color: "white", padding: "5px 10px", fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, fontFamily }}>Scenario A</div>
          <div style={{ padding: "8px 10px", background: "#eff6ff", minHeight: "48px" }}>
            {scenarioA.map((l, i) => <div key={i} style={{ fontSize: `${textSize}px`, fontFamily, color: "#1e3a5f", marginBottom: "3px" }}>{l}</div>)}
          </div>
        </div>
        {/* Scenario B */}
        <div style={{ border: "2px solid #7c3aed", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ background: "#7c3aed", color: "white", padding: "5px 10px", fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, fontFamily }}>Scenario B</div>
          <div style={{ padding: "8px 10px", background: "#f5f3ff", minHeight: "48px" }}>
            {scenarioB.map((l, i) => <div key={i} style={{ fontSize: `${textSize}px`, fontFamily, color: "#3b0764", marginBottom: "3px" }}>{l}</div>)}
          </div>
        </div>
      </div>
      {/* Questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {questions.map((q, i) => (
          <div key={i} style={{ border: "1.5px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ background: "#0f172a", color: "white", padding: "4px 10px", fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, fontFamily }}>{i + 1}. {q}</div>
            <div style={{ padding: "6px 10px", background: "white" }}>
              {[0, 1].map(j => <div key={j} style={{ borderBottom: "1px solid #e5e7eb", height: "22px", marginBottom: "4px" }} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Constraint Problem ────────────────────────────────────────────────────────
function ConstraintProblemSection({
  content, fmt, isTeacher = false,
}: { content: string; fmt: ReturnType<typeof getSendFormatting>; isTeacher?: boolean }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

  let goal = "";
  let constraints: string[] = [];
  let outputFormat = "";
  let mode: "goal" | "constraints" | "output" | "none" = "none";
  for (const line of lines) {
    if (/^(goal|task|problem|design|create|find|calculate)/i.test(line) && !goal) { goal = line; mode = "goal"; continue; }
    if (/^(constraint|rule|condition|must|limit|requirement)/i.test(line)) { mode = "constraints"; continue; }
    if (/^(output|answer|draw|explain|show|write|calculate)/i.test(line)) { outputFormat = line; mode = "output"; continue; }
    if (mode === "constraints") {
      const m = line.match(/^[-*•\d.)-]+\s*(.+)$/);
      constraints.push(m ? m[1] : line);
    } else if (mode === "goal" && !goal) goal = line;
    else if (mode === "none") {
      const m = line.match(/^[-*•]\s*(.+)$/);
      if (m) constraints.push(m[1]);
      else if (!goal) goal = line;
    }
  }
  if (!outputFormat) outputFormat = "Show your working below:";

  return (
    <div style={{ fontFamily, fontSize: `${textSize}px`, lineHeight }}>
      {goal && (
        <div style={{ marginBottom: "10px", padding: "8px 12px", background: "#fef3c7", border: "2px solid #d97706", borderRadius: "8px" }}>
          <div style={{ fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, color: "#92400e", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily }}>Your Task</div>
          <div style={{ fontSize: `${textSize}px`, fontFamily, color: "#1a1a1a", fontWeight: 600 }}>{goal}</div>
        </div>
      )}
      {constraints.length > 0 && (
        <div style={{ marginBottom: "10px", border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ background: "#1e293b", color: "white", padding: "5px 10px", fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, fontFamily }}>Constraints — you MUST follow all of these</div>
          <div style={{ padding: "8px 12px", background: "#f8fafc" }}>
            {constraints.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "5px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "4px", border: "2px solid #1e293b", flexShrink: 0, marginTop: "1px" }} />
                <span style={{ fontSize: `${textSize}px`, fontFamily, color: "#1a1a1a" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Work space */}
      <div style={{ border: "1.5px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
        <div style={{ background: "#0f172a", color: "white", padding: "4px 10px", fontSize: `${Math.max(textSize - 1, 10)}px`, fontWeight: 700, fontFamily }}>{outputFormat}</div>
        <div style={{ padding: "8px 10px", background: "white", minHeight: "80px" }}>
          {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ borderBottom: "1px solid #e5e7eb", height: "22px", marginBottom: "4px" }} />)}
        </div>
      </div>
    </div>
  );
}

function VocabSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
  const { fontSize: textSize, fontFamily, lineHeight, letterSpacing } = fmt;
  // Filter out pure header/separator rows: lines whose trimmed content (after stripping outer pipes)
  // consists only of "Term", "Word", "Keyword", dashes, or similar header patterns.
  const lines = content.split("\n").filter(l => {
    const t = l.trim().replace(/^\|/, "").replace(/\|$/, "").trim();
    if (!t) return false;
    if (/^[-\s|]+$/.test(t)) return false; // separator row --- | ---
    if (/^(term|word|keyword|key\s*word|vocabulary)(\s*\|\s*.+)?$/i.test(t)) return false;
    return true;
  });
  const entries = lines.map(l => {
    // Normalise: strip leading/trailing pipes before splitting (markdown table format)
    const normalised = l.trim().replace(/^\|/, "").replace(/\|$/, "");
    const parts = normalised.split("|");
    if (parts.length >= 2) return { term: parts[0].trim(), def: parts.slice(1).join("|").trim() };
    // Handle em-dash separator: **Term** — definition  (used in library entries)
    // Matches both Unicode em-dash (\u2014) and ' — ' with spaces
    const emDashMatch = normalised.match(/^(.+?)\s*[\u2014\u2013]\s*(.+)$/);
    if (emDashMatch) {
      // Strip markdown bold markers from term
      const rawTerm = emDashMatch[1].trim().replace(/^\*\*(.+)\*\*$/, '$1');
      return { term: rawTerm, def: emDashMatch[2].trim() };
    }
    // Handle hyphen-space separator: **Term** - definition  (legacy format)
    const hyphenMatch = normalised.match(/^(.+?)\s+-\s+(.+)$/);
    if (hyphenMatch) {
      const rawTerm = hyphenMatch[1].trim().replace(/^\*\*(.+)\*\*$/, '$1');
      return { term: rawTerm, def: hyphenMatch[2].trim() };
    }
    const colonIdx = normalised.indexOf(":");
    if (colonIdx > 0) return { term: normalised.slice(0, colonIdx).trim(), def: normalised.slice(colonIdx + 1).trim() };
    return null;
  }).filter(Boolean) as { term: string; def: string }[];

  if (entries.length === 0) {
    return <div style={{ fontSize: `${textSize}px`, lineHeight, fontFamily, letterSpacing }}>{content}</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: "4px", padding: "5px 0", borderBottom: "1px solid #e5e7eb" }}>
          <span style={{ fontWeight: 700, color: "#1a2744", fontSize: `${textSize}px`, fontFamily, letterSpacing, flexShrink: 0, minWidth: "90px" }} dangerouslySetInnerHTML={{ __html: renderMath(e.term) + ":" }} />
          <span style={{ color: "#374151", fontSize: `${textSize}px`, lineHeight, fontFamily, letterSpacing }} dangerouslySetInnerHTML={{ __html: renderMath(e.def) }} />
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

  // ── Parse structured markers from AI output ──────────────────────────────
  // The AI generates content with these optional markers:
  //   SUBTITLE: <text>          — subtitle shown above the table
  //   CONFIDENCE_TABLE:         — starts the list of topic rows
  //   WRITTEN_PROMPTS:          — starts the written reflection prompts
  //   EXIT_TICKET: <text>       — custom exit ticket text
  // If no markers are present, fall back to the legacy line-based parser.

  let subtitle = "";
  let topics: string[] = [];
  let reflectionPrompts: string[] = [];
  let exitTicketText = "Write ONE thing you learned today in one sentence:";

  const hasMarkers = /CONFIDENCE_TABLE:|WRITTEN_PROMPTS:|SUBTITLE:|EXIT_TICKET:/i.test(content);

  if (hasMarkers) {
    // Split into labelled blocks
    const subtitleMatch = content.match(/SUBTITLE:\s*([^\n]+)/i);
    if (subtitleMatch) subtitle = subtitleMatch[1].trim();

    const ctMatch = content.match(/CONFIDENCE_TABLE:\s*([\s\S]*?)(?=WRITTEN_PROMPTS:|EXIT_TICKET:|$)/i);
    if (ctMatch) {
      topics = ctMatch[1].split("\n")
        .map(l => l.replace(/^[•\-\*\d.)\s]+/, "").trim())
        .filter(Boolean);
    }

    const wpMatch = content.match(/WRITTEN_PROMPTS:\s*([\s\S]*?)(?=EXIT_TICKET:|$)/i);
    if (wpMatch) {
      reflectionPrompts = wpMatch[1].split("\n")
        .map(l => l.replace(/^[•\-\*\d.)\s]+/, "").trim())
        .filter(Boolean);
    }

    const etMatch = content.match(/EXIT_TICKET:\s*([^\n]+)/i);
    if (etMatch) exitTicketText = etMatch[1].trim();
  } else if (/A\.?\s*How confident|\| Not Yet \| Getting There \| Confident|Not Yet.*Getting There.*Confident/i.test(content)) {
    // Library format (PDF-extracted): handles "A. How confident" and "A How confident" (no period)
    // Also handles PDF-extracted format with ■ checkboxes on separate lines
    const lines = content.split("\n");
    let inSectionA = false;
    let inSectionB = false;
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      // Skip pure checkbox/symbol lines and column header lines
      if (/^[■□✓✗\s]+$/.test(t)) continue;
      if (/^(Topic|Not Yet|Getting There|Confident)$/i.test(t)) continue;
      if (/^Review your understanding/i.test(t)) continue;
      if (/A\.?\s*How confident/i.test(t)) { inSectionA = true; inSectionB = false; continue; }
      if (/B\.?\s*(Written reflection|Write down|Reflection|Your thoughts|Thoughts)/i.test(t)) { inSectionA = false; inSectionB = true; continue; }
      if (/^Exit Ticket:/i.test(t)) { exitTicketText = t.replace(/^Exit Ticket:\s*/i, "").trim(); inSectionA = false; inSectionB = false; continue; }
      if (/^Check your understanding/i.test(t)) { subtitle = t; continue; }
      // "question I still want to ask" is a reflection prompt
      if (/question.*want.*ask|still.*want.*ask/i.test(t)) { reflectionPrompts.push(t); continue; }
      if (inSectionA) {
        // Lines like: "Series vs Parallel circuits | Not Yet | Getting There | Confident"
        // or just: "Series vs Parallel circuits" (PDF-extracted, one topic per line)
        const topicMatch = t.match(/^(.+?)\s*\|\s*Not Yet/i);
        if (topicMatch) {
          topics.push(topicMatch[1].trim());
        } else if (!/Not Yet|Getting There|Confident|■|□/i.test(t)) {
          const cleaned = t.replace(/^[•\-\*\d.)\s]+/, "").trim();
          if (cleaned.length > 2) topics.push(cleaned);
        }
      } else if (inSectionB) {
        const cleaned = t.replace(/^[•\-\*\d.)\s]+/, "").trim();
        if (cleaned.length > 2) reflectionPrompts.push(cleaned);
      }
    }
  } else {
    // Legacy parser: lines without Q: or > prefix are topic rows
    const lines = content.split("\n").filter(l => l.trim());
    const topicLines = lines.filter(l => !l.trim().startsWith("Q:") && !l.trim().startsWith(">"));
    reflectionPrompts = lines.filter(l => l.trim().startsWith("Q:") || l.trim().startsWith(">")).map(l => l.replace(/^[Q:>]\s*/i, "").trim());
    topics = topicLines.map(l => l.replace(/^[•\-\*\d.)]\s*/, "").replace(/^I can\s*/i, "").trim()).filter(Boolean);
  }

  // Ensure we always have at least 3 topic rows (pad with generic ones if needed)
  while (topics.length < 3) {
    topics.push("I can apply what I have learned today");
  }

  return (
    <div style={{ fontFamily }}>
      {/* Subtitle */}
      {subtitle && (
        <div style={{ fontSize: `${textSize}px`, color: "#4b5563", fontFamily, marginBottom: "10px", fontStyle: "italic" }}>
          {subtitle}
        </div>
      )}
      {/* Part A: Confidence table */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: `${textSize - 1}px`, fontWeight: 600, color: "#374151", fontFamily, marginBottom: "8px", fontStyle: "italic" }}>
          A &nbsp; How confident do you feel? Tick the column that best describes you.
        </div>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 80px", borderBottom: "2px solid #1a2744" }}>
          <div style={{ fontSize: `${textSize - 2}px`, fontWeight: 700, color: "#1a2744", fontFamily, padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Topic</div>
          {["Not Yet", "Getting There", "Confident"].map((col, ci) => (
            <div key={ci} style={{ fontSize: `${textSize - 2}px`, fontWeight: 700, color: "#1a2744", fontFamily, padding: "4px 4px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em" }}>{col}</div>
          ))}
        </div>
        {/* Table rows */}
        {topics.map((topic, ti) => (
          <div key={ti} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 80px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: `${textSize}px`, color: "#374151", fontFamily, lineHeight, padding: "7px 0" }}>{topic}</div>
            {[0, 1, 2].map(ci => (
              <div key={ci} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 4px" }}>
                <div style={{ width: "18px", height: "18px", border: "1.5px solid #9ca3af", borderRadius: "2px" }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Part B: Written reflection prompts */}
      {reflectionPrompts.length > 0 && (
        <div>
          <div style={{ fontSize: `${textSize - 1}px`, fontWeight: 600, color: "#374151", fontFamily, marginBottom: "10px", fontStyle: "italic" }}>
            B &nbsp; Written reflection — complete each prompt below.
          </div>
          {reflectionPrompts.map((prompt, pi) => (
            <div key={pi} style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: `${textSize}px`, color: "#374151", fontFamily, fontStyle: "italic", marginBottom: "4px" }}>{prompt}</div>
              {[0, 1].map(li => (
                <div key={li} style={{ borderBottom: "1px solid #ccc", height: "28px", marginBottom: "4px" }} />
              ))}
            </div>
          ))}
        </div>
      )}
      {/* Exit ticket */}
      <div style={{ marginTop: "16px", borderTop: "1.5px solid #d1d5db", paddingTop: "10px" }}>
        <div style={{ fontSize: `${textSize}px`, fontWeight: 700, color: "#1a2744", fontFamily, textDecoration: "underline", marginBottom: "6px" }}>
          Exit Ticket: {exitTicketText}
        </div>
        {[0, 1].map(li => (
          <div key={li} style={{ borderBottom: "1px solid #ccc", height: "28px", marginBottom: "4px" }} />
        ))}
      </div>
    </div>
  );
}

function WordBankSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
  const { fontSize: textSize, fontFamily } = fmt;
  // Strip any WORD BANK header line and split into words
  const rawWords = content.replace(/^WORD\s*BANK[:\s]*/im, "").split(/[\n,|]/).map(w => w.trim()).filter(Boolean);
  // Arrange into rows of 4
  const rows: string[][] = [];
  for (let i = 0; i < rawWords.length; i += 4) rows.push(rawWords.slice(i, i + 4));
  return (
    <div>
      <div style={{ fontSize: `${textSize - 3}px`, fontWeight: 700, color: "#888888", fontFamily, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "3px" }}>Word Bank</div>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "0.5px solid #cccccc" }}>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((word, ci) => (
                <td key={ci} style={{ border: "0.4px solid #cccccc", padding: "5px 8px", textAlign: "center", fontSize: `${textSize}px`, fontWeight: 700, color: "#1a1a1a", fontFamily, background: overlayColor }}>
                  <span dangerouslySetInnerHTML={{ __html: renderMath(word) }} />
                </td>
              ))}
              {/* Pad row to 4 cells */}
              {Array.from({ length: 4 - row.length }).map((_, pi) => (
                <td key={`pad-${pi}`} style={{ border: "0.4px solid #cccccc", padding: "5px 8px", background: overlayColor }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SentenceStartersSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const starters = content.split("\n").filter(l => l.trim()).map(l => l.replace(/^[•\-\*\d.)\s]+/, "").trim());
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px" }}>
      {starters.map((s, i) => (
        <div key={i} style={{ background: overlayColor, border: "1px solid #1B2A4A", borderRadius: "2px", padding: "6px 10px", fontSize: `${textSize - 1}px`, color: "#1B2A4A", fontStyle: "italic", fontFamily, lineHeight }}>
          "{s}..."
        </div>
      ))}
    </div>
  );
}

function MarkSchemeSection({ content, fmt }: { content: string; fmt: ReturnType<typeof getSendFormatting> }) {
  const { fontSize: textSize, fontFamily } = fmt;
  // Strip the TEACHER COPY header lines (already shown in the crimson banner above)
  const cleanContent = content
    .replace(/^TEACHER COPY[^\n]*\n?/im, '')
    .replace(/^Not for Student Distribution[^\n]*\n?/im, '')
    .replace(/^✓[^\n]*\n?/gm, (m) => m.startsWith('✓ Marking') ? m : '')
    .trim();
  const lines = cleanContent.split("\n");

  // Parse into typed entries: section-header, guidance, question, answer-line
  type MsEntry =
    | { kind: 'guidance'; text: string }
    | { kind: 'section'; text: string }
    | { kind: 'question'; qLabel: string; marks: string; rest: string }
    | { kind: 'answer'; text: string };

  const entries: MsEntry[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Section header: "SECTION 1 — RECALL", "CHALLENGE", etc.
    if (/^SECTION\s+\d|^CHALLENGE/i.test(line) && !/^Q\d/.test(line)) {
      entries.push({ kind: 'section', text: line });
      continue;
    }
    // Guidance line (first line starting with "Marking guidance")
    if (/^Marking guidance/i.test(line)) {
      entries.push({ kind: 'guidance', text: line });
      continue;
    }
    // Question header: Q1, Q2, Q1., Q1:, Q1 [2m], Q1 4m, QCh, Challenge Question, etc.
    const qMatch = line.match(/^(Q(?:Ch|\d+)|Challenge Question|Challenge)\s*[.:\-—]?\s*(.*?)\s*(?:(\[\d+m?\])|(?<![\w])([1-9]\d?m))?\s*$/i);
    if (qMatch) {
      entries.push({ kind: 'question', qLabel: qMatch[1], marks: qMatch[3] || qMatch[4] || '', rest: qMatch[2] || '' });
      continue;
    }
    // Standalone marks line: "4m", "7m", "3m" on its own line — attach to previous question
    if (/^\d+m$/.test(line)) {
      // Find the last question entry and update its marks
      for (let ei = entries.length - 1; ei >= 0; ei--) {
        const e = entries[ei];
        if (e.kind === 'question' && !e.marks) {
          (e as any).marks = line;
          break;
        }
      }
      continue;
    }
    // Everything else is an answer line
    entries.push({ kind: 'answer', text: line });
  }

  return (
    <div style={{ padding: "4px 0" }}>
      {entries.map((entry, ei) => {
        if (entry.kind === 'guidance') {
          return (
            <div key={ei} style={{ fontSize: `${textSize - 2}px`, color: "#9b1c1c", fontFamily, fontStyle: "italic", marginBottom: "12px" }}>
              {entry.text}
            </div>
          );
        }
        if (entry.kind === 'section') {
          return (
            <div key={ei} style={{ marginTop: ei > 0 ? "16px" : "0", marginBottom: "8px" }}>
              <div style={{ borderTop: "1.5px solid #2a7f8f", marginBottom: "4px" }} />
              <div style={{ fontSize: "8.5px", fontWeight: 700, color: "#2a7f8f", fontFamily, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {entry.text}
              </div>
              <div style={{ borderTop: "0.5px solid #d1d5db", marginTop: "4px" }} />
            </div>
          );
        }
        if (entry.kind === 'question') {
          return (
            <div key={ei} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "4px", marginTop: "10px" }}>
              <div style={{ minWidth: "28px", background: "#7f1d1d", color: "#fff", fontSize: "10px", fontWeight: 700, fontFamily, padding: "2px 5px", textAlign: "center" }}>
                {entry.qLabel}
              </div>
              <div style={{ flex: 1, fontSize: `${textSize - 1}px`, color: "#1a1a1a", fontFamily }}>
                {entry.rest}
              </div>
              {entry.marks && (
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#8b1a1a", fontFamily, whiteSpace: "nowrap" }}>
                  {entry.marks}
                </div>
              )}
            </div>
          );
        }
        // answer line
        return (
          <div key={ei} style={{ fontSize: `${textSize - 1}px`, color: "#374151", fontFamily, lineHeight: "1.6", paddingLeft: "36px", marginBottom: "2px" }}>
            {entry.text}
          </div>
        );
      })}
    </div>
  );
}
function WorkedExampleSection({ content, fmt }: { content: string; fmt: ReturnType<typeof getSendFormatting> }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;

  // Parse content into a title and ordered steps.
  // Supports two formats:
  //   1. "Worked example: <title>\n\n<step1>\n<step2>..." (seed script format)
  //   2. Plain numbered/bulleted lines (AI-generated format)
  const rawLines = content
    .replace(/\\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  // Extract title: first line that starts with "Worked example" or similar heading
  let title = "";
  let stepLines: string[] = [];

  const titleMatch = content.replace(/\\n/g, '\n').match(/^[Ww]orked[\s\-][Ee]xample[:\s]+([^\n]+)/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
    // All remaining non-empty lines are steps
    const afterTitle = rawLines.filter(l => !l.match(/^[Ww]orked[\s\-][Ee]xample[:\s]+/i));
    stepLines = afterTitle;
  } else {
    // No explicit title — treat first line as title if it looks like a heading
    if (rawLines.length > 0 && !/^\d+[.)\s]/.test(rawLines[0]) && !/^[•\-\*]/.test(rawLines[0])) {
      title = rawLines[0];
      stepLines = rawLines.slice(1);
    } else {
      stepLines = rawLines;
    }
  }

  // Clean step lines: strip leading numbers/bullets and trailing stray digits
  const steps = stepLines
    .map(l => l
      .replace(/^\d+[.)\s]+/, '')  // strip leading "1. " or "1) "
      .replace(/^[•\-\*]\s*/, '')  // strip leading bullets
      .replace(/\s+\d+\s*$/, '')   // strip trailing stray numbers (e.g. "...config = 2,8,1.4" → remove trailing "4")
      .trim()
    )
    .filter(Boolean);

  return (
    <div style={{ fontFamily }}>
      {/* Title */}
      {title && (
        <div style={{
          fontSize: `${textSize + 1}px`,
          fontWeight: 700,
          color: '#1a2744',
          fontFamily,
          marginBottom: '12px',
          borderBottom: '1.5px solid #1a2744',
          paddingBottom: '6px',
        }}>
          {title}
        </div>
      )}
      {/* Steps as ordered list */}
      <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {steps.map((step, i) => (
          <li key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '10px',
          }}>
            {/* Step number badge */}
            <div style={{
              minWidth: '24px',
              height: '24px',
              background: '#1a2744',
              color: '#ffffff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${textSize - 2}px`,
              fontWeight: 700,
              fontFamily,
              flexShrink: 0,
              marginTop: '1px',
            }}>
              {i + 1}
            </div>
            {/* Step text with math rendering */}
            <div
              style={{ fontSize: `${textSize}px`, color: '#1f2937', fontFamily, lineHeight, flex: 1 }}
              dangerouslySetInnerHTML={{ __html: renderMath(step) }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ReminderBoxSection({ content, fmt, overlayColor = "white" }: { content: string; fmt: ReturnType<typeof getSendFormatting>; overlayColor?: string }) {
  const { fontSize: textSize, fontFamily, lineHeight } = fmt;
  const lines = content.split("\n").filter(l => l.trim());
  const steps = lines.filter(l => /^Step\s*\d+/i.test(l.trim()));
  const otherLines = lines.filter(l => !/^Step\s*\d+/i.test(l.trim()));
  return (
    <div style={{ background: overlayColor, border: "1.5px solid #1B2A4A", borderRadius: "2px", padding: "10px 12px" }}>
      <div style={{ fontSize: `${textSize - 1}px`, fontWeight: 700, color: "#1B2A4A", marginBottom: "10px", fontFamily, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                  color: "#4f46e5",
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
  // Pre-process: split concatenated numbered problems onto separate lines.
  // The AI sometimes outputs problems separated by " . " (space-period-space)
  // without numbering, e.g. ". Problem one . Problem two . Problem three"
  // Step 1: Normalise \n escape sequences
  let normalised = content.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  // Step 2: Strip leading ". " artifact (AI sometimes starts content with a period)
  normalised = normalised.replace(/^[.\s]+/, '');
  // Step 3: Split on " . " (space-period-space) which the AI uses as a problem separator
  // but only when NOT inside a decimal number (e.g. £0.50) — require space on both sides
  // Also handle numbered: ". N." pattern
  const preprocessed = normalised
    .replace(/\?\s+\.\s+/g, '?\n')   // "? . " → newline (end of question sentence)
    .replace(/\.\s+(\d+[a-z]?[.)\s]\s*)/g, '.\n$1')  // ". N." → split before number
    .replace(/(,\s*)(\d+[a-z]?[.)\s]\s*)/g, '\n$2')   // ", N." → split
    .replace(/(;\s*)(\d+[a-z]?[.)\s]\s*)/g, '\n$2');  // "; N." → split
  // Split into individual problems by numbered lines or double newlines
  const lines = preprocessed.split("\n");
  const problems: string[][] = [];
  let current: string[] = [];
  lines.forEach(line => {
    const trimmed = line.trim().replace(/^[.\s]+/, ''); // strip leading ". " from each line
    const isNewProblem = /^\d+[.)\s]/.test(trimmed) && trimmed.length > 3;
    if (isNewProblem && current.length > 0) {
      problems.push(current);
      current = [trimmed];
    } else if (trimmed) {
      current.push(trimmed);
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
          border: "1.5px solid #4f46e5",
          borderRadius: "4px",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: `${textSize - 2}px`, fontWeight: 700, color: "#4f46e5", marginBottom: "6px", fontFamily, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY SCHOOL SECTION RENDERER
// Completely separate layout for KS1/KS2 — bright colours, big rounded boxes,
// exercise-book writing lines, friendly labels, child-appropriate spacing.
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY_BRIGHT_PALETTE = [
  { bg: "#fff0f6", border: "#f472b6", header: "linear-gradient(135deg,#f472b6,#ec4899)", text: "#831843", label: "pink"    },
  { bg: "#eff6ff", border: "#60a5fa", header: "linear-gradient(135deg,#60a5fa,#3b82f6)", text: "#1e3a8a", label: "blue"    },
  { bg: "#f0fdf4", border: "#4ade80", header: "linear-gradient(135deg,#4ade80,#22c55e)", text: "#14532d", label: "green"   },
  { bg: "#fff7ed", border: "#fb923c", header: "linear-gradient(135deg,#fb923c,#ea580c)", text: "#431407", label: "orange"  },
  { bg: "#faf5ff", border: "#c084fc", header: "linear-gradient(135deg,#c084fc,#a855f7)", text: "#4a1d96", label: "purple"  },
  { bg: "#ecfeff", border: "#22d3ee", header: "linear-gradient(135deg,#22d3ee,#06b6d4)", text: "#164e63", label: "cyan"    },
  { bg: "#fefce8", border: "#facc15", header: "linear-gradient(135deg,#facc15,#eab308)", text: "#713f12", label: "yellow"  },
  { bg: "#f0fdfa", border: "#2dd4bf", header: "linear-gradient(135deg,#2dd4bf,#14b8a6)", text: "#134e4a", label: "teal"    },
];

// Friendly badge text for section types in primary
function getPrimaryBadge(type: string): string {
  const map: Record<string, string> = {
    objective: "What We're Learning",
    success: "I Can...",
    vocabulary: "Key Words",
    starter: "Let's Warm Up!",
    example: "Look at This",
    "reminder-box": "Remember!",
    guided: "Try Together",
    independent: "Your Turn!",
    challenge: "Challenge Time!",
    "word-bank": "Word Bank",
    "sentence-starters": "How to Start",
    "self-assessment": "How Did I Do?",
    "self-reflection": "My Thinking",
    answers: "Answers",
    "mark-scheme": "Mark Scheme",
    "teacher-notes": "Teacher Notes",
    "word-problems": "Story Problems",
    comprehension: "Reading",
    reading: "Reading",
    passage: "Reading",
    "q-primary-activity": "Activity",
  };
  return map[type] || "";
}

function PrimarySection({
  section,
  sectionIndex,
  content,
  paletteIndex,
  fmt,
  overlayColor,
  editMode,
  isEdited,
  answerLines,
  onSectionClick,
  onAnswerBoxSizeChange,
  onAnswerBoxRemove,
  isTeacherSection,
}: {
  section: any;
  sectionIndex: number;
  content: string;
  paletteIndex: number;
  fmt: ReturnType<typeof getSendFormatting>;
  overlayColor?: string;
  editMode?: boolean;
  isEdited?: boolean;
  answerLines: number;
  onSectionClick?: (i: number) => void;
  onAnswerBoxSizeChange?: (i: number, n: number) => void;
  onAnswerBoxRemove?: (i: number) => void;
  isTeacherSection: boolean;
}) {
  const palette = PRIMARY_BRIGHT_PALETTE[paletteIndex % PRIMARY_BRIGHT_PALETTE.length];
  const titleText = (typeof section.title === "string" ? section.title : String(section.title || ""))
    .replace(/^\*{1,2}|\*{1,2}$/g, "").replace(/^_{1,2}|_{1,2}$/g, "").trim();
  const badgeText = getPrimaryBadge(section.type);
  // ── Systemic badge deduplication ─────────────────────────────────────────────
  // Don't show the badge subtitle when it would duplicate or closely echo the section
  // title. Covers: exact match, synonym match, and cases where the title already
  // contains the badge text (or vice-versa). This applies to ALL primary section types.
  const normTitle = titleText.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normBadge = badgeText.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Synonym pairs: if title matches any synonym of the badge, suppress the badge
  const BADGE_SYNONYMS: Record<string, string[]> = {
    vocabulary: ["keyvocabulary", "keywords", "keywords", "vocabulary", "glossary", "wordlist", "keyterms"],
    objective:  ["learningobjectives", "objective", "objectives", "whatwerelearning", "todaywearelearning", "wearelearing", "aim", "aims"],
    success:    ["successcriteria", "ican", "icando", "successcriteria", "learninggoals"],
    starter:    ["starteractivity", "warmup", "letswarmup", "bellwork", "starter"],
    example:    ["workedexample", "lookatthis", "example", "examples", "modelanswer"],
    guided:     ["trytogether", "guidedpractice", "guided", "foundation", "letstrytogether"],
    independent:["yourturn", "independent", "corepractice", "practice", "practise", "onyourown"],
    challenge:  ["challengetime", "challenge", "stretchandchallenge", "extension", "extrachallenge", "bonus"],
    "word-bank":["wordbank", "word-bank", "words"],
    "sentence-starters": ["sentencestarters", "howtostart", "sentenceframes"],
    "self-assessment": ["howdidido", "selfassessment", "selfassess", "reflection"],
    "word-problems": ["storyproblems", "wordproblems", "reallifeproblems", "reallife"],
    comprehension: ["reading", "readingpassage", "comprehension"],
  };
  const synonyms = BADGE_SYNONYMS[section.type] || [];
  const showBadge = !!(badgeText &&
    normTitle !== normBadge &&                        // exact match
    !normBadge.includes(normTitle) &&                 // badge contains title
    !normTitle.includes(normBadge) &&                 // title contains badge
    !synonyms.includes(normTitle));                   // title is a known synonym
  const needsWritingLines = !isTeacherSection &&
    (section.type === "independent" || section.type === "guided" || section.type === "challenge" || section.type === "q-primary-activity") &&
    !/sentence starter:|steps to follow:|quick start:|what you need to do:|help box|key facts|word bank/i.test(content || "");

  return (
    <div
      onClick={() => editMode && onSectionClick?.(sectionIndex)}
      style={{
        marginBottom: "14px",
        borderRadius: "18px",
        border: `3px solid ${palette.border}`,
        background: palette.bg,
        overflow: "hidden",
        cursor: editMode ? "pointer" : "default",
        outline: editMode && isEdited ? `3px solid ${palette.border}` : "none",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        boxShadow: `0 4px 16px ${palette.border}33, 0 1px 4px rgba(0,0,0,0.06)`,
      }}
    >
      {/* ── Colourful Header Bar ── */}
      <div style={{
        background: palette.header,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Big numbered bubble */}
          <div style={{
            background: "rgba(255,255,255,0.3)",
            border: "2.5px solid rgba(255,255,255,0.6)",
            borderRadius: "50%",
            width: "32px", height: "32px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 900,
            color: "#fff",
            flexShrink: 0,
            fontFamily: fmt.fontFamily,
          }}>
            {sectionIndex + 1}
          </div>
          <div>
            <div style={{
              fontWeight: 900,
              fontSize: `${fmt.fontSize + 4}px`,
              color: "#fff",
              fontFamily: fmt.fontFamily,
              lineHeight: "1.2",
              textShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}>
              {titleText}
            </div>
            {showBadge && (
              <div style={{
                fontSize: `${fmt.fontSize - 2}px`,
                color: "rgba(255,255,255,0.85)",
                fontFamily: fmt.fontFamily,
                fontWeight: 600,
                marginTop: "1px",
              }}>
                {badgeText}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {isTeacherSection && (
            <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "3px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 700 }}>
              TEACHER ONLY
            </span>
          )}
          {section.type === "guided"      && <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "3px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 700 }}>Together</span>}
          {section.type === "independent" && <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "3px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 700 }}>On Your Own</span>}
          {section.type === "challenge"   && <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "3px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 700 }}>Extra Challenge</span>}
        </div>
      </div>

      {/* ── Content Area ── */}
      <div style={{
        padding: "16px 18px",
        fontSize: `${fmt.fontSize + 2}px`,
        lineHeight: "2.0",
        fontFamily: fmt.fontFamily,
        color: palette.text,
        background: palette.bg,
      }}>
        {formatContent(content, fmt)}

        {/* Exercise-book style writing lines */}
        {needsWritingLines && answerLines > 0 && (
          <div style={{ marginTop: "14px" }}>
            {/* Edit controls */}
            {editMode && (
              <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: palette.border, fontFamily: fmt.fontFamily }}>Writing lines:</span>
                <button onClick={(e) => { e.stopPropagation(); onAnswerBoxSizeChange?.(sectionIndex, Math.max(1, answerLines - 1)); }}
                  style={{ width: "24px", height: "24px", borderRadius: "4px", border: `1px solid ${palette.border}`, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: palette.text }}>−</button>
                <span style={{ fontSize: "12px", color: palette.text, minWidth: "60px", textAlign: "center", fontFamily: fmt.fontFamily }}>{answerLines} line{answerLines !== 1 ? "s" : ""}</span>
                <button onClick={(e) => { e.stopPropagation(); onAnswerBoxSizeChange?.(sectionIndex, Math.min(20, answerLines + 1)); }}
                  style={{ width: "24px", height: "24px", borderRadius: "4px", border: `1px solid ${palette.border}`, background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: palette.text }}>+</button>
                <div style={{ width: "1px", height: "16px", background: "#e5e7eb" }} />
                <button onClick={(e) => { e.stopPropagation(); onAnswerBoxRemove?.(sectionIndex); }}
                  style={{ padding: "2px 8px", borderRadius: "4px", border: "1px solid #fca5a5", background: "#fef2f2", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: "#dc2626" }}>✕ Remove</button>
              </div>
            )}
            {/* Plain ruled answer lines — matching reference PDF */}
            <div style={{ marginTop: "4px" }}>
              {Array.from({ length: answerLines }).map((_, n) => (
                <div key={n} style={{
                  borderBottom: "1px solid #9ca3af",
                  height: "28px",
                  marginBottom: "4px",
                }} />
              ))}
            </div>
            <div style={{ fontSize: `${fmt.fontSize - 3}px`, color: `${palette.border}bb`, marginTop: "4px", fontFamily: fmt.fontFamily, fontStyle: "italic", textAlign: "right" }}>
              {section.type === "challenge" ? "Show your working above" : "Write your answer above"}
            </div>
          </div>
        )}
      </div>
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
  schoolLogoUrl,
  teacherName,
  answerBoxSizes = {},
  onAnswerBoxSizeChange,
  onAnswerBoxRemove,
  isRevisionMat = false,
  }: WorksheetRendererProps, ref: React.Ref<HTMLDivElement>) {
  const isTeacherView = viewMode === "teacher";

  // ── Asset resolution: build a lookup map from assetRef ID → stable public URL ────────────────
  // This allows sections to reference assets by stable ID rather than raw URL,
  // so diagrams remain stable even if the underlying storage URL changes.
  const assetRefMap = new Map<string, string>();
  if (worksheet.libraryAssets && worksheet.libraryAssets.length > 0) {
    for (const asset of worksheet.libraryAssets) {
      assetRefMap.set(asset.id, asset.publicUrl);
      assetRefMap.set(asset.sectionKey, asset.publicUrl); // also index by section key
    }
  }

  /**
   * Resolve the best image URL for a section:
   * 1. If section has assetRef, look it up in assetRefMap
   * 2. Fall back to section.imageUrl
   * 3. Return undefined if neither is available
   */
  function resolveImageUrl(section: WorksheetSection): string | undefined {
    if (section.assetRef) {
      const resolved = assetRefMap.get(section.assetRef);
      if (resolved) return resolved;
      // Fallback: map "assets/foo-bar.svg" or "assets/foo-bar.png" → "/diagrams/foo-bar.png"
      const ref = section.assetRef;
      if (ref.startsWith('assets/')) {
        const basename = ref.replace(/^assets\//, '').replace(/\.[^.]+$/, '');
        return `/diagrams/${basename}.png`;
      }
      // Also handle bare names like "algebra-function-machine"
      if (/^[a-z0-9-]+$/.test(ref)) {
        return `/diagrams/${ref}.png`;
      }
    }
    return section.imageUrl as string | undefined;
  }

  // Resolve SEND need ID from metadata (may be stored as sendNeedId or inferred from sendNeed label)
  // Robust: handle cases where metadata is missing (e.g. from older history items)
  const metadata = worksheet.metadata || {};
  const sendNeedId = metadata.sendNeedId || metadata.sendNeed;
  const fmt = getSendFormatting(sendNeedId, textSize);

  // Detect primary (KS1/KS2: Reception – Year 6)
  const yg = (metadata.yearGroup || "").toLowerCase();
  const isPrimary = /reception|year [1-6]\b|yr [1-6]\b|ks1|ks2|key stage 1|key stage 2/.test(yg);
  const yrNumMatch = yg.match(/(\d+)/);
  const yrNum = yrNumMatch ? parseInt(yrNumMatch[1]) : (isPrimary ? 5 : 8);

  // Primary colour palette — each section gets a different cheerful colour
  const PRIMARY_SECTION_COLOURS = [
    { border: "#4f46e5", bg: "#f5f3ff", badge: "#4f46e5", badgeBg: "#ede9fe" }, // indigo
    { border: "#2563eb", bg: "#eff6ff", badge: "#2563eb", badgeBg: "#dbeafe" }, // blue
    { border: "#7c3aed", bg: "#faf5ff", badge: "#7c3aed", badgeBg: "#f3e8ff" }, // violet
    { border: "#6366f1", bg: "#f5f3ff", badge: "#6366f1", badgeBg: "#ede9fe" }, // indigo-light
    { border: "#3b82f6", bg: "#eff6ff", badge: "#3b82f6", badgeBg: "#dbeafe" }, // blue-mid
    { border: "#8b5cf6", bg: "#f5f3ff", badge: "#8b5cf6", badgeBg: "#ede9fe" }, // purple
    { border: "#4338ca", bg: "#f5f3ff", badge: "#4338ca", badgeBg: "#ede9fe" }, // indigo-dark
    { border: "#6d28d9", bg: "#faf5ff", badge: "#6d28d9", badgeBg: "#ede9fe" }, // violet-dark
  ];

  // Default answer box line counts per section type — used as fallback
  const DEFAULT_ANSWER_LINES: Record<string, number> = {
    guided: 3,
    independent: 4,
    challenge: 5,
    "q-primary-activity": 2,
  };

  // Content-aware line count: inspect the section content to determine
  // how many writing lines are appropriate, so boxes match the writing demand.
  const getSmartAnswerLines = (sectionIndex: number, sectionType: string, content: string): number => {
    // User has manually overridden — respect that
    if (sectionIndex in answerBoxSizes) return answerBoxSizes[sectionIndex];
    // Count numbered questions — each needs its own answer space
    const numQuestions = (content.match(/^\s*\d+[.)]/gm) || []).length;
    const lower = content.toLowerCase();
    const isExtended = /explain|describe|discuss|analyse|evaluate|justify|compare|contrast|account for|how does|why does|what impact|to what extent/i.test(content);
    const isShort = /^(name|state|give|list|identify|define|what is|what are|circle|tick|label)/im.test(content);
    const isCalc = /calculat|show your working|work out|find the value|solve/i.test(lower);
    // Multi-question: 2 lines per question
    if (numQuestions >= 3) return Math.min(numQuestions * 2, 10);
    if (numQuestions === 2) return 5;
    // Single question - size by type
    if (isExtended) return sectionType === "challenge" ? 8 : 6;
    if (isCalc) return 4;
    if (isShort) return 2;
    return DEFAULT_ANSWER_LINES[sectionType] ?? 4;
  };

  // Helper: get effective line count for a section's answer box
  const getAnswerLines = (sectionIndex: number, sectionType: string, content?: string): number => {
    if (sectionIndex in answerBoxSizes) return answerBoxSizes[sectionIndex];
    if (content) return getSmartAnswerLines(sectionIndex, sectionType, content);
    return DEFAULT_ANSWER_LINES[sectionType] ?? 4;
  };


  // Overlay logic: only apply if a real colour is chosen (not white/transparent)
  const hasOverlay = overlayColor && overlayColor !== "white" && overlayColor !== "#ffffff"
    && overlayColor !== "transparent";

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
        position: "relative",
      }}
    >
      {/* Colour overlay — sits above all section backgrounds, covers all text boxes */}
      {hasOverlay && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: overlayColor,
            pointerEvents: "none",
            zIndex: 10,
            mixBlendMode: "multiply",
            borderRadius: "inherit",
          }}
        />
      )}
      {/* ── Professional Header — hidden for revision mats ── */}
      {!isRevisionMat && (
        isPrimary ? (
          /* ── PRIMARY HEADER: bright, colourful, child-friendly ── */
          <div className="ws-header" style={{ marginBottom: "18px", fontFamily: fmt.fontFamily, borderRadius: "18px", overflow: "hidden", border: "3px solid #a855f7", boxShadow: "0 4px 16px rgba(168,85,247,0.25)" }}>
            {/* Rainbow gradient title bar */}
            <div style={{
              background: "linear-gradient(135deg, #f472b6 0%, #a855f7 25%, #60a5fa 50%, #4ade80 75%, #facc15 100%)",
              padding: "14px 18px 12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: `${fmt.fontSize + 10}px`, fontWeight: 900, color: "#fff", fontFamily: fmt.fontFamily, lineHeight: "1.2", textShadow: "0 2px 6px rgba(0,0,0,0.25)", marginBottom: "2px" }}>
                  {normalizeWorksheetTitleForDisplay(worksheet.title, worksheet.metadata?.difficulty || (worksheet as any).difficulty)}
                </div>
                {worksheet.subtitle && (
                  <div style={{ fontSize: `${fmt.fontSize}px`, color: "rgba(255,255,255,0.9)", fontFamily: fmt.fontFamily, fontWeight: 600 }}>{worksheet.subtitle}</div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
                {schoolLogoUrl && (
                  <img src={schoolLogoUrl} alt="School logo" style={{ height: "32px", width: "auto", maxWidth: "64px", objectFit: "contain", background: "rgba(255,255,255,0.85)", borderRadius: "6px", padding: "2px" }} />
                )}
                <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.9)", fontFamily: fmt.fontFamily, textTransform: "uppercase", letterSpacing: "0.06em", background: "rgba(0,0,0,0.15)", padding: "2px 8px", borderRadius: "8px" }}>
                  {schoolName || "Adaptly"}
                </span>
              </div>
            </div>
            {/* Name / Date / Class bar — white background */}
            <div style={{ background: "#fff", padding: "10px 18px 8px 18px", display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
              {[{ label: "Name", width: 140 }, { label: "Date", width: 100 }, { label: "Class", width: 100 }].map((field, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#7c3aed", fontFamily: fmt.fontFamily }}>{field.label}:</span>
                  <div style={{ borderBottom: "2px solid #a855f7", width: `${field.width}px`, height: "20px" }} />
                </div>
              ))}
              <span style={{ marginLeft: "auto", fontSize: "10px", color: "#9ca3af", fontFamily: fmt.fontFamily, fontWeight: 600 }}>
                {[worksheet.metadata?.subject, worksheet.metadata?.yearGroup].filter(Boolean).join(" · ")}
              </span>
            </div>
          </div>
        ) : (
          /* ── SECONDARY HEADER: clean professional navy/grey ── */
          <div className="ws-header" style={{ marginBottom: "18px", fontFamily: fmt.fontFamily }}>
            {/* Top info bar: school name + subject/year/board */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {schoolLogoUrl && (
                  <img src={schoolLogoUrl} alt="School logo" style={{ height: "28px", width: "auto", maxWidth: "56px", objectFit: "contain" }} />
                )}
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#1a2744", fontFamily: fmt.fontFamily, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {schoolName || "Adaptly"}
                </span>
              </div>
              <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: fmt.fontFamily, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                {[worksheet.metadata.subject, worksheet.metadata.yearGroup, worksheet.metadata.examBoard && worksheet.metadata.examBoard !== "General" && worksheet.metadata.examBoard !== "none" ? worksheet.metadata.examBoard.toUpperCase() : null].filter(Boolean).join(" · ")}
              </span>
            </div>
            {/* Main header block: full dark navy filled rectangle — matches reference PDF exactly */}
            <div style={{
              background: "#1B2A4A",
              padding: "10px 14px 12px 14px",
              marginBottom: "10px",
            }}>
              {/* Subject/year line above title */}
              <div style={{ fontSize: "9px", color: "#99BBBB", fontFamily: fmt.fontFamily, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px", fontWeight: 400 }}>
                {[worksheet.metadata.subject, worksheet.metadata.yearGroup, worksheet.metadata.examBoard && worksheet.metadata.examBoard !== "General" && worksheet.metadata.examBoard !== "none" ? worksheet.metadata.examBoard.toUpperCase() : null].filter(Boolean).join(" · ")}
              </div>
              <div style={{
                fontSize: `${fmt.fontSize + 10}px`,
                fontWeight: 700,
                color: "#ffffff",
                fontFamily: fmt.fontFamily,
                lineHeight: "1.25",
                marginBottom: "2px",
              }}>{normalizeWorksheetTitleForDisplay(worksheet.title, worksheet.metadata?.difficulty || (worksheet as any).difficulty)}</div>
              {worksheet.subtitle && (
                <div style={{ fontSize: `${fmt.fontSize}px`, color: "rgba(255,255,255,0.75)", fontFamily: fmt.fontFamily, marginTop: "2px" }}>{worksheet.subtitle}</div>
              )}
              {/* SEND badge removed — accessibility adaptations are applied invisibly */}
            </div>
            {/* Name / Date / Class bar */}
            <div style={{
              display: "flex",
              gap: "32px",
              alignItems: "center",
              borderBottom: "1.5px solid #d1d5db",
              paddingBottom: "8px",
              marginBottom: "6px",
            }}>
              {[{ label: "NAME", width: 180 }, { label: "DATE", width: 120 }, { label: "CLASS", width: 120 }, ...(teacherName ? [{ label: "TEACHER", width: 140 }] : [])].map((field, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#374151", fontFamily: fmt.fontFamily, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>{field.label}</span>
                  <div style={{ borderBottom: "1.5px solid #374151", width: `${field.width}px`, height: "18px", display: "flex", alignItems: "flex-end" }}>
                    {field.label === "DATE" && <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: fmt.fontFamily, paddingBottom: "1px" }}>{new Date().toLocaleDateString("en-GB")}</span>}
                    {field.label === "TEACHER" && teacherName && <span style={{ fontSize: "10px", color: "#374151", fontFamily: fmt.fontFamily, paddingBottom: "1px" }}>{teacherName}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Primary encouragement banner — hidden for revision mats */}
      {isPrimary && !isRevisionMat && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "8px 16px",
          marginBottom: "14px",
          borderRadius: "10px",
          background: "linear-gradient(90deg, #ede9fe, #dbeafe, #e0f2fe)",
          border: "1.5px solid #7c3aed",
          fontSize: `${fmt.fontSize - 1}px`,
          fontWeight: 700,
          color: "#3730a3",
          fontFamily: fmt.fontFamily,
        }}>
          <span>Do your best — every try counts!</span>
          <span style={{ color: "#7c3aed", fontWeight: 400 }}>|</span>
          <span>Read carefully before you start.</span>
          <span style={{ color: "#7c3aed", fontWeight: 400 }}>|</span>
          <span>Ask for help if you need it.</span>
        </div>
      )}

      {/* ── Revision Mat — Jigsaw/Mosaic Layout ── */}
      {isRevisionMat && (
        <div style={{ width: "100%" }}>
          <style>{`
            @media print {
              @page { size: A4 landscape; margin: 5mm; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .rm-jigsaw { page-break-inside: avoid; }
            }
          `}</style>
          {(() => {
            // ═══════════════════════════════════════════════════════════════════
            // REVISION MAT — centre-title jigsaw, A4 landscape, 6-column grid
            // Title/LO/Vocab box is FIXED at the centre; questions surround it.
            // ═══════════════════════════════════════════════════════════════════
            const COLS = 6;

            // Pastel colour palette cycling across question boxes
            const BOX_COLOURS = [
              "#e8f4fd","#fef9e7","#eafaf1","#fdf2f8","#f0f4ff",
              "#fff8e1","#e8f5e9","#fce4ec","#e3f2fd","#f3e5f5",
              "#fff3e0","#e8eaf6","#fce7f3","#ecfdf5","#fffbeb","#f0fdf4",
            ];

            // ── Parse the combined title/LO/vocab section ──────────────────
            // The AI writes one "revision-mat-title" section whose content is:
            //   Line 1:  the topic title
            //   A line:  "LO: Students will be able to..."
            //   A line:  "Key Vocabulary:"
            //   Rest:    one vocab term per line
            const titleSec = worksheet.sections.find((s: any) =>
              s.type === "revision-mat-title"
            );
            // Fallbacks: separate LO / vocab sections from older worksheets
            const loSec    = worksheet.sections.find((s: any) =>
              s.type === "revision-mat-lo" || s.type === "objective"
            );
            const vocabSec = worksheet.sections.find((s: any) =>
              s.type === "vocabulary" || s.type === "revision-mat-vocab"
            );

            let topicTitle        = (worksheet.title || worksheet.metadata?.topic || "").trim();
            let learningObjective = (loSec?.content || "").trim();
            let vocabContent      = (vocabSec?.content || "").trim();

            if (titleSec) {
              const raw   = (titleSec.content || "").trim();
              const tlines = raw.split("\n");
              // First non-empty line = topic title
              const firstLine = tlines.find((l: string) => l.trim()) || "";
              topicTitle = firstLine.replace(/^\*+|\*+$/g, "").trim();
              // Line starting "LO:" = learning objective
              const loLine = tlines.find((l: string) => /^LO:|^Learning Objective:/i.test(l.trim()));
              if (loLine) learningObjective = loLine.replace(/^LO:|^Learning Objective:/i, "").trim();
              // Lines after "Key Vocabulary:" heading = vocab
              const kvIdx = tlines.findIndex((l: string) => /^Key Vocab/i.test(l.trim()));
              if (kvIdx >= 0) {
                vocabContent = tlines.slice(kvIdx + 1).filter(Boolean).join("\n");
              }
            }

            // ── Collect question sections (max 16), strip meta/self-reflection ──
            const rawQSections = worksheet.sections.filter((s: any) =>
              !s.teacherOnly &&
              s.type !== "answers" && s.type !== "teacher-notes" &&
              s.type !== "mark-scheme" && s.type !== "adaptations" &&
              s.type !== "revision-mat-title" && s.type !== "revision-mat-lo" &&
              s.type !== "objective" && s.type !== "self-reflection" &&
              s.type !== "vocabulary" && s.type !== "revision-mat-vocab"
            );

            // ── Split multi-question boxes into individual questions ──────
            const splitSections: any[] = [];
            for (const sec of rawQSections) {
              const content = (sec.content || "").trim();
              const skipTypes = ["table", "match-up", "diagram"];
              if (skipTypes.includes(sec.type)) { splitSections.push(sec); continue; }
              const lines = content.split("\n");
              // Detect if this box is an MCQ (has a. b. c. d. options) — never split MCQ boxes
              const isMCQBox = /^\s*[a-d]\.\s/m.test(content);
              if (isMCQBox) {
                const mm = content.match(/\[(\d+)\s*marks?\]|\((\d+)\s*marks?\)/i);
                const marks = mm ? parseInt(mm[1] || mm[2]) : (sec.marks || 1);
                splitSections.push({ ...sec, marks });
                continue;
              }
              const qStarts: number[] = [];
              for (let li = 0; li < lines.length; li++) {
                const line = lines[li].trim();
                // Only split on numbered questions (1. 2. 3.) — NOT on letter options (a. b. c. d.)
                if (/^\d+\s*[.)]/i.test(line)) qStarts.push(li);
              }
              if (qStarts.length < 2) {
                const mm = content.match(/\[(\d+)\s*marks?\]|\((\d+)\s*marks?\)/i);
                const marks = mm ? parseInt(mm[1] || mm[2]) : (sec.marks || 1);
                splitSections.push({ ...sec, marks });
                continue;
              }
              for (let qi = 0; qi < qStarts.length; qi++) {
                const sl = qStarts[qi];
                const el = qi + 1 < qStarts.length ? qStarts[qi + 1] : lines.length;
                const qc = lines.slice(sl, el).join("\n").trim();
                const mm = qc.match(/\[(\d+)\s*marks?\]|\((\d+)\s*marks?\)/i);
                const marks = mm ? parseInt(mm[1] || mm[2]) : 1;
                splitSections.push({ ...sec, content: qc, marks });
              }
            }

            const questionSections = splitSections.slice(0, 16);
            if (questionSections.length === 0 && !topicTitle) return null;

            // ── Span sizes: col × row ─────────────────────────────────────
            const getSpans = (marks: number): [number, number] => {
              if (marks >= 6) return [2, 3]; // 6-mark: wide & tall
              if (marks >= 4) return [2, 2]; // 4-mark: medium-wide
              if (marks >= 3) return [2, 2]; // 3-mark: medium
              if (marks >= 2) return [1, 2]; // 2-mark: taller
              return [1, 1];                  // 1-mark: compact
            };

            // ── Grid engine ───────────────────────────────────────────────
            type GridCell = number | "title" | null;
            const grid: GridCell[][] = [];

            type PlacedBox = {
              isTitle?: boolean; section?: any; label: string;
              colSpan: number; rowSpan: number; colStart: number; rowStart: number;
              marks?: number;
            };
            const placed: PlacedBox[] = [];
            let letterIdx = 0;
            const LETTERS = "abcdefghijklmnopqrstuvwxyz";

            const ensureRows = (n: number) => {
              while (grid.length < n) grid.push(Array(COLS).fill(null));
            };

            // ── PRE-RESERVE the centre title cells ───────────────────────
            // Fixed at: 0-indexed row 1–2, col 2–3  →  CSS cols 3-4, rows 2-3
            const TITLE_ROW  = 1;  // 0-indexed
            const TITLE_COL  = 2;  // 0-indexed
            const TITLE_CSPAN = 2;
            const TITLE_RSPAN = 2;
            ensureRows(TITLE_ROW + TITLE_RSPAN);
            for (let dr = 0; dr < TITLE_RSPAN; dr++) {
              for (let dc = 0; dc < TITLE_CSPAN; dc++) {
                grid[TITLE_ROW + dr][TITLE_COL + dc] = "title";
              }
            }
            placed.push({
              isTitle: true, label: "★",
              colSpan: TITLE_CSPAN, rowSpan: TITLE_RSPAN,
              colStart: TITLE_COL + 1,  // 1-indexed CSS
              rowStart: TITLE_ROW + 1,
            });

            // ── Auto-place question boxes in remaining cells ───────────────
            const findCell = (colSpan: number, rowSpan: number): [number, number] => {
              for (let r = 0; r < 100; r++) {
                ensureRows(r + rowSpan);
                for (let c = 0; c <= COLS - colSpan; c++) {
                  let fits = true;
                  outerRM: for (let dr = 0; dr < rowSpan; dr++) {
                    ensureRows(r + dr + 1);
                    for (let dc = 0; dc < colSpan; dc++) {
                      if (grid[r + dr][c + dc] !== null) { fits = false; break outerRM; }
                    }
                  }
                  if (fits) return [r, c];
                }
              }
              return [0, 0];
            };

            for (let si = 0; si < questionSections.length; si++) {
              const sec = questionSections[si];
              const marks = (sec as any).marks || 1;
              const [colSpan, rowSpan] = getSpans(marks);
              const [r, c] = findCell(colSpan, rowSpan);
              for (let dr = 0; dr < rowSpan; dr++) {
                ensureRows(r + dr + 1);
                for (let dc = 0; dc < colSpan; dc++) grid[r + dr][c + dc] = si;
              }
              const label = LETTERS[letterIdx++] || String(si + 1);
              placed.push({ section: sec, label, colSpan, rowSpan, colStart: c + 1, rowStart: r + 1, marks });
            }

            const totalRows = grid.length;

            // ── Remaining empty cells → single working-space box ──────────
            const emptyCells: [number, number][] = [];
            for (let r = 0; r < grid.length; r++)
              for (let c = 0; c < COLS; c++)
                if (grid[r][c] === null) emptyCells.push([r, c]);

            // Find bounding rect of all empty cells
            let wsR0 = Infinity, wsR1 = -1, wsC0 = Infinity, wsC1 = -1;
            for (const [r, c] of emptyCells) {
              if (r < wsR0) wsR0 = r; if (r > wsR1) wsR1 = r;
              if (c < wsC0) wsC0 = c; if (c > wsC1) wsC1 = c;
            }
            const hasEmpty  = emptyCells.length > 0;
            const wsColSpan = hasEmpty ? wsC1 - wsC0 + 1 : 1;
            const wsRowSpan = hasEmpty ? wsR1 - wsR0 + 1 : 1;
            const wsColStart = hasEmpty ? wsC0 + 1 : 1;
            const wsRowStart = hasEmpty ? wsR0 + 1 : totalRows + 1;

            // ── Answer lines per mark spec ────────────────────────────────
            // 4+ marks → 6 lines; everything else → 3 lines
            const getNumLines = (marks: number): number => {
              if (marks >= 4) return 6;
              return 3;
            };

            return (
              <div
                className="rm-jigsaw"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  gridTemplateRows: `repeat(${totalRows}, 1fr)`,
                  height: "190mm",
                  gap: "2px",
                  width: "100%",
                  backgroundColor: "#3d3d3d",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "8px",
                  lineHeight: "1.35",
                  padding: "2px",
                  boxSizing: "border-box",
                }}
              >
                {/* ════════════════════════════════════════════════════════
                    CENTRE TITLE BOX — topic, LO, key vocabulary
                    Fixed at CSS cols 3-4, rows 2-3 (centre of the page)
                    ════════════════════════════════════════════════════════ */}
                <div
                  style={{
                    gridColumn: `${TITLE_COL + 1} / span ${TITLE_CSPAN}`,
                    gridRow:    `${TITLE_ROW + 1} / span ${TITLE_RSPAN}`,
                    background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 55%, #3b82f6 100%)",
                    border: "2.5px solid #1e3a8a",
                    padding: "6px 8px",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "3px",
                    color: "#fff",
                    boxShadow: "0 0 0 3px rgba(59,130,246,0.25)",
                  }}
                >
                  {/* Subtle decorative arc */}
                  <div style={{
                    position: "absolute", bottom: "-10px", right: "-10px",
                    width: "50px", height: "50px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                  }} />
                  {/* Topic title */}
                  <div style={{
                    fontSize: "10px", fontWeight: 800,
                    letterSpacing: "0.01em", marginBottom: "3px",
                    lineHeight: "1.2", textTransform: "uppercase",
                    borderBottom: "1px solid rgba(255,255,255,0.3)",
                    paddingBottom: "3px",
                  }}>
                    {topicTitle}
                  </div>
                  {/* Learning Objective */}
                  {learningObjective && (
                    <div style={{
                      fontSize: "6.5px", fontStyle: "italic",
                      opacity: 0.9, marginBottom: "4px",
                    }}>
                      <span style={{ fontWeight: 700, fontStyle: "normal" }}>LO: </span>
                      {learningObjective}
                    </div>
                  )}
                  {/* Key Vocabulary */}
                  <div style={{ fontSize: "6.5px", flex: 1, overflow: "hidden" }}>
                    <div style={{
                      fontWeight: 700, marginBottom: "2px",
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      fontSize: "5.5px", opacity: 0.7,
                    }}>
                      Key Vocabulary
                    </div>
                    {vocabContent
                      ? vocabContent.split("\n").filter(Boolean).map((line: string, vi: number) => (
                          <div key={vi} style={{ marginBottom: "1.5px", opacity: 0.95, lineHeight: "1.3" }}>
                            {"• "}{line.replace(/^[-•*]\s*/, "").replace(/\*\*(.+?)\*\*/g, "$1")}
                          </div>
                        ))
                      : <div style={{ opacity: 0.6, fontStyle: "italic" }}>Key terms listed here</div>
                    }
                  </div>
                </div>

                {/* ════════════════════════════════════════════════════════
                    QUESTION BOXES — surrounding the centre title
                    ════════════════════════════════════════════════════════ */}
                {placed.filter(b => !b.isTitle).map((box, bi) => {
                  const { section, label, colSpan, rowSpan, colStart, rowStart, marks = 1 } = box;
                  const origIdx = worksheet.sections.indexOf(section);
                  const rawContent = (editedSections && editedSections[origIdx] !== undefined)
                    ? editedSections[origIdx] : section.content;
                  const displayContent = typeof rawContent === "string" ? rawContent : String(rawContent || "");

                  const lines = displayContent.split("\n");
                  const isMCQ          = /^\s*[a-d]\.\s/m.test(displayContent);
                  const hasInlineBlank = displayContent.includes("___");
                  const isCalc         = /calculat|show working|work out/i.test(displayContent);
                  const isMatchUp      = lines.filter((l: string) =>
                    /\w+\s*\|\s*\w+/.test(l) && !/[=<>]/.test(l)).length >= 2;
                  const isWorkingOut   = (section.title || "").toLowerCase().includes("working out")
                    && !displayContent.trim();

                  const numLines  = getNumLines(marks);
                  const bgColour  = BOX_COLOURS[bi % BOX_COLOURS.length];
                  const isBig     = marks >= 6;
                  const isMedBig  = marks >= 4;
                  // Dynamically shrink font for longer content to prevent cut-off
                  const contentLength = displayContent.length;
                  const lineCount = lines.length;
                  const qFontSize = (contentLength > 200 || lineCount > 8) ? "5.5px"
                                  : (contentLength > 120 || lineCount > 5) ? "6px"
                                  : "7px";

                  const borderStyle = isBig    ? "2px solid #c0392b"
                                    : isMedBig ? "1.5px solid #d97706"
                                    : marks >= 3 ? "1.5px solid #6366f1"
                                    : "1px solid #d1d5db";

                  return (
                    <div
                      key={bi}
                      style={{
                        gridColumn: `${colStart} / span ${colSpan}`,
                        gridRow:    `${rowStart} / span ${rowSpan}`,
                        backgroundColor: bgColour,
                        border: borderStyle,
                        padding: "3px 5px 3px 5px",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "2px",
                      }}
                    >
                      {/* Marks badge — top right corner */}
                      <div style={{
                        position: "absolute", top: "2px", right: "2px",
                        fontSize: "5.5px", fontWeight: 700,
                        color: isBig ? "#c0392b" : isMedBig ? "#d97706" : marks >= 3 ? "#6366f1" : "#9ca3af",
                        background: "rgba(255,255,255,0.92)",
                        borderRadius: "3px", padding: "0px 3px",
                        border: "1px solid currentColor",
                        lineHeight: "1.6", zIndex: 2, whiteSpace: "nowrap",
                      }}>
                        {marks}m
                      </div>

                      {/* Question letter */}
                      <div style={{
                        fontSize: "6.5px", fontWeight: 800,
                        color: "#1f2937", marginBottom: "1px",
                        paddingRight: "22px", lineHeight: "1.2",
                        flexShrink: 0,
                      }}>
                        {label}.
                      </div>

                      {/* Edit button */}
                      {editMode && onSectionEdit && (
                        <button
                          onClick={() => {
                            const newText = window.prompt("Edit box content:", displayContent);
                            if (newText !== null) onSectionEdit!(origIdx, newText);
                          }}
                          style={{
                            position: "absolute", top: "14px", right: "2px", zIndex: 10,
                            background: "#4f46e5", color: "#fff", border: "none",
                            borderRadius: "2px", fontSize: "6px", padding: "1px 3px",
                            cursor: "pointer",
                          }}
                        >✏️</button>
                      )}

                      {/* Box content */}
                      {isWorkingOut ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <div style={{ fontSize: "7px", fontWeight: 700, color: "#9ca3af", marginBottom: "2px" }}>
                            Working Out
                          </div>
                          <div style={{ flex: 1, border: "1px dashed #d1d5db", borderRadius: "2px" }} />
                        </div>
                      ) : isMatchUp ? (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "6px", color: "#6b7280", fontStyle: "italic", marginBottom: "2px" }}>
                            Draw lines to match:
                          </div>
                          {lines.filter((l: string) =>
                            /\w+\s*\|\s*\w+/.test(l) && !/[=<>]/.test(l)
                          ).map((line: string, li: number) => {
                            const [left, right] = line.split("|").map((s: string) => s.trim());
                            return (
                              <div key={li} style={{
                                display: "grid", gridTemplateColumns: "1fr 1fr",
                                gap: "1px 5px", marginBottom: "2px",
                              }}>
                                <div style={{ border: "1px solid #d1d5db", padding: "1px 3px", fontSize: "7px", background: "#fff", borderRadius: "1px" }}>{left}</div>
                                <div style={{ border: "1px solid #d1d5db", padding: "1px 3px", fontSize: "7px", background: "#fff", borderRadius: "1px" }}>{right}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                          {/* Question text */}
                          <div style={{ paddingRight: "20px", marginBottom: "2px", flexShrink: 1, overflow: "hidden", fontSize: qFontSize, wordBreak: "break-word", overflowWrap: "break-word" }}>
                            {lines.map((line: string, li: number) => {
                              const t = line.trim()
                                .replace(/\*\*(.+?)\*\*/g, "$1")
                                .replace(/\*\*/g, "")
                                .replace(/^\*+|\*+$/g, "");
                              if (!t) return null;
                              if (/^_{3,}$/.test(t)) return null;
                              // MCQ option circles
                              if (/^[a-d]\.\s/.test(t)) {
                                return (
                                  <div key={li} style={{
                                    display: "flex", alignItems: "center", gap: "2px",
                                    marginBottom: "1px", paddingLeft: "2px",
                                  }}>
                                    <svg width="7" height="7" viewBox="0 0 9 9" style={{ flexShrink: 0 }}>
                                      <circle cx="4.5" cy="4.5" r="3.5" fill="none" stroke="#9ca3af" strokeWidth="0.9" />
                                    </svg>
                                    <span style={{ fontSize: qFontSize }}
                                      dangerouslySetInnerHTML={{ __html: renderMath(t.replace(/^[a-d]\.\s/, "")) }} />
                                  </div>
                                );
                              }
                              // True / False
                              if (/^true\s*\/\s*false$/i.test(t)) {
                                return (
                                  <div key={li} style={{ display: "flex", gap: "8px", marginTop: "1px" }}>
                                    {["True", "False"].map((opt: string) => (
                                      <div key={opt} style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                        <svg width="7" height="7" viewBox="0 0 9 9">
                                          <circle cx="4.5" cy="4.5" r="3.5" fill="none" stroke="#9ca3af" strokeWidth="0.9" />
                                        </svg>
                                        <span style={{ fontSize: "7px" }}>{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              // Fill-in-the-blank
                              if (t.includes("___")) {
                                return (
                                  <div key={li} style={{ marginBottom: "1px", fontSize: qFontSize, lineHeight: "1.4" }}>
                                    {t.split(/(_+)/).map((part: string, pi: number) =>
                                      /^_+$/.test(part)
                                        ? <span key={pi} style={{
                                            display: "inline-block",
                                            borderBottom: "1px solid #374151",
                                            minWidth: "28px", marginLeft: "1px", marginRight: "1px",
                                          }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                        : <span key={pi} dangerouslySetInnerHTML={{ __html: renderMath(part) }} />
                                    )}
                                  </div>
                                );
                              }
                              // Standard line
                              return (
                                <div key={li} style={{ marginBottom: "1px", fontSize: qFontSize, lineHeight: "1.35" }}
                                  dangerouslySetInnerHTML={{ __html: renderMath(t) }} />
                              );
                            })}
                          </div>

                          {/* Answer lines — always pushed to bottom of box */}
                          {!isMCQ && !hasInlineBlank && (
                            <div style={{ marginTop: "auto", paddingTop: "1px" }}>
                              {isCalc ? (
                                <>
                                  <div style={{ fontSize: "5.5px", color: "#9ca3af", fontStyle: "italic", marginBottom: "1px" }}>Show working:</div>
                                  {Array.from({ length: numLines - 1 }).map((_, li) => (
                                    <div key={li} style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "3.5px", height: "8px" }} />
                                  ))}
                                  <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "1px" }}>
                                    <span style={{ fontSize: "5.5px", fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>Ans:</span>
                                    <div style={{ flex: 1, borderBottom: "1.5px solid #9ca3af" }} />
                                  </div>
                                </>
                              ) : (
                                Array.from({ length: numLines }).map((_, li) => (
                                  <div key={li} style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "3.5px", height: "8px" }} />
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ════════════════════════════════════════════════════════
                    EXTRA WORKING SPACE — fills any leftover cells exactly
                    ════════════════════════════════════════════════════════ */}
                {hasEmpty && (
                  <div
                    style={{
                      gridColumn: `${wsColStart} / span ${wsColSpan}`,
                      gridRow:    `${wsRowStart} / span ${wsRowSpan}`,
                      backgroundColor: "#f9fafb",
                      border: "1px dashed #d1d5db",
                      padding: "4px 6px",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "2px",
                    }}
                  >
                    <div style={{
                      fontSize: "7px", fontWeight: 700, color: "#6b7280",
                      marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em",
                      textAlign: "center",
                    }}>
                      Extra Working Space
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                      {Array.from({ length: Math.max(4, wsRowSpan * wsColSpan * 2) }).map((_, li) => (
                        <div key={li} style={{ borderBottom: "1px solid #e5e7eb", height: "9px" }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Sections (normal portrait layout — hidden when revision mat active) ── */}
      {!isRevisionMat && worksheet.sections.map((section, i) => {
        const normalizedSectionType = normalizeWorksheetSectionType(section.type);
        if (normalizedSectionType !== section.type) {
          section = { ...section, type: normalizedSectionType };
        }
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
            rawContent = (rawContent as any[]).map((item: any) => {
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
        // Also strip mark scheme lines and "[X marks]" labels that reveal answers.
        let content = rawContent as string;
        if (!isTeacherView && typeof content === 'string') {
          content = content
            .split('\n')
            .filter(line => {
              const t = line.trim();
              if (/^\s*Answer\s*:/i.test(t)) return false;
              if (/^\s*Mark scheme\s*:/i.test(t)) return false;
              if (/^\s*\*?\s*Answer\s*:/i.test(t)) return false;
              // Strip lines that are ONLY an answer value after "Answer:" (e.g. "   (7 5)")
              // following a question — handled by the Answer: filter above
              return true;
            })
            // Strip inline "[X marks]" badges that reveal total mark allocations hinting at answers
            // but keep them if teacher view
            .map(line => line.replace(/\s*\[\d+\s*marks?\]/gi, ''))
            .join('\n');
        }
        const style = isPrimary
          ? { ...(PRIMARY_SECTION_COLOURS[i % PRIMARY_SECTION_COLOURS.length]), icon: ["A","B","C","D","E","F","G","H"][i % 8], label: section.title as string || "", badgeText: "" }
          : getSectionStyle(section.type, yrNum);
        // Teacher-only sections: mark-scheme, teacher-notes, answers, and any explicitly flagged teacherOnly
        const isTeacherSection = section.teacherOnly || section.type === "teacher-notes" || section.type === "mark-scheme" || section.type === "answers";

        // ── PRIMARY: delegate entirely to child-friendly renderer ──
        if (isPrimary) {
          const primaryAnswerLines = getAnswerLines(i, section.type, content);
          return (
            <React.Fragment key={i}>
            <PrimarySection
              section={section}
              sectionIndex={i}
              content={content}
              paletteIndex={i}
              fmt={fmt}
              overlayColor={overlayColor}
              editMode={editMode}
              isEdited={editedSections[i] !== undefined}
              answerLines={primaryAnswerLines}
              onSectionClick={onSectionClick}
              onAnswerBoxSizeChange={onAnswerBoxSizeChange}
              onAnswerBoxRemove={onAnswerBoxRemove}
              isTeacherSection={isTeacherSection}
            />
            </React.Fragment>
          );
        }

        // ── SECONDARY: clean professional layout ──
        // (style variable kept for potential future use; isSectionDivider inlined below)
        void style; // suppress unused-variable warning — style used by primary branch above
        const isTeacherHeader = isTeacherSection && (section.type === "mark-scheme" || section.type === "answers");
        const sectionTitle = (typeof section.title === 'string' ? section.title : String(section.title || '')).replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim();

        // ── Section group dividers: inject "SECTION N — NAME — Questions X–Y" before first question in each group ──
        // Determine section group by question number from title (Q1-Q3 = Recall, Q4-Q6 = Understanding, Q7-Q9 = Application)
        const titleQNum = (() => {
          const t = typeof section.title === "string" ? section.title : "";
          const m = t.match(/Q(\d+)/i);
          return m ? parseInt(m[1]) : null;
        })();
        const getGroupByQNum = (qn: number | null, type: string): { label: string; qStart: number; qEnd: number } | undefined => {
          if (qn !== null) {
            if (qn >= 1 && qn <= 3) return { label: "SECTION 1 — RECALL", qStart: 1, qEnd: 3 };
            if (qn >= 4 && qn <= 6) return { label: "SECTION 2 — UNDERSTANDING", qStart: 4, qEnd: 6 };
            if (qn >= 7 && qn <= 9) return { label: "SECTION 3 — APPLICATION & ANALYSIS", qStart: 7, qEnd: 9 };
          }
          // Fallback by type
          const QUESTION_GROUP_MAP: Record<string, { label: string; qStart: number; qEnd: number }> = {
            "q-true-false":  { label: "SECTION 1 — RECALL",           qStart: 1, qEnd: 3 },
            "q-mcq":         { label: "SECTION 1 — RECALL",           qStart: 1, qEnd: 3 },
            "q-gap-fill":    { label: "SECTION 1 — RECALL",           qStart: 1, qEnd: 3 },
            "q-short-answer":{ label: "SECTION 2 — UNDERSTANDING",           qStart: 4, qEnd: 6 },
            "q-extended":    { label: "SECTION 3 — APPLICATION & ANALYSIS",  qStart: 7, qEnd: 9 },
            "q-circuit":     { label: "SECTION 3 — APPLICATION & ANALYSIS",  qStart: 7, qEnd: 9 },
            "q-draw":        { label: "SECTION 3 — APPLICATION & ANALYSIS",  qStart: 7, qEnd: 9 },
            "q-graph":       { label: "SECTION 3 — APPLICATION & ANALYSIS",  qStart: 7, qEnd: 9 },
            "q-data-table":  { label: "SECTION 2 — UNDERSTANDING",           qStart: 4, qEnd: 6 },
            "q-label-diagram":{ label: "SECTION 2 — UNDERSTANDING",          qStart: 4, qEnd: 6 },
            "q-ordering":    { label: "SECTION 1 — RECALL",           qStart: 1, qEnd: 3 },
            "q-matching":    { label: "SECTION 1 — RECALL",           qStart: 1, qEnd: 3 },
            "q-challenge":   { label: "CHALLENGE QUESTION",                    qStart: 10, qEnd: 12 },
          };
          return QUESTION_GROUP_MAP[type];
        };
        const groupInfo = getGroupByQNum(titleQNum, section.type);
        const myGroupLabel = groupInfo?.label;
        // Show the group divider only before the FIRST question of that group in the worksheet
        // Use question number from title to determine group membership
        // Also suppress auto-inject if the worksheet already has an explicit section-header covering this group
        const hasExplicitSectionHeader = myGroupLabel && worksheet.sections.some((s: any) => {
          const normType = normalizeWorksheetSectionType(s.type);
          if (normType !== "section-header") return false;
          const headerTitle = (typeof s.title === "string" ? s.title : String(s.title || "")).toUpperCase();
          const headerContent = (typeof s.content === "string" ? s.content : String(s.content || "")).toUpperCase();
          // Match if the section-header title/content contains the group name
          if (myGroupLabel === "SECTION 1 \u2014 RECALL") return /SECTION\s*1|RECALL|KNOWLEDGE.CHECK/i.test(headerTitle + headerContent);
          if (myGroupLabel === "SECTION 2 \u2014 UNDERSTANDING") return /SECTION\s*2|UNDERSTANDING/i.test(headerTitle + headerContent);
          if (myGroupLabel === "SECTION 3 \u2014 APPLICATION") return /SECTION\s*3|APPLICATION/i.test(headerTitle + headerContent);
          return false;
        });
        const isFirstOfGroupSection = !hasExplicitSectionHeader && myGroupLabel && !worksheet.sections.slice(0, i).some((s: any) => {
          const prevQNum = (() => {
            const t = typeof s.title === "string" ? s.title : "";
            const m = t.match(/Q(\d+)/i);
            return m ? parseInt(m[1]) : null;
          })();
          const prevGroup = getGroupByQNum(prevQNum, normalizeWorksheetSectionType(s.type));
          return prevGroup?.label === myGroupLabel;
        });
        const isFirstOfGroup = isFirstOfGroupSection;

        // Map section types to teal section group labels
        const SECTION_GROUP_LABELS: Record<string, string> = {
          objective: "LEARNING OBJECTIVE",
          vocabulary: "KEY VOCABULARY",
          starter: "SECTION 1 — RECALL",
          guided: "SECTION 1 — RECALL",
          independent: "SECTION 3 — APPLICATION & ANALYSIS",
          challenge: "CHALLENGE QUESTION",
          "self-reflection": "SELF REFLECTION",
          "self-assessment": "SELF REFLECTION",
          "mark-scheme": "ANSWER KEY",
          answers: "ANSWER KEY",
          "teacher-notes": "TEACHER NOTES",
          "reminder-box": "REMINDER",
          "word-bank": "WORD BANK",
          "sentence-starters": "SENTENCE STARTERS",
          "word-problems": "PRACTICE PROBLEMS",
          comprehension: "READING COMPREHENSION",
          reading: "READING PASSAGE",
          passage: "READING PASSAGE",
          example: "WORKED EXAMPLE",
          "common-mistakes": "COMMON MISTAKES TO AVOID",
          "prior-knowledge": "PRIOR KNOWLEDGE CHECK",
          // Individual question types (no teal divider, just navy badge)
          "q-true-false": "",
          "q-mcq": "",
          "q-gap-fill": "",
          "q-short-answer": "",
          "q-extended": "",
          "q-circuit": "",
          "q-draw": "",
          "q-graph": "",
          "q-data-table": "",
          "q-label-diagram": "",
          "q-ordering": "",
          "q-matching": "",
          "q-challenge": "",
          // Section header — rendered as a teal divider bar, no section box
          "section-header": "",
        };

        // Individual question types — use navy badge + question text inline (no teal divider)
        const isIndividualQuestion = ["q-true-false", "q-mcq", "q-gap-fill", "q-short-answer", "q-extended",
          "q-circuit", "q-draw", "q-graph", "q-data-table", "q-label-diagram", "q-ordering", "q-matching",
          "q-challenge"].includes(section.type);
        // Section headers render as teal divider bars — not as section boxes
        if (section.type === "section-header") {
          return (
            <React.Fragment key={i}>
              <div style={{ marginBottom: "16px", marginTop: i > 0 ? "24px" : "0" }}>
                <div style={{ borderTop: "2px solid #1a2744", marginBottom: "5px" }} />
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#2a7f8f", fontFamily: fmt.fontFamily, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                  {(content || sectionTitle).replace(/KNOWLEDGE\s+CHECK/gi, 'RECALL')}
                </div>
                <div style={{ borderTop: "1px solid #d1d5db", marginTop: "5px" }} />
              </div>
            </React.Fragment>
          );
        }

        // Section group label — for individual questions, derive from section title (e.g. "Q1 — True or False")
        const groupLabel = isIndividualQuestion
          ? sectionTitle
          : (SECTION_GROUP_LABELS[section.type] !== undefined ? SECTION_GROUP_LABELS[section.type] : sectionTitle.toUpperCase());

        // Determine question number badge — for new individual question types AND legacy question sections
        const legacyQuestionTypes = new Set(["starter", "guided", "independent", "challenge", "word-problems", "comprehension"]);
        const newQuestionTypes = new Set(["q-true-false", "q-mcq", "q-gap-fill", "q-short-answer", "q-extended", "q-data-table", "q-label-diagram", "q-ordering", "q-matching", "q-circuit", "q-draw", "q-graph", "q-challenge"]);
        const allQuestionTypes = new Set([...legacyQuestionTypes, ...newQuestionTypes]);
        const showQuestionBadge = allQuestionTypes.has(section.type);
        // For new individual question types, extract number from title (e.g. "Q1 — True or False" → 1)
        const badgeTitleQNum = isIndividualQuestion ? parseInt((sectionTitle.match(/^Q(\d+)/i) || [])[1] || "0") : 0;
        // For legacy types, count question sections before this one
        const questionSectionsBefore = worksheet.sections.slice(0, i).filter((s: any) => allQuestionTypes.has(normalizeWorksheetSectionType(s.type))).length;
        const questionNumber = badgeTitleQNum > 0 ? badgeTitleQNum : questionSectionsBefore + 1;

        // Detect if this is the FIRST teacher section in the worksheet (to show the crimson page header)
        const isFirstTeacherSection = isTeacherSection && !worksheet.sections.slice(0, i).some((s: any) => {
          const nt = normalizeWorksheetSectionType(s.type);
          return s.teacherOnly || nt === 'teacher-notes' || nt === 'mark-scheme' || nt === 'answers';
        });
        return (
          <React.Fragment key={i}>
          {/* ── TEACHER COPY — ANSWER KEY full-width crimson page header ── */}
          {isFirstTeacherSection && (
            <div style={{
              marginTop: "32px",
              marginBottom: "20px",
              pageBreakBefore: "always",
              breakBefore: "page",
            }}>
              <div style={{
                background: "#7f1d1d",
                color: "#ffffff",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "0",
              }}>
                <div style={{ fontSize: "16px", fontWeight: 800, fontFamily: fmt.fontFamily, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  TEACHER COPY — ANSWER KEY
                </div>
                <div style={{ fontSize: "10px", fontStyle: "italic", fontFamily: fmt.fontFamily, opacity: 0.85 }}>
                  Not for Student Distribution
                </div>
              </div>
              <div style={{ background: "#fef2f2", padding: "8px 20px", borderLeft: "4px solid #7f1d1d", fontSize: "10px", color: "#7f1d1d", fontFamily: fmt.fontFamily, fontStyle: "italic" }}>
                Marking guidance: award marks as indicated. Accept equivalent correct answers unless otherwise stated.
              </div>
            </div>
          )}
          {/* ── Section group divider: shown before the first question of each group ── */}
          {isFirstOfGroupSection && groupInfo && (
            <div style={{
              marginBottom: "16px",
              marginTop: i > 0 ? "24px" : "0",
              pageBreakBefore: "auto",
            }}>
              <div style={{ borderTop: "2px solid #1a2744", marginBottom: "5px" }} />
              <div style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#2a7f8f",
                fontFamily: fmt.fontFamily,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}>
                {groupInfo.label} — Questions {groupInfo.qStart}–{groupInfo.qEnd}
              </div>
              <div style={{ borderTop: "1px solid #d1d5db", marginTop: "5px" }} />
            </div>
          )}
          <div
            className={`ws-section ws-section-${section.type}${isTeacherSection ? " ws-teacher-section" : ""}`}
            onClick={() => editMode && onSectionClick?.(i)}
            style={{
              marginBottom: "20px",
              background: isTeacherHeader ? "#fff8f8" : fmt.theme === "high-contrast" ? "#ffffff" : "#ffffff",
              border: fmt.theme === "high-contrast" ? "2px solid #111827" : "none",
              borderRadius: "0",
              overflow: "visible",
              cursor: editMode ? "pointer" : "default",
              outline: editMode && editedSections[i] !== undefined ? "2px solid #2a7f8f" : "none",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            {/* ── Section header: individual question OR section divider ── */}
            {isIndividualQuestion ? (
              /* Individual question: dark navy square badge + question text — matches reference PDF */
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                <div style={{
                  width: "22px", height: "22px", minWidth: "22px",
                  background: "#1B2A4A",
                  color: "#ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700,
                  borderRadius: "0",
                  fontFamily: fmt.fontFamily,
                  flexShrink: 0,
                  marginTop: "1px",
                }}>{questionNumber}</div>
                <div style={{ flex: 1 }}>
                  {/* Question type label in small teal above the question text */}
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#2a7f8f", fontFamily: fmt.fontFamily, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>
                    {section.type === "q-true-false" ? "TRUE / FALSE" :
                     section.type === "q-mcq" ? "MULTIPLE CHOICE" :
                     section.type === "q-gap-fill" ? "GAP FILL" :
                     section.type === "q-short-answer" ? "SHORT ANSWER" :
                     section.type === "q-extended" ? "EXTENDED ANSWER" :
                     section.type === "q-data-table" ? "DATA TABLE" :
                     section.type === "q-label-diagram" ? "LABEL DIAGRAM" : ""}
                  </div>
                </div>
              </div>
            ) : (
              /* Section header: thick navy rule + teal label + thin grey rule — matches reference PDF */
              <div style={{ marginBottom: "12px" }}>
                <div style={{ borderTop: isTeacherHeader ? "1.5px solid #8b1a1a" : "1.5px solid #1B2A4A", marginBottom: "4px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: "8.5px",
                    fontWeight: 700,
                    color: isTeacherHeader ? "#8b1a1a" : "#2A6F6F",
                    fontFamily: fmt.fontFamily,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}>
                    {isTeacherHeader ? "TEACHER COPY — ANSWER KEY" : groupLabel}
                  </span>
                  {isTeacherSection && !isTeacherHeader && (
                    <span style={{ background: "#8b1a1a", color: "#fff", padding: "1px 7px", borderRadius: "2px", fontSize: "9px", fontWeight: 700, fontFamily: fmt.fontFamily, letterSpacing: "0.05em" }}>TEACHER ONLY</span>
                  )}
                </div>
                <div style={{ borderTop: isTeacherHeader ? "0.4px solid #8b1a1a" : "0.4px solid #cccccc", marginTop: "4px" }} />
              </div>
            )}

            {/* Section content */}
            <div style={{
              padding: "0",
              background: isTeacherHeader ? "#fff8f8" : (fmt.sectionBgColor || "#ffffff"),
            }}>
              {/* Detect and render inline SVG diagram if content has [[DIAGRAM:{...}]] marker */}
              {(() => {
                const diagramSpec = extractDiagramSpec(content);
                const textContent = diagramSpec ? stripDiagramMarker(content) : null;
                if (diagramSpec && fmt.theme !== "high-contrast") {
                  return (
                    <div>
                      {textContent && (
                        <div style={{ marginBottom: "10px" }}>
                          {section.type === "vocabulary" ? (
                            <VocabSection content={textContent} fmt={fmt} overlayColor={overlayColor} />
                          ) : (
                            formatContent(textContent, fmt)
                          )}
                        </div>
                      )}
                      <div style={{ margin: "0 auto", maxWidth: "460px" }}>
                        <SVGDiagram
                          spec={diagramSpec}
                          width={440}
                          height={200}
                          fontFamily={fmt.fontFamily}
                          fontSize={fmt.fontSize - 1}
                          accentColor={fmt.accentColor}
                          showCallouts={isTeacherView}
                        />
                        <p style={{ fontSize: `${fmt.fontSize - 2}px`, color: "#6b7280", textAlign: "center", marginTop: "4px", fontFamily: fmt.fontFamily, fontStyle: "italic" }}>
                          Diagram — refer to this when answering the questions above
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {/* Standard content rendering (no diagram marker) */}
              {!extractDiagramSpec(content) && (
                section.type === "diagram" && (resolveImageUrl(section) || section.svg) ? (
                  <div style={{ textAlign: "center" }}>
                    {resolveImageUrl(section) ? (
                      <img
                        src={resolveImageUrl(section)}
                        alt={section.caption || "Diagram"}
                        style={{ maxWidth: "560px", width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          if (section.svg) {
                            const svgWrapper = document.createElement("div");
                            svgWrapper.style.cssText = "display:inline-block;width:100%;max-width:560px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:white;";
                            svgWrapper.innerHTML = section.svg;
                            target.parentNode?.insertBefore(svgWrapper, target.nextSibling);
                          } else {
                            const fallback = document.createElement("div");
                            fallback.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:24px;border:1px dashed #d1d5db;border-radius:8px;background:#f9fafb;max-width:560px;"><span style="font-size:22px">🖼️</span><span style="color:#6b7280;font-style:italic;font-size:13px;">Diagram unavailable — the image could not be loaded.<br><span style=\"font-size:11px;color:#9ca3af\">Tip: ensure you have an internet connection and try regenerating.</span></span></div>';
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
                    {section.attribution && !/wikimedia|wikipedia|commons\.wiki/i.test(section.attribution) && (
                      <p style={{ fontSize: `${fmt.fontSize - 3}px`, color: "#9ca3af", marginTop: "2px", fontFamily: fmt.fontFamily }}>
                        Source: {section.attribution}
                      </p>
                    )}
                  </div>
                ) : (() => {
                  // ── New individual question type dispatch ──
                  // These types come from the new AI prompt schema and each
                  // represent a single question with its own number badge.
                  if (section.type === "q-true-false") {
                    return <TrueFalseSection content={content} fmt={fmt} overlayColor={overlayColor} isTeacher={isTeacherView} />;
                  }
                  if (section.type === "q-mcq") {
                    return <MCQSection content={content} fmt={fmt} overlayColor={overlayColor} isTeacher={isTeacherView} />;
                  }
                  if (section.type === "q-gap-fill") {
                    return <GapFillInlineSection content={content} fmt={fmt} overlayColor={overlayColor} />;
                  }
                  if (section.type === "q-short-answer" || section.type === "q-extended") {
                    // Check if content has sub-questions (a)(b)(c) format
                    const subQPattern = /^\s*\([a-z]\)/m;
                    const hasSubQuestions = subQPattern.test(content);

                    if (hasSubQuestions) {
                      // Split into intro text + sub-questions
                      const allLines = content.split("\n");
                      const introLines: string[] = [];
                      const subQBlocks: { letter: string; text: string; marks: number }[] = [];
                      let currentSub: { letter: string; text: string; marks: number } | null = null;

                      for (const line of allLines) {
                        const subMatch = line.match(/^\s*\(([a-z])\)\s*(.*)/);
                        if (subMatch) {
                          if (currentSub) subQBlocks.push(currentSub);
                          const mMatch = subMatch[2].match(/\[(\d+)\s*marks?\]/i);
                          currentSub = {
                            letter: subMatch[1],
                            text: subMatch[2].replace(/\[\d+\s*marks?\]/i, "").trim(),
                            marks: mMatch ? parseInt(mMatch[1]) : 2,
                          };
                        } else if (currentSub) {
                          currentSub.text += " " + line.trim();
                        } else {
                          introLines.push(line);
                        }
                      }
                      if (currentSub) subQBlocks.push(currentSub);

                      const introText = introLines.join("\n").replace(/\[\d+\s*marks?\]/i, "").trim();
                      const totalMarks = subQBlocks.reduce((s, q) => s + q.marks, 0) || (section.marks as number || 5);

                      return (
                        <div>
                          {/* Extract / stimulus block */}
                          {introText && (
                            <div style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderLeft: "4px solid #1B2A4A",
                              borderRadius: "4px",
                              padding: "10px 14px",
                              marginBottom: "14px",
                              fontSize: `${fmt.fontSize}px`,
                              fontFamily: fmt.fontFamily,
                              lineHeight: String(fmt.lineHeight),
                              color: "#1e293b",
                            }} dangerouslySetInnerHTML={{ __html: renderMath(introText) }} />
                          )}
                          <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", marginBottom: "10px" }}>[{totalMarks} marks total]</div>
                          {subQBlocks.map((sq, si) => (
                            <div key={si} style={{ marginBottom: "16px" }}>
                              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
                                <span style={{
                                  fontWeight: 700,
                                  fontSize: `${fmt.fontSize}px`,
                                  fontFamily: fmt.fontFamily,
                                  color: "#1B2A4A",
                                  minWidth: "20px",
                                }}>({sq.letter})</span>
                                <div style={{ flex: 1, fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b" }}
                                  dangerouslySetInnerHTML={{ __html: renderMath(sq.text) }} />
                                <span style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", whiteSpace: "nowrap" as const }}>[{sq.marks}m]</span>
                              </div>
                              {Array.from({ length: Math.max(sq.marks + 1, 2) }).map((_: unknown, li: number) => (
                                <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: "28px", width: "100%", marginBottom: "3px" }} />
                              ))}
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Standard single-question format
                    const marksMatch = content.match(/\[(\d+)\s*marks?\]/i);
                    const marks = marksMatch ? parseInt(marksMatch[1]) : (section.marks as number || 4);
                    const lineCount = Math.max(marks + 1, 3);
                    const questionText = content.replace(/\[\d+\s*marks?\]/i, "").trim();
                    return (
                      <div>
                        <div style={{
                          fontSize: `${fmt.fontSize}px`,
                          fontFamily: fmt.fontFamily,
                          lineHeight: String(fmt.lineHeight),
                          color: "#1e293b",
                          marginBottom: "12px",
                        }} dangerouslySetInnerHTML={{ __html: renderMath(questionText) }} />
                        <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", marginBottom: "8px", fontFamily: fmt.fontFamily }}>
                          [{marks} mark{marks !== 1 ? "s" : ""}]
                        </div>
                        {Array.from({ length: lineCount }).map((_: unknown, li: number) => (
                          <div key={li} style={{
                            borderBottom: "1px solid #d1d5db",
                            height: "32px",
                            width: "100%",
                            marginBottom: "4px",
                          }} />
                        ))}
                      </div>
                    );
                  }
                  if (section.type === "common-mistakes") {
                    const lines = content.split("\n").filter(Boolean);
                    const mistakes: { title: string; explanation: string }[] = [];
                    let current: { title: string; explanation: string } | null = null;
                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (trimmed.startsWith("→") || trimmed.startsWith("->")) {
                        if (current) current.explanation = trimmed.replace(/^(→|->)+\s*/, "");
                      } else if (trimmed.length > 0) {
                        if (current) mistakes.push(current);
                        current = { title: trimmed.replace(/^\*+|\*+$/g, "").trim(), explanation: "" };
                      }
                    }
                    if (current) mistakes.push(current);
                    return (
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
                        {mistakes.map((m, mi) => (
                          <div key={mi}>
                            <div style={{ fontWeight: 700, fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, color: "#1a2744", marginBottom: "3px" }}>{m.title}</div>
                            {m.explanation && (
                              <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, color: "#374151", paddingLeft: "16px" }}>
                                <span style={{ color: "#2a7f8f", fontWeight: 700, marginRight: "6px" }}>→</span>
                                <span dangerouslySetInnerHTML={{ __html: renderMath(m.explanation) }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  // ── New question type renderers ──
                  if (section.type === "q-circuit") {
                    // Circuit diagram box with sub-questions
                    const autoSvg = (worksheet.metadata as any)?.autoGeneratedDiagrams?.["auto-circuit"];
                    return (
                      <div>
                        <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b", marginBottom: "12px" }}
                          dangerouslySetInnerHTML={{ __html: renderMath(content.replace(/\[\d+\s*marks?\]/i, "").trim()) }} />
                        <div style={{ border: "2px solid #1a2744", borderRadius: "6px", minHeight: "180px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", marginBottom: "12px", padding: "12px" }}>
                          {autoSvg ? (
                            <div dangerouslySetInnerHTML={{ __html: autoSvg }} />
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: "13px", fontStyle: "italic" }}>Circuit diagram space</span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", marginBottom: "8px" }}>[{(section.marks as number) || 4} marks]</div>
                        {Array.from({ length: (section.marks as number) || 4 }).map((_: unknown, li: number) => (
                          <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: "32px", width: "100%", marginBottom: "4px" }} />
                        ))}
                      </div>
                    );
                  }
                  if (section.type === "q-draw") {
                    // Draw box template
                    return (
                      <div>
                        <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b", marginBottom: "12px" }}
                          dangerouslySetInnerHTML={{ __html: renderMath(content.replace(/\[\d+\s*marks?\]/i, "").trim()) }} />
                        <div style={{ border: "2px solid #1a2744", borderRadius: "6px", minHeight: "200px", background: "#fafafa", marginBottom: "8px", position: "relative" as const }}>
                          <span style={{ position: "absolute" as const, bottom: "8px", right: "12px", color: "#d1d5db", fontSize: "11px" }}>Draw here</span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic" }}>[{(section.marks as number) || 3} marks]</div>
                      </div>
                    );
                  }
                  if (section.type === "q-graph") {
                    // Graph box template with grid lines
                    const gridSize = 20;
                    const cols = 14; const rows = 10;
                    return (
                      <div>
                        <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b", marginBottom: "12px" }}
                          dangerouslySetInnerHTML={{ __html: renderMath(content.replace(/\[\d+\s*marks?\]/i, "").trim()) }} />
                        <svg width={cols * gridSize} height={rows * gridSize} style={{ border: "2px solid #1a2744", display: "block", marginBottom: "8px" }}>
                          {Array.from({ length: cols + 1 }).map((_: unknown, ci: number) => (
                            <line key={`v${ci}`} x1={ci * gridSize} y1={0} x2={ci * gridSize} y2={rows * gridSize} stroke="#e5e7eb" strokeWidth="1" />
                          ))}
                          {Array.from({ length: rows + 1 }).map((_: unknown, ri: number) => (
                            <line key={`h${ri}`} x1={0} y1={ri * gridSize} x2={cols * gridSize} y2={ri * gridSize} stroke="#e5e7eb" strokeWidth="1" />
                          ))}
                        </svg>
                        <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic" }}>[{(section.marks as number) || 4} marks]</div>
                      </div>
                    );
                  }
                  if (section.type === "q-data-table") {
                    // Detect sequencing/ordering format: lines starting with [ ]
                    const seqLines = content.split("\n").filter(l => /^\s*\[\s*\]/.test(l));
                    if (seqLines.length >= 3) {
                      // Sequencing layout: numbered boxes for students to fill in order
                      const instrLines = content.split("\n").filter(l => !/^\s*\[\s*\]/.test(l) && !/^\d+\s*marks?:/i.test(l));
                      const instrText = instrLines.filter(l => !l.includes("|") && !/^[-|:\s]+$/.test(l)).join(" ").replace(/\[\d+\s*marks?\]/i, "").trim();
                      const items = seqLines.map(l => l.replace(/^\s*\[\s*\]\s*/, "").trim());
                      return (
                        <div>
                          {instrText && (
                            <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b", marginBottom: "12px" }}
                              dangerouslySetInnerHTML={{ __html: renderMath(instrText) }} />
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                            {items.map((item, ii) => (
                              <div key={ii} style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                border: "1.5px solid #d1d5db", borderRadius: "4px",
                                padding: "8px 10px", background: "white",
                              }}>
                                <div style={{
                                  width: "28px", height: "28px", border: "2px solid #1B2A4A",
                                  borderRadius: "3px", flexShrink: 0,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "11px", fontWeight: 700, color: "#1B2A4A",
                                }} />
                                <span style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, color: "#1e293b" }}
                                  dangerouslySetInnerHTML={{ __html: renderMath(item) }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", marginTop: "8px" }}>
                            Write the correct number (1–{items.length}) in each box.
                          </div>
                        </div>
                      );
                    }
                    // Standard table format — extract intro text before the table
                    const tableLines = content.split("\n");
                    const introTextLines: string[] = [];
                    const tableBodyLines: string[] = [];
                    let foundTable = false;
                    for (const tl of tableLines) {
                      if (!foundTable && tl.includes("|") && tl.split("|").length >= 3 && !/^[-|:\s]+$/.test(tl)) {
                        foundTable = true;
                      }
                      if (foundTable) {
                        tableBodyLines.push(tl);
                      } else {
                        introTextLines.push(tl);
                      }
                    }
                    const tableIntroText = introTextLines.join("\n").replace(/\[\d+\s*marks?\]/i, "").trim();
                    const marksMatchTable = content.match(/\[(\d+)\s*marks?\]/i);
                    const tableMarks = marksMatchTable ? parseInt(marksMatchTable[1]) : (section.marks as number || 6);
                    const tableOnlyContent = tableBodyLines.join("\n");
                    return (
                      <div>
                        {tableIntroText && (
                          <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b", marginBottom: "10px" }}
                            dangerouslySetInnerHTML={{ __html: renderMath(tableIntroText) }} />
                        )}
                        <TableCompleteSection content={tableOnlyContent || content} fmt={fmt} isTeacher={isTeacherView} />
                        {!tableIntroText && (
                          <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", marginTop: "6px" }}>[{tableMarks} marks]</div>
                        )}
                      </div>
                    );
                  }
                  if (section.type === "q-label-diagram") {
                    const resolvedImageUrl = resolveImageUrl(section);
                    // If content uses diagram_subquestions layout, show diagram + questions format
                    if (/^LAYOUT:diagram_subquestions/.test(content.trim())) {
                      return <DiagramSubQSection content={content} fmt={fmt} overlayColor={overlayColor} isTeacher={isTeacherView} imageUrl={resolvedImageUrl} caption={section.caption} attribution={section.attribution} />;
                    }
                    return <LabelDiagramSection content={content} fmt={fmt} isTeacher={isTeacherView} imageUrl={resolvedImageUrl} caption={section.caption} attribution={section.attribution} />
                  }
                  if (section.type === "q-ordering") {
                    return <OrderingSection content={content} fmt={fmt} />;
                  }                  if (section.type === "q-matching") {
                    return <MatchingSection content={content} fmt={fmt} />;
                  }
                  if (section.type === "q-challenge") {
                    // Challenge question — supports multi-part sub-questions (a)(b)(c)(d)
                    const subQPattern = /^\s*\([a-z]\)/m;
                    const hasSubQs = subQPattern.test(content);
                    if (hasSubQs) {
                      const allChalLines = content.split("\n");
                      const challengeIntroLines: string[] = [];
                      const challengeSubQs: { letter: string; text: string; marks: number }[] = [];
                      let currentChalSub: { letter: string; text: string; marks: number } | null = null;
                      for (const cline of allChalLines) {
                        const subMatch = cline.match(/^\s*\(([a-z])\)\s*(.*)/);
                        if (subMatch) {
                          if (currentChalSub) challengeSubQs.push(currentChalSub);
                          const mMatch = subMatch[2].match(/\[(\d+)\s*marks?\]/i);
                          currentChalSub = { letter: subMatch[1], text: subMatch[2].replace(/\[\d+\s*marks?\]/i, "").trim(), marks: mMatch ? parseInt(mMatch[1]) : 2 };
                        } else if (currentChalSub) {
                          currentChalSub.text += " " + cline.trim();
                        } else {
                          challengeIntroLines.push(cline);
                        }
                      }
                      if (currentChalSub) challengeSubQs.push(currentChalSub);
                      const challengeIntroText = challengeIntroLines.join("\n").replace(/\[\d+\s*marks?\]/i, "").trim();
                      const challengeTotalMarks = challengeSubQs.reduce((s, q) => s + q.marks, 0) || (section.marks as number || 6);
                      return (
                        <div>
                          {challengeIntroText && (
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: "4px solid #1B2A4A", borderRadius: "4px", padding: "10px 14px", marginBottom: "14px", fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b" }}
                              dangerouslySetInnerHTML={{ __html: renderMath(challengeIntroText) }} />
                          )}
                          <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", marginBottom: "10px" }}>[{challengeTotalMarks} marks total]</div>
                          {challengeSubQs.map((sq, si) => (
                            <div key={si} style={{ marginBottom: "16px" }}>
                              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
                                <span style={{ fontWeight: 700, fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, color: "#1B2A4A", minWidth: "20px" }}>({sq.letter})</span>
                                <div style={{ flex: 1, fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b" }}
                                  dangerouslySetInnerHTML={{ __html: renderMath(sq.text) }} />
                                <span style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", whiteSpace: "nowrap" as const }}>[{sq.marks}m]</span>
                              </div>
                              {Array.from({ length: Math.max(sq.marks + 1, 2) }).map((_: unknown, li: number) => (
                                <div key={li} style={{ borderBottom: "1px solid #d1d5db", height: "28px", width: "100%", marginBottom: "3px" }} />
                              ))}
                            </div>
                          ))}
                        </div>
                      );
                    }
                    // Single-part challenge question
                    const challengeMarksMatch = content.match(/\[(\d+)\s*marks?\]/i);
                    const challengeMarks = challengeMarksMatch ? parseInt(challengeMarksMatch[1]) : (section.marks as number || 6);
                    const challengeText = content.replace(/\[\d+\s*marks?\]/i, "").trim();
                    return (
                      <div>
                        <div style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b", marginBottom: "12px" }}
                          dangerouslySetInnerHTML={{ __html: renderMath(challengeText) }} />
                        <div style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", marginBottom: "8px" }}>[{challengeMarks} marks]</div>
                        {Array.from({ length: Math.max(challengeMarks + 1, 4) }).map((_: unknown, li: number) => (
                          <div key={li} style={{ borderBottom: "1px solid #d1d5db", minHeight: "28px", marginBottom: "6px" }} />
                        ))}
                      </div>
                    );
                  }
                  // —— Advanced question types (from pasted spec) ——─
                  if (section.type === "q-error-correction" || section.type === "error_correction") {
                    return <ErrorCorrectionSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (section.type === "q-ranking" || section.type === "ranking") {
                    return <RankingSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (section.type === "q-what-changed" || section.type === "what_changed") {
                    return <WhatChangedSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (section.type === "q-constraint-problem" || section.type === "constraint_problem") {
                    return <ConstraintProblemSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (section.type === "prior-knowledge") {
                    // Prior knowledge check — appears after LO, before vocab
                    const pkLines = content.split("\n").filter(Boolean);
                    return (
                      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "6px", padding: "14px 16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#0369a1", letterSpacing: "0.05em", marginBottom: "10px", fontFamily: fmt.fontFamily }}>PRIOR KNOWLEDGE CHECK</div>
                        {pkLines.map((line: string, li: number) => (
                          <div key={li} style={{ fontSize: `${fmt.fontSize}px`, fontFamily: fmt.fontFamily, lineHeight: String(fmt.lineHeight), color: "#1e293b", marginBottom: "8px" }}
                            dangerouslySetInnerHTML={{ __html: renderMath(line.replace(/^\d+[.)\s]+/, "").trim()) }} />
                        ))}
                      </div>
                    );
                  }

                  // ── Layout-family dispatch (new structured layout system) ──
                  // If the content starts with LAYOUT:<type>, route to the
                  // matching sub-renderer. Falls through to existing handlers
                  // if no tag is present, so all pre-existing worksheets still
                  // render correctly.
                  const layoutTag = readLayoutTag(content);
                  if (layoutTag === "true_false") {
                    return <TrueFalseSection content={content} fmt={fmt} overlayColor={overlayColor} isTeacher={isTeacherView} />;
                  }
                  if (layoutTag === "mcq_2col") {
                    return <MCQSection content={content} fmt={fmt} overlayColor={overlayColor} isTeacher={isTeacherView} />;
                  }
                  if (layoutTag === "gap_fill_inline") {
                    return <GapFillInlineSection content={content} fmt={fmt} overlayColor={overlayColor} />;
                  }
                  if (layoutTag === "label_diagram") {
                    return <LabelDiagramSection content={content} fmt={fmt} isTeacher={isTeacherView} imageUrl={resolveImageUrl(section)} caption={section.caption} attribution={section.attribution} />;
                  }
                  if (layoutTag === "diagram_subquestions") {
                    return <DiagramSubQSection content={content} fmt={fmt} overlayColor={overlayColor} imageUrl={resolveImageUrl(section)} caption={section.caption} attribution={section.attribution} />;
                  }
                  if (layoutTag === "table_complete") {
                    return <TableCompleteSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (layoutTag === "draw_box") {
                    return <DrawBoxSection content={content} fmt={fmt} />;
                  }
                  if (layoutTag === "ordering") {
                    return <OrderingSection content={content} fmt={fmt} />;
                  }
                  if (layoutTag === "matching") {
                    return <MatchingSection content={content} fmt={fmt} />;
                  }
                  if (layoutTag === "annotation_task") {
                    return <AnnotationTaskSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (layoutTag === "build_it_grid") {
                    return <BuildItGridSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (layoutTag === "error_correction") {
                    return <ErrorCorrectionSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (layoutTag === "ranking") {
                    return <RankingSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (layoutTag === "what_changed") {
                    return <WhatChangedSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  if (layoutTag === "constraint_problem") {
                    return <ConstraintProblemSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                  }
                  // ── Auto-detection from AI content patterns ────────────────────────────────             // Broadly detects actual AI output patterns. Intentionally
                  // permissive — better to render with a sub-renderer than fall through.
                  if (!layoutTag) {
                    const c = content;
                    const rawLines = c.split("\n");
                    const lines = rawLines.map((l: string) => l.trim()).filter(Boolean);
                    const titleLower = (section.title || "").toLowerCase();

                    // TRUE/FALSE: numbered lines ending in TRUE or FALSE
                    const tfLines = lines.filter((l: string) =>
                      /\b(TRUE|FALSE)\b/.test(l) && /^\d+[.)\s]/.test(l)
                    );
                    const hasTrueFalse =
                      tfLines.length >= 2 ||
                      (/true or false|circle.*true|FORMAT 1 TRUE/i.test(c) && c.includes("TRUE") && c.includes("FALSE"));

                    // MCQ: 3+ lines starting with A/B/C/D
                    const mcqLines = lines.filter((l: string) => /^[A-D][.)\s]{1,3}\S/.test(l));
                    const hasMCQ = mcqLines.length >= 3 && !hasTrueFalse;

                    // GAP FILL: 2+ blanks (___). Word bank NOT required.
                    const blankCount = (c.match(/_{3,}/g) || []).length;
                    const hasGapFill =
                      blankCount >= 2 && !hasTrueFalse && !hasMCQ &&
                      (section.type === "guided" || /fill|blank|complete.*sentence|word bank/i.test(c));

                    // TABLE: 3+ pipe-separated lines
                    const pipeLines = lines.filter((l: string) =>
                      l.includes("|") && l.split("|").length >= 3 && !l.startsWith("http")
                    );
                    const hasTable = pipeLines.length >= 3 && section.type !== "vocabulary" && !hasTrueFalse && !hasMCQ;

                    // ORDERING: ☐ checkboxes or ordering instruction
                    const checkboxLines = lines.filter((l: string) => l.startsWith("☐") || /^[□\[\]]\s/.test(l));
                    const hasOrdering =
                      checkboxLines.length >= 3 ||
                      (/number the|put.*in.*order|correct order|sequence these/i.test(c) && lines.length >= 5);

                    // MATCHING: ←→ or explicit match instruction
                    const hasMatching =
                      c.includes("←→") ||
                      (/match each|draw a line between|connect each/i.test(c) && /\d+[.)]/m.test(c));

                    // DRAW BOX: challenge section with draw/sketch/circuit instruction
                    const hasDrawBox =
                      section.type === "challenge" &&
                      /^(draw|sketch|design a circuit|plot|create a diagram)/i.test(c.trim());

                    // MULTI-FORMAT: section contains multiple format markers — split and render each block
                    const blockSplit = c.split(/\n\n+/).filter((b: string) => b.trim().length > 10);
                    if (blockSplit.length >= 2) {
                      const blockHasTF = blockSplit.some((b: string) => {
                        const bLines = b.split("\n");
                        return bLines.filter((l: string) => /\b(TRUE|FALSE)\b/.test(l) && /^\d+[.)\s]/.test(l.trim())).length >= 2;
                      });
                      const blockHasMCQ = blockSplit.some((b: string) => {
                        return b.split("\n").filter((l: string) => /^[A-D][.)\s]{1,3}\S/.test(l.trim())).length >= 3;
                      });
                      const blockHasGap = blockSplit.some((b: string) => (b.match(/_{3,}/g) || []).length >= 2);

                      if (blockHasTF || blockHasMCQ || (blockHasGap && blockSplit.length >= 2)) {
                        return (
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: "20px" }}>
                            {blockSplit.map((block: string, bi: number) => {
                              const bLines = block.split("\n").map((l: string) => l.trim()).filter(Boolean);
                              const bTF = bLines.filter((l: string) => /\b(TRUE|FALSE)\b/.test(l) && /^\d+[.)\s]/.test(l)).length >= 2;
                              const bMCQ = bLines.filter((l: string) => /^[A-D][.)\s]{1,3}\S/.test(l)).length >= 3;
                              const bGap = (block.match(/_{3,}/g) || []).length >= 2;
                              if (bTF) return <TrueFalseSection key={bi} content={block} fmt={fmt} overlayColor={overlayColor} isTeacher={isTeacherView} />;
                              if (bMCQ) return <MCQSection key={bi} content={block} fmt={fmt} overlayColor={overlayColor} isTeacher={isTeacherView} />;
                              if (bGap) return <GapFillInlineSection key={bi} content={block} fmt={fmt} overlayColor={overlayColor} />;
                              return <div key={bi}>{formatContent(block, fmt)}</div>;
                            })}
                          </div>
                        );
                      }
                    }

                    if (hasTrueFalse) return <TrueFalseSection content={content} fmt={fmt} overlayColor={overlayColor} isTeacher={isTeacherView} />;
                    if (hasMCQ)      return <MCQSection content={content} fmt={fmt} overlayColor={overlayColor} isTeacher={isTeacherView} />;
                    if (hasGapFill)  return <GapFillInlineSection content={content} fmt={fmt} overlayColor={overlayColor} />;
                    if (hasTable)    return <TableCompleteSection content={content} fmt={fmt} isTeacher={isTeacherView} />;
                    if (hasOrdering) return <OrderingSection content={content} fmt={fmt} />;
                    if (hasMatching) return <MatchingSection content={content} fmt={fmt} />;
                    if (hasDrawBox)  return <DrawBoxSection content={content} fmt={fmt} />;
                  }
                  // No layout tag matched — fall through to existing type-based handlers below
                  return undefined;
                })() ?? (section.type === "vocabulary" ? (
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
                ) : section.type === "example" ? (
                  <WorkedExampleSection content={content} fmt={fmt} />
                ) : section.type === "word-problems" ? (
                  <WordProblemsSection content={content} fmt={fmt} overlayColor={overlayColor} />
                ) : (section.type === "mark-scheme" || section.type === "answers") ? (
                  <MarkSchemeSection content={content} fmt={fmt} />
                ) : section.type === "questions" ? (
                  <div>{formatContent(content, fmt)}</div>
                ) : (section.type === "reading" || section.type === "passage" || section.type === "source-text" || section.type === "comprehension" || /reading.?passage|source.?text|comprehension.?text/i.test(section.title || "")) ? (
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
                ))
              )}

              {/* ── Universal visual aid block ──────────────────────────────────────────────
               * If a section has an svg or imageUrl but is NOT type="diagram" (which has its
               * own dedicated renderer above), we still render the visual aid here so that
               * any section type can carry an illustrative image or inline SVG.
               * This ensures the svg/caption fields on the Section type are fully utilised
               * regardless of the section's content type.
               */}
              {section.type !== "diagram" && section.type !== "q-label-diagram" && !extractDiagramSpec(content) && (section.svg || resolveImageUrl(section)) && (
                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  {resolveImageUrl(section) ? (
                    <img
                      src={resolveImageUrl(section)}
                      alt={section.caption || "Visual aid"}
                      style={{ maxWidth: "520px", width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        if (section.svg) {
                          const wrapper = document.createElement("div");
                          wrapper.style.cssText = "display:inline-block;width:100%;max-width:520px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:white;";
                          wrapper.innerHTML = section.svg;
                          target.parentNode?.insertBefore(wrapper, target.nextSibling);
                        }
                      }}
                    />
                  ) : section.svg ? (
                    <div
                      style={{ display: "inline-block", width: "100%", maxWidth: "520px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "white" }}
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
              )}

              {/* Answer boxes for practice sections — size-controlled, removable in edit mode */}
              {!isTeacherSection && (section.type === "independent" || section.type === "guided" || section.type === "challenge") && !/(sentence starter:|steps to follow:|quick start:|what you need to do:|help box|key facts|word bank)/i.test(String(content || "")) && (() => {
                const lineCount = getAnswerLines(i, section.type, String(content || ""));
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
                          style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", border: "1px solid #4f46e5", background: "#ede9fe", color: "#4f46e5", cursor: "pointer", fontWeight: 600 }}
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
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#4f46e5", fontFamily: fmt.fontFamily }}>Answer box:</span>
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
          </React.Fragment>
        );
      })}

      {/* ── Footer ── */}
      {isRevisionMat ? (
        <div style={{ marginTop: "6px", padding: "4px 8px", display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#9ca3af", fontFamily: fmt.fontFamily }}>
          <span>Generated by Adaptly · adaptly.co.uk</span>
          <span>{worksheet.metadata.yearGroup} {worksheet.metadata.subject && `| ${worksheet.metadata.subject}`} {worksheet.metadata.topic && `| ${worksheet.metadata.topic}`}</span>
          <span>{new Date().toLocaleDateString("en-GB")}</span>
        </div>
      ) : isPrimary ? (
        <div className="ws-footer" style={{
          marginTop: "10px",
          padding: "5px 10px",
          background: overlayColor || "#ffffff",
          borderRadius: "4px",
          border: "1.5px solid #4f46e5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "4px",
          fontSize: "10px",
          color: "#4f46e5",
          fontFamily: fmt.fontFamily,
        }}>
          <span style={{ fontWeight: 600 }}>Generated by Adaptly</span>
          <span style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {worksheet.metadata.yearGroup && <span>{worksheet.metadata.yearGroup}</span>}
            {worksheet.metadata.subject && <span>| {worksheet.metadata.subject.charAt(0).toUpperCase() + worksheet.metadata.subject.slice(1)}</span>}
            {worksheet.metadata.topic && <span>| {worksheet.metadata.topic}</span>}
          </span>
          <span>{new Date().toLocaleDateString("en-GB")} | adaptly.co.uk</span>
        </div>
      ) : (
        /* ── SECONDARY: clean minimal footer ── */
        <div className="ws-footer" style={{
          marginTop: "24px",
          borderTop: "1.5px solid #d1d5db",
          paddingTop: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "9px",
          color: "#9ca3af",
          fontFamily: fmt.fontFamily,
        }}>
          <span>Generated by Adaptly · adaptly.co.uk</span>
          <span style={{ display: "flex", gap: "4px" }}>
            {worksheet.metadata.yearGroup && <span>{worksheet.metadata.yearGroup}</span>}
            {worksheet.metadata.subject && <span>· {worksheet.metadata.subject.charAt(0).toUpperCase() + worksheet.metadata.subject.slice(1)}</span>}
            {worksheet.metadata.topic && <span>· {worksheet.metadata.topic}</span>}
            {worksheet.metadata.difficulty && worksheet.metadata.difficulty !== "mixed" && (
              <span>· {worksheet.metadata.difficulty === "foundation" ? "Foundation" : "Higher"}</span>
            )}
            {/* SEND need not shown in footer — adaptations are applied invisibly */}
          </span>
          <span>{new Date().toLocaleDateString("en-GB")}</span>
        </div>
      )}
    </div>
  );
});

WorksheetRenderer.displayName = "WorksheetRenderer";
export default WorksheetRenderer;

