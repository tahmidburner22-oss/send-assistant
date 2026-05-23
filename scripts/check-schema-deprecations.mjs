#!/usr/bin/env node
/**
 * scripts/check-schema-deprecations.mjs — PR-22 / audit item #53.
 *
 * Schema-deprecation policy enforcer. Walks every Zod schema in
 * `shared/aiSchemas.ts` (and any future shared schema file) looking
 * for fields tagged with a JSDoc `@deprecated` comment, then verifies:
 *
 *   1. Each `@deprecated` tag is followed by a sunset ISO date
 *      (e.g. "@deprecated 2026-09-01 — use foo instead").
 *   2. The sunset date hasn't passed (CI fails so the field gets
 *      removed before it goes stale in production).
 *   3. Every deprecated field is also documented in
 *      `docs/llm-output-contract.md` with a deprecation note.
 *
 * Run:
 *   node scripts/check-schema-deprecations.mjs
 *
 * Exit codes:
 *   0 — all deprecations are well-formed and in-window.
 *   1 — at least one deprecation is malformed or expired.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SCHEMA_PATH = join(ROOT, "shared/aiSchemas.ts");
const CONTRACT_PATH = join(ROOT, "docs/llm-output-contract.md");

const DEPRECATED_RE = /\/\*\*([\s\S]*?@deprecated[\s\S]*?)\*\//g;
const SUNSET_RE = /@deprecated\s+(\d{4}-\d{2}-\d{2})/;

async function main() {
  if (!existsSync(SCHEMA_PATH)) {
    process.stdout.write(`[check-schema-deprecations] No schema file at ${SCHEMA_PATH} — skipping.\n`);
    return;
  }
  const schema = await readFile(SCHEMA_PATH, "utf8");
  const contract = existsSync(CONTRACT_PATH) ? await readFile(CONTRACT_PATH, "utf8") : "";

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const errors = [];
  const seen = new Set();
  let m;
  while ((m = DEPRECATED_RE.exec(schema)) !== null) {
    const block = m[1];
    const sunset = SUNSET_RE.exec(block);
    if (!sunset) {
      errors.push(`@deprecated tag at offset ${m.index} is missing a sunset date (YYYY-MM-DD).`);
      continue;
    }
    const dateStr = sunset[1];
    seen.add(dateStr);
    const date = new Date(dateStr + "T00:00:00.000Z");
    if (Number.isNaN(date.getTime())) {
      errors.push(`@deprecated sunset "${dateStr}" is not a valid ISO date.`);
      continue;
    }
    if (date.getTime() < today.getTime()) {
      errors.push(`@deprecated sunset "${dateStr}" has expired — remove the field or extend the date.`);
    }
    // Look for a mention of this date in the contract.
    if (contract && !contract.includes(dateStr)) {
      errors.push(
        `@deprecated sunset "${dateStr}" is not documented in docs/llm-output-contract.md — add a deprecation note.`,
      );
    }
  }

  if (errors.length === 0) {
    process.stdout.write(
      `[check-schema-deprecations] OK — ${seen.size} active deprecation${seen.size === 1 ? "" : "s"} (none expired).\n`,
    );
    return;
  }
  for (const e of errors) process.stderr.write(`[check-schema-deprecations] ${e}\n`);
  process.exit(1);
}

main().catch((e) => {
  process.stderr.write(`[check-schema-deprecations] crashed: ${e?.stack ?? e}\n`);
  process.exit(2);
});
