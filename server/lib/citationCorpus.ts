/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/lib/citationCorpus.ts — FEAT-H7.
 *
 * Production loader for the citation corpus consumed by
 * citationGroundedFactual (PR-20 / audit #48). Reads
 * server/data/corpora/citations/*.json. Lazy-load + in-memory cache.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export interface CitationEntry {
  /** Verifiable claim (paraphrased). */
  claim: string;
  /** Subject + topic for retrieval. */
  subject: string;
  topic?: string;
  /** Source citation (paraphrased — never verbatim). */
  source: string;
  /** Confidence: high / medium / low. */
  confidence?: "high" | "medium" | "low";
}

export interface CitationCorpus {
  entries: CitationEntry[];
  lastUpdated: string | null;
  source: "filesystem" | "fallback";
  warnings: string[];
}

let cache: CitationCorpus | null = null;

function defaultDir(): string {
  return resolve(process.cwd(), "server/data/corpora/citations");
}

export function clearCitationCorpusCache(): void {
  cache = null;
}

export function loadCitationCorpus(dir = defaultDir()): CitationCorpus {
  if (cache) return cache;
  const warnings: string[] = [];
  if (!existsSync(dir)) {
    cache = { entries: [], lastUpdated: null, source: "fallback", warnings: [`Citation corpus dir not found: ${dir}`] };
    return cache;
  }
  let lastUpdated: string | null = null;
  const entries: CitationEntry[] = [];
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
        const parsed = JSON.parse(raw) as { entries?: CitationEntry[] };
        if (Array.isArray(parsed.entries)) {
          for (const e of parsed.entries) {
            if (e && e.claim && e.source && e.subject) entries.push(e);
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

export function findCitationsForSubject(subject: string, limit = 200): CitationEntry[] {
  const corpus = loadCitationCorpus();
  const s = subject.trim().toLowerCase();
  return corpus.entries.filter((e) => e.subject.toLowerCase() === s).slice(0, limit);
}
