/**
 * mathsGoldRenderer.ts
 *
 * Renders a "gold-standard" maths worksheet (the 2-page A4 landscape spread)
 * from the bundled JSON schema, as a self-contained HTML document string.
 *
 * This is a faithful TypeScript port of
 *   maths-worksheets/scripts/generate_worksheet.py
 * (the WeasyPrint generator). The structure, section order, fixed millimetre
 * geometry and colour scheme are reproduced 1:1 so the on-screen render and the
 * exported PDF match the reference PDFs in maths-worksheets/pdf/.
 *
 * SEND adaptations are applied as a NON-DESTRUCTIVE overlay: every cosmetic
 * value (font family, font scale, line-height scale, letter/word spacing, page
 * background, default text colour) reads from a CSS custom property. The fixed
 * layout geometry (box positions, heights in mm, section order) is NEVER a
 * variable, so a theme can only restyle typography/colour — it cannot move,
 * add, remove or reorder content. See mathsGoldSend.ts for the theme map.
 */

// ─── Schema ────────────────────────────────────────────────────────────────

export interface GoldInfoParagraph {
  type?: string;
  text: string;
}
export interface GoldExampleRow {
  correct: boolean;
  expr: string;
  desc: string;
}
export interface GoldKeyTerms {
  id?: string;
  title: string;
  content: GoldInfoParagraph[];
}
export interface GoldWhatWeLearn {
  id?: string;
  title: string;
  examples: GoldExampleRow[];
}
export interface GoldKeyIdea {
  id?: string;
  title: string;
  text: string;
  equation: string;
  caption: string;
}
export interface GoldInfoBoxes {
  key_terms: GoldKeyTerms;
  what_we_learn: GoldWhatWeLearn;
  key_idea: GoldKeyIdea;
}
export interface GoldModelledExample {
  id?: string;
  card_color?: string;
  card_bg?: string;
  label?: string;
  question?: string;
  steps?: string[];
  answer?: string;
  explanation?: string;
}
export interface GoldPracticeQuestion {
  id: string;
  expression: string;
  answer?: string;
}
export interface GoldPracticeSection {
  id?: string;
  number: number;
  heading: string;
  heading_color?: string;
  bg_color?: string;
  border_color?: string;
  instruction: string;
  linked_example?: string;
  questions: GoldPracticeQuestion[];
}
export interface GoldMisconceptionItem {
  id: string;
  statement: string;
  correct?: boolean;
}
export interface GoldChallengeProblem {
  id: string;
  text: string;
}
export interface GoldWorksheet {
  title: string;
  objective: string;
  send_mode?: boolean;
  info_boxes: GoldInfoBoxes;
  modelled_examples: GoldModelledExample[];
  practice: GoldPracticeSection[];
  misconceptions: { items: GoldMisconceptionItem[] };
  challenge: { problems: GoldChallengeProblem[] };
}

/**
 * Cosmetic-only theme. Every field maps to a CSS custom property on the page
 * root. Omitted fields fall back to the gold defaults (Arial / Trebuchet,
 * scale 1, #111 on white) — i.e. the unadapted worksheet.
 */
export interface GoldTheme {
  /** Body font stack. Default: Arial, Helvetica, sans-serif. */
  fontFamily?: string;
  /** Title font stack. Default: 'Trebuchet MS', Arial, sans-serif. */
  titleFamily?: string;
  /** Multiplier applied to every font-size (bounded for overflow safety). */
  fontScale?: number;
  /** Multiplier applied to content line-heights. */
  lineScale?: number;
  /** CSS letter-spacing, e.g. "0.04em". Default: normal. */
  letterSpacing?: string;
  /** CSS word-spacing, e.g. "0.16em". Default: normal. */
  wordSpacing?: string;
  /** Page background tint, e.g. "#FAF3E0". Default: white. */
  pageBg?: string;
  /** Default body text colour. Default: #111. */
  textColor?: string;
  /** Optional label shown in the print header (e.g. "Dyslexia-friendly"). */
  label?: string;
}

