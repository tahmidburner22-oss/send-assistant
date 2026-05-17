/**
 * comprehension-enhancements.ts
 *
 * Five improvements layered onto the Comprehension Generator:
 *   1. Reading-age estimator (Flesch–Kincaid grade) per differentiation level.
 *   2. Cloze-version builder for the Core passage (every Nth content word
 *      replaced with a numbered blank, with an answer key).
 *   3. Vocabulary pre-teach strip — auto-extracted Tier-2/3 words with
 *      definitions inferred from immediate context.
 *   4. Source loader — accepts a URL or pasted text, normalises to plain prose
 *      ready for the prompt.
 *   5. Bloom's taxonomy tagging — labels each generated question by Bloom
 *      level using a verb dictionary.
 */

// ─── 1. Reading-age (Flesch-Kincaid grade) ──────────────────────────────────

function countSyllables(word: string): number {
  if (!word) return 0;
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const cleaned = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export interface ReadabilityStats {
  words: number;
  sentences: number;
  syllables: number;
  fleschKincaidGrade: number;     // US grade level
  approxUkReadingAge: number;     // grade + 5 years
  band: "Foundation" | "KS1" | "KS2" | "KS3" | "KS4" | "Adult";
}

export function computeReadability(text: string): ReadabilityStats {
  const cleaned = text.replace(/[#*_>`~|]/g, " ").trim();
  const sentences = Math.max(1, (cleaned.match(/[.!?]+/g) || []).length);
  const words = cleaned.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  // Flesch-Kincaid Grade Level: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  const grade =
    0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59;
  const ageGrade = Math.max(0, grade);
  const ukAge = Math.round(ageGrade + 5);

  const band: ReadabilityStats["band"] =
    ukAge <= 5 ? "Foundation" :
    ukAge <= 7 ? "KS1" :
    ukAge <= 11 ? "KS2" :
    ukAge <= 14 ? "KS3" :
    ukAge <= 16 ? "KS4" :
    "Adult";

  return {
    words: wordCount,
    sentences,
    syllables,
    fleschKincaidGrade: Math.round(ageGrade * 10) / 10,
    approxUkReadingAge: ukAge,
    band,
  };
}

// ─── 2. Cloze builder ───────────────────────────────────────────────────────

const FUNCTION_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for",
  "with", "by", "is", "are", "was", "were", "be", "been", "being", "have",
  "has", "had", "do", "does", "did", "as", "if", "than", "then", "this",
  "that", "these", "those", "it", "its", "from", "into", "about", "over",
  "out", "up", "down", "so", "not", "no", "i", "you", "he", "she", "we", "they",
]);

export interface ClozeResult {
  passage: string;     // the cloze-ified passage with __1__, __2__ blanks
  answers: string[];   // index → original word
}

/**
 * Replace every Nth content word with a numbered blank. Function words and
 * tokens shorter than 4 characters are skipped to keep the activity meaningful.
 */
export function buildCloze(passage: string, every = 7): ClozeResult {
  const tokens = passage.split(/(\s+)/);
  const answers: string[] = [];
  let contentIdx = 0;
  const out: string[] = [];

  for (const tok of tokens) {
    if (/^\s+$/.test(tok) || tok.length === 0) {
      out.push(tok);
      continue;
    }
    const stripped = tok.replace(/[^A-Za-z']/g, "");
    if (
      stripped.length >= 4 &&
      !FUNCTION_WORDS.has(stripped.toLowerCase())
    ) {
      contentIdx += 1;
      if (contentIdx % every === 0) {
        answers.push(stripped);
        const trailing = tok.match(/[^A-Za-z']+$/)?.[0] || "";
        out.push(`__${answers.length}__${trailing}`);
        continue;
      }
    }
    out.push(tok);
  }

  return { passage: out.join(""), answers };
}

// ─── 3. Vocab pre-teach strip ───────────────────────────────────────────────

const TIER_2_3_HINT = /^[A-Za-z]{6,}$/; // long-ish words tend to be Tier 2/3

const COMMON_NON_VOCAB = new Set([
  "however", "therefore", "because", "although", "throughout", "another",
  "between", "around", "before", "during", "without", "really", "actually",
  "something", "anything", "everyone", "nothing",
]);

export interface VocabEntry {
  word: string;
  contextSentence: string;
}

/**
 * Pull up to N Tier 2/3 candidate words from a passage, each with the
 * sentence it first appears in. Definitions are deliberately NOT generated
 * here — they should be filled in by the AI prompt or by the teacher,
 * because heuristic definitions are usually wrong.
 */
export function extractVocab(passage: string, max = 8): VocabEntry[] {
  const sentences = passage.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>();
  const out: VocabEntry[] = [];

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    for (const w of words) {
      const stripped = w.replace(/[^A-Za-z'-]/g, "");
      const lower = stripped.toLowerCase();
      if (
        TIER_2_3_HINT.test(stripped) &&
        !COMMON_NON_VOCAB.has(lower) &&
        !seen.has(lower)
      ) {
        seen.add(lower);
        out.push({ word: stripped, contextSentence: sentence.trim() });
        if (out.length >= max) return out;
      }
    }
  }
  return out;
}

export function vocabStripAsHtml(entries: VocabEntry[]): string {
  if (entries.length === 0) {
    return `<div style="font-family:Arial,sans-serif;font-size:11px;color:#6b7280;font-style:italic;">No Tier 2/3 candidates detected.</div>`;
  }
  return `<div style="font-family:Arial,sans-serif;border:2px solid #6366f1;border-radius:8px;padding:10px;background:#eef2ff;">
    <div style="font-weight:800;font-size:12px;color:#3730a3;margin-bottom:6px;">Pre-teach vocabulary</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">
      ${entries.map((e) => `
        <div style="background:#fff;border:1px solid #c7d2fe;border-radius:6px;padding:6px 8px;">
          <div style="font-weight:700;font-size:11px;color:#3730a3;">${escapeHtml(e.word)}</div>
          <div style="font-size:10px;color:#475569;font-style:italic;margin-top:2px;">"${escapeHtml(e.contextSentence)}"</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:3px;">My definition: _________________</div>
        </div>
      `).join("")}
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// ─── 4. Source loader ──────────────────────────────────────────────────────

const URL_REGEX = /^https?:\/\//i;

/**
 * Normalise a teacher-provided source. If it looks like a URL we just return
 * the URL itself flagged so the calling page can offer a "Fetch" action;
 * otherwise we return a cleaned plain-text version of the input.
 */
export function normaliseSource(input: string): { kind: "url" | "text"; value: string } {
  const trimmed = input.trim();
  if (URL_REGEX.test(trimmed)) return { kind: "url", value: trimmed };
  // Strip excessive whitespace / common site UI noise.
  const cleaned = trimmed
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(Cookies|Subscribe|Share|Advertisement)[^\n]*\n/gi, "")
    .trim();
  return { kind: "text", value: cleaned };
}

/**
 * Fetch a URL through a simple read-only proxy. Falls back to a text-mode
 * response that the caller can show as "couldn't fetch — paste manually".
 */
export async function fetchSourceText(url: string, signal?: AbortSignal): Promise<string> {
  // Use the public reader proxy to avoid CORS. This is intentionally a
  // best-effort utility; for production a server-side proxy would be added.
  const proxied = `https://r.jina.ai/${url}`;
  const res = await fetch(proxied, { signal });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const txt = await res.text();
  // The reader returns a markdown-ish payload prefixed with metadata; strip
  // the "Title: ... \n\n" header before returning.
  return txt.replace(/^Title:[^\n]*\n\n?/, "").slice(0, 8000);
}

// ─── 5. Bloom's taxonomy tagging ────────────────────────────────────────────

export type BloomLevel =
  | "Knowledge"
  | "Comprehension"
  | "Application"
  | "Analysis"
  | "Evaluation"
  | "Creation";

const BLOOM_VERBS: Record<BloomLevel, string[]> = {
  Knowledge: ["list", "name", "identify", "define", "state", "recall", "label", "find", "what", "when", "where", "who"],
  Comprehension: ["explain", "describe", "summarise", "summarize", "paraphrase", "interpret", "give an example", "in your own words"],
  Application: ["use", "apply", "solve", "demonstrate", "illustrate", "show", "make", "construct"],
  Analysis: ["analyse", "analyze", "compare", "contrast", "differentiate", "examine", "infer", "why", "how does", "what is the relationship"],
  Evaluation: ["evaluate", "judge", "justify", "argue", "defend", "critique", "do you agree", "which is better", "is it"],
  Creation: ["create", "design", "compose", "write your own", "imagine", "invent", "predict", "propose"],
};

const BLOOM_COLOURS: Record<BloomLevel, string> = {
  Knowledge: "#94a3b8",
  Comprehension: "#60a5fa",
  Application: "#34d399",
  Analysis: "#f59e0b",
  Evaluation: "#f87171",
  Creation: "#a78bfa",
};

export function tagBloom(question: string): BloomLevel {
  const lower = question.toLowerCase();
  // Higher-order verbs win when multiple match.
  const order: BloomLevel[] = ["Creation", "Evaluation", "Analysis", "Application", "Comprehension", "Knowledge"];
  for (const level of order) {
    for (const verb of BLOOM_VERBS[level]) {
      if (lower.includes(verb)) return level;
    }
  }
  return "Knowledge";
}

export function bloomBadgeHtml(level: BloomLevel): string {
  return `<span style="display:inline-block;background:${BLOOM_COLOURS[level]}33;color:${BLOOM_COLOURS[level]};border:1px solid ${BLOOM_COLOURS[level]};border-radius:10px;padding:1px 8px;font-size:10px;font-weight:700;margin-right:4px;">${level}</span>`;
}

/**
 * Walk a generated comprehension and return per-question Bloom labels.
 * Heuristics: bullet/numbered lines that end with "?".
 */
export interface TaggedQuestion {
  raw: string;
  bloom: BloomLevel;
  index: number;
}

export function tagAllQuestions(text: string): TaggedQuestion[] {
  const out: TaggedQuestion[] = [];
  let idx = 0;
  for (const rawLine of text.split(/\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const looksLikeQuestion =
      /\?\s*(?:\(|$)/.test(line) || /\(\s*\d+\s*marks?\s*\)/i.test(line);
    if (!looksLikeQuestion) continue;
    out.push({ raw: line, bloom: tagBloom(line), index: idx });
    idx += 1;
  }
  return out;
}

export function bloomDistribution(tagged: TaggedQuestion[]): Record<BloomLevel, number> {
  const dist: Record<BloomLevel, number> = {
    Knowledge: 0, Comprehension: 0, Application: 0, Analysis: 0, Evaluation: 0, Creation: 0,
  };
  for (const t of tagged) dist[t.bloom] += 1;
  return dist;
}
