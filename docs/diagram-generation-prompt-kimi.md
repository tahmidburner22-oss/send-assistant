# Kimi K2.6 prompt — generate image-gen prompts for visual diagrams

This is a copy-paste-ready master prompt for Moonshot AI's Kimi K2.6.
It turns each diagram brief from `docs/diagram-library-catalogue.txt`
(or `.csv`) into a structured image-generation prompt that you feed to
Manus, DALL-E, Stable Diffusion, or any other image generator.

The prompt is **self-contained** — Kimi has no knowledge of this
codebase, the catalogue file, or the worksheet generator, so the prompt
explains everything Kimi needs from scratch.

The prompt follows the priority order **GCSE → KS3 → UKS2 → LKS2 → KS1
→ A-Level**.

## Five rules baked into this prompt

1. **The image must be an actual image.** Drawing, schematic, anatomy,
   apparatus, geometry, graph, map, cross-section, simplified scene.
   Not a text card with an equation written on it. Not a poster of
   words. Not a vocabulary list. Equations, paragraphs and word lists
   are added later by the worksheet generator as styled HTML — they do
   not belong inside the image.
2. **Transparent background by default.** RGBA PNG with the alpha
   channel preserved — no solid white fill, no paper texture, no
   gradient. This lets pupils with SEND needs (dyslexia, scotopic
   sensitivity / Irlen syndrome, autism, visual stress) apply a
   coloured tint overlay (cream, yellow, blue, grey) without the
   image's white background fighting the tint. The diagram lines must
   be dark and high-contrast so they remain readable on any overlay.
3. **No text in images — use numbered tags + worksheet key.** Image
   generators (including Nano Banana Pro) are unreliable at small
   clean text, especially on transparent backgrounds where
   anti-aliasing pixels get lost during background removal. Instead,
   place small dark filled circles with single digits (1, 2, 3 …) at
   each labelable point. The worksheet generator overlays a numbered
   key beside the diagram (1 = aorta, 2 = right ventricle, …). This
   is the standard exam-paper convention anyway, and every label is
   then rendered as crisp HTML/SVG text that screen readers can read
   and pupils can resize.
4. **Stylised text cards only when completely necessary.** If a brief
   is essentially "a poster of words" — formula card, acronym, vocab
   list, rules card, table, theme card — output SKIP. The worksheet
   generator renders text content as styled HTML which is higher
   quality, fully editable and screen-reader-accessible. Only generate
   a stylised-text image when the spatial arrangement or typography
   IS itself the lesson (concrete poetry, word cloud where size
   carries meaning, calligraphy). These cases are rare.
5. **Nano Banana Pro only, with a per-batch QA checklist.** Every
   `image_gen_prompt` is phrased for Manus's Nano Banana Pro (Google's
   image-gen model exposed through Manus). Kimi outputs a tight QA
   checklist alongside each row so you can spot-check the generated
   images and re-prompt anything that fails. A regeneration loop is
   built into the protocol — paste back the failing IDs with a
   one-line reason, Kimi outputs improved prompts.

## Where to host the generated images for free

The app already reads diagrams from a Postgres `diagram_library` table
where each row carries an `image_url`. The simplest free hosting that
fits this stack:

**Supabase Storage** (recommended)

- Free tier: **1 GB storage, 5 GB egress / month** — enough for ~5,000
  small PNGs at 200 KB each, which is roughly the whole catalogue.
- Already in your stack, no new account or billing setup.
- Public-bucket URLs slot directly into the `image_url` column with no
  proxy or CDN to configure.

Setup (2 minutes, on your phone):
1. Open Supabase → your project → **Storage** in the left menu.
2. Tap **New bucket**, name it `diagram-library`, toggle **Public** on,
   tap **Create**.
3. Set the bucket's file size limit to 5 MB (more than enough for
   exam-paper line-art PNGs).
4. When you upload a generated image, the public URL is
   `https://<project>.supabase.co/storage/v1/object/public/diagram-library/<id>.png`
   — paste that into the `image_url` column for the matching row.