// ─── Fraction pre-processor (port of generate_worksheet.py:preprocess) ───────

const FRAC_BRACES = /&frac\{([^}]+)\}\{([^}]+)\}/g;
const FRAC_SLASH = /(?<![A-Za-z0-9])([0-9]+)\/([0-9]+)(?![A-Za-z0-9])/g;

function replaceFracBraces(text: string): string {
  return text.replace(
    FRAC_BRACES,
    '<span class="frac"><sup>$1</sup>&frasl;<sub>$2</sub></span>'
  );
}
function replaceLooseFractions(text: string): string {
  return text.replace(
    FRAC_SLASH,
    '<span class="frac"><sup>$1</sup>&frasl;<sub>$2</sub></span>'
  );
}
/** Convert &frac{N}{M} and bare numeric N/M into typeset fraction markup. */
export function preprocessFractions(text: unknown): string {
  if (typeof text !== "string") return text == null ? "" : String(text);
  return replaceLooseFractions(replaceFracBraces(text));
}
const pp = preprocessFractions;

// ─── CSS (port of the <style> block, cosmetic values → CSS variables) ────────

/**
 * The stylesheet. Cosmetic knobs are CSS custom properties on `.ws-root`;
 * geometry (mm positions/heights, section order) is hard-coded so themes can
 * never break the 2-page structure.
 *
 * `fs(N)`  → font-size that scales with --ws-fs
 * `lh(N)`  → line-height that scales with --ws-lh
 */
const fs = (pt: number) => `calc(${pt}pt * var(--ws-fs))`;
const lh = (n: number) => `calc(${n} * var(--ws-lh))`;

