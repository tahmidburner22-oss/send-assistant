# Current Worksheet Test Findings

**Baseline executed:** `node scripts/verify-worksheet-scrutiny.mjs`
**Date:** 22 August 2026

| ID | Finding | Impact | Required repair and acceptance condition |
|---|---|---|---|
| WQ-001 | The scrutiny verifier’s `loadModule()` function expects TypeScript output at `.verify-tmp/worksheetPostValidator.js`, but the current `tsc` invocation emits the file into a nested source path or does not preserve the expected flat output. | The script cannot execute behavioural post-validator checks, so it provides incomplete evidence. | Update the verifier to locate the emitted JavaScript file robustly or use the project’s test runner. Re-run the script and require all behavioural assertions to execute. |
| WQ-002 | `WorksheetRenderer.tsx` still contains one lowercase per-question `Working out` caption, contrary to the test’s intended no-per-question-caption contract. | Can create unnecessary repeated visual noise and answer-space clutter in Maths worksheets. | Inspect the remaining occurrence, remove it only if it is per-question rather than a whole-section/challenge heading, then re-run the verifier and protected Maths visual tests. |

> These findings are release blockers for the worksheet test phase. No worksheet quality gate will be marked complete until both are fixed and the affected visual and functional checks pass.

## Closure and final quality evidence — 22 August 2026

| ID | Final status | Evidence |
|---|---|---|
| WQ-001 | **Resolved** | The verifier now locates and executes the scrutiny runtime checks. The final `node scripts/verify-worksheet-scrutiny.mjs` run passed all source, behavioural and ASC overlay assertions. |
| WQ-002 | **Resolved** | The redundant per-question lowercase caption was removed. The final scrutiny run reports zero pupil-facing matches and the protected Maths PDF review confirms uncluttered answer space. |
| WQ-003 | **Resolved** | Final PDF review found a lower-edge clearance risk in the Geography and Business layouts. The dedicated Humanities renderer now reserves a 7 mm footer safe area, uses compact evaluation response regions, and passes the exhaustive dedicated-layout matrix across supported profile/age combinations. |
| WQ-004 | **Resolved** | Dedicated Humanities support was upgraded from a label-only indication to concrete, compact pupil-facing strategies. ASC receives a one-task-at-a-time work route; low-vision profiles receive strengthened high-contrast response boundaries. The fixed two-page geometry and curriculum demand are unchanged. |

| Final worksheet evidence | Verified outcome |
|---|---|
| Functional scrutiny | All verifier checks passed, including runtime ASC section grouping and post-validator behavioural checks. |
| Automated regression | `46` test files passed; `954` tests passed; `1` test skipped. |
| Protected print structures | Maths Gold examples: `2` A4 landscape pages; Humanities examples: `2` A4 landscape pages; Science examples: `1` A4 landscape page. |
| Representative visual review | Ten fresh PDFs were exported. True-PDF inspection covered protected Maths Gold (dyslexia and ASC sensory), KS1 Science dyslexia, GCSE Science visual support, GCSE Geography ASC, GCSE Business visual support, and previously inspected History working-memory evidence. No remaining collision or clipping was observed in the final inspected samples. |

> **Worksheet gate conclusion:** all recorded worksheet test blockers are closed. Curriculum-content strength, reading-age adaptations, SEND support, protected page counts and print geometry have been revalidated before any wider platform work.
