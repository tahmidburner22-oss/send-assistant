#!/usr/bin/env node
/**
 * scripts/exam-bank-back-tagger.mjs — Phase E PR-A.
 *
 * Pure-Node, no dependencies. Reads every question-bank file as plain
 * text, regex-extracts each question entry's id + topic + text, scores
 * each candidate subtopic from SUBTOPICS_MAP against the question text,
 * and emits client/src/lib/subtopicTags.ts as a frozen
 * Record<id, subtopic> map.
 *
 * Why text-parsing (not import): the sandbox is INTEGRATIONS_ONLY — no
 * `tsx`/`ts-node`, no compile step. This script runs straight under
 * Node 22 and produces deterministic output a CI checker can verify.
 *
 * Lookup contract used by client/src/lib/pastPaperQuestions.ts:
 *   q.subtopic ?? SUBTOPIC_TAGS[q.id] ?? null
 * So this script's job is to fill SUBTOPIC_TAGS for legacy questions
 * that lack an explicit `subtopic:` field.
 *
 * Confidence threshold: 0.6 normalised score. Tunable via CLI:
 *   node scripts/exam-bank-back-tagger.mjs --threshold=0.5
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const BANK_FILES = [
  "client/src/lib/questionBankMaths.ts",
  "client/src/lib/questionBankBiology.ts",
  "client/src/lib/questionBankChemistry.ts",
  "client/src/lib/questionBankPhysics.ts",
  "client/src/lib/questionBankEnglish.ts",
  "client/src/lib/questionBankOtherSubjects.ts",
  "client/src/lib/questionBankExpanded.ts",
  "client/src/lib/pastPaperQuestionsExpanded.ts",
  "client/src/lib/pastPaperQuestions.ts",
];

const SUBTOPICS_FILE = "client/src/lib/subtopics-data.ts";
const OUTPUT_FILE = "client/src/lib/subtopicTags.ts";

// CLI flags
const args = process.argv.slice(2);
const thresholdArg = args.find(a => a.startsWith("--threshold="));
const CONFIDENCE_THRESHOLD = thresholdArg
  ? Number(thresholdArg.split("=")[1])
  : 0.35;

const STOP_WORDS = new Set([
  "a", "an", "the", "of", "and", "to", "in", "for", "with", "on", "from",
  "or", "as", "at", "by", "is", "be", "this", "that", "these", "those",
  "it", "its", "are", "was", "were", "into", "onto", "out", "up", "down",
]);

// ── Subtopic-name extraction ────────────────────────────────────────────────

/**
 * Extract SUBTOPICS_MAP from subtopics-data.ts as Record<topic, subtopic[]>.
 * Pure-text approach: find the SUBTOPICS_MAP literal, walk it brace-aware
 * (skipping string contents), then regex out each `"key": [ "v", "v", ... ]`
 * entry.
 */
function extractSubtopicsMap(content) {
  const idx = content.indexOf("SUBTOPICS_MAP");
  if (idx < 0) throw new Error("SUBTOPICS_MAP not found in subtopics-data.ts");
  const startBrace = content.indexOf("{", idx);
  if (startBrace < 0) throw new Error("Opening brace for SUBTOPICS_MAP not found");

  // Walk forward, skipping string contents, to find the matching close brace.
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let endBrace = -1;
  for (let i = startBrace; i < content.length; i++) {
    const ch = content[i];
    const prev = i > 0 ? content[i - 1] : "";
    if (inString) {
      if (ch === stringChar && prev !== "\\") inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true; stringChar = ch; continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { endBrace = i; break; }
    }
  }
  if (endBrace < 0) throw new Error("Unbalanced SUBTOPICS_MAP literal");
  const block = content.slice(startBrace + 1, endBrace);

  const map = {};
  const entryRe = /"((?:[^"\\]|\\.)*?)":\s*\[([\s\S]*?)\]/g;
  let m;
  while ((m = entryRe.exec(block)) !== null) {
    const topic = unescapeString(m[1]);
    const arr = m[2];
    const subRe = /"((?:[^"\\]|\\.)*?)"/g;
    const subs = [];
    let sm;
    while ((sm = subRe.exec(arr)) !== null) subs.push(unescapeString(sm[1]));
    if (subs.length > 0) map[topic] = subs;
  }
  return map;
}