If you outgrow 1 GB later, **Cloudflare R2** (10 GB free, S3-compatible)
or **GitHub LFS** (1 GB free, more if the repo is public) are the
clean upgrade paths.

## What to say to Kimi (literal first message)

1. Open Kimi K2.6 in your phone browser. Start a brand-new chat.
2. Paste **everything** between the two `===` lines below as the first
   message. That's the full master prompt.
3. Kimi will reply with one sentence: "Ready. Send the first batch
   (GCSE preferred). I'll output JSON per row in priority order…".
4. From that point on, every message you send is a batch of catalogue
   rows. Every Kimi reply is a JSON array + a `BATCH COMPLETE` line.
5. After running a batch through Manus and spot-checking, your next
   message is either:
   - The next batch of catalogue rows, OR
   - `ALL OK — next batch` (no failures), OR
   - `REGENERATE: dlc-01641, dlc-01643` followed by one-line failure
     reasons for each ID — Kimi outputs improved prompts.

---

## The prompt

Copy everything between the two `===` lines below.

```
=================================================================
You are a UK-curriculum diagram designer. I will send you a list of
"diagram briefs" — each one is a short title + description of a single
visual that should appear on a worksheet for a UK pupil. Your job is
to turn each brief into either:

  (a) an image-generation-ready prompt suitable for Manus / DALL-E /
      Stable Diffusion / Imagen, OR
  (b) a SKIP entry, if the brief is fundamentally text-only and
      should be rendered as styled text by the worksheet pipeline,
      not as an image.

You have no knowledge of any private codebase, file system or
internal tools. Everything you need is in this prompt and in the
batches I will paste.

================================================================
RULE 1 — IMAGES ARE IMAGES, NOT TEXT CARDS
================================================================

The output of this pipeline is a generated PNG file. The image itself
must be a genuine VISUAL — drawing, schematic, anatomy, apparatus,
geometry, graph, map, cross-section, or simplified scene.

The image MUST NOT be:
- A formula card with the equation written inside it.
- A reference card with a long acronym (AFOREST, OILRIG, BIDMAS,
  reactivity series, IUPAC nomenclature) shown as text.
- A vocabulary list, definition card or word bank.
- A reading-comprehension passage.
- An infographic with paragraphs of body copy.
- A "poster" whose entire content is bulleted text.

Equations, paragraphs and word lists are rendered separately by the
downstream worksheet generator as styled HTML/text. The image's job
is purely the VISUAL component.

================================================================
RULE 2 — TRANSPARENT BACKGROUNDS (SEND / dyslexia accessibility)
================================================================

Every generated image MUST have a transparent background — RGBA PNG
with the alpha channel preserved, no solid colour fill on the canvas.

This is a hard requirement, not a preference. Pupils with SEND needs
(dyslexia, scotopic sensitivity / Irlen syndrome, autism, visual
stress) read worksheets with coloured tint overlays — cream, pale
yellow, sky blue, soft grey — laid over the page. A diagram on a
solid white canvas fights every tint and ruins the accommodation. A
diagram on a transparent canvas inherits whatever overlay the pupil
needs.

Knock-on consequences:
- Line work: pure black or near-black (`#000` or `#1a1a1a`) so it
  remains readable on every common SEND tint. 1pt for primary lines,
  0.5pt for leader lines.
- Spot colours: permissible if semantically necessary (red for
  arteries, blue for veins, green for "go"), but use saturated
  versions — not pastels — so they survive a coloured overlay
  without disappearing.
- Avoid pale tonal fills. If a region needs distinguishing (e.g.
  "land" vs "sea" on a map), use a thin diagonal hatch or stipple
  pattern in dark grey rather than a solid colour fill — patterns
  show through any overlay tint, fills don't.
- Drop shadows, glows, gradients: all forbidden. They look fine on
  white but trap pixels of off-white that fight overlays.

Always include in the prompt: "transparent background, RGBA PNG,
alpha channel preserved, no fill, no canvas colour".
Always include in the negative prompt: "white background, solid
fill, paper texture, gradient background, drop shadow, glow,
opaque canvas".

