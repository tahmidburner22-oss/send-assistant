# How to use the diagram pipeline

> Plain-language guide. No coding. About 3 minutes of reading.

## What this is

You have a list of **5,975 educational diagrams** the app needs (in
`docs/diagram-library-catalogue.csv`). This pipeline produces an actual
PNG image for every one of them — automatically, around the clock, in
the background, for free.

It is built around three principles:

1. **SEND-first** — high contrast, calm palette, white background, no
   clutter, predictable across a series. This is the same style guide
   every diagram has to obey.
2. **Spec-faithful** — for any diagram that has a fixed shape (ten
   frames, number lines, fractions, dice, arrays, etc.) we **draw it
   from code**, not from AI. That means it is 100% accurate to the
   curriculum spec, every single time. Around 250 of the 5,975 rows
   are drawn this way today, and more are added with every renderer
   we ship.
3. **QA-gated** — for the diagrams that do go to AI, every single
   image is checked for white background, low text, and (if a vision
   model is configured) compliance with the catalogue brief. If it
   fails, it is regenerated. If it keeps failing, it is held back —
   the pipeline never silently ships a bad image.

## How it runs

A robot called **GitHub Actions** (which is built into GitHub and free
to use) wakes up **every 30 minutes** and processes the next batch of
diagrams. It does this 24 hours a day, 7 days a week, until every
diagram has an image. There is nothing you need to keep open — close
your laptop, the pipeline keeps going.

## Your one-time setup (about 2 minutes)

You only need to do this once, after the pipeline PR is merged.

### Step 1 — Turn on GitHub Actions (if it isn't already on)

1. Go to your repository on GitHub.
2. Click the **Settings** tab.
3. In the left sidebar, click **Actions → General**.
4. Under "Actions permissions", make sure **Allow all actions** is
   selected.
5. Scroll to "Workflow permissions" and select **Read and write
   permissions**, then tick **Allow GitHub Actions to create and
   approve pull requests**.
6. Click **Save**.

### Step 2 — Turn on GitHub Pages (this is the dashboard)

1. Still in **Settings**, click **Pages** in the left sidebar.
2. Under "Build and deployment", set **Source** to **GitHub Actions**.
3. That's it. The first pipeline run will publish your dashboard.

### Step 3 — Trigger your first run

1. Go to the **Actions** tab in your repository.
2. In the left sidebar, click **Diagram image pipeline**.
3. On the right, click the grey **Run workflow** button → **Run workflow**.
4. Wait 5–10 minutes.
5. Refresh the dashboard URL (see below).

That's the whole setup. From now on, every 30 minutes the pipeline runs
on its own.

## Where to see progress (your online link)

Your live dashboard is here:

> **https://tahmidburner22-oss.github.io/send-assistant/**

(Replace the slug with your actual GitHub username and repo name if
you have forked or renamed.)

The dashboard shows:

- A progress bar across the whole catalogue.
- Counts of done / pending / failed / not-yet-started.
- The most recently generated images, with the brief.
- Any diagrams that failed QA and are queued for retry.
- The split between SVG-rendered (100% accurate) and AI-generated.

It refreshes itself every 60 seconds.

## How to make better-quality images (optional)

The default uses **Pollinations.ai** which is free and needs no
account. It's fine for many briefs. If you want higher quality (closer
to or beyond Twinkl), you can add an API key from one of these
free-tier providers. The pipeline will use them first and fall back to
Pollinations only when needed.

To add a key:

1. In your repo on GitHub, go to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Use one of these names. Add the key from the provider's website.

| Secret name             | Provider           | Where to get it                              | Cost                                           |
| ----------------------- | ------------------ | -------------------------------------------- | ---------------------------------------------- |
| `TOGETHER_API_KEY`      | Together.ai        | together.ai → Settings → API Keys            | $1 free credit (~370 images), then ~$0.003 each |
| `CLOUDFLARE_AI_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Workers AI | dash.cloudflare.com → AI → Workers AI tokens | Free tier covers ~hundreds of images / day     |
| `HUGGINGFACE_TOKEN`     | Hugging Face       | huggingface.co → Settings → Access Tokens    | Free monthly compute (limited)                 |
| `GEMINI_API_KEY`        | Google Gemini      | aistudio.google.com → Get API key            | Free tier; used **only** for vision QA, not generation |

Adding `GEMINI_API_KEY` is the **single biggest quality win**. With it,
every AI image is checked against the brief by a vision model, and
mismatches are rejected.

## What if I want to pause it?

1. Go to **Actions → Diagram image pipeline**.
2. Click the **⋯** menu (top right) → **Disable workflow**.
3. To re-enable, the same menu has **Enable workflow**.

## What if an image looks wrong?

1. Find the diagram on the dashboard — the brief is shown next to it.
2. Open `tools/image-pipeline/state.json` in the repo. Search for the
   row's id (e.g. `pdl-0042`).
3. Change `"status": "done"` to `"status": "pending"`.
4. Commit. The next pipeline run will regenerate it.

If you want it generated by a different strategy, edit
`tools/image-pipeline/taxonomy.mjs` — the comments there explain how
to add your own SVG renderer or change a routing rule.

## What if everything fails?

Open **Actions → Diagram image pipeline** and click the most recent
run. The logs will tell you exactly which step failed. The most common
problem is "all providers exhausted" — that means Pollinations was
down. The pipeline retries automatically on the next 30-minute tick.

## Frequently asked

**Is this really free?**
Yes. GitHub Actions for public repositories is unlimited; for private
repositories you get 2,000 minutes/month free, and the pipeline uses
about 30–60 minutes per day at the default cadence. Pollinations.ai
has no key and no per-image charge.

**How long until everything is generated?**
At the default cadence (50 rows per run, every 30 minutes), the full
5,975-row catalogue takes about 2.5 days. Increase the batch size on
the manual run for a faster initial fill.

**Can I beat Twinkl quality?**
The SVG-rendered rows already do — they are pixel-perfect to spec.
The AI-rendered rows are dependent on the provider; with
`GEMINI_API_KEY` configured for spec compliance plus `TOGETHER_API_KEY`
or `CLOUDFLARE_AI_TOKEN` for higher-quality generation, the result is
typically cleaner than Twinkl because we enforce one subject, white
background, and minimum text — rules Twinkl frequently relaxes.
