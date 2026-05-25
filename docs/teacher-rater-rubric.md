# Teacher-Rater Rubric — Worksheet Quality

> **Status:** v1.0, 2026-05-25. Hand-offable to any practising UK
> classroom teacher with ≥3 years' experience in the relevant
> subject + key stage.
>
> **Use:** rate one worksheet against all 6 axes, 1–5 per axis. Total
> is informational only — every axis matters in isolation. A
> worksheet scoring 5/5/5/5/5/2 fails on UX/printability and is not
> publish-ready, regardless of the other five.
>
> **Time budget:** ~7 minutes per worksheet at the rater's pace,
> assuming familiarity with this rubric.

## Where this fits in the eval pipeline

This rubric is the **leading indicator** for worksheet quality. Two
ratings sources feed the eval harness:

1. **Model-judge scores** — a separate LLM (Claude judging GPT
   output, or vice versa) rates against this exact rubric, scoring
   1–5 per axis. Cheap, runs nightly, populates the dashboard
   immediately. See `server/tests/worksheet-eval/modelJudgeRater.ts`.

2. **Human-rater scores** — paid teachers rate against the same
   rubric. Slow, expensive, but the **gold signal** the model-judge
   is calibrated against. Captured as CSV and threaded into the
   harness via `eval-report.json`'s `humanScores` field (additive,
   optional — runs without it).

When both are present in a report, the dashboard shows two columns:
"model-judge" and "human" per axis. Drift between them is the
single most important signal — when human ratings move and the
model-judge doesn't follow, the prompt for the model-judge needs
recalibrating against the new human anchors.

---

## The 6 axes

| Axis | Short name | What it measures |
| ---- | ---------- | ---------------- |
| 1 | **Curriculum fidelity** | Does this worksheet teach what the spec says, at the right level? |
| 2 | **Stem authenticity** | Do the questions sound like a real exam? |
| 3 | **Accessibility** | Can every pupil in the target group physically + cognitively access this? |
| 4 | **Marks & answers tightness** | Is the mark scheme correct, and do the marks match the work asked for? |
| 5 | **SEND alignment** | Does this match the declared SEND profile in evidenced ways, not just by adding a banner? |
| 6 | **UX & printability** | Does this print well, look professional, and respect a teacher's prep time? |

## Scoring scale (applies to every axis)

| Score | Label | Meaning |
| :---: | ----- | ------- |
| **5** | **Exemplary** | Indistinguishable from a worksheet a HoD would put in the department's exemplar bank. Could be used in a Year-Lead briefing as a model. |
| **4** | **Solid** | A teacher would use this without modification. One or two small things they'd tweak in passing, but nothing that blocks use. |
| **3** | **Usable with edit** | A teacher would use this after 5–10 minutes of editing. The bones are right; details need fixing. Acceptable for a cover lesson, not for an observation. |
| **2** | **Significant rework** | A teacher would either rewrite from scratch or drop large sections. Bones are wrong somewhere — wrong level, wrong command words, wrong answers. |
| **1** | **Unusable** | A teacher would not give this to pupils. Misleads, contradicts the curriculum, or is structurally broken. |

A score of 0 is not used — the lowest is 1 (unusable). A worksheet
that doesn't generate at all is reported as `generationError`, not
score 0.

---

## Axis 1 — Curriculum fidelity

**Question:** Does this worksheet teach what the spec for this
(subject, year group, exam board) says it should teach, at a
cognitively appropriate level?

**What to look for:**
- Spec-point references on every question (or at least the section)
  that match a real published taxonomy entry — not invented codes.
