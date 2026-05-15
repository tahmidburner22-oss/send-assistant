/**
 * differentiate-enhancements.ts — Improvements layered onto Differentiate.
 *
 *  1. OCR / handwriting cleanup (browser-side Tesseract loader)
 *  2. Adaptation diff view (paragraph-level rule-tagging diff)
 *  3. Multiple-need stacking (compose two SEND profiles in the right order)
 *  4. Source-respecting mode (preserve numbering / branding)
 *  5. Reading-age dial (live Flesch-Kincaid + word-too-long highlighter)
 */

// ── 1. OCR / handwriting cleanup ────────────────────────────────────────────

/**
 * Lazy-load Tesseract.js from a CDN ESM module. We don't bundle it because
 * the worksheet generator only needs it when the teacher uploads a phone
 * snap. Returns a function that accepts an image and resolves to text.
 */
export async function loadTesseractOCR(): Promise<(blob: Blob | string) => Promise<string>> {
  // @ts-ignore — dynamic import from CDN ESM
  const mod: any = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/tesseract.js@5/+esm");
  const Tesseract = mod.default || mod;
  const worker = await Tesseract.createWorker("eng");
  return async (blob) => {
    const { data: { text } } = await worker.recognize(blob);
    return cleanupOcrText(text);
  };
}

/** Squeeze multiple newlines, fix common confusions (l→1, I→1 inside numbers). */
export function cleanupOcrText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(\d)[lI](\d)/g, "$11$2")  // 2l3 → 213
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/—/g, "-")
    .trim();
}

// ── 2. Adaptation diff view ─────────────────────────────────────────────────

export type AdaptationKind =
  | "vocab-swap" | "sentence-shorter" | "scaffold-added" | "image-cue"
  | "scaffold-stem" | "removed" | "added" | "unchanged";

export interface AdaptationParagraph {
  before?: string;
  after?: string;
  kind: AdaptationKind;
  /** Plain-language explanation of *why* this change was made. */
  rationale?: string;
}

const SHORTENED_THRESHOLD = 0.75;
const VOCAB_SCAFFOLD_HINTS = /\b(in other words|that is|i\.e\.|means)\b/i;
const STEM_HINTS = /\b(?:start by|first[,]?|because|so that|then[,]?|next[,]?)\b/i;
const IMAGE_HINTS = /\[(image|picture|diagram)\]/i;

export function diffAdaptation(before: string, after: string): AdaptationParagraph[] {
  const beforeParas = splitIntoParas(before);
  const afterParas  = splitIntoParas(after);
  // Cheap alignment: pair up indexes 1:1 by best similarity.
  const used = new Set<number>();
  const out: AdaptationParagraph[] = [];
  for (let i = 0; i < afterParas.length; i++) {
    const a = afterParas[i];
    let bestJ = -1;
    let bestScore = 0;
    for (let j = 0; j < beforeParas.length; j++) {
      if (used.has(j)) continue;
      const s = similarity(a, beforeParas[j]);
      if (s > bestScore) { bestScore = s; bestJ = j; }
    }
    if (bestJ >= 0 && bestScore > 0.3) {
      used.add(bestJ);
      const b = beforeParas[bestJ];
      out.push(classifyChange(b, a));
    } else {
      out.push({ after: a, kind: "added", rationale: "New content not present in the original." });
    }
  }
  for (let j = 0; j < beforeParas.length; j++) {
    if (!used.has(j)) {
      out.push({ before: beforeParas[j], kind: "removed", rationale: "Content not retained in the adaptation." });
    }
  }
  return out;
}

function classifyChange(before: string, after: string): AdaptationParagraph {
  if (before === after) {
    return { before, after, kind: "unchanged" };
  }
  if (after.length < before.length * SHORTENED_THRESHOLD) {
    return { before, after, kind: "sentence-shorter", rationale: "Shorter sentence — reduces working-memory load." };
  }
  if (VOCAB_SCAFFOLD_HINTS.test(after) && !VOCAB_SCAFFOLD_HINTS.test(before)) {
    return { before, after, kind: "vocab-swap", rationale: "Subject-specific vocabulary explained inline." };
  }
  if (STEM_HINTS.test(after) && !STEM_HINTS.test(before)) {
    return { before, after, kind: "scaffold-stem", rationale: "Sentence stem added to scaffold the response." };
  }
  if (IMAGE_HINTS.test(after) && !IMAGE_HINTS.test(before)) {
    return { before, after, kind: "image-cue", rationale: "Visual cue added for non-text learners." };
  }
  return { before, after, kind: "scaffold-added", rationale: "Additional structure or hint added." };
}

