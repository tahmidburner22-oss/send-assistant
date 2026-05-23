# Phase E — Exam Bank subtopic coverage + Create-an-Exam-Paper tool

Two intertwined goals:

- **Goal 1 — Coverage.** Every subtopic in
  `client/src/lib/subtopics-data.ts:SUBTOPICS_MAP` (~700 subtopics
  across ~178 topics) gets at least 10 exam-style questions tagged at
  subtopic level.
- **Goal 2 — Assembly.** A new tool **Create an Exam Paper** that
  takes `(subject, topics[], totalMarks)` and emits a real-looking
  paper drawing from the bank.

## Two PRs

| PR  | Title                                                          | Spec file                  |
| --- | -------------------------------------------------------------- | -------------------------- |
| A   | Exam Bank: subtopic schema + back-tagger + audit + gap-fill    | `features/FEAT-PE-A.json`  |
| B   | Create an Exam Paper: assembly engine + tool surface           | `features/FEAT-PE-B.json`  |

The previous planning session (lost) had originally split this into 10
PRs. After consolidating the natural review profiles (data-shape
verification vs. algorithm + UI review), 2 is the smallest count that
still allows a reviewer to do their job. The dependency direction is
one-way:

- PR-A is independently useful the moment it lands — every existing
  worksheet/exam tool gains subtopic-level filtering.
- PR-B's assembly engine works on whatever's in the bank — it does
  NOT depend on the gap-fill being complete.

## What's in the repo today (verified)

| Layer                | Where                                                | State                                                                                                                                  |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Question schema      | `client/src/lib/pastPaperQuestions.ts:58-100`        | `PastPaperQuestion` has `topic`, `marks`, `tier`, `commandWord`, `markScheme`, `ao`, `paperCode`, `calculator`, `stage`, `yearGroups` — **no subtopic field**. |
| Bank files           | `questionBank{Maths,Biology,Chemistry,Physics,English,OtherSubjects,Expanded}.ts` + `pastPaperQuestionsExpanded.ts` | ~6,800 questions tagged at topic level only.                                                                                            |
| Subtopic catalog     | `client/src/lib/subtopics-data.ts:10`                | ~178 topics × ~4 subtopics ≈ 700 subtopics. Drives the worksheet-generator subtopic dropdown.                                          |
| Helpers              | `pastPaperQuestions.ts:1861 / :1938 / :2006`         | `getExamQuestions`, `getTopicsForSubject`, `getDatabaseSummary`. All filter by topic, not subtopic.                                    |
| Existing exam-paper builders | `examPaperBuilder.ts`                          | `buildExamPaperWorksheet`, `buildHybridExamWorksheet`, `buildSelectedQuestionsWorksheet`. **No** "pick subject + N topics + target marks → assemble paper" flow. |
| Tool registry        | `client/src/lib/tool-registry.ts`                    | 32 tools. Where the new tool gets registered.                                                                                          |

## Sequencing

```
PR-A
├── Schema additions + helpers          (small, 1 commit)
├── Back-tagger script + first run      (1 commit)
├── Coverage audit script + report      (1 commit)
├── Gap-fill wave 1                     (1+ commits, append-only)
└── Open PR
       │
       ▼
PR-B
├── Assembly engine + unit tests        (1 commit)
├── Tool page + registry + route + hub  (1 commit)
└── Open PR
```

Each commit is followed by an immediate push to `feat/phase-e-exam-paper-builder`.
`SESSION-HANDOFF.md` is updated in the same commit.

## Hard sizing rules

- **Schema additions are additive only.** `subtopic?: string` on
  `PastPaperQuestion`. Older bank entries without it keep loading.
- **Bank edits are append-only.** Never modify existing question
  entries. Gap-fill questions are appended to the end of the
  appropriate bank file or written to a new dedicated file.
- **No npm install.** Sandbox is `INTEGRATIONS_ONLY`. Type-check + tests
  run in CI on PR push. All new scripts are `.mjs` per the existing
  `scripts/` convention.
- **No new export pipeline.** PR-B's new tool reuses
  `WorksheetRenderer` + `pdf-generator-v2` + Class Pack — same as every
  other tool.
- **Realistic scope.** PR-A delivers infrastructure + a focused first
  wave of gap-fill (prioritising zero-question subtopics in core GCSE
  subjects). The audit JSON makes the residual gap a transparent,
  knockable task list — subsequent sessions can grind it down without
  re-discovering anything. Pretending to author all ~5,000 missing
  questions in one session at a teacher-review quality bar would be
  dishonest about what fits in a session.

## Out of scope (deliberately)

- Fully filling every subtopic to ≥10 in this phase. The audit
  produces a delta; subsequent waves close it.
- Renderer changes for Create-an-Exam-Paper output. PR-B reuses the
  existing `ExamPaperWorksheet` renderer path.
- AI-assisted gap-fill. The first wave is hand-authored. AI assistance
  is a possible later wave once the audit shape is stable.

## Definition of done (each PR)

- [ ] CI passes (`npm test` + `tsc --noEmit`).
- [ ] `SESSION-HANDOFF.md` updated — "What is done" gains a bullet,
      "What is next" advances.
- [ ] PR description references this folder by path so a reviewer
      sees the wider context.
- [ ] Branch is pushed; PR is open.