export const GOLD_CSS = `
.ws-root {
  --ws-font: Arial, Helvetica, sans-serif;
  --ws-title-font: 'Trebuchet MS', Arial, sans-serif;
  --ws-fs: 1;
  --ws-lh: 1;
  --ws-letter: normal;
  --ws-word: normal;
  --ws-page-bg: #ffffff;
  --ws-text: #111111;
}
.ws-root * { box-sizing: border-box; margin: 0; padding: 0; }
.ws-root {
  font-family: var(--ws-font);
  font-size: ${fs(9)};
  color: var(--ws-text);
  background: var(--ws-page-bg);
  letter-spacing: var(--ws-letter);
  word-spacing: var(--ws-word);
}

/* fraction span (output of the preprocessor) */
.ws-root .frac { display: inline-block; white-space: nowrap; font-weight: bold; line-height: 1; vertical-align: middle; }
.ws-root .frac sup { font-size: 0.78em; vertical-align: 0.45em; }
.ws-root .frac sub { font-size: 0.78em; vertical-align: -0.25em; }
.ws-root .frac sup, .ws-root .frac sub { display: inline-block; }

/* page wrapper */
.ws-root .page { width: 285mm; height: 200mm; position: relative; overflow: hidden; page-break-after: always; background: var(--ws-page-bg); }
.ws-root .page:last-child { page-break-after: avoid; }

/* ════════ PAGE 1 ════════ */
.ws-root .p1-header { position: absolute; top: 0; left: 0; right: 0; height: 14mm; display: table; width: 100%; }
.ws-root .p1-hl, .ws-root .p1-hr { display: table-cell; width: 60mm; vertical-align: middle; font-size: ${fs(9)}; font-weight: bold; }
.ws-root .p1-hr { text-align: right; }
.ws-root .p1-hc { display: table-cell; text-align: center; vertical-align: middle; }
.ws-root .t1 { font-family: var(--ws-title-font); font-size: ${fs(20)}; font-weight: bold; color: #0f204b; line-height: 1.1; }
.ws-root .t2 { font-family: var(--ws-title-font); font-size: ${fs(18)}; font-weight: bold; color: #0f204b; line-height: 1.1; }
.ws-root .ws-badge-label { font-size: ${fs(7.5)}; color: #1f5fa6; font-weight: bold; }

.ws-root .lo { position: absolute; top: 16mm; left: 0; right: 0; height: 9mm; background: #eef3ff; border: 1.5px solid #1f5fa6; border-radius: 4px; text-align: center; line-height: 9mm; font-weight: bold; font-size: ${fs(10.5)}; }

/* three info-boxes */
.ws-root .three-cols { position: absolute; top: 26mm; left: 0; right: 0; height: 60mm; display: table; width: 100%; border-spacing: 4px 0; table-layout: fixed; overflow: hidden; }
.ws-root .ic { display: table-cell; width: 33.33%; vertical-align: top; border-radius: 5px; padding: 6px 8px; font-size: ${fs(9)}; line-height: ${lh(1.4)}; overflow: hidden; }
.ws-root .ic-blue   { border: 1.5px solid #1f5fa6; background: #f4f8ff; }
.ws-root .ic-green  { border: 1.5px solid #1e7d2e; background: #f5fdf5; }
.ws-root .ic-yellow { border: 1.5px solid #b8860b; background: #fffdf5; }
.ws-root .ct-blue   { color: #1f5fa6; font-weight: bold; font-size: ${fs(11)}; text-align: center; margin-bottom: 6px; }
.ws-root .ct-green  { color: #1e7d2e; font-weight: bold; font-size: ${fs(11)}; text-align: center; margin-bottom: 6px; }
.ws-root .ct-yellow { color: #b8860b; font-weight: bold; font-size: ${fs(11)}; text-align: center; margin-bottom: 6px; }
.ws-root .ul-b  { text-decoration: underline; color: #1f5fa6; font-weight: bold; }
.ws-root .ul-k  { text-decoration: underline; font-weight: bold; }
.ws-root .rb    { color: #cc0000; font-weight: bold; }
.ws-root .pgap  { margin-bottom: 6px; }
.ws-root .eg-t { width: 100%; border-collapse: collapse; background: white; font-size: ${fs(9)}; }
.ws-root .eg-t td { border: 1px solid #a5d6a7; padding: 4px 5px; text-align: center; line-height: 1; }
.ws-root .ok { color: white; background: #4caf50; border-radius: 50%; display: inline-block; width: 16px; height: 16px; line-height: 16px; font-weight: bold; font-size: ${fs(9)}; }
.ws-root .no { color: white; background: #f44336; border-radius: 50%; display: inline-block; width: 16px; height: 16px; line-height: 16px; font-weight: bold; font-size: ${fs(9)}; }
.ws-root .kt  { text-align: center; margin-bottom: 7px; }
.ws-root .eqr { text-align: center; margin-bottom: 6px; font-size: ${fs(14)}; font-weight: bold; }
.ws-root .ov  { border: 1.5px solid #111; border-radius: 50%; padding: 4px 10px; display: inline-block; }
.ws-root .ovr { border: 1.5px solid #cc0000; border-radius: 50%; padding: 4px 10px; color: #cc0000; display: inline-block; }
.ws-root .eqc { text-align: center; font-size: ${fs(9)}; font-weight: bold; }

/* MODELLED EXAMPLES — table layout (reliable, matches reference) */
.ws-root .mod-wrap { position: absolute; top: 88mm; left: 0; right: 0; height: 108mm; background: white; border: 1.5px solid #7b3fa0; border-radius: 5px; overflow: hidden; }
.ws-root .mod-head { background: #f5eeff; text-align: center; padding: 4px 0 3px; height: 14mm; line-height: 1.2; }
.ws-root .mht { font-size: ${fs(13)}; font-weight: bold; color: #4a148c; }
.ws-root .mhs { font-size: ${fs(9)}; color: #111; }
.ws-root .mod-body { position: absolute; top: 14mm; left: 5px; right: 5px; bottom: 5px; }
.ws-root .mod-tbl { width: 100%; height: 100%; border-collapse: separate; border-spacing: 4px 0; table-layout: fixed; }
.ws-root .mod-tbl > tbody { height: 100%; }
.ws-root .mod-tbl > tbody > tr { height: 100%; }
.ws-root .ex-c { width: 25%; vertical-align: top; padding: 0; border-radius: 4px; overflow: hidden; }
.ws-root .ex-c-1, .ws-root .ex-c-2 { border: 1.5px solid #1f5fa6; background: #eef3ff; }
.ws-root .ex-c-3 { border: 1.5px solid #cc0000; background: #fff0f0; }
.ws-root .ex-c-4 { border: 1.5px solid #1e7d2e; background: #edfaee; }

.ws-root .ex-t { font-weight: bold; font-size: ${fs(10)}; padding: 6px 4px; display: block; text-align: center; }
.ws-root .t-1, .ws-root .t-2 { background: #d0e4ff; color: #1f5fa6; }
.ws-root .t-3 { background: #ffd0d0; color: #cc0000; }
.ws-root .t-4 { background: #c8f0cc; color: #1e7d2e; }

.ws-root .ex-body { padding: 8px 8px 6px; text-align: center; }
.ws-root .ex-q { font-size: ${fs(10.5)}; margin-bottom: 10px; line-height: ${lh(1.3)}; min-height: 14mm; }
.ws-root .ex-s { margin: 6px 0 8px; line-height: ${lh(1.7)}; font-size: ${fs(11)}; min-height: 18mm; }
.ws-root .ex-a { padding: 5px 14px; font-weight: bold; font-size: ${fs(13)}; margin: 6px auto; display: inline-block; border-radius: 2px; background: white; }
.ws-root .a-1, .ws-root .a-2 { border: 1.5px solid #1f5fa6; color: #1f5fa6; }
.ws-root .a-3 { border: 1.5px solid #cc0000; color: #cc0000; }
.ws-root .a-4 { border: 1.5px solid #1e7d2e; color: #1e7d2e; }
.ws-root .ex-n { font-size: ${fs(8.5)}; color: #111; margin-top: 8px; line-height: ${lh(1.35)}; padding: 0 4px; }

/* ════════ PAGE 2 ════════ */
.ws-root .prac-wrap { position: absolute; top: 0; left: 0; right: 0; height: 73mm; border: 1.5px solid #1f5fa6; border-radius: 5px; overflow: hidden; }
.ws-root .prac-head { background: #1f5fa6; color: white; font-weight: bold; font-size: ${fs(11)}; text-align: center; height: 9mm; line-height: 9mm; }
.ws-root .prac-cols { display: table; width: 100%; height: 40mm; border-spacing: 0; table-layout: fixed; }
.ws-root .pc { display: table-cell; width: 25%; vertical-align: top; padding: 5px 8px; font-size: ${fs(9)}; }
.ws-root .pc-1, .ws-root .pc-2, .ws-root .pc-3 { border-right: 1px solid #1f5fa6; }
.ws-root .pct { font-weight: bold; font-size: ${fs(9)}; margin-bottom: 2px; }
.ws-root .t-p1, .ws-root .t-p2 { color: #1f5fa6; }
.ws-root .t-p3 { color: #cc0000; }
.ws-root .t-p4 { color: #1e7d2e; }
.ws-root .t-p5 { color: #7b3fa0; }
.ws-root .pci { font-size: ${fs(8)}; color: #111; margin-bottom: 4px; }
.ws-root .pi  { line-height: ${lh(1.9)}; font-weight: bold; }
.ws-root .prac-mixed { padding: 5px 10px 6px; border-top: 1px solid #1f5fa6; height: 23mm; }
.ws-root .pmr { display: table; width: 100%; margin-top: 2px; table-layout: fixed; }
.ws-root .pmd { display: table-cell; width: 20%; font-size: ${fs(9)}; font-weight: bold; padding: 4px 0; vertical-align: middle; }

.ws-root .misc-wrap { position: absolute; top: 75mm; left: 0; right: 0; height: 44mm; border: 1.5px solid #cc0000; border-radius: 5px; overflow: hidden; }
.ws-root .misc-head { background: #fff0f0; color: #cc0000; font-weight: bold; font-size: ${fs(11)}; text-align: center; height: 9mm; line-height: 9mm; }
.ws-root .misc-body { padding: 6px 10px 8px; }
.ws-root .misc-inst { font-size: ${fs(9)}; margin-bottom: 8px; }
.ws-root .misc-row  { display: table; width: 100%; border: 1px solid #cc0000; border-radius: 3px; table-layout: fixed; }
.ws-root .mi { display: table-cell; width: 20%; padding: 8px 6px; border-right: 1px solid #cc0000; font-size: ${fs(9)}; text-align: center; vertical-align: top; }
.ws-root .mi:last-child { border-right: none; }
.ws-root .mip { margin-bottom: 8px; font-weight: bold; }
.ws-root .cb  { display: inline-block; width: 14px; height: 14px; border: 1px solid #555; vertical-align: middle; margin-left: 4px; }
.ws-root .mia { font-size: ${fs(8.5)}; color: #111; margin-bottom: 6px; }
.ws-root .mir { font-size: ${fs(8.5)}; color: #111; }

.ws-root .chal-wrap { position: absolute; top: 121mm; left: 0; right: 0; bottom: 37mm; border: 1.5px solid #b8860b; border-radius: 5px; background: #fffdf5; overflow: hidden; }
.ws-root .chal-head { color: #b8860b; font-weight: bold; font-size: ${fs(11)}; text-align: center; height: 8mm; line-height: 8mm; border-bottom: 1px solid #b8860b; }
.ws-root .chal-body { position: absolute; top: 8mm; left: 0; right: 0; bottom: 0; display: table; width: 100%; table-layout: fixed; }
.ws-root .cc { display: table-cell; width: 50%; padding: 8px 12px; font-size: ${fs(9)}; line-height: ${lh(1.6)}; vertical-align: top; }
.ws-root .cc-1 { border-right: 1px solid #b8860b; }
.ws-root .ccf { margin-top: 10px; font-weight: bold; }
.ws-root .ccf div { margin-top: 8px; }
.ws-root .ul_ { display: inline-block; border-bottom: 1px solid #555; width: 160px; margin-left: 5px; }

.ws-root .foot-row { position: absolute; bottom: 0; left: 0; right: 0; height: 36mm; display: table; width: 100%; border-spacing: 5px 0; table-layout: fixed; }
.ws-root .fb { display: table-cell; vertical-align: middle; border-radius: 5px; padding: 7px 10px; }
.ws-root .fb-tips  { width: 40%; border: 1.5px solid #1f5fa6; background: #f4f8ff; }
.ws-root .fb-check { width: 40%; border: 1.5px solid #1e7d2e; background: #f5fdf5; }
.ws-root .fb-badge { width: 20%; border: 1.5px solid #1e7d2e; background: #f5fdf5; text-align: center; vertical-align: middle; }
.ws-root .fbi { display: table; }
.ws-root .fbic { display: table-cell; vertical-align: middle; padding-right: 10px; font-size: ${fs(20)}; white-space: nowrap; color: #1f5fa6; }
.ws-root .fbic2 { display: table-cell; vertical-align: middle; padding-right: 10px; font-size: ${fs(20)}; white-space: nowrap; color: #1e7d2e; }
.ws-root .fbtc { display: table-cell; vertical-align: middle; font-size: ${fs(9)}; }
.ws-root .ftt  { font-weight: bold; font-size: ${fs(10)}; color: #1f5fa6; margin-bottom: 4px; }
.ws-root .ftg  { font-weight: bold; font-size: ${fs(10)}; color: #1e7d2e; margin-bottom: 4px; }
.ws-root .ci   { line-height: ${lh(1.8)}; font-weight: bold; }
.ws-root .badge { display: inline-block; background: #4caf50; color: white; font-weight: bold; font-size: ${fs(12)}; border-radius: 50%; width: 65px; height: 65px; text-align: center; padding-top: 14px; line-height: 1.25; border: 3px dashed white; outline: 3px solid #4caf50; }
/* ── SEND overlay: strip box fills, keep coloured borders ── */
.ws-root[data-send] .lo { background: transparent; }
.ws-root[data-send] .ic-blue   { background: transparent; }
.ws-root[data-send] .ic-green  { background: transparent; }
.ws-root[data-send] .ic-yellow { background: transparent; }
.ws-root[data-send] .eg-t { background: transparent; }
.ws-root[data-send] .mod-wrap { background: transparent; }
.ws-root[data-send] .mod-head { background: transparent; }
.ws-root[data-send] .ex-c-1, .ws-root[data-send] .ex-c-2 { background: transparent; }
.ws-root[data-send] .ex-c-3 { background: transparent; }
.ws-root[data-send] .ex-c-4 { background: transparent; }
.ws-root[data-send] .t-1, .ws-root[data-send] .t-2 { background: transparent; }
.ws-root[data-send] .t-3 { background: transparent; }
.ws-root[data-send] .t-4 { background: transparent; }
.ws-root[data-send] .ex-a { background: transparent; }
.ws-root[data-send] .misc-head { background: transparent; }
.ws-root[data-send] .chal-wrap { background: transparent; }
.ws-root[data-send] .fb-tips  { background: transparent; }
.ws-root[data-send] .fb-check { background: transparent; }
.ws-root[data-send] .fb-badge { background: transparent; }
`;

