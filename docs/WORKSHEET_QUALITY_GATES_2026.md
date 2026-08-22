# Worksheet Quality Gates and Validation Framework

**Prepared by:** Manus AI

**Status:** Active engineering and curriculum-quality standard

**Applies to:** All worksheet generation, adaptation, preview, print, PDF, history-reopen, and export paths.

> A worksheet is release-ready only when it teaches a valid, age-appropriate objective, is usable by its intended learner, and retains its contractual print layout. Attractive presentation never compensates for inaccurate content, inaccessible wording, or unreliable output.

## Purpose and Product Standard

Adaptly should earn a teacher’s trust at the point of use. A busy teacher must be able to choose a subject, stage, topic, support profile and reading age, then receive a worksheet that is immediately teachable, visibly purposeful, printable, and recoverable. A SENCO or inclusion lead must be able to see that an adjustment removes a barrier without secretly reducing the academic entitlement. A school buyer must be able to rely on predictable page counts, stable PDFs, clear feedback and evidence that quality is actively governed.

The platform therefore uses four concurrent standards: **curriculum validity**, **instructional usefulness**, **inclusive access**, and **output integrity**. None is optional.

| Standard | Non-negotiable release question | Failure examples |
|---|---|---|
| Curriculum validity | Does the worksheet teach the stated age/stage objective accurately and at the intended level? | Invented facts, incorrect worked solution, off-spec GCSE task, primary wording that assumes secondary knowledge |
| Instructional usefulness | Could a class teacher use it within a real lesson with minimal repair? | Decorative content without a clear objective, no model where one is necessary, weak question progression, answers leaked to pupils |
| Inclusive access | Does the selected support remove barriers while preserving the learning objective and academic demand? | Support that changes the answer or question, sensory overload, inaccessible contrast, unsupported diagnosis claims |
| Output integrity | Does the intended preview/print/PDF survive without overlap, cropping, reflow, unsafe diagram, or page-count change? | Text colliding with question boxes, wrong paper orientation, blank/extra pages, tinted protected paper, clipped answer area |

## Curriculum and Stage Quality Rules

The primary curriculum includes English, mathematics, science, design and technology, history, geography, art and design, music, physical education, computing, and languages at Key Stage 2. It groups Key Stage 2 English, mathematics and science programmes into lower Key Stage 2 (Years 3–4) and upper Key Stage 2 (Years 5–6). GCSE subject-content publications define the knowledge, understanding and skills common to GCSE specifications, while GCSE qualifications have subject-level requirements and assessment guidance. [1] [2] [3]

The platform must use these references as **content boundaries**, not as a licence to imitate examination-board material. Every GCSE worksheet must identify its subject, topic, intended year, and where applicable board context. It must use accurate disciplinary vocabulary, a defensible progression from recall through application, and no claim of being an official exam paper unless sourced and labelled as such.

| Learner stage | Required instructional characteristics | Visual and language characteristics | Disallowed patterns |
|---|---|---|---|
| KS1 (Years 1–2) | One small objective; concrete examples; a clear model; short practice steps; repeated retrieval in a playful but purposeful form; enough answer space for developmental writing/drawing | Short sentences, one instruction at a time, familiar vocabulary, large type, clear icons/illustrations where they teach, warm but restrained colour cues and spacious grouping | Dense prose, multi-clause directions, secondary terminology without explanation, decorative images that obscure tasks, more than one unscaffolded cognitive jump per task |
| Lower KS2 (Years 3–4) | Explicit objective, worked example where procedural knowledge is new, deliberate practice, short explanation prompts, vocabulary support | Short paragraphs, labelled visual models, consistent colour categories and reading order | Infantilised language, unnecessary worksheet clutter, unsupported leaps from example to extension |
| Upper KS2 (Years 5–6) | Clear objective and success criteria, increasingly independent practice, explanation and reasoning prompts, age-appropriate academic vocabulary | Mature primary visual tone, diagrams/data where meaningful, visual hierarchy that supports rather than substitutes for thinking | KS3-level abstraction presented as core content, babyish decoration, ambiguous multi-step demands |
| KS3 (Years 7–9) | Subject-specific vocabulary, sequenced examples, increasing disciplinary reasoning, purposeful checks for understanding | Calm, professional, concise layouts with supportive landmarks and minimal distraction | Primary-styled visuals without rationale, content that only rehearses recall where application is expected |
| KS4/GCSE (Years 10–11) | Accurate specification-aligned objective, explicit command words, graduated exam-style practice, correct calculations/evidence, separate teacher answers, targeted misconceptions | Print-ready professional design; text, data and diagrams that a GCSE teacher could plausibly issue without reauthoring | Fabricated sources/data presented as real, unexplained answers, an inaccurate mark scheme, generic filler or vaguely related questions |

