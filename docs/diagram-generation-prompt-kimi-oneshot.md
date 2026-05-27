# Kimi K2.6 — one-shot 500-batch prompt (zip + live viewer URL)

This is the **recommended** prompt for power users who want to process the
catalogue fast.

It is a **one-shot prompt** — paste it once together with up to **500
catalogue rows** at the bottom, send to Kimi K2.6, and Kimi replies with:

1. **A live, mobile-friendly viewer URL** showing all 500 entries in a
   filterable / searchable / tick-as-you-go table — perfect for QA on a
   phone.
2. **A downloadable zip file** with all the structured artefacts you'll
   feed to Manus's Nano Banana Pro and to the worksheet generator.

You do **NOT** chat with Kimi turn-by-turn for this version. Each batch is
a fresh chat:

```
new chat → paste prompt + 500 rows → wait → click viewer URL → QA on phone
       → download zip → run prompts/*.txt through Manus
       → upload PNGs to Supabase Storage → next batch (new chat)
```

5,975 briefs ÷ 500 per batch ≈ **12 batches** to ship the whole catalogue.

If a few images fail QA, you re-run those rows in the next chat with a
`[REGEN: <reason>]` annotation appended to the row — Kimi includes them in
that chat's zip with revised prompts.

---

## How to use it (entirely on phone)

1. Open `docs/diagram-library-catalogue.txt` (the plain-text catalogue).
   Tap → **Raw** → copy the next 500 rows (one batch). Tip: search for
   `GCSE (Y10–Y11)` to jump to the GCSE block first.
