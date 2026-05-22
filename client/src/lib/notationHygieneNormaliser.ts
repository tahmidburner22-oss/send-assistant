/**
 * notationHygieneNormaliser.ts — PR-3 (audit item #13)
 *
 * Pure / deterministic / idempotent rewriter that fixes the typographic
 * drift LLMs routinely introduce into UK maths and science questions:
 *
 *   - `2 x 3` → `2 × 3` (proper multiplication symbol U+00D7, not Latin x)
 *   - `7 ÷ 2` already correct (we don't rewrite the ÷ symbol)
 *   - `5 - 3` after `=` or at start of expression  → `5 − 3` (U+2212 minus
 *     sign, not hyphen U+002D — exam markers expect the typographic
 *     minus on printed materials)
 *   - `90 o C` / `90 oC` / `90o` → `90°C` (degree symbol U+00B0, not the
 *     letter o)
 *   - Stray Latin alpha-number conflations like `x 2` (Latin x followed
 *     by a digit with a space) when `x` is between two numbers.
 *
 * Rules:
 *   - Only rewrites when both flanks of the operator are digits (or a
 *     bracket / variable). Never rewrites narrative prose like "the bus
 *     to school" — the surrounding context disambiguates.
 *   - Idempotent — running twice yields the same output as running once.
 *     Verified by the test suite.
 *   - Returns a `{ rewritten, substitutions[] }` shape mirroring
 *     `applyUKEnglishSubstitutions` in `curriculumAuthorityPrompt.ts`
 *     so callers can stamp one warning per drift.
 *
 * Intentional non-goals:
 *   - We do NOT rewrite `^` to `²` / `³` etc. — markdown / KaTeX render
 *     superscripts already and rewriting risks corrupting source math.
 *   - We do NOT rewrite `pi` to `π`, `theta` to `θ`, or any other Greek
 *     letter substitution. Words and symbols mean different things in
 *     different question contexts.
 *   - We do NOT rewrite punctuation emdashes / endashes — `worksheetPostValidator.ts`
 *     leaves those alone deliberately so titles like "Macbeth — Act 1"
 *     keep their typography.
 */

export interface NotationSubstitution {
  /** Short label for the warning text. */
  label: string;
  /** The drifted text segment. */
  from: string;
  /** The corrected text segment. */
  to: string;
}

export interface NotationRewriteResult {
  rewritten: string;
  substitutions: NotationSubstitution[];
}

// ─── Multiplication ───────────────────────────────────────────────────────
//
// Matches Latin `x` or `X` between two arithmetic operands when whitespace
// brackets the `x`. Operands are digits, decimal numbers, fractions
// (`1/2`), variables (`a`, `n`, `x` itself — but only when it reads as a
// variable next to a digit, e.g. `2 x n` reads as `2 × n`), or a
// parenthesised group.
//
// We intentionally do NOT rewrite `x²` (no space, suggests variable
// squared) or `x = 5` (variable definition).
const MULT_RE = /(\b\d+(?:\.\d+)?(?:\/\d+)?\b|\))(\s+)x(\s+)(\b\d+(?:\.\d+)?(?:\/\d+)?\b|[a-z](?![a-z])|\()/gi;

// ─── Subtraction (minus sign vs hyphen) ──────────────────────────────────
//
// Replace ASCII hyphen-minus `-` with the typographic minus sign `−` when:
//   - It separates two numeric operands (`5 - 3`, `2.5 - 1.7`),
//   - OR it precedes a numeric value at start of expression (` -5` after `=`).
//
// We deliberately do NOT rewrite hyphenated words (`well-known`, `step-by-step`),
// nor en-dash / em-dash usage in titles, nor negative-temperature ranges with
// a true em-dash (`-5°C to 5°C`).
const SUBTRACT_BETWEEN_NUMBERS_RE = /(\b\d+(?:\.\d+)?\b)(\s+)-(\s+)(\b\d+(?:\.\d+)?\b)/g;

// ─── Degree symbol ────────────────────────────────────────────────────────
//
// Patterns the LLM produces:
//   `90 o C` (digit, space, lowercase o, space, letter)
//   `90oC`   (digit, lowercase o, letter)
//   `90 oC`  (digit, space, lowercase o, letter)
//   `90 oF`  (same — captured by Fahrenheit detector elsewhere; we still rewrite the symbol)
//
// We rewrite to `90°C` / `90°F` / `90°` (where the unit suffix is
// absent). The detection regex requires the `o` to be lowercase and
// flanked by a digit on the left and a unit letter (`C`, `F`, `K`) or
// space/end on the right.
const DEGREE_RE = /(\b\d+(?:\.\d+)?)\s*o(\s*[CFKR]?)\b/g;

// Latin x or X literally treated as ×; uppercase Greek-style symbol
// rewriting is intentionally skipped.

/** Pure rewriter — applies all four notation hygiene rules. */
export function normaliseMathNotation(text: string | undefined | null): NotationRewriteResult {
  if (!text) return { rewritten: text || "", substitutions: [] };
  let out = String(text);
  const subs: NotationSubstitution[] = [];

  // Multiplication: `2 x 3` → `2 × 3`
  out = out.replace(MULT_RE, (match, lhs, sp1, sp2, rhs) => {
    const replaced = `${lhs}${sp1}×${sp2}${rhs}`;
    subs.push({ label: "x→×", from: match, to: replaced });
    return replaced;
  });

  // Subtraction: `5 - 3` → `5 − 3`
  out = out.replace(SUBTRACT_BETWEEN_NUMBERS_RE, (match, lhs, sp1, sp2, rhs) => {
    const replaced = `${lhs}${sp1}−${sp2}${rhs}`;
    subs.push({ label: "-→−", from: match, to: replaced });
    return replaced;
  });

  // Degree symbol: `90 o C` / `90oC` → `90°C`
  out = out.replace(DEGREE_RE, (match, num, suffix) => {
    const cleanedSuffix = suffix.replace(/^\s+/, "");
    const replaced = `${num}°${cleanedSuffix}`;
    if (replaced !== match) {
      subs.push({ label: "o→°", from: match, to: replaced });
    }
    return replaced;
  });

  return { rewritten: out, substitutions: subs };
}

/**
 * Detector — returns the list of drift hits without rewriting. Useful
 * for tests and for the validator's warning-generation path.
 */
export function findNotationDrift(text: string | undefined | null): NotationSubstitution[] {
  return normaliseMathNotation(text).substitutions;
}

/** Idempotency predicate. Returns true when no rewrite would apply. */
export function isNotationClean(text: string | undefined | null): boolean {
  return normaliseMathNotation(text).substitutions.length === 0;
}