// ─── Theme → CSS variables ───────────────────────────────────────────────────

/** Build the inline `style` value (CSS custom properties) for a theme. */
export function themeToStyleVars(theme?: GoldTheme): string {
  if (!theme) return "";
  const v: string[] = [];
  if (theme.fontFamily) v.push(`--ws-font:${theme.fontFamily}`);
  if (theme.titleFamily) v.push(`--ws-title-font:${theme.titleFamily}`);
  if (theme.fontScale != null) v.push(`--ws-fs:${theme.fontScale}`);
  if (theme.lineScale != null) v.push(`--ws-lh:${theme.lineScale}`);
  if (theme.letterSpacing) v.push(`--ws-letter:${theme.letterSpacing}`);
  if (theme.wordSpacing) v.push(`--ws-word:${theme.wordSpacing}`);
  if (theme.pageBg) v.push(`--ws-page-bg:${theme.pageBg}`);
  if (theme.textColor) v.push(`--ws-text:${theme.textColor}`);
  return v.join(";");
}

// ─── Body markup (port of the HTML assembly) ─────────────────────────────────

function renderInfoBoxes(d: GoldWorksheet): string {
  const kt = d.info_boxes.key_terms;
  const wwl = d.info_boxes.what_we_learn;
  const ki = d.info_boxes.key_idea;

  const ktP0 = kt.content?.[0]?.text ? `<p class="pgap">${pp(kt.content[0].text)}</p>` : "";
  const ktP1 = kt.content?.[1]?.text ? `<p>${pp(kt.content[1].text)}</p>` : "";

  const rows = (wwl.examples || [])
    .map((eg) => {
      const icon = eg.correct
        ? '<span class="ok">&#10003;</span>'
        : '<span class="no">&#10007;</span>';
      return `                <tr><td>${icon}</td><td>${pp(eg.expr)}</td><td>${pp(eg.desc)}</td></tr>`;
    })
    .join("\n");

  return `    <div class="three-cols">
        <div class="ic ic-blue">
            <div class="ct-blue">${pp(kt.title)}</div>
            ${ktP0}
            ${ktP1}
        </div>
        <div class="ic ic-green">
            <div class="ct-green">${pp(wwl.title)}</div>
            <table class="eg-t">
${rows}
            </table>
        </div>
        <div class="ic ic-yellow">
            <div class="ct-yellow">${pp(ki.title)}</div>
            <div class="kt">${pp(ki.text)}</div>
            <div class="eqr">${pp(ki.equation)}</div>
            <div class="eqc">${pp(ki.caption)}</div>
        </div>
    </div>`;
}

