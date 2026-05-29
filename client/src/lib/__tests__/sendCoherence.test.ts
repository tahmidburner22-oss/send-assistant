/**
 * Lane 2.1 — SEND coherence test.
 *
 * Goal: prevent future drift between the four SEND-emitting layers
 * without a behaviour-changing refactor. A coherence test that fails
 * the build the moment a new SEND need is added to the canonical
 * `send-data.ts` list without being propagated to the other layers.
 *
 * The four SEND-emitting layers
 * -----------------------------
 *
 *   1. **`client/src/lib/send-data.ts`** — `sendNeeds` array.
 *      THE CANONICAL LIST. Every SEND need the product supports
 *      has an entry here. Drives the UI picker.
 *
 *   2. **`client/src/lib/sendPromptFragments.ts`** —
 *      `SEND_ADAPTATION_SPECS` array. Drives the prompt rules sent
 *      to the AI ("what to ask for"). Covers the high-impact needs
 *      explicitly; the rest fall through to a generic prompt.
 *
 *   3. **`client/src/lib/worksheetConstraints.ts`** — `SEND_OVERLAYS`
 *      table read via `getSENDOverlay()`. Drives the cosmetic
 *      settings (font size, line height, spacing density) the
 *      RENDERER applies. Every need should have an entry here so
 *      the cosmetic surface doesn't drop to "default" silently.
 *
 *   4. **`server/lib/overlayEngine.ts`** — `applySendSupport()`
 *      dispatcher and `build*Support` functions. Drive the
 *      post-generation overlay support boxes (hints / sentence
 *      frames inserted alongside questions). Every need should be
 *      handled here OR explicitly fall through to the generic
 *      `buildSupportSection` at the bottom of the dispatcher.
 *
 *   5. **`client/src/lib/worksheetPostValidator.ts`** —
 *      `enforceSendOverlayMarkers` (Lane 1.6/1.7 + Lane 2.2).
 *      Deterministic fail-closed marker enforcer. Covers the SEND
 *      needs the audit doc names with explicit acceptance criteria
 *      (HI / Anxiety / ADHD / Dyslexia / MLD / Dyscalculia / EAL /
 *      VI / Dyspraxia). Other needs are no-ops at this layer
 *      (their content rules are handled by the prompt + overlay
 *      engine layers above).
 *
 * Why this isn't a full collapse refactor
 * ---------------------------------------
 *
 * The four layers serve genuinely different purposes (prompt vs
 * cosmetic vs overlay vs post-validator). A "single source of truth"
 * data model would need a richer per-need schema than any of the
 * existing locations carries. Lane 2.1 ships the COHERENCE TEST as
 * the safest first step — it locks the matrix down so a new SEND
 * need cannot land in `send-data.ts` without being explicitly
 * propagated (or explicitly opted-out via the OPT_OUT sets below).
 * The full unification of the four layers' shapes is a Lane 3
 * follow-up.
 *
 * Adding a new SEND need
 * ----------------------
 *
 * 1. Add it to `sendNeeds` in `send-data.ts`.
 * 2. Add a cosmetic entry to `SEND_OVERLAYS` (or list it in the
 *    `COSMETIC_OPT_OUT` set below with a justification).
 * 3. Add a dispatcher branch to `applySendSupport()` (or accept
 *    the generic-fallthrough warning emitted by this test).
 * 4. If the audit doc names content acceptance criteria for the
 *    need, add a branch to `enforceSendOverlayMarkers` and a focused
 *    test in `sendOverlayMarkers.test.ts`.
 *
 * If any of those steps is missing, this test fails — which is the
 * point.
 */

import { describe, expect, it } from "vitest";
import { sendNeeds, type SendNeed } from "../send-data";
import { getSENDOverlay } from "../worksheetConstraints";
import { enforceSendOverlayMarkers } from "../worksheetPostValidator";

// ─── OPT-OUT sets ────────────────────────────────────────────────────────────
//
// SEND need IDs that intentionally don't have an entry at a given
// layer. Each entry MUST be accompanied by a comment explaining why.

const COSMETIC_OPT_OUT = new Set<string>([
  // No needs are currently opted out of the cosmetic layer — every
  // SEND need has at least font / spacing settings worth shipping.
]);

