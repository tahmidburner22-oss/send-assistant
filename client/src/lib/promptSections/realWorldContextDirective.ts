/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * promptSections/realWorldContextDirective.ts — FEAT-H3.
 *
 * Re-export of the buildContextDirective helper so the
 * structuredSystemSections in ai.ts can import from a consistent
 * promptSections/ location with the rest of the prompt blocks.
 */

export { buildContextDirective as buildRealWorldContextDirective } from "../realWorldContextLibrary";
