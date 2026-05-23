/**
 * scripts/_exam-bank-extract.mjs — Phase E PR-A.
 *
 * Shared text-parsing helpers used by both the back-tagger and the
 * coverage audit. Pure Node, no dependencies.
 *
 * The leading underscore matches the existing convention for support
 * scripts that aren't directly invokable (see _gen-eval-fixtures.mjs).
 *
 * Why text-parsing rather than importing the TS bank files?
 *   - Sandbox is INTEGRATIONS_ONLY; no `tsx`/`ts-node`/compile step.
 *   - Bank files mix two question-entry formats:
 *       multi-line: `  {\n    id: "...",\n    ...\n  }`
 *       single-line: `{ id:"...", topic:"...", text:"..." }`
 *     A regex-based forward brace walker handles both uniformly.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(__dirname, "..");

export const BANK_FILES = [
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

export const SUBTOPICS_FILE = "client/src/lib/subtopics-data.ts";
export const SUBTOPIC_TAGS_FILE = "client/src/lib/subtopicTags.ts";

export function unescapeString(s) {
  return s
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

/**
 * Walk content forward with string-aware brace tracking. Returns every
 * `{`-`}` pair as `{ start, end }` (end is exclusive). Sorted by start.
 *
 * Skips `//` line comments and `/* ... *\/` block comments so an
 * apostrophe inside a comment (e.g. `// Ohm's Law`) doesn't trip the
 * single-quote string detector.
 */
export function indexBracePairs(content) {
  const stack = [];
  const pairs = [];
  let inString = false;
  let stringChar = null;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const prev = i > 0 ? content[i - 1] : "";
    const next = i + 1 < content.length ? content[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") { inBlockComment = false; i++; }
      continue;
    }
    if (inString) {
      if (ch === stringChar && prev !== "\\") inString = false;
      continue;
    }
    // Outside string + outside comment.
    if (ch === "/" && next === "/") { inLineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { inBlockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true; stringChar = ch; continue;
    }
    if (ch === "{") stack.push(i);
    else if (ch === "}") {
      const start = stack.pop();
      if (start !== undefined) pairs.push({ start, end: i + 1 });
    }
  }
  pairs.sort((a, b) => a.start - b.start);
  return pairs;
}

export function smallestContainingPair(pairs, pos) {
  let best = null;
  for (const p of pairs) {
    if (p.start <= pos && pos < p.end) {
      if (!best || (p.end - p.start) < (best.end - best.start)) best = p;
    }
  }
  return best;
}

export function matchStringField(entryText, fieldName) {
  const re = new RegExp(
    `(?:^|[\\s,{(])${fieldName}:\\s*"((?:[^"\\\\]|\\\\.)*)"`,
    "s",
  );
  const m = entryText.match(re);
  return m ? unescapeString(m[1]) : null;
}

/**
 * Find every `id:` field, look up the smallest enclosing brace pair,
 * extract topic/subject/text/subtopic/question fields. Handles BOTH
 * multi-line and single-line entry formats.
 */
