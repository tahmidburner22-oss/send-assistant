# Continuation Discovery Notes

**Date:** 2026-08-22
**Scope:** Verified repository baseline before continuation work.

## Repository and platform architecture

- Repository: `tahmidburner22-oss/send-assistant`; branch `main`; locally checked out at `/home/ubuntu/send_assistant_current` because the previously recorded checkout was absent from the workspace.
- Current remote HEAD: `baaa5ed` — `fix: make worksheet read aloud visible and controllable`.
- Application stack: React 19 and Vite client; Express/Node server; TypeScript; Vitest; Drizzle/MySQL support; tRPC/React Query; Railway configuration is present.
- The primary worksheet controller is `client/src/pages/Worksheets.tsx` (8,561 lines). It owns worksheet generation, dedicated-layout selection, auto-from-class generation, saving/history, export/print, and action UI.

## Protected-layout architecture

- KS3/KS4 Maths routes through a strict approved-template gate. A selected precise subtopic is required, and a missing approved template produces an error rather than a generic/portrait worksheet.
- Bundled approved Maths templates use `mathsGoldRenderer`, `mathsGoldAdaptations`, `mathsGoldSend`, `mathsGoldPdf`, and `GoldWorksheetFrame`.
- Science uses a dedicated one-page landscape renderer. Implemented English, History, Geography, and Business layouts use a separate dedicated two-page landscape renderer path.
- Dedicated-layout interiors are explicitly forced white; overlays must not tint dedicated paper/card interiors.

## Differentiation repair discrepancy

The handover says a local, un-deployed LA/MA/HA repair should exist in `threeTierDifferentiation.ts`, `ThreeTierButton.tsx`, and a focused test. In the verified checkout:

- `threeTierDifferentiation.ts` still starts all three AI calls concurrently via `Promise.allSettled`; it has no sequential LA → MA → HA execution and no one-time per-tier retry.
- `ThreeTierButton.tsx` shows a simple status/tab UI; it does not expose actual per-tier failure reasons or tier-specific retry controls.
- The expected dedicated focused test file is absent.
- `Worksheets.tsx` imports `ThreeTierButton`, but the current implementation does not render or call it. The feature is therefore not integrated into the main worksheet action surface.
- Existing Phase G/H tests only cover metadata stamping for this feature, not the required sequential, retry, retained-success, and tier-specific recovery behavior.

Consequently, the local repair referenced in the handover is not available in this checkout. The next release phase must **recreate and wire the repair**, then validate it; it cannot simply inspect and deploy a pre-existing local diff.

## Workflow findings relevant to later phases

- Auto-from-class orchestration lives in `Worksheets.tsx`; current code lacks timeout, cancel, retry, and fallback controls beyond generic failure handling.
- The existing `ClassPackDialog` provides a relevant in-repository pattern for sequential work, visible progress, cancellation, retained partial usefulness, and safe fallback.
- The Lesson Bundle dialog has no explicit reliable hand-off confirmation or modal-close behavior after opening the teacher view.

## Source evidence used

- Repository home and commit `b677aae93434dad1270b901fd2790fd2e433cd85` on GitHub.
- Local source files: `package.json`, `client/src/pages/Worksheets.tsx`, `client/src/lib/threeTierDifferentiation.ts`, and `client/src/components/ThreeTierButton.tsx`.
- Local historical audit: `audit/FULL-AUDIT-REPORT-2026.md`; it predates the current live URL and therefore is historical context, not current release evidence.

## Immediate implication

Do not deploy the differentiation repair until the missing implementation is rebuilt as a narrow, test-covered change and integrated into the actual worksheet UI. Preserve the dedicated renderer and all fixed-layout contracts throughout.

## Live production entry experience

The production URL is live and resolves to the Adaptly public landing page. The public experience is a polished product introduction for UK SEND teams, with a distinct “Step through. Teach smarter.” positioning. It advertises integrated EHCP drafting, differentiated worksheets, parent communications, analytics, screeners, classroom tools, curriculum/revision functions, and a parent portal. The public product walkthrough presents the worksheet studio as one tool in a broader teacher/SENCO workflow rather than as an isolated generator.

The landing page successfully exposes the public product narrative and the sign-in/start-free route. Its landing-page worksheet illustration is demonstrative marketing content, not evidence of the protected production renderer. The relevant controlled features—worksheet generation, dedicated-layout routing, saved History, and classroom-aware flows—remain behind authenticated routes. No authenticated session was present, so no teacher data was viewed and no consequential action was taken.

**Production observation:** the root route initially displays a bounded loading skeleton and then resolves to the public landing page. A cookie-preference notice is present. This aligns with the application’s client-side session/route boot sequence, although the authenticated recovery controls cannot be assessed without a permitted teacher session.

**Source comparison:** the source app routes public visitors to `/`, `/login`, policy pages, shared outputs, and parent routes, while routing authenticated staff through the AppLayout teacher workspace. The live public experience therefore matches the source-level product model at entry level.

## Live authentication boundary

The production sign-in route exposes email/password, Google sign-in, password recovery, school-account creation, and privacy/accessibility links. Visiting `/worksheets` without an authenticated session redirects to `/login`, which matches the protected-route behavior in the source. The previously unavailable authenticated browser connection was requested solely to inspect the existing teacher workspace, but the connection request was not approved. Accordingly, the authenticated live worksheet flows cannot be inspected or operated in this session, and no sign-in credentials were requested or used.

This is not a release blocker for local code validation, but it means any assertion about the deployed teacher-only flows must remain explicitly unverified until a permitted authenticated production session is available.