function renderModelledExamples(d: GoldWorksheet): string {
  let cells = "";
  for (let i = 0; i < 4; i++) {
    const ex = d.modelled_examples?.[i] ?? {};
    const label = ex.label ?? `Example ${i + 1}`;
    const question = ex.question ?? "";
    const steps = [...(ex.steps ?? [])];
    while (steps.length < 3) steps.push("");
    const answer = ex.answer ?? "";
    const explanation = ex.explanation ?? "";
    cells += `                <td class="ex-c ex-c-${i + 1}">
                    <span class="ex-t t-${i + 1}">${pp(label)}</span>
                    <div class="ex-body">
                        <div class="ex-q">${pp(question)}</div>
                        <div class="ex-s">${pp(steps[0])}<br>${pp(steps[1])}<br>${pp(steps[2])}</div>
                        <div class="ex-a a-${i + 1}">${pp(answer)}</div>
                        <div class="ex-n">${pp(explanation)}</div>
                    </div>
                </td>
`;
  }
  return `    <div class="mod-wrap">
        <div class="mod-head">
            <div class="mht">MODELLED EXAMPLES</div>
            <div class="mhs">Study each example carefully before attempting the practice questions.</div>
        </div>
        <div class="mod-body">
            <table class="mod-tbl"><tbody><tr>
${cells}            </tr></tbody></table>
        </div>
    </div>`;
}

