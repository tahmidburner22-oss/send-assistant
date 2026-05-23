/**
 * pastPaperFingerprint.ts — PR-15 (audit item #3)
 *
 * Detects when a question stem reproduces a known past-paper question
 * verbatim. Uses a deterministic shingle-and-hash fingerprint
 * (5-token shingles, djb2 hash, hash set membership against a small
 * curated corpus of fingerprinted past-paper stems).
 *
 * Verbatim past-paper reuse exposes the publisher to copyright risk
 * and undermines the intended assessment use of those papers — pupils
 * who have practised the worksheet have already seen the live exam
 * question. The audit is warn-only — never rewrites — so a teacher
 * who legitimately wanted to extract a known past-paper for revision
 * can still do so, but with the warning visible.
 *
 * The corpus shipped here is intentionally minimal (~12 fingerprints)
 * — it's a scaffolding the larger PR-23 corpus will populate. The
 * fingerprinting algorithm is the canonical part. Adding entries is
 * a pure data change.
 */

interface FpSection {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
}

interface FpWorksheet {
  sections?: FpSection[];
  metadata?: { [key: string]: unknown };
}

const SHINGLE_SIZE = 5;
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "of", "in", "on", "to",
  "for", "and", "or", "with", "by", "this", "that", "it", "as", "at",
]);

function tokeniseForFingerprint(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

function djb2(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function fingerprintQuestion(text: string): string[] {
  const tokens = tokeniseForFingerprint(text);
  if (tokens.length < SHINGLE_SIZE) return [];
  const shingles: string[] = [];
  for (let i = 0; i <= tokens.length - SHINGLE_SIZE; i += 1) {
    const slice = tokens.slice(i, i + SHINGLE_SIZE).join(" ");
    shingles.push(djb2(slice));
  }
  return shingles;
}

/**
 * Curated past-paper fingerprints. Each entry is the shingle hash set
 * for a known past-paper question. Source labels follow the format
 * `{board}:{paper}:{year}:Q{n}`. The actual hashes here are seeded
 * from a tiny demonstration corpus — production deployments load
 * from `server/db/past_paper_fingerprints` table (PR-23).
 */
export const PAST_PAPER_CORPUS: ReadonlyArray<{
  source: string;
  hashes: ReadonlySet<string>;
}> = [
  // Demo: AQA GCSE Maths Higher 2022 Paper 1 Q12 (representative shingles).
  {
    source: "aqa:maths-higher:2022:P1:Q12",
    hashes: new Set([
      djb2("solve simultaneous equations 2x 3y"),
      djb2("simultaneous equations 2x 3y 12"),
      djb2("equations 2x 3y 12 x"),
    ]),
  },
  // Demo: AQA GCSE Biology Paper 2 2019 Q4 (representative shingles).
  {
    source: "aqa:biology:2019:P2:Q4",
    hashes: new Set([
      djb2("describe how impulse passes through synapse"),
      djb2("how impulse passes through synapse"),
    ]),
  },
];

export interface FingerprintMatch {
  source: string;
  matchedShingles: number;
  totalShingles: number;
  ratio: number;
}

export function checkAgainstCorpus(text: string): FingerprintMatch[] {
  const fp = fingerprintQuestion(text);
  if (fp.length === 0) return [];
  const fpSet = new Set(fp);
  const matches: FingerprintMatch[] = [];
  for (const entry of PAST_PAPER_CORPUS) {
    let matched = 0;
    for (const h of entry.hashes) {
      if (fpSet.has(h)) matched += 1;
    }
    if (matched === 0) continue;
    const ratio = matched / Math.max(entry.hashes.size, 1);
    if (ratio >= 0.5) {
      matches.push({
        source: entry.source,
        matchedShingles: matched,
        totalShingles: entry.hashes.size,
        ratio,
      });
    }
  }
  return matches;
}

export function enforcePastPaperFingerprint(
  ws: FpWorksheet,
): { worksheet: FpWorksheet; warnings: string[] } {
  const warnings: string[] = [];
  const matches: Array<{ section: string; match: FingerprintMatch }> = [];

  for (const s of ws.sections || []) {
    if (s.teacherOnly) continue;
    if (!/^q-|question|application/i.test(s.type || "")) continue;
    const content = String(s.content || "");
    if (!content) continue;
    const found = checkAgainstCorpus(content);
    for (const m of found) {
      matches.push({ section: s.title || s.type || "?", match: m });
      warnings.push(
        `[Phase PR-15 — Past-paper fingerprint] Section "${s.title || s.type || "?"}" matches ${m.source} ` +
        `at ${(m.ratio * 100).toFixed(0)}% shingle overlap. Verbatim past-paper reuse undermines the paper's assessment value — paraphrase the stem.`,
      );
    }
  }

  if (warnings.length === 0) return { worksheet: ws, warnings: [] };

  return {
    worksheet: {
      ...ws,
      metadata: {
        ...(ws.metadata || {}),
        pastPaperFingerprintMatches: matches.map((m) => ({
          section: m.section,
          source: m.match.source,
          ratio: m.match.ratio,
        })),
      },
    },
    warnings,
  };
}
