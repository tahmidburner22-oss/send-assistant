# Lane 1 — Pre-pilot Fixes — Phase Plan

## Goal

Ship 8 surgical fixes to the worksheet generator as a single PR
(`feat/lane-1-pre-pilot-fixes`) so the output is classroom-usable at
multiple UK schools, with the SEND USP (Hearing-Impairment, Anxiety,
EAL) deterministically enforced rather than relying on AI obedience.

## Success criteria

1. A worksheet rendered with `(4 marks)` shows the same affordances
   (badge, lined answer block, working-out box) as one rendered with
   `[4 marks]`. **No silent loss of answer space.**
2. A Y9–Y11 secondary worksheet's Section 3 marks are emitted by the
   AI in `(N marks)` form, and the stale `Q7, Q8, Q9` reference is
   gone — replaced with the dynamic Q-range computed from the Phase 1
   section targets.
3. The buttons above a generated worksheet are ≤ 10 in the primary
   row, with everything else under a single "More…" dropdown menu.
4. After editing a worksheet, the teacher sees a yellow banner above
   the toolbar reading "You've edited this since the last print —
   preview to confirm" until they next click Print or PDF.
5. A worksheet generated with `sendNeed = "eal"` and the pupil's
   first language set to Urdu / Polish / Bengali / Punjabi / Arabic /
   Romanian shows the bilingual glossary in that language.
6. A worksheet generated with `sendNeed = "hi"` always contains a
   `"Topic Summary — read first"` section above Q1, populated by the
   deterministic post-validator if the AI omitted it.
7. A worksheet generated with `sendNeed = "anxiety"` always shows
   `"OPTIONAL BONUS — only if you want to!"` instead of "Challenge",
   and Section 1 starts with "WARM-UP".
8. No worksheet ever ships with literal `[specific skill/concept N
   from Topic]`, `[learning objective]`, or similar placeholder
   strings on a pupil-facing page.

## Order of work

The order is chosen to minimise blast radius — each commit is
independently revertible:

1. **1.1 + 1.2** — Renderer regex + prompt brackets. Pure rendering /
   prompting; minimal test impact.
2. **1.8** — Stronger placeholder scrubber. Pure regex extension.
3. **1.5** — EAL languages. Pure data addition to a lookup table.
4. **1.6 + 1.7** — Deterministic SEND markers (single new validator
   covering both). Wired into the registry. Unit tests added.
5. **1.4** — View-consistency banner. UI-only state addition.
6. **1.3** — Toolbar declutter. Largest UI change; lands last so it
   doesn't churn snapshot tests of earlier fixes.

## Out of scope (Lane 2 / Lane 3 backlog)

See `SESSION-HANDOFF.md` for the full Lane 2 + Lane 3 specs.

## Risk register

- **Toolbar refactor (1.3)** is the highest risk. Mitigation: keep
  the exact same `onClick` handlers — only relocate the JSX.
- **HI Topic Summary insertion (1.6)** must NOT mutate any base
  section's `id`, `type`, `content`, `marks`, `imageUrl`, `assetRef`,
  or `title` fields, or `assertBaseSectionsPreserved` will throw in
  the overlay engine. Mitigation: insert ENTIRELY NEW sections with
  fresh IDs; never edit existing fields.
- **Anxiety title rename (1.7)** mutates the `title` field on the
  Challenge section — this is fine in the post-validator (which runs
  before the overlay engine), but the rename must be idempotent and
  must run before `enforceSelfReflectionTopicAnchor` in the registry
  so reflection sees the final title.
- **EAL language detection (1.5)** must default to existing behaviour
  when `parseRequestedLanguage` cannot identify a language.
  Mitigation: preserve the existing fallback to Romanian; only add
  new branches.