function renderPractice(d: GoldWorksheet): string {
  const sections = d.practice || [];
  let cols = "";
  for (let i = 0; i < 4; i++) {
    const p = sections[i];
    if (!p) continue;
    const qs = (p.questions || [])
      .map((q) => `                <div class="pi">${q.id}) ${pp(q.expression)}</div>`)
      .join("\n");
    cols += `            <div class="pc pc-${i + 1}">
                <div class="pct t-p${i + 1}">${p.number}. ${pp(p.heading)}</div>
                <div class="pci">${pp(p.instruction)}</div>
${qs}
            </div>
`;
  }
  const p5 = sections[4];
  const mixedQs = p5
    ? (p5.questions || [])
        .map((q) => `                <div class="pmd">${q.id}) ${pp(q.expression)}</div>`)
        .join("\n")
    : "";
  const mixed = p5
    ? `        <div class="prac-mixed">
            <div class="pct t-p5">${p5.number}. ${pp(p5.heading)}</div>
            <div class="pci">${pp(p5.instruction)}</div>
            <div class="pmr">
${mixedQs}
            </div>
        </div>`
    : "";

  return `    <div class="prac-wrap">
        <div class="prac-head">YOUR TURN &ndash; PRACTICE (deliberate practice)</div>
        <div class="prac-cols">
${cols}        </div>
${mixed}
    </div>`;
}

