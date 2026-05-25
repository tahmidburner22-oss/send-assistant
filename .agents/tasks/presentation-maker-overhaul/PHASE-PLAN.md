# Presentation Maker — Big-Bang Overhaul

User asked for *every* improvement from the 56-item gap analysis to be shipped.
Branch: `feat/presentation-maker-overhaul`. One branch, progressive commits, the
team reviews after.

## Phases (to bound each commit)

| Phase | Name                          | Items | Size |
|-------|-------------------------------|-------|------|
| 1     | Visual foundation             | 1, 2, 3, 4, 5, 6, 7, 8, 14, 15, 16 | L |
| 2     | Subject + slide-type breadth  | 20, 28, 29, 30, 31, 32, 33 | L |
| 3     | Classroom interactivity       | 37, 38, 39, 40, 41, 42, 49, 50, 51, 46 | XL |
| 4     | Export & integrity            | 9, 10, 11, 12, 13, 44, 45, 52 | XL |
| 5     | Content rigour                | 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 35, 36 | L |
| 6     | Quality, telemetry, identity  | 34, 47, 48, 53, 54, 55, 56, 43 | M |

Items refer to numbers in the original gap analysis (see SESSION-HANDOFF.md
ledger for the full list).

## Rules for this branch

- One commit per logical chunk so the team can cherry-pick if anything is
  broken.
- Every commit message is `pres-maker: <chunk>` so they're easy to filter.
- Update `SESSION-HANDOFF.md` at the end of every chunk so a new chat session
  can resume on item N+1 without re-reading anything else.
- Don't add tests this round — the user said the team will check.
- Don't break PPTX export — every visual change must mirror in the PPTX
  painter.