2. Open Kimi K2.6 (`kimi.com`) in your phone browser. Start a brand-new
   chat. Make sure **Agent mode** / code-execution is enabled if your
   account has the toggle (it's needed to publish the viewer URL).
3. Paste **everything** between the two `===` lines below, then immediately
   below it, paste the 500 rows you copied. Send.
4. Wait ~2–4 minutes. Kimi replies with a viewer URL and a zip download
   link.
5. Tap the **viewer URL** on your phone. Scroll, filter by `year_band`,
   tick `qa_checklist` items as you go, mark each row pass/fail. Your
   ticks are saved in your phone's localStorage so you can come back.
6. Tap the **zip download link**. Unzip on your phone (iOS Files / Android
   Files both handle this natively). Inside you'll find one
   `prompts/<id>.txt` per row — paste each into a new Manus task, save the
   transparent PNG it returns, upload to Supabase Storage.
7. Open a fresh Kimi chat for the next 500 rows. Repeat.

If any row failed QA, append `[REGEN: <one-line reason>]` to that row in
the next batch — Kimi will include a fixed prompt for it.

---

## The prompt — copy everything between the `===` lines

```
=================================================================
KIMI K2.6 — ONE-SHOT BATCH (UK curriculum diagrams → Nano Banana Pro)
=================================================================

ROLE
You are a UK-curriculum diagram designer.

MODE
This is a ONE-SHOT call. I will paste up to 500 "diagram briefs" at the
bottom of this message. Process EVERY brief in a single response. Do not
ask clarifying questions. Do not stop part-way. Do not summarise.

OUTPUT — you must produce BOTH of the following:

  (1) A LIVE, PUBLICLY-ACCESSIBLE HTTPS URL hosting a single
      self-contained `viewer.html` page that I can open on my phone to
      browse, filter, search and QA the entries. Use your code-execution
      / agent / file-publishing tooling to host it. If your runtime can
      attach the file as a sharable artifact with a URL, do that. If not,
      use a public file-host you can reach (in priority order: 0x0.st,
      transfer.sh, catbox.moe, file.io). Verify the URL returns
      `Content-Type: text/html` so it renders inline on a phone — if the
      service forces download instead, switch to a different one.
  (2) A DOWNLOADABLE ZIP archive containing all the structured artefacts
      below. Same hosting strategy — use whatever your runtime exposes.

If for any reason you cannot host the URL (no internet egress, no upload
tool), still produce the zip as base64 between BEGIN_ZIP_BASE64 and
END_ZIP_BASE64 markers, and clearly state which output mode you used.

=================================================================
ZIP CONTENTS (exact filenames)
=================================================================

/viewer.html             — single-file mobile-first viewer (spec below)
/batch.json              — JSON array of all entries (full schema below)
/manifest.csv            — id, title, year_band, decision, diagram_family,
                           copyright_check, prompt_filename
/prompts/<id>.txt        — one file per GENERATE entry, plain-text
                           image_gen_prompt only (ready to paste into
                           Manus Nano Banana Pro)
/qa-checklists.md        — markdown, all QA checklists grouped by id
/skipped.md              — markdown list of all SKIP entries with reasons
/README.md               — one-page guide on how to use the zip

=================================================================
VIEWER.HTML SPEC (single-file, no external dependencies)
=================================================================

- Pure HTML + inline `<style>` + inline `<script>` + inline JSON data.
  No CDN links, no external fonts. Works offline AND when hosted online.
- Mobile-first: viewport meta tag, all interactions tap-friendly,
  minimum 44 px tap targets.
- Sticky header at top with:
    - Total count + counts of GENERATE and SKIP.
    - Filter chips: year_band (KS1 / LKS2 / UKS2 / KS3 / GCSE / A-Level /
      ALL), decision (GENERATE / SKIP / ALL).
    - Free-text search across id + title.
    - QA progress bar: <passed>/<reviewed>/<total>.
- Table body: one collapsible card per entry. Default collapsed; tap to
  expand.
    - Card header (always visible): id + title + year_band chip +
      decision chip + a status dot (green = QA-passed, red = QA-failed,
      grey = not reviewed).
    - Card body (expanded): image_gen_prompt (with a "Copy prompt"
      button that copies to clipboard), numbered_tags as a 2-column
      table (n + label), qa_checklist with one checkbox per item,
      copyright_check, exam_paper_style_notes.
    - Two big buttons in the body footer: "Mark QA passed" (green),
      "Mark QA failed" (red, opens a small textarea for failure reason
      that's saved on the card).
- All review state (which checkboxes ticked, pass/fail status, failure
  reasons) persisted in localStorage keyed by id, so the user can close
  and reopen the page later.
- Bottom-of-page summary: list of any rows marked failed with their
  failure reasons, ready to copy back into the next batch as
  `[REGEN: <reason>]` annotations.
- Visual style: pure black / dark grey on light grey background, 16 px
  base font, system sans-serif font stack — no fancy fonts. Honour
  `prefers-color-scheme: dark` with a dark mode (light grey on dark
  grey).

=================================================================
RULE 1 — IMAGES ARE IMAGES, NOT TEXT CARDS
=================================================================
Generated images must be a genuine VISUAL — drawing, schematic, anatomy,
apparatus, geometry, graph, map, cross-section. Forbidden: formula
cards, acronym posters, vocabulary lists, definition cards, paragraphs,
infographics with body copy, "posters of words". Equations and prose
are rendered later by the worksheet generator as styled HTML — they do
not belong inside the image.

=================================================================
RULE 2 — TRANSPARENT BACKGROUND (SEND / dyslexia accessibility)
=================================================================
Every generated image MUST be RGBA PNG with alpha channel preserved —
no white fill, no paper texture, no gradient. UK SEND pupils
(dyslexia, scotopic sensitivity / Irlen syndrome, autism, visual
stress) read worksheets through coloured tint overlays (cream, pale
yellow, sky blue, soft grey, pale pink). A white canvas fights every
tint; a transparent canvas inherits whatever overlay the pupil
applied.

Knock-on rules:
- Line work pure black or near-black (`#000` or `#1a1a1a`) — readable
  on every common SEND tint. 1pt primary lines, 0.5pt leader lines.
- Spot colours allowed only when semantically necessary (red arteries,
  blue veins, green "go"). Use saturated versions, never pastels.
- Map regions: thin dark hatching/stipple, NEVER solid colour fills.
- Drop shadows, glows, gradients, paper textures: forbidden.

Always include in image_gen_prompt: "transparent background, RGBA PNG,
alpha channel preserved, no fill, no canvas colour".
Always include in negative_prompt: "white background, solid fill,
paper texture, gradient background, drop shadow, opaque canvas".

=================================================================
RULE 3 — NO TEXT IN IMAGES (numbered tags + worksheet key)
=================================================================
Image generators (including Nano Banana Pro) are unreliable at small
clean text on transparent backgrounds — anti-aliased letters fight
background removal and look fuzzy. So we don't put text in images.

Numbered tag system:
- At each labelable point, place a small dark filled circle (~14 px,
  fill `#1a1a1a`) with a bold white sans-serif single digit (1–9) or
  two digits (10–99). Numbers render reliably; words don't.
- The worksheet generator overlays a numbered KEY beside the image
  (1 = aorta, 2 = right ventricle, …) as crisp HTML/SVG text that
  screen readers read, pupils resize, and EAL pupils translate.
- Populate the `numbered_tags` array in the JSON output with one entry
  per tag in the image, in the order the tags appear (top-to-bottom,
  left-to-right).

Allowed text-in-image exceptions (single characters only, render fine):
- Greek/italic single-letter variables (`θ`, `α`, `x`, `y`) at
  geometry vertices.
- Axis tick numerals (0, 1, 2, 3) on graphs.
- Coordinate annotations like `(2, 3)`.
- Single-character chemical symbols (H, O, C, N) in dot-and-cross
  diagrams.
- KS1 / LKS2 (Year 1–4) child diagrams ONLY: maximum 4 short labels
  (1–2 words each, 18pt+ rounded sans-serif) directly on the image
  IF the diagram has fewer than 5 labelable points and a numbered key
  would be too much cognitive load for a 5–8-year-old. Numbered tags
  are still the default.

Forbidden in images regardless of band: sentences, paragraphs,
equations longer than two simple terms, bulleted lists, mnemonic
acronyms (AFOREST, OILRIG, BIDMAS, SOHCAHTOA), captions, titles —
all of those go in worksheet text, never in the image canvas.

=================================================================
RULE 4 — SKIP CRITERIA (text-only briefs)
=================================================================
If the brief is essentially text — a formula, an acronym, a poster of
words, a vocabulary list, a definition card, a numeric table, a rules
card, a theme card — output a SKIP entry. The worksheet generator
renders these as styled HTML which is higher quality, fully editable,
and screen-reader-accessible.

Stylised text cards are SKIP by default. Only generate a stylised-text
image if the spatial arrangement, typography or visual layout IS
itself the lesson — concrete poetry, weighted word clouds,
calligraphy. Even there prefer SKIP if styled HTML can carry the same
meaning. These cases are rare.

When in doubt: if you would have to TYPE the content rather than DRAW
it, it's a SKIP.

=================================================================
COPYRIGHT AND CULTURAL SAFETY
=================================================================
- No reproductions of famous artworks. "In the style of" homages with
  reduced palette and silhouette only. Set copyright_check to
  "PASS — silhouette/homage only".
- For Religious Education: no figurative depiction of the Prophet
  Muhammad ﷺ. Use the Kaaba and Arabic calligraphy ﷺ where relevant.
- For English Literature character maps: silhouette portraits only,
  no faces, no copyrighted text from the works. Title of the work
  and arrows labelling relationships (ally, rival, family, mentor,
  lover) only.
- For named historical figures (Pankhurst, Wilberforce, Snow,
  Davison): silhouette card style — no attempted likeness, just a
  generic period-appropriate silhouette with a date label.

=================================================================
TARGET MODEL — Manus Nano Banana Pro
=================================================================
Every `image_gen_prompt` is for Manus's Nano Banana Pro (Google's
high-resolution image-gen model exposed through Manus). Phrasing tips:
- Lead with diagram TYPE: "Anatomical line illustration of …",
  "Schematic technical drawing of …", "Geometric construction
  showing …".