function renderMisconceptions(d: GoldWorksheet): string {
  const items = (d.misconceptions?.items || [])
    .map(
      (m) => `                <div class="mi">
                    <div class="mip">${m.id}) ${pp(m.statement)} <span class="cb"></span></div>
                    <div class="mia">Correct answer: ___________</div>
                    <div class="mir">Reason: ___________________</div>
                </div>`
    )
    .join("\n");
  return `    <div class="misc-wrap">
        <div class="misc-head">COMMON MISCONCEPTIONS &ndash; SPOT THE MISTAKE</div>
        <div class="misc-body">
            <div class="misc-inst">
                <strong>Each statement shows a student&rsquo;s answer. Tick (&radic;) the ones that are correct.</strong> If it is wrong, write the correct answer.
            </div>
            <div class="misc-row">
${items}
            </div>
        </div>
    </div>`;
}

function renderChallenge(d: GoldWorksheet): string {
  const problems = (d.challenge?.problems || [])
    .map((p, idx) => {
      const cls = idx === 0 ? "cc cc-1" : "cc cc-2";
      return `            <div class="${cls}">
                <div>${p.id}) ${pp(p.text)}</div>
                <div class="ccf">
                    <div>Expression: <span class="ul_"></span></div>
                    <div>Simplified:&nbsp;&nbsp;<span class="ul_"></span></div>
                </div>
            </div>`;
    })
    .join("\n");
  return `    <div class="chal-wrap">
        <div class="chal-head">6. CHALLENGE &ndash; WORD PROBLEMS (apply your skills)</div>
        <div class="chal-body">
${problems}
        </div>
    </div>`;
}

