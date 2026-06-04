# Differentiate — Fidelity-Preserving SEND Overlay Plan

> Goal: a teacher uploads their own worksheet in **any** format (photo, PDF,
> Word, etc.) and gets it back with the **content, context and structure intact
> 1:1**, with Adaptly's **SEND overlays** (colours, arrows, icons, scaffolds)
> applied **on top** — never a regenerated approximation.

---

## 1. Why structure & content are being lost today (root cause)

The current upload path is `POST /api/ai/adapt-worksheet`
(`server/routes/ai.ts` ~L2070). It does this:

```
upload (PDF/Word only)
  → extract TEXT ONLY  (pdf-parse → pdfjs fallback → mammoth)
  → truncate to 10,000 chars
  → ask the LLM to REBUILD a structured worksheet (sections[])
  → render with our own template (WorksheetRenderer.tsx)
```

This is an **extract-and-regenerate** pipeline, and every symptom the user
reports follows directly from it:

| Symptom | Cause in current code |
|---|---|
| Layout/structure lost (columns, tables, boxes, question positions) | Text extraction **flattens** the document to a linear string before the LLM ever sees it. The visual structure is gone at step 2. |
| Images & diagrams disappear | `pdf-parse`/`mammoth` extract text only. No image, SVG, or figure is carried through. |
| Content dropped / reworded | The LLM is asked to **re-emit** all content as JSON. Despite "verbatim" instructions, LLMs reflow, renumber, and occasionally drop content. 10k-char truncation silently cuts long worksheets. |
| "Could not extract readable text" on photos/scans | Images and scanned PDFs have no text layer; the route rejects them outright (`allowedMimes` excludes images). The user explicitly wants "picture … anything". |
| Maths/symbols mangled | Symbols are corrupted during text extraction and again during LLM round-trip. |

**Key insight:** our *server `overlayEngine.ts`* already preserves structure
perfectly — but only because **we generated that structure ourselves**. For an
uploaded file we are trying to *reverse-engineer* it into our section model, and
that reverse-engineering is where fidelity dies.

**The fix is architectural: stop regenerating, start compositing.** Treat the
uploaded worksheet as an immutable base layer and render SEND overlays as a
separate, coordinate-anchored layer on top — like non-destructive annotation
(Photoshop layers / PDF annotations).

```
┌─────────────────────────────────────────┐
│  OVERLAY LAYER (transparent SVG)         │  ← we generate this
│  colours · arrows · icons · callouts     │
├─────────────────────────────────────────┤
│  BASE LAYER (immutable, never touched)   │  ← the teacher's exact worksheet
│  original page, pixel-perfect            │
└─────────────────────────────────────────┘
```

Fidelity becomes **guaranteed by construction**: you cannot lose content you
never extract or rebuild.

---

## 2. Architecture overview — the 6 stages

```
1. INGEST &      2. ANALYSE        3. ADAPT          4. COMPOSE       5. REVIEW       6. EXPORT
   NORMALISE        (read-only)       (SEND brain)      & PREVIEW        & EDIT
┌───────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐   ┌──────────┐   ┌──────────┐
│ any file  │ →  │ DocumentMap│ →  │ Overlay    │ →  │ base image │ → │ teacher  │ → │ PDF/PNG  │
│ → pages   │    │ regions +  │    │ Manifest   │    │ + SVG layer│   │ tweaks   │   │ /print   │
│ (raster)  │    │ coords     │    │ (JSON)     │    │            │   │ overlay  │   │          │
└───────────┘    └────────────┘    └────────────┘    └────────────┘   └──────────┘   └──────────┘
   BASE LAYER       never mutates     only ADDS on top
```

New module home (server): `server/lib/fidelity/`
New module home (client): `client/src/lib/overlay/` + a new `OverlayCanvas.tsx`.

---

## 3. Stage 1 — Ingest & Normalise (accept *anything*, lose *nothing*)

Replace the text-only extractor with a **render-first** normaliser. The page
image *is* the base layer, so "what you uploaded" is always what you see.

| Input | Handling | Library (already in repo / to add) |
|---|---|---|
| PNG/JPG/HEIC photo | use as-is as the page raster | (none) / `sharp` for HEIC + de-skew |
| Digital PDF | render each page to high-DPI PNG **and** keep the native text+coords | `pdfjs-dist` (present) for both render + `getTextContent()` |
| Scanned PDF | render pages to PNG; flag "no text layer" → OCR in stage 2 | `pdfjs-dist` (present) |
| DOC/DOCX/PPTX | convert to PDF via LibreOffice headless, then treat as PDF | `soffice --headless --convert-to pdf` (add to nixpacks/Procfile) |

Output = a canonical `IngestedDocument`:
```ts
interface IngestedPage { index: number; width: number; height: number; imageKey: string; hasTextLayer: boolean; }
interface IngestedDocument { docId: string; source: { name: string; mime: string }; pages: IngestedPage[]; }
```
Page rasters are stored in S3 (the repo already uses `@aws-sdk/client-s3`).

> **Immediate win:** even before any overlay work, swapping the upload result to
> show the *original page image* (instead of a re-templated text rebuild) fixes
> the "structure lost" complaint on day one.