## SEND and Reading-Age Quality Rules

The SEND Code of Practice applies to schools and other named bodies in England. Reasonable adjustments are intended to minimise disadvantage and help pupils access education on an equal basis; they should be agreed, recorded, reviewed and adapted where needed. [4] [5] Platform profiles are therefore **support choices**, not diagnoses, prescriptions, or guarantees of impact.

A reading-age setting may simplify vocabulary, shorten sentence structure, split instructions, and provide a clear definition at the point of need. It must never change the underlying question, correct answer, required mathematical operation, historical evidence, scientific concept, page count, or protected geometry. Where an objective cannot be expressed safely at a requested reading age without distorting it, the worksheet must retain the academically necessary term and support it with a plain-language explanation.

| Adaptation family | Permitted support | Required verification | Prohibited effect |
|---|---|---|---|
| Dyslexia / visual processing | Choice of approved typeface, generous spacing, chunked instructions, visually stable hierarchy, optional coloured outline cues | White protected paper/card interiors; no reflow; reading order remains intact; vocabulary-only reading-age change | Changing calculation, deleting essential detail, contrast so low that printed text becomes inaccessible |
| ADHD / working memory | One action per instruction, brief task chunks, visible completion points, limited optional attention reset prompts | No task loss; each chunk retains the original answer demand; attention aids remain non-overlapping | Turning a multi-step objective into an easier objective, adding distractive decoration |
| ASC / anxiety / SEMH | Literal language, predictable sequence, calm framing, reduced ambiguity, optional advance organiser | No diagnostic or therapeutic assertion; no patronising language; task demand unchanged | Clinical claims, coercive language, sensory overload, hiding important assessment criteria |
| SLCN / EAL | Concrete wording, labelled examples, word banks where pedagogically justified, sentence stems, explained technical vocabulary | Technical words retained where academically required; translations/definitions do not alter answer correctness | Replacing the subject concept with a vague synonym or providing the answer as a scaffold |
| Dyscalculia | Explicit mathematical notation, place-value clarity, one calculation action at a time, worked method and checked alignment | Expressions, examples, marks, answer pathways and question count remain correct | Altering equations, changing numerical difficulty without a separate differentiated task contract |
| Visual / hearing / motor access | Text alternatives, legible labels, non-colour-only meaning, generous writing space and clear diagrams | Keyboard/reader route where applicable; diagram labels are usable and non-overlapping | Colour as the only carrier of meaning, tiny labels, inaccessible image-only instruction |

## Protected Layout Contracts

### Maths: Immutable Gold Layout

KS3/KS4 Mathematics in Years 7–11 must use only approved JSON/PDF templates and the dedicated Maths renderer. It must generate **exactly two A4 landscape pages**. Approved titles, worked examples, questions, answers, section order, boxes, equations and geometry are fixed. The system must reject an unsupported or ambiguous prompt rather than produce a generic or portrait fallback.

### Science and Humanities: Dedicated Layouts

Supported Science topics use a dedicated one-page A4 landscape document. Implemented English, History, Geography and Business documents use dedicated two-page A4 landscape layouts. These routes may use subject-appropriate content and support labels, but must retain white paper/card interiors, correct orientation, and their renderer-specific page count.

### Layout Acceptance Rules

| Check | Maths Gold | Dedicated Science | Dedicated English/History/Geography/Business | Generic/primary route |
|---|---|---|---|---|
| Page count | Exactly 2 | Exactly 1 | Exactly 2 | Explicit target or sensible automatic count; no accidental blanks |
| Paper/orientation | A4 landscape | A4 landscape | A4 landscape | Stated in generated/print configuration |
| Paper/card background | White only | White only | White only | May use child-friendly colour in headers/cues only; printable task field remains high-contrast and readable |
| Geometry | Immutable | Renderer-controlled | Renderer-controlled | Responsive but collision-free; answer space survives print |
| Reading-age / SEND effect | Vocabulary/support notes and approved visual outline only | Wording/support label only within renderer contract | Wording/support label only within renderer contract | May adapt typography and task scaffolds subject to content and access rules |
| Overlap/cropping | Zero tolerance | Zero tolerance | Zero tolerance | Zero tolerance |