- Cognitive level matches the year group (e.g. Year 7 maths doesn't
  ask for AQA-style 4-mark "evaluate" extended responses; Year 11
  Higher doesn't dwell on number-line addition).
- Subject-appropriate command words (Define / Describe / Explain /
  Evaluate / Calculate / Justify) used correctly per the awarding
  body's own glossary.
- Topic stays in scope. A Year 9 photosynthesis worksheet shouldn't
  drift into respiration mid-section without scaffolding.

### Anchors

| Score | Anchor |
| :---: | ------ |
| **5** | Every question carries a verified spec-ref; the cognitive ramp matches the year group precisely; command words are used in the exact sense the awarding body's glossary defines them; one or two questions stretch into the next mark band in a way a HoD would call "deliberate, evidenced extension". |
| **4** | Spec-refs present and accurate on ≥90% of questions; cognitive level right for the year group; command words used correctly; topic is in scope throughout. Minor: one question's specRef is approximate but defensible. |
| **3** | Spec-refs present but ~30% are generic ("AQA-MATHS-1") rather than specific ("AQA-MATHS-N1.5"); cognitive level mostly right but one or two questions feel a year too easy or hard; topic occasionally drifts into adjacent material. |
| **2** | Spec-refs are absent or invented (no matching code in any published taxonomy); cognitive level is consistently wrong for the year group (Y7 worksheet asks GCSE-grade extended responses, or Y11 worksheet sticks to Y7 fundamentals); command words misused (asking pupils to "Describe" when the marks suggest "Explain"). |
| **1** | Worksheet teaches the wrong subject or year. A "Year 8 Geography — Tectonics" worksheet that turns out to be a Year 5 reading-comprehension on volcanoes. Or content that contradicts the curriculum (e.g. teaching that division by zero is "very small" rather than undefined). |

---

## Axis 2 — Stem authenticity

**Question:** When you read the question stems aloud, do they sound
like questions written by a principal examiner, or like questions
written by a chatbot?

**What to look for:**
- Voice and cadence of real past papers for that board: present-tense
  imperatives, specific numbers, named contexts, no AI-tells like
  "Let's explore…" or "In this exciting question…".
- Concrete contexts: "A 200 g block of copper at 80 °C…" beats
  "Imagine an object with some mass…".
- Mark allocations attached visibly: "(3 marks)" at end of stem.
- No leaked instructions to the AI: "Generate a question about…",
  "[INSERT QUESTION HERE]", "(replace with diagram)".
- Distractors in MCQs are pedagogically real misconceptions, not
  obvious throwaways.

### Anchors

| Score | Anchor |
| :---: | ------ |
| **5** | A teacher reading these aloud would believe they came from a real AQA paper. Specific named contexts, principal-examiner cadence, no AI-tells. Distractors in any MCQs match published examiner reports for known misconceptions on this topic. |
| **4** | Stems sound exam-grade with one or two slightly stilted phrasings; distractors mostly real-misconception-shaped; no leaked AI instructions. |
| **3** | Stems are clear and answerable but generic — could be from any board, any year. "Calculate the area of the rectangle" without a context. Distractors are plausible but a teacher would replace one or two. |
| **2** | Stems sound like a chatbot wrote them. "Let's calculate…", "In this fun question…", or contain meta-language ("This 3-mark question requires you to…"). Distractors are obvious throwaways (e.g. for a fractions MCQ: "1/2", "1/4", "purple", "tomorrow"). |
| **1** | Stems are nonsensical, ungrammatical, or carry leaked instructions visible to the pupil ("[INSERT WORKED STEPS HERE]", "Generate a question about…"). |

---

## Axis 3 — Accessibility

**Question:** Can every pupil in the declared target group physically
read, parse, and attempt this worksheet?

**What to look for:**
- Reading age within ± 1.5 years of the declared target (default:
  year-group reading age unless `readingAge` is set).
- No diagrams that pupils with low vision can't parse (text labels
  too small, key colour-coded only).
- Tier-3 vocabulary introduced in a Word-Bank section, not assumed.
- Sentence length: max ~25 words for KS3, ~30 for KS4, ~20 for SEND.
- Maths notation is correctly rendered (½ not 1/2 in display contexts;
  superscripts where needed).
