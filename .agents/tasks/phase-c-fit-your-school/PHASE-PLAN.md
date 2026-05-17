# Phase C — "We fit your school"

Goal: take the product from "tool an enthusiastic teacher uses" to "tool a
Head of Department or SENCO will put on the IT-approved list." Every PR
in this phase removes a procurement objection.

## Hard sizing rules (apply to every PR in this phase)

- ≤ ~600 net lines changed
- ≤ ~10 files touched
- One coherent concept per PR
- New integrations land behind a server flag so each can be enabled per
  tenant without redeploys
- All third-party API keys live in env vars; never check secrets in

## PRs in this phase

| PR  | Maps to user's # | Title                                                       | Spec file        |
| --- | ---------------- | ----------------------------------------------------------- | ---------------- |
| 1   | #7 (a)           | LMS push: Google Classroom + Microsoft Teams + Satchel One  | FEAT-PC1.json    |
| 2   | #7 (b)           | MIS roster: Wonde + GroupCall import                        | FEAT-PC2.json    |
| 3   | #7 (c)           | LTI 1.3 launch + QTI 3.0 + Common Cartridge export          | FEAT-PC3.json    |
| 4   | #3               | Curriculum coverage map ("Ofsted view")                     | FEAT-PC4.json    |
| 5   | #6               | Bulk scheme-of-work generation                              | FEAT-PC5.json    |
| 6   | #9               | EAL parity (bilingual side-by-side + per-pupil reading age) | FEAT-PC6.json    |
| 7   | #10              | Accessibility certification (WCAG 2.2 AA + Braille pipeline)| FEAT-PC7.json    |

## Recommended order

PC4 (coverage map) and PC5 (scheme-of-work) first — they're product-level
wins that don't depend on integrations. Then PC1 + PC2 (the procurement
unblock pair). Then PC3 (LTI/QTI), then PC6 (EAL) + PC7 (accessibility)
in either order.

## Out-of-scope guardrails (every PR)

- Do not change Worksheets.tsx form structure (Phase A territory).
- Do not break the existing `/share/passport/:token` or
  `/share/companion/:token` public routes.
- Every new server route requires CSRF + auth in line with the existing
  `requireAuth` middleware. No anonymous integrations.
- Wonde / GroupCall / LTI logos are NOT bundled — link only.
