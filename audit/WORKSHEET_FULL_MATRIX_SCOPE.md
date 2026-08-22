# Adaptly Full Worksheet Validation Matrix

**Purpose:** Define the release-blocking test coverage that must pass before feature implementation proceeds. The matrix treats **content strength, SEND adaptation fidelity, and page geometry** as co-equal quality gates.

## Product Scope

| Dimension | Current product scope | Test approach |
|---|---:|---|
| Advertised worksheet subjects | 19 | English, Mathematics, Science, Biology, Chemistry, Physics, History, Geography, Art & Design, Music, PE, Computing, Computer Science, Design & Technology, Religious Education, MFL, PSHE, Business Studies, Drama. |
| Primary subjects | 14 | Year 1 and Year 6 routing / content-policy checks; primary-ready rendered examples. |
| Secondary subjects | 18 | Year 7 and Year 10 routing / curriculum-profile checks; secondary-ready rendered examples. |
| Difficulty modes | 3 generally; 2 for 11+ | Validate subject-appropriate labels, learning demand and scaffold progression. |
| Reading-age options | 13 including year-matched | Test the full selector range, with boundary samples at age 6–7, 10–11, 14+, and 17+. |
| SEND profiles | 21 supported overlays/profiles | Include ASC plus each ASC sub-profile and every declared SEND adaptation. |
| Protected Maths corpus | 128 real templates | Test every template × every supported SEND overlay × every explicit reading-age setting: 32,256 combinations. |
| Dedicated Science/Humanities routes | Supported deterministic routes | Test every route × every supported SEND overlay × every explicit reading-age setting: 5,796 combinations. |

## Release Gates

| Gate | Required evidence | Failure treatment |
|---|---|---|
| Subject routing | Every advertised subject resolves to its own valid curriculum profile; no generic-Science fallback. | Repair mapping/profile, then rerun the full catalogue test. |
| Content safety | No answer leakage, internal prompt leakage, stray year group, foreign diagrams, duplicated word-bank entries, invalid MCQ answers, or missing core learning sequence. | Repair the validator or prompt contract; reproduce the failure in a regression test. |
| SEND fidelity | Each profile produces its declared visible support without changing protected academic demand or page count. | Repair overlay/prompt logic; test affected profile plus its high-risk neighbours. |
| Reading-age fidelity | Wording changes while task, numerical data, correct answer and curriculum demand remain stable. | Repair adaptation boundary; rerun all reading-age checks. |
| Print geometry | Required one- or two-page structure, no clipping, overlap, unwanted blank pages, content bleed, or unintentional colour-only meaning. | Repair renderer/CSS; re-render all affected families. |
| Teacher usability | Clear objective, worked model where required, visible answer space, manageable instructions, and no redundant labels. | Repair design/content policy; visual and accessibility regression required. |

## Execution Sequence

1. Run full code and current worksheet scrutiny suites; repair all failures.
2. Run all protected-layout exhaustive matrices and subject-catalogue routing assertions.
3. Add a full catalogue contract test that covers every subject × supported stage × difficulty × reading-age × SEND profile at the policy/prompt layer.
4. Generate representative worksheets for every subject and both stage bands where supported; render to PDF/PNG.
5. Inspect an intentionally challenging sample set, including dyslexia, ASC-sensory, SLCN, ADHD, MLD, dyspraxia, dyscalculia, PDA/ODD, high reading-age and low reading-age variants.
6. Require all automated gates and all visual-inspection gate decisions to pass. Any failure is repaired, covered by regression, and re-tested before the next phase.

## Latest execution outcome — 22 August 2026

| Gate group | Result | Final evidence |
|---|---|---|
| Code and worksheet scrutiny | Passed | `pnpm check`, final `pnpm vitest run --reporter=dot` (**46 files; 954 passed; 1 skipped**) and `node scripts/verify-worksheet-scrutiny.mjs` all passed. |
| Exhaustive protected matrices | Passed | The suite continues to enforce all **32,256** approved Maths Gold combinations and **5,796** dedicated Science/Humanities combinations. |
| Final PDF evidence | Passed | Ten regenerated PDFs are all A4 landscape. Maths Gold and Humanities are two pages; dedicated Science is one page. |
| Visual-inspection follow-up | Passed after repair | A lower-edge risk in Geography/Business was repaired, retested through the matrix and full suite, then rechecked in the final PDFs. ASC and visual-support cues are now concrete in dedicated Humanities layouts. |
| Outstanding scope boundary | Not a release blocker for current implemented routes | Bespoke primary Science remains intentionally limited to its curriculum-reviewed Plants, States of Matter and Electricity lessons; unsupported topics must continue on the generic, policy-governed route rather than being misrepresented as dedicated templates. |
