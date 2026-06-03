# Live Worksheet Generator Audit — June 2026

## Status: COMPLETE | Worksheets: 6/7 | Method: Playwright + Chromium headless

### Executive Summary
Science/English worksheets generate full 14-section structure (10/14). Maths with SEND REGRESSES to 3/14. Diagram A/B never populated. Question counts below targets. Maths Genie mode coded but inactive.

### Critical Issues
1. Maths + Dyscalculia/Dyslexia lose all structure (3/14 sections)
2. Diagram A/B never pull from 5,975-entry library (0%)
3. Section 2: 4 questions (target 7) — LLM ignoring prompt
4. Per-question marks: section totals instead of per-Q
5. Maths Genie exam-style mode never activates (PR #160 coded it)

### Worksheet Results
| # | Subject | SEND | Score | Key Finding |
|---|---------|------|-------|-------------|
| 1 | Maths/Y10/Quadratics | Dyslexia | 3/14 | No structure |
| 2 | Biology/Y10/Cells | ADHD | 10/14 | Full structure, overlays working |
| 3 | Chemistry/Y11/Atomic | Anxiety | 10/14 | Invitational titles working |
| 4 | Physics/Y9/Forces | HI | 10/14 | Topic Summary working, inline defs buggy |
| 5 | English/Y10/Macbeth | MLD | 10/14 | Best SEND: HELP BOX everywhere |
| 6 | Maths/Y11/Histograms | Dyscalculia | 3/14 | Structure destroyed by scaffold |

### PRs Built but Not Shipping
- PR #160: Exam-style mode — metadata.examStyle never set to true
- PR #155: HI inline definitions — concatenation bug
- PR #153: Section 2 count hardening — LLM ignoring the prompt rule

### 9-Sprint Improvement Plan (9 days total)
| Sprint | Priority | Effort | Task |
|--------|----------|--------|------|
| 1 | P0 | 2d | Fix maths structure (SEND destroying sections) |
| 2 | P0 | 2d | Wire diagram library into generation |
| 3 | P1 | 1d | Section 2 question count (4→7) |
| 4 | P1 | 0.5d | Per-question mark allocations |
| 5 | P1 | 1d | Activate Maths Genie exam-style mode |
| 6 | P2 | 0.5d | Fix HI inline definition bug |
| 7 | P2 | 0.5d | Fix Anxiety challenge title |
| 8 | P3 | 0.5d | Section 1 count (verified OK) |
| 9 | P3 | 1d | Consistency polish |

### Key Files
- client/src/lib/ai.ts — Generation logic
- client/src/lib/worksheetPostValidator.ts — SEND overlays
- client/src/lib/worksheetSectionTargets.ts — Question counts (7-7-5-1)
- client/src/lib/visualLanguageSystem.ts — Exam-style mode
- client/src/components/WorksheetRenderer.tsx — Rendering
- docs/diagram-library-catalogue.csv — 5,975 diagrams
