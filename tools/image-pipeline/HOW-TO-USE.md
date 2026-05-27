# How to use the diagram pipeline

> Plain-language guide. No coding. About 5 minutes of reading.

## What this is

You have a list of **5,975 educational diagrams** the app needs (in
`docs/diagram-library-catalogue.csv`). This pipeline produces an actual
PNG image for every one of them — automatically, around the clock, in
the background, for free.

It is built around three principles:

1. **SEND-first** — high contrast, calm palette, white background, no
   clutter, predictable across a series. The same style guide every
   diagram has to obey.
2. **Spec-faithful** — for any diagram with a fixed shape (ten frames,
   number lines, fractions, dice, arrays, etc.) we **draw it from
   code**, not from AI. 100% accurate to the curriculum spec, every
   time. Around 250 of the 5,975 rows go through this tier.
3. **QA-gated** — for AI diagrams, every image is checked for white
   background, low text, and (with `GEMINI_API_KEY`) compliance with
   the brief. If it fails, it is regenerated. If it keeps failing, it
   is held back — the pipeline never silently ships a bad image.

## What's powering image generation (May 2026)

The default provider chain, in order:

1. **Nano Banana** (`gemini-2.5-flash-image`) — used when `GEMINI_API_KEY`
   is set. Currently state-of-the-art for prompt adherence on
   illustrative briefs, which is exactly our use case.
2. **Together.ai FLUX.1-schnell** — used when `TOGETHER_API_KEY` is set.
3. **Cloudflare Workers AI** — used when both `CLOUDFLARE_AI_TOKEN`
   and `CLOUDFLARE_ACCOUNT_ID` are set.
4. **Hugging Face Inference** — used when `HUGGINGFACE_TOKEN` is set.
5. **Pollinations.ai** — last-resort fallback.

> **Heads-up about Pollinations.** It used to be free and unlimited.
> In 2026 it returns HTTP 402 ("payment required") for many anonymous
> requests, so if you see "All providers exhausted: pollinations HTTP
> 402" in a run, that's the symptom. **Adding `GEMINI_API_KEY` is the
> fix** — Nano Banana then becomes the primary provider and
> Pollinations becomes irrelevant. Same for the Together / Cloudflare
> keys. Any one of those keys is enough.

## How it runs

A robot called **GitHub Actions** (built into GitHub, free) wakes up
**every 30 minutes** and processes the next batch of diagrams. It
does this 24 hours a day, 7 days a week, until every diagram has an
image. Nothing for you to keep open — close your laptop, the pipeline
keeps going.

## One-time setup (about 2 minutes)

You only need to do this once.

### 1 — Turn on GitHub Actions

1. Open your repo on GitHub → **Settings** tab.
2. Left sidebar: **Actions → General**.
3. Under "Actions permissions", select **"Allow all actions and reusable workflows"** → **Save**.
4. Scroll down to "Workflow permissions" → select **"Read and write permissions"** → tick **"Allow GitHub Actions to create and approve pull requests"** → **Save**.

### 2 — Turn on the dashboard

1. Still in **Settings** → **Pages** in the left sidebar.
2. **Source** dropdown → **GitHub Actions**.
3. Done. No save button.

### 3 — Add your Gemini key (strongly recommended)

You said you've already done this. If not:

1. **Settings → Secrets and variables → Actions**.
2. **New repository secret**.
3. Name: `GEMINI_API_KEY`. Value: the key from
   **https://aistudio.google.com/app/apikey**.
4. **Add secret**.

This single key powers two things at once: Nano Banana for image
generation, and Gemini Flash for vision-LLM compliance QA.

### 4 — Trigger the first run

1. **Actions** tab → **Diagram image pipeline** in the left sidebar.
2. Right side: **Run workflow** → **Run workflow** (leave defaults).
3. Wait 5–10 minutes.

That's it. From now on, every 30 minutes the robot runs by itself.

---

## Your dashboard (your online link)

> **https://tahmidburner22-oss.github.io/send-assistant/**

Bookmark it. This is the only link you ever need.

The dashboard shows:

- A progress bar across the whole catalogue.
- Counts of done / pending / failed.
- **Browse all generated images** with subject / year / type filters
  and a search box.
- **Multi-select** with click-to-select on every card.
- A **failure list** of diagrams that didn't pass QA (these auto-retry).
- The split between SVG-rendered (100% accurate) and AI-generated.

Refreshes itself every 60 seconds.

---

## Mass feedback — flag bad images and have them regenerated

This is the big new feature. If you don't like 1, 10, 100 or 500 of the
generated diagrams, tell the pipeline what's wrong with them and they
get regenerated **with stronger prompts that target the specific
flaw** you flagged.

### How to do it

1. Open your dashboard.
2. Scroll to **"Browse images"**. Use the search box and dropdown
   filters (subject, year group, type) to narrow down.
3. **Click on every image you don't like.** A blue tick appears in the
   top-left of each selected card. To clear, click again or use **"Clear
   selection"** in the toolbar.