- State "transparent background" within the first sentence.
- Specify hex colours concretely (`#1a1a1a` for line work).
- Push the numbered-tag instruction near the end of the prompt.
- Ask for 1024×1024 or 2048×2048 native — high resolution for print.

=================================================================
PRIORITY ORDER (informational only — process rows in the order I paste)
=================================================================
GCSE (Y10–11) → KS3 (Y9 → Y8 → Y7) → Upper KS2 (Y6 → Y5) →
Lower KS2 (Y4 → Y3) → KS1 (Y2 → Y1) → A-Level (Y12–13).

Subject priority within band: Maths → Biology → Chemistry → Physics →
Combined Science → English Lit → English Lang → Geography → History →
Computing → Business → Economics → MFL → Sociology → Psychology →
PE → RE → Art → DT → Music → Drama → Statistics → Citizenship → other.

If you spot non-priority order in the input, NOTE it in README.md but
still process every row.

=================================================================
INPUT FORMAT
=================================================================
Each row will look like:

  [some-id]  Title of the diagram

OR CSV-style:
  id,title,subject,topic,year_group,year_band,diagram_type,description,
  style_notes,tags,...

OR with a regeneration annotation appended (when re-running a failed
row from a previous batch):
  [some-id]  Title of the diagram   [REGEN: <one-line failure reason>]

