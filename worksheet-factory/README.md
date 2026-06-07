# Worksheet Factory

A clean, from-scratch generator that reproduces the **two base-canonical layouts**
(see `output/dyslexia-demo/`) **1:1** and swaps in per-topic content:

- **Landscape two-page spread** — mirror of `Quadratic-Simultaneous-Equations-Landscape-Base.pdf`
  - Page 1: header + note + Method strip + a stretched row of `[Common mistakes | Worked example | Visual aid]`
  - Page 2: all 8 questions in a 2×4 grid with difficulty pips + marks
- **Portrait booklet** — mirror of `Quadratic-Simultaneous-Equations-Base.pdf`
  - Intro page → one question per page (with optional "How to start" frame, x/y answer lines,
    method-reminder strip) → self-reflection page → teacher key

The HTML/CSS are kept byte-faithful to the originals so geometry, spacing and typography
are identical. **Only the content changes.**

## What's different from the originals

The original landscape sheet hard-coded one diagram (the line/parabola intersection graph).
Here the **visual aid is pluggable** via a small registry so every topic can supply its own:

| `intro.visual.type` | Diagram |
|---|---|
| `tiles` | Algebra tiles — collecting like terms (used by *Introduction to Algebra*) |
| `intersection` | Line crossing a quadratic (the original graph, now parameterised) |
| `grid` | Area / partition grid (e.g. expanding brackets) |
| `none` | Neutral placeholder |

Maths is authored with proper Unicode symbols (`× ÷ − ² ³ √ ≤ ≥ ≠ ± π ½ …`). A light
`mathify()` pass also supports robust exponents/indices (`x^2`, `x^{n+1}`) and subscripts
(`a_1`), rendered as real `<sup>`/`<sub>`.

## Usage

```bash
npm install                       # installs playwright
npx playwright install chromium   # downloads the browser
node build.mjs topics/introduction-to-algebra.json
# -> dist/Introduction-to-Algebra-Landscape-Base.pdf  (2-page spread)
# -> dist/Introduction-to-Algebra-Base.pdf            (portrait booklet)
```

To add a new topic, copy `topics/introduction-to-algebra.json`, change the content,
pick a `visual.type`, and run `build.mjs`.

## Topic JSON shape

```jsonc
{
  "meta":      { "title": "...", "slug": "...", ... },
  "landscape": { "intro": { header, subheader, note, visual, methodSteps,
                            commonMistakes, workedExample },
                 "questions": [ { number, marks, difficulty, content } ] },
  "booklet":   { "answerLabels": ["Answer:", ""],
                 "intro":  { header, subheader, nameLine, objective,
                             commonMistakes, methodSteps, workedExample },
                 "methodReminder": [...],
                 "questions": [ { number, marks, difficulty, content, frame? } ],
                 "selfReflection": { title, confidencePrompt, confidenceOptions, prompts },
                 "answers": { title, rows } }
}
```