function splitIntoParas(s: string): string[] {
  return s.split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/).map(p => p.trim()).filter(Boolean);
}

function similarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const wb = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  if (wa.size === 0 || wb.size === 0) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / Math.max(wa.size, wb.size);
}

// ── 3. Multiple-need stacking ───────────────────────────────────────────────

/**
 * SEND adaptation rule-set order matters. Vision/dyslexia adaptations
 * (font, spacing, decoding scaffolds) come BEFORE language adaptations
 * (EAL vocab simplification) so the dyslexia-friendly text isn't then
 * re-translated into a font that breaks decoding cues.
 */
export const ADAPTATION_PRIORITY: Record<string, number> = {
  "Vision Impairment":    10,
  "Dyslexia":             20,
  "ADHD":                 30,
  "ASC":                  40,
  "PDA":                  45,
  "EAL":                  50,
  "Hearing Impairment":   60,
  "Cognitive (MLD/SLD)":  70,
  "Speech & Language":    80,
};

export function stackAdaptations(needs: string[]): string[] {
  return [...needs]
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .sort((a, b) => (ADAPTATION_PRIORITY[a] || 100) - (ADAPTATION_PRIORITY[b] || 100));
}

export function stackedSystemSuffix(needs: string[]): string {
  const ordered = stackAdaptations(needs);
  if (ordered.length <= 1) return "";
  return [
    "Apply the adaptations in this exact order, layering each on top of the previous:",
    ...ordered.map((n, i) => `  ${i + 1}. ${n}`),
    "Do NOT undo earlier adaptations when applying later ones.",
  ].join("\n");
}

// ── 4. Source-respecting mode ───────────────────────────────────────────────

export const SOURCE_RESPECTING_SUFFIX = `
Preserve the original document EXACTLY as authored:
  - Keep question numbering identical (1., 2., a), b), …)
  - Keep section headings, branding, school logos and any source attributions.
  - DO NOT renumber, reorder, or rephrase headings.
  - Apply adaptations only inside the question body and within marked sentence stems.`;

// ── 5. Reading-age dial ─────────────────────────────────────────────────────

const VOWEL_GROUP_RX = /[aeiouy]+/g;

function syllableCount(word: string): number {
  if (!word) return 0;
  word = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(VOWEL_GROUP_RX);
  return matches ? matches.length : 1;
}

function wordList(text: string): string[] {
  return text.replace(/[^a-zA-Z\s'-]/g, " ").split(/\s+/).filter(Boolean);
}

function sentenceCount(text: string): number {
  return Math.max(1, (text.match(/[.!?]+/g) || []).length);
}

/** Approximate Flesch–Kincaid grade level → UK reading age in years. */
export function fleschKincaidAge(text: string): number {
  const words = wordList(text);
  if (words.length === 0) return 0;
  const sents = sentenceCount(text);
  const syllables = words.reduce((a, w) => a + syllableCount(w), 0);
  const grade = 0.39 * (words.length / sents) + 11.8 * (syllables / words.length) - 15.59;
  return Math.max(5, Math.round((grade + 5) * 10) / 10);   // grade ≈ age - 5
}

/** Words exceeding the target reading age — heuristic: 3+ syllables and 7+ chars. */
export function flagDifficultWords(text: string, targetAge: number): string[] {
  const max = Math.max(2, Math.floor((targetAge - 5) / 2));   // older readers tolerate longer words
  const out = new Set<string>();
  for (const w of wordList(text)) {
    if (w.length >= 7 && syllableCount(w) > max) out.add(w);
  }
  return Array.from(out);
}
