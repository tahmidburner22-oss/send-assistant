# SEND Visual Elevation — Resume pointer

**Quick-resume header — paste into a fresh chat:**

```
Context: send-assistant repo (brand = "Adaptly"). Task = "SEND Visual
         Elevation": make visuals high-quality, relevant (not random /
         half-matching) and free, and add the SEND symbol layer that is
         the platform's USP. Derived from a competitor study of
         easyclass.ai, buildmystory.com, toolsedu.com, mylens.ai,
         gamma.app, TeachShare AI and Canvas IgniteAI.
Plan:    docs/SEND-Website-Elevation-Plan.md   (full strategy, Parts 1-11)
Resume:  .agents/tasks/send-visual-elevation/SESSION-HANDOFF.md  (read FIRST)
Phase:   .agents/tasks/send-visual-elevation/PHASE-PLAN.md       (roadmap)
Ledger:  .agents/tasks/send-visual-elevation/LEDGER.md           (what shipped)
Shipped: PR #162 (MERGED into main) — relevance-ranked images,
         ARASAAC symbol-proxy + resolver, Communication Board tool,
         dead-key (Gemini) auth cooldown.
Constraints:
  - Keep it FREE (no paid APIs), high quality, child-safe.
  - Gemini key is unreliable — Groq is priority-1 for text; do NOT depend
    on Gemini. For images use vector (SVG) + stock + ARASAAC; reserve
    generative (Cloudflare FLUX) for story illustrations only.
  - npm install REQUIRES `--legacy-peer-deps` (vite peer conflict).
  - Repo has ~146 PRE-EXISTING tsc errors — `npm run check` is NOT a clean
    gate. Verify you added ZERO net-new errors by counting before/after
    with your changes git-stashed (see SESSION-HANDOFF "How to verify").
  - Big files: PresentationMaker.tsx (~7,000 lines), ai.ts (~5,600),
    Worksheets.tsx / WorksheetRenderer.tsx are large — grep `// §` and
    read narrow ranges; do NOT read in full.
  - "As few PRs as possible" — the team prefers ONE combined branch/PR
    per logical group, not many small PRs.
Goal: pick the next un-shipped item from SESSION-HANDOFF "What is next",
      implement it, update LEDGER.md + SESSION-HANDOFF.md, extend/open
      the combined PR.
```

## What this task is

Take the best visual/tooling ideas from seven leading ed-tech platforms
and rebuild them **SEND-first** (accessibility, differentiation,
symbol/AAC support, sensory-aware) while staying **free** and **high
quality**. The full strategy — competitor build breakdown, the honest
free-vs-quality limitations, and the 4-tier visual engine — is in
`docs/SEND-Website-Elevation-Plan.md`.

## How to ship (PR strategy)

Single combined branch per logical group, combined PR off `main`
(mirrors the repo's Phase G/H + PR-19..27 precedent). The team has
explicitly asked for the **lowest possible PR count**. PR #162 was the
first shipment and is merged; continue on a new combined branch.