4. The **feedback bar appears at the bottom of the screen** showing
   how many you've selected.
5. **Click one or more "flaw chips"** that describe what's wrong. The
   chips and what they do:
   - **Too much text** — re-runs with the no-words rule reinforced.
   - **Background not white** — re-runs with white-bg reinforced.
   - **Wrong subject** — re-runs forcing literal interpretation of the brief.
   - **Doesn't match brief** — re-runs with stricter feature matching.
   - **Too cluttered** — re-runs with single-subject + whitespace rule.
   - **Low contrast / thin outlines** — re-runs with thicker outlines.
   - **Photorealistic / 3D** — re-runs with flat-vector style enforced.
   - **Wrong style** — re-runs with primary-textbook style enforced.
   - **Wrong colours** — re-runs forcing the SEND palette.
   - **Too many subjects** — re-runs with single-subject rule.
   - **Low quality / messy** — re-runs with quality reinforcement.
   - **Anatomy wrong** — re-runs with anatomical correctness reinforced.
6. **(Optional)** Type a free-text note in the textarea. This gets
   passed verbatim into the prompt as "TEACHER NOTE: …", so use plain
   English: "the cat looked like a tiger, make it a small domestic cat".
7. Click **"Submit feedback for these images"**.
8. A new browser tab opens on a **pre-filled GitHub Issue page**.
   **Just click the green "Submit new issue" button**. You don't have
   to type anything.
9. Within ~30 seconds the bot:
   - Comments on the issue: "Thanks — feedback received and queued".
   - Lists the diagram ids that were queued.
   - Triggers a fresh pipeline run immediately (you don't wait for the
     30-minute timer).
   - Closes the issue.
10. Within 5–10 minutes those diagrams are regenerated and the
    dashboard shows the new versions.

### How big can a batch be?

Up to about **80 images per submission** before the pre-filled URL
gets too long for browsers. If you select more than that, the
dashboard copies the data to your clipboard and asks you to paste it
manually into a new issue (it shows you a one-line instruction). You
can submit as many issues as you like.

---

## Optional: more provider keys for higher quality

The `GEMINI_API_KEY` alone is a strong setup. If you want extra
robustness or speed:

| Secret name | Provider | Where to get it | Cost |
|---|---|---|---|
| `TOGETHER_API_KEY` | Together.ai | together.ai → Settings → API Keys | $1 free credit (~370 images), then ~$0.003 each |
| `CLOUDFLARE_AI_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` | Cloudflare | dash.cloudflare.com → AI → Workers AI tokens | Free tier covers hundreds/day |
| `HUGGINGFACE_TOKEN` | Hugging Face | huggingface.co → Settings → Access Tokens | Free monthly compute (limited) |

Each extra key just makes the chain more resilient. None of them are
required.

---

## How to pause it

1. **Actions → Diagram image pipeline**.
2. Top-right **⋯** menu → **Disable workflow**.
3. To re-enable: same menu → **Enable workflow**.

## Common problems and fixes

**"All providers exhausted: pollinations HTTP 402"**
You don't have a generation key set. Add `GEMINI_API_KEY` (free, see
above). The next run uses Nano Banana and the 402 stops mattering.

**The dashboard URL shows 404.**
GitHub Pages takes 1–2 minutes after the first run to publish. If still
404 after 5 minutes, recheck step 2 of setup.

**The first run failed with a red ✗.**
Click the run, click the failed step, read the last few lines. Most
common cause: workflow permissions not set in step 1 → fix and click
**"Re-run all jobs"**.

**Images look low quality even with Gemini key set.**
Double-check the secret is named exactly `GEMINI_API_KEY` (case-sensitive).
Open a recent run and search the logs for `provider: gemini` — if
you see only `provider: pollinations`, the key isn't being picked up.

**It hasn't run for hours.**
GitHub disables scheduled workflows after 60 days of repo inactivity.
On the Actions page, click **"Enable workflow"** on the yellow banner.

**A flagged image came back the same.**
Open the closed feedback issue and check the bot's comment — if your
ids weren't recognised, the dashboard sent ids that don't exist in the
catalogue. Refresh the dashboard and re-flag from a current image card.

---

## Frequently asked

**Is this really free?**
Yes, with `GEMINI_API_KEY` (Google's free tier). GitHub Actions for
public repos is unlimited; for private repos 2,000 minutes/month free
which is far more than this pipeline uses.

**How long until everything is generated?**
At default cadence (50 rows / 30 min), the full 5,975-row catalogue
takes about 2.5 days. Increase batch size on the manual run to fill
faster.

**Can I beat Twinkl quality?**
The SVG rows already do — pixel-perfect to spec. With `GEMINI_API_KEY`
configured (Nano Banana + vision QA) plus the targeted feedback loop
described above, the AI rows are typically cleaner than Twinkl
because we enforce one subject, white background, minimum text, and
SEND-grade contrast — rules Twinkl frequently relaxes.
