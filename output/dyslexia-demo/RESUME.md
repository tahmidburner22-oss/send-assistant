# RESUME / HANDOFF — Dyslexia-adapted SEND worksheets

This file lets a **new chat** pick up exactly where we left off. Read it top to
bottom, run the "Environment setup" block first, then continue from "Next steps".

## How to resume in a new chat (paste this)
> Continue the SEND dyslexia worksheet project in `tahmidburner22-oss/send-assistant`,
> branch `dyslexia-adapted-worksheet-demo`. Read `output/dyslexia-demo/RESUME.md`
> first, run the environment setup block, then carry on from "Next steps".

---

## 1. Goal / what this project is
Build **dyslexia-adapted, lesson-ready worksheets** for a UK SEND ed-tech app.
Each worksheet is generated from a **JSON** (the data) by a **build script**
(Node + Playwright/Chromium → PDF). Every document must share the **exact same
SEND adaptations**, but each **subject has a different layout/structure**.

Deliverables so far (all on the branch):
- **Maths** — Quadratic Simultaneous Equations (earlier work): multi-page, portrait
  one-pager (6 Q), landscape 2-pager (8 Q). Files in `output/dyslexia-demo/`
  (`worksheet*.json`, `build*.mjs`, PDFs).
- **Science** — Photosynthesis (AQA GCSE Biology 4.4.1): `science/`
- **English** — Writing to Persuade: `english/`

## 2. Repo / branch
- Repo: `tahmidburner22-oss/send-assistant` (already cloned at `/projects/sandbox/send-assistant`)
- Branch: **`dyslexia-adapted-worksheet-demo`** (all work committed + pushed here)
- Everything lives under `output/dyslexia-demo/`
- Use the `github_push_to_remote` tool to push (never `git push`).

## 3. Environment setup (RUN THIS FIRST — the sandbox resets between sessions)
Chromium and the NSS shared libraries get wiped on reset. Re-create them:
```bash
cd /projects/sandbox/send-assistant/output/dyslexia-demo
# Node deps (playwright) live here already; if node_modules is gone: npm i playwright
if [ ! -x /root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell ]; then
  npx --yes playwright@latest install chromium
fi
if ! ldconfig -p | grep -q libnss3.so; then
  dnf install -y -q nspr atk at-spi2-atk at-spi2-core cups-libs libdrm libXcomposite \
    libXdamage libXrandr libXfixes libXext libX11 libxcb libxkbcommon mesa-libgbm \
    pango cairo alsa-lib expat
  mkdir -p libs/extract && cd libs/extract
  for pkg in nss nss-util nspr nss-softokn nss-softokn-freebl; do
    URL=$(dnf repoquery --location "$pkg" 2>/dev/null | grep -E "\.x86_64\.rpm" | head -1)
    [ -n "$URL" ] && curl -sL "$URL" -o "$pkg.rpm" && rpm2archive "$pkg.rpm" && tar -xzf "$pkg.rpm.tgz"
  done
  cp -a ./usr/lib64/*.so* /lib64/ && ldconfig && cd /projects/sandbox/send-assistant/output/dyslexia-demo
fi
```
Notes: `dnf` install of the `nss` package itself fails to unpack, so we extract
the `.so` files from the RPMs into `/lib64` manually (above). The launcher uses
`--no-sandbox --disable-gpu --disable-dev-shm-usage` and loads pages via
`file://` (NOT setContent) with a font-ready wait — see `_send-base.mjs renderPdf`.

## 4. Build commands
```bash
cd /projects/sandbox/send-assistant/output/dyslexia-demo
node science/build-science.mjs     # -> science/*.pdf (+ .html render artifacts)
node english/build-english.mjs     # -> english/*.pdf
# Maths (earlier): node build.mjs ; node build-onepage.mjs ; node build-landscape.mjs
```
Page-count check:
```bash
python3 -c "import re;d=open('PATH.pdf','rb').read();print(len(re.findall(rb'/Type\s*/Page[^s]',d)),'pages')"
```
One-page fit check (scrollHeight must be <= page height: 209mm landscape / 296mm portrait):
there is a throwaway `m.mjs` measurer pattern used during dev (open the html,
read `.page` scrollHeight, /(96/25.4) for mm).

## 5. The shared adaptation module — `_send-base.mjs`
Single source of truth so ALL docs get identical adaptations. Exports:
`CREAM (#FFF8E7)`, `ACCENT (#5b3fa8)`, `FONT`, `FONT_CSS` (embedded OpenDyslexic
data-URI from `libs/fonts/opendyslexic-embed.css`), `esc`, `nl`, `baseCss()`,
`ADAPTATIONS`, and `renderPdf({html,htmlPath,pdfPath,landscape})`.