## Visual and Commercial Experience Standard

The application should feel calm, trustworthy and premium, not noisy. Colour is a teaching signal rather than decoration. For KS1 and KS2, visual design should use clear subject-category colour, purposeful icons, visual models, and generous white space to make a task inviting. For KS3/KS4, the visual language should be professionally restrained: colour should emphasise objective, method, hint, evidence, and answer-space hierarchy without reducing print quality or exam credibility.

Teacher-facing controls must be understandable on first use. Every long-running task requires visible progress, a bounded timeout, a cancellation or escape path where technically safe, clear error detail, and a retry/fallback route. Every successful save/export must make its result visible. A protected fixed layout must explain why direct free-form editing is unavailable and offer a safe alternative rather than present a misleading edit surface.

## Evidence Requirements and Test Matrix

The scope separates **exhaustive programmatic coverage** from **representative human curriculum review**. Every deterministic protected template/profile/reading-age combination will receive structural and visual-collision testing. Every implemented subject/stage route will receive representative teacher-quality review using real in-repository content. AI-backed paths will be tested through controlled, non-consequential generation cases and output contracts; claims will not exceed observed provider results.

| Test level | Coverage | Pass criteria | Evidence |
|---|---|---|---|
| Exhaustive deterministic layout matrix | Every approved Maths template × every supported SEND profile × every supported reading-age band; every dedicated Science and Humanities route × same profile/band matrix | Correct route/page count/orientation/white background; no content/answer/geometry drift; no overflow/collision markers | Automated test result, rendered HTML/PDF metadata, contact sheets where visual review is needed |
| Subject-stage curriculum matrix | Every implemented subject with KS1, lower KS2, upper KS2, KS3 and KS4/GCSE examples where the product supports that stage | Objective, vocabulary, question progression, answer accuracy and required content match the appropriate curriculum boundary | Teacher-review checklist, worksheet evidence, defect log |
| SEND access matrix | Each active SEND profile across a representative primary, KS3 and GCSE route | Support is visible, purposeful, non-diagnostic and does not lower the objective | Before/after textual comparison and visual check |
| Reading-age invariance matrix | Reading-age bands 6–7 through 17+ on fixed-layout routes and all supported bands on generic routes | Vocabulary/sentence changes only; questions, answers, marks, page contract and geometry remain stable where fixed | Semantic comparison and renderer assertions |
| Workflow matrix | Generate, Auto from class, differentiate, save, reopen History, print, PDF, Braille, Lesson bundle, upload, Exam Bank and safe entry actions | Success/failure/cancel/retry/timeout states are visible; no misleading completion state; no consequential action without confirmation | Action log, screenshots, test results |
| Responsive/accessibility matrix | Desktop, tablet and mobile widths; keyboard, focus, live status, iframe review | No clipped action bars, unreachable controls, lost focus, or unannounced long-running state | Screenshot set, manual accessibility notes |

## Release Decision Rules

A release is blocked by any protected-layout violation, subject-content error, answer leak, unsafe diagram, non-white protected paper surface, overlap/cropping, unbounded core workflow, or unsupported claim of curriculum/specification alignment. A release may proceed only with explicitly documented lower-severity visual or copy issues that have a safe workaround and do not compromise the worksheet contract.

Every test run must be written to `/home/ubuntu/worksheet_generator_audit_results.md` with the action, expected result, actual result, evidence, defect, owner/fix status and deployed commit where relevant. No feature is described as passed until the appropriate evidence exists.

## References

[1] [GOV.UK, *The national curriculum: Key stage 1 and 2*](https://www.gov.uk/national-curriculum/key-stage-1-and-2)

[2] [GOV.UK, *GCSE subject content*](https://www.gov.uk/government/collections/gcse-subject-content)

[3] [GOV.UK, *GCSEs (9 to 1): requirements and guidance*](https://www.gov.uk/government/collections/gcses-9-to-1-requirements-and-guidance)

[4] [GOV.UK, *SEND code of practice: 0 to 25 years*](https://www.gov.uk/government/publications/send-code-of-practice-0-to-25)

[5] [Department for Education, *What are reasonable adjustments and how do they help disabled pupils at school?*](https://educationhub.blog.gov.uk/2023/04/what-are-reasonable-adjustments-and-how-do-they-help-disabled-pupils-at-school/)
