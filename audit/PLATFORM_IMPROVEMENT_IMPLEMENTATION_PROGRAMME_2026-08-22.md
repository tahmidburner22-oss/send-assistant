# Adaptly Platform Improvement Implementation Programme

**Date:** 22 August 2026
**Principle:** Win through a trusted, connected teaching workflow—not an unstructured catalogue of AI tools.

## Product position

Adaptly’s defensible advantage is a **UK SEND-aware teaching workspace** that connects curriculum provenance, meaningful adaptation, protected printable materials, pupil context, assignment evidence, teacher review and next actions. This is more valuable than merely matching a large count of isolated generation tools.

## Prioritised implementation sequence

| Priority | Improvement | User outcome | Acceptance criterion |
|---:|---|---|---|
| P0 | Canonical pupil-safe assignment payload | An assigned worksheet keeps the exact intended pupil view after refresh and on another authorised staff device. | Sections, metadata, subtitle, source/provenance and pupil-safe render data are persisted and rehydrated; teacher-only material is excluded from pupil payload. |
| P0 | Server-authoritative pupil scheduler | Scheduled work runs even when a teacher’s browser is closed and has one visible source of truth. | Pupil screen reads/writes `/api/scheduler`; browser localStorage no longer controls scheduled work; errors/retries and next run survive refresh. |
| P0 | Mastery-gated progression | A pupil does not progress merely because a worksheet was generated. | The displayed current step, score/review state, teacher accept/override decision and next action match the server worker. |
| P0 | Responsive workspace navigation | Teachers have the same clear journey on desktop and mobile. | Desktop rail, mobile primary navigation and all-workspace drawer derive from one route model and are keyboard/mobile accessible. |
| P1 | Teacher/pupil worksheet-history views | A teacher can instantly verify what the pupil sees and what support was applied. | History includes clear pupil and teacher views, view-specific controls, provenance, SEND adaptation summary and assignment status. |
| P1 | Daily teaching dashboard | The most important tasks are visible without tool hunting. | Home highlights upcoming scheduled work, work awaiting review, recent materials and a route to the relevant action. |
| P1 | Explainable SEND adaptation rationale | Staff can understand why an adjustment exists and whether it preserved demand. | Every generated/assigned worksheet surfaces profile, visible supports, invariant academic elements and suggested classroom adjustment. |
| P1 | Review queue with safe AI-mark controls | Teachers can rapidly review work while retaining professional judgement. | Marked-pending-review assignments have accept, override and reinforce controls with auditable status changes. |
| P1 | Curriculum and evidence provenance | Teachers can trust and reuse content. | Saved material displays subject, topic, year, exam board/specification reference where available, generation time and quality validation status. |
| P1 | Mobile-friendly pupil workspace | Pupil profiles, assignments and schedule are usable on phones without dense scrolling or clipped controls. | No horizontal overflow at 320 px; primary actions are reachable; labels stay visible; controls meet target-size expectations. |
| P2 | Flexible grouping and next-step recommendations | Teachers can turn formative evidence into temporary, needs-led support. | Pupil outcome signals recommend—not automatically enforce—one of review, reinforce, stretch or regroup actions. |
| P2 | Family-safe update drafts | Parents receive concise, human-reviewed summaries of progress and next support. | Drafts omit sensitive teacher-only context by default and require explicit teacher review before copying/sending. |
| P2 | Quality and trust centre | School leaders can govern approved use instead of relying on hidden behaviour. | A school-facing page explains AI use, output-review expectations, data minimisation and the activity/audit view. |
| P2 | Smart search and recent-context recovery | Teachers can return to materials and pupils quickly. | Search recognises routes, pupils and recent work; recents reopen the correct view safely. |
| P3 | Progressive primary curriculum-reviewed renderer expansion | Younger pupils receive genuinely teachable, appealing layouts across more topics. | Each new topic pack has a curriculum review record, short-sentence policy test, print-contract test and visual review. |

## Responsive information architecture

| Workspace destination | Desktop rail label | Mobile primary action | Primary teacher question answered |
|---|---|---|---|
| Today | Today | Today | “What needs my attention now?” |
| Create | Create materials | Create | “What do I need to make?” |
| Pupils | Pupils | Pupils | “Whose learning or support am I reviewing?” |
| Review | Review & history | Review | “What was created, assigned, completed or needs a decision?” |
| Plan & support | Plan & support | Available in workspace drawer | “Which planning, SEND, EHCP and revision tools support this task?” |
| More | More | More | “Where are settings, communications, analytics and administrative tools?” |

