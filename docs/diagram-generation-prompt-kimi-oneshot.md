# Kimi K2.6 — one-shot 500-batch prompt (multi-renderer)

This is the recommended prompt for power users who want to process the
catalogue fast, accurately, and almost entirely for free.

It is a **one-shot prompt** — paste it once together with up to **500
catalogue rows** at the bottom, send to Kimi K2.6, and Kimi replies with:

1. **A live, mobile-friendly viewer URL** showing all 500 entries
   *with the maths/geometry/graphs already rendered inline as SVG* —
   you spot-check by scrolling, no separate generator step needed for
   the deterministic ones.
2. **A downloadable zip** containing the SVG sources, Mermaid sources,
   Nano-Banana prompts, structured JSON and a renderer script.

## Why the prompt routes every row through one of three renderers

Image-gen models like Manus's Nano Banana Pro are **excellent at
illustrative content** (anatomy, apparatus, character silhouettes,
scenes) but **terrible at three things you saw fail**:

1. **Precise arrow placement** — they don't actually understand that a
   leader line should end at "the radius" of a circle.
2. **Mathematical accuracy** — angles drawn at the wrong value, parabolas
   that don't match the equation, circle theorems that aren't
   geometrically true.
3. **Crisp small text** — what you fixed earlier with numbered tags.

The fix is to use **the right tool per diagram type**:

| Diagram family | Renderer | Why |
|---|---|---|
| Graphs (sin x, parabolas, scatter, histograms, motion graphs) | **SVG** | 100% mathematically accurate, vector-perfect, free, instant |
| Geometry, circle theorems, transformations, vectors, Punnett squares, dot-and-cross | **SVG** | Geometric truth is computable |
| Probability trees, flowcharts, mind-maps, network diagrams, decision trees, OSI / TCP-IP, CPU architecture | **Mermaid** | One-line declarative source, perfect spacing, free |
| Free-body diagrams, circuits | **SVG** | Component positions are deterministic |
| Periodic table, reactivity series, EM spectrum strip | **SVG** | Static templates, zero ambiguity |
| Anatomy, apparatus, geological cross-sections, character maps, ecosystems, scenes, art-history homages | **Nano Banana Pro** | Genuinely needs illustrative style — no other tool does anatomy / silhouette portraits / weathered geological strata |
| Formula cards, AFOREST posters, vocabulary lists, rules cards | **SKIP** | Already rendered by the worksheet generator as styled HTML |

**Estimated split across the 5,975-brief catalogue:**

| Renderer | Approximate share | Cost | Speed |
|---|---:|---|---|
| SVG (Kimi outputs the source directly) | ~40% (≈ 2,400) | Free | Instant — viewer renders inline |
| Mermaid (Kimi outputs the source) | ~15% (≈ 900) | Free | Instant — viewer renders inline |
| Nano Banana Pro | ~30% (≈ 1,800) | Manus free credits | 30s/image |
| SKIP (text-only) | ~15% (≈ 875) | n/a | n/a |

So **only ~30% of the catalogue actually goes through Manus** — the
slow, error-prone path. The other ~55% is rendered deterministically by
the browser the moment the viewer loads.

## Best free way to ship the whole catalogue, fastest

The phone-only steps remain the same per batch — but the **work-per-batch
plummets** because most of it is already rendered when you tap the
viewer URL.

| Step | Time per batch of 500 | Where |
|---|---|---|
| Open Kimi, paste prompt + rows, wait | ~3 min | Phone browser |
| Open viewer URL, scroll-and-tick QA the SVG and Mermaid rows | ~2 min | Phone browser |
| Run the ~150 image_gen prompts through Manus | ~25 min | Manus app, batch-submit |
| Upload PNGs to Supabase Storage | ~5 min | Supabase web UI bulk upload |
| **Total** | **~35 min** | |

12 batches × 35 min = **~7 hours of work** to ship the entire
catalogue, mostly waiting for Manus. Free except whatever Manus
charges past its free tier.

