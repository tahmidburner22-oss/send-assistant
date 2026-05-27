#!/usr/bin/env node
/**
 * Parses a diagram-feedback GitHub Issue body and appends the entries
 * to tools/image-pipeline/feedback.json.
 *
 * Invoked by .github/workflows/diagram-feedback.yml. Reads:
 *   ISSUE_NUMBER, ISSUE_AUTHOR, ISSUE_BODY  (env)
 *
 * The issue body is expected to contain an HTML-comment block of the form:
 *
 *   <!-- DIAGRAM-FEEDBACK v1
 *   {"entries": [{"id": "pdl-0042", "flaws": ["too-much-text"], "note": "..."}]}
 *   -->
 *
 * Robustness:
 *   - If the JSON is missing or malformed, exits 1 so the workflow logs
 *     a clear failure and the bot comment is skipped.
 *   - Unknown flaw codes are dropped silently (same behaviour as
 *     feedback.mjs::appendEntries).
 *   - Entries without a known catalogue id are skipped.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadFeedback,
  saveFeedback,
  appendEntries,
} from "../../tools/image-pipeline/feedback.mjs";
import { parseCsv } from "../../tools/image-pipeline/csv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const CATALOGUE_PATH = path.join(REPO_ROOT, "docs/diagram-library-catalogue.csv");

const issueNumber = parseInt(process.env.ISSUE_NUMBER || "0", 10);
const issueAuthor = process.env.ISSUE_AUTHOR || "unknown";
const issueBody = process.env.ISSUE_BODY || "";

if (!issueNumber || !issueBody) {
  console.error("Missing ISSUE_NUMBER or ISSUE_BODY env.");
  process.exit(1);
}

const m = issueBody.match(
  /<!--\s*DIAGRAM-FEEDBACK\s+v1\s*([\s\S]*?)-->/i,
);
if (!m) {
  console.error("No DIAGRAM-FEEDBACK v1 block found in issue body.");
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(m[1].trim());
} catch (err) {
  console.error("Invalid JSON in DIAGRAM-FEEDBACK block:", err.message);
  process.exit(1);
}

if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
  console.error("No entries in feedback payload.");
  process.exit(1);
}

// Validate ids exist in the catalogue.
const csvText = await fs.readFile(CATALOGUE_PATH, "utf8");
const validIds = new Set(parseCsv(csvText).filter((r) => r.id).map((r) => r.id));
const invalid = payload.entries.filter((e) => !validIds.has(e.id));
const valid = payload.entries.filter((e) => validIds.has(e.id));
if (invalid.length > 0) {
  console.warn(
    `Dropped ${invalid.length} entries with unknown ids:`,
    invalid.map((e) => e.id).join(", "),
  );
}

const now = new Date().toISOString();
const queue = await loadFeedback();
appendEntries(
  queue,
  valid.map((e) => ({
    ...e,
    submittedBy: issueAuthor,
    submittedAt: now,
    issueNumber,
  })),
);
await saveFeedback(queue);

console.log(
  `Appended ${valid.length} entries to feedback.json (issue #${issueNumber} by ${issueAuthor}).`,
);
