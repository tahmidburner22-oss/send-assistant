/**
 * curriculumAuthorityPromptServer.ts
 *
 * Server-side shim around `client/src/lib/curriculumAuthorityPrompt.ts`.
 *
 * The client module is pure (no DOM, no localStorage, no React) so it
 * bundles cleanly into the Node server build via esbuild — same pattern
 * the server already uses for `svgLayoutChecker.ts` (see the import at
 * `server/routes/ai.ts:13`).
 *
 * What this module does
 * ─────────────────────
 * - Re-exports the three named manifesto-section builders the client
 *   uses (`buildCurriculumAuthorityPreamble`,
 *   `buildNonNegotiablesBlock`, `buildPedagogicalRegisterNote`) plus
 *   the `CurriculumAuthorityInputs` shape and the UK-English helpers,
 *   so server-side code never has to reach into the client lib
 *   directly.
 * - Exposes a single high-level helper, `buildServerWorksheetSystemPrompt`,
 *   that prepends the curriculum-authority manifesto to whatever
 *   role-specific opening line a server endpoint already uses (the
 *   "You are an expert ..." stem).
 *
 * Why a shim and not a fork
 * ─────────────────────────
 * Phase 5 / PR-2 / PR-3 / PR-4 all use the client manifesto as the
 * single source of truth — UK English substitutions, banned softeners,
 * fabricated AO codes, placeholder leakage, command-word lists,
 * imperial-unit detector. Forking those rules to the server would
 * immediately drift. Re-exporting keeps client + server pinned to one
 * file the post-validator (`worksheetPostValidator.ts`) and the
 * upstream prompt builder (`ai.ts:structuredSystemSections`) already
 * consume.
 *
 * Audit item: #39 (server-side prompt unification — port manifesto
 * into `server/routes/ai.ts`).
 */

import {
  buildCurriculumAuthorityPreamble,
  buildNonNegotiablesBlock,
  buildPedagogicalRegisterNote,
  applyUKEnglishSubstitutions,
  isUKEnglishCompliant,
  classifyKeyStage,
  type CurriculumAuthorityInputs,
  type KeyStage,
} from "../../client/src/lib/curriculumAuthorityPrompt.js";

export {
  buildCurriculumAuthorityPreamble,
  buildNonNegotiablesBlock,
  buildPedagogicalRegisterNote,
  applyUKEnglishSubstitutions,
  isUKEnglishCompliant,
  classifyKeyStage,
};
export type { CurriculumAuthorityInputs, KeyStage };

/** Inputs to the server-side helper. */
export interface BuildServerWorksheetSystemPromptArgs {
  /**
   * The four-tuple the manifesto needs. Passing partial inputs is
   * supported — the manifesto degrades gracefully (KS1/KS2 omits the
   * awarding-body clause; missing topic falls back to the literal
   * "the topic"; etc.).
   */
  inputs: CurriculumAuthorityInputs;

  /**
   * The endpoint's existing role-specific opening — for example,
   * `"You are an expert UK teacher creating a complete, print-ready
   * worksheet based on provided lesson content."`
   *
   * The helper appends this AFTER the manifesto so the model still
   * receives the per-endpoint role instruction (which routes between
   * generation / scaffolding / adaptation / translation / etc.) but
   * always sees the curriculum-authority block first.
   */
  role: string;

  /**
   * Optional extra trailing text — e.g. an output-contract reminder
   * the endpoint relies on (`"Return ONLY valid JSON …"`). Always
   * placed last so it remains the final instruction the model reads.
   * When omitted, the helper appends nothing extra.
   */
  outputContract?: string;
}

