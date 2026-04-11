# Adaptly Tool Scorecard (Comprehensive) — April 2026

Scoring model (0-100):
- 35% reliability/output quality
- 25% safety/compliance
- 20% UX speed/clarity
- 20% data/workflow integration

## Overall platform tool score
- **Current average score across all tools:** **68/100**
- **Target for “excellent”:** **85+/100**

---

## Tool-by-tool audit and improvements

| Tool | Score | Current gaps | High-impact improvement |
|---|---:|---|---|
| Lesson Planner | 74 | Quality drift across long outputs | Add rubric-based post-check + structured section validator |
| Medium Term Planner | 70 | Inconsistent sequencing across weeks | Add chronology/coverage validator against objectives |
| Quiz Generator | 72 | Answer-key mismatch risk | Add deterministic answer-key validation pass |
| Rubric Generator | 69 | Criteria-level overlap | Add rubric linting (clarity/measurability overlap checks) |
| Comprehension Generator | 71 | Reading-level mismatch occasionally | Add mandatory readability gate before return |
| Exit Ticket | 76 | Good speed, limited adaptation depth | Add difficulty calibration from class profile |
| Flash Cards | 73 | Duplicate/weak cards | Add dedupe and quality thresholding |
| Vocabulary Builder | 75 | Limited multilingual support | Add bilingual glossary mode with QA checks |
| Behaviour Plan | 67 | Risk-sensitive recommendations | Add safeguarding classifier + mandatory review prompts |
| Wellbeing Support | 64 | Safety critical, escalation inconsistency | Add crisis keyword escalation + DSL review requirement |
| IEP Generator | 65 | High-stakes personalisation quality varies | Add evidence traceability + section completeness checks |
| Pupil Passport | 68 | Sensitive profile quality inconsistency | Add data minimisation and mandatory “strengths first” structure |
| Smart Targets | 72 | Generic targets sometimes | Add SMART validator (specific, measurable, timed) |
| Social Stories | 70 | Tone/age calibration drift | Add age-band policy and language simplicity guardrail |
| Report Comments | 66 | Bias/tone risk | Add sentiment/bias checker + consistency templates |
| Parent Newsletter | 74 | PII leakage risk | Add redaction and parent-safe preview lint |
| Text Rewriter | 69 | Can over-simplify meaning | Add semantic-preservation score |
| Presentation Maker | 63 | Structural complexity + rendering failures | Add slide schema validator + fallback rendering profile |
| Stories | 71 | Narrative safety variance | Add child-safe content filter and age tuning |
| Differentiate | 73 | Good adaptation but quality varies by SEND need | Add per-SEND profile test suite + confidence score |
| SEND Screener | 62 | Sensitive workflow and interpretation risk | Add explicit decision-support disclaimer + audit trail |
| Risk Assessment | 65 | Legal/safeguarding wording risk | Add policy template constraints + mandatory human signoff |
| Quiz Join | 77 | Strong UX, moderate abuse surface | Add anti-bot/rate shield and room abuse telemetry |

---

## Cross-tool priorities (biggest gains)

1. **Unified transform pipeline** (base -> reading age -> SEND -> retrieval -> features) for all worksheet-related tools.
2. **Quality gates everywhere**: schema validation + score threshold + fallback plan.
3. **Safety for high-stakes tools**: wellbeing/IEP/risk/report-comments require human-review mode.
4. **Feedback learning loop**: feed teacher ratings/issues back into prompt+post-processing tuning.
5. **Tier-consistent retrieval**: when switching tiers, reapply retrieval and feature transforms automatically.

---

## 90-day target state

- Raise average score from **68 -> 82**.
- Raise high-stakes tools (Wellbeing/IEP/SEND Screener/Risk) to **75+**.
- Ensure worksheet family tools all pass:
  - structure-lock check,
  - diagram integrity check,
  - retrieval-under-LO check,
  - tier-switch transform preservation.

---

## Content improvement playbook (per tool)

- **Lesson Planner (74):** enforce objective-success-criteria alignment; require at least 3 concrete teacher questions per phase.
- **Medium Term Planner (70):** add week-by-week prerequisite checks; ensure cumulative retrieval thread each week.
- **Quiz Generator (72):** add distractor quality rules (plausible but incorrect); enforce explanation text for each answer.
- **Rubric Generator (69):** ensure each criterion has observable verbs and level-specific evidence descriptors.
- **Comprehension Generator (71):** include balanced question mix (literal/inferential/evaluative) with reading-age tagging.
- **Exit Ticket (76):** add one confidence-check prompt and one misconception probe every time.
- **Flash Cards (73):** one concept per card, avoid double-barrel definitions, include quick recall cue.
- **Vocabulary Builder (75):** include student-friendly definition + technical definition + bilingual equivalent.
- **Behaviour Plan (67):** convert generic advice to trigger-action-response format with measurable review checkpoints.
- **Wellbeing Support (64):** force supportive, non-diagnostic language and include immediate safeguarding escalation options.
- **IEP Generator (65):** map each target to baseline evidence, strategy, owner, review date, and success metric.
- **Pupil Passport (68):** prioritise strengths/interests first, then barriers, then practical classroom adjustments.
- **Smart Targets (72):** auto-reject vague verbs and require measurable outcomes and explicit review cadence.
- **Social Stories (70):** maintain first-person perspective, predictable sequence, and explicit coping scripts.
- **Report Comments (66):** require evidence sentence + impact sentence + next-step sentence per comment.
- **Parent Newsletter (74):** simplify jargon and include clear actions/dates/contacts with readability checks.
- **Text Rewriter (69):** preserve named entities/facts while adjusting tone/reading age only.
- **Presentation Maker (63):** cap cognitive load per slide (one objective, one key idea, one check-for-understanding).
- **Stories (71):** ensure age-appropriate plot complexity and explicit vocabulary reinforcement moments.
- **Differentiate (73):** align adaptation level to SEND profile and preserve original learning intent/mark demand.
- **SEND Screener (62):** ensure neutral phrasing, confidence indicators, and clear “not a diagnosis” framing.
- **Risk Assessment (65):** convert outputs to hazard-control-residual-risk structure with accountable owners.
- **Quiz Join (77):** improve student feedback granularity (why wrong/right) and spacing prompts.
