/**
 * pastPaperFingerprint.ts -- PR-15
 *
 * Detects when AI-generated questions closely match known past-paper phrasings.
 * Uses n-gram fingerprinting with a built-in corpus of common UK exam board
 * question stems and characteristic phrasings.
 *
 * This does NOT access external databases -- it matches against a curated
 * built-in list of distinctive past-paper patterns that should not appear
 * verbatim in new worksheets (copyright risk + pedagogical originality concern).
 *
 * Pure / deterministic / idempotent. No I/O, no LLM calls.
 */

export interface FingerprintMatch {
  sectionIndex: number;
  sectionTitle?: string;
  matchedPattern: string;
  similarity: number; // 0-1, where 1 = exact verbatim match
  source?: string; // e.g. "AQA Physics 2023 P1" (when known)
}

export interface FingerprintResult {
  matches: FingerprintMatch[];
  warnings: string[];
  highRiskCount: number; // matches with similarity > 0.8
}

/**
 * Known past-paper distinctive phrases that should not appear verbatim.
 * These are the "fingerprint" patterns -- highly specific phrasings that
 * identify a question as being directly lifted from a past paper.
 *
 * NOT generic phrases like "calculate the area" which are unavoidable.
 * These are distinctive multi-clause formulations unique to specific papers.
 */
const PAST_PAPER_FINGERPRINTS: Array<{ pattern: string; source?: string }> = [
  // AQA-style distinctive openings
  { pattern: "a student investigates how the extension of a spring depends on the force applied", source: "AQA Physics P1" },
  { pattern: "figure 1 shows a velocity-time graph for a car journey", source: "AQA Physics P1" },
  { pattern: "a teacher heats some water in a beaker using a bunsen burner", source: "AQA Chemistry P1" },
  { pattern: "the ph of a solution was measured at regular intervals", source: "AQA Chemistry P1" },
  { pattern: "a student investigated the effect of light intensity on the rate of photosynthesis", source: "AQA Biology P1" },
  { pattern: "figure 2 shows the percentage of adult males in england who were obese", source: "AQA Biology P2" },
  { pattern: "describe how the structure of the small intestine is adapted for absorption", source: "AQA Biology" },
  { pattern: "explain why the student's results may not be reproducible", source: "AQA Required Practical" },
  // Edexcel-style distinctive openings
  { pattern: "jamie is investigating the relationship between force and acceleration", source: "Edexcel Physics" },
  { pattern: "the table shows information about the planets in our solar system", source: "Edexcel Physics" },
  { pattern: "kira carries out an experiment to find the specific heat capacity of aluminium", source: "Edexcel Physics" },
  { pattern: "liam is comparing the properties of metals and non-metals", source: "Edexcel Chemistry" },
  // OCR-style distinctive openings
  { pattern: "a company manufactures boxes in the shape of a cuboid", source: "OCR Maths" },
  { pattern: "the histogram shows the distribution of waiting times", source: "OCR Maths" },
  { pattern: "alicia throws a biased coin three times", source: "OCR Maths" },
  // Common distinctive multi-clause patterns
  { pattern: "using the data in the table, draw a graph to show", source: "Common exam pattern" },
  { pattern: "give one reason why the student should repeat the experiment", source: "Common exam pattern" },
  { pattern: "suggest one improvement the student could make to the method", source: "Common exam pattern" },
  { pattern: "explain the advantage of using a large sample size", source: "Common exam pattern" },
  { pattern: "the student's hypothesis was that increasing the temperature would increase the rate", source: "Common exam pattern" },
  { pattern: "complete the ray diagram to show the path of light through the lens", source: "Physics optics" },
  { pattern: "calculate the gradient of the line between points a and b", source: "Maths/Science graph" },
  { pattern: "explain why this experiment should be carried out in a fume cupboard", source: "Chemistry safety" },
  { pattern: "predict what would happen if the experiment was repeated at a higher temperature", source: "Chemistry/Biology" },
  { pattern: "the results do not support the student's hypothesis. explain why", source: "Common exam pattern" },
];

/**
 * Normalise text for comparison: lowercase, collapse whitespace, strip punctuation.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute n-gram overlap similarity between two normalised strings.
 * Uses 4-grams (sequences of 4 words) for fingerprinting.
 */
function ngramSimilarity(a: string, b: string, n = 4): number {
  const wordsA = a.split(" ");
  const wordsB = b.split(" ");
  if (wordsA.length < n || wordsB.length < n) return 0;

  const ngramsA = new Set<string>();
  for (let i = 0; i <= wordsA.length - n; i++) {
    ngramsA.add(wordsA.slice(i, i + n).join(" "));
  }

  const ngramsB = new Set<string>();
  for (let i = 0; i <= wordsB.length - n; i++) {
    ngramsB.add(wordsB.slice(i, i + n).join(" "));
  }

  if (ngramsB.size === 0) return 0;

  let overlap = 0;
  for (const ng of ngramsB) {
    if (ngramsA.has(ng)) overlap++;
  }

  return overlap / ngramsB.size;
}

/**
 * Check worksheet sections for past-paper verbatim fingerprints.
 * Returns matches with similarity scores.
 */
export function detectPastPaperFingerprints(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): FingerprintResult {
  const matches: FingerprintMatch[] = [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!s.content) continue;
    // Only check question-like sections
    if (s.type && !/^q-|^question|^challenge/i.test(s.type)) continue;

    const normContent = normalise(s.content);

    for (const fp of PAST_PAPER_FINGERPRINTS) {
      const normPattern = normalise(fp.pattern);
      const sim = ngramSimilarity(normPattern, normContent);

      if (sim >= 0.6) {
        matches.push({
          sectionIndex: i,
          sectionTitle: s.title,
          matchedPattern: fp.pattern,
          similarity: Math.round(sim * 100) / 100,
          source: fp.source,
        });
      }
    }
  }

  const highRiskCount = matches.filter((m) => m.similarity > 0.8).length;
  const warnings: string[] = [];
  if (matches.length > 0) {
    warnings.push(
      `Past-paper fingerprint: ${matches.length} question(s) closely match known exam paper phrasings ` +
      `(${highRiskCount} high-risk, similarity > 80%). Consider rephrasing to ensure originality.`
    );
  }

  return { matches, warnings, highRiskCount };
}