export function extractQuestions(content, sourceFile) {
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

/**
 * Load every question from every bank file. Dedupes by id (first
 * occurrence wins).
 */
export function loadAllQuestions() {
  const all = [];
  for (const f of BANK_FILES) {
    const content = readFileSync(join(REPO_ROOT, f), "utf8");
    const qs = extractQuestions(content, f);
    all.push(...qs);
  }
  const byId = new Map();
  for (const q of all) if (!byId.has(q.id)) byId.set(q.id, q);
  return Array.from(byId.values());
}

/**
 * Map of canonical SUBTOPICS_MAP section comments to subject IDs.
 * The subtopics-data.ts file is structured into sections like:
 *   // ═════════════════
 *   // MATHEMATICS — PRIMARY
 *   // ═════════════════
 * which we use to back-fill subjects for topics that have no bank
 * questions yet.
 */
export const SECTION_TO_SUBJECT = {
  "MATHEMATICS — PRIMARY": "mathematics",
  "MATHEMATICS — SECONDARY": "mathematics",
  "MATHEMATICS": "mathematics",
  "ENGLISH — PRIMARY": "english-language",
  "ENGLISH — SECONDARY": "english-language",
  "ENGLISH LANGUAGE": "english-language",
  "ENGLISH LITERATURE": "english-literature",
  "SCIENCE": "science",
  "BIOLOGY": "biology",
  "CHEMISTRY": "chemistry",
  "PHYSICS": "physics",
  "HISTORY": "history",
  "GEOGRAPHY": "geography",
  "RELIGIOUS STUDIES": "religious-studies",
  "COMPUTER SCIENCE": "computer-science",
  "MODERN FOREIGN LANGUAGES": "mfl",
  "BUSINESS STUDIES": "business",
  "PSYCHOLOGY": "psychology",
  "ECONOMICS": "economics",
  "SOCIOLOGY": "sociology",
  "PHYSICAL EDUCATION": "physical-education",
  "ART": "art",
  "MUSIC": "music",
  "DRAMA": "drama",
  "11+ VERBAL REASONING": "verbal-reasoning",
  "11+ NON-VERBAL REASONING": "non-verbal-reasoning",
};

/**
 * Heuristic refinement for the broad "SCIENCE" section: split topics
 * into biology / chemistry / physics by topic-name keywords. Used as a
 * fallback when a topic has no bank questions and lives in the SCIENCE
 * section of subtopics-data.ts.
 */
export function refineScienceSubject(topicName) {
  const t = (topicName || "").toLowerCase();
  if (/\b(cell|organism|plant|animal|photosynthesis|respiration|enzyme|hormone|gene|dna|nervous|circulat|digest|breath|lung|heart|kidney|reproduct|ecosystem|biodiv|evolut|inheritance|microbe|bacteria|virus|disease|immune|homeostasis|exchange|transport in|biolog)/i.test(t)) {
    return "biology";
  }
  if (/\b(atom|element|compound|bond|reaction|acid|alkali|salt|ionic|covalent|periodic|electrolysis|metal|halogen|noble gas|organic|polymer|hydrocarbon|combust|titration|chromatograph|chemic|mole|formula|equation in chem|particle|state of matter)/i.test(t)) {
    return "chemistry";
  }
  if (/\b(force|motion|speed|velocity|acceleration|energy|work|power|wave|sound|light|reflect|refract|electric|circuit|current|voltage|resist|magnet|electromagnet|nuclear|radioact|isotope|gravity|pressure|density|momentum|astronom|space|gas law)/i.test(t)) {
    return "physics";
  }
  return "science";
}

/**
 * Load SUBTOPICS_MAP and additionally return a topic -> section mapping
 * derived from the `// SECTION NAME` comments in subtopics-data.ts.
 */
export function loadSubtopicsMap() {
  const content = readFileSync(join(REPO_ROOT, SUBTOPICS_FILE), "utf8");
  const idx = content.indexOf("SUBTOPICS_MAP");
  if (idx < 0) throw new Error("SUBTOPICS_MAP not found in subtopics-data.ts");
  const startBrace = content.indexOf("{", idx);
  if (startBrace < 0) throw new Error("Opening brace for SUBTOPICS_MAP not found");

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

  // Walk the literal block once, tracking the most recent section header
  // so we can attach it to each topic in declaration order.
  const block = content.slice(startBrace + 1, endBrace);
  const blockLines = block.split("\n");
  const map = {};
  const topicSection = {}; // topic -> section name
  let currentSection = null;
  // Use a per-line scan: detect section headers (// SECTION_NAME between
  // two ═════ lines) and topic-key declarations (start with `"…": [`).
  for (let li = 0; li < blockLines.length; li++) {
    const line = blockLines[li];
    const headerMatch = line.match(/^\s*\/\/\s+([A-Z][A-Z0-9 +\-—()]*[A-Z0-9])\s*$/);
    if (headerMatch) {
      const name = headerMatch[1].trim();
      // Ignore comments that look like decorative lines (all dashes etc.).
      if (name.length >= 2 && /[A-Z]/.test(name)) currentSection = name;
      continue;
    }
    // Each subtopics-map key declaration starts with `"<topic>": [`.
    const topicKey = line.match(/^\s*"((?:[^"\\]|\\.)*?)":\s*\[/);
    if (topicKey) {
      const topic = unescapeString(topicKey[1]);
      topicSection[topic] = currentSection;
    }
  }

  // Now extract topic -> subtopic[] using the same approach as before.
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

  // Attach the section -> subject mapping for callers that want it.
  Object.defineProperty(map, "__topicSection", { value: topicSection, enumerable: false });
  return map;
}

/**
 * Load SUBTOPIC_TAGS from subtopicTags.ts as Record<id, subtopic>.
 * Uses regex over the literal — back-tagger emits a known shape so
 * this is robust without parsing TS.
 */
export function loadSubtopicTags() {
  const content = readFileSync(join(REPO_ROOT, SUBTOPIC_TAGS_FILE), "utf8");
  const map = {};
  const re = /"((?:[^"\\]|\\.)*?)":\s*"((?:[^"\\]|\\.)*?)",?/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const id = unescapeString(m[1]);
    const sub = unescapeString(m[2]);
    map[id] = sub;
  }
  return map;
}

/**
 * Build a topic -> subject map. Combines two signals:
 *   1. The most-common subject across questions tagged with that topic
 *      (highest priority — reflects the actual bank).
 *   2. The section-comment-derived subject from subtopics-data.ts
 *      (fallback for topics with no bank questions yet — many gap rows).
 *
 * For topics in the broad "SCIENCE" section, refines via topic-name
 * keyword matching to bio/chem/phys.
 */
export function buildTopicToSubjectMap(questions, subtopicsMap) {
  const counts = new Map(); // topic -> Map<subject, count>
  for (const q of questions) {
    if (!q.topic || !q.subject) continue;
    if (!counts.has(q.topic)) counts.set(q.topic, new Map());
    const m = counts.get(q.topic);
    m.set(q.subject, (m.get(q.subject) || 0) + 1);
  }
  const out = {};
  for (const [topic, m] of counts) {
    let best = null, bestN = 0;
    for (const [sub, n] of m) {
      if (n > bestN) { best = sub; bestN = n; }
    }
    out[topic] = best;
  }

  // Fallback: section-derived subject for any topic still missing.
  if (subtopicsMap && subtopicsMap.__topicSection) {
    const sections = subtopicsMap.__topicSection;
    for (const topic of Object.keys(subtopicsMap)) {
      if (out[topic]) continue;
      const section = sections[topic];
      if (!section) continue;
      const inferred = SECTION_TO_SUBJECT[section];
      if (!inferred) continue;
      out[topic] = inferred === "science" ? refineScienceSubject(topic) : inferred;
    }
  }

  return out;
}
