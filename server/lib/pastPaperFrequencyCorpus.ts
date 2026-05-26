/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/lib/pastPaperFrequencyCorpus.ts — FEAT-H7.
 *
 * Production loader for the past-paper frequency corpus consumed by
 * G6's predicted-paper builder + the existing pastPaperFrequencyAnchor.
 * Reads server/data/corpora/past-paper-frequency/*.json.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/** Mirrors PastPaperQuestion shape used client-side. */
export interface PastPaperQuestionEntry {
  /** Year of the paper (e.g. 2023). */
  year: number;
  /** Awarding body (AQA / Edexcel / OCR). */
  board: string;
  /** Subject. */
  subject: string;
  /** Tier (foundation / higher / mixed). */
  tier?: string;
  /** Paper number (P1 / P2 / P3). */
  paper?: string;
  /** Topic tag. */
  topic: string;
  /** Marks. */
  marks: number;
}

export interface PastPaperFrequencyCorpus {
  entries: PastPaperQuestionEntry[];
  lastUpdated: string | null;
  source: "filesystem" | "fallback";
  warnings: string[];
}

let cache: PastPaperFrequencyCorpus | null = null;

function defaultDir(): string {
  return resolve(process.cwd(), "server/data/corpora/past-paper-frequency");
}

export function clearPastPaperFrequencyCorpusCache(): void {
  cache = null;
}

export function loadPastPaperFrequencyCorpus(dir = defaultDir()): PastPaperFrequencyCorpus {
  if (cache) return cache;
  const warnings: string[] = [];
  if (!existsSync(dir)) {
    cache = { entries: [], lastUpdated: null, source: "fallback", warnings: [`Past-paper corpus dir not found: ${dir}`] };
    return cache;
  }
  let lastUpdated: string | null = null;
  const entries: PastPaperQuestionEntry[] = [];
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
        const parsed = JSON.parse(raw) as { entries?: PastPaperQuestionEntry[] };
        if (Array.isArray(parsed.entries)) {
          for (const e of parsed.entries) {
            if (e && e.subject && e.topic && e.year) entries.push(e);
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

export function pastPaperEntriesForSubject(
  subject: string,
  yearsFrom?: number,
  yearsTo?: number,
): PastPaperQuestionEntry[] {
  const corpus = loadPastPaperFrequencyCorpus();
  const s = subject.trim().toLowerCase();
  return corpus.entries.filter((e) => {
    if (e.subject.toLowerCase() !== s) return false;
    if (typeof yearsFrom === "number" && e.year < yearsFrom) return false;
    if (typeof yearsTo === "number" && e.year > yearsTo) return false;
    return true;
  });
}
