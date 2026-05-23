/**
 * mflRevisionShell.ts — PR-25 / audit item #33.
 *
 * Modern-Foreign-Language (MFL) revision shell. Pure / deterministic.
 *
 * GCSE / A-Level MFL papers (French / Spanish / German / Welsh /
 * Mandarin) tend to share a fixed structural skeleton:
 *
 *   1. Translation L1 → L2 (5–10 short sentences)
 *   2. Translation L2 → L1 (1 short passage)
 *   3. Reading comprehension on a short authentic source text
 *   4. Targeted vocabulary section (Tier-3 verbs / nouns)
 *   5. Grammar drill (one tense / agreement / pronoun area)
 *
 * The default worksheet generator produces topic-isolated questions
 * that don't follow this skeleton, so MFL teachers were rebuilding
 * the structure manually. This shell builds the deterministic
 * scaffolding so the LLM only has to fill in the bilingual content.
 */

export type MflLanguage = "french" | "spanish" | "german" | "welsh" | "mandarin" | "italian";

export interface MflShellInputs {
  /** L2 — the target language being revised. */
  language: MflLanguage;
  /** Topic theme (e.g. "le voyage", "mein Hobby", "el medio ambiente"). */
  topic: string;
  /** Year band ("Year 9" .. "Year 13"). Drives sentence-count + tense ladder. */
  yearGroup?: string;
  /** Tier-3 vocabulary the LLM should weave into every section. Lower-case. */
  vocabulary?: string[];
}

export interface MflShellSection {
  type: "translation-l1-to-l2" | "translation-l2-to-l1" | "reading-comprehension" | "vocabulary" | "grammar-drill";
  title: string;
  /** Stem text the LLM uses verbatim. */
  prompt: string;
  /** Suggested sentence / item count. */
  itemCount: number;
}

export interface MflShellOutput {
  language: MflLanguage;
  topic: string;
  sections: MflShellSection[];
  generatedAt: string;
}

const SUBJECT_LABELS: Record<MflLanguage, string> = {
  french: "French",
  spanish: "Spanish",
  german: "German",
  welsh: "Welsh",
  mandarin: "Mandarin",
  italian: "Italian",
};

function tenseLadderForYear(yearGroup: string | undefined): string[] {
  const text = String(yearGroup || "");
  if (/Y(?:ear)?\s*1[2-3]|KS5|A[\s-]?Level/i.test(text)) {
    return ["present", "perfect", "imperfect", "subjunctive"];
  }
  if (/Y(?:ear)?\s*1[01]/i.test(text)) {
    return ["present", "perfect", "imperfect", "future", "conditional"];
  }
  return ["present", "perfect", "future"];
}

function itemCountForYear(yearGroup: string | undefined): { translation: number; comprehension: number; vocab: number } {
  const text = String(yearGroup || "");
  if (/Y(?:ear)?\s*1[2-3]|KS5|A[\s-]?Level/i.test(text)) return { translation: 10, comprehension: 8, vocab: 20 };
  if (/Y(?:ear)?\s*1[01]/i.test(text)) return { translation: 8, comprehension: 6, vocab: 15 };
  return { translation: 5, comprehension: 4, vocab: 10 };
}

/**
 * Build a deterministic MFL revision shell. Pure: identical inputs
 * always produce identical output (modulo the `nowIso` parameter).
 */
export function buildMflRevisionShell(
  inputs: MflShellInputs,
  options: { nowIso?: string } = {},
): MflShellOutput {
  const lang = inputs.language;
  const langLabel = SUBJECT_LABELS[lang] || String(lang);
  const topic = String(inputs.topic || "").trim() || "the topic";
  const counts = itemCountForYear(inputs.yearGroup);
  const tenses = tenseLadderForYear(inputs.yearGroup);
  const vocab = (inputs.vocabulary || []).slice(0, counts.vocab);

  const sections: MflShellSection[] = [
    {
      type: "translation-l1-to-l2",
      title: `Translation: English → ${langLabel}`,
      prompt: `Translate the following ${counts.translation} short sentences into ${langLabel}. Each sentence must use vocabulary connected to "${topic}" and must use one of: ${tenses.join(", ")}.`,
      itemCount: counts.translation,
    },
    {
      type: "translation-l2-to-l1",
      title: `Translation: ${langLabel} → English`,
      prompt: `Translate the following ${langLabel} passage on "${topic}" (around 80 words for KS4, 120 words for KS5) into accurate, natural English.`,
      itemCount: 1,
    },
    {
      type: "reading-comprehension",
      title: "Reading comprehension",
      prompt: `Read the authentic ${langLabel}-language source text on "${topic}", then answer ${counts.comprehension} short questions in English. Include at least 1 inference question.`,
      itemCount: counts.comprehension,
    },
    {
      type: "vocabulary",
      title: "Targeted vocabulary",
      prompt: vocab.length > 0
        ? `Memorise the following Tier-3 vocabulary list (${vocab.length} items): ${vocab.slice(0, 8).join(", ")}${vocab.length > 8 ? ", …" : ""}.`
        : `Memorise the ${counts.vocab}-word Tier-3 vocabulary list for "${topic}". Quiz yourself on both directions.`,
      itemCount: counts.vocab,
    },
    {
      type: "grammar-drill",
      title: "Grammar drill",
      prompt: `Drill the following ${langLabel} grammar areas: ${tenses.join(", ")}. Conjugate 6 verbs in each tense.`,
      itemCount: tenses.length,
    },
  ];

  return {
    language: lang,
    topic,
    sections,
    generatedAt: options.nowIso ?? "1970-01-01T00:00:00.000Z",
  };
}