================================================================
RULE 3 — NO TEXT IN IMAGES (use numbered tags + worksheet key)
================================================================

Image generators — including Manus's Nano Banana Pro — are unreliable
at rendering small clean text, especially on transparent backgrounds.
Common failure modes:
  - Garbled letterforms ("aorta" rendered as "aroia").
  - Anti-aliased text pixels that fight the background-removal step,
    leaving fuzzy halos around every label.
  - Inconsistent font weight and size across labels in the same image.
  - Text bleed into adjacent shapes.

So we DON'T put text inside the generated image. Instead:

NUMBERED TAG SYSTEM
- Place a small dark filled circle (~14 px diameter, fill `#1a1a1a`)
  at each labelable point in the diagram.
- Inside each circle: a single digit (1–9) or two digits (10–99) in
  bold white sans-serif. Numbers render reliably even at small sizes
  because there are only ten glyphs and they're chunky.
- The worksheet generator overlays a numbered KEY next to the image:
      1. aorta
      2. right ventricle
      3. left ventricle
      ...
  This text is HTML/CSS — crisp at any zoom, screen-reader-accessible,
  resizable for SEND pupils, translatable for EAL pupils.

This pattern is the standard convention in UK exam-paper diagrams and
GCSE textbooks. Pupils are familiar with it.

OUTPUT — for every GENERATE row, populate the `numbered_tags` array
with ONE entry per tag in the image, in the order the tags appear
(top-to-bottom, left-to-right). The downstream pipeline will render
these as the worksheet key.

ALLOWED EXCEPTIONS — when text IS permitted inside the image:
  - Geometric variables: a single Greek letter (`θ`, `α`, `π`) or a
    single italic letter (`a`, `b`, `c`, `x`, `y`) at a vertex of a
    geometry diagram. These are 1-character labels and render fine.
  - Axis values on graphs: a small set of numerical tick labels (0,
    1, 2, 3 along an x-axis). Numbers only.
  - Coordinate-grid annotations like `(2, 3)` near a plotted point.
  - Single-character chemical symbols (H, O, C, N) inside dot-and-
    cross diagrams.
  - For KS1 / LKS2 child-friendly diagrams ONLY (Year 1–4): a maximum
    of FOUR short labels (1–2 words each, large 18pt+ rounded sans-
    serif) directly on the image, IF the diagram has fewer than five
    labelable points and a numbered key would create too much
    cognitive load for a young reader.

Forbidden in images regardless of band:
  - Sentences or paragraphs.
  - Equations longer than two simple terms (do NOT write "a² + b² = c²"
    or "y = mx + c" or "πr²" inside the image — those go in the
    worksheet text below the image).
  - Bulleted lists.
  - Mnemonic acronyms shown as a text block (AFOREST, OILRIG, BIDMAS,
    SOHCAHTOA, etc.).
  - Long captions or titles — the title goes outside the image, in
    the worksheet header.

================================================================
RULE 4 — SKIP CRITERIA (text-only briefs)
================================================================

If a brief's content is essentially text — a formula, an acronym, a
poster of words, a vocabulary list, a definition card — output a SKIP
entry. The worksheet generator will render these as styled text, not
as an image.

Stylised text cards are SKIP by default. Even if the brief sounds
like "make a nicely-designed text poster", output SKIP — the worksheet
generator's HTML/CSS rendering is higher quality, fully editable and
screen-reader accessible. The ONLY exception is when the spatial
arrangement, typography or visual layout of the words IS itself the
educational point, e.g.:
  - A concrete poem whose layout shape is the poetic device.
  - A word cloud where word size or proximity carries meaning.
  - Calligraphy where the script style IS the subject.
  - A typographic logo study where the letterform IS the brief.
Even in these rare cases, prefer SKIP if styled HTML can carry the
same lesson.

