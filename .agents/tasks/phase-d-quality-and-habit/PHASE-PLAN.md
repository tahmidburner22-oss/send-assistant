# Phase D — "Quality bets + habit hooks"

Goal: cover the user's improvement #12 (habit hooks) and the eight smaller
quality bets (#13–#20). Each PR is intentionally small — these are the
"individually less dramatic but collectively turn it from good to trusted"
items.

Two clusters:

**Habit hooks** (improvement #12 a–f) — make Adaptly the verb.
**Quality bets** (improvements #13–#20) — make Adaptly trusted.

## Hard sizing rules (apply to every PR in this phase)

- ≤ ~400 net lines changed (smaller than B/C — these PRs are narrower)
- ≤ ~8 files touched
- One coherent concept per PR
- Every habit hook ships behind a feature flag so ops can disable per
  tenant without redeploys

## PRs in this phase

| PR  | Maps to user's # | Title                                                 | Spec file       |
| --- | ---------------- | ----------------------------------------------------- | --------------- |
| 1   | #12 (a)          | Email-to-generate (worksheets@…)                      | FEAT-PD1.json   |
| 2   | #12 (b)          | iOS / Android share-sheet                             | FEAT-PD2.json   |
| 3   | #12 (c)          | 2-tap mobile generate from staffroom                  | FEAT-PD3.json   |
| 4   | #12 (d)          | Monday-morning email (your week ready)                | FEAT-PD4.json   |
| 5   | #12 (e)          | Streak / weekly summary email                         | FEAT-PD5.json   |
| 6   | #12 (f)          | Browser extension ("make worksheet from this")        | FEAT-PD6.json   |
| 7   | #13              | Worksheet versioning + diff history                   | FEAT-PD7.json   |
| 8   | #14 (already PB2)| (no spec — covered in Phase B · PB2)                  | n/a             |
| 9   | #15              | Bias & sensitivity audit on examples                  | FEAT-PD9.json   |
| 10  | #16              | Knowledge organiser auto-generated per topic          | FEAT-PD10.json  |
| 11  | #17              | Anchor-poster + Now/Next/Then card outputs            | FEAT-PD11.json  |
| 12  | #18              | Department library with HOD moderation                | FEAT-PD12.json  |
| 13  | #19              | Generation cost transparency + caching                | FEAT-PD13.json  |
| 14  | #20 (already PR-5)| (no spec — covered in Phase A · PR-5 + extended in PB)| n/a             |

## Recommended order

PD13 first (cost transparency — earns trust before any other ship).
PD7 (versioning) before PD9 (bias) so audits compare versions.
PD10 (KO) + PD11 (anchor poster) bundle nicely.
Habit hooks PD1–PD6 ship in parallel; each is independent.
PD12 (department library) last — it formalises everything that came before.

## Out-of-scope guardrails (every PR)

- Do not change the worksheet schema — only add optional fields.
- Email infra (PD1, PD4, PD5) reuses the existing transactional sender;
  no new SaaS.
- Browser extension (PD6) ships as a separate distribution; do not
  bundle into the main app.