The desktop rail will stay deliberately concise. On mobile, **Today**, **Create**, **Pupils** and **Review** become the persistent bottom actions; the drawer exposes the full structured workspace. Search remains an immediate escape route on every viewport.

## Scheduler design decision

The current implementation has two incompatible schedulers. The browser-local path is unsuitable as a source of truth because it depends on the teacher’s open browser and does not share state. The existing server worker should become the sole operational scheduler. The client will become a transparent control surface and never silently advance a learner. Teacher-triggered manual generation stays explicit; automatic generation remains limited to schedules the teacher has knowingly enabled for a pupil.

## Release gates

1. Add focused unit/integration tests for full assignment payload persistence, pupil/teacher visibility separation and scheduler API state mapping.
2. Add navigation-model tests for route coverage and responsive visual checks at phone and desktop widths.
3. Prove that a due schedule creates one assignment, records success or a recoverable retry state, and never creates duplicate work on repeated reads.
4. Re-run the full worksheet scrutiny suite, full application suite, typecheck and production build after every cohesive implementation tranche.
5. Regenerate protected worksheet samples and confirm their page contracts remain unchanged after any shared-renderer change.


## Implementation status — completed 22 August 2026

| Delivered improvement | Implementation evidence | Validation evidence |
|---|---|---|
| Unified teacher navigation | `AppLayout` now uses a concise shared route model for the desktop rail, mobile primary navigation and the extended workspace drawer. The daily journey is Today, Create, Pupils, Review & history, and Meetings & reviews; pupil work plans remain correctly inside pupil profiles rather than being confused with the school meeting scheduler. | Typecheck completed. Production bundle completed. Static local inspection was limited by the intentional development database fail-fast, so no unauthenticated workspace-session claim is made. |
| Daily attention queue | Home now surfaces teacher-facing routes for pending scheduler mark reviews, active pupil work plans and saved-material review before tool discovery. These are routes to review, not silent automatic actions. | Full suite completed after the change. |
| Trustworthy worksheet history | A reusable pupil-safe assignment-view contract persists structured sections, diagrams, subtitle and education/SEND provenance through assignment creation, refresh and reassignment. History defaults to the pupil-safe view and makes the teacher view and adaptation provenance explicit. | Client contract and real authorised assignment-persistence integration tests added and passed. |
| Server-authoritative pupil scheduler | The legacy browser-local control path was replaced by a typed server-backed client and pupil-profile learning-plan screen. It loads the worker’s canonical ladder, persists configuration and reports retry/claim state. | Scheduler API integration coverage proves durable configuration, canonical ladders and state mapping. |
| Duplicate-work protection and teacher judgement | A short-lived atomic generation claim prevents concurrent manual/background runs from duplicating work. Pending scheduler marks present explicit teacher accept/override controls; ordinary progress saving cannot bypass review. | Scheduler integration tests cover claim conflict, mastery-gated progression and teacher override/reinforcement. |
| Explicit low-vision print typography | Dedicated Science and Humanities layouts now emit a `data-support-mode="visual"` marker. In visual-support mode they use an explicit Arial/Helvetica hierarchy, enlarged core task text, increased line spacing and strengthened high-contrast response boundaries, in addition to meaningful support directions. | Focused Science/Humanities renderer tests passed. Regenerated true PDFs retained every mandatory A4 landscape page count, and post-repair visual inspection found no clipping or overlap. |

## Final validation result

The final local evidence is **clean**: TypeScript typecheck passed; the complete suite passed **49 test files, 963 tests, 1 skipped**; the standalone worksheet scrutiny verifier passed; and the production build passed. The only build output is the pre-existing Rollup chunk-size advisory, not a build error. The final PDF audit verified all ten representative samples as A4 landscape: protected Maths Gold, English, History, Geography and Business each retained two pages; dedicated Science retained one page.

The next product-expansion candidates remain deliberate work rather than unverified claims: flexible grouping recommendations, family-safe update drafts, a leader-facing trust centre, smart cross-workspace search and further curriculum-reviewed primary topic packs.


## SEND programme implementation tranche — 22 August 2026 (current source)