If you want to go faster still, after the first batch is done, you can
hand the **renderer script** in the zip (`render.mjs`) to GitHub
Actions: it consumes the `batch.json`, executes every SVG / Mermaid
into a transparent PNG, uploads to Supabase Storage and stamps
`image_url` into the live DB row — all unattended. You then only have
to manually run the Nano-Banana ones.

## How to use it (entirely on phone)

1. Open `docs/diagram-library-catalogue.txt` (the plain-text catalogue).
   Tap → **Raw** → copy the next 500 rows. Search for `GCSE (Y10–Y11)`
   to jump to the GCSE block first.
2. Open Kimi K2.6 (`kimi.com`) in your phone browser. Start a brand-new
   chat. Make sure **Agent mode** / code-execution is enabled.
3. Paste **everything** between the two `===` lines below, then
   immediately below it, paste the 500 rows you copied. Send.
4. Wait ~3 minutes. Kimi replies with `VIEWER_URL: …`, `ZIP_URL: …`, a
   one-line summary, and the `BATCH 500 COMPLETE` sentinel.
5. Tap the **viewer URL**. Maths, geometry, graphs, flowcharts, trees
   all render inline — *the diagram itself* is your QA, no separate
   generator pass for those. Scroll, tick the QA checkboxes, mark each
   pass/fail. State persists in localStorage.
6. Tap the **zip URL**. The zip's `prompts/` folder has the Nano-Banana
   prompts only (~150 per batch). Paste each into Manus, save the
   transparent PNG, upload to Supabase Storage.
7. Open a fresh Kimi chat for the next 500 rows. Repeat.

If any row failed QA, append `[REGEN: <one-line reason>]` to the row
in the next batch. Kimi will produce an improved prompt or a corrected
SVG that addresses the named failure. The viewer marks regen rows
with a 🔄 chip so you QA those first.

---

## The prompt — copy everything between the `===` lines

