# SEND Visual Elevation — Resume pointer

This task takes the best ideas from seven ed-tech platforms (easyclass.ai,
buildmystory.com, toolsedu.com, mylens.ai, gamma.app, TeachShare AI,
Canvas IgniteAI) and rebuilds them **SEND-first**, staying **free**,
**high-quality**, **relevant** and **child-safe**. Full strategy:
`docs/SEND-Website-Elevation-Plan.md` (Parts 1-11).

## PR strategy (per user, fewest PRs possible)

Everything still outstanding ships in **exactly two PRs**:

- **PR-A — "Visual polish + symbols + generation"** = **V5b + V6 + V7 + V8**
  (one combined branch, e.g. `feat/visual-elevation-rest`).
- **PR-B — "Six SEND tools"** = **T1 + T2 + T3 + T4 + T5 + T6**
  (one combined branch, e.g. `feat/send-tools-suite`).

Already shipped (do NOT redo): PR #162 (V1-V4, merged), PR #163 (docs,
merged), PR #164 (V5 presentation symbols — open at time of writing;
check if merged).

Branch off the LATEST `main`. If PR #164 is still open and you need the
`SymbolSupportedWords` component for V5b, either wait for #164 to merge
or branch PR-A off #164's branch.

---

## NEW-CHAT CONTINUATION PROMPT (copy/paste this whole block)

```
Repo: tahmidburner22-oss/send-assistant (brand "Adaptly"). Clone it.
Task: "SEND Visual Elevation" — read these FIRST, in order:
  1. .agents/tasks/send-visual-elevation/SESSION-HANDOFF.md
  2. .agents/tasks/send-visual-elevation/PHASE-PLAN.md
  3. .agents/tasks/send-visual-elevation/LEDGER.md
  4. docs/SEND-Website-Elevation-Plan.md   (full strategy + competitor build breakdown + limitations)

Already shipped & merged: V1 relevance-ranked stock photos, V2 ARASAAC
symbol-proxy + symbol-resolver, V3 Communication Board tool, V4 dead-key
(Gemini) auth cooldown, in-repo plan + handoff docs. V5 (presentation
word-bank symbols, screen + PPTX) is PR #164 — check if merged.

Do the remaining work in EXACTLY TWO PRs, off the latest main:
  PR-A "Visual polish + symbols + generation" = V5b + V6 + V7 + V8:
    - V5b: opt-in ARASAAC symbol support in WORKSHEET word banks /
      vocabulary. Reuse the EXISTING client/src/components/
      SymbolSupportedWords.tsx (TermSymbol, SymbolSupportedWords,
      extractVocabTerms). Add UserPreferences.symbolSupport (shared opt-in)
      + a Switch in Worksheets.tsx next to Book Mode (~L4856). Add a
      symbolSupport prop to WorksheetRenderer; render a symbol strip for
      section.type==="vocabulary" in PrimarySection AND the secondary
      section card. Confirm symbols embed in the PDF path
      (pdf-generator-v2.ts); use fetchSymbolAsDataUrl if remote <img> fails.
    - V6: server-side CLIP re-ranking on /api/image-proxy/search (free via
      Cloudflare Workers AI) layered on the existing lexical relevance score.
    - V7: a free generative image endpoint (Cloudflare Workers AI FLUX) for
      UNIQUE story illustrations ONLY — teacher-initiated, safety-gated,
      cached, never pupil-direct.
    - V8 (optional): if the Gemini key stays dead, remove gemini* from
      PROVIDER_ORDER and the heavy[] list in server/routes/ai.ts.
  PR-B "Six SEND tools" = T1-T6 (specced in docs/SEND-Website-Elevation-Plan.md):
    T1 Connected Resource Generator (EasyClass) — flagship: 1 topic ->
       differentiated worksheet + slides + reading + quiz + comms board.
    T2 Reading & Story Studio + published e-book (BuildMyStory).
    T3 Interactive Activity Generator (ToolsEdu) — REUSE existing procedural
       generators under client/src/lib/proceduralActivities/ (wordsearch/
       crossword/matching/cloze from Phase G) — switch/eye-gaze accessible.
    T4 Visual Learning Studio (MyLens) — extend client/src/components/
       PresentationDiagram.tsx (the free SVG engine); progressive disclosure.
    T5 Resource Sharing & Adaptation Hub (TeachShare) — "Adapt for SEND",
       YouTube->activity.
    T6 SEND AI Teaching Agent (Canvas IgniteAI) — EHCP-linked rubrics,
       provision maps, annual-review prep.

HARD CONSTRAINTS:
  - FREE only (ARASAAC, Pexels/Unsplash, SVG, Cloudflare free tier). No paid APIs.
  - Gemini-independent: Groq is text priority-1.
  - Register every new tool in: App.tsx (lazy import + route),
    lib/tool-registry.ts, the hub page, components/CommandPalette.tsx,
    lib/prefetch.ts, components/AppLayout.tsx.
  - New server routes mirror server/routes/symbol-proxy.ts (requireAuth, 24h
    cache, host-whitelisted /fetch). Register in server/index.ts.
  - Schema additions ADDITIVE; new visual features OPT-IN + default off so
    existing output is byte-identical when off.

VERIFY (the repo does NOT pass tsc cleanly — ~146 pre-existing errors):
  - npm install --legacy-peer-deps   (REQUIRED flag, vite peer conflict)
  - prove ZERO net-new tsc errors: stash your edits, `npm run check 2>&1 |
    grep -cE 'error TS'` for the baseline, then again with edits — must match.
  - server must bundle: npx esbuild server/index.ts --platform=node
    --packages=external --bundle --format=esm --outfile=/tmp/srv.js
  - don't read PresentationMaker.tsx / ai.ts / Worksheets.tsx /
    WorksheetRenderer.tsx in full (each 5k-9.5k lines) — grep + narrow ranges.

AFTER each PR: update LEDGER.md + SESSION-HANDOFF.md, push a NEW branch off
latest main (never reuse a merged branch), open the PR, and reference it.
```