| Delivered improvement | Implementation evidence | Validation evidence |
|---|---|---|
| Durable learner-support profile | Added a bounded, school-scoped, audited teacher-authored profile for strengths, barriers, successful strategies, accessibility/communication preferences, scaffold entry point, pupil voice and time-bounded adjustments. It is explicitly not a diagnosis or safeguarding record. | Client normalisation/access-plan tests and real authorised persistence/audit/rejection tests passed. |
| Transparent access and scaffold controls | The worksheet studio now uses the explicitly scoped pupil profile as an opt-in access guide. A scaffold-fade directive keeps worked models, prompts and independent routes separate from difficulty/tier; profile prompt lines prohibit demand, marks and protected-layout changes. | Focused learner-support tests passed; typecheck and full suite passed. |
| Assessment-access and diagram equivalence | Introduced a shared assessment-access plan that records response routes, presentation support, active temporary adjustments and an invariant evidence standard. Structured diagrams now carry deterministic accessible descriptions exposed to every SVG root, without creating new assessed tasks. | Added learner-support and diagram-accessibility unit tests; all passed. |
| Cross-tool SEND consistency | Applied selected-pupil, teacher-reviewed access guidance to differentiation, lesson planning, Story Studio, reading-story/comprehension generation, grounded book questions and AAC communication vocabulary. Guidance is opt-in, bounded, identity-safe and preserves the teacher-selected objective, reading level, evidence and review. | Focused and full suite passes; book-text grounding remains server-authoritative and profile guidance remains transient. |
| Safe scheduler access loop | The authoritative scheduler now derives a bounded access cue from the durable profile, removes pupil names from its generation prompt, records only a non-sensitive application flag, and explains the scaffold/demand boundary to teachers. Progression remains teacher-reviewed. | Scheduler API/integration suite passed, including a new test proving identity/diagnosis are excluded from the worker cue. |

### Current validation result

The current SEND tranche is locally validated: TypeScript typecheck passed; focused SEND/assignment/scheduler pack passed **6 files, 18 tests**; the full suite passed **52 files, 973 tests, 1 skipped**; production build passed with the known Rollup chunk-size advisory only; and the standalone worksheet scrutiny verifier passed. The ten current PDF samples retained their mandatory A4 landscape contracts: protected Maths Gold and dedicated English/Humanities remained two pages; dedicated Science remained one page.


## Completed improvement tranche — diagram integrity, access and governed workflows

| Delivered improvement | Implementation evidence | Validation evidence |
|---|---|---|
| Hard diagram safety gate | The freeform SVG checker now rejects out-of-bounds elements, text collisions, text-on-shape collisions, crossing or overlaid line/polyline/path connectors, unverified visible paths, small text and missing anchors. The live maths SVG route passes subject/topic contracts to this gate, retries once with exact diagnostics and otherwise omits the unsafe diagram. | New hard-gate tests prove rejection of crossing connectors, crowded labels and incomplete Pythagoras relationships; valid labelled Pythagoras structure passes. |
| Mathematical and scientific diagram integrity | Known maths topics now require essential structures/relationships before an AI SVG can be returned. The generation prompt explicitly prohibits invented values, relationships, graph conventions and circuit topology. The deterministic diagram engine now treats external-label overlap, clipping and label-to-component collisions as errors. | Approved built-in series and parallel circuit patterns remain renderable under the stricter engine geometry checks. |
| Family-safe draft review | Parent newsletter outputs now display a deterministic review gate. High-severity privacy/safeguarding findings block personalised draft export; all other exports require a staff acknowledgement and clearly remain local drafts—not sent communications or an approval to distribute. | New pure contract tests cover high-risk blocking and mandatory human review for ordinary drafts. |
| SEND-consistent revision/resource workflows | Flashcards and connected-resource packs now use an explicitly scoped, normalised teacher-reviewed learner profile as identity-safe access guidance. Quiz labels and prompts distinguish curriculum challenge from SEND support, preserving objectives, key vocabulary, correct answers and expected evidence. | Typecheck and focused learner-support contracts passed after legacy-profile normalisation. |
| Governed outcomes and family messaging | Analytics now presents completion and quiz data as non-ranking follow-up cues, with a visible teacher-review boundary. The live parent portal clarifies that messaging is for routine matters and directs urgent safeguarding, health or attendance concerns to the school’s published urgent route. | Full suite and production build cover the changed application tree; no claim is made that analytics alone diagnoses need, measures provision impact or makes grouping decisions. |

### Current validation result

The completed tranche is locally validated: TypeScript typecheck passed; the focused cross-tool regression pack passed **9 files, 27 tests**; the complete suite passed **55 files, 982 tests, 1 skipped**; the production bundle passed with only the known Rollup chunk-size advisory; and the protected worksheet scrutiny verifier passed. The regenerated current PDF set retained every mandatory A4 landscape contract, with a final high-risk visual inspection of low-vision Maths and dyslexia-adapted Science finding no observed overlap, clipping, label collision, answer leakage or page-structure drift.