```
=================================================================
KIMI K2.6 — ONE-SHOT BATCH (UK curriculum diagrams, multi-renderer)
=================================================================

ROLE
You are a UK-curriculum diagram designer AND a maths/SVG/Mermaid
draftsperson.

MODE
This is a ONE-SHOT call. I will paste up to 500 "diagram briefs" at
the bottom of this message. Process EVERY brief in a single response.
Do not ask clarifying questions. Do not stop part-way. Do not
summarise. You have no knowledge of any private codebase, file system
or internal tools — everything you need is in this prompt and in the
batch I paste below.

=================================================================
RULE 0 — ROUTE EACH ROW TO THE RIGHT RENDERER (most important rule)
=================================================================

Image generators (Nano Banana Pro included) cannot reliably:
  - Place arrows or leader lines at precise anatomical / geometric
    points.
  - Draw a 60° angle as 60°.
  - Make a parabola that actually matches y = x² − 4x + 3.
  - Make a circle-theorem diagram geometrically true.

So you must NOT route those briefs to Manus. Route every row to ONE of
these four `render_method` values:

  "svg"        — output a complete, self-contained SVG string. Use this
                 for ALL maths, geometry, graphs, charts, vectors,
                 transformations, circle theorems, Punnett squares,
                 dot-and-cross diagrams, free-body diagrams, circuits,
                 periodic-table layouts, reactivity-series ladders
                 rendered as boxes (not text), EM spectrum strips,
                 ray-diagram constructions, probability trees, simple
                 cross-sections that are geometric (e.g. wave shapes).

  "mermaid"    — output a Mermaid source string (graph LR, flowchart,
                 sequence, mindmap, gantt, etc). Use for trees,
                 flowcharts, mind maps, network diagrams (OSI / TCP-IP
                 / CPU block), decision diagrams, sorting-algorithm
                 step diagrams, lifecycle / pathway / phylogenetic
                 trees with simple branching.

  "image_gen"  — output a Nano-Banana-Pro-ready image prompt + numbered
                 tags. Use ONLY when the brief genuinely needs
                 illustrative content that SVG/Mermaid can't capture:
                 anatomy (heart, nephron, neurone, plant cell, eye,
                 leaf), apparatus (Bunsen + glassware), geological
                 cross-sections (river V-valley, glacial corrie,
                 trench), maps with terrain, character relationship
                 maps with silhouette portraits, ecosystem scenes,
                 art-history homages, named-figure silhouettes.

  "skip"       — text-only briefs (formula cards, acronyms, vocab
                 lists, rules cards, theme cards, rhyme-scheme labels).
                 The downstream worksheet generator renders those as
                 styled HTML — they don't belong as images.

DEFAULT: when a brief is plausibly renderable as SVG or Mermaid,
PREFER that — geometric/mathematical correctness wins over photo
realism every time. Fall back to image_gen only when the brief
genuinely requires drawing or illustrative style.

When in doubt about which of svg vs mermaid: pick mermaid for tree /
graph / sequence structures, svg for everything else.

=================================================================
OUTPUT — you must produce BOTH of the following
=================================================================

  (1) A LIVE, PUBLICLY-ACCESSIBLE HTTPS URL hosting a single
      self-contained `viewer.html` page that I can open on my phone to
      browse, filter, search and QA the entries. The viewer must
      render the svg field inline as SVG, the mermaid field inline via
      embedded Mermaid.js, and show image_gen prompts as cards. Use
      your code-execution / agent / file-publishing tooling to host.
      Hosting priority: built-in artifact share → 0x0.st → transfer.sh
      → catbox.moe → file.io. Verify the URL returns
      `Content-Type: text/html` so it renders inline.

  (2) A DOWNLOADABLE ZIP archive (same hosting strategy) containing:

      /viewer.html             single-file mobile viewer (offline-capable)
      /batch.json              JSON array of all entries (full schema below)
      /manifest.csv            id, title, year_band, decision,
                               render_method, copyright_check
      /svg/<id>.svg            one file per svg entry
      /mermaid/<id>.mmd        one file per mermaid entry
      /prompts/<id>.txt        one file per image_gen entry — Nano
                               Banana Pro prompt only, paste-ready
      /qa-checklists.md        all QA checklists, grouped by id
      /skipped.md              all SKIP entries with reasons
      /render.mjs              Node script that turns svg/ and mermaid/
                               into transparent PNGs at 2048×2048 and
                               uploads them to Supabase Storage if env
                               vars are set (idempotent)
      /README.md               one-page guide

If you cannot host the URL (no internet egress), produce the zip as
base64 between BEGIN_ZIP_BASE64 and END_ZIP_BASE64 markers and state
which fallback you used.

=================================================================
RULE 1 — TRANSPARENT BACKGROUND (SEND / dyslexia accessibility)
=================================================================

Every output (SVG, Mermaid, or PNG from Nano Banana Pro) MUST have a
transparent background. UK SEND pupils (dyslexia, scotopic sensitivity
/ Irlen syndrome, autism, visual stress) read worksheets through
coloured tint overlays (cream, pale yellow, sky blue, soft grey, pale
pink). A solid white canvas fights every tint and ruins the
accommodation; a transparent canvas inherits whatever overlay the
pupil applied.

  - SVG: do NOT set a `<rect>` background fill. The root `<svg>` element
    has no `fill`. Do not include `style="background:white"`. Use
    `viewBox="0 0 W H"` and let the canvas stay transparent.
  - Mermaid: include `%%{init: {'theme':'neutral', 'themeVariables':
    {'background': 'transparent', 'primaryColor': '#fff0',
    'primaryBorderColor': '#1a1a1a', 'primaryTextColor': '#1a1a1a',
    'lineColor': '#1a1a1a'}}}%%` at the top so the rendered SVG is
    transparent.
  - Image_gen prompts: explicitly state "transparent background, RGBA
    PNG, alpha channel preserved, no fill, no canvas colour".

Across all renderers:
  - Line work pure black or near-black (`#000` or `#1a1a1a`) — readable
    on every common SEND tint. 1pt primary, 0.5pt leader.
  - Spot colours allowed only when semantically necessary (red
    arteries, blue veins, green "go"). Use saturated versions, never
    pastels — pastels disappear under tinted overlays.
  - Region distinction: use thin dark hatching/stipple, not solid
    fills. Patterns survive overlays; fills don't.
  - Drop shadows, glows, gradients, paper textures: forbidden.

