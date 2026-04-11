# Adaptly Product Security + Tool Audit (April 10, 2026)

## Executive score

**Overall security score: 66 / 100 (Grade: C+)**

### Domain scores
- **Authentication & session handling:** 74/100
- **API & backend hardening:** 68/100
- **LLM safety / prompt security:** 61/100
- **Frontend/client-side security:** 58/100
- **Observability & incident readiness:** 59/100
- **Compliance readiness (education + safeguarding):** 72/100

---

## What is already strong
- Auth routes enforce email verification and include per-account lockout logic for failed logins.
- API routes are behind auth/admin middleware where expected (AI, admin key management).
- Rate limiting and security headers are present globally.
- AI provider fallback architecture and timeout/cooldown controls are more mature than average for SMB education products.

---

## Highest-priority product risks (fix these first)

### P0 (urgent)
1. **Potential XSS surface in AI-rendered content paths**
   - HTML is rendered with `dangerouslySetInnerHTML` in core AI tool output components.
   - Action: enforce strict output sanitization (DOMPurify with locked config), add allowlist-based markdown renderer, and CSP nonce rollout.

2. **JWT/API keys in browser localStorage**
   - API keys and auth token usage patterns rely on localStorage in client code.
   - Action: move auth to HttpOnly secure cookies; stop storing provider keys client-side; use server-side key vault pattern only.

3. **CORS origin matching logic too permissive**
   - Origin validation currently uses `startsWith`, allowing crafted lookalike domains.
   - Action: parse URL and perform exact origin/hostname matching against canonical allowlist.

### P1 (next sprint)
4. **Global body sanitization risks data corruption + bypass edge cases**
   - Current approach strips tags in all request bodies.
   - Action: move to route-specific schema validation + output encoding strategy.

5. **In-memory lockout state won’t scale across instances**
   - Lockout maps reset on restart and don’t synchronize between pods.
   - Action: persist lockout counters in Redis/DB with TTL.

6. **Weak structured logging posture**
   - Heavy use of console logging without guaranteed request correlation.
   - Action: adopt structured JSON logs, request IDs, actor/school IDs, and alerting thresholds.

---

## Tool-by-tool audit (all tools in `client/src/pages/tools`)

Scoring scale per tool: **Low / Medium / High** risk based on data sensitivity + attack surface + operational complexity.