const FOOTER_HTML = `    <div class="foot-row">
        <div class="fb fb-tips">
            <div class="fbi">
                <div class="fbic">&#9733;</div>
                <div class="fbtc">
                    <div class="ftt">TOP TIPS</div>
                    <div>Read the question carefully. Show all your working step by step. Check your answer makes sense.</div>
                </div>
            </div>
        </div>
        <div class="fb fb-check">
            <div class="fbi">
                <div class="fbic2">&#129504;</div>
                <div class="fbtc">
                    <div class="ftg">CHECK YOUR WORK</div>
                    <div class="ci">&#10003; Have I shown all my working clearly?</div>
                    <div class="ci">&#10003; Did I check my answer using a different method?</div>
                    <div class="ci">&#10003; Does my answer look reasonable?</div>
                </div>
            </div>
        </div>
        <div class="fb fb-badge">
            <div class="badge">WELL<br>DONE!</div>
        </div>
    </div>`;

/** Render just the two `.page` divs (no <html>/<style> wrapper). */
export function renderGoldWorksheetBody(data: GoldWorksheet): string {
  const titleLines = (data.title || "").split("\n");
  const titleL1 = pp(titleLines[0] ?? "");
  const titleL2 = pp(titleLines[1] ?? "");

  return `<div class="page">
    <div class="p1-header">
        <div class="p1-hl">Name: ___________________________</div>
        <div class="p1-hc">
            <div class="t1">${titleL1}</div>
            <div class="t2">${titleL2}</div>
        </div>
        <div class="p1-hr">Date: _____________________</div>
    </div>
    <div class="lo">${pp(data.objective)}</div>
${renderInfoBoxes(data)}
${renderModelledExamples(data)}
</div>

<div class="page">
${renderPractice(data)}
${renderMisconceptions(data)}
${renderChallenge(data)}
${FOOTER_HTML}
</div>`;
}

/**
 * Render a complete, self-contained HTML document for the worksheet.
 * Suitable for an <iframe srcdoc> (on-screen) or a print/PDF popup.
 *
 * @param data   the gold worksheet content
 * @param theme  optional SEND cosmetic overlay (see mathsGoldSend.ts)
 */
export function renderGoldWorksheetHtml(
  data: GoldWorksheet,
  theme?: GoldTheme
): string {
  const styleVars = themeToStyleVars(theme);
  const rootStyle = styleVars ? ` style="${styleVars}"` : "";
  const sendAttr = theme ? ` data-send="1"` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Worksheet</title>
<style>
@page { size: A4 landscape; margin: 5mm 6mm; }
html, body { margin: 0; padding: 0; }
${GOLD_CSS}
</style>
</head>
<body>
<div class="ws-root"${rootStyle}${sendAttr}>
${renderGoldWorksheetBody(data)}
</div>
</body>
</html>`;
}