function unescapeString(s) {
  return s
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

// ── Question-entry extraction ───────────────────────────────────────────────

/**
 * Walk the file forward once with string-aware brace tracking, recording
 * every `{`-`}` pair regardless of nesting. Returns an array of
 * `{ start, end }` objects (end is exclusive — points just past `}`).
 *
 * This is the canonical pre-index used by extractQuestions: walking
 * backwards from an `id:` match cannot reliably track string state, so
 * we instead pre-build the brace index forward and look up the smallest
 * enclosing pair for each `id:` occurrence.
 */
function indexBracePairs(content) {
  const stack = [];
  const pairs = [];
  let inString = false;
  let stringChar = null;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const prev = i > 0 ? content[i - 1] : "";
    if (inString) {
      if (ch === stringChar && prev !== "\\") inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true; stringChar = ch; continue;
    }
    if (ch === "{") stack.push(i);
    else if (ch === "}") {
      const start = stack.pop();
      if (start !== undefined) pairs.push({ start, end: i + 1 });
    }
  }
  // Sort by start position for deterministic lookup.
  pairs.sort((a, b) => a.start - b.start);
  return pairs;
}

/**
 * For a given character position `pos`, return the smallest brace pair
 * that contains it. Linear scan — fine because there are typically a
 * few thousand pairs per file.
 */
function smallestContainingPair(pairs, pos) {
  let best = null;
  for (const p of pairs) {
    if (p.start <= pos && pos < p.end) {
      if (!best || (p.end - p.start) < (best.end - best.start)) best = p;
    }
  }
  return best;
}

/**
 * Find every `id:` field, look up the smallest enclosing brace pair,
 * extract topic/subject/text/subtopic/question fields. Handles BOTH
 * formatting styles in the repo:
 *   - Multi-line: `  {\n    id: "...",\n    ...\n  }`
 *   - Single-line: `{ id:"...", topic:"...", text:"..." }`
 */
function extractQuestions(content, sourceFile) {
  const out = [];
  const pairs = indexBracePairs(content);

  const idRe = /\bid\s*:\s*"((?:[^"\\]|\\.)*?)"/g;
  const seenStarts = new Set();
  let m;
  while ((m = idRe.exec(content)) !== null) {
    const id = unescapeString(m[1]);
    const enclosing = smallestContainingPair(pairs, m.index);
    if (!enclosing) continue;
    if (seenStarts.has(enclosing.start)) continue;
    seenStarts.add(enclosing.start);

    const entryText = content.slice(enclosing.start, enclosing.end);
    out.push({
      id,
      sourceFile,
      topic: matchStringField(entryText, "topic"),
      subject: matchStringField(entryText, "subject"),
      text: matchStringField(entryText, "text") ?? matchStringField(entryText, "question") ?? "",
      explicitSubtopic: matchStringField(entryText, "subtopic"),
    });
  }
  return out;
}

