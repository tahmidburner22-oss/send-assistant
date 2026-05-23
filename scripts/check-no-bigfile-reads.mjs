#!/usr/bin/env node
/**
 * scripts/check-no-bigfile-reads.mjs — PR-21 / audit item #72.
 *
 * CI guard: ban whole-file reads of the three monster modules from
 * any new PR description, Kiro prompt log, or .agents/tasks/* file.
 *
 * The `ai.ts` (5,200+ lines), `Worksheets.tsx` (6,500+ lines) and
 * `WorksheetRenderer.tsx` (7,000+ lines) modules are too large for a
 * fresh chat to read in their entirety without exhausting context. A
 * recurring failure mode is a Kiro session that opens with a
 * full-file read of one of these, then runs out of context before it
 * can write any code. This script scans the changed files in a PR
 * for that pattern and exits non-zero when it finds one.
 *
 * Heuristics (any one trips):
 *   - A literal phrase like "read ai.ts in full" / "whole file".
 *   - A `read_files` tool-log line referencing one of the three
 *     modules with `skipPruning: true` and no `start_line`.
 *   - A `cat ai.ts` or `cat client/src/lib/ai.ts` command in any new
 *     bash script.
 *
 * Files checked (default): `.agents/tasks/**`, `docs/**`, `**/*.md`.
 * The list is overridable via the first CLI arg.
 *
 * Exit codes:
 *   0 — no banned pattern found.
 *   1 — at least one banned pattern found (CI fails the workflow).
 *
 * Run:
 *   node scripts/check-no-bigfile-reads.mjs
 *   node scripts/check-no-bigfile-reads.mjs path/to/file.md
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(import.meta.url);
const ROOT = process.argv[2] ? join(process.cwd(), process.argv[2]) : process.cwd();

const BIG_FILES = ["ai.ts", "Worksheets.tsx", "WorksheetRenderer.tsx"];

const BANNED_PATTERNS = [
  // Plain English flagged in PR descriptions / Kiro prompts.
  /read(?:ing)?\s+(?:the\s+)?(?:entire|whole|full)\s+(?:file\s+)?(?:of\s+)?(ai\.ts|Worksheets\.tsx|WorksheetRenderer\.tsx)/i,
  /(?:cat|less|head|tail)\s+(?:[^\s|]*\/)?(ai\.ts|Worksheets\.tsx|WorksheetRenderer\.tsx)\b/,
  /skipPruning["'\s:]+true[^}]*"paths"[^}]*\b(ai\.ts|Worksheets\.tsx|WorksheetRenderer\.tsx)\b(?![^}]*"end_line")/,
];

const TARGET_GLOBS = [
  ".agents/tasks",
  "docs",
];

const TARGET_FILE_EXTS = [".md", ".mdx", ".txt"];

async function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".git")) continue;
    const full = join(dir, name);
    let s;
    try {
      s = await stat(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      out = out.concat(await walk(full));
    } else if (TARGET_FILE_EXTS.some((e) => name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

async function collectTargets() {
  const all = [];
  for (const sub of TARGET_GLOBS) {
    const dir = join(ROOT, sub);
    all.push(...(await walk(dir)));
  }
  return all;
}

async function scanFile(file) {
  let content;
  try {
    content = await readFile(file, "utf8");
  } catch {
    return [];
  }
  const hits = [];
  for (const pat of BANNED_PATTERNS) {
    const m = pat.exec(content);
    if (m) {
      const line = content.slice(0, m.index).split("\n").length;
      hits.push({ file: relative(ROOT, file), line, snippet: m[0].slice(0, 120) });
    }
  }
  return hits;
}

async function main() {
  const files = await collectTargets();
  const allHits = [];
  for (const f of files) {
    const hits = await scanFile(f);
    allHits.push(...hits);
  }
  if (allHits.length === 0) {
    process.stdout.write("[check-no-bigfile-reads] OK — no whole-file read patterns found.\n");
    return;
  }
  process.stderr.write(
    `[check-no-bigfile-reads] FAIL — ${allHits.length} banned pattern${allHits.length === 1 ? "" : "s"} found:\n`,
  );
  for (const h of allHits) {
    process.stderr.write(`  ${h.file}:${h.line} — ${h.snippet}\n`);
  }
  process.stderr.write(
    `\nThe big modules listed in PHASE-PLAN.md (${BIG_FILES.join(", ")}) must NEVER be read in full from a fresh chat.\n` +
      `Use grep_search + read_files with start_line/end_line ranges instead.\n`,
  );
  process.exit(1);
}

main().catch((e) => {
  process.stderr.write(`[check-no-bigfile-reads] crashed: ${e?.stack ?? e}\n`);
  process.exit(2);
});

// File self-reference kept inert so static analysers don't flag the
// banned strings inside this script itself as a tripwire.
void HERE;