## History structure repair and lesson-slide visual redesign — 22 August 2026

The History data route now retains a bounded canonical JSON payload for each worksheet section alongside its queryable relational fields. This preserves renderer-specific identifiers, diagram specifications, layout data, response-space settings, print constraints and other safe structural extensions through save, refresh and update. The History page treats saved structured sections as canonical; legacy reconstruction is now limited to old text-only records. Teacher-only sections remain explicit in the stored structure, and the existing pupil/teacher viewing boundary remains intact.

The Presentation Maker now defaults to **Dynamic Subject** styling. It resolves a subject-specific decorative motif while keeping instructional content on clear surfaces, uses a stronger classroom-oriented content shell and heading hierarchy, and carries the same subject identity into PPTX title exports. Presenter mode now announces progression to assistive technology, labels navigation controls and uses a calmer amber time cue rather than alarm red where the selected SEND theme requires it. The primary toolbar action is now **Start lesson**, with handout, display and presenter support immediately available.

| Validation | Observed outcome |
|---|---|
| History persistence integration | Passed: complete pupil-facing structure and teacher-only mark-scheme section survived create, API refresh and update. |
| Presentation visual-theme unit tests | Passed: subject motifs resolve distinctly; high-contrast mode removes decorative background treatments; uncatalogued subjects fall back safely. |
| Focused combined regression | Passed: 3 files, 5 tests. |
| Full automated suite | Passed: 57 files, 986 tests, 1 skipped. |
| TypeScript | Passed with zero errors. |
| Production build | Passed; known bundle-size advisory only. |
| Protected worksheet scrutiny | Passed; immutable worksheet and SEND contracts remain intact. |
| Source integrity | `git diff --check` passed; no temporary helpers were introduced. |

No publication, deployment or source-control commit was performed in this tranche.

## Learner overlay continuity and teacher-workspace redesign — 22 August 2026 (in progress)
The pupil-safe assignment contract now retains display-only overlay provenance (`overlay`, `accessibilityOverlayMode` and the protected-layout boundary) alongside its existing curriculum and SEND metadata. Learner and teacher-review worksheet renderers resolve their paper treatment through a single safe helper: legacy dyslexia assignments default to cream, explicit manual white remains white, and protected fixed layouts remain white irrespective of the selected overlay. This change does not modify instructional sections, marks, diagrams, teacher-only filtering or print geometry.

The teacher workspace has begun its shared redesign with a responsive page shell, accessible page header, workspace panels and a calmer studio backdrop. The global shell and Today dashboard now use the new command-centre visual hierarchy while retaining their existing routes, scheduler-review decisions and pupil-work-plan flows.

| Validation | Observed outcome |
|---|---|
| Focused overlay, assignment, History and presentation regression | Passed: 5 files, 11 tests. |
| TypeScript after shared workspace/dashboard changes | Passed with zero errors. |
| Local front-end visual attempt | The Vite front end was available on port 5174, but the local server process could not start because `DATABASE_URL` is absent in this sandbox; `/home` therefore rendered blank. No visual-success claim is made from this attempt. |

No publication, deployment or source-control commit was performed.

### Workspace redesign validation update

| Validation | Observed outcome |
|---|---|
| Shared workspace rendering | Passed: 2 direct server-render checks cover the common shell, accessible header/action slots and both Lucide forward-ref and existing element icon forms. |
| Focused integrated regression | Passed: 6 files, 13 tests covering shared workspace layout, worksheet overlay, pupil assignment overlay, History structure, assignment persistence and presentation visual themes. |
| TypeScript | Passed with zero errors after all workspace changes. |
| Full regression suite | Passed: **59 files, 992 tests, 1 skipped**. |
| Production build | Passed. The existing Rollup advisory about large chunks remains; no new build error was observed. |
| Protected worksheet scrutiny | Passed: all static and runtime checks for SEND overlays, post-validation, learner safety and dedicated layout safeguards passed. |
| Source integrity | `git diff --check` passed. |

The local Vite visual route remains unable to hydrate the data-backed page in this sandbox because its development server requires an unavailable `DATABASE_URL`. The application therefore received layout-level source and render-test coverage rather than a misleading live-dashboard visual-success claim in this environment. No publication, deployment or source-control commit was performed.
