/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/lib/featureFlagAllowList.ts — W3 (FEAT-H8 admin wiring).
 *
 * Persistence layer for the per-school dark-flag allow-list consumed by
 * `server/lib/featureFlags.ts:buildFlagResolver`.
 *
 * Storage: a single JSON file at `server/data/feature-flag-allowlist.json`.
 * Atomic write via temp-file + rename. Missing file is a valid empty
 * allow-list (returns `[]`). Malformed file warns and is ignored.
 *
 * Pure functions are exposed for unit tests: `parseAllowList`,
 * `serializeAllowList`, `validateAllowEntry`. The disk-touching
 * `readAllowListFromDisk` / `writeAllowListToDisk` are thin I/O wrappers
 * so the rest of the system stays pure.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DarkFlagName, FlagAllowEntry } from "./featureFlags.js";

export const DARK_FLAG_NAMES: readonly DarkFlagName[] = [
  "PROMPT_AB_ENABLED",
  "PROMPT_FAMILIES_ENABLED",
  "PROMPT_SELF_CONSISTENCY_ENABLED",
  "PROMPT_CITATION_LAYER_ENABLED",
  "GENERATION_CACHE_ENABLED",
] as const;

const DARK_FLAG_SET = new Set<string>(DARK_FLAG_NAMES);

export interface AllowListFile {
  /** Schema version (bump when the on-disk shape changes). */
  version: 1;
  /** Source of truth for per-school flag overrides. */
  entries: FlagAllowEntry[];
  /** ISO timestamp set by `writeAllowListToDisk`. */
  updatedAt?: string;
}

const EMPTY_FILE: AllowListFile = { version: 1, entries: [] };

export function defaultAllowListPath(): string {
  return resolve(process.cwd(), "server/data/feature-flag-allowlist.json");
}

/** Throws an `Error` listing every problem with the entry. */
export function validateAllowEntry(raw: unknown): FlagAllowEntry {
  if (!raw || typeof raw !== "object") {
    throw new Error("Allow-list entry must be an object");
  }
  const r = raw as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof r.schoolId !== "string" || r.schoolId.length === 0) {
    errors.push("schoolId must be a non-empty string");
  }
  if (typeof r.flag !== "string" || !DARK_FLAG_SET.has(r.flag)) {
    errors.push(`flag must be one of: ${DARK_FLAG_NAMES.join(", ")}`);
  }
  if (typeof r.enabled !== "boolean") {
    errors.push("enabled must be a boolean");
  }
  if (r.subjects !== undefined && !Array.isArray(r.subjects)) {
    errors.push("subjects must be an array of strings or omitted");
  }
  if (r.questionTypes !== undefined && !Array.isArray(r.questionTypes)) {
    errors.push("questionTypes must be an array of strings or omitted");
  }
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
  return {
    schoolId: r.schoolId as string,
    flag: r.flag as DarkFlagName,
    enabled: r.enabled as boolean,
    subjects: Array.isArray(r.subjects) ? (r.subjects as string[]) : undefined,
    questionTypes: Array.isArray(r.questionTypes) ? (r.questionTypes as string[]) : undefined,
  };
}

/** Parses a raw JSON-string into a normalised `AllowListFile`. */
export function parseAllowList(raw: string): AllowListFile {
  if (raw.trim().length === 0) return EMPTY_FILE;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Allow-list JSON parse failed: ${(err as Error).message}`);
  }
  if (!parsed || typeof parsed !== "object") return EMPTY_FILE;
  const obj = parsed as { version?: unknown; entries?: unknown };
  const entriesArr = Array.isArray(obj.entries) ? obj.entries : [];
  const entries: FlagAllowEntry[] = [];
  for (const e of entriesArr) {
    try {
      entries.push(validateAllowEntry(e));
    } catch {
      // Skip malformed individual entries — admins fix them via the UI.
    }
  }
  return { version: 1, entries };
}

export function serializeAllowList(file: AllowListFile): string {
  const out: AllowListFile = {
    version: 1,
    entries: file.entries,
    updatedAt: file.updatedAt ?? new Date().toISOString(),
  };
  return JSON.stringify(out, null, 2) + "\n";
}

/** Reads the on-disk allow-list, returning `[]` when the file is absent. */
export function readAllowListFromDisk(path = defaultAllowListPath()): AllowListFile {
  if (!existsSync(path)) return { ...EMPTY_FILE };
  try {
    const raw = readFileSync(path, "utf8");
    return parseAllowList(raw);
  } catch {
    return { ...EMPTY_FILE };
  }
}

/** Atomically writes the allow-list to disk. Creates the parent dir if missing. */
export function writeAllowListToDisk(
  entries: FlagAllowEntry[],
  path = defaultAllowListPath(),
): AllowListFile {
  const validated = entries.map((e) => validateAllowEntry(e));
  const file: AllowListFile = {
    version: 1,
    entries: validated,
    updatedAt: new Date().toISOString(),
  };
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, serializeAllowList(file), "utf8");
  renameSync(tmp, path);
  return file;
}
