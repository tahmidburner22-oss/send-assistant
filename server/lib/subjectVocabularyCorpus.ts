/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/lib/subjectVocabularyCorpus.ts — FEAT-H7.
 *
 * Production loader for the subject-vocabulary corpus consumed by
 * spVocabularyLibraryAudit (PR-19 / audit #83). Reads
 * server/data/corpora/subject-vocab/*.json on first call, caches in
 * memory until refresh. Returns empty corpus + warning if files
 * absent.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export interface SubjectVocabEntry {
  /** Canonical term (lowercase). */
  term: string;
  /** Subject (e.g. "physics", "english"). */
  subject: string;
  /** Key Stage 3 / 4 / 5 tag. */
  keyStage: "ks3" | "ks4" | "ks5";
  /** Short definition. */
  definition: string;
  /** Common synonyms. */
  synonyms?: string[];
  /** Source attribution (e.g. "AQA GCSE Physics specification §3.2"). */
  source?: string;
}

export interface SubjectVocabCorpus {
  entries: SubjectVocabEntry[];
  lastUpdated: string | null;
  source: "filesystem" | "fallback";
  warnings: string[];
}

let cache: SubjectVocabCorpus | null = null;

function defaultCorpusDir(): string {
  return resolve(process.cwd(), "server/data/corpora/subject-vocab");
}

export function clearSubjectVocabCorpusCache(): void {
  cache = null;
}

export function loadSubjectVocabCorpus(dir = defaultCorpusDir()): SubjectVocabCorpus {
  if (cache) return cache;
  const warnings: string[] = [];
  if (!existsSync(dir)) {
    cache = { entries: [], lastUpdated: null, source: "fallback", warnings: [`Corpus dir not found: ${dir}`] };
    return cache;
  }
  let lastUpdated: string | null = null;
  const entries: SubjectVocabEntry[] = [];
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      try {
        const path = join(dir, f);
        const stat = statSync(path);
        if (!lastUpdated || stat.mtime.toISOString() > lastUpdated) {
          lastUpdated = stat.mtime.toISOString();
        }
        const raw = readFileSync(path, "utf8");
        const parsed = JSON.parse(raw) as { entries?: SubjectVocabEntry[] };
        if (Array.isArray(parsed.entries)) {
          for (const e of parsed.entries) {
            if (e && e.term && e.subject) entries.push(e);
          }
        }
      } catch (err) {
        warnings.push(`Failed to load ${f}: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    warnings.push(`Corpus dir scan failed: ${(err as Error).message}`);
  }
  cache = {
    entries,
    lastUpdated,
    source: entries.length > 0 ? "filesystem" : "fallback",
    warnings,
  };
  return cache;
}

export function lookupSubjectVocab(subject: string, term: string): SubjectVocabEntry | null {
  const corpus = loadSubjectVocabCorpus();
  const t = term.trim().toLowerCase();
  const s = subject.trim().toLowerCase();
  return (
    corpus.entries.find(
      (e) => e.subject.toLowerCase() === s && (e.term.toLowerCase() === t || (e.synonyms || []).some((x) => x.toLowerCase() === t)),
    ) || null
  );
}