---

## 4. Stage 2 — Analyse (read-only Document Map)

Build a spatial + semantic map of each page. **Nothing is modified.**

- **Digital PDFs:** use `pdfjs` `getTextContent()` — gives exact word strings
  with transform matrices → perfect bounding boxes, **zero OCR error**.
- **Photos / scans:** OCR with word boxes. Server-side OCR (Tesseract worker, or
  a vision model via the existing `callWithFallback`) replacing the current
  client-only CDN Tesseract in `differentiate-enhancements.ts`.
- **Semantic tagging (VLM):** send the page image to a vision-capable provider
  to classify regions: `title | instruction | question | sub-question |
  answer-space | diagram | worked-example | command-word`, plus reading order.
- **Whitespace/margin detection:** find empty regions so overlays land in
  margins and **never occlude** original content.

Output = `DocumentMap` (coordinates normalised 0–1 so overlays scale to any size):
```ts
interface Region {
  id: string; page: number;
  bbox: [number, number, number, number];   // normalised x0,y0,x1,y1
  kind: "title"|"instruction"|"question"|"subquestion"|"answer-space"|"diagram"|"worked-example"|"keyword"|"whitespace";
  text?: string; readingOrder?: number; confidence: number;
}
interface DocumentMap { docId: string; pages: { index: number; regions: Region[] }[]; }
```

### Analysis tiers (vision LLM is optional — graceful degradation)

Geometry (*where*) and semantics (*what/why*) can be sourced at three tiers that
degrade gracefully. **Fidelity is tier-independent** — the base layer is never
touched, so even Tier 0 fixes the content-loss bug; tiers only change how *smart*
overlay placement is.

| Tier | Geometry | Semantics | Privacy | Best for | In repo today |
|---|---|---|---|---|---|
| **0 — Rules only** | `pdfjs` text+coords (digital) / Tesseract word boxes (scans) | regex + heuristics: question numbering, command-word list, answer-lines = underscore/ruled-line runs, whitespace = margins | 100% local, nothing leaves | digital PDFs; max-privacy schools | `pdfjs-dist`, `tesseract.js` |
| **1 — Text LLM** | as Tier 0 | send **text + coords** (not the image) to `callWithFallback` to tag regions & pick overlays | image never leaves; text does | smarter placement without sending pictures | `callWithFallback` (18 providers) |
| **2 — Vision LLM** | OCR boxes for precise anchoring | VLM reads the **page image** | image leaves the building | photos, handwriting, complex multi-column layouts | vision-capable providers |

**Why a vision LLM helps:** works on photos/scans with no text layer; understands
pedagogy ("this blank is where the pupil writes", command words, tier-3 vocab);
infers reading order in messy layouts. **Watch-outs:** VLMs return *imprecise*
bounding boxes (so anchor to OCR geometry, use the VLM only for semantics);
sending pupil work to a provider raises GDPR/LIA concerns; higher cost/latency
and run-to-run variance.

**Recommended:** hybrid + a **school-level consent toggle** tied to the existing
Legitimate Interests Assessment — digital PDFs use Tier 0/1 (precise, private);
photos/scans use Tier 1 or Tier 2 per the school's data-protection choice. When
vision is used, anchor overlays to OCR boxes, never to VLM-reported coordinates.

---

## 5. Stage 3 — Adapt (the SEND brain → an Overlay Manifest)

Given the `DocumentMap` + the teacher's chosen `sendNeed` (reuse the rich
taxonomy already in `client/src/lib/send-data.ts`: `sendNeeds`, `subProfiles`)
and optional `colorOverlay`, the engine emits **constrained JSON** — never a
document. This is the single most important artifact.

```ts
type OverlayKind = "highlight"|"colour-zone"|"icon"|"arrow"|"callout"|"step-badge"|"chunk-divider"|"page-tint";

interface OverlayElement {
  id: string; page: number; kind: OverlayKind;
  bbox: [number, number, number, number];     // normalised, where to draw
  anchorRegionId?: string;                     // ties it to a DocumentMap region
  connectsTo?: string;                         // for arrows/callouts
  text?: string; icon?: string; colour?: string; opacity?: number;
  placement?: "on"|"margin-left"|"margin-right"|"above"|"below";
  reason: string;                              // teacher-facing rationale (audit trail)
}

interface OverlayManifest {
  docId: string; sendNeed: string; subProfile?: string; colorOverlay?: string;
  profileLabel: string;                        // neutral label, never the condition name
  overlays: OverlayElement[];
}
```

Design rules (mirroring the existing `overlayEngine.ts` contract):
- **Additive by default** — the original questions/text are *never rewritten*.
  Simplified wording appears as a **callout** beside the question, not in place.
- Support labels use **neutral pedagogical names** (existing rule).
- Overlays target **whitespace/margins**; collision detection prevents covering
  content; opacity caps keep the base legible.
- Schema validated with **zod** in `shared/aiSchemas.ts` (repo already uses zod
  + a post-validator chain).

### SEND overlay primitive library (reuse existing colour science)
- **Colour zones / highlights** — code question types, command words, sections
  (use `colorOverlays` palette in `send-data.ts`; colour-blind-safe).