=================================================================
RULE 2 — MATHEMATICAL CORRECTNESS (SVG outputs)
=================================================================

When you emit an SVG, the geometry must be MATHEMATICALLY TRUE. No
approximations.

  - Angles drawn at the stated value. If the brief says 60°, compute
    cos(60°) and sin(60°) and place the line correctly.
  - Circle theorems: if the theorem says "angle at the centre = 2 ×
    angle at the circumference", actually subtend twice the angle.
  - Graphs: plot a real sample of points along the equation and join
    them. y = x² is a parabola through the origin, not a vague U
    shape.
  - Coordinate axes: tick marks at integer values, equally spaced.
  - Probability trees: probabilities along sibling branches sum to 1
    where appropriate.
  - Punnett squares: each cell shows the correct allele combination
    given the parent genotypes.

Use `<g transform="...">` and trigonometry as needed. Comment your
SVG with one-liner notes near non-obvious coordinates so the artist
can verify by eye.

=================================================================
RULE 3 — ARROWS, LEADER LINES AND LABELS POINT AT THE RIGHT THING
=================================================================

This is where image_gen breaks. For svg + mermaid you have full
control — use it.

  - Define arrow markers with `<marker>` and reference them with
    `marker-end="url(#arrow)"`. Place the line endpoint at the EXACT
    coordinate of the labelable feature.
  - Numbered-tag system (same as before, but now mostly applies to
    image_gen): small dark filled circle (~14 px, fill #1a1a1a) with
    a bold white sans-serif single or double digit. Numbers render
    reliably; words don't.
  - SVG: place the tag circle as a `<circle>` + `<text>` group at the
    exact pixel coordinate of the feature. Populate `numbered_tags`
    so the worksheet generator can render the key.
  - Mermaid: name nodes with the canonical label, the rendered SVG
    will place text correctly.
  - For image_gen rows, EVERY label is a numbered tag — no words on
    the canvas — because Nano Banana cannot place text precisely.

=================================================================
RULE 4 — SKIP CRITERIA (text-only briefs)
=================================================================

If the brief is essentially text — formula, acronym (AFOREST,
OILRIG, BIDMAS, SOHCAHTOA), poster of words, vocabulary list,
definition card, numeric/word table, rules card, theme card,
rhyme-scheme labelling — output a SKIP entry. The downstream
worksheet generator renders these as styled HTML which is higher
quality, fully editable, and screen-reader-accessible.

Stylised text cards are SKIP by default. Only render a stylised-text
image (via svg) when the spatial arrangement IS itself the lesson —
concrete poetry whose layout is the poetic device, weighted word
clouds where size carries meaning, calligraphy. Even there prefer
SKIP if styled HTML can carry the meaning.

When in doubt: if you'd have to TYPE the content rather than DRAW
or DIAGRAM it, it's a SKIP.

=================================================================
COPYRIGHT AND CULTURAL SAFETY
=================================================================

- No reproductions of famous artworks. "In the style of" homages with
  reduced palette and silhouette only. Set copyright_check to
  "PASS — silhouette/homage only".
- For Religious Education: no figurative depiction of the Prophet
  Muhammad ﷺ. Use the Kaaba (drawable as SVG) and Arabic calligraphy
  ﷺ where relevant.
- For English Literature character maps: silhouette portraits only,
  no faces, no copyrighted text from the works. Title of the work +
  arrows labelling relationships (ally, rival, family, mentor, lover).
  Silhouettes in dark grey on transparent. Route to image_gen.
- For named historical figures (Pankhurst, Wilberforce, Snow,
  Davison): silhouette card style, no attempted likeness, generic
  period-appropriate silhouette + date label. Route to image_gen.

=================================================================
VIEWER.HTML SPEC (single-file, no external deps except Mermaid CDN)
=================================================================

- Pure HTML + inline `<style>` + inline `<script>` + inline JSON data.
- ONE allowed external dep: Mermaid.js via a CDN script tag (so
  mermaid sources render). If you can inline Mermaid bundle, even
  better — the viewer must work in any phone browser.
- Mobile-first: viewport meta, all interactions tap-friendly,
  minimum 44 px tap targets, system sans-serif font, 16 px base.
  Honour `prefers-color-scheme: dark`.
- Sticky header: counts (total / GENERATE / SKIP / svg / mermaid /
  image_gen), filter chips (year_band, decision, render_method),
  free-text search across id + title, QA progress bar.
- Body: one collapsible card per entry. Default collapsed; tap to
  expand.
    * Card header (always visible): id + title + year_band chip +
      render_method chip (SVG / Mermaid / image_gen / SKIP) + status
      dot (green/red/grey) + 🔄 chip on regenerated rows.
    * Card body when expanded:
        * For svg: render the SVG inline, with a "Copy SVG" button.
        * For mermaid: render the Mermaid inline via mermaid.run(),
          with a "Copy Mermaid source" button.
        * For image_gen: show the prompt in a code block with a
          "Copy prompt" button, plus the numbered_tags table.
        * For skip: show the skip_reason.
        * In all cases: qa_checklist with one checkbox per item,
          copyright_check, exam_paper_style_notes.
    * Body footer: "Mark QA passed" (green) and "Mark QA failed"
      (red, opens a textarea for the failure reason).
- Persist all review state (checkbox ticks, pass/fail, failure
  reasons) in localStorage keyed by id.
- Bottom-of-page summary: list of failed rows formatted as
  `[REGEN: <reason>]` annotations, ready to paste into the next batch.

=================================================================
TARGET MODEL — Manus Nano Banana Pro (image_gen rows only)
=================================================================

For image_gen rows, phrasing tips that work with Nano Banana Pro:
- Lead with the diagram TYPE: "Anatomical line illustration of …",
  "Geological cross-section showing …", "Silhouette portrait
  arrangement of …".
- State "transparent background, RGBA PNG, alpha channel preserved"
  in the first sentence.
- Specify hex colours concretely (`#1a1a1a` for line work).
- Push the numbered-tag instruction near the end of the prompt.
- Ask for 1024×1024 or 2048×2048 native.
- Explicitly state "no text labels anywhere in the image — only
  numbered tag circles".

=================================================================
PRIORITY ORDER (informational — process rows in the order I paste)
=================================================================

GCSE (Y10–11) → KS3 (Y9 → Y8 → Y7) → UKS2 (Y6 → Y5) → LKS2 (Y4 → Y3)
→ KS1 (Y2 → Y1) → A-Level (Y12–13).

Subject priority within band: Maths → Biology → Chemistry → Physics
→ Combined Science → English Lit → English Lang → Geography → History
→ Computing → Business → Economics → MFL → Sociology → Psychology →
PE → RE → Art → DT → Music → Drama → Statistics → Citizenship → other.

Note non-priority order in README.md but still process every row in
the order pasted.

=================================================================
INPUT FORMAT
=================================================================

Each row will look like one of:

  [some-id]  Title of the diagram

OR CSV-style with id, title, subject, topic, year_group, year_band,
diagram_type, description, style_notes, tags, ...

OR with a regen annotation appended:
  [some-id]  Title   [REGEN: <one-line failure reason>]

REGEN handling: output a corrected entry. If the row was previously
image_gen and the reason mentions geometry / accuracy / arrow placement,
RE-ROUTE to svg or mermaid if at all possible. Mark `regenerated: true`
and include `original_failure_reason`.

Treat the id as opaque — copy verbatim.

=================================================================
JSON SCHEMA (per entry in batch.json)
=================================================================

GENERATE — svg:
{
  "id": "<copied verbatim>",
  "title": "<copied verbatim>",
  "year_band": "KS1|LKS2|UKS2|KS3|GCSE|A-Level",
  "decision": "GENERATE",
  "render_method": "svg",
  "diagram_family": "graph|geometry|circle-theorem|free-body|circuit|punnett|dot-and-cross|periodic-table|wave|coordinate|other",
  "svg": "<the complete SVG document, transparent background, mathematically correct>",
  "numbered_tags": [
    { "n": 1, "label": "...", "position_hint": "..." }
  ],
  "qa_checklist": ["3–6 yes/no checks"],
  "copyright_check": "PASS — original work | FLAG — <reason>",
  "regenerated": false,
  "original_failure_reason": null
}

GENERATE — mermaid:
{
  "id": "...", "title": "...", "year_band": "...",
  "decision": "GENERATE",
  "render_method": "mermaid",
  "diagram_family": "tree|flowchart|sequence|mindmap|network|other",
  "mermaid": "<full Mermaid source, including the transparent-theme init block at the top>",
  "qa_checklist": ["3–6 yes/no checks"],
  "copyright_check": "...",
  "regenerated": false,
  "original_failure_reason": null
}

GENERATE — image_gen:
{
  "id": "...", "title": "...", "year_band": "...",
  "decision": "GENERATE",
  "render_method": "image_gen",
  "diagram_family": "anatomy|apparatus|map|cross-section|character-map|scene|art-history|silhouette|other",
  "image_gen_prompt": "<60–140 words for Nano Banana Pro, transparent background, numbered tags only, no text labels>",
  "negative_prompt": "white background, solid fill, paper texture, gradient background, drop shadow, opaque canvas, text labels, label words, paragraphs, sentences, formula card, watermarks, photorealistic 3D, AI artefacts, copyrighted logos",
  "numbered_tags": [
    { "n": 1, "label": "...", "position_hint": "..." }
  ],
  "exam_paper_style_notes": "<2 sentences>",
  "qa_checklist": ["3–6 yes/no checks"],
  "copyright_check": "...",
  "regenerated": false,
  "original_failure_reason": null
}

SKIP:
{
  "id": "...", "title": "...", "year_band": "...",
  "decision": "SKIP",
  "skip_reason": "TEXT-ONLY — render as styled text in the worksheet generator (formula | acronym | vocabulary list | definition card | numeric table | rules card | concept text card | typographic poster)"
}

=================================================================
FINAL OUTPUT — your reply must contain exactly the following, in
order, and NOTHING ELSE
=================================================================

VIEWER_URL: https://...
ZIP_URL: https://...
BATCH SUMMARY: <total> rows — <svg> svg, <mermaid> mermaid, <image_gen> image_gen, <skip> skip, <regen> regenerated
BATCH 500 COMPLETE — open the VIEWER_URL on your phone to QA. Most rows render inline; only image_gen rows need Manus. Paste the next 500 rows in a fresh chat for the next batch.

(If you had to fall back to base64, replace the ZIP_URL line with
BEGIN_ZIP_BASE64 / single long base64 string / END_ZIP_BASE64, and
state which fallback you used.)

NO narration, NO apology, NO preamble. Just the four lines and either
the URL or the base64 block.

=================================================================
INPUT BATCH — up to 500 rows below this line
=================================================================
```

[…paste your 500 catalogue rows here, one per line, copied from
docs/diagram-library-catalogue.txt…]

```
=================================================================
END OF INPUT BATCH — produce VIEWER_URL, ZIP_URL, BATCH SUMMARY and
the sentinel, in that order. Begin.
=================================================================
```

---

## Why this version is different from the previous one

| Concern | Previous prompt | This prompt |
|---|---|---|
| Arrows pointing at wrong things | Asked Nano Banana to "place a tag at the radius" — it didn't | SVG places tags at exact pixel coordinates with full control over markers |
| Maths errors (60° drawn as 75°, parabolas wrong) | Asked Nano Banana to be "geometrically accurate" — it can't | SVG outputs are computed from the equation/spec, not generated |
| Quality of small text labels | Numbered tags helped but Nano Banana still struggled | Numbered tags only used for image_gen; SVG and Mermaid place text natively, crisply |
| Cost per batch | ~430 image-gen calls | ~150 image-gen calls (∼65% reduction) |
| Speed of QA per batch | Wait for 430 generations, then check | ~400 rows already rendered when viewer opens; only ~150 to chase |
| Required-practical apparatus | Nano Banana, hit-and-miss | Nano Banana (still the right tool — apparatus needs illustration) |
| Anatomy diagrams | Nano Banana, hit-and-miss | Nano Banana (still the right tool) |
| Probability trees | Nano Banana, often wrong probabilities | Mermaid — perfect every time |
| Free-body diagrams | Nano Banana, arrows misaligned | SVG — exact arrow positions |
| Circle theorems | Nano Banana, frequently false geometry | SVG — geometrically true by computation |

## What the renderer script in the zip does

`render.mjs` is a Node.js script. When you (or GitHub Actions) run it
with `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set:

1. Reads `batch.json`.
2. For each `svg` row: writes SVG → converts to transparent PNG via
   `sharp` → uploads to Supabase Storage → updates `image_url` and
   `numbered_tags` columns in the `diagram_library` row.
3. For each `mermaid` row: invokes `mermaid-cli` (free, npm) → renders
   to transparent PNG → uploads → updates row.
4. Skips `image_gen` rows entirely (those need manual Manus runs).
5. Logs a per-row pass/fail summary.

This is the next-PR follow-up. With the renderer script wired into
GitHub Actions, the SVG and Mermaid rows go from prompt → live in the
DB **without you doing anything** — you only ever touch the ~150
image_gen rows per batch in Manus.

## Cost-per-batch sanity check, updated

- **Kimi K2.6**: 1 chat, ~80–150K tokens. Within K2.6's window. Free
  on a Kimi subscription.
- **GitHub Actions** (renderer): free tier covers public-repo CI
  comfortably; for private repos the included minutes are usually
  enough. 5,975 SVG/Mermaid rows × 1s render time × 1 cent/min CI =
  pennies.
- **Manus Nano Banana Pro**: ~150 image generations × your free-tier
  rate. Free tier usually clears 100–200 images then you pay. Total
  for the catalogue ≈ 1,800 images.
- **Supabase Storage**: free tier (1 GB / 5 GB egress) covers the
  whole catalogue.

The fastest free path is therefore:

1. **Today**: 1 batch through this prompt → tap viewer URL → 400
   rows visibly correct in 2 minutes → 100 image_gen rows through
   Manus.
2. **This weekend**: GitHub Actions cron renders all SVG/Mermaid rows
   straight into the DB unattended.
3. **Next week**: drip-feed the image_gen rows through Manus over
   coffee breaks. ~1,800 of them at 30s each is 15 hours of
   *Manus's time*, not yours.

## Files in PR #133 now

| File | Use |
|---|---|
| `docs/diagram-generation-prompt-kimi.md` | Older multi-turn iterative prompt — keep as reference |
| `docs/diagram-generation-prompt-kimi-oneshot.md` | **THIS doc** — multi-renderer one-shot 500-batch with viewer URL + zip |
| `docs/diagram-library-progress-setup.md` | Phone-friendly setup for the audit workflow |
| `scripts/diagram-library-progress.mjs` | The audit script |
| `.github/workflows/diagram-library-progress.yml` | "Run workflow" button for the audit |

A follow-up PR will add `scripts/diagram-render.mjs` + a GitHub
Actions workflow that runs the renderer over a queue of zips uploaded
to a `_pending/` folder.
