/**
 * misconceptionBank.ts — PR-19 carry-over for audit item #17.
 *
 * Pure registry view of the misconception bank, keyed by
 * (subject, key-stage). The flat list lives in `misconception-bank.ts`
 * (kebab-case) and remains the single source of truth for entries.
 * This module is a thin index over it so callers can:
 *
 *   - look up the canonical id list for a (subject, keyStage) pair,
 *   - validate that an id parsed from a TEACHER_DIAGNOSES marker
 *     belongs to a known entry without re-walking the flat list,
 *   - render the lookup keyed map for telemetry / docs.
 *
 * The emit shape used by FEAT-PB7 (`extractMisconceptionLinks`) is
 * unchanged — the validator continues to accept any id that matches
 * `/m-[a-z0-9-]{2,}/`. Misconception ids that DON'T match a registry
 * entry are still accepted so a future bank entry doesn't retro-fail
 * older worksheets, but `isKnownMisconceptionId(id)` lets new callers
 * tighten their own validation.
 */

import {
  MISCONCEPTION_BANK,
  type MisconceptionEntry,
  type KeyStage,
} from "./misconception-bank";

export type { KeyStage, MisconceptionEntry } from "./misconception-bank";

export interface MisconceptionRegistryKey {
  subject: string;
  keyStage: KeyStage;
}

/** Build the index lazily on first access; the bank is a small constant
 *  array so a synchronous one-shot build is fine. */
let cachedIndex: Record<string, MisconceptionEntry[]> | undefined;

function indexKey(subject: string, keyStage: KeyStage): string {
  return `${subject.toLowerCase().trim()}::${keyStage}`;
}

function buildIndex(): Record<string, MisconceptionEntry[]> {
  if (cachedIndex) return cachedIndex;
  const index: Record<string, MisconceptionEntry[]> = Object.create(null);
  for (const entry of MISCONCEPTION_BANK) {
    for (const ks of entry.keyStages) {
      const k = indexKey(entry.subject, ks);
      if (!index[k]) index[k] = [];
      index[k].push(entry);
    }
  }
  cachedIndex = index;
  return index;
}

/** Return every misconception entry for a (subject, keyStage) pair. */
export function getMisconceptionsByKey(key: MisconceptionRegistryKey): MisconceptionEntry[] {
  const index = buildIndex();
  return index[indexKey(key.subject, key.keyStage)] || [];
}

/** Return every canonical misconception id, in stable bank order. */
export function listAllMisconceptionIds(): string[] {
  return MISCONCEPTION_BANK.map((e) => e.id);
}

/** Return the ids for one (subject, keyStage) pair. */
export function listMisconceptionIdsByKey(key: MisconceptionRegistryKey): string[] {
  return getMisconceptionsByKey(key).map((e) => e.id);
}

/** Set lookup for known ids — O(1) per call after first build. */
let cachedIdSet: Set<string> | undefined;
function knownIdSet(): Set<string> {
  if (cachedIdSet) return cachedIdSet;
  cachedIdSet = new Set(listAllMisconceptionIds());
  return cachedIdSet;
}

/** True when `id` matches a registry entry. Lower-cases input first. */
export function isKnownMisconceptionId(id: string): boolean {
  return knownIdSet().has(String(id || "").toLowerCase().trim());
}

/** Resolve an id to its registry entry, or undefined. */
export function lookupMisconceptionEntry(id: string): MisconceptionEntry | undefined {
  const lower = String(id || "").toLowerCase().trim();
  return MISCONCEPTION_BANK.find((e) => e.id === lower);
}

/**
 * Surface the registry as a frozen { subject -> { keyStage -> ids[] }}
 * map for downstream telemetry / docs. Frozen so callers can't
 * accidentally mutate the shared lookup.
 */
export function getMisconceptionRegistryView(): Readonly<Record<string, Readonly<Partial<Record<KeyStage, readonly string[]>>>>> {
  const out: Record<string, Partial<Record<KeyStage, string[]>>> = Object.create(null);
  for (const entry of MISCONCEPTION_BANK) {
    const subj = entry.subject.toLowerCase();
    if (!out[subj]) out[subj] = {};
    for (const ks of entry.keyStages) {
      if (!out[subj][ks]) out[subj][ks] = [];
      if (!out[subj][ks].includes(entry.id)) out[subj][ks].push(entry.id);
    }
  }
  // Freeze the inner objects so callers cannot mutate. The cast is
  // safe because we never mutate after freezing.
  for (const subj of Object.keys(out)) {
    for (const ks of Object.keys(out[subj]) as KeyStage[]) Object.freeze(out[subj][ks]);
    Object.freeze(out[subj]);
  }
  Object.freeze(out);
  return out;
}

/**
 * The id-pattern PB7's link extractor uses. Exported here so the
 * extractor and the registry stay in sync — change the pattern in
 * one place and both ends move.
 */
export const MISCONCEPTION_ID_PATTERN = /m-[a-z0-9-]{2,}/g;