### The canonical dyslexia adaptations (must stay identical everywhere)
- Full-bleed **cream `#FFF8E7`** overlay, **black** text
- **OpenDyslexic** embedded locally (SIL OFL) — self-contained PDFs, no network
- 16px base, line-height 1.6, letter-spacing 0.03em, word-spacing 0.14em
- Ragged-right (left-aligned), never justified
- **Outlined boxes**: coloured border (`#5b3fa8`), NO fill (cream shows through)
- Key vocabulary box + plain-language common mistakes WITH examples; hint boxes
  (`#fff7e0` / amber border); sentence-starter framing (`#eef7ee` / green dashed)

## 6. Distinct structures (must remain different per subject)
- **Maths** = method/practice grid (intro→method+worked example→graded Qs→reflection→key)
- **Science** = diagram-led knowledge poster + explain/diagram booklet
- **English** = technique-card (AFOREST) + annotated model + scaffolded writing

## 7. CURRENT STATUS (verified page counts)
| Doc | File | Pages | State |
|---|---|---|---|
| Science one-page | `science/Photosynthesis-Dyslexia-OnePage.pdf` | **1** | DONE (landscape; flex-fill, no blank space; plant diagram in info + leaf diagram ON Q5; hint box; application Q6) |
| Science booklet | `science/Photosynthesis-Dyslexia-Booklet.pdf` | **14** | DONE (AQA 4.4.1 questions, increasing difficulty Q1→Q9, diagrams on Q5/Q7/Q8, hints + framing, 6-mark exam Q9, self-reflection, teacher assessment, answer key) |
| English one-page | `english/Persuasive-Writing-Dyslexia-OnePage.pdf` | **1** | DONE (2-col organiser: AFOREST table + model + mistakes + checklist + 3 tasks) |
| English booklet | `english/Persuasive-Writing-Dyslexia-Booklet.pdf` | **9** | DONE (intro+vocab+mistakes, AFOREST, content+structure reminders, annotated model, tasks increasing in difficulty incl. 6-mark stretch, self-reflection, teacher assessment) |

The most recent user feedback (this session) asked to: remove blank space / make
boxes bigger and fill the page; align Science Qs to GCSE/National Curriculum;
put diagrams WITH questions (not just reference); add hint boxes; add question
framing; add more questions incl. a problem-solving/exam-style one. **All applied
to Science (both docs).**

## 8. NEXT STEPS / outstanding polish
1. **English booklet — add explicit `💡 Hint` boxes per task** (it has framing +
   structure reminders + a 6-mark stretch task, but no per-question hint boxes).
   Add `hint` fields in `english/worksheet-english-booklet.json` tasks and render
   them in `taskBox()` in `english/build-english.mjs` (copy the `.hintb` pattern
   from `science/build-science.mjs`).
2. **English one-page** — consider bigger/flex-fill boxes like the Science poster
   (currently fits 1 page but is fairly dense). Apply the `flex:1` fill approach.
3. **Maths booklet** — optionally retrofit the same intro / self-reflection /
   teacher-assessment pages + difficulty pips for consistency across all 3 subjects.
4. **Visual QA**: I can verify page counts + font embedding programmatically but
   CANNOT see rendered images in chat. Open each PDF and eyeball: diagram label
   overlaps (SVGs are hand-positioned), spacing, nothing cut off.
5. Then `github_push_to_remote` and (optionally) open a PR.

## 9. Gotchas
- One-pagers use `.page { height: <fixed> }` + flex children so boxes fill the
  page; but flex CANNOT shrink content below its min-content — if a one-pager
  spills to 2 pages, you must CUT content (fewer items / smaller diagrams /
  shorter text), not just shrink margins. Measure with the scrollHeight method.
- Booklet `.page` sections use `min-height` + `break-before:page`; content longer
  than a page flows to an extra sheet (cream fills it) rather than being cut —
  so "nothing cut off" holds, but page COUNT can drift if content grows.
- `.gitignore` in `output/dyslexia-demo/` excludes `node_modules/`, `libs/`
  (except the force-added `libs/fonts/opendyslexic-embed.css`), `*.html` render
  artifacts, and temp `measure*.mjs`/`shot*.mjs`. Commit JSON + build scripts + PDFs.
- All worksheet content is ORIGINAL (original questions written to spec, original
  hand-drawn SVG diagrams, AFOREST is a standard teaching mnemonic). Not copied
  from any exam board paper.
