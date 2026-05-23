#!/usr/bin/env node
/**
 * scripts/exam-bank-coverage.mjs — Phase E PR-A.
 *
 * Walks every question in every bank file, counts how many are tagged
 * to each subtopic in SUBTOPICS_MAP (via q.subtopic OR SUBTOPIC_TAGS[q.id]),
 * and emits docs/exam-bank-coverage.json with totals + belowTen + zero
 * arrays. Optionally compares against a baseline JSON and exits 1 if
 * any subtopic count regressed.
 *
 * Usage:
 *   node scripts/exam-bank-coverage.mjs
 *     -> emits docs/exam-bank-coverage.json
 *
 *   node scripts/exam-bank-coverage.mjs --check-against=docs/exam-bank-coverage.baseline.json
 *     -> emits docs/exam-bank-coverage.json AND fails if any subtopic
 *        count regressed below baseline. Used by CI.
 *
 *   node scripts/exam-bank-coverage.mjs --update-baseline
 *     -> overwrites docs/exam-bank-coverage.baseline.json from the
 *        current run. Use after a deliberate gap-fill wave.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  REPO_ROOT,
  loadAllQuestions,
  loadSubtopicsMap,
  loadSubtopicTags,
  buildTopicToSubjectMap,
} from "./_exam-bank-extract.mjs";

const args = process.argv.slice(2);
const checkAgainstArg = args.find(a => a.startsWith("--check-against="));
const updateBaseline = args.includes("--update-baseline");
const CHECK_AGAINST = checkAgainstArg ? checkAgainstArg.split("=")[1] : null;

const OUTPUT_FILE = "docs/exam-bank-coverage.json";
const BASELINE_FILE = "docs/exam-bank-coverage.baseline.json";
const COVERAGE_THRESHOLD = 10;

function main() {
  console.log(`[coverage] loading bank...`);
  const questions = loadAllQuestions();
  console.log(`[coverage]   ${questions.length} unique questions`);

  const subtopicsMap = loadSubtopicsMap();
  const totalSubtopics = Object.values(subtopicsMap).reduce((n, arr) => n + arr.length, 0);
  console.log(`[coverage]   SUBTOPICS_MAP: ${Object.keys(subtopicsMap).length} topics, ${totalSubtopics} subtopics`);

  const subtopicTags = loadSubtopicTags();
  const tagCount = Object.keys(subtopicTags).length;
  console.log(`[coverage]   SUBTOPIC_TAGS: ${tagCount} tagged questions`);

  // Resolve effective subtopic per question.
  const effectiveSubtopic = new Map(); // questionId -> subtopic
  for (const q of questions) {
    const sub = q.explicitSubtopic ?? subtopicTags[q.id] ?? null;
    if (sub) effectiveSubtopic.set(q.id, sub);
  }

  // Build (subject -> topic -> subject) map for subject inference on
  // belowTen rows. Subtopics inherit their topic's most common subject
  // (or section-derived subject when the topic has no bank questions).
  const topicToSubject = buildTopicToSubjectMap(questions, subtopicsMap);

  // Count questions per subtopic.
  const subtopicCount = new Map(); // subtopic -> count
  for (const sub of effectiveSubtopic.values()) {
    subtopicCount.set(sub, (subtopicCount.get(sub) || 0) + 1);
  }

  // Build per-subject roll-up.
  const perSubject = {}; // subject -> { questionsScanned, subtopicsCovered, subtopicsBelowTen, subtopicsZero }
  // First pass — total questions per subject (from the bank).
  for (const q of questions) {
    if (!q.subject) continue;
    if (!perSubject[q.subject]) {
      perSubject[q.subject] = {
        questionsScanned: 0,
        subtopicsCovered: 0,
        subtopicsBelowTen: 0,
        subtopicsZero: 0,
      };
    }
    perSubject[q.subject].questionsScanned += 1;
  }
  // Second pass — initialise subjects that only exist via section-derived
  // inference (e.g. drama / music / sociology — no bank questions yet).
  for (const subject of Object.values(topicToSubject)) {
    if (subject && !perSubject[subject]) {
      perSubject[subject] = {
        questionsScanned: 0,
        subtopicsCovered: 0,
        subtopicsBelowTen: 0,
        subtopicsZero: 0,
      };
    }
  }

  // Walk every (topic, subtopic) pair in SUBTOPICS_MAP.
  const belowTen = [];
  const zero = [];
  let totalCovered = 0;
  let totalBelowTen = 0;
  let totalZero = 0;
  for (const [topic, subtopics] of Object.entries(subtopicsMap)) {
    const subjectForTopic = topicToSubject[topic] ?? null;
    for (const subtopic of subtopics) {
      const count = subtopicCount.get(subtopic) ?? 0;
      const subject = subjectForTopic;

      if (count >= COVERAGE_THRESHOLD) totalCovered += 1;
      if (count < COVERAGE_THRESHOLD) {
        totalBelowTen += 1;
        belowTen.push({ topic, subtopic, count, subject });
      }
      if (count === 0) {
        totalZero += 1;
        zero.push({ topic, subtopic, subject });
      }

      if (subject && perSubject[subject]) {
        if (count >= COVERAGE_THRESHOLD) perSubject[subject].subtopicsCovered += 1;
        if (count < COVERAGE_THRESHOLD) perSubject[subject].subtopicsBelowTen += 1;
        if (count === 0) perSubject[subject].subtopicsZero += 1;
      }
    }
  }

  // Sort belowTen: count ascending, then subject alphabetical, then topic, then subtopic.
  belowTen.sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    const sa = a.subject || "zzz", sb = b.subject || "zzz";
    if (sa !== sb) return sa.localeCompare(sb);
    if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
    return a.subtopic.localeCompare(b.subtopic);
  });
  zero.sort((a, b) => {
    const sa = a.subject || "zzz", sb = b.subject || "zzz";
    if (sa !== sb) return sa.localeCompare(sb);
    if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
    return a.subtopic.localeCompare(b.subtopic);
  });

  const report = {
    generatedAt: new Date().toISOString(),
    threshold: COVERAGE_THRESHOLD,
    totals: {
      questionsScanned: questions.length,
      questionsTagged: effectiveSubtopic.size,
      subtopicsTotal: totalSubtopics,
      subtopicsCovered: totalCovered,
      subtopicsBelowTen: totalBelowTen,
      subtopicsZero: totalZero,
    },
    perSubject,
    belowTen,
    zero,
  };

  // Write report.
  const outPath = join(REPO_ROOT, OUTPUT_FILE);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`[coverage] wrote ${OUTPUT_FILE}`);

  // Summary.
  console.log("");
  console.log("─".repeat(70));
  console.log(`[coverage] ${totalCovered}/${totalSubtopics} subtopics have >=${COVERAGE_THRESHOLD} questions`);
  console.log(`[coverage]   - belowTen: ${totalBelowTen}`);
  console.log(`[coverage]   - zero:     ${totalZero}`);
  console.log("");
  console.log("[coverage] per subject:");
  const subjectRows = Object.entries(perSubject)
    .sort((a, b) => b[1].questionsScanned - a[1].questionsScanned);
  for (const [subject, s] of subjectRows) {
    console.log(
      `  ${subject.padEnd(28)} qs=${String(s.questionsScanned).padStart(4)}  ` +
      `covered=${String(s.subtopicsCovered).padStart(3)}  ` +
      `belowTen=${String(s.subtopicsBelowTen).padStart(3)}  ` +
      `zero=${String(s.subtopicsZero).padStart(3)}`,
    );
  }

  if (updateBaseline) {
    const baselinePath = join(REPO_ROOT, BASELINE_FILE);
    writeFileSync(baselinePath, JSON.stringify(report, null, 2) + "\n", "utf8");
    console.log("");
    console.log(`[coverage] updated baseline: ${BASELINE_FILE}`);
  }

  if (CHECK_AGAINST) {
    const baselinePath = join(REPO_ROOT, CHECK_AGAINST);
    if (!existsSync(baselinePath)) {
      console.error(`[coverage] FAIL: baseline file not found: ${CHECK_AGAINST}`);
      process.exit(2);
    }
    const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
    const baselineCounts = new Map();
    for (const row of baseline.belowTen ?? []) {
      baselineCounts.set(`${row.topic}__${row.subtopic}`, row.count);
    }
    // Subtopics not in baseline.belowTen are at >= threshold in baseline.
    // Build the inverse: any subtopic at or above threshold in baseline
    // must stay at or above threshold (or just stay >= its baseline
    // count) in the new report.
    const baselineFloor = new Map();
    for (const [topic, subtopics] of Object.entries(subtopicsMap)) {
      for (const sub of subtopics) {
        const key = `${topic}__${sub}`;
        if (baselineCounts.has(key)) baselineFloor.set(key, baselineCounts.get(key));
        else baselineFloor.set(key, COVERAGE_THRESHOLD);
      }
    }
    // Compare to current.
    const regressions = [];
    for (const [topic, subtopics] of Object.entries(subtopicsMap)) {
      for (const sub of subtopics) {
        const key = `${topic}__${sub}`;
        const currentCount = subtopicCount.get(sub) ?? 0;
        const floor = baselineFloor.get(key) ?? COVERAGE_THRESHOLD;
        if (currentCount < floor) {
          regressions.push({ topic, subtopic: sub, baselineFloor: floor, current: currentCount });
        }
      }
    }
    if (regressions.length > 0) {
      console.error("");
      console.error("─".repeat(70));
      console.error(`[coverage] FAIL: ${regressions.length} subtopic(s) regressed below baseline floor:`);
      for (const r of regressions.slice(0, 20)) {
        console.error(`  ${r.topic} / ${r.subtopic}  ${r.current} < ${r.baselineFloor}`);
      }
      if (regressions.length > 20) {
        console.error(`  ... and ${regressions.length - 20} more`);
      }
      process.exit(1);
    }
    console.log("");
    console.log(`[coverage] OK — no subtopic regressed below baseline floor.`);
  }
}

main();
