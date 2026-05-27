# SEND Diagram Style Guide

> Single source of truth for every visual produced by the diagram pipeline.
> Imported by both the SVG renderers (`renderers/`) and the AI prompt
> builder (`prompt.mjs`). Do not change values here without updating both
> code paths and the regression fixtures.

The pipeline serves children with Special Educational Needs and
Disabilities (SEND), including dyslexia, ADHD, autism spectrum, visual
processing difficulties, and working-memory deficits. Every visual
constraint below is chosen against published SEND visual-aid research and
common UK classroom practice. The bar is "match or beat Twinkl on
clarity; surpass on accessibility".

---

## Hard rules (every diagram, no exceptions)

1. **Pure white background.** Hex `#FFFFFF`. No gradients, no off-white,
   no paper texture, no decorative borders.
2. **High-contrast outlines.** Every shape and labelled feature has a
   solid black outline at minimum 2px equivalent (≥0.4% of the shorter
   edge). No grey outlines. No double outlines.
3. **One concept per image.** No "scene" with multiple unrelated objects.
   If the brief asks for two things side by side, each is centred in its
   own column with whitespace separating them.
4. **No clutter.** No background detail, no shadows, no reflections, no
   ambient particles, no decorative flourishes, no signatures, no
   watermarks, no logos, no captions, no titles inside the image.
5. **Print-safe.** The diagram must remain legible when printed in
   greyscale. We test with a desaturate pass in QA.
6. **Minimum text.** No descriptive text inside the image. The only text
   permitted is short numeric or symbolic labels strictly required by
   the curriculum brief (e.g. "60", "H₂O", "N", "S", "+", "−"). Any
   text uses a sans-serif font similar in weight to OpenDyslexic or
   Arial. Never a script or italic font.

## Palette

A small, calm, high-contrast palette. Ordered by frequency of use.

| Role            | Hex       | Notes                                                |
| --------------- | --------- | ---------------------------------------------------- |
| Outline / text  | `#1A1A1A` | Off-true-black for softer print contrast             |
| Primary fill    | `#E63946` | Used for "counters", attention-pulling features      |
| Secondary fill  | `#1D7BD9` | Cool counterpart, used for "B" group, water, sky     |
| Tertiary fill   | `#2A9D8F` | Plant / earth / "answer" colour                      |
| Accent yellow   | `#F4C430` | Used sparingly, for a single highlight per image     |
| Neutral fill    | `#E9ECEF` | Grid backgrounds, subtle table fills                 |
| Background      | `#FFFFFF` | Always                                               |

Maximum **four fill colours per image** plus white. No gradients. No
opacity tricks except a single 10% neutral fill for grid backgrounds.

## Layout

- **Centred composition.** Subject occupies 60–75% of the image area.
- **Generous whitespace.** Minimum 8% padding from every edge.
- **Predictable framing across a series.** All "ten frame" diagrams use
  identical proportions, identical cell size, identical counter colour.
  Children with autism rely on this predictability — Twinkl breaks it
  often, we do not.
- **Reading direction.** Left-to-right, top-to-bottom.
- **Equal cells.** Anything grid-shaped uses pixel-perfect equal cells.

## Typography (when text is unavoidable)

- Family: `system-ui, "Atkinson Hyperlegible", "Open Sans", Arial, sans-serif`.
- Weight: 600 (semi-bold) for any number or symbol.
- Size: minimum 4% of the shorter image edge. Numbers in a ten frame
  are typically ~6%.
- Spacing: letter-spacing 0.02em; never condensed.
- Never italic. Never all-caps for words longer than three letters.

## Image format

- 1024 × 1024 px (square) by default.
- 1200 × 800 px for landscape diagrams (number lines, timelines, scales).
- PNG with alpha disabled (background must be white pixels, not
  transparency, so it is consistent when embedded in a worksheet).
- Saved at sRGB, 72 DPI (display) — assets are upscaled by browser/print.

## Subject-specific reinforcements

These layer **on top of** the hard rules.

### Mathematics (counting, place value, fractions)

- Counters / cubes are perfect circles or perfect squares, identical
  size within an image, identical colour within an image.
- Number lines have **equal tick spacing**, full-tick labels at integers,
  half-ticks unlabelled. Arrow markers are filled triangles, never
  outlined arrowheads.
- Fraction bars are subdivided with vertical lines of equal weight; the
  shaded portion uses the primary fill, unshaded is white.

### Science (cells, anatomy, circuits)

- Labelled features use straight black leader lines from the feature
  to a label point outside the subject, never crossing other lines.
- Internal anatomy is rendered with single-weight outlines plus one
  flat fill per organelle/region. No gradient shading.
- Circuit diagrams use BS standard symbols — never US symbols.

### English (phoneme cards, letter formation)

- Letters use a primary-school print font (Sassoon-style if available,
  otherwise the system fallback). Never cursive unless brief says so.
- Letter formation diagrams show the start dot, the path arrow, and the
  letter outline only. No mascot, no rhyme, no decoration.

### Geography (OS map symbols, weather, biomes)

- OS symbols are exact reproductions of the Ordnance Survey 1:25 000 or
  1:50 000 symbol — no stylisation.
- Compass roses always have N at the top, eight-point.

### History (timelines, character cards, artefacts)

- Timelines are horizontal, equal year-spacing, single black baseline,
  filled black ticks. No decorative ribbons.

## What this means for the pipeline

- **Anything that can be drawn deterministically (SVG) must be drawn
  deterministically.** That includes ten frames, double ten frames,
  number lines, place-value charts, fraction bars, dice faces, simple
  Venn diagrams, bar models, factor tree skeletons, Carroll diagrams,
  base-10 (Dienes) blocks, hundred squares, clock faces.
- **Diagrams that need illustrative judgement (a labelled animal cell,
  a kingfisher, a Tudor house) go to the AI tier**, but always with the
  full style guide in the prompt and a vision-LLM compliance check
  against the catalogue brief.
- **No diagram ships without QA gating.** A pipeline that produces a
  Twinkl-quality output 90% of the time and a junk output 10% of the
  time is not acceptable for SEND classrooms — the rejected 10% must
  be rejected, not shipped.

## Why this style, in plain language

Children with SEND are not helped by "fun and busy". They are helped by
**predictable, calm, high-contrast, low-text** visuals where the
educational target is the loudest thing in the frame. Twinkl optimises
for shelf appeal; we optimise for cognitive load. Beating Twinkl means
fewer colours, less decoration, more whitespace, and the same diagram
looking the same every time it appears.