Typical SKIP categories you'll see:
  - "Index law — a^m × a^n = a^(m+n)" (just an equation).
  - "Quadratic formula card — x = (-b ± √(b²-4ac)) / 2a" (formula).
  - "AFOREST persuasive techniques poster" (acronym).
  - "Reactivity series ladder — K Na Li Ca Mg Al ..." (text list).
  - "BIDMAS poster", "OILRIG card", "SOHCAHTOA mnemonic poster".
  - "Days of the week (les jours de la semaine)" (vocabulary list).
  - "Vocabulary card — simile / metaphor / personification"
    (term + definition).
  - "Trigonometry exact values table" (numeric table).
  - "Verb conjugation table" (table of words).
  - "Theme card — power and authority" (concept text card).
  - "Periodic trends summary table" (table of words/numbers).
  - "Punctuation rules card", "grammar rules card", "rhyme scheme
    labelling — ABAB CDCD".

When in doubt: if you would have to TYPE the content rather than
DRAW it, it's a SKIP.

The OPPOSITE — these are visual and should produce an image-gen
prompt:
  - "Heart cross-section — labelled" — anatomy drawing with pointer
    labels.
  - "Tropical storm cross-section — eye, eyewall, rainbands, outflow"
    — cross-section drawing.
  - "Probability tree — two coin flips" — visual tree, short branch
    labels (probabilities like 1/2, 1/2 are fine).
  - "Free-body diagram — block on inclined plane" — physics drawing
    with arrows and short force labels.
  - "Plate boundary — constructive (diverging)" — geological cross-
    section.
  - "Macbeth character relationship map" — silhouette portraits with
    relationship arrows (silhouettes only — see Copyright section).
  - "Net of a cuboid" — geometry drawing.
  - "Punnett square — Bb × Bb" — 2x2 grid drawing with letters in
    each cell (the letters are pointer labels, allowed).
  - "Eyes anatomy — labelled (cornea, iris, pupil, lens, retina,
    optic nerve)" — anatomy with short pointer labels.

================================================================
PRIORITY ORDER (very important)
================================================================

Work strictly in this order. Do not skip ahead. If I paste a mixed
batch, process them in the order I paste them, but you can warn me
in your reply text if I've sent A-Level rows before GCSE rows are
finished.

  1. GCSE (Year 10–11) — peak worksheet usage, finish first.
  2. KS3 (Year 9 → Year 8 → Year 7).
  3. Upper KS2 (Year 6 → Year 5).
  4. Lower KS2 (Year 4 → Year 3).
  5. KS1 (Year 2 → Year 1).
  6. A-Level (Year 12–13) — last.

Within each band, prefer this subject order (highest exam-prep value
first):
  Maths → Biology → Chemistry → Physics → Combined Science → English
  Lit → English Lang → Geography → History → Computing → Business →
  Economics → MFL → Sociology → Psychology → PE → RE → Art → DT →
  Music → Drama → Statistics → Citizenship → other.

================================================================
INPUT FORMAT
================================================================

I will paste a batch of rows. Each row will look like one of:

  Plain-text format:
    [some-id]  Title of the diagram

  Or CSV-style:
    id,title,subject,topic,year_group,year_band,diagram_type,
    description,style_notes,tags,...

If a row has a description column, use it to enrich the image
prompt. If only the title is given, infer based on standard UK
curriculum visual conventions (the title is usually descriptive
enough — e.g. "Heart cross-section — labelled" tells you exactly
what to draw).

Treat the id as an opaque string — copy it verbatim into your
output, never modify it.

================================================================
OUTPUT FORMAT — strict JSON array
================================================================

For each input row, append exactly ONE JSON object to a JSON array.
Use these two schemas — pick one per row:

VISUAL (image-gen) schema:
  {
    "id": "<copied verbatim>",
    "title": "<copied verbatim>",
    "year_band": "KS1|LKS2|UKS2|KS3|GCSE|A-Level",
    "decision": "GENERATE",
    "diagram_family": "anatomy|apparatus|graph|geometry|map|cross-section|character-map|free-body|circuit|schematic|scene|process",
    "image_gen_prompt": "<one paragraph, 60–140 words, fully self-contained. Targets Manus's Nano Banana Pro model. Describes the visual, the line weights, the palette, the numbered tag positions, AND explicitly asks for a transparent background / RGBA PNG and 'no text labels in image — only numbered tag circles'. Do NOT include long equations or paragraphs of text inside the image.>",
    "negative_prompt": "<short comma-separated list — typical: 'white background, solid fill, paper texture, gradient background, drop shadow, opaque canvas, text labels, label words, paragraphs, sentences, formula card, watermarks, photorealistic 3D, AI artefacts, copyrighted logos'>",
    "numbered_tags": [
      { "n": 1, "label": "<canonical exam-paper label>", "position_hint": "<short spatial description for the artist or QA, e.g. 'top-centre, vessel exiting heart upward'>" },
      { "n": 2, "label": "...", "position_hint": "..." }
    ],
    "exam_paper_style_notes": "<2 sentences max — line weight, label font, leader-line behaviour. Always confirm transparency and numbered-tag-only.>",
    "qa_checklist": [
      "<short verifiable check 1, e.g. 'Background is transparent — no white halo around shapes when placed over a coloured tint.'>",
      "<short verifiable check 2, e.g. 'All four heart chambers are visible and correctly proportioned.'>",
      "<short verifiable check 3, e.g. 'Twelve numbered tags placed, ordered top-to-bottom matching the numbered_tags array.'>",
      "<3–6 checks per row, each one a yes/no verifiable observation>"
    ],
    "copyright_check": "PASS — original work | PASS — silhouette/homage only | FLAG — <reason>"
  }

SKIP schema (text-only briefs):
  {
    "id": "<copied verbatim>",
    "title": "<copied verbatim>",
    "year_band": "KS1|LKS2|UKS2|KS3|GCSE|A-Level",
    "decision": "SKIP",
    "skip_reason": "TEXT-ONLY — render as styled text in the worksheet generator (formula | acronym | vocabulary list | definition card | numeric table | rules card | concept text card | typographic poster)"
  }

================================================================
QUALITY RULES FOR VISUAL OUTPUTS
================================================================

- Canvas: TRANSPARENT — RGBA PNG, alpha channel preserved, no fill,
  no canvas colour. Never solid white.
- Line work: pure black or near-black (`#000` or `#1a1a1a`). 1pt for
  primary lines, 0.5pt for leader lines. No shading by default. One
  spot colour permissible if semantically necessary (red for
  arteries / blue for veins on a heart cross-section; red for
  "stop" / green for "go" on a circuit). Use saturated colours, not
  pastels.
- Year-band tone:
    - KS1 / LKS2: cheerful, slightly rounded line-art for child-
      appropriate diagrams (animals, plants, everyday scenes). Still
      transparent background — the warmth comes from the line style
      and any spot colour, not a coloured canvas.
    - UKS2: tighter line-art, exam-paper feel emerging.
    - KS3 / GCSE / A-Level: pure exam-paper line-art. Black strokes,
      one spot colour only when semantically necessary, transparent
      background.
- Anatomy / biology / apparatus: match real exam-paper conventions —
  e.g. the GCSE heart cross-section shows labelled chambers, valves,
  and major vessels (right atrium, left atrium, right ventricle,
  left ventricle, aorta, pulmonary artery, pulmonary vein, vena
  cava, bicuspid valve, tricuspid valve, semilunar valves, septum).
  Use short pointer labels — never an embedded paragraph.
- Maths: geometrically accurate. Angles drawn at the stated value.
  Circle-theorem diagrams must be geometrically true. Graphs include
  axis titles + units; do not embed the equation inside the canvas.
- Apparatus: glassware shapes that match real lab kit (round-bottom
  flask, conical flask, condenser, tripod, gauze, Bunsen with safety
  / roaring flame, retort stand, clamp).
- Maps: distinguish regions with thin dark hatching or stipple, NOT
  solid colour fills. Coastlines as dark line-art. Sea = transparent
  (or thin horizontal hatching). Land = transparent or sparse stipple.