function matchStringField(entryText, fieldName) {
  const re = new RegExp(
    `(?:^|[\\s,{(])${fieldName}:\\s*"((?:[^"\\\\]|\\\\.)*)"`,
    "s",
  );
  const m = entryText.match(re);
  return m ? unescapeString(m[1]) : null;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function tokenize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Crude suffix-strip stemmer. Maps "fractions" -> "fraction",
 * "adding" -> "add", "denominators" -> "denominator", etc. so the
 * subtopic-vs-question vocabulary mismatch (subtopic names use
 * plurals + gerunds, questions use imperatives + singulars) doesn't
 * make every match score zero.
 */
function stem(t) {
  if (t.length < 4) return t;
  if (t.endsWith("ies") && t.length >= 5) return t.slice(0, -3) + "y";
  if (t.endsWith("ing") && t.length >= 6) return t.slice(0, -3);
  if (t.endsWith("ed") && t.length >= 5) return t.slice(0, -2);
  if (t.endsWith("es") && t.length >= 5) return t.slice(0, -2);
  if (t.endsWith("s") && t.length >= 4) return t.slice(0, -1);
  return t;
}

/**
 * Build an IDF map over every subtopic name in SUBTOPICS_MAP.
 * Tokens that appear in many subtopics (e.g. "one", "less", "more",
 * "value") get a low IDF score and contribute almost nothing; tokens
 * unique to one subtopic (e.g. "photosynthesis", "algebraic") get a
 * high IDF and dominate scoring. This kills the over-tagging where
 * generic-named subtopics like "One more and one less" pulled in
 * hundreds of unrelated questions.
 */
function buildIdfMap(subtopicsMap) {
  const allSubtopics = [];
  for (const subs of Object.values(subtopicsMap)) allSubtopics.push(...subs);
  const N = allSubtopics.length;
  const df = new Map();
  for (const sub of allSubtopics) {
    const stems = new Set(
      tokenize(sub)
        .filter(t => t.length >= 3 && !STOP_WORDS.has(t))
        .map(stem),
    );
    for (const s of stems) df.set(s, (df.get(s) || 0) + 1);
  }
  const idf = new Map();
  for (const [s, dfCount] of df) {
    // Smoothed IDF: log((N + 1) / (df + 1)) + 1 — always positive.
    idf.set(s, Math.log((N + 1) / (dfCount + 1)) + 1);
  }
  return idf;
}

function scoreSubtopic(subtopic, qText, idfMap) {
  if (!subtopic || !qText) return 0;
  const subLower = subtopic.toLowerCase();
  const qLower = qText.toLowerCase();
  const qStems = new Set(tokenize(qText).map(stem));

  const tokens = tokenize(subtopic).filter(t => t.length >= 3 && !STOP_WORDS.has(t));
  if (tokens.length === 0) return 0;

  let score = 0;
  let totalIdf = 0;
  for (const t of tokens) {
    const s = stem(t);
    const w = idfMap.get(s) ?? 1.0;
    totalIdf += w;
    if (qStems.has(s)) score += 1.0 * w;            // stem-level whole-word match
    else if (qLower.includes(t)) score += 0.4 * w;  // raw substring fallback
    else if (qLower.includes(s)) score += 0.4 * w;  // stem substring fallback
  }

  // Verbatim-substring boost — fixed bonus, not multiplied.
  if (qLower.includes(subLower)) score += 0.5 * totalIdf;

  return totalIdf > 0 ? score / totalIdf : 0;
}

/**
 * Pick the best subtopic for a question:
 *   - prefer candidates from SUBTOPICS_MAP[q.topic] when the topic is known
 *   - fallback to all subtopics across all topics when the topic isn't in the map
 *   - return null if the best score is below threshold OR doesn't beat the
 *     second-best by a comfortable margin (kills near-tie ambiguous tags)
 */
function pickBestSubtopic(q, subtopicsMap, idfMap) {
  if (q.explicitSubtopic) return { subtopic: q.explicitSubtopic, score: Infinity, matchedFromTopic: q.topic };
  if (!q.text) return null;

  // Build candidate list. Prefer in-topic subtopics; fall back to all.
  let candidates = null;
  if (q.topic && subtopicsMap[q.topic]) {
    candidates = subtopicsMap[q.topic].map(s => ({ topic: q.topic, subtopic: s }));
  }
  if (!candidates || candidates.length === 0) {
    // Topic-name fuzzy match against SUBTOPICS_MAP keys.
    const qTopicLower = (q.topic || "").toLowerCase();
    for (const [topic, subs] of Object.entries(subtopicsMap)) {
      const tLower = topic.toLowerCase();
      if (qTopicLower && (tLower.includes(qTopicLower) || qTopicLower.includes(tLower))) {
        candidates = subs.map(s => ({ topic, subtopic: s }));
        break;
      }
    }
  }
  if (!candidates || candidates.length === 0) {
    // Final fallback: search all subtopics across all topics.
    candidates = [];
    for (const [topic, subs] of Object.entries(subtopicsMap)) {
      for (const s of subs) candidates.push({ topic, subtopic: s });
    }
  }

  let best = { subtopic: null, score: 0, matchedFromTopic: null };
  let secondBest = 0;
  for (const c of candidates) {
    const s = scoreSubtopic(c.subtopic, q.text, idfMap);
    if (s > best.score) {
      secondBest = best.score;
      best = { subtopic: c.subtopic, score: s, matchedFromTopic: c.topic };
    } else if (s > secondBest) {
      secondBest = s;
    }
  }
  if (best.score < CONFIDENCE_THRESHOLD) return null;
  // Margin requirement — kills ambiguous near-ties when several subtopics
  // share the same generic word (e.g. several "Place Value …" subtopics
  // all matching the token "value").
  if (best.score - secondBest < 0.08) return null;
  return best;
}

// ── Output emitter ──────────────────────────────────────────────────────────

function emitSubtopicTags(tags) {
  const sortedIds = Object.keys(tags).sort();
  const lines = [];
  lines.push("/**");
  lines.push(" * subtopicTags.ts — derived (question-id -> subtopic) map.");
  lines.push(" *");
  lines.push(" * Phase E PR-A. AUTOGENERATED by scripts/exam-bank-back-tagger.mjs.");
  lines.push(" * Do NOT edit by hand. Re-run the back-tagger to regenerate.");
  lines.push(" *");
  lines.push(" * The lookup contract used in pastPaperQuestions.ts is:");
  lines.push(" *   q.subtopic ?? SUBTOPIC_TAGS[q.id] ?? null");
  lines.push(" *");
  lines.push(` * Threshold used: ${CONFIDENCE_THRESHOLD}`);
  lines.push(` * Generated: ${new Date().toISOString()}`);
  lines.push(` * Tagged: ${sortedIds.length} questions`);
  lines.push(" */");
  lines.push("export const SUBTOPIC_TAGS: Readonly<Record<string, string>> = Object.freeze({");
  for (const id of sortedIds) {
    const subtopic = tags[id];
    const idEscaped = JSON.stringify(id);
    const subEscaped = JSON.stringify(subtopic);
    lines.push(`  ${idEscaped}: ${subEscaped},`);
  }
  lines.push("});");
  lines.push("");
  return lines.join("\n");
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log(`[back-tagger] threshold = ${CONFIDENCE_THRESHOLD}`);

  const subtopicsContent = readFileSync(join(REPO_ROOT, SUBTOPICS_FILE), "utf8");
  const subtopicsMap = extractSubtopicsMap(subtopicsContent);
  const totalSubtopics = Object.values(subtopicsMap).reduce((n, arr) => n + arr.length, 0);
  console.log(`[back-tagger] loaded SUBTOPICS_MAP: ${Object.keys(subtopicsMap).length} topics, ${totalSubtopics} subtopics`);

  const idfMap = buildIdfMap(subtopicsMap);
  console.log(`[back-tagger] built IDF over ${idfMap.size} unique stems`);

  const allQuestions = [];
  for (const f of BANK_FILES) {
    const content = readFileSync(join(REPO_ROOT, f), "utf8");
    const qs = extractQuestions(content, f);
    console.log(`[back-tagger] ${f.padEnd(50)} -> ${qs.length} questions`);
    allQuestions.push(...qs);
  }

  // Dedupe by id, keeping first occurrence (the canonical bank file's entry).
  const byId = new Map();
  for (const q of allQuestions) if (!byId.has(q.id)) byId.set(q.id, q);
  const unique = Array.from(byId.values());
  console.log(`[back-tagger] total unique questions: ${unique.length}`);

  const tags = {};
  const subtopicCounts = new Map();
  const untaggedByTopic = new Map();
  let tagged = 0;
  let explicit = 0;

  for (const q of unique) {
    const result = pickBestSubtopic(q, subtopicsMap, idfMap);
    if (!result) {
      const k = q.topic || "(no topic)";
      untaggedByTopic.set(k, (untaggedByTopic.get(k) || 0) + 1);
      continue;
    }
    if (result.score === Infinity) explicit++;
    tags[q.id] = result.subtopic;
    tagged++;
    subtopicCounts.set(result.subtopic, (subtopicCounts.get(result.subtopic) || 0) + 1);
  }

  // Emit output.
  const out = emitSubtopicTags(tags);
  writeFileSync(join(REPO_ROOT, OUTPUT_FILE), out, "utf8");

  // Summary.
  const pct = unique.length > 0 ? ((tagged / unique.length) * 100).toFixed(1) : "0.0";
  console.log("");
  console.log("─".repeat(70));
  console.log(`[back-tagger] tagged ${tagged}/${unique.length} questions (${pct}%)`);
  console.log(`[back-tagger]   - explicit subtopic field: ${explicit}`);
  console.log(`[back-tagger]   - back-tagged from text:    ${tagged - explicit}`);
  console.log(`[back-tagger]   - untagged:                 ${unique.length - tagged}`);
  console.log("");

  console.log("[back-tagger] top 10 most-tagged subtopics:");
  const topSubs = Array.from(subtopicCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [sub, count] of topSubs) console.log(`  ${count.toString().padStart(4)}  ${sub}`);
  console.log("");

  console.log("[back-tagger] top 10 untagged-topic counts (untagged questions by topic):");
  const topUntagged = Array.from(untaggedByTopic.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [topic, count] of topUntagged) console.log(`  ${count.toString().padStart(4)}  ${topic}`);
  console.log("");

  console.log(`[back-tagger] wrote ${OUTPUT_FILE}`);
}

main();
