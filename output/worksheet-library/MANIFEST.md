# Worksheet Library — Build Manifest

> **Purpose:** This file tracks which base-canonical worksheet JSONs have been
> authored so that work can resume across multiple chat sessions.
> Each entry = one sub-topic × two variants (portrait booklet + landscape 2-page).
> Content matches AQA GCSE / UK National Curriculum.
> Y7–8 harder questions use problem-solving; Y9–11 use exam-style.
>
> **File naming:** `output/worksheet-library/maths/<slug>-booklet.json` and
> `output/worksheet-library/maths/<slug>-landscape.json`
>
> **Status key:** ✅ done | 🔲 pending

---

## KS3 / KS4 Maths Sub-Topics

| # | Sub-Topic | Slug | Stage | Year | Status |
|---|-----------|------|-------|------|--------|
| 1 | Place Value and Ordering Integers | place-value-ordering-integers | KS3 | 7 | ✅ |
| 2 | Fractions, Decimals and Percentages | fractions-decimals-percentages | KS3 | 7 | 🔲 |
| 3 | Indices and Standard Form | indices-standard-form | KS4 | 9–10 | 🔲 |
| 4 | Surds | surds | KS4 | 10–11 | 🔲 |
| 5 | Algebraic Expressions | algebraic-expressions | KS3 | 7–8 | ✅ |
| 6 | Solving Linear Equations | solving-linear-equations | KS3 | 8 | 🔲 |
| 7 | Linear Inequalities | linear-inequalities | KS4 | 9–10 | 🔲 |
| 8 | Sequences | sequences | KS3 | 7–8 | 🔲 |
| 9 | Straight-Line Graphs | straight-line-graphs | KS3/4 | 8–9 | 🔲 |
| 10 | Quadratic Equations | quadratic-equations | KS4 | 10–11 | ✅ |
| 11 | Simultaneous Equations | simultaneous-equations | KS4 | 10–11 | ✅ |
| 12 | Functions and Graphs | functions-graphs | KS4 | 10–11 | 🔲 |
| 13 | Fractions — Secondary | fractions-secondary | KS3 | 7–8 | 🔲 |
| 14 | Percentages | percentages | KS3/4 | 8–9 | 🔲 |
| 15 | Angles | angles | KS3 | 7–8 | 🔲 |
| 16 | Pythagoras' Theorem | pythagoras-theorem | KS4 | 9–10 | 🔲 |
| 17 | Trigonometry | trigonometry | KS4 | 10–11 | 🔲 |
| 18 | Area and Perimeter | area-perimeter | KS3 | 7–8 | 🔲 |
| 19 | Volume and Surface Area | volume-surface-area | KS3/4 | 8–9 | 🔲 |
| 20 | Transformations | transformations | KS3/4 | 8–9 | 🔲 |
| 21 | Vectors | vectors | KS4 | 10–11 | 🔲 |
| 22 | Probability | probability | KS3/4 | 8–9 | 🔲 |
| 23 | Statistics | statistics | KS3 | 7–8 | 🔲 |
| 24 | Ratio | ratio | KS3/4 | 8–9 | 🔲 |
| 25 | Proportion | proportion | KS3/4 | 8–9 | 🔲 |

---

## How to Resume

1. Open a new chat with Kiro on this repo.
2. Say: "Continue building the worksheet library from the manifest."
3. Kiro reads this file, finds the next 🔲 entries, authors the JSONs, pushes, and updates this manifest to ✅.

---

## Notes

- Entries 10 + 11 (Quadratic Equations, Simultaneous Equations) are done — those are the originals in `output/dyslexia-demo/`.
- Each JSON follows the exact structure of `worksheet.base.json` (portrait) and `worksheet-landscape.base.json` (landscape).
- Worked examples always follow the method steps explicitly (Step 1 → Step N).
- Landscape includes a visual aid where appropriate.
- Portrait: intro page + 8 questions (one per page, ascending difficulty) + self-reflection + teacher key.
- Landscape: intro page (method + mistakes + worked example + visual) + questions page (2-col grid).
