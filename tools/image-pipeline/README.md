# `tools/image-pipeline/`

24/7 background image generator for the diagram catalogue
(`docs/diagram-library-catalogue.csv`). Specialised for SEND learners.

## For non-technical users

Read **[HOW-TO-USE.md](./HOW-TO-USE.md)**.

## For developers

| File / folder           | Role                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `SEND-STYLE-GUIDE.md`   | Single source of truth for every visual constraint                |
| `taxonomy.mjs`          | Routes each catalogue row to `svg` / `ai-structural` / `ai-pictorial` |
| `renderers/`            | Deterministic SVG renderers (100% spec-accurate, no AI)           |
| `prompt.mjs`            | Strict prompt builder for the AI tier (loads SEND rules)          |
| `providers/`            | Image-gen providers — Pollinations (default), Together, Cloudflare, HF |
| `qa.mjs`                | Multi-stage QA: dimensions → white bg → text density → vision-LLM spec check |
| `state.mjs`             | Pipeline state file (per-row status)                              |
| `csv.mjs`               | Tiny dependency-free CSV reader/writer                            |
| `run.mjs`               | Main runner. Invoked by GitHub Actions or `node run.mjs --batch=N` |
| `dashboard/`            | Static HTML dashboard (deployed to GitHub Pages)                  |
| `state.json`            | Per-row status, written by the runner, committed by the workflow  |

## Run locally

```bash
cd tools/image-pipeline
npm install sharp tesseract.js
node run.mjs --batch=20 --concurrency=4
```

Set provider keys as environment variables to enable them
(`TOGETHER_API_KEY`, `CLOUDFLARE_AI_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`,
`HUGGINGFACE_TOKEN`, `GEMINI_API_KEY`). With none set, Pollinations is
used (no key required).

## CLI flags

| Flag                  | Default | Purpose                                       |
| --------------------- | ------- | --------------------------------------------- |
| `--batch=N`           | 50      | Max rows to process this run                  |
| `--concurrency=N`     | 4       | Parallel AI generations                       |
| `--dry`               | off     | Print the plan, do not generate or write      |
| `--only=ID`           | —       | Process exactly one row, e.g. `--only=pdl-0008` |

## Adding a new SVG renderer

1. Add a `renderers/<name>.mjs` exporting `render(row, params)` returning SVG.
2. Register the title prefix in `taxonomy.mjs` `SVG_TITLE_PREFIXES`.
3. Register the module in `renderers/index.mjs` `REGISTRY`.
4. The runner picks it up on the next batch.

## How QA gating works

For every AI-generated image:

1. **Dimensions** — must be ≥768×768 (typically 1024).
2. **White background** — ≥97% of border pixels within tolerance of pure white.
3. **Text density** — Tesseract OCR; rejects if more than 3 alphabetic
   words detected (briefs that allow text are tagged in the row).
4. **Spec compliance** — vision-LLM describes the image; rejected if
   <50% of the brief's primary subject keywords appear in the description.
   Skipped cleanly if no `GEMINI_API_KEY` configured.

Failures map to mutations (`white-bg`, `too-much-text`, `spec-mismatch`,
`low-contrast`) which strengthen the corresponding rule on retry.