- No hostile typography (long unbroken paragraphs in 9pt; tables
  that won't fit one A4 column).

### Anchors

| Score | Anchor |
| :---: | ------ |
| **5** | Reading age dead-on target. Every Tier-3 word defined in a Word Bank up front. Diagrams use shape + colour + label so a colour-blind pupil can still parse. Sentence length sits in the target band throughout. Notation is print-quality (proper fractions, superscripts, units). |
| **4** | Reading age within ± 1 year of target; one or two Tier-3 words used without prior Word-Bank definition; diagrams are accessible with a small caveat (e.g. uses orange/blue but a colour-blind pupil might struggle with a single legend entry). |
| **3** | Reading age 2–3 years off target (under or over); some Tier-3 vocabulary unexplained; one or two paragraphs are too long; notation has minor issues (1/2 instead of ½). A pupil could complete with teacher help. |
| **2** | Reading age 4+ years off target; Tier-3 vocabulary used without scaffolding; long unbroken paragraphs; diagrams rely entirely on colour without shape or label fallback. A pupil from the target group would stall before answering. |
| **1** | Worksheet is illegible to the target group: reading age catastrophically wrong (Y4 pupil given an A-Level passage), diagrams uninterpretable, notation broken (`x^2` rendered as literal `x^2` instead of x²). |

---

## Axis 4 — Marks & answers tightness

**Question:** If a pupil gave the model answer, would the mark
scheme award the stated marks? Would a careful pupil reading the
mark scheme ahead understand exactly what's being assessed?

**What to look for:**
- Mark allocation is plausible: 1 mark per discrete point typical;
  longer marks justified by the work the question asks for.
- Mark scheme is **complete** (every question has an entry) and
  **correct** (the model answer would actually score the marks).
- Working-out / showing-method marks specified separately from
  answer marks where appropriate ("M1 for setting up the equation,
  A1 for correct simplification").
- No giveaway answers in the question stem.
- Calculation answers are mathematically correct (the worksheet
  passes `mathsVerifier` with no rewrites needed).
- AO codes (AO1/AO2/AO3) match the cognitive demand of the question.

### Anchors

| Score | Anchor |
| :---: | ------ |
| **5** | Mark scheme is exam-grade: M1/A1 split where appropriate, named-points lists for description marks, BOD/CON/ECF guidance where relevant. Every model answer scores its allocated marks against its own scheme. AO codes are accurate. A pupil could revise from this scheme alone. |
| **4** | Mark scheme is complete and correct; one or two questions could use clearer M1/A1 separation; AO codes are mostly right. |
| **3** | Mark scheme is present but lightweight — model answers are given without showing what each mark is awarded for. A teacher would fill in detail before marking. AO codes are present but generic. |
| **2** | Mark scheme has gaps (one or more questions have no entry) or contradictions (model answer wouldn't score the stated marks). Mathematical answers contain numerical errors. AO codes wrong or missing. |
| **1** | Mark scheme is absent, fabricated ("see above" with no above), or contradicts the question (Q asks for a graph, MS gives a percentage). Model answers wrong. Could not be used to mark. |

---

## Axis 5 — SEND alignment

**Question:** When the worksheet declares a SEND profile (e.g.
"dyslexia", "ADHD", "ASC sensory", "EAL"), does the worksheet
*evidence* the adaptation, or just stamp a banner?

**What to look for:**
- Concrete adaptations matching the named profile's known support
  surface (dyslexia: dyslexia-friendly typography, sentence
  shortening, no narrative-comprehension dump; ADHD: chunked tasks,
  visible time markers, frequent task changes; ASC sensory: muted
  colour palette, predictable structure, advance notice of
  transitions).
- The `metadata.sendFidelityReport` ratio is high (≥0.7) — at least
  70% of the profile's rules show evidence in the rendered output.
- No "tokenistic" SEND ("This worksheet is dyslexia-friendly!" with
  no actual changes vs the non-SEND version).
- No actively counter-productive choices (using red/green for
  feedback on a colour-blind pupil's worksheet; long verbal-output
  prompts on a Selective Mutism profile).

### Anchors

| Score | Anchor |
| :---: | ------ |
| **5** | Every rule in the named profile's spec shows visible evidence in the worksheet. A SENCo would identify the profile from the worksheet without being told. Adaptations are pedagogically sensible (not patronising, age-appropriate). |
| **4** | Most profile rules evidenced; one or two are missing but the worksheet is unmistakably adapted for the profile. A SENCo would call it "good" rather than "exemplary". |
| **3** | The profile is named in metadata but only ~40–60% of its rules show evidence. Some adaptations are token (font tweak only) rather than substantive. A pupil with the profile would benefit but not as much as they could. |
| **2** | The profile is stamped but the worksheet is essentially the non-SEND version. Or the adaptations are wrong for the profile (e.g. adding more verbal-discussion prompts to a Selective Mutism worksheet). |
| **1** | Adaptations actively harm a pupil with the profile (red/green feedback on a colour-blind sheet, dense unstructured text on a dyslexia sheet, a "Speak to your partner" task on a Selective Mutism sheet). Worse than no adaptation. |

When the fixture has no `sendNeed` declared, this axis is **not
scored** (set to `null`) — not given a default 5.

---

## Axis 6 — UX & printability

**Question:** A teacher prints 30 of these for first period. Are the
copies usable?

**What to look for:**
- Page breaks are sensible — questions don't split across pages mid-
  stem (unless deliberately, with a "continued on next page" cue).
- Diagrams render at print quality (300 dpi or vector); no
  pixel-blurred raster on what should be a clean line drawing.
- Margins respect printer-safe area; nothing critical in the bleed.
- Whitespace where pupils need to write is realistic (a 4-mark
  question gets ≥4 lines, not 1 cramped line).
- No double mark schemes (one teacher-only, one accidentally
  pupil-visible); the answer key is on its own page or visibly
  marked "TEACHER".
- Font is readable at print size (≥11pt for body, ≥14pt for
  primary).
- Worksheet looks professional, not "made by AI in a hurry":
  consistent typography, no orphaned headers, no leftover
  generation breadcrumbs.

### Anchors

| Score | Anchor |
| :---: | ------ |
| **5** | Indistinguishable from a published worksheet at first glance. Page breaks are clean, diagrams print sharp, whitespace matches the work asked for, teacher-only sections are unmistakably labelled. A teacher could photocopy 30 and hand them out without apology. |
| **4** | Minor cosmetic issues — one orphaned header at a page break, slightly tight whitespace on one extended-response question — but nothing that blocks use. |
| **3** | Useable but rough: a question splits awkwardly across a page, one diagram is slightly low-resolution, whitespace is uneven. A teacher would print but apologise. |
| **2** | Significant print issues: critical content in the bleed, mark scheme accidentally on the pupil page, illegible diagram, font too small. A teacher would NOT print as-is — they'd open the file and edit first. |
| **1** | Worksheet is unprintable as designed: extends past the printable area, fonts render as boxes, diagrams are missing or broken, generator breadcrumbs ("[INSERT IMAGE]") visible to pupils. |

---

## How to record a rating

For one worksheet:

```
Axis 1 — Curriculum fidelity:    4 (one specRef was generic; otherwise exam-grade)
Axis 2 — Stem authenticity:      3 (stems are clear but cadence is slightly chatbot-y)
Axis 3 — Accessibility:          5 (reading age dead-on, all Tier-3 in word bank)
Axis 4 — Marks & answers:        4 (mark scheme right but lacks M1/A1 split)
Axis 5 — SEND alignment:         (n/a — no sendNeed declared)
Axis 6 — UX & printability:      4 (one orphaned header, otherwise clean)

Notes (optional, free text):
- Q4 specRef should be MA-N1.5 not MA-N1.
- "Imagine you're a chemist" stem in Q7 is the AI-tell.
```

Thread the scores into the harness CSV format below so the eval
dashboard can pick them up.

## CSV format for batch human ratings

`humanScores.csv` lives next to `eval-report.json`. Columns:

```
fixtureId,raterId,curriculumFidelity,stemAuthenticity,accessibility,marksAndAnswers,sendAlignment,uxAndPrintability,notes
```

Example row:

```
y10-aqa-maths-quadratics,RATER-A,4,3,5,4,,4,"Q4 specRef generic; Q7 stem AI-tell"
```

Empty `sendAlignment` cell ⇒ axis not applicable for this fixture
(no sendNeed). Two raters per fixture is enough to compute a
median and an inter-rater agreement signal. Raters are anonymous in
the report — `raterId` is opaque.

## Calibration: model-judge vs human

When both columns are present in `eval-report.json`:

- **Per-axis agreement** = mean absolute difference between
  model-judge and median human, per axis, across the corpus.
- A model-judge that is consistently 0.5 or less off the human
  median per axis is the goal. Drift > 1.0 on any axis means the
  judge prompt for that axis needs recalibrating against new
  human anchors.

This rubric is the contract that keeps both sides honest.