- **Page tint** — Irlen-style overlay (the existing cream/pale-yellow/etc).
- **Arrows / connectors** — "start here", reading order, link diagram↔question.
- **Icons** — read · write · draw · think · discuss · calculator-ok · tick-box.
- **Step badges & chunk dividers** — break a busy page into ordered steps.
- **Callouts** — vocabulary definitions, sentence starters, "what to do" boxes
  (the same pedagogy `buildSupportSection()` already produces, now positioned).

---

## 6. Stage 4–6 — Compose, Review, Export

- **Compose (client):** new `OverlayCanvas.tsx` renders the **base page `<image>`
  + an absolutely-positioned `<svg>` overlay**. SVG is vector-crisp, supports
  text/shapes/arrows/icons/transparency, and scales with normalised coords.
- **Review/Edit:** because the overlay is just an editable manifest decoupled
  from the base, the teacher can drag/recolour/delete/add overlays before
  printing — and a human verifies SEND accuracy (important for an education
  product). This replaces the current "Edit with AI / Edit Manually" text flow.
- **Export:**
  - *Print/PDF:* flatten base image + SVG to PDF. Repo already has `jspdf` +
    `html2canvas` (used in `pdf-generator.ts`); for crisper output, render the
    composed SVG server-side.
  - *Digital:* keep layers live (e.g. a "focus mask" dimming all but the current
    question — strong for ADHD/attention).
  - *Accessible companion (optional):* a reflowed screen-reader version generated
    *alongside* the faithful one (this is the **only** place we regenerate text,
    and it is clearly separate from the 1:1 output).

---

## 7. Fidelity guarantees (how we prove 1:1)

This extends the repo's existing `structurePreserved` philosophy from
`overlayEngine.ts` to uploaded files:

1. **Base immutability** — the rendered page image is content-hashed; the export
   must contain that exact base. If the hash changes, fail loud (dev) / warn
   (prod), exactly like `assertBaseSectionsPreserved`.
2. **Additive-only overlays** — manifest validation rejects any element that
   would replace base text in the 1:1 output.
3. **Non-occlusion check** — reject/relocate overlays whose opaque area covers a
   `question`/`diagram`/`answer-space` region beyond a threshold.
4. **Audit trail** — every overlay carries a `reason`, surfaced in the existing
   audit-trail panel pattern (`metadata`), so a SENCO can justify each change.

---

## 8. What changes vs. what we reuse

**Reuse (no churn):**
- SEND taxonomy & copy: `send-data.ts` (`sendNeeds`, `subProfiles`, `colorOverlays`).
- Support-box pedagogy: `server/lib/overlayEngine.ts` `build*Support()` becomes
  the **content source** for `callout` overlays.
- LLM routing: `callWithFallback` in `server/routes/ai.ts`.
- Storage: S3 client; zod schemas in `shared/`; post-validator chain.
- Export plumbing: `jspdf` / `html2canvas` / `pdf-generator.ts`.

**New:**
- `server/lib/fidelity/ingest.ts` — render-first normaliser (all formats).
- `server/lib/fidelity/analyse.ts` — DocumentMap (pdfjs coords + OCR + VLM).
- `server/lib/fidelity/manifest.ts` — overlay manifest builder + zod schema.
- `POST /api/ai/adapt-worksheet` — **rewritten** to return
  `{ document, documentMap, overlayManifest }` instead of rebuilt `sections[]`.
- `client/src/lib/overlay/` + `client/src/components/OverlayCanvas.tsx`.
- Differentiate page: add an **Upload** entry point (today it is paste/type
  only — see `client/src/pages/tools/Differentiate.tsx`) wired to the canvas.

**Backwards compatible:** the existing AI-generated worksheet path
(`WorksheetRenderer` + `overlayEngine`) is untouched. This plan only changes the
**uploaded-file** path.

---

## 9. Phased roadmap

- **Phase 1 — Faithful base (fixes the bug immediately).**
  Accept images + PDF + Word; render pages to images; show the **original** in
  the UI. No overlays yet. Removes all structure/content loss.
- **Phase 2 — Document Map.** pdfjs coords for digital PDFs; OCR + VLM tagging
  for photos/scans; whitespace detection.
- **Phase 3 — Overlay manifest + zod schema + SEND brain** (rules + LLM, additive).
- **Phase 4 — OverlayCanvas compositor + preview.**
- **Phase 5 — Teacher review/edit of the overlay layer.**
- **Phase 6 — Export (print PDF, digital focus-mask, accessible companion).**

---

## 10. Open decisions

1. **Print-first or interactive-first** for the first release?
2. **OCR/VLM hosting:** server Tesseract vs. a vision provider via
   `callWithFallback` — affects student-data privacy (UK GDPR / the repo's
   `Legitimate_Interests_Assessment_Adaptly.md`).
3. **LibreOffice availability** on the deploy target (Railway/Netlify/nixpacks)
   for DOCX→PDF — or use a hosted conversion step.
4. **One profile per export, or multiple variants** from a single upload?
5. Multi-page worksheets: per-page manifests (assumed yes).