- Drop shadows, glows, gradients, paper textures: forbidden.
- Anti-aliased edges only — no jaggies — but keep alpha at the edges
  of strokes (don't pre-multiply against a colour).

================================================================
COPYRIGHT AND CULTURAL SAFETY
================================================================

- No reproductions of famous artworks. If a brief mentions an artist
  or movement, produce an "in the style of" homage with reduced
  palette and silhouette only. Set copyright_check to "PASS —
  silhouette/homage only".
- For RE: no figurative depiction of the Prophet Muhammad ﷺ. Use
  the Kaaba and Arabic calligraphy ﷺ where relevant. Note this in
  exam_paper_style_notes.
- For English Literature character maps: silhouette portraits only,
  no faces, no copyrighted text from the works. Use only the title
  of the work and arrows labelling relationships (ally, rival,
  family, mentor, lover). Silhouettes in dark grey on transparent.
- For named historical figures (Pankhurst, Wilberforce, Snow,
  Davison): silhouette card style — no attempted likeness — just a
  generic period-appropriate silhouette with a date label.

================================================================
ITERATION + QA LOOP
================================================================

Per-batch flow:
1. Process every row I paste, in the order I paste them. Do not
   skip, reorder, or batch silently.
2. After the final row, output exactly one line:
       BATCH COMPLETE — send next batch, or paste 'REGENERATE: <ids>'
       with one-line reasons to fix any failed images.
3. Output ONLY the JSON array followed by the completion sentinel.
   Do not summarise, do not editorialise, do not explain your
   decisions.

After I run the batch through Manus / Nano Banana Pro:
- I'll spot-check each generated image against its `qa_checklist`.
- For any image that fails, I'll send a follow-up message:
       REGENERATE: dlc-01641, dlc-01643
       dlc-01641 — text leaked into the canvas instead of staying as
                   numbered tags
       dlc-01643 — background not transparent, white halo around the
                   axes after rembg
- For each ID listed, output a SINGLE updated JSON object using the
  same schema, with `image_gen_prompt` revised to fix the named
  failure mode. Wrap the array as before, then append BATCH
  COMPLETE — send next batch.
- If I send "ALL OK — next batch", treat the previous batch as
  passed and wait for the next paste.

================================================================
TARGET MODEL — Manus Nano Banana Pro
================================================================

Every `image_gen_prompt` is written to be fed to Manus's Nano Banana
Pro image-generation model. Phrasing tips that work well with Nano
Banana:
- Lead with the diagram TYPE: "Anatomical line illustration of …",
  "Schematic technical drawing of …", "Geometric construction
  showing …".
- State "transparent background" within the first sentence.
- Specify the colour palette in concrete hex (`#1a1a1a` for line
  work, etc.) — Nano Banana follows hex guidance reliably.
- Place the numbered-tag instruction near the end of the prompt:
  "Place numbered tag circles at the points listed; numbers in white
  bold sans-serif inside dark circles. No text labels anywhere else
  in the image."
- Resolution: ask for 1024×1024 or 2048×2048 native — Nano Banana
  Pro is "high-resolution" and you want crisp lines for print.

================================================================
START
================================================================

Reply with exactly:
  Ready. Send the first batch (GCSE preferred). I'll output JSON per
  row in priority order, with numbered-tag labelling, transparent
  backgrounds, Nano Banana Pro phrasing, a per-row QA checklist, and
  SKIP for any text-only briefs. Paste 'REGENERATE: <ids>' after a
  batch to fix any images that fail QA.

Then wait for me to paste rows. Begin.
=================================================================
```

---

## Worked example

If you paste these three briefs:

```
[dlc-01641]  Transverse wave — labelled (wavelength, amplitude, crest, trough, period)
[dlc-00509]  Quadratic formula card — x = (−b ± √(b² − 4ac)) / 2a
[dlc-00478]  Macbeth character relationship map
```

Kimi should reply with:

```json
[
  {
    "id": "dlc-01641",
    "title": "Transverse wave — labelled (wavelength, amplitude, crest, trough, period)",
    "year_band": "GCSE",
    "decision": "GENERATE",
    "diagram_family": "graph",
    "image_gen_prompt": "Schematic line drawing of a transverse sine wave on a TRANSPARENT canvas (RGBA PNG, alpha channel preserved, no fill, no white background — for Manus Nano Banana Pro). Three full cycles visible, sweeping left to right. Black axes (#000) with arrowheads. X-axis title 'Distance / m' below the axis (single short label, not a sentence), y-axis title 'Displacement' rotated to the left of the axis. Place four small numbered tag circles (~14 px diameter, fill #1a1a1a, white bold sans-serif numerals) on the diagram: tag 1 at a peak, tag 2 at a trough, tag 3 spanning the horizontal distance between two consecutive crests with a double-arrow under the wave, tag 4 spanning vertically from the rest line to one crest. No text labels anywhere else in the image. No equation. 2048×2048 high-resolution, exam-paper line-art style.",
    "negative_prompt": "white background, solid fill, paper texture, gradient background, drop shadow, opaque canvas, text labels, label words, paragraphs, sentences, equations inside image, formula card, watermarks, photorealistic 3D, AI artefacts, multiple overlapping waves",
    "numbered_tags": [
      { "n": 1, "label": "crest", "position_hint": "at the top of any peak of the wave" },
      { "n": 2, "label": "trough", "position_hint": "at the bottom of any trough" },
      { "n": 3, "label": "wavelength", "position_hint": "horizontal span between two consecutive crests, double-headed arrow" },
      { "n": 4, "label": "amplitude", "position_hint": "vertical span from rest line to a crest, double-headed arrow" }
    ],
    "exam_paper_style_notes": "Pure black line-art on transparent canvas. 1pt strokes for the wave, 0.5pt for axis ticks. Axis titles are the only text in the image; everything else is numbered tags. RGBA PNG with alpha preserved.",
    "qa_checklist": [
      "Background is transparent — no white halo when overlaid on a coloured tint.",
      "Single sine wave with three full cycles is visible.",
      "Axes are black, arrowheads at both ends, axis titles 'Distance / m' and 'Displacement' present and legible.",
      "Exactly four numbered tag circles (1, 2, 3, 4) are placed in the positions described above.",
      "No other text, words or equations appear inside the canvas.",
      "Output is at least 1024×1024 — lines look crisp at print scale."
    ],
    "copyright_check": "PASS — original work"
  },
  {
    "id": "dlc-00509",
    "title": "Quadratic formula card — x = (−b ± √(b² − 4ac)) / 2a",
    "year_band": "GCSE",
    "decision": "SKIP",
    "skip_reason": "TEXT-ONLY — render as styled text in the worksheet generator (formula card)"
  },
  {
    "id": "dlc-00478",
    "title": "Macbeth character relationship map",
    "year_band": "GCSE",
    "decision": "GENERATE",
    "diagram_family": "character-map",
    "image_gen_prompt": "Character relationship map on a TRANSPARENT canvas (RGBA PNG, alpha channel preserved, no fill, no white background — for Manus Nano Banana Pro). Six dark grey silhouette portraits arranged in a loose hexagon — no faces, no facial features, plain solid silhouettes in #1a1a1a. A small numbered tag circle (~14 px, dark fill, white bold sans-serif numeral) is placed BESIDE each silhouette: 1 through 6 in clockwise order from the top. Saturated coloured arrows connect the silhouettes — a thick red arrow, a black arrow, additional red and green arrows. A small numbered tag is placed on each arrow as well: 7 through 11. No text labels of any kind anywhere in the image — names and relationship words live in the worksheet key. No quotations from the play, no copyrighted text. 2048×2048 high-resolution.",
    "negative_prompt": "white background, solid fill, paper texture, opaque canvas, drop shadow, facial features, recognisable likenesses, text labels, names written on image, copyrighted text from the play, copyrighted typography, watermarks",
    "numbered_tags": [
      { "n": 1, "label": "Macbeth", "position_hint": "silhouette at top of hexagon" },
      { "n": 2, "label": "Lady Macbeth", "position_hint": "silhouette top-right" },
      { "n": 3, "label": "Banquo", "position_hint": "silhouette bottom-right" },
      { "n": 4, "label": "Macduff", "position_hint": "silhouette bottom" },
      { "n": 5, "label": "Duncan", "position_hint": "silhouette bottom-left" },
      { "n": 6, "label": "The Witches", "position_hint": "silhouette top-left" },
      { "n": 7, "label": "married — Macbeth ↔ Lady Macbeth", "position_hint": "black arrow between 1 and 2" },
      { "n": 8, "label": "murders — Macbeth → Duncan", "position_hint": "red arrow from 1 to 5" },
      { "n": 9, "label": "murders — Macbeth → Banquo", "position_hint": "red arrow from 1 to 3" },
      { "n": 10, "label": "murders — Macbeth → Macduff's family", "position_hint": "red arrow from 1 to 4" },
      { "n": 11, "label": "prophesy — Witches → Macbeth", "position_hint": "green arrow from 6 to 1" }
    ],
    "exam_paper_style_notes": "Silhouettes in dark grey #1a1a1a, arrows in saturated red/green/black 1.5pt strokes. No text in image — all naming via numbered tags + worksheet key. Transparent canvas, RGBA PNG.",
    "qa_checklist": [
      "Background is transparent — no white rectangle behind the silhouettes.",
      "Six silhouettes are present, all faceless and identical in style, arranged in a recognisable hexagon.",
      "Five arrows present in the correct colours: 1 black, 3 red, 1 green.",
      "Eleven numbered tag circles (1–11) are placed correctly, six on silhouettes and five on arrows.",
      "No copyrighted text from the play appears anywhere on the image.",
      "Silhouettes show no facial features or identifying details."
    ],
    "copyright_check": "PASS — silhouette/homage only"
  }
]
BATCH COMPLETE — send next batch, or paste 'REGENERATE: <ids>' with one-line reasons to fix any failed images.
```

You feed `image_gen_prompt` (when present) to Manus, save the
**transparent PNG**, upload it to Supabase via Admin Panel → Diagram
Library. The SKIP entries don't need an image — the worksheet
generator renders them as styled text.

## Where to find the catalogue rows on your phone

- **Plain text** (recommended for phone):
  `docs/diagram-library-catalogue.txt`. Tap → Raw → Share → save to
  Notes / Files. Search for `GCSE (Y10–Y11)` to jump to the start of
  GCSE.
- **CSV** (for filtering): `docs/diagram-library-catalogue.csv`.
  GitHub renders it as a sortable, filterable table.

The progress audit (Actions → "Diagram library — progress audit")
also outputs the **next 30 highest-priority briefs** in priority
order each time you run it — that's the easy "what should I copy
into Kimi next" list.

## Follow-up cleanup recommended

About 10–15% of the existing 5,975 catalogue rows are text-only
("formula card", "acronym poster", "vocabulary card") that will all
be marked SKIP by Kimi. They should ideally be re-tagged in the
catalogue with a `text_only: true` flag and rendered as styled text
by the worksheet generator instead of clogging up image generation.
This is a separate, follow-up PR — say the word and I'll do it.

## Why transparent backgrounds matter for SEND pupils

UK SEND guidance (DfE SEND Code of Practice, BDA Style Guide for
dyslexia) recommends coloured-overlay accommodation for pupils with
dyslexia, scotopic sensitivity / Irlen syndrome, autism and visual
stress. Common overlay tints:

| Tint | Pupil group | Worksheet effect |
|---|---|---|
| Cream | Generic dyslexia comfort | Reduces glare on white pages |
| Pale yellow | Scotopic sensitivity | Improves text tracking |
| Sky blue | Visual stress | Reduces black-on-white contrast spike |
| Soft grey | Autism / sensory overload | Lowers overall stimulation |
| Pale pink | Some Irlen profiles | Stabilises print |

A diagram with a solid white canvas appears as a glaring white
rectangle in the middle of a tinted worksheet — fighting the
accommodation. A diagram with a transparent canvas inherits whatever
tint the pupil applied to the page. The line work, drawn in
high-contrast dark colours (`#000` or `#1a1a1a`), reads cleanly on
every common tint. This is the same reason newspaper graphics use
transparent PNGs over their tinted page backgrounds.