| Tool | Risk | Why this score | Upgrade needed for “complete product” |
|---|---|---|---|
| BehaviourPlan | Medium | Student support content may include sensitive behavioural data. | Add explicit PII minimization hints, audit trail per generation, retention controls. |
| ComprehensionGenerator | Medium | Classroom content, moderate prompt-injection risk. | Add output safety classifier and deterministic schema mode for question JSON. |
| Differentiate | High | High volume AI transforms; likely processes student-specific needs. | Add per-request policy checks, toxicity filters, and provenance metadata. |
| ExitTicket | Medium | Low direct PII but user-generated prompts can carry unsafe content. | Add stricter field length/schema validation and profanity/harmful-content checks. |
| FlashCards | Medium | Often embeds generated HTML/text and export paths. | Use sanitized markdown renderer; disallow raw HTML in exports. |
| IEPGenerator | High | Handles highly sensitive SEND/IEP evidence and files. | Add encrypted-at-rest evidence storage, DLP scanning, and role-scoped access logs. |
| LessonPlanner | Low-Medium | Mostly pedagogical data but open-ended prompt inputs. | Add template schema enforcement and curriculum-reference validation. |
| MediumTermPlanner | Low-Medium | Planning data, lower sensitivity. | Add output versioning + review workflow before sharing. |
| ParentNewsletter | Medium | Parent-facing communications can leak personal info. | Add PII redaction pass and “public-safe mode” prior to export/send. |
| PresentationMaker | High | Large generated artifacts and rich rendering pipeline. | Add sandboxed rendering and anti-XSS sanitization in slide HTML/markdown conversion. |
| PupilPassport | High | Contains identifiable pupil profile and support info. | Add strict RBAC, data classification labels, and download watermarking. |
| QuizGenerator | Medium | Student-facing content and answer keys. | Add integrity checks for answer keys + anti-cheating randomization options. |
| QuizJoin | Medium | Public/session-style endpoint usage increases abuse surface. | Add anti-automation protections, per-room throttling, and abuse telemetry. |
| ReportComments | High | Student attainment/judgement text is sensitive and high impact. | Add bias/quality guardrails, approval workflow, and immutable edit history. |
| RiskAssessment | High | Safeguarding/legal-style outputs can carry duty-of-care implications. | Add policy templates, mandatory human sign-off, and legal disclaimer controls. |
| RubricGenerator | Medium | Moderate integrity risk (assessment fairness). | Add rubric consistency validator and curriculum-standard mapping checks. |
| SendScreener | High | Screening data is sensitive, potentially health/learning-related. | Add explicit consent flow, purpose limitation, and strict retention/deletion tooling. |
| SmartTargets | High | Individual pupil goals are sensitive educational records. | Add parent/student visibility controls and change approval flow. |
| SocialStories | Medium-High | Personalized behavioural/social intervention content. | Add age-appropriateness checks and safeguarding language classifier. |
| Stories | Medium | Generative narrative tool with child-facing outputs. | Add child safety filtering and banned-topic policy enforcement. |
| TextRewriter | Medium | Generic text rewrite can be abused for policy bypass content. | Add abuse-mode detection and protected-topic rewrite restrictions. |
| VocabularyBuilder | Low-Medium | Lower risk but still model-output correctness concerns. | Add curriculum alignment checks and confidence/quality indicators. |
| WellbeingSupport | High | Wellbeing/safeguarding context is safety-critical. | Add crisis/safeguarding escalation logic and mandatory DSL review path. |

---

## Cross-cutting product roadmap to reach “complete product”

## Phase 1 (2–4 weeks): Secure baseline
- Replace localStorage auth token flow with HttpOnly secure cookies.
- Introduce DOM sanitization + markdown allowlist renderer for all model outputs.
- Fix CORS exact-origin validation.
- Add mandatory request IDs in logs and propagate to frontend error reports.

## Phase 2 (4–8 weeks): Trust + governance
- Introduce centralized policy engine for prompts/responses (PII, safeguarding, toxicity, jailbreaks).
- Add per-tool data classification and retention policy matrix.
- Add teacher approval workflow for high-risk tools (IEP, Risk, Report, Wellbeing, SendScreener).

## Phase 3 (8–12 weeks): Enterprise readiness
- SOC2-style controls: key rotation, least-privilege secrets access, incident runbooks.
- School-level audit exports (who generated what, when, and what data classes were involved).
- Continuous red-team testing against prompt injection/exfiltration scenarios.

---

## Concrete engineering backlog (prioritized)

1. Add `sanitizeHtmlOutput()` utility and apply before every `dangerouslySetInnerHTML` render.
2. Replace localStorage token consumption with cookie-based auth transport.
3. Introduce `zod` schemas for every AI input route and reject unknown keys.
4. Add `x-request-id` middleware and structured logger (`pino` or similar).
5. Add Redis-backed distributed lockout + rate limit buckets.
6. Add per-tool risk metadata (risk tier, requires-review, data class) in a central registry.
7. Create security unit/integration tests for: CORS, auth lockout, XSS sanitization, and file upload limits.
8. Add admin “data retention policy” page with per-tool TTL configuration.

---

## Evidence locations reviewed
- `client/src/components/AIToolPage.tsx`
- `client/src/lib/ai.ts`
- `client/src/pages/tools/*`
- `client/src/App.tsx`
- `server/index.ts`
- `server/routes/ai.ts`
- `server/routes/auth.ts`
- `server/db/index.ts`
