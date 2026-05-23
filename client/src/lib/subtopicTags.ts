/**
 * subtopicTags.ts — derived (question-id → subtopic) map.
 *
 * Phase E PR-A. This file is the OUTPUT of `scripts/exam-bank-back-tagger.mjs`,
 * which pure-keyword-matches every existing question in the bank against
 * `SUBTOPICS_MAP` from `subtopics-data.ts` and stamps the closest subtopic.
 *
 * Two reasons for keeping this in a derived file rather than editing every
 * existing question entry directly:
 *   1. The bank files are append-only by Phase E policy (never edit existing
 *      entries), so legacy questions cannot grow a `subtopic` field in place.
 *   2. The map is regenerable — re-running the back-tagger with a tuned
 *      threshold or extended SUBTOPICS_MAP overwrites this file deterministically.
 *
 * Lookup order in `getExamQuestions` / `getCandidatePoolForTopics`:
 *   q.subtopic ?? SUBTOPIC_TAGS[q.id] ?? null
 *
 * The placeholder shape below ships before the back-tagger has run.
 * Empty map is a valid state — getExamQuestions falls through to topic-level
 * matching when no subtopic tag is found.
 */
export const SUBTOPIC_TAGS: Readonly<Record<string, string>> = Object.freeze({});