/**
 * Build the canonical server-side system prompt for a worksheet-
 * generating endpoint.
 *
 * Layout (top-to-bottom, single source of truth):
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ CURRICULUM AUTHORITY — read this before producing anything │
 *   │   (preamble — gov.uk PoS + awarding body when GCSE/A-Level)│
 *   │                                                             │
 *   │ NON-NEGOTIABLES — every worksheet, every section, no excpts│
 *   │   1. UK ENGLISH ONLY                                        │
 *   │   2. SI UNITS ONLY                                          │
 *   │   3. UK CONTEXTS ONLY                                       │
 *   │   4. NO COPYRIGHTED PAST-PAPER TEXT VERBATIM                │
 *   │   5. AWARDING-BODY COMMAND WORDS ONLY                       │
 *   │   6. NO FABRICATED CODES                                    │
 *   │                                                             │
 *   │ PEDAGOGICAL REGISTER — KS1 / KS2 / KS3 / GCSE / A-Level     │
 *   │   (scales tone + sentence length to year group;             │
 *   │    sciences get the maths-only-working-box reminder)        │
 *   │                                                             │
 *   │ ROLE — the endpoint's existing "You are an expert ..." line │
 *   │   (verbatim, unchanged)                                     │
 *   │                                                             │
 *   │ OUTPUT CONTRACT (optional) — e.g. "Return ONLY valid JSON" │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * The helper is pure / deterministic / idempotent — same inputs
 * always produce the exact same string, so callers can cache or
 * snapshot-test it.
 *
 * The helper does NOT attempt UK-English-rewrite the role or output
 * contract that the caller passes in. The post-validator chain
 * (`worksheetPostValidator.ts:enforceCurriculumAuthorityInvariants`)
 * already handles that on the model's *output*; rewriting the prompt
 * itself would be confusing for the model (a US spelling that never
 * makes it into pupil-facing content is allowed to ride along in the
 * developer-facing prompt).
 */
export function buildServerWorksheetSystemPrompt(
  args: BuildServerWorksheetSystemPromptArgs,
): string {
  const { inputs, role, outputContract } = args;

  const preamble = buildCurriculumAuthorityPreamble(inputs);
  const nonNegotiables = buildNonNegotiablesBlock();
  const register = buildPedagogicalRegisterNote(inputs);

  const blocks: string[] = [preamble, nonNegotiables, register, role];
  if (outputContract && outputContract.trim().length > 0) {
    blocks.push(outputContract);
  }

  // Two blank lines between blocks gives the manifesto enough visual
  // weight that providers which strip leading-line whitespace
  // (Cerebras / SambaNova) still treat it as a distinct section.
  return blocks.join("\n\n");
}

/**
 * Convenience helper that returns just the manifesto (preamble +
 * non-negotiables + register), without the role or output contract.
 *
 * Useful when an endpoint needs to inject the manifesto into a
 * pre-built system prompt that already has its own role + output
 * contract — e.g. the multi-tier batch generator that builds a
 * combined prompt across four tiers in a single call.
 */
export function buildCurriculumAuthorityManifesto(
  inputs: CurriculumAuthorityInputs,
): string {
  return [
    buildCurriculumAuthorityPreamble(inputs),
    buildNonNegotiablesBlock(),
    buildPedagogicalRegisterNote(inputs),
  ].join("\n\n");
}

/**
 * The named section headers every server-emitted manifesto MUST
 * contain. The test in `server/tests/aiServerPrompt.test.ts` asserts
 * each one is present, and the same array is exported here so future
 * additions to the manifesto stay in sync between code + tests.
 *
 * If you add a new named section to
 * `client/src/lib/curriculumAuthorityPrompt.ts`, add the verbatim
 * header substring to this array.
 */
export const REQUIRED_MANIFESTO_HEADERS: ReadonlyArray<string> = Object.freeze([
  "CURRICULUM AUTHORITY",
  "NON-NEGOTIABLES",
  "PEDAGOGICAL REGISTER",
  "OUTPUT CONTRACT",
  "1. UK ENGLISH ONLY",
  "2. SI UNITS ONLY",
  "3. UK CONTEXTS ONLY",
  "4. NO COPYRIGHTED PAST-PAPER TEXT VERBATIM",
  "5. AWARDING-BODY COMMAND WORDS ONLY",
  "6. NO FABRICATED CODES",
]);