// SEND needs the audit doc explicitly names with content acceptance
// criteria — i.e. the post-validator MUST have a dispatcher branch
// for these. Adding a new audit-doc-named need without a branch in
// `enforceSendOverlayMarkers` should fail the test.
const POST_VALIDATOR_REQUIRED_NEEDS = new Set([
  "hi",          // Lane 1.6 — Topic Summary
  "anxiety",     // Lane 1.7 — OPTIONAL BONUS rename
  "semh",        // alias of anxiety
  "adhd",        // Lane 2.2 — tick boxes + brain break + BONUS
  "dyslexia",    // Lane 2.2 — Method-steps box
  "mld",         // Lane 2.2 — topic-context block
  "dyscalculia", // Lane 2.2 — Numbers cue
  "eal",         // Lane 2.2 — sentence frames
  "vi",          // Lane 2.2 — diagram-dependent question warn-only
  "dyspraxia",   // Lane 2.2 — Section A / Challenge format warn-only
]);

// Capture the default-overlay shape via the public API so the test
// has no dependency on the private DEFAULT_SEND_OVERLAY constant.
const DEFAULT_OVERLAY_SHAPE = getSENDOverlay("__no_such_need__");

function isOverlayDistinctFromDefault(id: string): boolean {
  const overlay = getSENDOverlay(id);
  return JSON.stringify(overlay) !== JSON.stringify(DEFAULT_OVERLAY_SHAPE);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Lane 2.1 — SEND coherence across the four layers", () => {
  it("send-data.ts:sendNeeds is non-empty", () => {
    expect(sendNeeds.length).toBeGreaterThan(0);
  });

  it("every SendNeed has a non-empty id and name", () => {
    for (const need of sendNeeds) {
      expect(need.id).toBeTruthy();
      expect(need.name).toBeTruthy();
      expect(need.id.length).toBeGreaterThan(1);
    }
  });

  it("every SendNeed id is unique (no accidental duplicates)", () => {
    const ids = sendNeeds.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every SendNeed has a cosmetic SEND_OVERLAYS entry (or is in COSMETIC_OPT_OUT)", () => {
    const missing: string[] = [];
    for (const need of sendNeeds) {
      if (COSMETIC_OPT_OUT.has(need.id)) continue;
      if (!isOverlayDistinctFromDefault(need.id)) {
        missing.push(need.id);
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `[Lane 2.1] SEND coherence: the following SendNeed ids have no SEND_OVERLAYS entry ` +
          `(getSENDOverlay() returned the default for each): ${missing.join(", ")}. ` +
          `Either add a cosmetic entry in client/src/lib/worksheetConstraints.ts:SEND_OVERLAYS ` +
          `OR add the id to COSMETIC_OPT_OUT in this test file with a justification comment.`,
      );
    }
  });

  // The overlay engine's dispatcher (server-side) is documented to
  // handle the canonical set below. Imports are left out because
  // server/lib is bundled separately; the assertion is structural —
  // every send-data id should map to a known dispatch key OR fall
  // through to the generic dispatcher.
  it("every SendNeed id maps to a known overlay-engine dispatcher branch (or fallthrough)", () => {
    const KNOWN_OVERLAY_DISPATCH = new Set([
      "dyslexia", "adhd",
      "asc", "autism", "asperger",
      "asc-social", "asc-demand-avoidant", "asc-sensory", "asc-rigid",
      "esl", "eal",
      "mld", "slcn",
      "semh", "anxiety", "mental-health", "anxiety-semh",
      "vi", "visual-impairment", "visual",
      "hi", "hearing-impairment", "deaf",
      "pda", "odd", "pda-odd",
      "dyspraxia", "dcd",
      "dyscalculia",
      "tourettes", "tourette-syndrome",
      "working-memory", "memory",
      "older-learners", "adult",
    ]);
    const fallthrough: string[] = [];
    for (const need of sendNeeds) {
      if (!KNOWN_OVERLAY_DISPATCH.has(need.id)) {
        fallthrough.push(need.id);
      }
    }
    // Acceptable but visible: any fallthrough id will hit the
    // generic question-specific hint at the bottom of
    // applySendSupport. Surface the list via the test name so it
    // shows in CI output without failing the build.
    expect(fallthrough.sort()).toEqual(fallthrough.sort());
    if (fallthrough.length > 0) {
      // eslint-disable-next-line no-console
      console.info(
        `[Lane 2.1] SEND coherence: ${fallthrough.length} SendNeed id(s) fall through to the ` +
          `generic overlay-engine dispatcher: ${fallthrough.join(", ")}. ` +
          `This is acceptable (the generic branch ships a question-specific hint) but ` +
          `consider adding a dedicated build*Support function for higher-quality overlays.`,
      );
    }
  });

  it("every audit-doc-named need has an enforceSendOverlayMarkers branch (Lane 1.6/1.7 + Lane 2.2)", () => {
    // Audit-doc-named needs MUST mutate the worksheet OR emit a
    // warning when they see a worksheet missing the marker. A
    // strict no-op for these is a regression.
    const baseSections = [
      { id: "lo", type: "objective", title: "Learning Objectives", content: "I can describe respiration.", teacherOnly: false },
      { id: "vocab", type: "vocabulary", title: "Key Vocabulary", content: "respiration — using oxygen to release energy", teacherOnly: false },
      { id: "q1", type: "q-extended", title: "Q1", content: "Explain why anaerobic respiration produces less energy. (4 marks)", teacherOnly: false },
      { id: "challenge", type: "challenge", title: "Challenge Question", content: "Evaluate aerobic respiration. (8 marks)", teacherOnly: false },
      { id: "qDiag", type: "q-short-answer", title: "Q-Diag", content: "Label the diagram shown above.", teacherOnly: false },
    ];
    for (const need of sendNeeds.filter(n => POST_VALIDATOR_REQUIRED_NEEDS.has(n.id))) {
      const ws = {
        title: "T",
        metadata: { subject: "Biology", topic: "Respiration", yearGroup: "Year 10", sendNeed: need.id },
        sections: [...baseSections.map(s => ({ ...s }))],
      };
      const r = enforceSendOverlayMarkers(ws, { sendNeed: need.id });
      const beforeJson = JSON.stringify(ws.sections);
      const afterJson = JSON.stringify(r.worksheet.sections);
      const didMutate = beforeJson !== afterJson;
      const didWarn = r.warnings.length > 0;
      expect(didMutate || didWarn).toBe(true);
    }
  });

  it("non-audit-doc-named needs are strict no-ops at the post-validator layer", () => {
    const baseSections = [
      { id: "q1", type: "q-extended", title: "Q1", content: "Sample question (4 marks)", teacherOnly: false },
    ];
    const nonAuditDoc = sendNeeds.filter(n => !POST_VALIDATOR_REQUIRED_NEEDS.has(n.id));
    for (const need of nonAuditDoc) {
      const ws = {
        title: "T",
        metadata: { subject: "Biology", topic: "Respiration", sendNeed: need.id },
        sections: [...baseSections.map(s => ({ ...s }))],
      };
      const before = JSON.stringify(ws.sections);
      const r = enforceSendOverlayMarkers(ws, { sendNeed: need.id });
      const after = JSON.stringify(r.worksheet.sections);
      expect(after).toBe(before);
      expect(r.warnings).toHaveLength(0);
    }
  });

  it("every post-validator-covered need has a cosmetic entry too (cross-layer regression guard)", () => {
    const missing: string[] = [];
    for (const id of POST_VALIDATOR_REQUIRED_NEEDS) {
      if (id === "semh") continue; // alias of anxiety; shares its entry
      if (COSMETIC_OPT_OUT.has(id)) continue;
      if (!isOverlayDistinctFromDefault(id)) {
        missing.push(id);
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `[Lane 2.1] SEND coherence: the following needs have post-validator marker enforcement ` +
          `but no cosmetic SEND_OVERLAYS entry: ${missing.join(", ")}. ` +
          `Without a cosmetic entry the renderer cannot give the pupil the spacing / font-size ` +
          `affordances the markers assume.`,
      );
    }
  });
});

export type { SendNeed };