If a row has [REGEN: …], output a corrected image_gen_prompt that
specifically addresses the failure reason. Mark the row in batch.json
and viewer.html with `regenerated: true` and include the
original_failure_reason field.

Treat the id as opaque. Copy verbatim. Never invent or modify ids.

=================================================================
JSON SCHEMA (per entry in batch.json)
=================================================================

GENERATE schema:
{
  "id": "<copied verbatim>",
  "title": "<copied verbatim>",
  "year_band": "KS1|LKS2|UKS2|KS3|GCSE|A-Level",
  "decision": "GENERATE",
  "diagram_family": "anatomy|apparatus|graph|geometry|map|cross-section|character-map|free-body|circuit|schematic|scene|process",
  "image_gen_prompt": "<60–140 words, fully self-contained Nano-Banana-Pro-ready>",
  "negative_prompt": "<short comma-separated list>",
  "numbered_tags": [
    { "n": 1, "label": "<canonical exam-paper label>", "position_hint": "<short spatial description>" },
    { "n": 2, "label": "...", "position_hint": "..." }
  ],
  "exam_paper_style_notes": "<2 sentences max>",
  "qa_checklist": [
    "<3–6 short yes/no verifiable observations>"
  ],
  "copyright_check": "PASS — original work | PASS — silhouette/homage only | FLAG — <reason>",
  "regenerated": false,
  "original_failure_reason": null
}

SKIP schema:
{
  "id": "<copied verbatim>",
  "title": "<copied verbatim>",
  "year_band": "...",
  "decision": "SKIP",
  "skip_reason": "TEXT-ONLY — render as styled text in the worksheet generator (formula | acronym | vocabulary list | definition card | numeric table | rules card | concept text card | typographic poster)"
}

=================================================================
FINAL OUTPUT — what your reply must contain, in this order
=================================================================

1. ONE LINE: the live viewer URL.
   Format exactly:
       VIEWER_URL: https://...

2. ONE LINE: the zip download URL.
   Format exactly:
       ZIP_URL: https://...

   (If you had to use base64 fallback, instead emit the zip between:
       BEGIN_ZIP_BASE64
       <one long base64 string, no line breaks>
       END_ZIP_BASE64
    AND state which fallback you used.)

3. ONE LINE: a tally line.
   Format exactly:
       BATCH SUMMARY: <total> rows processed — <generate_count> GENERATE, <skip_count> SKIP, <regen_count> REGEN

4. ONE LINE: the completion sentinel.
   Format exactly:
       BATCH 500 COMPLETE — open the VIEWER_URL on your phone to QA.
       Paste the next 500 rows in a fresh chat for the next batch.

Output NOTHING ELSE — no narration, no apology, no preamble. The viewer
URL alone is enough for me to inspect every prompt; if I disagree with
anything, I'll re-run those rows in the next batch with [REGEN: …]
annotations.

=================================================================
INPUT BATCH — 500 rows below this line
=================================================================
```

[…paste your 500 catalogue rows here, one per line…]

```
=================================================================
END OF INPUT BATCH — produce the viewer URL, the zip URL, the tally and
the sentinel, in that order. Begin.
=================================================================
```

---

## What you'll see

After ~2–4 minutes, Kimi's reply will look like:

```
VIEWER_URL: https://0x0.st/abc123/viewer.html
ZIP_URL: https://0x0.st/abc124/diagrams-batch-001.zip
BATCH SUMMARY: 500 rows processed — 432 GENERATE, 65 SKIP, 3 REGEN
BATCH 500 COMPLETE — open the VIEWER_URL on your phone to QA.
Paste the next 500 rows in a fresh chat for the next batch.
```

Tap the viewer URL. You'll see all 432 generate-eligible entries, each
collapsed by default. Tap any row to expand: the prompt, the numbered
tags, the QA checklist as tickable boxes, and pass/fail buttons.
Filter by year band, search by title, mark each one as you go. Your
ticks persist in your phone's localStorage.

When you're done, the bottom of the viewer shows a **regen list** —
copy-paste-ready text for the next batch's `[REGEN: …]` annotations.

## What's in the zip

| File | Purpose |
|---|---|
| `viewer.html` | Same content as the live URL, but works offline — useful if you need to QA on a flight or weak signal. Open with any phone browser. |
| `batch.json` | The full structured output for every row. Feed this into your worksheet generator pipeline (or save for later DB ingestion). |
| `manifest.csv` | Quick at-a-glance summary — open in any spreadsheet app on your phone. |
| `prompts/<id>.txt` | One plain-text prompt per row, ready to paste straight into Manus Nano Banana Pro. The filename matches the catalogue id, so easy to track which goes where. |
| `qa-checklists.md` | All QA checklists in one printable markdown file. |
| `skipped.md` | All the SKIP entries grouped, so you can verify nothing important got skipped. |
| `README.md` | One-page guide for whoever opens the zip later. |

## Hosting options for the viewer URL

If Kimi's agent runtime can't reach a public file-host, the prompt
falls back to base64-encoding the zip in the chat. Decode it on your
phone with a single shortcut:

- iOS: **Shortcuts** → "Decode Base64 → Save to Files".
- Android: **Termux** → `base64 -d <input> > diagrams.zip`.

Otherwise, the prompt asks Kimi to use one of these free hosts in
priority order:

1. **Manus's built-in artifact sharing** (if Kimi's agent has it
   wired up — fastest, native HTML rendering).
2. **0x0.st** (public anonymous host, serves HTML inline).
3. **transfer.sh** (similar, occasionally rate-limited).
4. **catbox.moe** (rate-limited).
5. **file.io** (last resort — single-download links).

## Failure handling — the regen loop in one chat

You opened a fresh chat for batch 002. While QA-ing batch 001, you found
3 images you want to redo. Just append a `[REGEN: …]` annotation to those
rows in batch 002's input:

```
[dlc-01641]  Transverse wave — labelled (wavelength, amplitude, crest, trough, period)   [REGEN: tag circles ended up too small to read after Manus rasterised]
[dlc-00891]  Heart cross-section — fully labelled   [REGEN: chambers were mirrored — left and right swapped]
[dlc-04022]  Pythagoras — find the hypotenuse (5, 12, ?)
[dlc-04023]  …
…497 more rows…
```

Kimi will produce 500 entries as normal, but for the two REGEN-flagged
rows the `image_gen_prompt` will explicitly address the named failure
mode (e.g. "ensure tag circles are at least 24 px diameter" / "the
right ventricle and right atrium are on the LEFT side of the diagram
as the viewer faces it"). The viewer marks them with a 🔄 chip so you
can spot-check those first.

## Cost-per-batch sanity check

- **Kimi K2.6** call: 1 chat / batch, paid via your Kimi subscription —
  around 80–120K tokens per batch (your input + Kimi's JSON output +
  the viewer.html). Well within the K2.6 1M-token context window.
- **Manus Nano Banana Pro**: ~432 image generations × your per-image
  Manus rate. Free-tier credit usually clears 100–200 images then you
  pay. Check your Manus dashboard.
- **Supabase Storage**: free tier covers the lot.

## Continuity between batches

Each batch runs in a fresh chat — no shared state. To track overall
progress across batches, run the audit workflow shipped in
[`scripts/diagram-library-progress.mjs`](./diagram-library-progress-setup.md)
on a regular cadence: it reads your live `diagram_library` table and
shows what's still to do across the whole 5,975 catalogue.
